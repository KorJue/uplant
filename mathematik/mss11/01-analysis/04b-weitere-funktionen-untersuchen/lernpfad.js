// Selbstlernpfad „Untersuchung weiterer Funktionen“ (MSS 11, Analysis, Thema 3.2 — Leistungskurs; die
// Abschnitte zu p(x) · e^(kx) gehören auch zum Grundkurs). Vanilla-JS, kein Build.
//
// Didaktische Reihenfolge — jede Stufe benutzt nur, was davor steht. Thema 3.1 liefert Ablauf und
// Bedingungen, Thema 2.2 die Ableitungen. Die Grundkurs-Abschnitte 1–6 und 11 stützen sich nie auf die
// Leistungskurs-Abschnitte 7–10; wo sie ein LK-Beispiel zur Auswahl anbieten, trägt es „(LK)“:
//    1. Vergleich mit ganzrationalen Funktionen (Ablauf aus 3.1, vier Funktionstypen nebeneinander)
//    2. f″ von p(x) · e^(kx)                     (Produktregel aus 2.2 zweimal; Vorzeichen = Klammer)
//    3. Vollständige Untersuchung                (1 und 2 zusammen; Asymptote aus 1.2 und 2.2)
//    4. Funktionenscharen, Ortskurven            (3 mit Parameter; Ortskurve wie in 3.1)
//    5. Wachstumsmodelle                         (Wendestelle = größte Rate; logistisch: LK, Kettenregel)
//    6. Extremwertprobleme                       (Zielfunktion wie in 3.1; cos: LK, Newton aus 3.1)
//    7. Sinus und Kosinus (LK)                   (cos x = c vollständig lösen; Periodizität)
//    8. Gedämpfte Schwingung (LK)                (Produktregel mit sin; tan x = c)
//    9. ln-Funktionen (LK)                       (Quotientenregel; x · ln x für x → 0⁺ über x = e^(−t))
//   10. Glockenkurve (LK)                        (Kettenregel, dann Produktregel)
//   11. Stolperstelle: das Fenster               (nur p(x) · e^(kx) — Grundkursmittel)
//
// Gerechnet wird mit Reglerwerten, nie mit Bildschirmkoordinaten. Die besonderen Punkte stehen als
// exakte Formeln im Code (1/k, 2 ± √2, tan⁻¹(1/d) …), nicht als Ergebnis einer Suche — die Prüfung
// sucht sie unabhängig numerisch und vergleicht.
//
// Farbcodierung wie in Thema 3.1: f blau, f′ grün, f″ violett; Linkskurve violett, Rechtskurve orange;
// Extrempunkte blau, Wendepunkte violett; Asymptoten, Ränder und Warnungen rot, Hilfslinien grau.

import { mountUebungsaufgaben } from "../../../aufgaben.js?v=3";
import { AUFGABEN, parseZahl } from "./aufgaben-weitere-funktionen-untersuchen.js?v=1";

