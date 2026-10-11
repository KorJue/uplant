// Die vierundzwanzig Übungsaufgaben zu „Integralrechnung“ (Thema 4.1, Grundkurs) — sechs je Stufe.
//
//   einfach   — Potenzregel, Polynomintegral, Rekonstruktion aus einer Rate, Mittelwert, Schnittstellen
//               Parabel/Gerade.
//   mittel    — Fläche mit Vorzeichenwechsel, Fläche zwischen Parabel und Gerade, Stammfunktion durch
//               einen Punkt, obere Grenze aus dem Integralwert, drei Schnittstellen (x ausklammern).
//   schwierig — Fläche zwischen zwei Parabeln, Parameter aus der Fläche, Bestand bei linear fallender
//               Zuflussrate, Schnittstellen und Fläche zweier Parabeln, Fläche zwischen Parabel und Tangente.
//   komplex   — Tangente an eine kubische Funktion, Maximum einer Integralfunktion, Ursprungsgerade
//               halbiert eine Fläche, Bilanz null (wann ist der Anfangsbestand wieder erreicht?), kubische
//               Funktion und Parabel (raten, Polynomdivision).
//
// Die sechste Aufgabe jeder Stufe ist ein Integrationstraining mit beliebig vielen Funktionen
// (mathematik/terme.js): ganzrational, Potenzen und Wurzeln, Produkte zweier Polynome und Klammern mit
// Hochzahl — beides wird ausmultipliziert. Sinus, Kosinus, e-Funktion, 1/x und lineare Verkettung
// gehören zum Leistungskurs und stehen in Thema 4.2. Die eingegebene Stammfunktion wird durch
// numerisches Ableiten geprüft — jede Konstante ist richtig.
//
// Gewürfelt wird konstruktiv: Die Kandidatenlisten werden vorher gesiebt, ohneKollision() wählt aus
// dem Rest. Jeder Fehlerwert ist von der Lösung und von den anderen Fehlerwerten verschieden — wo ein
// Fehler mit der Lösung zusammenfiele, steht NaN.

"use strict";

import { pot, verkettung, produkt, q, stammAufgabe, pick as zufall, mische } from "../../../terme.js?v=4";

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
// Ein Faktor vor einer Klammer: „2 · “, „−“ oder nichts — nie „1 ·“ oder „−1 ·“.
function faktorVor(a) {
  return a === 1 ? "" : a === -1 ? "−" : `${num(a)} · `;
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
function hochZahl(n) {
  return String(n).split("").map((c) => ({ "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" })[c] || c).join("");
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


// Integralzeichen mit Grenzen, wie auf der Seite. Die Grenzen stehen übereinander; die Prüfung liest
// sie deshalb aus den Elementen (.o/.u), nicht aus dem Fließtext.
const intZ = (a, b) => `<span class="integral"><span class="zeichen">∫</span><span class="grenzen"><span class="o">${b}</span><span class="u">${a}</span></span></span>`;
const klammer = (inhalt, a, b) => `<span class="integral">[${inhalt}]<span class="grenzen"><span class="o">${b}</span><span class="u">${a}</span></span></span>`;
const RUND4 = `<br><span class="progress-note">Runde auf vier Nachkommastellen.</span>`;
// Potenz als Text: x, x², x³ …
const xh = (n, v = "x") => (n === 1 ? v : v + hochZahl(n));
// Stammfunktion eines quadratischen Polynoms p·x² + q·x + r (alle Werte so gewählt, dass sie abbrechen).
const stamm2 = (p, q, r) => (x) => (p / 3) * x ** 3 + (q / 2) * x * x + r * x;

// ================= einfach =================

// ---------- E1: Potenzregel ----------
const E1_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const n of [1, 2, 3]) for (const c of [1, 2, 3, 4, 5, 6, 0.5, 1.5]) for (const b of [1, 2, 3, 4]) {
    const I = (c * b ** (n + 1)) / (n + 1);
    if (glatt(I, 4)) out.push({ n, c, b, I });
  }
  return out;
});
function e1Werte(v) {
  const { n, c, b } = v;
  // Bei n = 1 ist „durch n“ dasselbe wie „gar nicht geteilt“ — dort NaN.
  return { ohne: c * b ** (n + 1), abl: c * n * b ** (n - 1), durchN: n === 1 ? NaN : (c * b ** (n + 1)) / n };
}
function generateE1() {
  const k = ohneKollision(E1_KANDIDATEN(), (v) => { const w = e1Werte(v); return [v.I, w.ohne, w.abl, w.durchN]; }, EPS);
  const { n, c, b, I } = k;
  const w = e1Werte(k);
  const stamm = `${bruch(num(c), n + 1)} ${xh(n + 1)}`;
  return {
    promptHtml: `<strong>Berechne ${intZ("0", num(b))} ${glied(c, xh(n), false)} dx.</strong>` + ZAHL,
    correct: I,
    tolerance: TOL,
    placeholder: "Integral",
    hinweis: (roh, v) => {
      if (nahe(v, w.ohne, TOL)) return `Beim Aufleiten fehlt das Teilen: Eine Stammfunktion von x${hochZahl(n)} ist ${bruch("1", n + 1)} x${hochZahl(n + 1)} — der Exponent steigt um 1, und durch den neuen Exponenten wird geteilt.`;
      if (nahe(v, w.abl, TOL)) return "Das ist die Ableitung an der Stelle b. Fürs Integral brauchst du eine Stammfunktion — die Ableitungsregel rückwärts.";
      if (nahe(v, w.durchN, TOL)) return `Geteilt wird durch den <em>neuen</em> Exponenten ${n + 1}, nicht durch den alten ${n}.`;
      return `Stammfunktion: F(x) = ${stamm}. Dann F(${num(b)}) − F(0).`;
    },
    tipps: [`Potenzregel rückwärts: x${hochZahl(n)} hat die Stammfunktion ${bruch("1", n + 1)} x${hochZahl(n + 1)}.`, `F(x) = ${stamm}; F(0) = 0`],
    musterloesungHtml: `${intZ("0", num(b))} ${glied(c, xh(n), false)} dx = ${klammer(stamm, "0", num(b))} = ${bruch(num(c), n + 1)} · ${num(b)}${hochZahl(n + 1)} − 0 = <strong>${num(I)}</strong>`,
  };
}

// ---------- E2: Polynomintegral über [a; b] ----------
const E2_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const p of [3, -3, 6, -6, 1.5]) for (const q of [2, -2, 4, -4, 0, 6]) for (const r of [-2, 1, 3, 5, 0]) for (const a of [-2, -1, 0, 1, 2]) for (const d of [1, 2, 3]) {
    const b = a + d, F = stamm2(p, q, r);
    out.push({ p, q, r, a, b, I: F(b) - F(a) });
  }
  return out;
});
function e2Werte(v) {
  const F = stamm2(v.p, v.q, v.r), f = (x) => v.p * x * x + v.q * x + v.r;
  // −I fällt bei I = 0 mit der Lösung zusammen, F(b) bei a = 0 (dann ist F(a) = 0) — dort NaN.
  return { F, f, neg: v.I === 0 ? NaN : -v.I, nurOben: v.a === 0 ? NaN : F(v.b), abl: f(v.b) - f(v.a) };
}
function generateE2() {
  const k = ohneKollision(E2_KANDIDATEN(), (v) => { const w = e2Werte(v); return [v.I, w.neg, w.nurOben, w.abl]; }, EPS);
  const { p, q, r, a, b, I } = k;
  const w = e2Werte(k);
  const ft = poly([[p, "x²"], [q, "x"], [r, ""]]);
  const Ft = poly([[p / 3, "x³"], [q / 2, "x²"], [r, "x"]]);
  return {
    promptHtml: `<strong>Berechne ${intZ(num(a), num(b))} (${ft}) dx.</strong>` + ZAHL,
    correct: I,
    tolerance: TOL,
    placeholder: "Integral",
    hinweis: (roh, v) => {
      if (nahe(v, w.neg, TOL)) return "Vorzeichen vertauscht: Gerechnet wird F(obere Grenze) − F(untere Grenze), also F(b) − F(a).";
      if (nahe(v, w.nurOben, TOL)) return `Das ist nur F(${num(b)}). Die untere Grenze zählt mit: F(${num(b)}) − F(${num(a)}).`;
      if (nahe(v, w.abl, TOL)) return "Eingesetzt wurde in f statt in eine Stammfunktion F. Erst aufleiten, dann die Grenzen einsetzen.";
      return `F(x) = ${Ft}; rechne F(${num(b)}) − F(${num(a)}).`;
    },
    tipps: [`F(x) = ${Ft}`, `F(${num(b)}) = ${num(w.F(b))}; F(${num(a)}) = ${num(w.F(a))}`],
    musterloesungHtml: `${intZ(num(a), num(b))} (${ft}) dx = ${klammer(Ft, num(a), num(b))}<br>` +
      `= F(${num(b)}) − F(${num(a)}) = ${num(w.F(b))} − ${numK(w.F(a))} = <strong>${num(I)}</strong>`,
  };
}

// ---------- E3: Rekonstruktion aus einer stückweise konstanten Rate ----------
const E3_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const r1 of [5, 8, 10, 12, 15, 20]) for (const t1 of [2, 3, 4, 5, 6]) for (const r2 of [4, 6, 9, 15]) for (const t2 of [2, 3, 5]) for (const B0 of [20, 50, 100]) {
    const B = B0 + r1 * t1 - r2 * t2;
    if (B > 0) out.push({ r1, t1, r2, t2, B0, B });
  }
  return out;
});
function e3Werte(v) {
  return { plus: v.B0 + v.r1 * v.t1 + v.r2 * v.t2, ohneB0: v.r1 * v.t1 - v.r2 * v.t2, nurZu: v.B0 + v.r1 * v.t1 };
}
function generateE3() {
  const k = ohneKollision(E3_KANDIDATEN(), (v) => { const w = e3Werte(v); return [v.B, w.plus, w.ohneB0, w.nurZu]; }, EPS);
  const { r1, t1, r2, t2, B0, B } = k;
  const w = e3Werte(k);
  return {
    promptHtml: `In einem Becken sind zu Beginn ${num(B0)} Liter Wasser. ${num(t1)} Minuten lang fließen ${num(r1)} Liter pro Minute zu, danach ${num(t2)} Minuten lang ${num(r2)} Liter pro Minute ab.<br><strong>Wie viele Liter sind danach im Becken?</strong>` + ZAHL,
    correct: B,
    tolerance: TOL,
    placeholder: "Liter",
    hinweis: (roh, v) => {
      if (nahe(v, w.plus, TOL)) return "Der Abfluss wurde addiert. Im Rate-Zeit-Diagramm liegt er unter der t-Achse und zählt negativ.";
      if (nahe(v, w.ohneB0, TOL)) return `Das ist nur die Änderung. Der Anfangsbestand von ${num(B0)} Litern kommt noch dazu.`;
      if (nahe(v, w.nurZu, TOL)) return "Der Abfluss fehlt — nach dem Zufluss läuft wieder Wasser heraus.";
      return "Bestand = Anfangsbestand + Zufluss − Abfluss; jede Menge ist Rate · Zeit (eine Rechteckfläche).";
    },
    tipps: ["Jede Menge ist eine Rechteckfläche im Rate-Zeit-Diagramm: Rate · Dauer.", "Der Abfluss liegt unter der t-Achse und zählt negativ."],
    musterloesungHtml: `Zufluss: ${num(r1)} · ${num(t1)} = ${num(r1 * t1)} Liter; Abfluss: ${num(r2)} · ${num(t2)} = ${num(r2 * t2)} Liter (Fläche unter der Achse, negativ)<br>` +
      `Bestand: ${num(B0)} + ${num(r1 * t1)} − ${num(r2 * t2)} = <strong>${num(B)} Liter</strong>`,
  };
}

