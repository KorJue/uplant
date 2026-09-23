// Selbstlernpfad „Bernoulli-Ketten und Binomialverteilung“ (MSS 13, Wahrscheinlichkeitsrechnung,
// Thema 5). Rein clientseitiges Vanilla-JS, ohne Build-Schritt.
//
// Didaktische Reihenfolge — jede Stufe benutzt nur, was davor steht:
//   1. Zufallsgröße und Verteilung      (braucht nur Laplace und Ereignisse)
//   2. Erwartungswert, Varianz, σ       (braucht die Verteilung aus 1)
//   3. Bernoulli-Kette am Baum          (braucht Pfadregeln und Unabhängigkeit aus Thema 1 und 4)
//   4. Binomialkoeffizient              (beantwortet die offene Frage aus 3: wie viele Pfade?)
//   5. Formel von Bernoulli             (setzt 3 und 4 zusammen)
//   6. Binomialverteilung, Histogramm   (5 für alle k)
//   7. kumulierte Verteilung            (Summen aus 6)
//   8. μ = n · p, σ = √(n·p·(1 − p))    (Definition aus 2 an der Verteilung aus 6 nachgerechnet)
//   9. n, k oder p gesucht              (Umkehrung von 5 und 7)
//
// Schreibweise: in erster Linie Bigalke/Köhler — B(n; p; k), F(n; p; k) —, daneben Fundamente —
// B_{n;p}(k), F_{n;p}(k). Die Übungsaufgaben stehen in aufgaben-binomial.js.
//
// Gerechnet wird mit den Reglerwerten, nie mit Bildschirmkoordinaten. Die Zeichnungen sind
// Anzeige; die Prüfung liest sie aus dem SVG zurück und rechnet unabhängig nach.
//
// Farbcodierung: Treffer/Ereignis grün, Niete/Gegenereignis orange, n blau, μ violett,
// Streuband und Schranke rot.

