// Selbstlernpfad „Ableitung weiterer Funktionen“ (MSS 11, Analysis, Thema 2.2 — Leistungskurs).
// Vanilla-JS, kein Build. Setzt Thema 2.1 fort; was nach dem rheinland-pfälzischen Lehrplan auch
// zum Grundfach gehört (a · e^(kx), Produkte damit, e^(kx) = c), trägt auf der Seite die Marke
// „GK + LK“ und benutzt nur, was ebenfalls so markiert ist.
//
// Didaktische Reihenfolge — jede Stufe benutzt nur, was davor steht:
//    1. b^x und die Zahl e            (Differenzenquotient + Potenzgesetz b^(x+h) = b^x · b^h; c_b nur
//                                      als Grenzwert — dass c_b = ln b ist, zeigt erst 3)
//    2. e^x und e^(kx)                (Stauchung des Graphen in x-Richtung — noch ohne Kettenregel)
//    3. natürlicher Logarithmus       (Frage nach dem Exponenten, Monotonie aus 2; b^x = e^(x ln b))
//    4. Produkte mit e                (Produktregel aus 2.1, Ableitung von e^(kx) aus 2)
//    5. Sinus und Kosinus             (Einheitskreis, Bogenmaß; grafisches Differenzieren aus 2.1)
//    6. Kettenregel                   (Verstärkungsfaktoren; bestätigt 2 und 3 im Nachhinein)
//    7. Quotientenregel               (Produktregel + Kettenregel aus 6; tan aus 5)
//    8. Funktion ln                   (Spiegelung an y = x; Begründung mit der Kettenregel aus 6)
//    9. Verhalten für x → ±∞          (Grenzwerte aus Thema 1.2, Monotoniesatz aus 2.1)
//   10. Symmetrie und Periode         (Definition mit f(−x); Bewegungen wie in 2.1)
//   11. Nullstellen                   (Nullprodukt, ln aus 3, sin⁻¹ aus der Mittelstufe)
//   12. Monotonie und Extrempunkte    (f′ aus 4–8, Nullstellen aus 11)
//   13. Wachstum und Schwingung       (Ableitungen aus 2 und 6 im Sachzusammenhang)
//   14. Stolperstelle                 (Potenzregel gegen Exponentialfunktion)
//
// Gerechnet wird mit Reglerwerten, nie mit Bildschirmkoordinaten. Die Prüfung liest die
// Zeichnungen aus dem SVG zurück (Maßstab aus den Gitterlinien mit data-wert) und rechnet nach.
//
// Farbcodierung wie in Thema 2.1: Graph f blau, Sekante und zweites Stück orange, Tangente und f′
// grün, Steigungsdreieck violett, Warnung (falsche Regel) rot, Hilfslinien grau.

import { mountUebungsaufgaben } from "../../../aufgaben.js?v=3";
import { AUFGABEN, parseZahl } from "./aufgaben-weitere-funktionen-ableiten.js?v=1";

// ---------- Helfer (dieselben wie in Thema 2.1 — Änderungen dort bekommt diese Seite nicht mit) ----------

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
const ZAHLFORMATE = new Map();
function zahlformat(stellen) {
  let f = ZAHLFORMATE.get(stellen);
  if (!f) ZAHLFORMATE.set(stellen, (f = new Intl.NumberFormat("de-DE", { maximumFractionDigits: stellen })));
  return f;
}
// Deutsche Schreibweise, echtes Minuszeichen; gerundet VOR der Ausgabe, damit kein „−0“ entsteht.
function num(x, stellen = 4) {
  const f = Math.pow(10, stellen);
  const g = Math.round(x * f) / f;
  return zahlformat(stellen).format(g === 0 ? 0 : g).replace("-", "−");
}
function numK(x, stellen = 4) {
  return Math.round(x * Math.pow(10, stellen)) < 0 ? `(${num(x, stellen)})` : num(x, stellen);
}
// „=“ oder „≈“: Entscheidend ist, ob die Anzeige mit dieser Stellenzahl den Wert genau trifft.
function zeichen(x, stellen = 4) {
  const f = Math.pow(10, stellen);
  return Math.abs(x * f - Math.round(x * f)) < 1e-7 ? "=" : "≈";
}
const HOCH = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "-": "⁻" };
const hoch = (n) => String(n).split("").map((c) => HOCH[c] || c).join("");
// Sehr kleine und sehr große Zahlen mit Zehnerpotenz — mit vier Nachkommastellen würde aus
// 1,65 · 10⁻⁵ eine „0“, und die Bilanz behauptete einen Wert, den f gar nicht annimmt.
function ungefaehr(x) {
  if (x === 0) return "= 0";
  const a = Math.abs(x);
  if (a >= 1e-3 && a < 1e7) return `${zeichen(x)} ${num(x)}`;
  let e = Math.floor(Math.log10(a));
  let m = Math.round((x / 10 ** e) * 100) / 100;
  if (Math.abs(m) >= 10) { m /= 10; e += 1; }
  return `≈ ${num(m, 2)} · 10${hoch(e)}`;
}
function bruch(z, n) {
  return `<span class="bruch"><span class="z">${z}</span><span class="n">${n}</span></span>`;
}
const eh = (e) => `e<sup>${e}</sup>`;
function regler(id) {
  return Number(document.getElementById(id).value);
}
function wahl(id) {
  return document.getElementById(id).value;
}
// Die Stellenzahl kommt aus dem step-Attribut: Bei step = 0,25 sind es zwei Stellen.
function reglerRaster(id) {
  const e = document.getElementById(id);
  const stellen = (String(e.step).split(".")[1] || "").length;
  return Number(Number(e.value).toFixed(stellen));
}
// Regler lügen nicht: Ein begrenzter Wert wird in den Regler zurückgeschrieben. Die Grenzen werden
// vorher auf das Raster des Reglers gelegt — sonst schriebe man 1,333 hinein, der Regler zeigte 1,3,
// und gerechnet würde mit einem Wert, den niemand eingestellt hat.
function begrenzt(id, wert, min, max) {
  const e = document.getElementById(id);
  const st = Number(e.step) || 1;
  const lo = Math.ceil(min / st - 1e-9) * st, hi = Math.floor(max / st + 1e-9) * st;
  const stellen = (String(e.step).split(".")[1] || "").length;
  const w = Number(Math.min(hi, Math.max(lo, wert)).toFixed(stellen));
  if (w !== wert) e.value = String(w);
  return w;
}
// Bereich eines Reglers, der von der gewählten Funktion abhängt — samt Startwert.
function setzeBereich(id, min, max, start) {
  const e = document.getElementById(id);
  e.min = String(min);
  e.max = String(max);
  e.value = String(start);
}
function setzeAnzeige(id, text) {
  document.getElementById(id).textContent = text;
}
function zeige(mountId, ...knoten) {
  const m = document.getElementById(mountId);
  m.innerHTML = "";
  knoten.forEach((k) => m.appendChild(k));
}
function setzeHtml(id, html) {
  document.getElementById(id).innerHTML = html;
}
function setzeText(id, text) {
  document.getElementById(id).textContent = text;
}
function flaeche(breite, hoehe) {
  return svgEl("svg", { viewBox: `0 0 ${breite} ${hoehe}`, width: breite, height: hoehe, class: "geo-svg", preserveAspectRatio: "xMidYMid meet" });
}
function schritt(spanne, ziel = 6) {
  const roh = spanne / ziel;
  const p = Math.pow(10, Math.floor(Math.log10(roh)));
  const m = roh / p;
  return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p;
}
function stellenFuer(d) {
  return d >= 1 ? 0 : Math.max(0, Math.ceil(-Math.log10(d) - 1e-9));
}
// Für einen unverzerrten Ausschnitt: y-Bereich passend zur Breite, damit Spiegelungen und Drehungen
// im Bild stimmen.
function gleichY(xmin, xmax, ymitte, breite, hoehe) {
  const halb = ((xmax - xmin) * (hoehe - 46)) / (breite - 60) / 2;
  return [ymitte - halb, ymitte + halb];
}

// Koordinatensystem mit reellem x. Die Gitterlinien tragen ihren Wert als data-wert; die
// Zeichenfläche hat einen Clip-Rahmen, damit Äste, die nach oben weglaufen, sauber abgeschnitten
// werden statt über die Beschriftung zu laufen.
let clipZaehler = 0;
function koordinatenXY({ breite = 560, hoehe = 320, xmin, xmax, ymin, ymax, xName = "x", yName = "y", zahlen = true, panel = null }) {
  const links = 46, rechts = 14, oben = 18, unten = 28;
  const X = (x) => links + ((x - xmin) / (xmax - xmin)) * (breite - links - rechts);
  const Y = (y) => hoehe - unten - ((y - ymin) / (ymax - ymin)) * (hoehe - oben - unten);
  const svg = flaeche(breite, hoehe);
  if (panel) svg.setAttribute("data-panel", panel);
  const id = `clip-${++clipZaehler}`;
  const defs = svgEl("defs");
  const cp = svgEl("clipPath", { id });
  cp.appendChild(svgEl("rect", { x: links, y: oben, width: breite - links - rechts, height: hoehe - oben - unten }));
  defs.appendChild(cp);
  svg.appendChild(defs);
  const dx = schritt(xmax - xmin, Math.max(4, Math.min(8, Math.round((breite - links - rechts) / 62))));
  const dy = schritt(ymax - ymin, Math.max(3, Math.min(6, Math.round((hoehe - oben - unten) / 48))));
  const stx = stellenFuer(dx), sty = stellenFuer(dy);
  for (let i = Math.ceil(xmin / dx - 1e-9); i * dx <= xmax + 1e-9 * dx; i++) {
    const w = Number((i * dx).toFixed(stx + 2));
    svg.appendChild(svgEl("line", { x1: X(w).toFixed(2), x2: X(w).toFixed(2), y1: oben, y2: hoehe - unten, class: "fr-gitter", "data-achse": "x", "data-wert": String(w), "stroke-opacity": "0.55" }));
    if (zahlen) svg.appendChild(svgText(X(w), hoehe - unten + 14, num(w, stx), { class: "fr-text" }));
  }
  for (let i = Math.ceil(ymin / dy - 1e-9); i * dy <= ymax + 1e-9 * dy; i++) {
    const w = Number((i * dy).toFixed(sty + 2));
    svg.appendChild(svgEl("line", { x1: links, x2: breite - rechts, y1: Y(w).toFixed(2), y2: Y(w).toFixed(2), class: "fr-gitter", "data-achse": "y", "data-wert": String(w) }));
    if (zahlen) svg.appendChild(svgText(links - 6, Y(w) + 4, num(w, sty), { class: "fr-text", "text-anchor": "end" }));
  }
  const xa = ymin <= 0 && ymax >= 0 ? 0 : ymin;
  const ya = xmin <= 0 && xmax >= 0 ? 0 : xmin;
  svg.appendChild(svgEl("line", { x1: links, x2: breite - rechts, y1: Y(xa).toFixed(2), y2: Y(xa).toFixed(2), class: "fr-achse" }));
  svg.appendChild(svgEl("line", { x1: X(ya).toFixed(2), x2: X(ya).toFixed(2), y1: oben - 4, y2: hoehe - unten, class: "fr-achse" }));
  if (xName) svg.appendChild(svgText(breite - rechts, hoehe - 4, xName, { class: "fr-text", "text-anchor": "end" }));
  if (yName) svg.appendChild(svgText(X(ya) + 6, oben - 5, yName, { class: "fr-text", "text-anchor": "start" }));
  const ebene = svgEl("g", { "clip-path": `url(#${id})` });
  svg.appendChild(ebene);
  return { svg, ebene, X, Y, links, rechts, oben, unten, breite, hoehe, xmin, xmax, ymin, ymax };
}

