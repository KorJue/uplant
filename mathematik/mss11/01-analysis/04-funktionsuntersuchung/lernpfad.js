// Selbstlernpfad „Funktionsuntersuchung“ (MSS 11, Analysis, Thema 3). Vanilla-JS, kein Build.
//
// Didaktische Reihenfolge — jede Stufe benutzt nur, was davor steht (Thema 2 liefert Ableitungsregeln,
// Monotoniesatz, notwendige Bedingung und Vorzeichenwechsel-Kriterium für Extremstellen):
//    1. Höhere Ableitungen              (f″ = (f′)′; Deutung als Steigung des Graphen von f′)
//    2. Krümmung                        (Linkskurve ⟺ f′ steigt; Kriterium = Monotoniesatz für f′)
//    3. Extremstellen mit f″            (f″ < 0 heißt: f′ fällt durch die Null — VZW + → −; braucht 2)
//    4. Wendepunkte, Sattelpunkte       (Wendestelle = Extremstelle von f′; Kriterien aus 3, eine
//                                         Ableitung höher)
//    5. Vollständige Untersuchung       (fasst 1–4 mit Symmetrie, Nullstellen aus Thema 2 zusammen)
//    6. Funktion mit Sinus              (Ablauf aus 5, Ableitungen von sin/cos aus Thema 2)
//    7. Globale Extrema, Randextrema    (Kandidaten aus 3 und die Ränder)
//    8. Vom Graphen von f′ auf f        (Umkehrung von 1–4: Lesen statt Rechnen)
//    9. Funktionenscharen, Ortskurven   (Ablauf aus 3–4 mit Parameter)
//   10. Steckbriefaufgaben              (Bedingungen aus 3–4 als Gleichungen, LGS aus der Mittelstufe)
//   11. Extremwertprobleme              (Zielfunktion; Extrema aus 3, Ränder aus 7)
//   12. Newton-Verfahren                (Tangente aus Thema 2; Vergleich mit der Intervallhalbierung
//                                         aus Thema 1.2)
//   13. Stolperstelle f″ = 0            (Bedingungen aus 4; doppelte Nullstelle aus Thema 2)
//
// Gerechnet wird mit Reglerwerten, nie mit Bildschirmkoordinaten. Die besonderen Punkte stehen als
// exakte Formeln im Code (−a, 2a³, 2π/3 …), nicht als Ergebnis einer Suche — die Prüfung sucht sie
// unabhängig numerisch und vergleicht.
//
// Farbcodierung: f blau, f′ grün, f″ violett; Linkskurve violett, Rechtskurve orange; Extrempunkte
// blau, Wendepunkte violett, Randpunkte und Warnungen rot, Hilfslinien grau.

import { mountUebungsaufgaben } from "../../../aufgaben.js?v=3";
import { AUFGABEN, parseZahl } from "./aufgaben-funktionsuntersuchung.js?v=3";


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
// „rund “ vor einer Zahl, die die Anzeige nicht genau trifft — für Sätze wie „höchstens rund 0,04“.
function rund(x, stellen = 4) {
  return zeichen(x, stellen) === "≈" ? "rund " : "";
}
// Winkel immer mit zwei Nachkommastellen: 49,40° statt 49,4°.
function numFest(x, stellen = 2) {
  const f = Math.pow(10, stellen);
  const g = Math.round(x * f) / f;
  return new Intl.NumberFormat("de-DE", { minimumFractionDigits: stellen, maximumFractionDigits: stellen }).format(g === 0 ? 0 : g).replace("-", "−");
}
// Ein Summand mit Rechenzeichen davor — das Vorzeichen steckt nur hier.
function plusMinus(x, stellen = 4) {
  return (x < 0 ? "− " : "+ ") + num(Math.abs(x), stellen);
}
function bruch(z, n) {
  return `<span class="bruch"><span class="z">${z}</span><span class="n">${n}</span></span>`;
}
// Eine Gerade m · x + b als Text, ohne „1x“, „+ −“ und „+ 0“.
function geradeText(m, b, v = "x", stellen = 4) {
  const mt = Math.abs(m) === 1 ? (m < 0 ? "−" : "") + v : `${num(m, stellen)}${v}`;
  if (Math.abs(m) < 1e-12) return num(b, stellen);
  if (Math.abs(b) < 1e-12) return mt;
  return `${mt} ${plusMinus(b, stellen)}`;
}
// Der Linearfaktor (x − r) mit richtigem Vorzeichen; für r = 0 steht nur x da.
function linearfaktor(r) {
  if (Math.abs(r) < 1e-12) return "x";
  return `(x ${plusMinus(-r)})`;
}
const HOCH = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" };
const hoch = (n) => String(n).split("").map((c) => HOCH[c] || c).join("");
const VIELFACH = ["", "einfach", "doppelt", "dreifach", "vierfach", "fünffach", "sechsfach", "siebenfach"];
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
// Regler lügen nicht: Ein begrenzter Wert wird in den Regler zurückgeschrieben.
function begrenzt(id, wert, min, max) {
  const w = Math.min(max, Math.max(min, wert));
  if (w !== wert) document.getElementById(id).value = String(w);
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
// Stellen für eine Achsenbeschriftung: so viele, wie der Gitterabstand braucht — beim
// Funktionenmikroskop liegen die Linien 0,0005 auseinander.
function stellenFuer(d) {
  return d >= 1 ? 0 : Math.max(0, Math.ceil(-Math.log10(d) - 1e-9));
}
// Für einen unverzerrten Ausschnitt: y-Bereich passend zur Breite, damit Steigungen und rechte
// Winkel im Bild stimmen.
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
  // So viele Gitterlinien, wie Platz für ihre Zahlen ist — ein schmales Bild bekommt weniger.
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
      // Klassenwechsel: am alten Punkt beginnen, damit keine Lücke entsteht.
      zeichne();
      pfad = `M ${K.X(vorher[0]).toFixed(2)} ${K.Y(vorher[1]).toFixed(2)}`;
    }
    klasse = k;
    pfad += `${pfad ? " L" : "M"} ${K.X(x).toFixed(2)} ${K.Y(y).toFixed(2)}`;
    vorher = [x, y];
  }
  zeichne();
}
// Punkte liegen in der beschnittenen Ebene: Ein Punkt außerhalb des Wertebereichs wird nicht über
// die Achsenbeschriftung gemalt.
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
function vieleck(K, punkte, klasse, attrs = {}) {
  K.ebene.appendChild(svgEl("polygon", Object.assign({ points: punkte.map(([x, y]) => `${K.X(x).toFixed(2)},${K.Y(y).toFixed(2)}`).join(" "), class: klasse }, attrs)));
}
function rechteck(K, x1, y1, x2, y2, klasse, attrs = {}) {
  K.ebene.appendChild(svgEl("rect", Object.assign({
    x: K.X(Math.min(x1, x2)).toFixed(2), y: K.Y(Math.max(y1, y2)).toFixed(2),
    width: Math.abs(K.X(x2) - K.X(x1)).toFixed(2), height: Math.abs(K.Y(y2) - K.Y(y1)).toFixed(2), class: klasse,
  }, attrs)));
}
// Beschriftung in Datenkoordinaten mit Versatz in Bildpunkten. Sie wird in die Zeichenfläche
// zurückgeschoben, statt am Rand abgeschnitten zu werden (mass() richtet mittig aus — ein Text am
// linken Rand ragte sonst halb aus dem Bild).
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

// ---------- Zusätzliche Helfer für Thema 3 ----------

// Krümmung als Klasse für die Graphteile: f″ ≥ 0 links, sonst rechts. An einer einzelnen Stelle mit
// f″ = 0 entscheidet das nichts Sichtbares; die Prüfung liest die Teile nur abseits der Nullstellen.
const kruemmung = (d2) => (x) => (d2(x) >= 0 ? "links" : "rechts");
const art2 = (w) => (w > 1e-12 ? "Linkskurve" : w < -1e-12 ? "Rechtskurve" : "keine Krümmung");
// Eine Zahl mit „=“ oder „≈“ davor — für Stellen wie √3, die die Anzeige nicht genau trifft.
const gleich = (x, stellen = 4) => `${zeichen(x, stellen)} ${num(x, stellen)}`;
// Ein Punkt als Text: (x | y), beide Koordinaten auf die Stellenzahl gerundet.
const pkt = (x, y, stellen = 4) => `(${num(x, stellen)} | ${num(y, stellen)})`;

// Ein Lenkpfeil am Punkt (x₀ | y₀): Er läuft ein Stück in Richtung der Tangente und biegt dann nach
// links (Linkskurve) oder rechts (Rechtskurve) ab — wie der Lenker eines Fahrrads auf dem Graphen.
// Gerechnet in Bildpunkten, weil die Richtung im Bild stimmen soll, nicht in den Achsen.
function lenkpfeil(K, x0, y0, m, art) {
  const px = K.X(x0), py = K.Y(y0);
  const sx = K.X(1) - K.X(0), sy = K.Y(0) - K.Y(1);
  let ux = 1, uy = -m * sy / sx;
  const l = Math.hypot(ux, uy);
  ux /= l; uy /= l;
  // Links von der Fahrtrichtung liegt im Bild (y nach unten) der Vektor (uy, −ux).
  const s = art === "links" ? 1 : -1;
  const nx = uy * s, ny = -ux * s;
  // Der Pfeil liegt 18 Bildpunkte auf der anderen Seite der Tangente als der Graph — der krümmt
  // sich zur Lenkrichtung hin, sonst lägen Pfeil und Graph aufeinander.
  const ox = px - 18 * nx, oy = py - 18 * ny;
  const a = [ox + 4 * ux, oy + 4 * uy], c = [ox + 30 * ux, oy + 30 * uy], e = [ox + 42 * ux + 14 * nx, oy + 42 * uy + 14 * ny];
  const pfad = `M ${a[0].toFixed(2)} ${a[1].toFixed(2)} Q ${c[0].toFixed(2)} ${c[1].toFixed(2)} ${e[0].toFixed(2)} ${e[1].toFixed(2)}`;
  K.svg.appendChild(svgEl("path", { d: pfad, class: `dr-pfeil-k ${art}`, "data-rolle": "lenkpfeil", "data-art": art }));
  // Pfeilspitze in Richtung des letzten Kurvenstücks.
  let dx = e[0] - c[0], dy = e[1] - c[1];
  const dl = Math.hypot(dx, dy);
  dx /= dl; dy /= dl;
  const sp = (w) => [e[0] - 8 * (dx * Math.cos(w) - dy * Math.sin(w)), e[1] - 8 * (dy * Math.cos(w) + dx * Math.sin(w))];
  const [p1, p2] = [sp(0.5), sp(-0.5)];
  K.svg.appendChild(svgEl("path", { d: `M ${p1[0].toFixed(2)} ${p1[1].toFixed(2)} L ${e[0].toFixed(2)} ${e[1].toFixed(2)} L ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`, class: `dr-pfeil-k ${art}` }));
}

