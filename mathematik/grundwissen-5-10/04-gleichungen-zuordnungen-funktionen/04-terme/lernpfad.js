// Selbstlernpfad "Terme" (Grundwissen Klasse 5-10, Kapitel 4).
// Rein clientseitiges Vanilla-JS, ohne Build-Schritt oder externe Bibliotheken.
//
// Leitgedanke: Termumformungen sind keine Zeichenregeln, sondern Aussagen über
// Flächen und Mengen. Deshalb bekommt jede Regel dieser Seite ein Bild:
// Abschnitt 2 zeichnet den Rechenbaum, an dem sich der letzte Rechenschritt
// ablesen lässt; Abschnitt 3 legt die Summanden als Algebra-Kacheln aus, so
// dass sichtbar wird, warum x und x² nicht zusammenpassen; Abschnitt 4 und 5
// zerlegen Rechtecke — das Distributivgesetz und alle drei binomischen
// Formeln sind nichts anderes als zwei Arten, dieselbe Fläche zu messen.
//
// Durchgehende Farbcodierung: Variable x violett, Zahlen blau,
// x²-Flächen grün, Rechenzeichen orange, Ergebnis rot.

"use strict";

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
  // Rechenzeichen statt Bindestrich: In einem Term steht ein Minus, kein
  // Trennstrich.
  return x.toLocaleString("de-DE", { maximumFractionDigits: digits }).replace("-", "−");
}
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function ggt(a, b) {
  return b ? ggt(b, a % b) : Math.abs(a);
}
function parseFlexibleNumber(raw) {
  if (raw == null) return NaN;
  const s = String(raw).trim().replace(/\s/g, "").replace(/−/g, "-").replace(/\./g, "").replace(",", ".");
  return parseFloat(s);
}
function neueFlaeche(w, h) {
  return svgEl("svg", { viewBox: `0 0 ${w} ${h}`, width: w, height: h, class: "geo-svg", preserveAspectRatio: "xMidYMid meet" });
}
function begrenzt(id, wertZahl, min, max) {
  const v = Math.min(max, Math.max(min, wertZahl));
  const e = document.getElementById(id);
  if (Number(e.value) !== v) e.value = String(v);
  return v;
}
function karte(klasse, name, inhalt) {
  return el("div", { class: "tm-karte " + klasse }, [
    el("span", { class: "name" }, name),
    el("span", { class: "wert", html: inhalt }),
  ]);
}
function faktor(text) {
  return `<span class="nw">${text}</span>`;
}

// ---------- Terme als Daten ----------
// Ein Term wird als kleiner Baum geführt: {op, links, rechts} für die
// Rechenzeichen, {x: true} für die Variable, {zahl: n} für eine Zahl. So
// lassen sich Struktur, Anzeige und Wert aus derselben Quelle ableiten —
// eine getrennt gepflegte Textfassung liefe früher oder später auseinander.

function zahl(n) { return { zahl: n }; }
const X = { x: true };
function plus(a, b) { return { op: "+", links: a, rechts: b }; }
function minus(a, b) { return { op: "−", links: a, rechts: b }; }
function mal(a, b) { return { op: "·", links: a, rechts: b }; }
function hoch(a, n) { return { op: "^", links: a, rechts: zahl(n) }; }

const RANG = { "+": 1, "−": 1, "·": 2, "^": 3 };

function termWert(t, x) {
  if (t.x) return x;
  if (t.zahl !== undefined) return t.zahl;
  const a = termWert(t.links, x), b = termWert(t.rechts, x);
  return t.op === "+" ? a + b : t.op === "−" ? a - b : t.op === "·" ? a * b : Math.pow(a, b);
}

