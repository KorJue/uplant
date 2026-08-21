// Geometrische Grundfunktionen für die interaktiven Konstruktionen (Klasse 8, Geometrie).
// Arbeitet mit einfachen {x, y}-Punkten und Fließkommazahlen (SVG-Koordinaten) — anders als die
// MSS-Werkzeuge, die exakte Bruchrechnung brauchen, reicht hier Bildschirmgenauigkeit.

export function pt(x, y) {
  return { x, y };
}
export function dist(a, b) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}
export function mid(a, b) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}
export function add(a, b) {
  return { x: a.x + b.x, y: a.y + b.y };
}
export function sub(a, b) {
  return { x: a.x - b.x, y: a.y - b.y };
}
export function scale(a, k) {
  return { x: a.x * k, y: a.y * k };
}
export function len(v) {
  return Math.hypot(v.x, v.y);
}
export function norm(v) {
  const l = len(v) || 1;
  return { x: v.x / l, y: v.y / l };
}
// 90°-Drehung (mathematisch positiv, in SVG-Koordinaten mit y nach unten also "im Uhrzeigersinn").
export function perp(v) {
  return { x: -v.y, y: v.x };
}
export function dot(a, b) {
  return a.x * b.x + a.y * b.y;
}
// Signierte Fläche × 2 — Vorzeichen zeigt den Umlaufsinn (positiv = im mathem. Sinn gegen den
// Uhrzeigersinn, in SVG-Koordinaten mit y nach unten also im Uhrzeigersinn).
export function cross2(a, b, c) {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}
export function angleOf(v) {
  return (Math.atan2(v.y, v.x) * 180) / Math.PI;
}

// Schnittpunkt zweier Geraden, je durch einen Punkt und einen Richtungsvektor gegeben.
// null, wenn die Geraden parallel sind.
export function lineIntersection(p1, d1, p2, d2) {
  const denom = d1.x * d2.y - d1.y * d2.x;
  if (Math.abs(denom) < 1e-9) return null;
  const t = ((p2.x - p1.x) * d2.y - (p2.y - p1.y) * d2.x) / denom;
  return add(p1, scale(d1, t));
}

// Lotfußpunkt von P auf die Gerade durch A und B.
export function footOfPerpendicular(p, a, b) {
  const ab = sub(b, a);
  const t = dot(sub(p, a), ab) / dot(ab, ab);
  return add(a, scale(ab, t));
}

// Schnittpunkte zweier Kreise (Mittelpunkt + Radius) — [], [p] (Berührpunkt) oder [p1, p2].
export function circleCircleIntersections(c1, r1, c2, r2) {
  const d = dist(c1, c2);
  if (d < 1e-9) return [];
  if (d > r1 + r2 + 1e-6) return [];
  if (d < Math.abs(r1 - r2) - 1e-6) return [];
  const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
  const h2 = Math.max(0, r1 * r1 - a * a);
  const h = Math.sqrt(h2);
  const dir = scale(sub(c2, c1), 1 / d);
  const pm = add(c1, scale(dir, a));
  const perpDir = perp(dir);
  if (h < 1e-6) return [pm];
  return [add(pm, scale(perpDir, h)), add(pm, scale(perpDir, -h))];
}

// Schnittpunkte eines Kreises mit der Geraden durch A und B — [], [p] (Tangente) oder [p1, p2].
// Wird beim Lot-Fällen (Höhe) gebraucht: der Kreis um den Eckpunkt schneidet die Gegenseite in
// zwei Punkten, die als Mittelpunkte der beiden nächsten Kreisbögen dienen.
export function circleLineIntersections(center, r, A, B) {
  const d = sub(B, A);
  const f = footOfPerpendicular(center, A, B);
  const h2 = r * r - squaredDist(center, f);
  if (h2 < -1e-9) return [];
  const dir = norm(d);
  if (Math.abs(h2) < 1e-9) return [f];
  const h = Math.sqrt(h2);
  return [add(f, scale(dir, h)), add(f, scale(dir, -h))];
}