const E = Math.E, PI = Math.PI;

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
// „=“ oder „≈“: Entscheidend ist, ob die Anzeige mit dieser Stellenzahl den Wert genau trifft.
function zeichen(x, stellen = 4) {
  const f = Math.pow(10, stellen);
  return Math.abs(x * f - Math.round(x * f)) < 1e-7 ? "=" : "≈";
}
function bruch(z, n) {
  return `<span class="bruch"><span class="z">${z}</span><span class="n">${n}</span></span>`;
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

// ---------- Zusätzliche Helfer der Funktionsuntersuchung ----------

// Krümmung als Klasse für die Graphteile: f″ ≥ 0 links, sonst rechts. An einer einzelnen Stelle mit
// f″ = 0 entscheidet das nichts Sichtbares; die Prüfung liest die Teile nur abseits der Nullstellen.
const kruemmung = (d2) => (x) => (d2(x) >= 0 ? "links" : "rechts");
// Eine Zahl mit „=“ oder „≈“ davor — für Stellen wie √3, die die Anzeige nicht genau trifft.
const gleich = (x, stellen = 4) => `${zeichen(x, stellen)} ${num(x, stellen)}`;

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
// Eine waagerechte Asymptote als rote, gestrichelte Strecke auf der Seite, auf der sie gilt. Bei y = 0
// liegt sie auf der x-Achse — deshalb kräftig und farbig, sonst verschwände sie in der Achse.
function asymptote(K, y, von, bis, seite, beschriftung = true) {
  strecke(K, von, y, bis, y, "dr-asymptote", { "data-rolle": "asymptote", "data-y": String(y), "data-seite": seite });
  if (beschriftung) beschrift(K, seite === "rechts" ? bis : von, y, `y = ${num(y)}`, "dr-text-r", { dx: seite === "rechts" ? -26 : 26, dy: -8 });
}
// Der Bereich außerhalb der Definitionsmenge (x ≤ 0) grau hinterlegt.
function ausserhalbD(K) {
  rechteck(K, K.xmin, K.ymin, 0, K.ymax, "dr-ausserhalb", { "data-rolle": "ausserhalb-d" });
}
// Ein Vielfaches von π/12 als gekürzter Bruch: „2π/3“, „−π“, „0“.
function piText(k) {
  if (k === 0) return "0";
  const g = (a, b) => (b ? g(b, a % b) : a);
  const v = k < 0 ? "−" : "", a = Math.abs(k);
  const t = g(a, 12), z = a / t, n = 12 / t;
  const zt = z === 1 ? "π" : `${z}π`;
  return v + (n === 1 ? zt : `${zt}/${n}`);
}
// Zeichen und Zahl für Zwischenwerte, die die Anzeige nicht genau trifft — „≈ 0,3679“ oder „= 0,5“.
const ePot = (k) => (k === 1 ? "e<sup>x</sup>" : k === -1 ? "e<sup>−x</sup>" : `e<sup>${num(k)}x</sup>`);

// ================= 1. Vergleich mit ganzrationalen Funktionen =================

const W3 = Math.sqrt(3);
const VG_SCHRITTE = ["Definitionsmenge", "Symmetrie", "Nullstellen", "Verhalten am Rand", "Extrempunkte", "Wendepunkte", "Graph und Wertemenge"];
const VG = [
  {
    id: "poly", kopf: "ganzrational", titel: "ganzrational: 0,5x³ − 1,5x",
    f: (x) => 0.5 * x ** 3 - 1.5 * x, xs: [-2.8, 2.8], y: [-3, 3.3],
    zentrum: true, nullstellen: [-W3, 0, W3], extrema: [[-1, "H"], [1, "T"]], wende: [[0, "W"]],
    rand: { links: "unten", rechts: "oben" },
    zeilen: [
      "D = ℝ",
      "f(−x) = −f(x): punktsymmetrisch zum Ursprung",
      "0 und ±√3 ≈ ±1,732 — höchstens 3 (Grad 3)",
      "x → −∞: f → −∞; x → +∞: f → +∞ (das Glied 0,5x³ entscheidet)",
      "H(−1 | 1), T(1 | −1) — höchstens 2",
      "W(0 | 0) — höchstens 1",
      "W = ℝ",
    ],
  },
  {
    id: "exp", kopf: "e-Funktion", titel: "e-Funktion: x · e^(−x)",
    f: (x) => x * Math.exp(-x), xs: [-1.2, 5.6], y: [-2, 0.8],
    zentrum: false, nullstellen: [0], extrema: [[1, "H"]], wende: [[2, "W"]],
    rand: { links: "unten", asymptote: { y: 0, von: 3, seite: "rechts" } },
    zeilen: [
      "D = ℝ",
      "f(−x) = −x · e<sup>x</sup> ≠ ±f(x): keine",
      "nur 0 — e<sup>−x</sup> wird nie 0",
      "x → −∞: f → −∞; x → +∞: f → 0, <strong>Asymptote y = 0</strong>",
      "H(1 | e<sup>−1</sup>) ≈ H(1 | 0,3679)",
      "W(2 | 2e<sup>−2</sup>) ≈ W(2 | 0,2707)",
      "W = ]−∞; e<sup>−1</sup>]",
    ],
  },
  {
    id: "ln", kopf: "ln-Funktion (LK)", titel: "ln (LK): x · ln(x)",
    f: (x) => (x > 0 ? x * Math.log(x) : NaN), xs: [-0.3, 2.6], y: [-0.7, 2.6],
    nurPositiv: true, zentrum: false, nullstellen: [1], extrema: [[1 / E, "T"]], wende: [],
    rand: { randpunkt: [0, 0], rechts: "oben" },
    zeilen: [
      "<strong>D = ]0; ∞[</strong>",
      "entfällt — D liegt nur rechts von 0",
      "nur 1 — x = 0 liegt nicht in D",
      "x → 0⁺: f → 0, der Punkt (0 | 0) gehört nicht dazu; x → +∞: f → +∞",
      "T(e<sup>−1</sup> | −e<sup>−1</sup>) ≈ T(0,3679 | −0,3679)",
      `keiner: f″(x) = ${bruch("1", "x")} &gt; 0 auf ganz D`,
      "W = [−e<sup>−1</sup>; ∞[",
    ],
  },
  {
    id: "sin", kopf: "Winkelfunktion (LK)", titel: "sin (LK): 2 sin(x)",
    f: (x) => 2 * Math.sin(x), xs: [-7, 7], y: [-2.8, 3.3],
    zentrum: true, nullstellen: [-2 * PI, -PI, 0, PI, 2 * PI],
    extrema: [[-1.5 * PI, "H"], [-0.5 * PI, "T"], [0.5 * PI, "H"], [1.5 * PI, "T"]],
    wende: [[-2 * PI, "W"], [-PI, "W"], [0, "W"], [PI, "W"], [2 * PI, "W"]],
    rand: { schranke: [-2, 2] },
    zeilen: [
      "D = ℝ",
      "punktsymmetrisch, dazu <strong>periodisch</strong>: f(x + 2π) = f(x)",
      "x = jπ (j ∈ ℤ) — <strong>unendlich viele</strong>",
      "kein Grenzwert: f schwingt zwischen −2 und 2",
      `H(${bruch("π", "2")} + 2jπ | 2), T(−${bruch("π", "2")} + 2jπ | −2) — unendlich viele`,
      "W(jπ | 0) — an denselben Stellen wie die Nullstellen",
      "W = [−2; 2]",
    ],
  },
];
const VG_TEXTE = [
  "Bei ganzrationalen Funktionen war D immer ℝ — der Schritt fiel kaum auf. Bei ln wird er der erste Schritt, der zählt: Alles Weitere gilt nur für x > 0, grau hinterlegt ist, was nicht dazugehört.",
  "Bei Polynomen entschieden gerade oder ungerade Exponenten. Diese Abkürzung gibt es jetzt nicht mehr: Man setzt −x ein und vergleicht. Neu ist die Periodizität — beim Sinus genügt es, eine Periode zu untersuchen.",
  "Ein Polynom vom Grad n hat höchstens n Nullstellen. Bei x · e^(−x) kommt jede Nullstelle aus dem Faktor x, weil e^(−x) nie null wird; bei x · ln(x) fällt x = 0 weg, weil es nicht in D liegt; der Sinus hat unendlich viele.",
  "Polynome laufen am Rand immer gegen +∞ oder −∞. Jetzt gibt es eine Asymptote (rot), einen Randpunkt, der nicht zum Graphen gehört (offener Kreis), und eine Funktion ganz ohne Grenzwert.",
  "Die Bedingungen sind dieselben wie in Thema 3.1: f′ = 0 und f″ ≠ 0. Aber die Zahl der Extrempunkte ist durch keinen Grad mehr begrenzt — beim Sinus sind es unendlich viele.",
  "Auch hier dieselben Bedingungen. Neu: x · ln(x) hat keinen Wendepunkt, obwohl es kein Polynom zweiten Grades ist — f″(x) = 1/x ist auf ganz D positiv.",
  "Erst jetzt wird gezeichnet. Jeder Graph muss durch seine Punkte gehen und zu Pfeilen, Asymptote, Randpunkt und Schranken passen — das ist die Probe für die ganze Untersuchung.",
];
function renderVergleich() {
  const s = reglerRaster("vg-s");
  setzeAnzeige("vg-s-anzeige", `${s} von 7: ${VG_SCHRITTE[s - 1]}`);
  const bilder = VG.map((d) => {
    const [xmin, xmax] = d.xs;
    const K = koordinatenXY({ breite: 280, hoehe: 200, xmin, xmax, ymin: d.y[0], ymax: d.y[1], panel: d.id });
    panelTitel(K, d.titel);
    if (d.nurPositiv) ausserhalbD(K);
    if (s >= 2 && d.zentrum) punkt(K, 0, 0, "dr-symmetrie", { "data-rolle": "symmetrie", r: 8 });
    if (s >= 3) for (const x of d.nullstellen) punkt(K, x, 0, "dr-schneidet", { "data-rolle": "nullstelle", r: 4 });
    if (s >= 4) {
      const r = d.rand;
      if (r.links) randPfeil(K, "links", r.links);
      if (r.rechts) randPfeil(K, "rechts", r.rechts);
      if (r.asymptote) asymptote(K, r.asymptote.y, r.asymptote.von, xmax, r.asymptote.seite, false);
      if (r.randpunkt) punkt(K, r.randpunkt[0], r.randpunkt[1], "fr-loch", { "data-rolle": "randpunkt", r: 4 });
      if (r.schranke) for (const y of r.schranke) strecke(K, xmin, y, xmax, y, "dr-schranke-l", { "data-rolle": "schranke", "data-y": String(y) });
    }
    if (s >= 5) for (const [x, typ] of d.extrema) punkt(K, x, d.f(x), "dr-extrem", { "data-rolle": "extrem", "data-typ": typ, r: 5 });
    if (s >= 6) for (const [x, typ] of d.wende) punkt(K, x, d.f(x), "dr-wende", { "data-rolle": "wende", "data-typ": typ, r: 5 });
    if (s >= 7) graph(K, d.f, xmin, xmax, { schritte: 500 });
    return K.svg;
  });
  zeige("vg-mount", ...bilder);
  let zeilen = "";
  for (let i = 0; i < s; i++) {
    zeilen += `<tr class="${i + 1 === s ? "aktiv" : ""}" data-schritt="${i + 1}"><th>${i + 1}. ${VG_SCHRITTE[i]}</th>${VG.map((d) => `<td>${d.zeilen[i]}</td>`).join("")}</tr>`;
  }
  setzeHtml("vg-bilanz", `<div class="fr-tabelle-wrap"><table class="vg-tabelle"><tr><th>Schritt</th>${VG.map((d) => `<th>${d.kopf}</th>`).join("")}</tr>${zeilen}</table></div>`);
  setzeText("vg-text", VG_TEXTE[s - 1]);
}

// ================= 2. Die zweite Ableitung von p(x) · e^(kx) =================

// q ist die Klammer von f″: f″(x) = q(x) · e^(kx). Die Prüfung rechnet f″ numerisch nach.
const ZW = {
  a: {
    k: -1, f: (x) => x * Math.exp(-x), d: (x) => (1 - x) * Math.exp(-x), q: (x) => x - 2, nst: [2],
    xs: [-1, 5], y: [-1.5, 0.95], y2: [-4, 3],
    ft: "x · e<sup>−x</sup>", qt: "x − 2",
    f1: "1 · e<sup>−x</sup> + x · (−e<sup>−x</sup>) = (1 − x) · e<sup>−x</sup>",
    f2: "−1 · e<sup>−x</sup> + (1 − x) · (−e<sup>−x</sup>) = (x − 2) · e<sup>−x</sup>",
  },
  b: {
    k: -1, f: (x) => x * x * Math.exp(-x), d: (x) => (2 * x - x * x) * Math.exp(-x), q: (x) => x * x - 4 * x + 2, nst: [2 - Math.SQRT2, 2 + Math.SQRT2],
    xs: [-1, 6], y: [-0.3, 1.45], y2: [-2.5, 4],
    ft: "x² · e<sup>−x</sup>", qt: "x² − 4x + 2",
    f1: "2x · e<sup>−x</sup> + x² · (−e<sup>−x</sup>) = (2x − x²) · e<sup>−x</sup>",
    f2: "(2 − 2x) · e<sup>−x</sup> + (2x − x²) · (−e<sup>−x</sup>) = (x² − 4x + 2) · e<sup>−x</sup>",
  },
  c: {
    k: 1, f: (x) => (1 - x) * Math.exp(x), d: (x) => -x * Math.exp(x), q: (x) => -x - 1, nst: [-1],
    xs: [-4, 1.5], y: [-2.4, 1.9], y2: [-3, 3.2],
    ft: "(1 − x) · e<sup>x</sup>", qt: "−x − 1",
    f1: "−1 · e<sup>x</sup> + (1 − x) · e<sup>x</sup> = −x · e<sup>x</sup>",
    f2: "−1 · e<sup>x</sup> + (−x) · e<sup>x</sup> = (−x − 1) · e<sup>x</sup>",
  },
};
function zwBereich() {
  const d = ZW[wahl("zw-art")];
  setzeBereich("zw-x", d.xs[0], d.xs[1], d.k < 0 ? 1 : -2);
}
function renderZweite() {
  const d = ZW[wahl("zw-art")];
  const x0 = reglerRaster("zw-x");
  setzeAnzeige("zw-x-anzeige", num(x0));
  const ek = (x) => Math.exp(d.k * x);
  const f2 = (x) => d.q(x) * ek(x);
  const [xmin, xmax] = [d.xs[0] - 0.2, d.xs[1] + 0.2];
  const K1 = koordinatenXY({ hoehe: 250, xmin, xmax, ymin: d.y[0], ymax: d.y[1], panel: "f" });
  panelTitel(K1, `f(x) = ${d.ft.replace(/<sup>(.*?)<\/sup>/g, "^($1)")}: violett Links-, orange Rechtskurve`);
  graph(K1, d.f, xmin, xmax, { schritte: 600, klasseVon: kruemmung(f2) });
  const m = d.d(x0), w = f2(x0);
  gerade(K1, m, x0, d.f(x0), "dr-tangente", { "data-rolle": "tangente" });
  punkt(K1, x0, d.f(x0), "fr-punkt", { "data-rolle": "p" });
  if (Math.abs(w) > 1e-9) lenkpfeil(K1, x0, d.f(x0), m, w > 0 ? "links" : "rechts");
  const K2 = koordinatenXY({ hoehe: 210, xmin, xmax, ymin: d.y2[0], ymax: d.y2[1], panel: "a2" });
  panelTitel(K2, `f″ (violett) und die Klammer ${d.qt} (grau)`);
  graph(K2, d.q, xmin, xmax, { schritte: 400, basis: "dr-faktor", rolle: "faktor" });
  graph(K2, f2, xmin, xmax, { schritte: 600, basis: "dr-ableitung2", rolle: "ableitung2" });
  for (const n of d.nst) punkt(K2, n, 0, "dr-wende", { "data-rolle": "nullstelle-f2", r: 5 });
  punkt(K2, x0, d.q(x0), "dr-punkt-q", { "data-rolle": "p-q", r: 4 });
  punkt(K2, x0, w, "dr-wende", { "data-rolle": "p-a2", r: 4 });
  zeige("zw-mount", K1.svg, K2.svg);
  const qw = d.q(x0), e0 = ek(x0);
  const art = Math.abs(w) < 1e-12 ? "f″(x₀) = 0" : w > 0 ? "<strong>Linkskurve</strong>" : "<strong>Rechtskurve</strong>";
  setzeHtml("zw-bilanz",
    `f(x) = ${d.ft}<br>f′(x) = ${d.f1}<br>f″(x) = ${d.f2}<br>` +
    `x₀ = ${num(x0)}: Klammer ${d.qt} = <span class="${qw > 0 ? "wr" : qw < 0 ? "wo" : ""}">${num(qw)}</span>, ` +
    `${ePot(d.k).replace("x</sup>", "x₀</sup>")} ${gleich(e0)} &gt; 0, ` +
    `f″(x₀) ${gleich(w)} — ${art}.`);
  const naheNull = d.nst.some((n) => Math.abs(n - x0) < 0.13);
  setzeText("zw-text", naheNull
    ? "Hier ist die Klammer fast null — in der Nähe wechselt sie ihr Vorzeichen, und mit ihr f″: eine Wendestelle. Der e-Faktor spielt dabei keine Rolle; er streckt f″ nur, ohne das Vorzeichen zu ändern."
    : w > 0
      ? "Die Klammer ist positiv, der e-Faktor sowieso — also ist f″(x₀) > 0: Linkskurve. Vergleiche unten: Wo die graue Klammer über der Achse liegt, liegt auch f″ darüber."
      : "Die Klammer ist negativ, der e-Faktor positiv — also ist f″(x₀) < 0: Rechtskurve. Unten liegen graue Klammer und violettes f″ auf derselben Seite der Achse.");
}

// ================= 3. Vollständige Untersuchung =================

const SR2 = Math.SQRT2;
const SC = {
  a: {
    f: (x) => x * Math.exp(-x), xs: [-1, 6], y: [-1.5, 0.65], sy: 0,
    rand: { links: "unten", asymptote: { y: 0, von: 3.5, bis: 6, seite: "rechts" } },
    nullstellen: [[0, 1]], extrema: [[1, "H"]], wende: [[2, "W"]],
    mono: [[-Infinity, 1, "steigt"], [1, Infinity, "faellt"]],
    kruemm: [[-Infinity, 2, "rechts"], [2, Infinity, "links"]],
    texte: [
      "D = ℝ. f(−x) = −x · e<sup>x</sup> ist weder f(x) noch −f(x): keine Symmetrie. Die Abkürzung „nur gerade Exponenten“ aus Thema 3.1 gibt es hier nicht — man setzt −x ein und vergleicht.",
      "x → −∞: x → −∞ und e<sup>−x</sup> → +∞, also f(x) → −∞. x → +∞: e<sup>−x</sup> → 0 setzt sich gegen x durch (Thema 2.2), f(x) → 0: <strong>waagerechte Asymptote y = 0</strong> für x → +∞.",
      "f(0) = 0 · e<sup>0</sup> = 0: S<sub>y</sub>(0 | 0).",
      "x · e<sup>−x</sup> = 0 ⟺ x = 0, denn e<sup>−x</sup> &gt; 0. Einzige Nullstelle 0 (einfach).",
      "f′(x) = (1 − x) · e<sup>−x</sup> = 0 ⟺ x = 1. f″(x) = (x − 2) · e<sup>−x</sup>, f″(1) = −e<sup>−1</sup> &lt; 0: H(1 | e<sup>−1</sup>) ≈ H(1 | 0,3679).",
      "f″(x) = 0 ⟺ x = 2; die Klammer x − 2 wechselt dort das Vorzeichen, e<sup>−x</sup> nicht: W(2 | 2e<sup>−2</sup>) ≈ W(2 | 0,2707).",
      "f steigt für x &lt; 1, fällt für x &gt; 1. Rechtskurve für x &lt; 2, Linkskurve für x &gt; 2 — nach dem Wendepunkt schmiegt sich der Graph an die Asymptote an.",
      "Graph durch alle Punkte, Wertemenge W = ]−∞; e<sup>−1</sup>]. Der Hochpunkt ist das globale Maximum.",
    ],
  },
  b: {
    f: (x) => x * x * Math.exp(-x), xs: [-1.2, 8], y: [-0.3, 1.1], sy: 0,
    rand: { links: "oben", asymptote: { y: 0, von: 5.5, bis: 8, seite: "rechts" } },
    nullstellen: [[0, 2]], extrema: [[0, "T"], [2, "H"]], wende: [[2 - SR2, "W"], [2 + SR2, "W"]],
    mono: [[-Infinity, 0, "faellt"], [0, 2, "steigt"], [2, Infinity, "faellt"]],
    kruemm: [[-Infinity, 2 - SR2, "links"], [2 - SR2, 2 + SR2, "rechts"], [2 + SR2, Infinity, "links"]],
    texte: [
      "D = ℝ. f(−x) = x² · e<sup>x</sup> ≠ ±f(x): keine Symmetrie, obwohl x² gerade ist — der Faktor e<sup>−x</sup> zerstört sie.",
      "x → −∞: x² → +∞ und e<sup>−x</sup> → +∞, also f(x) → +∞. x → +∞: e<sup>−x</sup> setzt sich gegen x² durch, f(x) → 0: <strong>Asymptote y = 0</strong> für x → +∞.",
      "f(0) = 0: S<sub>y</sub>(0 | 0).",
      "x² · e<sup>−x</sup> = 0 ⟺ x² = 0: Nullstelle 0, doppelt — der Graph berührt die x-Achse.",
      "f′(x) = (2x − x²) · e<sup>−x</sup> = x(2 − x) · e<sup>−x</sup> = 0 ⟺ x = 0 oder x = 2. f″(x) = (x² − 4x + 2) · e<sup>−x</sup>: f″(0) = 2 &gt; 0: T(0 | 0); f″(2) = −2e<sup>−2</sup> &lt; 0: H(2 | 4e<sup>−2</sup>) ≈ H(2 | 0,5413).",
      "x² − 4x + 2 = 0 ⟺ x = 2 ± √2, beides einfache Nullstellen der Klammer: W₁(2 − √2 | …) ≈ W₁(0,5858 | 0,191), W₂(2 + √2 | …) ≈ W₂(3,4142 | 0,3835).",
      "f fällt für x &lt; 0 und für x &gt; 2, steigt für 0 &lt; x &lt; 2. Linkskurve für x &lt; 2 − √2 und für x &gt; 2 + √2, Rechtskurve dazwischen.",
      "Graph durch alle Punkte, Wertemenge W = [0; ∞[. Der Hochpunkt ist nur ein lokales Maximum — links wird f beliebig groß.",
    ],
  },
  c: {
    f: (x) => (1 - x) * Math.exp(x), xs: [-5, 1.6], y: [-1.6, 1.35], sy: 1,
    rand: { rechts: "unten", asymptote: { y: 0, von: -5, bis: -3, seite: "links" } },
    nullstellen: [[1, 1]], extrema: [[0, "H"]], wende: [[-1, "W"]],
    mono: [[-Infinity, 0, "steigt"], [0, Infinity, "faellt"]],
    kruemm: [[-Infinity, -1, "links"], [-1, Infinity, "rechts"]],
    texte: [
      "D = ℝ. f(−x) = (1 + x) · e<sup>−x</sup> ≠ ±f(x): keine Symmetrie.",
      "x → −∞: 1 − x → +∞, aber e<sup>x</sup> → 0 setzt sich durch: f(x) → 0, <strong>Asymptote y = 0</strong> — diesmal links. x → +∞: 1 − x → −∞ und e<sup>x</sup> → +∞, also f(x) → −∞.",
      "f(0) = 1 · e<sup>0</sup> = 1: S<sub>y</sub>(0 | 1).",
      "(1 − x) · e<sup>x</sup> = 0 ⟺ x = 1 (einfach).",
      "f′(x) = −x · e<sup>x</sup> = 0 ⟺ x = 0. f″(x) = (−x − 1) · e<sup>x</sup>, f″(0) = −1 &lt; 0: H(0 | 1).",
      "f″(x) = 0 ⟺ x = −1, die Klammer −x − 1 wechselt dort das Vorzeichen: W(−1 | 2e<sup>−1</sup>) ≈ W(−1 | 0,7358).",
      "f steigt für x &lt; 0, fällt für x &gt; 0. Linkskurve für x &lt; −1, Rechtskurve für x &gt; −1.",
      "Graph durch alle Punkte, Wertemenge W = ]−∞; 1]. Links nähert sich der Graph der Asymptote von oben, ohne sie zu erreichen: f(x) &gt; 0 für alle x &lt; 1.",
    ],
  },
};
const SC_TITEL = ["Definitionsmenge und Symmetrie", "Verhalten für x → ±∞ und Asymptote", "Schnittpunkt mit der y-Achse", "Nullstellen",
  "Extrempunkte", "Wendepunkte", "Monotonie und Krümmung", "Graph und Wertemenge"];
function renderSchema() {
  const d = SC[wahl("sc-art")];
  const s = reglerRaster("sc-s");
  setzeAnzeige("sc-s-anzeige", `${s} von 8`);
  const [xmin, xmax] = d.xs;
  const K = koordinatenXY({ hoehe: 330, xmin, xmax, ymin: d.y[0], ymax: d.y[1] });
  if (s >= 2) {
    if (d.rand.links) randPfeil(K, "links", d.rand.links);
    if (d.rand.rechts) randPfeil(K, "rechts", d.rand.rechts);
    const a = d.rand.asymptote;
    asymptote(K, a.y, a.von, a.bis, a.seite);
  }
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
    // T(0 | 0) bei x² · e^(−x) liegt auf der Achse — die Beschriftung darunter würde die Zahlen der
    // x-Achse treffen, deshalb dort links daneben.
    beschrift(K, x, d.f(x), typ, "dr-text-b", typ === "H" ? { dy: -10 } : { dx: -12, dy: 16 });
  }
  if (s >= 6) for (const [x, typ] of d.wende) {
    punkt(K, x, d.f(x), "dr-wende", { "data-rolle": "wende", "data-typ": typ, r: 6 });
    beschrift(K, x, d.f(x), typ, "dr-text-v", { dx: 12, dy: 16 });
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
    "Noch ist kein Punkt gezeichnet. Die Symmetrieprüfung geht schnell — und fällt bei e-Funktionen fast immer negativ aus.",
    "Neu gegenüber Thema 3.1: Auf einer Seite läuft der Graph nicht ins Unendliche, sondern nähert sich der roten Asymptote. Auf der anderen zeigt ein Pfeil, wohin er läuft.",
    "Der erste Punkt: f(0) ist einfach der Polynomfaktor bei 0, weil e⁰ = 1 ist.",
    "Die Nullstellen kommen nur aus dem Polynomfaktor — der e-Faktor ist nie null.",
    "Hoch- und Tiefpunkte: Klammer von f′ null setzen, Art mit f″ oder Vorzeichenwechsel bestimmen.",
    "Wendepunkte: Klammer von f″ null setzen. Auch hier zählt nur die Klammer.",
    "Die Bänder fassen zusammen: oben steigt (grün) und fällt (orange), darunter Linkskurve (violett) und Rechtskurve (orange).",
    "Erst jetzt wird der Graph gezeichnet — er muss durch alle Punkte gehen und zu Pfeil, Asymptote und Bändern passen.",
  ];
  setzeText("sc-text", hinweise[s - 1]);
}