// Ein Funktionsgraph als Pfad. Wo f nicht definiert ist (NaN) oder weit aus dem Bild läuft, wird
// der Pfad unterbrochen. klasseVon(x, y) erlaubt, Teile anders zu färben (steigend / fallend); jeder
// Teil bekommt seine Klasse als data-teil, damit die Prüfung ihn auslesen kann.
function graph(K, f, x1, x2, { schritte = 400, klasseVon = () => "", rolle = "graph", basis = "fr-linie" } = {}) {
  const reichweite = (K.ymax - K.ymin) * 3;
  let pfad = "", klasse = null;
  const zeichne = () => {
    if (pfad) K.ebene.appendChild(svgEl("path", { d: pfad, class: basis + " " + (klasse || ""), "data-rolle": rolle, "data-teil": klasse || "graph" }));
    pfad = "";
  };
  let vorher = null;
  for (let i = 0; i <= schritte; i++) {
    const x = x1 + ((x2 - x1) * i) / schritte;
    const y = f(x);
    const gueltig = Number.isFinite(y) && y > K.ymin - reichweite && y < K.ymax + reichweite;
    if (!gueltig) { zeichne(); vorher = null; continue; }
    const k = klasseVon(x, y);
    if (vorher && k !== klasse) {
      zeichne();
      pfad = `M ${K.X(vorher[0]).toFixed(2)} ${K.Y(vorher[1]).toFixed(2)}`;
    }
    klasse = k;
    pfad += `${pfad ? " L" : "M"} ${K.X(x).toFixed(2)} ${K.Y(y).toFixed(2)}`;
    vorher = [x, y];
  }
  zeichne();
}
function punkt(K, x, y, klasse, attrs = {}) {
  K.ebene.appendChild(svgEl("circle", Object.assign({ cx: K.X(x).toFixed(2), cy: K.Y(y).toFixed(2), r: 5, class: klasse }, attrs)));
}
function strecke(K, x1, y1, x2, y2, klasse, attrs = {}) {
  K.ebene.appendChild(svgEl("line", Object.assign({ x1: K.X(x1).toFixed(2), y1: K.Y(y1).toFixed(2), x2: K.X(x2).toFixed(2), y2: K.Y(y2).toFixed(2), class: klasse }, attrs)));
}
// Eine Gerade durch (x0 | y0) mit Steigung m, über die ganze Breite — die Ebene schneidet ab.
function gerade(K, m, x0, y0, klasse, attrs = {}) {
  strecke(K, K.xmin, y0 + m * (K.xmin - x0), K.xmax, y0 + m * (K.xmax - x0), klasse,
    Object.assign({ "data-steigung": String(m), "data-x0": String(x0), "data-y0": String(y0) }, attrs));
}
function senkrechte(K, x, klasse, attrs = {}) {
  strecke(K, x, K.ymin, x, K.ymax, klasse, attrs);
}
function vieleck(K, punkte, klasse, attrs = {}) {
  K.ebene.appendChild(svgEl("polygon", Object.assign({ points: punkte.map(([x, y]) => `${K.X(x).toFixed(2)},${K.Y(y).toFixed(2)}`).join(" "), class: klasse }, attrs)));
}
// Ein Pfad aus beliebigen Punkten in Datenkoordinaten — für Kopien, die gespiegelt, gedreht oder
// verschoben werden.
function polylinie(K, punkte, klasse, attrs = {}) {
  let d = "";
  for (const [x, y] of punkte) d += `${d ? " L" : "M"} ${K.X(x).toFixed(2)} ${K.Y(y).toFixed(2)}`;
  if (d) K.ebene.appendChild(svgEl("path", Object.assign({ d, class: klasse }, attrs)));
}
// Beschriftung in Datenkoordinaten mit Versatz in Bildpunkten. Sie wird in die Zeichenfläche
// zurückgeschoben, statt am Rand abgeschnitten zu werden (mittig ausgerichtet ragte ein Text am
// linken Rand sonst halb aus dem Bild).
function beschrift(K, x, y, text, klasse, { dx = 0, dy = 0, anker = "middle" } = {}) {
  const breite = text.length * 7;
  let px = K.X(x) + dx, py = K.Y(y) + dy;
  const lo = anker === "start" ? 4 : anker === "end" ? 4 + breite : 4 + breite / 2;
  const hi = anker === "start" ? K.breite - 4 - breite : anker === "end" ? K.breite - 4 : K.breite - 4 - breite / 2;
  px = Math.min(hi, Math.max(lo, px));
  py = Math.min(K.hoehe - K.unten - 4, Math.max(K.oben + 12, py));
  K.svg.appendChild(svgText(px, py, text, { class: klasse, "text-anchor": anker }));
}
function panelTitel(K, text) {
  K.svg.appendChild(svgText(K.links + 6, K.oben + 14, text, { class: "panel-titel", "text-anchor": "start" }));
}
// Kleinster und größter Wert einer Funktion auf [a; b] — für Ausschnitte, die sich dem Inhalt anpassen.
function spanne(fs, a, b, n = 600) {
  let lo = Infinity, hi = -Infinity;
  for (let i = 0; i <= n; i++) {
    const x = a + ((b - a) * i) / n;
    for (const f of fs) {
      const y = f(x);
      if (Number.isFinite(y)) { lo = Math.min(lo, y); hi = Math.max(hi, y); }
    }
  }
  return [lo, hi];
}

// ================= 1. Exponentialfunktionen und die Zahl e =================

function renderBasis() {
  const b = reglerRaster("eb-b");
  const x0 = reglerRaster("eb-x");
  setzeAnzeige("eb-b-anzeige", num(b, 2));
  setzeAnzeige("eb-x-anzeige", num(x0, 1));
  const f = (x) => b ** x;
  // c_b ist der Grenzwert von (b^h − 1) : h. Ausgerechnet wird er hier mit ln b — dass beides
  // dasselbe ist, zeigt erst Abschnitt 3; angezeigt wird nur die Zahl und ihre Annäherung.
  const cb = Math.log(b);
  const f0 = f(x0), m = cb * f0, ab = 1 / cb;
  // Links Platz für den Fußpunkt der Tangente: Bei b = 1,5 und x₀ = −1,5 liegt er bei −3,97.
  const xmin = -4.3, xmax = 2.4;
  const ymax = Math.max(4.5, 1.08 * f(xmax));
  const K = koordinatenXY({ xmin, xmax, ymin: -0.08 * ymax, ymax });
  graph(K, f, xmin, xmax, { schritte: 500 });
  gerade(K, m, x0, f0, "dr-tangente", { "data-rolle": "tangente" });
  // Das Dreieck unter der Tangente: senkrecht f(x₀), waagerecht der Abstand zum Schnitt mit der
  // x-Achse. Seine Steigung ist f(x₀) : Abstand = f′(x₀) — und der Abstand bleibt beim Ziehen gleich.
  const xs = x0 - ab;
  vieleck(K, [[xs, 0], [x0, 0], [x0, f0]], "dr-dreieck-flaeche", { "data-rolle": "dreieck" });
  strecke(K, xs, 0, x0, 0, "dr-dreieck dx", { "data-rolle": "dx", "data-wert": String(ab) });
  strecke(K, x0, 0, x0, f0, "dr-dreieck", { "data-rolle": "dy", "data-wert": String(f0) });
  punkt(K, 0, 1, "fr-punkt dr-punkt-q", { "data-rolle": "y-achse", r: 4 });
  punkt(K, x0, f0, "fr-punkt", { "data-rolle": "p" });
  beschrift(K, x0, f0, "P", "dr-text-b dr-halo", { dx: -12, dy: -8 });
  beschrift(K, (xs + x0) / 2, 0, `Abstand ${num(ab, 2)}`, "dr-text-k dr-halo", { dy: 16 });
  // Der Name der senkrechten Kathete nur, wenn sie lang genug ist — sonst säße er auf der Achse.
  if (K.Y(0) - K.Y(f0) > 34) beschrift(K, x0, f0 / 2, "f(x₀)", "dr-text-v dr-halo", { dx: 6, dy: 4, anker: "start" });
  zeige("eb-mount", K.svg);
  const q = (b ** 0.001 - 1) / 0.001;
  setzeHtml("eb-bilanz",
    `f(x₀) = ${num(b, 2)}<sup>${num(x0, 1)}</sup> ${zeichen(f0)} <span class="wc">${num(f0)}</span>; Steigung der Tangente f′(x₀) ${zeichen(m)} <span class="wa">${num(m)}</span><br>` +
    `f′(x₀) : f(x₀) ${zeichen(cb)} <span class="wr">${num(cb)}</span> = c<sub>b</sub> — an jeder Stelle dieselbe Zahl, die Steigung bei x = 0. Annäherung: ${bruch(`${num(b, 2)}<sup>0,001</sup> − 1`, "0,001")} ${zeichen(q)} ${num(q)}<br>` +
    `Deshalb trifft die Tangente die x-Achse immer ${bruch("1", "c<sub>b</sub>")} ${zeichen(ab)} ${num(ab)} links von x₀.`);
  setzeHtml("eb-text", Math.abs(cb - 1) < 0.005
    ? `b = ${num(b, 2)} liegt ganz nah bei e ≈ 2,718: c<sub>b</sub> ist fast genau 1. Steigung und Funktionswert sind an jeder Stelle praktisch gleich, und die Tangente trifft die x-Achse 1 links von x₀.`
    : cb < 1
      ? "c<sub>b</sub> ist kleiner als 1: Die Steigung bleibt überall hinter dem Funktionswert zurück. Vergrößere b, bis c<sub>b</sub> = 1 wird."
      : "c<sub>b</sub> ist größer als 1: Die Steigung ist überall größer als der Funktionswert. Verkleinere b, bis c<sub>b</sub> = 1 wird.");
}

// ================= 2. e^x und e^(kx) =================

function renderEkx() {
  const k = reglerRaster("ek-k");
  // |k · x₀| ≤ 2: Der Partnerpunkt Q(kx₀ | e^(kx₀)) auf dem Graphen von e^x bleibt dann im Bild.
  const grenze = k === 0 ? 2 : Math.min(2, 2 / Math.abs(k));
  const x0 = begrenzt("ek-x", reglerRaster("ek-x"), -grenze, grenze);
  setzeAnzeige("ek-k-anzeige", num(k, 2));
  setzeAnzeige("ek-x-anzeige", num(x0, 1));
  const E = Math.exp(k * x0), m = k * E;
  const K = koordinatenXY({ xmin: -3.2, xmax: 3.2, ymin: -0.8, ymax: 8 });
  graph(K, Math.exp, -3.2, 3.2, { basis: "fr-linie duenn2", rolle: "ex" });
  graph(K, (x) => Math.exp(k * x), -3.2, 3.2, { rolle: "f" });
  gerade(K, m, x0, E, "dr-tangente", { "data-rolle": "tangente" });
  punkt(K, x0, E, "fr-punkt", { "data-rolle": "p" });
  if (k !== 0) {
    gerade(K, E, k * x0, E, "dr-tangente grenze", { "data-rolle": "tangente-q" });
    strecke(K, k * x0, E, x0, E, "dr-verbinder", { "data-rolle": "verbinder" });
    // Die Dreiecke zeigen immer nach unten — nach oben ragten sie bei e² ≈ 7,4 aus dem Bild. Das
    // Dreieck bei P ist 0,5 breit, sein Urbild bei Q ist k-mal so breit; die Höhe ist dieselbe.
    const s = k > 0 ? -1 : 1, d = 0.5;
    const hP = m * s * d;
    vieleck(K, [[x0, E], [x0 + s * d, E], [x0 + s * d, E + hP]], "dr-dreieck-flaeche", { "data-rolle": "dreieck-p" });
    strecke(K, x0, E, x0 + s * d, E, "dr-dreieck dx", { "data-rolle": "dx-p", "data-wert": String(d) });
    strecke(K, x0 + s * d, E, x0 + s * d, E + hP, "dr-dreieck", { "data-rolle": "dy-p", "data-wert": String(Math.abs(hP)) });
    const xq = k * x0, bq = k * s * d;
    vieleck(K, [[xq, E], [xq + bq, E], [xq + bq, E + E * bq]], "dr-dreieck-flaeche", { "data-rolle": "dreieck-q" });
    strecke(K, xq, E, xq + bq, E, "dr-dreieck dx duenn", { "data-rolle": "dx-q", "data-wert": String(Math.abs(bq)) });
    strecke(K, xq + bq, E, xq + bq, E + E * bq, "dr-dreieck duenn", { "data-rolle": "dy-q", "data-wert": String(Math.abs(E * bq)) });
    punkt(K, xq, E, "fr-punkt dr-punkt-q", { "data-rolle": "q", r: 4 });
    // Liegen P und Q fast übereinander (x₀ nahe 0 oder k nahe 1), bekommt Q keinen eigenen Namen.
    if (Math.abs(K.X(xq) - K.X(x0)) > 24) beschrift(K, xq, E, "Q", "dr-text-o dr-halo", { dx: xq < x0 ? -12 : 12, dy: -8 });
  }
  beschrift(K, x0, E, "P", "dr-text-b dr-halo", { dx: 0, dy: -12 });
  zeige("ek-mount", K.svg);
  if (k === 0) {
    setzeHtml("ek-bilanz", `k = 0: f(x) = e<sup>0</sup> = 1 für alle x — eine waagerechte Gerade. f′(x₀) = 0 · e<sup>0</sup> = <span class="wa">0</span>.`);
    setzeText("ek-text", "Mit k = 0 bleibt vom Graphen nur die Gerade y = 1. Stauchen lässt sich nichts mehr, die Steigung ist überall 0 = k · f(x).");
    return;
  }
  const breiteQ = Math.abs(k) * 0.5;
  setzeHtml("ek-bilanz",
    `Q(${num(k * x0)} | ${eh(num(k * x0))}) auf dem Graphen von ${eh("x")}: Steigung ${eh(num(k * x0))} ${zeichen(E)} ${num(E)}. P(${num(x0, 1)} | ${eh(num(k * x0))}) liegt genauso hoch.<br>` +
    `Gleiche Höhe ${zeichen(Math.abs(E * breiteQ))} ${num(Math.abs(E * breiteQ))}, Breite 0,5 statt ${num(breiteQ)} — das Dreieck bei P ist ${num(Math.abs(k), 2)}-mal so steil: ` +
    `f′(${num(x0, 1)}) = k · ${eh("k · x₀")} = ${numK(k, 2)} · ${num(E)} ${zeichen(m)} <span class="wa">${num(m)}</span>`);
  setzeText("ek-text", k < 0
    ? `Für k < 0 ist der Graph zusätzlich an der y-Achse gespiegelt: Er fällt, und f′ = k · f ist negativ. Je größer |k|, desto stärker gestaucht und desto steiler.`
    : Math.abs(k - 1) < 1e-9
      ? "k = 1: f ist eˣ selbst, P und Q fallen zusammen, und die Steigung ist der Funktionswert."
      : k < 1
        ? `Für 0 < k < 1 wird der Graph von eˣ in x-Richtung gestreckt: flacher, f′ = ${num(k, 2)} · f.`
        : `Für k > 1 wird der Graph von eˣ in x-Richtung gestaucht: steiler, f′ = ${num(k, 2)} · f.`);
}

// ================= 3. Der natürliche Logarithmus =================

