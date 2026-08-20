// Grundkonstruktionen: Mittelsenkrechte & Winkelhalbierende — geführte Animation und freies
// Konstruieren mit Prüfung. Bei jedem Laden (und über "Neue Aufgabe") wird eine neue Zufallsaufgabe
// erzeugt.

import * as GC from "./geo-core.js?v=1";
import * as GS from "./geo-svg.js?v=1";

const W = 600,
  H = 420;

const svg = document.getElementById("geo-svg");
const layerGiven = document.getElementById("layer-given");
const layerConstruct = document.getElementById("layer-construct");
const layerUser = document.getElementById("layer-user");
const layerPoints = document.getElementById("layer-points");

const els = {
  exerciseTabs: document.getElementById("exercise-tabs"),
  phaseTabs: document.getElementById("phase-tabs"),
  instructionBox: document.getElementById("instruction-box"),
  stepsList: document.getElementById("steps-list"),
  feedbackBox: document.getElementById("feedback-box"),
  guidedControls: document.getElementById("guided-controls"),
  freeControls: document.getElementById("free-controls"),
  btnBack: document.getElementById("btn-back"),
  btnNext: document.getElementById("btn-next"),
  btnNewTask: document.getElementById("btn-new-task"),
  btnToolCircle: document.getElementById("btn-tool-circle"),
  btnToolLine: document.getElementById("btn-tool-line"),
  btnUndo: document.getElementById("btn-undo"),
  btnClear: document.getElementById("btn-clear"),
  btnCheck: document.getElementById("btn-check"),
  btnHint: document.getElementById("btn-hint"),
  btnNewTaskFree: document.getElementById("btn-new-task-free"),
};

const state = {
  exercise: "mittelsenkrechte", // "mittelsenkrechte" | "winkelhalbierende"
  phase: "guided", // "guided" | "free"
  stepIndex: 0,
  task: null,
  tool: null,
};
let stepsData = null;

// ---------- Aufgaben erzeugen ----------

function newTask(exercise) {
  if (exercise === "mittelsenkrechte") {
    const { A, B } = GC.randomSegment(W, H);
    return { A, B };
  }
  const { S, P, Q } = GC.randomAngle(W, H);
  return { S, P, Q };
}

// ---------- Konstruktionsschritte: Mittelsenkrechte ----------

function mittelsenkrechteSteps(task) {
  const { A, B } = task;
  const r = GC.dist(A, B) * 0.58;
  const inter = GC.circleCircleIntersections(A, r, B, r);
  const [P1, P2] = inter.length === 2 ? inter : [GC.mid(A, B), GC.add(GC.mid(A, B), { x: 0, y: -1 })];
  return {
    steps: [
      {
        text: "Stelle den Zirkel auf einen Radius ein, der größer als die Hälfte der Strecke AB ist. Steche in A ein und zeichne einen Bogen oberhalb und unterhalb der Strecke.",
        render: () => {
          GS.drawCompassArc(layerConstruct, A, P1, r, 32, "geo-arc-a");
          GS.drawCompassArc(layerConstruct, A, P2, r, 32, "geo-arc-a");
        },
      },
      {
        text: "Steche jetzt mit demselben Radius in B ein und zeichne wieder einen Bogen oberhalb und unterhalb der Strecke, sodass er den ersten Bogen kreuzt.",
        render: () => {
          GS.drawCompassArc(layerConstruct, B, P1, r, 32, "geo-arc-b");
          GS.drawCompassArc(layerConstruct, B, P2, r, 32, "geo-arc-b");
        },
      },
      {
        text: "Die beiden Bogenpaare schneiden sich in zwei Punkten. Verbinde diese Punkte mit dem Lineal zu einer Geraden — das ist die Mittelsenkrechte von AB.",
        render: () => {
          GS.drawCross(layerConstruct, P1, "geo-schnitt");
          GS.drawCross(layerConstruct, P2, "geo-schnitt");
          GS.drawLine(layerConstruct, GC.mid(A, B), GC.perp(GC.sub(B, A)), { w: W, h: H }, "geo-construct geo-mittelsenkrechte");
        },
      },
    ],
  };
}

// ---------- Konstruktionsschritte: Winkelhalbierende ----------

