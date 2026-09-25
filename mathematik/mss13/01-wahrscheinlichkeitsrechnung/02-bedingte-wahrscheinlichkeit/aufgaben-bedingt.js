// Die sechzehn Übungsaufgaben zu „Bedingte Wahrscheinlichkeit“ — vier je Stufe.
//
//   einfach   — ein Schritt: reduzierte Ergebnismenge, Gegenast, Pfad, Zeile der Vierfeldertafel.
//   mittel    — die Formel, die Spalte als Bedingung, zwei Pfade, die zweite Stufe aus der Tafel.
//   schwierig — mit Stolperstelle: P_B(Ā), die Sehschwäche als Pfadsumme, P_A(B) gegen P(A ∩ B)
//               im Text, P(A) zurückrechnen.
//   komplex   — reduzierte Ergebnismenge mit zwei Würfeln, P_Ā(B) aus drei Angaben, Text mit
//               absoluten Zahlen, und die überraschende Frage nach der zweiten Kugel.
//
// Kein Vorgriff auf Thema 3: Gesucht ist nie P_B(A) aus einem Baum, der zuerst nach A verzweigt —
// das Umdrehen ist dort das eigentliche Thema. P_B(A) kommt nur aus einer Vierfeldertafel (so wie
// in Abschnitt 3).
//
// Schreibweise nach Bigalke/Köhler: P_A(B). Die Musterlösungen nennen einmal auch P(B | A).

"use strict";

const ZAHLFORMATE = new Map();
function zahlformat(stellen) {
  let f = ZAHLFORMATE.get(stellen);
  if (!f) ZAHLFORMATE.set(stellen, (f = new Intl.NumberFormat("de-DE", { maximumFractionDigits: stellen })));
  return f;
}
function num(x, stellen = 4) {
  const f = Math.pow(10, stellen);
  const g = Math.round(x * f) / f;
  return zahlformat(stellen).format(g === 0 ? 0 : g).replace("-", "−");
}
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function nahe(val, soll, tol) {
  return Number.isFinite(val) && Number.isFinite(soll) && Math.abs(val - soll) <= tol;
}
function paarweiseVerschieden(werte, eps) {
  const echt = werte.filter((x) => Number.isFinite(x));
  return echt.every((x, i) => echt.every((y, j) => i === j || Math.abs(x - y) > eps));
}
function ohneKollision(kandidaten, werte, eps) {
  const sauber = kandidaten.filter((k) => paarweiseVerschieden(werte(k), eps));
  if (kandidaten.length > 20 && sauber.length < 2) throw new Error("Aufgabengenerator: fast alle Kandidaten kollidieren — vermutlich steht ein Wert doppelt in der Liste");
  if (!sauber.length) throw new Error("Aufgabengenerator ohne gültige Kandidaten");
  return pick(sauber);
}
function ohneFeldKollision(kandidaten, gruppen, eps) {
  const sauber = kandidaten.filter((k) => gruppen(k).every((g) => paarweiseVerschieden(g, eps)));
  if (kandidaten.length > 20 && sauber.length < 2) throw new Error("Aufgabengenerator: fast alle Kandidaten kollidieren — vermutlich steht ein Wert doppelt in der Liste");
  if (!sauber.length) throw new Error("Aufgabengenerator ohne gültige Kandidaten");
  return pick(sauber);
}
function glatt(x, stellen = 4) {
  const f = Math.pow(10, stellen);
  return Math.abs(Math.round(x * f) - x * f) < 1e-6;
}
function spaeter(bauen) {
  let liste = null;
  return () => (liste ??= bauen());
}
function bruch(z, n) {
  return `<span class="bruch"><span class="z">${z}</span><span class="n">${n}</span></span>`;
}
const P_ = (a, b) => `P<sub>${a}</sub>(${b})`;

// Eingaben: Dezimalkomma, Prozent und Brüche.
export function parseZahl(raw) {
  if (raw == null) return NaN;
  let s = String(raw).trim().replace(/\s/g, "").replace(/−/g, "-");
  const b = s.match(/^(-?\d+(?:,\d+)?)\/(\d+(?:,\d+)?)$/);
  if (b) {
    const z = parseFloat(b[1].replace(",", ".")), n = parseFloat(b[2].replace(",", "."));
    return n === 0 ? NaN : z / n;
  }
  const prozent = s.endsWith("%");
  if (prozent) s = s.slice(0, -1);
  if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) s = s.replace(/\./g, "");
  s = s.replace(",", ".");
  if (!/^-?\d*\.?\d+$/.test(s)) return NaN;
  const v = parseFloat(s);
  return prozent ? v / 100 : v;
}

const WAHRSCH = `<br><span class="progress-note">Gib die Wahrscheinlichkeit als Dezimalzahl (auf vier Stellen), in Prozent oder als Bruch ein.</span>`;
const TOL = 0.0006;
const EPS = 0.002;

// ================= einfach =================

