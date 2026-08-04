"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { useFavorites } from "@/components/favorites/FavoritesProvider";
import { GlobalSearchBar } from "@/components/search/GlobalSearchBar";
import { AuthNavButton } from "@/components/auth/AuthModal";

export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const { t } = useLocale();
  const { count: favoriteCount } = useFavorites();

  const NAV = [
    { href: "/", label: t("nav.home"), match: (p: string) => p === "/" || p === "" },
    { href: "/bands/", label: t("nav.bands"), match: (p: string) => p.startsWith("/bands") },
    { href: "/forum/", label: t("nav.forum"), match: (p: string) => p.startsWith("/forum") },
    { href: "/favorites/", label: t("nav.favorites"), match: (p: string) => p.startsWith("/favorites") },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-2.5 pt-2 pl-[4.75rem] pr-[4.75rem] sm:px-6 sm:pt-3 sm:pl-32 sm:pr-32">
      <div
        className={cn(
          "glass-dock global-header-dock pointer-events-auto w-full max-w-5xl",
          scrolled && "glass-dock-scrolled"
        )}
      >
        <div className="global-header-top">
          <Link href="/" className="global-header-logo flex shrink-0 items-center gap-2.5 rounded-full px-2 py-1.5 transition hover:bg-[var(--glass-hover)] sm:gap-3 sm:px-3 sm:py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#e9435e] to-[#ff6b8a] text-[10px] font-black text-white shadow-lg">
              BD
            </div>
            <span className="hidden font-[family-name:var(--font-subtitle-active)] text-xs font-bold tracking-[0.12em] text-[var(--text-primary)] md:inline">
              BanG Dream!
            </span>
          </Link>

          <GlobalSearchBar className="global-search--header" />

          <nav className="global-header-nav flex shrink-0 items-center gap-0.5 sm:gap-1">
            {NAV.map((item) => {
              const active = item.match(pathname);
              const isFavorites = item.href === "/favorites/";
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative rounded-full px-2.5 py-2 font-[family-name:var(--font-subtitle-active)] text-[9px] font-semibold tracking-[0.06em] uppercase transition-all duration-300 sm:px-3.5 sm:text-[10px] sm:tracking-[0.08em] lg:px-4 lg:text-[11px]",
                    active
                      ? "bg-[var(--glass-active)] text-[var(--text-primary)] shadow-inner"
                      : "text-[var(--text-secondary)] hover:bg-[var(--glass-hover)] hover:text-[var(--text-primary)]"
                  )}
                >
                  {item.label}
                  {isFavorites && favoriteCount > 0 && (
                    <span className="nav-favorites-badge">{favoriteCount}</span>
                  )}
                </Link>
              );
            })}
            <AuthNavButton className="ml-1" />
          </nav>
        </div>
      </div>
    </header>
  );
}
