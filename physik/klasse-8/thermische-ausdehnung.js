// Selbstlernpfad „Thermische Ausdehnung“ (Physik, Klasse 8). Rein clientseitiges Vanilla-JS.
//
// Didaktische Reihenfolge — jeder Abschnitt benutzt nur, was davor steht:
//   1. Teilchenmodell: fest, flüssig, gasförmig, je zwei Temperaturen  (Temperatur in °C)
//   2. Übergänge und Erwärmungskurve von Wasser                         (Energie in kJ, abgelesen)
//   3. Bindungsenergie: Energiemulde, Umkehrpunkte, Mitte wandert       (erklärt 2 und die Ausdehnung)
//   4. Feste Körper: ΔL = α · L0 · ΔT                                   (ΔT in K als Temperaturdifferenz)
//   5. Flüssigkeiten: ΔV = γ · V0 · ΔT, Thermometer                     (wie 4, für das Volumen)
//   6. Gase bei gleichem Druck: Gay-Lussac, absoluter Nullpunkt, Kelvin (die Kelvin-Skala entsteht hier)
//   7. Gase bei gleicher Temperatur: Boyle-Mariotte                     (p · V = konstant)
//   8. Gase bei gleichem Volumen: Amontons                              (braucht die Kelvin-Skala aus 6)
//   9. Allgemeine Gasgleichung aus 7 und 8 in zwei Schritten
//
// Gerechnet wird mit Reglerwerten, nie mit Bildschirmkoordinaten. Die Diagramme tragen ihre Gitterlinien
// mit data-wert (y) und ihre Achsenmarken mit data-wert-x (x); daraus liest die Prüfung den Maßstab
// zurück. Die Übungsaufgaben stehen in thermische-ausdehnung-aufgaben.js.

import {
  svgEl, svgText, flaeche, zeige, num, zeichen, reglerZahl, setzeText, setzeHtml, wahl, mountQuizze, mountUebungsaufgaben,
} from "./seite.js?v=1";
import { AUFGABEN } from "./thermische-ausdehnung-aufgaben.js?v=1";

// ---------- Physikalische Größen ----------

const T0 = 273.15;                 // 0 °C in Kelvin
const R_GAS = 8.314462618;         // J/(mol · K)
const M_WASSER = 0.018015;         // kg/mol
// Mittlere Geschwindigkeit der Wassermoleküle bei der Temperatur ϑ (in °C).
const vMittel = (theta) => Math.sqrt((8 * R_GAS * (theta + T0)) / (Math.PI * M_WASSER));
const kelvin = (theta) => theta + T0;
const runde = (x, st) => Math.round(x * 10 ** st) / 10 ** st;
const bruch = (z, n) => `<span class="bruch"><span class="z">${z}</span><span class="n">${n}</span></span>`;

// ---------- Diagramme ----------

// Ein Diagramm in einer Zeichenfläche: Weltkoordinaten → Bildpunkte. Gitterlinien mit data-wert,
// Marken an der x-Achse mit data-wert-x, alles in einer Gruppe data-diagramm.
function diagramm(svg, o) {
  const g = svgEl("g", { "data-diagramm": o.name });
  svg.appendChild(g);
  const { x0, y0, b, h, xmin, xmax, ymin = 0, ymax } = o;
  const X = (x) => x0 + ((x - xmin) / (xmax - xmin)) * b;
  const Y = (y) => y0 + h - ((y - ymin) / (ymax - ymin)) * h;
  for (let i = Math.ceil(ymin / o.ySchritt - 1e-9); i * o.ySchritt <= ymax + 1e-9; i++) {
    const y = runde(i * o.ySchritt, 6);
    g.appendChild(svgEl("line", { x1: x0, x2: x0 + b, y1: Y(y).toFixed(2), y2: Y(y).toFixed(2), class: "ta-gitter", "data-wert": String(y) }));
    g.appendChild(svgText(x0 - 6, Y(y) + 4, num(y, o.yStellen ?? 2), { class: "ta-achsentext", "text-anchor": "end" }));
  }
  for (let i = Math.ceil(xmin / o.xSchritt - 1e-9); i * o.xSchritt <= xmax + 1e-9; i++) {
    const x = runde(i * o.xSchritt, 6);
    g.appendChild(svgEl("line", { x1: X(x).toFixed(2), x2: X(x).toFixed(2), y1: (y0 + h).toFixed(2), y2: (y0 + h + 5).toFixed(2), class: "ta-achse ta-marke", "data-wert-x": String(x) }));
    g.appendChild(svgText(X(x), y0 + h + 18, num(x, o.xStellen ?? 2), { class: "ta-achsentext" }));
  }
  const yAchse = ymin <= 0 && ymax >= 0 ? Y(0) : y0 + h;
  g.appendChild(svgEl("line", { x1: x0, x2: x0 + b, y1: yAchse.toFixed(2), y2: yAchse.toFixed(2), class: "ta-achse" }));
  g.appendChild(svgEl("line", { x1: X(Math.max(xmin, Math.min(xmax, 0))).toFixed(2), x2: X(Math.max(xmin, Math.min(xmax, 0))).toFixed(2), y1: y0 - 4, y2: (y0 + h).toFixed(2), class: "ta-achse" }));
  g.appendChild(svgText(x0 + b, y0 + h + 32, o.xName, { class: "ta-achsentext", "text-anchor": "end" }));
  g.appendChild(svgText(x0 + 4, y0 - 8, o.yName, { class: "ta-achsentext", "text-anchor": "start" }));
  return { g, X, Y };
}
function linienzug(d, pts, attrs) {
  const p = pts.map(([x, y], i) => `${i ? "L" : "M"} ${d.X(x).toFixed(2)} ${d.Y(y).toFixed(2)}`).join(" ");
  d.g.appendChild(svgEl("path", Object.assign({ d: p }, attrs)));
}
function kurvePunkte(f, a, b, n = 160) {
  return Array.from({ length: n + 1 }, (_, i) => { const x = a + ((b - a) * i) / n; return [x, f(x)]; });
}
function punkt(d, x, y, klasse, attrs = {}) {
  d.g.appendChild(svgEl("circle", Object.assign({ cx: d.X(x).toFixed(2), cy: d.Y(y).toFixed(2), r: 5, class: klasse }, attrs)));
}

// Ein Zylinder mit Gas und Kolben: Boden bei y = boden, Gashöhe in Bildpunkten. Fest (ohne Kolben)
// für die verschlossene Dose. data-hoehe-px trägt die gezeichnete Gashöhe für die Prüfung.
function zylinder(svg, x, boden, breite, hoeheGas, hoeheAussen, { kolben = true, beschriftung = [] } = {}) {
  svg.appendChild(svgEl("rect", { x, y: (boden - hoeheGas).toFixed(2), width: breite, height: hoeheGas.toFixed(2), class: "ta-gas", "data-rolle": "gas", "data-hoehe-px": hoeheGas.toFixed(3) }));
  if (kolben) {
    svg.appendChild(svgEl("rect", { x: x + 2, y: (boden - hoeheGas - 12).toFixed(2), width: breite - 4, height: 12, class: "ta-kolben", "data-rolle": "kolben" }));
    svg.appendChild(svgEl("rect", { x: x + breite / 2 - 4, y: (boden - hoeheGas - 12 - 26).toFixed(2), width: 8, height: 26, class: "ta-kolben" }));
    svg.appendChild(svgEl("path", { d: `M ${x} ${boden - hoeheAussen} L ${x} ${boden} L ${x + breite} ${boden} L ${x + breite} ${boden - hoeheAussen}`, class: "ta-zylinder" }));
  } else {
    svg.appendChild(svgEl("rect", { x, y: boden - hoeheAussen, width: breite, height: hoeheAussen, class: "ta-zylinder" }));
  }
  beschriftung.forEach((t, i) => svg.appendChild(svgText(x + breite / 2, boden + 18 + 15 * i, t, { class: "ta-text" })));
}

