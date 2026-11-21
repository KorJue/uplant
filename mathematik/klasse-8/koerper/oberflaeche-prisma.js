// Selbstlernpfad „Oberflächeninhalt von Prismen“ (Klasse 8, Körper, Thema 2).
//
// Reihenfolge — jeder Abschnitt benutzt nur, was vorher da war:
//   1. Der Quader wird aufgeklappt; die Oberfläche ist die Summe der sechs Rechtecke im Netz.
//   2. Nur der Mantel wird abgewickelt: n Rechtecke, zusammen ein Rechteck u × h.
//   3. Das ganze Netz beliebiger Prismen: O = 2 · G + M; G mit den Formeln der Flächeninhalte-Seite.
//   4. Offene Körper: Eine Fläche fehlt und wird nicht gezählt. Am Ende schaut man senkrecht auf das
//      Netz — beim liegenden Körper von oben, beim stehenden von vorn —, damit es in wahrer Größe
//      erscheint.
//
// Alle Zahlen kommen aus den Reglerwerten und den festen Maßen der Grundflächen, nie aus dem Bild.
// Farben: Grund- und Deckfläche blau, Seitenflächen orange, Höhe violett, Fehlendes rot.
// Die Übungsaufgaben stehen in oberflaeche-prisma-aufgaben.js.

import { flaeche, zeige, num, reglerZahl, setzeText, setzeHtml, wahl, mountQuizze, mountUebungsaufgaben } from "./seite.js?v=1";
import * as R from "./raum.js?v=1";
import { AUFGABEN } from "./oberflaeche-prisma-aufgaben.js?v=1";

const W = 640;
const KAV = R.kavalier();
const prozent = (t) => `${Math.round(t * 100)} %`;
const netzTeile = (t) => [Math.min(1, t / 0.4), Math.max(0, (t - 0.4) / 0.6)];
const mitKlassen = (fl, zusatz = "", fehlt = () => false) => fl.map((f) => ({
  ...f,
  klasse: fehlt(f) ? "kp-fehlt" : (f.rolle === "seite" ? "kp-m" : "kp-g") + zusatz,
  daten: { "data-rolle": f.rolle, ...(f.nr !== undefined ? { "data-nr": String(f.nr) } : {}), ...(fehlt(f) ? { "data-fehlt": "1" } : {}) },
}));
const rechteckGrund = (a, b) => [[0, 0], [a, 0], [a, b], [0, b]];
const summe = (xs) => xs.reduce((s, x) => s + x, 0);

// Grundflächen mit ihrem Flächeninhalt — gerechnet wie auf der Flächeninhalte-Seite, in Worten.
const G_RECHNUNG = {
  "dreieck-rw": { text: "½ · 4 cm · 3 cm (rechtwinklig: die Katheten sind Grundseite und Höhe)", wert: 6 },
  "dreieck-gs": { text: "½ · g · h<sub>g</sub> = ½ · 6 cm · 4 cm", wert: 12 },
  trapez: { text: "(a + c) : 2 · h<sub>T</sub> = (8 cm + 2 cm) : 2 · 4 cm", wert: 20 },
  haus: { text: "Rechteck + Dreieck = 6 cm · 3 cm + ½ · 6 cm · 4 cm", wert: 30 },
  sechseck: { text: "Rechteck + 2 Dreiecke = 3 cm · 4 cm + 2 · ½ · 4 cm · 1,5 cm", wert: 18 },
};

// ================= 1. Der Quader =================

const QD_MAX = { a: 7, b: 4, c: 4 };

