// Selbstlernpfad „Der Kreis: Umfang, Flächeninhalt, Kreisring, Bogen und Ausschnitt“ (Klasse 8,
// Geometrie, Thema 5).
//
// Aufbau wie die Flächeninhalte: Abschnitt, bewegliche Zeichnung, Bilanz, Kontrollfrage. Die
// Übungsaufgaben stehen in kreis-aufgaben.js.
//
// Reihenfolge der Herleitungen — jede steht auf dem, was vorher da war:
//   1. Umfang über den Durchmesser: Das Rad rollt ab; U und d sind proportional, der Faktor heißt π.
//      Eingeschachtelt zwischen Sechseck innen (genau 3 · d) und Quadrat außen (genau 4 · d).
//   2. Umfang mit dem Radius: d = 2 · r eingesetzt.
//   3. Flächeninhalt, zwei Wege: Ausschnitte zum Fast-Rechteck umlegen (braucht nur Rechteck und
//      Umfang), Ringe zum Dreieck aufbiegen (braucht das Dreieck aus Thema 4).
//   4. Kreisring: einer der Ringe aus 3, aufgebogen zum Rechteck aus Mittellinie und Breite.
//   5. Kreisbogen: proportional zum Mittelpunktswinkel, abgerollt wie in 1.
//   6. Kreisausschnitt: derselbe Anteil wie der Bogen; zerlegt und umgelegt wie in 3.
//
// Jede Bewegung ist flächentreu, und die Prüfung misst das an vielen Reglerstellungen nach:
//   * Ausschnitte werden nur gedreht und verschoben — starr.
//   * Ringe werden aufgebogen, indem ihre MITTELLINIE ihre Länge und der Ring seine Breite behält.
//     Ein Ringstück mit der Breite w und der Mittellinienlänge L hat bei jeder Krümmung den
//     Flächeninhalt w · L (θ/2 · ((ρ + w/2)² − (ρ − w/2)²) = θ · ρ · w = L · w). Die inneren und äußeren
//     Kanten werden dabei länger bzw. kürzer — wie bei einem Gummiband —, die Fläche nicht.
//   * Der Kreisbogen wird abgerollt, indem seine Länge bleibt und nur die Krümmung abnimmt.
//
// Was bewusst NICHT vorkommt: der Satz des Pythagoras und die Quadratwurzel (Klasse 9). Wo eine
// Länge nur mit ihnen zu berechnen wäre — die Seiten der Vielecke, die Sehnen —, steht „gemessen“.
//
// Gerechnet wird mit den Reglerwerten in Zentimetern, nie mit Bildschirmkoordinaten.
//
// Farben: Radius und Durchmesser blau (wie die Grundseite), Umfang und Bogen orange, Fläche grün,
// Winkel violett, Hilfslinien grau. Die Farben stehen als Klassen in lernpfad.css, damit der
// Dunkelmodus sie aufhellen kann.

import { mountUebungsaufgaben as mountUebungsaufgabenBasis } from "../../aufgaben.js?v=2";
import { AUFGABEN } from "./kreis-aufgaben.js?v=1";

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
// Ein Zahlformat je Stellenzahl, einmal angelegt: toLocaleString() baut bei jedem Aufruf ein neues
// Intl.NumberFormat — bei jeder Reglerbewegung dutzendfach.
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
function bruch(zaehler, nenner, klasse = "") {
  return `<span class="bruch ${klasse}"><span class="z">${zaehler}</span><span class="n">${nenner}</span></span>`;
}
// „=“ oder „≈“? Entscheidend ist, ob die Anzeige mit der gewählten Stellenzahl den Wert genau
// trifft — π · d tut das nie, 3 · d immer.
function zeichen(x, stellen = 2) {
  const f = Math.pow(10, stellen);
  return Math.abs(x - Math.round(x * f) / f) < 1e-12 ? "=" : "≈";
}
// Gerundete Kreisgrößen immer mit zwei Stellen: „12,50“ sieht nach Rundung aus, „12,5“ nach einem
// genauen Wert. Im Fließtext steht „etwa“ davor, wo die Zahl gerundet ist.
const ZWEI = new Intl.NumberFormat("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
function zwei(x) {
  const g = Math.round(x * 100) / 100;
  return ZWEI.format(g === 0 ? 0 : g);
}
function etwa(x) {
  return (zeichen(x, 2) === "=" ? "" : "etwa ") + zwei(x);
}
function ggt(a, b) {
  return b === 0 ? a : ggt(b, a % b);
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
function setzeText(id, text) {
  document.getElementById(id).textContent = text;
}

// ---------- Zeichenbausteine ----------

// Eine Bühne rechnet Zentimeter in Bildpunkte um. Der Nullpunkt liegt unten links, y zeigt nach
// oben — wie im Heft und anders als in SVG.
function buehne(breite, hoehe, ox, oy, skala) {
  const svg = svgEl("svg", {
    viewBox: `0 0 ${breite} ${hoehe}`, width: breite, height: hoehe,
    class: "th-flaeche", preserveAspectRatio: "xMidYMid meet",
  });
  const g = svgEl("g");
  svg.appendChild(g);
  return { svg, g, skala, P: (x, y) => ({ x: ox + x * skala, y: oy - y * skala }) };
}

// Die Bühne richtet sich nach allem, was WIRKLICH gezeichnet wird — einschließlich aller Stellungen,
// die ein bewegtes Stück unterwegs einnimmt. Ohne das ragte es mitten in der Bewegung aus dem Bild
// und sähe aus, als wäre es zerschnitten. Die Breite steht fest, die Höhe ergibt sich aus dem
// Inhalt; so springt die Zeichnung beim Ziehen am Regler nicht seitlich weg.
function buehneAuto(breite, maxHoehe, punkte, { rand = 40, maxSkala = 58 } = {}) {
  // Eine Schleife statt Math.min(...xs): Die Spur einer Bewegung hat leicht zehntausend Punkte.
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const p of punkte) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  const spanX = Math.max(0.5, maxX - minX), spanY = Math.max(0.5, maxY - minY);
  const skala = Math.min(maxSkala, (breite - 2 * rand) / spanX, (maxHoehe - 2 * rand) / spanY);
  const hoehe = Math.round(spanY * skala + 2 * rand);
  const ox = rand + (breite - 2 * rand - spanX * skala) / 2 - minX * skala;
  const oy = hoehe - rand + minY * skala;
  return buehne(breite, hoehe, ox, oy, skala);
}

function punkteText(b, punkte) {
  return punkte.map((p) => { const q = b.P(p.x, p.y); return `${q.x.toFixed(2)},${q.y.toFixed(2)}`; }).join(" ");
}
function linienzug(b, punkte, klasse, extra = {}) {
  const e = svgEl("polyline", Object.assign({ points: punkteText(b, punkte), class: klasse }, extra));
  b.g.appendChild(e);
  return e;
}
function vieleck(b, punkte, klasse, extra = {}) {
  const e = svgEl("polygon", Object.assign({ points: punkteText(b, punkte), class: klasse }, extra));
  b.g.appendChild(e);
  return e;
}
function linie(b, p, q, klasse, extra = {}) {
  const a = b.P(p.x, p.y), c = b.P(q.x, q.y);
  const e = svgEl("line", Object.assign({
    x1: a.x.toFixed(2), y1: a.y.toFixed(2), x2: c.x.toFixed(2), y2: c.y.toFixed(2), class: klasse,
  }, extra));
  b.g.appendChild(e);
  return e;
}
function kreis(b, M, r, klasse, extra = {}) {
  const q = b.P(M.x, M.y);
  const e = svgEl("circle", Object.assign({ cx: q.x.toFixed(2), cy: q.y.toFixed(2), r: (r * b.skala).toFixed(2), class: klasse }, extra));
  b.g.appendChild(e);
  return e;
}
// Beschriftung am Punkt p, um dx/dy Bildpunkte versetzt.
function beschrift(b, p, text, klasse, dx = 0, dy = 0, anker = "middle") {
  const q = b.P(p.x, p.y);
  const t = svgText(q.x + dx, q.y + dy, text, { class: klasse, "text-anchor": anker });
  b.g.appendChild(t);
  return t;
}
// Punktmarke samt Namen in einer Gruppe, die den Namen trägt: Die Prüfung liest die Marke, nicht
// die Beschriftung — die sitzt versetzt daneben.
function punkt(b, p, name, dx = 0, dy = -10) {
  const q = b.P(p.x, p.y);
  const gruppe = svgEl("g", { class: "th-punkt-gruppe", "data-name": name || "" });
  gruppe.appendChild(svgEl("circle", { cx: q.x.toFixed(2), cy: q.y.toFixed(2), r: 3.5, class: "th-punkt" }));
  if (name) gruppe.appendChild(svgText(q.x + dx, q.y + dy, name, { class: "th-punkt-name" }));
  b.g.appendChild(gruppe);
}
function zeige(mountId, b) {
  const mount = document.getElementById(mountId);
  mount.innerHTML = "";
  mount.appendChild(b.svg);
}

// Punkte eines Kreisbogens um M vom Winkel a0 bis a1 (Bogenmaß). Die Sehnen überspannen höchstens
// 2°: Dann fehlt dem gezeichneten Vieleck weniger als ein Zehntausendstel der Fläche, und die
// Prüfung kann sie mit der Gaußschen Trapezformel nachmessen.
const FEIN = Math.PI / 90;
function bogenPunkte(M, r, a0, a1, maxSchritt = FEIN) {
  const n = Math.max(2, Math.ceil(Math.abs(a1 - a0) / maxSchritt));
  const out = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    out.push({ x: M.x + r * Math.cos(a), y: M.y + r * Math.sin(a) });
  }
  return out;
}

