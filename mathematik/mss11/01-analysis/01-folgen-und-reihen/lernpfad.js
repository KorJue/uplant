// Selbstlernpfad „Folgen und Reihen“ (MSS 11, Analysis, Thema 1). Vanilla-JS, kein Build-Schritt.
//
// Didaktische Reihenfolge — jede Stufe benutzt nur, was davor steht:
//   1. Folge, explizit und rekursiv          (braucht nur Terme und Funktionen)
//   2. arithmetisch und geometrisch          (zwei Bildungsregeln aus 1)
//   3. Monotonie und Beschränktheit          (Differenz a(n+1) − a(n), Abschätzung für alle n)
//   4. Grenzwert mit ε-Streifen              (braucht Beschränktheit als Anschauung; n₀ wird ohne
//                                             Logarithmus bestimmt — der kommt erst in einem
//                                             späteren Thema, deshalb nur Abstände der Form c/n)
//   5. Partialsumme der arithmetischen Folge (Gauß: starre Drehung einer Kopie, braucht 2)
//   6. Partialsumme der geometrischen Folge  (Verschiebetrick s − q·s, braucht 2)
//   7. unendliche geometrische Reihe         (6 und die Nullfolge qⁿ aus 4)
//   8. Stolperstelle harmonische Reihe       (Nullfolge als Summanden genügt nicht, braucht 4 und 7)
//
// Gerechnet wird mit Reglerwerten, nie mit Bildschirmkoordinaten. Die Prüfung liest die
// Zeichnungen aus dem SVG zurück (Maßstab aus den Gitterlinien mit data-wert) und rechnet nach.
//
// Farbcodierung: Folge blau, Grenzwert und Schranken violett, Glieder im Streifen und Summen grün,
// Kopie und Verschiebung orange, Ausreißer rot, Hilfslinien grau.

import { mountUebungsaufgaben } from "../../../aufgaben.js?v=2";
import { AUFGABEN, parseZahl } from "./aufgaben-folgen.js?v=1";

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
// Eine negative Zahl als Faktor oder Basis steht in Klammern: „2 · (−0,5)⁴“.
function numK(x, stellen = 4) {
  return Math.round(x * Math.pow(10, stellen)) < 0 ? `(${num(x, stellen)})` : num(x, stellen);
}
// „=“ oder „≈“: Entscheidend ist, ob die Anzeige mit dieser Stellenzahl den Wert genau trifft.
function zeichen(x, stellen = 4) {
  const f = Math.pow(10, stellen);
  return Math.abs(x * f - Math.round(x * f)) < 1e-7 ? "=" : "≈";
}
function bruch(z, n) {
  return `<span class="bruch"><span class="z">${z}</span><span class="n">${n}</span></span>`;
}
const HOCH = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "-": "⁻" };
function hoch(n) {
  return String(n).split("").map((c) => HOCH[c] || c).join("");
}
const TIEF = { "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄", "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉" };
function tief(n) {
  return String(n).split("").map((c) => TIEF[c] || c).join("");
}
function regler(id) {
  return Number(document.getElementById(id).value);
}
// Reglerwerte wie 0,3 kommen als 0.30000000000000004 an — auf das Raster des Reglers runden.
// Die Stellenzahl kommt aus dem step-Attribut selbst: Bei step = 0,25 sind es zwei Stellen — aus
// −log10(0,25) ≈ 0,6 aufgerundet würde eine, und aus 1,25 würde 1,3.
function reglerRaster(id) {
  const e = document.getElementById(id);
  const stellen = (String(e.step).split(".")[1] || "").length;
  return Number(Number(e.value).toFixed(stellen));
}
// Schreibt einen begrenzten Reglerwert zurück: Ein Regler darf nie etwas anderes anzeigen als das,
// womit gerechnet wird.
function begrenzt(id, wert) {
  const e = document.getElementById(id);
  if (Number(e.value) !== wert) e.value = String(wert);
  return wert;
}
function setzeAnzeige(id, text) {
  document.getElementById(id).textContent = text;
}
function zeige(mountId, knoten) {
  const m = document.getElementById(mountId);
  m.innerHTML = "";
  m.appendChild(knoten);
}
function flaeche(breite, hoehe) {
  return svgEl("svg", { viewBox: `0 0 ${breite} ${hoehe}`, width: breite, height: hoehe, class: "geo-svg", preserveAspectRatio: "xMidYMid meet" });
}
// Ein „schöner“ Gitterabstand für einen Bereich: 1, 2 oder 5 mal einer Zehnerpotenz.
function schritt(spanne, ziel = 6) {
  const roh = spanne / ziel;
  const p = Math.pow(10, Math.floor(Math.log10(roh)));
  const m = roh / p;
  return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p;
}

// Koordinatensystem für Folgengraphen. Die Gitterlinien tragen ihren Wert als data-wert: Die Prüfung
// rechnet daraus den Maßstab zurück und liest die Punkte als (n | aₙ) ab.
function koordinaten({ breite = 560, hoehe = 300, nmax, ymin, ymax, yName = "aₙ", nName = "n", nJede = 1 }) {
  const links = 48, rechts = 16, oben = 20, unten = 30;
  const dy = schritt(ymax - ymin);
  const y0 = Math.floor(ymin / dy - 1e-9) * dy, y1 = Math.ceil(ymax / dy + 1e-9) * dy;
  const X = (n) => links + (n / (nmax + 0.6)) * (breite - links - rechts);
  const Y = (y) => hoehe - unten - ((y - y0) / (y1 - y0)) * (hoehe - oben - unten);
  const svg = flaeche(breite, hoehe);
  const stellen = dy < 0.1 ? 2 : dy < 1 ? 1 : 0;
  for (let k = 0; y0 + k * dy <= y1 + 1e-9; k++) {
    const y = Number((y0 + k * dy).toFixed(6));
    svg.appendChild(svgEl("line", { x1: links, x2: breite - rechts, y1: Y(y).toFixed(2), y2: Y(y).toFixed(2), class: "fr-gitter", "data-achse": "y", "data-wert": String(y) }));
    svg.appendChild(svgText(links - 6, Y(y) + 4, num(y, stellen), { class: "fr-text", "text-anchor": "end" }));
  }
  for (let n = 0; n <= nmax; n += nJede) {
    if (n === 0) continue;
    svg.appendChild(svgEl("line", { x1: X(n).toFixed(2), x2: X(n).toFixed(2), y1: oben, y2: hoehe - unten, class: "fr-gitter", "data-achse": "x", "data-wert": String(n), "stroke-opacity": "0.5" }));
    svg.appendChild(svgText(X(n), hoehe - unten + 15, String(n), { class: "fr-text" }));
  }
  const yAchse = y0 <= 0 && y1 >= 0 ? 0 : y0;
  svg.appendChild(svgEl("line", { x1: links, x2: breite - rechts, y1: Y(yAchse).toFixed(2), y2: Y(yAchse).toFixed(2), class: "fr-achse" }));
  svg.appendChild(svgEl("line", { x1: links, x2: links, y1: oben - 6, y2: hoehe - unten, class: "fr-achse" }));
  svg.appendChild(svgText(breite - rechts, hoehe - 4, nName, { class: "fr-text", "text-anchor": "end" }));
  svg.appendChild(svgText(links + 5, oben - 6, yName, { class: "fr-text", "text-anchor": "start" }));
  return { svg, X, Y, links, rechts, oben, unten, breite, hoehe };
}
function punkt(svg, x, y, klasse, n, wert) {
  svg.appendChild(svgEl("circle", { cx: x.toFixed(2), cy: y.toFixed(2), r: klasse.includes("aktiv") ? 6 : 4.2, class: "fr-punkt " + klasse, "data-n": String(n), "data-wert": String(wert) }));
}

