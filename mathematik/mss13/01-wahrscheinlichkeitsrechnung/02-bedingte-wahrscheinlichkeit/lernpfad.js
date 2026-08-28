// Selbstlernpfad "Bedingte Wahrscheinlichkeit" (MSS 13). Rein clientseitiges Vanilla-JS, ohne
// Build-Schritt oder externe Bibliotheken — wie der Rest der Seite. Aufbau: kleine DOM/SVG-Helfer
// (identisch zu denen im Lernpfad "Grundbegriffe..."), dann je ein Abschnitt (Baumdiagramm,
// reduzierte Ergebnismenge, Vierfeldertafel, Formel, Stolperstelle), zuletzt die Übungsaufgaben.

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

// ---------- Baumdiagramm-Renderer (interaktiv, mit Klick-Highlight) ----------
// Identisch zum Renderer im Lernpfad "Grundbegriffe...": generisch, ohne inhaltliche Bindung.
function renderTree(mountEl, stage1, stage2Fn, opts = {}) {
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
    const path = svgEl("path", { d: `M ${rootX} ${rootY} L ${x1} ${n1.cy}`, class: "tree-edge", "data-edge1": n1.i });
    svg.appendChild(path);
    const mx = (rootX + x1) / 2,
      my = (rootY + n1.cy) / 2 - 6;
    svg.appendChild(svgEl("text", { x: mx, y: my, class: "tree-edge-label", "text-anchor": "middle" })).textContent = n1.b1.label + " (" + num(n1.b1.p, 3) + ")";
  });

  leaves.forEach((lf, idx) => {
    const n1 = nodes1[lf.i];
    const path = svgEl("path", { d: `M ${x1} ${n1.cy} L ${x2} ${lf.cy}`, class: "tree-edge", "data-edge2": idx });
    svg.appendChild(path);
    const mx = (x1 + x2) / 2,
      my = (n1.cy + lf.cy) / 2 - 6;
    const lbl = svgEl("text", { x: mx, y: my, class: "tree-edge-label", "text-anchor": "middle" });
    lbl.textContent = lf.b2.label + " (" + num(lf.b2.p, 3) + ")";
    svg.appendChild(lbl);

    svg.appendChild(svgEl("line", { x1: x2, y1: lf.cy, x2: xEnd, y2: lf.cy, class: "tree-edge" }));
    const leafLabel = svgEl("text", { x: x2 + 6, y: lf.cy - 14, class: "tree-leaf-label" });
    leafLabel.textContent = n1.b1.label + " – " + lf.b2.label;
    svg.appendChild(leafLabel);
    const probLabel = svgEl("text", { x: x2 + 6, y: lf.cy + 14, class: "tree-leaf-prob", "data-leaf": idx });
    probLabel.textContent = "P = " + num(lf.path, 4);
    svg.appendChild(probLabel);
    const hit = svgEl("rect", { x: x1, y: lf.cy - leafGap / 2, width: xEnd - x1, height: leafGap, class: "tree-leaf-hit", "data-leaf-hit": idx });
    svg.appendChild(hit);
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

  function highlight(leafIdx) {
    svg.querySelectorAll(".tree-highlight").forEach((n) => n.classList.remove("tree-highlight"));
    if (leafIdx == null) return;
    const lf = leaves[leafIdx];
    svg.querySelector(`[data-edge1="${lf.i}"]`)?.classList.add("tree-highlight");
    svg.querySelector(`[data-edge2="${leafIdx}"]`)?.classList.add("tree-highlight");
    svg.querySelector(`[data-leaf="${leafIdx}"]`)?.classList.add("tree-highlight");
  }
  leaves.forEach((lf, idx) => {
    const hit = svg.querySelector(`[data-leaf-hit="${idx}"]`);
    hit.addEventListener("click", () => {
      highlight(idx);
      if (opts.onLeafClick) opts.onLeafClick(idx, lf);
    });
    hit.style.cursor = "pointer";
  });

  return { svg, leaves, highlight };
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

// ---------- Baustein: Baumdiagramm aus einer fertigen Vierfeldertafel rekonstruieren ----------
function mountTreeFromVftExercise(container, { title, prompt, vft, stage1, stage2Fn, blankSpecs, explain }) {
  const box = el("div", { class: "exercise" });
  box.appendChild(el("h3", {}, title));
  box.appendChild(el("p", { html: prompt }));
  box.appendChild(el("p", {}, el("strong", {}, "Gegebene Vierfeldertafel")));
  buildVftFill(box, { ...vft, blanks: {} });
  box.appendChild(el("p", {}, el("strong", {}, "Baumdiagramm ausfüllen")));
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

// ================= 1. Bedingte Wahrscheinlichkeit am Baumdiagramm =================

function initBaumBedingt() {
  const stage1 = [
    { key: "m", label: "männlich", p: 0.51 },
    { key: "w", label: "weiblich", p: 0.49 },
  ];
  function stage2Fn(i, b1) {
    if (b1.key === "m") {
      return [
        { key: "s", label: "Sehschwäche", p: 0.09 },
        { key: "ks", label: "keine Sehschwäche", p: 0.91 },
      ];
    }
    return [
      { key: "s", label: "Sehschwäche", p: 0.008 },
      { key: "ks", label: "keine Sehschwäche", p: 0.992 },
    ];
  }
  const mount = document.getElementById("tree-bedingt-mount");
  const explainBox = document.getElementById("tree-bedingt-explain");
  renderTree(mount, stage1, stage2Fn, {
    onLeafClick(idx, lf) {
      const shortA = lf.b1.key === "m" ? "M" : "W";
      const shortB = lf.b2.key === "s" ? "S" : "S̄";
      explainBox.innerHTML =
        `<strong>P<sub>${shortA}</sub>(${shortB}) = ${num(lf.b2.p, 3)} (${pct(lf.b2.p)})</strong><br>` +
        `Das ist die Wahrscheinlichkeit für „${lf.b2.label}“, unter der Bedingung, dass die Person „${lf.b1.label}“ ist — genau der Wert am zweiten Ast dieses Pfades.`;
    },
  });
}

// ================= 2. Reduzierte Ergebnismenge =================

function initReduziert() {
  const pickerA = document.getElementById("picker-a");
  const pickerB = document.getElementById("picker-b");
  const out = document.getElementById("reduziert-out");
  const setA = new Set();
  const setB = new Set();

  for (let n = 1; n <= 6; n++) {
    const ba = el("button", { type: "button" }, String(n));
    ba.addEventListener("click", () => {
      if (setA.has(n)) setA.delete(n);
      else setA.add(n);
      ba.classList.toggle("active-a");
      refresh();
    });
    pickerA.appendChild(ba);

    const bb = el("button", { type: "button" }, String(n));
    bb.addEventListener("click", () => {
      if (setB.has(n)) setB.delete(n);
      else setB.add(n);
      bb.classList.toggle("active-b");
      refresh();
    });
    pickerB.appendChild(bb);
  }

  function refresh() {
    const aList = [...setA].sort((x, y) => x - y);
    const bList = [...setB].sort((x, y) => x - y);
    if (aList.length === 0) {
      out.innerHTML = "Wähle mindestens eine Zahl für Ereignis A aus.";
      return;
    }
    const intersection = aList.filter((n) => setB.has(n));
    const pAB = intersection.length / aList.length;
    out.innerHTML =
      `Ω = {1, 2, 3, 4, 5, 6}<br>` +
      `A = {${aList.join(", ")}} → reduzierte Ergebnismenge Ω<sub>A</sub> = A, |A| = ${aList.length}<br>` +
      `B = {${bList.length ? bList.join(", ") : "–"}}<br>` +
      `A ∩ B = {${intersection.length ? intersection.join(", ") : "–"}}, |A ∩ B| = ${intersection.length}<br>` +
      `P<sub>A</sub>(B) = |A ∩ B| / |A| = ${intersection.length}/${aList.length} = <strong>${num(pAB, 3)} (${pct(pAB)})</strong>`;
  }
  refresh();
}

// ================= 3. Vierfeldertafel: bedingte Wahrscheinlichkeit in beide Richtungen =================

function initVftBedingt() {
  const rows = [
    { key: "ueber50", label: "über 50 Jahre", ja: 270, nein: 330 },
    { key: "bis50", label: "bis 50 Jahre", ja: 380, nein: 20 },
  ];
  const cols = [
    { key: "ja", label: "Mobile-Banking ja" },
    { key: "nein", label: "Mobile-Banking nein" },
  ];
  const rowSum = (r) => r.ja + r.nein;
  const colSum = (ck) => rows.reduce((s, r) => s + r[ck], 0);
  const grand = rows.reduce((s, r) => s + rowSum(r), 0);

  const mount = document.getElementById("vft-bedingt-mount");
  const explainBox = document.getElementById("vft-bedingt-explain");
  const table = el("table", { class: "vft-table" });
  const allCells = [];
  table.appendChild(el("tr", {}, [el("th", {}), ...cols.map((c) => el("th", {}, c.key)), el("th", { class: "vft-gesamt" }, "gesamt")]));
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
  mount.appendChild(table);

  function explainCell(r, c, td) {
    allCells.forEach((cell) => cell.classList.remove("vft-highlight"));
    td.classList.add("vft-highlight");
    const v = r[c.key];
    const rs = rowSum(r),
      cs = colSum(c.key);
    const pRow = v / rs,
      pCol = v / cs;
    explainBox.innerHTML =
      `<strong>Zeile als Bedingung:</strong> P<sub>${r.label}</sub>(${c.label}) = ${v} / ${rs} = <strong>${num(pRow, 3)} (${pct(pRow)})</strong><br>` +
      `<strong>Spalte als Bedingung:</strong> P<sub>${c.label}</sub>(${r.label}) = ${v} / ${cs} = <strong>${num(pCol, 3)} (${pct(pCol)})</strong>` +
      (Math.abs(pRow - pCol) > 0.001 ? "<br><em>Die beiden Werte sind unterschiedlich — die Reihenfolge (was als Bedingung gilt) macht also einen Unterschied!</em>" : "");
  }
}

// ================= 5. Stolperstelle =================

function initStolperstelle() {
  const stage1 = [
    { key: "r", label: "Raucher", p: 0.5 },
    { key: "nr", label: "Nichtraucher", p: 0.5 },
  ];
  function wrongStage2Fn(i, b1) {
    if (b1.key === "r") {
      return [
        { key: "b", label: "Bronchitis", p: 0.4 },
        { key: "kb", label: "keine Bronchitis", p: 0.1 },
      ];
    }
    return [
      { key: "b", label: "Bronchitis", p: 0.06 },
      { key: "kb", label: "keine Bronchitis", p: 0.44 },
    ];
  }
  function correctStage2Fn(i, b1) {
    if (b1.key === "r") {
      return [
        { key: "b", label: "Bronchitis", p: 0.8 },
        { key: "kb", label: "keine Bronchitis", p: 0.2 },
      ];
    }
    return [
      { key: "b", label: "Bronchitis", p: 0.12 },
      { key: "kb", label: "keine Bronchitis", p: 0.88 },
    ];
  }
  renderTree(document.getElementById("tree-leon-wrong-mount"), stage1, wrongStage2Fn);
  renderTree(document.getElementById("tree-leon-correct-mount"), stage1, correctStage2Fn);
}

// ================= 6. Übungsaufgaben =================

function initExercises() {
  const mount = document.getElementById("exercises-mount");

  // Aufgabe 1 (leicht) — bedingte Wahrscheinlichkeit direkt aus einer gegebenen Vierfeldertafel ablesen.
  mountExercise(mount, {
    title: "Aufgabe 1 — Bedingte Wahrscheinlichkeit ablesen",
    prompt:
      "Die Vierfeldertafel zeigt, wie viele Mädchen und Jungen einer Klasse Instagram nutzen (absolute Häufigkeiten):" +
      '<table class="vft-table" style="max-width:380px;margin:0.6rem 0">' +
      "<tr><th></th><th>Instagram ja</th><th>Instagram nein</th><th class=\"vft-gesamt\">gesamt</th></tr>" +
      "<tr><th>Mädchen</th><td>45</td><td>15</td><td class=\"vft-gesamt\">60</td></tr>" +
      "<tr><th>Jungen</th><td>20</td><td>20</td><td class=\"vft-gesamt\">40</td></tr>" +
      "<tr><th class=\"vft-gesamt\">gesamt</th><td class=\"vft-gesamt\">65</td><td class=\"vft-gesamt\">35</td><td class=\"vft-gesamt\">100</td></tr>" +
      "</table>" +
      "Bestimme P<sub>Mädchen</sub>(Instagram) — die Wahrscheinlichkeit, dass ein zufällig ausgewähltes Mädchen Instagram nutzt.",
    placeholder: "Dezimalzahl oder %",
    check: (v) => Math.abs(v - 0.75) < 0.01,
    explain: "P_Mädchen(Instagram) = 45/60 = 0,75 (75 %).",
  });

  // Aufgabe 2 (leicht-mittel) — Pfadmultiplikationsregel rückwärts: aus P(A) und PA(B) die Verbund-
  // wahrscheinlichkeit P(A∩B) berechnen.
  mountExercise(mount, {
    title: "Aufgabe 2 — Verbundwahrscheinlichkeit berechnen",
    prompt:
      "Ein Baumdiagramm hat als erste Stufe P(Regen) = 0,3 und P(kein Regen) = 0,7. Die zweite Stufe zeigt die bedingten Wahrscheinlichkeiten: " +
      "P<sub>Regen</sub>(Verspätung) = 0,6 und P<sub>kein Regen</sub>(Verspätung) = 0,1. Berechne P(Regen ∩ Verspätung).",
    placeholder: "Dezimalzahl oder %",
    check: (v) => Math.abs(v - 0.18) < 0.01,
    explain: "Pfadmultiplikationsregel: P(Regen ∩ Verspätung) = P(Regen) · P_Regen(Verspätung) = 0,3 · 0,6 = 0,18.",
  });

  // Aufgabe 3 (mittel) — Vierfeldertafel aus zwei gegebenen bedingten Wahrscheinlichkeiten füllen.
  mountVftFillExercise(mount, {
    title: "Aufgabe 3 — Vierfeldertafel aus bedingten Wahrscheinlichkeiten füllen",
    prompt:
      "In einem Sportverein sind 60&nbsp;% der Jugendlichen Jungen, 40&nbsp;% Mädchen. Unter den Jungen lesen 30&nbsp;% Comics " +
      "(P<sub>Jungen</sub>(Comics) = 0,3), unter den Mädchen 55&nbsp;% (P<sub>Mädchen</sub>(Comics) = 0,55). Vervollständige die " +
      "Vierfeldertafel mit relativen Häufigkeiten — nutze dazu die Pfadmultiplikationsregel P(A) · P<sub>A</sub>(B) = P(A∩B).",
    rowLabel: "",
    colLabel: "",
    rowKeys: [
      { key: "jungen", label: "Jungen" },
      { key: "maedchen", label: "Mädchen" },
    ],
    colKeys: [
      { key: "comics", label: "Comics ja" },
      { key: "keincomics", label: "Comics nein" },
    ],
    given: { row_jungen: 0.6, row_maedchen: 0.4, grand: 1 },
    blanks: { jungen_comics: 0.18, jungen_keincomics: 0.42, maedchen_comics: 0.22, maedchen_keincomics: 0.18, col_comics: 0.4, col_keincomics: 0.6 },
    formatFn: (v) => pct(v),
    explain:
      "Jungen ∩ Comics = 0,6 · 0,3 = 0,18. Jungen ∩ keine Comics = 0,6 · 0,7 = 0,42. Mädchen ∩ Comics = 0,4 · 0,55 = 0,22. Mädchen ∩ keine Comics = 0,4 · 0,45 = 0,18. " +
      "Spaltensummen: Comics gesamt = 0,18+0,22 = 0,4, keine Comics gesamt = 0,42+0,18 = 0,6.",
  });

  // Aufgabe 4 (schwer) — komplettes Baumdiagramm aus einer Vierfeldertafel rekonstruieren
  // (echte Textbuch-Daten: Impfstudie).
  const impfVft = {
    rowLabel: "",
    colLabel: "",
    rowKeys: [
      { key: "geimpft", label: "geimpft" },
      { key: "nicht", label: "nicht geimpft" },
    ],
    colKeys: [
      { key: "krank", label: "krank" },
      { key: "gesund", label: "gesund" },
    ],
    given: { geimpft_krank: 0.06, geimpft_gesund: 0.26, nicht_krank: 0.13, nicht_gesund: 0.55, row_geimpft: 0.32, row_nicht: 0.68, col_krank: 0.19, col_gesund: 0.81, grand: 1 },
    blanks: {},
    formatFn: (v) => pct(v),
  };
  mountTreeFromVftExercise(mount, {
    title: "Aufgabe 4 — Vierfeldertafel → vollständiges Baumdiagramm",
    prompt:
      "Die Vierfeldertafel zeigt die Ergebnisse einer Impfstudie (relative Häufigkeiten). Rekonstruiere das komplette Baumdiagramm — erste " +
      "Stufe: geimpft/nicht geimpft, zweite Stufe: die bedingten Wahrscheinlichkeiten P<sub>geimpft</sub>(krank) usw. (Zellenwert ÷ Zeilensumme).",
    vft: impfVft,
    stage1: [
      { key: "geimpft", label: "geimpft", p: 0.32 },
      { key: "nicht", label: "nicht geimpft", p: 0.68 },
    ],
    stage2Fn: (i, b1) => {
      if (b1.key === "geimpft") return [
        { key: "krank", label: "krank", p: 0.06 / 0.32 },
        { key: "gesund", label: "gesund", p: 0.26 / 0.32 },
      ];
      return [
        { key: "krank", label: "krank", p: 0.13 / 0.68 },
        { key: "gesund", label: "gesund", p: 0.55 / 0.68 },
      ];
    },
    blankSpecs: [
      { kind: "s1", i: 0, correct: 0.32, labelText: "1. Ast: „geimpft“", render: (v) => "geimpft (" + num(v, 3) + ")" },
      { kind: "s1", i: 1, correct: 0.68, labelText: "1. Ast: „nicht geimpft“", render: (v) => "nicht geimpft (" + num(v, 3) + ")" },
      { kind: "s2", leafIdx: 0, correct: 0.06 / 0.32, labelText: "2. Ast nach „geimpft“: „krank“", render: (v) => "krank (" + num(v, 3) + ")" },
      { kind: "s2", leafIdx: 1, correct: 0.26 / 0.32, labelText: "2. Ast nach „geimpft“: „gesund“", render: (v) => "gesund (" + num(v, 3) + ")" },
      { kind: "s2", leafIdx: 2, correct: 0.13 / 0.68, labelText: "2. Ast nach „nicht geimpft“: „krank“", render: (v) => "krank (" + num(v, 3) + ")" },
      { kind: "s2", leafIdx: 3, correct: 0.55 / 0.68, labelText: "2. Ast nach „nicht geimpft“: „gesund“", render: (v) => "gesund (" + num(v, 3) + ")" },
    ],
    explain:
      "Erste Stufe = Randsumme: geimpft 0,32, nicht geimpft 0,68. Zweite Stufe = Zellenwert ÷ Zeilensumme: P_geimpft(krank) = 0,06/0,32 ≈ 0,188, " +
      "P_geimpft(gesund) = 0,26/0,32 ≈ 0,813, P_nicht(krank) = 0,13/0,68 ≈ 0,191, P_nicht(gesund) = 0,55/0,68 ≈ 0,809.",
  });

  // Aufgabe 5 (am schwersten) — Kapitelabschluss: knüpft an die Stolperstelle oben an, jetzt mit
  // absoluten Häufigkeiten und einem neuen Kontext.
  const fussballVft = {
    rowLabel: "",
    colLabel: "",
    rowKeys: [
      { key: "fussball", label: "Fußball" },
      { key: "kein", label: "kein Fußball" },
    ],
    colKeys: [
      { key: "verletzt", label: "verletzt" },
      { key: "nicht", label: "nicht verletzt" },
    ],
    given: { fussball_verletzt: 50, fussball_nicht: 150, kein_verletzt: 30, kein_nicht: 270, row_fussball: 200, row_kein: 300, col_verletzt: 80, col_nicht: 420, grand: 500 },
    blanks: {},
    formatFn: (v) => String(v),
  };
  mountTreeFromVftExercise(mount, {
    title: "Aufgabe 5 — Genau wie bei Leon: nur richtig",
    prompt:
      "In einem Sportverein wurde erfasst, wer Fußball spielt und wer sich verletzt hat (absolute Häufigkeiten von 500 Personen). Genau wie bei " +
      "Leons Fehler oben gilt: Die zweite Stufe des Baumdiagramms braucht die <strong>bedingten</strong> Wahrscheinlichkeiten (Zellenwert ÷ " +
      "Zeilensumme) — nicht die Zellenwerte direkt. Rekonstruiere das vollständige, richtige Baumdiagramm.",
    vft: fussballVft,
    stage1: [
      { key: "fussball", label: "Fußball", p: 200 / 500 },
      { key: "kein", label: "kein Fußball", p: 300 / 500 },
    ],
    stage2Fn: (i, b1) => {
      if (b1.key === "fussball") return [
        { key: "verletzt", label: "verletzt", p: 50 / 200 },
        { key: "nicht", label: "nicht verletzt", p: 150 / 200 },
      ];
      return [
        { key: "verletzt", label: "verletzt", p: 30 / 300 },
        { key: "nicht", label: "nicht verletzt", p: 270 / 300 },
      ];
    },
    blankSpecs: [
      { kind: "s1", i: 0, correct: 0.4, labelText: "1. Ast: „Fußball“", render: (v) => "Fußball (" + num(v, 3) + ")" },
      { kind: "s1", i: 1, correct: 0.6, labelText: "1. Ast: „kein Fußball“", render: (v) => "kein Fußball (" + num(v, 3) + ")" },
      { kind: "s2", leafIdx: 0, correct: 0.25, labelText: "2. Ast nach „Fußball“: „verletzt“", render: (v) => "verletzt (" + num(v, 3) + ")" },
      { kind: "s2", leafIdx: 1, correct: 0.75, labelText: "2. Ast nach „Fußball“: „nicht verletzt“", render: (v) => "nicht verletzt (" + num(v, 3) + ")" },
      { kind: "s2", leafIdx: 2, correct: 0.1, labelText: "2. Ast nach „kein Fußball“: „verletzt“", render: (v) => "verletzt (" + num(v, 3) + ")" },
      { kind: "s2", leafIdx: 3, correct: 0.9, labelText: "2. Ast nach „kein Fußball“: „nicht verletzt“", render: (v) => "nicht verletzt (" + num(v, 3) + ")" },
    ],
    explain:
      "Erste Stufe: Fußball 200/500 = 0,4, kein Fußball 300/500 = 0,6. Zweite Stufe (Zellenwert ÷ Zeilensumme): nach Fußball 50/200 = 0,25 verletzt, " +
      "150/200 = 0,75 nicht verletzt; nach kein Fußball 30/300 = 0,1 verletzt, 270/300 = 0,9 nicht verletzt.",
  });
}

// ================= Quizze =================

function initQuizzes() {
  mountQuiz(document.getElementById("quiz-baum-bedingt"), {
    q: "Was bedeutet die Schreibweise P_M(S)?",
    options: [
      "Die Wahrscheinlichkeit, dass M und S beide eintreten.",
      "Die Wahrscheinlichkeit, dass S eintritt, unter der Bedingung, dass M bereits eingetreten ist.",
      "Die Wahrscheinlichkeit, dass M eintritt, unter der Bedingung, dass S bereits eingetreten ist.",
      "Die Summe der Wahrscheinlichkeiten von M und S.",
    ],
    correct: 1,
    explain: "Der tiefgestellte Index (hier M) ist immer die Bedingung — das, was schon bekannt ist.",
  });

  mountQuiz(document.getElementById("quiz-reduziert"), {
    q: "Wie berechnet man P_A(B) über die reduzierte Ergebnismenge?",
    options: ["|A ∩ B| / |Ω|", "|A ∩ B| / |A|", "|A| / |A ∩ B|", "|B| / |A ∩ B|"],
    correct: 1,
    explain: "Innerhalb der reduzierten Ergebnismenge Ω_A = A zählt man den Anteil von B — also |A∩B| / |A|.",
  });

  mountQuiz(document.getElementById("quiz-vft-bedingt"), {
    q: "In der Mobile-Banking-Tafel oben: Wie groß ist P_nein(≥ 50 Jahre) — die Wahrscheinlichkeit, mindestens 50 zu sein, unter der Bedingung, kein Mobile-Banking zu nutzen?",
    options: ["55 %", "33 %", "94,3 %", "45 %"],
    correct: 2,
    explain: "Spalte „nein“ (350 Personen) ist hier die Bedingung: 330/350 ≈ 0,943 = 94,3 %.",
  });

  mountQuiz(document.getElementById("quiz-formel"), {
    q: "Welche Formel drückt die bedingte Wahrscheinlichkeit P_A(B) korrekt aus?",
    options: ["P(A∩B) / P(A)", "P(A) / P(B)", "P(A∩B) / P(B)", "P(A) · P(B)"],
    correct: 0,
    explain: "P_A(B) = P(A∩B) / P(A), mit P(A) > 0 — direkt aus der nach P_A(B) aufgelösten Pfadmultiplikationsregel.",
  });

  mountQuiz(document.getElementById("quiz-stolperstelle"), {
    q: "Was hat Leon falsch gemacht?",
    options: [
      "Er hat die absoluten Häufigkeiten statt Prozent verwendet.",
      "Er hat die gemeinsamen Wahrscheinlichkeiten (Zellenwerte der Vierfeldertafel) direkt als zweite Astwahrscheinlichkeiten übernommen, statt sie durch die jeweilige Zeilensumme zu teilen.",
      "Die erste Stufe des Baumdiagramms ist falsch.",
      "Man darf aus einer Vierfeldertafel gar kein Baumdiagramm erstellen.",
    ],
    correct: 1,
    explain: "Die zweite Stufe muss die bedingte Wahrscheinlichkeit zeigen (Zellenwert ÷ Zeilensumme): 40/50 = 80 % statt 40 %, usw.",
  });
}

// ================= Start =================

document.addEventListener("DOMContentLoaded", () => {
  initBaumBedingt();
  initReduziert();
  initVftBedingt();
  initStolperstelle();
  initExercises();
  initQuizzes();
});
