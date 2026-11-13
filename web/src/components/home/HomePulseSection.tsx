"use client";

import { useState } from "react";
import Link from "next/link";
import { AssetImage } from "@/components/ui/AssetImage";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { getCardName, getCharacterName } from "@/lib/i18n/display";
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

export function HomePulseSection({ pulse }: { pulse: HomePulseData }) {
  const { t, locale } = useLocale();
  const [server, setServer] = useState<"cn" | "jp">("cn");
  const recentCards = pulse.recentByServer[server] || [];

  if (!pulse.events.length && !pulse.birthdays.length && !recentCards.length) {
    return null;
  }

  return (
    <section className="home-pulse page-section relative pt-2 pb-6 lg:pt-4 lg:pb-8">
      <div className="relative page-container">
        {pulse.events.length > 0 ? (
          <div className="home-pulse__events">
            <div className="home-pulse__head">
              <p className="hero-eyebrow">{t("pulse.eventsEyebrow")}</p>
              <h2 className="home-pulse__title">{t("pulse.eventsTitle")}</h2>
            </div>
            <div className="home-pulse__event-grid">
              {pulse.events.map((event) => (
                <a
                  key={`${event.server}-${event.id}`}
                  className="home-pulse__event"
                  href={`https://bestdori.com/info/events/${event.id}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className="home-pulse__event-banner">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={event.banner} alt="" loading="lazy" />
                    <span className="home-pulse__server-tag">{event.server.toUpperCase()}</span>
                  </span>
                  <span className="home-pulse__event-meta">
                    <span className="home-pulse__event-name">{localizeName(event.name, locale)}</span>
                    <span className="home-pulse__event-count">{formatCountdown(event.endAt, locale)}</span>
                  </span>
                </a>
              ))}
            </div>
          </div>
        ) : null}

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
            <div className="home-pulse__head home-pulse__head--split">
              <div>
                <p className="hero-eyebrow">{t("pulse.serverEyebrow")}</p>
                <h2 className="home-pulse__title">{t("pulse.serverTitle")}</h2>
              </div>
              <div className="home-pulse__tabs" role="tablist" aria-label={t("pulse.serverTitle")}>
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

            {recentCards.length === 0 ? (
              <p className="home-pulse__empty">{t("pulse.serverEmpty")}</p>
            ) : (
              <ul className="home-pulse__server-list">
                {recentCards.map(({ card, date }) => (
                  <li key={`${server}-${card.id}`}>
                    <Link href={`/bands/`} className="home-pulse__server-item">
                      <span className="home-pulse__server-thumb">
                        <AssetImage
                          src={
                            card.trained_file ||
                            card.trained_image ||
                            card.untrained_file ||
                            card.untrained_image
                          }
                          alt=""
                          variant="thumb"
                          className="home-pulse__server-img"
                        />
                      </span>
                      <span className="home-pulse__server-copy">
                        <span className="home-pulse__server-name">{getCardName(card, locale)}</span>
                        <span className="home-pulse__server-date">{date}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
