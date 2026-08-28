// Selbstlernpfad "Baumdiagramme umdrehen" (MSS 13). Rein clientseitiges Vanilla-JS, ohne
// Build-Schritt oder externe Bibliotheken — wie der Rest der Seite. Aufbau: kleine DOM/SVG-Helfer
// (identisch zu denen in den anderen Lernpfaden dieses Kapitels), dann je ein Abschnitt
// (Bayes-Rechner, Tafel→Baum-Umkehr, allgemeine Formeln, Stolperstelle), zuletzt die Übungsaufgaben.

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
  if (title) box.appendChild(el("h3", {}, title));
  if (prompt) box.appendChild(el("p", { html: prompt }));
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
  if (title) box.appendChild(el("h3", {}, title));
  if (prompt) box.appendChild(el("p", { html: prompt }));
  if (vft) {
    box.appendChild(el("p", {}, el("strong", {}, "Gegebene Vierfeldertafel")));
    buildVftFill(box, { ...vft, blanks: {} });
    box.appendChild(el("p", {}, el("strong", {}, "Umgedrehtes Baumdiagramm ausfüllen")));
  }
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

// ---------- Statische Vierfeldertafel (nur Anzeige, kein Ausfüllen) ----------
function renderStaticVft(mountEl, { rowLabel, colLabel, rowKeys, colKeys, values, formatFn }) {
  mountEl.innerHTML = "";
  const table = el("table", { class: "vft-table" });
  const colSums = {};
  colKeys.forEach((ck) => (colSums[ck.key] = 0));
  let grand = 0;
  table.appendChild(el("tr", {}, [el("th", {}), ...colKeys.map((ck) => el("th", {}, (colLabel ? colLabel + ": " : "") + ck.label)), el("th", { class: "vft-gesamt" }, "gesamt")]));
  rowKeys.forEach((rk) => {
    let rowSum = 0;
    const cells = colKeys.map((ck) => {
      const v = values[rk.key + "_" + ck.key] || 0;
      rowSum += v;
      colSums[ck.key] += v;
      return el("td", { class: "vft-cell" }, formatFn(v));
    });
    grand += rowSum;
    table.appendChild(el("tr", {}, [el("th", {}, (rowLabel ? rowLabel + ": " : "") + rk.label), ...cells, el("td", { class: "vft-gesamt" }, formatFn(rowSum))]));
  });
  table.appendChild(
    el("tr", {}, [el("th", { class: "vft-gesamt" }, "gesamt"), ...colKeys.map((ck) => el("td", { class: "vft-gesamt" }, formatFn(colSums[ck.key]))), el("td", { class: "vft-gesamt" }, formatFn(grand))])
  );
  mountEl.appendChild(table);
}

// ================= 1. Bayes-Rechner (Corona-Schnelltest) =================