// Die Funktionen dieser Seite mit allen Ableitungen — Tangenten, Krümmung und Bilanzen kommen aus
// derselben Quelle.
const FN = {
  kubik: { f: (x) => 0.5 * x ** 3 - 1.5 * x, d: (x) => 1.5 * x * x - 1.5, d2: (x) => 3 * x, d3: () => 3 },
  quartik: { f: (x) => 0.125 * x ** 4 - 0.75 * x * x, d: (x) => 0.5 * x ** 3 - 1.5 * x, d2: (x) => 1.5 * x * x - 1.5, d3: (x) => 3 * x },
  fall: { f: (t) => 5 * t * t, d: (t) => 10 * t, d2: () => 10, d3: () => 0 },
  sinus: { f: Math.sin, d: Math.cos, d2: (x) => -Math.sin(x), d3: (x) => -Math.cos(x) },
};

// ================= 1. Höhere Ableitungen =================

const HO = {
  kubik: { fn: FN.kubik, xs: [-2, 2], f: [-2.5, 2.5], a: [-2, 5], a2: [-6.5, 6.5], namen: ["f", "f′", "f″", "f‴"], v: "x",
    terme: ["0,5x³ − 1,5x", "1,5x² − 1,5", "3x", "3"] },
  quartik: { fn: FN.quartik, xs: [-2.5, 2.5], f: [-1.5, 1.25], a: [-4.5, 4.5], a2: [-2, 8.5], namen: ["f", "f′", "f″", "f‴"], v: "x",
    terme: ["0,125x⁴ − 0,75x²", "0,5x³ − 1,5x", "1,5x² − 1,5", "3x"] },
  fall: { fn: FN.fall, xs: [0, 4], f: [0, 85], a: [0, 45], a2: [0, 12], namen: ["s", "v = s′", "a = s″", "s‴"], v: "t",
    terme: ["5t²", "10t", "10", "0"], einheiten: [" m", " m/s", " m/s²", ""] },
};
function hoBereich() {
  const d = HO[wahl("ho-art")];
  setzeBereich("ho-x", d.xs[0], d.xs[1], 1);
}
function renderHoehere() {
  const art = wahl("ho-art"), d = HO[art];
  const x0 = reglerRaster("ho-x");
  const { f, d: f1, d2, d3 } = d.fn;
  const e = d.einheiten || ["", "", "", ""];
  setzeAnzeige("ho-x-anzeige", num(x0) + (art === "fall" ? " s" : ""));
  const xmin = d.xs[0] - (art === "fall" ? 0 : 0.2), xmax = d.xs[1] + 0.2;
  const xName = art === "fall" ? "t" : "x";
  const K1 = koordinatenXY({ hoehe: 220, xmin, xmax, ymin: d.f[0], ymax: d.f[1], xName, yName: d.namen[0], panel: "f" });
  panelTitel(K1, `Graph von ${d.namen[0]}`);
  graph(K1, f, xmin, xmax, { schritte: 500 });
  gerade(K1, f1(x0), x0, f(x0), "dr-tangente", { "data-rolle": "tangente-f" });
  punkt(K1, x0, f(x0), "fr-punkt", { "data-rolle": "p" });
  const K2 = koordinatenXY({ hoehe: 190, xmin, xmax, ymin: d.a[0], ymax: d.a[1], xName, yName: d.namen[1].split(" ")[0], panel: "a" });
  panelTitel(K2, `Graph von ${d.namen[1]}`);
  graph(K2, f1, xmin, xmax, { schritte: 500, basis: "dr-ableitung", rolle: "ableitung" });
  gerade(K2, d2(x0), x0, f1(x0), "dr-tangente2", { "data-rolle": "tangente-a" });
  punkt(K2, x0, f1(x0), "dr-punkt-t", { "data-rolle": "p-a" });
  const K3 = koordinatenXY({ hoehe: 190, xmin, xmax, ymin: d.a2[0], ymax: d.a2[1], xName, yName: d.namen[2].split(" ")[0], panel: "a2" });
  panelTitel(K3, `Graph von ${d.namen[2]}`);
  graph(K3, d2, xmin, xmax, { schritte: 500, basis: "dr-ableitung2", rolle: "ableitung2" });
  punkt(K3, x0, d2(x0), "dr-wende", { "data-rolle": "p-a2" });
  zeige("ho-mount", K1.svg, K2.svg, K3.svg);
  const v = d.v;
  setzeHtml("ho-bilanz",
    `${d.namen[0]}(${v}) = ${d.terme[0]}, &nbsp;${d.namen[1].split(" = ").pop()}(${v}) = ${d.terme[1]}, &nbsp;${d.namen[2].split(" = ").pop()}(${v}) = ${d.terme[2]}, &nbsp;${d.namen[3]}(${v}) = ${d.terme[3]}<br>` +
    `An der Stelle ${v}₀ = ${num(x0)}: ${d.namen[0]}(${v}₀) = ${num(f(x0))}${e[0]}; ` +
    `Steigung der grünen Tangente = ${d.namen[1].split(" = ").pop()}(${v}₀) = <span class="wa">${num(f1(x0))}${e[1]}</span>; ` +
    `Steigung der violetten Tangente an den Graphen von ${d.namen[1].split(" = ").pop()} = ${d.namen[2].split(" = ").pop()}(${v}₀) = <span class="wr">${num(d2(x0))}${e[2]}</span>; ` +
    `${d.namen[3]}(${v}₀) = ${num(d3(x0))}.`);
  let text;
  if (art === "fall") text = `Die Geschwindigkeit wächst in jeder Sekunde um 10 m/s — deshalb ist der Graph von v eine Gerade mit der Steigung 10, und a = s″ ist überall 10.`;
  else if (Math.abs(d2(x0)) < 1e-12) text = `Hier ist ${d.namen[2]}(${v}₀) = 0: Die violette Tangente ist waagerecht — f′ hat an dieser Stelle einen Extremwert, die Steigung von f ist hier am größten oder am kleinsten.`;
  else text = d2(x0) > 0
    ? `${d.namen[2]}(${v}₀) > 0: f′ steigt hier — wenn du x₀ ein wenig nach rechts schiebst, wird die grüne Tangente steiler.`
    : `${d.namen[2]}(${v}₀) < 0: f′ fällt hier — wenn du x₀ ein wenig nach rechts schiebst, wird die grüne Tangente flacher.`;
  setzeText("ho-text", text);
}

// ================= 2. Krümmung =================

const KR = {
  kubik: { fn: FN.kubik, xs: [-2.5, 2.5], y: [-3.5, 3.5], a: [-2, 8], terme: ["f′(x) = 1,5x² − 1,5", "f″(x) = 3x"], wende: [0] },
  quartik: { fn: FN.quartik, xs: [-2.5, 2.5], y: [-1.5, 1.5], a: [-4.5, 4.5], terme: ["f′(x) = 0,5x³ − 1,5x", "f″(x) = 1,5x² − 1,5"], wende: [-1, 1] },
  sinus: { fn: FN.sinus, xs: [-3, 6.25], y: [-1.6, 1.6], a: [-1.4, 1.4], terme: ["f′(x) = cos(x)", "f″(x) = −sin(x)"], wende: [0, Math.PI, 2 * Math.PI] },
};
function krBereich() {
  const d = KR[wahl("kr-art")];
  setzeBereich("kr-x", d.xs[0], d.xs[1], 1);
}
function renderKruemmung() {
  const d = KR[wahl("kr-art")];
  const x0 = reglerRaster("kr-x");
  setzeAnzeige("kr-x-anzeige", num(x0));
  const { f, d: f1, d2 } = d.fn;
  const xmin = d.xs[0] - 0.2, xmax = d.xs[1] + 0.2;
  const K1 = koordinatenXY({ hoehe: 280, xmin, xmax, ymin: d.y[0], ymax: d.y[1], panel: "f" });
  panelTitel(K1, "Graph von f: violett Linkskurve, orange Rechtskurve");
  graph(K1, f, xmin, xmax, { schritte: 600, klasseVon: kruemmung(d2) });
  const m = f1(x0), w = d2(x0);
  gerade(K1, m, x0, f(x0), "dr-tangente", { "data-rolle": "tangente" });
  punkt(K1, x0, f(x0), "fr-punkt", { "data-rolle": "p" });
  if (Math.abs(w) > 1e-12) lenkpfeil(K1, x0, f(x0), m, w > 0 ? "links" : "rechts");
  const K2 = koordinatenXY({ hoehe: 200, xmin, xmax, ymin: d.a[0], ymax: d.a[1], panel: "a" });
  panelTitel(K2, "Graph von f′");
  graph(K2, f1, xmin, xmax, { schritte: 500, basis: "dr-ableitung", rolle: "ableitung" });
  gerade(K2, w, x0, m, "dr-tangente2", { "data-rolle": "tangente-a" });
  punkt(K2, x0, m, "dr-punkt-t", { "data-rolle": "p-a" });
  zeige("kr-mount", K1.svg, K2.svg);
  // Wo liegt der Graph neben x₀ — über oder unter der Tangente? Abstand f − t bei x₀ ± 0,5.
  const t = (x) => m * (x - x0) + f(x0);
  const dl = f(x0 - 0.5) - t(x0 - 0.5), dr = f(x0 + 0.5) - t(x0 + 0.5);
  const seite = (z) => (z > 1e-12 ? "oberhalb" : z < -1e-12 ? "unterhalb" : "auf");
  setzeHtml("kr-bilanz",
    `${d.terme[0]}, &nbsp;${d.terme[1]}<br>` +
    `x₀ = ${num(x0)}: f′(x₀) = ${num(m)}, f″(x₀) = <span class="${w > 0 ? "wr" : w < 0 ? "wo" : ""}">${num(w)}</span> — ${w > 1e-12 ? "f′ steigt, <strong>Linkskurve</strong>" : w < -1e-12 ? "f′ fällt, <strong>Rechtskurve</strong>" : "f″ ist hier 0"}.<br>` +
    `Abstand Graph − Tangente bei x₀ − 0,5: ${num(dl)} (${seite(dl)}), bei x₀ + 0,5: ${num(dr)} (${seite(dr)}).`);
  const naheWende = d.wende.some((xw) => Math.abs(xw - x0) < 1e-9);
  setzeText("kr-text", naheWende
    ? "Hier ist f″(x₀) = 0 und das Krümmungsverhalten wechselt: Links und rechts liegt der Graph auf verschiedenen Seiten der Tangente. Das ist ein Wendepunkt (Abschnitt 4)."
    : w > 0
      ? "Linkskurve: Der Lenker zeigt nach links, die Tangente dreht sich beim Weiterfahren gegen den Uhrzeigersinn, und der Graph liegt in der Nähe oberhalb der Tangente."
      : "Rechtskurve: Der Lenker zeigt nach rechts, die Tangente dreht sich beim Weiterfahren im Uhrzeigersinn, und der Graph liegt in der Nähe unterhalb der Tangente.");
}

// ================= 3. Extremstellen mit f″ =================

