"use client";

const SCROLL_ROWS = 6;
const ROW_TEXT = "BanG Dream!  ";

/** Global BanG Dream band-formation style background (gradient + diamonds + scrolling tilt text). */
export function BangDreamPageBackground() {
  return (
    <div className="bd-page-bg" aria-hidden>
      <div className="bd-page-bg__gradient" />
      <div className="bd-page-bg__diamonds" />
      <div className="bd-page-bg__glow" />

      <div className="bd-page-bg__scroll bd-page-bg__scroll--forward">
        {Array.from({ length: SCROLL_ROWS }, (_, i) => (
          <div key={`f-${i}`} className="bd-page-bg__scroll-row" style={{ ["--row-i" as string]: i }}>
            <span>{ROW_TEXT.repeat(14)}</span>
            <span aria-hidden>{ROW_TEXT.repeat(14)}</span>
          </div>
        ))}
      </div>

      <div className="bd-page-bg__scroll bd-page-bg__scroll--reverse">
        {Array.from({ length: SCROLL_ROWS - 1 }, (_, i) => (
          <div key={`r-${i}`} className="bd-page-bg__scroll-row bd-page-bg__scroll-row--alt" style={{ ["--row-i" as string]: i }}>
            <span>{ROW_TEXT.repeat(12)}</span>
            <span aria-hidden>{ROW_TEXT.repeat(12)}</span>
          </div>
        ))}
      </div>

      <div className="bd-page-bg__stars" />
      <div className="bd-page-bg__vignette" />
    </div>
  );
}
