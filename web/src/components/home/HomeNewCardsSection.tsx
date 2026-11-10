"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AssetImage } from "@/components/ui/AssetImage";
import { CardDetailModal } from "@/components/cards/CardDetailModal";
import { CardFavoriteButton } from "@/components/cards/CardFavoriteButton";
import { CardTile } from "@/components/cards/CardTile";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { getCardRarityLabel } from "@/lib/i18n/display";
import type { CardDisplayItem } from "@/lib/cards";
import type { RecentCardsResult } from "@/lib/recent-cards";

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

  if (!uniqueDisplays.length) return null;

  const title = recent.mode === "week" ? t("newCards.weekTitle") : t("newCards.latestTitle");
  const subtitle =
    recent.mode === "week" ? t("newCards.weekSubtitle") : t("newCards.latestSubtitle");

  return (
    <section className="home-new-cards page-section relative pt-6 pb-4 lg:pt-8 lg:pb-6">
      <div className="relative page-container">
        <header className="home-new-cards__header">
          <div>
            <p className="hero-eyebrow text-[var(--text-muted)]">{t("newCards.eyebrow")}</p>
            <h2 className="section-display mt-3">{title}</h2>
            <p className="hero-tagline mt-3 max-w-lg">{subtitle}</p>
          </div>
          <div className="home-new-cards__actions">
            <Link href="/costumes/" className="home-new-cards__cta">
              <span className="home-new-cards__cta-label">{t("newCards.costumesLink")}</span>
            </Link>
          </div>
        </header>

        <ul className="home-new-cards__rail">
          {uniqueDisplays.map((item, index) => (
            <NewCardTile
              key={item.card.id}
              item={item}
              index={index}
              dateLabel={formatReleaseDate(item.card.release_date, locale)}
              rarityLabel={getCardRarityLabel(item.card, locale)}
              newLabel={t("newCards.badge")}
              characterLabel={item.card.character_name_cn || item.card.character_name_jp || ""}
              onOpen={() => setLightbox(item)}
            />
          ))}
        </ul>
      </div>

      <CardDetailModal
        item={lightbox}
        items={uniqueDisplays}
        onSelectItem={setLightbox}
        onClose={() => setLightbox(null)}
      />
    </section>
  );
}

function NewCardTile({
  item,
  index,
  dateLabel,
  rarityLabel,
  newLabel,
  characterLabel,
  onOpen,
}: {
  item: CardDisplayItem;
  index: number;
  dateLabel: string;
  rarityLabel: string;
  newLabel: string;
  characterLabel: string;
  onOpen: () => void;
}) {
  return (
    <li
      className="home-new-cards__item"
      style={{ animationDelay: `${Math.min(index, 10) * 40}ms` }}
    >
      <CardTile className="home-new-cards__card card-tile--interactive" onClick={onOpen}>
        <CardFavoriteButton displayKey={item.key} card={item.card} variant={item.variant} />
        <span className="home-new-cards__badge">{newLabel}</span>
        <div className="home-new-cards__image-wrap">
          <AssetImage
            src={item.src}
            alt={item.card.card_name}
            fill
            variant="mobile"
            className="home-new-cards__image object-cover"
          />
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
