#!/usr/bin/env python3
"""
Incremental card sync from Bestdori (mirrors BanG Dream! GBP game assets).

Bushiroad 官网不提供公开卡面 API；Bestdori 会在日服更新后同步游戏内资源，
本脚本只下载本地缺失的新卡面，并重建 site-data.json。
"""

from __future__ import annotations

import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BANDORI = ROOT / "Bandori"
INDEX = BANDORI / "all_characters.json"
BUILD_DATA = ROOT / "web" / "scripts" / "build-data.mjs"
SYNC_LOG = ROOT / "sync_last_run.json"


def log(msg: str) -> None:
    print(msg, flush=True)


def card_total() -> int:
    if not INDEX.is_file():
        return 0
    index = json.loads(INDEX.read_text(encoding="utf-8"))
    return sum(int(c.get("card_count", 0)) for c in index.get("characters", []))


def png_total() -> int:
    if not BANDORI.is_dir():
        return 0
    return sum(1 for _ in BANDORI.rglob("*.png"))


def main() -> int:
    before_cards = card_total()
    before_pngs = png_total()

    log("=== BanG Dream card sync (Bestdori → local) ===")
    log(f"Before: {before_cards} cards in index, {before_pngs} PNG files")
    log("")

    log("[1/2] Fetching new assets (skip existing files)...")
    subprocess.check_call([sys.executable, str(ROOT / "collect_bandori.py")])

    log("")
    log("[2/2] Rebuilding site-data.json...")
    subprocess.check_call(["node", str(BUILD_DATA)])

    after_cards = card_total()
    after_pngs = png_total()
    new_cards = after_cards - before_cards
    new_pngs = after_pngs - before_pngs

    report = {
        "synced_at": datetime.now(timezone.utc).isoformat(),
        "source": "Bestdori API (game asset mirror)",
        "cards_before": before_cards,
        "cards_after": after_cards,
        "cards_added": new_cards,
        "pngs_before": before_pngs,
        "pngs_after": after_pngs,
        "pngs_added": new_pngs,
    }
    SYNC_LOG.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")

    log("")
    log("=== Done ===")
    log(f"Cards: {before_cards} → {after_cards} (+{new_cards})")
    log(f"PNG files: {before_pngs} → {after_pngs} (+{new_pngs})")
    log(f"Report: {SYNC_LOG}")

    if new_cards > 0 or new_pngs > 0:
        log("")
        log("New content detected. Commit and push to deploy:")
        log('  git add Bandori web/src/data/site-data.json sync_last_run.json')
        log('  git commit -m "Auto-sync: new cards from Bestdori"')
        log("  git push")

    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        sys.exit(130)
