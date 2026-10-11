// Selbstlernpfad „Integration weiterer Funktionen“ (MSS 11, Analysis, Thema 4.2 — Leistungskurs, die
// Abschnitte zur e-Funktion auch Grundkurs). Vanilla-JS, kein Build.
//
// Didaktische Reihenfolge — jede Stufe benutzt nur, was davor steht; die Grundkurs-Abschnitte (1–4, 10)
// kommen ohne die Leistungskurs-Abschnitte (5–9) aus:
//    1. Vergleich                 (Hauptsatz und Potenzregel aus Thema 4.1; Ableitungen aus Thema 2.2)
//    2. Stammfunktion von e^(kx)  ((e^(kx))′ = k · e^(kx) rückwärts: durch k teilen)
//    3. Ansatz für p(x) · e^(kx)  (Produktregel mit Ausklammern aus Thema 2.2, Koeffizientenvergleich)
//    4. Bestand aus einer e-Rate  (Rekonstruktion aus Thema 4.1, Grenzwert für t → ∞, ln aus Thema 2.2)
//    5. Sinus und Kosinus     LK  (Ableitungen von sin und cos aus Thema 2.2 rückwärts)
//    6. Lineare Verkettung    LK  (Kettenregel aus Thema 2.2 rückwärts)
//    7. 1/x und ln            LK  ((ln x)′ = 1/x aus Thema 2.2; die Lücke der Potenzregel)
//    8. Uneigentliche Integrale LK (Grenzwert aus Thema 1.2; e^(−x) aus 2; ln aus 7 für die Divergenz)
//    9. Rotationskörper       LK  (Scheiben statt Streifen, Ober- und Untersummen aus Thema 4.1; e aus 2)
//   10. Stolperstelle             (Produktregel aus Thema 2.2, Ansatz aus 3)
//
// Gerechnet wird mit Reglerwerten und exakten Stammfunktionen, nie mit Bildschirmkoordinaten. Die
// Flächen werden als Vielecke gezeichnet, an den Nullstellen geteilt; die Prüfung misst sie mit der
// Gaußschen Trapezformel nach und leitet die gezeichneten Stammfunktionen numerisch ab.
//
// Farbcodierung: f blau, Stammfunktion grün, der falsche Versuch rot gestrichelt; orientierte Fläche
// über der Achse grün, darunter orange; Tangenten violett; Zuwachs und Asymptote rot.

import { mountUebungsaufgaben } from "../../../aufgaben.js?v=3";
import { AUFGABEN, parseZahl } from "./aufgaben-weitere-funktionen-integrieren.js?v=1";


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

// ---------- Zusätzliche Helfer für Thema 4.2 ----------

const gleich = (x, stellen = 4) => `${zeichen(x, stellen)} ${num(x, stellen)}`;
// Integral mit Grenzen als HTML: ∫ mit b oben, a unten.
const intZ = (a, b) => `<span class="integral"><span class="zeichen">∫</span><span class="grenzen"><span class="o">${b}</span><span class="u">${a}</span></span></span>`;
const klammer = (inhalt, a, b) => `<span class="integral">[${inhalt}]<span class="grenzen"><span class="o">${b}</span><span class="u">${a}</span></span></span>`;
const eh = (e) => `e<sup>${e}</sup>`;
// k · x ohne „1x“: kx(−1) = „−x“, kx(0,5) = „0,5x“.
function kx(k, v = "x") {
  return k === 1 ? v : k === -1 ? `−${v}` : `${num(k)}${v}`;
}
// Ein Vorfaktor ohne „1“: faktor(−1) = „−“, faktor(0,5) = „0,5“.
function faktor(a) {
  return a === 1 ? "" : a === -1 ? "−" : num(a);
}
// Die Steigung eines gezeichneten Graphen an x₀ — nur für die Tangente, gerechnet wird mit der Formel.
const tangente = (K, m, x0, y0, klasse, rolle) => gerade(K, m, x0, y0, klasse, { "data-rolle": rolle });

// Die Fläche zwischen den Graphen von f und g über [a; b] als Vielecke. Geteilt wird an den
// Nullstellen von f − g (Bisektion zwischen Stützstellen), damit jedes Stück ein Vorzeichen hat;
// das Stück trägt es als data-vorzeichen, die Prüfung misst seinen Inhalt nach.
function flaechen(K, f, g, a, b, { pos = "dr-flaeche-pos", neg = "dr-flaeche-neg", rolle = "flaeche", n = 240 } = {}) {
  const lo = Math.min(a, b), hi = Math.max(a, b);
  if (hi - lo < 1e-12) return;
  const d = (x) => f(x) - g(x);
  const grenzen = [lo];
  for (let i = 0; i < n; i++) {
    let p = lo + ((hi - lo) * i) / n, q = lo + ((hi - lo) * (i + 1)) / n;
    // Eine Nullstelle genau auf einer Stützstelle (etwa x = π) zeigt kein Vorzeichenpaar „+ −“ —
    // ohne diesen Fall würden die Stücke links und rechts davon zu einem verschmolzen und falsch gefärbt.
    if (i + 1 < n && Math.abs(d(q)) < 1e-12) { grenzen.push(q); continue; }
    if (d(p) * d(q) < 0) {
      for (let k = 0; k < 50; k++) { const m = (p + q) / 2; if (d(m) * d(p) > 0) p = m; else q = m; }
      // Eine „Nullstelle“ am Rand ist Rundungsrauschen und kein Teilungspunkt.
      const z = (p + q) / 2;
      if (z > lo + 1e-9 && z < hi - 1e-9) grenzen.push(z);
    }
  }
  grenzen.push(hi);
  for (let j = 0; j + 1 < grenzen.length; j++) {
    const u = grenzen[j], o = grenzen[j + 1];
    const m = Math.max(2, Math.ceil(((o - u) / (hi - lo)) * n));
    const oben = [], unten = [];
    for (let i = 0; i <= m; i++) {
      const x = u + ((o - u) * i) / m;
      oben.push([x, f(x)]);
      unten.push([x, g(x)]);
    }
    const vz = d((u + o) / 2) >= 0 ? "+" : "-";
    vieleck(K, [...oben, ...unten.reverse()], vz === "+" ? pos : neg, { "data-rolle": rolle, "data-vorzeichen": vz });
  }
}
// Orientierte Teilflächen über [lo; hi], an den Nullstellen geteilt — exakt aus der Stammfunktion.
function teilflaechen(F, nullstellen, lo, hi) {
  const g = [lo, ...nullstellen.filter((z) => z > lo + 1e-12 && z < hi - 1e-12), hi];
  const out = [];
  for (let i = 0; i + 1 < g.length; i++) out.push({ von: g[i], bis: g[i + 1], wert: F(g[i + 1]) - F(g[i]) });
  return out;
}
// Der Zuwachs F(b) − F(a) als senkrechte Strecke bei b im Bild der Stammfunktion: von der Höhe F(a)
// bis F(b). Er ist so lang, wie die Fläche oben groß ist — das zeigt der Hauptsatz.
function zuwachs(K, F, a, b) {
  strecke(K, a, F(a), b, F(a), "dr-schranke-r", { "data-rolle": "hoehe-a" });
  strecke(K, b, F(a), b, F(b), "dr-zuwachs", { "data-rolle": "zuwachs" });
  punkt(K, a, F(a), "dr-punkt-t", { "data-rolle": "F-a" });
  punkt(K, b, F(b), "dr-punkt-t", { "data-rolle": "F-b" });
}

