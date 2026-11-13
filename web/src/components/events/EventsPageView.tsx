"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useLocale } from "@/components/i18n/LocaleProvider";
import type { EventCatalogEntry } from "@/lib/events";
import type { Locale } from "@/lib/i18n/types";
import { cn } from "@/lib/utils";

function localizeName(name: { zh: string; ja: string; en: string }, locale: Locale) {
  if (locale === "zh") return name.zh;
  if (locale === "ja") return name.ja;
  return name.en;
}

function formatRange(startAt: string, endAt: string, locale: Locale) {
  try {
    const fmt = new Intl.DateTimeFormat(locale === "ja" ? "ja-JP" : locale === "en" ? "en-US" : "zh-CN", {
      month: "short",
      day: "numeric",
    });
    return `${fmt.format(new Date(startAt))} – ${fmt.format(new Date(endAt))}`;
  } catch {
    return `${startAt.slice(0, 10)} – ${endAt.slice(0, 10)}`;
  }
}

function statusOf(startAt: string, endAt: string, now: number) {
  const start = Date.parse(startAt);
  const end = Date.parse(endAt);
  if (now < start) return "upcoming" as const;
  if (now > end) return "ended" as const;
  return "active" as const;
}

export function EventsPageView({ events }: { events: EventCatalogEntry[] }) {
  const { t, locale } = useLocale();
  const search = useSearchParams();
  const initial = search.get("server") === "jp" ? "jp" : "cn";
  const [server, setServer] = useState<"cn" | "jp">(initial);
  const now = Date.now();

  const list = useMemo(() => {
    return events
      .filter((event) => Boolean(event.schedules[server]))
      .map((event) => {
        const sk = event.schedules[server]!;
        return { event, sk, status: statusOf(sk.startAt, sk.endAt, now) };
      })
      .sort((a, b) => {
        const rank = { active: 0, upcoming: 1, ended: 2 } as const;
        if (rank[a.status] !== rank[b.status]) return rank[a.status] - rank[b.status];
        return b.sk.endAt.localeCompare(a.sk.endAt);
      });
  }, [events, server, now]);

  return (
    <div className="museum-page events-page">
      <section className="page-section relative pt-28 pb-10 sm:pt-32 sm:pb-14">
        <div className="relative page-container">
          <div className="events-page__hero">
            <SectionHeading title={t("events.title")} subtitle={t("events.subtitle")} />
            <div className="home-pulse__tabs home-pulse__tabs--lg" role="tablist">
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
            <p className="events-page__hint">{t("pulse.serverLagHint")}</p>
          </div>

          {list.length === 0 ? (
            <p className="home-pulse__empty">{t("events.empty")}</p>
          ) : (
            <ul className="events-page__grid">
              {list.map(({ event, sk, status }) => (
                <li key={`${server}-${event.id}`}>
                  <Link href={`/events/${event.id}/?server=${server}`} className="events-page__card">
                    <span className="events-page__banner">
                      {event.banner ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={event.banner} alt="" loading="lazy" />
                      ) : (
                        <span className="home-pulse__event-fallback" />
                      )}
                      <span className={cn("events-page__status", `events-page__status--${status}`)}>
                        {status === "active"
                          ? t("events.status.active")
                          : status === "upcoming"
                            ? t("events.status.upcoming")
                            : t("events.status.ended")}
                      </span>
                    </span>
                    <span className="events-page__meta">
                      <span className="events-page__name">{localizeName(event.name, locale)}</span>
                      <span className="events-page__range">{formatRange(sk.startAt, sk.endAt, locale)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