// ================= 1. Teilchenmodell =================

const ZUSTAENDE = [
  { key: "fest", name: "fest", stoff: "Eis", temps: [-150, -5] },
  { key: "fluessig", name: "flüssig", stoff: "Wasser", temps: [5, 95] },
  { key: "gas", name: "gasförmig", stoff: "Wasserdampf", temps: [110, 400] },
];
const V_BEZUG = vMittel(20);     // Bezug für die Geschwindigkeit in der Darstellung
const PB = 210, PH = 140;          // Größe eines Feldes
const RADIUS = 8;
// Feste Zufallszahlen: Jede Seite zeigt dieselben Teilchen, die Prüfung kann sie wiederfinden.
function zufall(saat) {
  let s = saat >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
const TEILCHEN = (() => {
  const z = zufall(20250804);
  const fest = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) fest.push({ gx: 30 + 30 * c, gy: 25 + 30 * r, w: 0.22 + 0.08 * z(), ph: 6.283 * z(), dir: 3.1416 * z() });
  const fluessig = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) {
    if ((r * 6 + c) % 7 === 3) continue;   // Lücken: Eine Flüssigkeit ist nicht dicht gepackt wie ein Gitter
    fluessig.push({ x: 22 + 30 * c + (r % 2) * 12 + 6 * (z() - 0.5), y: 22 + 31 * r + 6 * (z() - 0.5), w1: 0.05 + 0.03 * z(), w2: 0.05 + 0.03 * z(), p1: 6.283 * z(), p2: 6.283 * z() });
  }
  const gas = [];
  for (let i = 0; i < 7; i++) {
    const winkel = 6.283 * z(), v = 1.6 + 0.8 * z();
    gas.push({ x: RADIUS + (PB - 2 * RADIUS) * z(), y: RADIUS + (PH - 2 * RADIUS) * z(), vx: v * Math.cos(winkel), vy: v * Math.sin(winkel) });
  }
  return { fest, fluessig, gas };
})();
const A_FEST = 7, R_FLUESSIG = 9;
// Spiegelt eine gerade Bewegung an den Wänden lo und hi (Dreieckswelle).
function spiegel(x, lo, hi) {
  const L = hi - lo, P = 2 * L;
  const u = (((x - lo) % P) + P) % P;
  return lo + (u <= L ? u : P - u);
}
// Lage der Teilchen eines Feldes zur Zeit t. f = Geschwindigkeit relativ zum Bezug.
function lagen(key, f, t) {
  if (key === "fest") {
    // Schwingung um den Gitterplatz entlang einer festen Richtung; die Weite wächst mit f.
    return TEILCHEN.fest.map((q) => { const s = A_FEST * f * Math.sin(q.w * t + q.ph); return { x: q.gx + s * Math.cos(q.dir), y: q.gy + s * Math.sin(q.dir), gx: q.gx, gy: q.gy }; });
  }
  if (key === "fluessig") {
    // Wandern um einen Platz, ohne festes Gitter; die Weite wächst mit f. Bei gleichem Takt heißt
    // f-mal so weit auch f-mal so schnell — zu jedem Zeitpunkt, nicht nur im Mittel.
    return TEILCHEN.fluessig.map((q) => ({ x: q.x + R_FLUESSIG * f * Math.sin(q.w1 * t + q.p1), y: q.y + R_FLUESSIG * f * Math.sin(q.w2 * t + q.p2), gx: q.x, gy: q.y }));
  }
  return TEILCHEN.gas.map((q) => ({ x: spiegel(q.x + q.vx * f * t, RADIUS, PB - RADIUS), y: spiegel(q.y + q.vy * f * t, RADIUS, PH - RADIUS) }));
}

function renderTeilchen() {
  const t = reglerZahl("tc-t");
  setzeText("tc-t-anzeige", num(t));
  const L = 92, GAP = 14, OBEN = 34, ZWISCHEN = 24;
  const svg = flaeche(L + 2 * PB + GAP + 6, OBEN + 3 * PH + 2 * ZWISCHEN + 6, "Teilchen von Eis, Wasser und Wasserdampf bei je zwei Temperaturen");
  svg.appendChild(svgText(L + PB / 2, 16, "kälter", { class: "ta-titel" }));
  svg.appendChild(svgText(L + PB + GAP + PB / 2, 16, "wärmer", { class: "ta-titel" }));
  const zeilen = [];
  ZUSTAENDE.forEach((z, r) => {
    const y0 = OBEN + r * (PH + ZWISCHEN);
    svg.appendChild(svgText(6, y0 + PH / 2 - 4, z.name, { class: "ta-titel", "text-anchor": "start" }));
    svg.appendChild(svgText(6, y0 + PH / 2 + 12, `(${z.stoff})`, { class: "ta-klein", "text-anchor": "start" }));
    const v = z.temps.map(vMittel);
    z.temps.forEach((theta, c) => {
      const x0 = L + c * (PB + GAP), f = v[c] / V_BEZUG;
      const g = svgEl("g", { "data-zustand": z.key, "data-theta": String(theta), transform: `translate(${x0} ${y0})` });
      g.appendChild(svgEl("rect", { x: 0, y: 0, width: PB, height: PH, rx: 6, class: "ta-feld" }));
      lagen(z.key, f, t).forEach((q, i) => {
        if (z.key === "fest") g.appendChild(svgEl("circle", { cx: q.gx, cy: q.gy, r: RADIUS + 1, class: "ta-gitterplatz" }));
        g.appendChild(svgEl("circle", Object.assign({ cx: q.x.toFixed(3), cy: q.y.toFixed(3), r: RADIUS, class: `ta-teilchen ${z.key}`, "data-i": String(i) },
          z.key === "gas" ? {} : { "data-gx": String(q.gx), "data-gy": String(q.gy) })));
      });
      g.appendChild(svgText(PB - 6, PH - 6, `${num(theta)} °C`, { class: "ta-text", "text-anchor": "end" }));
      svg.appendChild(g);
    });
    zeilen.push(`<strong>${z.name} (${z.stoff}):</strong> bei ${num(z.temps[0])} °C im Mittel <span data-rolle="v-${z.key}-0">${num(v[0], 0)}</span> m/s, ` +
      `bei ${num(z.temps[1])} °C <span data-rolle="v-${z.key}-1">${num(v[1], 0)}</span> m/s — also ${zeichen(v[1] / v[0], 2)} <strong data-rolle="faktor-${z.key}">${num(v[1] / v[0], 2)}</strong>-mal so schnell`);
  });
  zeige("tc-mount", svg);
  setzeHtml("tc-bilanz", "Mittlere Geschwindigkeit der Wassermoleküle:<br>" + zeilen.join("<br>") +
    `<br><span class="progress-note">In der Darstellung sind alle Bewegungen gleich stark verlangsamt — die Verhältnisse stimmen.</span>`);
  setzeText("tc-text", "Fest: Die Teilchen schwingen um ihre Gitterplätze (gestrichelt) — wärmer weiter aus. Flüssig: Sie gleiten dicht an dicht umeinander — wärmer weiter und schneller. Gasförmig: Sie fliegen frei und prallen an den Wänden ab — wärmer schneller.");
}

