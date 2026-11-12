"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AssetImage } from "@/components/ui/AssetImage";
import { BandBackButton } from "@/components/bands/BandBackButton";
import { CostumeDetailModal } from "@/components/costumes/CostumeDetailModal";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { useGlobalSearch } from "@/components/search/GlobalSearchProvider";
import { getBandName } from "@/lib/i18n/display";
import { fetchCardsCatalog } from "@/lib/data";
import { costumePreviewSrc, selectCostumeCards } from "@/lib/recent-cards";
import { BAND_THEMES } from "@/lib/themes";
import type { CardData } from "@/lib/data-types";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 24;

export function CostumesPageView() {
  const { t, locale } = useLocale();
  const searchParams = useSearchParams();
  const { query, hasQuery } = useGlobalSearch();
  const [catalog, setCatalog] = useState<CardData[] | null>(null);
  const [error, setError] = useState(false);
  const [bandSlug, setBandSlug] = useState<string>("all");
  const [characterId, setCharacterId] = useState<string>("all");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [active, setActive] = useState<CardData | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchCardsCatalog()
      .then((cards) => {
        if (!cancelled) setCatalog(cards);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const band = searchParams.get("band");
    const character = searchParams.get("character");
    if (band) setBandSlug(band);
    if (character) setCharacterId(character);
  }, [searchParams]);

  const costumes = useMemo(() => (catalog ? selectCostumeCards(catalog) : []), [catalog]);

  const characters = useMemo(() => {
    const map = new Map<number, { id: number; name: string; band_folder: string }>();
    for (const card of costumes) {
      if (!card.character_id) continue;
      if (map.has(card.character_id)) continue;
      map.set(card.character_id, {
        id: card.character_id,
        name: card.character_name_cn || card.character_name_jp || String(card.character_id),
        band_folder: card.band_folder || "",
      });
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, locale === "ja" ? "ja" : "zh"));
  }, [costumes, locale]);

  const filtered = useMemo(() => {
    let list = costumes;

    if (bandSlug !== "all") {
      const band = BAND_THEMES.find((entry) => entry.slug === bandSlug);
      if (band) {
        list = list.filter(
          (card) => card.band_folder === band.folder || card.band === band.id || card.band === band.name
        );
      }
    }

    if (characterId !== "all") {
      const id = Number(characterId);
      list = list.filter((card) => card.character_id === id);
    }

    if (hasQuery) {
      const q = query.trim().toLowerCase();
      list = list.filter((card) => {
        const hay = [
          card.card_name,
          card.character_name_cn,
          card.character_name_jp,
          card.band,
          card.event,
          card.live2d_asset_bundle_name,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
    }

    return list;
  }, [costumes, bandSlug, characterId, hasQuery, query]);

  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [bandSlug, characterId, query]);

  const characterOptions = useMemo(() => {
    if (bandSlug === "all") return characters;
    const band = BAND_THEMES.find((entry) => entry.slug === bandSlug);
    if (!band) return characters;
    return characters.filter((entry) => entry.band_folder === band.folder);
  }, [characters, bandSlug]);

  const shown = filtered.slice(0, visible);
  const themeColor =
    BAND_THEMES.find((entry) => entry.slug === bandSlug)?.colors.primary ?? "#e9435e";

  return (
    <>
      <BandBackButton color={themeColor} fallbackHref="/" />

      <section className="page-section relative pt-28 pb-20">
        <div className="pointer-events-none absolute inset-0 bloom-layer opacity-40" aria-hidden />
        <div className="relative page-container">
          <SectionHeading title={t("costumes.title")} subtitle={t("costumes.subtitle")} />

          <GlassPanel className="costumes-toolbar mb-8 p-4 sm:p-5">
            <div className="costumes-filters">
              <label className="costumes-filter">
                <span>{t("costumes.filterBand")}</span>
                <select
                  value={bandSlug}
                  onChange={(e) => {
                    setBandSlug(e.target.value);
                    setCharacterId("all");
                  }}
                >
                  <option value="all">{t("costumes.allBands")}</option>
                  {BAND_THEMES.map((band) => (
                    <option key={band.slug} value={band.slug}>
                      {getBandName(band, locale)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="costumes-filter">
                <span>{t("costumes.filterMember")}</span>
                <select value={characterId} onChange={(e) => setCharacterId(e.target.value)}>
                  <option value="all">{t("costumes.allMembers")}</option>
                  {characterOptions.map((member) => (
                    <option key={member.id} value={String(member.id)}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </label>

              <p className="costumes-count">
                {t("costumes.count").replace("{count}", String(filtered.length))}
              </p>
            </div>
          </GlassPanel>

          {!catalog && !error ? (
            <ul className="costume-gallery-grid costume-gallery-grid--skeleton" aria-busy="true" aria-label={t("costumes.loading")}>
              {Array.from({ length: 8 }).map((_, i) => (
                <li key={`sk-${i}`} className="costume-gallery-item">
                  <div className="costume-tile costume-tile--skeleton" />
                </li>
              ))}
            </ul>
          ) : error ? (
            <GlassPanel className="p-10 text-center">
              <p className="text-[var(--text-secondary)]">{t("costumes.loadError")}</p>
            </GlassPanel>
          ) : filtered.length === 0 ? (
            <GlassPanel className="p-10 text-center costumes-empty">
              <p className="costumes-empty__title">{t("costumes.empty")}</p>
            </GlassPanel>
          ) : (
            <>
              <ul className="costume-gallery-grid">
                {shown.map((card, index) => {
                  const src = costumePreviewSrc(card);
                  return (
                    <li key={`${card.id}-${card.costume_id}`} className="costume-gallery-item">
                      <button
                        type="button"
                        className="costume-tile costume-tile--exhibit"
                        onClick={() => setActive(card)}
                        style={{ animationDelay: `${(index % 12) * 36}ms` }}
                      >
                        <span className="costume-tile__badge">{t("costumes.live2dBadge")}</span>
                        <div className="costume-tile__image-wrap">
                          {src ? (
                            <AssetImage
                              src={src}
                              alt={card.card_name}
                              fill
                              variant="mobile"
                              className="object-cover costume-tile__image"
                            />
                          ) : (
                            <div className="costume-tile__placeholder" />
                          )}
                        </div>
                        <div className="costume-tile__meta">
                          <p className="costume-tile__name">{card.card_name}</p>
                          <p className="costume-tile__sub">
                            {[card.character_name_cn || card.character_name_jp, card.band]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>

              {visible < filtered.length ? (
                <div className="mt-10 flex justify-center">
                  <button
                    type="button"
                    className={cn("glass-button")}
                    onClick={() => setVisible((v) => v + PAGE_SIZE)}
                  >
                    {t("card.loadMore")}
                  </button>
                </div>
              ) : null}
            </>
          )}
        </div>
      </section>

      <CostumeDetailModal card={active} onClose={() => setActive(null)} themeColor={themeColor} />
    </>
  );
}
