// Fälle zu Kapitel 1: Folgen und Reihen (1.1), Grenzwerte und Stetigkeit (1.2).
//
// Alle Zahlen in den Texten werden hier aus dem Modell berechnet und nicht abgeschrieben — so kann
// eine Musterlösung nie etwas anderes behaupten als die Prüfung der Eingabe. Die Prüfdatei
// tests/mss11/test-anwendungsaufgaben.js rechnet jeden Wert unabhängig nach.

import { num, numFest, bruch } from "./hilfen.js?v=1";

const n = num;
const eur = (x) => numFest(x, 2) + " €";
const L11 = "../01-folgen-und-reihen/index.html";
const L12 = "../02-grenzwerte-und-stetigkeit/index.html";

// ---------- 1.1 a: Frühstart-Rente ----------

const e1 = 120 * 1.06 ** 11;
const s6 = (120 * (1.06 ** 12 - 1)) / 0.06;
const k6 = s6 * 1.06 ** 49;
const s5 = (120 * (1.05 ** 12 - 1)) / 0.05;
const k5 = s5 * 1.05 ** 49;
const verlust = 100 * (1 - k5 / k6);
const ersteMit67 = 120 * 1.06 ** 60;
const letzteMit67 = 120 * 1.06 ** 49;

const fruehstart = {
  key: "fruehstart",
  nr: "1.1 a",
  kapitel: "1.1",
  kurs: "gk",
  icon: "💶",
  titel: "Die Frühstart-Rente",
  behauptung: "„10 Euro im Monat vom Staat — mit 6 % Rendite werden daraus bis zur Rente über 35.000 Euro. Und ob das Depot 1 % Kosten im Jahr nimmt, ist bei so kleinen Beträgen doch egal.“",
  herkunft: "Nachricht im Familienchat",
  hintergrund: `<p>Die Bundesregierung plant die <strong>Frühstart-Rente</strong>: Für jedes Kind zahlt der Staat vom 6. bis zum 18. Geburtstag 10 € im Monat in ein Depot, zusammen 1.440 €. Ausgezahlt wird erst zur Rente. Nach dem Gesetzentwurf, über den der Bundestag im Herbst 2026 berät, soll das Programm am 1. Januar 2027 starten; die Kosten des Standarddepots sollen höchstens 1 % im Jahr betragen. Beispielrechnungen gehen von 6 % Rendite pro Jahr aus.</p>`,
  quellen: [
    { text: "Verbraucherzentrale: Frühstartrente", url: "https://www.verbraucherzentrale.de/node/125744" },
    { text: "Württembergische: Beispielrechnung mit 6 %", url: "https://www.wuerttembergische.de/vermoegen-vorsorge/kindervorsorge/fruehstart-rente/" },
  ],
  modell: `<p>Statt zwölf Monatsbeiträgen kommt <strong>einmal im Jahr 120 €</strong> ins Depot, jeweils am Geburtstag vom 7. bis zum 18. — zwölf Einzahlungen. Das Depot wächst mit Zinseszins um p = 6 % im Jahr; Kosten von 1 % werden von der Rendite abgezogen, das Depot wächst dann nur um 5 %. Ausgezahlt wird am 67. Geburtstag.</p>
    <p class="fc-meta">Wer monatlich rechnet, kommt auf etwas mehr — die Beispielrechnungen nennen gut 36.000 €. Am Vergleich 6 % gegen 5 % ändert das kaum etwas.</p>`,
  figur: {
    titel: "Wert jeder einzelnen Einzahlung am 67. Geburtstag, bei 6 % und bei 5 %",
    x: { von: 0, bis: 13, schritt: 1, titel: "Einzahlung Nr. k (am (6 + k)-ten Geburtstag)" },
    y: { von: 0, bis: 4000, schritt: 500, beschriftung: 2, titel: "Wert mit 67 in €" },
    punkte: [
      ...Array.from({ length: 12 }, (_, i) => ({ x: i + 1, y: 120 * 1.06 ** (60 - i), farbe: "blau", rolle: "p6" })),
      ...Array.from({ length: 12 }, (_, i) => ({ x: i + 1, y: 120 * 1.05 ** (60 - i), farbe: "orange", rolle: "p5" })),
    ],
    legende: [{ farbe: "blau", text: "bei 6 %" }, { farbe: "orange", text: "bei 5 % (6 % minus 1 % Kosten)" }],
    hinweis: "Die Punkte einer Farbe bilden eine geometrische Folge.",
  },
  rueckblick: `<p>Eine geometrische Folge hat einen festen Quotienten q. Wie lautet die Summe s<sub>n</sub> = a<sub>1</sub> + a<sub>1</sub>q + … + a<sub>1</sub>q<sup>n−1</sup>? Nachlesen: <a href="${L11}#sec-geo-reihe">1.1, Abschnitt 6</a>.</p>`,
  werkzeug: `<ul>
      <li>Geometrische Folge: a<sub>n</sub> = a<sub>1</sub> · q<sup>n−1</sup> (<a href="${L11}#sec-arith-geo">1.1, Abschnitt 2</a>)</li>
      <li>Summe der ersten n Glieder: s<sub>n</sub> = a<sub>1</sub> · ${bruch("q<sup>n</sup> − 1", "q − 1")} (<a href="${L11}#sec-geo-reihe">1.1, Abschnitt 6</a>)</li>
      <li>Zinseszins: Nach t Jahren mit p = 6 % ist aus K der Betrag K · 1,06<sup>t</sup> geworden.</li>
    </ul>`,
  kernfrage: "Entscheidend ist: Um wie viel Prozent schrumpft das Endkapital, wenn das Depot nur 5 % statt 6 % bringt?",
  schritte: [
    {
      phase: 2,
      frage: "Die erste Einzahlung (120 € am 7. Geburtstag) bleibt bis zum 18. Geburtstag im Depot. Wie viel ist sie dann wert?",
      felder: [{
        id: "e1", label: "Wert am 18. Geburtstag:", einheit: "€", soll: e1, tol: 0.5, stellen: 2,
        falsch: [
          { wert: 120 * 1.06 ** 12, id: "zwoelf-jahre", text: "Du hast zwölf Jahre verzinst. Vom 7. bis zum 18. Geburtstag sind es aber nur elf Jahre." },
          { wert: 120 * (1 + 0.06 * 11), id: "einfache-zinsen", text: "Das sind 11 · 6 % = 66 % Zuwachs — einfache Zinsen. Beim Zinseszins werden die Zinsen mitverzinst: Jedes Jahr wird der Betrag mit 1,06 malgenommen." },
        ],
      }],
      tipps: ["Jedes Jahr wird aus dem Betrag das 1,06-Fache.", "Zähle die Jahre vom 7. bis zum 18. Geburtstag.", "120 · 1,06<sup>11</sup> = …"],
      loesung: `120 · 1,06<sup>11</sup> ≈ ${eur(e1)}`,
      deutung: "Die erste Einzahlung hat sich bis zum 18. Geburtstag fast verdoppelt — und sie hat danach noch 49 Jahre vor sich.",
    },
    {
      phase: 3,
      frage: "Alle zwölf Einzahlungen zusammen am 18. Geburtstag: Die letzte ist gerade erst eingezahlt (120 €), die vorletzte ist 120 · 1,06 wert, …, die erste 120 · 1,06<sup>11</sup>. Berechne die Summe mit der Summenformel der geometrischen Reihe.",
      felder: [{
        id: "s12", label: "Depot am 18. Geburtstag:", einheit: "€", soll: s6, tol: 0.5, stellen: 2,
        falsch: [
          { wert: 1440, id: "ohne-zinsen", text: "1.440 € sind nur die Einzahlungen ohne Zinsen. Jede Einzahlung wächst bis zum 18. Geburtstag mit dem Faktor 1,06 pro Jahr." },
          { wert: s6 * 1.06, id: "vorschuessig", text: "Du hast jede Einzahlung ein Jahr zu lange verzinst. Die letzte Einzahlung am 18. Geburtstag hat noch gar keine Zinsen: Die Reihe beginnt bei 120, nicht bei 120 · 1,06." },
          { wert: (120 * (1.06 ** 13 - 1)) / 0.06, id: "dreizehn", text: "Das sind dreizehn Summanden. Es gibt aber nur zwölf Einzahlungen, vom 7. bis zum 18. Geburtstag — also n = 12." },
        ],
      }],
      tipps: [
        "Die Summanden 120, 120 · 1,06, …, 120 · 1,06<sup>11</sup> bilden eine geometrische Folge mit a<sub>1</sub> = 120 und q = 1,06.",
        "Zähle die Summanden: n = 12.",
        `s<sub>12</sub> = 120 · ${bruch("1,06<sup>12</sup> − 1", "1,06 − 1")} = …`,
      ],
      loesung: `s<sub>12</sub> = 120 · ${bruch("1,06<sup>12</sup> − 1", "0,06")} ≈ ${eur(s6)}`,
      deutung: "Mit 18 liegen gut 2.000 € im Depot — 1.440 € vom Staat, der Rest sind Zinsen.",
    },
    {
      phase: 3,
      frage: "Ab dem 18. Geburtstag kommt nichts mehr dazu; das Depot wächst 49 Jahre lang mit 6 %. Wie viel ist es am 67. Geburtstag wert?",
      felder: [{
        id: "k6", label: "Endkapital mit 6 %:", einheit: "€", soll: k6, tol: 15, stellen: 2,
        falsch: [
          { wert: 1440 * 1.06 ** 49, id: "ab-1440", text: "Du hast die 1.440 € ab dem 18. Geburtstag verzinst. Bis dahin sind aber schon Zinsen dazugekommen — starte mit dem Depotwert aus Schritt 2." },
          { wert: s6 * 1.06 ** 48, id: "48-jahre", text: "Vom 18. bis zum 67. Geburtstag sind es 49 Jahre, nicht 48." },
          { wert: s6 * (1 + 0.06 * 49), id: "einfach", text: "Das sind einfache Zinsen (49 · 6 %). Beim Zinseszins wird der Betrag 49-mal mit 1,06 malgenommen." },
        ],
      }],
      tipps: ["Der Startwert ist das Ergebnis aus Schritt 2.", `${eur(s6)} · 1,06<sup>49</sup> = …`],
      loesung: `${eur(s6)} · 1,06<sup>49</sup> ≈ ${eur(k6)}`,
      deutung: "Bei 6 % stimmt der erste Teil der Behauptung: Es sind gut 35.000 €.",
    },
    {
      phase: 3,
      frage: "Jetzt mit 1 % Kosten: Das Depot wächst nur um 5 % im Jahr — von der ersten Einzahlung an. Rechne die Schritte 2 und 3 mit dem Faktor 1,05 nach. Wie groß ist das Endkapital?",
      felder: [{
        id: "k5", label: "Endkapital mit 5 %:", einheit: "€", soll: k5, tol: 15, stellen: 2,
        falsch: [
          { wert: k6 * 0.99, id: "ein-prozent-weg", text: "Du hast 1 % vom Endkapital abgezogen. Die Kosten fallen aber jedes Jahr an — 61 Jahre lang wächst das Depot mit 1,05 statt mit 1,06." },
          { wert: s6 * 1.05 ** 49, id: "nur-ab-18", text: "Du hast die Kosten erst ab dem 18. Geburtstag berücksichtigt. Sie fallen aber schon in den ersten zwölf Jahren an — rechne auch Schritt 2 mit 1,05." },
        ],
      }],
      tipps: ["Dieselbe Rechnung wie in den Schritten 2 und 3, nur mit q = 1,05.", `s<sub>12</sub> = 120 · ${bruch("1,05<sup>12</sup> − 1", "0,05")} ≈ ${eur(s5)}.`, "Dann noch · 1,05<sup>49</sup>."],
      loesung: `120 · ${bruch("1,05<sup>12</sup> − 1", "0,05")} ≈ ${eur(s5)}, mal 1,05<sup>49</sup> ergibt ≈ ${eur(k5)}`,
    },
    {
      phase: 4,
      kern: true,
      frage: "Um wie viel Prozent ist das Endkapital mit 1 % Kosten kleiner als ohne Kosten?",
      felder: [{
        id: "verlust", label: "Verlust:", einheit: "%", soll: verlust, tol: 0.3, stellen: 1,
        falsch: [
          { wert: 1, id: "ein-prozent", text: "Ein Prozentpunkt weniger Rendite kostet nicht 1 % des Endkapitals: Er fehlt jedes Jahr aufs Neue — und die fehlenden Zinsen fehlen auch beim Zinseszins." },
          { wert: 100 * (k6 / k5 - 1), id: "falsche-basis", text: `So viel Prozent ist das Kapital mit 6 % größer als mit 5 %. Gefragt ist umgekehrt, wie viel Prozent von ${eur(k6)} verloren gehen.` },
          { wert: (100 * k5) / k6, id: "anteil-rest", text: "Das ist der Anteil, der übrig bleibt. Gefragt ist, wie viel verloren geht: 100 % minus diesen Anteil." },
        ],
      }],
      tipps: ["Verlust in Prozent = (Kapital ohne Kosten − Kapital mit Kosten) / Kapital ohne Kosten · 100.", `(${eur(k6)} − ${eur(k5)}) / ${eur(k6)} · 100 = …`],
      loesung: `${bruch(`${eur(k6)} − ${eur(k5)}`, eur(k6))} · 100 % ≈ ${n(verlust, 1)} %`,
      deutung: "Rund zwei Fünftel des Endkapitals gehen durch 1 % Kosten im Jahr verloren.",
    },
  ],
  urteil: {
    optionen: [
      { text: "Stimmt ganz: Über 35.000 € kommen heraus, und 1 % Kosten kosten auch nur etwa 1 % davon.", erklaerung: `Der erste Teil stimmt, der zweite nicht: Ein Prozentpunkt weniger Rendite kostet hier rund ${n(verlust, 0)} % des Endkapitals.` },
      { text: `Stimmt nur zur Hälfte: Bei 6 % kommen gut 35.000 € heraus — aber 1 % Kosten kosten rund ${n(verlust, 0)} % davon, weil sie 61 Jahre lang jedes Jahr anfallen.`, richtig: true, erklaerung: `Genau. Der Zinseszins vergrößert auch kleine Unterschiede: Mit 6 % wird das Endkapital rund ${n(k6 / k5, 1)}-mal so groß wie mit 5 %. Bei einer Altersvorsorge über Jahrzehnte sind die Kosten deshalb alles andere als egal.` },
      { text: "Stimmt nicht: Mit den Kosten bleibt am Ende weniger übrig, als der Staat eingezahlt hat.", erklaerung: `Auch mit 5 % sind es noch rund ${eur(k5)} — das ${n(k5 / 1440, 0)}-Fache der 1.440 €.` },
      { text: "Lässt sich nicht prüfen, weil niemand die Rendite der nächsten 60 Jahre kennt.", erklaerung: "Die Zukunft kennt niemand — aber die Behauptung rechnet selbst mit 6 %. Unter dieser Annahme lässt sie sich prüfen; genau dafür stellt man ein Modell auf." },
    ],
  },
  merksatz: `<p>Summe einer geometrischen Folge: s<sub>n</sub> = a<sub>1</sub> · ${bruch("q<sup>n</sup> − 1", "q − 1")}. Beim Zinseszins wirkt ein kleiner Unterschied im Faktor q über viele Jahre wie ein Exponent: Kosten von 1 % im Jahr kosten hier rund ${n(verlust, 0)} % des Endkapitals.</p>`,
  denkfrage: "Die Rechnung nimmt an, dass das Depot 61 Jahre lang jedes Jahr genau 6 % bringt. Was bedeutet das Ergebnis, wenn man die Preissteigerung berücksichtigt — sagen wir 2 % im Jahr?",
  musterantwort: `<p>In heutiger Kaufkraft sind die ${eur(k6)} nur etwa ${eur(k6 / 1.02 ** 61)} wert (geteilt durch 1,02<sup>61</sup>). Das Modell rechnet mit Euro in 61 Jahren, nicht mit Euro von heute. Außerdem schwanken Aktienrenditen stark; 6 % ist ein langjähriger Durchschnitt, keine Garantie. Der Vergleich der Kosten bleibt trotzdem aussagekräftig: Er hängt nur am Unterschied der Faktoren.</p>`,
  knobel: "Welche einzelne Einzahlung ist am 67. Geburtstag am meisten wert — und wievielmal so viel wie die letzte?",
  knobelAntwort: `<p>Die erste: 120 · 1,06<sup>60</sup> ≈ ${eur(ersteMit67)}, die letzte nur 120 · 1,06<sup>49</sup> ≈ ${eur(letzteMit67)} — das 1,06<sup>11</sup> ≈ ${n(1.06 ** 11, 2)}-Fache. Früh angelegtes Geld arbeitet am längsten.</p>`,
  partner: "Habt ihr in Schritt 2 mit zwölf oder mit dreizehn Summanden gerechnet? Erklärt euch gegenseitig, welche Einzahlung wie lange verzinst wird.",
};

