// Selbstlernpfad "Daten und Häufigkeiten" (Grundwissen Klasse 5-10).
// Rein clientseitiges Vanilla-JS, ohne Build-Schritt oder externe Bibliotheken.
//
// Leitgedanke: Aus einer Urliste wird erst dann eine Aussage, wenn man zählt,
// ordnet und zusammenfasst. Deshalb steht in Abschnitt 1 die Tabelle direkt
// neben der Urliste, und die beiden Proben (ΣH = n, Σh = 1) werden jedes Mal
// mitgerechnet. Die zweite Leitidee: "Durchschnitt" ist mehrdeutig — deshalb
// stehen Mittel, Median und Modalwert nebeneinander an denselben Daten, und
// ein Regler zeigt, welcher von ihnen auf einen Ausreißer reagiert.
//
// Durchgehende Farbcodierung: absolute Häufigkeit blau, relative Häufigkeit
// violett, arithmetisches Mittel rot, Median grün, Spannweite/Ausreißer orange.

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
  return zahlformat(digits).format(x);
}
// "=" oder "≈"? Ein gerundeter Wert darf nie mit einem Gleichheitszeichen
// dastehen — bei Mittelwerten ist das die häufigste stille Unwahrheit.
// Entscheidend ist NICHT, ob der Wert ganzzahlig ist: 9 : 2 = 4,5 ist exakt,
// 117 : 7 ≈ 16,71 ist es nicht. Geprüft wird deshalb, ob die Anzeige mit der
// gewählten Stellenzahl den Wert genau trifft.
function zeichen(x, stellen = 2) {
  const f = Math.pow(10, stellen);
  return Math.abs(x - Math.round(x * f) / f) < 1e-12 ? "=" : "≈";
}
function randInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
// Fisher-Yates: liefert eine zufällige Auswahl OHNE Verwerfen und Neuziehen.
function mischen(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function parseFlexibleNumber(raw) {
  if (raw == null) return NaN;
  const s = String(raw).trim().replace(/\s/g, "").replace(/−/g, "-").replace(/\./g, "").replace(",", ".");
  return parseFloat(s);
}
function neueFlaeche(w, h) {
  return svgEl("svg", { viewBox: `0 0 ${w} ${h}`, width: w, height: h, class: "geo-svg", preserveAspectRatio: "xMidYMid meet" });
}
function linie(p, q, klasse) {
  return svgEl("line", { x1: p.x.toFixed(2), y1: p.y.toFixed(2), x2: q.x.toFixed(2), y2: q.y.toFixed(2), class: klasse });
}
// Ein Regler darf nicht lügen: Wird ein Wert begrenzt, muss der begrenzte Wert
// auch im Regler stehen.
function begrenzt(id, wert, min, max) {
  const v = Math.min(max, Math.max(min, wert));
  const e = document.getElementById(id);
  if (Number(e.value) !== v) e.value = String(v);
  return v;
}

// ---------- Statistische Kennwerte ----------

function summe(werte) {
  return werte.reduce((a, b) => a + b, 0);
}
function mittel(werte) {
  return summe(werte) / werte.length;
}
// Median: IMMER auf der geordneten Liste, bei gerader Anzahl das Mittel der
// beiden mittleren Werte.
function median(werte) {
  const s = werte.slice().sort((a, b) => a - b);
  const n = s.length;
  const m = Math.floor(n / 2);
  return n % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
// Es kann mehrere Modalwerte geben — das wird ausgewiesen und nicht versteckt.
function modalwerte(werte) {
  const z = new Map();
  werte.forEach((w) => z.set(w, (z.get(w) || 0) + 1));
  const maxH = Math.max(...z.values());
  return [...z.entries()].filter(([, h]) => h === maxH).map(([w]) => w).sort((a, b) => a - b);
}
function spannweite(werte) {
  return Math.max(...werte) - Math.min(...werte);
}
// Strichliste: Fünferbündel werden durchgestrichen dargestellt.
function strichliste(h) {
  let s = "";
  for (let i = 0; i < Math.floor(h / 5); i++) s += '<span class="fuenf">IIII</span>';
  s += "I".repeat(h % 5);
  return s || "&ndash;";
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

// ================= 1. Von der Urliste zur Häufigkeitstabelle =================

let urDaten = [];

function neueUrliste() {
  const n = Number(document.getElementById("ur-n").value);
  urDaten = Array.from({ length: n }, () => randInt(1, 6));
  renderUrliste();
}

function renderUrliste() {
  const n = Number(document.getElementById("ur-n").value);
  document.getElementById("ur-n-anzeige").textContent = n;
  if (urDaten.length !== n) {
    // Regler bewegt: Liste verlängern oder kürzen, statt sie ganz neu zu würfeln
    while (urDaten.length < n) urDaten.push(randInt(1, 6));
    urDaten.length = n;
  }

  const liste = document.getElementById("ur-liste");
  liste.innerHTML = "";
  const haeufigste = modalwerte(urDaten);
  urDaten.forEach((w) => {
    liste.appendChild(el("span", { class: "da-wert" + (haeufigste.includes(w) ? " markiert" : "") }, String(w)));
  });

  let zeilen = '<tr><th>Augenzahl x</th><th>Strichliste</th><th>H(x)</th><th>h(x)</th><th>h(x) in %</th></tr>';
  let summeH = 0, summeRel = 0;
  for (let x = 1; x <= 6; x++) {
    const H = urDaten.filter((w) => w === x).length;
    const h = H / n;
    summeH += H;
    summeRel += h;
    zeilen += `<tr><td><strong>${x}</strong></td><td class="strich">${strichliste(H)}</td>` +
      `<td class="abs">${H}</td><td class="rel">${num(h, 3)}</td><td class="rel">${num(h * 100, 1)} %</td></tr>`;
  }
  zeilen += `<tr class="summe"><td>Summe</td><td></td><td class="abs">${summeH}</td>` +
    `<td class="rel">${num(summeRel, 3)}</td><td class="rel">${num(summeRel * 100, 1)} %</td></tr>`;
  document.getElementById("ur-tabelle").innerHTML = zeilen;

  const modalText = haeufigste.length === 1
    ? `Am häufigsten kam die <span class="wa">${haeufigste[0]}</span> vor`
    : `Am häufigsten kamen <span class="wa">${haeufigste.join(" und ")}</span> vor`;
  document.getElementById("ur-bilanz").innerHTML =
    `n = <span class="wa">${n}</span> Würfe. ${modalText} — ` +
    `<span class="wa">H = ${urDaten.filter((w) => w === haeufigste[0]).length}</span>, also ` +
    `<span class="wr">h = ${urDaten.filter((w) => w === haeufigste[0]).length} : ${n} ${zeichen(urDaten.filter((w) => w === haeufigste[0]).length / n, 3)} ${num(urDaten.filter((w) => w === haeufigste[0]).length / n, 3)}</span>.<br>` +
    `Probe: die absoluten Häufigkeiten ergeben zusammen <span class="wa">${summeH}</span> = n, ` +
    `die relativen zusammen <span class="wr">${num(summeRel, 3)}</span> = 1.`;

  document.getElementById("ur-text").textContent =
    "Die Urliste zeigt die Werte in der Reihenfolge der Erhebung. In der Tabelle steht jeder mögliche Wert nur einmal — mit der Anzahl daneben. Das ist derselbe Datensatz, nur geordnet.";
}

function initUrliste() {
  document.getElementById("ur-n").addEventListener("input", renderUrliste);
  document.getElementById("ur-neu").addEventListener("click", neueUrliste);
  neueUrliste();
}

// ================= 2. Säulen- und Kreisdiagramm =================

const DI_KATEGORIEN = [
  { name: "Fußball", farbe: "#2563eb" },
  { name: "Schwimmen", farbe: "#157347" },
  { name: "Radfahren", farbe: "#b3650a" },
  { name: "Turnen", farbe: "#8a5cf6" },
];
// n so wählen, dass 360 : n ganzzahlig ist — dann gehen alle Winkel glatt auf.
const DI_N = [24, 30, 36, 40, 45, 60, 72, 90];
let diH = [9, 12, 7, 8], diN = 36;

function neueUmfrage() {
  diN = pick(DI_N);
  // Konstruktive Aufteilung: drei Schnittstellen aus einem ausgedünnten Raster
  // ziehen. So ist jeder Anteil mindestens 2 — kein Verwerfen und Neuziehen.
  const raster = [];
  for (let k = 2; k <= diN - 2; k += 2) raster.push(k);
  const schnitte = mischen(raster).slice(0, 3).sort((a, b) => a - b);
  diH = [schnitte[0], schnitte[1] - schnitte[0], schnitte[2] - schnitte[1], diN - schnitte[2]];
  renderDiagramm();
}

function renderDiagramm() {
  const art = document.getElementById("di-art").value;
  const gradProWert = 360 / diN;
  const svg = neueFlaeche(520, 300);
  const g = svgEl("g");

  if (art === "saeule") {
    const ox = 62, oy = 250, breite = 420, hoehe = 200;
    const maxH = Math.max(...diH);
    const skala = hoehe / maxH;
    // Gitterlinien und Achsenbeschriftung in ganzen Schritten
    const schritt = maxH <= 10 ? 1 : maxH <= 25 ? 5 : 10;
    for (let v = 0; v <= maxH; v += schritt) {
      const y = oy - v * skala;
      g.appendChild(linie({ x: ox, y }, { x: ox + breite, y }, "da-gitter"));
      g.appendChild(svgText(ox - 10, y + 4, String(v), { class: "da-achsentext", "text-anchor": "end" }));
    }
    g.appendChild(linie({ x: ox, y: oy }, { x: ox + breite, y: oy }, "da-achse"));
    g.appendChild(linie({ x: ox, y: oy }, { x: ox, y: oy - hoehe - 14 }, "da-achse"));
    g.appendChild(svgText(ox - 44, 22, "H(x)", { class: "da-achsentext", "text-anchor": "start" }));
    const sb = breite / diH.length;
    diH.forEach((H, i) => {
      const h = H * skala;
      const x = ox + i * sb + sb * 0.2;
      const w = sb * 0.6;
      g.appendChild(svgEl("rect", { x: x.toFixed(2), y: (oy - h).toFixed(2), width: w.toFixed(2), height: h.toFixed(2), class: "da-saeule" }));
      g.appendChild(svgText(x + w / 2, oy - h - 6, String(H), { class: "da-saeulentext" }));
      g.appendChild(svgText(x + w / 2, oy + 18, DI_KATEGORIEN[i].name, { class: "da-achsentext" }));
    });
  } else {
    const M = { x: 260, y: 145 }, r = 108;
    let start = -90;
    diH.forEach((H, i) => {
      const winkel = H * gradProWert;
      const ende = start + winkel;
      const p1 = { x: M.x + r * Math.cos((start * Math.PI) / 180), y: M.y + r * Math.sin((start * Math.PI) / 180) };
      const p2 = { x: M.x + r * Math.cos((ende * Math.PI) / 180), y: M.y + r * Math.sin((ende * Math.PI) / 180) };
      const gross = winkel > 180 ? 1 : 0;
      g.appendChild(svgEl("path", {
        d: `M ${M.x} ${M.y} L ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} A ${r} ${r} 0 ${gross} 1 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)} Z`,
        fill: DI_KATEGORIEN[i].farbe, "fill-opacity": 0.55, class: "da-sektor",
      }));
      // Ein schmaler Sektor ist schmaler als seine Beschriftung — die kommt
      // dann nach außen, sonst überdeckt sie die Nachbarsektoren.
      const mitte = ((start + ende) / 2) * Math.PI / 180;
      const abstand = winkel < 32 ? 1.18 : 0.62;
      g.appendChild(svgText(M.x + r * abstand * Math.cos(mitte), M.y + r * abstand * Math.sin(mitte) + 4,
        num(winkel, 1) + "°", { class: winkel < 32 ? "da-achsentext" : "da-sektortext" }));
      start = ende;
    });
    g.appendChild(svgText(M.x, 288, "der volle Kreis = 360° = alle " + diN + " Antworten", { class: "da-achsentext" }));
  }

  svg.appendChild(g);
  const mount = document.getElementById("di-mount");
  mount.innerHTML = "";
  mount.appendChild(svg);

  document.getElementById("di-legende").innerHTML = DI_KATEGORIEN
    .map((k, i) => `<span><span class="punkt" style="background:${k.farbe}"></span>${k.name}: ${diH[i]}</span>`)
    .join("");

  let zeilen = '<tr><th>Kategorie</th><th>H</th><th>h = H : n</th><th>α = h · 360°</th></tr>';
  diH.forEach((H, i) => {
    zeilen += `<tr><td>${DI_KATEGORIEN[i].name}</td><td class="abs">${H}</td>` +
      `<td class="rel">${num(H / diN, 4)}</td><td class="rel">${num(H * gradProWert, 1)}°</td></tr>`;
  });
  zeilen += `<tr class="summe"><td>Summe</td><td class="abs">${diN}</td><td class="rel">1</td><td class="rel">360°</td></tr>`;
  document.getElementById("di-tabelle").innerHTML = zeilen;

  const groesste = diH.indexOf(Math.max(...diH));
  document.getElementById("di-bilanz").innerHTML =
    `n = <span class="wa">${diN}</span> Antworten, also entspricht <strong>eine</strong> Antwort ` +
    `<span class="wr">360° : ${diN} = ${num(gradProWert, 2)}°</span>.<br>` +
    `${DI_KATEGORIEN[groesste].name}: <span class="wa">H = ${diH[groesste]}</span> → ` +
    `<span class="wr">h = ${diH[groesste]} : ${diN} ${zeichen(diH[groesste] / diN, 4)} ${num(diH[groesste] / diN, 4)}</span> → ` +
    // Gerechnet wird mit dem BRUCH, nicht mit der gerundeten Dezimalzahl —
    // sonst stünde eine gerundete Zahl mal 360° mit einem Gleichheitszeichen
    // vor einem exakten Ergebnis.
    `<span class="wr">α = (${diH[groesste]} : ${diN}) · 360° = ${num(diH[groesste] * gradProWert, 1)}°</span><br>` +
    `Probe: alle Winkel zusammen ergeben <strong>${num(summe(diH) * gradProWert, 1)}°</strong>.`;

  document.getElementById("di-text").textContent = art === "saeule"
    ? "Im Säulendiagramm liest man die Anzahlen direkt ab und vergleicht sie untereinander. Der Anteil am Ganzen ist hier nur mühsam zu sehen."
    : "Im Kreisdiagramm sieht man sofort, welcher Anteil auf jede Kategorie entfällt. Die genauen Anzahlen sind dafür schwer abzulesen.";
}

function initDiagramm() {
  document.getElementById("di-art").addEventListener("change", renderDiagramm);
  document.getElementById("di-neu").addEventListener("click", neueUmfrage);
  neueUmfrage();
}

// ================= 3. Mittelwert, Median, Modalwert =================

let mwBasis = [4, 6, 6, 9, 11, 14];

function neueMwDaten() {
  // fünf verschiedene Werte ziehen und einen davon verdoppeln — so gibt es
  // einen klaren Modalwert, ohne Verwerfen und Neuziehen.
  const auswahl = mischen(Array.from({ length: 17 }, (_, i) => i + 2)).slice(0, 5);
  mwBasis = auswahl.concat([pick(auswahl)]).sort((a, b) => a - b);
  renderMittelwerte();
}

function renderMittelwerte() {
  const beweglich = begrenzt("mw-ausreisser", Number(document.getElementById("mw-ausreisser").value), 1, 60);
  document.getElementById("mw-ausreisser-anzeige").textContent = beweglich;
  const daten = mwBasis.concat([beweglich]);
  const xq = mittel(daten);
  const md = median(daten);
  const mo = modalwerte(daten);
  const sp = spannweite(daten);

  // FESTE Achse über den ganzen Reglerbereich. Eine mitwachsende Achse wäre
  // hier fatal: Beim Schieben des Ausreißers würde das ganze Bild kleiner, und
  // dann wandern Mittel UND Median scheinbar nach links — genau das Gegenteil
  // dessen, was der Abschnitt zeigen soll.
  const achsenMax = 60;
  const svg = neueFlaeche(560, 240);
  const g = svgEl("g");
  const ox = 30, breite = 500, oy = 175;
  const xv = (v) => ox + (v / achsenMax) * breite;

  g.appendChild(linie({ x: ox, y: oy }, { x: ox + breite, y: oy }, "da-achse"));
  const schritt = 5;
  for (let v = 0; v <= achsenMax; v += schritt) {
    g.appendChild(linie({ x: xv(v), y: oy }, { x: xv(v), y: oy + 5 }, "da-achse"));
    g.appendChild(svgText(xv(v), oy + 18, String(v), { class: "da-achsentext" }));
  }

  // Punktdiagramm: gleiche Werte stapeln sich
  const stapel = new Map();
  daten.forEach((v) => {
    const k = stapel.get(v) || 0;
    stapel.set(v, k + 1);
    g.appendChild(svgEl("circle", {
      cx: xv(v).toFixed(2), cy: (oy - 10 - k * 13).toFixed(2), r: 6,
      class: "da-punkt" + (v === Math.max(...daten) && v > md + sp / 3 ? " ausreisser" : ""),
    }));
  });

  g.appendChild(linie({ x: xv(xq), y: 40 }, { x: xv(xq), y: oy }, "da-mittel"));
  g.appendChild(svgText(xv(xq), 33, "x̄ " + zeichen(xq, 2) + " " + num(xq, 2), { class: "da-mittel-text" }));
  g.appendChild(linie({ x: xv(md), y: 58 }, { x: xv(md), y: oy }, "da-median"));
  g.appendChild(svgText(xv(md), 72, "Median " + zeichen(md, 2) + " " + num(md, 2), { class: "da-median-text" }));

  const yS = oy + 34;
  g.appendChild(linie({ x: xv(Math.min(...daten)), y: yS }, { x: xv(Math.max(...daten)), y: yS }, "da-spanne"));
  for (const v of [Math.min(...daten), Math.max(...daten)]) {
    g.appendChild(linie({ x: xv(v), y: yS - 5 }, { x: xv(v), y: yS + 5 }, "da-spanne"));
  }
  g.appendChild(svgText((xv(Math.min(...daten)) + xv(Math.max(...daten))) / 2, yS + 18,
    "Spannweite = " + num(sp), { class: "da-spanne-text" }));

  svg.appendChild(g);
  const mount = document.getElementById("mw-mount");
  mount.innerHTML = "";
  mount.appendChild(svg);

  document.getElementById("mw-karten").innerHTML =
    `<div class="da-karte mittel"><span class="name">arithm. Mittel</span><span class="wert">${zeichen(xq, 2) === "=" ? "" : "≈ "}${num(xq, 2)}</span></div>` +
    `<div class="da-karte median"><span class="name">Median</span><span class="wert">${num(md, 2)}</span></div>` +
    `<div class="da-karte modal"><span class="name">Modalwert${mo.length > 1 ? "e" : ""}</span><span class="wert">${mo.join(" · ")}</span></div>` +
    `<div class="da-karte spanne"><span class="name">Spannweite</span><span class="wert">${num(sp)}</span></div>`;

  const sortiert = daten.slice().sort((a, b) => a - b);
  document.getElementById("mw-bilanz").innerHTML =
    `geordnet: ${sortiert.map((v) => (v === md ? `<strong class="wz">${v}</strong>` : v)).join(" · ")}<br>` +
    `<span class="wm">x̄ = (${sortiert.join(" + ")}) : ${daten.length} = ${num(summe(daten))} : ${daten.length} ${zeichen(xq, 3)} ${num(xq, 3)}</span><br>` +
    `<span class="wz">Median = ${num(md)}</span> — der ${(daten.length + 1) / 2}. Wert der geordneten Liste.<br>` +
    `Abstand der beiden: <span class="wo">${zeichen(Math.abs(xq - md), 2)} ${num(Math.abs(xq - md), 2)}</span>`;

  // Genau formuliert: Der Median ist NICHT völlig unbeweglich — er rückt beim
  // Verschieben höchstens auf den benachbarten Datenwert. Unbegrenzt wandern
  // kann nur das arithmetische Mittel. Ein "der Median bleibt liegen" wäre an
  // dieser Stelle bequem, aber falsch.
  document.getElementById("mw-text").textContent =
    xq - md > 1.5
      ? "Der große Wert zieht das arithmetische Mittel weit nach rechts. Der Median rückt höchstens auf den nächsten Datenwert — mehr kann ein einzelner Ausreißer bei ihm nicht bewirken. Deshalb beschreibt der Median solche Daten besser."
      : xq - md < -1.5
        ? "Der kleine Wert zieht das arithmetische Mittel weit nach links. Der Median rückt höchstens auf den nächsten Datenwert."
        : "Ohne Ausreißer liegen Mittel und Median dicht beieinander. Schiebe den Regler nach rechts und beobachte, wie weit jeder der beiden wandert.";
}

function initMittelwerte() {
  document.getElementById("mw-ausreisser").addEventListener("input", renderMittelwerte);
  document.getElementById("mw-neu").addEventListener("click", neueMwDaten);
  neueMwDaten();
}

// ================= 4. Die Waage =================

let waDaten = [20, 35, 50, 65, 80];

function neueWaDaten() {
  // Vier Werte frei ziehen, den fünften so wählen, dass die Summe durch 5
  // teilbar ist — dann ist x̄ ganzzahlig und der Knopf trifft exakt.
  const vier = mischen(Array.from({ length: 71 }, (_, i) => i + 12)).slice(0, 4);
  const rest = summe(vier) % 5;
  const moeglich = [];
  for (let v = 12; v <= 88; v++) if ((v + rest) % 5 === 0 && !vier.includes(v)) moeglich.push(v);
  waDaten = vier.concat([pick(moeglich)]).sort((a, b) => a - b);
  renderWaage();
}

function renderWaage() {
  const p = begrenzt("wa-punkt", Number(document.getElementById("wa-punkt").value), 0, 100);
  document.getElementById("wa-punkt-anzeige").textContent = p;
  const xq = mittel(waDaten);
  const abweichungen = waDaten.map((v) => v - p);
  const moment = summe(abweichungen);

  const svg = neueFlaeche(560, 240);
  const g = svgEl("g");
  const ox = 30, breite = 500, oy = 140;
  const xv = (v) => ox + (v / 100) * breite;

  // Skala
  g.appendChild(linie({ x: ox, y: oy + 52 }, { x: ox + breite, y: oy + 52 }, "da-achse"));
  for (let v = 0; v <= 100; v += 10) {
    g.appendChild(linie({ x: xv(v), y: oy + 52 }, { x: xv(v), y: oy + 57 }, "da-achse"));
    g.appendChild(svgText(xv(v), oy + 70, String(v), { class: "da-achsentext" }));
  }

  // Der Balken kippt proportional zum Gesamtmoment. Die Neigung wird so
  // begrenzt, dass das längere Balkenende im Bild bleibt — steht der
  // Drehpunkt am Rand, ist dieser Arm 500 px lang und schon 6° zu viel.
  const dreh = { x: xv(p), y: oy };
  const maxArm = Math.max(Math.abs(xv(0) - dreh.x), Math.abs(xv(100) - dreh.x), 1);
  const maxRad = Math.asin(Math.min(1, 44 / maxArm));
  const roh = (moment / (waDaten.length * 26)) * (14 * Math.PI) / 180;
  const rad = Math.max(-maxRad, Math.min(maxRad, roh));
  const punktAuf = (v) => {
    const dx = xv(v) - dreh.x;
    return { x: dreh.x + dx * Math.cos(rad), y: dreh.y + dx * Math.sin(rad) };
  };
  const a = punktAuf(0), b = punktAuf(100);
  g.appendChild(linie(a, b, "da-balken"));
  // Dicht beieinander liegende Werte werden gestapelt, sonst deckt ein
  // Gewicht das andere zu und die Beschriftungen sind unlesbar.
  const belegt = [];
  waDaten.forEach((v) => {
    const q = punktAuf(v);
    let etage = 0;
    while (belegt.some((b) => b.etage === etage && Math.abs(b.x - q.x) < 24)) etage++;
    belegt.push({ x: q.x, etage });
    const yo = q.y - 24 - etage * 25;
    g.appendChild(svgEl("rect", { x: (q.x - 11).toFixed(2), y: yo.toFixed(2), width: 22, height: 22, rx: 3, class: "da-gewicht" }));
    g.appendChild(svgText(q.x, yo + 16, String(v), { class: "da-saeulentext" }));
  });
  g.appendChild(svgEl("polygon", {
    points: `${dreh.x.toFixed(2)},${(dreh.y + 2).toFixed(2)} ${(dreh.x - 12).toFixed(2)},${(dreh.y + 46).toFixed(2)} ${(dreh.x + 12).toFixed(2)},${(dreh.y + 46).toFixed(2)}`,
    class: "da-drehpunkt",
  }));
  g.appendChild(linie({ x: xv(xq), y: 26 }, { x: xv(xq), y: oy + 52 }, "da-mittel"));
  g.appendChild(svgText(xv(xq), 20, "x̄ = " + num(xq), { class: "da-mittel-text" }));

  svg.appendChild(g);
  const mount = document.getElementById("wa-mount");
  mount.innerHTML = "";
  mount.appendChild(svg);

  document.getElementById("wa-bilanz").innerHTML =
    `Werte: ${waDaten.join(" · ")} &nbsp;→&nbsp; <span class="wm">x̄ = ${num(summe(waDaten))} : ${waDaten.length} = ${num(xq)}</span><br>` +
    `Abweichungen vom Drehpunkt ${p}: ` +
    abweichungen.map((d) => `<span class="${d >= 0 ? "wa" : "wo"}">${d >= 0 ? "+" : ""}${num(d)}</span>`).join(" · ") + "<br>" +
    `Summe der Abweichungen: <strong class="${moment === 0 ? "wm" : "wo"}">${moment >= 0 ? "+" : ""}${num(moment)}</strong>` +
    (moment === 0 ? " — der Balken ist im Gleichgewicht." : " — der Balken kippt nach " + (moment > 0 ? "rechts." : "links."));

  document.getElementById("wa-text").textContent = moment === 0
    ? "Genau im arithmetischen Mittel heben sich alle Abweichungen auf. Das ist keine Beobachtung, sondern folgt direkt aus x̄ = Summe : Anzahl."
    : "Verschiebe den Drehpunkt, bis die Summe der Abweichungen 0 ist. Dieser Punkt ist das arithmetische Mittel — und nur dieser.";
}

function initWaage() {
  document.getElementById("wa-punkt").addEventListener("input", renderWaage);
  document.getElementById("wa-neu").addEventListener("click", neueWaDaten);
  document.getElementById("wa-ans-mittel").addEventListener("click", () => {
    document.getElementById("wa-punkt").value = String(mittel(waDaten));
    renderWaage();
  });
  neueWaDaten();
}

// ================= 5. Diagramme ehrlich lesen =================

const MA_WERTE = [92, 95, 97, 99];
const MA_NAMEN = ["Mo", "Di", "Mi", "Do"];

function balkenBild(start, hervor) {
  const svg = neueFlaeche(260, 210);
  const g = svgEl("g");
  const ox = 42, oy = 168, breite = 200, hoehe = 138;
  const maxW = Math.max(...MA_WERTE);
  const spanne = Math.max(1, maxW - start);
  const yv = (v) => oy - ((v - start) / spanne) * hoehe;
  const schritt = spanne <= 12 ? 2 : spanne <= 30 ? 5 : 20;
  for (let v = start; v <= maxW; v += schritt) {
    g.appendChild(linie({ x: ox, y: yv(v) }, { x: ox + breite, y: yv(v) }, "da-gitter"));
    g.appendChild(svgText(ox - 6, yv(v) + 4, String(v), { class: "da-achsentext", "text-anchor": "end" }));
  }
  g.appendChild(linie({ x: ox, y: oy }, { x: ox + breite, y: oy }, "da-achse"));
  g.appendChild(linie({ x: ox, y: oy }, { x: ox, y: 20 }, "da-achse"));
  const sb = breite / MA_WERTE.length;
  MA_WERTE.forEach((v, i) => {
    const y = yv(v);
    g.appendChild(svgEl("rect", {
      x: (ox + i * sb + sb * 0.18).toFixed(2), y: y.toFixed(2),
      width: (sb * 0.64).toFixed(2), height: (oy - y).toFixed(2),
      class: "da-saeule" + (hervor ? " hervor" : ""),
    }));
    g.appendChild(svgText(ox + i * sb + sb * 0.5, y - 5, String(v), { class: "da-saeulentext" }));
    g.appendChild(svgText(ox + i * sb + sb * 0.5, oy + 16, MA_NAMEN[i], { class: "da-achsentext" }));
  });
  g.appendChild(svgText(ox + breite / 2, 202, "Achse ab " + start, { class: "da-achsentext" }));
  svg.appendChild(g);
  return svg;
}

function renderManipulation() {
  // Der Achsenanfang muss unter dem kleinsten Wert bleiben, sonst gäbe es
  // keine Säule mehr. Ein begrenzter Wert wird in den Regler zurückgeschrieben.
  const start = begrenzt("ma-start", Number(document.getElementById("ma-start").value), 0, Math.min(...MA_WERTE) - 2);
  document.getElementById("ma-start-anzeige").textContent = start;
  document.getElementById("ma-caption-b").textContent = "rechts: Achse ab " + start;

  for (const [id, s, hervor] of [["ma-mount-a", 0, false], ["ma-mount-b", start, true]]) {
    const m = document.getElementById(id);
    m.innerHTML = "";
    m.appendChild(balkenBild(s, hervor));
  }

  const min = Math.min(...MA_WERTE), max = Math.max(...MA_WERTE);
  const echtes = max / min;
  const gezeigtes = start >= min ? Infinity : (max - start) / (min - start);
  document.getElementById("ma-bilanz").innerHTML =
    `Die Werte sind in beiden Diagrammen dieselben: ${MA_WERTE.join(" · ")}.<br>` +
    `Wirkliches Verhältnis größter zu kleinster Wert: <span class="wa">${max} : ${min} ≈ ${num(echtes, 2)}</span> — die Werte unterscheiden sich also nur um ${num(((max - min) / min) * 100, 1)} %.<br>` +
    `Verhältnis der gezeichneten Säulenhöhen rechts: <span class="wo">${max - start} : ${min - start} ${zeichen(gezeigtes, 2)} ${num(gezeigtes, 2)}</span>` +
    (start === 0 ? " — bei Achsenanfang 0 stimmen beide überein." : " — das ist rund " + num(gezeigtes / echtes, 1) + "-mal so groß wie das wirkliche Verhältnis.");

  document.getElementById("ma-text").textContent = start === 0
    ? "Beginnt die Achse bei 0, ist die Säulenhöhe zum Wert proportional: Ein doppelt so großer Wert gibt eine doppelt so hohe Säule."
    : "Rechts ist der Sockel abgeschnitten. Die Säulen zeigen nur noch die Unterschiede über " + start + " — die Höhen sind zu den Werten nicht mehr proportional.";
}

function initManipulation() {
  document.getElementById("ma-start").addEventListener("input", renderManipulation);
  renderManipulation();
}

// ================= 8. Gestaffelte Übungsaufgaben =================

// Die Werkbank für die Übungsaufgaben ist für alle Grundwissen-Seiten dieselbe und steht in
// ../../aufgaben.js. Mitgegeben wird nur, wie DIESE Seite eine Eingabe als Zahl liest.
const mountUebungsaufgaben = (container, defs) =>
  mountUebungsaufgabenBasis(container, defs, { parse: parseFlexibleNumber });

// ---------- Aufgaben-Definitionen ----------

// Wählt einen Parameter so, dass Lösung und alle Fehlerwerte paarweise
// verschieden bleiben — kein Verwerfen und Neuziehen, sondern Auswahl aus
// einer vorher gefilterten Liste.
function ohneKollision(kandidaten, werte, notfall, eps = 1e-9) {
  const sauber = kandidaten.filter((kk) => {
    const alle = werte(kk);
    return alle.every((x, i) => alle.every((y, j) => i === j || Math.abs(x - y) > eps));
  });
  return sauber.length ? pick(sauber) : notfall;
}

const A1_FARBEN = ["Blau", "Rot", "Grün", "Gelb"];

// Aufgabe 1 — relative Häufigkeit in Prozent. n so gewählt, dass der
// Prozentsatz für jedes H ganzzahlig ist (20, 25 und 50 teilen 100 glatt).
function generateAufgabe1() {
  const n = pick([20, 25, 50]);
  const farbe = pick(A1_FARBEN);
  const kandidaten = [];
  for (let H = 2; H <= n - 2; H++) kandidaten.push(H);
  const H = ohneKollision(kandidaten, (k) => [(k * 100) / n, k, (n * 100) / k, k / n, n - k], kandidaten[0]);
  const prozent = (H * 100) / n;

  return {
    promptHtml:
      `In einer Umfrage unter <strong>${num(n)}</strong> Personen nannten <strong>${num(H)}</strong> die Farbe ` +
      `<strong>${farbe}</strong> als Lieblingsfarbe.<br>` +
      `Wie groß ist die <strong>relative Häufigkeit</strong> in Prozent?`,
    correct: prozent,
    placeholder: "h in %",
    hinweis: (raw, val) => {
      if (Math.abs(val - H) < 0.01)
        return `${num(H)} ist die <strong>absolute</strong> Häufigkeit. Die relative bekommst du erst durch Teilen: ${num(H)} : ${num(n)}.`;
      if (Math.abs(val - H / n) < 0.001)
        return `${num(H / n, 4)} ist der Anteil als <strong>Dezimalzahl</strong> — richtig gerechnet, aber die Frage lautet in Prozent. Es fehlt noch · 100.`;
      if (Math.abs(val - (n * 100) / H) < 0.01)
        return `Du hast <strong>n durch H</strong> geteilt. Die relative Häufigkeit ist H : n, also der Teil durch das Ganze.`;
      if (Math.abs(val - (n - H)) < 0.01)
        return `${num(n - H)} sind die <strong>übrigen</strong> Personen. Gefragt ist der Anteil derer, die ${farbe} nannten.`;
      return `h = H : n, und für Prozent noch · 100.`;
    },
    tipps: [
      "Die relative Häufigkeit ist ein <em>Anteil</em>: der Teil geteilt durch das Ganze.",
      `Hier also ${num(H)} : ${num(n)}.`,
      "Für Prozent wird das Ergebnis noch mit 100 multipliziert.",
    ],
    musterloesungHtml:
      `<strong>1. Anteil:</strong> h = H : n = ${num(H)} : ${num(n)} = ${num(H / n, 4)}<br>` +
      `<strong>2. In Prozent:</strong> ${num(H / n, 4)} · 100 % = <strong>${num(prozent)} %</strong><br>` +
      `<em>Probe:</em> Die übrigen ${num(n - H)} Personen machen ${num(((n - H) * 100) / n)} % aus — zusammen 100 %.`,
  };
}

// Aufgabe 2 — arithmetisches Mittel. Konstruktiv ganzzahlig: der letzte Wert
// wird so gewählt, dass die Summe durch die Anzahl teilbar ist.
function generateAufgabe2() {
  const anzahl = pick([5, 6]);
  const ersten = mischen(Array.from({ length: 28 }, (_, i) => i + 3)).slice(0, anzahl - 1);
  const s = summe(ersten);
  const moeglich = [];
  for (let v = 3; v <= 30; v++) if ((s + v) % anzahl === 0) moeglich.push(v);
  const letzter = ohneKollision(
    moeglich,
    (v) => {
      const d = ersten.concat([v]);
      return [summe(d) / anzahl, summe(d), summe(d) / (anzahl - 1), (Math.min(...d) + Math.max(...d)) / 2, median(d)];
    },
    moeglich[0]
  );
  const daten = mischen(ersten.concat([letzter]));
  const s2 = summe(daten);
  const xq = s2 / anzahl;

  return {
    promptHtml:
      `Bei ${num(anzahl)} Messungen wurden diese Werte notiert:<br>` +
      `<strong>${daten.map((v) => num(v)).join(" &nbsp;·&nbsp; ")}</strong><br>` +
      `Wie groß ist das <strong>arithmetische Mittel</strong>?`,
    correct: xq,
    placeholder: "x̄",
    hinweis: (raw, val) => {
      if (Math.abs(val - s2) < 0.01)
        return `${num(s2)} ist die <strong>Summe</strong>. Zum Mittel fehlt noch die Division durch die Anzahl ${num(anzahl)}.`;
      if (Math.abs(val - s2 / (anzahl - 1)) < 0.01)
        return `Du hast durch <strong>${num(anzahl - 1)}</strong> geteilt. Es sind aber ${num(anzahl)} Werte — geteilt wird durch n, nicht durch n − 1.`;
      if (Math.abs(val - (Math.min(...daten) + Math.max(...daten)) / 2) < 0.01)
        return `Das ist die <strong>Mitte zwischen kleinstem und größtem Wert</strong>. Für das arithmetische Mittel zählen aber alle Werte mit.`;
      if (Math.abs(val - median(daten)) < 0.01)
        return `Das ist der <strong>Median</strong> — der mittlere Wert der geordneten Liste. Gefragt ist das arithmetische Mittel.`;
      return `x̄ = Summe aller Werte : Anzahl der Werte.`;
    },
    tipps: [
      "Das arithmetische Mittel entsteht in zwei Schritten: erst alle Werte addieren, dann durch ihre Anzahl teilen.",
      `Es sind ${num(anzahl)} Werte.`,
      `Ihre Summe ist ${num(s2)} — jetzt noch durch ${num(anzahl)} teilen.`,
    ],
    musterloesungHtml:
      `<strong>1. Summe:</strong> ${daten.map((v) => num(v)).join(" + ")} = <strong>${num(s2)}</strong><br>` +
      `<strong>2. Durch die Anzahl teilen:</strong> x̄ = ${num(s2)} : ${num(anzahl)} = <strong>${num(xq)}</strong><br>` +
      `<em>Probe:</em> ${num(anzahl)} · ${num(xq)} = ${num(s2)} — das ist wieder die Summe.`,
  };
}

// Aufgabe 3 — Median bei GERADER Anzahl. Die beiden mittleren Werte bekommen
// dieselbe Parität, damit der Median ganzzahlig bleibt.
function generateAufgabe3() {
  const anzahl = pick([6, 8]);
  const halb = anzahl / 2;
  // Konstruktiv von der Mitte nach außen: Erst die beiden mittleren Werte
  // festlegen (mit gleicher Parität, damit ihr Mittel ganzzahlig bleibt),
  // dann darunter und darüber auffüllen. Nur die Mitte muss die Parität
  // teilen -- eine Liste aus lauter geraden Zahlen wäre auffällig unecht.
  // Die äußeren Werte kommen aus festen, getrennten Bereichen; damit steht
  // fest, dass m1 und m2 wirklich in der Mitte liegen.
  const unten = mischen(Array.from({ length: 12 }, (_, i) => i + 1)).slice(0, halb - 1);
  const oben = mischen(Array.from({ length: 11 }, (_, i) => i + 34)).slice(0, halb - 1);
  // Das mittlere Paar wird so gewählt, dass Median, arithmetisches Mittel und
  // die beiden Einzelwerte paarweise verschieden bleiben — sonst trüge ein
  // Hinweis denselben Wert wie die Lösung.
  const paare = [];
  for (let a = 14; a <= 24; a++) for (let d = 1; d <= 4; d++) paare.push([a, a + 2 * d]);
  const [m1, m2] = ohneKollision(
    paare,
    ([a, b]) => [(a + b) / 2, summe(unten.concat([a, b], oben)) / anzahl, a, b],
    paare[0]
  );
  const sortiert = unten.concat([m1, m2], oben).sort((a, b) => a - b);
  const md = (m1 + m2) / 2;
  const xq = summe(sortiert) / anzahl;

  // Die Urliste so drehen, dass ihre Mitte NICHT zufällig schon die richtige
  // Antwort ist -- sonst könnte der Hinweis "nicht geordnet" nie greifen.
  let daten = mischen(sortiert);
  for (let dreh = 0; dreh < anzahl; dreh++) {
    const m = (daten[halb - 1] + daten[halb]) / 2;
    if ([md, xq, m1, m2].every((w) => Math.abs(m - w) > 1e-9)) break;
    daten = daten.slice(1).concat(daten.slice(0, 1));
  }
  const mitteUnsortiert = (daten[halb - 1] + daten[halb]) / 2;

  return {
    promptHtml:
      `Diese ${num(anzahl)} Werte wurden erhoben:<br>` +
      `<strong>${daten.map((v) => num(v)).join(" &nbsp;·&nbsp; ")}</strong><br>` +
      `Wie groß ist der <strong>Median</strong>?`,
    correct: md,
    placeholder: "Median",
    hinweis: (raw, val) => {
      if (Math.abs(val - xq) < 0.01)
        return `Das ist das <strong>arithmetische Mittel</strong>. Der Median entsteht nicht durch Rechnen mit allen Werten, sondern durch Ordnen und Nachsehen.`;
      if (Math.abs(val - sortiert[halb - 1]) < 0.01 || Math.abs(val - sortiert[halb]) < 0.01)
        return `Bei einer <strong>geraden</strong> Anzahl gibt es zwei mittlere Werte: ${num(sortiert[halb - 1])} und ${num(sortiert[halb])}. Der Median ist ihr Mittel.`;
      if (Math.abs(val - mitteUnsortiert) < 0.01)
        return `Du hast die Mitte der <strong>Urliste</strong> genommen. Erst der Größe nach ordnen, dann die Mitte suchen.`;
      return `Zuerst ordnen, dann bei gerader Anzahl das Mittel der beiden mittleren Werte nehmen.`;
    },
    tipps: [
      "Der Median wird nicht gerechnet, sondern gefunden: zuerst die Werte der Größe nach ordnen.",
      `Bei ${num(anzahl)} Werten — einer <em>geraden</em> Anzahl — gibt es keinen einzelnen mittleren Wert, sondern zwei.`,
      "Der Median ist dann das Mittel dieser beiden.",
    ],
    musterloesungHtml:
      `<strong>1. Ordnen:</strong> ${sortiert.map((v, i) => (i === halb - 1 || i === halb ? `<strong>${num(v)}</strong>` : num(v))).join(" · ")}<br>` +
      `<strong>2. Die beiden mittleren Werte:</strong> ${num(sortiert[halb - 1])} und ${num(sortiert[halb])} (der ${num(halb)}. und der ${num(halb + 1)}. von ${num(anzahl)})<br>` +
      `<strong>3. Ihr Mittel:</strong> (${num(sortiert[halb - 1])} + ${num(sortiert[halb])}) : 2 = <strong>${num(md)}</strong><br>` +
      `<em>Zum Vergleich:</em> Das arithmetische Mittel wäre ${num(xq, 2)} — ein anderer Wert.`,
  };
}

// Aufgabe 4 — der fehlende Wert bei vorgegebenem Mittelwert (Umkehraufgabe).
function generateAufgabe4() {
  const anzahl = pick([5, 6]);
  const bekannt = mischen(Array.from({ length: 24 }, (_, i) => i + 4)).slice(0, anzahl - 1);
  const s = summe(bekannt);
  // Der gesuchte Wert soll im sinnvollen Bereich liegen; deshalb wird der
  // Mittelwert aus einer gefilterten Liste gewählt statt neu gewürfelt.
  const moegl = [];
  for (let m = 8; m <= 24; m++) {
    const fehlt = anzahl * m - s;
    if (fehlt >= 2 && fehlt <= 40) moegl.push(m);
  }
  const mittelwert = ohneKollision(
    moegl,
    (m) => [anzahl * m - s, m, anzahl * m, s, (anzahl - 1) * m - s],
    moegl.length ? moegl[0] : Math.ceil((s + anzahl) / anzahl)
  );
  const fehlend = anzahl * mittelwert - s;

  return {
    promptHtml:
      `In einem Kurs wurden ${num(anzahl)} Arbeiten geschrieben. Der <strong>Durchschnitt</strong> aller ${num(anzahl)} Punktzahlen ist <strong>${num(mittelwert)}</strong>.<br>` +
      `Von ${num(anzahl - 1)} Arbeiten sind die Punktzahlen bekannt:<br>` +
      `<strong>${bekannt.map((v) => num(v)).join(" &nbsp;·&nbsp; ")}</strong><br>` +
      `Wie viele Punkte hat die <strong>fehlende</strong> Arbeit?`,
    correct: fehlend,
    placeholder: "Punkte",
    hinweis: (raw, val) => {
      if (Math.abs(val - anzahl * mittelwert) < 0.01)
        return `${num(anzahl * mittelwert)} ist die <strong>Gesamtsumme</strong> aller ${num(anzahl)} Arbeiten. Davon müssen die ${num(anzahl - 1)} bekannten Punktzahlen noch abgezogen werden.`;
      if (Math.abs(val - s) < 0.01)
        return `${num(s)} ist die Summe der <strong>bekannten</strong> Arbeiten. Gesucht ist der Rest bis zur Gesamtsumme.`;
      if (Math.abs(val - mittelwert) < 0.01)
        return `Das ist der <strong>Durchschnitt selbst</strong>. Er wäre nur dann die Antwort, wenn die bekannten Werte zusammen genau ${num((anzahl - 1) * mittelwert)} ergäben.`;
      if (Math.abs(val - ((anzahl - 1) * mittelwert - s)) < 0.01)
        return `Du hast mit <strong>${num(anzahl - 1)}</strong> Arbeiten gerechnet. Der Durchschnitt bezieht sich auf alle ${num(anzahl)}.`;
      return `Erst die Gesamtsumme aus Durchschnitt · Anzahl, dann die bekannten Werte abziehen.`;
    },
    tipps: [
      "Aus x̄ = Summe : n lässt sich die Summe zurückgewinnen: Summe = x̄ · n.",
      `Alle ${num(anzahl)} Arbeiten ergeben zusammen ${num(mittelwert)} · ${num(anzahl)} Punkte.`,
      "Davon die bekannten Punktzahlen abziehen — was bleibt, ist die gesuchte Arbeit.",
    ],
    musterloesungHtml:
      `<strong>1. Gesamtsumme:</strong> Aus x̄ = Summe : n folgt Summe = x̄ · n = ${num(mittelwert)} · ${num(anzahl)} = <strong>${num(anzahl * mittelwert)}</strong><br>` +
      `<strong>2. Bekannte Werte:</strong> ${bekannt.map((v) => num(v)).join(" + ")} = ${num(s)}<br>` +
      `<strong>3. Rest:</strong> ${num(anzahl * mittelwert)} − ${num(s)} = <strong>${num(fehlend)} Punkte</strong><br>` +
      `<em>Probe:</em> (${num(s)} + ${num(fehlend)}) : ${num(anzahl)} = ${num(anzahl * mittelwert)} : ${num(anzahl)} = ${num(mittelwert)} ✓`,
  };
}

// Aufgabe 2 — Modalwert und Spannweite. Beides wird nicht gerechnet, sondern abgelesen: der
// häufigste Wert und der Abstand zwischen dem kleinsten und dem größten.
function generateAufgabe2b() {
  // Konstruktiv: Erst wird der Modalwert festgelegt und dreimal eingetragen, dann werden die
  // übrigen Werte aus verschiedenen Zahlen aufgefüllt — so ist der häufigste Wert eindeutig.
  const vorrat = mischen(Array.from({ length: 22 }, (_, i) => i + 4));
  const modus = vorrat[0];
  const andere = vorrat.slice(1, 1 + randInt(4, 6));
  const daten = mischen(andere.concat([modus, modus, modus]));
  const kleinste = Math.min(...daten), groesste = Math.max(...daten);
  const spann = groesste - kleinste;
  return {
    promptHtml:
      `Bei einer Erhebung wurden diese Werte notiert:<br>` +
      `<strong>${daten.map((v) => num(v)).join(" &nbsp;·&nbsp; ")}</strong>`,
    felder: [
      {
        name: "Modalwert", soll: modus, toleranz: 0.01,
        hinweis: (roh, val) => {
          if (Math.abs(val - 3) < 0.01) return "3 ist, <em>wie oft</em> der häufigste Wert vorkommt. Gefragt ist der <strong>Wert</strong> selbst.";
          if (Math.abs(val - groesste) < 0.01) return "Das ist der <strong>größte</strong> Wert. Der Modalwert ist der, der am <em>häufigsten</em> vorkommt.";
          if (Math.abs(val - median(daten)) < 0.01) return "Das ist der <strong>Median</strong>. Der Modalwert wird nicht durch Ordnen gefunden, sondern durch Zählen.";
          return "";
        },
      },
      {
        name: "Spannweite", soll: spann, toleranz: 0.01,
        hinweis: (roh, val) => {
          if (Math.abs(val - groesste) < 0.01) return `Das ist nur der größte Wert. Die Spannweite ist die <strong>Differenz</strong>: ${num(groesste)} − ${num(kleinste)}.`;
          if (Math.abs(val - (groesste + kleinste)) < 0.01) return "Du hast <strong>addiert</strong>. Die Spannweite ist die Differenz zwischen größtem und kleinstem Wert.";
          if (Math.abs(val - daten.length) < 0.01) return "Das ist die <strong>Anzahl</strong> der Werte. Die Spannweite misst, wie weit sie auseinanderliegen.";
          return "";
        },
      },
    ],
    tipps: [
      "Der <strong>Modalwert</strong> ist der Wert, der am häufigsten vorkommt — man zählt, man rechnet nicht.",
      "Die <strong>Spannweite</strong> ist die Differenz zwischen dem größten und dem kleinsten Wert.",
      `Hier ist der kleinste Wert ${num(kleinste)} und der größte ${num(groesste)}.`,
    ],
    musterloesungHtml:
      `<strong>Geordnet:</strong> ${daten.slice().sort((a, b) => a - b).map((v) => num(v)).join(" · ")}<br>` +
      `<strong>Modalwert:</strong> ${num(modus)} — dieser Wert kommt dreimal vor, jeder andere höchstens einmal.<br>` +
      `<strong>Spannweite:</strong> ${num(groesste)} − ${num(kleinste)} = <strong>${num(spann)}</strong><br>` +
      `<span class="progress-note">Beide Größen sagen etwas Verschiedenes: Der Modalwert nennt den <em>typischen</em> Wert, ` +
      `die Spannweite zeigt, wie weit die Daten <em>streuen</em>. Ein einziger Ausreißer verändert die Spannweite stark, den Modalwert gar nicht.</span>`,
  };
}

// Aufgabe 4 — vom Anteil zum Kreisdiagramm. Der Mittelpunktswinkel ist nichts anderes als der
// Anteil, nur in Grad statt in Prozent ausgedrückt.
const KREIS_N = [10, 12, 15, 18, 20, 24, 30, 36, 40, 45, 60, 72, 90, 120];
const KREIS_THEMEN = [
  { wer: "Schülerinnen und Schülern", verb: "fahren", sache: "mit dem Fahrrad zur Schule" },
  { wer: "Befragten", verb: "haben", sache: "ein Haustier" },
  { wer: "Jugendlichen", verb: "nennen", sache: "Fußball als Lieblingssport" },
  { wer: "Studierenden", verb: "haben", sache: "einen Nebenjob" },
  { wer: "Gästen", verb: "wählen", sache: "Pizza als Hauptgericht" },
];

function generateAufgabe4b() {
  const n = pick(KREIS_N);
  const thema = pick(KREIS_THEMEN);
  // H bleibt echt zwischen 0 und n, damit weder ein leeres noch ein volles Kreisdiagramm entsteht.
  // Außerdem müssen die beiden Fehlerwerte „Anteil als Dezimalzahl“ (H : n) und „die übrigen“
  // (n − H) weiter auseinanderliegen als die Rundungstoleranz: Bei H = n − 1 ist H : n fast 1,
  // und die Eingabe 1 bekäme den falschen Hinweis.
  const moeglich = [];
  for (let h = 1; h < n; h++) if (Math.abs((n - h) - h / n) > 0.05) moeglich.push(h);
  const H = pick(moeglich);
  const prozent = (H * 100) / n;
  const winkel = (H * 360) / n; // ganzzahlig, weil n ein Teiler von 360 ist
  return {
    promptHtml:
      `Von <strong>${num(n)}</strong> ${thema.wer} ${thema.verb} <strong>${num(H)}</strong> ${thema.sache}.<br>` +
      `Das Ergebnis soll in einem <strong>Kreisdiagramm</strong> dargestellt werden.<br>` +
      `<span class="progress-note">Runde den Prozentsatz auf zwei Nachkommastellen; der Winkel geht genau auf.</span>`,
    felder: [
      {
        name: "Anteil", soll: prozent, einheit: "%", toleranz: 0.015,
        hinweis: (roh, val) => {
          if (Math.abs(val - H) < 0.015) return `${num(H)} ist die <strong>absolute</strong> Häufigkeit. Der Anteil entsteht durch Teilen: ${num(H)} : ${num(n)}.`;
          if (Math.abs(val - H / n) < 0.015) return "Das ist der Anteil als <strong>Dezimalzahl</strong> — es fehlt noch die Multiplikation mit 100.";
          if (Math.abs(val - (n - H)) < 0.015) return "Das sind die <strong>übrigen</strong> Befragten. Gefragt ist der Anteil der genannten Gruppe.";
          return "";
        },
      },
      {
        name: "Mittelpunktswinkel", soll: winkel, einheit: "°", toleranz: 0.01,
        hinweis: (roh, val) => {
          if (Math.abs(val - prozent) < 0.015) return "Das ist der Anteil in <strong>Prozent</strong>. Ein Kreis hat aber nicht 100, sondern <strong>360</strong> Grad.";
          if (Math.abs(val - (360 - winkel)) < 0.01) return "Das ist der Winkel des <em>restlichen</em> Kreisstücks.";
          if (Math.abs(val - H / n) < 0.01) return "Das ist erst der Anteil. Für den Winkel muss er noch mit 360° multipliziert werden.";
          return "";
        },
      },
    ],
    tipps: [
      "Der ganze Kreis steht für alle Befragten — also für 100 % und zugleich für 360°.",
      `Der Anteil ist ${num(H)} : ${num(n)}.`,
      "Denselben Anteil mit 100 nehmen ergibt Prozent, mit 360 ergibt Grad.",
    ],
    musterloesungHtml:
      `<strong>1. Anteil:</strong> ${num(H)} : ${num(n)} = ${num(H / n, 4)}<br>` +
      `<strong>2. In Prozent:</strong> ${num(H / n, 4)} · 100 % = <strong>${num(prozent, 2)} %</strong><br>` +
      `<strong>3. Als Winkel:</strong> ${num(H / n, 4)} · 360° = <strong>${num(winkel)}°</strong><br>` +
      `<span class="progress-note">Probe: Das restliche Kreisstück misst ${num(360 - winkel)}°, zusammen also 360° ✓ &nbsp;· ` +
      `Prozent und Grad beschreiben denselben Anteil — nur die Maßeinheit des Ganzen ist verschieden: einmal 100, einmal 360.</span>`,
  };
}

// Aufgabe 6 — Mittelwert aus einer Häufigkeitstabelle. Jede Note zählt so oft, wie sie
// vorkommt; genau dieses Gewichten wird beim bloßen Addieren der Notenstufen übersehen.
function generateAufgabe6() {
  // Konstruktiv: mindestens vier Notenstufen kommen vor, damit die Tabelle nicht entartet.
  const noten = [1, 2, 3, 4, 5, 6];
  const gewaehlt = mischen(noten).slice(0, randInt(4, 6)).sort((a, b) => a - b);
  const vorn = gewaehlt.slice(1).map(() => randInt(1, 8));
  const stufen = summe(gewaehlt);
  // Die erste Häufigkeit wird aus den Werten ausgewählt, bei denen kein Fehlerwert die Lösung
  // trifft. Nötig ist das vor allem im dritten Feld: Der Durchschnitt wird auf zwei Stellen
  // gerundet, und das Mittel der bloßen Notenstufen kann ihm zufällig sehr nahe kommen — dann
  // bekäme eine falsche Rechenweise ein ✓. Verglichen wird je Feld, nicht über alle Felder
  // hinweg, denn nur innerhalb eines Feldes stören sich die Werte.
  const sauber = (k) => {
    const h = [k].concat(vorn);
    const n = summe(h);
    const p = summe(gewaehlt.map((note, i) => note * h[i]));
    const m = gewaehlt.length;
    return [[n, m, p], [p, stufen, n], [p / n, p / m, stufen / m, 3.5]]
      .every((g) => g.every((x, i) => g.every((y, j) => i === j || Math.abs(x - y) > 0.05)));
  };
  const moeglich = [1, 2, 3, 4, 5, 6, 7, 8].filter(sauber);
  const haeufig = [moeglich.length ? pick(moeglich) : 1].concat(vorn);
  const anzahl = summe(haeufig);
  const punkte = summe(gewaehlt.map((note, i) => note * haeufig[i]));
  const schnitt = punkte / anzahl;
  const stufenSumme = stufen;
  return {
    promptHtml:
      `Eine Klassenarbeit ergab diese Notenverteilung:<br>` +
      `<div class="formula-block">${gewaehlt.map((note, i) => `Note ${num(note)}: ${num(haeufig[i])}×`).join(" &nbsp;·&nbsp; ")}</div>` +
      `<span class="progress-note">Runde den Durchschnitt auf zwei Nachkommastellen.</span>`,
    felder: [
      {
        name: "Wie viele Arbeiten wurden geschrieben?", soll: anzahl, toleranz: 0.01,
        hinweis: (roh, val) => {
          if (Math.abs(val - gewaehlt.length) < 0.01) return `${num(gewaehlt.length)} ist die Zahl der <strong>Notenstufen</strong>, die vorkommen. Gefragt ist, wie viele <em>Arbeiten</em> es insgesamt sind.`;
          if (Math.abs(val - punkte) < 0.01) return "Das ist die Summe aller Noten. Gefragt ist zunächst nur, wie viele Arbeiten es sind.";
          return "";
        },
      },
      {
        name: "Summe aller Noten", soll: punkte, toleranz: 0.01,
        hinweis: (roh, val) => {
          if (Math.abs(val - stufenSumme) < 0.01) return "Du hast die <strong>Notenstufen</strong> addiert. Jede Note zählt aber so oft, wie sie vergeben wurde — sie muss mit ihrer Häufigkeit multipliziert werden.";
          if (Math.abs(val - anzahl) < 0.01) return "Das ist die Anzahl der Arbeiten. Gefragt ist die Summe der <em>Noten</em>.";
          return "";
        },
      },
      {
        name: "Durchschnittsnote", soll: schnitt, toleranz: 0.015,
        hinweis: (roh, val) => {
          if (Math.abs(val - punkte / gewaehlt.length) < 0.015) return `Du hast durch ${num(gewaehlt.length)} geteilt — das ist die Zahl der Notenstufen. Geteilt wird durch die Zahl der <strong>Arbeiten</strong>.`;
          if (Math.abs(val - stufenSumme / gewaehlt.length) < 0.015) return "Du hast nur die vorkommenden Notenstufen gemittelt. Eine Note, die zehnmal vergeben wurde, wiegt schwerer als eine, die einmal vorkommt.";
          if (Math.abs(val - 3.5) < 0.015) return "3,5 ist die Mitte der Notenskala, nicht der Durchschnitt dieser Arbeit.";
          return "";
        },
      },
    ],
    tipps: [
      "Jede Note zählt so oft, wie sie vergeben wurde — das nennt man <em>gewichtetes</em> Mitteln.",
      `Anzahl der Arbeiten: ${haeufig.map((h) => num(h)).join(" + ")}.`,
      `Summe der Noten: ${gewaehlt.map((note, i) => `${num(note)} · ${num(haeufig[i])}`).join(" + ")}.`,
    ],
    musterloesungHtml:
      `<strong>1. Anzahl:</strong> ${haeufig.map((h) => num(h)).join(" + ")} = <strong>${num(anzahl)}</strong> Arbeiten<br>` +
      `<strong>2. Summe der Noten:</strong> ${gewaehlt.map((note, i) => `${num(note)} · ${num(haeufig[i])}`).join(" + ")} = <strong>${num(punkte)}</strong><br>` +
      `<strong>3. Durchschnitt:</strong> ${num(punkte)} : ${num(anzahl)} ≈ <strong>${num(schnitt, 2)}</strong><br>` +
      `<span class="progress-note">Wer stattdessen die vorkommenden Notenstufen mittelt (${gewaehlt.map((v) => num(v)).join(" + ")} = ${num(stufenSumme)}, ` +
      `geteilt durch ${num(gewaehlt.length)} ergibt ${num(stufenSumme / gewaehlt.length, 2)}), lässt die Häufigkeiten unter den Tisch fallen — ` +
      `eine Note, die achtmal vergeben wurde, wiegt dann genauso viel wie eine, die einmal vorkam.</span>`,
  };
}

// Aufgabe 8 — der Ausreißer. Median und arithmetisches Mittel fallen hier weit auseinander, und
// die dritte Frage macht sichtbar, warum: Das Mittel liegt über fast allen Werten.
const A8_BETRIEBE = ["einer Werkstatt", "einem Handwerksbetrieb", "einem kleinen Verlag", "einer Gärtnerei", "einem Café"];

function generateAufgabe8() {
  const anzahl = pick([7, 9]);
  const betrieb = pick(A8_BETRIEBE);
  const grund = randInt(24, 34) * 100;
  // Die Angestellten verdienen ähnlich viel, die Leitung deutlich mehr — so entsteht der
  // Ausreißer, um den es geht.
  const angestellte = Array.from({ length: anzahl - 1 }, () => grund + randInt(-4, 4) * 100);
  // Damit die Aufgabe hält, was sie verspricht, muss das Mittel wirklich ÜBER dem Median liegen.
  // Das ist nicht von selbst so: Häufen sich die Gehälter oben, kann der Median trotz Ausreißer
  // größer bleiben. Deshalb wird das Gehalt der Leitung nicht nur gewürfelt, sondern notfalls
  // angehoben — konstruktiv, ohne Verwerfen und Neuziehen.
  const sortiertAngestellte = angestellte.slice().sort((a, b) => a - b);
  const medianDanach = sortiertAngestellte[(anzahl - 1) / 2]; // die Leitung ist der größte Wert
  const summeAngestellte = summe(angestellte);
  const noetig = anzahl * (medianDanach + 200) - summeAngestellte;
  const leitung = Math.max(
    grund + randInt(20, 60) * 100,
    Math.max(...angestellte) + 500,
    Math.ceil(noetig / 100) * 100
  );
  const daten = mischen(angestellte.concat([leitung]));
  const sortiert = daten.slice().sort((a, b) => a - b);
  const md = sortiert[(anzahl - 1) / 2];
  const s = summe(daten);
  const mittel = s / anzahl;
  const ueberMittel = daten.filter((v) => v > mittel).length;
  const ueberMedian = daten.filter((v) => v > md).length;
  return {
    promptHtml:
      `In ${betrieb} arbeiten ${num(anzahl)} Personen. Ihre Monatsgehälter in Euro:<br>` +
      `<strong>${daten.map((v) => num(v)).join(" &nbsp;·&nbsp; ")}</strong><br>` +
      `<span class="progress-note">Runde das arithmetische Mittel auf zwei Nachkommastellen.</span>`,
    felder: [
      {
        name: "Median", soll: md, einheit: "€", toleranz: 0.01,
        hinweis: (roh, val) => {
          if (Math.abs(val - mittel) < 0.02) return "Das ist das <strong>arithmetische Mittel</strong>. Der Median wird nicht gerechnet, sondern durch Ordnen gefunden.";
          if (Math.abs(val - daten[(anzahl - 1) / 2]) < 0.01) return "Du hast die Mitte der <strong>Urliste</strong> genommen. Erst der Größe nach ordnen, dann die Mitte suchen.";
          if (Math.abs(val - (sortiert[0] + sortiert[anzahl - 1]) / 2) < 0.02) return "Das ist die Mitte zwischen dem kleinsten und dem größten Gehalt. Der Median ist der Wert, der in der geordneten Liste in der Mitte <em>steht</em>.";
          return "";
        },
      },
      {
        name: "Arithmetisches Mittel", soll: mittel, einheit: "€", toleranz: 0.015,
        hinweis: (roh, val) => {
          if (Math.abs(val - s) < 0.02) return `${num(s)} ist die <strong>Summe</strong>. Es fehlt noch die Division durch ${num(anzahl)}.`;
          if (Math.abs(val - s / (anzahl - 1)) < 0.02) return `Du hast durch ${num(anzahl - 1)} geteilt. Es sind ${num(anzahl)} Personen.`;
          if (Math.abs(val - md) < 0.02) return "Das ist der Median. Für das arithmetische Mittel zählen alle Werte mit — auch das hohe Gehalt der Leitung.";
          return "";
        },
      },
      {
        name: "Wie viele verdienen mehr als das arithmetische Mittel?", soll: ueberMittel, toleranz: 0.01,
        hinweis: (roh, val) => {
          if (Math.abs(val - ueberMedian) < 0.01 && ueberMedian !== ueberMittel) return "So viele verdienen mehr als der <strong>Median</strong> — das ist immer etwa die Hälfte. Gefragt ist, wie viele über dem <em>arithmetischen Mittel</em> liegen.";
          if (Math.abs(val - anzahl / 2) < 0.01) return "Die Hälfte gilt für den <strong>Median</strong>. Beim arithmetischen Mittel kann die Aufteilung ganz anders aussehen.";
          return "";
        },
      },
    ],
    tipps: [
      "Ordne die Gehälter zuerst der Größe nach — dann steht der Median in der Mitte.",
      `Für das arithmetische Mittel alle ${num(anzahl)} Gehälter addieren und durch ${num(anzahl)} teilen.`,
      "Zähle danach ab, wie viele Gehälter größer als dieses Mittel sind. Das Ergebnis überrascht oft.",
    ],
    musterloesungHtml:
      `<strong>1. Geordnet:</strong> ${sortiert.map((v, i) => (i === (anzahl - 1) / 2 ? `<strong>${num(v)}</strong>` : num(v))).join(" · ")}<br>` +
      `<strong>2. Median:</strong> der ${num((anzahl + 1) / 2)}. von ${num(anzahl)} Werten = <strong>${num(md)} €</strong><br>` +
      `<strong>3. Arithmetisches Mittel:</strong> ${num(s)} : ${num(anzahl)} ≈ <strong>${num(mittel, 2)} €</strong><br>` +
      `<strong>4. Über dem Mittel:</strong> <strong>${num(ueberMittel)}</strong> von ${num(anzahl)} Personen<br>` +
      `<span class="progress-note">Das hohe Gehalt der Leitung (${num(leitung)} €) zieht das arithmetische Mittel um ${num(mittel - md, 2)} € über den Median. ` +
      `Deshalb verdienen nur ${num(ueberMittel)} Personen mehr als „den Durchschnitt“, aber ${num(ueberMedian)} mehr als den Median. ` +
      `Wenn von einem „Durchschnittsgehalt“ die Rede ist, lohnt die Nachfrage, welcher der beiden Werte gemeint ist.</span>`,
  };
}

function initExercises() {
  mountUebungsaufgaben(document.getElementById("exercises-mount"), [
    { schwierigkeit: "einfach", titel: "Aufgabe 1 — relative Häufigkeit", generate: generateAufgabe1 },
    { schwierigkeit: "einfach", titel: "Aufgabe 2 — Modalwert und Spannweite", generate: generateAufgabe2b },
    { schwierigkeit: "mittel", titel: "Aufgabe 3 — arithmetisches Mittel", generate: generateAufgabe2 },
    { schwierigkeit: "mittel", titel: "Aufgabe 4 — Anteil im Kreisdiagramm", generate: generateAufgabe4b },
    { schwierigkeit: "schwierig", titel: "Aufgabe 5 — Median", generate: generateAufgabe3 },
    { schwierigkeit: "schwierig", titel: "Aufgabe 6 — Notendurchschnitt aus der Tabelle", generate: generateAufgabe6 },
    { schwierigkeit: "komplex", titel: "Aufgabe 7 — der fehlende Wert", generate: generateAufgabe4 },
    { schwierigkeit: "komplex", titel: "Aufgabe 8 — Ein Ausreißer und der Durchschnitt", generate: generateAufgabe8 },
  ]);
}

// ================= Quizze =================

function initQuizzes() {
  mountQuiz(document.getElementById("quiz-urliste"), {
    q: "Bei einer Umfrage unter 40 Personen antworteten 10 mit „Ja“. Wie groß ist die relative Häufigkeit?",
    options: ["10", "0,25", "4", "30"],
    correct: 1,
    explain: "h = H : n = 10 : 40 = 0,25, also 25 %. Die 10 ist die absolute Häufigkeit, die 4 wäre 40 : 10 — also genau verkehrt herum geteilt.",
  });
  mountQuiz(document.getElementById("quiz-diagramme"), {
    q: "In einem Kreisdiagramm für 60 Antworten soll eine Kategorie mit 15 Antworten dargestellt werden. Wie groß ist ihr Mittelpunktswinkel?",
    options: ["15°", "90°", "60°", "25°"],
    correct: 1,
    explain: "h = 15 : 60 = 0,25 und α = 0,25 · 360° = 90°. Die 15° wären die Anzahl direkt als Gradzahl, die 25 der Prozentsatz — beides nicht der Winkel.",
  });
  mountQuiz(document.getElementById("quiz-mittelwerte"), {
    q: "Fünf Häuser kosten 200, 210, 220, 230 und 3140 (in Tausend Euro). Welcher Kennwert beschreibt den „üblichen“ Preis besser?",
    options: ["das arithmetische Mittel, weil alle Werte eingehen", "der Median, weil der eine sehr teure Preis ihn nicht verzerrt", "die Spannweite", "der Modalwert"],
    correct: 1,
    explain: "Das Mittel ist 800 — teurer als vier der fünf Häuser. Der Median ist 220 und liegt mitten im Feld. Genau dafür gibt es ihn.",
  });
  mountQuiz(document.getElementById("quiz-waage"), {
    q: "Eine Datenreihe hat das arithmetische Mittel 12. Was ergibt die Summe aller Abweichungen vom Mittelwert?",
    options: ["12", "0", "die Anzahl der Werte", "das kann man nicht sagen"],
    correct: 1,
    explain: "Die Summe der Abweichungen vom arithmetischen Mittel ist immer 0 — die Abweichungen nach oben und nach unten gleichen sich genau aus.",
  });
  mountQuiz(document.getElementById("quiz-taeuschung"), {
    q: "Ein Säulendiagramm zeigt die Werte 98 und 100, die Achse beginnt bei 97. Wie verhalten sich die gezeichneten Säulenhöhen?",
    options: ["wie 98 : 100, also fast gleich", "wie 1 : 3 — die eine Säule ist dreimal so hoch", "wie 97 : 100", "genau gleich"],
    correct: 1,
    explain: "Gezeichnet werden nur die Teile über 97, also 1 und 3. Die Säulen stehen im Verhältnis 1 : 3, obwohl sich die Werte um nur 2 % unterscheiden.",
  });
}

// ================= Start =================

initUrliste();
initDiagramm();
initMittelwerte();
initWaage();
initManipulation();
initExercises();
initQuizzes();