// Alle Stellungen einer Bewegung: stellung(t) liefert die Punkte beim Anteil t. Gebraucht wird
// das nur, um die Bühne groß genug zu machen — ein aufgebogener Ring wölbt sich auf halbem Weg
// höher, als der Kreis selbst ist.
function spur(stellung, schritte = 24) {
  const out = [];
  for (let i = 0; i <= schritte; i++) for (const p of stellung(i / schritte)) out.push(p);
  return out;
}

// Drehung um M — für .map().
function drehUm(M, winkel) {
  const co = Math.cos(winkel), si = Math.sin(winkel);
  return (p) => {
    const dx = p.x - M.x, dy = p.y - M.y;
    return { x: M.x + dx * co - dy * si, y: M.y + dx * si + dy * co };
  };
}
// Winkel auf (−π, π] bringen: Jedes Stück dreht sich den kürzeren Weg.
function kurz(w) {
  let x = w % (2 * Math.PI);
  if (x > Math.PI) x -= 2 * Math.PI;
  if (x <= -Math.PI) x += 2 * Math.PI;
  return x;
}

// Ein Streifen (Ring oder Ringstück), aufgebogen um den Anteil t. Er liegt mit der Mitte seiner
// Mittellinie im Punkt (x0 | y0) auf, und dort zeigt die Mittellinie waagerecht nach rechts.
// Beim Aufbiegen nimmt die Krümmung von 1/ρ auf 0 ab; die Mittellinie behält ihre Länge L und der
// Streifen seine Breite w — und damit seinen Flächeninhalt L · w (siehe Kopf).
function streifen(L, w, rho, t, x0, y0, schritte = 180) {
  const kappa = (1 - t) / rho;
  const mitte = (s) => {
    const phi = kappa * s;
    if (kappa < 1e-12) return { x: x0 + s, y: y0, nx: 0, ny: 1 };
    return { x: x0 + Math.sin(phi) / kappa, y: y0 + (1 - Math.cos(phi)) / kappa, nx: -Math.sin(phi), ny: Math.cos(phi) };
  };
  const aussen = [], innen = [];
  for (let i = 0; i <= schritte; i++) {
    const m = mitte(-L / 2 + (L * i) / schritte);
    aussen.push({ x: m.x - (w / 2) * m.nx, y: m.y - (w / 2) * m.ny });
    innen.push({ x: m.x + (w / 2) * m.nx, y: m.y + (w / 2) * m.ny });
  }
  return aussen.concat(innen.reverse());
}

// ================= 1. Abrollen: U = π · d =================

const AB_W = 660, AB_H = 300;

function renderAbrollen() {
  const d = reglerZahl("ab-d");
  const t = reglerZahl("ab-t") / 100;
  const r = d / 2, U = Math.PI * d, s = t * U;
  setzeText("ab-d-anzeige", num(d) + " cm");
  setzeText("ab-t-anzeige", Math.round(t * 360) + "°");

  // Die Bühne nimmt den ganzen Weg auf, nicht nur die augenblickliche Stellung — sonst spränge
  // die Zeichnung beim Abrollen.
  const ende = Math.max(U, 4 * d);
  const b = buehneAuto(AB_W, AB_H, [{ x: -r - 0.2, y: -0.9 }, { x: ende + r + 0.2, y: d + 0.15 }]);

  // Der Boden und darunter vier Durchmesser hintereinander — das Maß, an dem gemessen wird.
  linie(b, { x: -r - 0.2, y: 0 }, { x: ende + r + 0.2, y: 0 }, "kr-boden");
  for (let k = 0; k < 4; k++) {
    linie(b, { x: k * d, y: -0.45 }, { x: (k + 1) * d, y: -0.45 }, k % 2 ? "kr-lineal-b" : "kr-lineal-a", { "data-rolle": "lineal" });
    beschrift(b, { x: (k + 0.5) * d, y: -0.45 }, "d", "kr-t-blau", 0, 18);
  }
  linie(b, { x: 0, y: 0.12 }, { x: 0, y: -0.12 }, "kr-marke");

  // Die abgerollte Strecke auf dem Boden und das Stück des Randes, das den Boden schon berührt hat:
  // beide gleich lang. Der Punkt P lag am Anfang unten.
  const M = { x: s, y: r };
  const gedreht = s / r;   // Drehwinkel im Uhrzeigersinn
  if (s > 0) {
    linie(b, { x: 0, y: 0 }, { x: s, y: 0 }, "kr-umfang", { "data-rolle": "abgerollt" });
    linienzug(b, bogenPunkte(M, r, -Math.PI / 2 - gedreht, -Math.PI / 2), "kr-umfang", { "data-rolle": "rand-abgerollt" });
  }
  kreis(b, M, r, "kr-kreis", { "data-rolle": "rad" });

  // Ein Durchmesser durch P dreht sich mit: Daran sieht man, wie weit sich das Rad gedreht hat.
  const P = { x: M.x - r * Math.sin(gedreht), y: M.y - r * Math.cos(gedreht) };
  const Q = { x: 2 * M.x - P.x, y: 2 * M.y - P.y };
  linie(b, P, Q, "kr-radius", { "data-rolle": "durchmesser" });
  // Das „d“ sitzt neben dem Durchmesser, senkrecht zu ihm versetzt — er dreht sich, ein fester
  // Versatz läge nach einer Vierteldrehung genau auf der Linie.
  const nx = Math.cos(gedreht), ny = -Math.sin(gedreht);
  beschrift(b, { x: (M.x + Q.x) / 2, y: (M.y + Q.y) / 2 }, "d", "kr-t-blau", nx * 12, -ny * 12 + 4);
  // „M“ auf der anderen Seite des Durchmessers als „d“ — beide weichen ihm senkrecht aus.
  punkt(b, M, "M", -nx * 13, ny * 13 + 4);
  punkt(b, P, "P", 12, P.y < M.y ? 14 : -6);

  if (t === 1) {
    linie(b, { x: U, y: 0.16 }, { x: U, y: -0.16 }, "kr-marke");
    beschrift(b, { x: U / 2, y: 0 }, "U = π · d", "kr-t-orange", 0, -8);
  }

  zeige("ab-mount", b);

  document.getElementById("ab-bilanz").innerHTML =
    `Durchmesser <span class="wc">d = ${num(d)} cm</span> &nbsp;·&nbsp; abgerollt: <span class="wb">${etwa(s)} cm</span> (${Math.round(t * 100)} % einer Umdrehung)<br>` +
    `Eine ganze Umdrehung: <span class="wb">U = π · d ≈ ${zwei(U)} cm</span> — das sind 3 Durchmesser (${num(3 * d)} cm) und noch ${etwa(U - 3 * d)} cm dazu.<br>` +
    `<span class="wa">U : d = π ≈ 3,14159</span> — bei jedem Durchmesser derselbe Faktor.`;

  setzeText("ab-text",
    t === 0
      ? `Der Punkt P berührt gerade den Boden. Roll das Rad mit dem Regler ab — der Rand, der den Boden berührt, färbt sich orange.`
      : t < 1
        ? `Das Rad hat sich um ${Math.round(t * 360)}° gedreht und ist dabei ${etwa(s)} cm weit gerollt. Genau so lang ist das orange Stück seines Randes: Ohne Rutschen gibt der Rand Stück für Stück seine Länge an den Boden ab.`
        : `Eine ganze Umdrehung: P berührt wieder den Boden. Die orange Strecke ist so lang wie der ganze Rand — U ≈ ${zwei(U)} cm. Der Durchmesser passt dreimal hinein, und es bleibt ein Stück von ${etwa(U - 3 * d)} cm, gut ein Siebtel von d.`);
}