// ---------- E4: Mittelwert einer Funktion ----------
const E4_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const p of [3, 6, -3, 1.5, 0.75, -1.5, 2, 1]) for (const b of [1, 2, 3, 4, 6]) for (const q of [1, 2, 5, 10]) {
    const m = (p * b * b) / 3 + q;
    if (glatt(m, 4)) out.push({ p, b, q, m });
  }
  return out;
});
function e4Werte(v) {
  const { p, b, q } = v;
  // Bei b = 1 ist das Integral selbst schon der Mittelwert — dort NaN.
  return { integral: b === 1 ? NaN : (p * b ** 3) / 3 + q * b, rand: (p * b * b) / 2 + q, mitte: (p * b * b) / 4 + q };
}
function generateE4() {
  const k = ohneKollision(E4_KANDIDATEN(), (v) => { const w = e4Werte(v); return [v.m, w.integral, w.rand, w.mitte]; }, EPS);
  const { p, b, q, m } = k;
  const w = e4Werte(k);
  const ft = poly([[p, "x²"], [q, ""]]);
  const Ft = poly([[p / 3, "x³"], [q, "x"]]);
  const I = (p * b ** 3) / 3 + q * b;
  return {
    promptHtml: `Gegeben ist f(x) = ${ft}.<br><strong>Berechne den Mittelwert m der Funktionswerte von f auf dem Intervall [0; ${num(b)}].</strong>` + ZAHL,
    correct: m,
    tolerance: TOL,
    placeholder: "m",
    hinweis: (roh, v) => {
      if (nahe(v, w.integral, TOL)) return `Das ist das Integral. Der Mittelwert ist das Integral geteilt durch die Intervallbreite ${num(b)}.`;
      if (nahe(v, w.rand, TOL)) return "Das ist das Mittel der beiden Randwerte (f(0) + f(b)) : 2. Bei einer gekrümmten Kurve trifft das den Mittelwert nicht — er ist die Höhe des Rechtecks mit gleicher Fläche.";
      if (nahe(v, w.mitte, TOL)) return "Das ist der Funktionswert in der Intervallmitte. Der Mittelwert ist das Integral geteilt durch die Breite.";
      return `m = ${bruch("1", num(b))} · ${intZ("0", num(b))} f(x) dx`;
    },
    tipps: [`m = ${bruch("1", "b − a")} · ${intZ("a", "b")} f(x) dx`, `F(x) = ${Ft}`],
    musterloesungHtml: `${intZ("0", num(b))} (${ft}) dx = ${klammer(Ft, "0", num(b))} = ${num(I)}<br>` +
      `m = ${bruch("1", num(b))} · ${num(I)} = <strong>${num(m)}</strong> — das Rechteck mit der Höhe ${num(m)} über [0; ${num(b)}] hat denselben Flächeninhalt wie die Fläche unter f.`,
  };
}

// ================= mittel =================

// ---------- M1: Fläche mit Vorzeichenwechsel ----------
// f(x) = k(x² − s·x) hat die Nullstellen 0 und s; auf [0; b] mit b > s wechselt f das Vorzeichen.
const M1_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const k of [1, -1, 2, -2, 3, -3, 6, -6, 1.5, -1.5, 0.75]) for (const s of [1, 2, 3]) for (const d of [1, 2, 3]) {
    const b = s + d, F = (x) => k * (x ** 3 / 3 - (s * x * x) / 2);
    const I1 = F(s), I2 = F(b) - F(s), I = F(b), A = Math.abs(I1) + Math.abs(I2);
    if (glatt(A, 4) && glatt(I, 4) && glatt(I1, 4)) out.push({ k, s, b, I1, I2, I, A });
  }
  return out;
});
function m1Werte(v) {
  // |I| fällt mit I zusammen, wenn I ≥ 0 — dort NaN.
  return { integral: v.I, betrag: v.I >= 0 ? NaN : -v.I, teil: Math.abs(v.I2) };
}
function generateM1() {
  const k = ohneKollision(M1_KANDIDATEN(), (v) => { const w = m1Werte(v); return [v.A, w.integral, w.betrag, w.teil]; }, EPS);
  const { s, b, I1, I2, A } = k;
  const w = m1Werte(k);
  const ft = poly([[k.k, "x²"], [-k.k * s, "x"]]);
  const Ft = poly([[k.k / 3, "x³"], [(-k.k * s) / 2, "x²"]]);
  return {
    promptHtml: `Gegeben ist f(x) = ${ft}.<br><strong>Berechne den Inhalt der Fläche zwischen dem Graphen von f und der x-Achse über dem Intervall [0; ${num(b)}].</strong>` + ZAHL,
    correct: A,
    tolerance: TOL,
    placeholder: "A",
    hinweis: (roh, v) => {
      if (nahe(v, w.integral, TOL)) return `Das ist das Integral über [0; ${num(b)}]. f wechselt bei x = ${num(s)} das Vorzeichen; die Teilflächen heben sich darin teilweise auf.`;
      if (nahe(v, w.betrag, TOL)) return `Der Betrag des Gesamtintegrals hilft nicht: Die Teilflächen haben sich schon vorher teilweise aufgehoben. An der Nullstelle ${num(s)} teilen, jeden Teil einzeln betragen.`;
      if (nahe(v, w.teil, TOL)) return `Das ist nur die Teilfläche über [${num(s)}; ${num(b)}]. Die Fläche über [0; ${num(s)}] fehlt.`;
      return `Nullstellen 0 und ${num(s)}: A = |${intZ("0", num(s))} f(x) dx| + |${intZ(num(s), num(b))} f(x) dx|`;
    },
    tipps: [`f(x) = ${faktorVor(k.k)}x · (x ${plusMinus(-s)}) — Nullstellen 0 und ${num(s)}`, `F(x) = ${Ft}`],
    musterloesungHtml: `Nullstellen: f(x) = ${faktorVor(k.k)}x · (x ${plusMinus(-s)}) = 0 ⟺ x = 0 oder x = ${num(s)}; F(x) = ${Ft}<br>` +
      `${intZ("0", num(s))} f(x) dx = ${num(I1)}; ${intZ(num(s), num(b))} f(x) dx = ${num(I2)}<br>` +
      `A = |${num(I1)}| + |${num(I2)}| = <strong>${num(A)}</strong> (zum Vergleich: das Integral über [0; ${num(b)}] ist nur ${num(k.I)}.)`,
  };
}

// ---------- M2: Fläche zwischen Parabel und Gerade ----------
// Konstruktiv: f(x) = g(x) + k(x − x₁)(x − x₂). Dann schneiden sich die Graphen bei x₁ und x₂, und
// A = |k| · (x₂ − x₁)³ / 6.
const M2_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const k of [1, -1, 2, -2, 3, -3, 1.5, -1.5, 0.5, -0.5, 6]) for (const x1 of [-3, -2, -1, 0, 1]) for (const d of [1, 2, 3, 4]) for (const m of [-2, -1, 0, 1, 2]) for (const n of [-2, 0, 1, 3]) {
    const x2 = x1 + d, A = (Math.abs(k) * d ** 3) / 6;
    if (x2 > 3 || !glatt(A, 4)) continue;
    out.push({ k, x1, x2, m, n, A, a2: k, a1: m - k * (x1 + x2), a0: n + k * x1 * x2 });
  }
  return out;
});
function m2Werte(v) {
  const Ff = stamm2(v.a2, v.a1, v.a0), Fg = (x) => (v.m * x * x) / 2 + v.n * x;
  const D = (-v.k * (v.x2 - v.x1) ** 3) / 6;
  const nurF = Ff(v.x2) - Ff(v.x1), nurG = Fg(v.x2) - Fg(v.x1);
  return { D, signed: Math.abs(D - v.A) < 1e-9 ? NaN : D, nurF, nurG };
}
function generateM2() {
  const k = ohneKollision(M2_KANDIDATEN(), (v) => { const w = m2Werte(v); return [v.A, w.signed, w.nurF, w.nurG]; }, EPS);
  const { x1, x2, m, n, A } = k;
  const w = m2Werte(k);
  const ft = poly([[k.a2, "x²"], [k.a1, "x"], [k.a0, ""]]);
  const gt = poly([[m, "x"], [n, ""]]);
  const dt = poly([[k.a2, "x²"], [k.a1 - m, "x"], [k.a0 - n, ""]]);
  const Dt = poly([[k.a2 / 3, "x³"], [(k.a1 - m) / 2, "x²"], [k.a0 - n, "x"]]);
  return {
    promptHtml: `Gegeben sind f(x) = ${ft} und g(x) = ${gt}.<br><strong>Berechne den Inhalt der Fläche, die die beiden Graphen einschließen.</strong>` + ZAHL,
    correct: A,
    tolerance: TOL,
    placeholder: "A",
    hinweis: (roh, v) => {
      if (nahe(v, w.signed, TOL)) return "Das Integral von f − g ist negativ, weil g hier über f liegt. Ein Flächeninhalt ist nie negativ — den Betrag nehmen.";
      if (nahe(v, w.nurF, TOL)) return "Das ist nur das Integral über f. Gesucht ist die Fläche <em>zwischen</em> den Graphen: Integral der Differenz f − g.";
      if (nahe(v, w.nurG, TOL)) return "Das ist nur das Integral über g. Gesucht ist das Integral der Differenz f − g zwischen den Schnittstellen.";
      return "Schnittstellen aus f(x) = g(x), dann A = |∫(f(x) − g(x)) dx| zwischen ihnen.";
    },
    tipps: [`f(x) − g(x) = ${dt}`, `Schnittstellen: x₁ = ${num(x1)}, x₂ = ${num(x2)}`],
    musterloesungHtml: `f(x) − g(x) = ${dt} = ${faktorVor(k.k)}${linear(x1)} · ${linear(x2)} = 0 ⟺ x = ${num(x1)} oder x = ${num(x2)}<br>` +
      `${intZ(num(x1), num(x2))} (f(x) − g(x)) dx = ${klammer(Dt, num(x1), num(x2))} = ${num(w.D)}<br>A = |${num(w.D)}| = <strong>${num(A)}</strong>`,
  };
}
// Linearfaktor (x − r) mit richtigem Vorzeichen; für r = 0 steht nur x da.
function linear(r) {
  return r === 0 ? "x" : `(x ${plusMinus(-r)})`;
}

