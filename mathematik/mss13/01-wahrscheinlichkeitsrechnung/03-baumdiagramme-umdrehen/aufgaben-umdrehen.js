// Die sechzehn Übungsaufgaben zu „Baumdiagramme umdrehen“ — vier je Stufe.
//
//   einfach   — ein Schritt des Umdrehens: erste Stufe des neuen Baums, eine Zelle, eine
//               Spalte der Tafel, ein umgedrehter Ast aus der Tafel.
//   mittel    — der ganze Weg: vom Baum über die Tafel zum umgedrehten Ast; mit natürlichen
//               Häufigkeiten; beide Äste eines Knotens.
//   schwierig — negativer Vorhersagewert, Fabriken und Ausschuss, Tims Stolperstelle, rückwärts.
//   komplex   — Prävalenz ändert alles, zwei Tests hintereinander, die nötige Falschpositiv-Rate,
//               drei Fabriken.
//
// Die Aufgaben rechnen den Weg der Seite nach: multiplizieren (Baum → Tafel), in der neuen
// Richtung teilen (Tafel → umgedrehter Baum). Die Regel von Bayes ist dieser Weg in einer Zeile;
// die Musterlösungen zeigen beides.

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

const WAHRSCH = `<br><span class="progress-note">Gib die Wahrscheinlichkeit auf vier Nachkommastellen gerundet, in Prozent oder als Bruch ein.</span>`;
const ANZAHL = `<br><span class="progress-note">Gib eine ganze Zahl ein.</span>`;
const TOL = 0.0006;
const EPS = 0.002;

// Der gemeinsame Kern: ein Baum (a, x, y) = (P(A), P_A(B), P_Ā(B)) und seine Umkehrung.
function umgedreht(a, x, y) {
  const ab = a * x, aqb = (1 - a) * y, abq = a * (1 - x), aqbq = (1 - a) * (1 - y);
  const b = ab + aqb;
  return { ab, aqb, abq, aqbq, b, bA: ab / b, bqA: abq / (1 - b) };
}

// Der Test-Kontext wiederholt sich; Zahlen sind Prävalenz, Sensitivität, Spezifität.
const TESTS = [
  { krank: "infiziert", name: "ein Schnelltest" },
  { krank: "erkrankt", name: "ein Screening-Test" },
];

// ================= einfach =================

// ---------- E1: die erste Stufe des umgedrehten Baums ----------
const E1_KANDIDATEN = spaeter(() => {
  const out = [];
  for (let a = 10; a <= 90; a += 10) for (let x = 5; x <= 95; x += 5) for (let y = 5; y <= 95; y += 5) {
    if (x === y) continue;
    out.push({ a: a / 100, x: x / 100, y: y / 100 });
  }
  return out;
});
function generateE1() {
  const k = ohneKollision(E1_KANDIDATEN(), (v) => [v.a * v.x + (1 - v.a) * v.y, v.x + v.y, v.a * v.x, (v.x + v.y) / 2], EPS);
  const { a, x, y } = k;
  const u = umgedreht(a, x, y);
  return {
    promptHtml: `Ein Baum verzweigt zuerst nach A: <strong>P(A) = ${num(a, 2)}</strong>, <strong>${P_("A", "B")} = ${num(x, 2)}</strong>, <strong>${P_("Ā", "B")} = ${num(y, 2)}</strong>.<br>` +
      `Er soll umgedreht werden. <strong>Welche Wahrscheinlichkeit steht im neuen Baum am ersten Ast nach B?</strong>` + WAHRSCH,
    correct: u.b,
    tolerance: TOL,
    placeholder: "P(B)",
    hinweis: (roh, v) => {
      if (nahe(v, x + y, TOL)) return "Zwei Äste aus verschiedenen Gruppen lassen sich nicht addieren. Die erste Stufe des neuen Baums ist die Spaltensumme der Tafel: zwei <strong>Pfade</strong>.";
      if (nahe(v, a * x, TOL)) return "Das ist nur die Zelle A ∩ B. Zu B führt auch der Pfad über Ā.";
      if (nahe(v, (x + y) / 2, TOL)) return "Der Mittelwert stimmt nur für P(A) = 0,5.";
      return "Erste Stufe des umgedrehten Baums = Spaltensumme = Summe der Pfade, die in B enden.";
    },
    tipps: ["Baum → Tafel: multiplizieren.", "Die neue erste Stufe ist eine Spaltensumme."],
    musterloesungHtml: `P(B) = P(A ∩ B) + P(Ā ∩ B) = ${num(a, 2)} · ${num(x, 2)} + ${num(1 - a, 2)} · ${num(y, 2)} = ${num(u.ab)} + ${num(u.aqb)} = <strong>${num(u.b)}</strong>`,
  };
}

