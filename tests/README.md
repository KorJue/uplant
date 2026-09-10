# Prüfungen

Alle Prüfungen laufen in einem echten Browser gegen die ausgelieferten Seiten.
Sie prüfen nicht, ob eine Seite lädt, sondern ob sie die Wahrheit sagt: Jede
angezeigte Zahl wird unabhängig nachgerechnet, jede Zeichnung aus dem
gezeichneten SVG zurückgelesen, und jede Übungsaufgabe wird mit der richtigen
und mit jeder vorgesehenen falschen Antwort durchgespielt.

## Ausführen

```bash
bash tests/alle-tests.sh              # alles
bash tests/alle-tests.sh trigono      # nur Dateien, deren Name das enthält
```

Das Skript startet bei Bedarf einen Prüfserver auf Port 8936 (änderbar über
`UPLANT_PORT`) und beendet ihn am Ende wieder. Ein vollständiger Lauf dauert
mehrere Minuten; er lässt sich im Hintergrund starten und später einsammeln.

Voraussetzungen: `python3`, ein Node mit Playwright (`UPLANT_NODE`,
Vorgabe `/opt/node22/bin/node`, `NODE_PATH=/opt/node22/lib/node_modules`) und
das vorinstallierte Chromium unter `/opt/pw-browsers/chromium`
(`UPLANT_CHROMIUM`). Ein Nachladen von Browsern ist weder nötig noch möglich.

## Aufbau

| Datei | Prüft |
| --- | --- |
| `test-seiten-gesamt.js` | Jede Seite des Bereichs lädt in hellem und dunklem Modus ohne Skript- oder Konsolenfehler; jeder interne Verweis und jede Sprungmarke lösen auf. |
| `test-alle-themen.js` | Die Zusagen, die für **jedes** Thema gelten: Regler lügen nicht, keine verbotene Schreibweise an keiner Reglerstellung, Quizze mit genau einer richtigen Antwort, vier gestaffelte Aufgaben mit ausreichender Streuung und Musterlösung, gefüllte Zeichenflächen, vorhandene Formelsammlung. |
| `themen/test-*.js` | Der Fachinhalt eines einzelnen Grundwissen-Themas — für jedes der 34 Themen eine Datei, benannt nach seinem Verzeichnis. |
| `klasse-8/test-*.js` | Der Fachinhalt einer Klasse-8-Seite. Diese Seiten haben keinen gemeinsamen Bauplan, deshalb bringt jede Datei ihr eigenes Gerüst mit — bis hin zur Konstruktion mit echten Mausklicks auf die Zeichenfläche. |

`lib/` enthält die geteilten Bausteine:

* `pruefen.js` — Zählwerk und Bericht
* `seite.js` — Browser, Störungsmelder, Reglerbedienung
* `notation.js` — verbotene Schreibweisen (`−−`, `+ −`, `NaN`, `−0`, …)
* `kontrast.js` — Leuchtdichteabstand von Text zu seinem wirklichen Untergrund
* `themen.js` — findet alle Themen im Dateisystem, damit kein neues Thema
  stillschweigend ungeprüft bleibt

## Eine fachliche Prüfung schreiben

Vorbild ist `themen/test-trigonometrische-funktionen.js`. Bewährt haben sich:

* **Werte unabhängig nachrechnen.** Die Prüfung darf die Formel der Seite nicht
  wiederverwenden, sondern muss sie zweitrechnen.
* **Zeichnungen zurücklesen.** Den Maßstab aus zwei Achsenbeschriftungen holen,
  den Ursprung aber aus den Achsenlinien — die Beschriftungen tragen einen
  Grundlinienversatz von wenigen Pixeln.
* **Aufgaben von beiden Seiten prüfen.** Die richtige Antwort muss anerkannt
  werden, und jeder vorgesehene Fehlerwert muss genau seinen Hinweis auslösen.
* **Streuungsschranken ausrechnen, nicht raten.** Bei `n` gleich
  wahrscheinlichen Kandidaten und `k` Zügen ist der Erwartungswert der
  verschiedenen Aufgaben `E = n · (1 − (1 − 1/n)^k)`; die Schranke gehört auf
  `E − 3σ`, und die Rechnung gehört als Kommentar daneben. Zieht der Generator
  *hierarchisch* — erst den Nenner, dann den Zähler — oder siebt er mit
  `ohneKollision()` vor, so gilt die gleichmäßige Formel nicht; dann wird die
  Kandidatenmenge nachgebildet und die Verteilung simuliert. Bei Verteilungen
  mit langem linkem Rand ist das Quantil 10⁻⁴ die ehrlichere Schranke als
  `E − 3σ`.
* **Die Zusagen des Generators mitprüfen.** Wo eine Aufgabe ihre Parameter so
  wählt, dass Lösung und Fehlerwerte paarweise verschieden bleiben, gehört
  genau das in jede Runde geprüft: Fällt ein Fehlerwert mit der Lösung
  zusammen, bekäme eine falsche Rechnung ein ✓; fallen zwei Fehlerwerte
  zusammen, wäre die Diagnose mehrdeutig. Und wo die Hinweise mit einer
  Toleranz vergleichen, muss die Kollisionsprüfung dieselbe Toleranz benutzen.
* **Konstruktionen wirklich konstruieren.** Wo eine Seite Zirkel und Lineal
  anbietet, wird die Konstruktion mit `page.mouse.click` durchgeführt und
  anschließend aus dem SVG zurückgelesen — mitsamt einer falschen Zirkelweite
  und einem Rückgängig-Schritt, damit auch die Ablehnung geprüft ist.
  `page.mouse.click` rollt die Seite **nicht** von selbst zum Ziel; die
  Zeichenfläche gehört vor jedem Klick über `scrollIntoView` ins Bild, sonst
  landet der Klick außerhalb des Fensters und geht stumm verloren.
* **Beschriftungen über ihre Gruppe zuordnen.** Den Namen eines Punktes nicht
  über den nächstgelegenen Text raten — liegen zwei Punkte dicht beieinander,
  vertauscht das die Zuordnung. Die Seite umschließt jeden Punkt samt
  Beschriftung mit einer Gruppe, die den Namen als Attribut trägt.
* **Playwright in dieser Fassung** behandelt eine Zeichenkette als
  `pageFunction` wie einen *Ausdruck*, nicht wie eine Funktion. Messhelfer
  werden deshalb einmal über `eval` auf `window` gelegt und danach aus echten
  Pfeilfunktionen heraus aufgerufen.