function renderLog() {
  const art = wahl("lg-art");
  const c = reglerRaster("lg-c");
  const k = reglerRaster("lg-k");
  document.getElementById("lg-k").closest("label").hidden = art !== "ekx";
  setzeAnzeige("lg-c-anzeige", num(c, 2));
  setzeAnzeige("lg-k-anzeige", num(k, 2));
  const f = art === "ex" ? Math.exp : art === "ekx" ? (x) => Math.exp(k * x) : (x) => 2 ** x;
  const loesung = art === "ex" ? Math.log(c) : art === "ekx" ? (k === 0 ? NaN : Math.log(c) / k) : Math.log(c) / Math.LN2;
  // Der Ausschnitt wächst mit, wenn die Lösung weit draußen liegt (e^(0,25x) = 8 bei x ≈ 8,3).
  const rand = Number.isFinite(loesung) ? Math.abs(loesung) + 0.8 : 3;
  const xmin = Math.min(-3, -rand), xmax = Math.max(3, rand);
  const K = koordinatenXY({ xmin, xmax, ymin: -0.8, ymax: 9 });
  graph(K, f, xmin, xmax, { schritte: 600 });
  strecke(K, xmin, c, xmax, c, "dr-normale", { "data-rolle": "hoehe-c", "data-wert": String(c) });
  if (Number.isFinite(loesung)) {
    strecke(K, loesung, 0, loesung, c, "dr-verbinder", { "data-rolle": "lot" });
    punkt(K, loesung, c, "fr-punkt dr-punkt-q", { "data-rolle": "schnitt" });
    punkt(K, loesung, 0, "dr-schneidet", { "data-rolle": "loesung", "data-wert": String(loesung), r: 6 });
    beschrift(K, loesung, 0, `x ${zeichen(loesung, 2)} ${num(loesung, 2)}`, "dr-text-g dr-halo", { dy: 18 });
  }
  zeige("lg-mount", K.svg);
  const cT = num(c, 2);
  // Die Probe rechnet mit genau der Zahl, die angezeigt wird — nicht mit dem ungerundeten Wert.
  const gerundet = Math.round(loesung * 1e4) / 1e4;
  if (art === "ex") {
    setzeHtml("lg-bilanz",
      `${eh("x")} = ${cT} ⟺ x = ln ${cT} ${zeichen(loesung)} <span class="wa">${num(loesung)}</span>` +
      (c === 1 ? "" : `. Probe mit dem gerundeten Wert: ${eh(num(loesung))} ${zeichen(Math.exp(gerundet))} ${num(Math.exp(gerundet))} — fast genau ${cT}, weil der Exponent gerundet ist.`));
  } else if (art === "ekx") {
    if (k === 0) {
      setzeHtml("lg-bilanz", `k = 0: ${eh("0 · x")} = 1 für jedes x. ${c === 1 ? `Für c = 1 ist <span class="wa">jedes x</span> eine Lösung.` : `Für c = ${cT} ≠ 1 gibt es <span class="wg">keine Lösung</span>.`}`);
    } else {
      setzeHtml("lg-bilanz",
        `${eh(`${num(k, 2)}x`)} = ${cT} ⟺ ${num(k, 2)}x = ln ${cT} ⟺ x = ${k < 0 ? "−" : ""}${bruch(`ln ${cT}`, num(Math.abs(k), 2))} ${zeichen(loesung)} <span class="wa">${num(loesung)}</span>`);
    }
  } else {
    setzeHtml("lg-bilanz",
      `2<sup>x</sup> = ${cT} ⟺ ${eh("x · ln 2")} = ${cT} ⟺ x · ln 2 = ln ${cT} ⟺ x = ${bruch(`ln ${cT}`, "ln 2")} ${zeichen(loesung)} <span class="wa">${num(loesung)}</span>`);
  }
  setzeText("lg-text", art === "ekx" && k === 0
    ? "Mit k = 0 ist der Graph die waagerechte Gerade y = 1 — sie trifft die violette Gerade y = c gar nicht oder überall."
    : c === 1
      ? "c = 1: Jede Exponentialfunktion geht durch (0 | 1), also ist x = 0 — und ln 1 = 0."
      : c < 1
        ? `c < 1: Die Lösung ist ${art === "ekx" && k < 0 ? "positiv, weil der Graph fällt" : "negativ — der Logarithmus einer Zahl zwischen 0 und 1 ist negativ"}.`
        : "Weil der Graph streng monoton ist und jeden positiven Wert genau einmal erreicht, trifft die violette Gerade ihn genau einmal. Probiere auch kleine c.");
}

// ================= 4. Produkte mit e-Funktionen =================

// p als Koeffizienten von unten nach oben, k im Exponenten. f = p · e^(kx), f′ = (p′ + k · p) · e^(kx).
const PE = {
  xe: { p: [0, 1], k: -1, xs: [-1, 4], start: 0.5, oben: [-3, 1], unten: [-3.3, 5.8],
    dText: `f′(x) = 1 · ${eh("−x")} + x · (−${eh("−x")}) = (1 − x) · ${eh("−x")}`, qText: "1 − x", nullstellen: [1],
    extrema: "Die Klammer 1 − x wechselt bei 1 von + nach −: Hochpunkt H(1 | e<sup>−1</sup>) ≈ H(1 | 0,3679)." },
  x2e: { p: [0, 0, 1], k: -1, xs: [-1, 4], start: 0.5, oben: [-0.3, 3], unten: [-8.6, 1.6],
    dText: `f′(x) = 2x · ${eh("−x")} + x² · (−${eh("−x")}) = (2x − x²) · ${eh("−x")} = x(2 − x) · ${eh("−x")}`, qText: "2x − x²", nullstellen: [0, 2],
    extrema: "Die Klammer x(2 − x) wechselt bei 0 von − nach + und bei 2 von + nach −: Tiefpunkt T(0 | 0), Hochpunkt H(2 | 4e<sup>−2</sup>) ≈ H(2 | 0,5413)." },
  lin: { p: [2, -1], k: 0.5, xs: [-3, 3], start: -1, oben: [-4.8, 2.5], unten: [-7, 1.8],
    dText: `f′(x) = (−1) · ${eh("0,5x")} + (2 − x) · 0,5${eh("0,5x")} = (−1 + 1 − 0,5x) · ${eh("0,5x")} = −0,5x · ${eh("0,5x")}`, qText: "−0,5x", nullstellen: [0],
    extrema: "Die Klammer −0,5x wechselt bei 0 von + nach −: Hochpunkt H(0 | 2)." },
};
const polyWert = (p, x) => p.reduce((s, c, i) => s + c * x ** i, 0);
const polyAbl = (p) => p.slice(1).map((c, i) => c * (i + 1));
function peBereich() {
  const d = PE[wahl("pe-art")];
  setzeBereich("pe-x", d.xs[0], d.xs[1], d.start);
}
function renderProduktE() {
  const d = PE[wahl("pe-art")];
  const x0 = reglerRaster("pe-x");
  setzeAnzeige("pe-x-anzeige", num(x0, 1));
  const pd = polyAbl(d.p);
  const q = (x) => polyWert(pd, x) + d.k * polyWert(d.p, x);
  const f = (x) => polyWert(d.p, x) * Math.exp(d.k * x);
  const fd = (x) => q(x) * Math.exp(d.k * x);
  const xmin = d.xs[0] - 0.2, xmax = d.xs[1] + 0.2;
  const f0 = f(x0), m = fd(x0);
  const K1 = koordinatenXY({ breite: 560, hoehe: 250, xmin, xmax, ymin: d.oben[0], ymax: d.oben[1], panel: "f" });
  panelTitel(K1, "Graph von f");
  graph(K1, f, xmin, xmax, { schritte: 500, rolle: "f" });
  gerade(K1, m, x0, f0, "dr-tangente", { "data-rolle": "tangente" });
  punkt(K1, x0, f0, "fr-punkt", { "data-rolle": "p" });
  const K2 = koordinatenXY({ breite: 560, hoehe: 230, xmin, xmax, ymin: d.unten[0], ymax: d.unten[1], panel: "a" });
  panelTitel(K2, "f′ (grün/orange) und die Klammer (blau gestrichelt)");
  graph(K2, q, xmin, xmax, { basis: "fr-linie duenn2", rolle: "klammer" });
  graph(K2, fd, xmin, xmax, { schritte: 500, klasseVon: (x, y) => (y >= 0 ? "positiv" : "negativ"), rolle: "ableitung" });
  for (const n of d.nullstellen) punkt(K2, n, 0, "dr-schneidet", { "data-rolle": "nullstelle", "data-wert": String(n), r: 5 });
  punkt(K2, x0, m, "fr-punkt dr-punkt-t", { "data-rolle": "punkt-ableitung" });
  zeige("pe-mount", K1.svg, K2.svg);
  const q0 = q(x0), e0 = Math.exp(d.k * x0);
  const vz = Math.abs(q0) < 1e-12 ? "null" : q0 > 0 ? "positiv" : "negativ";
  setzeHtml("pe-bilanz",
    `${d.dText}<br>` +
    `x₀ = ${num(x0, 1)}: Klammer ${d.qText} ${zeichen(q0)} ${num(q0)}; ${eh(num(d.k * x0, 2))} ${zeichen(e0)} ${num(e0)} &gt; 0; ` +
    `f′(x₀) = ${numK(q0)} · ${num(e0)} ${zeichen(m)} <span class="${m > 0 ? "wa" : m < 0 ? "wo" : "wc"}">${num(m)}</span> — ${vz === "null" ? "null wie die Klammer" : `${vz} wie die Klammer`}.<br>${d.extrema}`);
  const naechste = d.nullstellen.reduce((a, b) => (Math.abs(b - x0) < Math.abs(a - x0) ? b : a));
  setzeText("pe-text", Math.abs(naechste - x0) < 0.05
    ? "Hier ist die Klammer null — und damit f′: Die Tangente ist waagerecht. Der e-Faktor hätte f′ nie null machen können."
    : "Die blaue Klammer und f′ haben überall dasselbe Vorzeichen und dieselben Nullstellen. Der e-Faktor verbiegt die Kurve nur, er ändert kein Vorzeichen.");
}

// ================= 5. Sinus und Kosinus am Einheitskreis =================

function renderSinus() {
  const x = reglerRaster("si-x");
  const h = reglerRaster("si-h");
  setzeAnzeige("si-x-anzeige", `${num(x, 1)} (≈ ${num((x * 180) / Math.PI, 1)}°)`);
  setzeAnzeige("si-h-anzeige", num(h, 2));
  const px = Math.cos(x), py = Math.sin(x), qx = Math.cos(x + h), qy = Math.sin(x + h);
  const hub = qy - py;
  // Kreis: 300 × 286 Bildpunkte, −1,3 … 1,3 in beiden Richtungen — unverzerrt, sonst wäre der
  // Kreis eine Ellipse und der Bogen nicht h lang.
  const K1 = koordinatenXY({ breite: 300, hoehe: 286, xmin: -1.3, xmax: 1.3, ymin: -1.3, ymax: 1.3, panel: "kreis" });
  K1.ebene.appendChild(svgEl("circle", { cx: K1.X(0).toFixed(2), cy: K1.Y(0).toFixed(2), r: (K1.X(1) - K1.X(0)).toFixed(2), class: "dr-kreis", "data-rolle": "einheitskreis" }));
  strecke(K1, 0, 0, px, py, "dr-radius", { "data-rolle": "radius" });
  let bogen = "";
  for (let i = 0; i <= 40; i++) {
    const t = x + (h * i) / 40;
    bogen += `${i ? " L" : "M"} ${K1.X(Math.cos(t)).toFixed(2)} ${K1.Y(Math.sin(t)).toFixed(2)}`;
  }
  K1.ebene.appendChild(svgEl("path", { d: bogen, class: "dr-bogen", "data-rolle": "bogen" }));
  strecke(K1, px, py, qx, py, "dr-dreieck dx", { "data-rolle": "lauf", "data-wert": String(qx - px) });
  strecke(K1, qx, py, qx, qy, "dr-hub", { "data-rolle": "hub", "data-wert": String(hub) });
  punkt(K1, px, py, "fr-punkt", { "data-rolle": "p" });
  punkt(K1, qx, qy, "fr-punkt dr-punkt-q", { "data-rolle": "q" });
  let winkel = "";
  for (let i = 0; i <= 30; i++) {
    const t = (x * i) / 30;
    winkel += `${i ? " L" : "M"} ${K1.X(0.22 * Math.cos(t)).toFixed(2)} ${K1.Y(0.22 * Math.sin(t)).toFixed(2)}`;
  }
  K1.ebene.appendChild(svgEl("path", { d: winkel, class: "dr-winkel", "data-rolle": "winkel-x" }));
  beschrift(K1, 0.32 * Math.cos(x / 2), 0.32 * Math.sin(x / 2), "x", "dr-text-v", { dy: 4 });
  beschrift(K1, px, py, "P", "dr-text-b", { dx: 12 * Math.cos(x), dy: -12 * Math.sin(x) + 4 });
  // Bei kleinem h lägen P und Q übereinander — dann bekommt Q keine eigene Beschriftung.
  if (h >= 0.3) beschrift(K1, qx, qy, "Q", "dr-text-o", { dx: 13 * Math.cos(x + h), dy: -13 * Math.sin(x + h) + 4 });

  const K2 = koordinatenXY({ breite: 380, hoehe: 286, xmin: 0, xmax: 7.6, ymin: -1.4, ymax: 1.4, panel: "graph" });
  graph(K2, Math.sin, 0, 7.6, { schritte: 400 });
  gerade(K2, Math.cos(x), x, py, "dr-tangente grenze", { "data-rolle": "tangente" });
  gerade(K2, hub / h, x, py, "dr-sekante", { "data-rolle": "sekante" });
  strecke(K2, x + h, py, x + h, qy, "dr-hub", { "data-rolle": "hub-graph", "data-wert": String(hub) });
  punkt(K2, x, py, "fr-punkt", { "data-rolle": "p" });
  punkt(K2, x + h, qy, "fr-punkt dr-punkt-q", { "data-rolle": "q" });
  zeige("si-mount", K1.svg, K2.svg);

  const q = hub / h, c = Math.cos(x);
  setzeHtml("si-bilanz",
    `Hub Δ = sin(${num(x + h, 2)}) − sin(${num(x, 1)}) ${zeichen(hub)} <span class="wr">${num(hub)}</span>; &nbsp; ${bruch("Δ", "h")} ${zeichen(q)} <span class="wo">${num(q)}</span><br>` +
    `cos(${num(x, 1)}) ${zeichen(c)} <span class="wa">${num(c)}</span> — Unterschied ${zeichen(Math.abs(q - c))} ${num(Math.abs(q - c))}.`);
  setzeText("si-text", h > 0.3
    ? "Der Bogen ist noch deutlich gekrümmt, Δ : h weicht von cos x ab. Mach h kleiner."
    : `Für kleines h ist der Bogen fast eine Strecke senkrecht zum Radius, und ihr Anstieg ist ungefähr h · cos x. Deshalb nähert sich Δ : h dem Wert cos x — die Steigung des Sinus an der Stelle x ist cos x.${Math.cos(x) < 0 ? " Hier ist cos x negativ: P läuft auf dem Kreis abwärts, der Sinus fällt." : ""}`);
}

