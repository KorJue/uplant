// Selbstlernpfad „Grundkonstruktionen und besondere Linien am Dreieck“ (Klasse 8, Geometrie).
//
// Aufbau wie die Flächeninhalte: Abschnitt, bewegliche Zeichnung, Bilanz, Kontrollfrage.
// Die Übungsaufgaben stehen in besondere-linien-aufgaben.js, das Konstruieren mit Zirkel und
// Lineal bleibt das bewährte Werkzeug aus grundkonstruktionen.js.
//
// Leitgedanke: Jede der vier Linien ist eine ORTSLINIE — die Menge aller Punkte mit einer
// Eigenschaft. Daraus folgt alles Weitere:
//   Mittelsenkrechte   — alle Punkte, die von A und B gleich weit entfernt sind.
//                        ⇒ Schnittpunkt aller drei = gleich weit von allen Ecken = Umkreismitte.
//   Winkelhalbierende  — alle Punkte, die von beiden Schenkeln gleich weit entfernt sind.
//                        ⇒ Schnittpunkt aller drei = gleich weit von allen Seiten = Inkreismitte.
//   Seitenhalbierende  — Ecke mit der Mitte der Gegenseite (die Mitte liefert die Mittelsenkrechte).
//   Höhe               — Lot von der Ecke auf die (verlängerte) Gegenseite.
//
// Reihenfolge: Mittelsenkrechte vor allem anderen, denn die Seitenmitte der Seitenhalbierenden
// wird mit ihr konstruiert. Umkreis direkt nach der Mittelsenkrechten, Inkreis direkt nach der
// Winkelhalbierenden — jeweils als Folgerung der Ortslinien-Eigenschaft, nicht als neue Regel.
//
// Zu den Zahlen: Das Dreieck wird über c, α und β eingestellt (WSW). Winkel sind damit exakte
// Reglerwerte, und die Einteilung spitz-, recht-, stumpfwinklig ist eine Rechnung mit ganzen
// Gradzahlen, keine Messung. Schräge Längen dagegen bräuchten den Sinussatz oder Pythagoras —
// beides kommt erst später. Wo eine Länge als Zahl erscheint, steht deshalb „gemessen“ daran.

import { mountUebungsaufgaben as mountUebungsaufgabenBasis } from "../../aufgaben.js?v=2";
import { AUFGABEN } from "./besondere-linien-aufgaben.js?v=1";

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
// Ein Zahlformat je Stellenzahl, einmal angelegt — bei jeder Reglerbewegung wird dutzendfach
// formatiert, und ein neues Intl.NumberFormat je Aufruf kostet ein Vielfaches.
const ZAHLFORMATE = new Map();
function zahlformat(stellen) {
  let f = ZAHLFORMATE.get(stellen);
  if (!f) ZAHLFORMATE.set(stellen, (f = new Intl.NumberFormat("de-DE", { maximumFractionDigits: stellen })));
  return f;
}
// Deutsche Schreibweise. Gerundet wird VOR der Ausgabe, damit −0,0001 nicht als „−0“ erscheint.
function num(x, digits = 4) {
  const f = Math.pow(10, digits);
  const gerundet = Math.round(x * f) / f;
  return zahlformat(digits).format(gerundet === 0 ? 0 : gerundet);
}
// „=“ oder „≈“? Entscheidend ist, ob die Anzeige den Wert mit der Stellenzahl genau trifft.
function zeichen(x, stellen = 2) {
  const f = Math.pow(10, stellen);
  return Math.abs(x - Math.round(x * f) / f) < 1e-9 ? "=" : "≈";
}
function parseFlexibleNumber(raw) {
  if (raw == null) return NaN;
  const s = String(raw).trim().replace(/\s/g, "").replace(/−/g, "-").replace(/\./g, "").replace(",", ".");
  return parseFloat(s);
}
const mountUebungsaufgaben = (container, defs) =>
  mountUebungsaufgabenBasis(container, defs, { parse: parseFlexibleNumber });

// Schreibt einen begrenzten Reglerwert in den Regler zurück. Ein Regler darf nie etwas anderes
// anzeigen als das, womit gerechnet wird.
function begrenzt(id, wert, min, max) {
  const v = Math.min(max, Math.max(min, wert));
  if (v !== wert) document.getElementById(id).value = String(v);
  return v;
}
function reglerZahl(id) {
  return Number(document.getElementById(id).value);
}

// ---------- Geometrie in Zentimetern ----------

const ab = (p, q) => Math.hypot(q.x - p.x, q.y - p.y);
const mitte = (p, q) => ({ x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 });
const plus = (p, u, t = 1) => ({ x: p.x + t * u.x, y: p.y + t * u.y });
const richtung = (p, q) => { const l = ab(p, q) || 1; return { x: (q.x - p.x) / l, y: (q.y - p.y) / l }; };
const senkrecht = (u) => ({ x: -u.y, y: u.x });
const RAD = Math.PI / 180;

// Lotfußpunkt von P auf die GERADE durch Q und R — er darf außerhalb der Strecke liegen.
function lotfuss(P, Q, R) {
  const ux = R.x - Q.x, uy = R.y - Q.y;
  const t = ((P.x - Q.x) * ux + (P.y - Q.y) * uy) / (ux * ux + uy * uy);
  return { x: Q.x + t * ux, y: Q.y + t * uy, t };
}

// Das Dreieck aus c, α und β: A im Ursprung, B auf der x-Achse, C über AB. Die Lage von C
// folgt aus den beiden Winkeln (Schnitt der freien Schenkel) — gerechnet, nicht gemessen.
function dreieck(c, alpha, beta) {
  const A = { x: 0, y: 0 }, B = { x: c, y: 0 };
  const ta = Math.tan(alpha * RAD), tb = Math.tan(beta * RAD);
  // Schenkel von A: y = x · tan α; Schenkel von B: y = (c − x) · tan β. Bei α = 90° steht der
  // Schenkel senkrecht — dann liegt C genau über A.
  let x;
  if (Math.abs(alpha - 90) < 1e-9) x = 0;
  else if (Math.abs(beta - 90) < 1e-9) x = c;
  else x = (c * tb) / (ta + tb);
  const y = Math.abs(alpha - 90) < 1e-9 ? c * tb : x * ta;
  return { A, B, C: { x, y } };
}