// ---------- E1: reduzierte Ergebnismenge ----------
const E1_EREIGNISSE = [
  { name: "„gerade“", test: (z) => z % 2 === 0 },
  { name: "„ungerade“", test: (z) => z % 2 === 1 },
  { name: "„größer als 3“", test: (z) => z > 3 },
  { name: "„kleiner als 5“", test: (z) => z < 5 },
  { name: "„Primzahl“", test: (z) => [2, 3, 5, 7, 11].includes(z) },
  { name: "„durch 3 teilbar“", test: (z) => z % 3 === 0 },
];
const E1_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const m of [6, 8, 10, 12]) for (const A of E1_EREIGNISSE) for (const B of E1_EREIGNISSE) {
    if (A === B) continue;
    const a = [], ab = [], b = [];
    for (let z = 1; z <= m; z++) { if (A.test(z)) a.push(z); if (B.test(z)) b.push(z); if (A.test(z) && B.test(z)) ab.push(z); }
    if (a.length < 2 || ab.length < 1 || ab.length === a.length) continue;
    out.push({ m, A, B, a, b, ab });
  }
  return out;
});
function generateE1() {
  const k = ohneKollision(E1_KANDIDATEN(), (v) => [v.ab.length / v.a.length, v.ab.length / v.m, v.b.length / v.m, v.ab.length / v.b.length], EPS);
  const { m, A, B, a, b, ab } = k;
  return {
    promptHtml: `Ein fairer Würfel mit ${m} Seiten (1 bis ${m}) wird geworfen. Man erfährt nur: Das Ergebnis ist ${A.name} (Ereignis A).<br>` +
      `<strong>Mit welcher Wahrscheinlichkeit ist es dann auch ${B.name} (Ereignis B)?</strong> Gesucht ist ${P_("A", "B")}.` + WAHRSCH,
    correct: ab.length / a.length,
    tolerance: TOL,
    placeholder: "P_A(B)",
    hinweis: (roh, v) => {
      if (nahe(v, ab.length / m, TOL)) return `Das ist P(A ∩ B) — gezählt in ganz Ω. Weil A schon feststeht, ist die Ergebnismenge auf Ω<sub>A</sub> = A geschrumpft: Nur ${a.length} Ergebnisse sind noch möglich.`;
      if (nahe(v, b.length / m, TOL)) return "Das ist P(B) ohne jede Information. Die Bedingung A schränkt die möglichen Ergebnisse aber ein.";
      if (nahe(v, ab.length / b.length, TOL)) return `Das ist ${P_("B", "A")} — die Bedingung vertauscht. Gewusst wird A, also wird innerhalb von A gezählt.`;
      return `Schreibe A als Menge auf und zähle, wie viele davon auch zu B gehören.`;
    },
    tipps: [`A = {${a.join("; ")}}`, `A ∩ B = {${ab.join("; ")}}`],
    musterloesungHtml: `Reduzierte Ergebnismenge Ω<sub>A</sub> = A = {${a.join("; ")}}, davon in B: {${ab.join("; ")}}.<br>` +
      `${P_("A", "B")} = ${bruch("|A ∩ B|", "|A|")} = ${bruch(ab.length, a.length)} = <strong>${num(ab.length / a.length)}</strong>`,
  };
}

// ---------- E2: der Gegenast ----------
const E2_KANDIDATEN = spaeter(() => {
  const out = [];
  for (let t = 5; t <= 95; t++) for (const pa of [0.3, 0.4, 0.5, 0.6, 0.7]) out.push({ pab: t / 100, pa });
  return out;
});
function generateE2() {
  const k = ohneKollision(E2_KANDIDATEN(), (v) => [1 - v.pab, v.pab, v.pa * (1 - v.pab), 1 - v.pa], EPS);
  const { pab, pa } = k;
  return {
    promptHtml: `In einem Baumdiagramm verzweigt die erste Stufe nach A und Ā mit P(A) = ${num(pa, 2)}. Am Ast von A nach B steht <strong>${P_("A", "B")} = ${num(pab, 2)}</strong>.<br>` +
      `<strong>Welche Wahrscheinlichkeit steht am anderen Ast nach A, also bei ${P_("A", "B̄")}?</strong>` + WAHRSCH,
    correct: 1 - pab,
    tolerance: TOL,
    placeholder: "P_A(B̄)",
    hinweis: (roh, v) => {
      if (nahe(v, pab, TOL)) return "Das ist der Ast nach B. Die beiden Äste, die von demselben Knoten ausgehen, ergeben zusammen 1.";
      if (nahe(v, pa * (1 - pab), TOL)) return "Das ist die Pfadwahrscheinlichkeit P(A ∩ B̄). Am Ast selbst steht nur die Wahrscheinlichkeit der zweiten Stufe.";
      if (nahe(v, 1 - pa, TOL)) return "Das ist P(Ā), ein Ast der ersten Stufe.";
      return `Am Knoten A: ${P_("A", "B")} + ${P_("A", "B̄")} = 1.`;
    },
    tipps: ["Von jedem Knoten gehen Äste aus, die zusammen 1 ergeben — auch in der zweiten Stufe."],
    musterloesungHtml: `${P_("A", "B̄")} = 1 − ${P_("A", "B")} = 1 − ${num(pab, 2)} = <strong>${num(1 - pab, 2)}</strong>`,
  };
}

// ---------- E3: ein Pfad ----------
const E3_KANDIDATEN = spaeter(() => {
  const out = [];
  for (let a = 10; a <= 90; a += 5) for (let x = 5; x <= 95; x += 5) {
    if (!glatt((a * x) / 10000, 4)) continue;
    out.push({ pa: a / 100, pab: x / 100 });
  }
  return out;
});
function generateE3() {
  const k = ohneKollision(E3_KANDIDATEN(), (v) => [v.pa * v.pab, v.pab, v.pa + v.pab, v.pab / v.pa], EPS);
  const { pa, pab } = k;
  return {
    promptHtml: `Es gilt <strong>P(A) = ${num(pa, 2)}</strong> und <strong>${P_("A", "B")} = ${num(pab, 2)}</strong>.<br><strong>Berechne P(A ∩ B).</strong>` + WAHRSCH,
    correct: pa * pab,
    tolerance: TOL,
    placeholder: "P(A ∩ B)",
    hinweis: (roh, v) => {
      if (nahe(v, pab, TOL)) return `${P_("A", "B")} ist nur der Anteil von B <em>innerhalb</em> von A. P(A ∩ B) ist der Anteil an allen: ein Anteil vom Anteil.`;
      if (nahe(v, pa + pab, TOL)) return "Entlang des Pfades wird multipliziert.";
      if (nahe(v, pab / pa, TOL)) return "Geteilt wird, wenn man vom Pfad zurück zum Ast will. Hier geht es vom Ast zum Pfad: multiplizieren.";
      return "Pfadmultiplikationsregel: P(A ∩ B) = P(A) · P_A(B).";
    },
    tipps: ["Zeichne den Pfad A → B."],
    musterloesungHtml: `P(A ∩ B) = P(A) · ${P_("A", "B")} = ${num(pa, 2)} · ${num(pab, 2)} = <strong>${num(pa * pab)}</strong>`,
  };
}

