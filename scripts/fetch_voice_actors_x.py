#!/usr/bin/env python3
"""Download voice actor photos from official X accounts into each character's VoiceActor/ folder."""

from __future__ import annotations

import json
import re
import sys
import time
from pathlib import Path

import httpx

ROOT = Path(__file__).resolve().parent.parent
BANDORI = ROOT / "Bandori"
INDEX = BANDORI / "all_characters.json"
JSON_OUT = ROOT / "web" / "src" / "data" / "voice-actors.json"
LOG_OUT = ROOT / "scripts" / "_va_x_fetch_log.txt"

# character_id -> official X handle
X_HANDLES: dict[int, str] = {
    1: "aimi_sound",
    2: "Sae_Otsuka",
    3: "Rimi_Nishimoto",
    4: "OhashiAyaka",
    5: "AyasaIto",
    6: "Ayane_Sakura",
    7: "Sachika_Misawa",
    8: "katou_emiri",
    9: "YokoHikasa",
    10: "Hisako_Kanemoto",
    11: "miku_itou",
    12: "Azusa_tadokoro",
    13: "Yuri_Yoshida",
    14: "MoeToyota",
    15: "tomoyo_kurosawa",
    16: "amimaeshima",
    17: "ozawa_ari",
    18: "sumire_uesaka",
    19: "ikumi_nakagami",
    20: "Swkt_77",
    21: "aiba_ai",
    22: "kudo_haruka",
    23: "yuki_nakash",
    24: "megu_sakuragawa",
    25: "kanon_snow",
    26: "amane_inori",
    27: "hinachi050",
    28: "yukachannel21",
    29: "mika_bandori",
    30: "Ayasa_official",
    31: "Raychell_Info",
    32: "rikobox_",
    33: "natume_BD",
    34: "Reo_kurachi",
    35: "Risa_tsumugi",
}

CV_CN: dict[int, str] = {
    1: "爱美", 2: "大冢纱英", 3: "西本里美", 4: "大桥彩香", 5: "伊藤彩沙",
    6: "佐仓绫音", 7: "三泽纱千香", 8: "加藤英美里", 9: "日笠阳子", 10: "金元寿子",
    11: "伊藤美来", 12: "田所梓", 13: "吉田有里", 14: "丰田萌绘", 15: "黑泽朋世",
    16: "前岛亚美", 17: "小泽亚李", 18: "上坂堇", 19: "中上育实", 20: "秦佐和子",
    21: "相羽爱奈", 22: "工藤晴香", 23: "中岛由贵", 24: "樱川芽实", 25: "志崎桦音",
    26: "进藤天音", 27: "椥田帆夏", 28: "西尾夕香", 29: "mika", 30: "Ayasa",
    31: "Raychell", 32: "小原莉子", 33: "夏芽", 34: "仓知玲凤", 35: "纺木吏佐",
}


def log(msg: str) -> None:
    print(msg, flush=True)
    with LOG_OUT.open("a", encoding="utf-8") as f:
        f.write(msg + "\n")


def upscale_profile_url(url: str) -> list[str]:
    """Try highest-resolution profile image variants."""
    if not url:
        return []
    urls = []
    base = re.sub(r"_(normal|bigger|mini|200x200|400x400)\.(jpe?g|png|webp)$", r".\2", url, flags=re.I)
    urls.append(base)
    for suffix in ("_400x400", "_200x200"):
        stem = re.sub(r"_(normal|bigger|mini|200x200|400x400)\.", suffix + ".", url, flags=re.I)
        if stem not in urls:
            urls.append(stem)
    if url not in urls:
        urls.append(url)
    return urls


def upscale_banner_url(url: str) -> list[str]:
    if not url:
        return []
    return [f"{url}/1500x500", url]


