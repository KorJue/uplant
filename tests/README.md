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
| `themen/test-*.js` | Der Fachinhalt eines einzelnen Themas. |

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
* **Streuungsschranken ausrechnen, nicht raten.** Bei `n` Kandidaten und `k`
  Zügen ist der Erwartungswert der verschiedenen Aufgaben
  `E = n · (1 − (1 − 1/n)^k)`; die Schranke gehört auf `E − 3σ`, und die
  Rechnung gehört als Kommentar daneben.
* **Playwright in dieser Fassung** behandelt eine Zeichenkette als
  `pageFunction` wie einen *Ausdruck*, nicht wie eine Funktion. Messhelfer
  werden deshalb einmal über `eval` auf `window` gelegt und danach aus echten
  Pfeilfunktionen heraus aufgerufen.
