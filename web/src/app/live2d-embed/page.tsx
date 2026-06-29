"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Live2DViewer } from "@/components/live2d/Live2DViewer";

function Live2DEmbedInner() {
  const params = useSearchParams();
  const bundle = params.get("bundle")?.trim() ?? "";
  if (!bundle) return null;

  return <Live2DViewer assetBundleName={bundle} className="live2d-embed-page__viewer" />;
}

export default function Live2DEmbedPage() {
  return (
    <div className="live2d-embed-page">
      <Suspense fallback={null}>
        <Live2DEmbedInner />
      </Suspense>
    </div>
  );
}
