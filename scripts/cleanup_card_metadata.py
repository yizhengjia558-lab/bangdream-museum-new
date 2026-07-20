# -*- coding: utf-8 -*-
"""Dedupe Bandori metadata cards (JP/CN stubs + placeholder collisions)."""
from __future__ import annotations

import json
import re
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / "Bandori"
RES_RE = re.compile(r"/resourceset/([^/]+?)(?:_rip)?/", re.I)
CARD_ID_RE = re.compile(r"^Card\s+(\d+)$", re.I)


def resource_key(card: dict) -> str | None:
    for key in ("untrained_image", "trained_image"):
        url = card.get(key) or ""
        m = RES_RE.search(url.replace("\\", "/"))
        if m:
            return m.group(1)
    return None


def has_cjk(text: str) -> bool:
    return any("\u4e00" <= ch <= "\u9fff" for ch in text)


def score_card(card: dict) -> tuple:
    name = card.get("card_name") or ""
    date = card.get("release_date") or ""
    event = (card.get("event") or "").lower()
    s = 0
    if date and not date.startswith("2100"):
        s += 100
    if CARD_ID_RE.match(name.strip()):
        s -= 40
    elif has_cjk(name):
        s += 50
    if event in ("other", "campaign", "others"):
        s -= 15
    # Prefer entries that already have both art links when tied
    if card.get("trained_image"):
        s += 5
    if card.get("untrained_image"):
        s += 2
    return (s, date)


def attach_card_id_from_files(char_dir: Path, card: dict) -> None:
    if card.get("card_id"):
        return
    name = (card.get("card_name") or "").strip()
    m = CARD_ID_RE.match(name)
    if m:
        card["card_id"] = int(m.group(1))
        return

    # Exact slug match against downloaded PNGs: `{id}_{slug}.png`
    slug_needle = re.sub(r'[<>:"/\\|?*\s_]+', "", name).lower()
    if not slug_needle:
        return
    for sub in ("Untrained", "Trained"):
        folder = char_dir / "Cards" / sub
        if not folder.exists():
            continue
        for png in folder.glob("*.png"):
            stem = png.stem
            if stem.endswith("_trained"):
                stem = stem[: -len("_trained")]
            if "_" not in stem:
                continue
            cid_str, _, rest = stem.partition("_")
            if not cid_str.isdigit():
                continue
            label = re.sub(r"[\s_]+", "", rest).lower()
            if label == slug_needle:
                card["card_id"] = int(cid_str)
                return


def cleanup_metadata(meta_path: Path) -> tuple[int, int]:
    meta = json.loads(meta_path.read_text(encoding="utf-8"))
    cards = meta.get("cards") or []
    before = len(cards)
    char_dir = meta_path.parent

    by_res: dict[str, list[dict]] = defaultdict(list)
    no_res: list[dict] = []
    for card in cards:
        key = resource_key(card)
        if key:
            by_res[key].append(card)
        else:
            no_res.append(card)

    cleaned: list[dict] = []
    for group in by_res.values():
        best = max(group, key=score_card)
        attach_card_id_from_files(char_dir, best)
        # Prefer CN title when the winner is a JP stub of a CN sibling (already scored)
        cleaned.append(
            {
                "card_id": best.get("card_id"),
                "card_name": best.get("card_name", ""),
                "rarity": best.get("rarity", ""),
                "event": best.get("event", ""),
                "release_date": best.get("release_date", ""),
                "untrained_image": best.get("untrained_image", ""),
                "trained_image": best.get("trained_image", ""),
                "resource_set_name": resource_key(best) or "",
            }
        )

    for card in no_res:
        attach_card_id_from_files(char_dir, card)
        cleaned.append(
            {
                "card_id": card.get("card_id"),
                "card_name": card.get("card_name", ""),
                "rarity": card.get("rarity", ""),
                "event": card.get("event", ""),
                "release_date": card.get("release_date", ""),
                "untrained_image": card.get("untrained_image", ""),
                "trained_image": card.get("trained_image", ""),
                "resource_set_name": "",
            }
        )

    # Drop exact duplicate names that somehow remain (keep highest score)
    by_name: dict[str, dict] = {}
    for card in cleaned:
        key = (card.get("card_name") or "").replace(" ", "").lower()
        if not key:
            continue
        prev = by_name.get(key)
        if prev is None or score_card(card) > score_card(prev):
            by_name[key] = card
    cleaned = list(by_name.values())

    cleaned.sort(key=lambda c: (c.get("release_date") or "9999", c.get("card_id") or 0, c.get("card_name") or ""))
    meta["cards"] = cleaned
    meta_path.write_text(json.dumps(meta, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return before, len(cleaned)


def main() -> None:
    total_before = total_after = 0
    files = sorted(ROOT.glob("*/**/metadata.json"))
    # Only character metadata (Band/Char/metadata.json) — depth 2 under Bandori
    files = [p for p in ROOT.glob("*/*/metadata.json")]
    for path in files:
        before, after = cleanup_metadata(path)
        total_before += before
        total_after += after
        if before != after:
            print(f"{path.parent.parent.name}/{path.parent.name}: {before} -> {after}")
    print(f"Done. cards {total_before} -> {total_after} across {len(files)} characters")


if __name__ == "__main__":
    main()
