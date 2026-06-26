#!/usr/bin/env python3
"""Upload web/out to Aliyun OSS for static website hosting (China-friendly)."""

from __future__ import annotations

import argparse
import mimetypes
import os
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

try:
    import oss2
    from oss2.models import BucketWebsite
except ImportError:
    print("Missing dependency. Run: pip install oss2")
    sys.exit(1)

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "web" / "out"
ENV_FILE = ROOT / ".aliyun.env"

CONTENT_TYPES = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".woff2": "font/woff2",
    ".txt": "text/plain; charset=utf-8",
}


def load_env(path: Path) -> dict[str, str]:
    if not path.is_file():
        print(f"Config not found: {path}")
        print("Copy .aliyun.env.example to .aliyun.env and fill in your keys.")
        sys.exit(1)

    data: dict[str, str] = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if "=" not in line:
            continue
        key, value = line.split("=", 1)
        data[key.strip()] = value.strip()
    return data


def content_type_for(path: Path) -> str:
    ext = path.suffix.lower()
    if ext in CONTENT_TYPES:
        return CONTENT_TYPES[ext]
    guessed, _ = mimetypes.guess_type(path.name)
    return guessed or "application/octet-stream"


def collect_files(out_dir: Path) -> list[tuple[Path, str]]:
    files: list[tuple[Path, str]] = []
    for path in out_dir.rglob("*"):
        if not path.is_file():
            continue
        rel = path.relative_to(out_dir).as_posix()
        files.append((path, rel))
    return sorted(files, key=lambda x: x[1])


def upload_one(bucket: oss2.Bucket, local: Path, key: str) -> tuple[str, bool, str]:
    headers = {"Content-Type": content_type_for(local)}
    try:
        size = local.stat().st_size
        if size >= 8 * 1024 * 1024:
            oss2.resumable_upload(bucket, key, str(local), headers=headers, multipart_threshold=8 * 1024 * 1024)
        else:
            bucket.put_object_from_file(key, str(local), headers=headers)
        return key, True, ""
    except Exception as exc:
        return key, False, str(exc)


def configure_static_site(bucket: oss2.Bucket) -> None:
    bucket.put_bucket_website(BucketWebsite("index.html", "404.html"))
    policy = """{
  "Version": "1",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": ["*"],
      "Action": ["oss:GetObject"],
      "Resource": ["acs:oss:*:*:%s/*"]
    }
  ]
}""" % bucket.bucket_name
    bucket.put_bucket_policy(policy)


def main() -> int:
    parser = argparse.ArgumentParser(description="Deploy static site to Aliyun OSS")
    parser.add_argument("--skip-config", action="store_true", help="Skip website/policy setup")
    parser.add_argument("--workers", type=int, default=8, help="Parallel upload workers")
    args = parser.parse_args()

    if not OUT_DIR.is_dir():
        print(f"Build output missing: {OUT_DIR}")
        print("Run: cd web && npm run build:static")
        return 1

    env = load_env(ENV_FILE)
    access_key_id = env.get("ALIYUN_OSS_ACCESS_KEY_ID", "")
    access_key_secret = env.get("ALIYUN_OSS_ACCESS_KEY_SECRET", "")
    bucket_name = env.get("ALIYUN_OSS_BUCKET", "")
    region = env.get("ALIYUN_OSS_REGION", "oss-cn-hangzhou")
    endpoint = env.get("ALIYUN_OSS_ENDPOINT", f"https://{region}.aliyuncs.com")

    missing = [k for k, v in {
        "ALIYUN_OSS_ACCESS_KEY_ID": access_key_id,
        "ALIYUN_OSS_ACCESS_KEY_SECRET": access_key_secret,
        "ALIYUN_OSS_BUCKET": bucket_name,
    }.items() if not v]
    if missing:
        print("Missing in .aliyun.env:", ", ".join(missing))
        return 1

    files = collect_files(OUT_DIR)
    total_bytes = sum(local.stat().st_size for local, _ in files)
    print(f"Upload source: {OUT_DIR}")
    print(f"Files: {len(files)}  Size: {total_bytes / (1024 ** 3):.2f} GB")
    print(f"Bucket: {bucket_name}  Region: {region}")
    print()

    auth = oss2.Auth(access_key_id, access_key_secret)
    bucket = oss2.Bucket(auth, endpoint, bucket_name)

    if not args.skip_config:
        print("Configuring static website + public read policy...")
        try:
            configure_static_site(bucket)
            print("  OK")
        except oss2.exceptions.OssError as exc:
            print(f"  Warning: {exc}")
            print("  You can enable static hosting manually in OSS console.")

    ok = 0
    failed: list[tuple[str, str]] = []
    done_bytes = 0

    with ThreadPoolExecutor(max_workers=max(1, args.workers)) as pool:
        futures = {pool.submit(upload_one, bucket, local, key): (local, key) for local, key in files}
        for i, fut in enumerate(as_completed(futures), 1):
            local, key = futures[fut]
            _, success, err = fut.result()
            done_bytes += local.stat().st_size
            if success:
                ok += 1
            else:
                failed.append((key, err))
            if i % 200 == 0 or i == len(files):
                pct = done_bytes / total_bytes * 100 if total_bytes else 100
                print(f"  Progress: {i}/{len(files)} ({pct:.1f}%)")

    print()
    if failed:
        print(f"Failed uploads: {len(failed)}")
        for key, err in failed[:10]:
            print(f"  - {key}: {err}")
        return 1

    website_host = f"{bucket_name}.{region}.aliyuncs.com"
    print("=== Upload complete ===")
    print(f"Uploaded: {ok} files")
    print()
    print("Website URLs (enable static hosting in console if not yet):")
    print(f"  http://{website_host}/index.html")
    print(f"  http://{website_host}/")
    print()
    print("Console: https://oss.console.aliyun.com/bucket/oss-cn-*/{}/configuration/domain".format(bucket_name))
    print("Optional: bind custom domain + CDN in Aliyun console for faster nationwide access.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
