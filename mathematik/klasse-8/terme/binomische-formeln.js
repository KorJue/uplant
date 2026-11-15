// Selbstlernpfad „Binomische Formeln anwenden“ (Klasse 8, Terme, Thema 5).
//
// Reihenfolge — jeder Abschnitt benutzt nur, was vorher da war:
//   1. (a + b)²: Das Quadrat zerfällt starr in a², zwei gleiche Rechtecke ab und b².
//   2. (a − b)²: Aus a² werden zwei Streifen ab herausgezogen. Das Eckquadrat b² steckt in beiden —
//      zweimal weggenommen, einmal zurück.
//   3. (a + b)(a − b): a² ohne das Eckquadrat b²; der untere Streifen gleitet erst nach rechts, dann
//      klappt er um die Ecke nach oben. Beides starr — Länge und Breite bleiben, und unterwegs
//      überdeckt er nichts.
//   4. Rückwärts und im Kopf, in Schritten.
// Jede Formel wird außerdem Glied für Glied ausmultipliziert (Thema 4) — so stützt sie sich nicht nur
// auf das Bild.
//
// Farben: a² blau, ab orange, b² grün, Hilfslinien grau. Gerechnet wird mit den Reglerwerten.
// Die Übungsaufgaben stehen in binomische-formeln-aufgaben.js.

import { svgEl, svgText, el, flaeche, zeige, num, reglerZahl, begrenzt, setzeText, setzeHtml, wahl, mountQuizze, mountUebungsaufgaben } from "./seite.js?v=1";
import * as T from "./termwerk.js?v=1";
import { AUFGABEN } from "./binomische-formeln-aufgaben.js?v=1";

const W = 680;
function rechteck(x, y, w, h, klasse, rolle, daten = {}) {
  return svgEl("rect", { x: x.toFixed(2), y: y.toFixed(2), width: w.toFixed(2), height: h.toFixed(2), class: klasse, "data-rolle": rolle, ...daten });
}
function beschrift(svg, x, y, text, klasse, rolle, anker = "middle") {
  svg.appendChild(svgText(x, y, text, { class: `tm-label ${klasse}`, "data-rolle": rolle, "text-anchor": anker }));
}
function regler(p) {
  const a = reglerZahl(`${p}-a`), t = reglerZahl(`${p}-t`) / 100;
  setzeText(`${p}-a-anzeige`, `${a} cm`);
  setzeText(`${p}-t-anzeige`, Math.round(t * 100) + " %");
  return { a, t };
}

// ================= 1. (a + b)² =================

const BF1_S = 20;      // Bildpunkte je cm — fest, damit ein größeres a auch größer aussieht
const BF1_G = 30;      // so weit rücken die Teile auseinander
const BF1_H = 340;

