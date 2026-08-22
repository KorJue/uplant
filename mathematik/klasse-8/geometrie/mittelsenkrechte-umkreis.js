import * as GC from "./geo-core.js?v=14";
import * as GS from "./geo-svg.js?v=14";
import { drawMittelsenkrechte, drawUmkreis } from "./constructions.js?v=14";
import { TRI_TASKS } from "./tri-construct.js?v=14";
import { setupTrianglePage } from "./tri-page.js?v=14";

const W = 600,
  H = 440;

setupTrianglePage({
  W,
  H,
  task: TRI_TASKS.mittelsenkrechte,

  notes: {
    1: "Die Mittelsenkrechte von AB enthält <em>alle</em> Punkte, die von A und von B gleich weit entfernt sind — und nur diese. Ein einzelner solcher Punkt ist damit noch nicht festgelegt: Es ist eine ganze Gerade.",
    2: "Jetzt kommt die Mittelsenkrechte von BC dazu. Ihr Schnittpunkt M ist gleich weit von A und B (erste Gerade) <em>und</em> gleich weit von B und C (zweite Gerade) — also von allen drei Ecken gleich weit entfernt.",
    3: "Weil M schon von A, B und C gleich weit entfernt ist, ist M auch von C und A gleich weit entfernt — die dritte Mittelsenkrechte <em>muss</em> deshalb durch M laufen. Sie liefert keine neue Information. Um M mit dem Abstand zu einem Eckpunkt als Radius liegt der Umkreis: der Kreis durch A, B und C.",
  },

  guidedSteps: [
    "Konstruiere für jede der drei Seiten die Mittelsenkrechte: Zirkel in beide Endpunkte der Seite einstechen (Radius größer als die halbe Seitenlänge) und die beiden Schnittpunkte der Bögen verbinden.",
    "Alle drei Mittelsenkrechten schneiden sich in einem Punkt — dem Umkreismittelpunkt M. (Konstruieren muss man nur zwei davon, die dritte geht automatisch durch M. Als Kontrolle zeichnet man sie trotzdem gern.)",
    "Zirkel in M einstechen, Radius bis zu einem der Eckpunkte einstellen, und den Umkreis durch A, B und C zeichnen.",
    "<strong>Probiere aus:</strong> Ziehe C so, dass das Dreieck stumpfwinklig wird — M wandert aus dem Dreieck heraus. Bei genau einem rechten Winkel liegt M auf der Mitte der längsten Seite: Der Umkreis hat sie dann als Durchmesser (Satz des Thales).",
  ],

  drawStage(layerConstruct, layerCenters, pts, count, showArcs) {
    const { A, B, C } = pts;
    const sides = [
      [A, B],
      [B, C],
      [C, A],
    ];
    for (let i = 0; i < count; i++) drawMittelsenkrechte(layerConstruct, W, H, sides[i][0], sides[i][1], showArcs);
    if (count < 2) return;
    if (count >= 3) {
      drawUmkreis(layerConstruct, layerCenters, A, B, C);
    } else {
      const O = GC.circumcenter(A, B, C);
      if (O) GS.drawPoint(layerCenters, O, "M");
    }
  },
});
