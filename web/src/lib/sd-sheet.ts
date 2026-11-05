import { getBestdoriAssetProxyUrl } from "@/lib/live2d-proxy";

/** Bestdori livesd/sdchara.png is a 2×2 sheet (1024→4×512 cells). */
export type SdPose = "tl" | "tr" | "bl" | "br";

export const SD_POSES: SdPose[] = ["tl", "tr", "bl", "br"];

/** Default thumbnail pose — bottom-left standing/expression cell. */
export const SD_DEFAULT_POSE: SdPose = "bl";

const POSE_CELL: Record<SdPose, readonly [number, number]> = {
  tl: [0, 0],
  tr: [1, 0],
  bl: [0, 1],
  br: [1, 1],
};

const ALPHA_MIN = 24;

function bestdoriAssetPath(src: string): string | null {
  const abs = src.match(/^https?:\/\/bestdori\.com\/assets\/(.+?)(?:\?|#|$)/i);
  if (abs) return abs[1];
  const proxied = src.match(/\/bestdori-assets\/(.+?)(?:\?|#|$)/i);
  if (proxied) return proxied[1];
  return null;
}

/** Prefer same-origin proxy, then CORS image proxy, then original URL. */
export function sheetUrlsForCanvas(src: string): string[] {
  const path = bestdoriAssetPath(src);
  const urls: string[] = [];
  if (path) {
    urls.push(getBestdoriAssetProxyUrl(path));
    const bare = `bestdori.com/assets/${path}`;
    urls.push(`https://images.weserv.nl/?url=${encodeURIComponent(bare)}&n=-1`);
    urls.push(`https://bestdori.com/assets/${path}`);
  }
  if (!urls.includes(src)) urls.push(src);
  return [...new Set(urls)];
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${url}`));
    img.src = url;
  });
}

async function loadSheetImage(src: string): Promise<HTMLImageElement> {
  const urls = sheetUrlsForCanvas(src);
  let lastError: unknown;
  for (const url of urls) {
    try {
      return await loadImage(url);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("SD sheet load failed");
}

function isOpaque(data: Uint8ClampedArray, index: number) {
  return data[index + 3] > ALPHA_MIN;
}

type Bounds = { x: number; y: number; w: number; h: number };

/**
 * Keep the largest opaque connected component (the main chibi).
 * Small edge fragments from neighboring sheet cells are discarded.
 */
function keepLargestBlob(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const image = ctx.getImageData(0, 0, width, height);
  const { data } = image;
  const label = new Int32Array(width * height);
  label.fill(-1);

  const sizes: number[] = [];
  const queue: number[] = [];
  let nextLabel = 0;

  const push = (x: number, y: number, id: number) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const i = y * width + x;
    if (label[i] !== -1) return;
    if (!isOpaque(data, i * 4)) return;
    label[i] = id;
    queue.push(i);
  };

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const start = y * width + x;
      if (label[start] !== -1) continue;
      if (!isOpaque(data, start * 4)) continue;

      const id = nextLabel;
      nextLabel += 1;
      sizes[id] = 0;
      label[start] = id;
      queue.length = 0;
      queue.push(start);

      while (queue.length) {
        const i = queue.pop()!;
        sizes[id] += 1;
        const cx = i % width;
        const cy = (i / width) | 0;
        push(cx + 1, cy, id);
        push(cx - 1, cy, id);
        push(cx, cy + 1, id);
        push(cx, cy - 1, id);
      }
    }
  }

  if (!sizes.length) return;

  let best = 0;
  for (let id = 1; id < sizes.length; id += 1) {
    if (sizes[id] > sizes[best]) best = id;
  }

  for (let i = 0; i < label.length; i += 1) {
    if (label[i] === best) continue;
    const p = i * 4;
    if (data[p + 3] === 0) continue;
    data[p] = 0;
    data[p + 1] = 0;
    data[p + 2] = 0;
    data[p + 3] = 0;
  }

  ctx.putImageData(image, 0, 0);
}

function opaqueBounds(ctx: CanvasRenderingContext2D, width: number, height: number): Bounds | null {
  const { data } = ctx.getImageData(0, 0, width, height);
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (!isOpaque(data, (y * width + x) * 4)) continue;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }

  if (maxX < minX || maxY < minY) return null;
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

function expandBounds(bounds: Bounds, margin: number, width: number, height: number): Bounds {
  const x = Math.max(0, bounds.x - margin);
  const y = Math.max(0, bounds.y - margin);
  const right = Math.min(width, bounds.x + bounds.w + margin);
  const bottom = Math.min(height, bounds.y + bounds.h + margin);
  return { x, y, w: right - x, h: bottom - y };
}

export type ExtractedSdPose = {
  pose: SdPose;
  dataUrl: string;
};

function extractPoseFromImage(img: HTMLImageElement, pose: SdPose, outSize: number): ExtractedSdPose {
  const cellW = Math.floor(img.naturalWidth / 2);
  const cellH = Math.floor(img.naturalHeight / 2);
  const [col, row] = POSE_CELL[pose];

  const cell = document.createElement("canvas");
  cell.width = cellW;
  cell.height = cellH;
  const cellCtx = cell.getContext("2d", { willReadFrequently: true });
  if (!cellCtx) throw new Error("Canvas unsupported");

  cellCtx.clearRect(0, 0, cellW, cellH);
  cellCtx.drawImage(img, col * cellW, row * cellH, cellW, cellH, 0, 0, cellW, cellH);
  keepLargestBlob(cellCtx, cellW, cellH);

  const rawBounds = opaqueBounds(cellCtx, cellW, cellH);
  const out = document.createElement("canvas");
  out.width = outSize;
  out.height = outSize;
  const outCtx = out.getContext("2d");
  if (!outCtx) throw new Error("Canvas unsupported");
  outCtx.clearRect(0, 0, outSize, outSize);

  if (!rawBounds) return { pose, dataUrl: out.toDataURL("image/png") };

  // Keep a little outline margin so white strokes aren't shaved off.
  const margin = Math.max(4, Math.round(Math.max(rawBounds.w, rawBounds.h) * 0.03));
  const bbox = expandBounds(rawBounds, margin, cellW, cellH);

  // ~6% pad → slightly larger chibi while still fully inside the square.
  const pad = 0.06;
  const avail = outSize * (1 - pad * 2);
  const fit = Math.min(avail / bbox.w, avail / bbox.h);
  const dw = bbox.w * fit;
  const dh = bbox.h * fit;
  const dx = (outSize - dw) / 2;
  const dy = (outSize - dh) / 2;

  outCtx.imageSmoothingEnabled = true;
  outCtx.imageSmoothingQuality = "high";
  outCtx.drawImage(cell, bbox.x, bbox.y, bbox.w, bbox.h, dx, dy, dw, dh);

  return { pose, dataUrl: out.toDataURL("image/png") };
}

export async function extractAllSdPoses(sheetSrc: string, poses: SdPose[] = SD_POSES, outSize = 720) {
  const img = await loadSheetImage(sheetSrc);
  return poses.map((pose) => extractPoseFromImage(img, pose, outSize));
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const anchor = document.createElement("a");
  anchor.href = dataUrl;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}
