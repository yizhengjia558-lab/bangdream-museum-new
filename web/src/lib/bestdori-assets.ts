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

/** 依次尝试：各区服直链 → images.weserv 镜像 → 各区服代理 */
export function getLivesdImageCandidates(sdResourceName: string, regions: BestdoriRegion[] = REGIONS) {
  const urls: string[] = [];
  for (const region of regions) {
    urls.push(getLivesdImageDirectUrl(sdResourceName, region));
  }
  for (const region of regions) {
    const bare = `bestdori.com/assets/${livesdAssetPath(sdResourceName, region)}`;
    urls.push(`https://images.weserv.nl/?url=${encodeURIComponent(bare)}&n=-1`);
  }
  for (const region of regions) {
    urls.push(getBestdoriAssetProxyUrl(livesdAssetPath(sdResourceName, region)));
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

/**
 * Pick CDN/tool region for a Live2D bundle.
 * Bilibili collab costumes (`bili_*`) are on CN; JP tool page shows "Not available".
 */
export function preferLive2DRegion(assetBundleName: string): BestdoriRegion {
  if (/^bili_/i.test(assetBundleName)) return "cn";
  return "jp";
}

/** Bestdori 官方 Live2D Viewer（图 3 动态立绘） */
export function getBestdoriLive2DViewerUrl(assetBundleName: string, region?: BestdoriRegion) {
  const resolved = region ?? preferLive2DRegion(assetBundleName);
  return `https://bestdori.com/tool/live2d/asset/${resolved}/live2d/chara/${assetBundleName}`;
}

export function getLive2DBuildDataUrl(assetBundleName: string, region: BestdoriRegion = "jp") {
  return `${assetBase(region)}/live2d/chara/${assetBundleName}_rip/buildData.asset`;
}

async function buildDataLooksValid(assetBundleName: string, region: BestdoriRegion) {
  try {
    const res = await fetch(getLive2DBuildDataUrl(assetBundleName, region), {
      headers: { Accept: "application/octet-stream,application/json,*/*" },
    });
    if (!res.ok) return false;
    const contentType = res.headers.get("Content-Type") ?? "";
    // Bestdori SPA returns 200 text/html for missing JP assets — treat as absent.
    if (contentType.includes("text/html")) return false;
    const text = (await res.text()).trimStart();
    return text.startsWith("{") && text.includes('"Base"');
  } catch {
    return false;
  }
}

/** 探测 Live2D 资源是否存在（buildData.asset，校验真实 JSON） */
export async function probeLive2DAsset(assetBundleName: string): Promise<boolean> {
  const preferred = preferLive2DRegion(assetBundleName);
  const regions = [preferred, ...(["jp", "cn"] as BestdoriRegion[]).filter((r) => r !== preferred)];
  for (const region of regions) {
    if (await buildDataLooksValid(assetBundleName, region)) return true;
  }
  return false;
}

export async function resolveLive2DViewerUrl(assetBundleName: string | null | undefined): Promise<string | null> {
  if (!assetBundleName) return null;
  const preferred = preferLive2DRegion(assetBundleName);
  const regions = [preferred, ...(["jp", "cn"] as BestdoriRegion[]).filter((r) => r !== preferred)];
  for (const region of regions) {
    if (await buildDataLooksValid(assetBundleName, region)) {
      return getBestdoriLive2DViewerUrl(assetBundleName, region);
    }
  }
  return null;
}

/**
 * Map LIVE SD id (`sd001062`, `bili_sd001001`) → resourceset id (`res001062`).
 * Official site member strips use `characters/resourceset/{res}_rip/trim_*.png`.
 */
export function resourceSetNameFromSd(sdResourceName: string) {
  return sdResourceName.replace(/sd/i, "res");
}

export type CardTrimVariant = "after_training" | "normal";

/** Relative Bestdori asset path for a card character trim (cutout). */
export function getCardTrimAssetPath(
  sdResourceName: string,
  variant: CardTrimVariant = "after_training",
  region: BestdoriRegion = "jp"
) {
  const res = resourceSetNameFromSd(sdResourceName);
  const file = variant === "after_training" ? "trim_after_training.png" : "trim_normal.png";
  return `${region}/characters/resourceset/${res}_rip/${file}`;
}

/** Direct CDN URL for card trim cutouts (safe for `<img>` / band strips). */
export function getCardTrimDirectUrl(
  sdResourceName: string,
  variant: CardTrimVariant = "after_training",
  region: BestdoriRegion = "jp"
) {
  return `${assetBase(region)}/characters/resourceset/${resourceSetNameFromSd(sdResourceName)}_rip/${
    variant === "after_training" ? "trim_after_training.png" : "trim_normal.png"
  }`;
}

/** Same-origin proxy URL for card trim cutouts. */
export function getCardTrimProxyUrl(
  sdResourceName: string,
  variant: CardTrimVariant = "after_training",
  region: BestdoriRegion = "jp"
) {
  return getBestdoriAssetProxyUrl(getCardTrimAssetPath(sdResourceName, variant, region));
}

/** Jacket package folder id for a song (Bestdori musicjacket{N}_rip). */
export function songJacketPackageId(songId: number) {
  if (songId === 13 || songId === 40) return 30;
  return Math.ceil(songId / 10) * 10;
}

/** Relative Bestdori path for a song album jacket. */
export function getSongJacketAssetPath(
  songId: number,
  jacketName: string,
  region: BestdoriRegion = "jp"
) {
  const pkg = songJacketPackageId(songId);
  const name = jacketName.toLowerCase();
  return `${region}/musicjacket/musicjacket${pkg}_rip/assets-star-forassetbundle-startapp-musicjacket-musicjacket${pkg}-${name}-jacket.png`;
}

/** Direct CDN URL for song jacket (album cover). */
export function getSongJacketDirectUrl(
  songId: number,
  jacketName: string,
  region: BestdoriRegion = "jp"
) {
  const pkg = songJacketPackageId(songId);
  const name = jacketName.toLowerCase();
  return `${assetBase(region)}/musicjacket/musicjacket${pkg}_rip/assets-star-forassetbundle-startapp-musicjacket-musicjacket${pkg}-${name}-jacket.png`;
}

/** Same-origin proxy URL for song jackets. */
export function getSongJacketProxyUrl(
  songId: number,
  jacketName: string,
  region: BestdoriRegion = "jp"
) {
  return getBestdoriAssetProxyUrl(getSongJacketAssetPath(songId, jacketName, region));
}

export type BandLogoSize = "L" | "S";

/** Official Bestdori band wordmark (`logoL.png` / `logoS.png`). */
export function getBandLogoUrl(
  logoId: string,
  size: BandLogoSize = "L",
  region: BestdoriRegion = "jp"
) {
  const file = size === "S" ? "logoS.png" : "logoL.png";
  return `${assetBase(region)}/band/logo/${logoId}_rip/${file}`;
}

/** Soft catch-copy graphic used as a band pattern accent. */
export function getBandCatchCopyUrl(logoId: string, region: BestdoriRegion = "jp") {
  return `${assetBase(region)}/band/catchcopy/${logoId}_rip/catchCopy_${logoId}.png`;
}