function initBayesRechner() {
  const inputP = document.getElementById("input-praevalenz");
  const inputSens = document.getElementById("input-sensitivitaet");
  const inputSpez = document.getElementById("input-spezifitaet");
  const treeMount = document.getElementById("bayes-tree-mount");
  const vftMount = document.getElementById("bayes-vft-mount");
  const resultBox = document.getElementById("bayes-result");

  function refresh() {
    const pI = Number(inputP.value) / 100;
    const sens = Number(inputSens.value) / 100;
    const spez = Number(inputSpez.value) / 100;
    if (!(pI > 0 && pI < 1) || !(sens >= 0 && sens <= 1) || !(spez >= 0 && spez <= 1)) {
      resultBox.innerHTML = "Bitte gültige Prozentwerte eingeben (Prävalenz zwischen 0 und 100, ausschließlich).";
      return;
    }
    const pNI = 1 - pI;
    const stage1 = [
      { key: "i", label: "infiziert", p: pI },
      { key: "ni", label: "nicht infiziert", p: pNI },
    ];
    function stage2Fn(idx, b1) {
      if (b1.key === "i") {
        return [
          { key: "n", label: "negativ", p: 1 - sens },
          { key: "pos", label: "positiv", p: sens },
        ];
      }
      return [
        { key: "n", label: "negativ", p: spez },
        { key: "pos", label: "positiv", p: 1 - spez },
      ];
    }
    renderTree(treeMount, stage1, stage2Fn);

    const iNeg = pI * (1 - sens),
      iPos = pI * sens,
      niNeg = pNI * spez,
      niPos = pNI * (1 - spez);
    renderStaticVft(vftMount, {
      rowLabel: "",
      colLabel: "",
      rowKeys: [
        { key: "i", label: "infiziert" },
        { key: "ni", label: "nicht infiziert" },
      ],
      colKeys: [
        { key: "neg", label: "negativ" },
        { key: "pos", label: "positiv" },
      ],
      values: { i_neg: iNeg, i_pos: iPos, ni_neg: niNeg, ni_pos: niPos },
      formatFn: (v) => pct(v),
    });

    const posGesamt = iPos + niPos,
      negGesamt = iNeg + niNeg;
    const pPosInfiziert = posGesamt > 0 ? iPos / posGesamt : 0;
    const pNegNichtInfiziert = negGesamt > 0 ? niNeg / negGesamt : 0;
    resultBox.innerHTML =
      `<strong>Umgekehrte Richtung (das, was eine getestete Person eigentlich wissen will):</strong><br>` +
      `P<sub>positiv</sub>(infiziert) = ${num(iPos, 4)} / ${num(posGesamt, 4)} = <strong>${pct(pPosInfiziert)}</strong><br>` +
      `P<sub>negativ</sub>(nicht infiziert) = ${num(niNeg, 4)} / ${num(negGesamt, 4)} = <strong>${pct(pNegNichtInfiziert)}</strong><br>` +
      `<span class="progress-note">Mit den Standardwerten (10&nbsp;%/96&nbsp;%/99&nbsp;%) ist ein positiv getesteter also nur zu etwa 91&nbsp;% wirklich infiziert — deutlich weniger als die 96&nbsp;% Sensitivität vermuten lassen! Das liegt an der niedrigen Prävalenz: es gibt schlicht viel mehr Nicht-Infizierte, bei denen der Test (selten) trotzdem positiv ausschlägt.</span>`;
  }

  [inputP, inputSens, inputSpez].forEach((inp) => inp.addEventListener("input", refresh));
  refresh();
}

// ================= 2. Von der Tafel zum umgedrehten Baum (WHO-Testbeispiel) =================

