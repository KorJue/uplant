// Selbstlernpfad „Integralrechnung“ (MSS 11, Analysis, Thema 4). Vanilla-JS, kein Build.
//
// Didaktische Reihenfolge — jede Stufe benutzt nur, was davor steht:
//    1. Rekonstruktion            (Fläche = Rate · Zeit bei Rechtecken; orientiert bei Abfluss)
//    2. Unter- und Obersummen     (Streifenmethode, Summenformel, Grenzwert aus Thema 1.1)
//    3. Bestimmtes Integral       (gemeinsamer Grenzwert; orientierter Flächeninhalt; Eigenschaften
//                                  folgen aus den Summen)
//    4. Integralfunktion          (obere Grenze variabel; Vermutung I′ = f nur beobachtet)
//    5. Hauptsatz                 (Streifen eingeklemmt zwischen f(x)·h und f(x + h)·h; Stetigkeit
//                                  aus Thema 1.2)
//    6. Stammfunktionen, Regeln   (Ableitungsregeln aus Thema 2 rückwärts)
//    7. Fläche mit der x-Achse    (Nullstellen aus Thema 3, Beträge der Teilintegrale)
//    8. Fläche zwischen Graphen   (Differenzfunktion, Schnittstellen)
//    9. Mittelwert, Bilanz        (Rechteck gleicher Fläche; Rekonstruktion aus 1 mit Stammfunktion)
//   10. Uneigentliche Integrale   (Grenzwert für x → ∞ aus Thema 1.2)
//   11. Rotationskörper           (Scheiben statt Streifen, sonst wie 2)
//   12. Stolperstelle Polstelle   (Voraussetzung des Hauptsatzes aus 5, uneigentlich aus 10)
//
// Gerechnet wird mit Reglerwerten und exakten Stammfunktionen, nie mit Bildschirmkoordinaten. Die
// Flächen werden als Vielecke gezeichnet, an den Nullstellen der Differenz geteilt; die Prüfung misst
// sie mit der Gaußschen Trapezformel nach.
//
// Farbcodierung: f blau, Stamm- und Integralfunktion grün; orientierte Fläche über der Achse grün,
// darunter orange; Untersumme grün, Obersumme orange; Streifen violett; Warnung rot.

import { mountUebungsaufgaben } from "../../../aufgaben.js?v=2";
import { AUFGABEN, parseZahl } from "./aufgaben-integralrechnung.js?v=2";


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

// ---------- Zusätzliche Helfer für Thema 4 ----------

