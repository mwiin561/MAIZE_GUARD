"""
Randomly copy N images per class from source class folders (no cherry-picking).

Example (after unzipping NM-AIST and pointing at extracted image dirs):
  python scripts/sample_training_subset.py \\
    --healthy-src D:\\data\\HEATHLY_extracted \\
    --msv-src D:\\data\\msv_merged \\
    --dest training_data --n 400

Or single parent with Healthy/ and MSV/ subfolders:
  python scripts/sample_training_subset.py --from training_data_all --dest training_data --n 400
"""

from __future__ import annotations

import argparse
import os
import random
import shutil
import sys

IMAGE_EXT = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}


def list_images(folder: str) -> list[str]:
    out = []
    for root, _, files in os.walk(folder):
        for f in files:
            if os.path.splitext(f.lower())[1] in IMAGE_EXT:
                out.append(os.path.join(root, f))
    return out


def copy_random(src_files: list[str], dest_dir: str, n: int, seed: int) -> None:
    random.seed(seed)
    k = min(n, len(src_files))
    picked = random.sample(src_files, k=k)
    os.makedirs(dest_dir, exist_ok=True)
    for i, path in enumerate(picked):
        ext = os.path.splitext(path)[1]
        shutil.copy2(path, os.path.join(dest_dir, f"img_{i:05d}{ext}"))


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--dest", default="training_data", help="Output: dest/Healthy and dest/MSV")
    p.add_argument("--n", type=int, default=400, help="Images per class")
    p.add_argument("--seed", type=int, default=42)
    p.add_argument("--from", dest="from_dir", help="Parent folder containing Healthy/ and MSV/")
    p.add_argument("--healthy-src", help="Override: folder of Healthy images")
    p.add_argument("--msv-src", help="Override: folder of MSV images")
    args = p.parse_args()

    if args.from_dir:
        h = os.path.join(args.from_dir, "Healthy")
        m = os.path.join(args.from_dir, "MSV")
    else:
        if not args.healthy_src or not args.msv_src:
            print("Either --from <dir> with Healthy/ and MSV/ or both --healthy-src and --msv-src")
            sys.exit(1)
        h, m = args.healthy_src, args.msv_src

    hi, mi = list_images(h), list_images(m)
    if not hi or not mi:
        print(f"Need images: Healthy found {len(hi)}, MSV found {len(mi)}")
        sys.exit(1)

    copy_random(hi, os.path.join(args.dest, "Healthy"), args.n, args.seed)
    copy_random(mi, os.path.join(args.dest, "MSV"), args.seed + 1)
    print(f"Wrote up to {args.n} images per class under {os.path.abspath(args.dest)}")


if __name__ == "__main__":
    main()
