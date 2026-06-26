import { notFound } from "next/navigation";
import { getBandWithMembers } from "@/lib/data";
import { BAND_THEMES } from "@/lib/themes";
import { BandDetailView } from "@/components/bands/BandDetailView";

export function generateStaticParams() {
  return BAND_THEMES.map((b) => ({ slug: b.slug }));
}

export default async function BandDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const band = getBandWithMembers(slug);
  if (!band) notFound();

  return <BandDetailView band={band} />;
}
