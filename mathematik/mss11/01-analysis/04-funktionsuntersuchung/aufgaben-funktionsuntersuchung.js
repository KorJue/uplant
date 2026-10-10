// Die vierundzwanzig Übungsaufgaben zu „Untersuchung ganzrationaler Funktionen“ (Thema 3.1) — sechs je Stufe.
//
//   einfach   — f″ an einer Stelle, Wendestelle, Hochstelle mit f″, ein Newton-Schritt, globales
//               Maximum auf einem Intervall.
//   mittel    — Wendepunkt, Hoch- und Tiefpunkt, Wendetangente, Sattelpunkt durch einen Parameter,
//               Krümmungsintervall einer Funktion vierten Grades.
//   schwierig — Scharparameter, punktsymmetrische Steckbriefaufgabe, Schachtel, Rechteck unter einer
//               Parabel, stärkstes Wachstum.
//   komplex   — kubische Funktion aus Extrem- und Wendepunkt, biquadratische Funktion mit
//               Wendetangente, Gewinn bei begrenzter Kapazität, zwei Newton-Schritte, Ortskurve.
//
// Die sechste Aufgabe jeder Stufe verlangt f′ und f″ einer jedes Mal neu gewürfelten Funktion
// (mathematik/terme.js): ganzrational, Potenzen und Wurzeln, Produkte zweier Polynome, Funktionenschar.
// Sinus, Kosinus und Verkettungen gehören zum Leistungsfach und werden in Thema 3.2 geübt.
//
// Gewürfelt wird konstruktiv: Die Kandidatenlisten werden vorher gesiebt, ohneKollision() wählt aus
// dem Rest. Jeder Fehlerwert ist von der Lösung und von den anderen Fehlerwerten verschieden — wo ein
// Fehler mit der Lösung zusammenfiele, steht NaN.

"use strict";

import { pot, produkt, q, ableitungsAufgabe, pick as zufall, mische } from "../../../terme.js?v=3";

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
function numK(x, stellen = 4) {
  return Math.round(x * Math.pow(10, stellen)) < 0 ? `(${num(x, stellen)})` : num(x, stellen);
}
// Ein Summand mit Rechenzeichen davor — das Vorzeichen steckt nur hier.
function plusMinus(x, stellen = 4) {
  return (x < 0 ? "− " : "+ ") + num(Math.abs(x), stellen);
}
// Ein Glied c · x^k mit Vorzeichen, ohne „1x“ und „+ −“: glied(−1, "x²", true) = „− x²“.
function glied(c, potenz, mitZeichen) {
  const betrag = Math.abs(c) === 1 && potenz ? "" : num(Math.abs(c));
  const kern = betrag + potenz;
  if (!mitZeichen) return (c < 0 ? "−" : "") + kern;
  return (c < 0 ? "− " : "+ ") + kern;
}
// Ein Polynom aus [Koeffizient, Potenz]-Paaren; Nullen fallen weg, das erste Glied ohne „+“.
function poly(glieder) {
  let s = "";
  for (const [c, p] of glieder) {
    if (Math.abs(c) < 1e-12) continue;
    s += s ? " " + glied(c, p, true) : glied(c, p, false);
  }
  return s || "0";
}
// Eine eingesetzte Summe „6 · 2² − 2 · 2 + 3“; Summanden mit Koeffizient 0 fallen weg.
function einsetzen(paare) {
  let s = "";
  for (const [c, rest] of paare) {
    if (Math.abs(c) < 1e-12) continue;
    const t = rest ? `${num(Math.abs(c))} · ${rest}` : num(Math.abs(c));
    s += s ? ` ${c < 0 ? "−" : "+"} ${t}` : `${c < 0 ? "−" : ""}${t}`;
  }
  return s || "0";
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
// Glatt heißt: mit dieser Stellenzahl exakt darstellbar. Ganzzahlig gerechnet, damit
// 1,375 · 1000 nicht als 1374,9999… durchfällt.
function glatt(x, stellen = 4) {
  const f = Math.pow(10, stellen);
  return Math.abs(Math.round(x * f) - x * f) < 1e-6;
}
// Große Kandidatenlisten erst beim ersten Würfeln bauen, nicht beim Laden der Seite.
function spaeter(bauen) {
  let liste = null;
  return () => (liste ??= bauen());
}
function bruch(z, n) {
  return `<span class="bruch"><span class="z">${z}</span><span class="n">${n}</span></span>`;
}
export function parseZahl(raw) {
  if (raw == null) return NaN;
  let s = String(raw).trim().replace(/\s/g, "").replace(/−/g, "-").replace(/°$/, "");
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

const ZAHL = `<br><span class="progress-note">Gib das Ergebnis als Zahl oder Bruch ein (Komma als Dezimalzeichen).</span>`;
const TOL = 0.0001;
const EPS = 0.001;


const RUND4 = `<br><span class="progress-note">Runde auf vier Nachkommastellen.</span>`;

// Kubische Funktion mit f′(x) = k(x − p)(x − q): f(x) = k(x³/3 − (p + q)/2 · x² + pq · x) + d.
// k ist ein Vielfaches von 1,5, damit alle Koeffizienten abbrechen.
function kubikAusNullstellen(k, p, q, d) {
  const c3 = k / 3, c2 = (-k * (p + q)) / 2, c1 = k * p * q;
  const f = (x) => c3 * x ** 3 + c2 * x * x + c1 * x + d;
  return { c3, c2, c1, d, f, d1: (x) => k * (x - p) * (x - q), d2: (x) => 2 * c2 + 6 * c3 * x };
}
const KUBIK_TEILE = spaeter(() => {
  const out = [];
  for (const k of [3, -3, 6, -6, 1.5, -1.5]) for (const p of [-3, -2, -1, 0, 1, 2]) for (const q of [-2, -1, 0, 1, 2, 3]) {
    if (q <= p) continue;
    for (const d of [-2, 0, 1, 4]) out.push({ k, p, q, d });
  }
  return out;
});

// ================= einfach =================

// ---------- E1: zweite Ableitung an einer Stelle ----------
const E1_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const e of [0, 0.25, 0.5, -0.5, 1]) for (const a of [-2, -1, 1, 2]) for (const b of [-3, -1, 0, 2]) for (const c of [-2, 1, 3]) for (const x0 of [-2, -1, 1, 2, 3]) out.push({ e, a, b, c, d: 2, x0 });
  return out;
});
function e1Werte(v) {
  const { e, a, b, c, d, x0 } = v;
  return {
    f: e * x0 ** 4 + a * x0 ** 3 + b * x0 * x0 + c * x0 + d,
    f1: 4 * e * x0 ** 3 + 3 * a * x0 * x0 + 2 * b * x0 + c,
    f2: 12 * e * x0 * x0 + 6 * a * x0 + 2 * b,
    f3: 24 * e * x0 + 6 * a,
  };
}
function generateE1() {
  const k = ohneKollision(E1_KANDIDATEN(), (v) => { const w = e1Werte(v); return [w.f2, w.f1, w.f3, w.f]; }, EPS);
  const { e, a, b, c, d, x0 } = k;
  const w = e1Werte(k);
  const f1t = poly([[4 * e, "x³"], [3 * a, "x²"], [2 * b, "x"], [c, ""]]);
  const f2t = poly([[12 * e, "x²"], [6 * a, "x"], [2 * b, ""]]);
  return {
    promptHtml: `Gegeben ist f(x) = ${poly([[e, "x⁴"], [a, "x³"], [b, "x²"], [c, "x"], [d, ""]])}.<br><strong>Berechne f″(${num(x0)}).</strong>` + ZAHL,
    correct: w.f2,
    tolerance: TOL,
    placeholder: "f″(x₀)",
    hinweis: (roh, v) => {
      if (nahe(v, w.f1, TOL)) return `Das ist f′(${num(x0)}) — nur einmal abgeleitet. f″ ist die Ableitung von f′.`;
      if (nahe(v, w.f3, TOL)) return `Das ist f‴(${num(x0)}) — einmal zu oft abgeleitet.`;
      if (nahe(v, w.f, TOL)) return `Das ist der Funktionswert f(${num(x0)}). Erst zweimal ableiten, dann einsetzen.`;
      return `Leite zweimal ab: f′(x) = ${f1t}, dann f″(x). Erst danach x = ${num(x0)} einsetzen.`;
    },
    tipps: [`f′(x) = ${f1t}`, `f″(x) = ${f2t}`],
    musterloesungHtml: `f′(x) = ${f1t}<br>f″(x) = ${f2t}<br>f″(${num(x0)}) = ${einsetzen([[12 * e, `${numK(x0)}²`], [6 * a, numK(x0)], [2 * b, ""]])} = <strong>${num(w.f2)}</strong>`,
  };
}