// ================= 6. Kettenregel =================

// Drei Zahlengeraden mit demselben Maßstab: x, u = u(x) und f = g(u). Der Bereich hängt von der
// Funktion ab — bei e^(−x²) liegen die u-Werte links von 0.
const KE = {
  sin: { u: (x) => x * x, du: (x) => 2 * x, g: Math.sin, dg: Math.cos, uName: "u = x²", fName: "f = sin u", lo: -1.2, hi: 6.6,
    uT: (x) => `${numK(x, 2)}²`, fT: (u) => `sin(${num(u, 4)})`, gdT: "cos u", gdAn: (u) => `cos(${num(u, 4)})`, udT: "2x", f: "sin(x²)" },
  exp: { u: (x) => -x * x, du: (x) => -2 * x, g: Math.exp, dg: Math.exp, uName: "u = −x²", fName: "f = eᵘ", lo: -6.6, hi: 2.8,
    uT: (x) => `−${numK(x, 2)}²`, fT: (u) => eh(num(u, 4)), gdT: eh("u"), gdAn: (u) => eh(num(u, 4)), udT: "−2x", f: eh("−x²") },
  wurzel: { u: (x) => x * x + 1, du: (x) => 2 * x, g: Math.sqrt, dg: (u) => 0.5 / Math.sqrt(u), uName: "u = x² + 1", fName: "f = √u", lo: -0.6, hi: 7.6,
    uT: (x) => `${numK(x, 2)}² + 1`, fT: (u) => `√${num(u, 4)}`, gdT: bruch("1", "2√u"), gdAn: (u) => bruch("1", `2√${num(u, 4)}`), udT: "2x", f: "√(x² + 1)" },
};
function renderKette() {
  const d = KE[wahl("ke-art")];
  const x = reglerRaster("ke-x");
  const h = reglerRaster("ke-h");
  setzeAnzeige("ke-x-anzeige", num(x, 2));
  setzeAnzeige("ke-h-anzeige", num(h, 2));
  const B = 560, H = 300, lo = d.lo, hi = d.hi;
  const P = (w) => 40 + ((w - lo) / (hi - lo)) * (B - 60);
  const svg = flaeche(B, H);
  const u0 = d.u(x), u1 = d.u(x + h);
  const zeilen = [
    { y: 60, achse: "x", name: "x", von: x, bis: x + h, klasse: "x" },
    { y: 150, achse: "u", name: d.uName, von: u0, bis: u1, klasse: "u" },
    { y: 240, achse: "f", name: d.fName, von: d.g(u0), bis: d.g(u1), klasse: "f" },
  ];
  for (const z of zeilen) {
    svg.appendChild(svgEl("line", { x1: P(lo), x2: P(hi), y1: z.y, y2: z.y, class: "dr-zahlenstrahl", "data-rolle": "strahl-" + z.achse }));
    for (let w = Math.ceil(lo); w <= Math.floor(hi); w++) {
      svg.appendChild(svgEl("line", { x1: P(w).toFixed(2), x2: P(w).toFixed(2), y1: z.y - 5, y2: z.y + 5, class: "fr-gitter", "data-achse": z.achse, "data-wert": String(w) }));
      svg.appendChild(svgText(P(w), z.y + 19, num(w), { class: "fr-text" }));
    }
    svg.appendChild(svgText(P(lo), z.y - 12, z.name, { class: "panel-titel", "text-anchor": "start" }));
    svg.appendChild(svgEl("line", { x1: P(Math.min(z.von, z.bis)).toFixed(2), x2: P(Math.max(z.von, z.bis)).toFixed(2), y1: z.y, y2: z.y, class: "dr-intervall " + z.klasse, "data-rolle": "intervall-" + z.achse, "data-von": String(z.von), "data-bis": String(z.bis) }));
  }
  for (let i = 0; i < 2; i++) {
    const a = zeilen[i], b = zeilen[i + 1];
    svg.appendChild(svgEl("line", { x1: P(a.von).toFixed(2), y1: a.y + 4, x2: P(b.von).toFixed(2), y2: b.y - 4, class: "dr-verbinder" }));
    svg.appendChild(svgEl("line", { x1: P(a.bis).toFixed(2), y1: a.y + 4, x2: P(b.bis).toFixed(2), y2: b.y - 4, class: "dr-verbinder" }));
  }
  const du = u1 - u0, df = zeilen[2].bis - zeilen[2].von;
  svg.appendChild(svgText(B - 8, 108, `Δu : Δx ≈ ${num(du / h, 2)}`, { class: "dr-text-v", "text-anchor": "end" }));
  svg.appendChild(svgText(B - 8, 198, `Δf : Δu ≈ ${num(df / du, 2)}`, { class: "dr-text-g", "text-anchor": "end" }));
  zeige("ke-mount", svg);
  const aussen = d.dg(u0), innen = d.du(x), grenz = aussen * innen;
  setzeHtml("ke-bilanz",
    `f(x) = ${d.f}; Δx = h = ${num(h, 2)}; Δu = u(${num(x + h, 2)}) − u(${num(x, 2)}) ${zeichen(du)} ${num(du, 4)}; Δf = ${d.fT(u1)} − ${d.fT(u0)} ${zeichen(df)} ${num(df, 4)}<br>` +
    `${bruch("Δf", "Δx")} = ${bruch("Δf", "Δu")} · ${bruch("Δu", "Δx")} ${zeichen(df / h)} ${num(df / du, 4)} · ${numK(du / h, 4)} ${zeichen(df / h)} <span class="wo">${num(df / h, 4)}</span><br>` +
    `Für h → 0: äußere Ableitung ${d.gdT} an der Stelle u = ${d.uT(x)} = ${num(u0, 4)}: ${d.gdAn(u0)} ${zeichen(aussen)} ${num(aussen)}, mal innere Ableitung ${d.udT} = ${num(innen, 2)}: f′(${num(x, 2)}) ${zeichen(grenz)} <span class="wa">${num(grenz, 4)}</span>`);
  const umgekehrt = (du < 0) !== (df < 0) ? "Das f-Intervall liegt gegenüber dem u-Intervall umgekehrt" : "";
  setzeText("ke-text", grenz < 0
    ? `Hier ist das Produkt der Verstärkungsfaktoren negativ: Wenn x wächst, fällt f. ${umgekehrt || "Das u-Intervall liegt umgekehrt"} — die Längen multiplizieren sich trotzdem, nur mit Vorzeichen.`
    : h > 0.2
      ? "Bei großem h stimmen die Verhältnisse nur ungefähr mit den Ableitungen überein. Mach h kleiner und beobachte, wie sich Δf : Δx dem grünen Wert nähert."
      : "Das kleine x-Intervall wird von der inneren Funktion etwa um den Faktor u′(x) gestreckt, das u-Intervall von der äußeren etwa um den Faktor g′(u). Zusammen: äußere Ableitung mal innere Ableitung.");
}

// ================= 7. Quotientenregel =================

const PI2 = Math.PI / 2;
const QU = {
  rational: { f: (x) => x / (x * x + 1), u: (x) => x, du: () => 1, v: (x) => x * x + 1, dv: (x) => 2 * x, xs: [-3, 3], start: 0.5,
    bild: [-3.4, 3.4, -0.9, 0.9], aeste: [[-3.4, 3.4]], asymptoten: [], text: { u: "x", v: "x² + 1", du: "1", dv: "2x" } },
  expx: { f: (x) => Math.exp(x) / x, u: Math.exp, du: Math.exp, v: (x) => x, dv: () => 1, xs: [0.3, 2.5], start: 0.5,
    bild: [-3, 3, -6, 8], aeste: [[-3, -0.02], [0.02, 3]], asymptoten: [], text: { u: eh("x"), v: "x", du: eh("x"), dv: "1" } },
  tan: { f: Math.tan, u: Math.sin, du: Math.cos, v: Math.cos, dv: (x) => -Math.sin(x), xs: [-1.3, 1.3], start: 0.5,
    bild: [-4.6, 4.6, -5, 5], aeste: [[-4.6, -PI2 - 0.02], [-PI2 + 0.02, PI2 - 0.02], [PI2 + 0.02, 4.6]], asymptoten: [-PI2, PI2],
    text: { u: "sin x", v: "cos x", du: "cos x", dv: "−sin x" } },
};
function quBereich() {
  const d = QU[wahl("qu-art")];
  setzeBereich("qu-x", d.xs[0], d.xs[1], d.start);
}
function renderQuotient() {
  const d = QU[wahl("qu-art")];
  const x0 = reglerRaster("qu-x");
  setzeAnzeige("qu-x-anzeige", num(x0, 1));
  const [xmin, xmax, ymin, ymax] = d.bild;
  const K = koordinatenXY({ xmin, xmax, ymin, ymax });
  // Jeder Ast für sich — sonst verbände der Pfad über eine Polstelle hinweg +20 mit −20.
  d.aeste.forEach(([a, b], i) => graph(K, d.f, a, b, { schritte: 400, rolle: "f", basis: "fr-linie" + (i ? " ast" : "") }));
  for (const a of d.asymptoten) senkrechte(K, a, "dr-verbinder", { "data-rolle": "asymptote", "data-wert": String(a) });
  const u = d.u(x0), v = d.v(x0), du = d.du(x0), dv = d.dv(x0);
  const zaehler = du * v - u * dv, nenner = v * v, m = zaehler / nenner, f0 = d.f(x0);
  gerade(K, m, x0, f0, "dr-tangente", { "data-rolle": "tangente" });
  punkt(K, x0, f0, "fr-punkt", { "data-rolle": "p" });
  beschrift(K, x0, f0, "P", "dr-text-b dr-halo", { dx: -12, dy: -8 });
  zeige("qu-mount", K.svg);
  const dq = (d.f(x0 + 0.001) - f0) / 0.001;
  const t = d.text;
  setzeHtml("qu-bilanz",
    `u = ${t.u}, v = ${t.v}; u′ = ${t.du}, v′ = ${t.dv}. An der Stelle ${num(x0, 1)}: u ${zeichen(u)} ${num(u)}, v ${zeichen(v)} ${num(v)}, u′ ${zeichen(du)} ${num(du)}, v′ ${zeichen(dv)} ${num(dv)}<br>` +
    `f′(${num(x0, 1)}) = ${bruch("u′ · v − u · v′", "v²")} ${zeichen(m)} ${bruch(`${numK(du)} · ${numK(v)} − ${numK(u)} · ${numK(dv)}`, `${numK(v)}²`)} ${zeichen(m)} ${bruch(num(zaehler), num(nenner))} ${zeichen(m)} <span class="wa">${num(m)}</span><br>` +
    `Zum Vergleich der Differenzenquotient mit h = 0,001: ${zeichen(dq)} <span class="wo">${num(dq)}</span>`);
  const art = wahl("qu-art");
  setzeText("qu-text", art === "tan"
    ? `tan′ = 1 : cos² x ist nie kleiner als 1: Der Tangens steigt überall, am flachsten bei 0 (Steigung 1) und immer steiler zu den Polstellen ±π/2 hin.`
    : art === "expx"
      ? (Math.abs(x0 - 1) < 0.05 ? "Bei x = 1 ist der Zähler (x − 1) · eˣ null: waagerechte Tangente, der Tiefpunkt des rechten Astes." : "Der Zähler u′ · v − u · v′ = (x − 1) · eˣ entscheidet über das Vorzeichen, denn der Nenner x² ist positiv. Fahre zu x = 1.")
      : (Math.abs(Math.abs(x0) - 1) < 0.05 ? "Bei x = ±1 ist der Zähler 1 − x² null: waagerechte Tangente — hier liegen Hoch- und Tiefpunkt." : "Der Nenner (x² + 1)² ist immer positiv; das Vorzeichen von f′ steckt im Zähler 1 − x²."));
}

// ================= 8. Die Logarithmusfunktion =================