// ---------- M3: Stammfunktion durch einen Punkt ----------
const M3_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const a of [3, -3, 6, 1.5]) for (const b of [2, -2, 4, 0]) for (const c of [1, -1, 3, -4]) for (const x0 of [1, 2, -1]) for (const y0 of [0, 2, 5, -3]) for (const x1 of [0, 2, 3, -2]) {
    if (x1 === x0) continue;
    const G = stamm2(a, b, c), C = y0 - G(x0);
    out.push({ a, b, c, x0, y0, x1, C, F1: G(x1) + C });
  }
  return out;
});
function m3Werte(v) {
  const G = stamm2(v.a, v.b, v.c), f = (x) => v.a * x * x + v.b * x + v.c;
  const g0 = G(v.x0);
  return {
    G, f,
    // Ist G(x₀) = 0, fallen Vorzeichenfehler und „C = y₀“ mit der Lösung zusammen — dort NaN.
    plus: g0 === 0 ? NaN : v.y0 + g0,
    nurY: g0 === 0 ? NaN : v.y0,
    fStatt: v.y0 - f(v.x0),
    ohneC: v.C === 0 ? NaN : G(v.x1),
  };
}
function generateM3() {
  const k = ohneFeldKollision(M3_KANDIDATEN(), (v) => { const w = m3Werte(v); return [[v.C, w.plus, w.nurY, w.fStatt], [v.F1, w.ohneC]]; }, EPS);
  const { a, b, c, x0, y0, x1, C, F1 } = k;
  const w = m3Werte(k);
  const ft = poly([[a, "x²"], [b, "x"], [c, ""]]);
  const Gt = poly([[a / 3, "x³"], [b / 2, "x²"], [c, "x"]]);
  const Ft = poly([[a / 3, "x³"], [b / 2, "x²"], [c, "x"], [C, ""]]);
  return {
    promptHtml: `Gegeben ist f(x) = ${ft}.<br><strong>Bestimme die Stammfunktion F(x) = … + C von f, deren Graph durch P(${num(x0)} | ${num(y0)}) geht. Gib C und F(${num(x1)}) an.</strong>` + ZAHL,
    felder: [
      { name: "C =", soll: C, toleranz: TOL, hinweis: (roh, v) => (nahe(v, w.plus, TOL) ? "Vorzeichen: Aus G(x₀) + C = y₀ folgt C = y₀ − G(x₀)." : nahe(v, w.nurY, TOL) ? `C ist nicht einfach y₀: Der Teil ohne C hat bei x = ${num(x0)} schon den Wert ${num(w.G(x0))}.` : nahe(v, w.fStatt, TOL) ? "Eingesetzt wurde in f statt in die Stammfunktion. Erst aufleiten, dann P einsetzen." : `Setze P in F(x) = ${Gt} + C ein.`) },
      { name: `F(${num(x1)}) =`, soll: F1, toleranz: TOL, hinweis: (roh, v) => (nahe(v, w.ohneC, TOL) ? "Die Konstante C fehlt. Erst sie macht aus allen Stammfunktionen die eine durch P." : `Setze ${num(x1)} in F mit dem gefundenen C ein.`) },
    ],
    tipps: [`Alle Stammfunktionen: F(x) = ${Gt} + C`, `F(${num(x0)}) = ${num(w.G(x0))} + C = ${num(y0)}`],
    musterloesungHtml: `F(x) = ${Gt} + C<br>F(${num(x0)}) = ${num(w.G(x0))} + C = ${num(y0)} ⟺ <strong>C = ${num(C)}</strong><br>` +
      `F(x) = ${Ft}; <strong>F(${num(x1)}) = ${num(F1)}</strong><br><strong>Probe:</strong> F(${num(x0)}) = ${num(w.G(x0) + C)} = ${num(y0)} ✓ und F′(x) = ${ft} = f(x) ✓`,
  };
}

// ---------- M5: obere Grenze aus dem Integralwert ----------
const M5_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const n of [1, 2, 3]) for (const c of [1, 2, 3, 4, 6, 0.5, 1.5]) for (const b of [2, 3, 4, 5, 6]) {
    const A = (c * b ** (n + 1)) / (n + 1);
    if (glatt(A, 4)) out.push({ n, c, b, A });
  }
  return out;
});
function m5Werte(v) {
  const { n, c, b, A } = v;
  return { ohneDiv: (A / c) ** (1 / (n + 1)), ohneWurzel: b ** (n + 1), falscheWurzel: n === 1 ? NaN : b ** ((n + 1) / n) };
}
function generateM5() {
  const k = ohneKollision(M5_KANDIDATEN(), (v) => { const w = m5Werte(v); return [v.b, w.ohneDiv, w.ohneWurzel, w.falscheWurzel]; }, EPS);
  const { n, c, b, A } = k;
  const w = m5Werte(k);
  const ft = glied(c, xh(n), false);
  return {
    promptHtml: `<strong>Bestimme b &gt; 0 so, dass ${intZ("0", "b")} ${ft} dx = ${num(A)} gilt.</strong>` + ZAHL,
    correct: b,
    tolerance: TOL,
    placeholder: "b",
    hinweis: (roh, v) => {
      if (nahe(v, w.ohneDiv, TOL)) return `Die Stammfunktion hat den Faktor ${bruch(num(c), n + 1)}, nicht ${num(c)}: Durch den neuen Exponenten ${n + 1} wird geteilt.`;
      if (nahe(v, w.ohneWurzel, TOL)) return `Das ist b${hochZahl(n + 1)}. Zum Schluss fehlt noch die ${n + 1 === 2 ? "Quadratwurzel" : `${n + 1}. Wurzel`}.`;
      if (nahe(v, w.falscheWurzel, TOL)) return `Gezogen wurde die ${n}. Wurzel. In der Stammfunktion steht b${hochZahl(n + 1)} — also die ${n + 1}. Wurzel.`;
      return `${intZ("0", "b")} ${ft} dx = ${bruch(num(c), n + 1)} · b${hochZahl(n + 1)}; setze das gleich ${num(A)}.`;
    },
    tipps: [`${intZ("0", "b")} ${ft} dx = ${bruch(num(c), n + 1)} · b${hochZahl(n + 1)}`, `b${hochZahl(n + 1)} = ${num(b ** (n + 1))}`],
    musterloesungHtml: `${intZ("0", "b")} ${ft} dx = ${klammer(`${bruch(num(c), n + 1)} x${hochZahl(n + 1)}`, "0", "b")} = ${bruch(num(c), n + 1)} · b${hochZahl(n + 1)} = ${num(A)}<br>` +
      `⟺ b${hochZahl(n + 1)} = ${num(b ** (n + 1))} ⟺ <strong>b = ${num(b)}</strong> (b &gt; 0)<br><strong>Probe:</strong> ${bruch(num(c), n + 1)} · ${num(b)}${hochZahl(n + 1)} = ${num(A)} ✓`,
  };
}

// ================= schwierig =================

// ---------- S1: Fläche zwischen zwei Parabeln ----------
// Konstruktiv: f(x) = g(x) + k(x − x₁)(x − x₂), beide quadratisch.
const S1_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const g2 of [1, -1, 0.5, 2]) for (const g1 of [-2, 0, 2]) for (const g0 of [-3, 0, 2]) for (const k of [-1, -2, -3, 1.5, -1.5, 3, 2, 1]) for (const x1 of [-3, -2, -1, 0, 1]) for (const d of [1, 2, 3, 4]) {
    const x2 = x1 + d, A = (Math.abs(k) * d ** 3) / 6;
    if (x2 > 3 || g2 + k === 0 || !glatt(A, 4)) continue;
    out.push({ g2, g1, g0, k, x1, x2, A, f2: g2 + k, f1: g1 - k * (x1 + x2), f0: g0 + k * x1 * x2 });
  }
  return out;
});
function s1Werte(v) {
  const d = v.x2 - v.x1, D = (-v.k * d ** 3) / 6;
  const Ff = stamm2(v.f2, v.f1, v.f0);
  return { D, signed: Math.abs(D - v.A) < 1e-9 ? NaN : D, nurF: Ff(v.x2) - Ff(v.x1), ohneK: Math.abs(v.k) === 1 ? NaN : d ** 3 / 6 };
}
function generateS1() {
  const k = ohneKollision(S1_KANDIDATEN(), (v) => { const w = s1Werte(v); return [v.A, w.signed, w.nurF, w.ohneK]; }, EPS);
  const { x1, x2, A } = k;
  const w = s1Werte(k);
  const ft = poly([[k.f2, "x²"], [k.f1, "x"], [k.f0, ""]]);
  const gt = poly([[k.g2, "x²"], [k.g1, "x"], [k.g0, ""]]);
  const dt = poly([[k.k, "x²"], [-k.k * (x1 + x2), "x"], [k.k * x1 * x2, ""]]);
  const Dt = poly([[k.k / 3, "x³"], [(-k.k * (x1 + x2)) / 2, "x²"], [k.k * x1 * x2, "x"]]);
  return {
    promptHtml: `Gegeben sind f(x) = ${ft} und g(x) = ${gt}.<br><strong>Berechne den Inhalt der Fläche, die die beiden Graphen einschließen.</strong>` + ZAHL,
    correct: A,
    tolerance: TOL,
    placeholder: "A",
    hinweis: (roh, v) => {
      if (nahe(v, w.signed, TOL)) return "Das Integral von f − g ist negativ, weil g zwischen den Schnittstellen über f liegt. Für den Flächeninhalt den Betrag nehmen.";
      if (nahe(v, w.nurF, TOL)) return "Das ist das Integral über f allein. Die Fläche <em>zwischen</em> zwei Graphen ist das Integral der Differenz.";
      if (nahe(v, w.ohneK, TOL)) return `Die Differenz f − g ist ${faktorVor(k.k)}${linear(x1)} · ${linear(x2)} — der Vorfaktor ${num(k.k)} fehlt.`;
      return "Bilde d(x) = f(x) − g(x), bestimme dessen Nullstellen und integriere d zwischen ihnen.";
    },
    tipps: [`d(x) = f(x) − g(x) = ${dt}`, `Nullstellen von d: ${num(x1)} und ${num(x2)}`],
    musterloesungHtml: `d(x) = f(x) − g(x) = ${dt} = ${faktorVor(k.k)}${linear(x1)} · ${linear(x2)}; Schnittstellen ${num(x1)} und ${num(x2)}<br>` +
      `${intZ(num(x1), num(x2))} d(x) dx = ${klammer(Dt, num(x1), num(x2))} = ${num(w.D)}<br>A = |${num(w.D)}| = <strong>${num(A)}</strong>`,
  };
}

