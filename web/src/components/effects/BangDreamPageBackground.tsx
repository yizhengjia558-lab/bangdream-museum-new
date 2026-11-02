"use client";

/** Lightweight page backdrop — gradient only, no scrolling text / diamond pattern. */
export function BangDreamPageBackground() {
  return (
    <div className="bd-page-bg bd-page-bg--lite" aria-hidden>
      <div className="bd-page-bg__gradient" />
      <div className="bd-page-bg__glow" />
      <div className="bd-page-bg__vignette" />
    </div>
  );
}
