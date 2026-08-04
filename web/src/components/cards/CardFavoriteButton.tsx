"use client";

import { useLocale } from "@/components/i18n/LocaleProvider";
import { useFavorites } from "@/components/favorites/FavoritesProvider";
import type { CardData } from "@/lib/data-types";
import type { CardVariant } from "@/lib/cards";
import { cn } from "@/lib/utils";

export function CardFavoriteButton({
  displayKey,
  card,
  variant,
  className,
}: {
  displayKey: string;
  card?: CardData;
  variant?: CardVariant;
  className?: string;
}) {
  const { t } = useLocale();
  const { isFavorite, toggleFavorite } = useFavorites();
  const active = isFavorite(displayKey);

  return (
    <button
      type="button"
      className={cn("card-favorite-btn", active && "card-favorite-btn--active", className)}
      aria-label={active ? t("favorites.remove") : t("favorites.add")}
      aria-pressed={active}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        toggleFavorite(displayKey, card, variant);
      }}
    >
      <svg viewBox="0 0 24 24" className="card-favorite-icon" aria-hidden>
        {active ? (
          <path
            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
            fill="currentColor"
          />
        ) : (
          <path
            d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z"
            fill="currentColor"
          />
        )}
      </svg>
    </button>
  );
}
