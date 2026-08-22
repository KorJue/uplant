// Gemeinsame Konstruktionsfunktionen für die vier Dreieck-Seiten (Mittelsenkrechte/Umkreis,
// Winkelhalbierende/Inkreis, Seitenhalbierende, Höhen) — jede Funktion zeichnet sowohl die
// Zirkelbogen-Konstruktion (wenn showArcs) als auch die fertige Linie, exakt berechnet (die Bögen
// dienen nur der Veranschaulichung, nicht der eigentlichen Berechnung).

import * as GC from "./geo-core.js?v=17";
import * as GS from "./geo-svg.js?v=17";

function projT(P, Q, X) {
  const d = GC.sub(Q, P);
  return GC.dot(GC.sub(X, P), d) / GC.dot(d, d);
}

export function drawMittelsenkrechte(layer, W, H, P, Q, showArcs) {
  const r = GC.dist(P, Q) * 0.54;
  if (showArcs) {
    const inter = GC.circleCircleIntersections(P, r, Q, r);
    if (inter.length === 2) {
      GS.drawCompassArc(layer, P, inter[0], r, 24, "geo-arc");
      GS.drawCompassArc(layer, P, inter[1], r, 24, "geo-arc");
      GS.drawCompassArc(layer, Q, inter[0], r, 24, "geo-arc");
      GS.drawCompassArc(layer, Q, inter[1], r, 24, "geo-arc");
    }
  }
  GS.drawLine(layer, GC.mid(P, Q), GC.perp(GC.sub(Q, P)), { w: W, h: H }, "geo-construct geo-mittelsenkrechte");
}

export function drawUmkreis(layerConstruct, layerCenters, A, B, C) {
  const O = GC.circumcenter(A, B, C);
  const R = GC.circumradius(A, B, C);
  if (O && isFinite(R)) {
    GS.drawCircle(layerConstruct, O, R, "geo-circle geo-umkreis");
    GS.drawPoint(layerCenters, O, "M");
  }
  return O;
}

export function drawWinkelhalbierende(layer, W, H, V, P, Q, showArcs) {
  // Der erste Bogen um den Eckpunkt muss deutlich größer sein als eine übliche Winkelmarkierung,
  // sonst liest man ihn als "hier ist der Winkel eingezeichnet" statt als Konstruktionsbogen.
  const r0 = Math.min(GC.dist(V, P), GC.dist(V, Q)) * 0.46;
  const dirP = GC.norm(GC.sub(P, V));
  const dirQ = GC.norm(GC.sub(Q, V));
  const P1 = GC.add(V, GC.scale(dirP, r0));
  const Q1 = GC.add(V, GC.scale(dirQ, r0));
  const bisDir = GC.angleBisectorDir(V, P, Q);
  if (showArcs) {
    const r1 = GC.dist(P1, Q1) * 0.7;
    const angP = GC.angleOf(GC.sub(P1, V));
    const angQ = GC.angleOf(GC.sub(Q1, V));
    GS.drawArcSpan(layer, V, r0, angP, angQ, "geo-arc");
    const cand = GC.circleCircleIntersections(P1, r1, Q1, r1);
    let M = cand[0] || GC.add(V, GC.scale(bisDir, r1));
    if (cand.length === 2) {
      const d0 = GC.dot(GC.sub(cand[0], V), bisDir);
      const d1 = GC.dot(GC.sub(cand[1], V), bisDir);
      M = d0 >= d1 ? cand[0] : cand[1];
    }
    GS.drawCompassArc(layer, P1, M, r1, 26, "geo-arc");
    GS.drawCompassArc(layer, Q1, M, r1, 26, "geo-arc");
    // Wo der erste Bogen die beiden Dreiecksseiten schneidet, sitzen die Einstichpunkte der
    // nächsten beiden Bögen — deutlich markieren.
    GS.drawCross(layer, P1, "geo-schnitt-stark");
    GS.drawCross(layer, Q1, "geo-schnitt-stark");
  }
  GS.drawLine(layer, V, bisDir, { w: W, h: H }, "geo-construct geo-winkelhalbierende");
}

export function drawInkreis(layerConstruct, layerCenters, A, B, C) {
  const I = GC.incenter(A, B, C);
  let radius = null;
  [
    [A, B],
    [B, C],
    [C, A],
  ].forEach(([P, Q]) => {
    const foot = GC.footOfPerpendicular(I, P, Q);
    GS.drawSegment(layerConstruct, I, foot, "geo-tangent");
    GS.drawRightAngleMarker(layerConstruct, foot, I, Q, "geo-tangent");
    GS.drawPoint(layerCenters, foot, "");
    if (radius === null) radius = GC.dist(I, foot);
  });
  GS.drawCircle(layerConstruct, I, radius, "geo-circle geo-inkreis");
  GS.drawPoint(layerCenters, I, "I");
  return I;
}

export function drawSeitenhalbierende(layer, layerCenters, V, P, Q, showArcs) {
  if (showArcs) {
    const r = GC.dist(P, Q) * 0.54;
    const inter = GC.circleCircleIntersections(P, r, Q, r);
    if (inter.length === 2) {
      GS.drawCompassArc(layer, P, inter[0], r, 20, "geo-arc");
      GS.drawCompassArc(layer, P, inter[1], r, 20, "geo-arc");
      GS.drawCompassArc(layer, Q, inter[0], r, 20, "geo-arc");
      GS.drawCompassArc(layer, Q, inter[1], r, 20, "geo-arc");
    }
  }
  const M = GC.mid(P, Q);
  GS.drawPoint(layerCenters, M, "");
  GS.drawSegment(layer, V, M, "geo-construct geo-seitenhalbierende");
}

export function drawHoehe(layer, V, P, Q, showArcs) {
  const foot = GC.footOfPerpendicular(V, P, Q);
  const height = GC.dist(V, foot);
  const dir = GC.norm(GC.sub(Q, P));
  const r = Math.max(height * 1.35, height + 25);
  const half = Math.sqrt(Math.max(0, r * r - height * height));
  const X1 = GC.add(foot, GC.scale(dir, half));
  const X2 = GC.add(foot, GC.scale(dir, -half));

  const tFoot = projT(P, Q, foot);
  const tX1 = projT(P, Q, X1);
  const tX2 = projT(P, Q, X2);
  const tMin = Math.min(0, tFoot, tX1, tX2);
  const tMax = Math.max(1, tFoot, tX1, tX2);
  if (tMin < -0.02 || tMax > 1.02) {
    const d = GC.sub(Q, P);
    GS.drawSegment(layer, GC.add(P, GC.scale(d, tMin)), GC.add(P, GC.scale(d, tMax)), "geo-side-extension");
  }

  if (showArcs) {
    GS.drawCompassArc(layer, V, X1, r, 18, "geo-arc");
    GS.drawCompassArc(layer, V, X2, r, 18, "geo-arc");
    GS.drawCompassArc(layer, X1, V, r, 24, "geo-arc");
    GS.drawCompassArc(layer, X2, V, r, 24, "geo-arc");
    GS.drawCross(layer, X1, "geo-schnitt");
    GS.drawCross(layer, X2, "geo-schnitt");
  }
  GS.drawRightAngleMarker(layer, foot, V, Q, "geo-hoehe");
  GS.drawSegment(layer, V, foot, "geo-construct geo-hoehe");
}
