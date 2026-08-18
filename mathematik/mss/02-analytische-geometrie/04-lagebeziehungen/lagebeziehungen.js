import { F, vec3 } from "./vectors.js?v=12";
import { planeFromParam, planeFromCoord, planeFromNormal, pointPoint, pointLine, pointPlane, lineLine, planePlane, linePlane } from "./geometry.js?v=12";
import * as N from "./notation.js?v=12";
import {
  toNum3,
  toNumPlane,
  scenePointPoint,
  scenePointLine,
  scenePointPlane,
  sceneLineLine,
  sceneLinePlane,
  scenePlanePlane,
} from "./viz.js?v=12";

const els = {
  typeGrid1: document.getElementById("type-grid-1"),
  typeGrid2: document.getElementById("type-grid-2"),
  typeGrid2Wrap: document.getElementById("type-grid-2-wrap"),
  inputCard: document.getElementById("input-card"),
  inputForms: document.getElementById("input-forms"),
  calcBtn: document.getElementById("calc-btn"),
  errorBox: document.getElementById("error-box"),
  resultCard: document.getElementById("result-card"),
  resultContent: document.getElementById("result-content"),
};

// ---------- Eingabe-Widget-Bausteine ----------

function vecInputHTML(prefix, labelHtml, idxLabels, defaults) {
  const rows = [0, 1, 2]
    .map(
      (i) => `
      <div class="vec-input-row">
        <span class="vec-input-idx">${idxLabels[i]} =</span>
        <input type="text" inputmode="decimal" data-var="${prefix}${i + 1}" value="${defaults[i]}">
      </div>`
    )
    .join("");
  return `<div class="vec-input"><div class="vec-input-label">${labelHtml}</div>${rows}</div>`;
}

function pointInputHTML(prefix, label, defaults) {
  return vecInputHTML(prefix, `Punkt ${label}`, [`x${N.sub(1)}`, `x${N.sub(2)}`, `x${N.sub(3)}`], defaults);
}

function vectorInputHTML(prefix, labelText, letter, defaults) {
  return vecInputHTML(prefix, labelText, [`${letter}${N.sub(1)}`, `${letter}${N.sub(2)}`, `${letter}${N.sub(3)}`], defaults);
}

function lineInputHTML(prefix, label, sD, uD) {
  return `<div class="line-input"><div class="group-label">Gerade ${label}</div>
    ${vectorInputHTML(prefix + "s", "Stützvektor s", "s", sD)}
    ${vectorInputHTML(prefix + "u", "Richtungsvektor v", "v", uD)}
  </div>`;
}

// defaultMode: welche Eingabeform beim ersten Anzeigen aktiv ist ("param"/"coord"/"normal") —
// Standard "param", außer bei zwei Ebenen gleichzeitig, wo die zweite standardmäßig in
// Koordinatenform vorgegeben wird (passend zum Standard-Rechenweg "Parameterform einsetzen").
function planeInputHTML(prefix, label, def, defaultMode = "param") {
  const isMode = (m) => (defaultMode === m ? "checked" : "");
  const hiddenUnless = (m) => (defaultMode === m ? "" : "hidden");
  return `<div class="plane-input" data-plane="${prefix}">
    <div class="group-label">Ebene ${label}</div>
    <div class="plane-mode-tabs">
      <label><input type="radio" name="${prefix}-mode" value="param" ${isMode("param")}> Parameterform</label>
      <label><input type="radio" name="${prefix}-mode" value="coord" ${isMode("coord")}> Koordinatenform</label>
      <label><input type="radio" name="${prefix}-mode" value="normal" ${isMode("normal")}> Normalenform</label>
    </div>
    <div class="plane-mode-body" data-mode-body="param" ${hiddenUnless("param")}>
      ${vectorInputHTML(prefix + "Ps", "Stützvektor s", "s", def.s)}
      ${vectorInputHTML(prefix + "Pu", "Richtungsvektor v", "v", def.u)}
      ${vectorInputHTML(prefix + "Pv", "Richtungsvektor w", "w", def.v)}
    </div>
    <div class="plane-mode-body" data-mode-body="coord" ${hiddenUnless("coord")}>
      <div class="coord-fields">
        <label>a <input type="text" inputmode="decimal" data-var="${prefix}Ca" value="${def.coord[0]}"></label>
        <label>b <input type="text" inputmode="decimal" data-var="${prefix}Cb" value="${def.coord[1]}"></label>
        <label>c <input type="text" inputmode="decimal" data-var="${prefix}Cc" value="${def.coord[2]}"></label>
        <label>= d <input type="text" inputmode="decimal" data-var="${prefix}Cd" value="${def.coord[3]}"></label>
      </div>
    </div>
    <div class="plane-mode-body" data-mode-body="normal" ${hiddenUnless("normal")}>
      ${vectorInputHTML(prefix + "Ns", "Stützvektor s", "s", def.s)}
      ${vectorInputHTML(prefix + "Nn", "Normalenvektor n", "n", def.n)}
    </div>
  </div>`;
}

