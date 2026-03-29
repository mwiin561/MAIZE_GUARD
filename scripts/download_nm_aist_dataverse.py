"""
Download NM-AIST Tanzania maize zips from Harvard Dataverse (doi:10.7910/DVN/GDON8Q).

Files (see API): HEATHLY.zip (Healthy), MSV_1.zip, MSV_2.zip — extract and merge MSV_* into
your MSV/ training folder. No account required.

Usage:
  python scripts/download_nm_aist_dataverse.py --out D:\\MAIZE_GUARD\\datasets\\nm_aist_raw

Requires: pip install requests
"""

from __future__ import annotations

import argparse
import os
import sys

try:
    import requests
except ImportError:
    print("Install: pip install requests")
    sys.exit(1)

# Persistent IDs from https://dataverse.harvard.edu/api/datasets/:persistentId/?persistentId=doi:10.7910/DVN/GDON8Q
FILES = [
    (6966997, "HEATHLY.zip"),
    (6966998, "MSV_1.zip"),
    (6962930, "MSV_2.zip"),
]

BASE = "https://dataverse.harvard.edu/api/access/datafile/{}"
CHUNK = 1024 * 1024


def download(url: str, dest: str) -> None:
    os.makedirs(os.path.dirname(dest) or ".", exist_ok=True)
    with requests.get(url, stream=True, timeout=60) as r:
        r.raise_for_status()
        total = int(r.headers.get("content-length") or 0)
        done = 0
        with open(dest, "wb") as f:
            for chunk in r.iter_content(chunk_size=CHUNK):
                if chunk:
                    f.write(chunk)
                    done += len(chunk)
                    if total:
                        pct = 100.0 * done / total
                        print(f"\r  {os.path.basename(dest)}  {pct:5.1f}%", end="", flush=True)
    print()


def main() -> None:
    p = argparse.ArgumentParser(description="Download NM-AIST maize zips from Dataverse")
    p.add_argument("--out", default="datasets/nm_aist_raw", help="Output directory")
    args = p.parse_args()
    out = os.path.abspath(args.out)
    os.makedirs(out, exist_ok=True)

    for fid, name in FILES:
        url = BASE.format(fid)
        dest = os.path.join(out, name)
        if os.path.isfile(dest):
            print(f"Skip (exists): {dest}")
            continue
        print(f"Downloading {name} …")
        download(url, dest)
        print(f"Saved: {dest}")

    print("Done. Unzip HEATHLY.zip → copy a random subset into training_data/Healthy/")
    print("Unzip MSV_1.zip and MSV_2.zip → copy subsets into training_data/MSV/")


if __name__ == "__main__":
    main()