// ================= 4. Funktionenscharen mit e =================

const SA_WERTE = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
const saF = (k) => (x) => x * Math.exp(-k * x);
function renderScharen() {
  const k = reglerRaster("sa-k");
  const ort = document.getElementById("sa-ort").checked;
  setzeAnzeige("sa-k-anzeige", num(k));
  const xmin = -0.5, xmax = 8.5;
  const K = koordinatenXY({ hoehe: 300, xmin, xmax, ymin: -0.6, ymax: 1.7 });
  for (const kk of SA_WERTE) if (kk !== k) graph(K, saF(kk), xmin, xmax, { schritte: 300, basis: "dr-schar", rolle: "schar" });
  const f = saF(k), d2 = (x) => k * (k * x - 2) * Math.exp(-k * x);
  graph(K, f, xmin, xmax, { schritte: 600, klasseVon: kruemmung(d2) });
  if (ort) {
    strecke(K, 0, 0, xmax, xmax / E, "dr-ortskurve", { "data-rolle": "ortskurve-h", "data-steigung": String(1 / E) });
    strecke(K, 0, 0, xmax, xmax / (E * E), "dr-ortskurve zwei", { "data-rolle": "ortskurve-w", "data-steigung": String(1 / (E * E)) });
    beschrift(K, 4.4, 4.4 / E, "y = x/e", "dr-text-r", { dx: -10, dy: -10, anker: "end" });
    beschrift(K, 7.4, 7.4 / (E * E), "y = x/e²", "dr-text-v", { dy: 18 });
  }
  const xh = 1 / k, xw = 2 / k;
  punkt(K, xh, f(xh), "dr-extrem", { "data-rolle": "extrem", "data-typ": "H", r: 6 });
  beschrift(K, xh, f(xh), "H", "dr-text-b", { dy: -10 });
  punkt(K, xw, f(xw), "dr-wende", { "data-rolle": "wende", "data-typ": "W", r: 6 });
  beschrift(K, xw, f(xw), "W", "dr-text-v", { dx: 12, dy: -8 });
  zeige("sa-mount", K.svg);
  const yh = f(xh), yw = f(xw);
  setzeHtml("sa-bilanz",
    `f<sub>k</sub>′(x) = (1 − kx) · e<sup>−kx</sup>, &nbsp;f<sub>k</sub>″(x) = k(kx − 2) · e<sup>−kx</sup><br>` +
    `k = ${num(k)}: H(${bruch("1", "k")} | ${bruch("1", "k · e")}) = H(${num(xh)} | <span class="wc">${num(yh)}</span>)${zeichen(xh) === "≈" ? " (gerundet)" : ""}, ` +
    `W(${bruch("2", "k")} | ${bruch("2", "k · e²")}) = W(${num(xw)} | <span class="wr">${num(yw)}</span>)<br>` +
    `Probe Ortskurven: y<sub>H</sub> : x<sub>H</sub> ${gleich(yh / xh)} = e<sup>−1</sup>, &nbsp;y<sub>W</sub> : x<sub>W</sub> ${gleich(yw / xw)} = e<sup>−2</sup> — für jedes k dasselbe.`);
  setzeText("sa-text", ort
    ? "Alle Hochpunkte liegen auf der roten Geraden y = x/e, alle Wendepunkte auf der violetten y = x/e². Mit wachsendem k rücken beide Punkte auf ihren Geraden zum Ursprung."
    : k < 1
      ? "Kleines k: Die e-Funktion bremst spät, der Graph steigt lange und hoch. Hoch- und Wendepunkt liegen weit rechts."
      : "Großes k: Die e-Funktion bremst früh, der Graph bleibt flach. Schalte die Ortskurven ein: Die Punkte wandern nicht beliebig.");
}

