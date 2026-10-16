// Die vier komplexen Fälle: Jeder verbindet Werkzeuge aus mehreren Kapiteln (1 bis 4). Welche, steht
// in `kompetenzen` — die Seite zeigt es an, und die Prüfung verlangt, dass es mindestens drei
// verschiedene Kapitel sind.

import { num, bruch } from "./hilfen.js?v=1";

const n = num;
const L11 = "../01-folgen-und-reihen/index.html";
const L12 = "../02-grenzwerte-und-stetigkeit/index.html";
const L21 = "../03-differentialrechnung/index.html";
const L22 = "../03b-weitere-funktionen-ableiten/index.html";
const L31 = "../04-funktionsuntersuchung/index.html";
const L32 = "../04b-weitere-funktionen-untersuchen/index.html";
const L41 = "../05-integralrechnung/index.html";
const L42 = "../05b-weitere-funktionen-integrieren/index.html";
const integral = (o, u) => `<span class="integral"><span class="zeichen">∫</span><span class="grenzen"><span class="o">${o}</span><span class="u">${u}</span></span></span>`;
const minuten = (h) => { const m = Math.round(h * 60); return `${Math.floor(m / 60)} h ${m % 60} min`; };

function halbiere(f, a, b) {
  let fa = f(a);
  for (let k = 0; k < 80; k++) {
    const m = (a + b) / 2, fm = f(m);
    if (Math.sign(fm) === Math.sign(fa)) { a = m; fa = fm; } else b = m;
  }
  return (a + b) / 2;
}

// ---------- K1: Ein Song geht viral ----------

const streams = (t) => 2 * t * Math.exp(-0.25 * t);
const F = (t) => -(8 * t + 32) * Math.exp(-0.25 * t);
const s30 = F(30) - F(0);
let summeTage = 0, summe30 = 0;
for (let k = 1; k <= 400; k++) { summeTage += streams(k); if (k <= 30) summe30 += streams(k); }

