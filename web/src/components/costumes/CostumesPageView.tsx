"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useSearchParams } from "next/navigation";
import { CardDetailModal } from "@/components/cards/CardDetailModal";
import { BandBackButton } from "@/components/bands/BandBackButton";
import {
  CostumeExhibitTile,
  costumeTileKey,
} from "@/components/costumes/CostumeExhibitTile";
import { CostumeStillCaptureHost } from "@/components/costumes/CostumeStillCaptureHost";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { useGlobalSearch } from "@/components/search/GlobalSearchProvider";
import { getBandName } from "@/lib/i18n/display";
import { fetchCardsCatalog } from "@/lib/data";
import { selectCostumeCards } from "@/lib/recent-cards";
import { BAND_THEMES } from "@/lib/themes";
import type { CardDisplayItem } from "@/lib/cards";
import type { CardData } from "@/lib/data-types";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 24;
const PREVIEW_LEAVE_MS = 180;

function toDisplayItem(card: CardData): CardDisplayItem {
  const trained = card.trained_file || card.trained_image;
  const untrained = card.untrained_file || card.untrained_image;
  if (trained) {
    return { key: `${card.id}-trained`, card, variant: "trained", src: trained };
  }
  if (untrained) {
    return { key: `${card.id}-untrained`, card, variant: "untrained", src: untrained };
  }
  return { key: `${card.id}-trained`, card, variant: "trained", src: "" };
}

export function CostumesPageView() {
  const { t, locale } = useLocale();
  const searchParams = useSearchParams();
  const { query, hasQuery } = useGlobalSearch();
  const [catalog, setCatalog] = useState<CardData[] | null>(null);
  const [error, setError] = useState(false);
  const [bandSlug, setBandSlug] = useState<string>("all");
  const [characterId, setCharacterId] = useState<string>("all");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [detail, setDetail] = useState<CardDisplayItem | null>(null);
  const [previewKey, setPreviewKey] = useState<string | null>(null);
  const leaveTimer = useRef<number | null>(null);

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

  useEffect(() => {
    return () => {
      if (leaveTimer.current != null) window.clearTimeout(leaveTimer.current);
    };
  }, []);

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
    setPreviewKey(null);
  }, [bandSlug, characterId, query]);

  const characterOptions = useMemo(() => {
    if (bandSlug === "all") return characters;
    const band = BAND_THEMES.find((entry) => entry.slug === bandSlug);
    if (!band) return characters;
    return characters.filter((entry) => entry.band_folder === band.folder);
  }, [characters, bandSlug]);

  const shown = filtered.slice(0, visible);
  const detailItems = useMemo(() => shown.map(toDisplayItem), [shown]);
  const activeBand = BAND_THEMES.find((entry) => entry.slug === bandSlug);
  const themeColor = activeBand?.colors.primary ?? "#e9435e";
  const detailAccent = detail
    ? BAND_THEMES.find(
        (entry) =>
          entry.folder === detail.card.band_folder ||
          entry.id === detail.card.band ||
          entry.name === detail.card.band
      )?.colors.primary ?? themeColor
    : themeColor;

  const activatePreview = (key: string) => {
    if (leaveTimer.current != null) {
      window.clearTimeout(leaveTimer.current);
      leaveTimer.current = null;
    }
    setPreviewKey(key);
  };

  const scheduleDeactivate = (key: string) => {
    if (leaveTimer.current != null) window.clearTimeout(leaveTimer.current);
    leaveTimer.current = window.setTimeout(() => {
      setPreviewKey((current) => (current === key ? null : current));
      leaveTimer.current = null;
    }, PREVIEW_LEAVE_MS);
  };

  return (
    <>
      <BandBackButton color={themeColor} fallbackHref="/" />
      <CostumeStillCaptureHost />

      <section className="page-section relative pt-28 pb-20">
        <div className="pointer-events-none absolute inset-0 bloom-layer opacity-40" aria-hidden />
        <div className="relative page-container">
          <SectionHeading title={t("costumes.title")} subtitle={t("costumes.subtitle")} />

          <GlassPanel className="costumes-toolbar mb-8 p-4 sm:p-5">
            <div className="costumes-filters costumes-filters--chips">
              <div className="costumes-chip-row" role="tablist" aria-label={t("costumes.filterBand")}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={bandSlug === "all"}
                  className={cn("costume-band-chip", bandSlug === "all" && "costume-band-chip--active")}
                  style={{ "--chip-color": "#e9435e" } as CSSProperties}
                  onClick={() => {
                    setBandSlug("all");
                    setCharacterId("all");
                  }}
                >
                  <span className="costume-band-chip__dot" aria-hidden />
                  <span>{t("costumes.allBands")}</span>
                </button>
                {BAND_THEMES.map((band) => {
                  const active = bandSlug === band.slug;
                  return (
                    <button
                      key={band.slug}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      className={cn("costume-band-chip", active && "costume-band-chip--active")}
                      style={{ "--chip-color": band.colors.primary } as CSSProperties}
                      onClick={() => {
                        setBandSlug(band.slug);
                        setCharacterId("all");
                      }}
                    >
                      <span className="costume-band-chip__dot" aria-hidden />
                      <span>{getBandName(band, locale)}</span>
                    </button>
                  );
                })}
              </div>

              <div className="costumes-filter-meta">
                <label className="costumes-filter costumes-filter--member">
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
            </div>
          </GlassPanel>

          {!catalog && !error ? (
            <ul
              className="costume-gallery-grid costume-gallery-grid--phones costume-gallery-grid--skeleton"
              aria-busy="true"
              aria-label={t("costumes.loading")}
            >
              {Array.from({ length: 8 }).map((_, i) => (
                <li key={`sk-${i}`} className="costume-gallery-item">
                  <div className="costume-tile costume-tile--skeleton costume-tile--phone" />
                </li>
              ))}
            </ul>
          ) : error ? (
            <GlassPanel className="p-10 text-center costumes-empty costumes-empty--error">
              <div className="costumes-empty__cabinet" aria-hidden />
              <p className="costumes-empty__title">{t("costumes.loadError")}</p>
            </GlassPanel>
          ) : filtered.length === 0 ? (
            <GlassPanel className="p-10 text-center costumes-empty">
              <div className="costumes-empty__cabinet" aria-hidden />
              <p className="costumes-empty__title">{t("costumes.empty")}</p>
              <p className="costumes-empty__hint">{t("costumes.emptyHint")}</p>
            </GlassPanel>
          ) : (
            <>
              <ul className="costume-gallery-grid costume-gallery-grid--phones">
                {shown.map((card, index) => {
                  const key = costumeTileKey(card);
                  return (
                    <CostumeExhibitTile
                      key={key}
                      card={card}
                      index={index}
                      liveActive={previewKey === key}
                      onActivate={() => activatePreview(key)}
                      onDeactivate={() => scheduleDeactivate(key)}
                      onOpenDetail={() => {
                        setPreviewKey(null);
                        setDetail(toDisplayItem(card));
                      }}
                    />
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

      <CardDetailModal
        item={detail}
        items={detailItems}
        onSelectItem={setDetail}
        onClose={() => setDetail(null)}
        themeColor={detailAccent}
      />
    </>
  );
}