// ---------- E4: Zeile der Vierfeldertafel ----------
const E4_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const nA of [40, 50, 60, 80, 100, 120, 125, 150, 200, 250]) for (let nAB = 5; nAB < nA; nAB += 5) {
    if (!glatt(nAB / nA, 4)) continue;
    for (const nAq of [60, 100, 150]) for (const nAqB of [20, 30, 45]) out.push({ nA, nAB, nAq, nAqB });
  }
  return out;
});
function generateE4() {
  const k = ohneKollision(E4_KANDIDATEN(), (v) => {
    const N = v.nA + v.nAq, nB = v.nAB + v.nAqB;
    return [v.nAB / v.nA, v.nAB / N, v.nAB / nB, v.nA / N];
  }, EPS);
  const { nA, nAB, nAq, nAqB } = k;
  const N = nA + nAq, nB = nAB + nAqB;
  return {
    promptHtml: `Eine Befragung von ${N} Personen ergab:` +
      `<table class="vft-mini"><tr><th></th><th>App</th><th>keine App</th><th>Σ</th></tr>` +
      `<tr><th>unter 30 (A)</th><td>${nAB}</td><td>${nA - nAB}</td><td>${nA}</td></tr>` +
      `<tr><th>30 und älter (Ā)</th><td>${nAqB}</td><td>${nAq - nAqB}</td><td>${nAq}</td></tr>` +
      `<tr><th>Σ</th><td>${nB}</td><td>${N - nB}</td><td>${N}</td></tr></table>` +
      `<strong>Eine befragte Person ist unter 30. Mit welcher Wahrscheinlichkeit nutzt sie die App?</strong> (Zahlen im Text: A: ${nA}, A ∩ App: ${nAB}, alle: ${N}, App: ${nB})` + WAHRSCH,
    correct: nAB / nA,
    tolerance: TOL,
    placeholder: "P_A(App)",
    hinweis: (roh, v) => {
      if (nahe(v, nAB / N, TOL)) return "Das ist der Anteil an <em>allen</em> Befragten, P(A ∩ App). Die Bedingung „unter 30“ beschränkt auf die Zeile A.";
      if (nahe(v, nAB / nB, TOL)) return "Das ist die Spalte als Bedingung: „Wer die App nutzt, ist mit welcher Wahrscheinlichkeit unter 30?“ Gefragt ist umgekehrt.";
      if (nahe(v, nA / N, TOL)) return "Das ist P(A), der Anteil der unter 30-Jährigen.";
      return "Bedingung = die Zeile, in der du zählst.";
    },
    tipps: ["Die Bedingung „unter 30“ ist die Zeile A — dort wird gezählt."],
    musterloesungHtml: `${P_("A", "App")} = ${bruch("|A ∩ App|", "|A|")} = ${bruch(nAB, nA)} = <strong>${num(nAB / nA)}</strong>`,
  };
}

// ================= mittel =================

// ---------- M1: die Formel ----------
const M1_KANDIDATEN = spaeter(() => {
  const out = [];
  for (let a = 20; a <= 80; a += 4) for (let ab = 2; ab < a; ab += 2) {
    if (!glatt(ab / a, 4)) continue;
    out.push({ pa: a / 100, pab: ab / 100 });
  }
  return out;
});
function generateM1() {
  const k = ohneKollision(M1_KANDIDATEN(), (v) => [v.pab / v.pa, v.pab * v.pa, v.pa / v.pab, v.pab], EPS);
  const { pa, pab } = k;
  return {
    promptHtml: `Für zwei Ereignisse gilt <strong>P(A) = ${num(pa, 2)}</strong> und <strong>P(A ∩ B) = ${num(pab, 2)}</strong>.<br><strong>Berechne ${P_("A", "B")}.</strong>` + WAHRSCH,
    correct: pab / pa,
    tolerance: TOL,
    placeholder: "P_A(B)",
    hinweis: (roh, v) => {
      if (nahe(v, pab * pa, TOL)) return "Multipliziert statt geteilt: P(A ∩ B) ist schon das Produkt P(A) · P_A(B). Um den Ast zurückzubekommen, teilt man durch P(A).";
      if (nahe(v, pa / pab, TOL)) return "Zähler und Nenner vertauscht — eine Wahrscheinlichkeit kann nicht größer als 1 sein.";
      if (nahe(v, pab, TOL)) return "Das ist P(A ∩ B) selbst, der Anteil an allen. Gefragt ist der Anteil innerhalb von A.";
      return "P_A(B) = P(A ∩ B) : P(A).";
    },
    tipps: ["Pfadmultiplikation: P(A) · P_A(B) = P(A ∩ B). Nach P_A(B) auflösen."],
    musterloesungHtml: `${P_("A", "B")} = ${bruch("P(A ∩ B)", "P(A)")} = ${bruch(num(pab, 2), num(pa, 2))} = <strong>${num(pab / pa)}</strong><br>` +
      `<em>Schreibweise:</em> In manchen Büchern steht dafür P(B | A) — „B unter der Bedingung A“.`,
  };
}

