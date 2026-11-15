// Selbstlernpfad „Terme mit Klammern multiplizieren“ (Klasse 8, Terme, Thema 4).
//
// Reihenfolge — jeder Abschnitt benutzt nur, was vorher da war:
//   1. Summe mal Summe am Rechteck: (m x + a) · (x + b) aus Kacheln. Rechte Spalten und untere Zeilen
//      rücken starr ab; übrig bleiben vier Rechtecke — die vier Produkte.
//   2. Jedes Glied mit jedem, für alle Vorzeichen, in Schritten. Gerechnet wird mit termwerk.js, nicht
//      abgeschrieben: Die Produkte und ihre Summe entstehen aus den Gliedern.
//   3. Mehr als zwei Faktoren: schrittweise, das Zwischenergebnis in Klammern.
//   4. Flächenänderung: Quadrat x · x gegen Rechteck (x + a) · (x − b), maßstäblich gezeichnet.
// Die binomischen Formeln kommen erst in Thema 5; hier wird jedes Produkt ausgerechnet.
//
// Farben wie in den Themen 2 und 3: x² blau, x violett, Einer grün; Hilfslinien grau.
// Die Übungsaufgaben stehen in klammern-multiplizieren-aufgaben.js.

import { svgEl, svgText, el, flaeche, zeige, num, reglerZahl, begrenzt, setzeText, setzeHtml, wahl, mountQuizze, mountUebungsaufgaben } from "./seite.js?v=1";
import * as T from "./termwerk.js?v=1";
import { AUFGABEN } from "./klammern-multiplizieren-aufgaben.js?v=1";

const VARS = ["x", "y", "a", "b"];
const P = (t) => T.P(t, VARS);
const txt = (p) => T.text(p, { reihenfolge: VARS });
const glied = (k, v) => (v === "" ? num(k) : (k === 1 ? "" : k === -1 ? "−" : num(k)) + v);
// Mehrere Glieder hintereinander, das Vorzeichen jeweils als Rechenzeichen.
const summe = (texte) => texte.map((t, i) => (i === 0 ? t : t.startsWith("−") ? " − " + t.slice(1) : " + " + t)).join("");
const inKlammer = (t) => (t.startsWith("−") ? `(${t})` : t);
function rechteck(x, y, w, h, klasse, daten = {}) {
  const g = svgEl("g", { "data-rolle": "kachel", ...daten });
  g.appendChild(svgEl("rect", { x: x.toFixed(2), y: y.toFixed(2), width: w.toFixed(2), height: h.toFixed(2), rx: 1.5, class: klasse }));
  return g;
}

// ================= 1. Summe mal Summe am Rechteck =================

const RE_U = 20, RE_LX = 74;     // wie in Thema 3: Einer und x-Länge
const RE_W = 680, RE_H = 270;
const RE_Y = 40;
const RE_SPALT = 36;             // so weit rücken die Einerspalten nach rechts und die Einerzeilen nach unten