import { mountUebungsaufgaben } from "../../../aufgaben.js?v=2";
import { AUFGABEN, parseZahl } from "./aufgaben-binomial.js?v=1";

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
// Deutsche Schreibweise, echtes Minuszeichen. Gerundet wird VOR der Ausgabe, damit −0,00001 nicht
// als „−0“ erscheint.
function num(x, stellen = 4) {
  const f = Math.pow(10, stellen);
  const g = Math.round(x * f) / f;
  return zahlformat(stellen).format(g === 0 ? 0 : g).replace("-", "−");
}
// „=“ oder „≈“: Entscheidend ist, ob die Anzeige mit dieser Stellenzahl den Wert genau trifft.
function zeichen(x, stellen = 4) {
  const f = Math.pow(10, stellen);
  return Math.abs(x - Math.round(x * f) / f) < 1e-12 ? "=" : "≈";
}
// Geldbeträge immer mit zwei Nachkommastellen: „0,50 €“, nicht „0,5 €“.
const EURO = new Intl.NumberFormat("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
function euro(x) {
  const g = Math.round(x * 100) / 100;
  return EURO.format(g === 0 ? 0 : g).replace("-", "−") + " €";
}
function bruch(z, n, klasse = "") {
  return `<span class="bruch ${klasse}"><span class="z">${z}</span><span class="n">${n}</span></span>`;
}
function binomHtml(n, k, klasse = "") {
  return `<span class="binom ${klasse}"><span>${n}</span><span>${k}</span></span>`;
}
function ggt(a, b) {
  return b ? ggt(b, a % b) : Math.abs(a);
}
// Ein Bruch z/n, gekürzt dazugeschrieben, wenn das geht: „6/36 = 1/6“.
function bruchGekuerzt(z, n) {
  if (z === 0) return "0";
  const g = ggt(z, n);
  return g > 1 ? `${bruch(z, n)} = ${bruch(z / g, n / g)}` : bruch(z, n);
}
function reglerZahl(id) {
  return Number(document.getElementById(id).value);
}
// Reglerwerte wie 0,3 kommen als 0.30000000000000004 an — auf das Raster des Reglers runden.
function reglerP(id) {
  return Math.round(reglerZahl(id) * 100) / 100;
}
// Schreibt einen begrenzten Reglerwert in den Regler zurück: Ein Regler darf nie etwas anderes
// anzeigen als das, womit gerechnet wird.
function begrenzt(id, wert, min, max) {
  const v = Math.min(max, Math.max(min, wert));
  const e = document.getElementById(id);
  if (Number(e.value) !== v) e.value = String(v);
  return v;
}
function setzeAnzeige(id, text) {
  document.getElementById(id).textContent = text;
}
function zeige(mountId, knoten) {
  const m = document.getElementById(mountId);
  m.innerHTML = "";
  m.appendChild(knoten);
}
function flaeche(breite, hoehe) {
  return svgEl("svg", { viewBox: `0 0 ${breite} ${hoehe}`, width: breite, height: hoehe, class: "geo-svg", preserveAspectRatio: "xMidYMid meet" });
}

// ---------- Die Binomialverteilung selbst ----------

// Binomialkoeffizient multiplikativ: für n ≤ 100 genau genug (relativer Fehler ~1e-15), und
// ohne die riesigen Fakultäten, die schon bei 171! aus dem Zahlbereich fielen.
function binom(n, k) {
  if (k < 0 || k > n) return 0;
  k = Math.min(k, n - k);
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
  // Unterhalb von 10^15 ist das Ergebnis eine ganze Zahl; Rundungsreste der Division werden
  // entfernt, damit (10 über 3) als 120 und nicht als 119,99999999999999 erscheint.
  return r > 1e15 ? r : Math.round(r);
}
function B(n, p, k) {
  if (k < 0 || k > n) return 0;
  return binom(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
}
function F(n, p, k) {
  if (k < 0) return 0;
  let s = 0;
  for (let i = 0; i <= Math.min(k, n); i++) s += B(n, p, i);
  return Math.min(1, s);
}
function verteilung(n, p) {
  const out = [];
  for (let k = 0; k <= n; k++) out.push({ x: k, p: B(n, p, k) });
  return out;
}

// ---------- Histogramm ----------
//
// Säulen der Breite 1 über den Werten x, Höhe = Wahrscheinlichkeit. Die Gitterlinien tragen ihren
// Wert als data-wert: Die Prüfung rechnet daraus den Maßstab zurück und liest die Säulenhöhen als
// Wahrscheinlichkeiten ab.
function histogramm(daten, opt = {}) {
  const breite = opt.breite || 560, hoehe = opt.hoehe || 260;
  const links = 46, rechts = 14, oben = 18, unten = 34;
  const xs = daten.map((d) => d.x);
  const xmin = Math.min(...xs) - 0.5, xmax = Math.max(...xs) + 0.5;
  let pmax = Math.max(...daten.map((d) => d.p), ...(opt.vergleich || []).map((d) => d.p), 1e-9);
  // Eine glatte Obergrenze für die y-Achse: 0,05er, 0,1er oder 0,2er Schritte.
  const schritt = pmax > 0.6 ? 0.2 : pmax > 0.3 ? 0.1 : pmax > 0.12 ? 0.05 : pmax > 0.06 ? 0.02 : 0.01;
  const ymax = Math.ceil((pmax + 1e-12) / schritt) * schritt;
  const sx = (breite - links - rechts) / (xmax - xmin);
  const sy = (hoehe - oben - unten) / ymax;
  const X = (x) => links + (x - xmin) * sx;
  const Y = (y) => hoehe - unten - y * sy;
  const svg = flaeche(breite, hoehe);

  for (let y = 0; y <= ymax + 1e-9; y += schritt) {
    const yy = Math.round(y / schritt) * schritt;
    svg.appendChild(svgEl("line", { x1: links, x2: breite - rechts, y1: Y(yy).toFixed(2), y2: Y(yy).toFixed(2), class: "bk-gitterlinie", "data-wert": num(yy, 2).replace(",", ".") }));
    svg.appendChild(svgText(links - 6, Y(yy) + 4, num(yy, 2), { class: "bk-achsentext", "text-anchor": "end" }));
  }
  if (opt.sigmaBand) {
    const [a, b] = opt.sigmaBand;
    svg.appendChild(svgEl("rect", { x: X(a).toFixed(2), y: oben, width: Math.max(0, X(b) - X(a)).toFixed(2), height: hoehe - oben - unten, class: "bk-sigma" }));
  }
  daten.forEach((d) => {
    const klasse = opt.klasse ? opt.klasse(d.x) : "";
    svg.appendChild(svgEl("rect", {
      x: X(d.x - 0.5).toFixed(2), y: Y(d.p).toFixed(2), width: sx.toFixed(2), height: (d.p * sy).toFixed(2),
      class: "bk-saeule" + (klasse ? " " + klasse : ""), "data-x": String(d.x),
    }));
  });
  (opt.vergleich || []).forEach((d) => {
    svg.appendChild(svgEl("rect", {
      x: X(d.x - 0.5).toFixed(2), y: Y(d.p).toFixed(2), width: sx.toFixed(2), height: (d.p * sy).toFixed(2),
      class: "bk-saeule vergleich", "data-vergleich": String(d.x),
    }));
  });
  svg.appendChild(svgEl("line", { x1: links, x2: breite - rechts, y1: Y(0), y2: Y(0), class: "bk-achse" }));
  svg.appendChild(svgEl("line", { x1: links, x2: links, y1: oben - 6, y2: Y(0), class: "bk-achse" }));
  // Beschriftung der x-Achse: bei vielen Säulen nur jede fünfte oder zehnte, sonst überlappen sie.
  // Die Dichte richtet sich nach der Säulenbreite in Bildpunkten, nicht nach der Säulenzahl allein:
  // 21 Säulen passen auf 560 px, auf 380 px liefen die zweistelligen Zahlen ineinander.
  const jede = opt.jede || (sx >= 22 ? 1 : sx >= 11 ? 2 : sx >= 5 ? 5 : 10);
  daten.forEach((d) => {
    if (Math.round(d.x) === d.x && d.x % jede === 0) svg.appendChild(svgText(X(d.x), hoehe - unten + 15, opt.xText ? opt.xText(d.x) : num(d.x), { class: "bk-achsentext" }));
  });
  svg.appendChild(svgText(breite - rechts, hoehe - 4, opt.xName || "k", { class: "bk-achsentext", "text-anchor": "end" }));
  svg.appendChild(svgText(links + 4, oben - 6, opt.yName || "P(X = k)", { class: "bk-achsentext", "text-anchor": "start" }));
  if (opt.mu !== undefined) {
    svg.appendChild(svgEl("line", { x1: X(opt.mu).toFixed(2), x2: X(opt.mu).toFixed(2), y1: oben, y2: Y(0), class: "bk-mu", "data-mu": String(opt.mu) }));
    // Rechts neben die Linie, nicht darauf: Oben endet dort sonst der Rand des σ-Bandes.
    svg.appendChild(svgText(X(opt.mu) + 9, oben + 12, "μ", { class: "bk-mu-text" }));
  }
  svg.dataset.xmin = String(xmin);
  svg.dataset.sx = String(sx);
  svg.dataset.links = String(links);
  return svg;
}

// Treppe der kumulierten Verteilung: F(k) = P(X ≤ k).
function treppe(n, p, opt = {}) {
  const breite = opt.breite || 420, hoehe = opt.hoehe || 240;
  const links = 42, rechts = 12, oben = 16, unten = 30;
  const sx = (breite - links - rechts) / (n + 1);
  const sy = hoehe - oben - unten;
  const X = (x) => links + (x + 0.5) * sx;
  const Y = (y) => hoehe - unten - y * sy;
  const svg = flaeche(breite, hoehe);
  for (let y = 0; y <= 1.0001; y += 0.2) {
    svg.appendChild(svgEl("line", { x1: links, x2: breite - rechts, y1: Y(y).toFixed(2), y2: Y(y).toFixed(2), class: "bk-gitterlinie", "data-wert": num(y, 1).replace(",", ".") }));
    svg.appendChild(svgText(links - 6, Y(y) + 4, num(y, 1), { class: "bk-achsentext", "text-anchor": "end" }));
  }
  if (opt.schranke !== undefined) {
    svg.appendChild(svgEl("line", { x1: links, x2: breite - rechts, y1: Y(opt.schranke).toFixed(2), y2: Y(opt.schranke).toFixed(2), class: "bk-schranke" }));
  }
  let d = `M ${X(-0.5).toFixed(2)} ${Y(0).toFixed(2)}`;
  for (let k = 0; k <= n; k++) {
    const f = F(n, p, k);
    d += ` L ${X(k - 0.5).toFixed(2)} ${Y(k === 0 ? 0 : F(n, p, k - 1)).toFixed(2)} L ${X(k - 0.5).toFixed(2)} ${Y(f).toFixed(2)} L ${X(k + 0.5).toFixed(2)} ${Y(f).toFixed(2)}`;
  }
  svg.appendChild(svgEl("path", { d, class: "bk-treppe" }));
  for (let k = 0; k <= n; k++) {
    const aktiv = opt.aktiv && opt.aktiv.includes(k);
    svg.appendChild(svgEl("circle", { cx: X(k).toFixed(2), cy: Y(F(n, p, k)).toFixed(2), r: aktiv ? 5 : 2.6, class: "bk-treppe-punkt" + (aktiv ? " aktiv" : ""), "data-k": String(k) }));
  }
  svg.appendChild(svgEl("line", { x1: links, x2: breite - rechts, y1: Y(0), y2: Y(0), class: "bk-achse" }));
  svg.appendChild(svgEl("line", { x1: links, x2: links, y1: oben - 6, y2: Y(0), class: "bk-achse" }));
  const jede = n <= 20 ? (n <= 12 ? 1 : 2) : 5;
  for (let k = 0; k <= n; k += jede) svg.appendChild(svgText(X(k), hoehe - unten + 14, num(k), { class: "bk-achsentext" }));
  svg.appendChild(svgText(breite - rechts, hoehe - 3, "k", { class: "bk-achsentext", "text-anchor": "end" }));
  svg.appendChild(svgText(links + 4, oben - 4, "F(n; p; k) = P(X ≤ k)", { class: "bk-achsentext", "text-anchor": "start" }));
  return svg;
}

// ================= 1. Zufallsgröße und Wahrscheinlichkeitsverteilung =================

const ZG_ARTEN = {
  summe: { name: "Augensumme", wert: (a, b) => a + b, min: 2, max: 12 },
  differenz: { name: "Betrag der Differenz", wert: (a, b) => Math.abs(a - b), min: 0, max: 5 },
  maximum: { name: "größere Augenzahl", wert: (a, b) => Math.max(a, b), min: 1, max: 6 },
  sechsen: { name: "Anzahl der Sechsen", wert: (a, b) => (a === 6) + (b === 6), min: 0, max: 2 },
};
const REL = {
  eq: { zeichen: "=", passt: (v, x) => v === x },
  le: { zeichen: "≤", passt: (v, x) => v <= x },
  lt: { zeichen: "<", passt: (v, x) => v < x },
  ge: { zeichen: "≥", passt: (v, x) => v >= x },
  gt: { zeichen: ">", passt: (v, x) => v > x },
};
let zgLetzteArt = null;

function renderZufallsgroesse() {
  const artKey = document.getElementById("zg-art").value;
  const art = ZG_ARTEN[artKey];
  const relKey = document.getElementById("zg-rel").value;
  const rel = REL[relKey];
  const regler = document.getElementById("zg-x");
  // Beim Wechsel der Zufallsgröße wandert der Regler mit ihrem Wertebereich; ein x außerhalb
  // davon wird auf die nächste Grenze gesetzt und in den Regler zurückgeschrieben.
  if (zgLetzteArt !== artKey) {
    regler.min = String(art.min);
    regler.max = String(art.max);
    zgLetzteArt = artKey;
  }
  const x = begrenzt("zg-x", reglerZahl("zg-x"), art.min, art.max);
  setzeAnzeige("zg-x-anzeige", num(x));

  // Anzahl der Ergebnisse je Wert — gezählt, nicht per Formel.
  const anzahl = new Map();
  for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) {
    const v = art.wert(a, b);
    anzahl.set(v, (anzahl.get(v) || 0) + 1);
  }
  const werte = [...anzahl.keys()].sort((u, v) => u - v);

  // Das Gitter der 36 Ergebnisse
  const zelle = 34, rand = 30;
  const g = flaeche(rand + 6 * zelle + 8, rand + 6 * zelle + 8);
  for (let i = 1; i <= 6; i++) {
    g.appendChild(svgText(rand + (i - 0.5) * zelle, 18, String(i), { class: "bk-kopftext" }));
    g.appendChild(svgText(14, rand + (i - 0.5) * zelle + 4, String(i), { class: "bk-kopftext" }));
  }
  let treffer = 0;
  for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) {
    const v = art.wert(a, b);
    const drin = rel.passt(v, x);
    if (drin) treffer++;
    g.appendChild(svgEl("rect", { x: rand + (b - 1) * zelle, y: rand + (a - 1) * zelle, width: zelle - 2, height: zelle - 2, rx: 4, class: "bk-zelle" + (drin ? " aktiv" : ""), "data-a": a, "data-b": b, "data-wert": v }));
    g.appendChild(svgText(rand + (b - 0.5) * zelle - 1, rand + (a - 0.5) * zelle + 3, String(v), { class: "bk-zelltext" }));
  }
  zeige("zg-gitter", g);

  const daten = werte.map((v) => ({ x: v, p: anzahl.get(v) / 36 }));
  zeige("zg-histo", histogramm(daten, { breite: 330, hoehe: 240, klasse: (v) => (rel.passt(v, x) ? "aktiv" : ""), xName: "x", yName: "P(X = x)" }));

  // Verteilungstabelle
  const tab = el("table", { class: "bk-tabelle" });
  tab.appendChild(el("tr", {}, [el("th", { html: "x<sub>i</sub>" }), ...werte.map((v) => el("td", { class: rel.passt(v, x) ? "aktiv" : "" }, num(v)))]));
  tab.appendChild(el("tr", {}, [el("th", { html: "P(X = x<sub>i</sub>)" }), ...werte.map((v) => el("td", { class: rel.passt(v, x) ? "aktiv" : "", html: bruch(anzahl.get(v), 36) }))]));
  zeige("zg-tabelle", tab);

  const im = werte.filter((v) => rel.passt(v, x));
  const P = treffer / 36;
  const summanden = im.map((v) => `P(X = ${num(v)})`).join(" + ");
  const brueche = im.map((v) => bruch(anzahl.get(v), 36)).join(" + ");
  let zeile;
  if (!im.length) {
    zeile = `<span class="wa">P(X ${rel.zeichen} ${num(x)}) = 0</span> — kein Ergebnis hat einen solchen Wert: ein unmögliches Ereignis.`;
  } else if (im.length === 1) {
    zeile = `<span class="wa">P(X ${rel.zeichen} ${num(x)}) = ${bruchGekuerzt(treffer, 36)} ${zeichen(P)} ${num(P)}</span>`;
  } else {
    zeile = `<span class="wa">P(X ${rel.zeichen} ${num(x)})</span> = ${summanden} = ${brueche} = <span class="wa">${bruchGekuerzt(treffer, 36)} ${zeichen(P)} ${num(P)}</span>`;
  }
  document.getElementById("zg-bilanz").innerHTML =
    `X = ${art.name}. Werte: ${werte.map((v) => num(v)).join("; ")}.<br>` +
    zeile + `<br>` +
    `Kontrolle: Alle Werte zusammen: ${werte.map((v) => anzahl.get(v)).join(" + ")} = 36 Ergebnisse, also <span class="wc">Summe aller P(X = x<sub>i</sub>) = ${bruch(36, 36)} = 1</span>.`;

  setzeAnzeige("zg-text",
    `${treffer} der 36 gleich wahrscheinlichen Ergebnisse gehören zum Ereignis „X ${rel.zeichen} ${num(x)}“ — sie sind im Gitter grün markiert. ` +
    (relKey === "eq" ? "Mehrere Ergebnisse haben denselben Wert; deshalb ist die Verteilung nicht gleichmäßig, obwohl jedes einzelne Ergebnis gleich wahrscheinlich ist."
      : "Für „höchstens“, „mindestens“ und ähnliche Ereignisse werden die Wahrscheinlichkeiten mehrerer Werte addiert — im Histogramm sind es mehrere Säulen."));
}