let abspielen = null;
function abspielenUmschalten() {
  const knopf = document.getElementById("tc-play");
  if (abspielen) {
    clearInterval(abspielen);
    abspielen = null;
    knopf.textContent = "▶ Abspielen";
    return;
  }
  knopf.textContent = "⏸ Anhalten";
  abspielen = setInterval(() => {
    const e = document.getElementById("tc-t");
    e.value = String((Number(e.value) + 1) % (Number(e.max) + 1));
    renderTeilchen();
  }, 40);
}

// ================= 2. Übergänge: Erwärmungskurve =================

// Für 1 kg Wasser, Werte in kJ: spezifische Wärmekapazitäten je Kelvin, Schmelz- und Verdampfungswärme.
const C_EIS = 2.1, C_WASSER = 4.19, C_DAMPF = 2.0, Q_SCHMELZ = 334, Q_VERDAMPF = 2256;
const KNICKE = (() => {
  const q1 = C_EIS * 20, q2 = q1 + Q_SCHMELZ, q3 = q2 + C_WASSER * 100, q4 = q3 + Q_VERDAMPF, q5 = q4 + C_DAMPF * 20;
  return [[0, -20], [q1, 0], [q2, 0], [q3, 100], [q4, 100], [q5, 120]];
})();
// Zustand nach der zugeführten Energie Q: Temperatur und Anteile Eis, Wasser, Dampf.
function zustandBei(Q) {
  const [, [q1], [q2], [q3], [q4]] = KNICKE;
  if (Q <= q1) return { theta: -20 + Q / C_EIS, eis: 1, wasser: 0, dampf: 0, phase: "Eis wird erwärmt" };
  if (Q <= q2) { const a = (Q - q1) / Q_SCHMELZ; return { theta: 0, eis: 1 - a, wasser: a, dampf: 0, phase: "Eis schmilzt" }; }
  if (Q <= q3) return { theta: (Q - q2) / C_WASSER, eis: 0, wasser: 1, dampf: 0, phase: "Wasser wird erwärmt" };
  if (Q <= q4) { const a = (Q - q3) / Q_VERDAMPF; return { theta: 100, eis: 0, wasser: 1 - a, dampf: a, phase: "Wasser verdampft" }; }
  return { theta: 100 + (Q - q4) / C_DAMPF, eis: 0, wasser: 0, dampf: 1, phase: "Dampf wird erwärmt" };
}
function renderUebergaenge() {
  const Q = reglerZahl("ue-q");
  setzeText("ue-q-anzeige", `${num(Q)} kJ`);
  const z = zustandBei(Q);
  const svg = flaeche(580, 330, "Erwärmungskurve von 1 kg Wasser");
  const d = diagramm(svg, { name: "kurve", x0: 58, y0: 24, b: 500, h: 210, xmin: 0, xmax: 3200, ymin: -30, ymax: 130, xSchritt: 500, ySchritt: 20, xStellen: 0, yStellen: 0, xName: "zugeführte Energie Q in kJ", yName: "Temperatur ϑ in °C" });
  linienzug(d, KNICKE, { class: "ta-kurve blass", "data-rolle": "ganze-kurve" });
  const weg = KNICKE.filter(([q]) => q < Q).concat([[Q, z.theta]]);
  linienzug(d, weg, { class: "ta-kurve", "data-rolle": "weg" });
  punkt(d, Q, z.theta, "ta-punkt", { "data-rolle": "jetzt" });
  d.g.appendChild(svgText(d.X((KNICKE[1][0] + KNICKE[2][0]) / 2), d.Y(0) - 8, "Schmelzen", { class: "ta-klein" }));
  d.g.appendChild(svgText(d.X((KNICKE[3][0] + KNICKE[4][0]) / 2), d.Y(100) - 8, "Verdampfen (Sieden)", { class: "ta-klein" }));
  // Anteile als Balken unter dem Diagramm.
  const by = 286, bx = 58, bb = 500;
  let x = bx;
  for (const [key, a, name] of [["fest", z.eis, "Eis"], ["fluessig", z.wasser, "Wasser"], ["gas", z.dampf, "Dampf"]]) {
    if (a > 0) svg.appendChild(svgEl("rect", { x: x.toFixed(2), y: by, width: (a * bb).toFixed(3), height: 16, class: `ta-anteil ${key}`, "data-rolle": "anteil", "data-stoff": name }));
    x += a * bb;
  }
  svg.appendChild(svgEl("rect", { x: bx, y: by, width: bb, height: 16, class: "ta-rahmen", "data-rolle": "anteil-rahmen" }));
  svg.appendChild(svgText(bx, by + 34, "Anteile: Eis blau, Wasser türkis, Dampf orange", { class: "ta-klein", "text-anchor": "start" }));
  zeige("ue-mount", svg);
  const pr = (a) => num(a * 100, 1);
  setzeHtml("ue-bilanz",
    `Zugeführt: Q = <strong data-rolle="q">${num(Q)}</strong> kJ — <strong data-rolle="phase">${z.phase}</strong><br>` +
    `Temperatur: ϑ ${zeichen(z.theta, 1)} <strong data-rolle="theta">${num(z.theta, 1)}</strong> °C &nbsp; ` +
    `Eis <span data-rolle="eis">${pr(z.eis)}</span> %, Wasser <span data-rolle="wasser">${pr(z.wasser)}</span> %, Dampf <span data-rolle="dampf">${pr(z.dampf)}</span> %`);
  const plateau = z.phase === "Eis schmilzt" || z.phase === "Wasser verdampft";
  setzeText("ue-text", plateau
    ? `${z.phase}: Die Temperatur bleibt bei ${num(z.theta)} °C, obwohl Energie zugeführt wird — sie löst die Teilchen voneinander.`
    : `${z.phase}: Die zugeführte Energie macht die Teilchen schneller, die Temperatur steigt.`);
}

// ================= 3. Bindungsenergie: die Energiemulde =================