// ---------- E2: Zuverlässigkeit aus absoluten Zahlen ----------
const E2_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const N of [1000, 2000, 5000, 10000]) for (const tp of [18, 40, 45, 48, 90, 96, 180]) for (const fp of [9, 20, 30, 45, 60, 99, 120]) {
    if (!glatt(tp / (tp + fp), 4)) continue;
    out.push({ N, tp, fp });
  }
  return out;
});
function generateE2() {
  const k = ohneKollision(E2_KANDIDATEN(), (v) => [v.tp / (v.tp + v.fp), v.tp / v.N, v.fp / (v.tp + v.fp), (v.tp + v.fp) / v.N], EPS);
  const { N, tp, fp } = k;
  const t = pick(TESTS);
  return {
    promptHtml: `Von ${num(N)} getesteten Personen erhielten ${tp + fp} ein positives Ergebnis. Davon waren ${tp} tatsächlich ${t.krank}.<br>` +
      `<strong>Mit welcher Wahrscheinlichkeit ist eine Person mit positivem Ergebnis tatsächlich ${t.krank}?</strong>` + WAHRSCH,
    correct: tp / (tp + fp),
    tolerance: TOL,
    placeholder: "P_pos(" + t.krank + ")",
    hinweis: (roh, v) => {
      if (nahe(v, tp / N, TOL)) return "Das ist der Anteil an allen Getesteten. Bekannt ist aber: Das Ergebnis ist positiv — gezählt wird unter den Positiven.";
      if (nahe(v, fp / (tp + fp), TOL)) return "Das ist der Anteil der <em>Falsch</em>-Positiven.";
      if (nahe(v, (tp + fp) / N, TOL)) return "Das ist der Anteil der positiven Ergebnisse überhaupt.";
      return `Bedingung „positiv“: ${tp} von ${tp + fp}.`;
    },
    tipps: ["Die Bedingung ist das Testergebnis."],
    musterloesungHtml: `P<sub>pos</sub>(${t.krank}) = ${bruch(tp, tp + fp)} = <strong>${num(tp / (tp + fp))}</strong>`,
  };
}

// ---------- E3: eine Zelle, hochgerechnet ----------
const E3_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const N of [1000, 2000, 5000, 10000, 20000]) for (let a = 1; a <= 20; a++) for (const x of [80, 85, 90, 95, 96, 98, 99]) {
    const z = (N * a * x) / 10000;
    if (!Number.isInteger(z)) continue;
    out.push({ N, a: a / 100, x: x / 100 });
  }
  return out;
});
function generateE3() {
  const k = ohneKollision(E3_KANDIDATEN(), (v) => [v.N * v.a * v.x, v.N * v.a, v.N * v.x, v.N * v.a * (1 - v.x)], 0.5);
  const { N, a, x } = k;
  const t = pick(TESTS);
  return {
    promptHtml: `${num(a * 100)} % einer Gruppe von ${num(N)} Personen sind ${t.krank}. ${t.name.charAt(0).toUpperCase() + t.name.slice(1)} erkennt ${num(x * 100)} % der ${t.krank}en Personen (Sensitivität).<br>` +
      `<strong>Wie viele Personen sind ${t.krank} und werden positiv getestet?</strong> (Das ist eine Zelle der Vierfeldertafel mit absoluten Zahlen.)` + ANZAHL,
    correct: N * a * x,
    tolerance: 0.5,
    placeholder: "Anzahl",
    hinweis: (roh, v) => {
      if (nahe(v, N * a, 0.5)) return "Das sind alle " + t.krank + "en Personen. Nur " + num(x * 100) + " % davon werden erkannt.";
      if (nahe(v, N * x, 0.5)) return "Die Sensitivität bezieht sich auf die " + t.krank + "en, nicht auf alle " + num(N) + ".";
      if (nahe(v, N * a * (1 - x), 0.5)) return "Das sind die " + t.krank + "en, die der Test übersieht.";
      return `Pfad „${t.krank} → positiv“, hochgerechnet auf ${num(N)}.`;
    },
    tipps: [`Erst: wie viele sind ${t.krank}? Dann: wie viele davon positiv?`],
    musterloesungHtml: `${num(N)} · ${num(a, 2)} = ${num(N * a)} ${t.krank}; davon ${num(x * 100)} %: ${num(N * a)} · ${num(x, 2)} = <strong>${num(N * a * x)}</strong>`,
  };
}

// ---------- E4: umgedrehter Ast aus der Tafel ----------
const E4_KANDIDATEN = spaeter(() => {
  const out = [];
  for (let ab = 2; ab <= 40; ab += 2) for (let aqb = 2; aqb <= 50; aqb += 2) {
    if (!glatt(ab / (ab + aqb), 4) || ab + aqb >= 90) continue;
    out.push({ ab: ab / 100, aqb: aqb / 100 });
  }
  return out;
});
function generateE4() {
  const k = ohneKollision(E4_KANDIDATEN(), (v) => [v.ab / (v.ab + v.aqb), v.ab, v.aqb / (v.ab + v.aqb), v.ab + v.aqb], EPS);
  const { ab, aqb } = k;
  const b = ab + aqb;
  return {
    promptHtml: `In einer Vierfeldertafel steht <strong>P(A ∩ B) = ${num(ab, 2)}</strong> und <strong>P(Ā ∩ B) = ${num(aqb, 2)}</strong>.<br>` +
      `<strong>Welche Wahrscheinlichkeit steht im umgedrehten Baum (erst B, dann A) am Ast von B nach A?</strong>` + WAHRSCH,
    correct: ab / b,
    tolerance: TOL,
    placeholder: "P_B(A)",
    hinweis: (roh, v) => {
      if (nahe(v, ab, TOL)) return "In der Tafel steht der Pfad. An den Ast gehört der Anteil innerhalb von B: durch die Spaltensumme teilen.";
      if (nahe(v, aqb / b, TOL)) return "Das ist der Ast von B nach Ā.";
      if (nahe(v, b, TOL)) return "Das ist P(B), der Ast der ersten Stufe.";
      return "P_B(A) = P(A ∩ B) : P(B), und P(B) ist die Spaltensumme.";
    },
    tipps: ["Spaltensumme P(B) = P(A ∩ B) + P(Ā ∩ B)."],
    musterloesungHtml: `P(B) = ${num(ab, 2)} + ${num(aqb, 2)} = ${num(b, 2)}; ${P_("B", "A")} = ${bruch(num(ab, 2), num(b, 2))} = <strong>${num(ab / b)}</strong>`,
  };
}