function renderQuader() {
  const a = reglerZahl("qd-a"), b = reglerZahl("qd-b"), c = reglerZahl("qd-c");
  const t = reglerZahl("qd-t") / 100;
  setzeText("qd-a-anzeige", `${a} cm`);
  setzeText("qd-b-anzeige", `${b} cm`);
  setzeText("qd-c-anzeige", `${c} cm`);
  setzeText("qd-t-anzeige", prozent(t));
  // Fester Rahmen: Bühne für den größten Quader und den ganzen Weg — so ändert sich der Maßstab
  // nicht, und ein größerer Quader sieht größer aus.
  const spur = [];
  for (let k = 0; k <= 20; k++) R.prismaNetz(rechteckGrund(QD_MAX.a, QD_MAX.b), QD_MAX.c, ...netzTeile(k / 20)).forEach((f) => spur.push(...f.pts));
  const bu = R.buehne(KAV, spur, { breite: W, maxHoehe: 440, s0: 28 });
  const svg = flaeche(W, bu.hoehe, `Netz eines Quaders ${a} cm × ${b} cm × ${c} cm`);
  const grund = rechteckGrund(a, b);
  if (t === 0) R.zeichneKoerper(svg, bu, mitKlassen(R.prismaFlaechen(grund, c), " kp-flaeche"));
  else {
    const fl = R.prismaNetz(grund, c, ...netzTeile(t));
    R.zeichneFlaechen(svg, bu, mitKlassen(fl));
    if (t === 1) fl.forEach((f) => {
      const A = R.flaecheRaum(f.pts);
      R.text(svg, bu, R.mitte(f.pts), `${num(A)} cm²`, "kp-text-klein", 0, 4, "middle", { "data-rolle": "flaeche-text" });
    });
  }
  zeige("qd-mount", svg);
  const ab = a * b, ac = a * c, bc = b * c, O = 2 * ab + 2 * ac + 2 * bc;
  setzeHtml("qd-bilanz",
    `Boden und Deckel: <span class="wc">2 · ${a} cm · ${b} cm = 2 · ${ab} cm²</span><br>` +
    `vorn und hinten: <span class="wb">2 · ${a} cm · ${c} cm = 2 · ${ac} cm²</span>; links und rechts: <span class="wb">2 · ${b} cm · ${c} cm = 2 · ${bc} cm²</span><br>` +
    `<span class="wa">O = ${2 * ab} cm² + ${2 * ac} cm² + ${2 * bc} cm² = <strong data-rolle="O">${num(O)}</strong> cm²</span>`);
  setzeText("qd-text", t === 0
    ? "Ein Quader hat sechs rechteckige Flächen. Klapp ihn auf, um sie nebeneinander zu sehen."
    : t < 1
      ? "Die Flächen klappen in die Ebene — keine wird größer oder kleiner."
      : `Das Netz besteht aus drei Paaren gleicher Rechtecke: ${ab} cm², ${ac} cm² und ${bc} cm², jedes zweimal. Zusammen ${num(O)} cm² — das ist die Oberfläche.`);
}

// ================= 2. Der Mantel =================

const MT_HMAX = 5;

function renderMantel() {
  const key = wahl("mt-form"), F = R.FORMEN[key];
  const h = reglerZahl("mt-h"), t = reglerZahl("mt-t") / 100;
  setzeText("mt-h-anzeige", `${h} cm`);
  setzeText("mt-t-anzeige", prozent(t));
  const L = R.seitenlaengen(F.grund), u = summe(L);
  const nurMantel = (hh, tt) => R.prismaNetz(F.grund, hh, 0, tt).filter((f) => f.rolle === "seite");
  const spur = [];
  for (let k = 0; k <= 20; k++) nurMantel(MT_HMAX, k / 20).forEach((f) => spur.push(...f.pts));
  const bu = R.buehne(KAV, spur, { breite: W, maxHoehe: 360, s0: 28, extra: { links: 70, unten: 46 } });
  const svg = flaeche(W, bu.hoehe, `Mantel eines ${F.koerper}s`);
  const fl = nurMantel(h, t);
  R.zeichneFlaechen(svg, bu, mitKlassen(fl));
  if (t === 1) {
    fl.forEach((f) => R.text(svg, bu, [(f.pts[0][0] + f.pts[1][0]) / 2, 0, 0], `${num(L[f.nr])} cm`, "kp-t-m kp-text-klein", 0, -8, "middle", { "data-rolle": "seite-text", "data-nr": String(f.nr) }));
    const x0 = Math.min(...fl.map((f) => f.pts[0][0])), x1 = Math.max(...fl.map((f) => f.pts[1][0]));
    R.text(svg, bu, [x0, h / 2, 0], `h = ${h} cm`, "kp-t-h", -8, 4, "end", { "data-rolle": "h-text" });
    // Unter dem Streifen: seine Länge, der Umfang.
    R.strecke(svg, bu, [x0, -0.35, 0], [x1, -0.35, 0], "kp-hilfe", { "data-rolle": "u-linie" });
    R.text(svg, bu, [(x0 + x1) / 2, -0.35, 0], `u = ${num(u)} cm`, "kp-t-g", 0, 20, "middle", { "data-rolle": "u-text" });
  }
  zeige("mt-mount", svg);
  setzeHtml("mt-bilanz",
    `Seitenflächen: ${L.map((l) => `${num(l)} cm · ${h} cm`).join(" + ")}<br>` +
    `= (${L.map(num).join(" + ")}) cm · ${h} cm = <span class="wc">u</span> · <span class="wr">h</span> = <strong data-rolle="u">${num(u)}</strong> cm · ${h} cm<br>` +
    `<span class="wa">M = <strong data-rolle="M">${num(u * h)}</strong> cm²</span>`);
  setzeText("mt-text", t === 0
    ? `Der Mantel des ${F.koerper}s besteht aus ${L.length} Rechtecken — hier ohne Grund- und Deckfläche. Wickle ihn ab.`
    : t < 1
      ? "Die Rechtecke klappen um ihre senkrechten Kanten in eine Ebene."
      : `Ein einziges Rechteck: ${num(u)} cm lang — so lang wie der Umfang der Grundfläche — und ${h} cm hoch. Statt jede Seitenfläche einzeln zu berechnen, reicht M = u · h = ${num(u * h)} cm².`);
}

