"use client";

import Link from "next/link";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { useLocale } from "@/components/i18n/LocaleProvider";

export function SiteFooter() {
  const { t } = useLocale();

  return (
    <footer className="relative mt-auto page-section pb-10 pt-16">
      <div className="page-container max-w-4xl">
        <GlassPanel className="px-10 py-10 text-center sm:px-12 sm:py-12">
          <p className="font-[family-name:var(--font-subtitle-active)] text-sm font-bold tracking-[0.15em] text-[var(--text-primary)]">
            {t("footer.title")}
          </p>
          <p className="mt-2 font-[family-name:var(--font-body-active)] text-xs text-[var(--text-muted)]">
            {t("footer.subtitle")}
          </p>
          <nav className="mt-6 flex justify-center gap-6">
            <Link
              href="/"
              className="text-[11px] font-semibold tracking-[0.12em] text-[var(--text-muted)] uppercase transition hover:text-[var(--brand-pink)]"
            >
              {t("nav.home")}
            </Link>
            <Link
              href="/bands/"
              className="text-[11px] font-semibold tracking-[0.12em] text-[var(--text-muted)] uppercase transition hover:text-[var(--brand-pink)]"
            >
              {t("nav.bands")}
            </Link>
          </nav>
          <p className="mt-8 text-[10px] leading-relaxed text-[var(--text-muted)]">
            {t("footer.disclaimer")}
            <br />
            ©BanG Dream! Project ©Bushiroad
          </p>
        </GlassPanel>
      </div>
    </footer>
  );
}
