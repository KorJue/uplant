import * as GC from "./geo-core.js?v=9";
import * as GS from "./geo-svg.js?v=9";
import { setupDraggableTriangle } from "./triangle-common.js?v=9";
import { drawWinkelhalbierende, drawInkreis } from "./constructions.js?v=9";
import { setupCanvasZoom } from "./canvas-zoom.js?v=9";
import { lineThroughBoth, sameRadius, twoArcIntersections, circlesIntersections } from "./check-helpers.js?v=9";

const W = 600,
  H = 440;
const svg = document.getElementById("geo-svg");
const layerTriangle = document.getElementById("layer-triangle");
const layerConstruct = document.getElementById("layer-construct");
const layerCenters = document.getElementById("layer-centers");
const layerUser = document.getElementById("layer-user");
const layerVertices = document.getElementById("layer-vertices");
const toggleArcs = document.getElementById("toggle-arcs");
const countTabs = document.getElementById("count-tabs");
const phaseTabs = document.getElementById("phase-tabs");
const instructionBox = document.getElementById("instruction-box");
const stepsList = document.getElementById("steps-list");
const guidedControls = document.getElementById("guided-controls");
const guidedToggleRow = document.getElementById("guided-toggle-row");
const guidedToolbar = document.getElementById("guided-toolbar");
const freeControls = document.getElementById("free-controls");
const feedbackBox = document.getElementById("feedback-box");
const els = {
  btnToolCircle: document.getElementById("btn-tool-circle"),
  btnToolLine: document.getElementById("btn-tool-line"),
  btnUndo: document.getElementById("btn-undo"),
  btnClear: document.getElementById("btn-clear"),
  btnCheck: document.getElementById("btn-check"),
  btnHint: document.getElementById("btn-hint"),
  chkLockRadius: document.getElementById("chk-lock-radius"),
  btnResetRadius: document.getElementById("btn-reset-radius"),
  radiusStatus: document.getElementById("radius-status"),
  pendingStatus: document.getElementById("pending-status"),
};

// Klick-/Prüftoleranz für "dieser Punkt ist gemeint" (SVG-Einheiten) — wie bei den Grundkonstruktionen.
const TOL_PT = GS.COARSE_POINTER ? 24 : 16;

let phase = "guided"; // "guided" | "free"

// Wie viele der drei Winkelhalbierenden im geführten Modus gezeichnet werden (1, 2 oder 3).
let count = 1;

const NOTES = {
  1: "Die Winkelhalbierende bei A enthält alle Punkte, die von den beiden Seiten AB und AC gleich weit entfernt sind. Ein einzelner solcher Punkt ist damit noch nicht festgelegt — es ist eine ganze Gerade.",
  2: "Mit der Winkelhalbierenden bei B kommt eine zweite Bedingung dazu. Ihr Schnittpunkt I ist von AB und AC gleich weit entfernt <em>und</em> von AB und BC — also von allen drei Seiten gleich weit.",
  3: "Die dritte Winkelhalbierende (bei C) läuft automatisch durch denselben Punkt I. Der Abstand von I zu einer Seite ist der Inkreisradius: Er wird als Lot von I auf die Seite konstruiert, und genau in diesem Fußpunkt berührt der Inkreis die Seite.",
};
const GUIDED_STEPS = [
  "Konstruiere für zwei der drei Innenwinkel die Winkelhalbierende: Zirkel in den Scheitelpunkt einstechen, Bogen über beide Schenkel zeichnen, dann von den beiden neuen Schnittpunkten aus mit gleichem Radius zwei Bögen zeichnen, die sich kreuzen, und den Scheitelpunkt mit diesem Kreuzungspunkt verbinden.",
  "Die Winkelhalbierenden schneiden sich in einem Punkt — dem Inkreismittelpunkt I.",
  "Fälle von I aus das Lot auf eine der drei Seiten (rechter Winkel am Fußpunkt). Die Strecke von I bis zum Fußpunkt ist der Radius — an diesem Fußpunkt berührt der Kreis die Seite (Tangentenpunkt).",
  "Zeichne mit diesem Radius um I den Inkreis. Er berührt automatisch auch die beiden anderen Seiten.",
];