const song = {
  key: "song",
  nr: "K 1",
  kapitel: "K",
  kurs: "gk",
  icon: "🎧",
  titel: "Ein Song geht viral",
  kompetenzen: ["1.1", "1.2", "3.2", "4.2"],
  behauptung: "„Mein Song hatte am Spitzentag fast 3 Millionen Streams! Wenn das so weitergeht, bin ich bald Millionär.“",
  herkunft: "Post eines Newcomers",
  hintergrund: "<p>Ein Song geht auf einer Kurzvideo-Plattform viral, und plötzlich wird er auf Streaming-Diensten millionenfach gehört. Für Musikerinnen und Musiker zählt am Ende, wie viele Streams insgesamt zusammenkommen. Pro Stream schütten die Plattformen nur Bruchteile eines Cents aus — eine oft genannte Größenordnung sind 0,3 Cent, die sich Label, Verlag und Künstler noch teilen.</p>",
  modell: `<p>Streams pro Tag in Millionen, t Tage nach der Veröffentlichung:</p>
    <p class="formula-block">s(t) = 2t · e<sup>−0,25t</sup></p>
    <p>Angenommen wird eine Ausschüttung von 0,3 Cent pro Stream.</p>`,
  figur: {
    titel: "Tägliche Streams des Songs im Modell",
    x: { von: 0, bis: 40, schritt: 5, titel: "Tage nach der Veröffentlichung t" },
    y: { von: 0, bis: 3.5, schritt: 0.5, titel: "Streams pro Tag in Mio." },
    kurven: [{ f: streams, von: 0, bis: 40, farbe: "blau", rolle: "streams" }],
    legende: [{ farbe: "blau", text: "Streams pro Tag s(t)" }],
  },
  rueckblick: `<p>Hier braucht es vier Kapitel: den Hochpunkt einer e-Funktion (<a href="${L32}#sec-schema">3.2</a>), eine Stammfunktion mit Ansatz (<a href="${L42}#sec-ansatz">4.2</a>), einen Grenzwert für t → ∞ (<a href="${L12}#sec-unendlich">1.2</a>) und den Grenzwert einer Folge (<a href="${L11}#sec-grenzwert">1.1</a>).</p>`,
  werkzeug: `<ul>
      <li>(t · e<sup>kt</sup>)′ = e<sup>kt</sup> · (1 + kt) (Produktregel, <a href="${L32}#sec-zweite">3.2, Abschnitt 2</a>)</li>
      <li>Ansatz für die Stammfunktion: F(t) = (at + b) · e<sup>−0,25t</sup>, ableiten und Koeffizienten vergleichen (<a href="${L42}#sec-ansatz">4.2, Abschnitt 3</a>)</li>
      <li>t · e<sup>−0,25t</sup> → 0 für t → ∞: Die e-Funktion setzt sich durch (<a href="${L22}#sec-verhalten">2.2, Abschnitt 9</a>)</li>
      <li>Grenzwert einer Folge (<a href="${L11}#sec-grenzwert">1.1, Abschnitt 4</a>)</li>
    </ul>`,
  kernfrage: "Entscheidend ist: Wie viele Streams kommen insgesamt zusammen — und wie viel Geld ist das?",
  schritte: [
    {
      phase: 1,
      frage: "Prüfe die Angabe: An welchem Tag hat der Song die meisten Streams, und wie viele?",
      felder: [
        { id: "tS", label: "Tag t =", einheit: "", soll: 4, tol: 0.02, stellen: 0, falsch: [] },
        { id: "sS", label: "Streams ≈", einheit: "Mio.", soll: streams(4), tol: 0.01, stellen: 2, falsch: [{ wert: 8, id: "ohne-e", text: "Der Faktor e<sup>−0,25 · 4</sup> = e<sup>−1</sup> fehlt: s(4) = 8 · e<sup>−1</sup>." }] },
      ],
      tipps: ["s′(t) = 2e<sup>−0,25t</sup> · (1 − 0,25t).", "1 − 0,25t = 0 ⟹ t = 4."],
      loesung: `s′(t) = 2e<sup>−0,25t</sup>(1 − 0,25t) = 0 ⟹ t = 4; s(4) = 8/e ≈ ${n(streams(4), 2)} Millionen.`,
      deutung: "„Fast 3 Millionen am Spitzentag“ stimmt.",
    },
    {
      phase: 2,
      frage: "Der Quotient q<sub>n</sub> = s(n + 1)/s(n) beschreibt, welcher Anteil der Streams vom Tag n am nächsten Tag übrig bleibt. Gegen welchen Wert strebt er für n → ∞?",
      felder: [{
        id: "q", label: "lim q<sub>n</sub> ≈", einheit: "", soll: Math.exp(-0.25), tol: 0.002, stellen: 4,
        falsch: [
          { wert: 1, id: "eins", text: "(n + 1)/n strebt gegen 1 — aber es bleibt der Faktor e<sup>−0,25</sup> stehen." },
          { wert: 0, id: "null", text: "Die Streams gehen gegen 0, ihr Quotient aber nicht: q<sub>n</sub> = (n + 1)/n · e<sup>−0,25</sup>." },
        ],
      }],
      tipps: ["s(n + 1)/s(n) = (n + 1)/n · e<sup>−0,25</sup>.", "(n + 1)/n → 1."],
      loesung: `q<sub>n</sub> = ${bruch("n + 1", "n")} · e<sup>−0,25</sup> → e<sup>−0,25</sup> ≈ ${n(Math.exp(-0.25), 4)}.`,
      deutung: "Auf lange Sicht verliert der Song jeden Tag gut ein Fünftel seiner Streams — wie eine geometrische Folge.",
    },
    {
      phase: 3,
      frage: "Wie viele Streams kommen in den ersten 30 Tagen zusammen? Bestimme eine Stammfunktion mit dem Ansatz F(t) = (at + b) · e<sup>−0,25t</sup>.",
      felder: [{
        id: "s30", label: "30 Tage:", einheit: "Mio.", soll: s30, tol: 0.02, stellen: 2,
        falsch: [{ wert: 30 * streams(4), id: "spitze-mal-30", text: "Das wären 30 Tage lang so viele Streams wie am Spitzentag. Gesucht ist das Integral von s über die 30 Tage." }],
      }],
      tipps: ["F′(t) = e<sup>−0,25t</sup> · (a − 0,25at − 0,25b) soll 2t · e<sup>−0,25t</sup> sein.", "−0,25a = 2 und a − 0,25b = 0 ⟹ a = −8, b = −32.", "F(30) − F(0) = −272 · e<sup>−7,5</sup> + 32."],
      loesung: `F(t) = −(8t + 32) · e<sup>−0,25t</sup>; ${integral("30", "0")} s(t) dt = F(30) − F(0) = 32 − 272 · e<sup>−7,5</sup> ≈ ${n(s30, 2)} Millionen.`,
    },
    {
      phase: 3,
      kern: true,
      frage: "Wie viele Streams kommen insgesamt zusammen, wenn man unbegrenzt lange wartet? (Grenzwert von F(b) − F(0) für b → ∞.)",
      felder: [{
        id: "ges", label: "insgesamt:", einheit: "Mio.", soll: 32, tol: 0.02, stellen: 2,
        falsch: [{ wert: Infinity, id: "unendlich", text: "Die Streams pro Tag werden nie null, aber sie nehmen so schnell ab, dass die Summe einen Grenzwert hat: F(b) → 0 für b → ∞." }],
      }],
      tipps: ["(8b + 32) · e<sup>−0,25b</sup> → 0 für b → ∞ — die e-Funktion setzt sich durch.", "Übrig bleibt −F(0)."],
      loesung: "F(b) − F(0) = 32 − (8b + 32) · e<sup>−0,25b</sup> → 32 Millionen für b → ∞.",
      deutung: "Nach 30 Tagen sind schon über 99 % aller Streams erreicht.",
    },
    {
      phase: 4,
      kern: true,
      frage: "Wie viel Geld schütten die Plattformen für alle Streams zusammen aus (0,3 Cent pro Stream)?",
      felder: [{
        id: "geld", label: "Ausschüttung:", einheit: "€", soll: 32e6 * 0.003, tol: 50, stellen: 0,
        falsch: [{ wert: 32e6 * 0.3, id: "cent-als-euro", text: "0,3 Cent sind 0,003 €, nicht 0,3 €." }],
      }],
      tipps: ["32 Millionen · 0,003 €."],
      loesung: "32.000.000 · 0,003 € = 96.000 € — für Label, Verlag und Künstler zusammen.",
    },
  ],
  urteil: {
    optionen: [
      { text: "Stimmt: 3 Millionen Streams am Tag bringen 3 Millionen Euro.", erklaerung: "Ein Stream bringt nur etwa 0,3 Cent. 3 Millionen Streams sind rund 9.000 €." },
      { text: "Stimmt: Weil der Song nie ganz aufhört, gestreamt zu werden, wächst die Summe unbegrenzt.", erklaerung: "Die tägliche Zahl wird nie null — trotzdem bleibt das Integral endlich: 32 Millionen insgesamt." },
      { text: "Stimmt nicht: Insgesamt kommen im Modell nur 32 Millionen Streams zusammen — bei 0,3 Cent pro Stream rund 96.000 €, die sich Label, Verlag und Künstler noch teilen.", richtig: true, erklaerung: `Genau. Die Fläche unter s(t) ist endlich, obwohl s(t) nie null wird: Die Werte nehmen auf Dauer wie eine geometrische Folge mit q = e<sup>−0,25</sup> ab. Nach 30 Tagen ist über 99 % erreicht — ein viraler Hit ist ein kurzes Feuer.` },
      { text: "Stimmt nicht: Nach dem Spitzentag hört niemand den Song mehr.", erklaerung: `Nach dem 4. Tag sinkt die Zahl, aber langsam: Am 10. Tag sind es noch ${n(streams(10), 1)} Millionen.` },
    ],
  },
  merksatz: `<p>Eine Fläche, die bis ins Unendliche reicht, kann endlich sein: ${integral("b", "0")} s(t) dt hat für b → ∞ einen Grenzwert, wenn s schnell genug abklingt. Den Grenzwert liefert eine Stammfunktion — beim Produkt t · e<sup>kt</sup> über den Ansatz (at + b) · e<sup>kt</sup>.</p>`,
  denkfrage: "Echte Streaming-Zahlen haben oft einen „langen Schwanz“: Ein Teil der Hörer bleibt dem Song treu. Wie könnte man das ins Modell einbauen — und was folgt daraus für die Gesamtzahl?",
  musterantwort: "<p>Man könnte eine kleine Konstante addieren, etwa s(t) = 2t · e<sup>−0,25t</sup> + 0,05. Dann wächst die Gesamtzahl ohne Grenze, denn das Integral der Konstanten ist 0,05 · b — allerdings langsam: 50.000 Streams am Tag bringen 150 € täglich, rund 55.000 € im Jahr. Für dauerhafte Einnahmen zählen also eher treue Hörer als ein kurzer Hype.</p>",
  knobel: "Ist die Summe der Tageswerte s(1) + s(2) + s(3) + … größer oder kleiner als das Integral von 0 bis ∞ (32 Millionen)? Die Summe liefert die Summenfunktion des Taschenrechners — ab etwa k = 100 ändert sie sich nicht mehr.",
  knobelFelder: [
    {
      id: "summe", label: "s(1) + s(2) + s(3) + … ≈", einheit: "Millionen", soll: summeTage, tol: 0.02, stellen: 2,
      falsch: [
        { wert: 32, id: "integral", text: "32 Millionen ist das Integral, also die Fläche unter der Kurve. Die Summe der Tageswerte ist eine eigene Rechnung: s(1) + s(2) + … mit der Summenfunktion." },
        { wert: summe30, id: "dreissig", text: "Das ist die Summe der ersten 30 Tage. Gefragt ist die ganze Reihe — rechne weiter, bis sich die Summe nicht mehr ändert." },
      ],
    },
    {
      id: "vergleich", typ: "wahl", label: "Verglichen mit dem Integral ist die Summe", soll: "kleiner",
      optionen: [
        { wert: "groesser", text: "größer als 32 Millionen" },
        { wert: "unendlich", text: "unendlich groß, weil s nie null wird" },
        { wert: "kleiner", text: "kleiner als 32 Millionen" },
        { wert: "gleich", text: "genau 32 Millionen" },
      ],
      falsch: [
        { wert: "groesser", id: "groesser", text: "Größer wäre die Summe, wenn die Rechtecke der Breite 1 insgesamt über die Kurve hinausragten. Vergleiche deinen Wert der Summe mit 32." },
        { wert: "unendlich", id: "unendlich", text: "Die Tageswerte nehmen wie eine geometrische Folge mit q = e<sup>−0,25</sup> ab — die Summe einer solchen Reihe ist endlich, genau wie das Integral." },
        { wert: "gleich", id: "gleich", text: "Fast, aber nicht genau: Die Summe zählt Rechtecke der Breite 1, das Integral die Fläche unter der Kurve. Beide liegen dicht beieinander, sind aber nicht gleich." },
      ],
    },
  ],
  knobelAntwort: `<p>Etwas kleiner: Die Tageswerte ergeben zusammen ≈ ${n(summeTage, 2)} Millionen, das Integral 32. Die Summe besteht aus Rechtecken der Breite 1 statt aus der Fläche unter der Kurve — beide unterscheiden sich um weniger als 1 %.</p>`,
  partner: "Wer hat in Schritt 4 „unendlich“ vermutet? Erklärt euch gegenseitig, warum eine Funktion, die nie null wird, trotzdem eine endliche Fläche haben kann.",
};

