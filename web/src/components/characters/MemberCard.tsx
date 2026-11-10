"use client";

import Link from "next/link";
import { AssetImage } from "@/components/ui/AssetImage";
import { CardTile } from "@/components/cards/CardTile";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { getCharacterAltName, getCharacterName } from "@/lib/i18n/display";
import type { CharacterSummary } from "@/lib/data-types";
import type { BandTheme } from "@/lib/themes";
import { getCharacterPortrait } from "@/lib/character-utils";

export function MemberCard({
  member,
  theme,
}: {
  member: CharacterSummary;
  theme: BandTheme;
  index?: number;
}) {
  const { locale } = useLocale();
  const displayName = getCharacterName(member, locale);
  const altName = getCharacterAltName(member, locale);
  const portrait = getCharacterPortrait(member);

  return (
    <div className="p-1">
      <Link href={`/characters/${member.slug}/`} className="group block">
        <CardTile className="h-full">
          <div className="card-image-wrap relative aspect-[4/3]">
            <div
              className="absolute inset-x-0 top-0 z-10 h-0.5"
              style={{ background: theme.colors.gradient }}
            />
            <AssetImage
              src={portrait}
              alt={displayName}
              fill
              variant="mobile"
              className="card-image object-cover object-center"
            />
          </div>
          <div className="card-caption text-center">
            <p className="card-caption-jp">{altName}</p>
            <h3 className="card-caption-name mt-1.5">{displayName}</h3>
          </div>
        </CardTile>
      </Link>
    </div>
  );
}