// Energie zweier Teilchen beim Abstand r (in Vielfachen von r0), in Vielfachen der Bindungsenergie:
// tiefster Punkt −1 bei r = 1, für großes r gegen 0. Links steil (Abstoßung), rechts flach (Anziehung).
const MULDE_A = 3;
const mulde = (r) => (1 - Math.exp(-MULDE_A * (r - 1))) ** 2 - 1;
// Umkehrpunkte bei der Energie E = W − 1 (W zugeführt): gerechnet, wo mulde(r) = E.
function umkehrpunkte(W) {
  if (W <= 0) return [1, 1];
  const s = Math.sqrt(W);
  const r1 = 1 - Math.log(1 + s) / MULDE_A;
  const r2 = W < 1 ? 1 - Math.log(1 - s) / MULDE_A : Infinity;
  return [r1, r2];
}
function renderBindung() {
  const W = Math.round(reglerZahl("bi-w") * 100) / 100;
  setzeHtml("bi-w-anzeige", `${num(W, 2)} · E<sub>B</sub>`);
  const E = W - 1;
  const [r1, r2] = umkehrpunkte(W);
  const gebunden = W < 1;
  const svg = flaeche(580, 360, "Energie zweier Teilchen in Abhängigkeit vom Abstand");
  const d = diagramm(svg, { name: "mulde", x0: 58, y0: 24, b: 500, h: 230, xmin: 0, xmax: 3, ymin: -1.2, ymax: 0.6, xSchritt: 0.5, ySchritt: 0.2, xStellen: 1, yStellen: 1, xName: "Abstand r in Vielfachen von r₀", yName: "Energie (Bindungsenergie = 1)" });
  const rStart = 1 - Math.log(1 + Math.sqrt(1.6)) / MULDE_A;   // dort ist die Mulde bei 0,6 — der obere Rand
  linienzug(d, kurvePunkte(mulde, rStart, 3, 200), { class: "ta-kurve", "data-rolle": "mulde" });
  // Bindungsenergie: Tiefe der Mulde, als Pfeil von −1 bis 0.
  d.g.appendChild(svgEl("line", { x1: d.X(2.6), x2: d.X(2.6), y1: d.Y(-1), y2: d.Y(0), class: "ta-pfeil", "data-rolle": "eb" }));
  const eb = svgText(d.X(2.6) + 8, d.Y(-0.5), "E", { class: "ta-text", "text-anchor": "start" });
  const sub = svgEl("tspan", { "baseline-shift": "sub", "font-size": "9" });
  sub.textContent = "B";
  eb.appendChild(sub);
  d.g.appendChild(eb);
  d.g.appendChild(svgEl("line", { x1: d.X(1), x2: d.X(2.6), y1: d.Y(-1), y2: d.Y(-1), class: "ta-ruhe" }));
  d.g.appendChild(svgEl("line", { x1: d.X(1), x2: d.X(1), y1: d.Y(-1.2), y2: d.Y(0.6), class: "ta-ruhe", "data-rolle": "r0" }));
  // Energie des Paars und Umkehrpunkte.
  const rechts = Math.min(r2, 3);
  d.g.appendChild(svgEl("line", { x1: d.X(r1).toFixed(2), x2: d.X(rechts).toFixed(2), y1: d.Y(E).toFixed(2), y2: d.Y(E).toFixed(2), class: "ta-energie", "data-rolle": "energie" }));
  punkt(d, r1, E, "ta-umkehr", { "data-rolle": "umkehr" });
  if (gebunden && r2 <= 3) punkt(d, r2, E, "ta-umkehr", { "data-rolle": "umkehr" });
  const mitte = gebunden ? (r1 + r2) / 2 : null;
  if (gebunden && mitte <= 3) d.g.appendChild(svgEl("line", { x1: d.X(mitte).toFixed(2), x2: d.X(mitte).toFixed(2), y1: d.Y(E).toFixed(2), y2: d.Y(-1.2).toFixed(2), class: "ta-mitte", "data-rolle": "mitte" }));
  // Die beiden Teilchen auf derselben Abstandsachse: A bei r = 0, B an den Umkehrpunkten.
  const ty = 318;
  svg.appendChild(svgEl("circle", { cx: d.X(0), cy: ty, r: 12, class: "ta-teilchen fest" }));
  svg.appendChild(svgText(d.X(0), ty + 4, "A", { class: "ta-text" }));
  const bOrte = gebunden ? [r1, Math.min(r2, 3)] : [r1];
  bOrte.forEach((r) => {
    svg.appendChild(svgEl("circle", { cx: d.X(r).toFixed(2), cy: ty, r: 12, class: "ta-teilchen fluessig", "data-rolle": "b", "data-r": r.toFixed(4) }));
    svg.appendChild(svgText(d.X(r), ty + 4, "B", { class: "ta-text" }));
  });
  if (gebunden && r2 > r1) svg.appendChild(svgEl("line", { x1: d.X(r1).toFixed(2), x2: d.X(Math.min(r2, 3)).toFixed(2), y1: ty - 18, y2: ty - 18, class: "ta-energie" }));
  if (!gebunden) svg.appendChild(svgText(d.X(2.3), ty + 4, "B entfernt sich →", { class: "ta-text" }));
  zeige("bi-mount", svg);
  const r = (x) => num(x, 3);
  setzeHtml("bi-bilanz",
    `zugeführt: W = <strong data-rolle="w">${num(W, 2)}</strong> · E<sub>B</sub> &nbsp; Energie des Paars: E = W − E<sub>B</sub> = <strong data-rolle="e">${num(E, 2)}</strong> · E<sub>B</sub><br>` +
    (W === 0 ? `In Ruhe: B liegt im tiefsten Punkt, r = r₀.` :
      gebunden
        ? `Umkehrpunkte: r₁ ≈ <strong data-rolle="r1">${r(r1)}</strong> · r₀ und r₂ ≈ <strong data-rolle="r2">${r(r2)}</strong> · r₀ &nbsp; ` +
          `Mitte ≈ <strong data-rolle="mitte">${r(mitte)}</strong> · r₀, also <span data-rolle="prozent">${num((mitte - 1) * 100, 1)}</span> % weiter als in Ruhe<br>` +
          `Bis zur Trennung fehlen noch <strong data-rolle="fehlt">${num(1 - W, 2)}</strong> · E<sub>B</sub>.`
        : `Die Energie reicht, die Bindung zu lösen: Teilchen B entfernt sich. Nötig war mindestens die Bindungsenergie E<sub>B</sub>.`));
  setzeText("bi-text", W === 0
    ? "Ohne zugeführte Energie liegt B ruhig im tiefsten Punkt der Mulde."
    : gebunden
      ? `B schwingt zwischen den Umkehrpunkten hin und her. Nach innen kommt es ${r(1 - r1)} · r₀ weit, nach außen ${r(r2 - 1)} · r₀ — die Mitte liegt außerhalb von r₀: Der Abstand wächst.`
      : "Die Energie liegt über der Nulllinie: B kehrt nicht mehr um. So lösen sich beim Verdampfen die Teilchen voneinander.");
}

// ================= 4. Feste Körper =================