// Exakte Brüche für die Darstellung kleiner Folgenglieder wie 1/7 oder 1/8.
function ggt(a, b) {
  return b ? ggt(b, a % b) : Math.abs(a);
}
function Q(z, n = 1) {
  if (n < 0) { z = -z; n = -n; }
  const g = ggt(z, n) || 1;
  return { z: z / g, n: n / g };
}
const qWert = (q) => q.z / q.n;
const qPlus = (a, b) => Q(a.z * b.n + b.z * a.n, a.n * b.n);
const qMal = (a, b) => Q(a.z * b.z, a.n * b.n);
const qDurch = (a, b) => Q(a.z * b.n, a.n * b.z);
function qText(q) {
  if (q.n === 1) return num(q.z, 0);
  return (q.z < 0 ? "−" : "") + bruch(Math.abs(q.z), q.n);
}

// ================= 1. Explizit und rekursiv =================

const FOLGEN = {
  ungerade: {
    explizit: "aₙ = 2n − 1", rekursiv: "a₁ = 1, a<sub>n+1</sub> = aₙ + 2",
    wert: (n) => Q(2 * n - 1), start: [Q(1)], weiter: (v) => qPlus(v[v.length - 1], Q(2)),
    schrittText: (alt, n) => `${qText(alt)} + 2`, einsetzen: (n) => `2 · ${n} − 1`,
  },
  halbieren: {
    explizit: "aₙ = 64 · (½)<sup>n−1</sup>", rekursiv: "a₁ = 64, a<sub>n+1</sub> = aₙ : 2",
    wert: (n) => Q(64, Math.pow(2, n - 1)), start: [Q(64)], weiter: (v) => qDurch(v[v.length - 1], Q(2)),
    schrittText: (alt) => `${qText(alt)} : 2`, einsetzen: (n) => `64 · (½)${hoch(n - 1)}`,
  },
  kehrwert: {
    explizit: "aₙ = 1/n", rekursiv: `a₁ = 1, a<sub>n+1</sub> = ${bruch("aₙ", "1 + aₙ")}`,
    wert: (n) => Q(1, n), start: [Q(1)], weiter: (v) => { const a = v[v.length - 1]; return qDurch(a, qPlus(Q(1), a)); },
    schrittText: (alt) => `${qText(alt)} : (1 + ${qText(alt)})`, einsetzen: (n) => `1 : ${n}`,
  },
  quadrat: {
    explizit: "aₙ = n²", rekursiv: "a₁ = 1, a<sub>n+1</sub> = aₙ + 2n + 1",
    wert: (n) => Q(n * n), start: [Q(1)], weiter: (v) => qPlus(v[v.length - 1], Q(2 * v.length + 1)),
    schrittText: (alt, n) => `${qText(alt)} + ${2 * (n - 1) + 1}`, einsetzen: (n) => `${n}²`,
  },
  fibonacci: {
    explizit: null, rekursiv: "a₁ = a₂ = 1, a<sub>n+2</sub> = a<sub>n+1</sub> + aₙ",
    wert: null, start: [Q(1), Q(1)], weiter: (v) => qPlus(v[v.length - 1], v[v.length - 2]),
    schrittText: (alt, n, v) => `${qText(v[n - 3])} + ${qText(v[n - 2])}`,
  },
};
const FO_N = 10;

function folgeRekursiv(def, bis) {
  const v = def.start.slice(0, bis);
  while (v.length < bis) v.push(def.weiter(v));
  return v;
}

function renderFolge() {
  const art = document.getElementById("fo-art").value;
  const def = FOLGEN[art];
  const n = regler("fo-n");
  setzeAnzeige("fo-n-anzeige", String(n));
  const werte = folgeRekursiv(def, FO_N);
  const zahlen = werte.map(qWert);
  const K = koordinaten({ nmax: FO_N, ymin: Math.min(0, ...zahlen), ymax: Math.max(...zahlen) });
  werte.forEach((w, i) => punkt(K.svg, K.X(i + 1), K.Y(qWert(w)), i + 1 === n ? "aktiv" : "", i + 1, qWert(w)));
  zeige("fo-mount", K.svg);

  const tab = el("table", { class: "fr-tabelle" });
  tab.appendChild(el("tr", {}, [el("th", {}, "n"), ...werte.map((_, i) => el("th", {}, String(i + 1)))]));
  tab.appendChild(el("tr", {}, [el("th", {}, "aₙ"), ...werte.map((w, i) => el("td", { class: i + 1 === n ? "aktiv" : "", html: qText(w), "data-n": String(i + 1) }))]));
  zeige("fo-tabelle", tab);

  const an = werte[n - 1];
  let kette = "";
  if (n <= def.start.length) kette = `a${tief(n)} = ${qText(an)} ist vorgegeben.`;
  else {
    const teile = [];
    for (let k = def.start.length + 1; k <= n; k++) teile.push(`a${tief(k)} = ${def.schrittText(werte[k - 2], k, werte)} = ${qText(werte[k - 1])}`);
    kette = teile.length > 4 ? teile.slice(0, 2).join("; ") + "; … ; " + teile.slice(-2).join("; ") : teile.join("; ");
  }
  const schritte = Math.max(0, n - def.start.length);
  document.getElementById("fo-bilanz").innerHTML =
    (def.explizit ? `<strong>Explizit</strong> (${def.explizit}): a${tief(n)} = ${def.einsetzen(n)} = <span class="wa">${qText(def.wert(n))}</span> — ein Schritt.<br>` : `<strong>Explizit:</strong> keine handliche Formel.<br>`) +
    `<strong>Rekursiv</strong> (${def.rekursiv}): ${kette} — ${schritte === 0 ? "kein Schritt" : schritte === 1 ? "ein Schritt" : schritte + " Schritte"}.`;
  document.getElementById("fo-text").textContent = def.explizit
    ? `Beide Wege liefern a${tief(n)} = ${qWert(an) === Math.round(qWert(an)) ? num(qWert(an)) : an.z + "/" + an.n}. Explizit setzt man n = ${n} einfach ein; rekursiv braucht man alle ${n - 1} Vorgänger.`
    : `Die Fibonacci-Zahlen kennt man rekursiv: Jedes Glied ist die Summe der beiden davor. Für a${tief(n)} = ${num(qWert(an))} braucht man alle Vorgänger.`;
}

// ================= 2. Arithmetisch und geometrisch =================

const AG_NMAX = 8;

