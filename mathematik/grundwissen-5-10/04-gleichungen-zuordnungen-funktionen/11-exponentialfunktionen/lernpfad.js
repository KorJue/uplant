// Selbstlernpfad "Exponentialfunktionen" (Grundwissen Klasse 5-10, Kapitel 4).
// Rein clientseitiges Vanilla-JS.
//
// Leitgedanke: Der Unterschied zwischen "je Schritt derselbe Betrag" und "je
// Schritt derselbe Faktor" trägt den ganzen Pfad. Abschnitt 1 macht ihn an
// Differenzen und Quotienten sichtbar, Abschnitt 2 fasst ihn in f(x) = a · qˣ,
// Abschnitt 3 rechnet zwischen Prozentsatz und Faktor um, Abschnitt 4 zeigt,
// dass Verdopplungs- und Halbwertszeit nicht vom Anfangswert abhängen,
// Abschnitt 5 stellt exponentielles Wachstum dem Potenzwachstum gegenüber, und
// Abschnitt 6 rechnet Zinseszins, Zerfall und Wertverlust mit derselben Formel.
//
// Durchgehende Farbcodierung: Anfangswert a blau, Wachstumsfaktor q orange,
// Funktionswert grün, lineares Vergleichswachstum violett, Zeiten rot.

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
  // Erst auf die Anzeigegenauigkeit runden, dann über das Vorzeichen
  // entscheiden: Ein Wert wie −1·10⁻¹⁶ würde sonst als "−0" erscheinen.
  const gerundet = Number(x.toFixed(Math.min(20, digits)));
  const z = gerundet === 0 ? 0 : x;
  return z.toLocaleString("de-DE", { maximumFractionDigits: digits }).replace("-", "−");
}
function zeichen(x, stellen) {
  return Math.abs(Number(x.toFixed(stellen)) - x) < 1e-12 ? "=" : "≈";
}
function mitZeichen(x, stellen) {
  return (zeichen(x, stellen) === "≈" ? "≈ " : "") + num(x, stellen);
}
// Wie mitZeichen, aber mit ausdrücklichem Pluszeichen. "+≈ 148,8" wäre unlesbar,
// deshalb steht das ≈ vorn und das Vorzeichen unmittelbar vor der Zahl.
function mitVorzeichen(x, stellen) {
  return (zeichen(x, stellen) === "≈" ? "≈ " : "") + (x > 0 ? "+" : "") + num(x, stellen);
}
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function parseFlexibleNumber(raw) {
  if (raw == null) return NaN;
  const s = String(raw).trim().replace(/\s/g, "").replace(/−/g, "-").replace(/%/g, "")
    .replace(/\./g, "").replace(",", ".");
  return parseFloat(s);
}
function neueFlaeche(w, h) {
  return svgEl("svg", { viewBox: `0 0 ${w} ${h}`, width: w, height: h, class: "geo-svg", preserveAspectRatio: "xMidYMid meet" });
}
function karte(klasse, name, inhalt) {
  return el("div", { class: "ex-karte " + klasse }, [
    el("span", { class: "name" }, name),
    el("span", { class: "wert", html: inhalt }),
  ]);
}
function schrittZeile(inhaltHtml, grundHtml, klasse = "", kommentar = "") {
  return `<div class="zeile ${klasse}">` +
    `<span class="gl">${inhaltHtml}</span>` +
    (grundHtml ? `<span class="grund">${grundHtml}</span>` : "") +
    (kommentar ? `<span class="kommentar">${kommentar}</span>` : "") +
    `</div>`;
}
// Ein Regler darf nie einen anderen Wert anzeigen als den, mit dem gerechnet
// wird. Wo ein Wert verboten ist (q = 1 wäre gar kein Wachstum), springt der
// Regler darüber hinweg — und zwar in die Richtung, in die gerade gezogen wurde.
function ueberspringe(id, verboten, letzter) {
  const e = document.getElementById(id);
  let v = Number(e.value);
  if (v === verboten) {
    // Der Sprung geht um genau eine Rasterweite weiter. Ein Sprung um 1 bei
    // einem Regler mit step="5" läge zwischen zwei Rasterpunkten — der Browser
    // rundete ihn zurück auf den verbotenen Wert, und die Anzeige zeigte etwas
    // anderes an, als gerechnet wird.
    const raster = Number(e.step) || 1;
    v = letzter !== null && letzter > verboten ? verboten - raster : verboten + raster;
    e.value = String(v);
  }
  return Number(e.value);
}
function bruchHtml(obenHtml, untenHtml) {
  return `<span class="ex-bruch"><span class="oben">${obenHtml}</span><span class="unten">${untenHtml}</span></span>`;
}

// ---------- Koordinatensystem ----------

// Eine runde Schrittweite, sodass etwa acht Linien in den Bereich passen.
// Eine reine Zehnerpotenz liefert je nach Bereich drei oder zwanzig Linien.
function schrittweite(spanne, ziel = 8) {
  const roh = spanne / ziel;
  const zehner = Math.pow(10, Math.floor(Math.log10(roh)));
  for (const f of [1, 2, 2.5, 5]) if (roh <= f * zehner) return f * zehner;
  return 10 * zehner;
}

// Anders als in den übrigen Kapiteln beginnt die y-Achse hier meist bei 0 und
// reicht sehr weit nach oben — deshalb bekommt sie eine eigene Schrittweite.
function koordinaten(svg, opt) {
  const {
    links, oben, breite, hoehe, xMin, xMax, yMin, yMax,
    xSchritt = 1, ySchritt, xBeschriftung = xSchritt, yBeschriftung = ySchritt,
    yFormat = (y) => num(y),
  } = opt;
  const px = (x) => links + ((x - xMin) / (xMax - xMin)) * breite;
  const py = (y) => oben + hoehe - ((y - yMin) / (yMax - yMin)) * hoehe;
  const glatt = (w, s) => Math.abs(w - Math.round(w / s) * s) < 1e-9;

  for (let x = Math.ceil(xMin / xSchritt) * xSchritt; x <= xMax + 1e-9; x += xSchritt) {
    svg.appendChild(svgEl("line", { x1: px(x).toFixed(2), y1: py(yMax).toFixed(2), x2: px(x).toFixed(2), y2: py(yMin).toFixed(2), class: "ex-gitter" }));
    if (Math.abs(x) > 1e-9 && glatt(x, xBeschriftung)) svg.appendChild(svgText(px(x), py(Math.max(0, yMin)) + 14, num(x), { class: "ex-achsentext" }));
  }
  for (let y = Math.ceil(yMin / ySchritt) * ySchritt; y <= yMax + 1e-9; y += ySchritt) {
    svg.appendChild(svgEl("line", { x1: px(xMin).toFixed(2), y1: py(y).toFixed(2), x2: px(xMax).toFixed(2), y2: py(y).toFixed(2), class: "ex-gitter" }));
    if (Math.abs(y) > 1e-9 && glatt(y, yBeschriftung)) svg.appendChild(svgText(px(Math.max(xMin, 0)) - 7, py(y) + 4, yFormat(y), { class: "ex-achsentext", "text-anchor": "end" }));
  }
  const x0 = Math.max(xMin, Math.min(0, xMax)), y0 = Math.max(yMin, Math.min(0, yMax));
  svg.appendChild(svgEl("line", { x1: px(xMin).toFixed(2), y1: py(y0).toFixed(2), x2: (px(xMax) + 12).toFixed(2), y2: py(y0).toFixed(2), class: "ex-achse" }));
  svg.appendChild(svgEl("line", { x1: px(x0).toFixed(2), y1: py(yMin).toFixed(2), x2: px(x0).toFixed(2), y2: (py(yMax) - 12).toFixed(2), class: "ex-achse" }));
  svg.appendChild(svgText(px(x0) - 7, py(y0) + 14, "0", { class: "ex-achsentext", "text-anchor": "end" }));
  svg.appendChild(svgText(px(xMax) + 12, py(y0) + 20, "x", { class: "ex-achsenname", "text-anchor": "end" }));
  svg.appendChild(svgText(px(x0) + 9, py(yMax) + 10, "y", { class: "ex-achsenname", "text-anchor": "start" }));
  return { px, py };
}

function kurveZeichnen(svg, g, f, xMin, xMax, yMin, yMax, klasse, schritte = 320) {
  let d = "", offen = false;
  for (let i = 0; i <= schritte; i++) {
    const x = xMin + (i / schritte) * (xMax - xMin);
    const y = f(x);
    if (!isFinite(y) || y < yMin || y > yMax) { offen = false; continue; }
    d += `${offen ? " L " : " M "}${g.px(x).toFixed(2)} ${g.py(y).toFixed(2)}`;
    offen = true;
  }
  if (d) svg.appendChild(svgEl("path", { d: d.trim(), class: "ex-kurve " + klasse }));
}

