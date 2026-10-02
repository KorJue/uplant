// Selbstlernpfad „Differentialrechnung“ (MSS 11, Analysis, Thema 3). Vanilla-JS, kein Build.
//
// Didaktische Reihenfolge — jede Stufe benutzt nur, was davor steht:
//    1. Mittlere Änderungsrate          (Steigung einer Geraden, Steigungsdreieck: Mittelstufe)
//    2. Lokale Änderungsrate            (Sekante PQ mit x → x₀: Grenzwert aus Thema 2; Wert nur vermutet)
//    3. Ableitung an einer Stelle       (Differentialquotient lim (f(x) − f(x₀))/(x − x₀), lokale Linearität)
//
// Schreibweise wie in Elemente der Mathematik: zuerst die x₀-Methode, weil sie das Steigungsdreieck
// zwischen P und Q sichtbar hält; die h-Methode (x = x₀ + h) steht jeweils in einem Reiter daneben.
//    4. Grafisches Differenzieren        (Tangentensteigung aus 3 an jeder Stelle → Funktion f′)
//    5. Ableitungsfunktion, Potenzregel (erst f′(3), dann f′(x₀), dann f′; Faktor x − x₀ abspalten)
//    6. Faktor- und Summenregel         (Grenzwertsätze aus Thema 1/2; braucht 5 für g′)
//    7. Sinus und Kosinus               (Einheitskreis, Bogenmaß; 4 hat die Vermutung geliefert)
//    8. Produkt- und Kettenregel        (dieselbe Flächenidee wie 5; Verstärkungsfaktor)
//    9. Tangente, Normale, Winkel       (f′ aus 3–7; tan⁻¹ aus der Trigonometrie; m · m_n = −1 wird
//                                         hier erst durch Drehen gezeigt)
//   10. Differenzierbarkeit             (einseitige Grenzwerte aus Thema 2, Knick aus 3)
//   11. Ganzrationale Funktionen        (Verhalten für x → ±∞ mit Grenzwerten aus Thema 2; Symmetrie)
//   12. Nullstellen, Vielfachheit       (Faktorisieren, pq-Formel; Ableitungskasten braucht 8)
//   13. f und f′: Monotonie, Extrema    (braucht 4–6 für f′ und 12 für die Nullstellen von f′)
//   14. Stolperstelle Tangente          (Tangente aus 9, doppelte Nullstelle aus 12)
//
// Gerechnet wird mit Reglerwerten, nie mit Bildschirmkoordinaten. Die Prüfung liest die
// Zeichnungen aus dem SVG zurück (Maßstab aus den Gitterlinien mit data-wert) und rechnet nach.
//
// Farbcodierung: Graph f blau, Sekante orange, Tangente und f′ grün, Steigungsdreieck und
// Normale violett, Warnung (Knick, keine Ableitung) rot, Hilfslinien grau.

