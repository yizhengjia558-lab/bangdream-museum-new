"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { cn } from "@/lib/utils";

interface BandBackButtonProps {
  color: string;
  fallbackHref?: string;
  className?: string;
}

function BackIcon() {
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
      <path d="M19 12H5" />
      <path d="M12 19l-7-7 7-7" />
    </svg>
  );
}

export function BandBackButton({ color, fallbackHref = "/bands/", className }: BandBackButtonProps) {
  const router = useRouter();
  const { t } = useLocale();

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      aria-label={t("back")}
      className={cn("band-back-btn band-back-btn--fixed", className)}
      style={{ backgroundColor: color }}
    >
      <BackIcon />
      <span className="band-back-btn-label">{t("back")}</span>
    </button>
  );
}
