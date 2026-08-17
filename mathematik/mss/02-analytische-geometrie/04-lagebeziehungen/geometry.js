// Lagebeziehungen zwischen Punkten, Geraden und Ebenen im R^3 — Klassifikation, Kennwerte
// (Schnittpunkt/-gerade, Schnittwinkel, Abstand) und zwei bis drei vollständig ausformulierte
// Lösungswege je Fall.

import {
  F,
  vec3,
  vAdd,
  vSub,
  vScale,
  dot,
  cross,
  isZeroVec,
  vEquals,
  scalarTriple,
  isParallel,
  squaredLength,
} from "./vectors.js?v=9";
import * as N from "./notation.js?v=9";

function T(html) {
  return { kind: "text", html };
}
function E(html) {
  return { kind: "eq", html };
}

// Schnittwinkel zwischen zwei Vektoren über cos φ = |a·b| / (|a||b|) — der Betrag im Zähler
// sorgt dafür, dass immer der spitze Winkel (0°–90°) zwischen den Geraden/Ebenen herauskommt,
// unabhängig von der zufälligen Orientierung der Richtungs-/Normalenvektoren. Da Wurzel und
// Arkuskosinus algebraisch nicht exakt sind, wird hier (anders als sonst auf der Seite) mit
// Fließkommazahlen gerechnet, wie auch schon bei Abstandsangaben.
function angleDegCos(a, b) {
  const cosPhi = Math.abs(dot(a, b).toNumber()) / (Math.sqrt(squaredLength(a).toNumber()) * Math.sqrt(squaredLength(b).toNumber()));
  return (Math.acos(Math.max(-1, Math.min(1, cosPhi))) * 180) / Math.PI;
}
// Schnittwinkel zwischen Gerade und Ebene über sin φ = |u·n| / (|u||n|) (Winkel zwischen
// Richtungs- und Normalenvektor ist der Komplementwinkel zum eigentlichen Schnittwinkel).
function angleDegSin(a, b) {
  const sinPhi = Math.abs(dot(a, b).toNumber()) / (Math.sqrt(squaredLength(a).toNumber()) * Math.sqrt(squaredLength(b).toNumber()));
  return (Math.asin(Math.max(-1, Math.min(1, sinPhi))) * 180) / Math.PI;
}

// ---------- Ebene: Formumwandlungen ----------
// Ein "Plane"-Objekt trägt immer alle drei Formen gleichzeitig (Parameter-, Koordinaten- und
// Normalenform), unabhängig davon, in welcher Form die Ebene ursprünglich eingegeben wurde.

function directionsForNormal(n) {
  const u = !n[0].isZero() || !n[1].isZero() ? vec3(n[1].neg(), n[0], 0) : vec3(1, 0, 0);
  const v = cross(n, u);
  return { u, v };
}

export function planeFromParam(s, u, v) {
  const n = cross(u, v);
  if (isZeroVec(n)) {
    throw new Error("Die beiden Richtungsvektoren der Ebene sind parallel (Kreuzprodukt = Nullvektor) — das legt keine Ebene fest.");
  }
  const d = dot(n, s);
  return { s, u, v, n, a: n[0], b: n[1], c: n[2], d };
}

export function planeFromCoord(a, b, c, d) {
  a = F(a);
  b = F(b);
  c = F(c);
  d = F(d);
  const n = [a, b, c];
  if (isZeroVec(n)) throw new Error("a = b = c = 0 beschreibt keine Ebene.");
  let s;
  if (!a.isZero()) s = vec3(d.div(a), 0, 0);
  else if (!b.isZero()) s = vec3(0, d.div(b), 0);
  else s = vec3(0, 0, d.div(c));
  const { u, v } = directionsForNormal(n);
  return { s, u, v, n, a, b, c, d };
}

export function planeFromNormal(s, n) {
  if (isZeroVec(n)) throw new Error("Der Normalenvektor darf nicht der Nullvektor sein.");
  const d = dot(n, s);
  const { u, v } = directionsForNormal(n);
  return { s, u, v, n, a: n[0], b: n[1], c: n[2], d };
}

// ---------- kleine lineare Gleichungssysteme ----------

// Löst x*colA + y*colB = rhs (3 Gleichungen, 2 Unbekannte) über ein Paar mit nichtverschwindender
// Determinante; gibt zusätzlich zurück, welche beiden Zeilen benutzt wurden (für die Probe an der
// dritten Zeile).
function solveLinear2x2(colA, colB, rhs) {
  const pairs = [
    [0, 1],
    [0, 2],
    [1, 2],
  ];
  for (const [i, j] of pairs) {
    const det = colA[i].mul(colB[j]).sub(colA[j].mul(colB[i]));
    if (!det.isZero()) {
      const x = rhs[i].mul(colB[j]).sub(rhs[j].mul(colB[i])).div(det);
      const y = colA[i].mul(rhs[j]).sub(colA[j].mul(rhs[i])).div(det);
      return { x, y, i, j };
    }
  }
  return null;
}

function solve2x2Raw(a1, b1, c1, a2, b2, c2) {
  const det = a1.mul(b2).sub(a2.mul(b1));
  const x = c1.mul(b2).sub(c2.mul(b1)).div(det);
  const y = a1.mul(c2).sub(a2.mul(c1)).div(det);
  return { x, y };
}

// Findet einen Punkt auf der Schnittgeraden zweier Ebenen, gegeben deren (bereits bekannten,
// nicht-Null-) Richtungsvektor. Nutzt aus, dass genau die Komponente des Richtungsvektors, die
// ungleich 0 ist, angibt, welche Koordinate man gefahrlos auf 0 setzen darf.
function intersectionPointOfPlanes(E1, E2, direction) {
  if (!direction[0].isZero()) {
    const { x: x2, y: x3 } = solve2x2Raw(E1.b, E1.c, E1.d, E2.b, E2.c, E2.d);
    return vec3(0, x2, x3);
  }
  if (!direction[1].isZero()) {
    const { x: x1, y: x3 } = solve2x2Raw(E1.a, E1.c, E1.d, E2.a, E2.c, E2.d);
    return vec3(x1, 0, x3);
  }
  const { x: x1, y: x2 } = solve2x2Raw(E1.a, E1.b, E1.d, E2.a, E2.b, E2.d);
  return vec3(x1, x2, 0);
}

