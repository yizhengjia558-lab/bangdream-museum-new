import { getHeroRiverCards } from "@/lib/hero-cards";
import { getHeroBannerSlides } from "@/lib/hero-banner";
import { HeroMainVisual } from "@/components/home/HeroMainVisual";
import { HomeBandsSection } from "@/components/home/HomeBandsSection";

export default function HomePage() {
  const riverCards = getHeroRiverCards(12);
  const bannerSlides = getHeroBannerSlides();

  return (
    <div className="museum-page home-page">
      <HeroMainVisual riverCards={riverCards} bannerSlides={bannerSlides} />
      <HomeBandsSection />
    </div>
  );
}
