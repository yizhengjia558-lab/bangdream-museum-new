"use client";

import { useEffect, useRef, useState } from "react";
import { CharacterChibiAvatar } from "@/components/characters/CharacterChibiAvatar";
import { AssetImage } from "@/components/ui/AssetImage";
import {
  getCardLivesdUrl,
  resolveLive2DModelUrl,
  type BestdoriRegion,
} from "@/lib/bestdori-assets";

declare global {
  interface Window {
    Live2DCubismCore?: unknown;
  }
}

const CUBISM_CORE_SRC = "https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js";

let cubismCorePromise: Promise<void> | null = null;

function loadCubismCore() {
  if (typeof window === "undefined") return Promise.reject(new Error("No window"));
  if (window.Live2DCubismCore) return Promise.resolve();
  if (!cubismCorePromise) {
    cubismCorePromise = new Promise<void>((resolve, reject) => {
      const existing = document.querySelector(`script[src="${CUBISM_CORE_SRC}"]`);
      if (existing) {
        existing.addEventListener("load", () => resolve());
        existing.addEventListener("error", () => reject(new Error("Cubism core failed")));
        return;
      }
      const script = document.createElement("script");
      script.src = CUBISM_CORE_SRC;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Cubism core failed"));
      document.head.appendChild(script);
    });
  }
  return cubismCorePromise;
}

function CardLive2DFallback({
  characterId,
  sdResourceName,
  cardImageSrc,
}: {
  characterId: number;
  sdResourceName?: string | null;
  cardImageSrc: string;
}) {
  const [sdFailed, setSdFailed] = useState(false);
  const sdUrl = sdResourceName ? getCardLivesdUrl(sdResourceName) : null;

  if (sdUrl && !sdFailed) {
    return (
      <div className="card-live2d-fallback">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={sdUrl}
          alt=""
          className="card-live2d-fallback__sd"
          crossOrigin="anonymous"
          onError={() => setSdFailed(true)}
        />
      </div>
    );
  }

  return (
    <div className="card-live2d-fallback">
      <CharacterChibiAvatar characterId={characterId} size="lg" />
      <div className="card-live2d-fallback__card">
        <AssetImage src={cardImageSrc} alt="" className="h-full w-full object-contain" />
      </div>
    </div>
  );
}

export function CardLive2DViewerInner({
  characterId,
  costumeId,
  live2dAssetBundleName,
  sdResourceName,
  cardImageSrc,
}: {
  characterId: number;
  costumeId?: number | null;
  live2dAssetBundleName?: string | null;
  sdResourceName?: string | null;
  cardImageSrc: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");

  useEffect(() => {
    let cancelled = false;
    let app: import("pixi.js").Application | null = null;
    let model: import("pixi-live2d-display/cubism4").Live2DModel | null = null;

    async function mount() {
      const host = hostRef.current;
      if (!host) return;

      try {
        const modelUrl = await resolveLive2DModelUrl({
          characterId,
          costumeId,
          assetBundleName: live2dAssetBundleName,
          regions: ["jp", "cn"] as BestdoriRegion[],
        });

        if (!modelUrl) throw new Error("Live2D model not found");

        await loadCubismCore();

        const PIXI = await import("pixi.js");
        const { Live2DModel } = await import("pixi-live2d-display/cubism4");

        Live2DModel.registerTicker(PIXI.Ticker);

        app = new PIXI.Application({
          backgroundAlpha: 0,
          antialias: true,
          resizeTo: host,
        });

        host.replaceChildren();
        host.appendChild(app.view as HTMLCanvasElement);

        model = await Live2DModel.from(modelUrl, { autoInteract: false });

        const fitModel = () => {
          if (!app || !model) return;
          const pad = 0.92;
          const scale = Math.min((app.screen.width / model.width) * pad, (app.screen.height / model.height) * pad);
          model.scale.set(scale);
          model.anchor.set(0.5, 1);
          model.x = app.screen.width / 2;
          model.y = app.screen.height * 0.98;
        };

        fitModel();
        app.stage.addChild(model);

        const motionGroups = model.internalModel.motionManager.definitions ?? {};
        const idleKey = Object.keys(motionGroups).find((k) => k.toLowerCase() === "idle") ?? Object.keys(motionGroups)[0];
        if (idleKey) {
          model.motion(idleKey);
        }

        app.stage.eventMode = "static";
        app.stage.hitArea = app.screen;
        app.stage.on("pointermove", (event) => {
          model?.focus(event.global.x, event.global.y);
        });

        app.renderer.on("resize", fitModel);

        if (!cancelled) setStatus("ready");
      } catch {
        if (!cancelled) setStatus("failed");
      }
    }

    setStatus("loading");
    mount();

    return () => {
      cancelled = true;
      model?.destroy();
      app?.destroy(true, { children: true, texture: true, baseTexture: true });
      if (hostRef.current) hostRef.current.replaceChildren();
    };
  }, [characterId, costumeId, live2dAssetBundleName, sdResourceName, cardImageSrc]);

  if (status === "failed") {
    return (
      <CardLive2DFallback
        characterId={characterId}
        sdResourceName={sdResourceName}
        cardImageSrc={cardImageSrc}
      />
    );
  }

  return (
    <div className="card-live2d-stage">
      {status === "loading" ? <div className="card-live2d-loading" aria-hidden /> : null}
      <div ref={hostRef} className="card-live2d-canvas-host" />
    </div>
  );
}
