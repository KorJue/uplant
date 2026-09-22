# uplant — Arbeitsanweisung

Statische Lernseiten für Mathematik (HTML/CSS/Vanilla-JS, kein Build-Schritt,
Auslieferung über GitHub Pages). Jede Seite ist ein **Selbstlernpfad**: erarbeiten,
verstehen, üben — ohne Lehrkraft daneben.

Maßstab sind die zuletzt entstandenen Seiten. Wer etwas Neues baut, sieht dort
nach, bevor er etwas erfindet:

| Vorbild | Pfad |
| --- | --- |
| Grundwissen 5–10 (34 Themen, einheitlicher Bauplan) | `mathematik/grundwissen-5-10/` |
| Satz des Thales (Klasse 8, freier Aufbau, Konstruktion) | `mathematik/klasse-8/geometrie/satz-des-thales.*` |
| Flächeninhalte (Klasse 8, bewegliche Herleitungen) | `mathematik/klasse-8/geometrie/flaecheninhalte.*` |

## Arbeitsablauf für eine neue Seite

Die Reihenfolge ist nicht beliebig — jeder Schritt fängt Fehler, die der nächste
sonst teuer macht:

1. **Vorbild lesen.** Die nächstverwandte fertige Seite öffnen und ihren Aufbau
   übernehmen, statt einen eigenen zu erfinden.
2. **Didaktische Reihenfolge festlegen.** Was baut auf was auf? Keine Herleitung
   darf auf eine spätere vorgreifen (§ 1). Diese Entscheidung zuerst treffen —
   sie bestimmt den Rest.
3. **Seite bauen:** HTML-Gerüst, Zeichnungen, Bilanzen, Kontrollfragen,
   Vernetzung, Formelsammlung, Aufgaben.
4. **Im Browser ansehen** — hell **und** dunkel, jede Zeichnung an mehreren
   Reglerstellungen, mit Blick auf Beschriftungen (§ 2). Skriptfehler prüfen.
5. **Im Menü anmelden** (§ 4) und die fachliche Prüfung schreiben (§ 6).
6. **Streuungsschranken messen** und eintragen (§ 6).
7. **Die Prüfung selbst prüfen**: Mutation einbauen, nachsehen, ob sie anschlägt,
   zurücksetzen (§ 6).
8. **Gesamtlauf** — und währenddessen nichts anfassen.
9. **Commit und Push** (§ 8).

---

## 1. Der oberste Grundsatz

**Eine Seite darf nie etwas behaupten, was sie nicht zeigt.**

Daraus folgt alles Weitere. Eine Zeichnung, die „A = g · h" schreibt und eine
Figur mit anderem Flächeninhalt zeichnet, ist schlimmer als gar keine Zeichnung:
Sie bringt jemandem etwas Falsches bei, der keine Möglichkeit hat, es zu merken.
Deshalb rechnet die Prüfung jede angezeigte Zahl unabhängig nach und liest jede
Zeichnung aus dem gezeichneten SVG zurück.

Zwei Folgerungen, die oft übersehen werden:

* **Kein Vorgriff.** Eine Herleitung darf nur benutzen, was vorher schon
  hergeleitet wurde. Auf der Flächeninhalte-Seite steht das Dreieck vor dem
  Parallelogramm, also wird es durch Ergänzen zum *Rechteck* hergeleitet — der
  sonst übliche Weg über das Parallelogramm wäre ein Zirkelschluss. Die Prüfung
  wacht darüber (`test-flaecheninhalte.js`, Abschnitt `geruest`).
* **Kein Stoff aus späteren Jahrgängen.** Wo eine schräge Länge als Zahl
  gebraucht wird, der Satz des Pythagoras aber noch nicht dran ist, steht
  „gemessen" daran — und die Prüfung verlangt dieses Wort.

## 2. Bewegung statt Standbild

Jede Herleitung bewegt wirklich etwas: Das abgeschnittene Dreieck wandert, die
Kopie dreht sich, die Reststücke klappen ein. Ein Standbild *behauptet*, die
Flächen seien gleich; eine Bewegung, bei der kein Stück verschwindet und keines
dazukommt, *zeigt* es.

