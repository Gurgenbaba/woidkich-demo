# Speisekarte bearbeiten (`menu.json`)

Die Seite `speisekarte.html` lädt alle Gerichte und Getränke aus **`data/menu.json`**. Es gibt kein Backend — Datei im Repo ändern, committen, fertig.

## Neue Speise hinzufügen

1. Öffne `data/menu.json` in einem Editor, der JSON prüft (z. B. VS Code).
2. Suche die passende **Kategorie** unter `"categories"` (`vorspeisen`, `hauptgerichte`, `brotzeit`, `suesses`, `getraenke`).
3. Füge in deren Array **`"items"`** ein neues Objekt ein — **nach** dem letzten Eintrag ein Komma setzen, beim neuen (letzten) Eintrag **kein** Komma nach der schließenden `}`.

### Felder pro Eintrag

| Feld | Pflicht | Beschreibung |
|------|---------|----------------|
| `name` | ja | Name des Gerichts (Zeichenkette) |
| `description` | ja | Kurzbeschreibung |
| `price` | ja | z. B. `"16,90 €"` |
| `image` | nein | Relativer Pfad, z. B. `"img/web/mein-gericht.webp"` — dann erscheint ein Thumbnail |
| `featured` | nein | `true` = hervorgehobene Zeile (wie bisherige Favoriten) |
| `tags` | nein | Array kleiner Labels, z. B. `["Favorit", "Vegetarisch"]` |

## Bildpfad

- Bilder liegen unter **`img/web/`** (WebP empfohlen, exakter Dateiname wie im Repo — GitHub Pages ist case-sensitiv).
- Beispiel: `"image": "img/web/woid-burger.webp"`
- Fehlt die Datei oder der Pfad ist falsch, blendet die Seite die Thumbnail-Fläche dezent aus (wie bisher).

## Neue Kategorie

1. Unter `"categories"` ein neues Objekt anhängen (Kommas zwischen den Objekten nicht vergessen).
2. Pflicht: `"id"` (nur Kleinbuchstaben, keine Leerzeichen — wird als HTML-`id` und Anker genutzt), `"title"`, `"items"`.
3. Optional: `"lead"` (Absatz unter der Überschrift, z. B. bei Hauptgerichten), `"intro"` (längerer Text, z. B. bei Getränken), `"stripImages"` (Array von Bild-URLs für die drei großen Getränke-Kacheln — nur sinnvoll bei Getränken).
4. In `speisekarte.html` im **Subnav** (`Sprungmarken`) ggf. einen Link `<a href="#deine-id">…</a>` ergänzen.

## Beispiel-Eintrag

```json
{
  "name": "Beispielgericht",
  "description": "Kurz was auf den Teller kommt.",
  "price": "12,00 €",
  "image": "img/web/beispiel.webp",
  "featured": false,
  "tags": ["Neu"]
}
```

## JSON-Kommas

- Zwischen zwei Eigenschaften innerhalb eines Objekts: **immer** Komma.
- Zwischen zwei Objekten in einem Array: **immer** Komma.
- **Kein** Komma nach dem letzten Element einer Liste.
- Ungültiges JSON → die Speisekarte lädt nicht; bitte mit JSON-Validator prüfen.

## Dateigröße

`menu.json` klein halten (kurze Texte). Große Texte oder viele Kategorien erhöhen nur die Ladezeit geringfügig — Bilder sind weiterhin separate Dateien unter `img/web/`.
