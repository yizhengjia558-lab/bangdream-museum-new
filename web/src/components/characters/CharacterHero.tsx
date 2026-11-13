"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { CinematicBackground } from "@/components/effects/CinematicBackground";
import { AssetImage } from "@/components/ui/AssetImage";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { BandLogo } from "@/components/ui/BandLogo";
import { CardNameSearch } from "@/components/cards/CardNameSearch";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { getBandName, getCharacterAltName, getCharacterName, getVoiceActorName } from "@/lib/i18n/display";
import type { CardDisplayItem } from "@/lib/cards";
import type { CharacterData } from "@/lib/data-types";
import type { BandTheme } from "@/lib/themes";
import { getCharacterBackdrop, getCharacterPortrait } from "@/lib/character-utils";
import { cn } from "@/lib/utils";

export function CharacterHero({
  character,
  theme,
  cardDisplays,
  onJumpToCard,
  onOpenFilters,
}: {
  character: CharacterData;
  theme?: BandTheme;
  cardDisplays: CardDisplayItem[];
  onJumpToCard: (key: string) => void;
  onOpenFilters?: () => void;
}) {
  const { t, locale } = useLocale();
  const accent = theme?.colors.primary ?? "#e9435e";
  const backdrop = getCharacterBackdrop(character);
  const portrait = getCharacterPortrait(character);
  const displayName = getCharacterName(character, locale);
  const altName = getCharacterAltName(character, locale);
  const cvName = character.voice_actor ? getVoiceActorName(character.voice_actor, locale) : null;

  return (
    <section className="character-hero relative min-h-screen overflow-hidden">
      <CinematicBackground src={backdrop} overlay={0.58} parallax={false} kenBurns={false} />
      <div className="character-hero-vignette pointer-events-none absolute inset-0" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/78"
        aria-hidden
      />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col items-center justify-end page-container-wide pb-16 pt-28 lg:flex-row lg:items-end lg:justify-between lg:gap-12 lg:pb-20 lg:pt-32">
        <div
          className="character-hero-polaroid relative w-full max-w-xl lg:mb-8 lg:flex-1"
          style={{ "--hero-accent": accent } as CSSProperties}
        >
          <span className="character-hero-polaroid__star character-hero-polaroid__star--tl" aria-hidden>
            ★
          </span>
          <span className="character-hero-polaroid__star character-hero-polaroid__star--tr" aria-hidden>
            ✦
          </span>
          <span className="character-hero-polaroid__tape" aria-hidden />
          <div className="character-hero-card-frame relative w-full overflow-hidden">
            <AssetImage
              src={portrait}
              alt={displayName}
              fill
              priority
              variant="mobile"
              className={cn("object-cover object-center drop-shadow-[0_28px_56px_rgba(0,0,0,0.5)]")}
            />
          </div>
        </div>

        <div className="relative z-20 mt-8 w-full max-w-md lg:mt-0 lg:mb-12">
          <GlassPanel className="character-hero-panel" glow={`radial-gradient(circle, ${accent}40, transparent)`}>
            {theme && (
              <Link
                href={`/bands/${theme.slug}/`}
                className="character-hero-band character-hero-interactive"
                style={{ color: accent }}
                aria-label={getBandName(theme, locale)}
              >
                <BandLogo band={theme} size="sm" />
              </Link>
            )}

            <div className="character-hero-identity">
              <div className="character-hero-title-copy">
                <h1 className="character-hero-name">{displayName}</h1>
                {altName ? <p className="character-hero-alt-name">{altName}</p> : null}
                {cvName ? (
                  <p className="character-hero-cv">
                    <span className="character-hero-cv-label">{t("character.voiceActor")}</span>
                    <span className="character-hero-cv-name">{cvName}</span>
                  </p>
                ) : null}
                <p className="character-hero-card-count">
                  {t("character.cards")} · {character.card_count}
                </p>
              </div>
            </div>

            <CardNameSearch
              variant="compact"
              displays={cardDisplays}
              themeColor={accent}
              onJump={onJumpToCard}
              showFilterTrigger
              onFilterClick={onOpenFilters}
            />
          </GlassPanel>
        </div>
      </div>
    </section>
  );
}