Technisch heißt das: Die Bewegung muss **starr** sein. Jedes bewegte Teil behält
in jeder Zwischenstellung seinen Flächeninhalt, und die Prüfung misst das an
mehreren Reglerstellungen nach — nicht nur am Anfang und am Ende.

Die Bühne wird über `buehneAuto(breite, maxHoehe, punkte)` aufgespannt und
bekommt die **gesamte Bewegungsspur** mitgegeben (`drehSpur()`), sonst ragt ein
gedrehtes Teil auf halbem Weg aus dem Bild und sieht aus, als wäre es
zerschnitten. Die Breite steht fest, die Höhe ergibt sich aus dem Inhalt — sonst
springt die Zeichnung beim Ziehen am Regler seitlich weg.

**Beschriftungen kollidieren, und zwar zuverlässig.** Zwei Maße auf halber Höhe
liegen übereinander; ein Maß am linken Rand wird abgeschnitten, weil `mass()`
mittig ausrichtet. Beides fällt in keiner Prüfung auf — nur im Bild. Deshalb
gehört zu jeder neuen Zeichnung ein **Blick auf einen Screenshot**, und zwar an
mehreren Reglerstellungen (Anfang, Mitte, Ende der Bewegung; Regler an beiden
Anschlägen). Ausweichen durch Versatz in Bildpunkten, und der Grund gehört als
Kommentar daneben, sonst wird er später „aufgeräumt".

## 3. Gerechnet wird mit Reglerwerten, nie mit Bildschirmkoordinaten

Aus Koordinaten käme `15.749999999999998` heraus, und die Bilanz behauptete dann
etwas anderes als die Formel. Die Zeichnung ist Anzeige, nicht Rechengrundlage.

Ausgabe immer über den `num()`-Helfer der Seite (deutsche Schreibweise,
`toLocaleString("de-DE")`), gerundet **vor** der Ausgabe, damit `−0,0001` nicht
als „−0" erscheint. Für „=" gegen „≈" gibt es `zeichen()`: Entscheidend ist, ob
die Anzeige den Wert mit der gewählten Stellenzahl genau trifft — nicht, ob er
ganzzahlig ist.

### Regler lügen nicht

Wo ein Reglerwert eingeschränkt werden muss, wird er über
`begrenzt(id, wert, min, max)` begrenzt — und das **schreibt den Wert in den
Regler zurück**. Ein Regler darf nie auf 5 stehen, während mit 4 gerechnet wird.

`test-alle-themen.js` prüft das für jeden Regler jeder Grundwissen-Seite: Springt
ein Regler über einen Wert hinweg, muss das Sprungziel selbst einstellbar sein
und **dasselbe Bild** ergeben, als hätte man es direkt gewählt. Und derselbe
Reglerwert muss zweimal dieselbe Anzeige liefern.

Solche Grenzen sind oft **geometrisch notwendig**, nicht kosmetisch: Beim
Mittellinien-Widget der Flächeninhalte klappt das Abtrennen unten nur, solange
beide Schenkel nach innen fallen (`0 ≤ Versatz ≤ a − c`); bei negativem Versatz
läge das überstehende Stück oben, und die Zeichnung zählte ein Stück doppelt.
Wo eine Grenze aus der Sache folgt, ist es oft besser, den Regler einen
**Anteil** einstellen zu lassen statt einer absoluten Länge — dann trifft er den
gültigen Bereich immer genau, bei jeder Figur.

## 4. Aufbau einer Seite

### Der Rahmen

Jede Lernseite trägt denselben Rahmen — Brotkrumenpfad, Kopf, `main`, Fußzeile:

```html
<nav class="breadcrumb">…<span class="sep">/</span>… aktueller Titel</nav>
<header class="page-header"><h1>…</h1><p>Ein Selbstlernpfad: …</p></header>
<main class="menu-main"> … die Abschnitte … </main>
<footer class="site-footer">
  <p><a href="../index.html">Zurück zu …</a></p>
  <p><a href="…/haftungsausschluss.html">Haftungsausschluss</a></p>
</footer>
```

Der Haftungsausschluss steht auf **jeder** Seite; die Brotkrumen enden ohne
Verweis beim eigenen Titel.

