// Selbstlernpfad "Grundbegriffe, Baumdiagramme und Vierfeldertafel" (MSS 13). Alles läuft rein
// clientseitig in vanilla JS, ohne Build-Schritt oder externe Bibliotheken — wie der Rest der
// Seite. Aufbau: kleine DOM/SVG-Helfer, dann je ein Abschnitt (Glücksrad, Würfel, zwei
// Baumdiagramme, Vierfeldertafel, Übungsaufgaben), jeweils mit eigenem State.

"use strict";

// ---------- Helfer ----------

const SVG_NS = "http://www.w3.org/2000/svg";
function svgEl(tag, attrs = {}) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const k in attrs) el.setAttribute(k, attrs[k]);
  return el;
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
function weightedIndex(weights) {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return weights.length - 1;
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

// ---------- Übungsaufgaben-Komponente ----------

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

// ================= 1./2./3. Glücksrad =================

const WHEEL_OUTCOMES = [
  { key: "blau", label: "blau", color: "#2563eb", p: 0.25 },
  { key: "gruen", label: "grün", color: "#1a9e7a", p: 0.125 },
  { key: "gelb", label: "gelb", color: "#e0b91e", p: 0.125 },
  { key: "rot", label: "rot", color: "#d64545", p: 0.5 },
];

function buildSpinner(mountEl) {
  const R = 90,
    CX = 100,
    CY = 100;
  const svg = svgEl("svg", { viewBox: "0 0 200 220", class: "spinner-svg" });
  const wheel = svgEl("g", { class: "spinner-wheel" });
  let angle = -90; // Start oben
  WHEEL_OUTCOMES.forEach((o) => {
    const sweep = o.p * 360;
    const a0 = (angle * Math.PI) / 180;
    const a1 = ((angle + sweep) * Math.PI) / 180;
    const x0 = CX + R * Math.cos(a0),
      y0 = CY + R * Math.sin(a0);
    const x1 = CX + R * Math.cos(a1),
      y1 = CY + R * Math.sin(a1);
    const large = sweep > 180 ? 1 : 0;
    const path = svgEl("path", {
      d: `M ${CX} ${CY} L ${x0.toFixed(2)} ${y0.toFixed(2)} A ${R} ${R} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z`,
      fill: o.color,
      stroke: "var(--card-bg)",
      "stroke-width": "2",
    });
    wheel.appendChild(path);
    angle += sweep;
  });
  svg.appendChild(wheel);
  svg.appendChild(svgEl("circle", { cx: CX, cy: CY, r: R, fill: "none", stroke: "var(--muted)", "stroke-width": "1.5" }));
  svg.appendChild(svgEl("path", { d: `M ${CX - 8} ${CY - R - 12} L ${CX + 8} ${CY - R - 12} L ${CX} ${CY - R + 4} Z`, class: "spinner-pointer" }));

  const resultText = el("div", { class: "spinner-result" }, "");
  const wrap = el("div", { class: "spinner-wrap" }, svg);
  mountEl.appendChild(wrap);
  mountEl.appendChild(resultText);

  const counts = {};
  WHEEL_OUTCOMES.forEach((o) => (counts[o.key] = 0));
  let total = 0;
  let currentRotation = 0;
  const listeners = [];

  function notify() {
    listeners.forEach((cb) => cb());
  }

  function landingAngleFor(index) {
    // Zielsektor-Mitte in Grad (0-360, im "Rad-Koordinatensystem" ohne bisherige Drehung).
    let a = -90;
    for (let i = 0; i < index; i++) a += WHEEL_OUTCOMES[i].p * 360;
    a += WHEEL_OUTCOMES[index].p * 180;
    return a;
  }

  function spinOnce(animate) {
    const idx = weightedIndex(WHEEL_OUTCOMES.map((o) => o.p));
    const outcome = WHEEL_OUTCOMES[idx];
    counts[outcome.key]++;
    total++;
    if (animate) {
      const sectorMid = landingAngleFor(idx);
      // Der Zeiger zeigt nach oben (-90°/270°); das Rad muss so gedreht werden, dass die
      // Sektormitte dort landet — plus mehrere volle Umdrehungen für den Schwung.
      const targetWithinTurn = (-90 - sectorMid + 3600) % 360;
      const extraTurns = 4 + Math.floor(Math.random() * 2);
      currentRotation = currentRotation - (currentRotation % 360) + extraTurns * 360 + targetWithinTurn;
      wheel.style.transform = `rotate(${currentRotation}deg)`;
    }
    resultText.textContent = "Ergebnis: " + outcome.label;
    notify();
    return outcome;
  }

  return {
    el: mountEl,
    spin(times, animateLast) {
      let last;
      for (let i = 0; i < times; i++) last = spinOnce(animateLast && i === times - 1);
      return last;
    },
    getCounts: () => ({ counts: { ...counts }, total }),
    reset() {
      WHEEL_OUTCOMES.forEach((o) => (counts[o.key] = 0));
      total = 0;
      resultText.textContent = "";
      notify();
    },
    onChange(cb) {
      listeners.push(cb);
    },
  };
}

function renderStatTable(tableEl, counts, total) {
  tableEl.innerHTML = "";
  const head = el("tr", {}, [el("th", {}, "Ergebnis"), el("th", {}, "H (absolut)"), el("th", {}, "h (relativ)"), el("th", {}, "P (theoretisch)")]);
  tableEl.appendChild(head);
  WHEEL_OUTCOMES.forEach((o) => {
    const h = counts[o.key] || 0;
    const rel = total > 0 ? h / total : 0;
    const swatch = el("span", { class: "stat-swatch", style: `background:${o.color}` });
    tableEl.appendChild(
      el("tr", {}, [el("td", {}, [swatch, o.label]), el("td", {}, String(h)), el("td", {}, total > 0 ? pct(rel) : "–"), el("td", {}, pct(o.p))])
    );
  });
  tableEl.appendChild(el("tr", {}, [el("td", {}, el("strong", {}, "gesamt")), el("td", {}, el("strong", {}, String(total))), el("td", {}), el("td", {})]));
}

function renderBarChart(chartEl, counts, total) {
  chartEl.innerHTML = "";
  WHEEL_OUTCOMES.forEach((o) => {
    const h = counts[o.key] || 0;
    const rel = total > 0 ? h / total : 0;
    const track = el("div", { class: "bar-track" }, [
      el("div", { class: "bar-fill", style: `width:${(rel * 100).toFixed(1)}%;background:${o.color}` }),
      el("div", { class: "bar-target", style: `left:${(o.p * 100).toFixed(1)}%` }),
    ]);
    chartEl.appendChild(el("div", { class: "bar-row" }, [el("span", { class: "bar-label" }, o.label), track, el("span", { class: "bar-value" }, total > 0 ? pct(rel) : "–")]));
  });
}

function initGluecksrad() {
  const mount = document.getElementById("spinner-mount");
  const spinner = buildSpinner(mount);

  document.getElementById("ergebnismenge-out").innerHTML =
    "Ergebnismenge: Ω = {" + WHEEL_OUTCOMES.map((o) => o.label).join(", ") + "}";

  document.getElementById("spin-once-btn").addEventListener("click", () => spinner.spin(1, true));

  document.querySelectorAll("[data-spin-many]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const n = Number(btn.dataset.spinMany);
      spinner.spin(n, true);
    });
  });
  document.getElementById("reset-stats-btn").addEventListener("click", () => spinner.reset());

  const statTable = document.getElementById("stat-table");
  const barChart = document.getElementById("bar-chart");
  function refreshStats() {
    const { counts, total } = spinner.getCounts();
    renderStatTable(statTable, counts, total);
    renderBarChart(barChart, counts, total);
  }
  spinner.onChange(refreshStats);
  refreshStats();

  // Ereignis/Gegenereignis-Baustein (Abschnitt 3), nutzt dieselben WHEEL_OUTCOMES-Wahrscheinlichkeiten.
  const picker = document.getElementById("event-picker");
  const resultBox = document.getElementById("event-result");
  const selected = new Set();
  WHEEL_OUTCOMES.forEach((o) => {
    const cb = el("input", { type: "checkbox" });
    cb.addEventListener("change", () => {
      if (cb.checked) selected.add(o.key);
      else selected.delete(o.key);
      refreshEvent();
    });
    const swatch = el("span", { class: "stat-swatch", style: `background:${o.color}` });
    picker.appendChild(el("label", {}, [cb, swatch, o.label]));
  });
  function refreshEvent() {
    if (selected.size === 0) {
      resultBox.innerHTML = "Wähle mindestens eine Farbe aus, um ein Ereignis E zu bilden.";
      return;
    }
    const chosen = WHEEL_OUTCOMES.filter((o) => selected.has(o.key));
    const pE = chosen.reduce((s, o) => s + o.p, 0);
    const terms = chosen.map((o) => num(o.p, 3)).join(" + ");
    resultBox.innerHTML =
      `E = {${chosen.map((o) => o.label).join(", ")}}<br>` +
      `P(E) = ${terms} = <strong>${num(pE, 3)} (${pct(pE)})</strong><br>` +
      `P(Ē) = 1 − ${num(pE, 3)} = <strong>${num(1 - pE, 3)} (${pct(1 - pE)})</strong>`;
  }
  refreshEvent();

  return spinner;
}

