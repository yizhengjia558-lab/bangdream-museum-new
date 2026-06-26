import type { Locale } from "./types";

const zh = {
  nav: { home: "首页", bands: "乐队" },
  back: "返回",
  theme: { light: "浅色", dark: "深色" },
  lang: { switch: "切换语言", current: "当前语言" },
  hero: {
    eyebrow: "GIRLS BAND PARTY!",
    title: "BanG Dream!",
    subtitle: "数字角色博物馆",
    tagline: "探索每一支乐队、每一段故事、每一个梦想。",
    explore: "开始探索",
    featuredCards: "精选卡面",
  },
  home: {
    collection: "馆藏",
    sectionTitle: "七支乐队，同一个梦想",
    sectionTagline: "走进每一片舞台——青春、光芒与音乐在此等候。",
  },
  bands: {
    archive: "档案馆",
    allBands: "全部乐队",
    enterBand: "进入乐队",
  },
  band: {
    members: "成员",
    music: "音乐",
    gallery: "卡面画廊",
    gallerySubtitle: "卡片收藏",
    signatureTrack: "代表曲目",
  },
  character: {
    featured: "精选",
    featuredSubtitle: "代表卡面",
    archive: "图鉴",
    archiveSubtitle: "完整收藏",
    cards: "卡面",
    band: "所属乐队",
  },
  card: {
    untrained: "特训前",
    trained: "特训后",
    loadMore: "加载更多",
    special: "特别",
    searchPlaceholder: "搜索卡面名称…",
    searchNoResults: "未找到匹配的卡面",
    searchHint: "输入关键词，点击结果快速跳转",
    jumpTo: "跳转到卡面",
  },
  common: { members: "成员", cards: "卡面", scrollToTop: "回到顶部" },
  footer: {
    title: "BanG Dream! 数字博物馆",
    subtitle: "角色档案沉浸体验",
    disclaimer: "同人展示站点 · 与 Bushiroad 无官方关联",
  },
} as const;

const en = {
  nav: { home: "Home", bands: "Bands" },
  back: "Back",
  theme: { light: "Light", dark: "Dark" },
  lang: { switch: "Switch language", current: "Current language" },
  hero: {
    eyebrow: "GIRLS BAND PARTY!",
    title: "BanG Dream!",
    subtitle: "A Digital Character Museum",
    tagline: "Explore every band, every story, every dream.",
    explore: "Explore",
    featuredCards: "Featured cards",
  },
  home: {
    collection: "The Collection",
    sectionTitle: "Seven Bands, One Dream",
    sectionTagline: "Step into each stage — youth, light, and music await.",
  },
  bands: {
    archive: "Archive",
    allBands: "All Bands",
    enterBand: "Enter Band",
  },
  band: {
    members: "Members",
    music: "Music",
    gallery: "Gallery",
    gallerySubtitle: "Card Collection",
    signatureTrack: "Signature Track",
  },
  character: {
    featured: "Featured",
    featuredSubtitle: "Signature Cards",
    archive: "Archive",
    archiveSubtitle: "Full Collection",
    cards: "Cards",
    band: "Band",
  },
  card: {
    untrained: "Before Training",
    trained: "After Training",
    loadMore: "Load More",
    special: "Special",
    searchPlaceholder: "Search card name…",
    searchNoResults: "No matching cards",
    searchHint: "Type a keyword and select a result to jump",
    jumpTo: "Jump to card",
  },
  common: { members: "Members", cards: "Cards", scrollToTop: "Back to Top" },
  footer: {
    title: "BanG Dream! Digital Museum",
    subtitle: "Character Archive Experience",
    disclaimer: "Fan-made showcase · Not affiliated with Bushiroad",
  },
} as const;

const ja = {
  nav: { home: "ホーム", bands: "バンド" },
  back: "戻る",
  theme: { light: "ライト", dark: "ダーク" },
  lang: { switch: "言語を切り替え", current: "現在の言語" },
  hero: {
    eyebrow: "GIRLS BAND PARTY!",
    title: "BanG Dream!",
    subtitle: "デジタルキャラクターミュージアム",
    tagline: "すべてのバンド、すべての物語、すべての夢を探索しよう。",
    explore: "探索する",
    featuredCards: "注目のカード",
  },
  home: {
    collection: "コレクション",
    sectionTitle: "七つのバンド、一つの夢",
    sectionTagline: "それぞれのステージへ — 青春、光、音楽が待っている。",
  },
  bands: {
    archive: "アーカイブ",
    allBands: "すべてのバンド",
    enterBand: "バンドへ",
  },
  band: {
    members: "メンバー",
    music: "ミュージック",
    gallery: "ギャラリー",
    gallerySubtitle: "カードコレクション",
    signatureTrack: "代表曲",
  },
  character: {
    featured: "注目",
    featuredSubtitle: "代表カード",
    archive: "アーカイブ",
    archiveSubtitle: "全コレクション",
    cards: "カード",
    band: "所属バンド",
  },
  card: {
    untrained: "特訓前",
    trained: "特訓後",
    loadMore: "もっと見る",
    special: "スペシャル",
    searchPlaceholder: "カード名を検索…",
    searchNoResults: "一致するカードがありません",
    searchHint: "キーワードを入力し、結果をクリックして移動",
    jumpTo: "カードへ移動",
  },
  common: { members: "メンバー", cards: "カード", scrollToTop: "トップへ" },
  footer: {
    title: "BanG Dream! デジタルミュージアム",
    subtitle: "キャラクターアーカイブ体験",
    disclaimer: "ファンメイド展示 · Bushiroad 非公式",
  },
} as const;

export const messages = { zh, en, ja } as const;

export type Messages = typeof zh;

type NestedKeyOf<T, Prefix extends string = ""> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends object
        ? NestedKeyOf<T[K], Prefix extends "" ? K : `${Prefix}.${K}`>
        : Prefix extends ""
          ? K
          : `${Prefix}.${K}`;
    }[keyof T & string]
  : never;

export type MessageKey = NestedKeyOf<Messages>;

export function translate(locale: Locale, key: MessageKey): string {
  const parts = key.split(".");
  let node: unknown = messages[locale];
  for (const part of parts) {
    if (node && typeof node === "object" && part in node) {
      node = (node as Record<string, unknown>)[part];
    } else {
      return key;
    }
  }
  return typeof node === "string" ? node : key;
}
