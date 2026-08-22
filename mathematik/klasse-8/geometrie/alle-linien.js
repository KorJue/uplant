import * as GC from "./geo-core.js?v=17";
import * as GS from "./geo-svg.js?v=17";
import { setupDraggableTriangle } from "./triangle-common.js?v=17";
import { drawMittelsenkrechte, drawUmkreis, drawWinkelhalbierende, drawInkreis, drawSeitenhalbierende, drawHoehe } from "./constructions.js?v=17";
import { setupCanvasZoom } from "./canvas-zoom.js?v=17";

const W = 600,
  H = 460;
const svg = document.getElementById("geo-svg");
const layerTriangle = document.getElementById("layer-triangle");
const layerConstruct = document.getElementById("layer-construct");
const layerCenters = document.getElementById("layer-centers");
const layerVertices = document.getElementById("layer-vertices");
const layerTraces = document.getElementById("layer-traces");
const btnClearTraces = document.getElementById("btn-clear-traces");

const chk = {
  mittelsenkrechte: document.getElementById("chk-mittelsenkrechte"),
  winkelhalbierende: document.getElementById("chk-winkelhalbierende"),
  seitenhalbierende: document.getElementById("chk-seitenhalbierende"),
  hoehen: document.getElementById("chk-hoehen"),
  umkreis: document.getElementById("chk-umkreis"),
  inkreis: document.getElementById("chk-inkreis"),
  arcs: document.getElementById("toggle-arcs"),
};
const chkSpuren = document.getElementById("chk-spuren");

// Aufgezeichnete Bahnen der vier besonderen Punkte. Solange die Spuren eingeschaltet sind, wird bei
// jeder Änderung des Dreiecks die aktuelle Position angehängt; beim Ausschalten werden sie gelöscht.
// Angezeigt wird eine Spur aber nur, solange die Linien, deren Schnittpunkt sie ist, auch selbst
// eingeblendet sind (M nur mit Mittelsenkrechten, I nur mit Winkelhalbierenden usw.) — sonst würde
// z. B. eine H-Spur auftauchen, obwohl die Höhen gar nicht zu sehen sind.
const traces = { M: [], I: [], S: [], H: [] };
const TRACE_COLORS = { M: "#d64545", I: "#1a9e7a", S: "#8a5cf6", H: "#e08a1e" };
const TRACE_LINE_CHK = { M: "mittelsenkrechte", I: "winkelhalbierende", S: "seitenhalbierende", H: "hoehen" };
const TRACE_MAX = 400;
// Ab welchem Abstand von M und H die Eulersche Gerade als bestimmt gilt (SVG-Einheiten).
const EULER_MIN_SPAN = 3;

function recordTrace(pts) {
  const { A, B, C } = pts;
  const O = GC.circumcenter(A, B, C);
  const entries = { M: O, I: GC.incenter(A, B, C), S: GC.centroid(A, B, C), H: O ? GC.orthocenter(A, B, C) : null };
  for (const key of Object.keys(traces)) {
    const p = entries[key];
    if (!p || !isFinite(p.x) || !isFinite(p.y)) continue;
    const arr = traces[key];
    const last = arr[arr.length - 1];
    // Nur merklich verschiedene Positionen speichern, sonst wächst die Spur beim Ziehen unnötig.
    if (last && GC.dist(last, p) < 2) continue;
    arr.push(p);
    if (arr.length > TRACE_MAX) arr.shift();
  }
}

function clearTraces() {
  for (const key of Object.keys(traces)) traces[key] = [];
  GS.clearEl(layerTraces);
}

function renderTraces() {
  GS.clearEl(layerTraces);
  if (!chkSpuren.checked) return;
  for (const key of Object.keys(traces)) {
    if (!chk[TRACE_LINE_CHK[key]].checked) continue;
    for (const p of traces[key]) {
      const dot = GS.svgEl("circle", { cx: p.x, cy: p.y, r: 1.8, class: "geo-trace-dot" });
      dot.setAttribute("fill", TRACE_COLORS[key]);
      layerTraces.appendChild(dot);
    }
  }
}

// record = true nur, wenn sich das Dreieck tatsächlich geändert hat (Ziehen, neues Dreieck) —
// beim bloßen Umschalten eines Häkchens darf kein neuer Spurpunkt entstehen, sonst ließen sich die
// Spuren nie vollständig löschen.
function render(pts, record = false) {
  const { A, B, C } = pts;
  GS.clearEl(layerTriangle);
  GS.clearEl(layerConstruct);
  GS.clearEl(layerCenters);

  if (record && chkSpuren.checked) recordTrace(pts);
  renderTraces();

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

  drawEulerLine(pts);
}

// Eulersche Gerade: Sind Mittelsenkrechte, Seitenhalbierende und Höhen gleichzeitig eingeblendet,
// liegen mit M, S und H genau die drei Punkte auf dem Bild, die immer auf *einer* Geraden liegen —
// dann wird sie auch gezeichnet. Der Inkreismittelpunkt I gehört bewusst nicht dazu: Er liegt im
// Allgemeinen neben dieser Geraden, und genau das soll sichtbar bleiben.
function drawEulerLine(pts) {
  if (!(chk.mittelsenkrechte.checked && chk.seitenhalbierende.checked && chk.hoehen.checked)) return;
  const { A, B, C } = pts;
  const M = GC.circumcenter(A, B, C);
  if (!M) return;
  const Hp = GC.orthocenter(A, B, C);
  // Beim gleichseitigen Dreieck fallen M, S und H zusammen — dann ist keine Gerade bestimmt, und
  // eine trotzdem gezeichnete würde beim Ziehen wild um den gemeinsamen Punkt kreiseln.
  if (GC.dist(M, Hp) < EULER_MIN_SPAN) return;
  GS.drawLine(layerConstruct, M, GC.sub(Hp, M), { w: W, h: H }, "geo-euler");
  // M wird sonst nur zusammen mit dem Umkreis beschriftet — als einer der drei Punkte, die die
  // Gerade festlegen, muss er hier aber in jedem Fall zu sehen sein.
  if (!chk.umkreis.checked) GS.drawPoint(layerCenters, M, "M");
}

const tri = setupDraggableTriangle(svg, layerVertices, W, H, GC.randomTriangle(W, H), (pts) => render(pts, true));
render(tri.pts);

Object.values(chk).forEach((el) => el.addEventListener("change", () => render(tri.pts)));
chkSpuren.addEventListener("change", () => {
  if (!chkSpuren.checked) clearTraces();
  btnClearTraces.hidden = !chkSpuren.checked;
  render(tri.pts);
});
btnClearTraces.addEventListener("click", () => {
  clearTraces();
  render(tri.pts);
});
document.getElementById("btn-new-triangle").addEventListener("click", () => tri.randomize());

setupCanvasZoom(document.querySelector(".geo-layout").closest(".card"), document.getElementById("btn-zoom"));