// Anzeige mit genau so vielen Klammern, wie nötig sind. Überflüssige Klammern
// verstellen den Blick auf die Struktur, fehlende verfälschen sie.
function termHtml(t, aussenRang = 0) {
  if (t.x) return `<span class="xv">x</span>`;
  if (t.zahl !== undefined) return `<span class="zv">${num(t.zahl)}</span>`;
  const r = RANG[t.op];
  let inner;
  if (t.op === "^") {
    inner = termHtml(t.links, 4) + `<sup>${num(t.rechts.zahl)}</sup>`;
  } else if (t.op === "·") {
    // Zwischen einer Zahl und einer Variablen (oder deren Potenz) steht in
    // der üblichen Schreibweise kein Malpunkt: 2x, nicht 2 · x.
    const kurz = t.links.zahl !== undefined &&
      (t.rechts.x || (t.rechts.op === "^" && t.rechts.links.x));
    inner = termHtml(t.links, r) + (kurz ? "" : ` <span class="op">·</span> `) + termHtml(t.rechts, r);
  } else {
    inner = termHtml(t.links, r) + ` <span class="op">${t.op}</span> ` + termHtml(t.rechts, r + 1);
  }
  return r < aussenRang ? `(${inner})` : inner;
}
function termName(t) {
  if (t.x) return "eine Variable";
  if (t.zahl !== undefined) return "eine Zahl";
  return { "+": "eine Summe", "−": "eine Differenz", "·": "ein Produkt", "^": "eine Potenz" }[t.op];
}
function letzterSchritt(t) {
  return { "+": "Addition", "−": "Subtraktion", "·": "Multiplikation", "^": "Potenzieren" }[t.op];
}
// Für den Fließtext wird die Verbform gebraucht: "zuletzt wird addiert".
function letzterSchrittVerb(t) {
  return { "+": "addiert", "−": "subtrahiert", "·": "multipliziert", "^": "potenziert" }[t.op];
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

// ---------- Schrittprotokoll ----------

function schrittZeile(inhaltHtml, grundHtml, klasse = "", kommentar = "") {
  return `<div class="zeile ${klasse}">` +
    `<span class="tm">${inhaltHtml}</span>` +
    (grundHtml ? `<span class="grund">${grundHtml}</span>` : "") +
    (kommentar ? `<span class="kommentar">${kommentar}</span>` : "") +
    `</div>`;
}

// ================= 1. Term, Variable und Termwert =================

const TE_TERME = [
  { t: plus(mal(zahl(2), X), zahl(3)), name: "2x + 3" },
  { t: minus(hoch(X, 2), zahl(4)), name: "x² − 4" },
  { t: mal(zahl(3), plus(X, zahl(2))), name: "3 · (x + 2)" },
  { t: minus(zahl(10), mal(zahl(2), X)), name: "10 − 2x" },
  { t: plus(minus(hoch(X, 2), mal(zahl(2), X)), zahl(1)), name: "x² − 2x + 1" },
];

// Beim Einsetzen wird die Zahl in Klammern geschrieben — genau das soll die
// Zeile zeigen, denn hier verlieren Lernende sonst das Vorzeichen.
function eingesetztHtml(t, x) {
  if (t.x) return `<span class="erg hervor">(${num(x)})</span>`;
  if (t.zahl !== undefined) return `<span class="zv">${num(t.zahl)}</span>`;
  const r = RANG[t.op];
  let inner;
  if (t.op === "^") inner = eingesetztHtml(t.links, x) + `<sup>${num(t.rechts.zahl)}</sup>`;
  else if (t.op === "·") inner = eingesetztHtml(t.links, x) + ` <span class="op">·</span> ` + eingesetztHtml(t.rechts, x);
  else inner = eingesetztHtml(t.links, x) + ` <span class="op">${t.op}</span> ` + eingesetztHtml(t.rechts, x);
  return r < 2 && t.op !== "^" ? inner : inner;
}

function renderTermwert() {
  const nr = Number(document.getElementById("te-term").value);
  const x = begrenzt("te-x", Number(document.getElementById("te-x").value), -5, 6);
  const eintrag = TE_TERME[nr];
  const t = eintrag.t;
  const wert = termWert(t, x);

  document.getElementById("te-x-anzeige").textContent = "x = " + num(x);
  document.getElementById("te-anzeige").innerHTML = termHtml(t);

  document.getElementById("te-schritte").innerHTML =
    schrittZeile(termHtml(t), "", "", "der Term") +
    schrittZeile(eingesetztHtml(t, x), "x = " + num(x), "", "einsetzen — die Zahl kommt in Klammern") +
    schrittZeile(`<span class="qv">${num(wert)}</span>`, "ausrechnen", "fertig", "der Termwert");

  const xWerte = [-3, -2, -1, 0, 1, 2, 3, 4];
  document.getElementById("te-tabelle").innerHTML =
    `<caption>Wertetabelle zu ${eintrag.name}</caption>` +
    `<tr><th>x</th>` + xWerte.map((v) => `<td class="x${v === x ? " hervor" : ""}">${num(v)}</td>`).join("") + `</tr>` +
    `<tr><th>Termwert</th>` + xWerte.map((v) => `<td class="wert${v === x ? " hervor" : ""}">${num(termWert(t, v))}</td>`).join("") + `</tr>`;

  const negativ = x < 0;
  document.getElementById("te-bilanz").innerHTML =
    `<strong>Der Term selbst</strong> ist noch keine Zahl — er ist ${termName(t)}, also eine Rechenvorschrift.<br>` +
    `<strong>Für x = <span class="wx">${num(x)}</span></strong> ergibt sich der Termwert <span class="we">${num(wert)}</span>.<br>` +
    (negativ
      ? `Weil ${num(x)} negativ ist, sind die Klammern hier <strong>notwendig</strong>: ` +
        `Ohne sie stünde in Zeile 2 etwas anderes da, und das Vorzeichen ginge verloren.`
      : `Verschiebe den Regler ins Negative — dort zeigt sich, warum die Klammern beim Einsetzen nötig sind.`);

  document.getElementById("te-text").textContent =
    `Ein Term steht für unendlich viele Zahlen auf einmal. Die Wertetabelle zeigt acht davon; die hervorgehobene Spalte gehört zum Reglerwert.`;
}

function initTermwert() {
  document.getElementById("te-term").addEventListener("change", renderTermwert);
  document.getElementById("te-x").addEventListener("input", renderTermwert);
  renderTermwert();
}

// ================= 2. Die Struktur eines Terms =================

const ST_TERME = [
  { t: plus(mal(zahl(2), X), zahl(3)), knopf: "2x + 3" },
  { t: mal(zahl(2), plus(X, zahl(3))), knopf: "2 · (x + 3)" },
  { t: hoch(plus(X, zahl(3)), 2), knopf: "(x + 3)²" },
  { t: plus(hoch(X, 2), zahl(3)), knopf: "x² + 3" },
  { t: minus(zahl(10), mal(zahl(2), X)), knopf: "10 − 2x" },
];
let stNr = 0;

// Der Rechenbaum wird von unten aufgebaut: erst wird für jeden Teilbaum die
// benötigte Breite bestimmt, dann werden die Knoten mittig darüber gesetzt.
// Ein festes Raster würde bei ungleich tiefen Ästen überlappen.
function baumBreite(t) {
  if (t.x || t.zahl !== undefined) return 54;
  return baumBreite(t.links) + baumBreite(t.rechts);
}
function baumZeichnen(svg, t, x0, breite, y, dy) {
  const mx = x0 + breite / 2;
  if (t.x || t.zahl !== undefined) {
    const beschriftung = t.x ? "x" : num(t.zahl);
    svg.appendChild(svgEl("rect", {
      x: (mx - 18).toFixed(2), y: (y - 13).toFixed(2), width: 36, height: 26, rx: 6,
      class: "tm-knoten " + (t.x ? "blatt-x" : "blatt-zahl"),
    }));
    svg.appendChild(svgText(mx, y + 4.5, beschriftung, { class: "tm-knotentext " + (t.x ? "xv" : "zv") }));
    return { x: mx, y };
  }
  const bl = baumBreite(t.links), br = baumBreite(t.rechts);
  const kindL = baumZeichnen(svg, t.links, x0, bl, y + dy, dy);
  const kindR = baumZeichnen(svg, t.rechts, x0 + bl, br, y + dy, dy);
  for (const k of [kindL, kindR]) {
    svg.appendChild(svgEl("line", { x1: mx.toFixed(2), y1: (y + 14).toFixed(2), x2: k.x.toFixed(2), y2: (k.y - 14).toFixed(2), class: "tm-ast" }));
  }
  svg.appendChild(svgEl("circle", { cx: mx.toFixed(2), cy: y.toFixed(2), r: 15, class: "tm-knoten" }));
  svg.appendChild(svgText(mx, y + 5, t.op === "^" ? "^" : t.op, { class: "tm-knotentext op" }));
  return { x: mx, y };
}

function baumTiefe(t) {
  if (t.x || t.zahl !== undefined) return 1;
  return 1 + Math.max(baumTiefe(t.links), baumTiefe(t.rechts));
}

function renderStruktur() {
  const eintrag = ST_TERME[stNr];
  const t = eintrag.t;

  const schalter = document.getElementById("st-schalter");
  schalter.innerHTML = "";
  ST_TERME.forEach((e, i) => {
    const btn = el("button", { type: "button", class: i === stNr ? "aktiv" : "" }, e.knopf);
    btn.addEventListener("click", () => { stNr = i; renderStruktur(); });
    schalter.appendChild(btn);
  });

  document.getElementById("st-anzeige").innerHTML = termHtml(t);

  const dy = 62;
  const B = Math.max(300, baumBreite(t) + 60);
  const H = baumTiefe(t) * dy + 46;
  const svg = neueFlaeche(B, H);
  svg.appendChild(svgText(B / 2, 16, "Der oberste Knoten ist der letzte Rechenschritt.", { class: "tm-wurzeltext" }));
  baumZeichnen(svg, t, 30, B - 60, 44, dy);
  const mount = document.getElementById("st-mount");
  mount.innerHTML = "";
  mount.appendChild(svg);

  const karten = document.getElementById("st-karten");
  karten.innerHTML = "";
  karten.appendChild(karte("o", "letzter Rechenschritt", letzterSchritt(t)));
  karten.appendChild(karte("erg", "der Term ist", termName(t).replace(/^ein[e]? /, "")));
  karten.appendChild(karte("x", "Wert für x = 2", num(termWert(t, 2))));
  karten.appendChild(karte("z", "Wert für x = 5", num(termWert(t, 5))));

  // Der Vergleich mit dem "Zwillingsterm" macht den Unterschied greifbar.
  const partner = stNr === 0 ? 1 : stNr === 1 ? 0 : stNr === 2 ? 3 : stNr === 3 ? 2 : 0;
  const tp = ST_TERME[partner].t;
  document.getElementById("st-bilanz").innerHTML =
    `Zuletzt wird <span class="wo">${letzterSchrittVerb(t)}</span> — deshalb ist ${termHtml(t)} ` +
    `<strong>${termName(t)}</strong>.<br>` +
    `<strong>Zum Vergleich:</strong> ${termHtml(tp)} ist <strong>${termName(tp)}</strong>. ` +
    `Für x = 2 ergibt der eine <span class="we">${num(termWert(t, 2))}</span>, der andere ` +
    `<span class="we">${num(termWert(tp, 2))}</span>` +
    (termWert(t, 2) === termWert(tp, 2)
      ? ` — hier zufällig dasselbe. Setze x = 5 ein: ${num(termWert(t, 5))} gegen ${num(termWert(tp, 5))}.`
      : ` — verschiedene Terme, verschiedene Werte.`);

  document.getElementById("st-text").textContent =
    "Lies den Baum von unten nach oben: Jeder Knoten ist ein Rechenschritt, und der oberste wird zuletzt ausgeführt. Genau er gibt dem Term seinen Namen.";
}

function initStruktur() {
  renderStruktur();
}

// ================= 3. Gleichartige Terme zusammenfassen =================

// Algebra-Kacheln: Das Quadrat mit der Seite x steht für x², der Streifen für
// x, das kleine Kästchen für 1. Dass ein Streifen kein Quadrat ist, ist der
// ganze Grund, warum 3x + 2x² nicht zusammengefasst werden darf.
function zfBild(q, xPlus, eins, xMinus) {
  const B = 470;
  const kX = 46, kStreifenB = 16, kEins = 16;
  const gruppen = [
    { anzahl: q, breite: kX, hoehe: kX, klasse: "q", titel: "x²", negativ: false },
    { anzahl: xPlus, breite: kStreifenB, hoehe: kX, klasse: "x", titel: "x", negativ: false },
    { anzahl: xMinus, breite: kStreifenB, hoehe: kX, klasse: "x", titel: "− x", negativ: true },
    { anzahl: eins, breite: kEins, hoehe: kEins, klasse: "eins", titel: "1", negativ: false },
  ].filter((g) => g.anzahl > 0);

  const y0 = 34, luecke = 22;
  let x = 16;
  const teile = [];
  let maxUnten = y0 + kX;
  for (const g of gruppen) {
    const gesamt = g.anzahl * (g.breite + 4) - 4;
    teile.push({ typ: "rahmen", x: x - 8, y: y0 - 20, w: gesamt + 16, h: kX + 34 });
    teile.push({ typ: "titel", x: x + gesamt / 2, y: y0 - 6, text: `${g.anzahl} · ${g.titel}` });
    for (let i = 0; i < g.anzahl; i++) {
      teile.push({
        typ: "kachel", x: x + i * (g.breite + 4), y: y0 + kX - g.hoehe,
        w: g.breite, h: g.hoehe, klasse: g.klasse + (g.negativ ? " negativ" : ""),
      });
    }
    x += gesamt + luecke + 16;
  }
  const breite = Math.max(B, x);
  const H = maxUnten + 34;
  const svg = neueFlaeche(breite, H);
  for (const p of teile) {
    if (p.typ === "rahmen") svg.appendChild(svgEl("rect", { x: p.x.toFixed(2), y: p.y, width: p.w.toFixed(2), height: p.h, rx: 6, class: "tm-gruppenrahmen" }));
    else if (p.typ === "titel") svg.appendChild(svgText(p.x, p.y, p.text, { class: "tm-gruppentext" }));
    else svg.appendChild(svgEl("rect", { x: p.x.toFixed(2), y: p.y, width: p.w, height: p.h, rx: 2, class: "tm-kachel " + p.klasse }));
  }
  svg.appendChild(svgText(breite / 2, H - 8,
    "Nur Kacheln derselben Form lassen sich zu einer Sorte zusammenschieben.", { class: "tm-gruppentext" }));
  return svg;
}

function zfTermHtml(q, xPlus, eins, xMinus) {
  const teile = [];
  if (q) teile.push(`<span class="zv">${q === 1 ? "" : num(q)}</span><span class="xv">x²</span>`);
  if (xPlus) teile.push((teile.length ? `<span class="op">+</span> ` : "") + `<span class="zv">${xPlus === 1 ? "" : num(xPlus)}</span><span class="xv">x</span>`);
  if (eins) teile.push((teile.length ? `<span class="op">+</span> ` : "") + `<span class="zv">${num(eins)}</span>`);
  if (xMinus) teile.push(`<span class="op">−</span> <span class="zv">${xMinus === 1 ? "" : num(xMinus)}</span><span class="xv">x</span>`);
  return teile.length ? teile.join(" ") : `<span class="zv">0</span>`;
}
function zfErgebnisHtml(q, xNetto, eins) {
  const teile = [];
  if (q) teile.push(`<span class="qv">${q === 1 ? "" : num(q)}</span><span class="xv">x²</span>`);
  if (xNetto) {
    const vz = xNetto > 0 ? "+" : "−";
    const betrag = Math.abs(xNetto);
    teile.push((teile.length ? `<span class="op">${vz}</span> ` : (xNetto < 0 ? `<span class="op">−</span> ` : "")) +
      `<span class="zv">${betrag === 1 ? "" : num(betrag)}</span><span class="xv">x</span>`);
  }
  if (eins) teile.push((teile.length ? `<span class="op">+</span> ` : "") + `<span class="zv">${num(eins)}</span>`);
  return teile.length ? teile.join(" ") : `<span class="zv">0</span>`;
}

function renderZusammenfassen() {
  const q = begrenzt("zf-q", Number(document.getElementById("zf-q").value), 0, 3);
  const xPlus = begrenzt("zf-x", Number(document.getElementById("zf-x").value), 0, 5);
  const eins = begrenzt("zf-e", Number(document.getElementById("zf-e").value), 0, 6);
  const xMinus = begrenzt("zf-w", Number(document.getElementById("zf-w").value), 0, 4);
  const xNetto = xPlus - xMinus;

  document.getElementById("zf-q-anzeige").textContent = num(q);
  document.getElementById("zf-x-anzeige").textContent = num(xPlus);
  document.getElementById("zf-e-anzeige").textContent = num(eins);
  document.getElementById("zf-w-anzeige").textContent = num(xMinus);

  document.getElementById("zf-anzeige").innerHTML = zfTermHtml(q, xPlus, eins, xMinus);

  const mount = document.getElementById("zf-mount");
  mount.innerHTML = "";
  mount.appendChild(zfBild(q, xPlus, eins, xMinus));

  const zeilen = [schrittZeile(zfTermHtml(q, xPlus, eins, xMinus), "", "", "der Ausgangsterm")];
  if (xMinus) {
    zeilen.push(schrittZeile(
      (q ? `<span class="qv">${num(q)}</span><span class="xv">x²</span> <span class="op">+</span> ` : "") +
      `<span class="nw">(<span class="zv">${num(xPlus)}</span> − <span class="zv">${num(xMinus)}</span>)</span> · <span class="xv">x</span>` +
      (eins ? ` <span class="op">+</span> <span class="zv">${num(eins)}</span>` : ""),
      "x ausklammern", "", "die x-Terme sind gleichartig — nur ihre Koeffizienten werden verrechnet"));
  }
  zeilen.push(schrittZeile(zfErgebnisHtml(q, xNetto, eins), "zusammengefasst", "fertig",
    q && xNetto ? "x² und x bleiben getrennt stehen — sie sind nicht gleichartig." : ""));
  document.getElementById("zf-schritte").innerHTML = zeilen.join("");

  // Probe an einer Stelle: Beide Terme müssen denselben Wert haben.
  const probeX = 2;
  const vorher = q * probeX * probeX + xPlus * probeX + eins - xMinus * probeX;
  const nachher = q * probeX * probeX + xNetto * probeX + eins;
  const sorten = (q ? 1 : 0) + (xNetto ? 1 : 0) + (eins ? 1 : 0);

  document.getElementById("zf-bilanz").innerHTML =
    `<strong>Gleichartig sind:</strong> die ${num(xPlus)} Streifen und die ${num(xMinus)} abgezogenen Streifen — ` +
    `beide haben die Form <span class="wx">x</span>. Zusammen ergeben sie ` +
    `${faktor(`${num(xPlus)} − ${num(xMinus)}`)} = <span class="wx">${num(xNetto)}</span> Streifen.<br>` +
    `<strong>Nicht gleichartig sind:</strong> Quadrate (<span class="wq">x²</span>), Streifen (<span class="wx">x</span>) und Kästchen (<span class="wz">1</span>). ` +
    `Der Term lässt sich deshalb auf <strong>${num(sorten)}</strong> ${sorten === 1 ? "Summand" : "Summanden"} verkürzen, nicht weiter.<br>` +
    `<strong>Probe für x = ${num(probeX)}:</strong> vorher ${num(vorher)}, nachher ${num(nachher)} ` +
    (vorher === nachher ? "✓" : "— hier stimmt etwas nicht!");

  document.getElementById("zf-text").textContent = q && xNetto
    ? "Quadrate und Streifen liegen in getrennten Rahmen: Man kann sie nicht zu einer Sorte zusammenschieben, so wenig wie Äpfel und Birnen."
    : xNetto === 0 && xPlus
      ? "Die abgezogenen Streifen heben die hinzugefügten genau auf — der x-Term verschwindet vollständig."
      : "Schiebe die Regler: Nur Kacheln gleicher Form dürfen in einer Zahl zusammengefasst werden.";
}

function initZusammenfassen() {
  ["zf-q", "zf-x", "zf-e", "zf-w"].forEach((id) => document.getElementById(id).addEventListener("input", renderZusammenfassen));
  renderZusammenfassen();
}

// ================= 4. Ausmultiplizieren und Ausklammern =================

function amBild(a, b, c, ausRichtung) {
  const B = 470, H = 250;
  const svg = neueFlaeche(B, H);
  const einheit = Math.min(38, 300 / (b + c), 130 / a);
  const x0 = 82, y0 = 52;
  const wB = b * einheit, wC = c * einheit, hA = a * einheit;

  svg.appendChild(svgEl("rect", { x: x0, y: y0, width: wB.toFixed(2), height: hA.toFixed(2), class: "tm-feld aa" }));
  svg.appendChild(svgEl("rect", { x: (x0 + wB).toFixed(2), y: y0, width: wC.toFixed(2), height: hA.toFixed(2), class: "tm-feld bb" }));
  svg.appendChild(svgEl("rect", { x: x0, y: y0, width: (wB + wC).toFixed(2), height: hA.toFixed(2), class: "tm-feldrahmen" }));
  if (!ausRichtung) {
    // Beim Ausklammern liegt die Trennlinie noch drin und wird "weggedacht".
    svg.appendChild(svgEl("line", { x1: (x0 + wB).toFixed(2), y1: y0, x2: (x0 + wB).toFixed(2), y2: (y0 + hA).toFixed(2), class: "tm-trennlinie" }));
  }

  svg.appendChild(svgText(x0 + wB / 2, y0 + hA / 2 + 5, `${num(a)} · ${num(b)}`, { class: "tm-feldtext" }));
  svg.appendChild(svgText(x0 + wB + wC / 2, y0 + hA / 2 + 5, `${num(a)} · ${num(c)}`, { class: "tm-feldtext" }));

  // Maßangaben
  svg.appendChild(svgEl("line", { x1: x0, y1: (y0 - 14).toFixed(2), x2: (x0 + wB).toFixed(2), y2: (y0 - 14).toFixed(2), class: "tm-masslinie" }));
  svg.appendChild(svgText(x0 + wB / 2, y0 - 19, num(b), { class: "tm-masstext" }));
  svg.appendChild(svgEl("line", { x1: (x0 + wB).toFixed(2), y1: (y0 - 14).toFixed(2), x2: (x0 + wB + wC).toFixed(2), y2: (y0 - 14).toFixed(2), class: "tm-masslinie" }));
  svg.appendChild(svgText(x0 + wB + wC / 2, y0 - 19, num(c), { class: "tm-masstext" }));
  svg.appendChild(svgEl("line", { x1: (x0 - 14).toFixed(2), y1: y0, x2: (x0 - 14).toFixed(2), y2: (y0 + hA).toFixed(2), class: "tm-masslinie" }));
  svg.appendChild(svgText(0, 0, num(a), {
    class: "tm-masstext", transform: `translate(${(x0 - 20).toFixed(2)} ${(y0 + hA / 2).toFixed(2)}) rotate(-90)`,
  }));

  svg.appendChild(svgText(B / 2, 22, `Ein Rechteck, zweimal gemessen: ${num(a)} · (${num(b)} + ${num(c)})`, { class: "tm-gruppentext" }));
  svg.appendChild(svgText(B / 2, y0 + hA + 26, `als Ganzes: ${num(a)} · ${num(b + c)} = ${num(a * (b + c))}`, { class: "tm-feldtext" }));
  svg.appendChild(svgText(B / 2, y0 + hA + 44,
    `in zwei Teilen: ${num(a * b)} + ${num(a * c)} = ${num(a * b + a * c)}`, { class: "tm-feldtext" }));
  svg.appendChild(svgText(B / 2, H - 22, "Beide Male dieselbe Fläche — das ist das Distributivgesetz.", { class: "tm-gruppentext" }));
  svg.appendChild(svgText(B / 2, H - 7,
    `Denkt man sich statt der ${num(b)} ein x, steht dort ${num(a)} · (x + ${num(c)}).`, { class: "tm-gruppentext" }));
  return svg;
}

function renderAusmultiplizieren() {
  const richtung = document.getElementById("am-richtung").value;
  const a = begrenzt("am-a", Number(document.getElementById("am-a").value), 1, 6);
  const b = begrenzt("am-b", Number(document.getElementById("am-b").value), 1, 7);
  const c = begrenzt("am-c", Number(document.getElementById("am-c").value), 1, 7);
  const ausRichtung = richtung === "aus";

  document.getElementById("am-a-anzeige").textContent = num(a);
  document.getElementById("am-b-anzeige").textContent = num(b);
  document.getElementById("am-c-anzeige").textContent = num(c);

  document.getElementById("am-anzeige").innerHTML = ausRichtung
    ? `<span class="zv">${num(a)}</span> <span class="op">·</span> (<span class="xv">x</span> <span class="op">+</span> <span class="zv">${num(c)}</span>)`
    : `<span class="zv">${num(a)}</span><span class="xv">x</span> <span class="op">+</span> <span class="zv">${num(a * c)}</span>`;

  const mount = document.getElementById("am-mount");
  mount.innerHTML = "";
  mount.appendChild(amBild(a, b, c, ausRichtung));

  const zeilen = ausRichtung
    ? [
      schrittZeile(`<span class="zv">${num(a)}</span> · (<span class="xv">x</span> + <span class="zv">${num(c)}</span>)`, "", "", "der Ausgangsterm — ein Produkt"),
      schrittZeile(`<span class="zv">${num(a)}</span> · <span class="xv">x</span> + <span class="zv">${num(a)}</span> · <span class="zv">${num(c)}</span>`,
        "jeden Summanden", "", "der Faktor wird auf beide Summanden verteilt"),
      schrittZeile(`<span class="zv">${num(a)}</span><span class="xv">x</span> + <span class="zv">${num(a * c)}</span>`, "ausrechnen", "fertig", "jetzt eine Summe"),
    ]
    : [
      schrittZeile(`<span class="zv">${num(a)}</span><span class="xv">x</span> + <span class="zv">${num(a * c)}</span>`, "", "", "der Ausgangsterm — eine Summe"),
      schrittZeile(`<span class="zv">${num(a)}</span> · <span class="xv">x</span> + <span class="zv">${num(a)}</span> · <span class="zv">${num(c)}</span>`,
        "gemeinsamer Faktor " + num(a), "", `beide Summanden sind durch ${num(a)} teilbar`),
      schrittZeile(`<span class="zv">${num(a)}</span> · (<span class="xv">x</span> + <span class="zv">${num(c)}</span>)`, "ausklammern", "fertig", "jetzt ein Produkt"),
    ];
  document.getElementById("am-schritte").innerHTML = zeilen.join("");

  document.getElementById("am-bilanz").innerHTML =
    `<strong>Am Rechteck:</strong> Die Seiten sind <span class="wo">${num(a)}</span> und ` +
    `${faktor(`${num(b)} + ${num(c)}`)} = ${num(b + c)}. Als Ganzes gemessen: ` +
    `${faktor(`${num(a)} · ${num(b + c)}`)} = <span class="we">${num(a * (b + c))}</span>.<br>` +
    `<strong>In zwei Teilen:</strong> ${faktor(`${num(a)} · ${num(b)}`)} + ${faktor(`${num(a)} · ${num(c)}`)} = ` +
    `${num(a * b)} + ${num(a * c)} = <span class="we">${num(a * b + a * c)}</span>. Beide Wege liefern dasselbe.<br>` +
    (ausRichtung
      ? `<strong>Mit einer Variablen:</strong> ${faktor(`${num(a)} · (x + ${num(c)})`)} = <span class="wo">${num(a)}x + ${num(a * c)}</span>. ` +
        `Der Faktor ${num(a)} trifft <em>jeden</em> Summanden, auch die ${num(c)}.`
      : `<strong>Mit einer Variablen:</strong> In ${num(a)}x + ${num(a * c)} steckt in beiden Summanden der Faktor <span class="wo">${num(a)}</span>. ` +
        `Ausgeklammert: ${faktor(`${num(a)} · (x + ${num(c)})`)}.`);

  document.getElementById("am-text").textContent = ausRichtung
    ? "Ausmultiplizieren heißt: die Trennlinie im Rechteck einziehen und beide Teilflächen einzeln bestimmen."
    : "Ausklammern heißt: die Trennlinie wegdenken und die beiden Teilflächen als ein Rechteck lesen.";
}

function initAusmultiplizieren() {
  document.getElementById("am-richtung").addEventListener("change", renderAusmultiplizieren);
  ["am-a", "am-b", "am-c"].forEach((id) => document.getElementById(id).addEventListener("input", renderAusmultiplizieren));
  renderAusmultiplizieren();
}

// ================= 5. Die binomischen Formeln =================

const BI_FORMELN = [
  { key: "plus", knopf: "(a + b)²", titel: "1. binomische Formel" },
  { key: "minus", knopf: "(a − b)²", titel: "2. binomische Formel" },
  { key: "diff", knopf: "(a + b)(a − b)", titel: "3. binomische Formel" },
];
let biNr = 0;

function biBild(a, b, key) {
  const B = 470, H = 300;
  const svg = neueFlaeche(B, H);
  const e = Math.min(26, 212 / (a + b), 200 / a);
  const A = a * e, Bs = b * e;
  const seite = key === "plus" ? A + Bs : A;
  // Mittig setzen, aber links genug Platz für die gedrehte Maßangabe lassen.
  const x0 = Math.max(78, (B - seite) / 2), y0 = 54;

  const beschriftung = (x, y, text, klasse = "tm-feldtext") => svg.appendChild(svgText(x, y, text, { class: klasse }));

  if (key === "plus") {
    svg.appendChild(svgEl("rect", { x: x0, y: y0, width: A.toFixed(2), height: A.toFixed(2), class: "tm-feld aa" }));
    svg.appendChild(svgEl("rect", { x: (x0 + A).toFixed(2), y: y0, width: Bs.toFixed(2), height: A.toFixed(2), class: "tm-feld ab" }));
    svg.appendChild(svgEl("rect", { x: x0, y: (y0 + A).toFixed(2), width: A.toFixed(2), height: Bs.toFixed(2), class: "tm-feld ab" }));
    svg.appendChild(svgEl("rect", { x: (x0 + A).toFixed(2), y: (y0 + A).toFixed(2), width: Bs.toFixed(2), height: Bs.toFixed(2), class: "tm-feld bb" }));
    svg.appendChild(svgEl("rect", { x: x0, y: y0, width: (A + Bs).toFixed(2), height: (A + Bs).toFixed(2), class: "tm-feldrahmen" }));
    beschriftung(x0 + A / 2, y0 + A / 2 + 5, "a²");
    beschriftung(x0 + A + Bs / 2, y0 + A / 2 + 5, "a·b");
    beschriftung(x0 + A / 2, y0 + A + Bs / 2 + 5, "a·b");
    beschriftung(x0 + A + Bs / 2, y0 + A + Bs / 2 + 5, "b²");
  } else if (key === "minus") {
    // Das große Quadrat hat die Seite a; abgezogen werden zwei Streifen der
    // Breite b — dabei wird das Eckquadrat b² zweimal abgezogen und muss
    // wieder dazu. Genau das ist das "+ b²" der Formel.
    svg.appendChild(svgEl("rect", { x: x0, y: y0, width: A.toFixed(2), height: A.toFixed(2), class: "tm-feld aa" }));
    svg.appendChild(svgEl("rect", { x: (x0 + A - Bs).toFixed(2), y: y0, width: Bs.toFixed(2), height: A.toFixed(2), class: "tm-feld weg" }));
    svg.appendChild(svgEl("rect", { x: x0, y: (y0 + A - Bs).toFixed(2), width: A.toFixed(2), height: Bs.toFixed(2), class: "tm-feld weg" }));
    svg.appendChild(svgEl("rect", { x: (x0 + A - Bs).toFixed(2), y: (y0 + A - Bs).toFixed(2), width: Bs.toFixed(2), height: Bs.toFixed(2), class: "tm-feld bb" }));
    svg.appendChild(svgEl("rect", { x: x0, y: y0, width: A.toFixed(2), height: A.toFixed(2), class: "tm-feldrahmen" }));
    svg.appendChild(svgEl("rect", { x: x0, y: y0, width: (A - Bs).toFixed(2), height: (A - Bs).toFixed(2), class: "tm-feldrahmen" }));
    beschriftung(x0 + (A - Bs) / 2, y0 + (A - Bs) / 2 + 5, "(a − b)²");
    beschriftung(x0 + A - Bs / 2, y0 + (A - Bs) / 2 + 5, "a·b");
    beschriftung(x0 + (A - Bs) / 2, y0 + A - Bs / 2 + 5, "a·b");
    beschriftung(x0 + A - Bs / 2, y0 + A - Bs / 2 + 5, "b²");
  } else {
    // (a+b)(a−b): Aus dem Quadrat a² wird b² weggenommen; der übrige
    // L-förmige Streifen lässt sich zu einem Rechteck (a+b)·(a−b) legen.
    svg.appendChild(svgEl("rect", { x: x0, y: y0, width: A.toFixed(2), height: A.toFixed(2), class: "tm-feld aa" }));
    svg.appendChild(svgEl("rect", { x: (x0 + A - Bs).toFixed(2), y: (y0 + A - Bs).toFixed(2), width: Bs.toFixed(2), height: Bs.toFixed(2), class: "tm-feld weg" }));
    svg.appendChild(svgEl("rect", { x: x0, y: y0, width: A.toFixed(2), height: A.toFixed(2), class: "tm-feldrahmen" }));
    svg.appendChild(svgEl("line", { x1: x0, y1: (y0 + A - Bs).toFixed(2), x2: (x0 + A).toFixed(2), y2: (y0 + A - Bs).toFixed(2), class: "tm-trennlinie" }));
    beschriftung(x0 + A / 2, y0 + (A - Bs) / 2 + 5, "a · (a − b)");
    beschriftung(x0 + (A - Bs) / 2, y0 + A - Bs / 2 + 5, "b · (a − b)");
    beschriftung(x0 + A - Bs / 2, y0 + A - Bs / 2 + 5, "b²");
  }

  // Maßangaben oben und links
  const ganz = seite;
  svg.appendChild(svgEl("line", { x1: x0, y1: (y0 - 14).toFixed(2), x2: (x0 + ganz).toFixed(2), y2: (y0 - 14).toFixed(2), class: "tm-masslinie" }));
  svg.appendChild(svgText(x0 + ganz / 2, y0 - 19, key === "plus" ? `a + b = ${num(a + b)}` : `a = ${num(a)}`, { class: "tm-masstext" }));
  svg.appendChild(svgText(0, 0, key === "plus" ? `a + b = ${num(a + b)}` : `a = ${num(a)}`, {
    class: "tm-masstext", transform: `translate(${(x0 - 22).toFixed(2)} ${(y0 + ganz / 2).toFixed(2)}) rotate(-90)`,
  }));

  svg.appendChild(svgText(B / 2, 22, BI_FORMELN[biNr].titel + ` mit a = ${num(a)} und b = ${num(b)}`, { class: "tm-gruppentext" }));
  svg.appendChild(svgText(B / 2, H - 8,
    key === "plus" ? "Die beiden a·b-Rechtecke sind das, was bei „a² + b²“ fehlt."
      : key === "minus" ? "Rot: zweimal abgezogen. Das Eckquadrat b² muss deshalb wieder dazu."
        : "Nimmt man b² weg, lässt sich der Rest zu einem Rechteck (a + b) · (a − b) legen.",
    { class: "tm-gruppentext" }));
  return svg;
}

function renderBinomisch() {
  const a = begrenzt("bi-a", Number(document.getElementById("bi-a").value), 2, 9);
  let b = begrenzt("bi-b", Number(document.getElementById("bi-b").value), 1, 6);
  const key = BI_FORMELN[biNr].key;
  // Bei der 2. und 3. Formel muss b kleiner als a sein, sonst gäbe es im Bild
  // keine Restfläche. Der Regler wird entsprechend zurückgeschrieben.
  if (key !== "plus" && b >= a) b = begrenzt("bi-b", a - 1, 1, 6);

  const schalter = document.getElementById("bi-schalter");
  schalter.innerHTML = "";
  BI_FORMELN.forEach((f, i) => {
    const btn = el("button", { type: "button", class: i === biNr ? "aktiv" : "" }, f.knopf);
    btn.addEventListener("click", () => { biNr = i; renderBinomisch(); });
    schalter.appendChild(btn);
  });

  document.getElementById("bi-a-anzeige").textContent = num(a);
  document.getElementById("bi-b-anzeige").textContent = num(b) + (key !== "plus" && b === a - 1 && Number(document.getElementById("bi-b").getAttribute("max")) > a - 1 ? " (b < a)" : "");

  const links = key === "plus" ? Math.pow(a + b, 2) : key === "minus" ? Math.pow(a - b, 2) : (a + b) * (a - b);
  const rechts = key === "plus" ? a * a + 2 * a * b + b * b : key === "minus" ? a * a - 2 * a * b + b * b : a * a - b * b;
  const naiv = key === "diff" ? a * a + b * b : a * a + b * b;

  document.getElementById("bi-anzeige").innerHTML =
    key === "plus" ? `(<span class="xv">a</span> + <span class="zv">b</span>)² = <span class="xv">a²</span> <span class="op">+</span> 2<span class="xv">a</span><span class="zv">b</span> <span class="op">+</span> <span class="zv">b²</span>`
      : key === "minus" ? `(<span class="xv">a</span> − <span class="zv">b</span>)² = <span class="xv">a²</span> <span class="op">−</span> 2<span class="xv">a</span><span class="zv">b</span> <span class="op">+</span> <span class="zv">b²</span>`
        : `(<span class="xv">a</span> + <span class="zv">b</span>) · (<span class="xv">a</span> − <span class="zv">b</span>) = <span class="xv">a²</span> <span class="op">−</span> <span class="zv">b²</span>`;

  const mount = document.getElementById("bi-mount");
  mount.innerHTML = "";
  mount.appendChild(biBild(a, b, key));

  const karten = document.getElementById("bi-karten");
  karten.innerHTML = "";
  karten.appendChild(karte("q", "a²", num(a * a)));
  karten.appendChild(karte("o", key === "diff" ? "a · b (hebt sich auf)" : "2 · a · b", num(key === "diff" ? a * b : 2 * a * b)));
  karten.appendChild(karte("z", "b²", num(b * b)));
  karten.appendChild(karte("erg", "linke Seite", num(links)));

  const linkeSchreibweise = key === "plus" ? `(${num(a)} + ${num(b)})² = ${num(a + b)}²`
    : key === "minus" ? `(${num(a)} − ${num(b)})² = ${num(a - b)}²`
      : `(${num(a)} + ${num(b)}) · (${num(a)} − ${num(b)}) = ${num(a + b)} · ${num(a - b)}`;
  const rechteSchreibweise = key === "plus" ? `${num(a * a)} + ${num(2 * a * b)} + ${num(b * b)}`
    : key === "minus" ? `${num(a * a)} − ${num(2 * a * b)} + ${num(b * b)}`
      : `${num(a * a)} − ${num(b * b)}`;

  document.getElementById("bi-bilanz").innerHTML =
    `<strong>Linke Seite:</strong> ${faktor(linkeSchreibweise)} = <span class="we">${num(links)}</span><br>` +
    `<strong>Rechte Seite:</strong> ${rechteSchreibweise} = <span class="we">${num(rechts)}</span> ` +
    (links === rechts ? "✓ — beide Seiten stimmen überein." : "— hier stimmt etwas nicht!") + `<br>` +
    (key === "diff"
      ? `<strong>Warum kein mittleres Glied?</strong> Beim Ausmultiplizieren entstehen ${faktor(`+ ${num(a * b)}`)} und ` +
        `${faktor(`− ${num(a * b)}`)} — sie heben sich auf. Übrig bleibt ${num(a * a)} − ${num(b * b)} = ${num(rechts)}.`
      : `<strong>Der häufigste Fehler</strong> wäre a² ${key === "plus" ? "+" : "−"} b² = ` +
        `<span class="wo">${num(key === "plus" ? a * a + b * b : a * a - b * b)}</span> — das ist um ` +
        `${num(2 * a * b)} ${key === "plus" ? "zu wenig" : "zu viel"}. Es fehlen die beiden a·b-Rechtecke.`);

  document.getElementById("bi-text").textContent = {
    plus: "Das große Quadrat besteht aus vier Teilen: zwei Quadraten und zwei gleich großen Rechtecken. Genau diese beiden Rechtecke vergisst man beim falschen „a² + b²“.",
    minus: "Von a² werden zwei Streifen abgezogen. Weil das Eckquadrat dabei zweimal verschwindet, muss b² wieder dazugezählt werden.",
    diff: "Aus dem Quadrat a² wird b² herausgeschnitten. Der übrige Winkel lässt sich zu einem Rechteck mit den Seiten a + b und a − b umlegen.",
  }[key];
}

function initBinomisch() {
  ["bi-a", "bi-b"].forEach((id) => document.getElementById(id).addEventListener("input", renderBinomisch));
  renderBinomisch();
}

// ================= 8. Gestaffelte Übungsaufgaben =================

function mountStaffelAufgabe(container, def) {
  const box = el("div", { class: "aufgabe-box" });
  box.appendChild(el("h3", {}, [def.titel, el("span", { class: "schwierigkeit-badge " + def.schwierigkeit }, def.schwierigkeit)]));
  const promptEl = el("div", { class: "aufgabe-prompt" });
  box.appendChild(promptEl);
  const row = el("div", { class: "exercise-input-row" });
  const input = el("input", { type: "text", placeholder: "Antwort" });
  const btnPruefen = el("button", { type: "button", class: "btn btn-primary" }, "Prüfen");
  const btnWuerfeln = el("button", { type: "button", class: "btn" }, "🎲 Neue Zahlen");
  row.appendChild(input);
  row.appendChild(btnPruefen);
  row.appendChild(btnWuerfeln);
  box.appendChild(row);
  const feedback = el("div", { class: "aufgabe-feedback" });
  box.appendChild(feedback);

  let current;
  function neueAufgabe() {
    current = def.generate();
    promptEl.innerHTML = current.promptHtml;
    input.value = "";
    input.placeholder = current.placeholder || "Antwort";
    feedback.innerHTML = "";
  }
  btnPruefen.addEventListener("click", () => {
    const raw = input.value.trim();
    const val = parseFlexibleNumber(raw);
    const tol = current.tolerance ?? 0.01;
    const ok = !isNaN(val) && Math.abs(val - current.correct) < tol;
    const hinweis = !ok && current.hinweis ? current.hinweis(raw, val) : "";
    feedback.innerHTML =
      (ok
        ? `<div class="status ok">✓ Richtig!</div>`
        : `<div class="status err">✗ Noch nicht richtig${raw ? " — deine Eingabe: " + raw : " — du hast noch keine Antwort eingetragen"}.</div>` +
          (hinweis ? `<div style="margin-bottom:0.3rem">${hinweis}</div>` : "")) +
      `<div class="musterloesung"><span class="ml-label">Musterlösung</span>${current.musterloesungHtml}</div>`;
  });
  btnWuerfeln.addEventListener("click", neueAufgabe);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") btnPruefen.click();
  });

  neueAufgabe();
  container.appendChild(box);
}

