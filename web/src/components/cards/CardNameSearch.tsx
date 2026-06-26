"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { filterCardDisplaysByName, type CardDisplayItem } from "@/lib/cards";
import { cn } from "@/lib/utils";

export function CardNameSearch({
  displays,
  themeColor = "#e9435e",
  onJump,
  variant = "default",
}: {
  displays: CardDisplayItem[];
  themeColor?: string;
  onJump: (key: string) => void;
  variant?: "default" | "compact";
}) {
  const { t } = useLocale();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const results = useMemo(() => filterCardDisplaysByName(displays, query), [displays, query]);
  const showDropdown = open && query.trim().length > 0;

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const jump = (key: string) => {
    onJump(key);
    setOpen(false);
    inputRef.current?.blur();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown) {
      if (e.key === "Enter" && results.length > 0) jump(results[0].key);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, Math.max(results.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[activeIndex]) jump(results[activeIndex].key);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div
      ref={rootRef}
      className={cn("card-search", variant === "compact" ? "card-search--compact" : "mb-10")}
    >
      <label htmlFor={listId} className="sr-only">
        {t("card.searchPlaceholder")}
      </label>
      <div className={cn("card-search-field", variant === "compact" ? "card-search-field--compact" : "glass-panel")}>
        <span className="card-search-icon" aria-hidden>
          ⌕
        </span>
        <input
          ref={inputRef}
          id={listId}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={t("card.searchPlaceholder")}
          className="card-search-input"
          autoComplete="off"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls={`${listId}-listbox`}
          aria-autocomplete="list"
        />
      </div>
      {variant === "default" && <p className="card-search-hint">{t("card.searchHint")}</p>}

      {showDropdown && (
        <ul
          id={`${listId}-listbox`}
          role="listbox"
          className={cn("card-search-results glass-panel", variant === "compact" && "card-search-results--compact")}
          aria-label={t("card.jumpTo")}
        >
          {results.length === 0 ? (
            <li className="card-search-empty">{t("card.searchNoResults")}</li>
          ) : (
            results.map((item, index) => {
              const variantLabel = item.variant === "trained" ? t("card.trained") : t("card.untrained");
              return (
                <li key={item.key} role="option" aria-selected={index === activeIndex}>
                  <button
                    type="button"
                    className={cn("card-search-result", index === activeIndex && "card-search-result--active")}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => jump(item.key)}
                  >
                    <span className="card-search-result-name">{item.card.card_name}</span>
                    <span className="card-search-result-meta">
                      <span className="card-search-result-variant" style={{ color: themeColor }}>
                        {variantLabel}
                      </span>
                      <span className="card-search-result-rarity">{item.card.rarity}</span>
                    </span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