function squaredDist(a, b) {
  const dx = b.x - a.x,
    dy = b.y - a.y;
  return dx * dx + dy * dy;
}

export function angleAt(vertex, a, b) {
  const v1 = norm(sub(a, vertex));
  const v2 = norm(sub(b, vertex));
  return Math.acos(Math.max(-1, Math.min(1, dot(v1, v2))));
}
export function angleAtDeg(vertex, a, b) {
  return (angleAt(vertex, a, b) * 180) / Math.PI;
}

// Halbierender Richtungsvektor des Winkels a-vertex-b (normiert; zeigt ins Innere des Winkels).
export function angleBisectorDir(vertex, a, b) {
  const v1 = norm(sub(a, vertex));
  const v2 = norm(sub(b, vertex));
  const s = add(v1, v2);
  return norm(s);
}

// ---------- Dreieckszentren ----------

export function triArea(A, B, C) {
  return Math.abs(cross2(A, B, C)) / 2;
}
export function circumcenter(A, B, C) {
  return lineIntersection(mid(A, B), perp(sub(B, A)), mid(A, C), perp(sub(C, A)));
}
export function circumradius(A, B, C) {
  const O = circumcenter(A, B, C);
  return O ? dist(O, A) : NaN;
}
export function centroid(A, B, C) {
  return scale(add(add(A, B), C), 1 / 3);
}
export function incenter(A, B, C) {
  const a = dist(B, C),
    b = dist(A, C),
    c = dist(A, B);
  const s = a + b + c;
  return scale(add(add(scale(A, a), scale(B, b)), scale(C, c)), 1 / s);
}
export function inradius(A, B, C) {
  const a = dist(B, C),
    b = dist(A, C),
    c = dist(A, B);
  const s = (a + b + c) / 2;
  return triArea(A, B, C) / s;
}
// Höhenschnittpunkt über die Euler-Geraden-Beziehung H = A + B + C − 2·O (spart eine eigene
// Höhenschnitt-Berechnung, ist aber exakt dasselbe Ergebnis).
export function orthocenter(A, B, C) {
  const O = circumcenter(A, B, C);
  return sub(add(add(A, B), C), scale(O, 2));
}

// Feuerbachkreis (Neunpunktekreis): Mittelpunkt ist der Mittelpunkt der Strecke zwischen
// Umkreismittelpunkt und Höhenschnittpunkt, sein Radius die Hälfte des Umkreisradius. Er verläuft
// durch die drei Seitenmitten, die drei Höhenfußpunkte und die drei Mittelpunkte der oberen
// Höhenabschnitte.
export function ninePointCircle(A, B, C) {
  const O = circumcenter(A, B, C);
  if (!O) return null;
  const Hp = orthocenter(A, B, C);
  return { center: mid(O, Hp), radius: circumradius(A, B, C) / 2 };
}

// ---------- Zufällige Dreiecke/Strecken/Winkel für Aufgaben ----------

function randIn(min, max) {
  return min + Math.random() * (max - min);
}

// Liefert ein zufälliges, "gutartiges" Dreieck innerhalb der gegebenen Box: keine zu spitzen
// Winkel (< 25°) und keine zu kleine Fläche, damit Konstruktionen gut lesbar bleiben.
export function randomTriangle(w, h, margin = 60) {
  for (let tries = 0; tries < 200; tries++) {
    const A = pt(randIn(margin, w - margin), randIn(margin, h - margin));
    const B = pt(randIn(margin, w - margin), randIn(margin, h - margin));
    const C = pt(randIn(margin, w - margin), randIn(margin, h - margin));
    const angles = [angleAtDeg(A, B, C), angleAtDeg(B, A, C), angleAtDeg(C, A, B)];
    if (angles.some((a) => a < 25 || isNaN(a))) continue;
    if (triArea(A, B, C) < (w * h) / 20) continue;
    return { A, B, C };
  }
  // Fallback: festes, garantiert gutartiges Dreieck.
  return { A: pt(w * 0.2, h * 0.75), B: pt(w * 0.8, h * 0.75), C: pt(w * 0.5, h * 0.2) };
}

