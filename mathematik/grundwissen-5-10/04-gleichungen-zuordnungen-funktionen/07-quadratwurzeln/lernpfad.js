// Selbstlernpfad "Quadratwurzeln" (Grundwissen Klasse 5-10, Kapitel 4).
// Rein clientseitiges Vanilla-JS, ohne Build-Schritt oder externe Bibliotheken.
//
// Leitgedanke: Die Quadratwurzel ist die Umkehrung des Quadrierens, und das
// Quadrat ist eine Fläche. Deshalb steht in fast jedem Abschnitt ein Quadrat
// im Bild: Abschnitt 1 liest die Seitenlänge aus der Fläche ab, Abschnitt 2
// schachtelt sie zwischen zwei Gitterlinien ein, Abschnitt 3 zeigt, warum das
// Verfahren bei den meisten Zahlen nie endet, Abschnitt 4 vergleicht die
// beiden gültigen Regeln mit der ungültigen für die Summe, Abschnitt 5 zerlegt
// den Radikanden und Abschnitt 6 wendet alles auf Längen an.
//
// Durchgehende Farbcodierung: Radikand blau, Wurzelwert rot, Quadratzahlen
// grün, herausgezogener Faktor orange, Näherungen violett.

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
  return x.toLocaleString("de-DE", { maximumFractionDigits: digits, minimumFractionDigits: 0 }).replace("-", "−");
}
// Feste Stellenzahl — für Näherungen, bei denen die letzte Null etwas bedeutet.
function fest(x, digits) {
  return x.toLocaleString("de-DE", { maximumFractionDigits: digits, minimumFractionDigits: digits }).replace("-", "−");
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
  return el("div", { class: "wr-karte " + klasse }, [
    el("span", { class: "name" }, name),
    el("span", { class: "wert", html: inhalt }),
  ]);
}
function faktor(text) {
  return `<span class="nw">${text}</span>`;
}
// Das Wurzelzeichen mit Dach über dem Radikanden. Ohne das Dach wüsste man
// nicht, wie weit die Wurzel reicht — bei √(a + b) ist genau das die Frage.
function wurzel(inhaltHtml, klasse = "") {
  return `<span class="wurzel${klasse ? " " + klasse : ""}">√<span class="dach">${inhaltHtml}</span></span>`;
}
// Ist der angezeigte Wert bei dieser Stellenzahl exakt, steht dort "=",
// sonst "≈". Ein Gleichheitszeichen vor einer gerundeten Zahl wäre gelogen.
function zeichen(x, stellen) {
  const gerundet = Number(x.toFixed(stellen));
  return Math.abs(gerundet - x) < 1e-12 ? "=" : "≈";
}
function istQuadrat(a) {
  if (a < 0) return false;
  const w = Math.round(Math.sqrt(a));
  return w * w === a;
}
// Zerlegt a in f² · rest mit dem größtmöglichen f.
function quadratfaktor(a) {
  let rest = a, f = 1;
  for (let k = 2; k * k <= rest; k++) {
    while (rest % (k * k) === 0) { rest /= k * k; f *= k; }
  }
  return { f, rest };
}
// Die Intervallschachtelung, stellenweise und ganzzahlig gerechnet — mit
// Kommazahlen würde sich der Rundungsfehler in die Schranken schleichen.
function schachtel(a, stellen) {
  // Der ganzzahlige Teil wird zuerst bestimmt — ziffernweise ginge er nur bis 9,
  // und schon √100 hätte zwei Stellen. Die beiden Schleifen bügeln aus, was der
  // Rundungsfehler von Math.sqrt danebenlegen könnte.
  let z = Math.floor(Math.sqrt(a));
  while ((z + 1) * (z + 1) <= a) z++;
  while (z > 0 && z * z > a) z--;
  const schritte = [{ stelle: 0, unten: z, oben: z + 1, zu: z, teiler: 1 }];
  for (let k = 1; k <= stellen; k++) {
    z *= 10;
    const skala = Math.pow(100, k);
    for (let d = 9; d >= 0; d--) {
      if ((z + d) * (z + d) <= a * skala) { z += d; break; }
    }
    const teiler = Math.pow(10, k);
    schritte.push({ stelle: k, unten: z / teiler, oben: (z + 1) / teiler, zu: z, teiler });
  }
  const letzte = schritte[schritte.length - 1];
  return { schritte, unten: letzte.unten, oben: letzte.oben, genau: letzte.unten * letzte.unten === a };
}

