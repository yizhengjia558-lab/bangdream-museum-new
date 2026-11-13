"use client";

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { BandLogo } from "@/components/ui/BandLogo";
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
import type { CardData, CharacterSummary } from "@/lib/data-types";
import { BAND_THEMES } from "@/lib/themes";
import { cn } from "@/lib/utils";

const ATTR_COLORS: Record<CardAttribute, string> = {
  power: "#e9435e",
  cool: "#4f7cff",
  pure: "#3ecf8e",
  happy: "#ffb02e",
};

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function FilterChip({
  active,
  label,
  onClick,
  accent,
  dot,
  children,
}: {
  active: boolean;
  label?: string;
  onClick: () => void;
  accent: string;
  dot?: string;
  children?: ReactNode;
}) {
  return (
    <button
      type="button"
      className={cn("card-filter-chip", active && "card-filter-chip--active", children && "card-filter-chip--logo")}
      style={
        {
          "--chip-accent": accent,
          ...(active
            ? {
                borderColor: `${accent}88`,
                background: `${accent}22`,
                boxShadow: `0 0 20px ${accent}25`,
              }
            : undefined),
        } as CSSProperties
      }
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      title={label}
    >
      {dot ? <span className="card-filter-chip__dot" style={{ background: dot }} aria-hidden /> : null}
      {children ?? label}
    </button>
  );
}

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
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
  members?: CharacterSummary[];
  themeColor?: string;
  resultCount: number;
  totalCount: number;
}) {
  const { t, locale } = useLocale();
  const [expanded, setExpanded] = useState(false);
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
  const activeCount =
    filters.bands.length +
    filters.members.length +
    filters.stars.length +
    filters.attributes.length +
    filters.kinds.length +
    filters.years.length;

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
        <div className="card-filter-bar-actions">
          <button
            type="button"
            className="card-filter-toggle"
            aria-expanded={expanded}
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? t("filter.collapse") : t("filter.expand")}
            {activeCount > 0 ? <span className="card-filter-toggle__count">{activeCount}</span> : null}
          </button>
          {!isEmptyFilters(filters) && (
            <GlassButton variant="ghost" className="card-filter-clear" onClick={() => onChange(EMPTY_CARD_FILTERS)}>
              {t("filter.clearAll")}
            </GlassButton>
          )}
        </div>
      </div>

      <div className={cn("card-filter-groups", expanded && "card-filter-groups--expanded")}>
        {showBand && (
          <FilterGroup title={t("filter.band")}>
            {bandsInCards.map((band) => {
              const theme = bandTheme(band);
              return (
                <FilterChip
                  key={band}
                  label={theme ? getBandName(theme, locale) : band}
                  active={filters.bands.includes(band)}
                  accent={theme?.colors.primary ?? themeColor}
                  onClick={() => onChange({ ...filters, bands: toggle(filters.bands, band) })}
                >
                  {theme ? <BandLogo band={theme} size="sm" /> : band}
                </FilterChip>
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
              accent={ATTR_COLORS[attr]}
              dot={ATTR_COLORS[attr]}
              onClick={() => onChange({ ...filters, attributes: toggle(filters.attributes, attr) })}
            />
          ))}
        </FilterGroup>

        <div className="card-filter-more">
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
      </div>
    </GlassPanel>
  );
}
