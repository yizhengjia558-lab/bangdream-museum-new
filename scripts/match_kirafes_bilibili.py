#!/usr/bin/env python3
import json
import re
import sys
from pathlib import Path

import httpx
from bestdori.cards import get_all as get_cards
from bestdori.characters import get_all as get_chars

sys.stdout.reconfigure(encoding="utf-8")
client = httpx.Client(
    headers={
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": "https://space.bilibili.com/287821282/lists/162259?type=season",
    },
    timeout=30,
    follow_redirects=True,
)

url = "https://api.bilibili.com/x/polymer/web-space/seasons_archives_list?mid=287821282&season_id=162259&sort_reverse=false&page_num=1&page_size=50"
data = client.get(url).json()["data"]
archives = data["archives"]
print("videos", len(archives))
for a in archives:
    print(a["bvid"], a["duration"], a["title"])

cards = get_cards(5)
chars = get_chars(5)
kira = []
for cid, c in cards.items():
    if c.get("type") != "kirafes":
        continue
    ch = int(c["characterId"])
    prefix = c.get("prefix") or ["", "", "", "", ""]
    name_jp = prefix[0] or ""
    name_cn = prefix[3] or prefix[2] or ""
    char = chars[str(ch)]
    char_jp = char["characterName"][0]
    char_cn = char["characterName"][3] or char["characterName"][2] or char_jp
    kira.append(
        {
            "card_id": int(cid),
            "char_id": ch,
            "char_jp": char_jp,
            "char_cn": char_cn,
            "name_jp": name_jp,
            "name_cn": name_cn,
            "res": c.get("resourceSetName"),
        }
    )

print("\n=== match ===")
matched = []
unmatched_v = []
used = set()
for a in archives:
    title = a["title"]
    # typical: 【2K120FPS】KiraFes动态卡面 | 北泽 育美 - 花と笑顔、ふわり
    m = re.search(r"\|\s*(.+?)\s*-\s*(.+)$", title)
    char_part = m.group(1).strip() if m else ""
    card_part = m.group(2).strip() if m else title
    char_part_n = re.sub(r"\s+", "", char_part)
    card_part_n = re.sub(r"\s+", "", card_part)

    hit = None
    for k in kira:
        if k["card_id"] in used:
            continue
        # match by JP card name
        if k["name_jp"] and (k["name_jp"] in card_part or card_part_n in re.sub(r"\s+", "", k["name_jp"])):
            hit = k
            break
        if k["name_cn"] and k["name_cn"] in card_part:
            hit = k
            break
        # fuzzy contain
        nj = re.sub(r"\s+", "", k["name_jp"])
        if nj and (nj in card_part_n or card_part_n in nj):
            hit = k
            break
    if not hit:
        for k in kira:
            if k["card_id"] in used:
                continue
            cj = re.sub(r"\s+", "", k["char_jp"])
            cc = re.sub(r"\s+", "", k["char_cn"])
            if char_part_n and (char_part_n in cj or cj in char_part_n or char_part_n in cc or cc in char_part_n):
                hit = k
                break
    if hit:
        used.add(hit["card_id"])
        matched.append({**hit, "bvid": a["bvid"], "title": title, "duration": a["duration"]})
        print("OK", hit["card_id"], hit["char_cn"], hit["name_cn"] or hit["name_jp"], "<=", a["bvid"], title)
    else:
        unmatched_v.append(a)
        print("NO", a["bvid"], title)

print("\nmatched", len(matched), "unmatched videos", len(unmatched_v), "unused cards", [k for k in kira if k["card_id"] not in used])
out = Path("web/src/data/kirafes-videos.json")
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(json.dumps({"source": "https://space.bilibili.com/287821282/lists/162259?type=season", "videos": matched}, ensure_ascii=False, indent=2), encoding="utf-8")
print("wrote", out)
