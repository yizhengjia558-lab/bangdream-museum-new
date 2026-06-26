import { getHeroRiverCards } from "@/lib/hero-cards";
import { HeroMainVisual } from "@/components/home/HeroMainVisual";
import { HomeBandsSection } from "@/components/home/HomeBandsSection";

export default function HomePage() {
  const riverCards = getHeroRiverCards(12);

  return (
    <div className="museum-page home-page">
      <HeroMainVisual riverCards={riverCards} />
      <HomeBandsSection />
    </div>
  );
}