function renderExtrem2() {
  const a = reglerRaster("ex-a");
  setzeAnzeige("ex-a-anzeige", num(a));
  const f = (x) => 0.25 * x ** 4 + 0.5 * a * x * x, f1 = (x) => x ** 3 + a * x, f2 = (x) => 3 * x * x + a;
  const K1 = koordinatenXY({ hoehe: 250, xmin: -2.2, xmax: 2.2, ymin: -1.25, ymax: 2.5, panel: "f" });
  panelTitel(K1, `f(x) = 0,25x⁴ ${a === 0 ? "" : plusMinus(0.5 * a) + "x²"}`.trim());
  graph(K1, f, -2.2, 2.2, { schritte: 500 });
  // Die Extrempunkte: x = 0 immer; für a < 0 zusätzlich ±√(−a). Typ aus f″ — bei a = 0 aus dem
  // Vorzeichenwechsel von f′(x) = x³ (− → +).
  const pkte = [[0, a < 0 ? "H" : "T"]];
  if (a < 0) pkte.push([-Math.sqrt(-a), "T"], [Math.sqrt(-a), "T"]);
  for (const [xe, typ] of pkte) {
    punkt(K1, xe, f(xe), "dr-extrem", { "data-rolle": "extrem", "data-typ": typ, r: 5 });
    beschrift(K1, xe, f(xe), typ, "dr-text-b", { dy: typ === "H" ? -10 : 20 });
  }
  gerade(K1, 0, 0, 0, "dr-tangente", { "data-rolle": "tangente" });
  const K2 = koordinatenXY({ hoehe: 200, xmin: -2.2, xmax: 2.2, ymin: -3, ymax: 3, panel: "a" });
  panelTitel(K2, `Graph von f′: f′(x) = x³ ${a === 0 ? "" : plusMinus(a) + "x"}`.trim());
  graph(K2, f1, -2.2, 2.2, { schritte: 500, basis: "dr-ableitung", rolle: "ableitung", klasseVon: (x, y) => (y > 0 ? "positiv" : "negativ") });
  gerade(K2, f2(0), 0, 0, "dr-tangente2", { "data-rolle": "tangente-a" });
  punkt(K2, 0, 0, "dr-punkt-t", { "data-rolle": "p-a" });
  zeige("ex-mount", K1.svg, K2.svg);
  let urteil;
  if (a < 0) urteil = `f″(0) = ${num(a)} &lt; 0 ⇒ <span class="wc">Hochpunkt H(0 | 0)</span>. Die violette Tangente an f′ fällt: f′ geht von + nach −.`;
  else if (a > 0) urteil = `f″(0) = ${num(a)} &gt; 0 ⇒ <span class="wc">Tiefpunkt T(0 | 0)</span>. Die violette Tangente an f′ steigt: f′ geht von − nach +.`;
  else urteil = `f″(0) = 0 ⇒ <strong>keine Entscheidung</strong> mit f″. Vorzeichenwechsel von f′(x) = x³: links negativ, rechts positiv ⇒ <span class="wc">Tiefpunkt T(0 | 0)</span>.`;
  let weitere = "";
  if (a < 0) {
    const r = Math.sqrt(-a);
    weitere = `<br>Weitere Nullstellen von f′(x) = x(x² ${plusMinus(a)}): x = ±√${num(-a)}, also x ${zeichen(r)} ±${num(r)}; f″(±√${num(-a)}) = 3 · ${num(-a)} ${plusMinus(a)} = ${num(-2 * a)} &gt; 0 ⇒ Tiefpunkte T₁,₂(±${num(r)} | ${num(-0.25 * a * a)}).`;
  }
  setzeHtml("ex-bilanz", `f′(0) = 0 für jedes a — waagerechte Tangente. f″(x) = 3x² ${a === 0 ? "" : plusMinus(a)}, also f″(0) = a.<br>${urteil}${weitere}`);
  setzeText("ex-text", a === 0
    ? "Genau hier versagt das Kriterium: f″(0) = 0, und trotzdem ist bei 0 ein Tiefpunkt. Der Graph ist an dieser Stelle nur besonders flach."
    : a < 0
      ? "Für negatives a ist der Graph bei 0 eine Rechtskurve — ein kleiner Hügel zwischen zwei Tälern. Je näher a an 0 rückt, desto enger rücken die Täler an den Hügel heran."
      : "Für positives a ist der Graph bei 0 eine Linkskurve — ein einziges Tal. Schiebe a auf 0: Das Tal wird flacher, bleibt aber ein Tal.");
}

// ================= 4. Wendepunkte =================

function renderWende() {
  const b = reglerRaster("wp-b"), x0 = reglerRaster("wp-x");
  setzeAnzeige("wp-b-anzeige", num(b));
  setzeAnzeige("wp-x-anzeige", num(x0));
  const f = (x) => 0.25 * x ** 3 - 0.75 * x * x + b * x + 1;
  const f1 = (x) => 0.75 * x * x - 1.5 * x + b, f2 = (x) => 1.5 * x - 1.5;
  // Wendestelle aus f″(x) = 1,5x − 1,5 = 0; f‴ = 1,5 ≠ 0.
  const xw = 1, yw = 0.5 + b, mw = b - 0.75;
  const sattel = Math.abs(mw) < 1e-12;
  const K1 = koordinatenXY({ hoehe: 290, xmin: -1.2, xmax: 3.2, ymin: -4, ymax: 8.5, panel: "f" });
  panelTitel(K1, "Graph von f: violett Linkskurve, orange Rechtskurve");
  graph(K1, f, -1.2, 3.2, { schritte: 500, klasseVon: kruemmung(f2) });
  gerade(K1, mw, xw, yw, "dr-wendetangente", { "data-rolle": "wendetangente" });
  gerade(K1, f1(x0), x0, f(x0), "dr-tangente", { "data-rolle": "tangente" });
  punkt(K1, x0, f(x0), "fr-punkt", { "data-rolle": "p" });
  punkt(K1, xw, yw, "dr-wende", { "data-rolle": "wende", "data-typ": sattel ? "S" : "W", r: 6 });
  beschrift(K1, xw, yw, sattel ? "S" : "W", "dr-text-v", { dx: 12, dy: -10 });
  const K2 = koordinatenXY({ hoehe: 200, xmin: -1.2, xmax: 3.2, ymin: -2, ymax: 5, panel: "a" });
  panelTitel(K2, "Graph von f′ — sein Tiefpunkt liegt bei der Wendestelle");
  graph(K2, f1, -1.2, 3.2, { schritte: 400, basis: "dr-ableitung", rolle: "ableitung" });
  punkt(K2, xw, mw, "dr-wende", { "data-rolle": "min-ableitung", r: 5 });
  punkt(K2, x0, f1(x0), "dr-punkt-t", { "data-rolle": "p-a" });
  zeige("wp-mount", K1.svg, K2.svg);
  const bt = yw - mw * xw;
  setzeHtml("wp-bilanz",
    `f(x) = 0,25x³ − 0,75x² ${b === 0 ? "" : plusMinus(b) + "x "}+ 1, &nbsp;f′(x) = 0,75x² − 1,5x${b === 0 ? "" : " " + plusMinus(b)}, &nbsp;f″(x) = 1,5x − 1,5, &nbsp;f‴(x) = 1,5<br>` +
    `f″(x) = 0 ⟺ x = 1; f‴(1) = 1,5 ≠ 0 ⇒ <span class="wr">${sattel ? "Sattelpunkt S" : "Wendepunkt W"}(1 | ${num(yw)})</span>.<br>` +
    `Wendetangente: m = f′(1) = ${num(mw)}, t(x) = ${geradeText(mw, bt)}${sattel ? " — waagerecht, also ein Sattelpunkt" : ""}.`);
  let text;
  if (Math.abs(x0 - xw) < 1e-9) text = "Bei x₀ = 1 durchsetzt die Tangente den Graphen: links liegt er unterhalb (Rechtskurve), rechts oberhalb (Linkskurve). Unten hat f′ hier seinen Tiefpunkt — nirgends ist f flacher bzw. fällt f stärker.";
  else if (x0 < xw) text = "Links von 1 ist f″ < 0: Rechtskurve, der Graph liegt in der Nähe unterhalb der Tangente. f′ fällt hier noch.";
  else text = "Rechts von 1 ist f″ > 0: Linkskurve, der Graph liegt in der Nähe oberhalb der Tangente. f′ steigt hier wieder.";
  if (sattel) text += " Bei b = 0,75 ist die Wendetangente waagerecht: ein Sattelpunkt — f′ berührt die x-Achse nur, ohne das Vorzeichen zu wechseln.";
  setzeText("wp-text", text);
}

// ================= 5. Vollständige Funktionsuntersuchung =================