### Eine neue Seite anmelden

Eine Seite, die in keinem Menü steht, findet niemand. Sie gehört in die
`index.html` des übergeordneten Verzeichnisses als Karte:

```html
<a class="menu-card" data-section="klasse-8" href="neue-seite.html" hidden>
  <h2>7. Titel<br><small class="menu-tiny">Untertitel</small></h2>
</a>
```

(Der `menu-tiny`-Untertitel ist freiwillig und lohnt sich, wo der Titel allein
nicht verrät, was auf der Seite passiert.)

`hidden` und `data-section` sind beide **nötig**: `assets/access-gate.js` blendet
nur die Karten ein, deren Bereich auf der Startseite freigeschaltet wurde. Fehlt
`data-section`, bleibt die Karte für immer unsichtbar; fehlt `hidden`, ist sie
schon vor der Freischaltung zu sehen. (Das ist eine Navigationshilfe, kein
Zugriffsschutz — jede Seite bleibt über ihre Adresse erreichbar.)

### Die Abschnitte

```html
<section class="card" id="sec-…">      <!-- ein Erarbeitungsschritt -->
  <h2>…</h2>
  <p>…</p>
  <div class="widget">                  <!-- die bewegliche Zeichnung -->
    <div class="btn-row"><label>… <input type="range" id="xx-…"> <span id="xx-…-anzeige"></span></label></div>
    <div class="th-wrap" id="xx-mount"></div>
    <div class="th-bilanz" id="xx-bilanz"></div>   <!-- die nachgerechnete Bilanz -->
    <div id="xx-text" class="event-result"></div>  <!-- was gerade zu sehen ist -->
  </div>
  <div class="wissen-box">…</div>       <!-- Merksatz, rot -->
  <div class="beispiel-box">…</div>     <!-- durchgerechnet, grün -->
  <div class="achtung-box">…</div>      <!-- typischer Fehler -->
  <p class="hinweis-box">💡 …</p>       <!-- Vertiefung -->
  <div class="formula-block">…</div>    <!-- freistehende Formel -->
  <div class="quiz" id="quiz-…"></div>  <!-- Kontrollfrage zu DIESEM Abschnitt -->
</section>
```

Feste Reihenfolge am Seitenende: **Vernetzung** (`sec-vernetzung`,
`<ul class="vernetzung-liste">` mit „Baut auf" / „Führt weiter zu"), dann
**Formelsammlung** (`sec-formelsammlung`), dann **Übungsaufgaben**
(`sec-uebungen` mit einem leeren Mount-`div`).

Eingebunden werden `assets/theme.js` (vor allem anderen, gegen Aufblitzen im
Dunkelmodus), `assets/site.css`, `mathematik/aufgaben.css`, die eigene
`lernpfad.css` und am Ende `<script type="module" src="lernpfad.js?v=N">`.
Die Versionsnummer im Dateinamen wird bei inhaltlichen Änderungen erhöht.

Am Ende des Moduls werden alle Regler verdrahtet **und jede Zeichnefunktion
einmal von Hand aufgerufen** — sonst bleibt die Seite leer, bis jemand einen
Regler anfasst:

```js
["dr-g", "dr-h", "dr-t"].forEach((id) =>
  document.getElementById(id).addEventListener("input", renderDreieck));
renderDreieck();   // nicht vergessen
```

**Jeder Erarbeitungsabschnitt bekommt seine eigene Kontrollfrage.** Vier
Antworten, genau eine richtig, und eine Erklärung, die auch bei einer richtigen
Antwort noch etwas erklärt — nicht bloß „genau!". Die richtige Antwort darf
**nicht immer an derselben Stelle** stehen, sonst lässt sich die ganze Seite
durchklicken, ohne eine Frage zu lesen.

### Farbcodierung

Durchgehend auf allen Geometrieseiten: Grundseite **blau**, Höhe **violett**,
Flächeninhalt **grün**, zweites/umgelegtes Stück **orange**, Warnung **rot**,
Hilfslinie **grau**. Im JS als `FARBE`-Objekt, im CSS als `.th-name-a/-b/-c/-r/-g`
beziehungsweise `.wa/.wb/.wc/.wr/.wg`.

