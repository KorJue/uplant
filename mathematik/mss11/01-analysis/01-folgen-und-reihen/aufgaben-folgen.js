// Die sechzehn Übungsaufgaben zu „Folgen und Reihen“ — vier je Stufe.
//
//   einfach   — ein Glied explizit, ein Glied rekursiv, arithmetisch, geometrisch.
//   mittel    — Folge aus zwei Gliedern (arithmetisch, geometrisch), beide Summenformeln.
//   schwierig — Grenzwert eines Bruchs, n₀ zu einem ε, unendliche geometrische Reihe,
//               periodische Dezimalzahl als Bruch.
//   komplex   — Trainingsplan (Summe ≥ Ziel), Sparplan, springender Ball, Achilles.
//
// Kein Logarithmus: Der kommt erst in einem späteren Thema. Deshalb werden n₀ und die Zahl der
// Trainingstage über Ungleichungen der Form c/n < ε bzw. eine quadratische Ungleichung bestimmt.

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
// Eine negative Zahl als Faktor oder Basis in Klammern.
function numK(x, stellen = 4) {
  return Math.round(x * Math.pow(10, stellen)) < 0 ? `(${num(x, stellen)})` : num(x, stellen);
}
// Ein Summand mit Rechenzeichen davor: „+ 3“ oder „− 3“ — das Vorzeichen steckt nur hier.
function plusMinus(x, stellen = 4) {
  return (x < 0 ? "− " : "+ ") + num(Math.abs(x), stellen);
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
// Ganzzahlig gerechnet, damit 1,375 · 1000 nicht als 1374,9999… durchfällt.
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
const HOCH = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" };
const hoch = (n) => String(n).split("").map((c) => HOCH[c] || c).join("");
const TIEF = { "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄", "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉" };
const tief = (n) => String(n).split("").map((c) => TIEF[c] || c).join("");
function ggt(a, b) {
  return b ? ggt(b, a % b) : Math.abs(a);
}
// Ein Bruch z/n gekürzt als HTML; ganze Zahlen ohne Bruchstrich.
function bruchGekuerzt(z, n) {
  if (n < 0) { z = -z; n = -n; }
  const g = ggt(z, n) || 1;
  z /= g; n /= g;
  if (n === 1) return num(z);
  return (z < 0 ? "−" : "") + bruch(Math.abs(z), n);
}

export function parseZahl(raw) {
  if (raw == null) return NaN;
  let s = String(raw).trim().replace(/\s/g, "").replace(/−/g, "-");
  const b = s.match(/^(-?\d+(?:,\d+)?)\/(-?\d+(?:,\d+)?)$/);
  if (b) {
    const z = parseFloat(b[1].replace(",", ".")), n = parseFloat(b[2].replace(",", "."));
    return n === 0 ? NaN : z / n;
  }
  if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) s = s.replace(/\./g, "");
  s = s.replace(",", ".");
  if (!/^-?\d*\.?\d+$/.test(s)) return NaN;
  return parseFloat(s);
}

const ZAHL = `<br><span class="progress-note">Gib das Ergebnis als Zahl ein (Komma als Dezimalzeichen); Brüche wie 3/11 sind erlaubt.</span>`;
const GANZ = `<br><span class="progress-note">Gib eine ganze Zahl ein.</span>`;
const TOL = 0.0001;
const EPS = 0.001;

// ================= einfach =================

// ---------- E1: ein Glied explizit ----------
const E1_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const p of [1, 2, 3, -1, -2]) for (let r = -6; r <= 6; r++) for (let n = 3; n <= 12; n++) {
    if (r === 0) continue;
    out.push({ p, r, n });
  }
  return out;
});
function termE1(p, r) {
  const vorn = p === 1 ? "n²" : p === -1 ? "−n²" : `${num(p)}n²`;
  return `${vorn} ${plusMinus(r)}`;
}
function generateE1() {
  // Bei p = 1 ist (p · n)² dasselbe wie p · n² — dort liegt auf diesem Fehler kein Hinweis.
  const k = ohneKollision(E1_KANDIDATEN(), (v) => [v.p * v.n * v.n + v.r, v.p * (v.n - 1) ** 2 + v.r, v.p === 1 ? NaN : (v.p * v.n) ** 2 + v.r, v.p * v.n * v.n - v.r], 0.5);
  const { p, r, n } = k;
  const soll = p * n * n + r;
  return {
    promptHtml: `Gegeben ist die Folge mit <strong>aₙ = ${termE1(p, r)}</strong>.<br><strong>Berechne a${tief(n)}.</strong>` + ZAHL,
    correct: soll,
    tolerance: TOL,
    placeholder: `a${tief(n)}`,
    hinweis: (roh, v) => {
      if (nahe(v, p * (n - 1) ** 2 + r, TOL)) return `Das ist a${tief(n - 1)}. Für a${tief(n)} wird n = ${n} eingesetzt — der Index ist die Stelle.`;
      if (p !== 1 && nahe(v, (p * n) ** 2 + r, TOL)) return `Potenz vor Punkt: Nur n wird quadriert, nicht ${num(p)}n. Erst ${n}² = ${n * n}, dann mal ${num(p)}.`;
      if (nahe(v, p * n * n - r, TOL)) return "Vorzeichen des konstanten Summanden prüfen.";
      return `Setze n = ${n} in den Term ein.`;
    },
    tipps: [`Ersetze jedes n durch ${n}.`, "Potenz vor Punkt vor Strich."],
    musterloesungHtml: `a${tief(n)} = ${p === 1 ? "" : p === -1 ? "−" : num(p) + " · "}${n}² ${plusMinus(r)} = ${num(p * n * n)} ${plusMinus(r)} = <strong>${num(soll)}</strong>`,
  };
}