// ---------- M2: die Spalte als Bedingung ----------
const M2_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const nAB of [12, 18, 24, 30, 36, 45, 48, 60]) for (const nAqB of [6, 12, 15, 20, 24, 30, 40]) for (const nAqBq of [30, 50, 80, 100]) for (const nABq of [10, 20, 40, 60]) {
    const nB = nAB + nAqB;
    if (!glatt(nAB / nB, 4)) continue;
    out.push({ nAB, nAqB, nABq, nAqBq });
  }
  return out;
});
function generateM2() {
  const k = ohneKollision(M2_KANDIDATEN(), (v) => {
    const nA = v.nAB + v.nABq, nB = v.nAB + v.nAqB, N = nA + v.nAqB + v.nAqBq;
    return [v.nAB / nB, v.nAB / nA, v.nAB / N, v.nAqB / nB];
  }, EPS);
  const { nAB, nAqB, nABq, nAqBq } = k;
  const nA = nAB + nABq, nB = nAB + nAqB, N = nA + nAqB + nAqBq;
  return {
    promptHtml: `Die Tafel zeigt eine Befragung zu Rauchen (R) und Bronchitis (B):` +
      `<table class="vft-mini"><tr><th></th><th>B</th><th>B̄</th><th>Σ</th></tr>` +
      `<tr><th>R</th><td>${nAB}</td><td>${nABq}</td><td>${nA}</td></tr>` +
      `<tr><th>R̄</th><td>${nAqB}</td><td>${nAqBq}</td><td>${N - nA}</td></tr>` +
      `<tr><th>Σ</th><td>${nB}</td><td>${N - nB}</td><td>${N}</td></tr></table>` +
      `<strong>Eine Person hat Bronchitis. Mit welcher Wahrscheinlichkeit raucht sie?</strong> Gesucht ist ${P_("B", "R")}. (R ∩ B: ${nAB}, B: ${nB}, R: ${nA}, alle: ${N})` + WAHRSCH,
    correct: nAB / nB,
    tolerance: TOL,
    placeholder: "P_B(R)",
    hinweis: (roh, v) => {
      if (nahe(v, nAB / nA, TOL)) return `Das ist ${P_("R", "B")} — der Anteil der Kranken unter den Rauchern. Die Bedingung ist hier aber „hat Bronchitis“: Gezählt wird in der <strong>Spalte</strong> B.`;
      if (nahe(v, nAB / N, TOL)) return "Das ist P(R ∩ B), bezogen auf alle. Die Bedingung beschränkt auf die Spalte B.";
      if (nahe(v, nAqB / nB, TOL)) return "Das ist der Anteil der Nichtraucher unter den Kranken.";
      return "Bedingung „Bronchitis“ = Spalte B.";
    },
    tipps: ["Welche Gruppe ist bekannt? Die Kranken — die Spalte B."],
    musterloesungHtml: `${P_("B", "R")} = ${bruch("|R ∩ B|", "|B|")} = ${bruch(nAB, nB)} = <strong>${num(nAB / nB)}</strong><br>` +
      `Zum Vergleich: ${P_("R", "B")} = ${bruch(nAB, nA)} ≈ ${num(nAB / nA)} — eine ganz andere Zahl. Die Bedingung entscheidet, ob man in der Zeile oder in der Spalte zählt.`,
  };
}

// ---------- M3: zwei Pfade zu B ----------
const M3_KANDIDATEN = spaeter(() => {
  const out = [];
  for (let a = 10; a <= 90; a += 10) for (let x = 5; x <= 95; x += 5) for (let y = 5; y <= 95; y += 5) {
    if (x === y) continue;
    out.push({ pa: a / 100, x: x / 100, y: y / 100 });
  }
  return out;
});
function generateM3() {
  const k = ohneKollision(M3_KANDIDATEN(), (v) => [v.pa * v.x + (1 - v.pa) * v.y, v.x + v.y, v.pa * v.x, (v.x + v.y) / 2, v.pa * v.x + v.pa * v.y], EPS);
  const { pa, x, y } = k;
  const soll = pa * x + (1 - pa) * y;
  return {
    promptHtml: `Es gilt <strong>P(A) = ${num(pa, 2)}</strong>, <strong>${P_("A", "B")} = ${num(x, 2)}</strong> und <strong>${P_("Ā", "B")} = ${num(y, 2)}</strong>.<br><strong>Berechne P(B).</strong>` + WAHRSCH,
    correct: soll,
    tolerance: TOL,
    placeholder: "P(B)",
    hinweis: (roh, v) => {
      if (nahe(v, x + y, TOL)) return "Die beiden bedingten Wahrscheinlichkeiten beziehen sich auf verschiedene Gruppen — sie lassen sich nicht einfach addieren. Addiert werden Pfade.";
      if (nahe(v, pa * x, TOL)) return "Das ist nur der Pfad über A. B erreicht man auch über Ā.";
      if (nahe(v, (x + y) / 2, TOL)) return "Der Mittelwert stimmt nur, wenn A und Ā gleich wahrscheinlich sind.";
      if (nahe(v, pa * x + pa * y, TOL)) return "Am zweiten Pfad steht als erster Ast P(Ā) = " + num(1 - pa, 2) + ", nicht P(A).";
      return "Zwei Pfade führen zu B: A → B und Ā → B.";
    },
    tipps: ["Pfade A → B und Ā → B.", `P(Ā) = 1 − ${num(pa, 2)}`],
    musterloesungHtml: `P(B) = P(A) · ${P_("A", "B")} + P(Ā) · ${P_("Ā", "B")} = ${num(pa, 2)} · ${num(x, 2)} + ${num(1 - pa, 2)} · ${num(y, 2)} = <strong>${num(soll)}</strong>`,
  };
}

