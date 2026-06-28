#!/usr/bin/env python3
"""Build card enrichment map from Bestdori for filters (attribute, type, stars)."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

from bestdori.cards import get_all as get_cards

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "web" / "src" / "data" / "card-enrichment.json"
INDEX = ROOT / "Bandori" / "all_characters.json"

ATTR_MAP = {
    "powerful": "power",
    "cool": "cool",
    "pure": "pure",
    "happy": "happy",
}

KIND_LIMITED_TYPES = {"limited", "dreamfes", "kirafes"}


def norm(text: str | None) -> str:
    if not text:
        return ""
    return re.sub(r"\s+", "", text).lower()


def card_kind(type_: str, event: str, card_name: str) -> str:
    blob = f"{card_name} {event}"
    if type_ == "birthday" or "生日" in blob:
        return "birthday"
    if "联动" in blob or "コラボ" in blob or "Lawson" in blob or "ローソン" in blob:
        return "collab"
    if type_ in KIND_LIMITED_TYPES or "限定" in blob:
        return "limited"
    return "normal"


def release_year(release_date: str) -> int | None:
    if not release_date or len(release_date) < 4:
        return None
    try:
        return int(release_date[:4])
    except ValueError:
        return None


def stars_from_rarity(rarity: str) -> int | None:
    m = re.search(r"([1-5])", rarity or "")
    return int(m.group(1)) if m else None


def main() -> int:
    cards = get_cards(5)
    index = json.loads(INDEX.read_text(encoding="utf-8"))

    # Bestdori lookup: characterId -> list of (names, card_id, meta)
    bd_by_char: dict[int, list[dict]] = {}
    for card_id, card in cards.items():
        cid = int(card.get("characterId", 0))
        if not (1 <= cid <= 35):
            continue
        prefix = card.get("prefix") or ["", "", "", "", ""]
        bd_by_char.setdefault(cid, []).append(
            {
                "card_id": int(card_id),
                "names": [norm(prefix[i]) for i in range(5) if prefix[i]],
                "attribute": ATTR_MAP.get(card.get("attribute", ""), ""),
                "card_kind": card_kind(card.get("type", ""), "", prefix[3] or prefix[0] or ""),
                "bestdori_type": card.get("type", ""),
                "stars": int(card.get("rarity") or 0),
            }
        )

    enrichment: dict[str, dict] = {}
    matched = 0
    total = 0

    for entry in index["characters"]:
        cid = entry["character_id"]
        meta_path = ROOT / "Bandori" / entry["metadata_path"].replace("/", "\\")
        if not meta_path.is_file():
            continue
        meta = json.loads(meta_path.read_text(encoding="utf-8"))
        bd_cards = bd_by_char.get(cid, [])

        for card in meta.get("cards", []):
            total += 1
            name_norm = norm(card.get("card_name"))
            event = card.get("event") or ""
            rarity = card.get("rarity") or ""
            release_date = card.get("release_date") or ""

            hit = None
            for bc in bd_cards:
                if name_norm and name_norm in bc["names"]:
                    hit = bc
                    break
            if not hit and name_norm:
                for bc in bd_cards:
                    if any(name_norm in n or n in name_norm for n in bc["names"] if len(n) >= 2):
                        hit = bc
                        break

            stars = hit["stars"] if hit else stars_from_rarity(rarity)
            attribute = hit["attribute"] if hit else ""
            kind = (
                card_kind(hit["bestdori_type"], event, card.get("card_name", ""))
                if hit
                else card_kind("", event, card.get("card_name", ""))
            )
            year = release_year(release_date)

            key = f"{cid}|{name_norm}"
            enrichment[key] = {
                "character_id": cid,
                "bestdori_card_id": hit["card_id"] if hit else None,
                "stars": stars,
                "attribute": attribute,
                "card_kind": kind,
                "release_year": year,
            }
            if hit:
                matched += 1

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        json.dumps(
            {
                "generated_at": __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat(),
                "matched": matched,
                "total": total,
                "cards": enrichment,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    print(f"Wrote {len(enrichment)} entries ({matched}/{total} matched Bestdori) -> {OUT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