// ================= 3. O = 2G + M =================

const FO_HMAX = 5;

function renderFormel() {
  const key = wahl("fo-form"), F = R.FORMEN[key];
  const h = reglerZahl("fo-h"), t = reglerZahl("fo-t") / 100;
  setzeText("fo-h-anzeige", `${h} cm`);
  setzeText("fo-t-anzeige", prozent(t));
  const L = R.seitenlaengen(F.grund), u = summe(L);
  const G = G_RECHNUNG[key].wert;
  const spur = [];
  for (let k = 0; k <= 20; k++) R.prismaNetz(F.grund, FO_HMAX, ...netzTeile(k / 20)).forEach((f) => spur.push(...f.pts));
  const bu = R.buehne(KAV, spur, { breite: W, maxHoehe: 460, s0: 24, extra: { links: 70 } });
  const svg = flaeche(W, bu.hoehe, `Netz eines ${F.koerper}s`);
  if (t === 0) R.zeichneKoerper(svg, bu, mitKlassen(R.prismaFlaechen(F.grund, h), " kp-flaeche"));
  else {
    const fl = R.prismaNetz(F.grund, h, ...netzTeile(t));
    R.zeichneFlaechen(svg, bu, mitKlassen(fl));
    if (t === 1) {
      fl.filter((f) => f.rolle !== "seite").forEach((f) => R.text(svg, bu, R.mitte(f.pts), `G = ${num(G)} cm²`, "kp-t-g kp-text-klein", 0, 4, "middle", { "data-rolle": "g-text" }));
      fl.filter((f) => f.rolle === "seite").forEach((f) => R.text(svg, bu, [(f.pts[0][0] + f.pts[1][0]) / 2, 0, 0], `${num(L[f.nr])} cm`, "kp-t-m kp-text-klein", 0, -8, "middle", { "data-rolle": "seite-text", "data-nr": String(f.nr) }));
      const x0 = Math.min(...fl.filter((f) => f.rolle === "seite").map((f) => f.pts[0][0]));
      R.text(svg, bu, [x0, h / 2, 0], `h = ${h} cm`, "kp-t-h", -8, 4, "end", { "data-rolle": "h-text" });
    }
  }
  zeige("fo-mount", svg);
  const M = u * h, O = 2 * G + M;
  setzeHtml("fo-bilanz",
    `Grundfläche (${F.name}): <span class="wc">G = ${G_RECHNUNG[key].text} = <strong data-rolle="G">${num(G)}</strong> cm²</span><br>` +
    `Mantel: <span class="wb">M = u · h = ${num(u)} cm · ${h} cm = <strong data-rolle="M">${num(M)}</strong> cm²</span><br>` +
    `<span class="wa">O = 2 · G + M = 2 · ${num(G)} cm² + ${num(M)} cm² = <strong data-rolle="O">${num(O)}</strong> cm²</span>`);
  setzeText("fo-text", t < 1
    ? `Klapp das ${F.koerper} ganz auf: Dann siehst du die beiden gleichen Grundflächen und den Mantel nebeneinander.`
    : `Zweimal die Grundfläche (je ${num(G)} cm²) und ein Mantel von ${num(u)} cm × ${h} cm: O = ${num(O)} cm².`);
}

