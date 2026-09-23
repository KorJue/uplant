// Selbstlernpfad "Lineare Gleichungssysteme" (Grundwissen Klasse 5-10, Kapitel 4).
// Rein clientseitiges Vanilla-JS, ohne Build-Schritt oder externe Bibliotheken.
//
// Leitgedanke: Ein Gleichungssystem ist zweimal dasselbe — zwei Bedingungen an
// ein Zahlenpaar und zwei Geraden in der Ebene. Abschnitt 1 macht die Lösung
// als Paar sichtbar und probt sie in beiden Gleichungen. Die Abschnitte 2 bis 4
// zeigen die drei Verfahren Schritt für Schritt, damit man sieht, dass sie sich
// nur im Aufwand unterscheiden. Abschnitt 5 führt die drei Lösungsfälle auf die
// Lage der beiden Geraden zurück, Abschnitt 6 übt den Weg vom Text zum System.
//
// Durchgehende Farbcodierung: Gleichung I grün, Gleichung II blau,
// die Unbekannte x violett, die Unbekannte y orange, Ergebnisse rot.

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
  // In einer Gleichung steht ein Minuszeichen, kein Bindestrich.
  return zahlformat(digits).format(x).replace("-", "−");
}
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
// "1 Kind", aber "3 Kinder" — Aufgabentexte dürfen nicht grammatisch schief sein.
function mz(n, einzahl, mehrzahl) {
  return `${n} ${n === 1 ? einzahl : mehrzahl}`;
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
function karte(klasse, name, inhalt) {
  return el("div", { class: "lgs-karte " + klasse }, [
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
// Der gekürzte Bruch als reiner Text: 6 : 4 heißt 3 : 2, und 4 : 2 heißt 2.
function bruchRein(z, n) {
  if (n === 0) return "—";
  const vz = (z < 0) !== (n < 0) ? -1 : 1;
  const az = Math.abs(z), an = Math.abs(n);
  const g = ggt(az, an) || 1;
  const zz = az / g, nn = an / g;
  return (vz < 0 ? "−" : "") + (nn === 1 ? num(zz) : `${num(zz)} : ${num(nn)}`);
}
function bruchText(z, n) {
  const s = bruchRein(z, n);
  return s.includes(":") ? faktor(s) : s;
}
// "x = 18 : (−9) = −2", aber bei einer glatten Division nur "x = −2" — sonst
// stünde dort zweimal dieselbe Zahl.
function bruchErgebnis(z, n, wert) {
  const t = bruchRein(z, n);
  return (t.includes(":") ? faktor(t) + " = " : "") + `<span class="rv">${num(wert)}</span>`;
}

// ---------- Schreibweise der Gleichungen ----------

// Der Betrag eines Summanden k·name: "3x", "x", "" — der Koeffizient 1 wird
// nicht geschrieben, und zwischen Zahl und Variable steht kein Malpunkt.
function varTerm(k, name) {
  const a = Math.abs(k);
  if (a === 0) return "";
  const klasse = name === "x" ? "xv" : "yv";
  return (a === 1 ? "" : num(a)) + `<span class="${klasse}">${name}</span>`;
}
// Derselbe Summand mit Vorzeichen, für allein stehende Terme.
function signTerm(k, name) {
  if (k === 0) return "0";
  return (k < 0 ? "−" : "") + varTerm(k, name);
}
// Dasselbe ohne Auszeichnung, für Aufgabentexte und Musterlösungen.
function termRein(k, name) {
  if (k === 0) return "0";
  const a = Math.abs(k);
  return (k < 0 ? "−" : "") + (a === 1 ? "" : num(a)) + name;
}
// Setzt Summanden mit den richtigen Vorzeichen zusammen. Leere Summanden
// (Koeffizient 0) fallen weg; bleibt gar nichts übrig, steht dort die 0.
function summe(teile) {
  const echt = teile.filter((t) => t.text);
  if (!echt.length) return "0";
  let s = (echt[0].neg ? "−" : "") + echt[0].text;
  for (let i = 1; i < echt.length; i++) s += (echt[i].neg ? " − " : " + ") + echt[i].text;
  return s;
}
function zahlTeil(c) {
  return c === 0 ? "" : num(Math.abs(c));
}
function seiteHtml(a, b) {
  return summe([{ neg: a < 0, text: varTerm(a, "x") }, { neg: b < 0, text: varTerm(b, "y") }]);
}
function gleichungHtml(a, b, c) {
  return `${seiteHtml(a, b)} = <span class="rv">${num(c)}</span>`;
}
function gleichungRein(a, b, c) {
  return `${termRein(a, "x")} ${b < 0 ? "− " + termRein(Math.abs(b), "y") : "+ " + termRein(b, "y")} = ${num(c)}`;
}
// "y = 2x − 1" — die nach y aufgelöste Form.
function nachYHtml(m, b) {
  const rechts = summe([{ neg: m < 0, text: varTerm(m, "x") }, { neg: b < 0, text: zahlTeil(b) }]);
  return `<span class="yv">y</span> = ${rechts}`;
}
function nachYRein(m, b) {
  return `y = ${termRein(m, "x")}${b === 0 ? "" : (b < 0 ? " − " : " + ") + num(Math.abs(b))}`;
}
// "2 · (−3) − 4 · 5" — das Vorzeichen steht vor dem Faktor, nie zwei
// Vorzeichen hintereinander, und der Faktor 1 wird nicht geschrieben.
function einsetzenXY(a, x, b, y) {
  const t = (k, w) => (Math.abs(k) === 1 ? "" : num(Math.abs(k)) + " · ") + klammer(w);
  return (a < 0 ? "−" : "") + t(a, x) + (b < 0 ? " − " : " + ") + t(b, y);
}
// "2 · (−3) + 5" — ein Produkt und eine Zahl.
function einsetzenLinear(m, x, b) {
  const t = (Math.abs(m) === 1 ? "" : num(Math.abs(m)) + " · ") + klammer(x);
  return (m < 0 ? "−" : "") + t + (b === 0 ? "" : (b < 0 ? " − " : " + ") + num(Math.abs(b)));
}
// Das System in geschweifter Klammer.
function systemHtml(zeilen) {
  return `<div class="klammer"></div><div class="zeilen">` +
    zeilen.map((z) => `<div class="zeile ${z.klasse || ""}"><span class="nr">${z.nr}</span><span class="gl">${z.html}</span></div>`).join("") +
    `</div>`;
}
function schrittZeile(inhaltHtml, grundHtml, klasse = "", kommentar = "") {
  return `<div class="zeile ${klasse}">` +
    `<span class="gl">${inhaltHtml}</span>` +
    (grundHtml ? `<span class="grund">${grundHtml}</span>` : "") +
    (kommentar ? `<span class="kommentar">${kommentar}</span>` : "") +
    `</div>`;
}
// Die Umformung, die x-Terme nach links und Zahlen nach rechts bringt.
function umformung(mAb, zahlAb) {
  const teile = [];
  if (mAb !== 0) teile.push(`${mAb < 0 ? "+" : "−"} ${termRein(Math.abs(mAb), "x")}`);
  if (zahlAb !== 0) teile.push(`${zahlAb < 0 ? "+" : "−"} ${num(Math.abs(zahlAb))}`);
  return teile.length ? "| " + teile.join(", ") : "";
}

// ---------- Koordinatensystem ----------

function koordinaten(svg, opt) {
  const { links, oben, breite, hoehe, xMin, xMax, yMin, yMax, xSchritt = 1, ySchritt = 2 } = opt;
  const px = (x) => links + ((x - xMin) / (xMax - xMin)) * breite;
  const py = (y) => oben + hoehe - ((y - yMin) / (yMax - yMin)) * hoehe;

  for (let x = Math.ceil(xMin); x <= xMax; x += xSchritt) {
    svg.appendChild(svgEl("line", { x1: px(x).toFixed(2), y1: py(yMax).toFixed(2), x2: px(x).toFixed(2), y2: py(yMin).toFixed(2), class: "lgs-gitter" }));
    if (x !== 0 && x % (xSchritt * 2) === 0) svg.appendChild(svgText(px(x), py(0) + 14, num(x), { class: "lgs-achsentext" }));
  }
  for (let y = Math.ceil(yMin / ySchritt) * ySchritt; y <= yMax; y += ySchritt) {
    svg.appendChild(svgEl("line", { x1: px(xMin).toFixed(2), y1: py(y).toFixed(2), x2: px(xMax).toFixed(2), y2: py(y).toFixed(2), class: "lgs-gitter" }));
    if (y !== 0) svg.appendChild(svgText(px(0) - 7, py(y) + 4, num(y), { class: "lgs-achsentext", "text-anchor": "end" }));
  }
  svg.appendChild(svgEl("line", { x1: px(xMin).toFixed(2), y1: py(0).toFixed(2), x2: (px(xMax) + 12).toFixed(2), y2: py(0).toFixed(2), class: "lgs-achse" }));
  svg.appendChild(svgEl("line", { x1: px(0).toFixed(2), y1: py(yMin).toFixed(2), x2: px(0).toFixed(2), y2: (py(yMax) - 12).toFixed(2), class: "lgs-achse" }));
  svg.appendChild(svgText(px(0) - 7, py(0) + 14, "0", { class: "lgs-achsentext", "text-anchor": "end" }));
  svg.appendChild(svgText(px(xMax) + 12, py(0) + 20, "x", { class: "lgs-achsenname", "text-anchor": "end" }));
  svg.appendChild(svgText(px(0) + 9, py(yMax) + 10, "y", { class: "lgs-achsenname", "text-anchor": "start" }));
  return { px, py };
}

// Zeichnet eine Gerade y = m·x + b, am Fenster abgeschnitten.
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
    class: "lgs-gerade " + klasse,
  }));
}

// Schreibt den Namen einer Geraden an eine Stelle, an der sie auch wirklich
// im Ausschnitt verläuft — sonst stünde die Beschriftung im Leeren.
function geradeBeschriften(svg, g, m, b, xMin, xMax, yMin, yMax, name, klasse) {
  // Von rechts nach links die erste Stelle suchen, an der die Gerade im Bild
  // liegt und genug Abstand zur y-Achse hat — direkt an der Achse stünde die
  // Beschriftung sonst auf der Achse selbst.
  for (const abstand of [1.2, 0.4]) {
    for (let x = xMax - 0.7; x >= xMin + 0.7; x -= 0.5) {
      if (Math.abs(x) < abstand) continue;
      const y = m * x + b;
      if (y >= yMin + 0.8 && y <= yMax - 0.8) {
        svg.appendChild(svgText(g.px(x) - 8, g.py(y) - 9, name, { class: "lgs-punkttext " + klasse, "text-anchor": "end" }));
        return;
      }
    }
  }
}