function renderRechteck() {
  const m = reglerZahl("re-m"), a = reglerZahl("re-a"), b = reglerZahl("re-b");
  const t = reglerZahl("re-t") / 100;
  setzeText("re-m-anzeige", String(m));
  setzeText("re-a-anzeige", String(a));
  setzeText("re-b-anzeige", String(b));
  setzeText("re-t-anzeige", Math.round(t * 100) + " %");
  const breite = `${glied(m, "x")} + ${a}`, hoehe = `x + ${b}`;
  const x0 = Math.round((RE_W - (m * RE_LX + a * RE_U + RE_SPALT)) / 2) + 20;
  const xr = x0 + m * RE_LX + RE_SPALT * t;       // linker Rand der Einerspalten
  const yu = RE_Y + RE_LX + RE_SPALT * t;          // Oberkante der Einerzeilen
  const svg = flaeche(RE_W, RE_H, `Rechteck (${breite}) mal (${hoehe})`);
  // Vier Blöcke: oben links x · mx, oben rechts x · a, unten links b · mx, unten rechts b · a.
  const block = (teil, xa, ya, spalten, zeilen, w, h, art) => {
    for (let r = 0; r < zeilen; r++) for (let s = 0; s < spalten; s++) {
      svg.appendChild(rechteck(xa + s * w, ya + r * h, w, h, `tm-kachel tm-kachel-${art}`, { "data-teil": teil, "data-art": art }));
    }
  };
  block("xx", x0, RE_Y, m, 1, RE_LX, RE_LX, "x2");
  block("x1", xr, RE_Y, a, 1, RE_U, RE_LX, "x");
  block("1x", x0, yu, m, b, RE_LX, RE_U, "x");
  block("11", xr, yu, a, b, RE_U, RE_U, "1");
  // Die Seiten wandern mit ihrem Teil.
  svg.appendChild(svgText(x0 + (m * RE_LX) / 2, RE_Y - 10, glied(m, "x"), { class: "tm-label tm-label-x", "data-rolle": "oben-x" }));
  svg.appendChild(svgText(xr + (a * RE_U) / 2, RE_Y - 10, String(a), { class: "tm-label tm-label-1", "data-rolle": "oben-1" }));
  svg.appendChild(svgText(x0 - 12, RE_Y + RE_LX / 2 + 5, "x", { class: "tm-label tm-label-x", "data-rolle": "links-x", "text-anchor": "end" }));
  svg.appendChild(svgText(x0 - 12, yu + (b * RE_U) / 2 + 5, String(b), { class: "tm-label tm-label-1", "data-rolle": "links-1", "text-anchor": "end" }));
  // Die vier Produkte, sobald die Teile getrennt sind — jedes mitten in seinem Block.
  // Als Liste in der Reihenfolge des Ausmultiplizierens — ein Objekt mit dem Schlüssel „11“ stellte
  // diesen als Zahlschlüssel nach vorn.
  const produkte = [
    ["xx", txt(T.mal(P("x"), P(`${m}x`)))], ["x1", txt(P(`${a}x`))], ["1x", txt(P(`${b * m}x`))], ["11", String(a * b)],
  ];
  const produkt = Object.fromEntries(produkte);
  if (t === 1) {
    const mitte = (teil, xa, ya, w, h) => svg.appendChild(svgText(xa + w / 2, ya + h / 2 + 5, produkt[teil], { class: "tm-label tm-label-flaeche", "data-rolle": "produkt", "data-teil": teil }));
    mitte("xx", x0, RE_Y, m * RE_LX, RE_LX);
    mitte("x1", xr, RE_Y, a * RE_U, RE_LX);
    mitte("1x", x0, yu, m * RE_LX, b * RE_U);
    mitte("11", xr, yu, a * RE_U, b * RE_U);
  }
  zeige("re-mount", svg);
  const ergebnis = txt(T.mal(P(`${m}x + ${a}`), P(`x + ${b}`)));
  setzeHtml("re-bilanz", t === 1
    ? `(${breite}) · (${hoehe}) = x · ${glied(m, "x")} + x · ${a} + ${b} · ${glied(m, "x")} + ${b} · ${a} = ${summe(produkte.map((p) => p[1]))} = <strong data-rolle="ergebnis">${ergebnis}</strong>`
    : `(${breite}) · (${hoehe}) — zieh das Rechteck ganz auseinander, dann siehst du die vier Teile.`);
  setzeText("re-text", t === 0
    ? `Das Rechteck ist ${breite} breit und ${hoehe} hoch, zusammen ${(m + a) * (1 + b)} Kacheln.`
    : t < 1
      ? "Die Einerspalten rücken nach rechts, die Einerzeilen nach unten — keine Kachel kommt dazu, keine fällt weg."
      : `Vier Rechtecke: ${produkt.xx}, ${produkt.x1}, ${produkt["1x"]} und ${produkt["11"]}. Die beiden Streifenblöcke sind gleichartig und werden zusammengefasst.`);
}

// ================= 2. Jedes Glied mit jedem =================

const JJ_TERME = [
  [["x", "3"], ["x", "5"]],
  [["x", "−3"], ["x", "5"]],
  [["2a", "b"], ["a", "−3b"]],
  [["3", "−y"], ["2y", "−1"]],
  [["x", "2"], ["x²", "−x", "4"]],
];
const JJ_PROBE = { x: 2, y: 3, a: 2, b: 3 };