// ---------- E2: ein Glied rekursiv ----------
const E2_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const c of [2, 3, -1, -2]) for (let d = -3; d <= 3; d++) for (let a1 = -3; a1 <= 4; a1++) {
    if (d === 0) continue;
    const a = [a1];
    for (let i = 0; i < 4; i++) a.push(c * a[i] + d);
    if (Math.abs(a[4]) > 400) continue;
    out.push({ c, d, a1, a });
  }
  return out;
});
function generateE2() {
  const k = ohneKollision(E2_KANDIDATEN(), (v) => [v.a[3], v.a[2], v.a[4], v.c * 4 + v.d], 0.5);
  const { c, d, a1, a } = k;
  const regel = `a<sub>n+1</sub> = ${c === -1 ? "−" : num(c) + " · "}aₙ ${plusMinus(d)}`;
  return {
    promptHtml: `Eine Folge ist rekursiv gegeben: <strong>a₁ = ${num(a1)}</strong> und <strong>${regel}</strong>.<br><strong>Berechne a₄.</strong>` + ZAHL,
    correct: a[3],
    tolerance: TOL,
    placeholder: "a₄",
    hinweis: (roh, v) => {
      if (nahe(v, a[2], TOL)) return "Das ist a₃ — es fehlt noch ein Schritt. Von a₁ bis a₄ sind es drei Anwendungen der Regel.";
      if (nahe(v, a[4], TOL)) return "Das ist a₅ — ein Schritt zu viel.";
      if (nahe(v, c * 4 + d, TOL)) return "Die Regel ist keine explizite Formel: Für aₙ wird der Vorgänger eingesetzt, nicht der Index.";
      return "Wende die Regel dreimal nacheinander an: a₂, a₃, a₄.";
    },
    tipps: ["Erst a₂ aus a₁, dann a₃ aus a₂ …"],
    musterloesungHtml: [1, 2, 3].map((i) => `a${tief(i + 1)} = ${c === -1 ? "−" : num(c) + " · "}${numK(a[i - 1])} ${plusMinus(d)} = ${num(a[i])}`).join("<br>") + `<br>Also <strong>a₄ = ${num(a[3])}</strong>.`,
  };
}

// ---------- E3: arithmetische Folge ----------
const E3_KANDIDATEN = spaeter(() => {
  const out = [];
  for (let a1 = -6; a1 <= 10; a1++) for (const d of [-3, -2, -1.5, -0.5, 0.5, 1.5, 2, 3, 4]) for (let n = 8; n <= 30; n += 2) out.push({ a1, d, n });
  return out;
});
function generateE3() {
  const k = ohneKollision(E3_KANDIDATEN(), (v) => [v.a1 + (v.n - 1) * v.d, v.a1 + v.n * v.d, v.d + (v.n - 1) * v.a1], EPS);
  const { a1, d, n } = k;
  const soll = a1 + (n - 1) * d;
  return {
    promptHtml: `Eine arithmetische Folge hat <strong>a₁ = ${num(a1)}</strong> und <strong>d = ${num(d)}</strong>.<br><strong>Berechne a${tief(n)}.</strong>` + ZAHL,
    correct: soll,
    tolerance: TOL,
    placeholder: `a${tief(n)}`,
    hinweis: (roh, v) => {
      if (nahe(v, a1 + n * d, TOL)) return `Von a₁ bis a${tief(n)} sind es nur ${n - 1} Schritte, nicht ${n} — d kommt (n − 1)-mal dazu.`;
      if (nahe(v, d + (n - 1) * a1, TOL)) return "a₁ und d vertauscht: aₙ = a₁ + (n − 1) · d.";
      return "aₙ = a₁ + (n − 1) · d.";
    },
    tipps: ["Zähle die Schritte: n Glieder, n − 1 Abstände."],
    musterloesungHtml: `a${tief(n)} = a₁ + (${n} − 1) · d = ${num(a1)} + ${n - 1} · ${numK(d)} = <strong>${num(soll)}</strong>`,
  };
}

// ---------- E4: geometrische Folge ----------
const E4_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const a1 of [1, 2, 3, 4, 5, 6, -2, -3, 64, 81]) for (const q of [2, 3, -2, 0.5, -0.5, 1.5]) for (let n = 3; n <= 7; n++) {
    const w = a1 * Math.pow(q, n - 1);
    if (!glatt(w, 4) || Math.abs(w) > 5000) continue;
    out.push({ a1, q, n });
  }
  return out;
});
function generateE4() {
  const k = ohneKollision(E4_KANDIDATEN(), (v) => [v.a1 * v.q ** (v.n - 1), v.a1 * v.q ** v.n, (v.a1 * v.q) ** (v.n - 1), v.a1 * v.q * (v.n - 1)], EPS);
  const { a1, q, n } = k;
  const soll = a1 * q ** (n - 1);
  return {
    promptHtml: `Eine geometrische Folge hat <strong>a₁ = ${num(a1)}</strong> und <strong>q = ${num(q)}</strong>.<br><strong>Berechne a${tief(n)}.</strong>` + ZAHL,
    correct: soll,
    tolerance: TOL,
    placeholder: `a${tief(n)}`,
    hinweis: (roh, v) => {
      if (nahe(v, a1 * q ** n, TOL)) return `q kommt nur (n − 1)-mal als Faktor vor: a${tief(n)} = a₁ · q${hoch(n - 1)}.`;
      if (nahe(v, (a1 * q) ** (n - 1), TOL)) return `Nur q wird potenziert, nicht a₁ · q: a₁ · q${hoch(n - 1)}.`;
      if (nahe(v, a1 * q * (n - 1), TOL)) return "Bei einer geometrischen Folge wird q nicht mal (n − 1) genommen, sondern (n − 1)-mal als Faktor.";
      return "aₙ = a₁ · q^(n − 1).";
    },
    tipps: ["Jeder Schritt multipliziert mit q."],
    musterloesungHtml: `a${tief(n)} = a₁ · q${hoch(n - 1)} = ${num(a1)} · ${numK(q)}${hoch(n - 1)} = ${num(a1)} · ${num(q ** (n - 1))} = <strong>${num(soll)}</strong>`,
  };
}