// ================= 5. Wachstumsmodelle =================

// Logistisch mit u(t) = 9 · e^(−0,4t): f = 100/(1 + u), f′ = 40u/(1 + u)², f″ = 16u(u − 1)/(1 + u)³.
const uLog = (t) => 9 * Math.exp(-0.4 * t);
const WA = {
  exp: {
    f: (t) => 5 * Math.exp(0.15 * t), d: (t) => 0.75 * Math.exp(0.15 * t), d2: (t) => 0.1125 * Math.exp(0.15 * t),
    ft: "5 · e<sup>0,15t</sup>", dt: "0,75 · e<sup>0,15t</sup>", d2t: "0,1125 · e<sup>0,15t</sup>", S: null,
  },
  beschr: {
    f: (t) => 100 - 90 * Math.exp(-0.2 * t), d: (t) => 18 * Math.exp(-0.2 * t), d2: (t) => -3.6 * Math.exp(-0.2 * t),
    ft: "100 − 90 · e<sup>−0,2t</sup>", dt: "18 · e<sup>−0,2t</sup>", d2t: "−3,6 · e<sup>−0,2t</sup>", S: 100, rateMax: [0, "rand"],
  },
  log: {
    f: (t) => 100 / (1 + uLog(t)), d: (t) => (40 * uLog(t)) / (1 + uLog(t)) ** 2, d2: (t) => (16 * uLog(t) * (uLog(t) - 1)) / (1 + uLog(t)) ** 3,
    ft: `${bruch("100", "1 + 9 · e<sup>−0,4t</sup>")}`, dt: `${bruch("40u", "(1 + u)²")}`, d2t: `${bruch("16u · (u − 1)", "(1 + u)³")} mit u = 9 · e<sup>−0,4t</sup>`, S: 100,
    tw: Math.log(9) / 0.4,
  },
};
WA.log.rateMax = [WA.log.tw, "innen"];
function renderWachstum() {
  const art = wahl("wa-art"), d = WA[art];
  const t0 = reglerRaster("wa-t");
  setzeAnzeige("wa-t-anzeige", num(t0));
  const xmin = -0.5, xmax = 20.5;
  const K1 = koordinatenXY({ hoehe: 260, xmin, xmax, ymin: -5, ymax: 124, xName: "t", yName: "f", panel: "f" });
  panelTitel(K1, "Bestand f(t): violett Links-, orange Rechtskurve");
  if (d.S !== null) {
    strecke(K1, xmin, d.S, xmax, d.S, "dr-asymptote", { "data-rolle": "schranke", "data-y": String(d.S) });
    beschrift(K1, xmax, d.S, `S = ${d.S}`, "dr-text-r", { dx: -30, dy: 14 });
  }
  graph(K1, d.f, 0, 20, { schritte: 500, klasseVon: kruemmung(d.d2) });
  if (d.tw) {
    punkt(K1, d.tw, d.f(d.tw), "dr-wende", { "data-rolle": "wende", "data-typ": "W", r: 6 });
    beschrift(K1, d.tw, d.f(d.tw), "W", "dr-text-v", { dx: 12, dy: 14 });
  }
  gerade(K1, d.d(t0), t0, d.f(t0), "dr-tangente", { "data-rolle": "tangente" });
  punkt(K1, t0, d.f(t0), "fr-punkt", { "data-rolle": "p" });
  const K2 = koordinatenXY({ hoehe: 200, xmin, xmax, ymin: -1, ymax: 19.5, xName: "t", yName: "f′", panel: "a" });
  panelTitel(K2, "Wachstumsrate f′(t)");
  graph(K2, d.d, 0, 20, { schritte: 500, basis: "dr-ableitung", rolle: "ableitung" });
  if (d.rateMax) {
    const [tm, wo] = d.rateMax;
    punkt(K2, tm, d.d(tm), "dr-extrem", { "data-rolle": "rate-max", "data-art": wo, r: 6 });
  }
  punkt(K2, t0, d.d(t0), "dr-punkt-t", { "data-rolle": "p-a" });
  zeige("wa-mount", K1.svg, K2.svg);
  const w = d.d2(t0);
  let zeile3 = "";
  if (art === "log") zeile3 = `<br>Wendestelle t<sub>W</sub> = ${bruch("ln 9", "0,4")} ${gleich(d.tw)}: f(t<sub>W</sub>) ${gleich(d.f(d.tw))}, f′(t<sub>W</sub>) ${gleich(d.d(d.tw))} — die größte Rate.`;
  else if (art === "beschr") zeile3 = "<br>f″ ist überall negativ: Die Rate ist bei t = 0 am größten (18) und nimmt dann ab. Kein Wendepunkt.";
  else zeile3 = "<br>f″ ist überall positiv: Die Rate wächst ohne Ende. Kein Wendepunkt, keine größte Rate.";
  setzeHtml("wa-bilanz",
    `f(t) = ${d.ft}, &nbsp;f′(t) = ${d.dt}, &nbsp;f″(t) = ${d.d2t}<br>` +
    `t₀ = ${num(t0)}: f(t₀) ${gleich(d.f(t0))}, f′(t₀) <span class="wa">${gleich(d.d(t0))}</span>, ` +
    `f″(t₀) <span class="${w > 0 ? "wr" : "wo"}">${gleich(w)}</span> — die Rate ${Math.abs(w) < 1e-9 ? "ist hier am größten" : w > 0 ? "wächst" : "nimmt ab"}.` + zeile3);
  const texte = {
    exp: "Exponentielles Wachstum: Je größer der Bestand, desto schneller wächst er. Der Graph ist überall eine Linkskurve — das Modell taugt nur für den Anfang, irgendwann fehlt der Platz.",
    beschr: "Beschränktes Wachstum: Die Rate ist proportional zum Abstand von S = 100. Am Anfang ist der Abstand am größten — danach wird das Wachstum immer langsamer, der Graph ist überall eine Rechtskurve.",
    log: t0 < d.tw
      ? "Logistisches Wachstum, erste Phase: Linkskurve, die Rate wächst — fast wie exponentiell. Schiebe t₀ über den violetten Wendepunkt."
      : "Logistisches Wachstum, zweite Phase: Nach dem Wendepunkt ist der Graph eine Rechtskurve, die Rate nimmt ab — fast wie beschränkt. Am Wendepunkt war genau die Hälfte von S erreicht.",
  };
  setzeText("wa-text", texte[art]);
}

// ================= 6. Extremwertprobleme =================

