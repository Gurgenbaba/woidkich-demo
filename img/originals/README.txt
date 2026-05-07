Rohfotos hier ablegen (JPG / PNG / TIFF …) — alternativ dieselben Dateinamen direkt im Ordner „img/“ (oberste Ebene, nicht in „web/“). Große Dateien (z. B. 50 MB) sind für’s Web ungeeignet.

Kompression (WebP, verkleinert):
  1. Im Projektordner:  pip install -r requirements-compress.txt
  2. Dann:            python compress_images.py

Ausgabe: ../web/<gleicher Dateiname>.webp

Benennung der Rohdateien (Dateiname ohne Endung = Web-Dateiname):

  hero.jpg              → web/hero.webp           (Hero rechts, max. lange Kante 1600 px)
  woid-burger.jpg       → web/woid-burger.webp    (Karten „Unsere Küche“, max. 900 px)
  rahmschwammerl.jpg
  zwiebelrostbraten.jpg
  kuerbis-risotto.jpg   (Umlaut im Namen vermeiden: kuerbis)
  brotzeitbrettl.jpg
  schwarzwaelder.jpg

  gallery-1.jpg … gallery-7.jpg   → Galerie-Streifen (max. 560 px)
  getraenk-1.jpg … getraenk-3.jpg → Getränke-Bildleiste (Startseite + Speisekarte)

Weitere Dateien werden ebenfalls komprimiert; die HTML-Seiten erwarten nur die oben genannten Namen.

Diese README-Datei wird vom Skript nicht verarbeitet.