// ================= 1. Vergleich =================
// a ist die untere Grenze: bei 1/x 0,25 (0 liegt nicht im Definitionsbereich), sonst 0. So liegt b
// am Regler (ab 0,25) nie unter a, und die Fläche ist immer „von a nach rechts“.
const VG = {
  potenz: { titel: "x²", f: (x) => x * x, F: (x) => x ** 3 / 3, a: 0, ft: "x²", Ft: `${bruch("1", "3")}x³`, abl: `${bruch("1", "3")} · 3x² = x²`, y: [-0.6, 9.6], yF: [-0.6, 9.6],
    text: "Wie in Thema 4.1: Exponent erhöhen, durch den neuen Exponenten teilen. Der Zuwachs der Stammfunktion zwischen a und b (rot unten) ist genau die grüne Fläche oben." },
  e: { titel: "e^x", f: Math.exp, F: Math.exp, a: 0, ft: eh("x"), Ft: eh("x"), abl: eh("x"), y: [-1, 21], yF: [-1, 21],
    text: "eˣ ist seine eigene Stammfunktion — aber F(0) = e⁰ = 1, nicht 0. Die untere Grenze zählt mit: Die Fläche ist F(b) − 1." },
  ek: { titel: "e^(−0,5x)", f: (x) => Math.exp(-0.5 * x), F: (x) => -2 * Math.exp(-0.5 * x), a: 0, ft: eh("−0,5x"), Ft: `−2${eh("−0,5x")}`, abl: `−2 · (−0,5) · ${eh("−0,5x")} = ${eh("−0,5x")}`, y: [-0.1, 1.15], yF: [-2.2, 0.2],
    text: "Durch k = −0,5 geteilt: Die Stammfunktion −2e^(−0,5x) ist überall negativ — und steigt trotzdem. Es zählt nur ihr Zuwachs." },
  produkt: { titel: "x · e^x", f: (x) => x * Math.exp(x), F: (x) => (x - 1) * Math.exp(x), a: 0, ft: `x · ${eh("x")}`, Ft: `(x − 1) · ${eh("x")}`, abl: `${eh("x")} + (x − 1) · ${eh("x")} = x · ${eh("x")}`, y: [-2, 62], yF: [-2, 42],
    text: "Kein „Faktor für Faktor“: Die Stammfunktion (x − 1) · eˣ kommt aus dem Ansatz in Abschnitt 3 — ½x² · eˣ wäre falsch (Abschnitt 10)." },
  sinus: { titel: "sin(x)", f: Math.sin, F: (x) => -Math.cos(x), a: 0, ft: "sin(x)", Ft: "−cos(x)", abl: "−(−sin(x)) = sin(x)", y: [-1.2, 1.2], yF: [-1.2, 1.2],
    text: "(LK) Die Stammfunktion von sin ist −cos, nicht cos. Der Zuwachs von −cos zwischen 0 und b ist 1 − cos(b) — nie mehr als 2." },
  kehr: { titel: "1/x", f: (x) => 1 / x, F: Math.log, a: 0.25, ft: bruch("1", "x"), Ft: "ln(x)", abl: bruch("1", "x"), y: [-0.2, 4.4], yF: [-1.6, 1.3],
    text: "(LK) Die Lücke der Potenzregel: x⁻¹ hat keine Potenz als Stammfunktion, sondern ln(x). Untere Grenze 0,25, denn bei 0 ist 1/x nicht definiert." },
};
function renderVergleich() {
  const art = wahl("vg-art"), d = VG[art];
  const b = reglerRaster("vg-b"), a = d.a;
  setzeAnzeige("vg-b-anzeige", num(b));
  const x0 = art === "kehr" ? 0.15 : 0;
  const K1 = koordinatenXY({ hoehe: 230, xmin: x0 - 0.15, xmax: 3.2, ymin: d.y[0], ymax: d.y[1], panel: "f" });
  panelTitel(K1, `f(x) = ${d.titel}`);
  flaechen(K1, d.f, () => 0, a, b);
  graph(K1, d.f, x0, 3.2, { schritte: 400 });
  strecke(K1, a, d.y[0], a, d.y[1], "dr-intervallrand", { "data-rolle": "grenze-a" });
  strecke(K1, b, d.y[0], b, d.y[1], "dr-intervallrand", { "data-rolle": "grenze-b" });
  const K2 = koordinatenXY({ hoehe: 200, xmin: x0 - 0.15, xmax: 3.2, ymin: d.yF[0], ymax: d.yF[1], panel: "F", yName: "F" });
  panelTitel(K2, "Stammfunktion F");
  graph(K2, d.F, x0, 3.2, { schritte: 400, basis: "dr-stamm", rolle: "stamm" });
  zuwachs(K2, d.F, a, b);
  zeige("vg-mount", K1.svg, K2.svg);
  const I = d.F(b) - d.F(a);
  setzeHtml("vg-bilanz",
    `f(x) = ${d.ft}; Stammfunktion F(x) = ${d.Ft}; Probe: F′(x) = ${d.abl} ✓<br>` +
    `${intZ(num(a), num(b))} f(x) dx = F(${num(b)}) − F(${num(a)}) ${zeichen(d.F(b))} ${num(d.F(b))} − ${numK(d.F(a))} ${zeichen(I)} <span class="wc">${num(I)}</span> — so groß ist die grüne Fläche und so lang der rote Zuwachs.`);
  setzeText("vg-text", d.text);
}

// ================= 2. Stammfunktionen von e^(kx) =================
// k springt über 0 hinweg: e^(0x) = 1 ist keine e-Funktion mehr, und 1/k gäbe es nicht.
const EK_K = [-2, -1, -0.5, 0.5, 1, 2];
function renderEkx() {
  const k = EK_K[reglerRaster("ek-k")], b = reglerRaster("ek-b");
  setzeAnzeige("ek-k-anzeige", num(k));
  setzeAnzeige("ek-b-anzeige", num(b));
  const f = (x) => Math.exp(k * x), F = (x) => Math.exp(k * x) / k, falsch = (x) => k * Math.exp(k * x);
  // Bei k = ±1 ist k = 1/k: Richtige und falsche Stammfunktion fallen zusammen.
  const eins = Math.abs(k) === 1;
  const K1 = koordinatenXY({ hoehe: 210, xmin: -1, xmax: 2, ymin: -0.5, ymax: 7.5, panel: "f" });
  // „e^x“ statt „e^(x)“: die Klammer nur, wo der Exponent mehr als ein Zeichen hat.
  const ex = k === 1 ? "e^x" : `e^(${kx(k)})`;
  panelTitel(K1, `f(x) = ${ex}`);
  flaechen(K1, f, () => 0, 0, b);
  graph(K1, f, -1, 2, { schritte: 400 });
  strecke(K1, b, -0.5, b, 7.5, "dr-intervallrand", { "data-rolle": "grenze-b" });
  // Beide Kandidaten im selben Bild: grün die richtige Stammfunktion, rot gestrichelt k · e^(kx).
  const K2 = koordinatenXY({ hoehe: 230, xmin: -1, xmax: 2, ymin: -7.5, ymax: 7.5, panel: "F", yName: "F" });
  panelTitel(K2, `grün: ${faktor(1 / k)}${ex} · rot: ${faktor(k)}${ex}`);
  graph(K2, falsch, -1, 2, { schritte: 400, basis: "dr-falsch", rolle: "falsch" });
  graph(K2, F, -1, 2, { schritte: 400, basis: "dr-stamm", rolle: "stamm" });
  tangente(K2, k * k * Math.exp(k * b), b, falsch(b), "dr-falsch-tangente", "tangente-falsch");
  tangente(K2, f(b), b, F(b), "dr-tangente2", "tangente");
  punkt(K2, b, F(b), "dr-punkt-t", { "data-rolle": "F-b" });
  zeige("ek-mount", K1.svg, K2.svg);
  const I = F(b) - F(0);
  setzeHtml("ek-bilanz",
    `F(x) = ${faktor(1 / k)}${eh(kx(k))}: F′(x) = ${eins ? (k === 1 ? "" : "(−1) · (−1) · ") : `${num(1 / k)} · ${numK(k)} · `}${eh(kx(k))}${k === 1 ? "" : ` = ${eh(kx(k))}`} ✓ — bei b: Steigung F′(${num(b)}) ${gleich(f(b))} = f(${num(b)}).<br>` +
    `Rot: (${faktor(k)}${eh(kx(k))})′ = ${eins ? "" : `${num(k * k)} · `}${eh(kx(k))} — bei b also ${gleich(k * k * f(b))}${eins ? " — bei k = ±1 ist k = 1/k, hier fällt der Fehler nicht auf." : `, das ${num(k * k)}-Fache von f(${num(b)}).`}<br>` +
    `${intZ("0", num(b))} ${eh(kx(k))} dx = F(${num(b)}) − F(0) = ${num(1 / k)} · (${eh(num(k * b))} − 1) ${zeichen(I)} <span class="wc">${num(I)}</span>`);
  setzeText("ek-text", b < 0
    ? "b < 0: Die obere Grenze liegt links von der unteren — das Integral ist negativ, obwohl e^(kx) überall positiv ist."
    : k < 0
      ? "k < 0: Die Stammfunktion 1/k · e^(kx) ist negativ, steigt aber — ihre Steigung ist e^(kx) > 0."
      : "Die grüne Kurve hat an jeder Stelle die Steigung f; die rote ist zu steil oder zu flach, sobald k ≠ ±1.");
}

