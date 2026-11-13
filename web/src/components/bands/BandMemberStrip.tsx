"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { AssetImage } from "@/components/ui/AssetImage";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { getCharacterAltName, getCharacterName } from "@/lib/i18n/display";
import { getCharacterColor } from "@/lib/character-colors";
import { getCharacterPortrait } from "@/lib/character-utils";
import type { CharacterSummary } from "@/lib/data-types";
import type { BandTheme } from "@/lib/themes";
import { cn } from "@/lib/utils";

export function BandMemberStrip({
  member,
  theme,
  index = 0,
}: {
  member: CharacterSummary;
  theme: BandTheme;
  index?: number;
}) {
  const { locale } = useLocale();
  const displayName = getCharacterName(member, locale);
  const altName = getCharacterAltName(member, locale);
  const portrait = getCharacterPortrait(member);
  const color = getCharacterColor(member.id, theme.colors.primary);

  return (
    <Link
      href={`/characters/${member.slug}/`}
      className={cn("band-member-strip", "band-member-strip--enter")}
      style={
        {
          "--member-color": color,
          animationDelay: `${Math.min(index, 8) * 55}ms`,
        } as CSSProperties
      }
      aria-label={displayName}
    >
      <span className="band-member-strip__bg" aria-hidden />
      <span className="band-member-strip__art">
        <AssetImage
          src={portrait}
          alt=""
          fill
          variant="mobile"
          className="band-member-strip__img object-cover"
        />
      </span>
      <span className="band-member-strip__fade" aria-hidden />
      <span className="band-member-strip__meta">
        <span className="band-member-strip__alt">{altName}</span>
        <span className="band-member-strip__name">{displayName}</span>
      </span>
    </Link>
  );
}
