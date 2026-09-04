// Selbstlernpfad "Erweiterung des Zahlenbereichs" (Grundwissen Klasse 5-10).
// Rein clientseitiges Vanilla-JS, ohne Build-Schritt oder externe Bibliotheken.
//
// Alle Rechnungen laufen ganzzahlig. Die Zahlengerade ist das durchgehende Modell: Betrag als
// Abstand zur Null, Gegenzahl als Spiegelung, Addition und Subtraktion als Bewegung nach rechts
// bzw. links. Die Vorzeichenregel für "minus mal minus" wird über eine Permanenzreihe begründet,
// nicht als Merksatz gesetzt.

"use strict";

// ---------- Helfer ----------

const SVG_NS = "http://www.w3.org/2000/svg";
function svgEl(tag, attrs = {}) {
  const e = document.createElementNS(SVG_NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  return e;
}
function svgText(x, y, text, attrs = {}) {
  const t = svgEl("text", Object.assign({ x, y, "text-anchor": "middle" }, attrs));
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
function randInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function clampInt(v, lo, hi) {
  const n = Math.round(Number(v));
  if (isNaN(n)) return lo;
  return Math.max(lo, Math.min(hi, n));
}
function ggT(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    const t = a % b;
    a = b;
    b = t;
  }
  return a || 1;
}
function bruchHtml(z, n, cls = "") {
  return `<span class="bruch ${cls}"><span class="z">${z}</span><span class="n">${n}</span></span>`;
}
// Vorzeichenbehaftete Zahl mit typografischem Minus.
function zahl(n) {
  return String(n).replace("-", "−");
}
// In Klammern, wenn negativ — so wie man es schreiben muss: 3 − (−5).
function inKlammern(n) {
  return n < 0 ? `(${zahl(n)})` : String(n);
}
function parseFlexibleNumber(raw) {
  if (raw == null) return NaN;
  let s = String(raw).trim().replace(/\s/g, "").replace(/−/g, "-");
  if (s.includes("/")) {
    const [a, b] = s.split("/").map((p) => parseFloat(p.replace(",", ".")));
    return a / b;
  }
  return parseFloat(s.replace(",", "."));
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

// ---------- Zahlengerade ----------

const ZG = { w: 640, h: 110, rand: 26, achseY: 62 };

// Baut eine Zahlengerade von "von" bis "bis" und gibt SVG plus Koordinatenfunktion zurück.
function zahlengerade(von, bis) {
  const svg = svgEl("svg", { viewBox: `0 0 ${ZG.w} ${ZG.h}`, class: "zahlengerade", preserveAspectRatio: "xMidYMid meet" });
  const x = (v) => ZG.rand + ((v - von) / (bis - von)) * (ZG.w - 2 * ZG.rand);

  svg.appendChild(svgEl("line", { x1: ZG.rand - 12, y1: ZG.achseY, x2: ZG.w - ZG.rand + 12, y2: ZG.achseY, class: "zg-achse" }));
  svg.appendChild(
    svgEl("path", { d: `M ${ZG.w - ZG.rand + 12} ${ZG.achseY} L ${ZG.w - ZG.rand + 3} ${ZG.achseY - 5} M ${ZG.w - ZG.rand + 12} ${ZG.achseY} L ${ZG.w - ZG.rand + 3} ${ZG.achseY + 5}`, class: "zg-achse", fill: "none" })
  );
  // Beschriftung ausdünnen, damit sie bei großen Bereichen lesbar bleibt.
  const schritt = Math.max(1, Math.ceil((bis - von) / 26));
  for (let v = von; v <= bis; v++) {
    const nullStrich = v === 0;
    svg.appendChild(
      svgEl("line", { x1: x(v), y1: ZG.achseY - (nullStrich ? 9 : 5), x2: x(v), y2: ZG.achseY + (nullStrich ? 9 : 5), class: nullStrich ? "zg-null" : "zg-strich" })
    );
    if (nullStrich || v % schritt === 0) {
      svg.appendChild(svgText(x(v), ZG.achseY + 22, zahl(v), { class: "zg-beschriftung" + (nullStrich ? " null" : "") }));
    }
  }
  return { svg, x };
}

function punkt(svg, x, klasse, label, labelKlasse, dy = -14) {
  svg.appendChild(svgEl("circle", { cx: x, cy: ZG.achseY, r: 5.5, class: klasse }));
  if (label != null) svg.appendChild(svgText(x, ZG.achseY + dy, label, { class: "zg-label " + labelKlasse }));
}

// ================= 1. Warum ein neuer Zahlenbereich? =================

const KONTEXTE = {
  temp: {
    einheit: "°C",
    positiv: (v) => `${zahl(v)} °C — ${v} Grad über dem Gefrierpunkt.`,
    negativ: (v) => `${zahl(v)} °C — ${Math.abs(v)} Grad <strong>unter</strong> dem Gefrierpunkt. Es friert.`,
    null: "0 °C — genau der Gefrierpunkt, der Nullpunkt dieser Skala.",
  },
  konto: {
    einheit: "€",
    positiv: (v) => `${zahl(v)} € — ein Guthaben von ${v} €.`,
    negativ: (v) => `${zahl(v)} € — das Konto ist mit ${Math.abs(v)} € <strong>im Minus</strong>, also ${Math.abs(v)} € Schulden.`,
    null: "0 € — das Konto ist ausgeglichen.",
  },
  hoehe: {
    einheit: "m",
    positiv: (v) => `${zahl(v)} m — ${v} Meter <strong>über</strong> dem Meeresspiegel.`,
    negativ: (v) => `${zahl(v)} m — ${Math.abs(v)} Meter <strong>unter</strong> dem Meeresspiegel.`,
    null: "0 m — genau auf Höhe des Meeresspiegels.",
  },
};

function renderKontext() {
  const art = document.getElementById("ctx-art").value;
  const v = clampInt(document.getElementById("ctx-wert").value, -50, 50);
  const k = KONTEXTE[art];
  const gegen = -v;
  document.getElementById("ctx-text").innerHTML =
    (v === 0 ? k.null : v > 0 ? k.positiv(v) : k.negativ(v)) +
    `<br><span class="progress-note">Die Null ist hier kein „nichts“, sondern ein <strong>vereinbarter Nullpunkt</strong>. ` +
    (v === 0 ? "" : `Die Gegenzahl ${zahl(gegen)} liegt genau gleich weit auf der anderen Seite davon.`) +
    `</span>`;
}
function initKontext() {
  document.getElementById("ctx-art").addEventListener("change", renderKontext);
  document.getElementById("ctx-wert").addEventListener("input", renderKontext);
  renderKontext();
}

// ================= 2. Vorzeichen, Betrag, Gegenzahl =================

function renderBetrag() {
  const a = clampInt(document.getElementById("bt-a").value, -12, 12);
  const mount = document.getElementById("bt-mount");
  mount.innerHTML = "";
  const { svg, x } = zahlengerade(-12, 12);

  // Betrag als gestrichelte Strecke von 0 bis a
  if (a !== 0) {
    svg.appendChild(svgEl("line", { x1: x(0), y1: ZG.achseY - 26, x2: x(a), y2: ZG.achseY - 26, class: "zg-betrag" }));
    svg.appendChild(svgText((x(0) + x(a)) / 2, ZG.achseY - 31, `|${zahl(a)}| = ${Math.abs(a)}`, { class: "zg-betrag-text" }));
    // Spiegelung an der Null zur Gegenzahl
    svg.appendChild(svgEl("path", { d: `M ${x(a)} ${ZG.achseY + 30} Q ${x(0)} ${ZG.achseY + 46} ${x(-a)} ${ZG.achseY + 30}`, class: "zg-spiegel", fill: "none" }));
  }
  punkt(svg, x(a), "zg-punkt-a", zahl(a), "a");
  if (a !== 0) punkt(svg, x(-a), "zg-punkt-erg", zahl(-a), "erg");
  mount.appendChild(svg);

  document.getElementById("bt-text").innerHTML =
    `Vorzeichen: <strong>${a > 0 ? "positiv (+)" : a < 0 ? "negativ (−)" : "keines — 0 ist weder positiv noch negativ"}</strong><br>` +
    `Betrag: |${zahl(a)}| = <strong>${Math.abs(a)}</strong> — der Abstand zur Null.<br>` +
    `Gegenzahl: <strong>${zahl(-a)}</strong> — die Spiegelung an der Null.<br>` +
    `Probe: ${zahl(a)} + ${inKlammern(-a)} = <strong>0</strong>` +
    (a !== 0 ? `<br><span class="progress-note">${zahl(a)} und ${zahl(-a)} haben denselben Betrag ${Math.abs(a)}, aber verschiedene Vorzeichen.</span>` : "");
}
function initBetrag() {
  document.getElementById("bt-a").addEventListener("input", renderBetrag);
  renderBetrag();
}

// ================= 3. Ordnen und Vergleichen =================

function renderOrdnen() {
  const a = clampInt(document.getElementById("ord-a").value, -12, 12);
  const b = clampInt(document.getElementById("ord-b").value, -12, 12);
  const mount = document.getElementById("ord-mount");
  mount.innerHTML = "";
  const { svg, x } = zahlengerade(-12, 12);
  punkt(svg, x(a), "zg-punkt-a", "a = " + zahl(a), "a", -14);
  punkt(svg, x(b), "zg-punkt-b", "b = " + zahl(b), "b", a === b ? 26 : -30);
  mount.appendChild(svg);

  const zeichen = a < b ? "&lt;" : a > b ? "&gt;" : "=";
  const groesser = a > b ? a : b;
  const kleiner = a > b ? b : a;
  let begruendung;
  if (a === b) {
    begruendung = "Beide Zahlen sind gleich.";
  } else if (a * b < 0) {
    begruendung = `Eine Zahl ist positiv, die andere negativ — die positive ist immer größer.`;
  } else if (a < 0 && b < 0) {
    begruendung =
      `Beide sind negativ. Hier ist die Zahl mit dem <strong>kleineren Betrag</strong> die größere: ` +
      `|${zahl(groesser)}| = ${Math.abs(groesser)} ist kleiner als |${zahl(kleiner)}| = ${Math.abs(kleiner)}, also ist ${zahl(groesser)} größer.`;
  } else {
    begruendung = "Beide sind positiv — hier entscheidet wie gewohnt der Betrag.";
  }

  document.getElementById("ord-text").innerHTML =
    `<div class="vergleich-zeile"><span style="font-weight:700">${zahl(a)}</span><span class="vergleich-zeichen">${zeichen}</span><span style="font-weight:700">${zahl(b)}</span></div>` +
    `${zahl(groesser)} liegt weiter rechts und ist deshalb die größere Zahl.<br>` +
    `<span class="progress-note">${begruendung}</span>`;
}
function initOrdnen() {
  ["ord-a", "ord-b"].forEach((id) => document.getElementById(id).addEventListener("input", renderOrdnen));
  renderOrdnen();
}

// ================= 4. Addieren und Subtrahieren =================

function renderAddieren() {
  const a = clampInt(document.getElementById("ad-a").value, -12, 12);
  const b = clampInt(document.getElementById("ad-b").value, -12, 12);
  const op = document.getElementById("ad-op").value;
  // Subtrahieren heißt: die Gegenzahl addieren. Damit ist die Bewegungsrichtung eindeutig.
  const bewegung = op === "add" ? b : -b;
  const erg = a + bewegung;

  const mount = document.getElementById("ad-mount");
  mount.innerHTML = "";
  const lo = Math.min(-12, a, erg) === -12 ? -12 : Math.min(a, erg) - 1;
  const hi = Math.max(12, a, erg) === 12 ? 12 : Math.max(a, erg) + 1;
  const { svg, x } = zahlengerade(Math.min(-12, lo), Math.max(12, hi));

  if (bewegung !== 0) {
    const y = ZG.achseY - 24;
    svg.appendChild(svgEl("path", { d: `M ${x(a)} ${y} L ${x(erg)} ${y}`, class: "zg-pfeil" }));
    const dir = bewegung > 0 ? -1 : 1;
    svg.appendChild(
      svgEl("path", { d: `M ${x(erg)} ${y} l ${dir * 8} -4 l 0 8 z`, class: "zg-pfeilspitze" })
    );
    svg.appendChild(
      svgText((x(a) + x(erg)) / 2, y - 6, `${Math.abs(bewegung)} Schritt${Math.abs(bewegung) === 1 ? "" : "e"} nach ${bewegung > 0 ? "rechts" : "links"}`, {
        class: "zg-label erg",
      })
    );
  }
  punkt(svg, x(a), "zg-punkt-a", "Start " + zahl(a), "a", 26);
  punkt(svg, x(erg), "zg-punkt-erg", "Ziel " + zahl(erg), "erg", 40);
  mount.appendChild(svg);

  const term = `${zahl(a)} ${op === "add" ? "+" : "−"} ${inKlammern(b)}`;
  const umgeformt = `${zahl(a)} ${bewegung >= 0 ? "+" : "−"} ${Math.abs(bewegung)}`;
  document.getElementById("ad-text").innerHTML =
    `${term} = <strong>${zahl(erg)}</strong><br>` +
    (op === "sub"
      ? `Subtrahieren heißt, die <strong>Gegenzahl zu addieren</strong>: ${term} = ${zahl(a)} + ${inKlammern(-b)} = ${umgeformt} = ${zahl(erg)}<br>`
      : `${b < 0 ? `Eine negative Zahl zu addieren heißt, nach links zu gehen: ${term} = ${umgeformt} = ${zahl(erg)}<br>` : ""}`) +
    `<span class="progress-note">Auf der Zahlengeraden: bei ${zahl(a)} starten, ${Math.abs(bewegung)} Schritt${Math.abs(bewegung) === 1 ? "" : "e"} nach ${bewegung > 0 ? "rechts" : bewegung < 0 ? "links" : "nirgendwo"} — man landet bei ${zahl(erg)}.</span>`;
}
function initAddieren() {
  ["ad-a", "ad-b"].forEach((id) => document.getElementById(id).addEventListener("input", renderAddieren));
  document.getElementById("ad-op").addEventListener("change", renderAddieren);
  renderAddieren();
}

// ================= 5. Vorzeichenregeln =================

function renderVorzeichenTabelle() {
  const mount = document.getElementById("vz-tabelle-mount");
  mount.innerHTML = "";
  const table = el("table", { class: "vz-tabelle" });
  const kopf = el("tr");
  kopf.appendChild(el("th", {}, "· bzw. :"));
  kopf.appendChild(el("th", {}, "+"));
  kopf.appendChild(el("th", {}, "−"));
  table.appendChild(kopf);
  [["+", ["plus", "minus"]], ["−", ["minus", "plus"]]].forEach(([zeile, werte]) => {
    const tr = el("tr");
    tr.appendChild(el("th", {}, zeile));
    werte.forEach((w) => tr.appendChild(el("td", { class: w }, w === "plus" ? "+" : "−")));
    table.appendChild(tr);
  });
  mount.appendChild(table);
  mount.appendChild(
    el("p", { class: "progress-note", style: "text-align:center" }, "Gleiche Vorzeichen ⇒ Plus · verschiedene Vorzeichen ⇒ Minus")
  );
}

// Permanenzreihe: a · b für fallendes a. Das Muster erzwingt das Vorzeichen im negativen Bereich.
function renderPermanenz() {
  const b = clampInt(document.getElementById("pz-b").value, -9, -1);
  const mount = document.getElementById("pz-mount");
  mount.innerHTML = "";
  const table = el("table", { class: "permanenz" });
  for (let a = 3; a >= -3; a--) {
    const neu = a < 0;
    const tr = el("tr", { class: (neu ? "neu" : "bekannt") + (a === -1 ? " grenze" : "") });
    tr.appendChild(el("td", {}, zahl(a)));
    tr.appendChild(el("td", {}, "·"));
    tr.appendChild(el("td", {}, `(${zahl(b)})`));
    tr.appendChild(el("td", {}, "="));
    tr.appendChild(el("td", {}, zahl(a * b)));
    tr.appendChild(el("td", { class: "pfeil" }, a > -3 ? `↓ + ${Math.abs(b)}` : ""));
    table.appendChild(tr);
  }
  mount.appendChild(table);
}

function renderVorzeichen() {
  const a = clampInt(document.getElementById("vz-a").value, -20, 20);
  const b = clampInt(document.getElementById("vz-b").value, -20, 20);
  const op = document.getElementById("vz-op").value;
  const out = document.getElementById("vz-text");

  if (op === "div" && b === 0) {
    out.innerHTML = `Durch <strong>0 darf nicht dividiert werden</strong> — daran ändert auch der neue Zahlenbereich nichts.`;
    return;
  }
  const gleich = (a >= 0) === (b >= 0);
  const erg = op === "mul" ? a * b : a / b;
  const glatt = Number.isInteger(erg);
  // Geht eine Division nicht auf, wird der Betrag als gekürzter Bruch gezeigt.
  const g = glatt ? 1 : ggT(Math.abs(a), Math.abs(b));
  const betragHtml = glatt ? String(Math.abs(erg)) : bruchHtml(Math.abs(a) / g, Math.abs(b) / g);
  const ergHtml = glatt
    ? `<strong>${zahl(erg)}</strong>`
    : `<strong>${erg < 0 ? "−" : ""}</strong>${bruchHtml(Math.abs(a) / g, Math.abs(b) / g, "gross")}`;

  out.innerHTML =
    `${inKlammern(a)} ${op === "mul" ? "·" : ":"} ${inKlammern(b)}<br>` +
    `① Vorzeichen: ${a >= 0 ? "+" : "−"} und ${b >= 0 ? "+" : "−"} sind <strong>${gleich ? "gleich ⇒ Ergebnis positiv" : "verschieden ⇒ Ergebnis negativ"}</strong><br>` +
    `② Beträge ${op === "mul" ? "multiplizieren" : "dividieren"}: ${Math.abs(a)} ${op === "mul" ? "·" : ":"} ${Math.abs(b)} = ${betragHtml}<br>` +
    `⇒ ${ergHtml}` +
    (op === "div" && !glatt
      ? `<br><span class="progress-note">Die Division geht nicht auf — in ℤ gibt es dafür kein Ergebnis, wohl aber in ℚ (Abschnitt 6).</span>`
      : "");
}
function initVorzeichen() {
  renderVorzeichenTabelle();
  document.getElementById("pz-b").addEventListener("input", renderPermanenz);
  renderPermanenz();
  ["vz-a", "vz-b"].forEach((id) => document.getElementById(id).addEventListener("input", renderVorzeichen));
  document.getElementById("vz-op").addEventListener("change", renderVorzeichen);
  renderVorzeichen();
}

// ================= 6. Zahlbereiche =================

function renderZahlbereicheGrafik() {
  const mount = document.getElementById("zb-mount");
  mount.innerHTML = "";
  const svg = svgEl("svg", { viewBox: "0 0 420 210", width: 420, height: 210, style: "max-width:100%;height:auto" });
  svg.appendChild(svgEl("ellipse", { cx: 210, cy: 105, rx: 200, ry: 100, class: "zb-ring zb-q" }));
  svg.appendChild(svgEl("ellipse", { cx: 185, cy: 105, rx: 145, ry: 75, class: "zb-ring zb-z" }));
  svg.appendChild(svgEl("ellipse", { cx: 160, cy: 105, rx: 90, ry: 50, class: "zb-ring zb-n" }));
  svg.appendChild(svgText(160, 100, "ℕ", { class: "zb-text", fill: "#2563eb" }));
  svg.appendChild(svgText(160, 116, "0; 1; 2; 3; …", { class: "zb-bsp" }));
  svg.appendChild(svgText(300, 82, "ℤ", { class: "zb-text", fill: "#1a9e7a" }));
  svg.appendChild(svgText(300, 98, "… −2; −1", { class: "zb-bsp" }));
  svg.appendChild(svgText(360, 150, "ℚ", { class: "zb-text", fill: "#6d28d9" }));
  svg.appendChild(svgText(352, 166, "½; −0,75", { class: "zb-bsp" }));
  mount.appendChild(svg);
}

function renderZahlbereichPruefung() {
  const roh = document.getElementById("zb-eingabe").value.trim().replace(/−/g, "-");
  const out = document.getElementById("zb-text");
  const bruch = roh.match(/^(-?\d+)\s*\/\s*(-?\d+)$/);
  let wert, alsBruch = null;

  if (bruch) {
    const z = Number(bruch[1]),
      n = Number(bruch[2]);
    if (n === 0) {
      out.innerHTML = `Der Nenner darf nicht 0 sein — durch 0 wird nie dividiert.`;
      return;
    }
    wert = z / n;
    const g = ggT(z, n);
    alsBruch = { z: z / g, n: n / g };
  } else {
    wert = parseFlexibleNumber(roh);
  }
  if (isNaN(wert)) {
    out.innerHTML = `<span class="progress-note">Bitte eine Zahl eingeben — ganz (7), negativ (−3), als Dezimalzahl (0,25) oder als Bruch (−3/4).</span>`;
    return;
  }

  const istGanz = Number.isInteger(wert);
  const istNatuerlich = istGanz && wert >= 0;
  const zeile = (name, drin, erklaerung) =>
    `<div>${drin ? "✓" : "✗"} <strong>${name}</strong> — ${erklaerung}</div>`;

  // Jede Dezimalzahl mit endlich vielen Stellen und jeder Bruch ganzer Zahlen liegt in ℚ.
  out.innerHTML =
    zeile("ℕ", istNatuerlich, istNatuerlich ? "eine natürliche Zahl" : wert < 0 ? "negativ, also nicht in ℕ" : "keine ganze Zahl") +
    zeile("ℤ", istGanz, istGanz ? "eine ganze Zahl" : "keine ganze Zahl") +
    zeile("ℚ", true, alsBruch ? `als Bruch ${bruchHtml(alsBruch.z, alsBruch.n)} darstellbar` : "als Bruch darstellbar") +
    `<span class="progress-note">Jede natürliche Zahl ist auch ganz, jede ganze Zahl ist auch rational: ℕ ⊂ ℤ ⊂ ℚ.</span>`;
}
function initZahlbereiche() {
  renderZahlbereicheGrafik();
  document.getElementById("zb-eingabe").addEventListener("input", renderZahlbereichPruefung);
  renderZahlbereichPruefung();
}

// ================= 9. Gestaffelte Übungsaufgaben =================

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

function generateAufgabe1() {
  // Summe zweier ganzer Zahlen, mindestens eine negativ.
  const a = randInt(-12, 12);
  let b = randInt(-12, 12);
  if (a >= 0 && b >= 0) b = -randInt(1, 12);
  const erg = a + b;
  return {
    promptHtml: `Berechne: ${zahl(a)} + ${inKlammern(b)}`,
    correct: erg,
    tolerance: 0.5,
    placeholder: "Ergebnis",
    hinweis: (raw, val) => (val === a - b ? "Achte auf das Vorzeichen: Hier wird <strong>addiert</strong>, nicht subtrahiert." : ""),
    musterloesungHtml:
      (b < 0
        ? `Eine negative Zahl zu addieren heißt, nach links zu gehen: ${zahl(a)} + ${inKlammern(b)} = ${zahl(a)} − ${Math.abs(b)} = <strong>${zahl(erg)}</strong>`
        : `${zahl(a)} + ${b} = <strong>${zahl(erg)}</strong>`) +
      `<br><span class="progress-note">Auf der Zahlengeraden: bei ${zahl(a)} starten, ${Math.abs(b)} Schritte nach ${b < 0 ? "links" : "rechts"}.</span>`,
  };
}

function generateAufgabe2() {
  // Subtraktion einer negativen Zahl — die Stelle, an der aus zwei Minus ein Plus wird.
  const a = randInt(-12, 12);
  const b = -randInt(1, 12);
  const erg = a - b;
  return {
    promptHtml: `Berechne: ${zahl(a)} − ${inKlammern(b)}`,
    correct: erg,
    tolerance: 0.5,
    placeholder: "Ergebnis",
    hinweis: (raw, val) =>
      val === a + b
        ? "Du hast die beiden Minuszeichen zusammengezogen wie eines. <strong>Subtrahieren heißt, die Gegenzahl zu addieren</strong> — aus − (−b) wird + b."
        : "",
    musterloesungHtml:
      `Subtrahieren heißt, die Gegenzahl zu addieren. Die Gegenzahl von ${zahl(b)} ist ${Math.abs(b)}:<br>` +
      `${zahl(a)} − ${inKlammern(b)} = ${zahl(a)} + ${Math.abs(b)} = <strong>${zahl(erg)}</strong>`,
  };
}

function generateAufgabe3() {
  // Produkt aus drei Faktoren — das Vorzeichen ergibt sich aus der Anzahl der negativen Faktoren.
  const f = [randInt(2, 6), randInt(2, 6), randInt(2, 5)];
  const anzahlNegativ = randInt(1, 3);
  const vorzeichen = [1, 1, 1];
  const idx = [0, 1, 2].sort(() => Math.random() - 0.5).slice(0, anzahlNegativ);
  idx.forEach((i) => (vorzeichen[i] = -1));
  const zahlen = f.map((v, i) => v * vorzeichen[i]);
  const erg = zahlen[0] * zahlen[1] * zahlen[2];
  return {
    promptHtml: `Berechne: ${inKlammern(zahlen[0])} · ${inKlammern(zahlen[1])} · ${inKlammern(zahlen[2])}`,
    correct: erg,
    tolerance: 0.5,
    placeholder: "Ergebnis",
    hinweis: (raw, val) => (val === -erg ? "Der Betrag stimmt — nur das <strong>Vorzeichen</strong> nicht. Zähle die negativen Faktoren: eine gerade Anzahl ergibt Plus, eine ungerade Minus." : ""),
    musterloesungHtml:
      `① Vorzeichen bestimmen: Es sind <strong>${anzahlNegativ}</strong> negative Faktoren, also eine ${anzahlNegativ % 2 === 0 ? "gerade" : "ungerade"} Anzahl ⇒ das Ergebnis ist <strong>${anzahlNegativ % 2 === 0 ? "positiv" : "negativ"}</strong>.<br>` +
      `② Beträge multiplizieren: ${f[0]} · ${f[1]} · ${f[2]} = ${f[0] * f[1] * f[2]}<br>` +
      `⇒ <strong>${zahl(erg)}</strong><br>` +
      `<span class="progress-note">Je zwei negative Faktoren heben sich im Vorzeichen auf.</span>`,
  };
}

function generateAufgabe4() {
  // Mehrschrittige Sachaufgabe im negativen Bereich.
  const kontext = pick([
    { start: "Der Kontostand beträgt", einh: "€", ab: "Es werden {x} € abgebucht", auf: "Danach gehen {y} € ein", frage: "Wie hoch ist der Kontostand am Ende?" },
    { start: "Ein Tauchboot befindet sich auf", einh: "m", ab: "Es taucht {x} m tiefer", auf: "Danach steigt es {y} m", frage: "Auf welcher Höhe ist es dann (unter dem Meeresspiegel negativ)?" },
    { start: "Die Temperatur beträgt morgens", einh: "°C", ab: "Sie fällt um {x} Grad", auf: "Danach steigt sie um {y} Grad", frage: "Wie warm ist es am Ende?" },
  ]);
  const start = randInt(-15, 10);
  const x = randInt(3, 18);
  const y = randInt(2, 20);
  const zwischen = start - x;
  const erg = zwischen + y;
  return {
    promptHtml:
      `${kontext.start} <strong>${zahl(start)} ${kontext.einh}</strong>. ` +
      `${kontext.ab.replace("{x}", x)}. ${kontext.auf.replace("{y}", y)}. ${kontext.frage}`,
    correct: erg,
    tolerance: 0.5,
    placeholder: "Ergebnis in " + kontext.einh,
    hinweis: (raw, val) => (val === start + x - y ? "Achte auf die Reihenfolge der Richtungen: zuerst geht es <strong>nach unten</strong>, danach wieder hinauf." : ""),
    musterloesungHtml:
      `① ${zahl(start)} − ${x} = <strong>${zahl(zwischen)}</strong><br>` +
      `② ${zahl(zwischen)} + ${y} = <strong>${zahl(erg)}</strong><br>` +
      `<span class="progress-note">Als ein Term: ${zahl(start)} − ${x} + ${y} = ${zahl(erg)}. Auf der Zahlengeraden erst ${x} Schritte nach links, dann ${y} Schritte nach rechts.</span>`,
  };
}

function initExercises() {
  mountUebungsaufgaben(document.getElementById("exercises-mount"), [
    { schwierigkeit: "einfach", titel: "Aufgabe 1 — In ℤ addieren", generate: generateAufgabe1 },
    { schwierigkeit: "mittel", titel: "Aufgabe 2 — Eine negative Zahl subtrahieren", generate: generateAufgabe2 },
    { schwierigkeit: "schwierig", titel: "Aufgabe 3 — Vorzeichenregeln bei mehreren Faktoren", generate: generateAufgabe3 },
    { schwierigkeit: "komplex", titel: "Aufgabe 4 — Mehrschrittige Sachaufgabe", generate: generateAufgabe4 },
  ]);
}

// ================= Quizze =================

function initQuizzes() {
  mountQuiz(document.getElementById("quiz-warum"), {
    q: "Warum wurden die negativen Zahlen eingeführt?",
    options: [
      "Damit man Schulden aufschreiben kann — einen mathematischen Grund gibt es nicht",
      "Damit jede Subtraktion lösbar ist, auch wenn der Minuend kleiner ist als der Subtrahend",
      "Damit man durch 0 dividieren kann",
      "Damit Brüche kürzbar werden",
    ],
    correct: 1,
    explain: "In ℕ hat 5 − 8 keine Lösung. Mit ℤ ist die Subtraktion uneingeschränkt möglich — dieselbe Idee, mit der später ℚ die Division vollständig macht.",
  });
  mountQuiz(document.getElementById("quiz-betrag"), {
    q: "Wie groß ist der Betrag von −7?",
    options: ["−7", "7", "0", "Der Betrag ist nur für positive Zahlen definiert"],
    correct: 1,
    explain: "Der Betrag ist der Abstand zur Null und damit nie negativ: |−7| = |7| = 7.",
  });
  mountQuiz(document.getElementById("quiz-ordnen"), {
    q: "Welche Zahl ist größer: −5 oder −3?",
    options: ["−5, weil 5 größer als 3 ist", "−3, weil es weiter rechts auf der Zahlengeraden liegt", "Beide sind gleich groß", "Negative Zahlen kann man nicht vergleichen"],
    correct: 1,
    explain: "Beim Vergleichen zählt die Lage, nicht der Betrag. −3 °C sind wärmer als −5 °C.",
  });
  mountQuiz(document.getElementById("quiz-addieren"), {
    q: "Wie viel ist 3 − (−5)?",
    options: ["−8", "−2", "8", "2"],
    correct: 2,
    explain: "Subtrahieren heißt, die Gegenzahl zu addieren: 3 − (−5) = 3 + 5 = 8.",
  });
  mountQuiz(document.getElementById("quiz-vorzeichen"), {
    q: "Warum ist (−2) · (−3) = +6?",
    options: [
      "Das ist eine reine Vereinbarung ohne Begründung",
      "Weil die Rechenregeln weiter gelten sollen — setzt man die Reihe 2·(−3) = −6, 1·(−3) = −3, 0·(−3) = 0 fort, muss (−1)·(−3) = +3 sein",
      "Weil zwei Minuszeichen sich immer wegkürzen lassen",
      "Es ist falsch, das Ergebnis ist −6",
    ],
    correct: 1,
    explain: "Das Permanenzprinzip: Die neuen Zahlen werden so definiert, dass die bekannten Muster und Rechengesetze erhalten bleiben.",
  });
  mountQuiz(document.getElementById("quiz-zahlbereiche"), {
    q: "Welche Aussage über die Zahlbereiche stimmt?",
    options: [
      "ℤ und ℕ haben keine gemeinsamen Elemente",
      "Jede natürliche Zahl ist auch eine ganze und eine rationale Zahl",
      "ℚ enthält nur Brüche, keine ganzen Zahlen",
      "ℕ ist der größte Zahlbereich",
    ],
    correct: 1,
    explain: "Es gilt ℕ ⊂ ℤ ⊂ ℚ — jeder Bereich enthält den vorigen vollständig. Die 5 ist zugleich natürlich, ganz und rational (5 = 5/1).",
  });
}

// ================= Start =================

document.addEventListener("DOMContentLoaded", () => {
  initKontext();
  initBetrag();
  initOrdnen();
  initAddieren();
  initVorzeichen();
  initZahlbereiche();
  initExercises();
  initQuizzes();
});