// ================= mittel =================

// ---------- M1: arithmetische Folge aus zwei Gliedern ----------
const M1_KANDIDATEN = spaeter(() => {
  const out = [];
  for (let k = 2; k <= 5; k++) for (let m = k + 2; m <= 9; m++) for (const d of [-4, -3, -2, 2, 3, 4, 5]) for (const ak of [-5, -1, 2, 7, 11]) for (const n of [12, 15, 20]) out.push({ k, m, d, ak, n });
  return out;
});
function generateM1() {
  const kand = ohneKollision(M1_KANDIDATEN(), (v) => {
    const am = v.ak + (v.m - v.k) * v.d;
    return [v.ak + (v.n - v.k) * v.d, v.ak + (v.n - v.k) * ((am - v.ak) / (v.m - v.k + 1)), v.ak + (v.n - 1) * v.d];
  }, EPS);
  const { k, m, d, ak, n } = kand;
  const am = ak + (m - k) * d;
  const soll = ak + (n - k) * d;
  const a1 = ak - (k - 1) * d;
  return {
    promptHtml: `Von einer arithmetischen Folge kennt man <strong>a${tief(k)} = ${num(ak)}</strong> und <strong>a${tief(m)} = ${num(am)}</strong>.<br><strong>Berechne a${tief(n)}.</strong>` + ZAHL,
    correct: soll,
    tolerance: TOL,
    placeholder: `a${tief(n)}`,
    hinweis: (roh, v) => {
      if (nahe(v, ak + (n - k) * ((am - ak) / (m - k + 1)), TOL)) return `Zwischen a${tief(k)} und a${tief(m)} liegen ${m - k} Schritte, nicht ${m - k + 1}.`;
      if (nahe(v, ak + (n - 1) * d, TOL)) return `a${tief(k)} ist nicht a₁. Entweder erst a₁ berechnen oder von a${tief(k)} aus ${n - k} Schritte gehen.`;
      return "Erst d aus dem Abstand der beiden Glieder, dann weiterzählen.";
    },
    tipps: [`d = (a${tief(m)} − a${tief(k)}) : (${m} − ${k})`],
    musterloesungHtml: `${m - k} · d = ${num(am)} − ${numK(ak)} = ${num(am - ak)} ⟹ d = ${num(d)}<br>` +
      `a${tief(n)} = a${tief(k)} + (${n} − ${k}) · d = ${num(ak)} + ${n - k} · ${numK(d)} = <strong>${num(soll)}</strong><br>` +
      `<strong>Probe:</strong> a₁ = ${num(a1)}, a${tief(m)} = ${num(a1)} + ${m - 1} · ${numK(d)} = ${num(am)} ✓`,
  };
}

// ---------- M2: geometrische Folge aus a₂ und a₅ ----------
const M2_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const q of [2, 3, -2, 0.5, -3]) for (const a1 of [1, 2, 3, 4, 5, -1, -2, 16, 32, 64]) {
    const a2 = a1 * q, a5 = a1 * q ** 4, a7 = a1 * q ** 6;
    if (![a2, a5, a7].every((x) => glatt(x, 4)) || Math.abs(a7) > 50000) continue;
    out.push({ q, a1, a2, a5, a7 });
  }
  return out;
});
function generateM2() {
  const k = ohneKollision(M2_KANDIDATEN(), (v) => [v.a7, v.a5 + 2 * ((v.a5 - v.a2) / 3), v.a5 * v.q, v.a1 * v.q ** 7], 0.5);
  const { q, a2, a5, a7 } = k;
  return {
    promptHtml: `Von einer geometrischen Folge kennt man <strong>a₂ = ${num(a2)}</strong> und <strong>a₅ = ${num(a5)}</strong>.<br><strong>Berechne a₇.</strong>` + ZAHL,
    correct: a7,
    tolerance: TOL,
    placeholder: "a₇",
    hinweis: (roh, v) => {
      if (nahe(v, a5 + 2 * ((a5 - a2) / 3), TOL)) return "Das ist die Rechnung für eine arithmetische Folge. Hier wird multipliziert: a₅ = a₂ · q³.";
      if (nahe(v, a5 * q, TOL)) return "Das ist a₆ — von a₅ bis a₇ kommt q zweimal als Faktor dazu.";
      if (nahe(v, k.a1 * q ** 7, TOL)) return "Das ist a₈: a₇ = a₁ · q⁶.";
      return "q³ = a₅ : a₂, dann a₇ = a₅ · q².";
    },
    tipps: ["Von a₂ nach a₅ sind es drei Schritte: a₅ = a₂ · q³.", "Die dritte Wurzel einer negativen Zahl ist negativ."],
    musterloesungHtml: `q³ = a₅ : a₂ = ${num(a5)} : ${numK(a2)} = ${num(a5 / a2)} ⟹ q = ${num(q)}<br>` +
      `a₇ = a₅ · q² = ${num(a5)} · ${numK(q)}² = <strong>${num(a7)}</strong>`,
  };
}

