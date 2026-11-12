"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { getCostumeStill, setCostumeStill } from "@/lib/costume-still-cache";

const Live2DViewer = dynamic(
  () => import("@/components/live2d/Live2DViewer").then((m) => m.Live2DViewer),
  { ssr: false }
);

type Job = {
  bundle: string;
  resolve: (url: string | null) => void;
};

const queue: Job[] = [];
const waiters = new Map<string, Array<(url: string | null) => void>>();
const pumpListeners = new Set<() => void>();

function emitPump() {
  pumpListeners.forEach((fn) => fn());
}

/** Ask the shared offscreen capturer for a still. Never mounts Live2D in the tile itself. */
export function requestCostumeStill(bundle: string): Promise<string | null> {
  const cached = getCostumeStill(bundle);
  if (cached) return Promise.resolve(cached);

  return new Promise((resolve) => {
    const existing = waiters.get(bundle);
    if (existing) {
      existing.push(resolve);
      return;
    }
    waiters.set(bundle, [resolve]);
    queue.push({
      bundle,
      resolve: (url) => {
        const list = waiters.get(bundle) ?? [];
        waiters.delete(bundle);
        list.forEach((fn) => fn(url));
      },
    });
    emitPump();
  });
}

/**
 * Single shared Live2D still capturer for the costumes page.
 * Keeps at most one WebGL model alive for snapshots.
 */
export function CostumeStillCaptureHost() {
  const [job, setJob] = useState<Job | null>(null);

  useEffect(() => {
    const takeNext = () => {
      setJob((current) => {
        if (current) return current;
        while (queue.length) {
          const next = queue.shift()!;
          const cached = getCostumeStill(next.bundle);
          if (cached) {
            next.resolve(cached);
            continue;
          }
          return next;
        }
        return null;
      });
    };

    pumpListeners.add(takeNext);
    takeNext();
    return () => {
      pumpListeners.delete(takeNext);
    };
  }, []);

  const finish = (url: string | null) => {
    setJob((current) => {
      if (!current) return null;
      if (url) setCostumeStill(current.bundle, url);
      current.resolve(url);
      queueMicrotask(emitPump);
      return null;
    });
  };

  if (!job) return null;

  return (
    <div className="costume-still-capture-host" aria-hidden>
      <Live2DViewer
        key={job.bundle}
        assetBundleName={job.bundle}
        motionProfile="still"
        className="costume-still-capture-host__viewer"
        onStillFrame={(dataUrl) => finish(dataUrl)}
        onError={() => finish(null)}
      />
    </div>
  );
}
