// Selbstlernpfad „Normalverteilung“ (MSS 13, Wahrscheinlichkeitsrechnung, Thema 6).
// Rein clientseitiges Vanilla-JS, ohne Build-Schritt.
//
// Didaktische Reihenfolge nach Bigalke/Köhler — jede Stufe benutzt nur, was davor steht:
//   1. Histogramme großer Ketten: wandern, breiter, flacher   (Binomialverteilung aus Thema 5)
//   2. Standardisieren in drei Schritten                     (braucht nur μ und σ aus 1)
//   3. Die Glockenkurve φ als gemeinsame Grenzkurve           (vergleicht die Ergebnisse von 2)
//   4. Lokale Näherungsformel                                 (macht Schritt 3 aus 2 rückgängig)
//   5. Globale Näherungsformel mit Φ                          (Säulenflächen aus 2 als Integral)
//   6. Normalverteilung, σ-Regeln                             (2 rückwärts auf eine stetige Größe)
//   7. Φ rückwärts: Grenze, μ oder σ gesucht                  (Umkehrung von 6)
//
// Schreibweise: B(n; p; k) und F(n; p; k) wie in Thema 5 (Bigalke/Köhler), φ und Φ für die
// Glockenfunktion und ihre Integralfunktion. Die Übungsaufgaben stehen in aufgaben-normal.js.
//
// Gerechnet wird mit den Reglerwerten, nie mit Bildschirmkoordinaten. Die Zeichnungen sind Anzeige:
// Gitterlinien tragen ihren y-Wert (data-wert), Marken an der x-Achse ihren x-Wert (data-wert-x).
// Die Prüfung rechnet daraus den Maßstab zurück und liest Säulen, Kurven und Flächen aus dem SVG.
//
// Farbcodierung wie in Thema 5: gesuchte Fläche und beobachtete Säule grün, Glockenkurve blau,
// μ violett, σ und Grenzen rot, Ausgangslage grau gestrichelt.

import { mountUebungsaufgaben } from "../../../aufgaben.js?v=2";
import { AUFGABEN, parseZahl } from "./aufgaben-normal.js?v=1";

// ---------- Helfer ----------

