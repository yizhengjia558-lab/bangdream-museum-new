"use client";

import { useCallback, useMemo, useState } from "react";
import { AssetImage } from "@/components/ui/AssetImage";
import { expandCardDisplays } from "@/lib/cards";
import { CharacterCardArchive } from "@/components/characters/CharacterCardArchive";
import { CardTile } from "@/components/cards/CardTile";
import { CardVariantBadge } from "@/components/cards/CardVariantBadge";
import { CharacterHero } from "@/components/characters/CharacterHero";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { BandBackButton } from "@/components/bands/BandBackButton";
import { useLocale } from "@/components/i18n/LocaleProvider";
import type { CharacterData } from "@/lib/data";
import type { BandTheme } from "@/lib/themes";

export function CharacterPageView({
  character,
  theme,
  primary,
  fallbackHref,
}: {
  character: CharacterData;
  theme?: BandTheme;
  primary: string;
  fallbackHref: string;
}) {
  const { t } = useLocale();
  const displays = useMemo(() => expandCardDisplays(character.cards), [character.cards]);
  const [visible, setVisible] = useState(48);
  const [highlightKey, setHighlightKey] = useState<string | null>(null);

  const featuredCards = character.cards.filter((c) => c.rarity.includes("4") || c.rarity.includes("5")).slice(0, 6);
  const featured = expandCardDisplays(featuredCards);

  const jumpToCard = useCallback(
    (key: string) => {
      const index = displays.findIndex((d) => d.key === key);
      if (index < 0) return;

      setVisible((v) => Math.max(v, index + 1));
      setHighlightKey(key);

      window.setTimeout(() => {
        document.getElementById("character-archive")?.scrollIntoView({ behavior: "smooth", block: "start" });
        window.setTimeout(() => {
          document.getElementById(`card-tile-${key}`)?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
          window.setTimeout(() => setHighlightKey(null), 2600);
        }, 280);
      }, 80);
    },
    [displays]
  );

  return (
    <>
      <BandBackButton color={primary} fallbackHref={fallbackHref} />
      <CharacterHero
        character={character}
        theme={theme}
        cardDisplays={displays}
        onJumpToCard={jumpToCard}
      />

      <section className="page-section relative py-20">
        <div className="pointer-events-none absolute inset-0 bloom-layer" aria-hidden />
        <div className="relative page-container">
          <SectionHeading title={t("character.featured")} subtitle={t("character.featuredSubtitle")} />
          <div className="grid grid-cols-2 gap-6 md:grid-cols-3 md:gap-8">
            {featured.map((item) => (
              <CardTile key={item.key}>
                <CardVariantBadge variant={item.variant} />
                <div className="card-image-wrap relative aspect-[3/4]">
                  <AssetImage src={item.src} alt={item.card.card_name} fill className="card-image object-cover" />
                  <div className="glass-reflection" />
                </div>
                <div className="card-caption text-center">
                  <span className="card-caption-name line-clamp-2">{item.card.card_name}</span>
                </div>
              </CardTile>
            ))}
          </div>
        </div>
      </section>

      <section id="character-archive" className="page-section relative scroll-mt-28 py-20 pb-28">
        <div className="relative page-container">
          <SectionHeading title={t("character.archive")} subtitle={t("character.archiveSubtitle")} />
          <CharacterCardArchive
            cards={character.cards}
            themeColor={primary}
            visible={visible}
            onVisibleChange={setVisible}
            highlightKey={highlightKey}
          />
        </div>
      </section>
    </>
  );
}