Jede Farbe braucht eine Entsprechung unter
`:root[data-theme="dark"]`. Dunkelgrün, Violett und Dunkelrot verschwinden auf
dunklem Grund sonst fast vollständig — `tests/lib/kontrast.js` misst den
Leuchtdichteabstand gegen den *wirklichen* Untergrund und verlangt mindestens 45.

## 5. Übungsaufgaben

Gebaut über die gemeinsame Werkbank `mathematik/aufgaben.js`:

```js
import { mountUebungsaufgaben } from "../../aufgaben.js?v=1";
mountUebungsaufgaben(container, AUFGABEN, { parse: eigeneZahlenerkennung });
```

Vier Stufen (`einfach`, `mittel`, `schwierig`, `komplex`). Jede Aufgabe ist
`{ schwierigkeit, titel, generate }`; `generate()` würfelt und liefert
`promptHtml`, `correct`+`tolerance` (oder `felder[]`, oder `check(roh)`),
`hinweis(roh, wert)`, `tipps[]` und `musterloesungHtml`. Der vollständige
Vertrag steht als Kommentar über `mountUebungsaufgaben()`.

**Der Grundwissen-Bestand:** acht Aufgaben je Seite, **zwei auf jeder Stufe**.
Die Klasse-8-Seiten sind freier gebaut; die Flächeninhalte haben zwölf, je eine
Figur pro Stufe. Wie viele es sind, liest die Prüfung aus der Seite selbst
(`aufgabenProReiter()`) — Hauptsache, alle Stufen sind gleich besetzt.

Verbindlich:

* **Konstruktiv würfeln, nie verwerfen.** Kandidatenlisten werden **vorher**
  gefiltert; `ohneKollision(kandidaten, werte)` wählt aus dem gesiebten Rest.
  Rejection Sampling in einer Schleife ist verboten — es kann hängen bleiben,
  und niemand merkt es, bis es passiert.
* **Fehlerwerte paarweise verschieden.** Fällt ein Fehlerwert mit der Lösung
  zusammen, bekäme eine falsche Rechnung ein ✓; fallen zwei Fehlerwerte
  zusammen, wäre die Diagnose mehrdeutig. Wo auf einem Wert kein Hinweis liegt,
  gehört dort `NaN` in die Liste, nicht der Wert selbst.
* **Exakt rechnen.** Vergleiche laufen über `trifft(val, soll)` mit Toleranz,
  nie über `===` — `0,1 + 0,2` ist nicht `0,3`.
* **Vorzeichen nicht unterwegs verlieren.** `num(Math.abs(a))` in der Angabe
  machte aus `−2 · (x − 3)²` ein `2 · (5 − 3)²` — die Aufgabe rechnete dann
  etwas anderes, als sie zeigte. Das Vorzeichen gehört in einen einzigen
  Helfer, nicht an jede Stelle einzeln.
* **Ergebnisse müssen glatt sein.** Eine Aufgabe, deren Lösung
  `7,333333…` lautet, ist keine gute Aufgabe. Kandidaten werden deshalb über
  `glatt(x, stellen)` gefiltert — und das rechnet **ganzzahlig**
  (`Math.round(x * f) - x * f`), damit `1,375 · 1000` nicht als `1374,9999…`
  durchfällt.

Die kleinen Helfer (`pick`, `trifft`, `glatt`, `ohneKollision`, `num`) stehen
**in jeder Seite noch einmal**; geteilt wird nur `mountUebungsaufgaben()` und
`parseFlexibleNumber()` aus `mathematik/aufgaben.js`. Wer sie sucht, findet sie
also in der Nachbarseite — und wer eine davon verbessert, sollte wissen, dass
die anderen davon nichts mitbekommen.
* **Hinweise erklären den Fehler**, sie stellen ihn nicht bloß fest. „Das
  Halbieren fehlt: … ist das umschließende Rechteck, nicht das Dreieck" statt
  „Falsch".
* **Musterlösung immer**, mit dem gerechneten Weg in Schritten — und bei
  Umkehraufgaben mit einer **Probe**.