// ---------- S2: Parameter aus dem Flächeninhalt ----------
// f_k(x) = c(k² − x²) schließt mit der x-Achse über [−k; k] die Fläche 4ck³/3 ein.
const S2_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const c of [1, 2, 0.5, 3]) for (const k of [0.75, 1.5, 3, 4.5, 6, 0.3, 0.6, 1.2, 2.4, 0.9, 2, 4]) {
    const A = (4 * c * k ** 3) / 3;
    if (glatt(A, 4)) out.push({ c, k, A });
  }
  return out;
});
function s2Werte(v) {
  return { halb: v.k * Math.cbrt(2), ohneWurzel: v.k ** 3, quadrat: Math.sqrt(v.k ** 3) };
}
function generateS2() {
  const kd = ohneKollision(S2_KANDIDATEN(), (v) => { const w = s2Werte(v); return [v.k, w.halb, w.ohneWurzel, w.quadrat]; }, EPS);
  const { c, k, A } = kd;
  const w = s2Werte(kd);
  const ft = c === 1 ? "k² − x²" : `${num(c)} · (k² − x²)`;
  return {
    promptHtml: `Für k &gt; 0 ist f<sub>k</sub>(x) = ${ft}. Der Graph von f<sub>k</sub> und die x-Achse schließen eine Fläche mit dem Inhalt ${num(A)} ein.<br><strong>Bestimme k.</strong>` + ZAHL,
    correct: k,
    tolerance: TOL,
    placeholder: "k",
    hinweis: (roh, v) => {
      if (nahe(v, w.halb, TOL)) return "Integriert wurde nur von 0 bis k. Die Fläche reicht von der Nullstelle −k bis zur Nullstelle k — wegen der Symmetrie das Doppelte.";
      if (nahe(v, w.ohneWurzel, TOL)) return "Das ist k³. Zum Schluss fehlt die dritte Wurzel.";
      if (nahe(v, w.quadrat, TOL)) return "Gezogen wurde die Quadratwurzel; k steht aber in der dritten Potenz.";
      return `Nullstellen ±k; A(k) = ${intZ("−k", "k")} f<sub>k</sub>(x) dx — mit k als fester Zahl rechnen.`;
    },
    tipps: ["Nullstellen von f<sub>k</sub>: x = −k und x = k", `A(k) = ${intZ("−k", "k")} f<sub>k</sub>(x) dx = ${bruch(num(4 * c), 3)} k³`],
    musterloesungHtml: `Nullstellen ±k; f<sub>k</sub> ≥ 0 dazwischen.<br>A(k) = ${intZ("−k", "k")} ${ft} dx = ${faktorVor(c)}${klammer("k²x − ⅓x³", "−k", "k")} = ${faktorVor(c)}(⅔k³ + ⅔k³) = ${bruch(num(4 * c), 3)} k³<br>` +
      `${bruch(num(4 * c), 3)} k³ = ${num(A)} ⟺ k³ = ${num(k ** 3)} ⟺ <strong>k = ${num(k)}</strong><br><strong>Probe:</strong> ${bruch(num(4 * c), 3)} · ${num(k)}³ = ${num(A)} ✓`,
  };
}

// ---------- S5: Bestand bei linear fallender Zuflussrate ----------
const S5_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const r0 of [10, 12, 20, 24, 30, 40]) for (const m of [2, 4, 5, 8, 10]) for (const B0 of [50, 100, 200, 500]) {
    const t = r0 / m, B = B0 + (r0 * r0) / (2 * m);
    if (glatt(t, 4) && glatt(B, 4)) out.push({ r0, m, B0, t, B });
  }
  return out;
});
function s5Werte(v) {
  return { doppelt: (2 * v.r0) / v.m, ohneB0: (v.r0 * v.r0) / (2 * v.m), ohneHalb: v.B0 + (v.r0 * v.r0) / v.m };
}
function generateS5() {
  // „B₀ + r₀ · t*“ (Rate als konstant angenommen) ist derselbe Wert wie die fehlende Hälfte, r₀²/m —
  // deshalb steht er nur einmal in der Liste, mit einem Hinweis, der beides erklärt.
  const k = ohneFeldKollision(S5_KANDIDATEN(), (v) => { const w = s5Werte(v); return [[v.t, w.doppelt], [v.B, w.ohneB0, w.ohneHalb]]; }, EPS);
  const { r0, m, B0, t, B } = k;
  const w = s5Werte(k);
  const rt = poly([[r0, ""], [-m, "t"]]);
  return {
    promptHtml: `In einen Speicher fließt Wasser mit der Rate r(t) = ${rt} (t in Stunden, r(t) in m³ pro Stunde; negative Werte bedeuten Abfluss). Zu Beginn sind ${num(B0)} m³ im Speicher.<br><strong>Zu welchem Zeitpunkt t* ist der Bestand am größten, und wie groß ist er dann?</strong>` + ZAHL,
    felder: [
      { name: "t* =", soll: t, toleranz: TOL, hinweis: (roh, v) => (nahe(v, w.doppelt, TOL) ? "Zu diesem Zeitpunkt ist der Bestand wieder so groß wie zu Beginn. Am größten ist er, solange noch Wasser zufließt — also bis r(t) = 0." : "Der Bestand wächst, solange r(t) > 0 ist. Bestimme die Nullstelle der Rate.") },
      { name: "B(t*) =", soll: B, toleranz: TOL, hinweis: (roh, v) => (nahe(v, w.ohneB0, TOL) ? `Das ist nur die zugeflossene Menge. Der Anfangsbestand von ${num(B0)} m³ kommt dazu.` : nahe(v, w.ohneHalb, TOL) ? `Gerechnet wurde mit r₀ · t*. Die Rate fällt aber — die Fläche unter r ist ein Dreieck: ½ · ${num(r0)} · t*.` : "B(t*) = B₀ + ∫ r(t) dt von 0 bis t*.") },
    ],
    tipps: ["Der Bestand ist maximal, wo die Rate von + nach − wechselt: r(t) = 0.", `B(t) = ${num(B0)} + ${intZ("0", "t")} r(s) ds = ${num(B0)} ${glied(r0, "t", true)} ${glied(-m / 2, "t²", true)}`],
    musterloesungHtml: `r(t) = ${rt} = 0 ⟺ <strong>t* = ${num(t)}</strong> h; davor ist r &gt; 0 (Zufluss), danach r &lt; 0 (Abfluss) ⟹ Maximum.<br>` +
      `B(t*) = ${num(B0)} + ${intZ("0", num(t))} (${rt}) dt = ${num(B0)} + ${klammer(poly([[r0, "t"], [-m / 2, "t²"]]), "0", num(t))} = ${num(B0)} + ${num(B - B0)} = <strong>${num(B)} m³</strong><br>` +
      `(Die zugeflossene Menge ist die Dreiecksfläche ½ · ${num(r0)} · ${num(t)} = ${num(B - B0)}.)`,
  };
}

// ================= komplex =================

