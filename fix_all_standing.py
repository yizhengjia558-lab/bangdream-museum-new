#!/usr/bin/env python3
"""Upgrade all standing chibi images to 1024x1024 via Bandori Party costumes API."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import httpx
from bestdori.cards import get_all as get_cards

from collect_bandori import (
    ROOT,
    bestdori_to_bp_member_id,
    fetch_bytes,
    folder_name_cn,
    is_png,
    log,
    standing_kv_url,
)

INDEX = ROOT / "all_characters.json"


def find_initial_card_id(character_id: int, cards: dict) -> str | None:
    matches = [
        cid
        for cid, card in cards.items()
        if int(card.get("characterId", -1)) == character_id and card.get("type") == "initial"
    ]
    if not matches:
        return None
    return sorted(matches, key=int)[0]


def fetch_live_costume_image(client: httpx.Client, card_id: str) -> bytes | None:
    url = f"https://bandori.party/api/costumes/?card={card_id}&i_costume_type=live&page_size=20"
    resp = client.get(url, timeout=60)
    resp.raise_for_status()
    results = resp.json().get("results") or []
    if not results:
        return None

    results.sort(key=lambda c: c.get("id") or 0)
    for costume in results:
        img_url = costume.get("display_image") or ""
        if not img_url:
            continue
        if img_url.startswith("//"):
            img_url = f"https:{img_url}"
        data = fetch_bytes(img_url, client)
        if data and is_png(data):
            return data
    return None


def fetch_member_image(client: httpx.Client, bp_id: int) -> bytes | None:
    resp = client.get(f"https://bandori.party/api/members/{bp_id}/", timeout=60)
    if resp.status_code != 200:
        return None
    img_url = resp.json().get("image") or ""
    if img_url.startswith("//"):
        img_url = f"https:{img_url}"
    return fetch_bytes(img_url, client) if img_url else None


def fetch_kv_image(character_id: int) -> bytes | None:
    from bestdori.utils import get_api
    from bestdori.utils.network import Api

    assets = get_api("bestdori.assets")
    try:
        data = Api(
            assets["characters"]["character_kv_image"].format(server="jp", id=character_id)
        ).get().content
        return data if is_png(data) else None
    except Exception:
        return None


def upgrade_standing(
    client: httpx.Client,
    cards: dict,
    entry: dict,
    force: bool,
) -> tuple[str, str] | None:
    char_id = entry["character_id"]
    standing_dir = ROOT / entry["path"] / "Standing"
    standing_dir.mkdir(parents=True, exist_ok=True)
    dest = standing_dir / "standing.png"

    if not force and dest.exists():
        try:
            from PIL import Image

            with Image.open(dest) as img:
                if img.size[0] >= 512 and img.size[1] >= 512:
                    return None
        except Exception:
            pass

    data: bytes | None = None
    source = ""

    initial_card = find_initial_card_id(char_id, cards)
    if initial_card:
        data = fetch_live_costume_image(client, initial_card)
        if data:
            source = f"costume(card={initial_card})"

    if not data:
        bp_id = bestdori_to_bp_member_id(char_id)
        if bp_id:
            data = fetch_member_image(client, bp_id)
            if data:
                source = f"member({bp_id})"

    if not data:
        data = fetch_kv_image(char_id)
        if data:
            source = "kv"

    if not data:
        return None

    dest.write_bytes(data)
    kv_path = standing_dir / "standing_kv.png"
    if kv_path.exists():
        kv_path.unlink()

    rel = str(dest.relative_to(ROOT)).replace("\\", "/")
    entry["standing_path"] = rel
    return rel, source


def main() -> int:
    parser = argparse.ArgumentParser(description="Upgrade standing images to high-res chibi")
    parser.add_argument("--force", action="store_true", help="Re-download even if already >=512px")
    args = parser.parse_args()

    if not INDEX.is_file():
        log(f"Missing index: {INDEX}")
        return 1

    index = json.loads(INDEX.read_text(encoding="utf-8"))
    cards = get_cards(5)
    client = httpx.Client(
        headers={"User-Agent": "Mozilla/5.0 (BandoriCollector/1.0)", "Referer": "https://bestdori.com/"},
        follow_redirects=True,
    )

    ok = 0
    skipped = 0
    failed = 0

    for entry in index["characters"]:
        name = entry["character_name_cn"]
        try:
            result = upgrade_standing(client, cards, entry, args.force)
            if result is None:
                skipped += 1
                log(f"Skip (already HD): {name}")
                continue
            rel, source = result
            ok += 1
            from PIL import Image

            with Image.open(ROOT / rel) as img:
                log(f"Upgraded: {name} -> {img.size[0]}x{img.size[1]} ({source})")
        except Exception as exc:
            failed += 1
            log(f"Failed: {name}: {exc}")

    INDEX.write_text(json.dumps(index, ensure_ascii=False, indent=2), encoding="utf-8")
    client.close()

    log("")
    log(f"Done. Upgraded: {ok}, skipped: {skipped}, failed: {failed}")
    log("Next: cd web && npm run build:static")
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