// ================= 4. Offene Körper =================

// Liegende Körper liegen auf ihrer Seitenfläche 0; ihr Netz wird auf den Boden geklappt. Die Maße sind
// glatt; die schrägen Seiten gehören zu Dreiecken 1,5 – 2 – 2,5.
const DINGE = {
  schachtel: { name: "Schachtel ohne Deckel", grund: rechteckGrund(6, 4), h: 3, einheit: "cm", liegt: false, fehlt: (f) => f.rolle === "deckel", fehltText: "der Deckel", weg: (G) => G },
  zelt: { name: "Zelt ohne Boden", grund: [[0, 0], [3, 0], [1.5, 2]], h: 4, einheit: "m", liegt: true, fehlt: (f) => f.rolle === "seite" && f.nr === 0, fehltText: "der Boden (eine Seitenfläche)", weg: (G, L, h) => L[0] * h },
  trog: { name: "Trog, oben offen", grund: [[1.5, 0], [4.5, 0], [6, 2], [0, 2]], h: 8, einheit: "dm", liegt: true, fehlt: (f) => f.rolle === "seite" && f.nr === 2, fehltText: "die obere Seitenfläche", weg: (G, L, h) => L[2] * h },
};
// Blick schräg von rechts oben (30° hoch, 25° seitlich); beim Aufklappen dreht er sich, bis man
// senkrecht auf das Netz schaut — beim stehenden Körper von vorn (0°), beim liegenden von oben (90°).
const anKamera = (d, t) => R.ansicht(30 + (d.liegt ? 60 : -30) * t, -25 * (1 - t));
function anFlaechen(d, t) {
  const fl = t === 0 ? R.prismaFlaechen(d.grund, d.h) : R.prismaNetz(d.grund, d.h, ...netzTeile(t));
  return d.liegt ? fl.map((f) => ({ ...f, pts: R.kippe(f.pts, 1) })) : fl;
}

function renderAnwenden() {
  const d = DINGE[wahl("an-ding")];
  const t = reglerZahl("an-t") / 100;
  setzeText("an-t-anzeige", prozent(t));
  const e = d.einheit;
  // Die Bühne über alle Stellungen — jede mit ihrem eigenen Blickwinkel ins Bild gebracht.
  const spur = [];
  for (let k = 0; k <= 20; k++) {
    const kam = anKamera(d, k / 20);
    anFlaechen(d, k / 20).forEach((f) => f.pts.forEach((p) => spur.push(kam.bild(p))));
  }
  const kam = anKamera(d, t);
  const bu = R.buehne(kam, spur, { breite: W, maxHoehe: 420, s0: d.einheit === "cm" ? 30 : d.einheit === "dm" ? 22 : 44 });
  const svg = flaeche(W, bu.hoehe, d.name);
  const fl = anFlaechen(d, t);
  // Der Körper ist offen: Durch die Öffnung sieht man die Innenseiten. Deshalb wird von hinten nach
  // vorn gemalt (nicht nur die zugewandten Flächen), und die fehlende Fläche kommt als rot
  // gestrichelter Umriss obenauf.
  R.zeichneFlaechen(svg, bu, mitKlassen(fl.filter((f) => !d.fehlt(f))));
  mitKlassen(fl.filter(d.fehlt), "", () => true).forEach((f) => R.vieleck(svg, bu, f.pts, f.klasse, f.daten));
  if (t === 1) fl.forEach((f) => {
    const A = R.flaecheRaum(f.pts);
    R.text(svg, bu, R.mitte(f.pts), d.fehlt(f) ? "fehlt" : `${num(A)} ${e}²`, d.fehlt(f) ? "kp-t-r kp-text-klein" : "kp-text-klein", 0, 4, "middle", { "data-rolle": "flaeche-text" });
  });
  zeige("an-mount", svg);

  const L = R.seitenlaengen(d.grund), u = summe(L), G = R.flaecheEben(d.grund), M = u * d.h;
  const voll = 2 * G + M;
  const weg = d.weg(G, L, d.h);
  const O = voll - weg;
  setzeHtml("an-bilanz",
    `Alle Flächen: 2 · G + M = 2 · ${num(G)} ${e}² + ${num(u)} ${e} · ${d.h} ${e} = ${num(voll)} ${e}²<br>` +
    `Es fehlt ${d.fehltText}: <span class="wg">− ${num(weg)} ${e}²</span><br>` +
    `<span class="wa">O = ${num(voll)} ${e}² − ${num(weg)} ${e}² = <strong data-rolle="O">${num(O)}</strong> ${e}²</span>` +
    (e === "m" ? ` = ${num(O * 100)} dm²` : e === "dm" ? ` = ${num(O / 100)} m²` : ` = ${num(O / 100)} dm²`));
  setzeText("an-text", t === 0
    ? `${d.name}: Rot gestrichelt ist, was fehlt — ${d.fehltText}.`
    : t < 1
      ? "Das Netz klappt auf; der Blick dreht sich mit, bis du senkrecht auf das Netz schaust."
      : `Im Netz fehlt ${d.fehltText}. Gezählt werden nur die vorhandenen Flächen: ${num(O)} ${e}².`);
}

