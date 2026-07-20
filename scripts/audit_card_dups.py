# -*- coding: utf-8 -*-
import json
import sys
from collections import Counter, defaultdict
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
root = Path("web/public/data/characters")
if not root.exists():
    print("public data missing")
    sys.exit(1)

issues = []
total = 0
for path in sorted(root.glob("*.json")):
    data = json.loads(path.read_text(encoding="utf-8"))
    cards = data.get("cards") or []
    total += len(cards)
    names = Counter((c.get("card_name") or "").replace(" ", "").lower() for c in cards)
    for name, n in names.items():
        if name and n > 1:
            issues.append(f"DUP name {data['name_cn']}: {name} x{n}")

    files = defaultdict(list)
    for c in cards:
        for key in ("untrained_file", "trained_file"):
            f = c.get(key) or ""
            if f:
                files[f].append(c.get("card_name"))
    for f, names_list in files.items():
        if len(names_list) > 1:
            issues.append(f"DUP file {data['name_cn']}: {Path(f).name} -> {names_list}")

    # MyGO sample
    if data.get("band_folder") == "MyGO":
        print(f"MyGO {data['name_cn']}: {len(cards)} cards")
        cardish = [c["card_name"] for c in cards if str(c.get("card_name", "")).lower().startswith("card")]
        gallery = [c["card_name"] for c in cards if c.get("rarity") == "Gallery"]
        if cardish:
            print("  placeholders:", cardish)
        if gallery:
            print("  gallery:", gallery)

print(f"\nTotal catalog cards: {total}")
print(f"Issues: {len(issues)}")
for line in issues[:40]:
    print(" -", line)