// ================= mittel =================

// ---------- M1: der ganze Weg ----------
const M1_KANDIDATEN = spaeter(() => {
  const out = [];
  for (let a = 10; a <= 90; a += 10) for (let x = 10; x <= 90; x += 10) for (let y = 10; y <= 90; y += 10) {
    if (x === y) continue;
    const u = umgedreht(a / 100, x / 100, y / 100);
    if (!glatt(u.bA, 4)) continue;
    out.push({ a: a / 100, x: x / 100, y: y / 100 });
  }
  return out;
});
function generateM1() {
  const k = ohneKollision(M1_KANDIDATEN(), (v) => { const u = umgedreht(v.a, v.x, v.y); return [u.bA, v.x, u.ab, v.a, v.a * v.x / (v.x + v.y)]; }, EPS);
  const { a, x, y } = k;
  const u = umgedreht(a, x, y);
  return {
    promptHtml: `Es gilt <strong>P(A) = ${num(a, 2)}</strong>, <strong>${P_("A", "B")} = ${num(x, 2)}</strong> und <strong>${P_("Ā", "B")} = ${num(y, 2)}</strong>.<br><strong>Berechne ${P_("B", "A")}.</strong>` + WAHRSCH,
    correct: u.bA,
    tolerance: TOL,
    placeholder: "P_B(A)",
    hinweis: (roh, v) => {
      if (nahe(v, x, TOL)) return `Das ist ${P_("A", "B")} — der Baum ist nicht umgedreht. Genau diese Verwechslung ist Tims Fehler.`;
      if (nahe(v, u.ab, TOL)) return "Das ist die Zelle P(A ∩ B). Noch durch die Spaltensumme P(B) teilen.";
      if (nahe(v, a, TOL)) return "P(A) ist die Wahrscheinlichkeit ohne Information. Die Information B verändert sie.";
      if (nahe(v, (a * x) / (x + y), TOL)) return "Im Nenner stehen Pfade, nicht Äste: P(B) = P(A) · P_A(B) + P(Ā) · P_Ā(B).";
      return "Multiplizieren (Baum → Tafel), dann durch die Spaltensumme teilen.";
    },
    tipps: ["P(A ∩ B) = P(A) · P_A(B)", "P(B) = Summe der beiden Pfade nach B", "P_B(A) = P(A ∩ B) : P(B)"],
    musterloesungHtml: `P(A ∩ B) = ${num(a, 2)} · ${num(x, 2)} = ${num(u.ab)}; P(Ā ∩ B) = ${num(1 - a, 2)} · ${num(y, 2)} = ${num(u.aqb)}<br>` +
      `P(B) = ${num(u.b)}<br>${P_("B", "A")} = ${bruch(num(u.ab), num(u.b))} = <strong>${num(u.bA)}</strong><br>` +
      `In einer Zeile (Regel von Bayes): ${P_("B", "A")} = ${bruch("P(A) · P<sub>A</sub>(B)", "P(A) · P<sub>A</sub>(B) + P(Ā) · P<sub>Ā</sub>(B)")}`,
  };
}

// ---------- M2: natürliche Häufigkeiten — wie viele positive Tests? ----------
const M2_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const N of [1000, 10000]) for (const p of [1, 2, 5, 10]) for (const s of [90, 95, 96, 98]) for (const sp of [90, 95, 98, 99]) {
    const kr = (N * p) / 100, tp = (kr * s) / 100, fp = ((N - kr) * (100 - sp)) / 100;
    if (![kr, tp, fp].every(Number.isInteger)) continue;
    out.push({ N, p, s, sp, kr, tp, fp });
  }
  return out;
});
function generateM2() {
  const k = ohneKollision(M2_KANDIDATEN(), (v) => [v.tp + v.fp, v.tp, v.fp, (v.N * v.s) / 100, v.kr], 0.5);
  const { N, p, s, sp, tp, fp } = k;
  return {
    promptHtml: `${num(N)} Personen werden getestet; ${p} % davon sind infiziert. Der Test erkennt ${s} % der Infizierten (Sensitivität) und ${sp} % der Nicht-Infizierten korrekt als negativ (Spezifität).<br>` +
      `<strong>Wie viele positive Testergebnisse sind zu erwarten?</strong>` + ANZAHL,
    correct: tp + fp,
    tolerance: 0.5,
    placeholder: "Anzahl",
    hinweis: (roh, v) => {
      if (nahe(v, tp, 0.5)) return "Das sind nur die richtig Positiven. Auch Nicht-Infizierte erhalten manchmal ein positives Ergebnis: " + (100 - sp) + " % von ihnen.";
      if (nahe(v, fp, 0.5)) return "Das sind nur die Falsch-Positiven. Dazu kommen die erkannten Infizierten.";
      if (nahe(v, (N * s) / 100, 0.5)) return "Die Sensitivität gilt nur für die Infizierten.";
      return "Zwei Pfade enden in „positiv“: infiziert → positiv und nicht infiziert → positiv.";
    },
    tipps: [`Infiziert: ${num((N * p) / 100)}, nicht infiziert: ${num(N - (N * p) / 100)}.`, `Falsch positiv sind ${100 - sp} % der Nicht-Infizierten.`],
    musterloesungHtml: `Richtig positiv: ${num((N * p) / 100)} · ${num(s / 100, 2)} = ${tp}<br>Falsch positiv: ${num(N - (N * p) / 100)} · ${num((100 - sp) / 100, 2)} = ${fp}<br>Positiv insgesamt: <strong>${tp + fp}</strong>`,
  };
}