const W3 = Math.sqrt(3), W6 = Math.sqrt(6);
const SC = {
  kubik: {
    f: (x) => x ** 3 - 6 * x * x + 9 * x, xs: [-0.75, 4.5], y: [-3, 6],
    sym: "keine", unendlich: ["unten", "oben"], sy: 0,
    nullstellen: [[0, 1], [3, 2]], extrema: [[1, "H"], [3, "T"]], wende: [[2, "W"]],
    mono: [[-Infinity, 1, "steigt"], [1, 3, "faellt"], [3, Infinity, "steigt"]],
    kruemm: [[-Infinity, 2, "rechts"], [2, Infinity, "links"]],
    texte: [
      "D = ℝ. f(−x) = −x³ − 6x² − 9x ist weder f(x) noch −f(x): keine Symmetrie zur y-Achse oder zum Ursprung.",
      "Grad 3, Leitkoeffizient 1 &gt; 0: f(x) → −∞ für x → −∞ und f(x) → +∞ für x → +∞.",
      "f(0) = 0: S<sub>y</sub>(0 | 0).",
      "f(x) = x(x − 3)²: Nullstellen 0 (einfach) und 3 (doppelt — der Graph berührt die x-Achse).",
      "f′(x) = 3x² − 12x + 9 = 3(x − 1)(x − 3), f″(x) = 6x − 12. f″(1) = −6 &lt; 0: H(1 | 4); f″(3) = 6 &gt; 0: T(3 | 0).",
      "f″(x) = 0 ⟺ x = 2; f‴(x) = 6 ≠ 0: W(2 | 2).",
      "f steigt für x &lt; 1 und für x &gt; 3, fällt für 1 &lt; x &lt; 3. Rechtskurve für x &lt; 2, Linkskurve für x &gt; 2.",
      "Graph durch alle Punkte, Wertemenge W = ℝ. Der Graph ist punktsymmetrisch zu seinem Wendepunkt W(2 | 2).",
    ],
  },
  bi: {
    f: (x) => 0.25 * x ** 4 - 1.5 * x * x, xs: [-3, 3], y: [-4, 3.5],
    sym: "achse", unendlich: ["oben", "oben"], sy: 0,
    nullstellen: [[-W6, 1], [0, 2], [W6, 1]], extrema: [[-W3, "T"], [0, "H"], [W3, "T"]], wende: [[-1, "W"], [1, "W"]],
    mono: [[-Infinity, -W3, "faellt"], [-W3, 0, "steigt"], [0, W3, "faellt"], [W3, Infinity, "steigt"]],
    kruemm: [[-Infinity, -1, "links"], [-1, 1, "rechts"], [1, Infinity, "links"]],
    texte: [
      "D = ℝ. Nur gerade Exponenten: f(−x) = f(x) — der Graph ist achsensymmetrisch zur y-Achse.",
      "Grad 4, Leitkoeffizient 0,25 &gt; 0: f(x) → +∞ für x → −∞ und für x → +∞.",
      "f(0) = 0: S<sub>y</sub>(0 | 0).",
      "f(x) = 0,25x²(x² − 6): Nullstellen 0 (doppelt) und ±√6 ≈ ±2,449 (einfach).",
      "f′(x) = x³ − 3x = x(x² − 3), f″(x) = 3x² − 3. f″(0) = −3 &lt; 0: H(0 | 0); f″(±√3) = 6 &gt; 0: T₁,₂(±√3 | −2,25) mit √3 ≈ 1,732.",
      "f″(x) = 0 ⟺ x = ±1; f‴(x) = 6x, f‴(±1) = ±6 ≠ 0: W₁,₂(±1 | −1,25).",
      "f fällt für x &lt; −√3 und für 0 &lt; x &lt; √3, steigt für −√3 &lt; x &lt; 0 und für x &gt; √3. Linkskurve für x &lt; −1 und x &gt; 1, Rechtskurve für −1 &lt; x &lt; 1.",
      "Graph durch alle Punkte, Wertemenge W = [−2,25; ∞[. Die beiden Tiefpunkte sind zugleich globale Minima.",
    ],
  },
  sattel: {
    f: (x) => 0.25 * x ** 4 - x ** 3, xs: [-1.5, 4.5], y: [-10, 5],
    sym: "keine", unendlich: ["oben", "oben"], sy: 0,
    nullstellen: [[0, 3], [4, 1]], extrema: [[3, "T"]], wende: [[0, "S"], [2, "W"]],
    mono: [[-Infinity, 3, "faellt"], [3, Infinity, "steigt"]],
    kruemm: [[-Infinity, 0, "links"], [0, 2, "rechts"], [2, Infinity, "links"]],
    texte: [
      "D = ℝ. f(−x) = 0,25x⁴ + x³ ist weder f(x) noch −f(x): keine Symmetrie zur y-Achse oder zum Ursprung.",
      "Grad 4, Leitkoeffizient 0,25 &gt; 0: f(x) → +∞ für x → −∞ und für x → +∞.",
      "f(0) = 0: S<sub>y</sub>(0 | 0).",
      "f(x) = x³(0,25x − 1): Nullstellen 0 (dreifach — der Graph schneidet die x-Achse, schmiegt sich aber an) und 4 (einfach).",
      "f′(x) = x³ − 3x² = x²(x − 3), f″(x) = 3x² − 6x. f″(3) = 9 &gt; 0: T(3 | −6,75). Bei 0 ist f″(0) = 0 — keine Entscheidung; f′ wechselt dort das Vorzeichen nicht (x² ≥ 0, x − 3 &lt; 0): kein Extrempunkt.",
      "f″(x) = 3x(x − 2) = 0 ⟺ x = 0 oder x = 2; f‴(x) = 6x − 6 mit f‴(0) = −6 ≠ 0 und f‴(2) = 6 ≠ 0. Weil auch f′(0) = 0 ist: Sattelpunkt S(0 | 0); dazu W(2 | −4).",
      "f fällt für x &lt; 3 (auch durch den Sattelpunkt hindurch), steigt für x &gt; 3. Linkskurve für x &lt; 0 und x &gt; 2, Rechtskurve für 0 &lt; x &lt; 2.",
      "Graph durch alle Punkte, Wertemenge W = [−6,75; ∞[.",
    ],
  },
};
const SC_TITEL = ["Definitionsmenge und Symmetrie", "Verhalten für x → ±∞", "Schnittpunkt mit der y-Achse", "Nullstellen",
  "Extrempunkte", "Wendepunkte", "Monotonie und Krümmung", "Graph"];
// Ein Pfeil am Bildrand, der zeigt, wohin der Graph für x → ±∞ läuft.
function randPfeil(K, seite, richtung) {
  const px = seite === "links" ? K.links + 16 : K.breite - K.rechts - 16;
  const [y1, y2] = richtung === "oben" ? [K.oben + 56, K.oben + 14] : [K.hoehe - K.unten - 56, K.hoehe - K.unten - 14];
  const s = richtung === "oben" ? 1 : -1;
  K.svg.appendChild(svgEl("path", {
    d: `M ${px} ${y1} L ${px} ${y2} M ${px - 6} ${y2 + 8 * s} L ${px} ${y2} L ${px + 6} ${y2 + 8 * s}`,
    class: "fr-pfeil", "data-rolle": "pfeil", "data-seite": seite, "data-richtung": richtung,
  }));
}
function renderSchema() {
  const d = SC[wahl("sc-art")];
  const s = reglerRaster("sc-s");
  setzeAnzeige("sc-s-anzeige", `${s} von 8`);
  const [xmin, xmax] = d.xs;
  const K = koordinatenXY({ hoehe: 330, xmin, xmax, ymin: d.y[0], ymax: d.y[1] });
  if (s >= 1 && d.sym === "achse") strecke(K, 0, d.y[0], 0, d.y[1], "dr-verbinder", { "data-rolle": "symmetrie", "data-art": "achse" });
  if (s >= 2) { randPfeil(K, "links", d.unendlich[0]); randPfeil(K, "rechts", d.unendlich[1]); }
  if (s >= 7) {
    // Zwei Bänder am unteren Rand: oben Monotonie (grün steigt, orange fällt), darunter Krümmung
    // (violett links, orange rechts). Unendliche Grenzen enden am Bildrand.
    const yM = d.y[0] + 0.09 * (d.y[1] - d.y[0]), yK = d.y[0] + 0.04 * (d.y[1] - d.y[0]);
    const k = (x) => Math.min(xmax, Math.max(xmin, x));
    for (const [a, b, art] of d.mono) strecke(K, k(a), yM, k(b), yM, `dr-intervall ${art}`, { "data-rolle": "band-mono", "data-art": art, "data-von": String(a), "data-bis": String(b) });
    for (const [a, b, art] of d.kruemm) strecke(K, k(a), yK, k(b), yK, `dr-intervall ${art}`, { "data-rolle": "band-kruemm", "data-art": art, "data-von": String(a), "data-bis": String(b) });
  }
  if (s >= 8) graph(K, d.f, xmin, xmax, { schritte: 600 });
  if (s >= 3) punkt(K, 0, d.sy, "fr-punkt", { "data-rolle": "sy", r: 4 });
  if (s >= 4) for (const [x, v] of d.nullstellen) punkt(K, x, 0, "dr-schneidet", { "data-rolle": "nullstelle", "data-vielfach": String(v), r: 5 });
  if (s >= 5) for (const [x, typ] of d.extrema) {
    punkt(K, x, d.f(x), "dr-extrem", { "data-rolle": "extrem", "data-typ": typ, r: 6 });
    beschrift(K, x, d.f(x), typ, "dr-text-b", { dy: typ === "H" ? -10 : 20 });
  }
  if (s >= 6) for (const [x, typ] of d.wende) {
    punkt(K, x, d.f(x), "dr-wende", { "data-rolle": "wende", "data-typ": typ, r: 6 });
    beschrift(K, x, d.f(x), typ, "dr-text-v", { dx: 12, dy: typ === "S" ? -10 : 16 });
  }
  zeige("sc-mount", K.svg);
  const liste = document.getElementById("sc-liste");
  liste.innerHTML = "";
  SC_TITEL.forEach((titel, i) => {
    const li = el("li", { class: i + 1 > s ? "offen" : i + 1 === s ? "aktiv" : "", "data-schritt": String(i + 1) });
    li.innerHTML = i + 1 > s ? `${titel} …` : `<strong>${titel}:</strong> ${d.texte[i]}`;
    liste.appendChild(li);
  });
  const hinweise = [
    "Noch ist kein Punkt gezeichnet — die Symmetrie spart später Arbeit: Bei Achsensymmetrie genügt es, rechts von der y-Achse zu rechnen.",
    "Die Pfeile am Rand zeigen, wohin der Graph ganz links und ganz rechts läuft.",
    "Der erste Punkt: der Schnittpunkt mit der y-Achse.",
    "Die Nullstellen legen fest, wo der Graph die x-Achse trifft — bei gerader Vielfachheit berührt er sie nur.",
    "Hoch- und Tiefpunkte: Dort kehrt der Graph um.",
    "Wendepunkte: Dort wechselt die Krümmung. Ein Sattelpunkt ist ein Wendepunkt mit waagerechter Tangente.",
    "Die Bänder unten fassen zusammen: oben steigt (grün) und fällt (orange), darunter Linkskurve (violett) und Rechtskurve (orange).",
    "Erst jetzt wird der Graph gezeichnet — er muss durch alle Punkte gehen und zu den Pfeilen und Bändern passen.",
  ];
  setzeText("sc-text", hinweise[s - 1]);
}

// ================= 6. Funktion mit Sinus =================