// ================= 1b. Einschachteln: 3 < π < 4 =================

const ES_W = 560, ES_H = 380;
const ES_ECKEN = [4, 6, 12, 24, 48, 96];
const ES_R = 3;

function renderEinschachteln() {
  const n = ES_ECKEN[reglerZahl("es-n")];
  const r = ES_R, d = 2 * r;
  setzeText("es-n-anzeige", n + " Ecken");
  const M = { x: 0, y: 0 };
  // Beide Vielecke haben ihre Ecken auf denselben Strahlen; das äußere berührt den Kreis in der
  // Mitte seiner Seiten.
  const winkel = (k) => Math.PI / 2 + (2 * Math.PI * k) / n;
  const rAussen = r / Math.cos(Math.PI / n);
  const innen = [], aussen = [];
  for (let k = 0; k < n; k++) {
    innen.push({ x: r * Math.cos(winkel(k)), y: r * Math.sin(winkel(k)) });
    aussen.push({ x: rAussen * Math.cos(winkel(k)), y: rAussen * Math.sin(winkel(k)) });
  }
  const b = buehneAuto(ES_W, ES_H, [{ x: -r * Math.SQRT2, y: -r * Math.SQRT2 }, { x: r * Math.SQRT2, y: r * Math.SQRT2 }], { rand: 30 });

  vieleck(b, aussen, "kr-aussen", { "data-rolle": "aussen" });
  kreis(b, M, r, "kr-kreis", { "data-rolle": "kreis" });
  // Beim Sechseck die sechs gleichseitigen Dreiecke: Sie sind der Grund, warum sein Umfang genau
  // 3 · d ist.
  if (n === 6) for (const p of innen) linie(b, M, p, "kr-speiche");
  vieleck(b, innen, "kr-innen", { "data-rolle": "innen" });
  if (n === 4) {
    // Das Quadrat außen hat die Seitenlänge d.
    linie(b, aussen[1], aussen[2], "kr-radius");
    beschrift(b, { x: (aussen[1].x + aussen[2].x) / 2, y: (aussen[1].y + aussen[2].y) / 2 }, "d", "kr-t-blau", -12, 10);
  } else if (n === 6) {
    linie(b, M, innen[1], "kr-radius");
    beschrift(b, { x: innen[1].x / 2, y: innen[1].y / 2 }, "r", "kr-t-blau", 4, -8);
    // Innen neben die Seite: Außen läuft der Kreis so dicht vorbei, dass ein „r“ dort auf ihm läge.
    beschrift(b, { x: (innen[1].x + innen[2].x) / 2, y: (innen[1].y + innen[2].y) / 2 }, "r", "kr-t-gruen", 12, 4);
  }
  punkt(b, M, "M", 0, 16);
  zeige("es-mount", b);

  // Die Umfänge als Vielfache von d. Genau ohne Messen sind nur das Sechseck innen (6 · r) und das
  // Quadrat außen (4 · d); alle anderen Seitenlängen bräuchten den Satz des Pythagoras.
  const fInnen = (n * 2 * r * Math.sin(Math.PI / n)) / d;
  const fAussen = (n * 2 * r * Math.tan(Math.PI / n)) / d;
  const iGenau = n === 6, aGenau = n === 4;
  const zeile = (f, genau, was) =>
    `${was}: Umfang ${genau ? "=" : "≈"} <strong>${num(f, 4)} · d</strong> ${genau ? "(genau, ohne Messen)" : "(an der Zeichnung gemessen)"}`;
  document.getElementById("es-bilanz").innerHTML =
    `<span class="wa">${zeile(fInnen, iGenau, `${n}-Eck innen`)}</span><br>` +
    `<span class="wc">Kreis: U = π · d</span><br>` +
    `<span class="wb">${zeile(fAussen, aGenau, `${n}-Eck außen`)}</span><br>` +
    `Also <strong>${num(fInnen, 4)} &lt; π &lt; ${num(fAussen, 4)}</strong>.`;

  setzeText("es-text",
    n === 4
      ? "Das Quadrat außen hat die Seite d, sein Umfang ist genau 4 · d. Der Kreis ist kürzer: π < 4. Das Quadrat innen ist noch weit vom Kreis entfernt."
      : n === 6
        ? "Das Sechseck innen besteht aus sechs gleichseitigen Dreiecken — jede Seite ist so lang wie der Radius, zusammen 6 · r = 3 · d. Der Kreis ist länger: π > 3."
        : n === 96
          ? "96 Ecken wie bei Archimedes: Innen und außen unterscheiden sich erst in der dritten Nachkommastelle. Auf dem Bildschirm sieht man die drei Linien nicht mehr getrennt."
          : `Mit ${n} Ecken rücken beide Vielecke näher an den Kreis heran, und die Schranken für π werden enger.`);
}

// ================= 2. Der Umfang mit dem Radius =================

const RA_W = 660, RA_H = 400;
const RA_MAX = 3;   // größter Radius des Reglers: Er legt den Maßstab fest, damit ein größerer
                    // Kreis auch größer aussieht — sonst sähe man die Proportionalität nicht.