// ---------- M3: positiver Vorhersagewert aus drei Prozentangaben ----------
const M3_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const p of [1, 2, 5, 10, 20]) for (const s of [80, 90, 95, 96, 98, 99]) for (const sp of [80, 90, 95, 98, 99]) {
    const tp = (p * s) / 10000, fp = ((100 - p) * (100 - sp)) / 10000;
    // Ein Bayes-Quotient ist fast nie glatt; eingegeben wird auf vier Stellen gerundet, die
    // Toleranz 0,0006 deckt das ab. Gefiltert wird nur, was keine sinnvolle Aufgabe wäre.
    if (tp / (tp + fp) > 0.995) continue;
    out.push({ p, s, sp });
  }
  return out;
});
function generateM3() {
  const k = ohneKollision(M3_KANDIDATEN(), (v) => { const tp = (v.p * v.s) / 10000, fp = ((100 - v.p) * (100 - v.sp)) / 10000; return [tp / (tp + fp), v.s / 100, tp, v.sp / 100]; }, EPS);
  const { p, s, sp } = k;
  const tp = (p * s) / 10000, fp = ((100 - p) * (100 - sp)) / 10000;
  return {
    promptHtml: `Eine Krankheit tritt bei ${p} % der Bevölkerung auf. Ein Test erkennt ${s} % der Kranken und ${sp} % der Gesunden richtig.<br>` +
      `<strong>Mit welcher Wahrscheinlichkeit ist eine positiv getestete Person tatsächlich krank?</strong>` + WAHRSCH,
    correct: tp / (tp + fp),
    tolerance: TOL,
    placeholder: "P_pos(krank)",
    hinweis: (roh, v) => {
      if (nahe(v, s / 100, TOL)) return "Das ist die Sensitivität, P<sub>krank</sub>(pos). Gefragt ist die umgekehrte Richtung — die Bedingung ist jetzt das Testergebnis.";
      if (nahe(v, tp, TOL)) return "Das ist die Zelle „krank und positiv“. Noch durch P(positiv) teilen.";
      if (nahe(v, sp / 100, TOL)) return "Die Spezifität betrifft die Gesunden, nicht die Positiven.";
      return "Baum → Tafel → umgedrehter Baum.";
    },
    tipps: ["Rechne mit 10.000 Personen, wenn dir Prozente zu abstrakt sind.", "P(pos) = zwei Pfade"],
    musterloesungHtml: `P(krank ∩ pos) = ${num(p / 100, 2)} · ${num(s / 100, 2)} = ${num(tp)}; P(gesund ∩ pos) = ${num(1 - p / 100, 2)} · ${num(1 - sp / 100, 2)} = ${num(fp)}<br>` +
      `P<sub>pos</sub>(krank) = ${bruch(num(tp), num(tp) + " + " + num(fp))} = <strong>${num(tp / (tp + fp))}</strong><br>` +
      `So klein, weil die Krankheit selten ist: Die wenigen Kranken gehen unter den vielen Falsch-Positiven unter.`,
  };
}

// ---------- M4: beide Äste nach B im umgedrehten Baum ----------
function generateM4() {
  const k = ohneFeldKollision(M1_KANDIDATEN(), (v) => {
    const u = umgedreht(v.a, v.x, v.y);
    return [[u.bA, v.x, u.ab], [1 - u.bA, 1 - v.x, u.aqb]];
  }, EPS);
  const { a, x, y } = k;
  const u = umgedreht(a, x, y);
  return {
    promptHtml: `Es gilt <strong>P(A) = ${num(a, 2)}</strong>, <strong>${P_("A", "B")} = ${num(x, 2)}</strong> und <strong>${P_("Ā", "B")} = ${num(y, 2)}</strong>.<br>` +
      `<strong>Bestimme im umgedrehten Baum die beiden Äste, die vom Knoten B ausgehen.</strong>` + WAHRSCH,
    felder: [
      { name: `${P_("B", "A")} =`, soll: u.bA, toleranz: TOL, hinweis: (roh, v) => nahe(v, x, TOL) ? "Das ist der Ast des alten Baums — nicht umgedreht." : nahe(v, u.ab, TOL) ? "Das ist die Zelle; noch durch P(B) teilen." : "P_B(A) = P(A ∩ B) : P(B)." },
      { name: `${P_("B", "Ā")} =`, soll: 1 - u.bA, toleranz: TOL, hinweis: (roh, v) => nahe(v, 1 - x, TOL) ? "Das ist P_A(B̄) aus dem alten Baum." : nahe(v, u.aqb, TOL) ? "Das ist die Zelle P(Ā ∩ B); noch durch P(B) teilen." : "Die beiden Äste an B ergeben zusammen 1." },
    ],
    tipps: ["Beide Äste am Knoten B ergeben zusammen 1 — eine gute Probe."],
    musterloesungHtml: `P(B) = ${num(u.ab)} + ${num(u.aqb)} = ${num(u.b)}<br>${P_("B", "A")} = ${bruch(num(u.ab), num(u.b))} = <strong>${num(u.bA)}</strong>; ${P_("B", "Ā")} = ${bruch(num(u.aqb), num(u.b))} = <strong>${num(1 - u.bA)}</strong><br>Probe: ${num(u.bA)} + ${num(1 - u.bA)} = 1 ✓`,
  };
}