// ================= 4. Laplace-Würfel =================

function initLaplace() {
  const N = 8;
  const face = document.getElementById("die-face");
  const picker = document.getElementById("face-picker");
  const result = document.getElementById("laplace-result");
  const tally = document.getElementById("laplace-tally");
  const barMount = document.getElementById("laplace-bar");
  const selected = new Set();
  // Alle gewürfelten Augenzahlen in Reihenfolge — nicht nur ein Zähler pro Zahl, damit sich die
  // relative Häufigkeit von E korrekt neu berechnen lässt, auch wenn E nachträglich geändert wird.
  const history = [];

  for (let f = 1; f <= N; f++) {
    const btn = el("button", { type: "button", class: "face-btn" }, String(f));
    btn.addEventListener("click", () => {
      btn.classList.toggle("active");
      if (selected.has(f)) selected.delete(f);
      else selected.add(f);
      refresh();
    });
    picker.appendChild(btn);
  }

  function refresh() {
    barMount.innerHTML = "";
    if (selected.size === 0) {
      result.innerHTML = "Wähle mindestens eine Augenzahl für E aus.";
      tally.textContent = "Noch keine Würfe.";
      return;
    }
    const list = [...selected].sort((a, b) => a - b);
    const pE = list.length / N;
    result.innerHTML = `E = {${list.join(", ")}}<br>P(E) = ${list.length}/${N} = <strong>${num(pE, 3)} (${pct(pE)})</strong>`;

    const total = history.length;
    const inE = history.filter((f) => selected.has(f)).length;
    const relE = total > 0 ? inE / total : 0;
    barMount.appendChild(
      el("div", { class: "bar-row" }, [
        el("span", { class: "bar-label" }, "h(E)"),
        el("div", { class: "bar-track" }, [
          el("div", { class: "bar-fill", style: `width:${(relE * 100).toFixed(1)}%;background:#2563eb` }),
          el("div", { class: "bar-target", style: `left:${(pE * 100).toFixed(1)}%` }),
        ]),
        el("span", { class: "bar-value" }, total > 0 ? pct(relE) : "–"),
      ])
    );
    tally.textContent =
      total > 0
        ? `Bisher ${total} Würfe, davon ${inE} in E → relative Häufigkeit h(E) = ${pct(relE)}. Der Strich im Balken markiert die berechnete Wahrscheinlichkeit P(E) = ${pct(pE)} — je mehr Würfe, desto näher rückt der Balken heran.`
        : "Noch keine Würfe. Nutze die Buttons oben, um zu würfeln.";
  }
  refresh();

  function rollOnce() {
    const outcome = 1 + Math.floor(Math.random() * N);
    history.push(outcome);
    face.textContent = String(outcome);
    face.style.color = selected.has(outcome) ? "#157347" : "";
    return outcome;
  }

  document.querySelectorAll("[data-roll-many]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const n = Number(btn.dataset.rollMany);
      for (let i = 0; i < n; i++) rollOnce();
      refresh();
    });
  });
  document.getElementById("reset-die-btn").addEventListener("click", () => {
    history.length = 0;
    face.textContent = "?";
    face.style.color = "";
    refresh();
  });
}

// ================= 5./6. Baumdiagramm-Renderer =================