function winkelhalbierendeSteps(task) {
  const { S: V, P, Q } = task;
  const r0 = Math.min(GC.dist(V, P), GC.dist(V, Q)) * 0.62;
  const dirP = GC.norm(GC.sub(P, V));
  const dirQ = GC.norm(GC.sub(Q, V));
  const P1 = GC.add(V, GC.scale(dirP, r0));
  const Q1 = GC.add(V, GC.scale(dirQ, r0));
  const r1 = GC.dist(P1, Q1) * 0.72;
  const cand = GC.circleCircleIntersections(P1, r1, Q1, r1);
  const bisDir = GC.angleBisectorDir(V, P, Q);
  let M = cand[0] || GC.add(V, GC.scale(bisDir, 120));
  if (cand.length === 2) {
    const d0 = GC.dot(GC.sub(cand[0], V), bisDir);
    const d1 = GC.dot(GC.sub(cand[1], V), bisDir);
    M = d0 >= d1 ? cand[0] : cand[1];
  }
  const angP = GC.angleOf(GC.sub(P1, V));
  const angQ = GC.angleOf(GC.sub(Q1, V));
  return {
    steps: [
      {
        text: "Steche mit dem Zirkel in den Scheitelpunkt S ein und zeichne einen Bogen, der beide Schenkel des Winkels schneidet.",
        render: () => {
          GS.drawArcSpan(layerConstruct, V, r0, angP, angQ, "geo-arc-a");
        },
      },
      {
        text: "Steche nacheinander in die beiden neuen Schnittpunkte auf den Schenkeln ein und zeichne mit demselben Radius je einen Bogen zur Mitte des Winkels hin, sodass sie sich kreuzen.",
        render: () => {
          GS.drawCross(layerConstruct, P1, "geo-schnitt");
          GS.drawCross(layerConstruct, Q1, "geo-schnitt");
          GS.drawCompassArc(layerConstruct, P1, M, r1, 34, "geo-arc-b");
          GS.drawCompassArc(layerConstruct, Q1, M, r1, 34, "geo-arc-c");
        },
      },
      {
        text: "Verbinde den Scheitelpunkt S mit dem neuen Schnittpunkt — das ist die Winkelhalbierende.",
        render: () => {
          GS.drawCross(layerConstruct, M, "geo-schnitt");
          const far = GC.add(V, GC.scale(GC.norm(GC.sub(M, V)), Math.max(W, H) * 1.3));
          GS.drawSegment(layerConstruct, V, far, "geo-construct geo-winkelhalbierende");
        },
      },
    ],
  };
}

function computeSteps() {
  stepsData = state.exercise === "mittelsenkrechte" ? mittelsenkrechteSteps(state.task) : winkelhalbierendeSteps(state.task);
}

// ---------- Gegebene Objekte (Strecke bzw. Winkel) zeichnen ----------

function renderGivenAndPoints() {
  GS.clearEl(layerGiven);
  GS.clearEl(layerPoints);
  if (state.exercise === "mittelsenkrechte") {
    const { A, B } = state.task;
    GS.drawSegment(layerGiven, A, B);
    GS.drawPoint(layerPoints, A, "A");
    GS.drawPoint(layerPoints, B, "B");
  } else {
    const { S, P, Q } = state.task;
    const farP = GC.add(S, GC.scale(GC.sub(P, S), 1.15));
    const farQ = GC.add(S, GC.scale(GC.sub(Q, S), 1.15));
    GS.drawSegment(layerGiven, S, farP);
    GS.drawSegment(layerGiven, S, farQ);
    GS.drawPoint(layerPoints, S, "S");
    GS.drawPoint(layerPoints, P, "P");
    GS.drawPoint(layerPoints, Q, "Q");
  }
}

// ---------- Phase 1: geführte Animation ----------

function finishedNote() {
  return state.exercise === "mittelsenkrechte"
    ? "Fertig! Jeder Punkt auf der Mittelsenkrechten ist gleich weit von A und von B entfernt."
    : "Fertig! Jeder Punkt auf der Winkelhalbierenden ist gleich weit von beiden Schenkeln entfernt.";
}

