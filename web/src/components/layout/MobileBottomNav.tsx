"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { useFavorites } from "@/components/favorites/FavoritesProvider";
import { cn } from "@/lib/utils";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { t } = useLocale();
  const { count: favoriteCount } = useFavorites();

  const items = [
    { href: "/", label: t("nav.home"), match: (p: string) => p === "/" || p === "" },
    { href: "/bands/", label: t("nav.bands"), match: (p: string) => p.startsWith("/bands") },
    { href: "/costumes/", label: t("nav.costumes"), match: (p: string) => p.startsWith("/costumes") },
    {
      href: "/favorites/",
      label: t("nav.favorites"),
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
          >
            <span className="mobile-bottom-nav__label">
              {item.label}
              {item.badge && item.badge > 0 ? (
                <span className="mobile-bottom-nav__badge">{item.badge}</span>
              ) : null}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
