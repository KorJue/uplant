import * as GC from "./geo-core.js?v=1";
import * as GS from "./geo-svg.js?v=1";
import { setupDraggableTriangle } from "./triangle-common.js?v=1";
import { drawSeitenhalbierende, drawHoehe } from "./constructions.js?v=1";

const W = 600,
  H = 440;
const svg = document.getElementById("geo-svg");
const layerTriangle = document.getElementById("layer-triangle");
const layerConstruct = document.getElementById("layer-construct");
const layerCenters = document.getElementById("layer-centers");
const layerVertices = document.getElementById("layer-vertices");
const toggleArcs = document.getElementById("toggle-arcs");
const instructionBox = document.getElementById("instruction-box");
const stepsList = document.getElementById("steps-list");
const lineTabs = document.getElementById("line-tabs");

let mode = "seiten"; // "seiten" | "hoehen" | "beide"

const INSTRUCTIONS = {
  seiten: {
    text: "Eine Seitenhalbierende verbindet einen Eckpunkt mit dem Mittelpunkt der gegenüberliegenden Seite. Alle drei schneiden sich im Schwerpunkt S — er teilt jede Seitenhalbierende im Verhältnis 2:1 (vom Eckpunkt aus gemessen).",
    steps: [
      "Konstruiere den Mittelpunkt einer Seite genauso wie bei der Mittelsenkrechten: Zirkel in beide Endpunkte einstechen (gleicher Radius, größer als die halbe Seitenlänge) und die Schnittpunkte der Bögen verbinden — ihr Schnittpunkt mit der Seite ist deren Mittelpunkt.",
      "Verbinde den gegenüberliegenden Eckpunkt mit diesem Mittelpunkt — das ist die Seitenhalbierende.",
      "Wiederhole das für die anderen beiden Seiten. Alle drei Seitenhalbierenden schneiden sich im Schwerpunkt S.",
    ],
  },
  hoehen: {
    text: "Eine Höhe steht senkrecht auf einer Seite (bzw. deren Verlängerung) und geht durch den gegenüberliegenden Eckpunkt. Alle drei Höhen schneiden sich im Höhenschnittpunkt H — bei einem stumpfwinkligen Dreieck liegt er außerhalb des Dreiecks.",
    steps: [
      "Zeichne um den Eckpunkt einen Kreis, der die gegenüberliegende Seite (nötigenfalls verlängert) in zwei Punkten schneidet.",
      "Zeichne um diese beiden neuen Punkte mit demselben Radius je einen Bogen, der sich im Eckpunkt (und einem Punkt auf der anderen Seite) trifft.",
      "Die Verbindung von Eckpunkt und Fußpunkt auf der Seite ist die Höhe — sie trifft die Seite im rechten Winkel.",
      "Wiederhole das für die anderen beiden Ecken. Alle drei Höhen schneiden sich im Höhenschnittpunkt H.",
    ],
  },
  beide: {
    text: "Seitenhalbierende (violett, Schwerpunkt S) und Höhen (orange, Höhenschnittpunkt H) im Vergleich — beide sind besondere Dreieckslinien, aber ihre Schnittpunkte liegen im Allgemeinen an unterschiedlichen Stellen.",
    steps: [
      "Seitenhalbierende: Eckpunkt mit dem Mittelpunkt der Gegenseite verbinden (Mittelpunkt über zwei gleich große Kreisbögen konstruiert).",
      "Höhe: vom Eckpunkt aus senkrecht auf die Gegenseite (nötigenfalls verlängert) — der Fußpunkt wird über zwei weitere Kreisbögen mit gleichem Radius um zwei Hilfspunkte konstruiert.",
      "Nur beim gleichseitigen Dreieck fallen Schwerpunkt S und Höhenschnittpunkt H zusammen.",
    ],
  },
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

  if (mode === "seiten" || mode === "beide") {
    drawSeitenhalbierende(layerConstruct, layerCenters, A, B, C, showArcs);
    drawSeitenhalbierende(layerConstruct, layerCenters, B, A, C, showArcs);
    drawSeitenhalbierende(layerConstruct, layerCenters, C, A, B, showArcs);
    GS.drawPoint(layerCenters, GC.centroid(A, B, C), "S");
  }
  if (mode === "hoehen" || mode === "beide") {
    drawHoehe(layerConstruct, A, B, C, showArcs);
    drawHoehe(layerConstruct, B, A, C, showArcs);
    drawHoehe(layerConstruct, C, A, B, showArcs);
    GS.drawPoint(layerCenters, GC.orthocenter(A, B, C), "H");
  }
}

function renderInstruction() {
  const info = INSTRUCTIONS[mode];
  instructionBox.innerHTML = `<p>${info.text}</p>`;
  stepsList.innerHTML = info.steps.map((s) => `<li>${s}</li>`).join("");
}

const tri = setupDraggableTriangle(svg, layerVertices, W, H, GC.randomTriangle(W, H), render);
render(tri.pts);
renderInstruction();

toggleArcs.addEventListener("change", () => render(tri.pts));
document.getElementById("btn-new-triangle").addEventListener("click", () => tri.randomize());
lineTabs.addEventListener("click", (e) => {
  const btn = e.target.closest(".geo-mode-tab[data-lines]");
  if (!btn) return;
  mode = btn.dataset.lines;
  [...lineTabs.children].forEach((b) => b.classList.toggle("geo-mode-tab-active", b === btn));
  render(tri.pts);
  renderInstruction();
});