function eliminateVariable(E1, E2) {
  const c1 = [E1.a, E1.b, E1.c];
  const c2 = [E2.a, E2.b, E2.c];
  for (let idx = 0; idx < 3; idx++) {
    const p = c1[idx],
      q = c2[idx];
    if (p.isZero() && q.isZero()) continue;
    const coeffs = [0, 1, 2].map((i) => q.mul(c1[i]).sub(p.mul(c2[i])));
    const d = q.mul(E1.d).sub(p.mul(E2.d));
    return { idx, lambda: q, mu: p.neg(), coeffs, d };
  }
  return null;
}

const VN = [N.X1, N.X2, N.X3];

// ---------- 1. Punkt – Punkt ----------

export function pointPoint(P, Q) {
  const same = vEquals(P, Q);
  const stepsA = [
    T(`<strong>Verfahren 1 (Koordinatenvergleich):</strong> Zwei Punkte sind identisch, wenn sie in allen drei Koordinaten übereinstimmen.`),
    E(
      [0, 1, 2]
        .map((i) => `${VN[i]}: ${N.fmt(P[i])} ${P[i].equals(Q[i]) ? "=" : "≠"} ${N.fmt(Q[i])}`)
        .join("<br>")
    ),
    T(same ? "Alle drei Koordinaten stimmen überein." : "Mindestens eine Koordinate stimmt nicht überein."),
  ];

  const diff = vSub(Q, P);
  const stepsB = [
    T(`<strong>Verfahren 2 (Verbindungsvektor):</strong> Die Punkte sind identisch genau dann, wenn der Verbindungsvektor ${N.vecArrow("PQ")} der Nullvektor ist.`),
    E(`${N.vecArrow("PQ")} = Q − P = ${N.vecColFromFractions(diff)}`),
    T(same ? "Der Verbindungsvektor ist der Nullvektor." : "Der Verbindungsvektor ist nicht der Nullvektor."),
  ];

  const extras = [];
  if (!same) {
    const distSq = squaredLength(diff);
    extras.push({ label: "Abstand", value: `d(P,Q) = |${N.vecArrow("PQ")}| = √${distSq.toString()} ≈ ${N.fmtApprox(Math.sqrt(distSq.toNumber()))} LE` });
  }

  return {
    relation: same ? "identisch" : "verschieden",
    relationLabel: same ? "Die Punkte P und Q sind identisch." : "Die Punkte P und Q sind verschieden.",
    methods: [
      { title: "Verfahren 1: Koordinatenvergleich", steps: stepsA },
      { title: "Verfahren 2: Verbindungsvektor", steps: stepsB },
    ],
    extras,
  };
}

// ---------- 2. Punkt – Gerade ----------

export function pointLine(P, s, u) {
  const w = vSub(P, s);
  const idx0 = [0, 1, 2].find((i) => !u[i].isZero());
  const stepsA = [T(`<strong>Verfahren 1 (LGS über die Koordinatengleichungen):</strong> Liegt P auf g, muss es ein r geben mit P = ${N.vecArrow("s")} + r·${N.vecArrow("v")}.`)];
  stepsA.push(E([0, 1, 2].map((i) => `${["I", "II", "III"][i]}: ${N.fmt(P[i])} = ${N.fmt(s[i])} + r·${N.fmt(u[i])}`).join("<br>")));
  let r = w[idx0].div(u[idx0]);
  stepsA.push(T(`Aus Gleichung ${["I", "II", "III"][idx0]} folgt r = ${N.fmt(r)}. Einsetzen in die übrigen Gleichungen zur Kontrolle:`));
  let consistentA = true;
  for (const i of [0, 1, 2]) {
    if (i === idx0) continue;
    const lhs = s[i].add(u[i].mul(r));
    const ok = lhs.equals(P[i]);
    stepsA.push(E(`${["I", "II", "III"][i]}: ${N.fmt(s[i])} + ${N.fmt(r)}·${N.fmt(u[i])} = ${N.fmt(lhs)} ${ok ? "=" : "≠"} ${N.fmt(P[i])} ${ok ? "✓" : "✗"}`));
    if (!ok) consistentA = false;
  }

  const cr = cross(w, u);
  const onLine = isZeroVec(cr);
  const stepsB = [
    T(`<strong>Verfahren 2 (Kreuzprodukt):</strong> P liegt genau dann auf g, wenn der Verbindungsvektor ${N.vecArrow("sP")} = P − ${N.vecArrow("s")} parallel zu ${N.vecArrow("v")} ist, d. h. wenn ${N.vecArrow("sP")} × ${N.vecArrow("v")} = ${N.vecArrow("0")} ist.`),
    E(`${N.vecArrow("sP")} = ${N.vecColFromFractions(w)}`),
    E(`${N.vecArrow("sP")} × ${N.vecArrow("v")} = ${N.vecColFromFractions(cr)}`),
    T(onLine ? "Das Kreuzprodukt ist der Nullvektor — die Vektoren sind parallel." : "Das Kreuzprodukt ist nicht der Nullvektor."),
  ];

  const extras = [];
  if (!onLine) {
    const distSq = squaredLength(cr).div(squaredLength(u));
    extras.push({ label: "Abstand", value: `d(P,g) = |${N.vecArrow("sP")} × ${N.vecArrow("v")}| / |${N.vecArrow("v")}| ≈ ${N.fmtApprox(Math.sqrt(distSq.toNumber()))} LE` });
  }

  return {
    relation: onLine ? "liegt_auf" : "liegt_nicht_auf",
    relationLabel: onLine ? "Der Punkt P liegt auf der Geraden g." : "Der Punkt P liegt nicht auf der Geraden g.",
    methods: [
      { title: "Verfahren 1: Lineares Gleichungssystem", steps: stepsA },
      { title: "Verfahren 2: Kreuzprodukt", steps: stepsB },
    ],
    extras,
  };
}

// ---------- 3. Punkt – Ebene ----------