function renderGuided() {
  GS.clearEl(layerConstruct);
  const steps = stepsData.steps;
  for (let i = 0; i <= state.stepIndex; i++) steps[i].render();
  const isLast = state.stepIndex === steps.length - 1;
  els.instructionBox.innerHTML = `<p><strong>Schritt ${state.stepIndex + 1} von ${steps.length}:</strong> ${steps[state.stepIndex].text}</p>${
    isLast ? `<p>✅ ${finishedNote()}</p>` : ""
  }`;
  els.stepsList.innerHTML = steps
    .map((s, i) => {
      const cls = i < state.stepIndex ? "geo-step-done" : i === state.stepIndex ? "geo-step-active" : "";
      return `<li class="${cls}">${s.text}</li>`;
    })
    .join("");
  els.btnBack.disabled = state.stepIndex === 0;
  els.btnNext.disabled = isLast;
  els.feedbackBox.hidden = true;
}

// ---------- Phase 2: freies Konstruieren ----------

// Bei der Winkelhalbierenden schneidet der erste Kreis (um S) die beiden Schenkel — diese beiden
// Punkte sind an der Zeichnung selbst nicht mit einem Kreuz markiert (anders als Kreis-Kreis-
// Schnittpunkte), sollen aber trotzdem präzise anklickbar sein, damit sich die beiden nächsten
// Kreise exakt dort zentrieren lassen.
function getRaySnapPoints() {
  if (state.exercise !== "winkelhalbierende") return [];
  const { S, P, Q } = state.task;
  const c0 = state.tool.circles.find((c) => GC.dist(c.center, S) < 16);
  if (!c0) return [];
  const dirP = GC.norm(GC.sub(P, S));
  const dirQ = GC.norm(GC.sub(Q, S));
  return [GC.add(S, GC.scale(dirP, c0.radius)), GC.add(S, GC.scale(dirQ, c0.radius))];
}

function getSnapTargets() {
  const fixed = state.exercise === "mittelsenkrechte" ? [state.task.A, state.task.B] : [state.task.S, state.task.P, state.task.Q];
  const circlePts = [];
  const circles = state.tool.circles;
  for (let i = 0; i < circles.length; i++) {
    for (let j = i + 1; j < circles.length; j++) {
      circlePts.push(...GC.circleCircleIntersections(circles[i].center, circles[i].radius, circles[j].center, circles[j].radius));
    }
  }
  return fixed.concat(circlePts, getRaySnapPoints());
}

function snapToNearest(raw) {
  const targets = getSnapTargets();
  let best = raw,
    bestD = 16;
  for (const t of targets) {
    const d = GC.dist(raw, t);
    if (d < bestD) {
      bestD = d;
      best = t;
    }
  }
  return best;
}

function renderUserIntersectionCrosses() {
  const circles = state.tool.circles;
  for (let i = 0; i < circles.length; i++) {
    for (let j = i + 1; j < circles.length; j++) {
      const inter = GC.circleCircleIntersections(circles[i].center, circles[i].radius, circles[j].center, circles[j].radius);
      inter.forEach((p) => GS.drawCross(layerUser, p, "geo-schnitt"));
    }
  }
  getRaySnapPoints().forEach((p) => GS.drawCross(layerUser, p, "geo-schnitt"));
}

function updateFreeInstruction() {
  const text =
    state.exercise === "mittelsenkrechte"
      ? "Konstruiere die Mittelsenkrechte von AB selbst: Zeichne mit dem Kreis-Werkzeug zwei gleich große Kreise um A und um B (Radius größer als die halbe Strecke AB) und verbinde die beiden Schnittpunkte mit dem Geraden-Werkzeug."
      : "Konstruiere die Winkelhalbierende selbst: Zeichne zunächst einen Kreis um S, der beide Schenkel schneidet. Zeichne dann zwei gleich große Kreise um diese beiden Schnittpunkte und verbinde S mit ihrem Schnittpunkt.";
  els.instructionBox.innerHTML = `<p>${text}</p>`;
  els.stepsList.innerHTML = `
    <li>Kreis-Werkzeug wählen, auf den Mittelpunkt klicken, dann auf einen Punkt auf dem gewünschten Radius klicken.</li>
    <li>Geraden-Werkzeug wählen, zwei Punkte anklicken, durch die die Gerade verlaufen soll (Schnittpunkte der Bögen lassen sich präzise anklicken).</li>
    <li>Mit „Prüfen“ kontrollieren, mit „Tipp“ einen Hinweis bekommen.</li>
  `;
}

function lineThroughBoth(l, p1, p2) {
  const d = GC.norm(GC.sub(l.b, l.a));
  const b = GC.add(l.a, d);
  const distToLine = (p) => Math.abs(GC.cross2(l.a, b, p));
  return distToLine(p1) < 12 && distToLine(p2) < 12;
}

