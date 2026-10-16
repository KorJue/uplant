// Fälle zu Kapitel 3: Untersuchung ganzrationaler Funktionen (3.1) und weiterer Funktionen (3.2).

import { num, bruch } from "./hilfen.js?v=1";

const n = num;
const L31 = "../04-funktionsuntersuchung/index.html";
const L32 = "../04b-weitere-funktionen-untersuchen/index.html";

// Nullstelle einer stetigen Funktion mit Vorzeichenwechsel auf [a; b].
function halbiere(f, a, b) {
  let fa = f(a);
  for (let k = 0; k < 80; k++) {
    const m = (a + b) / 2, fm = f(m);
    if (Math.sign(fm) === Math.sign(fa)) { a = m; fa = fm; } else b = m;
  }
  return (a + b) / 2;
}

// ---------- 3.1 a: Niedrigwasser in Kaub ----------

const pegel = (t) => 0.025 * t ** 3 - 0.45 * t ** 2 - 2.1 * t + 57;
const pegelRate = (t) => 0.075 * t ** 2 - 0.9 * t - 2.1;
const unter1 = halbiere((t) => pegel(t) - 25, 0, 14);
const unter2 = halbiere((t) => pegel(t) - 25, 14, 20);
const wieder57 = (0.45 + Math.sqrt(0.45 ** 2 + 4 * 0.025 * 2.1)) / (2 * 0.025);

