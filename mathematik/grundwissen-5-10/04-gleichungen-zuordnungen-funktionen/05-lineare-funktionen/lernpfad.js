// Selbstlernpfad "Lineare Funktionen" (Grundwissen Klasse 5-10, Kapitel 4).
// Rein clientseitiges Vanilla-JS, ohne Build-Schritt oder externe Bibliotheken.
//
// Leitgedanke: Eine lineare Funktion ist zweimal dasselbe — eine Rechenvorschrift
// und eine Gerade. Jeder Abschnitt zeigt deshalb beide Seiten nebeneinander:
// Abschnitt 1 prüft den Funktionsbegriff mit einer beweglichen Senkrechten,
// Abschnitt 2 verbindet m und b mit dem, was die Gerade tut, Abschnitt 3 legt
// das Steigungsdreieck an, Abschnitt 4 rechnet von zwei Punkten zurück zur
// Gleichung, und Abschnitt 5 macht sichtbar, dass Nullstelle und Schnittpunkt
// nichts weiter sind als gelöste Gleichungen.
//
// Durchgehende Farbcodierung: Funktion g grün, Funktion h blau,
// Steigungsdreieck orange, y-Achsenabschnitt violett, Nullstelle rot.

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
  // In einer Funktionsgleichung steht ein Minuszeichen, kein Bindestrich.
  // Außerdem: −b : m ergibt für b = 0 die negative Null, und die erschiene
  // sonst als „−0“. Deshalb wird erst auf die Anzeigegenauigkeit gerundet und
  // dann über das Vorzeichen entschieden — was als 0 erscheint, ist eine 0.
  const gerundet = Number(x.toFixed(Math.min(20, digits)));
  const z = gerundet === 0 ? 0 : x;
  return zahlformat(digits).format(z).replace("-", "−");
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
  return el("div", { class: "lf-karte " + klasse }, [
    el("span", { class: "name" }, name),
    el("span", { class: "wert", html: inhalt }),
  ]);
}
function faktor(text) {
  return `<span class="nw">${text}</span>`;
}
// Negative Zahlen bekommen in einer Rechnung eine Klammer. Ohne sie stünde
// dort "3 − −5", und das ist keine Schreibweise, die man einem Kind zumutet.
function klammer(x, stellen = 4) {
  return x < 0 ? `(${num(x, stellen)})` : num(x, stellen);
}
// Brüche werden gekürzt dargestellt: 6 : 4 heißt 3 : 2, und 4 : 2 heißt 2.
function bruchText(z, n) {
  if (n === 0) return "—";
  const vz = (z < 0) !== (n < 0) ? -1 : 1;
  const az = Math.abs(z), an = Math.abs(n);
  const g = ggt(az, an) || 1;
  const zz = az / g, nn = an / g;
  if (nn === 1) return num(vz * zz);
  return (vz < 0 ? "−" : "") + faktor(`${num(zz)} : ${num(nn)}`);
}
// "+ 3" bzw. "− 3"; die 0 verschwindet ganz.
function anhang(x, klasse = "") {
  if (x === 0) return "";
  const s = klasse ? `<span class="${klasse}">${num(Math.abs(x))}</span>` : num(Math.abs(x));
  return ` ${x > 0 ? "+" : "−"} ${s}`;
}
// "m · x" in üblicher Schreibweise: 1x wird zu x, −1x zu −x, 0x verschwindet.
function steigungsTeil(m, klasse = "") {
  const f = (s) => (klasse ? `<span class="${klasse}">${s}</span>` : s);
  if (m === 0) return "";
  if (m === 1) return "x";
  if (m === -1) return "−x";
  return f(num(m)) + "x";
}
function geradeHtml(m, b, mKlasse = "mv", bKlasse = "bv") {
  if (m === 0) return `<span class="${bKlasse}">${num(b)}</span>`;
  const kopf = steigungsTeil(m, mKlasse);
  return kopf + (b === 0 ? "" : ` ${b > 0 ? "+" : "−"} <span class="${bKlasse}">${num(Math.abs(b))}</span>`);
}

// ---------- Koordinatensystem ----------
// Liefert die Umrechnung von Sachkoordinaten in Bildkoordinaten zurück. Die
// Achsen tragen immer Zahlen; ein Gitter ohne Beschriftung wäre nur Dekor.
function koordinaten(svg, opt) {
  const { links, oben, breite, hoehe, xMin, xMax, yMin, yMax, xSchritt = 1, ySchritt = 2 } = opt;
  const px = (x) => links + ((x - xMin) / (xMax - xMin)) * breite;
  const py = (y) => oben + hoehe - ((y - yMin) / (yMax - yMin)) * hoehe;

  for (let x = Math.ceil(xMin); x <= xMax; x += xSchritt) {
    svg.appendChild(svgEl("line", { x1: px(x).toFixed(2), y1: py(yMax).toFixed(2), x2: px(x).toFixed(2), y2: py(yMin).toFixed(2), class: "lf-gitter" }));
    if (x !== 0 && x % (xSchritt * 2) === 0) svg.appendChild(svgText(px(x), py(0) + 14, num(x), { class: "lf-achsentext" }));
  }
  for (let y = Math.ceil(yMin / ySchritt) * ySchritt; y <= yMax; y += ySchritt) {
    svg.appendChild(svgEl("line", { x1: px(xMin).toFixed(2), y1: py(y).toFixed(2), x2: px(xMax).toFixed(2), y2: py(y).toFixed(2), class: "lf-gitter" }));
    if (y !== 0) svg.appendChild(svgText(px(0) - 7, py(y) + 4, num(y), { class: "lf-achsentext", "text-anchor": "end" }));
  }
  svg.appendChild(svgEl("line", { x1: px(xMin).toFixed(2), y1: py(0).toFixed(2), x2: (px(xMax) + 12).toFixed(2), y2: py(0).toFixed(2), class: "lf-achse" }));
  svg.appendChild(svgEl("line", { x1: px(0).toFixed(2), y1: py(yMin).toFixed(2), x2: px(0).toFixed(2), y2: (py(yMax) - 12).toFixed(2), class: "lf-achse" }));
  svg.appendChild(svgText(px(0) - 7, py(0) + 14, "0", { class: "lf-achsentext", "text-anchor": "end" }));
  svg.appendChild(svgText(px(xMax) + 12, py(0) + 20, "x", { class: "lf-achsenname", "text-anchor": "end" }));
  // Der Achsenname sitzt ein Stück unterhalb der Pfeilspitze: Ganz oben stünde
  // er in der Bildüberschrift.
  svg.appendChild(svgText(px(0) + 9, py(yMax) + 10, "y", { class: "lf-achsenname", "text-anchor": "start" }));
  return { px, py };
}

// Zeichnet eine Gerade, am Fenster abgeschnitten. Ohne das Abschneiden liefe
// sie bei großer Steigung weit über den Rand hinaus.
function geradeZeichnen(svg, g, m, b, xMin, xMax, yMin, yMax, klasse) {
  const punkte = [];
  for (const x of [xMin, xMax]) {
    let y = m * x + b, xx = x;
    if (y > yMax) { y = yMax; xx = m === 0 ? x : (yMax - b) / m; }
    if (y < yMin) { y = yMin; xx = m === 0 ? x : (yMin - b) / m; }
    punkte.push([Math.max(xMin, Math.min(xMax, xx)), y]);
  }
  svg.appendChild(svgEl("line", {
    x1: g.px(punkte[0][0]).toFixed(2), y1: g.py(punkte[0][1]).toFixed(2),
    x2: g.px(punkte[1][0]).toFixed(2), y2: g.py(punkte[1][1]).toFixed(2),
    class: "lf-gerade " + klasse,
  }));
}

