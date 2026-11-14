"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { AssetImage } from "@/components/ui/AssetImage";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { getCharacterAltName, getCharacterName } from "@/lib/i18n/display";
import { getCharacterStripArt } from "@/lib/character-utils";
import type { CharacterData, CharacterSummary } from "@/lib/data-types";
import type { BandTheme } from "@/lib/themes";
import { cn } from "@/lib/utils";

export function BandMemberStrip({
  member,
  theme,
  index = 0,
}: {
  member: CharacterSummary | CharacterData;
  theme: BandTheme;
  index?: number;
}) {
  const { locale } = useLocale();
  const displayName = getCharacterName(member, locale);
  const altName = getCharacterAltName(member, locale);
  const art = getCharacterStripArt(member);
  const color = theme.colors.primary;

  return (
    <Link
      href={`/characters/${member.slug}/`}
      className={cn(
        "band-member-strip",
        "band-member-strip--enter",
        art.kind === "trim"
          ? "band-member-strip--trim"
          : art.kind === "standing"
            ? "band-member-strip--standing"
            : "band-member-strip--card"
      )}
      style={
        {
          "--member-color": color,
          "--strip-face-x": `${art.faceBiasX}%`,
          "--strip-face-y": `${art.faceBiasY}%`,
          animationDelay: `${Math.min(index, 8) * 55}ms`,
        } as CSSProperties
      }
      aria-label={displayName}
    >
      <span className="band-member-strip__bg" aria-hidden />
      <span className="band-member-strip__art">
        <AssetImage
          src={art.src}
          alt=""
          fill
          variant="full"
          priority={index < 5}
          className={cn(
            "band-member-strip__img",
            art.kind === "trim" ? "object-contain" : "object-cover"
          )}
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