function renderErste() {
  const { a, t } = regler("bf1");
  const b = reglerZahl("bf1-b");
  setzeText("bf1-b-anzeige", `${b} cm`);
  const S = BF1_S, g = BF1_G * t;
  const x0 = Math.round((W - ((a + b) * S + BF1_G)) / 2), y0 = 36;
  const svg = flaeche(W, BF1_H, `Quadrat mit der Seite ${a} + ${b}`);
  const xb = x0 + a * S + g, yb = y0 + a * S + g;
  svg.appendChild(rechteck(x0, y0, a * S, a * S, "tm-bf tm-bf-a", "teil", { "data-teil": "a2" }));
  svg.appendChild(rechteck(xb, y0, b * S, a * S, "tm-bf tm-bf-ab", "teil", { "data-teil": "ab1" }));
  svg.appendChild(rechteck(x0, yb, a * S, b * S, "tm-bf tm-bf-ab", "teil", { "data-teil": "ab2" }));
  svg.appendChild(rechteck(xb, yb, b * S, b * S, "tm-bf tm-bf-b", "teil", { "data-teil": "b2" }));
  // Namen in den Teilen, die Seiten außen — sie wandern mit.
  beschrift(svg, x0 + (a * S) / 2, y0 + (a * S) / 2 + 5, "a²", "tm-label-flaeche", "name");
  beschrift(svg, xb + (b * S) / 2, y0 + (a * S) / 2 + 5, "ab", "tm-label-flaeche", "name");
  beschrift(svg, x0 + (a * S) / 2, yb + (b * S) / 2 + 5, "ab", "tm-label-flaeche", "name");
  beschrift(svg, xb + (b * S) / 2, yb + (b * S) / 2 + 5, "b²", "tm-label-flaeche", "name");
  beschrift(svg, x0 + (a * S) / 2, y0 - 10, "a", "tm-label-faktor", "seite");
  beschrift(svg, xb + (b * S) / 2, y0 - 10, "b", "tm-label-1", "seite");
  beschrift(svg, x0 - 10, y0 + (a * S) / 2 + 5, "a", "tm-label-faktor", "seite", "end");
  beschrift(svg, x0 - 10, yb + (b * S) / 2 + 5, "b", "tm-label-1", "seite", "end");
  zeige("bf1-mount", svg);
  const links = (a + b) * (a + b), rechts = a * a + 2 * a * b + b * b;
  setzeHtml("bf1-bilanz",
    `(a + b)² = (${a} + ${b})² = ${a + b}² = <strong data-rolle="links">${num(links)}</strong> (cm²)<br>` +
    `<span class="wc">a²</span> + <span class="wb">2ab</span> + <span class="wa">b²</span> = ${a * a} + 2 · ${a * b} + ${b * b} = <strong data-rolle="rechts">${num(rechts)}</strong> (cm²)`);
  setzeText("bf1-text", t === 0
    ? `Das Quadrat hat die Seite ${a} + ${b} = ${a + b} cm. Zieh es auseinander.`
    : t < 1
      ? "Die Teile rücken auseinander — keines kommt dazu, keines fällt weg."
      : `Vier Teile: das Quadrat a² = ${a * a}, das Quadrat b² = ${b * b} und zwei gleiche Rechtecke ab = ${a * b}. Zusammen ${rechts} — genau (a + b)².`);
}

// ================= 2. (a − b)² =================

const BF2_S = 24, BF2_G = 26, BF2_H = 360;   // Höhe: Quadrat a, dazu der herausgezogene Streifen b und der Abstand

function renderZweite() {
  const { a } = regler("bf2");
  // Die Reglergrenzen (a ≥ 4, b ≤ 3) halten b < a — sonst gäbe es kein Quadrat (a − b)².
  const b = reglerZahl("bf2-b");
  setzeText("bf2-b-anzeige", `${b} cm`);
  const t = reglerZahl("bf2-t") / 100;
  const S = BF2_S;
  const weg = (b * S + BF2_G) * t;   // so weit wandert jeder Streifen hinaus
  const x0 = Math.round((W - (a * S + BF2_G + b * S)) / 2), y0 = 30;
  const svg = flaeche(W, BF2_H, `Quadrat mit der Seite ${a}, zwei Streifen der Breite ${b}`);
  // Darunter: der Umriss von a² und das Quadrat, das übrig bleibt.
  svg.appendChild(rechteck(x0, y0, a * S, a * S, "tm-alt", "umriss"));
  svg.appendChild(rechteck(x0, y0, (a - b) * S, (a - b) * S, "tm-bf tm-bf-a", "rest"));
  // Die beiden Streifen, halb durchsichtig: Wo sie sich zu Anfang überdecken, liegt das Eckquadrat
  // doppelt — genau das ist der Punkt.
  const rx = x0 + (a - b) * S + weg, uy = y0 + (a - b) * S + weg;
  svg.appendChild(rechteck(rx, y0, b * S, a * S, "tm-bf tm-bf-ab tm-bf-streifen", "streifen", { "data-teil": "rechts" }));
  svg.appendChild(rechteck(x0, uy, a * S, b * S, "tm-bf tm-bf-ab tm-bf-streifen", "streifen", { "data-teil": "unten" }));
  // In jedem Streifen das Eckquadrat b², schraffiert.
  svg.appendChild(rechteck(rx, y0 + (a - b) * S, b * S, b * S, "tm-bf-ecke", "ecke", { "data-teil": "rechts" }));
  svg.appendChild(rechteck(x0 + (a - b) * S, uy, b * S, b * S, "tm-bf-ecke", "ecke", { "data-teil": "unten" }));
  beschrift(svg, x0 + ((a - b) * S) / 2, y0 + ((a - b) * S) / 2 + 5, "(a − b)²", "tm-label-flaeche", "name");
  if (t > 0.5) {
    beschrift(svg, rx + (b * S) / 2, y0 + ((a - b) * S) / 2 + 5, "ab", "tm-label-flaeche", "name");
    beschrift(svg, x0 + ((a - b) * S) / 2, uy + (b * S) / 2 + 5, "ab", "tm-label-flaeche", "name");
  }
  beschrift(svg, x0 + (a * S) / 2, y0 - 10, `a = ${a}`, "tm-label-faktor", "seite");
  beschrift(svg, x0 - 10, y0 + ((a - b) * S) / 2 + 5, "a − b", "tm-label-faktor", "seite", "end");
  zeige("bf2-mount", svg);
  const links = (a - b) * (a - b), rechts = a * a - 2 * a * b + b * b;
  setzeHtml("bf2-bilanz",
    `(a − b)² = (${a} − ${b})² = ${a - b}² = <strong data-rolle="links">${num(links)}</strong> (cm²)<br>` +
    `<span class="wc">a²</span> − <span class="wb">2ab</span> + <span class="wa">b²</span> = ${a * a} − 2 · ${a * b} + ${b * b} = <strong data-rolle="rechts">${num(rechts)}</strong> (cm²)`);
  setzeText("bf2-text", t === 0
    ? `Rechts und unten liegt je ein Streifen ${b} cm breit und ${a} cm lang. Wo sie sich treffen, überdecken sie sich im Eckquadrat b² = ${b * b}.`
    : t < 1
      ? "Die Streifen wandern heraus — jeder nimmt das Eckquadrat mit."
      : `Weggenommen: zweimal ab = 2 · ${a * b} = ${2 * a * b}. Das Eckquadrat b² = ${b * b} steckt aber in beiden Streifen — es ist zweimal weg und muss einmal zurück: ${a * a} − ${2 * a * b} + ${b * b} = ${rechts}.`);
}

