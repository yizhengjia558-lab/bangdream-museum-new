import { notFound } from "next/navigation";
import { getAllCharacters, getCharacterById, getCharacterTheme } from "@/lib/data";
import { CharacterPageView } from "@/components/characters/CharacterPageView";

export function generateStaticParams() {
  return getAllCharacters().map((c) => ({ id: c.slug }));
}

export default async function CharacterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const character = getCharacterById(id);
  if (!character) notFound();

  const theme = getCharacterTheme(character);
  const primary = theme?.colors.primary ?? "#e9435e";
  const fallbackHref = theme ? `/bands/${theme.slug}/` : "/bands/";

  return (
    <div className="museum-page min-h-screen">
      <CharacterPageView character={character} theme={theme} primary={primary} fallbackHref={fallbackHref} />
    </div>
  );
}
