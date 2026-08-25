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

function initExercises() {
  const mount = document.getElementById("exercises-mount");

  mountExercise(mount, {
    title: "Aufgabe 1 — Summenregel",
    prompt:
      "Beim Glücksrad aus Abschnitt 1–3 gilt P(blau) = 0,25, P(grün) = 0,125, P(gelb) = 0,125, P(rot) = 0,5. " +
      "Wie groß ist die Wahrscheinlichkeit für das Ereignis „grün oder rot“?",
    placeholder: "z. B. 0,625 oder 62,5%",
    check: (v) => Math.abs(v - 0.625) < 0.01,
    explain: "P(grün oder rot) = P(grün) + P(gelb ... nein, grün) + P(rot) = 0,125 + 0,5 = 0,625 (62,5 %).",
  });

  mountExercise(mount, {
    title: "Aufgabe 2 — Baumdiagramm, unabhängige Stufen",
    prompt:
      "Eine faire Münze wird geworfen (P(Kopf) = P(Zahl) = 0,5) und unabhängig davon ein Glücksrad gedreht, bei dem P(rot) = 0,3 gilt. " +
      "Wie groß ist die Wahrscheinlichkeit für den Pfad „Kopf, dann rot“?",
    placeholder: "z. B. 0,15",
    check: (v) => Math.abs(v - 0.15) < 0.01,
    explain: "Pfadmultiplikationsregel: P(Kopf; rot) = 0,5 · 0,3 = 0,15.",
  });

  mountExercise(mount, {
    title: "Aufgabe 3 — abhängige Stufen (ohne Zurücklegen)",
    prompt:
      "In der Urne aus Abschnitt 6 liegen 4 rote und 6 blaue Kugeln. Es werden zwei Kugeln nacheinander <strong>ohne Zurücklegen</strong> gezogen. " +
      "Wie groß ist die Wahrscheinlichkeit, dass beide Kugeln rot sind?",
    placeholder: "z. B. 0,133",
    check: (v) => Math.abs(v - 4 / 10 * (3 / 9)) < 0.01,
    explain: "P(rot; rot) = 4/10 · 3/9 ≈ 0,133 (13,3 %) — nach der ersten roten Kugel bleiben nur noch 3 rote von 9 übrig.",
  });

  mountExercise(mount, {
    title: "Aufgabe 4 — Vierfeldertafel, relative Häufigkeit",
    prompt:
      "In einer Umfrage unter 80 Personen gaben 50 an, lieber Tee zu trinken, die restlichen lieber Kaffee. Von den Tee-Trinkern bevorzugen 20 " +
      "Personen süßes Gebäck, von den Kaffee-Trinkern 18. Wie groß ist die relative Häufigkeit (in %) der Personen, die Tee <em>und</em> süßes Gebäck bevorzugen?",
    placeholder: "z. B. 25%",
    check: (v) => Math.abs(v - 0.25) < 0.01,
    explain: "20 von 80 Personen: 20/80 = 0,25 = 25 %.",
  });

  mountExercise(mount, {
    title: "Aufgabe 5 — Kombination: Baumdiagramm und Summenregel",
    prompt:
      "Wieder die Urne mit 4 roten und 6 blauen Kugeln, zwei Ziehungen <strong>ohne Zurücklegen</strong>. Wie groß ist die Wahrscheinlichkeit, " +
      "dass die beiden gezogenen Kugeln <strong>unterschiedliche</strong> Farben haben?",
    placeholder: "z. B. 0,533",
    check: (v) => Math.abs(v - (4 / 10 * (6 / 9) + 6 / 10 * (4 / 9))) < 0.01,
    explain: "P(rot;blau) + P(blau;rot) = 4/10·6/9 + 6/10·4/9 = 4/15 + 4/15 = 8/15 ≈ 0,533 (53,3 %) — Pfadadditionsregel über die beiden passenden Pfade.",
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