// ---------- M4: zweite Stufe aus der Tafel ----------
const M4_KANDIDATEN = spaeter(() => {
  const out = [];
  for (let a = 20; a <= 80; a += 5) for (let ab = 5; ab < a; ab += 5) for (let aqb = 5; aqb < 100 - a; aqb += 5) {
    const x = ab / a, y = aqb / (100 - a);
    if (!glatt(x, 4) || !glatt(y, 4)) continue;
    out.push({ pa: a / 100, pab: ab / 100, paqb: aqb / 100 });
  }
  return out;
});
function generateM4() {
  const k = ohneFeldKollision(M4_KANDIDATEN(), (v) => [
    [v.pab / v.pa, v.pab, v.pab / (v.pab + v.paqb)],
    [v.paqb / (1 - v.pa), v.paqb, v.paqb / (v.pab + v.paqb)],
  ], EPS);
  const { pa, pab, paqb } = k;
  return {
    promptHtml: `Aus einer Vierfeldertafel kennt man <strong>P(A) = ${num(pa, 2)}</strong>, <strong>P(A ∩ B) = ${num(pab, 2)}</strong> und <strong>P(Ā ∩ B) = ${num(paqb, 2)}</strong>.<br>` +
      `<strong>Bestimme die beiden Äste nach B im Baumdiagramm, das zuerst nach A verzweigt.</strong>` + WAHRSCH,
    felder: [
      { name: `${P_("A", "B")} =`, soll: pab / pa, toleranz: TOL, hinweis: (roh, v) => nahe(v, pab, TOL) ? "In die Tafel gehört der Pfad, an den Ast die bedingte Wahrscheinlichkeit: Pfad durch ersten Ast teilen." : nahe(v, pab / (pab + paqb), TOL) ? "Das ist P_B(A) — durch die Spaltensumme geteilt. Der Baum verzweigt zuerst nach A: durch die Zeilensumme P(A) teilen." : "P_A(B) = P(A ∩ B) : P(A)." },
      { name: `${P_("Ā", "B")} =`, soll: paqb / (1 - pa), toleranz: TOL, hinweis: (roh, v) => nahe(v, paqb, TOL) ? "Das ist der Pfad P(Ā ∩ B). Teile durch P(Ā) = " + num(1 - pa, 2) + "." : nahe(v, paqb / (pab + paqb), TOL) ? "Durch die Spaltensumme geteilt — nötig ist die Zeilensumme P(Ā)." : "P_Ā(B) = P(Ā ∩ B) : P(Ā)." },
    ],
    tipps: ["Tafel → Baum: Zelle durch Zeilensumme.", `P(Ā) = 1 − ${num(pa, 2)} = ${num(1 - pa, 2)}`],
    musterloesungHtml: `${P_("A", "B")} = ${bruch(num(pab, 2), num(pa, 2))} = <strong>${num(pab / pa)}</strong><br>` +
      `${P_("Ā", "B")} = ${bruch(num(paqb, 2), num(1 - pa, 2))} = <strong>${num(paqb / (1 - pa))}</strong>`,
  };
}

// ================= schwierig =================

// ---------- S1: P_B(Ā) ----------
const S1_KANDIDATEN = spaeter(() => {
  const out = [];
  for (let b = 20; b <= 80; b += 4) for (let ab = 2; ab < b; ab += 2) {
    if (!glatt(ab / b, 4)) continue;
    out.push({ pb: b / 100, pab: ab / 100 });
  }
  return out;
});
function generateS1() {
  const k = ohneKollision(S1_KANDIDATEN(), (v) => [1 - v.pab / v.pb, v.pab / v.pb, 1 - v.pab, (v.pb - v.pab) / (1 - v.pb)], EPS);
  const { pb, pab } = k;
  const soll = 1 - pab / pb;
  return {
    promptHtml: `Es gilt <strong>P(B) = ${num(pb, 2)}</strong> und <strong>P(A ∩ B) = ${num(pab, 2)}</strong>.<br><strong>Berechne ${P_("B", "Ā")}.</strong>` + WAHRSCH,
    correct: soll,
    tolerance: TOL,
    placeholder: "P_B(Ā)",
    hinweis: (roh, v) => {
      if (nahe(v, pab / pb, TOL)) return "Das ist P_B(A). Gesucht ist das Gegenereignis Ā — unter derselben Bedingung B.";
      if (nahe(v, 1 - pab, TOL)) return "Das Gegenereignis muss innerhalb der Bedingung gebildet werden: P_B(Ā) = 1 − P_B(A), nicht 1 − P(A ∩ B).";
      if (nahe(v, (pb - pab) / (1 - pb), TOL)) return "Im Nenner steht die Bedingung B, nicht B̄.";
      return "Unter der Bedingung B gilt: P_B(A) + P_B(Ā) = 1.";
    },
    tipps: ["Zuerst P_B(A) = P(A ∩ B) : P(B).", "Dann das Gegenereignis — innerhalb von B."],
    musterloesungHtml: `${P_("B", "A")} = ${bruch(num(pab, 2), num(pb, 2))} = ${num(pab / pb)}<br>` +
      `${P_("B", "Ā")} = 1 − ${num(pab / pb)} = <strong>${num(soll)}</strong><br>` +
      `Probe: P(Ā ∩ B) = ${num(pb, 2)} − ${num(pab, 2)} = ${num(pb - pab, 2)}, und ${num(pb - pab, 2)} : ${num(pb, 2)} = ${num(soll)} ✓`,
  };
}

// ---------- S2: die Sehschwäche ----------
const S2_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const m of [0.48, 0.49, 0.5, 0.51, 0.52]) for (const x of [0.06, 0.08, 0.09, 0.1, 0.12]) for (const y of [0.004, 0.005, 0.008, 0.01]) {
    const s = m * x + (1 - m) * y;
    if (!glatt(s, 5)) continue;
    out.push({ m, x, y });
  }
  return out;
});
function generateS2() {
  const k = ohneKollision(S2_KANDIDATEN(), (v) => [v.m * v.x + (1 - v.m) * v.y, v.x + v.y, (v.x + v.y) / 2, v.m * v.x], 0.0008);
  const { m, x, y } = k;
  const soll = m * x + (1 - m) * y;
  return {
    promptHtml: `${num(m * 100)} % aller Neugeborenen sind männlich. Etwa ${num(x * 100, 1)} % der Männer und ${num(y * 100, 1)} % der Frauen haben eine Rot-Grün-Sehschwäche (S).<br>` +
      `<strong>Mit welcher Wahrscheinlichkeit hat eine zufällig ausgewählte Person eine Rot-Grün-Sehschwäche?</strong>` +
      `<br><span class="progress-note">Gib die Wahrscheinlichkeit auf fünf Nachkommastellen oder in Prozent ein.</span>`,
    correct: soll,
    tolerance: 0.00006,
    placeholder: "P(S)",
    hinweis: (roh, v) => {
      if (nahe(v, x + y, 0.00006)) return "Die Prozentsätze beziehen sich auf verschiedene Gruppen (Männer, Frauen). Addiert werden die beiden Pfade, nicht die Äste.";
      if (nahe(v, (x + y) / 2, 0.00006)) return "Fast — aber Männer und Frauen sind nicht genau gleich viele. Gewichte mit " + num(m, 2) + " und " + num(1 - m, 2) + ".";
      if (nahe(v, m * x, 0.00006)) return "Das ist nur der Pfad über „männlich“.";
      return "Zwei Pfade: männlich → S und weiblich → S.";
    },
    tipps: [`${P_("M", "S")} = ${num(x, 3)}, ${P_("W", "S")} = ${num(y, 3)}`],
    musterloesungHtml: `P(S) = P(M) · ${P_("M", "S")} + P(W) · ${P_("W", "S")} = ${num(m, 2)} · ${num(x, 3)} + ${num(1 - m, 2)} · ${num(y, 3)} = <strong>${num(soll, 5)}</strong> ≈ ${num(soll * 100, 3)} %`,
  };
}

