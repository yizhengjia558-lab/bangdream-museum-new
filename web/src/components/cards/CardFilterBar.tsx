"use client";

import { useMemo } from "react";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { getBandName, getCharacterName } from "@/lib/i18n/display";
import {
  BAND_FILTER_IDS,
  CARD_ATTRIBUTES,
  CARD_KINDS,
  CARD_STARS,
  EMPTY_CARD_FILTERS,
  collectFilterYears,
  isEmptyFilters,
  type BandFilterId,
  type CardAttribute,
  type CardFilterState,
  type CardKind,
} from "@/lib/card-filters";
import type { CardData, CharacterData } from "@/lib/data";
import { BAND_THEMES } from "@/lib/themes";
import { cn } from "@/lib/utils";

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function FilterChip({
  active,
  label,
  onClick,
  accent,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  accent: string;
}) {
  return (
    <button
      type="button"
      className={cn("card-filter-chip", active && "card-filter-chip--active")}
      style={
        active
          ? {
              borderColor: `${accent}88`,
              background: `${accent}22`,
              boxShadow: `0 0 20px ${accent}25`,
            }
          : undefined
      }
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card-filter-group">
      <p className="card-filter-group-title">{title}</p>
      <div className="card-filter-chip-row">{children}</div>
    </div>
  );
}

export function CardFilterBar({
  cards,
  filters,
  onChange,
  members = [],
  themeColor = "#e9435e",
  resultCount,
  totalCount,
}: {
  cards: CardData[];
  filters: CardFilterState;
  onChange: (filters: CardFilterState) => void;
  members?: CharacterData[];
  themeColor?: string;
  resultCount: number;
  totalCount: number;
}) {
  const { t, locale } = useLocale();
  const years = useMemo(() => collectFilterYears(cards), [cards]);

  const bandsInCards = useMemo(() => {
    const set = new Set<string>();
    for (const card of cards) {
      if (card.band) set.add(card.band);
    }
    return BAND_FILTER_IDS.filter((b) => set.has(b));
  }, [cards]);

  const membersInCards = useMemo(() => {
    const ids = new Set<number>();
    for (const card of cards) {
      if (card.character_id) ids.add(card.character_id);
    }
    const fromCards = members.filter((m) => ids.has(m.id));
    if (fromCards.length) return fromCards;
    return members;
  }, [cards, members]);

  const showBand = bandsInCards.length > 1;
  const showMember = membersInCards.length > 1;

  const bandTheme = (bandId: BandFilterId) => BAND_THEMES.find((b) => b.id === bandId);

  const attributeLabel = (attr: CardAttribute) => t(`filter.attr.${attr}`);
  const kindLabel = (kind: CardKind) => t(`filter.kind.${kind}`);

  return (
    <GlassPanel className="card-filter-bar mb-10" glow={`radial-gradient(circle, ${themeColor}25, transparent)`}>
      <div className="card-filter-bar-head">
        <div>
          <p className="card-filter-bar-eyebrow">{t("filter.title")}</p>
          <p className="card-filter-bar-count">
            {t("filter.resultCount")
              .replace("{shown}", String(resultCount))
              .replace("{total}", String(totalCount))}
          </p>
        </div>
        {!isEmptyFilters(filters) && (
          <GlassButton variant="ghost" className="card-filter-clear" onClick={() => onChange(EMPTY_CARD_FILTERS)}>
            {t("filter.clearAll")}
          </GlassButton>
        )}
      </div>

      <div className="card-filter-groups">
        {showBand && (
          <FilterGroup title={t("filter.band")}>
            {bandsInCards.map((band) => {
              const theme = bandTheme(band);
              return (
                <FilterChip
                  key={band}
                  label={theme ? getBandName(theme, locale) : band}
                  active={filters.bands.includes(band)}
                  accent={themeColor}
                  onClick={() => onChange({ ...filters, bands: toggle(filters.bands, band) })}
                />
              );
            })}
          </FilterGroup>
        )}

        {showMember && (
          <FilterGroup title={t("filter.member")}>
            {membersInCards.map((member) => (
              <FilterChip
                key={member.id}
                label={getCharacterName(member, locale)}
                active={filters.members.includes(member.id)}
                accent={themeColor}
                onClick={() => onChange({ ...filters, members: toggle(filters.members, member.id) })}
              />
            ))}
          </FilterGroup>
        )}

        <FilterGroup title={t("filter.stars")}>
          {CARD_STARS.map((star) => (
            <FilterChip
              key={star}
              label={`${star}★`}
              active={filters.stars.includes(star)}
              accent={themeColor}
              onClick={() => onChange({ ...filters, stars: toggle(filters.stars, star) })}
            />
          ))}
        </FilterGroup>

        <FilterGroup title={t("filter.attributeGroup")}>
          {CARD_ATTRIBUTES.map((attr) => (
            <FilterChip
              key={attr}
              label={attributeLabel(attr)}
              active={filters.attributes.includes(attr)}
              accent={themeColor}
              onClick={() => onChange({ ...filters, attributes: toggle(filters.attributes, attr) })}
            />
          ))}
        </FilterGroup>

        <FilterGroup title={t("filter.kindGroup")}>
          {CARD_KINDS.map((kind) => (
            <FilterChip
              key={kind}
              label={kindLabel(kind)}
              active={filters.kinds.includes(kind)}
              accent={themeColor}
              onClick={() => onChange({ ...filters, kinds: toggle(filters.kinds, kind) })}
            />
          ))}
        </FilterGroup>

        {years.length > 0 && (
          <FilterGroup title={t("filter.year")}>
            {years.map((year) => (
              <FilterChip
                key={year}
                label={String(year)}
                active={filters.years.includes(year)}
                accent={themeColor}
                onClick={() => onChange({ ...filters, years: toggle(filters.years, year) })}
              />
            ))}
          </FilterGroup>
        )}
      </div>
    </GlassPanel>
  );
}