// ---------- M3: Summe einer arithmetischen Folge ----------
const M3_KANDIDATEN = spaeter(() => {
  const out = [];
  for (let a1 = -5; a1 <= 9; a1++) for (const d of [-2, -1, 0.5, 1, 1.5, 2, 3, 4]) for (let n = 10; n <= 40; n += 3) out.push({ a1, d, n });
  return out;
});
function generateM3() {
  const k = ohneKollision(M3_KANDIDATEN(), (v) => {
    const an = v.a1 + (v.n - 1) * v.d;
    return [(v.n * (v.a1 + an)) / 2, v.n * (v.a1 + an), (v.n * (v.a1 + v.a1 + v.n * v.d)) / 2, v.n * an];
  }, EPS);
  const { a1, d, n } = k;
  const an = a1 + (n - 1) * d;
  const soll = (n * (a1 + an)) / 2;
  return {
    promptHtml: `Eine arithmetische Folge hat <strong>a₁ = ${num(a1)}</strong> und <strong>d = ${num(d)}</strong>.<br><strong>Berechne die Summe der ersten ${n} Glieder, s${tief(n)}.</strong>` + ZAHL,
    correct: soll,
    tolerance: TOL,
    placeholder: `s${tief(n)}`,
    hinweis: (roh, v) => {
      if (nahe(v, n * (a1 + an), TOL)) return "Das ist das ganze Rechteck aus zwei Treppen — die Summe ist die Hälfte davon.";
      if (nahe(v, (n * (a1 + a1 + n * d)) / 2, TOL)) return `Das letzte Glied ist a${tief(n)} = a₁ + ${n - 1} · d, nicht a₁ + ${n} · d.`;
      if (nahe(v, n * an, TOL)) return "Nicht alle Glieder sind so groß wie das letzte — der Mittelwert ist (a₁ + aₙ) : 2.";
      return "sₙ = n · (a₁ + aₙ) : 2.";
    },
    tipps: [`Erst a${tief(n)} berechnen.`, "Dann sₙ = n · (a₁ + aₙ) : 2."],
    musterloesungHtml: `a${tief(n)} = ${num(a1)} + ${n - 1} · ${numK(d)} = ${num(an)}<br>s${tief(n)} = ${bruch(`${n} · (${num(a1)} + ${numK(an)})`, "2")} = <strong>${num(soll)}</strong>`,
  };
}

// ---------- M4: Summe einer geometrischen Folge ----------
const M4_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const a1 of [1, 2, 3, 5, -1, -2, 64, 96]) for (const q of [2, 3, -2, 0.5, -0.5]) for (let n = 4; n <= 9; n++) {
    const s = (a1 * (1 - q ** n)) / (1 - q);
    if (!glatt(s, 4) || Math.abs(s) > 100000) continue;
    out.push({ a1, q, n });
  }
  return out;
});
function generateM4() {
  const k = ohneKollision(M4_KANDIDATEN(), (v) => [(v.a1 * (1 - v.q ** v.n)) / (1 - v.q), (v.a1 * (1 - v.q ** (v.n - 1))) / (1 - v.q), v.a1 * v.q ** (v.n - 1), (v.a1 * (1 - v.q ** (v.n + 1))) / (1 - v.q)], EPS);
  const { a1, q, n } = k;
  const soll = (a1 * (1 - q ** n)) / (1 - q);
  return {
    promptHtml: `Eine geometrische Folge hat <strong>a₁ = ${num(a1)}</strong> und <strong>q = ${num(q)}</strong>.<br><strong>Berechne s${tief(n)} = a₁ + a₂ + … + a${tief(n)}.</strong>` + ZAHL,
    correct: soll,
    tolerance: TOL,
    placeholder: `s${tief(n)}`,
    hinweis: (roh, v) => {
      if (nahe(v, (a1 * (1 - q ** (n - 1))) / (1 - q), TOL)) return `Das ist s${tief(n - 1)}: Im Exponenten der Summenformel steht die Anzahl der Summanden, also ${n}.`;
      if (nahe(v, (a1 * (1 - q ** (n + 1))) / (1 - q), TOL)) return `Das ist s${tief(n + 1)} — ein Summand zu viel.`;
      if (nahe(v, a1 * q ** (n - 1), TOL)) return `Das ist nur das letzte Glied a${tief(n)}, nicht die Summe.`;
      return "sₙ = a₁ · (1 − qⁿ) : (1 − q).";
    },
    tipps: ["Im Exponenten steht die Anzahl der Summanden."],
    musterloesungHtml: `s${tief(n)} = a₁ · ${bruch(`1 − q${hoch(n)}`, "1 − q")} = ${num(a1)} · ${bruch(`1 − ${numK(q)}${hoch(n)}`, `1 − ${numK(q)}`)} = ${num(a1)} · ${bruch(num(1 - q ** n), num(1 - q))} = <strong>${num(soll)}</strong>`,
  };
}

// ================= schwierig =================

