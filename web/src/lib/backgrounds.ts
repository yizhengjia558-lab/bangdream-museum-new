/** Official-style splash / homebanner CG from Bestdori CDN */
export const HERO_CG_BACKGROUNDS = [
  "https://bestdori.com/assets/jp/homebanner/res007017_rip.png",
  "https://bestdori.com/assets/jp/homebanner/res007016_rip.png",
  "https://bestdori.com/assets/jp/homebanner/res006018_rip.png",
  "https://bestdori.com/assets/jp/homebanner/res005018_rip.png",
  "https://bestdori.com/assets/jp/homebanner/res004012_rip.png",
  "https://bestdori.com/assets/jp/homebanner/res003012_rip.png",
];

export function pickHeroBackground(seed = 0) {
  return HERO_CG_BACKGROUNDS[seed % HERO_CG_BACKGROUNDS.length];
}

export function pickRandomHeroBackground() {
  return HERO_CG_BACKGROUNDS[Math.floor(Math.random() * HERO_CG_BACKGROUNDS.length)];
}