const kaub = {
  key: "kaub",
  nr: "3.1 a",
  kapitel: "3.1",
  kurs: "gk",
  icon: "🚢",
  titel: "Niedrigwasser am Pegel Kaub",
  behauptung: "„Der Rhein fällt immer schneller! Am stärksten sinkt der Pegel immer kurz bevor er seinen Tiefststand erreicht.“",
  herkunft: "Kommentar in einem Nachrichtenforum, August 2026",
  hintergrund: `<p>Der Pegel Kaub am Mittelrhein ist für die Binnenschifffahrt die wichtigste Messstelle: Zwischen Mainz und St. Goar ist die Fahrrinne besonders flach. Im August 2026 fiel der Pegel Kaub erstmals seit Beginn der Aufzeichnungen auf einen einstelligen Wert — gemeldet wurden 17 cm am 10. August und 8 cm am 14. August. Der bisherige Tiefstwert aus dem Jahr 2018 lag bei 25 cm. Beim „gleichwertigen Wasserstand“ von 77 cm bleibt den Schiffen noch eine Fahrrinnentiefe von 1,90 m; der Pegelwert selbst ist nicht die Wassertiefe.</p>`,
  quellen: [
    { text: "VerkehrsRundschau: Pegel Kaub erreicht historischen Tiefstand", url: "https://www.verkehrsrundschau.de/nachrichten/transport-logistik/rhein-niedrigwasser-pegel-kaub-erreicht-historischen-tiefstand-3891008" },
    { text: "transport-online: Pegel Kaub fällt auf 17 Zentimeter", url: "https://transport-online.de/news/binnenschifffahrt-pegel-kaub-faellt-auf-17-zentimeter-192074.html" },
  ],
  modell: `<p>Wasserstand in cm am t-ten August (t = 0 ist der 31. Juli, 0 ≤ t ≤ 20):</p>
    <p class="formula-block">P(t) = 0,025t³ − 0,45t² − 2,1t + 57</p>
    <p class="fc-meta">Das Modell ist an die Meldungen angelehnt (P(10) = 16, P(14) = 8) — keine amtliche Messreihe.</p>`,
  figur: {
    titel: "Wasserstand am Pegel Kaub im August 2026 (Modell)",
    x: { von: 0, bis: 20, schritt: 2, titel: "Tag im August t" },
    y: { von: 0, bis: 80, schritt: 10, titel: "Pegel P(t) in cm" },
    kurven: [{ f: pegel, von: 0, bis: 20, farbe: "blau", rolle: "pegel" }],
    waagrecht: [{ y: 77, farbe: "grau", rolle: "glw" }, { y: 25, farbe: "rot", rolle: "rekord" }],
    legende: [{ farbe: "blau", text: "Pegel P(t)" }, { farbe: "grau", text: "77 cm: gleichwertiger Wasserstand" }, { farbe: "rot", text: "25 cm: Tiefstwert 2018" }],
  },
  rueckblick: `<p>Wo eine Funktion am stärksten fällt, hat ihre Ableitung einen Tiefpunkt — welche besondere Stelle ist das für die Funktion selbst? Nachlesen: <a href="${L31}#sec-wendepunkte">3.1, Abschnitt 4</a>.</p>`,
  werkzeug: `<ul>
      <li>Extremstellen: P′(t) = 0 und P″(t) ≠ 0 (<a href="${L31}#sec-extrem2">3.1, Abschnitt 3</a>)</li>
      <li>Wendestellen: P″(t) = 0 mit Vorzeichenwechsel (<a href="${L31}#sec-wendepunkte">3.1, Abschnitt 4</a>)</li>
      <li>Globale Extrema auf einem Intervall: Randwerte mitprüfen (<a href="${L31}#sec-global">3.1, Abschnitt 6</a>)</li>
      <li>Newton-Verfahren: t<sub>neu</sub> = t − ${bruch("f(t)", "f′(t)")} (<a href="${L31}#sec-newton">3.1, Abschnitt 11</a>)</li>
    </ul>`,
  kernfrage: "Entscheidend ist: An welchem Tag fiel der Pegel am stärksten — und wie liegt dieser Tag zum Tiefststand?",
  schritte: [
    {
      phase: 3,
      frage: "Bestimme den Tiefpunkt von P im betrachteten Zeitraum: an welchem Tag, mit welchem Pegel?",
      felder: [
        { id: "tt", label: "Tag t =", einheit: "", soll: 14, tol: 0.05, stellen: 0, falsch: [{ wert: -2, id: "aussen", text: "t = −2 ist die zweite Nullstelle von P′ — sie liegt außerhalb des Zeitraums und gehört zu einem Hochpunkt." }] },
        { id: "pt", label: "Pegel P =", einheit: "cm", soll: 8, tol: 0.05, stellen: 1, falsch: [] },
      ],
      tipps: ["P′(t) = 0,075t² − 0,9t − 2,1 = 0 ⟺ t² − 12t − 28 = 0.", "t = 14 oder t = −2; P″(14) = 0,15 · 14 − 0,9 &gt; 0."],
      loesung: "P′(t) = 0 ⟺ t² − 12t − 28 = 0 ⟺ t = 14 (oder −2). P″(14) = 1,2 &gt; 0: Tiefpunkt T(14 | 8) — der 14. August mit 8 cm.",
      deutung: "Das Modell trifft den gemeldeten Tiefstand.",
    },
    {
      phase: 3,
      kern: true,
      frage: "An welchem Tag fiel der Pegel am stärksten, und um wie viele Zentimeter pro Tag?",
      felder: [
        { id: "tw", label: "Tag t =", einheit: "", soll: 6, tol: 0.05, stellen: 0, falsch: [{ wert: 14, id: "tiefpunkt", text: "Am Tiefpunkt ist P′ = 0 — dort fällt der Pegel gar nicht mehr. Die stärkste Abnahme ist ein Tiefpunkt von P′, also eine Wendestelle von P." }] },
        { id: "rw", label: "P′ =", einheit: "cm pro Tag", soll: pegelRate(6), tol: 0.05, stellen: 1, falsch: [{ wert: pegel(6), id: "pegel-statt-rate", text: "Das ist der Pegel am 6. August, nicht seine Änderungsrate. Setze t = 6 in P′ ein." }] },
      ],
      tipps: ["P″(t) = 0,15t − 0,9 = 0.", "P‴(t) = 0,15 ≠ 0, also Wendestelle. Dann P′(6) ausrechnen."],
      loesung: `P″(t) = 0,15t − 0,9 = 0 ⟺ t = 6; P‴ = 0,15 ≠ 0. P′(6) = 2,7 − 5,4 − 2,1 = ${n(pegelRate(6), 1)} cm pro Tag.`,
      deutung: "Am 6. August fiel der Pegel am stärksten — acht Tage vor dem Tiefststand.",
    },
    {
      phase: 3,
      frage: "Wann war der Pegel im Zeitraum 0 ≤ t ≤ 20 am höchsten, und wie hoch?",
      felder: [{
        id: "pmax", label: "höchster Pegel:", einheit: "cm", soll: 57, tol: 0.05, stellen: 0,
        falsch: [{ wert: 35, id: "rechter-rand", text: "35 cm hat der Pegel am rechten Rand (t = 20). Vergleiche beide Randwerte — der linke ist größer." }],
      }],
      tipps: ["Im Inneren gibt es nur den Tiefpunkt. Das Maximum liegt also am Rand.", "P(0) und P(20) vergleichen."],
      loesung: "Im Inneren gibt es keinen Hochpunkt; P(0) = 57, P(20) = 35. Globales Maximum am linken Rand: 57 cm am 31. Juli.",
    },
    {
      phase: 4,
      frage: "Wie viele Tage lag der Pegel unter dem alten Rekord von 25 cm? Bestimme die beiden Zeitpunkte mit dem Newton-Verfahren (Startwerte 8 und 19).",
      felder: [{
        id: "dauer", label: "Dauer:", einheit: "Tage", soll: unter2 - unter1, tol: 0.1, stellen: 1,
        falsch: [{ wert: unter2, id: "nur-ende", text: "Das ist der Zeitpunkt, an dem der Pegel wieder über 25 cm steigt. Die Dauer ist der Abstand der beiden Zeitpunkte." }],
      }],
      tipps: ["Newton für g(t) = P(t) − 25: t<sub>neu</sub> = t − g(t)/P′(t).", `Ab t = 8 ergibt sich t₁ ≈ ${n(unter1, 2)}, ab t = 19 entsprechend t₂.`],
      loesung: `t₁ ≈ ${n(unter1, 2)}, t₂ ≈ ${n(unter2, 2)}; Dauer ≈ ${n(unter2 - unter1, 1)} Tage.`,
      deutung: "Gut elf Tage lang lag der Rhein bei Kaub unter dem bisherigen Allzeit-Tief.",
    },
  ],
  urteil: {
    optionen: [
      { text: "Stimmt: Kurz vor dem Tiefststand fällt der Pegel am schnellsten.", erklaerung: "Am Tiefpunkt ist P′ = 0. Kurz davor fällt der Pegel also kaum noch — die Kurve muss waagerecht ankommen." },
      { text: `Stimmt nicht: Am stärksten fiel der Pegel an der Wendestelle am 6. August (${n(-pegelRate(6), 1)} cm pro Tag). Zum Tiefpunkt am 14. August hin wurde der Rückgang immer kleiner, am Tiefpunkt war er null.`, richtig: true, erklaerung: "Genau. Die stärkste Abnahme ist ein Tiefpunkt der Ableitung P′, also eine Wendestelle von P. Danach ist P linksgekrümmt: Der Pegel sinkt zwar weiter, aber immer langsamer." },
      { text: "Stimmt nicht: Am stärksten fiel der Pegel am ersten Tag der Messreihe.", erklaerung: `P′(0) = ${n(pegelRate(0), 1)} cm pro Tag — weniger als die Hälfte des Rückgangs an der Wendestelle.` },
      { text: "Stimmt nicht: Der Pegel fiel jeden Tag um gleich viel.", erklaerung: "Dann wäre der Graph eine Gerade. P′ ändert sich aber: von −2,1 über −4,8 bis 0 cm pro Tag." },
    ],
  },
  merksatz: "<p>Wo eine Größe am stärksten zu- oder abnimmt, hat ihre Ableitung ein Extremum — die Funktion selbst eine Wendestelle (f″ = 0 mit Vorzeichenwechsel). Am Tiefpunkt ist die Änderungsrate null. Auf einem Intervall gehören die Randwerte zur Suche nach dem globalen Extremum dazu.</p>",
  denkfrage: "Was sagt das Modell für den 30. August voraus — und warum sollte man ihm dort nicht mehr glauben?",
  musterantwort: `<p>P(30) = ${n(pegel(30), 0)} cm — ein ganz normaler Wasserstand, aber nur, weil ein Polynom dritten Grades für große t unbegrenzt wächst. Das Modell beschreibt den Verlauf im August-Fenster; den Regen der nächsten Wochen kennt es nicht. Ganzrationale Modelle taugen zum Beschreiben eines Zeitraums, kaum zum Vorhersagen.</p>`,
  knobel: "Wann erreicht der Pegel im Modell wieder den Wert vom 31. Juli (57 cm)?",
  knobelAntwort: `<p>P(t) = 57 ⟺ t · (0,025t² − 0,45t − 2,1) = 0 ⟺ t = 0 oder t ≈ ${n(wieder57, 1)}. Das liegt außerhalb des Zeitraums — deshalb ist der linke Rand im Zeitraum das globale Maximum.</p>`,
  partner: "Zeigt euch am Graphen, wo der Pegel am steilsten fällt. Erklärt einander, warum diese Stelle eine Wendestelle sein muss.",
};

