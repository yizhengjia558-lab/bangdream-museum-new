#!/usr/bin/env python3
"""Copy KiraFes mp4s into web/public/kirafes/{card_id}.mp4 and update mapping.

Matches by leading episode index in filenames (1-..18-), which matches the
Bilibili season order used in kirafes-videos.json.
"""

from __future__ import annotations

import json
import re
import shutil
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "web" / "public" / "kirafes"
MAP_PATH = ROOT / "web" / "src" / "data" / "kirafes-videos.json"

# Season index (filename prefix) → Bestdori card_id
INDEX_TO_CARD = {
    1: 1834,
    2: 1833,
    3: 1785,
    4: 1784,
    5: 1719,
    6: 1718,
    7: 1619,
    8: 1620,
    9: 1592,
    10: 1591,
    11: 1524,
    12: 1525,
    13: 1475,
    14: 1476,
    15: 1403,
    16: 1404,
    17: 1330,
    18: 1329,
}

SEARCH_ROOTS = [
    Path(r"C:\Users\27999\Desktop"),
    next((p for p in Path(r"D:\\").iterdir() if p.is_dir() and p.name.startswith("ANON")), None),
]


def find_source_dir() -> Path:
    if len(sys.argv) > 1:
        p = Path(sys.argv[1])
        if p.is_dir():
            return p
        raise SystemExit(f"Source dir not found: {p}")

    roots = [r for r in SEARCH_ROOTS if r is not None and r.exists()]
    for root in roots:
        # Prefer shallow Desktop match
        if "Desktop" in str(root):
            for p in root.iterdir():
                if p.is_dir() and "KiraFes" in p.name:
                    return p
            continue
        for p in root.rglob("*"):
            if not p.is_dir():
                continue
            if "KiraFes" not in p.name:
                continue
            if len(list(p.glob("*.mp4"))) >= 10:
                return p
    raise SystemExit("KiraFes folder not found (pass path as argv[1])")


def main() -> int:
    src_dir = find_source_dir()
    files = list(src_dir.glob("*.mp4"))
    print("source", src_dir)
    print("mp4 count", len(files))

    by_index: dict[int, Path] = {}
    for f in files:
        m = re.match(r"^(\d+)\s*[-–—]", f.name)
        if not m:
            print("SKIP (no index)", f.name)
            continue
        by_index[int(m.group(1))] = f

    data = json.loads(MAP_PATH.read_text(encoding="utf-8"))
    videos = data["videos"]
    by_card = {int(v["card_id"]): v for v in videos}

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    matched = 0

    for idx, card_id in INDEX_TO_CARD.items():
        hit = by_index.get(idx)
        v = by_card.get(card_id)
        if not hit:
            print("MISS index", idx, "card", card_id)
            continue
        if not v:
            print("MISS mapping card", card_id)
            continue

        dest = OUT_DIR / f"{card_id}.mp4"
        shutil.copy2(hit, dest)
        v["local_file"] = f"/kirafes/{card_id}.mp4"
        matched += 1
        print(
            "OK",
            f"{idx:02d}",
            card_id,
            hit.name,
            "->",
            dest.name,
            f"{dest.stat().st_size / 1e6:.2f}MB",
        )

    MAP_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"matched {matched}/{len(INDEX_TO_CARD)} -> {OUT_DIR}")
    return 0 if matched == len(INDEX_TO_CARD) else 1


if __name__ == "__main__":
    raise SystemExit(main())