export function pointPlane(P, plane) {
  const w = vSub(P, plane.s);
  const solved = solveLinear2x2(plane.u, plane.v, w);
  const stepsA = [T(`<strong>Verfahren 1 (LGS in Parameterform):</strong> Liegt P in E, gibt es r, s mit P = ${N.vecArrow("s")} + r·${N.vecArrow("v")} + s·${N.vecArrow("w")}.`)];
  stepsA.push(
    E([0, 1, 2].map((i) => `${["I", "II", "III"][i]}: ${N.fmt(P[i])} = ${N.fmt(plane.s[i])} + r·${N.fmt(plane.u[i])} + s·${N.fmt(plane.v[i])}`).join("<br>"))
  );
  let consistentA = false;
  if (solved) {
    const { x: rVal, y: sVal, i, j } = solved;
    const k = [0, 1, 2].find((x) => x !== i && x !== j);
    stepsA.push(T(`Aus ${["I", "II", "III"][i]} und ${["I", "II", "III"][j]} folgt r = ${N.fmt(rVal)}, s = ${N.fmt(sVal)}. Einsetzen in ${["I", "II", "III"][k]} zur Kontrolle:`));
    const lhs = plane.s[k].add(plane.u[k].mul(rVal)).add(plane.v[k].mul(sVal));
    const ok = lhs.equals(P[k]);
    stepsA.push(
      E(`${["I", "II", "III"][k]}: ${N.fmt(plane.s[k])} + ${N.fmt(rVal)}·${N.fmt(plane.u[k])} + ${N.fmt(sVal)}·${N.fmt(plane.v[k])} = ${N.fmt(lhs)} ${ok ? "=" : "≠"} ${N.fmt(P[k])} ${ok ? "✓" : "✗"}`)
    );
    consistentA = ok;
  }

  const lhsCoord = plane.a.mul(P[0]).add(plane.b.mul(P[1])).add(plane.c.mul(P[2]));
  const onPlane = lhsCoord.equals(plane.d);
  const stepsB = [
    T(`<strong>Verfahren 2 (Einsetzen in die Koordinatenform):</strong> P liegt in E, wenn seine Koordinaten die Koordinatengleichung erfüllen.`),
    E(`${N.fmt(plane.a)}·${N.fmt(P[0])} + ${N.fmt(plane.b)}·${N.fmt(P[1])} + ${N.fmt(plane.c)}·${N.fmt(P[2])} = ${N.fmt(lhsCoord)} ${onPlane ? "=" : "≠"} ${N.fmt(plane.d)}`),
  ];

  const extras = [];
  if (!onPlane) {
    const distNum = Math.abs(lhsCoord.sub(plane.d).toNumber()) / Math.sqrt(squaredLength(plane.n).toNumber());
    extras.push({ label: "Abstand", value: `d(P,E) = |${N.fmt(plane.a)}·${N.fmt(P[0])} ${plane.b.isNegative() ? "−" : "+"} ${N.fmt(plane.b.abs())}·${N.fmt(P[1])} ${plane.c.isNegative() ? "−" : "+"} ${N.fmt(plane.c.abs())}·${N.fmt(P[2])} − ${N.fmt(plane.d)}| / |${N.vecArrow("n")}| ≈ ${N.fmtApprox(distNum)} LE` });
  }

  return {
    relation: onPlane ? "liegt_in" : "liegt_nicht_in",
    relationLabel: onPlane ? "Der Punkt P liegt in der Ebene E." : "Der Punkt P liegt nicht in der Ebene E.",
    methods: [
      { title: "Verfahren 1: LGS in Parameterform", steps: stepsA },
      { title: "Verfahren 2: Koordinatenform (Einsetzen)", steps: stepsB },
    ],
    extras,
  };
}

// ---------- 4. Gerade – Gerade ----------

