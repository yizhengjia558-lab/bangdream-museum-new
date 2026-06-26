"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CinematicBackground } from "@/components/effects/CinematicBackground";
import { AssetImage } from "@/components/ui/AssetImage";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { CardNameSearch } from "@/components/cards/CardNameSearch";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { getBandName, getCharacterName } from "@/lib/i18n/display";
import type { CardDisplayItem } from "@/lib/cards";
import type { CharacterData } from "@/lib/data";
import type { BandTheme } from "@/lib/themes";
import { getCharacterBackdrop } from "@/lib/character-utils";

export function CharacterHero({
  character,
  theme,
  cardDisplays,
  onJumpToCard,
}: {
  character: CharacterData;
  theme?: BandTheme;
  cardDisplays: CardDisplayItem[];
  onJumpToCard: (key: string) => void;
}) {
  const { t, locale } = useLocale();
  const accent = theme?.colors.primary ?? "#e9435e";
  const backdrop = getCharacterBackdrop(character);
  const displayName = getCharacterName(character, locale);

  return (
    <section className="relative min-h-screen overflow-hidden">
      <CinematicBackground src={backdrop} overlay={0.45} />
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{ backdropFilter: "blur(48px)", WebkitBackdropFilter: "blur(48px)" }}
        aria-hidden
      />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col items-center justify-end page-container-wide pb-16 pt-28 lg:flex-row lg:items-end lg:justify-between lg:gap-12 lg:pb-20 lg:pt-32">
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="relative h-[65vh] w-full max-w-lg overflow-hidden lg:h-[80vh] lg:max-w-xl lg:flex-1"
        >
          <div
            className="absolute inset-x-[15%] bottom-[5%] h-[15%] rounded-full blur-3xl"
            style={{ background: `${accent}40` }}
          />
          <AssetImage
            src={character.standing}
            alt={displayName}
            fill
            priority
            className="animate-float-soft object-contain object-bottom drop-shadow-[0_48px_96px_rgba(0,0,0,0.6)]"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30, filter: "blur(8px)" }}
          animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-20 mt-8 w-full max-w-md lg:mt-0 lg:mb-12"
        >
          <GlassPanel className="character-hero-panel" glow={`radial-gradient(circle, ${accent}40, transparent)`}>
            {theme && (
              <Link
                href={`/bands/${theme.slug}/`}
                className="character-hero-band transition hover:opacity-80"
                style={{ color: accent }}
              >
                {getBandName(theme, locale)}
              </Link>
            )}

            <h1 className="character-hero-name">{displayName}</h1>

            <dl className="character-hero-stats">
              <div className="character-hero-stat">
                <dt className="character-hero-stat-label">{t("character.cards")}</dt>
                <dd className="character-hero-stat-value">{character.card_count}</dd>
              </div>
              {theme && (
                <div className="character-hero-stat">
                  <dt className="character-hero-stat-label">{t("character.band")}</dt>
                  <dd className="character-hero-stat-value">{getBandName(theme, locale)}</dd>
                </div>
              )}
            </dl>

            <CardNameSearch
              variant="compact"
              displays={cardDisplays}
              themeColor={accent}
              onJump={onJumpToCard}
            />
          </GlassPanel>
        </motion.div>
      </div>
    </section>
  );
}