// ---------- E2: Wendestelle einer kubischen Funktion ----------
const E2_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const a of [1, -1, 2, -2, 0.5, 3]) for (const xw of [-2, -1, 0, 1, 2, 3]) for (const c of [-3, -1, 2, 4]) for (const d of [-2, 1, 3]) out.push({ a, b: -3 * a * xw, c, d, xw });
  return out;
});
function e2Werte(v) {
  const f = (x) => v.a * x ** 3 + v.b * x * x + v.c * x + v.d;
  // Bei x_W = 0 fallen Vorzeichen- und Faktorfehler mit der Lösung zusammen — dort NaN.
  return { f, yw: f(v.xw), minus: v.xw === 0 ? NaN : -v.xw, dreifach: v.xw === 0 ? NaN : 3 * v.xw };
}
function generateE2() {
  const k = ohneKollision(E2_KANDIDATEN(), (v) => { const w = e2Werte(v); return [v.xw, w.yw, w.minus, w.dreifach]; }, EPS);
  const { a, b, c, d, xw } = k;
  const w = e2Werte(k);
  return {
    promptHtml: `Gegeben ist f(x) = ${poly([[a, "x³"], [b, "x²"], [c, "x"], [d, ""]])}.<br><strong>Bestimme die Wendestelle x<sub>W</sub>.</strong>` + ZAHL,
    correct: xw,
    tolerance: TOL,
    placeholder: "x_W",
    hinweis: (roh, v) => {
      if (nahe(v, w.yw, TOL)) return `Das ist f(x<sub>W</sub>), die y-Koordinate des Wendepunkts. Gefragt ist die Stelle x<sub>W</sub>.`;
      if (nahe(v, w.minus, TOL)) return "Vorzeichen: Aus f″(x) = 6ax + 2b = 0 folgt 6ax = −2b — beim Hinüberbringen wechselt das Vorzeichen.";
      if (nahe(v, w.dreifach, TOL)) return "Hier fehlt ein Faktor 3: Aus f″(x) = 6ax + 2b = 0 folgt x = −2b : (6a) = −b : (3a), nicht −b : a.";
      return "Setze f″(x) = 0 und löse nach x auf.";
    },
    tipps: [`f′(x) = ${poly([[3 * a, "x²"], [2 * b, "x"], [c, ""]])}`, `f″(x) = ${poly([[6 * a, "x"], [2 * b, ""]])}; f‴(x) = ${num(6 * a)} ≠ 0`],
    musterloesungHtml: `f″(x) = ${poly([[6 * a, "x"], [2 * b, ""]])} = 0 ⟺ x = <strong>${num(xw)}</strong><br>f‴(x) = ${num(6 * a)} ≠ 0, also ist ${num(xw)} wirklich eine Wendestelle; W(${num(xw)} | ${num(w.yw)}).`,
  };
}

// ---------- E3: Hochstelle mit der zweiten Ableitung ----------
function e3Werte(v) {
  const g = kubikAusNullstellen(v.k, v.p, v.q, v.d);
  const xh = v.k > 0 ? v.p : v.q, xt = v.k > 0 ? v.q : v.p;
  return { g, xh, xt, mitte: (v.p + v.q) / 2, yh: g.f(xh) };
}
function generateE3() {
  const k = ohneKollision(KUBIK_TEILE(), (v) => { const w = e3Werte(v); return [w.xh, w.xt, w.mitte, w.yh]; }, EPS);
  const w = e3Werte(k);
  const { c3, c2, c1, d } = w.g;
  return {
    promptHtml: `Gegeben ist f(x) = ${poly([[c3, "x³"], [c2, "x²"], [c1, "x"], [d, ""]])}.<br><strong>Bestimme die Stelle x<sub>H</sub> des Hochpunkts.</strong>` + ZAHL,
    correct: w.xh,
    tolerance: TOL,
    placeholder: "x_H",
    hinweis: (roh, v) => {
      if (nahe(v, w.xt, TOL)) return `An der Stelle ${num(w.xt)} ist f″ = ${num(w.g.d2(w.xt))} &gt; 0 — das ist der Tiefpunkt. Beim Hochpunkt ist f″ negativ.`;
      if (nahe(v, w.mitte, TOL)) return "Das ist die Wendestelle, genau zwischen den beiden Extremstellen.";
      if (nahe(v, w.yh, TOL)) return "Das ist f(x<sub>H</sub>), die y-Koordinate. Gefragt ist die Stelle.";
      return "Bestimme die Nullstellen von f′ und prüfe sie mit f″.";
    },
    tipps: [`f′(x) = ${poly([[3 * c3, "x²"], [2 * c2, "x"], [c1, ""]])} = ${num(k.k)} · ${linear(k.p)} · ${linear(k.q)}`, `f″(x) = ${poly([[6 * c3, "x"], [2 * c2, ""]])}`],
    musterloesungHtml: `f′(x) = ${poly([[3 * c3, "x²"], [2 * c2, "x"], [c1, ""]])} = ${num(k.k)} · ${linear(k.p)} · ${linear(k.q)} = 0 ⟺ x = ${num(k.p)} oder x = ${num(k.q)}<br>` +
      `f″(x) = ${poly([[6 * c3, "x"], [2 * c2, ""]])}: f″(${num(w.xh)}) = ${num(w.g.d2(w.xh))} &lt; 0 ⟹ Hochpunkt; f″(${num(w.xt)}) = ${num(w.g.d2(w.xt))} &gt; 0 ⟹ Tiefpunkt.<br>` +
      `x<sub>H</sub> = <strong>${num(w.xh)}</strong>, H(${num(w.xh)} | ${num(w.yh)})`,
  };
}
// Linearfaktor (x − r) mit richtigem Vorzeichen; für r = 0 steht nur x da.
function linear(r) {
  return r === 0 ? "x" : `(x ${plusMinus(-r)})`;
}

// ---------- E4: ein Schritt des Newton-Verfahrens ----------
const E4_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const p of [-4, -3, -2, -1, 1, 2]) for (const q of [-6, -5, -3, -1, 2, 4]) for (const x0 of [-2, -1, 1, 2, 3]) {
    const f = x0 ** 3 + p * x0 + q, d = 3 * x0 * x0 + p;
    if (d === 0 || f === 0) continue;
    const x1 = x0 - f / d;
    if (!glatt(x1, 4)) continue;
    out.push({ p, q, x0, f, d, x1 });
  }
  return out;
});
function generateE4() {
  const k = ohneKollision(E4_KANDIDATEN(), (v) => [v.x1, v.x0 + v.f / v.d, v.x0 - v.d / v.f, -v.f / v.d], EPS);
  const { p, q, x0, f, d, x1 } = k;
  return {
    promptHtml: `Gesucht ist eine Nullstelle von f(x) = ${poly([[1, "x³"], [p, "x"], [q, ""]])} mit dem Newton-Verfahren.<br><strong>Berechne x₁ zum Startwert x₀ = ${num(x0)}.</strong>` + ZAHL,
    correct: x1,
    tolerance: TOL,
    placeholder: "x₁",
    hinweis: (roh, v) => {
      if (nahe(v, x0 + f / d, TOL)) return `Vorzeichen: x₁ = x₀ − f(x₀)/f′(x₀), hier ${num(x0)} − (${num(f)})/${numK(d)}.`;
      if (nahe(v, x0 - d / f, TOL)) return "Zähler und Nenner sind vertauscht: f(x₀) steht oben, f′(x₀) unten.";
      if (nahe(v, -f / d, TOL)) return "Das ist nur die Korrektur −f(x₀)/f′(x₀). Sie wird zu x₀ addiert.";
      return "x₁ = x₀ − f(x₀)/f′(x₀): Berechne f(x₀) und f′(x₀) und setze ein.";
    },
    tipps: [`f′(x) = ${poly([[3, "x²"], [p, ""]])}`, `f(${num(x0)}) = ${num(f)}, f′(${num(x0)}) = ${num(d)}`],
    musterloesungHtml: `f(${num(x0)}) = ${num(f)}, f′(x) = ${poly([[3, "x²"], [p, ""]])}, f′(${num(x0)}) = ${num(d)}<br>` +
      `x₁ = ${num(x0)} − ${bruch(num(f), num(d))} = <strong>${num(x1)}</strong><br>Die Tangente in (${num(x0)} | ${num(f)}) schneidet die x-Achse bei ${num(x1)}.`,
  };
}