// stage1: [{label,p}], stage2Fn(i, branch1) -> [{label,p}]
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
    kids.forEach((b2, j) => {
      const cy = y + leafGap / 2;
      leaves.push({ i, j, b1, b2, cy, path: b1.p * b2.p });
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

  // Kanten Wurzel -> Stufe 1
  nodes1.forEach((n1) => {
    const path = svgEl("path", {
      d: `M ${rootX} ${rootY} L ${x1} ${n1.cy}`,
      class: "tree-edge",
      "data-edge1": n1.i,
    });
    svg.appendChild(path);
    const mx = (rootX + x1) / 2,
      my = (rootY + n1.cy) / 2 - 6;
    svg.appendChild(svgEl("text", { x: mx, y: my, class: "tree-edge-label", "text-anchor": "middle" }, "")).textContent = n1.b1.label + " (" + num(n1.b1.p, 3) + ")";
  });

  // Kanten Stufe1 -> Blätter (Stufe 2)
  leaves.forEach((lf, idx) => {
    const n1 = nodes1[lf.i];
    const path = svgEl("path", {
      d: `M ${x1} ${n1.cy} L ${x2} ${lf.cy}`,
      class: "tree-edge",
      "data-edge2": idx,
    });
    svg.appendChild(path);
    const mx = (x1 + x2) / 2,
      my = (n1.cy + lf.cy) / 2 - 6;
    const lbl = svgEl("text", { x: mx, y: my, class: "tree-edge-label", "text-anchor": "middle" });
    lbl.textContent = lf.b2.label + " (" + num(lf.b2.p, 3) + ")";
    svg.appendChild(lbl);

    const leafLine = svgEl("line", { x1: x2, y1: lf.cy, x2: xEnd, y2: lf.cy, class: "tree-edge" });
    svg.appendChild(leafLine);
    const leafLabel = svgEl("text", { x: x2 + 6, y: lf.cy - 14, class: "tree-leaf-label" });
    leafLabel.textContent = n1.b1.label + " – " + lf.b2.label;
    svg.appendChild(leafLabel);
    const probLabel = svgEl("text", { x: x2 + 6, y: lf.cy + 14, class: "tree-leaf-prob", "data-leaf": idx });
    probLabel.textContent = "P = " + num(lf.path, 4);
    svg.appendChild(probLabel);
    const hit = svgEl("rect", { x: x1, y: lf.cy - leafGap / 2, width: xEnd - x1, height: leafGap, class: "tree-leaf-hit", "data-leaf-hit": idx });
    svg.appendChild(hit);
  });

  // Knoten
  const rootCircle = svgEl("g", { class: "tree-node" }, undefined);
  rootCircle.appendChild(svgEl("circle", { cx: rootX, cy: rootY, r: 5 }));
  svg.appendChild(rootCircle);
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

// ================= 5. Baumdiagramm unabhängig (Münze x Glücksrad) =================

function initBaum1() {
  const stage1 = [
    { key: "kopf", label: "Kopf", p: 0.5 },
    { key: "zahl", label: "Zahl", p: 0.5 },
  ];
  const stage2 = [
    { key: "rot", label: "rot", p: 0.3 },
    { key: "blau", label: "blau", p: 0.7 },
  ];
  const mount = document.getElementById("tree1-mount");
  const tree = renderTree(mount, stage1, () => stage2);

  const eventMount = document.getElementById("tree1-event");
  const checks = tree.leaves.map((lf, idx) => {
    const cb = el("input", { type: "checkbox" });
    cb.addEventListener("change", refresh);
    const label = el("label", { style: "display:flex;align-items:center;gap:0.4rem;margin:0.2rem 0" }, [
      cb,
      `${lf.b1.label} – ${lf.b2.label} (P = ${num(lf.path, 3)})`,
    ]);
    eventMount.appendChild(label);
    return { cb, lf };
  });
  const out = el("div", { class: "event-result" }, "");
  eventMount.appendChild(out);
  function refresh() {
    const chosen = checks.filter((c) => c.cb.checked);
    tree.svg.querySelectorAll(".tree-highlight").forEach((n) => n.classList.remove("tree-highlight"));
    checks.forEach((c) => {
      if (c.cb.checked) {
        const idx = tree.leaves.indexOf(c.lf);
        tree.svg.querySelectorAll(`[data-leaf="${idx}"], [data-edge2="${idx}"]`).forEach((n) => n.classList.add("tree-highlight"));
        tree.svg.querySelector(`[data-edge1="${c.lf.i}"]`)?.classList.add("tree-highlight");
      }
    });
    if (chosen.length === 0) {
      out.textContent = "Wähle mindestens ein Blatt (einen Pfad) aus.";
      return;
    }
    const sum = chosen.reduce((s, c) => s + c.lf.path, 0);
    out.innerHTML = "P(Ereignis) = " + chosen.map((c) => num(c.lf.path, 3)).join(" + ") + " = <strong>" + num(sum, 3) + "</strong>";
  }
  refresh();
}

// ================= 6. Baumdiagramm abhängig + Vierfeldertafel =================

function initBaum2() {
  const urn0 = { rot: 4, blau: 6 };
  let mode = "ohne"; // "mit" | "ohne"

  function stage1() {
    const total = urn0.rot + urn0.blau;
    return [
      { key: "rot", label: "rot", p: urn0.rot / total },
      { key: "blau", label: "blau", p: urn0.blau / total },
    ];
  }
  function stage2Fn(i, b1) {
    const total = urn0.rot + urn0.blau;
    if (mode === "mit") {
      return [
        { key: "rot", label: "rot", p: urn0.rot / total },
        { key: "blau", label: "blau", p: urn0.blau / total },
      ];
    }
    const remaining = { ...urn0 };
    remaining[b1.key] -= 1;
    const total2 = total - 1;
    return [
      { key: "rot", label: "rot", p: remaining.rot / total2 },
      { key: "blau", label: "blau", p: remaining.blau / total2 },
    ];
  }

  const toggleWrap = document.getElementById("urn-mode-toggle");
  const btnMit = el("button", { type: "button", class: "btn" }, "mit Zurücklegen (unabhängig)");
  const btnOhne = el("button", { type: "button", class: "btn active" }, "ohne Zurücklegen (abhängig)");
  toggleWrap.appendChild(btnMit);
  toggleWrap.appendChild(btnOhne);

  const treeMount = document.getElementById("tree2-mount");
  let tree = null;
  let simCounts = { rot_rot: 0, rot_blau: 0, blau_rot: 0, blau_blau: 0 };
  let simTotal = 0;

  function cellKey(c1, c2) {
    return c1 + "_" + c2;
  }
  function currentProbs() {
    const s1 = stage1();
    const probs = {};
    s1.forEach((b1, i) => {
      const s2 = stage2Fn(i, b1);
      s2.forEach((b2) => {
        probs[cellKey(b1.key, b2.key)] = b1.p * b2.p;
      });
    });
    return probs;
  }

  const relMount = document.getElementById("vft-relative");
  const absMount = document.getElementById("vft-absolute");
  const empMount = document.getElementById("vft-empirisch");
  const nInput = document.getElementById("vft-n");
  const explainBox = document.getElementById("vft-explain-box");
  const guideMount = document.getElementById("vft-guide-table");
  const guideExplain = document.getElementById("vft-guide-explain");
  const guideNextBtn = document.getElementById("vft-guide-next");
  const guideResetBtn = document.getElementById("vft-guide-reset");
  const labelOf = { rot: "rot", blau: "blau" };

  // filledSet == null bedeutet "alle Zellen anzeigen" (die drei normalen Tafeln); wird ein Set
  // übergeben (die Schritt-für-Schritt-Tafel), bleiben noch nicht enthaltene Zellen ein "?" und
  // zählen auch nicht in die Rand-/Gesamtsummen mit ein — die Tafel wächst sichtbar mit.
  function renderVft(mountEl, values, formatFn, highlightKey, filledSet) {
    mountEl.innerHTML = "";
    const s1 = stage1();
    const keys = s1.map((b) => b.key);
    const table = el("table", { class: "vft-table" });
    const headRow = el("tr", {}, [el("th", {}), ...keys.map((k) => el("th", {}, "2.: " + labelOf[k])), el("th", { class: "vft-gesamt" }, "gesamt")]);
    table.appendChild(headRow);
    let colSums = {};
    keys.forEach((k) => (colSums[k] = 0));
    let grand = 0;
    keys.forEach((rk) => {
      let rowSum = 0;
      const cells = keys.map((ck) => {
        const key = cellKey(rk, ck);
        const isFilled = !filledSet || filledSet.has(key);
        const v = values[key] || 0;
        if (isFilled) {
          rowSum += v;
          colSums[ck] += v;
        }
        const td = el("td", { class: "vft-cell", "data-key": key }, isFilled ? formatFn(v) : "?");
        if (highlightKey && key === highlightKey) td.classList.add("vft-highlight");
        td.addEventListener("click", () => {
          const idxLeaf = tree.leaves.findIndex((lf) => lf.b1.key === rk && lf.b2.key === ck);
          if (idxLeaf >= 0) tree.highlight(idxLeaf);
          highlightVftCell(key);
          explainBox.innerHTML = cellExplainHTML(rk, ck);
        });
        return td;
      });
      grand += rowSum;
      table.appendChild(el("tr", {}, [el("th", {}, "1.: " + labelOf[rk]), ...cells, el("td", { class: "vft-gesamt" }, formatFn(rowSum))]));
    });
    table.appendChild(el("tr", {}, [el("th", { class: "vft-gesamt" }, "gesamt"), ...keys.map((k) => el("td", { class: "vft-gesamt" }, formatFn(colSums[k]))), el("td", { class: "vft-gesamt" }, formatFn(grand))]));
    mountEl.appendChild(table);
  }

  // Erklärt eine Zelle in beide Richtungen: Baum -> Tafel (Pfadmultiplikation) und, umgekehrt,
  // Tafel -> Baum (Division als Umkehrrechnung liefert den zweiten Ast zurück). Bewusst ohne den
  // Begriff/die Notation der bedingten Wahrscheinlichkeit, da der Lernpfad diese noch nicht
  // eingeführt hat — die Division wird stattdessen als reine Umkehrung der Multiplikation erklärt.
  function cellExplainHTML(rk, ck) {
    const probs = currentProbs();
    const s1 = stage1();
    const idx1 = s1.findIndex((b) => b.key === rk);
    const b1 = s1[idx1];
    const s2 = stage2Fn(idx1, b1);
    const b2 = s2.find((b) => b.key === ck);
    const key = cellKey(rk, ck);
    const cellP = probs[key];
    return (
      `<p><strong>Baum → Tafel</strong> (Pfadmultiplikationsregel):<br>` +
      `Die beiden Äste des Pfades werden multipliziert: ${num(b1.p, 3)} (erster Ast „1. ${labelOf[rk]}“) · ${num(b2.p, 3)} (zweiter Ast „2. ${labelOf[ck]}“, direkt danach) = <strong>${num(cellP, 4)}</strong> (${pct(cellP)})<br>` +
      `→ das ist genau der Wert in der Zelle „1. ${labelOf[rk]}, 2. ${labelOf[ck]}“.</p>` +
      `<p><strong>Tafel → Baum</strong> (Division als Umkehrung der Multiplikation):<br>` +
      `Vorwärts gilt: erster Ast · zweiter Ast = Zellenwert. Division macht genau das rückgängig, so wie 3 · 4 = 12 sich durch 12 ÷ 3 = 4 umkehren lässt: teilt man den Zellenwert durch den bereits bekannten ersten Ast (die Zeilensumme), bleibt nur noch der gesuchte zweite Ast übrig.<br>` +
      `${num(cellP, 4)} ÷ ${num(b1.p, 3)} = <strong>${num(b2.p, 3)}</strong><br>` +
      `→ genau die Wahrscheinlichkeit des Astes „2. ${labelOf[ck]}“ nach „1. ${labelOf[rk]}“ im Baumdiagramm.</p>`
    );
  }

  let guideIndex = 0;
  let guideFilled = new Set();
  let guideLastKey = null;

  function renderGuide() {
    const values = currentProbs();
    renderVft(guideMount, values, (v) => pct(v), guideLastKey, guideFilled);
    if (guideIndex >= tree.leaves.length) {
      const s1 = stage1();
      guideExplain.innerHTML =
        "✅ Alle vier Pfade eingetragen! Die Randsummen (gesamt) entsprechen genau den Wahrscheinlichkeiten der ersten Stufe im Baum: P(1. rot) = " +
        num(s1[0].p, 3) +
        ", P(1. blau) = " +
        num(s1[1].p, 3) +
        ".";
      guideNextBtn.disabled = true;
    } else {
      guideExplain.textContent = `Klicke „Nächstes Blatt eintragen“, um Pfad ${guideIndex + 1} von ${tree.leaves.length} einzutragen.`;
      guideNextBtn.disabled = false;
    }
  }
  function resetGuide() {
    guideIndex = 0;
    guideFilled = new Set();
    guideLastKey = null;
    tree.highlight(null);
    renderGuide();
  }
  guideNextBtn.addEventListener("click", () => {
    if (guideIndex >= tree.leaves.length) return;
    const lf = tree.leaves[guideIndex];
    const key = cellKey(lf.b1.key, lf.b2.key);
    guideFilled.add(key);
    guideLastKey = key;
    tree.highlight(guideIndex);
    highlightVftCell(key);
    explainBox.innerHTML = cellExplainHTML(lf.b1.key, lf.b2.key);
    guideIndex++;
    renderGuide();
  });
  guideResetBtn.addEventListener("click", resetGuide);

  function refreshAll() {
    tree = renderTree(treeMount, stage1(), stage2Fn, {
      onLeafClick(idx, lf) {
        highlightVftCell(cellKey(lf.b1.key, lf.b2.key));
        explainBox.innerHTML = cellExplainHTML(lf.b1.key, lf.b2.key);
      },
    });
    const probs = currentProbs();
    renderVft(relMount, probs, (v) => pct(v));
    const n = Number(nInput.value) || 1000;
    const absValues = {};
    Object.keys(probs).forEach((k) => (absValues[k] = Math.round(probs[k] * n)));
    renderVft(absMount, absValues, (v) => String(v));
    renderVft(empMount, simCounts, (v) => String(v));
    resetGuide();
  }
  function highlightVftCell(key) {
    [relMount, absMount, empMount].forEach((m) => {
      m.querySelectorAll(".vft-highlight").forEach((n) => n.classList.remove("vft-highlight"));
      const cell = m.querySelector(`[data-key="${key}"]`);
      if (cell) cell.classList.add("vft-highlight");
    });
  }

  btnMit.addEventListener("click", () => {
    mode = "mit";
    btnMit.classList.add("active");
    btnOhne.classList.remove("active");
    refreshAll();
  });
  btnOhne.addEventListener("click", () => {
    mode = "ohne";
    btnOhne.classList.add("active");
    btnMit.classList.remove("active");
    refreshAll();
  });
  nInput.addEventListener("input", refreshAll);

  document.getElementById("vft-simulate-btn").addEventListener("click", () => {
    for (let i = 0; i < 1000; i++) {
      const s1 = stage1();
      const idx1 = weightedIndex(s1.map((b) => b.p));
      const b1 = s1[idx1];
      const s2 = stage2Fn(idx1, b1);
      const idx2 = weightedIndex(s2.map((b) => b.p));
      const b2 = s2[idx2];
      simCounts[cellKey(b1.key, b2.key)]++;
      simTotal++;
    }
    refreshAll();
  });

  refreshAll();
}

// ================= 7. Übungsaufgaben =================
// Alle Aufgaben werden direkt hier auf der Seite gelöst — nicht auf einem separaten Blatt — und
// sind nach aufsteigendem Schwierigkeitsgrad sortiert. Wie im Rest des Lernpfads gilt dabei:
// kein Begriff/keine Notation der bedingten Wahrscheinlichkeit, Platzhalter verraten nie die
// Lösung, und Division wird bei Bedarf als Umkehrung der Multiplikation erklärt.

function circled(n) {
  return String.fromCodePoint(0x2460 + (n - 1));
}

// ---------- Baustein: Ereignis per Häkchen auswählen ----------
// mode "exact": die Auswahl muss exakt correctKeys entsprechen (z. B. "wähle alle geraden Zahlen").
// mode "target": jede Auswahl mit passender Wahrscheinlichkeit zählt (offene, kombinatorische
// Aufgabe, z. B. "wähle irgendeine Menge mit P(E) = 0,4").
function mountSelectExercise(container, { title, prompt, outcomes, mode, correctKeys, targetP, secondaryChecks, explain }) {
  const box = el("div", { class: "exercise" });
  box.appendChild(el("h3", {}, title));
  box.appendChild(el("p", { html: prompt }));

  const picker = el("div", { class: "event-picker" });
  const checks = outcomes.map((o) => {
    const cb = el("input", { type: "checkbox" });
    const swatch = o.color ? el("span", { class: "stat-swatch", style: `background:${o.color}` }) : null;
    const label = el("label", {}, [cb, swatch, o.label].filter(Boolean));
    picker.appendChild(label);
    return { cb, label, o };
  });
  box.appendChild(picker);

  const liveInfo = el("p", { class: "progress-note" }, "");
  box.appendChild(liveInfo);
  function refreshLive() {
    const chosen = checks.filter((c) => c.cb.checked).map((c) => c.o);
    if (chosen.length === 0) {
      liveInfo.textContent = "Noch keine Auswahl.";
      return;
    }
    const p = chosen.reduce((s, o) => s + o.p, 0);
    liveInfo.textContent = "Aktuelle Auswahl: {" + chosen.map((o) => o.label).join(", ") + "} → P = " + num(p, 3) + " (" + pct(p) + ")";
  }
  checks.forEach((c) => c.cb.addEventListener("change", refreshLive));
  refreshLive();

  const secondary = secondaryChecks || [];
  if (secondary.length) {
    const list = el("ol", { class: "exercise-blank-list" });
    secondary.forEach((sc) => {
      const inp = el("input", { type: "text", placeholder: "Dezimalzahl oder %" });
      sc.input = inp;
      list.appendChild(el("li", {}, [sc.labelText + ": ", inp]));
    });
    box.appendChild(list);
  }

  const btn = el("button", { type: "button", class: "btn btn-primary" }, "Prüfen");
  const feedback = el("div", { class: "exercise-feedback" });
  box.appendChild(el("div", { class: "btn-row" }, btn));
  box.appendChild(feedback);

  btn.addEventListener("click", () => {
    const chosenKeys = new Set(checks.filter((c) => c.cb.checked).map((c) => c.o.key));
    let selectionOk;
    if (mode === "exact") {
      selectionOk = chosenKeys.size === correctKeys.length && correctKeys.every((k) => chosenKeys.has(k));
      checks.forEach((c) => {
        c.label.classList.remove("select-correct", "select-wrong");
        const shouldBeChecked = correctKeys.includes(c.o.key);
        c.label.classList.add(shouldBeChecked === c.cb.checked ? "select-correct" : "select-wrong");
      });
    } else {
      const p = outcomes.filter((o) => chosenKeys.has(o.key)).reduce((s, o) => s + o.p, 0);
      selectionOk = chosenKeys.size > 0 && Math.abs(p - targetP) < 0.01;
      checks.forEach((c) => {
        c.label.classList.remove("select-correct", "select-wrong");
        if (c.cb.checked) c.label.classList.add(selectionOk ? "select-correct" : "select-wrong");
      });
    }
    let secondaryOk = true;
    secondary.forEach((sc) => {
      const val = parseFlexibleNumber(sc.input.value);
      const ok = Math.abs(val - sc.correct) < 0.01;
      if (!ok) secondaryOk = false;
      sc.input.style.borderColor = ok ? "#157347" : "#b3261e";
      sc.input.style.background = ok ? "#e7f6ec" : "#fdecec";
    });
    const allOk = selectionOk && secondaryOk;
    feedback.className = "exercise-feedback " + (allOk ? "ok" : "err");
    feedback.textContent = (allOk ? "✓ Richtig! " : "✗ Noch nicht richtig. ") + (explain || "");
  });

  container.appendChild(box);
}

// ---------- Baustein: Baumdiagramm mit nummerierten Lücken ----------
// Manche Astbeschriftungen bzw. Pfadwahrscheinlichkeiten werden durch "① ?" ersetzt, dahinter
// füllt man in einer Liste die passenden Eingabefelder aus. buildTreeFill baut Baum + Liste,
// checkTreeBlanks prüft sie und trägt bei richtiger wie falscher Antwort den korrekten Wert
// direkt in den Baum ein (grün/rot) — die beiden sind getrennt, damit die Kombi-Aufgabe unten
// Baum und Vierfeldertafel unter einem gemeinsamen "Prüfen"-Knopf zusammenfassen kann.
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
  table.appendChild(el("tr", {}, [el("th", {}), ...colKeys.map((ck) => el("th", {}, colLabel + ": " + ck.label)), el("th", { class: "vft-gesamt" }, "gesamt")]));
  rowKeys.forEach((rk) => {
    const cells = colKeys.map((ck) => el("td", { class: "vft-cell" }, cellNode(rk.key + "_" + ck.key)));
    table.appendChild(el("tr", {}, [el("th", {}, rowLabel + ": " + rk.label), ...cells, el("td", { class: "vft-gesamt" }, cellNode("row_" + rk.key))]));
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

// ---------- Baustein: Kombi-Aufgabe (Baumdiagramm UND Vierfeldertafel in einem, ein Prüfen-Knopf) ----------
function mountComboExercise(container, { title, prompt, stage1, stage2Fn, blankSpecs, vft, explain }) {
  const box = el("div", { class: "exercise" });
  box.appendChild(el("h3", {}, title));
  box.appendChild(el("p", { html: prompt }));
  box.appendChild(el("p", {}, el("strong", {}, "1. Baumdiagramm")));
  const { svg } = buildTreeFill(box, { stage1, stage2Fn, blankSpecs });
  box.appendChild(el("p", {}, el("strong", {}, "2. Vierfeldertafel")));
  const { cellRefs } = buildVftFill(box, vft);

  const btn = el("button", { type: "button", class: "btn btn-primary" }, "Prüfen");
  const feedback = el("div", { class: "exercise-feedback" });
  box.appendChild(el("div", { class: "btn-row" }, btn));
  box.appendChild(feedback);
  btn.addEventListener("click", () => {
    const treeOk = checkTreeBlanks(svg, blankSpecs);
    const vftOk = checkVftBlanks(cellRefs, vft.blanks);
    const allOk = treeOk && vftOk;
    feedback.className = "exercise-feedback " + (allOk ? "ok" : "err");
    feedback.textContent = (allOk ? "✓ Alles richtig! " : "✗ Noch nicht alles richtig — die korrekten Werte stehen jetzt im Baum bzw. in der Tafel. ") + (explain || "");
  });

  container.appendChild(box);
}

function initExercises() {
  const mount = document.getElementById("exercises-mount");

  // Aufgabe 1 (leicht) — Ereignis direkt erkennen, exakte Auswahl.
  mountSelectExercise(mount, {
    title: "Aufgabe 1 — Ereignis erkennen",
    prompt: "Ein normaler 6-seitiger Würfel wird einmal geworfen. Wähle alle Augenzahlen aus, die zum Ereignis E = „gerade Zahl“ gehören.",
    outcomes: [1, 2, 3, 4, 5, 6].map((n) => ({ key: String(n), label: String(n), p: 1 / 6 })),
    mode: "exact",
    correctKeys: ["2", "4", "6"],
    explain: "E = {2, 4, 6} — das sind genau die geraden Augenzahlen von 1 bis 6.",
  });

  // Aufgabe 2 (leicht-mittel) — Gegenereignis erkennen und Summenregel anwenden.
  mountSelectExercise(mount, {
    title: "Aufgabe 2 — Gegenereignis und Summenregel",
    prompt:
      "Ein Glücksrad hat die Farben orange (P = 0,1), lila (P = 0,2), türkis (P = 0,3) und braun (P = 0,4). Das Ereignis E ist „türkis oder braun“. " +
      "Wähle die Farben des Gegenereignisses Ē aus und trage anschließend P(E) und P(Ē) ein.",
    outcomes: [
      { key: "orange", label: "orange", p: 0.1, color: "#e08a1e" },
      { key: "lila", label: "lila", p: 0.2, color: "#8a5cf6" },
      { key: "tuerkis", label: "türkis", p: 0.3, color: "#1a9e7a" },
      { key: "braun", label: "braun", p: 0.4, color: "#8b5a2b" },
    ],
    mode: "exact",
    correctKeys: ["orange", "lila"],
    secondaryChecks: [
      { labelText: "P(E)", correct: 0.7 },
      { labelText: "P(Ē)", correct: 0.3 },
    ],
    explain: "Ē = {orange, lila} — alles außer türkis und braun. P(E) = 0,3 + 0,4 = 0,7. P(Ē) = 0,1 + 0,2 = 0,3 = 1 − 0,7.",
  });

  // Aufgabe 3 (mittel) — offene, kombinatorische Laplace-Aufgabe: jede passende Auswahl zählt.
  mountSelectExercise(mount, {
    title: "Aufgabe 3 — Laplace-Experiment rückwärts",
    prompt:
      "Ein Laplace-Würfel hat die Augenzahlen 1 bis 10 (alle gleich wahrscheinlich). Wähle <strong>irgendeine</strong> Menge von Augenzahlen, " +
      "deren Ereignis die Wahrscheinlichkeit P(E) = 0,4 hat.",
    outcomes: Array.from({ length: 10 }, (_, i) => ({ key: String(i + 1), label: String(i + 1), p: 0.1 })),
    mode: "target",
    targetP: 0.4,
    explain: "Jede Auswahl mit genau 4 von 10 Zahlen ergibt P(E) = 4/10 = 0,4 — zum Beispiel {1, 2, 3, 4}, aber jede andere 4er-Auswahl ist genauso richtig.",
  });

  // Aufgabe 4 (mittel) — Baumdiagramm ausfüllen, unabhängige Stufen.
  mountTreeFillExercise(mount, {
    title: "Aufgabe 4 — Baumdiagramm ausfüllen: unabhängige Stufen",
    prompt:
      "Ein Reisebüro hat ermittelt: 60&nbsp;% der Kundinnen und Kunden buchen einen Flug (der Rest bucht keinen). Unabhängig davon wählen 30&nbsp;% " +
      "zusätzlich eine Reiserücktrittsversicherung (der Rest nicht). Vervollständige das Baumdiagramm: Trage die fehlende Astwahrscheinlichkeit und " +
      "alle vier Pfadwahrscheinlichkeiten in die nummerierten Felder ein.",
    stage1: [
      { key: "flug", label: "Flug", p: 0.6 },
      { key: "keinflug", label: "kein Flug", p: 0.4 },
    ],
    stage2Fn: () => [
      { key: "vers", label: "Versicherung", p: 0.3 },
      { key: "keinvers", label: "keine Versicherung", p: 0.7 },
    ],
    blankSpecs: [
      { kind: "s1", i: 1, correct: 0.4, labelText: "2. Ast der ersten Stufe: „kein Flug“", render: (v) => "kein Flug (" + num(v, 3) + ")" },
      { kind: "leaf", leafIdx: 0, correct: 0.18, labelText: "Pfad „Flug, Versicherung“", render: (v) => "P = " + num(v, 4) },
      { kind: "leaf", leafIdx: 1, correct: 0.42, labelText: "Pfad „Flug, keine Versicherung“", render: (v) => "P = " + num(v, 4) },
      { kind: "leaf", leafIdx: 2, correct: 0.12, labelText: "Pfad „kein Flug, Versicherung“", render: (v) => "P = " + num(v, 4) },
      { kind: "leaf", leafIdx: 3, correct: 0.28, labelText: "Pfad „kein Flug, keine Versicherung“", render: (v) => "P = " + num(v, 4) },
    ],
    explain: "kein Flug: 1 − 0,6 = 0,4. Pfade (Pfadmultiplikationsregel): 0,6·0,3 = 0,18, 0,6·0,7 = 0,42, 0,4·0,3 = 0,12, 0,4·0,7 = 0,28.",
  });

  // Aufgabe 5 (mittel-schwer) — Baumdiagramm ausfüllen, abhängige Stufen.
  mountTreeFillExercise(mount, {
    title: "Aufgabe 5 — Baumdiagramm ausfüllen: abhängige Stufen",
    prompt:
      "In einer Box liegen 5 blaue und 3 gelbe Bauklötze. Zwei Klötze werden nacheinander <strong>ohne Zurücklegen</strong> herausgenommen. Die erste " +
      "Stufe ist schon eingetragen — vervollständige die vier Äste der zweiten Stufe. Sie hängt vom Ergebnis der ersten Ziehung ab.",
    stage1: [
      { key: "blau", label: "blau", p: 5 / 8 },
      { key: "gelb", label: "gelb", p: 3 / 8 },
    ],
    stage2Fn: (i, b1) => {
      const urn = { blau: 5, gelb: 3 };
      urn[b1.key] -= 1;
      return [
        { key: "blau", label: "blau", p: urn.blau / 7 },
        { key: "gelb", label: "gelb", p: urn.gelb / 7 },
      ];
    },
    blankSpecs: [
      { kind: "s2", leafIdx: 0, correct: 4 / 7, labelText: "2. Ast nach „blau“: „blau“", render: (v) => "blau (" + num(v, 3) + ")" },
      { kind: "s2", leafIdx: 1, correct: 3 / 7, labelText: "2. Ast nach „blau“: „gelb“", render: (v) => "gelb (" + num(v, 3) + ")" },
      { kind: "s2", leafIdx: 2, correct: 5 / 7, labelText: "2. Ast nach „gelb“: „blau“", render: (v) => "blau (" + num(v, 3) + ")" },
      { kind: "s2", leafIdx: 3, correct: 2 / 7, labelText: "2. Ast nach „gelb“: „gelb“", render: (v) => "gelb (" + num(v, 3) + ")" },
    ],
    explain:
      "Nach „blau“ liegen noch 4 blaue und 3 gelbe (7 insgesamt) in der Box: blau = 4/7 ≈ 0,571, gelb = 3/7 ≈ 0,429. Nach „gelb“ liegen noch 5 blaue und 2 gelbe (7 insgesamt): blau = 5/7 ≈ 0,714, gelb = 2/7 ≈ 0,286.",
  });

  // Aufgabe 6 (schwer) — Vierfeldertafel ausfüllen, absolute Häufigkeiten (Rand- und Innenwerte).
  mountVftFillExercise(mount, {
    title: "Aufgabe 6 — Vierfeldertafel ausfüllen: absolute Häufigkeiten",
    prompt:
      "Bei einer Befragung von 120 Personen gaben 70 an, Hunde zu mögen (die übrigen mögen keine Hunde). Von den Hundefreunden mögen 45 auch Katzen. " +
      "Insgesamt mögen 80 der befragten Personen Katzen. Vervollständige die Vierfeldertafel.",
    rowLabel: "Hunde",
    colLabel: "Katzen",
    rowKeys: [
      { key: "ja", label: "ja" },
      { key: "nein", label: "nein" },
    ],
    colKeys: [
      { key: "ja", label: "ja" },
      { key: "nein", label: "nein" },
    ],
    given: { ja_ja: 45, row_ja: 70, col_ja: 80, grand: 120 },
    blanks: { ja_nein: 25, nein_ja: 35, nein_nein: 15, row_nein: 50, col_nein: 40 },
    formatFn: (v) => String(v),
    explain: "Hunde nein = 120−70 = 50. Hunde ja & Katzen nein = 70−45 = 25. Katzen nein gesamt = 120−80 = 40. Hunde nein & Katzen ja = 80−45 = 35. Hunde nein & Katzen nein = 50−35 = 15.",
  });

  // Aufgabe 7 (schwer) — Vierfeldertafel ausfüllen, relative Häufigkeiten aus Prozentangaben im Text.
  mountVftFillExercise(mount, {
    title: "Aufgabe 7 — Vierfeldertafel ausfüllen: relative Häufigkeiten",
    prompt:
      "An einer Schule spielen 55&nbsp;% der Jugendlichen ein Smartphone-Spiel, die übrigen 45&nbsp;% nicht. Von den Spielenden nutzen 40&nbsp;% " +
      "zusätzlich eine Lernapp, von den Nicht-Spielenden 70&nbsp;%. Die Randwerte für „Spiel“ stehen schon in der Tafel — berechne daraus die vier " +
      "inneren Felder und die beiden Randwerte für „Lernapp“.",
    rowLabel: "Spiel",
    colLabel: "Lernapp",
    rowKeys: [
      { key: "ja", label: "ja" },
      { key: "nein", label: "nein" },
    ],
    colKeys: [
      { key: "ja", label: "ja" },
      { key: "nein", label: "nein" },
    ],
    given: { row_ja: 0.55, row_nein: 0.45, grand: 1 },
    blanks: { ja_ja: 0.22, ja_nein: 0.33, nein_ja: 0.315, nein_nein: 0.135, col_ja: 0.535, col_nein: 0.465 },
    formatFn: (v) => pct(v),
    explain:
      "Innere Felder über die Pfadmultiplikationsregel: 0,55·0,40 = 0,22; 0,55·0,60 = 0,33; 0,45·0,70 = 0,315; 0,45·0,30 = 0,135. Die Randwerte für Lernapp sind die Spaltensummen: 0,22+0,315 = 0,535 bzw. 0,33+0,135 = 0,465.",
  });

  // Aufgabe 8 (am schwersten) — Kombi: erst das Baumdiagramm, dann die zugehörige Vierfeldertafel
  // für dasselbe Szenario, beide in einer Aufgabe mit einem gemeinsamen "Prüfen".
  mountComboExercise(mount, {
    title: "Aufgabe 8 — Kombi: Baumdiagramm und Vierfeldertafel zusammen",
    prompt:
      "In einem Beutel liegen 6 grüne und 4 gelbe Chips. Zwei Chips werden nacheinander <strong>ohne Zurücklegen</strong> gezogen. Vervollständige " +
      "zuerst die zweite Stufe des Baumdiagramms und trage anschließend die passenden relativen Häufigkeiten (in %) in die Vierfeldertafel ein.",
    stage1: [
      { key: "gruen", label: "grün", p: 0.6 },
      { key: "gelb", label: "gelb", p: 0.4 },
    ],
    stage2Fn: (i, b1) => {
      const beutel = { gruen: 6, gelb: 4 };
      beutel[b1.key] -= 1;
      return [
        { key: "gruen", label: "grün", p: beutel.gruen / 9 },
        { key: "gelb", label: "gelb", p: beutel.gelb / 9 },
      ];
    },
    blankSpecs: [
      { kind: "s2", leafIdx: 0, correct: 5 / 9, labelText: "2. Ast nach „grün“: „grün“", render: (v) => "grün (" + num(v, 3) + ")" },
      { kind: "s2", leafIdx: 1, correct: 4 / 9, labelText: "2. Ast nach „grün“: „gelb“", render: (v) => "gelb (" + num(v, 3) + ")" },
      { kind: "s2", leafIdx: 2, correct: 6 / 9, labelText: "2. Ast nach „gelb“: „grün“", render: (v) => "grün (" + num(v, 3) + ")" },
      { kind: "s2", leafIdx: 3, correct: 3 / 9, labelText: "2. Ast nach „gelb“: „gelb“", render: (v) => "gelb (" + num(v, 3) + ")" },
    ],
    vft: {
      rowLabel: "1. Chip",
      colLabel: "2. Chip",
      rowKeys: [
        { key: "gruen", label: "grün" },
        { key: "gelb", label: "gelb" },
      ],
      colKeys: [
        { key: "gruen", label: "grün" },
        { key: "gelb", label: "gelb" },
      ],
      given: { row_gruen: 0.6, row_gelb: 0.4, grand: 1 },
      blanks: { gruen_gruen: 1 / 3, gruen_gelb: 4 / 15, gelb_gruen: 4 / 15, gelb_gelb: 2 / 15, col_gruen: 0.6, col_gelb: 0.4 },
      formatFn: (v) => pct(v),
    },
    explain:
      "Baum: nach „grün“ bleiben 5 grüne von 9 (5/9 ≈ 0,556), nach „gelb“ bleiben 6 grüne von 9 (6/9 ≈ 0,667) usw. Tafel (Pfadmultiplikationsregel): 0,6·5/9 ≈ 33,3 %, 0,6·4/9 ≈ 26,7 %, 0,4·6/9 ≈ 26,7 %, 0,4·3/9 ≈ 13,3 %. " +
      "Die Randwerte für den 2. Chip sind zufällig genau wieder 60 % / 40 % — bei diesem Modell ist die Verteilung des zweiten Zugs genauso wie die des ersten.",
  });
}

// ================= Quizze =================

function initQuizzes() {
  mountQuiz(document.getElementById("quiz-ergebnis"), {
    q: "Was beschreibt die Ergebnismenge Ω eines Zufallsexperiments?",
    options: [
      "Nur das wahrscheinlichste Ergebnis",
      "Die Menge aller möglichen Ergebnisse",
      "Die Anzahl der Durchführungen",
      "Nur die Ergebnisse, die tatsächlich eingetreten sind",
    ],
    correct: 1,
    explain: "Ω enthält alle denkbaren Ergebnisse, egal ob sie im aktuellen Versuch tatsächlich eintreten.",
  });

  mountQuiz(document.getElementById("quiz-haeufigkeit"), {
    q: "Du drehst das Glücksrad 1000-mal. Die relative Häufigkeit von „rot“ liegt nun sehr nahe bei 0,5. Was besagt das Gesetz der großen Zahlen dazu?",
    options: [
      "Bei noch mehr Drehungen wird „rot“ immer seltener",
      "Die relative Häufigkeit pendelt sich mit wachsendem n um einen festen Wert ein — die Wahrscheinlichkeit",
      "Nach 1000 Drehungen ist das Experiment beendet und ändert sich nicht mehr",
      "Absolute und relative Häufigkeit sind für große n immer identisch",
    ],
    correct: 1,
    explain: "Dieser feste Wert, dem sich h annähert, ist per Definition die Wahrscheinlichkeit P.",
  });

  mountQuiz(document.getElementById("quiz-ereignis"), {
    q: "Beim Glücksrad ist E = „blau oder grün“. Was ist das Gegenereignis Ē?",
    options: ["„blau“", "„gelb oder rot“", "„weder blau noch grün noch gelb noch rot“", "Es gibt kein Gegenereignis"],
    correct: 1,
    explain: "Ē enthält genau die Ergebnisse, die nicht zu E gehören — hier also gelb und rot.",
  });

  mountQuiz(document.getElementById("quiz-laplace"), {
    q: "Woran erkennst du, dass ein Zufallsexperiment ein Laplace-Experiment ist?",
    options: [
      "Es hat genau zwei Ergebnisse",
      "Alle Ergebnisse sind gleich wahrscheinlich",
      "Es wird mit einem Würfel durchgeführt",
      "Die Wahrscheinlichkeiten ändern sich mit jeder Durchführung",
    ],
    correct: 1,
    explain: "Nur wenn jedes Ergebnis die gleiche Chance hat, darf man P(E) = |E|/|Ω| rechnen.",
  });

  mountQuiz(document.getElementById("quiz-baum1"), {
    q: "Münze und Glücksrad werden hintereinander durchgeführt und beeinflussen sich nicht. Wie berechnest du die Wahrscheinlichkeit eines Pfades im Baumdiagramm?",
    options: [
      "Die Wahrscheinlichkeiten entlang des Pfades addieren",
      "Die Wahrscheinlichkeiten entlang des Pfades multiplizieren",
      "Nur die Wahrscheinlichkeit der letzten Stufe verwenden",
      "Die größere der beiden Wahrscheinlichkeiten nehmen",
    ],
    correct: 1,
    explain: "Das ist die Pfadmultiplikationsregel — sie gilt für jeden einzelnen Pfad, unabhängig davon, ob die Stufen unabhängig oder abhängig sind.",
  });

  mountQuiz(document.getElementById("quiz-baum2"), {
    q: "Warum ändert sich beim Ziehen ohne Zurücklegen die Wahrscheinlichkeit der zweiten Stufe?",
    options: [
      "Weil sich Zufallsexperimente grundsätzlich mit der Zeit ändern",
      "Weil die erste gezogene Kugel fehlt und sich damit die Zusammensetzung der Urne ändert",
      "Weil das Baumdiagramm das so vorschreibt",
      "Sie ändert sich gar nicht, nur die Reihenfolge der Äste",
    ],
    correct: 1,
    explain: "Eine Kugel weniger in der Urne bedeutet neue Gesamtzahl und neue Anteile — deshalb hängt (abhängig!) Stufe 2 vom Ergebnis von Stufe 1 ab.",
  });

  mountQuiz(document.getElementById("quiz-vft"), {
    q: "In der Vierfeldertafel steht in der Zelle „1. rot, 2. blau“ der Wert 240 bei insgesamt 1000 Ziehungen. Wie groß ist die zugehörige relative Häufigkeit?",
    options: ["2,4 %", "24 %", "240 %", "0,024 %"],
    correct: 1,
    explain: "240/1000 = 0,24 = 24 %.",
  });
}

// ================= Start =================

document.addEventListener("DOMContentLoaded", () => {
  initGluecksrad();
  initLaplace();
  initBaum1();
  initBaum2();
  initExercises();
  initQuizzes();
});
