// Lagebeziehungen zwischen Punkten, Geraden und Ebenen im R^3 — Klassifikation, Kennwerte
// (Schnittpunkt/-gerade, Abstand) und zwei vollständig ausformulierte Lösungswege je Fall.

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
} from "./vectors.js";
import * as N from "./notation.js";

function T(html) {
  return { kind: "text", html };
}
function E(html) {
  return { kind: "eq", html };
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
    methodA: { title: "Verfahren 1: Koordinatenvergleich", steps: stepsA },
    methodB: { title: "Verfahren 2: Verbindungsvektor", steps: stepsB },
    extras,
  };
}

// ---------- 2. Punkt – Gerade ----------

export function pointLine(P, s, u) {
  const w = vSub(P, s);
  const idx0 = [0, 1, 2].find((i) => !u[i].isZero());
  const stepsA = [T(`<strong>Verfahren 1 (LGS über die Koordinatengleichungen):</strong> Liegt P auf g, muss es ein r geben mit P = ${N.vecArrow("s")} + r·${N.vecArrow("u")}.`)];
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
    T(`<strong>Verfahren 2 (Kreuzprodukt):</strong> P liegt genau dann auf g, wenn der Verbindungsvektor ${N.vecArrow("sP")} = P − ${N.vecArrow("s")} parallel zu ${N.vecArrow("u")} ist, d. h. wenn ${N.vecArrow("sP")} × ${N.vecArrow("u")} = ${N.vecArrow("0")} ist.`),
    E(`${N.vecArrow("sP")} = ${N.vecColFromFractions(w)}`),
    E(`${N.vecArrow("sP")} × ${N.vecArrow("u")} = ${N.vecColFromFractions(cr)}`),
    T(onLine ? "Das Kreuzprodukt ist der Nullvektor — die Vektoren sind parallel." : "Das Kreuzprodukt ist nicht der Nullvektor."),
  ];

  const extras = [];
  if (!onLine) {
    const distSq = squaredLength(cr).div(squaredLength(u));
    extras.push({ label: "Abstand", value: `d(P,g) = |${N.vecArrow("sP")} × ${N.vecArrow("u")}| / |${N.vecArrow("u")}| ≈ ${N.fmtApprox(Math.sqrt(distSq.toNumber()))} LE` });
  }

  return {
    relation: onLine ? "liegt_auf" : "liegt_nicht_auf",
    relationLabel: onLine ? "Der Punkt P liegt auf der Geraden g." : "Der Punkt P liegt nicht auf der Geraden g.",
    methodA: { title: "Verfahren 1: Lineares Gleichungssystem", steps: stepsA },
    methodB: { title: "Verfahren 2: Kreuzprodukt", steps: stepsB },
    extras,
  };
}

// ---------- 3. Punkt – Ebene ----------