// ================= 3. (a + b)(a − b) =================

const BF3_S = 24, BF3_H = 300;
// Die Ecken des unteren Streifens beim Reglerwert t, relativ zur linken oberen Ecke von a².
// Phase 1 (bis 40 %): Er gleitet um a nach rechts — durch die leere Ecke, unter dem oberen Teil
// hindurch. Phase 2: Er klappt gegen den Uhrzeigersinn um seine linke obere Ecke nach oben; dabei
// bleibt er ganz rechts von a² und landet als Streifen b breit und a − b hoch.
function streifenEcken(a, b, t, S) {
  const w = (a - b) * S, h = b * S;
  const s1 = Math.min(1, t / 0.4), s2 = Math.max(0, (t - 0.4) / 0.6);
  const dx = a * S * s1;
  const pivot = { x: dx, y: (a - b) * S };
  const phi = (Math.PI / 2) * s2;   // gegen den Uhrzeigersinn auf dem Bildschirm (y nach unten)
  const dreh = ([px, py]) => {
    const vx = px - pivot.x, vy = py - pivot.y;
    return [pivot.x + vx * Math.cos(phi) + vy * Math.sin(phi), pivot.y - vx * Math.sin(phi) + vy * Math.cos(phi)];
  };
  return [[dx, (a - b) * S], [dx + w, (a - b) * S], [dx + w, (a - b) * S + h], [dx, (a - b) * S + h]].map(dreh);
}

