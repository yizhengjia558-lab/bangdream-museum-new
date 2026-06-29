import { getColorSync, getPaletteSync } from "colorthief";
import { assetUrl } from "@/lib/utils";
import {
  fallbackPalette,
  getCachedPalette,
  paletteFromRgb,
  setCachedPalette,
  type CardPalette,
  type Rgb,
} from "./card-palette";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));

    const url = assetUrl(src);
    if (url.startsWith("http")) {
      img.crossOrigin = "anonymous";
    }
    img.src = url;
  });
}

export async function extractCardPalette(imageSrc: string, accent = "#e9435e"): Promise<CardPalette> {
  const cached = getCachedPalette(imageSrc);
  if (cached) return cached;

  try {
    const img = await loadImage(imageSrc);
    const dominant = getColorSync(img)?.array() as Rgb | undefined;
    const paletteColors =
      getPaletteSync(img, { colorCount: 3, quality: 8 })?.map((color) => color.array() as Rgb) ?? [];

    if (!dominant) {
      throw new Error("No dominant color extracted");
    }

    const colors =
      paletteColors.length >= 3
        ? paletteColors
        : [dominant, paletteColors[0] ?? dominant, paletteColors[1] ?? dominant];

    const result = paletteFromRgb(colors, dominant);
    setCachedPalette(imageSrc, result);
    return result;
  } catch {
    const result = fallbackPalette(accent);
    setCachedPalette(imageSrc, result);
    return result;
  }
}