function schrittListe(mountId, schritte, n) {
  const liste = el("ol", { class: "tm-schritte-liste" });
  schritte.slice(0, n + 1).forEach((s, i) => {
    liste.appendChild(el("li", { "data-rolle": "schritt", "data-art": s.art, "data-term": s.term }, [
      el("span", { class: "tm-schritt-term" }, (i === 0 ? "" : "= ") + s.term),
      el("span", { class: "tm-regel" }, i === 0 ? s.regel : `${i}. ${s.regel}`),
    ]));
  });
  const mount = document.getElementById(mountId);
  mount.innerHTML = "";
  mount.appendChild(liste);
}
// Die Probe rechnet mit dem Termwerk der Seite — Anfang und Ende werden dafür neu gelesen.
function probe(anfang, ende) {
  const vars = VARS.filter((v) => anfang.includes(v));
  const bel = Object.fromEntries(vars.map((v) => [v, JJ_PROBE[v]]));
  const wa = T.wert(P(anfang), bel), we = T.wert(P(ende), bel);
  return `<span data-rolle="probe">Probe mit ${vars.map((v) => `${v} = ${bel[v]}`).join(", ")}: Der Anfang ergibt ${num(wa)}, das Ergebnis ${num(we)}${wa === we ? " ✓" : " ✗"}</span>`;
}

function renderJeder() {
  const [k1, k2] = JJ_TERME[Number(wahl("jj-term"))];
  const n = reglerZahl("jj-schritt");
  setzeText("jj-schritt-anzeige", `${n} von 3`);
  const term = `(${summe(k1)}) · (${summe(k2)})`;
  const paare = k1.flatMap((g1) => k2.map((g2) => [g1, g2]));
  const einzeln = paare.map(([g1, g2]) => txt(T.mal(P(g1), P(g2))));
  const ende = txt(P(term));
  const schritte = [
    { art: "start", term, regel: "Der Anfang" },
    { art: "produkte", term: paare.map(([g1, g2]) => `${inKlammer(g1)} · ${inKlammer(g2)}`).join(" + "), regel: `Jedes der ${k1.length} Glieder mal jedes der ${k2.length}: ${k1.length} · ${k2.length} = ${paare.length} Produkte.` },
    { art: "ausgerechnet", term: summe(einzeln), regel: "Jedes Produkt ausgerechnet, mit der Vorzeichenregel." },
    { art: "zusammengefasst", term: ende, regel: "Gleichartige Glieder zusammengefasst." },
  ];
  schrittListe("jj-mount", schritte, n);
  if (n < 3) setzeText("jj-text", n === 0 ? `${k1.length} Glieder mal ${k2.length} Glieder — geh mit dem Regler zum ersten Schritt.` : n === 1 ? `${paare.length} Produkte. Zähl nach: Fehlt eines, stimmt das Ergebnis nicht.` : "Jetzt stehen noch gleichartige Glieder nebeneinander.");
  else setzeHtml("jj-text", `Fertig. ${probe(term, ende)}`);
}

// ================= 3. Mehr als zwei Faktoren =================

const MF_TERME = [
  {
    start: "2 · (x + 1) · (x − 3)",
    schritte: [
      { art: "klammern", term: "2 · (x² − 3x + x − 3)", regel: "Erst die beiden Klammern: jedes Glied mit jedem. Das Ergebnis bleibt in Klammern." },
      { art: "zusammengefasst", term: "2 · (x² − 2x − 3)", regel: "In der Klammer zusammengefasst." },
      { art: "faktor", term: "2x² − 4x − 6", regel: "Dann die 2 mit jedem Glied der Klammer — sie gilt nur einmal." },
    ],
  },
  {
    start: "−(x − 2) · (x + 4)",
    schritte: [
      { art: "klammern", term: "−(x² + 4x − 2x − 8)", regel: "Erst das Produkt der Klammern — das Minus wartet davor." },
      { art: "zusammengefasst", term: "−(x² + 2x − 8)", regel: "In der Klammer zusammengefasst." },
      { art: "faktor", term: "−x² − 2x + 8", regel: "Dann die Minusklammer auflösen: Jedes Vorzeichen dreht sich um." },
    ],
  },
  {
    start: "(x + 1) · (x + 2) · (x + 3)",
    schritte: [
      { art: "klammern", term: "(x² + 2x + x + 2) · (x + 3)", regel: "Erst die ersten beiden Klammern." },
      { art: "zusammengefasst", term: "(x² + 3x + 2) · (x + 3)", regel: "Zusammengefasst — die dritte Klammer wartet." },
      { art: "faktor", term: "x³ + 6x² + 11x + 6", regel: "Dann jedes der 3 Glieder mal jedes der 2: x³ + 3x² + 3x² + 9x + 2x + 6, zusammengefasst." },
    ],
  },
  {
    start: "(x + 4) · (x − 1) − (x + 2) · (x − 3)",
    schritte: [
      { art: "klammern", term: "(x² + 3x − 4) − (x² − x − 6)", regel: "Jedes Produkt für sich ausmultipliziert und zusammengefasst — in Klammern, wegen des Minus." },
      { art: "minus", term: "x² + 3x − 4 − x² + x + 6", regel: "Die Minusklammer auflösen: Jedes Vorzeichen dreht sich um." },
      { art: "faktor", term: "4x + 2", regel: "Zusammengefasst: x² − x² = 0." },
    ],
  },
];

