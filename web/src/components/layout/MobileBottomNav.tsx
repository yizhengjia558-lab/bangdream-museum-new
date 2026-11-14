"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { useFavorites } from "@/components/favorites/FavoritesProvider";
import { useMusicPlayer } from "@/components/music/MusicPlayerProvider";
import { cn } from "@/lib/utils";

type NavIconName = "home" | "bands" | "music" | "costumes" | "favorites";

function NavIcon({ name }: { name: NavIconName }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    className: "mobile-bottom-nav__icon",
  };

  if (name === "home") {
    return (
      <svg {...common}>
        <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" />
      </svg>
    );
  }
  if (name === "bands") {
    return (
      <svg {...common}>
        <path d="M9 18V6l10-2v12" />
        <circle cx="7" cy="18" r="2.2" />
        <circle cx="17" cy="16" r="2.2" />
      </svg>
    );
  }
  if (name === "music") {
    return (
      <svg {...common}>
        <path d="M9 18V5l11-2v13" />
        <circle cx="7" cy="18" r="2.4" />
        <circle cx="18" cy="16" r="2.4" />
      </svg>
    );
  }
  if (name === "costumes") {
    return (
      <svg {...common}>
        <path d="M8 4h8l2 4-4 2v10H10V10L6 8l2-4Z" />
        <path d="M10 10h4" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M12 20s-7-4.35-7-9.2A3.8 3.8 0 0 1 12 8.2 3.8 3.8 0 0 1 19 10.8C19 15.65 12 20 12 20Z" />
    </svg>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const { t } = useLocale();
  const { count: cardFavoriteCount } = useFavorites();
  const { favoriteIds } = useMusicPlayer();
  const favoriteCount = cardFavoriteCount + favoriteIds.length;

  const items = [
    { href: "/", label: t("nav.home"), icon: "home" as const, match: (p: string) => p === "/" || p === "" },
    { href: "/bands/", label: t("nav.bands"), icon: "bands" as const, match: (p: string) => p.startsWith("/bands") },
    { href: "/music/", label: t("nav.music"), icon: "music" as const, match: (p: string) => p.startsWith("/music") },
    {
      href: "/costumes/",
      label: t("nav.costumes"),
      icon: "costumes" as const,
      match: (p: string) => p.startsWith("/costumes"),
    },
    {
      href: "/favorites/",
      label: t("nav.favorites"),
      icon: "favorites" as const,
      match: (p: string) => p.startsWith("/favorites"),
      badge: favoriteCount,
    },
  ];

  return (
    <nav className="mobile-bottom-nav" aria-label={t("nav.home")}>
      {items.map((item) => {
        const active = item.match(pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn("mobile-bottom-nav__item", active && "mobile-bottom-nav__item--active")}
            aria-current={active ? "page" : undefined}
          >
            <span className="mobile-bottom-nav__icon-wrap">
              <NavIcon name={item.icon} />
              {item.badge && item.badge > 0 ? (
                <span className="mobile-bottom-nav__badge">{item.badge}</span>
              ) : null}
            </span>
            <span className="mobile-bottom-nav__label">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