// Für das Kosinus-Rechteck hat A′(u) = 0 keine Lösungsformel: Die Stelle wird mit dem Newton-Verfahren
// für g(u) = cos u − u · sin u bestimmt — genau so, wie die Seite es vorrechnet.
const NEWTON_COS = (() => {
  const g = (u) => Math.cos(u) - u * Math.sin(u), dg = (u) => -2 * Math.sin(u) - u * Math.cos(u);
  const folge = [1];
  for (let i = 0; i < 30; i++) folge.push(folge[folge.length - 1] - g(folge[folge.length - 1]) / dg(folge[folge.length - 1]));
  return folge;
})();
const OP = {
  exp: {
    f: (x) => 2 * Math.exp(-0.5 * x), A: (u) => 2 * u * Math.exp(-0.5 * u), dA: (u) => (2 - u) * Math.exp(-0.5 * u),
    uopt: 2, sym: false, xs: [-0.3, 6.5], y: [-0.2, 2.25], ya: [-0.1, 1.7], regler: [0.25, 6, 0.25, 1],
    At: "u · 2e<sup>−0,5u</sup>", dAt: "(2 − u) · e<sup>−0,5u</sup>",
  },
  cos: {
    f: Math.cos, A: (u) => 2 * u * Math.cos(u), dA: (u) => 2 * Math.cos(u) - 2 * u * Math.sin(u),
    uopt: NEWTON_COS[NEWTON_COS.length - 1], sym: true, xs: [-1.8, 1.8], y: [-0.2, 1.25], ya: [-0.1, 1.3], regler: [0.05, 1.5, 0.05, 0.5],
    At: "2u · cos(u)", dAt: "2 cos(u) − 2u · sin(u)",
  },
};
function opBereich() {
  const [min, max, step, start] = OP[wahl("op-art")].regler;
  const e = document.getElementById("op-u");
  e.step = String(step);
  setzeBereich("op-u", min, max, start);
}
function renderOptimierung() {
  const art = wahl("op-art"), d = OP[art];
  const u = reglerRaster("op-u");
  setzeAnzeige("op-u-anzeige", num(u));
  const [xmin, xmax] = d.xs;
  const K1 = koordinatenXY({ hoehe: 240, xmin, xmax, ymin: d.y[0], ymax: d.y[1], panel: "f" });
  panelTitel(K1, art === "exp" ? "f(x) = 2 · e^(−0,5x) und das Rechteck" : "f(x) = cos(x) und das Rechteck");
  rechteck(K1, d.sym ? -u : 0, 0, u, d.f(u), "dr-flaeche", { "data-rolle": "rechteck" });
  graph(K1, d.f, xmin, xmax, { schritte: 500 });
  punkt(K1, u, d.f(u), "fr-punkt", { "data-rolle": "ecke" });
  const ax = art === "exp" ? [-0.3, 6.5] : [-0.1, 1.65];
  const K2 = koordinatenXY({ hoehe: 200, xmin: ax[0], xmax: ax[1], ymin: d.ya[0], ymax: d.ya[1], xName: "u", yName: "A", panel: "a" });
  panelTitel(K2, `Zielfunktion A(u) = ${art === "exp" ? "2u · e^(−0,5u)" : "2u · cos(u)"}`);
  graph(K2, d.A, Math.max(0, ax[0]), art === "exp" ? ax[1] : PI / 2, { schritte: 500, basis: "dr-ziel", rolle: "zielfunktion" });
  punkt(K2, d.uopt, d.A(d.uopt), "dr-extrem", { "data-rolle": "maximum", r: 6 });
  punkt(K2, u, d.A(u), "dr-punkt-t", { "data-rolle": "p-a" });
  zeige("op-mount", K1.svg, K2.svg);
  const a1 = d.dA(u);
  let html = `A(u) = ${d.At}, &nbsp;A′(u) = ${d.dAt}<br>` +
    `u = ${num(u)}: A(u) <span class="wa">${gleich(d.A(u))}</span>, A′(u) ${gleich(a1)} — ` +
    (Math.abs(a1) < 1e-9 ? "hier ist das Maximum." : a1 > 0 ? "positiv: Ein größeres u lohnt sich noch." : "negativ: u ist schon zu groß.") + "<br>";
  if (art === "exp") html += `Maximum bei u = 2: A(2) = 4e<sup>−1</sup> ${gleich(d.A(2))}.`;
  else html += `Newton für g(u) = cos u − u · sin u, u₀ = 1: u₁ ${gleich(NEWTON_COS[1])}, u₂ ${gleich(NEWTON_COS[2])}, u₃ ${gleich(NEWTON_COS[3])} — Maximum bei u ${gleich(d.uopt)} mit A ${gleich(d.A(d.uopt))}.`;
  setzeHtml("op-bilanz", html);
  setzeText("op-text", art === "exp"
    ? "A′(u) = (2 − u) · e^(−0,5u): Der e-Faktor ist nie null, also genügt 2 − u = 0. Links von 2 wächst A, rechts davon fällt es — ein Rand gibt es nur bei 0, und dort ist A = 0."
    : "A′(u) = 0 heißt cos u = u · sin u — eine Gleichung, die sich nicht nach u auflösen lässt. Das Newton-Verfahren aus Thema 3.1 findet die Stelle in drei Schritten auf vier Stellen genau.");
}

// ================= 7. Sinus und Kosinus (LK) =================

const TR = { f: (x) => x + 2 * Math.sin(x), d: (x) => 1 + 2 * Math.cos(x), d2: (x) => -2 * Math.sin(x) };
const TR_FENSTER = {
  eins: { a: 0, b: 2 * PI, y: [-0.5, 7], k: [0, 24] },
  drei: { a: -2 * PI, b: 4 * PI, y: [-8.5, 15], k: [-24, 48] },
};
function trBereich() {
  const w = TR_FENSTER[wahl("tr-fenster")];
  setzeBereich("tr-k", w.k[0], w.k[1], 8);
}
// Alle Punkte der Form start + j · abstand, die echt im Inneren von ]a; b[ liegen.
function gitter(start, abstand, a, b) {
  const aus = [];
  for (let j = Math.ceil((a - start) / abstand - 1e-9); start + j * abstand < b - 1e-9; j++) {
    const x = start + j * abstand;
    if (x > a + 1e-9) aus.push(x);
  }
  return aus;
}
function renderTrig() {
  const w = TR_FENSTER[wahl("tr-fenster")];
  const k = reglerRaster("tr-k");
  const x0 = (k * PI) / 12;
  setzeAnzeige("tr-k-anzeige", k === 0 ? "0" : `${piText(k)} ≈ ${num(x0, 3)}`);
  const xmin = w.a - 0.2, xmax = w.b + 0.2;
  const K1 = koordinatenXY({ hoehe: 280, xmin, xmax, ymin: w.y[0], ymax: w.y[1], panel: "f" });
  panelTitel(K1, "f(x) = x + 2 sin(x): violett Linkskurve, orange Rechtskurve");
  const hs = gitter((2 * PI) / 3, 2 * PI, w.a, w.b), ts = gitter((4 * PI) / 3, 2 * PI, w.a, w.b), ws = gitter(0, PI, w.a, w.b);
  if (wahl("tr-fenster") === "drei") {
    // Die besonderen Punkte liegen auf drei parallelen Geraden — das macht die unendliche Liste übersichtlich.
    gerade(K1, 1, 0, W3, "dr-leitgerade", { "data-rolle": "leitgerade", "data-art": "H" });
    gerade(K1, 1, 0, -W3, "dr-leitgerade", { "data-rolle": "leitgerade", "data-art": "T" });
    gerade(K1, 1, 0, 0, "dr-leitgerade w", { "data-rolle": "leitgerade", "data-art": "W" });
  }
  graph(K1, TR.f, xmin, xmax, { schritte: 900, klasseVon: kruemmung(TR.d2) });
  for (const x of hs) { punkt(K1, x, TR.f(x), "dr-extrem", { "data-rolle": "extrem", "data-typ": "H", r: 6 }); beschrift(K1, x, TR.f(x), "H", "dr-text-b", { dy: -10 }); }
  for (const x of ts) { punkt(K1, x, TR.f(x), "dr-extrem", { "data-rolle": "extrem", "data-typ": "T", r: 6 }); beschrift(K1, x, TR.f(x), "T", "dr-text-b", { dy: 20 }); }
  for (const x of ws) { punkt(K1, x, TR.f(x), "dr-wende", { "data-rolle": "wende", "data-typ": "W", r: 6 }); beschrift(K1, x, TR.f(x), "W", "dr-text-v", { dx: 12, dy: -8 }); }
  gerade(K1, TR.d(x0), x0, TR.f(x0), "dr-tangente", { "data-rolle": "tangente" });
  punkt(K1, x0, TR.f(x0), "fr-punkt", { "data-rolle": "p" });
  const K2 = koordinatenXY({ hoehe: 190, xmin, xmax, ymin: -1.5, ymax: 3.5, panel: "a" });
  panelTitel(K2, "f′(x) = 1 + 2 cos(x)");
  graph(K2, TR.d, xmin, xmax, { schritte: 700, basis: "fr-linie", rolle: "ableitung", klasseVon: (x, y) => (y > 0 ? "positiv" : "negativ") });
  for (const xn of [...hs, ...ts]) punkt(K2, xn, 0, "dr-schneidet", { "data-rolle": "nullstelle-ableitung", r: 4 });
  punkt(K2, x0, TR.d(x0), "dr-punkt-t", { "data-rolle": "p-a" });
  zeige("tr-mount", K1.svg, K2.svg);
  const m = TR.d(x0), w2 = TR.d2(x0);
  setzeHtml("tr-bilanz",
    `x₀ = ${piText(k)}${k ? ` ≈ ${num(x0, 4)}` : ""}: f(x₀) ${gleich(TR.f(x0))}, f′(x₀) = 1 + 2 cos(x₀) ${gleich(m)}, f″(x₀) = −2 sin(x₀) ${gleich(w2)}<br>` +
    `${Math.abs(m) < 1e-9 ? "waagerechte Tangente" : m > 0 ? "f steigt" : "f fällt"}; ${Math.abs(w2) < 1e-9 ? "f″(x₀) = 0" : w2 > 0 ? "Linkskurve" : "Rechtskurve"}.<br>` +
    `Im Ausschnitt: ${hs.length} Hochpunkte, ${ts.length} Tiefpunkte, ${ws.length} Wendepunkte.`);
  // Die Stelle innerhalb einer Periode (k mod 24) entscheidet, was hier passiert.
  const r = ((k % 24) + 24) % 24;
  const besondere = { 0: "Hier ist f″ = 0 und sin wechselt das Vorzeichen — im Inneren eines Ausschnitts ist das ein Wendepunkt mit der Steigung f′ = 3, der steilste Anstieg.", 8: "Bei 2π/3 + 2jπ: f′ = 0 und f″ = −√3 < 0 — ein Hochpunkt, auf der Geraden y = x + √3.", 12: "Bei π + 2jπ: f″ = 0 und f‴ = 2 ≠ 0 — ein Wendepunkt mit Steigung −1. Hier fällt f am stärksten.", 16: "Bei 4π/3 + 2jπ: f′ = 0 und f″ = √3 > 0 — ein Tiefpunkt, auf der Geraden y = x − √3." };
  setzeText("tr-text", besondere[r] || (m > 0
    ? "Hier steigt die Gerade x schneller, als die Schwingung 2 sin(x) fällt: f steigt."
    : "Hier fällt 2 sin(x) schneller, als x steigt: f fällt — zwischen Hoch- und Tiefpunkt."));
}

