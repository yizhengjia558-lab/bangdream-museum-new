"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { useGlobalSearch } from "@/components/search/GlobalSearchProvider";
import { AssetImage } from "@/components/ui/AssetImage";
import { BandLogo } from "@/components/ui/BandLogo";
import { isCardListPath, searchNavigation, type NavSearchHit } from "@/lib/card-search";
import { getBandBySlug } from "@/lib/themes";
import { cn } from "@/lib/utils";

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="global-search-icon" aria-hidden>
      <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M20 20l-3.5-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg viewBox="0 0 24 24" className="global-search-clear-icon" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function SearchHitThumb({ hit }: { hit: NavSearchHit }) {
  if (hit.thumbKind === "band-logo" && hit.bandSlug) {
    const band = getBandBySlug(hit.bandSlug);
    if (band) {
      return (
        <span className="global-search-result-thumb global-search-result-thumb--logo">
          <BandLogo band={band} size="sm" />
        </span>
      );
    }
  }

  if (hit.thumbKind === "image" && hit.thumb) {
    return (
      <span className="global-search-result-thumb">
        <AssetImage src={hit.thumb} alt="" variant="thumb" className="global-search-result-thumb__img" />
      </span>
    );
  }

  return (
    <span className="global-search-result-thumb global-search-result-thumb--fallback" aria-hidden>
      {hit.type === "page" ? "✦" : hit.label.slice(0, 1)}
    </span>
  );
}

export function GlobalSearchBar({ className }: { className?: string }) {
  const inputId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();
  const { t, locale } = useLocale();
  const { query, setQuery, clearQuery, hasQuery } = useGlobalSearch();
  const [focused, setFocused] = useState(false);
  const [open, setOpen] = useState(false);

  const onCardPage = isCardListPath(pathname);
  const navHits = useMemo(
    () => (hasQuery ? searchNavigation(query, 8, locale) : []),
    [hasQuery, query, locale]
  );
  const showDropdown = open && hasQuery && !onCardPage;

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const typeLabel = (type: "band" | "character" | "page") =>
    type === "band" ? t("search.typeBand") : type === "character" ? t("search.typeMember") : t("search.typePage");

  return (
    <div ref={rootRef} className={cn("global-search", className)}>
      <motion.label
        htmlFor={inputId}
        className={cn("global-search-field", focused && "global-search-field--focused", hasQuery && "global-search-field--filled")}
        animate={focused ? { scale: 1.01 } : { scale: 1 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      >
        <SearchIcon />
        <input
          ref={inputRef}
          id={inputId}
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setFocused(true);
            if (hasQuery) setOpen(true);
          }}
          onBlur={() => setFocused(false)}
          placeholder={t("search.placeholder")}
          className="global-search-input"
          autoComplete="off"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls={`${inputId}-results`}
        />
        {hasQuery && (
          <button
            type="button"
            className="global-search-clear"
            aria-label={t("search.clear")}
            onClick={() => {
              clearQuery();
              setOpen(false);
              inputRef.current?.focus();
            }}
          >
            <ClearIcon />
          </button>
        )}
      </motion.label>

      {showDropdown && (
        <ul id={`${inputId}-results`} className="global-search-results" role="listbox">
          {navHits.length === 0 ? (
            <li className="global-search-empty cute-empty cute-empty--inline">
              <span className="cute-empty__doodle cute-empty__doodle--star" aria-hidden />
              <span className="cute-empty__title">{t("search.noResults")}</span>
            </li>
          ) : (
            navHits.map((hit) => (
              <li key={`${hit.type}-${hit.href}`} role="option">
                <Link
                  href={hit.href}
                  className="global-search-result"
                  onClick={() => {
                    setOpen(false);
                  }}
                >
                  <SearchHitThumb hit={hit} />
                  <span className="global-search-result-body">
                    <span className="global-search-result-label">{hit.label}</span>
                    <span className="global-search-result-sub">{hit.sublabel}</span>
                  </span>
                  <span className="global-search-result-type">{typeLabel(hit.type)}</span>
                </Link>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
