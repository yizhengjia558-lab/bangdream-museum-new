import { Suspense } from "react";
import { MusicPageView } from "@/components/music/MusicPageView";

export default function MusicPage() {
  return (
    <Suspense fallback={null}>
      <MusicPageView />
    </Suspense>
  );
}
