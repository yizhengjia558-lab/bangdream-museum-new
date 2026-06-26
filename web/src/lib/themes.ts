export type BandSlug =
  | "poppin-party"
  | "afterglow"
  | "pastel-palettes"
  | "roselia"
  | "hello-happy-world"
  | "morfonica"
  | "raise-a-suilen";

export interface BandTheme {
  slug: BandSlug;
  id: string;
  name: string;
  nameJp: string;
  /** Short English slogan for showcase layouts */
  sloganEn: string;
  /** Uppercase watermark text for card backgrounds */
  bgTitle: string;
  tagline: string;
  description: string;
  folder: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    glow: string;
    bg: string;
    gradient: string;
  };
  keywords: string[];
  songs: { title: string; titleJp: string }[];
}

export const BAND_THEMES: BandTheme[] = [
  {
    slug: "poppin-party",
    id: "Poppin'Party",
    name: "Poppin'Party",
    nameJp: "ポッピンパーティ！",
    sloganEn: "Shining Through the World",
    bgTitle: "POPPIN'PARTY",
    tagline: "キラキラドキドキ 世界を照らす",
    description:
      "以户山香澄为中心，在 Live House「CiRCLE」相遇的五人少女乐队。用「Pop」与「Party」将日常化为闪耀舞台，传递「キラキラドキドキ」的心跳。",
    folder: "PoppinParty",
    colors: {
      primary: "#FF5522",
      secondary: "#FFB347",
      accent: "#FFE066",
      glow: "rgba(255, 85, 34, 0.45)",
      bg: "#1a0f0a",
      gradient: "linear-gradient(135deg, #FF5522 0%, #FFB347 50%, #FFE066 100%)",
    },
    keywords: ["青春", "校园", "星星", "CiRCLE"],
    songs: [
      { title: "Tokimeki Experience!", titleJp: "トキメキエクスペリエンス！" },
      { title: "Kizuna Music♪", titleJp: "キズナミュージック♪" },
    ],
  },
  {
    slug: "afterglow",
    id: "Afterglow",
    name: "Afterglow",
    nameJp: "アフターグロウ",
    sloganEn: "Voices Beyond the Sunset",
    bgTitle: "AFTERGLOW",
    tagline: "夕焼けの向こう、本音を歌う",
    description:
      " childhood friends who grew up together in the same town. Their music carries the heat of sunset streets and unspoken bonds.",
    folder: "Afterglow",
    colors: {
      primary: "#E63946",
      secondary: "#FF6B35",
      accent: "#F4A261",
      glow: "rgba(230, 57, 70, 0.4)",
      bg: "#140808",
      gradient: "linear-gradient(135deg, #E63946 0%, #FF6B35 50%, #2D1B0E 100%)",
    },
    keywords: ["夕阳", "街头", "羁绊", "放学后"],
    songs: [
      { title: "That Is How I Roll!", titleJp: "That Is How I Roll!" },
      { title: "ON YOUR MARK", titleJp: "ON YOUR MARK" },
    ],
  },
  {
    slug: "pastel-palettes",
    id: "Pastel＊Palettes",
    name: "Pastel＊Palettes",
    nameJp: "パステル＊パレttes",
    sloganEn: "Sparkle on Stage",
    bgTitle: "PASTEL PALETTES",
    tagline: "偶像之光，在舞台上绽放",
    description:
      "由偶像事务所策划打造的五人偶像乐队。在镜头与舞台之间，她们寻找「真正的偶像」与真实的笑容。",
    folder: "PastelPalettes",
    colors: {
      primary: "#FF69B4",
      secondary: "#FFB6C1",
      accent: "#E0BBFF",
      glow: "rgba(255, 105, 180, 0.4)",
      bg: "#120810",
      gradient: "linear-gradient(135deg, #FF69B4 0%, #FFB6C1 45%, #E0BBFF 100%)",
    },
    keywords: ["偶像", "舞台", "粉彩", "镜头"],
    songs: [
      { title: "Shuwa Shuwa", titleJp: "しゅわりん☆どり〜みん" },
      { title: "Happy Synthesizer", titleJp: "Happy Synthesizer" },
    ],
  },
  {
    slug: "roselia",
    id: "Roselia",
    name: "Roselia",
    nameJp: "ロゼリア",
    sloganEn: "Bloom with Ultimate Beauty",
    bgTitle: "ROSELIA",
    tagline: "蔷薇绽放，极致之美",
    description:
      "以凑友希那为核心的顶尖乐队，追求「究极的乐队」与玫瑰般凛冽而华美的音乐美学。",
    folder: "Roselia",
    colors: {
      primary: "#6B2D5B",
      secondary: "#1A1A2E",
      accent: "#C9A227",
      glow: "rgba(201, 162, 39, 0.35)",
      bg: "#08060c",
      gradient: "linear-gradient(135deg, #6B2D5B 0%, #1A1A2E 50%, #C9A227 100%)",
    },
    keywords: ["哥特", "玫瑰", "黑金", "究极"],
    songs: [
      { title: "BLACK SHOUT", titleJp: "BLACK SHOUT" },
      { title: "Neo-Aspect", titleJp: "Neo-Aspect" },
    ],
  },
  {
    slug: "hello-happy-world",
    id: "Hello, Happy World!",
    name: "Hello, Happy World!",
    nameJp: "ハロー、ハッピーワールド！",
    sloganEn: "Make the World Happy!",
    bgTitle: "HELLO HAPPY WORLD",
    tagline: "让全世界 Happy！",
    description:
      "以弦卷心为领袖，将「让全世界 Happy！」作为使命的奇特乐队。游乐园般的舞台与不可思议的成员构成。",
    folder: "HelloHappyWorld",
    colors: {
      primary: "#00CED1",
      secondary: "#FFD700",
      accent: "#FF6347",
      glow: "rgba(0, 206, 209, 0.4)",
      bg: "#061018",
      gradient: "linear-gradient(135deg, #00CED1 0%, #FFD700 40%, #FF6347 100%)",
    },
    keywords: ["游乐园", "彩虹", "Happy", "奇妙"],
    songs: [
      { title: "Egao no Orchestra!", titleJp: "笑顔のオーケストラ！" },
      { title: "Hikaru Nara", titleJp: "光るなら" },
    ],
  },
  {
    slug: "morfonica",
    id: "Morfonica",
    name: "Morfonica",
    nameJp: "モーフォニカ",
    sloganEn: "Fantasy in Concert",
    bgTitle: "MORFONICA",
    tagline: "幻想与现实的协奏曲",
    description:
      "以仓田真白为中心，由古典与流行交织而成的五人乐队。小提琴与水晶般清澈音色描绘幻想世界。",
    folder: "Morfonica",
    colors: {
      primary: "#4ECDC4",
      secondary: "#556FB5",
      accent: "#A8E6CF",
      glow: "rgba(78, 205, 196, 0.4)",
      bg: "#061210",
      gradient: "linear-gradient(135deg, #4ECDC4 0%, #556FB5 50%, #A8E6CF 100%)",
    },
    keywords: ["小提琴", "水晶", "幻想", "协奏"],
    songs: [
      { title: "Daylight", titleJp: "Daylight -デイライト-" },
      { title: "fly through the night", titleJp: "fly through the night" },
    ],
  },
  {
    slug: "raise-a-suilen",
    id: "RAISE A SUILEN",
    name: "RAISE A SUILEN",
    nameJp: "レイズアスイール",
    sloganEn: "Tear Through the Silence",
    bgTitle: "RAISE A SUILEN",
    tagline: "Electro × Rock，撕裂寂静",
    description:
      "以和奏瑞依（LAYER）为主唱，融合电子与摇滚的五人乐队。霓虹与赛博美学下，以压倒性音压席卷舞台。",
    folder: "RaiseASuilen",
    colors: {
      primary: "#7B2FBE",
      secondary: "#00D4FF",
      accent: "#FF006E",
      glow: "rgba(123, 47, 190, 0.45)",
      bg: "#06040f",
      gradient: "linear-gradient(135deg, #7B2FBE 0%, #00D4FF 50%, #FF006E 100%)",
    },
    keywords: ["赛博朋克", "电音", "霓虹", "RAS"],
    songs: [
      { title: "EXPOSE 'Burn out!!!'", titleJp: "EXPOSE 'Burn out!!!'" },
      { title: "DRIVE US CRAZY", titleJp: "DRIVE US CRAZY" },
    ],
  },
];

export function getBandBySlug(slug: string) {
  return BAND_THEMES.find((b) => b.slug === slug);
}

export function getBandByFolder(folder: string) {
  return BAND_THEMES.find((b) => b.folder === folder);
}

export function getBandByName(name: string) {
  return BAND_THEMES.find((b) => b.id === name);
}
