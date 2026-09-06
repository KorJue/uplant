// Selbstlernpfad "Zuordnungen" (Grundwissen Klasse 5-10, Kapitel 4).
// Rein clientseitiges Vanilla-JS, ohne Build-Schritt oder externe Bibliotheken.
//
// Leitgedanke: Proportional und antiproportional sind keine Vokabeln, sondern
// zwei Rechenproben — konstanter Quotient gegen konstantes Produkt. Deshalb
// trägt jede Wertetabelle dieser Seite beide Spalten, und Abschnitt 5 zeigt
// ausdrücklich Fälle, in denen keine der beiden Proben aufgeht. Der Dreisatz
// wird nicht als Schema geübt, sondern in seinen drei Zeilen mitgeschrieben,
// damit der Unterschied im mittleren Schritt sichtbar bleibt.
//
// Durchgehende Farbcodierung: proportional grün, antiproportional violett,
// weder noch orange, Ausgangsgröße x rot, zugeordnete Größe y blau.

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
  return x.toLocaleString("de-DE", { maximumFractionDigits: digits });
}
// "=" oder "≈"? Entscheidend ist, ob die Anzeige mit der gewählten Stellenzahl
// den Wert genau trifft — nicht, ob er ganzzahlig ist (2,5 ist exakt).
function zeichen(x, stellen = 2) {
  const f = Math.pow(10, stellen);
  return Math.abs(x - Math.round(x * f) / f) < 1e-12 ? "=" : "≈";
}
// Einzelner Zahlenwert: Das "≈" steht nur, wenn wirklich gerundet wird.
function wert(x, stellen = 2) {
  return (zeichen(x, stellen) === "=" ? "" : "≈ ") + num(x, stellen);
}
function euro(x) {
  return num(x, 2) + " €";
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
// Alle Teiler von k, die höchstens grenze sind — damit Wertetabellen
// antiproportionaler Zuordnungen ganzzahlig bleiben.
function teiler(k, grenze) {
  const out = [];
  for (let t = 1; t <= Math.min(k, grenze); t++) if (k % t === 0) out.push(t);
  return out;
}
function karte(klasse, name, inhalt) {
  return el("div", { class: "zo-karte " + klasse }, [
    el("span", { class: "name" }, name),
    el("span", { class: "wert" }, inhalt),
  ]);
}

// ---------- Koordinatensystem ----------

// Zeichnet Achsen, Gitter und Beschriftung und liefert die Umrechnung von
// Sachwerten in Bildkoordinaten zurück. Die Achsen tragen Größen mit
// Einheiten — deshalb steht der Name der Größe an der Achse, nicht bloß
// "x" und "y".
function koordinaten(svg, opt) {
  const { links, unten, breite, hoehe, xMax, yMax, xSchritt, ySchritt, xName, yName, xEinheit, yEinheit } = opt;
  const px = (x) => links + (x / xMax) * breite;
  const py = (y) => unten - (y / yMax) * hoehe;

  for (let x = xSchritt; x <= xMax + 1e-9; x += xSchritt) {
    svg.appendChild(svgEl("line", { x1: px(x).toFixed(2), y1: (unten - hoehe).toFixed(2), x2: px(x).toFixed(2), y2: unten, class: "zo-gitter" }));
    svg.appendChild(svgText(px(x), unten + 16, num(x, 4) + (xEinheit ? "" : ""), { class: "zo-achsentext" }));
  }
  for (let y = ySchritt; y <= yMax + 1e-9; y += ySchritt) {
    svg.appendChild(svgEl("line", { x1: links.toFixed(2), y1: py(y).toFixed(2), x2: (links + breite).toFixed(2), y2: py(y).toFixed(2), class: "zo-gitter" }));
    svg.appendChild(svgText(links - 8, py(y) + 4, num(y, 4), { class: "zo-achsentext", "text-anchor": "end" }));
  }
  svg.appendChild(svgEl("line", { x1: links, y1: unten, x2: (links + breite + 14).toFixed(2), y2: unten, class: "zo-achse" }));
  svg.appendChild(svgEl("line", { x1: links, y1: unten, x2: links, y2: (unten - hoehe - 14).toFixed(2), class: "zo-achse" }));
  svg.appendChild(svgText(links - 8, unten + 16, "0", { class: "zo-achsentext", "text-anchor": "end" }));
  svg.appendChild(svgText(links + breite + 14, unten + 30, xName + (xEinheit ? " in " + xEinheit : ""), { class: "zo-achsenname", "text-anchor": "end" }));
  svg.appendChild(svgText(links - 6, unten - hoehe - 20, yName + (yEinheit ? " in " + yEinheit : ""), { class: "zo-achsenname", "text-anchor": "start" }));
  return { px, py };
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

// ---------- Wertetabelle mit beiden Proben ----------

// Beide Erkennungsmerkmale stehen immer nebeneinander: der Quotient y : x und
// das Produkt x · y. Genau eines von beiden ist konstant — oder keines.
function art(paare) {
  const q = paare.map(([x, y]) => y / x);
  const p = paare.map(([x, y]) => x * y);
  const gleich = (a) => a.every((v) => Math.abs(v - a[0]) < 1e-9);
  if (gleich(q)) return "prop";
  if (gleich(p)) return "anti";
  return "weder";
}

function tabelleHtml(paare, opt = {}) {
  const typ = art(paare);
  const stellen = opt.stellen ?? 2;
  const kl = (spalte) =>
    spalte === "q" ? (typ === "prop" ? "k gleich" : "k verschieden")
      : (typ === "anti" ? "k gleich-anti" : "k verschieden");
  const hervor = opt.hervor;
  let zeilen = `<caption>${opt.titel || ""}</caption>`;
  zeilen += `<tr><th>${opt.xName}</th>` + paare.map(([x], i) =>
    `<td class="x${hervor === i ? " hervor" : ""}">${num(x, stellen)}</td>`).join("") + "</tr>";
  zeilen += `<tr><th>${opt.yName}</th>` + paare.map(([, y], i) =>
    `<td class="y${hervor === i ? " hervor" : ""}">${num(y, stellen)}</td>`).join("") + "</tr>";
  if (opt.proben !== false) {
    zeilen += `<tr><th>Quotient y : x</th>` + paare.map(([x, y]) =>
      `<td class="${kl("q")}">${wert(y / x, 3)}</td>`).join("") + "</tr>";
    zeilen += `<tr><th>Produkt x · y</th>` + paare.map(([x, y]) =>
      `<td class="${kl("p")}">${wert(x * y, 3)}</td>`).join("") + "</tr>";
  }
  return zeilen;
}

function urteil(typ) {
  const text = { prop: "proportional", anti: "antiproportional", weder: "weder proportional noch antiproportional" }[typ];
  return `<span class="zo-urteil ${typ}">${text}</span>`;
}

// ================= 1. Drei Darstellungen =================

const DA_BEISPIELE = {
  broetchen: {
    xName: "Brötchen", yName: "Preis", xEinheit: "", yEinheit: "€",
    paare: [[1, 0.5], [2, 1], [3, 1.5], [4, 2], [5, 2.5], [6, 3]],
    satz: "Ein Brötchen kostet 0,50 €.",
  },
  arbeiter: {
    xName: "Arbeiter", yName: "Bauzeit", xEinheit: "", yEinheit: "Tagen",
    paare: [[1, 12], [2, 6], [3, 4], [4, 3], [6, 2], [12, 1]],
    satz: "Die ganze Arbeit umfasst 12 Arbeitstage.",
  },
  taxi: {
    xName: "Strecke", yName: "Preis", xEinheit: "km", yEinheit: "€",
    paare: [[1, 5.5], [2, 7.5], [3, 9.5], [4, 11.5], [5, 13.5]],
    satz: "3,50 € Grundpreis, dazu 2,00 € je Kilometer.",
  },
};

let daForm = "tabelle";

function daPfeildiagramm(b) {
  const paare = b.paare;
  const n = paare.length;
  const dy = 30, y0 = 44;
  const H = y0 + (n - 1) * dy + 34;
  const W = 420;
  const svg = neueFlaeche(W, H);
  const lx = 120, rx = 300;
  svg.appendChild(svgEl("rect", { x: lx - 52, y: y0 - 20, width: 104, height: (n - 1) * dy + 40, rx: 14, class: "zo-menge" }));
  svg.appendChild(svgEl("rect", { x: rx - 52, y: y0 - 20, width: 104, height: (n - 1) * dy + 40, rx: 14, class: "zo-menge" }));
  svg.appendChild(svgText(lx, y0 - 28, b.xName + (b.xEinheit ? " (in " + b.xEinheit + ")" : ""), { class: "zo-mengentext" }));
  svg.appendChild(svgText(rx, y0 - 28, b.yName + (b.yEinheit ? " (in " + b.yEinheit + ")" : ""), { class: "zo-mengentext" }));
  paare.forEach(([x, y], i) => {
    const yy = y0 + i * dy;
    svg.appendChild(svgText(lx, yy + 4, num(x, 2), { class: "zo-wert links" }));
    svg.appendChild(svgText(rx, yy + 4, num(y, 2), { class: "zo-wert rechts" }));
    svg.appendChild(svgEl("line", { x1: lx + 26, y1: yy, x2: rx - 30, y2: yy, class: "zo-pfeil" }));
    svg.appendChild(svgEl("path", {
      d: `M ${rx - 30} ${yy} l -7 -4 l 0 8 Z`, class: "zo-pfeil", fill: "currentColor",
    }));
  });
  svg.appendChild(svgText(W / 2, H - 8, "Von jedem Wert links geht genau ein Pfeil aus.", { class: "zo-mengentext" }));
  return svg;
}

function daGraph(b, typ) {
  const paare = b.paare;
  const xMax = Math.ceil(Math.max(...paare.map((p) => p[0])) * 1.15);
  const yMax = Math.ceil(Math.max(...paare.map((p) => p[1])) * 1.15);
  const W = 460, H = 300;
  const svg = neueFlaeche(W, H);
  const g = koordinaten(svg, {
    links: 54, unten: 236, breite: 360, hoehe: 196,
    xMax, yMax,
    xSchritt: xMax > 12 ? 4 : xMax > 6 ? 2 : 1,
    ySchritt: yMax > 12 ? 4 : yMax > 6 ? 2 : 1,
    xName: b.xName, yName: b.yName, xEinheit: b.xEinheit, yEinheit: b.yEinheit,
  });
  paare.forEach(([x, y]) => {
    svg.appendChild(svgEl("circle", { cx: g.px(x).toFixed(2), cy: g.py(y).toFixed(2), r: 4.5, class: "zo-punkt " + typ }));
  });
  return svg;
}

function renderDarstellungen() {
  const schluessel = document.getElementById("da-beispiel").value;
  const b = DA_BEISPIELE[schluessel];
  const typ = art(b.paare);

  const schalter = document.getElementById("da-schalter");
  schalter.innerHTML = "";
  [["tabelle", "Tabelle"], ["pfeil", "Pfeildiagramm"], ["graph", "Graph"]].forEach(([k, name]) => {
    const btn = el("button", { type: "button", class: daForm === k ? "aktiv" : "" }, name);
    btn.addEventListener("click", () => {
      daForm = k;
      renderDarstellungen();
    });
    schalter.appendChild(btn);
  });

  const tab = document.getElementById("da-tabelle");
  const mount = document.getElementById("da-mount");
  tab.hidden = daForm !== "tabelle";
  mount.hidden = daForm === "tabelle";
  if (daForm === "tabelle") {
    tab.innerHTML = tabelleHtml(b.paare, {
      titel: b.xName + " ↦ " + b.yName + (b.yEinheit ? " (in " + b.yEinheit + ")" : ""),
      xName: b.xName + (b.xEinheit ? " in " + b.xEinheit : ""),
      yName: b.yName + (b.yEinheit ? " in " + b.yEinheit : ""),
      proben: false,
    });
  } else {
    mount.innerHTML = "";
    mount.appendChild(daForm === "pfeil" ? daPfeildiagramm(b) : daGraph(b, typ));
  }

  document.getElementById("da-bilanz").innerHTML =
    `<span class="wx">${b.xName}</span> ↦ <span class="wy">${b.yName}</span> — ${b.satz}<br>` +
    `Alle drei Darstellungen zeigen dieselben ${num(b.paare.length)} Wertepaare. ` +
    (daForm === "tabelle" ? "Aus der Tabelle liest man einzelne Werte genau ab."
      : daForm === "pfeil" ? "Am Pfeildiagramm sieht man, dass jedem Wert links genau einer rechts zugeordnet ist."
        : "Am Graphen sieht man den Verlauf im Ganzen.");

  document.getElementById("da-text").textContent = {
    tabelle: "Wechsle die Darstellung — die Zuordnung bleibt dieselbe, nur der Blick darauf ändert sich.",
    pfeil: "Kein Wert links hat zwei Pfeile. Genau das macht die Sache zu einer Zuordnung.",
    graph: "Liegen die Punkte auf einer Geraden durch (0|0)? Auf einer fallenden Kurve? Das entscheidet später die Art.",
  }[daForm];
}

function initDarstellungen() {
  document.getElementById("da-beispiel").addEventListener("change", renderDarstellungen);
  renderDarstellungen();
}

// ================= 2. Proportionale Zuordnungen =================

function renderProportional() {
  const cent = begrenzt("pr-k", Number(document.getElementById("pr-k").value), 20, 120);
  const xHervor = begrenzt("pr-x", Number(document.getElementById("pr-x").value), 1, 8);
  const k = cent / 100;
  document.getElementById("pr-k-anzeige").textContent = euro(k);
  document.getElementById("pr-x-anzeige").textContent = num(xHervor) + (xHervor === 1 ? " Brötchen" : " Brötchen");

  const xWerte = [1, 2, 3, 4, 5, 6, 7, 8];
  const paare = xWerte.map((x) => [x, (cent * x) / 100]);
  const yHervor = (cent * xHervor) / 100;

  const xMax = 9, yMax = Math.ceil((cent * 8) / 100) + 1;
  const W = 470, H = 300;
  const svg = neueFlaeche(W, H);
  const g = koordinaten(svg, {
    links: 56, unten: 236, breite: 366, hoehe: 196,
    xMax, yMax, xSchritt: 1, ySchritt: yMax > 8 ? 2 : 1,
    xName: "Anzahl Brötchen", yName: "Preis", xEinheit: "", yEinheit: "€",
  });
  // Ursprungsgerade: Sie ist das Erkennungszeichen und wird deshalb bis zur
  // 0 durchgezogen, nicht erst beim ersten Wertepaar begonnen.
  svg.appendChild(svgEl("line", {
    x1: g.px(0).toFixed(2), y1: g.py(0).toFixed(2),
    x2: g.px(xMax).toFixed(2), y2: g.py(k * xMax).toFixed(2),
    class: "zo-kurve prop",
  }));
  paare.forEach(([x, y]) => {
    svg.appendChild(svgEl("circle", { cx: g.px(x).toFixed(2), cy: g.py(y).toFixed(2), r: 4.5, class: "zo-punkt prop" }));
  });
  svg.appendChild(svgEl("line", { x1: g.px(xHervor).toFixed(2), y1: g.py(0).toFixed(2), x2: g.px(xHervor).toFixed(2), y2: g.py(yHervor).toFixed(2), class: "zo-hilfslinie" }));
  svg.appendChild(svgEl("line", { x1: g.px(0).toFixed(2), y1: g.py(yHervor).toFixed(2), x2: g.px(xHervor).toFixed(2), y2: g.py(yHervor).toFixed(2), class: "zo-hilfslinie" }));
  svg.appendChild(svgEl("circle", { cx: g.px(xHervor).toFixed(2), cy: g.py(yHervor).toFixed(2), r: 5.5, class: "zo-punkt prop hervor" }));
  svg.appendChild(svgText(g.px(xHervor) + 8, g.py(yHervor) - 10, `(${num(xHervor)} | ${num(yHervor, 2)})`, { class: "zo-punkttext", "text-anchor": "start" }));

  const mount = document.getElementById("pr-mount");
  mount.innerHTML = "";
  mount.appendChild(svg);

  document.getElementById("pr-tabelle").innerHTML = tabelleHtml(paare.slice(0, 6), {
    titel: "Anzahl ↦ Preis in €",
    xName: "Anzahl", yName: "Preis in €",
    hervor: xHervor <= 6 ? xHervor - 1 : undefined,
  });

  const karten = document.getElementById("pr-karten");
  karten.innerHTML = "";
  karten.appendChild(karte("prop", "Faktor k", euro(k) + " je Brötchen"));
  karten.appendChild(karte("x", "gewählte Anzahl", num(xHervor)));
  karten.appendChild(karte("y", "zugehöriger Preis", euro(yHervor)));
  karten.appendChild(karte("prop", "y : x", wert(k, 2) + " — für alle Paare"));

  document.getElementById("pr-bilanz").innerHTML =
    `${urteil("prop")}<br>` +
    `<span class="wp">y = k · x</span> mit <span class="wp">k = ${num(k, 2)}</span>: ` +
    `<span class="wy">${num(yHervor, 2)}</span> = <span class="wp">${num(k, 2)}</span> · <span class="wx">${num(xHervor)}</span><br>` +
    `Verdoppelt man die Anzahl, verdoppelt sich der Preis: ${num(xHervor)} Brötchen kosten ${euro(yHervor)}, ` +
    `${num(2 * xHervor)} Brötchen ${euro(2 * yHervor)}.<br>` +
    `Der Graph geht durch <span class="wp">(0 | 0)</span> — für 0 Brötchen zahlt man 0 €. Das gilt bei jeder proportionalen Zuordnung.`;

  document.getElementById("pr-text").textContent =
    "Schiebe den Preis je Brötchen: Die Gerade wird steiler oder flacher, geht aber immer durch den Ursprung.";
}

function initProportional() {
  ["pr-k", "pr-x"].forEach((id) => document.getElementById(id).addEventListener("input", renderProportional));
  renderProportional();
}

// ================= 3. Antiproportionale Zuordnungen =================

function renderAntiproportional() {
  const k = begrenzt("ap-k", Number(document.getElementById("ap-k").value), 12, 72);
  // Nur Teiler von k ergeben ganze Tage — sonst stünden in der Wertetabelle
  // krumme Zahlen, die von der Sache ablenken.
  const moeglich = teiler(k, 12);
  const roh = begrenzt("ap-x", Number(document.getElementById("ap-x").value), 1, 12);
  // Der Regler rastet auf Teiler von k ein — und der eingerastete Wert wird
  // zurückgeschrieben. Sonst stünde der Schieber auf 5, während daneben 4
  // steht; ein Regler darf nicht etwas anderes anzeigen als er bewirkt.
  const xHervor = begrenzt("ap-x",
    moeglich.reduce((a, b) => (Math.abs(b - roh) < Math.abs(a - roh) ? b : a), moeglich[0]), 1, 12);
  document.getElementById("ap-k-anzeige").textContent = num(k) + " Arbeitstage";
  document.getElementById("ap-x-anzeige").textContent = num(xHervor) + (xHervor === 1 ? " Arbeiter" : " Arbeiter");

  const paare = moeglich.map((x) => [x, k / x]);
  const yHervor = k / xHervor;

  const xMax = 13, yMax = k + 4;
  const W = 470, H = 300;
  const svg = neueFlaeche(W, H);
  const g = koordinaten(svg, {
    links: 56, unten: 236, breite: 366, hoehe: 196,
    xMax, yMax, xSchritt: 2, ySchritt: yMax > 40 ? 12 : yMax > 20 ? 6 : 4,
    xName: "Arbeiter", yName: "Bauzeit", xEinheit: "", yEinheit: "Tagen",
  });
  // Hyperbel: Sie beginnt erst bei x = 1 — null Arbeiter werden nie fertig,
  // und der Graph erreicht die Achsen nie.
  let d = "";
  for (let x = 0.9; x <= xMax; x += 0.1) {
    const y = k / x;
    if (y > yMax) continue;
    d += (d ? " L " : "M ") + g.px(x).toFixed(2) + " " + g.py(y).toFixed(2);
  }
  svg.appendChild(svgEl("path", { d, class: "zo-kurve anti" }));
  paare.forEach(([x, y]) => {
    if (y > yMax) return;
    svg.appendChild(svgEl("circle", { cx: g.px(x).toFixed(2), cy: g.py(y).toFixed(2), r: 4.5, class: "zo-punkt anti" }));
  });
  svg.appendChild(svgEl("line", { x1: g.px(xHervor).toFixed(2), y1: g.py(0).toFixed(2), x2: g.px(xHervor).toFixed(2), y2: g.py(yHervor).toFixed(2), class: "zo-hilfslinie" }));
  svg.appendChild(svgEl("line", { x1: g.px(0).toFixed(2), y1: g.py(yHervor).toFixed(2), x2: g.px(xHervor).toFixed(2), y2: g.py(yHervor).toFixed(2), class: "zo-hilfslinie" }));
  svg.appendChild(svgEl("circle", { cx: g.px(xHervor).toFixed(2), cy: g.py(yHervor).toFixed(2), r: 5.5, class: "zo-punkt anti hervor" }));
  svg.appendChild(svgText(g.px(xHervor) + 8, g.py(yHervor) - 10, `(${num(xHervor)} | ${num(yHervor)})`, { class: "zo-punkttext", "text-anchor": "start" }));

  const mount = document.getElementById("ap-mount");
  mount.innerHTML = "";
  mount.appendChild(svg);

  document.getElementById("ap-tabelle").innerHTML = tabelleHtml(paare, {
    titel: "Arbeiter ↦ Bauzeit in Tagen",
    xName: "Arbeiter", yName: "Tage",
    stellen: 0,
    hervor: moeglich.indexOf(xHervor),
  });

  const karten = document.getElementById("ap-karten");
  karten.innerHTML = "";
  karten.appendChild(karte("anti", "Produkt k", num(k) + " Arbeitstage"));
  karten.appendChild(karte("x", "gewählte Arbeiterzahl", num(xHervor)));
  karten.appendChild(karte("y", "benötigte Zeit", num(yHervor) + (yHervor === 1 ? " Tag" : " Tage")));
  karten.appendChild(karte("anti", "x · y", num(k) + " — für alle Paare"));

  const doppelt = moeglich.includes(2 * xHervor);
  document.getElementById("ap-bilanz").innerHTML =
    `${urteil("anti")}<br>` +
    `<span class="wa">x · y = k</span> mit <span class="wa">k = ${num(k)}</span>: ` +
    `<span class="wx">${num(xHervor)}</span> · <span class="wy">${num(yHervor)}</span> = <span class="wa">${num(k)}</span><br>` +
    (doppelt
      ? `Verdoppelt man die Arbeiterzahl, halbiert sich die Zeit: ${num(xHervor)} Arbeiter brauchen ${num(yHervor)} Tage, ` +
        `${num(2 * xHervor)} Arbeiter nur ${num(k / (2 * xHervor))}.<br>`
      : `Je mehr Arbeiter, desto weniger Tage — und zwar so, dass das Produkt immer ${num(k)} bleibt.<br>`) +
    `Der Graph erreicht keine der beiden Achsen: Mit 0 Arbeitern wird die Mauer nie fertig, ` +
    `und egal wie viele mithelfen — ganz ohne Zeit geht es nicht.`;

  document.getElementById("ap-text").textContent =
    "Nur Arbeiterzahlen, die in der Gesamtarbeit aufgehen, ergeben ganze Tage — der Regler rastet deshalb auf diese Werte ein.";
}

function initAntiproportional() {
  ["ap-k", "ap-x"].forEach((id) => document.getElementById(id).addEventListener("input", renderAntiproportional));
  renderAntiproportional();
}

// ================= 4. Der Dreisatz =================

// Feste, freundliche Zahlen: Der Preis je Brötchen und die Gesamtarbeit sind
// so gewählt, dass beide Dreisätze ganzzahlig aufgehen.
const DS_PREIS = 0.5;
const DS_ARBEIT = 48;
const DS_A_WERTE = [2, 3, 4, 6, 8, 12];
const DS_B_WERTE = [1, 2, 3, 4, 6, 8, 12, 16, 24];

function dsZeile(marke, links, rechts, operation, klasse = "") {
  return `<div class="zeile ${klasse}"><span class="marke">${marke}</span>` +
    `<span class="links">${links}</span><span class="pfeil">↦</span>` +
    `<span class="rechts">${rechts}</span><span class="operation">${operation}</span></div>`;
}

function renderDreisatz() {
  const anti = document.getElementById("ds-art").value === "anti";
  const iA = begrenzt("ds-a", Number(document.getElementById("ds-a").value), 0, DS_A_WERTE.length - 1);
  const iB = begrenzt("ds-b", Number(document.getElementById("ds-b").value), 0, DS_B_WERTE.length - 1);
  const a = DS_A_WERTE[iA], b = DS_B_WERTE[iB];
  const einheitX = anti ? "Arbeiter" : "Brötchen";
  document.getElementById("ds-a-anzeige").textContent = num(a) + " " + einheitX;
  document.getElementById("ds-b-anzeige").textContent = num(b) + " " + einheitX;

  const yA = anti ? DS_ARBEIT / a : DS_PREIS * a;
  const yEins = anti ? DS_ARBEIT : DS_PREIS;
  const yB = anti ? DS_ARBEIT / b : DS_PREIS * b;
  const zeigeY = (y) => (anti ? num(y) + (y === 1 ? " Tag" : " Tage") : euro(y));

  document.getElementById("ds-schritte").innerHTML =
    dsZeile("1.", num(a) + " " + einheitX, zeigeY(yA), "gegeben") +
    dsZeile("2.", "1 " + (anti ? "Arbeiter" : "Brötchen"), zeigeY(yEins),
      anti ? `links : ${num(a)}, rechts <strong>· ${num(a)}</strong>` : `beide Seiten : ${num(a)}`,
      "schritt2" + (anti ? " anti" : "")) +
    dsZeile("3.", num(b) + " " + einheitX, zeigeY(yB),
      anti ? `links · ${num(b)}, rechts <strong>: ${num(b)}</strong>` : `beide Seiten · ${num(b)}`);

  const mehr = b > a;
  document.getElementById("ds-bilanz").innerHTML =
    (anti ? urteil("anti") : urteil("prop")) + "<br>" +
    (anti
      ? `<span class="wa">Antiproportional:</span> Im 2. Schritt wird links geteilt und rechts <strong>multipliziert</strong>. ` +
        `Ein einzelner Arbeiter braucht am längsten — ${num(DS_ARBEIT)} Tage.<br>` +
        `<span class="wy">Ergebnis: ${num(b)} Arbeiter brauchen ${zeigeY(yB)}.</span><br>` +
        `<strong>Probe:</strong> ${mehr ? "mehr" : b === a ? "gleich viele" : "weniger"} Arbeiter — also ` +
        `${mehr ? "<em>weniger</em>" : b === a ? "<em>gleich viel</em>" : "<em>mehr</em>"} Zeit. ` +
        `${num(b)} · ${num(yB)} = ${num(DS_ARBEIT)} ✓`
      : `<span class="wp">Proportional:</span> Im 2. Schritt wird auf beiden Seiten geteilt. ` +
        `Ein Brötchen kostet ${euro(DS_PREIS)}.<br>` +
        `<span class="wy">Ergebnis: ${num(b)} Brötchen kosten ${zeigeY(yB)}.</span><br>` +
        `<strong>Probe:</strong> ${mehr ? "mehr" : b === a ? "gleich viele" : "weniger"} Brötchen — also ` +
        `${mehr ? "<em>mehr</em>" : b === a ? "<em>gleich viel</em>" : "<em>weniger</em>"} Geld. ` +
        `${num(yB, 2)} : ${num(b)} = ${num(DS_PREIS, 2)} ✓`);

  document.getElementById("ds-text").textContent = anti
    ? "Achte auf den mittleren Schritt: Rechts steht ein Malzeichen, wo im proportionalen Fall ein Geteiltzeichen steht."
    : "Beide Seiten werden gleich behandelt — geteilt und wieder multipliziert. Das ist der proportionale Fall.";
}

function initDreisatz() {
  ["ds-art", "ds-a", "ds-b"].forEach((id) => {
    const e = document.getElementById(id);
    e.addEventListener(e.tagName === "SELECT" ? "change" : "input", renderDreisatz);
  });
  renderDreisatz();
}

// ================= 5. Weder noch =================

const WE_SAETZE = {
  taxi: {
    titel: "Taxi: 3,50 € Grundpreis, 2,00 € je Kilometer",
    xName: "Kilometer", yName: "Preis in €", xEinheit: "km", yEinheit: "€",
    paare: [[1, 5.5], [2, 7.5], [3, 9.5], [4, 11.5], [5, 13.5]],
    erklaerung: "Der Preis wächst gleichmäßig, aber der Graph beginnt bei 3,50 € statt bei 0 € — die Gerade geht <strong>nicht durch den Ursprung</strong>. Für 0 km zahlt man schon den Grundpreis, und deshalb sind die Quotienten verschieden.",
    kurve: (x) => 3.5 + 2 * x,
  },
  prop: {
    titel: "Tankstelle: 1,80 € je Liter",
    xName: "Liter", yName: "Preis in €", xEinheit: "l", yEinheit: "€",
    paare: [[10, 18], [20, 36], [30, 54], [40, 72], [50, 90]],
    erklaerung: "Alle Quotienten sind 1,80 — das ist der Preis je Liter. Der Graph ist eine Gerade durch den Ursprung: Für 0 Liter zahlt man 0 €.",
    kurve: (x) => 1.8 * x,
  },
  anti: {
    titel: "Pizza: 12 Stücke werden aufgeteilt",
    xName: "Personen", yName: "Stücke je Person", xEinheit: "", yEinheit: "",
    paare: [[1, 12], [2, 6], [3, 4], [4, 3], [6, 2], [12, 1]],
    erklaerung: "Alle Produkte sind 12 — so viele Stücke gibt es insgesamt. Je mehr Personen, desto weniger Stücke je Person, und zwar genau umgekehrt proportional.",
    kurve: (x) => 12 / x,
  },
  quadrat: {
    titel: "Quadrat: Seitenlänge ↦ Flächeninhalt",
    xName: "Seitenlänge", yName: "Fläche in cm²", xEinheit: "cm", yEinheit: "cm²",
    paare: [[1, 1], [2, 4], [3, 9], [4, 16], [5, 25]],
    erklaerung: "Verdoppelt man die Seite, <strong>vervierfacht</strong> sich die Fläche — nicht verdoppelt. Weder die Quotienten noch die Produkte sind konstant. Solche Zuordnungen heißen später <em>quadratisch</em>.",
    kurve: (x) => x * x,
  },
};

function renderWeder() {
  const s = WE_SAETZE[document.getElementById("we-satz").value];
  const typ = art(s.paare);
  const xMax = Math.ceil(Math.max(...s.paare.map((p) => p[0])) * 1.2);
  const yMax = Math.ceil(Math.max(...s.paare.map((p) => p[1])) * 1.2);

  const W = 470, H = 300;
  const svg = neueFlaeche(W, H);
  const g = koordinaten(svg, {
    links: 60, unten: 236, breite: 360, hoehe: 196,
    xMax, yMax,
    xSchritt: xMax > 30 ? 10 : xMax > 12 ? 4 : xMax > 6 ? 2 : 1,
    ySchritt: yMax > 60 ? 20 : yMax > 30 ? 10 : yMax > 12 ? 4 : 2,
    xName: s.xName, yName: s.yName.replace(/ in .*/, ""), xEinheit: s.xEinheit, yEinheit: s.yEinheit,
  });
  let d = "";
  const start = typ === "anti" ? 0.9 : 0;
  for (let x = start; x <= xMax; x += xMax / 240) {
    const y = s.kurve(x);
    if (y > yMax || y < 0) continue;
    d += (d ? " L " : "M ") + g.px(x).toFixed(2) + " " + g.py(y).toFixed(2);
  }
  svg.appendChild(svgEl("path", { d, class: "zo-kurve " + typ }));
  // Zum Vergleich die Ursprungsgerade durch das erste Wertepaar: Sie zeigt,
  // wie weit die Zuordnung von "proportional" entfernt ist.
  if (typ === "weder") {
    const [x1, y1] = s.paare[0];
    const steigung = y1 / x1;
    // Am oberen Bildrand abschneiden: Bei einem großen ersten Quotienten
    // (Taxi: 5,50 € für 1 km) liefe die Gerade sonst weit aus dem Bild.
    const xEnde = Math.min(xMax, yMax / steigung);
    svg.appendChild(svgEl("line", {
      x1: g.px(0).toFixed(2), y1: g.py(0).toFixed(2),
      x2: g.px(xEnde).toFixed(2), y2: g.py(steigung * xEnde).toFixed(2),
      class: "zo-kurve prop gestrichelt",
    }));
    const beschriftungLinks = xEnde < xMax * 0.7;
    svg.appendChild(svgText(
      g.px(xEnde) + (beschriftungLinks ? 6 : -4),
      g.py(steigung * xEnde) + (beschriftungLinks ? 14 : -8),
      "wäre proportional",
      { class: "zo-punkttext", "text-anchor": beschriftungLinks ? "start" : "end" }));
  }
  s.paare.forEach(([x, y]) => {
    if (y > yMax) return;
    svg.appendChild(svgEl("circle", { cx: g.px(x).toFixed(2), cy: g.py(y).toFixed(2), r: 4.5, class: "zo-punkt " + typ }));
  });
  const mount = document.getElementById("we-mount");
  mount.innerHTML = "";
  mount.appendChild(svg);

  document.getElementById("we-tabelle").innerHTML = tabelleHtml(s.paare, {
    titel: s.titel,
    xName: s.xName + (s.xEinheit ? " in " + s.xEinheit : ""),
    yName: s.yName,
    stellen: 2,
  });

  const q = s.paare.map(([x, y]) => y / x);
  const p = s.paare.map(([x, y]) => x * y);
  document.getElementById("we-bilanz").innerHTML =
    `${urteil(typ)}<br>` +
    `<strong>Probe 1 — Quotienten y : x:</strong> ${q.map((v) => wert(v, 3)).join(", ")} → ` +
    (typ === "prop" ? `<span class="wp">alle gleich</span>` : `<span class="wo">verschieden</span>`) + "<br>" +
    `<strong>Probe 2 — Produkte x · y:</strong> ${p.map((v) => wert(v, 3)).join(", ")} → ` +
    (typ === "anti" ? `<span class="wa">alle gleich</span>` : `<span class="wo">verschieden</span>`) + "<br>" +
    s.erklaerung;

  document.getElementById("we-text").textContent = typ === "weder"
    ? "Hier hilft kein Dreisatz. Man braucht die Rechenvorschrift selbst — hier steht sie im Titel der Tabelle."
    : "Eine der beiden Proben geht auf. Erst dann darf man den Dreisatz anwenden.";
}

function initWeder() {
  document.getElementById("we-satz").addEventListener("change", renderWeder);
  renderWeder();
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

function ohneKollision(kandidaten, werte, notfall, eps = 1e-9) {
  const sauber = kandidaten.filter((kk) => {
    const alle = werte(kk);
    return alle.every((x, i) => alle.every((y, j) => i === j || Math.abs(x - y) > eps));
  });
  const gewaehlt = sauber.length ? pick(sauber) : notfall;
  if (gewaehlt === undefined) throw new Error("Aufgabengenerator ohne gültige Kandidaten");
  return gewaehlt;
}

// Aufgabe 1 — proportionaler Dreisatz.
// Die Artikel werden mitgeführt: aus Bausteinen zusammengesetzt entstünde
// sonst "eine Heft".
const A1_WAREN = [
  { was: "Hefte", eines: "ein Heft", einesGross: "Ein Heft" },
  { was: "Packungen Nudeln", eines: "eine Packung", einesGross: "Eine Packung" },
  { was: "Schrauben", eines: "eine Schraube", einesGross: "Eine Schraube" },
  { was: "Kacheln", eines: "eine Kachel", einesGross: "Eine Kachel" },
];
function generateAufgabe1() {
  const kandidaten = [];
  for (const a of [3, 4, 5, 6, 8, 9, 12]) {
    for (const stueck of [2, 3, 4, 5, 6, 7, 8, 9, 12, 15]) {
      for (const b of [2, 3, 5, 7, 8, 10, 11, 14, 15, 20]) {
        if (b === a) continue;
        kandidaten.push({ a, stueck, b });
      }
    }
  }
  const c = ohneKollision(
    kandidaten,
    (k) => [
      k.stueck * k.b,                       // richtig
      k.stueck * k.a,                       // der gegebene Preis
      k.a, k.b, k.stueck,
      (k.stueck * k.a * k.a) / k.b,         // Anzahlen vertauscht — genau der Wert des Hinweises
      k.stueck * k.a + k.b - k.a,           // Unterschied addiert statt vervielfacht
    ],
    kandidaten[0]
  );
  const { a, stueck, b } = c;
  const preisA = stueck * a, antwort = stueck * b;
  const ware = pick(A1_WAREN);

  return {
    promptHtml:
      `<strong>${num(a)} ${ware.was}</strong> kosten <strong>${num(preisA)} €</strong>.<br>` +
      `<strong>Was kosten ${num(b)} ${ware.was}?</strong> Antwort in Euro.`,
    correct: antwort,
    tolerance: 0.01,
    placeholder: "Preis in €",
    hinweis: (raw, val) => {
      if (Math.abs(val - stueck) < 0.01)
        return `${num(stueck)} € ist der Preis für <em>ein</em> Stück — das ist der Zwischenschritt, nicht die Antwort. Jetzt noch mit ${num(b)} multiplizieren.`;
      if (Math.abs(val - (preisA + b - a)) < 0.01)
        return `Du hast den Unterschied <em>addiert</em>. Bei einer proportionalen Zuordnung wird aber vervielfacht, nicht dazugezählt: ${num(b)} Stück kosten das ${num(b)}-fache von einem Stück.`;
      if (Math.abs(val - (preisA * a) / b) < 0.01)
        return `Du hast die beiden Anzahlen vertauscht. Geteilt wird durch die <em>gegebene</em> Anzahl ${num(a)}, multipliziert wird mit der <em>gesuchten</em> Anzahl ${num(b)}.`;
      return `Rechne zuerst den Preis für <strong>${ware.eines}</strong> aus: ${num(preisA)} € : ${num(a)}.`;
    },
    musterloesungHtml:
      `<strong>1. Gegeben:</strong> ${num(a)} ${ware.was} ↦ ${num(preisA)} €<br>` +
      `<strong>2. Auf eine Einheit:</strong> beide Seiten : ${num(a)} → ${ware.einesGross} ↦ ${num(stueck)} €<br>` +
      `<strong>3. Auf ${num(b)} hoch:</strong> beide Seiten · ${num(b)} → ${num(b)} ${ware.was} ↦ <strong>${num(antwort)} €</strong><br>` +
      `<em>Probe:</em> ${num(antwort)} € : ${num(b)} = ${num(stueck)} € — derselbe Stückpreis wie oben. ` +
      `Und ${num(b)} ${b > a ? "ist mehr" : "ist weniger"} als ${num(a)}, also muss das Ergebnis ${b > a ? "größer" : "kleiner"} als ${num(preisA)} € sein. ✓`,
  };
}

// Aufgabe 2 — antiproportionaler Dreisatz.
const A2_KONTEXTE = [
  { x: "Arbeiter", eines: "ein Arbeiter", einesGross: "Ein Arbeiter", y: "Tage",
    satz: "brauchen für eine Mauer", frage: "Wie lange brauchen" },
  { x: "Pumpen", eines: "eine Pumpe", einesGross: "Eine Pumpe", y: "Stunden",
    satz: "brauchen zum Leeren eines Beckens", frage: "Wie lange brauchen" },
  { x: "Maschinen", eines: "eine Maschine", einesGross: "Eine Maschine", y: "Stunden",
    satz: "brauchen für einen Auftrag", frage: "Wie lange brauchen" },
];
function generateAufgabe2() {
  const kandidaten = [];
  for (const k of [24, 36, 48, 60, 72, 90, 120, 144]) {
    for (const a of teiler(k, 20)) {
      for (const b of teiler(k, 20)) {
        if (a === b || a < 2 || b < 2) continue;
        kandidaten.push({ k, a, b });
      }
    }
  }
  const c = ohneKollision(
    kandidaten,
    (t) => [t.k / t.b, t.k / t.a, t.a, t.b, t.k, (t.k / t.a) * (t.b / t.a), (t.k / t.a) + t.b - t.a],
    kandidaten[0]
  );
  const { k, a, b } = c;
  const tageA = k / a, antwort = k / b;
  const ctx = pick(A2_KONTEXTE);

  return {
    promptHtml:
      `<strong>${num(a)} ${ctx.x}</strong> ${ctx.satz} <strong>${num(tageA)} ${ctx.y}</strong>.<br>` +
      `<strong>${ctx.frage} ${num(b)} ${ctx.x}?</strong> (Alle arbeiten gleich schnell.)`,
    correct: antwort,
    tolerance: 0.01,
    placeholder: ctx.y,
    hinweis: (raw, val) => {
      if (Math.abs(val - (tageA * b) / a) < 0.01)
        return `Du hast wie bei einer proportionalen Zuordnung gerechnet. Hier gilt aber: <strong>mehr ${ctx.x} — weniger ${ctx.y}</strong>. Im mittleren Schritt wird rechts <em>multipliziert</em> statt geteilt.`;
      if (Math.abs(val - k) < 0.01)
        return `${num(k)} ist die Gesamtarbeit — so lange bräuchte <em>${ctx.eines}</em> allein. Das ist der Zwischenschritt; jetzt noch durch ${num(b)} teilen.`;
      if (Math.abs(val - (tageA + b - a)) < 0.01)
        return `Du hast den Unterschied dazugerechnet. Bei einer antiproportionalen Zuordnung wird geteilt und vervielfacht, nicht addiert.`;
      return `Rechne zuerst aus, wie lange <strong>${ctx.eines}</strong> allein bräuchte: ${num(a)} · ${num(tageA)}.`;
    },
    musterloesungHtml:
      `<strong>1. Gegeben:</strong> ${num(a)} ${ctx.x} ↦ ${num(tageA)} ${ctx.y}<br>` +
      `<strong>2. Auf eine Einheit:</strong> links : ${num(a)}, rechts <strong>· ${num(a)}</strong> → ${ctx.einesGross} ↦ ${num(k)} ${ctx.y}<br>` +
      `<strong>3. Auf ${num(b)} hoch:</strong> links · ${num(b)}, rechts <strong>: ${num(b)}</strong> → ${num(b)} ${ctx.x} ↦ <strong>${num(antwort)} ${ctx.y}</strong><br>` +
      `<em>Probe:</em> ${num(b)} · ${num(antwort)} = ${num(k)} — dasselbe Produkt wie ${num(a)} · ${num(tageA)}. ` +
      `Und ${num(b)} ${b > a ? "ist mehr" : "ist weniger"} als ${num(a)}, also muss das Ergebnis ${b > a ? "kleiner" : "größer"} sein. ✓`,
  };
}

// Aufgabe 3 — Art bestimmen und den fehlenden Wert ergänzen.
function generateAufgabe3() {
  const kandidaten = [];
  for (const anti of [false, true]) {
    for (const k of anti ? [24, 36, 48, 60, 72, 120] : [3, 4, 5, 6, 7, 8, 9, 12]) {
      const xs = anti ? teiler(k, 24).filter((t) => t >= 2) : [2, 3, 4, 5, 6, 8, 10, 12];
      if (xs.length < 4) continue;
      for (let i = 0; i < xs.length - 3; i++) {
        const vier = xs.slice(i, i + 4);
        const luecke = 2;   // der dritte Wert fehlt — nicht der erste und nicht der letzte
        kandidaten.push({ anti, k, vier, luecke });
      }
    }
  }
  const c = ohneKollision(
    kandidaten,
    (t) => {
      const x = t.vier[t.luecke];
      const y = t.anti ? t.k / x : t.k * x;
      const vor = t.vier[t.luecke - 1];
      const yVor = t.anti ? t.k / vor : t.k * vor;
      // Der häufigste Fehler ist, die falsche Art zu unterstellen.
      const falscheArt = t.anti ? (yVor * x) / vor : (yVor * vor) / x;
      return [y, falscheArt, t.k, x, vor, yVor, y + x, y - x];
    },
    kandidaten[0]
  );
  const { anti, k, vier, luecke } = c;
  const paare = vier.map((x) => [x, anti ? k / x : k * x]);
  const antwort = paare[luecke][1];
  const kontext = anti
    ? { x: "Personen", y: "Tage", titel: "Personen ↦ Tage" }
    : { x: "Meter Stoff", y: "Preis in €", titel: "Meter ↦ Preis in €" };

  const zellen = paare.map(([x, y], i) =>
    `<td>${i === luecke ? "<strong>?</strong>" : num(y, 2)}</td>`).join("");
  return {
    promptHtml:
      `Die Tabelle gehört zu einer <em>proportionalen oder antiproportionalen</em> Zuordnung — welche es ist, musst du selbst herausfinden.` +
      `<table class="zo-tabelle"><caption>${kontext.titel}</caption>` +
      `<tr><th>${kontext.x}</th>` + paare.map(([x]) => `<td>${num(x)}</td>`).join("") + `</tr>` +
      `<tr><th>${kontext.y}</th>${zellen}</tr></table>` +
      `<strong>Welcher Wert gehört an die Stelle des Fragezeichens?</strong>`,
    correct: antwort,
    tolerance: 0.01,
    placeholder: kontext.y,
    hinweis: (raw, val) => {
      const x = vier[luecke], vor = vier[luecke - 1], yVor = paare[luecke - 1][1];
      const falscheArt = anti ? (yVor * x) / vor : (yVor * vor) / x;
      if (Math.abs(val - falscheArt) < 0.01)
        return anti
          ? `Du hast die Zuordnung für proportional gehalten. Prüfe die <strong>Produkte</strong>: ${num(vier[0])} · ${num(paare[0][1], 2)} = ${num(k)} — und das gilt für alle Spalten. Also ist sie antiproportional.`
          : `Du hast die Zuordnung für antiproportional gehalten. Prüfe die <strong>Quotienten</strong>: ${num(paare[0][1], 2)} : ${num(vier[0])} = ${num(k)} — und das gilt für alle Spalten. Also ist sie proportional.`;
      if (Math.abs(val - k) < 0.01)
        return anti
          ? `${num(k)} ist das gemeinsame Produkt x · y. Um y zu bekommen, musst du es noch durch ${num(x)} teilen.`
          : `${num(k)} ist der gemeinsame Quotient y : x. Um y zu bekommen, musst du ihn noch mit ${num(x)} multiplizieren.`;
      return `Prüfe beide Proben an den bekannten Spalten: Sind alle Quotienten y : x gleich, oder alle Produkte x · y?`;
    },
    musterloesungHtml:
      `<strong>1. Art bestimmen:</strong> ` +
      (anti
        ? `Die Produkte sind ${paare.filter((_, i) => i !== luecke).map(([x, y]) => `${num(x)} · ${num(y, 2)} = ${num(k)}`).join(", ")} — alle gleich. Also <strong>antiproportional</strong>.`
        : `Die Quotienten sind ${paare.filter((_, i) => i !== luecke).map(([x, y]) => `${num(y, 2)} : ${num(x)} = ${num(k)}`).join(", ")} — alle gleich. Also <strong>proportional</strong>.`) +
      `<br><strong>2. Fehlenden Wert ausrechnen:</strong> ` +
      (anti
        ? `y = k : x = ${num(k)} : ${num(vier[luecke])} = <strong>${num(antwort, 2)}</strong>`
        : `y = k · x = ${num(k)} · ${num(vier[luecke])} = <strong>${num(antwort, 2)}</strong>`) +
      `<br><em>Probe:</em> ` +
      (anti ? `${num(vier[luecke])} · ${num(antwort, 2)} = ${num(k)} ✓` : `${num(antwort, 2)} : ${num(vier[luecke])} = ${num(k)} ✓`),
  };
}

// Aufgabe 4 — Grundpreis und Stückpreis aus zwei Angaben erschließen.
// Ganze Sätze statt Bausteinen: "eine Handytarif über 4 GB" wäre falsch.
const A4_KONTEXTE = [
  {
    x: "km", grund: "Grundpreis", je: "je Kilometer",
    gegeben: (s, c) => `Eine Taxifahrt über <strong>${num(s)} km</strong> kostet <strong>${num(c)} €</strong>`,
    frage: (s) => `Was kostet eine Taxifahrt über ${num(s)} km?`,
    einleitung: "Es gibt einen festen Grundpreis und dazu einen festen Preis je Kilometer.",
  },
  {
    x: "GB", grund: "Grundgebühr", je: "je Gigabyte",
    gegeben: (s, c) => `Ein Handytarif mit <strong>${num(s)} GB</strong> kostet <strong>${num(c)} €</strong> im Monat`,
    frage: (s) => `Was kostet der Tarif mit ${num(s)} GB?`,
    einleitung: "Es gibt eine feste Grundgebühr und dazu einen festen Preis je Gigabyte.",
  },
  {
    x: "Stunden", grund: "Anfahrtspauschale", je: "je Arbeitsstunde",
    gegeben: (s, c) => `Eine Reparatur mit <strong>${num(s)} Stunden</strong> Arbeitszeit kostet <strong>${num(c)} €</strong>`,
    frage: (s) => `Was kostet eine Reparatur mit ${num(s)} Stunden Arbeitszeit?`,
    einleitung: "Es gibt eine feste Anfahrtspauschale und dazu einen festen Preis je Arbeitsstunde.",
  },
];
function generateAufgabe4() {
  const kandidaten = [];
  for (const g of [3, 4, 5, 6, 8, 10, 12, 15]) {
    for (const p of [2, 3, 4, 5, 6, 7, 8]) {
      for (const s1 of [2, 3, 4]) {
        for (const s2 of [6, 8, 9, 10, 12]) {
          for (const s3 of [5, 7, 11, 14, 15, 20]) {
            if (s3 === s1 || s3 === s2) continue;
            kandidaten.push({ g, p, s1, s2, s3 });
          }
        }
      }
    }
  }
  const c = ohneKollision(
    kandidaten,
    (t) => {
      const c1 = t.g + t.p * t.s1, c2 = t.g + t.p * t.s2, richtig = t.g + t.p * t.s3;
      return [
        richtig,
        (c1 / t.s1) * t.s3,      // proportional aus der ersten Angabe
        (c2 / t.s2) * t.s3,      // proportional aus der zweiten Angabe
        t.p * t.s3,              // Grundpreis vergessen
        c1 + c2,                 // beide Preise addiert — der Wert des vierten Hinweises
        c1, c2, t.g, t.p, t.s3,
      ];
    },
    kandidaten[0]
  );
  const { g, p, s1, s2, s3 } = c;
  const c1 = g + p * s1, c2 = g + p * s2, antwort = g + p * s3;
  const ctx = pick(A4_KONTEXTE);

  return {
    promptHtml:
      `${ctx.gegeben(s1, c1)}, ${ctx.gegeben(s2, c2).replace(/^./, (m) => m.toLowerCase())}. ` +
      `${ctx.einleitung}<br>` +
      `<strong>${ctx.frage(s3)}</strong> Antwort in Euro.`,
    correct: antwort,
    tolerance: 0.01,
    placeholder: "Preis in €",
    hinweis: (raw, val) => {
      if (Math.abs(val - (c1 / s1) * s3) < 0.01 || Math.abs(val - (c2 / s2) * s3) < 0.01)
        return `Du hast den Dreisatz angewendet — der gilt hier aber nicht: Die Zuordnung ist <strong>nicht proportional</strong>, weil bei 0 ${ctx.x} schon die ${ctx.grund} anfällt. Prüfe die Quotienten: ${num(c1)} : ${num(s1)} = ${num(c1 / s1, 2)}, aber ${num(c2)} : ${num(s2)} = ${num(c2 / s2, 2)} — verschieden.`;
      if (Math.abs(val - p * s3) < 0.01)
        return `${num(p * s3)} € ist nur der Anteil ${ctx.je}. Die ${ctx.grund} von ${num(g)} € kommt noch dazu.`;
      if (Math.abs(val - (c1 + c2)) < 0.01)
        return `Die beiden gegebenen Preise darf man nicht addieren — sie gehören zu zwei verschiedenen Fahrten, nicht zu einer längeren.`;
      return `Der Preisunterschied ${num(c2)} € − ${num(c1)} € entfällt allein auf die zusätzlichen ${num(s2 - s1)} ${ctx.x}. Daraus ergibt sich der Preis ${ctx.je}.`;
    },
    musterloesungHtml:
      `<strong>1. Preis ${ctx.je}:</strong> Der Unterschied ${num(c2)} € − ${num(c1)} € = ${num(c2 - c1)} € entfällt auf ` +
      `${num(s2)} − ${num(s1)} = ${num(s2 - s1)} ${ctx.x}, also ${num(c2 - c1)} € : ${num(s2 - s1)} = <strong>${num(p)} €</strong> ${ctx.je}.<br>` +
      `<strong>2. ${ctx.grund}:</strong> ${num(c1)} € − ${num(s1)} · ${num(p)} € = <strong>${num(g)} €</strong><br>` +
      `<strong>3. Gesuchter Preis:</strong> ${num(g)} € + ${num(s3)} · ${num(p)} € = <strong>${num(antwort)} €</strong><br>` +
      `<em>Warum kein Dreisatz?</em> Bei 0 ${ctx.x} kostet es schon ${num(g)} €. Der Graph ist zwar eine Gerade, geht aber nicht durch den Ursprung — ` +
      `die Zuordnung ist <strong>nicht proportional</strong>, und die Quotienten ${num(c1 / s1, 2)} und ${num(c2 / s2, 2)} sind verschieden.`,
  };
}

function initExercises() {
  mountUebungsaufgaben(document.getElementById("exercises-mount"), [
    { schwierigkeit: "einfach", titel: "Aufgabe 1 — proportionaler Dreisatz", generate: generateAufgabe1 },
    { schwierigkeit: "mittel", titel: "Aufgabe 2 — antiproportionaler Dreisatz", generate: generateAufgabe2 },
    { schwierigkeit: "schwierig", titel: "Aufgabe 3 — welche Art ist es?", generate: generateAufgabe3 },
    { schwierigkeit: "komplex", titel: "Aufgabe 4 — Grundpreis und Stückpreis", generate: generateAufgabe4 },
  ]);
}

// ================= Quizze =================

function initQuizzes() {
  mountQuiz(document.getElementById("quiz-zuordnung"), {
    q: "Welche der folgenden Vorschriften ist <em>keine</em> Zuordnung?",
    options: [
      "Anzahl der Brötchen ↦ Preis",
      "Schülerin ↦ ihr Geburtstag",
      "Geburtsmonat ↦ Schülerin einer Klasse",
      "Kantenlänge eines Würfels ↦ sein Volumen",
    ],
    correct: 2,
    explain: "Zu einem Geburtsmonat gehören in einer Klasse meist mehrere Schülerinnen — es gingen also mehrere Pfeile von einem Wert aus. Eine Zuordnung verlangt, dass jedem Wert genau ein Wert zugeordnet wird. Umgekehrt geht es: Jede Schülerin hat genau einen Geburtstag.",
  });
  mountQuiz(document.getElementById("quiz-proportional"), {
    q: "7 gleiche Fliesen wiegen 3,5 kg. Wie schwer sind 12 Fliesen?",
    options: ["6 kg", "8,5 kg", "5,5 kg", "42 kg"],
    correct: 0,
    explain: "Eine Fliese wiegt 3,5 kg : 7 = 0,5 kg, also wiegen 12 Fliesen 12 · 0,5 kg = 6 kg. Die 8,5 kg entstünden, wenn man den Unterschied von 5 Fliesen einfach addierte — bei proportionalen Zuordnungen wird aber vervielfacht.",
  });
  mountQuiz(document.getElementById("quiz-antiproportional"), {
    q: "6 Pumpen leeren ein Becken in 8 Stunden. Wie lange brauchen 4 Pumpen?",
    options: ["5⅓ Stunden", "12 Stunden", "10 Stunden", "6 Stunden"],
    correct: 1,
    explain: "Das Produkt bleibt gleich: 6 · 8 = 48 Pumpenstunden. Mit 4 Pumpen sind es 48 : 4 = 12 Stunden. Weniger Pumpen bedeutet mehr Zeit — wer 5⅓ herausbekommt, hat proportional gerechnet.",
  });
  mountQuiz(document.getElementById("quiz-dreisatz"), {
    q: "Beim antiproportionalen Dreisatz — was passiert im mittleren Schritt auf der rechten Seite?",
    options: [
      "dasselbe wie links: geteilt",
      "das Gegenteil: multipliziert",
      "gar nichts, die rechte Seite bleibt",
      "sie wird quadriert",
    ],
    correct: 1,
    explain: "Links wird auf eine Einheit heruntergerechnet (geteilt), rechts muss deshalb multipliziert werden — sonst bliebe das Produkt x · y nicht konstant. Genau darin unterscheidet sich der antiproportionale vom proportionalen Dreisatz.",
  });
  mountQuiz(document.getElementById("quiz-weder"), {
    q: "Ein Handytarif kostet 8 € Grundgebühr und 3 € je Gigabyte. Welche Aussage stimmt?",
    options: [
      "proportional, denn der Preis wächst gleichmäßig",
      "antiproportional, denn es gibt eine Grundgebühr",
      "weder noch — der Graph geht nicht durch den Ursprung",
      "proportional, sobald man mindestens 1 GB bucht",
    ],
    correct: 2,
    explain: "Bei 0 GB zahlt man schon 8 €. Die Quotienten sind verschieden (1 GB: 11 : 1 = 11, 2 GB: 14 : 2 = 7), die Produkte auch. Der Graph ist eine Gerade, aber keine Ursprungsgerade — deshalb ist der Dreisatz hier nicht anwendbar.",
  });
}

// ================= Start =================

initDarstellungen();
initProportional();
initAntiproportional();
initDreisatz();
initWeder();
initExercises();
initQuizzes();
