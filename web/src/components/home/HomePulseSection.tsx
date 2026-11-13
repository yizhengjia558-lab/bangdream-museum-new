"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AssetImage } from "@/components/ui/AssetImage";
import { CardCornerBadges } from "@/components/cards/CardCornerBadges";
import { CardDetailModal } from "@/components/cards/CardDetailModal";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { getCardName, getCharacterName } from "@/lib/i18n/display";
import type { CardDisplayItem } from "@/lib/cards";
import type { HomePulseData } from "@/lib/home-pulse";
import type { Locale } from "@/lib/i18n/types";
import { cn } from "@/lib/utils";

function localizeName(name: { zh: string; ja: string; en: string }, locale: Locale) {
  if (locale === "zh") return name.zh;
  if (locale === "ja") return name.ja;
  return name.en;
}

function formatCountdown(endAt: string, locale: Locale) {
  const ms = Date.parse(endAt) - Date.now();
  if (!Number.isFinite(ms) || ms <= 0) {
    return locale === "ja" ? "終了" : locale === "en" ? "Ended" : "已结束";
  }
  const days = Math.floor(ms / 864e5);
  const hours = Math.floor((ms % 864e5) / 36e5);
  if (locale === "ja") return `残り ${days}日 ${hours}時間`;
  if (locale === "en") return `${days}d ${hours}h left`;
  return `剩余 ${days} 天 ${hours} 小时`;
}

function formatBirthday(md: string, locale: Locale) {
  const [mm, dd] = md.split("-").map(Number);
  try {
    return new Intl.DateTimeFormat(locale === "ja" ? "ja-JP" : locale === "en" ? "en-US" : "zh-CN", {
      month: "short",
      day: "numeric",
    }).format(new Date(Date.UTC(2020, mm - 1, dd)));
  } catch {
    return md;
  }
}

function cardArt(card: HomePulseData["recentByServer"]["cn"][number]["card"]) {
  return card.trained_file || card.trained_image || card.untrained_file || card.untrained_image;
}