// ---------- K1: Tangente an eine kubische Funktion ----------
// f(x) = a·x³ + c·x; die Tangente in P(x₀ | f(x₀)) schneidet den Graphen ein zweites Mal bei −2x₀, denn
// f(x) − t(x) = a(x − x₀)²(x + 2x₀). Die eingeschlossene Fläche ist |a| · 27/4 · x₀⁴.
const K1_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const a of [0.25, 0.5, 1, 2, -0.5, -1]) for (const c of [-3, -1, 0, 2]) for (const x0 of [-2, -1, 1, 2]) {
    const A = (Math.abs(a) * 27 * x0 ** 4) / 4;
    if (glatt(A, 4)) out.push({ a, c, x0, xq: -2 * x0, A });
  }
  return out;
});
// Stammfunktion von f − t = a·x³ − 3a·x₀²·x + 2a·x₀³.
function k1Stamm(a, x0) {
  return (x) => (a * x ** 4) / 4 - (3 * a * x0 * x0 * x * x) / 2 + 2 * a * x0 ** 3 * x;
}
function k1Werte(v) {
  const { a, c, x0 } = v;
  const F = (x) => (a * x ** 4) / 4 + (c * x * x) / 2, D = k1Stamm(a, x0);
  const lo = Math.min(v.xq, x0), hi = Math.max(v.xq, x0);
  // Das Integral von f − t ist je nach Vorzeichen von a und x₀ positiv oder negativ; ist es positiv,
  // fällt es mit der Fläche zusammen — dort NaN.
  const integral = D(hi) - D(lo);
  return {
    xPlus: 2 * x0, xBer: x0, lo, hi, D,
    integral,
    signed: Math.abs(integral - v.A) < 1e-9 ? NaN : integral,
    nurF: F(hi) - F(lo),
    ohneA: Math.abs(a) === 1 ? NaN : (27 * x0 ** 4) / 4,
  };
}
function generateK1() {
  const k = ohneFeldKollision(K1_KANDIDATEN(), (v) => { const w = k1Werte(v); return [[v.xq, w.xPlus, w.xBer], [v.A, w.signed, w.nurF, w.ohneA]]; }, EPS);
  const { a, c, x0, xq, A } = k;
  const w = k1Werte(k);
  const ft = poly([[a, "x³"], [c, "x"]]);
  const y0 = a * x0 ** 3 + c * x0, m = 3 * a * x0 * x0 + c, n = -2 * a * x0 ** 3;
  const tt = poly([[m, "x"], [n, ""]]);
  const dt = poly([[a, "x³"], [-3 * a * x0 * x0, "x"], [2 * a * x0 ** 3, ""]]);
  const { lo, hi } = w, Dlo = w.D(lo), Dhi = w.D(hi);
  const Dt = poly([[a / 4, "x⁴"], [(-3 * a * x0 * x0) / 2, "x²"], [2 * a * x0 ** 3, "x"]]);
  return {
    promptHtml: `Gegeben ist f(x) = ${ft}. Die Tangente t an den Graphen im Punkt P(${num(x0)} | ${num(y0)}) schneidet den Graphen in einem zweiten Punkt Q.<br><strong>Bestimme die x-Koordinate von Q und den Inhalt A der Fläche, die Graph und Tangente einschließen.</strong>` + ZAHL,
    felder: [
      { name: "x<sub>Q</sub> =", soll: xq, toleranz: TOL, hinweis: (roh, v) => (nahe(v, w.xPlus, TOL) ? "Vorzeichen: f(x) − t(x) = a(x − x₀)²(x + 2x₀), die zweite Nullstelle ist also −2x₀." : nahe(v, w.xBer, TOL) ? "Das ist der Berührpunkt P selbst. Q ist der <em>zweite</em> gemeinsame Punkt." : "Löse f(x) = t(x); x₀ ist doppelte Nullstelle von f − t.") },
      { name: "A =", soll: A, toleranz: TOL, hinweis: (roh, v) => (nahe(v, w.signed, TOL) ? "Das Integral von f − t ist hier negativ, weil die Tangente über dem Graphen liegt. Für den Flächeninhalt den Betrag nehmen." : nahe(v, w.nurF, TOL) ? "Das ist das Integral über f allein. Die Fläche liegt zwischen Graph und Tangente: Integral der Differenz f − t." : nahe(v, w.ohneA, TOL) ? `Der Faktor ${num(a)} aus f − t = ${num(a)}(x − x₀)²(x + 2x₀) fehlt.` : "Integriere f − t zwischen den beiden Schnittstellen.") },
    ],
    tipps: [`t(x) = f′(${num(x0)}) · (x ${plusMinus(-x0)}) + f(${num(x0)}) = ${tt}`, `f(x) − t(x) = ${dt} = ${faktorVor(a)}(x ${plusMinus(-x0)})² · (x ${plusMinus(2 * x0)})`],
    musterloesungHtml: `f′(x) = ${poly([[3 * a, "x²"], [c, ""]])}; f′(${num(x0)}) = ${num(m)} ⟹ t(x) = ${m === 0 ? num(y0) : `${faktorVor(m)}(x ${plusMinus(-x0)})${y0 ? " " + plusMinus(y0) : ""}`} = ${tt}<br>` +
      `f(x) − t(x) = ${dt} = ${faktorVor(a)}(x ${plusMinus(-x0)})² · (x ${plusMinus(2 * x0)}) ⟹ doppelte Nullstelle ${num(x0)} (Berührpunkt), <strong>x<sub>Q</sub> = ${num(xq)}</strong><br>` +
      `${intZ(num(lo), num(hi))} (f(x) − t(x)) dx = ${klammer(Dt, num(lo), num(hi))} = ${num(Dhi)} − ${numK(Dlo)} = ${num(w.integral)}<br>` +
      `<strong>A = |${num(w.integral)}| = ${num(A)}</strong>. <strong>Probe:</strong> t(${num(xq)}) = ${num(m * xq + n)} = f(${num(xq)}) ✓`,
  };
}

// ---------- K2: Maximum einer Integralfunktion ----------
// I(x) = ∫₀ˣ f(t) dt mit f(t) = k(t − p)(t − q). Nach dem Hauptsatz ist I′ = f; das lokale Maximum liegt
// dort, wo f von + nach − wechselt: bei p für k > 0, bei q für k < 0.
const K2_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const k of [3, -3, 6, -6, 1.5, -1.5]) for (const p of [-3, -2, -1, 0, 1, 2]) for (const q of [-2, -1, 0, 1, 2, 3]) {
    if (q <= p) continue;
    const I = (x) => k * (x ** 3 / 3 - ((p + q) * x * x) / 2 + p * q * x);
    const xmax = k > 0 ? p : q, xmin = k > 0 ? q : p;
    if (glatt(I(xmax), 4) && glatt(I(xmin), 4)) out.push({ k, p, q, xmax, xmin, Imax: I(xmax), Imin: I(xmin) });
  }
  return out;
});
function k2Werte(v) {
  return { mitte: (v.p + v.q) / 2, minWert: v.Imin, neg: v.Imax === 0 ? NaN : -v.Imax };
}
function generateK2() {
  const kd = ohneFeldKollision(K2_KANDIDATEN(), (v) => { const w = k2Werte(v); return [[v.xmax, v.xmin, w.mitte], [v.Imax, w.minWert, w.neg]]; }, EPS);
  const { k, p, q, xmax, xmin, Imax, Imin } = kd;
  const w = k2Werte(kd);
  const ft = poly([[k, "t²"], [-k * (p + q), "t"], [k * p * q, ""]]);
  const It = poly([[k / 3, "x³"], [(-k * (p + q)) / 2, "x²"], [k * p * q, "x"]]);
  const tausch = `An der Stelle ${num(xmin)} wechselt f von − nach +: Dort hat I ein lokales <em>Minimum</em>.`;
  return {
    promptHtml: `Gegeben ist f(t) = ${ft}. Die Integralfunktion I(x) = ${intZ("0", "x")} f(t) dt hat genau ein lokales Maximum.<br><strong>Bestimme die Maximalstelle x<sub>M</sub> und den Maximalwert I(x<sub>M</sub>).</strong>` + ZAHL,
    felder: [
      { name: "x<sub>M</sub> =", soll: xmax, toleranz: TOL, hinweis: (roh, v) => (nahe(v, xmin, TOL) ? tausch : nahe(v, w.mitte, TOL) ? "Das ist die Extremstelle von f — dort hat I einen Wendepunkt. Die Extremstellen von I sind die Nullstellen von f." : "Nach dem Hauptsatz ist I′(x) = f(x). Bestimme die Nullstellen von f und ihren Vorzeichenwechsel.") },
      { name: "I(x<sub>M</sub>) =", soll: Imax, toleranz: TOL, hinweis: (roh, v) => (nahe(v, w.minWert, TOL) ? tausch : nahe(v, w.neg, TOL) ? "Vorzeichen: I(x) = F(x) − F(0) mit F(0) = 0; die Grenzen nicht vertauschen." : `I(x) = ${It}; setze x<sub>M</sub> ein.`) },
    ],
    tipps: [`I′(x) = f(x) = ${faktorVor(k)}${linear(p)} · ${linear(q)}`, `I(x) = ${It}`],
    musterloesungHtml: `Hauptsatz: I′(x) = f(x) = ${faktorVor(k)}${linear(p)} · ${linear(q)} = 0 ⟺ x = ${num(p)} oder x = ${num(q)}<br>` +
      `Bei ${num(xmax)} wechselt f von + nach − ⟹ lokales Maximum von I: <strong>x<sub>M</sub> = ${num(xmax)}</strong> (bei ${num(xmin)} liegt das Minimum).<br>` +
      `I(x) = ${klammer(poly([[k / 3, "t³"], [(-k * (p + q)) / 2, "t²"], [k * p * q, "t"]]), "0", "x")} = ${It}<br><strong>I(${num(xmax)}) = ${num(Imax)}</strong> (zum Vergleich: I(${num(xmin)}) = ${num(Imin)})`,
  };
}

// ---------- K4: Eine Ursprungsgerade halbiert eine Fläche ----------
// f(x) = k·x(c − x) schließt mit der x-Achse die Fläche k·c³/6 ein. Die Gerade y = m·x schneidet f bei
// s = c − m/k und schneidet mit f die Fläche k·s³/6 ab. Halbieren: s³ = c³/2.
const K4_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const k of [0.5, 1, 2, 3]) for (const c of [2, 3, 4, 5, 6]) out.push({ k, c, m: k * c * (1 - Math.cbrt(0.5)) });
  return out;
});
function k4Werte(v) {
  return { halb: (v.k * v.c) / 2, quadrat: v.k * v.c * (1 - Math.SQRT1_2), verwechselt: v.c * Math.cbrt(0.5) };
}
function generateK4() {
  const kd = ohneKollision(K4_KANDIDATEN(), (v) => { const w = k4Werte(v); return [v.m, w.halb, w.quadrat, w.verwechselt]; }, EPS);
  const { k, c, m } = kd;
  const w = k4Werte(kd);
  const ft = poly([[k * c, "x"], [-k, "x²"]]);
  const s = c * Math.cbrt(0.5);
  // Für k = 1 weder „1 · c³“ noch „m/1“.
  const kM = k === 1 ? "" : `${num(k)} · `, mK = k === 1 ? "m" : bruch("m", num(k));
  return {
    promptHtml: `Der Graph von f(x) = ${ft} schließt mit der x-Achse eine Fläche ein. Eine Ursprungsgerade y = m · x mit m &gt; 0 teilt diese Fläche in zwei gleich große Teile.<br><strong>Bestimme m.</strong>` + RUND4,
    correct: m,
    tolerance: TOL,
    placeholder: "m",
    hinweis: (roh, v) => {
      if (nahe(v, w.halb, TOL)) return "Die halbe Steigung halbiert die Fläche nicht: Die abgeschnittene Fläche wächst mit der dritten Potenz der Breite.";
      if (nahe(v, w.quadrat, TOL)) return "Gezogen wurde die Quadratwurzel. Die Fläche zwischen Parabel und Gerade wächst mit s³ — es braucht die dritte Wurzel.";
      if (nahe(v, w.verwechselt, TOL)) return `Das ist die Schnittstelle s = ${bruch("c", "∛2")}, nicht die Steigung. Aus s = c − ${mK} folgt m.`;
      return `Gesamtfläche ${bruch(`${kM}c³`, "6")}; die Gerade schneidet f bei s = c − ${mK} und schneidet die Fläche ${bruch(`${kM}s³`, "6")} ab.`;
    },
    tipps: [`f(x) − m · x = ${kM}x · (${num(c)} − ${mK} − x); zweiter Schnittpunkt bei s = ${num(c)} − ${mK}`, `${intZ("0", "s")} (f(x) − m · x) dx = ${bruch(`${kM}s³`, "6")}`],
    musterloesungHtml: `Gesamtfläche: ${intZ("0", num(c))} f(x) dx = ${bruch(`${kM}${num(c)}³`, "6")} = ${num((k * c ** 3) / 6)}<br>` +
      `f(x) − m · x = ${kM}x · (s − x) mit s = ${num(c)} − ${mK}; ${intZ("0", "s")} (f(x) − m · x) dx = ${bruch(`${kM}s³`, "6")}<br>` +
      `${bruch(`${kM}s³`, "6")} = ½ · ${num((k * c ** 3) / 6)} ⟺ s³ = ${num(c ** 3 / 2)} ⟺ s = ${num(s)}<br>` +
      `m = ${k === 1 ? `${num(c)} − s` : `${kM}(${num(c)} − s)`} ≈ <strong>${num(m)}</strong><br><strong>Probe:</strong> ${bruch(`${kM}${num(s)}³`, "6")} ≈ ${num((k * s ** 3) / 6)} ≈ ½ · ${num((k * c ** 3) / 6)} ✓`,
  };
}