function drawTriangleSides(pts) {
  const { A, B, C } = pts;
  GS.drawSegment(layerTriangle, A, B);
  GS.drawSegment(layerTriangle, B, C);
  GS.drawSegment(layerTriangle, C, A);
}

function renderGuided(pts) {
  const { A, B, C } = pts;
  GS.clearEl(layerTriangle);
  GS.clearEl(layerConstruct);
  GS.clearEl(layerCenters);
  drawTriangleSides(pts);

  const showArcs = toggleArcs.checked;
  const vertices = [
    [A, B, C],
    [B, A, C],
    [C, A, B],
  ];
  for (let i = 0; i < count; i++) drawWinkelhalbierende(layerConstruct, W, H, vertices[i][0], vertices[i][1], vertices[i][2], showArcs);

  if (count >= 3) {
    drawInkreis(layerConstruct, layerCenters, A, B, C);
  } else if (count === 2) {
    GS.drawPoint(layerCenters, GC.incenter(A, B, C), "I");
  }
}

function renderNote() {
  instructionBox.innerHTML = `<p>${NOTES[count]}</p>`;
  stepsList.innerHTML = GUIDED_STEPS.map((s) => `<li>${s}</li>`).join("");
}

// ---------- Freies Konstruieren ----------

function verticesOf(pts) {
  const { A, B, C } = pts;
  return [
    [A, B, C, "A"],
    [B, A, C, "B"],
    [C, A, B, "C"],
  ];
}

// Die beiden Schnittpunkte des ersten Bogens um V mit den Schenkeln VP und VQ, sobald dieser Bogen
// gezeichnet ist — Hilfspunkte für die Winkelhalbierende bei V.
function vertexHelperPoints(V, P, Q) {
  const c0 = tool.circles.find((c) => GC.dist(c.center, V) < TOL_PT);
  if (!c0) return [];
  return [GC.add(V, GC.scale(GC.norm(GC.sub(P, V)), c0.radius)), GC.add(V, GC.scale(GC.norm(GC.sub(Q, V)), c0.radius))];
}

// true, sobald die Winkelhalbierende bei V (mit Schenkeln nach P und Q) vollständig konstruiert ist.
// Am Ende der Konstruktion liegen alle Kreise aller drei Ecken plus die des Lots und des Inkreises
// gleichzeitig in tool.circles — deshalb werden für jeden Schritt alle passenden Kandidaten
// durchprobiert, statt nur den jeweils ersten gefundenen Kreis zu nehmen (der könnte zufällig zu
// einer ganz anderen Teilkonstruktion gehören, die nur zufällig nahe genug liegt).
function bisectorOk(V, P, Q) {
  const maxR0 = Math.min(GC.dist(V, P), GC.dist(V, Q));
  const c0Candidates = tool.circles.filter((c) => GC.dist(c.center, V) < TOL_PT && c.radius >= 20 && c.radius <= maxR0 * 1.05);
  for (const c0 of c0Candidates) {
    const P1 = GC.add(V, GC.scale(GC.norm(GC.sub(P, V)), c0.radius));
    const Q1 = GC.add(V, GC.scale(GC.norm(GC.sub(Q, V)), c0.radius));
    const cand1 = tool.circles.filter((c) => c !== c0 && GC.dist(c.center, P1) < TOL_PT);
    const cand2 = tool.circles.filter((c) => c !== c0 && GC.dist(c.center, Q1) < TOL_PT);
    for (const c1 of cand1) {
      for (const c2 of cand2) {
        if (c1 === c2 || !sameRadius(c1, c2)) continue;
        if (Math.min(c1.radius, c2.radius) < (GC.dist(P1, Q1) / 2) * 1.02) continue;
        const inter = twoArcIntersections(P1, Q1, c1, c2);
        if (inter.length < 2) continue;
        const bisDir = GC.angleBisectorDir(V, P, Q);
        const M = GC.dot(GC.sub(inter[0], V), bisDir) >= GC.dot(GC.sub(inter[1], V), bisDir) ? inter[0] : inter[1];
        if (tool.lines.some((l) => lineThroughBoth(l, V, M))) return true;
      }
    }
  }
  return false;
}