function renderRadius() {
  const r = reglerZahl("ra-r");
  const d = 2 * r, U = 2 * Math.PI * r;
  setzeText("ra-r-anzeige", num(r) + " cm");

  const b = buehneAuto(RA_W, RA_H, [{ x: -0.3, y: -1.2 }, { x: 2 * Math.PI * RA_MAX + 0.3, y: 1.1 + 2 * RA_MAX }]);
  const M = { x: r, y: 1.1 + r };

  kreis(b, M, r, "kr-kreis", { "data-rolle": "kreis" });
  linie(b, M, { x: M.x + r, y: M.y }, "kr-radius", { "data-rolle": "radius" });
  beschrift(b, { x: M.x + r / 2, y: M.y }, "r", "kr-t-blau", 0, -7);
  linie(b, { x: M.x, y: M.y - r }, { x: M.x, y: M.y + r }, "kr-radius kr-gestrichelt", { "data-rolle": "durchmesser" });
  beschrift(b, { x: M.x, y: M.y + r / 2 }, "d", "kr-t-blau", -9, 4);
  punkt(b, M, "M", -10, 14);

  // Der abgerollte Umfang, oben in Durchmesser, unten in Radien eingeteilt.
  linie(b, { x: 0, y: 0 }, { x: U, y: 0 }, "kr-umfang", { "data-rolle": "umfang" });
  for (let k = 0; k <= 3; k++) {
    linie(b, { x: k * d, y: 0 }, { x: k * d, y: 0.3 }, "kr-marke");
    if (k < 3) beschrift(b, { x: (k + 0.5) * d, y: 0 }, "d", "kr-t-blau", 0, -9);
  }
  for (let k = 0; k <= 6; k++) {
    linie(b, { x: k * r, y: 0 }, { x: k * r, y: -0.3 }, "kr-marke");
    if (k < 6) beschrift(b, { x: (k + 0.5) * r, y: 0 }, "r", "kr-t-blau", 0, 20);
  }
  linie(b, { x: U, y: 0.3 }, { x: U, y: -0.3 }, "kr-marke");
  beschrift(b, { x: U, y: 0 }, "U", "kr-t-orange", 0, 20);

  zeige("ra-mount", b);

  document.getElementById("ra-bilanz").innerHTML =
    `<span class="wc">r = ${num(r)} cm</span>, &nbsp;<span class="wc">d = 2 · r = ${num(d)} cm</span><br>` +
    `<span class="wb">U = π · d = π · ${num(d)} cm ≈ ${zwei(U)} cm</span><br>` +
    `<span class="wb">U = 2 · π · r = 2 · π · ${num(r)} cm ≈ ${zwei(U)} cm</span> — dieselbe Zahl.<br>` +
    `Auf dem Umfang haben 3 Durchmesser oder 6 Radien Platz, und es bleibt ein Rest von ${etwa(U - 6 * r)} cm.`;

  setzeText("ra-text",
    `Der Radius ${num(r)} cm passt sechsmal auf den abgerollten Umfang und noch ein Stück: 2 · π ≈ 6,28. ` +
    `Verdoppelst du den Radius, verdoppelt sich auch der Umfang.`);
}

// ================= 3a. Ausschnitte zum Fast-Rechteck =================

const SE_W = 680, SE_H = 400;

// Lage der Stücke im Fast-Rechteck. Jedes Stück k wird um seine Spitze gedreht und verschoben —
// starr, kein Stück verändert sich. Gerade Nummern zeigen mit dem Bogen nach unten, ungerade nach
// oben; zusammen ergibt das unten und oben je die Hälfte aller Bögen.
//
//   theta  Mittelpunktswinkel eines Stücks, r Radius, anzahl Stücke (gerade)
//   start  Winkel, bei dem das erste Stück im Kreis beginnt
//   C0     Mittelpunkt des Kreises, X0 linker Rand des Fast-Rechtecks
// Die Stücke brechen nacheinander auf, wie Karten, die man austeilt: Stück k beginnt seine Bewegung
// bei t = VERSATZ · k / (anzahl − 1) und ist bei t = 1 an seinem Platz. Flögen alle zugleich los,
// lägen sie unterwegs übereinander, und man sähe nicht, welches wohin geht.
const VERSATZ = 0.75;
function ausschnittStuecke(r, theta, anzahl, start, C0, X0, t) {
  const c = 2 * r * Math.sin(theta / 2);   // Sehne eines Stücks
  const h = r * Math.cos(theta / 2);
  const out = [];
  for (let k = 0; k < anzahl; k++) {
    const tk = Math.min(1, Math.max(0, (t - (VERSATZ * k) / Math.max(1, anzahl - 1)) / (1 - VERSATZ)));
    const a0 = start + k * theta, a1 = a0 + theta;
    const mitte = (a0 + a1) / 2;
    const unten = k % 2 === 0;   // Bogen unten?
    const i = Math.floor(k / 2);
    const ziel = unten ? { x: X0 + (i + 0.5) * c, y: h } : { x: X0 + (i + 1) * c, y: 0 };
    const achse = unten ? -Math.PI / 2 : Math.PI / 2;
    const drehung = kurz(achse - mitte) * tk;
    const spitze = { x: C0.x + (ziel.x - C0.x) * tk, y: C0.y + (ziel.y - C0.y) * tk };
    const vorher = [C0, ...bogenPunkte(C0, r, a0, a1)];
    const D = drehUm(C0, drehung);
    const punkte = vorher.map((p) => { const q = D(p); return { x: q.x - C0.x + spitze.x, y: q.y - C0.y + spitze.y }; });
    out.push({ punkte, unten, spitze, k });
  }
  return { stuecke: out, c, h };
}

function renderAusschnitte() {
  const r = reglerZahl("se-r");
  const n = reglerZahl("se-n");
  const t = reglerZahl("se-t") / 100;
  const quadrate = document.getElementById("se-quadrate").checked;
  setzeText("se-r-anzeige", num(r) + " cm");
  setzeText("se-n-anzeige", String(n));
  setzeText("se-t-anzeige", Math.round(t * 100) + " %");

  const theta = (2 * Math.PI) / n;
  const lage = (rr) => ({ C0: { x: rr, y: rr / 2 }, X0: 2 * rr + 1.4 });
  const { C0, X0 } = lage(r);
  // Die Bühne nimmt den ganzen Weg der Stücke auf, damit keines unterwegs aus dem Bild ragt.
  const weg = spur((tt) => ausschnittStuecke(r, theta, n, Math.PI / 2, C0, X0, tt).stuecke.flatMap((s) => s.punkte), 16);
  const b = buehneAuto(SE_W, SE_H, [...weg, { x: X0, y: -0.25 * r - 0.5 }], { rand: 30 });

  const { stuecke, c, h } = ausschnittStuecke(r, theta, n, Math.PI / 2, C0, X0, t);

  // Der leere Platz des Kreises bleibt sichtbar: Von dort kommen die Stücke.
  kreis(b, C0, r, "kr-kreis-blass");
  if (quadrate) {
    vieleck(b, [{ x: C0.x - r, y: C0.y - r }, { x: C0.x + r, y: C0.y - r }, { x: C0.x + r, y: C0.y + r }, { x: C0.x - r, y: C0.y + r }], "kr-hilfe kr-quadrat", { "data-rolle": "quadrat-aussen" });
    vieleck(b, [{ x: C0.x, y: C0.y - r }, { x: C0.x + r, y: C0.y }, { x: C0.x, y: C0.y + r }, { x: C0.x - r, y: C0.y }], "kr-hilfe kr-quadrat", { "data-rolle": "quadrat-innen" });
  }
  for (const s of stuecke) {
    vieleck(b, s.punkte, s.unten ? "kr-teil-a" : "kr-teil-b", { "data-rolle": "stueck", "data-nr": s.k });
  }

  if (t === 1) {
    // Das fertige Fast-Rechteck: Höhe r am ersten Stück, unten der halbe Umfang.
    const erstes = stuecke[0].spitze;
    linie(b, erstes, { x: erstes.x, y: erstes.y - r }, "kr-radius kr-gestrichelt", { "data-rolle": "hoehe" });
    // Rechts der gestrichelten Höhe — links läuft die schräge Kante des ersten Stücks.
    beschrift(b, { x: erstes.x, y: erstes.y - r / 2 }, "r", "kr-t-blau", 9, 4);
    const unten = { x: X0 + ((n / 2) * c) / 2, y: -(r - h) };
    beschrift(b, unten, "π · r (halber Umfang)", "kr-t-orange", 0, 20);
  } else {
    punkt(b, C0, "M", 0, 16);
  }

  zeige("se-mount", b);

  const sehnen = (n / 2) * c;
  document.getElementById("se-bilanz").innerHTML =
    `${n} Stücke mit je ${zeichen(360 / n, 2) === "=" ? "" : "etwa "}${num(360 / n, 2)}° &nbsp;·&nbsp; <span class="wc">r = ${num(r)} cm</span><br>` +
    `Unten liegen ${n / 2} Bögen, oben ${n / 2}: je der halbe Umfang <span class="wb">π · r ≈ ${zwei(Math.PI * r)} cm</span>. ` +
    `Die Sehnen unten sind zusammen ${etwa(sehnen)} cm lang (gemessen) — mit mehr Stücken rücken sie an π · r heran.<br>` +
    `Fast-Rechteck aus denselben Stücken: <span class="wa">A = π · r · r = π · r² ≈ ${zwei(Math.PI * r * r)} cm²</span>` +
    (quadrate ? `<br>Zum Vergleich: Quadrat innen 2 · r² = ${num(2 * r * r)} cm², außen 4 · r² = ${num(4 * r * r)} cm².` : "");

  setzeText("se-text",
    t === 0
      ? `Der Kreis ist in ${n} gleich große Stücke geschnitten — abwechselnd grün und orange. Leg sie mit dem Regler um.`
      : t < 1
        ? `Die Stücke drehen sich um ihre Spitze und wandern nach rechts. Jedes bleibt dabei, wie es ist: Es wird nichts abgeschnitten und nichts angesetzt.`
        : `Alle ${n} Stücke liegen abwechselnd: die grünen mit dem Bogen unten, die orangen mit dem Bogen oben. Das Fast-Rechteck ist unten und oben je π · r ≈ ${zwei(Math.PI * r)} cm lang und r = ${num(r)} cm hoch. ` +
          (n < 16 ? "Die Ränder sind noch gewellt und die Seiten schräg — nimm mehr Stücke." : "Bei so vielen Stücken ist es kaum noch von einem Rechteck zu unterscheiden."));
}

