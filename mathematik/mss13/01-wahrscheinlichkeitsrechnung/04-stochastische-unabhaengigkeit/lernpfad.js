// Selbstlernpfad "Stochastische Unabhängigkeit" (MSS 13). Rein clientseitiges Vanilla-JS, ohne
// Build-Schritt oder externe Bibliotheken — wie der Rest der Seite. Aufbau: kleine DOM/SVG-Helfer
// (identisch zu denen in den anderen Lernpfaden dieses Kapitels), dann je ein Abschnitt (Urne mit/
// ohne Zurücklegen, Multiplikationsregel als Test, Korrelation/Kausalität, Stolperstelle), zuletzt
// die Übungsaufgaben.

"use strict";

import { mountUebungsaufgaben } from "../../../aufgaben.js?v=2";
import { AUFGABEN, parseZahl } from "./aufgaben-unabhaengig.js?v=1";

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
// Ein Zahlformat je Stellenzahl, einmal angelegt: toLocaleString() baut bei jedem Aufruf ein neues
// Intl.NumberFormat, und das kostet rund 40-mal so viel wie das Formatieren selbst — bei jeder
// Reglerbewegung dutzendfach.
const ZAHLFORMATE = new Map();
function zahlformat(stellen) {
  let f = ZAHLFORMATE.get(stellen);
  if (!f) ZAHLFORMATE.set(stellen, (f = new Intl.NumberFormat("de-DE", { maximumFractionDigits: stellen })));
  return f;
}
function pct(x) {
  return zahlformat(1).format(x * 100) + " %";
}
function num(x, digits = 3) {
  return zahlformat(digits).format(x);
}
// Toleranter Zahlen-Parser: erlaubt "0,25", "1/4" und "25%" als Antwort.
function parseFlexibleNumber(raw) {
  if (raw == null) return NaN;
  let s = String(raw).trim().replace(",", ".");
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
function circled(n) {
  return String.fromCodePoint(0x2460 + (n - 1));
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

// ---------- Baustein: einfache Text-Antwort-Aufgabe ----------

function mountExercise(container, { title, prompt, placeholder, check, explain }) {
  const box = el("div", { class: "exercise" });
  box.appendChild(el("h3", {}, title));
  box.appendChild(el("p", { html: prompt }));
  const input = el("input", { type: "text", placeholder: placeholder || "Antwort", "aria-label": "Antwort zu: " + title });
  const btn = el("button", { type: "button", class: "btn btn-primary" }, "Prüfen");
  const feedback = el("div", { class: "exercise-feedback" });
  const row = el("div", { class: "exercise-input-row" }, [input, btn]);
  btn.addEventListener("click", () => {
    const ok = check(parseFlexibleNumber(input.value), input.value);
    feedback.className = "exercise-feedback " + (ok ? "ok" : "err");
    feedback.textContent = (ok ? "✓ Richtig! " : "✗ Noch nicht. ") + (explain || "");
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") btn.click();
  });
  box.appendChild(row);
  box.appendChild(feedback);
  container.appendChild(box);
  return box;
}

// ---------- Baumdiagramm-Renderer (interaktiv) ----------
function renderTree(mountEl, stage1, stage2Fn) {
  mountEl.innerHTML = "";
  const W = 560,
    marginY = 26;
  const leaves = [];
  const nodes1 = [];
  let y = marginY;
  const perLeaf = [];
  stage1.forEach((b1, i) => {
    const kids = stage2Fn(i, b1);
    perLeaf.push(kids.length);
  });
  const totalLeaves = perLeaf.reduce((a, b) => a + b, 0);
  const H = Math.max(160, totalLeaves * 46 + marginY * 2);
  const leafGap = (H - marginY * 2) / totalLeaves;

  stage1.forEach((b1, i) => {
    const kids = stage2Fn(i, b1);
    const yStart = y;
    kids.forEach((b2) => {
      const cy = y + leafGap / 2;
      leaves.push({ i, b1, b2, cy, path: b1.p * b2.p });
      y += leafGap;
    });
    nodes1.push({ i, b1, cy: (yStart + y) / 2 });
  });
  const rootY = H / 2;
  const rootX = 30,
    x1 = W * 0.36,
    x2 = W * 0.68,
    xEnd = W - 20;

  const svg = svgEl("svg", { viewBox: `0 0 ${W} ${H}`, class: "tree-svg" });

  nodes1.forEach((n1) => {
    svg.appendChild(svgEl("path", { d: `M ${rootX} ${rootY} L ${x1} ${n1.cy}`, class: "tree-edge" }));
    const mx = (rootX + x1) / 2,
      my = (rootY + n1.cy) / 2 - 6;
    svg.appendChild(svgEl("text", { x: mx, y: my, class: "tree-edge-label", "text-anchor": "middle" })).textContent = n1.b1.label + " (" + num(n1.b1.p, 3) + ")";
  });

  leaves.forEach((lf) => {
    const n1 = nodes1[lf.i];
    svg.appendChild(svgEl("path", { d: `M ${x1} ${n1.cy} L ${x2} ${lf.cy}`, class: "tree-edge" }));
    const mx = (x1 + x2) / 2,
      my = (n1.cy + lf.cy) / 2 - 6;
    const lbl = svgEl("text", { x: mx, y: my, class: "tree-edge-label", "text-anchor": "middle" });
    lbl.textContent = lf.b2.label + " (" + num(lf.b2.p, 3) + ")";
    svg.appendChild(lbl);

    svg.appendChild(svgEl("line", { x1: x2, y1: lf.cy, x2: xEnd, y2: lf.cy, class: "tree-edge" }));
    const leafLabel = svgEl("text", { x: x2 + 6, y: lf.cy - 14, class: "tree-leaf-label" });
    leafLabel.textContent = n1.b1.label + " – " + lf.b2.label;
    svg.appendChild(leafLabel);
    const probLabel = svgEl("text", { x: x2 + 6, y: lf.cy + 14, class: "tree-leaf-prob" });
    probLabel.textContent = "P = " + num(lf.path, 4);
    svg.appendChild(probLabel);
  });

  const rootDot = svgEl("g", { class: "tree-node" });
  rootDot.appendChild(svgEl("circle", { cx: rootX, cy: rootY, r: 5 }));
  svg.appendChild(rootDot);
  nodes1.forEach((n1) => {
    const g = svgEl("g", { class: "tree-node" });
    g.appendChild(svgEl("circle", { cx: x1, cy: n1.cy, r: 5 }));
    svg.appendChild(g);
  });

  mountEl.appendChild(svg);
  return { svg, leaves };
}

// ---------- Baustein: Baumdiagramm mit nummerierten Lücken ----------
function buildTreeFill(box, { stage1, stage2Fn, blankSpecs }) {
  const W = 560,
    H = 230,
    marginY = 24;
  const leafGap = (H - 2 * marginY) / 4;
  const leaves = [];
  const nodes1 = [];
  let y = marginY;
  stage1.forEach((b1, i) => {
    const kids = stage2Fn(i, b1);
    const yStart = y;
    kids.forEach((b2) => {
      const cy = y + leafGap / 2;
      leaves.push({ i, b1, b2, cy, path: b1.p * b2.p });
      y += leafGap;
    });
    nodes1.push({ i, b1, cy: (yStart + y) / 2 });
  });
  const rootY = H / 2,
    rootX = 30,
    x1 = W * 0.36,
    x2 = W * 0.68,
    xEnd = W - 20;

  let counter = 0;
  const s1BlankMap = {},
    s2BlankMap = {},
    leafBlankMap = {};
  blankSpecs.forEach((spec) => {
    counter++;
    spec.num = counter;
    if (spec.kind === "s1") s1BlankMap[spec.i] = spec;
    else if (spec.kind === "s2") s2BlankMap[spec.leafIdx] = spec;
    else leafBlankMap[spec.leafIdx] = spec;
  });

  const svg = svgEl("svg", { viewBox: `0 0 ${W} ${H}`, class: "tree-svg" });
  nodes1.forEach((n1) => {
    svg.appendChild(svgEl("path", { d: `M ${rootX} ${rootY} L ${x1} ${n1.cy}`, class: "tree-edge" }));
    const mx = (rootX + x1) / 2,
      my = (rootY + n1.cy) / 2 - 6;
    const spec = s1BlankMap[n1.i];
    const t = svgEl("text", { x: mx, y: my, "text-anchor": "middle", class: "tree-edge-label" + (spec ? " tree-blank" : "") });
    if (spec) t.setAttribute("data-blank", spec.num);
    t.textContent = spec ? circled(spec.num) + " ?" : n1.b1.label + " (" + num(n1.b1.p, 3) + ")";
    svg.appendChild(t);
  });
  leaves.forEach((lf, idx) => {
    const n1 = nodes1[lf.i];
    svg.appendChild(svgEl("path", { d: `M ${x1} ${n1.cy} L ${x2} ${lf.cy}`, class: "tree-edge" }));
    const mx = (x1 + x2) / 2,
      my = (n1.cy + lf.cy) / 2 - 6;
    const spec2 = s2BlankMap[idx];
    const t2 = svgEl("text", { x: mx, y: my, "text-anchor": "middle", class: "tree-edge-label" + (spec2 ? " tree-blank" : "") });
    if (spec2) t2.setAttribute("data-blank", spec2.num);
    t2.textContent = spec2 ? circled(spec2.num) + " ?" : lf.b2.label + " (" + num(lf.b2.p, 3) + ")";
    svg.appendChild(t2);

    svg.appendChild(svgEl("line", { x1: x2, y1: lf.cy, x2: xEnd, y2: lf.cy, class: "tree-edge" }));
    const leafLabel = svgEl("text", { x: x2 + 6, y: lf.cy - 14, class: "tree-leaf-label" });
    leafLabel.textContent = lf.b1.label + " – " + lf.b2.label;
    svg.appendChild(leafLabel);

    const specL = leafBlankMap[idx];
    const probLabel = svgEl("text", { x: x2 + 6, y: lf.cy + 14, class: "tree-leaf-prob" + (specL ? " tree-blank" : "") });
    if (specL) probLabel.setAttribute("data-blank", specL.num);
    probLabel.textContent = specL ? "P = " + circled(specL.num) + " ?" : "P = " + num(lf.path, 4);
    svg.appendChild(probLabel);
  });
  const rootDot = el("g", { class: "tree-node" });
  rootDot.appendChild(svgEl("circle", { cx: rootX, cy: rootY, r: 5 }));
  svg.appendChild(rootDot);
  nodes1.forEach((n1) => {
    const g = el("g", { class: "tree-node" });
    g.appendChild(svgEl("circle", { cx: x1, cy: n1.cy, r: 5 }));
    svg.appendChild(g);
  });
  box.appendChild(svg);

  const list = el("ol", { class: "exercise-blank-list" });
  blankSpecs.forEach((spec) => {
    const inp = el("input", { type: "text", placeholder: "Dezimalzahl oder %", "aria-label": spec.labelText });
    spec.input = inp;
    list.appendChild(el("li", {}, [circled(spec.num) + " " + spec.labelText + ": ", inp]));
  });
  box.appendChild(list);

  return { svg };
}
function checkTreeBlanks(svg, blankSpecs) {
  let allOk = true;
  blankSpecs.forEach((spec) => {
    const val = parseFlexibleNumber(spec.input.value);
    const ok = Math.abs(val - spec.correct) < 0.01;
    if (!ok) allOk = false;
    spec.input.classList.toggle("eingabe-ok", ok);
    spec.input.classList.toggle("eingabe-fehler", !ok);
    const svgText = svg.querySelector(`[data-blank="${spec.num}"]`);
    if (svgText) {
      svgText.textContent = spec.render(spec.correct);
      svgText.classList.remove("tree-blank");
      svgText.classList.add(ok ? "tree-blank-correct" : "tree-blank-wrong");
    }
  });
  return allOk;
}
function mountTreeFillExercise(container, { title, prompt, stage1, stage2Fn, blankSpecs, explain }) {
  const box = el("div", { class: "exercise" });
  box.appendChild(el("h3", {}, title));
  box.appendChild(el("p", { html: prompt }));
  const { svg } = buildTreeFill(box, { stage1, stage2Fn, blankSpecs });

  const btn = el("button", { type: "button", class: "btn btn-primary" }, "Prüfen");
  const feedback = el("div", { class: "exercise-feedback" });
  box.appendChild(el("div", { class: "btn-row" }, btn));
  box.appendChild(feedback);
  btn.addEventListener("click", () => {
    const allOk = checkTreeBlanks(svg, blankSpecs);
    feedback.className = "exercise-feedback " + (allOk ? "ok" : "err");
    feedback.textContent = (allOk ? "✓ Alles richtig! " : "✗ Noch nicht alles richtig — die korrekten Werte stehen jetzt im Baum. ") + (explain || "");
  });

  container.appendChild(box);
}

// ---------- Baustein: Vierfeldertafel mit Lücken ----------
function buildVftFill(box, { rowLabel, colLabel, rowKeys, colKeys, given, blanks, formatFn }) {
  const cellRefs = {};
  // name: Zeile und Spalte der Zelle. Eine Tabellenzelle hat keine sichtbare Beschriftung, ein
  // Screenreader wüsste sonst nicht, welches Feld er gerade vorliest.
  function cellNode(key, name) {
    if (key in given) return document.createTextNode(formatFn(given[key]));
    if (key in blanks) {
      const inp = el("input", {
        type: "text",
        placeholder: "?",
        class: "eingabe",
        style: "width:4.5rem;padding:0.3rem 0.4rem",
        "aria-label": name,
      });
      cellRefs[key] = inp;
      return inp;
    }
    return document.createTextNode("");
  }

  const table = el("table", { class: "vft-table" });
  table.appendChild(el("tr", {}, [el("th", {}), ...colKeys.map((ck) => el("th", {}, (colLabel ? colLabel + ": " : "") + ck.label)), el("th", { class: "vft-gesamt" }, "gesamt")]));
  rowKeys.forEach((rk) => {
    const cells = colKeys.map((ck) => el("td", { class: "vft-cell" }, cellNode(rk.key + "_" + ck.key, (rowLabel ? rowLabel + ": " : "") + rk.label + ", " + (colLabel ? colLabel + ": " : "") + ck.label)));
    table.appendChild(el("tr", {}, [el("th", {}, (rowLabel ? rowLabel + ": " : "") + rk.label), ...cells, el("td", { class: "vft-gesamt" }, cellNode("row_" + rk.key, (rowLabel ? rowLabel + ": " : "") + rk.label + ", gesamt"))]));
  });
  table.appendChild(
    el("tr", {}, [el("th", { class: "vft-gesamt" }, "gesamt"), ...colKeys.map((ck) => el("td", { class: "vft-gesamt" }, cellNode("col_" + ck.key, (colLabel ? colLabel + ": " : "") + ck.label + ", gesamt"))), el("td", { class: "vft-gesamt" }, cellNode("grand", "Gesamtsumme"))])
  );
  box.appendChild(table);
  return { cellRefs };
}
function checkVftBlanks(cellRefs, blanks) {
  let allOk = true;
  Object.keys(blanks).forEach((key) => {
    const inp = cellRefs[key];
    const val = parseFlexibleNumber(inp.value);
    const ok = Math.abs(val - blanks[key]) < 0.01;
    if (!ok) allOk = false;
    inp.classList.toggle("eingabe-ok", ok);
    inp.classList.toggle("eingabe-fehler", !ok);
  });
  return allOk;
}
function mountVftFillExercise(container, { title, prompt, rowLabel, colLabel, rowKeys, colKeys, given, blanks, formatFn, explain }) {
  const box = el("div", { class: "exercise" });
  box.appendChild(el("h3", {}, title));
  box.appendChild(el("p", { html: prompt }));
  const { cellRefs } = buildVftFill(box, { rowLabel, colLabel, rowKeys, colKeys, given, blanks, formatFn });

  const btn = el("button", { type: "button", class: "btn btn-primary" }, "Prüfen");
  const feedback = el("div", { class: "exercise-feedback" });
  box.appendChild(el("div", { class: "btn-row" }, btn));
  box.appendChild(feedback);
  btn.addEventListener("click", () => {
    const allOk = checkVftBlanks(cellRefs, blanks);
    feedback.className = "exercise-feedback " + (allOk ? "ok" : "err");
    feedback.textContent = (allOk ? "✓ Alles richtig! " : "✗ Noch nicht alle Felder richtig. ") + (explain || "");
  });

  container.appendChild(box);
}

// ---------- Baustein: Vierfeldertafel mit Unabhängigkeitstest per Klick ----------
// Klickt man eine Zelle an, wird P(A∩B) (der tatsächliche Zellenwert) mit P(A)·P(B) (dem Produkt
// der Randwahrscheinlichkeiten) verglichen — das ist genau die Multiplikationsregel als Test.
function initIndependenceVft(mountId, explainId, { rowLabel, colLabel, rows, cols, aName, bName }) {
  const mount = document.getElementById(mountId);
  const explainBox = document.getElementById(explainId);
  const rowSum = (r) => cols.reduce((s, c) => s + r[c.key], 0);
  const colSum = (ck) => rows.reduce((s, r) => s + r[ck], 0);
  const grand = rows.reduce((s, r) => s + rowSum(r), 0);

  const table = el("table", { class: "vft-table" });
  const allCells = [];
  table.appendChild(el("tr", {}, [el("th", {}), ...cols.map((c) => el("th", {}, c.label)), el("th", { class: "vft-gesamt" }, "gesamt")]));
  rows.forEach((r) => {
    const cells = cols.map((c) => {
      const td = el("td", { class: "vft-cell" }, String(r[c.key]));
      td.addEventListener("click", () => explainCell(r, c, td));
      allCells.push(td);
      return td;
    });
    table.appendChild(el("tr", {}, [el("th", {}, r.label), ...cells, el("td", { class: "vft-gesamt" }, String(rowSum(r)))]));
  });
  table.appendChild(el("tr", {}, [el("th", { class: "vft-gesamt" }, "gesamt"), ...cols.map((c) => el("td", { class: "vft-gesamt" }, String(colSum(c.key)))), el("td", { class: "vft-gesamt" }, String(grand))]));
  mount.innerHTML = "";
  mount.appendChild(table);

  function explainCell(r, c, td) {
    allCells.forEach((cell) => cell.classList.remove("vft-highlight"));
    td.classList.add("vft-highlight");
    const v = r[c.key];
    const pA = rowSum(r) / grand,
      pB = colSum(c.key) / grand,
      pAB = v / grand,
      pApB = pA * pB;
    const unabhaengig = Math.abs(pAB - pApB) < 0.005;
    const a = r.label, b = c.label;
    explainBox.innerHTML =
      `P(${a}) = ${rowSum(r)}/${grand} = ${num(pA, 3)} &nbsp;&nbsp; P(${b}) = ${colSum(c.key)}/${grand} = ${num(pB, 3)}<br>` +
      `P(${a}) · P(${b}) = ${num(pA, 3)} · ${num(pB, 3)} ≈ <strong>${num(pApB, 3)}</strong><br>` +
      `P(${a} ∩ ${b}) = ${v}/${grand} ≈ <strong>${num(pAB, 3)}</strong><br>` +
      (unabhaengig
        ? `<span class="farbe-gruen">✓ Beide Werte stimmen überein — „${a}“ und „${b}“ sind unabhängig.</span>`
        : `<span class="farbe-rot">✗ Die Werte weichen um ${num(Math.abs(pAB - pApB), 3)} voneinander ab — „${a}“ und „${b}“ sind abhängig (korreliert).</span>`);
  }
}

// ================= 1. Urne mit/ohne Zurücklegen =================

function initUrneUnabhaengig() {
  const urn0 = { gruen: 3, rot: 4 };
  let mode = "ohne";

  function stage1() {
    const total = urn0.gruen + urn0.rot;
    return [
      { key: "gruen", label: "grün", p: urn0.gruen / total },
      { key: "rot", label: "rot", p: urn0.rot / total },
    ];
  }
  function stage2Fn(i, b1) {
    const total = urn0.gruen + urn0.rot;
    if (mode === "mit") {
      return [
        { key: "gruen", label: "grün", p: urn0.gruen / total },
        { key: "rot", label: "rot", p: urn0.rot / total },
      ];
    }
    const remaining = { ...urn0 };
    remaining[b1.key] -= 1;
    const total2 = total - 1;
    return [
      { key: "gruen", label: "grün", p: remaining.gruen / total2 },
      { key: "rot", label: "rot", p: remaining.rot / total2 },
    ];
  }

  const toggleWrap = document.getElementById("urn-mode-toggle");
  const btnMit = el("button", { type: "button", class: "btn" }, "mit Zurücklegen");
  const btnOhne = el("button", { type: "button", class: "btn active" }, "ohne Zurücklegen");
  toggleWrap.appendChild(btnMit);
  toggleWrap.appendChild(btnOhne);

  const treeMount = document.getElementById("urn-tree-mount");
  const vergleichBox = document.getElementById("urn-vergleich");

  function refresh() {
    const s1 = stage1();
    renderTree(treeMount, s1, stage2Fn);
    const s2NachGruen = stage2Fn(0, s1[0]);
    const s2NachRot = stage2Fn(1, s1[1]);
    const pGruenR = s2NachGruen.find((b) => b.key === "rot").p;
    const pRotR = s2NachRot.find((b) => b.key === "rot").p;
    const pR = s1[0].p * pGruenR + s1[1].p * pRotR;
    const gleich = Math.abs(pGruenR - pRotR) < 0.001;
    vergleichBox.innerHTML =
      `P<sub>grün</sub>(R) = ${num(pGruenR, 3)} &nbsp;&nbsp; P<sub>rot</sub>(R) = ${num(pRotR, 3)} &nbsp;&nbsp; P(R) = ${num(pR, 3)}<br>` +
      (gleich
        ? `<span class="farbe-gruen">✓ P<sub>grün</sub>(R) = P<sub>rot</sub>(R) — das Ergebnis des ersten Zugs beeinflusst R nicht: G und R sind <strong>unabhängig</strong>.</span>`
        : `<span class="farbe-rot">✗ P<sub>grün</sub>(R) ≠ P<sub>rot</sub>(R) — das Ergebnis des ersten Zugs beeinflusst R: G und R sind <strong>abhängig</strong>.</span>`);
  }

  btnMit.addEventListener("click", () => {
    mode = "mit";
    btnMit.classList.add("active");
    btnOhne.classList.remove("active");
    refresh();
  });
  btnOhne.addEventListener("click", () => {
    mode = "ohne";
    btnOhne.classList.add("active");
    btnMit.classList.remove("active");
    refresh();
  });

  refresh();
}

// ================= 2. Multiplikationsregel als Test =================

function initMultiplikationsregel() {
  initIndependenceVft("mult-vft-mount", "mult-explain", {
    rows: [
      { key: "mehr", label: "arbeitet mehr als 40h/Woche", ruhig: 213, unruhig: 132 },
      { key: "bis", label: "arbeitet bis zu 40h/Woche", ruhig: 126, unruhig: 50 },
    ],
    cols: [
      { key: "ruhig", label: "schläft ruhig" },
      { key: "unruhig", label: "schläft unruhig" },
    ],
    aName: "arbeitet mehr als 40h",
    bName: "schläft ruhig/unruhig",
  });
}

// ================= 3. Korrelation und Kausalität =================

function initKorrelationKausalitaet() {
  initIndependenceVft("korrelation-vft-mount", "korrelation-explain", {
    rows: [
      { key: "schal", label: "trägt Schal", erkaeltet: 35, nicht: 15 },
      { key: "keinschal", label: "kein Schal", erkaeltet: 5, nicht: 45 },
    ],
    cols: [
      { key: "erkaeltet", label: "erkältet" },
      { key: "nicht", label: "nicht erkältet" },
    ],
    aName: "Schal",
    bName: "erkältet",
  });
}

// ================= 6. Übungsaufgaben =================

function initExercises() {
  const mount = document.getElementById("ausfuell-mount");

  // Aufgabe 1 (leicht) — Abhängigkeit direkt aus einer Vierfeldertafel ablesen.
  mountExercise(mount, {
    title: "Aufgabe 1 — Abhängigkeit erkennen",
    prompt:
      "Die Vierfeldertafel zeigt die Ergebnisse einer Untersuchung zu Handynutzung und IQ (400 befragte Personen):" +
      '<table class="vft-table" style="max-width:420px;margin:0.6rem 0">' +
      "<tr><th></th><th>intensiv</th><th>nicht intensiv</th><th class=\"vft-gesamt\">gesamt</th></tr>" +
      "<tr><th>IQ &gt; 130</th><td>60</td><td>90</td><td class=\"vft-gesamt\">150</td></tr>" +
      "<tr><th>IQ ≤ 130</th><td>140</td><td>110</td><td class=\"vft-gesamt\">250</td></tr>" +
      "<tr><th class=\"vft-gesamt\">gesamt</th><td class=\"vft-gesamt\">200</td><td class=\"vft-gesamt\">200</td><td class=\"vft-gesamt\">400</td></tr>" +
      "</table>" +
      "Berechne P<sub>IQ&gt;130</sub>(intensiv) — die Wahrscheinlichkeit, dass eine Person mit IQ &gt; 130 das Handy intensiv nutzt.",
    placeholder: "Dezimalzahl oder %",
    check: (v) => Math.abs(v - 0.4) < 0.01,
    explain: "P_{IQ>130}(intensiv) = 60/150 = 0,4. Das weicht von P(intensiv) = 200/400 = 0,5 ab — die Merkmale sind also abhängig.",
  });

  // Aufgabe 2 (leicht-mittel) — Unabhängigkeit beim Würfeln nachrechnen.
  mountExercise(mount, {
    title: "Aufgabe 2 — Unabhängigkeit beim Würfeln",
    prompt:
      "Zwei Würfel werden geworfen. A: „Der erste Würfel zeigt eine 4.“ C: „Die Augensumme ist 7.“ " +
      "Berechne P(A ∩ C) — die Wahrscheinlichkeit, dass beide Ereignisse gleichzeitig eintreten.",
    placeholder: "Dezimalzahl oder Bruch",
    check: (v) => Math.abs(v - 1 / 36) < 0.003,
    explain:
      "A ∩ C tritt nur bei (4,3) ein: P(A∩C) = 1/36. Das stimmt mit P(A)·P(C) = 1/6 · 1/6 = 1/36 überein — A und C sind unabhängig " +
      "(unabhängig davon, welche Zahl der erste Würfel zeigt, gibt es immer genau eine passende zweite Zahl zur Summe 7).",
  });

  // Aufgabe 3 (mittel) — Vierfeldertafel mithilfe der Unabhängigkeit vervollständigen (Randwerte gegeben).
  mountVftFillExercise(mount, {
    title: "Aufgabe 3 — Vierfeldertafel bei Unabhängigkeit ergänzen",
    prompt:
      "In einer Fahrschule bestehen 75&nbsp;% der Fahrschülerinnen und Fahrschüler die Prüfung beim ersten Versuch, die übrigen 25&nbsp;% nicht. " +
      "40&nbsp;% aller Fahrschüler nehmen mehr als 10 Übungsstunden. Die Ereignisse „besteht die Prüfung“ und „mehr als 10 Übungsstunden“ seien " +
      "<strong>unabhängig</strong>. Vervollständige die Vierfeldertafel mit relativen Häufigkeiten.",
    rowLabel: "",
    colLabel: "",
    rowKeys: [
      { key: "bestanden", label: "bestanden" },
      { key: "nicht", label: "nicht bestanden" },
    ],
    colKeys: [
      { key: "viel", label: "&gt; 10 Übungsstunden" },
      { key: "wenig", label: "≤ 10 Übungsstunden" },
    ],
    given: { row_bestanden: 0.75, row_nicht: 0.25, col_viel: 0.4, col_wenig: 0.6, grand: 1 },
    blanks: { bestanden_viel: 0.3, bestanden_wenig: 0.45, nicht_viel: 0.1, nicht_wenig: 0.15 },
    formatFn: (v) => pct(v),
    explain: "Bei Unabhängigkeit gilt P(A∩B) = P(A)·P(B): 0,75·0,4 = 0,3; 0,75·0,6 = 0,45; 0,25·0,4 = 0,1; 0,25·0,6 = 0,15.",
  });

  // Aufgabe 4 (mittel-schwer) — Baumdiagramm mit Zurücklegen: beide Teilbäume der 2. Stufe sind
  // bei Unabhängigkeit identisch. Direkt an das Urnen-Beispiel aus Abschnitt 1 angelehnt, mit
  // einer neuen Urne.
  mountTreeFillExercise(mount, {
    title: "Aufgabe 4 — Unabhängigkeit im Baumdiagramm (mit Zurücklegen)",
    prompt:
      "In einer Urne liegen 6 gelbe und 2 blaue Kugeln. Es werden nacheinander zwei Kugeln <strong>mit Zurücklegen</strong> gezogen. " +
      "Vervollständige die zweite Stufe des Baumdiagramms — bei Unabhängigkeit sind beide Teilbäume gleich.",
    stage1: [
      { key: "gelb", label: "gelb", p: 0.75 },
      { key: "blau", label: "blau", p: 0.25 },
    ],
    stage2Fn: () => [
      { key: "gelb", label: "gelb", p: 0.75 },
      { key: "blau", label: "blau", p: 0.25 },
    ],
    blankSpecs: [
      { kind: "s2", leafIdx: 0, correct: 0.75, labelText: "2. Ast nach „gelb“: „gelb“", render: (v) => "gelb (" + num(v, 3) + ")" },
      { kind: "s2", leafIdx: 1, correct: 0.25, labelText: "2. Ast nach „gelb“: „blau“", render: (v) => "blau (" + num(v, 3) + ")" },
      { kind: "s2", leafIdx: 2, correct: 0.75, labelText: "2. Ast nach „blau“: „gelb“", render: (v) => "gelb (" + num(v, 3) + ")" },
      { kind: "s2", leafIdx: 3, correct: 0.25, labelText: "2. Ast nach „blau“: „blau“", render: (v) => "blau (" + num(v, 3) + ")" },
    ],
    explain:
      "Da zurückgelegt wird, bleibt die Zusammensetzung der Urne bei jedem Zug gleich: 6 gelbe, 2 blaue von 8 — beide Teilbäume der zweiten Stufe " +
      "sind identisch (gelb 0,75 / blau 0,25), unabhängig vom Ergebnis des ersten Zugs. Genau das kennzeichnet Unabhängigkeit.",
  });

  // Aufgabe 5 (am schwersten) — vollständige Vierfeldertafel bei Unabhängigkeit, Randwerte nur
  // teilweise gegeben (P(B) steht nur im Text, nicht in der Tafel).
  mountVftFillExercise(mount, {
    title: "Aufgabe 5 — Vierfeldertafel komplett ergänzen",
    prompt:
      "Zwei Ereignisse A und B seien unabhängig. Es gilt P(A) = 0,35 und P(B) = 0,8. Vervollständige die komplette Vierfeldertafel " +
      "(auch die Randwerte für B stehen noch nicht in der Tafel — nutze dafür den im Text gegebenen Wert).",
    rowLabel: "",
    colLabel: "",
    rowKeys: [
      { key: "a", label: "A" },
      { key: "ahat", label: "Ā" },
    ],
    colKeys: [
      { key: "b", label: "B" },
      { key: "bhat", label: "B̄" },
    ],
    given: { row_a: 0.35, row_ahat: 0.65, grand: 1 },
    blanks: { a_b: 0.28, a_bhat: 0.07, ahat_b: 0.52, ahat_bhat: 0.13, col_b: 0.8, col_bhat: 0.2 },
    formatFn: (v) => pct(v),
    explain:
      "P(A∩B) = 0,35·0,8 = 0,28. P(A∩B̄) = 0,35·0,2 = 0,07. P(Ā∩B) = 0,65·0,8 = 0,52. P(Ā∩B̄) = 0,65·0,2 = 0,13. " +
      "Die Randwerte für B ergeben sich als Spaltensummen (bzw. direkt aus dem gegebenen P(B) = 0,8): 0,28+0,52 = 0,8, 0,07+0,13 = 0,2.",
  });
}

// ================= 2b. Unabhängigkeit im Flächenmodell =================
//
// Unabhängig heißt: Die Bedingung ändert nichts, P_A(B) = P_Ā(B). Im Flächenmodell liegen die
// waagerechten Schnitte dann in beiden Spalten auf DERSELBEN Höhe — der untere Streifen B ist
// ein durchgehendes Band, und seine Fläche P(B) ist genau diese Höhe. Dann ist das Rechteck
// A ∩ B einfach Breite · Höhe = P(A) · P(B): die Multiplikationsregel.
//
// Sobald die Schnitte verschieden hoch liegen, weicht P(A ∩ B) von P(A) · P(B) ab — und zwar um
// d = P(A) · P(Ā) · (P_A(B) − P_Ā(B)). Die Bilanz rechnet d aus den Reglerwerten.

const UM_SEITE = 300, UM_RAND = 44;

function renderUnabhModell() {
  const a = Number(document.getElementById("um-a").value) / 100;
  const x = Number(document.getElementById("um-x").value) / 100;
  const y = Number(document.getElementById("um-y").value) / 100;
  document.getElementById("um-a-anzeige").textContent = Math.round(a * 100) + " %";
  document.getElementById("um-x-anzeige").textContent = Math.round(x * 100) + " %";
  document.getElementById("um-y-anzeige").textContent = Math.round(y * 100) + " %";
  const W = UM_SEITE + 2 * UM_RAND + 30, H = UM_SEITE + 2 * UM_RAND;
  const svg = svgEl("svg", { viewBox: `0 0 ${W} ${H}`, width: W, height: H, class: "fm-svg", role: "img", "aria-label": "Flächenmodell zur Unabhängigkeit" });
  const x0 = UM_RAND, y0 = UM_RAND, s = UM_SEITE;
  const wA = s * a;
  const teile = [
    { k: "AB", x: x0, y: y0 + s - s * x, w: wA, h: s * x, klasse: "fm-a-b" },
    { k: "ABq", x: x0, y: y0, w: wA, h: s - s * x, klasse: "fm-a-nb" },
    { k: "AqB", x: x0 + wA, y: y0 + s - s * y, w: s - wA, h: s * y, klasse: "fm-na-b" },
    { k: "AqBq", x: x0 + wA, y: y0, w: s - wA, h: s - s * y, klasse: "fm-na-nb" },
  ];
  for (const t of teile) {
    if (t.w < 1e-9 || t.h < 1e-9) continue;
    svg.appendChild(svgEl("rect", { x: t.x.toFixed(2), y: t.y.toFixed(2), width: t.w.toFixed(2), height: t.h.toFixed(2), class: t.klasse, "data-teil": t.k }));
  }
  // Die waagerechten Schnitte — auf gleicher Höhe genau dann, wenn unabhängig.
  svg.appendChild(svgEl("line", { x1: x0, y1: (y0 + s - s * x).toFixed(2), x2: (x0 + wA).toFixed(2), y2: (y0 + s - s * x).toFixed(2), class: "fm-trenn-h", "data-schnitt": "A" }));
  svg.appendChild(svgEl("line", { x1: (x0 + wA).toFixed(2), y1: (y0 + s - s * y).toFixed(2), x2: x0 + s, y2: (y0 + s - s * y).toFixed(2), class: "fm-trenn-h", "data-schnitt": "Aq" }));
  svg.appendChild(svgEl("line", { x1: (x0 + wA).toFixed(2), y1: y0, x2: (x0 + wA).toFixed(2), y2: y0 + s, class: "fm-trenn" }));
  svg.appendChild(svgEl("rect", { x: x0, y: y0, width: s, height: s, class: "fm-rahmen", "data-rolle": "quadrat" }));
  const t = (xx, yy, inhalt, k = "fm-text", anker = "middle") => {
    const e = svgEl("text", { x: xx.toFixed(1), y: yy.toFixed(1), class: k, "text-anchor": anker });
    e.textContent = inhalt;
    svg.appendChild(e);
  };
  t(x0 + wA / 2, y0 + s + 18, "A");
  t(x0 + wA + (s - wA) / 2, y0 + s + 18, "Ā");
  t(x0 + s + 8, y0 + s - (s * y) / 2 + 4, "B", "fm-text", "start");
  const mount = document.getElementById("um-mount");
  mount.innerHTML = "";
  mount.appendChild(svg);

  const ab = a * x, b = a * x + (1 - a) * y, d = ab - a * b;
  const gleich = Math.abs(x - y) < 1e-9;
  // Vor der Ausgabe runden (sonst „−0“) und das echte Minuszeichen setzen; ein negativer Faktor
  // steht in Klammern — „0,9 · 0,1 · −0,9“ wäre keine saubere Schreibweise.
  const n = (v) => {
    const g = Math.round(v * 1e4) / 1e4;
    return num(g === 0 ? 0 : g, 4).replace("-", "−");
  };
  const faktor = (v) => (Math.round(v * 1e4) < 0 ? `(${n(v)})` : n(v));
  document.getElementById("um-bilanz").innerHTML =
    `P(A ∩ B) = ${n(a)} · ${n(x)} = <span class="wa">${n(ab)}</span> &nbsp;·&nbsp; P(B) = ${n(ab)} + ${n((1 - a) * y)} = ${n(b)} &nbsp;·&nbsp; P(A) · P(B) = <span class="wc">${n(a * b)}</span><br>` +
    `d = P(A ∩ B) − P(A) · P(B) = <strong>${n(d)}</strong> = P(A) · P(Ā) · (P<sub>A</sub>(B) − P<sub>Ā</sub>(B)) = ${n(a)} · ${n(1 - a)} · ${faktor(x - y)}`;
  document.getElementById("um-text").textContent = gleich
    ? "Beide Schnitte liegen auf derselben Höhe: B ist ein durchgehender Streifen, und das Wissen um A ändert nichts. A und B sind unabhängig — und P(A ∩ B) = P(A) · P(B) ist einfach Breite mal Höhe."
    : `Die Schnitte liegen verschieden hoch: Unter A ist B ${x > y ? "häufiger" : "seltener"} als unter Ā. A und B sind abhängig, und P(A ∩ B) weicht um ${n(Math.abs(d))} von P(A) · P(B) ab.`;
}

// ================= Quizze =================
//
// Die richtige Antwort steht bewusst an wechselnder Stelle.
const QUIZZE = {
  "quiz-urne": {
    q: "Woran erkennt man im Baumdiagramm, ob zwei Ereignisse unabhängig sind?",
    options: [
      "Die erste Stufe hat gleich große Äste.",
      "Der Baum hat genau vier Blätter.",
      "Alle Pfadwahrscheinlichkeiten sind gleich groß.",
      "Die beiden Teilbäume der zweiten Stufe sind identisch.",
    ],
    correct: 3,
    explain: "Stehen nach jedem Ast der ersten Stufe dieselben Wahrscheinlichkeiten, beeinflusst die erste Stufe die zweite nicht. Im Flächenmodell liegen die waagerechten Schnitte dann auf gleicher Höhe — wie beim Ziehen mit Zurücklegen.",
  },
  "quiz-multiplikationsregel": {
    q: "Wie prüft man mithilfe der Multiplikationsregel, ob A und B unabhängig sind?",
    options: [
      "P(A) und P(B) addieren und mit 1 vergleichen.",
      "P(A ∩ B) mit P(A) · P(B) vergleichen — stimmen sie überein, sind A und B unabhängig.",
      "Prüfen, ob P(A) = P(B) gilt.",
      "Die Randsummen der Vierfeldertafel vergleichen.",
    ],
    correct: 1,
    explain: "Genau dann unabhängig, wenn P(A ∩ B) = P(A) · P(B). Der Unterschied d = P(A ∩ B) − P(A) · P(B) misst sogar, wie weit A und B davon entfernt sind; im Flächenmodell ist d genau dann 0, wenn die Schnitte gleich hoch liegen.",
  },
  "quiz-korrelation": {
    q: "Was folgt korrekt aus einer nachgewiesenen Korrelation zwischen zwei Merkmalen?",
    options: [
      "Es besteht ein statistischer Zusammenhang, aber die Ursache muss nicht direkt zwischen den Merkmalen liegen.",
      "Das eine Merkmal verursacht zwangsläufig das andere.",
      "Die Merkmale sind unabhängig.",
      "Man kann daraus überhaupt nichts schließen.",
    ],
    correct: 0,
    explain: "Korrelation heißt: stochastisch abhängig. Die Ursache kann ein drittes Merkmal sein — Schal und Erkältung hängen beide vom kalten Wetter ab. Um Kausalität zu zeigen, braucht man mehr als eine Vierfeldertafel, etwa ein Experiment.",
  },
  "quiz-stolperstelle": {
    q: "Was ist der Fehler in Eriks Argumentation?",
    options: [
      "Die Prozentzahlen 47 % und 61 % sind falsch umgerechnet.",
      "Man darf Prozentwerte grundsätzlich nicht multiplizieren.",
      "Er hat die Multiplikationsregel angewendet, obwohl die Unabhängigkeit von Geschlecht und Haarlänge nirgends gezeigt wurde.",
      "„Männlich“ und „kurze Haare“ sind gar keine Ereignisse.",
    ],
    correct: 2,
    explain: "Die Gegenwahrscheinlichkeiten 47 % und 61 % stimmen. Aber P(A ∩ B) = P(A) · P(B) gilt nur bei Unabhängigkeit — ohne sie braucht man eine Angabe über das gemeinsame Auftreten, etwa den Anteil der Frauen mit langen Haaren, und rechnet über die Vierfeldertafel.",
  },
};

function initQuizzes() {
  for (const [id, def] of Object.entries(QUIZZE)) mountQuiz(document.getElementById(id), def);
}

// ================= Selbsteinschätzung =================
const SE_PUNKTE = [
  ["sec-urne-unabhaengig", "Ich kann an einem Baum erkennen, ob zwei Ereignisse unabhängig sind."],
  ["sec-multiplikationsregel", "Ich kann mit der Multiplikationsregel prüfen, ob A und B unabhängig sind, und das im Flächenmodell deuten."],
  ["sec-korrelation-kausalitaet", "Ich kann Korrelation und Kausalität unterscheiden."],
  ["sec-stolperstelle", "Ich wende die Multiplikationsregel nur an, wenn die Unabhängigkeit gezeigt oder vorausgesetzt ist."],
];

const SE_SCHLUESSEL = "uplant-mss13-unabhaengig-selbsteinschaetzung";
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
  if (!Object.keys(stand).length) aus.textContent = "Noch nichts angekreuzt.";
  else if (unsicher.length) aus.innerHTML = `Wiederhole zuerst: ${unsicher.map(([id]) => `<a href="#${id}">${document.querySelector(`#${id} h2`).textContent}</a>`).join(", ")}. Danach passen die Übungsaufgaben auf den Stufen „einfach“ und „mittel“.`;
  else aus.textContent = `${sicher} von ${SE_PUNKTE.length} Punkten sicher — probier dich an den Aufgaben auf den Stufen „schwierig“ und „komplex“.`;
}

// ================= Start =================

document.addEventListener("DOMContentLoaded", () => {
  initUrneUnabhaengig();
  initMultiplikationsregel();
  initKorrelationKausalitaet();
  initExercises();
  initQuizzes();
  ["um-a", "um-x", "um-y"].forEach((id) => {
    const e = document.getElementById(id);
    e.addEventListener("input", renderUnabhModell);
    e.addEventListener("change", renderUnabhModell);
  });
  renderUnabhModell();   // nicht vergessen — sonst bleibt das Modell leer
  renderSelbsteinschaetzung();
  mountUebungsaufgaben(document.getElementById("exercises-mount"), AUFGABEN, { parse: parseZahl });
});