// ================= 2. Erwartungswert, Varianz, Standardabweichung =================

function renderErwartungswert() {
  const rot = reglerZahl("ew-rot");
  const weiss = begrenzt("ew-weiss", reglerZahl("ew-weiss"), 0, 8 - rot);
  const schwarz = 8 - rot - weiss;
  const aw = reglerZahl("ew-aw"), as = reglerZahl("ew-as"), einsatz = reglerZahl("ew-einsatz");
  setzeAnzeige("ew-rot-anzeige", num(rot));
  setzeAnzeige("ew-weiss-anzeige", num(weiss));
  setzeAnzeige("ew-schwarz-anzeige", `schwarz: ${schwarz}`);
  setzeAnzeige("ew-aw-anzeige", euro(aw));
  setzeAnzeige("ew-as-anzeige", euro(as));
  setzeAnzeige("ew-einsatz-anzeige", euro(einsatz));

  // Das Glücksrad
  const R = 90, M = { x: 110, y: 110 };
  const rad = flaeche(220, 230);
  const farben = [...Array(rot).fill("rot"), ...Array(weiss).fill("weiss"), ...Array(schwarz).fill("schwarz")];
  farben.forEach((f, i) => {
    const w1 = (i / 8) * 2 * Math.PI - Math.PI / 2, w2 = ((i + 1) / 8) * 2 * Math.PI - Math.PI / 2;
    const p1 = { x: M.x + R * Math.cos(w1), y: M.y + R * Math.sin(w1) };
    const p2 = { x: M.x + R * Math.cos(w2), y: M.y + R * Math.sin(w2) };
    rad.appendChild(svgEl("path", { d: `M ${M.x} ${M.y} L ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} A ${R} ${R} 0 0 1 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)} Z`, class: "bk-sektor " + f, "data-farbe": f }));
  });
  rad.appendChild(svgEl("polygon", { points: `${M.x - 7},${M.y - R - 12} ${M.x + 7},${M.y - R - 12} ${M.x},${M.y - R + 6}`, class: "bk-zeiger" }));
  rad.appendChild(svgText(M.x, 226, "jeder Sektor: Wahrscheinlichkeit 1 : 8", { class: "bk-achsentext" }));
  zeige("ew-rad", rad);

  // Verteilung der Auszahlung: gleiche Beträge werden zusammengefasst.
  const teile = [];
  const addiere = (x, anzahl) => {
    if (!anzahl) return;
    const t = teile.find((u) => Math.abs(u.x - x) < 1e-9);
    if (t) t.anzahl += anzahl; else teile.push({ x, anzahl });
  };
  addiere(0, rot); addiere(aw, weiss); addiere(as, schwarz);
  teile.sort((u, v) => u.x - v.x);
  const mu = teile.reduce((s, t) => s + t.x * t.anzahl / 8, 0);
  const V = teile.reduce((s, t) => s + (t.x - mu) ** 2 * t.anzahl / 8, 0);
  const sigma = Math.sqrt(V);

  // Die Waage: Gewichte (Kreise, Fläche ∝ Wahrscheinlichkeit) auf einem Balken, der genau
  // unter μ unterstützt wird — dort ist er im Gleichgewicht.
  const breite = 330, hoehe = 250, links = 30, rechts = 30;
  const xmax = Math.max(as, aw, einsatz, 1) * 1.05;
  const X = (x) => links + (x / xmax) * (breite - links - rechts);
  const yBalken = 150;
  const w = flaeche(breite, hoehe);
  w.appendChild(svgEl("rect", { x: X(0) - 6, y: yBalken, width: X(xmax) - X(0) + 12, height: 7, rx: 3, class: "bk-balken" }));
  // Unter dem Balken drei Zeilen übereinander — Drehpunkt mit μ, darunter das σ-Band. Nebeneinander
  // lagen Beschriftung und Band übereinander.
  if (sigma > 0) {
    w.appendChild(svgEl("rect", { x: X(Math.max(0, mu - sigma)).toFixed(2), y: yBalken + 50, width: (X(mu + sigma) - X(Math.max(0, mu - sigma))).toFixed(2), height: 10, class: "bk-sigma" }));
    w.appendChild(svgText(X(mu), yBalken + 74, "μ − σ bis μ + σ", { class: "bk-sigma-text" }));
  }
  // Die Gewichte: Fläche ∝ Wahrscheinlichkeit. Der Beschriftungsabstand wächst mit dem Radius,
  // damit „0,50 €“ nicht an der Einsatzlinie klebt.
  teile.forEach((t, i) => {
    const r = 4 + 17 * Math.sqrt(t.anzahl / 8);
    w.appendChild(svgEl("circle", { cx: X(t.x).toFixed(2), cy: (yBalken - r).toFixed(2), r: r.toFixed(2), class: "bk-saeule aktiv", "data-x": String(t.x), "data-p": String(t.anzahl / 8) }));
    // Liegt ein Gewicht genau unter der Einsatzlinie, rückt seine Beschriftung neben die Linie.
    const aufLinie = Math.abs(X(t.x) - X(einsatz)) < 20;
    w.appendChild(svgText(X(t.x) + (aufLinie ? 22 : 0), yBalken - 2 * r - 6 - (i % 2) * 13, euro(t.x), { class: "bk-achsentext", "text-anchor": aufLinie ? "start" : "middle" }));
  });
  w.appendChild(svgEl("polygon", { points: `${X(mu).toFixed(2)},${yBalken + 7} ${(X(mu) - 11).toFixed(2)},${yBalken + 28} ${(X(mu) + 11).toFixed(2)},${yBalken + 28}`, class: "bk-drehpunkt", "data-mu": String(mu) }));
  w.appendChild(svgText(X(mu), yBalken + 42, `μ ${zeichen(mu, 2)} ${euro(mu)}`, { class: "bk-mu-text" }));
  w.appendChild(svgEl("line", { x1: X(einsatz).toFixed(2), x2: X(einsatz).toFixed(2), y1: 22, y2: yBalken - 2, class: "bk-schranke", "data-einsatz": String(einsatz) }));
  w.appendChild(svgText(X(einsatz), 14, "Einsatz " + euro(einsatz), { class: "bk-sigma-text" }));
  zeige("ew-waage", w);

  const summanden = teile.map((t) => `${euro(t.x)} · ${bruch(t.anzahl, 8)}`).join(" + ");
  const vsum = teile.map((t) => `(${num(t.x, 2)} − ${num(mu)})² · ${bruch(t.anzahl, 8)}`).join(" + ");
  const bilanz = mu - einsatz;
  const fair = Math.abs(bilanz) < 1e-9;
  document.getElementById("ew-bilanz").innerHTML =
    `Verteilung der Auszahlung X: ${teile.map((t) => `P(X = ${euro(t.x)}) = ${bruch(t.anzahl, 8)}`).join(", &nbsp;")}<br>` +
    `<span class="wr">μ = E(X)</span> = ${summanden} <span class="wr">${zeichen(mu)} ${num(mu)} €</span><br>` +
    `Bilanz pro Spiel für den Spieler: E(X) − Einsatz = ${num(mu)} € − ${euro(einsatz)} ${zeichen(bilanz)} <span class="${fair ? "wa" : "wg"}">${num(bilanz)} €</span> — ${fair ? "das Spiel ist <strong>fair</strong>." : bilanz < 0 ? "auf Dauer <strong>verliert der Spieler</strong>." : "auf Dauer <strong>verliert der Betreiber</strong>."}<br>` +
    `V(X) = ${vsum} ${zeichen(V)} ${num(V)} (€²) &nbsp;&nbsp; <span class="wg">σ = √V(X) ${zeichen(sigma)} ${num(sigma)} €</span>`;

  setzeAnzeige("ew-text",
    fair ? `Einsatz und Erwartungswert sind gleich: Auf lange Sicht zahlt der Spieler genau so viel ein, wie er herausbekommt. Die Waage steht mit dem Drehpunkt genau unter der Einsatzlinie.`
      : `Die Waage ist nur im Gleichgewicht, wenn der Drehpunkt unter μ = ${num(mu)} € steht. Der Einsatz (rote Linie) liegt ${bilanz < 0 ? "rechts" : "links"} davon — pro Spiel ${bilanz < 0 ? "verliert der Spieler" : "gewinnt der Spieler"} im Mittel ${num(Math.abs(bilanz))} €. Fair wäre ein Einsatz von ${num(mu)} €.`);
}

// ================= 3. Bernoulli-Kette am Baumdiagramm =================

// p als exakte Angabe: Brüche bleiben Brüche, damit die Bilanz „(1/6)² · (5/6)²“ schreiben kann.
function pAus(wert) {
  if (wert.includes("/")) {
    const [z, n] = wert.split("/").map(Number);
    return { wert: z / n, text: bruch(z, n), textQ: bruch(n - z, n), klar: `${z}/${n}` };
  }
  const p = Number(wert);
  return { wert: p, text: num(p, 2), textQ: num(1 - p, 2), klar: num(p, 2) };
}