### Die Kollisionsprüfung — hier steckt der meiste Ärger

`ohneKollision()` **wirft**, wenn nichts übrig bleibt. Das ist kein rot
gewordener Test, sondern ein Absturz im Browser beim Würfeln — er trifft die
Schülerin, nicht die Entwicklung. Deshalb:

* **Die häufigste Ursache ist ein abgeleiteter Wert in der Liste, der mit einem
  gegebenen zusammenfällt.** Bei der Trapezaufgabe stand `(2 · A) / (a + c)` in
  der Liste — das *ist* die Höhe h, die schon drinstand. Also fiel jeder
  Kandidat durch, und der Generator warf bei jedem Aufruf. In die Liste gehören
  nur die **wirklich gegebenen** Größen und die **wirklich möglichen**
  Fehlerwerte, jeder genau einmal.
* Manche Fassungen haben deshalb eine **Frühwarnung**: Bleiben von mehr als 20
  Kandidaten weniger als 2 übrig, werfen sie mit „vermutlich steht ein Wert
  doppelt in der Liste". Diese Meldung ist fast immer wörtlich zu nehmen.
* Ein Fall, der *nie* vorkommt, ist derselbe Fehler mit umgekehrtem Vorzeichen:
  Bei 45° sind Sinus und Kosinus gleich, bei D = 0 fällt die Diskriminante mit
  einem Quadrat zusammen, bei positivem Sinus ist `180° − x₂ = x₁`. Dann
  kollidiert die Gruppe *immer* und der Sonderfall verschwindet lautlos aus dem
  Aufgabenvorrat. Abhilfe: an dieser Stelle `NaN` eintragen
  (`v.alpha === 45 ? NaN : …`), statt den Kandidaten zu opfern.
* Für mehrere Eingabefelder gibt es `ohneFeldKollision(kandidaten, gruppen, eps)`:
  Kollidieren müssen die Werte nur **innerhalb eines Feldes**, denn nur dort
  entscheidet die Zahl über den Hinweis. Zwischen zwei Feldern darf dieselbe
  Zahl stehen. `eps` darf eine Liste sein — ein auf ganze Grad gerundetes Feld
  braucht einen anderen Mindestabstand als eines mit drei Nachkommastellen.
* **Die Reihenfolge in der `falsch`-Liste ist bedeutsam.** Fallen zwei
  Fehlerwerte auf dieselbe Zahl, nennt die Seite den zuerst geprüften Hinweis;
  `pruefeAufgabe()` verlangt dann nur noch die Zurückweisung. Der aussagekräftigere
  Hinweis gehört also nach vorn.

### Figuren in der Aufgabenstellung

`promptHtml` wird über `innerHTML` gesetzt, **eingebettetes SVG funktioniert
also**. Die Flächeninhalte nutzen das für alle Aufgaben der Stufe *einfach*: Die
Maße stehen an der Figur statt im Text, genau wie im Buch.

Wo das geschieht, gilt der oberste Grundsatz doppelt — die Zeichnung muss die
Zahlen tragen, mit denen die Musterlösung rechnet. Die Prüfung liest sie deshalb
über `liesRoh` aus dem SVG zurück (statt aus dem Text) und rechnet damit nach;
Vorbild ist `figurMasse()` in `test-flaecheninhalte.js`. Eine Figur, die 5 cm
zeichnet und 6 cm meint, fiele sonst niemandem auf.

## 6. Prüfungen

`tests/README.md` beschreibt Aufbau und Werkzeuge im Einzelnen und ist beim
Schreiben einer neuen Prüfung die erste Anlaufstelle. Das Wichtigste:

```bash
bash tests/alle-tests.sh              # alles (mehrere Minuten)
bash tests/alle-tests.sh flaechen     # nur passende Dateinamen
```

`alle-tests.sh` bringt seine Umgebung selbst mit und startet bei Bedarf den
Prüfserver. **Wer eine Prüfdatei oder ein Werkzeug einzeln aufruft, muss beides
selbst setzen** — sonst kommt nur `Cannot find module 'playwright'`:

```bash
python3 tests/server.py &                       # falls noch keiner läuft
export NODE_PATH=/opt/node22/lib/node_modules
/opt/node22/bin/node tests/klasse-8/test-flaecheninhalte.js
```

Ein vollständiger Lauf dauert lange: im Hintergrund starten, Ausgabe **direkt in
eine Datei** schreiben (nicht durch eine Pipe — die puffert, und bei einem
Abbruch ist alles weg), und keine geprüfte Datei anfassen, solange er läuft.
Wird währenddessen doch etwas geändert, ist das Ergebnis wertlos und der Lauf
gehört wiederholt — ein grünes Ergebnis für einen Stand, den es nicht mehr gibt,
ist schlimmer als keines.

**Eine neue Seite ohne zugehörige `tests/…/test-*.js` gilt als unfertig.**

### Drei Ebenen

| Ebene | Datei | Gilt für |
| --- | --- | --- |
| Gesamt | `test-seiten-gesamt.js` | jede Seite: lädt hell und dunkel ohne Fehler, jeder Verweis und jede Sprungmarke lösen auf |
| Zusagen | `test-alle-themen.js` | jedes Grundwissen-Thema: Regler lügen nicht, ≥ 3 Kontrollfragen mit genau vier Antworten und genau einer richtigen, vier Reiter, alle Aufgaben mit Musterlösung und ausreichender Streuung |
| Fachlich | `themen/test-*.js`, `klasse-8/test-*.js` | der Inhalt einer einzelnen Seite |
| Vollbild | `klasse-8/test-vollbild.js` | die Geometrieseiten mit „Zeichenfläche vergrößern" |

**Was sich selbst findet und was nicht** — dieser Unterschied ist die häufigste
Quelle stillschweigend ungeprüfter Neuerungen:

* `test-seiten-gesamt.js` und `test-alle-themen.js` lesen das Dateisystem
  (`tests/lib/themen.js`). Ein neues Grundwissen-Thema wird dadurch
  **automatisch** mitgeprüft — es muss die Zusagen also von Anfang an erfüllen.
* `test-vollbild.js` dagegen führt seine Seiten in einer **fest verdrahteten
  Liste** `SEITEN` samt Knopf- und SVG-Kennung. Eine neue Geometrieseite mit
  Zeichenfläche muss dort von Hand eingetragen werden, sonst bleibt ihr Vollbild
  ungeprüft.
* Ebenso braucht jede neue Seite ihre eigene fachliche Prüfdatei — die entsteht
  nicht von selbst.

Das Vollbild hat drei Fehler, die nachweislich schon aufgetreten sind und
deshalb festgehalten sind: Der Knopf zum Beenden muss sichtbar **und** anklickbar
bleiben (sonst ließ sich das Vollbild auf dem iPad nicht mehr verlassen), die
Zeichenfläche muss wirklich größer werden (gemessen wird die **nutzbare** Fläche,
also der von der `viewBox` gefüllte Teil — nicht das Rechteck des Elements), und
ein Klick muss dort ankommen, wo er hinzeigt.

### Was eine fachliche Prüfung leisten muss

* **Unabhängig nachrechnen.** Die Prüfung darf die Formel der Seite nicht
  wiederverwenden, sondern muss sie zweitrechnen. Flächen aus dem SVG über die
  Gaußsche Trapezformel, Maßstab aus zwei bekannten Punkten zurückgerechnet.
* **Über viele Reglerstellungen laufen**, nicht nur über die Anfangsstellung.
* **Aufgaben von beiden Seiten prüfen** (`pruefeAufgabe()`): Die richtige
  Antwort muss anerkannt werden, und **jeder** vorgesehene Fehlerwert muss genau
  seinen Hinweis auslösen.
* **Auch im Dunkelmodus laufen** und dort `pruefeKontrast()` mitnehmen;
  `pruefeNotation()` in beiden Modi.
* **Skriptfehler sind Fehler**: `for (const s of page.stoerungen) pruefe(false, s)`.

Zwei Kleinigkeiten der Helfer, die man einmal wissen muss:

* `setzeRegler()` gibt den **wirklich gesetzten** Wert zurück, nicht den
  gewünschten. Weicht er ab, hat der Regler begrenzt oder auf sein Raster
  gerundet — und dann ist der Rückgabewert die Wahrheit, mit der weitergerechnet
  wird. Nie annehmen, der Wunschwert sei angekommen.