// ================= 3. Ansatz für p(x) · e^(kx) =================
// Die Stammfunktionen sind hier fest hinterlegt — die Bilanz rechnet den Ansatz vor, die Prüfung
// leitet F numerisch ab und vergleicht mit f.
const AN = {
  a: { f: (x) => x * Math.exp(x), F: (x) => (x - 1) * Math.exp(x), y: [-1.2, 31], yF: [-1.5, 19],
    titel: "f(x) = x · e^x", weg: `Ansatz F(x) = (Ax + B) · ${eh("x")} ⟹ F′(x) = A · ${eh("x")} + (Ax + B) · ${eh("x")} = (Ax + A + B) · ${eh("x")}<br>Vergleich mit x · ${eh("x")}: A = 1, A + B = 0 ⟹ B = −1 ⟹ <span class="wa">F(x) = (x − 1) · ${eh("x")}</span>` },
  b: { f: (x) => x * Math.exp(-x), F: (x) => -(x + 1) * Math.exp(-x), y: [-15.5, 1.5], yF: [-1.5, 7.8],
    titel: "f(x) = x · e^(−x)", weg: `Ansatz F(x) = (Ax + B) · ${eh("−x")} ⟹ F′(x) = A · ${eh("−x")} − (Ax + B) · ${eh("−x")} = (−Ax + A − B) · ${eh("−x")}<br>Vergleich mit x · ${eh("−x")}: −A = 1, A − B = 0 ⟹ A = −1, B = −1 ⟹ <span class="wa">F(x) = −(x + 1) · ${eh("−x")}</span>` },
  c: { f: (x) => (2 * x + 1) * Math.exp(0.5 * x), F: (x) => (4 * x - 6) * Math.exp(0.5 * x), y: [-1.5, 21.5], yF: [-7, 14.5],
    titel: "f(x) = (2x + 1) · e^(0,5x)", weg: `Ansatz F(x) = (Ax + B) · ${eh("0,5x")} ⟹ F′(x) = A · ${eh("0,5x")} + (Ax + B) · 0,5${eh("0,5x")} = (0,5Ax + A + 0,5B) · ${eh("0,5x")}<br>Vergleich mit (2x + 1) · ${eh("0,5x")}: 0,5A = 2 ⟹ A = 4; 4 + 0,5B = 1 ⟹ B = −6 ⟹ <span class="wa">F(x) = (4x − 6) · ${eh("0,5x")}</span>` },
  d: { f: (x) => x * x * Math.exp(-x), F: (x) => -(x * x + 2 * x + 2) * Math.exp(-x), y: [-1, 30.5], yF: [-15.5, 1],
    titel: "f(x) = x² · e^(−x)", weg: `Ansatz F(x) = (Ax² + Bx + C) · ${eh("−x")} ⟹ F′(x) = (−Ax² + (2A − B)x + B − C) · ${eh("−x")}<br>Vergleich mit x² · ${eh("−x")}: −A = 1, 2A − B = 0, B − C = 0 ⟹ A = −1, B = −2, C = −2 ⟹ <span class="wa">F(x) = −(x² + 2x + 2) · ${eh("−x")}</span>` },
};
function renderAnsatz() {
  const d = AN[wahl("an-art")], x0 = reglerRaster("an-x");
  setzeAnzeige("an-x-anzeige", num(x0));
  const K1 = koordinatenXY({ hoehe: 230, xmin: -2, xmax: 2.5, ymin: d.yF[0], ymax: d.yF[1], panel: "F", yName: "F" });
  panelTitel(K1, "Stammfunktion F aus dem Ansatz");
  graph(K1, d.F, -2, 2.5, { schritte: 400, basis: "dr-stamm", rolle: "stamm" });
  tangente(K1, d.f(x0), x0, d.F(x0), "dr-tangente2", "tangente");
  punkt(K1, x0, d.F(x0), "dr-punkt-t", { "data-rolle": "p-F" });
  const K2 = koordinatenXY({ hoehe: 200, xmin: -2, xmax: 2.5, ymin: d.y[0], ymax: d.y[1], panel: "f" });
  panelTitel(K2, d.titel);
  graph(K2, d.f, -2, 2.5, { schritte: 400 });
  punkt(K2, x0, d.f(x0), "fr-punkt", { "data-rolle": "p-f" });
  zeige("an-mount", K1.svg, K2.svg);
  setzeHtml("an-bilanz", `${d.weg}<br>Probe an der Stelle ${num(x0)}: Die Tangente an F hat die Steigung <span class="wr">${num(d.f(x0))}</span> = f(${num(x0)}).`);
  setzeText("an-text", Math.abs(d.f(x0)) < 1e-9
    ? "Hier ist f(x₀) = 0 — F hat eine waagerechte Tangente: Wo die Rate null ist, ist der Bestand extremal."
    : d.f(x0) > 0
      ? "f(x₀) > 0: F steigt an dieser Stelle, und zwar genau so steil, wie f hoch ist."
      : "f(x₀) < 0: F fällt an dieser Stelle — die Steigung der Tangente ist der (negative) Funktionswert.");
}