// ---------- 1.1 b: Koffein beim Zocken ----------

const qk = 0.5 ** 0.5;
const a3 = 80 * (1 + qk + qk * qk);
const grenzK = 80 / (1 - qk);
let n250 = 1;
while (80 * (1 - qk ** n250) / (1 - qk) <= 250) n250++;
// Koffein im Körper t Stunden nach der ersten Dose (Dosen alle 2 h, sofort aufgenommen).
const koffein = (t) => {
  let s = 0;
  for (let d = 0; d <= t + 1e-9 && d <= 14; d += 2) s += 80 * 0.5 ** ((t - d) / 4);
  return s;
};

const koffeinFall = {
  key: "koffein",
  nr: "1.1 b",
  kapitel: "1.1",
  kurs: "gk",
  icon: "⚡",
  titel: "Energy-Drinks beim Zocken",
  behauptung: "„Beim Zocken trinke ich alle zwei Stunden eine Dose. Kein Problem — der Körper baut das Koffein ja ab. Mehr als zwei Dosen habe ich nie gleichzeitig im Blut.“",
  herkunft: "Kommentar unter einem Gaming-Stream",
  hintergrund: `<p>Eine Dose Energy-Drink (250 ml) enthält üblicherweise <strong>80 mg Koffein</strong>. Für Kinder und Jugendliche hält die Europäische Lebensmittelbehörde EFSA höchstens <strong>3 mg Koffein pro Kilogramm Körpergewicht und Tag</strong> für unbedenklich — bei 60 kg also 180 mg. Abgebaut wird Koffein in der Leber; die Halbwertszeit liegt bei gesunden Erwachsenen meist zwischen 2,5 und 4,5 Stunden, schwankt aber stark von Mensch zu Mensch.</p>`,
  quellen: [
    { text: "BfR: Fragen und Antworten zu Koffein und Energy Drinks", url: "https://www.bfr.bund.de/cm/343/fragen-und-antworten-zu-koffein-und-koffeinhaltigen-lebensmitteln-einschlie%C3%9Flich-energy-drinks.pdf" },
    { text: "AOK: Energy-Drinks und Gaming-Booster", url: "https://www.aok.de/pk/magazin/koerper-psyche/herz-und-kreislauf/energy-drinks-und-gaming-booster-ungesunde-koffein-kicks/" },
  ],
  modell: `<p>Jede Dose bringt sofort 80 mg ins Blut. Die Halbwertszeit sei <strong>4 Stunden</strong>: In 4 Stunden halbiert sich die Menge, und zwar unabhängig davon, wie viel gerade da ist. a<sub>n</sub> sei die Koffeinmenge direkt nach der n-ten Dose.</p>`,
  figur: {
    titel: "Koffein im Körper bei einer Dose alle zwei Stunden",
    x: { von: 0, bis: 16, schritt: 2, titel: "Zeit seit der ersten Dose in Stunden" },
    y: { von: 0, bis: 300, schritt: 50, titel: "Koffein im Körper in mg" },
    kurven: [{ f: koffein, von: 0, bis: 15.99, farbe: "blau", rolle: "koffein", n: 800 }],
    waagrecht: [{ y: 160, farbe: "rot", rolle: "behauptung" }],
    legende: [{ farbe: "blau", text: "Koffein im Körper" }, { farbe: "rot", text: "160 mg: „zwei Dosen“" }],
    hinweis: "Die senkrechten Sprünge sind die Dosen.",
  },
  rueckblick: `<p>Eine Folge kann <em>rekursiv</em> gegeben sein: a<sub>n+1</sub> = q · a<sub>n</sub> + d. Wie findet man ihren Grenzwert, wenn es einen gibt? Nachlesen: <a href="${L11}#sec-folge">1.1, Abschnitt 1</a> und <a href="${L11}#sec-unendlich">Abschnitt 7</a>.</p>`,
  werkzeug: `<ul>
      <li>Halbwertszeit T: Nach t Stunden ist noch der Anteil 0,5<sup>t/T</sup> da.</li>
      <li>Rekursion a<sub>n+1</sub> = q · a<sub>n</sub> + d mit 0 &lt; q &lt; 1: Grenzwert a = ${bruch("d", "1 − q")} (aus a = q · a + d).</li>
      <li>Unendliche geometrische Reihe: d + dq + dq² + … = ${bruch("d", "1 − q")} für |q| &lt; 1 (<a href="${L11}#sec-unendlich">1.1, Abschnitt 7</a>).</li>
    </ul>`,
  kernfrage: "Entscheidend ist: Gegen welchen Wert strebt die Koffeinmenge direkt nach einer Dose, wenn man immer weitertrinkt?",
  schritte: [
    {
      phase: 2,
      frage: "Welcher Anteil des Koffeins ist nach 2 Stunden noch im Körper? Gib den Abbaufaktor q als Dezimalzahl an.",
      felder: [{
        id: "q", label: "q =", einheit: "", soll: qk, tol: 0.002, stellen: 4,
        falsch: [
          { wert: 0.5, id: "halbwert", text: "0,5 bleibt nach einer ganzen Halbwertszeit, also nach 4 Stunden. Zwei Stunden sind nur die Hälfte davon." },
          { wert: 0.75, id: "linear", text: "Das ist linear gedacht: „in der halben Zeit die Hälfte des Abbaus“. Abbau mit Halbwertszeit ist aber exponentiell: zweimal hintereinander derselbe Faktor q ergibt 0,5, also q · q = 0,5." },
        ],
      }],
      tipps: ["Zweimal 2 Stunden sind eine Halbwertszeit. Zweimal hintereinander mit q malnehmen ergibt also 0,5.", "q · q = 0,5, also q = √0,5 = 0,5<sup>2/4</sup>."],
      loesung: `q = 0,5<sup>2/4</sup> = √0,5 ≈ ${n(qk, 4)}`,
      deutung: "Nach zwei Stunden sind noch gut 70 % des Koffeins da — nicht 75 %, wie man linear schätzen würde.",
    },
    {
      phase: 3,
      frage: "Wie viel Koffein ist direkt nach der dritten Dose im Körper?",
      felder: [{
        id: "a3", label: "a<sub>3</sub> =", einheit: "mg", soll: a3, tol: 0.6, stellen: 1,
        falsch: [
          { wert: 240, id: "kein-abbau", text: "240 mg wären drei Dosen ohne jeden Abbau. Die erste Dose ist aber seit vier Stunden im Körper, die zweite seit zwei." },
          { wert: 140, id: "q-halb", text: "Du hast mit q = 0,5 gerechnet — das ist der Faktor für 4 Stunden, nicht für 2 (siehe Schritt 1)." },
          { wert: 185, id: "q-dreiviertel", text: "Du hast mit q = 0,75 gerechnet. Der Abbau ist exponentiell: q = √0,5 (siehe Schritt 1)." },
        ],
      }],
      tipps: ["a<sub>1</sub> = 80, a<sub>2</sub> = q · a<sub>1</sub> + 80, a<sub>3</sub> = q · a<sub>2</sub> + 80.", "Oder direkt: a<sub>3</sub> = 80 + 80q + 80q²."],
      loesung: `a<sub>3</sub> = 80 + 80 · ${n(qk, 4)} + 80 · ${n(qk, 4)}² ≈ ${n(a3, 1)} mg`,
      deutung: "Schon nach der dritten Dose sind es mehr als zwei Dosen (160 mg).",
    },
    {
      phase: 3,
      kern: true,
      frage: "Die Folge gehorcht der Rekursion a<sub>n+1</sub> = q · a<sub>n</sub> + 80. Gegen welchen Grenzwert strebt sie, wenn man immer weitertrinkt?",
      felder: [{
        id: "grenz", label: "Grenzwert:", einheit: "mg", soll: grenzK, tol: 0.6, stellen: 1,
        falsch: [
          { wert: 160, id: "grenz-halb", text: "160 mg ergibt sich mit q = 0,5 — das ist der Faktor für 4 Stunden. Zwischen zwei Dosen liegen 2 Stunden." },
          { wert: 320, id: "grenz-dreiviertel", text: "320 mg ergibt sich mit q = 0,75. Der richtige Abbaufaktor für 2 Stunden ist √0,5." },
          { wert: Infinity, id: "unendlich", text: "Die Folge wächst, aber nicht unbegrenzt: Jede neue Dose bringt 80 mg, der Abbau wächst aber mit der Menge mit." },
        ],
      }],
      tipps: ["Wenn die Folge einen Grenzwert a hat, dann gilt für ihn a = q · a + 80.", `Nach a auflösen: a = ${bruch("80", "1 − q")}.`],
      loesung: `a = ${bruch("80", `1 − ${n(qk, 4)}`)} ≈ ${n(grenzK, 1)} mg — dasselbe wie die unendliche geometrische Reihe 80 + 80q + 80q² + …`,
      deutung: "Der Spiegel wächst nicht ins Unendliche, aber er nähert sich gut 270 mg — mehr als drei Dosen.",
    },
    {
      phase: 4,
      frage: "Direkt nach der wievielten Dose liegt die Menge zum ersten Mal über 250 mg?",
      felder: [{
        id: "n250", label: "nach der Dose Nr.", einheit: "", soll: n250, tol: 0.01, stellen: 0,
        falsch: [{ wert: n250 - 1, id: "abgerundet", text: `Nach der ${n250 - 1}. Dose sind es erst ${n(80 * (1 - qk ** (n250 - 1)) / (1 - qk), 1)} mg — knapp darunter. Gefragt ist die erste Dose, nach der es mehr als 250 mg sind.` }],
      }],
      tipps: [`a<sub>n</sub> = 80 · ${bruch("1 − q<sup>n</sup>", "1 − q")} (Summenformel). Probiere n = 6, 7, 8, …`, "Oder mit dem Logarithmus: q<sup>n</sup> &lt; 1 − 250 · (1 − q)/80 auflösen."],
      loesung: `a<sub>${n250 - 1}</sub> ≈ ${n(80 * (1 - qk ** (n250 - 1)) / (1 - qk), 1)} mg, a<sub>${n250}</sub> ≈ ${n(80 * (1 - qk ** n250) / (1 - qk), 1)} mg — also nach der ${n250}. Dose.`,
      deutung: `Nach ${n250} Dosen (${n250 * 80} mg getrunken) ist man nah am Grenzwert — und hat das ${n(n250 * 80 / 180, 1)}-Fache der Tagesmenge aufgenommen, die die EFSA bei 60 kg für unbedenklich hält.`,
    },
  ],
  urteil: {
    optionen: [
      { text: "Stimmt: Zwischen zwei Dosen baut der Körper immer genug ab, mehr als 160 mg werden es nie.", erklaerung: `Nach der dritten Dose sind es schon ${n(a3, 0)} mg: In zwei Stunden wird nicht die Hälfte abgebaut, sondern nur knapp 30 %.` },
      { text: "Stimmt nicht: Der Koffeinspiegel wächst mit jeder Dose immer weiter — ohne Grenze.", erklaerung: "Er wächst, aber beschränkt: Je mehr Koffein im Körper ist, desto mehr wird in zwei Stunden abgebaut. Der Spiegel nähert sich einem Grenzwert." },
      { text: "Stimmt: Auf Dauer pendelt sich der Spiegel bei 160 mg ein, genau zwei Dosen.", erklaerung: "160 mg wäre der Grenzwert, wenn alle zwei Stunden die Hälfte abgebaut würde. Die Halbwertszeit ist aber 4 Stunden." },
      { text: `Stimmt nicht: Schon nach der dritten Dose sind es etwa ${n(a3, 0)} mg, und auf Dauer nähert sich der Spiegel ${n(grenzK, 0)} mg — mehr als drei Dosen.`, richtig: true, erklaerung: `Richtig. Die Folge ist beschränkt, ihr Grenzwert ${bruch("80", "1 − q")} ≈ ${n(grenzK, 0)} mg liegt aber weit über zwei Dosen. Und die EFSA-Grenze bezieht sich auf die <em>getrunkene</em> Menge: Schon die dritte Dose überschreitet bei 60 kg die 180 mg am Tag.` },
    ],
  },
  merksatz: `<p>Eine Rekursion a<sub>n+1</sub> = q · a<sub>n</sub> + d mit 0 &lt; q &lt; 1 nähert sich dem Grenzwert ${bruch("d", "1 − q")} — das ist zugleich der Wert der unendlichen geometrischen Reihe d + dq + dq² + … Abbau mit Halbwertszeit T bedeutet in der Zeit t den Faktor 0,5<sup>t/T</sup>, nicht „anteilig weniger“.</p>`,
  denkfrage: "Das Modell nimmt an, dass jede Dose sofort vollständig im Blut ist und die Halbwertszeit immer genau 4 Stunden beträgt. Was ändert sich, wenn die Halbwertszeit 6 Stunden ist?",
  musterantwort: `<p>Dann bleibt in zwei Stunden der Anteil 0,5<sup>2/6</sup> ≈ ${n(0.5 ** (1 / 3), 3)}, und der Grenzwert steigt auf 80 / (1 − ${n(0.5 ** (1 / 3), 3)}) ≈ ${n(80 / (1 - 0.5 ** (1 / 3)), 0)} mg. Gerade bei langsamem Abbau staut sich viel mehr an. Dass das Koffein nicht sofort im Blut ist, glättet die Zacken der Kurve: Die Spitzen werden niedriger, der mittlere Spiegel bleibt gleich.</p>`,
  knobel: "Nach wie vielen Stunden ohne neue Dose ist ein Spiegel von 270 mg wieder unter 80 mg (eine Dose) gefallen?",
  knobelAntwort: `<p>270 · 0,5<sup>t/4</sup> = 80 ergibt t = 4 · log<sub>0,5</sub>(80/270) = 4 · ${n(Math.log(270 / 80) / Math.log(2), 3)} ≈ ${n(4 * Math.log(270 / 80) / Math.log(2), 1)} Stunden — eine ganze Nacht.</p>`,
  partner: "Vergleicht eure Werte für q. Wer 0,75 hatte: Woran lag es? Erklärt euch gegenseitig, warum „halbe Zeit, halber Abbau“ hier nicht stimmt.",
};