// ================= Schnittstellen und uneigentliche Integrale (je Stufe zwei weitere) =================

// pq-Formel als Rechenweg: x² + P·x + Q = 0 mit ganzzahligen Lösungen x₁ < x₂ (P = −(x₁ + x₂), Q = x₁x₂).
function pqWeg(x1, x2) {
  const P = -(x1 + x2), Q = x1 * x2, h = -P / 2, r = (x2 - x1) / 2;
  const dt = poly([[1, "x²"], [P, "x"], [Q, ""]]);
  return `${dt} = 0 ⟹ x = ${num(h)} ± √(${numK(h)}² ${plusMinus(-Q)}) = ${num(h)} ± ${num(r)} ⟹ x₁ = ${num(x1)}, x₂ = ${num(x2)}`;
}

// ---------- E6: Schnittstellen von Parabel und Gerade ----------
const E6_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const x1 of [-4, -3, -2, -1, 0, 1, 2]) for (const d of [1, 2, 3, 4, 5]) for (const m of [-2, -1, 1, 2, 3]) for (const n of [-3, -1, 0, 2, 4]) {
    const x2 = x1 + d;
    if (x2 > 4) continue;
    out.push({ x1, x2, m, n, p: m - (x1 + x2), q: n + x1 * x2 });
  }
  return out;
});
function e6Werte(v) {
  // Nullstellen von f selbst — der häufige Fehler, g zu vergessen. Ohne reelle Nullstellen: NaN.
  const D = (v.p * v.p) / 4 - v.q;
  const nf = D >= 0 ? [-v.p / 2 - Math.sqrt(D), -v.p / 2 + Math.sqrt(D)] : [NaN, NaN];
  return { nf, minus: [-v.x2, -v.x1] };
}
function generateE6() {
  const k = ohneFeldKollision(E6_KANDIDATEN(), (v) => { const w = e6Werte(v); return [[v.x1, w.minus[0], w.nf[0]], [v.x2, w.minus[1], w.nf[1]]]; }, EPS);
  const { x1, x2, m, n, p, q } = k;
  const w = e6Werte(k);
  const ft = poly([[1, "x²"], [p, "x"], [q, ""]]), gt = poly([[m, "x"], [n, ""]]);
  const hinweis = (i) => (roh, v) => (nahe(v, w.minus[i], TOL) ? "Vorzeichen in der pq-Formel: x = −p/2 ± √((p/2)² − q) — mit −p/2, nicht +p/2." : nahe(v, w.nf[i], TOL) ? "Das ist eine Nullstelle von f allein. Gesucht sind die Stellen mit f(x) = g(x): erst gleichsetzen, dann alles auf eine Seite." : "Setze f(x) = g(x), bringe alles auf eine Seite und löse mit der pq-Formel.");
  return {
    promptHtml: `Gegeben sind f(x) = ${ft} und g(x) = ${gt}.<br><strong>Bestimme die Schnittstellen x₁ &lt; x₂ der beiden Graphen.</strong>` + ZAHL,
    felder: [
      { name: "x₁ =", soll: x1, toleranz: TOL, hinweis: hinweis(0) },
      { name: "x₂ =", soll: x2, toleranz: TOL, hinweis: hinweis(1) },
    ],
    tipps: [`Gleichsetzen: ${ft} = ${gt}`, `Alles auf eine Seite: ${poly([[1, "x²"], [p - m, "x"], [q - n, ""]])} = 0`],
    musterloesungHtml: `${ft} = ${gt} ⟺ ${pqWeg(x1, x2)}<br>` +
      `<strong>x₁ = ${num(x1)}, x₂ = ${num(x2)}</strong>. <strong>Probe:</strong> f(${num(x1)}) = ${num(x1 * x1 + p * x1 + q)} = g(${num(x1)}) ✓, f(${num(x2)}) = ${num(x2 * x2 + p * x2 + q)} = g(${num(x2)}) ✓`,
  };
}

// ---------- M6: drei Schnittstellen — x ausklammern ----------
// f(x) = m·x + k·x(x − p)(x − q), g(x) = m·x mit p < 0 < q: d = f − g hat die Nullstellen p, 0, q.
const M6_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const k of [1, -1, 2, -2, 0.5, -0.5, 3]) for (const p of [-3, -2, -1]) for (const q of [1, 2, 3]) for (const m of [-2, -1, 1, 2]) {
    const D = (x) => k * (x ** 4 / 4 - ((p + q) * x ** 3) / 3 + (p * q * x * x) / 2);
    const I1 = D(0) - D(p), I2 = D(q) - D(0), A = Math.abs(I1) + Math.abs(I2);
    if (glatt(I1, 4) && glatt(I2, 4)) out.push({ k, p, q, m, I1, I2, A, gesamt: Math.abs(I1 + I2) });
  }
  return out;
});
function m6Werte(v) {
  // Bei p = −q sind beide Teilflächen gleich — „nur die rechte“ fiele mit „nur die linke“ zusammen.
  return { gesamt: v.gesamt, links: Math.abs(v.I1), rechts: nahe(Math.abs(v.I1), Math.abs(v.I2), 1e-9) ? NaN : Math.abs(v.I2) };
}
function generateM6() {
  const kd = ohneKollision(M6_KANDIDATEN(), (v) => { const w = m6Werte(v); return [v.A, w.gesamt, w.links, w.rechts]; }, EPS);
  const { k, p, q, m, I1, I2, A } = kd;
  const w = m6Werte(kd);
  const ft = poly([[k, "x³"], [-k * (p + q), "x²"], [k * p * q + m, "x"]]), gt = poly([[m, "x"]]);
  const dt = poly([[k, "x³"], [-k * (p + q), "x²"], [k * p * q, "x"]]);
  const Dt = poly([[k / 4, "x⁴"], [(-k * (p + q)) / 3, "x³"], [(k * p * q) / 2, "x²"]]);
  return {
    promptHtml: `Gegeben sind f(x) = ${ft} und g(x) = ${gt}. Die Graphen schneiden sich in drei Punkten.<br><strong>Berechne den Inhalt der Fläche, die sie einschließen.</strong>` + ZAHL,
    correct: A,
    tolerance: TOL,
    placeholder: "A",
    hinweis: (roh, v) => {
      if (nahe(v, w.gesamt, TOL)) return "Über [x₁; x₃] auf einmal integriert, heben sich die beiden Teilflächen teilweise auf — an der mittleren Schnittstelle 0 teilen und jeden Teil einzeln betragen.";
      if (nahe(v, w.links, TOL)) return `Das ist nur die Teilfläche über [${num(p)}; 0]. Die zweite über [0; ${num(q)}] fehlt.`;
      if (nahe(v, w.rechts, TOL)) return `Das ist nur die Teilfläche über [0; ${num(q)}]. Die erste über [${num(p)}; 0] fehlt.`;
      return "d(x) = f(x) − g(x) hat kein absolutes Glied: x ausklammern, den Rest mit der pq-Formel lösen, dann zwei Teilintegrale.";
    },
    tipps: [`d(x) = f(x) − g(x) = ${dt} = x · (${poly([[k, "x²"], [-k * (p + q), "x"], [k * p * q, ""]])})`, `Schnittstellen ${num(p)}, 0 und ${num(q)}`],
    musterloesungHtml: `d(x) = f(x) − g(x) = ${dt} = ${faktorVor(k)}x · (${pqLinks(p, q)}) = 0<br>` +
      `x = 0 oder ${pqWeg(p, q)}<br>D(x) = ${Dt}: ${intZ(num(p), "0")} d(x) dx = ${num(I1)}, ${intZ("0", num(q))} d(x) dx = ${num(I2)}<br>` +
      `<strong>A = |${num(I1)}| + |${num(I2)}| = ${num(A)}</strong>`,
  };
}
// x² − (p + q)x + pq als Text — der Faktor, der nach dem Ausklammern übrig bleibt.
function pqLinks(p, q) {
  return poly([[1, "x²"], [-(p + q), "x"], [p * q, ""]]);
}

