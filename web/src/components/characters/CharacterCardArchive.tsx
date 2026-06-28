"use client";

import { CardGallery } from "@/components/cards/CardGallery";
import type { CardData, CharacterData } from "@/lib/data";

export function CharacterCardArchive({
  cards,
  themeColor,
  visible,
  onVisibleChange,
  highlightKey,
  members = [],
}: {
  cards: CardData[];
  themeColor: string;
  visible: number;
  onVisibleChange: (visible: number) => void;
  highlightKey: string | null;
  members?: CharacterData[];
}) {
  return (
    <CardGallery
      cards={cards}
      themeColor={themeColor}
      visible={visible}
      onVisibleChange={onVisibleChange}
      highlightKey={highlightKey}
      members={members}
      showFilters
    />
  );
}