function renderBernoulliKette() {
  const n = reglerZahl("bk-n");
  const k = begrenzt("bk-k", reglerZahl("bk-k"), 0, n);
  document.getElementById("bk-k").max = String(n);
  const p = pAus(document.getElementById("bk-p").value);
  setzeAnzeige("bk-n-anzeige", num(n));
  setzeAnzeige("bk-k-anzeige", num(k));

  const blattzahl = Math.pow(2, n);
  const dy = 22, dx = 110, x0 = 30, y0 = 24;
  const breite = x0 + n * dx + 150, hoehe = y0 + blattzahl * dy + 10;
  const svg = flaeche(breite, hoehe);
  const woerter = [];
  // Rekursiv: jeder Knoten verzweigt in Treffer (oben) und Niete (unten).
  function knoten(wort, tiefe, yOben, yUnten) {
    const y = (yOben + yUnten) / 2;
    const x = x0 + tiefe * dx;
    if (tiefe === n) {
      const t = [...wort].filter((c) => c === "T").length;
      const aktiv = t === k;
      woerter.push({ wort, aktiv, y });
      svg.appendChild(svgText(x + 12, y + 4, wort, { class: "bk-blatt" + (aktiv ? " aktiv" : ""), "text-anchor": "start", "data-wort": wort }));
      return { x, y };
    }
    const mitte = (yOben + yUnten) / 2;
    for (const [c, a, b] of [["T", yOben, mitte], ["N", mitte, yUnten]]) {
      const ziel = { x: x + dx, y: (a + b) / 2 };
      const restT = [...wort + c].filter((z) => z === "T").length;
      const restN = [...wort + c].filter((z) => z === "N").length;
      // Ein Ast liegt auf einem aktiven Pfad, wenn sich die verbleibenden Treffer noch ausgehen.
      const moeglich = restT <= k && restN <= n - k;
      svg.appendChild(svgEl("line", { x1: x, y1: y, x2: ziel.x, y2: ziel.y, class: "bk-ast " + (c === "T" ? "treffer" : "niete") + (moeglich ? " aktiv" : "") }));
      if (tiefe === 0 || n <= 2) {
        // Über dem oberen Ast, unter dem unteren — und nach innen gerückt, weil die Äste schräg
        // verlaufen und die Beschriftung sonst genau auf der Linie säße.
        svg.appendChild(svgText((x + ziel.x) / 2 - 16, (y + ziel.y) / 2 + (c === "T" ? -9 : 19), c === "T" ? `p = ${p.klar}` : "1 − p", { class: "bk-achsentext" }));
      }
      knoten(wort + c, tiefe + 1, a, b);
    }
    svg.appendChild(svgEl("circle", { cx: x, cy: y, r: 4, class: "bk-knoten" }));
    return { x, y };
  }
  knoten("", 0, y0, y0 + blattzahl * dy);
  for (let t = 1; t <= n; t++) svg.appendChild(svgText(x0 + t * dx - dx / 2, 14, `${t}. Versuch`, { class: "bk-achsentext" }));
  zeige("bk-mount", svg);

  const aktive = woerter.filter((w) => w.aktiv).map((w) => w.wort);
  const m = aktive.length;
  const pfad = Math.pow(p.wert, k) * Math.pow(1 - p.wert, n - k);
  const P = m * pfad;
  document.getElementById("bk-bilanz").innerHTML =
    `Pfade mit genau <span class="wa">k = ${k}</span> Treffern (grün): ${aktive.join(", ")} — das sind <span class="wa">${m}</span>.<br>` +
    `Jeder dieser Pfade enthält ${k}-mal p und ${n - k}-mal 1 − p. Produktregel: <span class="wb">(${p.text})<sup>${k}</sup> · (${p.textQ})<sup>${n - k}</sup> ${zeichen(pfad, 6)} ${num(pfad, 6)}</span><br>` +
    `Summenregel: <span class="wa">P(X = ${k}) = ${m} · ${num(pfad, 6)} ${zeichen(P)} ${num(P)}</span>`;
  setzeAnzeige("bk-text",
    `Alle ${m} grünen Pfade haben dieselbe Wahrscheinlichkeit — es kommt nur darauf an, WIE VIELE Treffer auf dem Pfad liegen, nicht WO. ` +
    `Offen bleibt nur, wie man die Zahl ${m} bestimmt, ohne den Baum zu zeichnen: Bei n = 20 hätte er über eine Million Blätter. Das klärt der nächste Abschnitt.`);
}

// ================= 4. Der Binomialkoeffizient =================

function fakultaet(n) {
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}
function alleWoerter(n, k) {
  const out = [];
  (function bau(w, t) {
    if (w.length === n) { if (t === k) out.push(w); return; }
    if (t < k) bau(w + "T", t + 1);
    if (w.length - t < n - k) bau(w + "N", t);
  })("", 0);
  return out;
}

function renderBinomialkoeffizient() {
  const n = reglerZahl("ko-n");
  const k = begrenzt("ko-k", reglerZahl("ko-k"), 0, n);
  document.getElementById("ko-k").max = String(n);
  setzeAnzeige("ko-n-anzeige", num(n));
  setzeAnzeige("ko-k-anzeige", num(k));

  // Pascal'sches Dreieck bis Zeile 10
  const zeilen = 10, zb = 42, zh = 26;
  const breite = (zeilen + 1) * zb + 20, hoehe = (zeilen + 1) * zh + 20;
  const svg = flaeche(breite, hoehe);
  for (let z = 0; z <= zeilen; z++) {
    for (let s = 0; s <= z; s++) {
      const cx = breite / 2 + (s - z / 2) * zb;
      const cy = 14 + z * zh + zh / 2;
      const aktiv = z === n && s === k;
      const eltern = z === n - 1 && (s === k - 1 || s === k);
      svg.appendChild(svgEl("rect", { x: (cx - zb / 2 + 2).toFixed(2), y: (cy - zh / 2 + 2).toFixed(2), width: zb - 4, height: zh - 4, rx: 6, class: "bk-pascal" + (aktiv ? " aktiv" : eltern ? " eltern" : ""), "data-n": z, "data-k": s }));
      svg.appendChild(svgText(cx, cy + 4, num(binom(z, s)), { class: "bk-pascaltext" }));
    }
  }
  zeige("ko-pascal", svg);

  const c = binom(n, k);
  const box = document.getElementById("ko-woerter");
  box.innerHTML = "";
  if (c <= 70) {
    alleWoerter(n, k).forEach((w) => box.appendChild(el("span", { class: "bk-wort", html: [...w].map((z) => `<span class="${z === "T" ? "t" : "n"}">${z}</span>`).join("") })));
    box.appendChild(el("p", { class: "bk-woerter-hinweis" }, `${c} ${c === 1 ? "Wort" : "Wörter"} aus ${k}-mal T und ${n - k}-mal N — jedes ist ein Pfad mit genau ${k} Treffern.`));
  } else {
    box.appendChild(el("p", { class: "bk-woerter-hinweis" }, `${num(c)} Wörter — zu viele zum Aufschreiben. Genau dafür gibt es die Formel.`));
  }

  const zaehler = [];
  for (let i = 0; i < k; i++) zaehler.push(n - i);
  const produkt = k === 0 ? "1" : bruch(zaehler.join(" · "), k === 1 ? "1" : Array.from({ length: k }, (_, i) => k - i).join(" · "));
  const eltern = n >= 1 && k >= 1 && k <= n - 1
    ? `Pascal-Regel (orange): ${binomHtml(n - 1, k - 1)} + ${binomHtml(n - 1, k)} = ${num(binom(n - 1, k - 1))} + ${num(binom(n - 1, k))} = <span class="wa">${num(c)}</span><br>`
    : `Am Rand des Dreiecks steht immer 1: Es gibt genau einen Pfad ${k === 0 ? "ohne Treffer" : "nur aus Treffern"}.<br>`;
  document.getElementById("ko-bilanz").innerHTML =
    `<span class="wa">${binomHtml(n, k, "gross")}</span> = ${bruch(`${n}!`, `${k}! · ${n - k}!`)} = ${bruch(num(fakultaet(n)), `${num(fakultaet(k))} · ${num(fakultaet(n - k))}`)} = ${produkt} = <span class="wa">${num(c)}</span><br>` +
    eltern +
    `Symmetrie: ${binomHtml(n, n - k)} = ${num(binom(n, n - k))} — ${k} Trefferplätze auszuwählen ist dasselbe wie ${n - k} Nietenplätze auszuwählen.`;
  setzeAnzeige("ko-text",
    `Das grüne Feld im Dreieck ist ${num(c)}, die Zahl der Pfade mit ${k} Treffern bei ${n} Versuchen. Die beiden orangen Felder darüber zählen die Pfade, die mit einem Treffer bzw. mit einer Niete enden.`);
}

// ================= 5. Die Formel von Bernoulli =================