function renderArithGeo() {
  const art = document.getElementById("ag-art").value;
  const geo = art === "geo";
  document.getElementById("ag-d-label").hidden = geo;
  document.getElementById("ag-q-label").hidden = !geo;
  let a = regler("ag-a");
  let q = reglerRaster("ag-q");
  // Eine geometrische Folge braucht a₁ ≠ 0 und q ≠ 0 — sonst ist ab dem zweiten Glied alles 0 und
  // der Quotient a(n+1) : aₙ gar nicht erklärt. Der Regler springt auf den nächsten zulässigen Wert.
  if (geo && a === 0) a = begrenzt("ag-a", 1);
  if (geo && q === 0) q = begrenzt("ag-q", 0.25);
  const d = reglerRaster("ag-d");
  const n = regler("ag-n");
  setzeAnzeige("ag-a-anzeige", num(a));
  setzeAnzeige("ag-d-anzeige", num(d));
  setzeAnzeige("ag-q-anzeige", num(q));
  setzeAnzeige("ag-n-anzeige", String(n));
  const glied = (k) => (geo ? a * Math.pow(q, k - 1) : a + (k - 1) * d);
  const werte = Array.from({ length: AG_NMAX }, (_, i) => glied(i + 1));
  const K = koordinaten({ nmax: AG_NMAX, ymin: Math.min(0, ...werte), ymax: Math.max(0.5, ...werte), hoehe: 320 });
  const defs = svgEl("defs");
  const marker = svgEl("marker", { id: "ag-spitze", viewBox: "0 0 10 10", refX: "9", refY: "5", markerWidth: "7", markerHeight: "7", orient: "auto-start-reverse" });
  marker.appendChild(svgEl("path", { d: "M 0 0 L 10 5 L 0 10 z", class: "fr-spitze" }));
  defs.appendChild(marker);
  K.svg.appendChild(defs);
  // Die Schritt-Pfeile von a₁ bis aₙ: n Glieder, n − 1 Pfeile.
  for (let k = 1; k < n; k++) {
    const x1 = K.X(k), y1 = K.Y(werte[k - 1]), x2 = K.X(k + 1), y2 = K.Y(werte[k]);
    const mx = (x1 + x2) / 2, my = Math.min(y1, y2) - 16;
    K.svg.appendChild(svgEl("path", { d: `M ${x1.toFixed(1)} ${(y1 - 7).toFixed(1)} Q ${mx.toFixed(1)} ${my.toFixed(1)} ${x2.toFixed(1)} ${(y2 - 7).toFixed(1)}`, class: "fr-pfeil", "data-schritt": String(k), "marker-end": "url(#ag-spitze)" }));
    K.svg.appendChild(svgText(mx, my - 2, geo ? `· ${numK(q)}` : `${d < 0 ? "−" : "+"} ${num(Math.abs(d))}`, { class: "fr-pfeil-text" }));
  }
  werte.forEach((w, i) => punkt(K.svg, K.X(i + 1), K.Y(w), i + 1 === n ? "aktiv" : i + 1 < n ? "" : "duenn", i + 1, w));
  zeige("ag-mount", K.svg);
  const an = werte[n - 1];
  const s = n - 1;
  document.getElementById("ag-bilanz").innerHTML = geo
    ? `a${tief(n)} = a₁ · q${hoch(s)} = ${num(a)} · ${numK(q)}${hoch(s)} = <span class="wa">${num(an)}</span> &nbsp;·&nbsp; ${n} Glieder, <span class="wb">${s} Faktor${s === 1 ? "" : "en"} q</span>`
    : `a${tief(n)} = a₁ + ${s} · d = ${num(a)} + ${s} · ${numK(d)} = <span class="wa">${num(an)}</span> &nbsp;·&nbsp; ${n} Glieder, <span class="wb">${s} Schritt${s === 1 ? "" : "e"} d</span>`;
  let text;
  if (geo) {
    text = q < 0 ? `q ist negativ: Die Glieder wechseln bei jedem Schritt das Vorzeichen — die Folge ist alternierend.`
      : Math.abs(q) < 1 ? `0 < q < 1: Jedes Glied ist ein fester Bruchteil des vorigen — die Glieder schrumpfen in Richtung 0, erreichen sie aber nie.`
      : q === 1 ? `q = 1: Alle Glieder sind gleich — die Folge ist konstant.`
      : `q > 1: Die Glieder wachsen mit festem Faktor, also immer schneller — wie bei exponentiellem Wachstum.`;
  } else {
    text = d === 0 ? `d = 0: Es kommt nichts dazu, die Folge ist konstant.`
      : `Jeder Pfeil bedeutet „${d < 0 ? "−" : "+"} ${num(Math.abs(d))}“. Die Punkte liegen auf einer Geraden mit der Steigung d = ${num(d)} — eine arithmetische Folge ist eine lineare Funktion an den Stellen 1, 2, 3, …`;
  }
  document.getElementById("ag-text").textContent = text + ` Bis a${tief(n)} sind es ${s} Schritt${s === 1 ? "" : "e"}, nicht ${n}.`;
}

// ================= 3. Monotonie und Beschränktheit =================
//
// Für jede Folge stehen der genaue kleinste und größte Wert (inf, sup) und ob er angenommen wird.
// Die Bilanz prüft die Schranken dagegen — nicht gegen die zehn gezeichneten Punkte.
const MB = {
  kehrwert: { f: (n) => 1 / n, inf: 0, infAn: false, sup: 1, supAn: true, mono: "streng monoton fallend",
    beweis: `a<sub>n+1</sub> − aₙ = ${bruch("1", "n + 1")} − ${bruch("1", "n")} = ${bruch("−1", "n(n + 1)")} &lt; 0` },
  bruch: { f: (n) => (n - 1) / n, inf: 0, infAn: true, sup: 1, supAn: false, mono: "streng monoton steigend",
    beweis: `a<sub>n+1</sub> − aₙ = ${bruch("n", "n + 1")} − ${bruch("n − 1", "n")} = ${bruch("1", "n(n + 1)")} &gt; 0` },
  alternierend: { f: (n) => (n % 2 === 0 ? 1 : -1) / n, inf: -1, infAn: true, sup: 0.5, supAn: true, mono: "nicht monoton",
    beweis: "a₁ = −1 &lt; a₂ = ½, aber a₂ = ½ &gt; a₃ = −⅓ — die Differenzen wechseln das Vorzeichen" },
  quadrat: { f: (n) => (n * n) / 10, inf: 0.1, infAn: true, sup: Infinity, supAn: false, mono: "streng monoton steigend",
    beweis: `a<sub>n+1</sub> − aₙ = ${bruch("(n + 1)² − n²", "10")} = ${bruch("2n + 1", "10")} &gt; 0` },
};
const MB_N = 10;

// Das kleinste n mit aₙ > S (bzw. aₙ < s). Für die Folgen hier genügt eine Suche bis 10 000:
// S < sup bedeutet, dass es ein solches n gibt; bei (n − 1)/n und S = 0,9 ist es erst n = 11.
function erstesUeber(f, S) {
  for (let n = 1; n <= 10000; n++) if (f(n) > S + 1e-12) return n;
  return null;
}
function erstesUnter(f, s) {
  for (let n = 1; n <= 10000; n++) if (f(n) < s - 1e-12) return n;
  return null;
}