export function pointPlane(P, plane) {
  const w = vSub(P, plane.s);
  const solved = solveLinear2x2(plane.u, plane.v, w);
  const stepsA = [T(`<strong>Verfahren 1 (LGS in Parameterform):</strong> Liegt P in E, gibt es r, t mit P = ${N.vecArrow("s")} + r·${N.vecArrow("u")} + t·${N.vecArrow("v")}.`)];
  stepsA.push(
    E([0, 1, 2].map((i) => `${["I", "II", "III"][i]}: ${N.fmt(P[i])} = ${N.fmt(plane.s[i])} + r·${N.fmt(plane.u[i])} + t·${N.fmt(plane.v[i])}`).join("<br>"))
  );
  let consistentA = false;
  if (solved) {
    const { x: r, y: t, i, j } = solved;
    const k = [0, 1, 2].find((x) => x !== i && x !== j);
    stepsA.push(T(`Aus ${["I", "II", "III"][i]} und ${["I", "II", "III"][j]} folgt r = ${N.fmt(r)}, t = ${N.fmt(t)}. Einsetzen in ${["I", "II", "III"][k]} zur Kontrolle:`));
    const lhs = plane.s[k].add(plane.u[k].mul(r)).add(plane.v[k].mul(t));
    const ok = lhs.equals(P[k]);
    stepsA.push(
      E(`${["I", "II", "III"][k]}: ${N.fmt(plane.s[k])} + ${N.fmt(r)}·${N.fmt(plane.u[k])} + ${N.fmt(t)}·${N.fmt(plane.v[k])} = ${N.fmt(lhs)} ${ok ? "=" : "≠"} ${N.fmt(P[k])} ${ok ? "✓" : "✗"}`)
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
    methodA: { title: "Verfahren 1: LGS in Parameterform", steps: stepsA },
    methodB: { title: "Verfahren 2: Koordinatenform (Einsetzen)", steps: stepsB },
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
        `Die Richtungsvektoren ${N.vecArrow(`u${N.sub(1)}`)} und ${N.vecArrow(`u${N.sub(2)}`)} sind parallel (linear abhängig) — zwei der drei Gleichungen legen r und t nicht mehr eindeutig fest. Stattdessen wird geprüft, ob der Verbindungsvektor der Stützpunkte ebenfalls parallel zu ${N.vecArrow(`u${N.sub(1)}`)} ist:`
      )
    );
    stepsA.push(E(`(${N.vecArrow(`s${N.sub(2)}`)} − ${N.vecArrow(`s${N.sub(1)}`)}) × ${N.vecArrow(`u${N.sub(1)}`)} = ${N.vecColFromFractions(crossCheck)}`));
    relation = identical ? "identisch" : "parallel";
    stepsA.push(
      T(
        identical
          ? "Der Verbindungsvektor ist ebenfalls parallel zu u1 — die Stützpunkte liegen auf derselben Geraden."
          : "Der Verbindungsvektor ist nicht parallel zu u1 — die Geraden sind echt parallel, aber verschieden."
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
      stepsA.push(T("Die Probe stimmt — die Geraden schneiden sich in genau einem Punkt."));
    } else {
      relation = "windschief";
      stepsA.push(T("Die Probe stimmt nicht — es gibt kein gemeinsames Paar (r,t). Die Geraden sind windschief."));
    }
  }

  const stepsB = [
    T(
      `<strong>Verfahren 2 (Spatprodukt):</strong> Sind ${N.vecArrow(`u${N.sub(1)}`)}, ${N.vecArrow(`u${N.sub(2)}`)} und der Verbindungsvektor ${N.vecArrow(`s${N.sub(1)}s${N.sub(2)}`)} = ${N.vecArrow(`s${N.sub(2)}`)} − ${N.vecArrow(`s${N.sub(1)}`)} komplanar (Spatprodukt = 0), liegen die Geraden in einer gemeinsamen Ebene.`
    ),
    E(`${N.vecArrow(`s${N.sub(1)}s${N.sub(2)}`)} = ${N.vecColFromFractions(w)}`),
    E(`[${N.vecArrow(`u${N.sub(1)}`)}, ${N.vecArrow(`u${N.sub(2)}`)}, ${N.vecArrow(`s${N.sub(1)}s${N.sub(2)}`)}] = ${N.vecArrow(`u${N.sub(1)}`)} · (${N.vecArrow(`u${N.sub(2)}`)} × ${N.vecArrow(`s${N.sub(1)}s${N.sub(2)}`)}) = ${N.fmt(spat)}`),
  ];
  if (!spat.isZero()) {
    stepsB.push(T("Das Spatprodukt ist ungleich 0 — die drei Vektoren sind nicht komplanar. Die Geraden sind windschief."));
  } else {
    stepsB.push(T("Das Spatprodukt ist 0 — die Geraden liegen in einer gemeinsamen Ebene (parallel, identisch oder schneidend)."));
    const crossU = cross(u1, u2);
    stepsB.push(E(`${N.vecArrow(`u${N.sub(1)}`)} × ${N.vecArrow(`u${N.sub(2)}`)} = ${N.vecColFromFractions(crossU)}`));
    stepsB.push(
      T(
        parU
          ? "Das Kreuzprodukt ist der Nullvektor — die Richtungsvektoren sind parallel (identisch oder echt parallel, siehe Verfahren 1)."
          : "Das Kreuzprodukt ist nicht der Nullvektor — die Richtungsvektoren sind nicht parallel, die Geraden schneiden sich also in genau einem Punkt."
      )
    );
  }

  const extras = [];
  if (relation === "schneidend" && intersection) extras.push({ label: "Schnittpunkt", value: N.pointHTML("S", intersection) });
  if (relation === "parallel") {
    const distSq = squaredLength(cross(w, u1)).div(squaredLength(u1));
    extras.push({ label: "Abstand", value: `d(g,h) ≈ ${N.fmtApprox(Math.sqrt(distSq.toNumber()))} LE` });
  }
  if (relation === "windschief") {
    const distSq = spat.mul(spat).div(squaredLength(cross(u1, u2)));
    extras.push({ label: "Abstand", value: `d(g,h) = |[${N.vecArrow(`u${N.sub(1)}`)},${N.vecArrow(`u${N.sub(2)}`)},${N.vecArrow(`s${N.sub(1)}s${N.sub(2)}`)}]| / |${N.vecArrow(`u${N.sub(1)}`)}×${N.vecArrow(`u${N.sub(2)}`)}| ≈ ${N.fmtApprox(Math.sqrt(distSq.toNumber()))} LE` });
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
    methodA: { title: "Verfahren 1: Gleichsetzungsverfahren (LGS)", steps: stepsA },
    methodB: { title: "Verfahren 2: Spatprodukt", steps: stepsB },
    extras,
  };
}

// ---------- 5. Ebene – Ebene ----------