// ---------- Werte auslesen ----------

function readVal(container, varName) {
  const el = container.querySelector(`[data-var="${varName}"]`);
  if (!el) throw new Error(`Feld "${varName}" nicht gefunden.`);
  try {
    return F(el.value);
  } catch (e) {
    throw new Error(`Ungültiger Wert bei "${varName}": "${el.value}"`);
  }
}
function readVec(container, prefix) {
  return vec3(readVal(container, prefix + "1"), readVal(container, prefix + "2"), readVal(container, prefix + "3"));
}
function readLine(container, prefix) {
  return { s: readVec(container, prefix + "s"), u: readVec(container, prefix + "u") };
}
function readPlane(container, prefix) {
  const planeEl = container.querySelector(`.plane-input[data-plane="${prefix}"]`);
  const mode = planeEl.querySelector(`input[name="${prefix}-mode"]:checked`).value;
  let plane;
  if (mode === "param") {
    plane = planeFromParam(readVec(planeEl, prefix + "Ps"), readVec(planeEl, prefix + "Pu"), readVec(planeEl, prefix + "Pv"));
  } else if (mode === "coord") {
    plane = planeFromCoord(readVal(planeEl, prefix + "Ca"), readVal(planeEl, prefix + "Cb"), readVal(planeEl, prefix + "Cc"), readVal(planeEl, prefix + "Cd"));
  } else {
    plane = planeFromNormal(readVec(planeEl, prefix + "Ns"), readVec(planeEl, prefix + "Nn"));
  }
  return { plane, mode };
}

// ---------- Darstellung gegebener Objekte ----------

function describePointHTML(label, p) {
  return `<div class="formula-block">${N.pointHTML(label, p)}</div>`;
}
// param: Parameterbuchstabe der Geraden — Standard "r" für eine einzelne Gerade; bei zwei
// Geraden gleichzeitig (g und h) muss h ein anderes Symbol als g verwenden, damit die beiden
// Parameter nicht wie ein und dieselbe Unbekannte aussehen.
function describeLineHTML(label, s, u, param = "r") {
  return `<div class="formula-block">${N.lineHTML(label, s, u, param)}</div>`;
}
// p1/p2: Parameterbuchstaben der Ebene — Standard "r"/"s" für eine einzelne Ebene (passend zur
// Geraden, die "r" verwendet). Sind zwei Objekte mit eigenem Parameter gleichzeitig sichtbar,
// bekommt das zweite andere Buchstaben: bei zwei Ebenen (E1, E2) verwendet E1 r/s und E2 t/u;
// bei Gerade + Ebene belegt die Gerade bereits r, die Ebene bekommt dort t/u.
function describePlaneHTML(label, plane, givenMode, p1 = "r", p2 = "s") {
  const modeNote = { param: "Parameterform", coord: "Koordinatenform", normal: "Normalenform" }[givenMode];
  return `
    <p class="form-note">Ebene ${label} — gegeben in ${modeNote}, automatisch in die beiden anderen Formen umgerechnet:</p>
    <div class="formula-block">${N.planeParamHTML(label, plane.s, plane.u, plane.v, p1, p2)}</div>
    <div class="formula-block">${N.planeCoordHTML(label, plane.a, plane.b, plane.c, plane.d)}</div>
    <div class="formula-block">${N.planeNormalHTML(label, plane.s, plane.n)}</div>
  `;
}
// Zeigt nur die tatsächlich eingegebene Form — keine automatische Umrechnung in die beiden
// anderen Formen. Bei zwei Ebenen mit drei Rechenwegen (Ebene-Ebene) rechnet stattdessen jedes
// Verfahren selbst nur in die Form um, die es wirklich braucht, mit sichtbaren Zwischenschritten.
function describePlaneGivenHTML(label, plane, givenMode, p1 = "r", p2 = "s") {
  const modeNote = { param: "Parameterform", coord: "Koordinatenform", normal: "Normalenform" }[givenMode];
  let eq;
  if (givenMode === "param") eq = N.planeParamHTML(label, plane.s, plane.u, plane.v, p1, p2);
  else if (givenMode === "coord") eq = N.planeCoordHTML(label, plane.a, plane.b, plane.c, plane.d);
  else eq = N.planeNormalHTML(label, plane.s, plane.n);
  return `
    <p class="form-note">Ebene ${label} — gegeben in ${modeNote}:</p>
    <div class="formula-block">${eq}</div>
  `;
}