// ================= 4. Bestand aus einer e-Rate =================
const BS_B0 = 20;
function renderBestand() {
  const a = reglerRaster("bs-a"), k = reglerRaster("bs-k"), t = reglerRaster("bs-t");
  setzeAnzeige("bs-a-anzeige", num(a));
  setzeAnzeige("bs-k-anzeige", num(k));
  setzeAnzeige("bs-t-anzeige", num(t));
  const r = (s) => a * Math.exp(-k * s), B = (s) => BS_B0 + (a / k) * (1 - Math.exp(-k * s));
  const grenze = BS_B0 + a / k, th = Math.LN2 / k;
  const K1 = koordinatenXY({ hoehe: 210, xmin: 0, xmax: 30, ymin: 0, ymax: 21, panel: "r", xName: "t", yName: "r" });
  panelTitel(K1, `r(t) = ${num(a)} · e^(−${num(k)}t)`);
  flaechen(K1, r, () => 0, 0, t);
  graph(K1, r, 0, 30, { schritte: 400 });
  if (th <= 30) {
    strecke(K1, th, 0, th, a / 2, "dr-schranke-r", { "data-rolle": "halbwert" });
    punkt(K1, th, a / 2, "dr-punkt-t", { "data-rolle": "p-halb" });
  }
  // Der Bildbereich von B reicht bis knapp über die Grenze — die Asymptote bleibt sichtbar.
  // Der Bildbereich reicht ein Viertel über die Grenze — sonst läuft die Asymptote durch den Titel.
  const K2 = koordinatenXY({ hoehe: 220, xmin: 0, xmax: 30, ymin: 0, ymax: grenze * 1.25, panel: "B", xName: "t", yName: "B" });
  panelTitel(K2, "Bestand B(t)");
  strecke(K2, 0, grenze, 30, grenze, "dr-asymptote", { "data-rolle": "asymptote" });
  graph(K2, B, 0, 30, { schritte: 400, basis: "dr-stamm", rolle: "stamm" });
  strecke(K2, t, BS_B0, t, B(t), "dr-zuwachs", { "data-rolle": "zuwachs" });
  punkt(K2, t, B(t), "dr-punkt-t", { "data-rolle": "p-B" });
  zeige("bs-mount", K1.svg, K2.svg);
  const Z = B(t) - BS_B0;
  setzeHtml("bs-bilanz",
    `Zugeflossen bis t = ${num(t)}: ${intZ("0", num(t))} ${num(a)} · ${eh(`−${num(k)}s`)} ds = ${bruch(num(a), num(k))} · (1 − ${eh(num(-k * t))}) ${zeichen(Z)} <span class="wa">${num(Z)}</span> m³ (grüne Fläche)<br>` +
    `B(${num(t)}) = ${BS_B0} + ${num(Z)} ${zeichen(B(t))} <span class="wc">${num(B(t))}</span> m³; Grenze für t → ∞: ${BS_B0} + ${bruch(num(a), num(k))} ${zeichen(grenze)} <span class="wg">${num(grenze)}</span> m³<br>` +
    `Die Rate halbiert sich nach t<sub>½</sub> = ${bruch("ln 2", num(k))} ${gleich(th)} Stunden.`);
  setzeText("bs-text", t === 0
    ? "t = 0: Es ist noch nichts zugeflossen; der Bestand ist der Anfangsbestand."
    : Z > 0.95 * (a / k)
      ? `Über 95 % des gesamten Zuflusses sind schon da — die Kurve klebt an der Grenze, obwohl die Rate noch ${num(r(t), 2)} m³ pro Stunde beträgt.`
      : "Der Bestand wächst, aber immer langsamer: Jede Stunde kommt weniger dazu als in der vorigen.");
}

// ================= 5. Sinus und Kosinus =================
const PI4 = ["0", "π/4", "π/2", "3π/4", "π", "5π/4", "3π/2", "7π/4", "2π"];
const SN = {
  sin: { f: Math.sin, F: (x) => -Math.cos(x), ft: "sin(x)", Ft: "−cos(x)", nullstellen: [0, Math.PI, 2 * Math.PI] },
  cos: { f: Math.cos, F: Math.sin, ft: "cos(x)", Ft: "sin(x)", nullstellen: [Math.PI / 2, (3 * Math.PI) / 2] },
};
function renderSinus() {
  const art = wahl("sn-art"), d = SN[art];
  const ia = reglerRaster("sn-a"), ib = reglerRaster("sn-b");
  const a = (ia * Math.PI) / 4, b = (ib * Math.PI) / 4;
  setzeAnzeige("sn-a-anzeige", PI4[ia]);
  setzeAnzeige("sn-b-anzeige", PI4[ib]);
  const K1 = koordinatenXY({ hoehe: 200, xmin: -0.3, xmax: 6.6, ymin: -1.3, ymax: 1.3, panel: "f" });
  panelTitel(K1, `f(x) = ${d.ft}`);
  flaechen(K1, d.f, () => 0, a, b);
  graph(K1, d.f, -0.3, 6.6, { schritte: 500 });
  strecke(K1, a, -1.3, a, 1.3, "dr-intervallrand", { "data-rolle": "grenze-a" });
  strecke(K1, b, -1.3, b, 1.3, "dr-intervallrand", { "data-rolle": "grenze-b" });
  const K2 = koordinatenXY({ hoehe: 200, xmin: -0.3, xmax: 6.6, ymin: -1.3, ymax: 1.3, panel: "F", yName: "F" });
  panelTitel(K2, `F(x) = ${d.Ft}`);
  graph(K2, d.F, -0.3, 6.6, { schritte: 500, basis: "dr-stamm", rolle: "stamm" });
  zuwachs(K2, d.F, a, b);
  zeige("sn-mount", K1.svg, K2.svg);
  const I = d.F(b) - d.F(a);
  const lo = Math.min(a, b), hi = Math.max(a, b);
  const teile = teilflaechen(d.F, d.nullstellen, lo, hi);
  const plus = teile.filter((s) => s.wert > 0).reduce((s, x) => s + x.wert, 0);
  const minus = -teile.filter((s) => s.wert < 0).reduce((s, x) => s + x.wert, 0);
  const Fb = d.F(b), Fa = d.F(a);
  setzeHtml("sn-bilanz",
    `${intZ(PI4[ia], PI4[ib])} ${d.ft} dx = ${klammer(d.Ft, PI4[ia], PI4[ib])} = F(${PI4[ib]}) − F(${PI4[ia]}) ${zeichen(Fb)} ${num(Fb)} − ${numK(Fa)} ${zeichen(I)} <span class="wc">${num(I)}</span><br>` +
    `Fläche über der Achse (grün) ${gleich(plus)}, unter der Achse (orange) ${gleich(minus)}` + (ia === ib ? "." : ia < ib ? `; ${num(plus)} − ${num(minus)} ${gleich(plus - minus)}.` : `; weil a &gt; b, zählt alles umgekehrt: −(${num(plus)} − ${num(minus)}) ${gleich(minus - plus)}.`));
  setzeText("sn-text", ia === ib
    ? "a = b: kein Streifen, das Integral ist 0."
    : Math.abs(I) < 1e-9 && plus > 1e-9
      ? "Das Integral ist 0, obwohl Fläche da ist: Die Stücke über und unter der Achse sind gleich groß und heben sich auf."
      : "Der rote Zuwachs der Stammfunktion ist genau die Bilanz der Flächen oben — grün positiv, orange negativ.");
}