// ---------- 3.1 b: Das Paket ----------

const vol = (x) => x * x * (300 - 4 * x);
const hermesA = 160 / 3;

const paket = {
  key: "paket",
  nr: "3.1 b",
  kapitel: "3.1",
  kurs: "gk",
  icon: "📦",
  titel: "Der größte Karton",
  behauptung: "„Wenn das Gurtmaß begrenzt ist, passt am meisten in einen würfelförmigen Karton. Ein Würfel ist immer die beste Form.“",
  herkunft: "Tipp in einer Kleinanzeigen-Gruppe",
  hintergrund: "<p>Viele Paketdienste begrenzen die Größe eines Pakets über das <strong>Gurtmaß</strong>: längste Seite + 2 · Breite + 2 · Höhe. Häufig liegt die Grenze bei 300 cm. Wer etwas Großes verschickt oder verkauft — eine Gitarre, ein Bobbycar, eine Kiste Bücher —, will möglichst viel in einen Karton bekommen.</p>",
  quellen: [{ text: "sendcloud: Gurtmaß berechnen", url: "https://www.sendcloud.com/de/blog/gurtmass-berechnen/" }],
  modell: `<p>Karton mit quadratischem Querschnitt: Breite = Höhe = x, Länge L ≥ x (die längste Seite). Das Gurtmaß wird voll ausgenutzt:</p>
    <p class="formula-block">L + 2x + 2x = 300 &nbsp; (alle Maße in cm)</p>`,
  figur: {
    titel: "Volumen des Kartons in Abhängigkeit von der Breite x",
    x: { von: 0, bis: 75, schritt: 5, beschriftung: 2, titel: "Breite = Höhe x in cm" },
    y: { von: 0, bis: 300, schritt: 50, titel: "Volumen in Liter" },
    kurven: [{ f: (x) => vol(x) / 1000, von: 0, bis: 75, farbe: "blau", rolle: "volumen" }],
    senkrecht: [{ x: 60, farbe: "grau", rolle: "wuerfel" }],
    legende: [{ farbe: "blau", text: "Volumen V(x)" }, { farbe: "grau", text: "x = 60: Würfel" }],
  },
  rueckblick: `<p>Bei einem Extremwertproblem hängt die Zielgröße zunächst von mehreren Variablen ab. Wie bringt man sie mit einer Nebenbedingung auf eine einzige — und welche Rolle spielt der Definitionsbereich? Nachlesen: <a href="${L31}#sec-optimierung">3.1, Abschnitt 10</a>.</p>`,
  werkzeug: `<ul>
      <li>Zielfunktion V = x · x · L, Nebenbedingung L + 4x = 300 (<a href="${L31}#sec-optimierung">3.1, Abschnitt 10</a>)</li>
      <li>Extremstellen: V′(x) = 0, V″(x) &lt; 0 für ein Maximum (<a href="${L31}#sec-extrem2">3.1, Abschnitt 3</a>)</li>
      <li>Globale Extrema: Randwerte des Definitionsbereichs vergleichen (<a href="${L31}#sec-global">3.1, Abschnitt 6</a>)</li>
      <li>1 Liter = 1.000 cm³</li>
    </ul>`,
  kernfrage: "Entscheidend ist: Welche Breite x liefert das größte Volumen — und ist das der Würfel?",
  schritte: [
    {
      phase: 2,
      frage: "Stelle das Volumen als Funktion von x auf: V(x) = x² · (300 − 4x). Wie groß darf x höchstens sein, damit L wirklich die längste Seite ist?",
      felder: [{
        id: "xmax", label: "x ≤", einheit: "cm", soll: 60, tol: 0.05, stellen: 0,
        falsch: [{ wert: 75, id: "l-null", text: "Bei x = 75 wäre L = 0 — dann wäre L nicht mehr die längste Seite. Bedingung: L = 300 − 4x ≥ x." }],
      }],
      tipps: ["L = 300 − 4x muss mindestens so groß sein wie x.", "300 − 4x ≥ x ⟺ 5x ≤ 300."],
      loesung: "L = 300 − 4x ≥ x ⟺ x ≤ 60. Definitionsbereich: 0 &lt; x ≤ 60. Bei x = 60 ist L = 60 — der Würfel.",
    },
    {
      phase: 3,
      frage: "Bestimme die Extremstelle von V im Inneren des Definitionsbereichs.",
      felder: [{
        id: "xopt", label: "x =", einheit: "cm", soll: 50, tol: 0.05, stellen: 0,
        falsch: [
          { wert: 0, id: "null", text: "x = 0 ist die zweite Nullstelle von V′ — ein leerer Karton, also ein Tiefpunkt am Rand." },
          { wert: 60, id: "rand", text: "x = 60 ist der Rand des Definitionsbereichs (der Würfel). Gesucht ist die Nullstelle von V′ im Inneren." },
        ],
      }],
      tipps: ["V(x) = 300x² − 4x³, also V′(x) = 600x − 12x².", "600x − 12x² = 12x · (50 − x) = 0."],
      loesung: "V′(x) = 600x − 12x² = 12x(50 − x) = 0 ⟹ x = 50; V″(50) = 600 − 24 · 50 = −600 &lt; 0: Maximum.",
    },
    {
      phase: 3,
      kern: true,
      frage: "Wie viele Liter fasst der beste Karton — und welche Maße hat er?",
      felder: [{
        id: "vopt", label: "größtes Volumen:", einheit: "Liter", soll: vol(50) / 1000, tol: 0.5, stellen: 0,
        falsch: [{ wert: vol(60) / 1000, id: "wuerfel", text: "216 Liter fasst der Würfel (x = 60). Setze die Extremstelle x = 50 ein." }],
      }],
      tipps: ["L = 300 − 4 · 50 = 100.", "V = 50 · 50 · 100 cm³, in Liter umrechnen."],
      loesung: `L = 100 cm; V(50) = 50 · 50 · 100 = 250.000 cm³ = ${n(vol(50) / 1000, 0)} Liter (100 × 50 × 50 cm).`,
      deutung: "Der beste Karton ist doppelt so lang wie breit.",
    },
    {
      phase: 4,
      frage: "Wie viele Liter mehr fasst er als der Würfel mit derselben Gurtmaß-Grenze?",
      felder: [{
        id: "mehr", label: "Unterschied:", einheit: "Liter", soll: (vol(50) - vol(60)) / 1000, tol: 0.5, stellen: 0,
        falsch: [{ wert: vol(60) / 1000, id: "nur-wuerfel", text: "Das ist das Volumen des Würfels selbst. Gefragt ist der Unterschied zum besten Karton." }],
      }],
      tipps: ["V(60) = 60 · 60 · 60 cm³."],
      loesung: `V(60) = 216.000 cm³ = 216 Liter; Unterschied ${n((vol(50) - vol(60)) / 1000, 0)} Liter (gut ${n(100 * (vol(50) / vol(60) - 1), 0)} % mehr).`,
    },
  ],
  urteil: {
    optionen: [
      { text: "Stimmt: Bei gegebener Oberfläche hat der Würfel das größte Volumen — also auch hier.", erklaerung: "Der Satz über die Oberfläche stimmt — hier ist aber nicht die Oberfläche begrenzt, sondern das Gurtmaß. Darin zählt die Länge einfach, Breite und Höhe doppelt." },
      { text: "Stimmt nicht: Am meisten passt in einen möglichst langen, dünnen Karton.", erklaerung: "Für x → 0 geht auch V(x) → 0: Ein sehr dünner Karton fasst fast nichts." },
      { text: "Stimmt nicht: Am meisten passt in einen flachen Karton, etwa 150 × 75 × 1 cm.", erklaerung: "Sein Gurtmaß wäre 150 + 150 + 2 = 302 cm — zu groß. Und er fasste nur gut 11 Liter." },
      { text: `Stimmt nicht: Weil im Gurtmaß die Länge nur einfach zählt, Breite und Höhe aber doppelt, lohnt sich ein längerer Karton: 100 × 50 × 50 cm fasst ${n(vol(50) / 1000, 0)} Liter, der Würfel nur ${n(vol(60) / 1000, 0)}.`, richtig: true, erklaerung: "Genau. V(x) = x² · (300 − 4x) hat sein Maximum bei x = 50 im Inneren des Definitionsbereichs; der Würfel liegt am Rand x = 60. Welche Form die beste ist, hängt immer von der Nebenbedingung ab." },
    ],
  },
  merksatz: "<p>Extremwertproblem: Zielfunktion aufstellen, mit der Nebenbedingung auf eine Variable bringen, den Definitionsbereich aus der Sachsituation bestimmen, im Inneren mit V′ = 0 und V″ prüfen — und die Randwerte vergleichen.</p>",
  denkfrage: "Warum durften wir annehmen, dass Breite und Höhe gleich sind?",
  musterantwort: "<p>Im Gurtmaß zählt nur die Summe b + h. Bei fester Summe ist das Produkt b · h am größten, wenn b = h ist — so wie unter allen Rechtecken mit gleichem Umfang das Quadrat den größten Flächeninhalt hat. Ein ungleicher Querschnitt würde bei gleicher Länge also weniger fassen; die Annahme kostet nichts.</p>",
  knobel: "Manche Paketdienste (etwa Hermes) messen anders: längste plus kürzeste Seite, zum Beispiel höchstens 80 cm. Welcher Karton fasst dann am meisten?",
  knobelAntwort: `<p>Sei a die längste, c die kürzeste Seite, a + c = 80. Die mittlere Seite b darf so groß wie a sein, also V = a² · (80 − a). V′ = 160a − 3a² = 0 ⟹ a = ${bruch("160", "3")} ≈ ${n(hermesA, 1)} cm, c ≈ ${n(80 - hermesA, 1)} cm. Das ergibt etwa ${n(hermesA ** 2 * (80 - hermesA) / 1000, 1)} Liter — wieder kein Würfel.</p>`,
  partner: "Habt ihr beide den Definitionsbereich bedacht? Erklärt euch, warum x = 75 nicht in Frage kommt, obwohl V(75) = 0 eine „schöne“ Nullstelle ist.",
};