export function HomePulseSection({ pulse }: { pulse: HomePulseData }) {
  const { t, locale } = useLocale();
  const [server, setServer] = useState<"cn" | "jp">("cn");
  const [lightbox, setLightbox] = useState<CardDisplayItem | null>(null);

  const events = pulse.eventsByServer[server] || [];
  const recentCards = pulse.recentByServer[server] || [];

  const displays = useMemo(() => {
    return recentCards
      .map(({ card, date }) => {
        const src = cardArt(card);
        if (!src) return null;
        return {
          key: `pulse-${server}-${card.id}`,
          card,
          variant: (card.trained_file || card.trained_image ? "trained" : "untrained") as "trained" | "untrained",
          src,
          date,
        } satisfies CardDisplayItem & { date: string };
      })
      .filter(Boolean) as Array<CardDisplayItem & { date: string }>;
  }, [recentCards, server]);

  if (!events.length && !pulse.birthdays.length && !displays.length) {
    return null;
  }

  return (
    <section className="home-pulse page-section relative pt-2 pb-6 lg:pt-4 lg:pb-8">
      <div className="relative page-container">
        <div className="home-pulse__server-bar">
          <div className="home-pulse__server-copy">
            <p className="hero-eyebrow">{t("pulse.serverEyebrow")}</p>
            <h2 className="home-pulse__title">{t("pulse.serverSwitchTitle")}</h2>
            <p className="home-pulse__hint">{t("pulse.serverLagHint")}</p>
          </div>
          <div className="home-pulse__tabs home-pulse__tabs--lg" role="tablist" aria-label={t("pulse.serverSwitchTitle")}>
            <button
              type="button"
              role="tab"
              aria-selected={server === "cn"}
              className={cn("home-pulse__tab", server === "cn" && "home-pulse__tab--active")}
              onClick={() => setServer("cn")}
            >
              {t("pulse.serverCn")}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={server === "jp"}
              className={cn("home-pulse__tab", server === "jp" && "home-pulse__tab--active")}
              onClick={() => setServer("jp")}
            >
              {t("pulse.serverJp")}
            </button>
          </div>
        </div>

        <div className="home-pulse__events">
          <div className="home-pulse__head home-pulse__head--split">
            <div>
              <p className="hero-eyebrow">{t("pulse.eventsEyebrow")}</p>
              <h2 className="home-pulse__title">{t("pulse.eventsTitle")}</h2>
            </div>
            <Link href={`/events/?server=${server}`} className="home-pulse__more">
              {t("pulse.eventsMore")}
            </Link>
          </div>

          {events.length === 0 ? (
            <p className="home-pulse__empty">{t("pulse.eventsEmpty")}</p>
          ) : (
            <div className="home-pulse__event-grid">
              {events.map((event) => (
                <Link
                  key={`${event.server}-${event.id}`}
                  className="home-pulse__event"
                  href={`/events/${event.id}/?server=${server}`}
                >
                  <span className="home-pulse__event-banner">
                    {event.banner ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={event.banner} alt="" loading="lazy" />
                    ) : (
                      <span className="home-pulse__event-fallback" aria-hidden />
                    )}
                    <span className="home-pulse__server-tag">{server.toUpperCase()}</span>
                  </span>
                  <span className="home-pulse__event-meta">
                    <span className="home-pulse__event-name">{localizeName(event.name, locale)}</span>
                    <span className="home-pulse__event-count">{formatCountdown(event.endAt, locale)}</span>
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="home-pulse__row">
          {pulse.birthdays.length > 0 ? (
            <div className="home-pulse__birthdays">
              <div className="home-pulse__head">
                <p className="hero-eyebrow">{t("pulse.birthdayEyebrow")}</p>
                <h2 className="home-pulse__title">{t("pulse.birthdayTitle")}</h2>
              </div>
              <ul className="home-pulse__birthday-list">
                {pulse.birthdays.map((entry) => (
                  <li key={entry.id}>
                    <Link href={`/characters/${entry.member.slug}/`} className="home-pulse__birthday">
                      <span className="home-pulse__birthday-avatar">
                        <AssetImage
                          src={entry.member.portrait || entry.member.standing}
                          alt=""
                          variant="thumb"
                          className="home-pulse__birthday-img"
                        />
                      </span>
                      <span className="home-pulse__birthday-copy">
                        <span className="home-pulse__birthday-name">
                          {getCharacterName(entry.member, locale)}
                        </span>
                        <span className="home-pulse__birthday-date">
                          {formatBirthday(entry.birthday, locale)}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="home-pulse__servers">
            <div className="home-pulse__head">
              <p className="hero-eyebrow">{t("pulse.serverEyebrow")}</p>
              <h2 className="home-pulse__title">{t("pulse.serverTitle")}</h2>
            </div>

            {displays.length === 0 ? (
              <p className="home-pulse__empty">{t("pulse.serverEmpty")}</p>
            ) : (
              <ul className="home-pulse__card-grid">
                {displays.map((item) => (
                  <li key={item.key}>
                    <button
                      type="button"
                      className="home-pulse__card"
                      onClick={() => setLightbox(item)}
                    >
                      <span className="home-pulse__card-art">
                        <AssetImage
                          src={item.src}
                          alt=""
                          variant="mobile"
                          className="home-pulse__card-img"
                        />
                        <CardCornerBadges card={item.card} compact />
                      </span>
                      <span className="home-pulse__card-meta">
                        <span className="home-pulse__card-name">{getCardName(item.card, locale)}</span>
                        <span className="home-pulse__card-date">{item.date}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <CardDetailModal
        item={lightbox}
        items={displays}
        onSelectItem={setLightbox}
        onClose={() => setLightbox(null)}
        themeColor="#e9435e"
      />
    </section>
  );
}