const SVG_NS = "http://www.w3.org/2000/svg";
function svgEl(tag, attrs = {}) {
  const e = document.createElementNS(SVG_NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  return e;
}
function svgText(x, y, text, attrs = {}) {
  const t = svgEl("text", Object.assign({ x: Number(x).toFixed(2), y: Number(y).toFixed(2), "text-anchor": "middle" }, attrs));
  t.textContent = text;
  return t;
}
function el(tag, attrs = {}, children = []) {
  const e = document.createElement(tag);
  for (const k in attrs) {
    if (k === "class") e.className = attrs[k];
    else if (k === "html") e.innerHTML = attrs[k];
    else e.setAttribute(k, attrs[k]);
  }
  (Array.isArray(children) ? children : [children]).forEach((c) => {
    if (c == null) return;
    e.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  });
  return e;
}
// Ein Zahlformat je Stellenzahl, einmal angelegt — toLocaleString() baut sonst bei jeder
// Reglerbewegung dutzendfach ein neues Intl.NumberFormat.
const ZAHLFORMATE = new Map();
function zahlformat(stellen) {
  let f = ZAHLFORMATE.get(stellen);
  if (!f) ZAHLFORMATE.set(stellen, (f = new Intl.NumberFormat("de-DE", { maximumFractionDigits: stellen })));
  return f;
}
// Deutsche Schreibweise, echtes Minuszeichen. Gerundet wird VOR der Ausgabe, damit −0,00001 nicht
// als „−0“ erscheint.
function num(x, stellen = 4) {
  const f = Math.pow(10, stellen);
  const g = Math.round(x * f) / f;
  return zahlformat(stellen).format(g === 0 ? 0 : g).replace("-", "−");
}
// „=“ oder „≈“: Entscheidend ist, ob die Anzeige mit dieser Stellenzahl den Wert genau trifft.
function zeichen(x, stellen = 4) {
  const f = Math.pow(10, stellen);
  return Math.abs(x - Math.round(x * f) / f) < 1e-12 ? "=" : "≈";
}
function bruch(z, n, klasse = "") {
  return `<span class="bruch ${klasse}"><span class="z">${z}</span><span class="n">${n}</span></span>`;
}
function reglerZahl(id) {
  return Number(document.getElementById(id).value);
}
// Reglerwerte wie 0,3 kommen als 0.30000000000000004 an — auf das Raster des Reglers runden.
function reglerP(id) {
  return Math.round(reglerZahl(id) * 100) / 100;
}
// Schreibt einen begrenzten Reglerwert in den Regler zurück: Ein Regler darf nie etwas anderes
// anzeigen als das, womit gerechnet wird.
function begrenzt(id, wert, min, max) {
  const v = Math.min(max, Math.max(min, wert));
  const e = document.getElementById(id);
  if (Number(e.value) !== v) e.value = String(v);
  return v;
}
function setzeAnzeige(id, text) {
  document.getElementById(id).textContent = text;
}
function setzeHtml(id, html) {
  document.getElementById(id).innerHTML = html;
}
function zeige(mountId, knoten) {
  const m = document.getElementById(mountId);
  m.innerHTML = "";
  m.appendChild(knoten);
}
function flaeche(breite, hoehe) {
  return svgEl("svg", { viewBox: `0 0 ${breite} ${hoehe}`, width: breite, height: hoehe, class: "geo-svg", preserveAspectRatio: "xMidYMid meet" });
}
const klemme = (x, a, b) => Math.min(b, Math.max(a, x));

// ---------- Binomialverteilung, φ und Φ ----------

// Über Logarithmen der Fakultäten: Bei n = 500 und p = 0,9 wäre (0,1)^500 kleiner als die
// kleinste darstellbare Zahl, und jede Säule käme als 0 heraus.
const LNFAK = [0];
function lnFak(n) {
  while (LNFAK.length <= n) LNFAK.push(LNFAK[LNFAK.length - 1] + Math.log(LNFAK.length));
  return LNFAK[n];
}
function B(n, p, k) {
  if (k < 0 || k > n) return 0;
  return Math.exp(lnFak(n) - lnFak(k) - lnFak(n - k) + k * Math.log(p) + (n - k) * Math.log(1 - p));
}
const WURZEL_2PI = Math.sqrt(2 * Math.PI);
function phi(z) {
  return Math.exp(-z * z / 2) / WURZEL_2PI;
}
// Φ über die Reihe von Marsaglia (2004): Φ(z) = 0,5 + φ(z) · (z + z³/3 + z⁵/(3 · 5) + …), auf
// etwa 15 Stellen genau für |z| < 8.
function Phi(z) {
  if (z === -Infinity || z <= -8) return 0;
  if (z === Infinity || z >= 8) return 1;
  let s = z, t = 0, b = z;
  const q = z * z;
  for (let i = 1; s !== t; ) { t = s; i += 2; b *= q / i; s = t + b; }
  return 0.5 + s * phi(z);
}
function PhiInv(g) {
  let a = -8, b = 8;
  for (let i = 0; i < 60; i++) { const m = (a + b) / 2; if (Phi(m) < g) a = m; else b = m; }
  return (a + b) / 2;
}

// ---------- Zeichenrahmen ----------

// Ein „runder“ Abstand für Gitter und Marken: höchstens etwa `ziel` Linien auf der Spanne.
function rundSchritt(spanne, ziel) {
  const liste = [0.01, 0.02, 0.05, 0.1, 0.2, 0.25, 0.5, 1, 2, 2.5, 5, 10, 20, 25, 50, 100];
  return liste.find((s) => spanne / s <= ziel) || 100;
}
function stellenVon(schritt) {
  return schritt >= 1 ? 0 : schritt >= 0.1 && Math.abs(schritt * 10 - Math.round(schritt * 10)) < 1e-9 ? 1 : 2;
}
// Glatte Obergrenze der y-Achse über `wert`.
function yOben(wert) {
  const s = rundSchritt(wert * 1.15, 5);
  return { ymax: Math.ceil((wert * 1.15) / s - 1e-9) * s, ySchritt: s };
}
// Weltkoordinaten → Bildpunkte. Gitterlinien tragen data-wert (y), Marken an der x-Achse
// data-wert-x (x) — daraus liest die Prüfung den Maßstab zurück.
function rahmen(o) {
  const breite = o.breite || 560, hoehe = o.hoehe || 280;
  const links = 48, rechts = 14, oben = 22, unten = 34;
  const { xmin, xmax, ymax } = o;
  const sx = (breite - links - rechts) / (xmax - xmin), sy = (hoehe - oben - unten) / ymax;
  const X = (x) => links + (x - xmin) * sx;
  const Y = (y) => hoehe - unten - y * sy;
  const svg = flaeche(breite, hoehe);
  const ys = o.ySchritt || rundSchritt(ymax, 5);
  const ysSt = stellenVon(ys);
  for (let i = 0; i * ys <= ymax + 1e-9; i++) {
    const y = Math.round(i * ys * 1e6) / 1e6;
    svg.appendChild(svgEl("line", { x1: links, x2: breite - rechts, y1: Y(y).toFixed(2), y2: Y(y).toFixed(2), class: "bk-gitterlinie", "data-wert": String(y) }));
    svg.appendChild(svgText(links - 6, Y(y) + 4, num(y, ysSt), { class: "bk-achsentext", "text-anchor": "end" }));
  }
  const xs = o.xSchritt || rundSchritt(xmax - xmin, 9);
  const xsSt = stellenVon(xs);
  for (let i = Math.ceil(xmin / xs - 1e-9); i * xs <= xmax + 1e-9; i++) {
    const x = Math.round(i * xs * 1e6) / 1e6;
    svg.appendChild(svgEl("line", { x1: X(x).toFixed(2), x2: X(x).toFixed(2), y1: Y(0).toFixed(2), y2: (Y(0) + 5).toFixed(2), class: "nv-xmarke", "data-wert-x": String(x) }));
    svg.appendChild(svgText(X(x), hoehe - unten + 17, num(x, xsSt), { class: "bk-achsentext" }));
  }
  if (o.nullachse && xmin < 0 && xmax > 0) svg.appendChild(svgEl("line", { x1: X(0).toFixed(2), x2: X(0).toFixed(2), y1: oben - 6, y2: Y(0).toFixed(2), class: "nv-nullachse" }));
  svg.appendChild(svgEl("line", { x1: links, x2: breite - rechts, y1: Y(0).toFixed(2), y2: Y(0).toFixed(2), class: "bk-achse" }));
  svg.appendChild(svgEl("line", { x1: links, x2: links, y1: oben - 6, y2: Y(0).toFixed(2), class: "bk-achse" }));
  svg.appendChild(svgText(breite - rechts, hoehe - 3, o.xName || "", { class: "bk-achsentext", "text-anchor": "end" }));
  svg.appendChild(svgText(links + 4, oben - 8, o.yName || "", { class: "bk-achsentext", "text-anchor": "start" }));
  return { svg, X, Y, sx, sy, xmin, xmax, ymax };
}
// Eine Säule von x0 bis x1 mit der Höhe h — nur, wenn sie ganz im Rahmen liegt.
function saeule(r, x0, x1, h, attrs = {}) {
  if (x0 < r.xmin - 1e-9 || x1 > r.xmax + 1e-9) return null;
  const e = svgEl("rect", Object.assign({ x: r.X(x0).toFixed(3), y: r.Y(h).toFixed(3), width: ((x1 - x0) * r.sx).toFixed(3), height: (h * r.sy).toFixed(3) }, attrs));
  r.svg.appendChild(e);
  return e;
}
function kurvenPunkte(r, f, a, b, schritte = 240) {
  const pts = [];
  for (let i = 0; i <= schritte; i++) {
    const x = a + ((b - a) * i) / schritte;
    pts.push([r.X(x), r.Y(f(x))]);
  }
  return pts;
}
function kurve(r, f, a, b, attrs = {}) {
  const pts = kurvenPunkte(r, f, a, b);
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"} ${x.toFixed(2)} ${y.toFixed(2)}`).join(" ");
  r.svg.appendChild(svgEl("path", Object.assign({ d, class: "bk-kurve" }, attrs)));
}
// Die Fläche unter f zwischen a und b, als Vieleck.
function flaecheUnter(r, f, a, b, attrs = {}) {
  if (b <= a) return;
  const pts = kurvenPunkte(r, f, a, b, 200);
  const d = `M ${r.X(a).toFixed(2)} ${r.Y(0).toFixed(2)} ` + pts.map(([x, y]) => `L ${x.toFixed(2)} ${y.toFixed(2)}`).join(" ") + ` L ${r.X(b).toFixed(2)} ${r.Y(0).toFixed(2)} Z`;
  r.svg.appendChild(svgEl("path", Object.assign({ d, class: "nv-flaeche" }, attrs)));
}
function senkrechte(r, x, klasse, attrs = {}) {
  if (x < r.xmin - 1e-9 || x > r.xmax + 1e-9) return;
  r.svg.appendChild(svgEl("line", Object.assign({ x1: r.X(x).toFixed(2), x2: r.X(x).toFixed(2), y1: r.Y(r.ymax).toFixed(2), y2: r.Y(0).toFixed(2), class: klasse }, attrs)));
}
function punkt(r, x, y, klasse, attrs = {}) {
  if (x < r.xmin - 1e-9 || x > r.xmax + 1e-9) return;
  r.svg.appendChild(svgEl("circle", Object.assign({ cx: r.X(x).toFixed(2), cy: r.Y(y).toFixed(2), r: 4.5, class: klasse }, attrs)));
}
function sigmaBand(r, a, b, attrs = {}) {
  const x0 = Math.max(a, r.xmin), x1 = Math.min(b, r.xmax);
  if (x1 <= x0) return;
  r.svg.appendChild(svgEl("rect", Object.assign({ x: r.X(x0).toFixed(3), y: r.Y(r.ymax).toFixed(2), width: ((x1 - x0) * r.sx).toFixed(3), height: (r.ymax * r.sy).toFixed(2), class: "bk-sigma" }, attrs)));
}
function muLinie(r, x) {
  senkrechte(r, x, "bk-mu", { "data-mu": String(x) });
  if (x >= r.xmin && x <= r.xmax) r.svg.appendChild(svgText(r.X(x) + 9, r.Y(r.ymax) + 12, "μ", { class: "bk-mu-text" }));
}
function laplace(s) {
  return s > 3 ? `<span class="wa">σ &gt; 3 ✓ — Laplace-Bedingung erfüllt</span>` : `<span class="wb">σ ≤ 3 — Laplace-Bedingung nicht erfüllt, die Näherung ist unsicher</span>`;
}
// μ und σ als Rechnung, mit dem Reglerwert für p.
function kenn(n, p) {
  const mu = n * p, V = n * p * (1 - p), s = Math.sqrt(V);
  return { mu, s, text: `μ = n · p = ${n} · ${num(p, 2)} = <strong data-rolle="mu">${num(mu)}</strong>, &nbsp; σ = √(${n} · ${num(p, 2)} · ${num(1 - p, 2)}) = √${num(V)} ${zeichen(s)} <strong data-rolle="sigma">${num(s)}</strong>` };
}

// ================= 1. Histogramme großer Ketten =================

function renderWachsen() {
  const n = reglerZahl("wa-n"), p = reglerP("wa-p");
  setzeAnzeige("wa-n-anzeige", num(n));
  setzeAnzeige("wa-p-anzeige", num(p, 2));
  const { mu, s, text } = kenn(n, p);
  // Fester Rahmen für alle n: Nur so sieht man das Histogramm wandern, breiter und flacher werden.
  const r = rahmen({ xmin: -0.5, xmax: 100.5, ymax: 0.4, ySchritt: 0.1, xSchritt: 10, xName: "k", yName: "P(X = k)" });
  sigmaBand(r, mu - s, mu + s, { "data-rolle": "sigma-band" });
  let kmax = 0, hmax = 0;
  for (let k = 0; k <= n; k++) if (B(n, p, k) > hmax) { hmax = B(n, p, k); kmax = k; }
  for (let k = 0; k <= n; k++) saeule(r, k - 0.5, k + 0.5, B(n, p, k), { class: "bk-saeule" + (k === kmax ? " aktiv" : ""), "data-k": String(k) });
  muLinie(r, mu);
  zeige("wa-mount", r.svg);
  setzeHtml("wa-bilanz",
    `${text}<br>` +
    `Höchste Säule (grün) bei k = <strong data-rolle="kmax">${kmax}</strong>: B(${n}; ${num(p, 2)}; ${kmax}) ≈ <strong data-rolle="hmax">${num(hmax)}</strong><br>` +
    `<span class="wr">σ · höchste Säule ≈ ${num(s)} · ${num(hmax)} ≈ <strong data-rolle="produkt">${num(s * hmax, 3)}</strong></span> — fast unabhängig von n.`);
  setzeAnzeige("wa-text", n <= 15
    ? "Zieh n nach rechts: Das Histogramm wandert mit μ = n · p, das rote σ-Band wird breiter, die Säulen werden niedriger."
    : `Bei n = ${n} liegt die Mitte bei ${num(mu, 1)}, das Band μ ± σ ist ${num(2 * s, 1)} breit, die höchste Säule nur noch ${num(hmax, 3)} hoch. Das Produkt σ · höchste Säule bleibt bei etwa 0,4.`);
}

// ================= 2. Standardisieren =================

// Phasen des Reglers „Fortschritt“ (0 … 400): Schritt 1, Schritt 2, Lupe, Schritt 3.
function stPhase(T) {
  if (T <= 1) return { name: "1", t: T };
  if (T <= 2) return { name: "2", t: T - 1 };
  if (T <= 3) return { name: "lupe", t: T - 2 };
  return { name: "3", t: T - 3 };
}
function renderStandardisieren() {
  const p = reglerP("st-p");
  // σ ≥ 1 verlangt: Sonst wäre „Stauchen mit dem Faktor 1/σ“ in Wahrheit ein Strecken und Schritt 3
  // ein Stauchen. Bei p = 0,1 oder 0,9 heißt das n ≥ 15 (n · 0,09 ≥ 1, auf das Raster von 5).
  let nMin = 10;
  while (nMin * p * (1 - p) < 1 - 1e-9) nMin += 5;
  const n = begrenzt("st-n", reglerZahl("st-n"), nMin, 100);
  const T = reglerZahl("st-t") / 100;
  const mu = n * p, s = Math.sqrt(n * p * (1 - p));
  // Die beobachtete Säule muss in jedem Schritt zu sehen sein: Das Endbild reicht von z = −4,5 bis
  // 4,5, und weiter draußen als 3σ ist eine Säule kaum höher als der Strich ihres Randes.
  const kMin = Math.max(0, Math.ceil(mu - 3 * s)), kMax = Math.min(n, Math.floor(mu + 3 * s));
  const kRegler = document.getElementById("st-k");
  kRegler.min = String(kMin);
  kRegler.max = String(kMax);
  const k = begrenzt("st-k", reglerZahl("st-k"), kMin, kMax);
  setzeAnzeige("st-n-anzeige", num(n));
  setzeAnzeige("st-p-anzeige", num(p, 2));
  setzeAnzeige("st-k-anzeige", num(k));
  const ph = stPhase(T);
  setzeAnzeige("st-t-anzeige", ph.name === "lupe" ? `Lupe — ${Math.round(ph.t * 100)} %` : `Schritt ${ph.name} — ${Math.round(ph.t * 100)} %`);
  const reihe = ["1", "2", "lupe", "3"];
  document.querySelectorAll("#st-schritte li").forEach((li) => {
    const i = reihe.indexOf(li.dataset.schritt), j = reihe.indexOf(ph.name);
    li.className = i === j && !(T >= 4) ? "aktiv" : i < j || T >= 4 ? "fertig" : "";
  });

  // Die drei Abbildungen, jede mit ihrem Anteil: verschieben um t1 · μ, stauchen mit fx, strecken mit fy.
  const t1 = klemme(T, 0, 1), t2 = klemme(T - 1, 0, 1), u = klemme(T - 2, 0, 1), t3 = klemme(T - 3, 0, 1);
  const shift = t1 * mu, fx = 1 + t2 * (1 / s - 1), fy = 1 + t3 * (s - 1);

  // Rahmen: für Schritt 1 und 2 fest in k-Einheiten (nur so sieht man das Wandern und das Stauchen),
  // für Schritt 3 fest in z-Einheiten. Dazwischen vergrößert die „Lupe“ nur die Ansicht — die Säulen
  // bleiben, wie sie sind.
  let bmax = 0;
  for (let i = 0; i <= n; i++) bmax = Math.max(bmax, B(n, p, i));
  const F1 = { xmin: -4 * s - 1, xmax: mu + 4 * s + 1, ymax: yOben(bmax).ymax };
  const F3 = { xmin: -4.5, xmax: 4.5, ymax: 0.5 };
  const lerp = (a, b) => a + (b - a) * u;
  const F = ph.name === "3" || T >= 3 ? F3 : ph.name === "lupe" ? { xmin: lerp(F1.xmin, F3.xmin), xmax: lerp(F1.xmax, F3.xmax), ymax: lerp(F1.ymax, F3.ymax) } : F1;
  const r = rahmen({ ...F, nullachse: true, xName: T >= 2 ? "z" : "x", yName: T >= 3 ? "σ · P(X = k)" : "P(X = k)" });

  // Grau gestrichelt: die Lage am Anfang des laufenden Schritts — zum Vergleich.
  const geist = ph.name === "1" ? (i) => [i - 0.5, i + 0.5, B(n, p, i)]
    : ph.name === "2" ? (i) => [i - mu - 0.5, i - mu + 0.5, B(n, p, i)]
      : ph.name === "3" ? (i) => [(i - mu - 0.5) / s, (i - mu + 0.5) / s, B(n, p, i)] : null;
  if (geist && ph.t > 0) for (let i = 0; i <= n; i++) { const [a, b, h] = geist(i); saeule(r, a, b, h, { class: "nv-geist", "data-geist": String(i) }); }
  const mitte = (i) => (i - shift) * fx;
  sigmaBand(r, mitte(mu - s), mitte(mu + s), { "data-rolle": "sigma-band" });
  let gesamt = 0;
  for (let i = 0; i <= n; i++) {
    const b = B(n, p, i);
    gesamt += fx * b * fy;
    saeule(r, mitte(i) - fx / 2, mitte(i) + fx / 2, b * fy, { class: "bk-saeule" + (i === k ? " aktiv" : ""), "data-k": String(i) });
  }
  muLinie(r, mitte(mu));
  zeige("st-mount", r.svg);

  const bk = B(n, p, k);
  const was = {
    "1": `Schritt 1 zu ${Math.round(t1 * 100)} %: Jede Säule rückt um ${num(t1, 2)} · μ = ${num(shift, 2)} nach links. Breite, Höhe und Fläche bleiben.`,
    "2": `Schritt 2 zu ${Math.round(t2 * 100)} %: Alle x-Werte werden mit dem Faktor ${num(fx, 4)} malgenommen (am Ende ${bruch(1, "σ")} ${zeichen(1 / s)} ${num(1 / s)}). Die Säulen werden schmaler, ihre Höhe bleibt — also schrumpft ihre Fläche.`,
    "lupe": `Lupe: Nur die Ansicht wird vergrößert (die Achsen zeigen es). An den Säulen ändert sich nichts — sie sind ${num(1 / s)} breit und so hoch wie am Anfang.`,
    "3": `Schritt 3 zu ${Math.round(t3 * 100)} %: Alle Höhen werden mit dem Faktor ${num(fy, 4)} malgenommen (am Ende σ ${zeichen(s)} ${num(s)}). Die Fläche wächst zurück.`,
  }[ph.name];
  setzeHtml("st-bilanz",
    `μ = ${num(mu)}, σ ${zeichen(s)} ${num(s)}. ${was}<br>` +
    `<span class="wa">Säule k = ${k}: Mitte <strong data-rolle="mitte">${num(mitte(k))}</strong>, Breite <strong data-rolle="breite">${num(fx)}</strong>, Höhe <strong data-rolle="hoehe">${num(bk * fy)}</strong>, Fläche = Breite · Höhe ≈ <strong data-rolle="flaeche">${num(fx * bk * fy)}</strong></span> (am Anfang B(${n}; ${num(p, 2)}; ${k}) ≈ ${num(bk)})<br>` +
    `<span class="wr">μ liegt bei <strong data-rolle="mu-ort">${num(mitte(mu))}</strong></span>, <span class="wg">das σ-Band ist <strong data-rolle="band-breite">${num(2 * s * fx)}</strong> breit</span>, alle Säulen zusammen haben die Fläche <strong data-rolle="gesamt">${num(gesamt)}</strong>.`);
  setzeAnzeige("st-text", T >= 4
    ? `Fertig: Die grüne Säule steht über z = (${k} − ${num(mu)}) : ${num(s)} ${zeichen((k - mu) / s)} ${num((k - mu) / s, 2)}, ist 1 : σ ≈ ${num(1 / s)} breit und σ-mal so hoch wie am Anfang — ihre Fläche ist wieder B(${n}; ${num(p, 2)}; ${k}). Der Erwartungswert liegt bei 0, das σ-Band reicht von −1 bis 1.`
    : ph.name === "1" ? "Schritt 1 schiebt das ganze Histogramm, bis μ auf der y-Achse liegt. Danach ist der Erwartungswert 0."
      : ph.name === "2" ? "Schritt 2 drückt das Histogramm zur y-Achse hin zusammen, bis das σ-Band von −1 bis 1 reicht. Die Fläche aller Säulen ist danach nur noch 1/σ."
        : ph.name === "lupe" ? "Die Lupe holt das gestauchte Histogramm heran — nur die Achsen ändern sich."
          : "Schritt 3 zieht jede Säule in die Höhe, bis alle zusammen wieder die Fläche 1 haben.");
}

// ================= 3. Die Glockenkurve =================

function renderGlocke() {
  const n = reglerZahl("gl-n"), p = reglerP("gl-p");
  setzeAnzeige("gl-n-anzeige", num(n));
  setzeAnzeige("gl-p-anzeige", num(p, 2));
  const { mu, s, text } = kenn(n, p);
  const r = rahmen({ xmin: -4, xmax: 4, ymax: 0.5, ySchritt: 0.1, xSchritt: 1, nullachse: true, xName: "z", yName: "σ · P(X = k) und φ(z)" });
  let abw = 0;
  for (let k = 0; k <= n; k++) {
    const z = (k - mu) / s, h = s * B(n, p, k);
    abw = Math.max(abw, Math.abs(h - phi(z)));
    saeule(r, z - 1 / (2 * s), z + 1 / (2 * s), h, { class: "bk-saeule", "data-k": String(k) });
  }
  kurve(r, phi, -4, 4, { "data-rolle": "phi" });
  for (const z of [-1, 1]) punkt(r, z, phi(z), "nv-wende", { "data-rolle": "wende", "data-z": String(z) });
  punkt(r, 0, phi(0), "nv-wende", { "data-rolle": "hochpunkt", "data-z": "0" });
  zeige("gl-mount", r.svg);
  // Die Fläche unter φ zwischen −4 und 4 — gemessen mit der Trapezregel, nicht behauptet.
  let flaecheGl = 0;
  const N = 800;
  for (let i = 0; i < N; i++) { const a = -4 + (8 * i) / N, b = -4 + (8 * (i + 1)) / N; flaecheGl += ((phi(a) + phi(b)) / 2) * (b - a); }
  setzeHtml("gl-bilanz",
    `${text} — ${laplace(s)}<br>` +
    `Größter Abstand zwischen Säule und Kurve: <strong data-rolle="abw">${num(abw)}</strong><br>` +
    `<span class="wc">Glockenkurve: φ(0) = ${bruch(1, "√(2π)")} ≈ <strong data-rolle="phi0">${num(phi(0))}</strong>, Wendestellen bei −1 und 1 (violett) mit φ(±1) ≈ ${num(phi(1))}</span><br>` +
    `Fläche unter φ von −4 bis 4 (gemessen mit 800 Trapezen): <strong data-rolle="flaeche-phi">${num(flaecheGl)}</strong> — der Rest der Fläche 1 liegt in den beiden Ausläufern.`);
  setzeAnzeige("gl-text", s > 3
    ? `Bei σ ${zeichen(s)} ${num(s, 2)} liegen die Säulen fast genau unter der Kurve — größter Abstand ${num(abw, 3)}.`
    : `Bei σ ${zeichen(s)} ${num(s, 2)} sind die Säulen noch breit und das Histogramm ${Math.abs(p - 0.5) > 0.15 ? "schief" : "kantig"} — der größte Abstand zur Kurve ist ${num(abw, 3)}. Vergrößere n.`);
}

// ================= 4. Lokale Näherungsformel =================

function renderLokal() {
  const n = reglerZahl("lo-n"), p = reglerP("lo-p");
  document.getElementById("lo-k").max = String(n);
  const k = begrenzt("lo-k", reglerZahl("lo-k"), 0, n);
  setzeAnzeige("lo-n-anzeige", num(n));
  setzeAnzeige("lo-p-anzeige", num(p, 2));
  setzeAnzeige("lo-k-anzeige", num(k));
  const { mu, s, text } = kenn(n, p);
  const z = (k - mu) / s, nae = phi(z) / s, genau = B(n, p, k);
  // Der Ausschnitt: μ ± 4,5σ, so erweitert, dass die gewählte Säule immer zu sehen ist.
  const xmin = Math.max(-0.5, Math.min(mu - 4.5 * s, k - 1.5)), xmax = Math.min(n + 0.5, Math.max(mu + 4.5 * s, k + 1.5));
  let bmax = 0;
  for (let i = 0; i <= n; i++) bmax = Math.max(bmax, B(n, p, i));
  const r = rahmen({ xmin, xmax, ...yOben(Math.max(bmax, phi(0) / s)), xName: "k", yName: "P(X = k)" });
  for (let i = Math.ceil(xmin); i <= Math.floor(xmax); i++) saeule(r, i - 0.5, i + 0.5, B(n, p, i), { class: "bk-saeule" + (i === k ? " aktiv" : ""), "data-k": String(i) });
  kurve(r, (x) => phi((x - mu) / s) / s, xmin, xmax, { "data-rolle": "kurve" });
  muLinie(r, mu);
  punkt(r, k, nae, "nv-punkt", { "data-rolle": "naeherung" });
  zeige("lo-mount", r.svg);
  const rel = genau > 0 ? Math.abs(nae - genau) / genau : NaN;
  setzeHtml("lo-bilanz",
    `${text} — ${laplace(s)}<br>` +
    `z = ${bruch(`${k} − ${num(mu)}`, num(s))} ${zeichen(z)} <strong data-rolle="z">${num(z)}</strong>, &nbsp; φ(${num(z)}) ≈ <strong data-rolle="phi">${num(phi(z))}</strong><br>` +
    `<span class="wa">Näherung: B(${n}; ${num(p, 2)}; ${k}) ≈ ${bruch(1, "σ")} · φ(z) ≈ <strong data-rolle="naeherung">${num(nae)}</strong></span> (grüner Punkt) — ` +
    `genau: <strong data-rolle="genau">${num(genau)}</strong>; Abweichung <strong data-rolle="abw">${num(Math.abs(nae - genau))}</strong>` +
    (Number.isFinite(rel) && genau >= 1e-4 ? `, das sind ${num(rel * 100, 1)} % des genauen Werts.` : "."));
  setzeAnzeige("lo-text", s > 3
    ? (Math.abs(z) > 3 ? `Weit draußen (|z| > 3) sind beide Werte winzig; die Näherung ist dort nur noch grob.` : `Die zurückgerechnete Kurve geht fast genau durch die Säulenmitten. Teilt man φ(z) durch σ, hat man die Wahrscheinlichkeit.`)
    : `Bei σ ≤ 3 trifft die Kurve die Säulen noch schlecht — vor allem bei p nahe 0 oder 1. Vergrößere n.`);
}

// ================= 5. Globale Näherungsformel =================

function renderGlobal() {
  const n = reglerZahl("gb-n"), p = reglerP("gb-p"), art = document.getElementById("gb-art").value;
  const korr = document.getElementById("gb-korrektur").checked;
  document.getElementById("gb-a").max = String(n);
  document.getElementById("gb-b").max = String(n);
  const a = begrenzt("gb-a", reglerZahl("gb-a"), 0, n);
  // Bei „von a bis b“ darf b nicht unter a liegen, sonst wäre das Ereignis leer.
  const b = art === "zw" ? begrenzt("gb-b", reglerZahl("gb-b"), a, n) : begrenzt("gb-b", reglerZahl("gb-b"), 0, n);
  setzeAnzeige("gb-n-anzeige", num(n));
  setzeAnzeige("gb-p-anzeige", num(p, 2));
  setzeAnzeige("gb-a-anzeige", num(a));
  setzeAnzeige("gb-b-anzeige", num(b));
  document.getElementById("gb-a").disabled = art === "le";
  document.getElementById("gb-b").disabled = art === "ge";
  const { mu, s, text } = kenn(n, p);
  const lo = art === "le" ? 0 : a, hi = art === "ge" ? n : b;
  let genau = 0;
  for (let i = lo; i <= hi; i++) genau += B(n, p, i);
  const k5 = (mit) => (mit ? 0.5 : 0);
  const za = (mit) => (art === "le" ? -Infinity : (a - k5(mit) - mu) / s);
  const zb = (mit) => (art === "ge" ? Infinity : (b + k5(mit) - mu) / s);
  const nae = (mit) => Phi(zb(mit)) - Phi(za(mit));

  const r = rahmen({ xmin: -4.5, xmax: 4.5, ymax: 0.5, ySchritt: 0.1, xSchritt: 1, nullachse: true, breite: 460, hoehe: 270, xName: "z", yName: "σ · P(X = k), φ(z)" });
  for (let i = 0; i <= n; i++) {
    const z = (i - mu) / s;
    saeule(r, z - 1 / (2 * s), z + 1 / (2 * s), s * B(n, p, i), { class: "bk-saeule" + (i >= lo && i <= hi ? " aktiv" : ""), "data-k": String(i) });
  }
  const fa = Math.max(za(korr), r.xmin), fb = Math.min(zb(korr), r.xmax);
  flaecheUnter(r, phi, fa, fb, { class: "nv-flaeche" + (korr ? "" : " ohne"), "data-rolle": "flaeche" });
  kurve(r, phi, -4.5, 4.5, { "data-rolle": "phi" });
  if (Number.isFinite(za(korr))) senkrechte(r, za(korr), "nv-grenze" + (korr ? "" : " ohne"), { "data-rolle": "grenze-a" });
  if (Number.isFinite(zb(korr))) senkrechte(r, zb(korr), "nv-grenze" + (korr ? "" : " ohne"), { "data-rolle": "grenze-b" });
  zeige("gb-mount", r.svg);

  // Rechts: Φ selbst — die Fläche links von z als Höhe abgelesen.
  const q = rahmen({ xmin: -4, xmax: 4, ymax: 1, ySchritt: 0.2, xSchritt: 1, nullachse: true, breite: 300, hoehe: 270, xName: "z", yName: "Φ(z)" });
  kurve(q, Phi, -4, 4, { "data-rolle": "Phi" });
  if (Number.isFinite(zb(korr))) punkt(q, zb(korr), Phi(zb(korr)), "nv-punkt", { "data-rolle": "Phi-b" });
  if (Number.isFinite(za(korr))) punkt(q, za(korr), Phi(za(korr)), "nv-punkt", { "data-rolle": "Phi-a" });
  zeige("gb-phi", q.svg);

  // Mit vier Stellen, wie gerechnet wird: Ein auf zwei Stellen gerundetes z gäbe ein anderes Φ.
  const zTxt = (z) => num(z);
  const ereignis = art === "le" ? `P(X ≤ ${b})` : art === "ge" ? `P(X ≥ ${a})` : `P(${a} ≤ X ≤ ${b})`;
  const grenzeB = `z<sub>b</sub> = ${bruch(`${b}${korr ? " + 0,5" : ""} − ${num(mu)}`, num(s))} ${zeichen(zb(korr))} <strong data-rolle="zb">${num(zb(korr))}</strong>`;
  const grenzeA = `z<sub>a</sub> = ${bruch(`${a}${korr ? " − 0,5" : ""} − ${num(mu)}`, num(s))} ${zeichen(za(korr))} <strong data-rolle="za">${num(za(korr))}</strong>`;
  const formel = art === "le" ? `Φ(${zTxt(zb(korr))})` : art === "ge" ? `1 − Φ(${zTxt(za(korr))})` : `Φ(${zTxt(zb(korr))}) − Φ(${zTxt(za(korr))})`;
  setzeHtml("gb-bilanz",
    `${text} — ${laplace(s)}<br>` +
    (art !== "ge" ? grenzeB : "") + (art === "zw" ? " &nbsp; " : "") + (art !== "le" ? grenzeA : "") + "<br>" +
    `<span class="wa">Näherung: ${ereignis} ≈ ${formel} ≈ <strong data-rolle="naeherung">${num(nae(korr))}</strong></span> (grüne Fläche) — genau (Summe der grünen Säulen): <strong data-rolle="genau">${num(genau)}</strong>; Abweichung ${num(Math.abs(nae(korr) - genau))}<br>` +
    `<span class="wb">${korr ? "Ohne" : "Mit"} Stetigkeitskorrektur käme <strong data-rolle="andere">${num(nae(!korr))}</strong> heraus — Abweichung ${num(Math.abs(nae(!korr) - genau))}.</span>`);
  setzeAnzeige("gb-text", korr
    ? `Die Fläche endet genau an den äußeren Rändern der grünen Säulen. Rechts ist Φ(z) als Höhe abzulesen: die Fläche links von z.`
    : `Ohne Korrektur endet die Fläche in der Mitte der Randsäulen — je eine halbe Säule fehlt oder ist zu viel. Schalte die Korrektur wieder ein und vergleiche.`);
}

// ================= 6. Die Normalverteilung =================

const NV_RAHMEN = { xmin: 100, xmax: 240, ymax: 0.1, ySchritt: 0.02, xSchritt: 10 };
function dichte(mu, s) {
  return (x) => phi((x - mu) / s) / s;
}
function renderNormal() {
  const mu = reglerZahl("nv-mu"), s = reglerZahl("nv-sigma"), art = document.getElementById("nv-art").value;
  const regeln = document.getElementById("nv-regeln").checked;
  const a = reglerZahl("nv-a");
  const b = art === "zw" ? begrenzt("nv-b", reglerZahl("nv-b"), a, NV_RAHMEN.xmax) : reglerZahl("nv-b");
  setzeAnzeige("nv-mu-anzeige", `${num(mu)} cm`);
  setzeAnzeige("nv-sigma-anzeige", `${num(s, 1)} cm`);
  setzeAnzeige("nv-a-anzeige", `${num(a)} cm`);
  setzeAnzeige("nv-b-anzeige", `${num(b)} cm`);
  document.getElementById("nv-a").disabled = art === "le";
  document.getElementById("nv-b").disabled = art === "ge";
  const f = dichte(mu, s);
  const r = rahmen({ ...NV_RAHMEN, xName: "x in cm", yName: "Dichte f(x)" });
  if (regeln) [3, 2, 1].forEach((m) => sigmaBand(r, mu - m * s, mu + m * s, { class: "nv-band", "fill-opacity": String(0.05 + 0.03 * (3 - m)), "data-rolle": `band${m}` }));
  const za = art === "le" ? -Infinity : (a - mu) / s, zb = art === "ge" ? Infinity : (b - mu) / s;
  flaecheUnter(r, f, art === "le" ? r.xmin : a, art === "ge" ? r.xmax : b, { "data-rolle": "flaeche" });
  kurve(r, f, r.xmin, r.xmax, { "data-rolle": "dichte" });
  muLinie(r, mu);
  for (const x of [mu - s, mu + s]) punkt(r, x, f(x), "nv-wende", { "data-rolle": "wende" });
  if (art !== "le") senkrechte(r, a, "nv-grenze", { "data-rolle": "grenze-a" });
  if (art !== "ge") senkrechte(r, b, "nv-grenze", { "data-rolle": "grenze-b" });
  zeige("nv-mount", r.svg);
  const P = Phi(zb) - Phi(za);
  const ereignis = art === "le" ? `P(X ≤ ${b})` : art === "ge" ? `P(X ≥ ${a})` : `P(${a} ≤ X ≤ ${b})`;
  const formel = art === "le" ? `Φ(${num(zb)})` : art === "ge" ? `1 − Φ(${num(za)})` : `Φ(${num(zb)}) − Φ(${num(za)})`;
  setzeHtml("nv-bilanz",
    `μ = ${num(mu)} cm, σ = ${num(s, 1)} cm. Hochpunkt bei μ, Wendestellen (violett) bei ${num(mu - s, 1)} cm und ${num(mu + s, 1)} cm.<br>` +
    (art !== "ge" ? `z<sub>b</sub> = ${bruch(`${b} − ${num(mu)}`, num(s, 1))} ${zeichen(zb)} <strong data-rolle="zb">${num(zb)}</strong> &nbsp; ` : "") +
    (art !== "le" ? `z<sub>a</sub> = ${bruch(`${a} − ${num(mu)}`, num(s, 1))} ${zeichen(za)} <strong data-rolle="za">${num(za)}</strong>` : "") + "<br>" +
    `<span class="wa">${ereignis} = ${formel} ≈ <strong data-rolle="P">${num(P)}</strong></span> — der Inhalt der grünen Fläche.` +
    (regeln ? `<br><span class="wg">σ-Umgebungen: μ ± σ: <strong data-rolle="regel1">${num(Phi(1) - Phi(-1))}</strong>, μ ± 2σ: <strong data-rolle="regel2">${num(Phi(2) - Phi(-2))}</strong>, μ ± 3σ: <strong data-rolle="regel3">${num(Phi(3) - Phi(-3))}</strong></span>` : ""));
  setzeAnzeige("nv-text", `Zieh an μ: Die Glocke wandert, ohne sich zu verformen. Zieh an σ: Sie wird breiter und dafür flacher — die ganze Fläche bleibt 1. Der Hochpunkt liegt bei ${num(f(mu), 4)} = 1 : (σ · √(2π)).`);
}

// ================= 7. Rückwärts =================

const UK_RAHMEN = { xmin: 440, xmax: 560, ymax: 0.2, ySchritt: 0.05, xSchritt: 10 };
function renderUmkehr() {
  const mu = reglerZahl("uk-mu"), s = reglerZahl("uk-sigma"), art = document.getElementById("uk-art").value;
  const gamma = reglerP("uk-gamma");
  setzeAnzeige("uk-mu-anzeige", `${num(mu)} g`);
  setzeAnzeige("uk-sigma-anzeige", `${num(s, 1)} g`);
  setzeAnzeige("uk-gamma-anzeige", num(gamma, 2));
  const f = dichte(mu, s);
  const r = rahmen({ ...UK_RAHMEN, xName: "x in g", yName: "Dichte f(x)" });
  let bilanz;
  if (art === "links") {
    const z = PhiInv(gamma), c = mu + z * s;
    flaecheUnter(r, f, r.xmin, c, { "data-rolle": "flaeche" });
    kurve(r, f, r.xmin, r.xmax, { "data-rolle": "dichte" });
    senkrechte(r, c, "nv-c", { "data-rolle": "c" });
    bilanz = `P(X ≤ c) = Φ(${bruch("c − μ", "σ")}) = ${num(gamma, 2)} ⟹ z mit Φ(z) = ${num(gamma, 2)}: <strong data-rolle="z">${num(z, 3)}</strong><br>` +
      `<span class="wa">c = μ + z · σ ≈ ${num(mu)} ${z < 0 ? "−" : "+"} ${num(Math.abs(z), 3)} · ${num(s, 1)} ≈ <strong data-rolle="c">${num(c, 2)}</strong> g</span><br>` +
      `Probe: Φ(${bruch(`${num(c, 2)} − ${num(mu)}`, num(s, 1))}) ≈ <strong data-rolle="probe">${num(Phi((c - mu) / s), 3)}</strong>`;
  } else if (art === "rechts") {
    const z = PhiInv(1 - gamma), c = mu + z * s;
    flaecheUnter(r, f, c, r.xmax, { "data-rolle": "flaeche" });
    kurve(r, f, r.xmin, r.xmax, { "data-rolle": "dichte" });
    senkrechte(r, c, "nv-c", { "data-rolle": "c" });
    bilanz = `P(X ≥ c) = ${num(gamma, 2)} ⟺ P(X ≤ c) = ${num(1 - gamma, 2)} ⟹ z mit Φ(z) = ${num(1 - gamma, 2)}: <strong data-rolle="z">${num(z, 3)}</strong><br>` +
      `<span class="wa">c = μ + z · σ ≈ ${num(mu)} ${z < 0 ? "−" : "+"} ${num(Math.abs(z), 3)} · ${num(s, 1)} ≈ <strong data-rolle="c">${num(c, 2)}</strong> g</span><br>` +
      `Probe: 1 − Φ(${bruch(`${num(c, 2)} − ${num(mu)}`, num(s, 1))}) ≈ <strong data-rolle="probe">${num(1 - Phi((c - mu) / s), 3)}</strong>`;
  } else {
    const z = PhiInv((1 + gamma) / 2), d = z * s;
    flaecheUnter(r, f, mu - d, mu + d, { "data-rolle": "flaeche" });
    kurve(r, f, r.xmin, r.xmax, { "data-rolle": "dichte" });
    senkrechte(r, mu - d, "nv-c", { "data-rolle": "c-links" });
    senkrechte(r, mu + d, "nv-c", { "data-rolle": "c-rechts" });
    bilanz = `Außerhalb liegen ${num(1 - gamma, 2)}, auf jeder Seite ${num((1 - gamma) / 2, 3)}: Φ(z) = ${num((1 + gamma) / 2, 3)} ⟹ z ≈ <strong data-rolle="z">${num(z, 3)}</strong><br>` +
      `<span class="wa">d = z · σ ≈ ${num(z, 3)} · ${num(s, 1)} ≈ <strong data-rolle="d">${num(d, 2)}</strong> g — Bereich von ${num(mu - d, 2)} g bis ${num(mu + d, 2)} g</span><br>` +
      `Probe: Φ(${num(z, 3)}) − Φ(−${num(z, 3)}) ≈ <strong data-rolle="probe">${num(Phi(z) - Phi(-z), 3)}</strong>`;
  }
  muLinie(r, mu);
  zeige("uk-mount", r.svg);
  setzeHtml("uk-bilanz", `μ = ${num(mu)} g, σ = ${num(s, 1)} g.<br>${bilanz}`);
  setzeAnzeige("uk-text", art === "symm"
    ? "Die grüne Fläche hat den Inhalt γ und liegt symmetrisch um μ. Je größer γ, desto weiter rücken die roten Grenzen nach außen."
    : gamma < 0.5 && art === "links" ? "γ < 0,5: Die Grenze liegt links von μ, z ist negativ." : "Die grüne Fläche hat den Inhalt γ. Zieh an γ und beobachte, wie die rote Grenze wandert.");
}

// ================= Kontrollfragen =================

function mountQuiz(container, { q, options, correct, explain }) {
  container.innerHTML = "";
  container.appendChild(el("p", { class: "quiz-q", html: "❓ " + q }));
  const optWrap = el("div", { class: "quiz-options" });
  const feedback = el("div", { class: "quiz-feedback", "aria-live": "polite" });
  options.forEach((optText, i) => {
    const btn = el("button", { type: "button", class: "quiz-opt", html: optText });
    btn.addEventListener("click", () => {
      [...optWrap.children].forEach((x) => x.classList.remove("correct", "wrong"));
      if (i === correct) {
        btn.classList.add("correct");
        feedback.className = "quiz-feedback ok";
        feedback.innerHTML = "✓ Richtig! " + explain;
      } else {
        btn.classList.add("wrong");
        [...optWrap.children][correct].classList.add("correct");
        feedback.className = "quiz-feedback err";
        feedback.innerHTML = "✗ Nicht ganz. " + explain;
      }
    });
    optWrap.appendChild(btn);
  });
  container.appendChild(optWrap);
  container.appendChild(feedback);
}

const QUIZZE = {
  "quiz-wachsen": {
    q: "Bei einer Bernoulli-Kette wird n vervierfacht, p bleibt gleich. Was geschieht mit der Breite σ des Histogramms?",
    options: ["Sie vervierfacht sich", "Sie verdoppelt sich", "Sie bleibt gleich", "Sie halbiert sich"],
    correct: 1,
    explain: "σ = √(n · p · (1 − p)) wächst mit der Wurzel aus n: √(4n) = 2 · √n. Der Erwartungswert μ = n · p vervierfacht sich dagegen — das Histogramm wandert also schneller nach rechts, als es breiter wird. Die höchste Säule halbiert sich ungefähr, weil σ · höchste Säule bei etwa 0,4 bleibt.",
  },
  "quiz-standardisieren": {
    q: "n = 100, p = 0,5. Über welchem Wert z steht die Säule k = 60 nach dem Standardisieren?",
    options: ["z = 10", "z = 0,4", "z = 2", "z = 1,2"],
    correct: 2,
    explain: "μ = 50, σ = √(100 · 0,5 · 0,5) = 5. Schritt 1 schiebt 60 nach 60 − 50 = 10, Schritt 2 staucht mit 1/5: z = 10 : 5 = 2. Wer bei 10 stehen bleibt, hat nur verschoben; 0,4 entsteht beim Teilen durch σ² = 25.",
  },
  "quiz-glockenkurve": {
    q: "Für welche Bernoulli-Kette ist die Laplace-Bedingung σ > 3 erfüllt?",
    options: ["n = 100, p = 0,05", "n = 30, p = 0,5", "n = 40, p = 0,1", "n = 50, p = 0,5"],
    correct: 3,
    explain: "σ = √(50 · 0,5 · 0,5) = √12,5 ≈ 3,54 > 3. Bei n = 100 und p = 0,05 ist σ = √4,75 ≈ 2,18 — trotz des großen n, weil p so klein ist. Bei n = 30, p = 0,5 ist σ ≈ 2,74, bei n = 40, p = 0,1 nur σ ≈ 1,90.",
  },
  "quiz-lokal": {
    q: "n = 400, p = 0,5, also μ = 200 und σ = 10. Welcher Wert nähert B(400; 0,5; 210) an?",
    options: ["0,2420", "0,0242", "0,8413", "0,0024"],
    correct: 1,
    explain: "z = (210 − 200) : 10 = 1 und φ(1) ≈ 0,2420. Das ist die Säulenhöhe im standardisierten Histogramm; die Wahrscheinlichkeit ist σ-mal kleiner: 0,2420 : 10 ≈ 0,0242. 0,8413 ist Φ(1), die Fläche links von 1 — sie gehört zu P(X ≤ …), nicht zu P(X = …).",
  },
  "quiz-global": {
    q: "n = 100, p = 0,5 (μ = 50, σ = 5). Welcher Ausdruck nähert P(X ≤ 55) mit Stetigkeitskorrektur an?",
    options: ["Φ(1,1)", "Φ(1)", "Φ(0,9)", "1 − Φ(1,1)"],
    correct: 0,
    explain: "Die Säule über 55 reicht bis 55,5. Also z = (55,5 − 50) : 5 = 1,1 und P(X ≤ 55) ≈ Φ(1,1) ≈ 0,8643 (genau: 0,8644). Φ(1) schneidet die halbe Säule ab, Φ(0,9) korrigiert in die falsche Richtung, und 1 − Φ(1,1) ist die Fläche rechts — P(X ≥ 56).",
  },
  "quiz-normalverteilung": {
    q: "Die Körpergröße X ist normalverteilt mit μ = 172 cm und σ = 8 cm. Wie wahrscheinlich ist eine Größe zwischen 164 cm und 180 cm?",
    options: ["≈ 95,4 %", "≈ 34,1 %", "≈ 68,3 %", "≈ 50 %"],
    correct: 2,
    explain: "164 = 172 − 8 und 180 = 172 + 8: Das ist genau die σ-Umgebung μ ± σ, also Φ(1) − Φ(−1) ≈ 0,683. 34,1 % ist nur die Hälfte (von μ bis μ + σ), 95,4 % gehört zu μ ± 2σ.",
  },
  "quiz-umkehr": {
    q: "Füllgewicht normalverteilt mit μ = 500 g und σ = 5 g. Welches Gewicht unterschreiten nur 5 % der Packungen?",
    options: ["≈ 508,2 g", "≈ 495,0 g", "≈ 490,2 g", "≈ 491,8 g"],
    correct: 3,
    explain: "Gesucht ist c mit Φ((c − 500) : 5) = 0,05. Φ(z) = 0,05 gilt für z ≈ −1,645, also c ≈ 500 − 1,645 · 5 ≈ 491,8 g. 508,2 g überschreiten 5 %; 490,2 g ist μ − 1,96σ (dort liegen 2,5 % darunter), und 495 g ist nur μ − σ.",
  },
};

// ================= Start =================

const REGLER = [
  [["wa-n", "wa-p"], renderWachsen],
  [["st-n", "st-p", "st-k", "st-t"], renderStandardisieren],
  [["gl-n", "gl-p"], renderGlocke],
  [["lo-n", "lo-p", "lo-k"], renderLokal],
  [["gb-n", "gb-p", "gb-art", "gb-a", "gb-b", "gb-korrektur"], renderGlobal],
  [["nv-mu", "nv-sigma", "nv-art", "nv-a", "nv-b", "nv-regeln"], renderNormal],
  [["uk-mu", "uk-sigma", "uk-art", "uk-gamma"], renderUmkehr],
];
for (const [ids, render] of REGLER) {
  ids.forEach((id) => {
    const e = document.getElementById(id);
    e.addEventListener(e.tagName === "SELECT" || e.type === "checkbox" ? "change" : "input", render);
    if (e.tagName === "SELECT") e.addEventListener("input", render);
  });
  render();
}
for (const [id, def] of Object.entries(QUIZZE)) mountQuiz(document.getElementById(id), def);
mountUebungsaufgaben(document.getElementById("exercises-mount"), AUFGABEN, { parse: parseZahl });