// ---------- 3.2 a: Doppelte Dosis ----------

const konz = (t) => 8 * t * Math.exp(-0.5 * t);
const ein1 = halbiere((t) => konz(t) - 4, 0, 2), aus1 = halbiere((t) => konz(t) - 4, 2, 30);
const ein2 = halbiere((t) => 2 * konz(t) - 4, 0, 2), aus2 = halbiere((t) => 2 * konz(t) - 4, 2, 30);
const zweiteNach4 = (t) => konz(t) + (t > 4 ? konz(t - 4) : 0);
const aus4 = halbiere((t) => zweiteNach4(t) - 4, 6, 20);
let max4 = 0;
for (let i = 0; i <= 4000; i++) max4 = Math.max(max4, zweiteNach4(i / 200));

const dosis = {
  key: "dosis",
  nr: "3.2 a",
  kapitel: "3.2",
  kurs: "gk",
  icon: "💊",
  titel: "Zwei Tabletten auf einmal?",
  behauptung: "„Wenn eine Schmerztablette nicht lange genug wirkt, nimm einfach zwei auf einmal — dann wirkt sie doppelt so lange.“",
  herkunft: "Rat unter Freunden",
  hintergrund: "<p>Nach dem Schlucken einer Tablette steigt die Konzentration des Wirkstoffs im Blut zuerst an, weil er aus dem Darm aufgenommen wird, und fällt dann, weil Leber und Nieren ihn abbauen. Wirksam ist ein Mittel erst oberhalb einer bestimmten Konzentration. Auf jedem Beipackzettel steht eine Höchstdosis — für echte Medikamente gilt immer er, nicht dieses Modell.</p>",
  modell: `<p>Konzentration in mg pro Liter, t Stunden nach der Einnahme einer Tablette:</p>
    <p class="formula-block">c(t) = 8t · e<sup>−0,5t</sup></p>
    <p>Das Mittel wirkt, solange c(t) ≥ 4 ist. Zwei Tabletten auf einmal: 2 · c(t).</p>`,
  figur: {
    titel: "Wirkstoffkonzentration bei einer und bei zwei Tabletten",
    x: { von: 0, bis: 12, schritt: 1, titel: "Zeit t in h" },
    y: { von: 0, bis: 12, schritt: 2, titel: "Konzentration in mg/l" },
    kurven: [
      { f: konz, von: 0, bis: 12, farbe: "blau", rolle: "eine" },
      { f: (t) => 2 * konz(t), von: 0, bis: 12, farbe: "orange", rolle: "zwei" },
    ],
    waagrecht: [{ y: 4, farbe: "rot", rolle: "schwelle" }],
    legende: [{ farbe: "blau", text: "eine Tablette c(t)" }, { farbe: "orange", text: "zwei Tabletten 2 · c(t)" }, { farbe: "rot", text: "Wirkschwelle 4 mg/l" }],
  },
  rueckblick: `<p>Wie leitet man ein Produkt p(t) · e<sup>kt</sup> ab — und wie löst man eine Gleichung, für die es keine Lösungsformel gibt? Nachlesen: <a href="${L32}#sec-zweite">3.2, Abschnitt 2</a> und <a href="${L32}#sec-optimierung">Abschnitt 6</a>.</p>`,
  werkzeug: `<ul>
      <li>Produktregel mit Ausklammern: (8t · e<sup>−0,5t</sup>)′ = 8 · e<sup>−0,5t</sup> · (1 − 0,5t) (<a href="${L32}#sec-zweite">3.2, Abschnitt 2</a>)</li>
      <li>Gleichungen wie 8t · e<sup>−0,5t</sup> = 4: Newton-Verfahren, Intervallhalbierung oder Taschenrechner (<a href="${L32}#sec-optimierung">3.2, Abschnitt 6</a>)</li>
    </ul>`,
  kernfrage: "Entscheidend ist: Wie lange liegt die Konzentration bei zwei Tabletten über der Wirkschwelle — im Vergleich zu einer?",
  schritte: [
    {
      phase: 3,
      frage: "Wann ist die Konzentration bei einer Tablette am höchsten, und wie hoch ist sie dann?",
      felder: [
        { id: "tmax", label: "t =", einheit: "h", soll: 2, tol: 0.02, stellen: 1, falsch: [] },
        { id: "cmax", label: "c<sub>max</sub> ≈", einheit: "mg/l", soll: konz(2), tol: 0.01, stellen: 2, falsch: [{ wert: 16, id: "ohne-e", text: "Der Faktor e<sup>−0,5 · 2</sup> = e<sup>−1</sup> fehlt: c(2) = 16 · e<sup>−1</sup>." }] },
      ],
      tipps: ["c′(t) = 8 · e<sup>−0,5t</sup> · (1 − 0,5t). Ein Produkt ist null, wenn ein Faktor null ist.", "e<sup>−0,5t</sup> ist nie null, also 1 − 0,5t = 0."],
      loesung: `c′(t) = 8e<sup>−0,5t</sup>(1 − 0,5t) = 0 ⟹ t = 2; c(2) = 16 · e<sup>−1</sup> ≈ ${n(konz(2), 2)} mg/l.`,
    },
    {
      phase: 3,
      frage: "Von wann bis wann wirkt eine Tablette (c(t) ≥ 4)? Gib die Wirkdauer in Stunden an.",
      felder: [{
        id: "d1", label: "Wirkdauer:", einheit: "h", soll: aus1 - ein1, tol: 0.03, stellen: 2,
        falsch: [{ wert: aus1, id: "ab-null", text: "Das ist der Zeitpunkt, an dem die Wirkung endet. Sie beginnt aber nicht sofort, sondern erst, wenn c(t) die Schwelle 4 erreicht." }],
      }],
      tipps: ["Die Gleichung 8t · e<sup>−0,5t</sup> = 4 hat keine Lösungsformel — Newton, Intervallhalbierung oder Taschenrechner.", `Eine Lösung liegt bei t ≈ ${n(ein1, 2)}, die andere zwischen 4 und 5.`],
      loesung: `t₁ ≈ ${n(ein1, 2)} h, t₂ ≈ ${n(aus1, 2)} h; Wirkdauer ≈ ${n(aus1 - ein1, 2)} h.`,
    },
    {
      phase: 3,
      kern: true,
      frage: "Und bei zwei Tabletten auf einmal (2 · c(t) ≥ 4): Wie lange wirken sie?",
      felder: [{
        id: "d2", label: "Wirkdauer:", einheit: "h", soll: aus2 - ein2, tol: 0.03, stellen: 2,
        falsch: [
          { wert: 2 * (aus1 - ein1), id: "doppelt", text: "Das ist genau die Behauptung: die doppelte Wirkdauer. Rechne nach — löse 16t · e<sup>−0,5t</sup> = 4." },
          { wert: aus2, id: "ab-null2", text: "Das ist der Zeitpunkt, an dem die Wirkung endet. Ziehe den Beginn der Wirkung ab." },
        ],
      }],
      tipps: ["Löse 16t · e<sup>−0,5t</sup> = 4, also t · e<sup>−0,5t</sup> = 0,25.", `Die Lösungen liegen bei t ≈ ${n(ein2, 2)} und zwischen 6 und 7.`],
      loesung: `t₁ ≈ ${n(ein2, 2)} h, t₂ ≈ ${n(aus2, 2)} h; Wirkdauer ≈ ${n(aus2 - ein2, 2)} h — das ${n((aus2 - ein2) / (aus1 - ein1), 2)}-Fache, nicht das Doppelte.`,
      deutung: "Die Wirkung wird länger, aber nicht doppelt so lang.",
    },
    {
      phase: 4,
      frage: "Wie hoch ist die Spitzenkonzentration bei zwei Tabletten?",
      felder: [{ id: "cmax2", label: "Spitze ≈", einheit: "mg/l", soll: 2 * konz(2), tol: 0.02, stellen: 2, falsch: [] }],
      tipps: ["2 · c(t) hat sein Maximum an derselben Stelle wie c(t)."],
      loesung: `2 · c(2) ≈ ${n(2 * konz(2), 2)} mg/l — doppelt so hoch.`,
      deutung: "Die Wirkdauer wächst um knapp drei Viertel, die Spitze verdoppelt sich — und mit ihr das Risiko von Nebenwirkungen.",
    },
  ],
  urteil: {
    optionen: [
      { text: "Stimmt: Doppelte Dosis, doppelte Wirkdauer.", erklaerung: `Die Wirkdauer wächst von ${n(aus1 - ein1, 1)} auf ${n(aus2 - ein2, 1)} Stunden — um ${n(100 * ((aus2 - ein2) / (aus1 - ein1) - 1), 0)} %, nicht um 100 %.` },
      { text: "Stimmt nicht: Die Wirkdauer bleibt gleich, nur die Wirkung ist stärker.", erklaerung: "Die Wirkdauer wird länger: Die doppelte Konzentration braucht länger, bis sie unter die Schwelle fällt." },
      { text: `Stimmt nicht: Die Wirkdauer wächst nur um knapp drei Viertel (von rund ${n(aus1 - ein1, 1)} auf ${n(aus2 - ein2, 1)} Stunden) — die Spitzenkonzentration aber verdoppelt sich.`, richtig: true, erklaerung: "Genau. Weil die Konzentration am Ende exponentiell abklingt, verlängert die doppelte Menge die Wirkung nur um die Zeit, die der Körper braucht, um die zusätzliche Menge abzubauen. Die doppelte Spitze erhöht dagegen das Risiko von Nebenwirkungen — deshalb gibt es Höchstdosen und Mindestabstände zwischen zwei Einnahmen." },
      { text: "Stimmt nicht: Die Wirkdauer vervierfacht sich.", erklaerung: `Sie wächst nur auf das ${n((aus2 - ein2) / (aus1 - ein1), 2)}-Fache.` },
    ],
  },
  merksatz: "<p>Für Gleichungen wie 8t · e<sup>−0,5t</sup> = 4 gibt es keine Lösungsformel — man löst sie numerisch (Newton, Intervallhalbierung). Bei abklingenden Prozessen wirkt ein Faktor auf die Menge nicht als Faktor auf die Dauer: Doppelt so viel hält nicht doppelt so lange.</p>",
  denkfrage: "Statt zwei Tabletten auf einmal: eine Tablette jetzt und eine zweite nach 4 Stunden. Was ändert sich an Wirkdauer und Spitze?",
  musterantwort: `<p>Dann ist die Konzentration c(t) + c(t − 4) für t ≥ 4. Sie bleibt von t ≈ ${n(ein1, 1)} bis t ≈ ${n(aus4, 1)} über der Schwelle — gut ${n(aus4 - ein1, 0)} Stunden, länger als bei zwei Tabletten auf einmal (${n(aus2 - ein2, 1)} h). Die Spitze liegt bei nur etwa ${n(max4, 1)} mg/l statt ${n(2 * konz(2), 1)}. Deshalb verordnet man lieber Abstände als höhere Einzeldosen.</p>`,
  knobel: "Wann wird der Wirkstoff (bei einer Tablette) am schnellsten abgebaut?",
  knobelAntwort: `<p>Gesucht ist der Tiefpunkt von c′, also die Wendestelle von c: c″(t) = 8e<sup>−0,5t</sup>(0,25t − 1) = 0 ⟹ t = 4 h. Dort ist c′(4) = −8e<sup>−2</sup> ≈ ${n(-8 * Math.exp(-2), 2)} mg/l pro Stunde.</p>`,
  partner: "Vergleicht, wie ihr die Gleichung c(t) = 4 gelöst habt (Newton, Halbierung, Taschenrechner, Ablesen und Prüfen). Welcher Weg war am schnellsten, welcher am sichersten?",
};

