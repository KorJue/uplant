// Gemeinsame Logik für die vier Dreieck-Seiten: ziehbare Eckpunkte A, B, C mit Begrenzung auf die
// Zeichenfläche, plus "Neues Dreieck"-Zufallsfunktion. Die eigentliche Konstruktion (Mittelsenk-
// rechte/Umkreis, Winkelhalbierende/Inkreis, ...) rendert jede Seite selbst über den onUpdate-
// Callback, der bei jeder Änderung (Ziehen oder neues Dreieck) aufgerufen wird.

import { clampToBox, randomTriangle } from "./geo-core.js?v=11";
import { drawDraggablePoint } from "./geo-svg.js?v=11";

export function setupDraggableTriangle(svg, layer, W, H, initial, onUpdate) {
  const pts = { A: initial.A, B: initial.B, C: initial.C };
  const handles = {};
  const state = { locked: false };
  ["A", "B", "C"].forEach((key) => {
    handles[key] = drawDraggablePoint(svg, layer, pts[key], key, (x, y, handle) => {
      // Gesperrt während des freien Konstruierens: die eigene Zeichnung (Kreise/Geraden) bezieht
      // sich auf die aktuellen Eckpunkte — verschöben die sich nebenbei, würde die Konstruktion
      // sofort ungültig, ohne dass der Schüler das bemerkt.
      if (state.locked) return;
      pts[key] = clampToBox({ x, y }, W, H);
      handle.update(pts[key]);
      onUpdate(pts);
    });
  });
  return {
    pts,
    handles,
    setLocked(locked) {
      state.locked = locked;
      Object.values(handles).forEach((h) => h.g.classList.toggle("geo-point-locked", locked));
    },
    randomize() {
      const t = randomTriangle(W, H);
      pts.A = t.A;
      pts.B = t.B;
      pts.C = t.C;
      handles.A.update(pts.A);
      handles.B.update(pts.B);
      handles.C.update(pts.C);
      onUpdate(pts);
    },
  };
}