// ---------- Kombinationen ----------

const COMBOS = {
  "punkt-punkt": {
    label: "Punkt – Punkt",
    build: () => `<div class="forms-row">${pointInputHTML("P", "P", [1, 2, 3])}${pointInputHTML("Q", "Q", [4, 5, 6])}</div>`,
    compute: (c) => {
      const P = readVec(c, "P");
      const Q = readVec(c, "Q");
      const result = pointPoint(P, Q);
      return {
        given: describePointHTML("P", P) + describePointHTML("Q", Q),
        result,
        scene: scenePointPoint(toNum3(P), toNum3(Q), result),
      };
    },
  },
  "punkt-gerade": {
    label: "Punkt – Gerade",
    build: () => `<div class="forms-row">${pointInputHTML("P", "P", [2, 1, 1])}${lineInputHTML("g", "g", [1, 0, 0], [1, 1, 1])}</div>`,
    compute: (c) => {
      const P = readVec(c, "P");
      const { s, u } = readLine(c, "g");
      const result = pointLine(P, s, u);
      return {
        given: describePointHTML("P", P) + describeLineHTML("g", s, u),
        result,
        scene: scenePointLine(toNum3(P), toNum3(s), toNum3(u), result),
      };
    },
  },
  "punkt-ebene": {
    label: "Punkt – Ebene",
    build: () =>
      `<div class="forms-row">${pointInputHTML("P", "P", [5, 5, 1])}${planeInputHTML("E", "E", {
        s: [0, 0, 0],
        u: [1, 0, 0],
        v: [0, 1, 0],
        coord: [0, 0, 1, 0],
        n: [0, 0, 1],
      })}</div>`,
    compute: (c) => {
      const P = readVec(c, "P");
      const { plane, mode } = readPlane(c, "E");
      const result = pointPlane(P, plane);
      return {
        given: describePointHTML("P", P) + describePlaneHTML("E", plane, mode),
        result,
        scene: scenePointPlane(toNum3(P), toNumPlane(plane), result),
      };
    },
  },
  "gerade-gerade": {
    label: "Gerade – Gerade",
    build: () => `<div class="forms-row">${lineInputHTML("g", "g", [0, 0, 0], [1, 0, 0])}${lineInputHTML("h", "h", [0, 1, 1], [0, 1, 0])}</div>`,
    compute: (c) => {
      const g = readLine(c, "g");
      const h = readLine(c, "h");
      const result = lineLine(g.s, g.u, h.s, h.u);
      return {
        given: describeLineHTML("g", g.s, g.u, "r") + describeLineHTML("h", h.s, h.u, "t"),
        result,
        scene: sceneLineLine(toNum3(g.s), toNum3(g.u), toNum3(h.s), toNum3(h.u), result),
      };
    },
  },
  "gerade-ebene": {
    label: "Gerade – Ebene",
    build: () =>
      `<div class="forms-row">${lineInputHTML("g", "g", [0, 0, 5], [0, 0, -1])}${planeInputHTML("E", "E", {
        s: [0, 0, 0],
        u: [1, 0, 0],
        v: [0, 1, 0],
        coord: [0, 0, 1, 0],
        n: [0, 0, 1],
      })}</div>`,
    compute: (c) => {
      const g = readLine(c, "g");
      const { plane, mode } = readPlane(c, "E");
      const result = linePlane(g.s, g.u, plane);
      return {
        given: describeLineHTML("g", g.s, g.u) + describePlaneHTML("E", plane, mode, "t", "u"),
        result,
        scene: sceneLinePlane(toNum3(g.s), toNum3(g.u), toNumPlane(plane), result),
      };
    },
  },
  "ebene-ebene": {
    label: "Ebene – Ebene",
    build: () =>
      `<div class="forms-row">${planeInputHTML(
        "E1",
        "E1",
        { s: [0, 0, 0], u: [1, -1, 0], v: [1, 0, -1], coord: [1, 1, 1, 0], n: [1, 1, 1] },
        "param"
      )}${planeInputHTML(
        "E2",
        "E2",
        { s: [0, 0, 0], u: [1, 1, 0], v: [0, 0, 1], coord: [1, -1, 0, 0], n: [1, -1, 0] },
        "coord"
      )}</div>`,
    compute: (c) => {
      const { plane: E1, mode: m1 } = readPlane(c, "E1");
      const { plane: E2, mode: m2 } = readPlane(c, "E2");
      const result = planePlane(E1, E2, m1, m2);
      return {
        given: describePlaneGivenHTML("E1", E1, m1, "r", "s") + describePlaneGivenHTML("E2", E2, m2, "t", "u"),
        result,
        scene: scenePlanePlane(toNumPlane(E1), toNumPlane(E2), result),
      };
    },
  },
};