// ================= Kontrollfragen =================

mountQuizze({
  "quiz-netzflaeche": {
    q: "Ein Würfel hat die Kantenlänge 3 cm. Wie groß ist seine Oberfläche?",
    options: ["27 cm²", "36 cm²", "54 cm²", "18 cm²"],
    correct: 2,
    explain: "Ein Würfel hat sechs gleiche Quadrate mit je 3 cm · 3 cm = 9 cm². O = 6 · 9 cm² = 54 cm². 27 wäre 3 · 3 · 3 — das ist das Volumen in cm³, keine Fläche.",
  },
  "quiz-mantel": {
    q: "Ein Prisma hat ein Dreieck mit den Seiten 3 cm, 4 cm und 5 cm als Grundfläche und ist 10 cm hoch. Wie groß ist sein Mantel?",
    options: ["60 cm²", "120 cm²", "50 cm²", "126 cm²"],
    correct: 1,
    explain: "Der Mantel ist ein Rechteck aus den drei Seitenflächen: so lang wie der Umfang u = 3 cm + 4 cm + 5 cm = 12 cm und 10 cm hoch. M = 12 cm · 10 cm = 120 cm². Grund- und Deckfläche gehören nicht zum Mantel.",
  },
  "quiz-formel": {
    q: "Ein Trapezprisma hat G = 20 cm², den Umfang u = 20 cm und die Höhe h = 5 cm. Wie groß ist seine Oberfläche?",
    options: ["120 cm²", "100 cm²", "200 cm²", "140 cm²"],
    correct: 3,
    explain: "O = 2 · G + u · h = 2 · 20 cm² + 20 cm · 5 cm = 40 cm² + 100 cm² = 140 cm². Mit nur einer Grundfläche käme 120 cm² heraus, der Mantel allein ist 100 cm².",
  },
  "quiz-anwenden": {
    q: "Eine Schachtel ohne Deckel hat einen Boden von 5 cm × 4 cm und ist 3 cm hoch. Wie viel Pappe braucht sie (ohne Klebefalze)?",
    options: ["74 cm²", "94 cm²", "54 cm²", "60 cm²"],
    correct: 0,
    explain: "Boden 5 cm · 4 cm = 20 cm², Mantel (5 + 4 + 5 + 4) cm · 3 cm = 54 cm². Der Deckel fehlt: O = 20 cm² + 54 cm² = 74 cm². Mit Deckel wären es 94 cm².",
  },
});

// ================= Verdrahten =================

["qd-a", "qd-b", "qd-c", "qd-t"].forEach((id) => document.getElementById(id).addEventListener("input", renderQuader));
["mt-form", "mt-h", "mt-t"].forEach((id) => document.getElementById(id).addEventListener("input", renderMantel));
["fo-form", "fo-h", "fo-t"].forEach((id) => document.getElementById(id).addEventListener("input", renderFormel));
["an-ding", "an-t"].forEach((id) => document.getElementById(id).addEventListener("input", renderAnwenden));
renderQuader();
renderMantel();
renderFormel();
renderAnwenden();

mountUebungsaufgaben(document.getElementById("exercises-mount"), AUFGABEN);
