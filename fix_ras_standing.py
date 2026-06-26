#!/usr/bin/env python3
"""Re-download standing illustrations for RAISE A SUILEN (wrong Morfonica images)."""

import json
from pathlib import Path

import httpx

from collect_bandori import (
    ROOT,
    bestdori_to_bp_member_id,
    fetch_bytes,
    is_png,
    load_bandori_party_members,
    log,
)

INDEX = ROOT / "all_characters.json"
RAS_FOLDER = "RaiseASuilen"


def main() -> None:
    index = json.loads(INDEX.read_text(encoding="utf-8"))
    client = httpx.Client(
        headers={"User-Agent": "Mozilla/5.0 (BandoriCollector/1.0)", "Referer": "https://bestdori.com/"},
        follow_redirects=True,
    )
    _, bp_by_id = load_bandori_party_members(client)
    fixed = 0

    for entry in index["characters"]:
        if entry.get("band_folder") != RAS_FOLDER:
            continue

        char_id = entry["character_id"]
        bp_id = bestdori_to_bp_member_id(char_id)
        bp = bp_by_id.get(bp_id) if bp_id else None
        if not bp or not bp.get("image"):
            log(f"Skip {entry['character_name_cn']}: no Bandori Party image (bp_id={bp_id})")
            continue

        standing_dir = ROOT / entry["path"] / "Standing"
        standing_dir.mkdir(parents=True, exist_ok=True)
        dest = standing_dir / "standing.png"

        data = fetch_bytes(bp["image"], client)
        if not data or not is_png(data):
            log(f"Failed download: {entry['character_name_cn']}")
            continue

        dest.write_bytes(data)
        entry["standing_path"] = str(dest.relative_to(ROOT)).replace("\\", "/")
        entry["standing_url"] = bp["image"]
        fixed += 1
        log(f"Fixed: {entry['character_name_cn']} -> {bp.get('english_name', bp_id)}")

    INDEX.write_text(json.dumps(index, ensure_ascii=False, indent=2), encoding="utf-8")
    client.close()
    log(f"Fixed {fixed} RAISE A SUILEN standing illustrations")


if __name__ == "__main__":
    main()