export function planePlane(E1, E2) {
  const parN = isParallel(E1.n, E2.n);

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
  const stepsA = [T(`<strong>Verfahren 1 (LGS aus beiden Koordinatenformen):</strong>`), E(`${eqI}<br>${eqII}`)];

  const elim = eliminateVariable(E1, E2);
  const remainIdx = [0, 1, 2].filter((i) => i !== elim.idx);
  stepsA.push(T(`Kombination ${N.fmt(elim.lambda)}·I + (${N.fmt(elim.mu)})·II eliminiert ${VN[elim.idx]}:`));
  const comboStr = N.fmtLinearCombo(remainIdx.map((i) => ({ coeff: elim.coeffs[i], varHtml: VN[i] })));
  stepsA.push(E(`III: ${comboStr} = ${N.fmt(elim.d)}`));

  let relation,
    schnittgerade = null;
  const allZero = remainIdx.every((i) => elim.coeffs[i].isZero());
  if (allZero) {
    if (elim.d.isZero()) {
      relation = "identisch";
      stepsA.push(T("Gleichung III wird zu 0 = 0 — für alle x wahr. Gleichung II ist ein Vielfaches von I. Die Ebenen sind identisch."));
    } else {
      relation = "parallel";
      stepsA.push(T(`Gleichung III wird zu 0 = ${N.fmt(elim.d)} — ein Widerspruch. Das LGS ist unlösbar, die Ebenen sind parallel und verschieden.`));
    }
  } else {
    relation = "schneidend";
    stepsA.push(T("Gleichung III verknüpft die beiden verbliebenen Variablen linear — es gibt unendlich viele Lösungen. Die Ebenen schneiden sich in einer Geraden."));
  }

  const dir = cross(E1.n, E2.n);
  const stepsB = [
    T(`<strong>Verfahren 2 (Normalenvektoren vergleichen):</strong> Sind die Normalenvektoren ${N.vecArrow(`n${N.sub(1)}`)} und ${N.vecArrow(`n${N.sub(2)}`)} parallel, sind die Ebenen parallel oder identisch.`),
    E(`${N.vecArrow(`n${N.sub(1)}`)} × ${N.vecArrow(`n${N.sub(2)}`)} = ${N.vecColFromFractions(dir)}`),
  ];
  if (parN) {
    const sOk = dot(E2.n, E1.s).equals(E2.d);
    stepsB.push(
      T(
        `Das Kreuzprodukt ist der Nullvektor — die Normalenvektoren sind parallel. Ein Stützpunkt von E1 in E2 eingesetzt: ${sOk ? "erfüllt die Gleichung → die Ebenen sind identisch." : "erfüllt die Gleichung nicht → die Ebenen sind echt parallel."}`
      )
    );
  } else {
    stepsB.push(T(`Das Kreuzprodukt ist nicht der Nullvektor — die Ebenen schneiden sich in einer Geraden mit Richtungsvektor ${N.vecArrow(`n${N.sub(1)}`)} × ${N.vecArrow(`n${N.sub(2)}`)}.`));
    const pt = intersectionPointOfPlanes(E1, E2, dir);
    schnittgerade = { s: pt, u: dir };
    stepsB.push(T("Ein Punkt der Schnittgeraden ergibt sich, indem man die Koordinate, deren Richtungsvektor-Komponente ungleich 0 ist, auf 0 setzt und das verbleibende 2×2-System löst:"));
    stepsB.push(E(N.lineHTML("h", pt, dir)));
  }

  const extras = [];
  if (relation === "schneidend" && schnittgerade) {
    extras.push({ label: "Schnittgerade", value: N.lineHTML("h", schnittgerade.s, schnittgerade.u) });
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
    methodA: { title: "Verfahren 1: LGS aus den Koordinatenformen", steps: stepsA },
    methodB: { title: "Verfahren 2: Normalenvektoren", steps: stepsB },
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
    T(`<strong>Verfahren 2 (Skalarprodukt aus Richtungs- und Normalenvektor):</strong> g ist parallel zu E (oder liegt in E), wenn ${N.vecArrow("u")} senkrecht zu ${N.vecArrow("n")} steht, d. h. wenn ${N.vecArrow("u")} · ${N.vecArrow("n")} = 0 ist.`),
    E(`${N.vecArrow("u")} · ${N.vecArrow("n")} = ${N.vecColFromFractions(u)} · ${N.vecColFromFractions(plane.n)} = ${N.fmt(nDotU)}`),
  ];
  if (nDotU.isZero()) {
    const sOk = nDotS.equals(plane.d);
    stepsB.push(
      T(
        `Das Skalarprodukt ist 0 — ${N.vecArrow("u")} steht senkrecht auf ${N.vecArrow("n")}, verläuft also in Richtung der Ebene. Stützpunkt ${N.vecArrow("s")} in die Ebenengleichung eingesetzt: ${sOk ? "erfüllt — g liegt in E." : "nicht erfüllt — g ist parallel zu E."}`
      )
    );
  } else {
    stepsB.push(T("Das Skalarprodukt ist ungleich 0 — Richtungs- und Normalenvektor stehen nicht senkrecht aufeinander, die Gerade schneidet die Ebene in genau einem Punkt."));
  }

  const extras = [];
  if (relation === "schneidend") extras.push({ label: "Schnittpunkt", value: N.pointHTML("S", point) });
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
    methodA: { title: "Verfahren 1: Einsetzverfahren (LGS)", steps: stepsA },
    methodB: { title: "Verfahren 2: Skalarprodukt", steps: stepsB },
    extras,
  };
}
