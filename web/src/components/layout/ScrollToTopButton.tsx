"use client";

import { useEffect, useState } from "react";
import { useLenis } from "@/components/layout/SmoothScroll";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { cn } from "@/lib/utils";

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
      className={cn(
        "scroll-top-btn chrome-sticker-btn",
        visible && "scroll-top-btn--visible"
      )}
    >
      <span className="chrome-sticker-btn__glyph" aria-hidden>
        ★
      </span>
      <span className="chrome-sticker-btn__label">{t("common.scrollToTop")}</span>
    </button>
  );
}
