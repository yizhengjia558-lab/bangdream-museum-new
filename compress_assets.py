#!/usr/bin/env python3
"""Compress Bandori image assets (~50% file size). Skips already-compressed files."""

from __future__ import annotations

import argparse
import io
import json
import sys
from concurrent.futures import ProcessPoolExecutor, as_completed
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent
BANDORI = ROOT / "Bandori"
MANIFEST = ROOT / "compress_manifest.json"
TARGET_RATIO = 0.5
IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".webp"}
MAX_WORKERS = 8
SCALES = (1.0, 0.95, 0.9, 0.85, 0.8, 0.75, 0.7, 0.65, 0.6)


def load_manifest() -> dict[str, dict]:
    if MANIFEST.exists():
        return json.loads(MANIFEST.read_text(encoding="utf-8"))
    return {}


def save_manifest(data: dict[str, dict]) -> None:
    MANIFEST.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")


def encode_image(img: Image.Image, suffix: str) -> bytes:
    buf = io.BytesIO()
    if suffix == ".png":
        if img.mode not in {"P", "RGBA", "RGB", "L", "LA"}:
            img = img.convert("P", palette=Image.Palette.ADAPTIVE, colors=256)
        img.save(buf, "PNG", optimize=True, compress_level=9)
    elif suffix in {".jpg", ".jpeg"}:
        img.convert("RGB").save(buf, "JPEG", optimize=True, quality=72, progressive=True)
    elif suffix == ".webp":
        img.convert("RGB").save(buf, "WEBP", quality=72, method=6)
    else:
        raise ValueError(f"Unsupported format: {suffix}")
    return buf.getvalue()


def compress_to_target(path: Path, original_size: int) -> int:
    suffix = path.suffix.lower()
    target_size = int(original_size * TARGET_RATIO)
    best_bytes: bytes | None = None
    best_size = original_size

    with Image.open(path) as src:
        base = src.copy()
        w, h = base.size

        for scale in SCALES:
            if scale < 1.0:
                nw, nh = max(1, int(w * scale)), max(1, int(h * scale))
                work = base.resize((nw, nh), Image.Resampling.LANCZOS)
            else:
                work = base

            try:
                data = encode_image(work, suffix)
            except Exception:
                continue

            new_size = len(data)
            if new_size < best_size:
                best_size = new_size
                best_bytes = data

            if new_size <= target_size:
                break

    if best_bytes is not None and best_size < original_size:
        path.write_bytes(best_bytes)
        return best_size

    return original_size


def process_file(rel_path: str) -> dict | None:
    path = BANDORI / rel_path
    if not path.is_file():
        return None

    try:
        original_size = path.stat().st_size
        new_size = compress_to_target(path, original_size)

        if new_size < original_size:
            return {
                "path": rel_path,
                "before": original_size,
                "after": new_size,
                "ratio": round(new_size / original_size, 3),
            }
    except Exception as exc:
        return {"path": rel_path, "error": str(exc)}
    return None


def iter_images() -> list[str]:
    files: list[str] = []
    for path in BANDORI.rglob("*"):
        if path.is_file() and path.suffix.lower() in IMAGE_EXTS:
            files.append(str(path.relative_to(BANDORI)).replace("\\", "/"))
    return sorted(files)


def main() -> int:
    parser = argparse.ArgumentParser(description="Compress Bandori image assets")
    parser.add_argument(
        "--force",
        action="store_true",
        help="Re-compress all images, ignoring manifest",
    )
    args = parser.parse_args()

    if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
        try:
            sys.stdout.reconfigure(encoding="utf-8")
        except Exception:
            pass

    if not BANDORI.is_dir():
        print(f"Bandori folder not found: {BANDORI}")
        return 1

    manifest = {} if args.force else load_manifest()
    all_files = iter_images()
    pending = [f for f in all_files if args.force or f not in manifest]

    print(f"Total images: {len(all_files)}")
    print(f"Already compressed (manifest): {len(all_files) - len(pending)}")
    print(f"To process: {len(pending)}")
    print(f"Target: ~{int(TARGET_RATIO * 100)}% of original file size")
    print()

    if not pending:
        print("Nothing to compress.")
        return 0

    before_total = 0
    after_total = 0
    ok = 0
    skipped = 0
    errors = 0

    with ProcessPoolExecutor(max_workers=MAX_WORKERS) as pool:
        futures = {pool.submit(process_file, rel): rel for rel in pending}
        done = 0
        for fut in as_completed(futures):
            done += 1
            result = fut.result()
            rel = futures[fut]
            if result is None:
                skipped += 1
                manifest[rel] = {"skipped": True}
            elif "error" in result:
                errors += 1
                manifest[rel] = result
                print(f"  ERROR {rel}: {result['error']}")
            else:
                ok += 1
                before_total += result["before"]
                after_total += result["after"]
                manifest[rel] = result

            if done % 200 == 0 or done == len(pending):
                save_manifest(manifest)
                print(f"  Progress: {done}/{len(pending)}")

    save_manifest(manifest)

    print()
    print("=== Compression complete ===")
    print(f"Compressed: {ok}")
    print(f"Skipped (no savings): {skipped}")
    print(f"Errors: {errors}")
    if before_total:
        saved_mb = (before_total - after_total) / (1024 * 1024)
        pct = (1 - after_total / before_total) * 100
        print(f"Saved: {saved_mb:.1f} MB ({pct:.1f}% reduction this run)")
    print(f"Manifest: {MANIFEST}")
    print()
    print("Next: cd web && npm run build:static")
    return 0 if errors == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
