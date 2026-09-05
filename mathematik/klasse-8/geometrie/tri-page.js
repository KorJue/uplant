// Gemeinsames Gerüst der beiden Dreiecks-Seiten ("Mittelsenkrechte & Umkreis" und
// "Winkelhalbierende & Inkreis"). Beide haben denselben Aufbau: ein ziehbares Dreieck, eine
// geführte Phase mit den Stufen 1/2/3 und eine Phase zum Selbstkonstruieren. Unterschiedlich sind
// nur die Texte und was in der geführten Phase gezeichnet wird — das kommt über die Konfiguration.

import * as GC from "./geo-core.js?v=21";
import * as GS from "./geo-svg.js?v=21";
import { setupDraggableTriangle } from "./triangle-common.js?v=21";
import { setupCanvasZoom } from "./canvas-zoom.js?v=21";
import { setupFreeConstruction } from "./free-ui.js?v=21";

/**
 * @param W, H        Maße der Zeichenfläche
 * @param task        Eintrag aus TRI_TASKS (Prüfung, Einrastpunkte, Texte der freien Phase)
 * @param notes       { 1, 2, 3 } — Erklärtext je Stufe der geführten Phase
 * @param guidedSteps Schrittliste der geführten Phase
 * @param drawStage   (layerConstruct, layerCenters, pts, count, showArcs) => void
 */
export function setupTrianglePage({ W, H, task, notes, guidedSteps, drawStage }) {
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

  let phase = "guided"; // "guided" | "free"
  // Wie viele der drei Linien in der geführten Phase gezeichnet werden (1, 2 oder 3) — schrittweise
  // aufgebaut, damit sichtbar wird, dass sich schon zwei in einem Punkt treffen und die dritte
  // "automatisch" durch denselben Punkt läuft.
  let count = 1;

  function drawTriangleSides(pts) {
    const { A, B, C } = pts;
    GS.drawSegment(layerTriangle, A, B);
    GS.drawSegment(layerTriangle, B, C);
    GS.drawSegment(layerTriangle, C, A);
  }

  function renderGuided(pts) {
    GS.clearEl(layerTriangle);
    GS.clearEl(layerConstruct);
    GS.clearEl(layerCenters);
    drawTriangleSides(pts);
    drawStage(layerConstruct, layerCenters, pts, count, toggleArcs.checked);
  }

  function renderNote() {
    instructionBox.innerHTML = `<p>${notes[count]}</p><p class="geo-why">${task.why}</p>`;
    stepsList.innerHTML = guidedSteps.map((s) => `<li>${s}</li>`).join("");
  }

  const tri = setupDraggableTriangle(svg, layerVertices, W, H, GC.randomTriangle(W, H), (pts) => {
    if (phase === "guided") {
      renderGuided(pts);
    } else {
      GS.clearEl(layerTriangle);
      drawTriangleSides(pts);
    }
  });

  const free = setupFreeConstruction({
    svg,
    layer: layerUser,
    els: {
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
      feedbackBox: document.getElementById("feedback-box"),
    },
    model: () => task.analyze(free.tool, tri.pts),
    check: () => task.check(task.analyze(free.tool, tri.pts)),
  });

  function enterFree() {
    GS.clearEl(layerConstruct);
    GS.clearEl(layerCenters);
    GS.clearEl(layerTriangle);
    drawTriangleSides(tri.pts);
    instructionBox.innerHTML = `<p>${task.intro}</p><p class="geo-why">${task.why}</p>`;
    stepsList.innerHTML = task.steps.map((s) => `<li>${s}</li>`).join("");
    free.reset();
  }

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
    // Während des freien Konstruierens sind die Eckpunkte gesperrt: Verschöben sie sich nebenbei,
    // würde die eigene Zeichnung ungültig, ohne dass es auffällt.
    tri.setLocked(phase === "free");
    if (phase === "guided") {
      renderGuided(tri.pts);
      renderNote();
    } else {
      enterFree();
    }
  });

  setupCanvasZoom(document.querySelector(".geo-layout").closest(".card"), document.getElementById("btn-zoom"));
}