const ALPHA = { aluminium: ["Aluminium", 0.023], kupfer: ["Kupfer", 0.017], stahl: ["Stahl", 0.012], beton: ["Beton", 0.012], glas: ["Glas", 0.009] };
const UEBERHOEHT = 100;   // Längenänderung in der Zeichnung 100-fach vergrößert, sonst wäre sie unsichtbar
function renderFest() {
  const [stoff, alpha] = ALPHA[wahl("fe-stoff")];
  const L0 = reglerZahl("fe-l"), dT = reglerZahl("fe-dt");
  setzeText("fe-l-anzeige", `${num(L0)} m`);
  setzeText("fe-dt-anzeige", `${num(dT)} K`);
  const dL = alpha * L0 * dT;               // in mm
  const L = L0 + dL / 1000;                 // in m
  const svg = flaeche(580, 200, "Ein Stab vor und nach dem Erwärmen");
  const x0 = 40, B0 = 400;
  const Bneu = B0 * (1 + (UEBERHOEHT * dL) / (1000 * L0));
  svg.appendChild(svgEl("rect", { x: x0, y: 30, width: B0, height: 26, class: "ta-stab alt", "data-rolle": "stab-alt" }));
  svg.appendChild(svgText(x0, 22, `vorher: L₀ = ${num(L0)} m`, { class: "ta-text", "text-anchor": "start" }));
  svg.appendChild(svgEl("rect", { x: x0, y: 96, width: Bneu.toFixed(3), height: 26, class: "ta-stab neu", "data-rolle": "stab-neu" }));
  svg.appendChild(svgText(x0, 88, `nach Erwärmen um ${num(dT)} K`, { class: "ta-text", "text-anchor": "start" }));
  svg.appendChild(svgEl("line", { x1: x0 + B0, x2: x0 + B0, y1: 24, y2: 130, class: "ta-ruhe" }));
  if (dT > 0) {
    svg.appendChild(svgEl("line", { x1: x0 + B0, x2: (x0 + Bneu).toFixed(2), y1: 136, y2: 136, class: "ta-mass", "data-rolle": "dl" }));
    svg.appendChild(svgText((x0 + B0 + x0 + Bneu) / 2, 154, "ΔL", { class: "ta-text" }));
  }
  svg.appendChild(svgText(x0, 186, `ΔL in der Zeichnung ${UEBERHOEHT}-fach vergrößert`, { class: "ta-klein", "text-anchor": "start", "data-rolle": "ueberhoehung" }));
  zeige("fe-mount", svg);
  setzeHtml("fe-bilanz",
    `${stoff}: α = ${num(alpha, 3)} ${bruch("mm", "m · K")}<br>` +
    `ΔL = α · L₀ · ΔT = ${num(alpha, 3)} ${bruch("mm", "m · K")} · ${num(L0)} m · ${num(dT)} K ${zeichen(dL, 3)} <strong data-rolle="dl">${num(dL, 3)}</strong> mm<br>` +
    `L = L₀ + ΔL ${zeichen(L, 6)} <strong data-rolle="l">${num(L, 6)}</strong> m`);
  setzeText("fe-text", dT === 0
    ? "Ohne Temperaturänderung bleibt der Stab, wie er ist."
    : `Der ${stoff.toLowerCase() === "glas" ? "Glasstab" : stoff + "stab"} wird um ${num(dL, 1)} mm länger — bei ${num(L0)} m Länge kaum zu sehen, für eine Brücke oder Schiene aber wichtig.`);
}

// ================= 5. Flüssigkeiten: das Thermometer =================

const GAMMA = { ethanol: ["Ethanol", 1.1], benzin: ["Benzin", 1.0], glycerin: ["Glycerin", 0.5], wasser: ["Wasser", 0.21], quecksilber: ["Quecksilber", 0.18] };
function renderFluessig() {
  const [stoff, gamma] = GAMMA[wahl("fl-stoff")];
  const V0 = Math.round(reglerZahl("fl-v") * 10) / 10, A = Math.round(reglerZahl("fl-a") * 100) / 100, dT = reglerZahl("fl-dt");
  setzeText("fl-v-anzeige", `${num(V0, 1)} ml`);
  setzeText("fl-a-anzeige", `${num(A, 2)} mm²`);
  setzeText("fl-dt-anzeige", `${num(dT)} K`);
  const dV = gamma * V0 * dT;       // in mm³: γ in ml/(l·K) · V0 in ml · ΔT in K
  const h = dV / A;                 // in mm
  const svg = flaeche(320, 330, "Flüssigkeitsthermometer");
  // Maßstab: 1 mm Steighöhe = 1 Bildpunkt. Die Skala trägt ihre Werte (data-wert) für die Prüfung.
  const kx = 150, kb = 10, boden = 270, start = 18;          // start: Füllstand vor dem Erwärmen über der Kugel
  const Y = (mm) => boden - start - mm;
  svg.appendChild(svgEl("circle", { cx: kx + kb / 2, cy: boden + 22, r: 26, class: "ta-fluessigkeit" }));
  svg.appendChild(svgEl("circle", { cx: kx + kb / 2, cy: boden + 22, r: 26, class: "ta-glas" }));
  svg.appendChild(svgEl("rect", { x: kx, y: (Y(h)).toFixed(3), width: kb, height: (boden - Y(h)).toFixed(3), class: "ta-fluessigkeit", "data-rolle": "saeule" }));
  svg.appendChild(svgEl("path", { d: `M ${kx} ${boden} L ${kx} ${Y(232)} M ${kx + kb} ${boden} L ${kx + kb} ${Y(232)}`, class: "ta-glas" }));
  svg.appendChild(svgEl("line", { x1: kx - 22, x2: kx + kb + 22, y1: Y(0), y2: Y(0), class: "ta-fluessigkeit alt", "data-rolle": "start" }));
  svg.appendChild(svgText(kx - 26, Y(0) + 4, "vorher", { class: "ta-klein", "text-anchor": "end" }));
  for (let mm = 0; mm <= 230; mm += 10) {
    const lang = mm % 50 === 0;
    svg.appendChild(svgEl("line", { x1: kx + kb + 4, x2: kx + kb + (lang ? 16 : 10), y1: Y(mm), y2: Y(mm), class: "ta-skala", "data-wert": String(mm) }));
    if (lang) svg.appendChild(svgText(kx + kb + 20, Y(mm) + 4, `${mm} mm`, { class: "ta-klein", "text-anchor": "start" }));
  }
  if (h > 0) svg.appendChild(svgText(kx - 10, Y(h) + 4, `+ ${num(h, 1)} mm`, { class: "ta-text", "text-anchor": "end" }));
  zeige("fl-mount", svg);
  setzeHtml("fl-bilanz",
    `${stoff}: γ = ${num(gamma, 2)} ${bruch("ml", "l · K")}<br>` +
    `ΔV = γ · V₀ · ΔT = ${num(gamma, 2)} · ${num(V0, 1)} · ${num(dT)} ${zeichen(dV, 3)} <strong data-rolle="dv">${num(dV, 3)}</strong> mm³<br>` +
    `h = ΔV : A = ${num(dV, 3)} mm³ : ${num(A, 2)} mm² ${zeichen(h, 2)} <strong data-rolle="h">${num(h, 2)}</strong> mm &nbsp; ` +
    `je Kelvin: <strong data-rolle="je-k">${num(gamma * V0 / A, 3)}</strong> mm`);
  setzeText("fl-text", dT === 0
    ? "Ohne Erwärmung bleibt die Säule beim Strich „vorher“."
    : `Das zusätzliche Volumen von ${num(dV, 1)} mm³ passt nur in die Kapillare — dort steigt die Säule um ${num(h, 1)} mm.`);
}

// ================= Gemeinsam für die Gasgesetze =================

const V0_GL = 1.0;   // Liter bei 0 °C (Gay-Lussac)
const P1 = 1.0, V1 = 2.0, THETA1 = 20;    // Boyle-Mariotte und Gasgleichung: Anfangszustand
const PA0 = 1.0, THETA_A0 = 20;            // Amontons: 1,0 bar bei 20 °C

