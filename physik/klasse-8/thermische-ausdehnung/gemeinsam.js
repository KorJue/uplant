// Gemeinsame Bausteine der drei Seiten „Thermische Ausdehnung“ (Physik, Klasse 8): physikalische
// Größen, Diagramme mit rücklesbarem Maßstab und der Zylinder mit Kolben. Gerechnet wird mit
// Reglerwerten, nie mit Bildschirmkoordinaten; Gitterlinien tragen data-wert (y), Achsenmarken
// data-wert-x (x) — daraus liest die Prüfung den Maßstab zurück.

import { svgEl, svgText, num } from "./seite.js?v=1";

// ---------- Physikalische Größen ----------

export const T0 = 273.15;                 // 0 °C in Kelvin
export const R_GAS = 8.314462618;         // J/(mol · K)
export const M_WASSER = 0.018015;         // kg/mol
// Mittlere Geschwindigkeit der Wassermoleküle bei der Temperatur ϑ (in °C).
export const vMittel = (theta) => Math.sqrt((8 * R_GAS * (theta + T0)) / (Math.PI * M_WASSER));
export const kelvin = (theta) => theta + T0;
export const runde = (x, st) => Math.round(x * 10 ** st) / 10 ** st;
export const bruch = (z, n) => `<span class="bruch"><span class="z">${z}</span><span class="n">${n}</span></span>`;

// ---------- Diagramme ----------

// Ein Diagramm in einer Zeichenfläche: Weltkoordinaten → Bildpunkte. Gitterlinien mit data-wert,
// Marken an der x-Achse mit data-wert-x, alles in einer Gruppe data-diagramm.
export function diagramm(svg, o) {
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
  // ohneX: Balkendiagramm — die x-Achse trägt Namen statt Zahlen, die Marken gehören nicht hin.
  for (let i = Math.ceil(xmin / o.xSchritt - 1e-9); !o.ohneX && i * o.xSchritt <= xmax + 1e-9; i++) {
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
export function linienzug(d, pts, attrs) {
  const p = pts.map(([x, y], i) => `${i ? "L" : "M"} ${d.X(x).toFixed(2)} ${d.Y(y).toFixed(2)}`).join(" ");
  d.g.appendChild(svgEl("path", Object.assign({ d: p }, attrs)));
}
export function kurvePunkte(f, a, b, n = 160) {
  return Array.from({ length: n + 1 }, (_, i) => { const x = a + ((b - a) * i) / n; return [x, f(x)]; });
}
export function punkt(d, x, y, klasse, attrs = {}) {
  d.g.appendChild(svgEl("circle", Object.assign({ cx: d.X(x).toFixed(2), cy: d.Y(y).toFixed(2), r: 5, class: klasse }, attrs)));
}

// Ein Zylinder mit Gas und Kolben: Boden bei y = boden, Gashöhe in Bildpunkten. Fest (ohne Kolben)
// für die verschlossene Dose. data-hoehe-px trägt die gezeichnete Gashöhe für die Prüfung.
export function zylinder(svg, x, boden, breite, hoeheGas, hoeheAussen, { kolben = true, beschriftung = [] } = {}) {
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