// Die vier besonderen Punkte. Gerechnet über Koordinaten — die Zeichnung ist Anzeige, nicht
// Rechengrundlage; die Prüfung rechnet sie aus dem SVG unabhängig nach.
function umkreismitte(A, B, C) {
  const d = 2 * (A.x * (B.y - C.y) + B.x * (C.y - A.y) + C.x * (A.y - B.y));
  const a2 = A.x * A.x + A.y * A.y, b2 = B.x * B.x + B.y * B.y, c2 = C.x * C.x + C.y * C.y;
  return {
    x: (a2 * (B.y - C.y) + b2 * (C.y - A.y) + c2 * (A.y - B.y)) / d,
    y: (a2 * (C.x - B.x) + b2 * (A.x - C.x) + c2 * (B.x - A.x)) / d,
  };
}
function inkreismitte(A, B, C) {
  const a = ab(B, C), b = ab(C, A), c = ab(A, B), u = a + b + c;
  return { x: (a * A.x + b * B.x + c * C.x) / u, y: (a * A.y + b * B.y + c * C.y) / u };
}
function schwerpunkt(A, B, C) {
  return { x: (A.x + B.x + C.x) / 3, y: (A.y + B.y + C.y) / 3 };
}
// H = A + B + C − 2M: kürzer als der Schnitt zweier Höhen und für jede Lage von H gültig.
function hoehenschnitt(A, B, C) {
  const M = umkreismitte(A, B, C);
  return { x: A.x + B.x + C.x - 2 * M.x, y: A.y + B.y + C.y - 2 * M.y };
}

// Die Art des Dreiecks — aus den ganzzahligen Winkeln, also exakt.
function winkelart(alpha, beta) {
  const gamma = 180 - alpha - beta;
  const groesster = Math.max(alpha, beta, gamma);
  const ecke = groesster === alpha ? "A" : groesster === beta ? "B" : "C";
  if (groesster === 90) return { art: "recht", ecke, gamma };
  if (groesster > 90) return { art: "stumpf", ecke, gamma };
  return { art: "spitz", ecke, gamma };
}

// ---------- Zeichenbausteine ----------

// Eine Bühne rechnet Zentimeter in Bildpunkte um. Der Nullpunkt liegt unten links,
// y zeigt nach oben — wie im Heft und anders als in SVG.
function buehne(breite, hoehe, ox, oy, skala) {
  const svg = svgEl("svg", {
    viewBox: `0 0 ${breite} ${hoehe}`, width: breite, height: hoehe,
    class: "th-flaeche", preserveAspectRatio: "xMidYMid meet",
  });
  const g = svgEl("g");
  svg.appendChild(g);
  return { svg, g, skala, P: (x, y) => ({ x: ox + x * skala, y: oy - y * skala }) };
}