export function lineLine(s1, u1, s2, u2) {
  const parU = isParallel(u1, u2);
  const w = vSub(s2, s1);
  const spat = scalarTriple(u1, u2, w);

  const stepsA = [
    T(`<strong>Verfahren 1 (Gleichsetzungsverfahren):</strong> Gleichsetzen der beiden Geradengleichungen liefert ein LGS für r und t.`),
    E([0, 1, 2].map((i) => `${["I", "II", "III"][i]}: ${N.fmt(s1[i])} + r·${N.fmt(u1[i])} = ${N.fmt(s2[i])} + t·${N.fmt(u2[i])}`).join("<br>")),
  ];

  let relation, intersection = null;
  if (parU) {
    const crossCheck = cross(w, u1);
    const identical = isZeroVec(crossCheck);
    stepsA.push(
      T(
        `Die Richtungsvektoren ${N.vecArrow(`v${N.sub(1)}`)} und ${N.vecArrow(`v${N.sub(2)}`)} sind parallel (linear abhängig) — zwei der drei Gleichungen legen r und t nicht mehr eindeutig fest. Stattdessen wird geprüft, ob der Verbindungsvektor der Stützpunkte ebenfalls parallel zu ${N.vecArrow(`v${N.sub(1)}`)} ist:`
      )
    );
    stepsA.push(E(`(${N.vecArrow(`s${N.sub(2)}`)} − ${N.vecArrow(`s${N.sub(1)}`)}) × ${N.vecArrow(`v${N.sub(1)}`)} = ${N.vecColFromFractions(crossCheck)}`));
    relation = identical ? "identisch" : "parallel";
    stepsA.push(
      T(
        identical
          ? `Der Verbindungsvektor ist ebenfalls parallel zu ${N.vecArrow(`v${N.sub(1)}`)} — die Stützpunkte liegen auf derselben Geraden.`
          : `Der Verbindungsvektor ist nicht parallel zu ${N.vecArrow(`v${N.sub(1)}`)} — die Geraden sind echt parallel, aber verschieden.`
      )
    );
  } else {
    const solved = solveLinear2x2(u1, vScale(u2, -1), w);
    const { x: r, y: t, i, j } = solved;
    const k = [0, 1, 2].find((x) => x !== i && x !== j);
    stepsA.push(T(`Aus ${["I", "II", "III"][i]} und ${["I", "II", "III"][j]} folgt r = ${N.fmt(r)}, t = ${N.fmt(t)}. Probe in ${["I", "II", "III"][k]}:`));
    const lhs = s1[k].add(u1[k].mul(r));
    const rhs = s2[k].add(u2[k].mul(t));
    const ok = lhs.equals(rhs);
    stepsA.push(E(`${["I", "II", "III"][k]}: ${N.fmt(s1[k])} + ${N.fmt(r)}·${N.fmt(u1[k])} = ${N.fmt(lhs)}   |   ${N.fmt(s2[k])} + ${N.fmt(t)}·${N.fmt(u2[k])} = ${N.fmt(rhs)}   ${ok ? "✓" : "✗"}`));
    if (ok) {
      relation = "schneidend";
      intersection = vAdd(s1, vScale(u1, r));
      stepsA.push(T("Die Probe stimmt — die Geraden schneiden sich in genau einem Punkt. Einsetzen von r in die Geradengleichung von g liefert den Schnittpunkt:"));
      stepsA.push(E(`S = ${N.vecColFromFractions(s1)} + ${N.fmt(r)}·${N.vecColFromFractions(u1)} = ${N.vecColFromFractions(intersection)}`));
    } else {
      relation = "windschief";
      stepsA.push(T("Die Probe stimmt nicht — es gibt kein gemeinsames Paar (r,t). Die Geraden sind windschief."));
    }
  }

  const stepsB = [
    T(
      `<strong>Verfahren 2 (Spatprodukt):</strong> Sind ${N.vecArrow(`v${N.sub(1)}`)}, ${N.vecArrow(`v${N.sub(2)}`)} und der Verbindungsvektor ${N.vecArrow(`s${N.sub(1)}s${N.sub(2)}`)} = ${N.vecArrow(`s${N.sub(2)}`)} − ${N.vecArrow(`s${N.sub(1)}`)} linear abhängig (Spatprodukt = 0), liegen die Geraden in einer gemeinsamen Ebene.`
    ),
    E(`${N.vecArrow(`s${N.sub(1)}s${N.sub(2)}`)} = ${N.vecColFromFractions(w)}`),
    E(`[${N.vecArrow(`v${N.sub(1)}`)}, ${N.vecArrow(`v${N.sub(2)}`)}, ${N.vecArrow(`s${N.sub(1)}s${N.sub(2)}`)}] = ${N.vecArrow(`v${N.sub(1)}`)} · (${N.vecArrow(`v${N.sub(2)}`)} × ${N.vecArrow(`s${N.sub(1)}s${N.sub(2)}`)}) = ${N.fmt(spat)}`),
  ];
  if (!spat.isZero()) {
    stepsB.push(T("Das Spatprodukt ist ungleich 0 — die drei Vektoren sind linear unabhängig. Die Geraden sind windschief."));
  } else {
    stepsB.push(T("Das Spatprodukt ist 0 — die drei Vektoren sind linear abhängig, die Geraden liegen also in einer gemeinsamen Ebene (parallel, identisch oder schneidend)."));
    const crossU = cross(u1, u2);
    stepsB.push(E(`${N.vecArrow(`v${N.sub(1)}`)} × ${N.vecArrow(`v${N.sub(2)}`)} = ${N.vecColFromFractions(crossU)}`));
    stepsB.push(
      T(
        parU
          ? "Das Kreuzprodukt ist der Nullvektor — die Richtungsvektoren sind parallel (identisch oder echt parallel, siehe Verfahren 1)."
          : "Das Kreuzprodukt ist nicht der Nullvektor — die Richtungsvektoren sind nicht parallel, die Geraden schneiden sich also in genau einem Punkt."
      )
    );
  }

  const extras = [];
  if (relation === "schneidend" && intersection) {
    extras.push({ label: "Schnittpunkt", value: N.pointHTML("S", intersection) });
    const angleDeg = angleDegCos(u1, u2);
    extras.push({
      label: "Schnittwinkel",
      value: `cos(φ) = |${N.vecArrow(`v${N.sub(1)}`)} · ${N.vecArrow(`v${N.sub(2)}`)}| / (|${N.vecArrow(`v${N.sub(1)}`)}| · |${N.vecArrow(`v${N.sub(2)}`)}|) ⇒ φ ≈ ${N.fmtApprox(angleDeg)}°`,
    });
  }
  if (relation === "parallel") {
    const distSq = squaredLength(cross(w, u1)).div(squaredLength(u1));
    extras.push({ label: "Abstand", value: `d(g,h) ≈ ${N.fmtApprox(Math.sqrt(distSq.toNumber()))} LE` });
  }
  if (relation === "windschief") {
    const distSq = spat.mul(spat).div(squaredLength(cross(u1, u2)));
    extras.push({ label: "Abstand", value: `d(g,h) = |[${N.vecArrow(`v${N.sub(1)}`)},${N.vecArrow(`v${N.sub(2)}`)},${N.vecArrow(`s${N.sub(1)}s${N.sub(2)}`)}]| / |${N.vecArrow(`v${N.sub(1)}`)}×${N.vecArrow(`v${N.sub(2)}`)}| ≈ ${N.fmtApprox(Math.sqrt(distSq.toNumber()))} LE` });
  }

  const labelMap = {
    identisch: "Die Geraden g und h sind identisch.",
    parallel: "Die Geraden g und h sind echt parallel (verschieden).",
    schneidend: "Die Geraden g und h schneiden sich in genau einem Punkt.",
    windschief: "Die Geraden g und h sind windschief.",
  };
  return {
    relation,
    relationLabel: labelMap[relation],
    methods: [
      { title: "Verfahren 1: Gleichsetzungsverfahren (LGS)", steps: stepsA },
      { title: "Verfahren 2: Spatprodukt", steps: stepsB },
    ],
    extras,
  };
}

// ---------- 5. Ebene – Ebene ----------

// Richtungsvektoren, die senkrecht zu einem gegebenen Normalenvektor stehen — dieselbe
// Konstruktion, die planeFromCoord/planeFromNormal beim Umrechnen intern verwenden, hier aber
// Schritt für Schritt erklärt: Vertauschen zweier Normalenvektor-Komponenten mit Vorzeichenwechsel
// liefert garantiert einen Vektor senkrecht zum Normalenvektor (das Skalarprodukt hebt sich weg),
// das Kreuzprodukt mit dem Normalenvektor liefert automatisch einen zweiten, dazu senkrechten und
// linear unabhängigen Vektor.
function richtungsvektorenAusNormaleSteps(plane, label, disp) {
  const n = plane.n;
  const steps = [];
  if (!n[0].isZero() || !n[1].isZero()) {
    steps.push(
      T(
        `Für die Richtungsvektoren von ${label} werden zwei linear unabhängige Vektoren gesucht, die senkrecht zum Normalenvektor ${disp.n} = ${N.vecColFromFractions(
          n
        )} stehen (nur dann liegen sie in der Ebene). Vertauscht man die ersten beiden Komponenten von ${disp.n} und dreht bei einer davon das Vorzeichen um, steht das Ergebnis automatisch senkrecht auf ${disp.n} — im Skalarprodukt heben sich die beiden vertauschten Terme gegenseitig auf:`
      )
    );
  } else {
    steps.push(
      T(
        `Für die Richtungsvektoren von ${label} werden zwei linear unabhängige Vektoren gesucht, die senkrecht zum Normalenvektor ${disp.n} = ${N.vecColFromFractions(
          n
        )} stehen. Da ${disp.n} nur in ${N.X3}-Richtung zeigt, steht z. B. (1|0|0) automatisch senkrecht darauf:`
      )
    );
  }
  steps.push(E(`${disp.v} = ${N.vecColFromFractions(plane.u)}`));
  steps.push(
    T(
      `Der zweite Richtungsvektor ergibt sich als Kreuzprodukt aus Normalenvektor und erstem Richtungsvektor — ein Kreuzprodukt steht immer senkrecht auf beiden Faktoren, also auch auf ${disp.n}, und ist von ${disp.v} linear unabhängig:`
    )
  );
  steps.push(E(`${disp.w} = ${disp.n} × ${disp.v} = ${N.vecColFromFractions(plane.v)}`));
  return steps;
}