// ---------- E5: globales Maximum auf einem Intervall ----------
// f(x) = k(x³ − 3p²x) hat H(−p | 2kp³) und T(p | −2kp³); die Ränder sind Vielfache von p, damit alle
// Werte abbrechen.
const E5_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const k of [1, 0.5, 2]) for (const p of [1, 2]) for (const l of [-2, -1.5, -0.5, 0]) for (const r of [0.5, 1, 1.5, 2]) out.push({ k, p, l: l * p, r: r * p });
  return out;
});
function e5Werte(v) {
  const f = (x) => v.k * (x ** 3 - 3 * v.p * v.p * x);
  const kand = [v.l, v.r];
  if (-v.p > v.l && -v.p < v.r) kand.push(-v.p);
  if (v.p > v.l && v.p < v.r) kand.push(v.p);
  const werte = kand.map(f);
  const max = Math.max(...werte), min = Math.min(...werte);
  const hoch = -v.p > v.l && -v.p < v.r ? f(-v.p) : NaN;
  // Der kleinere Randwert — der Fehler, nur einen Rand anzuschauen.
  const randKlein = Math.min(f(v.l), f(v.r));
  return { f, max, min, hoch: Math.abs(hoch - max) < 1e-9 ? NaN : hoch, randKlein: Math.abs(randKlein - min) < 1e-9 ? NaN : randKlein };
}
function generateE5() {
  const k = ohneKollision(E5_KANDIDATEN(), (v) => { const w = e5Werte(v); return [w.max, w.min, w.hoch, w.randKlein]; }, EPS);
  const w = e5Werte(k);
  const { l, r, p } = k;
  const kandidaten = [l, r, ...[-p, p].filter((x) => x > l && x < r)].sort((x, y) => x - y);
  return {
    promptHtml: `Gegeben ist f(x) = ${poly([[k.k, "x³"], [-3 * k.k * p * p, "x"]])} auf dem Intervall [${num(l)}; ${num(r)}].<br><strong>Bestimme den größten Funktionswert von f auf diesem Intervall (das globale Maximum).</strong>` + ZAHL,
    correct: w.max,
    tolerance: TOL,
    placeholder: "globales Maximum",
    hinweis: (roh, v) => {
      if (nahe(v, w.hoch, TOL)) return "Das ist der Wert im Hochpunkt — ein lokales Maximum. Am Rand ist f hier noch größer: Vergleiche alle Kandidaten.";
      if (nahe(v, w.min, TOL)) return "Das ist der kleinste Wert, das globale Minimum.";
      if (nahe(v, w.randKlein, TOL)) return "Das ist ein Randwert, aber nicht der größte. Beide Ränder und die Extremstellen im Inneren vergleichen.";
      return "Kandidaten sind die Stellen mit f′(x) = 0 im Inneren und die beiden Ränder.";
    },
    tipps: [`f′(x) = ${poly([[3 * k.k, "x²"], [-3 * k.k * p * p, ""]])} = 0 ⟺ x = ±${num(p)}`, "Vergleiche f an den Rändern und an den Extremstellen im Intervall."],
    musterloesungHtml: `Kandidaten: ${kandidaten.map((x) => `f(${num(x)}) = ${num(w.f(x))}`).join(", ")}<br>Größter Wert: <strong>${num(w.max)}</strong>`,
  };
}

// ================= mittel =================

// ---------- M1: Wendepunkt ----------
function m1Werte(v) {
  const f = (x) => v.a * x ** 3 + v.b * x * x + v.c * x + v.d;
  const f1 = (x) => 3 * v.a * x * x + 2 * v.b * x + v.c;
  const yw = f(v.xw);
  return { f, f1, yw, steigung: f1(v.xw), spiegel: v.xw === 0 ? NaN : f(-v.xw), minus: v.xw === 0 ? NaN : -v.xw };
}
function generateM1() {
  const k = ohneFeldKollision(E2_KANDIDATEN(), (v) => { const w = m1Werte(v); return [[v.xw, w.minus], [w.yw, w.steigung, w.spiegel]]; }, EPS);
  const { a, b, c, d, xw } = k;
  const w = m1Werte(k);
  return {
    promptHtml: `Gegeben ist f(x) = ${poly([[a, "x³"], [b, "x²"], [c, "x"], [d, ""]])}.<br><strong>Bestimme den Wendepunkt W(x<sub>W</sub> | y<sub>W</sub>).</strong>` + ZAHL,
    felder: [
      { name: "x<sub>W</sub> =", soll: xw, toleranz: TOL, hinweis: (roh, v) => (nahe(v, w.minus, TOL) ? "Vorzeichen: Aus 6ax + 2b = 0 folgt 6ax = −2b." : "Setze f″(x) = 0.") },
      { name: "y<sub>W</sub> =", soll: w.yw, toleranz: TOL, hinweis: (roh, v) => (nahe(v, w.steigung, TOL) ? "Das ist f′(x<sub>W</sub>), die Steigung der Wendetangente. y<sub>W</sub> ist f(x<sub>W</sub>)." : nahe(v, w.spiegel, TOL) ? "Eingesetzt wurde −x<sub>W</sub> statt x<sub>W</sub>." : "Setze x<sub>W</sub> in f ein, nicht in eine Ableitung.") },
    ],
    tipps: [`f″(x) = ${poly([[6 * a, "x"], [2 * b, ""]])}`, "y<sub>W</sub> = f(x<sub>W</sub>)"],
    musterloesungHtml: `f′(x) = ${poly([[3 * a, "x²"], [2 * b, "x"], [c, ""]])}, f″(x) = ${poly([[6 * a, "x"], [2 * b, ""]])}, f‴(x) = ${num(6 * a)} ≠ 0<br>` +
      `f″(x) = 0 ⟺ x = ${num(xw)}; f(${num(xw)}) = ${num(w.yw)}<br><strong>W(${num(xw)} | ${num(w.yw)})</strong>`,
  };
}

// ---------- M2: Hoch- und Tiefpunkt ----------
function generateM2() {
  const k = ohneFeldKollision(KUBIK_TEILE(), (v) => {
    const w = e3Werte(v);
    return [[w.xh, w.xt], [w.yh, w.g.f(w.xt)], [w.xt, w.xh], [w.g.f(w.xt), w.yh]];
  }, EPS);
  const w = e3Werte(k);
  const { c3, c2, c1, d } = w.g;
  const yt = w.g.f(w.xt);
  const tausch = "Hoch- und Tiefpunkt sind vertauscht: Beim Hochpunkt ist f″ negativ, beim Tiefpunkt positiv.";
  return {
    promptHtml: `Gegeben ist f(x) = ${poly([[c3, "x³"], [c2, "x²"], [c1, "x"], [d, ""]])}.<br><strong>Bestimme den Hochpunkt H(x<sub>H</sub> | y<sub>H</sub>) und den Tiefpunkt T(x<sub>T</sub> | y<sub>T</sub>).</strong>` + ZAHL,
    felder: [
      { name: "x<sub>H</sub> =", soll: w.xh, toleranz: TOL, hinweis: (roh, v) => (nahe(v, w.xt, TOL) ? tausch : "Nullstellen von f′, dann f″.") },
      { name: "y<sub>H</sub> =", soll: w.yh, toleranz: TOL, hinweis: (roh, v) => (nahe(v, yt, TOL) ? tausch : "y<sub>H</sub> = f(x<sub>H</sub>).") },
      { name: "x<sub>T</sub> =", soll: w.xt, toleranz: TOL, hinweis: (roh, v) => (nahe(v, w.xh, TOL) ? tausch : "Nullstellen von f′, dann f″.") },
      { name: "y<sub>T</sub> =", soll: yt, toleranz: TOL, hinweis: (roh, v) => (nahe(v, w.yh, TOL) ? tausch : "y<sub>T</sub> = f(x<sub>T</sub>).") },
    ],
    tipps: [`f′(x) = ${poly([[3 * c3, "x²"], [2 * c2, "x"], [c1, ""]])} = ${num(k.k)} · ${linear(k.p)} · ${linear(k.q)}`, `f″(x) = ${poly([[6 * c3, "x"], [2 * c2, ""]])}`],
    musterloesungHtml: `f′(x) = ${num(k.k)} · ${linear(k.p)} · ${linear(k.q)} = 0 ⟺ x = ${num(k.p)} oder x = ${num(k.q)}<br>` +
      `f″(${num(w.xh)}) = ${num(w.g.d2(w.xh))} &lt; 0: <strong>H(${num(w.xh)} | ${num(w.yh)})</strong>; f″(${num(w.xt)}) = ${num(w.g.d2(w.xt))} &gt; 0: <strong>T(${num(w.xt)} | ${num(yt)})</strong>`,
  };
}

// ---------- M3: Wendetangente ----------
function m3Werte(v) {
  const w = m1Werte(v);
  const m = w.steigung, n = w.yw - m * v.xw;
  // Bei x_W = 0 oder m = 0 fällt der Vorzeichenfehler mit dem richtigen Achsenabschnitt zusammen.
  return { ...w, m, n, vorzeichen: v.xw === 0 || m === 0 ? NaN : w.yw + m * v.xw };
}
function generateM3() {
  const k = ohneFeldKollision(E2_KANDIDATEN(), (v) => { const w = m3Werte(v); return [[w.m, w.yw], [w.n, w.yw, w.vorzeichen]]; }, EPS);
  const { a, b, c, d, xw } = k;
  const w = m3Werte(k);
  return {
    promptHtml: `Gegeben ist f(x) = ${poly([[a, "x³"], [b, "x²"], [c, "x"], [d, ""]])}.<br><strong>Bestimme die Gleichung der Wendetangente</strong> in der Form t(x) = m · x + b.` + ZAHL,
    felder: [
      { name: "m =", soll: w.m, toleranz: TOL, hinweis: (roh, v) => (nahe(v, w.yw, TOL) ? "Das ist f(x<sub>W</sub>), die Höhe des Wendepunkts. Die Steigung ist f′(x<sub>W</sub>)." : "Steigung der Wendetangente: f′(x<sub>W</sub>).") },
      { name: "b =", soll: w.n, toleranz: TOL, hinweis: (roh, v) => (nahe(v, w.yw, TOL) ? "f(x<sub>W</sub>) ist die y-Koordinate von W, nicht der Achsenabschnitt — der liegt bei x = 0." : nahe(v, w.vorzeichen, TOL) ? "Vorzeichen: b = f(x<sub>W</sub>) − m · x<sub>W</sub>." : "Setze W in t(x) = m · x + b ein.") },
    ],
    tipps: [`f″(x) = ${poly([[6 * a, "x"], [2 * b, ""]])} = 0 ⟺ x = ${num(xw)}`, `W(${num(xw)} | ${num(w.yw)}), m = f′(${num(xw)})`],
    musterloesungHtml: `f″(x) = ${poly([[6 * a, "x"], [2 * b, ""]])} = 0 ⟺ x<sub>W</sub> = ${num(xw)}; W(${num(xw)} | ${num(w.yw)})<br>` +
      `m = f′(${num(xw)}) = ${num(w.m)}; b = ${num(w.yw)} − ${numK(w.m)} · ${numK(xw)} = ${num(w.n)}<br>` +
      `<strong>t(x) = ${poly([[w.m, "x"], [w.n, ""]])}</strong>. <strong>Probe:</strong> t(${num(xw)}) = ${num(w.m * xw + w.n)} = f(${num(xw)}) ✓`,
  };
}