// ================= schwierig =================

// ---------- S1: negativer Vorhersagewert ----------
const S1_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const p of [5, 10, 20, 30]) for (const s of [80, 90, 95]) for (const sp of [80, 90, 95, 98]) {
    const tn = ((100 - p) * sp) / 10000, fn = (p * (100 - s)) / 10000;
    if (tn / (tn + fn) > 0.9995) continue;   // sonst unterscheidet die Eingabe auf vier Stellen nichts mehr
    out.push({ p, s, sp });
  }
  return out;
});
function generateS1() {
  const k = ohneKollision(S1_KANDIDATEN(), (v) => { const tn = ((100 - v.p) * v.sp) / 10000, fn = (v.p * (100 - v.s)) / 10000; return [tn / (tn + fn), v.sp / 100, tn, fn / (tn + fn)]; }, EPS);
  const { p, s, sp } = k;
  const tn = ((100 - p) * sp) / 10000, fn = (p * (100 - s)) / 10000;
  return {
    promptHtml: `${p} % der Getesteten sind infiziert. Der Test erkennt ${s} % der Infizierten und ${sp} % der Nicht-Infizierten korrekt.<br>` +
      `<strong>Eine Person wird negativ getestet. Mit welcher Wahrscheinlichkeit ist sie wirklich nicht infiziert?</strong>` + WAHRSCH,
    correct: tn / (tn + fn),
    tolerance: TOL,
    placeholder: "P_neg(nicht infiziert)",
    hinweis: (roh, v) => {
      if (nahe(v, sp / 100, TOL)) return "Das ist die Spezifität, P<sub>nicht infiziert</sub>(neg) — der alte Baum. Die Bedingung ist jetzt „negativ“.";
      if (nahe(v, tn, TOL)) return "Das ist die Zelle; noch durch P(negativ) teilen.";
      if (nahe(v, fn / (tn + fn), TOL)) return "Das ist die Wahrscheinlichkeit, trotz negativem Test infiziert zu sein.";
      return "P(neg) = richtig negativ + falsch negativ.";
    },
    tipps: ["Pfade nach „negativ“: nicht infiziert → neg und infiziert → neg."],
    musterloesungHtml: `P(nicht inf. ∩ neg) = ${num(1 - p / 100, 2)} · ${num(sp / 100, 2)} = ${num(tn)}; P(inf. ∩ neg) = ${num(p / 100, 2)} · ${num(1 - s / 100, 2)} = ${num(fn)}<br>` +
      `P<sub>neg</sub>(nicht inf.) = ${bruch(num(tn), num(tn + fn))} = <strong>${num(tn / (tn + fn))}</strong>`,
  };
}

// ---------- S2: Fabriken und Ausschuss ----------
const S2_KANDIDATEN = spaeter(() => {
  const out = [];
  for (let a = 20; a <= 80; a += 10) for (const x of [1, 2, 3, 4, 5, 6, 8]) for (const y of [1, 2, 3, 4, 5, 6, 8]) {
    if (x === y) continue;
    const u = umgedreht(a / 100, x / 100, y / 100);
    if (!glatt(u.bA, 4)) continue;
    out.push({ a: a / 100, x: x / 100, y: y / 100 });
  }
  return out;
});
function generateS2() {
  const k = ohneKollision(S2_KANDIDATEN(), (v) => { const u = umgedreht(v.a, v.x, v.y); return [u.bA, v.a, v.x, u.ab]; }, EPS);
  const { a, x, y } = k;
  const u = umgedreht(a, x, y);
  return {
    promptHtml: `Ein Hersteller lässt ${num(a * 100)} % seiner Geräte in Fabrik A fertigen, den Rest in Fabrik B. In A sind ${num(x * 100)} % der Geräte defekt, in B ${num(y * 100)} %.<br>` +
      `<strong>Ein Gerät ist defekt. Mit welcher Wahrscheinlichkeit stammt es aus Fabrik A?</strong>` + WAHRSCH,
    correct: u.bA,
    tolerance: TOL,
    placeholder: "P_defekt(A)",
    hinweis: (roh, v) => {
      if (nahe(v, a, TOL)) return "Das ist der Anteil von A an <em>allen</em> Geräten. Unter den defekten ist er anders, weil die Fabriken verschieden oft Ausschuss produzieren.";
      if (nahe(v, x, TOL)) return "Das ist P<sub>A</sub>(defekt) — die Richtung vertauscht.";
      if (nahe(v, u.ab, TOL)) return "Das ist die Zelle „A und defekt“; noch durch P(defekt) teilen.";
      return "Baum: erst Fabrik, dann defekt. Umdrehen: erst defekt, dann Fabrik.";
    },
    tipps: ["P(defekt) = zwei Pfade", "P_defekt(A) = P(A ∩ defekt) : P(defekt)"],
    musterloesungHtml: `P(A ∩ d) = ${num(a, 2)} · ${num(x, 2)} = ${num(u.ab)}; P(B ∩ d) = ${num(1 - a, 2)} · ${num(y, 2)} = ${num(u.aqb)}<br>` +
      `P<sub>d</sub>(A) = ${bruch(num(u.ab), num(u.b))} = <strong>${num(u.bA)}</strong>`,
  };
}

