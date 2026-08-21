// Gemeinsame Hilfsfunktionen für die Prüfung des freien Konstruierens mit Zirkel und Lineal.
// Verwendet von mittelsenkrechte-umkreis.js und winkelhalbierende-inkreis.js (grundkonstruktionen.js
// hat wegen der aufgabenspezifischen Sonderfälle — z. B. gesperrte Schenkelpunkte — eigene Kopien).

import { norm, sub, add, cross2, circleCircleIntersections } from "./geo-core.js?v=9";

// Prüft, ob eine vom Nutzer gezogene Gerade durch zwei vorgegebene Punkte verläuft. Verglichen wird
// der senkrechte Abstand beider Punkte zur Geraden (Kreuzprodukt mit normierter Richtung).
export function lineThroughBoth(l, p1, p2, tol = 12) {
  const d = norm(sub(l.b, l.a));
  const b = add(l.a, d);
  const distToLine = (p) => Math.abs(cross2(l.a, b, p));
  return distToLine(p1) < tol && distToLine(p2) < tol;
}

// Zwei Kreise "mit demselben Radius" — bei Klickgenauigkeit am Bildschirm mit etwas Spielraum.
export function sameRadius(c1, c2, tol = 0.08) {
  return Math.abs(c1.radius - c2.radius) / Math.max(c1.radius, c2.radius) <= tol;
}

// Die beiden Schnittpunkte der zwei gleich großen Kreise um P und Q (mit gemitteltem Radius, damit
// kleine Klickungenauigkeiten nicht zu einer schiefen Verbindungsgeraden führen).
export function twoArcIntersections(P, Q, c1, c2) {
  const r = (c1.radius + c2.radius) / 2;
  return circleCircleIntersections(P, r, Q, r);
}

// Alle paarweisen Schnittpunkte der bisher vom Nutzer gezeichneten Kreise — dienen als Einrast- und
// Markierungspunkte für die eigene Konstruktion.
export function circlesIntersections(circles) {
  const out = [];
  for (let i = 0; i < circles.length; i++) {
    for (let j = i + 1; j < circles.length; j++) {
      out.push(...circleCircleIntersections(circles[i].center, circles[i].radius, circles[j].center, circles[j].radius));
    }
  }
  return out;
}
