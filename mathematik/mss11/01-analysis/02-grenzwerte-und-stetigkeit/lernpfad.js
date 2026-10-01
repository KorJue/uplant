// Selbstlernpfad „Grenzwerte und Stetigkeit“ (MSS 11, Analysis, Thema 2). Vanilla-JS, kein Build.
//
// Didaktische Reihenfolge — jede Stufe benutzt nur, was davor steht:
//   1. Grenzwert für x → ∞            (ε-Streifen aus Thema 1, jetzt mit reellem x)
//   2. Grenzwert an einer Stelle      (Testfolgen: zurückgeführt auf Folgengrenzwerte aus Thema 1;
//                                       links/rechts getrennt; h-Methode)
//   3. Grenzwertsätze, gebrochenrationale Funktionen für x → ±∞ (Sätze aus Thema 1 übertragen)
//   4. Stetigkeit                      (braucht den Grenzwert an einer Stelle aus 2)
//   5. Definitionslücken               (2 und 4: hebbar = stetig fortsetzbar, sonst Pol)
//   6. Zwischenwertsatz, Halbierung    (braucht Stetigkeit aus 4; Intervallschachtelung = Folgen)
//   7. Stolperstelle 1/x               (Stetigkeit nur auf der Definitionsmenge, braucht 4 und 5)
//
// Gerechnet wird mit Reglerwerten, nie mit Bildschirmkoordinaten. Die Prüfung liest die
// Zeichnungen aus dem SVG zurück (Maßstab aus den Gitterlinien mit data-wert) und rechnet nach.
//
// Farbcodierung: Graph blau, Grenzwert/Asymptote violett, im Streifen grün, außerhalb rot,
// Testfolge von links orange, von rechts blau, Sprung rot, Hilfslinien grau.

