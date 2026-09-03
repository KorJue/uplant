// Selbstlernpfad "Rechnen mit natürlichen Zahlen" (Grundwissen Klasse 5-10). Rein clientseitiges
// Vanilla-JS, ohne Build-Schritt oder externe Bibliotheken — wie der Rest der Seite. Aufbau: kleine
// DOM/SVG-Helfer, dann je ein Abschnitt (Fachbegriffe, Rechengesetze, Rangfolge, Überschlag,
// schriftliche Addition/Subtraktion, schriftliche Multiplikation, Division), zuletzt die
// gestaffelten Übungsaufgaben (derselbe Baustein wie im Lernpfad "Natürliche Zahlen und Größen").

"use strict";

// ---------- Helfer ----------

const SVG_NS = "http://www.w3.org/2000/svg";
function svgEl(tag, attrs = {}) {
  const e = document.createElementNS(SVG_NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  return e;
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
function num(x, digits = 3) {
  return x.toLocaleString("de-DE", { maximumFractionDigits: digits });
}
function randInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}
function clampInt(v, lo, hi) {
  const n = Math.round(Number(v));
  if (isNaN(n)) return lo;
  return Math.max(lo, Math.min(hi, n));
}
// Toleranter Zahlen-Parser: erlaubt "0,25", "1/4", "25%" und Tausenderpunkte als Antwort.
function parseFlexibleNumber(raw) {
  if (raw == null) return NaN;
  let s = String(raw).trim().replace(/\./g, "").replace(",", ".");
  let asPercent = false;
  if (s.endsWith("%")) {
    asPercent = true;
    s = s.slice(0, -1).trim();
  }
  let val;
  if (s.includes("/")) {
    const [a, b] = s.split("/").map((p) => parseFloat(p.trim()));
    val = a / b;
  } else {
    val = parseFloat(s);
  }
  if (asPercent) val /= 100;
  return val;
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

// ================= 1. Fachbegriffe der Rechenarten =================

const FACHBEGRIFFE = {
  add: { zeichen: "+", teile: ["Summand", "Summand"], ergebnis: "Summe" },
  sub: { zeichen: "−", teile: ["Minuend", "Subtrahend"], ergebnis: "Differenz" },
  mul: { zeichen: "·", teile: ["Faktor", "Faktor"], ergebnis: "Produkt" },
  div: { zeichen: ":", teile: ["Dividend", "Divisor"], ergebnis: "Quotient" },
};

function renderFachbegriffe() {
  const a = clampInt(document.getElementById("fb-a").value, 0, 9999);
  const b = clampInt(document.getElementById("fb-b").value, 1, 9999);
  const op = document.getElementById("fb-op").value;
  const def = FACHBEGRIFFE[op];
  const mount = document.getElementById("fb-mount");
  mount.innerHTML = "";

  let ergebnisText;
  let hinweis = "";
  if (op === "add") {
    ergebnisText = String(a + b);
  } else if (op === "mul") {
    ergebnisText = String(a * b);
  } else if (op === "sub") {
    if (a < b) {
      ergebnisText = "—";
      hinweis =
        "In den natürlichen Zahlen ℕ gibt es diese Differenz nicht, denn der Minuend ist kleiner als der Subtrahend. Dafür braucht man die ganzen Zahlen ℤ.";
    } else {
      ergebnisText = String(a - b);
    }
  } else {
    const q = Math.floor(a / b);
    const r = a - q * b;
    ergebnisText = r === 0 ? String(q) : q + " Rest " + r;
    if (r !== 0) hinweis = "Die Division geht nicht auf — es bleibt ein Rest (siehe Abschnitt 7).";
  }

  const teil = (wert, name) =>
    el("div", { class: "begriff-teil" }, [el("div", { class: "begriff-wert" }, wert), el("div", { class: "begriff-name" }, name)]);
  const zeichen = (z) => el("div", { class: "begriff-op" }, z);

  mount.appendChild(
    el("div", { class: "begriff-anzeige" }, [
      teil(String(a), def.teile[0]),
      zeichen(def.zeichen),
      teil(String(b), def.teile[1]),
      zeichen("="),
      teil(ergebnisText, def.ergebnis),
    ])
  );
  mount.appendChild(
    el(
      "p",
      { class: "progress-note" },
      hinweis || `Der gesamte Rechenausdruck ${a} ${def.zeichen} ${b} heißt Term; ${ergebnisText} ist sein Wert.`
    )
  );
}
function initFachbegriffe() {
  ["fb-a", "fb-b"].forEach((id) => document.getElementById(id).addEventListener("input", renderFachbegriffe));
  document.getElementById("fb-op").addEventListener("change", renderFachbegriffe);
  renderFachbegriffe();
}

// ================= 2. Rechengesetze =================

function renderDistributiv() {
  const a = clampInt(document.getElementById("dist-a").value, 1, 9);
  const b = clampInt(document.getElementById("dist-b").value, 1, 9);
  const c = clampInt(document.getElementById("dist-c").value, 1, 9);
  const scale = 26,
    marginLeft = 34,
    marginBottom = 20;
  const wB = b * scale,
    wC = c * scale,
    h = a * scale;
  const totalW = marginLeft + wB + wC,
    totalH = h + marginBottom;

  const mount = document.getElementById("dist-mount");
  mount.innerHTML = "";
  const svg = svgEl("svg", { viewBox: `0 0 ${totalW} ${totalH}`, width: totalW, height: totalH, class: "flaechenmodell" });
  svg.appendChild(svgEl("rect", { x: marginLeft, y: 0, width: wB, height: h, class: "teil1" }));
  svg.appendChild(svgEl("rect", { x: marginLeft + wB, y: 0, width: wC, height: h, class: "teil2" }));

  const aLabel = svgEl("text", { x: marginLeft / 2, y: h / 2, "text-anchor": "middle", "dominant-baseline": "middle", "font-size": 12, "font-weight": 700, fill: "var(--text)" });
  aLabel.textContent = "a=" + a;
  svg.appendChild(aLabel);

  const bLabel = svgEl("text", { x: marginLeft + wB / 2, y: h + 15, "text-anchor": "middle", "font-size": 11, fill: "#2563eb" });
  bLabel.textContent = "b = " + b;
  svg.appendChild(bLabel);
  const cLabel = svgEl("text", { x: marginLeft + wB + wC / 2, y: h + 15, "text-anchor": "middle", "font-size": 11, fill: "#1a9e7a" });
  cLabel.textContent = "c = " + c;
  svg.appendChild(cLabel);

  const p1 = svgEl("text", { x: marginLeft + wB / 2, y: h / 2 + 4, "text-anchor": "middle", "font-size": Math.min(13, wB / 3), "font-weight": 700, fill: "#2563eb" });
  p1.textContent = a + "·" + b + "=" + a * b;
  svg.appendChild(p1);
  const p2 = svgEl("text", { x: marginLeft + wB + wC / 2, y: h / 2 + 4, "text-anchor": "middle", "font-size": Math.min(13, wC / 3), "font-weight": 700, fill: "#1a9e7a" });
  p2.textContent = a + "·" + c + "=" + a * c;
  svg.appendChild(p2);

  mount.appendChild(svg);

  document.getElementById("dist-formel").innerHTML = `<strong>${a} · (${b} + ${c}) = ${a} · ${b} + ${a} · ${c} = ${a * b} + ${a * c} = ${a * (b + c)}</strong>`;
}

// Gegenbeispiel: Subtraktion und Division sind nicht kommutativ. Wichtig ist der Sonderfall a = b —
// dann stimmen beide Ergebnisse zufällig überein und taugen NICHT als Gegenbeispiel.
function renderGegenbeispiel() {
  const a = clampInt(document.getElementById("gg-a").value, 1, 99);
  const b = clampInt(document.getElementById("gg-b").value, 1, 99);
  const mount = document.getElementById("gg-mount");
  mount.innerHTML = "";

  if (a === b) {
    mount.appendChild(
      el(
        "p",
        { class: "progress-note" },
        `Für a = b = ${a} stimmen beide Reihenfolgen zufällig überein (${a} − ${b} = ${b} − ${a} = 0). Ein Gegenbeispiel braucht zwei verschiedene Zahlen — ändere a oder b.`
      )
    );
    return;
  }

  const subAB = a >= b ? String(a - b) : "in ℕ nicht definiert";
  const subBA = b >= a ? String(b - a) : "in ℕ nicht definiert";
  const row = el("div", { class: "widget-row" }, [
    el("div", { class: "widget-col" }, [
      el("p", {}, [el("strong", {}, "Subtraktion")]),
      el("p", {}, `${a} − ${b} = ${subAB}`),
      el("p", {}, `${b} − ${a} = ${subBA}`),
      el("p", { class: "progress-note" }, "⇒ verschieden: a − b ≠ b − a"),
    ]),
    el("div", { class: "widget-col" }, [
      el("p", {}, [el("strong", {}, "Division")]),
      el("p", {}, `${a} : ${b} = ${num(a / b)}`),
      el("p", {}, `${b} : ${a} = ${num(b / a)}`),
      el("p", { class: "progress-note" }, "⇒ verschieden: a : b ≠ b : a"),
    ]),
  ]);
  mount.appendChild(row);
}

function initRechengesetze() {
  ["dist-a", "dist-b", "dist-c"].forEach((id) => document.getElementById(id).addEventListener("input", renderDistributiv));
  renderDistributiv();
  ["gg-a", "gg-b"].forEach((id) => document.getElementById(id).addEventListener("input", renderGegenbeispiel));
  renderGegenbeispiel();
}

// ================= 3. Rangfolge =================

function renderRangfolge() {
  const a = Number(document.getElementById("rang-a").value) || 0;
  const b = Number(document.getElementById("rang-b").value) || 0;
  const c = Number(document.getElementById("rang-c").value) || 0;
  const ohneKlammer = a + b * c;
  const mitKlammer = (a + b) * c;
  const mount = document.getElementById("rang-mount");
  mount.innerHTML = "";
  const row = el("div", { class: "widget-row" }, [
    el("div", { class: "widget-col" }, [
      el("p", {}, [el("strong", {}, "Ohne Klammern: "), `${a} + ${b} · ${c}`]),
      el("p", {}, `① zuerst Punktrechnung: ${b} · ${c} = ${b * c}`),
      el("p", {}, ["② dann Strichrechnung: ", `${a} + ${b * c} = `, el("strong", {}, String(ohneKlammer))]),
    ]),
    el("div", { class: "widget-col" }, [
      el("p", {}, [el("strong", {}, "Mit Klammern: "), `(${a} + ${b}) · ${c}`]),
      el("p", {}, `① zuerst die Klammer: ${a} + ${b} = ${a + b}`),
      el("p", {}, ["② dann die Multiplikation: ", `${a + b} · ${c} = `, el("strong", {}, String(mitKlammer))]),
    ]),
  ]);
  mount.appendChild(row);
  mount.appendChild(
    el(
      "p",
      { class: "progress-note" },
      ohneKlammer === mitKlammer
        ? "Hier ergibt sich zufällig dasselbe Ergebnis — probiere andere Zahlen aus."
        : `Die Klammern ändern hier das Ergebnis: ${ohneKlammer} ≠ ${mitKlammer}.`
    )
  );
}

// Gleicher Rang ⇒ von links nach rechts. Feste Zahlen, weil der Term im Fließtext genannt wird.
function renderRangfolgeGleich() {
  const mount = document.getElementById("rang-gleich-mount");
  mount.innerHTML = "";
  mount.appendChild(
    el("div", { class: "widget-row" }, [
      el("div", { class: "widget-col" }, [
        el("p", {}, [el("strong", {}, "✓ Richtig: von links nach rechts")]),
        el("p", {}, "① 24 : 4 = 6"),
        el("p", {}, ["② 6 · 2 = ", el("strong", {}, "12")]),
      ]),
      el("div", { class: "widget-col" }, [
        el("p", {}, [el("strong", {}, "✗ Falsch: erst die Multiplikation")]),
        el("p", {}, "① 4 · 2 = 8"),
        el("p", {}, ["② 24 : 8 = ", el("strong", {}, "3")]),
      ]),
    ])
  );
  mount.appendChild(
    el("p", { class: "progress-note" }, "Beide Wege liefern verschiedene Ergebnisse — nur der linke ist richtig. Wer sichergehen will, setzt Klammern: (24 : 4) · 2.")
  );
}

function initRangfolge() {
  ["rang-a", "rang-b", "rang-c"].forEach((id) => document.getElementById(id).addEventListener("input", renderRangfolge));
  renderRangfolge();
  renderRangfolgeGleich();
}

// ================= 4. Überschlagsrechnen =================

function rundeAufStelle(n, stelle) {
  return Math.round(n / stelle) * stelle;
}

function renderUeberschlag() {
  const a = clampInt(document.getElementById("ue-a").value, 0, 99999);
  const b = clampInt(document.getElementById("ue-b").value, 0, 99999);
  const op = document.getElementById("ue-op").value;
  const stelle = Number(document.getElementById("ue-stelle").value);
  const zeichen = { add: "+", sub: "−", mul: "·" }[op];
  const rechne = { add: (x, y) => x + y, sub: (x, y) => x - y, mul: (x, y) => x * y }[op];

  const ra = rundeAufStelle(a, stelle);
  const rb = rundeAufStelle(b, stelle);
  const exakt = rechne(a, b);
  const ueber = rechne(ra, rb);
  const abw = Math.abs(exakt - ueber);
  const prozent = exakt !== 0 ? (abw / Math.abs(exakt)) * 100 : 0;

  let html =
    `Überschlag: ${num(ra)} ${zeichen} ${num(rb)} ≈ <strong>${num(ueber)}</strong><br>` +
    `Genau: ${num(a)} ${zeichen} ${num(b)} = <strong>${num(exakt)}</strong><br>` +
    `Abweichung: ${num(abw)}${exakt !== 0 ? " (das sind " + num(prozent, 1) + " % des genauen Werts)" : ""}`;
  if (op === "sub" && a < b) {
    html += `<br><span style="color:#b3650a">Hinweis: In ℕ ist ${num(a)} − ${num(b)} nicht definiert — der Minuend muss mindestens so groß sein wie der Subtrahend.</span>`;
  }
  document.getElementById("ue-mount").innerHTML = html;
}
function initUeberschlag() {
  ["ue-a", "ue-b"].forEach((id) => document.getElementById(id).addEventListener("input", renderUeberschlag));
  ["ue-op", "ue-stelle"].forEach((id) => document.getElementById(id).addEventListener("change", renderUeberschlag));
  renderUeberschlag();
}

// ================= 5. Schriftliche Addition und Subtraktion =================

function computeAddition(a, b) {
  const aStr = String(a),
    bStr = String(b);
  const len = Math.max(aStr.length, bStr.length);
  const da = aStr
    .padStart(len, " ")
    .split("")
    .map((ch) => (ch === " " ? null : Number(ch)));
  const db = bStr
    .padStart(len, " ")
    .split("")
    .map((ch) => (ch === " " ? null : Number(ch)));
  const sum = new Array(len).fill(0);
  const carryInto = new Array(len).fill(0);
  let carry = 0;
  for (let i = len - 1; i >= 0; i--) {
    carryInto[i] = carry;
    const s = (da[i] ?? 0) + (db[i] ?? 0) + carry;
    sum[i] = s % 10;
    carry = Math.floor(s / 10);
  }
  return { da, db, sum, carryInto, finalCarry: carry, len };
}

function renderAdditionTable(mountId, a, b) {
  const { da, db, sum, carryInto, finalCarry, len } = computeAddition(a, b);
  const mount = document.getElementById(mountId);
  mount.innerHTML = "";
  const table = el("table", { class: "schriftlich-tabelle" });
  const cols = finalCarry ? len + 1 : len;

  const carryRow = el("tr");
  carryRow.appendChild(el("td"));
  for (let j = 0; j < cols; j++) {
    const realIdx = finalCarry ? j - 1 : j;
    const v = realIdx >= 0 ? carryInto[realIdx] : 0;
    carryRow.appendChild(el("td", { class: "uebertrag" }, v > 0 ? String(v) : ""));
  }
  table.appendChild(carryRow);

  const aRow = el("tr");
  aRow.appendChild(el("td"));
  for (let j = 0; j < cols; j++) {
    const realIdx = finalCarry ? j - 1 : j;
    const v = realIdx >= 0 ? da[realIdx] : null;
    aRow.appendChild(el("td", { class: v == null ? "blank" : "digit" }, v == null ? "" : String(v)));
  }
  table.appendChild(aRow);

  const bRow = el("tr");
  bRow.appendChild(el("td", { class: "op" }, "+"));
  for (let j = 0; j < cols; j++) {
    const realIdx = finalCarry ? j - 1 : j;
    const v = realIdx >= 0 ? db[realIdx] : null;
    bRow.appendChild(el("td", { class: v == null ? "blank" : "digit" }, v == null ? "" : String(v)));
  }
  table.appendChild(bRow);

  const resRow = el("tr", { class: "rechenzeile" });
  resRow.appendChild(el("td"));
  for (let j = 0; j < cols; j++) {
    const realIdx = finalCarry ? j - 1 : j;
    const v = realIdx < 0 ? finalCarry : sum[realIdx];
    resRow.appendChild(el("td", { class: "digit", style: "color:var(--accent-dark)" }, String(v)));
  }
  table.appendChild(resRow);

  mount.appendChild(table);
}

function computeSubtraction(a, b) {
  const len = Math.max(String(a).length, String(b).length);
  const da = String(a)
    .padStart(len, "0")
    .split("")
    .map(Number);
  const db = String(b)
    .padStart(len, "0")
    .split("")
    .map(Number);
  const diff = new Array(len).fill(0);
  const borrowFrom = new Array(len).fill(false); // borrowFrom[i]: Spalte i hat sich bei Spalte i-1 geliehen
  let borrow = 0;
  for (let i = len - 1; i >= 0; i--) {
    let top = da[i] - borrow;
    let nb = 0;
    if (top < db[i]) {
      top += 10;
      nb = 1;
    }
    diff[i] = top - db[i];
    borrowFrom[i] = nb === 1;
    borrow = nb;
  }
  return { da, db, diff, borrowFrom, len };
}

// Prüft, ob bei a − b mindestens einmal entbündelt werden muss.
function brauchtEntbuendeln(a, b) {
  return computeSubtraction(a, b).borrowFrom.some(Boolean);
}

function renderSubtractionTable(mountId, a, b) {
  const mount = document.getElementById(mountId);
  const hinweis = document.getElementById("sub-hinweis");
  mount.innerHTML = "";
  if (a < b) {
    if (hinweis) hinweis.textContent = "Hinweis: Bei natürlichen Zahlen muss die erste Zahl mindestens so groß sein wie die zweite — vertausche die Werte.";
    return;
  }
  if (hinweis) hinweis.textContent = "";
  const { da, db, diff, borrowFrom, len } = computeSubtraction(a, b);
  const table = el("table", { class: "schriftlich-tabelle" });

  const borrowRow = el("tr");
  borrowRow.appendChild(el("td"));
  for (let i = 0; i < len; i++) {
    // Die Leihmarke steht über der Spalte LINKS von der Spalte, die geliehen hat (also Spalte i-1,
    // wenn borrowFrom[i] wahr ist).
    const marked = i + 1 < len && borrowFrom[i + 1];
    borrowRow.appendChild(el("td", { class: "uebertrag" }, marked ? "−1" : ""));
  }
  table.appendChild(borrowRow);

  const aRow = el("tr");
  aRow.appendChild(el("td"));
  da.forEach((d) => aRow.appendChild(el("td", { class: "digit" }, String(d))));
  table.appendChild(aRow);

  const bRow = el("tr");
  bRow.appendChild(el("td", { class: "op" }, "−"));
  db.forEach((d) => bRow.appendChild(el("td", { class: "digit" }, String(d))));
  table.appendChild(bRow);

  const resRow = el("tr", { class: "rechenzeile" });
  resRow.appendChild(el("td"));
  diff.forEach((d) => resRow.appendChild(el("td", { class: "digit", style: "color:var(--accent-dark)" }, String(d))));
  table.appendChild(resRow);

  mount.appendChild(table);
}

function initSchriftlichAddition() {
  function refreshAdd() {
    const a = clampInt(document.getElementById("add-a").value, 0, 99999);
    const b = clampInt(document.getElementById("add-b").value, 0, 99999);
    renderAdditionTable("add-mount", a, b);
  }
  function refreshSub() {
    const a = clampInt(document.getElementById("sub-a").value, 0, 99999);
    const b = clampInt(document.getElementById("sub-b").value, 0, 99999);
    renderSubtractionTable("sub-mount", a, b);
  }
  document.getElementById("add-a").addEventListener("input", refreshAdd);
  document.getElementById("add-b").addEventListener("input", refreshAdd);
  document.getElementById("sub-a").addEventListener("input", refreshSub);
  document.getElementById("sub-b").addEventListener("input", refreshSub);
  refreshAdd();
  refreshSub();
}

// ================= 6. Schriftliche Multiplikation =================

function computeMultiplication(a, m) {
  const digits = String(a).split("").map(Number);
  const len = digits.length;
  const product = new Array(len).fill(0);
  const carryInto = new Array(len).fill(0);
  let carry = 0;
  for (let i = len - 1; i >= 0; i--) {
    carryInto[i] = carry;
    const p = digits[i] * m + carry;
    product[i] = p % 10;
    carry = Math.floor(p / 10);
  }
  return { digits, product, carryInto, finalCarry: carry, len };
}

function renderMultiplicationTable(mountId, a, m) {
  const { digits, product, carryInto, finalCarry, len } = computeMultiplication(a, m);
  const mount = document.getElementById(mountId);
  mount.innerHTML = "";
  const cols = finalCarry ? len + 1 : len;
  const table = el("table", { class: "schriftlich-tabelle" });

  const carryRow = el("tr");
  carryRow.appendChild(el("td"));
  for (let j = 0; j < cols; j++) {
    const realIdx = finalCarry ? j - 1 : j;
    const v = realIdx >= 0 ? carryInto[realIdx] : 0;
    carryRow.appendChild(el("td", { class: "uebertrag" }, v > 0 ? String(v) : ""));
  }
  table.appendChild(carryRow);

  const aRow = el("tr");
  aRow.appendChild(el("td"));
  for (let j = 0; j < cols; j++) {
    const realIdx = finalCarry ? j - 1 : j;
    aRow.appendChild(el("td", { class: realIdx >= 0 ? "digit" : "blank" }, realIdx >= 0 ? String(digits[realIdx]) : ""));
  }
  table.appendChild(aRow);

  const bRow = el("tr");
  bRow.appendChild(el("td", { class: "op" }, "·"));
  for (let j = 0; j < cols; j++) {
    const realIdx = finalCarry ? j - 1 : j;
    bRow.appendChild(el("td", { class: realIdx === len - 1 ? "digit" : "blank" }, realIdx === len - 1 ? String(m) : ""));
  }
  table.appendChild(bRow);

  const resRow = el("tr", { class: "rechenzeile" });
  resRow.appendChild(el("td"));
  for (let j = 0; j < cols; j++) {
    const realIdx = finalCarry ? j - 1 : j;
    const v = realIdx < 0 ? finalCarry : product[realIdx];
    resRow.appendChild(el("td", { class: "digit", style: "color:var(--accent-dark)" }, String(v)));
  }
  table.appendChild(resRow);

  mount.appendChild(table);
}

// Mehrstelliger zweiter Faktor: je Ziffer ein Teilprodukt, stellengerecht eingerückt.
function computeTeilprodukte(a, b) {
  const bStr = String(b);
  const m = bStr.length;
  const cols = String(a).length + m; // reicht immer: das Produkt hat höchstens so viele Stellen
  const teile = [];
  for (let j = 0; j < m; j++) {
    const ziffer = Number(bStr[j]);
    const shift = m - 1 - j; // Stellenverschiebung nach links
    teile.push({ ziffer, shift, produkt: a * ziffer, stellenwert: Math.pow(10, shift) });
  }
  return { teile, cols, ergebnis: a * b };
}

function renderTeilproduktTabelle(mountId, a, b) {
  const { teile, cols, ergebnis } = computeTeilprodukte(a, b);
  const mount = document.getElementById(mountId);
  mount.innerHTML = "";
  const table = el("table", { class: "schriftlich-tabelle" });

  // Kopfzeile: der Rechenausdruck über die volle Breite
  const head = el("tr");
  head.appendChild(el("td", { class: "op" }, ""));
  const headCell = el("td", { colspan: String(cols), style: "text-align:right;font-weight:700;padding-right:0.2rem" }, `${a.toLocaleString("de-DE")} · ${b.toLocaleString("de-DE")}`);
  head.appendChild(headCell);
  table.appendChild(head);

  // Je Ziffer des zweiten Faktors eine Teilproduktzeile, rechtsbündig an Spalte (cols-1-shift)
  teile.forEach((t, idx) => {
    const str = String(t.produkt);
    const endCol = cols - 1 - t.shift;
    const startCol = endCol - str.length + 1;
    const row = el("tr");
    row.appendChild(el("td", { class: "op" }, idx === teile.length - 1 ? "+" : ""));
    for (let c = 0; c < cols; c++) {
      const inside = c >= startCol && c <= endCol;
      row.appendChild(el("td", { class: inside ? "digit" : "blank" }, inside ? str[c - startCol] : ""));
    }
    table.appendChild(row);
  });

  // Ergebniszeile
  const resStr = String(ergebnis);
  const resStart = cols - resStr.length;
  const resRow = el("tr", { class: "rechenzeile" });
  resRow.appendChild(el("td"));
  for (let c = 0; c < cols; c++) {
    const inside = c >= resStart;
    resRow.appendChild(el("td", { class: inside ? "digit" : "blank", style: inside ? "color:var(--accent-dark)" : "" }, inside ? resStr[c - resStart] : ""));
  }
  table.appendChild(resRow);

  mount.appendChild(table);

  // Erklärung über das Distributivgesetz
  const summanden = teile.map((t) => `${a.toLocaleString("de-DE")} · ${(t.ziffer * t.stellenwert).toLocaleString("de-DE")}`);
  const werte = teile.map((t) => (t.produkt * t.stellenwert).toLocaleString("de-DE"));
  document.getElementById("mulm-erklaerung").innerHTML =
    `${a.toLocaleString("de-DE")} · ${b.toLocaleString("de-DE")} = ${summanden.join(" + ")} = ${werte.join(" + ")} = <strong>${ergebnis.toLocaleString("de-DE")}</strong>`;
}

function initSchriftlichMultiplikation() {
  function refresh() {
    const a = clampInt(document.getElementById("mul-a").value, 0, 99999);
    const m = clampInt(document.getElementById("mul-b").value, 1, 9);
    renderMultiplicationTable("mul-mount", a, m);
  }
  document.getElementById("mul-a").addEventListener("input", refresh);
  document.getElementById("mul-b").addEventListener("input", refresh);
  refresh();

  function refreshMehr() {
    const a = clampInt(document.getElementById("mulm-a").value, 1, 9999);
    const b = clampInt(document.getElementById("mulm-b").value, 1, 999);
    renderTeilproduktTabelle("mulm-mount", a, b);
  }
  document.getElementById("mulm-a").addEventListener("input", refreshMehr);
  document.getElementById("mulm-b").addEventListener("input", refreshMehr);
  refreshMehr();
}

// ================= 7. Division mit Rest und schriftliche Division =================

function initDivision() {
  const aInput = document.getElementById("div-a");
  const bInput = document.getElementById("div-b");
  const out = document.getElementById("div-ergebnis");
  function refresh() {
    const a = clampInt(aInput.value, 0, 999999);
    const b = clampInt(bInput.value, 1, 99999);
    const q = Math.floor(a / b);
    const r = a - q * b;
    out.innerHTML =
      `${a.toLocaleString("de-DE")} : ${b.toLocaleString("de-DE")} = <strong>${q.toLocaleString("de-DE")}</strong> Rest <strong>${r.toLocaleString("de-DE")}</strong><br>` +
      `Probe: ${b.toLocaleString("de-DE")} · ${q.toLocaleString("de-DE")} + ${r.toLocaleString("de-DE")} = ${(b * q).toLocaleString("de-DE")} + ${r.toLocaleString("de-DE")} = ${(b * q + r).toLocaleString("de-DE")} ✓`;
  }
  aInput.addEventListener("input", refresh);
  bInput.addEventListener("input", refresh);
  refresh();
}

function computeLangeDivision(a, b) {
  const digits = String(a).split("").map(Number);
  const n = digits.length;
  const schritte = [];
  let rem = 0;
  for (let i = 0; i < n; i++) {
    const cur = rem * 10 + digits[i];
    const q = Math.floor(cur / b);
    const prod = q * b;
    rem = cur - prod;
    schritte.push({ cur, q, prod, rem });
  }
  return { digits, n, schritte, quotient: Math.floor(a / b), rest: rem };
}

function renderLangeDivision(mountId, a, b) {
  const mount = document.getElementById(mountId);
  mount.innerHTML = "";
  const { digits, n, schritte, quotient, rest } = computeLangeDivision(a, b);
  // Spalten: 1 Vorzeichenspalte + n Ziffernspalten (Ziffer i liegt in Spalte i+1) + 1 Suffixspalte
  const digitCols = n + 1;
  const table = el("table", { class: "division-tabelle" });

  function zeile(fill, suffix) {
    const tr = el("tr");
    for (let c = 0; c < digitCols; c++) tr.appendChild(fill(c));
    tr.appendChild(suffix || el("td"));
    return tr;
  }

  // Zeile 1: Dividend, dahinter " : Divisor = Quotient [Rest r]"
  table.appendChild(
    zeile(
      (c) => (c === 0 ? el("td") : el("td", { class: "digit" }, String(digits[c - 1]))),
      el("td", { class: "dq" }, ` : ${b.toLocaleString("de-DE")} = ${quotient.toLocaleString("de-DE")}${rest !== 0 ? " Rest " + rest.toLocaleString("de-DE") : ""}`)
    )
  );

  const s = schritte.findIndex((st) => st.q > 0);
  if (s === -1) {
    // Der Dividend ist kleiner als der Divisor — es gibt keinen Rechenschritt.
    mount.appendChild(table);
    document.getElementById("ldiv-probe").innerHTML =
      `${a.toLocaleString("de-DE")} ist kleiner als ${b.toLocaleString("de-DE")}: Der Quotient ist 0, der ganze Dividend bleibt als Rest übrig.`;
    return;
  }

  for (let k = s; k < n; k++) {
    const st = schritte[k];
    if (st.q === 0) continue; // Ziffer wird nur heruntergeholt, es wird nichts abgezogen
    // Wertzeile: beim ersten Schritt steht der Wert schon im Dividenden
    if (k > s) {
      const cur = String(st.cur);
      const endCol = k + 1;
      const startCol = endCol - cur.length + 1;
      table.appendChild(
        zeile((c) => (c >= startCol && c <= endCol ? el("td", { class: "digit" }, cur[c - startCol]) : el("td")))
      );
    }
    // Produktzeile mit Minuszeichen und Abschlussstrich
    const prod = String(st.prod);
    const endCol = k + 1;
    const startCol = endCol - prod.length + 1;
    table.appendChild(
      zeile((c) => {
        if (c === startCol - 1) return el("td", { class: "minus ustrich" }, "−");
        if (c >= startCol && c <= endCol) return el("td", { class: "digit ustrich" }, prod[c - startCol]);
        return el("td");
      })
    );
  }

  // Restzeile
  const restStr = String(rest);
  const restEnd = n;
  const restStart = restEnd - restStr.length + 1;
  table.appendChild(
    zeile((c) => (c >= restStart && c <= restEnd ? el("td", { class: "digit rest" }, restStr[c - restStart]) : el("td")))
  );

  mount.appendChild(table);

  document.getElementById("ldiv-probe").innerHTML =
    `Probe: ${b.toLocaleString("de-DE")} · ${quotient.toLocaleString("de-DE")}${rest !== 0 ? " + " + rest.toLocaleString("de-DE") : ""} = ${a.toLocaleString("de-DE")} ✓`;
}

function initLangeDivision() {
  function refresh() {
    const a = clampInt(document.getElementById("ldiv-a").value, 1, 999999);
    const b = clampInt(document.getElementById("ldiv-b").value, 1, 99);
    renderLangeDivision("ldiv-mount", a, b);
  }
  document.getElementById("ldiv-a").addEventListener("input", refresh);
  document.getElementById("ldiv-b").addEventListener("input", refresh);
  refresh();
}

// ================= 10. Gestaffelte Übungsaufgaben =================
// Wiederverwendbarer Baustein (identisch zum Lernpfad "Natürliche Zahlen und Größen"): Aufgabe 1
// (einfach) ist immer sichtbar, Aufgabe 2-4 (mittel/schwierig/komplex) liegen hinter Reitern. Jede
// Aufgabe hat einen Würfel-Knopf, der dieselbe Aufgabenart mit neuen Zufallszahlen neu stellt. Beim
// Prüfen werden Fehler UND eine Musterlösung angezeigt.

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
    const statusHtml = ok
      ? `<div class="status ok">✓ Richtig!</div>`
      : `<div class="status err">✗ Noch nicht richtig${raw ? " — deine Eingabe: " + raw : " — du hast noch keine Antwort eingetragen"}.</div>`;
    feedback.innerHTML = statusHtml + `<div class="musterloesung"><span class="ml-label">Musterlösung</span>${current.musterloesungHtml}</div>`;
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
  const a = randInt(2, 9),
    b = randInt(2, 9),
    c = randInt(2, 9);
  const useKlammer = Math.random() < 0.5;
  const correct = useKlammer ? (a + b) * c : a + b * c;
  return {
    promptHtml: useKlammer ? `Berechne: (${a} + ${b}) · ${c}` : `Berechne: ${a} + ${b} · ${c}`,
    correct,
    tolerance: 0.5,
    placeholder: "Ergebnis",
    musterloesungHtml: useKlammer
      ? `Klammer zuerst: ${a} + ${b} = ${a + b}. Dann: ${a + b} · ${c} = <strong>${correct}</strong>`
      : `Punkt vor Strich: ${b} · ${c} = ${b * c}. Dann: ${a} + ${b * c} = <strong>${correct}</strong>`,
  };
}

function generateAufgabe2() {
  const a = randInt(1000, 8999);
  const b = randInt(1000, 8999);
  const correct = a + b;
  return {
    promptHtml: `Berechne schriftlich: ${a.toLocaleString("de-DE")} + ${b.toLocaleString("de-DE")}`,
    correct,
    tolerance: 0.5,
    placeholder: "Summe",
    musterloesungHtml: `Stellengerecht untereinanderschreiben und spaltenweise mit Übertrag addieren: ${a.toLocaleString("de-DE")} + ${b.toLocaleString("de-DE")} = <strong>${correct.toLocaleString("de-DE")}</strong>`,
  };
}

// Umkehraufgabe: aus Minuend und Differenz den Subtrahenden bestimmen. Das verlangt, den
// Zusammenhang Minuend − Subtrahend = Differenz zu erkennen, statt nur ein Verfahren abzuarbeiten.
// Die Zahlen werden KONSTRUKTIV erzeugt (kein Verwerfen-und-neu-Ziehen): Sind die Einerziffern von
// Subtrahend und Differenz zusammen mindestens 10, entsteht bei s + d ein Übertrag — und genau dann
// muss bei m − d entbündelt werden. So terminiert die Erzeugung garantiert.
function generateAufgabe3() {
  const u1 = randInt(1, 9);
  const u2 = randInt(10 - u1, 9);
  const s = randInt(1, 8) * 1000 + randInt(0, 9) * 100 + randInt(0, 9) * 10 + u1;
  const d = randInt(1, 8) * 1000 + randInt(0, 9) * 100 + randInt(0, 9) * 10 + u2;
  const m = s + d;
  return {
    promptHtml: `Bei einer Subtraktion ist der <strong>Minuend ${m.toLocaleString("de-DE")}</strong>, die <strong>Differenz ${d.toLocaleString("de-DE")}</strong>.<br>Wie heißt der Subtrahend?`,
    correct: s,
    tolerance: 0.5,
    placeholder: "Subtrahend",
    musterloesungHtml:
      `Es gilt Minuend − Subtrahend = Differenz, also ist der Subtrahend = Minuend − Differenz.<br>` +
      `${m.toLocaleString("de-DE")} − ${d.toLocaleString("de-DE")} = <strong>${s.toLocaleString("de-DE")}</strong> (dabei muss entbündelt werden).<br>` +
      `Probe: ${s.toLocaleString("de-DE")} + ${d.toLocaleString("de-DE")} = ${m.toLocaleString("de-DE")} ✓`,
  };
}

function generateAufgabe4() {
  const a = randInt(3, 7),
    b = randInt(20, 40),
    c = randInt(2, 15),
    d = randInt(5, 12);
  const total = a * b - c;
  const q = Math.floor(total / d);
  const r = total - q * d;
  return {
    promptHtml: `Eine Firma produziert an ${a} Tagen je ${b} Teile. ${c} Teile davon sind fehlerhaft und werden aussortiert. Die übrigen Teile werden zu je ${d} Stück verpackt. Wie viele volle Packungen ergeben sich?`,
    correct: q,
    tolerance: 0.5,
    placeholder: "Anzahl Packungen",
    musterloesungHtml: `Produziert: ${a} · ${b} = ${a * b}. Ohne Ausschuss: ${a * b} − ${c} = ${total}. Verpackt zu je ${d}: ${total} : ${d} = ${q} Rest ${r} → <strong>${q} volle Packungen</strong> (${r} Teile bleiben übrig).`,
  };
}

function initExercises() {
  mountUebungsaufgaben(document.getElementById("exercises-mount"), [
    { schwierigkeit: "einfach", titel: "Aufgabe 1 — Rangfolge anwenden", generate: generateAufgabe1 },
    { schwierigkeit: "mittel", titel: "Aufgabe 2 — Schriftliche Addition", generate: generateAufgabe2 },
    { schwierigkeit: "schwierig", titel: "Aufgabe 3 — Fehlenden Subtrahenden bestimmen", generate: generateAufgabe3 },
    { schwierigkeit: "komplex", titel: "Aufgabe 4 — Mehrschrittige Textaufgabe", generate: generateAufgabe4 },
  ]);
}

// ================= Quizze =================

function initQuizzes() {
  mountQuiz(document.getElementById("quiz-fachbegriffe"), {
    q: "Wie heißt das Ergebnis einer Division?",
    options: ["Produkt", "Differenz", "Quotient", "Summe"],
    correct: 2,
    explain: "Dividend : Divisor = Quotient. Das Produkt gehört zur Multiplikation, die Differenz zur Subtraktion.",
  });
  mountQuiz(document.getElementById("quiz-rechengesetze"), {
    q: "Für welche Rechenarten gilt das Kommutativgesetz?",
    options: ["Für alle vier Grundrechenarten", "Nur für Addition und Multiplikation", "Nur für Subtraktion und Division", "Nur für die Addition"],
    correct: 1,
    explain: "Nur Addition und Multiplikation sind kommutativ. Bei Subtraktion und Division ändert das Vertauschen das Ergebnis: 12 − 4 = 8, aber 4 − 12 ist in ℕ gar nicht definiert.",
  });
  mountQuiz(document.getElementById("quiz-rangfolge"), {
    q: "Welchen Wert hat der Term 24 : 4 · 2?",
    options: ["3", "12", "48", "Der Term ist nicht eindeutig"],
    correct: 1,
    explain: "Division und Multiplikation haben denselben Rang, also wird von links nach rechts gerechnet: 24 : 4 = 6, dann 6 · 2 = 12.",
  });
  mountQuiz(document.getElementById("quiz-ueberschlag"), {
    q: "Wozu dient ein Überschlag?",
    options: [
      "Er ersetzt das genaue Rechnen und liefert das endgültige Ergebnis",
      "Er liefert schnell die Größenordnung und dient der Kontrolle des genauen Ergebnisses",
      "Er wird nur bei Divisionen gebraucht",
      "Er macht das Ergebnis genauer",
    ],
    correct: 1,
    explain: "Der Überschlag ist eine Kontrolle: Weicht das genaue Ergebnis stark von ihm ab, steckt meist ein Stellenwert- oder Übertragsfehler in der Rechnung.",
  });
  mountQuiz(document.getElementById("quiz-schriftlich-addition"), {
    q: "Was bedeutet ein Übertrag beim schriftlichen Addieren im Stellenwertsystem?",
    options: [
      "Dass man sich verrechnet hat",
      "Dass 10 Einheiten einer Stelle zu 1 Einheit der nächsthöheren Stelle gebündelt werden",
      "Dass die Zahlen gleich lang sein müssen",
      "Dass man die Spalte noch einmal rechnen muss",
    ],
    correct: 1,
    explain: "Ein Übertrag ist genau ein neues Bündel: 10 Einer werden zu 1 Zehner, 10 Zehner zu 1 Hunderter usw. Deshalb wandert er eine Spalte nach links.",
  });
  mountQuiz(document.getElementById("quiz-schriftlich-multiplikation"), {
    q: "Warum wird beim Multiplizieren mit einem mehrstelligen Faktor jedes Teilprodukt anders eingerückt?",
    options: [
      "Damit es übersichtlicher aussieht",
      "Weil jede Ziffer des zweiten Faktors einen anderen Stellenwert hat",
      "Weil man sonst zu wenig Platz hat",
      "Das Einrücken ist reine Gewohnheit und ohne Bedeutung",
    ],
    correct: 1,
    explain: "Die 5 in 56 steht für 50. Das Teilprodukt 234 · 5 bedeutet also 234 · 50 — deshalb wird es um eine Stelle nach links versetzt geschrieben.",
  });
  mountQuiz(document.getElementById("quiz-division"), {
    q: "Welche Bedingung muss der Rest r bei einer Division mit Rest erfüllen?",
    options: ["r muss größer als der Divisor sein", "r muss 0 sein", "0 ≤ r < Divisor", "r muss gerade sein"],
    correct: 2,
    explain: "Der Rest ist immer kleiner als der Divisor und nicht negativ — sonst ließe er sich noch weiter aufteilen.",
  });
}

// ================= Start =================

document.addEventListener("DOMContentLoaded", () => {
  initFachbegriffe();
  initRechengesetze();
  initRangfolge();
  initUeberschlag();
  initSchriftlichAddition();
  initSchriftlichMultiplikation();
  initDivision();
  initLangeDivision();
  initExercises();
  initQuizzes();
});
