// Selbstlernpfad "Potenzen" (Grundwissen Klasse 5-10, Kapitel 4).
// Rein clientseitiges Vanilla-JS.
//
// Leitgedanke: Der Exponent zählt Faktoren. Abschnitt 1 baut den Begriff aus
// dem Produkt gleicher Faktoren auf und stellt ihn dem Vielfachen gegenüber,
// Abschnitt 2 gewinnt die fünf Potenzgesetze durch Abzählen genau dieser
// Faktoren, Abschnitt 3 erweitert den Exponenten nach dem Permanenzprinzip auf
// 0 und negative Zahlen, Abschnitt 4 nutzt das für Zehnerpotenzen und
// Größenordnungen, Abschnitt 5 lässt statt des Exponenten die Basis laufen und
// Abschnitt 6 kehrt das Potenzieren mit der n-ten Wurzel um.
//
// Durchgehende Farbcodierung: Basis blau, Exponent violett, Potenzwert grün,
// Zehnerpotenzen orange, Warnungen rot.

"use strict";

import { mountUebungsaufgaben as mountUebungsaufgabenBasis } from "../../../aufgaben.js?v=1";

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
function num(x, digits = 4) {
  // JavaScript kennt eine negative Null: (−4) · 0 ergibt −0, und die würde als
  // "−0" angezeigt — mitten in einer Rechnung stünde dann "4 − −0".
  const z = x === 0 ? 0 : x;
  return z.toLocaleString("de-DE", { maximumFractionDigits: digits }).replace("-", "−");
}
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function parseFlexibleNumber(raw) {
  if (raw == null) return NaN;
  const s = String(raw).trim().replace(/\s/g, "").replace(/−/g, "-").replace(/\./g, "").replace(",", ".");
  return parseFloat(s);
}
function neueFlaeche(w, h) {
  return svgEl("svg", { viewBox: `0 0 ${w} ${h}`, width: w, height: h, class: "geo-svg", preserveAspectRatio: "xMidYMid meet" });
}
function karte(klasse, name, inhalt) {
  return el("div", { class: "pt-karte " + klasse }, [
    el("span", { class: "name" }, name),
    el("span", { class: "wert", html: inhalt }),
  ]);
}
// Negative Zahlen bekommen in einer Rechnung eine Klammer — "3 − −5" ist keine
// Schreibweise, die man einem Kind zumutet.
function klammer(x, stellen = 4) {
  return x < 0 ? `(${num(x, stellen)})` : num(x, stellen);
}
// Ist der angezeigte Wert bei dieser Stellenzahl exakt, steht dort "=", sonst "≈".
function zeichen(x, stellen) {
  return Math.abs(Number(x.toFixed(stellen)) - x) < 1e-12 ? "=" : "≈";
}
// Für Kennzahlenkarten: dort steht die Zahl allein, ein "=" davor wäre sinnlos —
// nur eine Rundung muss angekündigt werden.
function mitZeichen(x, stellen) {
  return (zeichen(x, stellen) === "≈" ? "≈ " : "") + num(x, stellen);
}
// Ganzzahlige Potenz ohne Rundungsfehler: Math.pow rechnet über Logarithmen und
// liefert für 5^3 schon einmal 124,99999999999999.
function potenz(a, n) {
  if (n < 0) return 1 / potenz(a, -n);
  let w = 1;
  for (let k = 0; k < n; k++) w *= a;
  return w;
}
function schrittZeile(inhaltHtml, grundHtml, klasse = "", kommentar = "") {
  return `<div class="zeile ${klasse}">` +
    `<span class="gl">${inhaltHtml}</span>` +
    (grundHtml ? `<span class="grund">${grundHtml}</span>` : "") +
    (kommentar ? `<span class="kommentar">${kommentar}</span>` : "") +
    `</div>`;
}

// ---------- Schreibweise der Potenzen ----------

// In HTML steht der Exponent in <sup>, in SVG als Unicode-Hochzahl: dort gibt es
// kein <sup>, und zwei verschobene <tspan> wären für Vorlesewerkzeuge schlechter.
const HOCHZIFFERN = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "-": "⁻", "−": "⁻" };
const ORDNUNG = { 1: "erste", 2: "zweite", 3: "dritte", 4: "vierte", 5: "fünfte", 6: "sechste" };
function ordnung(n) {
  return ORDNUNG[n] || `${n}-te`;
}
function hochU(n) {
  return String(n).split("").map((c) => HOCHZIFFERN[c] || c).join("");
}
// "2³" mit Farben; die Basis wird als fertiger Text übergeben, damit der Aufrufer
// über die Klammer bei negativen Basen entscheiden kann.
function potHtml(basis, exp, kb = "bv", ke = "ev") {
  return `<span class="nw"><span class="${kb}">${basis}</span><sup class="${ke}">${exp}</sup></span>`;
}
function potRein(basis, exp) {
  return `<span class="nw">${basis}<sup>${exp}</sup></span>`;
}
function potSvg(basis, exp) {
  return `${basis}${hochU(exp)}`;
}
// "a · a · a" — die Faktorenkette, aus der die Potenz entstanden ist.
function kette(basisText, n) {
  if (n === 0) return "(kein Faktor)";
  return new Array(n).fill(basisText).join(" · ");
}
// 1 : 16 als Bruch in Anzeigegröße
function bruchHtml(obenHtml, untenHtml) {
  return `<span class="pt-bruch"><span class="oben">${obenHtml}</span><span class="unten">${untenHtml}</span></span>`;
}

// ---------- Koordinatensystem ----------

function koordinaten(svg, opt) {
  const {
    links, oben, breite, hoehe, xMin, xMax, yMin, yMax,
    xSchritt = 1, ySchritt = 2, xBeschriftung = xSchritt * 2, yBeschriftung = ySchritt,
  } = opt;
  const px = (x) => links + ((x - xMin) / (xMax - xMin)) * breite;
  const py = (y) => oben + hoehe - ((y - yMin) / (yMax - yMin)) * hoehe;
  const glatt = (w, s) => Math.abs(w - Math.round(w / s) * s) < 1e-9;

  for (let x = Math.ceil(xMin / xSchritt) * xSchritt; x <= xMax + 1e-9; x += xSchritt) {
    svg.appendChild(svgEl("line", { x1: px(x).toFixed(2), y1: py(yMax).toFixed(2), x2: px(x).toFixed(2), y2: py(yMin).toFixed(2), class: "pt-gitter" }));
    if (Math.abs(x) > 1e-9 && glatt(x, xBeschriftung)) svg.appendChild(svgText(px(x), py(0) + 14, num(x), { class: "pt-achsentext" }));
  }
  for (let y = Math.ceil(yMin / ySchritt) * ySchritt; y <= yMax + 1e-9; y += ySchritt) {
    svg.appendChild(svgEl("line", { x1: px(xMin).toFixed(2), y1: py(y).toFixed(2), x2: px(xMax).toFixed(2), y2: py(y).toFixed(2), class: "pt-gitter" }));
    if (Math.abs(y) > 1e-9 && glatt(y, yBeschriftung)) svg.appendChild(svgText(px(0) - 7, py(y) + 4, num(y), { class: "pt-achsentext", "text-anchor": "end" }));
  }
  svg.appendChild(svgEl("line", { x1: px(xMin).toFixed(2), y1: py(0).toFixed(2), x2: (px(xMax) + 12).toFixed(2), y2: py(0).toFixed(2), class: "pt-achse" }));
  svg.appendChild(svgEl("line", { x1: px(0).toFixed(2), y1: py(yMin).toFixed(2), x2: px(0).toFixed(2), y2: (py(yMax) - 12).toFixed(2), class: "pt-achse" }));
  svg.appendChild(svgText(px(0) - 7, py(0) + 14, "0", { class: "pt-achsentext", "text-anchor": "end" }));
  svg.appendChild(svgText(px(xMax) + 12, py(0) + 20, "x", { class: "pt-achsenname", "text-anchor": "end" }));
  svg.appendChild(svgText(px(0) + 9, py(yMax) + 10, "y", { class: "pt-achsenname", "text-anchor": "start" }));
  return { px, py };
}

// Zeichnet eine Kurve, am Fenster abgeschnitten. Verlässt sie den Ausschnitt und
// kommt zurück, entsteht ein neuer Teilzug — sonst zöge eine gerade Linie quer
// durchs Bild, die es gar nicht gibt.
function kurveZeichnen(svg, g, f, xMin, xMax, yMin, yMax, klasse, schritte = 320) {
  let d = "", offen = false;
  for (let i = 0; i <= schritte; i++) {
    const x = xMin + (i / schritte) * (xMax - xMin);
    const y = f(x);
    if (!isFinite(y) || y < yMin || y > yMax) { offen = false; continue; }
    d += `${offen ? " L " : " M "}${g.px(x).toFixed(2)} ${g.py(y).toFixed(2)}`;
    offen = true;
  }
  if (d) svg.appendChild(svgEl("path", { d: d.trim(), class: "pt-kurve " + klasse }));
}

function punktZeichnen(svg, g, x, y, klasse, beschriftung, rechts = true, oben = true) {
  svg.appendChild(svgEl("circle", { cx: g.px(x).toFixed(2), cy: g.py(y).toFixed(2), r: 5, class: "pt-punkt " + klasse }));
  if (beschriftung) {
    svg.appendChild(svgText(g.px(x) + (rechts ? 9 : -9), g.py(y) + (oben ? -9 : 17), beschriftung, {
      class: "pt-punkttext " + klasse, "text-anchor": rechts ? "start" : "end",
    }));
  }
}

// ---------- Quiz-Komponente ----------

