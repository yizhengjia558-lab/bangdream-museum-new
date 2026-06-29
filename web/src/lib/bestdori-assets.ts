import { getBestdoriAssetProxyUrl } from "@/lib/live2d-proxy";

export type BestdoriRegion = "jp" | "cn" | "en" | "kr" | "tw";

const REGIONS: BestdoriRegion[] = ["jp", "cn", "en", "kr", "tw"];

function assetBase(region: BestdoriRegion) {
  return `https://bestdori.com/assets/${region}`;
}

/** 成员页默认 Q 版 / LIVE SD（初始卡面服装） */
export function getDefaultCharacterSdResourceName(characterId: number) {
  return `sd${String(characterId).padStart(3, "0")}001`;
}

function livesdAssetPath(sdResourceName: string, region: BestdoriRegion) {
  return `${region}/characters/livesd/${sdResourceName}_rip/sdchara.png`;
}

/** Bestdori LIVE SD 立绘直链 */
export function getLivesdImageDirectUrl(sdResourceName: string, region: BestdoriRegion = "jp") {
  return `${assetBase(region)}/characters/livesd/${sdResourceName}_rip/sdchara.png`;
}

/** Bestdori 官方 LIVE SD 立绘（优先同源代理，再直链） */
export function getLivesdImageUrl(sdResourceName: string, region: BestdoriRegion = "jp") {
  return getLivesdImageDirectUrl(sdResourceName, region);
}

/** 依次尝试：各区服代理 → 各区服直链 */
export function getLivesdImageCandidates(sdResourceName: string, regions: BestdoriRegion[] = REGIONS) {
  const urls: string[] = [];
  for (const region of regions) {
    urls.push(getBestdoriAssetProxyUrl(livesdAssetPath(sdResourceName, region)));
  }
  for (const region of regions) {
    urls.push(getLivesdImageDirectUrl(sdResourceName, region));
  }
  return [...new Set(urls)];
}

/** 校服 Q 版（成员页用 sd{id}001） */
export function getSchoolUniformSdCandidates(characterId: number, regions: BestdoriRegion[] = REGIONS) {
  return getLivesdImageCandidates(getDefaultCharacterSdResourceName(characterId), regions);
}

/** 角色 SD：优先卡面/指定资源，再回退到默认 sd{id}001 */
export function getCharacterSdCandidates(characterId: number, sdResourceName?: string | null) {
  const names = [...new Set([sdResourceName, getDefaultCharacterSdResourceName(characterId)].filter(Boolean))] as string[];
  return names.flatMap((name) => getLivesdImageCandidates(name));
}

/** Bestdori 官方 Live2D Viewer（图 3 动态立绘） */
export function getBestdoriLive2DViewerUrl(assetBundleName: string, region: BestdoriRegion = "jp") {
  return `https://bestdori.com/tool/live2d/asset/${region}/live2d/chara/${assetBundleName}`;
}

export function getLive2DBuildDataUrl(assetBundleName: string, region: BestdoriRegion = "jp") {
  return `${assetBase(region)}/live2d/chara/${assetBundleName}_rip/buildData.asset`;
}

/** 探测 Live2D 资源是否存在（buildData.asset） */
export async function probeLive2DAsset(assetBundleName: string): Promise<boolean> {
  for (const region of ["jp", "cn"] as BestdoriRegion[]) {
    try {
      const res = await fetch(getLive2DBuildDataUrl(assetBundleName, region), { method: "HEAD" });
      if (res.ok) return true;
    } catch {
      /* try next region */
    }
  }
  return false;
}

export async function resolveLive2DViewerUrl(assetBundleName: string | null | undefined): Promise<string | null> {
  if (!assetBundleName) return null;
  const ok = await probeLive2DAsset(assetBundleName);
  return ok ? getBestdoriLive2DViewerUrl(assetBundleName) : null;
}