// ================= 6. Lineare Verkettung =================
// Die innere Funktion ist mx + n mit festem n je Beispiel; m springt über 0 hinweg (durch 0 teilen
// gibt es nicht). Die Bildbereiche hängen nur vom Beispiel ab, nicht von m — sonst sprängen die Achsen.
const VK_M = [0.5, 1, 2, 3];
const VK = {
  cos: { g: Math.cos, G: Math.sin, n: 0, ft: (m) => `cos(${kx(m)})`, Gt: (m) => `sin(${kx(m)})`, y: [-1.3, 1.3], yF: [-2.2, 2.2] },
  pot: { g: (u) => u * u, G: (u) => u ** 3 / 3, n: 1, ft: (m) => `(${kx(m)} + 1)²`, Gt: (m) => `${bruch(`(${kx(m)} + 1)³`, "3")}`, y: [-0.5, 16.5], yF: [-3, 22] },
  e: { g: Math.exp, G: Math.exp, n: -1, ft: (m) => eh(`${kx(m)} − 1`), Gt: (m) => eh(`${kx(m)} − 1`), y: [-0.3, 7.6], yF: [-0.3, 7.6] },
};
function renderVerkettung() {
  const art = wahl("vk-art"), d = VK[art];
  const m = VK_M[reglerRaster("vk-m")], x0 = reglerRaster("vk-x");
  setzeAnzeige("vk-m-anzeige", num(m));
  setzeAnzeige("vk-x-anzeige", num(x0));
  const f = (x) => d.g(m * x + d.n), F = (x) => d.G(m * x + d.n) / m, falsch = (x) => d.G(m * x + d.n);
  const K1 = koordinatenXY({ hoehe: 230, xmin: -1, xmax: 1, ymin: d.yF[0], ymax: d.yF[1], panel: "F", yName: "F" });
  panelTitel(K1, "grün: mit 1/m · rot: ohne");
  graph(K1, falsch, -1, 1, { schritte: 400, basis: "dr-falsch", rolle: "falsch" });
  graph(K1, F, -1, 1, { schritte: 400, basis: "dr-stamm", rolle: "stamm" });
  tangente(K1, m * f(x0), x0, falsch(x0), "dr-falsch-tangente", "tangente-falsch");
  tangente(K1, f(x0), x0, F(x0), "dr-tangente2", "tangente");
  punkt(K1, x0, F(x0), "dr-punkt-t", { "data-rolle": "p-F" });
  const K2 = koordinatenXY({ hoehe: 190, xmin: -1, xmax: 1, ymin: d.y[0], ymax: d.y[1], panel: "f" });
  panelTitel(K2, `f(x) = ${d.ft(m).replace(/<sup>(.*?)<\/sup>/g, "^($1)")}`);
  graph(K2, f, -1, 1, { schritte: 400 });
  punkt(K2, x0, f(x0), "fr-punkt", { "data-rolle": "p-f" });
  zeige("vk-mount", K1.svg, K2.svg);
  setzeHtml("vk-bilanz",
    `F(x) = ${m === 1 ? "" : `${bruch("1", num(m))} · `}${d.Gt(m)}: F′(x) = ${m === 1 ? "" : `${bruch("1", num(m))} · `}${d.ft(m)}${m === 1 ? "" : ` · ${num(m)}`} = ${d.ft(m)} ✓ — bei x₀: Steigung <span class="wr">${num(f(x0))}</span> = f(${num(x0)}).<br>` +
    (m === 1
      ? "Bei m = 1 ist die innere Ableitung 1 — es gibt nichts zu teilen, beide Kurven fallen zusammen."
      : `Ohne das Teilen (rot): (${d.Gt(m)})′ = ${d.ft(m)} · ${num(m)} — bei x₀ also <span class="wg">${num(m * f(x0))}</span>, das ${num(m)}-Fache von f(${num(x0)}).`));
  setzeText("vk-text", m < 1
    ? "m < 1: Durch m zu teilen heißt hier vervielfachen — die richtige Stammfunktion ist das 1/m-Fache von G(mx + n), gestreckt statt gestaucht."
    : m === 1 ? "m = 1: Hier ist f einfach g, nur verschoben — die Stammfunktion ist G, verschoben." : "m > 1: Die Kettenregel liefert beim Ableiten den Faktor m — die Stammfunktion muss ihn vorher wegteilen.");
}

// ================= 7. Die Lücke n = −1 =================
// n läuft auf −1 zu und wieder weg; für n ≠ −1 liefert die Potenzregel (bⁿ⁺¹ − 1)/(n + 1), für
// n = −1 ist es ln(b). Untere Grenze 1, damit alle Stammfunktionen dort 0 sind und sich vergleichen lassen.
const LN_N = [-2, -1.5, -1.2, -1.1, -1, -0.9, -0.8, -0.5, 0];
const potHtml = (n) => (n === 0 ? "x⁰ = 1" : `x<sup>${num(n)}</sup>`);
function renderLn() {
  const n = LN_N[reglerRaster("ln-n")], b = reglerRaster("ln-b");
  setzeAnzeige("ln-n-anzeige", num(n));
  setzeAnzeige("ln-b-anzeige", num(b));
  const f = (x) => Math.pow(x, n);
  const G = n === -1 ? Math.log : (x) => (Math.pow(x, n + 1) - 1) / (n + 1);
  const K1 = koordinatenXY({ hoehe: 210, xmin: 0, xmax: 5.2, ymin: -0.2, ymax: 4.4, panel: "f" });
  panelTitel(K1, n === -1 ? "f(x) = 1/x" : `f(x) = x^(${num(n)}) · gestrichelt: 1/x`);
  flaechen(K1, f, () => 0, 1, b);
  if (n !== -1) graph(K1, (x) => 1 / x, 0.15, 5.2, { schritte: 300, basis: "dr-nachbar", rolle: "kehrwert" });
  graph(K1, f, 0.15, 5.2, { schritte: 400 });
  strecke(K1, 1, -0.2, 1, 4.4, "dr-intervallrand", { "data-rolle": "grenze-a" });
  strecke(K1, b, -0.2, b, 4.4, "dr-intervallrand", { "data-rolle": "grenze-b" });
  const K2 = koordinatenXY({ hoehe: 210, xmin: 0, xmax: 5.2, ymin: -3, ymax: 3, panel: "F", yName: "F" });
  panelTitel(K2, n === -1 ? "ln(x)" : "grün: ln(x) · grau: Stammfunktion der Potenz");
  if (n !== -1) graph(K2, G, 0.15, 5.2, { schritte: 400, basis: "dr-nachbar", rolle: "potenz-stamm" });
  graph(K2, Math.log, 0.15, 5.2, { schritte: 400, basis: "dr-stamm", rolle: "stamm" });
  punkt(K2, b, Math.log(b), "dr-punkt-t", { "data-rolle": "p-ln" });
  zeige("ln-mount", K1.svg, K2.svg);
  const I = G(b), L = Math.log(b);
  setzeHtml("ln-bilanz", n === -1
    ? `n = −1: Die Potenzregel müsste durch n + 1 = 0 teilen. Stattdessen: ${intZ("1", num(b))} ${bruch("1", "x")} dx = ln(${num(b)}) − ln(1) ${zeichen(L)} <span class="wc">${num(L)}</span>`
    : `${intZ("1", num(b))} ${potHtml(n)} dx = ${bruch(`${num(b)}<sup>${num(n + 1)}</sup> − 1`, num(n + 1))} ${zeichen(I)} <span class="wc">${num(I)}</span>; zum Vergleich ${intZ("1", num(b))} ${bruch("1", "x")} dx = ln(${num(b)}) ${gleich(L)} — Abstand ${gleich(Math.abs(I - L))}`);
  setzeText("ln-text", n === -1
    ? "Genau hier versagt die Potenzregel — und der Logarithmus füllt die Lücke nahtlos: Die Nachbarn links und rechts nähern sich ihm an."
    : Math.abs(n + 1) <= 0.1
      ? "n liegt dicht bei −1: Die Stammfunktion der Potenz liegt fast auf ln(x), obwohl ihre Formel ganz anders aussieht."
      : n < -1 ? "n < −1: Die Stammfunktion bleibt für große x unter 1/(−n − 1) — die Fläche bis ∞ wäre endlich (Abschnitt 8)." : "n > −1: Die Stammfunktion wächst über jede Grenze, schneller als ln(x).");
}