// ================= 8. Gedämpfte Schwingung (LK) =================

function renderSchwingung() {
  const d = reglerRaster("sw-d");
  setzeAnzeige("sw-d-anzeige", num(d));
  const f = (x) => Math.exp(-d * x) * Math.sin(x);
  const xmin = -0.2, xmax = 4 * PI + 0.3;
  const K = koordinatenXY({ hoehe: 280, xmin, xmax, ymin: -1.15, ymax: 1.15 });
  graph(K, (x) => Math.exp(-d * x), xmin, xmax, { schritte: 300, basis: "dr-huelle", rolle: "huelle-oben" });
  graph(K, (x) => -Math.exp(-d * x), xmin, xmax, { schritte: 300, basis: "dr-huelle", rolle: "huelle-unten" });
  graph(K, f, xmin, xmax, { schritte: 800 });
  // Extremstellen: tan(x) = 1/d, also x = tan⁻¹(1/d) + jπ; bei d = 0 ist cos(x) = 0, x = π/2 + jπ.
  const x1 = d > 0 ? Math.atan(1 / d) : PI / 2;
  const extrema = [0, 1, 2, 3].map((j) => [x1 + j * PI, j % 2 === 0 ? "H" : "T"]);
  for (let j = 0; j < 4; j++) {
    const xb = PI / 2 + j * PI, yb = (j % 2 === 0 ? 1 : -1) * Math.exp(-d * xb);
    punkt(K, xb, yb, "dr-ring", { "data-rolle": "beruehr", r: 6 });
  }
  for (const [x, typ] of extrema) {
    punkt(K, x, f(x), "dr-extrem", { "data-rolle": "extrem", "data-typ": typ, r: 5 });
    beschrift(K, x, f(x), typ, "dr-text-b", { dx: -10, dy: typ === "H" ? -8 : 18 });
  }
  zeige("sw-mount", K.svg);
  const fx1 = f(x1);
  const dt = num(d);
  setzeHtml("sw-bilanz",
    `f(x) = e<sup>−${dt}x</sup> · sin(x), &nbsp;f′(x) = e<sup>−${dt}x</sup> · (cos(x) − ${dt} · sin(x))<br>` +
    (d > 0
      ? `f′(x) = 0 ⟺ tan(x) = ${bruch("1", dt)} ${gleich(1 / d)} ⟺ x = tan⁻¹(${num(1 / d)}) + jπ<br>`
      : "d = 0: f′(x) = cos(x) = 0 ⟺ x = π/2 + jπ<br>") +
    `Hochpunkt bei x₁ ${gleich(x1)} mit f(x₁) <span class="wc">${gleich(fx1)}</span>, Tiefpunkt bei x₁ + π ${gleich(x1 + PI)}; ` +
    `Berührpunkt mit der Hüllkurve bei ${bruch("π", "2")} ≈ 1,5708 — ${d > 0 ? `der Hochpunkt liegt ${num(PI / 2 - x1)} weiter links` : "dieselbe Stelle"}.<br>` +
    `Höhenverhältnis zweier Hochpunkte: e<sup>−2π · ${dt}</sup> ${gleich(Math.exp(-2 * PI * d))}.`);
  setzeText("sw-text", d === 0
    ? "Ohne Dämpfung ist f = sin: Hochpunkte und Berührpunkte (rote Ringe) fallen zusammen. Schiebe d nach rechts."
    : d < 0.21
      ? "Mit Dämpfung rutschen die Hochpunkte (blau) links neben die Berührpunkte mit der Hüllkurve (rote Ringe): Dort, wo sin(x) = 1 ist, fällt die Hüllkurve schon wieder."
      : "Starke Dämpfung: Die Hochpunkte liegen deutlich vor den Berührpunkten, und jeder Hochpunkt ist nur noch ein Bruchteil des vorigen. Der Abstand der Extremstellen bleibt trotzdem π.");
}

// ================= 9. Funktionen mit ln (LK) =================

const LN = {
  xlnx: {
    f: (x) => (x > 0 ? x * Math.log(x) : NaN), d: (x) => Math.log(x) + 1, d2: (x) => 1 / x,
    xs: [-0.4, 3.2], y: [-0.7, 3.8], regler: [0.1, 3, 0.1, 1], nurPositiv: true,
    nullstellen: [1], extrema: [[1 / E, "T"]], wende: [], randpunkt: [0, 0],
    ft: "x · ln(x)", dt: "ln(x) + 1", d2t: bruch("1", "x"),
  },
  lnxx: {
    f: (x) => (x > 0 ? Math.log(x) / x : NaN), d: (x) => (1 - Math.log(x)) / (x * x), d2: (x) => (2 * Math.log(x) - 3) / x ** 3,
    xs: [-0.5, 12], y: [-1.25, 0.55], regler: [0.5, 12, 0.25, 1], nurPositiv: true,
    nullstellen: [1], extrema: [[E, "H"]], wende: [[Math.exp(1.5), "W"]], senkrecht: 0, waagerecht: { y: 0, von: 7 },
    ft: bruch("ln(x)", "x"), dt: bruch("1 − ln(x)", "x²"), d2t: bruch("2 ln(x) − 3", "x³"),
  },
  lnq: {
    f: (x) => Math.log(x * x + 1), d: (x) => (2 * x) / (x * x + 1), d2: (x) => (2 - 2 * x * x) / (x * x + 1) ** 2,
    xs: [-3.3, 3.3], y: [-0.5, 2.7], regler: [-3, 3, 0.25, 1], nurPositiv: false,
    nullstellen: [0], extrema: [[0, "T"]], wende: [[-1, "W"], [1, "W"]],
    ft: "ln(x² + 1)", dt: bruch("2x", "x² + 1"), d2t: bruch("2 − 2x²", "(x² + 1)²"),
  },
};
function lnBereich() {
  const [min, max, step, start] = LN[wahl("ln-art")].regler;
  document.getElementById("ln-x").step = String(step);
  setzeBereich("ln-x", min, max, start);
}
function renderLn() {
  const art = wahl("ln-art"), d = LN[art];
  const x0 = reglerRaster("ln-x");
  setzeAnzeige("ln-x-anzeige", num(x0));
  const [xmin, xmax] = d.xs;
  const K = koordinatenXY({ hoehe: 300, xmin, xmax, ymin: d.y[0], ymax: d.y[1] });
  if (d.nurPositiv) ausserhalbD(K);
  if (d.senkrecht !== undefined) strecke(K, 0, d.y[0], 0, d.y[1], "dr-asymptote", { "data-rolle": "asymptote-senkrecht", "data-x": "0" });
  if (d.waagerecht) asymptote(K, d.waagerecht.y, d.waagerecht.von, xmax, "rechts");
  graph(K, d.f, xmin, xmax, { schritte: 900, klasseVon: kruemmung(d.d2) });
  if (d.randpunkt) punkt(K, d.randpunkt[0], d.randpunkt[1], "fr-loch", { "data-rolle": "randpunkt", r: 5 });
  for (const x of d.nullstellen) punkt(K, x, 0, "dr-schneidet", { "data-rolle": "nullstelle", r: 4 });
  for (const [x, typ] of d.extrema) { punkt(K, x, d.f(x), "dr-extrem", { "data-rolle": "extrem", "data-typ": typ, r: 6 }); beschrift(K, x, d.f(x), typ, "dr-text-b", typ === "H" ? { dy: -10 } : { dx: 12, dy: 16 }); }
  for (const [x, typ] of d.wende) { punkt(K, x, d.f(x), "dr-wende", { "data-rolle": "wende", "data-typ": typ, r: 6 }); beschrift(K, x, d.f(x), typ, "dr-text-v", { dx: 12, dy: 16 }); }
  gerade(K, d.d(x0), x0, d.f(x0), "dr-tangente", { "data-rolle": "tangente" });
  punkt(K, x0, d.f(x0), "fr-punkt", { "data-rolle": "p" });
  zeige("ln-mount", K.svg);
  const w = d.d2(x0);
  setzeHtml("ln-bilanz",
    `f(x) = ${d.ft}, &nbsp;f′(x) = ${d.dt}, &nbsp;f″(x) = ${d.d2t}<br>` +
    `x₀ = ${num(x0)}: f(x₀) ${gleich(d.f(x0))}, f′(x₀) <span class="wa">${gleich(d.d(x0))}</span>, ` +
    `f″(x₀) <span class="${w > 0 ? "wr" : "wo"}">${gleich(w)}</span> — ${Math.abs(w) < 1e-9 ? "f″ ist hier 0" : w > 0 ? "Linkskurve" : "Rechtskurve"}.`);
  const texte = {
    xlnx: x0 <= 0.2
      ? "Ganz nah am Rand von D: f(x₀) ist fast 0, die Tangente fast senkrecht nach unten. Den Punkt (0 | 0) erreicht der Graph nie — er gehört nicht zu D."
      : "f″(x) = 1/x ist auf ganz D positiv: überall Linkskurve, kein Wendepunkt. Der Tiefpunkt liegt bei x = 1/e ≈ 0,3679.",
    lnxx: x0 < 1
      ? "Links von 1 ist ln(x) negativ: f(x) < 0, und für x → 0⁺ fällt der Graph an der senkrechten Asymptote x = 0 ins Bodenlose."
      : x0 < Math.exp(1.5)
        ? "Zwischen Hochpunkt und Wendepunkt: f fällt schon, ist aber noch eine Rechtskurve. Für x → ∞ geht f gegen 0, denn ln(x) wächst langsamer als x."
        : "Rechts vom Wendepunkt bei e^1,5 ≈ 4,48: Linkskurve, der Graph schmiegt sich von oben an die Asymptote y = 0.",
    lnq: "ln(x² + 1) ist achsensymmetrisch, weil x nur als x² vorkommt — wie bei einem Polynom mit geraden Exponenten. Zwischen den Wendestellen ±1 Linkskurve, außen Rechtskurve: Der Graph wächst immer langsamer.",
  };
  setzeText("ln-text", texte[art]);
}