// ---------- K2: Die Rampe zum Radschnellweg ----------

const rampe = (L) => (x) => 6 * (3 * (x / L) ** 2 - 2 * (x / L) ** 3);
const rampeStrich = (L) => (x) => 6 * ((6 * x) / L ** 2 - (6 * x * x) / L ** 3);
const x3a = 75 - Math.sqrt(75 ** 2 - 2812.5);
const x3b = 75 + Math.sqrt(75 ** 2 - 2812.5);

const radweg = {
  key: "radweg",
  nr: "K 2",
  kapitel: "K",
  kurs: "gk",
  icon: "🚲",
  titel: "Die Rampe zum Radschnellweg",
  kompetenzen: ["1.2", "2.1", "3.1", "4.1"],
  behauptung: "„6 Meter Höhe auf 100 Meter Länge — das sind genau 6 %, und mehr wollen wir nicht. Also reichen 100 Meter Rampe.“",
  herkunft: "Ratsmitglied in der Ausschusssitzung",
  hintergrund: "<p>Viele Städte bauen Radschnellwege, auf denen man ohne Ampeln und ohne steile Rampen vorankommt. Steigungen sind dabei das größte Hindernis: Für Lastenräder, Kinderanhänger und ungeübte Fahrer gelten schon wenige Prozent als anstrengend. Ein Planungsbüro soll eine Auffahrt vom Uferweg auf eine 6 m höher gelegene Brücke entwerfen — ohne Knick am Anfang und am Ende, damit niemand hart aufsetzt. Vorgabe: nirgends mehr als 6 % Steigung.</p>",
  modell: `<p>Höhenprofil der Rampe als Funktion dritten Grades f mit 0 ≤ x ≤ L (x und f(x) in m):</p>
    <ul>
      <li>f(0) = 0 und f′(0) = 0: knickfreier Anschluss an den waagerechten Uferweg</li>
      <li>f(L) = 6 und f′(L) = 0: knickfreier Anschluss an die waagerechte Brücke</li>
    </ul>
    <p>Die vier Bedingungen ergeben f(x) = 6 · (3 · (x/L)² − 2 · (x/L)³) — für L = 100 also f(x) = −0,000012x³ + 0,0018x².</p>`,
  figur: {
    titel: "Höhenprofil der Rampe für 100 m und für 150 m Länge",
    x: { von: 0, bis: 150, schritt: 10, beschriftung: 2, titel: "waagerechte Entfernung x in m" },
    y: { von: 0, bis: 7, schritt: 1, titel: "Höhe in m" },
    kurven: [
      { f: (x) => (x <= 100 ? rampe(100)(x) : 6), von: 0, bis: 150, farbe: "orange", rolle: "l100" },
      { f: rampe(150), von: 0, bis: 150, farbe: "blau", rolle: "l150" },
      { f: (x) => 0.06 * x, von: 0, bis: 100, farbe: "grau", rolle: "gerade", gestrichelt: true },
    ],
    legende: [{ farbe: "orange", text: "Rampe mit L = 100 m" }, { farbe: "blau", text: "Rampe mit L = 150 m" }, { farbe: "grau", text: "gerade Rampe mit 6 % (mit Knick)", gestrichelt: true }],
    hinweis: "Die Höhe ist stark überhöht gezeichnet.",
  },
  rueckblick: `<p>Hier braucht es vier Kapitel: Knickfreiheit als Stetigkeit und Differenzierbarkeit (<a href="${L12}#sec-stetigkeit">1.2</a>, <a href="${L21}#sec-differenzierbar">2.1</a>), eine Funktion aus Bedingungen (<a href="${L31}#sec-steckbrief">3.1</a>), die steilste Stelle als Wendestelle (<a href="${L31}#sec-wendepunkte">3.1</a>) und eine Fläche als Integral (<a href="${L41}#sec-flaeche">4.1</a>).</p>`,
  werkzeug: `<ul>
      <li>Knickfrei: Funktionswert und Ableitung stimmen an der Nahtstelle überein (<a href="${L21}#sec-differenzierbar">2.1, Abschnitt 9</a>)</li>
      <li>Funktion aus Eigenschaften bestimmen (<a href="${L31}#sec-steckbrief">3.1, Abschnitt 9</a>)</li>
      <li>Steilste Stelle: f″(x) = 0 (<a href="${L31}#sec-wendepunkte">3.1, Abschnitt 4</a>); Steigungswinkel: tan α = f′(x) (<a href="${L21}#sec-tangente">2.1, Abschnitt 8</a>)</li>
      <li>Fläche unter dem Profil: ${integral("L", "0")} f(x) dx (<a href="${L41}#sec-flaeche">4.1, Abschnitt 7</a>)</li>
    </ul>`,
  kernfrage: "Entscheidend ist: Wie steil ist die knickfreie Rampe an ihrer steilsten Stelle — und wie lang muss sie sein?",
  schritte: [
    {
      phase: 2,
      frage: "Prüfe die Funktion für L = 100 an den vier Bedingungen und berechne zur Kontrolle die Höhe nach 25 m.",
      felder: [{
        id: "f25", label: "f(25) ≈", einheit: "m", soll: rampe(100)(25), tol: 0.002, stellen: 4,
        falsch: [{ wert: 1.5, id: "linear", text: "1,5 m hätte eine gerade Rampe mit 6 %. Die knickfreie Rampe beginnt flacher." }],
      }],
      tipps: ["f(x) = −0,000012x³ + 0,0018x².", "f(25) = −0,000012 · 15.625 + 0,0018 · 625."],
      loesung: `f(25) = −0,1875 + 1,125 = ${n(rampe(100)(25), 4)} m. Die Bedingungen: f(0) = 0, f′(0) = 0, f(100) = −12 + 18 = 6, f′(100) = −0,36 + 0,36 = 0.`,
    },
    {
      phase: 3,
      kern: true,
      frage: "Wo ist die Rampe (L = 100) am steilsten, und wie groß ist die Steigung dort in Prozent?",
      felder: [{
        id: "smax", label: "größte Steigung:", einheit: "%", soll: 9, tol: 0.01, stellen: 1,
        falsch: [{ wert: 6, id: "mittel", text: "6 % ist die mittlere Steigung (6 m auf 100 m) — die Steigung der Sekante. Die Rampe ist in der Mitte steiler, weil sie flach beginnt und flach endet." }],
      }],
      tipps: ["f″(x) = −0,000072x + 0,0036 = 0 ⟹ x = 50.", "f′(50) = −0,000036 · 2.500 + 0,0036 · 50."],
      loesung: "f″(x) = 0 ⟹ x = 50 (Wendestelle); f′(50) = −0,09 + 0,18 = 0,09 = 9 %.",
      deutung: "Anderthalbmal so steil wie der Durchschnitt.",
    },
    {
      phase: 3,
      frage: "Welchem Steigungswinkel entspricht das?",
      felder: [{
        id: "winkel", label: "α ≈", einheit: "°", soll: (Math.atan(0.09) * 180) / Math.PI, tol: 0.02, stellen: 2,
        falsch: [
          { wert: (Math.atan(9) * 180) / Math.PI, id: "prozent-als-zahl", text: "tan α = 0,09, nicht 9 — die Prozentangabe ist ein Anteil." },
          { wert: Math.atan(0.09), id: "bogenmass", text: "Das ist der Winkel im Bogenmaß. Stelle den Taschenrechner auf Grad (DEG)." },
        ],
      }],
      tipps: ["tan α = f′(50) = 0,09."],
      loesung: `α = arctan(0,09) ≈ ${n((Math.atan(0.09) * 180) / Math.PI, 2)}°.`,
    },
    {
      phase: 3,
      kern: true,
      frage: "Wie lang muss die Rampe mindestens sein, damit die größte Steigung höchstens 6 % beträgt? (Die steilste Stelle liegt für jedes L in der Mitte.)",
      felder: [{
        id: "L", label: "L ≥", einheit: "m", soll: 150, tol: 0.5, stellen: 0,
        falsch: [{ wert: 100, id: "behauptung", text: "Bei L = 100 ist die größte Steigung 9 % (Schritt 2). Berechne f′(L/2) allgemein." }],
      }],
      tipps: ["f′(x) = 6 · (6x/L² − 6x²/L³). Setze x = L/2 ein.", "f′(L/2) = 9/L ≤ 0,06."],
      loesung: "f′(L/2) = 6 · (3/L − 1,5/L) = 9/L ≤ 0,06 ⟺ L ≥ 150 m.",
      deutung: "Die Rampe muss anderthalbmal so lang sein wie behauptet.",
    },
    {
      phase: 4,
      frage: "Für die 150-m-Rampe muss Erde aufgeschüttet werden. Wie groß ist die Fläche unter dem Profil (Längsschnitt)?",
      felder: [{
        id: "A", label: "Fläche:", einheit: "m²", soll: 450, tol: 0.5, stellen: 0,
        falsch: [{ wert: 900, id: "rechteck", text: "Das ist das Rechteck 150 m · 6 m. Unter der Rampe liegt nur ein Teil davon." }],
      }],
      tipps: [`${integral("150", "0")} 6 · (3(x/150)² − 2(x/150)³) dx.`, "Stammfunktion: 6 · (x³/150² − x⁴/(2 · 150³))."],
      loesung: "6 · (150³/150² − 150⁴/(2 · 150³)) = 6 · (150 − 75) = 450 m² — bei 4 m Breite rund 1.800 m³ Erde.",
    },
  ],
  urteil: {
    optionen: [
      { text: "Stimmt: 6 m auf 100 m sind 6 %.", erklaerung: "6 % ist nur die mittlere Steigung (die Sekante). Weil die Rampe waagerecht beginnen und enden muss, ist sie in der Mitte steiler: 9 %." },
      { text: "Stimmt nicht: 6 % ist nur die mittlere Steigung. Weil die Rampe knickfrei beginnen und enden muss, ist sie in der Mitte anderthalbmal so steil — 9 % bei 100 m. Erst ab 150 m bleibt sie überall bei höchstens 6 %.", richtig: true, erklaerung: "Genau. Für jede Länge L ist die größte Steigung 1,5 · 6/L. Die Knickfreiheit kostet Länge: Flache Enden müssen durch eine steilere Mitte ausgeglichen werden. Eine gerade Rampe mit 6 % wäre kürzer, hätte aber an beiden Enden einen Knick." },
      { text: "Stimmt nicht: Man braucht mindestens 600 m.", erklaerung: "600 m ergäben eine größte Steigung von 9/600 = 1,5 % — viel flacher als nötig." },
      { text: "Stimmt nicht: Eine knickfreie Rampe ist überall flacher als die mittlere Steigung — man könnte sogar kürzer bauen.", erklaerung: "Umgekehrt: Am Anfang und am Ende ist sie flacher, also muss sie in der Mitte steiler sein. Im Mittel ergibt sich ja wieder 6 m Höhe." },
    ],
  },
  merksatz: "<p>Knickfreier Übergang heißt: Funktionswerte und Ableitungen stimmen an der Nahtstelle überein — die zusammengesetzte Funktion ist stetig und differenzierbar. Aus vier Bedingungen bestimmt man eine Funktion dritten Grades. Die größte Steigung liegt an der Wendestelle; bei dieser Rampe ist sie das 1,5-Fache der mittleren Steigung.</p>",
  denkfrage: "Die Rampe ist an den Enden knickfrei, aber die Krümmung springt dort: f″(0) = 36/L², auf dem Uferweg ist sie null. Wann spielt so ein Krümmungssprung eine Rolle?",
  musterantwort: "<p>Beim Radfahren kaum. Bei Achterbahnen und Bahnstrecken dagegen schon: Ein Sprung in der Krümmung bedeutet einen Ruck, weil sich die Kräfte auf die Fahrgäste schlagartig ändern. Dort verlangt man deshalb auch stetige zweite Ableitungen — mit mehr Bedingungen und Polynomen höheren Grades.</p>",
  knobel: "An welchen Stellen hat die 150-m-Rampe genau 3 % Steigung?",
  knobelFelder: [
    {
      id: "x1", label: "kleinere Stelle x₁ ≈", einheit: "m", soll: x3a, tol: 0.05, stellen: 1,
      falsch: [
        { wert: 75, id: "wende", text: "Bei x = 75 m, der Wendestelle, ist die Rampe am steilsten: 6 %. Die 3 % werden zweimal erreicht — einmal davor, einmal danach." },
        { wert: x3b, id: "tausch", text: "Das ist die größere der beiden Stellen; sie gehört ins zweite Feld." },
      ],
    },
    {
      id: "x2", label: "größere Stelle x₂ ≈", einheit: "m", soll: x3b, tol: 0.05, stellen: 1,
      falsch: [
        { wert: 75, id: "wende", text: "Bei x = 75 m, der Wendestelle, ist die Rampe am steilsten: 6 %. Die 3 % werden zweimal erreicht — einmal davor, einmal danach." },
        { wert: x3a, id: "tausch", text: "Das ist die kleinere der beiden Stellen; sie gehört ins erste Feld." },
      ],
    },
  ],
  knobelAntwort: `<p>f′(x) = 36x/150² − 36x²/150³ = 0,03 ⟺ x² − 150x + 2.812,5 = 0 ⟺ x ≈ ${n(x3a, 1)} m oder x ≈ ${n(x3b, 1)} m — symmetrisch zur Mitte.</p>`,
  partner: "Erklärt euch mit der Skizze, warum die mittlere Steigung (Sekante) und die größte Steigung (Tangente an der Wendestelle) nicht gleich sein können, wenn die Rampe waagerecht beginnt.",
};

