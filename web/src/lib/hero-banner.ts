import { getCharactersByBand } from "@/lib/data";
import { getBandCoverImage } from "@/lib/band-covers";
import { BAND_THEMES, type BandTheme } from "@/lib/themes";

export type HeroBannerSlide = {
  band: BandTheme;
  coverImage: string;
  href: string;
};

export function getHeroBannerSlides(): HeroBannerSlide[] {
  return BAND_THEMES.map((band) => ({
    band,
    coverImage: getBandCoverImage(getCharactersByBand(band.folder)),
    href: `/bands/${band.slug}/`,
  }));
}
