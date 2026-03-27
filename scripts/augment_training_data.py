"""
Augment images in training_data/Healthy and training_data/MSV (Pillow only).

Writes augmented copies to --out (default training_data_augmented) with the same
class folders. Originals are not modified.

Usage:
  pip install pillow
  python scripts/augment_training_data.py --variants 4

Each source image gets `variants` new files (random flips, rotation, color jitter).
"""

from __future__ import annotations

import argparse
import os
import random
import shutil
import sys

try:
    from PIL import Image, ImageEnhance, ImageOps
except ImportError:
    print("Install: pip install pillow")
    sys.exit(1)

IMAGE_EXT = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
CLASSES = ("Healthy", "MSV")


def augment_one(img: Image.Image, rng: random.Random) -> Image.Image:
    out = img.convert("RGB")
    if rng.random() < 0.5:
        out = ImageOps.mirror(out)
    if rng.random() < 0.5:
        out = ImageOps.flip(out)
    angle = rng.uniform(-25, 25)
    out = out.rotate(angle, resample=Image.Resampling.BICUBIC, expand=True)
    w, h = out.size
    if w > 1024 or h > 1024:
        out.thumbnail((1024, 1024), Image.Resampling.LANCZOS)
    factor = rng.uniform(0.75, 1.25)
    out = ImageEnhance.Brightness(out).enhance(factor)
    factor = rng.uniform(0.75, 1.25)
    out = ImageEnhance.Color(out).enhance(factor)
    factor = rng.uniform(0.75, 1.25)
    out = ImageEnhance.Contrast(out).enhance(factor)
    return out


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--src", default="training_data", help="Folder with Healthy/ and MSV/")
    p.add_argument("--out", default="training_data_augmented", help="Output root")
    p.add_argument("--variants", type=int, default=4, help="Augmented images per source image")
    p.add_argument(
        "--no-copy-originals",
        action="store_true",
        help="Only write augmented images (skip copying raw files into output)",
    )
    p.add_argument("--seed", type=int, default=42)
    args = p.parse_args()
    rng = random.Random(args.seed)

    src_root = os.path.abspath(args.src)
    out_root = os.path.abspath(args.out)

    total = 0
    for cls in CLASSES:
        d = os.path.join(src_root, cls)
        if not os.path.isdir(d):
            print(f"Skip missing: {d}")
            continue
        dest_cls = os.path.join(out_root, cls)
        os.makedirs(dest_cls, exist_ok=True)
        for root, _, files in os.walk(d):
            for name in files:
                base, ext = os.path.splitext(name)
                if ext.lower() not in IMAGE_EXT:
                    continue
                path = os.path.join(root, name)
                rel = os.path.relpath(path, d)
                safe = rel.replace(os.sep, "_").replace(":", "_")
                try:
                    img = Image.open(path)
                except OSError as e:
                    print(f"Skip {path}: {e}")
                    continue
                if not args.no_copy_originals:
                    dest_orig = os.path.join(dest_cls, f"orig_{safe}")
                    shutil.copy2(path, dest_orig)
                    total += 1
                for v in range(args.variants):
                    aug = augment_one(img, rng)
                    suffix = ".jpg" if ext.lower() in (".jpg", ".jpeg") else ext.lower()
                    out_name = f"{safe}_aug{v:02d}{suffix}"
                    out_path = os.path.join(dest_cls, out_name)
                    aug.save(out_path, quality=92)
                    total += 1
                img.close()

    print(f"Wrote {total} augmented images under {out_root}")


if __name__ == "__main__":
    main()
