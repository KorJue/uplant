// Gemeinsame Hilfsfunktionen für die Prüfung des freien Konstruierens mit Zirkel und Lineal —
// verwendet von grundkonstruktionen.js (einzelne Linien), tri-construct.js (ganzes Dreieck) und
// free-ui.js (Markierung der Schnittpunkte).

import { norm, sub, add, cross2, circleCircleIntersections } from "./geo-core.js?v=13";

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

// Alle paarweisen Schnittpunkte der bisher vom Nutzer gezeichneten Kreise. Beim Einrasten wird
// bewusst großzügig verfahren: Auch ein ungewöhnlicher, aber gültiger Konstruktionsweg soll
// funktionieren — worauf es ankommt, entscheidet am Ende die Prüfung.
export function circlesIntersections(circles) {
  const out = [];
  for (let i = 0; i < circles.length; i++) {
    for (let j = i + 1; j < circles.length; j++) {
      out.push(...circleCircleIntersections(circles[i].center, circles[i].radius, circles[j].center, circles[j].radius));
    }
  }
  return out;
}

// Nur die Schnittpunkte gleich großer Kreise — und nur diese werden als Kreuz markiert. In allen
// Konstruktionen hier entsteht jeder gesuchte Punkt aus zwei Zirkelschlägen mit demselben Radius
// (das ist ja gerade der Trick). Kreuzungen verschieden großer Kreise sind dagegen bedeutungslos:
// Bei neun Kreisen am Dreieck kämen so über hundert Kreuze zusammen und die Zeichnung wäre nicht
// mehr lesbar.
export function pairedIntersections(circles) {
  const out = [];
  for (let i = 0; i < circles.length; i++) {
    for (let j = i + 1; j < circles.length; j++) {
      if (!sameRadius(circles[i], circles[j])) continue;
      out.push(...circleCircleIntersections(circles[i].center, circles[i].radius, circles[j].center, circles[j].radius));
    }
  }
  return out;
}
