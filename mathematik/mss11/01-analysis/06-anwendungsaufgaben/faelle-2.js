// Fälle zu Kapitel 2: Differentialrechnung (2.1) und Ableitung weiterer Funktionen (2.2).

import { num, numFest, bruch } from "./hilfen.js?v=1";

const n = num;
const L21 = "../03-differentialrechnung/index.html";
const L22 = "../03b-weitere-funktionen-ableiten/index.html";

// Tag im Jahr (kein Schaltjahr) als Datum.
const MONATE = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
const TAGE = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
function datum(tag) {
  let t = Math.round(tag);
  for (let m = 0; m < 12; m++) {
    if (t <= TAGE[m]) return `${t}. ${MONATE[m]}`;
    t -= TAGE[m];
  }
  return "";
}

// ---------- 2.1 a: Abschnittskontrolle ----------

const sAk = (t) => -0.001 * t ** 3 + 0.09 * t ** 2 + (80 / 3) * t;
const vAk = (t) => -0.003 * t ** 2 + 0.18 * t + 80 / 3;
const g100 = 100 / 3.6;
const wAk = Math.sqrt(900 - (g100 - 80 / 3) / 0.003);
const tEin = 30 - wAk, tAus = 30 + wAk;

const abschnitt = {
  key: "abschnitt",
  nr: "2.1 a",
  kapitel: "2.1",
  kurs: "gk",
  icon: "🚗",
  titel: "Die Abschnittskontrolle",
  behauptung: "„Die Abschnittskontrolle hat bei mir 96 km/h Durchschnitt gemessen, erlaubt sind 100. Also war ich die ganze Zeit nicht zu schnell.“",
  herkunft: "Erzählung nach der Rückfahrt aus dem Urlaub",
  hintergrund: `<p>In mehreren Nachbarländern, etwa in Österreich und Italien, misst die <strong>Abschnittskontrolle</strong> („Section Control“) die Durchschnittsgeschwindigkeit: Eine Kamera am Anfang und eine am Ende eines Streckenabschnitts erfassen jedes Auto mit der Uhrzeit, aus Strecke und Fahrzeit ergibt sich die mittlere Geschwindigkeit. In Deutschland lief die bisher einzige Anlage ab 2019 auf der B6 bei Hannover auf 2,2 km; Anfang 2024 wurde sie abgeschaltet.</p>`,
  quellen: [
    { text: "eurotransport: Section Control auf der B6", url: "https://www.eurotransport.de/logistik/verkehrspolitik/section-control-auf-b6-ist-rechtmaessig-urteil-des-ovg-niedersachsen/" },
    { text: "bussgeldkatalog.org: Section Control abgeschaltet", url: "https://www.bussgeldkatalog.org/news/section-control-abgeschaltet-das-aus-fuer-die-abschnittskontrolle-8740257/" },
  ],
  modell: `<p>Der Messabschnitt ist 2,4 km lang; das Auto braucht dafür 90 Sekunden. Der zurückgelegte Weg nach t Sekunden:</p>
    <p class="formula-block">s(t) = −0,001t³ + 0,09t² + ${bruch("80", "3")}t &nbsp; (s in m, 0 ≤ t ≤ 90)</p>
    <p class="fc-meta">1 m/s = 3,6 km/h.</p>`,
  figur: {
    titel: "Weg-Zeit-Diagramm im Messabschnitt mit der Sekante vom Start zum Ziel",
    x: { von: 0, bis: 90, schritt: 10, titel: "Zeit t in s" },
    y: { von: 0, bis: 2400, schritt: 400, titel: "Weg s(t) in m" },
    kurven: [
      { f: sAk, von: 0, bis: 90, farbe: "blau", rolle: "weg" },
      { f: (t) => (80 / 3) * t, von: 0, bis: 90, farbe: "grau", rolle: "sekante", gestrichelt: true },
    ],
    legende: [{ farbe: "blau", text: "Weg s(t)" }, { farbe: "grau", text: "Sekante: Durchschnitt", gestrichelt: true }],
  },
  rueckblick: `<p>Die mittlere Änderungsrate ist die Steigung der Sekante, die lokale die Steigung der Tangente. Welche misst die Abschnittskontrolle, welche der Tacho? Nachlesen: <a href="${L21}#sec-mittlere">2.1, Abschnitt 1</a> und <a href="${L21}#sec-lokal">Abschnitt 2</a>.</p>`,
  werkzeug: `<ul>
      <li>Mittlere Änderungsrate: ${bruch("s(b) − s(a)", "b − a")} (<a href="${L21}#sec-mittlere">2.1, Abschnitt 1</a>)</li>
      <li>Momentangeschwindigkeit v(t) = s′(t); Potenz- und Summenregel (<a href="${L21}#sec-potenz">Abschnitt 5</a>, <a href="${L21}#sec-regeln">6</a>)</li>
      <li>Hochpunkt von v: v′(t) = 0 (<a href="${L21}#sec-monotonie">Abschnitt 12</a>)</li>
    </ul>`,
  kernfrage: "Entscheidend ist: Wie schnell war das Auto im schnellsten Moment?",
  schritte: [
    {
      phase: 1,
      frage: "Prüfe die Messung: Wie groß ist die mittlere Geschwindigkeit im Abschnitt, in km/h?",
      felder: [{ id: "vm", label: "mittlere Geschwindigkeit:", einheit: "km/h", soll: 96, tol: 0.1, stellen: 1, falsch: [] }],
      tipps: ["Mittlere Geschwindigkeit = Weg / Zeit = s(90)/90 — in m/s.", "Dann mal 3,6."],
      loesung: "s(90) = −729 + 729 + 2.400 = 2.400 m; 2.400 m / 90 s ≈ 26,67 m/s = 96 km/h.",
      deutung: "Das Modell passt zur Messung: 96 km/h im Schnitt.",
    },
    {
      phase: 3,
      frage: "Bestimme die Momentangeschwindigkeit v(t) = s′(t). Wie schnell war das Auto 10 Sekunden nach der ersten Kamera, in km/h?",
      felder: [{
        id: "v10", label: "v(10) ≈", einheit: "km/h", soll: vAk(10) * 3.6, tol: 0.1, stellen: 1,
        falsch: [{ wert: (sAk(10) / 10) * 3.6, id: "mittel-10", text: "Das ist die mittlere Geschwindigkeit der ersten 10 Sekunden, s(10)/10. Gefragt ist die momentane Geschwindigkeit: die Ableitung s′(10)." }],
      }],
      tipps: [`s′(t) = −0,003t² + 0,18t + ${bruch("80", "3")}.`, "v(10) = −0,3 + 1,8 + 26,67 (in m/s), dann mal 3,6."],
      loesung: `v(t) = −0,003t² + 0,18t + ${bruch("80", "3")}; v(10) ≈ ${n(vAk(10), 2)} m/s ≈ ${n(vAk(10) * 3.6, 1)} km/h.`,
      deutung: "Schon nach 10 Sekunden ist das Auto schneller als erlaubt.",
    },
    {
      phase: 3,
      kern: true,
      frage: "Wann war das Auto am schnellsten, und wie schnell war es da? Gib die Höchstgeschwindigkeit in km/h an.",
      felder: [{
        id: "vmax", label: "Höchstgeschwindigkeit:", einheit: "km/h", soll: vAk(30) * 3.6, tol: 0.1, stellen: 1,
        falsch: [
          { wert: vAk(45) * 3.6, id: "mitte", text: "Das ist die Geschwindigkeit zur Mitte der Fahrzeit (t = 45). Der schnellste Moment ist der Hochpunkt von v: Setze v′(t) = 0." },
          { wert: 30, id: "zeit", text: "30 ist der Zeitpunkt in Sekunden, zu dem das Auto am schnellsten war. Gefragt ist die Geschwindigkeit v(30), in km/h." },
        ],
      }],
      tipps: ["v′(t) = −0,006t + 0,18 = 0.", "t = 30 s; v(30) in m/s ausrechnen und mal 3,6."],
      loesung: `v′(t) = −0,006t + 0,18 = 0 ⟹ t = 30 s; v(30) ≈ ${n(vAk(30), 2)} m/s ≈ ${n(vAk(30) * 3.6, 1)} km/h. Da v′ dort von + nach − wechselt, ist es ein Hochpunkt.`,
      deutung: "Gut 105 km/h — trotz 96 km/h im Schnitt.",
    },
    {
      phase: 4,
      frage: "Wie viele Sekunden lang war das Auto schneller als 100 km/h?",
      felder: [{
        id: "dauer", label: "Dauer:", einheit: "s", soll: tAus - tEin, tol: 0.3, stellen: 1,
        falsch: [{ wert: tAus, id: "nur-t2", text: "Das ist der Zeitpunkt, an dem das Auto wieder unter 100 km/h fällt. Die Dauer ist der Unterschied der beiden Zeitpunkte." }],
      }],
      tipps: ["100 km/h = 27,78 m/s. Löse v(t) = 27,78.", "−0,003t² + 0,18t − 1,111 = 0 ergibt zwei Lösungen t₁ und t₂."],
      loesung: `v(t) = ${n(g100, 2)} ⟹ t₁ ≈ ${n(tEin, 1)} s, t₂ ≈ ${n(tAus, 1)} s; Dauer ≈ ${n(tAus - tEin, 1)} s.`,
      deutung: "Mehr als die Hälfte der Messzeit war das Auto zu schnell.",
    },
  ],
  urteil: {
    optionen: [
      { text: `Stimmt nicht: Ein Durchschnitt sagt nichts über den schnellsten Moment. Hier fuhr das Auto bis zu ${n(vAk(30) * 3.6, 1)} km/h und war ${n(tAus - tEin, 0)} Sekunden lang schneller als 100.`, richtig: true, erklaerung: "Genau. Die mittlere Änderungsrate (Sekantensteigung) mittelt über 90 Sekunden; die momentane Geschwindigkeit ist die Tangentensteigung — und die kann zwischendurch deutlich größer sein. Bestraft wird bei der Abschnittskontrolle trotzdem nur der Durchschnitt." },
      { text: "Stimmt: Wer im Schnitt 96 km/h fährt, kann nie schneller als 100 gewesen sein.", erklaerung: `Das Modell zeigt das Gegenteil: Nach 30 s fuhr das Auto ${n(vAk(30) * 3.6, 1)} km/h und bremste vor der zweiten Kamera auf ${n(vAk(90) * 3.6, 0)} km/h ab.` },
      { text: "Stimmt nicht: Das Auto war die ganze Zeit schneller als 100 km/h.", erklaerung: `Am Anfang (96 km/h) und am Ende (${n(vAk(90) * 3.6, 0)} km/h) war es langsamer — zu schnell war es „nur“ ${n(tAus - tEin, 0)} Sekunden.` },
      { text: "Lässt sich nicht entscheiden, weil nur der Durchschnitt gemessen wurde.", erklaerung: "Mit der Messung allein nicht — mit dem Weg-Zeit-Modell schon, denn seine Ableitung liefert die Geschwindigkeit zu jedem Zeitpunkt. Und als Schluss ist die Behauptung ohnehin falsch: Aus einem Durchschnitt unter 100 folgt nichts über einzelne Momente." },
    ],
  },
  merksatz: `<p>Die mittlere Änderungsrate ${bruch("s(b) − s(a)", "b − a")} ist die Steigung der Sekante, die momentane Änderungsrate s′(t) die Steigung der Tangente. Liegt der Durchschnitt unter einer Grenze, kann die momentane Rate die Grenze trotzdem zeitweise überschreiten.</p>`,
  denkfrage: "Und umgekehrt: Wer im Abschnitt einen Durchschnitt von 104 km/h hat — war der sicher irgendwann schneller als 100 km/h?",
  musterantwort: "<p>Ja. Wäre das Auto die ganze Zeit höchstens 100 km/h gefahren, hätte es in 90 Sekunden höchstens 2,5 km geschafft — der Durchschnitt könnte nicht über 100 liegen. Weil die Geschwindigkeit stetig ist, war sie sogar in einem Moment genau 104 km/h (Mittelwertsatz). Deshalb ist die Abschnittskontrolle fair: Sie bestraft niemanden, der nie zu schnell war.</p>",
  knobel: "Zu welchen Zeitpunkten fuhr das Auto genau seine Durchschnittsgeschwindigkeit von 96 km/h? Was bedeutet das am Graphen?",
  knobelAntwort: `<p>v(t) = ${bruch("80", "3")} ⟹ −0,003t² + 0,18t = 0 ⟹ t = 0 oder t = 60 s. An diesen Stellen ist die Tangente parallel zur Sekante — genau das sagt der Mittelwertsatz voraus: Mindestens einmal muss die Momentangeschwindigkeit gleich der mittleren sein.</p>`,
  partner: "Zeigt euch gegenseitig am Weg-Zeit-Diagramm, wo das Auto am schnellsten war — woran erkennt man das am Graphen von s, ohne zu rechnen?",
};