function renderFormel() {
  const n = reglerZahl("bf-n");
  const p = reglerP("bf-p");
  const k = begrenzt("bf-k", reglerZahl("bf-k"), 0, n);
  document.getElementById("bf-k").max = String(n);
  setzeAnzeige("bf-n-anzeige", num(n));
  setzeAnzeige("bf-p-anzeige", num(p, 2));
  setzeAnzeige("bf-k-anzeige", num(k));

  const c = binom(n, k), a = Math.pow(p, k), b = Math.pow(1 - p, n - k), P = c * a * b;
  const faktoren = document.getElementById("bf-faktoren");
  faktoren.innerHTML =
    `<div class="bk-faktor"><span class="was">Anzahl der Pfade</span><span class="wert">${binomHtml(n, k)} = ${num(c)}</span></div>` +
    `<div class="bk-faktor mal">·</div>` +
    `<div class="bk-faktor"><span class="was">${k}-mal Treffer</span><span class="wert farbe-gruen">${num(p, 2)}<sup>${k}</sup> ${zeichen(a, 6)} ${num(a, 6)}</span></div>` +
    `<div class="bk-faktor mal">·</div>` +
    `<div class="bk-faktor"><span class="was">${n - k}-mal Niete</span><span class="wert farbe-orange">${num(1 - p, 2)}<sup>${n - k}</sup> ${zeichen(b, 6)} ${num(b, 6)}</span></div>` +
    `<div class="bk-faktor mal">=</div>` +
    `<div class="bk-faktor"><span class="was">P(X = ${k})</span><span class="wert">${zeichen(P)} ${num(P)}</span></div>`;

  zeige("bf-mount", histogramm(verteilung(n, p), { klasse: (x) => (x === k ? "aktiv" : ""), breite: 560, hoehe: 230 }));

  const spiegel = p > 0.5
    ? `<br>Mit der Tabelle (p &gt; 0,5, blaue Eingänge): B(${n}; ${num(p, 2)}; ${k}) = B(${n}; ${num(1 - p, 2)}; ${n - k}) ${zeichen(B(n, 1 - p, n - k))} ${num(B(n, 1 - p, n - k))} — ${k} Treffer sind ${n - k} Nieten.`
    : "";
  document.getElementById("bf-bilanz").innerHTML =
    `<span class="wa">P(X = ${k}) = B(${n}; ${num(p, 2)}; ${k})</span> = ${binomHtml(n, k)} · ${num(p, 2)}<sup>${k}</sup> · ${num(1 - p, 2)}<sup>${n - k}</sup> ` +
    `= ${num(c)} · ${num(a, 6)} · ${num(b, 6)} <span class="wa">${zeichen(P)} ${num(P)}</span>` +
    `<br><span class="progress-note">In Fundamente: B<sub>${n};${num(p, 2)}</sub>(${k}) ${zeichen(P)} ${num(P)}.</span>` + spiegel;
  setzeAnzeige("bf-text",
    P < 0.0001 ? `Bei ${k} Treffern ist die Säule so niedrig, dass man sie kaum sieht: P(X = ${k}) ist kleiner als 0,0001. Der Binomialkoeffizient ist ${c > 1 ? "zwar groß, aber" : ""} die Pfadwahrscheinlichkeit winzig.`
      : `Die grüne Säule im Histogramm hat die Höhe ${num(P)}. Zieh an k: Der Binomialkoeffizient wächst bis zur Mitte und fällt dann wieder, die Potenz von p wird mit jedem Treffer kleiner, die von 1 − p mit jeder Niete weniger größer — ihr Produkt hat irgendwo ein Maximum.`);
}

// ================= 6. Die Binomialverteilung =================

function renderVerteilung() {
  const n = reglerZahl("hv-n");
  const p = reglerP("hv-p");
  const spiegel = document.getElementById("hv-spiegel").checked;
  setzeAnzeige("hv-n-anzeige", num(n));
  setzeAnzeige("hv-p-anzeige", num(p, 2));
  const d = verteilung(n, p);
  const pmax = Math.max(...d.map((u) => u.p));
  const modal = d.filter((u) => Math.abs(u.p - pmax) < 1e-12).map((u) => u.x);
  zeige("hv-mount", histogramm(d, { klasse: (x) => (modal.includes(x) ? "aktiv" : ""), vergleich: spiegel ? verteilung(n, 1 - p) : undefined, mu: n * p }));
  const summe = d.reduce((s, u) => s + u.p, 0);
  // Bigalke/Köhler: „linkslastig“ für p < 0,5. Nicht „linksschief“ — in der Statistik heißt eine
  // Verteilung mit dem Maximum links gerade RECHTSschief (der lange Ausläufer zeigt nach rechts).
  const gestalt = Math.abs(p - 0.5) < 1e-9 ? "symmetrisch zu k = " + num(n / 2) : p < 0.5 ? "linkslastig (hohe Säulen links)" : "rechtslastig (hohe Säulen rechts)";
  document.getElementById("hv-bilanz").innerHTML =
    `Höchste Säule (grün) bei <span class="wa">k = ${modal.map((x) => num(x)).join(" und ")}</span> mit B(${n}; ${num(p, 2)}; ${num(modal[0])}) ${zeichen(pmax)} ${num(pmax)}. ` +
    `Erwartungswert (violett) <span class="wr">μ = n · p = ${n} · ${num(p, 2)} = ${num(n * p)}</span>.<br>` +
    `Gestalt: ${gestalt}. Kontrolle: Summe aller ${n + 1} Säulen = ${num(summe, 6)}.` +
    (spiegel ? `<br><span class="wb">Orange gestrichelt: B(${n}; ${num(1 - p, 2)}; k)</span> — das Spiegelbild, denn B(${n}; ${num(p, 2)}; k) = B(${n}; ${num(1 - p, 2)}; ${n} − k).` : "");
  setzeAnzeige("hv-text",
    n >= 30 ? `Bei n = ${n} ist die Verteilung schon fast glockenförmig und viel breiter als bei kleinem n — jede einzelne Trefferzahl ist dafür unwahrscheinlicher: Die höchste Säule ist nur noch ${num(pmax)} hoch.`
      : `Zieh an n: Die Verteilung wandert mit μ = n · p nach rechts und wird dabei flacher und breiter. Zieh an p: Die höchste Säule folgt dem Wert n · p.`);
}

// ================= 7. Kumulierte Wahrscheinlichkeiten =================

function Fbk(n, p, k) {
  return `F(${n}; ${num(p, 2)}; ${k})`;
}
function Ffu(n, p, k) {
  return `F<sub>${n};${num(p, 2)}</sub>(${k})`;
}

function renderKumuliert() {
  const n = reglerZahl("ku-n");
  const p = reglerP("ku-p");
  const art = document.getElementById("ku-art").value;
  document.getElementById("ku-a").max = String(n);
  document.getElementById("ku-b").max = String(n);
  const a = begrenzt("ku-a", reglerZahl("ku-a"), 0, n);
  const b = art === "zw" ? begrenzt("ku-b", reglerZahl("ku-b"), a, n) : begrenzt("ku-b", reglerZahl("ku-b"), 0, n);
  document.getElementById("ku-b").closest("label").style.display = art === "zw" ? "" : "none";
  setzeAnzeige("ku-n-anzeige", num(n));
  setzeAnzeige("ku-p-anzeige", num(p, 2));
  setzeAnzeige("ku-a-anzeige", num(a));
  setzeAnzeige("ku-b-anzeige", num(b));

  // Welche Trefferzahlen gehören zum Ereignis, und über welchen F-Wert rechnet man es?
  const drin = (k) => art === "le" ? k <= a : art === "lt" ? k < a : art === "ge" ? k >= a : art === "gt" ? k > a : k >= a && k <= b;
  const gegen = art === "ge" || art === "gt";
  const P = verteilung(n, p).filter((u) => drin(u.x)).reduce((s, u) => s + u.p, 0);
  let schreib, rechnung, aktiv;
  if (art === "le") {
    schreib = `P(X ≤ ${a})`; aktiv = [a];
    rechnung = `${Fbk(n, p, a)} ${zeichen(F(n, p, a))} ${num(F(n, p, a))}`;
  } else if (art === "lt") {
    schreib = `P(X &lt; ${a}) = P(X ≤ ${a - 1})`; aktiv = [a - 1];
    rechnung = a === 0 ? "0 — weniger als 0 Treffer gibt es nicht" : `${Fbk(n, p, a - 1)} ${zeichen(F(n, p, a - 1))} ${num(F(n, p, a - 1))}`;
  } else if (art === "ge") {
    schreib = `P(X ≥ ${a}) = 1 − P(X ≤ ${a - 1})`; aktiv = [a - 1];
    rechnung = a === 0 ? "1 − 0 = 1 — mindestens 0 Treffer gibt es immer" : `1 − ${Fbk(n, p, a - 1)} ${zeichen(F(n, p, a - 1))} 1 − ${num(F(n, p, a - 1))} = ${num(1 - F(n, p, a - 1))}`;
  } else if (art === "gt") {
    schreib = `P(X &gt; ${a}) = 1 − P(X ≤ ${a})`; aktiv = [a];
    rechnung = `1 − ${Fbk(n, p, a)} ${zeichen(F(n, p, a))} 1 − ${num(F(n, p, a))} = ${num(1 - F(n, p, a))}`;
  } else {
    schreib = `P(${a} ≤ X ≤ ${b}) = P(X ≤ ${b}) − P(X ≤ ${a - 1})`; aktiv = [b, a - 1];
    rechnung = a === 0 ? `${Fbk(n, p, b)} − 0 ${zeichen(F(n, p, b))} ${num(F(n, p, b))}`
      : `${Fbk(n, p, b)} − ${Fbk(n, p, a - 1)} ${zeichen(F(n, p, b))} ${num(F(n, p, b))} − ${num(F(n, p, a - 1))} = ${num(F(n, p, b) - F(n, p, a - 1))}`;
  }
  aktiv = aktiv.filter((k) => k >= 0);

  zeige("ku-histo", histogramm(verteilung(n, p), { breite: 380, hoehe: 240, klasse: (k) => (drin(k) ? "aktiv" : gegen ? "gegen" : "") }));
  zeige("ku-treppe", treppe(n, p, { aktiv, breite: 380, hoehe: 240 }));

  const fu = art === "le" ? Ffu(n, p, a) : art === "lt" ? Ffu(n, p, a - 1) : art === "ge" ? `1 − ${Ffu(n, p, a - 1)}` : art === "gt" ? `1 − ${Ffu(n, p, a)}` : `${Ffu(n, p, b)} − ${Ffu(n, p, a - 1)}`;
  const tabelle = p > 0.5 && aktiv.length
    ? `<br>Tabellenweg für p &gt; 0,5: ${aktiv.map((k) => `${Fbk(n, p, k)} = 1 − ${Fbk(n, 1 - p, n - k - 1)} ${zeichen(F(n, p, k))} 1 − ${num(F(n, 1 - p, n - k - 1))}`).join("; ")}.`
    : "";
  document.getElementById("ku-bilanz").innerHTML =
    `<span class="wa">${schreib}</span> = ${rechnung}<br>` +
    `<span class="progress-note">In Fundamente: ${art === "ge" && a === 0 ? "1" : fu}.</span><br>` +
    `Kontrolle über die einzelnen Säulen: Summe der grünen Säulen <span class="wa">${zeichen(P)} ${num(P)}</span>.` + tabelle;
  setzeAnzeige("ku-text",
    gegen ? `„Mindestens“ und „mehr als“ rechnet man über das Gegenereignis: Die orangen Säulen links werden von 1 abgezogen. Die Treppe rechts zeigt den F-Wert, der dafür gebraucht wird (grüner Punkt) — bei „mindestens ${a}“ ist es F bei ${a - 1}, eins weniger.`
      : art === "zw" ? `Für „zwischen“ zieht man zwei Werte der Treppe voneinander ab: alles bis ${b} minus alles bis ${a - 1}. Die untere Grenze ${a} selbst gehört noch dazu, deshalb wird bei ${a - 1} abgezogen.`
        : `„Höchstens“ ist genau ein Punkt der Treppe (grün): die Summe aller Säulen bis dorthin.`);
}