// ---------- S1: Grenzwert eines Bruchs ----------
const S1_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const grad of [1, 2]) for (const p of [1, 2, 3, 4, 5, 6, -2, -3]) for (const s of [1, 2, 3, 4, 5]) for (const r of [-4, -1, 1, 3, 5]) for (const t of [-3, -1, 2, 4, 7]) {
    if (s + t === 0) continue;
    out.push({ grad, p, s, r, t });
  }
  return out;
});
function termS1(c, grad, r) {
  const vorn = c === 1 ? "" : c === -1 ? "−" : num(c);
  return `${vorn}n${grad === 2 ? "²" : ""} ${plusMinus(r)}${grad === 2 ? "n" : ""}`;
}
function generateS1() {
  const k = ohneKollision(S1_KANDIDATEN(), (v) => [v.p / v.s, v.r / v.t, (v.p + v.r) / (v.s + v.t), 0], EPS);
  const { grad, p, s, r, t } = k;
  const soll = p / s;
  const zaehler = termS1(p, grad, r);
  const nenner = grad === 2 ? `${s === 1 ? "" : num(s)}n² ${plusMinus(t)}` : `${s === 1 ? "" : num(s)}n ${plusMinus(t)}`;
  return {
    promptHtml: `<strong>Bestimme den Grenzwert der Folge mit aₙ = ${bruch(zaehler, nenner)}.</strong>` +
      `<br><span class="progress-note">(Zähler: ${zaehler}; Nenner: ${nenner}.) Gib den Grenzwert als Bruch oder als Dezimalzahl mit vier Nachkommastellen ein.</span>`,
    correct: soll,
    tolerance: TOL,
    placeholder: "g",
    hinweis: (roh, v) => {
      if (nahe(v, r / t, TOL)) return `Für großes n spielen die niedrigeren Potenzen keine Rolle. Es zählen nur die Vorfaktoren von n${grad === 2 ? "²" : ""}.`;
      if (nahe(v, (p + r) / (s + t), TOL)) return "Das ist a₁. Der Grenzwert beschreibt, was für sehr große n passiert.";
      if (nahe(v, 0, TOL)) return "Zähler und Nenner wachsen gleich schnell — der Quotient geht nicht gegen 0.";
      return `Kürze durch n${grad === 2 ? "²" : ""}: Alles, was dann noch durch n geteilt wird, ist eine Nullfolge.`;
    },
    tipps: [`Teile Zähler und Nenner durch n${grad === 2 ? "²" : ""}.`, "1/n und 1/n² sind Nullfolgen."],
    musterloesungHtml: `aₙ = ${bruch(`${num(p)} ${plusMinus(r)}/n`, `${num(s)} ${plusMinus(t)}/n${grad === 2 ? "²" : ""}`)} → ${bruch(num(p), num(s))} = <strong>${bruchGekuerzt(p, s)}</strong>` +
      ` &nbsp; (die Brüche mit n im Nenner sind Nullfolgen)`,
  };
}

// ---------- S2: n₀ zu einem ε ----------
const S2_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const g of [-2, -1, 0, 1, 2, 3, 4]) for (const c of [1, 2, 3, 4, 5]) for (const vz of [1, -1]) for (const k of [4, 5, 8, 10, 20, 25, 50, 100]) out.push({ g, c, vz, k });
  return out;
});
function generateS2() {
  const kand = ohneKollision(S2_KANDIDATEN(), (v) => [v.c * v.k + 1, v.c * v.k, v.c === 1 ? NaN : v.k + 1], 0.5);
  const { g, c, vz, k } = kand;
  const eps = 1 / k;
  const soll = c * k + 1;
  const term = g === 0 ? `${vz < 0 ? "−" : ""}${bruch(String(c), "n")}` : `${num(g)} ${vz < 0 ? "−" : "+"} ${bruch(String(c), "n")}`;
  return {
    promptHtml: `Die Folge aₙ = ${term} hat den Grenzwert g = ${num(g)}.<br>` +
      `<strong>Ab welchem Index n₀ liegen alle Glieder im ε-Streifen mit ε = ${num(eps)}, also |aₙ − ${numK(g)}| &lt; ${num(eps)}?</strong>` +
      `<br><span class="progress-note">(Abweichung vom Grenzwert: ${c}/n.)</span>` + GANZ,
    correct: soll,
    tolerance: 0.5,
    placeholder: "n₀",
    hinweis: (roh, v) => {
      if (nahe(v, c * k, 0.5)) return `Bei n = ${c * k} ist der Abstand genau ${num(eps)} — das ist nicht kleiner als ε. Es muss n > ${c * k} sein.`;
      if (c !== 1 && nahe(v, k + 1, 0.5)) return `Der Abstand ist ${c}/n, nicht 1/n: ${c}/n < ${num(eps)} ⟺ n > ${c} : ${num(eps)}.`;
      return `Löse ${c}/n < ${num(eps)} nach n auf.`;
    },
    tipps: [`|aₙ − g| = ${c}/n`, `${c}/n < ε ⟺ n > ${c}/ε`],
    musterloesungHtml: `|aₙ − ${numK(g)}| = ${bruch(String(c), "n")} &lt; ${num(eps)} ⟺ n &gt; ${bruch(String(c), num(eps))} = ${c * k}<br>Also <strong>n₀ = ${soll}</strong>.<br>` +
      `<strong>Probe:</strong> n = ${c * k}: Abstand ${num(c / (c * k))} = ε (nicht kleiner); n = ${soll}: Abstand ${num(c / soll)} &lt; ε ✓`,
  };
}