// ================= 6. Gay-Lussac und Kelvin =================

function renderGayLussac() {
  const theta = reglerZahl("gl-theta");
  setzeText("gl-theta-anzeige", `${num(theta)} °C`);
  const T = kelvin(theta), V = (V0_GL * T) / T0;
  const svg = flaeche(600, 330, "Gas bei gleichem Druck: Volumen und Temperatur");
  zylinder(svg, 30, 280, 90, 100 * V, 200, { beschriftung: [`ϑ = ${num(theta)} °C`, `V ≈ ${num(V, 2)} l`] });
  const d = diagramm(svg, { name: "gay-lussac", x0: 200, y0: 24, b: 380, h: 240, xmin: -300, xmax: 200, ymin: 0, ymax: 2, xSchritt: 50, ySchritt: 0.25, xStellen: 0, yStellen: 2, xName: "ϑ in °C", yName: "V in l" });
  const gerade = (t) => (V0_GL * kelvin(t)) / T0;
  linienzug(d, [[-T0, 0], [-100, gerade(-100)]], { class: "ta-kurve extra", "data-rolle": "verlaengert" });
  linienzug(d, [[-100, gerade(-100)], [200, gerade(200)]], { class: "ta-kurve", "data-rolle": "gemessen" });
  punkt(d, -T0, 0, "ta-umkehr", { "data-rolle": "nullpunkt" });
  d.g.appendChild(svgText(d.X(-T0) + 6, d.Y(0) - 10, "−273,15 °C", { class: "ta-klein", "text-anchor": "start" }));
  punkt(d, theta, V, "ta-punkt", { "data-rolle": "jetzt" });
  zeige("gl-mount", svg);
  setzeHtml("gl-bilanz",
    `T = ϑ + 273,15 K = <strong data-rolle="t">${num(T, 2)}</strong> K<br>` +
    `V = 1 l · ${bruch(num(T, 2) + " K", "273,15 K")} ${zeichen(V, 4)} <strong data-rolle="v">${num(V, 4)}</strong> l<br>` +
    `${bruch("V", "T")} = ${bruch(num(V, 4) + " l", num(T, 2) + " K")} ${zeichen(V / T, 6)} <strong data-rolle="v-durch-t">${num(V / T, 6)}</strong> ${bruch("l", "K")} — bei jeder Temperatur gleich`);
  setzeText("gl-text", `Bei ${num(theta)} °C nimmt das Gas ${num(V, 2)} l ein. Je Kelvin ändert sich das Volumen um 1 : 273,15 des Volumens bei 0 °C — bei −273,15 °C wäre es null.`);
}

// ================= 7. Boyle-Mariotte =================

function renderBoyle() {
  const V = Math.round(reglerZahl("bm-v") * 10) / 10;
  setzeText("bm-v-anzeige", `${num(V, 1)} l`);
  const p = (P1 * V1) / V;
  const svg = flaeche(600, 330, "Gas bei gleicher Temperatur: Druck und Volumen");
  zylinder(svg, 30, 280, 90, 50 * V, 210, { beschriftung: [`V = ${num(V, 1)} l`, `p ≈ ${num(p, 2)} bar`] });
  const d = diagramm(svg, { name: "boyle", x0: 200, y0: 24, b: 380, h: 240, xmin: 0, xmax: 4.5, ymin: 0, ymax: 4.5, xSchritt: 0.5, ySchritt: 0.5, xStellen: 1, yStellen: 1, xName: "V in l", yName: "p in bar" });
  // Die Rechtecke unter der Hyperbel: am Anfang gestrichelt, jetzt grün — gleicher Flächeninhalt p · V.
  const rechteck = (v, q, attrs) => d.g.appendChild(svgEl("rect", Object.assign({ x: d.X(0).toFixed(2), y: d.Y(q).toFixed(2), width: (d.X(v) - d.X(0)).toFixed(3), height: (d.Y(0) - d.Y(q)).toFixed(3) }, attrs)));
  rechteck(V1, P1, { class: "ta-flaeche alt", "data-rolle": "rechteck-anfang" });
  rechteck(V, p, { class: "ta-flaeche", "data-rolle": "rechteck" });
  linienzug(d, kurvePunkte((v) => (P1 * V1) / v, (P1 * V1) / 4.5, 4.5, 200), { class: "ta-kurve", "data-rolle": "hyperbel" });
  punkt(d, V1, P1, "ta-punkt anfang", { "data-rolle": "anfang" });
  punkt(d, V, p, "ta-punkt", { "data-rolle": "jetzt" });
  zeige("bm-mount", svg);
  setzeHtml("bm-bilanz",
    `p = ${bruch("p₁ · V₁", "V")} = ${bruch("1,0 bar · 2,0 l", num(V, 1) + " l")} ${zeichen(p, 4)} <strong data-rolle="p">${num(p, 4)}</strong> bar<br>` +
    `p · V = ${num(p, 4)} bar · ${num(V, 1)} l ${zeichen(p * V, 4)} <strong data-rolle="pv">${num(p * V, 4)}</strong> bar · l — so viel wie am Anfang: 1,0 bar · 2,0 l = 2,0 bar · l`);
  setzeText("bm-text", V < V1
    ? `Zusammengedrückt auf ${num(V, 1)} l: Die Teilchen haben weniger Platz und treffen öfter auf die Wände — der Druck steigt auf ${num(p, 2)} bar.`
    : V > V1
      ? `Auseinandergezogen auf ${num(V, 1)} l: Die Teilchen treffen seltener auf die Wände — der Druck sinkt auf ${num(p, 2)} bar.`
      : "Das ist der Anfangszustand: 2,0 l bei 1,0 bar.");
}

// ================= 8. Amontons =================

function renderAmontons() {
  const theta = reglerZahl("am-theta");
  setzeText("am-theta-anzeige", `${num(theta)} °C`);
  const T = kelvin(theta), TA = kelvin(THETA_A0), p = (PA0 * T) / TA;
  const svg = flaeche(600, 330, "Gas bei gleichem Volumen: Druck und Temperatur");
  zylinder(svg, 30, 280, 90, 120, 120, { kolben: false, beschriftung: [`ϑ = ${num(theta)} °C`, `p ≈ ${num(p, 2)} bar`] });
  // Manometer als Säule: 100 Bildpunkte je bar.
  svg.appendChild(svgEl("rect", { x: 140, y: (280 - 100 * p).toFixed(3), width: 14, height: (100 * p).toFixed(3), class: "ta-fluessigkeit", "data-rolle": "manometer", "data-hoehe-px": (100 * p).toFixed(3) }));
  svg.appendChild(svgEl("rect", { x: 140, y: 80, width: 14, height: 200, class: "ta-glas" }));
  const d = diagramm(svg, { name: "amontons", x0: 200, y0: 24, b: 380, h: 240, xmin: 0, xmax: 600, ymin: 0, ymax: 2, xSchritt: 100, ySchritt: 0.25, xStellen: 0, yStellen: 2, xName: "T in K", yName: "p in bar" });
  const gerade = (Tk) => (PA0 * Tk) / TA;
  linienzug(d, [[0, 0], [kelvin(-50), gerade(kelvin(-50))]], { class: "ta-kurve extra", "data-rolle": "verlaengert" });
  linienzug(d, [[kelvin(-50), gerade(kelvin(-50))], [kelvin(250), gerade(kelvin(250))]], { class: "ta-kurve", "data-rolle": "gemessen" });
  punkt(d, 0, 0, "ta-umkehr", { "data-rolle": "nullpunkt" });
  d.g.appendChild(svgText(d.X(0) + 8, d.Y(0) - 10, "0 K", { class: "ta-klein", "text-anchor": "start" }));
  for (const c of [0, 100]) d.g.appendChild(svgText(d.X(kelvin(c)), d.Y(0) - 6, `${c} °C`, { class: "ta-klein" }));
  punkt(d, T, p, "ta-punkt", { "data-rolle": "jetzt" });
  zeige("am-mount", svg);
  setzeHtml("am-bilanz",
    `T = <strong data-rolle="t">${num(T, 2)}</strong> K &nbsp; p = 1,0 bar · ${bruch(num(T, 2) + " K", "293,15 K")} ${zeichen(p, 4)} <strong data-rolle="p">${num(p, 4)}</strong> bar<br>` +
    `${bruch("p", "T")} ${zeichen(p / T, 6)} <strong data-rolle="p-durch-t">${num(p / T, 6)}</strong> ${bruch("bar", "K")} — bei jeder Temperatur gleich`);
  setzeText("am-text", `Bei ${num(theta)} °C herrscht in der Dose ein Druck von ${num(p, 2)} bar. Die Gerade im Diagramm geht durch 0 K, nicht durch 0 °C.`);
}

