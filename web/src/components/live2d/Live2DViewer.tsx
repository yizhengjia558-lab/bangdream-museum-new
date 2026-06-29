"use client";

import { useEffect, useRef, useState } from "react";
import { createBestdoriLive2DModelJson, pickIdleMotionKey } from "@/lib/bestdori-live2d";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    Live2D?: unknown;
  }
}

const LIVE2D_CORE_SRC =
  "https://cdn.jsdelivr.net/gh/dylanNew/live2d/webgl/Live2D/lib/live2d.min.js";

let live2dCorePromise: Promise<void> | null = null;

function loadLive2DCore() {
  if (typeof window === "undefined") return Promise.reject(new Error("No window"));
  if (window.Live2D) return Promise.resolve();
  if (!live2dCorePromise) {
    live2dCorePromise = new Promise<void>((resolve, reject) => {
      const existing = document.querySelector(`script[src="${LIVE2D_CORE_SRC}"]`);
      if (existing) {
        existing.addEventListener("load", () => resolve());
        existing.addEventListener("error", () => reject(new Error("Live2D core failed")));
        return;
      }
      const script = document.createElement("script");
      script.src = LIVE2D_CORE_SRC;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Live2D core failed"));
      document.head.appendChild(script);
    });
  }
  return live2dCorePromise;
}

function fitModelContain(
  model: import("pixi-live2d-display/cubism2").Live2DModel,
  stageWidth: number,
  stageHeight: number,
  padding = 0.92
) {
  model.scale.set(1);
  const bounds = model.getLocalBounds();
  if (!bounds.width || !bounds.height) return;

  const scale = Math.min((stageWidth / bounds.width) * padding, (stageHeight / bounds.height) * padding);
  model.scale.set(scale);
  model.x = stageWidth / 2 - (bounds.x + bounds.width / 2) * scale;
  model.y = stageHeight / 2 - (bounds.y + bounds.height / 2) * scale;
}

export function Live2DViewer({
  assetBundleName,
  className,
  onError,
}: {
  assetBundleName: string;
  className?: string;
  onError?: () => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");

  useEffect(() => {
    let cancelled = false;
    let app: import("pixi.js").Application | null = null;
    let model: import("pixi-live2d-display/cubism2").Live2DModel | null = null;
    let revokeModelJson: (() => void) | null = null;
    let resizeObserver: ResizeObserver | null = null;

    async function mount() {
      const host = hostRef.current;
      if (!host) return;

      try {
        await loadLive2DCore();
        const { modelJsonUrl, revoke } = await createBestdoriLive2DModelJson(assetBundleName);
        revokeModelJson = revoke;

        const PIXI = await import("pixi.js");
        const { Live2DModel } = await import("pixi-live2d-display/cubism2");
        Live2DModel.registerTicker(PIXI.Ticker);

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const width = host.clientWidth || 220;
        const height = host.clientHeight || 240;

        app = new PIXI.Application({
          backgroundAlpha: 0,
          antialias: true,
          width,
          height,
          resolution: dpr,
          autoDensity: true,
        });

        const canvas = app.view as HTMLCanvasElement;
        canvas.style.position = "absolute";
        canvas.style.inset = "0";
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.style.display = "block";
        canvas.style.touchAction = "none";

        host.replaceChildren();
        host.appendChild(canvas);

        model = await Live2DModel.from(modelJsonUrl, { autoInteract: true });

        const motionGroups = model.internalModel.motionManager.definitions ?? {};
        const idleKey = pickIdleMotionKey(Object.keys(motionGroups));
        if (idleKey) model.motion(idleKey);

        const refit = () => {
          if (!app || !model || !host) return;
          const w = host.clientWidth || width;
          const h = host.clientHeight || height;
          if (w <= 0 || h <= 0) return;
          app.renderer.resize(w, h);
          fitModelContain(model, w, h);
        };

        refit();
        app.stage.addChild(model);

        app.stage.interactive = true;
        app.stage.hitArea = app.screen;
        app.stage.on("pointermove", (event) => {
          model?.focus(event.global.x, event.global.y);
        });

        model.on("hit", (hitAreas: string[]) => {
          const motionGroups = model?.internalModel.motionManager.definitions ?? {};
          const keys = Object.keys(motionGroups);
          const tapKey =
            keys.find((key) => /tap/i.test(key)) ??
            (hitAreas.includes("body") ? keys.find((key) => /body/i.test(key)) : undefined) ??
            keys.find((key) => /idle/i.test(key));
          if (tapKey) model?.motion(tapKey, undefined, 2);
        });

        resizeObserver = new ResizeObserver(refit);
        resizeObserver.observe(host);

        if (!cancelled) setStatus("ready");
      } catch {
        if (!cancelled) {
          setStatus("failed");
          onError?.();
        }
      }
    }

    setStatus("loading");
    mount();

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      model?.destroy();
      app?.destroy(true, { children: true, texture: true, baseTexture: true });
      revokeModelJson?.();
      if (hostRef.current) hostRef.current.replaceChildren();
    };
  }, [assetBundleName, onError]);

  if (status === "failed") return null;

  return (
    <div className={cn("live2d-viewer", className)}>
      {status === "loading" ? <div className="live2d-viewer__loading" aria-hidden /> : null}
      <div ref={hostRef} className="live2d-viewer__canvas-host" />
    </div>
  );
}
