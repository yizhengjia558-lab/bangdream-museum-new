import { notFound } from "next/navigation";
import { getCharacterById, getCharacterSlugs, getCharacterTheme, getCharactersByBand } from "@/lib/data-server";
import { CharacterPageView } from "@/components/characters/CharacterPageView";

export function generateStaticParams() {
  return getCharacterSlugs().map((id) => ({ id }));
}

export default async function CharacterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const character = getCharacterById(id);
  if (!character) notFound();

  const theme = getCharacterTheme(character);
  const primary = theme?.colors.primary ?? "#e9435e";
  const fallbackHref = theme ? `/bands/${theme.slug}/` : "/bands/";
  const bandMembers = theme ? getCharactersByBand(theme.folder) : [];

  return (
    <div className="museum-page character-page min-h-screen">
      <CharacterPageView
        character={character}
        theme={theme}
        primary={primary}
        fallbackHref={fallbackHref}
        bandMembers={bandMembers}
      />
    </div>
  );
}
