"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { expandCardDisplays } from "@/lib/cards";
import { CharacterCardArchive } from "@/components/characters/CharacterCardArchive";
import { CardGalleryItem } from "@/components/cards/CardGalleryItem";
import { CharacterHero } from "@/components/characters/CharacterHero";
import { CharacterVoiceActorSection } from "@/components/characters/CharacterVoiceActorSection";
import { CharacterHotCards } from "@/components/characters/CharacterHotCards";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { BandBackButton } from "@/components/bands/BandBackButton";
import { useLocale } from "@/components/i18n/LocaleProvider";
import type { CharacterData, CharacterSummary } from "@/lib/data-types";
import type { BandTheme } from "@/lib/themes";

export function CharacterPageView({
  character,
  theme,
  primary,
  fallbackHref,
  bandMembers = [],
}: {
  character: CharacterData;
  theme?: BandTheme;
  primary: string;
  fallbackHref: string;
  bandMembers?: CharacterSummary[];
}) {
  const { t } = useLocale();
  const displays = useMemo(() => expandCardDisplays(character.cards), [character.cards]);
  const [visible, setVisible] = useState(16);
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

  const jumpToCardId = useCallback(
    (cardId: string) => {
      const item = displays.find((d) => d.card.id === cardId);
      if (item) jumpToCard(item.key);
    },
    [displays, jumpToCard]
  );

  const openFilters = useCallback(() => {
    document.getElementById("character-archive")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const archiveMembers = bandMembers.length ? bandMembers : [character];

  return (
    <>
      <BandBackButton color={primary} fallbackHref={fallbackHref} />
      <CharacterHero
        character={character}
        theme={theme}
        cardDisplays={displays}
        onJumpToCard={jumpToCard}
        onOpenFilters={openFilters}
      />

      {character.voice_actor?.image ? (
        <CharacterVoiceActorSection voiceActor={character.voice_actor} accent={primary} />
      ) : null}

      <section className="page-section relative py-16 sm:py-20">
        <div className="relative page-container">
          <CharacterHotCards
            characterId={character.id}
            cards={character.cards}
            accent={primary}
            onJump={jumpToCardId}
          />
          <p className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-center text-sm text-[var(--text-muted)]">
            <Link
              href={`/costumes/?character=${character.id}`}
              className="home-new-cards__cta character-costumes-cta"
              style={{ ["--cta-accent" as string]: primary }}
            >
              <span className="home-new-cards__cta-label">{t("character.costumesLink")}</span>
            </Link>
            <Link href="/championship/" className="championship-inline-link" style={{ color: primary }}>
              {t("championship.navHint")}
            </Link>
          </p>
        </div>
      </section>

      <section className="page-section relative py-20">
        <div className="relative page-container">
          <SectionHeading title={t("character.featured")} subtitle={t("character.featuredSubtitle")} />
          <ul className="card-gallery-grid card-gallery-grid--featured">
            {featured.map((item, i) => (
              <CardGalleryItem
                key={item.key}
                item={item}
                index={i}
                themeColor={primary}
                highlight={false}
                onClick={() => jumpToCard(item.key)}
              />
            ))}
          </ul>
        </div>
      </section>

      <section
        id="character-archive"
        className="character-archive-section page-section relative scroll-mt-28 py-20"
      >
        <div className="relative page-container">
          <SectionHeading title={t("character.archive")} subtitle={t("character.archiveSubtitle")} />
          <CharacterCardArchive
            cards={character.cards}
            themeColor={primary}
            visible={visible}
            onVisibleChange={setVisible}
            highlightKey={highlightKey}
            members={archiveMembers}
          />
        </div>
      </section>

    </>
  );
}