// ---------- S3: unendliche geometrische Reihe ----------
const S3_KANDIDATEN = spaeter(() => {
  const out = [];
  const qs = [[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [-1, 2], [-1, 3], [1, 5], [-2, 3]];
  for (const [z, n] of qs) for (const f of [1, 2, 3, 4, 5, 6, 7, 8, 10]) {
    const a1 = f * n * n;   // so sind die ersten drei Glieder ganzzahlig
    if (a1 > 400) continue;
    out.push({ a1, qz: z, qn: n });
  }
  return out;
});
function generateS3() {
  const k = ohneKollision(S3_KANDIDATEN(), (v) => {
    const q = v.qz / v.qn;
    return [v.a1 / (1 - q), v.a1 / (1 + q), v.a1 * (1 + q + q * q), v.a1 / q];
  }, EPS);
  const { a1, qz, qn } = k;
  const q = qz / qn;
  const glieder = [a1, a1 * q, a1 * q * q, a1 * q ** 3];
  const reihe = glieder.map((g, i) => (i === 0 ? num(g) : `${g < 0 ? "−" : "+"} ${num(Math.abs(g))}`)).join(" ") + (q < 0 ? " ± …" : " + …");
  const soll = a1 / (1 - q);
  return {
    promptHtml: `<strong>Berechne den Wert der unendlichen Reihe ${reihe}</strong>` +
      `<br><span class="progress-note">Gib den Wert als Bruch oder als Dezimalzahl mit vier Nachkommastellen ein.</span>`,
    correct: soll,
    tolerance: TOL,
    placeholder: "s",
    hinweis: (roh, v) => {
      if (nahe(v, a1 / (1 + q), TOL)) return `Vorzeichen von q: q = a₂ : a₁ = ${num(q)}, und s = a₁ : (1 − q).`;
      if (nahe(v, a1 * (1 + q + q * q), TOL)) return "Das ist nur die Summe der ersten drei Glieder. Die Reihe geht unendlich weiter.";
      if (nahe(v, a1 / q, TOL)) return "Im Nenner steht 1 − q, nicht q.";
      return "Erst q = a₂ : a₁ bestimmen, dann s = a₁ : (1 − q).";
    },
    tipps: ["q = a₂ : a₁", "|q| < 1, also s = a₁ : (1 − q)"],
    musterloesungHtml: `q = ${num(glieder[1])} : ${num(a1)} = ${bruchGekuerzt(qz, qn)}, |q| &lt; 1<br>` +
      `s = ${bruch(num(a1), `1 − ${q < 0 ? `(${bruchGekuerzt(qz, qn)})` : bruchGekuerzt(qz, qn)}`)} = ${bruch(num(a1), bruchGekuerzt(qn - qz, qn))} = <strong>${bruchGekuerzt(a1 * qn, qn - qz)}</strong>`,
  };
}

// ---------- S4: periodische Dezimalzahl als Bruch ----------
const S4_KANDIDATEN = spaeter(() => {
  const out = [];
  for (let p = 10; p <= 98; p++) {
    if (p % 11 === 0) continue;   // 0,(33) wäre 0,(3) — dann ist die Periode einstellig
    out.push({ vor: null, p });
    for (const vor of [1, 3, 5, 7]) out.push({ vor, p });
  }
  return out;
});
function generateS4() {
  const k = ohneKollision(S4_KANDIDATEN(), (v) => {
    const soll = v.vor === null ? v.p / 99 : v.vor / 10 + v.p / 990;
    const abgebrochen = v.vor === null ? v.p / 100 : (v.vor * 100 + v.p) / 1000;
    return [soll, abgebrochen, v.vor === null ? v.p / 90 : (v.vor * 100 + v.p) / 999];
  }, 1e-6);
  const { vor, p } = k;
  const soll = vor === null ? p / 99 : vor / 10 + p / 990;
  const zahl = vor === null ? `0,<span style="text-decoration:overline">${p}</span>` : `0,${vor}<span style="text-decoration:overline">${p}</span>`;
  const erklaerung = vor === null ? `die Ziffernfolge ${p} wiederholt sich unendlich oft` : `nach der ${vor} wiederholt sich die Ziffernfolge ${p} unendlich oft`;
  const z = vor === null ? p : vor * 99 + p, n = vor === null ? 99 : 990;
  return {
    promptHtml: `<strong>Schreibe ${zahl} als Bruch</strong> (${erklaerung}).` +
      `<br><span class="progress-note">Gib einen Bruch wie 3/11 ein.</span>`,
    correct: soll,
    tolerance: 1e-7,
    placeholder: "z/n",
    hinweis: (roh, v) => {
      if (nahe(v, vor === null ? p / 100 : (vor * 100 + p) / 1000, 1e-7)) return "Das ist die abgebrochene Dezimalzahl. Die Periode geht unendlich weiter — sie ist eine unendliche geometrische Reihe.";
      if (nahe(v, vor === null ? p / 90 : (vor * 100 + p) / 999, 1e-7)) return "Der Nenner der Periode ist 1 − q mit q = 0,01, also 0,99 — daher 99, nicht 90.";
      if (Number.isFinite(v) && !String(roh).includes("/")) return "Eine Dezimalzahl mit endlich vielen Stellen kann den Wert nicht genau treffen — gib einen Bruch ein.";
      return "Periode = a₁ + a₁ · 0,01 + … mit a₁ = 0,ab.";
    },
    tipps: ["Eine zweistellige Periode: q = 0,01.", "s = a₁ : (1 − q)"],
    musterloesungHtml: vor === null
      ? `0,<span style="text-decoration:overline">${p}</span> = 0,${p} + 0,00${p} + … mit a₁ = 0,${p}, q = 0,01<br>s = ${bruch(`0,${p}`, "0,99")} = ${bruch(String(p), "99")} = <strong>${bruchGekuerzt(p, 99)}</strong>`
      : `0,${vor}<span style="text-decoration:overline">${p}</span> = 0,${vor} + 0,0${p} + 0,000${p} + …<br>Periode: a₁ = 0,0${p}, q = 0,01 ⟹ ${bruch(`0,0${p}`, "0,99")} = ${bruch(String(p), "990")}<br>` +
        `Zusammen: ${bruch(String(vor), "10")} + ${bruch(String(p), "990")} = ${bruch(String(z), String(n))} = <strong>${bruchGekuerzt(z, n)}</strong>`,
  };
}

// ================= komplex =================

// ---------- K1: Trainingsplan — wie viele Tage bis zum Ziel? ----------
function tageBisZiel(a1, d, S) {
  // Kleinstes n mit n · a1 + n(n − 1)/2 · d ≥ S. Die Folge der Partialsummen steigt streng, also
  // genügt Weiterzählen; die Musterlösung zeigt den Weg über die quadratische Ungleichung.
  let n = 0, s = 0;
  while (s < S - 1e-9) { n++; s += a1 + (n - 1) * d; }
  return n;
}
const K1_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const a1 of [1, 1.5, 2, 2.5, 3]) for (const d of [0.25, 0.5, 1]) for (let S = 50; S <= 200; S += 10) {
    const n = tageBisZiel(a1, d, S);
    // Kein Treffer genau auf dem Ziel: Sonst wäre „mindestens“ und „mehr als“ dasselbe.
    const sn = n * a1 + (n * (n - 1) * d) / 2;
    if (Math.abs(sn - S) < 1e-9 || n < 6 || n > 30) continue;
    out.push({ a1, d, S, n });
  }
  return out;
});
function generateK1() {
  const k = ohneKollision(K1_KANDIDATEN(), (v) => [v.n, v.n - 1, Math.ceil(v.S / v.a1)], 0.5);
  const { a1, d, S, n } = k;
  const s = (m) => m * a1 + (m * (m - 1) * d) / 2;
  // n² · d/2 + n · (a1 − d/2) − S ≥ 0 → positive Lösung
  const A = d / 2, B = a1 - d / 2;
  const x = (-B + Math.sqrt(B * B + 4 * A * S)) / (2 * A);
  return {
    promptHtml: `Mia läuft am ersten Trainingstag ${num(a1)} km und an jedem weiteren Tag ${num(d)} km mehr als am Vortag.<br>` +
      `<strong>Nach wie vielen Tagen ist sie insgesamt mindestens ${S} km gelaufen?</strong>` + GANZ,
    correct: n,
    tolerance: 0.5,
    placeholder: "Tage",
    hinweis: (roh, v) => {
      if (nahe(v, n - 1, 0.5)) return `Nach ${n - 1} Tagen sind es erst ${num(s(n - 1))} km — noch weniger als ${S}.`;
      if (nahe(v, Math.ceil(S / a1), 0.5)) return "Mia läuft nicht jeden Tag gleich weit — jeden Tag kommen " + num(d) + " km dazu.";
      return "Gesucht ist das kleinste n mit sₙ ≥ " + S + ".";
    },
    tipps: ["sₙ = n · a₁ + n(n − 1)/2 · d", "Quadratische Ungleichung lösen und aufrunden."],
    musterloesungHtml: `sₙ = ${num(a1)}n + ${bruch("n(n − 1)", "2")} · ${num(d)} ≥ ${S} ⟺ ${num(A)}n² + ${num(B)}n − ${S} ≥ 0<br>` +
      `Positive Nullstelle: n ≈ ${num(x, 2)} ⟹ aufrunden: <strong>${n} Tage</strong><br>` +
      `<strong>Probe:</strong> s${tief(n - 1)} = ${num(s(n - 1))} km &lt; ${S} km ≤ s${tief(n)} = ${num(s(n))} km ✓`,
  };
}