import { mountUebungsaufgaben } from "../../../aufgaben.js?v=2";
import { AUFGABEN, parseZahl } from "./aufgaben-grenzwerte.js?v=1";

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
// Ein Summand mit Rechenzeichen davor — das Vorzeichen steckt nur hier.
function plusMinus(x, stellen = 4) {
  return (x < 0 ? "− " : "+ ") + num(Math.abs(x), stellen);
}
function bruch(z, n) {
  return `<span class="bruch"><span class="z">${z}</span><span class="n">${n}</span></span>`;
}
const TIEF = { "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄", "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉" };
const tief = (n) => String(n).split("").map((c) => TIEF[c] || c).join("");
function regler(id) {
  return Number(document.getElementById(id).value);
}
// Die Stellenzahl kommt aus dem step-Attribut: Bei step = 0,25 sind es zwei Stellen.
function reglerRaster(id) {
  const e = document.getElementById(id);
  const stellen = (String(e.step).split(".")[1] || "").length;
  return Number(Number(e.value).toFixed(stellen));
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
function schritt(spanne, ziel = 6) {
  const roh = spanne / ziel;
  const p = Math.pow(10, Math.floor(Math.log10(roh)));
  const m = roh / p;
  return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p;
}

// Koordinatensystem mit reellem x. Die Gitterlinien tragen ihren Wert als data-wert; die
// Zeichenfläche hat einen Clip-Rahmen, damit Äste, die nach oben weglaufen, sauber abgeschnitten
// werden statt über die Beschriftung zu laufen.
let clipZaehler = 0;
function koordinatenXY({ breite = 560, hoehe = 320, xmin, xmax, ymin, ymax, xName = "x", yName = "y" }) {
  const links = 46, rechts = 14, oben = 18, unten = 28;
  const X = (x) => links + ((x - xmin) / (xmax - xmin)) * (breite - links - rechts);
  const Y = (y) => hoehe - unten - ((y - ymin) / (ymax - ymin)) * (hoehe - oben - unten);
  const svg = flaeche(breite, hoehe);
  const id = `clip-${++clipZaehler}`;
  const defs = svgEl("defs");
  const cp = svgEl("clipPath", { id });
  cp.appendChild(svgEl("rect", { x: links, y: oben, width: breite - links - rechts, height: hoehe - oben - unten }));
  defs.appendChild(cp);
  svg.appendChild(defs);
  const dx = schritt(xmax - xmin, 8), dy = schritt(ymax - ymin, 6);
  const stx = dx < 0.1 ? 2 : dx < 1 ? 1 : 0, sty = dy < 0.1 ? 2 : dy < 1 ? 1 : 0;
  for (let v = Math.ceil(xmin / dx - 1e-9) * dx; v <= xmax + 1e-9; v += dx) {
    const w = Number(v.toFixed(6));
    svg.appendChild(svgEl("line", { x1: X(w).toFixed(2), x2: X(w).toFixed(2), y1: oben, y2: hoehe - unten, class: "fr-gitter", "data-achse": "x", "data-wert": String(w), "stroke-opacity": "0.55" }));
    svg.appendChild(svgText(X(w), hoehe - unten + 14, num(w, stx), { class: "fr-text" }));
  }
  for (let v = Math.ceil(ymin / dy - 1e-9) * dy; v <= ymax + 1e-9; v += dy) {
    const w = Number(v.toFixed(6));
    svg.appendChild(svgEl("line", { x1: links, x2: breite - rechts, y1: Y(w).toFixed(2), y2: Y(w).toFixed(2), class: "fr-gitter", "data-achse": "y", "data-wert": String(w) }));
    svg.appendChild(svgText(links - 6, Y(w) + 4, num(w, sty), { class: "fr-text", "text-anchor": "end" }));
  }
  const xa = ymin <= 0 && ymax >= 0 ? 0 : ymin;
  const ya = xmin <= 0 && xmax >= 0 ? 0 : xmin;
  svg.appendChild(svgEl("line", { x1: links, x2: breite - rechts, y1: Y(xa).toFixed(2), y2: Y(xa).toFixed(2), class: "fr-achse" }));
  svg.appendChild(svgEl("line", { x1: X(ya).toFixed(2), x2: X(ya).toFixed(2), y1: oben - 4, y2: hoehe - unten, class: "fr-achse" }));
  svg.appendChild(svgText(breite - rechts, hoehe - 4, xName, { class: "fr-text", "text-anchor": "end" }));
  svg.appendChild(svgText(X(ya) + 6, oben - 5, yName, { class: "fr-text", "text-anchor": "start" }));
  const ebene = svgEl("g", { "clip-path": `url(#${id})` });
  svg.appendChild(ebene);
  return { svg, ebene, X, Y, links, rechts, oben, unten, breite, hoehe, xmin, xmax, ymin, ymax };
}

// Ein Funktionsgraph als Pfad. Wo f nicht definiert ist (NaN) oder weit aus dem Bild läuft, wird
// der Pfad unterbrochen — sonst verbände eine Linie die beiden Äste einer Polstelle.
// klasseVon(x, y) erlaubt, Teile anders zu färben (im Streifen / außerhalb); jeder Teil bekommt
// seine Klasse als data-teil, damit die Prüfung ihn auslesen kann.
function graph(K, f, x1, x2, { schritte = 400, klasseVon = () => "", rolle = "graph" } = {}) {
  const reichweite = (K.ymax - K.ymin) * 3;
  let pfad = "", klasse = null;
  const zeichne = () => {
    if (pfad) K.ebene.appendChild(svgEl("path", { d: pfad, class: "fr-linie " + (klasse || ""), "data-rolle": rolle, "data-teil": klasse || "graph" }));
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

// ================= 1. Grenzwert für x → ∞ =================

const EPS_K = [1, 2, 5, 10, 20, 50, 100];
const GU = {
  a: { f: (x) => (2 * x + 1) / x, g: 2, ymin: 0, ymax: 5, abstand: "|f(x) − 2| = 1/x",
    x0: (k) => k, ungl: (k) => `${bruch("1", "x")} &lt; ${bruch("1", k)} ⟺ x &gt; ${k}`, genau: true },
  b: { f: (x) => (3 * x * x - 1) / (x * x + 1), g: 3, ymin: -1.5, ymax: 4, abstand: "|f(x) − 3| = 4/(x² + 1)",
    x0: (k) => Math.sqrt(4 * k - 1), ungl: (k) => `${bruch("4", "x² + 1")} &lt; ${bruch("1", k)} ⟺ x² &gt; ${4 * k - 1} ⟺ x &gt; √${4 * k - 1}`, genau: true },
  c: { f: (x) => Math.sin(x) / x, g: 0, ymin: -0.5, ymax: 1.2, abstand: "|f(x) − 0| ≤ 1/x",
    x0: (k) => k, ungl: (k) => `|sin x| ≤ 1, also ${bruch("|sin x|", "x")} ≤ ${bruch("1", "x")} &lt; ${bruch("1", k)} für x &gt; ${k}`, genau: false },
  d: { f: (x) => (x * x) / (x + 1), g: 5, ymin: 0, ymax: 20, divergent: true },
};
const GU_XMAX = 20;

function renderUnendlich() {
  const art = document.getElementById("gu-art").value;
  const def = GU[art];
  const k = EPS_K[regler("gu-e")];
  const eps = 1 / k;
  setzeAnzeige("gu-e-anzeige", k === 1 ? "1" : num(eps));
  const K = koordinatenXY({ xmin: 0, xmax: GU_XMAX, ymin: def.ymin, ymax: def.ymax });
  const yo = K.Y(def.g + eps), yu = K.Y(def.g - eps);
  K.ebene.appendChild(svgEl("rect", { x: K.links, y: yo.toFixed(2), width: K.breite - K.links - K.rechts, height: (yu - yo).toFixed(2), class: "fr-streifen", "data-rolle": "streifen", "data-oben": String(def.g + eps), "data-unten": String(def.g - eps) }));
  K.ebene.appendChild(svgEl("line", { x1: K.links, x2: K.breite - K.rechts, y1: K.Y(def.g).toFixed(2), y2: K.Y(def.g).toFixed(2), class: "fr-grenze", "data-rolle": "asymptote", "data-wert": String(def.g) }));
  graph(K, def.f, 0.02, GU_XMAX, { schritte: 800, klasseVon: (x, y) => (Math.abs(y - def.g) < eps ? "drin" : "draussen") });
  K.svg.appendChild(svgText(K.links + 6, yo - 5, def.divergent ? `y = ${num(def.g)}?` : `y = ${num(def.g)}`, { class: "fr-grenze-text", "text-anchor": "start" }));
  if (!def.divergent) {
    const x0 = def.x0(k);
    if (x0 <= GU_XMAX) {
      K.svg.appendChild(svgEl("line", { x1: K.X(x0).toFixed(2), x2: K.X(x0).toFixed(2), y1: K.oben, y2: K.hoehe - K.unten, class: "fr-x0", "data-rolle": "x0", "data-wert": String(x0) }));
      K.svg.appendChild(svgText(K.X(x0) + 4, K.oben + 12, `x₀ ${zeichen(x0, 2)} ${num(x0, 2)}`, { class: "fr-x0-text", "text-anchor": "start" }));
    }
  }
  zeige("gu-mount", K.svg);
  if (def.divergent) {
    const S = 5 * k;   // eine Schranke, die mit kleinerem ε wächst — f überholt sie trotzdem
    document.getElementById("gu-bilanz").innerHTML =
      `f(x) = ${bruch("x²", "x + 1")} = x − 1 + ${bruch("1", "x + 1")} ≥ x − 1. Für jede Schranke S ist f(x) &gt; S, sobald x &gt; S + 1 — etwa f(x) &gt; ${num(S)} für x &gt; ${num(S + 1)}.`;
    document.getElementById("gu-text").textContent =
      "Kein Streifen hält diesen Graphen fest: Er wächst über jede Schranke, auch über den Kandidaten y = 5. Es gibt keinen Grenzwert und keine waagerechte Asymptote — man schreibt lim f(x) = ∞ für x → ∞ (uneigentlicher Grenzwert).";
    return;
  }
  const x0 = def.x0(k);
  document.getElementById("gu-bilanz").innerHTML =
    `${def.abstand} &lt; ε = ${bruch("1", k)}: &nbsp; ${def.ungl(k)} &nbsp;⟹&nbsp; <span class="wa">x₀ ${zeichen(x0, 4)} ${num(x0, 4)}</span><br>` +
    `Probe bei x = ${num(x0 + 1, 2)}: f(x) ${zeichen(def.f(x0 + 1))} ${num(def.f(x0 + 1))}, Abstand ${num(Math.abs(def.f(x0 + 1) - def.g))} &lt; ε.`;
  document.getElementById("gu-text").textContent = def.genau
    ? `Rechts von x₀ ${zeichen(x0, 2)} ${num(x0, 2)} bleibt der Graph im Streifen (grün). ${x0 > GU_XMAX ? "Das ist schon außerhalb der Zeichnung — " : ""}Für jedes ε gibt es ein solches x₀: lim f(x) = ${num(def.g)}, die Gerade y = ${num(def.g)} ist waagerechte Asymptote.`
    : `Die Abschätzung |sin x| ≤ 1 liefert ein x₀, ab dem der Graph sicher im Streifen bleibt. Das genaue x₀ kann etwas kleiner sein — für den Grenzwert genügt, dass es überhaupt eins gibt. lim f(x) = 0, obwohl der Graph die Asymptote immer wieder schneidet.`;
}

// ================= 2. Grenzwert an einer Stelle: Testfolgen =================

const TS = {
  luecke: { f: (x) => (x === 1 ? NaN : (x * x - 1) / (x - 1)), links: 2, rechts: 2, fx0: null, ymin: 0, ymax: 4,
    formelL: (n) => `2 − ${bruch("1", n)}`, formelR: (n) => `2 + ${bruch("1", n)}`,
    text: "Von links und rechts streben die Funktionswerte gegen 2. Der Grenzwert existiert: lim f(x) = 2 — obwohl f(1) gar nicht definiert ist. Für x ≠ 1 ist f(x) = x + 1." },
  sprung: { f: (x) => (x === 1 ? NaN : Math.abs(x - 1) / (x - 1)), links: -1, rechts: 1, fx0: null, ymin: -2, ymax: 2,
    formelL: () => "−1", formelR: () => "1",
    text: "Links ist f immer −1, rechts immer 1. Beide einseitigen Grenzwerte existieren, sind aber verschieden — einen Grenzwert an der Stelle 1 gibt es nicht. Der Graph springt." },
  pol: { f: (x) => (x === 1 ? NaN : 1 / ((x - 1) * (x - 1))), links: Infinity, rechts: Infinity, fx0: null, ymin: 0, ymax: 12,
    formelL: (n) => `${n}² = ${n * n}`, formelR: (n) => `${n}² = ${n * n}`,
    text: "Auf beiden Seiten wachsen die Funktionswerte über jede Grenze: f(xₙ) = n². Es gibt keinen Grenzwert; die Gerade x = 1 ist eine senkrechte Asymptote. Weil (x − 1) quadriert im Nenner steht, gehen beide Äste nach oben." },
  stetig: { f: (x) => x * x - 2 * x + 2, links: 1, rechts: 1, fx0: 1, ymin: 0, ymax: 3.5,
    formelL: (n) => `1 + ${bruch("1", `${n}²`)}`, formelR: (n) => `1 + ${bruch("1", `${n}²`)}`,
    text: "Von beiden Seiten streben die Werte gegen 1, und f(1) = 1. Grenzwert und Funktionswert stimmen überein — hier hätte man auch einfach einsetzen dürfen. Genau das wird in Abschnitt 4 „stetig“ heißen." },
};

// ∞ ist kein Grenzwert, nur ein uneigentlicher — so steht es auch in der Bilanz.
function grenzText(seite, g) {
  return g === Infinity ? `von ${seite}: kein Grenzwert, die Werte wachsen über jede Grenze (uneigentlich ∞)` : `${seite}seitiger Grenzwert ${num(g)}`;
}

function renderStelle() {
  const art = document.getElementById("ts-art").value;
  const def = TS[art];
  const n = regler("ts-n");
  setzeAnzeige("ts-n-anzeige", String(n));
  const K = koordinatenXY({ xmin: -0.5, xmax: 2.5, ymin: def.ymin, ymax: def.ymax });
  if (art === "pol") K.ebene.appendChild(svgEl("line", { x1: K.X(1).toFixed(2), x2: K.X(1).toFixed(2), y1: K.oben, y2: K.hoehe - K.unten, class: "fr-grenze", "data-rolle": "senkrechte-asymptote" }));
  graph(K, def.f, -0.5, 2.5, { schritte: 600 });
  if (art === "luecke") punkt(K, 1, 2, "fr-loch", { "data-rolle": "loch" });
  if (art === "sprung") { punkt(K, 1, -1, "fr-loch", { "data-rolle": "loch" }); punkt(K, 1, 1, "fr-loch", { "data-rolle": "loch" }); }
  if (art === "stetig") punkt(K, 1, 1, "fr-punkt aktiv", { "data-rolle": "funktionswert" });
  // Die Testfolgen: von links orange, von rechts blau; das aktuelle Glied größer.
  for (let k = 1; k <= n; k++) {
    for (const [seite, xk] of [["links", 1 - 1 / k], ["rechts", 1 + 1 / k]]) {
      const y = def.f(xk);
      if (!Number.isFinite(y) || y > def.ymax) continue;
      punkt(K, xk, y, `fr-test ${seite}${k === n ? " aktiv" : ""}`, { r: k === n ? 6 : 4, "data-seite": seite, "data-k": String(k), "data-x": String(xk), "data-wert": String(y) });
    }
  }
  zeige("ts-mount", K.svg);

  const tab = el("table", { class: "fr-tabelle" });
  tab.appendChild(el("tr", {}, [el("th", {}, "n"), el("th", {}, "xₙ links"), el("th", {}, "f(xₙ)"), el("th", {}, "xₙ rechts"), el("th", {}, "f(xₙ)")]));
  const von = Math.max(1, n - 4);
  for (let k = von; k <= n; k++) {
    const xl = 1 - 1 / k, xr = 1 + 1 / k;
    tab.appendChild(el("tr", {}, [el("th", {}, String(k)), el("td", {}, num(xl)), el("td", { class: "links", "data-k": String(k) }, num(def.f(xl))), el("td", {}, num(xr)), el("td", { class: "rechts", "data-k": String(k) }, num(def.f(xr)))]));
  }
  zeige("ts-tabelle", tab);
  const gleich = def.links === def.rechts && Number.isFinite(def.links);
  document.getElementById("ts-bilanz").innerHTML =
    `Von links: f(1 − ${bruch("1", n)}) = ${def.formelL(n)} &nbsp;→&nbsp; <span class="wb">${grenzText("links", def.links)}</span><br>` +
    `Von rechts: f(1 + ${bruch("1", n)}) = ${def.formelR(n)} &nbsp;→&nbsp; <span class="wc">${grenzText("rechts", def.rechts)}</span><br>` +
    (gleich ? `<span class="wa">lim<sub>x→1</sub> f(x) = ${num(def.links)}</span>${def.fx0 === null ? " — f(1) ist nicht definiert." : ` = f(1) — Grenzwert und Funktionswert stimmen überein.`}`
      : `<span class="wg">Kein Grenzwert an der Stelle 1</span>${def.links === Infinity ? " — die Werte wachsen über jede Grenze." : " — links und rechts verschieden."}`);
  document.getElementById("ts-text").textContent = def.text;
}

// ================= 3. Gebrochenrationale Funktionen für x → ±∞ =================

const RA = {
  a: { f: (x) => (2 * x + 3) / (x * x + 1), g: 0, ymin: -1.5, ymax: 3.5,
    umformung: `${bruch("2x + 3", "x² + 1")} = ${bruch("2/x + 3/x²", "1 + 1/x²")} → ${bruch("0 + 0", "1 + 0")} = 0`, art: "Zählergrad 1 &lt; Nennergrad 2" },
  b: { f: (x) => (3 * x * x - x) / (2 * x * x + 1), g: 1.5, ymin: -0.5, ymax: 2.5,
    umformung: `${bruch("3x² − x", "2x² + 1")} = ${bruch("3 − 1/x", "2 + 1/x²")} → ${bruch("3", "2")}`, art: "gleicher Grad 2: Quotient der Leitkoeffizienten" },
  c: { f: (x) => (4 - x * x) / (x * x + 2), g: -1, ymin: -1.5, ymax: 2.5,
    umformung: `${bruch("4 − x²", "x² + 2")} = ${bruch("4/x² − 1", "1 + 2/x²")} → ${bruch("−1", "1")} = −1`, art: "gleicher Grad 2: Quotient der Leitkoeffizienten" },
  d: { f: (x) => (x * x * x - 2) / (x * x + 4), g: null, ymin: -22, ymax: 22,
    umformung: `${bruch("x³ − 2", "x² + 4")} = ${bruch("x − 2/x²", "1 + 4/x²")}: Der Nenner strebt gegen 1, der Zähler wächst wie x`, art: "Zählergrad 3 &gt; Nennergrad 2: kein Grenzwert" },
};

function renderRational() {
  const art = document.getElementById("ra-art").value;
  const def = RA[art];
  const x = regler("ra-x");
  setzeAnzeige("ra-x-anzeige", num(x));
  const K = koordinatenXY({ xmin: -20, xmax: 20, ymin: def.ymin, ymax: def.ymax });
  if (def.g !== null) K.ebene.appendChild(svgEl("line", { x1: K.links, x2: K.breite - K.rechts, y1: K.Y(def.g).toFixed(2), y2: K.Y(def.g).toFixed(2), class: "fr-grenze", "data-rolle": "asymptote", "data-wert": String(def.g) }));
  graph(K, def.f, -20, 20, { schritte: 800 });
  const y = def.f(x);
  punkt(K, x, y, "fr-punkt aktiv", { "data-rolle": "aktuell", "data-x": String(x), "data-wert": String(y) });
  if (def.g !== null) {
    K.svg.appendChild(svgEl("line", { x1: K.X(x).toFixed(2), x2: K.X(x).toFixed(2), y1: K.Y(y).toFixed(2), y2: K.Y(def.g).toFixed(2), class: "fr-luecke", "data-rolle": "abstand" }));
    K.svg.appendChild(svgText(K.links + 6, K.Y(def.g) - 6, `y = ${num(def.g)}`, { class: "fr-grenze-text", "text-anchor": "start" }));
  }
  zeige("ra-mount", K.svg);
  const werte = [10, 100, 1000, -1000].map((v) => `f(${num(v)}) ${zeichen(def.f(v))} ${num(def.f(v))}`).join(" &nbsp;·&nbsp; ");
  document.getElementById("ra-bilanz").innerHTML =
    `${def.umformung}<br>${werte}<br>` +
    `An der Stelle x = ${num(x)}: f(x) ${zeichen(y)} ${num(y)}${def.g !== null ? `, Abstand zur Asymptote ${num(Math.abs(y - def.g))}` : ""}.`;
  document.getElementById("ra-text").innerHTML = def.g !== null
    ? `${def.art}. Für x → ∞ und für x → −∞ strebt f(x) gegen ${num(def.g)}: Je weiter du x nach außen schiebst, desto kürzer wird die rote Abstandslinie.`
    : `${def.art}. Für x → ∞ wächst f(x) über jede Grenze, für x → −∞ fällt es unter jede Grenze. Es gibt keine waagerechte Asymptote; für große |x| verhält sich f fast wie die Gerade y = x.`;
}

// ================= 4. Stetigkeit =================

// a · x + b ohne „1x“, „0x“ oder „+ −“.
function geradeText(a, b) {
  const ax = a === 0 ? "" : a === 1 ? "x" : a === -1 ? "−x" : `${num(a)}x`;
  if (!ax) return num(b);
  return b === 0 ? ax : `${ax} ${plusMinus(b)}`;
}

function renderStetigkeit() {
  const a = reglerRaster("st-a"), b = reglerRaster("st-b");
  setzeAnzeige("st-a-anzeige", num(a));
  setzeAnzeige("st-b-anzeige", num(b));
  const K = koordinatenXY({ xmin: -1.5, xmax: 3, ymin: -4, ymax: 6 });
  const rechts = a * 1 + b;
  const stetig = Math.abs(rechts - 1) < 1e-9;
  graph(K, (x) => x * x, -1.5, 1, { schritte: 200, rolle: "links" });
  graph(K, (x) => a * x + b, 1, 3, { schritte: 50, rolle: "rechts" });
  if (!stetig) {
    K.svg.appendChild(svgEl("line", { x1: K.X(1).toFixed(2), x2: K.X(1).toFixed(2), y1: K.Y(Math.max(-4, Math.min(6, 1))).toFixed(2), y2: K.Y(Math.max(-4, Math.min(6, rechts))).toFixed(2), class: "fr-sprung", "data-rolle": "sprung" }));
    punkt(K, 1, 1, "fr-loch", { "data-rolle": "loch" });
  }
  punkt(K, 1, rechts, "fr-punkt" + (stetig ? " drin" : " aktiv"), { "data-rolle": "funktionswert", "data-wert": String(rechts) });
  zeige("st-mount", K.svg);
  document.getElementById("st-bilanz").innerHTML =
    `linksseitiger Grenzwert: lim x² = <span class="wb">1</span> &nbsp;·&nbsp; rechtsseitiger Grenzwert: lim (${geradeText(a, b)}) = ${num(a)} · 1 ${plusMinus(b)} = <span class="wc">${num(rechts)}</span> &nbsp;·&nbsp; f(1) = <span class="wc">${num(rechts)}</span><br>` +
    (stetig ? `<span class="wa">Alle drei stimmen überein: f ist an der Stelle 1 stetig.</span>` : `<span class="wg">1 ≠ ${num(rechts)}: f springt bei x = 1 um ${num(rechts - 1)} und ist dort nicht stetig.</span>`);
  document.getElementById("st-text").textContent = stetig
    ? (Math.abs(a - 2) < 1e-9 ? "Stetig — und die Gerade setzt sogar ohne Knick an die Parabel an: Sie hat bei x = 1 dieselbe Richtung." : "Stetig: Kein Sprung mehr, die Gerade beginnt genau dort, wo die Parabel endet. An der Nahtstelle entsteht ein Knick — das stört die Stetigkeit nicht.")
    : `Der Graph springt: Links endet die Parabel bei y = 1 (offener Kreis, denn x = 1 gehört zur Geraden), rechts beginnt die Gerade bei y = ${num(rechts)}. Stetig wird es genau dann, wenn a + b = 1.`;
}

// ================= 5. Definitionslücken =================

function renderLuecken() {
  const a = reglerRaster("dl-a"), p = reglerRaster("dl-p");
  setzeAnzeige("dl-a-anzeige", num(a));
  setzeAnzeige("dl-p-anzeige", num(p));
  const f = (x) => (Math.abs(x - p) < 1e-12 ? NaN : ((x - a) * (x + 1)) / (x - p));
  const K = koordinatenXY({ xmin: -4, xmax: 4, ymin: -8, ymax: 8 });
  const zaehlerP = (p - a) * (p + 1);
  const hebbar = Math.abs(zaehlerP) < 1e-12;
  // Fortsetzungswert: den gemeinsamen Faktor kürzen — bei p = a bleibt x + 1, bei p = −1 bleibt x − a.
  const fortsetzung = hebbar ? (Math.abs(p - a) < 1e-12 ? p + 1 : p - a) : null;
  if (!hebbar) K.ebene.appendChild(svgEl("line", { x1: K.X(p).toFixed(2), x2: K.X(p).toFixed(2), y1: K.oben, y2: K.hoehe - K.unten, class: "fr-grenze", "data-rolle": "senkrechte-asymptote", "data-wert": String(p) }));
  // Links und rechts der Lücke getrennt zeichnen, damit kein Strich die Polstelle überbrückt.
  graph(K, f, -4, p - 1e-6, { schritte: 400, rolle: "ast-links" });
  graph(K, f, p + 1e-6, 4, { schritte: 400, rolle: "ast-rechts" });
  if (hebbar) punkt(K, p, fortsetzung, "fr-loch", { "data-rolle": "loch", "data-wert": String(fortsetzung) });
  zeige("dl-mount", K.svg);
  const links = f(p - 1e-6), rechts = f(p + 1e-6);
  document.getElementById("dl-bilanz").innerHTML =
    `Nenner = 0 bei x = ${num(p)}. Zähler dort: (${num(p)} − ${numK(a)}) · (${num(p)} + 1) = <span class="${hebbar ? "wa" : "wg"}">${num(zaehlerP)}</span><br>` +
    (hebbar
      ? `Zähler und Nenner sind beide 0 → Faktor (x − ${numK(p)}) kürzen: f(x) = ${Math.abs(p - a) < 1e-12 ? "x + 1" : `x ${plusMinus(-a)}`} für x ≠ ${num(p)}. <span class="wa">Hebbare Lücke, stetige Fortsetzung f(${num(p)}) = ${num(fortsetzung)}</span>`
      : `Zähler ≠ 0 → <span class="wg">Polstelle</span>: links von ${num(p)} strebt f(x) gegen ${links > 0 ? "+∞" : "−∞"}, rechts gegen ${rechts > 0 ? "+∞" : "−∞"} — ein Vorzeichenwechsel.`);
  document.getElementById("dl-text").textContent = hebbar
    ? `Zähler- und Nennernullstelle fallen zusammen: Der Graph ist eine Gerade mit einem einzigen fehlenden Punkt bei (${num(p)} | ${num(fortsetzung)}). Setzt man diesen Wert ein, wird f stetig.`
    : `Die Nennernullstelle ${num(p)} ist keine Zählernullstelle: Der Graph schmiegt sich von beiden Seiten an die senkrechte Asymptote x = ${num(p)}. Schiebe a oder p so, dass sie zusammenfallen — dann wird aus dem Pol ein Loch.`;
}

// ================= 6. Zwischenwertsatz und Intervallhalbierung =================

const ZW = {
  stetig: { f: (x) => x * x * x - 2 * x - 5, ymin: -4, ymax: 17, name: "f" },
  sprung: { f: (x) => (x < 2.5 ? -1 : 1), ymin: -2, ymax: 2, name: "g" },
};
function halbieren(f, a, b, k) {
  const schritte = [{ a, b }];
  for (let i = 0; i < k; i++) {
    const m = (a + b) / 2;
    if (f(a) * f(m) <= 0 && f(m) !== 0) b = m; else if (f(m) === 0) { a = m; b = m; } else a = m;
    schritte.push({ a, b, m });
  }
  return schritte;
}

function renderZwischenwert() {
  const art = document.getElementById("zw-art").value;
  const def = ZW[art];
  const k = regler("zw-k");
  setzeAnzeige("zw-k-anzeige", String(k));
  const K = koordinatenXY({ xmin: 1.8, xmax: 3.2, ymin: def.ymin, ymax: def.ymax, hoehe: 300 });
  if (art === "sprung") {
    graph(K, def.f, 1.8, 2.5 - 1e-9, { schritte: 50 });
    graph(K, def.f, 2.5, 3.2, { schritte: 50 });
    punkt(K, 2.5, -1, "fr-loch");
    punkt(K, 2.5, 1, "fr-punkt");
  } else {
    graph(K, def.f, 1.8, 3.2, { schritte: 300 });
  }
  const schritte = halbieren(def.f, 2, 3, k);
  const letzte = schritte[schritte.length - 1];
  // Das aktuelle Intervall als Balken auf der x-Achse, die Grenzen mit ihren Funktionswerten.
  K.svg.appendChild(svgEl("line", { x1: K.X(letzte.a).toFixed(2), x2: K.X(letzte.b).toFixed(2), y1: K.Y(0).toFixed(2), y2: K.Y(0).toFixed(2), class: "fr-intervall", "data-rolle": "intervall", "data-a": String(letzte.a), "data-b": String(letzte.b) }));
  for (const x of [letzte.a, letzte.b]) {
    K.svg.appendChild(svgEl("line", { x1: K.X(x).toFixed(2), x2: K.X(x).toFixed(2), y1: K.Y(0).toFixed(2), y2: K.Y(Math.max(def.ymin, Math.min(def.ymax, def.f(x)))).toFixed(2), class: "fr-gitter-stark" }));
  }
  zeige("zw-mount", K.svg);
  const tab = el("table", { class: "fr-tabelle" });
  tab.appendChild(el("tr", {}, [el("th", {}, "Schritt"), el("th", {}, "a"), el("th", {}, "b"), el("th", {}, "Mitte m"), el("th", {}, `${def.name}(m)`)]));
  schritte.slice(1).slice(-6).forEach((s, i, alle) => {
    const nr = schritte.length - 1 - (alle.length - 1 - i);
    tab.appendChild(el("tr", {}, [el("th", {}, String(nr)), el("td", {}, num(s.a, 5)), el("td", {}, num(s.b, 5)), el("td", {}, num(s.m, 5)), el("td", { class: def.f(s.m) > 0 ? "" : "draussen" }, `${num(def.f(s.m), 3)} ${def.f(s.m) > 0 ? ">" : "<"} 0`)]));
  });
  zeige("zw-tabelle", tab);
  const laenge = letzte.b - letzte.a;
  document.getElementById("zw-bilanz").innerHTML =
    `${def.name}(2) = ${num(def.f(2))} &lt; 0, ${def.name}(3) = ${num(def.f(3))} &gt; 0 — Vorzeichenwechsel.<br>` +
    `Nach ${k} Schritt${k === 1 ? "" : "en"}: Intervall [${num(letzte.a, 5)}; ${num(letzte.b, 5)}], Länge 1 : 2${k ? "<sup>" + k + "</sup>" : "⁰"} = <span class="wa">${num(laenge, 6)}</span>`;
  document.getElementById("zw-text").textContent = art === "stetig"
    ? `f ist stetig, also liegt nach dem Nullstellensatz in jedem Intervall mit Vorzeichenwechsel eine Nullstelle. Die Intervalle schrumpfen auf sie zu: x ≈ ${num((letzte.a + letzte.b) / 2, 4)}.`
    : "g hat einen Vorzeichenwechsel, aber keine Nullstelle — g ist nirgends 0. Die Intervalle schrumpfen trotzdem, und zwar auf die Sprungstelle 2,5 zu. Ohne Stetigkeit gilt der Nullstellensatz nicht.";
}

// ================= 7. Stolperstelle: Ist 1/x stetig? =================

function renderStolperstelle() {
  const x0 = reglerRaster("sp-x");
  setzeAnzeige("sp-x-anzeige", num(x0));
  const K = koordinatenXY({ xmin: -3, xmax: 3, ymin: -5, ymax: 5 });
  graph(K, (x) => 1 / x, -3, -0.01, { schritte: 300, rolle: "ast-links" });
  graph(K, (x) => 1 / x, 0.01, 3, { schritte: 300, rolle: "ast-rechts" });
  K.svg.appendChild(svgEl("line", { x1: K.X(x0).toFixed(2), x2: K.X(x0).toFixed(2), y1: K.oben, y2: K.hoehe - K.unten, class: "fr-x0", "data-rolle": "x0", "data-wert": String(x0) }));
  if (x0 !== 0) punkt(K, x0, 1 / x0, "fr-punkt drin", { "data-rolle": "funktionswert", "data-wert": String(1 / x0) });
  zeige("sp-mount", K.svg);
  if (x0 === 0) {
    document.getElementById("sp-bilanz").innerHTML = `x₀ = 0: <span class="wg">0 gehört nicht zur Definitionsmenge</span> D = ℝ \\ {0}. Dort ist f weder stetig noch unstetig — die Frage stellt sich nicht.`;
    document.getElementById("sp-text").textContent = "Ben schaut auf die Stelle 0. Aber Stetigkeit ist nur für Stellen der Definitionsmenge erklärt — und 0 gehört nicht dazu. Prüfe eine andere Stelle.";
    return;
  }
  const w = 1 / x0;
  document.getElementById("sp-bilanz").innerHTML =
    `x₀ = ${num(x0)} ∈ D. Links: lim 1/x = ${num(w)}, rechts: lim 1/x = ${num(w)}, f(${num(x0)}) = ${num(w)} — <span class="wa">stetig an der Stelle ${num(x0)}</span>.`;
  document.getElementById("sp-text").textContent = `An x₀ = ${num(x0)} passt alles zusammen — und das gilt für jede Stelle x₀ ≠ 0, weil 1/x dort ein Quotient stetiger Funktionen mit Nenner ≠ 0 ist. Also hat Lea recht: f ist eine stetige Funktion.`;
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
  "quiz-unendlich": {
    q: "Für f(x) = (2x + 1)/x und ε = 0,05: Ab welcher Stelle x₀ liegt der Graph im ε-Streifen um 2?",
    options: ["ab x₀ = 5", "ab x₀ = 0,05", "ab x₀ = 20", "Der Graph bleibt nie im Streifen."],
    correct: 2,
    explain: "|f(x) − 2| = 1/x &lt; 0,05 ⟺ x &gt; 20. Je kleiner ε, desto weiter rechts liegt x₀ — aber es gibt immer eins, deshalb ist 2 der Grenzwert und y = 2 die waagerechte Asymptote.",
  },
  "quiz-stelle": {
    q: "Für f(x) = |x − 1|/(x − 1) liefern die Testfolgen von links −1 und von rechts 1. Was folgt?",
    options: [
      "Der Grenzwert an der Stelle 1 ist 0, der Mittelwert.",
      "Es gibt keinen Grenzwert an der Stelle 1; die beiden einseitigen Grenzwerte sind verschieden.",
      "Der Grenzwert ist 1, weil die rechte Seite zählt.",
      "Man muss nur f(1) ausrechnen.",
    ],
    correct: 1,
    explain: "Ein Grenzwert verlangt, dass f(xₙ) für <em>jede</em> Testfolge gegen dieselbe Zahl geht. Hier liefern links und rechts verschiedene Werte, also existiert er nicht. f(1) hilft gar nicht — f ist an der Stelle 1 nicht einmal definiert.",
  },
  "quiz-rational": {
    q: "Welche waagerechte Asymptote hat f(x) = (6x² − 5)/(3x² + 2x)?",
    options: ["y = 2", "y = 0", "y = −5/2", "keine, weil der Nenner auch wächst"],
    correct: 0,
    explain: "Gleicher Grad: Durch x² geteilt bleibt (6 − 5/x²)/(3 + 2/x), und das strebt gegen 6/3 = 2. −5/2 entstünde aus den Absolutgliedern — die verschwinden für großes x im Vergleich zu den Quadraten.",
  },
  "quiz-stetigkeit": {
    q: "f(x) = x² für x &lt; 2 und f(x) = 3x + b für x ≥ 2. Für welches b ist f stetig?",
    options: ["b = 4", "b = 2", "b = 10", "b = −2"],
    correct: 3,
    explain: "Links strebt x² gegen 4, rechts ist der Grenzwert 3 · 2 + b = 6 + b, und f(2) = 6 + b. Stetig genau dann, wenn 6 + b = 4, also b = −2. Mit b = 4 wäre f(2) = 10 — ein Sprung um 6.",
  },
  "quiz-luecken": {
    q: "f(x) = (x² − 9)/(x − 3). Was liegt bei x = 3 vor?",
    options: [
      "Eine Polstelle mit Vorzeichenwechsel.",
      "Eine Nullstelle von f.",
      "Eine hebbare Lücke; die stetige Fortsetzung hat dort den Wert 6.",
      "Eine hebbare Lücke mit dem Wert 0, weil der Zähler 0 ist.",
    ],
    correct: 2,
    explain: "Zähler und Nenner sind bei 3 beide 0: x² − 9 = (x − 3)(x + 3), gekürzt bleibt x + 3, also 6 an der Stelle 3. „Zähler 0“ allein heißt nicht Funktionswert 0 — erst nach dem Kürzen sieht man, was übrig bleibt.",
  },
  "quiz-zwischenwert": {
    q: "f ist auf [0; 1] stetig, f(0) = −2 und f(1) = 3. Welche Aussage ist sicher richtig?",
    options: [
      "f hat genau eine Nullstelle in (0; 1).",
      "f(0,5) = 0,5.",
      "f ist monoton steigend.",
      "f nimmt in (0; 1) mindestens einmal jeden Wert zwischen −2 und 3 an, also auch 0.",
    ],
    correct: 3,
    explain: "Der Zwischenwertsatz garantiert mindestens eine Stelle für jeden Zwischenwert — nicht genau eine. f könnte mehrmals auf und ab gehen und dabei mehrere Nullstellen haben. Über f(0,5) und die Monotonie sagt der Satz nichts.",
  },
  "quiz-stolperstelle": {
    q: "Ist f(x) = 1/x eine stetige Funktion?",
    options: [
      "Ja: An jeder Stelle ihrer Definitionsmenge ℝ \\ {0} stimmen Grenzwert und Funktionswert überein.",
      "Nein, weil der Graph bei 0 springt.",
      "Nein, weil man den Graphen nicht ohne Absetzen zeichnen kann.",
      "Nur für x &gt; 0.",
    ],
    correct: 0,
    explain: "Stetigkeit ist für Stellen der Definitionsmenge erklärt. 0 gehört nicht dazu, also stellt sich dort die Frage nicht. An jeder anderen Stelle ist 1/x stetig. „Ohne Absetzen zeichnen“ ist nur eine Faustregel für Funktionen auf einem Intervall.",
  },
};

// ================= Selbsteinschätzung =================
//
// Die Auswahl liegt nur im Browser dieser Person — eine Lernhilfe, keine Leistungsmessung.
const SE_PUNKTE = [
  ["sec-unendlich", "Ich kann lim f(x) für x → ∞ mit dem ε-Streifen erklären und eine waagerechte Asymptote angeben."],
  ["sec-stelle", "Ich kann mit Testfolgen oder der h-Methode den Grenzwert an einer Stelle bestimmen — auch einseitig."],
  ["sec-rational", "Ich kann Grenzwerte gebrochenrationaler Funktionen für x → ±∞ über die Grade bestimmen."],
  ["sec-stetigkeit", "Ich kann prüfen, ob eine Funktion an einer Stelle stetig ist, und Parameter dafür bestimmen."],
  ["sec-luecken", "Ich kann hebbare Lücken und Polstellen unterscheiden und eine stetige Fortsetzung angeben."],
  ["sec-zwischenwert", "Ich kann mit dem Zwischenwertsatz eine Nullstelle begründen und sie durch Halbieren einschachteln."],
  ["sec-stolperstelle", "Ich weiß, dass Stetigkeit nur an Stellen der Definitionsmenge gefragt wird."],
];
const SE_SCHLUESSEL = "uplant-mss11-grenzwerte-selbsteinschaetzung";

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
  [["gu-art", "gu-e"], renderUnendlich],
  [["ts-art", "ts-n"], renderStelle],
  [["ra-art", "ra-x"], renderRational],
  [["st-a", "st-b"], renderStetigkeit],
  [["dl-a", "dl-p"], renderLuecken],
  [["zw-art", "zw-k"], renderZwischenwert],
  [["sp-x"], renderStolperstelle],
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