function renderMonotonie() {
  const art = document.getElementById("mb-art").value;
  const def = MB[art];
  const S = reglerRaster("mb-S"), s = reglerRaster("mb-s");
  setzeAnzeige("mb-S-anzeige", num(S));
  setzeAnzeige("mb-s-anzeige", num(s));
  const werte = Array.from({ length: MB_N }, (_, i) => def.f(i + 1));
  const K = koordinaten({ nmax: MB_N, ymin: Math.min(-1.5, ...werte), ymax: Math.max(2, ...werte), hoehe: 320 });
  const obenOk = S >= def.sup - 1e-12;
  const untenOk = s <= def.inf + 1e-12;
  for (const [wert, ok, rolle, name] of [[S, obenOk, "S", "S"], [s, untenOk, "s", "s"]]) {
    K.svg.appendChild(svgEl("line", { x1: K.links, x2: K.breite - K.rechts, y1: K.Y(wert).toFixed(2), y2: K.Y(wert).toFixed(2), class: "fr-schranke" + (ok ? "" : " verletzt"), "data-rolle": rolle, "data-wert": String(wert) }));
    K.svg.appendChild(svgText(K.breite - K.rechts - 4, K.Y(wert) + (rolle === "S" ? -5 : 13), `${name} = ${num(wert)}`, { class: "fr-grenze-text", "text-anchor": "end" }));
  }
  werte.forEach((w, i) => punkt(K.svg, K.X(i + 1), K.Y(w), w > S + 1e-12 || w < s - 1e-12 ? "draussen" : "", i + 1, w));
  zeige("mb-mount", K.svg);

  const vorzeichen = werte.slice(1).map((w, i) => (w > werte[i] ? "+" : w < werte[i] ? "−" : "0")).join(", ");
  let oben, unten;
  if (obenOk) {
    oben = `<span class="wa">S = ${num(S)} ist eine obere Schranke</span>: ${def.supAn ? `der größte Wert ist ${num(def.sup)}` : `alle Glieder liegen unter ${num(def.sup)}`}.`;
  } else {
    const k = erstesUeber(def.f, S);
    oben = `<span class="wg">S = ${num(S)} ist keine obere Schranke</span>: a${tief(k)} = ${num(def.f(k))} &gt; S${k > MB_N ? " — dieses Glied liegt schon außerhalb der Zeichnung" : ""}.`;
  }
  if (untenOk) {
    unten = `<span class="wa">s = ${num(s)} ist eine untere Schranke</span>: ${def.infAn ? `der kleinste Wert ist ${num(def.inf)}` : `alle Glieder liegen über ${num(def.inf)}`}.`;
  } else {
    const k = erstesUnter(def.f, s);
    unten = `<span class="wg">s = ${num(s)} ist keine untere Schranke</span>: a${tief(k)} = ${num(def.f(k))} &lt; s${k > MB_N ? " — dieses Glied liegt schon außerhalb der Zeichnung" : ""}.`;
  }
  document.getElementById("mb-bilanz").innerHTML =
    `Vorzeichen von a<sub>n+1</sub> − aₙ für n = 1 … ${MB_N - 1}: <span class="wb">${vorzeichen}</span><br>` +
    `Für alle n: ${def.beweis} — <strong>${def.mono}</strong>.<br>${oben}<br>${unten}`;
  const beschraenkt = def.sup !== Infinity;
  document.getElementById("mb-text").textContent = beschraenkt
    ? `Diese Folge ist beschränkt: Zwischen ${num(def.inf)} und ${num(def.sup)} passt sie ganz hinein. ${def.supAn && def.infAn ? "Beide Werte werden angenommen." : "Eine der beiden Grenzen wird nie erreicht — die Glieder kommen ihr nur beliebig nahe."}`
    : "Diese Folge ist nach unten beschränkt, aber nach oben unbeschränkt: Für jedes S gibt es ein Glied darüber, auch wenn man es erst weiter rechts findet.";
}

// ================= 4. Grenzwert mit ε-Streifen =================
//
// ε läuft über 1, ½, ⅕, 1/10, 1/20, 1/50, 1/100 — also ε = 1/k mit ganzem k. Damit ist n₀ aus der
// Ungleichung genau eine ganze Zahl, ohne Rundungsrest: c/n < 1/k ⟺ n > c·k.
const EPS_K = [1, 2, 5, 10, 20, 50, 100];
const GW = {
  a: { f: (n) => (2 * n + 1) / n, g: 2, ymin: 1, ymax: 3.2, abstand: "|aₙ − 2| = 1/n",
    ungl: (k) => `${bruch("1", "n")} &lt; ${bruch("1", k)} ⟺ n &gt; ${k}`, n0: (k) => k + 1 },
  b: { f: (n) => 3 + (2 * (n % 2 === 0 ? 1 : -1)) / n, g: 3, ymin: 0.5, ymax: 4.5, abstand: "|aₙ − 3| = 2/n",
    ungl: (k) => `${bruch("2", "n")} &lt; ${bruch("1", k)} ⟺ n &gt; ${2 * k}`, n0: (k) => 2 * k + 1 },
  c: { f: (n) => (n + 3) / (n + 1), g: 1, ymin: 0.6, ymax: 2.2, abstand: "|aₙ − 1| = 2/(n + 1)",
    ungl: (k) => `${bruch("2", "n + 1")} &lt; ${bruch("1", k)} ⟺ n + 1 &gt; ${2 * k} ⟺ n &gt; ${2 * k - 1}`, n0: (k) => 2 * k },
  d: { f: (n) => (n % 2 === 0 ? 1 : -1), g: 1, ymin: -1.6, ymax: 1.6, divergent: true },
};
const GW_N = 40;

function epsText(k) {
  return k === 1 ? "1" : num(1 / k);
}

function renderGrenzwert() {
  const art = document.getElementById("gw-art").value;
  const def = GW[art];
  const k = EPS_K[regler("gw-e")];
  const eps = 1 / k;
  setzeAnzeige("gw-e-anzeige", epsText(k));
  const K = koordinaten({ nmax: GW_N, ymin: def.ymin, ymax: def.ymax, nJede: 5, hoehe: 320 });
  const yo = K.Y(def.g + eps), yu = K.Y(def.g - eps);
  K.svg.appendChild(svgEl("rect", { x: K.links, y: yo.toFixed(2), width: K.breite - K.links - K.rechts, height: (yu - yo).toFixed(2), class: "fr-streifen", "data-rolle": "streifen", "data-oben": String(def.g + eps), "data-unten": String(def.g - eps) }));
  K.svg.appendChild(svgEl("line", { x1: K.links, x2: K.breite - K.rechts, y1: K.Y(def.g).toFixed(2), y2: K.Y(def.g).toFixed(2), class: "fr-grenze", "data-rolle": "grenzwert", "data-wert": String(def.g) }));
  // Die Beschriftung links am oberen Streifenrand: Rechts liegen die Punkte genau auf der g-Linie.
  K.svg.appendChild(svgText(K.links + 6, yo - 5, def.divergent ? `g = ${num(def.g)}?` : `g = ${num(def.g)}`, { class: "fr-grenze-text", "text-anchor": "start" }));
  let draussen = 0;
  for (let n = 1; n <= GW_N; n++) {
    const w = def.f(n);
    const drin = Math.abs(w - def.g) < eps - 1e-12;
    if (!drin) draussen++;
    punkt(K.svg, K.X(n), K.Y(w), drin ? "drin" : "draussen", n, w);
  }
  zeige("gw-mount", K.svg);
  if (def.divergent) {
    document.getElementById("gw-bilanz").innerHTML =
      `Abstand zum Kandidaten g = 1: Für gerade n ist er 0, für ungerade n ist er 2. <span class="wg">${draussen} der ${GW_N} gezeichneten Glieder</span> liegen außerhalb des Streifens — und das bleibt so für jedes ungerade n.`;
    document.getElementById("gw-text").textContent =
      "Kein ε-Streifen der Breite ε ≤ 1 fängt beide Werte 1 und −1 ein, egal wo man g hinlegt: Die beiden liegen 2 auseinander. Die Folge (−1)ⁿ hat keinen Grenzwert — sie ist divergent, obwohl sie beschränkt ist.";
    return;
  }
  const n0 = def.n0(k);
  // Probe am Rand: a(n₀ − 1) liegt nicht im Streifen, a(n₀) schon.
  const vor = n0 - 1 >= 1 ? def.f(n0 - 1) : null;
  document.getElementById("gw-bilanz").innerHTML =
    `${def.abstand} &lt; ε = ${bruch("1", k)} &nbsp;⟺&nbsp; ${def.ungl(k)} &nbsp;⟹&nbsp; <span class="wa">n₀ = ${n0}</span><br>` +
    `Probe: ${vor !== null ? `a${tief(n0 - 1)} ${zeichen(vor)} ${num(vor)} hat den Abstand ${num(Math.abs(vor - def.g))} ≥ ε (draußen), ` : ""}a${tief(n0)} ${zeichen(def.f(n0))} ${num(def.f(n0))} hat den Abstand ${num(Math.abs(def.f(n0) - def.g))} &lt; ε (drin).`;
  document.getElementById("gw-text").textContent = n0 > GW_N
    ? `Bei ε = ${epsText(k)} liegen alle Glieder ab a${tief(n0)} im Streifen — das ist schon außerhalb der Zeichnung. Hier sind noch alle ${GW_N} gezeichneten Glieder draußen oder auf dem Rand. Aber: Es sind immer nur endlich viele.`
    : `Bei ε = ${epsText(k)} liegen genau ${draussen} Glieder außerhalb des Streifens, ab a${tief(n0)} alle weiteren darin. Mach ε kleiner: n₀ wird größer, aber es gibt immer eins.`;
}