function renderDritte() {
  const { a } = regler("bf3");
  const b = reglerZahl("bf3-b");   // wie oben: die Reglergrenzen halten b < a
  setzeText("bf3-b-anzeige", `${b} cm`);
  const t = reglerZahl("bf3-t") / 100;
  const S = BF3_S;
  const x0 = Math.round((W - (a + b) * S) / 2), y0 = 34;
  const svg = flaeche(W, BF3_H, `Quadrat mit der Seite ${a} ohne Eckquadrat ${b}`);
  // Das weggenommene Eckquadrat bleibt als Umriss stehen.
  svg.appendChild(rechteck(x0 + (a - b) * S, y0 + (a - b) * S, b * S, b * S, "tm-alt", "weg"));
  svg.appendChild(rechteck(x0, y0, a * S, (a - b) * S, "tm-bf tm-bf-a", "oben"));
  const ecken = streifenEcken(a, b, t, S).map(([px, py]) => [x0 + px, y0 + py]);
  svg.appendChild(svgEl("polygon", { points: ecken.map((p) => p.map((v) => v.toFixed(2)).join(",")).join(" "), class: "tm-bf tm-bf-ab", "data-rolle": "streifen" }));
  if (t === 0) {
    beschrift(svg, x0 + (a * S) / 2, y0 - 10, `a = ${a}`, "tm-label-faktor", "seite");
    beschrift(svg, x0 + (a - b / 2) * S, y0 + (a - b / 2) * S + 5, "b²", "tm-label-null", "name");
  }
  if (t === 1) {
    beschrift(svg, x0 + ((a + b) * S) / 2, y0 - 10, `a + b = ${a + b}`, "tm-label-faktor", "seite");
    beschrift(svg, x0 - 10, y0 + ((a - b) * S) / 2 + 5, `a − b = ${a - b}`, "tm-label-faktor", "seite", "end");
  }
  zeige("bf3-mount", svg);
  const links = a * a - b * b, rechts = (a + b) * (a - b);
  setzeHtml("bf3-bilanz",
    `<span class="wc">a²</span> − <span class="wa">b²</span> = ${a * a} − ${b * b} = <strong data-rolle="links">${num(links)}</strong> (cm²)<br>` +
    `(a + b) · (a − b) = ${a + b} · ${a - b} = <strong data-rolle="rechts">${num(rechts)}</strong> (cm²)`);
  setzeText("bf3-text", t === 0
    ? `Vom Quadrat a² = ${a * a} ist das Eckquadrat b² = ${b * b} weggenommen. Der untere Streifen ist ${a - b} cm lang und ${b} cm hoch.`
    : t < 1
      ? "Der Streifen gleitet nach rechts und klappt dann nach oben — er bleibt dabei gleich lang und gleich breit."
      : `Ein Rechteck, ${a + b} cm lang und ${a - b} cm hoch: (a + b) · (a − b) = ${rechts} — derselbe Flächeninhalt wie a² − b².`);
}

// ================= 4. Rückwärts und im Kopf =================

const BF4 = [
  { start: "51²", formel: 1, schritte: [
    { term: "(50 + 1)²", regel: "51 = 50 + 1 — das Quadrat einer Summe: erste binomische Formel." },
    { term: "50² + 2 · 50 · 1 + 1²", regel: "a² + 2ab + b² mit a = 50 und b = 1." },
    { term: "2601", regel: "2500 + 100 + 1 — im Kopf." },
  ] },
  { start: "49²", formel: 2, schritte: [
    { term: "(50 − 1)²", regel: "49 = 50 − 1 — das Quadrat einer Differenz: zweite binomische Formel." },
    { term: "50² − 2 · 50 · 1 + 1²", regel: "a² − 2ab + b² mit a = 50 und b = 1." },
    { term: "2401", regel: "2500 − 100 + 1 — im Kopf." },
  ] },
  { start: "48 · 52", formel: 3, schritte: [
    { term: "(50 − 2) · (50 + 2)", regel: "48 und 52 liegen gleich weit um 50: dritte binomische Formel." },
    { term: "50² − 2²", regel: "a² − b² mit a = 50 und b = 2." },
    { term: "2496", regel: "2500 − 4 — im Kopf." },
  ] },
  { start: "x² + 12x + 36", formel: 1, schritte: [
    { term: "x² + 2 · x · 6 + 6²", regel: "36 = 6², und 12x = 2 · x · 6 ist das doppelte Produkt: erste binomische Formel." },
    { term: "(x + 6)²", regel: "Rückwärts gelesen: a² + 2ab + b² = (a + b)²." },
  ] },
  { start: "9x² − 4", formel: 3, schritte: [
    { term: "(3x)² − 2²", regel: "9x² = (3x)² und 4 = 2²: eine Differenz zweier Quadrate — dritte binomische Formel." },
    { term: "(3x + 2) · (3x − 2)", regel: "Rückwärts gelesen: a² − b² = (a + b) · (a − b)." },
  ] },
];
const NAME = { 1: "erste", 2: "zweite", 3: "dritte" };