function checkMittelsenkrechte() {
  const { A, B } = state.task;
  const circles = state.tool.circles;
  const lines = state.tool.lines;
  const tolPt = 16;
  const cA = circles.find((c) => GC.dist(c.center, A) < tolPt);
  const cB = circles.find((c) => c !== cA && GC.dist(c.center, B) < tolPt);
  if (!cA || !cB) {
    return { ok: false, msg: `Es fehlt noch ein Kreis mit Mittelpunkt in ${!cA ? "A" : "B"}. Zirkel-Werkzeug wählen und zuerst auf ${!cA ? "A" : "B"} klicken.` };
  }
  const relDiff = Math.abs(cA.radius - cB.radius) / Math.max(cA.radius, cB.radius);
  if (relDiff > 0.08) {
    return { ok: false, msg: "Die beiden Kreise müssen denselben Radius haben — der Zirkel wird zwischen den beiden Bögen nicht verstellt." };
  }
  const minR = GC.dist(A, B) / 2;
  if (Math.min(cA.radius, cB.radius) < minR * 1.02) {
    return { ok: false, msg: "Der Radius ist zu klein — er muss größer als die Hälfte der Strecke AB sein, sonst schneiden sich die Kreise nicht." };
  }
  const avgR = (cA.radius + cB.radius) / 2;
  const inter = GC.circleCircleIntersections(A, avgR, B, avgR);
  if (inter.length < 2) {
    return { ok: false, msg: "Die Kreise schneiden sich nicht in zwei Punkten. Radius vergrößern." };
  }
  const goodLine = lines.find((l) => lineThroughBoth(l, inter[0], inter[1]));
  if (!goodLine) {
    return { ok: false, msg: "Es fehlt noch die Gerade durch die beiden Schnittpunkte der Bögen. Geraden-Werkzeug wählen." };
  }
  return { ok: true, msg: "Richtig konstruiert! Das ist die Mittelsenkrechte von AB — jeder Punkt auf ihr ist gleich weit von A und B entfernt." };
}

function checkWinkelhalbierende() {
  const { S: V, P, Q } = state.task;
  const circles = state.tool.circles;
  const lines = state.tool.lines;
  const tolPt = 16;
  const c0 = circles.find((c) => GC.dist(c.center, V) < tolPt);
  if (!c0) {
    return { ok: false, msg: "Es fehlt der erste Kreis mit Mittelpunkt im Scheitelpunkt S. Zirkel-Werkzeug wählen und zuerst auf S klicken." };
  }
  const r0 = c0.radius;
  const maxR0 = Math.min(GC.dist(V, P), GC.dist(V, Q));
  if (r0 < 20) return { ok: false, msg: "Der erste Bogen um S ist zu klein. Größeren Radius wählen." };
  if (r0 > maxR0 * 1.05) return { ok: false, msg: "Der erste Bogen um S ist zu groß — er muss beide Schenkel schneiden, bevor sie enden." };
  const dirP = GC.norm(GC.sub(P, V));
  const dirQ = GC.norm(GC.sub(Q, V));
  const P1 = GC.add(V, GC.scale(dirP, r0));
  const Q1 = GC.add(V, GC.scale(dirQ, r0));
  const others = circles.filter((c) => c !== c0);
  const c1 = others.find((c) => GC.dist(c.center, P1) < tolPt);
  const c2 = others.find((c) => c !== c1 && GC.dist(c.center, Q1) < tolPt);
  if (!c1 || !c2) {
    return { ok: false, msg: "Es fehlen noch die beiden Kreise um die Schnittpunkte auf den Schenkeln (gleicher Radius, zur Mitte des Winkels hin)." };
  }
  const relDiff = Math.abs(c1.radius - c2.radius) / Math.max(c1.radius, c2.radius);
  if (relDiff > 0.08) {
    return { ok: false, msg: "Die beiden neuen Kreise müssen denselben Radius haben." };
  }
  const minR1 = GC.dist(P1, Q1) / 2;
  if (Math.min(c1.radius, c2.radius) < minR1 * 1.02) {
    return { ok: false, msg: "Der Radius der beiden neuen Kreise ist zu klein — sie müssen sich schneiden." };
  }
  const avgR1 = (c1.radius + c2.radius) / 2;
  const inter = GC.circleCircleIntersections(P1, avgR1, Q1, avgR1);
  if (inter.length < 2) return { ok: false, msg: "Die beiden neuen Kreise schneiden sich nicht. Radius vergrößern." };
  const bisDir = GC.angleBisectorDir(V, P, Q);
  const M = GC.dot(GC.sub(inter[0], V), bisDir) >= GC.dot(GC.sub(inter[1], V), bisDir) ? inter[0] : inter[1];
  const goodLine = lines.find((l) => lineThroughBoth(l, V, M));
  if (!goodLine) {
    return { ok: false, msg: "Es fehlt noch die Gerade vom Scheitelpunkt S durch den neuen Schnittpunkt." };
  }
  return { ok: true, msg: "Richtig konstruiert! Das ist die Winkelhalbierende — jeder Punkt auf ihr ist gleich weit von beiden Schenkeln entfernt." };
}

