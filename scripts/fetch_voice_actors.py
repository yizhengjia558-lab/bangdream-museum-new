#!/usr/bin/env python3
"""Fetch voice actor names (Bandori Party) and photos (Wikipedia/Wikidata) into Bandori/VoiceActors/."""

from __future__ import annotations

import json
import sys
import time
from pathlib import Path
from urllib.parse import quote

import httpx

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "Bandori" / "VoiceActors"
JSON_OUT = ROOT / "web" / "src" / "data" / "voice-actors.json"

CV_CN: dict[int, str] = {
    1: "爱美",
    2: "大冢纱英",
    3: "西本里美",
    4: "大桥彩香",
    5: "伊藤彩沙",
    6: "佐仓绫音",
    7: "三泽纱千香",
    8: "加藤英美里",
    9: "日笠阳子",
    10: "金元寿子",
    11: "伊藤美来",
    12: "田所梓",
    13: "吉田有里",
    14: "丰田萌绘",
    15: "黑泽朋世",
    16: "前岛亚美",
    17: "小泽亚李",
    18: "上坂堇",
    19: "中上育实",
    20: "秦佐和子",
    21: "相羽爱奈",
    22: "工藤晴香",
    23: "中岛由贵",
    24: "樱川芽实",
    25: "志崎桦音",
    26: "进藤天音",
    27: "椥田帆夏",
    28: "西尾夕香",
    29: "mika",
    30: "Ayasa",
    31: "Raychell",
    32: "小原莉子",
    33: "夏芽",
    34: "仓知玲凤",
    35: "纺木吏佐",
}

WIKI_TITLES: dict[str, str] = {
    "Aimi": "Aimi_(Japanese_musician)",
    "Otsuka Sae": "Sae_Ōtsuka",
    "Nishimoto Rimi": "Rimi_Nishimoto",
    "Ohashi Ayaka": "Ayaka_Ohashi",
    "Itou Ayasa": "Ayasa_Itō",
    "Sakura Ayane": "Ayane_Sakura",
    "Misawa Sachika": "Sachika_Misawa",
    "Katou Emiri": "Emiri_Katō",
    "Hikasa Yoko": "Yoko_Hikasa",
    "Kanemoto Hisako": "Hisako_Kanemoto",
    "Miku Itou": "Miku_Itō",
    "Tadokoro Azusa": "Azusa_Tadokoro",
    "Yoshida Yuri": "Yuri_Yoshida",
    "Toyota Moe": "Moe_Toyota",
    "Kurosawa Tomoyo": "Tomoyo_Kurosawa",
    "Maeshima Ami": "Ami_Maeshima",
    "Ozawa Ari": "Ari_Ozawa",
    "Uesaka Sumire": "Sumire_Uesaka",
    "Nakagami Ikumi": "Ikumi_Nakagami",
    "Hata Sawako": "Sawako_Hata",
    "Aiba Aina": "Aina_Aiba",
    "Kudou Haruka": "Haruka_Kudō",
    "Nakashima Yuki": "Yuki_Nakashima",
    "Sakuragawa Megu": "Megu_Sakuragawa",
    "Shizaki Kanon": "Kanon_Shizaki",
    "Amane Shindo": "Shindō_Amane",
    "Hina Suguta": "Hina_Suguta",
    "Yuka Nishio": "Yuka_Nishio",
    "mika": "Mika_(Japanese_musician)",
    "Ayasa": "Ayasa",
    "Raychell": "Raychell",
    "Riko Kohara": "Riko_Kohara",
    "Natsume": "Natsume_(musician)",
    "Reo Kurachi": "Reo_Kurachi",
    "Risa Tsumugi": "Risa_Tsumugi",
}