// ---------- K3: Langsamer fahren, früher ankommen? ----------

const ladeP = (t) => 100 * Math.exp(-0.04 * t);
const eStopp = (2500 * (1 - Math.exp(-1.2))) / 60;      // kWh in 30 Minuten
const pMittel = eStopp / 0.5;
const verbrauch = (v) => 8 + 0.00085 * v * v;
const stopps = (v) => (6 * verbrauch(v) - 50) / eStopp;
const fahrt = (v) => 600 / v + (6 * verbrauch(v) - 50) / pMittel;
const vBest = Math.cbrt((600 * pMittel) / (6 * 2 * 0.00085));

const eauto = {
  key: "eauto",
  nr: "K 3",
  kapitel: "K",
  kurs: "gk",
  icon: "🔌",
  titel: "Langsamer fahren, früher ankommen?",
  kompetenzen: ["1.2", "2.1", "3.1", "4.2"],
  behauptung: "„Mit dem E-Auto bist du auf der Langstrecke mit Tempo 130 früher am Ziel als mit Tempo 180.“",
  herkunft: "Testbericht in einem Auto-Forum",
  hintergrund: "<p>Seit Jahren wird in Deutschland über ein Tempolimit auf Autobahnen gestritten. Bei Elektroautos kommt eine eigene Frage dazu: Wer schneller fährt, verbraucht deutlich mehr Strom, weil der Luftwiderstand mit der Geschwindigkeit stark wächst — und muss öfter laden. Die Ladeleistung ist dabei nicht konstant: Je voller der Akku, desto langsamer lädt er.</p>",
  modell: `<ul>
      <li>Strecke 600 km. Verbrauch c(v) = 8 + 0,00085 · v² kWh pro 100 km (v in km/h).</li>
      <li>Am Start sind 50 kWh im Akku nutzbar; alles Weitere wird unterwegs nachgeladen.</li>
      <li>Jeder Ladestopp dauert 30 Minuten mit der Ladeleistung P(t) = 100 · e<sup>−0,04t</sup> kW (t in Minuten seit Beginn des Stopps). Gerechnet wird mit der mittleren Ladeleistung eines Stopps.</li>
      <li>Gesamtzeit = Fahrzeit + Ladezeit; Abfahren und Anstecken bleiben unberücksichtigt.</li>
    </ul>`,
  figur: {
    titel: "Gesamtzeit der Fahrt in Abhängigkeit von der Geschwindigkeit",
    x: { von: 80, bis: 220, schritt: 10, beschriftung: 2, titel: "Geschwindigkeit v in km/h" },
    y: { von: 5.5, bis: 8.5, schritt: 0.5, titel: "Gesamtzeit in h" },
    kurven: [{ f: fahrt, von: 80, bis: 220, farbe: "blau", rolle: "gesamtzeit" }],
    senkrecht: [{ x: 130, farbe: "grau", rolle: "v130" }, { x: 180, farbe: "grau", rolle: "v180" }],
    legende: [{ farbe: "blau", text: "Fahrzeit + Ladezeit" }, { farbe: "grau", text: "130 und 180 km/h" }],
  },
  rueckblick: `<p>Hier braucht es vier Kapitel: Energie als Integral einer e-Rate (<a href="${L42}#sec-ekx">4.2</a>), Grenzwerte an den Rändern (<a href="${L12}#sec-unendlich">1.2</a>), die Ableitung von 1/v (<a href="${L21}#sec-potenz">2.1</a>) und ein Extremwertproblem (<a href="${L31}#sec-optimierung">3.1</a>).</p>`,
  werkzeug: `<ul>
      <li>Geladene Energie: ${integral("30", "0")} P(t) dt in kW · min; durch 60 ergibt kWh (<a href="${L42}#sec-ekx">4.2, Abschnitt 2</a>)</li>
      <li>Gesamtzeit T(v) = ${bruch("600", "v")} + ${bruch("6 · c(v) − 50", "P̄")} in Stunden</li>
      <li>(1/v)′ = −1/v² (<a href="${L21}#sec-potenz">2.1, Abschnitt 5</a>); Minimum: T′(v) = 0 (<a href="${L31}#sec-optimierung">3.1, Abschnitt 10</a>)</li>
      <li>Verhalten für v → 0 und v → ∞ (<a href="${L12}#sec-unendlich">1.2, Abschnitt 1</a>)</li>
    </ul>`,
  kernfrage: "Entscheidend ist: Wie lange dauert die Fahrt mit 130 km/h und wie lange mit 180 km/h — samt Laden?",
  schritte: [
    {
      phase: 3,
      frage: "Wie viel Energie lädt ein 30-Minuten-Stopp, und wie groß ist damit die mittlere Ladeleistung?",
      felder: [
        { id: "eS", label: "Energie pro Stopp:", einheit: "kWh", soll: eStopp, tol: 0.05, stellen: 2, falsch: [{ wert: 50, id: "konstant", text: "50 kWh wären es mit konstant 100 kW. Die Ladeleistung sinkt aber während des Stopps." }] },
        { id: "pM", label: "mittlere Ladeleistung:", einheit: "kW", soll: pMittel, tol: 0.1, stellen: 1, falsch: [] },
      ],
      tipps: [`${integral("30", "0")} 100 · e<sup>−0,04t</sup> dt = 2.500 · (1 − e<sup>−1,2</sup>) kW · min.`, "Durch 60 teilen ergibt kWh; geteilt durch 0,5 h ergibt die mittlere Leistung."],
      loesung: `2.500 · (1 − e<sup>−1,2</sup>) ≈ ${n(eStopp * 60, 0)} kW · min ≈ ${n(eStopp, 2)} kWh; mittlere Ladeleistung ${n(eStopp, 2)} kWh / 0,5 h ≈ ${n(pMittel, 1)} kW.`,
    },
    {
      phase: 2,
      kern: true,
      frage: "Wie lange dauert die Fahrt insgesamt bei 130 km/h? Gib die Gesamtzeit in Minuten an.",
      felder: [{
        id: "t130", label: "T(130) ≈", einheit: "min", soll: fahrt(130) * 60, tol: 0.5, stellen: 0,
        falsch: [{ wert: (600 / 130) * 60, id: "nur-fahrt", text: "Das ist nur die reine Fahrzeit. Dazu kommt die Ladezeit für die Energie, die über die 50 kWh hinausgeht." }],
      }],
      tipps: ["Verbrauch: 6 · c(130) kWh für 600 km.", "Ladezeit: (6 · c(130) − 50)/58,23 h; Fahrzeit 600/130 h."],
      loesung: `Fahrzeit ${n(600 / 130, 3)} h; Energie 6 · ${n(verbrauch(130), 3)} ≈ ${n(6 * verbrauch(130), 1)} kWh, nachzuladen ${n(6 * verbrauch(130) - 50, 1)} kWh ⟹ ${n((6 * verbrauch(130) - 50) / pMittel, 3)} h. Zusammen ≈ ${n(fahrt(130), 3)} h ≈ ${n(fahrt(130) * 60, 0)} min (${minuten(fahrt(130))}).`,
    },
    {
      phase: 3,
      kern: true,
      frage: "Und bei 180 km/h?",
      felder: [{
        id: "t180", label: "T(180) ≈", einheit: "min", soll: fahrt(180) * 60, tol: 0.5, stellen: 0,
        falsch: [{ wert: (600 / 180) * 60, id: "nur-fahrt180", text: "Das ist nur die reine Fahrzeit — die Ladezeit fehlt noch, und sie ist bei 180 km/h viel länger." }],
      }],
      tipps: ["Dieselbe Rechnung mit c(180) = 8 + 0,00085 · 180²."],
      loesung: `Fahrzeit ${n(600 / 180, 3)} h; nachzuladen ${n(6 * verbrauch(180) - 50, 1)} kWh ⟹ ${n((6 * verbrauch(180) - 50) / pMittel, 3)} h. Zusammen ≈ ${n(fahrt(180), 3)} h ≈ ${n(fahrt(180) * 60, 0)} min (${minuten(fahrt(180))}).`,
      deutung: `Mit 180 km/h ist man rund ${n((fahrt(180) - fahrt(130)) * 60, 1)} Minuten später am Ziel.`,
    },
    {
      phase: 2,
      frage: "Wie verhält sich die Gesamtzeit T(v) für v → 0 und für v → ∞?",
      felder: [{
        id: "rand", label: "Verhalten:", einheit: "", typ: "wahl", soll: "beide",
        optionen: [
          { wert: "null-unendlich", text: "T → 0 für v → 0, T → ∞ für v → ∞" },
          { wert: "beide", text: "T → ∞ für v → 0 und für v → ∞" },
          { wert: "beschraenkt", text: "T bleibt in beiden Fällen beschränkt" },
          { wert: "fallend", text: "T → ∞ für v → 0, T → 0 für v → ∞" },
        ],
        falsch: [
          { wert: "null-unendlich", id: "null-unendlich", text: "Für v → 0 kriecht das Auto: 600/v wächst ohne Grenze." },
          { wert: "beschraenkt", id: "beschraenkt", text: "Beide Summanden wachsen an je einem Rand ohne Grenze: 600/v für v → 0, der Ladeanteil mit v² für v → ∞." },
          { wert: "fallend", id: "fallend", text: "Die Fahrzeit 600/v geht für v → ∞ gegen 0 — aber der Ladeanteil wächst mit v² ohne Grenze." },
        ],
      }],
      tipps: ["Betrachte die beiden Summanden 600/v und (6 · c(v) − 50)/58,23 einzeln."],
      loesung: "T → ∞ an beiden Rändern. Weil T dazwischen stetig ist, muss es ein Minimum geben — eine Geschwindigkeit, mit der man am frühesten ankommt.",
    },
    {
      phase: 4,
      frage: "Mit welcher Geschwindigkeit kommt man am frühesten an?",
      felder: [{
        id: "vopt", label: "v* ≈", einheit: "km/h", soll: vBest, tol: 0.5, stellen: 0,
        falsch: [{ wert: 155, id: "mitte", text: "155 km/h liegt genau zwischen 130 und 180 — das Minimum liegt aber nicht in der Mitte. Setze T′(v) = 0." }],
      }],
      tipps: ["T′(v) = −600/v² + 6 · 0,0017 · v/58,23.", "T′(v) = 0 ⟺ v³ = 600 · 58,23/(6 · 0,0017)."],
      loesung: `T′(v) = −${bruch("600", "v²")} + ${bruch("0,0102 · v", n(pMittel, 2))} = 0 ⟺ v³ ≈ ${n(vBest ** 3, 0)} ⟺ v* ≈ ${n(vBest, 0)} km/h; T(v*) ≈ ${minuten(fahrt(vBest))}.`,
    },
  ],
  urteil: {
    optionen: [
      { text: `Stimmt — knapp: Mit 130 km/h dauert die Fahrt im Modell ${minuten(fahrt(130))}, mit 180 km/h ${minuten(fahrt(180))}. Am frühesten ist man mit etwa ${n(vBest, 0)} km/h da.`, richtig: true, erklaerung: `Genau. Die Fahrzeit 600/v sinkt mit v, die Ladezeit wächst mit v² — die Summe hat ein Minimum. Wer 180 statt 130 fährt, spart ${n((600 / 130 - 600 / 180) * 60, 0)} Minuten Fahrzeit, steht aber ${n(((6 * verbrauch(180) - 6 * verbrauch(130)) / pMittel) * 60, 0)} Minuten länger an der Ladesäule.` },
      { text: "Stimmt nicht: Wer schneller fährt, ist immer früher da.", erklaerung: "Beim Verbrenner mit kurzem Tankstopp wäre das so. Beim E-Auto wächst die Ladezeit mit dem Verbrauch, und der wächst mit v²." },
      { text: "Stimmt nicht: Am frühesten ist man mit 100 km/h da.", erklaerung: `T(100) ≈ ${minuten(fahrt(100))} — langsamer als mit 130 und mit 180.` },
      { text: "Lässt sich nicht sagen, weil die Fahrzeit nur von der Ladeleistung abhängt.", erklaerung: "Sie hängt von beidem ab: von der Geschwindigkeit (Fahrzeit und Verbrauch) und von der Ladeleistung (Ladezeit)." },
    ],
  },
  merksatz: "<p>Geht eine stetige Zielfunktion an beiden Rändern ihres Definitionsbereichs gegen ∞, hat sie dazwischen ein Minimum — man findet es mit T′(v) = 0. Energie aus einer zeitlich veränderlichen Leistung ist ein Integral; mit ihrem Mittelwert lässt sich weiterrechnen.</p>",
  denkfrage: "Das schnellste Tempo hängt im Modell weder von der Streckenlänge noch von den 50 kWh am Start ab. Warum nicht — und wovon hängt es ab?",
  musterantwort: `<p>Die 50 kWh verschieben T(v) nur um eine Konstante; die Ableitung ändert sich nicht. Die Streckenlänge steckt als Faktor in beiden Summanden von T′ und fällt bei T′ = 0 heraus. Übrig bleiben Ladeleistung und Verbrauchsanstieg: v* = ∛(100 · P̄ / (2 · 0,00085)). Mit doppelter mittlerer Ladeleistung wäre v* um den Faktor ∛2 ≈ 1,26 größer, also rund ${n(vBest * Math.cbrt(2), 0)} km/h.</p>`,
  knobel: "Wie viele 30-Minuten-Stopps braucht man bei 130 km/h, wie viele bei 180 km/h? Ein angefangener Stopp zählt als ganzer.",
  knobelFelder: [
    {
      id: "stopps130", label: "bei 130 km/h:", einheit: "Stopps", soll: Math.ceil(stopps(130)), tol: 0.01, stellen: 0,
      falsch: [
        { wert: stopps(130), id: "bruchteil", tol: 0.06, text: "So viele Stopps rechnet das Modell — mit Bruchteilen. Einen angefangenen Stopp muss man aber ganz einlegen: aufrunden." },
        { wert: Math.floor(stopps(130)), id: "abgerundet", text: `Mit ${Math.floor(stopps(130))} Stopps fehlen noch rund ${n(6 * verbrauch(130) - 50 - Math.floor(stopps(130)) * eStopp, 0)} kWh — abrunden reicht nicht bis ans Ziel.` },
      ],
    },
    {
      id: "stopps180", label: "bei 180 km/h:", einheit: "Stopps", soll: Math.ceil(stopps(180)), tol: 0.01, stellen: 0,
      falsch: [
        { wert: stopps(180), id: "bruchteil", tol: 0.06, text: "So viele Stopps rechnet das Modell — mit Bruchteilen. Einen angefangenen Stopp muss man aber ganz einlegen: aufrunden." },
        { wert: Math.floor(stopps(180)), id: "abgerundet", text: `Mit ${Math.floor(stopps(180))} Stopps fehlen noch rund ${n(6 * verbrauch(180) - 50 - Math.floor(stopps(180)) * eStopp, 0)} kWh — abrunden reicht nicht bis ans Ziel.` },
      ],
    },
  ],
  knobelAntwort: `<p>Bei 130 km/h sind ${n(6 * verbrauch(130) - 50, 1)} kWh nachzuladen, also ${n(stopps(130), 2)} Stopps — praktisch ${Math.ceil(stopps(130))}. Bei 180 km/h sind es ${n(6 * verbrauch(180) - 50, 1)} kWh, also ${n(stopps(180), 2)} Stopps — praktisch ${Math.ceil(stopps(180))}. Das Modell rechnet mit Bruchteilen; in Wirklichkeit lädt man beim letzten Stopp nur so viel, wie man braucht.</p>`,
  partner: "Vergleicht eure Werte für T(130) und T(180). Erklärt euch, welcher Teil der Rechnung den Ausschlag gibt — und warum der Unterschied so klein ist.",
};

