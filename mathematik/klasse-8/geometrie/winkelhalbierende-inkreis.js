import * as GC from "./geo-core.js?v=2";
import * as GS from "./geo-svg.js?v=2";
import { setupDraggableTriangle } from "./triangle-common.js?v=2";
import { drawWinkelhalbierende, drawInkreis } from "./constructions.js?v=2";

const W = 600,
  H = 440;
const svg = document.getElementById("geo-svg");
const layerTriangle = document.getElementById("layer-triangle");
const layerConstruct = document.getElementById("layer-construct");
const layerCenters = document.getElementById("layer-centers");
const layerVertices = document.getElementById("layer-vertices");
const toggleArcs = document.getElementById("toggle-arcs");
const countTabs = document.getElementById("count-tabs");
const instructionBox = document.getElementById("instruction-box");

// Wie viele der drei Winkelhalbierenden gezeichnet werden (1, 2 oder 3).
let count = 1;

const NOTES = {
  1: "Die Winkelhalbierende bei A enthält alle Punkte, die von den beiden Seiten AB und AC gleich weit entfernt sind. Ein einzelner solcher Punkt ist damit noch nicht festgelegt — es ist eine ganze Gerade.",
  2: "Mit der Winkelhalbierenden bei B kommt eine zweite Bedingung dazu. Ihr Schnittpunkt I ist von AB und AC gleich weit entfernt <em>und</em> von AB und BC — also von allen drei Seiten gleich weit.",
  3: "Die dritte Winkelhalbierende (bei C) läuft automatisch durch denselben Punkt I. Der Abstand von I zu einer Seite ist der Inkreisradius: Er wird als Lot von I auf die Seite konstruiert, und genau in diesem Fußpunkt berührt der Inkreis die Seite.",
};

function render(pts) {
  const { A, B, C } = pts;
  GS.clearEl(layerTriangle);
  GS.clearEl(layerConstruct);
  GS.clearEl(layerCenters);

  GS.drawSegment(layerTriangle, A, B);
  GS.drawSegment(layerTriangle, B, C);
  GS.drawSegment(layerTriangle, C, A);

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
}

const tri = setupDraggableTriangle(svg, layerVertices, W, H, GC.randomTriangle(W, H), render);
render(tri.pts);
renderNote();

toggleArcs.addEventListener("change", () => render(tri.pts));
document.getElementById("btn-new-triangle").addEventListener("click", () => tri.randomize());
countTabs.addEventListener("click", (e) => {
  const btn = e.target.closest(".geo-mode-tab[data-count]");
  if (!btn) return;
  count = Number(btn.dataset.count);
  [...countTabs.children].forEach((b) => b.classList.toggle("geo-mode-tab-active", b === btn));
  render(tri.pts);
  renderNote();
});