// ---------- 2.1 b: Sichtweite an der Kuppe ----------

const kuppe = (x) => -(x * x) / 10000;
const augeX = -150, augeY = kuppe(-150) + 1;
const uB = -50; // Berührstelle der Sichtlinie
const sicht = (x) => kuppe(uB) + (-uB / 5000) * (x - uB);
const noetig = 2 * (100 / 3.6) * 15;
// Maßstab der Zeichnung (Zeichenfläche 236 × 456 Bildpunkte für 9 m × 500 m) — muss zu zeichne()
// passen; die Prüfung vergleicht die Angabe mit dem gezeichneten Maßstab.
const ueberhoeht = Math.round((236 / 9) / (456 / 500));

const kuppeFall = {
  key: "kuppe",
  nr: "2.1 b",
  kapitel: "2.1",
  kurs: "gk",
  icon: "⛰️",
  titel: "Überholen an der Kuppe",
  behauptung: "„Hinter der Kuppe sieht man locker 200 Meter weit. Bei Tempo 100 kann man den Lkw hier gut überholen.“",
  herkunft: "Beifahrer bei einer Übungsfahrt im begleiteten Fahren",
  hintergrund: `<p>Mit 17 darf man in Deutschland in Begleitung Auto fahren. Die Straßenverkehrsordnung erlaubt das Überholen nur, wenn übersehen werden kann, dass während des ganzen Überholvorgangs jede Behinderung des Gegenverkehrs ausgeschlossen ist (§ 5 StVO). An einer Kuppe ist die Sicht begrenzt — wie weit man sieht, hängt von der Form der Straße und von der Augenhöhe ab.</p>`,
  quellen: [{ text: "§ 5 StVO (Überholen)", url: "https://www.gesetze-im-internet.de/stvo_2013/__5.html" }],
  modell: `<p>Längsschnitt der Straße (x und f(x) in Metern, Scheitel der Kuppe bei x = 0):</p>
    <p class="formula-block">f(x) = −${bruch("x²", "10.000")}</p>
    <p>Dein Auge ist bei x = −150 und 1 m über der Fahrbahn: A(−150 | −1,25). Ein entgegenkommendes Auto siehst du, sobald die Sichtlinie einen Punkt 1 m über der Fahrbahn erreicht. Der Überholvorgang dauert 15 Sekunden; du fährst 100 km/h, der Gegenverkehr auch.</p>`,
  figur: {
    titel: "Längsschnitt der Kuppe mit der Sichtlinie vom Auge",
    x: { von: -250, bis: 250, schritt: 50, marke: (v) => v % 100 === 0, titel: "x in m" },
    y: { von: -7, bis: 2, schritt: 1, titel: "Höhe in m" },
    kurven: [
      { f: kuppe, von: -250, bis: 250, farbe: "blau", rolle: "strasse" },
      { f: sicht, von: augeX, bis: 50, farbe: "orange", rolle: "sichtlinie", gestrichelt: true },
    ],
    punkte: [{ x: augeX, y: augeY, farbe: "orange", rolle: "auge" }],
    legende: [{ farbe: "blau", text: "Fahrbahn f(x)" }, { farbe: "orange", text: "Sichtlinie vom Auge", gestrichelt: true }],
    hinweis: `Die Höhe ist etwa ${ueberhoeht}-fach überhöht gezeichnet.`,
  },
  rueckblick: `<p>Die Tangente an f in der Stelle u hat die Gleichung t(x) = f(u) + f′(u) · (x − u). Wie findet man eine Tangente, die durch einen Punkt <em>außerhalb</em> des Graphen geht? Nachlesen: <a href="${L21}#sec-tangente">2.1, Abschnitt 8</a>.</p>`,
  werkzeug: `<ul>
      <li>Tangente in u: t(x) = f(u) + f′(u) · (x − u) (<a href="${L21}#sec-tangente">2.1, Abschnitt 8</a>)</li>
      <li>Tangente durch einen Punkt A außerhalb: A in t(x) einsetzen und nach u auflösen.</li>
      <li>Steigung in Prozent: f′(x) · 100 %.</li>
      <li>Weg bei konstanter Geschwindigkeit: s = v · t; 100 km/h ≈ 27,78 m/s.</li>
    </ul>`,
  kernfrage: "Entscheidend ist: Wie weit sieht man hier wirklich — und wie weit müsste man sehen?",
  schritte: [
    {
      phase: 1,
      frage: "Wie steil steigt die Straße an deiner Stelle x = −150? Gib die Steigung in Prozent an.",
      felder: [{ id: "steig", label: "Steigung:", einheit: "%", soll: 3, tol: 0.01, stellen: 1, falsch: [] }],
      tipps: ["f′(x) = −2x/10.000 = −x/5.000.", "f′(−150) = 0,03."],
      loesung: "f′(−150) = 150/5.000 = 0,03, also 3 % bergauf.",
    },
    {
      phase: 2,
      frage: "Die Sichtlinie von deinem Auge A(−150 | −1,25) berührt die Kuppe. An welcher Stelle u liegt der Berührpunkt?",
      felder: [{
        id: "u", label: "u =", einheit: "m", soll: uB, tol: 0.5, stellen: 1,
        falsch: [
          { wert: -250, id: "hinter-dir", text: "Das ist die zweite Lösung der Gleichung — dieser Berührpunkt liegt hinter dir. Die Sichtlinie nach vorn berührt die Kuppe vor dir." },
          { wert: 0, id: "scheitel", text: "Die Sichtlinie geht nicht über den Scheitel: Dein Auge liegt tiefer als der Scheitel, die Sichtlinie steigt also an und berührt die Kuppe schon vorher." },
        ],
      }],
      tipps: [
        "Tangente in u: t(x) = −u²/10.000 − (u/5.000) · (x − u). Sie muss durch A gehen: t(−150) = −1,25.",
        "Einsetzen und vereinfachen: u²/10.000 + 0,03u = −1,25, also u² + 300u + 12.500 = 0.",
        "u = −150 ± 100.",
      ],
      loesung: "−u²/10.000 − (u/5.000)(−150 − u) = −1,25 ⟺ u² + 300u + 12.500 = 0 ⟺ u = −50 oder u = −250. Nach vorn zählt u = −50.",
    },
    {
      phase: 3,
      frage: "Die Sichtlinie ist die Tangente in u = −50. An welcher Stelle erreicht sie hinter der Kuppe die Höhe 1 m über der Fahrbahn? Wie groß ist damit die Sichtweite (von x = −150 aus gemessen)?",
      felder: [{
        id: "weite", label: "Sichtweite:", einheit: "m", soll: 200, tol: 1, stellen: 0,
        falsch: [
          { wert: 50, id: "nur-x", text: "x = 50 ist die Stelle, an der die Sichtlinie die Höhe 1 m über der Fahrbahn erreicht. Die Sichtweite ist die Strecke von deinem Auto (x = −150) bis dorthin." },
          { wert: 100, id: "ab-beruehrpunkt", text: "Du hast vom Berührpunkt u = −50 aus gemessen. Die Sichtweite zählt ab deinem Auto bei x = −150." },
        ],
      }],
      tipps: ["Sichtlinie: t(x) = −0,25 + 0,01 · (x + 50).", "Gleichsetzen mit f(x) + 1: −x²/10.000 + 1 = 0,01x + 0,25 ⟺ x² + 100x − 7.500 = 0."],
      loesung: "x² + 100x − 7.500 = 0 ⟹ x = 50 (die andere Lösung, −150, ist dein eigenes Auge). Sichtweite: 50 − (−150) = 200 m.",
      deutung: "Der erste Teil der Behauptung stimmt: Man sieht genau 200 m weit.",
    },
    {
      phase: 4,
      kern: true,
      frage: "Wie weit müsstest du sehen können? In den 15 Sekunden des Überholens fährst du mit 100 km/h — und der Gegenverkehr kommt dir mit 100 km/h entgegen.",
      felder: [{
        id: "noetig", label: "nötige Sichtweite:", einheit: "m", soll: noetig, tol: 2, stellen: 0,
        falsch: [{ wert: noetig / 2, id: "nur-eigener", text: "Das ist nur dein eigener Weg. In denselben 15 Sekunden kommt dir das andere Auto ebenso weit entgegen — beide Wege zusammen müssen frei einsehbar sein." }],
      }],
      tipps: ["100 km/h ≈ 27,78 m/s.", "Dein Weg: 27,78 · 15 m. Der Weg des Gegenverkehrs: genauso viel."],
      loesung: `2 · ${n(100 / 3.6, 2)} m/s · 15 s ≈ ${n(noetig, 0)} m.`,
      deutung: "Über 800 m — mehr als das Vierfache dessen, was die Kuppe freigibt.",
    },
  ],
  urteil: {
    optionen: [
      { text: "Stimmt: 200 m reichen bei Tempo 100 gut.", erklaerung: `Man bräuchte rund ${n(noetig, 0)} m: Während du überholst, kommt der Gegenverkehr dir entgegen.` },
      { text: "Stimmt, wenn man nah genug an die Kuppe heranfährt — dann sieht man weiter.", erklaerung: "Überraschend: An dieser Kuppe ist die Sichtweite überall genau 200 m (siehe Knobelfrage). Näher heranfahren hilft nicht." },
      { text: `Stimmt nicht: Man sieht hier zwar 200 m weit, bräuchte zum Überholen aber rund ${n(noetig, 0)} m — weil auch der Gegenverkehr in diesen 15 Sekunden näherkommt.`, richtig: true, erklaerung: "Genau. In 15 s legt jedes der beiden Autos rund 417 m zurück. Selbst die doppelte Sichtweite würde nicht reichen — deshalb gilt an Kuppen meist ein Überholverbot." },
      { text: "Stimmt nicht: Hinter der Kuppe sieht man nur 50 m weit.", erklaerung: "50 ist die x-Koordinate des Punktes, den die Sichtlinie hinter der Kuppe erreicht. Gemessen ab deinem Auto bei x = −150 sind das 200 m." },
    ],
  },
  merksatz: `<p>Tangente an f in u: t(x) = f(u) + f′(u) · (x − u). Für eine Tangente durch einen Punkt außerhalb des Graphen setzt man den Punkt ein und löst nach u auf — meist gibt es zwei Lösungen, und die Sachsituation entscheidet, welche gemeint ist.</p>`,
  denkfrage: `Die Zeichnung ist etwa ${ueberhoeht}-fach überhöht. Wie hoch ist die Kuppe in Wirklichkeit — und warum versperrt sie trotzdem die Sicht?`,
  musterantwort: "<p>Auf 150 m Abstand liegt der Scheitel nur 2,25 m höher als die Straße an deinem Auto, die Steigung beträgt 3 %. Man sieht die Kuppe kaum. Aber das Auge ist nur 1 m über der Fahrbahn: Schon ein Höhenunterschied von gut einem Meter verdeckt ein ganzes Auto. Mit einem Lkw-Fahrerhaus (Augenhöhe gut 2,5 m) wäre die Sichtweite größer.</p>",
  knobel: "Zeige: Egal, wo du vor dieser Kuppe stehst — die Sichtweite ist immer 200 m.",
  knobelAntwort: "<p>Steht das Auge bei x = a (Höhe −a²/10.000 + 1), liefert dieselbe Rechnung den Berührpunkt u = a + 100, und die Sichtlinie erreicht die andere Seite bei x = a + 200. Die Sichtweite ist also immer 200 m. Bei einer Parabel f(x) = −x²/(2R) hängt sie nur vom Krümmungsradius R und der Augenhöhe h ab: Sichtweite = 2 · √(2Rh) — hier 2 · √(2 · 5.000 · 1) = 200.</p>",
  partner: "Wer hat in Schritt 2 beide Lösungen gefunden? Zeichnet beide Tangenten ins Bild ein und erklärt euch, welche zu welcher Blickrichtung gehört.",
};

