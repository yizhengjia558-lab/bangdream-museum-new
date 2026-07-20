#!/usr/bin/env python3
"""Collect BanG Dream! GBP character standing art and card images from Bestdori / Bandori Party."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import httpx
from bestdori.cards import Card, get_all as get_cards
from bestdori.characters import Character, get_all as get_chars
from bestdori.events import get_all as get_events
from bestdori.exceptions import AssetsNotExistError
from bestdori.gacha import get_all as get_gacha
from bestdori.utils import get_api
from bestdori.utils.network import Api

ROOT = Path(__file__).resolve().parent / "Bandori"
BASE_URL = "https://bestdori.com"
ASSETS = get_api("bestdori.assets")

TARGET_BANDS: dict[int, dict[str, str]] = {
    1: {"folder": "PoppinParty", "name": "Poppin'Party"},
    2: {"folder": "Afterglow", "name": "Afterglow"},
    3: {"folder": "HelloHappyWorld", "name": "Hello, Happy World!"},
    4: {"folder": "PastelPalettes", "name": "Pastel＊Palettes"},
    5: {"folder": "Roselia", "name": "Roselia"},
    18: {"folder": "RaiseASuilen", "name": "RAISE A SUILEN"},
    21: {"folder": "Morfonica", "name": "Morfonica"},
    # MyGO!!!!! / Ave Mujica — shown as「其他乐队」in the museum UI
    45: {"folder": "MyGO", "name": "MyGO!!!!!"},
    46: {"folder": "AveMujica", "name": "Ave Mujica"},
}

RARITY_LABELS = {1: "1-Star", 2: "2-Star", 3: "3-Star", 4: "4-Star", 5: "5-Star"}
CARD_TYPE_LABELS = {
    "initial": "Initial Member Card",
    "permanent": "Permanent Gacha",
    "event": "Event Gacha",
    "limited": "Limited Gacha",
    "birthday": "Birthday",
    "dreamfes": "Dreamfes",
    "kirafes": "KiraFes",
    "collab": "Collaboration",
    "others": "Other",
}

INVALID_PATH_CHARS = re.compile(r'[<>:"/\\|?*\x00-\x1f]')


def log(msg: str) -> None:
    print(msg, flush=True)


def norm_name(text: str | None) -> str:
    if not text:
        return ""
    return text.replace(" ", "").replace("　", "").lower()


def safe_filename(text: str, max_len: int = 80) -> str:
    text = INVALID_PATH_CHARS.sub("_", text.strip())
    text = re.sub(r"\s+", "_", text)
    return text[:max_len] or "unknown"


def folder_name_cn(name_cn: str) -> str:
    return name_cn.replace(" ", "").replace("　", "")


def ts_to_date(ts: str | None, index: int = 3) -> str:
    if not ts:
        return ""
    try:
        ms = int(ts)
        return datetime.fromtimestamp(ms / 1000, tz=timezone.utc).strftime("%Y-%m-%d")
    except (TypeError, ValueError):
        return ""


def card_image_url(resource_set_name: str, train_type: str, server: str = "jp") -> str:
    path = ASSETS["characters"]["resourceset"].format(
        server=server,
        resource_set_name=resource_set_name,
        name="card",
        type=train_type,
    )
    return f"{BASE_URL}{path}"


def standing_kv_url(char_id: int, server: str = "jp") -> str:
    path = ASSETS["characters"]["character_kv_image"].format(server=server, id=char_id)
    return f"{BASE_URL}{path}"


def is_png(data: bytes) -> bool:
    return len(data) > 8 and data[:8] == b"\x89PNG\r\n\x1a\n"


def file_hash(data: bytes) -> str:
    return hashlib.md5(data).hexdigest()


def save_unique(data: bytes, dest: Path, seen_hashes: dict[str, Path]) -> Path | None:
    if not data or not is_png(data):
        return None
    digest = file_hash(data)
    if digest in seen_hashes:
        return seen_hashes[digest]
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(data)
    seen_hashes[digest] = dest
    return dest


def fetch_bytes(url: str, client: httpx.Client, retries: int = 3) -> bytes | None:
    for attempt in range(retries):
        try:
            resp = client.get(url, timeout=60)
            if resp.status_code == 200 and is_png(resp.content):
                return resp.content
        except httpx.HTTPError:
            pass
        time.sleep(0.5 * (attempt + 1))
    return None


def download_card_image(card_id: int, train_type: str) -> bytes | None:
    card = Card(id=card_id)
    try:
        card.get_info()
        data = card.get_card(type=train_type)  # type: ignore[arg-type]
        return data if is_png(data) else None
    except (AssetsNotExistError, Exception):
        return None


def bestdori_to_bp_member_id(char_id: int) -> int | None:
    """Map Bestdori character ID to Bandori Party member ID."""
    # GBP 1–35 → BP 6–40; MyGO 36–40 → BP 41–45
    if 1 <= char_id <= 40:
        return char_id + 5
    return None


def load_bandori_party_members(client: httpx.Client) -> tuple[dict[str, dict[str, Any]], dict[int, dict[str, Any]]]:
    members_by_name: dict[str, dict[str, Any]] = {}
    members_by_id: dict[int, dict[str, Any]] = {}
    url = "https://bandori.party/api/members/?page_size=100"
    while url:
        resp = client.get(url, timeout=60)
        resp.raise_for_status()
        payload = resp.json()
        for member in payload.get("results", []):
            members_by_id[member["id"]] = member
            key = norm_name(member.get("japanese_name"))
            if key:
                members_by_name[key] = member
        url = payload.get("next")
    return members_by_name, members_by_id


def build_event_maps() -> tuple[dict[str, str], dict[str, str]]:
    event_reward: dict[str, str] = {}
    for event in get_events(5).values():
        event_name = (event.get("eventName") or ["", "", "", "", ""])[3] or (
            event.get("eventName") or ["", "", "", "", ""]
        )[0]
        for card_id in event.get("rewardCards") or []:
            event_reward.setdefault(str(card_id), event_name or "")

    gacha_map: dict[str, str] = {}
    for gacha in get_gacha(5).values():
        names = gacha.get("gachaName") or []
        gacha_name = names[3] or names[0] or names[2] or ""
        for card_id in gacha.get("newCards") or []:
            gacha_map.setdefault(str(card_id), gacha_name)

    return event_reward, gacha_map


def resolve_event(card_id: str, card_type: str, event_reward: dict[str, str], gacha_map: dict[str, str]) -> str:
    if card_id in event_reward:
        return event_reward[card_id]
    if card_id in gacha_map:
        return gacha_map[card_id]
    return CARD_TYPE_LABELS.get(card_type, card_type or "Unknown")


def find_initial_card_id(character_id: int, cards: dict) -> str | None:
    matches = [
        cid
        for cid, card in cards.items()
        if int(card.get("characterId", -1)) == character_id and card.get("type") == "initial"
    ]
    return sorted(matches, key=int)[0] if matches else None


def fetch_live_costume_image(
    client: httpx.Client, card_id: str, bp_member_id: int | None = None
) -> bytes | None:
    resp = client.get(
        f"https://bandori.party/api/costumes/?card={card_id}&i_costume_type=live&page_size=100",
        timeout=60,
    )
    if resp.status_code != 200:
        return None
    results = resp.json().get("results") or []
    if bp_member_id is not None:
        results = [c for c in results if c.get("member") == bp_member_id]
    results = sorted(results, key=lambda c: c.get("id") or 0)
    for costume in results:
        img_url = costume.get("display_image") or ""
        if img_url.startswith("//"):
            img_url = f"https:{img_url}"
        data = fetch_bytes(img_url, client) if img_url else None
        if data and is_png(data):
            return data
    return None


def download_standing_image(
    client: httpx.Client,
    char_id: int,
    cards: dict,
    bp_members_by_id: dict[int, dict[str, Any]],
    bp_members: dict[str, dict[str, Any]],
    name_jp: str,
) -> tuple[bytes | None, str]:
    initial = find_initial_card_id(char_id, cards)
    bp_id = bestdori_to_bp_member_id(char_id)
    if initial:
        data = fetch_live_costume_image(client, initial, bp_id)
        if data:
            return data, f"costume(card={initial},member={bp_id})"

    bp = bp_members_by_id.get(bp_id) if bp_id else None
    if bp is None:
        bp = bp_members.get(norm_name(name_jp))
    if bp and bp.get("image"):
        img_url = bp["image"]
        data = fetch_bytes(img_url, client)
        if data:
            return data, "bandori.party member"

    try:
        kv_data = Api(
            ASSETS["characters"]["character_kv_image"].format(server="jp", id=char_id)
        ).get().content
        if kv_data and is_png(kv_data):
            return kv_data, "Bestdori KV"
    except Exception:
        pass
    return None, ""


def collect(force: bool = False, only_bands: set[int] | None = None) -> None:
    log("Loading Bestdori metadata...")
    characters = get_chars(5)
    cards = get_cards(5)
    event_reward, gacha_map = build_event_maps()

    client = httpx.Client(
        headers={"User-Agent": "Mozilla/5.0 (BandoriCollector/1.0)", "Referer": "https://bestdori.com/"},
        follow_redirects=True,
    )
    bp_members, bp_members_by_id = load_bandori_party_members(client)
    log(f"Loaded {len(bp_members_by_id)} Bandori Party members")

    # Preserve existing index when doing a partial band collect
    existing_index: list[dict[str, Any]] = []
    index_path = ROOT / "all_characters.json"
    if only_bands and index_path.exists():
        try:
            prev = json.loads(index_path.read_text(encoding="utf-8"))
            only_folders = {TARGET_BANDS[b]["folder"] for b in only_bands if b in TARGET_BANDS}
            existing_index = [c for c in prev.get("characters", []) if c.get("band_folder") not in only_folders]
            log(f"Partial collect: keeping {len(existing_index)} existing characters")
        except (json.JSONDecodeError, OSError):
            existing_index = []

    target_chars: list[tuple[str, dict[str, Any]]] = []
    for char_id, info in characters.items():
        if info.get("characterType") != "unique":
            continue
        band_id = info.get("bandId")
        if band_id not in TARGET_BANDS:
            continue
        if only_bands is not None and band_id not in only_bands:
            continue
        target_chars.append((char_id, info))
    target_chars.sort(key=lambda x: int(x[0]))
    log(f"Target characters: {len(target_chars)}")

    global_hash_registry: dict[str, Path] = {}
    all_characters_index: list[dict[str, Any]] = list(existing_index)

    for char_id, char_info in target_chars:
        band_id = char_info["bandId"]
        band_meta = TARGET_BANDS[band_id]
        name_jp = char_info["characterName"][0]
        name_cn = char_info["characterName"][3] or char_info["characterName"][2] or name_jp
        char_dir = ROOT / band_meta["folder"] / folder_name_cn(name_cn)
        standing_dir = char_dir / "Standing"
        untrained_dir = char_dir / "Cards" / "Untrained"
        trained_dir = char_dir / "Cards" / "Trained"
        for d in (standing_dir, untrained_dir, trained_dir):
            d.mkdir(parents=True, exist_ok=True)

        log(f"\n=== {name_cn} ({name_jp}) ===")

        # Standing illustration (prefer 1024px live costume chibi)
        standing_files: list[str] = []
        standing_url = ""
        data, source = download_standing_image(
            client, int(char_id), cards, bp_members_by_id, bp_members, name_jp
        )
        if data:
            dest = standing_dir / "standing.png"
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes(data)
            standing_files.append(str(dest.relative_to(ROOT)).replace("\\", "/"))
            log(f"  Standing: {source} ({dest.name})")
        if not standing_files:
            log(f"  Standing: unavailable")

        char_cards = [
            (card_id, card)
            for card_id, card in cards.items()
            if str(card.get("characterId")) == char_id
        ]
        char_cards.sort(key=lambda x: int(x[0]))
        log(f"  Cards: {len(char_cards)}")

        metadata_cards: list[dict[str, Any]] = []
        card_jobs: list[tuple[str, dict[str, Any], str, Path, str]] = []

        for card_id, card in char_cards:
            prefix = card.get("prefix") or ["", "", "", "", ""]
            card_name = prefix[3] or prefix[0] or f"Card {card_id}"
            rarity = RARITY_LABELS.get(card.get("rarity", 0), str(card.get("rarity", "")))
            release_list = card.get("releasedAt") or []
            release_date = ts_to_date(release_list[3] if len(release_list) > 3 else None) or ts_to_date(
                release_list[0] if release_list else None
            )
            event_name = resolve_event(card_id, card.get("type", ""), event_reward, gacha_map)
            resource_set = card.get("resourceSetName", "")

            untrained_url = card_image_url(resource_set, "normal") if resource_set else ""
            trained_url = card_image_url(resource_set, "after_training") if resource_set else ""

            slug = safe_filename(card_name)
            card_jobs.append((card_id, card, "normal", untrained_dir / f"{card_id}_{slug}.png", untrained_url))
            card_jobs.append((card_id, card, "after_training", trained_dir / f"{card_id}_{slug}_trained.png", trained_url))

            metadata_cards.append(
                {
                    "card_id": int(card_id),
                    "card_name": card_name,
                    "card_name_jp": prefix[0] or "",
                    "rarity": rarity,
                    "event": event_name,
                    "release_date": release_date,
                    "untrained_image": untrained_url,
                    "trained_image": trained_url,
                    "untrained_file": "",
                    "trained_file": "",
                }
            )

        # Download card images concurrently
        def _download(job: tuple[str, dict[str, Any], str, Path, str]) -> tuple[str, str, Path, bytes | None]:
            cid, _card, train_type, dest, _url = job
            if not force and dest.exists() and dest.stat().st_size > 0:
                try:
                    existing = dest.read_bytes()
                    if is_png(existing):
                        return cid, train_type, dest, existing
                except OSError:
                    pass
            data = download_card_image(int(cid), train_type)
            return cid, train_type, dest, data

        with ThreadPoolExecutor(max_workers=6) as pool:
            futures = [pool.submit(_download, job) for job in card_jobs]
            for future in as_completed(futures):
                cid, train_type, dest, data = future.result()
                if not data:
                    continue
                saved = save_unique(data, dest, global_hash_registry)
                if not saved:
                    continue
                for entry in metadata_cards:
                    if str(entry["card_id"]) != cid:
                        continue
                    rel = str(saved.relative_to(ROOT)).replace("\\", "/")
                    if train_type == "normal":
                        entry["untrained_file"] = rel
                    else:
                        entry["trained_file"] = rel

        # Drop entries with no files and no valid URLs (invalid links cleanup)
        cleaned_cards: list[dict[str, Any]] = []
        for entry in metadata_cards:
            has_untrained = bool(entry["untrained_file"])
            has_trained = bool(entry["trained_file"])
            if not has_untrained:
                entry["untrained_image"] = ""
            if not has_trained:
                entry["trained_image"] = ""
            if has_untrained or has_trained or entry["untrained_image"] or entry["trained_image"]:
                cleaned_cards.append(
                    {
                        "card_name": entry["card_name"],
                        "rarity": entry["rarity"],
                        "event": entry["event"],
                        "release_date": entry["release_date"],
                        "untrained_image": entry["untrained_image"],
                        "trained_image": entry["trained_image"],
                    }
                )

        metadata = {
            "character_name_cn": name_cn,
            "character_name_jp": name_jp,
            "band": band_meta["name"],
            "cards": cleaned_cards,
        }
        meta_path = char_dir / "metadata.json"
        meta_path.write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")
        log(f"  Saved metadata ({len(cleaned_cards)} cards)")

        all_characters_index.append(
            {
                "character_id": int(char_id),
                "character_name_cn": name_cn,
                "character_name_jp": name_jp,
                "band": band_meta["name"],
                "band_folder": band_meta["folder"],
                "path": str(char_dir.relative_to(ROOT)).replace("\\", "/"),
                "metadata_path": str(meta_path.relative_to(ROOT)).replace("\\", "/"),
                "standing_path": standing_files[0] if standing_files else "",
                "standing_url": standing_url,
                "cards_untrained_path": str(untrained_dir.relative_to(ROOT)).replace("\\", "/"),
                "cards_trained_path": str(trained_dir.relative_to(ROOT)).replace("\\", "/"),
                "card_count": len(cleaned_cards),
            }
        )

    index_path = ROOT / "all_characters.json"
    # Stable order by character_id
    all_characters_index.sort(key=lambda c: int(c.get("character_id", 0)))
    index_path.write_text(
        json.dumps(
            {
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "source": ["Bestdori API", "Bandori Party API"],
                "excluded_bands": [],
                "bands": [v["name"] for v in TARGET_BANDS.values()],
                "character_count": len(all_characters_index),
                "characters": all_characters_index,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    client.close()
    log(f"\nDone. Index: {index_path}")
    log(f"Unique images: {len(global_hash_registry)}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Collect BanG Dream character art from Bestdori")
    parser.add_argument(
        "--force",
        action="store_true",
        help="Re-download all images (restore original resolution)",
    )
    parser.add_argument(
        "--bands",
        nargs="+",
        type=int,
        help="Only collect these Bestdori bandIds (e.g. 45 46 for MyGO / Ave Mujica)",
    )
    args = parser.parse_args()
    try:
        only = set(args.bands) if args.bands else None
        collect(force=args.force, only_bands=only)
    except KeyboardInterrupt:
        sys.exit(130)