function showFeedback(kind, msg) {
  els.feedbackBox.hidden = false;
  els.feedbackBox.className = "geo-feedback geo-feedback-" + kind;
  els.feedbackBox.textContent = msg;
}

function setActiveToolBtn(active) {
  [els.btnToolCircle, els.btnToolLine].forEach((b) => b.classList.toggle("geo-btn-active", b === active));
}

function renderFreeSetup() {
  GS.clearEl(layerConstruct);
  state.tool.reset();
  setActiveToolBtn(null);
  updateFreeInstruction();
  els.feedbackBox.hidden = true;
}

// ---------- Umschalten Aufgabe / Phase ----------

function refreshAll() {
  renderGivenAndPoints();
  computeSteps();
  if (state.phase === "guided") {
    state.stepIndex = 0;
    renderGuided();
  } else {
    renderFreeSetup();
  }
}

els.exerciseTabs.addEventListener("click", (e) => {
  const btn = e.target.closest(".geo-mode-tab[data-exercise]");
  if (!btn) return;
  state.exercise = btn.dataset.exercise;
  [...els.exerciseTabs.children].forEach((b) => b.classList.toggle("geo-mode-tab-active", b === btn));
  state.task = newTask(state.exercise);
  refreshAll();
});

els.phaseTabs.addEventListener("click", (e) => {
  const btn = e.target.closest(".geo-mode-tab[data-phase]");
  if (!btn) return;
  state.phase = btn.dataset.phase;
  [...els.phaseTabs.children].forEach((b) => b.classList.toggle("geo-mode-tab-active", b === btn));
  els.guidedControls.hidden = state.phase !== "guided";
  els.freeControls.hidden = state.phase !== "free";
  if (state.phase === "guided") {
    state.stepIndex = 0;
    renderGuided();
  } else {
    renderFreeSetup();
  }
});

els.btnNext.addEventListener("click", () => {
  if (state.stepIndex < stepsData.steps.length - 1) {
    state.stepIndex++;
    renderGuided();
  }
});
els.btnBack.addEventListener("click", () => {
  if (state.stepIndex > 0) {
    state.stepIndex--;
    renderGuided();
  }
});
function newTaskClicked() {
  state.task = newTask(state.exercise);
  refreshAll();
}
els.btnNewTask.addEventListener("click", newTaskClicked);
els.btnNewTaskFree.addEventListener("click", newTaskClicked);

els.btnToolCircle.addEventListener("click", () => {
  state.tool.setMode("circle");
  setActiveToolBtn(els.btnToolCircle);
});
els.btnToolLine.addEventListener("click", () => {
  state.tool.setMode("line");
  setActiveToolBtn(els.btnToolLine);
});
els.btnUndo.addEventListener("click", () => state.tool.undo());
els.btnClear.addEventListener("click", () => {
  state.tool.reset();
  els.feedbackBox.hidden = true;
});
els.btnCheck.addEventListener("click", () => {
  const result = state.exercise === "mittelsenkrechte" ? checkMittelsenkrechte() : checkWinkelhalbierende();
  showFeedback(result.ok ? "ok" : "error", result.msg);
});
els.btnHint.addEventListener("click", () => {
  const result = state.exercise === "mittelsenkrechte" ? checkMittelsenkrechte() : checkWinkelhalbierende();
  showFeedback(result.ok ? "ok" : "hint", result.msg);
});

// ---------- Start ----------

state.tool = new GS.ConstructionTool(svg, layerUser, snapToNearest);
state.tool.extraRender = renderUserIntersectionCrosses;
state.task = newTask(state.exercise);
renderGivenAndPoints();
computeSteps();
renderGuided();