// ---------- 2.2 a: Schnellladen ----------

const kL = Math.log(4.5) / 30;
const lad = (t) => 100 - 90 * Math.exp(-kL * t);
const ladRate = (t) => 90 * kL * Math.exp(-kL * t);
const t99 = Math.log(90) / kL;

const laden = {
  key: "laden",
  nr: "2.2 a",
  kapitel: "2.2",
  kurs: "gk",
  icon: "🔋",
  titel: "Schnellladen",
  behauptung: "„In 30 Minuten von 10 auf 80 Prozent! Dann ist das Handy nach 40 Minuten voll.“",
  herkunft: "Beim Lesen einer Produktwerbung",
  hintergrund: "<p>Viele Smartphones werben mit Schnellladen. Lithium-Ionen-Akkus laden zunächst mit hoher Stromstärke; je voller sie werden, desto stärker drosselt die Ladeelektronik den Strom, um den Akku zu schonen. Manche Handys bieten deshalb an, nur bis 80 % zu laden.</p>",
  modell: `<p>Ladestand in Prozent nach t Minuten, Start bei 10 %:</p>
    <p class="formula-block">L(t) = 100 − 90 · e<sup>−kt</sup></p>
    <p>Die Konstante k ist so gewählt, dass L(30) = 80 gilt — wie in der Werbung.</p>`,
  figur: {
    titel: "Ladestand des Akkus im Modell",
    x: { von: 0, bis: 120, schritt: 10, beschriftung: 2, titel: "Zeit t in min" },
    y: { von: 0, bis: 100, schritt: 10, titel: "Ladestand L(t) in %" },
    kurven: [{ f: lad, von: 0, bis: 120, farbe: "blau", rolle: "ladestand" }],
    waagrecht: [{ y: 100, farbe: "rot", rolle: "voll" }],
    punkte: [{ x: 30, y: 80, farbe: "orange", rolle: "werbung" }],
    legende: [{ farbe: "blau", text: "Ladestand L(t)" }, { farbe: "orange", text: "Werbung: 80 % nach 30 min" }, { farbe: "rot", text: "100 %" }],
  },
  rueckblick: `<p>Wie leitet man e<sup>kx</sup> ab — und wie löst man e<sup>kx</sup> = c nach x auf? Nachlesen: <a href="${L22}#sec-ex">2.2, Abschnitt 2</a> und <a href="${L22}#sec-ln">Abschnitt 3</a>.</p>`,
  werkzeug: `<ul>
      <li>(e<sup>kx</sup>)′ = k · e<sup>kx</sup> (<a href="${L22}#sec-ex">2.2, Abschnitt 2</a>)</li>
      <li>e<sup>kx</sup> = c ⟺ kx = ln c (<a href="${L22}#sec-ln">2.2, Abschnitt 3</a>)</li>
      <li>Beschränktes Wachstum: L′(t) = k · (100 − L(t)) (<a href="${L22}#sec-wachstum">2.2, Abschnitt 13</a>)</li>
    </ul>`,
  kernfrage: "Entscheidend ist: Wie lange dauert es im Modell, bis der Akku (fast) voll ist?",
  schritte: [
    {
      phase: 2,
      frage: "Bestimme k aus der Bedingung L(30) = 80.",
      felder: [{
        id: "k", label: "k ≈", einheit: "1/min", soll: kL, tol: 0.0005, stellen: 4,
        falsch: [
          { wert: Math.log(8) / 30, id: "exponentiell", text: "Du hast so gerechnet, als wüchse der Ladestand exponentiell von 10 auf 80 (Faktor 8). Im Modell schrumpft aber der Abstand zu 100 % exponentiell: von 90 auf 20." },
          { wert: Math.log(4.5), id: "ohne-30", text: "Das ist 30 · k. Teile noch durch 30." },
        ],
      }],
      tipps: ["100 − 90 · e<sup>−30k</sup> = 80 ⟺ e<sup>−30k</sup> = 20/90.", "−30k = ln(2/9), also k = ln(4,5)/30."],
      loesung: `e<sup>−30k</sup> = ${bruch("2", "9")} ⟹ k = ${bruch("ln 4,5", "30")} ≈ ${n(kL, 4)} pro Minute.`,
    },
    {
      phase: 3,
      frage: "Wie schnell lädt der Akku am Anfang und bei 80 %? Berechne L′(0) und L′(30) in Prozentpunkten pro Minute.",
      felder: [
        { id: "r0", label: "L′(0) ≈", einheit: "% pro min", soll: ladRate(0), tol: 0.02, stellen: 2, falsch: [{ wert: 90, id: "ohne-k", text: "Beim Ableiten von e<sup>−kt</sup> kommt der Faktor −k dazu: L′(t) = 90 · k · e<sup>−kt</sup>." }] },
        { id: "r30", label: "L′(30) ≈", einheit: "% pro min", soll: ladRate(30), tol: 0.01, stellen: 2, falsch: [{ wert: 70 / 30, id: "mittel", text: "70/30 ist die mittlere Ladegeschwindigkeit der ersten 30 Minuten. Gefragt ist die momentane bei t = 30." }] },
      ],
      tipps: ["L′(t) = 90 · k · e<sup>−kt</sup>.", "Bei t = 30 ist 90 · e<sup>−30k</sup> = 20, also L′(30) = 20k."],
      loesung: `L′(t) = 90k · e<sup>−kt</sup>; L′(0) = 90k ≈ ${numFest(ladRate(0), 2)} und L′(30) = 20k ≈ ${numFest(ladRate(30), 2)}, jeweils in Prozentpunkten pro Minute.`,
      deutung: "Bei 80 % lädt der Akku nur noch mit einem Viertel bis Fünftel der Anfangsgeschwindigkeit.",
    },
    {
      phase: 3,
      kern: true,
      frage: "Nach wie vielen Minuten ist der Akku im Modell zu 99 % geladen?",
      felder: [{
        id: "t99", label: "t ≈", einheit: "min", soll: t99, tol: 0.3, stellen: 1,
        falsch: [
          { wert: 40, id: "werbung", text: "40 Minuten wären es, wenn der Akku immer gleich schnell weiterlädt. Im Modell wird er aber immer langsamer." },
          { wert: Math.log(18) / kL, id: "95", text: "Das ist die Zeit bis 95 %. Für 99 % muss der Abstand zu 100 von 90 auf 1 schrumpfen." },
        ],
      }],
      tipps: ["100 − 90 · e<sup>−kt</sup> = 99 ⟺ e<sup>−kt</sup> = 1/90.", "t = ln(90)/k."],
      loesung: `e<sup>−kt</sup> = ${bruch("1", "90")} ⟹ t = ${bruch("ln 90", "k")} ≈ ${n(t99, 1)} min.`,
      deutung: "Anderthalb Stunden bis 99 % — und 100 % erreicht das Modell nie.",
    },
    {
      phase: 4,
      frage: "Wie lange dauern im Modell die letzten 19 Prozentpunkte (von 80 auf 99 %)?",
      felder: [{
        id: "rest", label: "Dauer:", einheit: "min", soll: t99 - 30, tol: 0.3, stellen: 1,
        falsch: [{ wert: 10, id: "linear", text: "10 Minuten wären es bei der Werbe-Rechnung. Rechne mit dem Ergebnis aus Schritt 3: t(99 %) − 30." }],
      }],
      tipps: ["Ziehe von der Zeit aus Schritt 3 die 30 Minuten bis 80 % ab."],
      loesung: `${n(t99, 1)} − 30 ≈ ${n(t99 - 30, 1)} min — doppelt so lange wie die ersten 70 Prozentpunkte.`,
    },
  ],
  urteil: {
    optionen: [
      { text: "Stimmt: Wenn 70 Prozentpunkte 30 Minuten dauern, schafft der Akku die letzten 20 in 10 Minuten.", erklaerung: "Das gälte nur bei konstanter Ladegeschwindigkeit. Im Modell lädt der Akku bei 80 % nur noch mit gut 1 % pro Minute — und immer langsamer." },
      { text: "Stimmt nicht: Nach diesem Modell wird der Akku nie voller als 80 %.", erklaerung: "Er wird voller, nur immer langsamer: L(t) nähert sich 100 %, ohne es zu erreichen." },
      { text: "Stimmt nicht: Der Akku ist schon nach 35 Minuten voll.", erklaerung: `Nach 35 Minuten sind es im Modell erst ${n(lad(35), 1)} %.` },
      { text: `Stimmt nicht: Die Ladegeschwindigkeit ist proportional zum Abstand zu 100 %. Bis 99 % dauert es im Modell etwa ${n(t99, 0)} Minuten — die letzten 19 Prozentpunkte brauchen doppelt so lange wie die ersten 70.`, richtig: true, erklaerung: "Genau. L′(t) = k · (100 − L(t)): Bei 80 % ist der Abstand nur noch 20, entsprechend klein ist die Rate. Echte Ladegeräte schalten bei fast vollem Akku ab — die Werbung nennt deshalb lieber die 80 %." },
    ],
  },
  merksatz: `<p>Beim beschränkten Wachstum L(t) = S − c · e<sup>−kt</sup> ist L′(t) = c · k · e<sup>−kt</sup> = k · (S − L(t)): Die Rate ist proportional zum Abstand von der Schranke S. Der Zuwachs wird immer kleiner, S wird nie erreicht. Zeitpunkte bestimmt man mit dem Logarithmus.</p>`,
  denkfrage: "Echte Ladekurven sind bis etwa 80 % fast eine Gerade und erst danach gekrümmt. Für welchen Teil passt das Modell — und für welchen nicht?",
  musterantwort: "<p>Bis etwa 80 % lädt ein echter Akku mit fast konstanter Stromstärke; der Ladestand wächst nahezu linear. Das Modell lädt am Anfang schneller (4,5 % pro Minute) und kurz vor 80 % langsamer. In der Schlussphase hält das Ladegerät dagegen die Spannung konstant, und der Strom klingt ungefähr exponentiell ab — dort passt das Modell gut. Für die Frage nach den letzten Prozent beschreibt es also genau den richtigen Teil.</p>",
  knobel: "Wie schnell lädt der Akku in dem Moment, in dem er 90 % erreicht?",
  knobelAntwort: `<p>L′ = k · (100 − 90) = 10k ≈ ${n(10 * kL, 2)} Prozentpunkte pro Minute — für jedes weitere Prozent braucht er gut zwei Minuten.</p>`,
  partner: "Vergleicht eure Werte für k. Kam bei jemandem ln(8)/30 heraus? Dann wurde dem Ladestand exponentielles Wachstum unterstellt — welche Größe schrumpft im Modell wirklich exponentiell?",
};