function mountUebungsaufgaben(container, defs) {
  mountStaffelAufgabe(container, defs[0]);
  const tabBar = el("div", { class: "schwierigkeit-tabs" });
  const panel = el("div", { class: "schwierigkeit-tab-panel" });
  container.appendChild(tabBar);
  container.appendChild(panel);
  const rest = defs.slice(1);
  function showTab(idx) {
    [...tabBar.children].forEach((b, i) => b.classList.toggle("active", i === idx));
    panel.innerHTML = "";
    mountStaffelAufgabe(panel, rest[idx]);
  }
  rest.forEach((d, i) => {
    const label = d.schwierigkeit.charAt(0).toUpperCase() + d.schwierigkeit.slice(1);
    const btn = el("button", { type: "button" }, label);
    btn.addEventListener("click", () => showTab(i));
    tabBar.appendChild(btn);
  });
  showTab(0);
}

// ---------- Aufgaben-Definitionen ----------

// Konstruktiv statt verwerfend: Erst wird die Kandidatenliste gefiltert, dann
// gezogen. Kollidieren zwei Hinweiswerte, wäre der Hinweis nicht eindeutig.
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

function vorzeichenTeil(k, name) {
  return `${k > 0 ? " + " : " − "}${Math.abs(k) === 1 && name ? "" : num(Math.abs(k))}${name}`;
}