function schrittZeile(inhaltHtml, grundHtml, klasse = "", kommentar = "") {
  return `<div class="zeile ${klasse}">` +
    `<span class="gl">${inhaltHtml}</span>` +
    (grundHtml ? `<span class="grund">${grundHtml}</span>` : "") +
    (kommentar ? `<span class="kommentar">${kommentar}</span>` : "") +
    `</div>`;
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

// ================= 1. Was ist eine Quadratwurzel? =================

// Das Quadrat wird maßstäblich gezeichnet: Seine Seite ist √a Einheiten lang,
// und das Gitter dahinter zählt die Einheitsquadrate. So sieht man beides
// zugleich — die Fläche a und die Seitenlänge √a.
function bgBild(a) {
  const B = 460, H = 320;
  const svg = neueFlaeche(B, H);
  const maxE = 12;               // 12 × 12 Einheiten passen ins Bild
  const rand = 44, groesse = 232;
  const e = groesse / maxE;      // Bildpunkte je Einheit
  const links = rand, unten = H - 52;
  svg.appendChild(svgText(B / 2, 18, "Ein Quadrat mit dem Flächeninhalt a hat die Seitenlänge √a", { class: "wr-titel" }));

  for (let i = 0; i <= maxE; i++) {
    svg.appendChild(svgEl("line", { x1: (links + i * e).toFixed(2), y1: (unten - groesse).toFixed(2), x2: (links + i * e).toFixed(2), y2: unten.toFixed(2), class: "wr-gitter" }));
    svg.appendChild(svgEl("line", { x1: links.toFixed(2), y1: (unten - i * e).toFixed(2), x2: (links + groesse).toFixed(2), y2: (unten - i * e).toFixed(2), class: "wr-gitter" }));
    if (i > 0 && i % 2 === 0) {
      svg.appendChild(svgText(links + i * e, unten + 15, String(i), { class: "wr-achsentext" }));
      svg.appendChild(svgText(links - 7, unten - i * e + 4, String(i), { class: "wr-achsentext", "text-anchor": "end" }));
    }
  }
  const s = Math.sqrt(a);
  if (a > 0) {
    svg.appendChild(svgEl("rect", {
      x: links.toFixed(2), y: (unten - s * e).toFixed(2),
      width: (s * e).toFixed(2), height: (s * e).toFixed(2),
      class: "wr-flaeche" + (istQuadrat(a) ? " quadratzahl" : ""),
    }));
    // Die Seite wird eigens markiert — sie ist die gesuchte Größe.
    svg.appendChild(svgEl("line", { x1: links.toFixed(2), y1: (unten + 0).toFixed(2), x2: (links + s * e).toFixed(2), y2: unten.toFixed(2), class: "wr-kante" }));
    svg.appendChild(svgText(links + (s * e) / 2, unten + 30, `Seite ${zeichen(s, 3)} ${num(s, 3)}`, { class: "wr-text wert" }));
    svg.appendChild(svgText(links + (s * e) / 2, unten - (s * e) / 2 + 4, `a = ${num(a)}`, { class: "wr-text radikand" }));
  }
  svg.appendChild(svgEl("line", { x1: links.toFixed(2), y1: unten.toFixed(2), x2: (links + groesse + 10).toFixed(2), y2: unten.toFixed(2), class: "wr-achse" }));
  svg.appendChild(svgEl("line", { x1: links.toFixed(2), y1: unten.toFixed(2), x2: links.toFixed(2), y2: (unten - groesse - 10).toFixed(2), class: "wr-achse" }));

  // Rechts die Umkehrung als Wortbild
  const mx = 340;
  svg.appendChild(svgText(mx, 96, "quadrieren", { class: "wr-achsenname" }));
  svg.appendChild(svgEl("path", { d: `M ${mx - 52} 106 L ${mx + 52} 106`, class: "wr-achse" }));
  svg.appendChild(svgEl("path", { d: `M ${mx + 44} 101 L ${mx + 53} 106 L ${mx + 44} 111 Z`, fill: "currentColor", class: "wr-achsenname" }));
  svg.appendChild(svgText(mx - 62, 111, `${num(Math.sqrt(a), 3)}`, { class: "wr-text wert", "text-anchor": "end" }));
  svg.appendChild(svgText(mx + 62, 111, `${num(a)}`, { class: "wr-text radikand", "text-anchor": "start" }));
  svg.appendChild(svgText(mx, 140, "Wurzel ziehen", { class: "wr-achsenname" }));
  svg.appendChild(svgEl("path", { d: `M ${mx + 52} 126 L ${mx - 52} 126`, class: "wr-achse" }));
  svg.appendChild(svgEl("path", { d: `M ${mx - 44} 121 L ${mx - 53} 126 L ${mx - 44} 131 Z`, fill: "currentColor", class: "wr-achsenname" }));
  return svg;
}

function renderBegriff() {
  const a = Number(document.getElementById("bg-a").value);
  document.getElementById("bg-a-anzeige").textContent = num(a);
  const w = Math.sqrt(a);
  const quadrat = istQuadrat(a);

  document.getElementById("bg-gleichung").innerHTML =
    `${wurzel(`<span class="rad">${num(a)}</span>`)} ${zeichen(w, 3)} <span class="wert">${num(w, 3)}</span>`;

  const mount = document.getElementById("bg-mount");
  mount.innerHTML = "";
  mount.appendChild(bgBild(a));

  const karten = document.getElementById("bg-karten");
  karten.innerHTML = "";
  karten.appendChild(karte("rad", "Radikand a", num(a)));
  karten.appendChild(karte("erg", "√a", `${zeichen(w, 3) === "=" ? "" : "≈ "}${num(w, 3)}`));
  karten.appendChild(karte("qz", "Probe (√a)²", num(w * w)));
  karten.appendChild(karte("nae", "a ist Quadratzahl?", quadrat ? "ja" : "nein"));

  const naechste = Math.floor(w), darueber = naechste + 1;
  document.getElementById("bg-bilanz").innerHTML = quadrat
    ? `<span class="wq">${num(w)} · ${num(w)} = ${num(a)}</span>, also ist <span class="we">√${num(a)} = ${num(w)}</span> genau. ` +
      `Die Seite des Quadrats trifft eine Gitterlinie — sie ist eine ganze Zahl.`
    : `Zwischen den Quadratzahlen <span class="wq">${num(naechste * naechste)} = ${num(naechste)}²</span> und ` +
      `<span class="wq">${num(darueber * darueber)} = ${num(darueber)}²</span> liegt keine weitere Quadratzahl. ` +
      `Also ist <span class="we">${num(naechste)} &lt; √${num(a)} &lt; ${num(darueber)}</span>: Die Seite endet zwischen zwei Gitterlinien, ` +
      `und ihr Wert ${num(w, 3)}… hat kein Ende.`;

  const text = document.getElementById("bg-text");
  if (a === 0) {
    text.innerHTML = `<span class="wr-urteil ja">√0 = 0</span> Die einzige Zahl, deren Quadrat 0 ist, ist 0 selbst. Das Quadrat verschwindet.`;
  } else if (quadrat) {
    text.innerHTML = `<span class="wr-urteil ja">√${num(a)} = ${num(w)} — eine natürliche Zahl</span> ` +
      `Auch −${num(w)} hat das Quadrat ${num(a)}. Aber √${num(a)} bezeichnet nur die nichtnegative Zahl, also ${num(w)}.`;
  } else {
    text.innerHTML = `<span class="wr-urteil nein">√${num(a)} ist keine ganze Zahl</span> ` +
      `${num(a)} ist keine Quadratzahl. Die Wurzel liegt zwischen ${num(naechste)} und ${num(darueber)} — mehr dazu im nächsten Abschnitt.`;
  }
}

function initBegriff() {
  document.getElementById("bg-a").addEventListener("input", renderBegriff);
  renderBegriff();
}

// ================= 2. Wurzeln einschachteln =================

function esBild(a, stellen) {
  const B = 460, H = 190;
  const svg = neueFlaeche(B, H);
  const s = schachtel(a, stellen);
  const grob = s.schritte[0];
  const links = 44, breite = 372, y = 92;
  svg.appendChild(svgText(B / 2, 18, `√${num(a)} wird zwischen zwei Zahlen eingeschlossen`, { class: "wr-titel" }));

  // Der gezeigte Ausschnitt ist immer die grobe Schachtelung n … n+1.
  const von = grob.unten, bis = grob.oben;
  const px = (x) => links + ((x - von) / (bis - von)) * breite;
  svg.appendChild(svgEl("line", { x1: links, y1: y, x2: links + breite, y2: y, class: "wr-achse" }));
  for (let i = 0; i <= 10; i++) {
    const x = von + (i / 10) * (bis - von);
    svg.appendChild(svgEl("line", { x1: px(x).toFixed(2), y1: y - 6, x2: px(x).toFixed(2), y2: y + 6, class: "wr-gitter" }));
    if (i % 5 === 0) svgAchsenzahl(svg, px(x), y + 22, num(x, 1));
  }
  svgAchsenzahl(svg, px(von), y + 22, num(von));
  svgAchsenzahl(svg, px(bis), y + 22, num(bis));

  // Die aktuelle Schachtelung als Balken
  const b1 = px(s.unten), b2 = px(s.oben);
  svg.appendChild(svgEl("line", { x1: b1.toFixed(2), y1: y - 22, x2: Math.max(b2, b1 + 2).toFixed(2), y2: y - 22, class: "wr-spanne" }));
  svg.appendChild(svgText((b1 + Math.max(b2, b1 + 2)) / 2, y - 32, `${fest(s.unten, stellen)} … ${fest(s.oben, stellen)}`, { class: "wr-text naeherung" }));

  const w = Math.sqrt(a);
  svg.appendChild(svgEl("line", { x1: px(w).toFixed(2), y1: y - 44, x2: px(w).toFixed(2), y2: y + 10, class: "wr-marke" }));
  svg.appendChild(svgEl("circle", { cx: px(w).toFixed(2), cy: y, r: 5, class: "wr-punkt" }));
  svg.appendChild(svgText(px(w), y + 42, `√${num(a)} ${zeichen(w, 4)} ${num(w, 4)}`, { class: "wr-text wert" }));

  // Die beiden Quadratzahlen als Anker
  svg.appendChild(svgText(px(von), y - 14, `${num(von)}² = ${num(von * von)}`, { class: "wr-text quadrat" }));
  svg.appendChild(svgText(px(bis), y - 14, `${num(bis)}² = ${num(bis * bis)}`, { class: "wr-text quadrat" }));
  return svg;
}
function svgAchsenzahl(svg, x, y, t) {
  svg.appendChild(svgText(x, y, t, { class: "wr-achsentext" }));
}

function renderEinschachteln() {
  const a = Number(document.getElementById("es-a").value);
  const stellen = Number(document.getElementById("es-stellen").value);
  document.getElementById("es-a-anzeige").textContent = num(a);
  document.getElementById("es-stellen-anzeige").textContent =
    stellen === 0 ? "ganze Zahlen" : stellen === 1 ? "Zehntel" : stellen === 2 ? "Hundertstel" : "Tausendstel";

  const s = schachtel(a, stellen);
  const mount = document.getElementById("es-mount");
  mount.innerHTML = "";
  mount.appendChild(esBild(a, stellen));

  document.getElementById("es-schritte").innerHTML = s.schritte.map((sch) => {
    const u = sch.unten, o = sch.oben;
    const genau = u * u === a;
    return schrittZeile(
      `<span class="qz">${fest(u, sch.stelle)}²</span> = ${num(u * u, 6)} ${genau ? "=" : "&lt;"} <span class="rad">${num(a)}</span>` +
      (genau ? "" : ` &lt; ${num(o * o, 6)} = <span class="qz">${fest(o, sch.stelle)}²</span>`),
      sch.stelle === 0 ? "ganze Zahlen" : `${sch.stelle}. Stelle`,
      genau ? "fertig" : "",
      genau
        ? `Hier geht es auf: <strong>√${num(a)} = ${num(u)}</strong>.`
        : `Also <strong>${fest(u, sch.stelle)} &lt; √${num(a)} &lt; ${fest(o, sch.stelle)}</strong>. Die Schranken liegen ${sch.stelle === 0 ? "" : "nur noch "}${num(o - u, 6)} auseinander.`);
  }).join("");

  const w = Math.sqrt(a);
  const karten = document.getElementById("es-karten");
  karten.innerHTML = "";
  karten.appendChild(karte("rad", "Radikand", num(a)));
  karten.appendChild(karte("nae", "untere Schranke", fest(s.unten, stellen)));
  karten.appendChild(karte("nae", "obere Schranke", fest(s.oben, stellen)));
  karten.appendChild(karte("erg", "Breite des Intervalls", num(s.oben - s.unten, 6)));

  document.getElementById("es-bilanz").innerHTML = s.genau
    ? `<span class="wq">${num(a)} ist eine Quadratzahl</span> — das Verfahren endet nach dem ersten Schritt mit ` +
      `<span class="we">√${num(a)} = ${num(s.unten)}</span>. Jede weitere Stelle wäre eine Null.`
    : `<span class="wr">√${num(a)}</span> liegt zwischen <span class="wn">${fest(s.unten, stellen)}</span> und ` +
      `<span class="wn">${fest(s.oben, stellen)}</span>. Mit jeder Stelle wird das Intervall zehnmal so schmal — ` +
      `aber es wird <em>nie</em> zu einem Punkt. Genau deshalb hat √${num(a)} unendlich viele Nachkommastellen. ` +
      `Die Probe: ${fest(s.unten, stellen)}² = ${num(s.unten * s.unten, 6)}, und das ist noch nicht ${num(a)}.`;
}

function initEinschachteln() {
  ["es-a", "es-stellen"].forEach((id) => document.getElementById(id).addEventListener("input", renderEinschachteln));
  renderEinschachteln();
}

// ================= 3. Irrationale Zahlen =================

const IR_FAELLE = [2, 3, 4, 9, 10, 16];
let irWahl = 2;

function irBild(a) {
  const B = 420, H = 250;
  const svg = neueFlaeche(B, H);
  const maxE = 5, rand = 46, groesse = 150;
  const e = groesse / maxE;
  const links = rand, unten = H - 46;
  svg.appendChild(svgText(B / 2, 18, `Ein Quadrat mit dem Flächeninhalt ${num(a)}`, { class: "wr-titel" }));
  for (let i = 0; i <= maxE; i++) {
    svg.appendChild(svgEl("line", { x1: (links + i * e).toFixed(2), y1: (unten - groesse).toFixed(2), x2: (links + i * e).toFixed(2), y2: unten.toFixed(2), class: "wr-gitter" }));
    svg.appendChild(svgEl("line", { x1: links.toFixed(2), y1: (unten - i * e).toFixed(2), x2: (links + groesse).toFixed(2), y2: (unten - i * e).toFixed(2), class: "wr-gitter" }));
    if (i > 0) {
      svg.appendChild(svgText(links + i * e, unten + 15, String(i), { class: "wr-achsentext" }));
      svg.appendChild(svgText(links - 7, unten - i * e + 4, String(i), { class: "wr-achsentext", "text-anchor": "end" }));
    }
  }
  const s = Math.sqrt(a);
  svg.appendChild(svgEl("rect", {
    x: links.toFixed(2), y: (unten - s * e).toFixed(2), width: (s * e).toFixed(2), height: (s * e).toFixed(2),
    class: "wr-flaeche" + (istQuadrat(a) ? " quadratzahl" : ""),
  }));
  svg.appendChild(svgEl("line", { x1: links.toFixed(2), y1: unten.toFixed(2), x2: (links + s * e).toFixed(2), y2: unten.toFixed(2), class: "wr-kante" }));
  svg.appendChild(svgEl("line", { x1: links.toFixed(2), y1: unten.toFixed(2), x2: (links + groesse + 10).toFixed(2), y2: unten.toFixed(2), class: "wr-achse" }));
  svg.appendChild(svgEl("line", { x1: links.toFixed(2), y1: unten.toFixed(2), x2: links.toFixed(2), y2: (unten - groesse - 10).toFixed(2), class: "wr-achse" }));
  svg.appendChild(svgText(links + (s * e) / 2, unten + 32, `√${num(a)} ${zeichen(s, 6)} ${num(s, 6)}`, { class: "wr-text wert" }));
  if (istQuadrat(a)) {
    svg.appendChild(svgText(links + groesse / 2, 40, "Die Seite trifft eine Gitterlinie", { class: "wr-achsenname" }));
  } else {
    svg.appendChild(svgEl("line", { x1: (links + s * e).toFixed(2), y1: (unten + 8).toFixed(2), x2: (links + s * e).toFixed(2), y2: (unten - s * e).toFixed(2), class: "wr-marke" }));
    svg.appendChild(svgText(links + groesse / 2, 40, "Die Seite endet zwischen zwei Gitterlinien", { class: "wr-achsenname" }));
  }
  return svg;
}

function renderIrrational() {
  const a = irWahl;
  const schalter = document.getElementById("ir-schalter");
  schalter.innerHTML = "";
  IR_FAELLE.forEach((wert) => {
    const b = el("button", { type: "button", class: wert === a ? "aktiv" : "" }, `√${num(wert)}`);
    b.addEventListener("click", () => { irWahl = wert; renderIrrational(); });
    schalter.appendChild(b);
  });

  const mount = document.getElementById("ir-mount");
  mount.innerHTML = "";
  mount.appendChild(irBild(a));

  const w = Math.sqrt(a);
  const quadrat = istQuadrat(a);
  // Die Ziffern kommen aus der Rechnung, nicht aus einer Tabelle: So viele
  // Stellen, wie das Zahlformat des Browsers sicher hergibt.
  const ziffern = w.toFixed(12).replace(".", ",");
  document.getElementById("ir-bilanz").innerHTML = quadrat
    ? `<span class="wq">√${num(a)} = ${num(w)}</span> — die Dezimaldarstellung bricht sofort ab. ` +
      `Als Bruch: ${num(w)} = ${num(w)} : 1. Damit ist die Zahl <strong>rational</strong>, sogar natürlich.`
    : `<span class="wr">√${num(a)}</span> ≈ ${ziffern}… — und es geht ohne Ende und ohne Periode weiter. ` +
      `Es gibt <em>keine</em> ganzen Zahlen p und q mit √${num(a)} = p : q. ` +
      `Damit ist die Zahl <strong>irrational</strong>.`;

  document.getElementById("ir-text").innerHTML = quadrat
    ? `<span class="wr-urteil ja">rational</span> ${num(a)} ist eine Quadratzahl, also ist √${num(a)} eine ganze Zahl.`
    : `<span class="wr-urteil nein">irrational</span> ${num(a)} ist keine Quadratzahl, also lässt sich √${num(a)} nicht als Bruch schreiben.`;

  // Die Zahlbereiche, ineinander geschachtelt — der aktuelle Wert wird
  // in den kleinsten Bereich einsortiert, der ihn enthält.
  const stufen = [
    { klasse: "r", name: "ℝ — reelle Zahlen", bsp: "alle Zahlen des Zahlenstrahls, auch √2 und π", passt: true },
    { klasse: "q", name: "ℚ — rationale Zahlen", bsp: "alle Brüche, z. B. 3 : 4 = 0,75 und 1 : 3 = 0,3̅", passt: quadrat },
    { klasse: "z", name: "ℤ — ganze Zahlen", bsp: "…, −2, −1, 0, 1, 2, …", passt: quadrat },
    { klasse: "n", name: "ℕ — natürliche Zahlen", bsp: "0, 1, 2, 3, …", passt: quadrat },
  ];
  let innen = `<div class="wr-bereich ${stufen[3].klasse}"><span class="name">${stufen[3].name}</span><br>` +
    `<span class="bsp">${stufen[3].bsp}</span>${stufen[3].passt ? `<br><strong>√${num(a)} = ${num(w)} liegt hier.</strong>` : ""}</div>`;
  for (let i = 2; i >= 0; i--) {
    const marke = stufen[i].passt && !stufen[i + 1].passt ? `<br><strong>√${num(a)} liegt hier — aber in keinem engeren Bereich.</strong>` : "";
    innen = `<div class="wr-bereich ${stufen[i].klasse}"><span class="name">${stufen[i].name}</span><br>` +
      `<span class="bsp">${stufen[i].bsp}</span>${marke}<div style="margin-top:0.45rem">${innen}</div></div>`;
  }
  document.getElementById("ir-bereiche").innerHTML = innen;
}

function initIrrational() {
  renderIrrational();
}

// ================= 4. Rechnen mit Wurzeln =================

function rgBild(a, b) {
  const B = 440, H = 200;
  const svg = neueFlaeche(B, H);
  const links = 150, unten = H - 44, hoehe = 118;
  const werte = [
    { name: "√(a + b)", wert: Math.sqrt(a + b), klasse: "quadrat", flaeche: " quadratzahl" },
    { name: "√a + √b", wert: Math.sqrt(a) + Math.sqrt(b), klasse: "faktor", flaeche: " rest" },
  ];
  const max = Math.max(...werte.map((w) => w.wert)) || 1;
  svg.appendChild(svgText(B / 2, 18, "Die Summe unter der Wurzel ist etwas anderes", { class: "wr-titel" }));
  werte.forEach((w, i) => {
    const x = links + i * 130;
    const h = (w.wert / max) * hoehe;
    svg.appendChild(svgEl("rect", {
      x: x.toFixed(2), y: (unten - h).toFixed(2), width: 74, height: h.toFixed(2),
      class: "wr-flaeche" + w.flaeche,
    }));
    svg.appendChild(svgText(x + 37, unten - h - 8, num(w.wert, 3), { class: "wr-text " + w.klasse }));
    svg.appendChild(svgText(x + 37, unten + 17, w.name, { class: "wr-achsenname" }));
  });
  svg.appendChild(svgEl("line", { x1: 130, y1: unten, x2: B - 20, y2: unten, class: "wr-achse" }));
  const gleich = Math.abs(Math.sqrt(a + b) - (Math.sqrt(a) + Math.sqrt(b))) < 1e-12;
  svg.appendChild(svgText(72, unten - hoehe / 2 - 8, gleich ? "hier zufällig" : "verschieden", { class: "wr-text " + (gleich ? "quadrat" : "wert") }));
  svg.appendChild(svgText(72, unten - hoehe / 2 + 8, gleich ? "gleich" : "hoch!", { class: "wr-text " + (gleich ? "quadrat" : "wert") }));
  svg.appendChild(svgText(72, unten - hoehe / 2 + 26, gleich ? "" : "grün = richtig", { class: "wr-achsenname" }));
  return svg;
}

function renderRegeln() {
  const a = Number(document.getElementById("rg-a").value);
  const b = Number(document.getElementById("rg-b").value);
  document.getElementById("rg-a-anzeige").textContent = num(a);
  document.getElementById("rg-b-anzeige").textContent = num(b);

  const zeilen = [
    { links: `√(a · b) = √${num(a * b)}`, lw: Math.sqrt(a * b), rechts: `√a · √b`, rw: Math.sqrt(a) * Math.sqrt(b) },
    { links: `√(a : b) = √${num(a / b, 4)}`, lw: Math.sqrt(a / b), rechts: `√a : √b`, rw: Math.sqrt(a) / Math.sqrt(b) },
    { links: `√(a + b) = √${num(a + b)}`, lw: Math.sqrt(a + b), rechts: `√a + √b`, rw: Math.sqrt(a) + Math.sqrt(b) },
  ];
  document.getElementById("rg-tabelle").innerHTML =
    `<caption>a = ${num(a)}, b = ${num(b)} — beide Seiten werden ausgerechnet und verglichen</caption>` +
    `<tr><th>linke Seite</th><th>Wert</th><th>rechte Seite</th><th>Wert</th><th>gleich?</th></tr>` +
    zeilen.map((z) => {
      const gleich = Math.abs(z.lw - z.rw) < 1e-9;
      return `<tr><td>${z.links}</td><td>${num(z.lw, 4)}</td><td>${z.rechts}</td><td>${num(z.rw, 4)}</td>` +
        `<td class="${gleich ? "gleich" : "ungleich"}">${gleich ? "ja ✓" : "nein ✗"}</td></tr>`;
    }).join("");

  const mount = document.getElementById("rg-mount");
  mount.innerHTML = "";
  mount.appendChild(rgBild(a, b));

  const summeGleich = Math.abs(Math.sqrt(a + b) - (Math.sqrt(a) + Math.sqrt(b))) < 1e-9;
  document.getElementById("rg-bilanz").innerHTML =
    `<strong>Produkt:</strong> <span class="wq">√(${num(a)} · ${num(b)}) = √${num(a * b)} ${zeichen(Math.sqrt(a * b), 4)} ${num(Math.sqrt(a * b), 4)}</span> ` +
    `und <span class="wq">√${num(a)} · √${num(b)} ${zeichen(Math.sqrt(a) * Math.sqrt(b), 4)} ${num(Math.sqrt(a) * Math.sqrt(b), 4)}</span> — immer gleich.<br>` +
    `<strong>Summe:</strong> <span class="we">√(${num(a)} + ${num(b)}) ${zeichen(Math.sqrt(a + b), 4)} ${num(Math.sqrt(a + b), 4)}</span>, ` +
    `aber <span class="wf">√${num(a)} + √${num(b)} ${zeichen(Math.sqrt(a) + Math.sqrt(b), 4)} ${num(Math.sqrt(a) + Math.sqrt(b), 4)}</span>. ` +
    `Die Differenz beträgt ${num(Math.sqrt(a) + Math.sqrt(b) - Math.sqrt(a + b), 4)}.`;

  document.getElementById("rg-text").innerHTML = summeGleich
    ? `<span class="wr-urteil ja">Hier sind beide Seiten gleich</span> Das liegt daran, dass einer der beiden Werte 0 ist — der einzige Fall, in dem √(a + b) = √a + √b zutrifft. Er beweist die Regel nicht.`
    : `<span class="wr-urteil nein">√(a + b) ≠ √a + √b</span> Ein einziges Gegenbeispiel widerlegt eine behauptete Regel für immer. Hier ist √a + √b um ${num(Math.sqrt(a) + Math.sqrt(b) - Math.sqrt(a + b), 4)} zu groß.`;
}

function initRegeln() {
  ["rg-a", "rg-b"].forEach((id) => document.getElementById(id).addEventListener("input", renderRegeln));
  renderRegeln();
}

// ================= 5. Teilweise wurzelziehen =================

function twBild(a) {
  const { f, rest } = quadratfaktor(a);
  const B = 460, H = 150;
  const svg = neueFlaeche(B, H);
  const links = 40, breite = 384, y = 74;
  const w = Math.sqrt(a);
  const max = Math.max(w, 1) * 1.12;
  const px = (x) => links + (x / max) * breite;
  svg.appendChild(svgText(B / 2, 18, `√${num(a)} als ${f === 1 ? "eine" : num(f)} Strecke${f === 1 ? "" : "n"} der Länge √${num(rest)}`, { class: "wr-titel" }));
  svg.appendChild(svgEl("line", { x1: links, y1: y + 26, x2: links + breite, y2: y + 26, class: "wr-achse" }));
  for (let i = 0; i <= Math.floor(max); i++) {
    svg.appendChild(svgEl("line", { x1: px(i).toFixed(2), y1: y + 21, x2: px(i).toFixed(2), y2: y + 31, class: "wr-gitter" }));
    if (i % 2 === 0) svg.appendChild(svgText(px(i), y + 45, String(i), { class: "wr-achsentext" }));
  }
  // f Abschnitte der Länge √rest, aneinandergelegt
  const s = Math.sqrt(rest);
  for (let k = 0; k < f; k++) {
    svg.appendChild(svgEl("line", {
      x1: px(k * s).toFixed(2), y1: y, x2: px((k + 1) * s).toFixed(2), y2: y,
      class: k % 2 === 0 ? "wr-kante" : "wr-diagonale", "stroke-opacity": k % 2 === 0 ? "1" : "0.55",
    }));
    svg.appendChild(svgEl("line", { x1: px((k + 1) * s).toFixed(2), y1: y - 7, x2: px((k + 1) * s).toFixed(2), y2: y + 7, class: "wr-mass" }));
  }
  svg.appendChild(svgEl("line", { x1: px(0).toFixed(2), y1: y - 7, x2: px(0).toFixed(2), y2: y + 7, class: "wr-mass" }));
  if (f > 1) svg.appendChild(svgText(px(s / 2), y - 12, `√${num(rest)}`, { class: "wr-text faktor" }));
  svg.appendChild(svgText(px(w) + (px(w) > B - 70 ? -46 : 6), y - 12, `√${num(a)} ≈ ${num(w, 3)}`, { class: "wr-text wert", "text-anchor": "start" }));
  svg.appendChild(svgText(B / 2, H - 6,
    f === 1 ? `In ${num(a)} steckt keine Quadratzahl — hier lässt sich nichts herausziehen.`
      : `${num(f)} · √${num(rest)} = √${num(a)}`, { class: "wr-achsenname" }));
  return svg;
}

function renderTeilweise() {
  const a = Number(document.getElementById("tw-a").value);
  document.getElementById("tw-a-anzeige").textContent = num(a);
  const { f, rest } = quadratfaktor(a);
  const w = Math.sqrt(a);

  document.getElementById("tw-gleichung").innerHTML = f === 1
    ? `${wurzel(`<span class="rad">${num(a)}</span>`)} — nicht weiter zerlegbar`
    : `${wurzel(`<span class="rad">${num(a)}</span>`)} = <span class="fak">${num(f)}</span>${wurzel(`<span class="qz">${num(rest)}</span>`)}`;

  const mount = document.getElementById("tw-mount");
  mount.innerHTML = "";
  mount.appendChild(twBild(a));

  const schritte = [];
  if (f === 1) {
    schritte.push(schrittZeile(
      `${wurzel(`<span class="rad">${num(a)}</span>`)}`, "keine Zerlegung", "",
      `In ${num(a)} steckt keine Quadratzahl größer als 1 als Faktor. Solche Radikanden heißen <strong>quadratfrei</strong>.`));
  } else {
    schritte.push(schrittZeile(
      `${num(a)} = <span class="qz">${num(f * f)}</span> · <span class="rad">${num(rest)}</span>`,
      "größte Quadratzahl abspalten", "",
      `${num(f * f)} = ${num(f)}² ist die größte Quadratzahl, die in ${num(a)} als Faktor steckt.`));
    schritte.push(schrittZeile(
      `${wurzel(`${num(a)}`)} = ${wurzel(`<span class="qz">${num(f * f)}</span> · <span class="rad">${num(rest)}</span>`)} = ` +
      `${wurzel(`<span class="qz">${num(f * f)}</span>`)} · ${wurzel(`<span class="rad">${num(rest)}</span>`)}`,
      "Produktregel", "",
      "Erlaubt ist das wegen √(a · b) = √a · √b aus Abschnitt 4."));
    schritte.push(schrittZeile(
      `= <span class="fak">${num(f)}</span> · ${wurzel(`<span class="rad">${num(rest)}</span>`)}`,
      "Wurzel aus der Quadratzahl", "fertig",
      rest === 1 ? `Hier bleibt unter der Wurzel nur die 1 übrig: √${num(a)} = ${num(f)}.` : ""));
    schritte.push(schrittZeile(
      `Probe: <span class="fak">${num(f)}</span>² · <span class="rad">${num(rest)}</span> = ${num(f * f)} · ${num(rest)} = ${num(a)}`,
      "rückwärts", "fertig",
      "Rückwärts geht es genauso: Der Faktor vor der Wurzel wird quadriert und wieder hineingezogen."));
  }
  document.getElementById("tw-schritte").innerHTML = schritte.join("");

  const karten = document.getElementById("tw-karten");
  karten.innerHTML = "";
  karten.appendChild(karte("rad", "Radikand", num(a)));
  karten.appendChild(karte("qz", "Quadratzahl darin", num(f * f)));
  karten.appendChild(karte("fak", "Faktor davor", num(f)));
  karten.appendChild(karte("erg", "Wert", `${zeichen(w, 3) === "=" ? "" : "≈ "}${num(w, 3)}`));

  document.getElementById("tw-bilanz").innerHTML = f === 1
    ? `<span class="wr">√${num(a)}</span> ist schon in der einfachsten Form. Ein Radikand ohne quadratischen Teiler heißt <strong>quadratfrei</strong>.`
    : rest === 1
      ? `<span class="wr">√${num(a)}</span> = <span class="we">${num(f)}</span> — ${num(a)} ist selbst eine Quadratzahl, und unter der Wurzel bleibt nichts übrig.`
      : `<span class="wr">√${num(a)}</span> = <span class="wf">${num(f)}</span>·<span class="wq">√${num(rest)}</span>. ` +
        `Beide Schreibweisen bezeichnen dieselbe Zahl ${num(w, 4)}…, aber die rechte zeigt sofort, ` +
        `dass sich ${num(f)}·√${num(rest)} mit anderen Vielfachen von √${num(rest)} zusammenfassen lässt — ` +
        `etwa ${num(f)}√${num(rest)} + √${num(rest)} = ${num(f + 1)}√${num(rest)}.`;
}

function initTeilweise() {
  document.getElementById("tw-a").addEventListener("input", renderTeilweise);
  renderTeilweise();
}

// ================= 6. Längen mit Wurzeln =================

function lnBild(a, b) {
  const B = 440, H = 260;
  const svg = neueFlaeche(B, H);
  const maxE = Math.max(a, b) + 1;
  const rand = 44;
  const e = 186 / maxE;
  const links = rand, unten = H - 46;
  svg.appendChild(svgText(B / 2, 18, "Die Diagonale eines Rechtecks", { class: "wr-titel" }));
  const beschriftungsschritt = maxE > 9 ? 2 : 1;
  for (let i = 0; i <= maxE; i++) {
    svg.appendChild(svgEl("line", { x1: (links + i * e).toFixed(2), y1: (unten - maxE * e).toFixed(2), x2: (links + i * e).toFixed(2), y2: unten.toFixed(2), class: "wr-gitter" }));
    svg.appendChild(svgEl("line", { x1: links.toFixed(2), y1: (unten - i * e).toFixed(2), x2: (links + maxE * e).toFixed(2), y2: (unten - i * e).toFixed(2), class: "wr-gitter" }));
    if (i > 0 && i % beschriftungsschritt === 0) {
      svg.appendChild(svgText(links + i * e, unten + 15, String(i), { class: "wr-achsentext" }));
      svg.appendChild(svgText(links - 8, unten - i * e + 4, String(i), { class: "wr-achsentext", "text-anchor": "end" }));
    }
  }
  svg.appendChild(svgEl("rect", { x: links.toFixed(2), y: (unten - b * e).toFixed(2), width: (a * e).toFixed(2), height: (b * e).toFixed(2), class: "wr-flaeche" }));
  svg.appendChild(svgEl("line", { x1: links.toFixed(2), y1: unten.toFixed(2), x2: (links + a * e).toFixed(2), y2: (unten - b * e).toFixed(2), class: "wr-diagonale" }));
  svg.appendChild(svgText(links + (a * e) / 2, unten + 32, `a = ${num(a)}`, { class: "wr-text radikand" }));
  svg.appendChild(svgText(links + a * e + 10, unten - (b * e) / 2 + 4, `b = ${num(b)}`, { class: "wr-text quadrat", "text-anchor": "start" }));
  const d = Math.sqrt(a * a + b * b);
  svg.appendChild(svgText(links + (a * e) / 2 + 14, unten - (b * e) / 2 - 6, `d ${zeichen(d, 3)} ${num(d, 3)}`, { class: "wr-text wert", "text-anchor": "start" }));
  svg.appendChild(svgEl("line", { x1: links.toFixed(2), y1: unten.toFixed(2), x2: (links + maxE * e + 8).toFixed(2), y2: unten.toFixed(2), class: "wr-achse" }));
  svg.appendChild(svgEl("line", { x1: links.toFixed(2), y1: unten.toFixed(2), x2: links.toFixed(2), y2: (unten - maxE * e - 8).toFixed(2), class: "wr-achse" }));
  return svg;
}

function renderLaengen() {
  const a = Number(document.getElementById("ln-a").value);
  const b = Number(document.getElementById("ln-b").value);
  document.getElementById("ln-a-anzeige").textContent = num(a);
  document.getElementById("ln-b-anzeige").textContent = num(b);
  const q = a * a + b * b, d = Math.sqrt(q);
  const { f, rest } = quadratfaktor(q);

  const mount = document.getElementById("ln-mount");
  mount.innerHTML = "";
  mount.appendChild(lnBild(a, b));

  const teilweise = f > 1 && rest > 1
    ? schrittZeile(`d = ${wurzel(`${num(q)}`)} = <span class="fak">${num(f)}</span>${wurzel(`<span class="qz">${num(rest)}</span>`)}`,
      "teilweise wurzelziehen", "", "Diese Form ist exakt — anders als jede Dezimalzahl, die man hinschreiben könnte.")
    : "";
  document.getElementById("ln-schritte").innerHTML =
    schrittZeile(`d² = a² + b² = ${num(a)}² + ${num(b)}² = ${num(a * a)} + ${num(b * b)} = <span class="rad">${num(q)}</span>`, "Satz des Pythagoras") +
    schrittZeile(`d = ${wurzel(`<span class="rad">${num(q)}</span>`)} <span class="wert">${zeichen(d, 3)} ${num(d, 3)}</span>`,
      "Wurzel ziehen", istQuadrat(q) ? "fertig" : "",
      istQuadrat(q) ? `${num(q)} ist eine Quadratzahl — die Diagonale ist die ganze Zahl ${num(d)}.` : "") +
    teilweise +
    schrittZeile(`Zum Vergleich: a + b = ${num(a + b)}`, "der Weg um die Ecke", "",
      `Die Diagonale ist mit ${num(d, 3)} kürzer als der Weg über zwei Seiten (${num(a + b)}) und länger als jede einzelne Seite. ` +
      `Wer √(a² + b²) mit a + b verwechselt, rechnet um die Ecke statt quer hindurch.`);

  const karten = document.getElementById("ln-karten");
  karten.innerHTML = "";
  karten.appendChild(karte("rad", "a² + b²", num(q)));
  karten.appendChild(karte("erg", "Diagonale d", `${zeichen(d, 3) === "=" ? "" : "≈ "}${num(d, 3)}`));
  karten.appendChild(karte("fak", "exakt", f > 1 && rest > 1 ? `${num(f)}√${num(rest)}` : (istQuadrat(q) ? num(d) : `√${num(q)}`)));
  karten.appendChild(karte("qz", "Umweg a + b", num(a + b)));

  document.getElementById("ln-bilanz").innerHTML =
    `<strong>Probe:</strong> <span class="we">${num(d, 6)}</span>² ${zeichen(d * d, 6)} ${num(d * d, 6)} = <span class="wr">${num(q)}</span>. ` +
    (istQuadrat(q)
      ? `Hier geht die Wurzel auf: Die Seiten ${num(a)}, ${num(b)} und ${num(d)} bilden ein <strong>pythagoreisches Tripel</strong>.`
      : `Hier geht die Wurzel nicht auf. Der exakte Wert ist ${f > 1 && rest > 1 ? `<span class="wf">${num(f)}√${num(rest)}</span>` : `<span class="wf">√${num(q)}</span>`}; ` +
        `jede Dezimalzahl davon ist nur eine Näherung — deshalb steht dort ein ≈ und kein =.`);

  document.getElementById("ln-text").innerHTML = istQuadrat(q)
    ? `<span class="wr-urteil ja">ganzzahlige Diagonale</span> ${num(a)}² + ${num(b)}² = ${num(q)} = ${num(d)}².`
    : `<span class="wr-urteil nein">keine ganzzahlige Diagonale</span> ${num(q)} liegt zwischen ${num(Math.floor(d))}² = ${num(Math.floor(d) ** 2)} und ${num(Math.floor(d) + 1)}² = ${num((Math.floor(d) + 1) ** 2)}.`;
}

function initLaengen() {
  ["ln-a", "ln-b"].forEach((id) => document.getElementById(id).addEventListener("input", renderLaengen));
  renderLaengen();
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

// Mischt eine kurze Liste, ohne sie zu verwerfen und neu zu ziehen.
function mische(liste) {
  const a = liste.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Aufgabe 1 — die Wurzel aus einer Quadratzahl.
const A1_KANDIDATEN = (() => {
  const liste = [];
  for (let n = 2; n <= 25; n++) liste.push({ n, a: n * n });
  return liste;
})();

function generateAufgabe1() {
  const k = ohneKollision(A1_KANDIDATEN, (v) => [v.n, v.a, v.a / 2, 2 * v.n], A1_KANDIDATEN[0]);
  const { n, a } = k;
  return {
    promptHtml: `Berechne <strong>√${num(a)}</strong>.`,
    correct: n,
    tolerance: 0.001,
    placeholder: "√" + num(a) + " = ?",
    hinweis: (raw, val) => {
      if (Math.abs(val - a) < 0.001) return `Das ist der Radikand selbst. Gesucht ist die Zahl, deren <em>Quadrat</em> ${num(a)} ergibt.`;
      if (Math.abs(val - a / 2) < 0.001) return `Die Wurzel ist nicht die Hälfte. Probiere: ${num(a / 2)} · ${num(a / 2)} = ${num((a / 2) * (a / 2))}, und das ist nicht ${num(a)}.`;
      if (Math.abs(val + n) < 0.001) return `Zwar ist (−${num(n)})² = ${num(a)}, aber das Wurzelzeichen bezeichnet immer die <em>nichtnegative</em> Zahl. Also √${num(a)} = ${num(n)}.`;
      if (!isNaN(val) && Math.abs(val * val - a) > 0.001) return `Prüfe mit der Probe: Deine Zahl mal sich selbst muss ${num(a)} ergeben. ${num(val)} · ${num(val)} = ${num(val * val, 3)}.`;
      return `Suche die Zahl, die mit sich selbst multipliziert ${num(a)} ergibt.`;
    },
    tipps: [
      "Die Wurzel fragt rückwärts: Welche Zahl ergibt, mit sich selbst multipliziert, den Radikanden?",
      `Probiere der Reihe nach: ${num(n - 2)}² = ${num((n - 2) * (n - 2))}, ${num(n - 1)}² = ${num((n - 1) * (n - 1))} — beide noch zu klein.`,
      "Die Wurzel ist nie negativ: Auch wenn zwei Zahlen dasselbe Quadrat haben, meint das Wurzelzeichen immer die nichtnegative.",
    ],
    musterloesungHtml:
      `<strong>Gesucht:</strong> die nichtnegative Zahl x mit x² = ${num(a)}.<br>` +
      `<strong>Probieren:</strong> ${num(n - 1)}² = ${num((n - 1) * (n - 1))}, ${num(n)}² = <strong>${num(a)}</strong> ✓<br>` +
      `Also <strong>√${num(a)} = ${num(n)}</strong>.<br>` +
      `<em>Hinweis:</em> Auch (−${num(n)})² = ${num(a)}, aber √${num(a)} ist definitionsgemäß nicht negativ.`,
  };
}

// Aufgabe 2 — Produkt- und Quotientenregel. Beide Wurzeln sind für sich
// irrational; erst zusammengezogen wird das Ergebnis eine ganze Zahl. Genau
// das ist der Grund, warum die Regel nützlich ist.
const A2_KANDIDATEN = (() => {
  const liste = [];
  for (let a = 2; a <= 150; a++) {
    if (istQuadrat(a)) continue;
    for (let b = 2; b <= 150; b++) {
      if (istQuadrat(b) || a === b) continue;
      if (istQuadrat(a * b) && a * b <= 1600) {
        liste.push({ art: "mal", a, b, radikand: a * b, wert: Math.round(Math.sqrt(a * b)) });
      }
      if (a > b && a % b === 0 && istQuadrat(a / b) && a / b >= 4) {
        liste.push({ art: "geteilt", a, b, radikand: a / b, wert: Math.round(Math.sqrt(a / b)) });
      }
    }
  }
  return liste;
})();

function generateAufgabe2() {
  const k = ohneFeldKollision(A2_KANDIDATEN, (v) => [
    // Feld 1: der Radikand — und die Zahlen, auf die die Hinweise warten.
    [v.radikand, v.art === "mal" ? v.a + v.b : v.a - v.b, v.a, v.b],
    // Feld 2: das Ergebnis.
    [v.wert, v.radikand, v.a, v.b],
  ]);
  const { art, a, b, radikand, wert } = k;
  const zeichenText = art === "mal" ? "·" : ":";
  const regel = art === "mal" ? "Produktregel" : "Quotientenregel";
  const falschZusammen = art === "mal" ? a + b : a - b;
  return {
    promptHtml: `Berechne mit der ${regel}: <strong>√${num(a)} ${zeichenText} √${num(b)}</strong>.`,
    felder: [
      {
        name: "Radikand unter der gemeinsamen Wurzel", soll: radikand, toleranz: 0.0005, platzhalter: "Zahl unter der Wurzel",
        hinweis: (roh, val) => {
          if (Math.abs(val - falschZusammen) < 0.0005) {
            return art === "mal"
              ? `Die Radikanden werden <strong>multipliziert</strong>, nicht addiert: √a · √b = √(a · b). Mit ${num(a)} + ${num(b)} kommt man auf ${num(a + b)} — und √(a + b) ist etwas ganz anderes.`
              : `Die Radikanden werden <strong>geteilt</strong>, nicht subtrahiert: √a : √b = √(a : b).`;
          }
          if (Math.abs(val - a) < 0.0005) return `${num(a)} ist der erste Radikand. Beide gehören unter eine gemeinsame Wurzel.`;
          if (Math.abs(val - b) < 0.0005) return `${num(b)} ist der zweite Radikand. Beide gehören unter eine gemeinsame Wurzel.`;
          return `Die Regel lautet √a ${zeichenText} √b = √(a ${zeichenText} b). Rechne also ${num(a)} ${zeichenText} ${num(b)}.`;
        },
      },
      {
        name: "Ergebnis", soll: wert, toleranz: 0.0005, platzhalter: "Ergebnis",
        hinweis: (roh, val) => {
          if (Math.abs(val - radikand) < 0.0005) return `${num(radikand)} steht unter der Wurzel. Aus ihr muss noch die Wurzel gezogen werden: √${num(radikand)} = ${num(wert)}.`;
          if (Math.abs(val - a) < 0.0005 || Math.abs(val - b) < 0.0005) return "Das ist einer der beiden Radikanden, nicht das Ergebnis.";
          if (!isNaN(val) && Math.abs(val * val - radikand) > 0.0005) return `Probe: Deine Zahl mal sich selbst muss ${num(radikand)} ergeben. ${num(val)} · ${num(val)} = ${num(val * val, 3)}.`;
          return `Zieh die Wurzel aus ${num(radikand)}.`;
        },
      },
    ],
    tipps: [
      art === "mal"
        ? "Ein Produkt von Wurzeln darf man unter <em>eine</em> Wurzel schreiben: √a · √b = √(a · b)."
        : "Ein Quotient von Wurzeln darf man unter <em>eine</em> Wurzel schreiben: √a : √b = √(a : b).",
      `Hier heißt das: √${num(a)} ${zeichenText} √${num(b)} = √(${num(a)} ${zeichenText} ${num(b)}).`,
      `Rechne ${num(a)} ${zeichenText} ${num(b)} = ${num(radikand)} aus und zieh daraus die Wurzel — ${num(radikand)} ist eine Quadratzahl.`,
    ],
    musterloesungHtml:
      `<strong>1. Regel anwenden:</strong> √${num(a)} ${zeichenText} √${num(b)} = √(${num(a)} ${zeichenText} ${num(b)})<br>` +
      `<strong>2. Radikand ausrechnen:</strong> ${num(a)} ${zeichenText} ${num(b)} = <strong>${num(radikand)}</strong><br>` +
      `<strong>3. Wurzel ziehen:</strong> √${num(radikand)} = <strong>${num(wert)}</strong>, denn ${num(wert)}² = ${num(radikand)}<br>` +
      `<em>Zur Kontrolle:</em> √${num(a)} ≈ ${fest(Math.sqrt(a), 3)} und √${num(b)} ≈ ${fest(Math.sqrt(b), 3)}; ` +
      `${fest(Math.sqrt(a), 3)} ${zeichenText} ${fest(Math.sqrt(b), 3)} ≈ ${fest(art === "mal" ? Math.sqrt(a) * Math.sqrt(b) : Math.sqrt(a) / Math.sqrt(b), 3)} ✓<br>` +
      `<span class="progress-note">Beide Wurzeln sind einzeln irrational — ${art === "mal" ? "ihr Produkt" : "ihr Quotient"} ist es nicht. ` +
      `Das geht nur, weil ${num(a)} ${zeichenText} ${num(b)} eine Quadratzahl ist. ` +
      `Für Summen und Differenzen gibt es keine solche Regel: ` +
      `√${num(a)} ${art === "mal" ? "+" : "−"} √${num(b)} ist <em>nicht</em> √${num(falschZusammen)}.</span>`,
  };
}

// Aufgabe 3 — die Wurzel einschachteln.
const A3_KANDIDATEN = (() => {
  const liste = [];
  for (let a = 5; a <= 200; a++) {
    if (istQuadrat(a)) continue;
    const n = Math.floor(Math.sqrt(a));
    // Zu dicht an der unteren Quadratzahl wäre die Aufgabe zu leicht zu raten.
    liste.push({ a, n, unten: n * n, oben: (n + 1) * (n + 1) });
  }
  return liste;
})();

function generateAufgabe3() {
  const k = ohneKollision(A3_KANDIDATEN, (v) => [v.n, v.n + 1, v.a - v.unten, v.oben - v.a], A3_KANDIDATEN[0]);
  const { a, n, unten, oben } = k;
  return {
    promptHtml: `Zwischen welchen beiden aufeinanderfolgenden ganzen Zahlen liegt <strong>√${num(a)}</strong>?<br>` +
      `Gib die <strong>kleinere</strong> der beiden an.`,
    correct: n,
    tolerance: 0.001,
    placeholder: "kleinere Zahl",
    hinweis: (raw, val) => {
      if (Math.abs(val - (n + 1)) < 0.001) return `Das ist die <em>größere</em> der beiden Zahlen. Gefragt war die kleinere: ${num(n)}² = ${num(unten)} ist noch kleiner als ${num(a)}.`;
      if (Math.abs(val - (a - unten)) < 0.001) return `Das ist der Abstand von ${num(a)} zur nächstkleineren Quadratzahl ${num(unten)}, nicht die Wurzel.`;
      if (Math.abs(val - (oben - a)) < 0.001) return `Das ist der Abstand von ${num(a)} zur nächstgrößeren Quadratzahl ${num(oben)}, nicht die Wurzel.`;
      if (!isNaN(val) && val * val > a) return `Zu groß: ${num(val)}² = ${num(val * val)} ist schon größer als ${num(a)}. Gesucht ist die größte Zahl, deren Quadrat noch <em>unter</em> ${num(a)} liegt.`;
      return `Suche die beiden benachbarten Quadratzahlen um ${num(a)} herum: ${num(unten)} und ${num(oben)}.`;
    },
    tipps: [
      "Gesucht sind die beiden Quadratzahlen, zwischen denen der Radikand liegt.",
      `Zähle die Quadratzahlen ab, bis du ${num(a)} überschreitest: 1, 4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144 …`,
      "Das Wurzelziehen erhält die Reihenfolge: Aus u < a < o wird √u < √a < √o. Die kleinere Zahl ist also die Wurzel aus der kleineren Quadratzahl.",
    ],
    musterloesungHtml:
      `<strong>1. Quadratzahlen suchen:</strong> ${num(n)}² = ${num(unten)} und ${num(n + 1)}² = ${num(oben)}<br>` +
      `<strong>2. Einordnen:</strong> ${num(unten)} &lt; ${num(a)} &lt; ${num(oben)}<br>` +
      `<strong>3. Wurzel ziehen</strong> (das erhält die Reihenfolge): <strong>${num(n)} &lt; √${num(a)} &lt; ${num(n + 1)}</strong><br>` +
      `Die gesuchte kleinere Zahl ist <strong>${num(n)}</strong>. Zur Kontrolle: √${num(a)} ≈ ${num(Math.sqrt(a), 3)}.`,
  };
}

// Aufgabe 4 — rational oder irrational. Abschnitt 3 hatte bisher keine Aufgabe,
// dabei ist die Entscheidung „√a ist genau dann rational, wenn a eine
// Quadratzahl ist“ der Kern des ganzen Kapitels.
const A4_ZAHLEN = [
  ...[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((q) => ({ text: `√${q * q}`, rational: true, art: "wurzel", n: q * q })),
  ...[[3, 4], [2, 5], [5, 8], [7, 10], [1, 3], [2, 9], [5, 6]].map(([z, n]) => ({ text: `${z}/${n}`, rational: true, art: "bruch" })),
  ...["0,25", "1,75", "3,125", "0,4", "2,6", "0,125"].map((t) => ({ text: t, rational: true, art: "dezimal" })),
  ...["0,333… (periodisch)", "0,1818… (periodisch)", "2,7272… (periodisch)"].map((t) => ({ text: t, rational: true, art: "periodisch" })),
  ...[2, 3, 5, 6, 7, 8, 10, 11, 12, 13, 15, 17, 18, 20, 24, 27].map((a) => ({ text: `√${a}`, rational: false, art: "wurzel", n: a })),
  { text: "π", rational: false, art: "pi" },
  ...[[2, 3], [3, 2], [2, 5], [5, 2], [4, 3], [2, 7]].map(([c, a]) => ({ text: `${c} · √${a}`, rational: false, art: "vielfaches", c, n: a })),
];
const A4_RATIONALE = A4_ZAHLEN.filter((z) => z.rational);
const A4_IRRATIONALE = A4_ZAHLEN.filter((z) => !z.rational);

// Warum die Zahl rational bzw. irrational ist — jede Begründung nennt ihren
// eigenen Grund, sonst wäre der Hinweis beliebig.
function a4Begruendung(z) {
  if (z.art === "wurzel" && z.rational) return `${z.text} = ${num(Math.round(Math.sqrt(z.n)))} — eine ganze Zahl und damit rational.`;
  if (z.art === "wurzel") return `${num(z.n)} ist keine Quadratzahl. Dann hat ${z.text} unendlich viele Nachkommastellen ohne Periode und ist irrational.`;
  if (z.art === "bruch") return `${z.text} ist ein Bruch aus zwei ganzen Zahlen — genau das ist die Definition von rational.`;
  if (z.art === "dezimal") return `Die Dezimaldarstellung von ${z.text} bricht ab. Solche Zahlen lassen sich immer als Bruch schreiben, sie sind rational.`;
  if (z.art === "periodisch") return "Die Dezimaldarstellung wiederholt sich ab einer Stelle immer weiter. Auch eine periodische Dezimalzahl lässt sich in einen Bruch verwandeln und ist damit rational.";
  if (z.art === "pi") return "π hat unendlich viele Nachkommastellen ohne Periode — π ist irrational.";
  return `√${num(z.n)} ist irrational, denn ${num(z.n)} ist keine Quadratzahl — und eine rationale Zahl mal einer irrationalen bleibt irrational.`;
}

function generateAufgabe4() {
  // Konstruktiv: je eine rationale und eine irrationale Zahl sind gesetzt,
  // die dritte kommt aus dem Rest. So ist nie alles gleich.
  const r = pick(A4_RATIONALE);
  const i = pick(A4_IRRATIONALE);
  const dritte = pick(A4_ZAHLEN.filter((z) => z.text !== r.text && z.text !== i.text));
  const zahlen = mische([r, i, dritte]);
  const marken = ["a", "b", "c"];
  return {
    promptHtml: `Entscheide für jede Zahl, ob sie <strong>rational (1)</strong> oder <strong>irrational (2)</strong> ist:<br>` +
      zahlen.map((z, idx) => `<strong>${marken[idx]})</strong> ${z.text}`).join("&nbsp;&nbsp;&nbsp;"),
    felder: zahlen.map((z, idx) => ({
      name: `${marken[idx]}) ${z.text}`, soll: z.rational ? 1 : 2, toleranz: 0.25, platzhalter: "1 oder 2",
      hinweis: () => a4Begruendung(z),
    })),
    tipps: [
      "Rational heißt: als Bruch zweier ganzer Zahlen schreibbar. Die Dezimaldarstellung bricht dann ab oder ist periodisch.",
      "Eine Wurzel ist genau dann rational, wenn ihr Radikand eine Quadratzahl ist — also 1, 4, 9, 16, 25, 36, 49, 64, 81, 100, …",
      "Brüche und abbrechende oder periodische Dezimalzahlen sind immer rational. π und jedes Vielfache einer irrationalen Wurzel sind irrational.",
    ],
    musterloesungHtml:
      zahlen.map((z, idx) =>
        `<strong>${marken[idx]}) ${z.text}</strong> ist <strong>${z.rational ? "rational" : "irrational"}</strong> — ${a4Begruendung(z)}`
      ).join("<br>") +
      `<br><span class="progress-note">Die Faustregel für Wurzeln: √a ist genau dann rational, wenn a eine Quadratzahl ist. ` +
      `Alle anderen Wurzeln aus natürlichen Zahlen sind irrational — das ist kein Zufall und lässt sich mit demselben ` +
      `Widerspruchsbeweis zeigen wie bei √2.</span>`,
  };
}

// Aufgabe 5 — teilweise wurzelziehen.
const A5_KANDIDATEN = (() => {
  const liste = [];
  for (let a = 8; a <= 500; a++) {
    const { f, rest } = quadratfaktor(a);
    if (f < 2 || rest < 2) continue;   // sonst gibt es nichts herauszuziehen
    liste.push({ a, f, rest });
  }
  return liste;
})();

function generateAufgabe5() {
  const k = ohneKollision(A5_KANDIDATEN, (v) => [v.f, v.rest, v.f * v.f, v.a, v.f * v.rest], A5_KANDIDATEN[0]);
  const { a, f, rest } = k;
  return {
    promptHtml: `Ziehe teilweise die Wurzel: <strong>√${num(a)} = c · √${num(rest)}</strong>.<br>` +
      `Wie groß ist der Faktor <strong>c</strong> vor der Wurzel?`,
    correct: f,
    tolerance: 0.001,
    placeholder: "c = ?",
    hinweis: (raw, val) => {
      if (Math.abs(val - f * f) < 0.001) return `Das ist die Quadratzahl ${num(f * f)} selbst. Vor die Wurzel kommt aber ihre <em>Wurzel</em>: √${num(f * f)} = ${num(f)}.`;
      if (Math.abs(val - rest) < 0.001) return `Das ist der Rest, der unter der Wurzel stehen bleibt, nicht der Faktor davor.`;
      if (Math.abs(val - a) < 0.001) return `Das ist der Radikand. Zerlege ihn zuerst: ${num(a)} = ${num(f * f)} · ${num(rest)}.`;
      if (Math.abs(val - f * rest) < 0.001) return `Du hast den Faktor mit dem Rest multipliziert. Vor der Wurzel steht nur √${num(f * f)} = ${num(f)}.`;
      return `Zerlege ${num(a)} in eine Quadratzahl mal ${num(rest)}: ${num(a)} : ${num(rest)} = ${num(a / rest)}. Ziehe daraus die Wurzel.`;
    },
    tipps: [
      `Unter der Wurzel steckt eine Quadratzahl. Teile dazu ${num(a)} durch den Rest ${num(rest)}.`,
      `${num(a)} : ${num(rest)} = ${num(a / rest)} — und ${num(a / rest)} ist eine Quadratzahl.`,
      "Nach der Produktregel √(x · y) = √x · √y darf man die Quadratzahl herausziehen; vor der Wurzel steht dann ihre Wurzel.",
    ],
    musterloesungHtml:
      `<strong>1. Zerlegen:</strong> ${num(a)} = <strong>${num(f * f)}</strong> · ${num(rest)}, und ${num(f * f)} = ${num(f)}² ist eine Quadratzahl<br>` +
      `<strong>2. Produktregel:</strong> √${num(a)} = √(${num(f * f)} · ${num(rest)}) = √${num(f * f)} · √${num(rest)}<br>` +
      `<strong>3. Herausziehen:</strong> √${num(f * f)} = ${num(f)}, also √${num(a)} = <strong>${num(f)}</strong>·√${num(rest)}<br>` +
      `<em>Probe:</em> ${num(f)}² · ${num(rest)} = ${num(f * f)} · ${num(rest)} = ${num(a)} ✓ &nbsp; (numerisch: ${num(f, 3)} · ${num(Math.sqrt(rest), 3)} ≈ ${num(f * Math.sqrt(rest), 3)} ≈ √${num(a)})`,
  };
}

// Aufgabe 6 — zwei Wurzeln zusammenfassen. Das geht nur, wenn nach dem
// teilweisen Wurzelziehen derselbe Radikand übrig bleibt — die Wurzeln
// verhalten sich dabei wie gleichartige Summanden.
const A6_KANDIDATEN = (() => {
  const liste = [];
  for (const r of [2, 3, 5, 6, 7, 10, 11, 13, 14, 15]) {
    for (let u = 1; u <= 7; u++) {
      for (let v = 1; v <= 7; v++) {
        if (u === v) continue;
        const a = u * u * r, b = v * v * r;
        if (a > 600 || b > 600) continue;
        // Plus geht immer; Minus nur, wenn etwas Positives übrig bleibt.
        liste.push({ r, u, v, a, b, op: "+", c: u + v });
        if (u - v >= 2) liste.push({ r, u, v, a, b, op: "−", c: u - v });
      }
    }
  }
  return liste;
})();

function generateAufgabe6() {
  const k = ohneFeldKollision(A6_KANDIDATEN, (v) => [
    // Feld 1: der Faktor vor der Wurzel.
    [v.c, v.u * v.v, 1, v.u, v.v],
    // Feld 2: der gemeinsame Radikand.
    [v.r, v.op === "+" ? v.a + v.b : v.a - v.b],
    // Feld 3: der Zahlenwert.
    [v.c * Math.sqrt(v.r), v.c * v.r, Math.sqrt(v.op === "+" ? v.a + v.b : v.a - v.b)],
  ]);
  const { r, u, v, a, b, op, c } = k;
  const wert = c * Math.sqrt(r);
  const falschRadikand = op === "+" ? a + b : a - b;
  return {
    promptHtml: `Fasse so weit wie möglich zusammen: <strong>√${num(a)} ${op} √${num(b)}</strong><br>` +
      `Das Ergebnis hat die Form <strong>c · √r</strong>.`,
    felder: [
      {
        name: "Faktor c vor der Wurzel", soll: c, toleranz: 0.0005, platzhalter: "c",
        hinweis: (roh, val) => {
          if (Math.abs(val - 1) < 0.0005) return `Du hast wohl die Radikanden verrechnet. Das ist der häufigste Fehler überhaupt: √${num(a)} ${op} √${num(b)} ist <strong>nicht</strong> √${num(falschRadikand)}.`;
          if (Math.abs(val - u * v) < 0.0005) return `Die Faktoren werden ${op === "+" ? "addiert" : "subtrahiert"}, nicht multipliziert: ${num(u)} ${op} ${num(v)} = ${num(c)}.`;
          if (Math.abs(val - u) < 0.0005) return `${num(u)} ist nur der Faktor des ersten Summanden: √${num(a)} = ${num(u)}·√${num(r)}. Der zweite kommt noch dazu.`;
          if (Math.abs(val - v) < 0.0005) return `${num(v)} ist nur der Faktor des zweiten Summanden: √${num(b)} = ${num(v)}·√${num(r)}.`;
          return `Zieh aus beiden Wurzeln teilweise die Wurzel: √${num(a)} = ${num(u)}·√${num(r)} und √${num(b)} = ${num(v)}·√${num(r)}. Dann ${op === "+" ? "addiere" : "subtrahiere"} die Faktoren.`;
        },
      },
      {
        name: "Radikand r unter der Wurzel", soll: r, toleranz: 0.0005, platzhalter: "r",
        hinweis: (roh, val) => {
          if (Math.abs(val - falschRadikand) < 0.0005) return `Radikanden dürfen <strong>nicht</strong> ${op === "+" ? "addiert" : "subtrahiert"} werden. √a ${op} √b ist nie √(a ${op} b) — sonst wäre schon √9 + √16 = √25, also 7 = 5.`;
          return `Beide Radikanden enthalten denselben Rest: ${num(a)} = ${num(u * u)} · ${num(r)} und ${num(b)} = ${num(v * v)} · ${num(r)}. Dieser Rest bleibt stehen.`;
        },
      },
      {
        name: "Wert, auf zwei Stellen gerundet", soll: wert, toleranz: 0.005, einheit: "", platzhalter: "z. B. 8,66",
        hinweis: (roh, val) => {
          if (Math.abs(val - c * r) < 0.005) return `${num(c * r)} wäre ${num(c)} · ${num(r)} — aber unter der Wurzel steht ${num(r)}, und √${num(r)} ≈ ${fest(Math.sqrt(r), 3)}.`;
          if (Math.abs(val - Math.sqrt(falschRadikand)) < 0.005) return `Das ist √${num(falschRadikand)} — die Radikanden wurden verrechnet. Richtig ist ${num(c)} · √${num(r)}.`;
          return `Rechne ${num(c)} · √${num(r)} ≈ ${num(c)} · ${fest(Math.sqrt(r), 4)} und runde auf zwei Stellen.`;
        },
      },
    ],
    tipps: [
      "Zusammenfassen geht nur bei <em>gleichem</em> Radikanden — so wie 3x + 5x = 8x nur geht, weil beide Male x dasteht.",
      `Zieh deshalb zuerst aus beiden Wurzeln teilweise die Wurzel: ${num(a)} = ${num(u * u)} · ${num(r)} und ${num(b)} = ${num(v * v)} · ${num(r)}.`,
      `Damit steht da ${num(u)}·√${num(r)} ${op} ${num(v)}·√${num(r)}. Jetzt nur noch die Faktoren ${op === "+" ? "addieren" : "subtrahieren"}.`,
    ],
    musterloesungHtml:
      `<strong>1. Teilweise wurzelziehen:</strong><br>` +
      `&nbsp;&nbsp;&nbsp;√${num(a)} = √(${num(u * u)} · ${num(r)}) = ${num(u)}·√${num(r)}<br>` +
      `&nbsp;&nbsp;&nbsp;√${num(b)} = √(${num(v * v)} · ${num(r)}) = ${num(v)}·√${num(r)}<br>` +
      `<strong>2. Zusammenfassen:</strong> ${num(u)}·√${num(r)} ${op} ${num(v)}·√${num(r)} = (${num(u)} ${op} ${num(v)})·√${num(r)} = <strong>${num(c)}·√${num(r)}</strong><br>` +
      `<strong>3. Zahlenwert:</strong> ${num(c)} · ${fest(Math.sqrt(r), 4)} ≈ <strong>${fest(wert, 2)}</strong><br>` +
      `<em>Probe:</em> √${num(a)} ${op} √${num(b)} ≈ ${fest(Math.sqrt(a), 3)} ${op} ${fest(Math.sqrt(b), 3)} ≈ ${fest(op === "+" ? Math.sqrt(a) + Math.sqrt(b) : Math.sqrt(a) - Math.sqrt(b), 3)} ✓<br>` +
      `<span class="progress-note">Der verlockende Kurzweg √${num(a)} ${op} √${num(b)} = √${num(falschRadikand)} ergäbe ${fest(Math.sqrt(falschRadikand), 3)} — ` +
      `und das stimmt nicht. Für Summen und Differenzen gibt es keine Wurzelregel; nur Produkte und Quotienten darf man auseinanderziehen.</span>`,
  };
}

// Aufgabe 7 — die Diagonale eines Rechtecks, mit ganzzahligem Ergebnis.
const A7_KANDIDATEN = (() => {
  const liste = [];
  for (let a = 2; a <= 60; a++) {
    for (let b = 2; b <= 60; b++) {
      if (a === b) continue;
      const d = Math.sqrt(a * a + b * b);
      if (!Number.isInteger(d) || d > 80) continue;
      liste.push({ a, b, d, q: a * a + b * b });
    }
  }
  return liste;
})();

function generateAufgabe7() {
  const k = ohneKollision(A7_KANDIDATEN, (v) => [v.d, v.a + v.b, v.q, v.b - v.a, v.a, v.b], A7_KANDIDATEN[0]);
  const { a, b, d, q } = k;
  const dinge = pick([
    { was: "Ein Rechteck", frage: "seine Diagonale", e: "cm" },
    { was: "Ein rechteckiges Grundstück", frage: "sein Diagonalweg", e: "m" },
    { was: "Ein rechteckiger Bildschirm", frage: "seine Bildschirmdiagonale", e: "cm" },
  ]);
  return {
    promptHtml: `${dinge.was} ist ${num(a)} ${dinge.e} breit und ${num(b)} ${dinge.e} hoch.<br>` +
      `Wie lang ist <strong>${dinge.frage}</strong> in ${dinge.e}?`,
    correct: d,
    tolerance: 0.001,
    placeholder: "Länge in " + dinge.e,
    hinweis: (raw, val) => {
      if (Math.abs(val - (a + b)) < 0.001) return `Das ist der Weg <em>um die Ecke</em>, also a + b. Die Diagonale geht quer hindurch und ist kürzer. Und Achtung: √(a² + b²) ist nicht a + b.`;
      if (Math.abs(val - q) < 0.001) return `Das ist a² + b² = ${num(q)}, also das <em>Quadrat</em> der Diagonalen. Es fehlt noch die Wurzel.`;
      if (Math.abs(val - Math.abs(b - a)) < 0.001) return `Das ist der Unterschied der beiden Seiten. Gesucht ist die Diagonale nach dem Satz des Pythagoras.`;
      if (Math.abs(val - a) < 0.001 || Math.abs(val - b) < 0.001) return `Das ist eine der beiden Seiten. Die Diagonale ist länger als jede einzelne Seite.`;
      return `Satz des Pythagoras: d² = ${num(a)}² + ${num(b)}² = ${num(a * a)} + ${num(b * b)} = ${num(q)}. Ziehe daraus die Wurzel.`;
    },
    tipps: [
      "Die Diagonale teilt das Rechteck in zwei rechtwinklige Dreiecke; sie ist deren Hypotenuse.",
      `Satz des Pythagoras: d² = ${num(a)}² + ${num(b)}² = ${num(a * a)} + ${num(b * b)} = ${num(q)}.`,
      `Aus d² wird d durch Wurzelziehen: √${num(q)}. Hier geht die Wurzel auf.`,
    ],
    musterloesungHtml:
      `<strong>1. Satz des Pythagoras:</strong> d² = a² + b² = ${num(a)}² + ${num(b)}² = ${num(a * a)} + ${num(b * b)} = <strong>${num(q)}</strong><br>` +
      `<strong>2. Wurzel ziehen:</strong> d = √${num(q)} = <strong>${num(d)}</strong> ${dinge.e}<br>` +
      `<em>Probe:</em> ${num(d)}² = ${num(q)} ✓ — ${num(a)}, ${num(b)} und ${num(d)} bilden ein pythagoreisches Tripel.<br>` +
      `<em>Zum Vergleich:</em> Der Weg um die Ecke wäre ${num(a)} + ${num(b)} = ${num(a + b)} ${dinge.e} — deutlich länger als die Diagonale.`,
  };
}

// Aufgabe 8 — eine Diagonale, deren Länge keine ganze Zahl ist. Sie führt
// Pythagoras, teilweises Wurzelziehen und das Runden zusammen — und macht
// nebenbei deutlich, dass eine irrationale Zahl eine ganz gewöhnliche Länge
// sein kann.
const A8_KANDIDATEN = (() => {
  const liste = [];
  for (let a = 2; a <= 40; a++) {
    for (let b = a + 1; b <= 40; b++) {
      const q = a * a + b * b;
      if (istQuadrat(q)) continue;                 // dann wäre nichts zu runden
      const { f, rest } = quadratfaktor(q);
      if (f < 2 || rest < 2) continue;             // sonst gibt es nichts herauszuziehen
      liste.push({ a, b, q, f, rest });
    }
  }
  return liste;
})();
const A8_KONTEXTE = [
  { was: "Ein rechteckiger Raum", lang: "lang", breit: "breit", frage: "die Diagonale des Raumes", e: "m" },
  { was: "Ein rechteckiges Grundstück", lang: "lang", breit: "breit", frage: "der Diagonalweg", e: "m" },
  { was: "Ein rechteckiges Fahnentuch", lang: "lang", breit: "hoch", frage: "die Diagonale des Tuches", e: "cm" },
  { was: "Eine rechteckige Glasplatte", lang: "lang", breit: "breit", frage: "die Diagonale der Platte", e: "cm" },
];

function generateAufgabe8() {
  const k = ohneFeldKollision(A8_KANDIDATEN, (v) => [
    // Feld 1: der Radikand d² = a² + b².
    [v.q, v.a + v.b, (v.a + v.b) * (v.a + v.b), v.a * v.b, v.b * v.b - v.a * v.a],
    // Feld 2: der Faktor vor der Wurzel.
    [v.f, v.rest, v.f * v.f, v.q],
    // Feld 3: die gerundete Länge.
    [Math.sqrt(v.q), v.a + v.b, v.q],
  ]);
  const { a, b, q, f, rest } = k;
  const kt = pick(A8_KONTEXTE);
  const d = Math.sqrt(q);
  return {
    promptHtml: `${kt.was} ist <strong>${num(b)} ${kt.e}</strong> ${kt.lang} und <strong>${num(a)} ${kt.e}</strong> ${kt.breit}.<br>` +
      `Gesucht ist <strong>${kt.frage}</strong> — erst exakt in der Form c · √r, dann gerundet.`,
    felder: [
      {
        name: "d² = a² + b²", soll: q, toleranz: 0.0005, platzhalter: "Radikand",
        hinweis: (roh, val) => {
          if (Math.abs(val - (a + b)) < 0.0005) return `${num(a + b)} ist der Weg um die Ecke, also a + b. Der Satz des Pythagoras addiert die <em>Quadrate</em>.`;
          if (Math.abs(val - (a + b) * (a + b)) < 0.0005) return `(a + b)² ist nicht a² + b² — beim Ausmultiplizieren käme noch 2ab dazu. Rechne ${num(a)}² + ${num(b)}² getrennt aus.`;
          if (Math.abs(val - a * b) < 0.0005) return `${num(a * b)} ist der Flächeninhalt, nicht das Quadrat der Diagonalen.`;
          if (Math.abs(val - (b * b - a * a)) < 0.0005) return "Die Quadrate werden addiert, nicht subtrahiert: Die Diagonale ist die Hypotenuse.";
          return `Satz des Pythagoras: d² = ${num(a)}² + ${num(b)}² = ${num(a * a)} + ${num(b * b)}.`;
        },
      },
      {
        name: "Faktor c vor der Wurzel", soll: f, toleranz: 0.0005, platzhalter: "c",
        hinweis: (roh, val) => {
          if (Math.abs(val - rest) < 0.0005) return `${num(rest)} bleibt <em>unter</em> der Wurzel stehen. Davor kommt die Wurzel aus der Quadratzahl.`;
          if (Math.abs(val - f * f) < 0.0005) return `${num(f * f)} ist die Quadratzahl in ${num(q)}. Vor die Wurzel kommt ihre Wurzel: √${num(f * f)} = ${num(f)}.`;
          if (Math.abs(val - q) < 0.0005) return `${num(q)} ist der ganze Radikand. Zerlege ihn zuerst: ${num(q)} = ${num(f * f)} · ${num(rest)}.`;
          return `Zerlege ${num(q)} in Quadratzahl mal Rest: ${num(q)} = ${num(f * f)} · ${num(rest)}. Aus ${num(f * f)} lässt sich die Wurzel ziehen.`;
        },
      },
      {
        name: `Länge gerundet (zwei Stellen)`, soll: d, einheit: kt.e, toleranz: 0.005, platzhalter: "z. B. 12,65",
        hinweis: (roh, val) => {
          if (Math.abs(val - q) < 0.005) return `${num(q)} ist d², nicht d. Es fehlt die Wurzel.`;
          if (Math.abs(val - (a + b)) < 0.005) return `${num(a + b)} ${kt.e} wäre der Weg um die Ecke. Die Diagonale ist kürzer.`;
          if (!isNaN(val) && (val <= b || val >= a + b)) return `Die Diagonale ist länger als jede Seite (${num(b)} ${kt.e}) und kürzer als beide zusammen (${num(a + b)} ${kt.e}).`;
          return `${num(f)} · √${num(rest)} ≈ ${num(f)} · ${fest(Math.sqrt(rest), 4)} — auf zwei Stellen gerundet.`;
        },
      },
    ],
    tipps: [
      `Die Diagonale ist die Hypotenuse eines rechtwinkligen Dreiecks mit den Katheten ${num(a)} ${kt.e} und ${num(b)} ${kt.e}.`,
      `d² = ${num(a)}² + ${num(b)}² = ${num(a * a)} + ${num(b * b)} = ${num(q)}. Da ${num(q)} keine Quadratzahl ist, bleibt eine Wurzel stehen.`,
      `Zieh teilweise die Wurzel: ${num(q)} = ${num(f * f)} · ${num(rest)}, also d = ${num(f)}·√${num(rest)}. Den Zahlenwert bekommst du mit dem Taschenrechner.`,
    ],
    musterloesungHtml:
      `<strong>1. Satz des Pythagoras:</strong> d² = ${num(a)}² + ${num(b)}² = ${num(a * a)} + ${num(b * b)} = <strong>${num(q)}</strong><br>` +
      `<strong>2. Teilweise wurzelziehen:</strong> ${num(q)} = ${num(f * f)} · ${num(rest)}, also d = √(${num(f * f)} · ${num(rest)}) = <strong>${num(f)}·√${num(rest)}</strong><br>` +
      `<strong>3. Runden:</strong> ${num(f)} · ${fest(Math.sqrt(rest), 4)} ≈ <strong>${fest(d, 2)} ${kt.e}</strong><br>` +
      `<em>Probe:</em> ${fest(d, 2)}² ≈ ${fest(Number(d.toFixed(2)) ** 2, 2)} ≈ ${num(q)} ✓ &nbsp; und die Diagonale liegt zwischen ${num(b)} ${kt.e} und ${num(a + b)} ${kt.e}.<br>` +
      `<span class="progress-note">${num(f)}·√${num(rest)} ist die <em>exakte</em> Länge; ${fest(d, 2)} ${kt.e} ist nur eine Näherung. ` +
      `Wer weiterrechnet, nimmt die exakte Form — sonst häufen sich die Rundungsfehler. ` +
      `Dass die Länge irrational ist, merkt man ihr beim Nachmessen nicht an: Es ist eine ganz gewöhnliche Strecke.</span>`,
  };
}

function initExercises() {
  mountUebungsaufgaben(document.getElementById("exercises-mount"), [
    { schwierigkeit: "einfach", titel: "Aufgabe 1 — Wurzel aus einer Quadratzahl", generate: generateAufgabe1 },
    { schwierigkeit: "einfach", titel: "Aufgabe 2 — Produkt- und Quotientenregel", generate: generateAufgabe2 },
    { schwierigkeit: "mittel", titel: "Aufgabe 3 — Wurzel einschachteln", generate: generateAufgabe3 },
    { schwierigkeit: "mittel", titel: "Aufgabe 4 — rational oder irrational?", generate: generateAufgabe4 },
    { schwierigkeit: "schwierig", titel: "Aufgabe 5 — teilweise wurzelziehen", generate: generateAufgabe5 },
    { schwierigkeit: "schwierig", titel: "Aufgabe 6 — Wurzeln zusammenfassen", generate: generateAufgabe6 },
    { schwierigkeit: "komplex", titel: "Aufgabe 7 — Diagonale berechnen", generate: generateAufgabe7 },
    { schwierigkeit: "komplex", titel: "Aufgabe 8 — Diagonale mit Wurzel", generate: generateAufgabe8 },
  ]);
}

// ================= Quizze =================

function initQuizzes() {
  mountQuiz(document.getElementById("quiz-begriff"), {
    q: "Wie viele Lösungen hat die Gleichung x² = 16, und wie groß ist √16?",
    options: [
      "zwei Lösungen (4 und −4); √16 = 4",
      "zwei Lösungen (4 und −4); √16 = ±4",
      "eine Lösung (4); √16 = 4",
      "zwei Lösungen (4 und 8); √16 = 4",
    ],
    correct: 0,
    explain: "Die Gleichung hat zwei Lösungen, denn 4² = 16 und (−4)² = 16. Das Wurzelzeichen dagegen bezeichnet nur die nichtnegative Zahl: √16 = 4. Sonst wäre √16 keine eindeutige Zahl.",
  });
  mountQuiz(document.getElementById("quiz-einschachteln"), {
    q: "Zwischen welchen ganzen Zahlen liegt √50?",
    options: ["zwischen 7 und 8", "zwischen 6 und 7", "zwischen 24 und 26", "zwischen 25 und 26"],
    correct: 0,
    explain: "7² = 49 und 8² = 64, also 49 < 50 < 64 und damit 7 < √50 < 8. Genauer: √50 ≈ 7,07. Die Antwort „24 bis 26“ entsteht, wenn man halbiert statt die Wurzel zu ziehen.",
  });
  mountQuiz(document.getElementById("quiz-irrational"), {
    q: "Welche dieser Zahlen ist <em>irrational</em>?",
    options: ["√7", "√36", "0,25", "1 : 3"],
    correct: 0,
    explain: "7 ist keine Quadratzahl, also lässt sich √7 nicht als Bruch schreiben — die Dezimaldarstellung ist unendlich und nicht periodisch. √36 = 6 ist natürlich, 0,25 = 1 : 4 bricht ab, und 1 : 3 = 0,333… ist periodisch: alle drei sind rational.",
  });
  mountQuiz(document.getElementById("quiz-regeln"), {
    q: "Welche Umformung ist <em>falsch</em>?",
    options: [
      "√(9 + 16) = √9 + √16",
      "√(9 · 16) = √9 · √16",
      "√(36 : 4) = √36 : √4",
      "√2 + √2 = 2√2",
    ],
    correct: 0,
    explain: "√(9 + 16) = √25 = 5, aber √9 + √16 = 3 + 4 = 7. Für Summen gibt es keine solche Regel. Produkt und Quotient darf man dagegen aufteilen, und √2 + √2 = 2√2 ist nur das Zusammenfassen gleichartiger Summanden.",
  });
  mountQuiz(document.getElementById("quiz-teilweise"), {
    q: "Wie lautet √48 in der Form c · √r mit möglichst großem c?",
    options: ["4√3", "2√12", "16√3", "3√4"],
    correct: 0,
    explain: "48 = 16 · 3, und 16 = 4² ist die größte Quadratzahl darin: √48 = √16 · √3 = 4√3. Bei 2√12 steckt in der 12 noch die Quadratzahl 4; 16√3 wäre √(256 · 3) = √768; und 3√4 ist einfach 6.",
  });
  mountQuiz(document.getElementById("quiz-laengen"), {
    q: "Ein Rechteck ist 6 cm breit und 8 cm hoch. Wie lang ist die Diagonale?",
    options: ["10 cm", "14 cm", "100 cm", "√14 cm"],
    correct: 0,
    explain: "d² = 6² + 8² = 36 + 64 = 100, also d = √100 = 10 cm. Die 14 cm sind der Weg um die Ecke (6 + 8), die 100 ist das Quadrat der Diagonalen, und √14 entstünde aus dem falschen Ansatz √(6 + 8).",
  });
}

// ================= Start =================

initBegriff();
initEinschachteln();
initIrrational();
initRegeln();
initTeilweise();
initLaengen();
initExercises();
initQuizzes();
