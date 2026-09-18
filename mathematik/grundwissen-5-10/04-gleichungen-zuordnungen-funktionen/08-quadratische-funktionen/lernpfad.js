// Selbstlernpfad "Quadratische Funktionen und Gleichungen"
// (Grundwissen Klasse 5-10, Kapitel 4). Rein clientseitiges Vanilla-JS.
//
// Leitgedanke: Alles hängt am Scheitel. Abschnitt 1 zeigt die Normalparabel und
// ihre Symmetrie, Abschnitt 2 verschiebt und formt sie über die Scheitelform,
// Abschnitt 3 rechnet die allgemeine Form in diese Gestalt um, Abschnitt 4 macht
// aus derselben Umformung die pq-Formel, Abschnitt 5 liest an der Diskriminante
// ab, wie viele Nullstellen es gibt, und Abschnitt 6 benutzt den Scheitel als
// größten Wert einer Sachaufgabe.
//
// Durchgehende Farbcodierung: Parabel grün, Scheitel violett, Nullstellen rot,
// p und q orange, Diskriminante blau.

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
function begrenzt(id, wertZahl, min, max) {
  const v = Math.min(max, Math.max(min, wertZahl));
  const e = document.getElementById(id);
  if (Number(e.value) !== v) e.value = String(v);
  return v;
}
function karte(klasse, name, inhalt) {
  return el("div", { class: "qf-karte " + klasse }, [
    el("span", { class: "name" }, name),
    el("span", { class: "wert", html: inhalt }),
  ]);
}
function faktor(text) {
  return `<span class="nw">${text}</span>`;
}
// Negative Zahlen bekommen in einer Rechnung eine Klammer — "3 − −5" ist keine
// Schreibweise, die man einem Kind zumutet.
function klammer(x, stellen = 4) {
  return x < 0 ? `(${num(x, stellen)})` : num(x, stellen);
}
// "+ 3" bzw. "− 3"; die 0 verschwindet ganz.
function anhang(x, klasse = "") {
  if (x === 0) return "";
  const s = klasse ? `<span class="${klasse}">${num(Math.abs(x))}</span>` : num(Math.abs(x));
  return ` ${x > 0 ? "+" : "−"} ${s}`;
}
// Ist der angezeigte Wert bei dieser Stellenzahl exakt, steht dort "=", sonst "≈".
function zeichen(x, stellen) {
  return Math.abs(Number(x.toFixed(stellen)) - x) < 1e-12 ? "=" : "≈";
}
function istQuadrat(a) {
  if (a < 0) return false;
  const w = Math.round(Math.sqrt(a));
  return w * w === a;
}
// Zerlegt a in f² · rest mit dem größtmöglichen f — für die exakte Angabe der
// Wurzel in der pq-Formel.
function quadratfaktor(a) {
  let rest = a, f = 1;
  for (let k = 2; k * k <= rest; k++) {
    while (rest % (k * k) === 0) { rest /= k * k; f *= k; }
  }
  return { f, rest };
}
function wurzelText(a) {
  if (a < 0) return "—";
  if (istQuadrat(a)) return num(Math.sqrt(a));
  const { f, rest } = quadratfaktor(a);
  return f > 1 ? `${num(f)}√${num(rest)}` : `√${num(a)}`;
}

// ---------- Schreibweise der Funktionsterme ----------

// "a · (x − d)² + e" in üblicher Schreibweise: a = 1 und a = −1 werden nicht
// ausgeschrieben, d = 0 lässt die Klammer weg, e = 0 verschwindet.
function scheitelHtml(a, d, e, klassen = {}) {
  const ak = klassen.a || "av", dk = klassen.d || "dv", ek = klassen.e || "ev";
  const kopf = a === 1 ? "" : a === -1 ? "−" : `<span class="${ak}">${num(a)}</span> · `;
  const klam = d === 0 ? "x²" : `(x ${d > 0 ? "−" : "+"} <span class="${dk}">${num(Math.abs(d))}</span>)²`;
  return kopf + klam + anhang(e, ek);
}
// "x² + px + q"
function normalHtml(p, q, klassen = {}) {
  const pk = klassen.p || "pv", qk = klassen.q || "qv";
  const pTeil = p === 0 ? "" : ` ${p > 0 ? "+" : "−"} ${Math.abs(p) === 1 ? "" : `<span class="${pk}">${num(Math.abs(p))}</span>`}x`;
  return `x²${pTeil}${anhang(q, qk)}`;
}
function normalRein(p, q) {
  const pTeil = p === 0 ? "" : ` ${p > 0 ? "+" : "−"} ${Math.abs(p) === 1 ? "" : num(Math.abs(p))}x`;
  return `x²${pTeil}${q === 0 ? "" : ` ${q > 0 ? "+" : "−"} ${num(Math.abs(q))}`}`;
}
function scheitelRein(a, d, e) {
  const kopf = a === 1 ? "" : a === -1 ? "−" : num(a) + " · ";
  const klam = d === 0 ? "x²" : `(x ${d > 0 ? "−" : "+"} ${num(Math.abs(d))})²`;
  return kopf + klam + (e === 0 ? "" : ` ${e > 0 ? "+" : "−"} ${num(Math.abs(e))}`);
}
function schrittZeile(inhaltHtml, grundHtml, klasse = "", kommentar = "") {
  return `<div class="zeile ${klasse}">` +
    `<span class="gl">${inhaltHtml}</span>` +
    (grundHtml ? `<span class="grund">${grundHtml}</span>` : "") +
    (kommentar ? `<span class="kommentar">${kommentar}</span>` : "") +
    `</div>`;
}

// ---------- Koordinatensystem ----------

function koordinaten(svg, opt) {
  const { links, oben, breite, hoehe, xMin, xMax, yMin, yMax, xSchritt = 1, ySchritt = 2 } = opt;
  const px = (x) => links + ((x - xMin) / (xMax - xMin)) * breite;
  const py = (y) => oben + hoehe - ((y - yMin) / (yMax - yMin)) * hoehe;

  for (let x = Math.ceil(xMin); x <= xMax; x += xSchritt) {
    svg.appendChild(svgEl("line", { x1: px(x).toFixed(2), y1: py(yMax).toFixed(2), x2: px(x).toFixed(2), y2: py(yMin).toFixed(2), class: "qf-gitter" }));
    if (x !== 0 && x % (xSchritt * 2) === 0) svg.appendChild(svgText(px(x), py(0) + 14, num(x), { class: "qf-achsentext" }));
  }
  for (let y = Math.ceil(yMin / ySchritt) * ySchritt; y <= yMax; y += ySchritt) {
    svg.appendChild(svgEl("line", { x1: px(xMin).toFixed(2), y1: py(y).toFixed(2), x2: px(xMax).toFixed(2), y2: py(y).toFixed(2), class: "qf-gitter" }));
    if (y !== 0) svg.appendChild(svgText(px(0) - 7, py(y) + 4, num(y), { class: "qf-achsentext", "text-anchor": "end" }));
  }
  svg.appendChild(svgEl("line", { x1: px(xMin).toFixed(2), y1: py(0).toFixed(2), x2: (px(xMax) + 12).toFixed(2), y2: py(0).toFixed(2), class: "qf-achse" }));
  svg.appendChild(svgEl("line", { x1: px(0).toFixed(2), y1: py(yMin).toFixed(2), x2: px(0).toFixed(2), y2: (py(yMax) - 12).toFixed(2), class: "qf-achse" }));
  svg.appendChild(svgText(px(0) - 7, py(0) + 14, "0", { class: "qf-achsentext", "text-anchor": "end" }));
  svg.appendChild(svgText(px(xMax) + 12, py(0) + 20, "x", { class: "qf-achsenname", "text-anchor": "end" }));
  svg.appendChild(svgText(px(0) + 9, py(yMax) + 10, "y", { class: "qf-achsenname", "text-anchor": "start" }));
  return { px, py };
}

// Zeichnet eine Kurve, am Fenster abgeschnitten. Verlässt sie den Ausschnitt und
// kommt zurück, entsteht ein neuer Teilzug — sonst zöge eine gerade Linie quer
// durchs Bild, die es gar nicht gibt.
function kurveZeichnen(svg, g, f, xMin, xMax, yMin, yMax, klasse, schritte = 300) {
  let d = "", offen = false;
  for (let i = 0; i <= schritte; i++) {
    const x = xMin + (i / schritte) * (xMax - xMin);
    const y = f(x);
    if (!isFinite(y) || y < yMin || y > yMax) { offen = false; continue; }
    d += `${offen ? " L " : " M "}${g.px(x).toFixed(2)} ${g.py(y).toFixed(2)}`;
    offen = true;
  }
  if (d) svg.appendChild(svgEl("path", { d: d.trim(), class: "qf-parabel " + klasse }));
}

