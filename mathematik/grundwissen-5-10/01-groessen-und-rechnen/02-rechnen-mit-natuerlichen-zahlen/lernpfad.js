// Selbstlernpfad "Rechnen mit natürlichen Zahlen" (Grundwissen Klasse 5-10). Rein clientseitiges
// Vanilla-JS, ohne Build-Schritt oder externe Bibliotheken — wie der Rest der Seite. Aufbau: kleine
// DOM/SVG-Helfer, dann je ein Abschnitt (Rechengesetze, Rangfolge, schriftliche Addition/
// Subtraktion, schriftliche Multiplikation, Division mit Rest), zuletzt die gestaffelten
// Übungsaufgaben (derselbe Baustein wie im Lernpfad "Natürliche Zahlen und Größen").

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

// ================= 1. Rechengesetze: Distributivgesetz-Flächenmodell =================

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
function initRechengesetze() {
  ["dist-a", "dist-b", "dist-c"].forEach((id) => document.getElementById(id).addEventListener("input", renderDistributiv));
  renderDistributiv();
}

// ================= 2. Rangfolge =================

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
function initRangfolge() {
  ["rang-a", "rang-b", "rang-c"].forEach((id) => document.getElementById(id).addEventListener("input", renderRangfolge));
  renderRangfolge();
}

// ================= 3. Schriftliche Addition und Subtraktion =================

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

  const bRow = el("tr", { class: "rechenzeile" });
  bRow.appendChild(el("td", { class: "op" }, "+"));
  for (let j = 0; j < cols; j++) {
    const realIdx = finalCarry ? j - 1 : j;
    const v = realIdx >= 0 ? db[realIdx] : null;
    bRow.appendChild(el("td", { class: v == null ? "blank" : "digit" }, v == null ? "" : String(v)));
  }
  table.appendChild(bRow);

  const resRow = el("tr");
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

  const bRow = el("tr", { class: "rechenzeile" });
  bRow.appendChild(el("td", { class: "op" }, "−"));
  db.forEach((d) => bRow.appendChild(el("td", { class: "digit" }, String(d))));
  table.appendChild(bRow);

  const resRow = el("tr");
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

// ================= 4. Schriftliche Multiplikation =================

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

  const bRow = el("tr", { class: "rechenzeile" });
  bRow.appendChild(el("td", { class: "op" }, "·"));
  for (let j = 0; j < cols; j++) {
    const realIdx = finalCarry ? j - 1 : j;
    bRow.appendChild(el("td", { class: realIdx === len - 1 ? "digit" : "blank" }, realIdx === len - 1 ? String(m) : ""));
  }
  table.appendChild(bRow);

  const resRow = el("tr");
  resRow.appendChild(el("td"));
  for (let j = 0; j < cols; j++) {
    const realIdx = finalCarry ? j - 1 : j;
    const v = realIdx < 0 ? finalCarry : product[realIdx];
    resRow.appendChild(el("td", { class: "digit", style: "color:var(--accent-dark)" }, String(v)));
  }
  table.appendChild(resRow);

  mount.appendChild(table);
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
}

// ================= 5. Division mit Rest =================

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

// ================= 7. Gestaffelte Übungsaufgaben =================
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
function generateAufgabe3() {
  // b so konstruiert, dass beim Subtrahieren garantiert entbündelt werden muss. a = 9999 ist
  // ausgeschlossen: mit lauter Neunen kann keine Ziffer von b je größer sein, sonst würde die
  // Schleife unten nie enden.
  const a = randInt(4000, 9998);
  let b;
  do {
    b = randInt(1000, a);
  } while (!String(a).split("").some((d, i) => Number(d) < Number(String(b).padStart(String(a).length, "0")[i])));
  const correct = a - b;
  return {
    promptHtml: `Berechne schriftlich: ${a.toLocaleString("de-DE")} − ${b.toLocaleString("de-DE")}`,
    correct,
    tolerance: 0.5,
    placeholder: "Differenz",
    musterloesungHtml: `Spaltenweise subtrahieren, wo nötig entbündeln (10 von der Nachbarspalte leihen): ${a.toLocaleString("de-DE")} − ${b.toLocaleString("de-DE")} = <strong>${correct.toLocaleString("de-DE")}</strong>`,
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
    { schwierigkeit: "schwierig", titel: "Aufgabe 3 — Schriftliche Subtraktion mit Entbündeln", generate: generateAufgabe3 },
    { schwierigkeit: "komplex", titel: "Aufgabe 4 — Mehrschrittige Textaufgabe", generate: generateAufgabe4 },
  ]);
}

// ================= Quizze =================

function initQuizzes() {
  mountQuiz(document.getElementById("quiz-rechengesetze"), {
    q: "Welches Gesetz besagt, dass a · (b + c) = a · b + a · c gilt?",
    options: ["Kommutativgesetz", "Assoziativgesetz", "Distributivgesetz", "Kein Gesetz, das ist immer falsch"],
    correct: 2,
    explain: "Das ist das Distributivgesetz — es verbindet Multiplikation und Addition.",
  });
  mountQuiz(document.getElementById("quiz-rangfolge"), {
    q: "In welcher Reihenfolge wird der Term 5 + 2 · 3 ausgewertet?",
    options: ["Erst 5 + 2 = 7, dann 7 · 3 = 21", "Erst 2 · 3 = 6, dann 5 + 6 = 11", "Von links nach rechts, egal welche Rechenart", "Das Ergebnis ist immer gleich, egal wie man rechnet"],
    correct: 1,
    explain: "Punkt vor Strich: die Multiplikation 2 · 3 wird zuerst berechnet.",
  });
  mountQuiz(document.getElementById("quiz-schriftlich-addition"), {
    q: "Wann braucht man beim schriftlichen Addieren einen Übertrag?",
    options: ["Wenn die Spaltensumme 10 oder mehr ergibt", "Wenn eine der beiden Zahlen gerade ist", "Immer, in jeder Spalte", "Nur bei der letzten Spalte"],
    correct: 0,
    explain: "Ist die Summe einer Spalte 10 oder größer, wird die Zehnerstelle als Übertrag in die nächste (linke) Spalte notiert.",
  });
  mountQuiz(document.getElementById("quiz-schriftlich-multiplikation"), {
    q: "Warum entsteht bei der schriftlichen Multiplikation manchmal eine zusätzliche Ziffer am Anfang des Ergebnisses?",
    options: ["Durch einen Rechenfehler", "Weil ein Übertrag aus der letzten (linken) Spalte übrig bleibt", "Das passiert nie", "Weil man immer eine 1 voranstellt"],
    correct: 1,
    explain: "Bleibt nach der letzten Spalte noch ein Übertrag übrig, wird er als zusätzliche Ziffer vorangestellt.",
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
  initRechengesetze();
  initRangfolge();
  initSchriftlichAddition();
  initSchriftlichMultiplikation();
  initDivision();
  initExercises();
  initQuizzes();
});