// ---------- 1.2 a: Der Steuertarif ----------

// § 32a EStG, Tarif 2026 (Grundtabelle), hier als Funktion mit reellen Werten — die Abrundung auf
// volle Euro lässt das Modell weg (siehe Denkfrage).
const T2 = (x) => { const y = (x - 12348) / 10000; return (914.51 * y + 1400) * y; };
const T3 = (x) => { const z = (x - 17799) / 10000; return (173.10 * z + 2397) * z + 1034.87; };
const T4 = (x) => 0.42 * x - 11135.63;
const T5 = (x) => 0.45 * x - 19470.38;
const tarif = (x) => (x <= 12348 ? 0 : x <= 17799 ? T2(x) : x <= 69878 ? T3(x) : x <= 277825 ? T4(x) : T5(x));
const t3a = T3(69878);
const t4b = T4(69879);
const sprung = T4(69879) - T3(69879);

const steuer = {
  key: "steuer",
  nr: "1.2 a",
  kapitel: "1.2",
  kurs: "gk",
  icon: "🧾",
  titel: "Die Gehaltserhöhung",
  behauptung: "„Bloß keine Gehaltserhöhung über 69.878 Euro! Sonst rutschst du in den Spitzensteuersatz von 42 % und hast am Ende weniger netto als vorher.“",
  herkunft: "Ratschlag beim Familienessen",
  hintergrund: `<p>Die Einkommensteuer ist in § 32a des Einkommensteuergesetzes als Formel festgelegt, abhängig vom zu versteuernden Einkommen x in Euro. Für 2026 gilt: Bis zum Grundfreibetrag von 12.348 € ist sie null; danach folgen zwei Zonen mit quadratischen Formeln, ab 69.879 € die lineare Zone mit dem Spitzensteuersatz von 42 % und ab 277.826 € die „Reichensteuer“ mit 45 %. Dass man durch eine Erhöhung „in eine höhere Steuerklasse rutscht“ und weniger behält, ist eine verbreitete Sorge.</p>`,
  quellen: [
    { text: "§ 32a EStG", url: "https://gesetze.legal/bund/estg/32a" },
    { text: "Tarifformeln 2026", url: "https://www.finanz-tools.de/einkommensteuer/berechnung-formeln/2026" },
  ],
  modell: `<p>Die Steuer T(x) in Euro (Grundtabelle 2026), ohne die Abrundung auf volle Euro:</p>
    <ul>
      <li>17.800 ≤ x ≤ 69.878: T(x) = (173,10 · z + 2.397) · z + 1.034,87 mit z = ${bruch("x − 17.799", "10.000")}</li>
      <li>69.879 ≤ x ≤ 277.825: T(x) = 0,42 · x − 11.135,63</li>
      <li>x ≥ 277.826: T(x) = 0,45 · x − 19.470,38</li>
    </ul>`,
  figur: {
    titel: "Einkommensteuer 2026 in Abhängigkeit vom zu versteuernden Einkommen",
    x: { von: 0, bis: 120000, schritt: 10000, beschriftung: 2, titel: "zu versteuerndes Einkommen x in €" },
    y: { von: 0, bis: 40000, schritt: 5000, beschriftung: 2, titel: "Steuer T(x) in €" },
    kurven: [{ f: tarif, von: 0, bis: 120000, farbe: "blau", rolle: "tarif", n: 600 }],
    senkrecht: [{ x: 17799, farbe: "grau", rolle: "zone" }, { x: 69878, farbe: "rot", rolle: "zone" }],
    legende: [{ farbe: "blau", text: "Steuer T(x)" }, { farbe: "grau", text: "Grenze 17.799 €" }, { farbe: "rot", text: "Grenze 69.878 €" }],
  },
  rueckblick: `<p>Eine Funktion ist an einer Stelle stetig, wenn Grenzwert und Funktionswert zusammenpassen. Bei einer abschnittsweise definierten Funktion ist das an jeder Nahtstelle eine eigene Frage. Nachlesen: <a href="${L12}#sec-stetigkeit">1.2, Abschnitt 4</a>.</p>`,
  werkzeug: `<ul>
      <li>Stetigkeit an der Nahtstelle a: Der Grenzwert von links (mit der linken Formel) stimmt mit dem Funktionswert T(a) überein (<a href="${L12}#sec-stetigkeit">1.2, Abschnitt 4</a>).</li>
      <li>Grenzwerte für x → ∞: Bei ${bruch("a · x + b", "x")} = a + ${bruch("b", "x")} geht ${bruch("b", "x")} gegen 0 (<a href="${L12}#sec-rational">1.2, Abschnitt 3</a>).</li>
    </ul>`,
  kernfrage: "Entscheidend ist: Springt die Steuer an der Grenze 69.878 € → 69.879 €, oder ist der Tarif dort stetig?",
  schritte: [
    {
      phase: 1,
      frage: "Wie hoch ist die Steuer bei x = 69.878 € (letzter Euro der quadratischen Zone)?",
      felder: [{
        id: "t3", label: "T(69.878) ≈", einheit: "€", soll: t3a, tol: 0.5, stellen: 2,
        falsch: [{ wert: 0.42 * 69878, id: "prozent-von-allem", text: "Das sind 42 % des ganzen Einkommens. So rechnet der Tarif nicht: Bis 69.878 € gilt die quadratische Formel der Zone 3." }],
      }],
      tipps: [`z = ${bruch("69.878 − 17.799", "10.000")} = 5,2079.`, "T = (173,10 · 5,2079 + 2.397) · 5,2079 + 1.034,87."],
      loesung: `z = 5,2079, T(69.878) ≈ ${eur(t3a)}`,
    },
    {
      phase: 3,
      frage: "Und bei x = 69.879 €, dem ersten Euro der Zone mit 42 %?",
      felder: [{
        id: "t4", label: "T(69.879) =", einheit: "€", soll: t4b, tol: 0.05, stellen: 2,
        falsch: [{ wert: 0.42 * 69879, id: "ohne-abzug", text: "Das sind 42 % des ganzen Einkommens. In der Formel wird davon noch 11.135,63 € abgezogen — genau das sorgt dafür, dass die Zonen zusammenpassen." }],
      }],
      tipps: ["T(x) = 0,42 · x − 11.135,63."],
      loesung: `T(69.879) = 0,42 · 69.879 − 11.135,63 = ${eur(t4b)}`,
      deutung: "Ein Euro mehr Einkommen, knapp 50 Cent mehr Steuer — kein Sprung um Tausende.",
    },
    {
      phase: 3,
      kern: true,
      frage: "Stetigkeit an der Nahtstelle: Setze 69.879 in die Formel der <em>linken</em> Zone ein (das ist der Grenzwert von links) und vergleiche mit dem Funktionswert T(69.879) aus Schritt 2. Wie groß ist der Unterschied in Euro?",
      felder: [{
        id: "sprung", label: "T(69.879) − linke Formel(69.879) ≈", einheit: "€", soll: sprung, tol: 0.01, stellen: 2,
        falsch: [
          { wert: t4b - t3a, id: "ein-euro", text: `Das ist der Unterschied zwischen 69.878 € und 69.879 € — darin steckt auch der eine Euro mehr Einkommen. Für die Stetigkeit vergleicht man beide Formeln an <em>derselben</em> Stelle 69.879.` },
          { wert: 0.42 * 69879 - t3a, id: "prozent-sprung", text: "Du hast in der rechten Zone 42 % vom ganzen Einkommen genommen. Die Formel lautet 0,42 · x − 11.135,63." },
        ],
      }],
      tipps: ["Linke Formel bei 69.879: z = (69.879 − 17.799)/10.000 = 5,208.", "Unterschied = (0,42 · 69.879 − 11.135,63) − ((173,10 · 5,208 + 2.397) · 5,208 + 1.034,87)."],
      loesung: `Linke Formel bei 69.879: ≈ ${eur(T3(69879))}; rechts: ${eur(t4b)}. Unterschied ≈ ${n(sprung, 2)} € — der Rest kommt nur von den gerundeten Koeffizienten im Gesetz.`,
      deutung: "Bis auf wenige Cent passen die Formeln zusammen: Der Tarif ist an der Grenze stetig.",
    },
    {
      phase: 4,
      frage: "Wie viel Steuer kostet in der Zone mit 42 % jeder <em>zusätzliche</em> Euro Einkommen?",
      felder: [{
        id: "grenz", label: "pro zusätzlichem Euro:", einheit: "€", soll: 0.42, tol: 0.005, stellen: 2,
        falsch: [{ wert: t4b / 69879, id: "durchschnitt", text: "Das ist der Durchschnittssteuersatz: die ganze Steuer geteilt durch das ganze Einkommen. Gefragt ist, um wie viel T(x) wächst, wenn x um 1 € wächst." }],
      }],
      tipps: ["T(x + 1) − T(x) in der linearen Zone."],
      loesung: "T(x + 1) − T(x) = 0,42 · (x + 1) − 0,42 · x = 0,42 € — vom zusätzlichen Euro bleiben 58 Cent.",
    },
    {
      phase: 4,
      frage: `Der Durchschnittssteuersatz ist d(x) = ${bruch("T(x)", "x")}. Gegen welchen Wert strebt er für x → ∞ (Zone mit 45 %)? Gib ihn in Prozent an.`,
      felder: [{
        id: "limes", label: "lim d(x) =", einheit: "%", soll: 45, tol: 0.05, stellen: 0,
        falsch: [
          { wert: 42, id: "42", text: "42 % gelten nur bis 277.825 €. Für x → ∞ ist die Zone mit 45 % maßgeblich." },
          { wert: 0, id: "null", text: "Geteilt durch x geht nur der hintere Teil −19.470,38/x gegen 0 — der vordere Teil 0,45 · x/x bleibt 0,45." },
        ],
      }],
      tipps: [`d(x) = ${bruch("0,45x − 19.470,38", "x")} = 0,45 − ${bruch("19.470,38", "x")}.`],
      loesung: `d(x) = 0,45 − ${bruch("19.470,38", "x")} → 0,45 = 45 % für x → ∞ — erreicht wird dieser Wert nie.`,
      deutung: "Selbst bei Millionen-Einkommen zahlt niemand 45 % auf das ganze Einkommen — nur auf jeden Euro oberhalb der Grenze.",
    },
  ],
  urteil: {
    optionen: [
      { text: "Stimmt: Ab 69.879 € werden alle Euro mit 42 % besteuert, also auch die darunter.", erklaerung: "Nein — 42 % gelten nur für jeden Euro oberhalb der Grenze. Das zeigt die Formel 0,42 · x − 11.135,63: Der Abzug sorgt dafür, dass die Steuer an der Grenze nicht springt." },
      { text: "Stimmt nicht: Über 69.878 € sinkt die Steuer sogar ein bisschen.", erklaerung: "Die Steuer sinkt nicht; sie wächst an der Grenze nur stetig weiter — um knapp 50 Cent für den einen Euro mehr." },
      { text: "Stimmt nicht: Der Tarif ist an der Grenze stetig. Die Steuer steigt um Cent-Beträge weiter, jeder zusätzliche Euro wird mit 42 % besteuert — netto bleibt immer mehr übrig.", richtig: true, erklaerung: `Genau. Linke und rechte Formel liefern an der Nahtstelle bis auf ${n(sprung * 100, 0)} Cent dasselbe. Wer mehr verdient, behält von jedem zusätzlichen Euro 58 Cent. Ein „Tarifsprung“, der das Netto senkt, ist in einem stetigen Tarif unmöglich.` },
      { text: "Stimmt nur bei Ledigen, bei Verheirateten nicht.", erklaerung: "Beim Ehegattensplitting wird derselbe Tarif auf das halbe gemeinsame Einkommen angewendet — er bleibt genauso stetig." },
    ],
  },
  merksatz: `<p>Eine abschnittsweise definierte Funktion ist an einer Nahtstelle stetig, wenn die Formeln beider Abschnitte dort denselben Wert liefern. Ein stetiger Steuertarif heißt: Ein Euro mehr Einkommen bringt nur wenig mehr Steuer — nie einen Sprung. Der Durchschnittssteuersatz strebt für x → ∞ gegen 45 %, erreicht ihn aber nie.</p>`,
  denkfrage: "Das Gesetz rundet die Steuer auf volle Euro ab. Streng genommen ist der echte Tarif damit gar nicht stetig. Warum stört das niemanden?",
  musterantwort: `<p>Die Abrundung erzeugt Sprünge von höchstens einem Euro — viel weniger als der Euro Einkommen, der sie auslöst. Netto kann dadurch nie weniger übrig bleiben. Anders wäre es bei einer Freigrenze ohne Übergang: Beim Solidaritätszuschlag gibt es deshalb eine „Milderungszone“, in der der Zuschlag langsam ansteigt — damit die Funktion stetig bleibt.</p>`,
  knobel: "Bei welchem Einkommen zahlt man im Durchschnitt genau 30 % Steuer?",
  knobelAntwort: `<p>In der Zone mit 42 %: (0,42 · x − 11.135,63)/x = 0,30 ergibt x = 11.135,63/0,12 ≈ ${eur(11135.63 / 0.12)}. Probe: T ≈ ${eur(T4(11135.63 / 0.12))}, das sind 30 %.</p>`,
  partner: "Erklärt euch gegenseitig in einem Satz den Unterschied zwischen Grenzsteuersatz (42 %) und Durchschnittssteuersatz.",
};