// Aufgabe 1 — Termwert berechnen. Der Term enthält bewusst eine Potenz und
// einen negativen Einsetzwert, weil dort die Klammerregel greift.
function generateAufgabe1() {
  const kandidaten = [];
  for (const a of [1, 2, 3]) {
    for (const b of [-6, -5, -4, -3, -2, 2, 3, 4, 5, 6]) {
      for (const c of [-8, -6, -5, -3, 3, 5, 6, 8]) {
        for (const x of [-4, -3, -2, -1, 2, 3, 4, 5]) {
          const wert = a * x * x + b * x + c;
          if (Math.abs(wert) > 90) continue;
          kandidaten.push({ a, b, c, x, wert });
        }
      }
    }
  }
  const k = ohneKollision(
    kandidaten,
    (v) => [
      v.wert,                                       // richtig
      -v.a * v.x * v.x + v.b * v.x + v.c,           // (−x)² als −x² gerechnet
      v.a * v.x * v.x - v.b * v.x + v.c,            // Vorzeichen des mittleren Glieds verdreht
      v.a * v.x + v.b * v.x + v.c,                  // x² als 2x bzw. als x gerechnet
      Math.pow(v.a * v.x, 2) + v.b * v.x + v.c,     // (a·x)² statt a·x²
      v.x, v.c,
    ],
    kandidaten[0]
  );
  const { a, b, c, x, wert } = k;
  const termText = `${a === 1 ? "" : num(a)}x²${vorzeichenTeil(b, "x")}${vorzeichenTeil(c, "")}`;

  return {
    promptHtml: `Berechne den Termwert von<br>` +
      `<span style="font-family:Cambria Math,Cambria,serif;font-size:1.3rem">${termText}</span><br>` +
      `<strong>für x = ${num(x)}.</strong>`,
    correct: wert,
    tolerance: 0.001,
    placeholder: "Termwert",
    hinweis: (raw, val) => {
      if (Math.abs(val - (-a * x * x + b * x + c)) < 0.001)
        return `Beim Quadrieren einer negativen Zahl kommt eine <strong>positive</strong> Zahl heraus: (${num(x)})² = ${num(x * x)}, nicht ${num(-x * x)}. Deshalb gehört die eingesetzte Zahl in Klammern.`;
      if (Math.abs(val - (a * x * x - b * x + c)) < 0.001)
        return `Das Vorzeichen des mittleren Glieds stimmt nicht: ${faktor(`${num(b)} · (${num(x)})`)} = ${num(b * x)}.`;
      if (Math.abs(val - (Math.pow(a * x, 2) + b * x + c)) < 0.001)
        return `${num(a)}x² heißt „${num(a)} mal x²“, nicht „(${num(a)}x)²“. Erst wird quadriert, dann multipliziert.`;
      if (Math.abs(val - (a * x + b * x + c)) < 0.001)
        return `x² ist x · x, nicht 2 · x. Für x = ${num(x)} ist x² = ${num(x * x)}.`;
      return `Setze in Klammern ein: ${a === 1 ? "" : num(a)} · (${num(x)})² ${b > 0 ? "+" : "−"} ${num(Math.abs(b))} · (${num(x)}) ${c > 0 ? "+" : "−"} ${num(Math.abs(c))}.`;
    },
    musterloesungHtml:
      `<strong>Einsetzen — mit Klammern:</strong> ${a === 1 ? "" : num(a) + " · "}(${num(x)})²${b > 0 ? " + " : " − "}${num(Math.abs(b))} · (${num(x)})${c > 0 ? " + " : " − "}${num(Math.abs(c))}<br>` +
      `<strong>Potenz zuerst:</strong> (${num(x)})² = ${num(x * x)}<br>` +
      `<strong>Punkt vor Strich:</strong> ${a === 1 ? "" : num(a) + " · "}${num(x * x)} = ${num(a * x * x)} &nbsp;und&nbsp; ${faktor(`${num(b)} · (${num(x)})`)} = ${num(b * x)}<br>` +
      `<strong>Zusammen:</strong> ${num(a * x * x)}${b * x >= 0 ? " + " : " − "}${num(Math.abs(b * x))}${c >= 0 ? " + " : " − "}${num(Math.abs(c))} = <strong>${num(wert)}</strong>`,
  };
}

