"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AssetImage } from "@/components/ui/AssetImage";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { getCharacterName } from "@/lib/i18n/display";
import { getCharacterPortrait } from "@/lib/character-utils";
import { fetchBandTopCharacters, isCommunityEnabled } from "@/lib/community-api";
import type { CharacterSummary } from "@/lib/data-types";

export function BandHotCharacters({
  bandFolder,
  members,
  accent = "#e9435e",
}: {
  bandFolder: string;
  members: CharacterSummary[];
  accent?: string;
}) {
  const { t, locale } = useLocale();
  const [entries, setEntries] = useState<{ member: CharacterSummary; views: number }[]>([]);
  const [loaded, setLoaded] = useState(false);

  const memberMap = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);

  useEffect(() => {
    if (!isCommunityEnabled()) {
      setLoaded(true);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetchBandTopCharacters(bandFolder, { limit: 3 });
        if (cancelled) return;
        const resolved = res.characters
          .map((e) => {
            const member = memberMap.get(e.characterId);
            return member ? { member, views: e.views } : null;
          })
          .filter(Boolean) as { member: CharacterSummary; views: number }[];
        setEntries(resolved);
      } catch {
        if (!cancelled) setEntries([]);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bandFolder, memberMap]);

  if (!loaded || entries.length === 0) return null;

  return (
    <div className="band-hot-chars">
      <div className="band-hot-chars-head">
        <h3 className="band-hot-chars-title" style={{ color: accent }}>
          {t("hotChars.title")}
        </h3>
        <p className="band-hot-chars-sub">{t("hotChars.subtitle")}</p>
      </div>
      <ol className="band-hot-chars-grid">
        {entries.map((entry, i) => {
          const name = getCharacterName(entry.member, locale);
          const portrait = getCharacterPortrait(entry.member);
          return (
            <li key={entry.member.id}>
              <Link href={`/characters/${entry.member.slug}/`} className="band-hot-char">
                <span className="character-hot-rank" style={{ background: accent }}>
                  {i + 1}
                </span>
                <div className="band-hot-thumb">
                  {portrait ? (
                    <AssetImage
                      src={portrait}
                      alt={name}
                      fill
                      variant="thumb"
                      className="object-cover object-top"
                    />
                  ) : null}
                </div>
                <div className="character-hot-meta">
                  <p className="character-hot-name">{name}</p>
                  <p className="character-hot-views">
                    {t("hotChars.views").replace("{count}", entry.views.toLocaleString())}
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