const TR = { f: (x) => x + 2 * Math.sin(x), d: (x) => 1 + 2 * Math.cos(x), d2: (x) => -2 * Math.sin(x) };
// k · π/12 als gekürzter Bruch: „2π/3“, „π“, „0“.
function piText(k) {
  if (k === 0) return "0";
  const g = (a, b) => (b ? g(b, a % b) : a);
  const t = g(k, 12), z = k / t, n = 12 / t;
  const zt = z === 1 ? "π" : `${z}π`;
  return n === 1 ? zt : `${zt}/${n}`;
}
function renderTrig() {
  const k = reglerRaster("tr-k");
  const x0 = (k * Math.PI) / 12;
  setzeAnzeige("tr-k-anzeige", k === 0 ? "0" : `${piText(k)} ≈ ${num(x0, 3)}`);
  const xmin = -0.2, xmax = 2 * Math.PI + 0.2;
  const K1 = koordinatenXY({ hoehe: 280, xmin, xmax, ymin: -0.5, ymax: 7, panel: "f" });
  panelTitel(K1, "f(x) = x + 2 sin(x): violett Linkskurve, orange Rechtskurve");
  graph(K1, TR.f, xmin, xmax, { schritte: 600, klasseVon: kruemmung(TR.d2) });
  const xh = (2 * Math.PI) / 3, xt = (4 * Math.PI) / 3;
  punkt(K1, xh, TR.f(xh), "dr-extrem", { "data-rolle": "extrem", "data-typ": "H", r: 6 });
  beschrift(K1, xh, TR.f(xh), "H", "dr-text-b", { dy: -10 });
  punkt(K1, xt, TR.f(xt), "dr-extrem", { "data-rolle": "extrem", "data-typ": "T", r: 6 });
  beschrift(K1, xt, TR.f(xt), "T", "dr-text-b", { dy: 20 });
  punkt(K1, Math.PI, Math.PI, "dr-wende", { "data-rolle": "wende", "data-typ": "W", r: 6 });
  beschrift(K1, Math.PI, Math.PI, "W", "dr-text-v", { dx: 12, dy: -8 });
  gerade(K1, TR.d(x0), x0, TR.f(x0), "dr-tangente", { "data-rolle": "tangente" });
  punkt(K1, x0, TR.f(x0), "fr-punkt", { "data-rolle": "p" });
  const K2 = koordinatenXY({ hoehe: 190, xmin, xmax, ymin: -1.5, ymax: 3.5, panel: "a" });
  panelTitel(K2, "f′(x) = 1 + 2 cos(x)");
  graph(K2, TR.d, xmin, xmax, { schritte: 500, basis: "fr-linie", rolle: "ableitung", klasseVon: (x, y) => (y > 0 ? "positiv" : "negativ") });
  for (const xn of [xh, xt]) punkt(K2, xn, 0, "dr-schneidet", { "data-rolle": "nullstelle-ableitung", r: 4 });
  punkt(K2, x0, TR.d(x0), "dr-punkt-t", { "data-rolle": "p-a" });
  zeige("tr-mount", K1.svg, K2.svg);
  const m = TR.d(x0), w = TR.d2(x0);
  setzeHtml("tr-bilanz",
    `x₀ = ${piText(k)}${k ? ` ≈ ${num(x0, 4)}` : ""}: f(x₀) ${gleich(TR.f(x0))}, f′(x₀) = 1 + 2 cos(x₀) ${gleich(m)}, f″(x₀) = −2 sin(x₀) ${gleich(w)}<br>` +
    `${Math.abs(m) < 1e-9 ? "waagerechte Tangente" : m > 0 ? "f steigt" : "f fällt"}; ${Math.abs(w) < 1e-9 ? "f″(x₀) = 0" : art2(w)}.`);
  const besondere = { 0: "Linker Rand: f″(0) = 0, aber das Intervall beginnt hier — kein Wendepunkt im Inneren.", 8: "x₀ = 2π/3: f′ = 0 und f″ = −√3 < 0 — der Hochpunkt.", 12: "x₀ = π: f″ = 0 und f‴(π) = 2 ≠ 0 — der Wendepunkt mit der Wendetangente t(x) = −x + 2π. Hier fällt f am stärksten.", 16: "x₀ = 4π/3: f′ = 0 und f″ = √3 > 0 — der Tiefpunkt.", 24: "Rechter Rand x₀ = 2π: f(2π) = 2π. Ab hier wiederholt sich das Bild, um 2π nach rechts und oben verschoben." };
  setzeText("tr-text", besondere[k] || (m > 0
    ? "Hier steigt die Gerade x schneller, als die Schwingung 2 sin(x) fällt: f steigt."
    : "Hier fällt 2 sin(x) schneller, als x steigt: f fällt — zwischen Hoch- und Tiefpunkt."));
}

// ================= 7. Globale Extrema =================

function renderGlobal() {
  const f = FN.kubik.f;
  const a = reglerRaster("gl-a");
  // b liegt mindestens 0,5 rechts von a — sonst wäre [a; b] kein Intervall.
  const b = begrenzt("gl-b", reglerRaster("gl-b"), a + 0.5, 3);
  setzeAnzeige("gl-a-anzeige", num(a));
  setzeAnzeige("gl-b-anzeige", num(b));
  const K = koordinatenXY({ hoehe: 320, xmin: -3.2, xmax: 3.2, ymin: -9.5, ymax: 9.5 });
  graph(K, f, -3.2, 3.2, { schritte: 500, basis: "fr-linie duenn", rolle: "graph-ganz" });
  graph(K, f, a, b, { schritte: 400, rolle: "graph" });
  strecke(K, a, -9.5, a, 9.5, "dr-intervallrand", { "data-rolle": "rand-a" });
  strecke(K, b, -9.5, b, 9.5, "dr-intervallrand", { "data-rolle": "rand-b" });
  const kand = [[a, "rand"], [b, "rand"]];
  for (const xe of [-1, 1]) if (xe > a && xe < b) kand.push([xe, "innen"]);
  const werte = kand.map(([x]) => f(x));
  const max = Math.max(...werte), min = Math.min(...werte);
  for (const [x, art] of kand) {
    const y = f(x);
    const g = Math.abs(y - max) < 1e-9 ? "max" : Math.abs(y - min) < 1e-9 ? "min" : "";
    punkt(K, x, y, art === "rand" ? "dr-rand" : "dr-extrem", { "data-rolle": "kandidat", "data-art": art, "data-global": g, r: g ? 7 : 4 });
    if (g) beschrift(K, x, y, g === "max" ? "Max" : "Min", art === "rand" ? "dr-text-r" : "dr-text-b", { dy: g === "max" ? -12 : 22 });
  }
  zeige("gl-mount", K.svg);
  kand.sort((p, q) => p[0] - q[0]);
  const zeilen = kand.map(([x, art]) => `f(${num(x)}) = ${num(f(x))} <span class="progress-note">(${art === "rand" ? "Rand" : x < 0 ? "Hochpunkt" : "Tiefpunkt"})</span>`);
  const wo = (w) => kand.filter(([x]) => Math.abs(f(x) - w) < 1e-9).map(([x, art]) => `x = ${num(x)}${art === "rand" ? " (Rand)" : ""}`).join(" und ");
  setzeHtml("gl-bilanz",
    `Kandidaten auf [${num(a)}; ${num(b)}]: ${zeilen.join("; ")}<br>` +
    `<span class="wc">Globales Maximum ${num(max)}</span> bei ${wo(max)}; <span class="wc">globales Minimum ${num(min)}</span> bei ${wo(min)}.`);
  const randMax = kand.some(([x, art]) => art === "rand" && Math.abs(f(x) - max) < 1e-9);
  const randMin = kand.some(([x, art]) => art === "rand" && Math.abs(f(x) - min) < 1e-9);
  setzeText("gl-text", randMax && randMin
    ? "Beide globalen Extrema liegen am Rand — dort ist f′ nicht 0. Eine Suche nur über f′(x) = 0 hätte sie verfehlt."
    : randMax || randMin
      ? `Das globale ${randMax ? "Maximum" : "Minimum"} liegt am Rand, das andere an einer Stelle mit f′ = 0. Nur der Vergleich aller Kandidaten entscheidet.`
      : "Hier sind die lokalen Extrema auch global — die Ränder liegen dazwischen.");
}

// ================= 8. Vom Graphen von f′ auf f =================

const FS = {
  a: {
    d: (x) => 0.25 * x ** 3 - 0.75 * x + 0.5, d2: (x) => 0.75 * x * x - 0.75, f: (x) => 0.0625 * x ** 4 - 0.375 * x * x + 0.5 * x,
    a: [-4.5, 5], y: [-2, 3.5],
    // Nullstellen von f′ mit Art des Vorzeichenwechsels, Extremstellen von f′.
    nullstellen: [[-2, "-+", "T"], [1, "keiner", "S"]], extremA: [[-1, "W"], [1, "W"]],
  },
  b: {
    d: (x) => -0.5 * x * x + 2, d2: (x) => -x, f: (x) => -(x ** 3) / 6 + 2 * x,
    a: [-2.8, 2.8], y: [-3, 3],
    nullstellen: [[-2, "-+", "T"], [2, "+-", "H"]], extremA: [[0, "W"]],
  },
};
function renderFstrich() {
  const d = FS[wahl("fs-art")];
  const x0 = reglerRaster("fs-x");
  setzeAnzeige("fs-x-anzeige", num(x0));
  const zeigeF = document.getElementById("fs-zeige").checked;
  const K1 = koordinatenXY({ hoehe: 250, xmin: -3.2, xmax: 3.2, ymin: d.a[0], ymax: d.a[1], yName: "f′", panel: "a" });
  panelTitel(K1, "gegeben: Graph von f′");
  graph(K1, d.d, -3.2, 3.2, { schritte: 500, basis: "fr-linie", rolle: "ableitung", klasseVon: (x, y) => (y > 0 ? "positiv" : "negativ") });
  for (const [x, vzw, typ] of d.nullstellen) {
    punkt(K1, x, 0, "dr-schneidet", { "data-rolle": "nullstelle-ableitung", "data-vzw": vzw, "data-typ": typ, r: 5 });
    beschrift(K1, x, 0, typ, "dr-text-b", { dy: -10 });
  }
  for (const [x, typ] of d.extremA) {
    punkt(K1, x, d.d(x), "dr-wende", { "data-rolle": "extrem-ableitung", "data-typ": typ, r: 5 });
    beschrift(K1, x, d.d(x), typ, "dr-text-v", { dy: 20 });
  }
  gerade(K1, d.d2(x0), x0, d.d(x0), "dr-tangente2", { "data-rolle": "tangente-a" });
  punkt(K1, x0, d.d(x0), "dr-punkt-t", { "data-rolle": "p-a" });
  const knoten = [K1.svg];
  if (zeigeF) {
    const K2 = koordinatenXY({ hoehe: 220, xmin: -3.2, xmax: 3.2, ymin: d.y[0], ymax: d.y[1], panel: "f" });
    panelTitel(K2, "zur Kontrolle: ein passender Graph von f");
    graph(K2, d.f, -3.2, 3.2, { schritte: 500, klasseVon: kruemmung(d.d2) });
    for (const [x, , typ] of d.nullstellen) punkt(K2, x, d.f(x), typ === "S" ? "dr-wende" : "dr-extrem", { "data-rolle": "punkt-f", "data-typ": typ, r: 5 });
    for (const [x, typ] of d.extremA) punkt(K2, x, d.f(x), "dr-wende", { "data-rolle": "punkt-f", "data-typ": typ, r: 5 });
    punkt(K2, x0, d.f(x0), "fr-punkt", { "data-rolle": "p" });
    knoten.push(K2.svg);
  }
  zeige("fs-mount", ...knoten);
  const m = d.d(x0), w = d.d2(x0);
  const mono = Math.abs(m) < 1e-12 ? "der Graph von f hat hier eine <strong>waagerechte Tangente</strong>" : m > 0 ? "positiv: <strong>f steigt</strong>" : "negativ: <strong>f fällt</strong>";
  const kr = Math.abs(w) < 1e-12 ? "der Graph von f′ hat hier eine waagerechte Tangente: <strong>Wendestelle</strong> von f" : w > 0 ? "f′ steigt: <strong>Linkskurve</strong>" : "f′ fällt: <strong>Rechtskurve</strong>";
  setzeHtml("fs-bilanz", `x₀ = ${num(x0)}: f′(x₀) = ${num(m)} — ${mono}.<br>Steigung von f′ bei x₀ = f″(x₀) = ${num(w)} — ${kr}.`);
  const nah = d.nullstellen.find(([x]) => Math.abs(x - x0) < 1e-9);
  const nahW = d.extremA.find(([x]) => Math.abs(x - x0) < 1e-9);
  let text = "Lies am Vorzeichen von f′ ab, ob f steigt, und an der Steigung von f′, wie f gekrümmt ist.";
  if (nah) text = nah[2] === "S"
    ? "Hier berührt f′ die x-Achse nur: f′ ist links und rechts positiv. f hat eine waagerechte Tangente, steigt aber weiter — ein Sattelpunkt. Weil f′ hier zugleich einen Tiefpunkt hat, ist es auch ein Wendepunkt."
    : `Hier wechselt f′ das Vorzeichen ${nah[1] === "-+" ? "von − nach +: f hat einen Tiefpunkt" : "von + nach −: f hat einen Hochpunkt"}.`;
  else if (nahW) text = `Hier hat f′ einen ${d.d2(x0 - 0.1) > 0 ? "Hochpunkt: f steigt an dieser Stelle am stärksten" : "Tiefpunkt: f steigt hier am schwächsten bzw. fällt am stärksten"} — f hat einen Wendepunkt, keinen Extrempunkt.`;
  setzeText("fs-text", text);
}