// Aufgabe 2 — zusammenfassen und dann einsetzen.
function generateAufgabe2() {
  const kandidaten = [];
  for (const a1 of [2, 3, 4, 5, 6]) {
    for (const a2 of [1, 2, 3, 4, 5, 7]) {
      for (const b1 of [-8, -6, -5, -3, 3, 4, 6, 7]) {
        for (const b2 of [-7, -5, -4, -2, 2, 5, 6, 8]) {
          for (const x of [-3, -2, 2, 3, 4]) {
            const aGes = a1 - a2, bGes = b1 + b2;
            if (aGes === 0 || bGes === 0) continue;
            const wert = aGes * x + bGes;
            if (Math.abs(wert) > 80) continue;
            kandidaten.push({ a1, a2, b1, b2, x, aGes, bGes, wert });
          }
        }
      }
    }
  }
  const k = ohneKollision(
    kandidaten,
    (v) => [
      v.wert,                                   // richtig
      (v.a1 + v.a2) * v.x + v.bGes,             // x-Terme addiert statt subtrahiert
      v.aGes * v.x + (v.b1 - v.b2),             // Zahlen subtrahiert statt addiert
      (v.aGes + v.bGes) * v.x,                  // x-Term und Zahl zusammengefasst
      v.aGes, v.bGes, v.x,
    ],
    kandidaten[0]
  );
  const { a1, a2, b1, b2, x, aGes, bGes, wert } = k;
  const termText = `${num(a1)}x${vorzeichenTeil(b1, "")} − (${num(a2)}x${vorzeichenTeil(-b2, "")})`;
  const einfach = `${aGes === 1 ? "" : aGes === -1 ? "−" : num(aGes)}x${vorzeichenTeil(bGes, "")}`;

  return {
    promptHtml: `Vereinfache den Term<br>` +
      `<span style="font-family:Cambria Math,Cambria,serif;font-size:1.3rem">${termText}</span><br>` +
      `<strong>und berechne seinen Wert für x = ${num(x)}.</strong>`,
    correct: wert,
    tolerance: 0.001,
    placeholder: "Termwert",
    hinweis: (raw, val) => {
      if (Math.abs(val - ((a1 + a2) * x + bGes)) < 0.001)
        return `Vor der Klammer steht ein Minus, also wird ${num(a2)}x <strong>abgezogen</strong>: ${faktor(`${num(a1)} − ${num(a2)} = ${num(aGes)}`)} x-Terme, nicht ${num(a1 + a2)}.`;
      if (Math.abs(val - (aGes * x + (b1 - b2))) < 0.001)
        return `Das Minus vor der Klammer dreht <em>alle</em> Vorzeichen darin um — auch das der zweiten Zahl. Aus −(${num(-b2)}) wird ${b2 > 0 ? "+" : "−"} ${num(Math.abs(b2))}.`;
      if (Math.abs(val - (aGes + bGes) * x) < 0.001)
        return `${num(aGes)}x und ${num(bGes)} sind <em>nicht</em> gleichartig: das eine ist ein Streifen, das andere ein Kästchen. Sie bleiben getrennt stehen.`;
      return `Löse zuerst die Klammer auf, fasse dann gleichartige Terme zusammen und setze erst zum Schluss x = ${num(x)} ein.`;
    },
    musterloesungHtml:
      `<strong>1. Klammer auflösen:</strong> Das Minus dreht beide Vorzeichen um →<br>` +
      `&nbsp;&nbsp;&nbsp;&nbsp;${num(a1)}x${vorzeichenTeil(b1, "")} − ${num(a2)}x${vorzeichenTeil(b2, "")}<br>` +
      `<strong>2. Gleichartiges zusammenfassen:</strong> ${faktor(`${num(a1)} − ${num(a2)} = ${num(aGes)}`)} und ` +
      `${faktor(`${num(b1)} ${b2 > 0 ? "+" : "−"} ${num(Math.abs(b2))} = ${num(bGes)}`)} →<br>` +
      `&nbsp;&nbsp;&nbsp;&nbsp;<strong>${einfach}</strong><br>` +
      `<strong>3. Einsetzen:</strong> ${faktor(`${num(aGes)} · (${num(x)})`)}${bGes > 0 ? " + " : " − "}${num(Math.abs(bGes))} = <strong>${num(wert)}</strong><br>` +
      `<em>Probe am Ausgangsterm:</em> ${num(a1 * x + b1)} − ${num(a2 * x - b2)} = ${num(wert)} ✓`,
  };
}