// ---------- M4: Parameter für einen Sattelpunkt ----------
const M4_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const a of [1, -1, 2, 0.5, -2]) for (const w of [-2, -1, 1, 2, 3]) for (const d of [0, 1, -3]) out.push({ a, b: -3 * a * w, k: 3 * a * w * w, w, d });
  return out;
});
function generateM4() {
  // Fehler: Vorzeichen (−3aw²); f′ ohne Faktor 2 bei bx² (dann käme k = 0 heraus).
  const kk = ohneFeldKollision(M4_KANDIDATEN(), (v) => [[v.k, -v.k, 0], [v.w, -v.w]], EPS);
  const { a, b, k, w, d } = kk;
  const term = `${poly([[a, "x³"], [b, "x²"]])} + k · x${d === 0 ? "" : " " + plusMinus(d)}`;
  return {
    promptHtml: `Gegeben ist die Funktionenschar f(x) = ${term}.<br><strong>Für welchen Wert von k hat der Graph einen Sattelpunkt? Gib k und die Stelle x<sub>S</sub> des Sattelpunkts an.</strong>` + ZAHL,
    felder: [
      { name: "k =", soll: k, toleranz: TOL, hinweis: (roh, v) => (nahe(v, -k, TOL) ? "Vorzeichen: Aus f′(x<sub>S</sub>) = 0 folgt k = −3a · x<sub>S</sub>² − 2b · x<sub>S</sub>." : nahe(v, 0, TOL) ? "Die Ableitung von bx² ist 2bx — der Faktor 2 fehlt." : "Ein Sattelpunkt ist ein Wendepunkt mit f′ = 0: erst f″(x) = 0, dann f′(x<sub>S</sub>) = 0.") },
      { name: "x<sub>S</sub> =", soll: w, toleranz: TOL, hinweis: (roh, v) => (nahe(v, -w, TOL) ? "Vorzeichen: Aus 6ax + 2b = 0 folgt 6ax = −2b." : "Die Stelle des Sattelpunkts ist die Wendestelle: f″(x) = 0.") },
    ],
    tipps: [`f′(x) = ${poly([[3 * a, "x²"], [2 * b, "x"]])} + k, f″(x) = ${poly([[6 * a, "x"], [2 * b, ""]])}`, "f″ hängt nicht von k ab — die Wendestelle liegt für alle k fest."],
    musterloesungHtml: `f″(x) = ${poly([[6 * a, "x"], [2 * b, ""]])} = 0 ⟺ x = ${num(w)}; f‴(x) = ${num(6 * a)} ≠ 0.<br>` +
      `Sattelpunkt: zusätzlich f′(${num(w)}) = 0: ${einsetzen([[3 * a, `${numK(w)}²`], [2 * b, numK(w)]])} + k = 0 ⟹ <strong>k = ${num(k)}</strong>, <strong>x<sub>S</sub> = ${num(w)}</strong><br>` +
      `<strong>Probe:</strong> f′(x) = ${poly([[3 * a, "x²"], [2 * b, "x"], [k, ""]])} = ${num(3 * a)}${linear(w)}² — doppelte Nullstelle, kein Vorzeichenwechsel ✓`,
  };
}

// ---------- M5: Krümmungsintervall einer Funktion vierten Grades ----------
// f″(x) = 12a · (x − w₁)(x − w₂): Gewürfelt werden die Wendestellen w₁ < w₂ und a, daraus b und c.
// Zwischen den Wendestellen hat f″ das Vorzeichen von −a — gefragt wird nach genau diesem Intervall.
// Fehlerbild: f″ aus den Koeffizienten ohne die Faktoren 12, 6 und 2 (also ax² + bx + c = 0); wo das
// keine glatten Stellen liefert, steht NaN.
const M5_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const a of [0.25, 0.5, 1, -0.25, -0.5, -1]) for (const w1 of [-3, -2, -1, 0, 1]) for (const w2 of [-1, 0, 1, 2, 3]) for (const d of [0, 1, -2]) {
    if (w2 <= w1) continue;
    const b = -2 * a * (w1 + w2), c = 6 * a * w1 * w2;
    if (!glatt(b, 4) || !glatt(c, 4)) continue;
    const D = b * b - 4 * a * c;
    const r = D >= 0 ? [(-b - Math.sqrt(D)) / (2 * a), (-b + Math.sqrt(D)) / (2 * a)].sort((p, q) => p - q) : [NaN, NaN];
    const [f1, f2] = r.map((z) => (glatt(z, 4) ? z : NaN));
    out.push({ a, w1, w2, b, c, d, f1, f2 });
  }
  return out;
});
function generateM5() {
  const k = ohneFeldKollision(M5_KANDIDATEN(), (v) => [[v.w1, v.w2, v.f1], [v.w2, v.w1, v.f2]], EPS);
  const { a, w1, w2, b, c, d, f1, f2 } = k;
  const art = a > 0 ? "Rechtskurve" : "Linkskurve";
  const fT = poly([[a, "x⁴"], [b, "x³"], [c, "x²"], [d, ""]]);
  const d2 = poly([[12 * a, "x²"], [6 * b, "x"], [2 * c, ""]]);
  const hin = (andere, ohne) => (roh, z) => (nahe(z, andere, TOL) ? "Die Grenzen sind vertauscht — x₁ ist die kleinere." :
    nahe(z, ohne, TOL) ? `Beim zweimaligen Ableiten entstehen die Faktoren 12, 6 und 2: f″(x) = ${d2}, nicht ${poly([[a, "x²"], [b, "x"], [c, ""]])}.` :
    `Die Grenzen des Intervalls sind die Nullstellen von f″(x) = ${d2}.`);
  return {
    promptHtml: `Gegeben ist f(x) = ${fT}.<br><strong>Auf welchem Intervall ]x₁; x₂[ ist der Graph von f eine ${art}?</strong>` + ZAHL,
    felder: [
      { name: "x₁ =", soll: w1, toleranz: TOL, hinweis: hin(w2, f1) },
      { name: "x₂ =", soll: w2, toleranz: TOL, hinweis: hin(w1, f2) },
    ],
    tipps: [`f′(x) = ${poly([[4 * a, "x³"], [3 * b, "x²"], [2 * c, "x"]])}, f″(x) = ${d2}`, `${art}: f″(x) ${a > 0 ? "&lt;" : "&gt;"} 0. Eine nach ${a > 0 ? "oben" : "unten"} geöffnete Parabel ist zwischen ihren Nullstellen ${a > 0 ? "negativ" : "positiv"}.`],
    musterloesungHtml: `f″(x) = ${d2} = ${num(12 * a)} · ${w1 === 0 ? "x" : `(x ${plusMinus(-w1)})`} · ${w2 === 0 ? "x" : `(x ${plusMinus(-w2)})`}<br>` +
      `Nullstellen ${num(w1)} und ${num(w2)}; der Graph von f″ ist eine nach ${a > 0 ? "oben" : "unten"} geöffnete Parabel, also ist f″ dazwischen ${a > 0 ? "negativ" : "positiv"}.<br>` +
      `<strong>${art} auf ]${num(w1)}; ${num(w2)}[</strong>. <strong>Probe:</strong> f″(${num((w1 + w2) / 2)}) = ${num(12 * a * ((w1 + w2) / 2 - w1) * ((w1 + w2) / 2 - w2))} ${a > 0 ? "&lt;" : "&gt;"} 0 ✓`,
  };
}

// ================= schwierig =================

// ---------- S1: Scharparameter aus dem Tiefpunkt ----------
const S1_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const a of [0.5, 1, 1.5, 2, 2.5, 3]) for (const k of [1, 0.5, 2, 0.25, 4]) out.push({ a, k, yt: -2 * k * a ** 3 });
  return out;
});
function generateS1() {
  // Fehler: die dritte Wurzel vergessen (a³), Quadrat- statt Kubikwurzel. Bei a = 1 fallen beide mit
  // der Lösung zusammen — dort NaN.
  const s1Fehler = (v) => (v.a === 1 ? [NaN, NaN] : [v.a ** 3, Math.sqrt(v.a ** 3)]);
  const k = ohneKollision(S1_KANDIDATEN(), (v) => [v.a, ...s1Fehler(v)], EPS);
  const { a, k: kk, yt } = k;
  const [kubus, quadratwurzel] = s1Fehler(k);
  return {
    promptHtml: `Gegeben ist die Funktionenschar f<sub>a</sub>(x) = ${poly([[kk, "x³"]])} − ${num(3 * kk)}a² · x mit a &gt; 0.<br><strong>Für welchen Wert von a hat der Tiefpunkt von f<sub>a</sub> die y-Koordinate ${num(yt)}?</strong>` + ZAHL,
    correct: a,
    tolerance: TOL,
    placeholder: "a",
    hinweis: (roh, v) => {
      if (nahe(v, kubus, TOL)) return "Das ist a³ — es fehlt noch die dritte Wurzel.";
      if (nahe(v, quadratwurzel, TOL)) return "Hier wurde die Quadratwurzel gezogen; a³ verlangt die dritte Wurzel.";
      return "Bestimme den Tiefpunkt in Abhängigkeit von a und setze seine y-Koordinate gleich dem gegebenen Wert.";
    },
    tipps: [`f<sub>a</sub>′(x) = ${num(3 * kk)}x² − ${num(3 * kk)}a² = 0 ⟺ x = ±a`, `f<sub>a</sub>″(a) = ${num(6 * kk)}a &gt; 0: T(a | −${num(2 * kk)}a³)`],
    musterloesungHtml: `f<sub>a</sub>′(x) = ${num(3 * kk)}(x² − a²) = 0 ⟺ x = ±a; f<sub>a</sub>″(x) = ${num(6 * kk)}x, f<sub>a</sub>″(a) &gt; 0 ⟹ Tiefpunkt bei x = a.<br>` +
      `f<sub>a</sub>(a) = ${num(kk)}a³ − ${num(3 * kk)}a³ = −${num(2 * kk)}a³ = ${num(yt)} ⟹ a³ = ${num(a ** 3)} ⟹ <strong>a = ${num(a)}</strong>`,
  };
}