// ================= 3b. Ringe zum Dreieck =================

const RI_W = 680, RI_H = 360;

function renderRinge() {
  const r = reglerZahl("ri-r");
  const n = reglerZahl("ri-n");
  const t = reglerZahl("ri-t") / 100;
  setzeText("ri-r-anzeige", num(r) + " cm");
  setzeText("ri-n-anzeige", String(n));
  setzeText("ri-t-anzeige", Math.round(t * 100) + " %");

  const w = r / n;
  // Der Kreis steht mit seinem tiefsten Punkt auf dem Boden (y = 0), der Mittelpunkt liegt bei
  // (0 | r). Jeder Ring liegt mit seinem tiefsten Punkt auf; beim Aufbiegen bleibt dieser Punkt,
  // wo er ist. So landet jeder Streifen genau in der Höhe, in der er im Kreis unten lag, und die
  // Spitze des Dreiecks ist der Mittelpunkt des Kreises.
  // Bühne: alle Stellungen aller Ringe — auf halbem Weg wölben sie sich höher als der Kreis.
  const weg = spur((tt) => {
    const out = [];
    for (let i = 0; i < n; i++) {
      const rho = r - (i + 0.5) * w;
      out.push(...streifen(2 * Math.PI * rho, w, rho, tt, 0, (i + 0.5) * w, 36));
    }
    return out;
  });
  const b = buehneAuto(RI_W, RI_H, [...weg, { x: -Math.PI * r - 0.9, y: -0.25 * r - 0.3 }], { rand: 30 });

  const M = { x: 0, y: r };
  const U = 2 * Math.PI * r;
  if (t > 0) {
    vieleck(b, [{ x: -U / 2, y: 0 }, { x: U / 2, y: 0 }, M], "kr-hilfe", { "data-rolle": "dreieck" });
  }
  for (let i = 0; i < n; i++) {
    const rho = r - (i + 0.5) * w;
    const L = 2 * Math.PI * rho;
    vieleck(b, streifen(L, w, rho, t, 0, (i + 0.5) * w), i % 2 ? "kr-teil-b" : "kr-teil-a", { "data-rolle": "ring", "data-nr": i });
  }

  if (t === 1) {
    linie(b, { x: -U / 2 - 0.45, y: 0 }, { x: -U / 2 - 0.45, y: r }, "kr-radius kr-gestrichelt", { "data-rolle": "hoehe" });
    beschrift(b, { x: -U / 2 - 0.45, y: r / 2 }, "r", "kr-t-blau", -10, 4);
    beschrift(b, { x: 0, y: 0 }, "U = 2 · π · r", "kr-t-orange", 0, 20);
  }
  punkt(b, M, "M", 0, -9);
  zeige("ri-mount", b);

  const A = Math.PI * r * r;
  document.getElementById("ri-bilanz").innerHTML =
    `${n} Ringe, jeder ${etwa(w)} cm breit &nbsp;·&nbsp; <span class="wc">r = ${num(r)} cm</span><br>` +
    `Längster Streifen ${etwa(2 * Math.PI * (r - w / 2))} cm, kürzester ${etwa(Math.PI * w)} cm. Die Streifen füllen das Dreieck mit der<br>` +
    `Grundseite <span class="wb">U = 2 · π · r ≈ ${zwei(U)} cm</span> und der Höhe <span class="wc">r = ${num(r)} cm</span>:<br>` +
    `<span class="wa">A = ½ · U · r = ½ · 2 · π · r · r = π · r² ≈ ${zwei(A)} cm²</span>`;

  setzeText("ri-text",
    t === 0
      ? `Der Kreis ist in ${n} Ringe zerlegt, jeder ${etwa(w)} cm breit; der innerste ist eine kleine Scheibe. Biege sie mit dem Regler auf.`
      : t < 1
        ? `Jeder Ring ist oben aufgeschnitten und wird gerade gebogen. Seine Breite bleibt, seine Mitte behält ihre Länge — so bleibt auch seine Fläche gleich.`
        : `Alle Ringe sind gerade: unten der längste, oben der kürzeste. Die Stufen ragen genau so weit über das Dreieck hinaus, wie ihnen an anderer Stelle fehlt — zusammen sind sie so groß wie das Dreieck mit der Grundseite U ≈ ${zwei(U)} cm und der Höhe r = ${num(r)} cm.`);
}

// ================= 4. Der Kreisring =================

const KR_W = 680, KR_H = 340;