function punktZeichnen(svg, g, x, y, klasse, beschriftung, rechts = true, oben = true) {
  svg.appendChild(svgEl("circle", { cx: g.px(x).toFixed(2), cy: g.py(y).toFixed(2), r: 5, class: "lf-punkt " + klasse }));
  if (beschriftung) {
    svg.appendChild(svgText(g.px(x) + (rechts ? 9 : -9), g.py(y) + (oben ? -8 : 16), beschriftung, {
      class: "lf-punkttext " + klasse, "text-anchor": rechts ? "start" : "end",
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

function schrittZeile(inhaltHtml, grundHtml, klasse = "", kommentar = "") {
  return `<div class="zeile ${klasse}">` +
    `<span class="lf">${inhaltHtml}</span>` +
    (grundHtml ? `<span class="grund">${grundHtml}</span>` : "") +
    (kommentar ? `<span class="kommentar">${kommentar}</span>` : "") +
    `</div>`;
}

// ================= 1. Was ist eine Funktion? =================

// Der Senkrechtentest wird wörtlich genommen: Eine bewegliche senkrechte
// Gerade zählt ihre Schnittpunkte mit dem Graphen. Zwei davon, und die
// Zuordnung ist keine Funktion.
const FU_FAELLE = [
  {
    knopf: "y = 2x − 1", name: "die lineare Funktion y = 2x − 1",
    ist: true,
    treffer: (x) => [2 * x - 1],
    zeichnen: (svg, g, xMin, xMax, yMin, yMax) => geradeZeichnen(svg, g, 2, -1, xMin, xMax, yMin, yMax, "g"),
    grund: "Zu jedem x gehört genau ein Wert 2x − 1.",
  },
  {
    knopf: "y = x²", name: "die Normalparabel y = x²",
    ist: true,
    treffer: (x) => [x * x],
    zeichnen: (svg, g, xMin, xMax, yMin, yMax) => {
      let d = "";
      for (let x = xMin; x <= xMax + 1e-9; x += 0.1) {
        const y = x * x;
        if (y > yMax) continue;
        d += (d ? " L " : "M ") + g.px(x).toFixed(2) + " " + g.py(y).toFixed(2);
      }
      svg.appendChild(svgEl("path", { d, class: "lf-gerade g" }));
    },
    grund: "Auch hier gehört zu jedem x genau ein Wert — dass zwei x denselben Wert haben (etwa 3 und −3), ist erlaubt.",
  },
  {
    knopf: "Kreis um (0|0)", name: "der Kreis mit dem Radius 5",
    ist: false,
    treffer: (x) => (Math.abs(x) > 5 ? [] : Math.abs(x) === 5 ? [0] : [Math.sqrt(25 - x * x), -Math.sqrt(25 - x * x)]),
    zeichnen: (svg, g) => {
      svg.appendChild(svgEl("ellipse", {
        cx: g.px(0).toFixed(2), cy: g.py(0).toFixed(2),
        rx: (g.px(5) - g.px(0)).toFixed(2), ry: (g.py(0) - g.py(5)).toFixed(2),
        class: "lf-gerade g",
      }));
    },
    grund: "Zu x = 3 gehören zwei Werte: 4 und −4. Damit ist die Bedingung „genau ein y“ verletzt.",
  },
  {
    knopf: "senkrechte Gerade x = 2", name: "die senkrechte Gerade x = 2",
    ist: false,
    treffer: (x) => (x === 2 ? [-8, -4, 0, 4, 8] : []),
    zeichnen: (svg, g, xMin, xMax, yMin, yMax) => {
      svg.appendChild(svgEl("line", {
        x1: g.px(2).toFixed(2), y1: g.py(yMin).toFixed(2), x2: g.px(2).toFixed(2), y2: g.py(yMax).toFixed(2),
        class: "lf-gerade g",
      }));
    },
    grund: "Bei x = 2 liegen unendlich viele Punkte übereinander, bei jedem anderen x gar keiner. Eine senkrechte Gerade ist nie ein Funktionsgraph.",
  },
];
let fuNr = 0;

function fuBild(fall, xPruef) {
  const B = 470, H = 320;
  const svg = neueFlaeche(B, H);
  const xMin = -7, xMax = 7, yMin = -9, yMax = 9;
  const g = koordinaten(svg, { links: 46, oben: 26, breite: 386, hoehe: 262, xMin, xMax, yMin, yMax, xSchritt: 1, ySchritt: 2 });

  fall.zeichnen(svg, g, xMin, xMax, yMin, yMax);

  // Die Prüfgerade und ihre Schnittpunkte
  svg.appendChild(svgEl("line", {
    x1: g.px(xPruef).toFixed(2), y1: g.py(yMin).toFixed(2),
    x2: g.px(xPruef).toFixed(2), y2: g.py(yMax).toFixed(2), class: "lf-pruefgerade",
  }));
  const alle = fall.treffer(xPruef);
  const werte = alle.filter((y) => y >= yMin && y <= yMax);
  werte.forEach((y, i) => {
    punktZeichnen(svg, g, xPruef, y, "null", i === 0 ? `(${num(xPruef)} | ${num(y, 2)})` : "", xPruef <= 3, true);
  });

  // Die Überschrift zählt, was man SIEHT. Liegt ein Wert außerhalb des
  // Ausschnitts, wird das gesagt — sonst behauptete das Bild einen Punkt,
  // den es nicht zeigt.
  const versteckt = alle.length - werte.length;
  svg.appendChild(svgText(B / 2, 16, `Senkrechtentest bei x = ${num(xPruef)}: ` +
    (werte.length === 1 ? "genau ein Schnittpunkt" : werte.length === 0 ? "kein Schnittpunkt im Ausschnitt" : `${num(werte.length)} Schnittpunkte`) +
    (versteckt > 0 ? ` (${versteckt === 1 ? "ein weiterer liegt" : num(versteckt) + " weitere liegen"} außerhalb)` : ""),
    { class: "lf-achsenname" }));
  svg.appendChild(svgText(B / 2, H - 6, "Die rote Senkrechte darf den Graphen höchstens einmal treffen.", { class: "lf-achsentext" }));
  return svg;
}

function renderFunktion() {
  const fall = FU_FAELLE[fuNr];
  const xPruef = begrenzt("fu-x", Number(document.getElementById("fu-x").value), -6, 6);
  document.getElementById("fu-x-anzeige").textContent = "x = " + num(xPruef);

  const schalter = document.getElementById("fu-schalter");
  schalter.innerHTML = "";
  FU_FAELLE.forEach((f, i) => {
    const btn = el("button", { type: "button", class: i === fuNr ? "aktiv" : "" }, f.knopf);
    btn.addEventListener("click", () => { fuNr = i; renderFunktion(); });
    schalter.appendChild(btn);
  });

  const mount = document.getElementById("fu-mount");
  mount.innerHTML = "";
  mount.appendChild(fuBild(fall, xPruef));

  const werte = fall.treffer(xPruef);
  const sichtbar = werte.filter((y) => y >= -9 && y <= 9);
  const karten = document.getElementById("fu-karten");
  karten.innerHTML = "";
  karten.appendChild(karte("b", "geprüfte Stelle", "x = " + num(xPruef)));
  karten.appendChild(karte("null", "Werte an dieser Stelle", num(werte.length)));
  karten.appendChild(karte(fall.ist ? "g" : "h", "Funktion?",
    `<span class="lf-urteil ${fall.ist ? "ja" : "nein"}">${fall.ist ? "ja" : "nein"}</span>`));
  karten.appendChild(karte("m", "Schreibweise", fall.ist ? "f(x)" : "—"));

  document.getElementById("fu-bilanz").innerHTML =
    `<strong>Geprüft wird ${fall.name}.</strong><br>` +
    (werte.length === 1
      ? `An der Stelle x = <span class="wb">${num(xPruef)}</span> gibt es <span class="wg">genau einen</span> Wert: ` +
        `${werte.map((y) => num(y, 2)).join(", ")}. Das ist hier erlaubt.`
      : werte.length === 0
        ? `An der Stelle x = <span class="wb">${num(xPruef)}</span> gibt es <span class="wn">gar keinen</span> Wert — ` +
          `die Stelle gehört nicht zur Definitionsmenge.`
        : `An der Stelle x = <span class="wb">${num(xPruef)}</span> gibt es <span class="wn">${num(werte.length)}</span> Werte: ` +
          `${werte.map((y) => num(y, 2)).join(" und ")}. Damit ist die Bedingung „genau ein y“ verletzt.`) +
    (sichtbar.length < werte.length
      ? `<br><span class="wn">Im gezeigten Ausschnitt ist der Punkt nicht zu sehen</span> — er liegt oberhalb oder unterhalb des Bildrands. An der Sache ändert das nichts.`
      : "") +
    `<br><strong>Urteil:</strong> ${fall.grund}`;

  document.getElementById("fu-text").textContent = fall.ist
    ? "Schiebe die Senkrechte über den ganzen Bereich — sie trifft den Graphen nirgends zweimal. Das ist der Funktionsbegriff als Bild."
    : "Schiebe die Senkrechte: Es gibt Stellen mit mehr als einem Schnittpunkt. Eine einzige solche Stelle genügt, um den Funktionsbegriff zu verletzen.";
}

function initFunktion() {
  document.getElementById("fu-x").addEventListener("input", renderFunktion);
  renderFunktion();
}

// ================= 2. Die Gerade y = m · x + b =================

function geBild(m, b) {
  const B = 470, H = 320;
  const svg = neueFlaeche(B, H);
  const xMin = -7, xMax = 7, yMin = -9, yMax = 9;
  const g = koordinaten(svg, { links: 46, oben: 26, breite: 386, hoehe: 262, xMin, xMax, yMin, yMax, xSchritt: 1, ySchritt: 2 });

  geradeZeichnen(svg, g, m, b, xMin, xMax, yMin, yMax, "g");

  // Das Steigungsdreieck sitzt dort, wo es vollständig ins Bild passt — und
  // möglichst nicht auf der y-Achse, wo schon der Achsenabschnitt beschriftet
  // ist. Die Kandidaten werden der Reihe nach durchprobiert.
  let x0 = 1;
  for (const kandidat of [1, 2, -2, -3, 3, -4, 0]) {
    const ya = m * kandidat + b, yb = m * (kandidat + 1) + b;
    if (ya >= yMin && ya <= yMax && yb >= yMin && yb <= yMax && kandidat + 1 <= xMax) { x0 = kandidat; break; }
  }
  const y0 = m * x0 + b, y1 = m * (x0 + 1) + b;
  if (m !== 0 && y0 >= yMin && y0 <= yMax && y1 >= yMin && y1 <= yMax) {
    svg.appendChild(svgEl("path", {
      d: `M ${g.px(x0)} ${g.py(y0)} L ${g.px(x0 + 1)} ${g.py(y0)} L ${g.px(x0 + 1)} ${g.py(y1)} Z`,
      class: "lf-dreieck",
    }));
    svg.appendChild(svgText(g.px(x0 + 0.5), g.py(y0) + (m > 0 ? 15 : -7), "1", { class: "lf-dreiecktext" }));
    svg.appendChild(svgText(g.px(x0 + 1) + 9, g.py((y0 + y1) / 2) + 4, num(m), { class: "lf-dreiecktext", "text-anchor": "start" }));
  }

  if (b >= yMin && b <= yMax) punktZeichnen(svg, g, 0, b, "achse", `b = ${num(b)}`, true, true);
  if (m !== 0) {
    const nullstelle = -b / m;
    if (nullstelle >= xMin && nullstelle <= xMax) {
      punktZeichnen(svg, g, nullstelle, 0, "null", `x₀ = ${num(nullstelle, 2)}`, nullstelle <= 3, false);
    }
  }

  svg.appendChild(svgText(B / 2, 16, `f(x) = ${m === 0 ? "" : (m === 1 ? "" : m === -1 ? "−" : num(m))}${m === 0 ? "" : "x"}${m === 0 ? num(b) : (b === 0 ? "" : (b > 0 ? " + " : " − ") + num(Math.abs(b)))}`,
    { class: "lf-achsenname" }));
  svg.appendChild(svgText(B / 2, H - 6,
    m === 0 ? "Steigung 0: Die Gerade verläuft waagerecht."
      : "Ein Schritt nach rechts, " + (m > 0 ? num(m) + " nach oben." : num(-m) + " nach unten."),
    { class: "lf-achsentext" }));
  return svg;
}

function renderGerade() {
  const m = begrenzt("ge-m", Number(document.getElementById("ge-m").value), -6, 6);
  const b = begrenzt("ge-b", Number(document.getElementById("ge-b").value), -6, 6);
  document.getElementById("ge-m-anzeige").textContent = num(m);
  document.getElementById("ge-b-anzeige").textContent = num(b);

  document.getElementById("ge-gleichung").innerHTML = `f(x) = ${geradeHtml(m, b)}`;

  const mount = document.getElementById("ge-mount");
  mount.innerHTML = "";
  mount.appendChild(geBild(m, b));

  const xWerte = [-3, -2, -1, 0, 1, 2, 3];
  const yWerte = xWerte.map((x) => m * x + b);
  document.getElementById("ge-tabelle").innerHTML =
    `<caption>Wertetabelle — die Zeile „Zuwachs“ zeigt die Steigung</caption>` +
    `<tr><th>x</th>` + xWerte.map((x) => `<td class="x${x === 0 ? " hervor" : ""}">${num(x)}</td>`).join("") + `</tr>` +
    `<tr><th>f(x)</th>` + yWerte.map((y, i) => `<td class="y${xWerte[i] === 0 ? " hervor" : ""}">${num(y)}</td>`).join("") + `</tr>` +
    `<tr><th>Zuwachs</th><td></td>` + yWerte.slice(1).map((y, i) => `<td class="d">${num(y - yWerte[i])}</td>`).join("") + `</tr>`;

  const karten = document.getElementById("ge-karten");
  karten.innerHTML = "";
  karten.appendChild(karte("m", "Steigung m", num(m)));
  karten.appendChild(karte("b", "y-Achsenabschnitt b", num(b)));
  karten.appendChild(karte("g", "f(0)", num(b)));
  karten.appendChild(karte("null", "Nullstelle", m === 0 ? (b === 0 ? "jede Stelle" : "keine") : num(-b / m, 4)));

  document.getElementById("ge-bilanz").innerHTML =
    `<strong>Der y-Achsenabschnitt</strong> ist <span class="wb">b = ${num(b)}</span>, denn ` +
    `f(0) = ${faktor(`${num(m)} · 0`)}${anhang(b)} = ${num(b)}. Die Gerade geht durch den Punkt (0 | ${num(b)}).<br>` +
    `<strong>Die Steigung</strong> ist <span class="wm">m = ${num(m)}</span>: Jeder Schritt um 1 nach rechts ändert den Wert um ${num(m)}. ` +
    `In der Tabelle steht deshalb in jeder Zuwachszelle dieselbe Zahl ${num(m)}.<br>` +
    (m === 0
      ? `<strong>Sonderfall m = 0:</strong> Die Funktion ist konstant, ihr Graph eine waagerechte Gerade. ` +
        (b === 0 ? "Sie liegt genau auf der x-Achse — jede Stelle ist Nullstelle." : "Sie trifft die x-Achse nie, es gibt also keine Nullstelle.")
      : `<strong>Die Nullstelle</strong> löst ${faktor(`${num(m)}x${anhang(b)} = 0`)}, also ` +
        `x₀ = ${faktor(`${num(-b)} : ${num(m)}`)} = <span class="wn">${num(-b / m, 4)}</span>.` +
        (b === 0 ? " Wegen b = 0 ist die Funktion sogar proportional; ihr Graph geht durch den Ursprung." : ""));

  document.getElementById("ge-text").textContent =
    m === 0 ? "Bei m = 0 hängt der Wert gar nicht mehr von x ab — man nennt die Funktion dann konstant."
      : b === 0 ? "Bei b = 0 geht die Gerade durch den Ursprung: Das ist genau eine proportionale Zuordnung."
        : `Verschiebe b: Die Gerade wandert nach oben oder unten, ihre Neigung bleibt. Verändere m: Sie kippt um den Punkt (0 | ${num(b)}).`;
}

function initGerade() {
  ["ge-m", "ge-b"].forEach((id) => document.getElementById(id).addEventListener("input", renderGerade));
  renderGerade();
}

// ================= 3. Die Steigung aus zwei Punkten =================

function stBild(x1, y1, x2, y2) {
  const B = 470, H = 320;
  const svg = neueFlaeche(B, H);
  const xMin = -7, xMax = 7, yMin = -9, yMax = 9;
  const g = koordinaten(svg, { links: 46, oben: 26, breite: 386, hoehe: 262, xMin, xMax, yMin, yMax, xSchritt: 1, ySchritt: 2 });

  const gleich = x1 === x2;
  if (!gleich) {
    const m = (y2 - y1) / (x2 - x1), b = y1 - m * x1;
    geradeZeichnen(svg, g, m, b, xMin, xMax, yMin, yMax, "g");
    // Das Steigungsdreieck liegt zwischen den beiden Punkten.
    const xl = Math.min(x1, x2), xr = Math.max(x1, x2);
    const yl = m * xl + b, yr = m * xr + b;
    svg.appendChild(svgEl("path", {
      d: `M ${g.px(xl)} ${g.py(yl)} L ${g.px(xr)} ${g.py(yl)} L ${g.px(xr)} ${g.py(yr)} Z`,
      class: "lf-dreieck",
    }));
    svg.appendChild(svgText(g.px((xl + xr) / 2), g.py(yl) + (yr > yl ? 15 : -7), `Δx = ${num(xr - xl)}`, { class: "lf-dreiecktext" }));
    svg.appendChild(svgText(g.px(xr) + 9, g.py((yl + yr) / 2) + 4, `Δy = ${num(yr - yl)}`, { class: "lf-dreiecktext", "text-anchor": xr <= 4 ? "start" : "end" }));
  } else {
    svg.appendChild(svgEl("line", {
      x1: g.px(x1).toFixed(2), y1: g.py(yMin).toFixed(2), x2: g.px(x1).toFixed(2), y2: g.py(yMax).toFixed(2),
      class: "lf-gerade g blass",
    }));
  }
  punktZeichnen(svg, g, x1, y1, "g", `P(${num(x1)} | ${num(y1)})`, x1 <= 2, true);
  punktZeichnen(svg, g, x2, y2, "h", `Q(${num(x2)} | ${num(y2)})`, x2 <= 2, false);

  svg.appendChild(svgText(B / 2, 16, gleich
    ? "x₁ = x₂ — hier gibt es keine Steigung"
    : `Steigungsdreieck: ${num(x2 - x1)} nach rechts, ${num(y2 - y1)} nach oben`, { class: "lf-achsenname" }));
  svg.appendChild(svgText(B / 2, H - 6,
    gleich ? "Eine senkrechte Gerade hat keine Steigung — man müsste durch 0 teilen."
      : "Jedes andere Steigungsdreieck derselben Geraden liefert denselben Quotienten.",
    { class: "lf-achsentext" }));
  return svg;
}

function renderSteigung() {
  const x1 = begrenzt("st-x1", Number(document.getElementById("st-x1").value), -6, 5);
  const y1 = begrenzt("st-y1", Number(document.getElementById("st-y1").value), -8, 8);
  const x2 = begrenzt("st-x2", Number(document.getElementById("st-x2").value), -5, 6);
  const y2 = begrenzt("st-y2", Number(document.getElementById("st-y2").value), -8, 8);
  document.getElementById("st-x1-anzeige").textContent = num(x1);
  document.getElementById("st-y1-anzeige").textContent = num(y1);
  document.getElementById("st-x2-anzeige").textContent = num(x2);
  document.getElementById("st-y2-anzeige").textContent = num(y2);

  const dx = x2 - x1, dy = y2 - y1;
  const gleich = dx === 0;

  const mount = document.getElementById("st-mount");
  mount.innerHTML = "";
  mount.appendChild(stBild(x1, y1, x2, y2));

  const zeilen = [
    schrittZeile(`m = <span class="nw">(y₂ − y₁) : (x₂ − x₁)</span>`, "Steigungsformel", "", "die Formel"),
    schrittZeile(`m = <span class="nw">(${num(y2)} − ${klammer(y1)}) : (${num(x2)} − ${klammer(x1)})</span>`, "einsetzen", "",
      "die Werte der beiden Punkte"),
    schrittZeile(`m = ${gleich ? "<span class=\"nw\">" + num(dy) + " : 0</span>" : "<span class=\"nw\">" + num(dy) + " : " + num(dx) + "</span>"}`,
      "ausrechnen", "", "Δy und Δx"),
  ];
  if (gleich) {
    zeilen.push(schrittZeile(`<strong>nicht definiert</strong>`, "durch 0", "", "Division durch 0 ist verboten"));
  } else {
    zeilen.push(schrittZeile(`m = <span class="mv">${bruchText(dy, dx)}</span>`, "gekürzt", "fertig", "die Steigung"));
  }
  document.getElementById("st-schritte").innerHTML = zeilen.join("");

  const karten = document.getElementById("st-karten");
  karten.innerHTML = "";
  karten.appendChild(karte("m", "Δx (nach rechts)", num(dx)));
  karten.appendChild(karte("m", "Δy (nach oben)", num(dy)));
  karten.appendChild(karte("g", "Steigung m", gleich ? "nicht definiert" : bruchText(dy, dx)));
  karten.appendChild(karte("b", "y-Achsenabschnitt b", gleich ? "—" : num(y1 - (dy / dx) * x1, 4)));

  document.getElementById("st-bilanz").innerHTML = gleich
    ? `<strong>Beide Punkte haben dieselbe x-Koordinate.</strong> Der Nenner Δx wäre 0 — und durch 0 darf man nicht teilen. ` +
      `Die Verbindungsgerade ist senkrecht; sie ist kein Funktionsgraph, denn über x = ${num(x1)} lägen unendlich viele Punkte.`
    : `<strong>Δx = ${num(x2)} − ${klammer(x1)} = <span class="wm">${num(dx)}</span></strong> Schritte nach rechts, ` +
      `<strong>Δy = ${num(y2)} − ${klammer(y1)} = <span class="wm">${num(dy)}</span></strong> nach oben.<br>` +
      `<strong>m = Δy : Δx = ${faktor(`${klammer(dy)} : ${klammer(dx)}`)} = <span class="wm">${bruchText(dy, dx)}</span></strong><br>` +
      `<strong>Vertauschte Reihenfolge:</strong> ${faktor(`(${num(y1)} − ${klammer(y2)}) : (${num(x1)} − ${klammer(x2)})`)} = ` +
      `${faktor(`${klammer(-dy)} : ${klammer(-dx)}`)} = ${bruchText(-dy, -dx)} — dasselbe Ergebnis, denn beide Vorzeichen kürzen sich weg.`;

  document.getElementById("st-text").textContent = gleich
    ? "Schiebe x₂ weg von x₁ — erst dann gibt es überhaupt eine Steigung."
    : dy === 0
      ? "Δy = 0: Die Gerade verläuft waagerecht, ihre Steigung ist 0."
      : `Die Steigung ist ${Math.abs(dy) > Math.abs(dx) ? "betragsmäßig größer als 1 — die Gerade ist steil" : Math.abs(dy) === Math.abs(dx) ? "genau ±1 — die Gerade steht unter 45°" : "betragsmäßig kleiner als 1 — die Gerade ist flach"}.`;
}

function initSteigung() {
  ["st-x1", "st-y1", "st-x2", "st-y2"].forEach((id) => document.getElementById(id).addEventListener("input", renderSteigung));
  renderSteigung();
}

// ================= 4. Die Funktionsgleichung aufstellen =================

// Die Aufgaben sind so gewählt, dass m und b ganzzahlig bleiben: Nur dann
// führt der Rechenweg nicht vom Thema weg.
const AF_AUFGABEN = [
  { m: 2, b: -3, p: [-1, -5], q: [3, 3] },
  { m: -1, b: 4, p: [-2, 6], q: [5, -1] },
  { m: 3, b: 1, p: [-1, -2], q: [2, 7] },
  { m: -2, b: -2, p: [-3, 4], q: [1, -4] },
];
const AF_WEGE = [
  { key: "zwei", knopf: "aus zwei Punkten" },
  { key: "punkt", knopf: "aus Punkt und Steigung" },
];
let afWeg = 0;

function afBild(a, weg) {
  const B = 470, H = 300;
  const svg = neueFlaeche(B, H);
  const xMin = -7, xMax = 7, yMin = -8, yMax = 8;
  const g = koordinaten(svg, { links: 46, oben: 26, breite: 386, hoehe: 242, xMin, xMax, yMin, yMax, xSchritt: 1, ySchritt: 2 });

  geradeZeichnen(svg, g, a.m, a.b, xMin, xMax, yMin, yMax, "g");
  // P und der y-Achsenabschnitt liegen oft dicht beieinander. Der tiefere der
  // beiden Punkte wird deshalb unterhalb beschriftet, der höhere oberhalb.
  const pUnten = a.p[1] < a.b;
  punktZeichnen(svg, g, a.p[0], a.p[1], "g", `P(${num(a.p[0])} | ${num(a.p[1])})`, a.p[0] <= 2, !pUnten);
  if (weg === "zwei") {
    punktZeichnen(svg, g, a.q[0], a.q[1], "h", `Q(${num(a.q[0])} | ${num(a.q[1])})`, a.q[0] <= 2, a.q[1] >= a.b);
  }
  punktZeichnen(svg, g, 0, a.b, "achse", `(0 | ${num(a.b)})`, false, pUnten);

  svg.appendChild(svgText(B / 2, 16, weg === "zwei"
    ? "gegeben: zwei Punkte — gesucht: die Gerade durch beide"
    : `gegeben: ein Punkt und die Steigung m = ${num(a.m)}`, { class: "lf-achsenname" }));
  svg.appendChild(svgText(B / 2, H - 6, "Violett: der y-Achsenabschnitt, den die Rechnung liefert.", { class: "lf-achsentext" }));
  return svg;
}

function renderAufstellen() {
  const nr = begrenzt("af-nr", Number(document.getElementById("af-nr").value), 0, AF_AUFGABEN.length - 1);
  const a = AF_AUFGABEN[nr];
  const weg = AF_WEGE[afWeg].key;
  document.getElementById("af-nr-anzeige").textContent = `Aufgabe ${num(nr + 1)}`;

  const schalter = document.getElementById("af-schalter");
  schalter.innerHTML = "";
  AF_WEGE.forEach((w, i) => {
    const btn = el("button", { type: "button", class: i === afWeg ? "aktiv" : "" }, w.knopf);
    btn.addEventListener("click", () => { afWeg = i; renderAufstellen(); });
    schalter.appendChild(btn);
  });

  document.getElementById("af-aufgabe").innerHTML = weg === "zwei"
    ? `<strong>Aufgabe:</strong> Bestimme die Gleichung der Geraden durch <strong>P(${num(a.p[0])} | ${num(a.p[1])})</strong> ` +
      `und <strong>Q(${num(a.q[0])} | ${num(a.q[1])})</strong>.`
    : `<strong>Aufgabe:</strong> Eine Gerade hat die Steigung <strong>m = ${num(a.m)}</strong> und geht durch ` +
      `<strong>P(${num(a.p[0])} | ${num(a.p[1])})</strong>. Wie lautet ihre Gleichung?`;

  const mount = document.getElementById("af-mount");
  mount.innerHTML = "";
  mount.appendChild(afBild(a, weg));

  const zeilen = [];
  if (weg === "zwei") {
    zeilen.push(schrittZeile(`m = <span class="nw">(${num(a.q[1])} − ${klammer(a.p[1])}) : (${num(a.q[0])} − ${klammer(a.p[0])})</span> = <span class="mv">${num(a.m)}</span>`,
      "1. Steigung", "", "Steigungsformel mit beiden Punkten"));
  } else {
    zeilen.push(schrittZeile(`m = <span class="mv">${num(a.m)}</span>`, "1. Steigung", "", "sie ist gegeben"));
  }
  zeilen.push(schrittZeile(`y = <span class="mv">${num(a.m)}</span>x + b`, "2. Ansatz", "", "die allgemeine Form mit bekanntem m"));
  zeilen.push(schrittZeile(`${num(a.p[1])} = ${faktor(`${num(a.m)} · (${num(a.p[0])})`)} + b`, "3. Punkt einsetzen", "",
    `P(${num(a.p[0])} | ${num(a.p[1])}) muss die Gleichung erfüllen`));
  zeilen.push(schrittZeile(`${num(a.p[1])} = ${num(a.m * a.p[0])} + b`, "ausrechnen", "", ""));
  zeilen.push(schrittZeile(`b = <span class="bv">${num(a.b)}</span>`,
    `| ${a.m * a.p[0] >= 0 ? "−" : "+"} ${num(Math.abs(a.m * a.p[0]))}`, "fertig", "nach b auflösen"));
  document.getElementById("af-schritte").innerHTML = zeilen.join("");

  document.getElementById("af-gleichung").innerHTML = `f(x) = ${geradeHtml(a.m, a.b)}`;

  const probeP = a.m * a.p[0] + a.b, probeQ = a.m * a.q[0] + a.b;
  document.getElementById("af-bilanz").innerHTML =
    `<strong>Probe mit P:</strong> ${faktor(`${num(a.m)} · (${num(a.p[0])})`)}${anhang(a.b)} = ` +
    `<span class="wg">${num(probeP)}</span> = ${num(a.p[1])} ✓<br>` +
    (weg === "zwei"
      ? `<strong>Probe mit Q:</strong> ${faktor(`${num(a.m)} · (${num(a.q[0])})`)}${anhang(a.b)} = ` +
        `<span class="wh">${num(probeQ)}</span> = ${num(a.q[1])} ✓<br>`
      : `<strong>Zweiter Punkt zur Kontrolle:</strong> f(${num(a.q[0])}) = ${num(probeQ)}, also liegt auch ` +
        `Q(${num(a.q[0])} | ${num(a.q[1])}) auf der Geraden ✓<br>`) +
    `<strong>Ablesen am Bild:</strong> Die Gerade schneidet die y-Achse bei <span class="wb">${num(a.b)}</span> — ` +
    `genau der Wert, den die Rechnung liefert. Ihre Steigung ist <span class="wm">${num(a.m)}</span>: ` +
    `ein Schritt nach rechts, ${a.m > 0 ? num(a.m) + " nach oben" : num(-a.m) + " nach unten"}.` +
    (weg === "zwei" ? `<br><strong>Warum m zuerst?</strong> Ohne m enthielte der Ansatz zwei Unbekannte. Mit m bleibt nur noch b übrig — eine einzige lineare Gleichung.` : "");
}

function initAufstellen() {
  document.getElementById("af-nr").addEventListener("input", renderAufstellen);
  renderAufstellen();
}

// ================= 5. Nullstelle und Schnittpunkt =================

function snBild(m1, b1, m2, b2) {
  const B = 470, H = 320;
  const svg = neueFlaeche(B, H);
  const xMin = -7, xMax = 7, yMin = -9, yMax = 9;
  const g = koordinaten(svg, { links: 46, oben: 26, breite: 386, hoehe: 262, xMin, xMax, yMin, yMax, xSchritt: 1, ySchritt: 2 });

  const parallel = m1 === m2;
  const identisch = parallel && b1 === b2;
  geradeZeichnen(svg, g, m1, b1, xMin, xMax, yMin, yMax, "g");
  geradeZeichnen(svg, g, m2, b2, xMin, xMax, yMin, yMax, "h" + (identisch ? " blass" : ""));

  if (m1 !== 0) {
    const n1 = -b1 / m1;
    if (n1 >= xMin && n1 <= xMax) punktZeichnen(svg, g, n1, 0, "null", `x₀ = ${num(n1, 2)}`, n1 <= 1, false);
  }
  if (!parallel) {
    const xs = (b2 - b1) / (m1 - m2), ys = m1 * xs + b1;
    if (xs >= xMin && xs <= xMax && ys >= yMin && ys <= yMax) {
      svg.appendChild(svgEl("line", { x1: g.px(xs).toFixed(2), y1: g.py(ys).toFixed(2), x2: g.px(xs).toFixed(2), y2: g.py(0).toFixed(2), class: "lf-lot" }));
      punktZeichnen(svg, g, xs, ys, "null", `S(${num(xs, 2)} | ${num(ys, 2)})`, xs <= 2, true);
    }
  }

  svg.appendChild(svgText(B / 2, 16, identisch ? "dieselbe Gerade zweimal — unendlich viele gemeinsame Punkte"
    : parallel ? "gleiche Steigung, verschiedene Höhe — parallel, kein Schnittpunkt"
      : "verschiedene Steigungen — genau ein Schnittpunkt", { class: "lf-achsenname" }));
  svg.appendChild(svgText(B / 2, H - 6, "grün: g · blau: h", { class: "lf-achsentext" }));
  return svg;
}

function renderSchnitt() {
  const m1 = begrenzt("sn-m1", Number(document.getElementById("sn-m1").value), -4, 4);
  const b1 = begrenzt("sn-b1", Number(document.getElementById("sn-b1").value), -6, 6);
  const m2 = begrenzt("sn-m2", Number(document.getElementById("sn-m2").value), -4, 4);
  const b2 = begrenzt("sn-b2", Number(document.getElementById("sn-b2").value), -6, 6);
  document.getElementById("sn-m1-anzeige").textContent = num(m1);
  document.getElementById("sn-b1-anzeige").textContent = num(b1);
  document.getElementById("sn-m2-anzeige").textContent = num(m2);
  document.getElementById("sn-b2-anzeige").textContent = num(b2);

  document.getElementById("sn-gleichung").innerHTML =
    `<span class="gv">g(x) = ${geradeHtml(m1, b1, "gv", "gv")}</span> &nbsp;&nbsp;·&nbsp;&nbsp; ` +
    `<span class="hv">h(x) = ${geradeHtml(m2, b2, "hv", "hv")}</span>`;

  const mount = document.getElementById("sn-mount");
  mount.innerHTML = "";
  mount.appendChild(snBild(m1, b1, m2, b2));

  const parallel = m1 === m2, identisch = parallel && b1 === b2;
  const zeilen = [schrittZeile(`${geradeHtml(m1, b1, "gv", "gv")} = ${geradeHtml(m2, b2, "hv", "hv")}`, "g(x) = h(x)", "", "Ansatz: Wo sind beide Werte gleich?")];
  if (!parallel) {
    // Bei negativem m₂ heißt die Umformung "+ x", nicht "− −1x".
    const opX = `| ${m2 >= 0 ? "−" : "+"} ${Math.abs(m2) === 1 ? "" : num(Math.abs(m2))}x`;
    zeilen.push(schrittZeile(`${geradeHtml(m1 - m2, b1, "mv", "gv")} = <span class="hv">${num(b2)}</span>`, opX, "", "x-Terme nach links"));
    zeilen.push(schrittZeile(`${faktor(steigungsTeil(m1 - m2, "mv") || "0")} = <span class="hv">${num(b2 - b1)}</span>`,
      `| ${b1 >= 0 ? "−" : "+"} ${num(Math.abs(b1))}`, "", "Zahlen nach rechts"));
    const xs = (b2 - b1) / (m1 - m2);
    zeilen.push(schrittZeile(`x = <span class="bv">${num(xs, 4)}</span>`, `| : ${num(m1 - m2)}`, "fertig", "die x-Koordinate des Schnittpunkts"));
  } else {
    zeilen.push(schrittZeile(`<span class="gv">${num(b1)}</span> = <span class="hv">${num(b2)}</span>`,
      `| ${m1 >= 0 ? "−" : "+"} ${Math.abs(m1) === 1 ? "" : num(Math.abs(m1))}x`, identisch ? "fertig" : "",
      identisch ? "eine wahre Aussage — die Geraden liegen aufeinander" : "eine falsche Aussage — die Geraden sind parallel"));
  }
  document.getElementById("sn-schritte").innerHTML = zeilen.join("");

  const n1 = m1 === 0 ? null : -b1 / m1;
  const xs = parallel ? null : (b2 - b1) / (m1 - m2);
  const ys = xs === null ? null : m1 * xs + b1;

  const karten = document.getElementById("sn-karten");
  karten.innerHTML = "";
  karten.appendChild(karte("g", "Nullstelle von g", n1 === null ? (b1 === 0 ? "jede Stelle" : "keine") : num(n1, 4)));
  karten.appendChild(karte("h", "Nullstelle von h", m2 === 0 ? (b2 === 0 ? "jede Stelle" : "keine") : num(-b2 / m2, 4)));
  karten.appendChild(karte("null", "Schnittstelle x", identisch ? "jede Stelle" : parallel ? "keine" : num(xs, 4)));
  karten.appendChild(karte("b", "Schnittpunkt S", identisch ? "alle Punkte" : parallel ? "keiner" : `(${num(xs, 2)} | ${num(ys, 2)})`));

  document.getElementById("sn-bilanz").innerHTML =
    `<strong>Nullstelle von g:</strong> ` +
    (m1 === 0
      ? (b1 === 0 ? `g ist die x-Achse selbst — jede Stelle ist Nullstelle.` : `g verläuft waagerecht auf der Höhe ${num(b1)} und trifft die x-Achse nie.`)
      : `${faktor(`${num(m1)}x${anhang(b1)} = 0`)} → x₀ = ${faktor(`${num(-b1)} : ${num(m1)}`)} = <span class="wn">${num(n1, 4)}</span>`) +
    `<br><strong>Schnittpunkt:</strong> ` +
    (identisch
      ? `Beide Funktionen sind identisch — jeder Punkt der Geraden ist gemeinsam. Die Gleichung liefert ${num(b1)} = ${num(b1)}, eine wahre Aussage.`
      : parallel
        ? `Beide Steigungen sind <span class="wm">${num(m1)}</span>, die Achsenabschnitte aber verschieden. Die Gleichung liefert ` +
          `${num(b1)} = ${num(b2)} — falsch, es gibt keinen Schnittpunkt. Die Geraden haben überall den senkrechten Abstand ${num(Math.abs(b1 - b2))}.`
        : `x = ${faktor(`(${num(b2)} − ${klammer(b1)}) : (${num(m1)} − ${klammer(m2)})`)} = <span class="wn">${num(xs, 4)}</span>, ` +
          `eingesetzt in g: y = ${faktor(`${num(m1)} · ${num(xs, 4)}`)}${anhang(b1)} = <span class="wn">${num(ys, 4)}</span>. ` +
          `<strong>Probe in h:</strong> ${faktor(`${num(m2)} · ${num(xs, 4)}`)}${anhang(b2)} = ${num(m2 * xs + b2, 4)} ✓`);

  document.getElementById("sn-text").textContent = identisch
    ? "Gleiche Steigung und gleicher Achsenabschnitt: Es ist zweimal dieselbe Gerade."
    : parallel
      ? "Gleiche Steigung, verschiedene Achsenabschnitte — die Geraden laufen nebeneinanderher und treffen sich nie."
      : "Der Schnittpunkt ist die Lösung einer linearen Gleichung. Das Lot fällt auf die Schnittstelle x auf der x-Achse.";
}

function initSchnitt() {
  ["sn-m1", "sn-b1", "sn-m2", "sn-b2"].forEach((id) => document.getElementById(id).addEventListener("input", renderSchnitt));
  renderSchnitt();
}

// ================= 8. Gestaffelte Übungsaufgaben =================

// Die Werkbank für die Übungsaufgaben ist für alle Grundwissen-Seiten dieselbe und steht in
// ../../aufgaben.js. Mitgegeben wird nur, wie DIESE Seite eine Eingabe als Zahl liest.
const mountUebungsaufgaben = (container, defs) =>
  mountUebungsaufgabenBasis(container, defs, { parse: parseFlexibleNumber });

// ---------- Aufgaben-Definitionen ----------

// Konstruktiv statt verwerfend: Erst wird die Kandidatenliste gefiltert, dann
// gezogen. Die Werteliste muss genau die Zahlen enthalten, auf die die
// Hinweise anspringen — sonst kann ein Hinweis auf einer fremden Zahl liegen.
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

// Aufgabe 1 — Funktionswert berechnen.
function generateAufgabe1() {
  const kandidaten = [];
  for (let m = -6; m <= 6; m++) {
    if (m === 0) continue;
    for (let b = -9; b <= 9; b++) {
      if (b === 0) continue;
      for (let x = -6; x <= 7; x++) {
        if (x === 0 || x === 1) continue;
        kandidaten.push({ m, b, x, wert: m * x + b });
      }
    }
  }
  const k = ohneKollision(
    kandidaten,
    (v) => [
      v.wert,               // richtig
      v.m * v.x - v.b,      // Vorzeichen von b verdreht
      v.m + v.b,            // m und b addiert, x ignoriert
      v.m * (v.x + v.b),    // erst addiert, dann multipliziert
      v.m, v.b, v.x,
    ],
    kandidaten[0]
  );
  const { m, b, x, wert } = k;

  return {
    promptHtml: `Gegeben ist die lineare Funktion<br>` +
      `<span style="font-family:Cambria Math,Cambria,serif;font-size:1.3rem">f(x) = ${num(m)}x ${b > 0 ? "+" : "−"} ${num(Math.abs(b))}</span><br>` +
      `<strong>Berechne f(${num(x)}).</strong>`,
    correct: wert,
    tolerance: 0.001,
    placeholder: "f(" + num(x) + ") =",
    hinweis: (raw, val) => {
      if (Math.abs(val - (m * x - b)) < 0.001)
        return `Das Vorzeichen von ${num(b)} stimmt nicht: In der Gleichung steht ${b > 0 ? "+" : "−"} ${num(Math.abs(b))}, das wird ${b > 0 ? "addiert" : "subtrahiert"}.`;
      if (Math.abs(val - m * (x + b)) < 0.001)
        return `Punkt vor Strich: Erst wird ${faktor(`${num(m)} · (${num(x)})`)} gerechnet, dann ${b > 0 ? "+" : "−"} ${num(Math.abs(b))} — nicht umgekehrt.`;
      if (Math.abs(val - (m + b)) < 0.001)
        return `${num(m + b)} wäre f(1). Gefragt ist der Wert an der Stelle x = ${num(x)}.`;
      return `Setze ${num(x)} für x ein — in Klammern: f(${num(x)}) = ${faktor(`${num(m)} · (${num(x)})`)} ${b > 0 ? "+" : "−"} ${num(Math.abs(b))}.`;
    },
    tipps: [
      "f(x) zu berechnen heißt: die Zahl für x einsetzen und ausrechnen.",
      `Setze die Zahl in Klammern ein — sonst geht bei einem negativen x das Vorzeichen verloren.`,
      `Erst multiplizieren, dann ${b > 0 ? "addieren" : "subtrahieren"}.`,
    ],
    musterloesungHtml:
      `<strong>Einsetzen:</strong> f(${num(x)}) = ${faktor(`${num(m)} · (${num(x)})`)} ${b > 0 ? "+" : "−"} ${num(Math.abs(b))}<br>` +
      `<strong>Punkt vor Strich:</strong> ${faktor(`${num(m)} · (${num(x)})`)} = ${num(m * x)}<br>` +
      `<strong>Ergebnis:</strong> ${num(m * x)} ${b > 0 ? "+" : "−"} ${num(Math.abs(b))} = <strong>${num(wert)}</strong><br>` +
      `<em>Am Graphen:</em> Der Punkt (${num(x)} | ${num(wert)}) liegt auf der Geraden.`,
  };
}

// Aufgabe 2 — Steigung aus zwei Punkten. Ganzzahlig, damit der Rechenweg
// nicht im Bruchrechnen versandet.
function generateAufgabe2() {
  const kandidaten = [];
  for (let m = -5; m <= 5; m++) {
    if (m === 0) continue;
    for (let x1 = -6; x1 <= 4; x1++) {
      for (let dx = 1; dx <= 6; dx++) {
        const x2 = x1 + dx;
        if (x2 > 6) continue;
        for (let y1 = -7; y1 <= 7; y1++) {
          const y2 = y1 + m * dx;
          if (Math.abs(y2) > 9) continue;
          kandidaten.push({ x1, y1, x2, y2, m, dx, dy: m * dx });
        }
      }
    }
  }
  const k = ohneKollision(
    kandidaten,
    (v) => [
      v.m,                            // richtig
      v.dx / v.dy,                    // Bruch umgekehrt
      v.dy,                           // nur Δy genommen
      v.dx,                           // nur Δx genommen
      (v.y1 - v.y2) / (v.x2 - v.x1),  // nur ein Vorzeichen gedreht
      v.y2 - v.y1 + v.x2 - v.x1,      // addiert statt geteilt
    ],
    kandidaten[0]
  );
  const { x1, y1, x2, y2, m, dx, dy } = k;

  return {
    promptHtml: `Eine Gerade geht durch die Punkte<br>` +
      `<span style="font-family:Cambria Math,Cambria,serif;font-size:1.3rem">P(${num(x1)} | ${num(y1)}) und Q(${num(x2)} | ${num(y2)})</span><br>` +
      `<strong>Wie groß ist ihre Steigung m?</strong>`,
    correct: m,
    tolerance: 0.001,
    placeholder: "m =",
    hinweis: (raw, val) => {
      if (Math.abs(val - dx / dy) < 0.001)
        return `Der Bruch steht auf dem Kopf: In der Formel ist <strong>Δy oben</strong> und Δx unten — Höhe je Schritt nach rechts, also ${faktor(`${num(dy)} : ${num(dx)}`)}.`;
      if (Math.abs(val - dy) < 0.001)
        return `${num(dy)} ist Δy, der Höhenunterschied. Zur Steigung fehlt noch die Division durch Δx = ${num(dx)}.`;
      if (Math.abs(val - dx) < 0.001)
        return `${num(dx)} ist Δx, der waagerechte Abstand. Die Steigung ist Δy : Δx.`;
      if (Math.abs(val - (y1 - y2) / (x2 - x1)) < 0.001)
        return `Die Reihenfolge muss <em>in beiden</em> Differenzen dieselbe sein: entweder ${faktor("(y₂ − y₁) : (x₂ − x₁)")} oder ${faktor("(y₁ − y₂) : (x₁ − x₂)")} — nicht gemischt.`;
      return `Bilde Δy = ${num(y2)} − ${num(y1)} und Δx = ${num(x2)} − ${num(x1)} und teile dann Δy durch Δx.`;
    },
    tipps: [
      "Die Steigung sagt, um wie viel y steigt, wenn x um 1 wächst.",
      "Aus zwei Punkten bekommt man sie als Δy : Δx — der Unterschied der y-Werte, geteilt durch den der x-Werte.",
      "Wichtig ist die Reihenfolge: In Zähler und Nenner muss derselbe Punkt zuerst stehen.",
    ],
    musterloesungHtml:
      `<strong>Steigungsformel:</strong> m = ${faktor("(y₂ − y₁) : (x₂ − x₁)")}<br>` +
      `<strong>Einsetzen:</strong> m = ${faktor(`(${num(y2)} − ${klammer(y1)}) : (${num(x2)} − ${klammer(x1)})`)} = ${faktor(`${klammer(dy)} : ${klammer(dx)}`)} = <strong>${num(m)}</strong><br>` +
      `<em>Am Steigungsdreieck:</em> ${num(dx)} nach rechts, ${dy >= 0 ? num(dy) + " nach oben" : num(-dy) + " nach unten"}.<br>` +
      `<em>Andere Reihenfolge, gleiches Ergebnis:</em> ${faktor(`(${num(y1)} − ${klammer(y2)}) : (${num(x1)} − ${klammer(x2)})`)} = ${faktor(`${klammer(-dy)} : ${klammer(-dx)}`)} = ${num(m)}.`,
  };
}

// Aufgabe 3 — Funktionsgleichung aus zwei Punkten, dann an einer dritten
// Stelle auswerten. So ist die Antwort eine einzelne Zahl.
function generateAufgabe3() {
  const kandidaten = [];
  for (let m = -4; m <= 4; m++) {
    if (m === 0) continue;
    for (let b = -8; b <= 8; b++) {
      for (let x1 = -5; x1 <= 3; x1++) {
        for (let dx = 1; dx <= 5; dx++) {
          const x2 = x1 + dx;
          if (x2 > 5) continue;
          const y1 = m * x1 + b, y2 = m * x2 + b;
          if (Math.abs(y1) > 12 || Math.abs(y2) > 12) continue;
          for (const x3 of [6, 7, 8, 10]) {
            const wert = m * x3 + b;
            if (Math.abs(wert) > 60) continue;
            kandidaten.push({ m, b, x1, y1, x2, y2, x3, wert });
          }
        }
      }
    }
  }
  const k = ohneKollision(
    kandidaten,
    (v) => [
      v.wert,                 // richtig
      v.m * v.x3,             // b vergessen
      v.m + v.b,              // f(1) statt f(x3)
      v.b,                    // nur der Achsenabschnitt
      v.m,                    // nur die Steigung
      -v.m * v.x3 + v.b,      // Vorzeichen der Steigung verdreht
    ],
    kandidaten[0]
  );
  const { m, b, x1, y1, x2, y2, x3, wert } = k;
  const dx = x2 - x1, dy = y2 - y1;

  return {
    promptHtml: `Eine Gerade geht durch <strong>P(${num(x1)} | ${num(y1)})</strong> und <strong>Q(${num(x2)} | ${num(y2)})</strong>.<br>` +
      `<strong>Berechne f(${num(x3)}).</strong>`,
    correct: wert,
    tolerance: 0.001,
    placeholder: "f(" + num(x3) + ") =",
    hinweis: (raw, val) => {
      if (Math.abs(val - m * x3) < 0.001)
        return `Du hast nur mit der Steigung gerechnet. Zur Geraden gehört auch der y-Achsenabschnitt b = ${num(b)}.`;
      if (Math.abs(val - b) < 0.001)
        return `${num(b)} ist der y-Achsenabschnitt, also f(0). Gefragt ist f(${num(x3)}).`;
      if (Math.abs(val - m) < 0.001)
        return `${num(m)} ist die Steigung. Sie ist der erste Schritt, aber noch nicht die Antwort.`;
      if (Math.abs(val - (-m * x3 + b)) < 0.001)
        return `Das Vorzeichen der Steigung stimmt nicht: Von P nach Q geht es ${dy > 0 ? "hinauf" : "hinunter"}, also ist m = ${num(m)}.`;
      return `Drei Schritte: erst m mit der Steigungsformel, dann b durch Einsetzen eines Punktes, dann f(${num(x3)}) berechnen.`;
    },
    tipps: [
      "Eine Gerade ist durch zwei Punkte eindeutig festgelegt — m und b lassen sich daraus beide bestimmen.",
      "Zuerst die Steigung: Δy : Δx.",
      `Dann einen der beiden Punkte in y = m · x + b einsetzen und nach b auflösen. Erst danach f(${num(x3)}) berechnen.`,
    ],
    musterloesungHtml:
      `<strong>1. Steigung:</strong> m = ${faktor(`(${num(y2)} − ${klammer(y1)}) : (${num(x2)} − ${klammer(x1)})`)} = ` +
      `${faktor(`${klammer(dy)} : ${klammer(dx)}`)} = <strong>${num(m)}</strong><br>` +
      `<strong>2. Ansatz:</strong> y = ${num(m)}x + b, dann P einsetzen:<br>` +
      `&nbsp;&nbsp;&nbsp;&nbsp;${num(y1)} = ${faktor(`${num(m)} · (${num(x1)})`)} + b = ${num(m * x1)} + b, also b = <strong>${num(b)}</strong><br>` +
      `<strong>3. Funktionsgleichung:</strong> f(x) = ${num(m)}x${anhang(b)}<br>` +
      `<strong>4. Einsetzen:</strong> f(${num(x3)}) = ${faktor(`${num(m)} · ${num(x3)}`)}${anhang(b)} = <strong>${num(wert)}</strong><br>` +
      `<em>Probe:</em> f(${num(x2)}) = ${faktor(`${num(m)} · (${num(x2)})`)}${anhang(b)} = ${num(y2)} ✓ — auch Q liegt auf der Geraden.`,
  };
}

// Die Umformungen, mit denen beide Seiten sortiert werden. Abgezogen wird jeweils der Term
// selbst — steht dort eine negative Zahl, heißt das ADDIEREN. „| − −3x“ wäre keine
// Schreibweise, und „| − 0“ keine Umformung; beides entfällt.
function sortierSchritt(m2, b1) {
  const teile = [];
  if (m2 !== 0) teile.push(`| ${m2 > 0 ? "−" : "+"} ${num(Math.abs(m2))}x`);
  if (b1 !== 0) teile.push(`| ${b1 > 0 ? "−" : "+"} ${num(Math.abs(b1))}`);
  return teile.length ? teile.join(" und ") : "nichts zu tun — die Gleichung steht schon sortiert";
}

// Aufgabe 4 — Schnittpunkt zweier Geraden, gesucht ist die y-Koordinate.
// Damit ist der zweite Schritt (Einsetzen) Teil der Aufgabe und nicht nur
// das Lösen der Gleichung.
function generateAufgabe4() {
  const kandidaten = [];
  for (let m1 = -5; m1 <= 5; m1++) {
    for (let m2 = -5; m2 <= 5; m2++) {
      if (m1 === m2) continue;
      for (let xs = -6; xs <= 6; xs++) {
        if (xs === 0) continue;
        for (let b1 = -9; b1 <= 9; b1++) {
          const ys = m1 * xs + b1;
          const b2 = ys - m2 * xs;
          if (Math.abs(b2) > 9 || Math.abs(ys) > 30 || b1 === b2) continue;
          kandidaten.push({ m1, b1, m2, b2, xs, ys });
        }
      }
    }
  }
  const k = ohneKollision(
    kandidaten,
    (v) => [
      v.ys,                            // richtig
      v.xs,                            // die x-Koordinate statt der y-Koordinate
      (v.b2 - v.b1) / (v.m1 + v.m2),   // Steigungen addiert statt subtrahiert
      (v.b1 + v.b2) / (v.m1 - v.m2),   // Achsenabschnitte addiert statt subtrahiert
      v.b1, v.b2, v.m1, v.m2,
    ],
    kandidaten[0]
  );
  const { m1, b1, m2, b2, xs, ys } = k;

  return {
    promptHtml: `Zwei Geraden sind gegeben:<br>` +
      `<span style="font-family:Cambria Math,Cambria,serif;font-size:1.3rem">` +
      `g(x) = ${geradeText(m1, b1)} &nbsp;und&nbsp; ` +
      `h(x) = ${geradeText(m2, b2)}</span><br>` +
      `<strong>Sie schneiden sich in einem Punkt S. Wie groß ist die y-Koordinate von S?</strong>`,
    correct: ys,
    tolerance: 0.001,
    placeholder: "y-Koordinate",
    hinweis: (raw, val) => {
      if (Math.abs(val - xs) < 0.001)
        return `${num(xs)} ist die <em>x</em>-Koordinate des Schnittpunkts. Setze sie noch in eine der beiden Funktionen ein, um y zu bekommen.`;
      if (Math.abs(val - (b2 - b1) / (m1 + m2)) < 0.001)
        return `Beim Sortieren werden die x-Terme <em>subtrahiert</em>: ${faktor(`${num(m1)} − ${num(m2)} = ${num(m1 - m2)}`)}, nicht addiert.`;
      if (Math.abs(val - (b1 + b2) / (m1 - m2)) < 0.001)
        return `Auch die Zahlen werden subtrahiert: ${faktor(`${num(b2)} − ${num(b1)} = ${num(b2 - b1)}`)}.`;
      if (Math.abs(val - b1) < 0.001 || Math.abs(val - b2) < 0.001)
        return `Das ist ein y-Achsenabschnitt, also der Wert an der Stelle 0. Der Schnittpunkt liegt aber bei x = ${num(xs)}.`;
      return `Setze g(x) = h(x), löse nach x auf und setze das Ergebnis in eine der beiden Funktionen ein.`;
    },
    tipps: [
      "Im Schnittpunkt haben beide Geraden denselben y-Wert — dort gilt also g(x) = h(x).",
      "Das ist eine gewöhnliche Gleichung mit x auf beiden Seiten.",
      "Die gefundene Stelle x in <em>eine</em> der beiden Funktionen einsetzen ergibt den y-Wert; die andere liefert zur Probe denselben.",
    ],
    musterloesungHtml:
      `<strong>1. Gleichsetzen:</strong> ${num(m1)}x${anhang(b1)} = ${num(m2)}x${anhang(b2)}<br>` +
      `<strong>2. Sortieren:</strong> ${sortierSchritt(m2, b1)} →&nbsp; ` +
      `${faktor(`${num(m1 - m2)}x = ${num(b2 - b1)}`)}<br>` +
      `<strong>3. Teilen:</strong> | : ${num(m1 - m2)} →&nbsp; x = <strong>${num(xs)}</strong><br>` +
      `<strong>4. y berechnen:</strong> g(${num(xs)}) = ${faktor(`${num(m1)} · (${num(xs)})`)}${anhang(b1)} = <strong>${num(ys)}</strong><br>` +
      `<em>Probe in h:</em> h(${num(xs)}) = ${faktor(`${num(m2)} · (${num(xs)})`)}${anhang(b2)} = ${num(m2 * xs + b2)} ✓ — beide Funktionen liefern denselben Wert.<br>` +
      `<em>Der Schnittpunkt ist also</em> S(${num(xs)} | ${num(ys)}).`,
  };
}

function randInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}
// Vorzeichen und Betrag getrennt — „+ −3“ soll nicht vorkommen.
function mitVz(z) {
  return `${z >= 0 ? "+" : "−"} ${num(Math.abs(z))}`;
}
function geradeText(m, b) {
  const vorn = m === 1 ? "x" : m === -1 ? "−x" : `${num(m)}x`;
  return b === 0 ? vorn : `${vorn} ${mitVz(b)}`;
}
// Koordinaten mit typografischem Minus.
function koord(v) {
  return v < 0 ? `−${num(-v)}` : num(v);
}

// Aufgabe 2 — ablesen und einsetzen. Steigung und y-Achsenabschnitt stehen in der Gleichung
// bereits da; die Punktprobe zeigt, wofür sie gut sind.
function generateAufgabe2b() {
  const m = pick([-5, -4, -3, -2, -1, 1, 2, 3, 4, 5]);
  const b = randInt(-9, 9) || 4;
  const p = randInt(-6, 6);
  const drauf = Math.random() < 0.5;
  const q = m * p + b + (drauf ? 0 : pick([-4, -3, -2, -1, 1, 2, 3, 4]));
  return {
    promptHtml:
      `Gegeben ist die Gerade<br><span style="font-family:Cambria Math,Cambria,serif;font-size:1.3rem">` +
      `g(x) = ${geradeText(m, b)}</span><br>` +
      `Außerdem der Punkt <strong>P(${koord(p)} | ${koord(q)})</strong>.<br>` +
      `<span class="progress-note">Antworte bei der letzten Frage mit 1 für „ja“ oder 2 für „nein“.</span>`,
    felder: [
      {
        name: "Steigung m", soll: m, toleranz: 0.0005,
        hinweis: (roh, val) => {
          if (Math.abs(val - b) < 0.0005) return "Das ist der <strong>y-Achsenabschnitt</strong> — die Zahl ohne x. Die Steigung steht <em>vor</em> dem x.";
          if (Math.abs(val + m) < 0.0005) return "Das Vorzeichen gehört zur Steigung dazu.";
          return "";
        },
      },
      {
        name: "y-Achsenabschnitt b", soll: b, toleranz: 0.0005,
        hinweis: (roh, val) => {
          if (Math.abs(val - m) < 0.0005) return "Das ist die <strong>Steigung</strong>. Der y-Achsenabschnitt ist die Zahl, die ohne x dasteht.";
          if (Math.abs(val + b) < 0.0005) return "Das Vorzeichen gehört zum y-Achsenabschnitt dazu.";
          return "";
        },
      },
      {
        name: `Liegt P auf g? (1 = ja, 2 = nein)`, soll: drauf ? 1 : 2, toleranz: 0.01,
        hinweis: (roh, val) =>
          Math.abs(val - (drauf ? 2 : 1)) < 0.01
            ? `Setze die x-Koordinate ein: g(${koord(p)}) = ${num(m)} · (${koord(p)}) ${mitVz(b)} = ${num(m * p + b)}. ` +
              (drauf ? `Das ist genau die y-Koordinate von P — also liegt P auf g.`
                     : `P hat aber die y-Koordinate ${koord(q)} — die Werte sind verschieden.`)
            : "",
      },
    ],
    tipps: [
      "In der Form y = m · x + b steht alles schon da: m vor dem x, b ohne x.",
      "Für die Punktprobe wird die x-Koordinate des Punktes in die Gleichung eingesetzt.",
      `Kommt dabei die y-Koordinate heraus, liegt der Punkt auf der Geraden — sonst nicht.`,
    ],
    musterloesungHtml:
      `① m = <strong>${num(m)}</strong> (die Zahl vor dem x)<br>` +
      `② b = <strong>${num(b)}</strong> (die Zahl ohne x)<br>` +
      `③ Punktprobe: g(${koord(p)}) = ${num(m)} · (${koord(p)}) ${mitVz(b)} = <strong>${num(m * p + b)}</strong><br>` +
      `<span class="du-urteil ${drauf ? "ja" : "nein"}">${drauf
        ? `Das stimmt mit der y-Koordinate ${koord(q)} überein — P liegt auf g (1).`
        : `${num(m * p + b)} ≠ ${koord(q)} — P liegt nicht auf g (2).`}</span><br>` +
      `<span class="progress-note">Die Punktprobe braucht keine Zeichnung: Ein Punkt liegt genau dann auf der Geraden, wenn seine Koordinaten die Gleichung erfüllen. ` +
      `Damit lässt sich auch bei großen Zahlen entscheiden, wo eine Zeichnung längst ungenau wäre.</span>`,
  };
}

// Aufgabe 4 — die Wertetabelle. Nicht jede Tabelle gehört zu einer Geraden; entscheidend ist,
// ob die Änderung überall gleich ist.
function generateAufgabe4b() {
  const m = pick([-4, -3, -2, -1, 1, 2, 3, 4, 5]);
  const b = randInt(-8, 8);
  const schritt = pick([1, 2, 3]);
  const x0 = randInt(-3, 3);
  const xs = [0, 1, 2, 3].map((i) => x0 + i * schritt);
  const ys = xs.map((x) => m * x + b);
  const linear = Math.random() < 0.5;
  // Bei „nicht linear“ wird genau der letzte Wert verschoben — dann unterscheiden sich die
  // beiden Steigungen, die in den Feldern gefragt sind, wirklich.
  if (!linear) ys[3] += pick([-6, -4, -3, 3, 4, 6]);
  const m1 = (ys[1] - ys[0]) / (xs[1] - xs[0]);
  const m2 = (ys[3] - ys[2]) / (xs[3] - xs[2]);
  const tabelle =
    `<table class="lf-tabelle"><tr><th>x</th>${xs.map((x) => `<td>${koord(x)}</td>`).join("")}</tr>` +
    `<tr><th>y</th>${ys.map((y) => `<td>${koord(y)}</td>`).join("")}</tr></table>`;
  return {
    promptHtml:
      `Gehört diese Wertetabelle zu einer linearen Funktion?${tabelle}` +
      `<span class="progress-note">Vergleiche die Steigung zwischen den ersten beiden und zwischen den letzten beiden Punkten. ` +
      `Antworte zuletzt mit 1 für „ja“ oder 2 für „nein“.</span>`,
    felder: [
      {
        name: "Steigung zwischen dem 1. und dem 2. Punkt", soll: m1, toleranz: 0.0005,
        hinweis: (roh, val) => {
          if (Math.abs(val - (ys[1] - ys[0])) < 0.0005 && schritt !== 1) return `Der y-Unterschied allein ist noch nicht die Steigung — er muss durch den x-Unterschied ${num(schritt)} geteilt werden.`;
          if (Math.abs(val - (xs[1] - xs[0]) / (ys[1] - ys[0])) < 0.0005) return "Der Bruch steht verkehrt herum: Die Steigung ist <strong>Δy : Δx</strong>.";
          return "";
        },
      },
      {
        name: "Steigung zwischen dem 3. und dem 4. Punkt", soll: m2, toleranz: 0.0005,
        hinweis: (roh, val) => {
          if (Math.abs(val - m1) < 0.0005 && m1 !== m2) return "Rechne wirklich nach — die beiden Steigungen sind hier nicht gleich.";
          if (Math.abs(val - (ys[3] - ys[2])) < 0.0005 && schritt !== 1) return `Auch hier muss durch den x-Unterschied ${num(schritt)} geteilt werden.`;
          return "";
        },
      },
      {
        name: "Ist die Funktion linear? (1 = ja, 2 = nein)", soll: linear ? 1 : 2, toleranz: 0.01,
        hinweis: (roh, val) =>
          Math.abs(val - (linear ? 2 : 1)) < 0.01
            ? `Vergleiche die beiden Steigungen: ${num(m1)} und ${num(m2)}. ` +
              (linear ? "Sie sind gleich — die Punkte liegen auf einer Geraden."
                      : "Sie sind verschieden — dann liegen die Punkte nicht auf <em>einer</em> Geraden.")
            : "",
      },
    ],
    tipps: [
      "Linear heißt: Bei gleichen Schritten in x ändert sich y immer um denselben Betrag.",
      "Die Steigung zwischen zwei Punkten ist der Unterschied der y-Werte, geteilt durch den Unterschied der x-Werte.",
      "Stimmen alle diese Steigungen überein, liegen die Punkte auf einer Geraden.",
    ],
    musterloesungHtml:
      `① m₁ = (${koord(ys[1])} − ${koord(ys[0])}) : (${koord(xs[1])} − ${koord(xs[0])}) = ${num(ys[1] - ys[0])} : ${num(schritt)} = <strong>${num(m1)}</strong><br>` +
      `② m₂ = (${koord(ys[3])} − ${koord(ys[2])}) : (${koord(xs[3])} − ${koord(xs[2])}) = ${num(ys[3] - ys[2])} : ${num(schritt)} = <strong>${num(m2)}</strong><br>` +
      `<span class="du-urteil ${linear ? "ja" : "nein"}">${linear
        ? `Beide Steigungen sind ${num(m1)} — die Tabelle gehört zu einer linearen Funktion (1), nämlich zu y = ${geradeText(m, b)}.`
        : `${num(m1)} ≠ ${num(m2)} — die Tabelle gehört zu keiner linearen Funktion (2).`}</span><br>` +
      `<span class="progress-note">${linear
        ? "Zur Probe: Der y-Achsenabschnitt lässt sich aus einem beliebigen Wertepaar zurückrechnen, und er passt zu allen vier."
        : "Ein einziger Wert genügt, um die Geradheit zu zerstören — drei Punkte können auf einer Geraden liegen und der vierte trotzdem daneben."}</span>`,
  };
}

// Aufgabe 6 — die Parallele durch einen Punkt. Die Steigung wird übernommen, der
// y-Achsenabschnitt muss neu berechnet werden.
function generateAufgabe6() {
  const m = pick([-4, -3, -2, -1, 1, 2, 3, 4]);
  // b = 0 fällt heraus: „g(x) = 3x“ hätte gar keinen y-Achsenabschnitt zum Vergleichen.
  const b = randInt(-8, 8) || 5;
  const p = randInt(-5, 5);
  // Fiele der neue y-Achsenabschnitt mit dem alten zusammen, wäre die „Parallele“ die Gerade
  // selbst. Der Punkt wird dann um eine Einheit verschoben — kein Verwerfen und Neuziehen.
  let q = randInt(-9, 9);
  if (q - m * p === b) q += 1;
  const bNeu = q - m * p;
  const x0 = randInt(-5, 8);
  const c = m * x0 + bNeu;
  return {
    promptHtml:
      `Gegeben ist die Gerade<br><span style="font-family:Cambria Math,Cambria,serif;font-size:1.3rem">` +
      `g(x) = ${geradeText(m, b)}</span><br>` +
      `Gesucht ist die Gerade <strong>h</strong>, die <strong>parallel</strong> zu g verläuft und durch ` +
      `<strong>P(${koord(p)} | ${koord(q)})</strong> geht.<br>` +
      `<strong>Für welches x ist h(x) = ${koord(c)}?</strong>`,
    felder: [
      {
        name: "Steigung von h", soll: m, toleranz: 0.0005,
        hinweis: (roh, val) => {
          if (Math.abs(val + m) < 0.0005) return "Die <em>Gegen</em>steigung gehört zu einer senkrechten Geraden, nicht zu einer parallelen.";
          if (Math.abs(val - q / p) < 0.0005 && p !== 0) return "Die Steigung wird von g übernommen — der Punkt bestimmt nur, wie hoch die Gerade liegt.";
          return "";
        },
      },
      {
        name: "y-Achsenabschnitt von h", soll: bNeu, toleranz: 0.0005,
        hinweis: (roh, val) => {
          if (Math.abs(val - b) < 0.0005) return "Das ist der y-Achsenabschnitt von <strong>g</strong>. Parallele Geraden haben dieselbe Steigung, aber verschiedene Achsenabschnitte.";
          if (Math.abs(val - (q + m * p)) < 0.0005) return `Beim Umstellen dreht sich das Vorzeichen um: b = q − m · p = ${koord(q)} − ${num(m)} · (${koord(p)}).`;
          if (Math.abs(val - q) < 0.0005) return `${koord(q)} ist die y-Koordinate von P. Der y-Achsenabschnitt gehört zu x = 0.`;
          return "";
        },
      },
      {
        name: `x mit h(x) = ${koord(c)}`, soll: x0, toleranz: 0.0005,
        hinweis: (roh, val) => {
          if (Math.abs(val - (c - bNeu) * m) < 0.0005 && m !== 1) return `Aus ${num(m)}x = ${koord(c - bNeu)} folgt x durch <strong>Teilen</strong>, nicht durch Multiplizieren.`;
          if (Math.abs(val - (c + bNeu) / m) < 0.0005) return "Beim Hinüberbringen dreht sich das Vorzeichen um.";
          if (Math.abs(val - c) < 0.0005) return `${koord(c)} ist der Funktionswert. Gesucht ist die Stelle x, an der er auftritt.`;
          return "";
        },
      },
    ],
    tipps: [
      "Parallel heißt: <strong>gleiche Steigung</strong>. Die wird also einfach von g übernommen.",
      `Den y-Achsenabschnitt liefert der Punkt: Aus ${koord(q)} = ${num(m)} · (${koord(p)}) + b folgt b.`,
      `Mit der fertigen Gleichung h(x) = … lässt sich dann die Gleichung h(x) = ${koord(c)} nach x auflösen.`,
    ],
    musterloesungHtml:
      `① parallel ⇒ dieselbe Steigung: m = <strong>${num(m)}</strong><br>` +
      `② P einsetzen: ${koord(q)} = ${num(m)} · (${koord(p)}) + b = ${koord(m * p)} + b ⇒ b = ${koord(q)} − ${koord(m * p)} = <strong>${koord(bNeu)}</strong><br>` +
      `&nbsp;&nbsp;&nbsp;also h(x) = ${geradeText(m, bNeu)}<br>` +
      `③ ${geradeText(m, bNeu)} = ${koord(c)} &nbsp;|&nbsp; ${bNeu > 0 ? "−" : "+"} ${num(Math.abs(bNeu))}<br>` +
      `&nbsp;&nbsp;&nbsp;${num(m)}x = ${koord(c - bNeu)} &nbsp;|&nbsp; : ${num(m)} ⇒ <strong>x = ${koord(x0)}</strong><br>` +
      `<em>Probe:</em> h(${koord(x0)}) = ${num(m)} · (${koord(x0)}) ${mitVz(bNeu)} = ${koord(c)} ✓<br>` +
      `<span class="progress-note">g und h liegen um ${num(Math.abs(bNeu - b))} Einheiten auseinander — gemessen senkrecht zur y-Achse. ` +
      `Parallele Geraden schneiden sich nie; ihre Gleichungen unterscheiden sich nur im b.</span>`,
  };
}

// Aufgabe 8 — eine Gerade mit Bedeutung. Steigung, y-Achsenabschnitt und Nullstelle heißen hier
// Abnahme je Minute, Anfangswert und der Zeitpunkt, an dem nichts mehr da ist.
const A8_KONTEXTE = [
  { einleitung: "Die Höhe einer Kerze nimmt gleichmäßig ab.", pronomen: "sie", mehrzahl: "Höhen", einheit: "mm", je: "Minute", zeit: "Minuten", ende: "ist die Kerze heruntergebrannt" },
  { einleitung: "Der Füllstand eines Wassertanks nimmt gleichmäßig ab.", pronomen: "er", mehrzahl: "Füllstände", einheit: "Liter", je: "Minute", zeit: "Minuten", ende: "ist der Tank leer" },
  { einleitung: "Ein Guthaben nimmt gleichmäßig ab.", pronomen: "es", mehrzahl: "Guthaben", einheit: "€", je: "Tag", zeit: "Tagen", ende: "ist das Guthaben aufgebraucht" },
];

function generateAufgabe8() {
  const k = pick(A8_KONTEXTE);
  const a = pick([2, 3, 4, 5, 6]);          // Abnahme je Zeiteinheit
  const t0 = pick([20, 25, 30, 40, 45, 50, 60]);  // Nullstelle
  const b = a * t0;                          // Anfangswert
  // Zwei Messzeitpunkte, beide vor dem Ende und verschieden.
  const t1 = randInt(0, Math.floor(t0 / 2));
  const t2 = t1 + randInt(3, Math.max(4, t0 - t1 - 2));
  const h1 = b - a * t1, h2 = b - a * t2;
  return {
    promptHtml:
      `${k.einleitung} Nach <strong>${num(t1)} ${k.zeit}</strong> beträgt ${k.pronomen} ` +
      `<strong>${num(h1)} ${k.einheit}</strong>, nach <strong>${num(t2)} ${k.zeit}</strong> nur noch <strong>${num(h2)} ${k.einheit}</strong>.`,
    felder: [
      {
        name: `Änderung je ${k.je}`, soll: -a, einheit: k.einheit, toleranz: 0.0005,
        hinweis: (roh, val) => {
          if (Math.abs(val - a) < 0.0005) return "Der Wert nimmt <strong>ab</strong> — die Steigung ist deshalb negativ.";
          if (Math.abs(val - (h2 - h1)) < 0.0005 && t2 - t1 !== 1) return `Der Unterschied allein ist noch nicht die Änderung je ${k.je}; er muss durch die ${num(t2 - t1)} ${k.zeit} geteilt werden.`;
          return "";
        },
      },
      {
        name: "Anfangswert (zu Beginn)", soll: b, einheit: k.einheit, toleranz: 0.0005,
        hinweis: (roh, val) => {
          if (Math.abs(val - h1) < 0.0005 && t1 !== 0) return `${num(h1)} ${k.einheit} sind es erst nach ${num(t1)} ${k.zeit}. Zu Beginn war es mehr.`;
          if (Math.abs(val - (h1 + a * t1 * 2)) < 0.0005) return "Rechne vom ersten Messwert um genau die verstrichene Zeit zurück.";
          return "";
        },
      },
      {
        name: `Nach wie vielen ${k.zeit} ${k.ende}?`, soll: t0, einheit: k.zeit, toleranz: 0.0005,
        hinweis: (roh, val) => {
          if (Math.abs(val - b) < 0.0005) return `${num(b)} ist der Anfangswert in ${k.einheit}, keine Zeit.`;
          if (Math.abs(val - b * a) < 0.0005) return `Gesucht ist, wie oft die Abnahme von ${num(a)} ${k.einheit} in den Anfangswert hineinpasst — also geteilt.`;
          if (Math.abs(val - t2) < 0.0005) return `Nach ${num(t2)} ${k.zeit} sind noch ${num(h2)} ${k.einheit} übrig.`;
          return "";
        },
      },
    ],
    tipps: [
      `Die Änderung je ${k.je} ist die <em>Steigung</em>: der Unterschied der Werte, geteilt durch die verstrichene Zeit.`,
      `Von einem Messwert aus lässt sich auf den Anfang zurückrechnen: ${num(h1)} + ${num(t1)} · Abnahme.`,
      "Das Ende ist die <strong>Nullstelle</strong>: Dort ist der Wert 0.",
    ],
    musterloesungHtml:
      `① Steigung: (${num(h2)} − ${num(h1)}) : (${num(t2)} − ${num(t1)}) = ${num(h2 - h1)} : ${num(t2 - t1)} = <strong>${num(-a)} ${k.einheit}</strong> je ${k.je}<br>` +
      `② Anfangswert: ${num(h1)} + ${num(t1)} · ${num(a)} = <strong>${num(b)} ${k.einheit}</strong><br>` +
      `&nbsp;&nbsp;&nbsp;also f(t) = ${num(b)} − ${num(a)} · t<br>` +
      `③ Nullstelle: ${num(b)} − ${num(a)} · t = 0 ⇒ t = ${num(b)} : ${num(a)} = <strong>${num(t0)} ${k.zeit}</strong><br>` +
      `<em>Probe:</em> f(${num(t2)}) = ${num(b)} − ${num(a)} · ${num(t2)} = ${num(h2)} ✓<br>` +
      `<span class="progress-note">Die drei Zahlen der Geradengleichung haben hier eine Bedeutung: ` +
      `die Steigung ist die Abnahme je ${k.je}, der y-Achsenabschnitt der Anfangswert, die Nullstelle der Zeitpunkt des Endes. ` +
      `Danach beschreibt die Gerade nichts mehr — negative ${k.mehrzahl} gibt es hier nicht.</span>`,
  };
}

function initExercises() {
  mountUebungsaufgaben(document.getElementById("exercises-mount"), [
    { schwierigkeit: "einfach", titel: "Aufgabe 1 — Funktionswert berechnen", generate: generateAufgabe1 },
    { schwierigkeit: "einfach", titel: "Aufgabe 2 — Ablesen und Punktprobe", generate: generateAufgabe2b },
    { schwierigkeit: "mittel", titel: "Aufgabe 3 — Steigung aus zwei Punkten", generate: generateAufgabe2 },
    { schwierigkeit: "mittel", titel: "Aufgabe 4 — Ist die Tabelle linear?", generate: generateAufgabe4b },
    { schwierigkeit: "schwierig", titel: "Aufgabe 5 — Gleichung aufstellen und auswerten", generate: generateAufgabe3 },
    { schwierigkeit: "schwierig", titel: "Aufgabe 6 — Die Parallele durch einen Punkt", generate: generateAufgabe6 },
    { schwierigkeit: "komplex", titel: "Aufgabe 7 — Schnittpunkt zweier Geraden", generate: generateAufgabe4 },
    { schwierigkeit: "komplex", titel: "Aufgabe 8 — Eine Gerade mit Bedeutung", generate: generateAufgabe8 },
  ]);
}

// ================= Quizze =================

function initQuizzes() {
  mountQuiz(document.getElementById("quiz-funktion"), {
    q: "Welche der folgenden Zuordnungen ist <em>keine</em> Funktion?",
    options: [
      "jedem x seine Quadratzahl x²",
      "jeder Zahl x ihr Doppeltes",
      "jedem x alle Zahlen y mit x² + y² = 25",
      "jedem x die Zahl 7",
    ],
    correct: 2,
    explain: "Der Kreis ordnet x = 3 gleich zwei Werte zu, nämlich 4 und −4 — die Bedingung „genau ein y“ ist verletzt. Bei x² ist es umgekehrt: Zwei verschiedene x haben denselben Wert, und das ist erlaubt. Auch die konstante Zuordnung x ↦ 7 ist eine Funktion.",
  });
  mountQuiz(document.getElementById("quiz-gerade"), {
    q: "Welche Gerade hat die Steigung −3 und den y-Achsenabschnitt 2?",
    options: ["y = −3x + 2", "y = 2x − 3", "y = 3x − 2", "y = −2x + 3"],
    correct: 0,
    explain: "In y = m · x + b steht die Steigung als Faktor <em>vor dem x</em> und der y-Achsenabschnitt als Summand dahinter. m = −3 bedeutet: ein Schritt nach rechts, drei nach unten. b = 2 heißt, dass die Gerade die y-Achse bei 2 schneidet.",
  });
  mountQuiz(document.getElementById("quiz-steigung"), {
    q: "Eine Gerade geht durch P(2 | 1) und Q(6 | 9). Wie groß ist ihre Steigung?",
    options: ["2", "0,5", "8", "4"],
    correct: 0,
    explain: "Δy = 9 − 1 = 8 und Δx = 6 − 2 = 4, also m = 8 : 4 = 2. Die 0,5 entsteht, wenn man den Bruch umdreht; die 8 ist nur Δy, die 4 nur Δx.",
  });
  mountQuiz(document.getElementById("quiz-aufstellen"), {
    q: "Eine Gerade hat die Steigung 3 und geht durch P(2 | 1). Wie lautet ihr y-Achsenabschnitt b?",
    options: ["−5", "1", "5", "7"],
    correct: 0,
    explain: "Einsetzen in y = 3x + b: 1 = 3 · 2 + b = 6 + b, also b = 1 − 6 = −5. Die Gerade lautet f(x) = 3x − 5. Wer 1 antwortet, verwechselt b mit dem Funktionswert an der Stelle 2.",
  });
  mountQuiz(document.getElementById("quiz-schnitt"), {
    q: "Warum haben g(x) = 2x + 1 und h(x) = 2x − 4 keinen Schnittpunkt?",
    options: [
      "weil ihre Steigungen gleich sind, die Achsenabschnitte aber nicht",
      "weil beide Steigungen positiv sind",
      "weil ihre y-Achsenabschnitte verschiedene Vorzeichen haben",
      "weil die Steigung 2 zu groß ist",
    ],
    correct: 0,
    explain: "Setzt man gleich, so fällt das x heraus: 2x + 1 = 2x − 4 wird zu 1 = −4, einer falschen Aussage. Gleiche Steigung heißt parallel; verschiedene Achsenabschnitte heißen, dass die Geraden nicht aufeinanderliegen. Sie haben überall den senkrechten Abstand 5.",
  });
}

// ================= Start =================

initFunktion();
initGerade();
initSteigung();
initAufstellen();
initSchnitt();
initExercises();
initQuizzes();