// ---------- S3: Tims Fehler beziffern ----------
function generateS3() {
  const k = ohneKollision(S2_KANDIDATEN(), (v) => { const u = umgedreht(v.a, v.x, v.y); return [u.bA - v.x, u.bA, v.x, -(u.bA - v.x)]; }, EPS);
  const { a, x, y } = k;
  const u = umgedreht(a, x, y);
  const diff = u.bA - x;
  return {
    promptHtml: `Fabrik A fertigt ${num(a * 100)} % der Geräte, Fabrik B den Rest; defekt sind ${num(x * 100)} % aus A und ${num(y * 100)} % aus B. ` +
      `Tim dreht den Baum um, indem er nur die Stufen vertauscht, und schreibt an den Ast „defekt → A“ den Wert ${num(x, 2)}.<br>` +
      `<strong>Um wie viel liegt Tim daneben? Berechne P<sub>defekt</sub>(A) − ${num(x, 2)}.</strong>` +
      `<br><span class="progress-note">Das Ergebnis kann negativ sein. Vier Nachkommastellen.</span>`,
    correct: diff,
    tolerance: TOL,
    placeholder: "Differenz",
    hinweis: (roh, v) => {
      if (nahe(v, u.bA, TOL)) return "Das ist der richtige Wert selbst. Gefragt ist die Abweichung von Tims Wert.";
      if (nahe(v, -diff, TOL)) return "Vorzeichen vertauscht: richtiger Wert minus Tims Wert.";
      return "Erst den richtigen Wert P_defekt(A) berechnen.";
    },
    tipps: ["Richtiger Wert: P(A ∩ defekt) : P(defekt)."],
    musterloesungHtml: `P<sub>d</sub>(A) = ${bruch(num(u.ab), num(u.b))} = ${num(u.bA)}<br>Abweichung: ${num(u.bA)} − ${num(x, 2)} = <strong>${num(diff)}</strong><br>` +
      `Tims Baum hat noch einen zweiten Fehler: An seinem Knoten „defekt“ ergeben die Äste ${num(x, 2)} + ${num(y, 2)} = ${num(x + y, 2)} statt 1.`,
  };
}

// ---------- S4: rückwärts — P_A(B) aus dem umgedrehten Baum ----------
const S4_KANDIDATEN = spaeter(() => {
  const out = [];
  for (let b = 20; b <= 80; b += 10) for (let z = 10; z <= 90; z += 10) for (let a = 20; a <= 80; a += 10) {
    const ab = (b * z) / 10000;
    if (ab >= a / 100) continue;
    const x = ab / (a / 100);
    if (!glatt(x, 4)) continue;
    out.push({ b: b / 100, z: z / 100, a: a / 100 });
  }
  return out;
});
function generateS4() {
  const k = ohneKollision(S4_KANDIDATEN(), (v) => [(v.b * v.z) / v.a, v.z, v.b * v.z], EPS);
  const { b, z, a } = k;
  const ab = b * z;
  return {
    promptHtml: `Ein Baum verzweigt zuerst nach B: <strong>P(B) = ${num(b, 2)}</strong>, <strong>${P_("B", "A")} = ${num(z, 2)}</strong>. Außerdem ist <strong>P(A) = ${num(a, 2)}</strong> bekannt.<br>` +
      `<strong>Berechne ${P_("A", "B")}.</strong>` + WAHRSCH,
    correct: ab / a,
    tolerance: TOL,
    placeholder: "P_A(B)",
    hinweis: (roh, v) => {
      if (nahe(v, z, TOL)) return `Das ist ${P_("B", "A")}. Umgedreht ändert sich der Nenner: jetzt P(A).`;
      if (nahe(v, ab, TOL)) return "Das ist die Zelle P(A ∩ B); noch durch P(A) teilen.";
      return "P(A ∩ B) = P(B) · P_B(A), dann durch P(A).";
    },
    tipps: ["Die Zelle A ∩ B ist in beiden Bäumen dieselbe."],
    musterloesungHtml: `P(A ∩ B) = ${num(b, 2)} · ${num(z, 2)} = ${num(ab)}<br>${P_("A", "B")} = ${bruch(num(ab), num(a, 2))} = <strong>${num(ab / a)}</strong>`,
  };
}

// ================= komplex =================

