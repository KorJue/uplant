// Selbstlernpfad "Zufall und Wahrscheinlichkeit" (Grundwissen Klasse 5-10).
// Rein clientseitiges Vanilla-JS, ohne Build-Schritt oder externe Bibliotheken.
//
// Leitgedanke: Die Wahrscheinlichkeit ist kein Orakel für den einzelnen Wurf,
// sondern der Wert, bei dem sich die relative Häufigkeit einpendelt. Deshalb
// steht in Abschnitt 3 eine echte Simulation, deren Kurve gegen P läuft — und
// deshalb wird in Abschnitt 5 gezeigt, dass Abzählen ohne Gleichwahrschein-
// lichkeit in die Irre führt.
//
// Durchgehende Farbcodierung: günstige Ergebnisse grün, Gegenereignis orange,
// Wahrscheinlichkeit violett, gemessene relative Häufigkeit blau.

"use strict";

import { mountUebungsaufgaben as mountUebungsaufgabenBasis } from "../../../aufgaben.js?v=2";

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
// Intl.NumberFormat, und das kostet rund 40-mal so viel wie das Formatieren selbst — bei jeder
// Reglerbewegung dutzendfach.
const ZAHLFORMATE = new Map();
function zahlformat(stellen) {
  let f = ZAHLFORMATE.get(stellen);
  if (!f) ZAHLFORMATE.set(stellen, (f = new Intl.NumberFormat("de-DE", { maximumFractionDigits: stellen })));
  return f;
}
function num(x, digits = 4) {
  return zahlformat(digits).format(x);
}
// "=" oder "≈"? Entscheidend ist, ob die Anzeige mit der gewählten Stellenzahl
// den Wert genau trifft — nicht, ob er ganzzahlig ist (0,25 ist exakt).
function zeichen(x, stellen = 2) {
  const f = Math.pow(10, stellen);
  return Math.abs(x - Math.round(x * f) / f) < 1e-12 ? "=" : "≈";
}
function randInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function ggt(a, b) {
  return b ? ggt(b, a % b) : Math.abs(a);
}
// Bruch in gekürzter Form, oder null, wenn schon gekürzt
function gekuerzt(z, n) {
  if (z === 0) return null;   // "0 : 1" wäre zwar richtig, aber irreführend
  const g = ggt(z, n);
  return g > 1 ? [z / g, n / g] : null;
}
function parseFlexibleNumber(raw) {
  if (raw == null) return NaN;
  const s = String(raw).trim().replace(/\s/g, "").replace(/−/g, "-").replace(/\./g, "").replace(",", ".");
  return parseFloat(s);
}
function neueFlaeche(w, h) {
  return svgEl("svg", { viewBox: `0 0 ${w} ${h}`, width: w, height: h, class: "geo-svg", preserveAspectRatio: "xMidYMid meet" });
}
function linie(p, q, klasse) {
  return svgEl("line", { x1: p.x.toFixed(2), y1: p.y.toFixed(2), x2: q.x.toFixed(2), y2: q.y.toFixed(2), class: klasse });
}
function begrenzt(id, wert, min, max) {
  const v = Math.min(max, Math.max(min, wert));
  const e = document.getElementById(id);
  if (Number(e.value) !== v) e.value = String(v);
  return v;
}
// Kreissektor als Pfad, Winkel in Grad, 0° zeigt nach oben
function sektor(M, r, vonGrad, bisGrad) {
  const p = (g) => ({
    x: M.x + r * Math.cos(((g - 90) * Math.PI) / 180),
    y: M.y + r * Math.sin(((g - 90) * Math.PI) / 180),
  });
  const a = p(vonGrad), b = p(bisGrad);
  const gross = bisGrad - vonGrad > 180 ? 1 : 0;
  return `M ${M.x.toFixed(2)} ${M.y.toFixed(2)} L ${a.x.toFixed(2)} ${a.y.toFixed(2)} ` +
    `A ${r.toFixed(2)} ${r.toFixed(2)} 0 ${gross} 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)} Z`;
}

// ---------- Quiz-Komponente ----------