function renderKreisring() {
  const R = reglerZahl("kr-gr");
  // Der Innenkreis muss im Außenkreis liegen, und der Ring soll sichtbar breit bleiben.
  const r = begrenzt("kr-kl", reglerZahl("kr-kl"), 0.5, R - 0.5);
  const t = reglerZahl("kr-t") / 100;
  setzeText("kr-gr-anzeige", num(R) + " cm");
  setzeText("kr-kl-anzeige", num(r) + " cm");
  setzeText("kr-t-anzeige", Math.round(t * 100) + " %");

  const w = R - r, rho = (R + r) / 2, L = 2 * Math.PI * rho;
  // Bühne: der ganze Weg des Rings — auf halbem Weg wölbt er sich höher als der Kreis.
  const weg = spur((tt) => streifen(L, w, rho, tt, 0, w / 2, 36));
  const b = buehneAuto(KR_W, KR_H, [...weg, { x: -Math.PI * R - 0.3, y: -0.25 * R - 0.3 }, { x: Math.PI * R + 1.4, y: 0 }], { rand: 30 });
  const M = { x: 0, y: R };

  if (t === 1) {
    // Das Trapez, dessen Mittellinie das Rechteck ist: unten der äußere, oben der innere Umfang.
    vieleck(b, [{ x: -Math.PI * R, y: 0 }, { x: Math.PI * R, y: 0 }, { x: Math.PI * r, y: w }, { x: -Math.PI * r, y: w }], "kr-hilfe", { "data-rolle": "trapez" });
  }
  vieleck(b, streifen(L, w, rho, t, 0, w / 2), "kr-teil-a", { "data-rolle": "ring" });

  if (t === 0) {
    linie(b, M, { x: M.x + R, y: M.y }, "kr-radius", { "data-rolle": "R" });
    beschrift(b, { x: M.x + (R + r) / 2, y: M.y }, "R", "kr-t-blau", 0, -7);
    const a = (3 * Math.PI) / 4;
    linie(b, M, { x: M.x + r * Math.cos(a), y: M.y + r * Math.sin(a) }, "kr-radius", { "data-rolle": "r" });
    beschrift(b, { x: M.x + (r / 2) * Math.cos(a), y: M.y + (r / 2) * Math.sin(a) }, "r", "kr-t-blau", 8, -6);
    punkt(b, M, "M", 0, 16);
  }
  if (t === 1) {
    beschrift(b, { x: 0, y: 0 }, "2 · π · R", "kr-t-orange", 0, 18);
    beschrift(b, { x: 0, y: w }, "2 · π · r", "kr-t-orange", 0, -8);
    linie(b, { x: Math.PI * R + 0.25, y: 0 }, { x: Math.PI * R + 0.25, y: w }, "kr-radius kr-gestrichelt", { "data-rolle": "breite" });
    beschrift(b, { x: Math.PI * R + 0.25, y: w / 2 }, "R − r", "kr-t-blau", 6, 4, "start");
  }
  zeige("kr-mount", b);

  const A = Math.PI * (R * R - r * r);
  document.getElementById("kr-bilanz").innerHTML =
    `<span class="wc">R = ${num(R)} cm</span>, &nbsp;<span class="wc">r = ${num(r)} cm</span><br>` +
    `Großer Kreis π · R² ≈ ${zwei(Math.PI * R * R)} cm², kleiner Kreis π · r² ≈ ${zwei(Math.PI * r * r)} cm²: ` +
    `<span class="wa">A = π · (R² − r²) = π · (${num(R * R)} − ${num(r * r)}) cm² ≈ ${zwei(A)} cm²</span><br>` +
    `Aufgebogen: ein Rechteck, <span class="wb">π · (R + r) ≈ ${zwei(L)} cm</span> lang und <span class="wc">R − r = ${num(w)} cm</span> breit: ` +
    `π · (R + r) · (R − r) ≈ ${zwei(A)} cm² — dieselbe Zahl.`;

  setzeText("kr-text",
    t === 0
      ? `Der Ring liegt zwischen dem Kreis mit R = ${num(R)} cm und dem mit r = ${num(r)} cm. Biege ihn auf.`
      : t < 1
        ? `Der Ring wird gerade gebogen. Seine Breite R − r bleibt, und seine Mitte behält die Länge π · (R + r).`
        : `Gerade gebogen ist der Ring ein Rechteck, ${etwa(L)} cm lang und ${num(w)} cm breit. Gestrichelt das Trapez mit den Umfängen der beiden Kreise als parallelen Seiten: Das Rechteck ist genau seine Mittellinie mal Höhe, wie in Thema 4.`);
}

// ================= 5. Der Kreisbogen =================

const BO_W = 680, BO_H = 360;

function renderBogen() {
  const r = reglerZahl("bo-r");
  const alpha = reglerZahl("bo-a");
  const t = reglerZahl("bo-t") / 100;
  setzeText("bo-r-anzeige", num(r) + " cm");
  setzeText("bo-a-anzeige", alpha + "°");
  setzeText("bo-t-anzeige", Math.round(t * 100) + " %");

  const U = 2 * Math.PI * r;
  const bLaenge = (alpha / 360) * U;
  // Der Bogen rollt sich ab, indem seine Krümmung abnimmt — auf halbem Weg ist er ein Stück eines
  // größeren Kreises und reicht höher hinauf als der Kreis selbst. Die Bühne nimmt das mit auf.
  const bogenBei = (rr, tt, schritte) => {
    const kap = (1 - tt) / rr, laenge = (alpha / 360) * 2 * Math.PI * rr, out = [];
    for (let i = 0; i <= schritte; i++) {
      const s = (laenge * i) / schritte;
      out.push(kap < 1e-12 ? { x: s, y: 0 } : { x: Math.sin(kap * s) / kap, y: (1 - Math.cos(kap * s)) / kap });
    }
    return out;
  };
  const b = buehneAuto(BO_W, BO_H, [
    ...spur((tt) => bogenBei(r, tt, 36)),
    { x: -r - 0.3, y: -0.45 * r - 0.3 }, { x: U + 0.3, y: 2 * r + 0.2 },
  ], { rand: 30 });
  const M = { x: 0, y: r };
  const B0 = { x: 0, y: 0 };
  const a0 = -Math.PI / 2, a1 = a0 + (alpha * Math.PI) / 180;
  const E = { x: M.x + r * Math.cos(a1), y: M.y + r * Math.sin(a1) };

  linie(b, { x: -r - 0.3, y: 0 }, { x: U + 0.3, y: 0 }, "kr-boden");
  kreis(b, M, r, "kr-kreis-blass");
  // Der Mittelpunktswinkel als gefülltes Kreisstück am Mittelpunkt.
  const rw = Math.min(0.7, r * 0.3);
  vieleck(b, [M, ...bogenPunkte(M, rw, a0, a1)], "kr-winkel");
  beschrift(b, { x: M.x + (rw + 0.35) * Math.cos((a0 + a1) / 2), y: M.y + (rw + 0.35) * Math.sin((a0 + a1) / 2) }, "α", "kr-t-violett", 0, 5);
  linie(b, M, B0, "kr-radius");
  if (alpha < 360) linie(b, M, E, "kr-radius");

  // Unter dem Boden: der ganze Umfang, und darauf der Anteil, den der Bogen einnimmt. Der Abstand
  // wächst mit r, damit die beiden Linien bei jedem Maßstab gleich weit auseinander stehen.
  const yU = -0.25 * r;
  linie(b, { x: 0, y: yU }, { x: U, y: yU }, "kr-umfang-blass", { "data-rolle": "umfang" });
  linie(b, { x: 0, y: yU }, { x: bLaenge, y: yU }, "kr-umfang", { "data-rolle": "anteil" });
  linie(b, { x: U, y: yU + 0.08 * r }, { x: U, y: yU - 0.08 * r }, "kr-marke");
  beschrift(b, { x: U, y: yU }, "U", "kr-t-orange", 0, 20);

  // Der Bogen selbst: Er beginnt im tiefsten Punkt und rollt sich nach rechts auf den Boden ab.
  // Seine Länge bleibt dabei dieselbe, nur die Krümmung nimmt ab.
  const schritte = Math.max(8, Math.ceil(alpha / 2));
  const bogen = bogenBei(r, t, schritte);
  linienzug(b, bogen, "kr-bogen", { "data-rolle": "bogen" });
  const ende = bogen[bogen.length - 1];
  beschrift(b, t === 1 ? { x: bLaenge / 2, y: 0 } : { x: (bogen[Math.floor(schritte / 2)].x), y: bogen[Math.floor(schritte / 2)].y }, "b", "kr-t-orange", t === 1 ? 0 : 12, t === 1 ? -8 : 4);
  // Links unter M, und zwar außerhalb der Winkelmarke — beim Vollwinkel ist sie eine ganze Scheibe.
  punkt(b, M, "M", -(rw * b.skala + 9), 14);
  punkt(b, B0, "", 0, 0);
  if (t < 1 && alpha < 360) punkt(b, ende, "", 0, 0);

  zeige("bo-mount", b);

  const g = ggt(alpha, 360);
  document.getElementById("bo-bilanz").innerHTML =
    `Anteil: <span class="wr">α : 360° = ${alpha} : 360 = ${bruch(alpha / g, 360 / g)}</span> ${zeichen(alpha / 360, 4)} ${num(alpha / 360, 4)} &nbsp;·&nbsp; <span class="wc">r = ${num(r)} cm</span><br>` +
    `Ganzer Umfang: <span class="wb">U = 2 · π · r ≈ ${zwei(U)} cm</span><br>` +
    `Bogen: <span class="wb">b = ${alpha}° : 360° · 2 · π · ${num(r)} cm ≈ ${zwei(bLaenge)} cm</span> — ${alpha === 360 ? "der ganze Umfang" : `der Anteil ${bruch(alpha / g, 360 / g)} vom Umfang`}.`;

  setzeText("bo-text",
    t === 0
      ? `Zum Winkel α = ${alpha}° gehört der orange Bogen. Unter dem Boden liegt der ganze Umfang; der orange Teil davon ist der Anteil α : 360°. Roll den Bogen ab und vergleiche.`
      : t < 1
        ? `Der Bogen rollt sich ab: Er wird gerader, aber nicht länger und nicht kürzer.`
        : `Abgerollt liegt der Bogen auf dem Boden: ${etwa(bLaenge)} cm, genau so lang wie der orange Teil des Umfangs darunter. Verdopple α — dann verdoppelt sich auch der Bogen.`);
}

