"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AssetImage } from "@/components/ui/AssetImage";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { getBandName, getCharacterName } from "@/lib/i18n/display";
import { getCharacterPortrait } from "@/lib/character-utils";
import { BAND_THEMES, getBandByFolder, getCharacterSummaries } from "@/lib/data";
import { getCardVariantSrc } from "@/lib/cards";
import {
  fetchMonthlyChampionship,
  isCommunityEnabled,
  type ChampionshipPayload,
} from "@/lib/community-api";
import type { CardData, CharacterSummary } from "@/lib/data-types";

function previousMonthKey() {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() - 1);
  return d.toISOString().slice(0, 7);
}

function currentMonthKey() {
  return new Date().toISOString().slice(0, 7);
}

export function ChampionshipPageView() {
  const { t, locale } = useLocale();
  const [data, setData] = useState<ChampionshipPayload | null>(null);
  const [cards, setCards] = useState<CardData[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(() =>
    new Date().getUTCDate() >= 28 ? previousMonthKey() : currentMonthKey()
  );

  const members = useMemo(() => getCharacterSummaries(), []);
  const memberMap = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);
  const cardMap = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const { fetchCardsCatalog } = await import("@/lib/data");
        const catalog = await fetchCardsCatalog();
        if (!cancelled) setCards(catalog);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isCommunityEnabled()) {
      setLoading(false);
      setError(t("forum.disabled"));
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError("");
    void (async () => {
      try {
        const res = await fetchMonthlyChampionship(month);
        if (!cancelled) setData(res);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : t("championship.loadError"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [month, t]);

  const monthOptions = useMemo(() => {
    const opts: string[] = [];
    const d = new Date();
    for (let i = 0; i < 6; i++) {
      const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - i, 1));
      opts.push(x.toISOString().slice(0, 7));
    }
    return opts;
  }, []);

  return (
    <div className="museum-page championship-page page-container py-24 sm:py-28">
      <SectionHeading title={t("championship.title")} subtitle={t("championship.subtitle")} />

      <div className="championship-toolbar">
        <label className="championship-month">
          <span>{t("championship.month")}</span>
          <select value={month} onChange={(e) => setMonth(e.target.value)}>
            {monthOptions.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
        {data?.isFinal ? (
          <span className="championship-badge">{t("championship.final")}</span>
        ) : (
          <span className="championship-badge championship-badge--live">{t("championship.live")}</span>
        )}
      </div>

      {!isCommunityEnabled() || error ? (
        <p className="mt-8 text-[var(--text-muted)]">{error || t("forum.disabled")}</p>
      ) : loading ? (
        <p className="mt-8 text-[var(--text-muted)]">…</p>
      ) : (
        <>
          <section className="championship-section">
            <h2 className="championship-section-title">{t("championship.cardChamps")}</h2>
            <p className="championship-section-sub">{t("championship.cardChampsSub")}</p>
            {(data?.characterCardChamps.length ?? 0) === 0 ? (
              <p className="mt-4 text-sm text-[var(--text-muted)]">{t("championship.empty")}</p>
            ) : (
              <ul className="championship-card-grid">
                {data!.characterCardChamps.map((row) => {
                  const member = memberMap.get(row.characterId);
                  const card = cardMap.get(row.cardId);
                  const band = getBandByFolder(row.bandFolder || member?.band_folder || "");
                  const src = card
                    ? getCardVariantSrc(card, "trained") || getCardVariantSrc(card, "untrained")
                    : "";
                  return (
                    <li key={`${row.characterId}-${row.cardId}`} className="championship-card-item">
                      <div className="championship-card-thumb">
                        {src ? (
                          <AssetImage
                            src={src}
                            alt={card?.card_name || row.cardId}
                            fill
                            variant="thumb"
                            className="object-cover object-top"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <p className="championship-label">
                          {member ? getCharacterName(member, locale) : `#${row.characterId}`}
                          {band ? ` · ${getBandName(band, locale)}` : ""}
                        </p>
                        <p className="championship-name">{card?.card_name || row.cardId}</p>
                        <p className="character-hot-views">
                          {t("hotCards.views").replace("{count}", row.views.toLocaleString())}
                        </p>
                        {member ? (
                          <Link href={`/characters/${member.slug}/`} className="championship-link">
                            {t("championship.viewCharacter")}
                          </Link>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="championship-section">
            <h2 className="championship-section-title">{t("championship.bandChamps")}</h2>
            <p className="championship-section-sub">{t("championship.bandChampsSub")}</p>
            {(data?.bandCharacterChamps.length ?? 0) === 0 ? (
              <p className="mt-4 text-sm text-[var(--text-muted)]">{t("championship.empty")}</p>
            ) : (
              <ul className="championship-band-grid">
                {BAND_THEMES.map((theme) => {
                  const champ = data!.bandCharacterChamps.find((c) => c.bandFolder === theme.folder);
                  if (!champ) return null;
                  const member = memberMap.get(champ.characterId) as CharacterSummary | undefined;
                  const portrait = member ? getCharacterPortrait(member) : "";
                  return (
                    <li key={theme.folder} className="championship-band-item">
                      <Link href={`/bands/${theme.slug}/`} className="championship-band-link">
                        <div className="band-hot-thumb">
                          {portrait ? (
                            <AssetImage
                              src={portrait}
                              alt={member ? getCharacterName(member, locale) : ""}
                              fill
                              variant="thumb"
                              className="object-cover object-top"
                            />
                          ) : null}
                        </div>
                        <div>
                          <p className="championship-label" style={{ color: theme.colors.primary }}>
                            {getBandName(theme, locale)}
                          </p>
                          <p className="championship-name">
                            {member ? getCharacterName(member, locale) : `#${champ.characterId}`}
                          </p>
                          <p className="character-hot-views">
                            {t("hotChars.views").replace("{count}", champ.views.toLocaleString())}
                          </p>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
