import { Suspense } from "react";
import { CostumesPageView } from "@/components/costumes/CostumesPageView";

export default function CostumesPage() {
  return (
    <div className="museum-page relative min-h-screen pb-24">
      <Suspense fallback={null}>
        <CostumesPageView />
      </Suspense>
    </div>
  );
}