// ================= 6. Der Kreisausschnitt =================

const AU_W = 680, AU_H = 380;

function renderAusschnitt() {
  const r = reglerZahl("au-r");
  const alpha = reglerZahl("au-a");
  const k = reglerZahl("au-k");
  const t = reglerZahl("au-t") / 100;
  setzeText("au-r-anzeige", num(r) + " cm");
  setzeText("au-a-anzeige", alpha + "°");
  setzeText("au-k-anzeige", String(k));
  setzeText("au-t-anzeige", Math.round(t * 100) + " %");

  const A = (alpha * Math.PI) / 180;
  const theta = A / k;
  const bLaenge = r * A;
  const lage = (rr) => ({ C0: { x: rr, y: rr / 2 }, X0: 2 * rr + 1.4 });
  const { C0, X0 } = lage(r);
  const start = Math.PI / 2 - A / 2;   // der Ausschnitt steht symmetrisch nach oben
  const { stuecke, c, h } = ausschnittStuecke(r, theta, k, start, C0, X0, t);
  // Bühne: der ganze Weg der Teile, dazu der Kreis, aus dem sie stammen.
  const weg = spur((tt) => ausschnittStuecke(r, theta, k, start, C0, X0, tt).stuecke.flatMap((s) => s.punkte), 16);
  const b = buehneAuto(AU_W, AU_H, [...weg, { x: C0.x - r, y: C0.y - r }, { x: C0.x + r, y: C0.y + r }, { x: X0, y: -0.25 * r - 0.5 }], { rand: 30 });

  kreis(b, C0, r, "kr-kreis-blass");
  for (const s of stuecke) {
    vieleck(b, s.punkte, s.unten ? "kr-teil-a" : "kr-teil-b", { "data-rolle": "stueck", "data-nr": s.k });
  }
  if (t === 0) {
    const rw = Math.min(0.7, r * 0.25);
    vieleck(b, [C0, ...bogenPunkte(C0, rw, start, start + A)], "kr-winkel");
    beschrift(b, { x: C0.x, y: C0.y + rw + 0.35 }, "α", "kr-t-violett", 0, 5);
    punkt(b, C0, "M", 0, 16);
  }
  if (t === 1) {
    const erstes = stuecke[0].spitze;
    linie(b, erstes, { x: erstes.x, y: erstes.y - r }, "kr-radius kr-gestrichelt", { "data-rolle": "hoehe" });
    // Das „r“ steht rechts der gestrichelten Höhe: links davon läuft die schräge Kante des ersten
    // Teils, und bei kleinem Winkel läge die Beschriftung genau auf ihr.
    beschrift(b, { x: erstes.x, y: erstes.y - r / 2 }, "r", "kr-t-blau", 9, 4);
    beschrift(b, { x: X0 + ((k / 2) * c) / 2, y: -(r - h) }, "b : 2", "kr-t-orange", 0, 20);
  }
  zeige("au-mount", b);

  const flaeche = (alpha / 360) * Math.PI * r * r;
  const g = ggt(alpha, 360);
  document.getElementById("au-bilanz").innerHTML =
    `Anteil <span class="wr">α : 360° = ${bruch(alpha / g, 360 / g)}</span> &nbsp;·&nbsp; <span class="wc">r = ${num(r)} cm</span> &nbsp;·&nbsp; ` +
    `Bogen <span class="wb">b = α : 360° · 2 · π · r ≈ ${zwei(bLaenge)} cm</span><br>` +
    `Über den Anteil: <span class="wa">A = α : 360° · π · r² ≈ ${zwei(flaeche)} cm²</span><br>` +
    `Aus dem Fast-Parallelogramm, unten b : 2 ≈ ${zwei(bLaenge / 2)} cm lang und r = ${num(r)} cm hoch: ` +
    `<span class="wa">A = ½ · b · r ≈ ${zwei(flaeche)} cm²</span> — dieselbe Zahl.`;

  setzeText("au-text",
    t === 0
      ? `Der Ausschnitt mit α = ${alpha}° ist ${bruchWort(alpha / g, 360 / g)} des Kreises. Er ist in ${k} gleiche Teile geschnitten. Leg sie um.`
      : t < 1
        ? `Die Teile drehen sich um ihre Spitze und wandern — starr, wie beim ganzen Kreis in Abschnitt 3.`
        : `Die ${k} Teile bilden ein Fast-Parallelogramm: unten und oben je die Hälfte des Bogens, b : 2 ≈ ${zwei(bLaenge / 2)} cm, und so hoch wie der Radius. Also A = ½ · b · r ≈ ${zwei(flaeche)} cm².`);
}