// ---------- S2: punktsymmetrische Funktion aus einem Extrempunkt ----------
const S2_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const u of [0.5, 1, 1.5, 2, 3]) for (const v of [1, 2, 3, 4, 6, -1, -2, -3, -4, -6]) {
    const a = -v / (2 * u ** 3), c = (3 * v) / (2 * u);
    if (glatt(a, 4) && glatt(c, 4)) out.push({ u, v, a, c });
  }
  return out;
});
function generateS2() {
  const k = ohneFeldKollision(S2_KANDIDATEN(), (w) => [[w.a, -w.a], [w.c, -w.c, w.v / w.u]], EPS);
  const { u, v, a, c } = k;
  const art = v > 0 ? "Hochpunkt" : "Tiefpunkt";
  return {
    promptHtml: `Der Graph einer ganzrationalen Funktion dritten Grades ist punktsymmetrisch zum Ursprung und hat im Punkt P(${num(u)} | ${num(v)}) einen ${art}.<br><strong>Bestimme f(x) = ax³ + cx.</strong>` + ZAHL,
    felder: [
      { name: "a =", soll: a, toleranz: TOL, hinweis: (r, x) => (nahe(x, -a, TOL) ? "Vorzeichen: Aus c = −3u²a eingesetzt folgt u³a − 3u³a = v, also −2u³a = v." : "Zwei Bedingungen: f(u) = v und f′(u) = 0.") },
      { name: "c =", soll: c, toleranz: TOL, hinweis: (r, x) => (nahe(x, -c, TOL) ? "Vorzeichen: Aus 3au² + c = 0 folgt c = −3au²." : nahe(x, v / u, TOL) ? "Hier wurde nur f(u) = v mit a = 0 benutzt. Die waagerechte Tangente f′(u) = 0 gehört dazu." : "Löse das Gleichungssystem aus f(u) = v und f′(u) = 0.") },
    ],
    tipps: ["Punktsymmetrisch zum Ursprung: nur ungerade Exponenten — darum f(x) = ax³ + cx.", `I: ${num(u ** 3)}a + ${num(u)}c = ${num(v)}; &nbsp;II: ${num(3 * u * u)}a + c = 0`],
    musterloesungHtml: `I: f(${num(u)}) = ${num(v)} ⟹ ${num(u ** 3)}a + ${num(u)}c = ${num(v)}<br>II: f′(${num(u)}) = 0 ⟹ ${num(3 * u * u)}a + c = 0 ⟹ c = −${num(3 * u * u)}a<br>` +
      `II in I: ${num(u ** 3)}a − ${num(3 * u ** 3)}a = ${num(v)} ⟹ <strong>a = ${num(a)}</strong>, <strong>c = ${num(c)}</strong><br>` +
      `<strong>Probe:</strong> f″(${num(u)}) = 6 · ${numK(a)} · ${num(u)} = ${num(6 * a * u)} ${v > 0 ? "&lt; 0 — Hochpunkt" : "&gt; 0 — Tiefpunkt"} ✓`,
  };
}

// ---------- S3: Schachtel aus einem Karton ----------
// Karton a × b; die Maße sind so gewählt, dass a² − ab + b² eine Quadratzahl ist und das Optimum
// abbricht (bei a = b ist x = a/6).
const S3_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const s of [6, 9, 12, 15, 18, 21, 24, 27, 30, 36]) out.push([s, s]);
  for (const [a, b] of [[5, 8], [10, 16], [15, 24], [20, 32], [25, 40], [30, 48], [7, 15], [14, 30], [21, 45], [28, 60], [16, 21], [32, 42], [13, 48]]) out.push([a, b]);
  return out.map(([a, b]) => {
    const w = Math.sqrt(a * a - a * b + b * b);
    const x = (a + b - w) / 6, x2 = (a + b + w) / 6;
    return { a, b, x, x2, V: x * (a - 2 * x) * (b - 2 * x), ohne2: x * (a - x) * (b - x) };
  });
});
function generateS3() {
  const k = ohneFeldKollision(S3_KANDIDATEN(), (v) => [[v.x, v.x2], [v.V, v.ohne2]], EPS);
  const { a, b, x, x2, V } = k;
  const quadrat = a === b;
  const V3 = 4, V2 = -2 * (a + b), V1 = a * b;
  return {
    promptHtml: `Aus einem rechteckigen Karton mit ${num(a)} cm × ${num(b)} cm wird eine oben offene Schachtel: An den vier Ecken werden Quadrate mit der Seitenlänge x herausgeschnitten, dann werden die Ränder hochgeklappt.<br><strong>Für welches x wird das Volumen am größten, und wie groß ist es?</strong>` + ZAHL,
    felder: [
      { name: "x = (in cm)", soll: x, toleranz: TOL, hinweis: (r, v) => (nahe(v, x2, TOL) ? `Das ist die zweite Nullstelle von V′. Sie liegt außerhalb des Definitionsbereichs 0 &lt; x &lt; ${num(Math.min(a, b) / 2)} — dort bliebe kein Boden.` : "Zielfunktion V(x) = x · (a − 2x) · (b − 2x), dann V′(x) = 0.") },
      { name: "V = (in cm³)", soll: V, toleranz: TOL, hinweis: (r, v) => (nahe(v, k.ohne2, TOL) ? "Der Boden ist an jeder Seite um 2x kürzer, nicht um x — es wird an beiden Enden ausgeschnitten." : "Setze das optimale x in V ein.") },
    ],
    tipps: [`V(x) = x · (${num(a)} − 2x) · (${num(b)} − 2x) = ${poly([[V3, "x³"], [V2, "x²"], [V1, "x"]])}`, `V′(x) = ${poly([[3 * V3, "x²"], [2 * V2, "x"], [V1, ""]])}`],
    musterloesungHtml: `Zielfunktion V(x) = x · (${num(a)} − 2x) · (${num(b)} − 2x) = ${poly([[V3, "x³"], [V2, "x²"], [V1, "x"]])}, 0 &lt; x &lt; ${num(Math.min(a, b) / 2)}<br>` +
      `V′(x) = ${poly([[3 * V3, "x²"], [2 * V2, "x"], [V1, ""]])} = 0 ⟺ x = ${num(x)} oder x = ${num(x2)}${quadrat ? "" : ""} (außerhalb)<br>` +
      `V″(${num(x)}) = ${num(6 * V3 * x + 2 * V2)} &lt; 0 ⟹ Maximum. <strong>x = ${num(x)} cm</strong>, <strong>V = ${num(V)} cm³</strong>`,
  };
}

// ---------- S4: Rechteck unter einer Parabel ----------
const S4_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const q of [1, 0.5, 2, 0.25]) for (const u of [1, 1.5, 2, 3]) {
    const h = 3 * q * u * u;
    if (glatt(h, 4)) out.push({ q, u, h, A: 4 * q * u ** 3, null: Math.sqrt(h / q) });
  }
  return out;
});
function generateS4() {
  const k = ohneFeldKollision(S4_KANDIDATEN(), (v) => [[v.u, v.null], [v.A, v.A / 2]], EPS);
  const { q, u, h, A } = k;
  return {
    promptHtml: `Unter dem Graphen von f(x) = ${num(h)} − ${q === 1 ? "" : num(q)}x² liegt ein Rechteck mit zwei Ecken auf der x-Achse und zwei Ecken auf dem Graphen, symmetrisch zur y-Achse.<br><strong>Für welche halbe Breite u wird der Flächeninhalt am größten, und wie groß ist er?</strong>` + ZAHL,
    felder: [
      { name: "u =", soll: u, toleranz: TOL, hinweis: (r, v) => (nahe(v, k.null, TOL) ? "Das ist die Nullstelle der Parabel — dort hat das Rechteck die Höhe 0." : "A(u) = 2u · f(u), dann A′(u) = 0.") },
      { name: "A =", soll: A, toleranz: TOL, hinweis: (r, v) => (nahe(v, A / 2, TOL) ? "Das ist nur die halbe Fläche: Die Breite ist 2u, nicht u." : "Setze u in A(u) = 2u · f(u) ein.") },
    ],
    tipps: [`A(u) = 2u · (${num(h)} − ${q === 1 ? "" : num(q)}u²) = ${poly([[2 * h, "u"], [-2 * q, "u³"]])}`, `A′(u) = ${poly([[2 * h, ""], [-6 * q, "u²"]])}`],
    musterloesungHtml: `A(u) = 2u · f(u) = ${poly([[2 * h, "u"], [-2 * q, "u³"]])}, 0 &lt; u &lt; ${num(k.null)}<br>` +
      `A′(u) = ${poly([[2 * h, ""], [-6 * q, "u²"]])} = 0 ⟺ u² = ${num(u * u)} ⟺ <strong>u = ${num(u)}</strong> (u &gt; 0); A″(u) = ${num(-12 * q * u)} &lt; 0<br>` +
      `<strong>A = ${num(A)}</strong> (Breite ${num(2 * u)}, Höhe ${num(h - q * u * u)})`,
  };
}