WIKI_JA: dict[str, str] = {
    "Aimi": "愛美",
    "Otsuka Sae": "大塚紗英",
    "Nishimoto Rimi": "西本りみ",
    "Ohashi Ayaka": "大橋彩香",
    "Itou Ayasa": "伊藤彩沙",
    "Sakura Ayane": "佐倉綾音",
    "Misawa Sachika": "三澤紗千香",
    "Katou Emiri": "加藤英美里",
    "Hikasa Yoko": "日笠陽子",
    "Kanemoto Hisako": "金元寿子",
    "Miku Itou": "伊藤美来",
    "Tadokoro Azusa": "田所あずさ",
    "Yoshida Yuri": "吉田有里",
    "Toyota Moe": "豊田萌絵",
    "Kurosawa Tomoyo": "黒沢ともよ",
    "Maeshima Ami": "前島亜美",
    "Ozawa Ari": "小澤亜李",
    "Uesaka Sumire": "上坂すみれ",
    "Nakagami Ikumi": "中上育実",
    "Hata Sawako": "秦佐和子",
    "Aiba Aina": "相羽あいな",
    "Kudou Haruka": "工藤晴香",
    "Nakashima Yuki": "中島由貴",
    "Sakuragawa Megu": "桜川めぐ",
    "Shizaki Kanon": "志崎樺音",
    "Amane Shindo": "進藤あまね",
    "Hina Suguta": "椥田ひな",
    "Yuka Nishio": "西尾夕香",
    "Raychell": "Raychell",
    "Riko Kohara": "小原莉子",
    "Reo Kurachi": "倉知玲鳳",
    "Risa Tsumugi": "紡木吏佐",
}


def log(msg: str) -> None:
    print(msg, flush=True)


def fetch_members(client: httpx.Client) -> dict[int, dict]:
    members: dict[int, dict] = {}
    url = "https://bandori.party/api/members/?page_size=100"
    while url:
        payload = client.get(url, timeout=60).json()
        for m in payload.get("results", []):
            cid = m["id"] - 5
            if 1 <= cid <= 35:
                members[cid] = m
        url = payload.get("next")
    return members


def wiki_page_image(client: httpx.Client, title: str, lang: str = "en") -> str:
    url = (
        f"https://{lang}.wikipedia.org/w/api.php"
        f"?action=query&format=json&prop=pageimages"
        f"&piprop=thumbnail&pithumbsize=800"
        f"&titles={quote(title, safe='')}"
    )
    try:
        resp = client.get(url, timeout=30)
        if resp.status_code == 200:
            pages = resp.json().get("query", {}).get("pages", {})
            for page in pages.values():
                if "missing" in page:
                    continue
                thumb = page.get("thumbnail", {}).get("source", "")
                if thumb:
                    return thumb
    except httpx.HTTPError:
        pass
    return ""


def wikidata_image(client: httpx.Client, search: str) -> str:
    try:
        resp = client.get(
            "https://www.wikidata.org/w/api.php",
            params={
                "action": "wbsearchentities",
                "search": search,
                "language": "en",
                "format": "json",
                "limit": 5,
            },
            timeout=30,
        )
        if resp.status_code != 200:
            return ""
        for ent in resp.json().get("search", []):
            desc = (ent.get("description") or "").lower()
            if desc and not any(
                kw in desc
                for kw in ("voice", "actress", "actor", "singer", "musician", "seiyu", "声優", "歌手")
            ):
                if "japanese" not in desc and "japan" not in desc:
                    continue
            eid = ent["id"]
            claim_resp = client.get(
                "https://www.wikidata.org/w/api.php",
                params={"action": "wbgetclaims", "entity": eid, "property": "P18", "format": "json"},
                timeout=30,
            )
            if claim_resp.status_code != 200:
                continue
            claims = claim_resp.json().get("claims", {}).get("P18", [])
            if not claims:
                continue
            filename = claims[0]["mainsnak"]["datavalue"]["value"]
            return f"https://commons.wikimedia.org/wiki/Special:FilePath/{quote(filename.replace(' ', '_'), safe='')}"
    except httpx.HTTPError:
        pass
    return ""


