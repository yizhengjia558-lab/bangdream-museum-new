# -*- coding: utf-8 -*-
"""Append MyGO!!!!! voice-actor entries without wiping existing ones."""
from __future__ import annotations

import json
import time
from pathlib import Path
from urllib.parse import quote

import httpx

ROOT = Path(__file__).resolve().parent.parent
JSON_OUT = ROOT / "web" / "src" / "data" / "voice-actors.json"
OUT_DIR = ROOT / "Bandori" / "VoiceActors"

# CV names verified via Bandori Party API
MYGO = {
    36: {"cv_jp": "羊宮妃那", "cv_romaji": "Youmiya Hina", "cv_cn": "羊宫妃那", "wiki": "羊宮妃那"},
    37: {"cv_jp": "立石凛", "cv_romaji": "Tateishi Rin", "cv_cn": "立石凛", "wiki": "立石凛"},
    38: {"cv_jp": "青木陽菜", "cv_romaji": "Aoki Hina", "cv_cn": "青木阳菜", "wiki": "青木陽菜"},
    39: {"cv_jp": "小日向美香", "cv_romaji": "Kohinata Mika", "cv_cn": "小日向美香", "wiki": "小日向美香"},
    40: {"cv_jp": "林鼓子", "cv_romaji": "Hayashi Coco", "cv_cn": "林鼓子", "wiki": "林鼓子"},
}


def wiki_thumb(client: httpx.Client, title: str) -> str:
    url = (
        "https://ja.wikipedia.org/w/api.php"
        "?action=query&format=json&prop=pageimages"
        f"&piprop=thumbnail&pithumbsize=800&titles={quote(title, safe='')}"
    )
    try:
        pages = client.get(url, timeout=30).json().get("query", {}).get("pages", {})
        for page in pages.values():
            thumb = page.get("thumbnail", {}).get("source", "")
            if thumb:
                return thumb
    except Exception:
        pass
    return ""


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    data = json.loads(JSON_OUT.read_text(encoding="utf-8")) if JSON_OUT.exists() else {}
    client = httpx.Client(
        headers={"User-Agent": "BangdreamMuseum/1.0 (educational fan site)"},
        follow_redirects=True,
    )

    for cid, info in MYGO.items():
        image_rel = ""
        for ext in (".jpg", ".png", ".webp"):
            if (OUT_DIR / f"{cid}{ext}").exists():
                image_rel = f"VoiceActors/{cid}{ext}"
                break
        if not image_rel:
            thumb = wiki_thumb(client, info["wiki"])
            if thumb:
                resp = client.get(thumb, timeout=60)
                if resp.status_code == 200 and len(resp.content) > 512:
                    ext = ".jpg"
                    if resp.content[:8] == b"\x89PNG\r\n\x1a\n":
                        ext = ".png"
                    dest = OUT_DIR / f"{cid}{ext}"
                    dest.write_bytes(resp.content)
                    image_rel = f"VoiceActors/{cid}{ext}"
                    print(f"[{cid}] downloaded {dest.name}")
                else:
                    print(f"[{cid}] download failed")
            else:
                print(f"[{cid}] no wiki thumb")
            time.sleep(0.3)
        else:
            print(f"[{cid}] kept {image_rel}")

        data[str(cid)] = {
            "character_id": cid,
            "cv_jp": info["cv_jp"],
            "cv_romaji": info["cv_romaji"],
            "cv_cn": info["cv_cn"],
            "image": image_rel,
        }

    JSON_OUT.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    client.close()
    print(f"Wrote {JSON_OUT}")


if __name__ == "__main__":
    main()