function renderLnFunktion() {
  const a = reglerRaster("lf-a");
  setzeAnzeige("lf-a-anzeige", num(a, 1));
  const E = Math.exp(a), d = 0.5;
  // Unverzerrt: Eine Spiegelung an y = x muss im Bild eine Spiegelung bleiben.
  const xmin = -2.2, xmax = 7;
  const [ymin, ymax] = gleichY(xmin, xmax, 2.4, 560, 560);
  const K = koordinatenXY({ breite: 560, hoehe: 560, xmin, xmax, ymin, ymax });
  strecke(K, Math.max(xmin, ymin), Math.max(xmin, ymin), Math.min(xmax, ymax), Math.min(xmax, ymax), "dr-verbinder", { "data-rolle": "spiegelachse" });
  graph(K, Math.exp, xmin, xmax, { schritte: 500, basis: "fr-linie duenn2", rolle: "exp" });
  graph(K, Math.log, 0.001, xmax, { schritte: 700, rolle: "ln" });
  gerade(K, E, a, E, "dr-tangente grenze", { "data-rolle": "tangente-p" });
  gerade(K, 1 / E, E, a, "dr-tangente", { "data-rolle": "tangente-q" });
  // Steigungsdreieck bei P (Breite 0,5) und sein Spiegelbild bei Q: waagerecht und senkrecht tauschen.
  vieleck(K, [[a, E], [a + d, E], [a + d, E + d * E]], "dr-dreieck-flaeche", { "data-rolle": "dreieck-p" });
  strecke(K, a, E, a + d, E, "dr-dreieck dx duenn", { "data-rolle": "dx-p", "data-wert": String(d) });
  strecke(K, a + d, E, a + d, E + d * E, "dr-dreieck duenn", { "data-rolle": "dy-p", "data-wert": String(d * E) });
  vieleck(K, [[E, a], [E, a + d], [E + d * E, a + d]], "dr-dreieck-flaeche", { "data-rolle": "dreieck-q" });
  strecke(K, E, a, E, a + d, "dr-dreieck dx", { "data-rolle": "dy-q", "data-wert": String(d) });
  strecke(K, E, a + d, E + d * E, a + d, "dr-dreieck", { "data-rolle": "dx-q", "data-wert": String(d * E) });
  strecke(K, a, E, E, a, "dr-verbinder", { "data-rolle": "pq" });
  punkt(K, a, E, "fr-punkt dr-punkt-q", { "data-rolle": "p" });
  punkt(K, E, a, "fr-punkt", { "data-rolle": "q" });
  beschrift(K, a, E, "P", "dr-text-o dr-halo", { dx: -12, dy: -6 });
  beschrift(K, E, a, "Q", "dr-text-b dr-halo", { dx: 10, dy: 16, anker: "start" });
  beschrift(K, xmax, xmax, "y = x", "dr-text-k", { dx: -6, dy: 16, anker: "end" });
  zeige("lf-mount", K.svg);
  setzeHtml("lf-bilanz",
    `P(${num(a, 1)} | ${eh(num(a, 1))}) ${zeichen(E)} P(${num(a, 1)} | ${num(E)}) auf dem Graphen von ${eh("x")}: Steigung ${eh(num(a, 1))} ${zeichen(E)} <span class="wo">${num(E)}</span><br>` +
    `Spiegelpunkt Q(${num(E)} | ${num(a, 1)}) auf dem Graphen von ln: Das Dreieck ist ${num(d * E)} breit und ${num(d)} hoch — Steigung ${bruch("1", num(E))} ${zeichen(1 / E)} <span class="wa">${num(1 / E)}</span><br>` +
    `Mit x = ${num(E)} als Stelle von Q: (ln x)′ = ${bruch("1", "x")} — die Steigung ist der Kehrwert der Stelle.`);
  setzeText("lf-text", a === 0
    ? "a = 0: P(0 | 1) und Q(1 | 0). Beide Steigungen sind 1 — das Dreieck ist gleichschenklig und geht in sich selbst über."
    : a > 0
      ? "Je weiter P nach rechts rückt, desto steiler wird eˣ — und desto flacher ln am Spiegelpunkt. ln wächst über jede Grenze, aber immer langsamer."
      : "Für a < 0 liegt Q zwischen 0 und 1: Dort ist ln negativ und sehr steil. Nahe der y-Achse fällt ln x gegen −∞.");
}

// ================= 9. Verhalten für x → ±∞ =================

const VH = {
  x3e: { f: (x) => x ** 3 * Math.exp(-x), fenster: [5, 10, 20, 30, 50], bereich: (W) => [0, W], rand: (W) => W,
    text: (W) => `x = ${num(W)}: x³ = ${num(W ** 3)}, ${eh("−x")} ${ungefaehr(Math.exp(-W))}; f(${num(W)}) ${ungefaehr(W ** 3 * Math.exp(-W))}`,
    grenze: `lim<sub>x→∞</sub> x³ · ${eh("−x")} = 0 — die x-Achse ist waagerechte Asymptote; für x → −∞ geht f gegen −∞.` },
  x2e: { f: (x) => x * x * Math.exp(x), fenster: [5, 10, 20, 30, 50], bereich: (W) => [-W, 1], rand: (W) => -W,
    text: (W) => `x = −${num(W)}: x² = ${num(W * W)}, ${eh("x")} ${ungefaehr(Math.exp(-W))}; f(−${num(W)}) ${ungefaehr(W * W * Math.exp(-W))}`,
    grenze: `lim<sub>x→−∞</sub> x² · ${eh("x")} = 0; für x → ∞ wächst f über jede Grenze.` },
  ex: { f: (x) => Math.exp(x) / (x * x), fenster: [4, 6, 8, 10, 12], bereich: (W) => [0.5, W], rand: (W) => W,
    text: (W) => `x = ${num(W)}: ${eh("x")} ${ungefaehr(Math.exp(W))}, x² = ${num(W * W)}; f(${num(W)}) ${ungefaehr(Math.exp(W) / (W * W))}`,
    grenze: `lim<sub>x→∞</sub> ${bruch(eh("x"), "x²")} = ∞ — der Zähler wächst schneller als jede Potenz.` },
  lnx: { f: (x) => Math.log(x) / x, fenster: [5, 10, 20, 50, 100], bereich: (W) => [0.5, W], rand: (W) => W,
    text: (W) => `x = ${num(W)}: ln x ${ungefaehr(Math.log(W))}; f(${num(W)}) ${ungefaehr(Math.log(W) / W)}`,
    grenze: `lim<sub>x→∞</sub> ${bruch("ln x", "x")} = 0 — der Logarithmus wächst langsamer als x.` },
  sin: { f: (x) => x * Math.sin(x), fenster: [5, 10, 20, 30, 50], bereich: (W) => [-W, W], rand: (W) => W,
    text: (W) => `x = ${num(W)}: sin x ${ungefaehr(Math.sin(W))}; f(${num(W)}) ${ungefaehr(W * Math.sin(W))}`,
    grenze: "Kein Grenzwert: f schwankt zwischen den Geraden y = x und y = −x mit immer größerer Weite." },
};
function renderVerhalten() {
  const art = wahl("vh-art");
  const d = VH[art];
  const W = d.fenster[regler("vh-w")];
  const [a, b] = d.bereich(W);
  setzeAnzeige("vh-w-anzeige", `${num(a, 1)} … ${num(b, 1)}`);
  let [lo, hi] = art === "sin" ? [-W, W] : spanne([d.f], a, b);
  lo = Math.min(lo, 0); hi = Math.max(hi, 0);
  const rand = (hi - lo) * 0.08;
  const K = koordinatenXY({ xmin: a, xmax: b, ymin: lo - rand, ymax: hi + rand });
  if (art === "sin") {
    gerade(K, 1, 0, 0, "dr-verbinder", { "data-rolle": "huelle" });
    gerade(K, -1, 0, 0, "dr-verbinder", { "data-rolle": "huelle" });
  }
  graph(K, d.f, a, b, { schritte: 1200, rolle: "f" });
  const xr = d.rand(W);
  punkt(K, xr, d.f(xr), "fr-punkt dr-punkt-q", { "data-rolle": "rand", "data-wert": String(xr) });
  zeige("vh-mount", K.svg);
  setzeHtml("vh-bilanz", `${d.text(W)}<br>${d.grenze}`);
  setzeText("vh-text", art === "sin"
    ? "Je größer das Fenster, desto weiter schwingt der Graph aus — er kommt aber immer wieder durch die x-Achse. Weder ein endlicher noch ein unendlicher Grenzwert."
    : art === "ex"
      ? "Der Graph fällt zunächst, hat bei x = 2 einen Tiefpunkt und schießt dann nach oben. Jedes größere Fenster zeigt: Der e-Faktor setzt sich gegen das x² im Nenner durch."
      : art === "lnx"
        ? "ln x wächst zwar über jede Grenze, aber so langsam, dass das x im Nenner gewinnt: Der Graph sinkt nach dem Hochpunkt bei x = e auf die x-Achse zu."
        : W <= 5
          ? "Im kleinen Fenster sieht man den Buckel des Graphen. Vergrößere das Fenster."
          : "Im großen Fenster drückt der e-Faktor den Graphen auf die x-Achse — so groß die Potenz von x auch wird.");
}

// ================= 10. Symmetrie und Periodizität =================

const SY = {
  cos: { f: Math.cos, achse: true, punkt: false, periode: true,
    achseT: "f(−x) = cos(−x) = cos x = f(x)", punktT: "−f(−x) = −cos x ≠ cos x (etwa bei x = 0: −1 ≠ 1)", periodeT: "f(x + 2π) = cos(x + 2π) = cos x = f(x)" },
  sin: { f: Math.sin, achse: false, punkt: true, periode: true,
    achseT: `f(−x) = sin(−x) = −sin x ≠ sin x (etwa bei x = ${bruch("π", "2")}: −1 ≠ 1)`, punktT: "f(−x) = sin(−x) = −sin x = −f(x)", periodeT: "f(x + 2π) = sin(x + 2π) = sin x = f(x)" },
  gauss: { f: (x) => Math.exp(-x * x), achse: true, punkt: false, periode: false,
    achseT: `f(−x) = ${eh("−(−x)²")} = ${eh("−x²")} = f(x)`, punktT: `−f(−x) = −${eh("−x²")} &lt; 0 &lt; f(x)`, periodeT: `f(2π) = ${eh("−4π²")} ${ungefaehr(Math.exp(-4 * Math.PI ** 2))} ≠ f(0) = 1` },
  xgauss: { f: (x) => x * Math.exp(-x * x), achse: false, punkt: true, periode: false,
    achseT: `f(−x) = −x · ${eh("−x²")} ≠ f(x) (etwa bei x = 1: −e<sup>−1</sup> ≠ e<sup>−1</sup>)`, punktT: `f(−x) = (−x) · ${eh("−(−x)²")} = −x · ${eh("−x²")} = −f(x)`,
    periodeT: `f(1) = e<sup>−1</sup> ≈ 0,3679, aber f(1 + 2π) ${ungefaehr((1 + 2 * Math.PI) * Math.exp(-((1 + 2 * Math.PI) ** 2)))}` },
  xsin: { f: (x) => x * Math.sin(x), achse: true, punkt: false, periode: false,
    achseT: "f(−x) = (−x) · sin(−x) = (−x) · (−sin x) = x · sin x = f(x)", punktT: `−f(−x) = −x · sin x ≠ f(x) (etwa bei x = ${bruch("π", "2")})`,
    periodeT: "f(x + 2π) = (x + 2π) · sin x ≠ x · sin x, sobald sin x ≠ 0 — die Ausschläge wachsen" },
  ex: { f: Math.exp, achse: false, punkt: false, periode: false,
    achseT: "f(−1) = e<sup>−1</sup> ≈ 0,3679, aber f(1) = e ≈ 2,7183", punktT: "−f(−1) = −e<sup>−1</sup> ≈ −0,3679, aber f(1) = e ≈ 2,7183",
    periodeT: `f(x + 2π) = ${eh("2π")} · ${eh("x")} ${ungefaehr(Math.exp(2 * Math.PI))} · ${eh("x")} ≠ ${eh("x")}` },
};
const SY_ART = { achse: "achsensymmetrisch zur y-Achse", punkt: "punktsymmetrisch zum Ursprung", periode: "periodisch mit der Periode 2π" };
function renderSymmetrie() {
  const d = SY[wahl("sy-art")];
  const modus = wahl("sy-modus");
  const t = reglerRaster("sy-t");
  setzeAnzeige("sy-t-anzeige", modus === "achse" ? `${num(t * 100)} %` : modus === "punkt" ? `${num(t * 180)}°` : `${num(t * 2, 1)}π`);
  // Unverzerrt: Eine Drehung um den Ursprung muss im Bild eine Drehung bleiben.
  const [ymin, ymax] = gleichY(-5, 5, 0, 560, 500);
  const K = koordinatenXY({ breite: 560, hoehe: 500, xmin: -5, xmax: 5, ymin, ymax });
  graph(K, d.f, -5, 5, { schritte: 600, rolle: "original" });
  const abb = modus === "achse"
    // Umklappen wie eine Buchseite um die y-Achse: Im Bild schrumpft x über 0 auf −x.
    ? ([x, y]) => [(1 - 2 * t) * x, y]
    : modus === "punkt"
      ? ([x, y]) => [x * Math.cos(Math.PI * t) - y * Math.sin(Math.PI * t), x * Math.sin(Math.PI * t) + y * Math.cos(Math.PI * t)]
      : ([x, y]) => [x + 2 * Math.PI * t, y];
  // Die Kopie entsteht aus einem breiteren Stück des Graphen, damit sie nach dem Verschieben um
  // 2π das ganze Bild füllt.
  const pkt = [];
  for (let i = 0; i <= 1200; i++) {
    const x = -5 - 2 * Math.PI + ((10 + 4 * Math.PI) * i) / 1200, y = d.f(x);
    if (Math.abs(y) > 30) continue;
    pkt.push(abb([x, y]));
  }
  polylinie(K, pkt, "fr-linie kopie", { "data-rolle": "kopie", "data-t": String(t), "data-modus": modus });
  if (modus === "punkt") punkt(K, 0, 0, "fr-punkt dr-punkt-x", { "data-rolle": "ursprung", r: 4 });
  zeige("sy-mount", K.svg);
  const ja = d[modus];
  setzeHtml("sy-bilanz", `${d[modus + "T"]}. ` + (ja ? `<span class="wa">f ist ${SY_ART[modus]}.</span>` : `<span class="wg">f ist nicht ${SY_ART[modus]}.</span>`));
  const bewegung = modus === "achse" ? "wie eine Buchseite um die y-Achse umgeklappt" : modus === "punkt" ? "um den Ursprung gedreht" : "nach rechts verschoben";
  setzeText("sy-text", t < 1
    ? `Die orange Kopie wird ${bewegung}. Schieb den Regler bis zum Ende.`
    : ja
      ? "Die Kopie liegt genau auf dem Original — der Graph geht bei dieser Bewegung in sich selbst über."
      : "Die Kopie liegt neben dem Original: Diese Eigenschaft hat der Graph nicht.");
}