function renderMehrere() {
  const d = MF_TERME[Number(wahl("mf-term"))];
  const n = reglerZahl("mf-schritt");
  setzeText("mf-schritt-anzeige", `${n} von 3`);
  schrittListe("mf-mount", [{ art: "start", term: d.start, regel: "Der Anfang" }, ...d.schritte], n);
  if (n < 3) setzeText("mf-text", n === 0 ? "Geh mit dem Regler zum ersten Schritt." : "Das Zwischenergebnis steht in Klammern — der nächste Faktor gilt für alles darin.");
  else setzeHtml("mf-text", `Fertig. ${probe(d.start, d.schritte[d.schritte.length - 1].term)}`);
}

// ================= 4. Flächenänderung =================

const FA_ARTEN = [[3, 2], [4, 4], [6, 2]];   // a länger, b kürzer — Nullstellen der Änderung bei 6, nie, 3
const FA_W = 680, FA_H = 260;
const FA_S = 16;                             // Bildpunkte je Längeneinheit — fest, damit größeres x auch größer aussieht
const FA_X = 120, FA_Y = 30;

function renderAnwenden() {
  const [a, b] = FA_ARTEN[Number(wahl("fa-art"))];
  // Die verkürzte Seite muss eine Länge behalten: x > b. Der Regler zeigt, womit gerechnet wird.
  const x = begrenzt("fa-x", reglerZahl("fa-x"), b + 1, 12);
  setzeText("fa-x-anzeige", String(x));
  const svg = flaeche(FA_W, FA_H, `Quadrat ${x} mal ${x} und Rechteck ${x + a} mal ${x - b}`);
  // Das neue Rechteck, darüber gestrichelt das alte Quadrat — beide an derselben Ecke.
  svg.appendChild(svgEl("rect", { x: FA_X, y: FA_Y, width: (x + a) * FA_S, height: (x - b) * FA_S, class: "tm-figur-flaeche tm-figur-flaeche-b", "data-rolle": "neu" }));
  svg.appendChild(svgEl("rect", { x: FA_X, y: FA_Y, width: x * FA_S, height: x * FA_S, class: "tm-alt", "data-rolle": "alt" }));
  // Gewonnen: der Streifen rechts; verloren: der Streifen unten.
  svg.appendChild(svgText(FA_X + (x + a / 2) * FA_S, FA_Y + ((x - b) * FA_S) / 2 + 5, "+", { class: "tm-label tm-label-1", "data-rolle": "plus" }));
  svg.appendChild(svgText(FA_X + (x * FA_S) / 2, FA_Y + (x - b / 2) * FA_S + 5, "−", { class: "tm-label tm-label-rest", "data-rolle": "minus" }));
  svg.appendChild(svgText(FA_X + ((x + a) * FA_S) / 2, FA_Y - 10, `x + ${a} = ${x + a}`, { class: "tm-label", "data-rolle": "breite" }));
  svg.appendChild(svgText(FA_X - 10, FA_Y + ((x - b) * FA_S) / 2 + 5, `x − ${b} = ${x - b}`, { class: "tm-label", "data-rolle": "hoehe", "text-anchor": "end" }));
  zeige("fa-mount", svg);
  const neuP = T.mal(P(`x + ${a}`), P(`x - ${b}`));
  const aend = T.minus(neuP, P("x^2"));
  const alt = x * x, neu = (x + a) * (x - b), d = neu - alt;
  setzeHtml("fa-bilanz",
    `<span class="wb">A<sub>alt</sub></span> = x² = ${num(alt)} &nbsp; ` +
    `<span class="wa">A<sub>neu</sub></span> = (x + ${a}) · (x − ${b}) = <span data-rolle="term-neu">${txt(neuP)}</span> = ${num(x + a)} · ${num(x - b)} = ${num(neu)}<br>` +
    `Änderung: A<sub>neu</sub> − A<sub>alt</sub> = <span data-rolle="term-aenderung">${txt(aend)}</span> = <strong data-rolle="aenderung">${num(d)}</strong>`);
  // Wo der Flächeninhalt gleich bleibt: (a − b) · x − a · b = 0.
  const gleichBei = a === b ? null : (a * b) / (a - b);
  const satz = d > 0 ? `Für x = ${x} wird das Rechteck um ${num(d)} größer.` : d < 0 ? `Für x = ${x} wird das Rechteck um ${num(-d)} kleiner.` : `Für x = ${x} bleibt der Flächeninhalt gleich.`;
  const regel = a === b
    ? ` Bei „${a} länger, ${b} kürzer“ ist die Änderung immer −${a * b}, egal wie groß x ist.`
    : ` Der Term ${txt(aend)} ist für x = ${num(gleichBei)} null — für größere x wird das Rechteck größer, für kleinere kleiner.`;
  setzeText("fa-text", satz + regel);
}