function punktZeichnen(svg, g, x, y, klasse, beschriftung, rechts = true, oben = true) {
  svg.appendChild(svgEl("circle", { cx: g.px(x).toFixed(2), cy: g.py(y).toFixed(2), r: 5, class: "lgs-punkt " + klasse }));
  if (beschriftung) {
    svg.appendChild(svgText(g.px(x) + (rechts ? 9 : -9), g.py(y) + (oben ? -8 : 16), beschriftung, {
      class: "lgs-punkttext " + klasse, "text-anchor": rechts ? "start" : "end",
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

// Alle drei Verfahren zeigen ihre Rechnung Zeile für Zeile. Damit man den Weg
// wirklich verfolgt und nicht nur das Ergebnis abliest, ist anfangs nur die
// erste Zeile sichtbar.
function mountProtokoll(ids, baue) {
  const schritteEl = document.getElementById(ids.schritte);
  const bilanzEl = document.getElementById(ids.bilanz);
  const systemEl = ids.system ? document.getElementById(ids.system) : null;
  const mountEl = ids.mount ? document.getElementById(ids.mount) : null;
  let daten = null, gezeigt = 1;

  function zeichne() {
    schritteEl.innerHTML = daten.schritte.slice(0, gezeigt).join("");
    if (systemEl) systemEl.innerHTML = daten.systemHtml;
    if (mountEl) {
      mountEl.innerHTML = "";
      if (daten.bild) mountEl.appendChild(daten.bild());
    }
    const offen = daten.schritte.length - gezeigt;
    bilanzEl.innerHTML = offen === 0 ? daten.bilanz
      : `<em>Noch ${offen} Schritt${offen === 1 ? "" : "e"} bis zur Lösung — auf „Schritt weiter“ klicken.</em>`;
    document.getElementById(ids.schritt).disabled = offen === 0;
  }
  function neu() {
    daten = baue();
    gezeigt = 1;
    zeichne();
  }
  document.getElementById(ids.neu).addEventListener("click", neu);
  document.getElementById(ids.schritt).addEventListener("click", () => {
    if (gezeigt < daten.schritte.length) { gezeigt++; zeichne(); }
  });
  document.getElementById(ids.alle).addEventListener("click", () => {
    gezeigt = daten.schritte.length; zeichne();
  });
  return { neu };
}

// ================= 1. Was ist ein Gleichungssystem? =================

// Ein festes, überschaubares System. Die beiden Regler setzen ein Paar (x | y),
// und die Probe rechnet beide Gleichungen wirklich nach — sichtbar, mit
// eingesetzten Zahlen, nicht nur mit Häkchen.
const SY = { a1: 1, b1: 1, c1: 5, a2: 2, b2: -1, c2: 1, x: 2, y: 3 };

function syBild(xp, yp) {
  const B = 460, H = 300;
  const svg = neueFlaeche(B, H);
  const xMin = -4, xMax = 6, yMin = -4, yMax = 7;
  const g = koordinaten(svg, { links: 44, oben: 26, breite: 366, hoehe: 246, xMin, xMax, yMin, yMax });
  const m1 = -SY.a1 / SY.b1, n1 = SY.c1 / SY.b1;
  const m2 = -SY.a2 / SY.b2, n2 = SY.c2 / SY.b2;
  geradeZeichnen(svg, g, m1, n1, xMin, xMax, yMin, yMax, "g");
  geradeZeichnen(svg, g, m2, n2, xMin, xMax, yMin, yMax, "h");
  geradeBeschriften(svg, g, m1, n1, xMin, xMax, yMin, yMax, "I", "g");
  geradeBeschriften(svg, g, m2, n2, xMin, xMax, yMin, yMax, "II", "h");
  punktZeichnen(svg, g, SY.x, SY.y, "null", `Lösung (${num(SY.x)} | ${num(SY.y)})`, false, true);
  const trifft = xp === SY.x && yp === SY.y;
  if (!trifft) punktZeichnen(svg, g, xp, yp, "offen", `(${num(xp)} | ${num(yp)})`, true, false);
  svg.appendChild(svgText(B / 2, 16, "Jede Gleichung ist eine Gerade — die Lösung ist ihr Schnittpunkt", { class: "lgs-achsenname lgs-titel" }));
  return svg;
}

function renderSystem() {
  const xp = Number(document.getElementById("sy-x").value);
  const yp = Number(document.getElementById("sy-y").value);
  document.getElementById("sy-x-anzeige").textContent = num(xp);
  document.getElementById("sy-y-anzeige").textContent = num(yp);

  document.getElementById("sy-system").innerHTML = systemHtml([
    { nr: "I", klasse: "eins", html: gleichungHtml(SY.a1, SY.b1, SY.c1) },
    { nr: "II", klasse: "zwei", html: gleichungHtml(SY.a2, SY.b2, SY.c2) },
  ]);

  const mount = document.getElementById("sy-mount");
  mount.innerHTML = "";
  mount.appendChild(syBild(xp, yp));

  const linksI = SY.a1 * xp + SY.b1 * yp;
  const linksII = SY.a2 * xp + SY.b2 * yp;
  const okI = linksI === SY.c1, okII = linksII === SY.c2;
  document.getElementById("sy-probe").innerHTML =
    schrittZeile(`I:&nbsp; ${einsetzenXY(SY.a1, xp, SY.b1, yp)} = <span class="rv">${num(linksI)}</span>`,
      okI ? `= ${num(SY.c1)} ✓` : `≠ ${num(SY.c1)} ✗`, okI ? "fertig" : "") +
    schrittZeile(`II:&nbsp; ${einsetzenXY(SY.a2, xp, SY.b2, yp)} = <span class="rv">${num(linksII)}</span>`,
      okII ? `= ${num(SY.c2)} ✓` : `≠ ${num(SY.c2)} ✗`, okII ? "fertig" : "");

  const karten = document.getElementById("sy-karten");
  karten.innerHTML = "";
  karten.appendChild(karte("x", "geprüftes x", num(xp)));
  karten.appendChild(karte("y", "geprüftes y", num(yp)));
  karten.appendChild(karte("g", "Gleichung I", okI ? "erfüllt" : "nicht erfüllt"));
  karten.appendChild(karte("h", "Gleichung II", okII ? "erfüllt" : "nicht erfüllt"));

  const text = document.getElementById("sy-text");
  if (okI && okII) {
    text.innerHTML = `<span class="lgs-urteil ja">✓ (${num(xp)} | ${num(yp)}) ist die Lösung des Systems</span> ` +
      `Das Paar erfüllt beide Gleichungen — im Bild liegt der Punkt auf beiden Geraden.`;
  } else if (okI || okII) {
    text.innerHTML = `<span class="lgs-urteil nein">✗ keine Lösung des Systems</span> ` +
      `Das Paar erfüllt nur Gleichung ${okI ? "I" : "II"}, nicht aber ${okI ? "II" : "I"}. ` +
      `Im Bild liegt der Punkt auf <em>einer</em> der beiden Geraden — das genügt nicht.`;
  } else {
    text.innerHTML = `<span class="lgs-urteil nein">✗ keine Lösung des Systems</span> ` +
      `Das Paar erfüllt keine der beiden Gleichungen; der Punkt liegt auf keiner der Geraden.`;
  }
}

function initSystem() {
  ["sy-x", "sy-y"].forEach((id) => document.getElementById(id).addEventListener("input", renderSystem));
  renderSystem();
}

// ================= 2. Gleichsetzungsverfahren =================

// Beispiele werden konstruktiv erzeugt: Erst steht die Lösung fest, dann werden
// die Achsenabschnitte dazu berechnet. So ist x garantiert ganzzahlig.
const GS_KANDIDATEN = (() => {
  const liste = [];
  for (let m1 = -4; m1 <= 4; m1++) {
    if (m1 === 0) continue;
    for (let m2 = -4; m2 <= 4; m2++) {
      if (m2 === 0 || m1 === m2) continue;
      for (let x0 = -3; x0 <= 4; x0++) {
        if (x0 === 0) continue;
        for (let y0 = -4; y0 <= 5; y0++) {
          const b1 = y0 - m1 * x0, b2 = y0 - m2 * x0;
          if (b1 === 0 || b2 === 0 || b1 === b2) continue;
          if (Math.abs(b1) > 9 || Math.abs(b2) > 9) continue;
          liste.push({ m1, b1, m2, b2, x0, y0 });
        }
      }
    }
  }
  return liste;
})();

function gsBaue() {
  const { m1, b1, m2, b2, x0, y0 } = pick(GS_KANDIDATEN);
  const dm = m1 - m2, db = b2 - b1;
  const schritte = [
    schrittZeile(`${summe([{ neg: m1 < 0, text: varTerm(m1, "x") }, { neg: b1 < 0, text: zahlTeil(b1) }])} = ${summe([{ neg: m2 < 0, text: varTerm(m2, "x") }, { neg: b2 < 0, text: zahlTeil(b2) }])}`,
      "gleichsetzen", "",
      "Beide Gleichungen sind nach y aufgelöst, und beide rechten Seiten beschreiben denselben Wert y — im Schnittpunkt sind sie also gleich groß. Jetzt steht dort eine Gleichung mit nur noch einer Unbekannten."),
    schrittZeile(`${signTerm(dm, "x")} = <span class="rv">${num(db)}</span>`,
      umformung(m2, b1), "", "x-Terme nach links, Zahlen nach rechts — die üblichen Äquivalenzumformungen."),
    schrittZeile(`<span class="xv">x</span> = ${bruchErgebnis(db, dm, x0)}`,
      `| : ${klammer(dm)}`),
    schrittZeile(`<span class="yv">y</span> = ${einsetzenLinear(m1, x0, b1)} = <span class="rv">${num(y0)}</span>`,
      "x in I einsetzen"),
    schrittZeile(`Probe in II:&nbsp; ${einsetzenLinear(m2, x0, b2)} = ${num(m2 * x0 + b2)}`,
      `= y ✓`, "fertig",
      "Gleichung II wurde beim Rechnen nur einmal benutzt — die Probe prüft sie noch einmal unabhängig."),
    schrittZeile(`L = { (<span class="xv">${num(x0)}</span> | <span class="yv">${num(y0)}</span>) }`, "Lösungsmenge", "fertig"),
  ];
  return {
    schritte,
    systemHtml: systemHtml([
      { nr: "I", klasse: "eins", html: nachYHtml(m1, b1) },
      { nr: "II", klasse: "zwei", html: nachYHtml(m2, b2) },
    ]),
    bild: () => {
      const B = 420, H = 280;
      const svg = neueFlaeche(B, H);
      const xMin = -5, xMax = 5, yMin = -8, yMax = 8;
      const g = koordinaten(svg, { links: 44, oben: 26, breite: 336, hoehe: 226, xMin, xMax, yMin, yMax });
      geradeZeichnen(svg, g, m1, b1, xMin, xMax, yMin, yMax, "g");
      geradeZeichnen(svg, g, m2, b2, xMin, xMax, yMin, yMax, "h");
      geradeBeschriften(svg, g, m1, b1, xMin, xMax, yMin, yMax, "I", "g");
      geradeBeschriften(svg, g, m2, b2, xMin, xMax, yMin, yMax, "II", "h");
      if (x0 >= xMin && x0 <= xMax && y0 >= yMin && y0 <= yMax) {
        // Liegt der Punkt nahe an der x-Achse, gehoert die Beschriftung unter
        // ihn — oberhalb schnitte sie sonst die Achse samt ihren Zahlen.
        punktZeichnen(svg, g, x0, y0, "null", `(${num(x0)} | ${num(y0)})`, x0 < 2, y0 > 0);
      }
      svg.appendChild(svgText(B / 2, 16, "I grün, II blau — der rote Punkt ist die Lösung", { class: "lgs-achsenname lgs-titel" }));
      return svg;
    },
    bilanz: `<strong>Ergebnis:</strong> <span class="wx">x = ${num(x0)}</span>, <span class="wy">y = ${num(y0)}</span>. ` +
      `Beide Geraden treffen sich im Punkt (${num(x0)} | ${num(y0)}); dieses Paar erfüllt Gleichung I <em>und</em> Gleichung II. ` +
      `Weil die Steigungen ${num(m1)} und ${num(m2)} verschieden sind, gibt es genau einen solchen Punkt.`,
  };
}

function initGleichsetzen() {
  mountProtokoll({ neu: "gs-neu", schritt: "gs-schritt", alle: "gs-alle", schritte: "gs-schritte", bilanz: "gs-bilanz", system: "gs-system", mount: "gs-mount" }, gsBaue).neu();
}

// ================= 3. Einsetzungsverfahren =================

// Gebaut wird der Fall, für den das Verfahren gemacht ist: In Gleichung I steht
// y allein, also mit dem Koeffizienten 1.
const ES_KANDIDATEN = (() => {
  const liste = [];
  for (let a1 = -3; a1 <= 3; a1++) {
    if (a1 === 0) continue;
    for (let a2 = -4; a2 <= 4; a2++) {
      if (a2 === 0) continue;
      for (let b2 = -4; b2 <= 4; b2++) {
        if (b2 === 0 || b2 === 1 || a2 - a1 * b2 === 0) continue;
        for (let x0 = -3; x0 <= 4; x0++) {
          if (x0 === 0) continue;
          for (let y0 = -4; y0 <= 5; y0++) {
            if (y0 === 0) continue;
            const c1 = a1 * x0 + y0, c2 = a2 * x0 + b2 * y0;
            if (c1 === 0 || c2 === 0) continue;
            if (Math.abs(c1) > 12 || Math.abs(c2) > 24) continue;
            liste.push({ a1, a2, b2, c1, c2, x0, y0 });
          }
        }
      }
    }
  }
  return liste;
})();

function esBaue() {
  const { a1, a2, b2, c1, c2, x0, y0 } = pick(ES_KANDIDATEN);
  // y = c1 − a1·x, eingesetzt in II: a2·x + b2·(c1 − a1·x) = c2
  const nenner = a2 - a1 * b2, zaehler = c2 - b2 * c1;
  const termHtml = summe([{ neg: c1 < 0, text: zahlTeil(c1) }, { neg: a1 > 0, text: varTerm(a1, "x") }]);
  const schritte = [
    schrittZeile(`<span class="yv">y</span> = ${termHtml}`, `I ${umformung(a1, 0)}`, "",
      "In Gleichung I steht y mit dem Koeffizienten 1 — dort lässt sich am bequemsten auflösen."),
    schrittZeile(`${signTerm(a2, "x")} ${b2 < 0 ? "−" : "+"} ${Math.abs(b2) === 1 ? "" : num(Math.abs(b2)) + " · "}(${termHtml}) = <span class="rv">${num(c2)}</span>`,
      "in II einsetzen", "",
      "Der eingesetzte Term steht in Klammern — er ersetzt ein einziges y, und die Klammer hält ihn zusammen."),
    schrittZeile(`${summe([{ neg: a2 < 0, text: varTerm(a2, "x") }, { neg: b2 * c1 < 0, text: zahlTeil(b2 * c1) }, { neg: b2 * a1 > 0, text: varTerm(b2 * a1, "x") }])} = <span class="rv">${num(c2)}</span>`,
      "ausmultiplizieren", "", "Der Faktor trifft <em>beide</em> Summanden in der Klammer."),
    schrittZeile(`${signTerm(nenner, "x")} = <span class="rv">${num(zaehler)}</span>`,
      umformung(0, b2 * c1), "", "Zusammenfassen: Aus zwei x-Summanden wird einer."),
    schrittZeile(`<span class="xv">x</span> = ${bruchErgebnis(zaehler, nenner, x0)}`, `| : ${klammer(nenner)}`),
    schrittZeile(`<span class="yv">y</span> = ${num(c1)} ${a1 < 0 ? "+" : "−"} ${Math.abs(a1) === 1 ? "" : num(Math.abs(a1)) + " · "}${klammer(x0)} = <span class="rv">${num(y0)}</span>`,
      "x in die aufgelöste Gleichung"),
    schrittZeile(`Probe in II:&nbsp; ${einsetzenXY(a2, x0, b2, y0)} = ${num(a2 * x0 + b2 * y0)}`, `= ${num(c2)} ✓`, "fertig"),
    schrittZeile(`L = { (<span class="xv">${num(x0)}</span> | <span class="yv">${num(y0)}</span>) }`, "Lösungsmenge", "fertig"),
  ];
  return {
    schritte,
    systemHtml: systemHtml([
      { nr: "I", klasse: "eins", html: gleichungHtml(a1, 1, c1) },
      { nr: "II", klasse: "zwei", html: gleichungHtml(a2, b2, c2) },
    ]),
    bilanz: `<strong>Ergebnis:</strong> <span class="wx">x = ${num(x0)}</span>, <span class="wy">y = ${num(y0)}</span>. ` +
      `Probe in I: ${einsetzenXY(a1, x0, 1, y0)} = ${num(a1 * x0 + y0)} = ${num(c1)} ✓. ` +
      `Beide Gleichungen sind erfüllt, also ist (${num(x0)} | ${num(y0)}) die Lösung.`,
  };
}

function initEinsetzen() {
  mountProtokoll({ neu: "es-neu", schritt: "es-schritt", alle: "es-alle", schritte: "es-schritte", bilanz: "es-bilanz", system: "es-system" }, esBaue).neu();
}

// ================= 4. Additionsverfahren =================

const AD_KANDIDATEN = (() => {
  const liste = [];
  for (let a1 = -4; a1 <= 4; a1++) {
    if (a1 === 0) continue;
    for (let b1 = -4; b1 <= 4; b1++) {
      if (b1 === 0) continue;
      for (let a2 = -4; a2 <= 4; a2++) {
        if (a2 === 0) continue;
        for (let b2 = -4; b2 <= 4; b2++) {
          if (b2 === 0 || a1 * b2 - a2 * b1 === 0) continue;
          liste.push({ a1, b1, a2, b2 });
        }
      }
    }
  }
  return liste;
})();

let adWelche = "y";   // welche Unbekannte weggehoben werden soll
let adDaten = null;   // das aktuelle System — der Schalter behält es bei
let adBehalten = false;

function adBeispiel() {
  const g = pick(AD_KANDIDATEN);
  const x0 = pick([-3, -2, -1, 1, 2, 3, 4]);
  const y0 = pick([-3, -2, -1, 1, 2, 3, 4]);
  return Object.assign({}, g, { x0, y0, c1: g.a1 * x0 + g.b1 * y0, c2: g.a2 * x0 + g.b2 * y0 });
}

function adBaue() {
  if (!adBehalten || !adDaten) adDaten = adBeispiel();
  adBehalten = false;
  const { a1, b1, a2, b2, c1, c2, x0, y0 } = adDaten;
  const wegY = adWelche === "y";
  const p1 = wegY ? b1 : a1, p2 = wegY ? b2 : a2;
  const g = ggt(p1, p2) || 1;
  let k1 = p2 / g, k2 = -p1 / g;
  if (k1 < 0 && k2 < 0) { k1 = -k1; k2 = -k2; }
  const bleibtName = wegY ? "x" : "y";
  const andererName = wegY ? "y" : "x";
  const summeKoeff = (wegY ? a1 : b1) * k1 + (wegY ? a2 : b2) * k2;
  const summeRechts = c1 * k1 + c2 * k2;
  const wert = wegY ? x0 : y0;
  const anderer = wegY ? y0 : x0;
  const mal = (k) => (k === 1 ? "unverändert" : `· ${klammer(k)}`);
  const wegKoeff = p1 * k1;

  const schritte = [
    schrittZeile(`<strong>Ziel:</strong> das <span class="${wegY ? "yv" : "xv"}">${adWelche}</span> wegheben`,
      "Plan", "",
      `Weggehoben werden soll <strong>${adWelche}</strong>. Dazu müssen die Koeffizienten ${num(p1)} und ${num(p2)} entgegengesetzt gleich werden — das kleinste gemeinsame Vielfache ist ${num(Math.abs(p1 * p2) / g)}.`),
    schrittZeile(`I:&nbsp; ${gleichungHtml(a1 * k1, b1 * k1, c1 * k1)}<br>II:&nbsp; ${gleichungHtml(a2 * k2, b2 * k2, c2 * k2)}`,
      `I ${mal(k1)}, II ${mal(k2)}`, "",
      `Jetzt stehen bei ${adWelche} die Koeffizienten ${num(wegKoeff)} und ${num(-wegKoeff)} — ihre Summe ist 0.`),
    schrittZeile(`${signTerm(summeKoeff, bleibtName)} = <span class="rv">${num(summeRechts)}</span>`,
      "I + II", "", `Links plus links, rechts plus rechts. Das ${adWelche} fällt weg.`),
    schrittZeile(`<span class="${wegY ? "xv" : "yv"}">${bleibtName}</span> = ${bruchErgebnis(summeRechts, summeKoeff, wert)}`,
      `| : ${klammer(summeKoeff)}`),
    schrittZeile(`<span class="${wegY ? "yv" : "xv"}">${andererName}</span> = <span class="rv">${num(anderer)}</span>`,
      `${bleibtName} = ${num(wert)} in I einsetzen`, "",
      `Eingesetzt in I: ${einsetzenXY(a1, x0, b1, y0)} = ${num(c1)} ✓`),
    schrittZeile(`Probe in II:&nbsp; ${einsetzenXY(a2, x0, b2, y0)} = ${num(a2 * x0 + b2 * y0)}`, `= ${num(c2)} ✓`, "fertig"),
    schrittZeile(`L = { (<span class="xv">${num(x0)}</span> | <span class="yv">${num(y0)}</span>) }`, "Lösungsmenge", "fertig"),
  ];
  return {
    schritte,
    systemHtml: systemHtml([
      { nr: "I", klasse: "eins", html: gleichungHtml(a1, b1, c1) },
      { nr: "II", klasse: "zwei", html: gleichungHtml(a2, b2, c2) },
    ]),
    bilanz: `<strong>Ergebnis:</strong> <span class="wx">x = ${num(x0)}</span>, <span class="wy">y = ${num(y0)}</span>. ` +
      `Hier wurde ${adWelche} weggehoben. Stelle den Schalter um: Der Rechenweg sieht anders aus, ` +
      `das Ergebnis darf sich aber nicht ändern — beide Wege beschreiben dasselbe System.`,
  };
}

function initAddieren() {
  const schalter = document.getElementById("ad-schalter");
  const p = mountProtokoll({ neu: "ad-neu", schritt: "ad-schritt", alle: "ad-alle", schritte: "ad-schritte", bilanz: "ad-bilanz", system: "ad-system" }, adBaue);
  function zeichneSchalter() {
    schalter.innerHTML = "";
    [["y", "y wegheben"], ["x", "x wegheben"]].forEach(([wert, name]) => {
      const b = el("button", { type: "button", class: adWelche === wert ? "aktiv" : "" }, name);
      b.addEventListener("click", () => {
        adWelche = wert;
        adBehalten = true;   // dasselbe System, anderer Weg
        zeichneSchalter();
        p.neu();
      });
      schalter.appendChild(b);
    });
  }
  zeichneSchalter();
  p.neu();
}

// ================= 5. Die drei Lösungsfälle =================

const FA = { m1: 2, b1: -1 };

function faBild(m2, b2, hatSchnitt, xs, ys, xMinAus) {
  const B = 460, H = 300;
  const svg = neueFlaeche(B, H);
  const xMin = -5, xMax = 5, yMin = -8, yMax = 8;
  const g = koordinaten(svg, { links: 44, oben: 26, breite: 366, hoehe: 246, xMin, xMax, yMin, yMax });
  const gleich = m2 === FA.m1 && b2 === FA.b1;
  // Bei identischen Geraden liegt eine auf der anderen: erst die dicke grüne,
  // dann die gestrichelte blaue darüber — sonst sähe man nur eine Gerade und
  // wüsste nicht, dass es zwei sind.
  geradeZeichnen(svg, g, FA.m1, FA.b1, xMin, xMax, yMin, yMax, "g");
  geradeZeichnen(svg, g, m2, b2, xMin, xMax, yMin, yMax, gleich ? "h blass" : "h");
  geradeBeschriften(svg, g, FA.m1, FA.b1, xMin, xMax, yMin, yMax, "I", "g");
  if (!gleich) geradeBeschriften(svg, g, m2, b2, xMin, xMax, yMin, yMax, "II", "h");
  if (hatSchnitt && !xMinAus) {
    punktZeichnen(svg, g, xs.wert, ys.wert, "null", `(${bruchRein(xs.z, xs.n)} | ${bruchRein(ys.z, ys.n)})`, xs.wert < 2, ys.wert > 0);
  }
  const titel = gleich ? "dieselbe Gerade — unendlich viele Lösungen"
    : m2 === FA.m1 ? "parallel — keine Lösung"
      : xMinAus ? "genau eine Lösung — sie liegt außerhalb des Ausschnitts"
        : "genau eine Lösung — der Schnittpunkt";
  svg.appendChild(svgText(B / 2, 16, titel, { class: "lgs-achsenname lgs-titel" }));
  return svg;
}

function renderFaelle() {
  const m2 = Number(document.getElementById("fa-m2").value);
  const b2 = Number(document.getElementById("fa-b2").value);
  document.getElementById("fa-m2-anzeige").textContent = num(m2);
  document.getElementById("fa-b2-anzeige").textContent = num(b2);

  document.getElementById("fa-system").innerHTML = systemHtml([
    { nr: "I", klasse: "eins", html: nachYHtml(FA.m1, FA.b1) },
    { nr: "II", klasse: "zwei", html: nachYHtml(m2, b2) },
  ]);

  const dm = FA.m1 - m2, db = b2 - FA.b1;
  const hatSchnitt = dm !== 0;
  // Der Schnittpunkt wird exakt als Bruch geführt: x = db : dm und
  // y = (m1·db + b1·dm) : dm. Gerundet angezeigt würde das Bild eine
  // Genauigkeit behaupten, die die Rechnung gar nicht hat.
  const xs = { z: db, n: dm, wert: hatSchnitt ? db / dm : 0 };
  const ys = { z: FA.m1 * db + FA.b1 * dm, n: dm, wert: 0 };
  ys.wert = hatSchnitt ? ys.z / ys.n : 0;
  const draussen = hatSchnitt && (xs.wert < -5 || xs.wert > 5 || ys.wert < -8 || ys.wert > 8);

  const mount = document.getElementById("fa-mount");
  mount.innerHTML = "";
  mount.appendChild(faBild(m2, b2, hatSchnitt, xs, ys, draussen));

  const gleichsetzen = schrittZeile(
    `${summe([{ neg: FA.m1 < 0, text: varTerm(FA.m1, "x") }, { neg: FA.b1 < 0, text: zahlTeil(FA.b1) }])} = ${summe([{ neg: m2 < 0, text: varTerm(m2, "x") }, { neg: b2 < 0, text: zahlTeil(b2) }])}`,
    "gleichsetzen");
  let rest, fall, urteil;
  if (hatSchnitt) {
    rest = schrittZeile(`${signTerm(dm, "x")} = <span class="rv">${num(db)}</span> → <span class="xv">x</span> = ${bruchText(xs.z, xs.n)}, <span class="yv">y</span> = ${bruchText(ys.z, ys.n)}`,
      `${umformung(m2, FA.b1)}, : ${klammer(dm)}`, "fertig");
    fall = 0;
    urteil = `<span class="lgs-urteil ja">genau eine Lösung</span> Die Steigungen ${num(FA.m1)} und ${num(m2)} sind verschieden — die Geraden schneiden sich in genau einem Punkt` +
      (draussen ? `, der hier außerhalb des gezeigten Ausschnitts liegt.` : `.`);
  } else if (db !== 0) {
    rest = schrittZeile(`0 = <span class="rv">${num(db)}</span>`, umformung(m2, FA.b1), "",
      "Das x ist auf beiden Seiten weggefallen, und übrig bleibt eine <strong>falsche</strong> Aussage.");
    fall = 1;
    urteil = `<span class="lgs-urteil nein">keine Lösung</span> Gleiche Steigung, verschiedene y-Achsenabschnitte: Die Geraden sind parallel. ` +
      `Senkrecht übereinander liegen sie überall um ${num(Math.abs(db))} auseinander.`;
  } else {
    rest = schrittZeile(`0 = <span class="rv">0</span>`, umformung(m2, FA.b1), "",
      "Das x ist weggefallen, und übrig bleibt eine <strong>wahre</strong> Aussage.");
    fall = 2;
    urteil = `<span class="lgs-urteil ja">unendlich viele Lösungen</span> Beide Gleichungen beschreiben dieselbe Gerade. ` +
      `Jedes Paar auf ihr löst das System, zum Beispiel (0 | ${num(FA.b1)}) und (1 | ${num(FA.m1 + FA.b1)}).`;
  }
  document.getElementById("fa-schritte").innerHTML = gleichsetzen + rest;

  const beschreibung = [
    { t: "Genau eine Lösung", m: "x = Zahl", p: "Die Geraden schneiden sich. Die Steigungen sind verschieden." },
    { t: "Keine Lösung", m: "0 = 7 (falsch)", p: "Die Geraden sind parallel: gleiche Steigung, verschiedene Achsenabschnitte." },
    { t: "Unendlich viele Lösungen", m: "0 = 0 (wahr)", p: "Die Geraden sind identisch: gleiche Steigung, gleicher Achsenabschnitt." },
  ];
  document.getElementById("fa-faelle").innerHTML = beschreibung.map((f, i) =>
    `<div class="lgs-fall${i === fall ? " aktiv" : ""}"><h4>${i === fall ? "▸ " : ""}${f.t}</h4>` +
    `<p>Am Ende steht <span class="merkmal">${f.m}</span></p><p>${f.p}</p></div>`).join("");

  document.getElementById("fa-text").innerHTML = urteil;
}

function initFaelle() {
  ["fa-m2", "fa-b2"].forEach((id) => document.getElementById(id).addEventListener("input", renderFaelle));
  renderFaelle();
}

// ================= 6. Ein Gleichungssystem aufstellen =================

const AU_AUFGABEN = [
  {
    name: "Eintrittskarten",
    text: "Zwei Erwachsene und drei Kinder zahlen im Freibad zusammen 31 €. Ein Erwachsener und fünf Kinder zahlen 33 €. Wie teuer ist jede Karte?",
    benennung: "x sei der Preis einer Erwachsenenkarte in Euro, y der Preis einer Kinderkarte in Euro.",
    zeilen: [[2, 3, 31], [1, 5, 33]],
    x: 8, y: 5,
    verfahren: "Hier ist das Einsetzungsverfahren bequem: In II steht x mit dem Koeffizienten 1.",
    antwort: "Eine Erwachsenenkarte kostet 8 €, eine Kinderkarte 5 €.",
    probe: "2 · 8 € + 3 · 5 € = 16 € + 15 € = 31 € ✓ und 8 € + 5 · 5 € = 8 € + 25 € = 33 € ✓",
  },
  {
    name: "Zahlenrätsel",
    text: "Die Summe zweier Zahlen ist 21. Die größere ist um 5 größer als die kleinere. Wie heißen die beiden Zahlen?",
    benennung: "x sei die größere, y die kleinere Zahl.",
    zeilen: [[1, 1, 21], [1, -1, 5]],
    x: 13, y: 8,
    verfahren: "Hier geht das Additionsverfahren am schnellsten: Die y-Koeffizienten sind schon entgegengesetzt gleich, also I + II rechnen.",
    antwort: "Die Zahlen sind 13 und 8.",
    probe: "13 + 8 = 21 ✓ und 13 − 8 = 5 ✓",
  },
  {
    name: "Tiere auf der Weide",
    text: "Auf einer Weide stehen Hühner und Schafe, zusammen 20 Tiere mit 56 Beinen. Wie viele Tiere jeder Art sind es?",
    benennung: "x sei die Anzahl der Hühner, y die Anzahl der Schafe.",
    zeilen: [[1, 1, 20], [2, 4, 56]],
    x: 12, y: 8,
    verfahren: "I mit (−2) multiplizieren und addieren — dann fällt x weg. Die erste Gleichung zählt die Tiere, die zweite die Beine.",
    antwort: "Es sind 12 Hühner und 8 Schafe.",
    probe: "12 + 8 = 20 ✓ und 2 · 12 + 4 · 8 = 24 + 32 = 56 ✓",
  },
  {
    name: "Zwei Handytarife",
    text: "Tarif A kostet 8 € Grundgebühr und 10 ct je Minute, Tarif B kostet 3 € Grundgebühr und 20 ct je Minute. Bei welcher Gesprächsdauer kosten beide gleich viel, und wie hoch ist der Betrag?",
    benennung: "x sei die Gesprächsdauer in Minuten, y der Betrag in Euro.",
    formen: ["8 + 0,1", "3 + 0,2"],
    x: 50, y: 13,
    verfahren: "Beide Gleichungen sind schon nach y aufgelöst — das ist der Fall für das Gleichsetzungsverfahren: 8 + 0,1x = 3 + 0,2x, also 5 = 0,1x.",
    antwort: "Bei 50 Minuten kosten beide Tarife gleich viel, nämlich 13 €.",
    probe: "8 € + 50 · 0,10 € = 13 € ✓ und 3 € + 50 · 0,20 € = 13 € ✓",
  },
];

function renderAufstellen() {
  const nr = Number(document.getElementById("au-nr").value);
  const a = AU_AUFGABEN[nr];
  document.getElementById("au-nr-anzeige").textContent = a.name;
  document.getElementById("au-text").innerHTML = `<strong>Aufgabe:</strong> ${a.text}`;

  document.getElementById("au-system").innerHTML = a.formen
    ? systemHtml(a.formen.map((f, i) => ({
      nr: i ? "II" : "I", klasse: i ? "zwei" : "eins",
      html: `<span class="yv">y</span> = ${f}<span class="xv">x</span>`,
    })))
    : systemHtml(a.zeilen.map((z, i) => ({
      nr: i ? "II" : "I", klasse: i ? "zwei" : "eins",
      html: gleichungHtml(z[0], z[1], z[2]),
    })));

  document.getElementById("au-schritte").innerHTML =
    schrittZeile(`<strong>1. Benennen</strong>`, "was ist gesucht?", "", a.benennung) +
    schrittZeile(`<strong>2. Übersetzen</strong>`, "zwei Angaben, zwei Gleichungen", "",
      "Jede Angabe des Textes wird zu einer Gleichung — beide mit denselben Bezeichnungen x und y.") +
    schrittZeile(`<strong>3. Rechnen</strong> → <span class="xv">x = ${num(a.x)}</span>, <span class="yv">y = ${num(a.y)}</span>`,
      "passendes Verfahren", "fertig", a.verfahren) +
    schrittZeile(`<strong>4. Antworten</strong>`, "mit Einheit, in einem Satz", "fertig", a.antwort);

  document.getElementById("au-bilanz").innerHTML =
    `<strong>Probe am Text:</strong> ${a.probe}<br>` +
    `<span class="wg">Beide Angaben des Textes stimmen.</span> Erst damit ist die Aufgabe fertig — ` +
    `die Probe in den Gleichungen allein würde einen Fehler beim <em>Aufstellen</em> nicht finden, ` +
    `denn falsche Gleichungen sind in sich stimmig.`;
}

function initAufstellen() {
  document.getElementById("au-nr").addEventListener("input", renderAufstellen);
  renderAufstellen();
}

// ================= 7. Gestaffelte Übungsaufgaben =================

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

// Ein Geldbetrag: 19,60 € statt 19,6 €.
function euro(x) {
  return Number.isInteger(x)
    ? num(x)
    : x.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace("-", "−");
}

// Aufgabe 1 — Gleichsetzungsverfahren, gesucht ist x.
const A1_KANDIDATEN = GS_KANDIDATEN.filter((k) => Math.abs(k.m1 - k.m2) <= 6);

function generateAufgabe1() {
  const k = ohneKollision(A1_KANDIDATEN, (v) => [v.x0, -v.x0, v.y0, v.b2 - v.b1, v.m1 - v.m2], A1_KANDIDATEN[0]);
  const { m1, b1, m2, b2, x0, y0 } = k;
  return {
    promptHtml: `Löse das Gleichungssystem durch Gleichsetzen:<br>` +
      `<strong>I:&nbsp; ${nachYRein(m1, b1)}</strong><br>` +
      `<strong>II:&nbsp; ${nachYRein(m2, b2)}</strong><br>` +
      `Wie groß ist <strong>x</strong>?`,
    correct: x0,
    tolerance: 0.001,
    placeholder: "x = ?",
    hinweis: (raw, val) => {
      if (Math.abs(val + x0) < 0.001) {
        return `Das Vorzeichen stimmt nicht. Achte darauf, auf welcher Seite die Terme landen: ` +
          `Aus ${termRein(m1, "x")} ${b1 < 0 ? "− " + num(-b1) : "+ " + num(b1)} = ${termRein(m2, "x")} ${b2 < 0 ? "− " + num(-b2) : "+ " + num(b2)} ` +
          `wird ${termRein(m1 - m2, "x")} = ${num(b2 - b1)}.`;
      }
      if (Math.abs(val - y0) < 0.001) return "Das ist der y-Wert der Lösung. Gefragt war x — der Wert, den du <em>zuerst</em> berechnest.";
      if (Math.abs(val - (b2 - b1)) < 0.001) return `Du hast nur die Zahlen zusammengefasst. Es fehlt noch die Division durch den Koeffizienten ${num(m1 - m2)}.`;
      if (Math.abs(val - (m1 - m2)) < 0.001) return "Das ist der Koeffizient vor dem x, nicht der Wert von x. Durch ihn musst du noch teilen.";
      return "Setze die rechten Seiten gleich, bringe alle x nach links und alle Zahlen nach rechts, und teile dann durch den Koeffizienten vor dem x.";
    },
    tipps: [
      "Beide Gleichungen sind schon nach y aufgelöst. Dasselbe y kann nur einen Wert haben — also sind die beiden rechten Seiten gleich.",
      `Schreibe ${termRein(m1, "x")} ${b1 < 0 ? "− " + num(-b1) : "+ " + num(b1)} = ${termRein(m2, "x")} ${b2 < 0 ? "− " + num(-b2) : "+ " + num(b2)} und sortiere: x nach links, Zahlen nach rechts.`,
      `Übrig bleibt ${termRein(m1 - m2, "x")} = ${num(b2 - b1)}. Jetzt nur noch durch ${klammer(m1 - m2)} teilen.`,
    ],
    musterloesungHtml:
      `<strong>1. Gleichsetzen:</strong> ${termRein(m1, "x")} ${b1 < 0 ? "− " + num(-b1) : "+ " + num(b1)} = ${termRein(m2, "x")} ${b2 < 0 ? "− " + num(-b2) : "+ " + num(b2)}<br>` +
      `<strong>2. Sortieren:</strong> ${termRein(m1 - m2, "x")} = ${num(b2 - b1)}<br>` +
      `<strong>3. Teilen:</strong> | : ${klammer(m1 - m2)} →&nbsp; <strong>x = ${num(x0)}</strong><br>` +
      `<strong>4. y berechnen:</strong> y = ${faktor(einsetzenLinear(m1, x0, b1))} = ${num(y0)}<br>` +
      `<em>Probe in II:</em> ${faktor(einsetzenLinear(m2, x0, b2))} = ${num(y0)} ✓ — die Lösung ist (${num(x0)} | ${num(y0)}).`,
  };
}

// Aufgabe 2 — Die Probe: Erfüllt ein angebotenes Paar beide Gleichungen?
// Der Kern der Aufgabe ist das „und“: Eine erfüllte Gleichung genügt nicht.
const A2_KANDIDATEN = (() => {
  const liste = [];
  for (let a1 = -3; a1 <= 3; a1++) {
    if (a1 === 0) continue;
    for (let b1 = -3; b1 <= 3; b1++) {
      if (b1 === 0) continue;
      for (let a2 = -3; a2 <= 3; a2++) {
        if (a2 === 0) continue;
        for (let b2 = -3; b2 <= 3; b2++) {
          if (b2 === 0 || a1 * b2 - a2 * b1 === 0) continue;
          for (const x0 of [-3, -2, -1, 1, 2, 3]) {
            for (const y0 of [-3, -2, -1, 1, 2, 3]) {
              if (x0 === y0) continue;
              const c1 = a1 * x0 + b1 * y0, c2 = a2 * x0 + b2 * y0;
              if (Math.abs(c1) > 15 || Math.abs(c2) > 15) continue;
              liste.push({ a1, b1, a2, b2, c1, c2, x0, y0 });
            }
          }
        }
      }
    }
  }
  return liste;
})();

// Wie das angebotene Paar vom Schnittpunkt abweicht. „I“ heißt: Es liegt auf
// der ersten Geraden, aber nicht auf der zweiten — genau der lehrreiche Fall.
// Die drei Ausgänge — Lösung, nur eine Gleichung erfüllt, gar keine — kommen
// gleich oft vor; sonst rät man nach kurzer Zeit richtig.
const A2_FAELLE = [
  { art: "beide" }, { art: "beide" }, { art: "beide" }, { art: "beide" },
  { art: "I", t: 1 }, { art: "I", t: -1 },
  { art: "II", t: 1 }, { art: "II", t: -1 },
  { art: "keine", dx: 1, dy: 1 }, { art: "keine", dx: 1, dy: -1 },
  { art: "keine", dx: -1, dy: 1 }, { art: "keine", dx: 2, dy: -1 },
];

function a2Paar(v, f) {
  if (f.art === "beide") return { xp: v.x0, yp: v.y0 };
  // Entlang der Richtung (b | −a) bleibt man auf der jeweiligen Geraden.
  if (f.art === "I") return { xp: v.x0 + v.b1 * f.t, yp: v.y0 - v.a1 * f.t };
  if (f.art === "II") return { xp: v.x0 + v.b2 * f.t, yp: v.y0 - v.a2 * f.t };
  return { xp: v.x0 + f.dx, yp: v.y0 + f.dy };
}

function generateAufgabe2() {
  const f = pick(A2_FAELLE);
  const passend = A2_KANDIDATEN.filter((v) => {
    const { xp, yp } = a2Paar(v, f);
    if (Math.abs(xp) > 7 || Math.abs(yp) > 7 || xp === yp) return false;
    const r1 = v.a1 * xp + v.b1 * yp === v.c1;
    const r2 = v.a2 * xp + v.b2 * yp === v.c2;
    if (f.art === "beide") return r1 && r2;
    if (f.art === "I") return r1 && !r2;
    if (f.art === "II") return !r1 && r2;
    return !r1 && !r2;
  });
  const k = ohneFeldKollision(passend, (v) => {
    const { xp, yp } = a2Paar(v, f);
    const l1 = v.a1 * xp + v.b1 * yp, l2 = v.a2 * xp + v.b2 * yp;
    return [
      [l1, v.a1 * yp + v.b1 * xp, l1 === v.c1 ? NaN : v.c1],
      [l2, v.a2 * yp + v.b2 * xp, l2 === v.c2 ? NaN : v.c2],
    ];
  });
  const { a1, b1, a2, b2, c1, c2 } = k;
  const { xp, yp } = a2Paar(k, f);
  const l1 = a1 * xp + b1 * yp, l2 = a2 * xp + b2 * yp;
  const istLoesung = l1 === c1 && l2 === c2;
  const seite = (a, b) => `${a < 0 ? "−" : ""}${Math.abs(a) === 1 ? "" : num(Math.abs(a)) + " · "}${klammer(xp)} ${b < 0 ? "− " : "+ "}${Math.abs(b) === 1 ? "" : num(Math.abs(b)) + " · "}${klammer(yp)}`;
  const urteil = (nr, links, rechts) => links === rechts
    ? `<strong>${num(links)} = ${num(rechts)}</strong> ✓ — ${nr} ist erfüllt`
    : `<strong>${num(links)} ≠ ${num(rechts)}</strong> ✗ — ${nr} ist <strong>nicht</strong> erfüllt`;
  return {
    promptHtml: `Gegeben ist das Gleichungssystem<br>` +
      `<strong>I:&nbsp; ${gleichungRein(a1, b1, c1)}</strong><br>` +
      `<strong>II:&nbsp; ${gleichungRein(a2, b2, c2)}</strong><br>` +
      `Setze das Paar <strong>(${num(xp)} | ${num(yp)})</strong> in beide Gleichungen ein.`,
    felder: [
      {
        name: "Linke Seite von I ergibt", soll: l1, toleranz: 0.0005, platzhalter: "Wert",
        hinweis: (roh, val) => {
          if (Math.abs(val - (a1 * yp + b1 * xp)) < 0.0005) return `x und y sind vertauscht: x = ${num(xp)} gehört zum Term ${termRein(a1, "x")}, y = ${num(yp)} zu ${termRein(b1, "y")}.`;
          if (l1 !== c1 && Math.abs(val - c1) < 0.0005) return `${num(c1)} ist die <em>rechte</em> Seite von I. Gefragt ist, was links herauskommt, wenn du die beiden Zahlen einsetzt.`;
          return "";
        },
      },
      {
        name: "Linke Seite von II ergibt", soll: l2, toleranz: 0.0005, platzhalter: "Wert",
        hinweis: (roh, val) => {
          if (Math.abs(val - (a2 * yp + b2 * xp)) < 0.0005) return `Auch hier steht x vorn: ${termRein(a2, "x")} bekommt ${num(xp)}, ${termRein(b2, "y")} bekommt ${num(yp)}.`;
          if (l2 !== c2 && Math.abs(val - c2) < 0.0005) return `${num(c2)} ist die rechte Seite von II, nicht das Ergebnis des Einsetzens.`;
          return "";
        },
      },
      {
        name: "Ist das Paar eine Lösung? (1 = ja, 2 = nein)", soll: istLoesung ? 1 : 2, toleranz: 0.25, platzhalter: "1 oder 2",
        hinweis: (roh, val) => {
          if (!istLoesung && Math.abs(val - 1) < 0.25) {
            if (l1 === c1 || l2 === c2) return `Eine der beiden Gleichungen stimmt zwar — aber eine Lösung muss <strong>beide</strong> erfüllen. Im Bild: Der Punkt liegt auf einer der Geraden, aber nicht im Schnittpunkt.`;
            return "Vergleiche jede linke Seite mit ihrer rechten: Hier stimmt keine von beiden.";
          }
          if (istLoesung && Math.abs(val - 2) < 0.25) return `Beide Vergleiche gehen auf: ${num(l1)} = ${num(c1)} und ${num(l2)} = ${num(c2)}. Dann ist das Paar eine Lösung.`;
          return "";
        },
      },
    ],
    tipps: [
      `Einsetzen heißt: Überall dort, wo x steht, schreibst du ${num(xp)}; überall dort, wo y steht, ${num(yp)}.`,
      `In I wird daraus ${seite(a1, b1)}. Rechne das aus und vergleiche mit ${num(c1)}.`,
      "Erst wenn <em>beide</em> Gleichungen erfüllt sind, ist das Paar eine Lösung des Systems — sonst nicht.",
    ],
    musterloesungHtml:
      `<strong>1. In I einsetzen:</strong> ${seite(a1, b1)} = ${num(l1)}<br>` +
      `&nbsp;&nbsp;&nbsp;${urteil("I", l1, c1)}<br>` +
      `<strong>2. In II einsetzen:</strong> ${seite(a2, b2)} = ${num(l2)}<br>` +
      `&nbsp;&nbsp;&nbsp;${urteil("II", l2, c2)}<br>` +
      `<strong>3. Urteil:</strong> Das Paar (${num(xp)} | ${num(yp)}) ist ` +
      `<strong>${istLoesung ? "eine Lösung" : "keine Lösung"}</strong> des Systems ` +
      `${istLoesung ? "— beide Gleichungen sind erfüllt." : "— es müssten beide Gleichungen erfüllt sein."}<br>` +
      `<span class="progress-note">Die Probe entscheidet immer über beide Gleichungen zugleich. ` +
      `Geometrisch heißt das: Gesucht ist nicht ein Punkt auf einer Geraden, sondern der Punkt, ` +
      `der auf beiden liegt — der Schnittpunkt.</span>`,
  };
}

// Aufgabe 3 — Einsetzungsverfahren, gesucht ist y.
function generateAufgabe3() {
  const k = ohneKollision(ES_KANDIDATEN, (v) => [v.y0, v.x0, -v.y0, v.c1, v.c2], ES_KANDIDATEN[0]);
  const { a1, a2, b2, c1, c2, x0, y0 } = k;
  const nenner = a2 - a1 * b2, zaehler = c2 - b2 * c1;
  return {
    promptHtml: `Löse das Gleichungssystem durch Einsetzen:<br>` +
      `<strong>I:&nbsp; ${gleichungRein(a1, 1, c1)}</strong><br>` +
      `<strong>II:&nbsp; ${gleichungRein(a2, b2, c2)}</strong><br>` +
      `Wie groß ist <strong>y</strong>?`,
    correct: y0,
    tolerance: 0.001,
    placeholder: "y = ?",
    hinweis: (raw, val) => {
      if (Math.abs(val - x0) < 0.001) return `Das ist der x-Wert. Setze ihn noch in die nach y aufgelöste Gleichung ein: y = ${num(c1)} ${a1 < 0 ? "+ " + termRein(-a1, "x") : "− " + termRein(a1, "x")}.`;
      if (Math.abs(val + y0) < 0.001) return "Nur das Vorzeichen stimmt nicht. Prüfe den Schritt, in dem du die Klammer aufgelöst hast — der Faktor trifft <em>beide</em> Summanden.";
      if (Math.abs(val - c1) < 0.001) return "Das ist die rechte Seite von Gleichung I, nicht y. Löse I zuerst nach y auf.";
      if (Math.abs(val - c2) < 0.001) return "Das ist die rechte Seite von Gleichung II, nicht y.";
      return "Löse I nach y auf, setze den Term in Klammern in II ein, multipliziere aus und fasse zusammen. Erst kommt x heraus — und daraus y.";
    },
    tipps: [
      "In Gleichung I steht das y allein mit dem Koeffizienten 1 — deshalb lässt sich I ohne Bruch nach y auflösen.",
      `I nach y aufgelöst: y = ${num(c1)} ${a1 < 0 ? "+ " + termRein(-a1, "x") : "− " + termRein(a1, "x")}. Diesen ganzen Term setzt du in II für y ein — <strong>in Klammern</strong>.`,
      "Zuerst kommt x heraus. Setze x dann in die nach y aufgelöste Gleichung ein — gefragt ist y.",
    ],
    musterloesungHtml:
      `<strong>1. I nach y auflösen:</strong> y = ${num(c1)} ${a1 < 0 ? "+ " + termRein(-a1, "x") : "− " + termRein(a1, "x")}<br>` +
      `<strong>2. In II einsetzen:</strong> ${termRein(a2, "x")} ${b2 < 0 ? "− " + (Math.abs(b2) === 1 ? "" : num(-b2) + " · ") : "+ " + (Math.abs(b2) === 1 ? "" : num(b2) + " · ")}(${num(c1)} ${a1 < 0 ? "+ " + termRein(-a1, "x") : "− " + termRein(a1, "x")}) = ${num(c2)}<br>` +
      `<strong>3. Ausmultiplizieren:</strong> ${termRein(a2, "x")} ${b2 * c1 < 0 ? "− " + num(-b2 * c1) : "+ " + num(b2 * c1)} ${b2 * a1 > 0 ? "− " + termRein(b2 * a1, "x") : "+ " + termRein(-b2 * a1, "x")} = ${num(c2)}<br>` +
      `<strong>4. Zusammenfassen:</strong> ${termRein(nenner, "x")} = ${num(zaehler)}, also x = ${num(x0)}<br>` +
      `<strong>5. y berechnen:</strong> y = ${faktor(einsetzenLinear(-a1, x0, c1))} = <strong>${num(y0)}</strong><br>` +
      `<em>Probe in II:</em> ${faktor(einsetzenXY(a2, x0, b2, y0))} = ${num(c2)} ✓`,
  };
}

// Aufgabe 4 — Additionsverfahren in Teilschritten: Erst wird die Zahl gesucht,
// mit der I zu multiplizieren ist, dann beide Lösungen. Gebaut ist das System
// so, dass eine einzige Multiplikation genügt.
const A4_KANDIDATEN = (() => {
  const liste = [];
  for (const k of [-3, -2, 2, 3]) {
    for (let a1 = -3; a1 <= 3; a1++) {
      if (a1 === 0) continue;
      for (let b1 = -3; b1 <= 3; b1++) {
        if (b1 === 0) continue;
        const b2 = -k * b1;
        if (Math.abs(b2) > 9) continue;
        for (let a2 = -4; a2 <= 4; a2++) {
          // Verschwindet die Determinante, so ist das System nicht eindeutig
          // lösbar; dieselbe Bedingung sichert auch k · a1 + a2 ≠ 0.
          if (a2 === 0 || a1 * b2 - a2 * b1 === 0) continue;
          for (const x0 of [-3, -2, -1, 1, 2, 3]) {
            for (const y0 of [-3, -2, -1, 1, 2, 3]) {
              if (x0 === y0) continue;
              const c1 = a1 * x0 + b1 * y0, c2 = a2 * x0 + b2 * y0;
              if (Math.abs(c1) > 20 || Math.abs(c2) > 28) continue;
              liste.push({ k, a1, b1, a2, b2, c1, c2, x0, y0 });
            }
          }
        }
      }
    }
  }
  return liste;
})();

function generateAufgabe4() {
  const k = ohneFeldKollision(A4_KANDIDATEN, (v) => {
    const naiv = v.a1 + v.a2 === 0 ? NaN : (v.c1 + v.c2) / (v.a1 + v.a2);
    return [
      [v.k, -v.k, v.b2, v.a2],
      [v.x0, v.y0, -v.x0, naiv],
      [v.y0, v.x0, -v.y0],
    ];
  });
  const { k: fk, a1, b1, a2, b2, c1, c2, x0, y0 } = k;
  const koeff = fk * a1 + a2, rechts = fk * c1 + c2;
  return {
    promptHtml: `Löse das Gleichungssystem mit dem Additionsverfahren:<br>` +
      `<strong>I:&nbsp; ${gleichungRein(a1, b1, c1)}</strong><br>` +
      `<strong>II:&nbsp; ${gleichungRein(a2, b2, c2)}</strong><br>` +
      `Hier genügt es, <strong>I</strong> zu vervielfachen.`,
    felder: [
      {
        name: "Mit dieser Zahl wird I multipliziert, damit y beim Addieren wegfällt", soll: fk, toleranz: 0.0005, platzhalter: "Zahl",
        hinweis: (roh, val) => {
          if (Math.abs(val + fk) < 0.0005) return `Mit ${num(-fk)} stünde bei y der Koeffizient ${num(-fk * b1)}, zusammen mit ${num(b2)} ergäbe das ${num(-fk * b1 + b2)} — das y bliebe stehen. Das Vorzeichen muss andersherum.`;
          if (Math.abs(val - b2) < 0.0005) return `${num(b2)} ist der y-Koeffizient von II. Gesucht ist die Zahl, die ${num(b1)} in das Gegenteil von ${num(b2)} verwandelt.`;
          if (Math.abs(val - a2) < 0.0005) return `${num(a2)} ist der x-Koeffizient von II. Weggehoben werden soll aber das y — schau nur auf ${num(b1)} und ${num(b2)}.`;
          return `Suche die Zahl m mit m · ${klammer(b1)} + ${klammer(b2)} = 0.`;
        },
      },
      {
        name: "x", soll: x0, toleranz: 0.0005, platzhalter: "x = ?",
        hinweis: (roh, val) => {
          if (Math.abs(val - y0) < 0.0005) return "Das ist der y-Wert. Nach dem Addieren steht nur noch x da — dieser Wert ist gesucht.";
          if (Math.abs(val + x0) < 0.0005) return `Nur das Vorzeichen stimmt nicht. Nach dem Addieren steht ${termRein(koeff, "x")} = ${num(rechts)}; teile durch ${klammer(koeff)}, nicht durch ${klammer(-koeff)}.`;
          if (a1 + a2 !== 0 && Math.abs(val - (c1 + c2) / (a1 + a2)) < 0.0005) return "So sähe es aus, wenn man die Gleichungen ohne Vorbereitung addiert. Multipliziere I zuerst.";
          return `Addiere I · ${klammer(fk)} und II; es bleibt ${termRein(koeff, "x")} = ${num(rechts)}.`;
        },
      },
      {
        name: "y", soll: y0, toleranz: 0.0005, platzhalter: "y = ?",
        hinweis: (roh, val) => {
          if (Math.abs(val - x0) < 0.0005) return "Das ist der x-Wert. Setze ihn in eine der beiden Gleichungen ein, um y zu bekommen.";
          if (Math.abs(val + y0) < 0.0005) return `Nur das Vorzeichen stimmt nicht. Setze x = ${num(x0)} in I ein: ${faktor(einsetzenXY(a1, x0, b1, y0))} = ${num(c1)}.`;
          return `Setze x = ${num(x0)} in I ein und löse nach y auf.`;
        },
      },
    ],
    tipps: [
      `Weggehoben wird das y. Entscheidend sind nur seine Koeffizienten: ${num(b1)} in I und ${num(b2)} in II.`,
      `Zwei Zahlen heben sich beim Addieren genau dann weg, wenn ihre Summe 0 ist. Gesucht ist also m mit m · ${klammer(b1)} = ${klammer(-b2)}.`,
      `Nach dem Addieren von I · ${klammer(fk)} und II bleibt ${termRein(koeff, "x")} = ${num(rechts)}. Den y-Wert bekommst du danach durch Einsetzen.`,
    ],
    musterloesungHtml:
      `<strong>1. Faktor bestimmen:</strong> m · ${klammer(b1)} + ${klammer(b2)} = 0 ⇒ <strong>m = ${num(fk)}</strong><br>` +
      `<strong>2. I vervielfachen:</strong> I · ${klammer(fk)} ergibt ${gleichungRein(a1 * fk, b1 * fk, c1 * fk)}<br>` +
      `<strong>3. Addieren:</strong> ${termRein(b1 * fk, "y")} und ${termRein(b2, "y")} heben sich weg →&nbsp; ${termRein(koeff, "x")} = ${num(rechts)}<br>` +
      (koeff === 1
        ? `<strong>4. Ablesen:</strong> Vor dem x steht nur die 1 →&nbsp; <strong>x = ${num(x0)}</strong><br>`
        : `<strong>4. Teilen:</strong> | : ${klammer(koeff)} →&nbsp; <strong>x = ${num(x0)}</strong><br>`) +
      `<strong>5. y berechnen:</strong> x in I: ${faktor(einsetzenLinear(a1, x0, 0))} ${b1 < 0 ? "− " + termRein(Math.abs(b1), "y") : "+ " + termRein(b1, "y")} = ${num(c1)} ⇒ <strong>y = ${num(y0)}</strong><br>` +
      `<em>Probe in II:</em> ${faktor(einsetzenXY(a2, x0, b2, y0))} = ${num(c2)} ✓ — die Lösung ist (${num(x0)} | ${num(y0)}).<br>` +
      `<span class="progress-note">Multipliziert wird immer die <em>ganze</em> Gleichung, also auch die rechte Seite. ` +
      `Wer das vergisst, verändert die Lösungsmenge und bekommt ein falsches x.</span>`,
  };
}

// Aufgabe 5 — Additionsverfahren, gesucht ist x.
const A5_KANDIDATEN = (() => {
  const liste = [];
  for (let a1 = -3; a1 <= 3; a1++) {
    if (a1 === 0) continue;
    for (let b1 = -3; b1 <= 3; b1++) {
      if (b1 === 0) continue;
      for (let a2 = -3; a2 <= 3; a2++) {
        if (a2 === 0) continue;
        for (let b2 = -3; b2 <= 3; b2++) {
          if (b2 === 0 || a1 * b2 - a2 * b1 === 0) continue;
          for (const x0 of [-3, -2, -1, 1, 2, 3]) {
            for (const y0 of [-3, -2, -1, 1, 2, 3]) {
              const c1 = a1 * x0 + b1 * y0, c2 = a2 * x0 + b2 * y0;
              if (Math.abs(c1) > 18 || Math.abs(c2) > 18) continue;
              // Der naive Fehler "einfach addieren, obwohl sich nichts weghebt"
              // hat nur dann einen Wert, den man eintippen kann.
              const naiv = a1 + a2 === 0 ? NaN : (c1 + c2) / (a1 + a2);
              liste.push({ a1, b1, a2, b2, c1, c2, x0, y0, naiv });
            }
          }
        }
      }
    }
  }
  return liste;
})();

function generateAufgabe5() {
  const k = ohneKollision(A5_KANDIDATEN, (v) => {
    const werte = [v.x0, v.y0, -v.x0];
    if (!isNaN(v.naiv) && werte.every((w) => Math.abs(w - v.naiv) > 1e-9)) werte.push(v.naiv);
    return werte;
  }, A5_KANDIDATEN[0]);
  const { a1, b1, a2, b2, c1, c2, x0, y0 } = k;
  const g = ggt(b1, b2) || 1;
  let k1 = b2 / g, k2 = -b1 / g;
  if (k1 < 0 && k2 < 0) { k1 = -k1; k2 = -k2; }
  const koeff = a1 * k1 + a2 * k2, rechts = c1 * k1 + c2 * k2;
  return {
    promptHtml: `Löse das Gleichungssystem mit dem Additionsverfahren:<br>` +
      `<strong>I:&nbsp; ${gleichungRein(a1, b1, c1)}</strong><br>` +
      `<strong>II:&nbsp; ${gleichungRein(a2, b2, c2)}</strong><br>` +
      `Wie groß ist <strong>x</strong>?`,
    correct: x0,
    tolerance: 0.001,
    placeholder: "x = ?",
    hinweis: (raw, val) => {
      if (Math.abs(val - y0) < 0.001) return "Das ist der y-Wert der Lösung. Gefragt war x — hebe also das y weg, nicht das x.";
      if (Math.abs(val + x0) < 0.001) return "Nur das Vorzeichen stimmt nicht. Achte auf das Vorzeichen der Zahl, mit der du multiplizierst: Haben die beiden y-Koeffizienten dasselbe Vorzeichen, so muss eine der Gleichungen mit einer <em>negativen</em> Zahl multipliziert werden.";
      if (a1 + a2 !== 0 && Math.abs(val - (c1 + c2) / (a1 + a2)) < 0.001) {
        return `Du hast die Gleichungen direkt addiert. Das hebt y aber nur weg, wenn seine Koeffizienten entgegengesetzt gleich sind — hier sind es ${num(b1)} und ${num(b2)}. Multipliziere zuerst passend.`;
      }
      return `Multipliziere I mit ${num(k1)} und II mit ${num(k2)}. Dann stehen bei y die Koeffizienten ${num(b1 * k1)} und ${num(b2 * k2)}, und beim Addieren fällt y weg.`;
    },
    tipps: [
      "Gefragt ist x — weggehoben werden muss also das <strong>y</strong>. Schau nur auf die beiden y-Koeffizienten.",
      `Die y-Koeffizienten sind ${num(b1)} und ${num(b2)}. Beim Addieren fallen sie nur weg, wenn sie entgegengesetzt gleich sind — hier also erst nach passender Multiplikation.`,
      `Nimm I · ${klammer(k1)} und II · ${klammer(k2)}; bei y stehen dann ${num(b1 * k1)} und ${num(b2 * k2)}. Addieren, dann durch ${klammer(koeff)} teilen.`,
    ],
    musterloesungHtml:
      `<strong>1. Passend multiplizieren:</strong> I · ${klammer(k1)} und II · ${klammer(k2)}<br>` +
      `&nbsp;&nbsp;&nbsp;I:&nbsp; ${gleichungRein(a1 * k1, b1 * k1, c1 * k1)}<br>` +
      `&nbsp;&nbsp;&nbsp;II:&nbsp; ${gleichungRein(a2 * k2, b2 * k2, c2 * k2)}<br>` +
      `<strong>2. Addieren:</strong> Die y-Koeffizienten ${num(b1 * k1)} und ${num(b2 * k2)} heben sich weg →&nbsp; ${termRein(koeff, "x")} = ${num(rechts)}<br>` +
      `<strong>3. Teilen:</strong> | : ${klammer(koeff)} →&nbsp; <strong>x = ${num(x0)}</strong><br>` +
      `<strong>4. y berechnen:</strong> x in I einsetzen →&nbsp; y = ${num(y0)}<br>` +
      `<em>Probe in II:</em> ${faktor(einsetzenXY(a2, x0, b2, y0))} = ${num(c2)} ✓ — die Lösung ist (${num(x0)} | ${num(y0)}).`,
  };
}

// Aufgabe 6 — Die drei Lösungsfälle. Gleichung I steht in Normalform und muss
// erst nach y aufgelöst werden; II ist bereits aufgelöst. Erst der Vergleich
// von Steigung und y-Achsenabschnitt entscheidet über die Zahl der Lösungen.
const A6_KANDIDATEN = (() => {
  const liste = [];
  for (const b1 of [-3, -2, 2, 3]) {
    for (let m1 = -4; m1 <= 4; m1++) {
      if (m1 === 0) continue;
      for (let n1 = -5; n1 <= 5; n1++) {
        if (n1 === 0 || n1 === m1) continue;
        const a1 = -m1 * b1, c1 = n1 * b1;
        if (Math.abs(a1) > 9 || Math.abs(c1) > 12) continue;
        liste.push({ a1, b1, c1, m1, n1 });
      }
    }
  }
  return liste;
})();

function generateAufgabe6() {
  // Alle drei Fälle sind gleich häufig — sonst rät man nach kurzer Zeit richtig.
  const fall = pick([1, 2, 3]);
  const k = ohneFeldKollision(A6_KANDIDATEN, (v) => [
    [v.m1, v.a1, -v.m1],
    [v.n1, v.c1, -v.n1, v.m1],
  ]);
  const { a1, b1, c1, m1, n1 } = k;
  // Fall 1: andere Steigung. Fall 2: gleiche Steigung, anderer Achsenabschnitt.
  // Fall 3: dieselbe Gerade. Die zweite Gerade darf keine Zahl beisteuern, auf
  // der schon ein anderer Hinweis desselben Feldes liegt.
  const m2 = fall === 1
    ? pick([-4, -3, -2, -1, 1, 2, 3, 4].filter((z) => z !== m1 && z !== a1 && z !== -m1))
    : m1;
  const n2 = fall === 3
    ? n1
    : pick([-5, -4, -3, -2, -1, 1, 2, 3, 4, 5].filter((z) => z !== c1 && z !== -n1 && z !== m1 && (fall === 1 || z !== n1)));
  const fallText = { 1: "genau eine Lösung", 2: "keine Lösung", 3: "unendlich viele Lösungen" }[fall];
  const xs = fall === 1 ? (n2 - n1) / (m1 - m2) : null;
  return {
    promptHtml: `Untersuche, wie viele Lösungen das Gleichungssystem hat:<br>` +
      `<strong>I:&nbsp; ${gleichungRein(a1, b1, c1)}</strong><br>` +
      `<strong>II:&nbsp; ${nachYRein(m2, n2)}</strong><br>` +
      `Löse dazu <strong>I</strong> ebenfalls nach y auf.`,
    felder: [
      {
        name: "Steigung der Geraden I", soll: m1, toleranz: 0.0005, platzhalter: "m",
        hinweis: (roh, val) => {
          if (Math.abs(val - a1) < 0.0005) return `${num(a1)} ist der Koeffizient vor dem x in I. Die Steigung siehst du erst, wenn du durch ${num(b1)} geteilt hast — und beim Sortieren wechselt das Vorzeichen.`;
          if (Math.abs(val + m1) < 0.0005) return `Nur das Vorzeichen stimmt nicht: Aus ${gleichungRein(a1, b1, c1)} wird ${termRein(b1, "y")} = ${termRein(-a1, "x")} ${c1 < 0 ? "− " + num(-c1) : "+ " + num(c1)}, geteilt durch ${klammer(b1)}.`;
          if (Math.abs(val - m2) < 0.0005) return `${num(m2)} ist die Steigung der zweiten Geraden. Gefragt ist die der ersten.`;
          return `Bringe ${termRein(a1, "x")} auf die andere Seite und teile die ganze Gleichung durch ${klammer(b1)}.`;
        },
      },
      {
        name: "y-Achsenabschnitt der Geraden I", soll: n1, toleranz: 0.0005, platzhalter: "b",
        hinweis: (roh, val) => {
          if (Math.abs(val - c1) < 0.0005) return `${num(c1)} ist die rechte Seite von I. Auch sie wird noch durch ${klammer(b1)} geteilt.`;
          if (Math.abs(val + n1) < 0.0005) return "Nur das Vorzeichen stimmt nicht — achte darauf, ob du durch eine negative Zahl teilst.";
          if (Math.abs(val - m1) < 0.0005) return "Das ist die Steigung, nicht der y-Achsenabschnitt. Der y-Achsenabschnitt ist die Zahl ohne x.";
          return `Teile die ganze Gleichung durch ${klammer(b1)} — auch die Zahl ${num(c1)}.`;
        },
      },
      {
        name: "Anzahl der Lösungen (1 = genau eine, 2 = keine, 3 = unendlich viele)",
        soll: fall, toleranz: 0.25, platzhalter: "1, 2 oder 3",
        hinweis: (roh, val) => {
          const g = Math.round(val);
          if (g === fall) return "";
          if (fall === 1) return `Die beiden Steigungen sind verschieden (${num(m1)} und ${num(m2)}). Dann sind die Geraden weder parallel noch gleich — sie schneiden sich in genau einem Punkt.`;
          if (fall === 2) {
            if (g === 1) return `Beide Geraden haben dieselbe Steigung ${num(m1)}. Dann gibt es keinen Schnittpunkt.`;
            return `Dieselbe Steigung, aber verschiedene y-Achsenabschnitte (${num(n1)} und ${num(n2)}): Die Geraden sind echt parallel und haben keinen Punkt gemeinsam.`;
          }
          if (g === 1) return `Beide Geraden haben dieselbe Steigung ${num(m1)} <em>und</em> denselben y-Achsenabschnitt ${num(n1)} — es ist nur eine einzige Gerade.`;
          return `Steigung und y-Achsenabschnitt stimmen beide überein. Die Gleichungen beschreiben dieselbe Gerade, also erfüllt jeder ihrer Punkte beide.`;
        },
      },
    ],
    tipps: [
      `Löse I nach y auf: ${termRein(a1, "x")} auf die andere Seite, dann die ganze Gleichung durch ${klammer(b1)} teilen.`,
      "Vergleiche danach zuerst die <strong>Steigungen</strong>. Sind sie verschieden, schneiden sich die Geraden genau einmal.",
      "Sind die Steigungen gleich, entscheidet der y-Achsenabschnitt: verschieden ⇒ parallel ⇒ keine Lösung; gleich ⇒ dieselbe Gerade ⇒ unendlich viele Lösungen.",
    ],
    musterloesungHtml:
      `<strong>1. I nach y auflösen:</strong> ${gleichungRein(a1, b1, c1)} &nbsp;|&nbsp; ${a1 < 0 ? "+ " + termRein(-a1, "x") : "− " + termRein(a1, "x")}<br>` +
      `&nbsp;&nbsp;&nbsp;${termRein(b1, "y")} = ${termRein(-a1, "x")} ${c1 < 0 ? "− " + num(-c1) : "+ " + num(c1)} &nbsp;|&nbsp; : ${klammer(b1)}<br>` +
      `&nbsp;&nbsp;&nbsp;<strong>${nachYRein(m1, n1)}</strong><br>` +
      `<strong>2. Vergleichen:</strong> Steigungen ${num(m1)} und ${num(m2)} — ${m1 === m2 ? "gleich" : "verschieden"}; ` +
      `y-Achsenabschnitte ${num(n1)} und ${num(n2)} — ${n1 === n2 ? "gleich" : "verschieden"}.<br>` +
      `<strong>3. Ergebnis:</strong> Das System hat <strong>${fallText}</strong>` +
      (fall === 1
        ? `; die Geraden schneiden sich${Number.isInteger(xs) ? ` bei x = ${num(xs)}` : ""}.`
        : fall === 2
          ? "; die Geraden sind echt parallel."
          : "; beide Gleichungen beschreiben dieselbe Gerade.") + `<br>` +
      `<span class="progress-note">Beim Rechnen zeigen sich diese Fälle an der letzten Zeile: ` +
      `Bleibt eine falsche Aussage wie 0 = 5 stehen, gibt es keine Lösung; bleibt 0 = 0 stehen, ` +
      `gibt es unendlich viele. Beides ist kein Rechenfehler, sondern das Ergebnis.</span>`,
  };
}

// Aufgabe 7 — Sachaufgabe: aus dem Text ein System aufstellen und lösen.
const A7_SACHEN = [
  { ding1: "Erwachsenenkarte", ding2: "Kinderkarte", mehr1: "Erwachsene", mehr2: "Kinder", satz: (a, b, s) => `${mz(a, "Erwachsener", "Erwachsene")} und ${mz(b, "Kind", "Kinder")} zahlen zusammen ${s} €` },
  { ding1: "Kugel Eis", ding2: "Waffel", mehr1: "Kugeln Eis", mehr2: "Waffeln", satz: (a, b, s) => `${mz(a, "Kugel Eis", "Kugeln Eis")} und ${mz(b, "Waffel", "Waffeln")} kosten zusammen ${s} €` },
  { ding1: "Heft", ding2: "Stift", mehr1: "Hefte", mehr2: "Stifte", satz: (a, b, s) => `${mz(a, "Heft", "Hefte")} und ${mz(b, "Stift", "Stifte")} kosten zusammen ${s} €` },
];
const A7_KANDIDATEN = (() => {
  const liste = [];
  for (let a1 = 1; a1 <= 4; a1++) {
    for (let b1 = 1; b1 <= 5; b1++) {
      for (let a2 = 1; a2 <= 4; a2++) {
        for (let b2 = 1; b2 <= 5; b2++) {
          if (a1 * b2 - a2 * b1 === 0) continue;
          if (a1 === a2 && b1 === b2) continue;
          for (const p of [3, 4, 5, 6, 7, 8, 9]) {
            for (const q of [1, 2, 3, 4, 5, 6]) {
              if (p === q) continue;
              const c1 = a1 * p + b1 * q, c2 = a2 * p + b2 * q;
              if (c1 > 60 || c2 > 60 || c1 === c2) continue;
              liste.push({ a1, b1, a2, b2, c1, c2, p, q });
            }
          }
        }
      }
    }
  }
  return liste;
})();

function generateAufgabe7() {
  // Gesucht ist der Preis der zweiten Sorte. Die Ablenker sind der Preis der
  // ersten Sorte, die Summe beider Preise und ihr Unterschied — genau die
  // Zahlen, auf die die Hinweise anspringen.
  const k = ohneKollision(A7_KANDIDATEN, (v) => [v.q, v.p, v.p + v.q, v.p - v.q], A7_KANDIDATEN[0]);
  const { a1, b1, a2, b2, c1, c2, p, q } = k;
  const s = pick(A7_SACHEN);
  return {
    promptHtml: `${s.satz(a1, b1, num(c1))}. ${s.satz(a2, b2, num(c2))}.<br>` +
      `Wie viel Euro kostet <strong>eine ${s.ding2}</strong>?`,
    correct: q,
    tolerance: 0.001,
    placeholder: "Preis in €",
    hinweis: (raw, val) => {
      if (Math.abs(val - p) < 0.001) return `Das ist der Preis einer ${s.ding1}. Gefragt war die ${s.ding2} — achte darauf, welche der beiden Unbekannten am Ende gesucht ist.`;
      if (Math.abs(val - (p + q)) < 0.001) return "Das ist der Preis beider zusammen. Gefragt war nur eine der beiden Sorten.";
      if (Math.abs(val - (p - q)) < 0.001) return "Das ist der Preisunterschied, nicht der Preis selbst.";
      if (val < 0) return "Ein Preis kann nicht negativ sein — irgendwo ist ein Vorzeichen verrutscht. Schreibe beide Gleichungen ordentlich untereinander auf.";
      return `Nenne x den Preis einer ${s.ding1} und y den Preis einer ${s.ding2}. Dann heißt der Text: ${gleichungRein(a1, b1, c1)} und ${gleichungRein(a2, b2, c2)}.`;
    },
    tipps: [
      `Benenne zuerst die Unbekannten: x = Preis einer ${s.ding1} in €, y = Preis einer ${s.ding2} in €. Beide Gleichungen benutzen dieselben Bezeichnungen.`,
      `Jeder der beiden Sätze wird zu einer Gleichung: I: ${gleichungRein(a1, b1, c1)}, II: ${gleichungRein(a2, b2, c2)}.`,
      `Multipliziere I mit ${num(a2)} und II mit ${klammer(-a1)} und addiere — dann fällt x weg und y bleibt übrig. Gefragt ist der Preis der ${s.ding2}.`,
    ],
    musterloesungHtml:
      `<strong>1. Benennen:</strong> x = Preis einer ${s.ding1} in €, y = Preis einer ${s.ding2} in €<br>` +
      `<strong>2. Übersetzen:</strong><br>` +
      `&nbsp;&nbsp;&nbsp;I:&nbsp; ${gleichungRein(a1, b1, c1)}<br>` +
      `&nbsp;&nbsp;&nbsp;II:&nbsp; ${gleichungRein(a2, b2, c2)}<br>` +
      `<strong>3. Rechnen:</strong> I · ${num(a2)} und II · ${klammer(-a1)}, dann addieren — das x fällt weg und es bleibt ` +
      `${termRein(a2 * b1 - a1 * b2, "y")} = ${num(a2 * c1 - a1 * c2)}, also <strong>y = ${num(q)}</strong>. Einsetzen in I liefert x = ${num(p)}.<br>` +
      `<strong>4. Antwort:</strong> Eine ${s.ding2} kostet ${num(q)} €, eine ${s.ding1} ${num(p)} €.<br>` +
      `<em>Probe am Text:</em> ${a1} · ${num(p)} € + ${b1} · ${num(q)} € = ${num(c1)} € ✓ und ${a2} · ${num(p)} € + ${b2} · ${num(q)} € = ${num(c2)} € ✓`,
  };
}

// Aufgabe 8 — Mischungsaufgabe. Zwei Gleichungen, die verschiedene Dinge
// zählen: die eine die Menge, die andere den Wert. Genau daran scheitert das
// Aufstellen am häufigsten.
const A8_KONTEXTE = [
  { wer: "Ein Teehändler", s1: "Darjeeling", s1Dativ: "Darjeeling", s2: "Assam", s2Dativ: "Assam", mischung: "Teemischung", einheit: "kg" },
  { wer: "Eine Rösterei", s1: "Arabica-Bohnen", s1Dativ: "Arabica-Bohnen", s2: "Robusta-Bohnen", s2Dativ: "Robusta-Bohnen", mischung: "Kaffeemischung", einheit: "kg" },
  { wer: "Ein Hofladen", s1: "Cashewkerne", s1Dativ: "Cashewkernen", s2: "Erdnüsse", s2Dativ: "Erdnüssen", mischung: "Nussmischung", einheit: "kg" },
  { wer: "Ein Süßwarenladen", s1: "Schokotrüffel", s1Dativ: "Schokotrüffeln", s2: "Fruchtgummi", s2Dativ: "Fruchtgummi", mischung: "Naschmischung", einheit: "kg" },
];
const A8_KANDIDATEN = (() => {
  const liste = [];
  for (const g of [10, 12, 15, 16, 20, 24, 25]) {
    for (const p2 of [6, 8, 9, 10, 12, 14, 15]) {
      for (const d of [3, 4, 5, 6, 8, 10]) {
        const p1 = p2 + d;
        for (let x = 2; x <= g - 2; x++) {
          const y = g - x;
          if (x === y) continue;                 // sonst wäre „vertauscht“ kein Fehler
          const s = p1 * x + p2 * y;             // Gesamtwert der Mischung in €
          const mCent = (s * 100) / g;           // Mischpreis in Cent je Einheit
          if (!Number.isInteger(mCent)) continue;
          const m = mCent / 100;
          // Der halbe-halbe-Preis ist ein eigener Hinweis und darf nicht
          // zufällig der richtige Mischpreis sein.
          if (m === (p1 + p2) / 2) continue;
          liste.push({ g, p1, p2, x, y, s, m });
        }
      }
    }
  }
  return liste;
})();

function generateAufgabe8() {
  const kt = pick(A8_KONTEXTE);
  const k = ohneFeldKollision(A8_KANDIDATEN, (v) => [
    [v.s, v.g * v.p1, v.g * v.p2, v.m, v.p1 + v.p2],
    [v.x, v.y, v.g / 2, v.g],
    [v.y, v.x, v.g / 2, v.g],
  ]);
  const { g, p1, p2, x, y, s, m } = k;
  const halb = (p1 + p2) / 2;
  return {
    promptHtml:
      `${kt.wer} mischt ${kt.s1} zu <strong>${euro(p1)} €</strong> je ${kt.einheit} mit ${kt.s2Dativ} zu ` +
      `<strong>${euro(p2)} €</strong> je ${kt.einheit}. Es sollen <strong>${num(g)} ${kt.einheit}</strong> ` +
      `${kt.mischung} entstehen, die <strong>${euro(m)} €</strong> je ${kt.einheit} kostet.`,
    felder: [
      {
        name: "Gesamtwert der Mischung", soll: s, einheit: "€", toleranz: 0.005, platzhalter: "Wert in €",
        hinweis: (roh, val) => {
          if (Math.abs(val - m) < 0.005) return `${euro(m)} € ist der Preis <em>je</em> ${kt.einheit}. Gefragt ist, was die ganzen ${num(g)} ${kt.einheit} wert sind.`;
          if (Math.abs(val - g * p1) < 0.005) return `So viel wäre die Menge wert, wenn sie ganz aus der teureren Sorte bestünde (${kt.s1}, ${euro(p1)} € je ${kt.einheit}). Gerechnet wird mit dem Mischpreis ${euro(m)} €.`;
          if (Math.abs(val - g * p2) < 0.005) return `So viel wäre die Menge wert, wenn sie ganz aus der günstigeren Sorte bestünde (${kt.s2}, ${euro(p2)} € je ${kt.einheit}).`;
          if (Math.abs(val - (p1 + p2)) < 0.005) return "Die beiden Einzelpreise zu addieren ergibt keinen Gesamtwert — die Mengen fehlen.";
          return `Multipliziere den Mischpreis mit der Gesamtmenge: ${euro(m)} € · ${num(g)}.`;
        },
      },
      {
        name: `Menge ${kt.s1}`, soll: x, einheit: kt.einheit, toleranz: 0.005, platzhalter: `Menge in ${kt.einheit}`,
        hinweis: (roh, val) => {
          if (Math.abs(val - y) < 0.005) return `${num(y)} ${kt.einheit} ist die Menge ${kt.s2}. Gefragt war hier ${kt.s1} — die teurere Sorte.`;
          if (Math.abs(val - g / 2) < 0.005) return `Halbe-halbe ergäbe den Mischpreis ${euro(halb)} € je ${kt.einheit}; verlangt sind aber ${euro(m)} €.`;
          if (Math.abs(val - g) < 0.005) return `${num(g)} ${kt.einheit} ist die Gesamtmenge. Sie verteilt sich auf beide Sorten.`;
          if (val < 0 || val > g) return `Die Menge einer Sorte liegt zwischen 0 und ${num(g)} ${kt.einheit}.`;
          return `Nenne x die Menge ${kt.s1} und y die Menge ${kt.s2}. Dann gilt x + y = ${num(g)} und ${num(p1)}x + ${num(p2)}y = ${num(s)}.`;
        },
      },
      {
        name: `Menge ${kt.s2}`, soll: y, einheit: kt.einheit, toleranz: 0.005, platzhalter: `Menge in ${kt.einheit}`,
        hinweis: (roh, val) => {
          if (Math.abs(val - x) < 0.005) return `${num(x)} ${kt.einheit} ist die Menge ${kt.s1}. Die beiden Mengen ergeben zusammen ${num(g)} ${kt.einheit}.`;
          if (Math.abs(val - g / 2) < 0.005) return `Bei gleichen Mengen läge der Mischpreis genau in der Mitte, also bei ${euro(halb)} € je ${kt.einheit}.`;
          if (Math.abs(val - g) < 0.005) return `${num(g)} ${kt.einheit} ist die Gesamtmenge, nicht der Anteil einer Sorte.`;
          return `Wenn die Menge ${kt.s1} bekannt ist, bleibt der Rest: ${num(g)} − x.`;
        },
      },
    ],
    tipps: [
      `Der Gesamtwert steht nicht im Text, lässt sich aber ausrechnen: Mischpreis mal Gesamtmenge, also ${euro(m)} € · ${num(g)} ${kt.einheit}.`,
      "Die beiden Gleichungen zählen verschiedene Dinge: Die erste zählt die Menge (x + y), die zweite den Wert (Preis mal Menge).",
      `Mit x = Menge ${kt.s1} und y = Menge ${kt.s2} heißt das: I: x + y = ${num(g)} und II: ${num(p1)}x + ${num(p2)}y = ${num(s)}. Setze y = ${num(g)} − x in II ein.`,
    ],
    musterloesungHtml:
      `<strong>1. Gesamtwert:</strong> ${euro(m)} € je ${kt.einheit} · ${num(g)} ${kt.einheit} = <strong>${num(s)} €</strong><br>` +
      `<strong>2. Benennen:</strong> x = Menge ${kt.s1} in ${kt.einheit}, y = Menge ${kt.s2} in ${kt.einheit}<br>` +
      `<strong>3. Übersetzen:</strong><br>` +
      `&nbsp;&nbsp;&nbsp;I:&nbsp; x + y = ${num(g)} &nbsp;<em>(die Mengen)</em><br>` +
      `&nbsp;&nbsp;&nbsp;II:&nbsp; ${num(p1)}x + ${num(p2)}y = ${num(s)} &nbsp;<em>(die Werte)</em><br>` +
      `<strong>4. Einsetzen:</strong> y = ${num(g)} − x in II →&nbsp; ${num(p1)}x + ${num(p2)} · (${num(g)} − x) = ${num(s)}<br>` +
      `&nbsp;&nbsp;&nbsp;${num(p1)}x + ${num(p2 * g)} − ${num(p2)}x = ${num(s)} ⇒ ${num(p1 - p2)}x = ${num(s - p2 * g)} ⇒ <strong>x = ${num(x)} ${kt.einheit}</strong><br>` +
      `<strong>5. Rest:</strong> y = ${num(g)} − ${num(x)} = <strong>${num(y)} ${kt.einheit}</strong><br>` +
      `<em>Probe am Text:</em> ${num(x)} · ${euro(p1)} € + ${num(y)} · ${euro(p2)} € = ${num(s)} €, geteilt durch ${num(g)} ${kt.einheit} ergibt ${euro(m)} € je ${kt.einheit} ✓<br>` +
      `<span class="progress-note">Der Mischpreis liegt immer zwischen den beiden Einzelpreisen — hier zwischen ${euro(p2)} € und ${euro(p1)} €. ` +
      `Je näher er am Preis einer Sorte liegt, desto mehr von ihr steckt in der Mischung: ${euro(m)} € liegt näher an ` +
      `${m - p2 < p1 - m ? `${euro(p2)} €, und entsprechend größer ist der Anteil an ${kt.s2Dativ}` : `${euro(p1)} €, und entsprechend größer ist der Anteil an ${kt.s1Dativ}`} ` +
      `(${num(Math.max(x, y))} von ${num(g)} ${kt.einheit}).</span>`,
  };
}

function initExercises() {
  mountUebungsaufgaben(document.getElementById("exercises-mount"), [
    { schwierigkeit: "einfach", titel: "Aufgabe 1 — Gleichsetzungsverfahren", generate: generateAufgabe1 },
    { schwierigkeit: "einfach", titel: "Aufgabe 2 — Die Probe", generate: generateAufgabe2 },
    { schwierigkeit: "mittel", titel: "Aufgabe 3 — Einsetzungsverfahren", generate: generateAufgabe3 },
    { schwierigkeit: "mittel", titel: "Aufgabe 4 — Additionsverfahren Schritt für Schritt", generate: generateAufgabe4 },
    { schwierigkeit: "schwierig", titel: "Aufgabe 5 — Additionsverfahren", generate: generateAufgabe5 },
    { schwierigkeit: "schwierig", titel: "Aufgabe 6 — Die drei Lösungsfälle", generate: generateAufgabe6 },
    { schwierigkeit: "komplex", titel: "Aufgabe 7 — Sachaufgabe", generate: generateAufgabe7 },
    { schwierigkeit: "komplex", titel: "Aufgabe 8 — Mischungsaufgabe", generate: generateAufgabe8 },
  ]);
}

// ================= Quizze =================

function initQuizzes() {
  mountQuiz(document.getElementById("quiz-system"), {
    q: "Das Paar (3 | 1) erfüllt Gleichung I, aber nicht Gleichung II. Ist es eine Lösung des Systems?",
    options: [
      "Nein — eine Lösung muss beide Gleichungen erfüllen",
      "Ja, eine erfüllte Gleichung genügt",
      "Ja, wenn I die erste Gleichung ist",
      "Das lässt sich ohne Zeichnung nicht entscheiden",
    ],
    correct: 0,
    explain: "Im Bild liegt der Punkt dann auf der einen Geraden, aber nicht auf der anderen — er ist kein Schnittpunkt. Gesucht ist immer ein Paar, das beide Bedingungen gleichzeitig erfüllt.",
  });
  mountQuiz(document.getElementById("quiz-gleichsetzen"), {
    q: "Aus y = 3x − 2 und y = x + 4 folgt durch Gleichsetzen:",
    options: ["3x − 2 = x + 4", "3x − 2 = 0", "y = 4x + 2", "3x + x = −2 + 4"],
    correct: 0,
    explain: "Beide rechten Seiten beschreiben denselben Wert y, also sind sie gleich. Daraus wird 2x = 6, also x = 3 und y = 7. Die letzte Antwort addiert die beiden Gleichungen — das ist ein anderes Verfahren und in dieser Form falsch.",
  });
  mountQuiz(document.getElementById("quiz-einsetzen"), {
    q: "In 2x + 3y = 12 wird y = 4 − x eingesetzt. Wie lautet die Gleichung danach?",
    options: ["2x + 3 · (4 − x) = 12", "2x + 3 · 4 − x = 12", "2x + 3y = 4 − x", "2x + 12 − x = 12"],
    correct: 0,
    explain: "Der eingesetzte Term braucht eine Klammer, denn der Faktor 3 gehört zum ganzen Term. Ohne sie fehlt beim Ausmultiplizieren das −3x: richtig ist 2x + 12 − 3x = 12, also −x = 0 und damit x = 0 und y = 4.",
  });
  mountQuiz(document.getElementById("quiz-addieren"), {
    q: "Bei I: 3x + 2y = 7 und II: 5x − 4y = 3 soll y weggehoben werden. Womit multipliziert man?",
    options: [
      "I mit 2, II bleibt unverändert",
      "I mit 4 und II mit 2",
      "I mit 5 und II mit 3",
      "I mit −2, II bleibt unverändert",
    ],
    correct: 0,
    explain: "Aus 2y wird durch die Multiplikation mit 2 gerade 4y, und 4y + (−4y) = 0. Die Antwort „I mit 5 und II mit 3“ würde die x-Koeffizienten gleich machen — dann müsste man subtrahieren. Mit −2 entstünde −4y, das sich mit −4y nicht weghebt, sondern zu −8y summiert.",
  });
  mountQuiz(document.getElementById("quiz-faelle"), {
    q: "Beim Lösen eines Systems bleibt am Ende die Zeile 0 = 5 übrig. Was heißt das?",
    options: [
      "Das System hat keine Lösung; die Geraden sind parallel",
      "Die Lösung ist x = 0 und y = 5",
      "Das System hat unendlich viele Lösungen",
      "Es wurde falsch gerechnet",
    ],
    correct: 0,
    explain: "0 = 5 ist eine falsche Aussage — kein Zahlenpaar kann beide Gleichungen erfüllen. Das ist kein Rechenfehler, sondern das Ergebnis: Die Geraden haben dieselbe Steigung, aber verschiedene y-Achsenabschnitte. Bei 0 = 0 wäre es umgekehrt: unendlich viele Lösungen.",
  });
  mountQuiz(document.getElementById("quiz-aufstellen"), {
    q: "„Zusammen 20 Tiere, zusammen 56 Beine“ — welches Gleichungspaar gehört zu Hühnern (x) und Schafen (y)?",
    options: [
      "x + y = 20 und 2x + 4y = 56",
      "x + y = 20 und x + y = 56",
      "2x + 4y = 20 und x + y = 56",
      "x · y = 20 und 2x · 4y = 56",
    ],
    correct: 0,
    explain: "Die erste Gleichung zählt die Tiere, die zweite die Beine: Jedes Huhn hat 2, jedes Schaf 4. Die Lösung ist x = 12 und y = 8. Wichtig ist, dass beide Gleichungen dieselben Bezeichnungen benutzen und verschiedene Angaben des Textes beschreiben.",
  });
}

// ================= Start =================

initSystem();
initGleichsetzen();
initEinsetzen();
initAddieren();
initFaelle();
initAufstellen();
initExercises();
initQuizzes();