const gleich = (x, stellen = 4) => `${zeichen(x, stellen)} ${num(x, stellen)}`;
// Integral mit Grenzen als HTML: ∫ mit b oben, a unten.
const intZ = (a, b) => `<span class="integral"><span class="zeichen">∫</span><span class="grenzen"><span class="o">${b}</span><span class="u">${a}</span></span></span>`;
const klammer = (inhalt, a, b) => `<span class="integral">[${inhalt}]<span class="grenzen"><span class="o">${b}</span><span class="u">${a}</span></span></span>`;

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
    // Eine Nullstelle genau auf einer Stützstelle (etwa x = 0) zeigt kein Vorzeichenpaar „+ −“ —
    // ohne diesen Fall würden die Stücke links und rechts davon zu einem verschmolzen und falsch gefärbt.
    if (i + 1 < n && Math.abs(d(q)) < 1e-12) { grenzen.push(q); continue; }
    if (d(p) * d(q) < 0) {
      for (let k = 0; k < 50; k++) { const m = (p + q) / 2; if (d(m) * d(p) > 0) p = m; else q = m; }
      // Eine „Nullstelle“ am Rand ist Rundungsrauschen (f − g ist dort ±10⁻¹⁶) und kein Teilungspunkt.
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

// ================= 1. Rekonstruktion =================

const RE = {
  becken: {
    rate: (t) => (t < 2 ? 3 : t < 4 ? -1 : 2),
    bestand: (t) => 5 + 3 * Math.min(t, 2) - Math.min(Math.max(t - 2, 0), 2) + 2 * Math.max(t - 4, 0),
    stufen: [[0, 2, 3], [2, 4, -1], [4, 6, 2]],
    ry: [-2, 4], by: [0, 15], tName: "t in h", rName: "r in m³/h", bName: "B in m³",
  },
  auto: {
    rate: (t) => 2 * t, bestand: (t) => t * t,
    ry: [0, 13], by: [0, 38], tName: "t in s", rName: "v in m/s", bName: "s in m",
  },
};
function renderRekonstruktion() {
  const art = wahl("re-art"), d = RE[art];
  const t = reglerRaster("re-t");
  setzeAnzeige("re-t-anzeige", `${num(t)} ${art === "becken" ? "h" : "s"}`);
  const K1 = koordinatenXY({ hoehe: 230, xmin: 0, xmax: 6.2, ymin: d.ry[0], ymax: d.ry[1], xName: d.tName, yName: d.rName, panel: "rate" });
  panelTitel(K1, art === "becken" ? "Änderungsrate r(t)" : "Geschwindigkeit v(t) = 2t");
  if (art === "becken") {
    // Die Stufen als Rechtecke bis t — Rate mal Zeit, mit Vorzeichen.
    for (const [u, o, h] of d.stufen) {
      if (t > u) vieleck(K1, [[u, 0], [Math.min(o, t), 0], [Math.min(o, t), h], [u, h]], h > 0 ? "dr-flaeche-pos" : "dr-flaeche-neg", { "data-rolle": "flaeche", "data-vorzeichen": h > 0 ? "+" : "-" });
    }
    const pfad = d.stufen.map(([u, o, h], i) => `${i ? "L" : "M"} ${K1.X(u).toFixed(2)} ${K1.Y(h).toFixed(2)} L ${K1.X(o).toFixed(2)} ${K1.Y(h).toFixed(2)}`).join(" ");
    K1.ebene.appendChild(svgEl("path", { d: pfad, class: "fr-linie", "data-rolle": "rate" }));
  } else {
    flaechen(K1, d.rate, () => 0, 0, t);
    graph(K1, d.rate, 0, 6.2, { schritte: 100, rolle: "rate" });
  }
  strecke(K1, t, d.ry[0], t, d.ry[1], "dr-verbinder", { "data-rolle": "zeit" });
  const K2 = koordinatenXY({ hoehe: 210, xmin: 0, xmax: 6.2, ymin: d.by[0], ymax: d.by[1], xName: d.tName, yName: d.bName, panel: "bestand" });
  panelTitel(K2, art === "becken" ? "Bestand B(t)" : "Weg s(t)");
  graph(K2, d.bestand, 0, 6, { schritte: 300, basis: "fr-linie duenn", rolle: "bestand-ganz" });
  if (t > 0) graph(K2, d.bestand, 0, t, { schritte: Math.max(2, Math.round(t * 50)), basis: "dr-stamm", rolle: "bestand" });
  punkt(K2, t, d.bestand(t), "dr-punkt-t", { "data-rolle": "p" });
  zeige("re-mount", K1.svg, K2.svg);
  let bilanz;
  if (art === "becken") {
    const teile = d.stufen.filter(([u]) => t > u).map(([u, o, h]) => `${h < 0 ? "−" : "+"} ${num(Math.abs(h))} · ${num(Math.min(o, t) - u)}`);
    bilanz = `B(${num(t)}) = 5 ${teile.join(" ")} = <span class="wa">${num(d.bestand(t))} m³</span>`;
  } else {
    bilanz = `s(${num(t)}) = ${bruch("1", "2")} · ${num(t)} · ${num(2 * t)} = <span class="wa">${num(d.bestand(t))} m</span> — die Fläche des Dreiecks unter v`;
  }
  setzeHtml("re-bilanz", bilanz);
  setzeHtml("re-vorgang", art === "becken"
    ? "<strong>Becken:</strong> Zu Beginn sind 5 m³ Wasser darin. Von 0 bis 2 h fließen 3 m³ pro Stunde zu, von 2 bis 4 h werden 1 m³ pro Stunde abgepumpt (Rate −1), von 4 bis 6 h fließen 2 m³ pro Stunde zu. Oben die Rate r(t), unten der Bestand B(t)."
    : "<strong>Auto:</strong> Es fährt aus dem Stand an, seine Geschwindigkeit wächst gleichmäßig um 2 m/s in jeder Sekunde: v(t) = 2t. Oben die Geschwindigkeit, unten der zurückgelegte Weg s(t). Die Rate ist hier nicht stückweise konstant — die Fläche unter v ist ein Dreieck statt einiger Rechtecke.");
  setzeText("re-text", art === "becken"
    ? (t === 0 ? "Noch ist keine Zeit vergangen: keine Fläche, der Bestand ist der Anfangsbestand 5 m³." : t <= 2 ? "Zuflussphase: Jede Stunde kommen 3 m³ dazu — der Bestand steigt geradlinig." : t <= 4 ? "Abpumpphase: Die Rate ist negativ, das Rechteck liegt unter der Achse und wird abgezogen — der Bestand sinkt." : "Wieder Zufluss mit 2 m³ pro Stunde: Der Bestand steigt, aber flacher als am Anfang.")
    : t === 0
      ? "Noch ist keine Zeit vergangen: Das Auto steht, der Weg ist 0."
      : `Bis t = ${num(t)} s ist die Fläche unter v ein Dreieck mit der Grundseite ${num(t)} s und der Höhe v(${num(t)}) = ${num(2 * t)} m/s, also s(${num(t)}) = ½ · ${num(t)} · ${num(2 * t)} = ${num(t * t)} m. ` +
        "Doppelt so lange fahren heißt viermal so weit — der Weg wächst quadratisch, so entsteht die Parabel s(t) = t². Die Steigung von s ist an jeder Stelle die Geschwindigkeit.");
}

// ================= 2. Unter- und Obersummen =================

function renderSummen() {
  const b = reglerRaster("su-b"), n = reglerRaster("su-n");
  setzeAnzeige("su-b-anzeige", num(b));
  setzeAnzeige("su-n-anzeige", String(n));
  const f = (x) => x * x, dx = b / n;
  const K = koordinatenXY({ hoehe: 320, xmin: -0.05 * b, xmax: 1.08 * b, ymin: 0, ymax: 1.1 * b * b });
  for (let k = 0; k < n; k++) {
    const u = k * dx, o = (k + 1) * dx;
    rechteck(K, u, 0, o, f(o), "dr-ober", { "data-rolle": "ober", "data-k": String(k) });
    rechteck(K, u, 0, o, f(u), "dr-unter", { "data-rolle": "unter", "data-k": String(k) });
  }
  graph(K, f, 0, 1.08 * b, { schritte: 300 });
  zeige("su-mount", K.svg);
  // Exakt aus den Summenformeln — nicht aus den Rechtecken des Bildes.
  const O = (b ** 3 * n * (n + 1) * (2 * n + 1)) / (6 * n ** 3), U = (b ** 3 * (n - 1) * n * (2 * n - 1)) / (6 * n ** 3), A = b ** 3 / 3;
  setzeHtml("su-bilanz",
    `Δx = ${bruch(num(b), String(n))} ${gleich(dx)}: &nbsp;Untersumme U<sub>${n}</sub> ${zeichen(U)} <span class="wa">${num(U)}</span>, &nbsp;Obersumme O<sub>${n}</sub> ${zeichen(O)} <span class="wo">${num(O)}</span><br>` +
    `O<sub>${n}</sub> − U<sub>${n}</sub> = ${bruch("b · f(b)", "n")} ${gleich(O - U)}; &nbsp;Grenzwert: A = ${bruch("b³", "3")} ${gleich(A)}`);
  setzeText("su-text", n === 1
    ? "Ein einziger Streifen: Die Untersumme ist 0, die Obersumme das ganze Rechteck b · b². Die Wahrheit liegt irgendwo dazwischen."
    : n < 10
      ? `Mit ${n} Streifen ist die Lücke zwischen den Summen noch ${num((O - U) / A * 100, 1)} % der Fläche groß. Erhöhe n.`
      : `Mit ${n} Streifen sind Unter- und Obersumme kaum noch zu unterscheiden — beide nähern sich ${bruch("b³", "3")}.`);
}

// ================= 3. Das bestimmte Integral =================

// „extrem“: Stellen, an denen f die Richtung wechselt — dort können Minimum und Maximum eines Streifens
// liegen, nicht nur an seinen Rändern. Die Stammfunktion F rechnet die Seite intern; angezeigt wird
// sie hier noch nicht, denn sie kommt erst mit dem Hauptsatz in Abschnitt 5.
const IN = {
  kubik: { f: (x) => 0.5 * x ** 3 - 1.5 * x, F: (x) => 0.125 * x ** 4 - 0.75 * x * x, nullstellen: [-Math.sqrt(3), 0, Math.sqrt(3)], extrem: [-1, 1], y: [-6, 6] },
  para: { f: (x) => x * x - 1, F: (x) => x ** 3 / 3 - x, nullstellen: [-1, 1], extrem: [0], y: [-1.5, 8.5] },
  sinus: { f: Math.sin, F: (x) => -Math.cos(x), nullstellen: [-Math.PI, 0, Math.PI], extrem: [-Math.PI / 2, Math.PI / 2], y: [-1.5, 1.5] },
};
// Unter- und Obersumme mit n gleich breiten Streifen — kleinster und größter Wert je Streifen an den
// Rändern oder an einer Extremstelle im Inneren.
function summen(d, lo, hi, n) {
  let U = 0, O = 0;
  const dx = (hi - lo) / n;
  for (let k = 0; k < n; k++) {
    const u = lo + k * dx, o = u + dx;
    const werte = [d.f(u), d.f(o), ...d.extrem.filter((z) => z > u && z < o).map(d.f)];
    U += Math.min(...werte) * dx;
    O += Math.max(...werte) * dx;
  }
  return { U, O };
}
// Orientierte Teilflächen über [lo; hi], an den Nullstellen geteilt.
function teilflaechen(F, nullstellen, lo, hi) {
  const g = [lo, ...nullstellen.filter((z) => z > lo + 1e-12 && z < hi - 1e-12), hi];
  const out = [];
  for (let i = 0; i + 1 < g.length; i++) out.push({ von: g[i], bis: g[i + 1], wert: F(g[i + 1]) - F(g[i]) });
  return out;
}
const SU_N = 1000;
function renderIntegral() {
  const d = IN[wahl("in-art")];
  const a = reglerRaster("in-a"), b = reglerRaster("in-b");
  setzeAnzeige("in-a-anzeige", num(a));
  setzeAnzeige("in-b-anzeige", num(b));
  const K = koordinatenXY({ hoehe: 320, xmin: -3.2, xmax: 3.2, ymin: d.y[0], ymax: d.y[1] });
  flaechen(K, d.f, () => 0, a, b);
  graph(K, d.f, -3.2, 3.2, { schritte: 500 });
  strecke(K, a, d.y[0], a, d.y[1], "dr-intervallrand", { "data-rolle": "grenze-a" });
  strecke(K, b, d.y[0], b, d.y[1], "dr-intervallrand", { "data-rolle": "grenze-b" });
  beschrift(K, a, d.y[1], "a", "dr-text-r", { dy: 14, dx: -6 });
  beschrift(K, b, d.y[1], "b", "dr-text-r", { dy: 14, dx: 6 });
  zeige("in-mount", K.svg);
  const I = d.F(b) - d.F(a);
  const lo = Math.min(a, b), hi = Math.max(a, b);
  const teile = teilflaechen(d.F, d.nullstellen, lo, hi);
  const plus = teile.filter((t) => t.wert > 0).reduce((s, t) => s + t.wert, 0);
  const minus = -teile.filter((t) => t.wert < 0).reduce((s, t) => s + t.wert, 0);
  if (hi - lo < 1e-12) {
    setzeHtml("in-bilanz", `a = b: Es gibt keinen Streifen, ${intZ(num(a), num(b))} f(x) dx = <span class="wc">0</span>.`);
  } else {
    const { U, O } = summen(d, lo, hi, SU_N);
    const J = d.F(hi) - d.F(lo);
    setzeHtml("in-bilanz",
      `Mit ${SU_N} Streifen auf [${num(lo)}; ${num(hi)}]: Untersumme ${gleich(U)}, Obersumme ${gleich(O)} — dazwischen liegt ` +
      (a <= b
        ? `${intZ(num(a), num(b))} f(x) dx ${zeichen(I)} <span class="wc">${num(I)}</span><br>`
        : `${intZ(num(lo), num(hi))} f(x) dx ${gleich(J)}; mit vertauschten Grenzen: ${intZ(num(a), num(b))} f(x) dx ${zeichen(I)} <span class="wc">${num(I)}</span><br>`) +
      `Fläche über der Achse (grün) ${gleich(plus)}, unter der Achse (orange) ${gleich(minus)}` +
      (a <= b ? `; ${num(plus)} − ${num(minus)} ${gleich(plus - minus)}` : `; weil a &gt; b, zählt alles umgekehrt: −(${num(plus)} − ${num(minus)}) ${gleich(minus - plus)}`) + ".");
  }
  setzeText("in-text", Math.abs(a - b) < 1e-12
    ? "a = b: Der Streifen hat die Breite 0, das Integral ist 0."
    : a > b
      ? "Die untere Grenze liegt rechts von der oberen: Das Integral läuft rückwärts und wechselt das Vorzeichen."
      : plus > 1e-9 && minus > 1e-9
        ? "Ein Teil liegt über, ein Teil unter der Achse — das Integral verrechnet sie gegeneinander."
        : "Alles liegt auf einer Seite der Achse — hier ist der Betrag des Integrals der Flächeninhalt.");
}

// ================= 4. Integralfunktion =================

const IFN = { f: (t) => 1.5 * t * t - 1.5, F: (t) => 0.5 * t ** 3 - 1.5 * t };
function renderIntegralfunktion() {
  const a = reglerRaster("if-a"), x = reglerRaster("if-x");
  setzeAnzeige("if-a-anzeige", num(a));
  setzeAnzeige("if-x-anzeige", num(x));
  const I = (s) => IFN.F(s) - IFN.F(a);
  // ymax 6,5 statt 5: Sonst läuft der Parabelast links oben durch den Titel des Bildes.
  const K1 = koordinatenXY({ hoehe: 230, xmin: -2.2, xmax: 2.2, ymin: -2, ymax: 6.5, xName: "t", panel: "f" });
  panelTitel(K1, "f(t) = 1,5t² − 1,5");
  flaechen(K1, IFN.f, () => 0, a, x);
  graph(K1, IFN.f, -2.2, 2.2, { schritte: 400 });
  strecke(K1, a, -2, a, 6.5, "dr-intervallrand", { "data-rolle": "grenze-a" });
  punkt(K1, x, IFN.f(x), "fr-punkt", { "data-rolle": "p-f" });
  const K2 = koordinatenXY({ hoehe: 230, xmin: -2.2, xmax: 2.2, ymin: -3, ymax: 4, panel: "I" });
  panelTitel(K2, `Integralfunktion I${a === 0 ? "₀" : "ₐ"}(x)`);
  graph(K2, I, -2.2, 2.2, { schritte: 400, basis: "dr-stamm", rolle: "integralfunktion" });
  gerade(K2, IFN.f(x), x, I(x), "dr-tangente2", { "data-rolle": "tangente" });
  punkt(K2, x, I(x), "dr-punkt-t", { "data-rolle": "p-I" });
  punkt(K2, a, 0, "dr-rand", { "data-rolle": "nullstelle-a", r: 4 });
  zeige("if-mount", K1.svg, K2.svg);
  setzeHtml("if-bilanz",
    `I<sub>a</sub>(x) = ${intZ(num(a), num(x))} f(t) dt = <span class="wa">${num(I(x))}</span> (orientierte Fläche von ${num(a)} bis ${num(x)})<br>` +
    `Steigung der Tangente an I<sub>a</sub> bei x = ${num(x)}: <span class="wr">${num(IFN.f(x))}</span> = f(${num(x)})`);
  setzeText("if-text", x < a - 1e-12
    ? `x liegt links von a: Das Integral läuft rückwärts, die Fläche zählt mit umgekehrtem Vorzeichen — Iₐ(${num(x)}) = ${num(I(x))}. Die Steigung ist trotzdem f(x).`
    : Math.abs(IFN.f(x)) < 1e-12
    ? "f ist hier 0 — und Iₐ hat eine waagerechte Tangente: An den Nullstellen von f liegen die Extremstellen von Iₐ."
    : IFN.f(x) > 0
      ? "f ist hier positiv: Schiebt man x weiter nach rechts, kommt Fläche über der Achse dazu — Iₐ wächst."
      : "f ist hier negativ: Weiter rechts kommt Fläche unter der Achse dazu — Iₐ nimmt ab.");
}

// ================= 5. Hauptsatz =================

const HS = { f: (x) => 0.5 * x * x + 1, F: (x) => x ** 3 / 6 + x };
const HS_H = [1, 0.5, 0.25, 0.1, 0.05, 0.01];
function renderHauptsatz() {
  const x = reglerRaster("hs-x"), h = HS_H[reglerRaster("hs-h")];
  setzeAnzeige("hs-x-anzeige", num(x));
  setzeAnzeige("hs-h-anzeige", num(h));
  const K = koordinatenXY({ hoehe: 320, xmin: -0.2, xmax: 3.8, ymin: 0, ymax: 8.5 });
  flaechen(K, HS.f, () => 0, 0, x, { pos: "dr-flaeche-a", rolle: "flaeche-bis-x" });
  flaechen(K, HS.f, () => 0, x, x + h, { pos: "dr-streifen-h", rolle: "streifen" });
  rechteck(K, x, 0, x + h, HS.f(x), "dr-schranke-r", { "data-rolle": "rechteck-unten" });
  rechteck(K, x, 0, x + h, HS.f(x + h), "dr-schranke-r", { "data-rolle": "rechteck-oben" });
  graph(K, HS.f, -0.2, 3.8, { schritte: 400 });
  zeige("hs-mount", K.svg);
  const dI = HS.F(x + h) - HS.F(x), q = dI / h;
  setzeHtml("hs-bilanz",
    `f(x) = 0,5x² + 1. Streifen von ${num(x)} bis ${num(x + h)}: I(x + h) − I(x) ${gleich(dI, 6)}<br>` +
    `f(${num(x)}) = <span class="wc">${num(HS.f(x), 6)}</span> ≤ ${bruch("I(x + h) − I(x)", "h")} ${zeichen(q, 6)} <span class="wr">${num(q, 6)}</span> ≤ f(${num(x + h)}) = ${num(HS.f(x + h), 6)}`);
  setzeText("hs-text", h >= 0.5
    ? "Bei breitem Streifen liegen die beiden Rechtecke noch weit auseinander. Verkleinere h."
    : h > 0.01
      ? "Die Rechtecke rücken zusammen; der Quotient wird zwischen f(x) und f(x + h) eingeklemmt."
      : `Bei h = 0,01 unterscheidet sich der Quotient von f(${num(x)}) nur noch in der zweiten Nachkommastelle — im Grenzwert bleibt genau f(x).`);
}

// ================= 6. Stammfunktionen =================

const SF = { f: (x) => x * x - 1, F: (x) => x ** 3 / 3 - x };
function renderStamm() {
  const C = reglerRaster("sf-c"), x0 = reglerRaster("sf-x");
  setzeAnzeige("sf-c-anzeige", num(C));
  setzeAnzeige("sf-x-anzeige", num(x0));
  const K1 = koordinatenXY({ hoehe: 260, xmin: -2.5, xmax: 2.5, ymin: -3.5, ymax: 3.5, panel: "F" });
  panelTitel(K1, "Stammfunktionen F(x) = x³/3 − x + C");
  for (const c of [-2, -1, 0, 1, 2]) {
    if (c === C) continue;
    graph(K1, (x) => SF.F(x) + c, -2.5, 2.5, { schritte: 300, basis: "dr-stamm schar", rolle: "schar" });
    // An der Stelle x₀ dieselbe Steigung für jedes C: kurze Tangentenstücke.
    strecke(K1, x0 - 0.35, SF.F(x0) + c - 0.35 * SF.f(x0), x0 + 0.35, SF.F(x0) + c + 0.35 * SF.f(x0), "dr-tangente2", { "data-rolle": "tangente-schar" });
  }
  graph(K1, (x) => SF.F(x) + C, -2.5, 2.5, { schritte: 400, basis: "dr-stamm", rolle: "stamm" });
  gerade(K1, SF.f(x0), x0, SF.F(x0) + C, "dr-tangente2", { "data-rolle": "tangente" });
  punkt(K1, x0, SF.F(x0) + C, "dr-punkt-t", { "data-rolle": "p-F" });
  // ymax 6: Bei 4 liefe die Parabel links oben durch den Titel.
  const K2 = koordinatenXY({ hoehe: 190, xmin: -2.5, xmax: 2.5, ymin: -1.5, ymax: 6, panel: "f" });
  panelTitel(K2, "f(x) = x² − 1");
  graph(K2, SF.f, -2.5, 2.5, { schritte: 300 });
  punkt(K2, x0, SF.f(x0), "fr-punkt", { "data-rolle": "p-f" });
  zeige("sf-mount", K1.svg, K2.svg);
  setzeHtml("sf-bilanz",
    `F(x) = ${bruch("x³", "3")} − x${C === 0 ? "" : " " + plusMinus(C)}, &nbsp;F′(x) = x² − 1 = f(x) — für jedes C.<br>` +
    `An der Stelle ${num(x0)}: F′(${num(x0)}) = <span class="wr">${num(SF.f(x0))}</span> = f(${num(x0)}); alle Tangenten dort sind parallel. F(0) = ${num(C)} legt C fest.`);
  setzeText("sf-text", "Alle Graphen der Schar entstehen durch Verschieben in y-Richtung. Für ein bestimmtes Integral ist es egal, welche man nimmt: In F(b) − F(a) hebt sich C weg.");
}

// ================= 7. Fläche mit der x-Achse =================

const FL = { f: (x) => 0.25 * x ** 3 - x, F: (x) => x ** 4 / 16 - x * x / 2, nullstellen: [-2, 0, 2] };
function renderFlaeche() {
  const a = reglerRaster("fl-a");
  // b liegt rechts von a — sonst wäre [a; b] kein Intervall.
  const b = begrenzt("fl-b", reglerRaster("fl-b"), a + 0.5, 3);
  setzeAnzeige("fl-a-anzeige", num(a));
  setzeAnzeige("fl-b-anzeige", num(b));
  const K = koordinatenXY({ hoehe: 320, xmin: -3.2, xmax: 3.2, ymin: -2.2, ymax: 4.2 });
  flaechen(K, FL.f, () => 0, a, b);
  graph(K, FL.f, -3.2, 3.2, { schritte: 500 });
  strecke(K, a, -2.2, a, 4.2, "dr-intervallrand", { "data-rolle": "grenze-a" });
  strecke(K, b, -2.2, b, 4.2, "dr-intervallrand", { "data-rolle": "grenze-b" });
  for (const z of FL.nullstellen) if (z > a && z < b) punkt(K, z, 0, "dr-schneidet", { "data-rolle": "teilstelle", r: 4 });
  zeige("fl-mount", K.svg);
  const teile = teilflaechen(FL.F, FL.nullstellen, a, b);
  const I = FL.F(b) - FL.F(a), A = teile.reduce((s, t) => s + Math.abs(t.wert), 0);
  setzeHtml("fl-bilanz",
    `F(x) = ${bruch("x⁴", "16")} − ${bruch("x²", "2")}. Teilintegrale: ${teile.map((t) => `${intZ(num(t.von), num(t.bis))} f(x) dx ${gleich(t.wert)}`).join("; ")}<br>` +
    `Integral über [${num(a)}; ${num(b)}] ${gleich(I)}; &nbsp;<span class="wa">Flächeninhalt ${gleich(A)}</span>`);
  setzeText("fl-text", teile.length === 1
    ? "Keine Nullstelle im Inneren: Der Flächeninhalt ist der Betrag des Integrals."
    : `${teile.length - 1} Nullstelle${teile.length > 2 ? "n" : ""} im Inneren: Das Integral verrechnet Flächen gegeneinander, der Flächeninhalt addiert ihre Beträge.`);
}

// ================= 8. Fläche zwischen zwei Graphen =================

// Zwei Fälle: Parabel und Gerade (quadratische Differenz, pq-Formel) und kubische Funktion und
// Gerade (Differenz ohne absolutes Glied, x ausklammern). Die Bilanz zeigt jeden Rechenschritt.
const ZG = {
  parabel: { f: (x) => 4 - x * x, y: [-9, 5], text: "4 − x²" },
  kubik: { f: (x) => x ** 3 - 3 * x, y: [-8, 8], text: "x³ − 3x" },
};
function renderZwischen() {
  const art = wahl("zg-art"), d = ZG[art];
  const m = reglerRaster("zg-m");
  setzeAnzeige("zg-m-anzeige", num(m));
  const f = d.f, g = (x) => m * x, diff = (x) => f(x) - g(x);
  const gt = m === 0 ? "0" : geradeText(m, 0);
  const K = koordinatenXY({ hoehe: 320, xmin: -4.5, xmax: 4.5, ymin: d.y[0], ymax: d.y[1] });
  let stellen, schritte, A;
  if (art === "parabel") {
    // 4 − x² = mx ⟺ x² + mx − 4 = 0: pq-Formel mit p = m, q = −4.
    const w = Math.sqrt((m * m) / 4 + 4);
    stellen = [-m / 2 - w, -m / 2 + w];
    const D = (x) => 4 * x - (m * x * x) / 2 - x ** 3 / 3;
    A = D(stellen[1]) - D(stellen[0]);
    schritte = [
      `① Gleichsetzen: 4 − x² = ${gt}`,
      `② Nullform: x²${m === 0 ? "" : " " + plusMinus(m) + "x"} − 4 = 0 &nbsp;(p ${gleich(m)}, q = −4)`,
      `③ pq-Formel: x = ${m === 0 ? "" : `${num(-m / 2)} `}± √(${numK(m / 2)}² + 4) = ${m === 0 ? "" : `${num(-m / 2)} `}± √${num((m * m) / 4 + 4)} ⟹ x₁ ${gleich(stellen[0])}, x₂ ${gleich(stellen[1])}`,
      `④ Probe: f(x₁) ${gleich(f(stellen[0]))} und g(x₁) ${gleich(g(stellen[0]))} ✓`,
      `⑤ A = ${intZ("x₁", "x₂")} (4 − x²${m === 0 ? "" : " " + plusMinus(-m) + "x"}) dx = ${klammer(`4x${m === 0 ? "" : " " + plusMinus(-m / 2) + "x²"} − ${bruch("x³", "3")}`, "x₁", "x₂")} — <span class="wa">Flächeninhalt ${gleich(A)}</span>`,
    ];
  } else {
    // x³ − 3x = mx ⟺ x · (x² − (3 + m)) = 0: x ausklammern, dann x² = 3 + m.
    const c = 3 + m;
    stellen = c > 1e-12 ? [-Math.sqrt(c), 0, Math.sqrt(c)] : [0];
    // d ist ungerade: Beide Teilflächen sind gleich groß, je c²/4.
    const D = (x) => x ** 4 / 4 - (c * x * x) / 2;
    const teile = stellen.slice(1).map((x2, i) => D(x2) - D(stellen[i]));
    A = teile.reduce((sm, t) => sm + Math.abs(t), 0);
    schritte = [
      `① Gleichsetzen: x³ − 3x = ${gt}`,
      // Bei m = −3 ist c = 0: Dann steht nur x³ da, kein „+ 0x“.
      `② Nullform: x³${c === 0 ? "" : ` ${plusMinus(-c)}x`} = 0`,
      (c === 0 ? "③ x³ = 0 ⟹ x = 0" : `③ x ausklammern: x · (x² ${plusMinus(-c)}) = 0 ⟹ x = 0 oder x² = ${num(c)}`) + (c > 1e-12
        ? ` ⟹ x₁ ${gleich(stellen[0])}, x₂ = 0, x₃ ${gleich(stellen[2])}`
        : " — nur die (dreifache) Schnittstelle 0"),
      c > 1e-12 ? `④ Probe: f(x₃) ${gleich(f(stellen[2]))} und g(x₃) ${gleich(g(stellen[2]))} ✓` : "④ Mit nur einer Schnittstelle schließen die Graphen keine Fläche ein.",
      c > 1e-12
        ? `⑤ ${intZ("x₁", "0")} d(x) dx ${gleich(teile[0])}, ${intZ("0", "x₃")} d(x) dx ${gleich(teile[1])} mit d(x) = x³ ${plusMinus(-c)}x — <span class="wa">Flächeninhalt ${gleich(A)}</span>`
        : `⑤ <span class="wa">Flächeninhalt = 0</span>`,
    ];
  }
  if (stellen.length > 1) flaechen(K, f, g, stellen[0], stellen[stellen.length - 1]);
  graph(K, f, -4.5, 4.5, { schritte: 400, rolle: "graph-f" });
  gerade(K, m, 0, 0, "dr-sekante", { "data-rolle": "graph-g" });
  for (const x of stellen) punkt(K, x, f(x), "dr-schnitt", { "data-rolle": "schnitt", r: 5 });
  zeige("zg-mount", K.svg);
  setzeHtml("zg-bilanz", schritte.join("<br>"));
  setzeText("zg-text", art === "parabel"
    ? (m === 0
      ? "Die Gerade ist die x-Achse: Die Schnittstellen sind die Nullstellen der Parabel, A = 32/3."
      : "Die Fläche liegt teils unter der x-Achse — trotzdem zählt sie positiv, denn integriert wird die Differenz f − g, die zwischen den Schnittstellen positiv ist.")
    : (stellen.length === 1
      ? "Die Gerade schneidet den Graphen nur im Ursprung — es gibt keine eingeschlossene Fläche."
      : "Drei Schnittstellen, zwei Teilflächen: Links liegt f über g (grün), rechts darunter (orange). Über [x₁; x₃] auf einmal integriert gäbe 0 — die Teilflächen müssen einzeln betragen werden."));
}

// ================= 9. Mittelwert =================

const MW = { f: (t) => -0.5 * t * t + 3 * t + 10, F: (t) => -(t ** 3) / 6 + 1.5 * t * t + 10 * t };
function renderMittelwert() {
  const b = reglerRaster("mw-b");
  setzeAnzeige("mw-b-anzeige", `${num(b)} h`);
  const I = MW.F(b) - MW.F(0), m = I / b;
  const K = koordinatenXY({ hoehe: 300, xmin: 0, xmax: 6.3, ymin: 0, ymax: 16, xName: "t in h", yName: "T in °C" });
  flaechen(K, MW.f, () => 0, 0, b);
  rechteck(K, 0, 0, b, m, "dr-mittel", { "data-rolle": "mittel" });
  graph(K, MW.f, 0, 6.3, { schritte: 300 });
  // Stellen, an denen f den Mittelwert annimmt: −0,5t² + 3t + 10 = m.
  const disk = 9 - 2 * (m - 10);
  for (const t of [3 - Math.sqrt(disk), 3 + Math.sqrt(disk)]) if (t >= 0 && t <= b) punkt(K, t, m, "dr-wende", { "data-rolle": "mittelstelle", r: 4 });
  zeige("mw-mount", K.svg);
  setzeHtml("mw-bilanz",
    `${intZ("0", num(b))} T(t) dt = ${klammer(`−${bruch("t³", "6")} + 1,5t² + 10t`, "0", num(b))} ${gleich(I)}<br>` +
    `Mittelwert m = ${bruch(num(I, 4), num(b))} ${zeichen(m)} <span class="wr">${num(m)} °C</span>; Mittel der Randwerte: ${bruch(`${num(MW.f(0))} + ${num(MW.f(b))}`, "2")} = ${num((MW.f(0) + MW.f(b)) / 2)} °C`);
  setzeText("mw-text", "Das gestrichelte Rechteck hat dieselbe Fläche wie die Fläche unter dem Graphen: Was oben über das Rechteck hinausragt, fehlt ihm an den Rändern. An den violett markierten Stellen ist die Temperatur gerade gleich dem Mittelwert.");
}

// ================= 10. Uneigentliche Integrale =================

const UE_B = [1.5, 2, 3, 5, 10, 20, 100, 1000];
const UE_E = [0.5, 0.25, 0.1, 0.05, 0.02, 0.01, 0.001, 0.0001];
// „pol“: Die Problemstelle ist die Polstelle 0 am linken Rand; der Regler stellt ε statt b ein.
const UE = {
  quadrat: { f: (x) => 1 / (x * x), F: (x) => -1 / x, pol: false, grenz: 1, Ftext: "−1/x", term: "1/x²" },
  wurzel: { f: (x) => 1 / Math.sqrt(x), F: (x) => 2 * Math.sqrt(x), pol: false, grenz: Infinity, Ftext: "2√x", term: "1/√x" },
  polwurzel: { f: (x) => 1 / Math.sqrt(x), F: (x) => 2 * Math.sqrt(x), pol: true, grenz: 2, Ftext: "2√x", term: "1/√x" },
  polquadrat: { f: (x) => 1 / (x * x), F: (x) => -1 / x, pol: true, grenz: Infinity, Ftext: "−1/x", term: "1/x²" },
};
function renderUneigentlich() {
  const d = UE[wahl("ue-art")], k = reglerRaster("ue-k");
  setzeText("ue-k-name", d.pol ? "ε" : "b");
  if (!d.pol) {
    const b = UE_B[k];
    setzeAnzeige("ue-k-anzeige", num(b));
    const K = koordinatenXY({ hoehe: 300, xmin: 0, xmax: 10.5, ymin: 0, ymax: 1.6 });
    flaechen(K, d.f, () => 0, 1, Math.min(b, 10.5), { pos: "dr-flaeche-pos" });
    graph(K, d.f, 0.3, 10.5, { schritte: 400 });
    strecke(K, 1, 0, 1, 1.6, "dr-intervallrand", { "data-rolle": "grenze-a" });
    if (b <= 10.5) strecke(K, b, 0, b, 1.6, "dr-intervallrand", { "data-rolle": "grenze-b" });
    zeige("ue-mount", K.svg);
    const I = d.F(b) - d.F(1);
    setzeHtml("ue-bilanz",
      `${intZ("1", num(b))} ${d.term} dx = ${klammer(d.Ftext, "1", num(b))} = ${d.grenz === 1 ? `1 − ${bruch("1", num(b))}` : `2 · √${num(b)} − 2`} ${gleich(I)}<br>` +
      (d.grenz === 1 ? `Für b → ∞ geht ${bruch("1", "b")} → 0, das Integral also gegen <span class="wa">1</span>: konvergent.` : `Für b → ∞ wächst 2√b − 2 über jede Grenze: <span class="wo">divergent</span>.`));
    setzeText("ue-text", (b > 10.5 ? `b = ${num(b)} liegt weit rechts außerhalb des Bildes. ` : "") + (d.grenz === 1
      ? "Jeder weitere Abschnitt bringt immer weniger dazu — die Summe bleibt unter 1."
      : "1/√x fällt zu langsam: Die Fläche wächst ohne Grenze, nur immer langsamer."));
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

// ================= 11. Rotationskörper =================

const RK = {
  kegel: { f: (x) => 0.5 * x, a: 0, b: 4, V: (16 * Math.PI) / 3, Vtext: "16π/3" },
  paraboloid: { f: (x) => Math.sqrt(x), a: 0, b: 4, V: 8 * Math.PI, Vtext: "8π" },
  kugel: { f: (x) => Math.sqrt(Math.max(0, 4 - x * x)), a: -2, b: 2, V: (32 * Math.PI) / 3, Vtext: "32π/3" },
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

// ================= 12. Stolperstelle =================

const ST_E = [0.5, 0.25, 0.1, 0.05, 0.02, 0.01];
function renderStolperstelle() {
  const e = ST_E[reglerRaster("st-k")];
  setzeAnzeige("st-k-anzeige", num(e));
  const f = (x) => 1 / (x * x);
  const K = koordinatenXY({ hoehe: 300, xmin: -1.25, xmax: 1.25, ymin: 0, ymax: 12 });
  flaechen(K, f, () => 0, -1, -e);
  flaechen(K, f, () => 0, e, 1);
  graph(K, f, -1.25, -0.05, { schritte: 300, rolle: "graph" });
  graph(K, f, 0.05, 1.25, { schritte: 300, rolle: "graph" });
  strecke(K, 0, 0, 0, 12, "dr-pol", { "data-rolle": "pol" });
  zeige("st-mount", K.svg);
  const A = 2 * (1 / e - 1);
  setzeHtml("st-bilanz",
    `Fläche über [−1; −${num(e)}] und [${num(e)}; 1]: 2 · (${bruch("1", num(e))} − 1) = <span class="wo">${num(A)}</span><br>` +
    `Lenas Rechnung ${klammer("−1/x", "−1", "1")} = −2 ist <span class="wg">negativ</span> — eine positive Funktion kann keine negative Fläche haben.`);
  setzeText("st-text", e >= 0.1
    ? "Die beiden Flächen außerhalb des Streifens sind schon jetzt positiv — und es kommt noch der Streifen um 0 dazu."
    : `Bei ε = ${num(e)} sind es schon ${num(A)} Flächeneinheiten. Für ε → 0 wächst die Fläche über jede Grenze: Das Integral existiert nicht.`);
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
  "quiz-rekonstruktion": {
    q: "Ein Tank enthält 20 ℓ. Drei Minuten lang fließen 4 ℓ pro Minute zu, dann zwei Minuten lang 5 ℓ pro Minute ab. Wie viel ist danach im Tank?",
    options: ["42 ℓ", "22 ℓ", "12 ℓ", "2 ℓ"],
    correct: 1,
    explain: "20 + 4 · 3 − 5 · 2 = 22. Die Abflussphase ist ein Rechteck unter der Achse und wird abgezogen. 42 ℓ entstehen, wenn man auch den Abfluss addiert; 2 ℓ ist nur die Änderung ohne Anfangsbestand.",
  },
  "quiz-summen": {
    q: "f(x) = x² auf [0; 1] mit n = 2 Streifen. Wie groß ist die Obersumme O₂?",
    options: ["0,125", "0,3125", "0,625", "0,5"],
    correct: 2,
    explain: "Breite 0,5, rechte Ränder 0,5 und 1: O₂ = 0,5 · (0,25 + 1) = 0,625. Die Untersumme mit den linken Rändern 0 und 0,5 ist 0,5 · (0 + 0,25) = 0,125. Die Fläche 1/3 liegt dazwischen.",
  },
  "quiz-integral": {
    q: `Für eine Funktion gilt ${intZ("0", "2")} f(x) dx = 5 und ${intZ("2", "6")} f(x) dx = −3. Wie groß ist ${intZ("0", "6")} f(x) dx?`,
    options: ["8", "2", "−2", "nicht bestimmbar"],
    correct: 1,
    explain: `Intervalladditivität: ${intZ("0", "6")} = ${intZ("0", "2")} + ${intZ("2", "6")} = 5 + (−3) = 2. Der Flächeninhalt wäre 8, wenn f auf [2; 6] ganz unter der Achse liegt — aber gefragt ist das Integral, nicht die Fläche.`,
  },
  "quiz-integralfunktion": {
    q: `Die Integralfunktion I₀(x) = ${intZ("0", "x")} f(t) dt hat bei x = 3 einen Hochpunkt. Was weißt du über f?`,
    options: ["f(3) = 0, und f wechselt dort von + nach −.", "f hat bei 3 einen Hochpunkt.", "f(3) ist der größte Wert von f.", "I₀(3) = 0."],
    correct: 0,
    explain: "I₀′ = f: Ein Hochpunkt von I₀ heißt, dass f bei 3 null wird und von positiv nach negativ wechselt — bis 3 kommt Fläche über der Achse dazu, danach wird abgezogen. I₀(3) ist dort am größten, aber nicht 0.",
  },
  "quiz-hauptsatz": {
    q: "Welche Aussage ist der Inhalt des Hauptsatzes?",
    options: ["Jede Funktion hat eine Ableitung.", "Die Fläche unter f ist immer positiv.", `Integrieren ist für stetige Funktionen die Umkehrung des Ableitens: (${intZ("a", "x")} f(t) dt)′ = f(x).`, `${intZ("a", "b")} f(x) dx = f(b) − f(a).`],
    correct: 2,
    explain: `Die Integralfunktion einer stetigen Funktion hat die Ableitung f; deshalb ist ${intZ("a", "b")} f(x) dx = F(b) − F(a) für eine Stammfunktion F. Eingesetzt wird in F, nicht in f — das ist der häufigste Fehler beim Anwenden.`,
  },
  "quiz-stammfunktion": {
    q: "Welche Funktion ist eine Stammfunktion von f(x) = 6x² + cos(x)?",
    options: ["F(x) = 12x − sin(x)", "F(x) = 2x³ − sin(x)", "F(x) = 6x³ + sin(x)", "F(x) = 2x³ + sin(x) + 7"],
    correct: 3,
    explain: "(2x³)′ = 6x² und (sin x)′ = cos x; die Konstante 7 fällt beim Ableiten weg. 12x − sin(x) ist die Ableitung von f, nicht die Stammfunktion; bei 6x³ fehlt das Teilen durch 3.",
  },
  "quiz-flaeche": {
    q: "f(x) = x³ auf [−2; 2]. Was ist richtig?",
    options: ["Integral 0 und Flächeninhalt 8", "Integral 8 und Flächeninhalt 8", "Integral 0 und Flächeninhalt 0", "Integral 4 und Flächeninhalt 4"],
    correct: 0,
    explain: `${intZ("−2", "2")} x³ dx = [x⁴/4] = 4 − 4 = 0, weil sich die beiden Teile aufheben. Jeder Teil hat den Inhalt ${intZ("0", "2")} x³ dx = 4, zusammen also 8. Erst an der Nullstelle 0 teilen, dann die Beträge addieren.`,
  },
  "quiz-zwischen": {
    q: "Wo liegen die Integrationsgrenzen für die Fläche zwischen f(x) = x² und g(x) = 2x?",
    options: ["bei den Nullstellen von f", "bei x = 0 und x = 2, den Schnittstellen", "bei x = −2 und x = 2", "bei den Nullstellen von g"],
    correct: 1,
    explain: `x² = 2x ⟺ x(x − 2) = 0 ⟺ x = 0 oder x = 2. Dazwischen liegt g über f, und A = ${intZ("0", "2")} (2x − x²) dx = 4 − 8/3 = 4/3.`,
  },
  "quiz-mittelwert": {
    q: "Der Mittelwert von f(x) = x² auf [0; 3] ist …",
    options: ["4,5", "9", "1,5", "3"],
    correct: 3,
    explain: `m = (1/3) · ${intZ("0", "3")} x² dx = (1/3) · 9 = 3. Das Mittel der Randwerte wäre (0 + 9)/2 = 4,5 — es stimmt nur für lineare Funktionen.`,
  },
  "quiz-uneigentlich": {
    q: `Welches der Integrale ${intZ("1", "∞")} f(x) dx ist konvergent?`,
    options: ["f(x) = 1/x³", "f(x) = 1/√x", "f(x) = 1", "f(x) = 1/∛x"],
    correct: 0,
    explain: `${intZ("1", "b")} x⁻³ dx = ${klammer("−1/(2x²)", "1", "b")} = 1/2 − 1/(2b²) → 1/2. Bei 1/√x und 1/∛x fällt f zu langsam, die Stammfunktion wächst wie eine Wurzel über jede Grenze; bei f = 1 ist die Fläche b − 1.`,
  },
  "quiz-rotation": {
    q: "Das Volumen des Körpers, der entsteht, wenn f(x) = 2 auf [0; 3] um die x-Achse rotiert, ist …",
    options: ["6π", "12π", "36π", "18π"],
    correct: 1,
    explain: `V = π ${intZ("0", "3")} 2² dx = π · 4 · 3 = 12π — ein Zylinder mit Radius 2 und Höhe 3, also π r² h. 36π entsteht, wenn man die Fläche 6 quadriert statt den Radius.`,
  },
  "quiz-stolperstelle": {
    q: `Darf man ${intZ("−1", "1")} 1/x² dx mit dem Hauptsatz berechnen?`,
    options: ["Ja, mit F(x) = −1/x ergibt sich −2.", "Ja, das Ergebnis ist 2, weil die Fläche positiv sein muss.", "Ja, wenn man den Betrag nimmt.", "Nein, weil 1/x² bei 0 nicht stetig (nicht einmal definiert) ist."],
    correct: 3,
    explain: "Der Hauptsatz setzt Stetigkeit auf dem ganzen Intervall voraus. Bei 0 liegt eine Polstelle; als uneigentliches Integral divergiert es, denn ∫_ε¹ 1/x² dx = 1/ε − 1 wächst über jede Grenze.",
  },
};

// ================= Selbsteinschätzung =================
//
// Die Auswahl liegt nur im Browser dieser Person — eine Lernhilfe, keine Leistungsmessung.
const SE_PUNKTE = [
  ["sec-rekonstruktion", "Ich kann einen Bestand aus seiner Änderungsrate rekonstruieren und Abnahmen richtig abziehen."],
  ["sec-summen", "Ich kann Unter- und Obersummen aufstellen und erklären, warum ihr gemeinsamer Grenzwert die Fläche ist."],
  ["sec-integral", "Ich kann das Integral als orientierten Flächeninhalt deuten und seine Eigenschaften nutzen."],
  ["sec-integralfunktion", "Ich kann den Graphen einer Integralfunktion aus dem Graphen von f beschreiben."],
  ["sec-hauptsatz", "Ich kann den Hauptsatz formulieren, begründen und anwenden."],
  ["sec-stammfunktion", "Ich kann Stammfunktionen bilden — auch für sin, cos und bei linearer Verkettung."],
  ["sec-flaeche", "Ich kann Flächen zwischen Graph und x-Achse berechnen, auch mit Vorzeichenwechsel."],
  ["sec-zwischen", "Ich kann Flächen zwischen zwei Graphen berechnen."],
  ["sec-mittelwert", "Ich kann Mittelwerte bestimmen und Integrale im Sachzusammenhang deuten."],
  ["sec-uneigentlich", "Ich kann uneigentliche Integrale berechnen und entscheiden, ob sie konvergieren."],
  ["sec-rotation", "Ich kann Volumina von Rotationskörpern berechnen."],
  ["sec-stolperstelle", "Ich prüfe vor dem Integrieren, ob der Integrand im Intervall stetig ist."],
];
const SE_SCHLUESSEL = "uplant-mss11-integralrechnung-selbsteinschaetzung";

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
  [["re-art", "re-t"], renderRekonstruktion],
  [["su-b", "su-n"], renderSummen],
  [["in-art", "in-a", "in-b"], renderIntegral],
  [["if-a", "if-x"], renderIntegralfunktion],
  [["hs-x", "hs-h"], renderHauptsatz],
  [["sf-c", "sf-x"], renderStamm],
  [["fl-a", "fl-b"], renderFlaeche],
  [["zg-art", "zg-m"], renderZwischen],
  [["mw-b"], renderMittelwert],
  [["ue-art", "ue-k"], renderUneigentlich],
  [["rk-art", "rk-n"], renderRotation],
  [["st-k"], renderStolperstelle],
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
