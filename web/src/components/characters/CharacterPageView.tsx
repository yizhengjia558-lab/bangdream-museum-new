"use client";

import { useCallback, useMemo, useState } from "react";
import { expandCardDisplays } from "@/lib/cards";
import { CharacterCardArchive } from "@/components/characters/CharacterCardArchive";
import { CardGalleryItem } from "@/components/cards/CardGalleryItem";
import { CharacterHero } from "@/components/characters/CharacterHero";
import { CharacterVoiceActorSection } from "@/components/characters/CharacterVoiceActorSection";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { BandBackButton } from "@/components/bands/BandBackButton";
import { useLocale } from "@/components/i18n/LocaleProvider";
import type { CharacterData } from "@/lib/data";
import type { BandTheme } from "@/lib/themes";
import { getCharactersByBand } from "@/lib/data";

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

  const bandMembers = theme ? getCharactersByBand(theme.folder) : [];

  return (
    <>
      <BandBackButton color={primary} fallbackHref={fallbackHref} />
      <CharacterHero
        character={character}
        theme={theme}
        cardDisplays={displays}
        onJumpToCard={jumpToCard}
      />

      {character.voice_actor?.image ? (
        <CharacterVoiceActorSection voiceActor={character.voice_actor} accent={primary} />
      ) : null}

      <section className="page-section relative py-20">
        <div className="pointer-events-none absolute inset-0 bloom-layer" aria-hidden />
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

      <section id="character-archive" className="character-archive-section page-section relative scroll-mt-28 py-20">
        <div className="relative page-container">
          <SectionHeading title={t("character.archive")} subtitle={t("character.archiveSubtitle")} />
          <CharacterCardArchive
            cards={character.cards}
            themeColor={primary}
            visible={visible}
            onVisibleChange={setVisible}
            highlightKey={highlightKey}
            members={bandMembers.length ? bandMembers : [character]}
          />
        </div>
      </section>
    </>
  );
}