// ================= 8. Uneigentliche Integrale =================

const UE_B = [1.5, 2, 3, 5, 10, 20, 100, 1000];
const UE_E = [0.5, 0.25, 0.1, 0.05, 0.02, 0.01, 0.001, 0.0001];
// „pol“: Die Problemstelle ist die Polstelle 0 am linken Rand; der Regler stellt ε statt b ein.
// a ist die feste untere Grenze bei ∞-Integralen; wert(b) bzw. wert(ε) ist der Term aus dem Hauptsatz.
const UE = {
  quadrat: { f: (x) => 1 / (x * x), F: (x) => -1 / x, pol: false, a: 1, grenz: 1, Ftext: "−1/x", term: "1/x²", wert: (b) => `1 − ${bruch("1", num(b))}`, grenzText: `Für b → ∞ geht ${bruch("1", "b")} → 0, das Integral also gegen <span class="wa">1</span>: konvergent.` },
  wurzel: { f: (x) => 1 / Math.sqrt(x), F: (x) => 2 * Math.sqrt(x), pol: false, a: 1, grenz: Infinity, Ftext: "2√x", term: "1/√x", wert: (b) => `2 · √${num(b)} − 2`, grenzText: "Für b → ∞ wächst 2√b − 2 über jede Grenze: <span class=\"wo\">divergent</span>." },
  exp: { f: (x) => Math.exp(-x), F: (x) => -Math.exp(-x), pol: false, a: 0, grenz: 1, Ftext: "−e<sup>−x</sup>", term: "e<sup>−x</sup>", wert: (b) => `1 − e<sup>−${num(b)}</sup>`, grenzText: `Für b → ∞ geht e<sup>−b</sup> → 0, das Integral also gegen <span class="wa">1</span>: konvergent.` },
  polwurzel: { f: (x) => 1 / Math.sqrt(x), F: (x) => 2 * Math.sqrt(x), pol: true, grenz: 2, Ftext: "2√x", term: "1/√x" },
  polquadrat: { f: (x) => 1 / (x * x), F: (x) => -1 / x, pol: true, grenz: Infinity, Ftext: "−1/x", term: "1/x²" },
};
const UE_TEXT = {
  quadrat: "Jeder weitere Abschnitt bringt immer weniger dazu — die Summe bleibt unter 1.",
  wurzel: "1/√x fällt zu langsam: Die Fläche wächst ohne Grenze, nur immer langsamer.",
  exp: "e^(−x) fällt schneller als jede Potenz von 1/x — die Fläche bis ∞ ist genau 1.",
};
function renderUneigentlich() {
  const art = wahl("ue-art"), d = UE[art], k = reglerRaster("ue-k");
  setzeText("ue-k-name", d.pol ? "ε" : "b");
  if (!d.pol) {
    const b = UE_B[k];
    setzeAnzeige("ue-k-anzeige", num(b));
    const K = koordinatenXY({ hoehe: 300, xmin: 0, xmax: 10.5, ymin: 0, ymax: 1.6 });
    flaechen(K, d.f, () => 0, d.a, Math.min(b, 10.5), { pos: "dr-flaeche-pos" });
    graph(K, d.f, d.a === 0 ? 0 : 0.3, 10.5, { schritte: 400 });
    strecke(K, d.a, 0, d.a, 1.6, "dr-intervallrand", { "data-rolle": "grenze-a" });
    if (b <= 10.5) strecke(K, b, 0, b, 1.6, "dr-intervallrand", { "data-rolle": "grenze-b" });
    zeige("ue-mount", K.svg);
    const I = d.F(b) - d.F(d.a);
    setzeHtml("ue-bilanz",
      `${intZ(num(d.a), num(b))} ${d.term} dx = ${klammer(d.Ftext, num(d.a), num(b))} = ${d.wert(b)} ${gleich(I)}<br>${d.grenzText}`);
    setzeText("ue-text", (b > 10.5 ? `b = ${num(b)} liegt weit rechts außerhalb des Bildes. ` : "") + UE_TEXT[art]);
    return;
  }
  const e = UE_E[k];
  setzeAnzeige("ue-k-anzeige", num(e));
  const K = koordinatenXY({ hoehe: 300, xmin: 0, xmax: 1.25, ymin: 0, ymax: 6 });
  // Nahe der Polstelle ist der Graph so steil, dass ein grober Sehnenzug die Fläche merklich zu groß
  // zeichnet (bei ε = 0,0001 um 7 %); 2000 Stützstellen bringen das unter ein Prozent.
  flaechen(K, d.f, () => 0, e, 1, { pos: "dr-flaeche-pos", n: 2000 });
  graph(K, d.f, 0.02, 1.25, { schritte: 400 });
  strecke(K, e, 0, e, 6, "dr-intervallrand", { "data-rolle": "grenze-a" });
  strecke(K, 1, 0, 1, 6, "dr-intervallrand", { "data-rolle": "grenze-b" });
  strecke(K, 0, 0, 0, 6, "dr-pol", { "data-rolle": "pol" });
  zeige("ue-mount", K.svg);
  const I = d.F(1) - d.F(e);
  setzeHtml("ue-bilanz",
    `${intZ(num(e), "1")} ${d.term} dx = ${klammer(d.Ftext, num(e), "1")} = ${d.grenz === 2 ? `2 − 2 · √${num(e)}` : `${bruch("1", num(e))} − 1`} ${gleich(I)}<br>` +
    (d.grenz === 2 ? `Für ε → 0 geht √ε → 0, das Integral also gegen <span class="wa">2</span>: konvergent.` : `Für ε → 0 wächst ${bruch("1", "ε")} − 1 über jede Grenze: <span class="wo">divergent</span>.`));
  setzeText("ue-text", (e < 0.02 ? `ε = ${num(e)} liegt so nah an 0, dass der Streifen im Bild nicht mehr zu sehen ist. ` : "") + (d.grenz === 2
    ? "1/√x wächst bei 0 langsam genug: Die Fläche zwischen 0 und 1 ist endlich, obwohl der Graph über alle Grenzen steigt."
    : "1/x² wächst bei 0 zu schnell: Rückt ε an 0 heran, kommt immer mehr Fläche dazu — ohne Grenze."));
}

// ================= 9. Rotationskörper =================

