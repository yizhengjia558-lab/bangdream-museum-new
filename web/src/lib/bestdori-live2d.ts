import type { BestdoriRegion } from "@/lib/bestdori-assets";
import { getLive2DBundleAssetProxyUrl, getLive2DBuildDataProxyUrl } from "@/lib/live2d-proxy";

type BundleRef = {
  bundleName: string;
  fileName: string;
};

type BuildDataBase = {
  model: BundleRef;
  physics?: BundleRef;
  textures: BundleRef[];
  motions?: BundleRef[];
  expressions?: BundleRef[];
};

type Cubism2ModelJson = {
  version: string;
  model: string;
  textures: string[];
  physics?: string;
  motions: Record<string, Array<{ file: string }>>;
  expressions: Array<{ name: string; file: string }>;
  layout: { width: number; center_x: number; center_y: number };
  hit_areas_custom: Record<string, number[]>;
};

function motionKeyFromFileName(fileName: string) {
  return fileName.replace(/\.(mtn|motion3)\.bytes$/i, "").replace(/\.(mtn|motion3)$/i, "");
}

function expressionKeyFromFileName(fileName: string) {
  return fileName.replace(/\.exp\.json$/i, "");
}

function refToProxyUrl(ref: BundleRef, region: BestdoriRegion) {
  return getLive2DBundleAssetProxyUrl(ref.bundleName, ref.fileName, region);
}

async function fetchBuildData(assetBundleName: string, region: BestdoriRegion): Promise<BuildDataBase> {
  const res = await fetch(getLive2DBuildDataProxyUrl(assetBundleName, region));
  if (!res.ok) throw new Error(`buildData ${res.status}`);
  const contentType = res.headers.get("Content-Type") ?? "";
  const text = await res.text();
  if (contentType.includes("text/html") || !text.trimStart().startsWith("{")) {
    throw new Error("buildData invalid");
  }
  const parsed = JSON.parse(text) as { Base?: BuildDataBase };
  if (!parsed.Base?.model) throw new Error("buildData missing model");
  return parsed.Base;
}

export async function createBestdoriLive2DModelJson(
  assetBundleName: string,
  region: BestdoriRegion = "jp"
): Promise<{ modelJsonUrl: string; revoke: () => void }> {
  const base = await fetchBuildData(assetBundleName, region);

  const motions: Record<string, Array<{ file: string }>> = {};
  for (const motion of base.motions ?? []) {
    const key = motionKeyFromFileName(motion.fileName);
    motions[key] = [{ file: refToProxyUrl(motion, region) }];
  }

  const expressions = (base.expressions ?? []).map((expression) => ({
    name: expressionKeyFromFileName(expression.fileName),
    file: refToProxyUrl(expression, region),
  }));

  const modelJson: Cubism2ModelJson = {
    version: "Sample 1.0.0",
    model: refToProxyUrl(base.model, region),
    textures: base.textures.map((texture) => refToProxyUrl(texture, region)),
    motions,
    expressions,
    layout: { width: 2, center_x: 0, center_y: 0 },
    hit_areas_custom: {
      head_x: [-0.25, 1],
      head_y: [0.25, 0.2],
      body_x: [-0.3, 0.2],
      body_y: [0.3, -1.9],
    },
  };

  if (base.physics) {
    modelJson.physics = refToProxyUrl(base.physics, region);
  }

  const blob = new Blob([JSON.stringify(modelJson)], { type: "application/json" });
  const modelJsonUrl = URL.createObjectURL(blob);
  return {
    modelJsonUrl,
    revoke: () => URL.revokeObjectURL(modelJsonUrl),
  };
}

export function pickIdleMotionKey(motionKeys: string[]) {
  return (
    motionKeys.find((key) => /^idle/i.test(key)) ??
    motionKeys.find((key) => /idle/i.test(key)) ??
    motionKeys[0] ??
    null
  );
}
