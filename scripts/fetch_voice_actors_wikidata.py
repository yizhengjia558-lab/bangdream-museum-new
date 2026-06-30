#!/usr/bin/env python3
"""Second pass: download VA photos via known Wikidata Q-IDs."""

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
LOG_OUT = ROOT / "scripts" / "_va_fetch_log.txt"

# character_id -> Wikidata entity id
WIKIDATA_Q: dict[int, str] = {
    1: "Q28690421",   # Aimi
    2: "Q11657275",   # Otsuka Sae
    3: "Q28690426",   # Nishimoto Rimi
    4: "Q1148048",    # Ohashi Ayaka
    5: "Q28966627",   # Ito Ayasa
    6: "Q483333",     # Sakura Ayane
    7: "Q11354878",   # Misawa Sachika
    8: "Q1093120",    # Kato Emiri
    9: "Q1188693",    # Hikasa Yoko
    10: "Q1142923",   # Kanemoto Hisako
    11: "Q11237728",  # Miku Ito
    12: "Q11657142",  # Tadokoro Azusa
    13: "Q38278579",  # Yoshida Yuri
    14: "Q17226447",  # Toyota Moe
    15: "Q11453763",  # Kurosawa Tomoyo
    16: "Q11280348",  # Maeshima Ami
    17: "Q11657159",  # Ozawa Ari
    18: "Q9134010",   # Uesaka Sumire
    19: "Q17217567",  # Nakagami Ikumi
    20: "Q1143128",   # Hata Sawako
    21: "Q16263662",  # Aiba Aina
    22: "Q11657122",  # Kudo Haruka
    23: "Q11355159",  # Nakashima Yuki
    24: "Q29878842",  # Sakuragawa Megu
    25: "Q54867057",  # Shizaki Kanon
    26: "Q61093666",  # Shindo Amane
    27: "Q86789162",  # Suguta Hina
    28: "Q38278583",  # Nishio Yuka
    29: "Q61037842",  # mika
    30: "Q38278569",  # Ayasa
    31: "Q61037827",  # Raychell
    32: "Q11354860",  # Kohara Riko
    33: "Q106709850", # Natsume (musician)
    34: "Q97693145",  # Kurachi Reo
    35: "Q103931310", # Tsumugi Risa
}


def log(msg: str) -> None:
    print(msg, flush=True)
    with LOG_OUT.open("a", encoding="utf-8") as f:
        f.write(msg + "\n")


def wikidata_image(client: httpx.Client, qid: str) -> str:
    try:
        resp = client.get(
            "https://www.wikidata.org/w/api.php",
            params={"action": "wbgetclaims", "entity": qid, "property": "P18", "format": "json"},
            timeout=30,
        )
        claims = resp.json().get("claims", {}).get("P18", [])
        if not claims:
            return ""
        filename = claims[0]["mainsnak"]["datavalue"]["value"]
        return f"https://commons.wikimedia.org/wiki/Special:FilePath/{quote(filename.replace(' ', '_'), safe='')}"
    except httpx.HTTPError:
        return ""


def download(client: httpx.Client, url: str) -> bytes | None:
    try:
        resp = client.get(url, timeout=60)
        if resp.status_code == 200 and len(resp.content) > 512:
            return resp.content
    except httpx.HTTPError:
        pass
    return None


def ext(data: bytes) -> str:
    if data[:3] == b"\xff\xd8\xff":
        return ".jpg"
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        return ".png"
    return ".jpg"


def has_image(char_id: int) -> bool:
    return any((OUT_DIR / f"{char_id}{e}").exists() for e in (".jpg", ".png", ".webp"))


def main() -> int:
    LOG_OUT.write_text("", encoding="utf-8")
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    client = httpx.Client(
        headers={"User-Agent": "BangdreamMuseum/1.0 (voice actor fetch pass 2)"},
        follow_redirects=True,
    )

    actors = json.loads(JSON_OUT.read_text(encoding="utf-8")) if JSON_OUT.exists() else {}
    new_count = 0

    for char_id, qid in WIKIDATA_Q.items():
        if has_image(char_id):
            log(f"[{char_id:2d}] skip (exists)")
            continue
        url = wikidata_image(client, qid)
        if not url:
            log(f"[{char_id:2d}] Q{qid} no P18")
            continue
        data = download(client, url)
        if not data:
            log(f"[{char_id:2d}] Q{qid} download failed")
            continue
        suffix = ext(data)
        (OUT_DIR / f"{char_id}{suffix}").write_bytes(data)
        rel = f"VoiceActors/{char_id}{suffix}"
        if str(char_id) in actors:
            actors[str(char_id)]["image"] = rel
        new_count += 1
        log(f"[{char_id:2d}] Q{qid} -> {char_id}{suffix}")
        time.sleep(0.15)

    if actors:
        JSON_OUT.write_text(json.dumps(actors, ensure_ascii=False, indent=2), encoding="utf-8")

    total = sum(1 for i in range(1, 36) if has_image(i))
    client.close()
    log(f"\nAdded {new_count}, total {total}/35 with images")
    return 0


if __name__ == "__main__":
    sys.exit(main())
