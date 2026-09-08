// Selbstlernpfad "Trigonometrische Funktionen" (Grundwissen Klasse 5-10, Kapitel 4).
// Rein clientseitiges Vanilla-JS.
//
// Leitgedanke: Der Einheitskreis löst Sinus und Kosinus vom rechtwinkligen
// Dreieck. Abschnitt 1 definiert sie als Koordinaten eines Punktes, Abschnitt 2
// misst den Winkel selbst als Bogenlänge, Abschnitt 3 wickelt den Kreis zur
// Welle ab, Abschnitt 4 streckt sie in Höhe und Breite, Abschnitt 5 schiebt sie
// an die richtige Stelle, und Abschnitt 6 liest die vier Parameter aus einem
// Sachtext.
//
// Durchgehende Farbcodierung — sie führt die von Thema 10 fort: der Sinus grün,
// der Kosinus orange, der Winkel violett, die Amplitude blau, die Periode rot.

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
  // entscheiden: sin 360° = −2,4·10⁻¹⁶ erschiene sonst als "−0".
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
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function parseFlexibleNumber(raw) {
  if (raw == null) return NaN;
  const s = String(raw).trim().replace(/\s/g, "").replace(/−/g, "-").replace(/°/g, "")
    .replace(/\./g, "").replace(",", ".");
  return parseFloat(s);
}
function neueFlaeche(w, h) {
  return svgEl("svg", { viewBox: `0 0 ${w} ${h}`, width: w, height: h, class: "geo-svg", preserveAspectRatio: "xMidYMid meet" });
}
function karte(klasse, name, inhalt) {
  return el("div", { class: "tf-karte " + klasse }, [
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
// wird. Wo ein Wert verboten ist (a = 0 wäre keine Schwingung mehr), springt der
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
  return `<span class="tf-bruch"><span class="oben">${obenHtml}</span><span class="unten">${untenHtml}</span></span>`;
}
function ggT(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { const h = a % b; a = b; b = h; } return a; }
// Ein Faktor 1 wird nicht geschrieben — "1x" ist keine übliche Schreibweise.
function faktorHtml(b) { return b === 1 ? "" : num(b, 1) + " · "; }
// "x − −45°" wäre falsch geschrieben; das Vorzeichen gehört vor die Zahl.
function summand(v, stellen = 0) { return `${v < 0 ? "−" : "+"} ${num(Math.abs(v), stellen)}`; }

// ---------- Winkelfunktionen im Gradmaß ----------

const BOGEN = Math.PI / 180;
// Auf den Achsen werden die Werte gesetzt statt gerechnet: Math.sin(Math.PI)
// liefert 1,2·10⁻¹⁶, und damit stimmten weder sin²+cos² = 1 noch die
// Vorzeichenprüfung für den Quadranten exakt.
function normWinkel(g) { return ((g % 360) + 360) % 360; }
function sinG(g) {
  const r = normWinkel(g);
  if (r % 90 === 0) return [0, 1, 0, -1][r / 90];
  return Math.sin(g * BOGEN);
}
function cosG(g) {
  const r = normWinkel(g);
  if (r % 90 === 0) return [1, 0, -1, 0][r / 90];
  return Math.cos(g * BOGEN);
}
// 0 heißt: Der Punkt liegt auf einer Achse und gehört zu keinem Quadranten.
function quadrant(g) {
  const r = normWinkel(g);
  if (r % 90 === 0) return 0;
  return Math.floor(r / 90) + 1;
}
const ROEMISCH = ["—", "I", "II", "III", "IV"];
// Der Bezugswinkel ist der spitze Winkel zur x-Achse. Über ihn führt jede
// Rechnung am Einheitskreis auf einen Wert aus dem ersten Quadranten zurück.
function bezugswinkel(g) {
  const r = normWinkel(g);
  if (r <= 90) return r;
  if (r <= 180) return 180 - r;
  if (r <= 270) return r - 180;
  return 360 - r;
}
const EXAKT = { 0: "0", 30: "½", 45: "½√2", 60: "½√3", 90: "1" };
function exaktWert(bezug, vorzeichen) {
  const s = EXAKT[bezug];
  if (s === undefined) return null;
  if (s === "0") return "0";
  return (vorzeichen < 0 ? "−" : "") + s;
}

// ---------- Koordinatensystem ----------

// Die Gradzahlen stehen stets unter der Zeichenfläche, nicht unmittelbar unter
// der x-Achse: Dort liefe die Kurve genau durch die Beschriftung ihrer eigenen
// Nullstellen.
function koordinaten(svg, opt) {
  const {
    links, oben, breite, hoehe, xMin, xMax, yMin, yMax,
    xSchritt = 90, ySchritt = 1, xBeschriftung = xSchritt, yBeschriftung = ySchritt,
    xFormat = (x) => num(x) + "°", yFormat = (y) => num(y, 2),
    xName = "x", yName = "y",
  } = opt;
  const px = (x) => links + ((x - xMin) / (xMax - xMin)) * breite;
  const py = (y) => oben + hoehe - ((y - yMin) / (yMax - yMin)) * hoehe;
  const glatt = (w, s) => Math.abs(w - Math.round(w / s) * s) < 1e-9;
  const y0 = Math.max(yMin, Math.min(0, yMax));
  const x0 = Math.max(xMin, Math.min(0, xMax));
  const xTextY = oben + hoehe + 14;

  // Die Schranke richtet sich nach der Schrittweite: Acht Additionen von 3,1
  // ergeben 24,800000000000004 — mit einer festen Schranke von 1e-9 fehlte die
  // letzte Gitterlinie.
  for (let x = Math.ceil(xMin / xSchritt - 1e-9) * xSchritt; x <= xMax + Math.abs(xSchritt) * 1e-6; x += xSchritt) {
    svg.appendChild(svgEl("line", { x1: px(x).toFixed(2), y1: py(yMax).toFixed(2), x2: px(x).toFixed(2), y2: py(yMin).toFixed(2), class: "tf-gitter" }));
    if (glatt(x, xBeschriftung)) svg.appendChild(svgText(px(x), xTextY, xFormat(x), { class: "tf-achsentext" }));
  }
  for (let y = Math.ceil(yMin / ySchritt - 1e-9) * ySchritt; y <= yMax + Math.abs(ySchritt) * 1e-6; y += ySchritt) {
    svg.appendChild(svgEl("line", { x1: px(xMin).toFixed(2), y1: py(y).toFixed(2), x2: px(xMax).toFixed(2), y2: py(y).toFixed(2), class: "tf-gitter" }));
    if (Math.abs(y) > 1e-9 && glatt(y, yBeschriftung)) {
      svg.appendChild(svgText(px(x0) - 7, py(y) + 4, yFormat(y), { class: "tf-achsentext", "text-anchor": "end" }));
    }
  }
  svg.appendChild(svgEl("line", { x1: px(xMin).toFixed(2), y1: py(y0).toFixed(2), x2: (px(xMax) + 16).toFixed(2), y2: py(y0).toFixed(2), class: "tf-achse" }));
  svg.appendChild(svgEl("line", { x1: px(x0).toFixed(2), y1: py(yMin).toFixed(2), x2: px(x0).toFixed(2), y2: (py(yMax) - 12).toFixed(2), class: "tf-achse" }));
  // Der Achsenname sitzt rechts neben der Achsenspitze, nicht darunter: Unter
  // der Achse steht schon die letzte Gradzahl.
  svg.appendChild(svgText(px(xMax) + 19, py(y0) + 5, xName, { class: "tf-achsenname", "text-anchor": "start" }));
  svg.appendChild(svgText(px(x0) + 10, py(yMax) + 10, yName, { class: "tf-achsenname", "text-anchor": "start" }));
  return { px, py };
}

function kurveZeichnen(svg, g, f, xMin, xMax, yMin, yMax, klasse, schritte = 480) {
  let d = "", offen = false;
  for (let i = 0; i <= schritte; i++) {
    const x = xMin + (i / schritte) * (xMax - xMin);
    const y = f(x);
    if (!isFinite(y) || y < yMin || y > yMax) { offen = false; continue; }
    d += `${offen ? " L " : " M "}${g.px(x).toFixed(2)} ${g.py(y).toFixed(2)}`;
    offen = true;
  }
  if (d) svg.appendChild(svgEl("path", { d: d.trim(), class: "tf-kurve " + klasse }));
}

function punktZeichnen(svg, g, x, y, klasse, beschriftung, rechts = true, oben = true) {
  svg.appendChild(svgEl("circle", { cx: g.px(x).toFixed(2), cy: g.py(y).toFixed(2), r: 5, class: "tf-punkt " + klasse }));
  if (beschriftung) {
    svg.appendChild(svgText(g.px(x) + (rechts ? 9 : -9), g.py(y) + (oben ? -9 : 17), beschriftung, {
      class: "tf-punkttext " + klasse, "text-anchor": rechts ? "start" : "end",
    }));
  }
}

// Ein Doppelpfeil mit Beschriftung — für Amplitude und Periode im Bild.
function masspfeil(svg, x1, y1, x2, y2, klasse, text, textDx = 0, textDy = -6, anker = "middle") {
  svg.appendChild(svgEl("line", { x1: x1.toFixed(2), y1: y1.toFixed(2), x2: x2.toFixed(2), y2: y2.toFixed(2), class: "tf-" + klasse }));
  const kopf = klasse === "amplitude" ? "tf-pfeilkopf amp" : "tf-pfeilkopf";
  const laenge = Math.hypot(x2 - x1, y2 - y1);
  if (laenge < 1e-6) return;
  const ex = (x2 - x1) / laenge, ey = (y2 - y1) / laenge;
  for (const [sx, sy, s] of [[x1, y1, 1], [x2, y2, -1]]) {
    const px1 = sx + s * ex * 8, py1 = sy + s * ey * 8;
    svg.appendChild(svgEl("polygon", {
      points: `${sx.toFixed(2)},${sy.toFixed(2)} ${(px1 - ey * 3.4).toFixed(2)},${(py1 + ex * 3.4).toFixed(2)} ${(px1 + ey * 3.4).toFixed(2)},${(py1 - ex * 3.4).toFixed(2)}`,
      class: kopf,
    }));
  }
  svg.appendChild(svgText((x1 + x2) / 2 + textDx, (y1 + y2) / 2 + textDy, text, {
    class: klasse === "amplitude" ? "tf-amplitudentext" : "tf-marketext", "text-anchor": anker,
  }));
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

// ================= 1. Sinus und Kosinus am Einheitskreis =================

const EK_R = 118;          // Radius des Einheitskreises in Bildpunkten
const EK_CX = 208, EK_CY = 204;

// Ein Kreissektor als Pfad — für die vier eingefärbten Quadranten.
function sektor(cx, cy, r, von, bis, klasse) {
  const x1 = cx + r * cosG(von), y1 = cy - r * sinG(von);
  const x2 = cx + r * cosG(bis), y2 = cy - r * sinG(bis);
  return svgEl("path", {
    d: `M ${cx.toFixed(2)} ${cy.toFixed(2)} L ${x1.toFixed(2)} ${y1.toFixed(2)} ` +
       `A ${r} ${r} 0 0 0 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`,
    class: klasse,
  });
}

function ekBild(a) {
  const B = 470, H = 400;
  const svg = neueFlaeche(B, H);
  svg.appendChild(svgText(B / 2, 16, "P(cos α | sin α) — der Kosinus liegt waagerecht, der Sinus senkrecht", { class: "tf-titel" }));
  const s = sinG(a), c = cosG(a);
  const q = quadrant(a);

  for (let k = 0; k < 4; k++) {
    svg.appendChild(sektor(EK_CX, EK_CY, EK_R, k * 90, (k + 1) * 90, "tf-quadrant" + (q === k + 1 ? " aktiv" : "")));
  }
  for (let k = 0; k < 4; k++) {
    const m = (k + 0.5) * 90;
    svg.appendChild(svgText(EK_CX + EK_R * 0.8 * cosG(m), EK_CY - EK_R * 0.8 * sinG(m) + 4, ROEMISCH[k + 1], { class: "tf-quadranttext" }));
  }

  // Achsen mit den Marken bei ±1
  svg.appendChild(svgEl("line", { x1: EK_CX - EK_R - 26, y1: EK_CY, x2: EK_CX + EK_R + 26, y2: EK_CY, class: "tf-achse" }));
  svg.appendChild(svgEl("line", { x1: EK_CX, y1: EK_CY + EK_R + 26, x2: EK_CX, y2: EK_CY - EK_R - 26, class: "tf-achse" }));
  svg.appendChild(svgText(EK_CX + EK_R + 26, EK_CY + 20, "x", { class: "tf-achsenname", "text-anchor": "end" }));
  svg.appendChild(svgText(EK_CX + 10, EK_CY - EK_R - 26 + 10, "y", { class: "tf-achsenname", "text-anchor": "start" }));
  svg.appendChild(svgText(EK_CX + EK_R, EK_CY + 15, "1", { class: "tf-achsentext" }));
  svg.appendChild(svgText(EK_CX - EK_R, EK_CY + 15, "−1", { class: "tf-achsentext" }));
  svg.appendChild(svgText(EK_CX - 8, EK_CY - EK_R + 4, "1", { class: "tf-achsentext", "text-anchor": "end" }));
  svg.appendChild(svgText(EK_CX - 8, EK_CY + EK_R + 4, "−1", { class: "tf-achsentext", "text-anchor": "end" }));
  svg.appendChild(svgEl("circle", { cx: EK_CX, cy: EK_CY, r: EK_R, class: "tf-kreis" }));

  const Px = EK_CX + EK_R * c, Py = EK_CY - EK_R * s;
  // Hilfslinien vom Punkt zu den beiden Achsen
  if (Math.abs(s) > 1e-9) svg.appendChild(svgEl("line", { x1: Px.toFixed(2), y1: Py.toFixed(2), x2: EK_CX, y2: Py.toFixed(2), class: "tf-hilfslinie" }));
  if (Math.abs(c) > 1e-9) svg.appendChild(svgEl("line", { x1: Px.toFixed(2), y1: Py.toFixed(2), x2: Px.toFixed(2), y2: EK_CY, class: "tf-hilfslinie" }));
  // Kosinus waagerecht, Sinus senkrecht — beide nur zeichnen, wenn sie eine
  // sichtbare Länge haben. Ein Strich der Länge 0 behauptete etwas Falsches.
  if (Math.abs(c) > 1e-9) svg.appendChild(svgEl("line", { x1: EK_CX, y1: EK_CY, x2: Px.toFixed(2), y2: EK_CY, class: "tf-kosinus" }));
  if (Math.abs(s) > 1e-9) svg.appendChild(svgEl("line", { x1: Px.toFixed(2), y1: EK_CY, x2: Px.toFixed(2), y2: Py.toFixed(2), class: "tf-sinus" }));

  // Erst der Radius, dann Bogen und Beschriftung: In umgekehrter Reihenfolge
  // liefe die violette Linie mitten durch das „α = …“.
  svg.appendChild(svgEl("line", { x1: EK_CX, y1: EK_CY, x2: Px.toFixed(2), y2: Py.toFixed(2), class: "tf-radius" }));
  if (a > 0) {
    const rb = 40;
    if (a >= 360) {
      // Ein Vollwinkel lässt sich nicht als Bogen zeichnen: Anfangs- und
      // Endpunkt fielen zusammen, und die Beschriftung zeigte auf nichts.
      svg.appendChild(svgEl("circle", { cx: EK_CX, cy: EK_CY, r: rb, class: "tf-winkelbogen" }));
    } else {
      svg.appendChild(svgEl("path", {
        d: `M ${(EK_CX + rb).toFixed(2)} ${EK_CY} A ${rb} ${rb} 0 ${a > 180 ? 1 : 0} 0 ` +
           `${(EK_CX + rb * c).toFixed(2)} ${(EK_CY - rb * s).toFixed(2)}`,
        class: "tf-winkelbogen",
      }));
    }
    const m = a >= 360 ? 180 : a / 2;
    svg.appendChild(svgText(EK_CX + (rb + 22) * cosG(m), EK_CY - (rb + 22) * sinG(m) + 4, `α = ${num(a)}°`, { class: "tf-winkeltext" }));
  }
  svg.appendChild(svgEl("circle", { cx: Px.toFixed(2), cy: Py.toFixed(2), r: 5.5, class: "tf-punkt marke" }));
  // Die Beschriftung wandert nach außen — dorthin, wo der Radius zeigt.
  svg.appendChild(svgText(Px + 16 * c, Py - 16 * s + (s >= 0 ? -6 : 16), `P(${num(c, 2)} | ${num(s, 2)})`, {
    class: "tf-punkttext marke", "text-anchor": c < -0.25 ? "end" : c > 0.25 ? "start" : "middle",
  }));

  // Wertbeschriftungen an den beiden farbigen Strecken
  if (Math.abs(c) > 0.14) {
    svg.appendChild(svgText((EK_CX + Px) / 2, EK_CY + (s >= 0 ? 16 : -8), `cos α = ${num(c, 2)}`, { class: "tf-kosinustext" }));
  }
  if (Math.abs(s) > 0.14) {
    svg.appendChild(svgText(Px + (c >= 0 ? 10 : -10), (EK_CY + Py) / 2 + 4, `sin α = ${num(s, 2)}`, {
      class: "tf-sinustext", "text-anchor": c >= 0 ? "start" : "end",
    }));
  }
  svg.appendChild(svgText(B / 2, H - 10,
    q === 0 ? `α = ${num(a)}° liegt auf einer Achse — genau dort ist einer der beiden Werte 0.`
      : `α = ${num(a)}° liegt im ${ROEMISCH[q]}. Quadranten: cos α ${c > 0 ? "positiv" : "negativ"}, sin α ${s > 0 ? "positiv" : "negativ"}.`,
    { class: "tf-achsentext" }));
  return svg;
}

function renderEinheitskreis() {
  const a = Number(document.getElementById("ek-a").value);
  document.getElementById("ek-a-anzeige").textContent = num(a);
  const s = sinG(a), c = cosG(a), q = quadrant(a), bez = bezugswinkel(a);

  document.getElementById("ek-gleichung").innerHTML =
    `α = <span class="wv">${num(a)}°</span> &nbsp;→&nbsp; ` +
    `cos α <span class="kv">${zeichen(c, 4)} ${num(c, 4)}</span> &nbsp;·&nbsp; ` +
    `sin α <span class="sv">${zeichen(s, 4)} ${num(s, 4)}</span>`;

  const mount = document.getElementById("ek-mount");
  mount.innerHTML = "";
  mount.appendChild(ekBild(a));

  const karten = document.getElementById("ek-karten");
  karten.innerHTML = "";
  karten.appendChild(karte("w", "Winkel α", num(a) + "°"));
  karten.appendChild(karte("k", "cos α (x-Koordinate)", mitZeichen(c, 4)));
  karten.appendChild(karte("s", "sin α (y-Koordinate)", mitZeichen(s, 4)));
  karten.appendChild(karte("w", "Quadrant", q === 0 ? "auf einer Achse" : ROEMISCH[q]));
  karten.appendChild(karte("p", "sin²α + cos²α", num(s * s + c * c, 6)));

  const spalte = (nr, klasse) => `<td class="${klasse}${q === nr ? " aktiv" : ""}">`;
  document.getElementById("ek-tabelle").innerHTML =
    `<caption>Die Vorzeichen in den vier Quadranten — hervorgehoben ist der Quadrant von α</caption>` +
    `<tr><th>Quadrant</th><th>I</th><th>II</th><th>III</th><th>IV</th></tr>` +
    `<tr><th>Winkel</th>` +
    [1, 2, 3, 4].map((nr) => spalte(nr, "w") + `${num((nr - 1) * 90)}°–${num(nr * 90)}°</td>`).join("") + `</tr>` +
    `<tr><th>cos α (waagerecht)</th>` +
    [1, 2, 3, 4].map((nr) => spalte(nr, "k") + (nr === 1 || nr === 4 ? "+" : "−") + `</td>`).join("") + `</tr>` +
    `<tr><th>sin α (senkrecht)</th>` +
    [1, 2, 3, 4].map((nr) => spalte(nr, "s") + (nr <= 2 ? "+" : "−") + `</td>`).join("") + `</tr>`;

  const exS = exaktWert(bez, s >= 0 ? 1 : -1);
  const exC = exaktWert(bez, c >= 0 ? 1 : -1);
  document.getElementById("ek-bilanz").innerHTML =
    (q === 0
      ? `<strong>α = ${num(a)}° liegt auf einer Achse.</strong> Der Punkt ist P(<span class="wk">${num(c)}</span> | <span class="ws">${num(s)}</span>) — ` +
        `einer der beiden Werte ist genau 0, der andere ±1. Das sind die Stellen, an denen die eine Strecke ganz verschwindet.<br>`
      : `<strong>Zurück in den ersten Quadranten:</strong> Der <span class="ww">Bezugswinkel</span> von ${num(a)}° ist ` +
        `<span class="ww">${num(bez)}°</span> — der spitze Winkel zwischen dem Radius und der x-Achse` +
        (q === 1 ? ` (im ersten Quadranten ist das der Winkel selbst)` : ``) + `. Für ihn gilt ` +
        `sin ${num(bez)}° ${zeichen(Math.abs(s), 4)} ${num(Math.abs(s), 4)} und cos ${num(bez)}° ${zeichen(Math.abs(c), 4)} ${num(Math.abs(c), 4)}; ` +
        `die Vorzeichen liefert dann der Quadrant.<br>`) +
    `<strong>sin²α + cos²α:</strong> <span class="ws">${num(s, 4)}²</span> + <span class="wk">${num(c, 4)}²</span> ` +
    `${zeichen(s * s + c * c, 4)} <span class="wp">${num(s * s + c * c, 4)}</span> — der Satz des Pythagoras im Dreieck mit der Hypotenuse 1.<br>` +
    (exS !== null
      ? `<strong>Exakte Werte:</strong> sin ${num(a)}° = <span class="ws">${exS}</span> und cos ${num(a)}° = <span class="wk">${exC}</span>. ` +
        `Diese Winkel lohnt es sich auswendig zu können.`
      : `<strong>Kein Merkwinkel:</strong> Zu ${num(a)}° gehört kein einfacher Wurzelausdruck — hier hilft nur der Taschenrechner. ` +
        `Auswendig lernt man nur 0°, 30°, 45°, 60° und 90° samt ihren Spiegelbildern.`);

  document.getElementById("ek-text").innerHTML =
    q === 0
      ? `<span class="tf-urteil eins">α = ${num(a)}° — auf einer Achse</span> ` +
        `Hier ist der Punkt P(${num(c)} | ${num(s)}). Genau an diesen vier Stellen hat die Sinuskurve ihre Nullstellen oder ihre Extrempunkte.`
      : `<span class="tf-urteil ${s > 0 ? "ja" : "nein"}">${ROEMISCH[q]}. Quadrant: sin α ${s > 0 ? "positiv" : "negativ"}, cos α ${c > 0 ? "positiv" : "negativ"}</span> ` +
        `Die Vorzeichen kommen allein daher, in welche Richtung der Punkt vom Ursprung aus liegt — ` +
        `nach ${c > 0 ? "rechts" : "links"} und nach ${s > 0 ? "oben" : "unten"}.`;
}

function initEinheitskreis() {
  document.getElementById("ek-a").addEventListener("input", renderEinheitskreis);
  renderEinheitskreis();
}

// ================= 2. Das Bogenmaß =================

const BM_R = 58;                 // Bildpunkte je Längeneinheit — Kreis und Lineal
const BM_CX = 112, BM_CY = 128;
const BM_X0 = 44, BM_Y = 262;    // Anfang und Höhe des abgewickelten Lineals

function bmBild(a) {
  const B = 470, H = 320;
  const svg = neueFlaeche(B, H);
  svg.appendChild(svgText(B / 2, 16, "Der Bogen auf dem Einheitskreis, geradegebogen", { class: "tf-titel" }));
  const bogen = a * BOGEN;        // Länge des Bogens bei r = 1

  // --- Der Kreis mit dem abgetragenen Bogen
  svg.appendChild(svgEl("line", { x1: BM_CX - BM_R - 18, y1: BM_CY, x2: BM_CX + BM_R + 18, y2: BM_CY, class: "tf-achse" }));
  svg.appendChild(svgEl("line", { x1: BM_CX, y1: BM_CY + BM_R + 18, x2: BM_CX, y2: BM_CY - BM_R - 18, class: "tf-achse" }));
  svg.appendChild(svgEl("circle", { cx: BM_CX, cy: BM_CY, r: BM_R, class: "tf-kreis" }));
  svg.appendChild(svgEl("line", { x1: BM_CX, y1: BM_CY, x2: BM_CX + BM_R, y2: BM_CY, class: "tf-radius" }));
  svg.appendChild(svgEl("line", {
    x1: BM_CX, y1: BM_CY,
    x2: (BM_CX + BM_R * cosG(a)).toFixed(2), y2: (BM_CY - BM_R * sinG(a)).toFixed(2), class: "tf-radius",
  }));
  svg.appendChild(svgText(BM_CX + BM_R / 2, BM_CY + 15, "r = 1", { class: "tf-winkeltext" }));
  if (a > 0 && a < 360) {
    svg.appendChild(svgEl("path", {
      d: `M ${(BM_CX + BM_R).toFixed(2)} ${BM_CY} A ${BM_R} ${BM_R} 0 ${a > 180 ? 1 : 0} 0 ` +
         `${(BM_CX + BM_R * cosG(a)).toFixed(2)} ${(BM_CY - BM_R * sinG(a)).toFixed(2)}`,
      class: "tf-bogen",
    }));
  } else if (a >= 360) {
    // Ein Vollkreis lässt sich nicht als ein einziger Bogen zeichnen — der
    // Anfangs- und der Endpunkt fielen zusammen.
    svg.appendChild(svgEl("circle", { cx: BM_CX, cy: BM_CY, r: BM_R, class: "tf-bogen" }));
  }
  if (a > 0) {
    const m = a >= 360 ? 180 : a / 2;
    svg.appendChild(svgText(BM_CX + 34 * cosG(m), BM_CY - 34 * sinG(m) + 4, `${num(a)}°`, { class: "tf-winkeltext" }));
  }
  // Die Merkgrößen füllen den Platz rechts neben dem Kreis und geben der
  // abgetragenen Länge einen Maßstab.
  const merk = [
    ["ganzer Kreis:", `2π ${zeichen(2 * Math.PI, 3)} ${num(2 * Math.PI, 3)}`],
    ["halber Kreis:", `π ${zeichen(Math.PI, 3)} ${num(Math.PI, 3)}`],
    ["Viertelkreis:", `½π ${zeichen(Math.PI / 2, 3)} ${num(Math.PI / 2, 3)}`],
  ];
  merk.forEach(([bez, wert], i) => {
    svg.appendChild(svgText(232, 96 + i * 20, bez, { class: "tf-achsentext", "text-anchor": "start" }));
    svg.appendChild(svgText(334, 96 + i * 20, wert, { class: "tf-marketext", "text-anchor": "start" }));
  });
  svg.appendChild(svgText(232, 178, `hier: ${num(a)}°`, { class: "tf-winkeltext", "text-anchor": "start" }));
  svg.appendChild(svgText(334, 178, `x ${zeichen(bogen, 3)} ${num(bogen, 3)}`, { class: "tf-marketext", "text-anchor": "start" }));

  // --- Dasselbe Stück als Strecke auf einem Lineal
  const ende = BM_X0 + 2 * Math.PI * BM_R;
  svg.appendChild(svgEl("line", { x1: BM_X0, y1: BM_Y, x2: ende.toFixed(2), y2: BM_Y, class: "tf-achse" }));
  for (let k = 0; k <= 4; k++) {
    const x = BM_X0 + (k * Math.PI / 2) * BM_R;
    svg.appendChild(svgEl("line", { x1: x.toFixed(2), y1: BM_Y - 6, x2: x.toFixed(2), y2: BM_Y + 6, class: "tf-gitter" }));
    svg.appendChild(svgText(x, BM_Y + 20, ["0", "½π", "π", "1½π", "2π"][k], { class: "tf-achsentext" }));
  }
  svg.appendChild(svgEl("line", { x1: BM_X0, y1: BM_Y - 14, x2: (BM_X0 + bogen * BM_R).toFixed(2), y2: BM_Y - 14, class: "tf-strecke" }));
  // Am Anfang ausgerichtet, nicht mittig: Bei kleinem α ist die Beschriftung
  // länger als die Strecke und ragte sonst links über das Lineal hinaus.
  svg.appendChild(svgText(BM_X0, BM_Y - 22,
    `Bogenlänge x ${zeichen(bogen, 3)} ${num(bogen, 3)}`, { class: "tf-marketext", "text-anchor": "start" }));
  svg.appendChild(svgText(B / 2, H - 8,
    "Roter Bogen und rote Strecke sind im Bild wirklich gleich lang — das ist das Bogenmaß.", { class: "tf-achsentext" }));
  return svg;
}

function renderBogenmass() {
  const a = Number(document.getElementById("bm-a").value);
  document.getElementById("bm-a-anzeige").textContent = num(a);
  const x = a * BOGEN;
  // a : 180 als vollständig gekürzter Bruch — so heißt das Vielfache von π.
  const t = ggT(a, 180);
  const z = a / t, n = 180 / t;
  const zaehler = z === 1 ? "π" : `${num(z)}π`;
  const piHtml = a === 0 ? "0" : n === 1 ? zaehler : bruchHtml(zaehler, num(n));
  // Für die Urteilszeile braucht es denselben Ausdruck ohne Auszeichnungen —
  // aus dem Bruch-Markup würde sonst „π 6“ statt „π : 6“.
  const piText = a === 0 ? "0" : n === 1 ? zaehler : `${zaehler} : ${num(n)}`;

  document.getElementById("bm-gleichung").innerHTML =
    `<span class="wv">${num(a)}°</span> = <span class="wv">${num(a)}</span> · ` +
    `${bruchHtml("π", "180")} = <span class="pv">${piHtml}</span> ` +
    `<span class="pv">${zeichen(x, 4)} ${num(x, 4)}</span>`;

  const mount = document.getElementById("bm-mount");
  mount.innerHTML = "";
  mount.appendChild(bmBild(a));

  document.getElementById("bm-schritte").innerHTML = [
    schrittZeile(`Gegeben: α = <span class="wv">${num(a)}°</span>`, "Aufgabe"),
    schrittZeile(`Anteil am Vollkreis: ${bruchHtml(num(a), "360")} ${zeichen(a / 360, 4)} <span class="wv">${num(a / 360, 4)}</span>`,
      "der Bruchteil des Kreises", "",
      "Genau derselbe Anteil wie bei der Bogenlänge im Kreis — nur ist der Radius hier 1."),
    schrittZeile(`x = ${bruchHtml(num(a), "360")} · 2π = <span class="pv">${piHtml}</span>`,
      "Anteil mal Gesamtumfang", "",
      "Der Umfang des Einheitskreises ist 2πr = 2π · 1 = 2π."),
    schrittZeile(`x ${zeichen(x, 5)} <span class="pv">${num(x, 5)}</span>`, "als Dezimalzahl", "fertig"),
    schrittZeile(`Probe zurück: <span class="pv">${num(x, 5)}</span> · ${bruchHtml("180", "π")} ` +
      `${zeichen(x * 180 / Math.PI, 2)} <span class="wv">${num(x * 180 / Math.PI, 2)}°</span>`,
      "Gegenrichtung", "fertig",
      "Hin mit π : 180, zurück mit 180 : π — die beiden Faktoren sind Kehrwerte."),
  ].join("");

  const karten = document.getElementById("bm-karten");
  karten.innerHTML = "";
  karten.appendChild(karte("w", "Gradmaß α", num(a) + "°"));
  karten.appendChild(karte("p", "Bogenmaß als Vielfaches von π", piHtml));
  karten.appendChild(karte("p", "Bogenmaß als Dezimalzahl", mitZeichen(x, 4)));
  karten.appendChild(karte("s", "sin α", mitZeichen(sinG(a), 4)));
  karten.appendChild(karte("k", "cos α", mitZeichen(cosG(a), 4)));

  document.getElementById("bm-bilanz").innerHTML =
    `<strong>Die Umrechnung als Dreisatz:</strong> 360° entsprechen <span class="wp">2π</span>, also entspricht 1° gerade ` +
    `<span class="wp">2π : 360 = π : 180</span> ${zeichen(Math.PI / 180, 5)} <span class="wp">${num(Math.PI / 180, 5)}</span>. ` +
    `Für ${num(a)}° ist es das ${num(a)}-fache davon.<br>` +
    `<strong>Warum das Bogenmaß eine reine Zahl ist:</strong> Es ist eine Länge, gemessen in Radien — ` +
    `also Länge geteilt durch Länge. Deshalb steht bei „${num(x, 3)}“ auch keine Einheit; nur wenn es darauf ankommt, ` +
    `schreibt man ${num(x, 3)} rad.<br>` +
    (a === 0
      ? `<strong>Bei 0°</strong> ist auch der Bogen 0 lang — Anfangs- und Endpunkt fallen zusammen.`
      : a <= 30
        ? `<strong>Kleine Winkel:</strong> Hier ist sin x <span class="ws">${zeichen(sinG(a), 4)} ${num(sinG(a), 4)}</span> und x selbst ` +
          `<span class="wp">${num(x, 4)}</span> — die beiden Zahlen liegen nur ${num(Math.abs(x - sinG(a)) / x * 100, 1)} % auseinander. ` +
          `Je kleiner der Winkel, desto besser stimmt sin x ≈ x: Bei 1° sind es ${num(sinG(1), 6)} gegen ${num(BOGEN, 6)}.`
        : `<strong>Zum Vergleich:</strong> sin ${num(a)}° <span class="ws">${zeichen(sinG(a), 4)} ${num(sinG(a), 4)}</span>, aber x = ` +
          `<span class="wp">${num(x, 4)}</span> — das sind ${num(Math.abs(x - sinG(a)) / x * 100, 1)} % Unterschied. ` +
          `Die Näherung sin x ≈ x taugt eben nur für <em>kleine</em> Winkel; hier ist der Winkel dafür zu groß.`);

  document.getElementById("bm-text").innerHTML =
    `<span class="tf-urteil ${a % 90 === 0 ? "ja" : "eins"}">${num(a)}° = ${piText}</span> ` +
    (a % 90 === 0
      ? `Ein Vielfaches von 90° — im Bogenmaß also ein Vielfaches von ½π. Diese Werte sollte man ohne Rechnung parat haben.`
      : `Der gekürzte Bruch ${num(z)} : ${num(n)} sagt, welcher Teil von π gemeint ist. Kürzen lohnt sich: ` +
        `${num(a)} : 180 wäre dieselbe Zahl, aber schwerer zu lesen.`);
}

function initBogenmass() {
  document.getElementById("bm-a").addEventListener("input", renderBogenmass);
  renderBogenmass();
}

// ================= 3. Die Sinus- und die Kosinuskurve =================

const KU_R = 56;

function kuBild(x0, mitKos) {
  const B = 580, H = 244;
  const svg = neueFlaeche(B, H);
  svg.appendChild(svgText(B / 2, 15,
    mitKos ? "Links der Kreis, rechts die abgewickelte Welle — grün sin x, orange cos x"
      : "Links der Kreis, rechts die abgewickelte Welle: die Höhe des Punktes wird zur Kurve",
    { class: "tf-titel" }));
  const oben = 34, hoehe = 2.8 * KU_R, links = 186, breite = 356;
  const g = koordinaten(svg, {
    links, oben, breite, hoehe, xMin: -90, xMax: 450, yMin: -1.4, yMax: 1.4,
    xSchritt: 90, ySchritt: 0.5, yBeschriftung: 1, yFormat: (y) => num(y, 1),
  });
  const cy = g.py(0), cx = 76;

  // --- Der Kreis links, im selben Höhenmaßstab wie die Kurve
  svg.appendChild(svgEl("line", { x1: cx - KU_R - 14, y1: cy, x2: cx + KU_R + 14, y2: cy, class: "tf-achse" }));
  svg.appendChild(svgEl("line", { x1: cx, y1: cy + KU_R + 14, x2: cx, y2: cy - KU_R - 14, class: "tf-achse" }));
  svg.appendChild(svgEl("circle", { cx, cy: cy.toFixed(2), r: KU_R, class: "tf-kreis" }));
  const s0 = sinG(x0), c0 = cosG(x0);
  const Px = cx + KU_R * c0, Py = cy - KU_R * s0;
  if (Math.abs(s0) > 1e-9) svg.appendChild(svgEl("line", { x1: Px.toFixed(2), y1: cy.toFixed(2), x2: Px.toFixed(2), y2: Py.toFixed(2), class: "tf-sinus" }));
  svg.appendChild(svgEl("line", { x1: cx, y1: cy.toFixed(2), x2: Px.toFixed(2), y2: Py.toFixed(2), class: "tf-radius" }));
  svg.appendChild(svgEl("circle", { cx: Px.toFixed(2), cy: Py.toFixed(2), r: 4.5, class: "tf-punkt marke" }));

  // --- Die Kurven
  if (mitKos) kurveZeichnen(svg, g, (x) => cosG(x), -90, 450, -1.4, 1.4, "kos");
  kurveZeichnen(svg, g, (x) => sinG(x), -90, 450, -1.4, 1.4, "");

  // --- Die Abwicklungslinie: gleiche Höhe hier wie dort
  svg.appendChild(svgEl("line", {
    x1: Px.toFixed(2), y1: Py.toFixed(2), x2: g.px(x0).toFixed(2), y2: g.py(s0).toFixed(2), class: "tf-hilfslinie",
  }));
  // Nullstellen und Extrempunkte in der Farbe der Sinuskurve, aber kleiner als
  // der bewegliche Punkt. Wo dieser schon sitzt, bleibt die feste Marke weg —
  // sonst lägen zwei Kreise übereinander.
  for (const [xk, yk] of [[0, 0], [180, 0], [360, 0], [90, 1], [270, -1]]) {
    if (xk === x0) continue;
    svg.appendChild(svgEl("circle", { cx: g.px(xk).toFixed(2), cy: g.py(yk).toFixed(2), r: 3.5, class: "tf-punkt wert" }));
  }
  // Die Beschriftung weicht dorthin aus, wo die Kurve tiefer verläuft: bei
  // steigender Kurve nach links, bei fallender nach rechts. An den Rändern
  // entscheidet der Platz, damit der Text nicht in den Kreis oder aus dem Bild
  // hinausragt.
  const rechts = g.px(x0) < links + 84 ? true : g.px(x0) > links + breite - 84 ? false : cosG(x0) < 0;
  punktZeichnen(svg, g, x0, s0, "wert", `sin ${num(x0)}° ${zeichen(s0, 2)} ${num(s0, 2)}`, rechts, s0 >= 0);
  return svg;
}

function renderKurven() {
  const x0 = Number(document.getElementById("ku-x").value);
  const mitKos = document.getElementById("ku-kos").checked;
  document.getElementById("ku-x-anzeige").textContent = num(x0);
  const s = sinG(x0), c = cosG(x0);

  document.getElementById("ku-gleichung").innerHTML =
    `f(x) = <span class="sv">sin x</span> &nbsp;→&nbsp; f(<span class="wv">${num(x0)}°</span>) ` +
    `<span class="sv">${zeichen(s, 4)} ${num(s, 4)}</span>` +
    (mitKos ? ` &nbsp;·&nbsp; cos <span class="wv">${num(x0)}°</span> <span class="kv">${zeichen(c, 4)} ${num(c, 4)}</span>` : "");

  const mount = document.getElementById("ku-mount");
  mount.innerHTML = "";
  mount.appendChild(kuBild(x0, mitKos));

  const stellen = [0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330, 360];
  const zelle = (klasse, inhalt, aktiv) => `<td class="${klasse}${aktiv ? " aktiv" : ""}">${inhalt}</td>`;
  document.getElementById("ku-tabelle").innerHTML =
    `<caption>Die wichtigsten Stellen einer vollen Periode</caption>` +
    `<tr><th>x</th>${stellen.map((k) => zelle("w", num(k) + "°", k === x0)).join("")}</tr>` +
    `<tr><th>sin x</th>${stellen.map((k) => zelle("s", num(sinG(k), 2), k === x0)).join("")}</tr>` +
    `<tr><th>cos x</th>${stellen.map((k) => zelle("k", num(cosG(k), 2), k === x0)).join("")}</tr>`;

  const karten = document.getElementById("ku-karten");
  karten.innerHTML = "";
  karten.appendChild(karte("w", "Stelle x", num(x0) + "°"));
  karten.appendChild(karte("s", "sin x", mitZeichen(s, 4)));
  karten.appendChild(karte("k", "cos x", mitZeichen(c, 4)));
  karten.appendChild(karte("s", "sin(−x)", mitZeichen(sinG(-x0), 4)));
  karten.appendChild(karte("k", "cos(−x)", mitZeichen(cosG(-x0), 4)));

  document.getElementById("ku-bilanz").innerHTML =
    `<strong>Periode 360°:</strong> sin(${num(x0)}° + 360°) = sin ${num(x0 + 360)}° ` +
    `${zeichen(sinG(x0 + 360), 4)} <span class="ws">${num(sinG(x0 + 360), 4)}</span> — derselbe Wert wie sin ${num(x0)}°. ` +
    `Nach einer vollen Umdrehung steht der Punkt wieder genau dort.<br>` +
    `<strong>Punktsymmetrie des Sinus:</strong> sin(−${num(x0)}°) ${zeichen(sinG(-x0), 4)} ` +
    `<span class="ws">${num(sinG(-x0), 4)}</span> = −sin ${num(x0)}°. Spiegeln an der x-Achse kippt nur die Höhe.<br>` +
    `<strong>Achsensymmetrie des Kosinus:</strong> cos(−${num(x0)}°) ${zeichen(cosG(-x0), 4)} ` +
    `<span class="wk">${num(cosG(-x0), 4)}</span> = cos ${num(x0)}°. Beim Spiegeln bleibt die x-Koordinate unverändert.<br>` +
    `<strong>Der Zusammenhang der beiden Kurven:</strong> cos ${num(x0)}° ${zeichen(c, 4)} <span class="wk">${num(c, 4)}</span> ` +
    `und sin(${num(x0)}° + 90°) = sin ${num(x0 + 90)}° ${zeichen(sinG(x0 + 90), 4)} <span class="ws">${num(sinG(x0 + 90), 4)}</span> — ` +
    `dieselbe Zahl. Die Kosinuskurve ist die um 90° nach links geschobene Sinuskurve.`;

  const r = normWinkel(x0);
  document.getElementById("ku-text").innerHTML =
    r % 180 === 0
      ? `<span class="tf-urteil eins">Nullstelle bei x = ${num(x0)}°</span> ` +
        `Die Sinuskurve schneidet die x-Achse bei allen Vielfachen von 180°. Auf dem Kreis liegt der Punkt dann genau auf der waagerechten Achse.`
      : r === 90
        ? `<span class="tf-urteil ja">Hochpunkt bei x = ${num(x0)}°</span> ` +
          `Größer als 1 wird der Sinus nie — mehr als bis zum oberen Kreisrand kommt der Punkt nicht.`
        : r === 270
          ? `<span class="tf-urteil nein">Tiefpunkt bei x = ${num(x0)}°</span> ` +
            `Kleiner als −1 wird der Sinus nie — der untere Kreisrand ist die Grenze.`
          : `<span class="tf-urteil ${s > 0 ? "ja" : "nein"}">sin ${num(x0)}° ${zeichen(s, 3)} ${num(s, 3)}</span> ` +
            `Die Kurve ${(r > 90 && r < 270) ? "fällt" : "steigt"} hier gerade — auf dem Kreis wandert der Punkt ` +
            `${(r > 90 && r < 270) ? "nach unten" : "nach oben"}.`;
}

function initKurven() {
  document.getElementById("ku-x").addEventListener("input", renderKurven);
  document.getElementById("ku-kos").addEventListener("change", renderKurven);
  renderKurven();
}

// ================= 4. Amplitude und Periode =================

let apLetztesA = null;
const AP_XMAX = 720;
const AP_OBEN = 32, AP_HOEHE = 210;

function apBild(a, b) {
  const B = 560, H = 300;
  const svg = neueFlaeche(B, H);
  svg.appendChild(svgText(B / 2, 15,
    `f(x) = ${num(a, 1)} · sin(${num(b, 1)} · x) — violett gestrichelt die Grundkurve sin x`, { class: "tf-titel" }));
  const A = Math.abs(a);
  const yMax = Math.max(1, A) * 1.32;
  const g = koordinaten(svg, {
    links: 56, oben: AP_OBEN, breite: 452, hoehe: AP_HOEHE, xMin: 0, xMax: AP_XMAX, yMin: -yMax, yMax,
    xSchritt: 90, xBeschriftung: 180, ySchritt: yMax > 2.2 ? 1 : 0.5,
    yBeschriftung: yMax > 2.2 ? 1 : 0.5, yFormat: (y) => num(y, 1),
  });
  // Die beiden Hüllgeraden zeigen, wie weit die Kurve höchstens ausschlägt.
  for (const w of [A, -A]) {
    svg.appendChild(svgEl("line", { x1: g.px(0).toFixed(2), y1: g.py(w).toFixed(2), x2: g.px(AP_XMAX).toFixed(2), y2: g.py(w).toFixed(2), class: "tf-huelle" }));
  }
  kurveZeichnen(svg, g, (x) => sinG(x), 0, AP_XMAX, -yMax, yMax, "grund");
  kurveZeichnen(svg, g, (x) => a * sinG(b * x), 0, AP_XMAX, -yMax, yMax, "");

  const p = 360 / b;
  const xExtrem = p / 4;
  if (xExtrem <= AP_XMAX) {
    masspfeil(svg, g.px(xExtrem), g.py(0), g.px(xExtrem), g.py(a), "amplitude", `|a| = ${num(A, 1)}`, 30, 4);
  }
  // Der Periodenpfeil liegt unter der Zeichenfläche. Im Bild selbst liefe er
  // durch die Wellentäler, und seine Beschriftung stünde auf der Kurve.
  if (p <= AP_XMAX) {
    const yPfeil = AP_OBEN + AP_HOEHE + 34;
    masspfeil(svg, g.px(0), yPfeil, g.px(p), yPfeil, "periode", `Periode p = ${num(p, 1)}°`, 0, 13);
  }
  for (let k = 0; k * p / 2 <= AP_XMAX + 1e-9; k++) punktZeichnen(svg, g, k * p / 2, 0, "zeit", null);
  return svg;
}

function renderAmplitude() {
  const aRoh = ueberspringe("ap-a", 0, apLetztesA);
  apLetztesA = aRoh;
  const a = aRoh / 10;
  const b = Number(document.getElementById("ap-b").value) / 10;
  document.getElementById("ap-a-anzeige").textContent = num(a, 1);
  document.getElementById("ap-b-anzeige").textContent = num(b, 1);
  const A = Math.abs(a), p = 360 / b;

  document.getElementById("ap-gleichung").innerHTML =
    `f(x) = <span class="av">${num(a, 1)}</span> · sin(<span class="pv">${num(b, 1)}</span> · x) &nbsp;→&nbsp; ` +
    `Amplitude <span class="av">${num(A, 1)}</span>, Periode <span class="pv">${zeichen(p, 1)} ${num(p, 1)}°</span>`;

  const mount = document.getElementById("ap-mount");
  mount.innerHTML = "";
  mount.appendChild(apBild(a, b));

  document.getElementById("ap-schritte").innerHTML = [
    schrittZeile(`Amplitude = |a| = |<span class="av">${num(a, 1)}</span>| = <span class="av">${num(A, 1)}</span>`,
      "der Faktor vor dem Sinus", "",
      a < 0 ? "Das Minus spiegelt die Kurve an der x-Achse; für die Amplitude zählt nur der Betrag."
        : "Die Kurve läuft zwischen −" + num(A, 1) + " und " + num(A, 1) + "."),
    schrittZeile(`Periode p = ${bruchHtml("360°", num(b, 1))} <span class="pv">${zeichen(p, 1)} ${num(p, 1)}°</span>`,
      "geteilt durch b, nicht mal b", "",
      `Probe: Bei x = ${num(p, 1)}° ist das Argument b · x = ${num(b, 1)} · ${num(p, 1)}° = 360° — genau eine volle Schwingung.`),
    schrittZeile(`Nullstellen: 0°, ${num(p / 2, 1)}°, ${num(p, 1)}°, ${num(3 * p / 2, 1)}°, …`,
      "alle halben Perioden", "",
      "Zwischen zwei Nullstellen liegt immer ein halber Durchlauf — ein Berg oder ein Tal."),
    schrittZeile(`${a > 0 ? "Hochpunkt" : "Tiefpunkt"} bei x = p : 4 ${zeichen(p / 4, 1)} ` +
      `<span class="pv">${num(p / 4, 1)}°</span> mit dem Wert <span class="av">${num(a, 1)}</span>`,
      "eine Viertelperiode nach dem Start", "fertig"),
  ].join("");

  const karten = document.getElementById("ap-karten");
  karten.innerHTML = "";
  karten.appendChild(karte("a", "Faktor a", num(a, 1)));
  karten.appendChild(karte("a", "Amplitude |a|", num(A, 1)));
  karten.appendChild(karte("p", "Faktor b", num(b, 1)));
  karten.appendChild(karte("p", "Periode 360° : b", mitZeichen(p, 1) + "°"));
  karten.appendChild(karte("w", `Schwingungen bis ${num(AP_XMAX)}°`, mitZeichen(AP_XMAX / p, 2)));

  document.getElementById("ap-bilanz").innerHTML =
    `<strong>a wirkt senkrecht:</strong> Jeder Funktionswert von sin x wird mit <span class="wa">${num(a, 1)}</span> multipliziert. ` +
    `Aus dem Hochpunkt (90° | 1) wird (90° | <span class="wa">${num(a, 1)}</span>)` +
    (a < 0 ? ` — und weil a negativ ist, wird daraus ein <em>Tief</em>punkt.` : `.`) + ` ` +
    `Die Nullstellen bleiben dabei, wo sie sind: 0 mal irgendetwas ist 0.<br>` +
    `<strong>b wirkt waagerecht:</strong> Das Argument ist <span class="wp">${num(b, 1)} · x</span>. ` +
    `Damit es 360° erreicht, genügt schon x = <span class="wp">${num(p, 1)}°</span> — ` +
    `${b > 1 ? "die Welle wird also gestaucht und schwingt schneller" : b === 1 ? "die Welle behält also die Breite der Grundwelle" : "die Welle wird also gedehnt und schwingt langsamer"}.<br>` +
    `<strong>Probe:</strong> f(${num(p / 4, 1)}°) = ${num(a, 1)} · sin(${num(b, 1)} · ${num(p / 4, 1)}°) = ` +
    `${num(a, 1)} · sin 90° = <span class="wa">${num(a, 1)}</span> ✓ &nbsp; und ` +
    `f(${num(p, 1)}°) = ${num(a, 1)} · sin 360° = <span class="ws">0</span> ✓`;

  document.getElementById("ap-text").innerHTML =
    `<span class="tf-urteil ${a < 0 ? "nein" : b > 1 ? "ja" : "eins"}">Amplitude ${num(A, 1)}, Periode ${mitZeichen(p, 1)}°</span> ` +
    (a < 0
      ? `Das negative a spiegelt die Kurve: Wo sin x steigt, fällt ${num(a, 1)} · sin(${num(b, 1)}x). Die Amplitude bleibt trotzdem ${num(A, 1)}.`
      : b > 1
        ? `Größeres b heißt kürzere Periode: In ${num(AP_XMAX)}° passen ${num(AP_XMAX / p, 2)} volle Schwingungen.`
        : b === 1
          ? `Bei b = 1 bleibt die Breite der Grundwelle erhalten: Die Periode ist die volle 360°. Nur die Höhe ist gestreckt.`
          : `Kleineres b heißt längere Periode: Die Welle braucht ${num(p, 1)}° für einen einzigen Durchlauf.`);
}

function initAmplitude() {
  document.getElementById("ap-a").addEventListener("input", renderAmplitude);
  document.getElementById("ap-b").addEventListener("input", renderAmplitude);
  renderAmplitude();
}

// ================= 5. Die allgemeine Sinusfunktion =================

const VS_XMIN = -180, VS_XMAX = 720;
const VS_LINKS = 62, VS_OBEN = 32, VS_HOEHE = 214;

function vsBild(a, b, c, d) {
  const B = 570, H = 306;
  const svg = neueFlaeche(B, H);
  svg.appendChild(svgText(B / 2, 15,
    `f(x) = ${num(a, 1)} · sin(${num(b, 1)} · (x ${summand(-c)}°)) ${summand(d, 1)} — blau die Mittellinie y = ${num(d, 1)}`,
    { class: "tf-titel" }));
  const f = (x) => a * sinG(b * (x - c)) + d;
  const spanne = Math.max(Math.abs(d + a), Math.abs(d - a), 1);
  const yMax = spanne + Math.abs(a) * 0.55, yMin = -yMax;
  const g = koordinaten(svg, {
    links: VS_LINKS, oben: VS_OBEN, breite: 448, hoehe: VS_HOEHE, xMin: VS_XMIN, xMax: VS_XMAX, yMin, yMax,
    xSchritt: 90, xBeschriftung: 180, ySchritt: yMax > 5 ? 2 : 1, yBeschriftung: yMax > 5 ? 2 : 1,
    yFormat: (y) => num(y, 1),
  });
  // Mittellinie und Hüllgeraden
  svg.appendChild(svgEl("line", { x1: g.px(VS_XMIN).toFixed(2), y1: g.py(d).toFixed(2), x2: g.px(VS_XMAX).toFixed(2), y2: g.py(d).toFixed(2), class: "tf-mittellinie" }));
  for (const w of [d + a, d - a]) {
    svg.appendChild(svgEl("line", { x1: g.px(VS_XMIN).toFixed(2), y1: g.py(w).toFixed(2), x2: g.px(VS_XMAX).toFixed(2), y2: g.py(w).toFixed(2), class: "tf-huelle" }));
  }
  kurveZeichnen(svg, g, (x) => sinG(x), VS_XMIN, VS_XMAX, yMin, yMax, "grund");
  kurveZeichnen(svg, g, f, VS_XMIN, VS_XMAX, yMin, yMax, "");

  const p = 360 / b;
  // Der Nulldurchgang der Mittellinie bei x = c und das erste Maximum danach
  punktZeichnen(svg, g, c, d, "marke", `c = ${num(c)}°`, c < 400, false);
  const xMax = c + p / 4;
  if (xMax <= VS_XMAX) punktZeichnen(svg, g, xMax, d + a, "zeit", `Max ${num(d + a, 1)}`, xMax < 400, true);
  const xMin2 = c + 3 * p / 4;
  if (xMin2 <= VS_XMAX) punktZeichnen(svg, g, xMin2, d - a, "zeit", `Min ${num(d - a, 1)}`, xMin2 < 400, false);
  // Links vom Pfeil steht die Beschriftung über dem fallenden Ast der Kurve,
  // rechts liefe sie mitten durch den steigenden. Am linken Bildrand bleibt nur
  // die rechte Seite.
  const platzLinks = g.px(c) > VS_LINKS + 76;
  masspfeil(svg, g.px(c), g.py(d), g.px(c), g.py(d + a), "amplitude", `a = ${num(a, 1)}`,
    platzLinks ? -9 : 9, 0, platzLinks ? "end" : "start");
  // Wie in Abschnitt 4: unter der Zeichenfläche, nicht quer durch die Wellentäler.
  if (c + p <= VS_XMAX) {
    const yPfeil = VS_OBEN + VS_HOEHE + 34;
    masspfeil(svg, g.px(c), yPfeil, g.px(c + p), yPfeil, "periode", `p = ${num(p, 1)}°`, 0, 13);
  }
  return svg;
}

function renderVerschiebung() {
  const a = Number(document.getElementById("vs-a").value) / 10;
  const b = Number(document.getElementById("vs-b").value) / 10;
  const c = Number(document.getElementById("vs-c").value);
  const d = Number(document.getElementById("vs-d").value) / 10;
  document.getElementById("vs-a-anzeige").textContent = num(a, 1);
  document.getElementById("vs-b-anzeige").textContent = num(b, 1);
  document.getElementById("vs-c-anzeige").textContent = num(c);
  document.getElementById("vs-d-anzeige").textContent = num(d, 1);
  const p = 360 / b, hoch = d + a, tief = d - a;

  document.getElementById("vs-gleichung").innerHTML =
    `f(x) = <span class="av">${num(a, 1)}</span> · sin(<span class="pv">${num(b, 1)}</span> · (x ${c < 0 ? "+" : "−"} ` +
    `<span class="wv">${num(Math.abs(c))}°</span>)) ${d < 0 ? "−" : "+"} <span class="sv">${num(Math.abs(d), 1)}</span>`;

  const mount = document.getElementById("vs-mount");
  mount.innerHTML = "";
  mount.appendChild(vsBild(a, b, c, d));

  document.getElementById("vs-schritte").innerHTML = [
    schrittZeile(`Mittellinie: y = <span class="sv">${num(d, 1)}</span>`, "der Summand d", "",
      "Um so viel ist die ganze Welle nach oben geschoben. Sie schwingt jetzt um diese Höhe."),
    schrittZeile(`Amplitude: <span class="av">${num(a, 1)}</span> — die Kurve reicht von ` +
      `<span class="av">${num(tief, 1)}</span> bis <span class="av">${num(hoch, 1)}</span>`,
      "d ∓ a", "",
      `Kontrolle: (${num(hoch, 1)} + ${num(tief, 1)}) : 2 = ${num(d, 1)} = d und (${num(hoch, 1)} − ${num(tief, 1)}) : 2 = ${num(a, 1)} = a.`),
    schrittZeile(`Periode: p = ${bruchHtml("360°", num(b, 1))} ${zeichen(p, 1)} <span class="pv">${num(p, 1)}°</span>`,
      "aus b", ""),
    schrittZeile(`Verschiebung: c = <span class="wv">${num(c)}°</span> nach ${c < 0 ? "links" : "rechts"}`,
      "der Wert in der Klammer", "",
      "Bei x = c beginnt die Welle wie sin x bei 0: Sie kreuzt dort steigend die Mittellinie."),
    schrittZeile(`Maximum bei x = c + p : 4 ${zeichen(c + p / 4, 1)} <span class="pv">${num(c + p / 4, 1)}°</span>, ` +
      `Minimum bei x = c + 3p : 4 ${zeichen(c + 3 * p / 4, 1)} <span class="pv">${num(c + 3 * p / 4, 1)}°</span>`,
      "eine Viertel- bzw. Dreiviertelperiode später", "fertig"),
  ].join("");

  const karten = document.getElementById("vs-karten");
  karten.innerHTML = "";
  karten.appendChild(karte("a", "Amplitude a", num(a, 1)));
  karten.appendChild(karte("p", "Periode p", mitZeichen(p, 1) + "°"));
  karten.appendChild(karte("w", "Verschiebung c", num(c) + "°"));
  karten.appendChild(karte("s", "Mittellinie d", num(d, 1)));
  karten.appendChild(karte("p", "Maximum / Minimum", num(hoch, 1) + " / " + num(tief, 1)));

  const probe = a * sinG(b * (c + p / 4 - c)) + d;
  document.getElementById("vs-bilanz").innerHTML =
    `<strong>Die Reihenfolge der vier Wirkungen:</strong> Erst wird sin x mit <span class="wa">${num(a, 1)}</span> in die Höhe ` +
    `gestreckt, dann mit <span class="wp">${num(b, 1)}</span> in der Breite gestaucht, dann um <span class="ww">${num(Math.abs(c))}°</span> nach ` +
    `${c < 0 ? "links" : "rechts"} und schließlich um <span class="ws">${num(Math.abs(d), 1)}</span> nach ${d < 0 ? "unten" : "oben"} geschoben.<br>` +
    `<strong>Probe am Maximum:</strong> f(${num(c + p / 4, 1)}°) = ${num(a, 1)} · sin(${num(b, 1)} · ` +
    `${num(p / 4, 1)}°) + ${num(d, 1)} = ${num(a, 1)} · sin 90° + ${num(d, 1)} ${zeichen(probe, 1)} ` +
    `<span class="wp">${num(probe, 1)}</span> ✓<br>` +
    `<strong>Rückwärts aus einem Graphen:</strong> d = (${num(hoch, 1)} + ${num(tief, 1)}) : 2 = <span class="ws">${num(d, 1)}</span>, ` +
    `a = (${num(hoch, 1)} − ${num(tief, 1)}) : 2 = <span class="wa">${num(a, 1)}</span>, ` +
    `b = 360° : ${num(p, 1)}° ${zeichen(b, 1)} <span class="wp">${num(b, 1)}</span>, und c ist die Stelle des steigenden ` +
    `Schnittpunkts mit der Mittellinie: <span class="ww">${num(c)}°</span>.<br>` +
    (b === 1
      ? `<strong>Zur Klammer:</strong> Weil b = 1 ist, darf man sie hier weglassen: sin(1 · (x ${summand(-c)}°)) ist dasselbe wie ` +
        `sin(x ${summand(-c)}°). Sobald b ≠ 1 ist, gilt das nicht mehr — stelle den Regler für b einmal um.`
      : `<strong>Achtung bei der Klammer:</strong> ${num(b, 1)} · (x ${summand(-c)}°) ausmultipliziert heißt ` +
        `${faktorHtml(b)}x ${summand(-b * c, 1)}°. Stünde die Gleichung so da, wäre die Verschiebung nicht ` +
        `${num(b * c, 1)}°, sondern nach dem Ausklammern wieder <span class="ww">${num(c)}°</span>.`);

  document.getElementById("vs-text").innerHTML =
    `<span class="tf-urteil ${d > 0 ? "ja" : d < 0 ? "nein" : "eins"}">Werte zwischen ${num(tief, 1)} und ${num(hoch, 1)}</span> ` +
    `Alle vier Parameter zusammen: Die Welle schwingt um die Höhe ${num(d, 1)}, greift ${num(a, 1)} nach oben und unten aus, ` +
    `braucht ${mitZeichen(p, 1)}° für einen Durchlauf und startet ${c === 0 ? "genau im Ursprungstakt" : num(Math.abs(c)) + "° weiter " + (c < 0 ? "links" : "rechts")}.`;
}

function initVerschiebung() {
  for (const id of ["vs-a", "vs-b", "vs-c", "vs-d"]) {
    document.getElementById(id).addEventListener("input", renderVerschiebung);
  }
  renderVerschiebung();
}

// ================= 6. Periodische Vorgänge =================

// Jeder Typ liefert dieselben vier Parameter — nur die Sprache ist eine andere.
const AN_TYPEN = [
  {
    id: "rad", name: "Riesenrad",
    kandidaten: (() => {
      const l = [];
      for (const D of [40, 48, 60, 80, 100, 120]) {
        for (const boden of [2, 3, 4, 5]) for (const T of [180, 240, 300, 360, 480, 600]) l.push({ D, boden, T });
      }
      return l;
    })(),
    baue: (k) => ({
      a: k.D / 2, d: k.D / 2 + k.boden, p: k.T, c: k.T / 4,
      xEinheit: "s", yEinheit: "m", xName: "t", groesse: "Höhe",
      text: `Ein Riesenrad hat den Durchmesser <strong>${num(k.D)} m</strong>; der tiefste Punkt einer Gondel liegt ` +
        `<strong>${num(k.boden)} m</strong> über dem Boden. Eine volle Umdrehung dauert <strong>${num(k.T)} s</strong>. ` +
        `Die Gondel startet bei t = 0 ganz unten. Wie hoch ist sie zur Zeit t?`,
      hoechst: `Der höchste Punkt liegt bei ${num(k.D + k.boden)} m, der tiefste bei ${num(k.boden)} m.`,
      cGrund: `Ganz unten ist ein <em>Minimum</em>. Ein Minimum liegt drei Viertel einer Periode nach c — oder, ` +
        `gleichbedeutend, eine Viertelperiode davor. Also ist c = 0 s + ${num(k.T)} s : 4 = ${num(k.T / 4)} s.`,
      xPrueflich: k.T / 2, prueftext: `nach einer halben Umdrehung ganz oben`,
      grenze: `hält das Rad zum Ein- und Aussteigen an`,
    }),
  },
  {
    id: "tag", name: "Tageslänge",
    kandidaten: (() => {
      const l = [];
      for (const lang of [15, 16, 17, 18]) for (const kurz of [6, 7, 8, 9]) l.push({ lang, kurz });
      return l;
    })(),
    baue: (k) => ({
      a: (k.lang - k.kurz) / 2, d: (k.lang + k.kurz) / 2, p: 365, c: 172 - 365 / 4,
      xEinheit: "Tage", yEinheit: "h", xName: "t", groesse: "Tageslänge",
      text: `An einem Ort dauert der längste Tag <strong>${num(k.lang)} Stunden</strong> und der kürzeste ` +
        `<strong>${num(k.kurz)} Stunden</strong>. Der längste Tag ist der <strong>172. Tag</strong> des Jahres, ` +
        `ein Jahr hat <strong>365 Tage</strong>. Beschreibe die Tageslänge als Funktion des Tages t.`,
      hoechst: `Die längste Tageslänge ist ${num(k.lang)} h, die kürzeste ${num(k.kurz)} h.`,
      cGrund: `Das Maximum liegt eine Viertelperiode nach c, also ist c = 172 − 365 : 4 = 172 − 91,25 = 80,75 — ` +
        `ungefähr der 81. Tag, und das ist der Frühlingsanfang.`,
      xPrueflich: 172, prueftext: `am längsten Tag`,
      grenze: `ist ein Jahr nicht genau 365 Tage lang, und die Kurve ist nur nahezu sinusförmig`,
    }),
  },
  {
    id: "flut", name: "Gezeiten",
    kandidaten: (() => {
      const l = [];
      for (const hoch of [4.5, 5, 5.5, 6]) for (const tief of [1, 1.5, 2]) for (const th of [2, 3, 4, 5]) l.push({ hoch, tief, th });
      return l;
    })(),
    baue: (k) => ({
      a: (k.hoch - k.tief) / 2, d: (k.hoch + k.tief) / 2, p: 12.4, c: k.th - 3.1,
      xEinheit: "h", yEinheit: "m", xName: "t", groesse: "Wasserstand",
      text: `In einem Hafen beträgt der Wasserstand bei Hochwasser <strong>${num(k.hoch, 1)} m</strong> und bei ` +
        `Niedrigwasser <strong>${num(k.tief, 1)} m</strong>. Zwischen zwei Hochwassern liegen <strong>12,4 Stunden</strong>. ` +
        `Das erste Hochwasser des Tages ist um <strong>${num(k.th)} Uhr</strong>. Beschreibe den Wasserstand.`,
      hoechst: `Der höchste Stand ist ${num(k.hoch, 1)} m, der niedrigste ${num(k.tief, 1)} m.`,
      cGrund: `Das Hochwasser um ${num(k.th)} Uhr ist ein Maximum, und ein Maximum liegt eine Viertelperiode ` +
        `nach c: c = ${num(k.th)} − 12,4 : 4 = ${num(k.th)} − 3,1 = ${num(k.th - 3.1, 1)}.`,
      xPrueflich: k.th, prueftext: `zur Zeit des Hochwassers`,
      grenze: `verschieben Wetter und Mondphase die Gezeiten um einige Zentimeter`,
    }),
  },
];
let anTyp = 0;

function anBild(m) {
  const B = 560, H = 290;
  const svg = neueFlaeche(B, H);
  svg.appendChild(svgText(B / 2, 15,
    `${m.groesse} in ${m.yEinheit} — blau die Mittellinie y = ${num(m.d, 2)}`, { class: "tf-titel" }));
  const f = (x) => m.a * sinG((360 / m.p) * (x - m.c)) + m.d;
  const xMax = 2 * m.p;
  const yMax = (m.d + m.a) * 1.2;
  const schritt = Math.max(1, Math.round(yMax / 6));
  const g = koordinaten(svg, {
    links: 60, oben: 30, breite: 442, hoehe: 200, xMin: 0, xMax, yMin: 0, yMax,
    xSchritt: m.p / 4, xBeschriftung: m.p / 2, ySchritt: schritt, yBeschriftung: schritt,
    xFormat: (x) => num(x, 1), yFormat: (y) => num(y, 1), xName: m.xName,
  });
  for (const w of [m.d, m.d + m.a, m.d - m.a]) {
    svg.appendChild(svgEl("line", {
      x1: g.px(0).toFixed(2), y1: g.py(w).toFixed(2), x2: g.px(xMax).toFixed(2), y2: g.py(w).toFixed(2),
      class: w === m.d ? "tf-mittellinie" : "tf-huelle",
    }));
  }
  kurveZeichnen(svg, g, f, 0, xMax, 0, yMax, "");
  // Nur der Höchstwert wird beschriftet: Unter dem Tiefpunkt ist bis zur
  // x-Achse kein Platz mehr, dort stünde die Zahl auf den Gradzahlen.
  for (let k = 0; k < 3; k++) {
    const xh = m.c + m.p / 4 + k * m.p, xt = m.c + 3 * m.p / 4 + k * m.p;
    if (xh >= 0 && xh <= xMax) punktZeichnen(svg, g, xh, m.d + m.a, "zeit", k === 0 ? `${num(m.d + m.a, 1)} ${m.yEinheit}` : null, xh < xMax * 0.7, true);
    if (xt >= 0 && xt <= xMax) punktZeichnen(svg, g, xt, m.d - m.a, "zeit", null);
  }
  const cImBild = m.c >= 0 ? m.c : m.c + m.p;
  if (cImBild <= xMax) punktZeichnen(svg, g, cImBild, m.d, "marke", `c = ${num(m.c, 2)} ${m.xEinheit}`, cImBild < xMax * 0.6, false);
  svg.appendChild(svgText(B / 2, H - 8,
    `Zwischen ${num(m.d - m.a, 1)} und ${num(m.d + m.a, 1)} ${m.yEinheit}; eine Periode dauert ${num(m.p, 1)} ${m.xEinheit}.`,
    { class: "tf-achsentext" }));
  return svg;
}

function anBaue() {
  const typ = AN_TYPEN[anTyp];
  const m = typ.baue(pick(typ.kandidaten));
  const b = 360 / m.p;
  const wert = m.a * sinG(b * (m.xPrueflich - m.c)) + m.d;

  const schritte = [
    schrittZeile(m.text, "Aufgabe"),
    schrittZeile(`d = ${bruchHtml(`${num(m.d + m.a, 2)} + ${num(m.d - m.a, 2)}`, "2")} = <span class="sv">${num(m.d, 2)} ${m.yEinheit}</span>`,
      "Mittellinie", "", m.hoechst + " Die Mittellinie liegt genau dazwischen."),
    schrittZeile(`a = ${bruchHtml(`${num(m.d + m.a, 2)} − ${num(m.d - m.a, 2)}`, "2")} = <span class="av">${num(m.a, 2)} ${m.yEinheit}</span>`,
      "Amplitude", "", "Die halbe Spannweite zwischen größtem und kleinstem Wert."),
    schrittZeile(`p = <span class="pv">${num(m.p, 1)} ${m.xEinheit}</span> &nbsp;→&nbsp; b = ${bruchHtml("360°", num(m.p, 1))} ` +
      `${zeichen(b, 3)} <span class="pv">${num(b, 3)}</span>`,
      "Periode und Faktor b", "", "Die Einheit von p muss dieselbe sein wie die der x-Achse."),
    schrittZeile(`c = <span class="wv">${num(m.c, 2)} ${m.xEinheit}</span>`, "Verschiebung", "", m.cGrund),
    schrittZeile(`f(${m.xName}) = <span class="av">${num(m.a, 2)}</span> · sin(<span class="pv">${num(b, 3)}</span> · ` +
      `(${m.xName} ${m.c < 0 ? "+" : "−"} <span class="wv">${num(Math.abs(m.c), 2)}</span>)) + <span class="sv">${num(m.d, 2)}</span>`,
      "die fertige Gleichung", "fertig"),
  ];

  const bilanz =
    `<span class="wp">f(${m.xName}) = ${num(m.a, 2)} · sin(${num(b, 3)} · (${m.xName} ${m.c < 0 ? "+" : "−"} ${num(Math.abs(m.c), 2)})) + ${num(m.d, 2)}</span><br>` +
    `<strong>Probe ${m.prueftext}:</strong> f(${num(m.xPrueflich, 2)}) = ${num(m.a, 2)} · sin(${num(b, 3)} · ` +
    `${num(m.xPrueflich - m.c, 2)}) + ${num(m.d, 2)} ${zeichen(wert, 2)} <span class="wa">${num(wert, 2)} ${m.yEinheit}</span> — ` +
    `und das ist genau der größte Wert ${num(m.d + m.a, 2)} ${m.yEinheit}. ✓<br>` +
    `<strong>Wann tritt der Höchstwert auf?</strong> Bei ${m.xName} = c + p : 4 ${zeichen(m.c + m.p / 4, 2)} ` +
    `<span class="wp">${num(m.c + m.p / 4, 2)} ${m.xEinheit}</span> und dann immer wieder nach je ${num(m.p, 1)} ${m.xEinheit}.<br>` +
    `<strong>Wann der kleinste?</strong> Bei ${m.xName} = c + 3p : 4 ${zeichen(m.c + 3 * m.p / 4, 2)} ` +
    `<span class="wp">${num(m.c + 3 * m.p / 4, 2)} ${m.xEinheit}</span> — eine halbe Periode nach dem Höchstwert.<br>` +
    `<strong>Grenze des Modells:</strong> Der Sinus schwingt für alle Zeiten exakt gleich. In Wirklichkeit ` +
    `${m.grenze}. Ein Sinusmodell beschreibt den Vorgang gut, aber nicht exakt.`;

  return {
    schritte,
    gleichungHtml: `f(${m.xName}) = <span class="av">${num(m.a, 2)}</span> · sin(<span class="pv">${num(b, 3)}</span> · ` +
      `(${m.xName} ${m.c < 0 ? "+" : "−"} <span class="wv">${num(Math.abs(m.c), 2)}</span>)) + <span class="sv">${num(m.d, 2)}</span>`,
    bilanz,
    bild: () => anBild(m),
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

// Aufgabe 1 — die Periode aus der Gleichung ablesen.
// b ist stets ein Teiler von 360, damit die Periode eine ganze Gradzahl ist.
const A1_KANDIDATEN = (() => {
  const liste = [];
  for (const a of [1, 2, 3, 4, 5, 6, 8, 10]) {
    for (const b of [2, 3, 4, 5, 6, 8, 9, 10, 12]) liste.push({ a, b });
  }
  return liste;
})();

function generateAufgabe1() {
  const kd = ohneKollision(
    A1_KANDIDATEN,
    (v) => [360 / v.b, 360 * v.b, 360, v.a],
    A1_KANDIDATEN[0],
    0.4,
  );
  const { a, b } = kd;
  const p = 360 / b;
  return {
    promptHtml: `Gegeben ist die Funktion <strong>f(x) = ${faktorHtml(a)}sin(${num(b)} · x)</strong>.<br>` +
      `Wie groß ist ihre <strong>Periode</strong> in Grad?`,
    correct: p,
    tolerance: 0.4,
    placeholder: "Periode in Grad",
    hinweis: (raw, val) => {
      if (Math.abs(val - 360 * b) < 0.4) return `Hier wurde mit ${num(b)} <em>multipliziert</em>. Ein größeres b lässt die Welle aber <strong>schneller</strong> schwingen, die Periode wird also <em>kürzer</em>: p = 360° : b.`;
      if (Math.abs(val - 360) < 0.4) return `360° ist die Periode der Grundfunktion sin x, also der Fall b = 1. Hier steht ${num(b)} vor dem x — das Argument erreicht 360° schon nach einem ${num(b)}-tel dieser Strecke.`;
      if (Math.abs(val - a) < 0.4) return `Die ${num(a)} ist die <strong>Amplitude</strong>, der Faktor <em>vor</em> dem Sinus. Die Periode steckt in dem Faktor <em>bei</em> x.`;
      return `Die Periode ist p = 360° : b. Probe: Setze x = p ein, dann muss b · x gerade 360° ergeben.`;
    },
    musterloesungHtml:
      `<strong>Formel:</strong> p = 360° : b<br>` +
      `<strong>Einsetzen:</strong> p = 360° : ${num(b)} = <strong>${num(p)}°</strong><br>` +
      `<strong>Probe:</strong> Bei x = ${num(p)}° ist das Argument ${num(b)} · ${num(p)}° = 360° — genau eine volle Schwingung. ✓<br>` +
      `<em>Nebenbei:</em> Die Amplitude ist |${num(a)}| = ${num(a)}; die Kurve läuft also zwischen −${num(a)} und ${num(a)}. ` +
      `Der erste Hochpunkt liegt bei x = p : 4 = ${num(p / 4)}°.`,
  };
}

// Aufgabe 2 — vom Bogenmaß ins Gradmaß.
const A2_KANDIDATEN = (() => {
  const liste = [];
  for (const n of [2, 3, 4, 6]) {
    for (let z = 1; z <= 2 * n; z++) {
      if (ggT(z, n) !== 1) continue;      // nur vollständig gekürzte Brüche
      liste.push({ z, n });
    }
  }
  return liste;
})();

function generateAufgabe2() {
  const kd = ohneKollision(
    A2_KANDIDATEN,
    (v) => {
      const zn = v.z / v.n;
      return [zn * 180, zn * 360, zn * Math.PI * Math.PI / 180];
    },
    A2_KANDIDATEN[0],
    0.4,
  );
  const { z, n } = kd;
  const zn = z / n;
  const grad = zn * 180;
  const zaehler = z === 1 ? "π" : `${num(z)}π`;
  const bruch = n === 1 ? zaehler : bruchHtml(zaehler, num(n));
  return {
    promptHtml: `Ein Winkel hat im Bogenmaß den Wert <strong>x = ${bruch}</strong>.<br>` +
      `Wie groß ist er im <strong>Gradmaß</strong>?`,
    correct: grad,
    tolerance: 0.4,
    placeholder: "Winkel in Grad",
    hinweis: (raw, val) => {
      if (Math.abs(val - zn * 360) < 0.4) return `Hier wurde mit 360° multipliziert. Der <em>ganze</em> Kreis ist 2π, also entspricht <strong>π allein nur 180°</strong> — dem halben Kreis.`;
      if (Math.abs(val - zn * Math.PI * Math.PI / 180) < 0.4) return `Das ist die Umrechnung in die falsche Richtung: mit π : 180 kommt man vom Gradmaß <em>ins</em> Bogenmaß. Zurück geht es mit dem Kehrwert <strong>180 : π</strong>.`;
      return `Setze π = 180° ein: ${bruch} bedeutet ${num(z)} · 180° : ${num(n)}.`;
    },
    musterloesungHtml:
      `<strong>Umrechnung:</strong> α = x · ${bruchHtml("180°", "π")}<br>` +
      `<strong>Einsetzen:</strong> α = ${bruch} · ${bruchHtml("180°", "π")} = ${bruchHtml(`${num(z)} · 180°`, num(n))} = <strong>${num(grad)}°</strong><br>` +
      `<em>Kurzform:</em> π entspricht 180°. Also ist ${bruch} einfach ${num(z)} · 180° : ${num(n)} = ${num(grad)}°.<br>` +
      `<em>Probe:</em> Zurück mit π : 180 ergibt ${num(grad)}° · π : 180 = ${num(zn, 4)}π ≈ ${num(grad * BOGEN, 4)}. ✓`,
  };
}

// Aufgabe 3 — die Verschiebung c aus Maximum, Minimum und Periode bestimmen.
const A3_KANDIDATEN = (() => {
  const liste = [];
  for (const p of [120, 180, 240, 360, 720]) {
    for (const xm of [0, 30, 45, 60, 75, 90, 105, 120, 135, 150, 180, 210, 240, 270, 300]) {
      if (xm >= p) continue;
      for (const [hoch, tief] of [[5, 1], [6, 2], [8, 2], [10, 4], [7, 3], [9, 1], [12, 4], [4, -2]]) {
        liste.push({ p, xm, hoch, tief });
      }
    }
  }
  return liste;
})();

function a3C(xm, p) { return ((xm - p / 4) % p + p) % p; }

function generateAufgabe3() {
  const kd = ohneKollision(
    A3_KANDIDATEN,
    (v) => [
      a3C(v.xm, v.p),                                   // richtig
      ((v.xm % v.p) + v.p) % v.p,                       // c mit der Maximumstelle verwechselt
      ((v.xm + v.p / 4) % v.p + v.p) % v.p,             // Viertelperiode addiert statt subtrahiert
      ((v.xm - v.p / 2) % v.p + v.p) % v.p,             // halbe statt viertel Periode
    ],
    A3_KANDIDATEN[0],
    0.4,
  );
  const { p, xm, hoch, tief } = kd;
  const c = a3C(xm, p);
  const a = (hoch - tief) / 2, d = (hoch + tief) / 2, b = 360 / p;
  return {
    promptHtml: `Der Graph von <strong>f(x) = a · sin(b · (x − c)) + d</strong> hat die Periode <strong>${num(p)}°</strong>. ` +
      `Sein höchster Wert ist <strong>${num(hoch)}</strong>, sein niedrigster <strong>${num(tief)}</strong>, und ein ` +
      `<strong>Hochpunkt liegt bei x = ${num(xm)}°</strong>.<br>` +
      `Wie groß ist <strong>c</strong>? <em>Gib den Wert mit 0° ≤ c &lt; ${num(p)}° an.</em>`,
    correct: c,
    tolerance: 0.4,
    placeholder: "c in Grad",
    hinweis: (raw, val) => {
      if (Math.abs(val - (((xm % p) + p) % p)) < 0.4) return `Das ist die Stelle des <em>Hochpunkts</em>. Bei x = c kreuzt die Kurve die Mittellinie erst <strong>steigend</strong> — der Hochpunkt kommt eine Viertelperiode später.`;
      if (Math.abs(val - (((xm + p / 4) % p + p) % p)) < 0.4) return `Die Viertelperiode wurde <em>addiert</em>. Vom Hochpunkt aus geht es <strong>zurück</strong> zu c: c = ${num(xm)}° − ${num(p / 4)}°.`;
      if (Math.abs(val - (((xm - p / 2) % p + p) % p)) < 0.4) return `Abgezogen wurde eine <em>halbe</em> Periode. Zwischen dem Nulldurchgang c und dem Hochpunkt liegt aber nur ein <strong>Viertel</strong> der Periode; eine halbe Periode führte schon zum Tiefpunkt.`;
      return `Ein Hochpunkt liegt immer bei c + p : 4. Also ist c = ${num(xm)}° − ${num(p)}° : 4.`;
    },
    musterloesungHtml:
      `<strong>Merksatz:</strong> Der Hochpunkt liegt eine Viertelperiode nach c: &nbsp; x<sub>Hoch</sub> = c + p : 4<br>` +
      `<strong>Nach c auflösen:</strong> c = x<sub>Hoch</sub> − p : 4 = ${num(xm)}° − ${num(p / 4)}° = <strong>${num(xm - p / 4)}°</strong>` +
      (xm - p / 4 < 0 ? `<br><strong>In den Bereich schieben:</strong> ${num(xm - p / 4)}° + ${num(p)}° = <strong>${num(c)}°</strong> — eine ganze Periode ändert die Kurve nicht.` : ``) + `<br>` +
      `<strong>Die übrigen Parameter:</strong> d = (${num(hoch)} + ${num(tief)}) : 2 = ${num(d)}, ` +
      `a = (${num(hoch)} − ${num(tief)}) : 2 = ${num(a)}, b = 360° : ${num(p)}° = ${num(b, 3)}<br>` +
      `<strong>Fertige Gleichung:</strong> f(x) = ${num(a)} · sin(${num(b, 3)} · (x − ${num(c)}°)) + ${num(d)}<br>` +
      `<em>Probe:</em> f(${num(xm)}°) = ${num(a)} · sin(${num(b, 3)} · ${num(((xm - c) % p + p) % p)}°) + ${num(d)} = ` +
      `${num(a)} · sin 90° + ${num(d)} = ${num(hoch)} ✓`,
  };
}

// Aufgabe 4 — Höhe einer Riesenradgondel zu einem Bruchteil der Umlaufzeit.
// Nur Stellen mit cos ≠ 0: Bei einer Viertel- oder Dreivierteldrehung ergäbe
// auch die falsche Rechnung mit dem Durchmesser statt dem Radius die richtige
// Höhe — die Aufgabe könnte den Fehler dort nicht mehr aufdecken.
const A4_STELLEN = [
  { z: 1, n: 6, grad: 60, kos: 0.5 },
  { z: 1, n: 3, grad: 120, kos: -0.5 },
  { z: 1, n: 2, grad: 180, kos: -1 },
  { z: 2, n: 3, grad: 240, kos: -0.5 },
  { z: 5, n: 6, grad: 300, kos: 0.5 },
];
const A4_KANDIDATEN = (() => {
  const liste = [];
  for (const D of [32, 40, 48, 56, 60, 64, 80, 100]) {
    for (const boden of [2, 3, 4, 5]) {
      for (const T of [120, 180, 240, 300, 360, 480, 600]) {
        for (const st of A4_STELLEN) liste.push({ D, boden, T, st });
      }
    }
  }
  return liste;
})();

function generateAufgabe4() {
  const kd = ohneKollision(
    A4_KANDIDATEN,
    (v) => {
      const h = v.D / 2 + v.boden;
      return [
        h - (v.D / 2) * v.st.kos,                         // richtig
        h - v.D * v.st.kos,                               // Durchmesser statt Radius
        h + (v.D / 2) * sinG(v.st.grad),                  // sin statt −cos
        (v.D / 2) * (1 - v.st.kos),                       // Bodenabstand vergessen
      ];
    },
    A4_KANDIDATEN[0],
    0.5,
  );
  const { D, boden, T, st } = kd;
  const r = D / 2, h = r + boden, t = T * st.z / st.n;
  const hoehe = h - r * st.kos;
  const b = 360 / T;
  return {
    promptHtml: `Ein Riesenrad hat den Durchmesser <strong>${num(D)} m</strong>. Sein tiefster Punkt liegt ` +
      `<strong>${num(boden)} m</strong> über dem Boden, eine volle Umdrehung dauert <strong>${num(T)} s</strong>. ` +
      `Eine Gondel startet bei t = 0 ganz unten.<br>` +
      `In welcher <strong>Höhe über dem Boden</strong> ist sie nach <strong>${num(t)} s</strong>?`,
    correct: hoehe,
    tolerance: 0.05,
    placeholder: "Höhe in m",
    hinweis: (raw, val) => {
      if (Math.abs(val - (h - D * st.kos)) < 0.5) return `Hier wurde mit dem <strong>Durchmesser</strong> gerechnet. Die Gondel bewegt sich aber auf einem Kreis mit dem <em>Radius</em> ${num(r)} m — nur der halbe Durchmesser geht in die Amplitude ein.`;
      if (Math.abs(val - (h + r * sinG(st.grad))) < 0.5) return `Das wäre ein <strong>Sinus</strong>-Ansatz mit Start auf der Mittellinie. Die Gondel startet aber ganz <em>unten</em>, also bei einem Minimum — dazu gehört −cos, nicht sin.`;
      if (Math.abs(val - r * (1 - st.kos)) < 0.5) return `Das ist die Höhe über dem <em>tiefsten Punkt</em> der Gondel. Gefragt ist die Höhe über dem <strong>Boden</strong> — es fehlen noch die ${num(boden)} m Bodenabstand.`;
      return `Die Achse liegt in ${num(r)} + ${num(boden)} = ${num(h)} m Höhe. Von dort aus: h(t) = ${num(h)} − ${num(r)} · cos(${num(b, 3)}° · t).`;
    },
    musterloesungHtml:
      `<strong>1. Achsenhöhe:</strong> d = ${bruchHtml(num(D), "2")} + ${num(boden)} = ${num(r)} + ${num(boden)} = <strong>${num(h)} m</strong><br>` +
      `<strong>2. Amplitude:</strong> a = Radius = <strong>${num(r)} m</strong><br>` +
      `<strong>3. Ansatz:</strong> Start ganz unten heißt Start im Minimum: h(t) = ${num(h)} − ${num(r)} · cos(${bruchHtml("360°", num(T))} · t)<br>` +
      `<strong>4. Einsetzen:</strong> ${bruchHtml("360°", num(T))} · ${num(t)} s = ${num(st.grad)}°, und cos ${num(st.grad)}° = ${num(st.kos, 1)}<br>` +
      `<strong>5. Rechnen:</strong> h(${num(t)}) = ${num(h)} − ${num(r)} · ${num(st.kos, 1)} = <strong>${num(hoehe)} m</strong><br>` +
      `<em>Kontrolle:</em> ${num(t)} s sind ${bruchHtml(num(st.z), num(st.n))} der Umlaufzeit. Der Wert muss zwischen ` +
      `${num(boden)} m (ganz unten) und ${num(D + boden)} m (ganz oben) liegen — ${num(hoehe)} m tut das. ✓<br>` +
      `<em>Als Sinusfunktion:</em> h(t) = ${num(r)} · sin(${num(b, 3)} · (t − ${num(T / 4)})) + ${num(h)} — dasselbe, nur mit c = T : 4.`,
  };
}

function initExercises() {
  mountUebungsaufgaben(document.getElementById("exercises-mount"), [
    { schwierigkeit: "einfach", titel: "Aufgabe 1 — Periode ablesen", generate: generateAufgabe1 },
    { schwierigkeit: "mittel", titel: "Aufgabe 2 — Bogenmaß ins Gradmaß", generate: generateAufgabe2 },
    { schwierigkeit: "schwierig", titel: "Aufgabe 3 — die Verschiebung c bestimmen", generate: generateAufgabe3 },
    { schwierigkeit: "komplex", titel: "Aufgabe 4 — Riesenrad", generate: generateAufgabe4 },
  ]);
}

// ================= Quizze =================

function initQuizzes() {
  mountQuiz(document.getElementById("quiz-einheitskreis"), {
    q: "In welchem Quadranten ist sin α negativ und cos α positiv?",
    options: ["im IV. (270°–360°)", "im II. (90°–180°)", "im III. (180°–270°)", "im I. (0°–90°)"],
    correct: 0,
    explain: "cos α positiv heißt: Der Punkt liegt rechts von der y-Achse. sin α negativ heißt: Er liegt unterhalb der x-Achse. Rechts und unten — das ist genau der IV. Quadrant, zum Beispiel α = 300° mit cos 300° = 0,5 und sin 300° ≈ −0,87.",
  });
  mountQuiz(document.getElementById("quiz-bogenmass"), {
    q: "Welchem Winkel im Gradmaß entspricht das Bogenmaß <sup>3</sup>⁄<sub>4</sub>π?",
    options: ["135°", "270°", "75°", "240°"],
    correct: 0,
    explain: "π entspricht 180°, also ist ¾π gerade ¾ · 180° = 135°. Die 270° gehören zu 3⁄2π und 240° zu 4⁄3π. Wer 75° tippt, hat 3 und 4 wohl voneinander abgezogen statt sie als Bruch zu lesen.",
  });
  mountQuiz(document.getElementById("quiz-kurven"), {
    q: "Wie viele Lösungen hat die Gleichung sin x = 0,5 im Bereich 0° ≤ x &lt; 360°?",
    options: ["zwei: 30° und 150°", "eine: 30°", "vier", "keine"],
    correct: 0,
    explain: "Die waagerechte Gerade y = 0,5 schneidet die Sinuskurve in einer Periode zweimal: einmal beim Steigen (30°) und einmal beim Fallen (150°). Auf dem Einheitskreis sind das die beiden Punkte gleicher Höhe — links und rechts von der y-Achse. Über alle Winkel hinweg gibt es unendlich viele Lösungen, denn nach je 360° wiederholt sich alles.",
  });
  mountQuiz(document.getElementById("quiz-amplitude"), {
    q: "Welche Periode hat f(x) = 3 · sin(4x)?",
    options: ["90°", "1440°", "360°", "3°"],
    correct: 0,
    explain: "p = 360° : b = 360° : 4 = 90°. Probe: Bei x = 90° ist das Argument 4 · 90° = 360°, also genau eine volle Schwingung. Die 1440° kämen von 360° · 4 heraus — ein größeres b macht die Periode aber kürzer, nicht länger. Die 3 ist die Amplitude.",
  });
  mountQuiz(document.getElementById("quiz-verschiebung"), {
    q: "Um wie viel ist der Graph von f(x) = sin(3 · (x − 60°)) gegenüber sin(3x) verschoben?",
    options: ["um 60° nach rechts", "um 60° nach links", "um 180° nach rechts", "um 20° nach rechts"],
    correct: 0,
    explain: "In der Klammer steht x − 60°, und ein Minus verschiebt nach rechts — wie bei der Scheitelform der Parabel. Der Faktor 3 steht schon vor der Klammer und ändert daran nichts. Anders wäre es bei sin(3x − 60°): Dort müsste man erst ausklammern, 3x − 60° = 3 · (x − 20°), und die Verschiebung betrüge nur 20°.",
  });
  mountQuiz(document.getElementById("quiz-anwendungen"), {
    q: "Ein Riesenrad mit 40 m Durchmesser dreht sich in 300 s einmal. Der tiefste Punkt liegt 2 m über dem Boden. Wie hoch ist die Gondel nach 150 s, wenn sie unten startet?",
    options: ["42 m", "22 m", "40 m", "20 m"],
    correct: 0,
    explain: "150 s sind eine halbe Umdrehung — die Gondel steht also ganz oben. Der höchste Punkt liegt 2 m + 40 m = 42 m über dem Boden. Die 22 m wären die Höhe der Achse (nach einer Viertel- oder Dreivierteldrehung), und 40 m wäre der Durchmesser ohne den Bodenabstand.",
  });
}

// ================= Start =================

initEinheitskreis();
initBogenmass();
initKurven();
initAmplitude();
initVerschiebung();
initAnwendungen();
initExercises();
initQuizzes();