// ---------- K4: Die Keeling-Kurve (LK) ----------

const trend = (t) => 315.6 + 0.84 * t + 0.0125 * t * t;
const trendStrich = (t) => 0.84 + 0.025 * t;
const co2 = (t) => trend(t) + 3 * Math.sin(2 * Math.PI * (t - 0.08));
const co2Strich = (t) => trendStrich(t) + 6 * Math.PI * Math.cos(2 * Math.PI * (t - 0.08));
const abA = halbiere(co2Strich, 66.2, 66.6);
const abB = halbiere(co2Strich, 66.7, 67.0);
const minRate = trendStrich(66.58) - 6 * Math.PI;
// Jahresmittel 2025: Integral von 66 bis 67 — der Sinusanteil hebt sich über eine Periode weg.
const mittel2025 = 315.6 + 0.84 * 66.5 + (0.0125 * (67 ** 3 - 66 ** 3)) / 3;
// Jahresmittel von Jahr k (t = k bis k + 1). Gesucht ist das erste k mit Mittel über 450 ppm; die
// Mittel wachsen monoton, die Schleife endet also nach wenigen Schritten.
const mittelJahr = (k) => 315.6 + 0.84 * (k + 0.5) + (0.0125 * ((k + 1) ** 3 - k ** 3)) / 3;
let jahr450 = 66;
while (mittelJahr(jahr450) <= 450) jahr450++;
const MONATE = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
const TAGE = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
function datumAusBruchteil(b) {
  let t = Math.round(b * 365) + 1;
  for (let m = 0; m < 12; m++) { if (t <= TAGE[m]) return `${t}. ${MONATE[m]}`; t -= TAGE[m]; }
  return "";
}

