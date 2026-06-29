"use client";

import { cn } from "@/lib/utils";

function getLocalLive2DEmbedUrl(assetBundleName: string) {
  const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}${basePath}/live2d-embed/?bundle=${encodeURIComponent(assetBundleName)}`;
}

/** Same-origin Live2D embed — full canvas, no Bestdori site chrome. */
export function BestdoriLive2DEmbed({
  assetBundleName,
  className,
}: {
  assetBundleName: string;
  className?: string;
}) {
  return (
    <div className={cn("bestdori-live2d-embed", className)}>
      <iframe
        src={getLocalLive2DEmbedUrl(assetBundleName)}
        title="Live2D"
        className="bestdori-live2d-embed__iframe"
        loading="lazy"
        referrerPolicy="same-origin"
      />
    </div>
  );
}