// ---------- S5: Zeitpunkt des stärksten Wachstums ----------
const S5_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const a of [0.5, 1, 0.25, 2]) for (const b of [3, 6, 1.5, 4.5, 9]) {
    const tw = b / (3 * a), rate = (b * b) / (3 * a);
    if (glatt(tw, 4) && glatt(rate, 4)) out.push({ a, b, tw, rate, th: (2 * b) / (3 * a), hw: -a * tw ** 3 + b * tw * tw });
  }
  return out;
});
function generateS5() {
  const k = ohneFeldKollision(S5_KANDIDATEN(), (v) => [[v.tw, v.th], [v.rate, v.hw]], EPS);
  const { a, b, tw, rate, th } = k;
  return {
    promptHtml: `Die Höhe einer Pflanze wird für 0 ≤ t ≤ ${num(th)} durch h(t) = ${poly([[-a, "t³"], [b, "t²"]])} beschrieben (t in Wochen, h in cm).<br><strong>Zu welchem Zeitpunkt wächst die Pflanze am schnellsten, und wie groß ist die Wachstumsrate dann?</strong>` + ZAHL,
    felder: [
      { name: "t = (in Wochen)", soll: tw, toleranz: TOL, hinweis: (r, v) => (nahe(v, th, TOL) ? "Da ist die Pflanze am höchsten — dort wächst sie gar nicht mehr (h′ = 0). Gesucht ist das Maximum von h′." : "Die Wachstumsrate ist h′; ihr Maximum liegt bei h″(t) = 0.") },
      { name: "h′(t) = (in cm pro Woche)", soll: rate, toleranz: TOL, hinweis: (r, v) => (nahe(v, k.hw, TOL) ? "Das ist die Höhe h(t) zu diesem Zeitpunkt. Gefragt ist die Wachstumsrate h′(t)." : "Setze den Zeitpunkt in h′ ein.") },
    ],
    tipps: [`h′(t) = ${poly([[-3 * a, "t²"], [2 * b, "t"]])}, h″(t) = ${poly([[-6 * a, "t"], [2 * b, ""]])}`, "Am schnellsten wächst die Pflanze an der Wendestelle von h."],
    musterloesungHtml: `h′(t) = ${poly([[-3 * a, "t²"], [2 * b, "t"]])}; h″(t) = ${poly([[-6 * a, "t"], [2 * b, ""]])} = 0 ⟺ <strong>t = ${num(tw)}</strong>; h‴(t) = ${num(-6 * a)} &lt; 0 — Maximum von h′.<br>` +
      `h′(${num(tw)}) = <strong>${num(rate)} cm pro Woche</strong>. Zum Vergleich: Bei t = ${num(th)} ist h′ = 0 — dort ist die Pflanze am höchsten.`,
  };
}

// ================= komplex =================

// ---------- K1: kubische Funktion aus Extrem- und Wendepunkt ----------
// f(x) = ax³ + bx² + cx + d mit Extrempunkt E(0 | h) und Wendepunkt W(w | y_W):
// f(0) = h ⟹ d = h; f′(0) = 0 ⟹ c = 0; f″(w) = 0 ⟹ b = −3aw; f(w) = y_W ⟹ y_W = h − 2aw³.
const K1_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const a of [1, -1, 0.5, -0.5, 2, 0.25]) for (const w of [-2, -1, 1, 2]) for (const h of [-2, 0, 1, 3]) {
    out.push({ a, w, h, b: -3 * a * w, c: 0, d: h, yw: h - 2 * a * w ** 3 });
  }
  return out;
});
function generateK1() {
  const k = ohneFeldKollision(K1_KANDIDATEN(), (v) => [[v.a, -v.a], [v.b, -v.b], [v.c], [v.d]], EPS);
  const { a, w, h, b, c, d, yw } = k;
  // f″(0) = 2b = −6aw: negativ ⟹ Hochpunkt, positiv ⟹ Tiefpunkt.
  const art = 2 * b < 0 ? "Hochpunkt" : "Tiefpunkt";
  return {
    promptHtml: `Der Graph einer ganzrationalen Funktion dritten Grades hat den ${art} E(0 | ${num(h)}) und den Wendepunkt W(${num(w)} | ${num(yw)}).<br><strong>Bestimme f(x) = ax³ + bx² + cx + d.</strong>` + ZAHL,
    felder: [
      { name: "a =", soll: a, toleranz: TOL, hinweis: (r, v) => (nahe(v, -a, TOL) ? "Vorzeichen: Aus f(w) = y_W folgt −2aw³ = y_W − d." : "Setze b = −3aw in f(w) = y_W ein.") },
      { name: "b =", soll: b, toleranz: TOL, hinweis: (r, v) => (nahe(v, -b, TOL) ? "Vorzeichen: f″(w) = 6aw + 2b = 0 ⟹ b = −3aw." : "Die Wendebedingung f″(w) = 0 verbindet a und b.") },
      { name: "c =", soll: c, toleranz: TOL, hinweis: () => "Die waagerechte Tangente im Extrempunkt bei x = 0: f′(0) = c = 0." },
      { name: "d =", soll: d, toleranz: TOL, hinweis: () => "Der Extrempunkt liegt auf der y-Achse: f(0) = d." },
    ],
    tipps: ["Vier Bedingungen: f(0), f′(0), f″(w) und f(w).", `d = ${num(h)}, c = 0, b = −3a · ${numK(w)}`],
    musterloesungHtml: `f(0) = ${num(h)} ⟹ d = ${num(h)}; &nbsp;f′(0) = 0 ⟹ c = 0<br>` +
      `f″(${num(w)}) = 0: 6a · ${numK(w)} + 2b = 0 ⟹ b = ${num(-3 * w)}a<br>` +
      `f(${num(w)}) = ${num(yw)}: a · ${numK(w)}³ ${plusMinus(-3 * w)}a · ${numK(w)}² ${plusMinus(h)} = ${num(yw)} ⟹ ${num(-2 * w ** 3)}a = ${num(yw - h)} ⟹ <strong>a = ${num(a)}</strong>, <strong>b = ${num(b)}</strong>, <strong>c = 0</strong>, <strong>d = ${num(d)}</strong><br>` +
      `f(x) = ${poly([[a, "x³"], [b, "x²"], [d, ""]])}. <strong>Probe:</strong> f″(0) = ${num(2 * b)} ${2 * b < 0 ? "&lt; 0 — Hochpunkt" : "&gt; 0 — Tiefpunkt"} ✓, f‴(${num(w)}) = ${num(6 * a)} ≠ 0 ✓`,
  };
}

// ---------- K2: Wendepunkte und Wendetangente einer biquadratischen Funktion ----------
// f(x) = c(x⁴ − 6w²x²): f″(x) = 12c(x² − w²) ⟹ W(±w | −5cw⁴), Wendetangente in W(w | …) mit m = −8cw³.
const K2_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const c of [0.25, 0.5, 1, -0.5, -1, 0.125, -0.25, 2, -0.125, 0.75]) for (const w of [1, 2, 0.5, 1.5, 3]) {
    const yw = -5 * c * w ** 4, m = -8 * c * w ** 3;
    if (glatt(yw, 4) && glatt(m, 4) && glatt(6 * c * w * w, 4)) out.push({ c, w, yw, m });
  }
  return out;
});
function generateK2() {
  const k = ohneFeldKollision(K2_KANDIDATEN(), (v) => [[v.w, v.w * v.w], [v.yw, -v.yw], [v.m, -v.m]], EPS);
  const { c, w, yw, m } = k;
  return {
    promptHtml: `Gegeben ist f(x) = ${poly([[c, "x⁴"], [-6 * c * w * w, "x²"]])}.<br><strong>Bestimme den Wendepunkt mit positiver x-Koordinate und die Steigung der Wendetangente dort.</strong>` + ZAHL,
    felder: [
      { name: "x<sub>W</sub> =", soll: w, toleranz: TOL, hinweis: (r, v) => (nahe(v, w * w, TOL) ? "Das ist x² — es fehlt noch die Wurzel." : "f″(x) = 0 lösen; nur die positive Lösung.") },
      { name: "y<sub>W</sub> =", soll: yw, toleranz: TOL, hinweis: (r, v) => (nahe(v, -yw, TOL) ? "Vorzeichen beim Einsetzen prüfen: f(x<sub>W</sub>) = c · x<sub>W</sub>⁴ − 6cw² · x<sub>W</sub>²." : "y<sub>W</sub> = f(x<sub>W</sub>).") },
      { name: "m =", soll: m, toleranz: TOL, hinweis: (r, v) => (nahe(v, -m, TOL) ? "Vorzeichen: f′(x) = 4cx³ − 12cw²x." : "Die Steigung der Wendetangente ist f′(x<sub>W</sub>).") },
    ],
    tipps: [`f′(x) = ${poly([[4 * c, "x³"], [-12 * c * w * w, "x"]])}, f″(x) = ${poly([[12 * c, "x²"], [-12 * c * w * w, ""]])}`, "Achsensymmetrisch: Der zweite Wendepunkt liegt gespiegelt bei −x<sub>W</sub>."],
    musterloesungHtml: `f″(x) = ${poly([[12 * c, "x²"], [-12 * c * w * w, ""]])} = 0 ⟺ x² = ${num(w * w)} ⟺ x = ±${num(w)}; f‴(x) = ${poly([[24 * c, "x"]])}, f‴(${num(w)}) = ${num(24 * c * w)} ≠ 0<br>` +
      `<strong>x<sub>W</sub> = ${num(w)}</strong>, <strong>y<sub>W</sub> = f(${num(w)}) = ${num(yw)}</strong><br>` +
      `<strong>m = f′(${num(w)}) = ${num(m)}</strong>; Wendetangente t(x) = ${poly([[m, "x"], [yw - m * w, ""]])}`,
  };
}