// ================= 9. Allgemeine Gasgleichung =================

function renderGasgleichung() {
  const V2 = Math.round(reglerZahl("gg-v2") * 10) / 10, theta2 = reglerZahl("gg-theta2"), s = reglerZahl("gg-s");
  setzeText("gg-v2-anzeige", `${num(V2, 1)} l`);
  setzeText("gg-theta2-anzeige", `${num(theta2)} °C`);
  setzeText("gg-s-anzeige", s <= 100 ? `Schritt 1: ${s} %` : `Schritt 2: ${s - 100} %`);
  const T1 = kelvin(THETA1), T2 = kelvin(theta2);
  const pStern = (P1 * V1) / V2, p2 = (pStern * T2) / T1;
  let V, T, p;
  if (s <= 100) { V = V1 + ((V2 - V1) * s) / 100; T = T1; p = (P1 * V1) / V; }
  else { V = V2; T = T1 + ((T2 - T1) * (s - 100)) / 100; p = (pStern * T) / T1; }
  document.querySelectorAll("#gg-schritte li").forEach((li) => li.classList.toggle("aktiv", (li.dataset.schritt === "1") === (s <= 100)));
  const svg = flaeche(600, 340, "Zwei Schritte vom Zustand 1 zum Zustand 2");
  zylinder(svg, 30, 280, 90, 60 * V, 210, { beschriftung: [`ϑ ≈ ${num(T - T0, 1)} °C`, `p ≈ ${num(p, 2)} bar`] });
  const d = diagramm(svg, { name: "gasgleichung", x0: 200, y0: 24, b: 380, h: 240, xmin: 0, xmax: 3.5, ymin: 0, ymax: 3, xSchritt: 0.5, ySchritt: 0.5, xStellen: 1, yStellen: 1, xName: "V in l", yName: "p in bar" });
  // Die beiden Isothermen (gleiche Temperatur) als Hilfslinien.
  linienzug(d, kurvePunkte((v) => (P1 * V1) / v, (P1 * V1) / 3, 3.5, 160), { class: "ta-kurve blass", "data-rolle": "isotherme-1" });
  linienzug(d, kurvePunkte((v) => (P1 * V1 * T2) / (T1 * v), (P1 * V1 * T2) / (T1 * 3), 3.5, 160), { class: "ta-kurve blass", "data-rolle": "isotherme-2" });
  // Die obere Isotherme wird über, die untere unter ihrer Linie beschriftet — sonst lägen die beiden
  // Namen bei nahen Temperaturen übereinander.
  const oben = T2 >= T1;
  d.g.appendChild(svgText(d.X(3.45), d.Y((P1 * V1) / 3.45) + (oben ? 14 : -6), "T₁", { class: "ta-klein", "text-anchor": "end" }));
  d.g.appendChild(svgText(d.X(3.45), d.Y((P1 * V1 * T2) / (T1 * 3.45)) + (oben ? -6 : 14), "T₂", { class: "ta-klein", "text-anchor": "end" }));
  // Der zurückgelegte Weg: erst auf der Isotherme T₁, dann senkrecht bei V₂.
  const vBis = s <= 100 ? V : V2;
  const weg = kurvePunkte((v) => (P1 * V1) / v, V1, vBis, 80);
  if (s > 100) weg.push([V2, p]);
  linienzug(d, weg, { class: "ta-kurve weg", "data-rolle": "weg" });
  punkt(d, V1, P1, "ta-punkt anfang", { "data-rolle": "anfang" });
  if (s >= 100) punkt(d, V2, pStern, "ta-punkt zwischen", { "data-rolle": "zwischen" });
  punkt(d, V, p, "ta-punkt", { "data-rolle": "jetzt" });
  zeige("gg-mount", svg);
  const k1 = (P1 * V1) / T1;
  setzeHtml("gg-bilanz",
    `Zustand 1: p₁ = 1,0 bar, V₁ = 2,0 l, T₁ = 293,15 K &nbsp; ${bruch("p₁ · V₁", "T₁")} ${zeichen(k1, 6)} <strong data-rolle="k1">${num(k1, 6)}</strong> ${bruch("bar · l", "K")}<br>` +
    `Jetzt: p ${zeichen(p, 4)} <strong data-rolle="p">${num(p, 4)}</strong> bar, V = <strong data-rolle="v">${num(V, 2)}</strong> l, T = <strong data-rolle="t">${num(T, 2)}</strong> K &nbsp; ` +
    `${bruch("p · V", "T")} ${zeichen((p * V) / T, 6)} <strong data-rolle="k">${num((p * V) / T, 6)}</strong> ${bruch("bar · l", "K")}<br>` +
    `Zwischenzustand: p* = ${bruch("p₁ · V₁", "V₂")} ${zeichen(pStern, 4)} <strong data-rolle="p-stern">${num(pStern, 4)}</strong> bar &nbsp; ` +
    `Ende: p₂ = p* · ${bruch("T₂", "T₁")} ${zeichen(p2, 4)} <strong data-rolle="p2">${num(p2, 4)}</strong> bar`);
  setzeText("gg-text", s === 0
    ? "Zustand 1. Zieh am Regler „Weg“: Zuerst ändert sich das Volumen bei gleicher Temperatur."
    : s < 100
      ? "Schritt 1: Die Temperatur bleibt T₁ — der Punkt wandert auf der Isotherme T₁ (Boyle-Mariotte), p · V bleibt gleich."
      : s === 100
        ? `Zwischenzustand: V₂ ist erreicht, die Temperatur ist noch T₁; der Druck ist p* ≈ ${num(pStern, 2)} bar.`
        : s < 200
          ? "Schritt 2: Das Volumen bleibt V₂ — der Punkt wandert senkrecht (Amontons), p : T bleibt gleich."
          : `Zustand 2 erreicht: p₂ ≈ ${num(p2, 2)} bar. p · V : T hat sich auf dem ganzen Weg nicht geändert.`);
}

