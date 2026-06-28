"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { useFavorites } from "@/components/favorites/FavoritesProvider";

export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const { t } = useLocale();
  const { count: favoriteCount } = useFavorites();

  const NAV = [
    { href: "/", label: t("nav.home"), match: (p: string) => p === "/" || p === "" },
    { href: "/bands/", label: t("nav.bands"), match: (p: string) => p.startsWith("/bands") },
    { href: "/favorites/", label: t("nav.favorites"), match: (p: string) => p.startsWith("/favorites") },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-6 pt-3 pl-28 pr-28 sm:px-8 sm:pl-36 sm:pr-36">
      <div
        className={cn(
          "glass-dock pointer-events-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 py-2.5 sm:gap-4 sm:px-6",
          scrolled && "glass-dock-scrolled py-2"
        )}
      >
        <Link href="/" className="flex shrink-0 items-center gap-3 rounded-full px-3 py-2 transition hover:bg-[var(--glass-hover)]">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#e9435e] to-[#ff6b8a] text-[10px] font-black text-white shadow-lg">
            BD
          </div>
          <span className="hidden font-[family-name:var(--font-subtitle-active)] text-xs font-bold tracking-[0.12em] text-[var(--text-primary)] sm:inline">
            BanG Dream!
          </span>
        </Link>

        <nav className="flex shrink-0 items-center gap-1 sm:gap-2">
          {NAV.map((item) => {
            const active = item.match(pathname);
            const isFavorites = item.href === "/favorites/";
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative rounded-full px-3 py-2 font-[family-name:var(--font-subtitle-active)] text-[10px] font-semibold tracking-[0.08em] uppercase transition-all duration-300 sm:px-4 sm:text-[11px] sm:tracking-[0.1em]",
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
        </nav>
      </div>
    </header>
  );
}
