// Visualisierung der Lagebeziehungen als Schrägbild (Kavalierprojektion): x2-Achse nach rechts,
// x3-Achse nach oben, x1-Achse schräg nach vorne-unten (Winkel 135°, Verkürzungsfaktor 0,5) — die
// in deutschen Schulbüchern übliche Handskizzen-Konvention für R^3 auf einer 2D-Fläche. Rein
// dekorativ/anschaulich: alle Berechnungen hier laufen mit normalen Fließkommazahlen, nicht mit
// den exakten Brüchen aus vectors.js — die eigentlichen Rechenwege bleiben davon unberührt.

const VIEW_W = 560;
const VIEW_H = 400;
const K = 0.5 * Math.cos(Math.PI / 4); // Verkürzung + Winkel der x1-Achse im Schrägbild

const COLOR1 = "#2563eb"; // erstes Objekt (blau)
const COLOR2 = "#c2410c"; // zweites Objekt (orange)
const COLOR_RESULT = "#15803d"; // Schnittpunkt/-gerade (grün)
const COLOR_DIST = "#6b7280"; // Abstand/Lot (grau, gestrichelt)

// ---------- kleine 3D-Vektor-Helfer (Fließkomma) ----------

function vAdd(a, b) {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}
function vSub(a, b) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}
function vScale(a, k) {
  return [a[0] * k, a[1] * k, a[2] * k];
}
function vDot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}
function vCross(a, b) {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

export function toNum3(fracVec) {
  return fracVec.map((f) => (typeof f === "number" ? f : f.toNumber()));
}
export function toNumPlane(plane) {
  return {
    s: toNum3(plane.s),
    u: toNum3(plane.u),
    v: toNum3(plane.v),
    n: toNum3(plane.n),
    a: plane.a.toNumber ? plane.a.toNumber() : plane.a,
    b: plane.b.toNumber ? plane.b.toNumber() : plane.b,
    c: plane.c.toNumber ? plane.c.toNumber() : plane.c,
    d: plane.d.toNumber ? plane.d.toNumber() : plane.d,
  };
}

// ---------- Projektion ----------

function project([x1, x2, x3], scale, originX, originY) {
  return [originX + x2 * scale - x1 * scale * K, originY - x3 * scale + x1 * scale * K];
}

function escapeHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ---------- Szenen-Aufbau: Punkte sammeln, passenden Maßstab/Ursprung finden ----------

function axisExtentFor(points3D) {
  let maxAbs = 2;
  for (const p of points3D) {
    for (const c of p) if (Number.isFinite(c)) maxAbs = Math.max(maxAbs, Math.abs(c));
  }
  return Math.ceil(maxAbs) + 1;
}

function computeTransform(points2D, padding = 46) {
  const xs = points2D.map((p) => p[0]);
  const ys = points2D.map((p) => p[1]);
  const minX = Math.min(...xs),
    maxX = Math.max(...xs);
  const minY = Math.min(...ys),
    maxY = Math.max(...ys);
  const spanX = Math.max(maxX - minX, 1);
  const spanY = Math.max(maxY - minY, 1);
  const availW = VIEW_W - 2 * padding;
  const availH = VIEW_H - 2 * padding;
  let scale = Math.min(availW / spanX, availH / spanY);
  scale = Math.max(Math.min(scale, 70), 12);
  return { scale, midX: (minX + maxX) / 2, midY: (minY + maxY) / 2 };
}

// ---------- SVG-Bausteine ----------

function svgLine(p1, p2, color, width = 2, dash = null, marker = null) {
  const dashAttr = dash ? ` stroke-dasharray="${dash}"` : "";
  const markerAttr = marker ? ` marker-end="url(#${marker})"` : "";
  return `<line x1="${p1[0].toFixed(1)}" y1="${p1[1].toFixed(1)}" x2="${p2[0].toFixed(1)}" y2="${p2[1].toFixed(
    1
  )}" stroke="${color}" stroke-width="${width}"${dashAttr}${markerAttr} />`;
}
function svgCircle(p, color, r = 4.5) {
  return `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${r}" fill="${color}" stroke="white" stroke-width="1.2" />`;
}
function svgText(p, text, color, opts = {}) {
  const { dx = 7, dy = -7, size = 13.5, weight = 700, anchor = "start" } = opts;
  return `<text x="${(p[0] + dx).toFixed(1)}" y="${(p[1] + dy).toFixed(1)}" font-size="${size}" fill="${color}" font-style="italic" font-weight="${weight}" text-anchor="${anchor}">${escapeHtml(
    text
  )}</text>`;
}
function svgPolygon(points2D, color) {
  const pts = points2D.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  return `<polygon points="${pts}" fill="${color}" fill-opacity="0.16" stroke="${color}" stroke-width="1.6" />`;
}

function planeQuad(s, u, v, ext) {
  const a = vAdd(vAdd(s, vScale(u, -ext)), vScale(v, -ext));
  const b = vAdd(vAdd(s, vScale(u, ext)), vScale(v, -ext));
  const c = vAdd(vAdd(s, vScale(u, ext)), vScale(v, ext));
  const d = vAdd(vAdd(s, vScale(u, -ext)), vScale(v, ext));
  return [a, b, c, d];
}

// ---------- Fertige Szene aus Primitiven rendern ----------
// prims: Liste von { kind: 'plane'|'line'|'segment'|'point', ... } — je nach kind unten definiert.

function renderScene(allPoints3D, prims) {
  const extent = axisExtentFor(allPoints3D.concat(prims.filter((p) => p.kind === "plane").flatMap((p) => p.corners)));
  const axisPts = [
    [-extent, 0, 0],
    [extent, 0, 0],
    [0, -extent, 0],
    [0, extent, 0],
    [0, 0, -extent],
    [0, 0, extent],
  ];
  const allForFit = allPoints3D.concat(axisPts).concat(prims.filter((p) => p.kind === "plane").flatMap((p) => p.corners));
  const proj0 = allForFit.map((p) => project(p, 1, 0, 0));
  const { scale, midX, midY } = computeTransform(proj0);
  const originX = VIEW_W / 2 - midX * scale;
  const originY = VIEW_H / 2 - midY * scale;
  const P = (p3) => project(p3, scale, originX, originY);

  let out = "";
  out += `<defs>
    <marker id="viz-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="var(--muted)" />
    </marker>
  </defs>`;

  // Achsen
  out += svgLine(P([-extent, 0, 0]), P([extent * 0.15, 0, 0]), "var(--muted)", 1.4);
  out += svgLine(P([0, 0, 0]), P([extent, 0, 0]), "var(--muted)", 1.4, null, "viz-arrow");
  out += svgLine(P([0, -extent, 0]), P([0, extent * 0.15, 0]), "var(--muted)", 1.4);
  out += svgLine(P([0, 0, 0]), P([0, extent, 0]), "var(--muted)", 1.4, null, "viz-arrow");
  out += svgLine(P([0, 0, -extent]), P([0, 0, extent * 0.15]), "var(--muted)", 1.4);
  out += svgLine(P([0, 0, 0]), P([0, 0, extent]), "var(--muted)", 1.4, null, "viz-arrow");
  out += svgText(P([extent, 0, 0]), "x1", "var(--muted)", { weight: 600, dx: 4, dy: 14 });
  out += svgText(P([0, extent, 0]), "x2", "var(--muted)", { weight: 600, dx: 6, dy: -4 });
  out += svgText(P([0, 0, extent]), "x3", "var(--muted)", { weight: 600, dx: -4, dy: -8 });

  // Ebenen zuerst (damit Geraden/Punkte darüber liegen), dann Strecken, dann Geraden, dann Punkte.
  for (const pr of prims) {
    if (pr.kind === "plane") out += svgPolygon(pr.corners.map(P), pr.color);
  }
  for (const pr of prims) {
    if (pr.kind === "segment") out += svgLine(P(pr.p1), P(pr.p2), pr.color, 1.6, pr.dash || "5,4");
  }
  for (const pr of prims) {
    if (pr.kind === "line") {
      out += svgLine(P(pr.p1), P(pr.p2), pr.color, 2.4, null, "viz-arrow");
      out += svgLine(P(pr.p2), P(pr.p1), pr.color, 2.4, null, "viz-arrow");
    }
  }
  for (const pr of prims) {
    if (pr.kind === "point") {
      out += svgCircle(P(pr.p), pr.color, pr.r || 4.5);
      if (pr.label) out += svgText(P(pr.p), pr.label, pr.color);
    }
  }
  for (const pr of prims) {
    if (pr.kind === "plane" && pr.label) {
      const c = pr.corners[2];
      out += svgText(P(c), pr.label, pr.color, { dx: 6, dy: 4 });
    }
    if (pr.kind === "line" && pr.label) {
      out += svgText(P(pr.p2), pr.label, pr.color, { dx: 8, dy: 2 });
    }
  }

  return `<div class="viz-box"><svg viewBox="0 0 ${VIEW_W} ${VIEW_H}" width="100%" height="${VIEW_H}">${out}</svg></div>`;
}

// ---------- Geometrische Hilfsberechnungen für die Zeichnung (Fließkomma, nur fürs Bild) ----------

function closestPointsSkew(s1, u1, s2, u2) {
  const w = vSub(s1, s2);
  const a = vDot(u1, u1),
    b = vDot(u1, u2),
    c = vDot(u2, u2);
  const p = vDot(w, u1),
    q = vDot(w, u2);
  const det = b * b - a * c;
  const t = (p * c - b * q) / det;
  const r = (b * p - a * q) / det;
  return { F1: vAdd(s1, vScale(u1, t)), F2: vAdd(s2, vScale(u2, r)) };
}

function linePlaneIntersection(s, u, plane) {
  const t = (plane.d - vDot(plane.n, s)) / vDot(plane.n, u);
  return vAdd(s, vScale(u, t));
}

function planePlaneIntersectionPoint(E1, E2, dir) {
  const solve2 = (a1, b1, c1, a2, b2, c2) => {
    const det = a1 * b2 - a2 * b1;
    return [(c1 * b2 - c2 * b1) / det, (a1 * c2 - a2 * c1) / det];
  };
  if (Math.abs(dir[0]) > 1e-9) {
    const [x2, x3] = solve2(E1.b, E1.c, E1.d, E2.b, E2.c, E2.d);
    return [0, x2, x3];
  }
  if (Math.abs(dir[1]) > 1e-9) {
    const [x1, x3] = solve2(E1.a, E1.c, E1.d, E2.a, E2.c, E2.d);
    return [x1, 0, x3];
  }
  const [x1, x2] = solve2(E1.a, E1.b, E1.d, E2.a, E2.b, E2.d);
  return [x1, x2, 0];
}

// ---------- Szenen je Kombination ----------

export function scenePointPoint(P, Q, result) {
  const prims = [
    { kind: "point", p: P, label: "P", color: COLOR1 },
    { kind: "point", p: Q, label: "Q", color: COLOR2 },
  ];
  if (result.relation !== "identisch") {
    prims.push({ kind: "segment", p1: P, p2: Q, color: COLOR_DIST });
  }
  return renderScene([P, Q], prims);
}

export function scenePointLine(P, s, u, result) {
  const ext = 2.2;
  const g1 = vSub(s, vScale(u, ext));
  const g2 = vAdd(s, vScale(u, ext));
  const prims = [
    { kind: "line", p1: g1, p2: g2, label: "g", color: COLOR2 },
    { kind: "point", p: P, label: "P", color: COLOR1 },
  ];
  const pts = [P, s, g1, g2];
  if (result.relation !== "liegt_auf") {
    const t = vDot(vSub(P, s), u) / vDot(u, u);
    const foot = vAdd(s, vScale(u, t));
    prims.push({ kind: "segment", p1: P, p2: foot, color: COLOR_DIST });
    prims.push({ kind: "point", p: foot, color: COLOR_DIST, r: 3 });
    pts.push(foot);
  }
  return renderScene(pts, prims);
}

export function scenePointPlane(P, plane, result) {
  const corners = planeQuad(plane.s, plane.u, plane.v, 1.8);
  const prims = [
    { kind: "plane", corners, label: "E", color: COLOR2 },
    { kind: "point", p: P, label: "P", color: COLOR1 },
  ];
  const pts = [P, ...corners];
  if (result.relation !== "liegt_in") {
    const t = (vDot(plane.n, P) - vDot(plane.n, plane.s)) / vDot(plane.n, plane.n);
    const foot = vSub(P, vScale(plane.n, t));
    prims.push({ kind: "segment", p1: P, p2: foot, color: COLOR_DIST });
    prims.push({ kind: "point", p: foot, color: COLOR_DIST, r: 3 });
    pts.push(foot);
  }
  return renderScene(pts, prims);
}

export function sceneLineLine(s1, u1, s2, u2, result) {
  const ext = 2.2;
  const g1a = vSub(s1, vScale(u1, ext)),
    g1b = vAdd(s1, vScale(u1, ext));
  const h1a = vSub(s2, vScale(u2, ext)),
    h1b = vAdd(s2, vScale(u2, ext));
  const prims = [
    { kind: "line", p1: g1a, p2: g1b, label: "g", color: COLOR1 },
    { kind: "line", p1: h1a, p2: h1b, label: "h", color: COLOR2 },
  ];
  const pts = [g1a, g1b, h1a, h1b];
  if (result.relation === "schneidend") {
    const { F1 } = closestPointsSkew(s1, u1, s2, u2); // bei schneidend gilt F1 = F2 = Schnittpunkt
    prims.push({ kind: "point", p: F1, label: "S", color: COLOR_RESULT });
    pts.push(F1);
  } else if (result.relation === "windschief") {
    const { F1, F2 } = closestPointsSkew(s1, u1, s2, u2);
    prims.push({ kind: "segment", p1: F1, p2: F2, color: COLOR_DIST });
    prims.push({ kind: "point", p: F1, color: COLOR_DIST, r: 3 });
    prims.push({ kind: "point", p: F2, color: COLOR_DIST, r: 3 });
    pts.push(F1, F2);
  }
  return renderScene(pts, prims);
}

export function sceneLinePlane(s, u, plane, result) {
  const ext = 2.2;
  const g1 = vSub(s, vScale(u, ext)),
    g2 = vAdd(s, vScale(u, ext));
  const corners = planeQuad(plane.s, plane.u, plane.v, 1.8);
  const prims = [
    { kind: "plane", corners, label: "E", color: COLOR2 },
    { kind: "line", p1: g1, p2: g2, label: "g", color: COLOR1 },
  ];
  const pts = [g1, g2, ...corners];
  if (result.relation === "schneidend") {
    const S = linePlaneIntersection(s, u, plane);
    prims.push({ kind: "point", p: S, label: "S", color: COLOR_RESULT });
    pts.push(S);
  }
  return renderScene(pts, prims);
}

export function scenePlanePlane(E1, E2, result) {
  const c1 = planeQuad(E1.s, E1.u, E1.v, 1.8);
  const c2 = planeQuad(E2.s, E2.u, E2.v, 1.8);
  const prims = [
    { kind: "plane", corners: c1, label: "E1", color: COLOR1 },
    { kind: "plane", corners: c2, label: "E2", color: COLOR2 },
  ];
  let pts = [...c1, ...c2];
  if (result.relation === "schneidend") {
    const dir = vCross(E1.n, E2.n);
    const p0 = planePlaneIntersectionPoint(E1, E2, dir);
    const ext = 2.2;
    const l1 = vSub(p0, vScale(dir, ext)),
      l2 = vAdd(p0, vScale(dir, ext));
    prims.push({ kind: "line", p1: l1, p2: l2, label: "h", color: COLOR_RESULT });
    pts.push(l1, l2);
  }
  return renderScene(pts, prims);
}