let currentCombo = null;

function selectCombo(key) {
  currentCombo = key;
  els.inputForms.innerHTML = COMBOS[key].build();
  els.inputCard.hidden = false;
  els.resultCard.hidden = true;
  els.errorBox.hidden = true;
}

// ---------- Zweistufige Objektauswahl: erst der Typ des ersten, dann des zweiten Objekts ----------
// Die Reihenfolge der Auswahl ist egal — "Ebene" zuerst, dann "Punkt" führt auf denselben
// Rechner wie umgekehrt. Der COMBOS-Schlüssel ist immer nach TYPE_ORDER sortiert (z. B. immer
// "punkt-ebene", nie "ebene-punkt").
const TYPES = [
  { key: "punkt", label: "Punkt" },
  { key: "gerade", label: "Gerade" },
  { key: "ebene", label: "Ebene" },
];
const TYPE_ORDER = TYPES.map((t) => t.key);

function comboKeyFor(a, b) {
  const [x, y] = [a, b].sort((p, q) => TYPE_ORDER.indexOf(p) - TYPE_ORDER.indexOf(q));
  return `${x}-${y}`;
}

let firstType = null;
let secondType = null;

function renderTypeGrid(container, selected, onPick) {
  container.innerHTML = TYPES.map(
    (t) => `<button type="button" class="combo-btn${selected === t.key ? " active" : ""}" data-type="${t.key}">${t.label}</button>`
  ).join("");
  [...container.children].forEach((btn) => btn.addEventListener("click", () => onPick(btn.dataset.type)));
}

function pickFirst(type) {
  firstType = type;
  secondType = null;
  renderTypeGrid(els.typeGrid1, firstType, pickFirst);
  els.typeGrid2Wrap.hidden = false;
  renderTypeGrid(els.typeGrid2, secondType, pickSecond);
  currentCombo = null;
  els.inputCard.hidden = true;
  els.resultCard.hidden = true;
  els.errorBox.hidden = true;
}

function pickSecond(type) {
  secondType = type;
  renderTypeGrid(els.typeGrid2, secondType, pickSecond);
  selectCombo(comboKeyFor(firstType, secondType));
}

renderTypeGrid(els.typeGrid1, firstType, pickFirst);

// Umschalten der Ebenen-Eingabeform (Parameter-/Koordinaten-/Normalenform)
els.inputForms.addEventListener("change", (e) => {
  const radio = e.target.closest('input[type="radio"][name$="-mode"]');
  if (!radio) return;
  const planeEl = radio.closest(".plane-input");
  planeEl.querySelectorAll(".plane-mode-body").forEach((body) => {
    body.hidden = body.dataset.modeBody !== radio.value;
  });
});

// ---------- Ergebnis rendern ----------

function renderStep(s) {
  return s.kind === "eq" ? `<div class="step-eq">${s.html}</div>` : `<p class="step-text">${s.html}</p>`;
}
function renderMethod(m) {
  return `<h3>${m.title}</h3>${m.steps.map(renderStep).join("")}`;
}

function renderResult(given, result, scene) {
  let html = `<div class="given-objects">${given}</div>`;
  if (scene) html += scene;
  html += `<div class="relation-badge relation-${result.relation}">${result.relationLabel}</div>`;
  if (result.extras.length) {
    html += `<ul class="extras-list">${result.extras.map((e) => `<li><strong>${e.label}:</strong> ${e.value}</li>`).join("")}</ul>`;
  }
  html += result.methods.map((m) => `<div class="method-block">${renderMethod(m)}</div>`).join("");
  els.resultContent.innerHTML = html;
}

els.calcBtn.addEventListener("click", () => {
  els.errorBox.hidden = true;
  if (!currentCombo) return;
  try {
    const { given, result, scene } = COMBOS[currentCombo].compute(els.inputForms);
    renderResult(given, result, scene);
    els.resultCard.hidden = false;
  } catch (err) {
    console.error(err);
    els.errorBox.textContent = err && err.message ? err.message : String(err);
    els.errorBox.hidden = false;
    els.resultCard.hidden = true;
  }
});
