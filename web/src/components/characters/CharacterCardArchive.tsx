"use client";

import { CardGallery } from "@/components/cards/CardGallery";
import type { CardData } from "@/lib/data";

export function CharacterCardArchive({
  cards,
  themeColor,
  visible,
  onVisibleChange,
  highlightKey,
}: {
  cards: CardData[];
  themeColor: string;
  visible: number;
  onVisibleChange: (visible: number) => void;
  highlightKey: string | null;
}) {
  return (
    <CardGallery
      cards={cards}
      themeColor={themeColor}
      visible={visible}
      onVisibleChange={onVisibleChange}
      highlightKey={highlightKey}
    />
  );
}
