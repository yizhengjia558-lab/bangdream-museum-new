"use client";

import { useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import { AssetImage } from "@/components/ui/AssetImage";
import { CardDetailModal } from "@/components/cards/CardDetailModal";
import { CardFavoriteButton } from "@/components/cards/CardFavoriteButton";
import { CardTile } from "@/components/cards/CardTile";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { getCardRarityLabel } from "@/lib/i18n/display";
import { getBandByFolder, getBandByName } from "@/lib/themes";
import type { CardDisplayItem } from "@/lib/cards";
import type { CardData } from "@/lib/data-types";
import type { RecentCardsResult } from "@/lib/recent-cards";

function resolveCardAccent(card: CardData) {
  const theme =
    (card.band_folder ? getBandByFolder(card.band_folder) : undefined) ??
    (card.band ? getBandByName(card.band) : undefined);
  return theme?.colors.primary ?? "#e9435e";
}

export function HomeNewCardsSection({ recent }: { recent: RecentCardsResult }) {
  const { t, locale } = useLocale();
  const [lightbox, setLightbox] = useState<CardDisplayItem | null>(null);

  const uniqueDisplays = useMemo(() => {
    const out: CardDisplayItem[] = [];
    for (const card of recent.cards) {
      const trained = card.trained_file || card.trained_image;
      const untrained = card.untrained_file || card.untrained_image;
      const src = trained || untrained;
      if (!src) continue;
      out.push({
        key: `${card.id}-${trained ? "trained" : "untrained"}`,
        card,
        variant: trained ? "trained" : "untrained",
        src,
      });
    }
    return out;
  }, [recent.cards]);

  const loopDisplays = useMemo(
    () => (uniqueDisplays.length ? [...uniqueDisplays, ...uniqueDisplays] : []),
    [uniqueDisplays]
  );

  if (!uniqueDisplays.length) return null;

  const title = recent.mode === "week" ? t("newCards.weekTitle") : t("newCards.latestTitle");
  const subtitle =
    recent.mode === "week" ? t("newCards.weekSubtitle") : t("newCards.latestSubtitle");
  const detailAccent = lightbox ? resolveCardAccent(lightbox.card) : "#e9435e";
  const durationSec = Math.max(14, uniqueDisplays.length * 2.25);

  return (
    <section className="home-new-cards page-section relative pt-6 pb-4 lg:pt-8 lg:pb-6">
      <div className="relative page-container">
        <header className="home-new-cards__header">
          <div className="home-new-cards__heading">
            <p className="hero-eyebrow">{t("newCards.eyebrow")}</p>
            <h2 className="section-display mt-2">{title}</h2>
            <p className="hero-tagline mt-2 max-w-lg">{subtitle}</p>
          </div>
          <div className="home-new-cards__actions">
            <Link href="/costumes/" className="home-new-cards__cta">
              <span className="home-new-cards__cta-label">{t("newCards.costumesLink")}</span>
            </Link>
          </div>
        </header>
      </div>

      <div
        className="home-new-cards__marquee"
        style={{ "--new-cards-duration": `${durationSec}s` } as CSSProperties}
      >
        <div className="home-new-cards__marquee-viewport" role="list" aria-label={title}>
          <ul className="home-new-cards__marquee-track">
            {loopDisplays.map((item, index) => (
              <NewCardTile
                key={`${item.card.id}-${index}`}
                item={item}
                index={index}
                accent={resolveCardAccent(item.card)}
                dateLabel={formatReleaseDate(item.card.release_date, locale)}
                rarityLabel={getCardRarityLabel(item.card, locale)}
                newLabel={t("newCards.badge")}
                characterLabel={item.card.character_name_cn || item.card.character_name_jp || ""}
                ariaHidden={index >= uniqueDisplays.length}
                onOpen={() => setLightbox(item)}
              />
            ))}
          </ul>
        </div>
      </div>

      <CardDetailModal
        item={lightbox}
        items={uniqueDisplays}
        onSelectItem={setLightbox}
        onClose={() => setLightbox(null)}
        themeColor={detailAccent}
      />
    </section>
  );
}

function NewCardTile({
  item,
  index,
  accent,
  dateLabel,
  rarityLabel,
  newLabel,
  characterLabel,
  ariaHidden,
  onOpen,
}: {
  item: CardDisplayItem;
  index: number;
  accent: string;
  dateLabel: string;
  rarityLabel: string;
  newLabel: string;
  characterLabel: string;
  ariaHidden?: boolean;
  onOpen: () => void;
}) {
  return (
    <li
      className="home-new-cards__item"
      role="listitem"
      aria-hidden={ariaHidden || undefined}
    >
      <CardTile
        className="home-new-cards__card home-new-cards__card--exhibit card-tile--interactive"
        style={{ "--card-accent": accent } as CSSProperties}
        onClick={onOpen}
      >
        <CardFavoriteButton displayKey={item.key} card={item.card} variant={item.variant} />
        <span className="home-new-cards__badge">{newLabel}</span>
        <div className="home-new-cards__image-wrap">
          <AssetImage
            src={item.src}
            alt={ariaHidden ? "" : item.card.card_name}
            fill
            variant="mobile"
            priority={index < 2}
            className="home-new-cards__image object-cover"
          />
          <span className="home-new-cards__shine" aria-hidden />
        </div>
        <div className="home-new-cards__meta">
          <p className="home-new-cards__rarity">{rarityLabel}</p>
          <p className="home-new-cards__name">{item.card.card_name}</p>
          <p className="home-new-cards__sub">
            {[characterLabel, dateLabel].filter(Boolean).join(" · ")}
          </p>
        </div>
      </CardTile>
    </li>
  );
}

function formatReleaseDate(value: string, locale: string) {
  if (!value) return "";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return value;
  try {
    return new Intl.DateTimeFormat(locale === "ja" ? "ja-JP" : locale === "en" ? "en-US" : "zh-CN", {
      month: "short",
      day: "numeric",
    }).format(date);
  } catch {
    return value.slice(5);
  }
}
