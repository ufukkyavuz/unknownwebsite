#!/usr/bin/env python3
"""
Find and optimize images that are loaded directly (not via uploads/opt/) by
any *.html page in this repo, and are heavy enough to matter.

Usage:
    python3 tools/optimize-images.py --scan            # just list offenders
    python3 tools/optimize-images.py --fix             # optimize them + print
                                                         # the <img>/CSS edits
                                                         # to make
    python3 tools/optimize-images.py uploads/"some raw file.png"   # optimize
                                                         # one specific file

Why "--scan" instead of "every file in uploads/ without a match in opt/":
lots of files in uploads/ are *supposed* to stay full-resolution — they're
only ever reached through a gallery's data-full="..." lightbox attribute
(fetched once, on click, when the viewer wants to zoom). Optimizing those
would be pointless busywork. The actual page-weight problem is images
referenced directly as <img src="uploads/X"> or CSS background:url(...) —
those get downloaded by *every* visitor on page load. This script finds
exactly that set, by parsing every *.html page.

For each offender it writes a resized, compressed thumbnail to
uploads/opt/<name>.<ext> and prints ready-to-paste markup:
  - images with an alpha channel (transparent PNGs, e.g. the chrome icon
    renders) -> lossy WebP, alpha preserved, ~80-95% smaller
  - opaque photos -> JPEG quality 78, ~80-90% smaller
The original file in uploads/ is left untouched, so nothing breaks if
something else still points at it (e.g. a data-full lightbox target).

Requires Pillow (`pip3 install Pillow`).
"""
import glob
import html
import os
import re
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
UPLOADS = ROOT / "uploads"
OPT_DIR = UPLOADS / "opt"

# Long edge cap for the thumbnail. Big enough to stay crisp at 2x retina for
# anything these pages actually display; way smaller than typical raw
# uploads (1080x1920 campaign exports, etc).
MAX_EDGE = 1000
JPEG_QUALITY = 78
WEBP_QUALITY = 82
# Below this, a file isn't worth touching even if it's technically un-opt'd
# (small logos, tiny icons).
MIN_SIZE_TO_FLAG = 60 * 1024


def slugify(name: str) -> str:
    stem = Path(name).stem
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", stem).strip("-").lower()
    return slug or "img"


def find_direct_references():
    """Every uploads/... path any *.html loads directly (not via opt/)."""
    refs = {}  # url -> set of pages
    for page in sorted(glob.glob(str(ROOT / "*.html"))):
        src = open(page, encoding="utf-8").read()
        page_name = os.path.basename(page)
        for pat in (
            r'<img\b[^>]*\bsrc="(uploads/[^"]+)"',
            r'background:\s*url\((?:&quot;|"|\')?(uploads/[^)"\'&]+)',
        ):
            for m in re.finditer(pat, src):
                url = html.unescape(m.group(1))
                if "/opt/" in url:
                    continue
                refs.setdefault(url, set()).add(page_name)
    return refs


def has_alpha(im: Image.Image) -> bool:
    if im.mode in ("RGBA", "LA"):
        return im.getchannel("A").getextrema()[0] < 255
    if im.mode == "P" and "transparency" in im.info:
        return True
    return False


def optimize_one(src: Path) -> Path:
    im = Image.open(src)
    orig_mode = im.mode
    transparent = has_alpha(im) if orig_mode in ("RGBA", "LA", "P") else False

    if transparent:
        im = im.convert("RGBA")
    else:
        im = im.convert("RGB")

    w, h = im.size
    long_edge = max(w, h)
    if long_edge > MAX_EDGE:
        scale = MAX_EDGE / long_edge
        im = im.resize((max(1, round(w * scale)), max(1, round(h * scale))), Image.LANCZOS)

    OPT_DIR.mkdir(parents=True, exist_ok=True)
    slug = slugify(src.name)
    if transparent:
        out = OPT_DIR / f"{slug}.webp"
        im.save(out, "WEBP", quality=WEBP_QUALITY, method=6)
    else:
        out = OPT_DIR / f"{slug}.jpg"
        im.save(out, "JPEG", quality=JPEG_QUALITY, optimize=True)
    return out


def report(src: Path, out: Path, pages=None):
    before = src.stat().st_size
    after = out.stat().st_size
    pct = 100 * (1 - after / before) if before else 0
    rel_src = src.relative_to(ROOT)
    rel_out = out.relative_to(ROOT)
    where = f"  (used in: {', '.join(sorted(pages))})" if pages else ""
    print(f"{src.name}: {before/1024:.0f}KB -> {after/1024:.0f}KB ({pct:.0f}% smaller){where}")
    print(f"  old: uploads/{src.name}")
    print(f"  new: {rel_out}")
    print()


def cmd_scan_or_fix(fix: bool):
    refs = find_direct_references()
    offenders = []
    for url, pages in sorted(refs.items()):
        path = ROOT / url
        if not path.is_file():
            continue
        size = path.stat().st_size
        if size >= MIN_SIZE_TO_FLAG:
            offenders.append((size, path, pages))
    offenders.sort(key=lambda r: -r[0])

    if not offenders:
        print("No directly-embedded, un-optimized images found above the size threshold. Clean.")
        return

    total = sum(o[0] for o in offenders)
    print(f"{len(offenders)} directly-embedded image(s), {total/1024/1024:.2f} MB total:\n")
    for size, path, pages in offenders:
        print(f"  {size/1024:6.0f} KB  {path.relative_to(ROOT)}  ({', '.join(sorted(pages))})")
    print()

    if not fix:
        print("Re-run with --fix to generate optimized versions + the edits to make.")
        return

    print("=" * 60)
    for size, path, pages in offenders:
        out = optimize_one(path)
        report(path, out, pages)


def main():
    args = sys.argv[1:]
    if args == ["--scan"]:
        cmd_scan_or_fix(fix=False)
    elif args == ["--fix"]:
        cmd_scan_or_fix(fix=True)
    elif args:
        for a in args:
            src = Path(a)
            if not src.exists():
                print(f"SKIP (not found): {src}")
                continue
            out = optimize_one(src)
            report(src, out)
    else:
        print(__doc__)
        sys.exit(1)


if __name__ == "__main__":
    main()