// ================= 8. μ und σ der Binomialverteilung =================

function renderKenngroessen() {
  const n = reglerZahl("kg-n");
  const p = reglerP("kg-p");
  setzeAnzeige("kg-n-anzeige", num(n));
  setzeAnzeige("kg-p-anzeige", num(p, 2));
  const d = verteilung(n, p);
  // Nach der DEFINITION aus Abschnitt 2 — nicht mit den Formeln, die hier bestätigt werden sollen.
  const muDef = d.reduce((s, u) => s + u.x * u.p, 0);
  const vDef = d.reduce((s, u) => s + (u.x - muDef) ** 2 * u.p, 0);
  const mu = n * p, V = n * p * (1 - p), sigma = Math.sqrt(V);
  const band = d.filter((u) => u.x >= mu - sigma - 1e-9 && u.x <= mu + sigma + 1e-9);
  const imBand = band.reduce((s, u) => s + u.p, 0);
  const ganz = band.map((u) => u.x);
  zeige("kg-mount", histogramm(d, { mu, sigmaBand: [mu - sigma, mu + sigma], klasse: (x) => (ganz.includes(x) ? "aktiv" : "") }));
  document.getElementById("kg-bilanz").innerHTML =
    `Nach der Definition: <span class="wr">E(X) = 0 · B(${n}; ${num(p, 2)}; 0) + 1 · B(${n}; ${num(p, 2)}; 1) + … + ${n} · B(${n}; ${num(p, 2)}; ${n}) ${zeichen(muDef)} ${num(muDef)}</span><br>` +
    `Mit dem Satz: <span class="wr">μ = n · p = ${n} · ${num(p, 2)} = ${num(mu)}</span> — dieselbe Zahl.<br>` +
    `Nach der Definition: V(X) ${zeichen(vDef)} ${num(vDef)}; mit dem Satz: n · p · (1 − p) = ${n} · ${num(p, 2)} · ${num(1 - p, 2)} = ${num(V)}. ` +
    `<span class="wg">σ = √${num(V)} ${zeichen(sigma)} ${num(sigma)}</span><br>` +
    (ganz.length
      ? `Im Band von μ − σ ${zeichen(mu - sigma)} ${num(mu - sigma, 2)} bis μ + σ ${zeichen(mu + sigma)} ${num(mu + sigma, 2)} liegen die Trefferzahlen ${ganz[0]} bis ${ganz[ganz.length - 1]}: <span class="wa">P(${ganz[0]} ≤ X ≤ ${ganz[ganz.length - 1]}) ${zeichen(imBand)} ${num(imBand)}</span>.`
      : `Im Band von μ − σ bis μ + σ liegt hier keine ganze Trefferzahl — bei so kleinem n ist σ kleiner als der Abstand zur nächsten ganzen Zahl.`);
  setzeAnzeige("kg-text",
    `Definition und Satz liefern bei jeder Reglerstellung dieselben Werte. Das rote Band (μ ± σ) ist die typische Streuung: ${ganz.length ? `Hier fällt die Trefferzahl mit einer Wahrscheinlichkeit von ${num(imBand * 100, 1)} % hinein.` : ""} Vervierfacht man n, verdoppelt sich σ — die Verteilung wird breiter, aber langsamer als μ wächst.`);
}

// ================= 9. Parameter gesucht =================

// Kleinstes n mit 1 − (1 − p)^n ≥ α — durch Hochzählen bestimmt, nicht über den Logarithmus:
// Die Darstellung soll die Logarithmus-Rechnung bestätigen, nicht wiederholen.
function kleinstesN(p, alpha) {
  let n = 1;
  while (1 - Math.pow(1 - p, n) < alpha - 1e-12 && n < 100000) n++;
  return n;
}
function kleinstesK(n, p, alpha) {
  for (let k = 0; k <= n; k++) if (F(n, p, k) >= alpha - 1e-12) return k;
  return n;
}

function renderParameter() {
  const art = document.getElementById("pa-art").value;
  const alpha = reglerP("pa-sicher");
  const n = reglerZahl("pa-n");
  const p = reglerP("pa-p");
  setzeAnzeige("pa-sicher-anzeige", num(alpha * 100, 0) + " %");
  setzeAnzeige("pa-n-anzeige", num(n));
  setzeAnzeige("pa-p-anzeige", num(p, 2));
  document.getElementById("pa-n-label").style.display = art === "n" ? "none" : "";
  document.getElementById("pa-p-label").style.display = art === "p" ? "none" : "";

  const bilanz = document.getElementById("pa-bilanz");
  if (art === "n") {
    const nmin = kleinstesN(p, alpha);
    const log = Math.log(1 - alpha) / Math.log(1 - p);
    const bis = Math.max(nmin + 4, 8);
    const daten = [];
    for (let m = 1; m <= bis; m++) daten.push({ x: m, p: 1 - Math.pow(1 - p, m) });
    const svg = histogramm(daten, { klasse: (m) => (m === nmin ? "aktiv" : m < nmin ? "gegen" : ""), xName: "n", yName: "P(X ≥ 1) = 1 − (1 − p)ⁿ", jede: bis <= 21 ? 1 : 5 });
    schrankeEinzeichnen(svg, alpha);
    zeige("pa-mount", svg);
    bilanz.innerHTML =
      `Gesucht: kleinstes n mit <span class="wa">P(X ≥ 1) ≥ ${num(alpha, 2)}</span>, p = ${num(p, 2)}.<br>` +
      `1 − ${num(1 - p, 2)}<sup>n</sup> ≥ ${num(alpha, 2)} ⟺ ${num(1 - p, 2)}<sup>n</sup> ≤ ${num(1 - alpha, 2)} ⟺ n ≥ ${bruch(`ln ${num(1 - alpha, 2)}`, `ln ${num(1 - p, 2)}`)} ${zeichen(log)} ${num(log)} ` +
      `⟹ <span class="wa">n = ${nmin}</span><br>` +
      `Probe: n = ${nmin - 1}: ${num(1 - Math.pow(1 - p, nmin - 1))} &lt; ${num(alpha, 2)} &nbsp;&nbsp; n = ${nmin}: ${num(1 - Math.pow(1 - p, nmin))} ≥ ${num(alpha, 2)} ✓`;
    setzeAnzeige("pa-text", `Die Säulen wachsen mit n und nähern sich 1, erreichen es aber nie. Die erste Säule über der roten Linie (grün) ist das gesuchte n — ${nmin} Versuche. Das Ergebnis der Logarithmus-Rechnung, ${num(log)}, wird immer aufgerundet.`);
  } else if (art === "k") {
    const k = kleinstesK(n, p, alpha);
    const svg = treppe(n, p, { aktiv: [k], schranke: alpha, breite: 560, hoehe: 250 });
    zeige("pa-mount", svg);
    bilanz.innerHTML =
      `Gesucht: kleinstes k mit <span class="wa">P(X ≤ k) = ${Fbk(n, p, "k")} ≥ ${num(alpha, 2)}</span>.<br>` +
      (k > 0 ? `${Fbk(n, p, k - 1)} ${zeichen(F(n, p, k - 1))} ${num(F(n, p, k - 1))} &lt; ${num(alpha, 2)}, &nbsp; ` : "") +
      `${Fbk(n, p, k)} ${zeichen(F(n, p, k))} ${num(F(n, p, k))} ≥ ${num(alpha, 2)} ⟹ <span class="wa">k = ${k}</span>`;
    setzeAnzeige("pa-text", `Die Treppe steigt Stufe für Stufe. Der erste Punkt auf oder über der roten Linie (grün) gibt k an: Mit einer Wahrscheinlichkeit von mindestens ${num(alpha * 100, 0)} % gibt es höchstens ${k} Treffer.`);
  } else {
    const pmin = 1 - Math.pow(1 - alpha, 1 / n);
    const breite = 560, hoehe = 250, links = 46, rechts = 14, oben = 18, unten = 34;
    const X = (x) => links + x * (breite - links - rechts);
    const Y = (y) => hoehe - unten - y * (hoehe - oben - unten);
    const svg = flaeche(breite, hoehe);
    for (let y = 0; y <= 1.0001; y += 0.2) {
      svg.appendChild(svgEl("line", { x1: links, x2: breite - rechts, y1: Y(y).toFixed(2), y2: Y(y).toFixed(2), class: "bk-gitterlinie", "data-wert": num(y, 1).replace(",", ".") }));
      svg.appendChild(svgText(links - 6, Y(y) + 4, num(y, 1), { class: "bk-achsentext", "text-anchor": "end" }));
    }
    for (let x = 0; x <= 1.0001; x += 0.1) svg.appendChild(svgText(X(x), hoehe - unten + 15, num(x, 1), { class: "bk-achsentext" }));
    let d = "";
    for (let i = 0; i <= 200; i++) { const x = i / 200; d += (i ? " L " : "M ") + X(x).toFixed(2) + " " + Y(1 - Math.pow(1 - x, n)).toFixed(2); }
    svg.appendChild(svgEl("path", { d, class: "bk-kurve" }));
    svg.appendChild(svgEl("line", { x1: links, x2: breite - rechts, y1: Y(alpha).toFixed(2), y2: Y(alpha).toFixed(2), class: "bk-schranke" }));
    svg.appendChild(svgEl("circle", { cx: X(pmin).toFixed(2), cy: Y(alpha).toFixed(2), r: 5, class: "bk-kurve-punkt aktiv", "data-p": String(pmin) }));
    svg.appendChild(svgEl("line", { x1: links, x2: breite - rechts, y1: Y(0), y2: Y(0), class: "bk-achse" }));
    svg.appendChild(svgEl("line", { x1: links, x2: links, y1: oben - 6, y2: Y(0), class: "bk-achse" }));
    svg.appendChild(svgText(breite - rechts, hoehe - 4, "p", { class: "bk-achsentext", "text-anchor": "end" }));
    svg.appendChild(svgText(links + 4, oben - 6, `P(X ≥ 1) = 1 − (1 − p)^${n}`, { class: "bk-achsentext", "text-anchor": "start" }));
    zeige("pa-mount", svg);
    bilanz.innerHTML =
      `Gesucht: kleinstes p mit <span class="wa">P(X ≥ 1) ≥ ${num(alpha, 2)}</span> bei n = ${n}.<br>` +
      `(1 − p)<sup>${n}</sup> ≤ ${num(1 - alpha, 2)} ⟺ 1 − p ≤ ${num(1 - alpha, 2)}<sup>1/${n}</sup> ⟺ <span class="wa">p ≥ 1 − ${num(1 - alpha, 2)}<sup>1/${n}</sup> ${zeichen(pmin)} ${num(pmin)}</span><br>` +
      `Probe: 1 − (1 − ${num(pmin)})<sup>${n}</sup> ${zeichen(1 - Math.pow(1 - pmin, n))} ${num(1 - Math.pow(1 - pmin, n))}`;
    setzeAnzeige("pa-text", `Der grüne Punkt liegt dort, wo die Kurve die rote Linie schneidet: Wer bei ${n} Versuchen mit mindestens ${num(alpha * 100, 0)} % Sicherheit mindestens einmal treffen will, braucht eine Trefferwahrscheinlichkeit von mindestens ${num(pmin * 100, 1)} %.`);
  }
}