// Aufgabe 3 — binomische Formel rückwärts: die fehlende Zahl ergänzen.
const A3_FORMEN = [
  {
    key: "plus",
    // x² + 2qx + q²  —  gesucht ist das Absolutglied q²
    text: (q) => `x² + ${num(2 * q)}x + <strong>□</strong> = (x + ${num(q)})²`,
    luecke: (q) => q * q,
    frage: "Welche Zahl gehört in das Kästchen?",
    weg: (q) => `Nach der 1. binomischen Formel ist (x + ${num(q)})² = x² + ${faktor(`2 · ${num(q)}`)}x + ${num(q)}² = x² + ${num(2 * q)}x + <strong>${num(q * q)}</strong>.`,
  },
  {
    key: "minus",
    text: (q) => `x² − ${num(2 * q)}x + <strong>□</strong> = (x − ${num(q)})²`,
    luecke: (q) => q * q,
    frage: "Welche Zahl gehört in das Kästchen?",
    weg: (q) => `Nach der 2. binomischen Formel ist (x − ${num(q)})² = x² − ${faktor(`2 · ${num(q)}`)}x + ${num(q)}² = x² − ${num(2 * q)}x + <strong>${num(q * q)}</strong>. Das letzte Glied ist auch hier <em>positiv</em>.`,
  },
  {
    key: "mitte",
    // x² + □x + q²  —  gesucht ist der mittlere Koeffizient 2q
    text: (q) => `x² + <strong>□</strong>·x + ${num(q * q)} = (x + ${num(q)})²`,
    luecke: (q) => 2 * q,
    frage: "Welche Zahl gehört in das Kästchen?",
    weg: (q) => `Das letzte Glied ${num(q * q)} ist ${num(q)}², also ist b = ${num(q)}. Der mittlere Koeffizient ist ${faktor(`2 · ${num(q)}`)} = <strong>${num(2 * q)}</strong>.`,
  },
  {
    key: "diff",
    // x² − q²  —  gesucht ist q, so dass (x+q)(x−q)
    text: (q) => `x² − ${num(q * q)} = (x + <strong>□</strong>) · (x − <strong>□</strong>)`,
    luecke: (q) => q,
    frage: "Welche Zahl gehört in beide Kästchen?",
    weg: (q) => `Nach der 3. binomischen Formel ist x² − b² = (x + b)(x − b). Hier ist b² = ${num(q * q)}, also b = <strong>${num(q)}</strong>.`,
  },
];
function generateAufgabe3() {
  const kandidaten = [];
  for (const form of A3_FORMEN) {
    for (const q of [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]) {
      kandidaten.push({ form, q, luecke: form.luecke(q) });
    }
  }
  const k = ohneKollision(
    kandidaten,
    (v) => {
      // Erst die richtige Antwort, dann die Ablenker — und zwar nur die,
      // die hier nicht ohnehin die richtige Antwort sind.
      const werte = [v.luecke];
      for (const ablenker of [v.q, v.q * v.q, 2 * v.q, v.q / 2]) {
        if (ablenker !== v.luecke) werte.push(ablenker);
      }
      return werte;
    },
    kandidaten[0]
  );
  const { form, q, luecke } = k;

  return {
    promptHtml: `Ergänze so, dass die Gleichung für <em>jedes</em> x stimmt:<br>` +
      `<span style="font-family:Cambria Math,Cambria,serif;font-size:1.3rem">${form.text(q)}</span><br>` +
      `<strong>${form.frage}</strong>`,
    correct: luecke,
    tolerance: 0.001,
    placeholder: "Zahl",
    hinweis: (raw, val) => {
      if (Math.abs(val - q) < 0.001 && luecke !== q)
        return `${num(q)} ist die Zahl <em>in der Klammer</em>. Gesucht ist ${form.key === "mitte" ? "ihr Doppeltes" : "ihr Quadrat"}.`;
      if (Math.abs(val - q * q) < 0.001 && luecke !== q * q)
        return `${num(q * q)} ist das Quadrat von ${num(q)}. Hier ist aber ${form.key === "mitte" ? "das Doppelte" : "die Basis selbst"} gefragt.`;
      if (Math.abs(val - 2 * q) < 0.001 && luecke !== 2 * q)
        return `${num(2 * q)} ist der mittlere Koeffizient. Gesucht ist hier das ${form.key === "diff" ? "b selbst" : "letzte Glied"}.`;
      if (form.key === "minus" && Math.abs(val + q * q) < 0.001)
        return `Auch bei der 2. binomischen Formel ist das letzte Glied <strong>positiv</strong>: (−${num(q)})² = ${num(q * q)}.`;
      return `Multipliziere die rechte Seite aus und vergleiche Glied für Glied mit der linken.`;
    },
    musterloesungHtml:
      `${form.weg(q)}<br>` +
      `<em>Probe für x = 1:</em> links ${
        form.key === "plus" ? `1 + ${num(2 * q)} + ${num(q * q)} = ${num(1 + 2 * q + q * q)}`
          : form.key === "minus" ? `1 − ${num(2 * q)} + ${num(q * q)} = ${num(1 - 2 * q + q * q)}`
            : form.key === "mitte" ? `1 + ${num(2 * q)} + ${num(q * q)} = ${num(1 + 2 * q + q * q)}`
              : `1 − ${num(q * q)} = ${num(1 - q * q)}`
      }, rechts ${
        form.key === "diff" ? `${faktor(`(1 + ${num(q)}) · (1 − ${num(q)})`)} = ${num((1 + q) * (1 - q))}`
          : form.key === "minus" ? `(1 − ${num(q)})² = ${num(Math.pow(1 - q, 2))}`
            : `(1 + ${num(q)})² = ${num(Math.pow(1 + q, 2))}`
      } ✓`,
  };
}