// Bringt eine Ebene in Parameterform — mit Zwischenschritten, aber nur, wenn sie nicht schon so
// gegeben ist (sonst nur eine kurze Bestätigung, damit klar bleibt, welche Form gerade verwendet
// wird).
function ensureParamSteps(plane, mode, label, disp) {
  if (mode === "param") {
    return [T(`Ebene ${label} liegt bereits in Parameterform vor — keine Umrechnung nötig.`)];
  }
  const steps = [];
  if (mode === "coord") {
    const coords = [plane.a, plane.b, plane.c];
    const idx = coords.findIndex((c) => !c.isZero());
    const names = [N.X1, N.X2, N.X3];
    const zeroIdx = [0, 1, 2].filter((i) => i !== idx);
    steps.push(
      T(
        `Ebene ${label} ist in Koordinatenform gegeben und wird in Parameterform umgerechnet. Zuerst ein Stützpunkt: Zwei der drei Koordinaten werden auf 0 gesetzt — hier ${names[zeroIdx[0]]} = 0 und ${names[zeroIdx[1]]} = 0 — und die Koordinatengleichung von ${label} nach der verbleibenden Koordinate ${names[idx]} aufgelöst:`
      )
    );
    steps.push(E(`${N.fmt(coords[idx])}·${names[idx]} = ${N.fmt(plane.d)} ⇒ ${names[idx]} = ${N.fmt(plane.d.div(coords[idx]))}`));
    steps.push(E(`${disp.s} = ${N.vecColFromFractions(plane.s)}`));
  } else {
    steps.push(
      T(`Ebene ${label} ist in Normalenform gegeben und wird in Parameterform umgerechnet; der Stützpunkt ist darin bereits direkt enthalten:`)
    );
    steps.push(E(`${disp.s} = ${N.vecColFromFractions(plane.s)}`));
  }
  steps.push(...richtungsvektorenAusNormaleSteps(plane, label, disp));
  return steps;
}

// Bringt eine Ebene in Koordinatenform — mit Zwischenschritten, aber nur, wenn sie nicht schon so
// gegeben ist.
function ensureCoordSteps(plane, mode, label, disp) {
  if (mode === "coord") {
    return [T(`Ebene ${label} liegt bereits in Koordinatenform vor — keine Umrechnung nötig.`)];
  }
  const steps = [];
  if (mode === "param") {
    steps.push(
      T(
        `Ebene ${label} ist in Parameterform gegeben und wird in Koordinatenform umgerechnet. Der Normalenvektor ergibt sich als Kreuzprodukt der beiden Richtungsvektoren:`
      )
    );
    steps.push(E(`${disp.n} = ${disp.v} × ${disp.w} = ${N.vecColFromFractions(plane.n)}`));
  } else {
    steps.push(T(`Ebene ${label} ist in Normalenform gegeben; der Normalenvektor ist darin bereits direkt enthalten:`));
    steps.push(E(`${disp.n} = ${N.vecColFromFractions(plane.n)}`));
  }
  steps.push(T(`Die rechte Seite d der Koordinatenform ergibt sich aus dem Skalarprodukt von Normalenvektor und Stützpunkt:`));
  steps.push(
    E(`d = ${disp.n} · ${disp.s} = ${N.vecColFromFractions(plane.n)} · ${N.vecColFromFractions(plane.s)} = ${N.fmt(plane.d)}`)
  );
  return steps;
}

// Normalenvektor für Verfahren 3 — eine echte Umrechnung ist nur nötig, wenn die Ebene in
// Parameterform vorliegt; sonst ist er direkt ablesbar bzw. schon gegeben.
function ensureNormalSteps(plane, mode, label, disp) {
  if (mode === "param") {
    return [
      T(`${label} liegt in Parameterform vor — der Normalenvektor ${disp.n} ergibt sich als Kreuzprodukt der Richtungsvektoren:`),
      E(`${disp.n} = ${disp.v} × ${disp.w} = ${N.vecColFromFractions(plane.n)}`),
    ];
  }
  const note = mode === "coord" ? "direkt als Koeffiziententripel der Koordinatenform ablesbar" : "in der Normalenform bereits direkt gegeben";
  return [T(`Normalenvektor ${disp.n} von ${label} ist ${note}: ${disp.n} = ${N.vecColFromFractions(plane.n)}`)];
}

// BigInt-ggT (nicht-negativ).
function gcdBigInt(a, b) {
  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;
  while (b) [a, b] = [b, a % b];
  return a;
}

// Skaliert einen Richtungsvektor (Fraction-Komponenten) auf den "primitiven" ganzzahligen Vektor
// derselben Richtung: zunächst mit dem kgV aller Nenner multiplizieren, um Brüche zu beseitigen,
// danach durch den ggT der entstandenen ganzen Zahlen teilen ("kürzen"). Gibt zusätzlich den
// verwendeten Skalierungsfaktor zurück.
function toIntegerDirection(v) {
  const lcm = v.reduce((acc, f) => (acc * f.d) / gcdBigInt(acc, f.d), 1n);
  const scaledInts = v.map((f) => f.mul(F(lcm)).n);
  let g = scaledInts.reduce((acc, n) => gcdBigInt(acc, n), 0n);
  if (g === 0n) g = 1n;
  const factor = F(lcm).div(F(g));
  const vec = scaledInts.map((n) => F(n / g));
  return { vec, factor };
}

// Ersetzt einen Richtungsvektor durch seine ganzzahlige, gekürzte Variante und liefert bei Bedarf
// einen erklärenden Zwischenschritt dazu (nur wenn tatsächlich skaliert wurde — ein bereits
// ganzzahliger, gekürzter Vektor bleibt unverändert und ohne zusätzlichen Kommentar).
function integerizeDirection(dirVec, paramLetter) {
  const { vec, factor } = toIntegerDirection(dirVec);
  if (factor.equals(1)) return { vec: dirVec, steps: [] };
  return {
    vec,
    steps: [
      T(
        `Damit der Richtungsvektor ganzzahlige (und möglichst einfache) Komponenten hat, wird er mit dem Faktor ${N.fmt(
          factor
        )} skaliert — das ändert nur die "Schrittweite" von ${paramLetter} entlang der Geraden, nicht die Gerade selbst:`
      ),
    ],
  };
}

