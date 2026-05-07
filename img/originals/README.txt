Menüfotos: Ordnerstruktur img/menu/
===================================

Rohbilder (PNG/JPG …) liegen nach Kategorie unter:

  img/menu/vorspeisen/
  img/menu/hauptgerichte/
  img/menu/brotzeit/
  img/menu/suesses/
  img/menu/getränke/          (Ordnername mit „ä“ ist ok)

Der Dateiname (ohne Endung) wird für die Web-Datei in img/web/ automatisch
in einen kurzen Slug umgewandelt, z. B.:

  Woid‑Burger.png              → img/web/woid-burger.webp
  Kürbis‑Risotto.png           → img/web/kuerbis-risotto.webp
  Brotzeitbrettl „Regional“.png → img/web/brotzeitbrettl-regional.webp
  Obatzda & Radi.png           → img/web/obatzda-und-radi.webp
  Schwarzwälder.png            → img/web/schwarzwaelder.webp

Zusätzlich (optional):

  img/originals/hero.jpg        → img/web/hero.webp   (Startseite Hero rechts)

Kompression ausführen (Projektroot):

  pip install -r requirements-compress.txt
  python compress_images.py

Alle passenden Bilder unter img/menu/** und in img/originals/ werden
gelesen, verkleinert und nach img/web/*.webp geschrieben (typisch stark
kleiner als die Rohdateien).

Die Website verlinkt nur noch img/web/*.webp — die großen Originale
bleiben in img/menu/ bzw. img/originals/ und werden nicht ausgeliefert.