const RK = {
  kegel: { f: (x) => 0.5 * x, a: 0, b: 4, V: (16 * Math.PI) / 3, Vtext: "16π/3" },
  paraboloid: { f: (x) => Math.sqrt(x), a: 0, b: 4, V: 8 * Math.PI, Vtext: "8π" },
  kugel: { f: (x) => Math.sqrt(Math.max(0, 4 - x * x)), a: -2, b: 2, V: (32 * Math.PI) / 3, Vtext: "32π/3" },
  // (2e^(−0,5x))² = 4e^(−x): V = π · [−4e^(−x)] von 0 bis 4 = 4π(1 − e^(−4)).
  exp: { f: (x) => 2 * Math.exp(-0.5 * x), a: 0, b: 4, V: 4 * Math.PI * (1 - Math.exp(-4)), Vtext: "4π · (1 − e<sup>−4</sup>)" },
};
function renderRotation() {
  const d = RK[wahl("rk-art")], n = reglerRaster("rk-n");
  setzeAnzeige("rk-n-anzeige", String(n));
  const dx = (d.b - d.a) / n;
  const K = koordinatenXY({ hoehe: 300, xmin: d.a - 0.4, xmax: d.b + 0.4, ymin: -2.6, ymax: 2.6 });
  let summe = 0;
  for (let k = 0; k < n; k++) {
    // Jede Scheibe ist ein Zylinder mit dem Radius in der Streifenmitte.
    const u = d.a + k * dx, r = d.f(u + dx / 2);
    rechteck(K, u, -r, u + dx, r, "dr-scheibe", { "data-rolle": "scheibe", "data-k": String(k) });
    summe += Math.PI * r * r * dx;
  }
  graph(K, d.f, d.a, d.b, { schritte: 300, rolle: "graph" });
  graph(K, (x) => -d.f(x), d.a, d.b, { schritte: 300, rolle: "spiegel" });
  zeige("rk-mount", K.svg);
  setzeHtml("rk-bilanz",
    `${n} Scheiben der Dicke ${gleich(dx)}: Summe π · Σ r² · Δx ${gleich(summe)}<br>` +
    `Exakt: V = π · ${intZ(num(d.a), num(d.b))} (f(x))² dx = <span class="wa">${d.Vtext} ${gleich(d.V)}</span>; Abweichung ${gleich(Math.abs(summe - d.V))}`);
  setzeText("rk-text", n < 8
    ? "Wenige dicke Scheiben: Der Treppenkörper weicht noch sichtbar vom glatten Körper ab."
    : "Mit vielen dünnen Scheiben schmiegt sich der Treppenkörper an — im Grenzwert ist seine Summe das Integral.");
}

// ================= 10. Stolperstelle =================
// Mias Kurve ½x² · eˣ gegen die Stammfunktion (x − 1) · eˣ aus dem Ansatz.
function renderStolperstelle() {
  const x0 = reglerRaster("st-x");
  setzeAnzeige("st-x-anzeige", num(x0));
  const f = (x) => x * Math.exp(x), F = (x) => (x - 1) * Math.exp(x), mia = (x) => 0.5 * x * x * Math.exp(x);
  const miaAbl = (x) => (x + 0.5 * x * x) * Math.exp(x);
  const K1 = koordinatenXY({ hoehe: 230, xmin: -3, xmax: 1.5, ymin: -1.3, ymax: 5.5, panel: "F", yName: "F" });
  panelTitel(K1, "rot: ½x² · e^x · grün: (x − 1) · e^x");
  graph(K1, mia, -3, 1.5, { schritte: 400, basis: "dr-falsch", rolle: "falsch" });
  graph(K1, F, -3, 1.5, { schritte: 400, basis: "dr-stamm", rolle: "stamm" });
  tangente(K1, miaAbl(x0), x0, mia(x0), "dr-falsch-tangente", "tangente-falsch");
  tangente(K1, f(x0), x0, F(x0), "dr-tangente2", "tangente");
  const K2 = koordinatenXY({ hoehe: 190, xmin: -3, xmax: 1.5, ymin: -0.6, ymax: 7, panel: "f" });
  panelTitel(K2, "f(x) = x · e^x");
  graph(K2, f, -3, 1.5, { schritte: 400 });
  punkt(K2, x0, f(x0), "fr-punkt", { "data-rolle": "p-f" });
  zeige("st-mount", K1.svg, K2.svg);
  const diff = miaAbl(x0) - f(x0);
  setzeHtml("st-bilanz",
    `f(${num(x0)}) ${gleich(f(x0))}<br>` +
    `Grün: F′(x) = ${eh("x")} + (x − 1) · ${eh("x")} = x · ${eh("x")} — Steigung bei x₀ <span class="wa">${num(f(x0))}</span> = f(x₀) ✓<br>` +
    `Rot: (${bruch("x²", "2")} · ${eh("x")})′ = x · ${eh("x")} + ${bruch("x²", "2")} · ${eh("x")} — Steigung bei x₀ <span class="wg">${num(miaAbl(x0))}</span>, um ${bruch("x₀²", "2")} · ${eh("x₀")} ${gleich(diff)} zu groß`);
  setzeText("st-text", Math.abs(x0) < 1e-12
    ? "x₀ = 0: Beide Steigungen sind 0 — an dieser einen Stelle fällt Mias Fehler nicht auf. An jeder anderen schon."
    : "Mias Kurve hat an jeder Stelle außer 0 eine größere Steigung, als f verlangt: Der zweite Summand der Produktregel, ½x² · eˣ, ist nie negativ.");
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
    q: "Welche Aussage über das Integrieren stimmt?",
    options: ["Zu jeder Ableitungsregel gibt es eine Integrationsregel, die genauso immer funktioniert.", "Ein Produkt integriert man, indem man jeden Faktor einzeln integriert.", "Für Produkte gibt es keine allgemeine Regel; eine vermutete Stammfunktion prüft man durch Ableiten.", `Jede stetige Funktion hat eine Stammfunktion, die sich mit e, ln, sin, cos und Potenzen schreiben lässt.`],
    correct: 2,
    explain: `Ableiten ist ein Rezept, Integrieren nicht: Eine Produktregel rückwärts gibt es nicht, und ${eh("−x²")} hat zwar nach dem Hauptsatz eine Stammfunktion — die Integralfunktion —, aber keine, die sich mit bekannten Funktionen hinschreiben lässt. Was bleibt: eine Form vermuten und durch Ableiten prüfen.`,
  },
  "quiz-ekx": {
    q: `Welche Funktion ist eine Stammfunktion von f(x) = 6${eh("3x")}?`,
    options: [`F(x) = 2${eh("3x")}`, `F(x) = 18${eh("3x")}`, `F(x) = 6${eh("3x")}`, `F(x) = ${bruch("6", "3x + 1")} · ${eh("3x + 1")}`],
    correct: 0,
    explain: `(2${eh("3x")})′ = 2 · 3 · ${eh("3x")} = 6${eh("3x")}. 18${eh("3x")} ist die Ableitung von f, nicht die Stammfunktion; 6${eh("3x")} hätte die Ableitung 18${eh("3x")}; die letzte Antwort wendet die Potenzregel auf den Exponenten an. Durch k = 3 teilen, nicht malnehmen.`,
  },
  "quiz-ansatz": {
    q: `Für f(x) = (x + 2) · ${eh("x")} setzt man F(x) = (Ax + B) · ${eh("x")} an. Was ergibt der Koeffizientenvergleich?`,
    options: ["A = 1, B = 2", "A = 1, B = 3", "A = 0,5, B = 2", "A = 1, B = 1"],
    correct: 3,
    explain: `F′(x) = A · ${eh("x")} + (Ax + B) · ${eh("x")} = (Ax + A + B) · ${eh("x")}. Vergleich mit x + 2: A = 1 und A + B = 2, also B = 1 — F(x) = (x + 1) · ${eh("x")}. Wer B = 2 wählt, hat den Summanden A aus der Produktregel vergessen; A = 0,5 kommt von der Potenzregel für x, die hier nicht gilt.`,
  },
  "quiz-bestand": {
    q: `In einen Tank mit 50 ℓ fließt Wasser mit der Rate r(t) = 6 · ${eh("−0,2t")} Liter pro Minute. Welchem Wert nähert sich die Wassermenge auf lange Sicht?`,
    options: ["50 ℓ", "80 ℓ", "30 ℓ", "51,2 ℓ"],
    correct: 1,
    explain: `Insgesamt fließen ${bruch("6", "0,2")} = 30 ℓ zu: ${intZ("0", "t")} 6 · ${eh("−0,2s")} ds = 30 · (1 − ${eh("−0,2t")}) → 30. Dazu kommen die 50 ℓ vom Anfang. 50 ℓ wäre richtig, wenn mit der Rate auch der Zufluss aufhörte; 51,2 = 50 + 6 · 0,2 ist mit k multipliziert statt geteilt.`,
  },
  "quiz-sinus": {
    q: `${intZ("0", "π/2")} cos(x) dx = ?`,
    options: ["0", "−1", "1", "π/2"],
    correct: 2,
    explain: "Die Stammfunktion von cos ist sin: sin(π/2) − sin(0) = 1 − 0 = 1. −1 entsteht, wenn man −sin oder cos als Stammfunktion nimmt — die Probe (−sin x)′ = −cos x zeigt den Fehler. π/2 wäre ein Rechteck der Höhe 1; der Kosinus fällt aber von 1 auf 0.",
  },
  "quiz-verkettung": {
    q: "Welche Funktion ist eine Stammfunktion von f(x) = (3x − 1)⁴?",
    options: [`F(x) = ${bruch("(3x − 1)⁵", "15")}`, `F(x) = ${bruch("(3x − 1)⁵", "5")}`, `F(x) = ${bruch("3 · (3x − 1)⁵", "5")}`, `F(x) = ${bruch("(3x − 1)⁵", "15x")}`],
    correct: 0,
    explain: `Exponent erhöhen, durch 5 <em>und</em> durch die innere Ableitung 3 teilen. Probe: (${bruch("(3x − 1)⁵", "15")})′ = ${bruch("5 · (3x − 1)⁴ · 3", "15")} = (3x − 1)⁴ ✓. Bei ${bruch("…", "5")} fehlt das Teilen durch 3, beim Faktor 3 wurde multipliziert statt geteilt.`,
  },
  "quiz-ln": {
    q: `${intZ("1", "e²")} ${bruch("1", "x")} dx = ?`,
    options: ["e² − 1", `1 − ${bruch("1", "e²")}`, "ln(2)", "2"],
    correct: 3,
    explain: `Stammfunktion ln(x): ln(e²) − ln(1) = 2 − 0 = 2. 1 − ${bruch("1", "e²")} entsteht mit −${bruch("1", "x")} — das ist die Stammfunktion von ${bruch("1", "x²")}, nicht von ${bruch("1", "x")}. e² − 1 ist nur die Breite des Intervalls.`,
  },
  "quiz-uneigentlich": {
    q: `Welches der Integrale ${intZ("1", "∞")} f(x) dx ist konvergent?`,
    options: ["f(x) = 1/x³", "f(x) = 1/√x", "f(x) = 1/x", "f(x) = 1/∛x"],
    correct: 0,
    explain: `${intZ("1", "b")} x⁻³ dx = ${klammer("−1/(2x²)", "1", "b")} = 1/2 − 1/(2b²) → 1/2. Bei 1/√x und 1/∛x fällt f zu langsam, die Stammfunktion wächst wie eine Wurzel über jede Grenze; bei 1/x ist es ln(b) → ∞.`,
  },
  "quiz-rotation": {
    q: "Das Volumen des Körpers, der entsteht, wenn f(x) = 2 auf [0; 3] um die x-Achse rotiert, ist …",
    options: ["6π", "12π", "36π", "18π"],
    correct: 1,
    explain: `V = π ${intZ("0", "3")} 2² dx = π · 4 · 3 = 12π — ein Zylinder mit Radius 2 und Höhe 3, also π r² h. 36π entsteht, wenn man die Fläche 6 quadriert statt den Radius.`,
  },
  "quiz-stolperstelle": {
    q: `Was ergibt die Probe für F(x) = ${bruch("x²", "2")} · ${eh("x")}?`,
    options: [`F′(x) = x · ${eh("x")} — F ist eine Stammfunktion von x · ${eh("x")}.`, `F′(x) = ${bruch("x²", "2")} · ${eh("x")} — F ist seine eigene Ableitung.`, `F′(x) = (x + ${bruch("x²", "2")}) · ${eh("x")} — F ist keine Stammfunktion von x · ${eh("x")}.`, `F′(x) = x · ${eh("x")} + ${bruch("x²", "2")} — der zweite Summand ist eine Konstante.`],
    correct: 2,
    explain: `Produktregel: (${bruch("x²", "2")})′ · ${eh("x")} + ${bruch("x²", "2")} · (${eh("x")})′ = x · ${eh("x")} + ${bruch("x²", "2")} · ${eh("x")}. Der zweite Summand verschwindet nicht. Eine Stammfunktion von x · ${eh("x")} ist (x − 1) · ${eh("x")}, gefunden mit dem Ansatz.`,
  },
};

