"use client";

import { useLocale } from "@/components/i18n/LocaleProvider";
import { cn } from "@/lib/utils";

export function CardVariantBadge({ variant }: { variant: "untrained" | "trained" }) {
  const { t } = useLocale();
  const label = variant === "trained" ? t("card.trained") : t("card.untrained");

  return (
    <div className="card-variant-header">
      <span
        className={cn(
          "card-variant-badge",
          variant === "trained" ? "card-variant-badge--trained" : "card-variant-badge--untrained"
        )}
      >
        {label}
      </span>
    </div>
  );
}
