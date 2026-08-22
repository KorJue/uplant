import * as GC from "./geo-core.js?v=16";
import * as GS from "./geo-svg.js?v=16";
import { drawWinkelhalbierende, drawInkreis } from "./constructions.js?v=16";
import { TRI_TASKS } from "./tri-construct.js?v=16";
import { setupTrianglePage } from "./tri-page.js?v=16";

const W = 600,
  H = 440;

setupTrianglePage({
  W,
  H,
  task: TRI_TASKS.winkelhalbierende,

  notes: {
    1: "Die Winkelhalbierende bei A enthält <em>alle</em> Punkte, die von den beiden Seiten AB und AC gleich weit entfernt sind — und nur diese. Gemessen wird der Abstand dabei immer senkrecht, also über das Lot.",
    2: "Mit der Winkelhalbierenden bei B kommt eine zweite Bedingung dazu. Ihr Schnittpunkt I ist von AB und AC gleich weit entfernt <em>und</em> von AB und BC — also von allen drei Seiten gleich weit.",
    3: "Weil I schon von allen drei Seiten gleich weit entfernt ist, <em>muss</em> auch die dritte Winkelhalbierende durch I laufen. Dieser gemeinsame Abstand ist der Inkreisradius: Er wird als Lot von I auf eine Seite konstruiert, und genau in diesem Fußpunkt berührt der Inkreis die Seite.",
  },

  guidedSteps: [
    "Konstruiere für zwei der drei Innenwinkel die Winkelhalbierende: Zirkel in den Scheitelpunkt einstechen, Bogen über beide Schenkel zeichnen, dann von den beiden neuen Schnittpunkten aus mit gleichem Radius zwei Bögen zeichnen, die sich kreuzen, und den Scheitelpunkt mit diesem Kreuzungspunkt verbinden.",
    "Die Winkelhalbierenden schneiden sich in einem Punkt — dem Inkreismittelpunkt I. Die dritte muss automatisch durch I gehen und dient nur noch als Kontrolle.",
    "Fälle von I aus das Lot auf eine der drei Seiten (rechter Winkel am Fußpunkt). Die Strecke von I bis zum Fußpunkt ist der Radius — an diesem Fußpunkt berührt der Kreis die Seite (Tangentenpunkt).",
    "Zeichne mit diesem Radius um I den Inkreis. Er berührt automatisch auch die beiden anderen Seiten, denn I ist von allen dreien gleich weit entfernt.",
    "<strong>Probiere aus:</strong> Ziehe die Eckpunkte, so weit du willst — I bleibt <em>immer</em> im Inneren des Dreiecks. Anders als M und H kann der Inkreismittelpunkt gar nicht herauswandern, weil jede Winkelhalbierende im Dreieck verläuft.",
  ],

  drawStage(layerConstruct, layerCenters, pts, count, showArcs) {
    const { A, B, C } = pts;
    const vertices = [
      [A, B, C],
      [B, A, C],
      [C, A, B],
    ];
    for (let i = 0; i < count; i++) drawWinkelhalbierende(layerConstruct, W, H, vertices[i][0], vertices[i][1], vertices[i][2], showArcs);
    if (count >= 3) drawInkreis(layerConstruct, layerCenters, A, B, C);
    else if (count === 2) GS.drawPoint(layerCenters, GC.incenter(A, B, C), "I");
  },
});