function punktZeichnen(svg, g, x, y, klasse, beschriftung, rechts = true, oben = true) {
  svg.appendChild(svgEl("circle", { cx: g.px(x).toFixed(2), cy: g.py(y).toFixed(2), r: 5, class: "ex-punkt " + klasse }));
  if (beschriftung) {
    svg.appendChild(svgText(g.px(x) + (rechts ? 9 : -9), g.py(y) + (oben ? -9 : 17), beschriftung, {
      class: "ex-punkttext " + klasse, "text-anchor": rechts ? "start" : "end",
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

// ================= 1. Linear oder exponentiell? =================

const WA_SCHRITTE = 6;

function waBild(a, q, d) {
  const B = 470, H = 320;
  const svg = neueFlaeche(B, H);
  svg.appendChild(svgText(B / 2, 16, "Grün: mal q je Schritt · violett: plus d je Schritt", { class: "ex-titel" }));
  const yMax = Math.max(a * Math.pow(q, WA_SCHRITTE), a + d * WA_SCHRITTE) * 1.06;
  const ySchritt = schrittweite(yMax);
  const g = koordinaten(svg, {
    links: 56, oben: 30, breite: 356, hoehe: 254, xMin: 0, xMax: WA_SCHRITTE, yMin: 0, yMax,
    xSchritt: 1, ySchritt,
  });
  kurveZeichnen(svg, g, (x) => a + d * x, 0, WA_SCHRITTE, 0, yMax, "linear");
  kurveZeichnen(svg, g, (x) => a * Math.pow(q, x), 0, WA_SCHRITTE, 0, yMax, "");
  for (let k = 0; k <= WA_SCHRITTE; k++) {
    punktZeichnen(svg, g, k, a * Math.pow(q, k), "wert", null);
    punktZeichnen(svg, g, k, a + d * k, "start", null);
  }
  punktZeichnen(svg, g, WA_SCHRITTE, a * Math.pow(q, WA_SCHRITTE), "wert",
    num(a * Math.pow(q, WA_SCHRITTE), 1), false, true);
  punktZeichnen(svg, g, WA_SCHRITTE, a + d * WA_SCHRITTE, "start", num(a + d * WA_SCHRITTE, 1), false, false);
  return svg;
}

function renderWachstum() {
  const a = Number(document.getElementById("wa-a").value);
  const q = Number(document.getElementById("wa-q").value) / 10;
  document.getElementById("wa-a-anzeige").textContent = num(a);
  document.getElementById("wa-q-anzeige").textContent = num(q, 1);
  // Die lineare Vergleichsfunktion startet gleich und macht denselben ersten
  // Schritt — nur so ist der Vergleich fair.
  const d = a * q - a;

  document.getElementById("wa-gleichung").innerHTML =
    `exponentiell: <span class="wv">${num(a)} · ${num(q, 1)}<sup>x</sup></span> &nbsp;·&nbsp; ` +
    `linear: <span class="lv">${num(a)} + ${num(d, 1)} · x</span>`;

  const mount = document.getElementById("wa-mount");
  mount.innerHTML = "";
  mount.appendChild(waBild(a, q, d));

  const xs = [];
  for (let k = 0; k <= WA_SCHRITTE; k++) xs.push(k);
  const expo = xs.map((k) => a * Math.pow(q, k));
  const lin = xs.map((k) => a + d * k);
  const zelle = (klasse, inhalt) => `<td class="${klasse}">${inhalt}</td>`;
  document.getElementById("wa-tabelle").innerHTML =
    `<caption>Der Test: Bleibt die Differenz gleich oder der Quotient?</caption>` +
    `<tr><th>x</th>${xs.map((k) => zelle("", num(k))).join("")}</tr>` +
    `<tr><th>exponentiell</th>${expo.map((y) => zelle("e", num(y, 2))).join("")}</tr>` +
    `<tr><th>Quotient</th><td></td>${expo.slice(1).map((y, i) => zelle("q", "· " + num(y / expo[i], 4))).join("")}</tr>` +
    `<tr><th>linear</th>${lin.map((y) => zelle("l", num(y, 2))).join("")}</tr>` +
    `<tr><th>Differenz</th><td></td>${lin.slice(1).map((y, i) => zelle("q", "+ " + num(y - lin[i], 2))).join("")}</tr>`;

  const karten = document.getElementById("wa-karten");
  karten.innerHTML = "";
  karten.appendChild(karte("a", "Anfangswert a", num(a)));
  karten.appendChild(karte("q", "Faktor q", num(q, 1)));
  karten.appendChild(karte("l", "linearer Zuwachs d", num(d, 1)));
  karten.appendChild(karte("w", `exponentiell bei x = ${WA_SCHRITTE}`, num(expo[WA_SCHRITTE], 1)));
  karten.appendChild(karte("l", `linear bei x = ${WA_SCHRITTE}`, num(lin[WA_SCHRITTE], 1)));

  const faktor = expo[WA_SCHRITTE] / lin[WA_SCHRITTE];
  document.getElementById("wa-bilanz").innerHTML =
    `<strong>Exponentiell:</strong> Der <span class="wq">Quotient</span> zweier benachbarter Werte ist immer ` +
    `<span class="wq">${num(q, 1)}</span> — die Differenz dagegen wächst von ${num(expo[1] - expo[0], 2)} auf ` +
    `${num(expo[WA_SCHRITTE] - expo[WA_SCHRITTE - 1], 2)}.<br>` +
    `<strong>Linear:</strong> Die <span class="wl">Differenz</span> ist immer <span class="wl">${num(d, 1)}</span> — ` +
    `der Quotient dagegen sinkt von ${num(lin[1] / lin[0], 4)} auf ${num(lin[WA_SCHRITTE] / lin[WA_SCHRITTE - 1], 4)} ` +
    `und nähert sich der 1.<br>` +
    `Beide beginnen bei <span class="wa">${num(a)}</span> und machen denselben ersten Schritt. Nach ${WA_SCHRITTE} Schritten ist ` +
    `der exponentielle Wert <span class="ww">${num(faktor, 2)}-mal</span> so groß wie der lineare.`;

  document.getElementById("wa-text").innerHTML =
    `<span class="ex-urteil ${faktor > 2 ? "ja" : "eins"}">Nach ${WA_SCHRITTE} Schritten: ${num(expo[WA_SCHRITTE], 1)} gegen ${num(lin[WA_SCHRITTE], 1)}</span> ` +
    `Am Anfang liegen beide dicht beieinander — der Unterschied entsteht erst mit der Zeit. ` +
    `Genau deshalb wird exponentielles Wachstum so oft unterschätzt.`;
}

function initWachstum() {
  document.getElementById("wa-a").addEventListener("input", renderWachstum);
  document.getElementById("wa-q").addEventListener("input", renderWachstum);
  renderWachstum();
}

// ================= 2. Die Exponentialfunktion =================

let fuLetztesQ = null;

// Das Fenster richtet sich nach q: Es zeigt immer den Bereich, in dem der Wert
// zwischen a : 20 und a · 20 liegt. Bei festem Fenster wäre die Kurve für
// großes q nur noch ein senkrechter Strich am Rand.
function fuFenster(q) {
  const n = Math.ceil(Math.log(20) / Math.abs(Math.log(q)));
  return Math.max(3, Math.min(12, n));
}

function fuBild(a, q, x0, n) {
  const B = 470, H = 330;
  const svg = neueFlaeche(B, H);
  const yMax = 20 * a;
  svg.appendChild(svgText(B / 2, 16, `f(x) = ${num(a)} · ${num(q, 1)}ˣ — die x-Achse wird nie erreicht`, { class: "ex-titel" }));
  const ySchritt = schrittweite(yMax);
  const g = koordinaten(svg, {
    links: 56, oben: 30, breite: 352, hoehe: 250, xMin: -n, xMax: n, yMin: 0, yMax,
    xSchritt: 1, xBeschriftung: n > 6 ? 2 : 1, ySchritt,
  });
  // Die Asymptote ist die x-Achse selbst; sie wird eigens hervorgehoben.
  svg.appendChild(svgEl("line", { x1: g.px(-n).toFixed(2), y1: g.py(0).toFixed(2), x2: g.px(n).toFixed(2), y2: g.py(0).toFixed(2), class: "ex-asymptote" }));
  kurveZeichnen(svg, g, (x) => a * Math.pow(q, x), -n, n, 0, yMax, "");
  punktZeichnen(svg, g, 0, a, "start", `f(0) = ${num(a)}`, q > 1, true);
  const y0 = a * Math.pow(q, x0);
  if (Math.abs(x0) <= n && y0 <= yMax) {
    punktZeichnen(svg, g, x0, y0, "wert", `(${num(x0)} | ${num(y0, 2)})`, x0 < n * 0.55, true);
  }
  return svg;
}

function renderFunktion() {
  const a = Number(document.getElementById("fu-a").value);
  const qRoh = ueberspringe("fu-q", 10, fuLetztesQ);
  fuLetztesQ = qRoh;
  const q = qRoh / 10;
  const n = fuFenster(q);
  // Der Regler für x wird an das Fenster angepasst und sein Wert mitgeführt —
  // sonst zeigte er eine Stelle an, die gar nicht im Bild liegt.
  const xEl = document.getElementById("fu-x");
  xEl.min = String(-n);
  xEl.max = String(n);
  const x0 = Math.max(-n, Math.min(n, Number(xEl.value)));
  if (Number(xEl.value) !== x0) xEl.value = String(x0);

  document.getElementById("fu-a-anzeige").textContent = num(a);
  document.getElementById("fu-q-anzeige").textContent = num(q, 1);
  document.getElementById("fu-x-anzeige").textContent = num(x0);
  const y0 = a * Math.pow(q, x0), y1 = a * Math.pow(q, x0 + 1);

  document.getElementById("fu-gleichung").innerHTML =
    `f(x) = <span class="av">${num(a)}</span> · <span class="qv">${num(q, 1)}</span><sup>x</sup> &nbsp;→&nbsp; ` +
    `f(${num(x0)}) = <span class="av">${num(a)}</span> · <span class="qv">${num(q, 1)}</span><sup>${num(x0)}</sup> ` +
    `<span class="wv">${zeichen(y0, 4)} ${num(y0, 4)}</span>`;

  const mount = document.getElementById("fu-mount");
  mount.innerHTML = "";
  mount.appendChild(fuBild(a, q, x0, n));

  const karten = document.getElementById("fu-karten");
  karten.innerHTML = "";
  karten.appendChild(karte("a", "Anfangswert a = f(0)", num(a)));
  karten.appendChild(karte("q", "Wachstumsfaktor q", num(q, 1)));
  karten.appendChild(karte("w", `f(${num(x0)})`, mitZeichen(y0, 4)));
  karten.appendChild(karte("w", `f(${num(x0 + 1)})`, mitZeichen(y1, 4)));
  karten.appendChild(karte("q", "f(x+1) : f(x)", num(y1 / y0, 4)));

  document.getElementById("fu-bilanz").innerHTML =
    `<strong>f(0) = a:</strong> <span class="wa">${num(a)} · ${num(q, 1)}<sup>0</sup> = ${num(a)} · 1 = ${num(a)}</span> — ` +
    `nach der Regel <a href="../09-potenzen/index.html#sec-ganzzahlig">q<sup>0</sup> = 1</a>.<br>` +
    `<strong>Ein Schritt weiter heißt mal q:</strong> ` +
    `<span class="ww">f(${num(x0 + 1)}) : f(${num(x0)}) = ${num(y1, 4)} : ${num(y0, 4)} = ${num(q, 1)}</span> — ` +
    `und das gilt an <em>jeder</em> Stelle, nicht nur hier.<br>` +
    (x0 < 0
      ? `<strong>Negatives x:</strong> ${num(q, 1)}<sup>${num(x0)}</sup> = 1 : ${num(q, 1)}<sup>${num(-x0)}</sup> ` +
        `${zeichen(Math.pow(q, x0), 4)} ${num(Math.pow(q, x0), 4)} — ein Kehrwert, also wieder positiv. ` +
        `Im Sachzusammenhang ist das der Bestand <em>vor</em> dem Startzeitpunkt.`
      : `<strong>Zum Vergleich rückwärts:</strong> f(−1) = ${num(a)} : ${num(q, 1)} ` +
        `${zeichen(a / q, 4)} ${num(a / q, 4)} — auch links vom Nullpunkt bleiben alle Werte positiv.`);

  document.getElementById("fu-text").innerHTML = q > 1
    ? `<span class="ex-urteil ja">q = ${num(q, 1)} &gt; 1 — Wachstum</span> ` +
      `Der Graph steigt und wird immer steiler. Nach links nähert er sich der x-Achse, ohne sie je zu erreichen.`
    : `<span class="ex-urteil eins">q = ${num(q, 1)} &lt; 1 — Abnahme</span> ` +
      `Der Graph fällt und wird immer flacher. Nach rechts nähert er sich der x-Achse, ohne sie je zu erreichen — ` +
      `der Bestand wird beliebig klein, aber nie 0.`;
}

function initFunktion() {
  for (const id of ["fu-a", "fu-q", "fu-x"]) {
    document.getElementById(id).addEventListener("input", renderFunktion);
  }
  renderFunktion();
}

// ================= 3. Prozentsatz und Wachstumsfaktor =================

let prLetztesP = null;
const PR_START = 100;   // Bezugswert: 100 Einheiten

function prBild(q, n) {
  const B = 470, H = 300;
  const svg = neueFlaeche(B, H);
  svg.appendChild(svgText(B / 2, 16, `Aus ${num(PR_START)} Einheiten nach jedem Schritt`, { class: "ex-titel" }));
  const werte = [];
  for (let k = 0; k <= n; k++) werte.push(PR_START * Math.pow(q, k));
  const yMax = Math.max(...werte, PR_START) * 1.08;
  const links = 54, oben = 30, breite = 380, hoehe = 200;
  const py = (w) => oben + hoehe - (w / yMax) * hoehe;
  svg.appendChild(svgEl("line", { x1: links - 6, y1: py(0).toFixed(2), x2: (links + breite + 6).toFixed(2), y2: py(0).toFixed(2), class: "ex-achse" }));
  // Die Ausgangshöhe als Bezugslinie — daran sieht man Zunahme und Abnahme.
  svg.appendChild(svgEl("line", { x1: links - 6, y1: py(PR_START).toFixed(2), x2: (links + breite + 6).toFixed(2), y2: py(PR_START).toFixed(2), class: "ex-asymptote" }));
  svg.appendChild(svgText(links - 10, py(PR_START) + 4, num(PR_START), { class: "ex-punkttext zeit", "text-anchor": "end" }));
  const gruppe = breite / (n + 1);
  const sb = Math.min(30, gruppe * 0.62);
  werte.forEach((w, k) => {
    const x = links + (k + 0.5) * gruppe - sb / 2;
    svg.appendChild(svgEl("rect", {
      x: x.toFixed(2), y: py(w).toFixed(2), width: sb.toFixed(2), height: (py(0) - py(w)).toFixed(2),
      class: "ex-saeule " + (k === 0 ? "linear" : "expo"),
    }));
    svg.appendChild(svgText(x + sb / 2, py(w) - 4, num(w, 1), { class: "ex-saeulentext " + (k === 0 ? "linear" : "expo") }));
    svg.appendChild(svgText(x + sb / 2, py(0) + 14, num(k), { class: "ex-achsentext" }));
  });
  svg.appendChild(svgText(B / 2, H - 8, `Jede Säule ist das ${num(q, 4)}-fache der vorigen`, { class: "ex-achsentext" }));
  return svg;
}

function renderProzent() {
  const p = ueberspringe("pr-p", 0, prLetztesP);
  prLetztesP = p;
  const n = Number(document.getElementById("pr-n").value);
  document.getElementById("pr-p-anzeige").textContent = num(p);
  document.getElementById("pr-n-anzeige").textContent = num(n);
  const q = 1 + p / 100;
  const qn = Math.pow(q, n);
  const ende = PR_START * qn;
  const gesamt = (qn - 1) * 100;

  document.getElementById("pr-gleichung").innerHTML =
    `q = 1 ${p > 0 ? "+" : "−"} <span class="qv">${bruchHtml(num(Math.abs(p)), "100")}</span> = ` +
    `<span class="qv">${num(q, 4)}</span> &nbsp;→&nbsp; nach ${num(n)} Schritten: ` +
    `<span class="wv">${num(PR_START)} · ${num(q, 4)}<sup>${num(n)}</sup> ${zeichen(ende, 2)} ${num(ende, 2)}</span>`;

  const mount = document.getElementById("pr-mount");
  mount.innerHTML = "";
  mount.appendChild(prBild(q, n));

  document.getElementById("pr-schritte").innerHTML = [
    schrittZeile(`${p > 0 ? "Zunahme" : "Abnahme"} um <span class="qv">${num(Math.abs(p))} %</span> je Schritt`, "Aufgabe"),
    schrittZeile(`q = 1 ${p > 0 ? "+" : "−"} ${num(Math.abs(p))} : 100 = <span class="qv">${num(q, 4)}</span>`,
      "Prozentsatz in den Faktor umrechnen", "", p > 0
        ? "Bei Zunahme kommt der Anteil zum Ganzen dazu: 100 % + p %."
        : "Bei Abnahme bleibt vom Ganzen der Rest übrig: 100 % − p %."),
    schrittZeile(`${num(n)} Schritte: <span class="qv">${num(q, 4)}<sup>${num(n)}</sup> ${zeichen(qn, 4)} ${num(qn, 4)}</span>`,
      "die Faktoren multiplizieren sich", "", "Nach Gesetz (1) der Potenzrechnung: q · q · … · q = qⁿ."),
    schrittZeile(`${num(PR_START)} · ${num(qn, 4)} <span class="wv">${zeichen(ende, 2)} ${num(ende, 2)}</span>`,
      "Endwert", "fertig"),
    schrittZeile(`Gesamtänderung: (${num(qn, 4)} − 1) · 100 % <span class="zv">${zeichen(gesamt, 1)} ${num(gesamt, 1)} %</span>`,
      "in Prozent ausgedrückt", "fertig",
      `Das ist ${gesamt > Math.abs(p) * n ? "mehr" : "weniger"} als ${num(Math.abs(p))} % · ${num(n)} = ${num(Math.abs(p) * n)} % — Prozentsätze darf man nicht addieren.`),
  ].join("");

  const karten = document.getElementById("pr-karten");
  karten.innerHTML = "";
  karten.appendChild(karte("q", "Änderung p", num(p) + " %"));
  karten.appendChild(karte("q", "Faktor q", num(q, 4)));
  karten.appendChild(karte("w", `q hoch ${num(n)}`, mitZeichen(qn, 4)));
  karten.appendChild(karte("w", `aus ${num(PR_START)} wird`, mitZeichen(ende, 2)));
  karten.appendChild(karte("z", "insgesamt", mitVorzeichen(gesamt, 1) + " %"));

  const rueck = q * (2 - q);   // erst p % rauf, dann p % runter
  document.getElementById("pr-bilanz").innerHTML =
    `<strong>Hin und zurück:</strong> Erst <span class="wq">${num(Math.abs(p))} %</span> in die eine, dann ` +
    `<span class="wq">${num(Math.abs(p))} %</span> in die andere Richtung ergibt den Faktor ` +
    `<span class="wq">${num(q, 4)} · ${num(2 - q, 4)} = ${num(rueck, 4)}</span> — also ` +
    `<span class="wz">${num((rueck - 1) * 100, 2)} %</span>, nicht 0 %. Die zweite Änderung bezieht sich auf einen anderen Bezugswert.<br>` +
    `<strong>Warum man Prozente nicht addieren darf:</strong> ${num(n)} Schritte zu je ${num(Math.abs(p))} % ergeben ` +
    `<span class="ww">${num(gesamt, 1)} %</span> und nicht ${num(p * n)} %. Nur die <em>Faktoren</em> werden multipliziert — ` +
    `und aus dem Produkt liest man am Ende wieder einen Prozentsatz ab.`;

  document.getElementById("pr-text").innerHTML = p > 0
    ? `<span class="ex-urteil ja">q = ${num(q, 4)} &gt; 1 — Zunahme</span> ` +
      `Aus ${num(PR_START)} werden nach ${num(n)} Schritten ${num(ende, 1)}. Der Zuwachs wird von Schritt zu Schritt größer, ` +
      `weil sich der Prozentsatz immer auf den neuen, größeren Bestand bezieht.`
    : `<span class="ex-urteil eins">q = ${num(q, 4)} &lt; 1 — Abnahme</span> ` +
      `Aus ${num(PR_START)} werden nach ${num(n)} Schritten ${num(ende, 1)}. Der Bestand wird immer kleiner, ` +
      `erreicht aber nie 0 — jeder Schritt nimmt nur einen Anteil des Rests weg.`;
}

function initProzent() {
  document.getElementById("pr-p").addEventListener("input", renderProzent);
  document.getElementById("pr-n").addEventListener("input", renderProzent);
  renderProzent();
}

// ================= 4. Verdopplungszeit und Halbwertszeit =================

let zeLetztesP = null;

// Kleinste ganze Zahl n mit qⁿ ≥ 2 (Wachstum) bzw. qⁿ ≤ 0,5 (Abnahme).
function zeGanzeSchritte(q) {
  const ziel = q > 1 ? 2 : 0.5;
  for (let n = 1; n <= 400; n++) {
    const w = Math.pow(q, n);
    if (q > 1 ? w >= ziel : w <= ziel) return n;
  }
  return null;
}

function zeBild(a, q, T) {
  const B = 480, H = 320;
  const svg = neueFlaeche(B, H);
  const wachstum = q > 1;
  svg.appendChild(svgText(B / 2, 16,
    wachstum ? "Gleiche Zeit für jede Verdopplung" : "Gleiche Zeit für jede Halbierung", { class: "ex-titel" }));
  // Drei Verdopplungen (bzw. Halbierungen) sollen ins Bild passen.
  const xMax = Math.min(60, Math.ceil(3.2 * T));
  const yMax = wachstum ? a * 9 : a * 1.15;
  const ySchritt = schrittweite(yMax);
  const g = koordinaten(svg, {
    links: 56, oben: 30, breite: 362, hoehe: 244, xMin: 0, xMax, yMin: 0, yMax,
    xSchritt: Math.max(1, Math.round(xMax / 12)), ySchritt,
  });
  kurveZeichnen(svg, g, (x) => a * Math.pow(q, x), 0, xMax, 0, yMax, "");
  // Die Marken: jeweils nach einer weiteren Verdopplungs- oder Halbwertszeit.
  for (let k = 1; k <= 3; k++) {
    const x = k * T, y = a * Math.pow(wachstum ? 2 : 0.5, k);
    if (x > xMax || y > yMax) break;
    svg.appendChild(svgEl("line", { x1: g.px(x).toFixed(2), y1: g.py(0).toFixed(2), x2: g.px(x).toFixed(2), y2: g.py(y).toFixed(2), class: "ex-marke" }));
    svg.appendChild(svgEl("line", { x1: g.px(0).toFixed(2), y1: g.py(y).toFixed(2), x2: g.px(x).toFixed(2), y2: g.py(y).toFixed(2), class: "ex-marke" }));
    punktZeichnen(svg, g, x, y, "zeit", `${num(k)} · T`, false, true);
  }
  punktZeichnen(svg, g, 0, a, "start", `a = ${num(a)}`, true, true);
  return svg;
}

function renderZeiten() {
  const p = ueberspringe("ze-p", 0, zeLetztesP);
  zeLetztesP = p;
  const a = Number(document.getElementById("ze-a").value);
  document.getElementById("ze-p-anzeige").textContent = num(p);
  document.getElementById("ze-a-anzeige").textContent = num(a);
  const q = 1 + p / 100;
  const wachstum = q > 1;
  const ziel = wachstum ? 2 : 0.5;
  const T = Math.log(ziel) / Math.log(q);
  const nGanz = zeGanzeSchritte(q);
  const name = wachstum ? "Verdopplungszeit" : "Halbwertszeit";

  document.getElementById("ze-gleichung").innerHTML =
    `<span class="qv">${num(q, 4)}</span><sup>T</sup> = <span class="zv">${num(ziel, 1)}</span> &nbsp;→&nbsp; ` +
    `T <span class="zv">≈ ${num(T, 2)}</span> Schritte`;

  const mount = document.getElementById("ze-mount");
  mount.innerHTML = "";
  mount.appendChild(zeBild(a, q, T));

  // Probieren, bis die Schwelle überschritten ist — der Weg ohne Logarithmus.
  const probe = [];
  for (let k = 1; k <= Math.min(nGanz, 6); k++) probe.push(`${num(q, 4)}<sup>${num(k)}</sup> ${zeichen(Math.pow(q, k), 3)} ${num(Math.pow(q, k), 3)}`);
  document.getElementById("ze-schritte").innerHTML = [
    schrittZeile(`Gesucht: T mit <span class="qv">${num(q, 4)}</span><sup>T</sup> = <span class="zv">${num(ziel, 1)}</span>`,
      "Aufgabe", "", `Der Anfangswert kommt darin gar nicht vor — er kürzt sich weg: (a · q^T) : a = q^T.`),
    schrittZeile(probe.join(" &nbsp;·&nbsp; ") + (nGanz > 6 ? " &nbsp;…" : ""), "schrittweise ausprobieren"),
    schrittZeile(`Nach <span class="zv">${num(nGanz)}</span> ganzen Schritten ist die Schwelle ${wachstum ? "überschritten" : "unterschritten"}: ` +
      `${num(q, 4)}<sup>${num(nGanz)}</sup> ${zeichen(Math.pow(q, nGanz), 3)} ${num(Math.pow(q, nGanz), 3)}`,
      "ganze Schritte", "warnung"),
    schrittZeile(`Genauer Wert: T <span class="zv">≈ ${num(T, 3)}</span>`, "mit dem Logarithmus", "fertig",
      `Der Logarithmus beantwortet die Frage „welcher Exponent?“ in einem Schritt — bis dahin genügt das Probieren.`),
  ].join("");

  const karten = document.getElementById("ze-karten");
  karten.innerHTML = "";
  karten.appendChild(karte("q", "Änderung p", num(p) + " %"));
  karten.appendChild(karte("q", "Faktor q", num(q, 4)));
  karten.appendChild(karte("z", name + " T", mitZeichen(T, 2) + " Schritte"));
  karten.appendChild(karte("z", "ganze Schritte", num(nGanz)));
  karten.appendChild(karte("a", `aus a = ${num(a)} wird nach T`, mitZeichen(a * ziel, 1)));

  document.getElementById("ze-bilanz").innerHTML =
    `<strong>T hängt nicht vom Anfangswert ab.</strong> Von <span class="wa">${num(a)}</span> auf ` +
    `<span class="ww">${num(a * ziel, 1)}</span> dauert es ${num(T, 2)} Schritte — und von ` +
    `<span class="wa">${num(a * 4)}</span> auf <span class="ww">${num(a * 4 * ziel, 1)}</span> ` +
    `genau <span class="wz">${num(Math.log(ziel) / Math.log(q), 2)}</span> Schritte, also dieselbe Zeit.<br>` +
    `<strong>Warum:</strong> In <span class="wq">(a · q<sup>T</sup>) : a = q<sup>T</sup></span> kürzt sich a heraus. ` +
    `Übrig bleibt eine Gleichung, in der nur noch q und T vorkommen.<br>` +
    `<strong>Nach ${num(3)} · T</strong> ist der Bestand ${wachstum ? "auf das Achtfache gestiegen" : "auf ein Achtel gefallen"}: ` +
    `<span class="ww">${num(ziel, 1)}³ = ${num(Math.pow(ziel, 3), 3)}</span>. Jede weitere Zeitspanne T ` +
    `${wachstum ? "verdoppelt" : "halbiert"} erneut.`;

  document.getElementById("ze-text").innerHTML = wachstum
    ? `<span class="ex-urteil ja">Verdopplung nach ${num(T, 1)} Schritten</span> ` +
      `Bei ${num(p)} % Zuwachs je Schritt. Eine Faustregel für kleine Prozentsätze: T ≈ 70 : p — hier ergäbe sie ` +
      `${num(70 / p, 1)}, und der genaue Wert ist ${num(T, 1)}.`
    : `<span class="ex-urteil eins">Halbierung nach ${num(T, 1)} Schritten</span> ` +
      `Bei ${num(Math.abs(p))} % Abnahme je Schritt. Auch hier gilt die Faustregel T ≈ 70 : p — sie liefert ` +
      `${num(70 / Math.abs(p), 1)} gegenüber dem genauen Wert ${num(T, 1)}.`;
}

function initZeiten() {
  document.getElementById("ze-p").addEventListener("input", renderZeiten);
  document.getElementById("ze-a").addEventListener("input", renderZeiten);
  renderZeiten();
}

// ================= 5. Exponentiell schlägt jede Potenz =================

const VG_YMAX = 160;

function vgBild(x0) {
  const B = 470, H = 320;
  const svg = neueFlaeche(B, H);
  svg.appendChild(svgText(B / 2, 16, "Grün: 2ˣ · blau gestrichelt: x² · violett: x", { class: "ex-titel" }));
  const xMax = 12;
  const g = koordinaten(svg, {
    links: 52, oben: 30, breite: 358, hoehe: 248, xMin: 0, xMax, yMin: 0, yMax: VG_YMAX,
    xSchritt: 1, xBeschriftung: 2, ySchritt: 20, yBeschriftung: 40,
  });
  kurveZeichnen(svg, g, (x) => x, 0, xMax, 0, VG_YMAX, "linear");
  kurveZeichnen(svg, g, (x) => x * x, 0, xMax, 0, VG_YMAX, "quadrat");
  kurveZeichnen(svg, g, (x) => Math.pow(2, x), 0, xMax, 0, VG_YMAX, "");
  // Die beiden Schnittstellen von 2ˣ und x²: bei x = 2 und bei x = 4.
  for (const s of [2, 4]) {
    if (s === x0) continue;   // dort steht schon der bewegliche Punkt
    punktZeichnen(svg, g, s, s * s, "zeit", `x = ${num(s)}`, s === 2, true);
  }
  const y = Math.pow(2, x0);
  if (y <= VG_YMAX) punktZeichnen(svg, g, x0, y, "wert", `2^${num(x0)} = ${num(y)}`, x0 < 8, true);
  if (x0 * x0 <= VG_YMAX) punktZeichnen(svg, g, x0, x0 * x0, "start", null);
  return svg;
}

function renderVergleich() {
  const x0 = Number(document.getElementById("vg-x").value);
  document.getElementById("vg-x-anzeige").textContent = num(x0);
  const linear = x0, quadrat = x0 * x0, expo = Math.pow(2, x0);

  document.getElementById("vg-gleichung").innerHTML =
    `x = <span class="qv">${num(x0)}</span>: &nbsp; x = <span class="lv">${num(linear)}</span> &nbsp;·&nbsp; ` +
    `x² = <span class="av">${num(quadrat)}</span> &nbsp;·&nbsp; 2<sup>x</sup> = <span class="wv">${num(expo)}</span>`;

  const mount = document.getElementById("vg-mount");
  mount.innerHTML = "";
  mount.appendChild(vgBild(x0));

  const xs = [];
  for (let k = 0; k <= 12; k++) xs.push(k);
  const zelle = (klasse, inhalt, aktiv) => `<td class="${klasse}${aktiv ? " aktiv" : ""}">${inhalt}</td>`;
  document.getElementById("vg-tabelle").innerHTML =
    `<caption>Nur zwischen x = 2 und x = 4 liegt x² vorn — sonst ist 2ˣ größer</caption>` +
    `<tr><th>x</th>${xs.map((k) => zelle("", num(k), k === x0)).join("")}</tr>` +
    `<tr><th>x²</th>${xs.map((k) => zelle("l", num(k * k), k === x0)).join("")}</tr>` +
    `<tr><th>2<sup>x</sup></th>${xs.map((k) => zelle("e", num(Math.pow(2, k)), k === x0)).join("")}</tr>` +
    `<tr><th>2<sup>x</sup> : x²</th>${xs.map((k) => zelle("q", k === 0 ? "—" : num(Math.pow(2, k) / (k * k), 2), k === x0)).join("")}</tr>`;

  const karten = document.getElementById("vg-karten");
  karten.innerHTML = "";
  karten.appendChild(karte("q", "Stelle x", num(x0)));
  karten.appendChild(karte("l", "x (linear)", num(linear)));
  karten.appendChild(karte("a", "x² (quadratisch)", num(quadrat)));
  karten.appendChild(karte("w", "2ˣ (exponentiell)", num(expo)));
  karten.appendChild(karte("z", "2ˣ : x²", x0 === 0 ? "—" : mitZeichen(expo / quadrat, 2)));

  document.getElementById("vg-bilanz").innerHTML =
    `Bei x = ${num(x0)}: <span class="wl">x = ${num(linear)}</span>, <span class="wa">x² = ${num(quadrat)}</span>, ` +
    `<span class="ww">2ˣ = ${num(expo)}</span>. ` +
    (x0 < 2 ? `Hier ist 2ˣ noch größer — der kurze Vorsprung von x² kommt erst gleich.`
      : x0 === 2 ? `Gleichstand: 2² = 4 und 2² = 4.`
        : x0 === 3 ? `Das ist die einzige ganze Stelle, an der x² wirklich vorn liegt: 9 gegen 8.`
          : x0 === 4 ? `Wieder Gleichstand: 4² = 16 und 2⁴ = 16.`
            : `Ab x = 5 zieht 2ˣ davon: schon ${num(expo / quadrat, 2)}-mal so groß wie x².`) +
    `<br><strong>Der Grund:</strong> Von x auf x + 1 wird 2ˣ mit <span class="ww">2</span> multipliziert — ` +
    `immer, an jeder Stelle. x² wird dagegen nur mit ` +
    `<span class="wa">(x + 1)² : x² = ${x0 === 0 ? "—" : num(Math.pow(x0 + 1, 2) / (x0 * x0), 3)}</span> multipliziert, ` +
    `und dieser Faktor nähert sich mit wachsendem x der 1. Ein Faktor 2 gegen einen Faktor nahe 1 — das kann nur ein Ende nehmen.<br>` +
    `<strong>Bei x = 20:</strong> x² = 400, aber 2ˣ = ${num(Math.pow(2, 20))}.`;

  document.getElementById("vg-text").innerHTML =
    x0 < 2
      ? `<span class="ex-urteil ja">Noch führt 2ˣ</span> ` +
        `Bei x = 0 steht 1 gegen 0, bei x = 1 steht 2 gegen 1. Der Vorsprung von x² beginnt erst gleich.`
      : x0 === 2 || x0 === 4
        ? `<span class="ex-urteil eins">Gleichstand bei x = ${num(x0)}</span> ` +
          `${num(quadrat)} gegen ${num(expo)}. Das sind die einzigen beiden Stellen, an denen x² und 2ˣ übereinstimmen.`
        : x0 === 3
          ? `<span class="ex-urteil nein">Hier führt x²</span> ` +
            `9 gegen 8 — die einzige ganze Stelle, an der x² wirklich vorn liegt. Schiebe den Regler weiter nach rechts.`
          : `<span class="ex-urteil ja">2ˣ liegt vorn — und bleibt vorn</span> ` +
            `Der Abstand wächst mit jedem Schritt weiter, denn 2ˣ verdoppelt sich, während x² kaum noch zulegt.`;
}

function initVergleich() {
  document.getElementById("vg-x").addEventListener("input", renderVergleich);
  renderVergleich();
}

// ================= 6. Zinseszins, Zerfall und Wertverlust =================

const AN_TYPEN = [
  {
    id: "zins", name: "Zinseszins",
    kandidaten: (() => {
      const l = [];
      for (let k = 1000; k <= 5000; k += 500) for (let p = 1; p <= 5; p++) for (const n of [3, 5, 8, 10, 12, 15]) l.push({ a: k, p, n });
      return l;
    })(),
    text: (k) => `Ein Guthaben von <strong>${num(k.a)} €</strong> wird mit <strong>${num(k.p)} %</strong> jährlich verzinst. ` +
      `Wie groß ist es nach <strong>${num(k.n)} Jahren</strong>?`,
    einheit: "€", schritt: "Jahr", stellen: 2, zunahme: true,
  },
  {
    id: "zerfall", name: "Radioaktiver Zerfall",
    kandidaten: (() => {
      const l = [];
      for (let a = 200; a <= 1000; a += 100) for (let p = 5; p <= 30; p += 5) for (const n of [2, 4, 6, 8, 10, 12]) l.push({ a, p, n });
      return l;
    })(),
    text: (k) => `Eine Probe enthält <strong>${num(k.a)} mg</strong> eines Stoffes, der täglich um <strong>${num(k.p)} %</strong> zerfällt. ` +
      `Wie viel ist nach <strong>${num(k.n)} Tagen</strong> übrig?`,
    einheit: "mg", schritt: "Tag", stellen: 2, zunahme: false,
  },
  {
    id: "wert", name: "Wertverlust",
    kandidaten: (() => {
      const l = [];
      for (let a = 12000; a <= 30000; a += 2000) for (let p = 10; p <= 25; p += 5) for (const n of [2, 3, 4, 5, 6, 8]) l.push({ a, p, n });
      return l;
    })(),
    text: (k) => `Ein Auto kostet neu <strong>${num(k.a)} €</strong> und verliert jährlich <strong>${num(k.p)} %</strong> an Wert. ` +
      `Was ist es nach <strong>${num(k.n)} Jahren</strong> noch wert?`,
    einheit: "€", schritt: "Jahr", stellen: 2, zunahme: false,
  },
];
let anTyp = 0;

function anBild(a, q, n, einheit) {
  const B = 470, H = 290;
  const svg = neueFlaeche(B, H);
  svg.appendChild(svgText(B / 2, 16, `${num(a)} ${einheit} · Faktor ${num(q, 4)} je Schritt`, { class: "ex-titel" }));
  const werte = [];
  for (let k = 0; k <= n; k++) werte.push(a * Math.pow(q, k));
  const yMax = Math.max(...werte) * 1.1;
  const ySchritt = schrittweite(yMax, 6);
  const g = koordinaten(svg, {
    links: 62, oben: 30, breite: 348, hoehe: 210, xMin: 0, xMax: n, yMin: 0, yMax,
    xSchritt: Math.max(1, Math.round(n / 10)), ySchritt,
  });
  kurveZeichnen(svg, g, (x) => a * Math.pow(q, x), 0, n, 0, yMax, "");
  for (let k = 0; k <= n; k++) punktZeichnen(svg, g, k, werte[k], "wert", null);
  punktZeichnen(svg, g, 0, a, "start", `${num(a)} ${einheit}`, true, true);
  punktZeichnen(svg, g, n, werte[n], "zeit", `${num(werte[n], 2)} ${einheit}`, false, q > 1);
  return svg;
}

function anBaue() {
  const typ = AN_TYPEN[anTyp];
  const k = pick(typ.kandidaten);
  const q = typ.zunahme ? 1 + k.p / 100 : 1 - k.p / 100;
  const qn = Math.pow(q, k.n);
  const ende = k.a * qn;
  const gesamt = (qn - 1) * 100;

  const schritte = [
    schrittZeile(typ.text(k), "Aufgabe"),
    schrittZeile(`Anfangswert <span class="av">a = ${num(k.a)} ${typ.einheit}</span>`, "aus dem Text lesen"),
    schrittZeile(`q = 1 ${typ.zunahme ? "+" : "−"} ${num(k.p)} : 100 = <span class="qv">${num(q, 4)}</span>`,
      typ.zunahme ? "Zunahme" : "Abnahme", "",
      typ.zunahme ? "Zum vollen Bestand kommt der Anteil dazu." : "Vom vollen Bestand bleibt der Rest übrig."),
    schrittZeile(`n = <span class="zv">${num(k.n)}</span> (${typ.schritt}e) — die Einheit passt zum Prozentsatz „je ${typ.schritt}“.`,
      "Schritte zählen"),
    schrittZeile(`${num(k.a)} · ${num(q, 4)}<sup>${num(k.n)}</sup> = ${num(k.a)} · ${num(qn, 5)} ` +
      `<span class="wv">${zeichen(ende, typ.stellen)} ${num(ende, typ.stellen)} ${typ.einheit}</span>`,
      "einsetzen und rechnen", "fertig"),
  ];

  const bilanz =
    `<span class="ww">Ergebnis: ${num(ende, typ.stellen)} ${typ.einheit}</span><br>` +
    `<strong>Gesamtänderung:</strong> ${num(qn, 5)} entspricht <span class="wz">${gesamt > 0 ? "+" : ""}${num(gesamt, 1)} %</span> ` +
    `gegenüber dem Anfangswert — und nicht ${num(k.p * k.n)} %, wie man beim Addieren der Prozentsätze bekäme.<br>` +
    (typ.zunahme
      ? `<strong>Zum Vergleich ohne Zinseszins:</strong> ${num(k.n)} · ${num(k.p)} % von ${num(k.a)} € sind ` +
        `${num(k.a * k.p * k.n / 100, 2)} € Zinsen, zusammen ${num(k.a + k.a * k.p * k.n / 100, 2)} €. ` +
        `Der Zinseszins bringt <span class="ww">${num(ende - k.a - k.a * k.p * k.n / 100, 2)} €</span> mehr.`
      : `<strong>Halbwertszeit:</strong> Aus ${num(q, 4)}<sup>T</sup> = 0,5 folgt T ≈ ` +
        `<span class="wz">${num(Math.log(0.5) / Math.log(q), 2)} ${typ.schritt}e</span>. ` +
        `Nach dieser Zeit ist jeweils die Hälfte übrig — unabhängig davon, wie viel man am Anfang hatte.`);

  return {
    schritte,
    gleichungHtml: `<span class="av">${num(k.a)}</span> · <span class="qv">${num(q, 4)}</span><sup>${num(k.n)}</sup> ` +
      `<span class="wv">${zeichen(ende, typ.stellen)} ${num(ende, typ.stellen)} ${typ.einheit}</span>`,
    bilanz,
    bild: () => anBild(k.a, q, k.n, typ.einheit),
  };
}

function initAnwendungen() {
  const schalter = document.getElementById("an-schalter");
  const protokoll = mountProtokoll(
    { neu: "an-neu", schritt: "an-schritt", alle: "an-alle", schritte: "an-schritte", bilanz: "an-bilanz", gleichung: "an-gleichung", mount: "an-mount" },
    anBaue,
  );
  AN_TYPEN.forEach((t, i) => {
    const btn = el("button", { type: "button" }, t.name);
    btn.addEventListener("click", () => {
      anTyp = i;
      [...schalter.children].forEach((b, j) => b.classList.toggle("aktiv", j === i));
      protokoll.neu();
    });
    schalter.appendChild(btn);
  });
  schalter.children[0].classList.add("aktiv");
  protokoll.neu();
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

// Die Faktoren werden als Bruch geführt, damit sich exakt entscheiden lässt,
// wann a · qⁿ eine ganze Zahl ist. Mit Gleitkommazahlen wäre 0,1 + 0,2 ≠ 0,3
// hier schon ein Problem.
const A1_FAKTOREN = [
  { q: 1.5, z: 3, n: 2 }, { q: 1.25, z: 5, n: 4 }, { q: 1.2, z: 6, n: 5 },
  { q: 2, z: 2, n: 1 }, { q: 0.5, z: 1, n: 2 }, { q: 0.8, z: 4, n: 5 }, { q: 0.75, z: 3, n: 4 },
];
function ganzzahlig(a, f, k) {
  // a · (z/n)^k ist genau dann ganz, wenn n^k den Wert a teilt.
  return a % Math.pow(f.n, k) === 0;
}
const A1_KANDIDATEN = (() => {
  const liste = [];
  for (const f of A1_FAKTOREN) {
    for (const a of [400, 500, 600, 800, 1000, 1200, 1500, 1600, 2000, 2400, 3000, 4000, 5000, 6000, 8000]) {
      for (let k = 2; k <= 4; k++) {
        if (!ganzzahlig(a, f, k)) continue;
        const ende = a * Math.pow(f.q, k);
        if (ende >= 20 && ende <= 200000) liste.push({ a, f, k, ende });
      }
    }
  }
  return liste;
})();

function generateAufgabe1() {
  const kd = ohneKollision(
    A1_KANDIDATEN,
    (v) => [v.ende, v.a * v.f.q * v.k, v.a + (v.a * v.f.q - v.a) * v.k],
    A1_KANDIDATEN[0],
    0.5,
  );
  const { a, f, k, ende } = kd;
  const linear = a + (a * f.q - a) * k;
  return {
    promptHtml: `Ein Bestand beginnt bei <strong>${num(a)}</strong> und wird in jedem Schritt mit dem Faktor ` +
      `<strong>q = ${num(f.q, 2)}</strong> multipliziert.<br>Wie groß ist er nach <strong>${num(k)} Schritten</strong>?`,
    correct: ende,
    tolerance: 0.5,
    placeholder: "Bestand",
    hinweis: (raw, val) => {
      if (Math.abs(val - a * f.q * k) < 0.5) return `Hier wurde nur einmal mit q multipliziert und dann mit ${num(k)} vervielfacht. Bei exponentiellem Wachstum wird aber <em>${num(k)}-mal hintereinander</em> mit q multipliziert: a · q · q${k > 2 ? " · …" : ""} = a · q<sup>${num(k)}</sup>.`;
      if (Math.abs(val - linear) < 0.5) return `Das wäre <em>lineares</em> Wachstum: immer derselbe Betrag dazu. Hier wird aber immer derselbe <em>Faktor</em> multipliziert.`;
      return `Nach ${num(k)} Schritten steht dort a · q<sup>${num(k)}</sup> = ${num(a)} · ${num(f.q, 2)}<sup>${num(k)}</sup>.`;
    },
    musterloesungHtml:
      `<strong>Formel:</strong> f(n) = a · q<sup>n</sup><br>` +
      `<strong>Einsetzen:</strong> ${num(a)} · ${num(f.q, 2)}<sup>${num(k)}</sup> = ${num(a)} · ${num(Math.pow(f.q, k), 6)} = <strong>${num(ende)}</strong><br>` +
      `<em>Schritt für Schritt:</em> ` +
      Array.from({ length: k }, (_, i) => num(a * Math.pow(f.q, i + 1))).join(" → ") + `<br>` +
      `<em>Zum Vergleich linear:</em> Mit dem festen Zuwachs ${num(a * f.q - a)} je Schritt käme man nur auf ${num(linear)}.`,
  };
}

// Aufgabe 2 — Prozentsatz in den Faktor umrechnen und n Schritte rechnen.
const A2_KANDIDATEN = (() => {
  const liste = [];
  for (const richtung of [1, -1]) {
    for (let p = 2; p <= 30; p += 2) {
      for (let a = 200; a <= 2000; a += 200) {
        for (const n of [3, 4, 5, 6, 8, 10]) liste.push({ richtung, p, a, n });
      }
    }
  }
  return liste;
})();

function generateAufgabe2() {
  const kd = ohneKollision(
    A2_KANDIDATEN,
    (v) => {
      const q = 1 + v.richtung * v.p / 100;
      return [v.a * Math.pow(q, v.n), v.a * (1 + v.richtung * v.p * v.n / 100), v.a * Math.pow(v.p / 100, v.n)];
    },
    A2_KANDIDATEN[0],
    0.06,
  );
  const { richtung, p, a, n } = kd;
  const q = 1 + richtung * p / 100;
  const wert = a * Math.pow(q, n);
  const gerundet = Math.round(wert * 100) / 100;
  const linear = a * (1 + richtung * p * n / 100);
  return {
    promptHtml: `Ein Bestand von <strong>${num(a)}</strong> ändert sich in jedem Schritt um ` +
      `<strong>${richtung > 0 ? "+" : "−"}${num(p)} %</strong>.<br>` +
      `Wie groß ist er nach <strong>${num(n)} Schritten</strong>? <em>Runde auf zwei Stellen nach dem Komma.</em>`,
    correct: gerundet,
    tolerance: 0.006,
    placeholder: "Bestand",
    hinweis: (raw, val) => {
      if (Math.abs(val - linear) < 0.06) return `Hier wurden die Prozentsätze <strong>addiert</strong>: ${num(n)} · ${num(p)} % = ${num(p * n)} %. Das ist nur bei linearem Wachstum richtig. Exponentiell werden die <em>Faktoren multipliziert</em>: q<sup>${num(n)}</sup>.`;
      if (Math.abs(val - a * Math.pow(p / 100, n)) < 0.06) return `Der Faktor ist nicht ${num(p / 100, 2)}, sondern <strong>${num(q, 2)}</strong> — bei einer ${richtung > 0 ? "Zunahme kommt der Anteil zum Ganzen dazu: 1 + p : 100" : "Abnahme bleibt der Rest übrig: 1 − p : 100"}.`;
      return `Erst den Faktor bilden: q = 1 ${richtung > 0 ? "+" : "−"} ${num(p)} : 100 = ${num(q, 2)}. Dann a · q<sup>${num(n)}</sup>.`;
    },
    musterloesungHtml:
      `<strong>Faktor:</strong> q = 1 ${richtung > 0 ? "+" : "−"} ${num(p)} : 100 = <strong>${num(q, 2)}</strong><br>` +
      `<strong>Formel:</strong> a · q<sup>n</sup> = ${num(a)} · ${num(q, 2)}<sup>${num(n)}</sup><br>` +
      `<strong>Rechnen:</strong> ${num(q, 2)}<sup>${num(n)}</sup> ≈ ${num(Math.pow(q, n), 6)}, also ${num(a)} · ${num(Math.pow(q, n), 6)} ≈ <strong>${num(gerundet, 2)}</strong><br>` +
      `<em>Gesamtänderung:</em> ${num((Math.pow(q, n) - 1) * 100, 1)} % — und nicht ${num(richtung * p * n)} %, wie das Addieren der Prozentsätze ergäbe.`,
  };
}

// Aufgabe 3 — aus zwei Beständen den Wachstumsfaktor bestimmen.
const A3_KANDIDATEN = (() => {
  const liste = [];
  for (const f of A1_FAKTOREN) {
    for (const a of [400, 500, 600, 800, 1000, 1200, 1600, 2000, 2400, 3000, 4000, 5000, 6000, 8000]) {
      for (let k = 2; k <= 4; k++) {
        if (!ganzzahlig(a, f, k)) continue;
        const ende = a * Math.pow(f.q, k);
        if (ende >= 20 && ende <= 200000) liste.push({ a, f, k, ende });
      }
    }
  }
  return liste;
})();

function generateAufgabe3() {
  const kd = ohneKollision(
    A3_KANDIDATEN,
    (v) => [v.f.q, v.ende / v.a, (v.ende - v.a) / v.a / v.k + 1],
    A3_KANDIDATEN[0],
    0.002,
  );
  const { a, f, k, ende } = kd;
  const gesamt = ende / a;
  return {
    promptHtml: `Ein Bestand wächst exponentiell von <strong>${num(a)}</strong> auf <strong>${num(ende)}</strong> ` +
      `in <strong>${num(k)} Schritten</strong>.<br>Wie groß ist der <strong>Wachstumsfaktor q</strong> je Schritt? ` +
      `<em>Runde auf zwei Stellen nach dem Komma.</em>`,
    correct: Math.round(f.q * 100) / 100,
    tolerance: 0.006,
    placeholder: "Faktor q",
    hinweis: (raw, val) => {
      if (Math.abs(val - gesamt) < 0.006) return `Das ist der Faktor für <em>alle ${num(k)} Schritte zusammen</em>: ${num(ende)} : ${num(a)} = ${num(gesamt, 4)}. Gesucht ist der Faktor für <strong>einen</strong> Schritt — also die ${num(k)}-te Wurzel daraus.`;
      if (Math.abs(val - ((ende - a) / a / k + 1)) < 0.006) return `Hier wurde die Gesamtänderung durch ${num(k)} <em>geteilt</em>. Das wäre bei linearem Wachstum richtig; exponentiell muss man die ${num(k)}-te <strong>Wurzel</strong> ziehen.`;
      return `Erst der Gesamtfaktor: ${num(ende)} : ${num(a)} = ${num(gesamt, 4)} = q<sup>${num(k)}</sup>. Dann die ${num(k)}-te Wurzel.`;
    },
    musterloesungHtml:
      `<strong>Ansatz:</strong> ${num(a)} · q<sup>${num(k)}</sup> = ${num(ende)}<br>` +
      `<strong>Durch a teilen:</strong> q<sup>${num(k)}</sup> = ${num(ende)} : ${num(a)} = ${num(gesamt, 4)}<br>` +
      `<strong>Wurzel ziehen:</strong> q = <sup>${num(k)}</sup>√${num(gesamt, 4)} = <strong>${num(f.q, 2)}</strong><br>` +
      `<em>Probe:</em> ${num(a)} · ${num(f.q, 2)}<sup>${num(k)}</sup> = ${num(ende)} ✓ &nbsp; Das entspricht ` +
      `${f.q > 1 ? "einer Zunahme" : "einer Abnahme"} um ${num(Math.abs(f.q - 1) * 100, 1)} % je Schritt.`,
  };
}

// Aufgabe 4 — nach wie vielen ganzen Schritten ist die Hälfte unterschritten?
const A4_KANDIDATEN = (() => {
  const liste = [];
  for (let p = 4; p <= 36; p += 1) liste.push({ p });
  return liste;
})();

function a4Schritte(q) {
  for (let n = 1; n <= 400; n++) if (Math.pow(q, n) < 0.5) return n;
  return null;
}

function generateAufgabe4() {
  // Geprüft wird nur, dass die richtige Antwort n nicht mit dem Fehler n − 1
  // zusammenfällt. Der dritte Hinweis (50 : p) darf mit n − 1 übereinstimmen:
  // Beide Hinweise sind dann für dieselbe Zahl richtig, und der erste greift.
  // Nähme man 50 : p mit in die Liste, blieben von 33 Prozentsätzen nur 9 übrig.
  const kd = ohneKollision(
    A4_KANDIDATEN,
    (v) => {
      const n = a4Schritte(1 - v.p / 100);
      return [n, n - 1];
    },
    A4_KANDIDATEN[0],
    0.4,
  );
  const p = kd.p;
  const q = 1 - p / 100;
  const n = a4Schritte(q);
  const genau = Math.log(0.5) / Math.log(q);
  return {
    promptHtml: `Ein Stoff zerfällt täglich um <strong>${num(p)} %</strong>.<br>` +
      `Nach wie vielen <strong>ganzen Tagen</strong> ist zum ersten Mal <em>weniger als die Hälfte</em> übrig?`,
    correct: n,
    tolerance: 0.4,
    placeholder: "Anzahl der Tage",
    hinweis: (raw, val) => {
      if (Math.abs(val - (n - 1)) < 0.4) return `Nach ${num(n - 1)} Tagen sind noch ${num(Math.pow(q, n - 1) * 100, 1)} % übrig — das ist noch <em>mehr</em> als die Hälfte. Ein Tag mehr ist nötig.`;
      if (Math.abs(val - Math.round(50 / p)) < 0.4) return `Das sieht nach 50 : ${num(p)} aus. So rechnet man bei <em>linearer</em> Abnahme; hier wird aber jeden Tag ein Anteil des <strong>Rests</strong> abgezogen, nie ein fester Betrag.`;
      return `Der Faktor ist q = 1 − ${num(p)} : 100 = ${num(q, 2)}. Probiere q, q², q³, … bis der Wert unter 0,5 fällt.`;
    },
    musterloesungHtml:
      `<strong>Faktor:</strong> q = 1 − ${num(p)} : 100 = <strong>${num(q, 2)}</strong><br>` +
      `<strong>Gesucht:</strong> das kleinste n mit ${num(q, 2)}<sup>n</sup> &lt; 0,5<br>` +
      `<strong>Probieren:</strong> ` +
      Array.from({ length: Math.min(n, 8) }, (_, i) => `${num(q, 2)}<sup>${num(i + 1)}</sup> ≈ ${num(Math.pow(q, i + 1), 3)}`).join(" · ") +
      (n > 8 ? " · …" : "") + `<br>` +
      `<em>Also:</em> nach <strong>${num(n)} Tagen</strong>. Nach ${num(n - 1)} Tagen waren es noch ${num(Math.pow(q, n - 1) * 100, 1)} %, ` +
      `nach ${num(n)} Tagen nur noch ${num(Math.pow(q, n) * 100, 1)} %.<br>` +
      `<em>Genaue Halbwertszeit:</em> T ≈ ${num(genau, 2)} Tage — die Zahl der <em>ganzen</em> Tage ist die nächstgrößere ganze Zahl.`,
  };
}

function initExercises() {
  mountUebungsaufgaben(document.getElementById("exercises-mount"), [
    { schwierigkeit: "einfach", titel: "Aufgabe 1 — Bestand nach n Schritten", generate: generateAufgabe1 },
    { schwierigkeit: "mittel", titel: "Aufgabe 2 — Prozentsatz und Faktor", generate: generateAufgabe2 },
    { schwierigkeit: "schwierig", titel: "Aufgabe 3 — den Faktor bestimmen", generate: generateAufgabe3 },
    { schwierigkeit: "komplex", titel: "Aufgabe 4 — Halbwertszeit", generate: generateAufgabe4 },
  ]);
}

// ================= Quizze =================

function initQuizzes() {
  mountQuiz(document.getElementById("quiz-wachstum"), {
    q: "Eine Tabelle zeigt die Werte 3, 6, 12, 24, 48. Welches Wachstum ist das?",
    options: [
      "exponentiell — der Quotient ist immer 2",
      "linear — die Differenz ist immer 3",
      "linear — der Quotient ist immer 2",
      "weder linear noch exponentiell",
    ],
    correct: 0,
    explain: "Die Quotienten sind 6:3 = 2, 12:6 = 2, 24:12 = 2 — konstant. Die Differenzen dagegen sind 3, 6, 12, 24 und wachsen. Konstanter Quotient heißt exponentiell; „linear“ und „Quotient konstant“ passen nie zusammen.",
  });
  mountQuiz(document.getElementById("quiz-funktion"), {
    q: "Welchen Wert hat f(0) bei f(x) = 5 · 3<sup>x</sup>?",
    options: ["5", "15", "1", "0"],
    correct: 0,
    explain: "f(0) = 5 · 3⁰ = 5 · 1 = 5. Der Anfangswert a ist immer f(0), weil q⁰ = 1 ist. Die 15 wäre f(1), und 0 kann kein Wert einer Exponentialfunktion sein — der Graph erreicht die x-Achse nie.",
  });
  mountQuiz(document.getElementById("quiz-prozent"), {
    q: "Ein Preis steigt um 25 %. Welcher Faktor gehört dazu?",
    options: ["1,25", "0,25", "0,75", "25"],
    correct: 0,
    explain: "Zum vollen Preis (100 % = 1) kommen 25 % (= 0,25) dazu: q = 1 + 0,25 = 1,25. Der Faktor 0,75 gehört zu einer Abnahme um 25 %, und 0,25 wäre eine Abnahme um 75 %.",
  });
  mountQuiz(document.getElementById("quiz-zeiten"), {
    q: "Eine Bakterienkultur verdoppelt sich alle 3 Stunden. Wie lange dauert es von 400 auf 3200 Bakterien?",
    options: ["9 Stunden", "3 Stunden", "8 Stunden", "24 Stunden"],
    correct: 0,
    explain: "3200 : 400 = 8 = 2³, also sind drei Verdopplungen nötig: 400 → 800 → 1600 → 3200. Bei je 3 Stunden macht das 9 Stunden. Der Anfangswert spielt dabei keine Rolle — von 50 auf 400 dauerte es genauso lange.",
  });
  mountQuiz(document.getElementById("quiz-vergleich"), {
    q: "Für welche x ist 2<sup>x</sup> größer als x²?",
    options: [
      "für x = 0, x = 1 und für alle x ≥ 5",
      "für alle x",
      "nur für x zwischen 2 und 4",
      "für kein x",
    ],
    correct: 0,
    explain: "Bei x = 0 steht 1 gegen 0 und bei x = 1 steht 2 gegen 1. Bei x = 2 und x = 4 herrscht Gleichstand (4 gegen 4, 16 gegen 16), dazwischen liegt x² vorn. Ab x = 5 (32 gegen 25) ist 2ˣ größer und bleibt es — bei x = 20 steht es 1 048 576 gegen 400.",
  });
  mountQuiz(document.getElementById("quiz-anwendungen"), {
    q: "1000 € werden mit 2 % pro Jahr verzinst. Wie viel sind es nach 2 Jahren?",
    options: ["1040,40 €", "1040,00 €", "1020,00 €", "1400,00 €"],
    correct: 0,
    explain: "1000 · 1,02² = 1000 · 1,0404 = 1040,40 €. Die 1040,00 € kämen ohne Zinseszins heraus (2 · 20 €); die 40 Cent Unterschied sind die Zinsen auf die Zinsen des ersten Jahres. Bei größeren Zeiträumen wächst dieser Unterschied stark an.",
  });
}

// ================= Start =================

initWachstum();
initFunktion();
initProzent();
initZeiten();
initVergleich();
initAnwendungen();
initExercises();
initQuizzes();