// ================= 9. Funktionenscharen =================

const SA_WERTE = [0.25, 0.5, 0.75, 1, 1.25, 1.5];
function renderScharen() {
  const a = reglerRaster("sa-a");
  setzeAnzeige("sa-a-anzeige", num(a));
  const ort = document.getElementById("sa-ort").checked;
  const fa = (p) => (x) => x ** 3 - 3 * p * p * x;
  const K = koordinatenXY({ hoehe: 330, xmin: -2.5, xmax: 2.5, ymin: -7.5, ymax: 7.5 });
  for (const p of [0.5, 1, 1.5]) if (p !== a) graph(K, fa(p), -2.5, 2.5, { schritte: 300, basis: "dr-schar", rolle: "schar" });
  if (ort) graph(K, (x) => -2 * x ** 3, -1.65, 1.65, { schritte: 200, basis: "dr-ortskurve", rolle: "ortskurve" });
  // Die Spur: Hoch- und Tiefpunkte für alle Reglerstellungen, blass — sie zeigen, wo die Punkte wandern.
  for (const p of SA_WERTE) {
    punkt(K, -p, 2 * p ** 3, "fr-punkt duenn", { "data-rolle": "spur", r: 3 });
    punkt(K, p, -2 * p ** 3, "fr-punkt duenn", { "data-rolle": "spur", r: 3 });
  }
  graph(K, fa(a), -2.5, 2.5, { schritte: 500 });
  punkt(K, -a, 2 * a ** 3, "dr-extrem", { "data-rolle": "extrem", "data-typ": "H", r: 6 });
  beschrift(K, -a, 2 * a ** 3, "H", "dr-text-b", { dx: -12, dy: -8 });
  punkt(K, a, -2 * a ** 3, "dr-extrem", { "data-rolle": "extrem", "data-typ": "T", r: 6 });
  beschrift(K, a, -2 * a ** 3, "T", "dr-text-b", { dx: 12, dy: 18 });
  punkt(K, 0, 0, "dr-wende", { "data-rolle": "wende", "data-typ": "W", r: 5 });
  zeige("sa-mount", K.svg);
  setzeHtml("sa-bilanz",
    `a = ${num(a)}: f<sub>a</sub>(x) = x³ − ${num(3 * a * a)}x, &nbsp;f<sub>a</sub>′(x) = 3x² − ${num(3 * a * a)}, Nullstellen ±${num(a)}.<br>` +
    `<span class="wc">H(${num(-a)} | ${num(2 * a ** 3)})</span>, <span class="wc">T(${num(a)} | ${num(-2 * a ** 3)})</span>, W(0 | 0).<br>` +
    `Probe Ortskurve: −2 · (${num(a)})³ = ${num(-2 * a ** 3)} = y<sub>T</sub> &nbsp;und&nbsp; −2 · (${num(-a)})³ = ${num(2 * a ** 3)} = y<sub>H</sub>.`);
  setzeText("sa-text", a <= 0.5
    ? "Für kleine a rücken Hoch- und Tiefpunkt eng an den Ursprung, und der Graph wird zwischen ihnen flach — für a → 0 verschmelzen sie zum Sattelpunkt von x³."
    : "Hoch- und Tiefpunkt wandern auf derselben Kurve y = −2x³ nach außen. Der Wendepunkt bleibt für alle a im Ursprung — er ist ein gemeinsamer Punkt der ganzen Schar.");
}

// ================= 10. Steckbriefaufgaben =================

function renderSteckbrief() {
  const u = reglerRaster("sb-u"), v = reglerRaster("sb-v");
  setzeAnzeige("sb-u-anzeige", num(u));
  setzeAnzeige("sb-v-anzeige", num(v));
  // f(x) = ax³ + cx (punktsymmetrisch); f(u) = v und f′(u) = 0 ⇒ a = −v/(2u³), c = 3v/(2u).
  const a = -v / (2 * u ** 3), c = (3 * v) / (2 * u);
  const f = (x) => a * x ** 3 + c * x;
  const K = koordinatenXY({ hoehe: 320, xmin: -3, xmax: 3, ymin: -3.5, ymax: 3.5 });
  graph(K, f, -3, 3, { schritte: 500 });
  punkt(K, u, v, "dr-extrem", { "data-rolle": "extrem", "data-typ": "H", r: 6 });
  beschrift(K, u, v, `H(${num(u)} | ${num(v)})`, "dr-text-b", { dy: -12 });
  punkt(K, -u, -v, "dr-extrem", { "data-rolle": "extrem", "data-typ": "T", r: 5 });
  beschrift(K, -u, -v, "T", "dr-text-b", { dy: 20 });
  zeige("sb-mount", K.svg);
  const u2 = u * u, u3 = u ** 3;
  setzeHtml("sb-bilanz",
    `Ansatz (punktsymmetrisch): f(x) = ax³ + cx, &nbsp;f′(x) = 3ax² + c.<br>` +
    `I: f(${num(u)}) = ${num(v)} &nbsp;⟹&nbsp; ${num(u3)}a + ${num(u)}c = ${num(v)}<br>` +
    `II: f′(${num(u)}) = 0 &nbsp;⟹&nbsp; ${num(3 * u2)}a + c = 0, also c = −${num(3 * u2)}a<br>` +
    `II in I: ${num(u3)}a − ${num(3 * u3)}a = ${num(v)} ⟹ −${num(2 * u3)}a = ${num(v)} ⟹ <span class="wc">a ${gleich(a)}</span>, &nbsp;<span class="wc">c ${gleich(c)}</span><br>` +
    `Probe: f″(x) = 6ax, f″(${num(u)}) ${gleich(6 * a * u)} &lt; 0 — H ist wirklich ein Hochpunkt.`);
  setzeText("sb-text", glattZahl(a) && glattZahl(c)
    ? `f(x) = ${geradeTextKubisch(a, c)} — der Graph geht durch H und hat dort eine waagerechte Tangente; T ist sein Spiegelbild am Ursprung.`
    : "Die Koeffizienten sind hier keine abbrechenden Dezimalzahlen — exakt ist a = −v/(2u³) und c = 3v/(2u). Der Graph geht trotzdem genau durch H.");
}
function glattZahl(x) {
  return Math.abs(Math.round(x * 1e4) - x * 1e4) < 1e-6;
}
// a x³ + c x als Text ohne „1x“ und „+ −“.
function geradeTextKubisch(a, c) {
  const glied = (k, p, erst) => {
    const betrag = Math.abs(k) === 1 ? "" : num(Math.abs(k));
    return erst ? `${k < 0 ? "−" : ""}${betrag}${p}` : `${k < 0 ? "−" : "+"} ${betrag}${p}`;
  };
  return `${glied(a, "x³", true)} ${glied(c, "x", false)}`;
}

// ================= 11. Extremwertprobleme =================

function renderOptimierung() {
  const x = reglerRaster("op-x");
  setzeAnzeige("op-x-anzeige", `${num(x)} cm`);
  const s = 12 - 2 * x, V = x * s * s;
  const K1 = koordinatenXY({ breite: 300, hoehe: 300, xmin: -0.8, xmax: 12.8, ymin: -0.8, ymax: 12.8, xName: "", yName: "" });
  rechteck(K1, 0, 0, 12, 12, "dr-blatt", { "data-rolle": "blatt" });
  for (const [x1, y1] of [[0, 0], [12 - x, 0], [0, 12 - x], [12 - x, 12 - x]]) rechteck(K1, x1, y1, x1 + x, y1 + x, "dr-ausschnitt", { "data-rolle": "ausschnitt" });
  rechteck(K1, x, x, 12 - x, 12 - x, "dr-boden", { "data-rolle": "boden" });
  beschrift(K1, x / 2, 12 - x / 2, "x", "dr-text-r", { dy: 4 });
  beschrift(K1, 6, 6, `${num(s)} cm`, "dr-text-g", { dy: 4 });
  const K2 = koordinatenXY({ breite: 330, hoehe: 300, xmin: 0, xmax: 6, ymin: 0, ymax: 140, xName: "x", yName: "V" });
  graph(K2, (t) => t * (12 - 2 * t) ** 2, 0, 6, { schritte: 400 });
  strecke(K2, x, 0, x, V, "dr-lot", { "data-rolle": "lot" });
  punkt(K2, 2, 128, "dr-extrem", { "data-rolle": "maximum", r: 5 });
  beschrift(K2, 2, 128, "Max", "dr-text-b", { dy: -10 });
  punkt(K2, x, V, "dr-punkt-q", { "data-rolle": "p" });
  zeige("op-mount", K1.svg, K2.svg);
  const V1 = 12 * (x - 2) * (x - 6);
  setzeHtml("op-bilanz",
    `Boden ${num(s)} cm × ${num(s)} cm, Höhe ${num(x)} cm: &nbsp;V(${num(x)}) = ${num(x)} · ${num(s)}² = <span class="wa">${num(V)} cm³</span><br>` +
    `V′(${num(x)}) = 12 · (${num(x)} − 2) · (${num(x)} − 6) = ${num(V1)} — ${Math.abs(V1) < 1e-12 ? "waagerechte Tangente: das Maximum" : V1 > 0 ? "V wächst noch" : "V nimmt schon ab"}.`);
  setzeText("op-text", Math.abs(x - 2) < 1e-9
    ? "Bei x = 2 cm ist das Volumen mit 128 cm³ am größten: Boden 8 cm × 8 cm, Höhe 2 cm."
    : x < 2
      ? "Noch zu wenig ausgeschnitten: Die Schachtel ist flach. Ein etwas größeres x macht sie höher, und das wiegt den kleineren Boden noch auf."
      : "Zu viel ausgeschnitten: Die Schachtel ist hoch, aber der Boden schrumpft quadratisch — das Volumen sinkt.");
}

// ================= 12. Newton-Verfahren =================