def fetch_x_profile(client: httpx.Client, handle: str) -> dict:
    for api in (
        f"https://api.fxtwitter.com/{handle}",
        f"https://api.vxtwitter.com/{handle}",
    ):
        try:
            resp = client.get(api, timeout=30)
            if resp.status_code != 200 or not resp.content.startswith(b"{"):
                continue
            data = resp.json()
            user = data.get("user") or data
            avatar = user.get("avatar_url") or user.get("profile_image_url") or ""
            banner = user.get("banner_url") or user.get("profile_banner_url") or ""
            name = user.get("name") or handle
            if avatar or banner:
                return {"avatar": avatar, "banner": banner, "name": name, "handle": handle}
        except (httpx.HTTPError, json.JSONDecodeError):
            continue
    return {}


def download_best_image(client: httpx.Client, profile: dict) -> tuple[bytes | None, str]:
    """Prefer high-res profile photo; fall back to banner."""
    candidates: list[str] = []
    candidates.extend(upscale_profile_url(profile.get("avatar", "")))
    candidates.extend(upscale_banner_url(profile.get("banner", "")))

    seen: set[str] = set()
    for url in candidates:
        if not url or url in seen:
            continue
        seen.add(url)
        try:
            resp = client.get(url, timeout=60)
            if resp.status_code == 200 and len(resp.content) > 2048:
                ct = resp.headers.get("content-type", "")
                if "image" in ct or url.endswith((".jpg", ".jpeg", ".png", ".webp")):
                    ext = ".jpg"
                    if "png" in ct or url.lower().endswith(".png"):
                        ext = ".png"
                    elif "webp" in ct or url.lower().endswith(".webp"):
                        ext = ".webp"
                    return resp.content, ext
        except httpx.HTTPError:
            continue
    return None, ""


def image_ext(data: bytes) -> str:
    if data[:3] == b"\xff\xd8\xff":
        return ".jpg"
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        return ".png"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return ".webp"
    return ".jpg"


def main() -> int:
    LOG_OUT.write_text("", encoding="utf-8")
    index = json.loads(INDEX.read_text(encoding="utf-8"))
    char_paths = {c["character_id"]: c["path"] for c in index["characters"]}

    client = httpx.Client(
        headers={"User-Agent": "BangdreamMuseum/1.0 (voice actor X fetch; fan museum)"},
        follow_redirects=True,
    )

    actors: dict[str, dict] = {}
    if JSON_OUT.exists():
        actors = json.loads(JSON_OUT.read_text(encoding="utf-8"))

    ok = 0
    for char_id in range(1, 36):
        handle = X_HANDLES.get(char_id, "")
        char_path = char_paths.get(char_id, "")
        if not handle or not char_path:
            log(f"[{char_id:2d}] missing handle or path")
            continue

        out_dir = BANDORI / char_path.replace("/", "\\") / "VoiceActor"
        out_dir.mkdir(parents=True, exist_ok=True)

        profile = fetch_x_profile(client, handle)
        if not profile:
            log(f"[{char_id:2d}] @{handle} profile fetch failed")
            continue

        data, ext = download_best_image(client, profile)
        if not data:
            log(f"[{char_id:2d}] @{handle} image download failed")
            continue

        if not ext:
            ext = image_ext(data)
        dest = out_dir / f"cv{ext}"
        dest.write_bytes(data)
        rel = f"{char_path}/VoiceActor/cv{ext}"

        cv_jp = (actors.get(str(char_id), {}).get("cv_jp") or profile.get("name") or "").strip()
        cv_romaji = actors.get(str(char_id), {}).get("cv_romaji") or handle

        actors[str(char_id)] = {
            "character_id": char_id,
            "cv_jp": cv_jp,
            "cv_romaji": cv_romaji,
            "cv_cn": CV_CN.get(char_id, cv_romaji),
            "x_handle": handle,
            "image": rel,
        }
        ok += 1
        log(f"[{char_id:2d}] @{handle} -> {rel} ({len(data)//1024}KB)")
        time.sleep(0.35)

    JSON_OUT.write_text(json.dumps(actors, ensure_ascii=False, indent=2), encoding="utf-8")
    client.close()
    log(f"\nDone: {ok}/35 voice actor images saved to character VoiceActor/ folders")
    return 0 if ok > 0 else 1


if __name__ == "__main__":
    sys.exit(main())