// Die Bühne richtet sich nach allem, was gezeichnet werden KANN — nicht nur nach dem
// Augenblick. Sonst spränge die Zeichnung beim Ziehen am Regler hin und her.
function buehneAuto(breite, maxHoehe, punkte, { rand = 40, maxSkala = 50 } = {}) {
  const xs = punkte.map((p) => p.x), ys = punkte.map((p) => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const spanX = Math.max(0.5, maxX - minX), spanY = Math.max(0.5, maxY - minY);
  const skala = Math.min(maxSkala, (breite - 2 * rand) / spanX, (maxHoehe - 2 * rand) / spanY);
  const hoehe = Math.round(spanY * skala + 2 * rand);
  const ox = rand + (breite - 2 * rand - spanX * skala) / 2 - minX * skala;
  const oy = hoehe - rand + minY * skala;
  return buehne(breite, hoehe, ox, oy, skala);
}

// Jede Linienart hat ihre Klasse — die Farben stehen im CSS, damit der Dunkelmodus sie
// aufhellen kann. data-rolle sagt der Prüfung, was ein Element darstellt.
function strecke(b, p, q, klasse, rolle, extra = {}) {
  const a = b.P(p.x, p.y), c = b.P(q.x, q.y);
  const e = svgEl("line", Object.assign({
    x1: a.x.toFixed(2), y1: a.y.toFixed(2), x2: c.x.toFixed(2), y2: c.y.toFixed(2),
    class: klasse, "data-rolle": rolle || "",
  }, extra));
  b.g.appendChild(e);
  return e;
}
// Eine Gerade durch P in Richtung u, auf die Bühne zugeschnitten: Sie reicht so weit, wie die
// Zeichnung breit ist — eine Ortslinie hat kein Ende.
function gerade(b, P, u, laenge, klasse, rolle, extra = {}) {
  return strecke(b, plus(P, u, -laenge), plus(P, u, laenge), klasse, rolle, extra);
}
function kreis(b, M, r, klasse, rolle) {
  const q = b.P(M.x, M.y);
  const e = svgEl("circle", { cx: q.x.toFixed(2), cy: q.y.toFixed(2), r: (r * b.skala).toFixed(2), class: klasse, "data-rolle": rolle || "" });
  b.g.appendChild(e);
  return e;
}
function polygon(b, punkte, klasse, rolle) {
  const pts = punkte.map((p) => { const q = b.P(p.x, p.y); return `${q.x.toFixed(2)},${q.y.toFixed(2)}`; }).join(" ");
  const e = svgEl("polygon", { points: pts, class: klasse, "data-rolle": rolle || "" });
  b.g.appendChild(e);
  return e;
}
// Rechter-Winkel-Kästchen im Punkt V, ausgerichtet auf P und Q.
function rechterWinkel(b, V, P, Q, klasse, seiteCm = 0.3) {
  const d1 = richtung(V, P), d2 = richtung(V, Q);
  const p1 = plus(V, d1, seiteCm), p3 = plus(V, d2, seiteCm), p2 = plus(p1, d2, seiteCm);
  const pts = [p1, p2, p3].map((p) => { const q = b.P(p.x, p.y); return `${q.x.toFixed(2)},${q.y.toFixed(2)}`; }).join(" ");
  b.g.appendChild(svgEl("polyline", { points: pts, class: klasse + " bl-winkel", fill: "none" }));
}
// Beschriftung an einem Punkt (cm), um dx/dy Bildpunkte versetzt.
function text(b, p, inhalt, klasse, dx = 0, dy = 0) {
  const q = b.P(p.x, p.y);
  b.g.appendChild(svgText(q.x + dx, q.y + dy, inhalt, { class: klasse }));
}
// Punktmarke samt Namen in einer Gruppe, die den Namen trägt: Die Prüfung liest die Marke,
// nicht die versetzte Beschriftung.
// Ein Name wie „M_b“ bekommt einen echten Index: Für b gibt es kein Unicode-Tiefzeichen, und
// „M_b“ im Bild sähe aus wie Programmcode.
function punkt(b, p, name, dx = 0, dy = -10, klasse = "th-punkt", textKlasse = "th-punkt-name") {
  const q = b.P(p.x, p.y);
  const gruppe = svgEl("g", { class: "th-punkt-gruppe", "data-name": name || "" });
  gruppe.appendChild(svgEl("circle", { cx: q.x.toFixed(2), cy: q.y.toFixed(2), r: 3.5, class: klasse }));
  if (name) {
    const [haupt, index] = name.split("_");
    const t = svgText(q.x + dx, q.y + dy, haupt, { class: textKlasse });
    if (index) {
      const sub = svgEl("tspan", { "baseline-shift": "sub", "font-size": "10" });
      sub.textContent = index;
      t.appendChild(sub);
    }
    gruppe.appendChild(t);
  }
  b.g.appendChild(gruppe);
}
// Ecken des Dreiecks mit nach außen versetzten Namen — der Versatz zeigt vom Schwerpunkt weg,
// damit „C“ bei jeder Form des Dreiecks außerhalb steht.
function ecken(b, D) {
  const S = b.P(...Object.values(schwerpunkt(D.A, D.B, D.C)));
  for (const n of ["A", "B", "C"]) {
    const q = b.P(D[n].x, D[n].y);
    const l = Math.hypot(q.x - S.x, q.y - S.y) || 1;
    punkt(b, D[n], n, ((q.x - S.x) / l) * 15, ((q.y - S.y) / l) * 15 + 4);
  }
}
function zeige(mountId, b) {
  const mount = document.getElementById(mountId);
  mount.innerHTML = "";
  mount.appendChild(b.svg);
}

// Der Rahmen einer Dreiecks-Bühne: alle Dreiecke, die die Regler zulassen, passen hinein —
// sonst änderte sich der Maßstab beim Ziehen. Die besonderen Punkte liegen bei sehr stumpfen
// Dreiecken weit draußen; dafür reicht ein fester Rand um das Dreieck mit c = 9 nicht. Die
// Bühne nimmt deshalb die Punkte des gerade gewählten Dreiecks mit, aber die Breite steht fest.
function dreiecksBuehne(breite, maxHoehe, punkte) {
  return buehneAuto(breite, maxHoehe, punkte, { rand: 38, maxSkala: 46 });
}

// Die drei Regler eines Dreiecks lesen und γ ≥ 20° erzwingen: β wird begrenzt und in den
// Regler zurückgeschrieben.
function dreiecksRegler(prefix) {
  const c = reglerZahl(prefix + "-c");
  const alpha = reglerZahl(prefix + "-alpha");
  const beta = begrenzt(prefix + "-beta", reglerZahl(prefix + "-beta"), 20, 160 - alpha);
  document.getElementById(prefix + "-c-anzeige").textContent = num(c) + " cm";
  document.getElementById(prefix + "-alpha-anzeige").textContent = alpha + "°";
  document.getElementById(prefix + "-beta-anzeige").textContent = beta + "°";
  const D = dreieck(c, alpha, beta);
  return { c, alpha, beta, gamma: 180 - alpha - beta, D };
}

function zeichneDreieck(b, D) {
  polygon(b, [D.A, D.B, D.C], "bl-dreieck", "dreieck");
}

const WINKELNAME = { A: "α", B: "β", C: "γ" };

// ================= 1. Die Mittelsenkrechte =================
//
// Zwei Kreise mit demselben Radius r um A und um B. Ihre Schnittpunkte sind von A UND von B
// genau r entfernt — und das für jedes r. Zieht man r, wandern die Schnittpunkte auf einer
// Geraden: der Mittelsenkrechten. Die Bilanz rechnet mit dem Reglerwert r.
//
// r muss größer als die halbe Strecke sein, sonst schneiden sich die Kreise nicht. Die Grenze
// liegt auf dem Raster des Reglers (Schritt 0,5), damit er nie einen Wert zeigt, den er nicht
// einstellen kann.
const MS_W = 620, MS_H = 360;
function msMinR(g) {
  return Math.ceil((g / 2 + 0.25) * 2) / 2;
}
function renderMittelsenkrechte() {
  const g = reglerZahl("ms-g");
  const r = begrenzt("ms-r", reglerZahl("ms-r"), msMinR(g), 9);
  document.getElementById("ms-g-anzeige").textContent = num(g) + " cm";
  document.getElementById("ms-r-anzeige").textContent = num(r) + " cm";
  const A = { x: 0, y: 0 }, B = { x: g, y: 0 }, Mab = mitte(A, B);
  const hoehe = Math.sqrt(r * r - (g / 2) * (g / 2));
  const S1 = { x: g / 2, y: hoehe }, S2 = { x: g / 2, y: -hoehe };
  // Rahmen: der größte Kreis bei r = 9 um A und B.
  const b = buehneAuto(MS_W, MS_H, [{ x: -3.2, y: -3.6 }, { x: 12.2, y: 3.6 }], { rand: 28, maxSkala: 40 });
  // Die Kreise werden nur als Bögen um die Schnittpunkte gezeichnet — wie mit dem Zirkel.
  kreis(b, A, r, "bl-zirkel", "zirkel-a");
  kreis(b, B, r, "bl-zirkel", "zirkel-b");
  gerade(b, Mab, { x: 0, y: 1 }, 3.6, "bl-ms", "mittelsenkrechte");
  strecke(b, A, B, "bl-strecke", "strecke");
  strecke(b, A, S1, "bl-radius", "radius");
  strecke(b, B, S1, "bl-radius", "radius");
  text(b, mitte(A, S1), "r", "bl-t-radius", -10, -2);
  text(b, mitte(B, S1), "r", "bl-t-radius", 10, -2);
  rechterWinkel(b, Mab, B, S1, "bl-ms");
  punkt(b, A, "A", -12, 16);
  punkt(b, B, "B", 12, 16);
  punkt(b, S1, "S₁", 16, -6);
  punkt(b, S2, "S₂", 16, 14);
  punkt(b, Mab, "M", -14, 16);
  zeige("ms-mount", b);

  document.getElementById("ms-bilanz").innerHTML =
    `<span class="wg">S₁A = S₁B = r = ${num(r)} cm</span> &nbsp;und&nbsp; <span class="wg">S₂A = S₂B = ${num(r)} cm</span> — ` +
    `beide Schnittpunkte sind von A und B gleich weit entfernt.<br>` +
    `Die Gerade durch S₁ und S₂ halbiert AB: <span class="wc">AM = MB = ${num(g / 2)} cm</span>, und sie steht senkrecht auf AB.`;
  document.getElementById("ms-text").textContent =
    r === msMinR(g)
      ? `Das ist fast die kleinste Zirkelöffnung, bei der sich die Kreise noch schneiden: Sie muss größer sein als die halbe Strecke, also größer als ${num(g / 2)} cm. Mach r größer und beobachte, wohin S₁ und S₂ wandern.`
      : `Egal wie groß r ist — S₁ und S₂ wandern immer auf derselben Geraden. Jeder Punkt, der von A und B gleich weit entfernt ist, liegt auf ihr: Das ist die Mittelsenkrechte von AB.`;
}

// Der Punkt-Test: Ein Punkt P frei in der Ebene. Er ist genau dann gleich weit von A und B
// entfernt, wenn er auf der Mittelsenkrechten liegt — und das entscheidet der Reglerwert
// (x = g/2), nicht die gerundete Messung.
const MP_W = 620, MP_H = 330;
function renderMsPunkt() {
  const g = 6;
  const px = reglerZahl("mp-x"), py = reglerZahl("mp-y");
  document.getElementById("mp-x-anzeige").textContent = num(px) + " cm";
  document.getElementById("mp-y-anzeige").textContent = num(py) + " cm";
  const A = { x: 0, y: 0 }, B = { x: g, y: 0 }, P = { x: px, y: py };
  const b = buehneAuto(MP_W, MP_H, [{ x: -1, y: -3.2 }, { x: 7, y: 3.2 }], { rand: 30, maxSkala: 44 });
  gerade(b, mitte(A, B), { x: 0, y: 1 }, 3.4, "bl-ms bl-duenn", "mittelsenkrechte");
  strecke(b, A, B, "bl-strecke", "strecke");
  const auf = Math.abs(px - g / 2) < 1e-9;
  strecke(b, P, A, auf ? "bl-radius" : "bl-hilfe", "pa");
  strecke(b, P, B, auf ? "bl-radius" : "bl-hilfe", "pb");
  punkt(b, A, "A", -12, 16);
  punkt(b, B, "B", 12, 16);
  punkt(b, P, "P", 0, -12);
  zeige("mp-mount", b);
  const pa = ab(P, A), pb = ab(P, B);
  document.getElementById("mp-bilanz").innerHTML =
    `<span class="wg">PA ${zeichen(pa, 2)} ${num(pa, 2)} cm</span> &nbsp;·&nbsp; <span class="wg">PB ${zeichen(pb, 2)} ${num(pb, 2)} cm</span> ` +
    `<span class="progress-note">(gemessen)</span>`;
  document.getElementById("mp-text").textContent = auf
    ? "P liegt auf der Mittelsenkrechten — und PA ist genauso lang wie PB. Verschiebe P nach oben oder unten: Das bleibt so."
    : `P liegt ${px < g / 2 ? "links" : "rechts"} neben der Mittelsenkrechten und ist deshalb näher an ${px < g / 2 ? "A" : "B"}. Kein Punkt außerhalb der Geraden ist von A und B gleich weit entfernt.`;
}

// ================= 2. Der Umkreis =================
//
// Der Beweis steckt in zwei Zeilen: M liegt auf m_c ⇒ MA = MB; M liegt auf m_a ⇒ MB = MC.
// Also MA = MC — und damit liegt M auch auf m_b. Der Regler „Schritt“ zeigt genau diese
// Reihenfolge: erst zwei Mittelsenkrechten, dann die dritte, die durch denselben Punkt geht.
const DR_W = 620, DR_H = 420;
function renderUmkreis() {
  const { alpha, beta, gamma, D } = dreiecksRegler("uk");
  const schritt = reglerZahl("uk-schritt");
  const { A, B, C } = D;
  const M = umkreismitte(A, B, C);
  const r = ab(M, A);
  const b = dreiecksBuehne(DR_W, DR_H, [A, B, C, M, { x: M.x - r, y: M.y - r }, { x: M.x + r, y: M.y + r }]);
  const lang = 30;
  const seiten = [["c", A, B], ["a", B, C], ["b", C, A]];
  seiten.forEach(([n, P, Q], i) => {
    if (i >= schritt) return;
    const m = mitte(P, Q);
    gerade(b, m, senkrecht(richtung(P, Q)), lang, "bl-ms", "ms-" + n);
    rechterWinkel(b, m, Q, plus(m, senkrecht(richtung(P, Q))), "bl-ms");
  });
  zeichneDreieck(b, D);
  if (schritt >= 3) {
    kreis(b, M, r, "bl-kreis", "umkreis");
    for (const E of [A, B, C]) strecke(b, M, E, "bl-radius", "radius");
  }
  ecken(b, D);
  if (schritt >= 2) punkt(b, M, "M", 14, -8, "bl-punkt-m");
  zeige("uk-mount", b);

  const art = winkelart(alpha, beta);
  const ra = ab(M, A), rb = ab(M, B), rc = ab(M, C);
  const zeilen = [];
  if (schritt >= 2) {
    zeilen.push(`M liegt auf m<sub>c</sub> ⇒ <span class="wg">MA = MB</span>; M liegt auf m<sub>a</sub> ⇒ <span class="wg">MB = MC</span>. Also <span class="wg">MA = MC</span> — M liegt auch auf m<sub>b</sub>.`);
  }
  if (schritt >= 3) {
    zeilen.push(`<span class="wc">MA ${zeichen(ra, 2)} ${num(ra, 2)} cm, MB ${zeichen(rb, 2)} ${num(rb, 2)} cm, MC ${zeichen(rc, 2)} ${num(rc, 2)} cm</span> <span class="progress-note">(gemessen)</span> — der Kreis um M mit diesem Radius geht durch alle drei Ecken.`);
  }
  zeilen.push(`α = ${alpha}°, β = ${beta}°, γ = ${gamma}°`);
  document.getElementById("uk-bilanz").innerHTML = zeilen.join("<br>");

  let satz;
  if (schritt === 1) satz = "Die erste Mittelsenkrechte, die von AB. Jeder ihrer Punkte ist von A und B gleich weit entfernt. Nimm mit dem Regler „Schritt“ die zweite dazu.";
  else if (schritt === 2) satz = "Zwei Mittelsenkrechten schneiden sich in M. Dieser Punkt ist von A, B UND C gleich weit entfernt — also muss auch die dritte Mittelsenkrechte durch M gehen. Prüfe es mit dem nächsten Schritt.";
  else if (art.art === "spitz") satz = "Das Dreieck ist spitzwinklig: Der Umkreismittelpunkt M liegt im Inneren.";
  else if (art.art === "recht") satz = `Das Dreieck ist rechtwinklig (bei ${art.ecke}): M liegt genau auf der Mitte der längsten Seite — der Seite gegenüber dem rechten Winkel.`;
  else satz = `Das Dreieck ist bei ${art.ecke} stumpfwinklig: M liegt außerhalb des Dreiecks, jenseits der längsten Seite. Die Mittelsenkrechten schneiden sich trotzdem in einem Punkt.`;
  document.getElementById("uk-text").textContent = satz;
  document.getElementById("uk-schritt-anzeige").textContent = schritt + " von 3";
}

// ================= 3. Die Winkelhalbierende =================
//
// Ein Winkel α mit Scheitel S. Ein Punkt P wandert auf der Winkelhalbierenden; die Lote von P
// auf beide Schenkel sind gleich lang. Warum? Die beiden rechtwinkligen Dreiecke S‑F₁‑P und
// S‑F₂‑P stimmen in der Seite SP und in zwei Winkeln (α/2 und 90°) überein — sie sind
// kongruent (WSW). Der Regler „Konstruktion“ zeigt die Zirkelschritte.
const WH_W = 620, WH_H = 360;
function renderWinkelhalbierende() {
  const alpha = reglerZahl("wh-alpha");
  const t = reglerZahl("wh-p");
  const schritt = reglerZahl("wh-schritt");
  document.getElementById("wh-alpha-anzeige").textContent = alpha + "°";
  document.getElementById("wh-p-anzeige").textContent = num(t) + " cm";
  document.getElementById("wh-schritt-anzeige").textContent = ["aus", "1. Bogen um S", "2. Bögen um X und Y", "3. Halbierende"][schritt];
  const S = { x: 0, y: 0 };
  const u1 = { x: 1, y: 0 }, u2 = { x: Math.cos(alpha * RAD), y: Math.sin(alpha * RAD) };
  const w = { x: Math.cos((alpha / 2) * RAD), y: Math.sin((alpha / 2) * RAD) };
  const L = 8;
  // Die Bühne umfasst den ganzen Reglerbereich: Bei α = 150° reicht der zweite Schenkel bis
  // x = 8 · cos 150° ≈ −6,9. Sonst änderte sich der Maßstab beim Ziehen am Winkel.
  const b = buehneAuto(WH_W, WH_H, [{ x: -7.2, y: -0.6 }, { x: 8.4, y: 8.2 }], { rand: 22, maxSkala: 42 });
  strecke(b, S, plus(S, u1, L), "bl-strecke", "schenkel-1");
  strecke(b, S, plus(S, u2, L), "bl-strecke", "schenkel-2");
  // Konstruktion: Bogen um S mit r0 schneidet die Schenkel in X und Y; Bögen um X und Y mit
  // demselben r0 schneiden sich in Z. SXZY ist eine Raute — ihre Diagonale SZ halbiert α.
  const r0 = 2.5;
  const X = plus(S, u1, r0), Y = plus(S, u2, r0);
  const Z = plus(X, u2, r0);   // Raute: Z = X + (Y − S)
  if (schritt >= 1) {
    kreis(b, S, r0, "bl-zirkel", "bogen-s");
    punkt(b, X, "X", 4, 16);
    punkt(b, Y, "Y", -12, -4);
  }
  if (schritt >= 2) {
    kreis(b, X, r0, "bl-zirkel", "bogen-x");
    kreis(b, Y, r0, "bl-zirkel", "bogen-y");
    punkt(b, Z, "Z", 12, -4);
  }
  if (schritt === 0 || schritt >= 3) strecke(b, S, plus(S, w, L), "bl-wh", "winkelhalbierende");
  // Der Punkt P und seine Lote auf beide Schenkel.
  const P = plus(S, w, t);
  const F1 = lotfuss(P, S, plus(S, u1)), F2 = lotfuss(P, S, plus(S, u2));
  if (schritt === 0 || schritt >= 3) {
    strecke(b, P, F1, "bl-abstand", "lot-1");
    strecke(b, P, F2, "bl-abstand", "lot-2");
    rechterWinkel(b, F1, S, P, "bl-abstand");
    rechterWinkel(b, F2, S, P, "bl-abstand");
    punkt(b, P, "P", 12, -6);
  }
  punkt(b, S, "S", -12, 12);
  text(b, plus(S, { x: Math.cos((alpha / 4) * RAD), y: Math.sin((alpha / 4) * RAD) }, 1.1), "½α", "bl-t-wh", 0, 4);
  zeige("wh-mount", b);
  const d = t * Math.sin((alpha / 2) * RAD);
  document.getElementById("wh-bilanz").innerHTML =
    `α = ${alpha}° ⇒ jede Hälfte <span class="wa">${num(alpha / 2, 1)}°</span><br>` +
    `Abstand von P zu beiden Schenkeln: <span class="wr">PF₁ ${zeichen(d, 2)} ${num(d, 2)} cm</span> und <span class="wr">PF₂ ${zeichen(d, 2)} ${num(d, 2)} cm</span> <span class="progress-note">(gemessen)</span>`;
  document.getElementById("wh-text").textContent =
    schritt === 0
      ? "Schiebe P auf der Winkelhalbierenden: Die beiden violetten Lote bleiben immer gleich lang. Das ist die Eigenschaft, auf die es ankommt — und die man mit dem Zirkel herstellt (Regler „Konstruktion“)."
      : schritt === 1
        ? "Schritt 1: Ein Bogen um den Scheitel S schneidet beide Schenkel — in X und Y. SX und SY sind gleich lang."
        : schritt === 2
          ? "Schritt 2: Mit derselben Zirkelöffnung um X und um Y. Die Bögen schneiden sich in Z. Jetzt sind alle vier Seiten von SXZY gleich lang — eine Raute."
          : "Schritt 3: Die Diagonale SZ der Raute halbiert den Winkel bei S, denn die Raute ist symmetrisch zu ihr. Sie ist die Winkelhalbierende.";
}

// ================= 4. Der Inkreis =================
//
// I liegt auf w_α ⇒ gleich weit von b und c; auf w_β ⇒ gleich weit von c und a. Also gleich
// weit von a und b — und damit auf w_γ. Der gemeinsame Abstand ρ ist der Inkreisradius; die
// Lotfußpunkte sind die Berührpunkte.
function renderInkreis() {
  const { alpha, beta, gamma, D } = dreiecksRegler("ik");
  const { A, B, C } = D;
  const I = inkreismitte(A, B, C);
  const b = dreiecksBuehne(DR_W, DR_H, [A, B, C]);
  zeichneDreieck(b, D);
  for (const [n, E, P, Q] of [["alpha", A, B, C], ["beta", B, C, A], ["gamma", C, A, B]]) {
    // Die Winkelhalbierende reicht von der Ecke bis zur Gegenseite.
    const w = richtung(E, I);
    const F = schnittMitStrecke(E, w, P, Q);
    strecke(b, E, F, "bl-wh", "wh-" + n);
  }
  const feet = [lotfuss(I, A, B), lotfuss(I, B, C), lotfuss(I, C, A)];
  const rho = ab(I, feet[0]);
  kreis(b, I, rho, "bl-kreis", "inkreis");
  feet.forEach((F, i) => {
    strecke(b, I, F, "bl-abstand", "lot-" + "cab"[i]);
    rechterWinkel(b, F, [B, C, A][i], I, "bl-abstand");
  });
  ecken(b, D);
  punkt(b, I, "I", 12, -8, "bl-punkt-i");
  zeige("ik-mount", b);
  const d = feet.map((F) => ab(I, F));
  document.getElementById("ik-bilanz").innerHTML =
    `I liegt auf w<sub>α</sub> ⇒ gleich weit von b und c; auf w<sub>β</sub> ⇒ gleich weit von c und a. Also auch gleich weit von a und b — I liegt auf w<sub>γ</sub>.<br>` +
    `<span class="wr">Abstand zu c ${zeichen(d[0], 2)} ${num(d[0], 2)} cm, zu a ${zeichen(d[1], 2)} ${num(d[1], 2)} cm, zu b ${zeichen(d[2], 2)} ${num(d[2], 2)} cm</span> <span class="progress-note">(gemessen)</span> = ρ<br>` +
    `α = ${alpha}°, β = ${beta}°, γ = ${gamma}°`;
  document.getElementById("ik-text").textContent =
    "Der Inkreismittelpunkt I liegt immer im Inneren — auch bei einem stumpfwinkligen Dreieck. Denn jede Winkelhalbierende läuft von einer Ecke ins Innere und endet auf der Gegenseite; ihr Schnittpunkt kann das Dreieck nicht verlassen. Der Inkreis berührt jede Seite genau in einem Punkt: dem Fußpunkt des violetten Lots.";
}

// Schnitt des Strahls E + t·w mit der Strecke PQ (für die Winkelhalbierende bis zur Gegenseite).
function schnittMitStrecke(E, w, P, Q) {
  const ux = Q.x - P.x, uy = Q.y - P.y;
  const nenner = w.x * uy - w.y * ux;
  const t = ((P.x - E.x) * uy - (P.y - E.y) * ux) / nenner;
  return plus(E, w, t);
}

// ================= 5. Seitenhalbierende und Schwerpunkt =================
//
// Die Seitenmitte liefert die Mittelsenkrechte aus Abschnitt 1 — deshalb steht dieser
// Abschnitt nach ihr. Dass S jede Seitenhalbierende im Verhältnis 2 : 1 teilt, lässt sich
// erst mit den Strahlensätzen (Klasse 9) beweisen; hier wird es gemessen, und die Prüfung
// verlangt das Wort „gemessen“ dabei.
function renderSchwerpunkt() {
  const { alpha, beta, gamma, D } = dreiecksRegler("sh");
  const zeigeAlle = document.getElementById("sh-alle").checked;
  const { A, B, C } = D;
  const S = schwerpunkt(A, B, C);
  const Ma = mitte(B, C), Mb = mitte(C, A), Mc = mitte(A, B);
  const b = dreiecksBuehne(DR_W, DR_H, [A, B, C]);
  zeichneDreieck(b, D);
  const linien = [["a", A, Ma], ["b", B, Mb], ["c", C, Mc]];
  (zeigeAlle ? linien : linien.slice(0, 1)).forEach(([n, E, M]) => {
    // Zwei Teilstücke, damit das Verhältnis 2 : 1 sichtbar wird: Ecke–S dick, S–Mitte dünn.
    strecke(b, E, S, "bl-sh", "sh-" + n + "-lang");
    strecke(b, S, M, "bl-sh bl-sh-kurz", "sh-" + n + "-kurz");
  });
  for (const [n, M] of [["M_a", Ma], ["M_b", Mb], ["M_c", Mc]]) {
    if (!zeigeAlle && n !== "M_a") continue;
    punkt(b, M, n, 0, 16, "bl-punkt-klein");
  }
  ecken(b, D);
  punkt(b, S, "S", 14, -8, "bl-punkt-s");
  zeige("sh-mount", b);
  const lang = ab(A, S), kurz = ab(S, Ma);
  document.getElementById("sh-bilanz").innerHTML =
    `<span class="wb">AS ${zeichen(lang, 2)} ${num(lang, 2)} cm</span> und <span class="wb">SMₐ ${zeichen(kurz, 2)} ${num(kurz, 2)} cm</span> <span class="progress-note">(gemessen)</span> — ` +
    `AS ist <strong>doppelt so lang</strong> wie SMₐ: Verhältnis 2 : 1.<br>` +
    `α = ${alpha}°, β = ${beta}°, γ = ${gamma}°`;
  document.getElementById("sh-text").textContent = zeigeAlle
    ? "Alle drei Seitenhalbierenden gehen durch denselben Punkt S — den Schwerpunkt. Schneidest du das Dreieck aus Pappe aus, kannst du es auf einer Nadelspitze in S balancieren. Und jede Seitenhalbierende wird von S im Verhältnis 2 : 1 geteilt: das lange Stück an der Ecke."
    : "Die Seitenhalbierende von A führt zur Mitte Mₐ der Gegenseite — und die Mitte findest du mit der Mittelsenkrechten. Schalte die beiden anderen Seitenhalbierenden dazu.";
}

// ================= 6. Höhen und Höhenschnittpunkt =================
//
// Die Höhe ist das Lot von der Ecke auf die GERADE durch die Gegenseite. Bei einem stumpfen
// Winkel liegen zwei Fußpunkte außerhalb — dann wird die Seite verlängert, und die Höhen
// (als Geraden) schneiden sich außerhalb des Dreiecks.
function renderHoehen() {
  const { alpha, beta, gamma, D } = dreiecksRegler("ho");
  const { A, B, C } = D;
  const H = hoehenschnitt(A, B, C);
  const b = dreiecksBuehne(DR_W, DR_H, [A, B, C, H]);
  const faelle = [["a", A, B, C], ["b", B, C, A], ["c", C, A, B]];
  for (const [n, E, P, Q] of faelle) {
    const F = lotfuss(E, P, Q);
    // Liegt der Fußpunkt außerhalb der Seite, wird die Seite als Gerade verlängert — genau wie
    // im Heft. Dann ist auch die Höhe (bis H) teilweise außerhalb.
    if (F.t < -1e-9 || F.t > 1 + 1e-9) {
      const von = F.t < 0 ? F : P, bis = F.t < 0 ? Q : F;
      strecke(b, plus(von, richtung(Q, P), 0.4), plus(bis, richtung(P, Q), 0.4), "bl-hilfe bl-gestrichelt", "verlaengerung-" + n);
    }
    strecke(b, E, F, "bl-ho", "ho-" + n);
    // Bis zum Höhenschnittpunkt weiterzeichnen, falls H jenseits von Ecke oder Fuß liegt.
    const tH = ((H.x - E.x) * (F.x - E.x) + (H.y - E.y) * (F.y - E.y)) / Math.max(1e-12, ab(E, F) ** 2);
    if (tH < -1e-9) strecke(b, E, H, "bl-ho bl-gestrichelt", "ho-" + n + "-weiter");
    if (tH > 1 + 1e-9) strecke(b, F, H, "bl-ho bl-gestrichelt", "ho-" + n + "-weiter");
    if (ab(E, F) > 1e-6) rechterWinkel(b, F, Math.abs(F.t) < 1e-9 ? Q : P, E, "bl-ho");
  }
  zeichneDreieck(b, D);
  ecken(b, D);
  punkt(b, H, "H", 14, -8, "bl-punkt-h");
  zeige("ho-mount", b);
  const art = winkelart(alpha, beta);
  document.getElementById("ho-bilanz").innerHTML =
    `α = ${alpha}°, β = ${beta}°, γ = ${gamma}° — das Dreieck ist <strong>${art.art === "spitz" ? "spitzwinklig" : art.art === "recht" ? "rechtwinklig" : "stumpfwinklig"}</strong>.`;
  document.getElementById("ho-text").textContent =
    art.art === "spitz"
      ? "Spitzwinklig: Alle drei Fußpunkte liegen auf den Seiten, und der Höhenschnittpunkt H liegt im Inneren."
      : art.art === "recht"
        ? `Rechtwinklig bei ${art.ecke}: Die beiden Katheten sind selbst Höhen — sie stehen ja senkrecht aufeinander. Alle drei Höhen treffen sich deshalb in der Ecke ${art.ecke}: H = ${art.ecke}.`
        : `Stumpfwinklig bei ${art.ecke}: Die Fußpunkte zweier Höhen liegen außerhalb, auf den verlängerten Seiten. Verlängert man die Höhen über die Ecken hinaus (gestrichelt), treffen sie sich außerhalb des Dreiecks in H.`;
}

// ================= 7. Alle vier im Vergleich =================
//
// Vertiefung: Die Eulersche Gerade. M, S und H liegen auf einer Geraden, und S teilt MH im
// Verhältnis 1 : 2. I liegt im Allgemeinen NICHT darauf. Im gleichseitigen Dreieck fallen
// alle vier Punkte zusammen.
const AL_ZEIGE = ["m", "i", "s", "h", "euler"];
function renderAlle() {
  const { alpha, beta, gamma, D } = dreiecksRegler("al");
  const an = Object.fromEntries(AL_ZEIGE.map((k) => [k, document.getElementById("al-" + k).checked]));
  const { A, B, C } = D;
  const M = umkreismitte(A, B, C), I = inkreismitte(A, B, C), S = schwerpunkt(A, B, C), H = hoehenschnitt(A, B, C);
  const rM = ab(M, A);
  const b = dreiecksBuehne(DR_W, DR_H, [A, B, C, M, H, { x: M.x - rM, y: M.y - rM }, { x: M.x + rM, y: M.y + rM }]);
  const MH = ab(M, H);
  if (an.euler && MH > 1e-6) gerade(b, S, richtung(M, H), 30, "bl-euler", "euler");
  if (an.m) {
    const r = ab(M, A);
    kreis(b, M, r, "bl-kreis bl-duenn", "umkreis");
  }
  if (an.i) {
    const rho = ab(I, lotfuss(I, A, B));
    kreis(b, I, rho, "bl-kreis-i bl-duenn", "inkreis");
  }
  zeichneDreieck(b, D);
  ecken(b, D);
  // Die vier Punkte liegen oft dicht beieinander. Jede Beschriftung trägt deshalb die Farbe
  // ihres Punktes und weicht dem NÄCHSTEN anderen Punkt aus — mit festen Versätzen standen I und S
  // bei stumpfen Dreiecken übereinander, mit dem Mittel aller anderen ebenso, weil M und H dann
  // weit weg liegen und beide Beschriftungen in dieselbe Richtung schoben. Das Ausweichen steht
  // senkrecht zur Verbindung, damit die Beschriftung nicht auf der Eulerschen Geraden liegt.
  const liste = [["M", M, "m"], ["I", I, "i"], ["S", S, "s"], ["H", H, "h"]].filter(([, , k]) => an[k]);
  liste.forEach(([n, P, k], nr) => {
    const q = b.P(P.x, P.y);
    const andere = liste.filter(([m]) => m !== n).map(([, Q]) => b.P(Q.x, Q.y));
    const naechster = andere.sort((u, v) => Math.hypot(u.x - q.x, u.y - q.y) - Math.hypot(v.x - q.x, v.y - q.y))[0];
    let dx = 0.7, dy = -0.7;
    if (naechster && Math.hypot(naechster.x - q.x, naechster.y - q.y) < 40) {
      const l = Math.hypot(naechster.x - q.x, naechster.y - q.y) || 1;
      const ux = (naechster.x - q.x) / l, uy = (naechster.y - q.y) / l;
      // Senkrecht zur Verbindung, abwechselnd nach beiden Seiten — so trennen sich Nachbarn.
      const seite = nr % 2 === 0 ? 1 : -1;
      dx = -uy * seite - ux * 0.5;
      dy = ux * seite - uy * 0.5;
      const m = Math.hypot(dx, dy) || 1;
      dx /= m; dy /= m;
    }
    punkt(b, P, n, dx * 15, dy * 15 + 4, "bl-punkt-" + k, "bl-name-" + k);
  });
  zeige("al-mount", b);
  const gleichseitig = alpha === 60 && beta === 60;
  const zeilen = [`α = ${alpha}°, β = ${beta}°, γ = ${gamma}°`];
  if (MH > 1e-6) {
    const ms = ab(M, S), sh = ab(S, H);
    zeilen.push(`<span class="wg">MS ${zeichen(ms, 2)} ${num(ms, 2)} cm</span>, <span class="wr">SH ${zeichen(sh, 2)} ${num(sh, 2)} cm</span> <span class="progress-note">(gemessen)</span> — SH ist doppelt so lang wie MS.`);
  }
  document.getElementById("al-bilanz").innerHTML = zeilen.join("<br>");
  document.getElementById("al-text").textContent = gleichseitig
    ? "Gleichseitig: Alle vier Punkte fallen zusammen. Jede Mittelsenkrechte ist hier zugleich Winkelhalbierende, Seitenhalbierende und Höhe — das Dreieck ist zu allen drei Linien symmetrisch."
    : alpha === beta || alpha === gamma || beta === gamma
      ? "Gleichschenklig: M, I, S und H liegen alle auf der Symmetrieachse. Für die Symmetrieachse gilt: Mittelsenkrechte, Winkelhalbierende, Seitenhalbierende und Höhe sind dieselbe Linie."
      : "M, S und H liegen immer auf einer Geraden — der Eulerschen Geraden (gestrichelt). I liegt im Allgemeinen nicht darauf. Mach das Dreieck gleichschenklig oder gleichseitig und beobachte, was geschieht.";
}

// ================= Kontrollfragen =================

function mountQuiz(container, { q, options, correct, explain }) {
  container.innerHTML = "";
  container.appendChild(el("p", { class: "quiz-q" }, "❓ " + q));
  const optWrap = el("div", { class: "quiz-options" });
  const feedback = el("div", { class: "quiz-feedback" });
  options.forEach((optText, i) => {
    const btn = el("button", { type: "button", class: "quiz-opt" }, optText);
    btn.addEventListener("click", () => {
      [...optWrap.children].forEach((x) => x.classList.remove("correct", "wrong"));
      if (i === correct) {
        btn.classList.add("correct");
        feedback.className = "quiz-feedback ok";
        feedback.textContent = "✓ Richtig! " + (explain || "");
      } else {
        btn.classList.add("wrong");
        [...optWrap.children][correct].classList.add("correct");
        feedback.className = "quiz-feedback err";
        feedback.textContent = "✗ Nicht ganz. " + (explain || "");
      }
    });
    optWrap.appendChild(btn);
  });
  container.appendChild(optWrap);
  container.appendChild(feedback);
}

// Die richtige Antwort steht bewusst nicht immer an derselben Stelle.
const QUIZZE = {
  "quiz-mittelsenkrechte": {
    q: "Ein Punkt P ist von A 5 cm und von B 5 cm entfernt. Was folgt daraus?",
    options: [
      "P ist der Mittelpunkt der Strecke AB",
      "P liegt auf der Mittelsenkrechten von AB",
      "AB ist 10 cm lang",
      "P liegt auf der Strecke AB",
    ],
    correct: 1,
    explain: "Gleich weit von A und B heißt: auf der Mittelsenkrechten — sie ist genau die Menge dieser Punkte. Der Mittelpunkt von AB ist nur EIN solcher Punkt (der mit dem kleinsten Abstand), und AB = 10 cm gälte nur, wenn P zusätzlich auf AB läge.",
  },
  "quiz-umkreis": {
    q: "In einem Dreieck ist der Winkel bei C stumpf. Wo liegt der Umkreismittelpunkt M?",
    options: [
      "Im Inneren des Dreiecks",
      "Genau auf der Mitte der Seite c",
      "Außerhalb, jenseits der Seite c",
      "In der Ecke C",
    ],
    correct: 2,
    explain: "Beim stumpfen Winkel liegt M außerhalb — und zwar auf der anderen Seite der längsten Seite c, dem stumpfen Winkel gegenüber. Auf der Mitte von c läge M nur beim rechten Winkel; das ist die Grenze zwischen innen und außen.",
  },
  "quiz-winkelhalbierende": {
    q: "Warum halbiert die Konstruktion mit den drei Zirkelbögen den Winkel?",
    options: [
      "Weil SXZY eine Raute ist und die Diagonale SZ ihre Symmetrieachse",
      "Weil X und Y auf der Mittelsenkrechten liegen",
      "Weil der Zirkel immer rechte Winkel erzeugt",
      "Weil Z der Mittelpunkt von XY ist",
    ],
    correct: 0,
    explain: "SX = SY (erster Bogen) und XZ = YZ (gleiche Öffnung) — alle vier Seiten sind gleich lang, SXZY ist eine Raute. Eine Raute ist symmetrisch zu ihren Diagonalen, also teilt SZ den Winkel bei S in zwei gleiche Hälften. Z ist übrigens NICHT die Mitte von XY; die liegt auf SZ, aber näher an S.",
  },
  "quiz-inkreis": {
    q: "Der Inkreismittelpunkt I ist …",
    options: [
      "von allen drei Ecken gleich weit entfernt",
      "der Schnittpunkt der Seitenhalbierenden",
      "bei einem stumpfwinkligen Dreieck außerhalb",
      "von allen drei Seiten gleich weit entfernt",
    ],
    correct: 3,
    explain: "I liegt auf allen drei Winkelhalbierenden, also gleich weit von allen drei Seiten — dieser Abstand ist der Inkreisradius ρ. „Gleich weit von den Ecken“ gilt für den Umkreismittelpunkt M. Und I liegt immer innen, auch bei stumpfen Winkeln.",
  },
  "quiz-schwerpunkt": {
    q: "Eine Seitenhalbierende ist 9 cm lang. Wie weit ist der Schwerpunkt S von der Ecke entfernt?",
    options: ["4,5 cm", "3 cm", "6 cm", "Das hängt von der Form des Dreiecks ab"],
    correct: 2,
    explain: "S teilt jede Seitenhalbierende im Verhältnis 2 : 1, das längere Stück an der Ecke: 9 cm in drei gleiche Teile, zwei davon sind 6 cm. Die 3 cm sind das kurze Stück zur Seitenmitte; 4,5 cm wäre die Mitte der Seitenhalbierenden — dort liegt S gerade nicht.",
  },
  "quiz-hoehen": {
    q: "In einem rechtwinkligen Dreieck (rechter Winkel bei C) — wo liegt der Höhenschnittpunkt H?",
    options: ["In der Ecke C", "Auf der Mitte der Hypotenuse", "Außerhalb des Dreiecks", "Im Inneren, nahe bei C"],
    correct: 0,
    explain: "Die beiden Katheten stehen senkrecht aufeinander — jede ist die Höhe auf die andere. Zwei Höhen gehen also schon durch C, und damit auch die dritte: H = C. Auf der Mitte der Hypotenuse liegt dagegen der Umkreismittelpunkt M.",
  },
  "quiz-alle": {
    q: "Welche drei besonderen Punkte liegen immer auf einer Geraden?",
    options: ["M, I und S", "I, S und H", "M, S und H", "M, I und H"],
    correct: 2,
    explain: "Umkreismittelpunkt M, Schwerpunkt S und Höhenschnittpunkt H liegen auf der Eulerschen Geraden, und S teilt MH im Verhältnis 1 : 2. Der Inkreismittelpunkt I liegt im Allgemeinen daneben — nur im gleichschenkligen Dreieck liegt er mit auf der Symmetrieachse.",
  },
};

function initQuizzes() {
  for (const [id, def] of Object.entries(QUIZZE)) mountQuiz(document.getElementById(id), def);
}

// ================= Start =================

const REGLER = {
  renderMittelsenkrechte: ["ms-g", "ms-r"],
  renderMsPunkt: ["mp-x", "mp-y"],
  renderUmkreis: ["uk-c", "uk-alpha", "uk-beta", "uk-schritt"],
  renderWinkelhalbierende: ["wh-alpha", "wh-p", "wh-schritt"],
  renderInkreis: ["ik-c", "ik-alpha", "ik-beta"],
  renderSchwerpunkt: ["sh-c", "sh-alpha", "sh-beta", "sh-alle"],
  renderHoehen: ["ho-c", "ho-alpha", "ho-beta"],
  renderAlle: ["al-c", "al-alpha", "al-beta", ...AL_ZEIGE.map((k) => "al-" + k)],
};
const RENDER = {
  renderMittelsenkrechte, renderMsPunkt, renderUmkreis, renderWinkelhalbierende,
  renderInkreis, renderSchwerpunkt, renderHoehen, renderAlle,
};
for (const [name, ids] of Object.entries(REGLER)) {
  for (const id of ids) document.getElementById(id).addEventListener("input", RENDER[name]);
}
// Jede Zeichnung einmal von Hand — sonst bliebe die Seite leer, bis jemand einen Regler anfasst.
for (const f of Object.values(RENDER)) f();
initQuizzes();
mountUebungsaufgaben(document.getElementById("exercises-mount"), AUFGABEN);