// ================= 11. Nullstellen =================

const NS = {
  produkt: { bereich: [0, 4, 2], bild: [-3, 5, -3.5, 6] },
  exp: { bereich: [-1, 6, 3], bild: [-3, 2.5, -6.5, 6.5] },
  sin: { bereich: [-1, 1, 0.5], bild: [-0.5, 6.9, -1.6, 1.6] },
};
function nsBereich() {
  const [lo, hi, start] = NS[wahl("ns-art")].bereich;
  setzeBereich("ns-c", lo, hi, start);
}
// Lösungen von sin x = c mit 0 ≤ x < 2π, aufsteigend.
function sinLoesungen(c) {
  if (c === 1) return [PI2];
  if (c === -1) return [3 * PI2];
  const a = Math.asin(c);
  return [a < 0 ? a + 2 * Math.PI : a, Math.PI - a].sort((p, q) => p - q);
}
function renderNullstellen() {
  const art = wahl("ns-art");
  const c = reglerRaster("ns-c");
  setzeAnzeige("ns-c-anzeige", num(c, 2));
  const [xmin, xmax, ymin, ymax] = NS[art].bild;
  const K = koordinatenXY({ xmin, xmax, ymin, ymax });
  const cT = num(c, 2);
  if (art === "produkt") {
    const f = (x) => (x * x - c) * Math.exp(-0.5 * x);
    graph(K, (x) => x * x - c, xmin, xmax, { basis: "fr-linie duenn2", rolle: "polynom" });
    graph(K, f, xmin, xmax, { schritte: 600, rolle: "f" });
    const r = Math.sqrt(c);
    if (c === 0) punkt(K, 0, 0, "dr-beruehrt", { "data-rolle": "nullstelle", "data-wert": "0", "data-vielfachheit": "2", r: 6 });
    else for (const n of [-r, r]) punkt(K, n, 0, "dr-schneidet", { "data-rolle": "nullstelle", "data-wert": String(n), r: 6 });
    zeige("ns-mount", K.svg);
    setzeHtml("ns-bilanz", `${eh("−0,5x")} &gt; 0 für alle x, also: (x² − ${cT}) · ${eh("−0,5x")} = 0 ⟺ x² = ${cT} ⟺ ` +
      (c === 0 ? `x = <span class="wa">0</span> — eine doppelte Nullstelle: Der Graph berührt die x-Achse.` : `x = ±√${cT} ${zeichen(r)} <span class="wa">±${num(r)}</span>`));
    setzeText("ns-text", "Gestrichelt: das Polynom x² − c allein. Es hat genau dieselben Nullstellen wie f — der e-Faktor verändert die Höhe der Kurve, aber nie, wo sie null ist.");
    return;
  }
  if (art === "exp") {
    graph(K, (x) => Math.exp(x) - c, xmin, xmax, { schritte: 600, rolle: "f" });
    strecke(K, xmin, -c, xmax, -c, "dr-verbinder", { "data-rolle": "asymptote", "data-wert": String(-c) });
    if (c > 0) punkt(K, Math.log(c), 0, "dr-schneidet", { "data-rolle": "nullstelle", "data-wert": String(Math.log(c)), r: 6 });
    zeige("ns-mount", K.svg);
    setzeHtml("ns-bilanz", c > 0
      ? `${eh("x")} − ${cT} = 0 ⟺ ${eh("x")} = ${cT} ⟺ x = ln ${cT} ${zeichen(Math.log(c))} <span class="wa">${num(Math.log(c))}</span>`
      : `${eh("x")} = ${cT} hat <span class="wg">keine Lösung</span>, denn ${eh("x")} &gt; 0 für alle x.`);
    setzeText("ns-text", c > 0
      ? `Der Graph von eˣ − c nähert sich links der Geraden y = −c (gestrichelt) und schneidet die x-Achse genau einmal.`
      : "Für c ≤ 0 liegt der ganze Graph oberhalb der x-Achse — die Asymptote y = −c liegt selbst schon auf oder über ihr.");
    return;
  }
  graph(K, Math.sin, xmin, xmax, { schritte: 600, rolle: "f" });
  strecke(K, xmin, c, xmax, c, "dr-normale", { "data-rolle": "hoehe-c", "data-wert": String(c) });
  senkrechte(K, 2 * Math.PI, "dr-verbinder", { "data-rolle": "periode", "data-wert": String(2 * Math.PI) });
  const ls = sinLoesungen(c);
  const beruehrt = Math.abs(c) === 1;
  ls.forEach((x, i) => {
    punkt(K, x, c, beruehrt ? "dr-beruehrt" : "dr-schneidet", { "data-rolle": "loesung", "data-wert": String(x), r: 6 });
    beschrift(K, x, c, `x${i ? "₂" : ls.length > 1 ? "₁" : ""}`, "dr-text-g dr-halo", { dy: c >= 0 ? 20 : -10 });
  });
  zeige("ns-mount", K.svg);
  const a = Math.asin(c);
  if (beruehrt) {
    setzeHtml("ns-bilanz", `sin x = ${cT} hat für 0 ≤ x &lt; 2π nur <span class="wa">eine</span> Lösung: x = ${bruch(c > 0 ? "π" : "3π", "2")} ${zeichen(ls[0])} <span class="wa">${num(ls[0])}</span> — dort berührt die Gerade y = ${cT} die Sinuskurve.`);
  } else if (c === 0) {
    setzeHtml("ns-bilanz", `sin x = 0 für 0 ≤ x &lt; 2π: x₁ = <span class="wa">0</span> und x₂ = π ${zeichen(Math.PI)} <span class="wa">${num(Math.PI)}</span>; alle Nullstellen: x = k · π (k ganzzahlig).`);
  } else {
    // x₁ ist die kleinere Lösung — bei c < 0 ist das π − sin⁻¹(c), die um 2π verschobene kommt danach.
    setzeHtml("ns-bilanz", c > 0
      ? `sin<sup>−1</sup>(${cT}) ${zeichen(a)} ${num(a)}: x₁ ${zeichen(ls[0])} <span class="wa">${num(ls[0])}</span>; x₂ = π − sin<sup>−1</sup>(${cT}) ${zeichen(ls[1])} <span class="wa">${num(ls[1])}</span><br>Alle Lösungen: x₁ + k · 2π und x₂ + k · 2π (k ganzzahlig).`
      : `sin<sup>−1</sup>(${cT}) ${zeichen(a)} ${num(a)} liegt nicht im Bereich. x₁ = π − sin<sup>−1</sup>(${cT}) ${zeichen(ls[0])} <span class="wa">${num(ls[0])}</span>; x₂ = sin<sup>−1</sup>(${cT}) + 2π ${zeichen(ls[1])} <span class="wa">${num(ls[1])}</span><br>Alle Lösungen: x₁ + k · 2π und x₂ + k · 2π (k ganzzahlig).`);
  }
  setzeText("ns-text", beruehrt
    ? "Bei c = ±1 rücken die beiden Lösungen zu einer zusammen. Für |c| > 1 gäbe es gar keine — der Sinus bleibt zwischen −1 und 1."
    : "Die zweite Lösung liefert der Taschenrechner nicht: Sie liegt spiegelbildlich zur ersten, symmetrisch zu x = π/2 (bei c ≥ 0) beziehungsweise x = 3π/2 (bei c < 0). Rechts der gestrichelten Linie bei 2π wiederholt sich alles.");
}

// ================= 12. Monotonie und Extrempunkte =================

const MO = {
  xe: { f: (x) => x * Math.exp(-x), d: (x) => (1 - x) * Math.exp(-x), xs: [-1, 4], start: 0, oben: [-3, 0.8], unten: [-0.6, 5.8],
    dText: `f′(x) = (1 − x) · ${eh("−x")}`, nullstellen: [1],
    monoton: "f steigt für x &lt; 1 und fällt für x &gt; 1 — das Vorzeichen bestimmt allein die Klammer 1 − x.",
    punkte: [[1, "H"]], extrema: "Hochpunkt H(1 | e<sup>−1</sup>) ≈ H(1 | 0,3679) — zugleich das globale Maximum." },
  x2e: { f: (x) => (x * x - 3) * Math.exp(x), d: (x) => (x * x + 2 * x - 3) * Math.exp(x), xs: [-4.5, 1.4], start: -4, oben: [-6, 1], unten: [-3.6, 7.5],
    dText: `f′(x) = 2x · ${eh("x")} + (x² − 3) · ${eh("x")} = (x² + 2x − 3) · ${eh("x")} = (x + 3)(x − 1) · ${eh("x")}`, nullstellen: [-3, 1],
    monoton: "f steigt für x &lt; −3 und für x &gt; 1; f fällt für −3 &lt; x &lt; 1.",
    punkte: [[-3, "H"], [1, "T"]], extrema: "Hochpunkt H(−3 | 6e<sup>−3</sup>) ≈ H(−3 | 0,2987), Tiefpunkt T(1 | −2e) ≈ T(1 | −5,4366) — das globale Minimum." },
  xsin: { f: (x) => x - 2 * Math.sin(x), d: (x) => 1 - 2 * Math.cos(x), xs: [-1.5, 7], start: 0, oben: [-1.4, 7.5], unten: [-1.4, 3.4],
    dText: `f′(x) = 1 − 2 cos x; f′(x) = 0 ⟺ cos x = 0,5 ⟺ x = ±${bruch("π", "3")} + k · 2π`, nullstellen: [-Math.PI / 3, Math.PI / 3, (5 * Math.PI) / 3],
    monoton: `Im Bild: f steigt bis −${bruch("π", "3")}, fällt bis ${bruch("π", "3")}, steigt bis ${bruch("5π", "3")} und fällt danach — alle 2π wiederholt sich das.`,
    punkte: [[-Math.PI / 3, "H₁"], [Math.PI / 3, "T"], [(5 * Math.PI) / 3, "H₂"]],
    extrema: `Hochpunkte H₁(−${bruch("π", "3")} | −${bruch("π", "3")} + √3) ≈ H₁(−1,0472 | 0,6849) und H₂(${bruch("5π", "3")} | ${bruch("5π", "3")} + √3) ≈ H₂(5,236 | 6,9681), Tiefpunkt T(${bruch("π", "3")} | ${bruch("π", "3")} − √3) ≈ T(1,0472 | −0,6849) — und so weiter im Abstand 2π.` },
  xln: { f: (x) => x * Math.log(x), d: (x) => Math.log(x) + 1, xs: [0.1, 3], start: 0.2, oben: [-0.6, 3.6], unten: [-3, 2.4],
    dText: `f′(x) = 1 · ln x + x · ${bruch("1", "x")} = ln x + 1; f′(x) = 0 ⟺ ln x = −1 ⟺ x = e<sup>−1</sup>`, nullstellen: [Math.exp(-1)],
    monoton: "f fällt für 0 &lt; x &lt; e<sup>−1</sup> und steigt für x &gt; e<sup>−1</sup>.",
    punkte: [[Math.exp(-1), "T"]], extrema: "Tiefpunkt T(e<sup>−1</sup> | −e<sup>−1</sup>) ≈ T(0,3679 | −0,3679) — das globale Minimum." },
};
function moBereich() {
  const d = MO[wahl("mo-art")];
  setzeBereich("mo-x", d.xs[0], d.xs[1], d.start);
}
function renderMonotonie() {
  const art = wahl("mo-art");
  const d = MO[art];
  const x0 = reglerRaster("mo-x");
  setzeAnzeige("mo-x-anzeige", num(x0, 1));
  const f = d.f, fd = d.d, m = fd(x0);
  // ln x ist nur für x > 0 definiert — der Graph beginnt knapp rechts der y-Achse.
  const xmin = art === "xln" ? 0 : d.xs[0] - 0.1, xmax = d.xs[1] + 0.1, start = art === "xln" ? 0.001 : xmin;
  const typ = (x) => (fd(x) > 1e-12 ? "steigt" : fd(x) < -1e-12 ? "faellt" : "steigt");
  const K1 = koordinatenXY({ breite: 560, hoehe: 250, xmin, xmax, ymin: d.oben[0], ymax: d.oben[1], panel: "f" });
  panelTitel(K1, "Graph von f");
  graph(K1, f, start, xmax, { schritte: 700, klasseVon: (x) => typ(x) });
  gerade(K1, m, x0, f(x0), "dr-tangente grenze", { "data-rolle": "tangente" });
  for (const [xe, name] of d.punkte) {
    punkt(K1, xe, f(xe), "fr-punkt", { "data-rolle": "extrem", "data-typ": name, r: 4 });
    beschrift(K1, xe, f(xe), name, "dr-text-k dr-halo", { dy: name.startsWith("H") ? -10 : 20 });
  }
  punkt(K1, x0, f(x0), "fr-punkt dr-punkt-t", { "data-rolle": "p" });
  const K2 = koordinatenXY({ breite: 560, hoehe: 210, xmin, xmax, ymin: d.unten[0], ymax: d.unten[1], panel: "a" });
  panelTitel(K2, "Graph von f′");
  graph(K2, fd, start, xmax, { schritte: 700, klasseVon: (x, y) => (y > 0 ? "positiv" : "negativ"), rolle: "ableitung" });
  for (const xn of d.nullstellen) punkt(K2, xn, 0, "dr-schneidet", { "data-rolle": "nullstelle-ableitung", "data-wert": String(xn), r: 4 });
  punkt(K2, x0, m, "fr-punkt dr-punkt-t", { "data-rolle": "punkt-ableitung" });
  zeige("mo-mount", K1.svg, K2.svg);
  const lage = Math.abs(m) < 1e-9 ? "= 0: waagerechte Tangente" : m > 0 ? "&gt; 0: f steigt hier" : "&lt; 0: f fällt hier";
  setzeHtml("mo-bilanz",
    `${d.dText}<br>${d.monoton}<br>${d.extrema}<br>` +
    `x₀ = ${num(x0, 1)}: f′(x₀) ${zeichen(m)} <span class="${m > 0 ? "wa" : m < 0 ? "wo" : "wc"}">${num(m)}</span> ${lage}.`);
  const naechste = d.punkte.reduce((a, b) => (Math.abs(b[0] - x0) < Math.abs(a[0] - x0) ? b : a));
  setzeText("mo-text", Math.abs(naechste[0] - x0) < 0.2
    ? `In der Nähe von ${naechste[1]}: Dort hat f′ eine Nullstelle und wechselt das Vorzeichen ${naechste[1].startsWith("H") ? "von + nach −: erst steigt f, dann fällt es" : "von − nach +: erst fällt f, dann steigt es"}.`
    : art === "xsin"
      ? "Grün: f steigt, f′ ist positiv. Orange: f fällt. Anders als bei einem Polynom hören die Extrempunkte nie auf — sie wiederholen sich alle 2π."
      : "Grün: f steigt, f′ ist positiv. Orange: f fällt, f′ ist negativ. Fahre zu einer Nullstelle von f′.");
}