function initTafelUmkehr() {
  // Ursprünglicher Baum: zuerst Testergebnis (N/N̄), dann Infektion (I/Ī) — absolute Häufigkeiten.
  const stage1 = [
    { key: "n", label: "N (negativ)", p: 9875 / 10000 },
    { key: "npos", label: "N̄ (positiv)", p: 125 / 10000 },
  ];
  function stage2Fn(i, b1) {
    if (b1.key === "n") {
      return [
        { key: "i", label: "I", p: 15 / 9875 },
        { key: "ni", label: "Ī", p: 9860 / 9875 },
      ];
    }
    return [
      { key: "i", label: "I", p: 35 / 125 },
      { key: "ni", label: "Ī", p: 90 / 125 },
    ];
  }
  renderTree(document.getElementById("beispiel2-original-mount"), stage1, stage2Fn);

  const vft = {
    rowLabel: "",
    colLabel: "",
    rowKeys: [
      { key: "i", label: "I" },
      { key: "ni", label: "Ī" },
    ],
    colKeys: [
      { key: "n", label: "N" },
      { key: "npos", label: "N̄" },
    ],
    given: { i_n: 15, i_npos: 35, ni_n: 9860, ni_npos: 90, row_i: 50, row_ni: 9950, col_n: 9875, col_npos: 125, grand: 10000 },
    blanks: {},
    formatFn: (v) => String(v),
  };
  buildVftFill(document.getElementById("beispiel2-vft-mount"), { ...vft, blanks: {} });

  // Interaktive Übung: das umgedrehte Baumdiagramm (zuerst Infektion, dann Testergebnis) ausfüllen.
  mountTreeFromVftExercise(document.getElementById("beispiel2-exercise-mount"), {
    vft,
    stage1: [
      { key: "i", label: "I", p: 50 / 10000 },
      { key: "ni", label: "Ī", p: 9950 / 10000 },
    ],
    stage2Fn: (i, b1) => {
      if (b1.key === "i") return [
        { key: "n", label: "N", p: 15 / 50 },
        { key: "npos", label: "N̄", p: 35 / 50 },
      ];
      return [
        { key: "n", label: "N", p: 9860 / 9950 },
        { key: "npos", label: "N̄", p: 90 / 9950 },
      ];
    },
    blankSpecs: [
      { kind: "s1", i: 0, correct: 0.005, labelText: "1. Ast: „I“", render: (v) => "I (" + num(v, 3) + ")" },
      { kind: "s1", i: 1, correct: 0.995, labelText: "1. Ast: „Ī“", render: (v) => "Ī (" + num(v, 3) + ")" },
      { kind: "s2", leafIdx: 0, correct: 15 / 50, labelText: "2. Ast nach „I“: „N“", render: (v) => "N (" + num(v, 3) + ")" },
      { kind: "s2", leafIdx: 1, correct: 35 / 50, labelText: "2. Ast nach „I“: „N̄“", render: (v) => "N̄ (" + num(v, 3) + ")" },
      { kind: "s2", leafIdx: 2, correct: 9860 / 9950, labelText: "2. Ast nach „Ī“: „N“", render: (v) => "N (" + num(v, 3) + ")" },
      { kind: "s2", leafIdx: 3, correct: 90 / 9950, labelText: "2. Ast nach „Ī“: „N̄“", render: (v) => "N̄ (" + num(v, 3) + ")" },
    ],
    explain:
      "Erste Stufe = Randsumme ÷ Gesamtzahl: I = 50/10000 = 0,005, Ī = 9950/10000 = 0,995. Zweite Stufe = Zellenwert ÷ neue Zeilensumme: " +
      "P_I(N) = 15/50 = 0,3, P_I(N̄) = 35/50 = 0,7, P_Ī(N) = 9860/9950 ≈ 0,991, P_Ī(N̄) = 90/9950 ≈ 0,009. " +
      "P_I(N̄) = 0,7 < 0,8 — die WHO-Forderung an die Sensitivität wird von diesem Test nicht erfüllt.",
  });
}

// ================= 4. Stolperstelle (Handyfabrik) =================

function initStolperstelle() {
  // Ursprünglich: Fabrik zuerst (A 30 %, B 70 %), dann Zustand (defekt/ok).
  // Tim (falsch): vertauscht nur Reihenfolge/Beschriftung, lässt die Werte unverändert — dadurch
  // ergeben die Äste an jedem Knoten nicht mehr 100 % (0,05 + 0,02 = 0,07 bzw. 0,3 + 0,7 = 1,0
  // sieht witzigerweise richtig aus, aber die 0,05/0,02-Äste sind eindeutig falsch: sie stammen
  // unverändert aus der zweiten Stufe des Originalbaums und wurden nie neu berechnet).
  const wrongStage1 = [
    { key: "defekt", label: "defekt", p: 0.05 },
    { key: "ok", label: "ok", p: 0.02 },
  ];
  function wrongStage2Fn(i, b1) {
    return [
      { key: "a", label: "Fabrik A", p: 0.3 },
      { key: "b", label: "Fabrik B", p: 0.7 },
    ];
  }
  renderTree(document.getElementById("tree-tim-wrong-mount"), wrongStage1, wrongStage2Fn);

  // Richtig: erst multiplizieren (A∩defekt=0,015, A∩ok=0,285, B∩defekt=0,014, B∩ok=0,686),
  // dann Vierfeldertafel bilden, dann neu dividieren.
  const correctStage1 = [
    { key: "defekt", label: "defekt", p: 0.029 },
    { key: "ok", label: "ok", p: 0.971 },
  ];
  function correctStage2Fn(i, b1) {
    if (b1.key === "defekt") {
      return [
        { key: "a", label: "Fabrik A", p: 0.015 / 0.029 },
        { key: "b", label: "Fabrik B", p: 0.014 / 0.029 },
      ];
    }
    return [
      { key: "a", label: "Fabrik A", p: 0.285 / 0.971 },
      { key: "b", label: "Fabrik B", p: 0.686 / 0.971 },
    ];
  }
  renderTree(document.getElementById("tree-tim-correct-mount"), correctStage1, correctStage2Fn);
}

