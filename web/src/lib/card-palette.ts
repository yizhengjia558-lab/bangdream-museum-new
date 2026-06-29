export type Rgb = [number, number, number];

export type CardPalette = {
  colors: [string, string, string];
  gradient: string;
};

const paletteCache = new Map<string, CardPalette>();

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function rgbToCss([r, g, b]: Rgb) {
  return `rgb(${r}, ${g}, ${b})`;
}

/** Darken and cap saturation/lightness so text stays readable on backgrounds. */
export function sanitizeBackgroundRgb([r, g, b]: Rgb): Rgb {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;

  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
        break;
      case gn:
        h = ((bn - rn) / d + 2) / 6;
        break;
      default:
        h = ((rn - gn) / d + 4) / 6;
        break;
    }
  }

  const safeL = clamp(l * 0.72, 0.12, 0.38);
  const safeS = clamp(s * 0.82, 0.22, 0.68);

  const hue2rgb = (p: number, q: number, t: number) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };

  let rr: number;
  let gg: number;
  let bb: number;

  if (safeS === 0) {
    rr = gg = bb = safeL;
  } else {
    const q = safeL < 0.5 ? safeL * (1 + safeS) : safeL + safeS - safeL * safeS;
    const p = 2 * safeL - q;
    rr = hue2rgb(p, q, h + 1 / 3);
    gg = hue2rgb(p, q, h);
    bb = hue2rgb(p, q, h - 1 / 3);
  }

  return [Math.round(rr * 255), Math.round(gg * 255), Math.round(bb * 255)];
}

export function buildPaletteGradient(c1: string, c2: string, c3: string) {
  return [
    `radial-gradient(ellipse 95% 75% at 12% 18%, color-mix(in srgb, ${c1} 72%, transparent) 0%, transparent 58%)`,
    `radial-gradient(ellipse 85% 70% at 88% 82%, color-mix(in srgb, ${c3} 65%, transparent) 0%, transparent 52%)`,
    `linear-gradient(145deg, ${c1} 0%, ${c2} 46%, ${c3} 100%)`,
  ].join(", ");
}

export function paletteFromRgb(colors: Rgb[], fallback: Rgb): CardPalette {
  const source = colors.length >= 3 ? colors.slice(0, 3) : [colors[0] ?? fallback, colors[1] ?? fallback, colors[2] ?? fallback];
  const safe = source.map((color) => sanitizeBackgroundRgb(color)) as [Rgb, Rgb, Rgb];
  const cssColors = safe.map(rgbToCss) as [string, string, string];
  return {
    colors: cssColors,
    gradient: buildPaletteGradient(cssColors[0], cssColors[1], cssColors[2]),
  };
}

export function fallbackPalette(accent: string): CardPalette {
  return paletteFromRgb(
    [
      [26, 16, 32],
      [233, 67, 94],
      [13, 16, 32],
    ],
    [26, 16, 32]
  );
}

export function getCachedPalette(src: string) {
  return paletteCache.get(src);
}

export function setCachedPalette(src: string, palette: CardPalette) {
  paletteCache.set(src, palette);
}