// ================= Kontrollfragen =================

const QUIZZE = {
  "quiz-rechteck": {
    q: "Was ergibt (x + 2) · (x + 3)?",
    options: ["x² + 6", "x² + 5x + 5", "x² + 5x + 6", "x² + 6x + 5"],
    correct: 2,
    explain: "Vier Teilrechtecke: x · x = x², x · 3 = 3x, 2 · x = 2x und 2 · 3 = 6. Zusammen x² + 5x + 6. Bei x² + 6 fehlen die beiden Streifenblöcke, bei x² + 5x + 5 wurde 2 + 3 statt 2 · 3 gerechnet.",
  },
  "quiz-jeder": {
    q: "Was ergibt (x − 4) · (x + 2)?",
    options: ["x² − 2x − 8", "x² + 2x − 8", "x² − 2x + 8", "x² − 8"],
    correct: 0,
    explain: "x · x = x², x · 2 = 2x, (−4) · x = −4x, (−4) · 2 = −8. Zusammen x² + 2x − 4x − 8 = x² − 2x − 8. Bei x² + 2x − 8 ist das Vorzeichen der −4 verloren gegangen, bei x² − 8 fehlen die gemischten Produkte.",
  },
  "quiz-mehrere": {
    q: "Was ergibt 3 · (x + 1) · (x − 2)?",
    options: ["3x² − x − 2", "9x² − 9x − 18", "3x² − 3x − 6", "3x² − 3x − 2"],
    correct: 2,
    explain: "Erst (x + 1) · (x − 2) = x² − x − 2, dann die 3 mit jedem Glied: 3x² − 3x − 6. 9x² − 9x − 18 hat die 3 in beide Klammern gesteckt, 3x² − x − 2 und 3x² − 3x − 2 haben sie nur auf einen Teil angewendet.",
  },
  "quiz-anwenden": {
    q: "Ein Quadrat mit der Seite x wird zum Rechteck: eine Seite 2 länger, die andere 2 kürzer. Wie ändert sich der Flächeninhalt?",
    options: ["Er bleibt gleich.", "Er wird um 4 größer.", "Das hängt von x ab.", "Er wird um 4 kleiner."],
    correct: 3,
    explain: "(x + 2) · (x − 2) = x² − 2x + 2x − 4 = x² − 4: Die gemischten Glieder heben sich auf, es bleibt immer 4 weniger — für jedes x. Der Streifen, der rechts dazukommt, ist um genau ein 2 × 2-Quadrat kleiner als der, der unten wegfällt.",
  },
};

// ================= Start =================

["re-m", "re-a", "re-b", "re-t"].forEach((id) => document.getElementById(id).addEventListener("input", renderRechteck));
["jj-term", "jj-schritt"].forEach((id) => document.getElementById(id).addEventListener("input", renderJeder));
["mf-term", "mf-schritt"].forEach((id) => document.getElementById(id).addEventListener("input", renderMehrere));
["fa-art", "fa-x"].forEach((id) => document.getElementById(id).addEventListener("input", renderAnwenden));

renderRechteck();
renderJeder();
renderMehrere();
renderAnwenden();
mountQuizze(QUIZZE);
mountUebungsaufgaben(document.getElementById("exercises-mount"), AUFGABEN);