function mountQuiz(container, { q, options, correct, explain }) {
  container.innerHTML = "";
  container.appendChild(el("p", { class: "quiz-q", html: "❓ " + q }));
  const optWrap = el("div", { class: "quiz-options" });
  const feedback = el("div", { class: "quiz-feedback" });
  options.forEach((optText, i) => {
    const btn = el("button", { type: "button", class: "quiz-opt", html: optText });
    btn.addEventListener("click", () => {
      [...optWrap.children].forEach((b) => b.classList.remove("correct", "wrong"));
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

// ---------- Schrittweise Protokolle ----------

function mountProtokoll(ids, baue) {
  const schritteEl = document.getElementById(ids.schritte);
  const bilanzEl = document.getElementById(ids.bilanz);
  const gleichungEl = ids.gleichung ? document.getElementById(ids.gleichung) : null;
  const mountEl = ids.mount ? document.getElementById(ids.mount) : null;
  let daten = null, gezeigt = 1;

  function zeichne() {
    schritteEl.innerHTML = daten.schritte.slice(0, gezeigt).join("");
    if (gleichungEl) gleichungEl.innerHTML = daten.gleichungHtml;
    if (mountEl) {
      mountEl.innerHTML = "";
      if (daten.bild) mountEl.appendChild(daten.bild());
    }
    const offen = daten.schritte.length - gezeigt;
    bilanzEl.innerHTML = offen === 0 ? daten.bilanz
      : `<em>Noch ${offen} Schritt${offen === 1 ? "" : "e"} bis zum Ergebnis — auf „Schritt weiter“ klicken.</em>`;
    document.getElementById(ids.schritt).disabled = offen === 0;
  }
  function neu() { daten = baue(); gezeigt = 1; zeichne(); }
  document.getElementById(ids.neu).addEventListener("click", neu);
  document.getElementById(ids.schritt).addEventListener("click", () => {
    if (gezeigt < daten.schritte.length) { gezeigt++; zeichne(); }
  });
  document.getElementById(ids.alle).addEventListener("click", () => { gezeigt = daten.schritte.length; zeichne(); });
  return { neu };
}

// ================= 1. Was eine Potenz ist =================

// Säulenbild: die Potenz aᵏ gegen das Vielfache a · k. Beide Reihen stehen in
// derselben Skala — nur so ist zu sehen, wie schnell die Potenz davonzieht.
function bgBild(a, n) {
  const B = 470, H = 300;
  const svg = neueFlaeche(B, H);
  const links = 54, oben = 34, breite = 380, hoehe = 206;
  svg.appendChild(svgText(B / 2, 16, "Potenz gegen Vielfaches — dieselbe Skala für beide", { class: "pt-titel" }));

  const potWerte = [], vielWerte = [];
  for (let k = 1; k <= n; k++) { potWerte.push(potenz(a, k)); vielWerte.push(a * k); }
  const alle = potWerte.concat(vielWerte);
  let yMax = Math.max(0, ...alle), yMin = Math.min(0, ...alle);
  if (yMax - yMin < 1) { yMax = 1; yMin = Math.min(0, yMin); }   // a = 0: sonst teilt man durch 0
  const py = (w) => oben + hoehe - ((w - yMin) / (yMax - yMin)) * hoehe;

  // Nulllinie
  svg.appendChild(svgEl("line", { x1: links - 6, y1: py(0).toFixed(2), x2: (links + breite + 6).toFixed(2), y2: py(0).toFixed(2), class: "pt-achse" }));
  svg.appendChild(svgText(links - 10, py(0) + 4, "0", { class: "pt-achsentext", "text-anchor": "end" }));

  const gruppe = breite / n;
  const saeule = Math.min(26, gruppe * 0.30);
  for (let k = 1; k <= n; k++) {
    const mitte = links + (k - 0.5) * gruppe;
    const paare = [
      { wert: potWerte[k - 1], x: mitte - saeule - 3, klasse: "potenz" },
      { wert: vielWerte[k - 1], x: mitte + 3, klasse: "vielfach" },
    ];
    const kopf = [];
    paare.forEach((p) => {
      const y0 = py(0), y1 = py(p.wert);
      svg.appendChild(svgEl("rect", {
        x: p.x.toFixed(2), y: Math.min(y0, y1).toFixed(2),
        width: saeule.toFixed(2), height: Math.max(1.5, Math.abs(y1 - y0)).toFixed(2),
        class: "pt-saeule " + p.klasse,
      }));
      kopf.push({ x: p.x + saeule / 2, y: p.wert >= 0 ? y1 - 5 : y1 + 12, wert: p.wert, klasse: p.klasse });
    });
    // Stehen beide Zahlen fast gleich hoch, rutscht die zweite nach unten weg.
    if (Math.abs(kopf[0].y - kopf[1].y) < 11) kopf[1].y = kopf[0].y - 12;
    kopf.forEach((t) => svg.appendChild(svgText(t.x, t.y, num(t.wert), { class: "pt-saeulentext " + t.klasse })));
    svg.appendChild(svgText(mitte, oben + hoehe + 20, "k = " + k, { class: "pt-achsentext" }));
  }

  // Legende
  svg.appendChild(svgEl("rect", { x: links, y: H - 22, width: 12, height: 12, class: "pt-saeule potenz" }));
  svg.appendChild(svgText(links + 18, H - 12, `${num(a)} hoch k (Potenz)`, { class: "pt-saeulentext potenz", "text-anchor": "start" }));
  svg.appendChild(svgEl("rect", { x: links + 150, y: H - 22, width: 12, height: 12, class: "pt-saeule vielfach" }));
  svg.appendChild(svgText(links + 168, H - 12, `${num(a)} · k (Vielfaches)`, { class: "pt-saeulentext vielfach", "text-anchor": "start" }));
  return svg;
}

function renderBegriff() {
  const a = Number(document.getElementById("bg-a").value);
  const n = Number(document.getElementById("bg-n").value);
  document.getElementById("bg-a-anzeige").textContent = num(a);
  document.getElementById("bg-n-anzeige").textContent = num(n);
  const wert = potenz(a, n);
  const basisText = klammer(a);

  document.getElementById("bg-gleichung").innerHTML =
    `${potHtml(basisText, n)} = ${kette(basisText, n)} = <span class="wv">${num(wert)}</span>`;

  const mount = document.getElementById("bg-mount");
  mount.innerHTML = "";
  mount.appendChild(bgBild(a, n));

  const ks = [1, 2, 3, 4, 5];
  const zeileK = ks.map((k) => `<td class="n${k === n ? " aktiv" : ""}">${num(k)}</td>`).join("");
  const zeileP = ks.map((k) => `<td class="w${k === n ? " aktiv" : ""}">${num(potenz(a, k))}</td>`).join("");
  const zeileV = ks.map((k) => `<td${k === n ? ' class="aktiv"' : ""}>${num(a * k)}</td>`).join("");
  document.getElementById("bg-tabelle").innerHTML =
    `<caption>Die markierte Spalte gehört zum Regler</caption>` +
    `<tr><th>Exponent k</th>${zeileK}</tr>` +
    `<tr><th>${potRein(basisText, "k")}</th>${zeileP}</tr>` +
    `<tr><th>${num(a)} · k</th>${zeileV}</tr>`;

  const karten = document.getElementById("bg-karten");
  karten.innerHTML = "";
  karten.appendChild(karte("b", "Basis a", num(a)));
  karten.appendChild(karte("e", "Exponent n", num(n)));
  karten.appendChild(karte("w", "Potenzwert aⁿ", num(wert)));
  karten.appendChild(karte("z", "Vielfaches a · n", num(a * n)));

  const vielfaches = a * n;
  document.getElementById("bg-bilanz").innerHTML =
    `<span class="wb">${potRein(basisText, n)}</span> = ${kette(basisText, n)} = <span class="ww">${num(wert)}</span> — ` +
    `<strong>${num(n)}</strong> Faktoren und darum nur <strong>${num(n - 1)}</strong> Malpunkte.<br>` +
    `Zum Vergleich das Vielfache: <span class="wz">${num(a)} · ${num(n)} = ${num(vielfaches)}</span>. ` +
    (wert === vielfaches
      ? `Hier stimmen beide zufällig überein; das ist ein Sonderfall und keine Regel.`
      : Math.abs(wert) === Math.abs(vielfaches)
        ? `Gleich groß, aber mit verschiedenem Vorzeichen — schon daran sieht man, dass es zwei verschiedene Rechnungen sind.`
        : `Die Potenz ist dem Betrag nach ${Math.abs(wert) > Math.abs(vielfaches) ? "größer" : "kleiner"} — ` +
          `und vor allem etwas ganz anderes als ein Vielfaches.`) +
    (a < 0
      ? `<br>Achte auf die Klammer: <span class="ww">${potRein("(" + num(a) + ")", n)} = ${num(wert)}</span>, ` +
        `aber <span class="wr">${potRein(num(Math.abs(a)), n)} mit Minus davor = ${num(-potenz(Math.abs(a), n))}</span>.`
      : "");

  const text = document.getElementById("bg-text");
  if (a < 0 && n % 2 === 0) {
    text.innerHTML = `<span class="pt-urteil ja">${potRein(basisText, n)} = ${num(wert)} ist positiv</span> ` +
      `Der Exponent ist gerade, die ${num(n)} Minuszeichen heben sich paarweise auf.`;
  } else if (a < 0) {
    text.innerHTML = `<span class="pt-urteil nein">${potRein(basisText, n)} = ${num(wert)} ist negativ</span> ` +
      `Der Exponent ist ungerade, ein Minuszeichen bleibt ohne Partner übrig.`;
  } else if (a === 0) {
    text.innerHTML = `<span class="pt-urteil eins">0ⁿ = 0 für jedes n ≥ 1</span> ` +
      `Sobald ein Faktor 0 ist, ist das ganze Produkt 0. Nur 0⁰ bleibt undefiniert — dazu mehr in Abschnitt 3.`;
  } else {
    text.innerHTML = `<span class="pt-urteil ja">${potRein(basisText, n)} = ${num(wert)} ist positiv</span> ` +
      `Bei positiver Basis sind alle Faktoren positiv, also auch das Produkt — ganz gleich, wie der Exponent aussieht.`;
  }
}

function initBegriff() {
  document.getElementById("bg-a").addEventListener("input", renderBegriff);
  document.getElementById("bg-n").addEventListener("input", renderBegriff);
  renderBegriff();
}

// ================= 2. Die Potenzgesetze =================

const GESETZE = [
  { nr: 1, kurz: "aᵐ · aⁿ", name: "Gleiche Basis mal" },
  { nr: 2, kurz: "aᵐ : aⁿ", name: "Gleiche Basis geteilt" },
  { nr: 3, kurz: "(aᵐ)ⁿ", name: "Potenz einer Potenz" },
  { nr: 4, kurz: "aⁿ · bⁿ", name: "Gleicher Exponent mal" },
  { nr: 5, kurz: "aⁿ : bⁿ", name: "Gleicher Exponent geteilt" },
];
let gzGesetz = 1;

// Ein Kästchen je Faktor, mit der Zahl darin. Das Abzählen der Kästchen ist der
// ganze Beweis der Potenzgesetze.
function kaestchenReihe(svg, x0, y, zahlen, klassen) {
  const b = 26, h = 22, luecke = 4;
  zahlen.forEach((z, i) => {
    const x = x0 + i * (b + luecke);
    svg.appendChild(svgEl("rect", { x: x.toFixed(2), y: y.toFixed(2), width: b, height: h, rx: 4, class: "pt-faktor " + klassen[i] }));
    svg.appendChild(svgText(x + b / 2, y + h / 2 + 4, z, { class: "pt-faktortext" }));
  });
  return x0 + zahlen.length * (b + luecke) - luecke;
}

function gzBild(d) {
  const B = 480, H = 40 + d.reihen.length * 40;
  const svg = neueFlaeche(B, H);
  svg.appendChild(svgText(B / 2, 16, d.bildTitel, { class: "pt-titel" }));
  d.reihen.forEach((r, i) => {
    const y = 32 + i * 40;
    svg.appendChild(svgText(12, y + 15, r.label, { class: "pt-kettentext", "text-anchor": "start" }));
    kaestchenReihe(svg, 108, y, r.zahlen, r.klassen);
    if (r.notiz) svg.appendChild(svgText(B - 10, y + 15, r.notiz, { class: "pt-kettentext", "text-anchor": "end" }));
  });
  return svg;
}

// Kandidatenlisten: erst alle zulässigen Zahlentripel aufbauen, dann eines
// ziehen — nie würfeln und verwerfen.
const GZ_KANDIDATEN = {
  1: (() => {
    const l = [];
    for (const a of [2, 3, 5, 10]) for (let m = 1; m <= 4; m++) for (let n = 1; n <= 4; n++) if (m + n <= 6) l.push({ a, m, n });
    return l;
  })(),
  2: (() => {
    const l = [];
    for (const a of [2, 3, 5, 10]) for (let n = 1; n <= 3; n++) for (let m = n + 1; m <= 6; m++) l.push({ a, m, n });
    return l;
  })(),
  3: (() => {
    const l = [];
    for (const a of [2, 3, 5, 10]) for (let m = 1; m <= 3; m++) for (let n = 2; n <= 3; n++) if (m * n <= 6) l.push({ a, m, n });
    return l;
  })(),
  4: (() => {
    const l = [];
    for (let a = 2; a <= 6; a++) for (let b = 2; b <= 6; b++) if (a !== b && a * b <= 12) for (let n = 2; n <= 3; n++) l.push({ a, b, n });
    return l;
  })(),
  5: (() => {
    const l = [];
    for (let b = 2; b <= 3; b++) for (let q = 2; q <= 4; q++) for (let n = 2; n <= 3; n++) l.push({ a: b * q, b, n, q });
    return l;
  })(),
};

function gzBaue() {
  const g = gzGesetz;
  const k = pick(GZ_KANDIDATEN[g]);
  const schritte = [];
  let gleichungHtml = "", bilanz = "", bildTitel = "", reihen = [];

  if (g === 1) {
    const { a, m, n } = k, s = m + n;
    gleichungHtml = `${potHtml(num(a), m)} · ${potHtml(num(a), n)} = ?`;
    schritte.push(schrittZeile(`${potHtml(num(a), m)} · ${potHtml(num(a), n)}`, "Aufgabe"));
    schritte.push(schrittZeile(`= (${kette(num(a), m)}) · (${kette(num(a), n)})`, "beide Potenzen ausschreiben"));
    schritte.push(schrittZeile(`= ${kette(num(a), s)}`, "Klammern weglassen", "", "Bei einem reinen Produkt darf man die Klammern setzen, wie man will."));
    schritte.push(schrittZeile(`= ${potHtml(num(a), s)}`, `${m} + ${n} = ${s} Faktoren`, "fertig"));
    bildTitel = `Faktoren abzählen: ${m} + ${n} = ${s}`;
    reihen = [
      { label: potSvg(num(a), m), zahlen: new Array(m).fill(num(a)), klassen: new Array(m).fill("a") },
      { label: potSvg(num(a), n), zahlen: new Array(n).fill(num(a)), klassen: new Array(n).fill("b") },
      { label: potSvg(num(a), s), zahlen: new Array(s).fill(num(a)), klassen: new Array(m).fill("a").concat(new Array(n).fill("b")), notiz: "alle zusammen" },
    ];
    bilanz = `Probe mit Zahlen: <span class="wb">${num(potenz(a, m))} · ${num(potenz(a, n))} = ${num(potenz(a, s))}</span>, ` +
      `und tatsächlich ist <span class="ww">${potRein(num(a), s)} = ${num(potenz(a, s))}</span>. ` +
      `Die Exponenten werden <strong>addiert</strong>, nicht multipliziert — sonst käme ${potRein(num(a), m * n)} heraus, also ${num(potenz(a, m * n))}.`;
  } else if (g === 2) {
    const { a, m, n } = k, s = m - n;
    gleichungHtml = `${potHtml(num(a), m)} : ${potHtml(num(a), n)} = ?`;
    schritte.push(schrittZeile(`${potHtml(num(a), m)} : ${potHtml(num(a), n)}`, "Aufgabe"));
    schritte.push(schrittZeile(`= ${bruchHtml(kette(num(a), m), kette(num(a), n))}`, "als Bruch schreiben"));
    schritte.push(schrittZeile(`= ${kette(num(a), s)}`, `${n} Faktor${n === 1 ? "" : "en"} kürz${n === 1 ? "t" : "en"} sich weg`, "", "Oben und unten steht dieselbe Zahl — jedes Paar ergibt gekürzt 1."));
    schritte.push(schrittZeile(`= ${potHtml(num(a), s)}`, `${m} − ${n} = ${s} Faktoren`, "fertig"));
    bildTitel = `Kürzen: ${m} − ${n} = ${s}`;
    reihen = [
      { label: potSvg(num(a), m), zahlen: new Array(m).fill(num(a)), klassen: new Array(m).fill("a") },
      { label: potSvg(num(a), n), zahlen: new Array(n).fill(num(a)), klassen: new Array(n).fill("b"), notiz: "kürzt weg" },
      { label: potSvg(num(a), s), zahlen: new Array(m).fill(num(a)), klassen: new Array(n).fill("weg").concat(new Array(s).fill("a")), notiz: "grau = gekürzt" },
    ];
    bilanz = `Probe mit Zahlen: <span class="wb">${num(potenz(a, m))} : ${num(potenz(a, n))} = ${num(potenz(a, s))}</span>, ` +
      `und ${potRein(num(a), s)} ist <span class="ww">${num(potenz(a, s))}</span>. ` +
      `Wäre der Exponent oben <em>kleiner</em> als unten, käme ein negativer heraus — was das bedeutet, klärt Abschnitt 3.`;
  } else if (g === 3) {
    const { a, m, n } = k, s = m * n;
    gleichungHtml = `(${potHtml(num(a), m)})<sup class="ev">${n}</sup> = ?`;
    schritte.push(schrittZeile(`(${potHtml(num(a), m)})<sup class="ev">${n}</sup>`, "Aufgabe"));
    schritte.push(schrittZeile(`= ${kette(potHtml(num(a), m), n)}`, `${n} gleiche Klammern`));
    schritte.push(schrittZeile(`= ${new Array(n).fill(`(${kette(num(a), m)})`).join(" · ")}`, "jede Klammer ausschreiben"));
    schritte.push(schrittZeile(`= ${potHtml(num(a), s)}`, `${n} · ${m} = ${s} Faktoren`, "fertig", `${n} Klammern zu je ${m} Faktoren — hier wird wirklich multipliziert.`));
    bildTitel = `${n} Klammern zu je ${m} Faktoren: ${n} · ${m} = ${s}`;
    reihen = [];
    for (let i = 0; i < n; i++) {
      reihen.push({ label: `${i + 1}. Klammer`, zahlen: new Array(m).fill(num(a)), klassen: new Array(m).fill(i % 2 === 0 ? "a" : "b") });
    }
    reihen.push({
      label: potSvg(num(a), s), zahlen: new Array(s).fill(num(a)),
      klassen: Array.from({ length: s }, (_, i) => (Math.floor(i / m) % 2 === 0 ? "a" : "b")), notiz: "alle zusammen",
    });
    bilanz = `Probe mit Zahlen: <span class="wb">${num(potenz(a, m))}${hochU(n)} = ${num(potenz(a, s))}</span> — ` +
      `dasselbe wie <span class="ww">${potRein(num(a), s)} = ${num(potenz(a, s))}</span>. ` +
      `Nur hier werden die Exponenten <strong>multipliziert</strong>; bei ${potRein(num(a), m)} · ${potRein(num(a), n)} wären sie addiert worden, also ${potRein(num(a), m + n)}.`;
  } else if (g === 4) {
    const { a, b, n } = k, p = a * b;
    gleichungHtml = `${potHtml(num(a), n)} · ${potHtml(num(b), n, "zv")} = ?`;
    schritte.push(schrittZeile(`${potHtml(num(a), n)} · ${potHtml(num(b), n, "zv")}`, "Aufgabe"));
    schritte.push(schrittZeile(`= (${kette(num(a), n)}) · (${kette(num(b), n)})`, "beide Potenzen ausschreiben"));
    schritte.push(schrittZeile(`= ${new Array(n).fill(`(${num(a)} · ${num(b)})`).join(" · ")}`, "paarweise umsortieren", "", "Ein Produkt darf man beliebig umstellen — das Kommutativgesetz."));
    schritte.push(schrittZeile(`= ${potHtml(num(p), n)}`, `${n} gleiche Paare`, "fertig"));
    bildTitel = `Je ein ${num(a)} und ein ${num(b)} bilden ein Paar — ${n} Paare`;
    reihen = [
      { label: potSvg(num(a), n), zahlen: new Array(n).fill(num(a)), klassen: new Array(n).fill("a") },
      { label: potSvg(num(b), n), zahlen: new Array(n).fill(num(b)), klassen: new Array(n).fill("b") },
      {
        label: `${n} Paare`,
        zahlen: Array.from({ length: 2 * n }, (_, i) => (i % 2 === 0 ? num(a) : num(b))),
        klassen: Array.from({ length: 2 * n }, (_, i) => (i % 2 === 0 ? "a" : "b")),
        notiz: `= ${potSvg(num(p), n)}`,
      },
    ];
    bilanz = `Probe mit Zahlen: <span class="wb">${num(potenz(a, n))} · ${num(potenz(b, n))} = ${num(potenz(p, n))}</span>, ` +
      `und ${potRein(num(p), n)} ist <span class="ww">${num(potenz(p, n))}</span>. ` +
      `Hier müssen die <strong>Exponenten</strong> gleich sein; die Basen dürfen verschieden sein. Bei ${potRein(num(a), n)} · ${potRein(num(b), n + 1)} ginge es nicht.`;
  } else {
    const { a, b, n, q } = k;
    gleichungHtml = `${potHtml(num(a), n)} : ${potHtml(num(b), n, "zv")} = ?`;
    schritte.push(schrittZeile(`${potHtml(num(a), n)} : ${potHtml(num(b), n, "zv")}`, "Aufgabe"));
    schritte.push(schrittZeile(`= ${bruchHtml(kette(num(a), n), kette(num(b), n))}`, "als Bruch schreiben"));
    schritte.push(schrittZeile(`= ${new Array(n).fill(`(${num(a)} : ${num(b)})`).join(" · ")}`, "paarweise kürzen"));
    schritte.push(schrittZeile(`= ${potHtml(num(q), n)}`, `${num(a)} : ${num(b)} = ${num(q)}`, "fertig"));
    bildTitel = `Jedes Paar gekürzt: ${num(a)} : ${num(b)} = ${num(q)}`;
    reihen = [
      { label: `Zähler ${potSvg(num(a), n)}`, zahlen: new Array(n).fill(num(a)), klassen: new Array(n).fill("a") },
      { label: `Nenner ${potSvg(num(b), n)}`, zahlen: new Array(n).fill(num(b)), klassen: new Array(n).fill("b"), notiz: "kürzt jedes Paar" },
      { label: "Ergebnis", zahlen: new Array(n).fill(num(q)), klassen: new Array(n).fill("a"), notiz: `= ${potSvg(num(q), n)}` },
    ];
    bilanz = `Probe mit Zahlen: <span class="wb">${num(potenz(a, n))} : ${num(potenz(b, n))} = ${num(potenz(q, n))}</span>, ` +
      `und ${potRein(num(q), n)} ist <span class="ww">${num(potenz(q, n))}</span>. ` +
      `Auch hier zählt der gleiche <strong>Exponent</strong> — die Basen werden geteilt, die Exponenten bleiben stehen.`;
  }
  return { schritte, gleichungHtml, bilanz, bild: () => gzBild({ bildTitel, reihen }) };
}

function initGesetze() {
  const schalter = document.getElementById("gz-schalter");
  const protokoll = mountProtokoll(
    { neu: "gz-neu", schritt: "gz-schritt", alle: "gz-alle", schritte: "gz-schritte", bilanz: "gz-bilanz", gleichung: "gz-gleichung", mount: "gz-mount" },
    gzBaue,
  );
  GESETZE.forEach((g) => {
    const btn = el("button", { type: "button", html: `(${g.nr}) ${g.kurz}` });
    btn.title = g.name;
    btn.addEventListener("click", () => {
      gzGesetz = g.nr;
      [...schalter.children].forEach((b, i) => b.classList.toggle("aktiv", GESETZE[i].nr === gzGesetz));
      protokoll.neu();
    });
    schalter.appendChild(btn);
  });
  schalter.children[0].classList.add("aktiv");
  protokoll.neu();
}

// ================= 3. Null und negative Exponenten =================

// Die Treppe: von a⁴ abwärts wird in jedem Schritt durch a geteilt. Über a⁰ = 1
// hinaus geht es genauso weiter — das ist die ganze Begründung.
function gz2Bild(a, n) {
  const B = 480, H = 316;
  const svg = neueFlaeche(B, H);
  svg.appendChild(svgText(B / 2, 16, `Immer wieder durch ${num(a)} teilen — über die 1 hinaus`, { class: "pt-titel" }));
  const oben = 28, zeile = 30, hoehe = 24;
  for (let k = 4; k >= -4; k--) {
    const i = 4 - k, y = oben + i * zeile;
    const wert = k >= 0 ? num(potenz(a, k)) : `1 : ${num(potenz(a, -k))}`;
    svg.appendChild(svgEl("rect", { x: 62, y: y.toFixed(2), width: 336, height: hoehe, rx: 6, class: "pt-stufe" + (k === n ? " aktiv" : "") }));
    svg.appendChild(svgText(74, y + 17, `${potSvg(num(a), k)} = ${wert}`, { class: "pt-stufentext", "text-anchor": "start" }));
    if (k > -4) {
      const yA = y + hoehe / 2, yB = y + zeile + hoehe / 2 - 6;
      svg.appendChild(svgEl("path", { d: `M 412 ${yA.toFixed(2)} L 412 ${yB.toFixed(2)}`, class: "pt-pfeil" }));
      svg.appendChild(svgEl("path", { d: `M 408 ${(yB - 5).toFixed(2)} L 412 ${yB.toFixed(2)} L 416 ${(yB - 5).toFixed(2)}`, class: "pt-pfeil" }));
      svg.appendChild(svgText(420, yB - 1, `: ${num(a)}`, { class: "pt-pfeiltext", "text-anchor": "start" }));
    }
  }
  return svg;
}

function renderGanzzahlig() {
  const a = Number(document.getElementById("gz2-a").value);
  const n = Number(document.getElementById("gz2-n").value);
  document.getElementById("gz2-a-anzeige").textContent = num(a);
  document.getElementById("gz2-n-anzeige").textContent = num(n);
  const betrag = potenz(a, Math.abs(n));
  const wert = n >= 0 ? betrag : 1 / betrag;

  document.getElementById("gz2-gleichung").innerHTML = n > 0
    ? `${potHtml(num(a), n)} = ${kette(num(a), n)} = <span class="wv">${num(betrag)}</span>`
    : n === 0
      ? `${potHtml(num(a), 0)} = <span class="wv">1</span>`
      : `${potHtml(num(a), num(n))} = ${bruchHtml("1", potHtml(num(a), -n))} = ${bruchHtml("1", `<span class="wv">${num(betrag)}</span>`)} ` +
        `<span class="wv">${zeichen(wert, 6)} ${num(wert, 6)}</span>`;

  const mount = document.getElementById("gz2-mount");
  mount.innerHTML = "";
  mount.appendChild(gz2Bild(a, n));

  const ks = [4, 3, 2, 1, 0, -1, -2, -3, -4];
  const zeileK = ks.map((k) => `<td class="n${k === n ? " aktiv" : ""}">${num(k)}</td>`).join("");
  const zeileW = ks.map((k) => {
    const t = k >= 0 ? num(potenz(a, k)) : `1 : ${num(potenz(a, -k))}`;
    return `<td class="w${k === n ? " aktiv" : ""}">${t}</td>`;
  }).join("");
  document.getElementById("gz2-tabelle").innerHTML =
    `<caption>Von rechts nach links wird jedes Mal mit ${num(a)} multipliziert</caption>` +
    `<tr><th>n</th>${zeileK}</tr><tr><th>${potRein(num(a), "n")}</th>${zeileW}</tr>`;

  const karten = document.getElementById("gz2-karten");
  karten.innerHTML = "";
  karten.appendChild(karte("b", "Basis a", num(a)));
  karten.appendChild(karte("e", "Exponent n", num(n)));
  karten.appendChild(karte("w", "aⁿ", n < 0 ? `1 : ${num(betrag)}` : num(betrag)));
  karten.appendChild(karte("z", "als Dezimalzahl", mitZeichen(wert, 6)));

  const bilanz = document.getElementById("gz2-bilanz");
  if (n === 0) {
    bilanz.innerHTML =
      `Zweimal dieselbe Rechnung, zwei Wege: <span class="wb">${potRein(num(a), 3)} : ${potRein(num(a), 3)} = ${potRein(num(a), "3−3")} = ${potRein(num(a), 0)}</span> ` +
      `nach Gesetz (2) — und <span class="ww">${num(potenz(a, 3))} : ${num(potenz(a, 3))} = 1</span>, weil jede Zahl durch sich selbst geteilt 1 ergibt.<br>` +
      `Beides muss übereinstimmen, also bleibt nur <span class="ww">${potRein(num(a), 0)} = 1</span>. Das gilt für <em>jede</em> Basis außer 0.`;
  } else if (n < 0) {
    const m = -n;
    bilanz.innerHTML =
      `Nach Gesetz (2): <span class="wb">${potRein(num(a), 1)} : ${potRein(num(a), m + 1)} = ${potRein(num(a), `1−${m + 1}`)} = ${potRein(num(a), num(n))}</span>.<br>` +
      `Und durch Kürzen: <span class="ww">${potRein(num(a), 1)} : ${potRein(num(a), m + 1)} = 1 : ${potRein(num(a), m)} = 1 : ${num(betrag)}</span>.<br>` +
      `Also ist <span class="ww">${potRein(num(a), num(n))} = 1 : ${num(betrag)} ${zeichen(wert, 6)} ${num(wert, 6)}</span> — ` +
      `eine <strong>positive</strong> Zahl kleiner als 1, kein negatives Ergebnis.`;
  } else {
    bilanz.innerHTML =
      `<span class="wb">${potRein(num(a), n)}</span> = ${kette(num(a), n)} = <span class="ww">${num(betrag)}</span>. ` +
      `Ein Schritt nach links in der Tabelle bedeutet „mal ${num(a)}“, ein Schritt nach rechts „geteilt durch ${num(a)}“ — ` +
      `und genau dieses Muster wird bei n = 0 und darunter einfach fortgesetzt.`;
  }

  const text = document.getElementById("gz2-text");
  if (n === 0) {
    text.innerHTML = `<span class="pt-urteil eins">${potRein(num(a), 0)} = 1</span> ` +
      `Nicht 0 und nicht a — die 1 ist der einzige Wert, mit dem Gesetz (2) auch hier noch stimmt.`;
  } else if (n < 0) {
    text.innerHTML = `<span class="pt-urteil ja">${potRein(num(a), num(n))} ${zeichen(wert, 6)} ${num(wert, 6)} > 0</span> ` +
      `Ein negativer Exponent macht die Potenz <em>klein</em>, nicht negativ. Er bedeutet Kehrwert.`;
  } else {
    text.innerHTML = `<span class="pt-urteil ja">${potRein(num(a), n)} = ${num(betrag)}</span> ` +
      `Der gewohnte Fall: ${num(n)} Faktoren ${num(a)}. Schiebe den Regler nach links über die 0 hinaus.`;
  }
}

function initGanzzahlig() {
  document.getElementById("gz2-a").addEventListener("input", renderGanzzahlig);
  document.getElementById("gz2-n").addEventListener("input", renderGanzzahlig);
  renderGanzzahlig();
}

// ================= 4. Zehnerpotenzen =================

// Die Dezimaldarstellung entsteht durch Verschieben des Kommas in der
// Ziffernfolge, nicht durch Rechnen mit Gleitkommazahlen: 10¹² und 10⁻⁹ wären
// dort längst ungenau.
function gruppiere(ziffern) {
  let out = "";
  for (let i = 0; i < ziffern.length; i++) {
    if (i > 0 && (ziffern.length - i) % 3 === 0) out += ".";
    out += ziffern[i];
  }
  return out;
}
function dezimalString(ziffern, exp) {
  if (exp >= 0) return gruppiere(ziffern + "0".repeat(exp));
  const k = -exp;
  if (k < ziffern.length) return gruppiere(ziffern.slice(0, ziffern.length - k)) + "," + ziffern.slice(ziffern.length - k);
  return "0," + "0".repeat(k - ziffern.length) + ziffern;
}

const ZP_OBJEKTE = [
  { name: "Bakterie", z: 2, n: -6 },
  { name: "Haar", z: 7, n: -5 },
  { name: "Reiskorn", z: 6, n: -3 },
  { name: "Mensch", z: 1.8, n: 0 },
  { name: "Everest", z: 8.8, n: 3 },
  { name: "Erdumfang", z: 4, n: 7 },
  { name: "Erde–Sonne", z: 1.5, n: 11 },
];

function zpBild(logWert, anzeige) {
  const B = 500, H = 152;
  const svg = neueFlaeche(B, H);
  const links = 40, rechts = 470, achseY = 88;
  const lMin = -9.5, lMax = 13;
  const px = (l) => links + ((l - lMin) / (lMax - lMin)) * (rechts - links);
  svg.appendChild(svgText(B / 2, 16, "Größenordnungen — die Zahl als Länge in Metern gelesen", { class: "pt-titel" }));

  // Vergleichsobjekte: Punkt auf der Achse, Beschriftung in zwei Reihen, damit
  // sich die Namen nicht überlagern, dazu je ein kurzer Strich als Zuordnung.
  ZP_OBJEKTE.forEach((o, i) => {
    const l = Math.log10(o.z) + o.n, x = px(l);
    svg.appendChild(svgText(x, i % 2 === 0 ? 34 : 50, o.name, { class: "pt-objekttext" }));
    svg.appendChild(svgEl("line", { x1: x.toFixed(2), y1: 60, x2: x.toFixed(2), y2: achseY - 4, class: "pt-skalastrich" }));
    svg.appendChild(svgEl("circle", { cx: x.toFixed(2), cy: achseY, r: 3.2, class: "pt-objekt" }));
  });

  svg.appendChild(svgEl("line", { x1: links, y1: achseY, x2: rechts, y2: achseY, class: "pt-skala" }));
  for (let e = -9; e <= 12; e += 3) {
    const x = px(e);
    svg.appendChild(svgEl("line", { x1: x.toFixed(2), y1: achseY, x2: x.toFixed(2), y2: achseY + 7, class: "pt-skalastrich" }));
    svg.appendChild(svgText(x, achseY + 20, potSvg("10", e), { class: "pt-skalatext" }));
  }

  // Zeiger: ein Dreieck unter der Achse, damit er keine Beschriftung verdeckt.
  const xz = px(logWert);
  svg.appendChild(svgEl("path", { d: `M ${xz.toFixed(2)} ${achseY} L ${(xz - 7).toFixed(2)} ${achseY + 12} L ${(xz + 7).toFixed(2)} ${achseY + 12} Z`, class: "pt-zeigerspitze" }));
  svg.appendChild(svgEl("line", { x1: xz.toFixed(2), y1: achseY - 10, x2: xz.toFixed(2), y2: achseY, class: "pt-zeiger" }));
  const anker = xz < links + 60 ? "start" : xz > rechts - 60 ? "end" : "middle";
  const xt = anker === "start" ? links : anker === "end" ? rechts : xz;
  svg.appendChild(svgText(xt, achseY + 44, anzeige, { class: "pt-punkttext wert", "text-anchor": anker }));
  return svg;
}

function renderZehnerpotenzen() {
  const zRoh = Number(document.getElementById("zp-z").value);   // 10 … 99
  const n = Number(document.getElementById("zp-n").value);
  const ziffern = String(zRoh);
  const zText = ziffern[0] + "," + ziffern[1];
  document.getElementById("zp-z-anzeige").textContent = zText;
  document.getElementById("zp-n-anzeige").textContent = num(n);
  const dezimal = dezimalString(ziffern, n - 1);
  const logWert = Math.log10(zRoh) - 1 + n;

  document.getElementById("zp-gleichung").innerHTML =
    `<span class="wv">${zText}</span> · ${potHtml("10", num(n), "zv")} = <span class="wv">${dezimal}</span>`;

  const mount = document.getElementById("zp-mount");
  mount.innerHTML = "";
  mount.appendChild(zpBild(logWert, `${zText} · ${potSvg("10", n)} = ${dezimal}`));

  const richtung = n === 0 ? "gar nicht" : `um ${num(Math.abs(n))} Stelle${Math.abs(n) === 1 ? "" : "n"} nach ${n > 0 ? "rechts" : "links"}`;
  document.getElementById("zp-schritte").innerHTML = [
    schrittZeile(`${zText} · ${potHtml("10", num(n), "zv")}`, "wissenschaftliche Schreibweise"),
    schrittZeile(`${potHtml("10", num(n), "zv")} = ${dezimalString("1", n)}`, "die Zehnerpotenz allein"),
    schrittZeile(`Komma ${richtung} verschieben`, n >= 0 ? "mal 10 macht groß" : "geteilt durch 10 macht klein", "",
      n >= 0 ? "Fehlende Stellen werden mit Nullen aufgefüllt." : "Vor der ersten Ziffer stehen die Nullen der Zehntel, Hundertstel und so weiter."),
    schrittZeile(`= <span class="wv">${dezimal}</span>`, "ausgeschrieben", "fertig"),
  ].join("");

  const karten = document.getElementById("zp-karten");
  karten.innerHTML = "";
  karten.appendChild(karte("w", "Faktor z", zText));
  karten.appendChild(karte("z", "Exponent n", num(n)));
  karten.appendChild(karte("b", "ausgeschrieben", dezimal));
  karten.appendChild(karte("e", "zehnmal so groß", `${zText} · ${potRein("10", num(n + 1))}`));

  document.getElementById("zp-bilanz").innerHTML =
    `Der Faktor <span class="ww">${zText}</span> liegt zwischen 1 und 10 — so verlangt es die wissenschaftliche Schreibweise. ` +
    `Der Exponent <span class="wz">${num(n)}</span> gibt die Größenordnung an: ` +
    (n >= 0
      ? `Vor dem Komma stehen <strong>${num(n + 1)}</strong> Ziffern.`
      : `Nach dem Komma stehen erst <strong>${num(-n - 1)}</strong> Null${-n - 1 === 1 ? "" : "en"}, dann die erste Ziffer.`) +
    `<br>Ein Exponent mehr bedeutet <em>zehnmal</em> so groß: ${potRein("10", num(n + 1))} = ${dezimalString("1", n + 1)}. ` +
    `Von <span class="wz">${potRein("10", num(n))}</span> auf <span class="wz">${potRein("10", num(n + 3))}</span> ist es schon das Tausendfache.`;

  const text = document.getElementById("zp-text");
  if (n < 0) {
    text.innerHTML = `<span class="pt-urteil eins">${dezimal} — eine kleine Zahl</span> ` +
      `Der negative Exponent schiebt das Komma nach links. Die Zahl selbst bleibt positiv.`;
  } else if (n === 0) {
    text.innerHTML = `<span class="pt-urteil eins">${dezimal} — ${potRein("10", 0)} = 1</span> ` +
      `Bei n = 0 bleibt das Komma stehen: Man multipliziert mit 1.`;
  } else {
    text.innerHTML = `<span class="pt-urteil ja">${dezimal} — eine große Zahl</span> ` +
      `Ausgeschrieben braucht sie ${num(dezimal.replace(/\./g, "").length)} Ziffern; in wissenschaftlicher Schreibweise genügen zwei und der Exponent.`;
  }
}

function initZehnerpotenzen() {
  document.getElementById("zp-z").addEventListener("input", renderZehnerpotenzen);
  document.getElementById("zp-n").addEventListener("input", renderZehnerpotenzen);
  renderZehnerpotenzen();
}

// ================= 5. Die Potenzfunktionen =================

function pfBild(n, x0) {
  const B = 470, H = 330;
  const svg = neueFlaeche(B, H);
  const xMin = -2, xMax = 2, yMin = -4, yMax = 4;
  const g = koordinaten(svg, {
    links: 46, oben: 30, breite: 376, hoehe: 264, xMin, xMax, yMin, yMax,
    xSchritt: 0.5, ySchritt: 1, xBeschriftung: 1, yBeschriftung: 1,
  });
  svg.appendChild(svgText(B / 2, 16, `Grün: y = ${potSvg("x", n)} · gestrichelt: y = x und y = x² · violett: die Spiegelung`, { class: "pt-titel" }));
  if (n !== 1) kurveZeichnen(svg, g, (x) => x, xMin, xMax, yMin, yMax, "blass");
  if (n !== 2) kurveZeichnen(svg, g, (x) => x * x, xMin, xMax, yMin, yMax, "blass");
  kurveZeichnen(svg, g, (x) => potenz(x, n), xMin, xMax, yMin, yMax, "");

  const y0 = potenz(x0, n), y1 = potenz(-x0, n);
  const drin = (x, y) => x >= xMin && x <= xMax && y >= yMin && y <= yMax;
  // Die Symmetrie wird nur dann eingezeichnet, wenn beide Punkte wirklich im
  // Ausschnitt liegen — sonst behauptete das Bild etwas, das es nicht zeigt.
  if (x0 !== 0 && drin(x0, y0) && drin(-x0, y1)) {
    // In beiden Fällen wird dieselbe Strecke gezeichnet: die Verbindung des
    // Punktes mit seinem Spiegelbild. Bei geradem n verläuft sie waagerecht und
    // wird von der y-Achse halbiert, bei ungeradem n geht sie durch den
    // Ursprung. Eine zusätzliche Linie auf der y-Achse würde diese nur verdecken.
    svg.appendChild(svgEl("line", {
      x1: g.px(-x0).toFixed(2), y1: g.py(y1).toFixed(2),
      x2: g.px(x0).toFixed(2), y2: g.py(y0).toFixed(2), class: "pt-symmetrie",
    }));
    punktZeichnen(svg, g, -x0, y1, "spiegel", `(${num(-x0, 2)} | ${num(y1, 3)})`, x0 > 0 ? false : true, y1 >= 0);
  }
  if (drin(x0, y0)) punktZeichnen(svg, g, x0, y0, "wert", `(${num(x0, 2)} | ${num(y0, 3)})`, x0 >= 0, y0 >= 0);
  // Die beiden festen Marken liegen bei x = ±1, die beweglichen bei x = ±x₀.
  // Kommen sie sich nahe, so bleiben die Marken ohne Beschriftung stehen: Zwei
  // Namen übereinander wären unlesbar, der Punkt selbst aber bleibt zu sehen.
  const beschriften = Math.abs(Math.abs(x0) - 1) > 0.35;
  punktZeichnen(svg, g, 1, 1, "marke", beschriften ? "(1 | 1)" : null, true, false);
  // Die Beschriftung steht immer oberhalb der Marke: Bei ungeradem n verliefe
  // die Symmetriestrecke sonst mitten durch sie hindurch.
  punktZeichnen(svg, g, -1, n % 2 === 0 ? 1 : -1, "marke",
    beschriften ? `(−1 | ${n % 2 === 0 ? "1" : "−1"})` : null, false, true);
  return svg;
}

function renderPotenzfunktionen() {
  const n = Number(document.getElementById("pf-n").value);
  const x0 = Number(document.getElementById("pf-x").value) / 10;
  document.getElementById("pf-n-anzeige").textContent = num(n);
  document.getElementById("pf-x-anzeige").textContent = num(x0, 2);
  const y0 = potenz(x0, n), y1 = potenz(-x0, n);
  const gerade = n % 2 === 0;

  document.getElementById("pf-gleichung").innerHTML =
    `f(x) = ${potHtml("x", n, "bv")} &nbsp;→&nbsp; f(<span class="bv">${num(x0, 2)}</span>) = ` +
    `${potHtml(klammer(x0, 2), n)} = <span class="wv">${num(y0, 4)}</span>`;

  const mount = document.getElementById("pf-mount");
  mount.innerHTML = "";
  mount.appendChild(pfBild(n, x0));

  const karten = document.getElementById("pf-karten");
  karten.innerHTML = "";
  karten.appendChild(karte("e", "Exponent n", num(n)));
  karten.appendChild(karte("b", "Stelle x", num(x0, 2)));
  karten.appendChild(karte("w", "f(x)", mitZeichen(y0, 4)));
  karten.appendChild(karte("w", "f(−x)", mitZeichen(y1, 4)));
  karten.appendChild(karte(gerade ? "e" : "r", "Symmetrie", gerade ? "zur y-Achse" : "zum Ursprung"));

  const ausserhalb = Math.abs(y0) > 4;
  document.getElementById("pf-bilanz").innerHTML =
    `<span class="wb">f(−x) = (−x)${hochU(n)} = (−1)${hochU(n)} · x${hochU(n)} = ${gerade ? "+" : "−"}x${hochU(n)} = ${gerade ? "" : "−"}f(x)</span>, ` +
    `denn (−1)${hochU(n)} = ${gerade ? "1" : "−1"} bei ${gerade ? "geradem" : "ungeradem"} Exponenten.<br>` +
    `Hier: <span class="ww">f(${num(x0, 2)}) ${zeichen(y0, 4)} ${num(y0, 4)}</span> und ` +
    `<span class="ww">f(${num(-x0, 2)}) ${zeichen(y1, 4)} ${num(y1, 4)}</span> — ` +
    (gerade ? "beide gleich, der Graph spiegelt sich an der y-Achse." : "entgegengesetzt gleich, der Graph dreht sich um den Ursprung.") +
    (ausserhalb ? ` <span class="wr">Der Punkt liegt außerhalb des gezeigten Ausschnitts (|y| &gt; 4) und ist deshalb nicht eingezeichnet.</span>` : "");

  document.getElementById("pf-text").innerHTML = gerade
    ? `<span class="pt-urteil ja">n = ${num(n)} ist gerade</span> ` +
      `Alle Werte sind ≥ 0, der Graph liegt nie unter der x-Achse und ist achsensymmetrisch zur y-Achse — wie die Normalparabel.`
    : `<span class="pt-urteil eins">n = ${num(n)} ist ungerade</span> ` +
      `Negative x liefern negative Werte, der Graph durchläuft den dritten und den ersten Quadranten und ist punktsymmetrisch zum Ursprung.`;
}

function initPotenzfunktionen() {
  document.getElementById("pf-n").addEventListener("input", renderPotenzfunktionen);
  document.getElementById("pf-x").addEventListener("input", renderPotenzfunktionen);
  renderPotenzfunktionen();
}

// ================= 6. Die n-te Wurzel =================

// Liefert die ganze Zahl k mit kⁿ = a, sonst 0.
function ganzeWurzel(a, n) {
  for (let k = 0; potenz(k, n) <= a; k++) if (potenz(k, n) === a) return k;
  return 0;
}

function wzBild(a, n, w) {
  const B = 470, H = 320;
  const svg = neueFlaeche(B, H);
  const xMin = -0.5, xMax = Math.ceil(w + 0.8), yMin = -2.5, yMax = 22;
  const g = koordinaten(svg, {
    links: 48, oben: 30, breite: 370, hoehe: 258, xMin, xMax, yMin, yMax,
    xSchritt: xMax <= 3 ? 0.5 : 1, ySchritt: 2, xBeschriftung: 1, yBeschriftung: 4,
  });
  svg.appendChild(svgText(B / 2, 16, `Wo trifft y = ${potSvg("x", n)} die Höhe ${num(a)}?`, { class: "pt-titel" }));
  kurveZeichnen(svg, g, (x) => (x < 0 ? NaN : potenz(x, n)), xMin, xMax, yMin, yMax, "");
  // Die Höhe a als waagerechte Gerade, der Wurzelwert als Lot darunter.
  svg.appendChild(svgEl("line", { x1: g.px(0).toFixed(2), y1: g.py(a).toFixed(2), x2: g.px(xMax).toFixed(2), y2: g.py(a).toFixed(2), class: "pt-hilfslinie" }));
  svg.appendChild(svgText(g.px(xMax) - 4, g.py(a) - 6, `y = ${num(a)}`, { class: "pt-punkttext wurzel", "text-anchor": "end" }));
  svg.appendChild(svgEl("line", { x1: g.px(w).toFixed(2), y1: g.py(a).toFixed(2), x2: g.px(w).toFixed(2), y2: g.py(0).toFixed(2), class: "pt-hilfslinie" }));
  punktZeichnen(svg, g, w, a, "wurzel", null);
  // Die Beschriftung steht *über* der x-Achse: darunter stehen bereits die
  // Achsenzahlen, und zwei Beschriftungen übereinander liest niemand.
  punktZeichnen(svg, g, w, 0, "wurzel", `${hochU(n)}√${num(a)} ${zeichen(w, 3)} ${num(w, 3)}`, w < xMax * 0.6, true);
  return svg;
}

function renderWurzeln() {
  const a = Number(document.getElementById("wz-a").value);
  const n = Number(document.getElementById("wz-n").value);
  document.getElementById("wz-a-anzeige").textContent = num(a);
  document.getElementById("wz-n-anzeige").textContent = num(n);
  const genau = ganzeWurzel(a, n);
  const w = genau > 0 ? genau : Math.pow(a, 1 / n);
  const k = Math.max(1, Math.floor(w));

  document.getElementById("wz-gleichung").innerHTML =
    `<span class="ev">${hochU(n)}</span>√<span class="wv">${num(a)}</span> = ` +
    `${potHtml(num(a), `1/${n}`, "wv")} <span class="wv">${zeichen(w, 4)} ${num(w, 4)}</span>`;

  const mount = document.getElementById("wz-mount");
  mount.innerHTML = "";
  mount.appendChild(wzBild(a, n, w));

  const schritte = [
    schrittZeile(`Gesucht: die Zahl x ≥ 0 mit ${potHtml("x", n, "bv")} = <span class="wv">${num(a)}</span>`, "Aufgabe"),
  ];
  if (genau > 0) {
    schritte.push(schrittZeile(`${potHtml(num(genau), n)} = ${kette(num(genau), n)} = <span class="wv">${num(a)}</span>`, "Probe", "fertig"));
    schritte.push(schrittZeile(`${hochU(n)}√${num(a)} = <span class="wv">${num(genau)}</span>`, "genauer Wert", "fertig",
      `${num(a)} ist die ${ordnung(n)} Potenz einer ganzen Zahl — hier geht die Wurzel auf.`));
  } else {
    schritte.push(schrittZeile(`${potHtml(num(k), n)} = ${num(potenz(k, n))} und ${potHtml(num(k + 1), n)} = ${num(potenz(k + 1, n))}`, "einschachteln"));
    schritte.push(schrittZeile(`${num(potenz(k, n))} &lt; <span class="wv">${num(a)}</span> &lt; ${num(potenz(k + 1, n))}, also ${num(k)} &lt; ${hochU(n)}√${num(a)} &lt; ${num(k + 1)}`,
      "Grenzen", "warnung", "Die Wurzel liegt zwischen zwei ganzen Zahlen — sie selbst ist keine."));
    schritte.push(schrittZeile(`${hochU(n)}√${num(a)} <span class="wv">≈ ${num(w, 4)}</span>`, "Näherungswert", "fertig"));
  }
  document.getElementById("wz-schritte").innerHTML = schritte.join("");

  const karten = document.getElementById("wz-karten");
  karten.innerHTML = "";
  karten.appendChild(karte("w", "Radikand a", num(a)));
  karten.appendChild(karte("e", "Wurzelexponent n", num(n)));
  karten.appendChild(karte("b", `${hochU(n)}√a`, mitZeichen(w, 4)));
  karten.appendChild(karte("z", "Probe: (ⁿ√a)ⁿ", mitZeichen(potenz(w, n), 4)));

  document.getElementById("wz-bilanz").innerHTML =
    `Die Wurzel macht das Potenzieren rückgängig: <span class="wb">(${hochU(n)}√${num(a)})${hochU(n)} = ${num(a)}</span>.<br>` +
    `Deshalb ist die Schreibweise <span class="ww">${potRein(num(a), `1/${n}`)}</span> erzwungen und nicht erfunden: Nach Gesetz (3) wäre ` +
    `<span class="ww">(${potRein(num(a), `1/${n}`)})${hochU(n)} = ${potRein(num(a), `${n}/${n}`)} = ${potRein(num(a), 1)} = ${num(a)}</span> — ` +
    `genau das, was die ${ordnung(n)} Wurzel leistet.<br>` +
    `Die Gleichung ${potRein("x", n)} = ${num(a)} hat dagegen ` +
    (n % 2 === 0
      ? `<strong>zwei</strong> Lösungen: x ${zeichen(w, 3)} ${num(w, 3)} und x ${zeichen(w, 3)} ${num(-w, 3)}, denn ${n} ist gerade.`
      : `<strong>eine</strong> Lösung: x ${zeichen(w, 3)} ${num(w, 3)}, denn ${n} ist ungerade.`);

  document.getElementById("wz-text").innerHTML = (genau > 0
    ? `<span class="pt-urteil ja">${hochU(n)}√${num(a)} = ${num(genau)} — genau</span> ` +
      `${num(a)} = ${kette(num(genau), n)} ist eine ${ordnung(n)} Potenz, die Wurzel ist eine ganze Zahl.`
    : `<span class="pt-urteil eins">${hochU(n)}√${num(a)} ≈ ${num(w, 4)} — nur ein Näherungswert</span> ` +
      `Zwischen ${num(k)} und ${num(k + 1)} liegt keine ganze Zahl mehr. Wie bei √2 ist der Wert nicht als Bruch darstellbar; der Taschenrechner rundet.`) +
    (n === 2
      ? ` <em>Schreibweise:</em> Bei n = 2 lässt man den Wurzelexponenten weg und schreibt einfach √${num(a)} — die Quadratwurzel aus <a href="../07-quadratwurzeln/index.html#sec-begriff">Thema 7</a> ist der Fall n = 2.`
      : "");
}

function initWurzeln() {
  document.getElementById("wz-a").addEventListener("input", renderWurzeln);
  document.getElementById("wz-n").addEventListener("input", renderWurzeln);
  renderWurzeln();
}

// ================= 7. Gestaffelte Übungsaufgaben =================

// Die Werkbank für die Übungsaufgaben ist für alle Grundwissen-Seiten dieselbe und steht in
// ../../aufgaben.js. Mitgegeben wird nur, wie DIESE Seite eine Eingabe als Zahl liest.
const mountUebungsaufgaben = (container, defs) =>
  mountUebungsaufgabenBasis(container, defs, { parse: parseFlexibleNumber });

// ---------- Aufgaben-Definitionen ----------

function ohneKollision(kandidaten, werte, notfall, eps = 1e-9) {
  const sauber = kandidaten.filter((kk) => {
    const alle = werte(kk);
    return alle.every((x, i) => alle.every((y, j) => i === j || Math.abs(x - y) > eps));
  });
  if (sauber.length < 2 && kandidaten.length > 20) {
    throw new Error("Kollisionsprüfung lässt von " + kandidaten.length + " Kandidaten nur " +
      sauber.length + " übrig — vermutlich steht ein Wert doppelt in der Liste");
  }
  const gewaehlt = sauber.length ? pick(sauber) : notfall;
  if (gewaehlt === undefined) throw new Error("Aufgabengenerator ohne gültige Kandidaten");
  return gewaehlt;
}

// Dasselbe für Aufgaben mit mehreren Eingabefeldern: Kollidieren müssen die
// Werte nur innerhalb eines Feldes, denn nur dort entscheidet die Zahl darüber,
// welcher Hinweis erscheint. Zwischen zwei Feldern darf dieselbe Zahl stehen.
// NaN bedeutet "an dieser Stelle springt kein Hinweis an" und wird übergangen.
function ohneFeldKollision(kandidaten, gruppen, eps = 1e-9) {
  const sauber = kandidaten.filter((kk) => gruppen(kk).every((g) => {
    const echt = g.filter((x) => Number.isFinite(x));
    return echt.every((x, i) => echt.every((y, j) => i === j || Math.abs(x - y) > eps));
  }));
  if (!sauber.length) throw new Error("Aufgabengenerator ohne gültige Kandidaten");
  return pick(sauber);
}

// Feste Stellenzahl — für Vorzahlen, bei denen die letzte Null etwas bedeutet.
function fest(x, digits) {
  return x.toLocaleString("de-DE", { maximumFractionDigits: digits, minimumFractionDigits: digits }).replace("-", "−");
}

// Aufgabe 1 — den Potenzwert bestimmen, mit der Vorzeichenfalle bei negativer Basis.
const A1_KANDIDATEN = (() => {
  const liste = [];
  for (const a of [-5, -4, -3, -2, 2, 3, 4, 5]) for (let n = 2; n <= 4; n++) liste.push({ a, n });
  return liste;
})();

function generateAufgabe1() {
  const k = ohneKollision(A1_KANDIDATEN, (v) => [potenz(v.a, v.n), v.a * v.n, -potenz(v.a, v.n)], A1_KANDIDATEN[0]);
  const { a, n } = k;
  const w = potenz(a, n);
  const basis = klammer(a);
  return {
    promptHtml: `Berechne <strong>${potRein(basis, n)}</strong>.`,
    correct: w,
    tolerance: 0.001,
    placeholder: "Potenzwert",
    hinweis: (raw, val) => {
      if (Math.abs(val - a * n) < 0.001) return `Das ist das Vielfache ${num(a)} · ${num(n)}. Der Exponent sagt aber, wie oft ${num(a)} als <em>Faktor</em> auftritt, nicht als Summand.`;
      if (Math.abs(val + w) < 0.001) return a < 0
        ? `Das Vorzeichen stimmt noch nicht: Der Exponent ${num(n)} ist ${n % 2 === 0 ? "gerade, die Minuszeichen heben sich also paarweise auf" : "ungerade, ein Minuszeichen bleibt also übrig"}.`
        : `Die Basis ${num(a)} ist positiv, also sind alle ${num(n)} Faktoren positiv — das Ergebnis kann nicht negativ sein.`;
      return `Schreibe die Faktoren hin: ${kette(basis, n)}.`;
    },
    tipps: [
      `Der Exponent zählt die <strong>Faktoren</strong>, nicht die Summanden: ${potRein(basis, n)} = ${kette(basis, n)}.`,
      `Rechne der Reihe nach: ${num(a)} · ${num(a)} = ${num(a * a)}, dann weiter.`,
      a < 0
        ? `Achte auf das Vorzeichen: ${num(n)} Minuszeichen heben sich ${n % 2 === 0 ? "vollständig paarweise auf" : "paarweise auf, eines bleibt übrig"}.`
        : "Die Basis ist positiv, also sind alle Faktoren positiv — das Ergebnis kann nicht negativ werden.",
    ],
    musterloesungHtml:
      `<strong>Potenz ausschreiben:</strong> ${potRein(basis, n)} = ${kette(basis, n)}<br>` +
      `<strong>Ausrechnen:</strong> ${potRein(basis, n)} = <strong>${num(w)}</strong><br>` +
      (a < 0
        ? `<em>Vorzeichen:</em> ${num(n)} ist ${n % 2 === 0 ? "gerade" : "ungerade"}, also ist das Ergebnis ${w > 0 ? "positiv" : "negativ"}. ` +
          `Vorsicht: ${potRein(num(Math.abs(a)), n)} mit einem Minus davor wäre ${num(-potenz(Math.abs(a), n))} — die Klammer entscheidet.`
        : `<em>Zur Kontrolle:</em> Das Vielfache ${num(a)} · ${num(n)} wäre nur ${num(a * n)}. Potenzieren wächst weit schneller als Vervielfachen.`),
  };
}

// Aufgabe 2 — die wissenschaftliche Schreibweise. Abschnitt 4 hatte keine
// eigene Aufgabe; dabei ist das Ablesen der Größenordnung die eigentliche
// Leistung: Der Exponent zählt, um wie viele Stellen das Komma wandert.
const A2_KANDIDATEN = (() => {
  const liste = [];
  // z ist die Vorzahl mit 1 ≤ z < 10, hier in Zehntelschritten.
  for (let zz = 11; zz <= 99; zz++) {
    const z = zz / 10;
    for (const n of [-6, -5, -4, -3, -2, 3, 4, 5, 6, 7, 8]) {
      liste.push({ z, n, zz });
    }
  }
  return liste;
})();

// Die ausgeschriebene Zahl — ganzzahlig gerechnet, damit kein Rundungsfehler
// in die Ziffernfolge gerät.
function langzahl(zz, n) {
  // z · 10^n = (zz : 10) · 10^n = zz · 10^(n−1).
  if (n >= 1) return num(zz * potenz(10, n - 1));    // mit Tausenderpunkten
  return "0," + "0".repeat(-n - 1) + String(zz);     // n ≤ −2: 0,00…zz
}

function generateAufgabe2() {
  const k = ohneFeldKollision(A2_KANDIDATEN, (v) => [
    // Feld 1: die Vorzahl z.
    [v.z, v.zz, v.zz / 100, v.n],
    // Feld 2: der Exponent n.
    [v.n, -v.n, v.n + 1, v.n - 1, v.z],
  ]);
  const { z, n, zz } = k;
  const lang = langzahl(zz, n);
  const stellen = n > 0 ? n : -n;
  return {
    promptHtml: `Schreibe <strong>${lang}</strong> in wissenschaftlicher Schreibweise <strong>z · 10<sup>n</sup></strong> ` +
      `mit 1 ≤ z &lt; 10.`,
    felder: [
      {
        name: "Vorzahl z", soll: z, toleranz: 0.0005, platzhalter: "z",
        hinweis: (roh, val) => {
          if (Math.abs(val - zz) < 0.0005) return `${num(zz)} ist nicht kleiner als 10. Das Komma gehört hinter die <em>erste</em> Ziffer: ${fest(z, 1)}.`;
          if (Math.abs(val - zz / 100) < 0.0005) return `${num(zz / 100)} ist kleiner als 1. Verlangt ist 1 ≤ z &lt; 10, also genau eine Ziffer vor dem Komma.`;
          if (Math.abs(val - n) < 0.0005) return `${num(n)} ist der Exponent, nicht die Vorzahl.`;
          return `Setze das Komma so, dass genau eine Ziffer von 1 bis 9 davorsteht. Aus den Ziffern ${String(zz).split("").join(" und ")} wird ${fest(z, 1)}.`;
        },
      },
      {
        name: "Exponent n", soll: n, toleranz: 0.0005, platzhalter: "n",
        hinweis: (roh, val) => {
          if (Math.abs(val + n) < 0.0005) return n > 0
            ? `${lang} ist eine <strong>große</strong> Zahl — größer als 10. Dann ist der Exponent positiv.`
            : `${lang} ist eine <strong>kleine</strong> Zahl — kleiner als 1. Dann ist der Exponent negativ.`;
          if (Math.abs(val - (n + 1)) < 0.0005 || Math.abs(val - (n - 1)) < 0.0005) {
            return `Um eine Stelle daneben. Zähle nach: Das Komma wandert von ${fest(z, 1)} aus um <strong>${num(stellen)}</strong> Stellen nach ${n > 0 ? "rechts" : "links"}, bis ${lang} dasteht.`;
          }
          if (Math.abs(val - z) < 0.0005) return `${fest(z, 1)} ist die Vorzahl, nicht der Exponent.`;
          return `Der Exponent zählt, um wie viele Stellen das Komma wandern muss.`;
        },
      },
    ],
    tipps: [
      "In der wissenschaftlichen Schreibweise steht vor dem Komma genau eine Ziffer von 1 bis 9. Setze das Komma zuerst dorthin.",
      `Hier heißt das: z = ${fest(z, 1)}.`,
      n > 0
        ? `Nun zähle, um wie viele Stellen das Komma nach rechts wandern muss, damit wieder ${lang} dasteht. Bei einer großen Zahl ist n positiv.`
        : `Nun zähle, um wie viele Stellen das Komma nach links wandern muss, damit wieder ${lang} dasteht. Bei einer Zahl kleiner als 1 ist n negativ.`,
    ],
    musterloesungHtml:
      `<strong>1. Komma setzen:</strong> Genau eine Ziffer vor dem Komma ⇒ z = <strong>${fest(z, 1)}</strong><br>` +
      `<strong>2. Stellen zählen:</strong> Von ${fest(z, 1)} nach ${lang} wandert das Komma um <strong>${num(stellen)}</strong> Stellen nach ${n > 0 ? "rechts" : "links"} ⇒ n = <strong>${num(n)}</strong><br>` +
      `<strong>Ergebnis:</strong> ${lang} = <strong>${fest(z, 1)} · 10<sup>${num(n)}</sup></strong><br>` +
      `<em>Probe:</em> ${fest(z, 1)} · 10<sup>${num(n)}</sup> = ${lang} ✓<br>` +
      `<span class="progress-note">Der Exponent ist die <strong>Größenordnung</strong>. ` +
      `${n > 0 ? `10<sup>${num(n)}</sup> bedeutet: Die Zahl hat ${num(n + 1)} Stellen vor dem Komma.`
               : `10<sup>${num(n)}</sup> bedeutet: Nach dem Komma stehen ${num(stellen - 1)} Nullen, bevor die erste Ziffer kommt.`} ` +
      `Ein Exponent mehr heißt zehnmal so groß.</span>`,
  };
}

// Aufgabe 3 — die Potenzgesetze (1), (2) und (3) in einem Term.
// Der äußere Exponent r wechselt zwischen 2 und 3. Bliebe er fest bei 2, so
// fiele der typische Fehler "m + r statt m · r" für m = 2 mit der richtigen
// Lösung zusammen, und die Kollisionsprüfung würde jedes m = 2 aussortieren.
const A3_KANDIDATEN = (() => {
  const liste = [];
  for (const r of [2, 3]) for (let m = 1; m <= 4; m++) for (let n = 1; n <= 5; n++) for (let k = 1; k <= 8; k++) {
    const e = r * m + n - k;
    if (e >= 0 && e <= 9) liste.push({ r, m, n, k, e });
  }
  return liste;
})();

function generateAufgabe3() {
  const kd = ohneKollision(
    A3_KANDIDATEN,
    (v) => [v.e, v.m + v.r + v.n - v.k, v.r * v.m * v.n - v.k, v.r * v.m + v.n + v.k],
    A3_KANDIDATEN[0],
  );
  const { r, m, n, k, e } = kd;
  const innen = r * m, zwischen = innen + n;
  return {
    promptHtml: `Fasse zu <em>einer</em> Potenz zusammen:<br>` +
      `<strong>(a<sup>${m}</sup>)<sup>${r}</sup> · a<sup>${n}</sup> : a<sup>${k}</sup></strong><br>` +
      `Wie groß ist der <strong>Exponent</strong> des Ergebnisses?`,
    correct: e,
    tolerance: 0.001,
    placeholder: "Exponent",
    hinweis: (raw, val) => {
      if (Math.abs(val - (m + r + n - k)) < 0.001) return `Bei (a<sup>${m}</sup>)<sup>${r}</sup> werden die Exponenten <strong>multipliziert</strong>, nicht addiert: ${num(m)} · ${num(r)} = ${num(innen)}, nicht ${num(m + r)}.`;
      if (Math.abs(val - (innen * n - k)) < 0.001) return `Beim <em>Multiplizieren</em> zweier Potenzen mit gleicher Basis werden die Exponenten <strong>addiert</strong>: a<sup>${innen}</sup> · a<sup>${n}</sup> = a<sup>${zwischen}</sup>, nicht a<sup>${innen * n}</sup>.`;
      if (Math.abs(val - (innen + n + k)) < 0.001) return `Der letzte Schritt ist eine <strong>Division</strong>: Dabei wird der Exponent ${num(k)} abgezogen, nicht addiert.`;
      return `Drei Schritte: erst (a<sup>${m}</sup>)<sup>${r}</sup> = a<sup>${innen}</sup>, dann mal a<sup>${n}</sup>, zuletzt geteilt durch a<sup>${k}</sup>.`;
    },
    tipps: [
      "Arbeite die Klammer zuerst ab. Bei einer Potenz einer Potenz werden die Exponenten <strong>multipliziert</strong>.",
      `Also (a<sup>${m}</sup>)<sup>${r}</sup> = a<sup>${innen}</sup>. Damit steht da a<sup>${innen}</sup> · a<sup>${n}</sup> : a<sup>${k}</sup>.`,
      `Mal heißt plus, geteilt heißt minus: ${num(innen)} + ${num(n)} − ${num(k)}.`,
    ],
    musterloesungHtml:
      `<strong>Gesetz (3)</strong> — Potenz einer Potenz: (a<sup>${m}</sup>)<sup>${r}</sup> = a<sup>${m} · ${r}</sup> = a<sup>${innen}</sup><br>` +
      `<strong>Gesetz (1)</strong> — gleiche Basis mal: a<sup>${innen}</sup> · a<sup>${n}</sup> = a<sup>${innen} + ${n}</sup> = a<sup>${zwischen}</sup><br>` +
      `<strong>Gesetz (2)</strong> — gleiche Basis geteilt: a<sup>${zwischen}</sup> : a<sup>${k}</sup> = a<sup>${zwischen} − ${k}</sup> = <strong>a<sup>${e}</sup></strong><br>` +
      `<em>Also:</em> Der Exponent ist <strong>${num(e)}</strong>` +
      (e === 0 ? `, und a<sup>0</sup> = 1 — der ganze Term ist gleich 1.` : `.`),
  };
}

// Aufgabe 4 — Potenzfunktionen. Abschnitt 5 hatte keine Aufgabe; der Kern ist,
// dass (−x)ⁿ = (−1)ⁿ · xⁿ gilt und das Vorzeichen allein am Exponenten hängt.
const A4_KANDIDATEN = (() => {
  const liste = [];
  for (let n = 2; n <= 6; n++) {
    for (const x0 of [2, 3, 4, 5, 6, 7, 8, 9, 10]) {
      const w = potenz(x0, n);
      if (w > 200000) continue;
      liste.push({ n, x0, w, gerade: n % 2 === 0 });
    }
  }
  return liste;
})();

function generateAufgabe4() {
  const k = ohneFeldKollision(A4_KANDIDATEN, (v) => [
    // Feld 1: f(x₀).
    [v.w, v.x0 * v.n, v.n * v.x0 * v.x0, v.x0],
    // Feld 2: f(−x₀). Bei geradem n ist das derselbe Wert wie f(x₀) — dann
    // liegt auf −w kein eigener Hinweis.
    [v.gerade ? v.w : -v.w, v.gerade ? -v.w : v.w, -v.x0 * v.n],
  ]);
  const { n, x0, w, gerade } = k;
  const zweiter = gerade ? w : -w;
  return {
    promptHtml: `Gegeben ist die Potenzfunktion <strong>f(x) = x<sup>${num(n)}</sup></strong>.<br>` +
      `Untersuche sie an der Stelle <strong>x = ${num(x0)}</strong> und an der Gegenstelle <strong>x = −${num(x0)}</strong>.`,
    felder: [
      {
        name: `f(${num(x0)})`, soll: w, toleranz: 0.0005, platzhalter: "Wert",
        hinweis: (roh, val) => {
          if (Math.abs(val - x0 * n) < 0.0005) return `${num(x0 * n)} ist das Vielfache ${num(x0)} · ${num(n)}. Der Exponent sagt, wie oft ${num(x0)} als <em>Faktor</em> auftritt: ${kette(num(x0), n)}.`;
          if (Math.abs(val - n * x0 * x0) < 0.0005) return `Nur zwei Faktoren reichen nicht — es sind ${num(n)} Stück: ${kette(num(x0), n)}.`;
          if (Math.abs(val - x0) < 0.0005) return `${num(x0)} ist die Stelle, nicht der Funktionswert.`;
          return `Rechne ${kette(num(x0), n)}.`;
        },
      },
      {
        name: `f(−${num(x0)})`, soll: zweiter, toleranz: 0.0005, platzhalter: "Wert",
        hinweis: (roh, val) => {
          if (Math.abs(val - (gerade ? -w : w)) < 0.0005) {
            return gerade
              ? `Das Vorzeichen stimmt nicht: ${num(n)} ist <strong>gerade</strong>, die ${num(n)} Minuszeichen heben sich paarweise auf. Also ist f(−${num(x0)}) = f(${num(x0)}) = ${num(w)}.`
              : `Das Vorzeichen stimmt nicht: ${num(n)} ist <strong>ungerade</strong>, ein Minuszeichen bleibt übrig. Also ist f(−${num(x0)}) = −f(${num(x0)}) = ${num(-w)}.`;
          }
          if (Math.abs(val + x0 * n) < 0.0005) return `Wieder das Vielfache statt der Potenz. Gerechnet wird ${kette("(−" + num(x0) + ")", n)}.`;
          return `(−${num(x0)})<sup>${num(n)}</sup> = (−1)<sup>${num(n)}</sup> · ${num(x0)}<sup>${num(n)}</sup>. Der erste Faktor ist +1 oder −1, je nachdem, ob ${num(n)} gerade oder ungerade ist.`;
        },
      },
      {
        name: "Symmetrie (1 = achsensymmetrisch zur y-Achse, 2 = punktsymmetrisch zum Ursprung)",
        soll: gerade ? 1 : 2, toleranz: 0.25, platzhalter: "1 oder 2",
        hinweis: () => gerade
          ? `Der Exponent ${num(n)} ist <strong>gerade</strong>, also f(−x) = f(x): Links und rechts der y-Achse stehen dieselben Werte. Der Graph ist <strong>achsensymmetrisch zur y-Achse</strong>.`
          : `Der Exponent ${num(n)} ist <strong>ungerade</strong>, also f(−x) = −f(x): Der Wert kippt das Vorzeichen. Der Graph ist <strong>punktsymmetrisch zum Ursprung</strong>.`,
      },
    ],
    tipps: [
      `Eine Potenz ist eine Kurzschreibweise für ein Produkt: x<sup>${num(n)}</sup> = ${kette("x", n)}.`,
      `Für die zweite Stelle setze die ganze negative Zahl ein — in Klammern: (−${num(x0)})<sup>${num(n)}</sup> = (−1)<sup>${num(n)}</sup> · ${num(x0)}<sup>${num(n)}</sup>.`,
      "(−1)ⁿ ist +1 bei geradem n und −1 bei ungeradem n. Genau daran hängt auch die Symmetrie des Graphen.",
    ],
    musterloesungHtml:
      `<strong>1. f(${num(x0)}):</strong> ${kette(num(x0), n)} = <strong>${num(w)}</strong><br>` +
      `<strong>2. f(−${num(x0)}):</strong> (−${num(x0)})<sup>${num(n)}</sup> = (−1)<sup>${num(n)}</sup> · ${num(x0)}<sup>${num(n)}</sup> = ` +
      `${gerade ? "+1" : "−1"} · ${num(w)} = <strong>${num(zweiter)}</strong><br>` +
      `<strong>3. Symmetrie:</strong> ${num(n)} ist ${gerade ? "gerade" : "ungerade"}, also f(−x) = ${gerade ? "f(x)" : "−f(x)"} ⇒ ` +
      `<strong>${gerade ? "achsensymmetrisch zur y-Achse" : "punktsymmetrisch zum Ursprung"}</strong><br>` +
      `<em>Zur Kontrolle:</em> Der Graph geht durch (0 | 0) und (1 | 1), außerdem durch ` +
      `(−1 | ${gerade ? "1" : "−1"}) — dieselbe Regel, nur an der Stelle 1.<br>` +
      `<span class="progress-note">Für n = 2 wäre das die Normalparabel, für n = 1 die Gerade y = x. ` +
      `Je größer der Exponent, desto flacher verläuft die Kurve zwischen −1 und 1 und desto steiler außerhalb — ` +
      `die Stellen −1, 0 und 1 bleiben aber immer dieselben.</span>`,
  };
}

// Aufgabe 5 — negative Exponenten in einer Gleichung.
const A5_KANDIDATEN = (() => {
  const liste = [];
  for (const a of [2, 3, 5, 10]) for (let j = 1; j <= 3; j++) for (let k = 1; k <= 3; k++) if (j !== k) liste.push({ a, j, k });
  return liste;
})();

function generateAufgabe5() {
  const kd = ohneKollision(A5_KANDIDATEN, (v) => [-(v.k + v.j), v.k + v.j, v.k - v.j, v.j - v.k], A5_KANDIDATEN[0]);
  const { a, j, k } = kd;
  const e = -(k + j);
  const nenner = potenz(a, k);
  return {
    promptHtml: `Für welche ganze Zahl <strong>n</strong> gilt<br>` +
      `<strong>${potRein(num(a), "n")} · ${potRein(num(a), j)} = 1 : ${num(nenner)}</strong>?`,
    correct: e,
    tolerance: 0.001,
    placeholder: "n",
    hinweis: (raw, val) => {
      if (Math.abs(val - (k + j)) < 0.001) return `Das Vorzeichen fehlt: Rechts steht ein <em>Kehrwert</em>, also 1 : ${num(a)}<sup>${num(k)}</sup> = ${num(a)}<sup>−${num(k)}</sup>. Der Exponent rechts ist negativ.`;
      if (Math.abs(val - (k - j)) < 0.001 || Math.abs(val - (j - k)) < 0.001) return `Der Exponent ${num(j)} steht auf der <em>linken</em> Seite und muss dort abgezogen werden: n = −${num(k)} − ${num(j)}.`;
      return `Schreibe zuerst die rechte Seite als Potenz von ${num(a)}: 1 : ${num(nenner)} = ${num(a)}<sup>−${num(k)}</sup>.`;
    },
    tipps: [
      `Bringe beide Seiten auf dieselbe Basis ${num(a)}. Rechts steht ein Kehrwert — und ein Kehrwert ist eine Potenz mit <strong>negativem</strong> Exponenten.`,
      `${num(nenner)} = ${num(a)}<sup>${num(k)}</sup>, also 1 : ${num(nenner)} = ${num(a)}<sup>−${num(k)}</sup>.`,
      `Links werden die Exponenten addiert: n + ${num(j)}. Setze das gleich −${num(k)} und löse nach n auf.`,
    ],
    musterloesungHtml:
      `<strong>Rechte Seite als Potenz:</strong> 1 : ${num(nenner)} = 1 : ${num(a)}<sup>${num(k)}</sup> = ${num(a)}<sup>−${num(k)}</sup><br>` +
      `<strong>Linke Seite nach Gesetz (1):</strong> ${num(a)}<sup>n</sup> · ${num(a)}<sup>${num(j)}</sup> = ${num(a)}<sup>n + ${num(j)}</sup><br>` +
      `<strong>Exponenten vergleichen:</strong> n + ${num(j)} = −${num(k)}, also n = −${num(k)} − ${num(j)} = <strong>${num(e)}</strong><br>` +
      `<em>Probe:</em> ${num(a)}<sup>${num(e)}</sup> · ${num(a)}<sup>${num(j)}</sup> = ${num(a)}<sup>${num(e + j)}</sup> = 1 : ${num(nenner)} ✓`,
  };
}

// Aufgabe 6 — die n-te Wurzel und die zugehörige Gleichung. Beides wird
// regelmäßig verwechselt: Die Wurzel ist als die nicht negative Zahl
// festgelegt, die Gleichung xⁿ = a hat bei geradem n aber zwei Lösungen.
const A6_KANDIDATEN = (() => {
  const liste = [];
  // n = 2 bliebe außen vor: Die Quadratwurzel schreibt man ohne Wurzelexponenten,
  // und sie hat eine eigene Seite.
  for (let n = 3; n <= 5; n++) {
    for (let b = 2; b <= 12; b++) {
      const a = potenz(b, n);
      if (a > 25000) continue;
      liste.push({ n, b, a, gerade: n % 2 === 0 });
    }
  }
  return liste;
})();

function generateAufgabe6() {
  const k = ohneFeldKollision(A6_KANDIDATEN, (v) => [
    // Feld 1: die Wurzel selbst.
    [v.b, -v.b, v.a, v.a / v.n],
    // Feld 3: die kleinste Lösung der Gleichung.
    [v.gerade ? -v.b : v.b, v.gerade ? v.b : -v.b, v.a],
  ]);
  const { n, b, a, gerade } = k;
  const anzahl = gerade ? 2 : 1;
  const kleinste = gerade ? -b : b;
  return {
    promptHtml: `Gegeben ist <strong>a = ${num(a)}</strong>.<br>` +
      `Betrachte die Wurzel <strong><sup>${num(n)}</sup>√a = a<sup>1/${num(n)}</sup></strong> ` +
      `und die Gleichung <strong>x<sup>${num(n)}</sup> = ${num(a)}</strong>.`,
    felder: [
      {
        name: `<sup>${num(n)}</sup>√${num(a)}`, soll: b, toleranz: 0.0005, platzhalter: "Wurzelwert",
        hinweis: (roh, val) => {
          if (Math.abs(val + b) < 0.0005) return `Zwar ist (−${num(b)})<sup>${num(n)}</sup> = ${num(a)}, aber die ${num(n)}-te Wurzel ist als die <strong>nicht negative</strong> Zahl festgelegt. Also <sup>${num(n)}</sup>√${num(a)} = ${num(b)}.`;
          if (Math.abs(val - a) < 0.0005) return `${num(a)} ist der Radikand selbst. Gesucht ist die Zahl, deren ${num(n)}-te Potenz ${num(a)} ergibt.`;
          if (Math.abs(val - a / n) < 0.0005) return `Geteilt wird nicht durch den Wurzelexponenten. Gesucht ist die Zahl x mit ${kette("x", n)} = ${num(a)}.`;
          if (!isNaN(val) && Math.abs(potenz(val, n) - a) > 0.0005) return `Probe: Deine Zahl ${num(n)}-mal mit sich selbst multipliziert muss ${num(a)} ergeben. ${num(val)}<sup>${num(n)}</sup> = ${num(potenz(val, n), 3)}.`;
          return `Probiere: 2<sup>${num(n)}</sup> = ${num(potenz(2, n))}, 3<sup>${num(n)}</sup> = ${num(potenz(3, n))}, …`;
        },
      },
      {
        name: `Anzahl der Lösungen von x<sup>${num(n)}</sup> = ${num(a)}`, soll: anzahl, toleranz: 0.25, platzhalter: "1 oder 2",
        hinweis: () => gerade
          ? `${num(n)} ist <strong>gerade</strong>: Auch (−${num(b)})<sup>${num(n)}</sup> ergibt ${num(a)}, denn die Minuszeichen heben sich paarweise auf. Die Gleichung hat also <strong>zwei</strong> Lösungen — anders als die Wurzel, die nur eine Zahl bezeichnet.`
          : `${num(n)} ist <strong>ungerade</strong>: Eine negative Zahl bleibt beim Potenzieren negativ und kann ${num(a)} nie ergeben. Die Gleichung hat also nur <strong>eine</strong> Lösung.`,
      },
      {
        name: "kleinste Lösung der Gleichung", soll: kleinste, toleranz: 0.0005, platzhalter: "x",
        hinweis: (roh, val) => {
          if (Math.abs(val - (gerade ? b : -b)) < 0.0005) {
            return gerade
              ? `${num(b)} ist die <em>größere</em> der beiden Lösungen. Die kleinere ist ihr Gegenstück ${num(-b)}.`
              : `${num(-b)} ist keine Lösung: (−${num(b)})<sup>${num(n)}</sup> = ${num(-a)}, nicht ${num(a)}. Bei ungeradem Exponenten gibt es nur die eine Lösung ${num(b)}.`;
          }
          if (Math.abs(val - a) < 0.0005) return `${num(a)} ist die rechte Seite der Gleichung, nicht ihre Lösung.`;
          return gerade
            ? `Bei geradem Exponenten gehören zu jeder Lösung zwei Zahlen: ${num(b)} und ${num(-b)}. Die kleinere ist gesucht.`
            : `Bei ungeradem Exponenten gibt es nur eine Lösung — sie ist zugleich die kleinste.`;
        },
      },
    ],
    tipps: [
      `Die ${num(n)}-te Wurzel fragt rückwärts: Welche Zahl ergibt, ${num(n)}-mal mit sich selbst multipliziert, ${num(a)}?`,
      "Die Wurzel ist immer <strong>nicht negativ</strong> — das ist Festlegung, keine Rechnung.",
      "Die <em>Gleichung</em> xⁿ = a ist etwas anderes als die Wurzel: Bei geradem n erfüllt auch die negative Zahl die Gleichung, bei ungeradem n nicht.",
    ],
    musterloesungHtml:
      `<strong>1. Wurzel:</strong> ${kette(num(b), n)} = ${num(a)}, also <sup>${num(n)}</sup>√${num(a)} = <strong>${num(b)}</strong><br>` +
      `<strong>2. Gleichung x<sup>${num(n)}</sup> = ${num(a)}:</strong> ` +
      (gerade
        ? `Auch (−${num(b)})<sup>${num(n)}</sup> = ${num(a)}, denn ${num(n)} ist gerade ⇒ <strong>2 Lösungen</strong>: x = ${num(b)} und x = ${num(-b)}<br>`
        : `(−${num(b)})<sup>${num(n)}</sup> = ${num(-a)} ≠ ${num(a)}, denn ${num(n)} ist ungerade ⇒ <strong>1 Lösung</strong>: x = ${num(b)}<br>`) +
      `<strong>3. Kleinste Lösung:</strong> <strong>${num(kleinste)}</strong><br>` +
      `<em>Probe:</em> ${kette(klammer(kleinste), n)} = ${num(a)} ✓<br>` +
      `<span class="progress-note">Wurzel und Gleichung fallen nur bei ungeradem Exponenten zusammen. ` +
      `Bei geradem Exponenten bezeichnet das Wurzelzeichen <em>eine</em> Zahl, die Gleichung hat aber <em>zwei</em> Lösungen — ` +
      `wer statt x = ±<sup>${num(n)}</sup>√a nur x = <sup>${num(n)}</sup>√a schreibt, verliert die Hälfte.</span>`,
  };
}

// Aufgabe 7 — dritte Wurzel aus einer Zahl in wissenschaftlicher Schreibweise.
const A7_KANDIDATEN = (() => {
  const liste = [];
  for (let c = 2; c <= 9; c++) for (const e of [1, 2]) liste.push({ c, e });
  return liste;
})();

function generateAufgabe7() {
  const kd = ohneKollision(
    A7_KANDIDATEN,
    (v) => [v.c * potenz(10, v.e), v.c * potenz(10, 3 * v.e), Math.sqrt(potenz(v.c, 3) * potenz(10, 3 * v.e))],
    A7_KANDIDATEN[0],
  );
  const { c, e } = kd;
  const x = c * potenz(10, e);
  const wuerfel = potenz(c, 3);                       // 8 … 729
  const ziffern = String(wuerfel);
  const zehner = 3 * e + ziffern.length - 1;          // Exponent in wissenschaftlicher Schreibweise
  const mantisse = ziffern[0] + (ziffern.length > 1 ? "," + ziffern.slice(1) : "");
  return {
    promptHtml: `Ein würfelförmiger Behälter fasst <strong>${mantisse} · 10<sup>${num(zehner)}</sup> mm³</strong>.<br>` +
      `Wie lang ist eine <strong>Kante</strong> in mm?`,
    correct: x,
    tolerance: 0.001,
    placeholder: "Kantenlänge in mm",
    hinweis: (raw, val) => {
      if (Math.abs(val - c * potenz(10, 3 * e)) < 0.001) return `Die Zehnerpotenz muss ebenfalls die dritte Wurzel bekommen: aus 10<sup>${num(3 * e)}</sup> wird 10<sup>${num(e)}</sup>, denn (10<sup>${num(e)}</sup>)³ = 10<sup>${num(3 * e)}</sup>.`;
      if (Math.abs(val - Math.sqrt(wuerfel * potenz(10, 3 * e))) < 0.01) return `Das ist die <em>Quadrat</em>wurzel. Ein Würfel hat aber das Volumen V = a³, gesucht ist also die <strong>dritte</strong> Wurzel.`;
      return `Zerlege das Volumen in ${num(wuerfel)} · 10<sup>${num(3 * e)}</sup> — dann lässt sich aus beiden Faktoren einzeln die dritte Wurzel ziehen.`;
    },
    tipps: [
      "Beim Würfel ist V = a³. Gesucht ist also die <strong>dritte</strong> Wurzel des Volumens, nicht die Quadratwurzel.",
      `Schreibe das Volumen so um, dass der Zehnerexponent durch 3 teilbar ist: ${mantisse} · 10<sup>${num(zehner)}</sup> = ${num(wuerfel)} · 10<sup>${num(3 * e)}</sup>.`,
      `Nun lässt sich aus beiden Faktoren einzeln die dritte Wurzel ziehen: ³√${num(wuerfel)} = ${num(c)} und ³√(10<sup>${num(3 * e)}</sup>) = 10<sup>${num(e)}</sup>.`,
    ],
    musterloesungHtml:
      `<strong>Ansatz:</strong> Beim Würfel ist V = a³, also a = ³√V.<br>` +
      `<strong>Volumen günstig zerlegen:</strong> ${mantisse} · 10<sup>${num(zehner)}</sup> = <strong>${num(wuerfel)} · 10<sup>${num(3 * e)}</sup></strong> mm³<br>` +
      `<strong>Gesetz (4) rückwärts:</strong> ³√(${num(wuerfel)} · 10<sup>${num(3 * e)}</sup>) = ³√${num(wuerfel)} · ³√(10<sup>${num(3 * e)}</sup>) = ${num(c)} · 10<sup>${num(e)}</sup><br>` +
      `<em>Also:</em> a = <strong>${num(x)} mm</strong>.<br>` +
      `<em>Probe:</em> ${num(x)}³ = ${num(wuerfel)} · 10<sup>${num(3 * e)}</sup> = ${mantisse} · 10<sup>${num(zehner)}</sup> mm³ ✓`,
  };
}

// Aufgabe 8 — rechnen in wissenschaftlicher Schreibweise. Gebaut ist die
// Aufgabe so, dass das Zwischenergebnis die Bedingung 1 ≤ z < 10 verletzt —
// genau der Schritt, den die Achtung-Box auf dieser Seite beschreibt.
// Bewusst ohne Naturkonstanten: Die Zahlen werden gewürfelt, und ein Text, der
// die Lichtgeschwindigkeit oder die Masse eines Bakteriums nennt, wäre dann bei
// den meisten Würfen schlicht falsch.
const A8_KONTEXTE = [
  { art: "mal", einheit: "Byte",
    einleitung: (a, b) => `Ein Rechenzentrum speichert ${a} Dateien mit je ${b} Byte.` },
  { art: "mal", einheit: "mg",
    einleitung: (a, b) => `Eine Maschine fertigt ${a} Bauteile; jedes wiegt ${b} mg.` },
  { art: "mal", einheit: "Nachrichten",
    einleitung: (a, b) => `Ein Netzwerk hat ${a} Knoten; über jeden laufen ${b} Nachrichten.` },
  { art: "geteilt", einheit: "Byte",
    einleitung: (a, b) => `Ein Speicher von ${a} Byte wird gleichmäßig auf ${b} Rechner verteilt.` },
  { art: "geteilt", einheit: "km",
    einleitung: (a, b) => `Eine Strecke von ${a} km wird in ${b} gleich lange Abschnitte geteilt.` },
  { art: "geteilt", einheit: "Datensätze",
    einleitung: (a, b) => `${a} Datensätze werden gleichmäßig auf ${b} Tage verteilt.` },
];
// Vorzahlen und Zehnerpotenzen werden getrennt gezogen: Die Hinweise eines
// Feldes hängen jeweils nur an einer der beiden Hälften, und zwei kurze Listen
// sind besser als eine mit vierzigtausend Einträgen.
function ohneDoppel(werte) {
  const echt = werte.filter((x) => Number.isFinite(x));
  return echt.every((x, i) => echt.every((y, j) => i === j || Math.abs(x - y) > 1e-9));
}
const A8_VORZAHLEN = {
  // Beim Multiplizieren soll das Produkt über 10 liegen — sonst fehlt der
  // Normierungsschritt, um den es in dieser Aufgabe geht.
  mal: (() => {
    const liste = [];
    for (let a = 11; a <= 99; a++) {
      for (let b = 11; b <= 99; b++) {
        const roh = Math.round(a * b) / 100;
        if (roh < 10) continue;
        if (Math.abs(roh * 10 - Math.round(roh * 10)) > 1e-9) continue;
        const z = Math.round(roh * 100) / 1000;
        if (!ohneDoppel([roh, z, a / 10, b / 10, (a + b) / 10])) continue;
        liste.push({ z1: a / 10, z2: b / 10, roh: Math.round(roh * 10) / 10, z });
      }
    }
    return liste;
  })(),
  // Beim Dividieren soll der Quotient unter 1 liegen — dann muss das Komma
  // andersherum wandern.
  geteilt: (() => {
    const liste = [];
    for (let a = 11; a <= 99; a++) {
      for (let b = 11; b <= 99; b++) {
        if (a >= b) continue;
        const roh = a / b;
        if (Math.abs(roh * 10 - Math.round(roh * 10)) > 1e-9) continue;
        const r = Math.round(roh * 10) / 10, z = Math.round(roh * 100) / 10;
        if (!ohneDoppel([r, z, a / 10, b / 10, (a + b) / 10])) continue;
        liste.push({ z1: a / 10, z2: b / 10, roh: r, z });
      }
    }
    return liste;
  })(),
};
const A8_EXPONENTEN = {
  mal: (() => {
    const liste = [];
    for (const n1 of [3, 4, 5, 6, 7, 8]) {
      for (const n2 of [2, 3, 4, 5, 6]) {
        if (n1 === n2) continue;
        const zwischen = n1 + n2;
        if (!ohneDoppel([zwischen + 1, zwischen, n1, n2])) continue;
        liste.push({ n1, n2, zwischen, n: zwischen + 1 });
      }
    }
    return liste;
  })(),
  geteilt: (() => {
    const liste = [];
    for (const n1 of [6, 7, 8, 9, 10, 11, 12]) {
      for (const n2 of [2, 3, 4, 5]) {
        const zwischen = n1 - n2;
        if (!ohneDoppel([zwischen - 1, zwischen, n1, n2])) continue;
        liste.push({ n1, n2, zwischen, n: zwischen - 1 });
      }
    }
    return liste;
  })(),
};

function wissText(z, n) {
  return `${fest(z, 1)} · 10<sup>${num(n)}</sup>`;
}

function generateAufgabe8() {
  const kt = pick(A8_KONTEXTE);
  const art = kt.art;
  const { z1, z2, roh, z } = pick(A8_VORZAHLEN[art]);
  const { n1, n2, zwischen, n } = pick(A8_EXPONENTEN[art]);
  const zeichenText = art === "mal" ? "·" : ":";
  const a = wissText(z1, n1), b = wissText(z2, n2);
  return {
    promptHtml: `${kt.einleitung(`<strong>${a}</strong>`, `<strong>${b}</strong>`)}<br>` +
      `Gib das Ergebnis in wissenschaftlicher Schreibweise <strong>z · 10<sup>n</sup></strong> an (1 ≤ z &lt; 10).`,
    felder: [
      {
        name: `Vorzahlen ${zeichenText} gerechnet (noch nicht normiert)`, soll: roh, toleranz: 0.0005, platzhalter: "Zahl",
        hinweis: (roh2, val) => {
          if (Math.abs(val - z) < 0.0005) return `${num(z)} ist schon die fertige Vorzahl. Hier ist erst ${fest(z1, 1)} ${zeichenText} ${fest(z2, 1)} gefragt.`;
          if (Math.abs(val - (z1 + z2)) < 0.0005) return `Die Vorzahlen werden ${art === "mal" ? "multipliziert" : "geteilt"}, nicht addiert.`;
          if (Math.abs(val - z1) < 0.0005 || Math.abs(val - z2) < 0.0005) return `Das ist eine der beiden Vorzahlen. Beide müssen ${art === "mal" ? "miteinander multipliziert" : "durcheinander geteilt"} werden.`;
          return `Rechne ${fest(z1, 1)} ${zeichenText} ${fest(z2, 1)}.`;
        },
      },
      {
        name: "Vorzahl z des Ergebnisses", soll: z, toleranz: 0.0005, platzhalter: "z",
        hinweis: (roh2, val) => {
          if (Math.abs(val - roh) < 0.0005) return art === "mal"
            ? `${num(roh)} ist nicht kleiner als 10 — das ist noch keine wissenschaftliche Schreibweise. Verschiebe das Komma um eine Stelle nach links und gleiche es beim Exponenten aus.`
            : `${num(roh)} ist kleiner als 1 — das ist noch keine wissenschaftliche Schreibweise. Verschiebe das Komma um eine Stelle nach rechts und gleiche es beim Exponenten aus.`;
          if (Math.abs(val - z1) < 0.0005 || Math.abs(val - z2) < 0.0005) return "Das ist eine der gegebenen Vorzahlen, nicht die des Ergebnisses.";
          return `Aus ${num(roh)} wird ${num(z)}, indem das Komma um eine Stelle nach ${art === "mal" ? "links" : "rechts"} wandert.`;
        },
      },
      {
        name: "Exponent n des Ergebnisses", soll: n, toleranz: 0.0005, platzhalter: "n",
        hinweis: (roh2, val) => {
          if (Math.abs(val - zwischen) < 0.0005) return `${num(zwischen)} ist der Exponent <em>vor</em> dem Normieren. Weil das Komma um eine Stelle nach ${art === "mal" ? "links" : "rechts"} gewandert ist, ${art === "mal" ? "wächst" : "sinkt"} er noch um 1.`;
          if (Math.abs(val - n1) < 0.0005 || Math.abs(val - n2) < 0.0005) return `Das ist einer der gegebenen Exponenten. Beim ${art === "mal" ? "Multiplizieren werden sie addiert" : "Dividieren werden sie subtrahiert"}.`;
          return `Beim ${art === "mal" ? "Multiplizieren addierst du die Exponenten" : "Dividieren subtrahierst du die Exponenten"}: ${num(n1)} ${art === "mal" ? "+" : "−"} ${num(n2)} = ${num(zwischen)} — und dann kommt die Verschiebung des Kommas dazu.`;
        },
      },
    ],
    tipps: [
      `Vorzahlen und Zehnerpotenzen werden getrennt behandelt: ${fest(z1, 1)} ${zeichenText} ${fest(z2, 1)} einerseits, 10<sup>${num(n1)}</sup> ${zeichenText} 10<sup>${num(n2)}</sup> andererseits.`,
      `Nach Gesetz (${art === "mal" ? "1" : "2"}) ist 10<sup>${num(n1)}</sup> ${zeichenText} 10<sup>${num(n2)}</sup> = 10<sup>${num(zwischen)}</sup>, und ${fest(z1, 1)} ${zeichenText} ${fest(z2, 1)} = ${num(roh)}.`,
      `${num(roh)} · 10<sup>${num(zwischen)}</sup> ist richtig gerechnet, aber noch keine wissenschaftliche Schreibweise: ${num(roh)} liegt nicht zwischen 1 und 10. Verschiebe das Komma und gleiche den Exponenten aus.`,
    ],
    musterloesungHtml:
      `<strong>1. Getrennt rechnen:</strong> (${a}) ${zeichenText} (${b}) = (${fest(z1, 1)} ${zeichenText} ${fest(z2, 1)}) · (10<sup>${num(n1)}</sup> ${zeichenText} 10<sup>${num(n2)}</sup>)<br>` +
      `<strong>2. Vorzahlen:</strong> ${fest(z1, 1)} ${zeichenText} ${fest(z2, 1)} = <strong>${num(roh)}</strong><br>` +
      `<strong>3. Zehnerpotenzen nach Gesetz (${art === "mal" ? "1" : "2"}):</strong> 10<sup>${num(n1)}</sup> ${zeichenText} 10<sup>${num(n2)}</sup> = 10<sup>${num(n1)} ${art === "mal" ? "+" : "−"} ${num(n2)}</sup> = 10<sup>${num(zwischen)}</sup><br>` +
      `<strong>4. Zwischenergebnis:</strong> ${num(roh)} · 10<sup>${num(zwischen)}</sup> — richtig gerechnet, aber ${num(roh)} liegt nicht zwischen 1 und 10<br>` +
      `<strong>5. Nachnormieren:</strong> ${num(roh)} = ${num(z)} · 10<sup>${art === "mal" ? "1" : "−1"}</sup>, also ` +
      `${num(roh)} · 10<sup>${num(zwischen)}</sup> = <strong>${num(z)} · 10<sup>${num(n)}</sup></strong> ${kt.einheit}<br>` +
      `<em>Probe:</em> ${num(roh)} · 10<sup>${num(zwischen)}</sup> und ${num(z)} · 10<sup>${num(n)}</sup> sind dieselbe Zahl — ` +
      `das Komma ist um eine Stelle nach ${art === "mal" ? "links" : "rechts"} gewandert, der Exponent um 1 nach ${art === "mal" ? "oben" : "unten"} ✓<br>` +
      `<span class="progress-note">Der letzte Schritt wird am häufigsten vergessen. ` +
      `${num(roh)} · 10<sup>${num(zwischen)}</sup> ist zwar dieselbe Zahl, aber keine wissenschaftliche Schreibweise — ` +
      `und nur in dieser lassen sich Größenordnungen auf einen Blick vergleichen.</span>`,
  };
}

function initExercises() {
  mountUebungsaufgaben(document.getElementById("exercises-mount"), [
    { schwierigkeit: "einfach", titel: "Aufgabe 1 — Potenzwert berechnen", generate: generateAufgabe1 },
    { schwierigkeit: "einfach", titel: "Aufgabe 2 — wissenschaftliche Schreibweise", generate: generateAufgabe2 },
    { schwierigkeit: "mittel", titel: "Aufgabe 3 — Potenzgesetze anwenden", generate: generateAufgabe3 },
    { schwierigkeit: "mittel", titel: "Aufgabe 4 — Potenzfunktionen", generate: generateAufgabe4 },
    { schwierigkeit: "schwierig", titel: "Aufgabe 5 — negativer Exponent", generate: generateAufgabe5 },
    { schwierigkeit: "schwierig", titel: "Aufgabe 6 — n-te Wurzel und Gleichung", generate: generateAufgabe6 },
    { schwierigkeit: "komplex", titel: "Aufgabe 7 — Kante eines Würfels", generate: generateAufgabe7 },
    { schwierigkeit: "komplex", titel: "Aufgabe 8 — rechnen mit Zehnerpotenzen", generate: generateAufgabe8 },
  ]);
}

// ================= Quizze =================

function initQuizzes() {
  mountQuiz(document.getElementById("quiz-begriff"), {
    q: "Welche Aussage über (−3)<sup>4</sup> und −3<sup>4</sup> ist richtig?",
    options: [
      "(−3)<sup>4</sup> = 81 und −3<sup>4</sup> = −81",
      "Beide sind 81",
      "Beide sind −81",
      "(−3)<sup>4</sup> = −81 und −3<sup>4</sup> = 81",
    ],
    correct: 0,
    explain: "In (−3)⁴ ist die ganze Zahl −3 die Basis; vier Minuszeichen heben sich paarweise auf, das ergibt +81. In −3⁴ gehört das Minus nicht zur Basis: Potenziert wird nur die 3, und das Minus bleibt davor stehen — also −81.",
  });
  mountQuiz(document.getElementById("quiz-gesetze"), {
    q: "Wozu lässt sich a<sup>2</sup> · a<sup>3</sup> zusammenfassen?",
    options: ["a<sup>5</sup>", "a<sup>6</sup>", "2a<sup>3</sup>", "a<sup>2·3</sup> = a<sup>6</sup>"],
    correct: 0,
    explain: "Schreibt man die Faktoren hin, so stehen da (a·a)·(a·a·a), also fünf Stück: a⁵. Bei gleicher Basis werden die Exponenten addiert. Multipliziert werden sie nur bei der Potenz einer Potenz: (a²)³ = a⁶.",
  });
  mountQuiz(document.getElementById("quiz-ganzzahlig"), {
    q: "Wie groß ist 2<sup>−3</sup>?",
    options: ["0,125", "−8", "−6", "8"],
    correct: 0,
    explain: "Ein negativer Exponent bedeutet Kehrwert, nicht negatives Vorzeichen: 2⁻³ = 1 : 2³ = 1 : 8 = 0,125. Die Potenz wird also klein, bleibt aber positiv.",
  });
  mountQuiz(document.getElementById("quiz-zehnerpotenzen"), {
    q: "Wie lautet 0,000 45 in wissenschaftlicher Schreibweise?",
    options: ["4,5 · 10<sup>−4</sup>", "45 · 10<sup>−5</sup>", "4,5 · 10<sup>−3</sup>", "4,5 · 10<sup>4</sup>"],
    correct: 0,
    explain: "Das Komma muss um vier Stellen nach rechts wandern, damit aus 0,000 45 die Zahl 4,5 wird — also ist der Exponent −4. Die Angabe 45 · 10⁻⁵ ist zwar derselbe Wert, aber keine wissenschaftliche Schreibweise: Der Faktor muss zwischen 1 und 10 liegen.",
  });
  mountQuiz(document.getElementById("quiz-potenzfunktionen"), {
    q: "Welcher Graph ist punktsymmetrisch zum Ursprung?",
    options: ["y = x<sup>5</sup>", "y = x<sup>4</sup>", "y = x<sup>2</sup>", "y = x<sup>6</sup>"],
    correct: 0,
    explain: "Bei ungeradem Exponenten ist (−1)ⁿ = −1, also f(−x) = −f(x): Der Graph dreht sich um den Ursprung. Bei geradem Exponenten ist (−1)ⁿ = +1, dann ist der Graph achsensymmetrisch zur y-Achse und liegt nie unter der x-Achse.",
  });
  mountQuiz(document.getElementById("quiz-wurzeln"), {
    q: "Wie viele Lösungen hat die Gleichung x<sup>4</sup> = 81?",
    options: ["zwei: 3 und −3", "eine: 3", "vier", "keine"],
    correct: 0,
    explain: "Weil 4 gerade ist, gilt (−3)⁴ = 3⁴ = 81 — es gibt zwei Lösungen. Die Wurzel ⁴√81 ist dagegen als die nicht negative Zahl festgelegt und deshalb nur 3. Gleichung und Wurzel sind hier verschiedene Dinge.",
  });
}

// ================= Start =================

initBegriff();
initGesetze();
initGanzzahlig();
initZehnerpotenzen();
initPotenzfunktionen();
initWurzeln();
initExercises();
initQuizzes();
