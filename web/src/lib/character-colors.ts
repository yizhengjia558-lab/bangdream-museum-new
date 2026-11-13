/** Official BanG Dream! character image colors (Bestdori / GBP wiki). */
export const CHARACTER_COLORS: Record<number, string> = {
  // Poppin'Party
  1: "#FF5522",
  2: "#0077DD",
  3: "#FF55BB",
  4: "#FFCC11",
  5: "#AA66DD",
  // Afterglow
  6: "#EE0022",
  7: "#00CCAA",
  8: "#FF9999",
  9: "#BB0033",
  10: "#FFEE88",
  // Hello, Happy World!
  11: "#FFEE22",
  12: "#AA33CC",
  13: "#FF9922",
  14: "#44DDFF",
  15: "#DD33CC",
  // Pastel＊Palettes
  16: "#FF88BB",
  17: "#55DDEE",
  18: "#FFEEAA",
  19: "#99DD88",
  20: "#DDBBFF",
  // Roselia
  21: "#881188",
  22: "#00AABB",
  23: "#DD2200",
  24: "#DD0088",
  25: "#BBBBBB",
  // Morfonica
  26: "#6677CC",
  27: "#EE6666",
  28: "#EE7744",
  29: "#EE7788",
  30: "#669988",
  // RAISE A SUILEN
  31: "#CC0000",
  32: "#AAEE22",
  33: "#EEBB44",
  34: "#FF99BB",
  35: "#00BBFF",
  // MyGO!!!!!
  36: "#77BBDD",
  37: "#FF8899",
  38: "#77DD77",
  39: "#FFDD88",
  40: "#7777AA",
};

export function getCharacterColor(characterId: number | null | undefined, fallback = "#e9435e") {
  if (characterId == null) return fallback;
  return CHARACTER_COLORS[characterId] ?? fallback;
}