// ================= 5. Übungsaufgaben =================

function initExercises() {
  const mount = document.getElementById("exercises-mount");

  // Aufgabe 1 (leicht) — einfache Umkehrung über einen Satz "erst multiplizieren, Gesamt bilden,
  // dann in neuer Richtung dividieren", als einzelner Zahlenwert.
  mountExercise(mount, {
    title: "Aufgabe 1 — Erste Umkehrung",
    prompt:
      "Von 200 Meerschweinchen werden 60&nbsp;% am Boden (B) gehalten, die übrigen 40&nbsp;% erhöht (B̄). Wenn jemand den Raum betritt, verstecken sich " +
      "90&nbsp;% der am Boden gehaltenen Tiere (P<sub>B</sub>(V) = 0,9), aber nur 30&nbsp;% der erhöht gehaltenen (P<sub>B̄</sub>(V) = 0,3). Berechne " +
      "P<sub>V</sub>(B) — die Wahrscheinlichkeit, dass ein sich verstecken des Tier am Boden gehalten wird.",
    placeholder: "Dezimalzahl oder %",
    check: (v) => Math.abs(v - 0.8182) < 0.01,
    explain: "P(B∩V) = 0,6·0,9 = 0,54. P(B̄∩V) = 0,4·0,3 = 0,12. P(V) = 0,66. P_V(B) = 0,54/0,66 ≈ 0,818 (81,8 %).",
  });

  // Aufgabe 2 (mittel) — Vierfeldertafel aus zwei bedingten Wahrscheinlichkeiten füllen (der
  // Zwischenschritt, den man für jede Umkehrung zuerst braucht).
  mountVftFillExercise(mount, {
    title: "Aufgabe 2 — Erst die Vierfeldertafel",
    prompt:
      "Eine Bäckerei beliefert zwei Filialen: Filiale A bekommt 45&nbsp;% der Brötchen, Filiale B 55&nbsp;%. In Filiale A sind 4&nbsp;% der gelieferten " +
      "Brötchen altbacken, in Filiale B 1&nbsp;%. Vervollständige die Vierfeldertafel mit relativen Häufigkeiten — das ist der erste Schritt vor jeder Umkehrung.",
    rowLabel: "",
    colLabel: "",
    rowKeys: [
      { key: "a", label: "Filiale A" },
      { key: "b", label: "Filiale B" },
    ],
    colKeys: [
      { key: "alt", label: "altbacken" },
      { key: "frisch", label: "frisch" },
    ],
    given: { row_a: 0.45, row_b: 0.55, grand: 1 },
    blanks: { a_alt: 0.018, a_frisch: 0.432, b_alt: 0.0055, b_frisch: 0.5445, col_alt: 0.0235, col_frisch: 0.9765 },
    formatFn: (v) => pct(v),
    explain:
      "A ∩ altbacken = 0,45·0,04 = 0,018. A ∩ frisch = 0,45·0,96 = 0,432. B ∩ altbacken = 0,55·0,01 = 0,0055. B ∩ frisch = 0,55·0,99 = 0,5445. " +
      "Spaltensummen: altbacken gesamt = 0,018+0,0055 = 0,0235, frisch gesamt = 0,432+0,5445 = 0,9765.",
  });

  // Aufgabe 3 (mittel-schwer) — vollständige Umkehrung aus einer gegebenen Vierfeldertafel mit
  // absoluten Häufigkeiten.
  const schirmVft = {
    rowLabel: "",
    colLabel: "",
    rowKeys: [
      { key: "regen", label: "Regen" },
      { key: "kein", label: "kein Regen" },
    ],
    colKeys: [
      { key: "schirm", label: "Schirm" },
      { key: "keinschirm", label: "kein Schirm" },
    ],
    given: { regen_schirm: 72, regen_keinschirm: 18, kein_schirm: 84, kein_keinschirm: 126, row_regen: 90, row_kein: 210, col_schirm: 156, col_keinschirm: 144, grand: 300 },
    blanks: {},
    formatFn: (v) => String(v),
  };
  mountTreeFromVftExercise(mount, {
    title: "Aufgabe 3 — Vierfeldertafel → umgedrehter Baum",
    prompt:
      "An 300 Tagen wurde erfasst, ob es geregnet hat und ob ein Schirm mitgenommen wurde (absolute Häufigkeiten, komplette Tafel unten). Rekonstruiere " +
      "das umgedrehte Baumdiagramm — zuerst Schirm/kein Schirm, dann Regen/kein Regen (also: Wie wahrscheinlich war Regen, wenn man weiß, ob ein Schirm dabei war?).",
    vft: schirmVft,
    stage1: [
      { key: "schirm", label: "Schirm", p: 156 / 300 },
      { key: "keinschirm", label: "kein Schirm", p: 144 / 300 },
    ],
    stage2Fn: (i, b1) => {
      if (b1.key === "schirm") return [
        { key: "regen", label: "Regen", p: 72 / 156 },
        { key: "kein", label: "kein Regen", p: 84 / 156 },
      ];
      return [
        { key: "regen", label: "Regen", p: 18 / 144 },
        { key: "kein", label: "kein Regen", p: 126 / 144 },
      ];
    },
    blankSpecs: [
      { kind: "s1", i: 0, correct: 0.52, labelText: "1. Ast: „Schirm“", render: (v) => "Schirm (" + num(v, 3) + ")" },
      { kind: "s1", i: 1, correct: 0.48, labelText: "1. Ast: „kein Schirm“", render: (v) => "kein Schirm (" + num(v, 3) + ")" },
      { kind: "s2", leafIdx: 0, correct: 72 / 156, labelText: "2. Ast nach „Schirm“: „Regen“", render: (v) => "Regen (" + num(v, 3) + ")" },
      { kind: "s2", leafIdx: 1, correct: 84 / 156, labelText: "2. Ast nach „Schirm“: „kein Regen“", render: (v) => "kein Regen (" + num(v, 3) + ")" },
      { kind: "s2", leafIdx: 2, correct: 18 / 144, labelText: "2. Ast nach „kein Schirm“: „Regen“", render: (v) => "Regen (" + num(v, 3) + ")" },
      { kind: "s2", leafIdx: 3, correct: 126 / 144, labelText: "2. Ast nach „kein Schirm“: „kein Regen“", render: (v) => "kein Regen (" + num(v, 3) + ")" },
    ],
    explain:
      "Erste Stufe = Spaltensumme ÷ Gesamt: Schirm 156/300 = 0,52, kein Schirm 144/300 = 0,48. Zweite Stufe = Zellenwert ÷ neue Zeilensumme: " +
      "nach Schirm 72/156 ≈ 0,462 Regen, 84/156 ≈ 0,538 kein Regen; nach kein Schirm 18/144 = 0,125 Regen, 126/144 = 0,875 kein Regen.",
  });

  // Aufgabe 4 (schwer) — Umkehrung mit relativen Häufigkeiten, unrunde Brüche.
  mountTreeFillExercise(mount, {
    title: "Aufgabe 4 — Umkehrung mit relativen Häufigkeiten",
    prompt:
      "Maschine A produziert 65&nbsp;% der Teile einer Fabrik, Maschine B 35&nbsp;%. Die Ausschussquote von Maschine A beträgt 3&nbsp;%, die von Maschine B " +
      "7&nbsp;%. Vervollständige das <strong>umgedrehte</strong> Baumdiagramm — zuerst Ausschuss/kein Ausschuss, dann Maschine A/B.",
    stage1: [
      { key: "aus", label: "Ausschuss", p: 0.044 },
      { key: "ok", label: "kein Ausschuss", p: 0.956 },
    ],
    stage2Fn: (i, b1) => {
      if (b1.key === "aus") return [
        { key: "a", label: "Maschine A", p: 0.0195 / 0.044 },
        { key: "b", label: "Maschine B", p: 0.0245 / 0.044 },
      ];
      return [
        { key: "a", label: "Maschine A", p: 0.6305 / 0.956 },
        { key: "b", label: "Maschine B", p: 0.3255 / 0.956 },
      ];
    },
    blankSpecs: [
      { kind: "s1", i: 0, correct: 0.044, labelText: "1. Ast: „Ausschuss“", render: (v) => "Ausschuss (" + num(v, 3) + ")" },
      { kind: "s1", i: 1, correct: 0.956, labelText: "1. Ast: „kein Ausschuss“", render: (v) => "kein Ausschuss (" + num(v, 3) + ")" },
      { kind: "s2", leafIdx: 0, correct: 0.0195 / 0.044, labelText: "2. Ast nach „Ausschuss“: „Maschine A“", render: (v) => "Maschine A (" + num(v, 3) + ")" },
      { kind: "s2", leafIdx: 1, correct: 0.0245 / 0.044, labelText: "2. Ast nach „Ausschuss“: „Maschine B“", render: (v) => "Maschine B (" + num(v, 3) + ")" },
      { kind: "s2", leafIdx: 2, correct: 0.6305 / 0.956, labelText: "2. Ast nach „kein Ausschuss“: „Maschine A“", render: (v) => "Maschine A (" + num(v, 3) + ")" },
      { kind: "s2", leafIdx: 3, correct: 0.3255 / 0.956, labelText: "2. Ast nach „kein Ausschuss“: „Maschine B“", render: (v) => "Maschine B (" + num(v, 3) + ")" },
    ],
    explain:
      "Erst multiplizieren: A∩Ausschuss = 0,65·0,03 = 0,0195, B∩Ausschuss = 0,35·0,07 = 0,0245, Ausschuss gesamt = 0,044. Dann dividieren: " +
      "P_Ausschuss(A) = 0,0195/0,044 ≈ 0,443, P_Ausschuss(B) = 0,0245/0,044 ≈ 0,557. Für „kein Ausschuss“ entsprechend mit 0,956 als Nenner.",
  });

  // Aufgabe 5 (am schwersten) — Kapitelabschluss: knüpft an die Stolperstelle oben an, jetzt mit
  // neuen Fabriken/Zahlen und der vollständigen, richtigen Umkehrung.
  mountTreeFillExercise(mount, {
    title: "Aufgabe 5 — Genau wie bei Tim: nur richtig",
    prompt:
      "Wie in der Stolperstelle oben, aber mit zwei anderen Fabriken: Fabrik C produziert 55&nbsp;% der Handys, Fabrik D 45&nbsp;%. Ausschussquote " +
      "Fabrik C: 3&nbsp;%, Fabrik D: 6&nbsp;%. Vervollständige das <strong>vollständig richtig</strong> umgedrehte Baumdiagramm — zuerst " +
      "defekt/ok, dann Fabrik C/D. (Erst multiplizieren, Gesamtsummen bilden, dann durch die neue Zeilensumme teilen — nicht wie bei Tim einfach die Werte übernehmen!)",
    stage1: [
      { key: "def", label: "defekt", p: 0.0435 },
      { key: "ok", label: "ok", p: 0.9565 },
    ],
    stage2Fn: (i, b1) => {
      if (b1.key === "def") return [
        { key: "c", label: "Fabrik C", p: 0.0165 / 0.0435 },
        { key: "d", label: "Fabrik D", p: 0.027 / 0.0435 },
      ];
      return [
        { key: "c", label: "Fabrik C", p: 0.5335 / 0.9565 },
        { key: "d", label: "Fabrik D", p: 0.423 / 0.9565 },
      ];
    },
    blankSpecs: [
      { kind: "s1", i: 0, correct: 0.0435, labelText: "1. Ast: „defekt“", render: (v) => "defekt (" + num(v, 3) + ")" },
      { kind: "s1", i: 1, correct: 0.9565, labelText: "1. Ast: „ok“", render: (v) => "ok (" + num(v, 3) + ")" },
      { kind: "s2", leafIdx: 0, correct: 0.0165 / 0.0435, labelText: "2. Ast nach „defekt“: „Fabrik C“", render: (v) => "Fabrik C (" + num(v, 3) + ")" },
      { kind: "s2", leafIdx: 1, correct: 0.027 / 0.0435, labelText: "2. Ast nach „defekt“: „Fabrik D“", render: (v) => "Fabrik D (" + num(v, 3) + ")" },
      { kind: "s2", leafIdx: 2, correct: 0.5335 / 0.9565, labelText: "2. Ast nach „ok“: „Fabrik C“", render: (v) => "Fabrik C (" + num(v, 3) + ")" },
      { kind: "s2", leafIdx: 3, correct: 0.423 / 0.9565, labelText: "2. Ast nach „ok“: „Fabrik D“", render: (v) => "Fabrik D (" + num(v, 3) + ")" },
    ],
    explain:
      "C∩defekt = 0,55·0,03 = 0,0165, D∩defekt = 0,45·0,06 = 0,027, defekt gesamt = 0,0435. C∩ok = 0,55·0,97 = 0,5335, D∩ok = 0,45·0,94 = 0,423, ok gesamt = 0,9565. " +
      "P_defekt(C) = 0,0165/0,0435 ≈ 0,379, P_defekt(D) = 0,027/0,0435 ≈ 0,621, P_ok(C) = 0,5335/0,9565 ≈ 0,558, P_ok(D) = 0,423/0,9565 ≈ 0,442.",
  });
}