export function planePlane(E1, E2, m1 = "coord", m2 = "coord") {
  const parN = isParallel(E1.n, E2.n);
  const dir = cross(E1.n, E2.n);

  const disp1 = {
    s: N.vecArrow(`s${N.sub(1)}`),
    v: N.vecArrow(`v${N.sub(1)}`),
    w: N.vecArrow(`w${N.sub(1)}`),
    n: N.vecArrow(`n${N.sub(1)}`),
  };
  const disp2 = {
    s: N.vecArrow(`s${N.sub(2)}`),
    v: N.vecArrow(`v${N.sub(2)}`),
    w: N.vecArrow(`w${N.sub(2)}`),
    n: N.vecArrow(`n${N.sub(2)}`),
  };

  // ---- Verfahren 2: LGS aus beiden Koordinatenformen ----
  const stepsLGS = [
    T(
      `<strong>Verfahren 2 (LGS aus beiden Koordinatenformen):</strong> Für dieses Verfahren müssen beide Ebenen in Koordinatenform vorliegen.`
    ),
  ];
  stepsLGS.push(...ensureCoordSteps(E1, m1, "E1", disp1));
  stepsLGS.push(...ensureCoordSteps(E2, m2, "E2", disp2));

  const eqI = `I: ${N.fmtLinearCombo([
    { coeff: E1.a, varHtml: N.X1 },
    { coeff: E1.b, varHtml: N.X2 },
    { coeff: E1.c, varHtml: N.X3 },
  ])} = ${N.fmt(E1.d)}`;
  const eqII = `II: ${N.fmtLinearCombo([
    { coeff: E2.a, varHtml: N.X1 },
    { coeff: E2.b, varHtml: N.X2 },
    { coeff: E2.c, varHtml: N.X3 },
  ])} = ${N.fmt(E2.d)}`;
  stepsLGS.push(T("Damit lauten die beiden Koordinatengleichungen:"));
  stepsLGS.push(E(`${eqI}<br>${eqII}`));

  const elim = eliminateVariable(E1, E2);
  const remainIdx = [0, 1, 2].filter((i) => i !== elim.idx);
  stepsLGS.push(T(`Kombination ${N.fmt(elim.lambda)}·I + (${N.fmt(elim.mu)})·II eliminiert ${VN[elim.idx]}:`));
  const comboStr = N.fmtLinearCombo(remainIdx.map((i) => ({ coeff: elim.coeffs[i], varHtml: VN[i] })));
  stepsLGS.push(E(`III: ${comboStr} = ${N.fmt(elim.d)}`));

  let relation;
  const allZero = remainIdx.every((i) => elim.coeffs[i].isZero());
  if (allZero) {
    if (elim.d.isZero()) {
      relation = "identisch";
      stepsLGS.push(T("Gleichung III wird zu 0 = 0 — für alle x wahr. Gleichung II ist ein Vielfaches von I. Die Ebenen sind identisch."));
    } else {
      relation = "parallel";
      stepsLGS.push(T(`Gleichung III wird zu 0 = ${N.fmt(elim.d)} — ein Widerspruch. Das LGS ist unlösbar, die Ebenen sind parallel und verschieden.`));
    }
  } else {
    relation = "schneidend";
    stepsLGS.push(T("Gleichung III verknüpft die beiden verbliebenen Variablen linear — es gibt unendlich viele Lösungen. Die Ebenen schneiden sich in einer Geraden."));

    // Schnittgerade explizit aus dem LGS gewinnen: eine der beiden verbliebenen Variablen als
    // freien Parameter k setzen (k, weil r/s/t/u bereits die Parameter von E1 und E2 sind), die
    // andere aus III damit ausdrücken, und beides in eine der Ausgangsgleichungen einsetzen, um
    // auch die eliminierte Variable durch k auszudrücken.
    const depIdx = remainIdx.find((i) => !elim.coeffs[i].isZero());
    const freeIdx = remainIdx.find((i) => i !== depIdx);
    const depConst = elim.d.div(elim.coeffs[depIdx]);
    const depSlope = elim.coeffs[freeIdx].div(elim.coeffs[depIdx]).neg();

    stepsLGS.push(
      T(
        `Um die Schnittgerade explizit zu erhalten, wird eine der beiden Variablen aus III frei als Parameter k gewählt und die andere damit ausgedrückt:`
      )
    );
    stepsLGS.push(
      E(
        `${VN[freeIdx]} = k,   ${VN[depIdx]} = ${N.fmtLinearCombo([
          { coeff: depConst, varHtml: "" },
          { coeff: depSlope, varHtml: " k" },
        ])}`
      )
    );

    const coeffsE1 = [E1.a, E1.b, E1.c];
    const coeffsE2 = [E2.a, E2.b, E2.c];
    const useE1 = !coeffsE1[elim.idx].isZero();
    const usedLabel = useE1 ? "I" : "II";
    const usedCoeffs = useE1 ? coeffsE1 : coeffsE2;
    const usedD = useE1 ? E1.d : E2.d;
    const cElim = usedCoeffs[elim.idx];
    const cDep = usedCoeffs[depIdx];
    const cFree = usedCoeffs[freeIdx];
    const elimConst = usedD.sub(cDep.mul(depConst)).div(cElim);
    const elimSlope = cDep.mul(depSlope).add(cFree).neg().div(cElim);

    stepsLGS.push(
      T(`Einsetzen in Gleichung ${usedLabel} und Auflösen nach ${VN[elim.idx]} liefert auch diese Koordinate in Abhängigkeit von k:`)
    );
    stepsLGS.push(
      E(
        `${VN[elim.idx]} = ${N.fmtLinearCombo([
          { coeff: elimConst, varHtml: "" },
          { coeff: elimSlope, varHtml: " k" },
        ])}`
      )
    );

    const sLGS = [null, null, null];
    const dirLGS = [null, null, null];
    sLGS[elim.idx] = elimConst;
    dirLGS[elim.idx] = elimSlope;
    sLGS[depIdx] = depConst;
    dirLGS[depIdx] = depSlope;
    sLGS[freeIdx] = F(0);
    dirLGS[freeIdx] = F(1);

    const { vec: dirLGSInt, steps: scaleStepsLGS } = integerizeDirection(dirLGS, "k");
    stepsLGS.push(...scaleStepsLGS);
    stepsLGS.push(T("Zusammengefasst als Vektorgleichung ist das genau die Schnittgerade:"));
    stepsLGS.push(E(N.lineHTML("h", sLGS, dirLGSInt, "k")));
  }

  // ---- Verfahren 1: Parameterform von E1 in die Koordinatenform von E2 einsetzen ----
  const l1 = "r";
  const m1p = "s";
  const stepsParamSubst = [
    T(
      `<strong>Verfahren 1 (Parameterform von E1 in die Koordinatenform von E2 einsetzen):</strong> Für dieses Verfahren muss E1 in Parameterform und E2 in Koordinatenform vorliegen.`
    ),
  ];
  stepsParamSubst.push(...ensureParamSteps(E1, m1, "E1", disp1));
  stepsParamSubst.push(...ensureCoordSteps(E2, m2, "E2", disp2));

  const A = dot(E2.n, E1.u);
  const B = dot(E2.n, E1.v);
  const Cconst = dot(E2.n, E1.s);
  const rhs2 = E2.d.sub(Cconst);
  const n2 = [E2.a, E2.b, E2.c];
  const substTerm = (i) => `${N.fmt(n2[i])}·(${N.fmt(E1.s[i])} + ${l1}·${N.fmt(E1.u[i])} + ${m1p}·${N.fmt(E1.v[i])})`;

  stepsParamSubst.push(
    T(
      `Jeder Punkt von E1 hat damit die Form ${N.vecArrow("x")} = ${disp1.s} + ${l1}·${disp1.v} + ${m1p}·${disp1.w}. Eingesetzt in die Koordinatenform von E2 entscheidet sich, für welche ${l1}, ${m1p} dieser Punkt auch auf E2 liegt.`
    )
  );
  stepsParamSubst.push(E(`${substTerm(0)} + ${substTerm(1)} + ${substTerm(2)} = ${N.fmt(E2.d)}`));
  stepsParamSubst.push(E(`${N.fmt(A)}·${l1} + ${N.fmt(B)}·${m1p} = ${N.fmt(rhs2)}`));

  let schnittgeradeM2 = null;
  if (A.isZero() && B.isZero()) {
    stepsParamSubst.push(
      T(
        `Die Koeffizienten von ${l1} und ${m1p} sind beide 0 — das Ergebnis hängt gar nicht von ${l1}, ${m1p} ab. Das bedeutet: Alle Richtungsvektoren von E1 stehen senkrecht auf ${disp2.n}, E1 und E2 sind also parallel.`
      )
    );
    if (rhs2.isZero()) {
      stepsParamSubst.push(T(`Die Gleichung wird zu 0 = 0 — jeder Punkt von E1 erfüllt auch die Gleichung von E2. Die Ebenen sind identisch.`));
    } else {
      stepsParamSubst.push(T(`Die Gleichung wird zu 0 = ${N.fmt(rhs2)} — ein Widerspruch. Kein Punkt von E1 liegt auf E2, die Ebenen sind echt parallel.`));
    }
  } else {
    stepsParamSubst.push(
      T(
        `Das ist eine lineare Gleichung in ${l1} und ${m1p} mit unendlich vielen Lösungen (${l1}, ${m1p}) — geometrisch eine Gerade im Parameterbereich von E1. Eingesetzt in die Parameterform von E1 ergibt das genau die Schnittgerade.`
      )
    );
    let point0, dirVec;
    if (!A.isZero()) {
      const lam0 = rhs2.div(A);
      point0 = vAdd(E1.s, vScale(E1.u, lam0));
      dirVec = vAdd(vScale(E1.u, B.neg().div(A)), E1.v);
      stepsParamSubst.push(
        T(
          `Mit ${m1p} = 0 folgt ${l1} = ${N.fmt(lam0)}; das liefert einen Punkt. Erhöht man ${m1p} um 1, ändert sich ${l1} um ${N.fmt(
            B.neg().div(A)
          )} — das liefert die Richtung:`
        )
      );
    } else {
      const mu0 = rhs2.div(B);
      point0 = vAdd(E1.s, vScale(E1.v, mu0));
      dirVec = vAdd(E1.u, vScale(E1.v, A.neg().div(B)));
      stepsParamSubst.push(
        T(
          `Mit ${l1} = 0 folgt ${m1p} = ${N.fmt(mu0)}; das liefert einen Punkt. Erhöht man ${l1} um 1, ändert sich ${m1p} um ${N.fmt(
            A.neg().div(B)
          )} — das liefert die Richtung:`
        )
      );
    }
    const { vec: dirVecInt, steps: scaleStepsPS } = integerizeDirection(dirVec, "k");
    stepsParamSubst.push(...scaleStepsPS);
    schnittgeradeM2 = { s: point0, u: dirVecInt };
    stepsParamSubst.push(E(N.lineHTML("h", point0, dirVecInt, "k")));
  }

  // ---- Verfahren 3: Normalenvektoren (Vektorprodukt) ----
  const stepsCross = [
    T(`<strong>Verfahren 3 (Normalenvektoren, Vektorprodukt):</strong> Für dieses Verfahren werden nur die Normalenvektoren benötigt.`),
  ];
  stepsCross.push(...ensureNormalSteps(E1, m1, "E1", disp1));
  stepsCross.push(...ensureNormalSteps(E2, m2, "E2", disp2));
  stepsCross.push(
    T(`Sind ${disp1.n} und ${disp2.n} linear abhängig (Kreuzprodukt = Nullvektor), sind die Ebenen parallel oder identisch.`)
  );
  stepsCross.push(E(`${disp1.n} × ${disp2.n} = ${N.vecColFromFractions(dir)}`));
  let schnittgerade = null;
  if (parN) {
    const sOk = dot(E2.n, E1.s).equals(E2.d);
    stepsCross.push(
      T(
        `Das Kreuzprodukt ist der Nullvektor — die Normalenvektoren sind linear abhängig. Ein Stützpunkt von E1 in E2 eingesetzt: ${
          sOk ? "erfüllt die Gleichung → die Ebenen sind identisch." : "erfüllt die Gleichung nicht → die Ebenen sind echt parallel."
        }`
      )
    );
  } else {
    stepsCross.push(
      T(
        `Das Kreuzprodukt ist nicht der Nullvektor — die Normalenvektoren sind linear unabhängig, die Ebenen schneiden sich in einer Geraden mit Richtungsvektor ${disp1.n} × ${disp2.n}.`
      )
    );
    const pt = intersectionPointOfPlanes(E1, E2, dir);
    const { vec: dirInt, steps: scaleStepsCross } = integerizeDirection(dir, "k");
    stepsCross.push(...scaleStepsCross);
    schnittgerade = { s: pt, u: dirInt };
    stepsCross.push(T("Ein Punkt der Schnittgeraden ergibt sich, indem man die Koordinate, deren Richtungsvektor-Komponente ungleich 0 ist, auf 0 setzt und das verbleibende 2×2-System löst:"));
    stepsCross.push(E(N.lineHTML("h", pt, dirInt, "k")));
  }

  const extras = [];
  if (relation === "schneidend" && schnittgerade) {
    extras.push({ label: "Schnittgerade", value: N.lineHTML("h", schnittgerade.s, schnittgerade.u, "k") });
    const angleDeg = angleDegCos(E1.n, E2.n);
    extras.push({
      label: "Schnittwinkel",
      value: `cos(φ) = |${disp1.n} · ${disp2.n}| / (|${disp1.n}| · |${disp2.n}|) ⇒ φ ≈ ${N.fmtApprox(angleDeg)}°`,
    });
  }
  if (relation === "parallel") {
    const distNum = Math.abs(E1.a.mul(E2.s[0]).add(E1.b.mul(E2.s[1])).add(E1.c.mul(E2.s[2])).sub(E1.d).toNumber()) / Math.sqrt(squaredLength(E1.n).toNumber());
    extras.push({ label: "Abstand", value: `d(E1,E2) ≈ ${N.fmtApprox(distNum)} LE` });
  }

  const labelMap = {
    identisch: "Die Ebenen E1 und E2 sind identisch.",
    parallel: "Die Ebenen E1 und E2 sind echt parallel (verschieden).",
    schneidend: "Die Ebenen E1 und E2 schneiden sich in einer Geraden.",
  };
  return {
    relation,
    relationLabel: labelMap[relation],
    methods: [
      { title: "Verfahren 1: Parameterform in Koordinatenform einsetzen", steps: stepsParamSubst },
      { title: "Verfahren 2: LGS aus den Koordinatenformen", steps: stepsLGS },
      { title: "Verfahren 3: Normalenvektoren (Vektorprodukt)", steps: stepsCross },
    ],
    extras,
  };
}