// ================= 5. Gauß: arithmetische Summe als halbes Rechteck =================
//
// Die Kopie wird starr bewegt: Drehung um den Mittelpunkt C des Zielrechtecks um t · 180° und
// zusätzlich eine Verschiebung um (1 − t) · D nach rechts. Bei t = 0 steht sie aufrecht neben der
// Treppe, bei t = 1 liegt sie gedreht genau darauf. Die Bühne wird aus der GANZEN Bewegungsspur
// aufgespannt (alle t), damit nichts aus dem Bild ragt und das Bild beim Ziehen nicht springt.

function gaussGeometrie(a, d, n) {
  const glied = (k) => a + (k - 1) * d;
  const H = glied(1) + glied(n);
  const C = { x: n / 2, y: H / 2 };
  const D = n + 1;
  const original = Array.from({ length: n }, (_, i) => [[i, 0], [i + 1, 0], [i + 1, glied(i + 1)], [i, glied(i + 1)]]);
  const lage = (t) => {
    const th = Math.PI * t, c = Math.cos(th), s = Math.sin(th);
    return original.map((poly) => poly.map(([x, y]) => [C.x + c * (x - C.x) - s * (y - C.y) + (1 - t) * D, C.y + s * (x - C.x) + c * (y - C.y)]));
  };
  return { glied, H, C, D, original, lage };
}

function drehSpur(geo) {
  let xmin = 0, xmax = 0, ymin = 0, ymax = 0;
  for (let i = 0; i <= 50; i++) {
    for (const poly of [...geo.lage(i / 50), ...geo.original]) for (const [x, y] of poly) {
      xmin = Math.min(xmin, x); xmax = Math.max(xmax, x); ymin = Math.min(ymin, y); ymax = Math.max(ymax, y);
    }
  }
  return { xmin, xmax, ymin, ymax };
}

function renderGauss() {
  const a = regler("ga-a"), d = regler("ga-d"), n = regler("ga-n");
  const t = regler("ga-t") / 100;
  setzeAnzeige("ga-a-anzeige", String(a));
  setzeAnzeige("ga-d-anzeige", String(d));
  setzeAnzeige("ga-n-anzeige", String(n));
  setzeAnzeige("ga-t-anzeige", `${Math.round(t * 180)}°`);
  const geo = gaussGeometrie(a, d, n);
  const spur = drehSpur(geo);
  // Feste Breite, Höhe aus dem Inhalt — sonst springt das Bild beim Ziehen seitlich weg.
  const breite = 600, rand = 26, unten = 30;
  const s = Math.min((breite - 2 * rand) / (spur.xmax - spur.xmin), 260 / (spur.ymax - spur.ymin));
  const hoehe = Math.ceil((spur.ymax - spur.ymin) * s + rand + unten);
  const X = (x) => rand + (x - spur.xmin) * s;
  const Y = (y) => hoehe - unten - (y - spur.ymin) * s;
  const svg = flaeche(breite, hoehe);
  svg.dataset.massstab = String(s);
  // Gitter: Einheitslinien mit Wert, damit die Prüfung den Maßstab selbst zurückrechnen kann.
  for (let y = 0; y <= Math.floor(spur.ymax); y++) svg.appendChild(svgEl("line", { x1: X(spur.xmin).toFixed(2), x2: X(spur.xmax).toFixed(2), y1: Y(y).toFixed(2), y2: Y(y).toFixed(2), class: "fr-gitter", "data-achse": "y", "data-wert": String(y), "stroke-opacity": "0.45" }));
  for (let x = Math.ceil(spur.xmin); x <= Math.floor(spur.xmax); x++) svg.appendChild(svgEl("line", { x1: X(x).toFixed(2), x2: X(x).toFixed(2), y1: Y(0).toFixed(2), y2: Y(spur.ymax).toFixed(2), class: "fr-gitter", "data-achse": "x", "data-wert": String(x), "stroke-opacity": "0.25" }));
  const pfad = (poly) => poly.map(([x, y], i) => `${i ? "L" : "M"} ${X(x).toFixed(2)} ${Y(y).toFixed(2)}`).join(" ") + " Z";
  geo.original.forEach((poly, i) => svg.appendChild(svgEl("path", { d: pfad(poly), class: "fr-saeule", "data-teil": `orig-${i + 1}` })));
  geo.lage(t).forEach((poly, i) => svg.appendChild(svgEl("path", { d: pfad(poly), class: "fr-saeule kopie", "data-teil": `kopie-${i + 1}` })));
  if (t === 1) svg.appendChild(svgEl("rect", { x: X(0).toFixed(2), y: Y(geo.H).toFixed(2), width: (n * s).toFixed(2), height: (geo.H * s).toFixed(2), class: "fr-rahmen", "data-rolle": "rechteck" }));
  for (let k = 1; k <= n; k++) svg.appendChild(svgText(X(k - 0.5), Y(0) + 15, num(geo.glied(k)), { class: "fr-text-stark" }));
  svg.appendChild(svgEl("line", { x1: X(spur.xmin).toFixed(2), x2: X(spur.xmax).toFixed(2), y1: Y(0).toFixed(2), y2: Y(0).toFixed(2), class: "fr-achse" }));
  zeige("ga-mount", svg);

  const glieder = Array.from({ length: n }, (_, i) => geo.glied(i + 1));
  const summe = glieder.reduce((x, y) => x + y, 0);
  document.getElementById("ga-bilanz").innerHTML =
    `Direkt addiert: s${tief(n)} = ${glieder.map((g) => num(g)).join(" + ")} = <span class="wc">${num(summe)}</span><br>` +
    `Rechteck: n · (a₁ + a${tief(n)}) = ${n} · (${num(glieder[0])} + ${num(glieder[n - 1])}) = ${n} · ${num(geo.H)} = <span class="wb">${num(n * geo.H)}</span> = 2 · s${tief(n)} &nbsp;⟹&nbsp; ` +
    `s${tief(n)} = ${bruch(`${num(n * geo.H)}`, "2")} = <span class="wa">${num((n * geo.H) / 2)}</span>`;
  document.getElementById("ga-text").textContent = t === 0
    ? "Die Kopie steht noch aufrecht neben der Treppe. Drehe sie mit dem Regler um 180° — sie bewegt sich als Ganzes, keine Säule ändert ihre Größe."
    : t < 1
      ? `Die Kopie ist um ${Math.round(t * 180)}° gedreht und auf dem Weg. Jede Säule behält ihren Flächeninhalt.`
      : `Die gedrehte Kopie liegt genau auf der Treppe: Über jeder Säule steht ihr Gegenstück, und zusammen reichen sie bis zur Höhe a₁ + a${tief(n)} = ${num(geo.H)}. Zwei Treppen sind ein Rechteck aus ${n} · ${num(geo.H)} = ${num(n * geo.H)} Einheitsquadraten — eine Treppe ist die Hälfte.`;
}