// ---------- K3: Gewinnmaximum bei begrenzter Kapazität ----------
// G(x) = −ax³ + bx² − e hat im Inneren sein Maximum bei x_H = 2b/(3a); ist die Kapazität K kleiner,
// liegt das Maximum am Rand K.
const K3_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const a of [0.5, 1, 2]) for (const b of [3, 6, 9]) for (const e of [2, 5, 10]) for (const K of [2, 3, 4, 6, 8, 10]) {
    const xh = (2 * b) / (3 * a);
    if (!glatt(xh, 4) || Math.abs(K - xh) < 1e-9) continue;
    const G = (x) => -a * x ** 3 + b * x * x - e;
    const xo = Math.min(K, xh);
    out.push({ a, b, e, K, xh, xo, Gmax: G(xo), Ginnen: G(xh), Grand: G(K) });
  }
  return out;
});
function generateK3() {
  // Fehler: das innere Maximum, obwohl es jenseits der Kapazität liegt — bzw. den Rand, obwohl das
  // innere Maximum erreichbar ist.
  const k = ohneFeldKollision(K3_KANDIDATEN(), (v) => {
    const xFalsch = v.K < v.xh ? v.xh : v.K, gFalsch = v.K < v.xh ? v.Ginnen : v.Grand;
    return [[v.xo, xFalsch], [v.Gmax, gFalsch, v.Gmax + v.e]];
  }, EPS);
  const { a, b, e, K, xh, xo, Gmax, Ginnen, Grand } = k;
  const rand = K < xh;
  return {
    promptHtml: `Ein Betrieb kann täglich höchstens ${num(K)} Tonnen eines Produkts herstellen. Der Gewinn bei x Tonnen ist G(x) = ${poly([[-a, "x³"], [b, "x²"], [-e, ""]])} (in Tausend Euro), 0 ≤ x ≤ ${num(K)}.<br><strong>Bei welcher Menge ist der Gewinn am größten, und wie groß ist er?</strong>` + ZAHL,
    felder: [
      { name: "x = (in Tonnen)", soll: xo, toleranz: TOL, hinweis: (r, v) => (rand && nahe(v, xh, TOL) ? `Das ist das lokale Maximum von G — aber ${num(xh)} Tonnen kann der Betrieb gar nicht herstellen. Vergleiche mit dem Rand.` : !rand && nahe(v, K, TOL) ? "Am Rand ist der Gewinn kleiner als im Hochpunkt — mehr zu produzieren lohnt sich hier nicht." : "Kandidaten: Stellen mit G′(x) = 0 im Intervall und die Ränder 0 und K.") },
      { name: "G = (in Tausend Euro)", soll: Gmax, toleranz: TOL, hinweis: (r, v) => (nahe(v, Gmax + e, TOL) ? "Die Fixkosten fehlen: Vom Ertrag wird noch " + num(e) + " abgezogen." : rand && nahe(v, Ginnen, TOL) ? "Das wäre der Gewinn im Hochpunkt, der außerhalb der Kapazität liegt." : !rand && nahe(v, Grand, TOL) ? "Das ist der Gewinn am Rand — im Hochpunkt ist er größer." : "Setze die optimale Menge in G ein.") },
    ],
    tipps: [`G′(x) = ${poly([[-3 * a, "x²"], [2 * b, "x"]])} = 0 ⟺ x = 0 oder x = ${num(xh)}`, `Vergleiche G(0) = ${num(-e)}, G(${num(K)}) und gegebenenfalls G(${num(xh)}).`],
    musterloesungHtml: `G′(x) = ${poly([[-3 * a, "x²"], [2 * b, "x"]])} = x · (${poly([[-3 * a, "x"], [2 * b, ""]])}) = 0 ⟺ x = 0 oder x = ${num(xh)}; G″(${num(xh)}) = ${num(-6 * a * xh + 2 * b)} &lt; 0<br>` +
      (rand
        ? `${num(xh)} &gt; ${num(K)}: Der Hochpunkt liegt außerhalb. G steigt auf [0; ${num(K)}], das Maximum liegt am Rand: <strong>x = ${num(K)}</strong>, <strong>G(${num(K)}) = ${num(Gmax)}</strong>`
        : `${num(xh)} liegt in [0; ${num(K)}]. Vergleich: G(0) = ${num(-e)}, G(${num(K)}) = ${num(Grand)}, G(${num(xh)}) = ${num(Ginnen)} — <strong>x = ${num(xh)}</strong>, <strong>G = ${num(Gmax)}</strong>`),
  };
}

// ---------- K4: zwei Schritte des Newton-Verfahrens ----------
const K4_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const p of [-2, -3, 1, 2, -1]) for (const q of [-5, -3, -1, 1, 4]) for (const x0 of [-2, -1, 1, 2, 3]) {
    const f = (x) => x ** 3 + p * x + q, d = (x) => 3 * x * x + p;
    if (Math.abs(d(x0)) < 0.5) continue;
    const x1 = x0 - f(x0) / d(x0);
    if (Math.abs(d(x1)) < 0.5 || Math.abs(x1) > 50) continue;
    const x2 = x1 - f(x1) / d(x1);
    out.push({ p, q, x0, x1, x2, x1f: x0 + f(x0) / d(x0), x2f: x1 + f(x1) / d(x1) });
  }
  return out;
});
function generateK4() {
  const k = ohneFeldKollision(K4_KANDIDATEN(), (v) => [[v.x1, v.x1f], [v.x2, v.x2f, v.x1]], 0.001);
  const { p, q, x0, x1, x2 } = k;
  const f = (x) => x ** 3 + p * x + q, d = (x) => 3 * x * x + p;
  return {
    promptHtml: `Gesucht ist eine Nullstelle von f(x) = ${poly([[1, "x³"], [p, "x"], [q, ""]])}.<br><strong>Berechne mit dem Newton-Verfahren x₁ und x₂ zum Startwert x₀ = ${num(x0)}.</strong>` + RUND4,
    felder: [
      { name: "x₁ =", soll: x1, toleranz: TOL, hinweis: (r, v) => (nahe(v, k.x1f, TOL) ? "Vorzeichen: x₁ = x₀ − f(x₀)/f′(x₀)." : "x₁ = x₀ − f(x₀)/f′(x₀).") },
      { name: "x₂ =", soll: x2, toleranz: TOL, hinweis: (r, v) => (nahe(v, k.x2f, TOL) ? "Vorzeichen: x₂ = x₁ − f(x₁)/f′(x₁)." : nahe(v, x1, TOL) ? "Das ist x₁ — es fehlt noch ein Schritt." : "Rechne mit x₁ genauso weiter wie mit x₀ — mit dem ungerundeten Wert.") },
    ],
    tipps: [`f′(x) = ${poly([[3, "x²"], [p, ""]])}`, `f(${num(x0)}) = ${num(f(x0))}, f′(${num(x0)}) = ${num(d(x0))}`],
    musterloesungHtml: `x₁ = ${num(x0)} − ${bruch(num(f(x0)), num(d(x0)))} ≈ <strong>${num(x1)}</strong><br>` +
      `x₂ = x₁ − ${bruch("f(x₁)", "f′(x₁)")} ≈ ${num(x1, 6)} − ${bruch(num(f(x1), 6), num(d(x1), 6))} ≈ <strong>${num(x2)}</strong><br>` +
      `Probe: f(x₂) ≈ ${num(f(x2), 6)} — deutlich näher an 0 als f(x₀) = ${num(f(x0))}.`,
  };
}