// ================= 13. Wachstum und Schwingung =================

const WA = {
  bakterien: { f: (t) => 500 * Math.exp(0.3 * t), d: (t) => 150 * Math.exp(0.3 * t), y: [0, 11000], xName: "t in h", yName: "N",
    bilanz: (t, w, r) => `N(t) = 500 · ${eh("0,3t")}, N′(t) = 500 · 0,3 · ${eh("0,3t")} = 150 · ${eh("0,3t")}<br>` +
      `t = ${num(t, 2)} h: N(${num(t, 2)}) ${zeichen(w, 2)} <span class="wc">${num(w, 2)}</span> Bakterien, N′(${num(t, 2)}) ${zeichen(r, 2)} <span class="wa">${num(r, 2)}</span> Bakterien pro Stunde; N′ : N = 0,3 — 30 % des Bestands pro Stunde.` },
  abkuehlung: { f: (t) => 20 + 70 * Math.exp(-0.1 * t), d: (t) => -7 * Math.exp(-0.1 * t), y: [0, 100], xName: "t in min", yName: "T in °C", asymptote: 20,
    bilanz: (t, w, r) => `T(t) = 20 + 70 · ${eh("−0,1t")}, T′(t) = 70 · (−0,1) · ${eh("−0,1t")} = −7 · ${eh("−0,1t")}<br>` +
      `t = ${num(t, 2)} min: T ${zeichen(w, 2)} <span class="wc">${num(w, 2)}</span> °C, T′ ${zeichen(r, 2)} <span class="wa">${num(r, 2)}</span> °C pro Minute = −0,1 · (T − 20) — ein Zehntel des Unterschieds zur Raumtemperatur.` },
  pendel: { f: (t) => 4 * Math.sin(2 * t), d: (t) => 8 * Math.cos(2 * t), y: [-5, 5], xName: "t in s", yName: "s in cm",
    bilanz: (t, w, r) => `s(t) = 4 · sin(2t), v(t) = s′(t) = 4 · cos(2t) · 2 = 8 · cos(2t)<br>` +
      `t = ${num(t, 2)} s: Auslenkung s ${zeichen(w, 2)} <span class="wc">${num(w, 2)}</span> cm, Geschwindigkeit v ${zeichen(r, 2)} <span class="wa">${num(r, 2)}</span> cm pro Sekunde.` },
};
function renderWachstum() {
  const art = wahl("wa-art");
  const d = WA[art];
  const t = reglerRaster("wa-t");
  setzeAnzeige("wa-t-anzeige", num(t, 2));
  const K = koordinatenXY({ xmin: 0, xmax: 10.5, ymin: d.y[0], ymax: d.y[1], xName: d.xName, yName: d.yName });
  if (d.asymptote !== undefined) strecke(K, 0, d.asymptote, 10.5, d.asymptote, "dr-verbinder", { "data-rolle": "asymptote", "data-wert": String(d.asymptote) });
  graph(K, d.f, 0, 10.5, { schritte: 600, rolle: "f" });
  const w = d.f(t), r = d.d(t);
  gerade(K, r, t, w, "dr-tangente", { "data-rolle": "tangente" });
  punkt(K, t, w, "fr-punkt", { "data-rolle": "p" });
  zeige("wa-mount", K.svg);
  setzeHtml("wa-bilanz", d.bilanz(t, w, r));
  setzeText("wa-text", art === "bakterien"
    ? "Die Tangente wird immer steiler: Je mehr Bakterien da sind, desto schneller kommen neue dazu — die Rate wächst im selben Verhältnis wie der Bestand."
    : art === "abkuehlung"
      ? "Anfangs fällt die Temperatur schnell, später kaum noch: Die Rate ist proportional zum Abstand von 20 °C, und der schrumpft. Die gestrichelte Gerade erreicht der Graph nie."
      : Math.abs(w) < 0.4
        ? "Das Pendel geht gerade durch die Ruhelage: Hier ist es am schnellsten, |v| ist fast 8 cm pro Sekunde."
        : Math.abs(r) < 1
          ? "Das Pendel ist fast an einem Umkehrpunkt: Die Geschwindigkeit ist nahezu null, die Tangente fast waagerecht."
          : "Die Steigung der Tangente ist die momentane Geschwindigkeit. Fahre zu einem Durchgang durch s = 0 und zu einem Umkehrpunkt.");
}

// ================= 14. Stolperstelle =================