function schrankeEinzeichnen(svg, alpha) {
  // Den Maßstab des Histogramms aus seinen eigenen Gitterlinien holen — die y-Achse wählt ihre
  // Obergrenze selbst.
  const linien = [...svg.querySelectorAll(".bk-gitterlinie")];
  const a = linien[0], b = linien[linien.length - 1];
  const ya = Number(a.getAttribute("y1")), yb = Number(b.getAttribute("y1"));
  const wa = Number(a.dataset.wert), wb = Number(b.dataset.wert);
  const y = ya + ((alpha - wa) / (wb - wa)) * (yb - ya);
  svg.appendChild(svgEl("line", { x1: a.getAttribute("x1"), x2: a.getAttribute("x2"), y1: y.toFixed(2), y2: y.toFixed(2), class: "bk-schranke", "data-schranke": String(alpha) }));
}

// ================= Kontrollfragen =================

function mountQuiz(container, { q, options, correct, explain }) {
  container.innerHTML = "";
  container.appendChild(el("p", { class: "quiz-q", html: "❓ " + q }));
  const optWrap = el("div", { class: "quiz-options" });
  const feedback = el("div", { class: "quiz-feedback", "aria-live": "polite" });
  options.forEach((optText, i) => {
    const btn = el("button", { type: "button", class: "quiz-opt", html: optText });
    btn.addEventListener("click", () => {
      [...optWrap.children].forEach((x) => x.classList.remove("correct", "wrong"));
      if (i === correct) {
        btn.classList.add("correct");
        feedback.className = "quiz-feedback ok";
        feedback.innerHTML = "✓ Richtig! " + explain;
      } else {
        btn.classList.add("wrong");
        [...optWrap.children][correct].classList.add("correct");
        feedback.className = "quiz-feedback err";
        feedback.innerHTML = "✗ Nicht ganz. " + explain;
      }
    });
    optWrap.appendChild(btn);
  });
  container.appendChild(optWrap);
  container.appendChild(feedback);
}