function renderAnwenden() {
  const d = BF4[Number(wahl("bf4-term"))];
  // Rückwärts genügen zwei Schritte — der Regler wird auf die Zahl der Schritte begrenzt.
  const n = begrenzt("bf4-schritt", reglerZahl("bf4-schritt"), 0, d.schritte.length);
  setzeText("bf4-schritt-anzeige", `${n} von ${d.schritte.length}`);
  const liste = el("ol", { class: "tm-schritte-liste" });
  [{ term: d.start, regel: "Die Aufgabe" }, ...d.schritte].slice(0, n + 1).forEach((s, i) => {
    liste.appendChild(el("li", { "data-rolle": "schritt", "data-term": s.term }, [
      el("span", { class: "tm-schritt-term" }, (i === 0 ? "" : "= ") + s.term),
      el("span", { class: "tm-regel" }, i === 0 ? s.regel : `${i}. ${s.regel}`),
    ]));
  });
  const mount = document.getElementById("bf4-mount");
  mount.innerHTML = "";
  mount.appendChild(liste);
  const ende = d.schritte[d.schritte.length - 1].term;
  if (n < d.schritte.length) {
    setzeText("bf4-text", n === 0 ? "Geh mit dem Regler zum ersten Schritt." : `Benutzt wird die ${NAME[d.formel]} binomische Formel.`);
  } else if (/x/.test(d.start)) {
    // Probe: ausmultipliziert mit dem Termwerk der Seite.
    const zurueck = T.text(T.P(ende));
    setzeHtml("bf4-text", `Fertig — mit der <span data-rolle="formel">${NAME[d.formel]}n</span> binomischen Formel. <span data-rolle="probe">Probe: ${ende} ausmultipliziert ergibt ${zurueck}${T.gleich(T.P(ende), T.P(d.start)) ? " ✓" : " ✗"}</span>`);
  } else {
    setzeHtml("bf4-text", `Fertig — mit der <span data-rolle="formel">${NAME[d.formel]}n</span> binomischen Formel, ganz ohne schriftliches Multiplizieren.`);
  }
}

// ================= Kontrollfragen =================

const QUIZZE = {
  "quiz-erste": {
    q: "Was ergibt (x + 4)²?",
    options: ["x² + 16", "x² + 8x + 16", "x² + 4x + 16", "x² + 8x + 8"],
    correct: 1,
    explain: "a² + 2ab + b² mit a = x und b = 4: x² + 2 · x · 4 + 4² = x² + 8x + 16. Bei x² + 16 fehlen die beiden Rechtecke 2ab, bei x² + 4x + 16 ist nur eines da, und x² + 8x + 8 rechnet 4² als 4 · 2.",
  },
  "quiz-zweite": {
    q: "Was ergibt (2a − 3)²?",
    options: ["4a² − 12a + 9", "4a² − 9", "2a² − 12a + 9", "4a² − 12a − 9"],
    correct: 0,
    explain: "(2a)² − 2 · 2a · 3 + 3² = 4a² − 12a + 9. Das letzte Glied ist positiv, weil (−3) · (−3) = 9. 2a² vergisst, dass auch die 2 quadriert wird, und 4a² − 9 lässt das gemischte Glied weg.",
  },
  "quiz-dritte": {
    q: "Was ergibt 21 · 19, gerechnet mit der dritten binomischen Formel?",
    options: ["400", "401", "441", "399"],
    correct: 3,
    explain: "21 · 19 = (20 + 1) · (20 − 1) = 20² − 1² = 400 − 1 = 399. Wer 400 sagt, hat b² vergessen; 401 addiert es, und 441 ist 21².",
  },
  "quiz-anwenden": {
    q: "Wie lässt sich x² − 10x + 25 als Produkt schreiben?",
    options: ["(x + 5)²", "(x − 5) · (x + 5)", "(x − 5)²", "(x − 10)²"],
    correct: 2,
    explain: "25 = 5² und 10x = 2 · x · 5, mit Minus davor: die zweite binomische Formel rückwärts, (x − 5)². Probe: (x − 5)² = x² − 10x + 25 ✓. (x − 5) · (x + 5) ergäbe x² − 25, (x + 5)² ein Plus in der Mitte.",
  },
};

// ================= Start =================

["bf1-a", "bf1-b", "bf1-t"].forEach((id) => document.getElementById(id).addEventListener("input", renderErste));
["bf2-a", "bf2-b", "bf2-t"].forEach((id) => document.getElementById(id).addEventListener("input", renderZweite));
["bf3-a", "bf3-b", "bf3-t"].forEach((id) => document.getElementById(id).addEventListener("input", renderDritte));
["bf4-term", "bf4-schritt"].forEach((id) => document.getElementById(id).addEventListener("input", renderAnwenden));

renderErste();
renderZweite();
renderDritte();
renderAnwenden();
mountQuizze(QUIZZE);
mountUebungsaufgaben(document.getElementById("exercises-mount"), AUFGABEN);