const NW = { f: (x) => x ** 3 - 2 * x - 5, d: (x) => 3 * x * x - 2 };
const TIEF = ["₀", "₁", "₂", "₃", "₄", "₅", "₆"];
function newtonFolge(x0, n) {
  const xs = [x0];
  for (let k = 0; k < n; k++) {
    const dk = NW.d(xs[k]);
    if (Math.abs(dk) < 1e-12) return { xs, abbruch: true };
    xs.push(xs[k] - NW.f(xs[k]) / dk);
  }
  return { xs, abbruch: false };
}
function renderNewton() {
  const x0 = reglerRaster("nw-x"), n = reglerRaster("nw-n");
  setzeAnzeige("nw-x-anzeige", num(x0));
  setzeAnzeige("nw-n-anzeige", String(n));
  const { xs, abbruch } = newtonFolge(x0, n);
  const K = koordinatenXY({ hoehe: 320, xmin: -2.5, xmax: 4.5, ymin: -15, ymax: 35 });
  graph(K, NW.f, -2.5, 4.5, { schritte: 500 });
  let letzteMarke = -Infinity;
  xs.forEach((xk, k) => {
    if (k < xs.length - 1) {
      strecke(K, xk, 0, xk, NW.f(xk), "dr-lot", { "data-rolle": "lot", "data-k": String(k) });
      gerade(K, NW.d(xk), xk, NW.f(xk), "dr-newton", { "data-rolle": "newton-tangente", "data-k": String(k) });
      punkt(K, xk, NW.f(xk), "dr-punkt-q", { "data-rolle": "graphpunkt", "data-k": String(k), r: 4 });
    }
    punkt(K, xk, 0, k === xs.length - 1 ? "dr-punkt-t" : "dr-schneidet", { "data-rolle": "naeherung", "data-k": String(k), r: k === xs.length - 1 ? 6 : 4 });
    // Beschriftung nur, wenn die Marke nicht auf der vorigen säße — nahe der Nullstelle drängen
    // sich die Werte.
    if (Math.abs(K.X(xk) - letzteMarke) > 24 && xk > -2.5 && xk < 4.5) {
      beschrift(K, xk, 0, `x${TIEF[k]}`, "dr-text-o", { dy: 18 });
      letzteMarke = K.X(xk);
    }
  });
  zeige("nw-mount", K.svg);
  const zeilen = xs.map((xk, k) => `<tr><td>${k}</td><td${k === xs.length - 1 ? ' class="aktiv"' : ""}>${num(xk, 7)}</td><td>${num(NW.f(xk), 7)}</td><td>${num(NW.d(xk), 7)}</td></tr>`).join("");
  setzeHtml("nw-tabelle", `<table class="fr-tabelle"><tr><th>n</th><th>x<sub>n</sub></th><th>f(x<sub>n</sub>)</th><th>f′(x<sub>n</sub>)</th></tr>${zeilen}</table>`);
  const xn = xs[xs.length - 1];
  setzeHtml("nw-bilanz",
    `f(x) = x³ − 2x − 5, f′(x) = 3x² − 2. ` +
    (xs.length > 1 ? `Letzter Schritt: x${TIEF[xs.length - 1]} = ${num(xs[xs.length - 2], 7)} − ${bruch(num(NW.f(xs[xs.length - 2]), 7), num(NW.d(xs[xs.length - 2]), 7))} ${gleich(xn, 7)}` : `Startwert x₀ = ${num(x0)}, f(x₀) = ${num(NW.f(x0))}`) +
    `<br>|f(x${TIEF[xs.length - 1]})| ${gleich(Math.abs(NW.f(xn)), 7)}`);
  const draussen = xs.some((xk) => xk < -2.5 || xk > 4.5);
  let text;
  if (abbruch) text = "Hier ist f′(xₙ) = 0: Die Tangente ist waagerecht und hat keine Nullstelle — das Verfahren bricht ab.";
  else if (n === 0) text = "Nur der Startwert. Schiebe die Schritte hoch: Jede Tangente schneidet die x-Achse näher an der Nullstelle.";
  else if (Math.abs(NW.f(xn)) < 1e-6) text = "Die Werte stehen still — die Nullstelle ist auf mindestens sechs Nachkommastellen erreicht. Nahe der Nullstelle verdoppelt sich die Zahl der richtigen Stellen mit jedem Schritt ungefähr.";
  else if (draussen) text = "Ein Näherungswert liegt außerhalb des Bildes: Der Startwert lag nahe einer Stelle mit f′ ≈ 0, die Tangente war fast waagerecht.";
  else text = "Die Näherungen nähern sich der Nullstelle — noch ein paar Schritte.";
  setzeText("nw-text", text);
}

// ================= 13. Stolperstelle =================

function renderStolperstelle() {
  const k = reglerRaster("st-k");
  setzeAnzeige("st-k-anzeige", num(k));
  const f = (x) => 0.25 * x ** 4 + (k / 3) * x ** 3, f2 = (x) => 3 * x * x + 2 * k * x;
  const K1 = koordinatenXY({ hoehe: 260, xmin: -2.5, xmax: 2.5, ymin: -2, ymax: 3, panel: "f" });
  panelTitel(K1, k === 0 ? "f(x) = 0,25x⁴" : `f(x) = 0,25x⁴ ${plusMinus(k)}/3 · x³`);
  graph(K1, f, -2.5, 2.5, { schritte: 600, klasseVon: kruemmung(f2) });
  if (k === 0) {
    punkt(K1, 0, 0, "dr-extrem", { "data-rolle": "extrem", "data-typ": "T", r: 6 });
    beschrift(K1, 0, 0, "T", "dr-text-b", { dy: 20 });
  } else {
    // f′(x) = x²(x + k): Tiefpunkt bei −k (Vorzeichenwechsel − → +), Sattelpunkt bei 0.
    punkt(K1, -k, -(k ** 4) / 12, "dr-extrem", { "data-rolle": "extrem", "data-typ": "T", r: 5 });
    beschrift(K1, -k, -(k ** 4) / 12, "T", "dr-text-b", { dy: 20 });
    punkt(K1, 0, 0, "dr-wende", { "data-rolle": "wende", "data-typ": "S", r: 6 });
    beschrift(K1, 0, 0, "S", "dr-text-v", { dy: -10 });
    const xw = (-2 * k) / 3;
    punkt(K1, xw, f(xw), "dr-wende", { "data-rolle": "wende", "data-typ": "W", r: 6 });
    beschrift(K1, xw, f(xw), "W", "dr-text-v", { dy: -10 });
  }
  const K2 = koordinatenXY({ hoehe: 200, xmin: -2.5, xmax: 2.5, ymin: -2, ymax: 6, panel: "a2" });
  panelTitel(K2, "Graph von f″");
  graph(K2, f2, -2.5, 2.5, { schritte: 500, basis: "dr-ableitung2", rolle: "ableitung2" });
  if (k === 0) punkt(K2, 0, 0, "dr-schnitt", { "data-rolle": "nullstelle-f2", "data-vzw": "keiner", r: 5 });
  else for (const x of [0, (-2 * k) / 3]) punkt(K2, x, 0, "dr-schneidet", { "data-rolle": "nullstelle-f2", "data-vzw": "ja", r: 5 });
  zeige("st-mount", K1.svg, K2.svg);
  const xw = (-2 * k) / 3;
  setzeHtml("st-bilanz", k === 0
    ? `f″(x) = 3x²: <span class="wo">doppelte Nullstelle 0</span>, f″ ≥ 0 links und rechts — <strong>kein Vorzeichenwechsel, keine Wendestelle</strong>. f‴(0) = 0 entscheidet nichts.<br>f′(x) = x³ wechselt bei 0 von − nach +: <span class="wc">Tiefpunkt T(0 | 0)</span>.`
    : `f″(x) = 3x² ${plusMinus(2 * k)}x = x(3x ${plusMinus(2 * k)}): einfache Nullstellen 0 und −2k/3 ${gleich(xw)} — beide mit Vorzeichenwechsel.<br>` +
      `f‴(0) = ${num(2 * k)} ≠ 0 und f′(0) = 0: <span class="wr">Sattelpunkt S(0 | 0)</span>; <span class="wr">W(${num(xw)} | ${num(f(xw))})</span>; Tiefpunkt T(${num(-k)} | ${num(f(-k))}).`);
  setzeText("st-text", k === 0
    ? "Die beiden Wendestellen sind zusammengestoßen und haben sich gegenseitig ausgelöscht: Der Graph ist jetzt überall eine Linkskurve. f″(0) = 0 allein beweist also nichts."
    : Math.abs(k) <= 0.5
      ? "Die beiden Wendestellen liegen schon sehr nah beieinander — dazwischen ist ein schmales Stück Rechtskurve. Noch ein Schritt, und es verschwindet."
      : "Zwei Wendestellen: zwischen ihnen ist der Graph eine Rechtskurve, außen eine Linkskurve. Schiebe k gegen 0.");
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
  "quiz-hoehere": {
    q: "Wie groß ist f″(1) für f(x) = x⁴?",
    options: ["4", "16", "12", "24"],
    correct: 2,
    explain: "f′(x) = 4x³ und f″(x) = 12x², also f″(1) = 12. 4 ist f′(1), 16 wäre f′(1) · f′(1), und 24 ist f‴(1) = 24 · 1 — eine Ableitung zu weit.",
  },
  "quiz-kruemmung": {
    q: "Der Graph von f ist auf [1; 3] eine Rechtskurve und fällt dort. Was gilt auf diesem Intervall?",
    options: ["f′ ist negativ und fällt.", "f′ ist negativ und steigt.", "f′ ist positiv, f″ ist negativ.", "f″ ist positiv."],
    correct: 0,
    explain: "„f fällt“ heißt f′ &lt; 0, „Rechtskurve“ heißt f′ fällt (f″ &lt; 0). Beides zusammen: Die Steigung ist negativ und wird immer negativer — der Graph fällt immer steiler ab.",
  },
  "quiz-extrem2": {
    q: "Für eine Funktion gilt f′(2) = 0 und f″(2) = 0. Was folgt daraus?",
    options: ["f hat an der Stelle 2 keinen Extrempunkt.", "f hat an der Stelle 2 einen Sattelpunkt.", "f hat an der Stelle 2 einen Wendepunkt.", "Noch nichts — erst der Vorzeichenwechsel von f′ entscheidet."],
    correct: 3,
    explain: "Mit f″(2) = 0 versagt das f″-Kriterium. Alles ist möglich: x⁴ hat bei 0 einen Tiefpunkt, −x⁴ einen Hochpunkt, x³ einen Sattelpunkt. Erst das Vorzeichen von f′ links und rechts von 2 entscheidet.",
  },
  "quiz-wendepunkte": {
    q: "Wo liegt die Wendestelle von f(x) = x³ − 6x² + 4?",
    options: ["bei x = 0 und x = 4", "bei x = 2", "bei x = 6", "bei x = −2"],
    correct: 1,
    explain: "f′(x) = 3x² − 12x, f″(x) = 6x − 12 = 0 ⟺ x = 2, und f‴(x) = 6 ≠ 0. Die Stellen 0 und 4 sind die Nullstellen von f′ — dort liegen Hoch- und Tiefpunkt, und 2 liegt genau in ihrer Mitte.",
  },
  "quiz-schema": {
    q: "Wie viele Wendestellen kann eine ganzrationale Funktion vom Grad 4 höchstens haben?",
    options: ["1", "3", "4", "2"],
    correct: 3,
    explain: "Bei Grad 4 hat f″ den Grad 2 und damit höchstens zwei Nullstellen — also höchstens zwei Wendestellen. Ebenso hat f′ vom Grad 3 höchstens drei Nullstellen, also höchstens drei Extremstellen.",
  },
  "quiz-trig": {
    q: "Warum hat f(x) = x + 2 sin(x) an der Stelle π einen Wendepunkt?",
    options: ["Weil f′(π) = 0 ist.", "Weil f″(π) = −2 sin(π) = 0 und f‴(π) = −2 cos(π) = 2 ≠ 0 ist.", "Weil sin(π) = 0 ist und f deshalb bei π eine Nullstelle hat.", "Weil π die Mitte des Intervalls [0; 2π] ist."],
    correct: 1,
    explain: "Notwendige und hinreichende Bedingung zusammen: f″(π) = 0 und f‴(π) ≠ 0. Dagegen ist f′(π) = 1 + 2 cos(π) = −1, nicht 0, und f(π) = π ist keine Nullstelle. Die Lage in der Intervallmitte ist Zufall.",
  },
  "quiz-global": {
    q: "f(x) = x² auf dem Intervall [−1; 3]. Wo nimmt f sein globales Maximum an?",
    options: ["bei x = 0", "bei x = −1", "bei x = 3", "nirgends, weil f′ nur bei 0 null ist"],
    correct: 2,
    explain: "Kandidaten sind die Stelle 0 (f′(0) = 0, dort ist das Minimum 0) und die Ränder: f(−1) = 1, f(3) = 9. Das globale Maximum 9 liegt am rechten Rand, wo f′(3) = 6 gar nicht null ist.",
  },
  "quiz-fstrich": {
    q: "Der Graph von f′ hat bei x = 2 einen Hochpunkt und liegt dort oberhalb der x-Achse. Was hat f an der Stelle 2?",
    options: ["einen Hochpunkt", "einen Sattelpunkt", "eine Nullstelle", "einen Wendepunkt, an dem f am stärksten steigt"],
    correct: 3,
    explain: "Ein Extrempunkt von f′ ist eine Wendestelle von f. Weil f′ dort positiv und am größten ist, steigt f an dieser Stelle steiler als überall in der Nähe. Ein Hochpunkt von f läge dort, wo f′ von + nach − wechselt.",
  },
  "quiz-scharen": {
    q: "Auf welcher Kurve liegen die Tiefpunkte der Schar f<sub>a</sub>(x) = x² − 2ax?",
    options: ["y = −x²", "y = x²", "y = −2x", "y = −a²"],
    correct: 0,
    explain: "f<sub>a</sub>′(x) = 2x − 2a = 0 ⟺ x = a; f<sub>a</sub>(a) = a² − 2a² = −a². Also T(a | −a²), und mit a = x folgt y = −x². „y = −a²“ enthält noch den Parameter — eine Ortskurve ist eine Gleichung nur zwischen x und y.",
  },
  "quiz-steckbrief": {
    q: "Der Graph einer ganzrationalen Funktion hat im Punkt P(2 | 1) einen Tiefpunkt. Welche Gleichungen liefert diese Angabe?",
    options: ["f(2) = 1 und f″(2) = 0", "f(1) = 2 und f′(1) = 0", "f′(2) = 1 und f(2) = 0", "f(2) = 1 und f′(2) = 0"],
    correct: 3,
    explain: "Der Punkt liegt auf dem Graphen: f(2) = 1. Ein Tiefpunkt hat eine waagerechte Tangente: f′(2) = 0. Dass es wirklich ein Tiefpunkt ist (f″(2) &gt; 0), lässt sich nicht als Gleichung schreiben — das wird am Ende mit einer Probe geprüft.",
  },
  "quiz-optimierung": {
    q: "Ein Rechteck hat den Umfang 20 cm. Bei welcher Seitenlänge x ist sein Flächeninhalt am größten?",
    options: ["x = 10 cm", "x = 5 cm — das Rechteck ist ein Quadrat", "x = 2,5 cm", "x = 20 cm"],
    correct: 1,
    explain: "Nebenbedingung 2x + 2y = 20, also y = 10 − x. Zielfunktion A(x) = x(10 − x) = 10x − x² auf 0 &lt; x &lt; 10. A′(x) = 10 − 2x = 0 ⟺ x = 5, A″ = −2 &lt; 0. Bei x = 10 wäre y = 0 — kein Rechteck mehr.",
  },
  "quiz-newton": {
    q: "Newton-Verfahren für f(x) = x² − 2 mit dem Startwert x₀ = 1. Wie groß ist x₁?",
    options: ["0,5", "2", "1,5", "1,4142"],
    correct: 2,
    explain: "f(1) = −1, f′(x) = 2x, f′(1) = 2. x₁ = 1 − (−1)/2 = 1,5. Der nächste Schritt gibt 1,41666…; 1,4142 ≈ √2 ist erst das Ziel. 0,5 entsteht, wenn man das Minuszeichen vergisst.",
  },
  "quiz-stolperstelle": {
    q: "Für eine Funktion gilt f″(x) = (x − 1)². Hat f an der Stelle 1 eine Wendestelle?",
    options: ["Ja, weil f″(1) = 0 ist.", "Nein, weil f″ bei 1 das Vorzeichen nicht wechselt.", "Ja, weil auch f‴(1) = 0 ist.", "Nein, weil dafür f′(1) = 0 sein müsste."],
    correct: 1,
    explain: "f″(x) = (x − 1)² ist links und rechts von 1 positiv: Der Graph ist durchgehend eine Linkskurve. 1 ist eine doppelte Nullstelle von f″ — notwendig erfüllt, hinreichend nicht. f′(1) = 0 wird nur für einen Sattelpunkt gebraucht, nicht für jeden Wendepunkt.",
  },
};