// ================= 6. Geometrische Summe: der Verschiebetrick =================
//
// Obere Zeile: die Summanden von sₙ in den Feldern 0 … n − 1. Untere Zeile: q · sₙ, jeder Summand
// zuerst unter dem, aus dem er durch Multiplizieren entstand (Feld k), dann um t Felder nach rechts
// verschoben. Bei t = 1 steht a₁q^(k+1) genau unter a₁q^(k+1) — gleiche Zahlen, die sich beim
// Abziehen aufheben. Übrig bleiben a₁ (oben links) und a₁qⁿ (unten rechts).

const GS_FELD = 74, GS_LINKS = 96;

function renderGeoSumme() {
  const a = regler("gs-a");
  let q = reglerRaster("gs-q");
  // q = 0 ist keine geometrische Folge (ab a₂ wäre alles 0); der Regler springt auf 0,5.
  if (q === 0) q = begrenzt("gs-q", 0.5);
  const n = regler("gs-n");
  const t = regler("gs-t") / 100;
  setzeAnzeige("gs-a-anzeige", String(a));
  setzeAnzeige("gs-q-anzeige", num(q));
  setzeAnzeige("gs-n-anzeige", String(n));
  setzeAnzeige("gs-t-anzeige", t === 1 ? "eine Stelle" : `${num(t, 2)} Stellen`);
  const glied = (k) => a * Math.pow(q, k);   // k = 0 … n
  const breite = GS_LINKS + 7 * GS_FELD + 16, hoehe = 170;
  const svg = flaeche(breite, hoehe);
  const fx = (k) => GS_LINKS + k * GS_FELD;
  const yo = 26, yu = 104, fh = 40, fb = GS_FELD - 16;
  svg.appendChild(svgText(GS_LINKS - 10, yo + fh / 2 + 5, `s${tief(n)} =`, { class: "fr-text-stark", "text-anchor": "end" }));
  svg.appendChild(svgText(GS_LINKS - 10, yu + fh / 2 + 5, `q · s${tief(n)} =`, { class: "fr-text-stark", "text-anchor": "end" }));
  const fertig = t === 1 && q !== 1;
  const feld = (x, y, wert, klasse, rolle) => {
    const g = svgEl("g", { "data-rolle": rolle, "data-wert": String(wert), "data-x": x.toFixed(2) });
    g.appendChild(svgEl("rect", { x: x.toFixed(2), y, width: fb, height: fh, rx: 6, class: "fr-feld " + klasse }));
    g.appendChild(svgText(x + fb / 2, y + fh / 2 + 5, num(wert, 3), { class: "fr-feldtext" + (klasse.includes("weg") ? " weg" : "") }));
    svg.appendChild(g);
  };
  for (let k = 0; k < n; k++) {
    if (k > 0) svg.appendChild(svgText(fx(k) - 8, yo + fh / 2 + 5, "+", { class: "fr-text-stark" }));
    feld(fx(k), yo, glied(k), fertig ? (k === 0 ? "bleibt" : "weg") : "", `oben-${k}`);
  }
  for (let k = 0; k < n; k++) {
    const x = fx(k + t);
    if (k > 0) svg.appendChild(svgText(x - 8, yu + fh / 2 + 5, "+", { class: "fr-text-stark" }));
    feld(x, yu, glied(k + 1), "kopie" + (fertig ? (k === n - 1 ? " bleibt" : " weg") : ""), `unten-${k}`);
  }
  if (fertig) svg.appendChild(svgText(breite / 2, hoehe - 10, `Übrig: ${num(glied(0), 3)} oben links und ${num(glied(n), 3)} unten rechts`, { class: "fr-pfeil-text" }));
  zeige("gs-mount", svg);

  const summanden = Array.from({ length: n }, (_, k) => glied(k));
  const direkt = summanden.reduce((x, y) => x + y, 0);
  const formel = q === 1 ? n * a : (a * (1 - Math.pow(q, n))) / (1 - q);
  document.getElementById("gs-bilanz").innerHTML =
    `Direkt addiert: s${tief(n)} = ${summanden.map((v) => num(v, 3)).join(" + ")} ${zeichen(direkt, 3)} <span class="wc">${num(direkt, 3)}</span><br>` +
    (q === 1
      ? `q = 1: s${tief(n)} − q · s${tief(n)} = 0 — der Trick liefert nur 0 = 0. Hier hilft s${tief(n)} = n · a₁ = ${n} · ${a} = <span class="wa">${num(n * a)}</span>`
      : `s${tief(n)} − q · s${tief(n)} = a₁ − a₁ · q${hoch(n)} = ${num(a)} − ${num(glied(n), 3)} &nbsp;⟹&nbsp; s${tief(n)} = ${bruch(`${num(a)} · (1 − ${numK(q)}${hoch(n)})`, `1 − ${numK(q)}`)} ${zeichen(formel, 3)} <span class="wa">${num(formel, 3)}</span>`);
  document.getElementById("gs-text").textContent = q === 1
    ? "Für q = 1 sind beide Zeilen gleich — nach dem Abziehen bleibt nichts übrig, und man kann nicht durch 1 − q = 0 teilen."
    : t === 0
      ? "In der unteren Zeile steht jeder Summand mal q unter dem Summanden, aus dem er entstand. Schiebe die Zeile um eine Stelle nach rechts."
      : t < 1
        ? "Die untere Zeile ist unterwegs. Gleich steht jede Zahl unter ihrem Zwilling aus der oberen Zeile."
        : `Jede Zahl steht unter ihrem Zwilling und fällt beim Abziehen weg. Übrig bleiben ${num(a)} und ${num(glied(n), 3)}: (1 − q) · s${tief(n)} = a₁ − a₁q${hoch(n)}.`;
}

// ================= 7. Unendliche geometrische Reihe =================

const UG_NMAX = 12;