// ---------- K1: Prävalenz ändert alles ----------
const K1_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const p1 of [1, 2]) for (const p2 of [10, 20, 30]) for (const s of [90, 95, 99]) for (const sp of [90, 95, 99]) {
    const ppv = (p) => (p * s) / (p * s + (100 - p) * (100 - sp));
    const d = ppv(p2) - ppv(p1);
    out.push({ p1, p2, s, sp, d });
  }
  return out;
});
function generateK1() {
  const k = ohneKollision(K1_KANDIDATEN(), (v) => [v.d, -v.d, v.p2 / 100 - v.p1 / 100], EPS);
  const { p1, p2, s, sp, d } = k;
  const ppv = (p) => (p * s) / (p * s + (100 - p) * (100 - sp));
  return {
    promptHtml: `Ein Test erkennt ${s} % der Infizierten und ${sp} % der Nicht-Infizierten richtig. Er wird in zwei Gruppen eingesetzt: in der Bevölkerung (${p1} % infiziert) und in einer Klinik (${p2} % infiziert).<br>` +
      `<strong>Um wie viel ist P<sub>pos</sub>(infiziert) in der Klinik größer als in der Bevölkerung?</strong>` + WAHRSCH,
    correct: d,
    tolerance: TOL,
    placeholder: "Differenz",
    hinweis: (roh, v) => {
      if (nahe(v, -d, TOL)) return "Vorzeichen: Klinik minus Bevölkerung.";
      if (nahe(v, p2 / 100 - p1 / 100, TOL)) return "Das ist nur der Unterschied der Prävalenzen. Gefragt ist, wie verlässlich ein positiver Test jeweils ist.";
      return "Berechne P_pos(infiziert) zweimal — nur die erste Stufe des Baums ändert sich.";
    },
    tipps: ["Derselbe Test, verschiedene erste Stufe."],
    musterloesungHtml: `Bevölkerung: ${bruch(`${num(p1 / 100, 2)} · ${num(s / 100, 2)}`, `${num(p1 / 100, 2)} · ${num(s / 100, 2)} + ${num(1 - p1 / 100, 2)} · ${num(1 - sp / 100, 2)}`)} = ${num(ppv(p1))}<br>` +
      `Klinik: ${num(ppv(p2))}<br>Unterschied: <strong>${num(d)}</strong> — der gleiche Test ist in der Klinik viel aussagekräftiger, weil dort mehr Infizierte getestet werden.`,
  };
}

// ---------- K2: zwei Tests hintereinander ----------
const K2_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const p of [1, 2, 5, 10]) for (const s of [90, 95, 99]) for (const sp of [90, 95, 98, 99]) {
    const ppv1 = (p * s) / (p * s + (100 - p) * (100 - sp));
    const ppv2 = (ppv1 * s) / (ppv1 * s + (1 - ppv1) * (100 - sp));
    // Zweimal umgedreht ist das Ergebnis selten glatt; die Eingabe auf vier Stellen genügt,
    // die Toleranz 0,0006 deckt das Runden ab.
    out.push({ p, s, sp, ppv1, ppv2 });
  }
  return out;
});
function generateK2() {
  const k = ohneKollision(K2_KANDIDATEN(), (v) => [v.ppv2, v.ppv1, (v.s / 100) ** 2], EPS);
  const { p, s, sp, ppv1, ppv2 } = k;
  return {
    promptHtml: `${p} % einer Gruppe sind infiziert. Ein Test erkennt ${s} % der Infizierten und ${sp} % der Nicht-Infizierten richtig. Wer positiv ist, wird ein zweites Mal getestet (unabhängig vom ersten Ergebnis).<br>` +
      `<strong>Mit welcher Wahrscheinlichkeit ist eine Person infiziert, die zweimal positiv getestet wurde?</strong>` + WAHRSCH,
    correct: ppv2,
    tolerance: TOL,
    placeholder: "P",
    hinweis: (roh, v) => {
      if (nahe(v, ppv1, TOL)) return "Das ist der Wert nach dem <em>ersten</em> Test. Für den zweiten Test ist dieser Wert die neue erste Stufe des Baums.";
      if (nahe(v, (s / 100) ** 2, TOL)) return "Das ist P<sub>infiziert</sub>(zweimal positiv) — die Richtung ist vertauscht.";
      return "Zweimal umdrehen: Das Ergebnis des ersten Tests ist die Prävalenz für den zweiten.";
    },
    tipps: ["Erst P_pos(infiziert) nach einem Test.", "Diesen Wert als neue Prävalenz einsetzen."],
    musterloesungHtml: `Nach dem ersten Test: P<sub>pos</sub>(inf.) = ${num(ppv1)}<br>Zweiter Test mit dieser Prävalenz: ${bruch(`${num(ppv1)} · ${num(s / 100, 2)}`, `${num(ppv1)} · ${num(s / 100, 2)} + ${num(1 - ppv1)} · ${num(1 - sp / 100, 2)}`)} = <strong>${num(ppv2)}</strong>`,
  };
}

// ---------- K3: die nötige Falschpositiv-Rate ----------
const K3_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const p of [2, 5, 10, 20]) for (const s of [80, 90, 95]) for (const ppv of [50, 75, 80, 90]) {
    const f = ((p / 100) * (s / 100) * (1 - ppv / 100)) / ((ppv / 100) * (1 - p / 100));
    if (f <= 0.001 || f >= 0.5) continue;
    out.push({ p, s, ppv, f });
  }
  return out;
});
function generateK3() {
  const k = ohneKollision(K3_KANDIDATEN(), (v) => [v.f, 1 - v.f, (v.p / 100) * (1 - v.ppv / 100)], EPS);
  const { p, s, ppv, f } = k;
  return {
    promptHtml: `Eine Krankheit hat eine Prävalenz von ${p} %. Ein Test erkennt ${s} % der Kranken. Ein positives Ergebnis soll zu ${ppv} % zutreffen: P<sub>pos</sub>(krank) = ${num(ppv / 100, 2)}.<br>` +
      `<strong>Wie groß darf der Anteil der Gesunden höchstens sein, die trotzdem positiv getestet werden (Falschpositiv-Rate)?</strong>` + WAHRSCH,
    correct: f,
    tolerance: TOL,
    placeholder: "P_gesund(pos)",
    hinweis: (roh, v) => {
      if (nahe(v, 1 - f, TOL)) return "Das ist die zugehörige Spezifität, P<sub>gesund</sub>(neg). Gefragt ist der Rest bis 1.";
      return "Setze P_pos(krank) = p · s : (p · s + (1 − p) · f) und löse nach f auf.";
    },
    tipps: [`p · s = ${num((p * s) / 10000)}`, "Gleichung: p · s = PPV · (p · s + (1 − p) · f)"],
    musterloesungHtml: `${num(ppv / 100, 2)} = ${bruch(num((p * s) / 10000), `${num((p * s) / 10000)} + ${num(1 - p / 100, 2)} · f`)}<br>` +
      `f = ${bruch(`${num((p * s) / 10000)} · (1 − ${num(ppv / 100, 2)})`, `${num(ppv / 100, 2)} · ${num(1 - p / 100, 2)}`)} = <strong>${num(f)}</strong><br>` +
      `<strong>Probe:</strong> ${bruch(num((p * s) / 10000), `${num((p * s) / 10000)} + ${num(((1 - p / 100) * f))}`)} = ${num(((p * s) / 10000) / ((p * s) / 10000 + (1 - p / 100) * f))} ✓`,
  };
}