// „ein Drittel“, „drei Viertel“, „der ganze Kreis“ — für die Textzeile unter der Zeichnung.
function bruchWort(z, n) {
  if (z === n) return "der ganze Kreis, also 1";
  const nenner = { 2: "Hälfte", 3: "Drittel", 4: "Viertel", 6: "Sechstel", 8: "Achtel", 9: "Neuntel", 12: "Zwölftel", 18: "Achtzehntel", 36: "Sechsunddreißigstel" };
  if (z === 1 && n === 2) return "die Hälfte";
  const zahlwort = ["", "ein", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun", "zehn", "elf"];
  if (nenner[n] && z < zahlwort.length) return `${zahlwort[z]} ${nenner[n]}`;
  return `der Anteil ${z}/${n}`;
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

const QUIZZE = {
  "quiz-umfang": {
    q: "Ein Rad hat den Durchmesser 50 cm. Wie weit rollt es bei einer ganzen Umdrehung?",
    options: [
      "50 cm — so weit wie sein Durchmesser",
      "100 cm — zweimal der Durchmesser",
      "Etwa 157 cm — gut dreimal der Durchmesser",
      "Etwa 1963 cm — das ist π · 25²",
    ],
    correct: 2,
    explain:
      "Bei einer Umdrehung berührt jeder Punkt des Randes einmal den Boden: Das Rad rollt so weit, wie sein Umfang lang ist. U = π · d = π · 50 cm ≈ 157 cm — gut dreimal der Durchmesser, wie beim Abrollen oben. π · 25² wäre ein Flächeninhalt in cm², keine Strecke.",
  },
  "quiz-pi": {
    q: "Warum ist U : d bei jedem Kreis dieselbe Zahl?",
    options: [
      "Weil jeder Kreis eine Vergrößerung jedes anderen ist: Doppelter Durchmesser, doppelter Umfang",
      "Weil man π so festgelegt hat, dass es ungefähr stimmt",
      "Das stimmt nur für Kreise mit ganzzahligem Durchmesser",
      "Weil der Umfang immer genau 3 Durchmesser lang ist",
    ],
    correct: 0,
    explain:
      "Alle Kreise haben dieselbe Form. Vergrößert man einen Kreis auf das Doppelte, wird jede Länge doppelt so lang — der Durchmesser und der Umfang. Umfang und Durchmesser sind deshalb proportional, und π ist der Proportionalitätsfaktor. Genau 3 ist er nicht: Das Sechseck innen ist schon 3 · d lang, der Kreis ist länger.",
  },
  "quiz-radius": {
    q: "Ein Kreis hat den Radius r = 5 cm. Wie lang ist sein Umfang?",
    options: [
      "Etwa 15,71 cm",
      "Etwa 78,54 cm",
      "10 cm",
      "Etwa 31,42 cm",
    ],
    correct: 3,
    explain:
      "U = 2 · π · r = 2 · π · 5 cm ≈ 31,42 cm. Wer π · r rechnet (15,71 cm), hat den Radius wie einen Durchmesser behandelt und bekommt nur den halben Umfang. 78,54 cm² wäre der Flächeninhalt π · r², und 10 cm ist der Durchmesser selbst.",
  },
  "quiz-ausschnitte": {
    q: "Warum hat das Fast-Rechteck genau denselben Flächeninhalt wie der Kreis?",
    options: [
      "Weil es ungefähr so aussieht wie ein Rechteck",
      "Weil es aus genau denselben Stücken besteht — sie sind nur gedreht und verschoben",
      "Weil Rechtecke immer größer sind als Kreise",
      "Das stimmt nur, wenn man unendlich viele Stücke nimmt",
    ],
    correct: 1,
    explain:
      "Beim Umlegen wird nichts abgeschnitten und nichts angesetzt: Jedes Stück wird nur gedreht und verschoben, und dabei bleibt sein Flächeninhalt gleich. Das gilt bei jeder Stückzahl. Mit mehr Stücken ändert sich nur die FORM: Sie wird einem Rechteck mit den Seiten π · r und r immer ähnlicher — und daran liest man A = π · r² ab.",
  },
  "quiz-flaeche": {
    q: "Ein Kreis hat den Durchmesser d = 10 cm. Wie groß ist sein Flächeninhalt?",
    options: [
      "Etwa 314,16 cm²",
      "Etwa 31,42 cm²",
      "Etwa 78,54 cm²",
      "Etwa 157,08 cm²",
    ],
    correct: 2,
    explain:
      "Erst der Radius: r = d : 2 = 5 cm. Dann A = π · r² = π · 25 cm² ≈ 78,54 cm². Mit π · d² = π · 100 cm² ≈ 314,16 cm² kommt das Vierfache heraus — der Durchmesser ist doppelt so lang wie der Radius, quadriert also viermal so groß. 157,08 cm² ist π · r · d: Radius und Durchmesser gemischt. 31,42 cm ist der Umfang, eine Länge und keine Fläche.",
  },
  "quiz-ring": {
    q: "Ein Kreisring hat den Außenradius R = 6 cm und den Innenradius r = 4 cm. Wie groß ist sein Flächeninhalt?",
    options: [
      "Etwa 12,57 cm²",
      "Etwa 113,10 cm²",
      "Etwa 163,36 cm²",
      "Etwa 62,83 cm²",
    ],
    correct: 3,
    explain:
      "A = π · (R² − r²) = π · (36 − 16) cm² = π · 20 cm² ≈ 62,83 cm². Aufgebogen: ein Rechteck, π · (6 + 4) cm lang und 2 cm breit — wieder π · 20 cm². Die 12,57 cm² wären π · (R − r)², ein Kreis mit der Ringbreite als Radius. 113,10 cm² ist der große Kreis allein, ohne das Loch, und 163,36 cm² ist π · (R² + r²).",
  },
  "quiz-bogen": {
    q: "Ein Kreis hat den Umfang 24 cm. Wie lang ist der Bogen zum Mittelpunktswinkel α = 60°?",
    options: [
      "60 cm",
      "4 cm",
      "6 cm",
      "Das lässt sich ohne den Radius nicht sagen",
    ],
    correct: 1,
    explain:
      "60° ist ein Sechstel des Vollwinkels: 60° : 360° = 1/6. Der Bogen ist derselbe Anteil vom Umfang: b = 24 cm : 6 = 4 cm. Den Radius braucht man dafür nicht — er steckt schon im Umfang. 6 cm wäre ein Viertel (90°), und 60 cm verwechselt den Winkel mit einer Länge.",
  },
  "quiz-ausschnitt": {
    q: "Ein Kreisausschnitt hat den Radius 6 cm und den Bogen b = 5 cm. Wie groß ist sein Flächeninhalt?",
    options: [
      "15 cm²",
      "30 cm²",
      "Etwa 113,10 cm²",
      "11 cm²",
    ],
    correct: 0,
    explain:
      "Umgelegt wird der Ausschnitt zu einem Fast-Parallelogramm: unten halb so lang wie der Bogen, so hoch wie der Radius. A = ½ · b · r = ½ · 5 cm · 6 cm = 15 cm². Ohne das Halbieren kämen 30 cm² heraus. 113,10 cm² ist der ganze Kreis π · 6² cm², und 11 cm² ist nur die Summe der beiden Zahlen.",
  },
};

function initQuizzes() {
  for (const [id, def] of Object.entries(QUIZZE)) mountQuiz(document.getElementById(id), def);
}

// ================= Übungsaufgaben =================

function initExercises() {
  mountUebungsaufgaben(document.getElementById("exercises-mount"), AUFGABEN);
}

// ================= Start =================

["ab-d", "ab-t"].forEach((id) => document.getElementById(id).addEventListener("input", renderAbrollen));
["es-n"].forEach((id) => document.getElementById(id).addEventListener("input", renderEinschachteln));
["ra-r"].forEach((id) => document.getElementById(id).addEventListener("input", renderRadius));
["se-r", "se-n", "se-t", "se-quadrate"].forEach((id) => document.getElementById(id).addEventListener("input", renderAusschnitte));
["ri-r", "ri-n", "ri-t"].forEach((id) => document.getElementById(id).addEventListener("input", renderRinge));
["kr-gr", "kr-kl", "kr-t"].forEach((id) => document.getElementById(id).addEventListener("input", renderKreisring));
["bo-r", "bo-a", "bo-t"].forEach((id) => document.getElementById(id).addEventListener("input", renderBogen));
["au-r", "au-a", "au-k", "au-t"].forEach((id) => document.getElementById(id).addEventListener("input", renderAusschnitt));

renderAbrollen();
renderEinschachteln();
renderRadius();
renderAusschnitte();
renderRinge();
renderKreisring();
renderBogen();
renderAusschnitt();
initQuizzes();
initExercises();