// ---------- K5: Ortskurve der Wendepunkte ----------
// f_a(x) = kx³ − 3ax²: f″(x) = 6kx − 6a ⟹ W(a/k | −2a³/k²); mit a = kx: Ortskurve y = −2k · x³.
const K5_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const k of [1, 2, 0.5, -1, -2]) for (const a of [1, 2, -1, 0.5, 1.5, -2]) {
    const xw = a / k, yw = (-2 * a ** 3) / (k * k), c = -2 * k;
    if (glatt(xw, 4) && glatt(yw, 4)) out.push({ k, a, xw, yw, c });
  }
  return out;
});
function generateK5() {
  // Bei k = ±1 fällt „a · k statt a/k“ mit der Lösung bzw. „Faktor k vergessen“ mit dem Vorzeichenfehler
  // zusammen — dort NaN, statt die Fälle k = ±1 aus dem Vorrat zu verlieren.
  const kk = ohneFeldKollision(K5_KANDIDATEN(), (v) => [[v.xw, Math.abs(v.k) === 1 ? NaN : v.a * v.k], [v.yw, -v.yw], [v.c, Math.abs(v.k) === 1 ? NaN : -2, -v.c]], EPS);
  const { k, a, xw, yw, c } = kk;
  return {
    promptHtml: `Gegeben ist die Funktionenschar f<sub>a</sub>(x) = ${poly([[k, "x³"]])} − 3a · x² (a ≠ 0).<br><strong>Bestimme für a = ${num(a)} den Wendepunkt W(x<sub>W</sub> | y<sub>W</sub>) und die Ortskurve aller Wendepunkte in der Form y = c · x³.</strong>` + ZAHL,
    felder: [
      { name: "x<sub>W</sub> =", soll: xw, toleranz: TOL, hinweis: (r, v) => (Math.abs(k) !== 1 && nahe(v, a * k, TOL) ? `Aus f″(x) = ${num(6 * k)}x − 6a = 0 folgt x = a : ${numK(k)}, nicht a · ${numK(k)}.` : "f″(x) = 0 nach x auflösen, dann a einsetzen.") },
      { name: "y<sub>W</sub> =", soll: yw, toleranz: TOL, hinweis: (r, v) => (nahe(v, -yw, TOL) ? "Vorzeichen: Beim Einsetzen ist −3a · x<sub>W</sub>² der größere Summand." : "y<sub>W</sub> = f<sub>a</sub>(x<sub>W</sub>).") },
      { name: "c =", soll: c, toleranz: TOL, hinweis: (r, v) => (Math.abs(k) !== 1 && nahe(v, -2, TOL) ? `Der Faktor k = ${num(k)} fehlt: Aus x = a/k folgt a = ${num(k)}x, und das steckt in a³.` : nahe(v, -c, TOL) ? "Vorzeichen: y = −2a³/k² mit a = kx." : "x<sub>W</sub> = a/k nach a auflösen und in y<sub>W</sub> einsetzen.") },
    ],
    tipps: [`f<sub>a</sub>″(x) = ${num(6 * k)}x − 6a ⟹ x<sub>W</sub> = a/${numK(k)}`, `y<sub>W</sub> = f<sub>a</sub>(a/k) = −2a³/k²`],
    musterloesungHtml: `f<sub>a</sub>″(x) = ${num(6 * k)}x − 6a = 0 ⟺ x = a/${numK(k)}; f<sub>a</sub>‴ = ${num(6 * k)} ≠ 0<br>` +
      `f<sub>a</sub>(a/k) = k · a³/k³ − 3a · a²/k² = −2a³/k² ⟹ für a = ${num(a)}: <strong>W(${num(xw)} | ${num(yw)})</strong><br>` +
      `Ortskurve: x = a/k ⟹ a = ${num(k)}x; y = −2(${num(k)}x)³/${num(k * k)} = ${num(c)}x³, also <strong>c = ${num(c)}</strong>. Probe: ${num(c)} · ${numK(xw)}³ = ${num(c * xw ** 3)} = y<sub>W</sub> ✓`,
  };
}

// ================= f′ und f″ bestimmen (Termeingabe, je Stufe eine) =================
// Die Funktionen setzen sich aus Gliedern zusammen, die ihre Ableitungen exakt kennen
// (mathematik/terme.js) — so gibt es beliebig viele, und die Musterlösung entsteht aus denselben
// Gliedern wie die Angabe. Geprüft werden beide Felder numerisch, mit Fehlerdiagnose.

// Ganzzahlige Bereiche und Koeffizienten zum Würfeln. Gewürfelt wird konstruktiv: jede Wahl kommt
// aus einer festen Liste, es gibt nichts zu verwerfen.
const bereich = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const KOEFF = [-6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6];
const KLEIN = [-3, -2, -1, 1, 2, 3];
// Ein Polynom mit höchstem Exponenten aus [gMin; gMax] und insgesamt `anzahl` Summanden.
function zufallsPolynom(gMin, gMax, anzahl, leit = KOEFF) {
  const grad = zufall(bereich(gMin, gMax));
  const rest = mische(bereich(0, grad - 1)).slice(0, anzahl - 1).sort((a, b) => b - a);
  return [pot(zufall(leit), grad), ...rest.map((e) => pot(zufall(KOEFF), e))];
}

// einfach: ganzrational, Grad 3 oder 4.
function generateE6() {
  return ableitungsAufgabe(zufallsPolynom(3, 4, zufall([2, 3]), [...KOEFF, q(1, 2), q(-1, 2)]), { zweite: true });
}
// mittel: Potenz, negative Hochzahl, Wurzel.
function generateM6() {
  return ableitungsAufgabe(mische([
    pot(zufall(KOEFF), zufall([2, 3, 4])),
    pot(zufall(KLEIN), zufall([-1, -2])),
    pot(zufall(KLEIN), zufall([q(1, 2), q(3, 2)])),
  ]), { zweite: true });
}
// schwierig: Produkt zweier Polynome — f′ mit der Produktregel, f″ am einfachsten nach dem Ausmultiplizieren.
function generateS6() {
  const faktor = () => { const g = zufall([1, 2]); return [pot(zufall(KLEIN), g), pot(zufall(KOEFF), zufall(bereich(0, g - 1)))]; };
  return ableitungsAufgabe([produkt(faktor(), faktor())], { zweite: true });
}
// komplex: Funktionenschar — der Parameter a ist beim Ableiten eine feste Zahl, als Faktor vor x², x
// und x⁴ ebenso wie im Absolutglied a³. Unter drei von fünf Gliedern ist immer eines mit x² oder
// höher, f″ ist also nie 0.
function generateK6() {
  const schar = { zweite: true, name: "fₐ", parameter: ["a"], zusatz: " (a &gt; 0)" };
  return ableitungsAufgabe(mische([pot(zufall([1, -1, 2]), 3), pot(zufall(KLEIN), 2, 1), pot(zufall(KLEIN), 1, 2), pot(zufall([1, 2, -1]), 0, 3), pot(zufall([1, -1]), 4, 1)]).slice(0, 3), schar);
}

export const AUFGABEN = [
  { schwierigkeit: "einfach", titel: "Zweite Ableitung an einer Stelle", generate: generateE1 },
  { schwierigkeit: "einfach", titel: "Wendestelle", generate: generateE2 },
  { schwierigkeit: "einfach", titel: "Hochstelle mit f″", generate: generateE3 },
  { schwierigkeit: "einfach", titel: "Ein Newton-Schritt", generate: generateE4 },
  { schwierigkeit: "einfach", titel: "Globales Maximum", generate: generateE5 },
  { schwierigkeit: "einfach", titel: "f′ und f″: ganzrational", generate: generateE6, wuerfelText: "🎲 Neue Funktion" },
  { schwierigkeit: "mittel", titel: "Wendepunkt", generate: generateM1 },
  { schwierigkeit: "mittel", titel: "Hoch- und Tiefpunkt", generate: generateM2 },
  { schwierigkeit: "mittel", titel: "Wendetangente", generate: generateM3 },
  { schwierigkeit: "mittel", titel: "Sattelpunkt durch einen Parameter", generate: generateM4 },
  { schwierigkeit: "mittel", titel: "Krümmungsintervall", generate: generateM5 },
  { schwierigkeit: "mittel", titel: "f′ und f″: Potenzen und Wurzeln", generate: generateM6, wuerfelText: "🎲 Neue Funktion" },
  { schwierigkeit: "schwierig", titel: "Scharparameter bestimmen", generate: generateS1 },
  { schwierigkeit: "schwierig", titel: "Punktsymmetrische Funktion aus einem Extrempunkt", generate: generateS2 },
  { schwierigkeit: "schwierig", titel: "Die größte Schachtel", generate: generateS3 },
  { schwierigkeit: "schwierig", titel: "Rechteck unter einer Parabel", generate: generateS4 },
  { schwierigkeit: "schwierig", titel: "Stärkstes Wachstum", generate: generateS5 },
  { schwierigkeit: "schwierig", titel: "f′ und f″: Produkte", generate: generateS6, wuerfelText: "🎲 Neue Funktion" },
  { schwierigkeit: "komplex", titel: "Kubische Funktion aus Extrem- und Wendepunkt", generate: generateK1 },
  { schwierigkeit: "komplex", titel: "Biquadratische Funktion und Wendetangente", generate: generateK2 },
  { schwierigkeit: "komplex", titel: "Gewinnmaximum bei begrenzter Kapazität", generate: generateK3 },
  { schwierigkeit: "komplex", titel: "Zwei Newton-Schritte", generate: generateK4 },
  { schwierigkeit: "komplex", titel: "Ortskurve der Wendepunkte", generate: generateK5 },
  { schwierigkeit: "komplex", titel: "f′ und f″: Funktionenschar", generate: generateK6, wuerfelText: "🎲 Neue Funktion" },
];