import { mountUebungsaufgaben } from "../../../aufgaben.js?v=2";
import { AUFGABEN, parseZahl } from "./aufgaben-differentialrechnung.js?v=2";

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
// Reiter (x₀-Methode / h-Methode): Die Wahl steht am Reiter-Element als data-aktiv.
function reiterWahl(name) {
  const r = document.querySelector(`.reiter[data-reiter="${name}"]`);
  return (r && r.dataset.aktiv) || "x";
}
function verdrahteReiter(beiWechsel) {
  document.querySelectorAll(".reiter").forEach((r) => {
    r.dataset.aktiv = "x";
    r.querySelectorAll(".reiter-leiste button").forEach((b) => {
      b.addEventListener("click", () => {
        r.dataset.aktiv = b.dataset.wahl;
        r.querySelectorAll(".reiter-leiste button").forEach((x) => x.setAttribute("aria-selected", String(x === b)));
        r.querySelectorAll(".reiter-feld").forEach((f) => { f.hidden = f.dataset.feld !== b.dataset.wahl; });
        beiWechsel(r.dataset.reiter);
      });
    });
  });
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

// Die Funktionen, die auf mehreren Bühnen auftreten — samt Ableitung, damit Tangente und f′ aus
// derselben Quelle kommen.
const FN = {
  para: { f: (x) => x * x, d: (x) => 2 * x },
  kubik: { f: (x) => 0.5 * x ** 3 - 1.5 * x, d: (x) => 1.5 * x * x - 1.5 },
  quartik: { f: (x) => 0.5 * x ** 4 - x * x + 0.5, d: (x) => 2 * x ** 3 - 2 * x },
  sinus: { f: Math.sin, d: Math.cos },
  wurzel: { f: Math.sqrt, d: (x) => 0.5 / Math.sqrt(x) },
  fall: { f: (t) => 5 * t * t, d: (t) => 10 * t },
  sattel: { f: (x) => 0.25 * x ** 4 - x ** 3, d: (x) => x ** 3 - 3 * x * x },
};

// ================= 1. Mittlere Änderungsrate =================

const MR = {
  fall: { fn: FN.fall, lo: 0, hi: 4, ymin: 0, ymax: 85, v: "t", w: "s", xName: "t in s", yName: "s in m", start: [1, 3], extrema: [] },
  para: { fn: FN.para, lo: -2, hi: 3, ymin: -1, ymax: 9.5, v: "x", w: "f", xName: "x", yName: "y", start: [1, 2], extrema: [0] },
  kubik: { fn: FN.kubik, lo: -2.5, hi: 2.5, ymin: -4.5, ymax: 4.5, v: "x", w: "f", xName: "x", yName: "y", start: [-2, 2], extrema: [-1, 1] },
};
function mrBereich() {
  const d = MR[wahl("mr-art")];
  setzeBereich("mr-a", d.lo, d.hi - 0.5, d.start[0]);
  setzeBereich("mr-b", d.lo + 0.5, d.hi, d.start[1]);
}
function renderMittlere() {
  const art = wahl("mr-art");
  const d = MR[art];
  const fall = art === "fall";
  const a = reglerRaster("mr-a");
  // b liegt immer rechts von a — sonst wäre [a; b] kein Intervall.
  const b = begrenzt("mr-b", reglerRaster("mr-b"), a + 0.5, d.hi);
  const fa = d.fn.f(a), fb = d.fn.f(b), m = (fb - fa) / (b - a);
  setzeAnzeige("mr-a-anzeige", num(a) + (fall ? " s" : ""));
  setzeAnzeige("mr-b-anzeige", num(b) + (fall ? " s" : ""));
  const K = koordinatenXY({ xmin: d.lo, xmax: d.hi, ymin: d.ymin, ymax: d.ymax, xName: d.xName, yName: d.yName });
  graph(K, d.fn.f, d.lo, d.hi);
  gerade(K, m, a, fa, "dr-sekante", { "data-rolle": "sekante" });
  vieleck(K, [[a, fa], [b, fa], [b, fb]], "dr-dreieck-flaeche", { "data-rolle": "dreieck" });
  strecke(K, a, fa, b, fa, "dr-dreieck dx", { "data-rolle": "dx", "data-wert": String(b - a) });
  strecke(K, b, fa, b, fb, "dr-dreieck", { "data-rolle": "dy", "data-wert": String(fb - fa) });
  punkt(K, a, fa, "fr-punkt dr-punkt-q", { "data-rolle": "punkt-a" });
  punkt(K, b, fb, "fr-punkt dr-punkt-q", { "data-rolle": "punkt-b" });
  beschrift(K, a, fa, "A", "dr-text-o", { dx: -10, dy: -8 });
  beschrift(K, b, fb, "B", "dr-text-o", { dx: -10, dy: -8 });
  const einheitX = fall ? " s" : "", einheitY = fall ? " m" : "";
  // Δx unter die waagerechte Kathete, Δy neben die senkrechte — auf der Seite, auf der Platz ist.
  beschrift(K, (a + b) / 2, fa, `Δ${d.v} = ${num(b - a)}${einheitX}`, "dr-text-k", { dy: fb >= fa ? 16 : -8 });
  const rechtsFrei = K.X(b) + 120 < K.breite;
  beschrift(K, b, (fa + fb) / 2, `Δ${d.w === "s" ? "s" : "y"} = ${num(fb - fa)}${einheitY}`, "dr-text-v", { dx: rechtsFrei ? 8 : -8, dy: 4, anker: rechtsFrei ? "start" : "end" });
  zeige("mr-mount", K.svg);

  const z = zeichen(m);
  if (fall) {
    setzeHtml("mr-bilanz",
      `Durchschnittsgeschwindigkeit = ${bruch("s(b) − s(a)", "b − a")} = ${bruch(`${num(fb)} m − ${num(fa)} m`, `${num(b)} s − ${num(a)} s`)} = ${bruch(`${num(fb - fa)} m`, `${num(b - a)} s`)} ${z} <span class="wo">${num(m)} m/s</span>`);
    setzeText("mr-text", `Zwischen ${num(a)} s und ${num(b)} s fällt der Stein im Mittel ${num(m)} Meter pro Sekunde. Schiebe das Intervall nach rechts: Bei gleicher Länge wächst die Durchschnittsgeschwindigkeit — der Stein wird immer schneller. Wie schnell er in einem bestimmten Augenblick ist, sagt der Mittelwert nicht.`);
    return;
  }
  setzeHtml("mr-bilanz",
    `mittlere Änderungsrate = ${bruch(`f(${num(b)}) − f(${num(a)})`, `${num(b)} − ${numK(a)}`)} = ${bruch(`${num(fb)} − ${numK(fa)}`, num(b - a))} ${z} <span class="wo">${num(m)}</span> — die Steigung der Sekante durch A und B.`);
  const gemischt = d.extrema.some((e) => a < e && e < b);
  const richtung = Math.abs(m) < 1e-12 ? "Im Mittel ändert sich f in diesem Intervall gar nicht: f(a) = f(b)." :
    m > 0 ? `Im Mittel wächst f pro Einheit um ${num(m)}.` : `Im Mittel nimmt f pro Einheit um ${num(-m)} ab.`;
  setzeText("mr-text", richtung + (gemischt ? " Achtung: Zwischen a und b steigt f und fällt f auch — die mittlere Änderungsrate verwischt das. Sie vergleicht nur Anfang und Ende." : " Zwischen a und b läuft f nur in eine Richtung."));
}

// ================= 2. Lokale Änderungsrate =================

const LR = {
  para: { fn: FN.para, xs: [-2, 2], start: 1, bild: [-3, 3.5, -1, 10] },
  kubik: { fn: FN.kubik, xs: [-2, 2], start: 1, bild: [-3.2, 3.2, -6, 6] },
  wurzel: { fn: FN.wurzel, xs: [1, 3], start: 1, bild: [0, 4.5, -0.3, 2.5] },
};
const H_LR = [-1, -0.5, -0.1, -0.01, -0.001, 0.001, 0.01, 0.1, 0.5, 1];
function lrBereich() {
  const d = LR[wahl("lr-art")];
  setzeBereich("lr-x", d.xs[0], d.xs[1], d.start);
}
const dq = (f, x0, h) => (f(x0 + h) - f(x0)) / h;
function renderLokal() {
  const d = LR[wahl("lr-art")];
  const x0 = reglerRaster("lr-x");
  const h = H_LR[regler("lr-h")];
  // Derselbe Regler, zwei Schreibweisen: in der x₀-Methode heißt der zweite Punkt Q(x | f(x)),
  // in der h-Methode Q(x₀ + h | f(x₀ + h)). Gerechnet wird in beiden Fällen mit h = x − x₀.
  const mitX = reiterWahl("lr") === "x";
  const x = x0 + h;
  setzeText("lr-h-name", mitX ? "x" : "h");
  setzeAnzeige("lr-x-anzeige", num(x0));
  setzeAnzeige("lr-h-anzeige", mitX ? num(x, 3) : num(h, 3));
  const f = d.fn.f, f0 = f(x0), fq = f(x), q = dq(f, x0, h), m = d.fn.d(x0);
  const [xmin, xmax, ymin, ymax] = d.bild;
  const K = koordinatenXY({ xmin, xmax, ymin, ymax });
  graph(K, f, Math.max(xmin, 0), xmax, { schritte: 500 });
  gerade(K, m, x0, f0, "dr-tangente grenze", { "data-rolle": "tangente" });
  gerade(K, q, x0, f0, "dr-sekante", { "data-rolle": "sekante" });
  // Das Steigungsdreieck der Sekante: Grundseite x − x₀, Höhe f(x) − f(x₀).
  strecke(K, x0, f0, x, f0, "dr-dreieck dx", { "data-rolle": "dx", "data-wert": String(h) });
  strecke(K, x, f0, x, fq, "dr-dreieck", { "data-rolle": "dy", "data-wert": String(fq - f0) });
  punkt(K, x0, f0, "fr-punkt", { "data-rolle": "p" });
  punkt(K, x, fq, "fr-punkt dr-punkt-q", { "data-rolle": "q" });
  beschrift(K, x0, f0, "P", "dr-text-b dr-halo", { dx: -12, dy: -8 });
  // Q liegt bei kleinem Abstand fast auf P — dann bekäme die Beschriftung keinen eigenen Platz.
  // Q steht außen am Dreieck, vom Dreieck weg — so kommt es dem Namen der senkrechten Kathete,
  // der auf derselben Seite auf halber Höhe steht, nicht in die Quere.
  if (Math.abs(h) >= 0.1) beschrift(K, x, fq, "Q", "dr-text-o dr-halo", { dx: h > 0 ? 10 : -10, dy: fq >= f0 ? -8 : 16 });
  // Die Katheten tragen ihre Namen — die Zahlen dazu stehen in der Bilanz darunter. Beschriftet
  // wird nur auf der Außenseite des Dreiecks (innen läuft die Sekante hindurch) und nur, wenn die
  // Kathete lang genug ist: an einer kurzen säße der Name über P oder Q. Passt die Außenseite
  // nicht mehr ins Bild, entfällt der Name lieber, als dass er auf die Sekante rutscht.
  const nameDx = mitX ? "x − x₀" : "h", nameDy = mitX ? "f(x) − f(x₀)" : "f(x₀ + h) − f(x₀)";
  if (Math.abs(K.X(x) - K.X(x0)) >= 70) {
    beschrift(K, (x0 + x) / 2, f0, nameDx, "dr-text-k dr-halo", { dy: fq >= f0 ? 16 : -8 });
  }
  const breiteDy = nameDy.length * 7 + 8;
  const aussenPasst = h > 0 ? K.X(x) + breiteDy < K.breite - 4 : K.X(x) - breiteDy > 4;
  if (Math.abs(K.Y(fq) - K.Y(f0)) >= 40 && aussenPasst) {
    beschrift(K, x, (f0 + fq) / 2, nameDy, "dr-text-v dr-halo", { dx: h > 0 ? 8 : -8, dy: 4, anker: h > 0 ? "start" : "end" });
  }
  zeige("lr-mount", K.svg);

  const kopf = H_LR.map((w) => `<th>${mitX ? num(x0 + w, 3) : num(w, 3)}</th>`).join("");
  const werte = H_LR.map((w) => {
    const v = dq(f, x0, w);
    return `<td data-h="${w}" class="${w === h ? "aktiv" : ""}">${num(v, 6)}</td>`;
  }).join("");
  setzeHtml("lr-tabelle", `<table class="fr-tabelle"><tr><th>${mitX ? "x" : "h"}</th>${kopf}</tr><tr><th>Differenzenquotient</th>${werte}</tr></table>`);
  const genauQ = zeichen(fq, 6) === "=" && zeichen(f0, 6) === "=";
  const formel = mitX
    ? `${bruch(`f(${num(x, 3)}) − f(${num(x0)})`, `${num(x, 3)} − ${numK(x0)}`)}`
    : `${bruch(`f(${num(x0)} ${plusMinus(h, 3)}) − f(${num(x0)})`, num(h, 3))}`;
  setzeHtml("lr-bilanz",
    `${formel} ${genauQ ? "=" : "≈"} ${bruch(`${num(fq, 6)} − ${numK(f0, 6)}`, num(h, 3))} ${zeichen(q, 6)} <span class="wo">${num(q, 6)}</span> — Steigung der Sekante PQ.<br>` +
    `Grenzlage (gestrichelt): Steigung ${zeichen(m)} <span class="wa">${num(m)}</span>; Abstand der Sekantensteigung davon: ${num(Math.abs(q - m), 6)}.`);
  const naeher = mitX ? `Schiebe x näher an x₀ = ${num(x0)}.` : "Verkleinere h.";
  const links = mitX ? `Probiere auch x &lt; x₀: Dann liegt Q links von P.` : `Probiere auch negative h: Dann liegt Q links von P.`;
  setzeText("lr-text", Math.abs(h) >= 0.5
    ? `Q liegt noch weit von P entfernt; die Sekante ist deutlich steiler oder flacher als die gestrichelte Grenzlage. ${naeher}`
    : Math.abs(h) >= 0.1
      ? `Die Sekante dreht sich auf die gestrichelte Gerade zu. ${links.replace("&lt;", "<")}`
      : `Q ist von P kaum noch zu trennen, die Sekante kaum noch von der gestrichelten Geraden. Von links und von rechts nähern sich die Differenzenquotienten derselben Zahl ${num(m)} — das ist die lokale Änderungsrate an der Stelle ${num(x0)}.`);
}

// ================= 3. Die Ableitung: Funktionenmikroskop =================

const FM = {
  para: { fn: FN.para, knick: () => false },
  kubik: { fn: FN.kubik, knick: () => false },
  betrag: {
    fn: { f: (x) => Math.abs(x * x - 1), d: (x) => (x * x > 1 ? 2 * x : -2 * x) },
    // An ±1 hat |x² − 1| einen Knick: links fällt der Graph mit Steigung −2, rechts steigt er mit 2.
    knick: (x) => Math.abs(Math.abs(x) - 1) < 1e-12,
  },
};
const ZOOM = [1, 2, 5, 10, 100, 1000];
function renderMikroskop() {
  const d = FM[wahl("fm-art")];
  const x0 = reglerRaster("fm-x");
  const zoom = ZOOM[regler("fm-z")];
  setzeAnzeige("fm-x-anzeige", num(x0));
  setzeAnzeige("fm-z-anzeige", `${num(zoom)}-fach`);
  const f = d.fn.f, f0 = f(x0);
  // Unverzerrt: Ein Zentimeter nach rechts ist so lang wie einer nach oben, sonst sähe man die
  // Steigung falsch.
  const w = 2 / zoom;
  const [ymin, ymax] = gleichY(x0 - w, x0 + w, f0, 560, 340);
  const K = koordinatenXY({ breite: 560, hoehe: 340, xmin: x0 - w, xmax: x0 + w, ymin, ymax });
  graph(K, f, x0 - w, x0 + w, { schritte: 800 });
  const knick = d.knick(x0);
  let abw = 0;
  if (knick) {
    strecke(K, x0 - w, f0 + 2 * w, x0, f0, "dr-tangente halb", { "data-rolle": "halb-links", "data-steigung": "-2" });
    strecke(K, x0, f0, x0 + w, f0 + 2 * w, "dr-tangente halb", { "data-rolle": "halb-rechts", "data-steigung": "2" });
  } else {
    const m = d.fn.d(x0);
    gerade(K, m, x0, f0, "dr-tangente grenze", { "data-rolle": "tangente" });
    for (let i = 0; i <= 2000; i++) {
      const x = x0 - w + (2 * w * i) / 2000;
      abw = Math.max(abw, Math.abs(f(x) - (f0 + m * (x - x0))));
    }
  }
  punkt(K, x0, f0, "fr-punkt", { "data-rolle": "p", r: 4 });
  zeige("fm-mount", K.svg);
  const fenster = `Fenster: x von ${num(x0 - w, 4)} bis ${num(x0 + w, 4)}, Breite ${num(2 * w, 4)}.`;
  if (knick) {
    setzeHtml("fm-bilanz", `${fenster} Links von P fällt der Graph mit der Steigung <span class="wg">−2</span>, rechts steigt er mit <span class="wg">2</span> — bei jeder Vergrößerung dieselben Zahlen.`);
    setzeText("fm-text", `Unter dem Mikroskop bleibt der Knick ein Knick: Zwei verschieden steile Halbgeraden treffen sich in P. Es gibt keine Gerade, der sich der Graph anschmiegt — an der Stelle ${num(x0)} hat f keine Ableitung.`);
    return;
  }
  const m = d.fn.d(x0);
  const prozent = (100 * abw) / (ymax - ymin);
  const st = abw >= 0.01 ? 4 : Math.min(10, stellenFuer(abw) + 2);
  setzeHtml("fm-bilanz",
    `${fenster} Graph und Tangente (Steigung f′(${num(x0)}) = <span class="wa">${num(m)}</span>) liegen im Fenster höchstens ${rund(abw, st)}${num(abw, st)} auseinander — das sind ${rund(prozent, 2)}${num(prozent, 2)} % der Fensterhöhe.`);
  setzeText("fm-text", zoom >= 100
    ? `Bei ${num(zoom)}-facher Vergrößerung ist der Graph von der Tangente mit der Steigung ${num(m)} nicht mehr zu unterscheiden. Im Kleinen ist f eine Gerade — das meint „lokal linear“.`
    : zoom >= 5
      ? `Der Graph wird gerader; der Abstand zur Tangente schrumpft schneller als das Fenster. Vergrößere weiter.`
      : `Noch ist der Graph deutlich gekrümmt. Vergrößere den Ausschnitt um P.`);
}

// ================= 4. Grafisches Differenzieren =================

const GD = {
  para: { fn: FN.para, xs: [-2.5, 2.5], oben: [-1, 7], unten: [-5.5, 5.5], start: -2 },
  kubik: { fn: FN.kubik, xs: [-2.5, 2.5], oben: [-4.5, 4.5], unten: [-2.5, 8.5], start: -2.2 },
  quartik: { fn: FN.quartik, xs: [-1.6, 1.6], oben: [-0.6, 2], unten: [-5.5, 5.5], start: -1.5 },
  sinus: { fn: FN.sinus, xs: [-3.1, 3.1], oben: [-1.6, 1.6], unten: [-1.6, 1.6], start: -3 },
};
function gdBereich() {
  const d = GD[wahl("gd-art")];
  setzeBereich("gd-x", d.xs[0], d.xs[1], d.start);
}
function renderGrafisch() {
  const art = wahl("gd-art");
  const d = GD[art];
  const x0 = reglerRaster("gd-x");
  const ganz = document.getElementById("gd-ganz").checked;
  setzeAnzeige("gd-x-anzeige", num(x0, 1));
  const f0 = d.fn.f(x0), m = d.fn.d(x0);
  // Rechts bleibt Platz für das Steigungsdreieck der Breite 1.
  const xmin = d.xs[0] - 0.4, xmax = d.xs[1] + 1.2;
  const K1 = koordinatenXY({ breite: 560, hoehe: 250, xmin, xmax, ymin: d.oben[0], ymax: d.oben[1], panel: "f" });
  panelTitel(K1, "Graph von f");
  graph(K1, d.fn.f, xmin, xmax, { schritte: 500 });
  gerade(K1, m, x0, f0, "dr-tangente", { "data-rolle": "tangente" });
  vieleck(K1, [[x0, f0], [x0 + 1, f0], [x0 + 1, f0 + m]], "dr-dreieck-flaeche", { "data-rolle": "dreieck" });
  strecke(K1, x0, f0, x0 + 1, f0, "dr-dreieck dx", { "data-rolle": "dx", "data-wert": "1" });
  strecke(K1, x0 + 1, f0, x0 + 1, f0 + m, "dr-dreieck", { "data-rolle": "dy", "data-wert": String(m) });
  punkt(K1, x0, f0, "fr-punkt", { "data-rolle": "p" });
  beschrift(K1, x0 + 0.5, f0, "1", "dr-text-k", { dy: m >= 0 ? 15 : -7 });
  beschrift(K1, x0 + 1, f0 + m / 2, `${num(m, 2)}`, "dr-text-v", { dx: 7, dy: 4, anker: "start" });

  const K2 = koordinatenXY({ breite: 560, hoehe: 210, xmin, xmax, ymin: d.unten[0], ymax: d.unten[1], yName: "y", panel: "a" });
  panelTitel(K2, "Graph von f′ (Tangentensteigungen)");
  if (ganz) graph(K2, d.fn.d, d.xs[0], d.xs[1], { schritte: 400, basis: "dr-ableitung loesung", rolle: "loesung" });
  if (x0 - d.xs[0] > 1e-9) graph(K2, d.fn.d, d.xs[0], x0, { schritte: Math.max(2, Math.round((x0 - d.xs[0]) * 80)), basis: "dr-ableitung", rolle: "spur" });
  strecke(K2, x0, 0, x0, m, "dr-balken", { "data-rolle": "balken", "data-wert": String(m) });
  punkt(K2, x0, m, "fr-punkt dr-punkt-t", { "data-rolle": "punkt-ableitung" });
  zeige("gd-mount", K1.svg, K2.svg);

  const z = zeichen(m, 2);
  const wie = Math.abs(m) < 0.005 ? "bleibt die Tangente auf gleicher Höhe" : m > 0 ? `steigt die Tangente um ${rund(m, 2)}${num(m, 2)}` : `fällt die Tangente um ${rund(m, 2)}${num(-m, 2)}`;
  setzeHtml("gd-bilanz",
    `x₀ = ${num(x0, 1)}: Auf eine Einheit nach rechts ${wie} — also f′(${num(x0, 1)}) ${z} <span class="wa">${num(m, 2)}</span>. Unten entsteht der Punkt (${num(x0, 1)} | ${num(m, 2)}).`);
  const lage = Math.abs(m) < 0.005 ? "Hier ist die Tangente waagerecht: f′ hat eine Nullstelle." :
    m > 0 ? "f steigt hier, also liegt der Punkt von f′ oberhalb der x-Achse." : "f fällt hier, also liegt der Punkt von f′ unterhalb der x-Achse.";
  setzeText("gd-text", lage + (art === "sinus" ? " Fällt dir auf, wem der untere Graph gleicht? Abschnitt 7 klärt das." : " Fahre weiter: Die grüne Spur unten ist der Graph der Ableitungsfunktion."));
}

// ================= 5. Das wachsende Quadrat =================

function renderQuadrat() {
  const x = reglerRaster("pq-x");
  const h = reglerRaster("pq-h");
  setzeAnzeige("pq-x-anzeige", num(x));
  setzeAnzeige("pq-h-anzeige", `${num(h, 2)} (x = ${num(x + h, 2)})`);
  // 420 × 406 Bildpunkte bei 0 … 4,2 in beiden Richtungen: unverzerrt, damit Flächen Flächen bleiben.
  const K = koordinatenXY({ breite: 420, hoehe: 406, xmin: 0, xmax: 4.2, ymin: 0, ymax: 4.2, xName: "", yName: "", zahlen: false });
  rechteck(K, 0, 0, x, x, "dr-quadrat", { "data-rolle": "quadrat" });
  rechteck(K, x, 0, x + h, x, "dr-streifen", { "data-rolle": "streifen-rechts" });
  rechteck(K, 0, x, x, x + h, "dr-streifen oben", { "data-rolle": "streifen-oben" });
  rechteck(K, x, x, x + h, x + h, "dr-ecke", { "data-rolle": "ecke" });
  beschrift(K, x / 2, x / 2, "x₀²", "dr-text-b", { dy: 5 });
  beschrift(K, x / 2, 0, `x₀ = ${num(x)}`, "dr-text-b", { dy: -8 });
  beschrift(K, x + h, x / 2, "x₀ · Δx", "dr-text-o", { dx: 6, dy: 4, anker: "start" });
  beschrift(K, x / 2, x + h, "x₀ · Δx", "dr-text-v", { dy: -7 });
  beschrift(K, x + h, x + h, "Δx²", "dr-text-r", { dx: 6, dy: -6, anker: "start" });
  zeige("pq-mount", K.svg);
  const zuwachs = 2 * x * h + h * h;
  setzeHtml("pq-bilanz",
    `Zuwachs: x² − x₀² = 2 · x₀ · Δx + Δx² = 2 · ${num(x)} · ${num(h, 2)} + ${num(h, 2)}² = ${num(2 * x * h)} + ${num(h * h)} = ${num(zuwachs)}<br>` +
    `Geteilt durch Δx = x − x₀: ${bruch("x² − x₀²", "x − x₀")} = 2x₀ + Δx = x + x₀ = ${num(2 * x)} + ${num(h, 2)} = <span class="wo">${num(2 * x + h)}</span>. Für x → x₀ bleibt <span class="wa">2x₀ = ${num(2 * x)}</span>.`);
  const anteil = (100 * h * h) / zuwachs;
  setzeText("pq-text", `Das Eckquadrat Δx² macht ${zeichen(anteil, 1)} ${num(anteil, 1)} % des Zuwachses aus. Halbiert man Δx, werden die Streifen halb so breit, das Eckquadrat aber nur noch ein Viertel so groß — nach dem Teilen durch Δx bleiben die beiden Streifen x₀ · Δx übrig, also 2x₀.`);
}

// ================= 6. Faktorregel und Summenregel =================

function renderRegeln() {
  const art = wahl("rg-art");
  const x0 = reglerRaster("rg-x");
  setzeAnzeige("rg-x-anzeige", num(x0));
  document.getElementById("rg-k-label").hidden = art !== "faktor";
  if (art === "faktor") {
    const k = reglerRaster("rg-k");
    setzeAnzeige("rg-k-anzeige", num(k));
    const g = (x) => 0.5 * x * x, gd = x0, g0 = g(x0), fd = k * gd, f0 = k * g0;
    // Rechts Platz für das Steigungsdreieck der Breite 1 bei x₀ = 2.
    const K = koordinatenXY({ xmin: -2.5, xmax: 3.3, ymin: -7, ymax: 10 });
    graph(K, g, -2.5, 3.3, { basis: "fr-linie duenn2", rolle: "g" });
    graph(K, (x) => k * g(x), -2.5, 3.3, { rolle: "f" });
    gerade(K, gd, x0, g0, "dr-tangente grenze", { "data-rolle": "tangente-g" });
    gerade(K, fd, x0, f0, "dr-tangente", { "data-rolle": "tangente-f" });
    strecke(K, x0, g0, x0 + 1, g0, "dr-dreieck dx duenn", { "data-rolle": "dx-g" });
    strecke(K, x0 + 1, g0, x0 + 1, g0 + gd, "dr-dreieck duenn", { "data-rolle": "dy-g", "data-wert": String(gd) });
    strecke(K, x0, f0, x0 + 1, f0, "dr-dreieck dx", { "data-rolle": "dx-f" });
    strecke(K, x0 + 1, f0, x0 + 1, f0 + fd, "dr-dreieck", { "data-rolle": "dy-f", "data-wert": String(fd) });
    punkt(K, x0, g0, "fr-punkt", { "data-rolle": "p-g", r: 4 });
    punkt(K, x0, f0, "fr-punkt", { "data-rolle": "p-f" });
    // Beide Beschriftungen rechts neben ihre Kathete; liegen die Mitten der Katheten keine
    // 18 Bildpunkte auseinander, rückt die von f nach oben — sonst stünden sie übereinander.
    const yg = K.Y(g0 + gd / 2), yf0 = K.Y(f0 + fd / 2);
    const yf = Math.abs(yf0 - yg) < 18 ? yg - 18 : yf0;
    const rechtsFrei = K.X(x0 + 1) + 100 < K.breite;
    const lx = K.X(x0 + 1) + (rechtsFrei ? 7 : -7), anker = rechtsFrei ? "start" : "end";
    K.svg.appendChild(svgText(lx, yg + 4, `g′(x₀) = ${num(gd)}`, { class: "dr-text-v", "text-anchor": anker }));
    K.svg.appendChild(svgText(lx, yf + 4, `f′(x₀) = ${num(fd)}`, { class: "dr-text-g", "text-anchor": anker }));
    zeige("rg-mount", K.svg);
    setzeHtml("rg-bilanz",
      `g(x) = 0,5x², g′(x) = x, also g′(${num(x0)}) = ${num(gd)}. f(x) = ${numK(k)} · g(x): Jeder Funktionswert wird mit ${numK(k)} multipliziert, das Steigungsdreieck der Breite 1 wird ${numK(k)}-mal so hoch.<br>` +
      `f′(${num(x0)}) = k · g′(${num(x0)}) = ${numK(k)} · ${numK(gd)} = <span class="wa">${num(fd)}</span>`);
    setzeText("rg-text", k < 0
      ? "Ein negativer Faktor spiegelt den Graphen an der x-Achse: Aus Steigen wird Fallen, die Steigung wechselt ihr Vorzeichen — und wird trotzdem nur mit k multipliziert."
      : k === 0 ? "Mit k = 0 wird f zur Nullfunktion: waagerecht, Steigung 0 = 0 · g′(x₀)." : "Der Faktor streckt den Graphen in y-Richtung. Die Breite des Steigungsdreiecks bleibt 1, seine Höhe wächst mit — genau das sagt die Faktorregel.");
    return;
  }
  const g = (x) => 0.5 * x * x, h = (x) => 0.2 * x ** 3, f = (x) => g(x) + h(x);
  const gd = x0, hd = 0.6 * x0 * x0, fd = gd + hd, f0 = f(x0);
  const K = koordinatenXY({ xmin: -2.5, xmax: 3.3, ymin: -4, ymax: 8 });
  graph(K, g, -2.5, 3.3, { basis: "fr-linie duenn2", rolle: "g" });
  graph(K, h, -2.5, 3.3, { basis: "fr-linie kopie", rolle: "h" });
  graph(K, f, -2.5, 3.3, { rolle: "f" });
  gerade(K, fd, x0, f0, "dr-tangente", { "data-rolle": "tangente-f" });
  // Die beiden Steigungen werden übereinandergestapelt: erst g′, darauf h′ — zusammen f′.
  strecke(K, x0, f0, x0 + 1, f0, "dr-dreieck dx", { "data-rolle": "dx-f" });
  strecke(K, x0 + 1, f0, x0 + 1, f0 + gd, "dr-dreieck", { "data-rolle": "dy-g", "data-wert": String(gd) });
  strecke(K, x0 + 1, f0 + gd, x0 + 1, f0 + gd + hd, "dr-dreieck h", { "data-rolle": "dy-h", "data-wert": String(hd) });
  punkt(K, x0, f0, "fr-punkt", { "data-rolle": "p-f" });
  beschrift(K, x0 + 1, f0 + gd / 2, `g′ = ${num(gd)}`, "dr-text-v", { dx: 7, dy: 4, anker: "start" });
  beschrift(K, x0 + 1, f0 + gd + hd / 2, `h′ = ${num(hd)}`, "dr-text-o", { dx: -7, dy: 4, anker: "end" });
  zeige("rg-mount", K.svg);
  setzeHtml("rg-bilanz",
    `g(x) = 0,5x² ⟹ g′(${num(x0)}) = ${num(gd)}; &nbsp; h(x) = 0,2x³ ⟹ h′(x) = 0,6x², h′(${num(x0)}) = ${num(hd)}<br>` +
    `f′(${num(x0)}) = g′(${num(x0)}) + h′(${num(x0)}) = ${num(gd)} + ${numK(hd)} = <span class="wa">${num(fd)}</span> — die beiden Katheten liegen übereinander und reichen genau bis zur Tangente von f.`);
  setzeText("rg-text", "Gestrichelt: g (blau) und h (orange). Weil f an jeder Stelle die Summe der beiden ist, wächst f auf eine Einheit nach rechts um das, was g wächst, plus das, was h wächst.");
}

// ================= 7. Sinus und Kosinus am Einheitskreis =================

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

// ================= 8. Produktregel und Kettenregel =================

function renderProduktKette() {
  const art = wahl("pk-art");
  const x = reglerRaster("pk-x");
  const h = reglerRaster("pk-h");
  setzeAnzeige("pk-x-anzeige", num(x, 2));
  setzeAnzeige("pk-h-anzeige", num(h, 2));
  if (art === "produkt") {
    const v = (t) => 0.25 * t * t + 1;
    const u0 = x, v0 = v(x), du = h, dv = v(x + h) - v(x);
    // 420 × 406 Bildpunkte bei 0 … 2,8 in beiden Richtungen: unverzerrt.
    const K = koordinatenXY({ breite: 420, hoehe: 406, xmin: 0, xmax: 2.8, ymin: 0, ymax: 2.8, xName: "", yName: "", zahlen: false });
    rechteck(K, 0, 0, u0, v0, "dr-quadrat", { "data-rolle": "rechteck" });
    rechteck(K, u0, 0, u0 + du, v0, "dr-streifen", { "data-rolle": "streifen-rechts" });
    rechteck(K, 0, v0, u0, v0 + dv, "dr-streifen oben", { "data-rolle": "streifen-oben" });
    rechteck(K, u0, v0, u0 + du, v0 + dv, "dr-ecke", { "data-rolle": "ecke" });
    beschrift(K, u0 / 2, v0 / 2, "u · v", "dr-text-b", { dy: 5 });
    beschrift(K, u0 / 2, 0, `u = ${num(u0, 2)}`, "dr-text-b", { dy: -8 });
    beschrift(K, 0, v0, `v = ${num(v0, 4)}`, "dr-text-b", { dx: 6, dy: 16, anker: "start" });
    beschrift(K, u0 + du, v0 / 2, "v · Δu", "dr-text-o", { dx: 6, dy: 4, anker: "start" });
    beschrift(K, u0 / 2, v0 + dv, "u · Δv", "dr-text-v", { dy: -7 });
    beschrift(K, u0 + du, v0 + dv, "Δu · Δv", "dr-text-r", { dx: 6, dy: -6, anker: "start" });
    zeige("pk-mount", K.svg);
    const zuwachs = v0 * du + u0 * dv + du * dv;
    const grenz = 1 * v0 + u0 * 0.5 * x;
    setzeHtml("pk-bilanz",
      `u(x) = x, v(x) = 0,25x² + 1. Δu = h = ${num(du, 2)}, Δv = v(${num(x + h, 2)}) − v(${num(x, 2)}) = ${num(dv, 6)}<br>` +
      `Δ(u · v) = v · Δu + u · Δv + Δu · Δv = ${num(v0 * du, 6)} + ${num(u0 * dv, 6)} + ${num(du * dv, 6)} = ${num(zuwachs, 6)}; geteilt durch h: <span class="wo">${num(zuwachs / h, 4)}</span><br>` +
      `Für h → 0: u′ · v + u · v′ = 1 · ${num(v0, 4)} + ${num(u0, 2)} · ${num(0.5 * x, 4)} = <span class="wa">${num(grenz, 4)}</span>`);
    setzeText("pk-text", `Die rote Ecke Δu · Δv macht ${zeichen((100 * du * dv) / zuwachs, 1)} ${num((100 * du * dv) / zuwachs, 1)} % des Zuwachses aus. Nach dem Teilen durch h ist sie Δu : h · Δv = 1 · Δv — und Δv geht mit h gegen 0. Übrig bleiben die beiden Streifen: v · u′ und u · v′.`);
    return;
  }
  // Kettenregel: drei Zahlengeraden mit demselben Maßstab, damit man die Streckung sieht.
  const B = 560, H = 300, lo = -1.2, hi = 6.6;
  const P = (w) => 40 + ((w - lo) / (hi - lo)) * (B - 60);
  const svg = flaeche(B, H);
  const zeilen = [
    { y: 60, achse: "x", name: "x", von: x, bis: x + h, klasse: "x" },
    { y: 150, achse: "u", name: "u = x²", von: x * x, bis: (x + h) * (x + h), klasse: "u" },
    { y: 240, achse: "f", name: "f = sin u", von: Math.sin(x * x), bis: Math.sin((x + h) * (x + h)), klasse: "f" },
  ];
  for (const z of zeilen) {
    svg.appendChild(svgEl("line", { x1: P(lo), x2: P(hi), y1: z.y, y2: z.y, class: "dr-zahlenstrahl", "data-rolle": "strahl-" + z.achse }));
    for (let w = -1; w <= 6; w++) {
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
  const du = zeilen[1].bis - zeilen[1].von, df = zeilen[2].bis - zeilen[2].von;
  svg.appendChild(svgText(B - 8, 108, `Δu : Δx ≈ ${num(du / h, 2)}`, { class: "dr-text-v", "text-anchor": "end" }));
  svg.appendChild(svgText(B - 8, 198, `Δf : Δu ≈ ${num(df / du, 2)}`, { class: "dr-text-g", "text-anchor": "end" }));
  zeige("pk-mount", svg);
  const u = x * x, grenz = Math.cos(u) * 2 * x;
  setzeHtml("pk-bilanz",
    `Δx = h = ${num(h, 2)}; Δu = (x + h)² − x² = ${num(du, 4)}; Δf = sin(${num(zeilen[1].bis, 4)}) − sin(${num(u, 4)}) ${zeichen(df)} ${num(df, 4)}<br>` +
    `${bruch("Δf", "Δx")} = ${bruch("Δf", "Δu")} · ${bruch("Δu", "Δx")} ${zeichen(df / h)} ${num(df / du, 4)} · ${numK(du / h, 4)} ${zeichen(df / h)} <span class="wo">${num(df / h, 4)}</span><br>` +
    `Für h → 0: äußere Ableitung cos(u) = cos(${num(u, 4)}) ${zeichen(Math.cos(u))} ${num(Math.cos(u))} mal innere Ableitung 2x = ${num(2 * x, 2)}: f′(${num(x, 2)}) ${zeichen(grenz)} <span class="wa">${num(grenz, 4)}</span>`);
  setzeText("pk-text", Math.cos(u) < 0
    ? "Der äußere Verstärkungsfaktor cos u ist hier negativ: Das f-Intervall liegt umgekehrt — wenn x wächst, fällt f. Die Längen multiplizieren sich trotzdem, nur mit Vorzeichen."
    : "Das kleine x-Intervall wird von u = x² etwa um den Faktor 2x gestreckt, das u-Intervall von sin u etwa um den Faktor cos u. Zusammen: cos(x²) · 2x — äußere Ableitung mal innere Ableitung.");
}

// ================= 9. Tangente, Normale, Winkel =================

const GRAD = 180 / Math.PI;
// −1/m als Bruch, wenn m ganzzahlig ist — sonst als Dezimalzahl.
function kehrText(m) {
  const k = -1 / m;
  if (Number.isInteger(m) && Math.abs(m) > 1) return (k < 0 ? "−" : "") + bruch("1", String(Math.abs(m)));
  return num(k);
}
function kehrPlain(m) {
  const k = -1 / m;
  if (Number.isInteger(m) && Math.abs(m) > 1) return `${k < 0 ? "−" : ""}1/${Math.abs(m)}`;
  return num(k);
}
function bogenPfad(K, x0, y0, r, von, bis) {
  let d = "";
  for (let i = 0; i <= 40; i++) {
    const t = (von + ((bis - von) * i) / 40) / GRAD;
    d += `${i ? " L" : "M"} ${(K.X(x0) + r * Math.cos(t)).toFixed(2)} ${(K.Y(y0) - r * Math.sin(t)).toFixed(2)}`;
  }
  return d;
}
function renderTangente() {
  const art = wahl("tn-art");
  const normale = art === "normale";
  document.getElementById("tn-x-label").hidden = !normale;
  document.getElementById("tn-d-label").hidden = !normale;
  document.getElementById("tn-m-label").hidden = normale;
  // 560 × 520 Bildpunkte, x von −3,5 bis 3,5: unverzerrt, damit der rechte Winkel ein rechter ist.
  const [ymin, ymax] = gleichY(-3.5, 3.5, 1.818, 560, 520);
  const K = koordinatenXY({ breite: 560, hoehe: 520, xmin: -3.5, xmax: 3.5, ymin, ymax });
  graph(K, FN.para.f, -3.5, 3.5, { schritte: 500 });
  if (normale) {
    const x0 = reglerRaster("tn-x");
    const d = reglerRaster("tn-d");
    setzeAnzeige("tn-x-anzeige", num(x0));
    setzeAnzeige("tn-d-anzeige", `${num(d * 90, 1)}°`);
    const y0 = x0 * x0, m = 2 * x0;
    gerade(K, m, x0, y0, "dr-tangente", { "data-rolle": "tangente" });
    if (m !== 0) gerade(K, -1 / m, x0, y0, "dr-normale", { "data-rolle": "normale" });
    else strecke(K, x0, K.ymin, x0, K.ymax, "dr-normale", { "data-rolle": "normale", "data-senkrecht": "1" });
    vieleck(K, [[x0, y0], [x0 + 1, y0], [x0 + 1, y0 + m]], "dr-dreieck-flaeche", { "data-rolle": "dreieck" });
    // Starre Drehung um P: Jede Ecke wird um denselben Winkel gedreht, die Seitenlängen bleiben.
    const th = (d * Math.PI) / 2, c = Math.cos(th), s = Math.sin(th);
    const dreh = ([ex, ey]) => [x0 + ex * c - ey * s, y0 + ex * s + ey * c];
    vieleck(K, [[x0, y0], dreh([1, 0]), dreh([1, m])], "dr-dreieck-flaeche gedreht", { "data-rolle": "dreieck-gedreht", "data-winkel": String(d * 90) });
    punkt(K, x0, y0, "fr-punkt", { "data-rolle": "p" });
    beschrift(K, x0 + 0.5, y0, "1", "dr-text-k", { dy: m >= 0 ? 15 : -7 });
    beschrift(K, x0 + 1, y0 + m / 2, `m = ${num(m)}`, "dr-text-v", { dx: 7, dy: 4, anker: "start" });
    beschrift(K, x0, y0, "P", "dr-text-b", { dx: -12, dy: -8 });
    zeige("tn-mount", K.svg);
    const b = y0 - m * x0;
    if (m === 0) {
      setzeHtml("tn-bilanz", `f′(0) = 0: Die Tangente ist waagerecht, t(x) = 0. Die Normale steht senkrecht darauf: <span class="wr">x = 0</span> — eine senkrechte Gerade, keine Funktion.`);
    } else {
      const bn = y0 + x0 / m;
      // Bei m = ±1 ist die Normalensteigung ∓1 — dann ohne „1x“.
      const nText = Math.abs(m) === 1 ? geradeText(-1 / m, bn) : `${kehrText(m)}x ${plusMinus(bn)}`;
      setzeHtml("tn-bilanz",
        `f′(${num(x0)}) = 2 · ${numK(x0)} = ${num(m)}; &nbsp; Tangente: t(x) = ${num(m)} · (x ${plusMinus(-x0)}) + ${num(y0)} = <span class="wa">${geradeText(m, b)}</span><br>` +
        `Normale: Steigung −1 : ${numK(m)} = ${kehrText(m)}; &nbsp; n(x) = <span class="wr">${nText}</span>. Probe: ${num(m)} · (${kehrText(m)}) = −1`);
    }
    setzeText("tn-text", d === 0
      ? "Dreh das violette Steigungsdreieck mit dem Regler „Drehung“ um P."
      : d < 1
        ? `Das Dreieck ist um ${num(d * 90, 1)}° gedreht; seine Seiten bleiben 1 und ${num(Math.abs(m))} lang.`
        : `Nach 90° zeigt die Kathete der Länge 1 nach oben und die Kathete der Länge ${num(Math.abs(m))} nach ${m >= 0 ? "links" : "rechts"}: Die Hypotenuse liegt auf der Normalen. Ihre Steigung ist 1 : ${numK(-m)} = ${kehrPlain(m)} = −1/m.`);
    return;
  }
  const mg = reglerRaster("tn-m");
  setzeAnzeige("tn-m-anzeige", num(mg, 2));
  const al = Math.atan(2) * GRAD, be = Math.atan(mg) * GRAD, diff = Math.abs(al - be);
  const ga = diff <= 90 ? diff : 180 - diff;
  gerade(K, 2, 1, 1, "dr-tangente", { "data-rolle": "tangente" });
  gerade(K, mg, 1, 1, "dr-gerade-g", { "data-rolle": "gerade-g" });
  strecke(K, -3.5, 1, 3.5, 1, "dr-verbinder", { "data-rolle": "waagerechte" });
  punkt(K, 1, 1, "fr-punkt", { "data-rolle": "p" });
  // Der Schnittwinkel liegt zwischen den beiden Richtungen, die höchstens 90° auseinander sind.
  const beG = diff <= 90 ? be : be < al ? be + 180 : be - 180;
  K.svg.appendChild(svgEl("path", { d: bogenPfad(K, 1, 1, 36, 0, al), class: "dr-winkel", "data-rolle": "winkel-alpha", "data-grad": String(al) }));
  K.svg.appendChild(svgEl("path", { d: bogenPfad(K, 1, 1, 54, 0, be), class: "dr-winkel b", "data-rolle": "winkel-beta", "data-grad": String(be) }));
  K.svg.appendChild(svgEl("path", { d: bogenPfad(K, 1, 1, 22, Math.min(al, beG), Math.max(al, beG)), class: "dr-winkel g", "data-rolle": "winkel-gamma", "data-grad": String(ga) }));
  const lab = (r, w, t, k) => K.svg.appendChild(svgText(K.X(1) + r * Math.cos(w / GRAD), K.Y(1) - r * Math.sin(w / GRAD) + 4, t, { class: k }));
  lab(46, al / 2, "α", "dr-text-v");
  if (Math.abs(be) > 6) lab(66, be / 2, "β", "dr-text-o");
  if (ga > 8) lab(30, (al + beG) / 2, "γ", "dr-text-g");
  beschrift(K, 1, 1, "P", "dr-text-b", { dx: 14, dy: 16 });
  zeige("tn-mount", K.svg);
  setzeHtml("tn-bilanz",
    `f′(1) = 2: α = tan⁻¹(2) ≈ <span class="wr">${numFest(al)}°</span>; &nbsp; g′(1) = ${num(mg, 2)}: β = tan⁻¹(${num(mg, 2)}) ${zeichen(be, 2)} <span class="wo">${numFest(be)}°</span><br>` +
    `|α − β| ${zeichen(diff, 2)} ${numFest(diff)}° ${diff <= 90 ? "≤ 90°, also γ = |α − β|" : "&gt; 90°, also γ = 180° − |α − β|"} ${zeichen(ga, 2)} <span class="wa">${numFest(ga)}°</span>`);
  setzeText("tn-text", Math.abs(mg - 2) < 1e-9
    ? "g hat in P dieselbe Steigung wie f: g ist die Tangente, der Schnittwinkel ist 0° — die Graphen berühren sich."
    : Math.abs(mg + 0.5) < 1e-9
      ? "g hat die Steigung −1/2 = −1/f′(1): g ist die Normale, der Schnittwinkel ist 90°."
      : "Der Schnittwinkel zweier Graphen ist der Winkel zwischen ihren Tangenten im gemeinsamen Punkt — hier zwischen der grünen Tangente an f und der Geraden g selbst.");
}

// ================= 10. Differenzierbarkeit =================

const DF = {
  naht: { x0: 2, bild: [-0.5, 4.5, -0.5, 8] },
  betrag: { x0: 0, bild: [-2, 2, -0.6, 2.4], f: Math.abs },
  wurzel3: { x0: 0, bild: [-2, 2, -1.6, 1.6], f: Math.cbrt },
};
const H_DF = [1, 0.5, 0.1, 0.01, 0.001];
function renderDifferenzierbar() {
  const art = wahl("df-art");
  const d = DF[art];
  document.getElementById("df-m-label").hidden = art !== "naht";
  const m = reglerRaster("df-m");
  const h = H_DF[regler("df-h")];
  setzeAnzeige("df-m-anzeige", num(m));
  setzeAnzeige("df-h-anzeige", num(h, 3));
  // Die Gerade setzt immer im Punkt (2 | 3) an: f bleibt stetig, nur der Knick hängt an m.
  const f = art === "naht" ? (x) => (x < 2 ? x * x - 2 * x + 3 : 3 + m * (x - 2)) : d.f;
  const x0 = d.x0, f0 = f(x0);
  const links = (w) => (f(x0) - f(x0 - w)) / w, rechts = (w) => (f(x0 + w) - f(x0)) / w;
  const [xmin, xmax, ymin, ymax] = d.bild;
  const K = koordinatenXY({ xmin, xmax, ymin, ymax });
  if (art === "naht") {
    graph(K, (x) => x * x - 2 * x + 3, xmin, 2, { rolle: "teil-links" });
    graph(K, (x) => 3 + m * (x - 2), 2, xmax, { rolle: "teil-rechts" });
  } else graph(K, f, xmin, xmax, { schritte: 800 });
  gerade(K, links(h), x0, f0, "dr-sekante", { "data-rolle": "sekante-links" });
  gerade(K, rechts(h), x0, f0, "dr-sekante rechts", { "data-rolle": "sekante-rechts" });
  punkt(K, x0 - h, f(x0 - h), "fr-punkt dr-punkt-q", { "data-rolle": "q-links" });
  punkt(K, x0 + h, f(x0 + h), "fr-punkt dr-punkt-v", { "data-rolle": "q-rechts" });
  punkt(K, x0, f0, "fr-punkt", { "data-rolle": "p" });
  zeige("df-mount", K.svg);
  const kopf = H_DF.map((w) => `<th>${num(w, 3)}</th>`).join("");
  const zeile = (fn, seite) => H_DF.map((w) => `<td data-seite="${seite}" data-h="${w}" class="${w === h ? "aktiv" : ""}">${num(fn(w), 4)}</td>`).join("");
  setzeHtml("df-tabelle", `<table class="fr-tabelle"><tr><th>|x − x₀|</th>${kopf}</tr><tr><th>von links</th>${zeile(links, "links")}</tr><tr><th>von rechts</th>${zeile(rechts, "rechts")}</tr></table>`);
  const L = links(h), R = rechts(h);
  // x₀-Methode: links ist x = x₀ − |x − x₀|, rechts x = x₀ + |x − x₀|.
  const xl = x0 - h, xr = x0 + h;
  const kopfzeile = `Von links, x = ${num(xl, 3)}: ${bruch(`f(${num(xl, 3)}) − f(${num(x0)})`, `${num(xl, 3)} − ${numK(x0)}`)} ${zeichen(L)} <span class="wo">${num(L)}</span>; &nbsp; von rechts, x = ${num(xr, 3)}: ${bruch(`f(${num(xr, 3)}) − f(${num(x0)})`, `${num(xr, 3)} − ${numK(x0)}`)} ${zeichen(R)} <span class="wr">${num(R)}</span><br>`;
  if (art === "naht") {
    const glatt = Math.abs(m - 2) < 1e-12;
    setzeHtml("df-bilanz", kopfzeile + `Links ist der Quotient gleich x → 2, rechts ist er ${num(m)} für jedes x. ` +
      (glatt ? `<span class="wa">Beide Grenzwerte sind 2: f ist an der Stelle 2 differenzierbar, f′(2) = 2.</span>` : `<span class="wg">Grenzwerte 2 und ${num(m)} verschieden: Knick — f ist an der Stelle 2 stetig, aber nicht differenzierbar.</span>`));
    setzeText("df-text", glatt
      ? "Mit m = 2 setzt die Gerade ohne Knick an die Parabel an — sie ist sogar die Tangente der Parabel im Punkt (2 | 3)."
      : "Die Gerade setzt im richtigen Punkt an (f ist stetig), aber mit einer anderen Steigung als die Parabel dort hat. Stell m so ein, dass der Knick verschwindet.");
    return;
  }
  if (art === "betrag") {
    setzeHtml("df-bilanz", kopfzeile + `<span class="wg">Links immer −1, rechts immer 1: verschiedene Grenzwerte — |x| ist an der Stelle 0 nicht differenzierbar.</span>`);
    setzeText("df-text", "Egal wie nah x an 0 heranrückt: Die linke Sekante fällt mit −1, die rechte steigt mit 1. Der Graph hat einen Knick. Stetig ist |x| bei 0 trotzdem.");
    return;
  }
  setzeHtml("df-bilanz", kopfzeile + `Beide Differenzenquotienten sind ${bruch("∛x", "x")} = |x|<sup>−2/3</sup> und <span class="wg">wachsen über jede Grenze — kein endlicher Grenzwert, also nicht differenzierbar.</span>`);
  setzeText("df-text", "Die Sekanten werden immer steiler und nähern sich der senkrechten Geraden x = 0. Eine senkrechte Tangente hat keine Steigung — ∛x ist bei 0 stetig, aber nicht differenzierbar.");
}

// ================= 11. Ganzrationale Funktionen =================

const GR = {
  f: { f: (x) => 0.5 * x ** 4 - x * x + 0.5, leit: (x) => 0.5 * x ** 4, leitText: "0,5x⁴", name: "f",
    exponenten: "4, 2, 0 — nur gerade", achse: true, punkt: false, grenzen: "f(x) → ∞ für x → ∞ und für x → −∞",
    minus: "f(−x) = 0,5(−x)⁴ − (−x)² + 0,5 = 0,5x⁴ − x² + 0,5 = f(x)" },
  g: { f: (x) => -0.5 * x ** 5 + 1.5 * x ** 3 + 2 * x, leit: (x) => -0.5 * x ** 5, leitText: "−0,5x⁵", name: "g",
    exponenten: "5, 3, 1 — nur ungerade", achse: false, punkt: true, grenzen: "g(x) → −∞ für x → ∞ und g(x) → ∞ für x → −∞",
    minus: "g(−x) = −0,5(−x)⁵ + 1,5(−x)³ + 2(−x) = 0,5x⁵ − 1,5x³ − 2x = −g(x)" },
  h: { f: (x) => 0.5 * x ** 3 - x * x + 1, leit: (x) => 0.5 * x ** 3, leitText: "0,5x³", name: "h",
    exponenten: "3, 2, 0 — gemischt", achse: false, punkt: false, grenzen: "h(x) → ∞ für x → ∞ und h(x) → −∞ für x → −∞",
    minus: "h(−x) = 0,5(−x)³ − (−x)² + 1 = −0,5x³ − x² + 1 — weder h(x) noch −h(x)" },
};
const GR_FENSTER = [2, 3, 5, 10, 20, 50];
function renderGanzrational() {
  const modus = wahl("gr-modus");
  const d = GR[wahl("gr-f")];
  document.getElementById("gr-z-label").hidden = modus !== "aussen";
  document.getElementById("gr-t-label").hidden = modus === "aussen";
  if (modus === "aussen") {
    const X = GR_FENSTER[regler("gr-z")];
    setzeAnzeige("gr-z-anzeige", `−${num(X)} … ${num(X)}`);
    let lo = 0, hi = 0;
    for (let i = 0; i <= 400; i++) {
      const x = -X + (2 * X * i) / 400;
      lo = Math.min(lo, d.f(x), d.leit(x));
      hi = Math.max(hi, d.f(x), d.leit(x));
    }
    const K = koordinatenXY({ xmin: -X, xmax: X, ymin: lo - 0.08 * (hi - lo), ymax: hi + 0.08 * (hi - lo) });
    graph(K, d.leit, -X, X, { schritte: 600, basis: "fr-linie kopie", rolle: "leit" });
    graph(K, d.f, -X, X, { schritte: 600, rolle: "f" });
    zeige("gr-mount", K.svg);
    const qr = d.f(X) / d.leit(X), ql = d.f(-X) / d.leit(-X);
    setzeHtml("gr-bilanz",
      `Verhältnis ${bruch(`${d.name}(x)`, d.leitText)} am Fensterrand: bei x = ${num(X)}: ${rund(qr)}<span class="wo">${num(qr)}</span>; bei x = −${num(X)}: ${rund(ql)}<span class="wo">${num(ql)}</span><br>` +
        `Für x → ±∞ strebt das Verhältnis gegen 1: ${d.grenzen}.`);
    setzeText("gr-text", X <= 3
      ? `Im kleinen Fenster sieht man noch die Einzelheiten von ${d.name} — Buckel und Nullstellen. Zoome heraus.`
      : `Im Fenster ±${num(X)} sind ${d.name} und ${d.leitText} kaum noch zu unterscheiden: Weit draußen bestimmt der Summand mit der höchsten Potenz den Verlauf, die übrigen fallen nicht mehr ins Gewicht.`);
    return;
  }
  const t = reglerRaster("gr-t");
  setzeAnzeige("gr-t-anzeige", modus === "achse" ? `${num(t * 100)} %` : `${num(t * 180)}°`);
  // Unverzerrt: Eine Drehung um den Ursprung muss im Bild eine Drehung bleiben.
  const [ymin, ymax] = gleichY(-5, 5, 0, 560, 500);
  const K = koordinatenXY({ breite: 560, hoehe: 500, xmin: -5, xmax: 5, ymin, ymax });
  graph(K, d.f, -5, 5, { schritte: 600, rolle: "original" });
  const abb = modus === "achse"
    // Umklappen wie eine Buchseite um die y-Achse: Im Bild schrumpft x über 0 auf −x.
    ? ([x, y]) => [(1 - 2 * t) * x, y]
    : ([x, y]) => [x * Math.cos(Math.PI * t) - y * Math.sin(Math.PI * t), x * Math.sin(Math.PI * t) + y * Math.cos(Math.PI * t)];
  let pfad = "";
  for (let i = 0; i <= 600; i++) {
    const x = -5 + (10 * i) / 600, y = d.f(x);
    if (Math.abs(y) > 60) { continue; }
    const [u, v] = abb([x, y]);
    pfad += `${pfad ? " L" : "M"} ${K.X(u).toFixed(2)} ${K.Y(v).toFixed(2)}`;
  }
  K.ebene.appendChild(svgEl("path", { d: pfad, class: "fr-linie kopie", "data-rolle": "kopie", "data-t": String(t) }));
  if (modus === "punkt") punkt(K, 0, 0, "fr-punkt dr-punkt-x", { "data-rolle": "ursprung", r: 4 });
  zeige("gr-mount", K.svg);
  const sym = modus === "achse" ? d.achse : d.punkt;
  const art = modus === "achse" ? "achsensymmetrisch zur y-Achse" : "punktsymmetrisch zum Ursprung";
  setzeHtml("gr-bilanz", `${d.minus}. Exponenten: ${d.exponenten}. ` +
    (sym ? `<span class="wa">${d.name} ist ${art}.</span>` : `<span class="wg">${d.name} ist nicht ${art}.</span>`));
  setzeText("gr-text", t < 1
    ? (modus === "achse" ? "Die orange Kopie wird wie eine Buchseite um die y-Achse umgeklappt. Schieb den Regler bis zum Ende." : "Die orange Kopie dreht sich um den Ursprung. Schieb den Regler bis 180°.")
    : sym ? "Die Kopie liegt genau auf dem Original — der Graph geht bei dieser Bewegung in sich selbst über." : "Die Kopie liegt neben dem Original: Diese Symmetrie hat der Graph nicht.");
}

// ================= 12. Nullstellen und Vielfachheit =================

function renderNullstellen() {
  const r1 = reglerRaster("ns-r1"), r2 = reglerRaster("ns-r2");
  const k1 = Number(wahl("ns-k1")), k2 = Number(wahl("ns-k2"));
  const q = document.getElementById("ns-q").checked;
  setzeAnzeige("ns-r1-anzeige", num(r1));
  setzeAnzeige("ns-r2-anzeige", num(r2));
  const f = (x) => 0.25 * (x - r1) ** k1 * (x - r2) ** k2 * (q ? x * x + 1 : 1);
  const exp = (k) => (k > 1 ? hoch(k) : "");
  setzeHtml("ns-term", `f(x) = 0,25 · ${linearfaktor(r1)}${exp(k1)} · ${linearfaktor(r2)}${exp(k2)}${q ? " · (x² + 1)" : ""}`);
  const K = koordinatenXY({ xmin: -4, xmax: 4, ymin: -4, ymax: 4 });
  graph(K, f, -4, 4, { schritte: 800 });
  const nullstellen = r1 === r2 ? [{ r: r1, k: k1 + k2 }] : [{ r: r1, k: k1 }, { r: r2, k: k2 }].sort((a, b) => a.r - b.r);
  nullstellen.forEach((n, i) => {
    punkt(K, n.r, 0, n.k % 2 ? "dr-schneidet" : "dr-beruehrt", { "data-rolle": "nullstelle", "data-wert": String(n.r), "data-vielfachheit": String(n.k), r: 6 });
    // Liegen zwei Nullstellen nah beieinander, steht die zweite Beschriftung über der Achse.
    const oben = i === 1 && Math.abs(nullstellen[1].r - nullstellen[0].r) < 1.5;
    beschrift(K, n.r, 0, VIELFACH[n.k], "dr-text-g", { dy: oben ? -12 : 22 });
  });
  zeige("ns-mount", K.svg);
  const grad = k1 + k2 + (q ? 2 : 0), summe = k1 + k2;
  const liste = nullstellen.map((n) => `x = ${num(n.r)} (${VIELFACH[n.k]}: ${n.k % 2 ? "Vorzeichenwechsel, der Graph schneidet" : "kein Vorzeichenwechsel, der Graph berührt"})`).join("; ");
  setzeHtml("ns-bilanz",
    `Grad: ${k1} + ${k2}${q ? " + 2" : ""} = <span class="wc">${grad}</span>. Nullstellen: ${liste}.<br>` +
    `Summe der Vielfachheiten: ${summe} ${summe === grad ? "= Grad" : `&lt; Grad ${grad} — der Faktor x² + 1 hat keine Nullstelle`}.`);
  setzeText("ns-text", r1 === r2
    ? `Beide Nullstellen fallen bei ${num(r1)} zusammen: (x ${plusMinus(-r1)})${hoch(k1)} · (x ${plusMinus(-r1)})${hoch(k2)} = (x ${plusMinus(-r1)})${hoch(k1 + k2)}. Die Vielfachheiten addieren sich zu ${k1 + k2}.`
    : "An einer Nullstelle mit ungerader Vielfachheit wechselt das Vorzeichen, an einer mit gerader nicht. Je höher die Vielfachheit, desto flacher schmiegt sich der Graph an die x-Achse.");
}

// ================= 13. f und f′: Monotonie und Extrempunkte =================

const MO = {
  quartik: { fn: FN.quartik, xs: [-1.8, 1.8], oben: [-0.5, 2.8], unten: [-8.5, 8.5], start: -1.5,
    dText: "f′(x) = 2x³ − 2x = 2x(x − 1)(x + 1)", nullstellen: [-1, 0, 1],
    monoton: "f fällt für x &lt; −1 und für 0 &lt; x &lt; 1; f steigt für −1 &lt; x &lt; 0 und für x &gt; 1.",
    punkte: [[-1, "T₁"], [0, "H"], [1, "T₂"]], extrema: "Tiefpunkte T₁(−1 | 0) und T₂(1 | 0), Hochpunkt H(0 | 0,5)." },
  kubik: { fn: FN.kubik, xs: [-2.4, 2.4], oben: [-3.6, 3.6], unten: [-2, 7.5], start: -2,
    dText: "f′(x) = 1,5x² − 1,5 = 1,5(x − 1)(x + 1)", nullstellen: [-1, 1],
    monoton: "f steigt für x &lt; −1 und für x &gt; 1; f fällt für −1 &lt; x &lt; 1.",
    punkte: [[-1, "H"], [1, "T"]], extrema: "Hochpunkt H(−1 | 1), Tiefpunkt T(1 | −1) — beide nur lokal." },
  sattel: { fn: FN.sattel, xs: [-1, 3.8], oben: [-7.5, 2], unten: [-5, 12], start: -0.8,
    dText: "f′(x) = x³ − 3x² = x²(x − 3)", nullstellen: [0, 3],
    monoton: "f fällt für x &lt; 3 — auch über die Stelle 0 hinweg; f steigt für x &gt; 3.",
    punkte: [[0, "S"], [3, "T"]], extrema: "Sattelpunkt S(0 | 0): f′(0) = 0, aber kein Vorzeichenwechsel. Tiefpunkt T(3 | −6,75), zugleich globales Minimum." },
};
function moBereich() {
  const d = MO[wahl("mo-art")];
  setzeBereich("mo-x", d.xs[0], d.xs[1], d.start);
}
function renderMonotonie() {
  const d = MO[wahl("mo-art")];
  const x0 = reglerRaster("mo-x");
  setzeAnzeige("mo-x-anzeige", num(x0, 1));
  const f = d.fn.f, fd = d.fn.d, m = fd(x0);
  const xmin = d.xs[0] - 0.1, xmax = d.xs[1] + 0.1;
  const art = (x) => (fd(x) > 1e-12 ? "steigt" : fd(x) < -1e-12 ? "faellt" : "steigt");
  const K1 = koordinatenXY({ breite: 560, hoehe: 250, xmin, xmax, ymin: d.oben[0], ymax: d.oben[1], panel: "f" });
  panelTitel(K1, "Graph von f");
  graph(K1, f, xmin, xmax, { schritte: 600, klasseVon: (x) => art(x) });
  gerade(K1, m, x0, f(x0), "dr-tangente grenze", { "data-rolle": "tangente" });
  for (const [xe, name] of d.punkte) {
    punkt(K1, xe, f(xe), "fr-punkt", { "data-rolle": "extrem", "data-typ": name, r: 4 });
    beschrift(K1, xe, f(xe), name, "dr-text-k", { dy: name.startsWith("H") ? -10 : 20 });
  }
  punkt(K1, x0, f(x0), "fr-punkt dr-punkt-t", { "data-rolle": "p" });
  const K2 = koordinatenXY({ breite: 560, hoehe: 210, xmin, xmax, ymin: d.unten[0], ymax: d.unten[1], panel: "a" });
  panelTitel(K2, "Graph von f′");
  graph(K2, fd, xmin, xmax, { schritte: 600, klasseVon: (x, y) => (y > 0 ? "positiv" : "negativ"), rolle: "ableitung" });
  for (const xn of d.nullstellen) punkt(K2, xn, 0, "dr-schneidet", { "data-rolle": "nullstelle-ableitung", "data-wert": String(xn), r: 4 });
  punkt(K2, x0, m, "fr-punkt dr-punkt-t", { "data-rolle": "punkt-ableitung" });
  zeige("mo-mount", K1.svg, K2.svg);
  const lage = Math.abs(m) < 1e-9 ? "= 0: waagerechte Tangente" : m > 0 ? "&gt; 0: f steigt hier" : "&lt; 0: f fällt hier";
  setzeHtml("mo-bilanz",
    `${d.dText}; Nullstellen von f′: ${d.nullstellen.map((v) => num(v)).join("; ")}<br>${d.monoton}<br>${d.extrema}<br>` +
    `x₀ = ${num(x0, 1)}: f′(x₀) ${zeichen(m)} <span class="${m > 0 ? "wa" : m < 0 ? "wo" : "wc"}">${num(m)}</span> ${lage}.`);
  const naechste = d.punkte.reduce((a, b) => (Math.abs(b[0] - x0) < Math.abs(a[0] - x0) ? b : a));
  setzeText("mo-text", Math.abs(naechste[0] - x0) < 0.35
    ? (naechste[1] === "S"
      ? "An der Stelle 0 berührt der Graph von f′ die x-Achse nur: f′ ist links und rechts negativ. f fällt weiter — die Tangente ist kurz waagerecht, aber es gibt keinen Extrempunkt."
      : `In der Nähe von ${naechste[1]}: Dort hat f′ eine Nullstelle und wechselt das Vorzeichen ${naechste[1].startsWith("H") ? "von + nach −: erst steigt f, dann fällt es" : "von − nach +: erst fällt f, dann steigt es"}.`)
    : "Grün: f steigt, f′ ist positiv. Orange: f fällt, f′ ist negativ. Fahre zu einer Nullstelle von f′.");
}

// ================= 14. Stolperstelle: Tangente schneidet =================

function renderStolperstelle() {
  const x0 = reglerRaster("sp-x");
  setzeAnzeige("sp-x-anzeige", num(x0, 2));
  const f = FN.kubik.f, m = FN.kubik.d(x0), y0 = f(x0), b = y0 - m * x0;
  const K = koordinatenXY({ xmin: -3.5, xmax: 3.5, ymin: -5, ymax: 5 });
  graph(K, f, -3.5, 3.5, { schritte: 600 });
  gerade(K, m, x0, y0, "dr-tangente", { "data-rolle": "tangente" });
  punkt(K, x0, y0, "dr-beruehrt", { "data-rolle": "beruehrpunkt", r: 6 });
  if (x0 !== 0) punkt(K, -2 * x0, f(-2 * x0), "dr-schnitt", { "data-rolle": "schnittpunkt", r: 6 });
  beschrift(K, x0, y0, "P", "dr-text-g", { dx: -12, dy: -10 });
  zeige("sp-mount", K.svg);
  if (x0 === 0) {
    setzeHtml("sp-bilanz", `t(x) = −1,5x. f(x) − t(x) = 0,5x³: <span class="wg">dreifache Nullstelle 0</span> — die Tangente durchsetzt den Graphen in P selbst.`);
    setzeText("sp-text", "Hier ist P der einzige gemeinsame Punkt — und trotzdem „berührt“ die Tangente nicht im Sinne von Ben: Sie geht durch den Graphen hindurch. Links liegt der Graph über ihr, rechts darunter. Einen solchen Punkt nennt man Wendepunkt (Thema 5).");
    return;
  }
  setzeHtml("sp-bilanz",
    // Bei x₀ in Vierteln hat b = −x₀³ bis zu sechs Nachkommastellen — so viele werden gezeigt,
    // damit „=“ stimmt.
    `t(x) = ${geradeText(m, b, "x", 6)}. f(x) − t(x) = 0,5 · (x ${plusMinus(-x0)})² · (x ${plusMinus(2 * x0)})<br>` +
    `Nullstellen: x₀ = ${num(x0)} <span class="wa">doppelt — Berührpunkt</span>; −2x₀ = ${num(-2 * x0)} <span class="wg">einfach — Schnittpunkt (${num(-2 * x0)} | ${num(f(-2 * x0))})</span>.`);
  setzeText("sp-text", `Die Tangente schmiegt sich bei P an den Graphen an und schneidet ihn bei x = ${num(-2 * x0)} ein zweites Mal. Lea hat recht: „Nur ein gemeinsamer Punkt“ gilt beim Kreis, nicht bei Funktionsgraphen.`);
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
  "quiz-mittlere": {
    q: "Für den fallenden Stein gilt s(t) = 5t² (t in s, s in m). Wie groß ist die Durchschnittsgeschwindigkeit zwischen t = 2 s und t = 4 s?",
    options: ["60 m/s", "30 m/s", "20 m/s", "40 m/s"],
    correct: 1,
    explain: "(80 m − 20 m) : (4 s − 2 s) = 30 m/s. 60 m ist der zurückgelegte Weg, keine Geschwindigkeit. 20 m/s und 40 m/s sind die Momentangeschwindigkeiten bei 2 s und 4 s — der Durchschnitt liegt dazwischen.",
  },
  "quiz-lokal": {
    q: "Für f(x) = x³, x₀ = 1 und x = 1,1 hat der Differenzenquotient den Wert 3,31. Was ist die beste Deutung?",
    options: [
      "Die lokale Änderungsrate an der Stelle 1 ist 3,31.",
      "Die Tangente hat die Steigung 3,31, weil x schon nah bei 1 liegt.",
      "Man darf x = 1 einsetzen und erhält 3.",
      "3,31 ist die Steigung der Sekante durch P(1 | 1) und Q(1,1 | 1,331); für x → 1 nähern sich die Werte 3.",
    ],
    correct: 3,
    explain: "Ein Differenzenquotient mit x ≠ x₀ ist immer eine Sekantensteigung, so nah x auch an x₀ liegt. Die lokale Änderungsrate ist der Grenzwert: (x³ − 1) : (x − 1) = x² + x + 1 → 3 für x → 1. „x = 1 einsetzen“ ergäbe 0 : 0 — erst den Faktor x − 1 kürzen, dann den Grenzwert bilden.",
  },
  "quiz-ableitung": {
    q: "Was zeigt das Funktionenmikroskop an einer Stelle, an der f differenzierbar ist?",
    options: [
      "Bei starker Vergrößerung ist der Graph um P kaum von einer Geraden mit der Steigung f′(x₀) zu unterscheiden.",
      "Bei Vergrößerung wird jeder Graph waagerecht.",
      "Bei Vergrößerung schneidet die Tangente den Graphen nicht mehr.",
      "Bei Vergrößerung sieht man immer einen Knick, weil der Graph aus Strecken gezeichnet ist.",
    ],
    correct: 0,
    explain: "Das ist die lokale Linearität: Im Kleinen verhält sich eine differenzierbare Funktion wie ihre Tangente — mit deren Steigung f′(x₀), die nicht 0 sein muss. Ein echter Knick wie bei |x² − 1| an der Stelle 1 bleibt dagegen bei jeder Vergrößerung ein Knick; dort gibt es keine Ableitung.",
  },
  "quiz-grafisch": {
    q: "Der Graph von f hat bei x = 2 einen Tiefpunkt und steigt rechts davon immer steiler an. Was gilt für den Graphen von f′?",
    options: [
      "f′ hat bei x = 2 einen Tiefpunkt.",
      "f′ ist bei x = 2 negativ und fällt rechts davon.",
      "f′ hat bei x = 2 eine Nullstelle und ist rechts davon positiv und wachsend.",
      "f′ ist überall positiv, weil f rechts von 2 steigt.",
    ],
    correct: 2,
    explain: "Am Tiefpunkt ist die Tangente waagerecht, also f′(2) = 0. Rechts davon steigt f, also ist f′ positiv, und weil f immer steiler wird, wächst f′. Ein Tiefpunkt von f ist kein Tiefpunkt von f′ — f′ beschreibt die Steigung, nicht die Höhe.",
  },
  "quiz-potenz": {
    q: `Welche Ableitung hat f(x) = ${bruch("1", "x³")}?`,
    options: [`f′(x) = ${bruch("3", "x²")}`, `f′(x) = −${bruch("3", "x²")}`, `f′(x) = ${bruch("1", "3x²")}`, `f′(x) = −${bruch("3", "x⁴")}`],
    correct: 3,
    explain: "1/x³ = x⁻³, nach der Potenzregel (x⁻³)′ = −3 · x⁻⁴ = −3/x⁴. Der Exponent wird um 1 kleiner: von −3 auf −4, nicht auf −2. Den Kehrwert der Ableitung von x³ zu nehmen, also 1/(3x²), ist kein Ableiten.",
  },
  "quiz-regeln": {
    q: "Welche Ableitung hat f(x) = 4x³ − 2x + 7?",
    options: ["f′(x) = 12x² − 2x", "f′(x) = 12x² − 2", "f′(x) = 12x² − 2 + 7", "f′(x) = 4 · 3x² − 2x + 7"],
    correct: 1,
    explain: "Summand für Summand: (4x³)′ = 4 · 3x² = 12x² nach der Faktorregel, (−2x)′ = −2 und (7)′ = 0. Der Faktor 4 bleibt stehen, der konstante Summand 7 verschwindet — er verschiebt den Graphen nur, er neigt ihn nicht.",
  },
  "quiz-sinus": {
    q: "Welche Steigung hat der Graph von f(x) = sin x an der Stelle x = π?",
    options: ["0, denn sin π = 0", "1", "−1", "π"],
    correct: 2,
    explain: "f′(π) = cos π = −1. Dass sin π = 0 ist, sagt etwas über die Höhe, nicht über die Steigung: Der Graph geht bei π mit der Steigung −1 abwärts durch die x-Achse, so wie er bei 0 mit der Steigung 1 aufwärts geht.",
  },
  "quiz-produkt-kette": {
    q: "Welche Ableitung hat f(x) = (3x − 1)⁴?",
    options: ["f′(x) = 12(3x − 1)³", "f′(x) = 4(3x − 1)³", "f′(x) = 4 · 3x³", "f′(x) = 12x³"],
    correct: 0,
    explain: "Kettenregel: außen u⁴ mit der Ableitung 4u³, innen 3x − 1 mit der Ableitung 3. Zusammen 4(3x − 1)³ · 3 = 12(3x − 1)³. Ohne den Faktor 3 fehlt die innere Ableitung — der Verstärkungsfaktor der inneren Funktion.",
  },
  "quiz-tangente": {
    q: "f(x) = x², x₀ = −1. Welche Gleichung hat die Normale im Punkt P(−1 | 1)?",
    options: ["n(x) = 2x + 3", "n(x) = 0,5x + 1,5", "n(x) = −0,5x + 0,5", "n(x) = −2x − 1"],
    correct: 1,
    explain: "f′(−1) = −2, die Normale hat die Steigung −1 : (−2) = 0,5 und geht durch P: n(x) = 0,5(x + 1) + 1 = 0,5x + 1,5. Probe: (−2) · 0,5 = −1. −2x − 1 ist die Tangente selbst; 2x + 3 nimmt nur das Negative statt des negativen Kehrwerts.",
  },
  "quiz-differenzierbar": {
    q: "Welche Aussage ist richtig?",
    options: [
      "Jede stetige Funktion ist differenzierbar.",
      "|x| ist an der Stelle 0 nicht stetig.",
      "Eine Funktion mit Knick ist an der Knickstelle nicht definiert.",
      "Jede an einer Stelle differenzierbare Funktion ist dort auch stetig.",
    ],
    correct: 3,
    explain: "Differenzierbarkeit ist die stärkere Eigenschaft: Aus ihr folgt Stetigkeit, denn f(x) − f(x₀) = Differenzenquotient · (x − x₀) → f′(x₀) · 0 = 0. Umgekehrt nicht: |x| ist bei 0 definiert (|0| = 0) und stetig, hat dort aber einen Knick und keine Ableitung.",
  },
  "quiz-ganzrational": {
    q: "Welche Funktion ist punktsymmetrisch zum Ursprung?",
    options: ["f(x) = x³ + x²", "f(x) = x⁴ − 3x", "f(x) = 2x⁵ − x³ + 4x", "f(x) = x³ − 1"],
    correct: 2,
    explain: "Nur ungerade Exponenten: 5, 3 und 1. Bei x³ − 1 steht das Absolutglied −1 = −1 · x⁰ mit dem geraden Exponenten 0 — der Graph ist um 1 nach unten verschoben und nur noch zum Punkt (0 | −1) symmetrisch.",
  },
  "quiz-nullstellen": {
    q: "f(x) = x²(x − 3)³. Was gilt?",
    options: [
      "Bei 0 berührt der Graph die x-Achse, bei 3 schneidet er sie.",
      "Bei 0 schneidet der Graph die x-Achse, bei 3 berührt er sie.",
      "f hat fünf verschiedene Nullstellen.",
      "f hat den Grad 6.",
    ],
    correct: 0,
    explain: "0 ist eine doppelte Nullstelle — gerade Vielfachheit, kein Vorzeichenwechsel, der Graph berührt. 3 ist eine dreifache Nullstelle — ungerade, Vorzeichenwechsel, der Graph schneidet (dort sogar mit waagerechter Tangente). Der Grad ist 2 + 3 = 5, es gibt aber nur zwei verschiedene Nullstellen.",
  },
  "quiz-monotonie": {
    q: "Die Ableitung einer Funktion f ist f′(x) = (x + 1)²(x − 2). Wo hat der Graph von f einen Extrempunkt?",
    options: [
      "Hochpunkt bei −1, Tiefpunkt bei 2",
      "Tiefpunkte bei −1 und bei 2",
      "Nirgends, weil f′ zwei Nullstellen hat",
      "Nur einen Tiefpunkt bei 2; bei −1 liegt ein Sattelpunkt",
    ],
    correct: 3,
    explain: "(x + 1)² ist auf beiden Seiten von −1 positiv und x − 2 dort negativ: f′ wechselt bei −1 das Vorzeichen nicht — Sattelpunkt. Bei 2 wechselt f′ von − nach +: Tiefpunkt. Eine Nullstelle von f′ ist nur ein Kandidat für einen Extrempunkt.",
  },
  "quiz-stolperstelle": {
    q: "Die Tangente an f(x) = 0,5x³ − 1,5x im Punkt mit x₀ = 1 trifft den Graphen noch ein zweites Mal. Wo?",
    options: ["bei x = 1", "bei x = −2", "bei x = −1", "nirgends — eine Tangente hat nur einen Punkt mit dem Graphen gemeinsam"],
    correct: 1,
    explain: "Die Tangente ist t(x) = −1, und f(x) − t(x) = 0,5(x − 1)²(x + 2): doppelte Nullstelle 1 (Berührpunkt) und einfache Nullstelle −2. Allgemein trifft die Tangente bei x₀ diesen Graphen noch einmal bei −2x₀. „Nur ein gemeinsamer Punkt“ gilt beim Kreis, nicht bei Funktionsgraphen.",
  },
};

// ================= Selbsteinschätzung =================
//
// Die Auswahl liegt nur im Browser dieser Person — eine Lernhilfe, keine Leistungsmessung.
const SE_PUNKTE = [
  ["sec-mittlere", "Ich kann eine mittlere Änderungsrate berechnen und als Sekantensteigung deuten — mit Einheit."],
  ["sec-lokal", "Ich kann erklären, wie aus Sekanten PQ mit x → x₀ die Tangente und die lokale Änderungsrate werden."],
  ["sec-ableitung", "Ich kann f′(x₀) als Differentialquotienten mit der x₀-Methode (oder der h-Methode) berechnen und die drei Sichten auf die Ableitung nennen."],
  ["sec-grafisch", "Ich kann zu einem Graphen den Graphen der Ableitungsfunktion skizzieren."],
  ["sec-potenz", "Ich kann die Ableitungsfunktion erst an einer Stelle, dann allgemein herleiten und die Potenzregel anwenden — auch bei negativen Exponenten und bei √x."],
  ["sec-regeln", "Ich kann ganzrationale Funktionen mit Faktor- und Summenregel ableiten."],
  ["sec-sinus", "Ich kenne die Ableitungen von sin und cos und weiß, warum sie nur im Bogenmaß gelten."],
  ["sec-produkt-kette", "Ich kann Produkte und Verkettungen ableiten."],
  ["sec-tangente", "Ich kann Tangente und Normale aufstellen und Steigungs- und Schnittwinkel berechnen."],
  ["sec-differenzierbar", "Ich kann prüfen, ob eine Funktion an einer Stelle differenzierbar ist."],
  ["sec-ganzrational", "Ich kann am Term den Verlauf für x → ±∞ und die Symmetrie einer ganzrationalen Funktion ablesen."],
  ["sec-nullstellen", "Ich kann Nullstellen durch Faktorisieren, Ausklammern und Substitution bestimmen und ihre Vielfachheit deuten."],
  ["sec-monotonie", "Ich kann aus f′ ablesen, wo f steigt und fällt und wo Hoch-, Tief- und Sattelpunkte liegen."],
  ["sec-stolperstelle", "Ich weiß, dass eine Tangente den Graphen an anderer Stelle schneiden darf."],
];
const SE_SCHLUESSEL = "uplant-mss11-differentialrechnung-selbsteinschaetzung";

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
  if (!Object.keys(stand).length) aus.textContent = "Noch nichts angekreuzt.";
  else if (unsicher.length) aus.innerHTML = `Wiederhole zuerst: ${unsicher.map(([id]) => `<a href="#${id}">${document.querySelector(`#${id} h2`).textContent}</a>`).join(", ")}. Danach passen die Übungsaufgaben auf den Stufen „einfach“ und „mittel“.`;
  else aus.textContent = `${sicher} von ${SE_PUNKTE.length} Punkten sicher — probier dich an den Aufgaben auf den Stufen „schwierig“ und „komplex“.`;
}

// ================= Start =================

// Wählt man eine andere Funktion, bekommt der x₀-Regler den Bereich dieser Funktion — vor dem
// Zeichnen, sonst stünde der Regler kurz auf einer Stelle, an der f gar nicht definiert ist.
const BEREICHE = { "mr-art": mrBereich, "lr-art": lrBereich, "gd-art": gdBereich, "mo-art": moBereich };
const REGLER = [
  [["mr-art", "mr-a", "mr-b"], renderMittlere],
  [["lr-art", "lr-x", "lr-h"], renderLokal],
  [["fm-art", "fm-x", "fm-z"], renderMikroskop],
  [["gd-art", "gd-x", "gd-ganz"], renderGrafisch],
  [["pq-x", "pq-h"], renderQuadrat],
  [["rg-art", "rg-x", "rg-k"], renderRegeln],
  [["si-x", "si-h"], renderSinus],
  [["pk-art", "pk-x", "pk-h"], renderProduktKette],
  [["tn-art", "tn-x", "tn-d", "tn-m"], renderTangente],
  [["df-art", "df-m", "df-h"], renderDifferenzierbar],
  [["gr-modus", "gr-f", "gr-z", "gr-t"], renderGanzrational],
  [["ns-r1", "ns-k1", "ns-r2", "ns-k2", "ns-q"], renderNullstellen],
  [["mo-art", "mo-x"], renderMonotonie],
  [["sp-x"], renderStolperstelle],
];
for (const bereich of Object.values(BEREICHE)) bereich();
// Der Reiter im Sekanten-Widget schaltet die Schreibweise um; die übrigen Reiter zeigen nur Text.
verdrahteReiter((name) => { if (name === "lr") renderLokal(); });
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