// ---------- S6: Schnittstellen und Fläche — erst durch den Leitkoeffizienten teilen ----------
const S6_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const g2 of [1, -1, 2]) for (const g1 of [-2, 1, 3]) for (const g0 of [-3, 0, 2]) for (const k of [-2, -3, 2, 3, -1.5, 1.5]) for (const x1 of [-3, -2, -1, 0, 1]) for (const d of [1, 2, 3, 4]) {
    const x2 = x1 + d, A = (Math.abs(k) * d ** 3) / 6;
    if (x2 > 3 || g2 + k === 0 || !glatt(A, 4)) continue;
    out.push({ g2, g1, g0, k, x1, x2, A, f2: g2 + k, f1: g1 - k * (x1 + x2), f0: g0 + k * x1 * x2 });
  }
  return out;
});
function s6Werte(v) {
  const D = (-v.k * (v.x2 - v.x1) ** 3) / 6;
  return { minus: [-v.x2, -v.x1], signed: nahe(D, v.A, 1e-9) ? NaN : D, ohneK: v.A / Math.abs(v.k) };
}
function generateS6() {
  const kd = ohneFeldKollision(S6_KANDIDATEN(), (v) => { const w = s6Werte(v); return [[v.x1, w.minus[0]], [v.x2, w.minus[1]], [v.A, w.signed, w.ohneK]]; }, EPS);
  const { k, x1, x2, A } = kd;
  const w = s6Werte(kd);
  const ft = poly([[kd.f2, "x²"], [kd.f1, "x"], [kd.f0, ""]]), gt = poly([[kd.g2, "x²"], [kd.g1, "x"], [kd.g0, ""]]);
  const dt = poly([[k, "x²"], [-k * (x1 + x2), "x"], [k * x1 * x2, ""]]);
  const Dt = poly([[k / 3, "x³"], [(-k * (x1 + x2)) / 2, "x²"], [k * x1 * x2, "x"]]);
  const vz = (i) => (roh, v) => (nahe(v, w.minus[i], TOL) ? "Vorzeichen in der pq-Formel: x = −p/2 ± √((p/2)² − q)." : `Setze f = g, bringe alles auf eine Seite und teile durch ${num(k)}, bevor du die pq-Formel anwendest.`);
  return {
    promptHtml: `Gegeben sind f(x) = ${ft} und g(x) = ${gt}.<br><strong>Bestimme die Schnittstellen x₁ &lt; x₂ und den Inhalt A der eingeschlossenen Fläche.</strong>` + ZAHL,
    felder: [
      { name: "x₁ =", soll: x1, toleranz: TOL, hinweis: vz(0) },
      { name: "x₂ =", soll: x2, toleranz: TOL, hinweis: vz(1) },
      { name: "A =", soll: A, toleranz: TOL, hinweis: (roh, v) => (nahe(v, w.signed, TOL) ? "Das Integral von f − g ist negativ, weil g hier über f liegt. Für den Flächeninhalt den Betrag nehmen." : nahe(v, w.ohneK, TOL) ? `Integriert wurde x² + px + q statt d(x) = f(x) − g(x): Das Teilen durch ${num(k)} gilt nur für die Gleichung d(x) = 0, nicht für das Integral.` : "Integriere d(x) = f(x) − g(x) zwischen den Schnittstellen.") },
    ],
    tipps: [`d(x) = f(x) − g(x) = ${dt}`, `d(x) = 0 ⟺ ${pqLinks(x1, x2)} = 0 (durch ${num(k)} geteilt)`],
    musterloesungHtml: `d(x) = f(x) − g(x) = ${dt} = 0 &nbsp;| : ${numK(k)}<br>${pqWeg(x1, x2)}<br>` +
      `${intZ(num(x1), num(x2))} d(x) dx = ${klammer(Dt, num(x1), num(x2))} = ${num(-k * (x2 - x1) ** 3 / 6)}<br><strong>A = ${num(A)}</strong>`,
  };
}

// ---------- K6: kubische Funktion und Parabel — raten und Polynomdivision ----------
const K6_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const k of [1, -1, 2, 0.5]) for (const p of [-3, -2, -1]) for (const q of [-2, -1, 1, 2]) for (const r of [1, 2, 3, 4]) {
    if (!(p < q && q < r) || r - p > 5) continue;
    const D = (x) => k * (x ** 4 / 4 - ((p + q + r) * x ** 3) / 3 + ((p * q + p * r + q * r) * x * x) / 2 - p * q * r * x);
    const I1 = D(q) - D(p), I2 = D(r) - D(q);
    if (!glatt(I1, 4) || !glatt(I2, 4)) continue;
    for (const [g2, g1, g0] of [[1, 0, 1], [-1, 2, 0], [2, -1, 3], [1, 1, -2]]) out.push({ k, p, q, r, g2, g1, g0, I1, I2, A: Math.abs(I1) + Math.abs(I2) });
  }
  return out;
});
function k6Werte(v) {
  return { gesamt: Math.abs(v.I1 + v.I2), links: Math.abs(v.I1), rechts: nahe(Math.abs(v.I1), Math.abs(v.I2), 1e-9) ? NaN : Math.abs(v.I2) };
}
function generateK6() {
  const kd = ohneKollision(K6_KANDIDATEN(), (v) => { const w = k6Werte(v); return [v.A, w.gesamt, w.links, w.rechts]; }, EPS);
  const { k, p, q, r, g2, g1, g0, I1, I2, A } = kd;
  const w = k6Werte(kd);
  const s1 = p + q + r, s2 = p * q + p * r + q * r, s3 = p * q * r;
  const ft = poly([[k, "x³"], [g2 - k * s1, "x²"], [g1 + k * s2, "x"], [g0 - k * s3, ""]]), gt = poly([[g2, "x²"], [g1, "x"], [g0, ""]]);
  const dt = poly([[k, "x³"], [-k * s1, "x²"], [k * s2, "x"], [-k * s3, ""]]);
  // Geraten wird die betragskleinste Nullstelle — sie findet man beim Durchprobieren der Teiler zuerst.
  const [z, u, o] = [p, q, r].sort((a, b) => Math.abs(a) - Math.abs(b) || a - b);
  const rest = poly([[k, "x²"], [-k * (u + o), "x"], [k * u * o, ""]]);
  const Dt = poly([[k / 4, "x⁴"], [(-k * s1) / 3, "x³"], [(k * s2) / 2, "x²"], [-k * s3, "x"]]);
  return {
    promptHtml: `Gegeben sind f(x) = ${ft} und g(x) = ${gt}. Die Graphen schneiden sich in drei Punkten mit ganzzahligen x-Koordinaten.<br><strong>Berechne den Inhalt der Fläche, die sie einschließen.</strong>` + ZAHL,
    correct: A,
    tolerance: TOL,
    placeholder: "A",
    hinweis: (roh, v) => {
      if (nahe(v, w.gesamt, TOL)) return `Über [${num(p)}; ${num(r)}] auf einmal integriert, heben sich die Teilflächen teilweise auf. An der mittleren Schnittstelle ${num(q)} teilen.`;
      if (nahe(v, w.links, TOL)) return `Das ist nur die Teilfläche über [${num(p)}; ${num(q)}]. Die über [${num(q)}; ${num(r)}] fehlt.`;
      if (nahe(v, w.rechts, TOL)) return `Das ist nur die Teilfläche über [${num(q)}; ${num(r)}]. Die über [${num(p)}; ${num(q)}] fehlt.`;
      return "d(x) = f(x) − g(x) gleich 0 setzen, eine Nullstelle unter den Teilern des absoluten Glieds raten, per Polynomdivision abspalten.";
    },
    tipps: [`d(x) = f(x) − g(x) = ${dt}`, `d(${num(z)}) = 0 — spalte (x ${plusMinus(-z)}) ab.`],
    musterloesungHtml: `d(x) = f(x) − g(x) = ${dt}<br>Raten: d(${num(z)}) = 0. Polynomdivision: d(x) : ${linear(z)} = ${rest}` +
      `${k === 1 ? "" : ` = ${faktorVor(k)}(${pqLinks(u, o)})`}<br>${pqWeg(Math.min(u, o), Math.max(u, o))} — Schnittstellen ${num(p)}, ${num(q)}, ${num(r)}<br>` +
      `D(x) = ${Dt}: ${intZ(num(p), num(q))} d(x) dx = ${num(I1)}, ${intZ(num(q), num(r))} d(x) dx = ${num(I2)}<br><strong>A = |${num(I1)}| + |${num(I2)}| = ${num(A)}</strong>`,
  };
}

// ================= Stammfunktionen bestimmen (Termeingabe, je Stufe eine) =================
// Die Funktionen setzen sich aus Gliedern zusammen, die ihre Stammfunktion exakt kennen
// (mathematik/terme.js) — so gibt es beliebig viele, und die Musterlösung entsteht aus denselben
// Gliedern wie die Angabe. Geprüft wird die getippte Stammfunktion durch Ableiten (F + C zählt).

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

// einfach: ganzrational, Grad 2 oder 3.
function generateE8() {
  return stammAufgabe(zufallsPolynom(2, 3, zufall([2, 3])));
}
// mittel: negative Hochzahlen und Wurzeln (x⁻¹ kommt nicht vor — dafür fehlt noch der Logarithmus).
function generateM8() {
  return stammAufgabe(mische([
    pot(zufall(KOEFF), zufall([-2, -3])),
    pot(zufall(KLEIN), zufall([q(1, 2), q(-1, 2), q(3, 2)])),
    pot(zufall(KOEFF), zufall([1, 2, 3])),
  ]));
}

// ---------- S7: Fläche zwischen Parabel und Tangente ----------
// f(x) = ax² + c, Tangente in P(x₀ | f(x₀)): f(x) − t(x) = a(x − x₀)², also schließen Graph, Tangente
// und y-Achse die Fläche |a| · |x₀|³ / 3 ein. Fehlerbilder: Steigung ohne den Faktor 2; die Fläche
// ohne 1/3 und die Fläche unter f statt zwischen f und t.
const S7_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const a of [0.5, 1, 1.5, 2, 3, 0.75, -1, -1.5]) for (const x0 of [1, 2, 3, -1, -2]) for (const c of [1, 2, -1, 3]) {
    const A = (Math.abs(a) * Math.abs(x0) ** 3) / 3;
    if (!glatt(A, 4)) continue;
    out.push({ a, x0, c, m: 2 * a * x0, A, ohneDrittel: Math.abs(a * x0 ** 3), unterF: Math.abs((a * x0 ** 3) / 3 + c * x0) });
  }
  return out;
});
// a/3 als Bruch mit dem Vorzeichen davor: −1,5/3 steht als „−“ vor dem Bruch.
function drittel(a) {
  return (a < 0 ? "−" : "") + bruch(num(Math.abs(a)), "3");
}
function generateS7() {
  const v = ohneFeldKollision(S7_KANDIDATEN(), (w) => [[w.m, w.a * w.x0], [w.A, w.ohneDrittel, w.unterF]], EPS);
  const { a, x0, c, m, A } = v;
  const ft = poly([[a, "x²"], [c, ""]]), y0 = a * x0 * x0 + c, n = y0 - m * x0;
  const tt = poly([[m, "x"], [n, ""]]);
  const [lo, hi] = x0 > 0 ? [0, x0] : [x0, 0];
  const wert = (a / 3) * ((hi - x0) ** 3 - (lo - x0) ** 3);
  return {
    promptHtml: `Gegeben ist f(x) = ${ft}. Die Tangente an den Graphen von f im Punkt P(${num(x0)} | ${num(y0)}), der Graph von f und die y-Achse schließen eine Fläche ein.<br><strong>Bestimme die Steigung m der Tangente und den Inhalt A dieser Fläche.</strong>` + ZAHL,
    felder: [
      { name: "m =", soll: m, toleranz: TOL, hinweis: (roh, z) => (nahe(z, a * x0, TOL) ? `Die Ableitung von ${glied(a, "x²", false)} ist ${glied(2 * a, "x", false)} — der Faktor 2 fehlt.` : `m = f′(${num(x0)}).`) },
      { name: "A =", soll: A, toleranz: TOL, hinweis: (roh, z) => (nahe(z, v.ohneDrittel, TOL) ? "Der Faktor 1/3 aus der Stammfunktion fehlt." : nahe(z, v.unterF, TOL) ? "Das ist die Fläche unter dem Graphen von f. Gesucht ist die Fläche zwischen Graph und Tangente: das Integral über f − t." : "A = |∫ (f(x) − t(x)) dx| zwischen 0 und x₀.") },
    ],
    tipps: [`t(x) = f′(${num(x0)}) · (x ${plusMinus(-x0)}) + f(${num(x0)})`, `f(x) − t(x) = ${faktorVor(a)}(x ${plusMinus(-x0)})² — die Tangente berührt den Graphen bei x₀.`],
    musterloesungHtml: `f′(x) = ${glied(2 * a, "x", false)}, also <strong>m = f′(${num(x0)}) = ${num(m)}</strong> und t(x) = ${tt}.<br>` +
      `f(x) − t(x) = ${poly([[a, "x²"], [-m, "x"], [c - n, ""]])} = ${faktorVor(a)}(x ${plusMinus(-x0)})²<br>` +
      `${intZ(num(lo), num(hi))} (f(x) − t(x)) dx = ${klammer(`${drittel(a)} · (x ${plusMinus(-x0)})³`, num(lo), num(hi))} = ${num(wert)}<br>` +
      `<strong>A = ${wert < 0 ? `|${num(wert)}| = ` : ""}${num(A)}</strong>`,
  };
}