def commons_search_image(client: httpx.Client, query: str) -> str:
    try:
        resp = client.get(
            "https://commons.wikimedia.org/w/api.php",
            params={
                "action": "query",
                "format": "json",
                "generator": "search",
                "gsrsearch": f'"{query}"',
                "gsrnamespace": 6,
                "gsrlimit": 5,
                "prop": "imageinfo",
                "iiprop": "url",
                "iiurlwidth": 800,
            },
            timeout=30,
        )
        if resp.status_code != 200:
            return ""
        pages = resp.json().get("query", {}).get("pages", {})
        for page in sorted(pages.values(), key=lambda p: p.get("index", 999)):
            info = page.get("imageinfo", [{}])[0]
            url = info.get("thumburl") or info.get("url", "")
            if url and any(url.lower().endswith(ext) for ext in (".jpg", ".jpeg", ".png", ".webp")):
                return url
    except httpx.HTTPError:
        pass
    return ""


def resolve_image(client: httpx.Client, romaji: str, cv_jp: str) -> str:
    candidates: list[tuple[str, str]] = []
    title = WIKI_TITLES.get(romaji)
    if title:
        candidates.append((title, "en"))
        candidates.append((title, "ja"))
    ja_title = WIKI_JA.get(romaji) or cv_jp.replace(" ", "").replace("\u3000", "").strip()
    if ja_title:
        candidates.append((ja_title, "ja"))

    seen: set[tuple[str, str]] = set()
    for wiki_title, lang in candidates:
        key = (wiki_title, lang)
        if key in seen:
            continue
        seen.add(key)
        thumb = wiki_page_image(client, wiki_title, lang)
        if thumb:
            return thumb

    for search in (romaji, ja_title, cv_jp.strip()):
        if not search:
            continue
        url = wikidata_image(client, search)
        if url:
            return url

    for search in (f"{romaji} voice actress", romaji, ja_title):
        if not search:
            continue
        url = commons_search_image(client, search)
        if url:
            return url

    return ""


def download_image(client: httpx.Client, url: str) -> bytes | None:
    if not url:
        return None
    try:
        resp = client.get(url, timeout=60)
        if resp.status_code == 200 and len(resp.content) > 512:
            ct = resp.headers.get("content-type", "")
            if "image" in ct or url.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
                return resp.content
    except httpx.HTTPError:
        pass
    return None


def image_ext(data: bytes) -> str:
    if data[:3] == b"\xff\xd8\xff":
        return ".jpg"
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        return ".png"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return ".webp"
    return ".jpg"


def existing_image_rel(char_id: int) -> str:
    for ext in (".jpg", ".png", ".webp"):
        if (OUT_DIR / f"{char_id}{ext}").exists():
            return f"VoiceActors/{char_id}{ext}"
    return ""


def main() -> int:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    client = httpx.Client(
        headers={"User-Agent": "BangdreamMuseum/1.0 (voice actor fetch; educational fan site)"},
        follow_redirects=True,
    )

    members = fetch_members(client)
    actors: dict[str, dict] = {}
    ok_images = 0

    for char_id in range(1, 36):
        member = members.get(char_id, {})
        romaji = (member.get("romaji_CV") or "").strip()
        cv_jp = (member.get("CV") or "").strip()
        image_rel = existing_image_rel(char_id)

        if not image_rel:
            thumb_url = resolve_image(client, romaji, cv_jp)
            data = download_image(client, thumb_url)
            if data:
                ext = image_ext(data)
                dest = OUT_DIR / f"{char_id}{ext}"
                dest.write_bytes(data)
                image_rel = f"VoiceActors/{char_id}{ext}"
                ok_images += 1
                log(f"  [{char_id:2d}] {romaji or cv_jp} -> downloaded {dest.name}")
            else:
                log(f"  [{char_id:2d}] {romaji or cv_jp} -> no image found")
        else:
            ok_images += 1
            log(f"  [{char_id:2d}] {romaji or cv_jp} -> kept {Path(image_rel).name}")

        actors[str(char_id)] = {
            "character_id": char_id,
            "cv_jp": cv_jp,
            "cv_romaji": romaji,
            "cv_cn": CV_CN.get(char_id, romaji),
            "image": image_rel,
        }
        time.sleep(0.2)

    JSON_OUT.parent.mkdir(parents=True, exist_ok=True)
    JSON_OUT.write_text(json.dumps(actors, ensure_ascii=False, indent=2), encoding="utf-8")
    client.close()
    log(f"\nDone: {len(actors)} voice actors, {ok_images} with images -> {OUT_DIR}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
