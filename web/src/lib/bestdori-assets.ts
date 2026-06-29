export type BestdoriRegion = "jp" | "cn" | "en" | "kr" | "tw";

const DEFAULT_REGION: BestdoriRegion = "jp";
const REGIONS: BestdoriRegion[] = ["jp", "cn", "en", "kr", "tw"];

function assetBase(region: BestdoriRegion = DEFAULT_REGION) {
  return `https://bestdori.com/assets/${region}`;
}

/** Q版小人 — 学校制服/私服 chibi（Bestdori 线上资源） */
export function getCharacterChibiUrls(characterId: number, regions: BestdoriRegion[] = REGIONS) {
  return regions.map(
    (region) => `${assetBase(region)}/chara/chibi/${characterId}_rip/normal.png`
  );
}

/** 卡面对应 LIVE 迷你立绘（SD） */
export function getCardLivesdUrl(sdResourceName: string, region: BestdoriRegion = DEFAULT_REGION) {
  return `${assetBase(region)}/characters/livesd/${sdResourceName}_rip/sdchara.png`;
}

export type Live2DModelParams = {
  characterId: number;
  costumeId?: number | null;
  assetBundleName?: string | null;
  regions?: BestdoriRegion[];
};

/**
 * Live2D model3.json 候选 URL（按优先级）。
 * Bestdori 部分服装仅有 buildData.asset；此处依次尝试常见公开路径。
 */
export function getLive2DModelCandidates({
  characterId,
  costumeId,
  assetBundleName,
  regions = REGIONS,
}: Live2DModelParams): string[] {
  const urls: string[] = [];

  for (const region of regions) {
    const base = `${assetBase(region)}/live2d/chara`;

    if (assetBundleName) {
      urls.push(`${base}/${assetBundleName}_rip/model.model3.json`);
      urls.push(`${base}/${assetBundleName}/model.model3.json`);
    }

    if (costumeId != null) {
      urls.push(`${base}/${characterId}_${costumeId}/model.model3.json`);
    }

    urls.push(`${base}/${characterId}_general/model.model3.json`);
  }

  return [...new Set(urls)];
}

export async function probeLive2DModelUrl(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "GET", mode: "cors" });
    if (!res.ok) return false;
    const contentType = res.headers.get("content-type") ?? "";
    if (contentType.includes("text/html")) return false;
    const text = (await res.text()).trimStart();
    return text.startsWith("{") && text.includes("FileReferences");
  } catch {
    return false;
  }
}

export async function resolveLive2DModelUrl(params: Live2DModelParams): Promise<string | null> {
  for (const url of getLive2DModelCandidates(params)) {
    if (await probeLive2DModelUrl(url)) return url;
  }
  return null;
}