// ---------- K2: Sparplan ----------
const K2_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const p of [1, 2, 3, 4, 5]) for (const R of [500, 1000, 1200, 2000]) for (let n = 5; n <= 20; n += 3) out.push({ p, R, n });
  return out;
});
function generateK2() {
  const k = ohneKollision(K2_KANDIDATEN(), (v) => {
    const q = 1 + v.p / 100;
    return [(v.R * (q ** v.n - 1)) / (q - 1), v.R * v.n, (v.R * (q ** (v.n + 1) - q)) / (q - 1), v.R * q ** v.n];
  }, 1);
  const { p, R, n } = k;
  const q = 1 + p / 100;
  const soll = (R * (q ** n - 1)) / (q - 1);
  return {
    promptHtml: `Jemand zahlt jeweils am <strong>Ende</strong> eines Jahres ${num(R)} € auf ein Konto ein, das jährlich mit ${p} % verzinst wird.<br>` +
      `<strong>Wie groß ist das Guthaben direkt nach der ${n}. Einzahlung?</strong>` +
      `<br><span class="progress-note">Runde auf ganze Euro.</span>`,
    correct: soll,
    tolerance: 1,
    placeholder: "€",
    hinweis: (roh, v) => {
      if (nahe(v, R * n, 1)) return "Ohne Zinsen. Jede Einzahlung wird bis zum Schluss verzinst — die erste am längsten.";
      if (nahe(v, (R * (q ** (n + 1) - q)) / (q - 1), 1)) return "So wäre es bei Einzahlung am Jahresanfang. Am Jahresende eingezahlt, bekommt die letzte Rate gar keine Zinsen.";
      if (nahe(v, R * q ** n, 1)) return "Das ist nur eine einzelne, n Jahre verzinste Rate.";
      return `Die Raten sind nach der letzten Einzahlung ${num(R)}, ${num(R)} · ${num(q)}, … ${num(R)} · ${num(q)}${hoch(n - 1)} wert — eine geometrische Summe.`;
    },
    tipps: [`Die letzte Rate: ${num(R)} €, die vorletzte: ${num(R)} · ${num(q)} € …`, "sₙ = a₁ · (qⁿ − 1) : (q − 1)"],
    musterloesungHtml: `Guthaben = ${num(R)} + ${num(R)} · ${num(q)} + … + ${num(R)} · ${num(q)}${hoch(n - 1)} — geometrisch mit a₁ = ${num(R)}, q = ${num(q)}, ${n} Summanden<br>` +
      `s = ${num(R)} · ${bruch(`${num(q)}${hoch(n)} − 1`, `${num(q)} − 1`)} ≈ <strong>${num(soll, 0)} €</strong>`,
  };
}