// Aufgabe 4 — Term aus einer geometrischen Situation aufstellen und auswerten.
const A4_KONTEXTE = [
  {
    text: (v) => `Ein Rechteck ist <strong>${num(v.p)} cm</strong> länger als breit. Wird die Breite ` +
      `<strong>x</strong> genannt, so hat das Rechteck den Flächeninhalt <strong>x · (x + ${num(v.p)})</strong>.<br>` +
      `Vergrößert man beide Seiten um <strong>${num(v.d)} cm</strong>, so wächst der Flächeninhalt.<br>` +
      `<strong>Um wie viele Quadratzentimeter wächst er, wenn x = ${num(v.x)} cm ist?</strong>`,
    platzhalter: "Zuwachs in cm²",
    // (x+d)(x+p+d) − x(x+p) = d·(2x + p + d)
    wert: (v) => v.d * (2 * v.x + v.p + v.d),
    term: (v) => `(x + ${num(v.d)}) · (x + ${num(v.p + v.d)}) − x · (x + ${num(v.p)})`,
    entwickelt: (v) => `${num(2 * v.d)}x + ${num(v.d * (v.p + v.d))}`,
    einheit: "cm²",
  },
];
function generateAufgabe4() {
  const kandidaten = [];
  for (const p of [1, 2, 3, 4, 5, 6, 7]) {
    for (const d of [1, 2, 3, 4, 5]) {
      for (const x of [2, 3, 4, 5, 6, 7, 8, 9, 10, 12]) {
        const zuwachs = d * (2 * x + p + d);
        if (zuwachs > 200) continue;
        kandidaten.push({ p, d, x, zuwachs });
      }
    }
  }
  const k = ohneKollision(
    kandidaten,
    (v) => [
      v.zuwachs,                                        // richtig
      v.d * v.d,                                        // nur das Eckquadrat gezählt
      2 * v.d * v.x,                                    // die beiden Streifen ohne Ecke und ohne p
      (v.x + v.d) * (v.x + v.p + v.d),                  // die neue Fläche statt des Zuwachses
      v.x * (v.x + v.p),                                // die alte Fläche
      v.p, v.d, v.x,
    ],
    kandidaten[0]
  );
  const kontext = A4_KONTEXTE[0];
  const { p, d, x, zuwachs } = k;
  const altFlaeche = x * (x + p), neuFlaeche = (x + d) * (x + p + d);

  return {
    promptHtml: kontext.text(k),
    correct: zuwachs,
    tolerance: 0.001,
    placeholder: kontext.platzhalter,
    hinweis: (raw, val) => {
      if (Math.abs(val - neuFlaeche) < 0.001)
        return `${num(neuFlaeche)} cm² ist der <em>neue</em> Flächeninhalt. Gefragt ist der Zuwachs, also die Differenz zum alten Wert ${num(altFlaeche)} cm².`;
      if (Math.abs(val - altFlaeche) < 0.001)
        return `${num(altFlaeche)} cm² ist der <em>alte</em> Flächeninhalt.`;
      if (Math.abs(val - d * d) < 0.001)
        return `${num(d * d)} cm² ist nur das kleine Eckquadrat. Dazu kommen noch die beiden Randstreifen entlang der alten Seiten.`;
      if (Math.abs(val - 2 * d * x) < 0.001)
        return `Du hast beide Randstreifen mit der Länge x gerechnet. Die längere Seite misst aber x + ${num(p)}, und die Ecke fehlt noch.`;
      return `Stelle beide Flächeninhalte als Term auf und subtrahiere: ${kontext.term(k)}.`;
    },
    musterloesungHtml:
      `<strong>1. Beide Flächen als Term:</strong> alt <span class="nw">x · (x + ${num(p)})</span>, ` +
      `neu <span class="nw">(x + ${num(d)}) · (x + ${num(p + d)})</span><br>` +
      `<strong>2. Ausmultiplizieren:</strong> alt = x² + ${num(p)}x, ` +
      `neu = x² + ${num(p + 2 * d)}x + ${num(d * (p + d))}<br>` +
      `<strong>3. Differenz bilden:</strong> Die x²-Terme heben sich auf, es bleibt ` +
      `<strong>${kontext.entwickelt(k)}</strong><br>` +
      `<strong>4. Einsetzen:</strong> ${faktor(`${num(2 * d)} · ${num(x)}`)} + ${num(d * (p + d))} = <strong>${num(zuwachs)} cm²</strong><br>` +
      `<em>Probe mit Zahlen:</em> neu ${faktor(`${num(x + d)} · ${num(x + p + d)}`)} = ${num(neuFlaeche)} cm², ` +
      `alt ${faktor(`${num(x)} · ${num(x + p)}`)} = ${num(altFlaeche)} cm², Differenz ${num(zuwachs)} cm² ✓`,
  };
}

