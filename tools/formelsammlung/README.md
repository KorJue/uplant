# Formelsammlungen

Jede Formelsammlung ist ein zweiseitiges PDF im Querformat, das zu einer Seite
der Website gehört und dort zum Herunterladen angeboten wird. Sie entsteht nicht
in einem Zeichenprogramm, sondern wird gerechnet und gesetzt — damit keine
Skizze etwas anderes behaupten kann als die Formel daneben.

Alle Werkzeuge nehmen einen **Präfix** entgegen, der die Formelsammlung
benennt. Vorhanden sind:

| Präfix | Formelsammlung | Ziel |
| --- | --- | --- |
| `tf` | Trigonometrische Funktionen (Grundwissen 5–10, Kapitel 4, Thema 12) | `mathematik/grundwissen-5-10/04-gleichungen-zuordnungen-funktionen/12-trigonometrische-funktionen/formelsammlung.pdf` |
| `gk` | Grundkonstruktionen und besondere Linien am Dreieck (Klasse 8, Geometrie, Thema 1) | `mathematik/klasse-8/geometrie/grundkonstruktionen-formelsammlung.pdf` |
| `th` | Satz des Thales (Klasse 8, Geometrie, Thema 3) | `mathematik/klasse-8/geometrie/satz-des-thales.pdf` |
| `fl` | Flächeninhalte (Klasse 8, Geometrie, Thema 4) | `mathematik/klasse-8/geometrie/flaecheninhalte.pdf` |
| `w1` | Grundbegriffe, Baumdiagramme und Vierfeldertafel (MSS 13, Wahrscheinlichkeitsrechnung, Thema 1) | `mathematik/mss13/01-wahrscheinlichkeitsrechnung/01-grundbegriffe-baumdiagramme-vierfeldertafel/formelsammlung.pdf` |
| `w2` | Bedingte Wahrscheinlichkeit (MSS 13, Wahrscheinlichkeitsrechnung, Thema 2) | `mathematik/mss13/01-wahrscheinlichkeitsrechnung/02-bedingte-wahrscheinlichkeit/formelsammlung.pdf` |
| `w3` | Baumdiagramme umdrehen (MSS 13, Wahrscheinlichkeitsrechnung, Thema 3) | `mathematik/mss13/01-wahrscheinlichkeitsrechnung/03-baumdiagramme-umdrehen/formelsammlung.pdf` |
| `w4` | Stochastische Unabhängigkeit (MSS 13, Wahrscheinlichkeitsrechnung, Thema 4) | `mathematik/mss13/01-wahrscheinlichkeitsrechnung/04-stochastische-unabhaengigkeit/formelsammlung.pdf` |
| `bk` | Bernoulli-Ketten und Binomialverteilung (MSS 13, Wahrscheinlichkeitsrechnung, Thema 5) | `mathematik/mss13/01-wahrscheinlichkeitsrechnung/05-bernoulli-ketten-binomialverteilung/formelsammlung.pdf` |

## Der Weg von der Quelle zum PDF

```bash
python3 <praefix>-svgs.py                       # Figuren rechnen  → <praefix>-figuren.txt
python3 bau.py <praefix>                        # Platzhalter füllen → formelsammlung-<praefix>.html
node mess.js <praefix>                          # jede Seite gegen 752,1 px messen
node render.js <praefix> <zielpfad>             # PDF schreiben (Pfad ab Projektwurzel)
```

Node braucht Playwright: `NODE_PATH=/opt/node22/lib/node_modules
/opt/node22/bin/node …`; das Chromium liegt unter `/opt/pw-browsers/chromium`.

Versioniert werden die Quellen — `formelsammlung-<praefix>-quelle.html`,
`<praefix>-svgs.py`, `tf_kopf.py` und für die Wahrscheinlichkeitsrechnung `ws_kopf.py` — und das
fertige PDF am Ziel. `ws_kopf.py` baut Baum, Flächenmodell und Vierfeldertafel aus den
Wahrscheinlichkeiten und bricht ab, wenn an einem Knoten nicht 1 herauskommt oder die Flächen das
Quadrat nicht füllen; ein absichtlich falscher Baum (Stolperstelle) muss dagegen mindestens einen
Knoten haben, der nicht 1 ergibt. `<praefix>-figuren.txt` und
`formelsammlung-<praefix>.html` entstehen bei jedem Lauf neu.

## Eine neue Formelsammlung anlegen

1. **Figuren.** `<praefix>-svgs.py` schreiben, Vorbild `th-svgs.py`. Aus
   `tf_kopf.py` kommen die Farben und die Zeichenbausteine; `setze_flaeche`
   meldet über `pruefe_im_bild` jedes Element, das aus der Zeichenfläche ragt.
   Jeder Punkt wird aus der Formel gerechnet, nie von Hand gesetzt.
2. **Text.** `formelsammlung-<praefix>-quelle.html` anlegen — den Kopf mit
   `@page`, Raster und Klassen aus einer bestehenden Quelle übernehmen. Der
   Inhalt steht in `.box`-Kästen im dreispaltigen `.grid`; `.wide` überspannt
   zwei Spalten, `.full` drei. Die Figuren kommen als `[[FIG1]]`, `[[FIG2]]` …
   in der Reihenfolge von `FIGUREN`.
3. **Messen statt hoffen.** `mess.js` nennt für jede Seite die Höhe und für
   jeden Kasten seinen Anteil. Reißt eine Seite die 752,1 px, zeigt die Liste,
   welcher Kasten die Zeile treibt: Figur verkleinern (`.m80`, `.m70`, …),
   Kasten in eine andere Zeile verschieben oder auf die zweite Seite nehmen.
4. **Ansehen.** Ein Screenshot der `.page`-Elemente deckt auf, was keine Höhe
   misst: Beschriftungen, die eine Linie kreuzen, oder eine Bildunterschrift,
   die in die Zeichnung ragt. Für Text auf unruhigem Grund hat `txt()` den
   Schalter `halo=True`.
5. **Verlinken.** Die Seite bekommt einen Abschnitt „Formelsammlung“ mit einem
   `download`-Verweis auf das PDF; die Prüfung des Themas stellt sicher, dass
   der Verweis nicht ins Leere führt.
