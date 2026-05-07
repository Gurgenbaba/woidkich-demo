#!/usr/bin/env python3
"""
Komprimiert Menüfotos aus img/menu/** und lose Bilder aus img/originals/
nach img/web/<slug>.webp (WebP, verkleinert).

Slug = aus Dateiname (ohne Endung), URL-tauglich (Umlaute, Anführungszeichen, … normalisiert).

Abhängigkeit: pip install Pillow   oder   pip install -r requirements-compress.txt

Aufruf (Projektroot):
  python compress_images.py
"""
from __future__ import annotations

import io
import re
import sys
import unicodedata
from pathlib import Path

try:
    from PIL import Image, ImageOps
except ImportError:
    print("Bitte Pillow installieren:  pip install Pillow", file=sys.stderr)
    sys.exit(1)

ROOT = Path(__file__).resolve().parent
IMG = ROOT / "img"
MENU = IMG / "menu"
SRC = IMG / "originals"
OUT = IMG / "web"

HERO_MAX = 1600
MENU_MAX = 900
MENU_DRINK_MAX = 720
GALLERY_MAX = 560
DEFAULT_MAX = 1000

WEBP_QUALITY = 82
WEBP_METHOD = 6

EXTS = {".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff", ".bmp"}

# Unicode-Bindestriche → normales "-"
_HY = (
    "\u2010\u2011\u2012\u2013\u2014\u2015\u2212\ufe58\ufe63\uff0d"
)


def slugify(stem: str) -> str:
    """Aus Dateiname einen stabilen Web-Dateinamen (ohne Endung) bauen."""
    s = stem.strip()
    for h in _HY:
        s = s.replace(h, "-")
    for ch in "\u201e\u201c\u201d\u00ab\u00bb\u2018\u2019\"'„“":
        s = s.replace(ch, "")
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    trans = str.maketrans(
        {
            "ä": "ae",
            "ö": "oe",
            "ü": "ue",
            "Ä": "ae",
            "Ö": "oe",
            "Ü": "ue",
            "ß": "ss",
            "&": " und ",
        }
    )
    s = s.translate(trans)
    s = s.lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = re.sub(r"-+", "-", s).strip("-")
    return s or "bild"


def fold_de(s: str) -> str:
    return (
        s.lower()
        .replace("ä", "ae")
        .replace("ö", "oe")
        .replace("ü", "ue")
        .replace("ß", "ss")
    )


def parent_is_getraenke_folder(path: Path) -> bool:
    for part in path.parts:
        if fold_de(part) == "getraenke":
            return True
    return False


def max_side_for(path: Path, slug: str) -> int:
    s = slug.lower()
    if s == "hero" or s.startswith("hero-"):
        return HERO_MAX
    if s.startswith("gallery-") or s.startswith("galerie-"):
        return GALLERY_MAX
    if s.startswith("getraenk-"):
        return GALLERY_MAX
    try:
        rel = path.relative_to(MENU)
    except ValueError:
        return DEFAULT_MAX
    if parent_is_getraenke_folder(path):
        return MENU_DRINK_MAX
    return MENU_MAX


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


def iter_menu_images() -> list[Path]:
    if not MENU.is_dir():
        return []
    out: list[Path] = []
    for path in MENU.rglob("*"):
        if not path.is_file():
            continue
        if path.suffix.lower() not in EXTS:
            continue
        if "web" in path.parts:
            continue
        out.append(path)
    return sorted(out)


def iter_originals_flat() -> list[Path]:
    if not SRC.is_dir():
        return []
    out: list[Path] = []
    for path in sorted(SRC.iterdir()):
        if not path.is_file():
            continue
        if path.suffix.lower() not in EXTS:
            continue
        if path.name.upper().startswith("README"):
            continue
        out.append(path)
    return out


def iter_img_root_flat() -> list[Path]:
    """Lose Dateien direkt unter img/ (nicht menu/, nicht web/, nicht originals/)."""
    out: list[Path] = []
    for path in sorted(IMG.iterdir()):
        if not path.is_file():
            continue
        if path.suffix.lower() not in EXTS:
            continue
        out.append(path)
    return out


def collect_by_slug() -> dict[str, Path]:
    """
    Reihenfolge: flache img/-Dateien → originals → menu (menu überschreibt bei gleichem Slug).
    """
    by_slug: dict[str, Path] = {}
    for path in iter_img_root_flat():
        by_slug[slugify(path.stem)] = path
    for path in iter_originals_flat():
        by_slug[slugify(path.stem)] = path
    for path in iter_menu_images():
        by_slug[slugify(path.stem)] = path
    return by_slug


def main() -> int:
    if not IMG.is_dir():
        print(f"Ordner fehlt: {IMG}", file=sys.stderr)
        return 1

    OUT.mkdir(parents=True, exist_ok=True)
    SRC.mkdir(parents=True, exist_ok=True)

    by_slug = collect_by_slug()
    if not by_slug:
        print(
            f"Keine Bilder. Lege PNG/JPG unter {MENU}/… oder {SRC}/ ab (siehe img/originals/README.txt)."
        )
        return 0

    total_in = 0
    total_out = 0

    for slug in sorted(by_slug.keys()):
        path = by_slug[slug]
        max_side = max_side_for(path, slug)
        try:
            im = load_image(path)
            im = resize_long_edge(im, max_side)
            dest = OUT / f"{slug}.webp"
            size_out = save_webp(im, dest, WEBP_QUALITY)
        except Exception as e:
            print(f"Überspringe {path}: {e}", file=sys.stderr)
            continue

        size_in = path.stat().st_size
        total_in += size_in
        total_out += size_out
        ratio = 100.0 * (1 - size_out / size_in) if size_in else 0
        try:
            rel = path.relative_to(ROOT)
        except ValueError:
            rel = path
        print(f"{rel}  →  {dest.name}   {size_in/1e6:.2f} MB → {size_out/1024:.1f} KB  (−{ratio:.0f}%)")

    print(
        f"\nGesamt: {total_in/1e6:.2f} MB → {total_out/1024:.1f} KB  (Ausgabe: {OUT})"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