function initExercises() {
  mountUebungsaufgaben(document.getElementById("exercises-mount"), [
    { schwierigkeit: "einfach", titel: "Aufgabe 1 — Termwert berechnen", generate: generateAufgabe1 },
    { schwierigkeit: "mittel", titel: "Aufgabe 2 — zusammenfassen und einsetzen", generate: generateAufgabe2 },
    { schwierigkeit: "schwierig", titel: "Aufgabe 3 — binomische Formel rückwärts", generate: generateAufgabe3 },
    { schwierigkeit: "komplex", titel: "Aufgabe 4 — Term aufstellen und auswerten", generate: generateAufgabe4 },
  ]);
}

// ================= Quizze =================

function initQuizzes() {
  mountQuiz(document.getElementById("quiz-term"), {
    q: "Welchen Wert hat der Term x² − 3x für x = −2?",
    options: ["10", "−2", "4", "−10"],
    correct: 0,
    explain: "Eingesetzt mit Klammern: (−2)² − 3 · (−2) = 4 + 6 = 10. Wer die Klammern weglässt, rechnet −4 − 6 = −10 oder 4 − 6 = −2. Beim Quadrieren einer negativen Zahl entsteht eine positive.",
  });
  mountQuiz(document.getElementById("quiz-struktur"), {
    q: "Welcher der folgenden Terme ist ein <em>Produkt</em>?",
    options: [
      "5 · (x + 2)",
      "5x + 2",
      "x² + 5",
      "5 + x · 2",
    ],
    correct: 0,
    explain: "Man fragt nach dem letzten Rechenschritt. Bei 5 · (x + 2) wird zuerst die Klammer gerechnet und zuletzt multipliziert — also ein Produkt. Bei den anderen dreien wird zuletzt addiert; das sind Summen, auch wenn darin multipliziert wird.",
  });
  mountQuiz(document.getElementById("quiz-zusammenfassen"), {
    q: "Was ergibt 4x² + 3x − x² + 5x zusammengefasst?",
    options: ["3x² + 8x", "11x²", "3x² + 8x²", "11x"],
    correct: 0,
    explain: "Gleichartig sind nur die x²-Terme untereinander (4x² − x² = 3x²) und die x-Terme untereinander (3x + 5x = 8x). Zwischen ihnen darf nicht zusammengefasst werden — x und x² sind verschiedene Sorten.",
  });
  mountQuiz(document.getElementById("quiz-ausmultiplizieren"), {
    q: "Was ergibt 7 − 2 · (x − 4)?",
    options: ["15 − 2x", "−1 − 2x", "15 + 2x", "5 − 2x + 4"],
    correct: 0,
    explain: "Erst ausmultiplizieren: 2 · (x − 4) = 2x − 8. Dann 7 − (2x − 8) = 7 − 2x + 8 = 15 − 2x. Das Minus vor der Klammer kehrt beide Vorzeichen um; wer nur das erste dreht, erhält −1 − 2x.",
  });
  mountQuiz(document.getElementById("quiz-binomisch"), {
    q: "Wie lautet x² + 14x + 49 als Quadrat geschrieben?",
    options: ["(x + 7)²", "(x + 14)²", "(x + 49)²", "(x + 7) · (x − 7)"],
    correct: 0,
    explain: "49 ist 7², und der mittlere Koeffizient 14 ist genau 2 · 7. Damit passt die 1. binomische Formel: x² + 2 · 7 · x + 7² = (x + 7)². Die letzte Antwort wäre x² − 49 — dort fehlt das mittlere Glied.",
  });
}

// ================= Start =================

initTermwert();
initStruktur();
initZusammenfassen();
initAusmultiplizieren();
initBinomisch();
initExercises();
initQuizzes();