// ================= Selbsteinschätzung =================
//
// Die Auswahl liegt nur im Browser dieser Person — eine Lernhilfe, keine Leistungsmessung.
const SE_PUNKTE = [
  ["sec-hoehere", "Ich kann höhere Ableitungen bilden und f″ als Steigung des Graphen von f′ deuten."],
  ["sec-kruemmung", "Ich kann am Vorzeichen von f″ ablesen, ob der Graph eine Links- oder Rechtskurve ist, und das begründen."],
  ["sec-extrem2", "Ich kann Extremstellen mit f″ nachweisen und weiß, was bei f″(x<sub>E</sub>) = 0 zu tun ist."],
  ["sec-wendepunkte", "Ich kann Wendepunkte, Sattelpunkte und die Wendetangente bestimmen."],
  ["sec-schema", "Ich kann eine ganzrationale Funktion vollständig untersuchen und den Graphen zeichnen."],
  ["sec-trig", "Ich kann eine Funktion mit Sinus auf einem Intervall untersuchen."],
  ["sec-global", "Ich kann globale Extrema auf einem Intervall bestimmen, auch am Rand."],
  ["sec-fstrich", "Ich kann aus dem Graphen von f′ auf Monotonie, Extrem- und Wendepunkte von f schließen."],
  ["sec-scharen", "Ich kann eine Funktionenschar untersuchen und eine Ortskurve bestimmen."],
  ["sec-steckbrief", "Ich kann eine ganzrationale Funktion aus Eigenschaften bestimmen und die Probe machen."],
  ["sec-optimierung", "Ich kann ein Extremwertproblem mit Haupt- und Nebenbedingung lösen."],
  ["sec-newton", "Ich kann Nullstellen mit dem Newton-Verfahren annähern und weiß, wann es scheitert."],
  ["sec-stolperstelle", "Ich weiß, dass f″(x) = 0 allein noch keinen Wendepunkt beweist."],
];
const SE_SCHLUESSEL = "uplant-mss11-funktionsuntersuchung-selbsteinschaetzung";

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
    const knoepfe = el("div", { class: "se-knoepfe", role: "group", "aria-label": text.replace(/<[^>]+>/g, "") });
    [["sicher", "😀", "sicher"], ["teils", "😐", "teilweise"], ["unsicher", "🤔", "noch unsicher"]].forEach(([wert, z, name]) => {
      const b = el("button", { type: "button", "aria-pressed": String(stand[id] === wert), title: name, "aria-label": name }, z);
      b.addEventListener("click", () => { const d = leseSE(); d[id] = wert; schreibeSE(d); renderSelbsteinschaetzung(); });
      knoepfe.appendChild(b);
    });
    liste.appendChild(el("div", { class: "se-zeile" }, [el("span", { class: "se-text", html: text }), knoepfe]));
  });
  const unsicher = SE_PUNKTE.filter(([id]) => stand[id] === "unsicher");
  const sicher = SE_PUNKTE.filter(([id]) => stand[id] === "sicher").length;
  const aus = document.getElementById("se-auswertung");
  if (!Object.keys(stand).length) aus.textContent = "Noch nichts angekreuzt.";
  else if (unsicher.length) aus.innerHTML = `Wiederhole zuerst: ${unsicher.map(([id]) => `<a href="#${id}">${document.querySelector(`#${id} h2`).textContent}</a>`).join(", ")}. Danach passen die Übungsaufgaben auf den Stufen „einfach“ und „mittel“.`;
  else aus.textContent = `${sicher} von ${SE_PUNKTE.length} Punkten sicher — probier dich an den Aufgaben auf den Stufen „schwierig“ und „komplex“.`;
}

// ================= Start =================

// Wählt man eine andere Funktion, bekommt der x₀-Regler den Bereich dieser Funktion — vor dem
// Zeichnen, sonst stünde der Regler kurz auf einer Stelle außerhalb des Bildes.
const BEREICHE = { "ho-art": hoBereich, "kr-art": krBereich };
const REGLER = [
  [["ho-art", "ho-x"], renderHoehere],
  [["kr-art", "kr-x"], renderKruemmung],
  [["ex-a"], renderExtrem2],
  [["wp-b", "wp-x"], renderWende],
  [["sc-art", "sc-s"], renderSchema],
  [["tr-k"], renderTrig],
  [["gl-a", "gl-b"], renderGlobal],
  [["fs-art", "fs-x", "fs-zeige"], renderFstrich],
  [["sa-a", "sa-ort"], renderScharen],
  [["sb-u", "sb-v"], renderSteckbrief],
  [["op-x"], renderOptimierung],
  [["nw-x", "nw-n"], renderNewton],
  [["st-k"], renderStolperstelle],
];
for (const bereich of Object.values(BEREICHE)) bereich();
for (const [ids, render] of REGLER) {
  ids.forEach((id) => {
    const e = document.getElementById(id);
    const handler = BEREICHE[id] ? () => { BEREICHE[id](); render(); } : render;
    if (e.tagName === "SELECT" || e.type === "checkbox") e.addEventListener("change", handler);
    else e.addEventListener("input", handler);
  });
  render();   // nicht vergessen — sonst bleibt die Zeichnung leer, bis jemand einen Regler anfasst
}
for (const [id, def] of Object.entries(QUIZZE)) mountQuiz(document.getElementById(id), def);
renderSelbsteinschaetzung();
mountUebungsaufgaben(document.getElementById("exercises-mount"), AUFGABEN, { parse: parseZahl });
