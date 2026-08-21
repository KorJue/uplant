import * as GC from "./geo-core.js?v=1";
import * as GS from "./geo-svg.js?v=1";
import { setupDraggableTriangle } from "./triangle-common.js?v=1";
import { drawWinkelhalbierende, drawInkreis } from "./constructions.js?v=1";

const W = 600,
  H = 440;
const svg = document.getElementById("geo-svg");
const layerTriangle = document.getElementById("layer-triangle");
const layerConstruct = document.getElementById("layer-construct");
const layerCenters = document.getElementById("layer-centers");
const layerVertices = document.getElementById("layer-vertices");
const toggleArcs = document.getElementById("toggle-arcs");

function render(pts) {
  const { A, B, C } = pts;
  GS.clearEl(layerTriangle);
  GS.clearEl(layerConstruct);
  GS.clearEl(layerCenters);

  GS.drawSegment(layerTriangle, A, B);
  GS.drawSegment(layerTriangle, B, C);
  GS.drawSegment(layerTriangle, C, A);

  const showArcs = toggleArcs.checked;
  drawWinkelhalbierende(layerConstruct, W, H, A, B, C, showArcs);
  drawWinkelhalbierende(layerConstruct, W, H, B, A, C, showArcs);
  drawWinkelhalbierende(layerConstruct, W, H, C, A, B, showArcs);
  drawInkreis(layerConstruct, layerCenters, A, B, C);
}

const tri = setupDraggableTriangle(svg, layerVertices, W, H, GC.randomTriangle(W, H), render);
render(tri.pts);

toggleArcs.addEventListener("change", () => render(tri.pts));
document.getElementById("btn-new-triangle").addEventListener("click", () => tri.randomize());