function renderUnendlich() {
  const a = reglerRaster("ug-a");
  const q = reglerRaster("ug-q");
  const n = regler("ug-n");
  setzeAnzeige("ug-a-anzeige", num(a));
  setzeAnzeige("ug-q-anzeige", num(q));
  setzeAnzeige("ug-n-anzeige", String(n));
  const sGrenz = a / (1 - q);
  const partial = [0];
  for (let k = 1; k <= UG_NMAX; k++) partial.push(partial[k - 1] + a * Math.pow(q, k - 1));
  // Der Zahlenstrahl umfasst alle Partialsummen bis 12 und den Grenzwert — er hängt von a₁ und q
  // ab, nicht von n: Beim Ziehen an n bleibt das Bild stehen.
  const lo = Math.min(0, ...partial, sGrenz), hi = Math.max(...partial, sGrenz);
  const breite = 600, links = 30, rechts = 30, oben = 24, zeile = 15;
  const hoehe = oben + UG_NMAX * zeile + 52;
  const X = (x) => links + ((x - lo) / (hi - lo)) * (breite - links - rechts);
  const svg = flaeche(breite, hoehe);
  const yAchse = oben + UG_NMAX * zeile + 12;
  const dx = schritt(hi - lo, 8);
  for (let v = Math.ceil(lo / dx - 1e-9) * dx; v <= hi + 1e-9; v += dx) {
    const w = Number(v.toFixed(6));
    svg.appendChild(svgEl("line", { x1: X(w).toFixed(2), x2: X(w).toFixed(2), y1: oben - 6, y2: yAchse + 4, class: "fr-gitter", "data-achse": "x", "data-wert": String(w), "stroke-opacity": "0.5" }));
    svg.appendChild(svgText(X(w), yAchse + 18, num(w, 2), { class: "fr-text" }));
  }
  svg.appendChild(svgEl("line", { x1: links, x2: breite - rechts, y1: yAchse, y2: yAchse, class: "fr-achse" }));
  svg.appendChild(svgEl("line", { x1: X(sGrenz).toFixed(2), x2: X(sGrenz).toFixed(2), y1: oben - 10, y2: yAchse, class: "fr-grenze", "data-rolle": "grenzwert", "data-wert": String(sGrenz) }));
  svg.appendChild(svgText(X(sGrenz) + 5, oben - 12, `s = ${num(sGrenz, 3)}`, { class: "fr-grenze-text", "text-anchor": X(sGrenz) > breite - 110 ? "end" : "start" }));
  for (let k = 1; k <= n; k++) {
    const y = oben + (k - 1) * zeile + 6;
    const plus = partial[k] >= partial[k - 1];
    svg.appendChild(svgEl("line", { x1: X(partial[k - 1]).toFixed(2), x2: X(partial[k]).toFixed(2), y1: y, y2: y, class: "fr-strecke" + (plus ? "" : " b"), "data-k": String(k), "data-von": String(partial[k - 1]), "data-bis": String(partial[k]) }));
    svg.appendChild(svgEl("circle", { cx: X(partial[k]).toFixed(2), cy: y, r: k === n ? 5 : 3, class: "fr-punkt" + (k === n ? " aktiv" : ""), "data-n": String(k), "data-wert": String(partial[k]) }));
  }
  const yn = oben + (n - 1) * zeile + 6;
  svg.appendChild(svgEl("line", { x1: X(partial[n]).toFixed(2), x2: X(sGrenz).toFixed(2), y1: yn, y2: yn, class: "fr-luecke", "data-rolle": "luecke" }));
  zeige("ug-mount", svg);

  const formelLuecke = (a * Math.pow(q, n)) / (1 - q);
  document.getElementById("ug-bilanz").innerHTML =
    `s${tief(n)} = ${bruch(`${num(a)} · (1 − ${numK(q)}${hoch(n)})`, `1 − ${numK(q)}`)} ${zeichen(partial[n])} <span class="wa">${num(partial[n])}</span> &nbsp;·&nbsp; ` +
    `s = ${bruch(num(a), `1 − ${numK(q)}`)} ${zeichen(sGrenz)} <span class="wr">${num(sGrenz)}</span><br>` +
    `Lücke s − s${tief(n)} = ${bruch(`${num(a)} · ${numK(q)}${hoch(n)}`, `1 − ${numK(q)}`)} ${zeichen(formelLuecke)} <span class="wg">${num(formelLuecke)}</span>` +
    ` — sie schrumpft mit jedem Schritt auf das ${num(Math.abs(q))}-fache.`;
  document.getElementById("ug-text").textContent = q === 0
    ? "q = 0: Nach dem ersten Summanden kommt nichts mehr dazu — die Summe ist sofort a₁."
    : q < 0
      ? `q ist negativ: Die Summanden wechseln das Vorzeichen, die Partialsummen springen abwechselnd über und unter s = ${num(sGrenz, 3)} — und kommen ihm dabei immer näher.`
      : `Jeder neue Summand schließt einen festen Anteil der verbleibenden Lücke: Die Partialsummen wachsen, kommen aber nie über s = ${num(sGrenz, 3)} hinaus. Unendlich viele Summanden, endliche Summe.`;
}

// ================= 8. Stolperstelle: die harmonische Reihe =================