function punktZeichnen(svg, g, x, y, klasse, beschriftung, rechts = true, oben = true) {
  svg.appendChild(svgEl("circle", { cx: g.px(x).toFixed(2), cy: g.py(y).toFixed(2), r: 5, class: "qf-punkt " + klasse }));
  if (beschriftung) {
    svg.appendChild(svgText(g.px(x) + (rechts ? 9 : -9), g.py(y) + (oben ? -9 : 17), beschriftung, {
      class: "qf-punkttext " + klasse, "text-anchor": rechts ? "start" : "end",
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

// ================= 1. Die Normalparabel =================

function npBild(x0) {
  const B = 460, H = 320;
  const svg = neueFlaeche(B, H);
  const xMin = -5, xMax = 5, yMin = -2, yMax = 18;
  const g = koordinaten(svg, { links: 48, oben: 26, breite: 362, hoehe: 262, xMin, xMax, yMin, yMax, xSchritt: 1, ySchritt: 2 });
  svg.appendChild(svgText(B / 2, 16, "Die Normalparabel y = x² und ihre Symmetrie", { class: "qf-titel" }));
  kurveZeichnen(svg, g, (x) => x * x, xMin, xMax, yMin, yMax, "");
  // Die Symmetrieachse ist hier die y-Achse; sie wird eigens gezeigt, weil
  // die Spiegelung der eigentliche Inhalt des Abschnitts ist.
  svg.appendChild(svgEl("line", { x1: g.px(0).toFixed(2), y1: g.py(yMin).toFixed(2), x2: g.px(0).toFixed(2), y2: g.py(yMax).toFixed(2), class: "qf-achsensymmetrie" }));
  const y0 = x0 * x0;
  if (x0 !== 0) {
    svg.appendChild(svgEl("line", { x1: g.px(-x0).toFixed(2), y1: g.py(y0).toFixed(2), x2: g.px(x0).toFixed(2), y2: g.py(y0).toFixed(2), class: "qf-lot" }));
    punktZeichnen(svg, g, -x0, y0, "spiegel", `(${num(-x0)} | ${num(y0)})`, x0 > 0 ? false : true, true);
  }
  punktZeichnen(svg, g, x0, y0, "wert", `(${num(x0)} | ${num(y0)})`, x0 >= 0, true);
  punktZeichnen(svg, g, 0, 0, "scheitel", "S(0 | 0)", true, false);
  return svg;
}

function renderNormalparabel() {
  const x0 = Number(document.getElementById("np-x").value);
  document.getElementById("np-x-anzeige").textContent = num(x0);
  const mount = document.getElementById("np-mount");
  mount.innerHTML = "";
  mount.appendChild(npBild(x0));

  const xs = [-4, -3, -2, -1, 0, 1, 2, 3, 4];
  const zeileX = xs.map((x) => `<td class="x${x === x0 ? " scheitel" : ""}">${num(x)}</td>`).join("");
  const zeileY = xs.map((x) => `<td class="y${x === x0 ? " scheitel" : ""}">${num(x * x)}</td>`).join("");
  const zeileD = xs.map((x, i) => {
    if (i === 0) return "<td></td>";
    const dz = x * x - xs[i - 1] * xs[i - 1];
    return `<td>${dz > 0 ? "+" : "−"} ${num(Math.abs(dz))}</td>`;
  }).join("");
  document.getElementById("np-tabelle").innerHTML =
    `<caption>Wertetabelle — die markierte Spalte gehört zum Regler</caption>` +
    `<tr><th>x</th>${zeileX}</tr><tr><th>y = x²</th>${zeileY}</tr><tr><th>Zuwachs</th>${zeileD}</tr>`;

  const karten = document.getElementById("np-karten");
  karten.innerHTML = "";
  karten.appendChild(karte("d", "Stelle x", num(x0)));
  karten.appendChild(karte("a", "f(x) = x²", num(x0 * x0)));
  karten.appendChild(karte("a", "f(−x)", num(x0 * x0)));
  karten.appendChild(karte("s", "Scheitel", "S(0 | 0)"));

  document.getElementById("np-bilanz").innerHTML =
    `<span class="wa">f(${klammer(x0)}) = ${klammer(x0)}² = ${num(x0 * x0)}</span> und ` +
    `<span class="wa">f(${klammer(-x0)}) = ${klammer(-x0)}² = ${num(x0 * x0)}</span> — derselbe Wert. ` +
    `Deshalb liegen die beiden Punkte gleich hoch, symmetrisch zur y-Achse. ` +
    `Rechts vom Scheitel wächst y in den Schritten <span class="wp">1, 3, 5, 7</span> — immer schneller; ` +
    `links davon fällt es spiegelbildlich in den Schritten <span class="wp">−7, −5, −3, −1</span>. ` +
    `Weil diese Schritte nicht gleich groß sind, ist die Parabel keine Gerade.`;

  document.getElementById("np-text").innerHTML = x0 === 0
    ? `<span class="qf-urteil eins">Der Scheitel</span> Bei x = 0 fallen Punkt und Spiegelpunkt zusammen — das ist der tiefste Punkt der Normalparabel.`
    : `<span class="qf-urteil ja">f(${num(x0)}) = f(${num(-x0)}) = ${num(x0 * x0)}</span> ` +
      `Zwei verschiedene Stellen mit demselben Wert — bei einer Funktion ist das erlaubt. Verboten wäre nur ein x mit zwei Werten.`;
}

function initNormalparabel() {
  document.getElementById("np-x").addEventListener("input", renderNormalparabel);
  renderNormalparabel();
}

// ================= 2. Die Scheitelform =================

function sfBild(a, d, e) {
  const B = 460, H = 330;
  const svg = neueFlaeche(B, H);
  const xMin = -8, xMax = 8, yMin = -8, yMax = 10;
  const g = koordinaten(svg, { links: 44, oben: 26, breite: 372, hoehe: 272, xMin, xMax, yMin, yMax, xSchritt: 1, ySchritt: 2 });
  svg.appendChild(svgText(B / 2, 16, "Grün: die Parabel · gestrichelt: die Normalparabel zum Vergleich", { class: "qf-titel" }));
  kurveZeichnen(svg, g, (x) => x * x, xMin, xMax, yMin, yMax, "norm");
  kurveZeichnen(svg, g, (x) => a * (x - d) * (x - d) + e, xMin, xMax, yMin, yMax, "");
  svg.appendChild(svgEl("line", { x1: g.px(d).toFixed(2), y1: g.py(yMin).toFixed(2), x2: g.px(d).toFixed(2), y2: g.py(yMax).toFixed(2), class: "qf-achsensymmetrie" }));
  if (d !== 0) {
    svg.appendChild(svgText(g.px(d) + (d > 0 ? 5 : -5), g.py(yMax) + 22, `x = ${num(d)}`,
      { class: "qf-punkttext scheitel", "text-anchor": d > 0 ? "start" : "end" }));
  }
  punktZeichnen(svg, g, d, e, "scheitel", `S(${num(d)} | ${num(e)})`, d < 4, a > 0);
  return svg;
}

function renderScheitelform() {
  // a = 0 wäre keine quadratische Funktion mehr, sondern eine Gerade. Der
  // Regler springt deshalb über die 0 hinweg.
  let a = Number(document.getElementById("sf-a").value);
  if (a === 0) a = begrenzt("sf-a", 0.5, -3, 3);
  const d = Number(document.getElementById("sf-d").value);
  const e = Number(document.getElementById("sf-e").value);
  document.getElementById("sf-a-anzeige").textContent = num(a);
  document.getElementById("sf-d-anzeige").textContent = num(d);
  document.getElementById("sf-e-anzeige").textContent = num(e);

  document.getElementById("sf-gleichung").innerHTML = `f(x) = ${scheitelHtml(a, d, e)}`;
  const mount = document.getElementById("sf-mount");
  mount.innerHTML = "";
  mount.appendChild(sfBild(a, d, e));

  const karten = document.getElementById("sf-karten");
  karten.innerHTML = "";
  karten.appendChild(karte("a", "Formfaktor a", num(a)));
  karten.appendChild(karte("s", "Scheitel", `S(${num(d)} | ${num(e)})`));
  karten.appendChild(karte("s", "Symmetrieachse", `x = ${num(d)}`));
  karten.appendChild(karte("n", a > 0 ? "kleinster Wert" : "größter Wert", num(e)));

  // Die ausmultiplizierte Form zeigt, dass Scheitelform und allgemeine Form
  // dieselbe Funktion beschreiben.
  const b = -2 * a * d, c = a * d * d + e;
  document.getElementById("sf-bilanz").innerHTML =
    `<strong>Ausmultipliziert:</strong> ${scheitelRein(a, d, e)} = ` +
    `<span class="wa">${a === 1 ? "" : a === -1 ? "−" : num(a)}x²${b === 0 ? "" : ` ${b > 0 ? "+" : "−"} ${num(Math.abs(b))}x`}${c === 0 ? "" : ` ${c > 0 ? "+" : "−"} ${num(Math.abs(c))}`}</span>. ` +
    `Beide Formen beschreiben dieselbe Parabel — die Scheitelform zeigt den Scheitel, die allgemeine Form den y-Achsenabschnitt f(0) = ${num(c)}.`;

  const wieBreit = Math.abs(a) > 1 ? "schmaler" : Math.abs(a) < 1 ? "breiter" : "genauso breit wie";
  document.getElementById("sf-text").innerHTML =
    `<span class="qf-urteil ${a > 0 ? "ja" : "nein"}">${a > 0 ? "nach oben geöffnet" : "nach unten geöffnet"}</span> ` +
    `a = ${num(a)} ist ${a > 0 ? "positiv" : "negativ"}, also hat die Parabel ${a > 0 ? "einen tiefsten" : "einen höchsten"} Punkt: ` +
    `Der Scheitel S(${num(d)} | ${num(e)}) ist ihr ${a > 0 ? "Minimum" : "Maximum"}. ` +
    `Wegen |a| = ${num(Math.abs(a))} ist sie ${wieBreit} die Normalparabel.`;
}

function initScheitelform() {
  ["sf-a", "sf-d", "sf-e"].forEach((id) => document.getElementById(id).addEventListener("input", renderScheitelform));
  renderScheitelform();
}

// ================= 3. Die quadratische Ergänzung =================

// p wird gerade gewählt, damit p : 2 eine ganze Zahl ist — sonst verdeckt das
// Bruchrechnen den eigentlichen Gedanken.
const QE_KANDIDATEN = (() => {
  const liste = [];
  for (let k = -5; k <= 5; k++) {
    if (k === 0) continue;
    for (let q = -8; q <= 8; q++) {
      const e = q - k * k;
      if (e < -12 || e > 8) continue;
      liste.push({ p: 2 * k, q, k, d: -k, e });
    }
  }
  return liste;
})();

function qeBaue() {
  const { p, q, k, d, e } = pick(QE_KANDIDATEN);
  const schritte = [
    schrittZeile(`f(x) = ${normalHtml(p, q)}`, "die gegebene Form", "",
      `Vor dem x steht <span class="pv">${num(p)}</span>. Die Hälfte davon ist <strong>${num(k)}</strong>, ihr Quadrat <strong>${num(k * k)}</strong>.`),
    schrittZeile(`= x² ${p > 0 ? "+" : "−"} ${Math.abs(p) === 1 ? "" : num(Math.abs(p))}x <strong>+ ${num(k * k)} − ${num(k * k)}</strong>${anhang(q)}`,
      `| + ${num(k * k)} − ${num(k * k)}`, "",
      "Addiert <em>und</em> subtrahiert: Zusammen ist das 0, der Term ändert sich also nicht — nur seine Gestalt."),
    schrittZeile(`= <strong>(x ${k > 0 ? "+" : "−"} ${num(Math.abs(k))})²</strong> − ${num(k * k)}${anhang(q)}`,
      "binomische Formel", "",
      `Die ersten drei Summanden sind x² ${p > 0 ? "+" : "−"} ${num(Math.abs(p))}x + ${num(k * k)} = (x ${k > 0 ? "+" : "−"} ${num(Math.abs(k))})².`),
    schrittZeile(`= ${scheitelHtml(1, d, e)}`, "Zahlen zusammenfassen", "fertig",
      `Aus − ${num(k * k)}${anhang(q)} wird ${num(e)}.`),
    schrittZeile(`Scheitel: <span class="dv">S(${num(d)} | ${num(e)})</span>`, "ablesen", "fertig",
      `Die Klammer wird bei x = ${num(d)} null — dort liegt der Scheitel, und der Funktionswert ist dann ${num(e)}.`),
    schrittZeile(`Probe: f(${klammer(d)}) = ${klammer(d)}² ${p > 0 ? "+" : "−"} ${faktor(`${num(Math.abs(p))} · ${klammer(d)}`)}${anhang(q)} = ${num(d * d + p * d + q)}`,
      `= ${num(e)} ✓`, "fertig",
      "Beide Formen müssen an derselben Stelle denselben Wert liefern."),
  ];
  return {
    schritte,
    gleichungHtml: `f(x) = ${normalHtml(p, q)} = ${scheitelHtml(1, d, e)}`,
    bild: () => {
      const B = 420, H = 280;
      const svg = neueFlaeche(B, H);
      const xMin = -8, xMax = 8, yMin = -14, yMax = 10;
      const g = koordinaten(svg, { links: 46, oben: 26, breite: 330, hoehe: 226, xMin, xMax, yMin, yMax, xSchritt: 1, ySchritt: 4 });
      kurveZeichnen(svg, g, (x) => x * x + p * x + q, xMin, xMax, yMin, yMax, "");
      svg.appendChild(svgEl("line", { x1: g.px(d).toFixed(2), y1: g.py(yMin).toFixed(2), x2: g.px(d).toFixed(2), y2: g.py(yMax).toFixed(2), class: "qf-achsensymmetrie" }));
      if (e >= yMin && e <= yMax) punktZeichnen(svg, g, d, e, "scheitel", `S(${num(d)} | ${num(e)})`, d < 3, false);
      svg.appendChild(svgText(B / 2, 16, "Der Scheitel, den die Umformung sichtbar macht", { class: "qf-titel" }));
      return svg;
    },
    bilanz: `<strong>Ergebnis:</strong> <span class="wp">${normalRein(p, q)}</span> = <span class="ws">${scheitelRein(1, d, e)}</span>, ` +
      `also <span class="ws">S(${num(d)} | ${num(e)})</span>. ` +
      `Merke die beiden Vorzeichenwechsel: Aus <span class="wp">${num(p)}</span> vor dem x wird die halbe Zahl <strong>${num(k)}</strong> in der Klammer — ` +
      `und der Scheitel liegt bei <strong>${num(d)}</strong>, also beim <em>Gegenteil</em> davon.`,
  };
}

function initErgaenzung() {
  mountProtokoll({ neu: "qe-neu", schritt: "qe-schritt", alle: "qe-alle", schritte: "qe-schritte", bilanz: "qe-bilanz", gleichung: "qe-gleichung", mount: "qe-mount" }, qeBaue).neu();
}

// ================= 4. Die pq-Formel =================

// Damit die Rechnung glatt aufgeht, werden zuerst die Lösungen festgelegt und
// daraus p und q berechnet: p = −(x₁ + x₂), q = x₁ · x₂. Beide Lösungen haben
// dieselbe Parität, dann ist p gerade und die Wurzel eine ganze Zahl.
const PQ_KANDIDATEN = (() => {
  const liste = [];
  for (let x1 = -6; x1 <= 6; x1++) {
    for (let x2 = x1; x2 <= 6; x2++) {
      if ((x1 - x2) % 2 !== 0) continue;
      const p = -(x1 + x2), q = x1 * x2;
      if (Math.abs(p) > 10 || Math.abs(q) > 24) continue;
      liste.push({ x1, x2, p, q });
    }
  }
  return liste;
})();

function pqBaue() {
  const { x1, x2, p, q } = pick(PQ_KANDIDATEN);
  const halb = p / 2, D = halb * halb - q, w = Math.sqrt(D);
  const doppelt = D === 0;
  const schritte = [
    schrittZeile(`${normalHtml(p, q)} = 0`, "Normalform", "",
      "Vor dem x² steht eine 1 — die Formel ist anwendbar. Sonst müsste man zuerst durch den Faktor teilen."),
    schrittZeile(`p = <span class="pv">${num(p)}</span>, q = <span class="qv">${num(q)}</span> → p : 2 = ${num(halb)}, (p : 2)² = ${num(halb * halb)}`,
      "Werte einsetzen"),
    schrittZeile(`D = (p : 2)² − q = ${num(halb * halb)} − ${klammer(q)} = <span class="dis">${num(D)}</span>`,
      "Diskriminante", "",
      doppelt ? "D = 0 — die Wurzel ist 0, und beide Lösungen fallen zusammen."
        : `D = ${num(D)} ist positiv, also gibt es zwei Lösungen. √${num(D)} = ${num(w)}.`),
    schrittZeile(`x<sub>1,2</sub> = ${num(-halb)} ± √${num(D)} = ${num(-halb)} ± ${num(w)}`, "pq-Formel"),
    doppelt
      ? schrittZeile(`x = <span class="nv">${num(x1)}</span>`, "eine Lösung", "fertig",
        "Weil die Wurzel 0 ist, liefert das ± zweimal denselben Wert. Man spricht von einer doppelten Lösung.")
      : schrittZeile(`x<sub>1</sub> = <span class="nv">${num(-halb + w)}</span>, x<sub>2</sub> = <span class="nv">${num(-halb - w)}</span>`,
        "beide Vorzeichen", "fertig"),
    schrittZeile(`Probe: ${klammer(x1)}² ${p > 0 ? "+" : "−"} ${faktor(`${num(Math.abs(p))} · ${klammer(x1)}`)}${anhang(q)} = ${num(x1 * x1 + p * x1 + q)}`,
      "= 0 ✓", "fertig",
      doppelt ? "" : `Und für die zweite Lösung: ${klammer(x2)}² ${p > 0 ? "+" : "−"} ${num(Math.abs(p))} · ${klammer(x2)}${anhang(q)} = ${num(x2 * x2 + p * x2 + q)} ✓`),
    schrittZeile(doppelt ? `L = { ${num(x1)} }` : `L = { ${num(Math.min(x1, x2))} ; ${num(Math.max(x1, x2))} }`,
      "Lösungsmenge", "fertig"),
  ];
  return {
    schritte,
    gleichungHtml: `${normalHtml(p, q)} = 0`,
    bild: () => {
      const B = 420, H = 280;
      const svg = neueFlaeche(B, H);
      const xMin = -9, xMax = 9, yMin = -14, yMax = 12;
      const g = koordinaten(svg, { links: 46, oben: 26, breite: 330, hoehe: 226, xMin, xMax, yMin, yMax, xSchritt: 1, ySchritt: 4 });
      kurveZeichnen(svg, g, (x) => x * x + p * x + q, xMin, xMax, yMin, yMax, "");
      const sy = q - halb * halb;
      if (doppelt) {
        punktZeichnen(svg, g, x1, 0, "scheitel", `x = ${num(x1)} — zugleich der Scheitel`, x1 <= 0, true);
      } else {
        punktZeichnen(svg, g, x1, 0, "null", `x₁ = ${num(x1)}`, x1 <= 0, true);
        punktZeichnen(svg, g, x2, 0, "null", `x₂ = ${num(x2)}`, x2 > 0, true);
        if (sy >= yMin && sy <= yMax) punktZeichnen(svg, g, -halb, sy, "scheitel", "S", true, false);
      }
      svg.appendChild(svgText(B / 2, 16,
        doppelt ? "Die Parabel berührt die x-Achse — eine Lösung" : "Die Nullstellen der Parabel sind die Lösungen",
        { class: "qf-titel" }));
      return svg;
    },
    bilanz: `<strong>Ergebnis:</strong> ${doppelt
      ? `eine doppelte Lösung <span class="wn">x = ${num(x1)}</span>. Die Parabel berührt die x-Achse in ihrem Scheitel.`
      : `<span class="wn">x₁ = ${num(Math.min(x1, x2))}</span> und <span class="wn">x₂ = ${num(Math.max(x1, x2))}</span>. Die Parabel schneidet die x-Achse an genau diesen beiden Stellen.`}<br>` +
      `<strong>Zur Kontrolle:</strong> Die Summe der Lösungen ist ${num(x1 + x2)} = <span class="wp">−p</span>, ihr Produkt ${num(x1 * x2)} = <span class="wp">q</span>. ` +
      `Das gilt bei jeder quadratischen Gleichung in Normalform und ist eine schnelle Probe.`,
  };
}

function initPq() {
  mountProtokoll({ neu: "pq-neu", schritt: "pq-schritt", alle: "pq-alle", schritte: "pq-schritte", bilanz: "pq-bilanz", gleichung: "pq-gleichung", mount: "pq-mount" }, pqBaue).neu();
}

// ================= 5. Die Diskriminante =================

function diBild(p, q, D) {
  const B = 460, H = 320;
  const svg = neueFlaeche(B, H);
  const xMin = -10, xMax = 10, yMin = -14, yMax = 14;
  const g = koordinaten(svg, { links: 46, oben: 26, breite: 366, hoehe: 264, xMin, xMax, yMin, yMax, xSchritt: 1, ySchritt: 4 });
  const halb = p / 2, sy = q - halb * halb;
  kurveZeichnen(svg, g, (x) => x * x + p * x + q, xMin, xMax, yMin, yMax, "");
  if (sy >= yMin && sy <= yMax) punktZeichnen(svg, g, -halb, sy, "scheitel", `S(${num(-halb)} | ${num(sy)})`, -halb < 2, D < 0);
  if (D >= 0) {
    const w = Math.sqrt(D);
    const sichtbar = (x) => x >= xMin && x <= xMax;
    const x1 = -halb - w, x2 = -halb + w;
    if (sichtbar(x1)) punktZeichnen(svg, g, x1, 0, "null", `${num(x1, 2)}`, false, true);
    if (D > 0 && sichtbar(x2)) punktZeichnen(svg, g, x2, 0, "null", `${num(x2, 2)}`, true, true);
  }
  svg.appendChild(svgText(B / 2, 16,
    D > 0 ? "D > 0: die Parabel schneidet die x-Achse zweimal"
      : D === 0 ? "D = 0: die Parabel berührt die x-Achse"
        : "D < 0: die Parabel trifft die x-Achse nicht", { class: "qf-titel" }));
  return svg;
}

function renderDiskriminante() {
  const p = Number(document.getElementById("di-p").value);
  const q = Number(document.getElementById("di-q").value);
  document.getElementById("di-p-anzeige").textContent = num(p);
  document.getElementById("di-q-anzeige").textContent = num(q);
  const halb = p / 2, D = halb * halb - q;

  document.getElementById("di-gleichung").innerHTML = `${normalHtml(p, q)} = 0`;
  const mount = document.getElementById("di-mount");
  mount.innerHTML = "";
  mount.appendChild(diBild(p, q, D));

  let ergebnis, fall, urteil;
  if (D > 0) {
    const w = Math.sqrt(D);
    const x1 = -halb - w, x2 = -halb + w;
    const exakt = istQuadrat(D)
      ? `x₁ = <span class="nv">${num(x1)}</span>, x₂ = <span class="nv">${num(x2)}</span>`
      : `x₁ = ${num(-halb)} − ${wurzelText(D)} ≈ <span class="nv">${num(x1, 3)}</span>, x₂ = ${num(-halb)} + ${wurzelText(D)} ≈ <span class="nv">${num(x2, 3)}</span>`;
    ergebnis = schrittZeile(`x<sub>1,2</sub> = ${num(-halb)} ± √<span class="dis">${num(D)}</span> → ${exakt}`,
      "zwei Lösungen", "fertig",
      istQuadrat(D) ? "" : `√${num(D)} ist keine ganze Zahl — exakt bleibt ${wurzelText(D)} stehen, die Dezimalzahl ist nur eine Näherung.`);
    fall = 0;
    urteil = `<span class="qf-urteil ja">zwei Lösungen</span> D = ${num(D)} ist positiv. Die Parabel schneidet die x-Achse an zwei Stellen.`;
  } else if (D === 0) {
    ergebnis = schrittZeile(`x = ${num(-halb)} ± √0 = <span class="nv">${num(-halb)}</span>`, "eine Lösung", "fertig",
      "Die Wurzel ist 0, also liefert das ± zweimal denselben Wert — eine doppelte Lösung.");
    fall = 1;
    urteil = `<span class="qf-urteil eins">genau eine Lösung</span> D = 0. Die Parabel berührt die x-Achse in ihrem Scheitel S(${num(-halb)} | 0).`;
  } else {
    ergebnis = schrittZeile(`√<span class="dis">${num(D)}</span> ist nicht definiert → L = { }`, "keine Lösung", "warnung",
      "Aus einer negativen Zahl lässt sich keine Quadratwurzel ziehen — kein Quadrat ist negativ.");
    fall = 2;
    urteil = `<span class="qf-urteil nein">keine Lösung</span> D = ${num(D)} ist negativ. Die Parabel liegt ganz oberhalb der x-Achse; ihr tiefster Punkt hat schon die Höhe ${num(q - halb * halb)}.`;
  }
  document.getElementById("di-schritte").innerHTML =
    schrittZeile(`D = (p : 2)² − q = ${klammer(halb)}² − ${klammer(q)} = ${num(halb * halb)} − ${klammer(q)} = <span class="dis">${num(D)}</span>`,
      "Diskriminante") + ergebnis;

  const beschreibung = [
    { t: "D > 0 — zwei Lösungen", m: "x₁,₂ = −p:2 ± √D", p: "Die Parabel schneidet die x-Achse zweimal." },
    { t: "D = 0 — eine Lösung", m: "x = −p:2", p: "Die Parabel berührt die x-Achse in ihrem Scheitel." },
    { t: "D < 0 — keine Lösung", m: "L = { }", p: "Die Parabel trifft die x-Achse nicht. Das ist eine vollständige Antwort." },
  ];
  document.getElementById("di-faelle").innerHTML = beschreibung.map((f, i) =>
    `<div class="qf-fall${i === fall ? " aktiv" : ""}"><h4>${i === fall ? "▸ " : ""}${f.t}</h4>` +
    `<p><span class="merkmal">${f.m}</span></p><p>${f.p}</p></div>`).join("");

  document.getElementById("di-text").innerHTML = urteil;
}

function initDiskriminante() {
  ["di-p", "di-q"].forEach((id) => document.getElementById(id).addEventListener("input", renderDiskriminante));
  renderDiskriminante();
}

// ================= 6. Größte und kleinste Werte =================

function exBild(U, x) {
  const B = 460, H = 300;
  const svg = neueFlaeche(B, H);
  const halbU = U / 2, best = U / 4;
  const maxA = best * best;
  const xMin = 0, xMax = halbU, yMin = 0, yMax = Math.ceil(maxA / 10) * 10 + 10;
  const g = koordinaten(svg, {
    links: 54, oben: 26, breite: 246, hoehe: 232, xMin, xMax, yMin, yMax,
    xSchritt: 1, ySchritt: Math.max(10, Math.round(yMax / 6 / 10) * 10),
  });
  svg.appendChild(svgText(180, 16, "Die Fläche A(x) = x · (U : 2 − x)", { class: "qf-titel" }));
  kurveZeichnen(svg, g, (t) => t * (halbU - t), xMin, xMax, yMin, yMax, "");
  punktZeichnen(svg, g, best, maxA, "scheitel", `größte Fläche ${num(maxA)}`, best < halbU * 0.6, true);
  const y = halbU - x;
  punktZeichnen(svg, g, x, x * y, "wert", "", true, true);
  svg.appendChild(svgEl("line", { x1: g.px(x).toFixed(2), y1: g.py(0).toFixed(2), x2: g.px(x).toFixed(2), y2: g.py(x * y).toFixed(2), class: "qf-lot" }));

  // Rechts das Rechteck selbst, maßstäblich zur Zaunlänge.
  const e = 150 / halbU;
  const rx = 330, ry = 250;
  svg.appendChild(svgEl("rect", {
    x: rx.toFixed(2), y: (ry - y * e).toFixed(2), width: (x * e).toFixed(2), height: (y * e).toFixed(2),
    fill: "#157347", "fill-opacity": "0.15", stroke: "#157347", "stroke-width": "2",
  }));
  svg.appendChild(svgText(rx + (x * e) / 2, ry + 16, `x = ${num(x)} m`, { class: "qf-punkttext wert" }));
  svg.appendChild(svgText(rx + x * e + 6, ry - (y * e) / 2 + 4, `${num(y)} m`, { class: "qf-punkttext wert", "text-anchor": "start" }));
  svg.appendChild(svgText(rx + 40, 40, `Umfang ${num(U)} m`, { class: "qf-achsenname" }));
  svg.appendChild(svgText(rx + 40, 56, `Fläche ${num(x * y)} m²`, { class: "qf-punkttext wert" }));
  return svg;
}

function renderExtremwert() {
  const U = Number(document.getElementById("ex-u").value);
  const halbU = U / 2;
  // Die Breite muss echt zwischen 0 und der halben Zaunlänge liegen — sonst
  // bliebe für die zweite Seite nichts übrig.
  const x = begrenzt("ex-x", Number(document.getElementById("ex-x").value), 1, halbU - 1);
  document.getElementById("ex-u-anzeige").textContent = num(U);
  document.getElementById("ex-x-anzeige").textContent = num(x);
  const y = halbU - x, A = x * y, best = U / 4, maxA = best * best;

  document.getElementById("ex-aufgabe").innerHTML =
    `<strong>Aufgabe:</strong> Ein <span class="term">${num(U)} m</span> langer Zaun soll ein rechteckiges Beet umschließen. ` +
    `Wie muss man ihn legen, damit die eingeschlossene Fläche <em>am größten</em> wird?`;

  const mount = document.getElementById("ex-mount");
  mount.innerHTML = "";
  mount.appendChild(exBild(U, x));

  document.getElementById("ex-schritte").innerHTML =
    schrittZeile(`2x + 2y = ${num(U)} → y = ${num(halbU)} − x`, "1. Ansatz", "",
      "Der Zaun umschließt alle vier Seiten. Ist die Breite x, so ist die Höhe festgelegt.") +
    schrittZeile(`A(x) = x · (${num(halbU)} − x) = −x² + ${num(halbU)}x`, "2. Term aufstellen", "",
      "Der Flächeninhalt ist eine quadratische Funktion der Breite — mit negativem a, also nach unten geöffnet.") +
    schrittZeile(`A(x) = −(x² − ${num(halbU)}x) = −((x − ${num(best)})² − ${num(best * best)}) = −(x − ${num(best)})² + ${num(maxA)}`,
      "3. Scheitelform", "",
      `Quadratische Ergänzung mit der halben Zahl ${num(best)} und ihrem Quadrat ${num(best * best)}.`) +
    schrittZeile(`Scheitel: <span class="dv">S(${num(best)} | ${num(maxA)})</span>`, "4. Ablesen", "fertig",
      `Weil a = −1 negativ ist, ist der Scheitel der <strong>höchste</strong> Punkt: Die größte Fläche beträgt ${num(maxA)} m², erreicht bei der Breite ${num(best)} m.`);

  const karten = document.getElementById("ex-karten");
  karten.innerHTML = "";
  karten.appendChild(karte("a", "Breite x", num(x) + " m"));
  karten.appendChild(karte("a", "Höhe y", num(y) + " m"));
  karten.appendChild(karte("d", "Fläche A(x)", num(A) + " m²"));
  karten.appendChild(karte("s", "größtmöglich", num(maxA) + " m²"));

  const optimal = x === best;
  document.getElementById("ex-bilanz").innerHTML = optimal
    ? `<span class="ws">Das ist das Optimum.</span> Bei x = ${num(best)} m ist auch y = ${num(y)} m — das Rechteck ist ein <strong>Quadrat</strong>. ` +
      `Das gilt bei jeder Zaunlänge: Unter allen Rechtecken mit gleichem Umfang hat das Quadrat die größte Fläche.`
    : `Mit x = ${num(x)} m bleiben ${num(A)} m² — das sind <span class="wn">${num(maxA - A)} m²</span> weniger als möglich. ` +
      `Schiebe den Regler auf x = <span class="ws">${num(best)}</span> m: Dann ist y = ${num(best)} m, das Rechteck wird zum Quadrat, ` +
      `und die Fläche erreicht ihren größten Wert ${num(maxA)} m².`;
}

function initExtremwert() {
  ["ex-u", "ex-x"].forEach((id) => document.getElementById(id).addEventListener("input", renderExtremwert));
  renderExtremwert();
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

// Aufgabe 1 — den Scheitel aus der Scheitelform ablesen.
const A1_KANDIDATEN = (() => {
  const liste = [];
  for (const a of [-3, -2, -1, 1, 2, 3]) {
    for (let d = -6; d <= 6; d++) {
      if (d === 0) continue;
      for (let e = -8; e <= 8; e++) {
        if (e === 0) continue;
        liste.push({ a, d, e });
      }
    }
  }
  return liste;
})();

function generateAufgabe1() {
  const k = ohneKollision(A1_KANDIDATEN, (v) => [v.d, -v.d, v.e, v.a], A1_KANDIDATEN[0]);
  const { a, d, e } = k;
  return {
    promptHtml: `Gegeben ist <strong>f(x) = ${scheitelRein(a, d, e)}</strong>.<br>` +
      `Wie groß ist die <strong>x-Koordinate des Scheitels</strong>?`,
    correct: d,
    tolerance: 0.001,
    placeholder: "x-Koordinate",
    hinweis: (raw, val) => {
      if (Math.abs(val + d) < 0.001) return `Vorsicht beim Vorzeichen: In der Klammer steht (x ${d > 0 ? "−" : "+"} ${num(Math.abs(d))}). Sie wird null für x = ${num(d)}, nicht für x = ${num(-d)}.`;
      if (Math.abs(val - e) < 0.001) return "Das ist die y-Koordinate des Scheitels — die Zahl <em>hinter</em> der Klammer. Gefragt war die x-Koordinate.";
      if (Math.abs(val - a) < 0.001) return "Das ist der Formfaktor a vor der Klammer. Er sagt etwas über die Öffnung, nichts über die Lage.";
      return `Der Scheitel liegt dort, wo die Klammer null wird: x ${d > 0 ? "−" : "+"} ${num(Math.abs(d))} = 0.`;
    },
    tipps: [
      "Vergleiche den Term mit der allgemeinen Scheitelform f(x) = a · (x − d)² + e. Der Scheitel ist dann S(d | e).",
      "Ein Quadrat ist nie negativ und wird nur an einer einzigen Stelle null — nämlich dort, wo die Klammer null ist. Genau dort liegt der Scheitel.",
      `Setze also die Klammer null: x ${d > 0 ? "−" : "+"} ${num(Math.abs(d))} = 0. Achte auf das Vorzeichen — in der Form steht ein Minus.`,
    ],
    musterloesungHtml:
      `<strong>Scheitelform:</strong> f(x) = a · (x − d)² + e mit dem Scheitel S(d | e)<br>` +
      `<strong>Vergleichen:</strong> a = ${num(a)}, d = <strong>${num(d)}</strong>, e = ${num(e)}<br>` +
      `Die Klammer (x ${d > 0 ? "−" : "+"} ${num(Math.abs(d))}) wird null für <strong>x = ${num(d)}</strong>; dort liegt der Scheitel, und zwar in der Höhe ${num(e)}.<br>` +
      `<em>Also:</em> S(${num(d)} | ${num(e)}) — die Parabel ist ${a > 0 ? "nach oben" : "nach unten"} geöffnet, ${num(e)} ist damit ihr ${a > 0 ? "kleinster" : "größter"} Wert.`,
  };
}

// Aufgabe 2 — die Punktprobe. Abschnitt 1 hatte keine Aufgabe, dabei ist
// „einsetzen und vergleichen“ die Grundlage von allem, was danach kommt:
// Ein Punkt liegt genau dann auf dem Graphen, wenn seine Koordinaten die
// Gleichung erfüllen.
const A2_KANDIDATEN = (() => {
  const liste = [];
  for (const a of [-3, -2, -1, 1, 2, 3]) {
    for (let d = -4; d <= 4; d++) {
      if (d === 0) continue;
      for (let e = -6; e <= 6; e++) {
        if (e === 0) continue;
        for (let x0 = -4; x0 <= 6; x0++) {
          if (x0 === d) continue;               // sonst ist die Klammer null
          const dx = x0 - d;
          if (Math.abs(dx) > 4) continue;
          const fw = a * dx * dx + e;
          if (Math.abs(fw) > 60) continue;
          liste.push({ a, d, e, x0, dx, fw });
        }
      }
    }
  }
  return liste;
})();
// Wie weit der angebotene Punkt danebenliegt. 0 heißt: Er liegt wirklich auf
// dem Graphen — und das soll etwa jeder dritte Fall sein.
const A2_ABWEICHUNGEN = [0, 0, 0, 1, -1, 2, -2, 3, -3];

function generateAufgabe2() {
  const ab = pick(A2_ABWEICHUNGEN);
  const k = ohneFeldKollision(A2_KANDIDATEN, (v) => [
    // Feld 1: der Funktionswert und die Zahlen, auf denen ein Hinweis liegt.
    [v.fw, v.a * v.dx * v.dx, v.a * v.dx * (v.a * v.dx), v.a * v.x0 * v.x0 + v.e,
      v.a * (v.x0 + v.d) * (v.x0 + v.d) + v.e, ab === 0 ? NaN : v.fw + ab],
  ]);
  const { a, d, e, x0, dx, fw } = k;
  const yp = fw + ab;
  const liegtDrauf = ab === 0;
  const term = scheitelRein(a, d, e);
  // num(a) behält das Vorzeichen; num(Math.abs(a)) würde aus −2 · (…)² ein 2 · (…)² machen.
  const vornA = a === 1 ? "" : a === -1 ? "−" : `${num(a)} · `;
  const einsetzung = `${vornA}(${klammer(x0)} ${d > 0 ? "−" : "+"} ${num(Math.abs(d))})² ${e > 0 ? "+" : "−"} ${num(Math.abs(e))}`;
  return {
    promptHtml: `Gegeben ist <strong>f(x) = ${term}</strong>.<br>` +
      `Liegt der Punkt <strong>P(${num(x0)} | ${num(yp)})</strong> auf dem Graphen?`,
    felder: [
      {
        name: `f(${num(x0)}) =`, soll: fw, toleranz: 0.0005, platzhalter: "Funktionswert",
        hinweis: (roh, val) => {
          if (Math.abs(val - a * dx * dx) < 0.0005) return `Die Zahl hinter der Klammer fehlt: Nach dem Quadrieren kommt noch ${e > 0 ? "+ " + num(e) : "− " + num(-e)} dazu.`;
          if (Math.abs(val - (a * dx) * (a * dx)) < 0.0005) return `Erst quadrieren, dann mit ${num(a)} multiplizieren — das Quadrat gehört nur zur Klammer, nicht zum Faktor davor.`;
          if (Math.abs(val - (a * x0 * x0 + e)) < 0.0005) return `Die ${num(Math.abs(d))} in der Klammer wurde übersehen. Rechne zuerst ${num(x0)} ${d > 0 ? "−" : "+"} ${num(Math.abs(d))} = ${num(dx)}.`;
          if (Math.abs(val - (a * (x0 + d) * (x0 + d) + e)) < 0.0005) return `Vorzeichen in der Klammer: Dort steht (x ${d > 0 ? "−" : "+"} ${num(Math.abs(d))}), also ${num(x0)} ${d > 0 ? "−" : "+"} ${num(Math.abs(d))} = ${num(dx)}.`;
          if (Math.abs(val - yp) < 0.0005) return `${num(yp)} ist die y-Koordinate des angebotenen Punktes. Die musst du erst ausrechnen, um sie vergleichen zu können.`;
          return `Setze x = ${num(x0)} in den Term ein: ${einsetzung}.`;
        },
      },
      {
        name: "Liegt P auf dem Graphen? (1 = ja, 2 = nein)", soll: liegtDrauf ? 1 : 2, toleranz: 0.25, platzhalter: "1 oder 2",
        hinweis: () => liegtDrauf
          ? `f(${num(x0)}) = ${num(fw)}, und genau das ist die y-Koordinate von P. Beide Zahlen stimmen überein — der Punkt liegt auf dem Graphen.`
          : `f(${num(x0)}) = ${num(fw)}, P hat aber die Höhe ${num(yp)}. ${num(fw)} ≠ ${num(yp)}, also liegt P ${ab > 0 ? "unter" : "über"} dem Punkt des Graphen, nicht auf ihm.`,
      },
    ],
    tipps: [
      "Ein Punkt liegt genau dann auf dem Graphen, wenn seine Koordinaten die Funktionsgleichung erfüllen.",
      `Setze also die x-Koordinate ein: f(${num(x0)}) = ${einsetzung}.`,
      `Vergleiche das Ergebnis mit der y-Koordinate ${num(yp)} von P. Stimmen beide überein, liegt P auf dem Graphen.`,
    ],
    musterloesungHtml:
      `<strong>1. Einsetzen:</strong> f(${num(x0)}) = ${einsetzung}<br>` +
      `<strong>2. Klammer zuerst:</strong> ${num(x0)} ${d > 0 ? "−" : "+"} ${num(Math.abs(d))} = ${num(dx)}, also ${vornA}${klammer(dx)}² ${e > 0 ? "+" : "−"} ${num(Math.abs(e))} = ${vornA}${num(dx * dx)} ${e > 0 ? "+" : "−"} ${num(Math.abs(e))} = <strong>${num(fw)}</strong><br>` +
      `<strong>3. Vergleichen:</strong> ${num(fw)} ${liegtDrauf ? "=" : "≠"} ${num(yp)} ${liegtDrauf ? "✓" : "✗"}<br>` +
      `<strong>Antwort:</strong> P(${num(x0)} | ${num(yp)}) liegt <strong>${liegtDrauf ? "auf" : "nicht auf"}</strong> dem Graphen.<br>` +
      `<span class="progress-note">Das Quadrat gehört zur Klammer, nicht zum Faktor davor: ` +
      `${num(a)} · ${klammer(dx)}² heißt „erst quadrieren, dann mit ${num(a)} malnehmen“. ` +
      `Wer zuerst multipliziert, bekommt ${num((a * dx) * (a * dx))} statt ${num(a * dx * dx)}.</span>`,
  };
}

// Aufgabe 3 — quadratische Ergänzung: die y-Koordinate des Scheitels.
function generateAufgabe3() {
  const k = ohneKollision(QE_KANDIDATEN, (v) => [v.e, v.d, v.q, v.k * v.k, v.p], QE_KANDIDATEN[0]);
  const { p, q, k: halb, d, e } = k;
  return {
    promptHtml: `Gegeben ist <strong>f(x) = ${normalRein(p, q)}</strong>.<br>` +
      `Bringe die Gleichung mit der quadratischen Ergänzung auf die Scheitelform.<br>` +
      `Wie groß ist die <strong>y-Koordinate des Scheitels</strong>?`,
    correct: e,
    tolerance: 0.001,
    placeholder: "y-Koordinate",
    hinweis: (raw, val) => {
      if (Math.abs(val - d) < 0.001) return `Das ist die x-Koordinate des Scheitels (${num(d)}). Setze sie in f ein, um die Höhe zu bekommen.`;
      if (Math.abs(val - q) < 0.001) return "Das ist die Zahl q aus der Ausgangsgleichung. Davon muss noch das Quadrat der halben Zahl abgezogen werden.";
      if (Math.abs(val - halb * halb) < 0.001) return `Das ist (p : 2)² = ${num(halb * halb)} — die Ergänzung selbst. Gesucht ist q − (p : 2)².`;
      if (Math.abs(val - (q + halb * halb)) < 0.001) return `Beinahe: Das Quadrat der halben Zahl wird <em>abgezogen</em>, nicht addiert. Richtig ist ${num(q)} − ${num(halb * halb)}.`;
      return `Halbiere die Zahl vor dem x: ${num(p)} : 2 = ${num(halb)}. Quadriere sie: ${num(halb * halb)}. Die y-Koordinate ist dann q − (p : 2)².`;
    },
    tipps: [
      `Die quadratische Ergänzung macht aus x² ${p > 0 ? "+" : "−"} ${num(Math.abs(p))}x den Anfang einer binomischen Formel. Dazu brauchst du das Quadrat der halben Zahl vor dem x.`,
      `${num(p)} : 2 = ${num(halb)}, und ${num(halb)}² = ${num(halb * halb)}. Diese Zahl wird addiert <em>und</em> gleich wieder abgezogen — der Term ändert sich dadurch nicht.`,
      `Aus den ersten drei Summanden wird (x ${halb > 0 ? "+" : "−"} ${num(Math.abs(halb))})². Übrig bleibt ${num(q)} − ${num(halb * halb)} — und das ist die gesuchte Höhe.`,
    ],
    musterloesungHtml:
      `<strong>1. Halbieren:</strong> p : 2 = ${num(p)} : 2 = ${num(halb)}, also (p : 2)² = ${num(halb * halb)}<br>` +
      `<strong>2. Ergänzen:</strong> ${normalRein(p, q)} = x² ${p > 0 ? "+" : "−"} ${num(Math.abs(p))}x + ${num(halb * halb)} − ${num(halb * halb)}${q === 0 ? "" : (q > 0 ? " + " : " − ") + num(Math.abs(q))}<br>` +
      `<strong>3. Binomische Formel:</strong> = (x ${halb > 0 ? "+" : "−"} ${num(Math.abs(halb))})² − ${num(halb * halb)}${q === 0 ? "" : (q > 0 ? " + " : " − ") + num(Math.abs(q))}<br>` +
      `<strong>4. Zusammenfassen:</strong> = ${scheitelRein(1, d, e)}, also S(${num(d)} | <strong>${num(e)}</strong>)<br>` +
      `<em>Probe:</em> f(${klammer(d)}) = ${klammer(d)}² ${p > 0 ? "+" : "−"} ${faktor(`${num(Math.abs(p))} · ${klammer(d)}`)}${q === 0 ? "" : (q > 0 ? " + " : " − ") + num(Math.abs(q))} = ${num(d * d + p * d + q)} ✓`,
  };
}

// Aufgabe 4 — die Diskriminante. Abschnitt 5 hatte keine Aufgabe; dabei ist
// die Frage „wie viele Lösungen?“ oft schon beantwortet, bevor man rechnet.
const A4_KANDIDATEN = (() => {
  const liste = [];
  // p darf ungerade sein; dann ist p : 2 eine halbe Zahl — und genau beim
  // Halbieren und Quadrieren verrechnen sich die meisten.
  // Gezählt wird über D, nicht über q: Nur so kommt der seltene Fall D = 0
  // (q = (p:2)²) überhaupt vor.
  for (let t = -12; t <= 12; t++) {
    if (t === 0) continue;                    // sonst wäre (p:2)² = 0
    const halb = t / 2, quadrat = halb * halb;
    for (let D = -20; D <= 30; D++) {
      const q = quadrat - D;
      if (q === 0 || Math.abs(q) > 70) continue;
      liste.push({ p: 2 * halb, q, halb, quadrat, D, anzahl: D > 0 ? 2 : D === 0 ? 1 : 0 });
    }
  }
  return liste;
})();
// Alle drei Fälle gleich häufig — sonst rät man nach kurzer Zeit richtig.
const A4_NACH_FALL = [0, 1, 2].map((n) => A4_KANDIDATEN.filter((v) => v.anzahl === n));

function generateAufgabe4() {
  const fall = pick([0, 1, 2]);
  const k = ohneFeldKollision(A4_NACH_FALL[fall], (v) => [
    // Feld 1: (p : 2)². Bei D = 0 ist q = (p:2)² selbst die richtige Antwort;
    // dort liegt kein Hinweis, und der Wert darf nicht als Kollision zählen.
    [v.quadrat, v.halb, v.p * v.p, v.D === 0 ? NaN : v.q, v.p],
    // Feld 2: die Diskriminante. Bei D = 0 ist q − (p:2)² ebenfalls 0 und damit
    // die richtige Antwort — dort liegt dann kein Hinweis, und der Wert darf
    // nicht als Kollision zählen, sonst bliebe der Fall D = 0 ganz aus.
    [v.D, v.quadrat + v.q, v.D === 0 ? NaN : v.q - v.quadrat, v.quadrat],
  ]);
  const { p, q, halb, quadrat, D, anzahl } = k;
  const wurzel = D >= 0 ? Math.sqrt(D) : NaN;
  const genau = D > 0 && istQuadrat(D);
  return {
    promptHtml: `Gegeben ist die Gleichung <strong>${normalRein(p, q)} = 0</strong>.<br>` +
      `Entscheide mit der Diskriminante, wie viele Lösungen sie hat.`,
    felder: [
      {
        name: "(p : 2)²", soll: quadrat, toleranz: 0.0005, platzhalter: "Zahl",
        hinweis: (roh, val) => {
          if (Math.abs(val - halb) < 0.0005) return `${num(halb)} ist p : 2. Das muss noch quadriert werden: ${num(halb)}² = ${num(quadrat)}.`;
          if (Math.abs(val - p * p) < 0.0005) return `Quadriert wird die <em>halbe</em> Zahl: erst ${num(p)} : 2 = ${num(halb)}, dann quadrieren.`;
          if (Math.abs(val - q) < 0.0005) return `${num(q)} ist q, nicht (p : 2)². Das p steht vor dem x.`;
          if (Math.abs(val - p) < 0.0005) return `${num(p)} ist p selbst. Erst halbieren, dann quadrieren.`;
          return `p ist die Zahl vor dem x, hier ${num(p)}. Halbiere sie und quadriere das Ergebnis.`;
        },
      },
      {
        name: "D = (p : 2)² − q", soll: D, toleranz: 0.0005, platzhalter: "Diskriminante",
        hinweis: (roh, val) => {
          if (Math.abs(val - (quadrat + q)) < 0.0005) return `q wird <strong>abgezogen</strong>, nicht addiert: ${num(quadrat)} − ${klammer(q)} = ${num(D)}.`;
          if (Math.abs(val - (q - quadrat)) < 0.0005) return `Die Reihenfolge stimmt nicht: D = (p : 2)² − q, also ${num(quadrat)} − ${klammer(q)}.`;
          if (Math.abs(val - quadrat) < 0.0005) return `${num(quadrat)} ist erst (p : 2)². Davon wird q = ${num(q)} noch abgezogen.`;
          return `D = ${num(quadrat)} − ${klammer(q)}. Achte auf das Vorzeichen von q.`;
        },
      },
      {
        name: "Anzahl der Lösungen (0, 1 oder 2)", soll: anzahl, toleranz: 0.25, platzhalter: "0, 1 oder 2",
        hinweis: (roh, val) => {
          const g = Math.round(val);
          if (g === anzahl) return "";
          if (D > 0) return `D = ${num(D)} ist <strong>positiv</strong>. Aus einer positiven Zahl lässt sich die Wurzel ziehen, und das ± davor liefert zwei verschiedene Lösungen.`;
          if (D === 0) {
            return g === 0
              ? "D = 0 heißt nicht „keine Lösung“. √0 = 0, und x = −p : 2 ist eine Lösung — der Scheitel liegt genau auf der x-Achse."
              : "Bei D = 0 ist √D = 0; das ± ändert dann nichts mehr. Beide Lösungen fallen zu <strong>einer</strong> zusammen.";
          }
          return `D = ${num(D)} ist <strong>negativ</strong>. Aus einer negativen Zahl lässt sich keine Wurzel ziehen — die Parabel schneidet die x-Achse überhaupt nicht.`;
        },
      },
    ],
    tipps: [
      `In ${normalRein(p, q)} ist p = ${num(p)} die Zahl vor dem x und q = ${num(q)} die Zahl ohne x.`,
      `Die Diskriminante ist D = (p : 2)² − q. Rechne ${num(halb)}² − ${klammer(q)}.`,
      "Das Vorzeichen von D entscheidet: D &gt; 0 zwei Lösungen, D = 0 eine, D &lt; 0 keine. Gerechnet werden muss die pq-Formel dafür gar nicht.",
    ],
    musterloesungHtml:
      `<strong>1. Ablesen:</strong> p = ${num(p)}, q = ${num(q)}<br>` +
      `<strong>2. Halbieren und quadrieren:</strong> p : 2 = ${num(halb)}, (p : 2)² = <strong>${num(quadrat)}</strong><br>` +
      `<strong>3. Diskriminante:</strong> D = ${num(quadrat)} − ${klammer(q)} = <strong>${num(D)}</strong><br>` +
      `<strong>4. Entscheiden:</strong> D ${D > 0 ? "&gt; 0" : D === 0 ? "= 0" : "&lt; 0"} ⇒ <strong>${anzahl === 2 ? "zwei Lösungen" : anzahl === 1 ? "genau eine Lösung" : "keine Lösung"}</strong><br>` +
      (anzahl === 2
        ? `<em>Zur Kontrolle:</em> x<sub>1,2</sub> = ${num(-halb)} ± √${num(D)}${genau ? `, also x₁ = ${num(-halb - wurzel)} und x₂ = ${num(-halb + wurzel)}` : ` ≈ ${num(-halb)} ± ${num(wurzel, 3)}`}.<br>`
        : anzahl === 1
          ? `<em>Zur Kontrolle:</em> x = ${num(-halb)} — der Scheitel S(${num(-halb)} | 0) liegt auf der x-Achse.<br>`
          : `<em>Zur Kontrolle:</em> Der Scheitel liegt bei S(${num(-halb)} | ${num(-D)}), also ${D < 0 ? "oberhalb" : "unterhalb"} der x-Achse — die nach oben geöffnete Parabel erreicht sie nie.<br>`) +
      `<span class="progress-note">Die Diskriminante ist das, was unter der Wurzel der pq-Formel steht. ` +
      `Ihr Vorzeichen beantwortet die Frage nach der Anzahl, ohne dass man die Lösungen ausrechnen muss — ` +
      `geometrisch sagt sie, ob der Scheitel unter, auf oder über der x-Achse liegt.</span>`,
  };
}

// Aufgabe 5 — pq-Formel, gesucht ist die größere Lösung.
const A5_KANDIDATEN = PQ_KANDIDATEN.filter((v) => v.x1 !== v.x2);

function generateAufgabe5() {
  const k = ohneKollision(A5_KANDIDATEN,
    (v) => [Math.max(v.x1, v.x2), Math.min(v.x1, v.x2), -v.p / 2, (v.p / 2) * (v.p / 2) - v.q, v.q],
    A5_KANDIDATEN[0]);
  const { x1, x2, p, q } = k;
  const gross = Math.max(x1, x2), klein = Math.min(x1, x2);
  const halb = p / 2, D = halb * halb - q, w = Math.sqrt(D);
  return {
    promptHtml: `Löse mit der pq-Formel: <strong>${normalRein(p, q)} = 0</strong><br>` +
      `Wie groß ist die <strong>größere</strong> der beiden Lösungen?`,
    correct: gross,
    tolerance: 0.001,
    placeholder: "größere Lösung",
    hinweis: (raw, val) => {
      if (Math.abs(val - klein) < 0.001) return `Das ist die <em>kleinere</em> Lösung. Die größere entsteht mit dem <strong>Plus</strong> vor der Wurzel: ${num(-halb)} + ${num(w)}.`;
      if (Math.abs(val + halb) < 0.001) return `Das ist nur −p : 2 = ${num(-halb)}, also die Mitte zwischen den beiden Lösungen. Die Wurzel fehlt noch.`;
      if (Math.abs(val - D) < 0.001) return `Das ist die Diskriminante D = ${num(D)}. Aus ihr muss noch die Wurzel gezogen und zu ${num(-halb)} addiert werden.`;
      if (Math.abs(val - q) < 0.001) return "Das ist q aus der Gleichung, nicht die Lösung.";
      if (Math.abs(val - (halb + w)) < 0.001) return `Vorzeichenfehler: In der Formel steht <strong>−</strong>p : 2, also ${num(-halb)} und nicht ${num(halb)}.`;
      return `pq-Formel: x = −p : 2 ± √((p : 2)² − q) = ${num(-halb)} ± √${num(D)}.`;
    },
    tipps: [
      `Lies zuerst p und q ab: p = ${num(p)} steht vor dem x, q = ${num(q)} steht allein.`,
      `Die pq-Formel lautet x = −p : 2 ± √((p : 2)² − q). Hier: −p : 2 = ${num(-halb)} und (p : 2)² − q = ${num(halb * halb)} − ${klammer(q)} = ${num(D)}.`,
      `√${num(D)} = ${num(w)}. Die größere Lösung entsteht mit dem <strong>Plus</strong>: ${num(-halb)} + ${num(w)}.`,
    ],
    musterloesungHtml:
      `<strong>1. Ablesen:</strong> p = ${num(p)}, q = ${num(q)}, also p : 2 = ${num(halb)}<br>` +
      `<strong>2. Diskriminante:</strong> D = ${klammer(halb)}² − ${klammer(q)} = ${num(halb * halb)} − ${klammer(q)} = <strong>${num(D)}</strong>, √D = ${num(w)}<br>` +
      `<strong>3. Einsetzen:</strong> x<sub>1,2</sub> = ${num(-halb)} ± ${num(w)}<br>` +
      `<strong>4. Beide Vorzeichen:</strong> x₁ = ${num(klein)} und x₂ = <strong>${num(gross)}</strong><br>` +
      `<em>Probe mit der größeren:</em> ${klammer(gross)}² ${p > 0 ? "+" : "−"} ${faktor(`${num(Math.abs(p))} · ${klammer(gross)}`)}${q === 0 ? "" : (q > 0 ? " + " : " − ") + num(Math.abs(q))} = ${num(gross * gross + p * gross + q)} ✓<br>` +
      `<em>Schnellkontrolle:</em> Die Summe beider Lösungen ist ${num(x1 + x2)} = −p, ihr Produkt ${num(x1 * x2)} = q.`,
  };
}

// Aufgabe 6 — eine Parabel aus Scheitel und einem weiteren Punkt bestimmen.
// Das ist die Umkehrung von Aufgabe 1: Dort wurde aus der Gleichung der
// Scheitel abgelesen, hier wird aus dem Scheitel die Gleichung gebaut.
const A6_KANDIDATEN = (() => {
  const liste = [];
  for (const a of [-3, -2, -1, 1, 2, 3]) {
    for (let d = -4; d <= 4; d++) {
      for (let e = -8; e <= 8; e++) {
        for (let x0 = -5; x0 <= 6; x0++) {
          const dx = x0 - d;
          if (dx === 0 || Math.abs(dx) > 3) continue;
          if (x0 === 0) continue;             // sonst wäre f(0) schon gegeben
          const y0 = a * dx * dx + e;
          const f0 = a * d * d + e;
          const zweite = 2 * d - x0;          // die andere Stelle mit demselben Wert
          if (Math.abs(y0) > 40 || Math.abs(f0) > 40) continue;
          liste.push({ a, d, e, x0, dx, y0, f0, zweite });
        }
      }
    }
  }
  return liste;
})();

function generateAufgabe6() {
  const k = ohneFeldKollision(A6_KANDIDATEN, (v) => [
    // Feld 1: der Formfaktor a.
    [v.a, (v.y0 - v.e) / v.dx, v.y0 - v.e, -v.a],
    // Feld 2: der y-Achsenabschnitt f(0).
    [v.f0, v.e, v.a * v.d * v.d, v.y0],
    // Feld 3: die zweite Stelle mit demselben Funktionswert.
    [v.zweite, v.x0, v.d, -v.x0],
  ]);
  const { a, d, e, x0, dx, y0, f0, zweite } = k;
  return {
    promptHtml: `Eine Parabel hat den Scheitel <strong>S(${num(d)} | ${num(e)})</strong> ` +
      `und verläuft durch den Punkt <strong>P(${num(x0)} | ${num(y0)})</strong>.`,
    felder: [
      {
        name: "Formfaktor a", soll: a, toleranz: 0.0005, platzhalter: "a",
        hinweis: (roh, val) => {
          if (Math.abs(val - (y0 - e) / dx) < 0.0005) return `Geteilt wird durch das <em>Quadrat</em> der Klammer: (${num(x0)} ${d > 0 ? "−" : "+"} ${num(Math.abs(d))})² = ${num(dx * dx)}, nicht durch ${num(dx)}.`;
          if (Math.abs(val - (y0 - e)) < 0.0005) return `${num(y0 - e)} ist der Höhenunterschied ${num(y0)} − ${klammer(e)}. Er muss noch durch ${num(dx * dx)} geteilt werden.`;
          if (Math.abs(val + a) < 0.0005) return `Das Vorzeichen stimmt nicht. P liegt ${y0 > e ? "über" : "unter"} dem Scheitel, also ist die Parabel nach ${y0 > e ? "oben" : "unten"} geöffnet und a ist ${y0 > e ? "positiv" : "negativ"}.`;
          return `Setze P in f(x) = a · (x ${d > 0 ? "−" : "+"} ${num(Math.abs(d))})² ${e > 0 ? "+" : "−"} ${num(Math.abs(e))} ein und löse nach a auf.`;
        },
      },
      {
        name: "y-Achsenabschnitt f(0)", soll: f0, toleranz: 0.0005, platzhalter: "f(0)",
        hinweis: (roh, val) => {
          if (Math.abs(val - e) < 0.0005) return `${num(e)} ist die Höhe des Scheitels, also f(${num(d)}). Gefragt ist der Wert an der Stelle x = 0.`;
          if (Math.abs(val - a * d * d) < 0.0005) return `Die Zahl hinter der Klammer fehlt: Nach ${num(a)} · ${klammer(-d)}² = ${num(a * d * d)} kommt noch ${e > 0 ? "+ " + num(e) : "− " + num(-e)}.`;
          if (Math.abs(val - y0) < 0.0005) return `${num(y0)} ist die Höhe von P, nicht der y-Achsenabschnitt.`;
          return `Setze x = 0 ein: f(0) = ${num(a)} · (0 ${d > 0 ? "−" : "+"} ${num(Math.abs(d))})² ${e > 0 ? "+" : "−"} ${num(Math.abs(e))}.`;
        },
      },
      {
        name: `zweite Stelle mit dem Wert ${num(y0)}`, soll: zweite, toleranz: 0.0005, platzhalter: "x",
        hinweis: (roh, val) => {
          if (Math.abs(val - x0) < 0.0005) return `${num(x0)} ist die schon bekannte Stelle. Gesucht ist die <em>andere</em> mit demselben Wert.`;
          if (Math.abs(val - d) < 0.0005) return `${num(d)} ist die Stelle des Scheitels. Dort hat f den Wert ${num(e)}, nicht ${num(y0)}.`;
          if (Math.abs(val + x0) < 0.0005) return `Gespiegelt wird nicht an der y-Achse, sondern an der Achse des Scheitels: x = ${num(d)}.`;
          return `Die Parabel ist zur Geraden x = ${num(d)} symmetrisch. ${num(x0)} liegt ${num(Math.abs(dx))} ${Math.abs(dx) === 1 ? "Einheit" : "Einheiten"} ${dx > 0 ? "rechts" : "links"} davon — die zweite Stelle ebenso weit auf der anderen Seite.`;
        },
      },
    ],
    tipps: [
      `Aus dem Scheitel folgt die Form: f(x) = a · (x ${d > 0 ? "−" : "+"} ${num(Math.abs(d))})² ${e > 0 ? "+" : "−"} ${num(Math.abs(e))}. Nur a ist noch unbekannt.`,
      `Setze P(${num(x0)} | ${num(y0)}) ein: ${num(y0)} = a · ${num(dx * dx)} ${e > 0 ? "+" : "−"} ${num(Math.abs(e))}. Daraus lässt sich a berechnen.`,
      `Für die dritte Frage brauchst du gar nicht zu rechnen: Die Parabel ist symmetrisch zur senkrechten Geraden durch den Scheitel, also zu x = ${num(d)}.`,
    ],
    musterloesungHtml:
      `<strong>1. Ansatz mit dem Scheitel:</strong> f(x) = a · (x ${d > 0 ? "−" : "+"} ${num(Math.abs(d))})² ${e > 0 ? "+" : "−"} ${num(Math.abs(e))}<br>` +
      `<strong>2. P einsetzen:</strong> ${num(y0)} = a · ${klammer(dx)}² ${e > 0 ? "+" : "−"} ${num(Math.abs(e))} = a · ${num(dx * dx)} ${e > 0 ? "+" : "−"} ${num(Math.abs(e))}<br>` +
      `<strong>3. Nach a auflösen:</strong> a · ${num(dx * dx)} = ${num(y0 - e)}, also <strong>a = ${num(a)}</strong><br>` +
      `&nbsp;&nbsp;&nbsp;damit f(x) = ${scheitelRein(a, d, e)}<br>` +
      `<strong>4. y-Achsenabschnitt:</strong> f(0) = ${num(a)} · ${klammer(-d)}² ${e > 0 ? "+" : "−"} ${num(Math.abs(e))} = <strong>${num(f0)}</strong><br>` +
      `<strong>5. Symmetrie:</strong> P liegt ${num(Math.abs(dx))} ${Math.abs(dx) === 1 ? "Einheit" : "Einheiten"} ${dx > 0 ? "rechts" : "links"} der Achse x = ${num(d)}; ebenso weit auf der anderen Seite liegt <strong>x = ${num(zweite)}</strong><br>` +
      `<em>Probe:</em> f(${klammer(zweite)}) = ${num(a)} · ${klammer(zweite - d)}² ${e > 0 ? "+" : "−"} ${num(Math.abs(e))} = ${num(y0)} ✓<br>` +
      `<span class="progress-note">Zwei Angaben genügen, wenn eine davon der Scheitel ist: Er liefert d und e, ` +
      `der zweite Punkt liefert a. Ohne den Scheitel bräuchte man drei Punkte.</span>`,
  };
}

// Aufgabe 7 — Extremwertaufgabe: die größtmögliche Fläche.
const A7_KANDIDATEN = (() => {
  const liste = [];
  for (let n = 3; n <= 20; n++) {
    const U = 4 * n;          // damit U : 4 ganzzahlig bleibt
    liste.push({ U, best: n, maxA: n * n, halbU: 2 * n });
  }
  return liste;
})();

function generateAufgabe7() {
  const k = ohneKollision(A7_KANDIDATEN, (v) => [v.maxA, v.best, v.halbU, v.U], A7_KANDIDATEN[0]);
  const { U, best, maxA, halbU } = k;
  return {
    promptHtml: `Ein <strong>${num(U)} m</strong> langer Zaun soll ein rechteckiges Beet vollständig umschließen.<br>` +
      `Wie groß ist die <strong>größtmögliche Fläche</strong> in m²?`,
    correct: maxA,
    tolerance: 0.001,
    placeholder: "Fläche in m²",
    hinweis: (raw, val) => {
      if (Math.abs(val - best) < 0.001) return `Das ist die günstigste Seitenlänge (${num(best)} m), nicht die Fläche. Multipliziere noch beide Seiten.`;
      if (Math.abs(val - halbU) < 0.001) return `Das ist die halbe Zaunlänge, also x + y. Die Fläche ist x · y.`;
      if (Math.abs(val - U) < 0.001) return "Das ist der Umfang selbst. Gesucht ist die Fläche.";
      if (Math.abs(val - U * U) < 0.001) return "Der Umfang wird nicht quadriert. Stelle zuerst die Fläche als Funktion einer Seite dar.";
      return `Ansatz: 2x + 2y = ${num(U)}, also y = ${num(halbU)} − x und A(x) = x · (${num(halbU)} − x). Suche den Scheitel dieser Parabel.`;
    },
    tipps: [
      `Nenne die eine Seite x. Aus dem Umfang 2x + 2y = ${num(U)} folgt y = ${num(halbU)} − x — beide Seiten hängen also zusammen.`,
      `Damit wird die Fläche zu einer Funktion einer einzigen Größe: A(x) = x · (${num(halbU)} − x) = −x² + ${num(halbU)}x.`,
      "Die Parabel ist nach unten geöffnet; ihr Scheitel ist der größte Wert. Er liegt in der Mitte zwischen den Nullstellen 0 und " + num(halbU) + ".",
    ],
    musterloesungHtml:
      `<strong>1. Ansatz:</strong> 2x + 2y = ${num(U)}, also y = ${num(halbU)} − x<br>` +
      `<strong>2. Flächenterm:</strong> A(x) = x · (${num(halbU)} − x) = −x² + ${num(halbU)}x<br>` +
      `<strong>3. Quadratische Ergänzung:</strong> A(x) = −(x² − ${num(halbU)}x) = −(x − ${num(best)})² + ${num(maxA)}<br>` +
      `<strong>4. Scheitel ablesen:</strong> S(${num(best)} | ${num(maxA)}); weil a = −1 negativ ist, ist das ein <strong>Maximum</strong>.<br>` +
      `<em>Antwort:</em> Bei x = ${num(best)} m und y = ${num(best)} m — also einem <strong>Quadrat</strong> — wird die Fläche mit <strong>${num(maxA)} m²</strong> am größten.<br>` +
      `<em>Probe:</em> Umfang 4 · ${num(best)} m = ${num(U)} m ✓. Zum Vergleich: ${num(best - 1)} m × ${num(best + 1)} m ergäbe nur ${num((best - 1) * (best + 1))} m².`,
  };
}

// Aufgabe 8 — eine Wurfparabel. Hier treffen Scheitel und Nullstellen in einem
// Sachzusammenhang zusammen: Der Scheitel ist der höchste Punkt, die zweite
// Nullstelle die Weite.
const A8_KANDIDATEN = (() => {
  const liste = [];
  for (let w = 8; w <= 60; w += 2) {
    for (let e = 2; e <= 20; e++) {
      const c = (4 * e) / (w * w);            // h(x) = −c·x² + b·x
      const b = (4 * e) / w;
      // Beide Koeffizienten sollen ablesbar bleiben: höchstens drei bzw. zwei Nachkommastellen.
      if (!Number.isInteger(c * 1000) || !Number.isInteger(b * 100)) continue;
      if (c < 0.005 || b > 6 || b < 0.4) continue;
      if (2 * e > w) continue;                // eine Wurfbahn ist mindestens doppelt so weit wie hoch
      liste.push({ w, e, c, b, halb: w / 2 });
    }
  }
  return liste;
})();
const A8_KONTEXTE = [
  { einleitung: "Ein Fußball wird vom Boden aus abgeschlagen", maxW: 60,
    frage: "bis der Ball wieder auf dem Boden auftrifft", antwort: "trifft der Ball wieder auf dem Boden auf" },
  { einleitung: "Ein Golfball wird vom Abschlag aus geschlagen", maxW: 60,
    frage: "bis der Ball wieder auf dem Boden auftrifft", antwort: "trifft der Ball wieder auf dem Boden auf" },
  { einleitung: "Ein Wasserstrahl verlässt eine Düse am Beckenrand", maxW: 20,
    frage: "bis der Strahl wieder auf die Wasseroberfläche trifft", antwort: "trifft der Strahl wieder auf die Wasseroberfläche" },
  { einleitung: "Ein Stein wird flach über eine Wiese geworfen", maxW: 30,
    frage: "bis der Stein wieder aufkommt", antwort: "kommt der Stein wieder auf" },
];

function generateAufgabe8() {
  // Erst der Zusammenhang, dann die Zahlen: Ein Delfin springt nicht 50 m weit.
  const kt = pick(A8_KONTEXTE);
  const k = ohneFeldKollision(A8_KANDIDATEN.filter((v) => v.w <= kt.maxW), (v) => [
    // Feld 1: die Stelle des höchsten Punktes.
    [v.halb, v.w, v.e, v.b],
    // Feld 2: die größte Höhe.
    [v.e, v.halb, v.w, v.b],
    // Feld 3: die Weite.
    [v.w, v.halb, v.e, v.b],
  ]);
  const { w, e, c, b, halb } = k;
  const bahn = `−${num(c)}x² ${b === 1 ? "+ x" : "+ " + num(b) + "x"}`;
  return {
    promptHtml: `${kt.einleitung}. Die Bahn beschreibt die Funktion<br>` +
      `<strong>h(x) = ${bahn}</strong><br>` +
      `Dabei ist x die waagerechte Entfernung in Metern und h(x) die Höhe in Metern.`,
    felder: [
      {
        name: "Entfernung des höchsten Punktes", soll: halb, einheit: "m", toleranz: 0.0005, platzhalter: "x in m",
        hinweis: (roh, val) => {
          if (Math.abs(val - w) < 0.0005) return `${num(w)} m ist die ganze Weite. Der höchste Punkt liegt genau in der Mitte.`;
          if (Math.abs(val - e) < 0.0005) return `${num(e)} ist eine Höhe, keine Entfernung.`;
          if (Math.abs(val - b) < 0.0005) return `${num(b)} ist der Koeffizient vor dem x, nicht die Stelle des Scheitels.`;
          return `Die Bahn beginnt bei x = 0 und endet bei x = ${num(w)}. Eine Parabel ist symmetrisch — der Scheitel liegt in der Mitte zwischen den beiden Nullstellen.`;
        },
      },
      {
        name: "größte Höhe", soll: e, einheit: "m", toleranz: 0.0005, platzhalter: "h in m",
        hinweis: (roh, val) => {
          if (Math.abs(val - halb) < 0.0005) return `${num(halb)} ist die <em>Stelle</em> des höchsten Punktes. Die Höhe bekommst du, indem du sie in h einsetzt.`;
          if (Math.abs(val - w) < 0.0005) return `${num(w)} m ist die Weite, nicht die Höhe.`;
          if (Math.abs(val - b) < 0.0005) return `${num(b)} ist der Koeffizient vor dem x.`;
          return `Setze x = ${num(halb)} in h ein: h(${num(halb)}) = −${num(c)} · ${num(halb)}² + ${num(b)} · ${num(halb)}.`;
        },
      },
      {
        name: `Weite, ${kt.frage}`, soll: w, einheit: "m", toleranz: 0.0005, platzhalter: "x in m",
        hinweis: (roh, val) => {
          if (Math.abs(val - halb) < 0.0005) return `${num(halb)} m ist erst die halbe Strecke — dort ist der höchste Punkt erreicht, nicht der Boden.`;
          if (Math.abs(val - e) < 0.0005) return `${num(e)} ist die Höhe, nicht die Weite.`;
          if (Math.abs(val - b) < 0.0005) return `${num(b)} ist der Koeffizient vor dem x.`;
          return `Gesucht ist die Stelle mit h(x) = 0. Klammere x aus: x · (−${num(c)}x + ${num(b)}) = 0.`;
        },
      },
    ],
    tipps: [
      "Der höchste Punkt ist der Scheitel der Parabel, die Weite die zweite Nullstelle. Beides steckt in derselben Gleichung.",
      `Die Nullstellen findest du durch Ausklammern: ${bahn} = x · (−${num(c)}x + ${num(b)}) = 0. Ein Produkt ist null, wenn ein Faktor null ist.`,
      "Der Scheitel liegt immer genau in der Mitte zwischen den beiden Nullstellen — die Parabel ist zu dieser Senkrechten symmetrisch.",
    ],
    musterloesungHtml:
      `<strong>1. Nullstellen durch Ausklammern:</strong> ${bahn} = x · (−${num(c)}x + ${num(b)}) = 0<br>` +
      `&nbsp;&nbsp;&nbsp;x = 0 (der Start) oder −${num(c)}x + ${num(b)} = 0 ⇒ x = ${num(b)} : ${num(c)} = <strong>${num(w)}</strong><br>` +
      `<strong>2. Scheitel in der Mitte:</strong> x = (0 + ${num(w)}) : 2 = <strong>${num(halb)}</strong><br>` +
      `<strong>3. Höhe dort:</strong> h(${num(halb)}) = −${num(c)} · ${num(halb * halb)} + ${num(b)} · ${num(halb)} = ${num(-c * halb * halb)} + ${num(b * halb)} = <strong>${num(e)}</strong><br>` +
      `<strong>Antwort:</strong> Nach ${num(halb)} m ist der höchste Punkt mit ${num(e)} m erreicht; nach ${num(w)} m ${kt.antwort}.<br>` +
      `<em>Probe:</em> h(${num(w)}) = −${num(c)} · ${num(w * w)} + ${num(b)} · ${num(w)} = ${num(-c * w * w)} + ${num(b * w)} = 0 ✓<br>` +
      `<span class="progress-note">Der Term hat keinen konstanten Summanden — deshalb beginnt die Bahn in der Höhe 0. ` +
      `Nur für 0 ≤ x ≤ ${num(w)} beschreibt die Parabel den Wurf; davor und danach wäre h(x) negativ, ` +
      `und eine Höhe unter dem Boden gibt es hier nicht.</span>`,
  };
}

function initExercises() {
  mountUebungsaufgaben(document.getElementById("exercises-mount"), [
    { schwierigkeit: "einfach", titel: "Aufgabe 1 — Scheitel ablesen", generate: generateAufgabe1 },
    { schwierigkeit: "einfach", titel: "Aufgabe 2 — Punktprobe", generate: generateAufgabe2 },
    { schwierigkeit: "mittel", titel: "Aufgabe 3 — quadratische Ergänzung", generate: generateAufgabe3 },
    { schwierigkeit: "mittel", titel: "Aufgabe 4 — Diskriminante", generate: generateAufgabe4 },
    { schwierigkeit: "schwierig", titel: "Aufgabe 5 — pq-Formel", generate: generateAufgabe5 },
    { schwierigkeit: "schwierig", titel: "Aufgabe 6 — Parabel aus Scheitel und Punkt", generate: generateAufgabe6 },
    { schwierigkeit: "komplex", titel: "Aufgabe 7 — größte Fläche", generate: generateAufgabe7 },
    { schwierigkeit: "komplex", titel: "Aufgabe 8 — Wurfparabel", generate: generateAufgabe8 },
  ]);
}

// ================= Quizze =================

function initQuizzes() {
  mountQuiz(document.getElementById("quiz-normalparabel"), {
    q: "Welcher Punkt liegt <em>nicht</em> auf der Normalparabel y = x²?",
    options: ["(−3 | −9)", "(−3 | 9)", "(0 | 0)", "(4 | 16)"],
    correct: 0,
    explain: "(−3)² = 9, nicht −9. Ein Quadrat ist nie negativ, deshalb liegt kein Punkt der Normalparabel unterhalb der x-Achse. Die Punkte (−3 | 9) und (3 | 9) liegen symmetrisch zur y-Achse.",
  });
  mountQuiz(document.getElementById("quiz-scheitelform"), {
    q: "Wo liegt der Scheitel von f(x) = 2(x + 3)² − 5?",
    options: ["S(−3 | −5)", "S(3 | −5)", "S(−3 | 5)", "S(2 | −3)"],
    correct: 0,
    explain: "Die Klammer (x + 3) wird null für x = −3 — dort liegt der Scheitel. Die Zahl hinter der Klammer ist die Höhe: −5. Die 2 davor formt die Parabel nur, sie verschiebt sie nicht.",
  });
  mountQuiz(document.getElementById("quiz-ergaenzung"), {
    q: "Welche Zahl muss man bei x² + 6x ergänzen, um eine binomische Formel zu erhalten?",
    options: ["9", "6", "3", "36"],
    correct: 0,
    explain: "Die halbe Zahl vor dem x ist 3, ihr Quadrat 9: x² + 6x + 9 = (x + 3)². Die 3 selbst steht in der Klammer, nicht im Term; die 36 wäre 6², also das Quadrat der ganzen statt der halben Zahl.",
  });
  mountQuiz(document.getElementById("quiz-pq"), {
    q: "Welche Lösungen hat x² − 5x + 6 = 0?",
    options: ["2 und 3", "−2 und −3", "5 und 6", "1 und 6"],
    correct: 0,
    explain: "p : 2 = −2,5 und D = 6,25 − 6 = 0,25, also x = 2,5 ± 0,5 — das sind 2 und 3. Schnellkontrolle: Die Summe der Lösungen muss −p = 5 sein und ihr Produkt q = 6. Bei −2 und −3 wäre die Summe −5.",
  });
  mountQuiz(document.getElementById("quiz-diskriminante"), {
    q: "Für x² + 2x + 5 = 0 ist D = 1 − 5 = −4. Was folgt daraus?",
    options: [
      "Es gibt keine Lösung; die Parabel trifft die x-Achse nicht",
      "Es gibt eine Lösung, nämlich x = −4",
      "Es gibt zwei Lösungen, x = ±2",
      "Es wurde falsch gerechnet, D kann nicht negativ sein",
    ],
    correct: 0,
    explain: "Aus einer negativen Zahl lässt sich keine Quadratwurzel ziehen, also L = { }. Das ist kein Rechenfehler: Der Scheitel liegt bei S(−1 | 4), die ganze Parabel also oberhalb der x-Achse. D darf sehr wohl negativ sein.",
  });
  mountQuiz(document.getElementById("quiz-extremwert"), {
    q: "Ein 40 m langer Zaun umschließt ein Rechteck. Wann ist die Fläche am größten?",
    options: [
      "bei einem Quadrat mit 10 m Seitenlänge",
      "bei einem Rechteck mit 15 m und 5 m",
      "bei einem Rechteck mit 20 m und 20 m",
      "bei einem möglichst langen, schmalen Streifen",
    ],
    correct: 0,
    explain: "Aus 2x + 2y = 40 folgt y = 20 − x, also A(x) = x(20 − x) = −(x − 10)² + 100. Der Scheitel liegt bei x = 10, die größte Fläche ist 100 m². 15 m × 5 m ergäbe nur 75 m²; 20 m × 20 m hätte den Umfang 80 m.",
  });
}

// ================= Start =================

initNormalparabel();
initScheitelform();
initErgaenzung();
initPq();
initDiskriminante();
initExtremwert();
initExercises();
initQuizzes();
