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
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") btnPruefen.click(); });

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
    musterloesungHtml:
      `<strong>Scheitelform:</strong> f(x) = a · (x − d)² + e mit dem Scheitel S(d | e)<br>` +
      `<strong>Vergleichen:</strong> a = ${num(a)}, d = <strong>${num(d)}</strong>, e = ${num(e)}<br>` +
      `Die Klammer (x ${d > 0 ? "−" : "+"} ${num(Math.abs(d))}) wird null für <strong>x = ${num(d)}</strong>; dort liegt der Scheitel, und zwar in der Höhe ${num(e)}.<br>` +
      `<em>Also:</em> S(${num(d)} | ${num(e)}) — die Parabel ist ${a > 0 ? "nach oben" : "nach unten"} geöffnet, ${num(e)} ist damit ihr ${a > 0 ? "kleinster" : "größter"} Wert.`,
  };
}

// Aufgabe 2 — quadratische Ergänzung: die y-Koordinate des Scheitels.
function generateAufgabe2() {
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
    musterloesungHtml:
      `<strong>1. Halbieren:</strong> p : 2 = ${num(p)} : 2 = ${num(halb)}, also (p : 2)² = ${num(halb * halb)}<br>` +
      `<strong>2. Ergänzen:</strong> ${normalRein(p, q)} = x² ${p > 0 ? "+" : "−"} ${num(Math.abs(p))}x + ${num(halb * halb)} − ${num(halb * halb)}${q === 0 ? "" : (q > 0 ? " + " : " − ") + num(Math.abs(q))}<br>` +
      `<strong>3. Binomische Formel:</strong> = (x ${halb > 0 ? "+" : "−"} ${num(Math.abs(halb))})² − ${num(halb * halb)}${q === 0 ? "" : (q > 0 ? " + " : " − ") + num(Math.abs(q))}<br>` +
      `<strong>4. Zusammenfassen:</strong> = ${scheitelRein(1, d, e)}, also S(${num(d)} | <strong>${num(e)}</strong>)<br>` +
      `<em>Probe:</em> f(${klammer(d)}) = ${klammer(d)}² ${p > 0 ? "+" : "−"} ${faktor(`${num(Math.abs(p))} · ${klammer(d)}`)}${q === 0 ? "" : (q > 0 ? " + " : " − ") + num(Math.abs(q))} = ${num(d * d + p * d + q)} ✓`,
  };
}

// Aufgabe 3 — pq-Formel, gesucht ist die größere Lösung.
const A3_KANDIDATEN = PQ_KANDIDATEN.filter((v) => v.x1 !== v.x2);

function generateAufgabe3() {
  const k = ohneKollision(A3_KANDIDATEN,
    (v) => [Math.max(v.x1, v.x2), Math.min(v.x1, v.x2), -v.p / 2, (v.p / 2) * (v.p / 2) - v.q, v.q],
    A3_KANDIDATEN[0]);
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
    musterloesungHtml:
      `<strong>1. Ablesen:</strong> p = ${num(p)}, q = ${num(q)}, also p : 2 = ${num(halb)}<br>` +
      `<strong>2. Diskriminante:</strong> D = ${klammer(halb)}² − ${klammer(q)} = ${num(halb * halb)} − ${klammer(q)} = <strong>${num(D)}</strong>, √D = ${num(w)}<br>` +
      `<strong>3. Einsetzen:</strong> x<sub>1,2</sub> = ${num(-halb)} ± ${num(w)}<br>` +
      `<strong>4. Beide Vorzeichen:</strong> x₁ = ${num(klein)} und x₂ = <strong>${num(gross)}</strong><br>` +
      `<em>Probe mit der größeren:</em> ${klammer(gross)}² ${p > 0 ? "+" : "−"} ${faktor(`${num(Math.abs(p))} · ${klammer(gross)}`)}${q === 0 ? "" : (q > 0 ? " + " : " − ") + num(Math.abs(q))} = ${num(gross * gross + p * gross + q)} ✓<br>` +
      `<em>Schnellkontrolle:</em> Die Summe beider Lösungen ist ${num(x1 + x2)} = −p, ihr Produkt ${num(x1 * x2)} = q.`,
  };
}

// Aufgabe 4 — Extremwertaufgabe: die größtmögliche Fläche.
const A4_KANDIDATEN = (() => {
  const liste = [];
  for (let n = 3; n <= 20; n++) {
    const U = 4 * n;          // damit U : 4 ganzzahlig bleibt
    liste.push({ U, best: n, maxA: n * n, halbU: 2 * n });
  }
  return liste;
})();

function generateAufgabe4() {
  const k = ohneKollision(A4_KANDIDATEN, (v) => [v.maxA, v.best, v.halbU, v.U], A4_KANDIDATEN[0]);
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
    musterloesungHtml:
      `<strong>1. Ansatz:</strong> 2x + 2y = ${num(U)}, also y = ${num(halbU)} − x<br>` +
      `<strong>2. Flächenterm:</strong> A(x) = x · (${num(halbU)} − x) = −x² + ${num(halbU)}x<br>` +
      `<strong>3. Quadratische Ergänzung:</strong> A(x) = −(x² − ${num(halbU)}x) = −(x − ${num(best)})² + ${num(maxA)}<br>` +
      `<strong>4. Scheitel ablesen:</strong> S(${num(best)} | ${num(maxA)}); weil a = −1 negativ ist, ist das ein <strong>Maximum</strong>.<br>` +
      `<em>Antwort:</em> Bei x = ${num(best)} m und y = ${num(best)} m — also einem <strong>Quadrat</strong> — wird die Fläche mit <strong>${num(maxA)} m²</strong> am größten.<br>` +
      `<em>Probe:</em> Umfang 4 · ${num(best)} m = ${num(U)} m ✓. Zum Vergleich: ${num(best - 1)} m × ${num(best + 1)} m ergäbe nur ${num((best - 1) * (best + 1))} m².`,
  };
}

function initExercises() {
  mountUebungsaufgaben(document.getElementById("exercises-mount"), [
    { schwierigkeit: "einfach", titel: "Aufgabe 1 — Scheitel ablesen", generate: generateAufgabe1 },
    { schwierigkeit: "mittel", titel: "Aufgabe 2 — quadratische Ergänzung", generate: generateAufgabe2 },
    { schwierigkeit: "schwierig", titel: "Aufgabe 3 — pq-Formel", generate: generateAufgabe3 },
    { schwierigkeit: "komplex", titel: "Aufgabe 4 — größte Fläche", generate: generateAufgabe4 },
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
