#!/usr/bin/env python3
"""
Komprimiert Rohbilder nach img/web/*.webp (WebP, verkleinert).

Quellen (in dieser Reihenfolge, gleicher Dateiname: zuerst „originals“ gewinnt):
  - img/originals/
  - img/          (direkt im Ordner, z. B. wenn noch kein originals-Unterordner genutzt wird)

Abhängigkeit: pip install Pillow   oder   pip install -r requirements-compress.txt

Aufruf (im Projektroot):
  python compress_images.py
"""
from __future__ import annotations

import io
import sys
from pathlib import Path

try:
    from PIL import Image, ImageOps
except ImportError:
    print("Bitte Pillow installieren:  pip install Pillow", file=sys.stderr)
    sys.exit(1)

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "img" / "originals"
IMG = ROOT / "img"
OUT = ROOT / "img" / "web"

# lange Kante max. Pixel je nach Verwendung (Dateiname-Muster)
HERO_MAX = 1600
CARD_MAX = 900
GALLERY_MAX = 560
DEFAULT_MAX = 1000

WEBP_QUALITY = 82
WEBP_METHOD = 6  # 0–6, höher = bessere Kompression, langsamer


def max_side_for(name: str) -> int:
    n = name.lower()
    if n.startswith("hero"):
        return HERO_MAX
    if n.startswith("gallery-") or n.startswith("galerie-"):
        return GALLERY_MAX
    if n.startswith("getraenk-"):
        return GALLERY_MAX
    if n in (
        "woid-burger",
        "rahmschwammerl",
        "zwiebelrostbraten",
        "kuerbis-risotto",
        "brotzeitbrettl",
        "schwarzwaelder",
    ):
        return CARD_MAX
    return DEFAULT_MAX


def load_image(path: Path) -> Image.Image:
    im = Image.open(path)
    im = ImageOps.exif_transpose(im)
    if im.mode in ("RGBA", "P"):
        im = im.convert("RGBA")
    if im.mode == "RGBA":
        extrema = im.getchannel("A").getextrema()
        if extrema == (255, 255):
            return im.convert("RGB")
        return im
    return im.convert("RGB")


def resize_long_edge(im: Image.Image, max_side: int) -> Image.Image:
    w, h = im.size
    long_edge = max(w, h)
    if long_edge <= max_side:
        return im
    scale = max_side / float(long_edge)
    nw = max(1, int(round(w * scale)))
    nh = max(1, int(round(h * scale)))
    return im.resize((nw, nh), Image.Resampling.LANCZOS)


def collect_source_files() -> list[Path]:
    """img/originals zuerst, dann lose Dateien in img/ — Duplikate nach Stammname überspringen."""
    exts = {".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff", ".bmp"}
    seen: set[str] = set()
    out: list[Path] = []
    for folder in (SRC, IMG):
        if not folder.is_dir():
            continue
        for path in sorted(folder.iterdir()):
            if not path.is_file():
                continue
            if folder == IMG and path.parent != IMG:
                continue
            if path.suffix.lower() not in exts:
                continue
            if path.name.upper().startswith("README"):
                continue
            key = path.stem.lower()
            if key in seen:
                continue
            seen.add(key)
            out.append(path)
    return out


def save_webp(im: Image.Image, dest: Path, quality: int) -> int:
    buf = io.BytesIO()
    im.save(
        buf,
        format="WEBP",
        quality=quality,
        method=WEBP_METHOD,
        lossless=False,
    )
    data = buf.getvalue()
    dest.write_bytes(data)
    return len(data)


def main() -> int:
    if not IMG.is_dir():
        print(f"Ordner fehlt: {IMG}", file=sys.stderr)
        return 1

    SRC.mkdir(parents=True, exist_ok=True)
    OUT.mkdir(parents=True, exist_ok=True)

    files = collect_source_files()
    if not files:
        print(f"Keine Bilder gefunden. Lege Dateien in {SRC} oder direkt in {IMG} ab (siehe README).")
        return 0

    total_in = 0
    total_out = 0

    for path in files:
        stem_key = path.stem.lower()
        max_side = max_side_for(stem_key)
        try:
            im = load_image(path)
            im = resize_long_edge(im, max_side)
            dest = OUT / f"{stem_key}.webp"
            size_out = save_webp(im, dest, WEBP_QUALITY)
        except Exception as e:
            print(f"Überspringe {path.name}: {e}", file=sys.stderr)
            continue

        size_in = path.stat().st_size
        total_in += size_in
        total_out += size_out
        ratio = 100.0 * (1 - size_out / size_in) if size_in else 0
        print(f"{path.name}  →  {dest.name}   {size_in/1e6:.2f} MB → {size_out/1024:.1f} KB  (−{ratio:.0f}%)")

    print(
        f"\nGesamt: {total_in/1e6:.2f} MB → {total_out/1024:.1f} KB  (Ausgabe: {OUT})"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