function mountQuiz(container, { q, options, correct, explain }) {
  container.innerHTML = "";
  container.appendChild(el("p", { class: "quiz-q" }, "❓ " + q));
  const optWrap = el("div", { class: "quiz-options" });
  const feedback = el("div", { class: "quiz-feedback" });
  options.forEach((optText, i) => {
    const btn = el("button", { type: "button", class: "quiz-opt" }, optText);
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

// ================= 1. Ergebnis und Ereignis =================

const ER_EXPERIMENTE = {
  wuerfel: { name: "ein Würfel", omega: ["1", "2", "3", "4", "5", "6"], start: [5] },
  muenze2: { name: "eine Münze zweimal", omega: ["KK", "KZ", "ZK", "ZZ"], start: [1, 2] },
  rad8: { name: "Glücksrad mit 8 Feldern", omega: ["1", "2", "3", "4", "5", "6", "7", "8"], start: [0, 2, 4, 6] },
};
let erGewaehlt = new Set(ER_EXPERIMENTE.wuerfel.start);

function renderErgebnis() {
  const exp = ER_EXPERIMENTE[document.getElementById("er-exp").value];
  const omega = exp.omega;

  const chips = document.getElementById("er-chips");
  chips.innerHTML = "";
  omega.forEach((wert, i) => {
    const btn = el("button", { type: "button", class: "zu-chip" + (erGewaehlt.has(i) ? " guenstig" : "") }, wert);
    btn.addEventListener("click", () => {
      if (erGewaehlt.has(i)) erGewaehlt.delete(i);
      else erGewaehlt.add(i);
      renderErgebnis();
    });
    chips.appendChild(btn);
  });

  const eListe = omega.filter((_, i) => erGewaehlt.has(i));
  const k = eListe.length, n = omega.length;
  const p = k / n;
  const kurz = gekuerzt(k, n);

  document.getElementById("er-bilanz").innerHTML =
    `<span class="zu-menge"><span class="name">Ω</span> = { ${omega.join(" ; ")} } &nbsp;→&nbsp; <strong>|Ω| = ${n}</strong></span><br>` +
    `<span class="zu-menge"><span class="name">E</span> = { ${eListe.join(" ; ") || "&nbsp;"} } &nbsp;→&nbsp; <strong>|E| = ${k}</strong></span><br>` +
    `<span class="wp">P(E) = |E| : |Ω| = ${k} : ${n}` +
    (kurz ? ` = ${kurz[0]} : ${kurz[1]}` : "") +
    ` ${zeichen(p, 4)} ${num(p, 4)} ${zeichen(p * 100, 2)} ${num(p * 100, 2)} %</span>` +
    (k === 0 ? '<br><strong class="wo">Das ist das unmögliche Ereignis: P = 0.</strong>'
      : k === n ? '<br><strong class="wg">Das ist das sichere Ereignis: P = 1.</strong>' : "");

  document.getElementById("er-text").textContent =
    `Ein einzelnes Ergebnis ist ein Element von Ω, das Ereignis E ist eine Teilmenge. Hier gehören ${k} der ${n} Ergebnisse zu E — deshalb ist P(E) genau der Anteil ${k} von ${n}.`;
}

function initErgebnis() {
  document.getElementById("er-exp").addEventListener("change", () => {
    erGewaehlt = new Set(ER_EXPERIMENTE[document.getElementById("er-exp").value].start);
    renderErgebnis();
  });
  document.getElementById("er-alle").addEventListener("click", () => {
    const exp = ER_EXPERIMENTE[document.getElementById("er-exp").value];
    erGewaehlt = new Set(exp.omega.map((_, i) => i));
    renderErgebnis();
  });
  document.getElementById("er-keine").addEventListener("click", () => {
    erGewaehlt = new Set();
    renderErgebnis();
  });
  renderErgebnis();
}

// ================= 2. Die Laplace-Wahrscheinlichkeit =================

function renderLaplace() {
  const rot = Number(document.getElementById("lp-rot").value);
  const blau = Number(document.getElementById("lp-blau").value);
  document.getElementById("lp-rot-anzeige").textContent = rot;
  document.getElementById("lp-blau-anzeige").textContent = blau;
  const n = rot + blau;
  const pRot = rot / n, pBlau = blau / n;

  const svg = neueFlaeche(460, 210);
  const g = svgEl("g");
  // Urne: unten gerundeter Behälter
  g.appendChild(svgEl("path", {
    d: "M 130 30 L 130 150 Q 130 185 165 185 L 295 185 Q 330 185 330 150 L 330 30",
    class: "zu-urne",
  }));
  // Kugeln in Reihen anordnen
  // Die Kugeln stapeln sich von UNTEN: Die volle Reihe liegt am Boden, die
  // angebrochene obenauf. Andersherum schwebten zwei Kugeln unter einer vollen
  // Reihe — in einer Urne ein unmögliches Bild.
  const proReihe = 6, r = 13;
  for (let i = 0; i < n; i++) {
    const reihe = Math.floor(i / proReihe);
    const inReihe = Math.min(proReihe, n - reihe * proReihe);
    const spalte = i % proReihe;
    const cx = 230 - ((inReihe - 1) * (2 * r + 4)) / 2 + spalte * (2 * r + 4);
    const cy = 168 - reihe * (2 * r + 4);
    g.appendChild(svgEl("circle", { cx: cx.toFixed(2), cy: cy.toFixed(2), r, class: i < rot ? "zu-kugel-rot" : "zu-kugel-blau" }));
  }
  g.appendChild(svgText(230, 22, `${n} Kugeln, alle gleich groß und gleich schwer`, { class: "zu-achsentext" }));
  svg.appendChild(g);
  const mount = document.getElementById("lp-mount");
  mount.innerHTML = "";
  mount.appendChild(svg);

  const kurzRot = gekuerzt(rot, n);
  document.getElementById("lp-karten").innerHTML =
    `<div class="zu-karte p"><span class="name">P(rot)</span><span class="wert">${zeichen(pRot * 100, 1) === "=" ? "" : "≈ "}${num(pRot * 100, 1)} %</span></div>` +
    `<div class="zu-karte h"><span class="name">P(blau)</span><span class="wert">${zeichen(pBlau * 100, 1) === "=" ? "" : "≈ "}${num(pBlau * 100, 1)} %</span></div>` +
    `<div class="zu-karte anzahl"><span class="name">|Ω|</span><span class="wert">${n}</span></div>`;

  document.getElementById("lp-bilanz").innerHTML =
    `günstig für „rot“: <span class="wg">${rot}</span> &nbsp;·&nbsp; alle Kugeln: <strong>${n}</strong><br>` +
    `<span class="wp">P(rot) = ${rot} : ${n}${kurzRot ? ` = ${kurzRot[0]} : ${kurzRot[1]}` : ""} ${zeichen(pRot, 4)} ${num(pRot, 4)}</span><br>` +
    `<span class="wo">P(blau) = ${blau} : ${n} ${zeichen(pBlau, 4)} ${num(pBlau, 4)}</span><br>` +
    `Probe: <span class="wp">${num(pRot, 4)}</span> + <span class="wo">${num(pBlau, 4)}</span> = <strong>1</strong> — jede Kugel ist entweder rot oder blau.`;

  document.getElementById("lp-text").textContent =
    rot === blau
      ? "Gleich viele Kugeln jeder Farbe: Beide Wahrscheinlichkeiten sind ½. Das ist der einzige Fall, in dem „fifty-fifty“ zutrifft."
      : `Im Nenner steht immer die Gesamtzahl ${n}, nicht die Zahl der anderen Kugeln. Sonst käme ein Wert über 1 heraus — und den kann keine Wahrscheinlichkeit haben.`;
}

function initLaplace() {
  ["lp-rot", "lp-blau"].forEach((id) => document.getElementById(id).addEventListener("input", renderLaplace));
  renderLaplace();
}

// ================= 3. Das Gesetz der großen Zahlen =================

const GZ_EREIGNISSE = {
  sechs: { text: "eine 6", menge: [6], p: 1 / 6, bruch: "1 : 6" },
  gerade: { text: "eine gerade Zahl", menge: [2, 4, 6], p: 1 / 2, bruch: "3 : 6 = 1 : 2" },
  gross: { text: "eine Zahl größer als 4", menge: [5, 6], p: 1 / 3, bruch: "2 : 6 = 1 : 3" },
};
let gzWuerfe = [];
const GZ_MAX = 20000;

function wuerfeln(anzahl) {
  const platz = Math.min(anzahl, GZ_MAX - gzWuerfe.length);
  for (let i = 0; i < platz; i++) gzWuerfe.push(randInt(1, 6));
  renderGrosseZahlen();
}

function renderGrosseZahlen() {
  const ereignis = GZ_EREIGNISSE[document.getElementById("gz-ereignis").value];
  const n = gzWuerfe.length;

  // Verlauf der relativen Häufigkeit; für die Zeichnung reichen ~500 Stützstellen
  const folge = [];
  let treffer = 0;
  for (let i = 0; i < n; i++) {
    if (ereignis.menge.includes(gzWuerfe[i])) treffer++;
    folge.push(treffer / (i + 1));
  }
  const h = n ? treffer / n : 0;

  const svg = neueFlaeche(560, 260);
  const g = svgEl("g");
  const ox = 44, oy = 205, breite = 490, hoehe = 170;
  const maxN = Math.max(10, n);
  const xv = (i) => ox + (Math.log10(Math.max(1, i)) / Math.log10(maxN)) * breite;
  const yv = (p) => oy - p * hoehe;

  for (const p of [0, 0.25, 0.5, 0.75, 1]) {
    g.appendChild(linie({ x: ox, y: yv(p) }, { x: ox + breite, y: yv(p) }, "zu-gitter"));
    g.appendChild(svgText(ox - 8, yv(p) + 4, num(p, 2), { class: "zu-achsentext", "text-anchor": "end" }));
  }
  g.appendChild(linie({ x: ox, y: oy }, { x: ox + breite, y: oy }, "zu-achse"));
  g.appendChild(linie({ x: ox, y: oy }, { x: ox, y: yv(1) - 8 }, "zu-achse"));
  for (let e = 0; Math.pow(10, e) <= maxN; e++) {
    const i = Math.pow(10, e);
    g.appendChild(linie({ x: xv(i), y: oy }, { x: xv(i), y: oy + 5 }, "zu-achse"));
    g.appendChild(svgText(xv(i), oy + 19, num(i), { class: "zu-achsentext" }));
  }
  g.appendChild(svgText(ox + breite / 2, oy + 36, "Anzahl der Würfe (logarithmisch aufgetragen)", { class: "zu-achsentext" }));
  g.appendChild(svgText(ox - 30, yv(1) - 14, "h bzw. P", { class: "zu-achsentext", "text-anchor": "start" }));

  // Zielwert P
  g.appendChild(linie({ x: ox, y: yv(ereignis.p) }, { x: ox + breite, y: yv(ereignis.p) }, "zu-ziel"));
  g.appendChild(svgText(ox + breite - 4, yv(ereignis.p) - 6, "P = " + ereignis.bruch.split("= ").pop() + " " + zeichen(ereignis.p, 3) + " " + num(ereignis.p, 3),
    { class: "zu-zieltext", "text-anchor": "end" }));

  if (n > 0) {
    const schritt = Math.max(1, Math.floor(n / 500));
    const punkte = [];
    for (let i = 0; i < n; i += schritt) punkte.push(`${xv(i + 1).toFixed(2)},${yv(folge[i]).toFixed(2)}`);
    punkte.push(`${xv(n).toFixed(2)},${yv(folge[n - 1]).toFixed(2)}`);
    g.appendChild(svgEl("polyline", { points: punkte.join(" "), class: "zu-kurve" }));
    g.appendChild(svgEl("circle", { cx: xv(n).toFixed(2), cy: yv(h).toFixed(2), r: 4, fill: "#1d4ed8" }));
  }

  svg.appendChild(g);
  const mount = document.getElementById("gz-mount");
  mount.innerHTML = "";
  mount.appendChild(svg);

  document.getElementById("gz-karten").innerHTML =
    `<div class="zu-karte anzahl"><span class="name">Würfe n</span><span class="wert">${num(n)}</span></div>` +
    `<div class="zu-karte anzahl"><span class="name">Treffer H</span><span class="wert">${num(treffer)}</span></div>` +
    `<div class="zu-karte h"><span class="name">relative Häufigkeit h</span><span class="wert">${n ? (zeichen(h, 3) === "=" ? "" : "≈ ") + num(h, 3) : "—"}</span></div>` +
    `<div class="zu-karte p"><span class="name">Wahrscheinlichkeit P</span><span class="wert">${zeichen(ereignis.p, 3) === "=" ? "" : "≈ "}${num(ereignis.p, 3)}</span></div>`;

  document.getElementById("gz-bilanz").innerHTML = n === 0
    ? "Noch kein Wurf. Drücke einen der Knöpfe — und beobachte, wie unruhig die Kurve am Anfang ist."
    : `<span class="wh">h = H : n = ${num(treffer)} : ${num(n)} ${zeichen(h, 4)} ${num(h, 4)}</span> &nbsp;·&nbsp; ` +
      `<span class="wp">P = ${ereignis.bruch} ${zeichen(ereignis.p, 4)} ${num(ereignis.p, 4)}</span><br>` +
      `Abstand |h − P| <span class="wo">${zeichen(Math.abs(h - ereignis.p), 4)} ${num(Math.abs(h - ereignis.p), 4)}</span>` +
      ` &nbsp;·&nbsp; Treffer über/unter der Erwartung: <strong>${treffer - n * ereignis.p >= 0 ? "+" : ""}${num(treffer - n * ereignis.p, 1)}</strong><br>` +
      (n >= GZ_MAX ? `<em>Mehr als ${num(GZ_MAX)} Würfe werden hier nicht gespeichert.</em>` : "");

  document.getElementById("gz-text").textContent = n === 0
    ? "Ganz links, bei wenigen Würfen, springt die relative Häufigkeit noch zwischen 0 und 1."
    : n < 30
      ? "Bei so wenigen Würfen sagt die relative Häufigkeit fast nichts. Sie kann weit von P entfernt liegen — das ist kein Widerspruch, sondern der Normalfall."
      : n < 500
        ? "Die Ausschläge werden kleiner. Beachte: Der Abstand der Trefferzahl zur Erwartung wird dabei nicht unbedingt kleiner — nur ihr Anteil an immer mehr Würfen."
        : "Die Kurve legt sich an die violette Linie. Genau das ist mit „die relative Häufigkeit pendelt sich bei P ein“ gemeint.";
}

function initGrosseZahlen() {
  document.getElementById("gz-ereignis").addEventListener("change", renderGrosseZahlen);
  document.getElementById("gz-plus1").addEventListener("click", () => wuerfeln(1));
  document.getElementById("gz-plus10").addEventListener("click", () => wuerfeln(10));
  document.getElementById("gz-plus100").addEventListener("click", () => wuerfeln(100));
  document.getElementById("gz-plus1000").addEventListener("click", () => wuerfeln(1000));
  document.getElementById("gz-reset").addEventListener("click", () => {
    gzWuerfe = [];
    renderGrosseZahlen();
  });
  wuerfeln(100);
}

// ================= 4. Das Gegenereignis =================

const GE_EREIGNISSE = {
  sechs: { text: "eine 6", menge: [6], gegentext: "keine 6" },
  gerade: { text: "eine gerade Zahl", menge: [2, 4, 6], gegentext: "eine ungerade Zahl" },
  mind3: { text: "mindestens eine 3", menge: [3, 4, 5, 6], gegentext: "höchstens eine 2" },
  prim: { text: "eine Primzahl", menge: [2, 3, 5], gegentext: "keine Primzahl" },
};

function renderGegen() {
  const e = GE_EREIGNISSE[document.getElementById("ge-ereignis").value];
  const omega = [1, 2, 3, 4, 5, 6];
  const k = e.menge.length, n = omega.length;
  const p = k / n, pGegen = 1 - p;

  const chips = document.getElementById("ge-chips");
  chips.innerHTML = "";
  omega.forEach((w) => {
    chips.appendChild(el("button", {
      type: "button", disabled: "disabled",
      class: "zu-chip " + (e.menge.includes(w) ? "guenstig" : "gegen"),
    }, String(w)));
  });

  document.getElementById("ge-balken").innerHTML =
    `<div class="teil-e" style="width:${(p * 100).toFixed(2)}%">${p >= 0.18 ? "P(E) = " + num(p, 3) : ""}</div>` +
    `<div class="teil-gegen" style="width:${(pGegen * 100).toFixed(2)}%">${pGegen >= 0.18 ? "P(Ē) = " + num(pGegen, 3) : ""}</div>`;

  const kurz = gekuerzt(k, n), kurzG = gekuerzt(n - k, n);
  document.getElementById("ge-bilanz").innerHTML =
    `<span class="wg">E = „${e.text}“ = { ${e.menge.join(" ; ")} }</span> &nbsp;→&nbsp; ` +
    `<span class="wp">P(E) = ${k} : ${n}${kurz ? ` = ${kurz[0]} : ${kurz[1]}` : ""} ${zeichen(p, 4)} ${num(p, 4)}</span><br>` +
    `<span class="wo">Ē = „${e.gegentext}“ = { ${omega.filter((w) => !e.menge.includes(w)).join(" ; ")} }</span> &nbsp;→&nbsp; ` +
    `<span class="wo">P(Ē) = ${n - k} : ${n}${kurzG ? ` = ${kurzG[0]} : ${kurzG[1]}` : ""} ${zeichen(pGegen, 4)} ${num(pGegen, 4)}</span><br>` +
    `Probe: <span class="wp">${num(p, 4)}</span> + <span class="wo">${num(pGegen, 4)}</span> = <strong>1</strong>` +
    ` &nbsp;·&nbsp; und ${k} + ${n - k} = ${n} = |Ω|.`;

  document.getElementById("ge-text").textContent =
    `Jedes der ${n} Ergebnisse liegt in genau einer der beiden Mengen — nie in beiden, nie in keiner. Deshalb ergänzen sich die Wahrscheinlichkeiten zu 1, und man kann die eine aus der anderen ausrechnen.`;
}

function initGegen() {
  document.getElementById("ge-ereignis").addEventListener("change", renderGegen);
  renderGegen();
}

// ================= 5. Wenn Abzählen nicht reicht =================

const NL_FARBEN = ["#1d4ed8", "#157347", "#b3650a", "#8a5cf6"];
const NL_NAMEN = ["A", "B", "C", "D"];

function renderNichtLaplace() {
  const d = begrenzt("nl-spreizung", Number(document.getElementById("nl-spreizung").value), 0, 28);
  document.getElementById("nl-spreizung-anzeige").textContent = d === 0 ? "0 (alle gleich groß)" : d;
  // Konstruktion: die vier Winkel bleiben immer zusammen 360°
  const winkel = [90 + 3 * d, 90 + d, 90 - d, 90 - 3 * d];

  const svg = neueFlaeche(420, 260);
  const g = svgEl("g");
  const M = { x: 150, y: 134 }, r = 96;
  let start = 0;
  winkel.forEach((w, i) => {
    g.appendChild(svgEl("path", { d: sektor(M, r, start, start + w), fill: NL_FARBEN[i], "fill-opacity": 0.55, class: "zu-sektor" }));
    const mitte = ((start + start + w) / 2 - 90) * Math.PI / 180;
    g.appendChild(svgText(M.x + r * 0.62 * Math.cos(mitte), M.y + r * 0.62 * Math.sin(mitte) + 4,
      NL_NAMEN[i], { class: "zu-sektortext" }));
    start += w;
  });
  g.appendChild(linie({ x: M.x, y: M.y }, { x: M.x, y: M.y - r - 12 }, "zu-zeiger"));
  g.appendChild(svgText(M.x, M.y - r - 18, "Zeiger", { class: "zu-achsentext" }));
  // Legende
  winkel.forEach((w, i) => {
    const y = 60 + i * 30;
    g.appendChild(svgEl("rect", { x: 286, y: y - 11, width: 14, height: 14, rx: 3, fill: NL_FARBEN[i], "fill-opacity": 0.55 }));
    g.appendChild(svgText(308, y, `${NL_NAMEN[i]}: ${num(w)}°`, { class: "zu-achsentext", "text-anchor": "start" }));
  });
  svg.appendChild(g);
  const mount = document.getElementById("nl-mount");
  mount.innerHTML = "";
  mount.appendChild(svg);

  let zeilen = '<tr><th>Feld</th><th>Winkel α</th><th>P = α : 360°</th><th>Abzählen ergäbe</th></tr>';
  winkel.forEach((w, i) => {
    const p = w / 360;
    zeilen += `<tr><td><strong>${NL_NAMEN[i]}</strong></td><td>${num(w)}°</td>` +
      `<td class="p">${zeichen(p, 4)} ${num(p, 4)}</td>` +
      `<td class="${d === 0 ? "laplace" : ""}">1 : 4 = 0,25${d === 0 ? " ✓" : " ✗"}</td></tr>`;
  });
  zeilen += `<tr class="summe"><td>Summe</td><td>360°</td><td class="p">1</td><td>1</td></tr>`;
  document.getElementById("nl-tabelle").innerHTML = zeilen;

  const groesste = Math.max(...winkel) / 360, kleinste = Math.min(...winkel) / 360;
  document.getElementById("nl-bilanz").innerHTML = d === 0
    ? `Alle vier Felder haben <span class="wg">90°</span>. Nur jetzt sind die vier Ergebnisse gleich wahrscheinlich, und nur jetzt darf man abzählen: ` +
      `<span class="wp">P = 1 : 4 = 0,25</span> für jedes Feld.`
    : `Die Felder sind <span class="wo">verschieden groß</span>: von ${num(Math.min(...winkel))}° bis ${num(Math.max(...winkel))}°.<br>` +
      `<span class="wp">P(größtes Feld) = ${num(Math.max(...winkel))}° : 360° ${zeichen(groesste, 4)} ${num(groesste, 4)}</span>, ` +
      `<span class="wp">P(kleinstes) = ${num(Math.min(...winkel))}° : 360° ${zeichen(kleinste, 4)} ${num(kleinste, 4)}</span><br>` +
      `Abzählen würde für <em>beide</em> 0,25 liefern — das ist hier <strong class="wo">falsch</strong>. ` +
      `Das größte Feld ist ${zeichen(groesste / kleinste, 2) === "=" ? "genau" : "rund"} ${num(groesste / kleinste, 2)}-mal so wahrscheinlich wie das kleinste.`;

  document.getElementById("nl-text").textContent = d === 0
    ? "Vier gleich große Sektoren — ein Laplace-Experiment. Ziehe den Regler und beobachte, ab wann das Abzählen falsch wird."
    : "Vier Ergebnisse sind es nach wie vor. Aber gleich wahrscheinlich sind sie nicht mehr — und damit ist die Laplace-Formel nicht anwendbar.";
}

function initNichtLaplace() {
  document.getElementById("nl-spreizung").addEventListener("input", renderNichtLaplace);
  renderNichtLaplace();
}

// ================= 8. Gestaffelte Übungsaufgaben =================

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
  return sauber.length ? pick(sauber) : notfall;
}

// Aufgabe 1 — Laplace-Wahrscheinlichkeit aus einer Urne, Antwort in Prozent.
// Die Gesamtzahl teilt 100 glatt, damit der Prozentsatz ganzzahlig ist.
function generateAufgabe1() {
  const n = pick([4, 5, 10, 20, 25]);
  const kandidaten = [];
  for (let r = 1; r <= n - 1; r++) kandidaten.push(r);
  const rot = ohneKollision(
    kandidaten,
    (r) => [(r * 100) / n, ((n - r) * 100) / n, r, n - r, (r * 100) / (n - r)],
    kandidaten[0]
  );
  const blau = n - rot;
  const prozent = (rot * 100) / n;

  return {
    promptHtml:
      // Der Satzbau kommt auch mit einer einzelnen Kugel aus: „1 rote und 4 blaue Kugeln“ wäre
      // schief, „Kugeln in zwei Farben: 1 rote und 4 blaue“ nicht.
      `In einer Urne liegen Kugeln in zwei Farben: <strong>${num(rot)} rote</strong> und <strong>${num(blau)} blaue</strong>. ` +
      `Sie unterscheiden sich nur in der Farbe.<br>` +
      `Wie groß ist die Wahrscheinlichkeit, eine <strong>rote</strong> Kugel zu ziehen, in Prozent?`,
    correct: prozent,
    placeholder: "P in %",
    hinweis: (raw, val) => {
      if (Math.abs(val - (rot * 100) / blau) < 0.01)
        return `Du hast durch die Zahl der <strong>blauen</strong> Kugeln geteilt. Im Nenner steht die Gesamtzahl ${num(n)} — sonst käme ein Wert über 100 % heraus.`;
      if (Math.abs(val - ((n - rot) * 100) / n) < 0.01)
        return `${num(((n - rot) * 100) / n)} % ist die Wahrscheinlichkeit für <strong>blau</strong>. Gefragt war rot.`;
      if (Math.abs(val - rot) < 0.01)
        return `${num(rot)} ist die <strong>Anzahl</strong> der roten Kugeln, nicht die Wahrscheinlichkeit. Teile durch ${num(n)} und rechne in Prozent um.`;
      if (Math.abs(val - blau) < 0.01)
        return `${num(blau)} ist die Anzahl der <strong>blauen</strong> Kugeln.`;
      return `P = günstige : alle = ${num(rot)} : ${num(n)}, dann · 100 %.`;
    },
    tipps: [
      "Alle Kugeln sind gleich wahrscheinlich — deshalb darf die Laplace-Formel benutzt werden.",
      `Wie viele Kugeln sind es insgesamt? ${num(rot)} + ${num(blau)} = ${num(n)}.`,
      `P(rot) = ${num(rot)} : ${num(n)}, für Prozent noch mit 100 multiplizieren.`,
    ],
    musterloesungHtml:
      `<strong>1. Alle Ergebnisse zählen:</strong> |Ω| = ${num(rot)} + ${num(blau)} = <strong>${num(n)}</strong><br>` +
      `<strong>2. Günstige zählen:</strong> |E| = <strong>${num(rot)}</strong><br>` +
      `<strong>3. Laplace:</strong> P(rot) = ${num(rot)} : ${num(n)} = ${num(rot / n, 4)} = <strong>${num(prozent)} %</strong><br>` +
      `<em>Probe:</em> P(blau) = ${num(((n - rot) * 100) / n)} %, zusammen 100 %.`,
  };
}

// Aufgabe 2 — Gegenereignis an einem Glücksrad mit gleich großen Feldern.
// n teilt 100 glatt (8 täte es nicht: 100 : 8 = 12,5), damit der
// Prozentsatz ganzzahlig bleibt.
function generateAufgabe2() {
  const n = pick([4, 5, 10, 20, 25]);
  const kandidaten = [];
  for (let k = 1; k <= n - 1; k++) kandidaten.push(k);
  const rot = ohneKollision(
    kandidaten,
    (k) => [((n - k) * 100) / n, (k * 100) / n, n - k, k, 100 - k],
    kandidaten[0]
  );
  const prozent = ((n - rot) * 100) / n;

  return {
    promptHtml:
      `Ein Glücksrad hat <strong>${num(n)} gleich große</strong> Felder. <strong>${num(rot)}</strong> davon sind rot, die übrigen nicht.<br>` +
      `Wie groß ist die Wahrscheinlichkeit, dass <strong>nicht</strong> rot kommt, in Prozent?`,
    correct: prozent,
    placeholder: "P(Ē) in %",
    hinweis: (raw, val) => {
      if (Math.abs(val - (rot * 100) / n) < 0.01)
        return `${num((rot * 100) / n)} % ist P(rot) — das Ereignis selbst. Gefragt ist das <strong>Gegenereignis</strong>: P(Ē) = 100 % − P(E).`;
      if (Math.abs(val - (n - rot)) < 0.01)
        return `${num(n - rot)} ist die <strong>Anzahl</strong> der nicht-roten Felder. Sie muss noch durch ${num(n)} geteilt und in Prozent umgerechnet werden.`;
      if (Math.abs(val - rot) < 0.01)
        return `${num(rot)} ist die Anzahl der <strong>roten</strong> Felder.`;
      if (Math.abs(val - (100 - rot)) < 0.01)
        return `Du hast die <strong>Anzahl</strong> von 100 abgezogen. Abgezogen wird aber der <em>Prozentsatz</em> ${num((rot * 100) / n)} %.`;
      return `Entweder direkt (${num(n)} − ${num(rot)}) : ${num(n)} oder über 100 % − P(rot).`;
    },
    tipps: [
      "„Nicht rot“ ist das <strong>Gegenereignis</strong> zu „rot“ — zusammen ergeben beide 100 %.",
      `Weg 1: Zähle die nicht-roten Felder — es sind ${num(n)} − ${num(rot)} = ${num(n - rot)}.`,
      `Weg 2: Rechne P(rot) = ${num(rot)} : ${num(n)} aus und ziehe das Ergebnis von 100 % ab.`,
    ],
    musterloesungHtml:
      `<strong>Weg 1 — direkt abzählen:</strong> nicht rot sind ${num(n)} − ${num(rot)} = ${num(n - rot)} Felder<br>` +
      `P(Ē) = ${num(n - rot)} : ${num(n)} = <strong>${num(prozent)} %</strong><br>` +
      `<strong>Weg 2 — über das Gegenereignis:</strong> P(rot) = ${num(rot)} : ${num(n)} = ${num((rot * 100) / n)} %<br>` +
      `P(Ē) = 100 % − ${num((rot * 100) / n)} % = <strong>${num(prozent)} %</strong><br>` +
      `<em>Beide Wege müssen dasselbe ergeben — das ist die Probe.</em>`,
  };
}

// Aufgabe 3 — vom Mittelpunktswinkel zur Wahrscheinlichkeit. Der Winkel ist ein
// Vielfaches von 18°, damit der Prozentsatz ganzzahlig wird.
function generateAufgabe3() {
  const kandidaten = [];
  for (let k = 1; k <= 19; k++) kandidaten.push(18 * k);
  const alpha = ohneKollision(
    kandidaten,
    (a) => [(a * 100) / 360, a, 360 / a, ((360 - a) * 100) / 360, a / 360],
    kandidaten[0]
  );
  const prozent = (alpha * 100) / 360;

  return {
    promptHtml:
      `Auf einem Glücksrad nimmt das Feld „Gewinn“ einen Kreisausschnitt mit dem Mittelpunktswinkel <strong>α = ${num(alpha)}°</strong> ein.<br>` +
      `Wie groß ist die Gewinnwahrscheinlichkeit in Prozent?`,
    correct: prozent,
    placeholder: "P in %",
    hinweis: (raw, val) => {
      if (Math.abs(val - alpha) < 0.01)
        return `${num(alpha)} ist der <strong>Winkel in Grad</strong>. Die Wahrscheinlichkeit ist sein Anteil am Vollkreis: ${num(alpha)}° : 360°.`;
      if (Math.abs(val - alpha / 360) < 0.001)
        return `${num(alpha / 360, 4)} ist P als <strong>Dezimalzahl</strong> — richtig gerechnet, aber gefragt war in Prozent. Es fehlt noch · 100.`;
      if (Math.abs(val - 360 / alpha) < 0.01)
        return `Du hast <strong>360 : α</strong> gerechnet. Der Anteil ist Teil durch Ganzes, also α : 360.`;
      if (Math.abs(val - ((360 - alpha) * 100) / 360) < 0.01)
        return `Das ist die Wahrscheinlichkeit für <strong>keinen</strong> Gewinn — das Gegenereignis.`;
      return `P = α : 360°, dann · 100 %.`;
    },
    tipps: [
      "Bei einem Glücksrad entscheidet nicht die Zahl der Felder, sondern ihre <em>Größe</em>.",
      `Der ganze Kreis hat 360°; das Gewinnfeld nimmt davon ${num(alpha)}° ein.`,
      `P = ${num(alpha)} : 360, für Prozent noch mit 100 multiplizieren.`,
    ],
    musterloesungHtml:
      `<strong>1. Anteil am Vollkreis:</strong> P = ${num(alpha)}° : 360° = ${num(alpha / 360, 4)}<br>` +
      `<strong>2. In Prozent:</strong> ${num(alpha / 360, 4)} · 100 % = <strong>${num(prozent)} %</strong><br>` +
      `<em>Probe:</em> Der Rest des Rades hat ${num(360 - alpha)}°, das sind ${num(((360 - alpha) * 100) / 360)} % — zusammen 100 %.`,
  };
}

// Aufgabe 4 — von der Wahrscheinlichkeit zur erwarteten Anzahl.
// Kein Ereignis mit genau drei günstigen Ergebnissen: Bei P = ½ wäre die
// erwartete Anzahl genauso groß wie die des Gegenereignisses, und der Hinweis
// darauf träfe denselben Wert wie die Lösung.
const A4_EREIGNISSE = [
  { text: "eine 6", guenstig: 1 },
  { text: "eine Zahl größer als 4", guenstig: 2 },
  { text: "eine Zahl kleiner als 3", guenstig: 2 },
  { text: "mindestens eine 3", guenstig: 4 },
  { text: "keine 6", guenstig: 5 },
];

function generateAufgabe4() {
  const e = pick(A4_EREIGNISSE);
  const p = e.guenstig / 6;
  // n so wählen, dass die erwartete Anzahl ganzzahlig ist
  const kandidaten = [];
  for (let n = 12; n <= 300; n += 6) kandidaten.push(n);
  const n = ohneKollision(
    kandidaten,
    (nn) => {
      const w = [nn * p, nn, nn - nn * p, p * 100];
      // Der Hinweis "durch die Anzahl der günstigen Ergebnisse geteilt" ergibt
      // bei genau einem günstigen Ergebnis wieder nn — dann entfällt er.
      if (e.guenstig > 1) w.push(nn / e.guenstig);
      return w;
    },
    kandidaten[0]
  );
  const erwartet = n * p;

  return {
    promptHtml:
      `Du würfelst <strong>${num(n)}-mal</strong> mit einem fairen Würfel.<br>` +
      `Wie oft ist dabei <strong>${e.text}</strong> zu erwarten?`,
    correct: erwartet,
    placeholder: "Anzahl",
    hinweis: (raw, val) => {
      if (Math.abs(val - p * 100) < 0.01)
        return `${num(p * 100, 2)} ist die <strong>Wahrscheinlichkeit in Prozent</strong>. Gefragt ist eine Anzahl — dazu muss noch mit der Wurfzahl ${num(n)} multipliziert werden.`;
      if (Math.abs(val - n) < 0.01)
        return `${num(n)} ist die Zahl <em>aller</em> Würfe. Nur ein Teil davon trifft das Ereignis.`;
      if (Math.abs(val - (n - erwartet)) < 0.01)
        return `${num(n - erwartet)} ist die erwartete Anzahl der <strong>übrigen</strong> Würfe — das Gegenereignis.`;
      if (e.guenstig > 1 && Math.abs(val - n / e.guenstig) < 0.01)
        return `Du hast durch die Zahl der günstigen Ergebnisse geteilt. Multipliziert wird mit <strong>P = ${num(e.guenstig)} : 6</strong>.`;
      return `Erst P bestimmen, dann mit der Anzahl der Würfe multiplizieren.`;
    },
    tipps: [
      `Zähle zuerst, wie viele der sechs Augenzahlen zum Ereignis „${e.text}“ gehören.`,
      `P = ${num(e.guenstig)} : 6 = ${num(p, 4)}.`,
      `Die erwartete Anzahl ist P · Wurfzahl, hier also ${num(p, 4)} · ${num(n)}.`,
    ],
    musterloesungHtml:
      `<strong>1. Wahrscheinlichkeit:</strong> Von den 6 Ergebnissen sind ${num(e.guenstig)} günstig, also P = ${num(e.guenstig)} : 6 = ${num(p, 4)}<br>` +
      `<strong>2. Erwartete Anzahl:</strong> ${num(n)} · ${num(p, 4)} = <strong>${num(erwartet)}</strong><br>` +
      `<em>Achtung:</em> Das ist ein <em>Erwartungswert</em>, keine Garantie. Bei ${num(n)} Würfen kommen in Wirklichkeit meist etwas mehr oder etwas weniger heraus — je größer die Wurfzahl, desto näher liegt der Anteil bei ${num(p, 4)}.`,
  };
}

// Aufgabe 2 — günstige Ergebnisse zählen. Vor jeder Laplace-Rechnung steht das Abzählen von |E|;
// hier wird es eigens verlangt, weil dort die meisten Fehler entstehen — nicht beim Dividieren.
const A2_ANZAHLEN = [6, 8, 10, 12, 15, 16, 20, 24, 25];
const PRIM = [2, 3, 5, 7, 11, 13, 17, 19, 23];

function generateAufgabe2b() {
  const n = pick(A2_ANZAHLEN);
  // m liegt echt im Inneren, damit „größer als m“ und „kleiner als m“ nie leer oder vollständig sind.
  const m = randInt(2, n - 1);
  const formen = [
    { text: "eine gerade Zahl", guenstig: Math.floor(n / 2) },
    { text: "eine ungerade Zahl", guenstig: n - Math.floor(n / 2) },
    { text: `eine Zahl größer als ${num(m)}`, guenstig: n - m },
    { text: `eine Zahl kleiner als ${num(m)}`, guenstig: m - 1 },
    { text: "eine durch 3 teilbare Zahl", guenstig: Math.floor(n / 3) },
    { text: "eine Primzahl", guenstig: PRIM.filter((p) => p <= n).length },
    { text: `die Zahl ${num(m)}`, guenstig: 1 },
  ];
  const e = pick(formen);
  const prozent = (e.guenstig * 100) / n;
  return {
    promptHtml:
      `In einem Beutel liegen Kärtchen mit den Zahlen <strong>1 bis ${num(n)}</strong>, jede genau einmal. ` +
      `Ein Kärtchen wird zufällig gezogen.<br>Ereignis E: <strong>${e.text}</strong>.<br>` +
      `<span class="progress-note">Runde die Wahrscheinlichkeit auf zwei Nachkommastellen.</span>`,
    felder: [
      {
        name: "Wie viele Kärtchen sind günstig?", soll: e.guenstig, toleranz: 0.01,
        hinweis: (roh, val) => {
          if (Math.abs(val - (n - e.guenstig)) < 0.01) return "So viele Kärtchen gehören zum <strong>Gegenereignis</strong>. Gefragt sind die, bei denen E eintritt.";
          if (Math.abs(val - n) < 0.01) return `${num(n)} ist die Zahl <em>aller</em> Kärtchen. Zähle nur die günstigen.`;
          return "";
        },
      },
      {
        name: "Wahrscheinlichkeit P(E)", soll: prozent, einheit: "%", toleranz: 0.015,
        hinweis: (roh, val) => {
          if (Math.abs(val - e.guenstig) < 0.015) return "Das ist die <strong>Anzahl</strong> der günstigen Kärtchen. Eine Wahrscheinlichkeit entsteht erst durch Teilen.";
          if (Math.abs(val - e.guenstig / n) < 0.015) return "Das ist P als <strong>Dezimalzahl</strong> — es fehlt noch die Multiplikation mit 100.";
          if (Math.abs(val - ((n - e.guenstig) * 100) / n) < 0.015) return "Das ist die Wahrscheinlichkeit des <strong>Gegenereignisses</strong>.";
          if (Math.abs(val - (n * 100) / e.guenstig) < 0.015) return "Du hast alle durch die günstigen geteilt. Bei Laplace steht die Gesamtzahl im <strong>Nenner</strong>.";
          return "";
        },
      },
    ],
    tipps: [
      "Schreibe dir notfalls alle Zahlen von 1 bis " + num(n) + " auf und streiche die ungünstigen durch.",
      "Die Laplace-Formel lautet P(E) = Anzahl der günstigen Ergebnisse : Anzahl aller Ergebnisse.",
      `Hier sind es ${num(n)} Ergebnisse insgesamt — und alle sind gleich wahrscheinlich, weil jede Zahl genau einmal vorkommt.`,
    ],
    musterloesungHtml:
      `<strong>1. Günstige zählen:</strong> |E| = <strong>${num(e.guenstig)}</strong><br>` +
      `<strong>2. Alle zählen:</strong> |Ω| = <strong>${num(n)}</strong><br>` +
      `<strong>3. Laplace:</strong> P(E) = ${num(e.guenstig)} : ${num(n)} = ${num(e.guenstig / n, 4)} = <strong>${num(prozent, 2)} %</strong><br>` +
      `<span class="progress-note">Die Formel darf man nur anwenden, weil alle Kärtchen gleich wahrscheinlich sind. ` +
      `Probe: Das Gegenereignis hat ${num(((n - e.guenstig) * 100) / n, 2)} % — zusammen 100 %.</span>`,
  };
}

// Aufgabe 4 — Wahrscheinlichkeit aus einem Versuch schätzen. Hier hilft Laplace nicht: Ein
// Reißnagel hat keine gleich wahrscheinlichen Seiten, die Wahrscheinlichkeit muss gemessen werden.
const A4_VERSUCHE = [
  { ding: "Ein Reißnagel", folge: (k) => `Dabei blieb er <strong>${k}-mal</strong> auf dem Kopf liegen.` },
  { ding: "Ein Kronkorken", folge: (k) => `Dabei landete er <strong>${k}-mal</strong> mit der gewölbten Seite nach oben.` },
  { ding: "Ein Papierbecher", folge: (k) => `Dabei blieb er <strong>${k}-mal</strong> auf der Seite liegen.` },
];

function generateAufgabe4b() {
  const v = pick(A4_VERSUCHE);
  const n = pick([200, 250, 400, 500]);
  const treffer = randInt(Math.round(n * 0.2), Math.round(n * 0.7));
  const weitere = randInt(2, 9) * 100;
  const prozent = (treffer * 100) / n;
  const erwartet = (treffer / n) * weitere;
  return {
    promptHtml:
      `${v.ding} wurde <strong>${num(n)}-mal</strong> geworfen. ${v.folge(num(treffer))}<br>` +
      `Wie oft wäre dasselbe bei <strong>${num(weitere)} weiteren Würfen</strong> zu erwarten?<br>` +
      `<span class="progress-note">Runde jeweils auf zwei Nachkommastellen.</span>`,
    felder: [
      {
        name: "Relative Häufigkeit", soll: prozent, einheit: "%", toleranz: 0.015,
        hinweis: (roh, val) => {
          if (Math.abs(val - treffer) < 0.015) return "Das ist die <strong>absolute</strong> Häufigkeit. Die relative entsteht durch Teilen durch die Zahl der Versuche.";
          if (Math.abs(val - treffer / n) < 0.015) return "Das ist der Anteil als <strong>Dezimalzahl</strong> — es fehlt noch · 100.";
          if (Math.abs(val - ((n - treffer) * 100) / n) < 0.015) return "Das ist der Anteil der <strong>übrigen</strong> Würfe.";
          return "";
        },
      },
      {
        name: "Erwartete Anzahl", soll: erwartet, toleranz: 0.015,
        hinweis: (roh, val) => {
          if (Math.abs(val - prozent) < 0.015) return "Das ist der <strong>Prozentsatz</strong>. Für eine Anzahl muss er noch mit der Zahl der Würfe multipliziert werden.";
          if (Math.abs(val - treffer) < 0.015) return `${num(treffer)} war das Ergebnis des <em>ersten</em> Versuchs mit ${num(n)} Würfen. Jetzt sind es ${num(weitere)} Würfe.`;
          if (Math.abs(val - weitere) < 0.015) return "Das sind alle neuen Würfe. Nur ein Teil davon trifft das Ereignis.";
          return "";
        },
      },
    ],
    tipps: [
      "Laplace hilft hier nicht: Die beiden Lagen sind <em>nicht</em> gleich wahrscheinlich. Die Wahrscheinlichkeit muss aus dem Versuch geschätzt werden.",
      `Relative Häufigkeit: ${num(treffer)} : ${num(n)}.`,
      `Diesen Anteil auf ${num(weitere)} Würfe übertragen — das ist ein Dreisatz.`,
    ],
    musterloesungHtml:
      `<strong>1. Relative Häufigkeit:</strong> ${num(treffer)} : ${num(n)} = ${num(treffer / n, 4)} = <strong>${num(prozent, 2)} %</strong><br>` +
      `<strong>2. Übertragen:</strong> ${num(weitere)} · ${num(treffer / n, 4)} = <strong>${num(erwartet, 2)}</strong><br>` +
      `<span class="progress-note">Das ist eine <em>Schätzung</em>, keine exakte Wahrscheinlichkeit: Ein Reißnagel hat keine Symmetrie, aus der sich P berechnen ließe. ` +
      `Je mehr Versuche, desto verlässlicher die Schätzung — das ist das empirische Gesetz der großen Zahlen. ` +
      `Und der erwartete Wert wird selten genau eintreten.</span>`,
  };
}

// Aufgabe 6 — rückwärts: aus der Wahrscheinlichkeit auf die Anzahl schließen und die Urne dann
// so verändern, dass ein vorgegebener Anteil herauskommt.
function generateAufgabe6() {
  const n = pick([20, 25, 40, 50]);
  const teiler = pick([2, 4, 5]);            // Ziel-Wahrscheinlichkeit 50 %, 25 % oder 20 %
  const ziel = 100 / teiler;
  // rot so wählen, dass die Zielzahl größer als n ist — sonst müsste man Kugeln wegnehmen.
  const moeglich = [];
  for (let r = 1; r < n; r++) if (teiler * r > n && (r * 100) % n === 0) moeglich.push(r);
  const rot = moeglich.length ? pick(moeglich) : Math.ceil((n + 1) / teiler);
  const prozent = (rot * 100) / n;
  const gesamtNeu = teiler * rot;
  const dazu = gesamtNeu - n;
  return {
    promptHtml:
      `In einer Urne liegen <strong>${num(n)} Kugeln</strong>. Die Wahrscheinlichkeit, eine <strong>rote</strong> zu ziehen, ` +
      `beträgt <strong>${num(prozent)} %</strong>.<br>` +
      `Anschließend werden blaue Kugeln hinzugelegt, bis die Wahrscheinlichkeit für Rot nur noch ` +
      `<strong>${num(ziel)} %</strong> beträgt.`,
    felder: [
      {
        name: "Wie viele Kugeln sind rot?", soll: rot, toleranz: 0.01,
        hinweis: (roh, val) => {
          if (Math.abs(val - prozent) < 0.01) return `Das ist der <strong>Prozentsatz</strong>, nicht die Anzahl. Gesucht ist, wie viele Kugeln ${num(prozent)} % von ${num(n)} sind.`;
          if (Math.abs(val - (n - rot)) < 0.01) return "So viele Kugeln sind <strong>nicht</strong> rot.";
          if (Math.abs(val - (n * 100) / prozent) < 0.01) return "Du hast geteilt statt multipliziert. Der Anteil wird auf die Gesamtzahl <em>angewendet</em>.";
          return "";
        },
      },
      {
        name: "Wie viele blaue Kugeln kommen dazu?", soll: dazu, toleranz: 0.01,
        hinweis: (roh, val) => {
          if (Math.abs(val - gesamtNeu) < 0.01) return `${num(gesamtNeu)} ist die <strong>neue Gesamtzahl</strong>. Gefragt ist, wie viele Kugeln dazukommen — die ${num(n)} vorhandenen also noch abziehen.`;
          if (Math.abs(val - rot) < 0.01) return "Die Zahl der roten Kugeln ändert sich nicht; es kommen nur blaue dazu.";
          if (Math.abs(val - (n - rot)) < 0.01) return "Das sind die blauen Kugeln, die schon da sind. Gefragt ist, wie viele noch dazukommen müssen.";
          return "";
        },
      },
    ],
    tipps: [
      `${num(prozent)} % von ${num(n)} Kugeln — das ist ein gewöhnlicher Prozentsatz.`,
      `Beim zweiten Schritt bleibt die Zahl der roten Kugeln gleich; nur die Gesamtzahl wächst.`,
      `Aus ${num(rot)} : Gesamt = ${num(ziel)} % folgt Gesamt = ${num(rot)} · ${num(teiler)}.`,
    ],
    musterloesungHtml:
      `<strong>1. Rote Kugeln:</strong> ${num(prozent)} % von ${num(n)} = ${num(n)} · ${num(prozent / 100, 4)} = <strong>${num(rot)}</strong><br>` +
      `<strong>2. Neue Gesamtzahl:</strong> Damit ${num(rot)} rote Kugeln einen Anteil von ${num(ziel)} % ausmachen, ` +
      `müssen es insgesamt ${num(rot)} · ${num(teiler)} = <strong>${num(gesamtNeu)}</strong> Kugeln sein.<br>` +
      `<strong>3. Dazugelegt:</strong> ${num(gesamtNeu)} − ${num(n)} = <strong>${num(dazu)} blaue Kugeln</strong><br>` +
      `<span class="progress-note">Probe: ${num(rot)} : ${num(gesamtNeu)} = ${num(rot / gesamtNeu, 4)} = ${num(ziel)} % ✓ &nbsp;· ` +
      `Der Zähler bleibt, der Nenner wächst — deshalb sinkt die Wahrscheinlichkeit.</span>`,
  };
}

// Aufgabe 8 — ein Glücksspiel durchgerechnet. Der Erwartungswert sagt nicht, was passiert,
// sondern was auf lange Sicht herauskommt — und für wen.
function generateAufgabe8() {
  const n = pick([4, 5, 6, 8, 10, 12]);
  const gewinnfelder = randInt(1, n - 1);
  const auszahlung = randInt(2, 10);
  const spiele = n * randInt(3, 12);
  const gewinne = (spiele * gewinnfelder) / n;   // ganzzahlig, weil spiele ein Vielfaches von n ist
  const summeAus = gewinne * auszahlung;
  // Der Einsatz wird so gewählt, dass das Spiel nicht zufällig genau fair ist: Sonst wäre die
  // dritte Antwort 0, und „Gewinn oder Verlust“ ließe sich nicht unterscheiden.
  const einsatz = pick([1, 2, 3, 4, 5].filter((e) => e * spiele !== summeAus));
  const bilanz = summeAus - einsatz * spiele;
  return {
    promptHtml:
      `Ein Glücksrad hat <strong>${num(n)} gleich große</strong> Felder; ` +
      `<strong>${num(gewinnfelder)}</strong> ${gewinnfelder === 1 ? "davon ist ein Gewinnfeld" : "davon sind Gewinnfelder"}. ` +
      `Wer ein Gewinnfeld trifft, bekommt <strong>${num(auszahlung)} €</strong> ausgezahlt.<br>` +
      `Ein Spiel kostet <strong>${num(einsatz)} €</strong> Einsatz. Jemand spielt <strong>${num(spiele)}-mal</strong>.`,
    felder: [
      {
        name: "Wie viele Gewinne sind zu erwarten?", soll: gewinne, toleranz: 0.01,
        hinweis: (roh, val) => {
          if (Math.abs(val - spiele) < 0.01) return "Das sind <em>alle</em> Spiele. Nur ein Teil davon endet auf einem Gewinnfeld.";
          if (Math.abs(val - gewinnfelder) < 0.01) return "Das ist die Zahl der Gewinnfelder. Multipliziere die Wahrscheinlichkeit mit der Zahl der Spiele.";
          if (Math.abs(val - spiele / gewinnfelder) < 0.01) return `Du hast durch ${num(gewinnfelder)} geteilt. Die Wahrscheinlichkeit ist ${num(gewinnfelder)} : ${num(n)} — damit wird multipliziert.`;
          return "";
        },
      },
      {
        name: "Wie viel wird insgesamt ausgezahlt?", soll: summeAus, einheit: "€", toleranz: 0.01,
        hinweis: (roh, val) => {
          if (Math.abs(val - auszahlung) < 0.01) return "Das ist die Auszahlung für <em>einen</em> Gewinn.";
          if (Math.abs(val - spiele * auszahlung) < 0.01) return "Ausgezahlt wird nur bei einem <strong>Gewinn</strong>, nicht bei jedem Spiel.";
          if (Math.abs(val - einsatz * spiele) < 0.01) return "Das sind die gezahlten <strong>Einsätze</strong>, nicht die Auszahlung.";
          return "";
        },
      },
      {
        name: "Gewinn (+) oder Verlust (−) der spielenden Person", soll: bilanz, einheit: "€", toleranz: 0.01,
        hinweis: (roh, val) => {
          if (Math.abs(val - summeAus) < 0.01) return `Das ist die Auszahlung. Die ${num(spiele)} Einsätze von je ${num(einsatz)} € müssen noch abgezogen werden.`;
          if (Math.abs(val - einsatz * spiele) < 0.01) return "Das sind die Einsätze allein. Gefragt ist die Bilanz: Auszahlung minus Einsätze.";
          if (Math.abs(val + bilanz) < 0.01) return "Das Vorzeichen stimmt nicht: Rechne Auszahlung <em>minus</em> Einsätze.";
          return "";
        },
      },
    ],
    tipps: [
      `Die Gewinnwahrscheinlichkeit ist ${num(gewinnfelder)} : ${num(n)}.`,
      `Die erwartete Zahl der Gewinne ist ${num(spiele)} · ${num(gewinnfelder)} : ${num(n)}.`,
      "Die Bilanz ist Auszahlung minus alle Einsätze — auch die verlorenen Spiele kosten Einsatz.",
    ],
    musterloesungHtml:
      `① P(Gewinn) = ${num(gewinnfelder)} : ${num(n)} = ${num(gewinnfelder / n, 4)}<br>` +
      `② erwartete Gewinne: ${num(spiele)} · ${num(gewinnfelder / n, 4)} = <strong>${num(gewinne)}</strong><br>` +
      `③ Auszahlung: ${num(gewinne)} · ${num(auszahlung)} € = <strong>${num(summeAus)} €</strong><br>` +
      `④ Einsätze: ${num(spiele)} · ${num(einsatz)} € = ${num(einsatz * spiele)} €<br>` +
      `⑤ Bilanz: ${num(summeAus)} − ${num(einsatz * spiele)} = <strong>${num(bilanz)} €</strong><br>` +
      `<span class="progress-note">${bilanz > 0
        ? `Auf lange Sicht gewinnt hier die spielende Person — ein Glücksrad, das sich für den Betreiber nicht rechnet.`
        : `Auf lange Sicht verliert die spielende Person ${num(-bilanz)} € — davon lebt der Betreiber.`} ` +
      `Je Spiel sind das ${num(bilanz / spiele, 2)} €. Fair wäre ein Einsatz von ${num(summeAus / spiele, 2)} €. ` +
      `Der Erwartungswert sagt nichts über den einzelnen Abend: Er beschreibt, wohin es auf die Dauer läuft.</span>`,
  };
}

function initExercises() {
  mountUebungsaufgaben(document.getElementById("exercises-mount"), [
    { schwierigkeit: "einfach", titel: "Aufgabe 1 — Laplace-Wahrscheinlichkeit", generate: generateAufgabe1 },
    { schwierigkeit: "einfach", titel: "Aufgabe 2 — Günstige Ergebnisse zählen", generate: generateAufgabe2b },
    { schwierigkeit: "mittel", titel: "Aufgabe 3 — Gegenereignis", generate: generateAufgabe2 },
    { schwierigkeit: "mittel", titel: "Aufgabe 4 — Wahrscheinlichkeit schätzen", generate: generateAufgabe4b },
    { schwierigkeit: "schwierig", titel: "Aufgabe 5 — vom Winkel zur Wahrscheinlichkeit", generate: generateAufgabe3 },
    { schwierigkeit: "schwierig", titel: "Aufgabe 6 — Die Urne verändern", generate: generateAufgabe6 },
    { schwierigkeit: "komplex", titel: "Aufgabe 7 — erwartete Anzahl", generate: generateAufgabe4 },
    { schwierigkeit: "komplex", titel: "Aufgabe 8 — Lohnt sich das Glücksrad?", generate: generateAufgabe8 },
  ]);
}

// ================= Quizze =================

function initQuizzes() {
  mountQuiz(document.getElementById("quiz-ergebnis"), {
    q: "Beim Werfen zweier Münzen ist Ω = {KK; KZ; ZK; ZZ}. Wie groß ist die Wahrscheinlichkeit für „genau einmal Kopf“?",
    options: ["1 : 4", "1 : 2", "1 : 3", "2 : 3"],
    correct: 1,
    explain: "Genau einmal Kopf tritt bei KZ und ZK ein, also bei 2 von 4 Ergebnissen: P = 2 : 4 = 1 : 2. Wer nur „einmal Kopf“ als ein Ergebnis zählt, übersieht, dass die Reihenfolge zwei verschiedene Ergebnisse liefert.",
  });
  mountQuiz(document.getElementById("quiz-laplace"), {
    q: "In einer Urne sind 4 rote und 6 blaue Kugeln. Wie groß ist P(rot)?",
    options: ["4 : 6 ≈ 0,67", "4 : 10 = 0,4", "6 : 10 = 0,6", "1 : 4 = 0,25"],
    correct: 1,
    explain: "Im Nenner steht die Gesamtzahl 4 + 6 = 10, nicht die Zahl der blauen Kugeln. Die 0,67 wäre größer als der Anteil aller roten Kugeln überhaupt sein kann — ein Wert über 1 wäre sogar unmöglich.",
  });
  mountQuiz(document.getElementById("quiz-grosse-zahlen"), {
    q: "Eine Münze zeigte fünfmal hintereinander Kopf. Wie groß ist die Wahrscheinlichkeit für Zahl beim sechsten Wurf?",
    options: ["größer als ½, weil Zahl „fällig“ ist", "genau ½ wie immer", "kleiner als ½, weil Kopf gerade läuft", "das hängt von der Münze ab"],
    correct: 1,
    explain: "Die Münze hat kein Gedächtnis: Jeder Wurf hat P = ½, unabhängig von allen vorigen. Was sich mit wachsender Wurfzahl ausgleicht, ist der Anteil — nicht die Differenz der Anzahlen.",
  });
  mountQuiz(document.getElementById("quiz-gegen"), {
    q: "Für ein Ereignis gilt P(E) = 0,35. Wie groß ist P(Ē)?",
    options: ["0,35", "0,65", "1,35", "0,5"],
    correct: 1,
    explain: "P(Ē) = 1 − P(E) = 1 − 0,35 = 0,65. Zusammen ergeben beide immer genau 1, denn eines von beiden tritt sicher ein.",
  });
  mountQuiz(document.getElementById("quiz-nichtlaplace"), {
    q: "Ein Glücksrad hat 3 Felder mit den Winkeln 180°, 120° und 60°. Wie groß ist P für das kleinste Feld?",
    options: ["1 : 3, weil es drei Felder sind", "60° : 360° = 1 : 6", "1 : 60", "60 %"],
    correct: 1,
    explain: "Die Felder sind verschieden groß, also ist es kein Laplace-Experiment — Abzählen führt hier in die Irre. Die Wahrscheinlichkeit ist der Anteil am Vollkreis: 60° : 360° = 1 : 6.",
  });
}

// ================= Start =================

initErgebnis();
initLaplace();
initGrosseZahlen();
initGegen();
initNichtLaplace();
initExercises();
initQuizzes();