// Dreieck für die Höhen-Aufgabe: zusätzlich zur allgemeinen "Gutartigkeit" müssen die Winkel bei A
// und B spitz genug sein, damit der Höhenfußpunkt von C deutlich innerhalb der Strecke AB liegt —
// sonst müsste die Seite verlängert werden, was in der Grundkonstruktion unnötig verwirrt.
export function randomTriangleForHeight(w, h, margin = 70) {
  for (let tries = 0; tries < 300; tries++) {
    const t = randomTriangle(w, h, margin);
    const { A, B, C } = t;
    if (angleAtDeg(A, B, C) > 80 || angleAtDeg(B, A, C) > 80) continue;
    if (dist(A, B) < 150) continue;
    const foot = footOfPerpendicular(C, A, B);
    if (dist(C, foot) < 70) continue;
    return t;
  }
  return { A: pt(w * 0.2, h * 0.78), B: pt(w * 0.8, h * 0.78), C: pt(w * 0.5, h * 0.22) };
}

// Dreieck für die Seitenhalbierenden-Aufgabe: die Seite AB soll lang genug sein, damit sich ihr
// Mittelpunkt bequem konstruieren lässt.
export function randomTriangleForMedian(w, h, margin = 70) {
  for (let tries = 0; tries < 300; tries++) {
    const t = randomTriangle(w, h, margin);
    if (dist(t.A, t.B) < 170) continue;
    if (dist(t.C, footOfPerpendicular(t.C, t.A, t.B)) < 70) continue;
    return t;
  }
  return { A: pt(w * 0.18, h * 0.78), B: pt(w * 0.82, h * 0.78), C: pt(w * 0.55, h * 0.2) };
}

export function randomSegment(w, h, margin = 70, minLen = 140) {
  for (let tries = 0; tries < 200; tries++) {
    const A = pt(randIn(margin, w - margin), randIn(margin, h - margin));
    const B = pt(randIn(margin, w - margin), randIn(margin, h - margin));
    if (dist(A, B) >= minLen) return { A, B };
  }
  return { A: pt(w * 0.25, h * 0.5), B: pt(w * 0.75, h * 0.5) };
}

// Zufälliger Winkel: Scheitel S, zwei Schenkelpunkte P, Q, Öffnungswinkel zwischen 35° und 145°.
export function randomAngle(w, h, margin = 90) {
  for (let tries = 0; tries < 200; tries++) {
    const S = pt(randIn(margin, w - margin), randIn(margin, h - margin));
    const a1 = randIn(0, 360);
    const opening = randIn(35, 145);
    const a2 = a1 + opening * (Math.random() < 0.5 ? 1 : -1);
    const r1 = randIn(110, 160);
    const r2 = randIn(110, 160);
    const P = add(S, { x: r1 * Math.cos((a1 * Math.PI) / 180), y: r1 * Math.sin((a1 * Math.PI) / 180) });
    const Q = add(S, { x: r2 * Math.cos((a2 * Math.PI) / 180), y: r2 * Math.sin((a2 * Math.PI) / 180) });
    if (P.x < 20 || P.x > w - 20 || P.y < 20 || P.y > h - 20) continue;
    if (Q.x < 20 || Q.x > w - 20 || Q.y < 20 || Q.y > h - 20) continue;
    return { S, P, Q };
  }
  return { S: pt(w * 0.3, h * 0.6), P: pt(w * 0.3 + 140, h * 0.6), Q: pt(w * 0.3, h * 0.6 - 140) };
}

// Hält einen Punkt innerhalb einer rechteckigen Box (für das Ziehen von Dreieckspunkten).
export function clampToBox(p, w, h, margin = 20) {
  return { x: Math.min(w - margin, Math.max(margin, p.x)), y: Math.min(h - margin, Math.max(margin, p.y)) };
}
