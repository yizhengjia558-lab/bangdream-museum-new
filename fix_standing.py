#!/usr/bin/env python3
"""Re-download standing illustrations for characters that used KV fallback."""

import json
from pathlib import Path

import httpx

from collect_bandori import (
    ROOT,
    bestdori_to_bp_member_id,
    fetch_bytes,
    folder_name_cn,
    is_png,
    load_bandori_party_members,
    log,
    save_unique,
)

INDEX = ROOT / "all_characters.json"


def main() -> None:
    index = json.loads(INDEX.read_text(encoding="utf-8"))
    client = httpx.Client(
        headers={"User-Agent": "Mozilla/5.0 (BandoriCollector/1.0)", "Referer": "https://bestdori.com/"},
        follow_redirects=True,
    )
    _, bp_by_id = load_bandori_party_members(client)
    seen: dict[str, Path] = {}
    fixed = 0

    for entry in index["characters"]:
        if not entry.get("standing_path", "").endswith("standing_kv.png"):
            continue
        char_id = entry["character_id"]
        bp_id = bestdori_to_bp_member_id(char_id)
        bp = bp_by_id.get(bp_id) if bp_id else None
        if not bp or not bp.get("image"):
            log(f"Skip {entry['character_name_cn']}: no Bandori Party image")
            continue
        char_dir = ROOT / entry["path"]
        standing_dir = char_dir / "Standing"
        kv_path = standing_dir / "standing_kv.png"
        if kv_path.exists():
            kv_path.unlink()
        data = fetch_bytes(bp["image"], client)
        if not data:
            log(f"Failed download: {entry['character_name_cn']}")
            continue
        saved = save_unique(data, standing_dir / "standing.png", seen)
        if saved:
            entry["standing_path"] = str(saved.relative_to(ROOT)).replace("\\", "/")
            entry["standing_url"] = bp["image"]
            fixed += 1
            log(f"Fixed: {entry['character_name_cn']}")

    INDEX.write_text(json.dumps(index, ensure_ascii=False, indent=2), encoding="utf-8")
    client.close()
    log(f"Fixed {fixed} standing illustrations")


if __name__ == "__main__":
    main()