// ================= 10. Die Gaußsche Glockenkurve (LK) =================

function renderGlocke() {
  const s = reglerRaster("gk-s");
  setzeAnzeige("gk-s-anzeige", num(s));
  const f = (x) => Math.exp((-x * x) / (2 * s * s));
  const d2 = (x) => ((x * x - s * s) / s ** 4) * f(x);
  const xmin = -5.2, xmax = 5.2;
  const K = koordinatenXY({ hoehe: 280, xmin, xmax, ymin: -0.12, ymax: 1.2 });
  const yw = Math.exp(-0.5), m = yw / s;
  gerade(K, -m, s, yw, "dr-wendetangente", { "data-rolle": "wendetangente" });
  gerade(K, m, -s, yw, "dr-wendetangente", { "data-rolle": "wendetangente" });
  graph(K, f, xmin, xmax, { schritte: 700, klasseVon: kruemmung(d2) });
  punkt(K, 0, 1, "dr-extrem", { "data-rolle": "extrem", "data-typ": "H", r: 6 });
  for (const x of [-s, s]) punkt(K, x, yw, "dr-wende", { "data-rolle": "wende", "data-typ": "W", r: 6 });
  for (const x of [-2 * s, 2 * s]) punkt(K, x, 0, "dr-schneidet", { "data-rolle": "tangente-nullstelle", r: 4 });
  beschrift(K, s, yw, "W₂", "dr-text-v", { dx: 16, dy: -6, anker: "start" });
  beschrift(K, -s, yw, "W₁", "dr-text-v", { dx: -16, dy: -6, anker: "end" });
  zeige("gk-mount", K.svg);
  const c = 2 * s * s;
  setzeHtml("gk-bilanz",
    `σ = ${num(s)}: f(x) = e<sup>−x²/${num(c)}</sup>, &nbsp;f′(x) = −${bruch("x", num(s * s))} · f(x), &nbsp;f″(x) = ${bruch(`x² − ${num(s * s)}`, num(s ** 4))} · f(x)<br>` +
    `H(0 | 1); W(±${num(s)} | e<sup>−0,5</sup>) ≈ W(±${num(s)} | <span class="wr">${num(yw)}</span>)<br>` +
    `Wendetangente bei ${num(s)}: Steigung −${bruch("1", num(s))} · e<sup>−0,5</sup> ${gleich(-m)}; sie schneidet die x-Achse bei 2σ = ${num(2 * s)}.`);
  setzeText("gk-text", s < 1
    ? "Kleines σ: schmale, steile Glocke. Die Wendepunkte liegen nah an der Mitte — aber auf derselben Höhe e^(−0,5) ≈ 0,6065 wie bei jedem σ."
    : s > 1.5
      ? "Großes σ: breite, flache Flanken. Zwischen den Wendepunkten ±σ ist der Graph eine Rechtskurve, außerhalb eine Linkskurve, die sich an die Asymptote y = 0 schmiegt."
      : "Die Wendestellen sind ±σ, die Wendetangenten treffen die x-Achse bei ±2σ. Die Höhe der Wendepunkte hängt nicht von σ ab.");
}

// ================= 11. Stolperstelle: das Fenster =================

const ST = {
  f: (x) => x ** 3 * Math.exp(-0.2 * x),
  // f′ = x²(3 − 0,2x)e^(−0,2x), f″ = 0,04x(x² − 30x + 150)e^(−0,2x): Sattelpunkt 0, Hochpunkt 15,
  // Wendestellen 15 ± 5√3.
  punkte: [[0, "S", "wende"], [15 - 5 * W3, "W", "wende"], [15, "H", "extrem"], [15 + 5 * W3, "W", "wende"]],
};
function renderStolperstelle() {
  const r = reglerRaster("st-r");
  setzeAnzeige("st-r-anzeige", num(r));
  const xmin = -2, xmax = r;
  // f steigt auf [−2; 15] und fällt danach: Das Maximum im Fenster liegt bei min(r, 15), das Minimum bei −2.
  const ymax = ST.f(Math.min(r, 15)), ymin = ST.f(-2);
  // Wie ein Rechner mit „Zoom anpassen“: etwas Luft über dem größten und unter dem kleinsten Wert.
  const yu = ymin - 0.04 * (ymax - ymin), yo = ymax * 1.15;
  const K = koordinatenXY({ hoehe: 300, xmin, xmax, ymin: yu, ymax: yo });
  graph(K, ST.f, xmin, xmax, { schritte: 800 });
  const sichtbar = ST.punkte.filter(([x]) => x < r - 1e-9);
  for (const [x, typ, rolle] of sichtbar) {
    punkt(K, x, ST.f(x), rolle === "extrem" ? "dr-extrem" : "dr-wende", { "data-rolle": rolle, "data-typ": typ, r: 6 });
    beschrift(K, x, ST.f(x), typ, rolle === "extrem" ? "dr-text-b" : "dr-text-v", typ === "H" ? { dy: -10 } : { dx: -12, dy: -8 });
  }
  if (r >= 30) asymptote(K, 0, 30, r, "rechts");
  zeige("st-mount", K.svg);
  const namen = { S: "Sattelpunkt S(0 | 0)", W1: `W₁(${num(15 - 5 * W3)} | ${num(ST.f(15 - 5 * W3))})`, H: `H(15 | ${num(ST.f(15))})`, W2: `W₂(${num(15 + 5 * W3)} | ${num(ST.f(15 + 5 * W3))})` };
  const liste = [namen.S, namen.W1, namen.H, namen.W2];
  setzeHtml("st-bilanz",
    `Fenster: −2 ≤ x ≤ ${num(r)}, &nbsp;${num(yu, 2)} ≤ y ≤ ${num(yo, 2)} (gerundet)<br>` +
    `Im Fenster zu sehen: ${sichtbar.length ? liste.slice(0, sichtbar.length).join(", ") : "kein besonderer Punkt"}.<br>` +
    `Die Rechnung findet: ${liste.join(", ")} und für x → ∞ die Asymptote y = 0.`);
  setzeText("st-text", r < 15
    ? "In diesem Fenster sieht f aus wie eine Funktion dritten Grades, die immer weiter steigt. Ohne Rechnung würde man schließen: kein Hochpunkt, f → ∞. Beides ist falsch."
    : r < 24
      ? "Erst ab x = 15 zeigt sich der Hochpunkt: Jetzt setzt sich die e-Funktion gegen x³ durch. Der zweite Wendepunkt liegt noch außerhalb."
      : r < 30
        ? "Nach dem zweiten Wendepunkt ist der Graph wieder eine Linkskurve — er fällt immer flacher und nähert sich der x-Achse."
        : "Jetzt ist alles im Bild: Sattelpunkt, zwei Wendepunkte, Hochpunkt und die Asymptote y = 0. Gefunden hat sie die Rechnung — das Fenster nur bestätigt.");
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
  "quiz-vergleich": {
    q: "Warum hat f(x) = (x² − 4) · e<sup>0,5x</sup> genau zwei Nullstellen?",
    options: ["Weil x² − 4 den Grad 2 hat — eine Funktion vom Grad 2 hat höchstens zwei Nullstellen.", "Weil e<sup>0,5x</sup> nie null wird; es bleiben nur die Lösungen von x² − 4 = 0, also ±2.", "Weil e<sup>0,5x</sup> bei x = 0 null wird und x² − 4 dort nicht.", "Sie hat drei: ±2 und die Stelle, an der e<sup>0,5x</sup> = 0 ist."],
    correct: 1,
    explain: "Satz vom Nullprodukt: Ein Produkt ist genau dann null, wenn ein Faktor null ist. e<sup>0,5x</sup> ist immer positiv (bei x = 0 ist es 1), also kommen alle Nullstellen aus x² − 4. Die Begründung über den Grad trägt nicht: f ist kein Polynom — x² · sin(x) etwa hat unendlich viele Nullstellen, obwohl x² den Grad 2 hat.",
  },
  "quiz-zweite": {
    q: "Wie lautet f″(x) für f(x) = x · e<sup>2x</sup>?",
    options: ["(4x + 4) · e<sup>2x</sup>", "(2x + 1) · e<sup>2x</sup>", "4x · e<sup>2x</sup>", "(4x + 2) · e<sup>2x</sup>"],
    correct: 0,
    explain: "Mit p(x) = x und k = 2: p″ + 2k · p′ + k² · p = 0 + 4 + 4x. Zu Fuß: f′(x) = e<sup>2x</sup> + x · 2e<sup>2x</sup> = (2x + 1) · e<sup>2x</sup> — das ist erst f′ —, dann f″(x) = 2 · e<sup>2x</sup> + (2x + 1) · 2e<sup>2x</sup> = (4x + 4) · e<sup>2x</sup>. 4x · e<sup>2x</sup> entsteht, wenn man nur e<sup>2x</sup> zweimal ableitet und den Faktor x stehen lässt.",
  },
  "quiz-schema": {
    q: "Wie verhält sich f(x) = (x − 3) · e<sup>x</sup> für x → −∞?",
    options: ["f(x) → −∞, weil x − 3 → −∞ geht.", "f(x) → 0 von oben: Der Graph liegt links über der Asymptote.", "f(x) → 0 von unten: Asymptote y = 0, und für x &lt; 3 ist f(x) &lt; 0.", "Es gibt keinen Grenzwert, weil die beiden Faktoren gegeneinander arbeiten."],
    correct: 2,
    explain: "e<sup>x</sup> → 0 setzt sich gegen den Faktor x − 3 durch (Thema 2.2), also f(x) → 0: Asymptote y = 0. Das Vorzeichen bestimmt der Polynomfaktor: Für x &lt; 3 ist x − 3 &lt; 0 und e<sup>x</sup> &gt; 0, also liegt der Graph unterhalb der Asymptote. Dass zwei Faktoren gegeneinander arbeiten, verhindert keinen Grenzwert — es entscheidet, wer sich durchsetzt.",
  },
  "quiz-scharen": {
    q: "Auf welcher Kurve liegen die Tiefpunkte der Schar f<sub>a</sub>(x) = e<sup>x</sup> − a · x (a &gt; 0)?",
    options: ["y = a − a · ln(a)", "x = ln(a)", "y = e<sup>x</sup> − x", "y = (1 − x) · e<sup>x</sup>"],
    correct: 3,
    explain: "f<sub>a</sub>′(x) = e<sup>x</sup> − a = 0 ⟺ x = ln(a); f<sub>a</sub>″(x) = e<sup>x</sup> &gt; 0: Tiefpunkt T(ln a | a − a · ln a). Aus x = ln a folgt a = e<sup>x</sup>, eingesetzt y = e<sup>x</sup> − x · e<sup>x</sup> = (1 − x) · e<sup>x</sup>. „y = a − a · ln(a)“ enthält noch den Parameter, „x = ln(a)“ ist nur die x-Koordinate.",
  },
  "quiz-wachstum": {
    q: "Ein logistisch wachsender Bestand hat die Sättigungsgrenze S = 800. Bei welchem Bestand wächst er am schnellsten?",
    options: ["bei 400", "bei 800", "am Anfang, beim kleinsten Bestand", "bei 600"],
    correct: 0,
    explain: "Am Wendepunkt des logistischen Wachstums ist f = S/2 — hier 400. Davor ist der Graph eine Linkskurve (die Rate wächst), danach eine Rechtskurve (die Rate fällt). Am Anfang am schnellsten wächst ein beschränkt wachsender Bestand, nicht ein logistischer; 800 wird nie erreicht.",
  },
  "quiz-optimierung": {
    q: "Warum genügt es bei A′(u) = (2 − u) · e<sup>−0,5u</sup> = 0, die Gleichung 2 − u = 0 zu lösen?",
    options: ["Weil man durch u teilen darf.", "Weil e<sup>−0,5u</sup> für große u fast 0 ist und man es weglassen kann.", "Weil e<sup>−0,5u</sup> für jedes u positiv ist — ein Produkt ist nur null, wenn ein Faktor null ist.", "Weil man beide Seiten logarithmieren kann."],
    correct: 2,
    explain: "Satz vom Nullprodukt: e<sup>−0,5u</sup> ist nie null, also muss 2 − u = 0 sein. „Fast 0“ ist nicht 0 — ein Faktor, der nur klein ist, macht das Produkt nicht null. Logarithmieren geht nicht, weil die rechte Seite 0 ist und ln(0) nicht existiert.",
  },
  "quiz-trig": {
    q: "Warum hat f(x) = x + 2 sin(x) an der Stelle π einen Wendepunkt?",
    options: ["Weil f′(π) = 0 ist.", "Weil f″(π) = −2 sin(π) = 0 und f‴(π) = −2 cos(π) = 2 ≠ 0 ist.", "Weil sin(π) = 0 ist und f deshalb bei π eine Nullstelle hat.", "Weil π die Mitte des Intervalls [0; 2π] ist."],
    correct: 1,
    explain: "Notwendige und hinreichende Bedingung zusammen: f″(π) = 0 und f‴(π) ≠ 0. Dagegen ist f′(π) = 1 + 2 cos(π) = −1, nicht 0, und f(π) = π ist keine Nullstelle. Die Lage in der Intervallmitte ist Zufall — Wendepunkte gibt es bei jedem Vielfachen von π.",
  },
  "quiz-schwingung": {
    q: "In welchem Abstand liegen benachbarte Extremstellen von f(x) = e<sup>−0,1x</sup> · sin(x)?",
    options: ["2π — die Periode des Sinus", "π/2", "Der Abstand wird immer größer, weil die Schwingung abklingt.", "π — die Periode des Tangens"],
    correct: 3,
    explain: "f′(x) = 0 ⟺ tan(x) = 10, und der Tangens hat die Periode π: x = tan⁻¹(10) + jπ. Benachbarte Extremstellen liegen also π auseinander, abwechselnd Hoch- und Tiefpunkt. 2π ist der Abstand zweier Hochpunkte. Die Dämpfung verkleinert die Höhen, nicht die Abstände.",
  },
  "quiz-ln": {
    q: "Welche Definitionsmenge hat f(x) = ln(x² − 4)?",
    options: ["D = ℝ", "D = ]2; ∞[", "D = {x | x &lt; −2 oder x &gt; 2}", "D = ]0; ∞["],
    correct: 2,
    explain: "ln ist nur für positive Zahlen definiert, also muss x² − 4 &gt; 0 sein, d. h. x² &gt; 4. Das gilt für x &gt; 2 und für x &lt; −2 — die negative Seite vergisst man leicht. D = ]0; ∞[ wäre richtig für ln(x), aber hier steht x² − 4 im Logarithmus.",
  },
  "quiz-glocke": {
    q: "Wo liegen die Wendestellen von f(x) = e<sup>−x²/8</sup>?",
    options: ["bei ±2", "bei ±8", "bei ±4", "bei ±√8"],
    correct: 0,
    explain: "Vergleich mit e<sup>−x²/(2σ²)</sup>: 2σ² = 8, also σ² = 4 und σ = 2. Die Wendestellen liegen bei ±σ = ±2. Zur Probe: f″(x) = <span class=\"bruch\"><span class=\"z\">x² − 4</span><span class=\"n\">16</span></span> · f(x) ist bei ±2 null und wechselt dort das Vorzeichen.",
  },
  "quiz-stolperstelle": {
    q: "Auf dem Rechner sieht f(x) = x⁴ · e<sup>−0,1x</sup> im Fenster [−5; 5] für x &gt; 0 nur steigend aus. Was folgt daraus?",
    options: ["f hat für x &gt; 0 keinen Hochpunkt.", "Nichts Sicheres — f′(x) = x³ · (4 − 0,1x) · e<sup>−0,1x</sup> zeigt einen Hochpunkt bei x = 40.", "f(x) → ∞ für x → ∞.", "Ein doppelt so großes Fenster würde den Hochpunkt zeigen."],
    correct: 1,
    explain: "Erst die Rechnung bestimmt das nötige Fenster: f′(x) = 4x³ · e<sup>−0,1x</sup> − 0,1x⁴ · e<sup>−0,1x</sup> = x³ · (4 − 0,1x) · e<sup>−0,1x</sup> = 0 ⟺ x = 0 oder x = 40. Bei 40 wechselt f′ von + nach −: Hochpunkt. Danach fällt f gegen 0 — „f → ∞“ ist falsch, und ein Fenster bis 10 zeigt den Hochpunkt noch lange nicht.",
  },
};