function renderHarmonisch() {
  const k = regler("hr-k");
  setzeAnzeige("hr-k-anzeige", String(k));
  const N = Math.pow(2, k);
  const breite = 600, hoehe = 260, links = 44, rechts = 14, oben = 18, unten = 30;
  const svg = flaeche(breite, hoehe);
  const bx = (breite - links - rechts) / N;
  const Y = (y) => hoehe - unten - y * (hoehe - oben - unten);
  for (const y of [0, 0.25, 0.5, 0.75, 1]) {
    svg.appendChild(svgEl("line", { x1: links, x2: breite - rechts, y1: Y(y).toFixed(2), y2: Y(y).toFixed(2), class: "fr-gitter", "data-achse": "y", "data-wert": String(y) }));
    svg.appendChild(svgText(links - 6, Y(y) + 4, num(y, 2), { class: "fr-text", "text-anchor": "end" }));
  }
  const bloecke = [];
  for (let m = 1; m <= N; m++) {
    const j = m === 1 ? 0 : Math.ceil(Math.log2(m));
    svg.appendChild(svgEl("rect", { x: (links + (m - 1) * bx).toFixed(2), y: Y(1 / m).toFixed(2), width: Math.max(0.5, bx - (bx > 4 ? 1 : 0)).toFixed(2), height: ((1 / m) * (hoehe - oben - unten)).toFixed(2), class: "fr-saeule " + (j % 2 ? "block-a" : "block-b"), "data-m": String(m), "data-block": String(j) }));
  }
  for (let j = 1; j <= k; j++) {
    const von = Math.pow(2, j - 1) + 1, bis = Math.pow(2, j);
    let summe = 0;
    for (let m = von; m <= bis; m++) summe += 1 / m;
    bloecke.push({ j, von, bis, summe });
    // Die Untergrenze: Jeder Summand im Block ist mindestens 1/2^j — das gestrichelte Niveau.
    svg.appendChild(svgEl("line", { x1: (links + (von - 1) * bx).toFixed(2), x2: (links + bis * bx).toFixed(2), y1: Y(1 / bis).toFixed(2), y2: Y(1 / bis).toFixed(2), class: "fr-grenze", "data-block": String(j), "data-wert": String(1 / bis) }));
  }
  svg.appendChild(svgEl("line", { x1: links, x2: breite - rechts, y1: Y(0), y2: Y(0), class: "fr-achse" }));
  svg.appendChild(svgText(breite - rechts, hoehe - 6, `Summand Nr. m (bis ${N})`, { class: "fr-text", "text-anchor": "end" }));
  svg.appendChild(svgText(links + 5, oben - 4, "1/m", { class: "fr-text", "text-anchor": "start" }));
  zeige("hr-mount", svg);
  const gesamt = 1 + bloecke.reduce((s, b) => s + b.summe, 0);
  document.getElementById("hr-bilanz").innerHTML =
    bloecke.map((b) => `Block ${b.j} (1/${b.von} bis 1/${b.bis}): ${b.bis - b.von + 1} Summand${b.bis === b.von ? "" : "en"}, jeder ≥ ${bruch("1", b.bis)} → Summe ${zeichen(b.summe)} ${num(b.summe)} ≥ ½`).join("<br>") +
    `<br>s${tief(N)} = 1 + Blöcke ${zeichen(gesamt)} <span class="wa">${num(gesamt)}</span> ≥ 1 + ${k} · ½ = <span class="wr">${num(1 + k / 2)}</span>`;
  document.getElementById("hr-text").textContent =
    `Mit ${k} ${k === 1 ? "Block" : "Blöcken"} ist die Summe schon mindestens ${num(1 + k / 2)}. Jeder weitere Block legt mindestens ½ dazu — nach 20 Blöcken (gut eine Million Summanden) sind es mindestens 11. Die Summe wächst langsam, aber über jede Grenze.`;
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
  "quiz-folge": {
    q: "Eine Folge ist rekursiv gegeben durch a₁ = 3 und a<sub>n+1</sub> = 2 · aₙ − 1. Wie lautet a₄?",
    options: ["5", "9", "17", "33"],
    correct: 2,
    explain: "Schritt für Schritt: a₂ = 2 · 3 − 1 = 5, a₃ = 2 · 5 − 1 = 9, a₄ = 2 · 9 − 1 = 17. Rekursiv kommt man nur über die Vorgänger zum Ziel — 9 ist a₃, 33 schon a₅.",
  },
  "quiz-arith-geo": {
    q: "Eine arithmetische Folge hat a₁ = 4 und d = 3. Welches Glied ist a₁₀?",
    options: ["31", "34", "30", "40"],
    correct: 0,
    explain: "Von a₁ bis a₁₀ sind es 9 Schritte, nicht 10: a₁₀ = 4 + 9 · 3 = 31. 34 entsteht, wenn man 10 Schritte zählt — der typische Zaunpfahlfehler.",
  },
  "quiz-monotonie": {
    q: "Die ersten zwanzig Glieder einer Folge sind alle kleiner als 5. Was folgt daraus?",
    options: [
      "Die Folge ist nach oben beschränkt durch 5.",
      "Die Folge konvergiert gegen 5.",
      "Die Folge ist monoton steigend.",
      "Noch nichts über die ganze Folge — dafür braucht man eine Begründung, die für alle n gilt.",
    ],
    correct: 3,
    explain: "Endlich viele Glieder sagen nichts über die übrigen unendlich vielen. (n − 1)/n bleibt in der Zeichnung unter 0,9 — bis a₁₁. Erst eine Abschätzung für jedes n, etwa aₙ = 1 − 1/n &lt; 1, beweist eine Schranke.",
  },
  "quiz-grenzwert": {
    q: "Für aₙ = (2n + 1)/n und ε = 0,05: Ab welchem Index liegen alle Glieder im ε-Streifen um 2?",
    options: ["ab n = 20", "ab n = 21", "ab n = 5", "Es gibt keinen solchen Index."],
    correct: 1,
    explain: "|aₙ − 2| = 1/n &lt; 0,05 heißt n &gt; 20. Bei n = 20 ist der Abstand genau 0,05 — das ist nicht kleiner als ε. Also n₀ = 21.",
  },
  "quiz-arith-reihe": {
    q: "Wie groß ist 3 + 7 + 11 + … + 79 (eine arithmetische Folge mit d = 4)?",
    options: ["820", "1640", "800", "861"],
    correct: 0,
    explain: "Anzahl der Glieder: (79 − 3) : 4 + 1 = 20. Summe = 20 · (3 + 79) : 2 = 820. Ohne das Halbieren käme 1640 heraus — das ist das ganze Rechteck aus zwei Treppen.",
  },
  "quiz-geo-reihe": {
    q: "Was liefert der Verschiebetrick sₙ − q · sₙ bei einer geometrischen Folge?",
    options: [
      "Null, weil sich alle Summanden aufheben.",
      "Nur noch das erste und das (n + 1)-te Glied: a₁ − a₁ · qⁿ.",
      "Das Doppelte der Summe, wie beim Gauß-Trick.",
      "n · a₁ für jedes q.",
    ],
    correct: 1,
    explain: "q · sₙ enthält dieselben Summanden wie sₙ, nur um eine Stelle verschoben: Es fehlt a₁, dafür kommt a₁qⁿ dazu. Alles andere hebt sich auf. Nur bei q = 1 bleibt tatsächlich 0 übrig — dann gilt sₙ = n · a₁.",
  },
  "quiz-unendlich": {
    q: "Welchen Wert hat 8 − 4 + 2 − 1 + ½ − …?",
    options: ["16", "5⅓", "8", "Die Reihe hat keinen Wert."],
    correct: 1,
    explain: "a₁ = 8, q = −½, |q| &lt; 1: s = 8 : (1 − (−½)) = 8 : 1,5 = 16/3 = 5⅓. Mit q = +½ wären es 16. Die Partialsummen springen abwechselnd über und unter 5⅓.",
  },
  "quiz-stolperstelle": {
    q: "Die Summanden einer Reihe bilden eine Nullfolge. Was lässt sich daraus über die Reihe sagen?",
    options: [
      "Sie konvergiert immer.",
      "Sie divergiert immer.",
      "Sie konvergiert, wenn die Summanden kleiner als 1 sind.",
      "Noch nichts: Die geometrische Reihe mit q = ½ konvergiert, die harmonische Reihe nicht.",
    ],
    correct: 3,
    explain: "Summanden → 0 ist nötig, aber nicht ausreichend. 1 + ½ + ¼ + … = 2, aber 1 + ½ + ⅓ + ¼ + … wächst über jede Grenze, weil jeder Block von 1/(2<sup>k−1</sup> + 1) bis 1/2<sup>k</sup> mindestens ½ beiträgt.",
  },
};

// ================= Selbsteinschätzung =================
//
// Die Auswahl liegt nur im Browser dieser Person — eine Lernhilfe, keine Leistungsmessung.
const SE_PUNKTE = [
  ["sec-folge", "Ich kann eine Folge explizit und rekursiv angeben und Glieder berechnen."],
  ["sec-arith-geo", "Ich erkenne arithmetische und geometrische Folgen und berechne aₙ — mit n − 1 Schritten."],
  ["sec-monotonie", "Ich kann Monotonie und Schranken für alle n begründen, nicht nur an Beispielen."],
  ["sec-grenzwert", "Ich kann den ε-Streifen erklären und zu einem ε das n₀ bestimmen."],
  ["sec-arith-reihe", "Ich kann die Summe einer arithmetischen Folge berechnen und die Formel herleiten."],
  ["sec-geo-reihe", "Ich kann die Summe einer geometrischen Folge berechnen und den Verschiebetrick erklären."],
  ["sec-unendlich", "Ich kann den Wert einer unendlichen geometrischen Reihe angeben und weiß, wann es ihn gibt."],
  ["sec-stolperstelle", "Ich weiß, warum Summanden, die gegen 0 gehen, noch keine konvergente Reihe garantieren."],
];
const SE_SCHLUESSEL = "uplant-mss11-folgen-selbsteinschaetzung";

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
  [["fo-art", "fo-n"], renderFolge],
  [["ag-art", "ag-a", "ag-d", "ag-q", "ag-n"], renderArithGeo],
  [["mb-art", "mb-S", "mb-s"], renderMonotonie],
  [["gw-art", "gw-e"], renderGrenzwert],
  [["ga-a", "ga-d", "ga-n", "ga-t"], renderGauss],
  [["gs-a", "gs-q", "gs-n", "gs-t"], renderGeoSumme],
  [["ug-a", "ug-q", "ug-n"], renderUnendlich],
  [["hr-k"], renderHarmonisch],
];
for (const [ids, render] of REGLER) {
  ids.forEach((id) => {
    const e = document.getElementById(id);
    e.addEventListener(e.tagName === "SELECT" ? "change" : "input", render);
    if (e.tagName === "SELECT") e.addEventListener("input", render);
  });
  render();   // nicht vergessen — sonst bleibt die Zeichnung leer, bis jemand einen Regler anfasst
}
for (const [id, def] of Object.entries(QUIZZE)) mountQuiz(document.getElementById(id), def);
renderSelbsteinschaetzung();
mountUebungsaufgaben(document.getElementById("exercises-mount"), AUFGABEN, { parse: parseZahl });