// ================= Quizze =================

function initQuizzes() {
  mountQuiz(document.getElementById("quiz-bayes-rechner"), {
    q: "Warum ist P_positiv(infiziert) bei niedriger Prävalenz oft viel kleiner als die Sensitivität des Tests?",
    options: [
      "Weil der Test bei niedriger Prävalenz ungenauer misst.",
      "Weil es bei niedriger Prävalenz viel mehr Nicht-Infizierte gibt, und selbst eine kleine Falsch-positiv-Rate bei ihnen absolut viele falsche Alarme erzeugt.",
      "Weil P_positiv(infiziert) und die Sensitivität immer gleich groß sein müssen.",
      "Weil die Prävalenz die Formel gar nicht beeinflusst.",
    ],
    correct: 1,
    explain: "Bei niedriger Prävalenz überwiegt die riesige Gruppe der Nicht-Infizierten — selbst ihre kleine Falsch-positiv-Rate liefert absolut mehr falsche Positive als es echte Infizierte gibt.",
  });

  mountQuiz(document.getElementById("quiz-tafel-umkehr"), {
    q: "Welchen Rechenschritt macht man, um aus der Vierfeldertafel die erste Stufe des umgedrehten Baums zu bekommen?",
    options: [
      "Zellenwert ÷ Zeilensumme des Originalbaums",
      "Spaltensumme ÷ Gesamtzahl",
      "Zellenwert ÷ Gesamtzahl",
      "Zeilensumme ÷ Spaltensumme",
    ],
    correct: 1,
    explain: "Die neue erste Stufe entspricht den Rand-(Spalten-)Summen der Tafel, geteilt durch die Gesamtzahl.",
  });

  mountQuiz(document.getElementById("quiz-formeln"), {
    q: "Welcher Term berechnet c_A im umgedrehten Baumdiagramm (Abschnitt 3)?",
    options: ["a · a₁ / c", "a₁ / a", "c / (a · a₁)", "a · a₁ / d"],
    correct: 0,
    explain: "c_A = P_1(A) = P(A∩1) / P(1) = (a·a₁) / c — Zellenwert der Vierfeldertafel geteilt durch die zugehörige Spaltensumme c.",
  });

  mountQuiz(document.getElementById("quiz-stolperstelle"), {
    q: "Was hat Tim falsch gemacht?",
    options: [
      "Er hat die Prozentwerte falsch gerundet.",
      "Er hat beim Umdrehen nur die Reihenfolge der Stufen vertauscht, aber alle Wahrscheinlichkeiten unverändert aus dem Originalbaum übernommen, statt sie neu zu berechnen (multiplizieren, Vierfeldertafel, neu dividieren).",
      "Er hat die falschen Fabriken verwendet.",
      "Ein Baumdiagramm mit Fabriken kann man grundsätzlich nicht umdrehen.",
    ],
    correct: 1,
    explain: "Beim Umdrehen ändern sich fast immer alle Werte — man muss über die Vierfeldertafel neu multiplizieren und dann in der neuen Richtung dividieren.",
  });
}

// ================= Start =================

document.addEventListener("DOMContentLoaded", () => {
  initBayesRechner();
  initTafelUmkehr();
  initStolperstelle();
  initExercises();
  initQuizzes();
});