// ================= Selbsteinschätzung =================
//
// Die Auswahl liegt nur im Browser dieser Person — eine Lernhilfe, keine Leistungsmessung.
const SE_PUNKTE = [
  ["sec-vergleich", "Ich kann Schritt für Schritt sagen, was sich bei e-, ln- und Winkelfunktionen gegenüber ganzrationalen Funktionen ändert."],
  ["sec-zweite", "Ich kann f″ von p(x) · e<sup>kx</sup> bilden und sein Vorzeichen an der Klammer ablesen."],
  ["sec-schema", "Ich kann eine Funktion mit e vollständig untersuchen, einschließlich der Asymptote."],
  ["sec-scharen", "Ich kann eine Funktionenschar mit e untersuchen und eine Ortskurve bestimmen."],
  ["sec-wachstum", "Ich kann bei einem Wachstumsmodell sagen, wann der Bestand am schnellsten wächst."],
  ["sec-optimierung", "Ich kann ein Extremwertproblem mit e lösen und weiß, was zu tun ist, wenn sich A′(u) = 0 nicht auflösen lässt."],
  ["sec-trig", "(LK) Ich kann Funktionen mit Sinus und Kosinus untersuchen und finde alle Lösungen von cos(x) = c im Intervall."],
  ["sec-schwingung", "(LK) Ich kann die Extremstellen einer gedämpften Schwingung mit tan(x) = c bestimmen."],
  ["sec-ln", "(LK) Ich kann Funktionen mit ln untersuchen, einschließlich Definitionsmenge und Verhalten am Rand."],
  ["sec-glocke", "(LK) Ich kann die Wendestellen der Glockenkurve herleiten."],
  ["sec-stolperstelle", "Ich weiß, warum man ein Rechnerfenster erst nach der Rechnung wählt."],
];
const SE_SCHLUESSEL = "uplant-mss11-weitere-funktionen-untersuchen-selbsteinschaetzung";

function leseSE() {
  try { return JSON.parse(localStorage.getItem(SE_SCHLUESSEL) || "{}"); } catch { return {}; }
}
function schreibeSE(d) {
  try { localStorage.setItem(SE_SCHLUESSEL, JSON.stringify(d)); } catch { /* ohne Speicher geht es auch */ }
}
// Die Überschrift ohne die Kursmarke — „2. Die zweite Ableitung von p(x) · e^kx“, nicht „… GK + LK“.
function titelOhneMarke(id) {
  const h = document.querySelector(`#${id} h2`).cloneNode(true);
  h.querySelectorAll(".kurs-marke").forEach((m) => m.remove());
  return h.textContent.trim();
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
  else if (unsicher.length) aus.innerHTML = `Wiederhole zuerst: ${unsicher.map(([id]) => `<a href="#${id}">${titelOhneMarke(id)}</a>`).join(", ")}. Danach passen die Übungsaufgaben auf den Stufen „einfach“ und „mittel“.`;
  else aus.textContent = `${sicher} von ${SE_PUNKTE.length} Punkten sicher — probier dich an den Aufgaben auf den Stufen „schwierig“ und „komplex“.`;
}

// ================= Start =================

// Wählt man eine andere Funktion, bekommt der Regler den Bereich dieser Funktion — vor dem Zeichnen,
// sonst stünde er kurz auf einer Stelle außerhalb des Bildes.
const BEREICHE = { "zw-art": zwBereich, "op-art": opBereich, "tr-fenster": trBereich, "ln-art": lnBereich };
const REGLER = [
  [["vg-s"], renderVergleich],
  [["zw-art", "zw-x"], renderZweite],
  [["sc-art", "sc-s"], renderSchema],
  [["sa-k", "sa-ort"], renderScharen],
  [["wa-art", "wa-t"], renderWachstum],
  [["op-art", "op-u"], renderOptimierung],
  [["tr-fenster", "tr-k"], renderTrig],
  [["sw-d"], renderSchwingung],
  [["ln-art", "ln-x"], renderLn],
  [["gk-s"], renderGlocke],
  [["st-r"], renderStolperstelle],
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