function doneBisectorsCount() {
  return verticesOf(tri.pts).filter(([V, P, Q]) => bisectorOk(V, P, Q)).length;
}

// Sucht unter den Kreisen um I einen, der eine der drei Seiten an zwei Stellen schneidet, und prüft,
// ob von dort aus (über zwei gleich große Kreise) das Lot zu I gezogen wurde. Gibt den Lotfußpunkt
// zurück, sobald eine Seite so vollständig konstruiert ist — sonst null.
function lotFootOk(I) {
  const sides = [
    [tri.pts.A, tri.pts.B],
    [tri.pts.B, tri.pts.C],
    [tri.pts.C, tri.pts.A],
  ];
  for (const cI of tool.circles.filter((c) => GC.dist(c.center, I) < TOL_PT)) {
    for (const [sA, sB] of sides) {
      const hits = GC.circleLineIntersections(I, cI.radius, sA, sB);
      if (hits.length < 2) continue;
      const [X1, X2] = hits;
      const cand1 = tool.circles.filter((c) => c !== cI && GC.dist(c.center, X1) < TOL_PT);
      const cand2 = tool.circles.filter((c) => c !== cI && GC.dist(c.center, X2) < TOL_PT);
      for (const c1 of cand1) {
        for (const c2 of cand2) {
          if (c1 === c2 || !sameRadius(c1, c2)) continue;
          if (Math.min(c1.radius, c2.radius) < (GC.dist(X1, X2) / 2) * 1.02) continue;
          const foot = GC.footOfPerpendicular(I, sA, sB);
          if (tool.lines.some((l) => lineThroughBoth(l, I, foot))) return foot;
        }
      }
    }
  }
  return null;
}

// Nur zur Anzeige: die Schnittpunkte irgendeines (noch nicht notwendig fertigen) Kreises um I mit
// einer der drei Seiten, damit sie beim Konstruieren als Kreuz sichtbar und anklickbar sind.
function lotHelperPoints(I) {
  const sides = [
    [tri.pts.A, tri.pts.B],
    [tri.pts.B, tri.pts.C],
    [tri.pts.C, tri.pts.A],
  ];
  for (const c of tool.circles.filter((c) => GC.dist(c.center, I) < TOL_PT)) {
    for (const [sA, sB] of sides) {
      const hits = GC.circleLineIntersections(c.center, c.radius, sA, sB);
      if (hits.length === 2) return hits;
    }
  }
  return [];
}

function freeSnapPoints() {
  const { A, B, C } = tri.pts;
  let base = [A, B, C];
  for (const [V, P, Q] of verticesOf(tri.pts)) base = base.concat(vertexHelperPoints(V, P, Q));
  if (doneBisectorsCount() >= 2) {
    const I = GC.incenter(A, B, C);
    base.push(I);
    base = base.concat(lotHelperPoints(I));
  }
  return base;
}

function snapToNearest(raw) {
  const targets = freeSnapPoints().concat(circlesIntersections(tool.circles));
  let best = raw,
    bestD = TOL_PT;
  for (const t of targets) {
    const d = GC.dist(raw, t);
    if (d < bestD) {
      bestD = d;
      best = t;
    }
  }
  return best;
}

function renderUserMarkers() {
  circlesIntersections(tool.circles).forEach((p) => GS.drawCross(layerUser, p, "geo-schnitt-stark"));
  for (const [V, P, Q] of verticesOf(tri.pts)) {
    vertexHelperPoints(V, P, Q).forEach((p) => GS.drawCross(layerUser, p, "geo-schnitt-stark"));
  }
  if (doneBisectorsCount() >= 2) {
    const I = GC.incenter(tri.pts.A, tri.pts.B, tri.pts.C);
    GS.drawCross(layerUser, I, "geo-schnitt-stark");
    lotHelperPoints(I).forEach((p) => GS.drawCross(layerUser, p, "geo-schnitt-stark"));
  }
}