// ---------- K3: der springende Ball ----------
const K3_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const h of [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8]) for (const q of [0.25, 0.4, 0.5, 0.6, 0.7, 0.75, 0.8, 0.9]) out.push({ h, q });
  return out;
});
function generateK3() {
  const k = ohneKollision(K3_KANDIDATEN(), (v) => [v.h + (2 * v.h * v.q) / (1 - v.q), v.h / (1 - v.q), (2 * v.h) / (1 - v.q), (v.h * v.q) / (1 - v.q)], 0.01);
  const { h, q } = k;
  const soll = h + (2 * h * q) / (1 - q);
  return {
    promptHtml: `Ein Ball fällt aus ${num(h)} m Höhe und springt nach jedem Aufprall auf das ${num(q)}-fache der vorigen Höhe zurück.<br>` +
      `<strong>Welchen Weg legt er insgesamt zurück, bis er liegen bleibt?</strong>` +
      `<br><span class="progress-note">In Metern, auf zwei Nachkommastellen.</span>`,
    correct: soll,
    tolerance: 0.01,
    placeholder: "m",
    hinweis: (roh, v) => {
      if (nahe(v, h / (1 - q), 0.01)) return "Jede Sprunghöhe wird zweimal zurückgelegt — einmal hinauf, einmal hinunter. Nur die erste Fallhöhe einmal.";
      if (nahe(v, (2 * h) / (1 - q), 0.01)) return `Die ersten ${num(h)} m fällt der Ball nur hinunter, nicht hinauf.`;
      if (nahe(v, (h * q) / (1 - q), 0.01)) return "Das ist nur die Summe der Sprunghöhen, je einmal gezählt.";
      return "Weg = erste Fallhöhe + 2 · (Summe aller Sprunghöhen).";
    },
    tipps: [`Sprunghöhen: ${num(h * q)} m, ${num(h * q * q)} m, …`, "Jede Sprunghöhe zählt doppelt."],
    musterloesungHtml: `Sprunghöhen: ${num(h * q)} + ${num(h * q * q, 3)} + … = ${bruch(num(h * q), `1 − ${num(q)}`)} = ${num((h * q) / (1 - q))} m<br>` +
      `Weg = ${num(h)} + 2 · ${num((h * q) / (1 - q))} = <strong>${num(soll, 2)} m</strong>`,
  };
}

// ---------- K4: Achilles und die Schildkröte ----------
const K4_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const V of [50, 60, 80, 90, 100, 120, 150, 160, 180, 200, 240, 300]) for (const r of [2, 3, 4, 5, 6, 8, 10]) out.push({ V, r });
  return out;
});
function generateK4() {
  const k = ohneKollision(K4_KANDIDATEN(), (v) => [v.V / (1 - 1 / v.r), v.V, v.V * (1 + 1 / v.r), v.V / (1 + 1 / v.r)], 0.01);
  const { V, r } = k;
  const q = 1 / r;
  const soll = V / (1 - q);
  return {
    promptHtml: `Achilles läuft ${r}-mal so schnell wie eine Schildkröte, die ${V} m Vorsprung hat. Bis er ihren Startpunkt erreicht, ist sie ${num(V / r)} m weiter; bis er dort ist, wieder ein Stück, und so fort.<br>` +
      `<strong>Welche Strecke läuft Achilles insgesamt, bis er die Schildkröte einholt?</strong>` +
      `<br><span class="progress-note">In Metern, auf zwei Nachkommastellen.</span>`,
    correct: soll,
    tolerance: 0.01,
    placeholder: "m",
    hinweis: (roh, v) => {
      if (nahe(v, V, 0.01)) return "Das ist nur das erste Teilstück. Die Schildkröte läuft weiter.";
      if (nahe(v, V * (1 + q), 0.01)) return "Das sind nur die ersten beiden Teilstücke — es sind unendlich viele, aber ihre Summe ist endlich.";
      if (nahe(v, V / (1 + q), 0.01)) return `Vorzeichen: q = 1/${r} ist positiv, s = a₁ : (1 − q).`;
      return `Teilstücke: ${V}, ${num(V / r)}, ${num(V / r / r)}, … — geometrisch mit q = 1/${r}.`;
    },
    tipps: [`a₁ = ${V}, q = 1/${r}`],
    musterloesungHtml: `s = ${V} + ${num(V / r)} + ${num(V / r / r, 3)} + … = ${bruch(String(V), `1 − 1/${r}`)} = ${bruch(String(V * r), String(r - 1))} ≈ <strong>${num(soll, 2)} m</strong><br>` +
      `<strong>Probe:</strong> In dieser Zeit läuft die Schildkröte ${num(soll / r, 2)} m — zusammen mit ihrem Vorsprung ${num(V + soll / r, 2)} m ✓`,
  };
}

export const AUFGABEN = [
  { schwierigkeit: "einfach", titel: "Ein Glied explizit", generate: generateE1 },
  { schwierigkeit: "einfach", titel: "Ein Glied rekursiv", generate: generateE2 },
  { schwierigkeit: "einfach", titel: "Arithmetische Folge", generate: generateE3 },
  { schwierigkeit: "einfach", titel: "Geometrische Folge", generate: generateE4 },
  { schwierigkeit: "mittel", titel: "Arithmetisch aus zwei Gliedern", generate: generateM1 },
  { schwierigkeit: "mittel", titel: "Geometrisch aus zwei Gliedern", generate: generateM2 },
  { schwierigkeit: "mittel", titel: "Summe einer arithmetischen Folge", generate: generateM3 },
  { schwierigkeit: "mittel", titel: "Summe einer geometrischen Folge", generate: generateM4 },
  { schwierigkeit: "schwierig", titel: "Grenzwert eines Bruchs", generate: generateS1 },
  { schwierigkeit: "schwierig", titel: "n₀ zum ε-Streifen", generate: generateS2 },
  { schwierigkeit: "schwierig", titel: "Unendliche geometrische Reihe", generate: generateS3 },
  { schwierigkeit: "schwierig", titel: "Periodische Dezimalzahl", generate: generateS4 },
  { schwierigkeit: "komplex", titel: "Trainingsplan", generate: generateK1 },
  { schwierigkeit: "komplex", titel: "Sparplan", generate: generateK2 },
  { schwierigkeit: "komplex", titel: "Der springende Ball", generate: generateK3 },
  { schwierigkeit: "komplex", titel: "Achilles und die Schildkröte", generate: generateK4 },
];
