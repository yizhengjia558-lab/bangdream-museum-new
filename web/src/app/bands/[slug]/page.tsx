import { notFound, redirect } from "next/navigation";
import { getBandWithMembers } from "@/lib/data-server";
import { BAND_THEMES, OTHER_BAND_REDIRECTS } from "@/lib/themes";
import { BandDetailView } from "@/components/bands/BandDetailView";

export function generateStaticParams() {
  return [
    ...BAND_THEMES.map((b) => ({ slug: b.slug })),
    ...Object.keys(OTHER_BAND_REDIRECTS).map((slug) => ({ slug })),
  ];
}

export default async function BandDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const redirectTo = OTHER_BAND_REDIRECTS[slug];
  if (redirectTo) redirect(`/bands/${redirectTo}/`);

  const band = getBandWithMembers(slug);
  if (!band) notFound();

  return <BandDetailView band={band} />;
}