// ---------- 2.2 b: Tageslänge (LK) ----------

const w = (2 * Math.PI) / 365;
const tag = (t) => 12.2 + 4.1 * Math.sin(w * (t - 80));
const tagRate = (t) => 4.1 * w * Math.cos(w * (t - 80));
const mittelRate = ((16.3 - 8.1) * 60) / 182.5;
const halb3 = Math.acos(3 / 60 / (4.1 * w)) / w;

const tageslaenge = {
  key: "tageslaenge",
  nr: "2.2 b",
  kapitel: "2.2",
  kurs: "lk",
  icon: "🌅",
  titel: "Wie schnell wachsen die Tage?",
  behauptung: "„Rund um den Frühlingsanfang wird jeder Tag gut 4 Minuten länger. Um den 21. Juni ändert sich die Tageslänge dagegen fast gar nicht.“",
  herkunft: "Aussage in einem Podcast zur Zeitumstellung",
  hintergrund: "<p>Zweimal im Jahr werden die Uhren umgestellt, und jedes Mal flammt die Debatte wieder auf, ob die EU die Zeitumstellung abschaffen soll. Die Uhr verschiebt nur, <em>wann</em> es hell wird; wie lang der Tag ist, bestimmt der Sonnenstand. In Mainz (50° nördlicher Breite) ist der Tag am 21. Juni gut 16 Stunden lang, am 21. Dezember gut 8.</p>",
  modell: `<p>Tageslänge in Stunden am t-ten Tag des Jahres (t = 80 ist der 21. März, t = 172 der 21. Juni):</p>
    <p class="formula-block">D(t) = 12,2 + 4,1 · sin(${bruch("2π", "365")} · (t − 80))</p>`,
  figur: {
    titel: "Tageslänge in Mainz im Lauf eines Jahres (Modell)",
    x: { von: 0, bis: 365, schritt: 50, titel: "Tag im Jahr t" },
    y: { von: 6, bis: 18, schritt: 2, titel: "Tageslänge D(t) in h" },
    kurven: [{ f: tag, von: 0, bis: 365, farbe: "blau", rolle: "tageslaenge" }],
    senkrecht: [{ x: 80, farbe: "grau", rolle: "fruehling" }, { x: 172, farbe: "grau", rolle: "sommer" }],
    legende: [{ farbe: "blau", text: "Tageslänge D(t)" }, { farbe: "grau", text: "21. März (t = 80) und 21. Juni (t = 172)" }],
  },
  rueckblick: `<p>(sin x)′ = cos x — und was kommt bei sin(c · (t − d)) nach der Kettenregel dazu? Nachlesen: <a href="${L22}#sec-sinus">2.2, Abschnitt 5</a> und <a href="${L22}#sec-kette">Abschnitt 6</a>.</p>`,
  werkzeug: `<ul>
      <li>(sin x)′ = cos x (<a href="${L22}#sec-sinus">2.2, Abschnitt 5</a>)</li>
      <li>Kettenregel: (sin(u(t)))′ = cos(u(t)) · u′(t) (<a href="${L22}#sec-kette">2.2, Abschnitt 6</a>)</li>
      <li>D′(t) in Stunden pro Tag; 1 h = 60 min.</li>
      <li>Taschenrechner auf Bogenmaß (RAD) stellen!</li>
    </ul>`,
  kernfrage: "Entscheidend ist: Wie groß ist die Änderungsrate D′(t) am 21. März und am 21. Juni?",
  schritte: [
    {
      phase: 1,
      frage: "Wie lang ist der Tag im Modell am 21. März und am 21. Juni?",
      felder: [
        { id: "d80", label: "D(80) =", einheit: "h", soll: tag(80), tol: 0.01, stellen: 2, falsch: [] },
        { id: "d172", label: "D(172) ≈", einheit: "h", soll: tag(172), tol: 0.01, stellen: 2, falsch: [{ wert: 12.2 + 4.1 * Math.sin((w * 92 * Math.PI) / 180), id: "grad", text: "Dein Taschenrechner steht vermutlich auf Grad (DEG). Das Argument des Sinus ist hier im Bogenmaß — stelle auf RAD um." }] },
      ],
      tipps: ["Bei t = 80 ist das Argument des Sinus null.", "D(172) = 12,2 + 4,1 · sin(2π · 92/365) — im Bogenmaß rechnen."],
      loesung: `D(80) = 12,2 h; D(172) = 12,2 + 4,1 · sin(${n(w * 92, 4)}) ≈ ${n(tag(172), 2)} h.`,
    },
    {
      phase: 3,
      frage: "Vom kürzesten Tag (8,1 h) bis zum längsten (16,3 h) vergehen 182,5 Tage. Um wie viele Minuten wächst der Tag im Durchschnitt pro Tag?",
      felder: [{ id: "mittel", label: "mittlere Änderungsrate:", einheit: "min pro Tag", soll: mittelRate, tol: 0.02, stellen: 2, falsch: [] }],
      tipps: ["(16,3 − 8,1) h · 60 / 182,5 Tage."],
      loesung: `${bruch("(16,3 − 8,1) · 60 min", "182,5 Tage")} ≈ ${n(mittelRate, 2)} min pro Tag.`,
    },
    {
      phase: 3,
      kern: true,
      frage: "Leite D ab und berechne die momentane Änderungsrate am 21. März, D′(80), in Minuten pro Tag.",
      felder: [{
        id: "r80", label: "D′(80) ≈", einheit: "min pro Tag", soll: tagRate(80) * 60, tol: 0.01, stellen: 2,
        falsch: [
          { wert: 4.1 * 60, id: "ohne-innere", text: "Die innere Ableitung fehlt: Nach der Kettenregel kommt der Faktor 2π/365 dazu. Ohne ihn hättest du die Änderung pro Bogenmaß-Einheit, nicht pro Tag." },
          { wert: 4.1, id: "ohne-innere-h", text: "Die innere Ableitung fehlt (Faktor 2π/365), und das Ergebnis ist noch in Stunden. Gefragt sind Minuten pro Tag." },
        ],
      }],
      tipps: [`D′(t) = 4,1 · cos(${bruch("2π", "365")} · (t − 80)) · ${bruch("2π", "365")}.`, "Bei t = 80 ist cos(0) = 1. Ergebnis in Stunden pro Tag, dann mal 60."],
      loesung: `D′(t) = 4,1 · ${bruch("2π", "365")} · cos(${bruch("2π", "365")} · (t − 80)); D′(80) = 4,1 · ${bruch("2π", "365")} ≈ ${n(tagRate(80), 4)} h ≈ ${n(tagRate(80) * 60, 2)} min pro Tag.`,
      deutung: "Gut 4 Minuten pro Tag — der erste Teil der Behauptung stimmt.",
    },
    {
      phase: 4,
      kern: true,
      frage: "Und am 21. Juni: Wie groß ist D′(172) in Minuten pro Tag?",
      felder: [{
        id: "r172", label: "D′(172) ≈", einheit: "min pro Tag", soll: tagRate(172) * 60, tol: 0.005, stellen: 3,
        falsch: [
          { wert: 0, id: "hochpunkt", text: "Genau null ist D′ am Hochpunkt bei t = 171,25. Am 21. Juni (t = 172) ist die Ableitung schon ganz leicht negativ." },
          { wert: tagRate(80) * 60 * Math.cos((w * 92 * Math.PI) / 180), id: "grad", text: "Dein Taschenrechner steht vermutlich auf Grad (DEG). Das Argument des Kosinus ist im Bogenmaß — stelle auf RAD um." },
        ],
      }],
      tipps: ["Dieselbe Ableitung, jetzt mit t = 172.", "cos(2π · 92/365) ist knapp unter null."],
      loesung: `D′(172) ≈ ${n(tagRate(172) * 60, 3)} min pro Tag — gut drei Sekunden, und schon mit negativem Vorzeichen: Die Tage werden bereits wieder kürzer.`,
      deutung: "Um den 21. Juni ändert sich die Tageslänge nur um Sekunden.",
    },
  ],
  urteil: {
    optionen: [
      { text: `Stimmt: Am 21. März wächst der Tag im Modell um ${n(tagRate(80) * 60, 1)} Minuten, am 21. Juni ändert er sich nur um Sekunden — obwohl es im Mittel ${n(mittelRate, 1)} Minuten pro Tag sind.`, richtig: true, erklaerung: "Genau. Die Ableitung des Sinus ist der Kosinus: Wo D seinen Mittelwert durchläuft (Frühlingsanfang), ist die Änderungsrate am größten; wo D am größten ist (Sommeranfang), ist sie null. Der Mittelwert von 2,7 Minuten beschreibt keinen einzigen Tag gut." },
      { text: "Stimmt nicht: Der Tag wird jeden Tag gleich viel länger, rund 2,7 Minuten.", erklaerung: "Das ist nur die mittlere Änderungsrate über ein halbes Jahr. Die momentane Änderungsrate schwankt zwischen null und gut 4 Minuten pro Tag." },
      { text: "Stimmt nicht: Am 21. Juni wächst der Tag am schnellsten, weil er dann am längsten ist.", erklaerung: "Am längsten ist der Tag, wo D′ = 0 ist — ein Hochpunkt. Groß und schnell wachsend ist nicht dasselbe." },
      { text: "Stimmt nicht: Nach dem Frühlingsanfang werden die Tage schon wieder kürzer.", erklaerung: "Bis zum 21. Juni ist D′ > 0: Die Tage werden länger, nur immer langsamer." },
    ],
  },
  merksatz: `<p>Kettenregel: (sin(c · (t − d)))′ = c · cos(c · (t − d)). Bei D(t) = a + b · sin(c · (t − d)) ist D′(t) = b · c · cos(c · (t − d)) — am größten, wo D den Mittelwert a durchläuft, null an den Hoch- und Tiefpunkten. Die mittlere Änderungsrate kann die momentane weit verfehlen.</p>`,
  denkfrage: "In Wirklichkeit wächst der Tag in Mainz um den Frühlingsanfang um knapp 4 Minuten täglich, nicht um gut 4,2. Woher kommt die Abweichung?",
  musterantwort: "<p>Die echte Tageslänge ist keine exakte Sinuskurve: Sie hängt über einen Arkuskosinus vom Sonnenstand ab, dazu kommen die Lichtbrechung in der Atmosphäre und die Größe der Sonnenscheibe. Eine Sinuskurve mit derselben Schwankung (8,1 bis 16,3 Stunden) ist um den Frühlingsanfang etwas zu steil. Als Faustregel taugt das Modell; einen Sonnenkalender ersetzt es nicht.</p>",
  knobel: "In welchem Zeitraum wächst der Tag im Modell um mehr als 3 Minuten täglich?",
  knobelAntwort: `<p>D′(t) &gt; 3 min ⟺ cos(${bruch("2π", "365")}(t − 80)) &gt; ${bruch("3", n(tagRate(80) * 60, 3))} ≈ ${n(3 / (tagRate(80) * 60), 3)} ⟺ |t − 80| &lt; ${n(halb3, 1)}. Also etwa vom ${datum(80 - halb3)} bis zum ${datum(80 + halb3)} — rund drei Monate lang.</p>`,
  partner: "Habt ihr beide im Bogenmaß gerechnet? Prüft gegenseitig mit dem Graphen: An welcher Stelle hat er die größte Steigung — und passt das zu eurem Wert für D′(80)?",
};

export const FAELLE_2 = [abschnitt, kuppeFall, laden, tageslaenge];