// ================= Kontrollfragen =================

const QUIZZE = {
  "quiz-teilchen": {
    q: "Ein Eisblock wird von −20 °C auf −5 °C erwärmt. Was ändert sich im Teilchenmodell?",
    options: ["Die Teilchen werden größer", "Die Teilchen verlassen ihre Gitterplätze", "Die Teilchen schwingen heftiger um ihre Plätze", "Die Teilchen bewegen sich langsamer"],
    correct: 2,
    explain: "Das Eis bleibt fest, die Teilchen bleiben auf ihren Gitterplätzen — aber sie schwingen heftiger, weil sie mehr Energie haben. Größer werden die Teilchen nie; ihre Plätze verlassen sie erst beim Schmelzen.",
  },
  "quiz-uebergaenge": {
    q: "Wasser siedet und wird weiter erhitzt. Was geschieht mit seiner Temperatur, solange noch Wasser im Topf ist?",
    options: ["Sie bleibt bei 100 °C", "Sie steigt langsam weiter", "Sie sinkt, weil Dampf entweicht", "Sie springt auf 120 °C"],
    correct: 0,
    explain: "Solange Wasser verdampft, geht die zugeführte Energie in das Lösen der Teilchen voneinander — die Temperatur bleibt bei 100 °C (waagerechtes Stück der Kurve). Erst wenn alles verdampft ist, steigt sie wieder.",
  },
  "quiz-bindung": {
    q: "Warum dehnt sich ein Stoff beim Erwärmen aus?",
    options: ["Die Teilchen werden beim Erwärmen größer", "Die Bindungsenergie wird kleiner", "Es kommen Teilchen hinzu", "Die Teilchen schwingen weiter, nach außen aber weiter als nach innen"],
    correct: 3,
    explain: "Die Energiemulde ist links steil und rechts flach. Mit mehr Energie schwingen die Teilchen weiter — nach außen weiter als nach innen. Die Mitte der Schwingung wandert nach außen, der mittlere Abstand wächst. Die Teilchen selbst und die Bindungsenergie ändern sich nicht.",
  },
  "quiz-fest": {
    q: "Eine 50 m lange Aluminiumleitung (α = 0,023 mm/(m · K)) erwärmt sich um 30 K. Um wie viel wird sie länger?",
    options: ["0,0345 mm", "34,5 mm", "34,5 m", "1,15 mm"],
    correct: 1,
    explain: "ΔL = α · L₀ · ΔT = 0,023 mm/(m · K) · 50 m · 30 K = 34,5 mm. 1,15 mm wäre die Verlängerung bei nur 1 K, und 34,5 m hätte die Einheit falsch: Mit α in mm/(m · K) kommt ΔL in Millimetern heraus.",
  },
  "quiz-fluessig": {
    q: "Ein Thermometer bekommt eine Kapillare mit halb so großem Querschnitt. Was geschieht bei derselben Erwärmung?",
    options: ["Die Säule steigt gleich hoch", "Die Säule steigt halb so hoch", "Die Säule steigt doppelt so hoch", "Die Flüssigkeit dehnt sich doppelt so stark aus"],
    correct: 2,
    explain: "Das zusätzliche Volumen ΔV = γ · V₀ · ΔT hängt nicht von der Kapillare ab. Verteilt auf den halben Querschnitt wird die Säule doppelt so hoch: h = ΔV : A. Deshalb sind Thermometerkapillaren so dünn.",
  },
  "quiz-gay-lussac": {
    q: "Ein Gas hat bei 27 °C ein Volumen von 3,0 l. Wie groß ist es bei 127 °C, wenn der Druck gleich bleibt?",
    options: ["≈ 4,0 l", "≈ 14,1 l", "≈ 3,3 l", "≈ 2,25 l"],
    correct: 0,
    explain: "In Kelvin: T₁ = 300,15 K, T₂ = 400,15 K. V₂ = 3,0 l · 400,15 : 300,15 ≈ 4,0 l. 14,1 l entsteht, wenn man mit Grad Celsius rechnet (127 : 27), 2,25 l, wenn man den Bruch umdreht.",
  },
  "quiz-boyle": {
    q: "In einer Spritze sind 60 ml Luft bei 1,0 bar. Die Öffnung wird zugehalten und der Kolben bis 20 ml gedrückt. Wie groß ist der Druck bei gleicher Temperatur?",
    options: ["≈ 0,33 bar", "1,0 bar", "2,0 bar", "3,0 bar"],
    correct: 3,
    explain: "p₁ · V₁ = p₂ · V₂: 1,0 bar · 60 ml = p₂ · 20 ml, also p₂ = 3,0 bar. Ein Drittel des Volumens, dreimal der Druck. 0,33 bar entsteht, wenn man das Verhältnis umdreht.",
  },
  "quiz-amontons": {
    q: "Ein Autoreifen hat bei 7 °C einen Druck von 2,0 bar. Nach der Fahrt ist er 35 °C warm. Welcher Druck herrscht ungefähr (gleiches Volumen)?",
    options: ["≈ 10 bar", "≈ 2,2 bar", "≈ 1,8 bar", "2,0 bar"],
    correct: 1,
    explain: "T₁ = 280,15 K, T₂ = 308,15 K: p₂ = 2,0 bar · 308,15 : 280,15 ≈ 2,2 bar. 10 bar entsteht mit Grad Celsius (35 : 7 = 5), 1,8 bar mit dem umgedrehten Bruch.",
  },
  "quiz-gasgleichung": {
    q: "Ein Gas wird auf das halbe Volumen zusammengedrückt und dabei von 300 K auf 600 K erwärmt. Wie ändert sich der Druck?",
    options: ["Er bleibt gleich", "Er verdoppelt sich", "Er vervierfacht sich", "Er halbiert sich"],
    correct: 2,
    explain: "p₂ = p₁ · (V₁ : V₂) · (T₂ : T₁) = p₁ · 2 · 2 = 4 · p₁. Das halbe Volumen verdoppelt den Druck (Schritt 1), die doppelte Temperatur verdoppelt ihn noch einmal (Schritt 2).",
  },
};

// ================= Start =================

const REGLER = [
  [["tc-t"], renderTeilchen],
  [["ue-q"], renderUebergaenge],
  [["bi-w"], renderBindung],
  [["fe-stoff", "fe-l", "fe-dt"], renderFest],
  [["fl-stoff", "fl-v", "fl-a", "fl-dt"], renderFluessig],
  [["gl-theta"], renderGayLussac],
  [["bm-v"], renderBoyle],
  [["am-theta"], renderAmontons],
  [["gg-v2", "gg-theta2", "gg-s"], renderGasgleichung],
];
for (const [ids, render] of REGLER) {
  ids.forEach((id) => {
    const e = document.getElementById(id);
    e.addEventListener(e.tagName === "SELECT" ? "change" : "input", render);
    if (e.tagName === "SELECT") e.addEventListener("input", render);
  });
  render();
}
document.getElementById("tc-play").addEventListener("click", abspielenUmschalten);
mountQuizze(QUIZZE);
mountUebungsaufgaben(document.getElementById("exercises-mount"), AUFGABEN);
