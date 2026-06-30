"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { AssetImage } from "@/components/ui/AssetImage";
import { CardTile } from "@/components/cards/CardTile";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { getCharacterAltName, getCharacterName } from "@/lib/i18n/display";
import type { CharacterSummary } from "@/lib/data-types";
import type { BandTheme } from "@/lib/themes";

export function MemberCard({
  member,
  theme,
  index,
}: {
  member: CharacterSummary;
  theme: BandTheme;
  index: number;
}) {
  const { locale } = useLocale();
  const displayName = getCharacterName(member, locale);
  const altName = getCharacterAltName(member, locale);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="p-1"
    >
      <Link href={`/characters/${member.slug}/`} className="group block">
        <CardTile className="h-full">
          <div className="card-image-wrap relative aspect-[3/4]">
            <div
              className="absolute inset-x-0 top-0 z-10 h-0.5"
              style={{ background: theme.colors.gradient }}
            />
            <AssetImage
              src={member.standing}
              alt={displayName}
              fill
              variant="thumb"
              className="card-image object-contain object-bottom p-4"
            />
            <div className="glass-reflection" />
          </div>
          <div className="card-caption text-center">
            <p className="card-caption-jp">{altName}</p>
            <h3 className="card-caption-name mt-1.5">{displayName}</h3>
          </div>
        </CardTile>
      </Link>
    </motion.div>
  );
}
