"use client";

import Link from "next/link";
import { AssetImage } from "@/components/ui/AssetImage";
import { BandLogo } from "@/components/ui/BandLogo";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { getCardAttrColor } from "@/lib/card-attrs";
import { getCardName, getCardRarityLabel, getCharacterName } from "@/lib/i18n/display";
import siteIndex from "@/data/site-index.json";
import type { CardData, CharacterSummary } from "@/lib/data-types";
import { getBandByFolder, getBandByName } from "@/lib/themes";

const members = siteIndex.characters as CharacterSummary[];

function findMember(card: CardData) {
  if (card.character_id) {
    return members.find((m) => m.id === card.character_id);
  }
  return undefined;
}

export function CardDetailExhibitStrip({ card }: { card: CardData }) {
  const { t, locale } = useLocale();
  const member = findMember(card);
  const band =
    (card.band_folder ? getBandByFolder(card.band_folder) : undefined) ??
    (member?.band_folder ? getBandByFolder(member.band_folder) : undefined) ??
    (card.band ? getBandByName(card.band) : undefined);
  const attrColor = getCardAttrColor(card.attribute);
  const rarityLabel = getCardRarityLabel(card, locale);
  const kind =
    card.card_kind && card.card_kind !== "normal"
      ? t(`filter.kind.${card.card_kind}` as "filter.kind.limited")
      : null;
  const releaseLabel = card.release_date || (card.release_year ? String(card.release_year) : "");
  const characterLabel =
    (member ? getCharacterName(member, locale) : null) ||
    card.character_name_cn ||
    card.character_name_jp ||
    "";
  const thumb = member?.portrait || member?.standing || "";

  return (
    <div className="card-detail-exhibit">
      <div className="card-detail-exhibit__identity">
        {member && thumb ? (
          <Link
            href={`/characters/${member.slug}/`}
            className="card-detail-exhibit__avatar"
            onClick={(e) => e.stopPropagation()}
            aria-label={characterLabel}
          >
            <AssetImage src={thumb} alt="" variant="thumb" className="card-detail-exhibit__avatar-img" />
          </Link>
        ) : thumb ? (
          <span className="card-detail-exhibit__avatar">
            <AssetImage src={thumb} alt="" variant="thumb" className="card-detail-exhibit__avatar-img" />
          </span>
        ) : null}
        <div className="card-detail-exhibit__copy">
          <p className="card-detail-exhibit__title">{getCardName(card, locale)}</p>
          <p className="card-detail-exhibit__sub">
            {[characterLabel, card.event || t("card.special")].filter(Boolean).join(" · ")}
          </p>
        </div>
        {band ? (
          <Link
            href={`/bands/${band.slug}/`}
            className="card-detail-exhibit__band"
            onClick={(e) => e.stopPropagation()}
            title={band.name}
          >
            <BandLogo band={band} size="sm" />
          </Link>
        ) : null}
      </div>

      <div className="card-detail-exhibit__chips">
        <span className="card-detail-exhibit__chip card-detail-exhibit__chip--accent">{rarityLabel}</span>
        {card.attribute && attrColor ? (
          <span className="card-detail-exhibit__chip">
            <i className="card-detail-exhibit__dot" style={{ background: attrColor }} />
            {t(`filter.attr.${card.attribute}` as "filter.attr.power")}
          </span>
        ) : null}
        {kind ? <span className="card-detail-exhibit__chip">{kind}</span> : null}
        {releaseLabel ? <span className="card-detail-exhibit__chip">{releaseLabel}</span> : null}
      </div>
    </div>
  );
}