* `wuerfle()` liefert den Aufgabentext als **Klartext mit vereinheitlichten
  Leerzeichen** (`innerText`, dann `\s+` → ein Leerzeichen). Deshalb verschwinden
  Auszeichnungen, und deshalb dürfen die regulären Ausdrücke in `deute()` weder
  HTML noch doppelte Leerzeichen erwarten.

### Fallstricke, die mehrfach Zeit gekostet haben

* **In `muster`-Zeichenketten darf kein HTML stehen.** Die Rückmeldung wird über
  `innerText` gelesen, `<em>`/`<strong>` sind dort weg. Also `"halben Periode"`,
  nicht `"halbe</em> Periode"`.
* **Zahlen, die die Prüfung braucht, gehören in den Aufgabentext** — nicht nur
  in eine Feldbeschriftung. `wuerfle()` liest `.aufgabe-prompt`.
* **Gute Schreibweise lässt Teile weg — der reguläre Ausdruck muss das
  aushalten.** Eine Seite schreibt `x` statt `1x`, `−x` statt `−1x` und
  `h(x) = −5x` statt `−5x + 0`. Wer den Term starr als
  `(-?\d*)x ([+-]) (\d+)` liest, bekommt eine Prüfung, die nur **manchmal**
  fehlschlägt — nämlich wenn der Sonderfall gezogen wird. Solche Muster gehören
  gegen alle Randfälle einzeln geprüft, bevor man sie einbaut; ein
  Fünfzeiler mit `node -e` genügt dafür. (Gefunden in
  `test-lineare-funktionen.js`, A7: zwei von 3348 Prüfungen, nach vielen
  grünen Läufen.)
* **Streuungsschranken werden gemessen, nicht geschätzt.** `ohneKollision()`
  siebt einen guten Teil der Liste weg, und bei gemischten Zweigen (erst Fall
  wählen, dann Kandidat) liegt jede Rechnung auf dem Papier zu hoch. Der Wert
  für `mindestensVerschieden` kommt aus `werkzeug-streuung.js`, die Messung als
  Kommentar daneben. Eine zu hohe Schranke macht den Gesamtlauf **launisch**:
  Er schlägt hin und wieder an einer Stelle fehl, an der nichts kaputt ist —
  das ist schlimmer als eine etwas zu niedrige Schranke.
* **Die Schranke hängt an der Rundenzahl.** Das Werkzeug meldet sie für
  **30 Züge**. Prüft eine Aufgabe mit anderer `runden`-Zahl, gehört die Schranke
  dafür neu gerechnet — mehr Züge bedeuten mehr verschiedene Aufgaben und damit
  eine höhere Schranke:

  ```bash
  export NODE_PATH=/opt/node22/lib/node_modules
  N=/opt/node22/bin/node
  $N tests/werkzeug-streuung.js 07-quadratwurzeln          # Grundwissen: Namensteil
  UPLANT_ZUEGE=25 $N tests/werkzeug-streuung.js \
      /mathematik/klasse-8/geometrie/flaecheninhalte.html  # sonst: Seitenpfad
  ```

  Das Werkzeug würfelt jede Aufgabe 200-mal, rechnet daraus die Größe der
  gezogenen Menge zurück (Sammelbilderproblem) und simuliert das 10⁻⁴-Quantil
  für vorsichtshalber `0,8 · n`. Diese Zahl gehört in `mindestensVerschieden`,
  die Messung als Kommentar daneben.
* **Große Kandidatenlisten nicht beim Laden des Moduls bauen.** 40 000 Einträge
  beim Seitenaufbau sind spürbar; Faktoren getrennt ziehen.
* **`page.mouse.click` rollt die Seite nicht.** Vor jedem Klick
  `scrollIntoView`, sonst landet der Klick außerhalb des Fensters und geht
  stumm verloren. Und der Rahmen der Zeichenfläche gehört vor **jedem** Klick
  neu gemessen — sonst sind die späteren Klicks um die Rollhöhe versetzt, und
  die Prüfung meldet einen Fehler, den es gar nicht gibt.
  `tests/lib/konstruieren.js` nimmt einem das ab (`neueWerkbank()`).