function checkFree() {
  const { A, B, C } = tri.pts;
  for (const [V, P, Q, label] of verticesOf(tri.pts)) {
    if (!bisectorOk(V, P, Q)) {
      return {
        ok: false,
        msg: `Es fehlt noch die Winkelhalbierende bei ${label}: Kreis um ${label} zeichnen, der beide anliegenden Seiten schneidet, dann zwei gleich große Kreise um die neuen Schnittpunkte zeichnen und ${label} mit deren Schnittpunkt verbinden.`,
      };
    }
  }
  const I = GC.incenter(A, B, C);
  const foot = lotFootOk(I);
  if (!foot) {
    return {
      ok: false,
      msg: "Es fehlt noch das Lot von I auf eine der drei Seiten: Kreis um I zeichnen, der eine Seite an zwei Stellen schneidet, dann zwei gleich große Kreise um diese Schnittpunkte zeichnen und I mit deren Schnittpunkt verbinden.",
    };
  }
  const r = GC.dist(I, foot);
  const cI = tool.circles.find((c) => GC.dist(c.center, I) < TOL_PT && Math.abs(c.radius - r) / r < 0.05);
  if (!cI) {
    return { ok: false, msg: "Es fehlt noch der Inkreis: Zirkel in I einstechen und den Radius auf den eben konstruierten Lotfußpunkt einstellen." };
  }
  return { ok: true, msg: "Richtig konstruiert! Alle drei Winkelhalbierenden schneiden sich in I, und der Kreis um I mit dem Lotabstand als Radius ist der Inkreis — er berührt alle drei Seiten." };
}

function updateFreeInstruction() {
  instructionBox.innerHTML = "<p>Konstruiere jetzt alle drei Winkelhalbierenden des Dreiecks und daraus den Inkreis.</p>";
  stepsList.innerHTML = `
    <li>Zirkel wählen, in einen Eckpunkt einstechen und einen Bogen zeichnen, der beide anliegenden Seiten schneidet.</li>
    <li>Von den beiden neuen Schnittpunkten aus mit gleichem Radius zwei Bögen zeichnen, die sich kreuzen (Häkchen „Zirkel-Radius beibehalten“ hilft dabei), und den Eckpunkt mit dem Kreuzungspunkt verbinden. Für zwei der drei Ecken wiederholen — die dritte trifft automatisch denselben Punkt I.</li>
    <li>Sobald zwei Winkelhalbierende stehen, rastet ihr Schnittpunkt I beim Anklicken ein. Zirkel in I einstechen und einen Bogen zeichnen, der eine der drei Seiten schneidet.</li>
    <li>Wie beim Lot: von den beiden neuen Schnittpunkten auf der Seite zwei gleich große Kreise zeichnen und I mit ihrem Kreuzungspunkt verbinden — das ist der Lotfußpunkt.</li>
    <li>Zirkel in I einstechen, Radius bis zum Lotfußpunkt einstellen und den Inkreis zeichnen.</li>
    <li>Mit „Prüfen“ kontrollieren, mit „Tipp“ einen Hinweis bekommen.</li>
  `;
}

function updatePendingStatus() {
  const p = tool.pending;
  els.pendingStatus.hidden = !p;
  if (!p) return;
  els.pendingStatus.textContent =
    p.type === "circle"
      ? "◯ Einstichpunkt gesetzt — klicke jetzt auf einen Punkt, durch den der Kreis gehen soll (Esc bricht ab)."
      : "／ Erster Punkt gesetzt — klicke jetzt auf den zweiten Punkt der Geraden (Esc bricht ab).";
}

function updateRadiusStatus() {
  els.btnResetRadius.hidden = !(tool.radiusLocked && tool.lockedRadius);
  if (!tool.radiusLocked) {
    els.radiusStatus.hidden = true;
    return;
  }
  els.radiusStatus.hidden = false;
  els.radiusStatus.textContent = tool.lockedRadius
    ? `🔒 Zirkel steht fest auf ${Math.round(tool.lockedRadius)} — ein Klick setzt den nächsten Kreis mit genau diesem Radius. Für eine andere Größe auf „Radius neu einstellen“ klicken.`
    : "🔒 Zirkel-Radius wird eingerastet: Zeichne den nächsten Kreis wie gewohnt mit zwei Klicks, danach genügt ein Klick.";
}

