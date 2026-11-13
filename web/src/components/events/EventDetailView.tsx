"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AssetImage } from "@/components/ui/AssetImage";
import { CardCornerBadges } from "@/components/cards/CardCornerBadges";
import { CardDetailModal } from "@/components/cards/CardDetailModal";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { getCardName, getCharacterName } from "@/lib/i18n/display";
import type { CardDisplayItem } from "@/lib/cards";
import type { ResolvedEvent } from "@/lib/events";
import type { MessageKey } from "@/lib/i18n/messages";
import type { Locale } from "@/lib/i18n/types";
import { cn } from "@/lib/utils";

const EVENT_TYPE_KEYS = new Set(["challenge", "mission_live", "vs_live", "story"]);

function localizeName(name: { zh: string; ja: string; en: string }, locale: Locale) {
  if (locale === "zh") return name.zh;
  if (locale === "ja") return name.ja;
  return name.en;
}

function formatDateTime(iso: string, locale: Locale) {
  try {
    return new Intl.DateTimeFormat(locale === "ja" ? "ja-JP" : locale === "en" ? "en-US" : "zh-CN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function attrLabel(attr: string, locale: Locale) {
  const key = attr.toLowerCase();
  const map: Record<string, { zh: string; ja: string; en: string }> = {
    powerful: { zh: "力量", ja: "パワフル", en: "Powerful" },
    cool: { zh: "冷静", ja: "クール", en: "Cool" },
    pure: { zh: "纯净", ja: "ピュア", en: "Pure" },
    happy: { zh: "开心", ja: "ハッピー", en: "Happy" },
  };
  const entry = map[key];
  if (!entry) return attr;
  return locale === "zh" ? entry.zh : locale === "ja" ? entry.ja : entry.en;
}

export function EventDetailView({ event }: { event: ResolvedEvent }) {
  const { t, locale } = useLocale();
  const search = useSearchParams();
  const initial =
    search.get("server") === "jp"
      ? "jp"
      : search.get("server") === "cn"
        ? "cn"
        : event.schedules.cn
          ? "cn"
          : "jp";
  const [server, setServer] = useState<"cn" | "jp">(initial);
  const [lightbox, setLightbox] = useState<CardDisplayItem | null>(null);

  const schedule = event.schedules[server];
  const displays = useMemo(() => {
    return event.rewardCardItems
      .map((card) => {
        const trained = card.trained_file || card.trained_image;
        const untrained = card.untrained_file || card.untrained_image;
        const src = trained || untrained;
        if (!src) return null;
        return {
          key: `event-reward-${card.id}`,
          card,
          variant: (trained ? "trained" : "untrained") as "trained" | "untrained",
          src,
        };
      })
      .filter(Boolean) as CardDisplayItem[];
  }, [event.rewardCardItems]);

  return (
    <div className="museum-page event-detail">
      <section className="page-section relative pt-28 pb-8 sm:pt-32">
        <div className="relative page-container">
          <Link href={`/events/?server=${server}`} className="event-detail__back">
            ← {t("events.back")}
          </Link>

          <div className="event-detail__hero">
            <div className="event-detail__banner">
              {event.banner ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={event.banner} alt="" />
              ) : (
                <span className="home-pulse__event-fallback" />
              )}
            </div>
            <div className="event-detail__intro">
              <p className="hero-eyebrow">{t("events.detailEyebrow")}</p>
              <h1 className="event-detail__title">{localizeName(event.name, locale)}</h1>
              <p className="event-detail__type">
                {event.eventType
                  ? t(
                      (EVENT_TYPE_KEYS.has(event.eventType)
                        ? `events.type.${event.eventType}`
                        : "events.type.other") as MessageKey
                    )
                  : null}
              </p>

              <div className="home-pulse__tabs home-pulse__tabs--lg" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={server === "cn"}
                  disabled={!event.schedules.cn}
                  className={cn("home-pulse__tab", server === "cn" && "home-pulse__tab--active")}
                  onClick={() => setServer("cn")}
                >
                  {t("pulse.serverCn")}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={server === "jp"}
                  disabled={!event.schedules.jp}
                  className={cn("home-pulse__tab", server === "jp" && "home-pulse__tab--active")}
                  onClick={() => setServer("jp")}
                >
                  {t("pulse.serverJp")}
                </button>
              </div>

              {schedule ? (
                <dl className="event-detail__schedule">
                  <div>
                    <dt>{t("events.starts")}</dt>
                    <dd>{formatDateTime(schedule.startAt, locale)}</dd>
                  </div>
                  <div>
                    <dt>{t("events.ends")}</dt>
                    <dd>{formatDateTime(schedule.endAt, locale)}</dd>
                  </div>
                </dl>
              ) : (
                <p className="home-pulse__empty">{t("events.noSchedule")}</p>
              )}

              {event.schedules.jp && event.schedules.cn ? (
                <p className="event-detail__lag">{t("pulse.serverLagHint")}</p>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="page-section relative pb-10">
        <div className="relative page-container event-detail__panels">
          <div className="event-detail__panel">
            <h2 className="event-detail__panel-title">{t("events.bonusMembers")}</h2>
            {event.members.length === 0 ? (
              <p className="home-pulse__empty">{t("events.noMembers")}</p>
            ) : (
              <ul className="event-detail__members">
                {event.members.map(({ member, percent }) => (
                  <li key={member.id}>
                    <Link href={`/characters/${member.slug}/`} className="event-detail__member">
                      <span className="event-detail__member-art">
                        <AssetImage
                          src={member.portrait || member.standing}
                          alt=""
                          variant="thumb"
                          className="event-detail__member-img"
                        />
                      </span>
                      <span className="event-detail__member-copy">
                        <span className="event-detail__member-name">{getCharacterName(member, locale)}</span>
                        <span className="event-detail__member-bonus">+{percent}%</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="event-detail__panel">
            <h2 className="event-detail__panel-title">{t("events.bonusAttrs")}</h2>
            {event.attributes.length === 0 ? (
              <p className="home-pulse__empty">{t("events.noAttrs")}</p>
            ) : (
              <ul className="event-detail__attrs">
                {event.attributes.map((attr) => (
                  <li key={`${attr.attribute}-${attr.percent}`} className="event-detail__attr">
                    <span>{attrLabel(attr.attribute, locale)}</span>
                    <strong>+{attr.percent}%</strong>
                  </li>
                ))}
              </ul>
            )}
            <p className="event-detail__counts">
              {t("events.storyMusic")
                .replace("{stories}", String(event.storyCount))
                .replace("{musics}", String(event.musicCount))}
            </p>
          </div>
        </div>
      </section>

      <section className="page-section relative pb-16 sm:pb-20">
        <div className="relative page-container">
          <h2 className="event-detail__panel-title">{t("events.rewardCards")}</h2>
          {displays.length === 0 ? (
            <p className="home-pulse__empty">{t("events.noRewards")}</p>
          ) : (
            <ul className="event-detail__rewards">
              {displays.map((item) => (
                <li key={item.key}>
                  <button type="button" className="event-detail__reward" onClick={() => setLightbox(item)}>
                    <span className="event-detail__reward-art">
                      <AssetImage src={item.src} alt="" variant="mobile" className="event-detail__reward-img" />
                      <CardCornerBadges card={item.card} compact />
                    </span>
                    <span className="event-detail__reward-name">{getCardName(item.card, locale)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <CardDetailModal
        item={lightbox}
        items={displays}
        onSelectItem={setLightbox}
        onClose={() => setLightbox(null)}
        themeColor="#e9435e"
      />
    </div>
  );
}