function renderStolperstelle() {
  const x0 = reglerRaster("sp-x");
  setzeAnzeige("sp-x-anzeige", num(x0, 1));
  const y0 = Math.exp(x0), richtig = y0, falsch = x0 * Math.exp(x0 - 1);
  const K = koordinatenXY({ xmin: -2.5, xmax: 2.5, ymin: -2, ymax: 8 });
  graph(K, Math.exp, -2.5, 2.5, { schritte: 500 });
  gerade(K, richtig, x0, y0, "dr-tangente", { "data-rolle": "tangente" });
  gerade(K, falsch, x0, y0, "dr-falsch", { "data-rolle": "falsch" });
  punkt(K, x0, y0, "fr-punkt", { "data-rolle": "p" });
  beschrift(K, x0, y0, "P", "dr-text-b dr-halo", { dx: -12, dy: -8 });
  zeige("sp-mount", K.svg);
  const dq = (Math.exp(x0 + 0.001) - y0) / 0.001;
  setzeHtml("sp-bilanz",
    `Richtig: (${eh("x")})′ = ${eh("x")}, also f′(${num(x0, 1)}) = ${eh(num(x0, 1))} ${zeichen(richtig)} <span class="wa">${num(richtig)}</span><br>` +
    `Falsch: x · ${eh("x − 1")} ergäbe ${numK(x0, 1)} · ${eh(num(x0 - 1, 1))} ${zeichen(falsch)} <span class="wg">${num(falsch)}</span><br>` +
    `Differenzenquotient mit h = 0,001: ${bruch(`${eh(num(x0 + 0.001, 3))} − ${eh(num(x0, 1))}`, "0,001")} ${zeichen(dq)} <span class="wo">${num(dq)}</span> — er bestätigt die grüne Tangente.`);
  setzeText("sp-text", x0 < 0
    ? "Für x₀ < 0 behauptet die falsche Formel sogar eine negative Steigung — bei einer Funktion, die überall steigt. Die rote Gerade schneidet den Graphen, statt ihn zu berühren."
    : x0 === 0
      ? "An der Stelle 0 behauptet die falsche Formel eine waagerechte Tangente. Die richtige Steigung ist e⁰ = 1."
      : "Auch für x₀ > 0 ist die rote Gerade zu flach: Sie schneidet den Graphen. Nur die grüne Tangente schmiegt sich an.");
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

// Die richtige Antwort steht bewusst an wechselnder Stelle.
const QUIZZE = {
  "quiz-e": {
    q: `Für welche Basis b ist die Steigung des Graphen von b<sup>x</sup> an jeder Stelle genauso groß wie der Funktionswert?`,
    options: ["b = 2", "b = e ≈ 2,718", "b = 10", "Für keine — die Steigung wächst immer schneller als der Funktionswert."],
    correct: 1,
    explain: "Die Steigung ist c<sub>b</sub> · b<sup>x</sup>. Gleich dem Funktionswert heißt c<sub>b</sub> = 1 — und genau so ist e festgelegt. Für b = 2 ist c<sub>2</sub> ≈ 0,69 &lt; 1, die Steigung bleibt hinter dem Funktionswert zurück; für b = 10 ist c<sub>10</sub> ≈ 2,30 &gt; 1.",
  },
  "quiz-ex": {
    q: `Welche Ableitung hat f(x) = 4${eh("−0,5x")}?`,
    options: [`f′(x) = −2${eh("−0,5x")}`, `f′(x) = 4${eh("−0,5x")}`, `f′(x) = −0,5${eh("−0,5x")}`, `f′(x) = 4 · (−0,5x) · ${eh("−0,5x − 1")}`],
    correct: 0,
    explain: `(a · e<sup>kx</sup>)′ = a · k · e<sup>kx</sup> = 4 · (−0,5) · e<sup>−0,5x</sup> = −2e<sup>−0,5x</sup>. Ohne den Faktor k stimmte nur e<sup>x</sup> selbst mit seiner Ableitung überein; −0,5e<sup>−0,5x</sup> vergisst den Vorfaktor 4, und die letzte Antwort wendet die Potenzregel auf einen Exponenten an — dort gilt sie nicht.`,
  },
  "quiz-ln": {
    q: `Für welches x gilt 5 · ${eh("2x")} = 20?`,
    options: ["x = ln 4 ≈ 1,386", "x = 2", `x = ${bruch("ln 15", "2")} ≈ 1,354`, "x = ln 2 ≈ 0,693"],
    correct: 3,
    explain: `Erst durch 5 teilen: e<sup>2x</sup> = 4, dann logarithmieren: 2x = ln 4, also x = ${bruch("ln 4", "2")} = ${bruch("2 ln 2", "2")} = ln 2. ln 4 vergisst das Teilen durch 2; ln 15 zieht 5 ab statt durch 5 zu teilen. Probe: 5 · e<sup>2 ln 2</sup> = 5 · 4 = 20 ✓`,
  },
  "quiz-produkt-e": {
    q: `Welche Ableitung hat f(x) = x · ${eh("2x")}?`,
    options: [`f′(x) = 2${eh("2x")}`, `f′(x) = (x + 2) · ${eh("2x")}`, `f′(x) = (1 + 2x) · ${eh("2x")}`, `f′(x) = 2x · ${eh("2x")}`],
    correct: 2,
    explain: `Produktregel mit u = x, v = e<sup>2x</sup>: u′ · v + u · v′ = 1 · e<sup>2x</sup> + x · 2e<sup>2x</sup> = (1 + 2x) · e<sup>2x</sup> — in der Klammer steht p′ + k · p. 2e<sup>2x</sup> wäre u′ · v′ (faktorweise abgeleitet), (x + 2) vertauscht die Rollen: p + k · p′. 2x · e<sup>2x</sup> ist nur der zweite Summand.`,
  },
  "quiz-sinus": {
    q: "Welche Ableitung hat f(x) = 2 sin x − cos x?",
    options: ["f′(x) = 2 cos x − sin x", "f′(x) = −2 cos x + sin x", "f′(x) = 2 cos x", "f′(x) = 2 cos x + sin x"],
    correct: 3,
    explain: "(2 sin x)′ = 2 cos x und (−cos x)′ = −(−sin x) = +sin x. Das doppelte Minus ist die häufigste Falle: cos′ = −sin, und davor steht schon ein Minus.",
  },
  "quiz-kette": {
    q: `Welche Ableitung hat f(x) = ${eh("x²")}?`,
    options: [`f′(x) = ${eh("x²")}`, `f′(x) = 2x · ${eh("x²")}`, `f′(x) = x² · ${eh("x² − 1")}`, `f′(x) = 2x · ${eh("2x")}`],
    correct: 1,
    explain: "Äußere Funktion e<sup>u</sup> mit der Ableitung e<sup>u</sup>, innere Funktion u = x² mit der Ableitung 2x: f′(x) = e<sup>x²</sup> · 2x. Ohne den Faktor 2x fehlt die innere Ableitung; x² · e<sup>x² − 1</sup> ist die Potenzregel am falschen Ort, und 2x · e<sup>2x</sup> leitet auch noch den Exponenten im e mit ab.",
  },
  "quiz-quotient": {
    q: `Welche Ableitung hat f(x) = ${bruch("x", "x + 1")}?`,
    options: [`f′(x) = −${bruch("1", "(x + 1)²")}`, "f′(x) = 1", `f′(x) = ${bruch("1", "x + 1")}`, `f′(x) = ${bruch("1", "(x + 1)²")}`],
    correct: 3,
    explain: `u = x, v = x + 1, u′ = v′ = 1: ${bruch("u′ · v − u · v′", "v²")} = ${bruch("(x + 1) − x", "(x + 1)²")} = ${bruch("1", "(x + 1)²")}. Mit vertauschter Reihenfolge im Zähler käme das Minuszeichen heraus; „1“ ist u′ : v′ — faktorweise abgeleitet.`,
  },
  "quiz-lnfunktion": {
    q: "Welche Ableitung hat f(x) = ln(3x² + 1)?",
    options: [`f′(x) = ${bruch("1", "3x² + 1")}`, `f′(x) = ${bruch("6x", "3x² + 1")}`, "f′(x) = 6x · ln(3x² + 1)", `f′(x) = ${bruch("1", "6x")}`],
    correct: 1,
    explain: `Kettenregel: äußere Ableitung ${bruch("1", "u")}, innere Ableitung 6x, also ${bruch("6x", "3x² + 1")} = ${bruch("u′", "u")}. Ohne den Faktor 6x fehlt die innere Ableitung; 1 : 6x nimmt den Kehrwert der falschen Funktion.`,
  },
  "quiz-verhalten": {
    q: `Wie verhält sich f(x) = x⁴ · ${eh("−2x")} für x → ∞ und für x → −∞?`,
    options: ["f(x) → ∞ für x → ∞ und f(x) → 0 für x → −∞", "f(x) → ∞ für x → ±∞, weil x⁴ den höchsten Exponenten hat", "f(x) → 0 für x → ∞ und f(x) → ∞ für x → −∞", "f(x) → 0 für x → ±∞"],
    correct: 2,
    explain: "Für x → ∞ geht e<sup>−2x</sup> gegen 0 und setzt sich gegen jede Potenz durch: f(x) → 0. Für x → −∞ wachsen beide Faktoren, x⁴ positiv und e<sup>−2x</sup> über jede Grenze: f(x) → ∞. Die Regel „der höchste Exponent entscheidet“ gilt nur für Polynome.",
  },
  "quiz-symmetrie": {
    q: "Welche Funktion ist punktsymmetrisch zum Ursprung?",
    options: [`f(x) = x² · ${eh("−x²")}`, "f(x) = x · cos x", "f(x) = sin x + 1", `f(x) = ${eh("−x")}`],
    correct: 1,
    explain: "f(−x) = (−x) · cos(−x) = −x · cos x = −f(x): ungerade mal gerade ist ungerade. x² · e<sup>−x²</sup> ist achsensymmetrisch (gerade mal gerade), sin x + 1 ist um 1 nach oben verschoben und nur zum Punkt (0 | 1) symmetrisch, e<sup>−x</sup> hat keine der beiden Symmetrien.",
  },
  "quiz-nullstellen": {
    q: `Welche Nullstellen hat f(x) = (x² − 4x) · ${eh("0,5x")}?`,
    options: ["x = 0 und x = 4", "nur x = 4 — durch x darf man teilen", "x = 4 und x = −2", `keine, weil ${eh("0,5x")} nie null ist`],
    correct: 0,
    explain: "Satz vom Nullprodukt: e<sup>0,5x</sup> ist nie null, also bleibt x² − 4x = x(x − 4) = 0, das heißt x = 0 oder x = 4. Wer durch x teilt, verliert x = 0. Dass der e-Faktor nie null ist, heißt nicht, dass das Produkt nie null ist — der andere Faktor kann es sein.",
  },
  "quiz-monotonie": {
    q: `Die Ableitung einer Funktion f ist f′(x) = (x − 2) · ${eh("−x")}. Was gilt?`,
    options: ["f hat bei 2 einen Hochpunkt.", "f fällt überall, weil e<sup>−x</sup> fällt.", "f hat keinen Extrempunkt, weil e<sup>−x</sup> nie null ist.", "f hat bei 2 einen Tiefpunkt."],
    correct: 3,
    explain: "e<sup>−x</sup> &gt; 0, also hat f′ das Vorzeichen von x − 2: negativ für x &lt; 2, positiv für x &gt; 2. f fällt erst und steigt dann — Tiefpunkt bei 2. Dass e<sup>−x</sup> fällt, sagt nichts über f; es geht um das Vorzeichen von f′.",
  },
  "quiz-wachstum": {
    q: `Eine Population wächst nach N(t) = 200 · ${eh("0,05t")} (t in Jahren). Was bedeutet N′(10) ≈ 16,49?`,
    options: ["Im elften Jahr kommen genau 16,49 Tiere dazu.", "Nach 10 Jahren gibt es 16,49 Tiere.", "Zum Zeitpunkt t = 10 wächst die Population momentan mit etwa 16,49 Tieren pro Jahr.", "Die Population wächst jedes Jahr um 16,49 %."],
    correct: 2,
    explain: "N′(10) = 200 · 0,05 · e<sup>0,5</sup> ≈ 16,49 ist die momentane Änderungsrate — mit der Einheit Tiere pro Jahr. Im elften Jahr kommen tatsächlich N(11) − N(10) ≈ 16,91 Tiere dazu, weil die Rate weiter wächst. Der Bestand ist N(10) ≈ 329,7, und das relative Wachstum ist N′ : N = 5 % pro Jahr.",
  },
  "quiz-stolperstelle": {
    q: "Welche Ableitung hat f(x) = 3<sup>x</sup>?",
    options: ["f′(x) = x · 3<sup>x − 1</sup>", "f′(x) = ln 3 · 3<sup>x</sup>", "f′(x) = 3<sup>x</sup>", "f′(x) = 3 · 3<sup>x − 1</sup>"],
    correct: 1,
    explain: "3<sup>x</sup> = e<sup>x · ln 3</sup>, also nach Abschnitt 2 mit k = ln 3: (3<sup>x</sup>)′ = ln 3 · 3<sup>x</sup> ≈ 1,0986 · 3<sup>x</sup>. x · 3<sup>x − 1</sup> ist die Potenzregel — sie gilt für x<sup>3</sup>, nicht für 3<sup>x</sup>. Nur bei der Basis e entfällt der Faktor.",
  },
};

// ================= Selbsteinschätzung =================
//
// Die Auswahl liegt nur im Browser dieser Person — eine Lernhilfe, keine Leistungsmessung.
const SE_PUNKTE = [
  ["sec-e", "Ich kann erklären, warum (b^x)′ ein festes Vielfaches von b^x ist und was die Zahl e auszeichnet."],
  ["sec-ex", "Ich kann a · eᵏˣ ableiten und f′ = k · f deuten."],
  ["sec-ln", "Ich kann Gleichungen wie a · eᵏˣ = c mit dem natürlichen Logarithmus lösen und die Logarithmusregeln anwenden."],
  ["sec-produkt-e", "Ich kann Produkte wie x² · e⁻ˣ ableiten und den e-Faktor ausklammern."],
  ["sec-sinus", "Ich kann sin und cos ableiten und weiß, warum das nur im Bogenmaß gilt."],
  ["sec-kette", "Ich kann Verkettungen mit der Kettenregel ableiten — äußere mal innere Ableitung."],
  ["sec-quotient", "Ich kann Quotienten mit der Quotientenregel ableiten."],
  ["sec-lnfunktion", "Ich kann ln x und ln(u(x)) ableiten und den Definitionsbereich beachten."],
  ["sec-verhalten", "Ich kann das Verhalten von p(x) · eᵏˣ für x → ±∞ angeben und begründen."],
  ["sec-symmetrie", "Ich kann Symmetrie mit f(−x) nachweisen und die Periode von sin(bx) angeben."],
  ["sec-nullstellen", "Ich kann Nullstellen mit dem Satz vom Nullprodukt, mit ln und bei sin x = c bestimmen."],
  ["sec-monotonie", "Ich kann Monotonie und Extrempunkte von e- und Winkelfunktionen bestimmen."],
  ["sec-wachstum", "Ich kann Änderungsraten bei Wachstum, Abkühlung und Schwingung mit Einheit berechnen und deuten."],
  ["sec-stolperstelle", "Ich verwechsle die Potenzregel nicht mit der Ableitung von Exponentialfunktionen."],
];
const SE_SCHLUESSEL = "uplant-mss11-weitere-funktionen-ableiten-selbsteinschaetzung";

function leseSE() {
  try { return JSON.parse(localStorage.getItem(SE_SCHLUESSEL) || "{}"); } catch { return {}; }
}
function schreibeSE(d) {
  try { localStorage.setItem(SE_SCHLUESSEL, JSON.stringify(d)); } catch { /* ohne Speicher geht es auch */ }
}
function renderSelbsteinschaetzung() {
  const liste = document.getElementById("se-liste");
  const stand = leseSE();
  liste.innerHTML = "";
  SE_PUNKTE.forEach(([id, text]) => {
    const knoepfe = el("div", { class: "se-knoepfe", role: "group", "aria-label": text });
    [["sicher", "😀", "sicher"], ["teils", "😐", "teilweise"], ["unsicher", "🤔", "noch unsicher"]].forEach(([wert, z, name]) => {
      const b = el("button", { type: "button", "aria-pressed": String(stand[id] === wert), title: name, "aria-label": name }, z);
      b.addEventListener("click", () => { const d = leseSE(); d[id] = wert; schreibeSE(d); renderSelbsteinschaetzung(); });
      knoepfe.appendChild(b);
    });
    liste.appendChild(el("div", { class: "se-zeile" }, [el("span", { class: "se-text" }, text), knoepfe]));
  });
  const unsicher = SE_PUNKTE.filter(([id]) => stand[id] === "unsicher");
  const sicher = SE_PUNKTE.filter(([id]) => stand[id] === "sicher").length;
  const aus = document.getElementById("se-auswertung");
  // Die Überschriften tragen die Kursmarke — im Verweis stünde sie sonst als „… GK + LK“ mit.
  const titel = (id) => { const h = document.querySelector(`#${id} h2`).cloneNode(true); h.querySelectorAll(".kurs-marke").forEach((m) => m.remove()); return h.textContent.trim(); };
  if (!Object.keys(stand).length) aus.textContent = "Noch nichts angekreuzt.";
  else if (unsicher.length) aus.innerHTML = `Wiederhole zuerst: ${unsicher.map(([id]) => `<a href="#${id}">${titel(id)}</a>`).join(", ")}. Danach passen die Übungsaufgaben auf den Stufen „einfach“ und „mittel“.`;
  else aus.textContent = `${sicher} von ${SE_PUNKTE.length} Punkten sicher — probier dich an den Aufgaben auf den Stufen „schwierig“ und „komplex“.`;
}

// ================= Start =================

// Wählt man eine andere Funktion, bekommt der Regler den Bereich dieser Funktion — vor dem Zeichnen,
// sonst stünde er kurz auf einer Stelle, an der f gar nicht definiert ist.
const BEREICHE = { "pe-art": peBereich, "qu-art": quBereich, "ns-art": nsBereich, "mo-art": moBereich };
const REGLER = [
  [["eb-b", "eb-x"], renderBasis],
  [["ek-k", "ek-x"], renderEkx],
  [["lg-art", "lg-c", "lg-k"], renderLog],
  [["pe-art", "pe-x"], renderProduktE],
  [["si-x", "si-h"], renderSinus],
  [["ke-art", "ke-x", "ke-h"], renderKette],
  [["qu-art", "qu-x"], renderQuotient],
  [["lf-a"], renderLnFunktion],
  [["vh-art", "vh-w"], renderVerhalten],
  [["sy-art", "sy-modus", "sy-t"], renderSymmetrie],
  [["ns-art", "ns-c"], renderNullstellen],
  [["mo-art", "mo-x"], renderMonotonie],
  [["wa-art", "wa-t"], renderWachstum],
  [["sp-x"], renderStolperstelle],
];
for (const bereich of Object.values(BEREICHE)) bereich();
for (const [ids, render] of REGLER) {
  ids.forEach((id) => {
    const e = document.getElementById(id);
    const handler = BEREICHE[id] ? () => { BEREICHE[id](); render(); } : render;
    if (e.tagName === "SELECT" || e.type === "checkbox") {
      e.addEventListener("change", handler);
    } else e.addEventListener("input", handler);
  });
  render();   // nicht vergessen — sonst bleibt die Zeichnung leer, bis jemand einen Regler anfasst
}
for (const [id, def] of Object.entries(QUIZZE)) mountQuiz(document.getElementById(id), def);
renderSelbsteinschaetzung();
mountUebungsaufgaben(document.getElementById("exercises-mount"), AUFGABEN, { parse: parseZahl });