// ---------- 6. Gerade – Ebene ----------

export function linePlane(s, u, plane) {
  const nDotU = dot(plane.n, u);
  const nDotS = dot(plane.n, s);
  const stepsA = [
    T(`<strong>Verfahren 1 (Einsetzverfahren in die Koordinatenform):</strong> Die Geradenpunkte werden in die Koordinatengleichung von E eingesetzt.`),
    E(
      `${N.fmt(plane.a)}·(${N.fmt(s[0])}+r·${N.fmt(u[0])}) + ${N.fmt(plane.b)}·(${N.fmt(s[1])}+r·${N.fmt(u[1])}) + ${N.fmt(plane.c)}·(${N.fmt(s[2])}+r·${N.fmt(u[2])}) = ${N.fmt(plane.d)}`
    ),
    E(`${N.fmt(nDotU)}·r + ${N.fmt(nDotS)} = ${N.fmt(plane.d)}`),
  ];

  let relation,
    point = null;
  if (nDotU.isZero()) {
    if (nDotS.equals(plane.d)) {
      relation = "liegt_in";
      stepsA.push(T("Der Koeffizient von r ist 0, und 0 = 0 ist immer wahr — jeder Punkt von g erfüllt die Ebenengleichung. Die Gerade liegt vollständig in E."));
    } else {
      relation = "parallel";
      stepsA.push(T(`Der Koeffizient von r ist 0, aber ${N.fmt(nDotS)} ≠ ${N.fmt(plane.d)} — ein Widerspruch. g ist echt parallel zu E (kein gemeinsamer Punkt).`));
    }
  } else {
    relation = "schneidend";
    const rVal = plane.d.sub(nDotS).div(nDotU);
    point = vAdd(s, vScale(u, rVal));
    stepsA.push(T(`Auflösen nach r ergibt r = ${N.fmt(rVal)}. Einsetzen in die Geradengleichung liefert den Schnittpunkt.`));
    stepsA.push(E(`S = ${N.vecColFromFractions(s)} + ${N.fmt(rVal)}·${N.vecColFromFractions(u)} = ${N.vecColFromFractions(point)}`));
  }

  const stepsB = [
    T(`<strong>Verfahren 2 (Skalarprodukt aus Richtungs- und Normalenvektor):</strong> g ist parallel zu E (oder liegt in E), wenn ${N.vecArrow("v")} senkrecht zu ${N.vecArrow("n")} steht, d. h. wenn ${N.vecArrow("v")} · ${N.vecArrow("n")} = 0 ist.`),
    E(`${N.vecArrow("v")} · ${N.vecArrow("n")} = ${N.vecColFromFractions(u)} · ${N.vecColFromFractions(plane.n)} = ${N.fmt(nDotU)}`),
  ];
  if (nDotU.isZero()) {
    const sOk = nDotS.equals(plane.d);
    stepsB.push(
      T(
        `Das Skalarprodukt ist 0 — ${N.vecArrow("v")} steht senkrecht auf ${N.vecArrow("n")}, verläuft also in Richtung der Ebene. Stützpunkt ${N.vecArrow("s")} in die Ebenengleichung eingesetzt: ${sOk ? "erfüllt — g liegt in E." : "nicht erfüllt — g ist parallel zu E."}`
      )
    );
  } else {
    stepsB.push(T("Das Skalarprodukt ist ungleich 0 — Richtungs- und Normalenvektor stehen nicht senkrecht aufeinander, die Gerade schneidet die Ebene in genau einem Punkt."));
  }

  const extras = [];
  if (relation === "schneidend") {
    extras.push({ label: "Schnittpunkt", value: N.pointHTML("S", point) });
    const angleDeg = angleDegSin(u, plane.n);
    extras.push({
      label: "Schnittwinkel",
      value: `sin(φ) = |${N.vecArrow("v")} · ${N.vecArrow("n")}| / (|${N.vecArrow("v")}| · |${N.vecArrow("n")}|) ⇒ φ ≈ ${N.fmtApprox(angleDeg)}°`,
    });
  }
  if (relation === "parallel") {
    const distNum = Math.abs(plane.d.sub(nDotS).toNumber()) / Math.sqrt(squaredLength(plane.n).toNumber());
    extras.push({ label: "Abstand", value: `d(g,E) ≈ ${N.fmtApprox(distNum)} LE` });
  }

  const labelMap = {
    liegt_in: "Die Gerade g liegt vollständig in der Ebene E.",
    parallel: "Die Gerade g ist echt parallel zur Ebene E.",
    schneidend: "Die Gerade g schneidet die Ebene E in genau einem Punkt.",
  };
  return {
    relation,
    relationLabel: labelMap[relation],
    methods: [
      { title: "Verfahren 1: Einsetzverfahren (LGS)", steps: stepsA },
      { title: "Verfahren 2: Skalarprodukt", steps: stepsB },
    ],
    extras,
  };
}
