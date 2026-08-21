import * as GC from "./geo-core.js?v=3";
import * as GS from "./geo-svg.js?v=3";
import { setupDraggableTriangle } from "./triangle-common.js?v=3";
import { drawMittelsenkrechte, drawUmkreis } from "./constructions.js?v=3";

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

// Wie viele der drei Mittelsenkrechten gezeichnet werden (1, 2 oder 3) — schrittweise aufgebaut,
// damit sichtbar wird, dass sich bereits zwei in einem Punkt treffen und die dritte "automatisch"
// durch denselben Punkt läuft.
let count = 1;

const NOTES = {
  1: "Die Mittelsenkrechte von AB enthält alle Punkte, die von A und von B gleich weit entfernt sind. Ein einzelner solcher Punkt ist noch nicht festgelegt — es ist eine ganze Gerade.",
  2: "Jetzt kommt die Mittelsenkrechte von BC dazu. Ihr Schnittpunkt M ist gleich weit von A und B (erste Gerade) <em>und</em> gleich weit von B und C (zweite Gerade) — also von allen drei Ecken gleich weit entfernt.",
  3: "Die dritte Mittelsenkrechte (von CA) läuft automatisch durch denselben Punkt M — sie liefert keine neue Information. Um M mit dem Abstand zu einem Eckpunkt als Radius liegt der Umkreis: der Kreis durch A, B und C.",
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