function updateStatus() {
  updatePendingStatus();
  updateRadiusStatus();
}

function showFeedback(kind, msg) {
  feedbackBox.hidden = false;
  feedbackBox.className = "geo-feedback geo-feedback-" + kind;
  feedbackBox.textContent = msg;
}

function setActiveToolBtn(active) {
  [els.btnToolCircle, els.btnToolLine].forEach((b) => b.classList.toggle("geo-btn-active", b === active));
}

function enterFree() {
  GS.clearEl(layerConstruct);
  GS.clearEl(layerCenters);
  drawTriangleSides(tri.pts);
  tool.setMode(null);
  tool.reset();
  setActiveToolBtn(null);
  updateFreeInstruction();
  updateStatus();
  feedbackBox.hidden = true;
}

// ---------- Ereignisse ----------

function onTriangleUpdate(pts) {
  if (phase === "guided") {
    renderGuided(pts);
  } else {
    GS.clearEl(layerTriangle);
    drawTriangleSides(pts);
  }
}

const tri = setupDraggableTriangle(svg, layerVertices, W, H, GC.randomTriangle(W, H), onTriangleUpdate);
const tool = new GS.ConstructionTool(svg, layerUser, snapToNearest);
tool.extraRender = renderUserMarkers;
tool.onChange = updateStatus;

renderGuided(tri.pts);
renderNote();

toggleArcs.addEventListener("change", () => renderGuided(tri.pts));
document.getElementById("btn-new-triangle").addEventListener("click", () => tri.randomize());
document.getElementById("btn-new-triangle-free").addEventListener("click", () => {
  tri.randomize();
  enterFree();
});
countTabs.addEventListener("click", (e) => {
  const btn = e.target.closest(".geo-mode-tab[data-count]");
  if (!btn) return;
  count = Number(btn.dataset.count);
  [...countTabs.children].forEach((b) => b.classList.toggle("geo-mode-tab-active", b === btn));
  renderGuided(tri.pts);
  renderNote();
});

phaseTabs.addEventListener("click", (e) => {
  const btn = e.target.closest(".geo-mode-tab[data-phase]");
  if (!btn) return;
  phase = btn.dataset.phase;
  [...phaseTabs.children].forEach((b) => b.classList.toggle("geo-mode-tab-active", b === btn));
  guidedControls.hidden = phase !== "guided";
  guidedToggleRow.hidden = phase !== "guided";
  guidedToolbar.hidden = phase !== "guided";
  freeControls.hidden = phase !== "free";
  tri.setLocked(phase === "free");
  if (phase === "guided") {
    renderGuided(tri.pts);
    renderNote();
  } else {
    enterFree();
  }
});

els.btnToolCircle.addEventListener("click", () => {
  tool.setMode("circle");
  setActiveToolBtn(els.btnToolCircle);
  updateStatus();
});
els.btnToolLine.addEventListener("click", () => {
  tool.setMode("line");
  setActiveToolBtn(els.btnToolLine);
  updateStatus();
});
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (tool.cancelPending()) updateStatus();
});
els.btnUndo.addEventListener("click", () => {
  tool.undo();
  updateStatus();
});
els.btnClear.addEventListener("click", () => {
  tool.reset();
  updateStatus();
  feedbackBox.hidden = true;
});
els.chkLockRadius.addEventListener("change", () => {
  tool.setRadiusLocked(els.chkLockRadius.checked);
  updateStatus();
});
els.btnResetRadius.addEventListener("click", () => {
  tool.clearLockedRadius();
  updateStatus();
});
els.btnCheck.addEventListener("click", () => {
  const result = checkFree();
  showFeedback(result.ok ? "ok" : "error", result.msg);
});
els.btnHint.addEventListener("click", () => {
  const result = checkFree();
  showFeedback(result.ok ? "ok" : "hint", result.msg);
});

setupCanvasZoom(document.querySelector(".geo-layout").closest(".card"), document.getElementById("btn-zoom"));
