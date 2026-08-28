// Selbstlernpfad "Stochastische Unabhängigkeit" (MSS 13). Rein clientseitiges Vanilla-JS, ohne
// Build-Schritt oder externe Bibliotheken — wie der Rest der Seite. Aufbau: kleine DOM/SVG-Helfer
// (identisch zu denen in den anderen Lernpfaden dieses Kapitels), dann je ein Abschnitt (Urne mit/
// ohne Zurücklegen, Multiplikationsregel als Test, Korrelation/Kausalität, Stolperstelle), zuletzt
// die Übungsaufgaben.

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
function pct(x) {
  return (x * 100).toLocaleString("de-DE", { maximumFractionDigits: 1 }) + " %";
}
function num(x, digits = 3) {
  return x.toLocaleString("de-DE", { maximumFractionDigits: digits });
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
  const input = el("input", { type: "text", placeholder: placeholder || "Antwort" });
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
    const inp = el("input", { type: "text", placeholder: "Dezimalzahl oder %" });
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
    spec.input.style.borderColor = ok ? "#157347" : "#b3261e";
    spec.input.style.background = ok ? "#e7f6ec" : "#fdecec";
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
  function cellNode(key) {
    if (key in given) return document.createTextNode(formatFn(given[key]));
    if (key in blanks) {
      const inp = el("input", {
        type: "text",
        placeholder: "?",
        style: "width:4.5rem;padding:0.3rem 0.4rem;border:1px solid var(--border);border-radius:6px;font-family:inherit;background:var(--card-bg);color:var(--text)",
      });
      cellRefs[key] = inp;
      return inp;
    }
    return document.createTextNode("");
  }

  const table = el("table", { class: "vft-table" });
  table.appendChild(el("tr", {}, [el("th", {}), ...colKeys.map((ck) => el("th", {}, (colLabel ? colLabel + ": " : "") + ck.label)), el("th", { class: "vft-gesamt" }, "gesamt")]));
  rowKeys.forEach((rk) => {
    const cells = colKeys.map((ck) => el("td", { class: "vft-cell" }, cellNode(rk.key + "_" + ck.key)));
    table.appendChild(el("tr", {}, [el("th", {}, (rowLabel ? rowLabel + ": " : "") + rk.label), ...cells, el("td", { class: "vft-gesamt" }, cellNode("row_" + rk.key))]));
  });
  table.appendChild(
    el("tr", {}, [el("th", { class: "vft-gesamt" }, "gesamt"), ...colKeys.map((ck) => el("td", { class: "vft-gesamt" }, cellNode("col_" + ck.key))), el("td", { class: "vft-gesamt" }, cellNode("grand"))])
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
    inp.style.borderColor = ok ? "#157347" : "#b3261e";
    inp.style.background = ok ? "#e7f6ec" : "#fdecec";
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
    explainBox.innerHTML =
      `P(${aName}) = ${rowSum(r)}/${grand} = ${num(pA, 3)} &nbsp;&nbsp; P(${bName}) = ${colSum(c.key)}/${grand} = ${num(pB, 3)}<br>` +
      `P(${aName}) · P(${bName}) = ${num(pA, 3)} · ${num(pB, 3)} ≈ <strong>${num(pApB, 3)}</strong><br>` +
      `P(${aName} ∩ ${bName}) = ${v}/${grand} = <strong>${num(pAB, 3)}</strong><br>` +
      (unabhaengig
        ? `<span style="color:#157347">✓ P(A∩B) ≈ P(A)·P(B) — die Ereignisse sind (in dieser Zelle) unabhängig.</span>`
        : `<span style="color:#b3261e">✗ P(A∩B) ≠ P(A)·P(B) — die Ereignisse sind abhängig (korreliert).</span>`);
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
        ? `<span style="color:#157347">✓ P<sub>grün</sub>(R) = P<sub>rot</sub>(R) — das Ergebnis des ersten Zugs beeinflusst R nicht: G und R sind <strong>unabhängig</strong>.</span>`
        : `<span style="color:#b3261e">✗ P<sub>grün</sub>(R) ≠ P<sub>rot</sub>(R) — das Ergebnis des ersten Zugs beeinflusst R: G und R sind <strong>abhängig</strong>.</span>`);
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
  const mount = document.getElementById("exercises-mount");

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

// ================= Quizze =================

function initQuizzes() {
  mountQuiz(document.getElementById("quiz-urne"), {
    q: "Woran erkennt man im Baumdiagramm, ob zwei Ereignisse unabhängig sind?",
    options: [
      "Die erste Stufe hat gleich große Äste.",
      "Die beiden Teilbäume der zweiten Stufe sind identisch.",
      "Der Baum hat genau vier Blätter.",
      "Alle Pfadwahrscheinlichkeiten sind gleich groß.",
    ],
    correct: 1,
    explain: "Sind die zweiten Stufen nach jedem Ast der ersten Stufe gleich, beeinflusst das Ergebnis der ersten Stufe die zweite nicht — das ist Unabhängigkeit.",
  });

  mountQuiz(document.getElementById("quiz-multiplikationsregel"), {
    q: "Wie prüft man mithilfe der Multiplikationsregel, ob A und B unabhängig sind?",
    options: [
      "P(A∩B) mit P(A)·P(B) vergleichen — stimmen sie überein, sind A und B unabhängig.",
      "P(A) und P(B) addieren und mit 1 vergleichen.",
      "Prüfen, ob P(A) = P(B) gilt.",
      "Die Randsummen der Vierfeldertafel vergleichen.",
    ],
    correct: 0,
    explain: "A und B sind genau dann stochastisch unabhängig, wenn P(A∩B) = P(A)·P(B) gilt.",
  });

  mountQuiz(document.getElementById("quiz-korrelation"), {
    q: "Was folgt korrekt aus einer nachgewiesenen Korrelation zwischen zwei Merkmalen?",
    options: [
      "Das eine Merkmal verursacht zwangsläufig das andere.",
      "Es besteht ein statistischer Zusammenhang, aber die Ursache muss nicht direkt zwischen den Merkmalen liegen.",
      "Die Merkmale sind unabhängig.",
      "Man kann daraus überhaupt nichts schließen.",
    ],
    correct: 1,
    explain: "Korrelation zeigt einen statistischen Zusammenhang — die Ursache kann auch in einem gemeinsamen weiteren Merkmal liegen (Kausalität ist nicht automatisch belegt).",
  });

  mountQuiz(document.getElementById("quiz-stolperstelle"), {
    q: "Was ist der Fehler in Eriks Argumentation?",
    options: [
      "Die Prozentzahlen 47 % und 61 % sind falsch umgerechnet.",
      "Er hat die Multiplikationsregel P(A∩B) = P(A)·P(B) angewendet, obwohl die Unabhängigkeit von Geschlecht und Haarlänge nirgends gezeigt wurde.",
      "Man darf Prozentwerte grundsätzlich nicht multiplizieren.",
      "„Männlich“ und „kurze Haare“ sind gar keine Ereignisse.",
    ],
    correct: 1,
    explain: "Die Multiplikationsregel P(A∩B) = P(A)·P(B) gilt nur bei nachgewiesener Unabhängigkeit — die wurde hier nicht gezeigt, also ist die Rechnung unbegründet.",
  });
}

// ================= Start =================

document.addEventListener("DOMContentLoaded", () => {
  initUrneUnabhaengig();
  initMultiplikationsregel();
  initKorrelationKausalitaet();
  initExercises();
  initQuizzes();
});
