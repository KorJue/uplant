import * as GC from "./geo-core.js?v=1";
import * as GS from "./geo-svg.js?v=1";
import { setupDraggableTriangle } from "./triangle-common.js?v=1";
import { drawMittelsenkrechte, drawUmkreis, drawWinkelhalbierende, drawInkreis, drawSeitenhalbierende, drawHoehe } from "./constructions.js?v=1";

const W = 600,
  H = 460;
const svg = document.getElementById("geo-svg");
const layerTriangle = document.getElementById("layer-triangle");
const layerConstruct = document.getElementById("layer-construct");
const layerCenters = document.getElementById("layer-centers");
const layerVertices = document.getElementById("layer-vertices");

const chk = {
  mittelsenkrechte: document.getElementById("chk-mittelsenkrechte"),
  winkelhalbierende: document.getElementById("chk-winkelhalbierende"),
  seitenhalbierende: document.getElementById("chk-seitenhalbierende"),
  hoehen: document.getElementById("chk-hoehen"),
  umkreis: document.getElementById("chk-umkreis"),
  inkreis: document.getElementById("chk-inkreis"),
  arcs: document.getElementById("toggle-arcs"),
};

function render(pts) {
  const { A, B, C } = pts;
  GS.clearEl(layerTriangle);
  GS.clearEl(layerConstruct);
  GS.clearEl(layerCenters);

  GS.drawSegment(layerTriangle, A, B);
  GS.drawSegment(layerTriangle, B, C);
  GS.drawSegment(layerTriangle, C, A);

  const showArcs = chk.arcs.checked;

  if (chk.mittelsenkrechte.checked) {
    drawMittelsenkrechte(layerConstruct, W, H, A, B, showArcs);
    drawMittelsenkrechte(layerConstruct, W, H, B, C, showArcs);
    drawMittelsenkrechte(layerConstruct, W, H, C, A, showArcs);
  }
  if (chk.umkreis.checked) drawUmkreis(layerConstruct, layerCenters, A, B, C);

  if (chk.winkelhalbierende.checked) {
    drawWinkelhalbierende(layerConstruct, W, H, A, B, C, showArcs);
    drawWinkelhalbierende(layerConstruct, W, H, B, A, C, showArcs);
    drawWinkelhalbierende(layerConstruct, W, H, C, A, B, showArcs);
  }
  if (chk.inkreis.checked) drawInkreis(layerConstruct, layerCenters, A, B, C);

  if (chk.seitenhalbierende.checked) {
    drawSeitenhalbierende(layerConstruct, layerCenters, A, B, C, showArcs);
    drawSeitenhalbierende(layerConstruct, layerCenters, B, A, C, showArcs);
    drawSeitenhalbierende(layerConstruct, layerCenters, C, A, B, showArcs);
    GS.drawPoint(layerCenters, GC.centroid(A, B, C), "S");
  }
  if (chk.hoehen.checked) {
    drawHoehe(layerConstruct, A, B, C, showArcs);
    drawHoehe(layerConstruct, B, A, C, showArcs);
    drawHoehe(layerConstruct, C, A, B, showArcs);
    GS.drawPoint(layerCenters, GC.orthocenter(A, B, C), "H");
  }
}

const tri = setupDraggableTriangle(svg, layerVertices, W, H, GC.randomTriangle(W, H), render);
render(tri.pts);

Object.values(chk).forEach((el) => el.addEventListener("change", () => render(tri.pts)));
document.getElementById("btn-new-triangle").addEventListener("click", () => tri.randomize());