// ---------- 1.2 b: Die Wanderung ----------

const s1 = (t) => 2.25 * t + 0.3 * t * (t - 2) * (t - 4);
const s2 = (t) => (t <= 3 ? 9 - 3 * t : 0);
const d = (t) => s1(t) - (9 - 3 * t);
let tStern = 1, tHi = 2;
for (let k = 0; k < 60; k++) { const m = (tStern + tHi) / 2; if (d(m) < 0) tStern = m; else tHi = m; }
const uhr = (h) => { const min = Math.round(h * 60); return `${8 + Math.floor(min / 60)}:${String(min % 60).padStart(2, "0")}`; };

const wanderung = {
  key: "wanderung",
  nr: "1.2 b",
  kapitel: "1.2",
  kurs: "gk",
  icon: "🥾",
  titel: "Hin und zurück auf dem Rheinsteig",
  behauptung: "„Wenn du einen Weg am Samstag hinaufgehst und am Sonntag denselben Weg wieder hinunter, gibt es garantiert eine Stelle, an der du an beiden Tagen zur selben Uhrzeit warst — egal, wie schnell du gehst.“",
  herkunft: "Rätsel aus einem Wander-Forum",
  hintergrund: `<p>Lena wandert am Samstag um 8:00 Uhr vom Parkplatz zur Hütte, 9 km bergauf, und kommt um 12:00 Uhr an. Am Sonntag geht sie um 8:00 Uhr denselben Weg zurück und ist schon um 11:00 Uhr am Parkplatz. Ihre Wander-App hat beide Tage aufgezeichnet. Das Rätsel ist alt — es wird dem Psychologen Karl Duncker zugeschrieben, der damit untersuchte, wie Menschen Probleme lösen.</p>`,
  modell: `<p>Weg vom Parkplatz in km, t in Stunden nach 8:00 Uhr:</p>
    <ul>
      <li>Samstag: s<sub>1</sub>(t) = 2,25t + 0,3t · (t − 2) · (t − 4), 0 ≤ t ≤ 4 (bergauf, in der Mitte langsamer)</li>
      <li>Sonntag: s<sub>2</sub>(t) = 9 − 3t, 0 ≤ t ≤ 3 (gleichmäßig bergab)</li>
    </ul>
    <p>Gesucht ist ein Zeitpunkt t mit s<sub>1</sub>(t) = s<sub>2</sub>(t), also eine Nullstelle von d(t) = s<sub>1</sub>(t) − s<sub>2</sub>(t).</p>`,
  figur: {
    titel: "Weg vom Parkplatz am Samstag und am Sonntag",
    x: { von: 0, bis: 4, schritt: 0.5, titel: "Uhrzeit", zahl: (v) => uhr(v) },
    y: { von: 0, bis: 9, schritt: 1, titel: "Weg vom Parkplatz in km" },
    kurven: [
      { f: s1, von: 0, bis: 4, farbe: "blau", rolle: "samstag" },
      { f: s2, von: 0, bis: 4, farbe: "orange", rolle: "sonntag" },
    ],
    legende: [{ farbe: "blau", text: "Samstag (bergauf)" }, { farbe: "orange", text: "Sonntag (bergab, ab 11 Uhr am Parkplatz)" }],
  },
  rueckblick: `<p>Der Zwischenwertsatz: Eine stetige Funktion, die an einer Stelle negativ und an einer anderen positiv ist, hat dazwischen eine Nullstelle. Wie findet man sie näherungsweise? Nachlesen: <a href="${L12}#sec-zwischenwert">1.2, Abschnitt 6</a>.</p>`,
  werkzeug: `<ul>
      <li>Zwischenwertsatz: f stetig auf [a; b], f(a) &lt; 0 &lt; f(b) ⟹ es gibt ein c dazwischen mit f(c) = 0 (<a href="${L12}#sec-zwischenwert">1.2, Abschnitt 6</a>).</li>
      <li>Intervallhalbierung: Mitte m berechnen, f(m) prüfen, mit der Hälfte weitermachen, in der das Vorzeichen wechselt. Nach k Schritten ist das Intervall 2<sup>k</sup>-mal kürzer.</li>
    </ul>`,
  kernfrage: "Entscheidend ist: Hat d(t) = s₁(t) − s₂(t) sicher eine Nullstelle — und wann ungefähr liegt sie?",
  schritte: [
    {
      phase: 2,
      frage: "Berechne d(0) und d(3).",
      felder: [
        { id: "d0", label: "d(0) =", einheit: "km", soll: d(0), tol: 0.01, stellen: 2, falsch: [{ wert: 9, id: "d0-plus", text: "d(t) = s₁(t) − s₂(t). Um 8 Uhr ist Lena samstags am Parkplatz (0 km) und sonntags an der Hütte (9 km): 0 − 9." }] },
        { id: "d3", label: "d(3) =", einheit: "km", soll: d(3), tol: 0.01, stellen: 2, falsch: [] },
      ],
      tipps: ["s₁(0) = 0 und s₂(0) = 9.", "s₁(3) = 6,75 + 0,3 · 3 · 1 · (−1), s₂(3) = 0."],
      loesung: `d(0) = 0 − 9 = −9; d(3) = s₁(3) − 0 = ${n(d(3), 2)}`,
      deutung: "Um 8 Uhr ist der Samstags-Weg „hinter“ dem Sonntags-Weg, um 11 Uhr „vor“ ihm. Da d stetig ist, muss es dazwischen eine Nullstelle geben.",
    },
    {
      phase: 3,
      frage: "Im Intervall [1; 2] wechselt d das Vorzeichen (d(1) = −2,85, d(2) = 1,5). Halbiere: Berechne d(1,5) und d(1,75).",
      felder: [
        { id: "d15", label: "d(1,5) =", einheit: "km", soll: d(1.5), tol: 0.005, stellen: 4, falsch: [] },
        { id: "d175", label: "d(1,75) =", einheit: "km", soll: d(1.75), tol: 0.005, stellen: 4, falsch: [] },
      ],
      tipps: ["d(t) = 0,3t³ − 1,8t² + 7,65t − 9 (ausmultipliziert).", "d(1,5) = 0,3 · 3,375 − 1,8 · 2,25 + 7,65 · 1,5 − 9."],
      loesung: `d(t) = 0,3t³ − 1,8t² + 7,65t − 9; d(1,5) = ${n(d(1.5), 4)}, d(1,75) ≈ ${n(d(1.75), 4)} — die Nullstelle liegt also in [1,5; 1,75].`,
    },
    {
      phase: 3,
      frage: "Wie viele Halbierungen braucht man, ausgehend von [1; 2] (eine Stunde breit), bis das Intervall kürzer als eine Minute ist?",
      felder: [{
        id: "k", label: "Anzahl Halbierungen:", einheit: "", soll: 6, tol: 0.01, stellen: 0,
        falsch: [
          { wert: 5, id: "fuenf", text: "Nach 5 Halbierungen ist das Intervall 60/32 ≈ 1,9 Minuten breit — noch zu lang." },
          { wert: 60, id: "sechzig", text: "Halbieren ist viel schneller als Minute für Minute: Jede Halbierung teilt die Breite durch 2." },
        ],
      }],
      tipps: ["Nach k Halbierungen ist das Intervall 60/2<sup>k</sup> Minuten breit.", "Gesucht ist das kleinste k mit 2<sup>k</sup> &gt; 60."],
      loesung: "2⁵ = 32 &lt; 60 &lt; 64 = 2⁶, also 6 Halbierungen (Breite 60/64 ≈ 0,94 Minuten).",
    },
    {
      phase: 4,
      kern: true,
      frage: "Führe die Intervallhalbierung zu Ende (oder lies am Graphen ab und prüfe mit d). Um wie viel Uhr war Lena an beiden Tagen an derselben Stelle? Gib die Minuten nach 8:00 Uhr an.",
      felder: [{
        id: "min", label: "Minuten nach 8:00 Uhr:", einheit: "min", soll: tStern * 60, tol: 1, stellen: 0,
        falsch: [{ wert: 90, id: "mitte", text: "Bei 90 Minuten (t = 1,5) ist d(1,5) noch negativ: Lena war samstags noch nicht so weit wie sonntags. Die Nullstelle liegt etwas später." }],
      }],
      tipps: ["Nach [1,5; 1,75] kommt d(1,625) ≈ −0,035 — die Nullstelle liegt in [1,625; 1,75].", "Weiter halbieren: d(1,6875)?"],
      loesung: `Die Nullstelle liegt bei t ≈ ${n(tStern, 3)} h, also etwa ${n(tStern * 60, 0)} Minuten nach 8 Uhr: um ${uhr(tStern)} Uhr, bei Kilometer ${n(9 - 3 * tStern, 1)}.`,
      deutung: `Um ${uhr(tStern)} Uhr war Lena an beiden Tagen bei Kilometer ${n(9 - 3 * tStern, 1)}.`,
    },
  ],
  urteil: {
    optionen: [
      { text: "Stimmt nur, wenn Lena an beiden Tagen gleich schnell geht.", erklaerung: "Die Geschwindigkeiten spielen keine Rolle: Hier ist Lena sonntags deutlich schneller, und trotzdem gibt es die Stelle." },
      { text: "Stimmt — für jeden stetigen Verlauf: d = s₁ − s₂ ist zuerst negativ und später positiv, also hat d nach dem Zwischenwertsatz eine Nullstelle.", richtig: true, erklaerung: `Richtig. Das Modell liefert ${uhr(tStern)} Uhr, aber das Argument braucht gar kein Modell: Es genügt, dass beide Wege stetig sind (niemand wird teleportiert) und sich die Reihenfolge der beiden Positionen umkehrt. Stellt man sich zwei Wanderer am selben Tag vor, die sich entgegenkommen, ist es sogar offensichtlich — sie müssen sich treffen.` },
      { text: "Stimmt nicht: Weil Lena sonntags schneller ist, kann sie nie zur selben Zeit an derselben Stelle gewesen sein.", erklaerung: `Doch: Die Rechnung zeigt den Zeitpunkt ${uhr(tStern)} Uhr. Gerade weil sie sonntags von oben kommt, kreuzen sich die beiden Wege.` },
      { text: "Stimmt nur, wenn Lena unterwegs keine Pause macht.", erklaerung: "Pausen schaden nicht: Eine Pause ist ein waagerechtes Stück des Graphen, die Funktion bleibt stetig. Nur Sprünge würden das Argument zerstören." },
    ],
  },
  merksatz: `<p>Zwischenwertsatz: Wechselt eine stetige Funktion d auf [a; b] das Vorzeichen, hat sie dort eine Nullstelle. Die Intervallhalbierung findet sie: Jeder Schritt halbiert die Unsicherheit — nach k Schritten ist das Intervall 2<sup>k</sup>-mal kürzer.</p>`,
  denkfrage: "Warum braucht der Beweis die Stetigkeit? Erfinde eine Situation, in der die Behauptung falsch wäre.",
  musterantwort: "<p>Würde Lena am Samstag einen Teil des Weges mit der Seilbahn fahren, „springt“ s₁ — und die beiden Graphen könnten sich genau während dieses Sprungs kreuzen, ohne dass es einen gemeinsamen Punkt gibt. Bei Fußwegen ist die Position stetig: Wer von 2 km nach 5 km kommt, war zwischendurch an jeder Stelle dazwischen.</p>",
  knobel: "Lena macht am Sonntag um 9 Uhr eine halbe Stunde Pause. Gibt es dann immer noch eine solche Stelle — und kann es sogar mehrere geben?",
  knobelAntwort: "<p>Es gibt sie immer noch: d bleibt stetig, und das Vorzeichen wechselt weiterhin von negativ nach positiv. Mehrere solche Stellen sind möglich, wenn die Graphen sich mehrmals kreuzen — etwa, wenn Lena am Sonntag ein Stück zurückgeht, weil sie etwas vergessen hat. Garantiert ist nur mindestens eine.</p>",
  partner: "Erklärt einem Mitschüler, der das Rätsel nicht kennt, in zwei Sätzen, warum es diese Stelle geben muss — ohne eine einzige Rechnung.",
};

export const FAELLE_1 = [fruehstart, koffeinFall, steuer, wanderung];