const QUIZZE = {
  "quiz-zufallsgroesse": {
    q: "Zwei Würfel werden geworfen, X ist die Augensumme. Warum ist P(X = 7) größer als P(X = 2)?",
    options: [
      "Weil 7 näher an der Mitte liegt und mittlere Zahlen beim Würfeln immer häufiger sind",
      "Weil zum Wert 7 sechs der 36 Ergebnisse gehören, zum Wert 2 nur eines",
      "Weil X eine Zufallsgröße ist und Zufallsgrößen große Werte bevorzugen",
      "Das stimmt nicht — beim Würfeln ist jede Augensumme gleich wahrscheinlich",
    ],
    correct: 1,
    explain: "Jedes der 36 Ergebnisse (a | b) ist gleich wahrscheinlich, aber die Zufallsgröße fasst sie zusammen: (1|6), (2|5), (3|4), (4|3), (5|2), (6|1) haben alle die Summe 7, also P(X = 7) = 6/36 = 1/6. Für die Summe 2 gibt es nur (1|1), also P(X = 2) = 1/36. Gleich wahrscheinliche Ergebnisse, aber keine gleich wahrscheinlichen Werte.",
  },
  "quiz-erwartungswert": {
    q: "Bei einem Glücksspiel wird mit Wahrscheinlichkeit 0,1 ein Betrag von 8 € ausgezahlt, sonst nichts. Der Einsatz beträgt 1 €. Was gilt?",
    options: [
      "Das Spiel ist fair, weil man 8 € gewinnen kann und nur 1 € einsetzt",
      "Das Spiel ist fair, weil der Erwartungswert 0,8 ist und das kleiner als 1 ist",
      "Auf Dauer verliert der Spieler pro Spiel im Mittel 0,20 €",
      "Auf Dauer gewinnt der Spieler pro Spiel im Mittel 0,80 €",
    ],
    correct: 2,
    explain: "E(X) = 8 € · 0,1 + 0 € · 0,9 = 0,80 €. Der Spieler setzt 1 € ein und bekommt im Mittel 0,80 € zurück — pro Spiel verliert er also 0,20 €. Fair wäre das Spiel bei einem Einsatz von genau 0,80 €. Dass man einzeln 8 € gewinnen <em>kann</em>, sagt nichts über den Durchschnitt.",
  },
  "quiz-bernoulli": {
    q: "Welcher der folgenden Versuche ist eine Bernoulli-Kette?",
    options: [
      "Aus einer Urne mit 3 roten und 2 blauen Kugeln werden 3 Kugeln ohne Zurücklegen gezogen; gezählt werden die roten",
      "Ein Würfel wird so lange geworfen, bis eine Sechs fällt",
      "Ein Würfel wird zweimal geworfen, notiert wird die Augensumme",
      "Eine Münze wird 12-mal geworfen; gezählt wird, wie oft „Zahl“ oben liegt",
    ],
    correct: 3,
    explain: "Beim Münzwurf gibt es zwei Ausgänge, die Würfe sind unabhängig, p = 0,5 bleibt gleich, und die Länge steht mit n = 12 fest. Ohne Zurücklegen ändert sich p von Zug zu Zug; „bis eine Sechs fällt“ hat keine feste Länge; und bei der Augensumme gibt es elf Werte statt zwei Ausgänge je Wurf.",
  },
  "quiz-binomialkoeffizient": {
    q: "Was gibt der Binomialkoeffizient (10 über 3) = 120 bei einer Bernoulli-Kette der Länge 10 an?",
    options: [
      "Die Wahrscheinlichkeit für genau 3 Treffer",
      "Die Anzahl der Pfade mit genau 3 Treffern — also die Möglichkeiten, die 3 Treffer auf die 10 Versuche zu verteilen",
      "Die Anzahl aller Pfade im Baumdiagramm",
      "Die Zahl der Treffer, die man bei 10 Versuchen erwarten kann",
    ],
    correct: 1,
    explain: "Ein Pfad mit 3 Treffern ist durch die Plätze seiner Treffer festgelegt, und 3 von 10 Plätzen lassen sich auf 120 Arten auswählen. Eine Wahrscheinlichkeit ist das nicht — die entsteht erst durch Multiplikation mit p³ · (1 − p)⁷. Alle Pfade zusammen sind 2¹⁰ = 1024, und das ist die Summe aller Binomialkoeffizienten der Zeile 10.",
  },
  "quiz-formel": {
    q: "Ein Würfel wird 5-mal geworfen. Welcher Term gibt die Wahrscheinlichkeit für genau zwei Sechsen an?",
    options: [
      "(1/6)² · (5/6)³",
      "(5 über 2) · (1/6)² · (5/6)³",
      "(5 über 2) · (1/6)³ · (5/6)²",
      "2 · (1/6) · 5 · (5/6)",
    ],
    correct: 1,
    explain: "Zwei Treffer mit p = 1/6, drei Nieten mit 5/6 — das ist die Wahrscheinlichkeit EINES solchen Pfades. Weil sich die zwei Sechsen auf (5 über 2) = 10 Arten auf die fünf Würfe verteilen können, wird damit multipliziert: B(5; 1/6; 2) = 10 · (1/6)² · (5/6)³ ≈ 0,1608. Ohne den Faktor 10 fehlen neun der zehn Pfade.",
  },
  "quiz-binomialverteilung": {
    q: "Wie verändert sich das Histogramm von B(n; 0,3; k), wenn n von 10 auf 40 wächst?",
    options: [
      "Es wird breiter und flacher, und die höchste Säule wandert von k = 3 nach k = 12",
      "Es bleibt gleich, weil p sich nicht ändert",
      "Es wird schmaler und höher, weil mehr Versuche genauer sind",
      "Es wird rechtslastig, weil n größer als 30 ist",
    ],
    correct: 0,
    explain: "Die Lage folgt μ = n · p: von 10 · 0,3 = 3 zu 40 · 0,3 = 12. Mit n gibt es mehr mögliche Trefferzahlen, die Wahrscheinlichkeit verteilt sich auf mehr Säulen — jede wird niedriger, das Histogramm breiter (σ wächst von etwa 1,45 auf 2,9). Links- oder rechtslastig entscheidet p, nicht n.",
  },
  "quiz-kumuliert": {
    q: "X ist binomialverteilt mit n = 20 und p = 0,2. Wie berechnet man P(X ≥ 6)?",
    options: [
      "F(20; 0,2; 6)",
      "1 − F(20; 0,2; 6)",
      "F(20; 0,2; 20) − F(20; 0,2; 6)",
      "1 − F(20; 0,2; 5)",
    ],
    correct: 3,
    explain: "Das Gegenereignis von „mindestens 6“ ist „höchstens 5“ — die Säule bei 6 gehört ja zum Ereignis selbst. Also P(X ≥ 6) = 1 − P(X ≤ 5) = 1 − F(20; 0,2; 5) ≈ 1 − 0,8042 = 0,1958. Mit 1 − F(20; 0,2; 6) würde man die Säule bei 6 zu viel abziehen, und die dritte Möglichkeit zieht sie ebenfalls ab.",
  },
  "quiz-kenngroessen": {
    q: "Eine Münze wird 100-mal geworfen. Welche Aussage über die Anzahl X der Würfe mit „Kopf“ stimmt?",
    options: [
      "Es fällt garantiert 50-mal Kopf, denn μ = 50",
      "μ = 50 und σ = 25; Werte zwischen 25 und 75 sind typisch",
      "μ = 50 und σ = 5; Werte zwischen etwa 45 und 55 sind typisch",
      "μ = 0,5, weil die Wahrscheinlichkeit für Kopf 0,5 ist",
    ],
    correct: 2,
    explain: "μ = n · p = 100 · 0,5 = 50 und σ = √(100 · 0,5 · 0,5) = √25 = 5. Die Varianz ist 25, die Standardabweichung ihre Wurzel. Der Erwartungswert ist kein garantiertes Ergebnis — genau 50-mal Kopf hat nur eine Wahrscheinlichkeit von etwa 8 %. In das Band von 45 bis 55 fällt X dagegen mit etwa 73 %.",
  },
  "quiz-parameter": {
    q: "Wie oft muss man mindestens würfeln, um mit mindestens 90 % Wahrscheinlichkeit mindestens eine Sechs zu erhalten?",
    options: [
      "12-mal, denn n ≥ ln(0,1) : ln(5/6) ≈ 12,63, und abgerundet ergibt das 12",
      "13-mal, denn n ≥ ln(0,1) : ln(5/6) ≈ 12,63, und n wird aufgerundet",
      "6-mal, denn im Mittel fällt bei sechs Würfen eine Sechs",
      "Das geht nicht, 90 % Sicherheit erreicht man beim Würfeln nie",
    ],
    correct: 1,
    explain: "P(X ≥ 1) = 1 − (5/6)ⁿ ≥ 0,9 führt auf (5/6)ⁿ ≤ 0,1 und n ≥ ln 0,1 : ln(5/6) ≈ 12,63. Bei 12 Würfen ist 1 − (5/6)¹² ≈ 0,888 noch zu wenig, bei 13 Würfen ≈ 0,907. Deshalb wird aufgerundet. Sechs Würfe reichen nur für 1 − (5/6)⁶ ≈ 0,665.",
  },
};

// ================= Selbsteinschätzung =================
//
// Die Auswahl liegt nur im Browser dieser Person — eine Lernhilfe, keine Leistungsmessung.
const SE_PUNKTE = [
  ["sec-zufallsgroesse", "Ich kann zu einem Zufallsversuch eine Zufallsgröße festlegen und ihre Verteilung als Tabelle und Histogramm angeben."],
  ["sec-erwartungswert", "Ich kann E(X), V(X) und σ berechnen und entscheiden, ob ein Spiel fair ist."],
  ["sec-bernoulli", "Ich erkenne, ob eine Bernoulli-Kette vorliegt, und kann n und p angeben."],
  ["sec-binomialkoeffizient", "Ich kann den Binomialkoeffizienten berechnen und als Anzahl der Pfade deuten."],
  ["sec-formel", "Ich kann mit der Formel von Bernoulli P(X = k) berechnen — auch für p > 0,5 mit der Tabelle."],
  ["sec-binomialverteilung", "Ich kann beschreiben, wie n und p die Gestalt des Histogramms beeinflussen."],
  ["sec-kumuliert", "Ich kann „höchstens“, „mindestens“ und „zwischen“ mit F(n; p; k) ausdrücken, ohne mich um eins zu verzählen."],
  ["sec-kenngroessen", "Ich kann μ und σ einer Binomialverteilung berechnen und deuten."],
  ["sec-parameter", "Ich kann n, k oder p zu einer vorgegebenen Mindestwahrscheinlichkeit bestimmen."],
];
const SE_SCHLUESSEL = "uplant-mss13-binomial-selbsteinschaetzung";

function leseSE() {
  try { return JSON.parse(localStorage.getItem(SE_SCHLUESSEL) || "{}"); } catch { return {}; }
}
function schreibeSE(d) {
  try { localStorage.setItem(SE_SCHLUESSEL, JSON.stringify(d)); } catch { /* ohne Speicher geht es auch */ }
}
function renderSelbsteinschaetzung() {
  const liste = document.getElementById("se-liste");
  const stand = leseSE();
  liste.innerHTML = "";
  SE_PUNKTE.forEach(([id, text]) => {
    const knoepfe = el("div", { class: "se-knoepfe", role: "group", "aria-label": text });
    [["sicher", "😀", "sicher"], ["teils", "😐", "teilweise"], ["unsicher", "🤔", "noch unsicher"]].forEach(([wert, zeichen, name]) => {
      const b = el("button", { type: "button", "aria-pressed": String(stand[id] === wert), title: name, "aria-label": name }, zeichen);
      b.addEventListener("click", () => { const d = leseSE(); d[id] = wert; schreibeSE(d); renderSelbsteinschaetzung(); });
      knoepfe.appendChild(b);
    });
    liste.appendChild(el("div", { class: "se-zeile" }, [el("span", { class: "se-text" }, text), knoepfe]));
  });
  const unsicher = SE_PUNKTE.filter(([id]) => stand[id] === "unsicher");
  const sicher = SE_PUNKTE.filter(([id]) => stand[id] === "sicher").length;
  const aus = document.getElementById("se-auswertung");
  if (!Object.keys(stand).length) {
    aus.textContent = "Noch nichts angekreuzt.";
  } else if (unsicher.length) {
    aus.innerHTML = `Wiederhole zuerst: ${unsicher.map(([id]) => `<a href="#${id}">${document.querySelector(`#${id} h2`).textContent}</a>`).join(", ")}. Danach passen die Übungsaufgaben auf der Stufe „einfach“ und „mittel“.`;
  } else {
    aus.textContent = `${sicher} von ${SE_PUNKTE.length} Punkten sicher — probier dich an den Aufgaben auf den Stufen „schwierig“ und „komplex“.`;
  }
}

// ================= Start =================

const REGLER = [
  [["zg-art", "zg-rel", "zg-x"], renderZufallsgroesse],
  [["ew-rot", "ew-weiss", "ew-aw", "ew-as", "ew-einsatz"], renderErwartungswert],
  [["bk-n", "bk-p", "bk-k"], renderBernoulliKette],
  [["ko-n", "ko-k"], renderBinomialkoeffizient],
  [["bf-n", "bf-p", "bf-k"], renderFormel],
  [["hv-n", "hv-p", "hv-spiegel"], renderVerteilung],
  [["ku-n", "ku-p", "ku-art", "ku-a", "ku-b"], renderKumuliert],
  [["kg-n", "kg-p"], renderKenngroessen],
  [["pa-art", "pa-sicher", "pa-n", "pa-p"], renderParameter],
];
for (const [ids, render] of REGLER) {
  ids.forEach((id) => {
    const e = document.getElementById(id);
    e.addEventListener(e.tagName === "SELECT" ? "change" : "input", render);
    if (e.tagName === "SELECT") e.addEventListener("input", render);
  });
  render();
}
for (const [id, def] of Object.entries(QUIZZE)) mountQuiz(document.getElementById(id), def);
renderSelbsteinschaetzung();
mountUebungsaufgaben(document.getElementById("exercises-mount"), AUFGABEN, { parse: parseZahl });