* **Punktnamen über die Gruppe zuordnen** (`.th-punkt-gruppe[data-name]`), nicht
  über den nächstgelegenen Text — bei zwei dicht beieinanderliegenden Punkten
  vertauscht das die Zuordnung.
* **`nr` in `pruefeAufgabe()` ist die laufende Nummer in der `AUFGABEN`-Liste**,
  aus der die erwartete Stufe zurückgerechnet wird. Wird die Liste umsortiert,
  **muss die Prüfung mitgezogen werden** — sonst prüft sie stillschweigend die
  falsche Aufgabe. Beim Umstellen auf Dreieck/Parallelogramm/Trapez war genau
  das nötig.
* **Playwright behandelt in dieser Fassung eine Zeichenkette als `pageFunction`
  wie einen Ausdruck**, nicht wie eine Funktion. Messhelfer werden deshalb
  einmal über `eval` auf `window` gelegt und danach aus echten Pfeilfunktionen
  heraus aufgerufen. Einzelheiten in `tests/README.md`.

### Die Prüfung selbst prüfen

Eine Prüfung, die nicht fehlschlagen kann, ist wertlos. Bei jeder neuen Prüfung:
**eine gezielte Mutation in den Code einbauen und nachsehen, ob sie anschlägt** —
eine Ecke um 0,4 cm verschieben, einen Lösungswert um 2 % verstellen. Schlägt
sie nicht an, fehlt eine Prüfung. Danach zurücksetzen.

So wurde auf der Flächeninhalte-Seite gefunden, dass der Zusammenschau-Abschnitt
zwar die Ecken zählte, aber den gezeichneten Flächeninhalt nie gemessen hat.

## 7. Sprache und Schreibweise

Alle Inhalte auf Deutsch, auch Code-Kommentare, Commit-Nachrichten und
Prüfmeldungen. Typografisch sauber: echtes Minuszeichen `−`, Malpunkt `·`,
Anführungszeichen „…", Dezimalkomma, Tausenderpunkt.

`tests/lib/notation.js` lehnt Schreibweisen ab, die beim Aufbereiten von Zahlen
entstehen: `−−`, `+ −`, `NaN`, `undefined`, `Infinity`, `= =`, `· ·`, `[object`,
und `−0`. Sie sind der zuverlässigste Anzeiger für einen Fehler in der
Zahlenaufbereitung — deshalb wird nicht das Symptom versteckt, sondern die
Ursache behoben.

Brüche werden als echte Brüche gesetzt, Zähler über Nenner:
`<span class="bruch"><span class="z">a + c</span><span class="n">2</span></span>`.

Kommentare erklären **warum**, nicht was. Eine Zeile, die festhält, warum ein
Regler auf `0 ≤ v ≤ a − c` begrenzt ist, verhindert, dass jemand die Grenze
später „aufräumt" und damit die Zeichnung falsch macht.

## 8. Git

Entwicklungszweig, Commit und Push wie in der jeweiligen Aufgabenstellung
vorgegeben. **Kein Pull Request ohne ausdrückliche Bitte.**

Commit-Nachrichten auf Deutsch: erste Zeile als Zusammenfassung, dann ein
Absatz, der das **Warum** erklärt — besonders bei fachlichen Entscheidungen
(„Die Dreiecksherleitung hat das Parallelogramm benutzt und hätte an erster
Stelle vorgegriffen"). Kein Modellname in Commits, PR-Texten oder Code.

## 9. Umgebung

* Kein Build-Schritt, keine Abhängigkeiten zur Laufzeit. Was im Browser läuft,
  steht als Quelltext im Repo.
* Node für die Prüfungen: `/opt/node22/bin/node`,
  `NODE_PATH=/opt/node22/lib/node_modules`.
* Chromium liegt vorinstalliert unter `/opt/pw-browsers/chromium`.
  **Kein `playwright install`** — weder nötig noch möglich.
* Prüfserver: `python3 tests/server.py`, Port 8936 (`UPLANT_PORT`).