// ---------- K4: drei Fabriken ----------
const K4_KANDIDATEN = spaeter(() => {
  const out = [];
  const anteile = [[0.5, 0.3, 0.2], [0.2, 0.3, 0.5], [0.4, 0.4, 0.2], [0.6, 0.25, 0.15], [0.25, 0.25, 0.5]];
  for (const a of anteile) for (const d of [[0.01, 0.02, 0.05], [0.02, 0.03, 0.01], [0.04, 0.01, 0.02], [0.05, 0.02, 0.01]]) for (const frage of [0, 1, 2]) {
    const zell = a.map((x, i) => x * d[i]);
    const pd = zell.reduce((s, x) => s + x, 0);
    const soll = zell[frage] / pd;
    out.push({ a, d, frage, zell, pd, soll });
  }
  return out;
});
function generateK4() {
  const k = ohneKollision(K4_KANDIDATEN(), (v) => [v.soll, v.a[v.frage], v.d[v.frage], v.zell[v.frage]], EPS);
  const { a, d, frage, zell, pd, soll } = k;
  const F = ["F₁", "F₂", "F₃"];
  return {
    promptHtml: `Drei Fabriken liefern ${a.map((x, i) => `${F[i]}: ${num(x * 100)} %`).join(", ")} der Teile. Der Ausschuss beträgt ${d.map((x, i) => `${F[i]}: ${num(x * 100)} %`).join(", ")}.<br>` +
      `<strong>Ein Teil ist defekt. Mit welcher Wahrscheinlichkeit stammt es aus ${F[frage]}?</strong>` + WAHRSCH,
    correct: soll,
    tolerance: TOL,
    placeholder: `P_defekt(${F[frage]})`,
    hinweis: (roh, v) => {
      if (nahe(v, a[frage], TOL)) return "Das ist der Anteil an allen Teilen, nicht an den defekten.";
      if (nahe(v, d[frage], TOL)) return "Das ist P_" + F[frage] + "(defekt) — Richtung vertauscht.";
      if (nahe(v, zell[frage], TOL)) return "Das ist der Pfad; noch durch P(defekt) teilen — jetzt aus drei Pfaden.";
      return "Wie mit zwei Fabriken, nur mit drei Pfaden nach „defekt“.";
    },
    tipps: ["P(defekt) = Summe von drei Pfaden."],
    musterloesungHtml: `P(defekt) = ${zell.map((z) => num(z)).join(" + ")} = ${num(pd)}<br>P<sub>defekt</sub>(${F[frage]}) = ${bruch(num(zell[frage]), num(pd))} = <strong>${num(soll)}</strong>`,
  };
}

export const AUFGABEN = [
  { schwierigkeit: "einfach", titel: "Die neue erste Stufe", generate: generateE1 },
  { schwierigkeit: "einfach", titel: "Wie zuverlässig ist „positiv“?", generate: generateE2 },
  { schwierigkeit: "einfach", titel: "Eine Zelle in absoluten Zahlen", generate: generateE3 },
  { schwierigkeit: "einfach", titel: "Ein umgedrehter Ast aus der Tafel", generate: generateE4 },
  { schwierigkeit: "mittel", titel: "Der ganze Weg", generate: generateM1 },
  { schwierigkeit: "mittel", titel: "Wie viele positive Tests?", generate: generateM2 },
  { schwierigkeit: "mittel", titel: "Positiver Vorhersagewert", generate: generateM3 },
  { schwierigkeit: "mittel", titel: "Beide Äste am neuen Knoten", generate: generateM4 },
  { schwierigkeit: "schwierig", titel: "Negativer Vorhersagewert", generate: generateS1 },
  { schwierigkeit: "schwierig", titel: "Aus welcher Fabrik?", generate: generateS2 },
  { schwierigkeit: "schwierig", titel: "Tims Fehler in Zahlen", generate: generateS3 },
  { schwierigkeit: "schwierig", titel: "Rückwärts umdrehen", generate: generateS4 },
  { schwierigkeit: "komplex", titel: "Prävalenz ändert alles", generate: generateK1 },
  { schwierigkeit: "komplex", titel: "Zwei Tests hintereinander", generate: generateK2 },
  { schwierigkeit: "komplex", titel: "Wie gut muss der Test sein?", generate: generateK3 },
  { schwierigkeit: "komplex", titel: "Drei Fabriken", generate: generateK4 },
];