// ---------- K5: Bilanz null — wann ist der Anfangsbestand wieder erreicht? ----------
// r(t) = k · t · (t − s): erst Abfluss, ab s Zufluss. B(t) = B₀ + k t³/3 − k s t²/2 ist bei T = 1,5 · s
// wieder B₀; der kleinste Bestand liegt bei t = s: B₀ − k s³/6.
// Fehlerbilder: T = s (Nullstelle der Rate), T = 2s/3 (Bruch verkehrt); beim Minimum das Vorzeichen
// und der fehlende Anfangsbestand.
const K5_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const k of [0.5, 1, 1.5, 2, 3, 0.25]) for (const s of [2, 3, 4, 6, 8]) for (const B0 of [50, 80, 100, 200, 500]) {
    const T = 1.5 * s, Bmin = B0 - (k * s ** 3) / 6;
    if (Bmin <= 0 || !glatt(Bmin, 4)) continue;
    out.push({ k, s, B0, T, Bmin, verkehrt: (2 * s) / 3, plus: B0 + (k * s ** 3) / 6, ohneB0: -(k * s ** 3) / 6 });
  }
  return out;
});
function generateK5() {
  const v = ohneFeldKollision(K5_KANDIDATEN(), (w) => [[w.T, w.s, w.verkehrt], [w.Bmin, w.plus, w.ohneB0]], EPS);
  const { k, s, B0, T, Bmin } = v;
  const rt = poly([[k, "t²"], [-k * s, "t"]]);
  // k/3 bricht nicht immer ab (k = 1 gibt 0,333…) — deshalb als Bruch.
  const kDrittel = (v) => `${bruch(num(k), "3")}${v}³ − ${glied((k * s) / 2, v + "²", false)}`;
  return {
    promptHtml: `Die Wassermenge in einem Becken ändert sich mit der Rate r(t) = ${rt} (t in Stunden, r(t) in m³ pro Stunde; negative Werte bedeuten Abfluss). Zu Beginn sind ${num(B0)} m³ im Becken.<br><strong>Zu welchem Zeitpunkt T &gt; 0 sind wieder ${num(B0)} m³ im Becken, und wie groß ist der kleinste Bestand?</strong>` + ZAHL,
    felder: [
      { name: "T =", soll: T, toleranz: TOL, hinweis: (roh, z) => (nahe(z, s, TOL) ? "Dort ist die Rate null — der Bestand ist am kleinsten, aber noch nicht wieder beim Anfangswert." : nahe(z, v.verkehrt, TOL) ? "Bruch verkehrt: Aus T/3 = s/2 folgt T = 3s/2." : "Gesucht ist T mit ∫ r(t) dt = 0 zwischen 0 und T — dann ist die Bilanz ausgeglichen.") },
      { name: "B<sub>min</sub> =", soll: Bmin, toleranz: TOL, hinweis: (roh, z) => (nahe(z, v.plus, TOL) ? "Vorzeichen: Bis t = s fließt Wasser ab — der Bestand nimmt ab." : nahe(z, v.ohneB0, TOL) ? `Das ist nur die Änderung. Der Anfangsbestand von ${num(B0)} m³ kommt dazu.` : "Der Bestand ist am kleinsten, wo die Rate von − nach + wechselt.") },
    ],
    tipps: [`B(t) = ${num(B0)} + ${intZ("0", "t")} r(u) du — erst die Stammfunktion von r, dann B(T) = ${num(B0)} setzen.`, "Kleinster Bestand: r(t) = 0 mit Vorzeichenwechsel von − nach +."],
    musterloesungHtml: `B(t) = ${num(B0)} + ${intZ("0", "t")} (${rt.replace(/t/g, "u")}) du = ${num(B0)} + ${kDrittel("t")}<br>` +
      `B(T) = ${num(B0)} ⟺ ${kDrittel("T")} = 0 ⟺ T² · (${bruch(num(k), "3")}T − ${num((k * s) / 2)}) = 0 ⟺ <strong>T = ${num(T)}</strong> h (T &gt; 0)<br>` +
      `r(t) = ${glied(k, "t", false)} · (t − ${num(s)}) wechselt bei t = ${num(s)} von − nach +: <strong>B<sub>min</sub></strong> = B(${num(s)}) = ${num(B0)} − ${num((k * s ** 3) / 6)} = <strong>${num(Bmin)} m³</strong>`,
  };
}

// schwierig: Produkte zweier Polynome — erst ausmultiplizieren, denn eine „Produktregel rückwärts“
// gibt es nicht: ∫ u · v dx ist nicht ∫ u dx · ∫ v dx.
function generateS8() {
  const faktor = () => {
    const g = zufall([1, 2]);
    return [pot(zufall(KLEIN), g), pot(zufall(KOEFF), zufall(bereich(0, g - 1)))];
  };
  return stammAufgabe([produkt(faktor(), faktor())]);
}
// komplex: Klammern mit Hochzahl — (x² − 1)², x · (x² + 2)², (2x³ + 1)² … ausmultiplizieren (binomische
// Formel oder dritte Potenz), dann Glied für Glied. Eine Regel für die ganze Klammer hat der Grundkurs
// nicht; die lineare Verkettung folgt erst in Thema 4.2.
function generateK8() {
  const gl = [zufall([true, true, false])
    ? verkettung(zufall([1, 2, 3, -1]), zufall([1, 2]), zufall([2, 3]), zufall([1, 2, 3, -1, -2, -3]), 2, { p: zufall([0, 0, 1]) })
    : verkettung(zufall([1, 2, -1]), 1, 2, zufall([1, -1, 2, -2]), 3)];
  if (zufall([true, false])) gl.push(pot(zufall(KOEFF), zufall([1, 2])));
  return stammAufgabe(mische(gl));
}

export const AUFGABEN = [
  { schwierigkeit: "einfach", titel: "Potenzregel", generate: generateE1 },
  { schwierigkeit: "einfach", titel: "Integral eines Polynoms", generate: generateE2 },
  { schwierigkeit: "einfach", titel: "Bestand aus Zu- und Abfluss", generate: generateE3 },
  { schwierigkeit: "einfach", titel: "Mittelwert einer Funktion", generate: generateE4 },
  { schwierigkeit: "einfach", titel: "Schnittstellen von Parabel und Gerade", generate: generateE6 },
  { schwierigkeit: "einfach", titel: "Stammfunktion: ganzrational", generate: generateE8, wuerfelText: "🎲 Neue Funktion" },
  { schwierigkeit: "mittel", titel: "Fläche mit Vorzeichenwechsel", generate: generateM1 },
  { schwierigkeit: "mittel", titel: "Fläche zwischen Parabel und Gerade", generate: generateM2 },
  { schwierigkeit: "mittel", titel: "Stammfunktion durch einen Punkt", generate: generateM3 },
  { schwierigkeit: "mittel", titel: "Obere Grenze gesucht", generate: generateM5 },
  { schwierigkeit: "mittel", titel: "Drei Schnittstellen", generate: generateM6 },
  { schwierigkeit: "mittel", titel: "Stammfunktion: Potenzen und Wurzeln", generate: generateM8, wuerfelText: "🎲 Neue Funktion" },
  { schwierigkeit: "schwierig", titel: "Fläche zwischen zwei Parabeln", generate: generateS1 },
  { schwierigkeit: "schwierig", titel: "Parameter aus dem Flächeninhalt", generate: generateS2 },
  { schwierigkeit: "schwierig", titel: "Größter Bestand", generate: generateS5 },
  { schwierigkeit: "schwierig", titel: "Schnittstellen und Fläche zweier Parabeln", generate: generateS6 },
  { schwierigkeit: "schwierig", titel: "Fläche zwischen Parabel und Tangente", generate: generateS7 },
  { schwierigkeit: "schwierig", titel: "Stammfunktion: Produkte ausmultiplizieren", generate: generateS8, wuerfelText: "🎲 Neue Funktion" },
  { schwierigkeit: "komplex", titel: "Tangente an eine kubische Funktion", generate: generateK1 },
  { schwierigkeit: "komplex", titel: "Maximum einer Integralfunktion", generate: generateK2 },
  { schwierigkeit: "komplex", titel: "Ursprungsgerade halbiert eine Fläche", generate: generateK4 },
  { schwierigkeit: "komplex", titel: "Bilanz null", generate: generateK5 },
  { schwierigkeit: "komplex", titel: "Kubische Funktion und Parabel", generate: generateK6 },
  { schwierigkeit: "komplex", titel: "Stammfunktion: Klammern auflösen", generate: generateK8, wuerfelText: "🎲 Neue Funktion" },
];
