import { getHeroRiverCards, getHomeBandsData } from "@/lib/data-server";
import { HeroMainVisual } from "@/components/home/HeroMainVisual";
import { HomeBandsSection } from "@/components/home/HomeBandsSection";
import { BAND_THEMES } from "@/lib/themes";
import type { HeroBannerSlide } from "@/lib/hero-banner";

export default function HomePage() {
  const riverCards = getHeroRiverCards();
  const homeBands = getHomeBandsData();
  const bannerSlides: HeroBannerSlide[] = homeBands.flatMap((entry) => {
    const band = BAND_THEMES.find((theme) => theme.slug === entry.slug);
    if (!band) return [];
    return [{ band, coverImage: entry.coverImage, href: `/bands/${band.slug}/` }];
  });

  return (
    <div className="museum-page home-page">
      <HeroMainVisual riverCards={riverCards} bannerSlides={bannerSlides} />
      <HomeBandsSection bands={homeBands} />
    </div>
  );
}