const keeling = {
  key: "keeling",
  nr: "K 4",
  kapitel: "K",
  kurs: "lk",
  icon: "🌍",
  titel: "Sinkt das CO₂ im Sommer?",
  kompetenzen: ["1.1", "2.1", "2.2", "3.2", "4.2"],
  behauptung: "„Jeden Sommer sinkt der CO₂-Gehalt der Luft! Also steigt er gar nicht immer weiter — die ganze Aufregung ist übertrieben.“",
  herkunft: "Kommentar unter einem Klima-Video",
  hintergrund: "<p>Seit 1958 misst das Observatorium auf dem Mauna Loa (Hawaii) den CO₂-Gehalt der Luft — die längste Messreihe dieser Art, die „Keeling-Kurve“. Der Jahresmittelwert stieg von rund 316 ppm (1959) auf rund 427 ppm (2025); im Mai 2026 lag der Monatswert bei gut 432 ppm. Die Kurve hat aber Zacken: Jedes Jahr sinkt der Gehalt ab Mai für einige Monate, weil die Pflanzen der Nordhalbkugel im Sommer CO₂ aufnehmen.</p>",
  quellen: [
    { text: "NOAA: Trends in CO₂", url: "https://gml.noaa.gov/ccgg/trends/" },
    { text: "UC San Diego: CO₂-Höchstwert erreicht 432 ppm", url: "https://today.ucsd.edu/story/annual-carbon-dioxide-peak-reaches-432-parts-per-million" },
  ],
  modell: `<p>CO₂-Gehalt in ppm, t in Jahren seit Anfang 1959 (t = 66 ist Anfang 2025):</p>
    <p class="formula-block">C(t) = 315,6 + 0,84t + 0,0125t² + 3 · sin(2π · (t − 0,08))</p>
    <p>Der Trend ist T(t) = 315,6 + 0,84t + 0,0125t², die Jahresschwingung 3 · sin(2π · (t − 0,08)).</p>`,
  figur: {
    titel: "CO₂-Gehalt am Mauna Loa 2020 bis 2026 im Modell, mit Trend",
    x: { von: 61, bis: 67.5, schritt: 1, titel: "Jahr", zahl: (v) => String(1959 + v) },
    y: { von: 410, bis: 435, schritt: 5, titel: "CO₂ in ppm" },
    kurven: [
      { f: co2, von: 61, bis: 67.5, farbe: "blau", rolle: "co2", n: 600 },
      { f: trend, von: 61, bis: 67.5, farbe: "grau", rolle: "trend", gestrichelt: true },
    ],
    legende: [{ farbe: "blau", text: "CO₂-Gehalt C(t)" }, { farbe: "grau", text: "Trend T(t)", gestrichelt: true }],
  },
  rueckblick: `<p>Hier braucht es fünf Kapitel: die Ableitung eines Polynoms (<a href="${L21}#sec-regeln">2.1</a>) und eines verketteten Sinus (<a href="${L22}#sec-kette">2.2</a>), Monotonie einer Schwingung mit Trend (<a href="${L32}#sec-trig">3.2</a>), einen Mittelwert als Integral (<a href="${L42}#sec-sinus">4.2</a>, <a href="${L41}#sec-mittelwert">4.1</a>) und die Differenzen einer Folge (<a href="${L11}#sec-arith-geo">1.1</a>).</p>`,
  werkzeug: `<ul>
      <li>(sin(2π(t − d)))′ = 2π · cos(2π(t − d)) (Kettenregel, <a href="${L22}#sec-kette">2.2, Abschnitt 6</a>)</li>
      <li>Monotonie: C′(t) &lt; 0 ⟺ C fällt (<a href="${L32}#sec-trig">3.2, Abschnitt 7</a>)</li>
      <li>Mittelwert über ein Jahr: ${integral("n + 1", "n")} C(t) dt (<a href="${L41}#sec-mittelwert">4.1, Abschnitt 9</a>); über eine volle Periode ist ∫ sin = 0 (<a href="${L42}#sec-sinus">4.2, Abschnitt 5</a>)</li>
      <li>Arithmetische Folge: konstante Differenzen (<a href="${L11}#sec-arith-geo">1.1, Abschnitt 2</a>)</li>
    </ul>`,
  kernfrage: "Entscheidend ist: Wie stark steigt der Trend — und wie lange im Jahr sinkt der Gehalt trotzdem?",
  schritte: [
    {
      phase: 3,
      kern: true,
      frage: "Wie schnell steigt der Trend Mitte 2025 (t = 66,5), in ppm pro Jahr?",
      felder: [{
        id: "tr", label: "T′(66,5) ≈", einheit: "ppm pro Jahr", soll: trendStrich(66.5), tol: 0.005, stellen: 3,
        falsch: [{ wert: trend(66.5), id: "funktionswert", text: "Das ist der Funktionswert T(66,5), also der CO₂-Gehalt selbst. Gefragt ist die Ableitung T′." }],
      }],
      tipps: ["T′(t) = 0,84 + 0,025t."],
      loesung: `T′(66,5) = 0,84 + 0,025 · 66,5 ≈ ${n(trendStrich(66.5), 3)} ppm pro Jahr.`,
      deutung: "Rund 2,5 ppm pro Jahr — so viel kommt im Mittel jedes Jahr dazu.",
    },
    {
      phase: 3,
      frage: "Wie schnell sinkt der Gehalt im Jahr 2025 im schnellsten Moment? Gib den kleinsten Wert von C′(t) an.",
      felder: [{
        id: "cmin", label: "kleinstes C′ ≈", einheit: "ppm pro Jahr", soll: minRate, tol: 0.05, stellen: 2,
        falsch: [
          { wert: -6 * Math.PI, id: "ohne-trend", text: "Das ist nur die Ableitung der Schwingung. Der Trend steigt auch in diesem Moment: Addiere T′." },
          { wert: trendStrich(66.58) - 3, id: "ohne-innere", text: "Die innere Ableitung fehlt: Nach der Kettenregel kommt der Faktor 2π dazu — die Schwingung ändert sich mit bis zu 6π ppm pro Jahr." },
        ],
      }],
      tipps: ["C′(t) = 0,84 + 0,025t + 6π · cos(2π(t − 0,08)).", "Am kleinsten, wenn der Kosinus −1 ist: 2π(t − 0,08) = π + 2πk, also t = 66,58."],
      loesung: `C′(t) = T′(t) + 6π · cos(2π(t − 0,08)); bei t = 66,58: ${n(trendStrich(66.58), 3)} − 6π ≈ ${n(minRate, 2)} ppm pro Jahr.`,
      deutung: "Momentan sinkt der Gehalt gut sechsmal so schnell, wie der Trend steigt.",
    },
    {
      phase: 3,
      kern: true,
      frage: "Wie viele Monate im Jahr 2025 sinkt der CO₂-Gehalt (C′(t) &lt; 0)?",
      felder: [{
        id: "monate", label: "Dauer ≈", einheit: "Monate", soll: (abB - abA) * 12, tol: 0.05, stellen: 2,
        falsch: [{ wert: 6, id: "halbes-jahr", text: "Ohne Trend wäre es genau ein halbes Jahr. Der steigende Trend verkürzt die Phase, in der C fällt." }],
      }],
      tipps: [`C′(t) &lt; 0 ⟺ cos(2π(t − 0,08)) &lt; −${bruch("T′", "6π")} ≈ −0,1328 (T′ ≈ 2,50 über das Jahr fast konstant).`, "arccos(−0,1328) ≈ 1,7040; die Abnahme dauert (2π − 2 · 1,7040)/(2π) Jahre."],
      loesung: `C′ hat 2025 Nullstellen bei t ≈ ${n(abA, 3)} (${datumAusBruchteil(abA - 66)}, Hochpunkt) und t ≈ ${n(abB, 3)} (${datumAusBruchteil(abB - 66)}, Tiefpunkt). Dazwischen ist C′ &lt; 0: rund ${n((abB - abA) * 12, 2)} Monate.`,
      deutung: "Der erste Teil der Behauptung stimmt: Fünfeinhalb Monate lang sinkt der Gehalt.",
    },
    {
      phase: 3,
      frage: "Wie groß ist der Jahresmittelwert 2025, also der Mittelwert von C auf [66; 67]?",
      felder: [{
        id: "mittel", label: "Mittelwert ≈", einheit: "ppm", soll: mittel2025, tol: 0.05, stellen: 2,
        falsch: [{ wert: co2(66.5), id: "jahresmitte", text: "Das ist der Wert zur Jahresmitte — dort steht die Schwingung nicht auf null. Der Mittelwert ist das Integral über das ganze Jahr." }],
      }],
      tipps: [`Mittelwert = ${integral("67", "66")} C(t) dt (Intervalllänge 1).`, "Das Integral des Sinusteils über eine volle Periode ist 0."],
      loesung: `${integral("67", "66")} C(t) dt = 315,6 + 0,84 · 66,5 + 0,0125 · ${bruch("67³ − 66³", "3")} + 0 ≈ ${n(mittel2025, 2)} ppm.`,
    },
    {
      phase: 4,
      frage: "Die Jahresmittelwerte a<sub>n</sub> bilden eine Folge. Um wie viel wächst ihr jährlicher Zuwachs a<sub>n+1</sub> − a<sub>n</sub> von Jahr zu Jahr?",
      felder: [{
        id: "d2", label: "Zunahme des Zuwachses:", einheit: "ppm pro Jahr", soll: 0.025, tol: 0.0005, stellen: 3,
        falsch: [{ wert: 0.0125, id: "koeffizient", text: "0,0125 ist der Koeffizient vor t². Die Differenz zweier aufeinanderfolgender Zuwächse ist doppelt so groß." }],
      }],
      tipps: ["a<sub>n</sub> = T(n + 0,5) + konstant (der Sinusteil fällt weg).", "a<sub>n+1</sub> − a<sub>n</sub> = 0,84 + 0,0125 · (2n + 2) — eine arithmetische Folge."],
      loesung: "a<sub>n+1</sub> − a<sub>n</sub> = 0,84 + 0,025 · (n + 1): Die Zuwächse bilden eine arithmetische Folge mit d = 0,025 ppm pro Jahr.",
      deutung: "Nicht nur der Gehalt steigt — auch sein jährlicher Anstieg wird größer.",
    },
  ],
  urteil: {
    optionen: [
      { text: "Stimmt: Wenn der Gehalt jeden Sommer sinkt, kann er über das Jahr nicht steigen.", erklaerung: "Er sinkt gut fünf Monate lang, steigt aber in den anderen gut sechs Monaten stärker. Über das Jahr bleibt ein Plus von rund 2,5 ppm." },
      { text: "Stimmt nicht: Der CO₂-Gehalt sinkt nie, auch nicht im Sommer.", erklaerung: "Doch: Gut fünf Monate im Jahr ist C′ < 0, weil die Pflanzen der Nordhalbkugel im Sommer CO₂ aufnehmen." },
      { text: "Stimmt nicht: Die Jahresschwankung ist größer als der ganze Anstieg seit 1959.", erklaerung: "Die Schwingung pendelt um ±3 ppm, der Anstieg seit 1959 beträgt über 110 ppm." },
      { text: `Nur der erste Teil stimmt: Gut fünfeinhalb Monate im Jahr sinkt der Gehalt tatsächlich, zeitweise mit über 16 ppm pro Jahr. Über das ganze Jahr steigt er aber um rund 2,5 ppm — und dieser Anstieg wird jedes Jahr größer.`, richtig: true, erklaerung: "Genau. Die Ableitung von C ist die Summe aus Trend (rund 2,5 ppm pro Jahr) und Schwingung (bis zu ±18,8 ppm pro Jahr). Momentan überwiegt oft die Schwingung; im Jahresmittel hebt sie sich aber weg — übrig bleibt der Trend. Aus einem kurzen Ausschnitt lässt sich die Richtung eines Trends nicht ablesen." },
    ],
  },
  merksatz: "<p>Bei C(t) = T(t) + A · sin(2π(t − d)) ist C′(t) = T′(t) + 2πA · cos(2π(t − d)) (Kettenregel). Über eine volle Periode ist der Mittelwert der Schwingung null: Der Jahresmittelwert gehört allein zum Trend. Wer nur auf kurze Abschnitte schaut, kann die Richtung eines Trends falsch ablesen.</p>",
  denkfrage: `Das Modell legt den Tiefpunkt jedes Jahres auf Ende Oktober (2025: ${datumAusBruchteil(abB - 66)}); gemessen wird er meist Ende September oder Anfang Oktober. Woran liegt das — und ist es für den Faktencheck wichtig?`,
  musterantwort: "<p>Die echte Jahresschwingung ist nicht symmetrisch: Die Abnahme im Sommer geht schneller als der Wiederanstieg im Winter. Eine Sinuskurve kann das nicht abbilden. Für die Frage, ob der Gehalt über das Jahr steigt, ist das egal: Dafür zählt nur, dass sich die Schwingung im Jahresmittel aufhebt — und das gilt für jede periodische Schwankung.</p>",
  knobel: "In welchem Jahr überschreitet der Jahresmittelwert im Modell erstmals 450 ppm?",
  knobelFelder: [
    {
      id: "jahr", label: "im Jahr", einheit: "", soll: 1959 + jahr450, tol: 0.01, stellen: 0,
      falsch: [
        { wert: 1959 + 66 + Math.ceil((450 - mittel2025) / trendStrich(66.5)), id: "linear", text: "So weit kommt man, wenn man vom Mittelwert 2025 aus mit dem heutigen Anstieg von 2,5 ppm pro Jahr gleichmäßig weiterrechnet. Der Anstieg wächst aber: T′(t) = 0,84 + 0,025t." },
        { wert: jahr450, id: "nurT", tol: 0.5, text: "Das ist der Wert von t, nicht die Jahreszahl: t = 0 ist der Anfang von 1959." },
      ],
    },
  ],
  knobelAntwort: (() => {
    const j = jahr450;
    return `<p>Der Mittelwert von Jahr k ist T(k + 0,5) + 0,0125/12. Er überschreitet 450 ppm erstmals für k = ${j}, also im Jahr ${1959 + j} (Mittelwert ≈ ${n(mittelJahr(j), 1)} ppm). Wer vom Mittelwert 2025 aus linear mit dem heutigen Anstieg von 2,5 ppm pro Jahr weiterrechnet, landet erst bei ${1959 + 66 + Math.ceil((450 - mittel2025) / trendStrich(66.5))} — der wachsende Anstieg holt ein Jahr heraus.</p>`;
  })(),
  partner: "Zeigt euch gegenseitig im Bild einen Zeitraum, in dem C fällt, und erklärt, warum der Trend trotzdem steigt. Wer kann es ohne Rechnung erklären?",
};

export const FAELLE_K = [song, radweg, eauto, keeling];
