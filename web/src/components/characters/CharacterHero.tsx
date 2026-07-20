"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CinematicBackground } from "@/components/effects/CinematicBackground";
import { AssetImage } from "@/components/ui/AssetImage";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { CardNameSearch } from "@/components/cards/CardNameSearch";
import { CharacterChibiAvatar } from "@/components/characters/CharacterChibiAvatar";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { getBandName, getCharacterAltName, getCharacterName, getVoiceActorName } from "@/lib/i18n/display";
import type { CardDisplayItem } from "@/lib/cards";
import type { CharacterData } from "@/lib/data-types";
import type { BandTheme } from "@/lib/themes";
import { getCharacterBackdrop, getCharacterPortrait } from "@/lib/character-utils";
import { useMobilePerf } from "@/hooks/useMobilePerf";
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
  const mobile = useMobilePerf();
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
        <motion.div
          initial={{ opacity: 0, y: mobile ? 20 : 40, scale: mobile ? 1 : 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: mobile ? 0.65 : 1, ease: [0.22, 1, 0.36, 1] }}
          className="relative h-[65vh] w-full max-w-lg overflow-hidden lg:h-[80vh] lg:max-w-xl lg:flex-1"
        >
          <div
            className="absolute inset-x-[15%] bottom-[5%] h-[15%] rounded-full blur-3xl"
            style={{ background: `${accent}40` }}
          />
          <AssetImage
            src={portrait}
            alt={displayName}
            fill
            priority
            variant={mobile ? "mobile" : "full"}
            className={cn(
              "object-contain object-bottom drop-shadow-[0_48px_96px_rgba(0,0,0,0.6)]",
              !mobile && "animate-float-soft"
            )}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: mobile ? 0 : 30, filter: mobile ? "blur(0px)" : "blur(8px)" }}
          animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
          transition={{ duration: mobile ? 0.55 : 0.9, delay: mobile ? 0.08 : 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-20 mt-8 w-full max-w-md lg:mt-0 lg:mb-12"
        >
          <GlassPanel className="character-hero-panel" glow={`radial-gradient(circle, ${accent}40, transparent)`}>
            {theme && (
              <Link
                href={`/bands/${theme.slug}/`}
                className="character-hero-band character-hero-interactive"
                style={{ color: accent }}
              >
                {getBandName(theme, locale)}
              </Link>
            )}

            <div className="character-hero-identity">
              <CharacterChibiAvatar characterId={character.id} size="lg" alt={displayName} />
              <div className="character-hero-title-copy">
                <h1 className="character-hero-name">{displayName}</h1>
                {altName ? <p className="character-hero-alt-name">{altName}</p> : null}
                {cvName ? (
                  <p className="character-hero-cv">
                    <span className="character-hero-cv-label">{t("character.voiceActor")}</span>
                    <span className="character-hero-cv-name">{cvName}</span>
                  </p>
                ) : null}
              </div>
            </div>

            <div className="character-hero-info-grid">
              <div className="character-hero-info-card">
                <span className="character-hero-info-card__label">{t("character.cards")}</span>
                <span className="character-hero-info-card__value">{character.card_count}</span>
              </div>
              {theme ? (
                <div className="character-hero-info-card">
                  <span className="character-hero-info-card__label">{t("character.band")}</span>
                  <span className="character-hero-info-card__value">{getBandName(theme, locale)}</span>
                </div>
              ) : null}
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
        </motion.div>
      </div>
    </section>
  );
}