// ---------- S3: P_A(B) oder P(A ∩ B)? — der Text entscheidet ----------
const S3_KANDIDATEN = spaeter(() => {
  const out = [];
  for (let r = 20; r <= 60; r += 5) for (let rb = 2; rb < r; rb++) {
    if (!glatt(rb / r, 4)) continue;
    out.push({ pr: r / 100, prb: rb / 100 });
  }
  return out;
});
function generateS3() {
  const k = ohneKollision(S3_KANDIDATEN(), (v) => [v.prb / v.pr, v.prb, v.prb * v.pr, v.pr - v.prb], EPS);
  const { pr, prb } = k;
  return {
    promptHtml: `In einer Stadt sind ${num(pr * 100)} % der Erwachsenen Raucher. <strong>${num(prb * 100)} % aller Erwachsenen</strong> sind Raucher und haben chronischen Husten.<br>` +
      `<strong>Mit welcher Wahrscheinlichkeit hat ein Raucher chronischen Husten?</strong>` + WAHRSCH,
    correct: prb / pr,
    tolerance: TOL,
    placeholder: "P_R(H)",
    hinweis: (roh, v) => {
      if (nahe(v, prb, TOL)) return "„" + num(prb * 100) + " % aller Erwachsenen sind Raucher <em>und</em> …“ — das ist P(R ∩ H), der Anteil an allen. Gefragt ist der Anteil unter den Rauchern.";
      if (nahe(v, prb * pr, TOL)) return "P(R ∩ H) ist schon ein Pfad. Um den Ast zu bekommen, wird durch P(R) geteilt.";
      if (nahe(v, pr - prb, TOL)) return "Das ist P(R ∩ H̄): Raucher ohne Husten, bezogen auf alle.";
      return "Achte auf die Bezugsgröße: „aller Erwachsenen“ oder „der Raucher“?";
    },
    tipps: ["„von allen …“ → Schnitt; „von den Rauchern …“ → bedingt."],
    musterloesungHtml: `P(R) = ${num(pr, 2)}, P(R ∩ H) = ${num(prb, 2)}<br>${P_("R", "H")} = ${bruch(num(prb, 2), num(pr, 2))} = <strong>${num(prb / pr)}</strong>`,
  };
}

// ---------- S4: P(A) zurückrechnen ----------
const S4_KANDIDATEN = spaeter(() => {
  const out = [];
  for (let a = 10; a <= 90; a += 5) for (let x = 10; x <= 90; x += 5) {
    const ab = (a * x) / 10000;
    if (!glatt(ab, 4)) continue;
    out.push({ pa: a / 100, x: x / 100, pab: ab });
  }
  return out;
});
function generateS4() {
  const k = ohneKollision(S4_KANDIDATEN(), (v) => [v.pa, v.pab * v.x, v.x / v.pab, v.x - v.pab], EPS);
  const { pa, x, pab } = k;
  return {
    promptHtml: `Es gilt <strong>${P_("A", "B")} = ${num(x, 2)}</strong> und <strong>P(A ∩ B) = ${num(pab)}</strong>.<br><strong>Berechne P(A).</strong>` + WAHRSCH,
    correct: pa,
    tolerance: TOL,
    placeholder: "P(A)",
    hinweis: (roh, v) => {
      if (nahe(v, pab * x, TOL)) return "P(A ∩ B) = P(A) · P_A(B). Um P(A) zu bekommen, wird durch P_A(B) geteilt, nicht multipliziert.";
      if (nahe(v, x / pab, TOL)) return "Zähler und Nenner vertauscht.";
      if (nahe(v, x - pab, TOL)) return "Die Größen hängen über ein Produkt zusammen, nicht über eine Differenz.";
      return "Stelle P(A) · P_A(B) = P(A ∩ B) nach P(A) um.";
    },
    tipps: ["P(A) · P_A(B) = P(A ∩ B)"],
    musterloesungHtml: `P(A) = ${bruch("P(A ∩ B)", P_("A", "B"))} = ${bruch(num(pab), num(x, 2))} = <strong>${num(pa, 2)}</strong><br>` +
      `<strong>Probe:</strong> ${num(pa, 2)} · ${num(x, 2)} = ${num(pab)} ✓`,
  };
}

// ================= komplex =================