// ================= Selbsteinschätzung =================
//
// Die Auswahl liegt nur im Browser dieser Person — eine Lernhilfe, keine Leistungsmessung.
const SE_PUNKTE = [
  ["sec-vergleich", "Ich kann erklären, warum Integrieren schwerer ist als Ableiten, und mache die Probe durch Ableiten."],
  ["sec-ekx", "Ich kann Stammfunktionen von a · e^(kx) bilden und Integrale damit berechnen — mit F(0) ≠ 0."],
  ["sec-ansatz", "Ich kann für p(x) · e^(kx) eine Stammfunktion mit Ansatz und Koeffizientenvergleich bestimmen."],
  ["sec-bestand", "Ich kann einen Bestand aus einer abklingenden e-Rate berechnen und seinen Grenzwert angeben."],
  ["sec-sinus", "Ich kann Sinus und Kosinus integrieren, ohne das Vorzeichen zu verlieren."],
  ["sec-verkettung", "Ich kann Funktionen der Form g(mx + n) integrieren und weiß, wann die Regel nicht gilt."],
  ["sec-ln", "Ich kann 1/x und c/(mx + n) mit dem Logarithmus integrieren."],
  ["sec-uneigentlich", "Ich kann uneigentliche Integrale berechnen und entscheiden, ob sie konvergieren."],
  ["sec-rotation", "Ich kann Volumina von Rotationskörpern berechnen — auch unter e-Funktionen."],
  ["sec-stolperstelle", "Ich integriere Produkte nicht Faktor für Faktor."],
];
const SE_SCHLUESSEL = "uplant-mss11-integration-weiterer-funktionen-selbsteinschaetzung";

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

const REGLER = [
  [["vg-art", "vg-b"], renderVergleich],
  [["ek-k", "ek-b"], renderEkx],
  [["an-art", "an-x"], renderAnsatz],
  [["bs-a", "bs-k", "bs-t"], renderBestand],
  [["sn-art", "sn-a", "sn-b"], renderSinus],
  [["vk-art", "vk-m", "vk-x"], renderVerkettung],
  [["ln-n", "ln-b"], renderLn],
  [["ue-art", "ue-k"], renderUneigentlich],
  [["rk-art", "rk-n"], renderRotation],
  [["st-x"], renderStolperstelle],
];
for (const [ids, render] of REGLER) {
  ids.forEach((id) => {
    const e = document.getElementById(id);
    if (e.tagName === "SELECT" || e.type === "checkbox") e.addEventListener("change", render);
    else e.addEventListener("input", render);
  });
  render();   // nicht vergessen — sonst bleibt die Zeichnung leer, bis jemand einen Regler anfasst
}
for (const [id, def] of Object.entries(QUIZZE)) mountQuiz(document.getElementById(id), def);
renderSelbsteinschaetzung();
mountUebungsaufgaben(document.getElementById("exercises-mount"), AUFGABEN, { parse: parseZahl });