// ---------- 3.2 b: Die schwingende Brücke (LK) ----------

const bruecke = (t) => 12 * Math.exp(-0.2 * t) * Math.sin(2 * t);
const huelle = (t) => 12 * Math.exp(-0.2 * t);
const tH = Math.atan(10) / 2;
const faktorH = Math.exp(-0.2 * Math.PI);

const geierlay = {
  key: "geierlay",
  nr: "3.2 b",
  kapitel: "3.2",
  kurs: "lk",
  icon: "🌉",
  titel: "Die schwingende Hängeseilbrücke",
  behauptung: "„Wenn alle hüpfen und dann aufhören, schwingt die Brücke höchstens 12 cm aus — und nach 10 Sekunden sind es keine 2 cm mehr.“",
  herkunft: "Mitschülerin nach dem Klassenausflug",
  hintergrund: "<p>Die Hängeseilbrücke Geierlay im Hunsrück verbindet seit 2015 die Orte Mörsdorf und Sosberg: 360 m lang, bis zu 100 m über dem Mörsdorfer Bachtal, der Laufsteg nur 80 cm breit. Sie gibt bei jedem Schritt spürbar nach — und schwingt, wenn eine Gruppe übermütig hüpft, noch eine Weile nach.</p>",
  quellen: [{ text: "ich-geh-wandern.de: Geierlay-Rundwanderung", url: "https://www.ich-geh-wandern.de/geierlay-rundwanderung-deutschlands-sch%C3%B6nste-h%C3%A4ngeseilbr%C3%BCcke-hunsr%C3%BCck" }],
  modell: `<p>Auslenkung der Brückenmitte in cm, t Sekunden nach dem letzten Sprung (ein Modell, keine Messung an der Brücke):</p>
    <p class="formula-block">y(t) = 12 · e<sup>−0,2t</sup> · sin(2t)</p>`,
  figur: {
    titel: "Ausschwingen der Brückenmitte mit Hüllkurve",
    x: { von: 0, bis: 15, schritt: 1, titel: "Zeit t in s" },
    y: { von: -12, bis: 12, schritt: 4, titel: "Auslenkung y(t) in cm" },
    kurven: [
      { f: bruecke, von: 0, bis: 15, farbe: "blau", rolle: "schwingung", n: 600 },
      { f: huelle, von: 0, bis: 15, farbe: "grau", rolle: "huelle", gestrichelt: true },
      { f: (t) => -huelle(t), von: 0, bis: 15, farbe: "grau", rolle: "huelle-unten", gestrichelt: true },
    ],
    legende: [{ farbe: "blau", text: "Auslenkung y(t)" }, { farbe: "grau", text: "Hüllkurven ±12 · e<sup>−0,2t</sup>", gestrichelt: true }],
  },
  rueckblick: `<p>Eine gedämpfte Schwingung hat die Form A · e<sup>−δt</sup> · sin(ωt). Liegen ihre Hochpunkte auf der Hüllkurve? Nachlesen: <a href="${L32}#sec-schwingung">3.2, Abschnitt 8</a>.</p>`,
  werkzeug: `<ul>
      <li>Periode von sin(ωt): T = ${bruch("2π", "ω")}</li>
      <li>Produkt- und Kettenregel: (e<sup>−0,2t</sup> · sin(2t))′ = e<sup>−0,2t</sup> · (2 cos(2t) − 0,2 sin(2t)) (<a href="${L32}#sec-schwingung">3.2, Abschnitt 8</a>)</li>
      <li>e<sup>−kt</sup> = c ⟺ t = −${bruch("ln c", "k")}</li>
      <li>Taschenrechner auf Bogenmaß (RAD)!</li>
    </ul>`,
  kernfrage: "Entscheidend ist: Wie groß ist der größte Ausschlag wirklich — und ab wann bleibt die Schwingung unter 2 cm?",
  schritte: [
    {
      phase: 1,
      frage: "Wie lange dauert eine volle Schwingung (Periode)?",
      felder: [{ id: "T", label: "T ≈", einheit: "s", soll: Math.PI, tol: 0.01, stellen: 2, falsch: [{ wert: 2 * Math.PI, id: "2pi", text: "2π ist die Periode von sin(t). Bei sin(2t) läuft die Schwingung doppelt so schnell: T = 2π/2." }] }],
      tipps: ["sin(2t) wiederholt sich, wenn 2t um 2π wächst."],
      loesung: "T = 2π/2 = π ≈ 3,14 s.",
    },
    {
      phase: 3,
      frage: "Bestimme den ersten Hochpunkt: wann, und wie weit schwingt die Brücke dort aus?",
      felder: [
        { id: "tH", label: "t<sub>H</sub> ≈", einheit: "s", soll: tH, tol: 0.003, stellen: 3, falsch: [{ wert: Math.PI / 4, id: "sin-eins", text: "Bei t = π/4 ist sin(2t) = 1 — dort berührt die Kurve die Hüllkurve. Der Hochpunkt liegt etwas früher, weil die Hüllkurve fällt: Setze y′(t) = 0." }] },
        { id: "yH", label: "y(t<sub>H</sub>) ≈", einheit: "cm", soll: bruecke(tH), tol: 0.01, stellen: 2, falsch: [
          { wert: 12, id: "ohne-daempfung", text: "12 cm wäre der Ausschlag ohne Dämpfung. Setze t<sub>H</sub> in y(t) ein." },
          { wert: huelle(tH), id: "huelle", text: "Das ist die Hüllkurve 12 · e<sup>−0,2t</sup> an dieser Stelle. Der Hochpunkt liegt knapp darunter, weil sin(2t<sub>H</sub>) etwas kleiner als 1 ist." },
        ] },
      ],
      tipps: ["y′(t) = 12e<sup>−0,2t</sup> · (2 cos(2t) − 0,2 sin(2t)) = 0 ⟺ tan(2t) = 10.", "2t = arctan(10), also t = arctan(10)/2."],
      loesung: `tan(2t) = 10 ⟹ t<sub>H</sub> = ${bruch("arctan 10", "2")} ≈ ${n(tH, 3)} s; y(t<sub>H</sub>) ≈ ${n(bruecke(tH), 2)} cm (Hüllkurve dort: ${n(huelle(tH), 2)} cm).`,
      deutung: "Der größte Ausschlag ist gut 10 cm — kleiner als 12.",
    },
    {
      phase: 3,
      kern: true,
      frage: "Ab welchem Zeitpunkt liegt die ganze Schwingung unter 2 cm? (Wann ist die Hüllkurve 12 · e<sup>−0,2t</sup> auf 2 cm gefallen?)",
      felder: [{
        id: "t2", label: "t ≈", einheit: "s", soll: 5 * Math.log(6), tol: 0.02, stellen: 2,
        falsch: [{ wert: 0.2 * Math.log(6), id: "mal-statt-durch", text: "Du hast mit 0,2 malgenommen statt durch 0,2 geteilt: −0,2t = ln(1/6) ⟹ t = ln(6)/0,2." }],
      }],
      tipps: ["12 · e<sup>−0,2t</sup> = 2 ⟺ e<sup>−0,2t</sup> = 1/6.", "t = ln(6)/0,2 = 5 · ln 6."],
      loesung: `e<sup>−0,2t</sup> = ${bruch("1", "6")} ⟹ t = 5 · ln 6 ≈ ${n(5 * Math.log(6), 2)} s. Danach bleibt |y(t)| ≤ Hüllkurve &lt; 2 cm.`,
      deutung: "Nach gut 9 Sekunden ist die Schwingung unter 2 cm — die Behauptung hält.",
    },
    {
      phase: 4,
      frage: "Um welchen Faktor schrumpft der Ausschlag von einem Hochpunkt zum nächsten?",
      felder: [{
        id: "q", label: "Faktor ≈", einheit: "", soll: faktorH, tol: 0.002, stellen: 4,
        falsch: [
          { wert: Math.exp(-0.2), id: "pro-sekunde", text: "e<sup>−0,2</sup> ist der Faktor pro Sekunde. Zwei Hochpunkte liegen eine Periode (π Sekunden) auseinander." },
          { wert: 0.5, id: "halb", text: "Halbiert wird der Ausschlag nicht genau: Der Faktor ist e<sup>−0,2 · π</sup>." },
        ],
      }],
      tipps: ["Zwei Hochpunkte liegen genau eine Periode auseinander: t<sub>H</sub> und t<sub>H</sub> + π.", "y(t<sub>H</sub> + π)/y(t<sub>H</sub>) = e<sup>−0,2π</sup>, weil sin(2t) sich nach π wiederholt."],
      loesung: `${bruch("y(t<sub>H</sub> + π)", "y(t<sub>H</sub>)")} = e<sup>−0,2π</sup> ≈ ${n(faktorH, 4)} — die Hochpunkte bilden eine geometrische Folge.`,
    },
  ],
  urteil: {
    optionen: [
      { text: `Stimmt: Der größte Ausschlag ist mit etwa ${n(bruecke(tH), 1)} cm kleiner als 12 cm, und nach gut 9 Sekunden liegt die ganze Schwingung unter 2 cm.`, richtig: true, erklaerung: "Genau. Die Hüllkurve ±12 · e<sup>−0,2t</sup> begrenzt die Schwingung, wird aber nie erreicht, solange sin(2t) &lt; 1 ist: Bei t = 0 ist die Auslenkung null, und bis zum ersten Hochpunkt ist die Hüllkurve schon auf gut 10,3 cm gefallen." },
      { text: "Stimmt nicht: Der erste Ausschlag ist genau 12 cm, weil die Hochpunkte auf der Hüllkurve liegen.", erklaerung: "Die Hochpunkte liegen knapp unterhalb der Hüllkurve: y′ = 0 heißt tan(2t) = 10, nicht sin(2t) = 1." },
      { text: "Stimmt nicht: Nach 10 Sekunden schwingt die Brücke noch fast mit 12 cm.", erklaerung: `12 · e<sup>−2</sup> ≈ ${n(huelle(10), 1)} cm: Die Dämpfung hat die Hüllkurve nach 10 s auf knapp ein Siebtel gedrückt.` },
      { text: "Lässt sich nicht prüfen, weil die Gleichung y′(t) = 0 keine Lösung hat.", erklaerung: "Sie hat unendlich viele: tan(2t) = 10, also t = (arctan 10 + kπ)/2 für k = 0, 1, 2, …" },
    ],
  },
  merksatz: `<p>Gedämpfte Schwingung y(t) = A · e<sup>−δt</sup> · sin(ωt): Periode ${bruch("2π", "ω")}, Hüllkurven ±A · e<sup>−δt</sup>. Die Hochpunkte liegen kurz vor den Berührpunkten mit der Hüllkurve; von einem zum nächsten schrumpft der Ausschlag um den Faktor e<sup>−δ · 2π/ω</sup> — eine geometrische Folge.</p>`,
  denkfrage: "Warum ist es gefährlich, im Takt der Eigenschwingung einer Brücke zu hüpfen — und was hat die Millennium Bridge in London damit zu tun?",
  musterantwort: "<p>Hüpft man im Takt der Eigenschwingung, kommt bei jedem Sprung Energie dazu, bevor die Dämpfung sie abbauen kann — die Ausschläge wachsen (Resonanz). Die Millennium Bridge in London geriet im Jahr 2000 kurz nach der Eröffnung ins seitliche Schwanken, weil die Fußgänger unbewusst im Takt der Brücke mitgingen; sie wurde gesperrt und bekam zusätzliche Dämpfer. Das Modell hier beschreibt nur das Ausschwingen nach dem letzten Sprung.</p>",
  knobel: "Der wievielte Hochpunkt ist der erste mit einem Ausschlag unter 1 cm?",
  knobelAntwort: `<p>Der k-te Hochpunkt (k = 0, 1, 2, …) hat ${n(bruecke(tH), 2)} · ${n(faktorH, 4)}<sup>k</sup> cm. Das ist ab k = 4 kleiner als 1 cm: Der 5. Hochpunkt bei t ≈ ${n(tH + 4 * Math.PI, 1)} s hat noch ${n(bruecke(tH + 4 * Math.PI), 2)} cm.</p>`,
  partner: "Prüft gegenseitig: Hat jemand t<sub>H</sub> = π/4 heraus? Zeigt im Bild, warum der Hochpunkt links davon liegen muss.",
};

export const FAELLE_3 = [kaub, paket, dosis, geierlay];