// ---------- K1: zwei Würfel ----------
const K1_A = [
  { name: "„die Augensumme ist mindestens 9“", t: (a, b) => a + b >= 9 },
  { name: "„die Augensumme ist höchstens 5“", t: (a, b) => a + b <= 5 },
  { name: "„beide Augenzahlen sind gerade“", t: (a, b) => a % 2 === 0 && b % 2 === 0 },
  { name: "„die Augensumme ist gerade“", t: (a, b) => (a + b) % 2 === 0 },
  { name: "„der erste Würfel zeigt eine 6“", t: (a) => a === 6 },
  { name: "„die Augensumme ist ungerade“", t: (a, b) => (a + b) % 2 === 1 },
  { name: "„die Augenzahlen unterscheiden sich um höchstens 1“", t: (a, b) => Math.abs(a - b) <= 1 },
];
const K1_B = [
  { name: "„mindestens eine 6“", t: (a, b) => a === 6 || b === 6 },
  { name: "„ein Pasch (beide gleich)“", t: (a, b) => a === b },
  { name: "„der zweite Würfel zeigt mehr als 3“", t: (a, b) => b > 3 },
  { name: "„die Augensumme ist 10“", t: (a, b) => a + b === 10 },
  { name: "„die kleinere Augenzahl ist 1“", t: (a, b) => Math.min(a, b) === 1 },
  { name: "„die Augensumme ist 7“", t: (a, b) => a + b === 7 },
];
const K1_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const A of K1_A) for (const B of K1_B) {
    let nA = 0, nAB = 0, nB = 0;
    for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) { if (A.t(a, b)) nA++; if (B.t(a, b)) nB++; if (A.t(a, b) && B.t(a, b)) nAB++; }
    if (nAB === 0 || nAB === nA) continue;
    out.push({ A, B, nA, nAB, nB });
  }
  return out;
});
function generateK1() {
  const k = ohneKollision(K1_KANDIDATEN(), (v) => [v.nAB / v.nA, v.nAB / 36, v.nB / 36, v.nAB / v.nB], EPS);
  const { A, B, nA, nAB, nB } = k;
  return {
    promptHtml: `Zwei faire Würfel werden geworfen. Man erfährt: ${A.name} (Ereignis A).<br><strong>Mit welcher Wahrscheinlichkeit gilt dann ${B.name} (Ereignis B)?</strong>` + WAHRSCH,
    correct: nAB / nA,
    tolerance: TOL,
    placeholder: "P_A(B)",
    hinweis: (roh, v) => {
      if (nahe(v, nAB / 36, TOL)) return "Das ist P(A ∩ B) von allen 36 Paaren. Bekannt ist aber schon A — gezählt wird nur unter den " + nA + " Paaren in A.";
      if (nahe(v, nB / 36, TOL)) return "Das ist P(B) ohne die Information A.";
      if (nahe(v, nAB / nB, TOL)) return "Das ist P_B(A) — die Bedingung vertauscht.";
      return "Schreibe die Paare (erster | zweiter Würfel) auf, die zu A gehören, und zähle darunter die aus B.";
    },
    tipps: ["Ω hat 36 gleich wahrscheinliche Paare.", `A enthält ${nA} Paare.`],
    musterloesungHtml: `|A| = ${nA}, |A ∩ B| = ${nAB}<br>${P_("A", "B")} = ${bruch(nAB, nA)} = <strong>${num(nAB / nA)}</strong>`,
  };
}

// ---------- K2: P_Ā(B) aus drei Angaben ----------
const K2_KANDIDATEN = spaeter(() => {
  const out = [];
  for (let a = 20; a <= 80; a += 10) for (let x = 10; x <= 90; x += 10) for (let b = 10; b <= 90; b += 5) {
    const pa = a / 100, px = x / 100, pb = b / 100;
    const aqb = pb - pa * px;
    if (aqb <= 0.01 || aqb >= 1 - pa - 0.01) continue;
    const y = aqb / (1 - pa);
    if (!glatt(y, 4)) continue;
    out.push({ pa, px, pb, y });
  }
  return out;
});
function generateK2() {
  const k = ohneKollision(K2_KANDIDATEN(), (v) => [v.y, v.pb - v.pa * v.px, v.pb - v.px, (v.pb - v.pa * v.px) / v.pb], EPS);
  const { pa, px, pb, y } = k;
  const aqb = pb - pa * px;
  return {
    promptHtml: `Es gilt <strong>P(A) = ${num(pa, 2)}</strong>, <strong>${P_("A", "B")} = ${num(px, 2)}</strong> und <strong>P(B) = ${num(pb, 2)}</strong>.<br><strong>Berechne ${P_("Ā", "B")}.</strong>` + WAHRSCH,
    correct: y,
    tolerance: TOL,
    placeholder: "P_Ā(B)",
    hinweis: (roh, v) => {
      if (nahe(v, aqb, TOL)) return "Das ist der Pfad P(Ā ∩ B). Am Ast steht der Anteil innerhalb von Ā: noch durch P(Ā) teilen.";
      if (nahe(v, pb - px, TOL)) return "P(B) setzt sich aus zwei <em>Pfaden</em> zusammen, nicht aus Ästen: Zieh den Pfad P(A) · P_A(B) ab.";
      if (nahe(v, aqb / pb, TOL)) return "Durch P(B) geteilt ergibt P_B(Ā). Die Bedingung ist hier Ā.";
      return "P(B) = P(A) · P_A(B) + P(Ā) · P_Ā(B) — nach P_Ā(B) auflösen.";
    },
    tipps: ["P(A ∩ B) = P(A) · P_A(B)", "P(Ā ∩ B) = P(B) − P(A ∩ B)", "P_Ā(B) = P(Ā ∩ B) : P(Ā)"],
    musterloesungHtml: `P(A ∩ B) = ${num(pa, 2)} · ${num(px, 2)} = ${num(pa * px)}<br>` +
      `P(Ā ∩ B) = ${num(pb, 2)} − ${num(pa * px)} = ${num(aqb)}<br>` +
      `${P_("Ā", "B")} = ${bruch(num(aqb), num(1 - pa, 2))} = <strong>${num(y)}</strong><br>` +
      `<strong>Probe:</strong> ${num(pa, 2)} · ${num(px, 2)} + ${num(1 - pa, 2)} · ${num(y)} = ${num(pb, 2)} ✓`,
  };
}

