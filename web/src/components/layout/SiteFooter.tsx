"use client";

import Link from "next/link";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { VisitorCount } from "@/components/analytics/VisitorCount";

export function SiteFooter() {
  const { t } = useLocale();

  const links = [
    { href: "/", label: t("nav.home") },
    { href: "/bands/", label: t("nav.bands") },
    { href: "/costumes/", label: t("nav.costumes") },
    { href: "/events/", label: t("nav.events") },
    { href: "/forum/", label: t("nav.forum") },
    { href: "/championship/", label: t("nav.championship") },
    { href: "/favorites/", label: t("nav.favorites") },
  ];

  return (
    <footer className="site-footer">
      <div className="site-footer__inner page-container">
        <div className="site-footer__brand">
          <p className="site-footer__title">{t("footer.title")}</p>
          <p className="site-footer__subtitle">{t("footer.subtitle")}</p>
        </div>

        <nav className="site-footer__nav" aria-label={t("footer.title")}>
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="site-footer__link">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="site-footer__meta">
          <VisitorCount />
          <p className="site-footer__disclaimer">
            {t("footer.disclaimer")}
            <br />
            ©BanG Dream! Project ©Bushiroad
          </p>
        </div>
      </div>
    </footer>
  );
}
