import * as GC from "./geo-core.js?v=9";
import * as GS from "./geo-svg.js?v=9";
import { setupDraggableTriangle } from "./triangle-common.js?v=9";
import { drawMittelsenkrechte, drawUmkreis } from "./constructions.js?v=9";
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

// Wie viele der drei Mittelsenkrechten im geführten Modus gezeichnet werden (1, 2 oder 3) —
// schrittweise aufgebaut, damit sichtbar wird, dass sich bereits zwei in einem Punkt treffen und
// die dritte "automatisch" durch denselben Punkt läuft.
let count = 1;

const NOTES = {
  1: "Die Mittelsenkrechte von AB enthält alle Punkte, die von A und von B gleich weit entfernt sind. Ein einzelner solcher Punkt ist noch nicht festgelegt — es ist eine ganze Gerade.",
  2: "Jetzt kommt die Mittelsenkrechte von BC dazu. Ihr Schnittpunkt M ist gleich weit von A und B (erste Gerade) <em>und</em> gleich weit von B und C (zweite Gerade) — also von allen drei Ecken gleich weit entfernt.",
  3: "Die dritte Mittelsenkrechte (von CA) läuft automatisch durch denselben Punkt M — sie liefert keine neue Information. Um M mit dem Abstand zu einem Eckpunkt als Radius liegt der Umkreis: der Kreis durch A, B und C.",
};
const GUIDED_STEPS = [
  "Konstruiere für jede der drei Seiten die Mittelsenkrechte: Zirkel in beide Endpunkte der Seite einstechen (Radius größer als die halbe Seitenlänge) und die beiden Schnittpunkte der Bögen verbinden.",
  "Alle drei Mittelsenkrechten schneiden sich in einem Punkt — dem Umkreismittelpunkt M. (Das muss man nur für zwei der drei Seiten wirklich konstruieren, die dritte geht automatisch durch M.)",
  "Zirkel in M einstechen, Radius bis zu einem der Eckpunkte einstellen, und den Umkreis durch A, B und C zeichnen.",
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
  const sides = [
    [A, B],
    [B, C],
    [C, A],
  ];
  for (let i = 0; i < count; i++) drawMittelsenkrechte(layerConstruct, W, H, sides[i][0], sides[i][1], showArcs);

  if (count >= 2) {
    const O = GC.circumcenter(A, B, C);
    if (count >= 3) {
      drawUmkreis(layerConstruct, layerCenters, A, B, C);
    } else if (O) {
      GS.drawPoint(layerCenters, O, "M");
    }
  }
}

function renderNote() {
  instructionBox.innerHTML = `<p>${NOTES[count]}</p>`;
  stepsList.innerHTML = GUIDED_STEPS.map((s) => `<li>${s}</li>`).join("");
}

// ---------- Freies Konstruieren ----------

// true, sobald zwei gleich große, ausreichend große Kreise um P und Q sowie die Verbindungsgerade
// ihrer Schnittpunkte gezeichnet sind — dann gilt die Mittelsenkrechte von PQ als konstruiert.
// Da jeder Eckpunkt zu zwei Seiten gehört, kann es dort mehrere Kreise geben (je einen pro Seite);
// deshalb werden alle Kombinationen aus einem Kreis um P und einem um Q durchprobiert, statt nur
// den jeweils ersten gefundenen zu nehmen.
function mediatriceOk(tool, P, Q) {
  const candP = tool.circles.filter((c) => GC.dist(c.center, P) < TOL_PT);
  const candQ = tool.circles.filter((c) => GC.dist(c.center, Q) < TOL_PT);
  for (const cP of candP) {
    for (const cQ of candQ) {
      if (cP === cQ || !sameRadius(cP, cQ)) continue;
      if (Math.min(cP.radius, cQ.radius) < (GC.dist(P, Q) / 2) * 1.02) continue;
      const inter = twoArcIntersections(P, Q, cP, cQ);
      if (inter.length < 2) continue;
      if (tool.lines.some((l) => lineThroughBoth(l, inter[0], inter[1]))) return true;
    }
  }
  return false;
}

function sidesOf(pts) {
  const { A, B, C } = pts;
  return [
    [A, B, "AB"],
    [B, C, "BC"],
    [C, A, "CA"],
  ];
}

function doneSidesCount(tool) {
  return sidesOf(tri.pts).filter(([P, Q]) => mediatriceOk(tool, P, Q)).length;
}

function freeSnapPoints() {
  const { A, B, C } = tri.pts;
  const base = [A, B, C];
  if (doneSidesCount(tool) >= 2) base.push(GC.circumcenter(A, B, C));
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
  if (doneSidesCount(tool) >= 2) {
    GS.drawCross(layerUser, GC.circumcenter(tri.pts.A, tri.pts.B, tri.pts.C), "geo-schnitt-stark");
  }
}

function checkFree() {
  const { A, B, C } = tri.pts;
  for (const [P, Q, label] of sidesOf(tri.pts)) {
    if (!mediatriceOk(tool, P, Q)) {
      return {
        ok: false,
        msg: `Es fehlt noch die Mittelsenkrechte von ${label}: zwei gleich große Kreise um ${label[0]} und ${label[1]} zeichnen (Radius größer als die halbe Seitenlänge) und ihre beiden Schnittpunkte mit dem Lineal verbinden.`,
      };
    }
  }
  const O = GC.circumcenter(A, B, C);
  const rTarget = GC.dist(O, A);
  const cO = tool.circles.find((c) => GC.dist(c.center, O) < TOL_PT && Math.abs(c.radius - rTarget) / rTarget < 0.05);
  const anyAtO = tool.circles.some((c) => GC.dist(c.center, O) < TOL_PT);
  if (!cO) {
    return anyAtO
      ? { ok: false, msg: "Der Kreis um M hat nicht den richtigen Radius — er muss genau durch die drei Eckpunkte A, B und C gehen." }
      : {
          ok: false,
          msg: "Es fehlt noch der Umkreis: Zirkel in den Umkreismittelpunkt M (Schnittpunkt der drei Mittelsenkrechten) einstechen und den Radius bis zu einem Eckpunkt einstellen.",
        };
  }
  return { ok: true, msg: "Richtig konstruiert! Alle drei Mittelsenkrechten schneiden sich in M, und der Kreis um M durch die Eckpunkte ist der Umkreis." };
}

function updateFreeInstruction() {
  instructionBox.innerHTML = "<p>Konstruiere jetzt alle drei Mittelsenkrechten des Dreiecks und daraus den Umkreis.</p>";
  stepsList.innerHTML = `
    <li>Zirkel wählen, in einen Eckpunkt einstechen und auf einen Punkt am gewünschten Radius klicken (größer als die halbe Seitenlänge). Dasselbe am anderen Endpunkt derselben Seite wiederholen.</li>
    <li>Mit „🔒 Zirkel-Radius beibehalten“ bleibt der Radius zwischen beiden Kreisen gleich.</li>
    <li>Lineal wählen und die beiden Schnittpunkte der Bögen verbinden — das ist die Mittelsenkrechte dieser Seite. Für alle drei Seiten wiederholen.</li>
    <li>Sobald zwei Mittelsenkrechten stehen, rastet ihr Schnittpunkt M (der Umkreismittelpunkt) beim Anklicken ein. Zirkel in M einstechen und den Radius bis zu einem Eckpunkt einstellen, um den Umkreis zu zeichnen.</li>
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