// ---------- K3: Text mit absoluten Zahlen ----------
const K3_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const N of [200, 300, 400, 500]) for (const pw of [40, 50, 60]) for (const pv of [20, 25, 30, 40]) for (const wv of [10, 20, 30, 40, 50]) {
    const W = (N * pw) / 100, V = (N * pv) / 100;
    if (!Number.isInteger(W) || !Number.isInteger(V) || wv >= W || wv >= V) continue;
    const Mv = V - wv, M = N - W;
    if (Mv <= 0 || Mv >= M) continue;
    const soll = Mv / M;
    if (!glatt(soll, 4)) continue;
    out.push({ N, pw, pv, wv, W, V, M, Mv });
  }
  return out;
});
function generateK3() {
  const k = ohneKollision(K3_KANDIDATEN(), (v) => [v.Mv / v.M, v.Mv / v.V, v.Mv / v.N, v.wv / v.W], EPS);
  const { N, pw, pv, wv, V, M, Mv } = k;
  return {
    promptHtml: `Von ${N} Beschäftigten eines Betriebs sind ${pw} % Frauen. ${pv} % aller Beschäftigten arbeiten in Teilzeit, darunter ${wv} Frauen.<br>` +
      `<strong>Ein Mann wird zufällig ausgewählt. Mit welcher Wahrscheinlichkeit arbeitet er in Teilzeit?</strong>` + WAHRSCH,
    correct: Mv / M,
    tolerance: TOL,
    placeholder: "P_Männer(Teilzeit)",
    hinweis: (roh, v) => {
      if (nahe(v, Mv / V, TOL)) return "Das ist der Männeranteil unter den Teilzeitkräften — Bedingung und Ereignis vertauscht.";
      if (nahe(v, Mv / N, TOL)) return "Das ist der Anteil der Männer in Teilzeit an allen Beschäftigten. Bekannt ist aber: Es ist ein Mann.";
      if (nahe(v, wv / ((N * pw) / 100), TOL)) return "Das gilt für Frauen. Gefragt ist nach den Männern.";
      return "Erst die Tafel mit Anzahlen füllen, dann in der Zeile „Männer“ zählen.";
    },
    tipps: ["Prozente in Anzahlen umrechnen.", `Männer in Teilzeit: ${V} − ${wv}`],
    musterloesungHtml: `Männer: ${N} − ${N - M} = ${M}; Teilzeit: ${V}; Männer in Teilzeit: ${V} − ${wv} = ${Mv}<br>` +
      `P<sub>Mann</sub>(Teilzeit) = ${bruch(Mv, M)} = <strong>${num(Mv / M)}</strong>`,
  };
}

// ---------- K4: die zweite Kugel ----------
//
// Ohne Zurücklegen ist P(2. Kugel rot) = r/n — genau wie beim ersten Zug. Das überrascht, folgt
// aber aus zwei Pfaden: r/n · (r−1)/(n−1) + b/n · r/(n−1) = r/n.
const K4_KANDIDATEN = spaeter(() => {
  const out = [];
  for (let n = 5; n <= 20; n++) for (let r = 1; r < n; r++) {
    if (!glatt(r / n, 4)) continue;
    out.push({ n, r });
  }
  return out;
});
function generateK4() {
  const k = ohneKollision(K4_KANDIDATEN(), (v) => [v.r / v.n, (v.r - 1) / (v.n - 1), v.r / (v.n - 1), (v.r / v.n) * ((v.r - 1) / (v.n - 1))], EPS);
  const { n, r } = k;
  const b = n - r;
  return {
    promptHtml: `In einer Urne liegen ${r} rote und ${b} blaue Kugeln. Zwei Kugeln werden nacheinander <strong>ohne Zurücklegen</strong> gezogen; die erste sieht man nicht an.<br>` +
      `<strong>Mit welcher Wahrscheinlichkeit ist die zweite Kugel rot?</strong>` + WAHRSCH,
    correct: r / n,
    tolerance: TOL,
    placeholder: "P(2. rot)",
    hinweis: (roh, v) => {
      if (nahe(v, (r - 1) / (n - 1), TOL)) return "Das wäre richtig, wenn man <em>wüsste</em>, dass die erste Kugel rot war — das ist P<sub>1. rot</sub>(2. rot). Weiß man es nicht, gehören beide Pfade dazu.";
      if (nahe(v, r / (n - 1), TOL)) return "Das gilt nur nach einer blauen ersten Kugel.";
      if (nahe(v, (r / n) * ((r - 1) / (n - 1)), TOL)) return "Das ist der Pfad rot → rot. Auch blau → rot endet mit einer roten zweiten Kugel.";
      return "Zwei Pfade führen zu „2. rot“: rot → rot und blau → rot.";
    },
    tipps: ["Zeichne den Baum mit beiden Stufen.", "Addiere die Pfade, die mit „2. rot“ enden."],
    musterloesungHtml: `P(2. rot) = ${bruch(r, n)} · ${bruch(r - 1, n - 1)} + ${bruch(b, n)} · ${bruch(r, n - 1)} = ${bruch(r * (r - 1) + b * r, n * (n - 1))} = ${bruch(r * (n - 1), n * (n - 1))} = <strong>${num(r / n)}</strong><br>` +
      `Überraschend? Ohne Information über die erste Kugel ist die zweite genauso „zufällig“ wie die erste. Erst die Bedingung „1. rot“ verändert die Wahrscheinlichkeit.`,
  };
}

export const AUFGABEN = [
  { schwierigkeit: "einfach", titel: "Reduzierte Ergebnismenge", generate: generateE1 },
  { schwierigkeit: "einfach", titel: "Der zweite Ast am Knoten", generate: generateE2 },
  { schwierigkeit: "einfach", titel: "Vom Ast zum Pfad", generate: generateE3 },
  { schwierigkeit: "einfach", titel: "Bedingung = Zeile", generate: generateE4 },
  { schwierigkeit: "mittel", titel: "Die Formel für P_A(B)", generate: generateM1 },
  { schwierigkeit: "mittel", titel: "Bedingung = Spalte", generate: generateM2 },
  { schwierigkeit: "mittel", titel: "Zwei Pfade zu B", generate: generateM3 },
  { schwierigkeit: "mittel", titel: "Von der Tafel an die Äste", generate: generateM4 },
  { schwierigkeit: "schwierig", titel: "Gegenereignis unter einer Bedingung", generate: generateS1 },
  { schwierigkeit: "schwierig", titel: "Rot-Grün-Sehschwäche", generate: generateS2 },
  { schwierigkeit: "schwierig", titel: "„von allen“ oder „von den …“?", generate: generateS3 },
  { schwierigkeit: "schwierig", titel: "P(A) zurückrechnen", generate: generateS4 },
  { schwierigkeit: "komplex", titel: "Zwei Würfel mit Vorwissen", generate: generateK1 },
  { schwierigkeit: "komplex", titel: "Der fehlende Ast", generate: generateK2 },
  { schwierigkeit: "komplex", titel: "Teilzeit im Betrieb", generate: generateK3 },
  { schwierigkeit: "komplex", titel: "Die zweite Kugel", generate: generateK4 },
];
