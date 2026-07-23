#!/usr/bin/env python3
"""Download missing KIRAFES (动态卡) trained card art into Bandori folders and fix metadata."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

from bestdori.cards import Card, get_all as get_cards
from bestdori.characters import get_all as get_chars
from bestdori.exceptions import AssetsNotExistError

ROOT = Path(__file__).resolve().parent.parent / "Bandori"
INVALID = re.compile(r'[<>:"/\\|?*\x00-\x1f]')

BAND_FOLDER = {
    1: "PoppinParty",
    2: "Afterglow",
    3: "HelloHappyWorld",
    4: "PastelPalettes",
    5: "Roselia",
    18: "RaiseASuilen",
    21: "Morfonica",
    45: "MyGO",
}


def log(msg: str) -> None:
    print(msg, flush=True)


def safe_filename(text: str, max_len: int = 80) -> str:
    text = INVALID.sub("_", text.strip())
    text = re.sub(r"\s+", "_", text)
    return text[:max_len] or "unknown"


def is_png(data: bytes) -> bool:
    return len(data) > 8 and data[:8] == b"\x89PNG\r\n\x1a\n"


def folder_name_cn(name_cn: str) -> str:
    return name_cn.replace(" ", "").replace("　", "")


def download_png(card_id: int, train_type: str) -> bytes | None:
    try:
        data = Card(card_id).get_card(type=train_type)  # type: ignore[arg-type]
        return data if data and is_png(data) else None
    except (AssetsNotExistError, Exception):
        return None


def main() -> int:
    sys.stdout.reconfigure(encoding="utf-8")
    cards = get_cards(5)
    chars = get_chars(5)
    kira = [(int(cid), c) for cid, c in cards.items() if c.get("type") == "kirafes"]
    kira.sort(key=lambda x: x[0])
    log(f"KIRAFES cards: {len(kira)}")

    updated = 0
    downloaded = 0

    for card_id, card in kira:
        char_id = int(card["characterId"])
        char_info = chars[str(char_id)]
        band_id = char_info["bandId"]
        folder = BAND_FOLDER.get(band_id)
        if not folder:
            log(f"  skip {card_id}: unknown band {band_id}")
            continue

        name_jp = char_info["characterName"][0]
        name_cn = char_info["characterName"][3] or char_info["characterName"][2] or name_jp
        char_dir = ROOT / folder / folder_name_cn(name_cn)
        meta_path = char_dir / "metadata.json"
        trained_dir = char_dir / "Cards" / "Trained"
        untrained_dir = char_dir / "Cards" / "Untrained"
        trained_dir.mkdir(parents=True, exist_ok=True)
        untrained_dir.mkdir(parents=True, exist_ok=True)

        prefix = card.get("prefix") or ["", "", "", "", ""]
        card_name = prefix[3] or prefix[0] or f"Card {card_id}"
        slug = safe_filename(card_name)
        resource_set = card.get("resourceSetName") or ""
        anim = (Card(card_id).get_info() or {}).get("animation") or {}
        anim_bundle = anim.get("assetBundleName")

        trained_rel = ""
        untrained_rel = ""

        trained_dest = trained_dir / f"{card_id}_{slug}_trained.png"
        if trained_dest.exists() and trained_dest.stat().st_size > 0 and is_png(trained_dest.read_bytes()):
            trained_rel = str(trained_dest.relative_to(ROOT)).replace("\\", "/")
            log(f"  keep trained {card_id} {card_name}")
        else:
            data = download_png(card_id, "after_training")
            if data:
                trained_dest.write_bytes(data)
                trained_rel = str(trained_dest.relative_to(ROOT)).replace("\\", "/")
                downloaded += 1
                log(f"  downloaded trained {card_id} {card_name} ({len(data)} bytes)")
            else:
                log(f"  FAIL trained {card_id} {card_name}")

        untrained_dest = untrained_dir / f"{card_id}_{slug}.png"
        if untrained_dest.exists() and untrained_dest.stat().st_size > 0 and is_png(untrained_dest.read_bytes()):
            untrained_rel = str(untrained_dest.relative_to(ROOT)).replace("\\", "/")
        else:
            data = download_png(card_id, "normal")
            if data:
                untrained_dest.write_bytes(data)
                untrained_rel = str(untrained_dest.relative_to(ROOT)).replace("\\", "/")
                downloaded += 1
                log(f"  downloaded normal {card_id} {card_name}")

        if not meta_path.is_file():
            log(f"  WARN no metadata {meta_path}")
            continue

        meta = json.loads(meta_path.read_text(encoding="utf-8"))
        found = False
        for entry in meta.get("cards", []):
            eid = int(entry.get("card_id") or 0)
            match = (
                eid == card_id
                or (resource_set and entry.get("resource_set_name") == resource_set)
                or entry.get("card_name") == card_name
            )
            if not match:
                continue
            found = True
            entry["card_id"] = card_id
            entry["card_name"] = card_name
            entry["rarity"] = "5-Star"
            entry["resource_set_name"] = resource_set
            entry["bestdori_type"] = "kirafes"
            entry["card_kind"] = "kirafes"
            if anim_bundle:
                entry["animation_asset_bundle_name"] = anim_bundle
            if trained_rel:
                entry["trained_file"] = trained_rel
                entry["trained_image"] = (
                    f"https://bestdori.com/assets/jp/characters/resourceset/{resource_set}_rip/card_after_training.png"
                )
            if untrained_rel:
                entry["untrained_file"] = untrained_rel
                entry["untrained_image"] = (
                    f"https://bestdori.com/assets/jp/characters/resourceset/{resource_set}_rip/card_normal.png"
                )
            else:
                # KiraFes are trained-only on Bestdori
                entry["untrained_file"] = ""
                entry["untrained_image"] = ""
            updated += 1
            break

        if not found:
            entry = {
                "card_id": card_id,
                "card_name": card_name,
                "rarity": "5-Star",
                "event": "KIRAMEKI Festival 招募",
                "release_date": "",
                "untrained_image": "",
                "trained_image": f"https://bestdori.com/assets/jp/characters/resourceset/{resource_set}_rip/card_after_training.png" if resource_set else "",
                "resource_set_name": resource_set,
                "bestdori_type": "kirafes",
                "card_kind": "kirafes",
                "trained_file": trained_rel,
                "untrained_file": untrained_rel,
            }
            if anim_bundle:
                entry["animation_asset_bundle_name"] = anim_bundle
            meta.setdefault("cards", []).append(entry)
            updated += 1
            log(f"  appended metadata for {card_id}")

        meta_path.write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")

    log(f"Done. downloaded={downloaded} metadata_updated={updated}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
