"use client";

import { useEffect, useState } from "react";
import { useLenis } from "@/components/layout/SmoothScroll";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { cn } from "@/lib/utils";

function TopIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 19V5" />
      <path d="M5 12l7-7 7 7" />
    </svg>
  );
}

export function ScrollToTopButton() {
  const lenis = useLenis();
  const { t } = useLocale();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const threshold = 360;

    const update = (scrollY: number) => {
      setVisible(scrollY > threshold);
    };

    if (lenis) {
      update(lenis.scroll);
      const onScroll = ({ scroll }: { scroll: number }) => update(scroll);
      lenis.on("scroll", onScroll);
      return () => {
        lenis.off("scroll", onScroll);
      };
    }

    const onWindowScroll = () => update(window.scrollY);
    onWindowScroll();
    window.addEventListener("scroll", onWindowScroll, { passive: true });
    return () => window.removeEventListener("scroll", onWindowScroll);
  }, [lenis]);

  const scrollToTop = () => {
    if (lenis) {
      lenis.scrollTo(0, { duration: 1.1 });
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label={t("common.scrollToTop")}
      title={t("common.scrollToTop")}
      className={cn("scroll-top-btn chrome-pill-btn", visible && "scroll-top-btn--visible")}
    >
      <TopIcon />
      <span className="chrome-pill-btn-label">{t("common.scrollToTop")}</span>
    </button>
  );
}
