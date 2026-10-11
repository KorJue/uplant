// Die vierundzwanzig Übungsaufgaben zu „Integration weiterer Funktionen“ (Thema 4.2) — sechs je Stufe.
// Was nach dem rheinland-pfälzischen Lehrplan nur zum Leistungsfach gehört (sin und cos, die lineare
// Verkettung, ln als Stammfunktion von 1/x, uneigentliche Integrale und Rotationskörper), trägt im Titel
// „(LK)“; die übrigen Aufgaben brauchen nur a · e^(kx), den Ansatz für p(x) · e^(kx) und den
// natürlichen Logarithmus zum Lösen von e^(kx) = c.
//
//   einfach   — ∫ a · e^(kx), Sinus und Kosinus über Vielfache von π/2 (LK), ∫ c/x mit Grenzen eⁿ (LK),
//               uneigentliches Integral in zwei Schritten (LK), Stammfunktion mit e durch einen Punkt.
//   mittel    — Stammfunktion per Ansatz (Ax + B) · e^(kx), Zufluss mit abklingender Rate, lineare
//               Verkettung (LK), Polstelle am Rand (LK), obere Grenze aus der Fläche unter c/x (LK).
//   schwierig — Fläche unter a · x · e^(−kx), mittlere Temperatur, Rotationsvolumen (LK),
//               uneigentliches Integral (LK), unendlich langer Rotationskörper (LK).
//   komplex   — größter Bestand bei abklingendem Zufluss und festem Abfluss, Rotationskörper unter
//               a · e^(−kx) (LK), Kugelschicht (LK), unbegrenzte Fläche zwischen zwei Graphen (LK),
//               Grenze aus einer unbegrenzten Fläche (LK).
//
// Die sechste Aufgabe jeder Stufe ist ein Integrationstraining mit beliebig vielen Funktionen
// (mathematik/terme.js): e-Funktionen, Produkte mit e (Ansatz), Sinus, Kosinus und 1/x (LK),
// Verkettung und Umformen (LK). Die eingegebene Stammfunktion wird durch numerisches Ableiten geprüft —
// jede Konstante ist richtig.
//
// Gewürfelt wird konstruktiv: Die Kandidatenlisten werden vorher gesiebt, ohneKollision() wählt aus
// dem Rest. Jeder Fehlerwert ist von der Lösung und von den anderen Fehlerwerten verschieden — wo ein
// Fehler mit der Lösung zusammenfiele, steht NaN. Wo die Lösung eine e-Potenz oder ein Logarithmus ist,
// wird auf vier Nachkommastellen gerundet eingegeben; sonst ist sie glatt.

"use strict";

import { pot, trig, kette, verkettung, trigPotenz, efunktion, q, stammAufgabe, pick as zufall, mische } from "../../../terme.js?v=4";

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
const PI_FAKTOR = `<br><span class="progress-note">Gib V als Vielfaches von π an: Für V = 12π tippst du 12.</span>`;
// Potenz als Text: x, x², x³ …
const xh = (n, v = "x") => (n === 1 ? v : v + hochZahl(n));

// ---------- E2: Sinus und Kosinus über Vielfache von π/2 ----------
// Die Grenzen sind k · π/2; Sinus und Kosinus nehmen dort nur −1, 0 und 1 an — exakt, ohne Rundung.
const SIN_K = [0, 1, 0, -1, 0], COS_K = [1, 0, -1, 0, 1];
const PI_TEXT = ["0", "π/2", "π", "3π/2", "2π"];
const E2_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const art of ["sin", "cos"]) for (const c of [1, 2, 3, 4]) for (let a = 0; a < 4; a++) for (let b = a + 1; b <= 4; b++) {
    // sin hat die Stammfunktion −cos, cos die Stammfunktion sin.
    const F = (k) => (art === "sin" ? -c * COS_K[k] : c * SIN_K[k]);
    // Flächeninhalt: Jedes Viertel einer Periode trägt die Fläche 1 bei.
    out.push({ art, c, a, b, I: F(b) - F(a), A: c * (b - a), Fa: F(a), Fb: F(b) });
  }
  return out;
});
function e2Werte(v) {
  // Ist der Flächeninhalt gleich |I|, zeigt der Wert nur das Vorzeichen — dann gehört der Fall zum
  // Vorzeichenhinweis, die Fläche wird NaN.
  return { neg: v.I === 0 ? NaN : -v.I, flaeche: v.A === Math.abs(v.I) ? NaN : v.A, ohneC: v.c === 1 ? NaN : v.I / v.c };
}
function generateE2() {
  const k = ohneKollision(E2_KANDIDATEN(), (v) => { const w = e2Werte(v); return [v.I, w.neg, w.flaeche, w.ohneC]; }, EPS);
  const { art, c, a, b, I, Fa, Fb } = k;
  const w = e2Werte(k);
  const ft = `${c === 1 ? "" : num(c) + " · "}${art}(x)`;
  const Ft = art === "sin" ? `−${c === 1 ? "" : num(c) + " · "}cos(x)` : `${c === 1 ? "" : num(c) + " · "}sin(x)`;
  return {
    promptHtml: `<strong>Berechne ${intZ(PI_TEXT[a], PI_TEXT[b])} ${ft} dx.</strong>` + ZAHL,
    correct: I,
    tolerance: TOL,
    placeholder: "Integral",
    hinweis: (roh, v) => {
      if (nahe(v, w.neg, TOL)) return art === "sin" ? "Vorzeichen: (cos x)′ = −sin x, also ist −cos x eine Stammfunktion von sin x — nicht cos x." : "Vorzeichen: (sin x)′ = cos x, also ist sin x eine Stammfunktion von cos x — nicht −sin x.";
      if (nahe(v, w.flaeche, TOL)) return "Das ist der Flächeninhalt zwischen Graph und x-Achse. Das Integral zählt Stücke unter der Achse negativ.";
      if (nahe(v, w.ohneC, TOL)) return `Der Faktor ${num(c)} fehlt. Konstante Faktoren bleiben beim Integrieren stehen.`;
      return `Stammfunktion: F(x) = ${Ft}. Dann F(${PI_TEXT[b]}) − F(${PI_TEXT[a]}).`;
    },
    tipps: [art === "sin" ? "(−cos x)′ = sin x" : "(sin x)′ = cos x", `F(x) = ${Ft}`],
    musterloesungHtml: `${intZ(PI_TEXT[a], PI_TEXT[b])} ${ft} dx = ${klammer(Ft, PI_TEXT[a], PI_TEXT[b])} = ${num(Fb)} − ${numK(Fa)} = <strong>${num(I)}</strong>`,
  };
}

// ---------- M3: lineare Verkettung ----------
const M3_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const m of [2, 3, -2, 0.5, 4, -1]) for (const n of [-3, -2, -1, 1, 2, 3]) for (const k of [2, 3]) for (const [a, b] of [[0, 1], [-1, 0], [0, 2], [1, 2], [-1, 1]]) {
    const F = (x) => (m * x + n) ** (k + 1) / (m * (k + 1));
    const I = F(b) - F(a);
    if (glatt(I, 4) && Math.abs(I) > 1e-9) out.push({ m, n, k, a, b, I, Fa: F(a), Fb: F(b) });
  }
  return out;
});
function m3Werte(v) {
  // Bei |m| = 1 ändern Teilen und Malnehmen mit m nichts — dort NaN.
  return { ohneM: Math.abs(v.m) === 1 ? NaN : v.I * v.m, malM: Math.abs(v.m) === 1 ? NaN : v.I * v.m * v.m, ohneK: v.I * (v.k + 1) };
}
function generateM3() {
  const kd = ohneKollision(M3_KANDIDATEN(), (v) => { const w = m3Werte(v); return [v.I, w.ohneM, w.malM, w.ohneK]; }, EPS);
  const { m, n, k, a, b, I, Fa, Fb } = kd;
  const w = m3Werte(kd);
  const innen = poly([[m, "x"], [n, ""]]);
  const Ft = `${bruch("1", `${numK(m)} · ${k + 1}`)} · (${innen})${hochZahl(k + 1)}`;
  return {
    promptHtml: `<strong>Berechne ${intZ(num(a), num(b))} (${innen})${hochZahl(k)} dx.</strong>` + ZAHL,
    correct: I,
    tolerance: TOL,
    placeholder: "Integral",
    hinweis: (roh, v) => {
      if (nahe(v, w.ohneM, TOL)) return `Beim Aufleiten einer Verkettung mit der inneren Funktion ${innen} wird zusätzlich durch die innere Ableitung ${num(m)} geteilt — sonst liefert die Kettenregel beim Ableiten einen Faktor ${num(m)} zu viel.`;
      if (nahe(v, w.malM, TOL)) return `Mit der inneren Ableitung ${num(m)} wurde multipliziert statt geteilt. Probe: Leite deine Stammfunktion ab — es muss genau (${innen})${hochZahl(k)} herauskommen.`;
      if (nahe(v, w.ohneK, TOL)) return `Der Exponent steigt auf ${k + 1}; durch ${k + 1} muss auch geteilt werden.`;
      return `Stammfunktion: F(x) = ${Ft}. Probe durch Ableiten mit der Kettenregel.`;
    },
    tipps: [`Lineare Verkettung: ∫ (mx + n)${hochZahl(k)} dx = ${bruch("1", `m · ${k + 1}`)} · (mx + n)${hochZahl(k + 1)} + C`, `F(x) = ${Ft}`],
    musterloesungHtml: `F(x) = ${Ft}, denn F′(x) = ${bruch(`${k + 1} · ${numK(m)}`, `${numK(m)} · ${k + 1}`)} · (${innen})${hochZahl(k)} = (${innen})${hochZahl(k)} ✓<br>` +
      `${intZ(num(a), num(b))} (${innen})${hochZahl(k)} dx = F(${num(b)}) − F(${num(a)}) = ${num(Fb)} − ${numK(Fa)} = <strong>${num(I)}</strong>`,
  };
}

// ---------- S3: Rotationsvolumen ----------
// f(x) = √(c·x) rotiert über [0; b]: V = π ∫ c·x dx = π · c · b² / 2.
const S3_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const c of [1, 2, 3, 4, 6, 0.5]) for (const b of [1, 2, 3, 4, 5, 6]) {
    const V = (c * b * b) / 2;
    if (glatt(V, 4)) out.push({ c, b, V });
  }
  return out;
});
function s3Werte(v) {
  return { mitPi: v.V * Math.PI, ohneHalb: v.c * v.b * v.b, hoch4: (v.c * v.c * v.b ** 3) / 3 };
}
function generateS3() {
  const k = ohneKollision(S3_KANDIDATEN(), (v) => { const w = s3Werte(v); return [v.V, w.mitPi, w.ohneHalb, w.hoch4]; }, EPS);
  const { c, b, V } = k;
  const w = s3Werte(k);
  const innen = c === 1 ? "x" : `${num(c)}x`;
  return {
    promptHtml: `Der Graph von f(x) = √(${innen}) rotiert über dem Intervall [0; ${num(b)}] um die x-Achse.<br><strong>Berechne das Volumen V des entstehenden Rotationskörpers.</strong>` + PI_FAKTOR,
    correct: V,
    tolerance: TOL,
    placeholder: "V : π",
    hinweis: (roh, v) => {
      if (nahe(v, w.mitPi, 0.001)) return "Das ist V als Dezimalzahl. Gefragt ist nur der Faktor vor π.";
      if (nahe(v, w.ohneHalb, TOL)) return `Die Stammfunktion von ${innen} ist ${c === 1 ? "" : num(c) + " · "}½x² — der Faktor ½ fehlt.`;
      if (nahe(v, w.hoch4, TOL)) return "Quadriert wurde zweimal: (f(x))² = " + innen + ", nicht (" + innen + ")².";
      return `V = π · ${intZ("0", num(b))} (f(x))² dx, und (f(x))² = ${innen}.`;
    },
    tipps: [`V = π · ${intZ("a", "b")} (f(x))² dx`, `(f(x))² = ${innen}`],
    musterloesungHtml: `V = π · ${intZ("0", num(b))} (√(${innen}))² dx = π · ${intZ("0", num(b))} ${innen} dx = π · ${klammer(`${bruch(num(c), 2)} x²`, "0", num(b))} = π · ${bruch(num(c), 2)} · ${num(b * b)} = <strong>${num(V)}π</strong> ≈ ${num(V * Math.PI, 2)}`,
  };
}

// ---------- S4: uneigentliches Integral bis ∞ ----------
const S4_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const c of [1, 2, 3, 4, 6, 8, 12]) for (const n of [2, 3, 4]) for (const a of [1, 2, 3]) {
    const I = c / ((n - 1) * a ** (n - 1));
    if (glatt(I, 4)) out.push({ c, n, a, I });
  }
  return out;
});
function s4Werte(v) {
  const { c, n, a, I } = v;
  return { plusEins: c / ((n + 1) * a ** (n + 1)), ohneA: a === 1 ? NaN : c / (n - 1), neg: -I };
}
function generateS4() {
  const k = ohneKollision(S4_KANDIDATEN(), (v) => { const w = s4Werte(v); return [v.I, w.plusEins, w.ohneA, w.neg]; }, EPS);
  const { c, n, a, I } = k;
  const w = s4Werte(k);
  const ft = bruch(num(c), xh(n));
  const Ft = `−${bruch(num(c), `${n - 1 === 1 ? "" : (n - 1) + " · "}${xh(n - 1)}`)}`;
  return {
    promptHtml: `<strong>Berechne ${intZ(num(a), "∞")} ${ft} dx.</strong>` + ZAHL,
    correct: I,
    tolerance: TOL,
    placeholder: "Integral",
    hinweis: (roh, v) => {
      if (nahe(v, w.plusEins, TOL)) return `Potenzregel mit dem falschen Exponenten: ${bruch("1", xh(n))} = x<sup>−${n}</sup>, und −${n} + 1 = −${n - 1}, nicht −${n + 1}.`;
      if (nahe(v, w.ohneA, TOL)) return `Das wäre die untere Grenze 1. Hier beginnt das Intervall bei ${num(a)}.`;
      if (nahe(v, w.neg, TOL)) return "Vorzeichen: Die Stammfunktion ist negativ; F(z) − F(a) mit F(z) → 0 ergibt −F(a) &gt; 0.";
      return `Rechne erst bis zu einer festen Grenze z: ${intZ(num(a), "z")} … dx, dann z → ∞.`;
    },
    tipps: [`${ft} = ${vor(c)}x<sup>−${n}</sup>; Stammfunktion F(x) = ${Ft}`, "Für z → ∞ geht F(z) gegen 0."],
    musterloesungHtml: `${intZ(num(a), "z")} ${ft} dx = ${klammer(Ft, num(a), "z")} = ${bruch(num(c), `${(n - 1) * a ** (n - 1)}`)} − ${bruch(num(c), `${n - 1 === 1 ? "" : (n - 1) + " · "}z${hochZahl(n - 1)}`)}<br>` +
      `Für z → ∞ geht der zweite Bruch gegen 0: ${intZ(num(a), "∞")} ${ft} dx = <strong>${num(I)}</strong> — die nach rechts unbegrenzte Fläche hat einen endlichen Inhalt.`,
  };
}

// ---------- K3: Kugelschicht ----------
// f(x) = √(r² − x²) rotiert um die x-Achse; V/π = r²(b − a) − (b³ − a³)/3.
const K3_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const r of [2, 3, 4, 5, 6]) for (let a = -r; a < r; a++) for (let b = a + 1; b <= r; b++) {
    if ((b ** 3 - a ** 3) % 3 !== 0) continue;
    out.push({ r, a, b, V: r * r * (b - a) - (b ** 3 - a ** 3) / 3 });
  }
  return out;
});
function k3Werte(v) {
  const { r, a, b } = v;
  return {
    plus: r * r * (b - a) + (b ** 3 - a ** 3) / 3,
    // Ist die Schicht die ganze Kugel, ist die Kugelformel die Lösung — dort NaN.
    kugel: a === -r && b === r ? NaN : (4 * r ** 3) / 3,
    zylinder: r * r * (b - a),
  };
}
function generateK3() {
  const k = ohneKollision(K3_KANDIDATEN(), (v) => { const w = k3Werte(v); return [v.V, w.plus, w.kugel, w.zylinder]; }, EPS);
  const { r, a, b, V } = k;
  const w = k3Werte(k);
  const Ft = `${num(r * r)}x − ⅓x³`;
  return {
    promptHtml: `Der Graph von f(x) = √(${num(r * r)} − x²) ist ein Halbkreis mit dem Radius ${num(r)}. Er rotiert um die x-Achse und erzeugt eine Kugel.<br><strong>Berechne das Volumen V der Kugelschicht zwischen x = ${num(a)} und x = ${num(b)}.</strong>` + PI_FAKTOR,
    correct: V,
    tolerance: TOL,
    placeholder: "V : π",
    hinweis: (roh, v) => {
      if (nahe(v, w.plus, TOL)) return "Vorzeichen: (f(x))² = r² − x², das x³-Glied der Stammfunktion ist also −⅓x³.";
      if (nahe(v, w.kugel, TOL)) return "Das ist die ganze Kugel. Gefragt ist nur die Schicht zwischen den beiden Grenzen.";
      if (nahe(v, w.zylinder, TOL)) return "Das ist ein Zylinder mit dem Radius r. Der Radius der Scheiben ist f(x) und wird nach außen kleiner: π ∫ (r² − x²) dx.";
      return `V = π · ${intZ(num(a), num(b))} (${num(r * r)} − x²) dx`;
    },
    tipps: [`(f(x))² = ${num(r * r)} − x²`, `V = π · ${klammer(Ft, num(a), num(b))}`],
    musterloesungHtml: `V = π · ${intZ(num(a), num(b))} (${num(r * r)} − x²) dx = π · ${klammer(Ft, num(a), num(b))}<br>` +
      `= π · (${num(r * r * b - b ** 3 / 3, 4)} − ${numK(r * r * a - a ** 3 / 3, 4)}) = <strong>${num(V)}π</strong> ≈ ${num(V * Math.PI, 2)}<br>` +
      `<strong>Probe:</strong> Über [−${num(r)}; ${num(r)}] ergäbe dieselbe Rechnung ${num((4 * r ** 3) / 3)}π = ${bruch("4", "3")}π · ${num(r)}³ — die bekannte Kugelformel.`,
  };
}

// ---------- K4: uneigentliche Fläche zwischen zwei Graphen ----------
// f(x) = a/x², g(x) = b/x³; Schnittstelle s = b/a, rechts davon liegt f über g. ∫ₛ^∞ (f − g) dx = a²/(2b).
const K4_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const a of [1, 2, 3, 4, 6]) for (const b of [1, 2, 3, 4, 6, 8, 9, 12]) {
    const s = b / a, A = (a * a) / (2 * b);
    if (glatt(s, 4) && glatt(A, 4)) out.push({ a, b, s, A });
  }
  return out;
});
function k4Werte(v) {
  const { a, b } = v;
  return { kehr: a === b ? NaN : a / b, nurF: (a * a) / b, plus: (3 * a * a) / (2 * b), neg: -v.A };
}
function generateK4() {
  const k = ohneFeldKollision(K4_KANDIDATEN(), (v) => { const w = k4Werte(v); return [[v.s, w.kehr], [v.A, w.nurF, w.plus, w.neg]]; }, EPS);
  const { a, b, s, A } = k;
  const w = k4Werte(k);
  const ft = bruch(num(a), "x²"), gt = bruch(num(b), "x³");
  return {
    promptHtml: `Gegeben sind f(x) = ${ft} und g(x) = ${gt}. Für x &gt; 0 schneiden sich die Graphen in genau einem Punkt S. Rechts von S schließen sie eine nach rechts unbegrenzte Fläche ein.<br><strong>Bestimme die Schnittstelle x<sub>S</sub> und den Inhalt A dieser Fläche.</strong>` + ZAHL,
    felder: [
      { name: "x<sub>S</sub> =", soll: s, toleranz: TOL, hinweis: (roh, v) => (nahe(v, w.kehr, TOL) ? `Umgedreht: Aus ${kx(a, "x³")} = ${kx(b, "x²")} folgt x = ${bruch(num(b), num(a))}.` : "Setze f(x) = g(x) und multipliziere mit x³.") },
      { name: "A =", soll: A, toleranz: TOL, hinweis: (roh, v) => (nahe(v, w.nurF, TOL) ? "Das ist nur die Fläche unter f. Die Fläche unter g muss noch abgezogen werden." : nahe(v, w.plus, TOL) ? "Vorzeichen: Die Stammfunktion von −b/x³ ist +b/(2x²), nicht −b/(2x²)." : nahe(v, w.neg, TOL) ? "Rechts von S liegt f über g — integriere f − g, nicht g − f." : `A = ${intZ("x<sub>S</sub>", "∞")} (f(x) − g(x)) dx: erst bis z rechnen, dann z → ∞.`) },
    ],
    tipps: [`f(x) = g(x) ⟺ ${kx(a)} = ${num(b)} (für x &gt; 0)`, `Stammfunktion von f − g: −${bruch(num(a), "x")} + ${bruch(num(b), "2x²")}`],
    musterloesungHtml: `${ft} = ${gt} ⟺ ${kx(a, "x³")} = ${kx(b, "x²")} ⟺ <strong>x<sub>S</sub> = ${num(s)}</strong> (x &gt; 0); für x &gt; ${num(s)} ist f(x) − g(x) = ${bruch(`${kx(a)} − ${num(b)}`, "x³")} &gt; 0.<br>` +
      `${intZ(num(s), "z")} (f(x) − g(x)) dx = ${klammer(`−${bruch(num(a), "x")} + ${bruch(num(b), "2x²")}`, num(s), "z")} → 0 − (−${bruch(num(a), num(s))} + ${bruch(num(b), `2 · ${numK(s)}²`)}) für z → ∞<br>` +
      `<strong>A = ${num(A)}</strong> = ${bruch("a²", "2b")}`,
  };
}


// ---------- E4: uneigentliches Integral in zwei Schritten ----------
const E4_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const c of [1, 2, 3, 4, 5, 6, 8]) for (const b of [2, 4, 5, 10]) {
    const I = c * (1 - 1 / b);
    if (glatt(I, 4)) out.push({ c, b, I });
  }
  return out;
});
function generateE4() {
  const k = ohneFeldKollision(E4_KANDIDATEN(), (v) => [[v.I, -v.c / v.b, -v.I], [v.c, v.I, 0]], EPS);
  const { c, b, I } = k;
  const ft = bruch(num(c), "x²");
  return {
    promptHtml: `<strong>Berechne ${intZ("1", "b")} ${ft} dx für b = ${num(b)} und den Grenzwert für b → ∞.</strong>` + ZAHL,
    felder: [
      { name: `für b = ${num(b)}:`, soll: I, toleranz: TOL, hinweis: (roh, v) => (nahe(v, -c / b, TOL) ? "Das ist nur F(b). Die untere Grenze 1 zählt mit: F(b) − F(1)." : nahe(v, -I, TOL) ? `Vorzeichen: Die Stammfunktion von ${ft} ist −${bruch(num(c), "x")}; F(b) − F(1) = −${bruch(num(c), "b")} + ${num(c)}.` : `Stammfunktion F(x) = −${bruch(num(c), "x")}, dann F(${num(b)}) − F(1).`) },
      { name: "Grenzwert:", soll: c, toleranz: TOL, hinweis: (roh, v) => (nahe(v, I, TOL) ? `Das ist der Wert für b = ${num(b)}. Für b → ∞ geht ${bruch(num(c), "b")} gegen 0.` : nahe(v, 0, TOL) ? "Der Integrand geht gegen 0, das Integral aber nicht: Es nähert sich der Fläche der ganzen unbegrenzten Fläche." : `${num(c)} − ${bruch(num(c), "b")} für b → ∞.`) },
    ],
    tipps: [`F(x) = −${bruch(num(c), "x")}`, `${intZ("1", "b")} ${ft} dx = ${num(c)} − ${bruch(num(c), "b")}`],
    musterloesungHtml: `${intZ("1", "b")} ${ft} dx = ${klammer(`−${bruch(num(c), "x")}`, "1", "b")} = −${bruch(num(c), "b")} + ${num(c)}<br>` +
      `b = ${num(b)}: <strong>${num(c)} − ${num(c / b)} = ${num(I)}</strong>; für b → ∞ geht ${bruch(num(c), "b")} → 0, also <strong>${intZ("1", "∞")} ${ft} dx = ${num(c)}</strong> (konvergent).`,
  };
}

// ---------- M4: Polstelle am Rand ----------
const M4_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const c of [1, 2, 3, 0.5, 1.5, 4]) for (const a of [1, 4, 9, 16, 25, 0.25]) {
    const I = 2 * c * Math.sqrt(a);
    if (glatt(I, 4)) out.push({ c, a, I });
  }
  return out;
});
function m4Werte(v) {
  const { c, a } = v;
  return { ohne2: c * Math.sqrt(a), abl: -c / (2 * a * Math.sqrt(a)), abEins: a === 1 ? NaN : 2 * c * (Math.sqrt(a) - 1) };
}
function generateM4() {
  const k = ohneKollision(M4_KANDIDATEN(), (v) => { const w = m4Werte(v); return [v.I, w.ohne2, w.abl, w.abEins]; }, EPS);
  const { c, a, I } = k;
  const w = m4Werte(k);
  const ft = bruch(num(c), "√x");
  return {
    promptHtml: `Der Integrand ${ft} ist bei x = 0 nicht definiert und wächst dort über alle Grenzen.<br><strong>Berechne das uneigentliche Integral ${intZ("0", num(a))} ${ft} dx.</strong>` + ZAHL,
    correct: I,
    tolerance: TOL,
    placeholder: "Integral",
    hinweis: (roh, v) => {
      if (nahe(v, w.ohne2, TOL)) return "Der Faktor 2 fehlt: x<sup>−½</sup> hat die Stammfunktion x<sup>½</sup> : ½ = 2√x.";
      if (nahe(v, w.abl, TOL)) return "Das ist die Ableitung des Integranden, nicht eine Stammfunktion.";
      if (nahe(v, w.abEins, TOL)) return "Die untere Grenze ist 0, nicht 1: ε → 0 einsetzen, nicht 1.";
      return `Ersetze 0 durch ε: ${intZ("ε", num(a))} ${ft} dx, integrieren, dann ε → 0.`;
    },
    tipps: [`${ft} = ${vor(c)}x<sup>−½</sup>; Stammfunktion F(x) = ${faktor(2 * c)}√x`, "Polstelle bei 0: erst bis ε rechnen, dann ε → 0."],
    musterloesungHtml: `${intZ("ε", num(a))} ${ft} dx = ${klammer(`${faktor(2 * c)}√x`, "ε", num(a))} = ${vor(2 * c)}${num(Math.sqrt(a))} − ${faktor(2 * c)}√ε = ${num(I)} − ${faktor(2 * c)}√ε<br>` +
      `Für ε → 0 geht √ε → 0: <strong>${intZ("0", num(a))} ${ft} dx = ${num(I)}</strong> — die Fläche ist endlich, obwohl der Graph bei 0 unbegrenzt steigt.`,
  };
}

// ---------- S5: unendlich langer Rotationskörper ----------
const S5_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const c of [1, 2, 3, 4, 5, 6, 8, 0.5]) for (const a of [1, 2, 3, 4, 5, 0.5, 0.25]) {
    const V = (c * c) / a;
    if (glatt(V, 4)) out.push({ c, a, V });
  }
  return out;
});
function generateS5() {
  const k = ohneKollision(S5_KANDIDATEN(), (v) => [v.V, v.c / v.a, (v.c * v.c) / (v.a * v.a), v.V * Math.PI], EPS);
  const { c, a, V } = k;
  const ft = bruch(num(c), "x");
  return {
    promptHtml: `Der Graph von f(x) = ${ft} rotiert über [${num(a)}; ∞) um die x-Achse. Es entsteht ein unendlich langer Trichter.<br><strong>Berechne sein Volumen V.</strong>` + PI_FAKTOR,
    correct: V,
    tolerance: TOL,
    placeholder: "V : π",
    hinweis: (roh, v) => {
      if (nahe(v, c / a, TOL)) return `Quadriert wurde nicht: V = π ∫ (f(x))² dx mit (f(x))² = ${bruch(num(c * c), "x²")}.`;
      if (nahe(v, (c * c) / (a * a), TOL)) return `Die Stammfunktion von ${bruch(num(c * c), "x²")} ist −${bruch(num(c * c), "x")}, nicht −${bruch(num(c * c), "x²")}.`;
      if (nahe(v, V * Math.PI, 0.001)) return "Das ist V als Dezimalzahl. Gefragt ist nur der Faktor vor π.";
      return `V = π · ${intZ(num(a), "∞")} ${bruch(num(c * c), "x²")} dx: erst bis b rechnen, dann b → ∞.`;
    },
    tipps: [`(f(x))² = ${bruch(num(c * c), "x²")}`, `π · ${intZ(num(a), "b")} ${bruch(num(c * c), "x²")} dx = π · (${bruch(num(c * c), num(a))} − ${bruch(num(c * c), "b")})`],
    musterloesungHtml: `V = π · ${intZ(num(a), "b")} ${bruch(num(c * c), "x²")} dx = π · ${klammer(`−${bruch(num(c * c), "x")}`, num(a), "b")} = π · (${bruch(num(c * c), num(a))} − ${bruch(num(c * c), "b")})<br>` +
      `Für b → ∞: <strong>V = ${num(V)}π</strong> ≈ ${num(V * Math.PI, 2)} — endlich, obwohl der Trichter unendlich lang ist.`,
  };
}

// ---------- K5: Grenze aus einer unbegrenzten Fläche ----------
const K5_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const a of [0.5, 1, 2, 3, 4, 5]) for (const c of [2, 4, 6, 8, 10, 16, 18]) {
    const A = c / (2 * a * a);
    if (glatt(A, 4)) out.push({ a, c, A });
  }
  return out;
});
function k5Werte(v) {
  const { a, c, A } = v;
  return { quadrat: a === 1 ? NaN : a * a, ohneHalb: Math.sqrt(c / A), exponent: Math.pow(c / (4 * A), 0.25) };
}
function generateK5() {
  const kd = ohneKollision(K5_KANDIDATEN(), (v) => { const w = k5Werte(v); return [v.a, w.quadrat, w.ohneHalb, w.exponent]; }, EPS);
  const { a, c, A } = kd;
  const w = k5Werte(kd);
  const ft = bruch(num(c), "x³");
  return {
    promptHtml: `Die Fläche zwischen dem Graphen von f(x) = ${ft}, der x-Achse und der Geraden x = a (a &gt; 0) reicht nach rechts ins Unendliche. Ihr Inhalt ist ${num(A)}.<br><strong>Bestimme a.</strong>` + ZAHL,
    correct: a,
    tolerance: TOL,
    placeholder: "a",
    hinweis: (roh, v) => {
      if (nahe(v, w.quadrat, TOL)) return "Das ist a². Zum Schluss fehlt die Wurzel.";
      if (nahe(v, w.ohneHalb, TOL)) return `Der Faktor ½ fehlt: Die Stammfunktion von ${ft} ist −${bruch(num(c), "2x²")}.`;
      if (nahe(v, w.exponent, TOL)) return `Potenzregel mit dem falschen Exponenten: x<sup>−3</sup> wird zu x<sup>−2</sup> : (−2), nicht zu x<sup>−4</sup>.`;
      return `${intZ("a", "∞")} ${ft} dx = ${bruch(num(c), "2a²")}; setze das gleich ${num(A)}.`;
    },
    tipps: [`${intZ("a", "b")} ${ft} dx = ${bruch(num(c), "2a²")} − ${bruch(num(c), "2b²")}`, `Für b → ∞: ${bruch(num(c), "2a²")} = ${num(A)}`],
    musterloesungHtml: `${intZ("a", "b")} ${ft} dx = ${klammer(`−${bruch(num(c), "2x²")}`, "a", "b")} = ${bruch(num(c), "2a²")} − ${bruch(num(c), "2b²")} → ${bruch(num(c), "2a²")} für b → ∞<br>` +
      `${bruch(num(c), "2a²")} = ${num(A)} ⟺ a² = ${num(a * a)} ⟺ <strong>a = ${num(a)}</strong> (a &gt; 0)<br><strong>Probe:</strong> ${bruch(num(c), `2 · ${numK(a)}²`)} = ${num(A)} ✓`,
  };
}

// ================= Helfer für e-Funktionen =================

const eh = (e) => `e<sup>${e}</sup>`;
// k · x ohne „1x“: kx(−1) = „−x“, kx(0,5, "t") = „0,5t“.
function kx(k, v = "x") {
  return k === 1 ? v : k === -1 ? `−${v}` : `${num(k)}${v}`;
}
// Ein Vorfaktor ohne „1“: faktor(−1) = „−“, faktor(0,5) = „0,5“.
function faktor(a) {
  return a === 1 ? "" : a === -1 ? "−" : num(a);
}
// a · e^(kx) als Text: ae(3, 2) = „3e^(2x)“.
function ae(a, k, v = "x") {
  return `${faktor(a)}${eh(kx(k, v))}`;
}
// Ein Vorfaktor vor einem Produkt oder einer Klammer: „“, „−“ oder „2 · “.
function vor(a) {
  return a === 1 ? "" : a === -1 ? "−" : `${num(a)} · `;
}
// a/k als Bruch, wo er nicht abbricht (2/3 bleibt 2/3), sonst als Dezimalzahl; Vorzeichen davor.
function quot(a, k) {
  const w = a / k;
  if (glatt(w, 4)) return num(w);
  return (w < 0 ? "−" : "") + bruch(num(Math.abs(a)), num(Math.abs(k)));
}
// a/k als Vorfaktor vor einem Produkt: „“, „−“ oder „0,5 · “ — nie „1 ·“ oder „−1 ·“.
function vorQ(a, k) {
  const w = quot(a, k);
  return w === "1" ? "" : w === "−1" ? "−" : `${w} · `;
}
const GERUNDET = `<br><span class="progress-note">Gib das Ergebnis auf vier Nachkommastellen gerundet ein (Komma als Dezimalzeichen).</span>`;

// ================= einfach =================

// ---------- E1: ∫₀ᵇ a · e^(kx) dx ----------
// F(x) = a/k · e^(kx), also ∫₀ᵇ = a/k · (e^(kb) − 1). Fehlerbilder: mit k multipliziert statt geteilt
// (die Ableitungsregel), F(0) vergessen (e⁰ = 1, nicht 0) und ohne den Faktor 1/k gerechnet — bei
// |k| = 1 fällt das letzte mit der Lösung oder ihrem Gegenwert zusammen, dort NaN.
const E1_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const a of [1, 2, 3, 4, 6, -2]) for (const k of [1, 2, 0.5, -1, -2, -0.5, 3]) for (const b of [1, 2, 0.5, 3]) {
    const I = (a / k) * (Math.exp(k * b) - 1);
    if (Math.abs(I) > 2000) continue;
    out.push({ a, k, b, I, malK: a * k * (Math.exp(k * b) - 1), ohneF0: (a / k) * Math.exp(k * b), ohneK: Math.abs(k) === 1 ? NaN : a * (Math.exp(k * b) - 1) });
  }
  return out;
});
function generateE1() {
  const v = ohneKollision(E1_KANDIDATEN(), (w) => [w.I, w.malK, w.ohneF0, w.ohneK], EPS);
  const { a, k, b, I } = v;
  const f = ae(a, k), F = `${vorQ(a, k)}${eh(kx(k))}`;
  return {
    promptHtml: `<strong>Berechne ${intZ("0", num(b))} ${f} dx.</strong>` + GERUNDET,
    correct: I,
    tolerance: TOL,
    placeholder: "Integral",
    hinweis: (roh, z) => {
      if (nahe(z, v.malK, TOL)) return `Mit ${num(k)} multipliziert statt geteilt: Das ist die Ableitungsregel. Beim Integrieren gilt ∫ ${eh("kx")} dx = ${bruch("1", "k")} · ${eh("kx")} — Probe: (${bruch("1", "k")} · ${eh("kx")})′ = ${eh("kx")}.`;
      if (nahe(z, v.ohneF0, TOL)) return `F(0) fehlt: e⁰ = 1, nicht 0. Von F(${num(b)}) ist noch F(0) = ${quot(a, k)} abzuziehen.`;
      if (nahe(z, v.ohneK, TOL)) return `Der Faktor ${bruch("1", num(k))} fehlt: ${eh(kx(k))} hat nicht sich selbst als Stammfunktion, sondern ${bruch("1", num(k))} · ${eh(kx(k))}.`;
      return `Stammfunktion: F(x) = ${F}. Dann F(${num(b)}) − F(0).`;
    },
    tipps: [`∫ ${eh("kx")} dx = ${bruch("1", "k")} · ${eh("kx")} + C`, `F(x) = ${F}; F(0) = ${quot(a, k)}, denn e⁰ = 1.`],
    musterloesungHtml: `F(x) = ${F}, denn F′(x) = ${vorQ(a, k)}${numK(k)} · ${eh(kx(k))} = ${f} ✓<br>` +
      `${intZ("0", num(b))} ${f} dx = ${klammer(F, "0", num(b))} = ${vorQ(a, k)}(${eh(num(k * b))} − e⁰) = ${vorQ(a, k)}(${eh(num(k * b))} − 1) ≈ <strong>${num(I)}</strong>`,
  };
}

// ---------- E3: ∫ c/x dx mit Grenzen eᵐ und eⁿ ----------
// Die Grenzen sind Potenzen von e, damit ln sie exakt trifft: ∫ = c · (n − m). Fehlerbilder: der
// Faktor c fehlt, nur ln(b) gerechnet (untere Grenze vergessen), mit der Stammfunktion von 1/x²
// gerechnet (−1/x statt ln x).
const E_GRENZE = new Map([[0, "1"], [0.5, "√e"], [1, "e"], [2, "e²"], [3, "e³"]]);
const E3_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const c of [1, 2, 3, 4, 5, 0.5]) for (const m of [0, 0.5, 1, 2]) for (const n of [0.5, 1, 2, 3]) {
    if (n <= m) continue;
    out.push({ c, m, n, I: c * (n - m), ohneC: c === 1 ? NaN : n - m, ohneUnten: m === 0 ? NaN : c * n, kehr: c * (Math.exp(-m) - Math.exp(-n)) });
  }
  return out;
});
function generateE3() {
  const v = ohneKollision(E3_KANDIDATEN(), (w) => [w.I, w.ohneC, w.ohneUnten, w.kehr], EPS);
  const { c, m, n, I } = v;
  const a = E_GRENZE.get(m), b = E_GRENZE.get(n), f = bruch(num(c), "x");
  const lnA = m === 0 ? "ln(1)" : `ln(${a})`;
  return {
    promptHtml: `<strong>Berechne ${intZ(a, b)} ${f} dx.</strong>` + ZAHL,
    correct: I,
    tolerance: TOL,
    placeholder: "Integral",
    hinweis: (roh, z) => {
      if (nahe(z, v.ohneC, TOL)) return `Der Faktor ${num(c)} fehlt: ${f} = ${num(c)} · ${bruch("1", "x")} hat die Stammfunktion ${num(c)} · ln(x).`;
      if (nahe(z, v.ohneUnten, TOL)) return `Die untere Grenze fehlt: ln(${a}) = ${num(m)} ist nicht 0 — nur ln(1) ist 0.`;
      if (nahe(z, v.kehr, TOL)) return `Das ist die Rechnung für ${bruch(num(c), "x²")}. Die Stammfunktion von ${bruch("1", "x")} ist ln(x), nicht −${bruch("1", "x")}.`;
      return `Stammfunktion: F(x) = ${vor(c)}ln(x) (für x &gt; 0); ln(eⁿ) = n.`;
    },
    tipps: ["∫ 1/x dx = ln|x| + C — für x &gt; 0 also ln(x).", `ln(${b}) = ${num(n)}${m === 0 ? ", ln(1) = 0" : `, ln(${a}) = ${num(m)}`}`],
    musterloesungHtml: `${intZ(a, b)} ${f} dx = ${klammer(`${vor(c)}ln(x)`, a, b)} = ${vor(c)}(ln(${b}) − ${lnA}) = ${vor(c)}(${num(n)} − ${num(m)}) = <strong>${num(I)}</strong>`,
  };
}

// ---------- E5: Stammfunktion mit e durch einen Punkt ----------
// f(x) = a · e^(kx), F(x) = a/k · e^(kx) + C mit F(0) = y₀ ⟹ C = y₀ − a/k; dann F(1) gerundet.
// Fehlerbilder bei C: mit k multipliziert, e⁰ als 0 genommen (C = y₀), Vorzeichen; bei F(1): C vergessen.
const E5_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const a of [1, 2, 3, 4, 6, -2]) for (const k of [1, 2, 0.5, -1, -2, -0.5]) for (const y0 of [0, 1, 2, 3, 5, -1]) {
    const C = y0 - a / k;
    if (!glatt(C, 4)) continue;
    out.push({ a, k, y0, C, F1: (a / k) * Math.exp(k) + C, malK: y0 - a * k, ohneE: y0, vorz: y0 + a / k, ohneC: (a / k) * Math.exp(k) });
  }
  return out;
});
function generateE5() {
  const v = ohneFeldKollision(E5_KANDIDATEN(), (w) => [[w.C, w.malK, w.ohneE, w.vorz], [w.F1, w.ohneC]], EPS);
  const { a, k, y0, C, F1 } = v;
  const f = ae(a, k), Fk = `${vorQ(a, k)}${eh(kx(k))}`;
  return {
    promptHtml: `Gegeben ist f(x) = ${f}. Gesucht ist die Stammfunktion F von f, deren Graph durch P(0 | ${num(y0)}) geht.<br><strong>Bestimme die Konstante C in F(x) = … + C und den Funktionswert F(1).</strong>` + GERUNDET,
    felder: [
      { name: "C =", soll: C, toleranz: TOL, hinweis: (roh, z) => (nahe(z, v.malK, TOL) ? `Mit ${num(k)} multipliziert statt geteilt: Die Stammfunktion von ${f} ist ${Fk}.` : nahe(z, v.ohneE, TOL) ? `e⁰ = 1, nicht 0: F(0) = ${quot(a, k)} + C.` : nahe(z, v.vorz, TOL) ? `Vorzeichen: Aus ${quot(a, k)} + C = ${num(y0)} folgt C = ${num(y0)} − ${numK(a / k)}.` : `Setze F(0) = ${num(y0)} ein; e⁰ = 1.`) },
      { name: "F(1) =", soll: F1, toleranz: TOL, hinweis: (roh, z) => (nahe(z, v.ohneC, TOL) ? "Die Konstante C fehlt — ohne sie geht der Graph nicht durch P." : `F(1) = ${vorQ(a, k)}${eh(num(k))} + C.`) },
    ],
    tipps: [`F(x) = ${Fk} + C`, `F(0) = ${vorQ(a, k)}e⁰ + C = ${quot(a, k)} + C`],
    musterloesungHtml: `F(x) = ${Fk} + C, denn (${Fk})′ = ${f}.<br>` +
      `F(0) = ${num(y0)} ⟺ ${quot(a, k)} + C = ${num(y0)} ⟺ <strong>C = ${num(C)}</strong><br>` +
      `F(1) = ${vorQ(a, k)}${eh(num(k))}${C === 0 ? "" : " " + plusMinus(C)} ≈ <strong>${num(F1)}</strong>`,
  };
}

// ================= mittel =================

// ---------- M1: Stammfunktion per Ansatz (px + q) · e^(kx) ----------
// Ansatz F(x) = (Ax + B) · e^(kx): F′(x) = (kAx + A + kB) · e^(kx). Koeffizientenvergleich mit px + q:
// kA = p und A + kB = q, also A = p/k und B = (q − A)/k. Fehlerbilder: A = p · k (Ableitungsregel),
// A = p (e^(kx) ohne Teilen; bei k = 1 die Lösung, dort NaN), B = q/k (der Summand A aus der
// Produktregel fehlt), B = (q + A)/k (Vorzeichen).
const M1_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const p of [1, 2, 3, 4, -1, -2]) for (const q of [0, 1, 2, -1, 3, -3, 4]) for (const k of [1, -1, 2, -2, 0.5, -0.5]) {
    const A = p / k, B = (q - A) / k;
    if (!glatt(A, 4) || !glatt(B, 4) || Math.abs(B) < 1e-12) continue;
    out.push({ p, q, k, A, B, malK: Math.abs(k) === 1 ? NaN : p * k, ohneK: k === 1 ? NaN : p, ohneA: q / k, vorz: (q + A) / k });
  }
  return out;
});
function generateM1() {
  const v = ohneFeldKollision(M1_KANDIDATEN(), (w) => [[w.A, w.malK, w.ohneK], [w.B, w.ohneA, w.vorz]], EPS);
  const { p, q, k, A, B } = v;
  const P = poly([[p, "x"], [q, ""]]), e = eh(kx(k));
  const Pf = /[+−] /.test(P) ? `(${P})` : P;
  // k · A und „A + k · B“ ohne „1A“ und „+ −“; der Faktor k · e^(kx) in Klammern, wenn er negativ ist.
  const kA = kx(k, "A"), AkB = `A ${k < 0 ? "−" : "+"} ${kx(Math.abs(k), "B")}`, kE = k < 0 ? `(${ae(k, k)})` : ae(k, k);
  return {
    promptHtml: `Gegeben ist f(x) = ${Pf} · ${e}. Eine Stammfunktion hat die Form F(x) = (Ax + B) · ${e}.<br><strong>Bestimme A und B.</strong>` + ZAHL,
    felder: [
      { name: "A =", soll: A, toleranz: TOL, hinweis: (roh, z) => (nahe(z, v.malK, TOL) ? `Mit ${num(k)} multipliziert statt geteilt. Leite F mit der Produktregel ab: Vor dem x steht dann ${kA} — und das muss ${num(p)} sein.` : nahe(z, v.ohneK, TOL) ? `Beim Ableiten von ${e} kommt der Faktor ${num(k)} dazu: Vor dem x in F′ steht ${kA}, nicht A.` : "Leite den Ansatz mit der Produktregel ab, klammere " + e + " aus und vergleiche die Koeffizienten mit f.") },
      { name: "B =", soll: B, toleranz: TOL, hinweis: (roh, z) => (nahe(z, v.ohneA, TOL) ? `Der Summand A fehlt: Die Produktregel liefert (Ax + B)′ · ${e} = A · ${e} — das konstante Glied von F′ ist ${AkB}.` : nahe(z, v.vorz, TOL) ? `Vorzeichen: Aus ${AkB} = ${num(q)} folgt ${kx(k, "B")} = ${num(q)} − A.` : `Das konstante Glied von F′ ist ${AkB}; es muss ${num(q)} sein.`) },
    ],
    tipps: [`F′(x) = A · ${e} + (Ax + B) · ${kE} = (${kA}x + ${AkB}) · ${e}`, `Vergleich mit ${P}: ${kA} = ${num(p)} und ${AkB} = ${num(q)}`],
    musterloesungHtml: `F′(x) = A · ${e} + (Ax + B) · ${kE} = (${kA}x + ${AkB}) · ${e} — ${e} ausgeklammert.<br>` +
      `Koeffizientenvergleich mit ${P}: ${kA} = ${num(p)} ⟹ <strong>A = ${num(A)}</strong>; ${num(A)} ${k < 0 ? "−" : "+"} ${kx(Math.abs(k), "B")} = ${num(q)} ⟹ <strong>B = ${num(B)}</strong><br>` +
      `F(x) = (${poly([[A, "x"], [B, ""]])}) · ${e}<br><strong>Probe:</strong> F′(x) = (${poly([[k * A, "x"], [A + k * B, ""]])}) · ${e} = f(x) ✓`,
  };
}

// ---------- M2: Zufluss mit abklingender Rate ----------
// r(t) = a · e^(−kt): B(T) = B₀ + a/k · (1 − e^(−kT)) und B(t) → B₀ + a/k für t → ∞.
// Fehlerbilder bei B(T): F(0) vergessen, mit k multipliziert, B₀ vergessen; beim Grenzwert: nur B₀
// („die Rate geht gegen 0“), nur a/k (B₀ vergessen), mit k multipliziert.
const M2_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const a of [2, 5, 10, 20, 40]) for (const k of [0.1, 0.2, 0.25, 0.5, 1, 0.05]) for (const B0 of [10, 50, 100, 200]) for (const T of [2, 5, 10]) {
    const L = B0 + a / k;
    if (!glatt(L, 4) || a / k > 1000) continue;
    const q = Math.exp(-k * T);
    out.push({ a, k, B0, T, BT: B0 + (a / k) * (1 - q), L, ohneF0: B0 - (a / k) * q, malK: B0 + a * k * (1 - q), ohneB0: (a / k) * (1 - q), nurB0: B0, nurAk: a / k, LmalK: B0 + a * k });
  }
  return out;
});
function generateM2() {
  const v = ohneFeldKollision(M2_KANDIDATEN(), (w) => [[w.BT, w.ohneF0, w.malK, w.ohneB0], [w.L, w.nurB0, w.nurAk, w.LmalK]], EPS);
  const { a, k, B0, T, BT, L } = v;
  const e = eh(kx(-k, "t"));
  return {
    promptHtml: `In einen Tank, in dem ${num(B0)} m³ Wasser sind, fließt Wasser mit der Rate r(t) = ${num(a)} · ${e} (t in Stunden, r(t) in m³ pro Stunde).<br><strong>Wie viel Wasser ist nach ${num(T)} Stunden im Tank, und welchem Wert nähert sich die Wassermenge auf lange Sicht?</strong>` + GERUNDET,
    felder: [
      { name: `B(${num(T)}) =`, soll: BT, toleranz: TOL, hinweis: (roh, z) => (nahe(z, v.ohneF0, TOL) ? `Die untere Grenze fehlt: F(0) = −${num(a / k)}, denn e⁰ = 1. Zugeflossen ist F(${num(T)}) − F(0).` : nahe(z, v.malK, TOL) ? `Mit ${num(k)} multipliziert statt geteilt: Die Stammfunktion von ${num(a)} · ${e} ist −${num(a / k)} · ${e}.` : nahe(z, v.ohneB0, TOL) ? `Das ist nur der Zufluss. Die ${num(B0)} m³ vom Anfang kommen dazu.` : `B(T) = ${num(B0)} + ${intZ("0", "T")} r(t) dt.`) },
      { name: "Grenzwert:", soll: L, toleranz: TOL, hinweis: (roh, z) => (nahe(z, v.nurB0, TOL) ? "Die Rate geht gegen 0 — aber bis dahin fließt noch Wasser zu. Der Bestand wächst weiter, nur immer langsamer." : nahe(z, v.nurAk, TOL) ? `Das ist der gesamte Zufluss. Die ${num(B0)} m³ vom Anfang kommen dazu.` : nahe(z, v.LmalK, TOL) ? `Mit ${num(k)} multipliziert statt geteilt: Der gesamte Zufluss ist ${bruch(num(a), num(k))}.` : `Für t → ∞ geht ${e} → 0.`) },
    ],
    tipps: [`B(t) = ${num(B0)} + ${intZ("0", "t")} ${num(a)} · ${eh(kx(-k, "s"))} ds; Stammfunktion von ${num(a)} · ${e}: −${num(a / k)} · ${e}`, `B(t) = ${num(B0)} + ${num(a / k)} · (1 − ${e})`],
    musterloesungHtml: `${intZ("0", "t")} ${num(a)} · ${eh(kx(-k, "s"))} ds = ${klammer(`−${num(a / k)} · ${eh(kx(-k, "s"))}`, "0", "t")} = −${num(a / k)} · ${e} + ${num(a / k)} = ${num(a / k)} · (1 − ${e})<br>` +
      `B(${num(T)}) = ${num(B0)} + ${num(a / k)} · (1 − ${eh(num(-k * T))}) ≈ <strong>${num(BT)} m³</strong><br>` +
      `Für t → ∞ geht ${e} → 0: B(t) → ${num(B0)} + ${num(a / k)} = <strong>${num(L)} m³</strong> — obwohl immer noch Wasser fließt, bleibt die Menge unter diesem Wert.`,
  };
}

// ---------- M5: obere Grenze aus der Fläche unter c/x ----------
// c · ln(b) = A ⟹ b = e^(A/c). Fehlerbilder: A/c (das ist ln b), e^A (Faktor c vergessen), e^(A · c).
const M5_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const c of [1, 2, 3, 4, 0.5]) for (const A of [1, 2, 3, 0.5, 1.5, 4]) {
    if (A / c > 4 || A * c > 8) continue;
    out.push({ c, A, b: Math.exp(A / c), lnB: A / c, ohneC: c === 1 ? NaN : Math.exp(A), malC: c === 1 ? NaN : Math.exp(A * c) });
  }
  return out;
});
function generateM5() {
  const v = ohneKollision(M5_KANDIDATEN(), (w) => [w.b, w.lnB, w.ohneC, w.malC], EPS);
  const { c, A, b } = v;
  const f = bruch(num(c), "x");
  return {
    promptHtml: `Die Fläche zwischen dem Graphen von f(x) = ${f}, der x-Achse und den Geraden x = 1 und x = b (b &gt; 1) hat den Inhalt ${num(A)}.<br><strong>Bestimme b.</strong>` + GERUNDET,
    correct: b,
    tolerance: TOL,
    placeholder: "b",
    hinweis: (roh, z) => {
      if (nahe(z, v.lnB, TOL)) return `Das ist ln(b). Zum Schluss fehlt noch: b = e<sup>${num(A / c)}</sup>.`;
      if (nahe(z, v.ohneC, TOL)) return `Der Faktor ${num(c)} fehlt: Die Fläche ist ${num(c)} · ln(b).`;
      if (nahe(z, v.malC, TOL)) return `Mit ${num(c)} multipliziert statt geteilt: Aus ${num(c)} · ln(b) = ${num(A)} folgt ln(b) = ${bruch(num(A), num(c))}.`;
      return `${intZ("1", "b")} ${f} dx = ${vor(c)}ln(b); setze das gleich ${num(A)}.`;
    },
    tipps: [`${intZ("1", "b")} ${f} dx = ${vor(c)}(ln(b) − ln(1)) = ${vor(c)}ln(b)`, "ln(b) = z ⟺ b = e<sup>z</sup>"],
    musterloesungHtml: `${intZ("1", "b")} ${f} dx = ${klammer(`${vor(c)}ln(x)`, "1", "b")} = ${vor(c)}ln(b), denn ln(1) = 0.<br>` +
      `${vor(c)}ln(b) = ${num(A)} ⟺ ln(b) = ${num(A / c)} ⟺ <strong>b = e<sup>${num(A / c)}</sup> ≈ ${num(b)}</strong><br><strong>Probe:</strong> ${vor(c)}ln(${num(b)}) ≈ ${num(c * Math.log(Number(num(b).replace(",", "."))), 3)} ✓`,
  };
}

// ================= schwierig =================

// ---------- S1: Fläche unter a · x · e^(−kx) mit dem Ansatz ----------
// F(x) = −a/k · (x + 1/k) · e^(−kx); A = F(b) − F(0) = a/k² · (1 − (1 + kb) · e^(−kb)). f ≥ 0 auf [0; b].
// Fehlerbilder: „Produktregel rückwärts“ (x²/2 · e^(−kx) mal a, ohne Teilen), F(0) vergessen, und der
// Ansatz ohne den Summanden aus der Produktregel (F = −a/k · x · e^(−kx)).
const S1_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const a of [1, 2, 3, 4]) for (const k of [1, 0.5, 2]) for (const b of [1, 2, 3, 4]) {
    const F = (x) => (-a / k) * (x + 1 / k) * Math.exp(-k * x);
    const A = F(b) - F(0);
    out.push({ a, k, b, A, falschProdukt: ((a * b * b) / 2) * Math.exp(-k * b), ohneF0: F(b), ohneTeil: (-a / k) * b * Math.exp(-k * b) });
  }
  return out;
});
function generateS1() {
  const v = ohneKollision(S1_KANDIDATEN(), (w) => [w.A, w.falschProdukt, w.ohneF0, w.ohneTeil], EPS);
  const { a, k, b, A } = v;
  const e = eh(kx(-k)), A1 = -a / k, B1 = -a / (k * k);
  const Ft = `(${poly([[A1, "x"], [B1, ""]])}) · ${e}`;
  // −k · A und „A − k · B“ ohne „1A“ und „+ −“.
  const kA = kx(-k, "A"), AkB = `A − ${kx(k, "B")}`;
  return {
    promptHtml: `Gegeben ist f(x) = ${vor(a)}x · ${e}. Für x ≥ 0 verläuft der Graph oberhalb der x-Achse.<br><strong>Berechne den Inhalt der Fläche zwischen dem Graphen, der x-Achse und der Geraden x = ${num(b)}.</strong>` + GERUNDET,
    correct: A,
    tolerance: TOL,
    placeholder: "A",
    hinweis: (roh, z) => {
      if (nahe(z, v.falschProdukt, TOL)) return `Eine „Produktregel rückwärts“ gibt es nicht: (${bruch("x²", "2")} · ${e})′ ist nicht x · ${e}. Bestimme F mit dem Ansatz F(x) = (Ax + B) · ${e}.`;
      if (nahe(z, v.ohneF0, TOL)) return `F(0) fehlt: F(0) = ${num(B1)} ist nicht 0, weil die Klammer bei x = 0 den Wert B hat und e⁰ = 1.`;
      if (nahe(z, v.ohneTeil, TOL)) return `Im Ansatz fehlt B: Mit F(x) = A · x · ${e} bleibt beim Ableiten der Summand A · ${e} übrig. Setze F(x) = (Ax + B) · ${e} an.`;
      return `Ansatz F(x) = (Ax + B) · ${e}, ableiten, Koeffizienten vergleichen; dann F(${num(b)}) − F(0).`;
    },
    tipps: [`Ansatz F(x) = (Ax + B) · ${e}; F′(x) = (${kA}x + ${AkB}) · ${e}`, `F(x) = ${Ft}`],
    musterloesungHtml: `Ansatz F(x) = (Ax + B) · ${e}: F′(x) = (${kA}x + ${AkB}) · ${e}. Vergleich mit ${kx(a)}: ${kA} = ${num(a)}, ${AkB} = 0 ⟹ A = ${num(A1)}, B = ${num(B1)}.<br>` +
      `F(x) = ${Ft}<br>` +
      `A = F(${num(b)}) − F(0) = ${num((A1 * b + B1) * Math.exp(-k * b), 4)} − ${numK(B1)} ≈ <strong>${num(A)}</strong>`,
  };
}

// ---------- S2: Mittelwert einer e-Funktion ----------
// T(t) = c + d · e^(−kt) auf [0; b]: m = c + d/(kb) · (1 − e^(−kb)). Fehlerbilder: Mittel der beiden
// Randwerte, Integral ohne Teilen durch b, Funktionswert in der Intervallmitte.
const S2_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const c of [20, 18, 22]) for (const d of [60, 70, 50, 40]) for (const k of [0.1, 0.05, 0.2]) for (const b of [5, 10, 20]) {
    const f = (t) => c + d * Math.exp(-k * t);
    const I = c * b + (d / k) * (1 - Math.exp(-k * b));
    out.push({ c, d, k, b, m: I / b, rand: (f(0) + f(b)) / 2, integral: I, mitte: f(b / 2) });
  }
  return out;
});
function generateS2() {
  const v = ohneKollision(S2_KANDIDATEN(), (w) => [w.m, w.rand, w.integral, w.mitte], EPS);
  const { c, d, k, b, m } = v;
  const e = eh(kx(-k, "t"));
  return {
    promptHtml: `Eine Tasse Tee kühlt ab. Ihre Temperatur ist T(t) = ${num(c)} + ${num(d)} · ${e} (t in Minuten, T in °C).<br><strong>Berechne die mittlere Temperatur in den ersten ${num(b)} Minuten.</strong>` + GERUNDET,
    correct: m,
    tolerance: TOL,
    placeholder: "°C",
    hinweis: (roh, z) => {
      if (nahe(z, v.rand, TOL)) return "Das ist das Mittel der beiden Randwerte. Es stimmt nur für lineare Funktionen; die e-Funktion ist gekrümmt.";
      if (nahe(z, v.integral, TOL)) return `Das ist das Integral. Für den Mittelwert wird noch durch die Intervalllänge ${num(b)} geteilt.`;
      if (nahe(z, v.mitte, TOL)) return "Das ist die Temperatur in der Mitte des Intervalls — nicht der Mittelwert. Er folgt aus der Fläche unter dem Graphen.";
      return `m = ${bruch("1", num(b))} · ${intZ("0", num(b))} T(t) dt`;
    },
    tipps: [`m = ${bruch("1", "b − a")} · ${intZ("a", "b")} T(t) dt`, `Stammfunktion: ${num(c)}t − ${num(d / k)} · ${e}`],
    musterloesungHtml: `${intZ("0", num(b))} T(t) dt = ${klammer(`${num(c)}t − ${num(d / k)} · ${e}`, "0", num(b))} = ${num(c * b)} − ${num(d / k)} · ${eh(num(-k * b))} + ${num(d / k)} ≈ ${num(v.integral)}<br>` +
      `m = ${bruch("1", num(b))} · ${num(v.integral)} ≈ <strong>${num(m)} °C</strong>`,
  };
}

// ================= komplex =================

// ---------- K1: Größter Bestand bei abklingendem Zufluss und festem Abfluss ----------
// r(t) = a · e^(−kt) − c: Der Bestand ist am größten, wo r von + nach − wechselt: t* = ln(a/c)/k.
// B(t*) = B₀ + (a − c)/k − c · t*. Fehlerbilder bei t*: Bruch im ln verkehrt, mit k multipliziert;
// bei B: Abfluss vergessen, Anfangsbestand vergessen, Vorzeichen beim Abfluss.
const K1_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const a of [10, 20, 40, 30]) for (const c of [2, 4, 5, 8]) for (const k of [0.1, 0.2, 0.5, 0.25]) for (const B0 of [100, 200, 50]) {
    if (a <= c) continue;
    const ts = Math.log(a / c) / k, zu = (a - c) / k;
    out.push({ a, c, k, B0, ts, B: B0 + zu - c * ts, verkehrt: Math.log(c / a) / k, malK: Math.log(a / c) * k, ohneAb: B0 + zu, ohneB0: zu - c * ts, vorz: B0 + zu + c * ts });
  }
  return out;
});
function generateK1() {
  const v = ohneFeldKollision(K1_KANDIDATEN(), (w) => [[w.ts, w.verkehrt, w.malK], [w.B, w.ohneAb, w.ohneB0, w.vorz]], EPS);
  const { a, c, k, B0, ts, B } = v;
  const e = eh(kx(-k, "t"));
  return {
    promptHtml: `In ein Becken mit ${num(B0)} m³ Wasser fließt Wasser mit der Rate ${num(a)} · ${e} zu; gleichzeitig werden ständig ${num(c)} m³ pro Stunde abgepumpt (t in Stunden).<br><strong>Wann ist am meisten Wasser im Becken, und wie viel ist es dann?</strong>` + GERUNDET,
    felder: [
      { name: "t =", soll: ts, toleranz: TOL, hinweis: (roh, z) => (nahe(z, v.verkehrt, TOL) ? `Bruch verkehrt: Aus ${eh(kx(-k, "t"))} = ${bruch(num(c), num(a))} folgt −${num(k)}t = ln(${bruch(num(c), num(a))}), also t = ${bruch(`ln(${num(a / c)})`, num(k))} &gt; 0.` : nahe(z, v.malK, TOL) ? `Beim Auflösen wird durch ${num(k)} geteilt, nicht multipliziert.` : "Am meisten Wasser ist im Becken, wenn Zufluss und Abfluss gleich groß sind: r(t) = 0.") },
      { name: "B<sub>max</sub> =", soll: B, toleranz: TOL, hinweis: (roh, z) => (nahe(z, v.ohneAb, TOL) ? `Der Abfluss fehlt: In ${num(ts, 2)} Stunden werden ${num(c)} · t m³ abgepumpt.` : nahe(z, v.ohneB0, TOL) ? `Das ist nur die Änderung. Die ${num(B0)} m³ vom Anfang kommen dazu.` : nahe(z, v.vorz, TOL) ? "Vorzeichen: Das Abgepumpte wird abgezogen." : `B(t) = ${num(B0)} + ${intZ("0", "t")} r(s) ds an der Stelle t*.`) },
    ],
    tipps: [`r(t) = 0 ⟺ ${num(a)} · ${e} = ${num(c)} ⟺ ${e} = ${bruch(num(c), num(a))}`, `B(t) = ${num(B0)} + ${num(a / k)} · (1 − ${e}) − ${num(c)}t`],
    musterloesungHtml: `r(t) = 0 ⟺ ${e} = ${bruch(num(c), num(a))} ⟺ −${num(k)}t = ln(${bruch(num(c), num(a))}) ⟺ <strong>t = ${bruch(`ln(${num(a / c)})`, num(k))} ≈ ${num(ts)} h</strong>; vorher ist r &gt; 0, danach r &lt; 0 — dort ist der Bestand am größten.<br>` +
      `B(t) = ${num(B0)} + ${intZ("0", "t")} (${num(a)} · ${eh(kx(-k, "s"))} − ${num(c)}) ds = ${num(B0)} + ${num(a / k)} · (1 − ${e}) − ${num(c)}t<br>` +
      `Mit ${e} = ${bruch(num(c), num(a))}: B = ${num(B0)} + ${num(a / k)} · (1 − ${bruch(num(c), num(a))}) − ${num(c)} · ${num(ts)} ≈ <strong>${num(B)} m³</strong>`,
  };
}

// ---------- K2: Rotationskörper unter a · e^(−kx) ----------
// V(b) = π ∫₀ᵇ a² · e^(−2kx) dx = π · a²/(2k) · (1 − e^(−2kb)) → π · a²/(2k). Die Hälfte des Volumens
// liegt bis e^(−2kb) = ½, also b = ln 2/(2k). Fehlerbilder: nicht quadriert (π · a/k), beim Quadrieren
// den Exponenten nicht verdoppelt (π · a²/k); bei b: ln 2/k, und ln(½)/(2k) mit dem Vorzeichen.
const K2_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const a of [1, 2, 3, 4, 0.5]) for (const k of [0.5, 1, 2, 0.25, 0.1]) {
    const V = (a * a) / (2 * k);
    if (!glatt(V, 4)) continue;
    out.push({ a, k, V, nichtQ: a / k, exponent: (a * a) / k, b: Math.LN2 / (2 * k), bOhne2: Math.LN2 / k, bNeg: -Math.LN2 / (2 * k) });
  }
  return out;
});
function generateK2() {
  const v = ohneFeldKollision(K2_KANDIDATEN(), (w) => [[w.V, w.nichtQ, w.exponent], [w.b, w.bOhne2, w.bNeg]], EPS);
  const { a, k, V, b } = v;
  const e = eh(kx(-k)), e2 = eh(kx(-2 * k));
  return {
    promptHtml: `Der Graph von f(x) = ${ae(a, -k)} rotiert für x ≥ 0 um die x-Achse. Es entsteht ein unendlich langer Körper.<br><strong>Bestimme sein Volumen V als Vielfaches von π und die Stelle b, bis zu der genau die Hälfte des Volumens liegt.</strong>` +
      `<br><span class="progress-note">V: Für V = 12π tippst du 12. b auf vier Nachkommastellen gerundet (Komma als Dezimalzeichen).</span>`,
    felder: [
      { name: "V : π =", soll: V, toleranz: TOL, hinweis: (roh, z) => (nahe(z, v.nichtQ, TOL) ? "Quadriert wurde nicht: V = π ∫ (f(x))² dx." : nahe(z, v.exponent, TOL) ? `Beim Quadrieren verdoppelt sich der Exponent: (${e})² = ${e2}. Die Stammfunktion hat deshalb den Faktor ${bruch("1", num(2 * k))}.` : `V = π · ${intZ("0", "∞")} ${a === 1 ? "" : num(a * a) + " · "}${e2} dx: erst bis z rechnen, dann z → ∞.`) },
      { name: "b =", soll: b, toleranz: TOL, hinweis: (roh, z) => (nahe(z, v.bOhne2, TOL) ? `Im Exponenten steht ${kx(-2 * k)}, nicht ${kx(-k)}: Aus ${eh(kx(-2 * k, "b"))} = ½ folgt b = ${bruch("ln 2", num(2 * k))}.` : nahe(z, v.bNeg, TOL) ? "Vorzeichen: ln(½) = −ln 2 ist negativ; geteilt durch die negative Zahl wird b positiv." : `V(b) = ${num(V)}π · (1 − ${eh(kx(-2 * k, "b"))}); setze das gleich der Hälfte.`) },
    ],
    tipps: [`(f(x))² = ${a === 1 ? "" : num(a * a) + " · "}${e2}`, `π · ${intZ("0", "z")} ${a === 1 ? "" : num(a * a) + " · "}${e2} dx = ${num(V)}π · (1 − ${eh(kx(-2 * k, "z"))})`],
    musterloesungHtml: `(f(x))² = ${a === 1 ? "" : num(a * a) + " · "}${e2}; π · ${intZ("0", "z")} ${a === 1 ? "" : num(a * a) + " · "}${e2} dx = π · ${klammer(`−${quot(a * a, 2 * k)} · ${e2}`, "0", "z")} = ${num(V)}π · (1 − ${eh(kx(-2 * k, "z"))})<br>` +
      `Für z → ∞: <strong>V = ${num(V)}π</strong> ≈ ${num(V * Math.PI, 2)}<br>` +
      `Hälfte: 1 − ${eh(kx(-2 * k, "b"))} = ½ ⟺ ${eh(kx(-2 * k, "b"))} = ½ ⟺ ${num(-2 * k)}b = −ln 2 ⟺ <strong>b = ${bruch("ln 2", num(2 * k))} ≈ ${num(b)}</strong>`,
  };
}

// ================= Stammfunktionen bestimmen (Termeingabe, je Stufe eine) =================
// Die Funktionen setzen sich aus Gliedern zusammen, die ihre Stammfunktion exakt kennen
// (mathematik/terme.js) — so gibt es beliebig viele, und die Musterlösung entsteht aus denselben
// Gliedern wie die Angabe. Geprüft wird die getippte Stammfunktion durch Ableiten (F + C zählt).

const KOEFF = [-6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6];
const KLEIN = [-3, -2, -1, 1, 2, 3];
// Wo 1/x oder 1/(mx + n) vorkommt, gilt die Stammfunktion mit ln nur für x > 0 — das steht dabei.
const NUR_POSITIV = { zusatz: " (x &gt; 0)" };
const mitLn = (gl) => gl.some((g) => (g.typ === "pot" || g.typ === "kette") && g.e.z === -1 && g.e.n === 1);

// einfach: a · e^(kx) neben Potenzen — durch k teilen, nicht mit k malnehmen.
function generateE6() {
  const gl = [efunktion([pot(zufall(KOEFF), 0)], { m: zufall([2, 3, 4, -1, -2, q(1, 2), q(-1, 2)]) }), pot(zufall(KOEFF), zufall([1, 2, 3]))];
  if (zufall([true, false])) gl.push(efunktion([pot(zufall(KLEIN), 0)], { m: zufall([1, -3, 5]) }));
  return stammAufgabe(mische(gl));
}
// mittel: Produkte (px + q) · e^(kx) und x² · e^(kx) — mit dem Ansatz F(x) = Q(x) · e^(kx).
function generateM6() {
  const P = zufall([false, false, true])
    ? [pot(zufall([1, -1, 2]), 2), pot(zufall(KLEIN), zufall([0, 1]))]
    : [pot(zufall(KLEIN), 1), pot(zufall(KOEFF), 0)];
  const gl = [efunktion(P, { m: zufall([1, -1, 2, -2, q(1, 2)]) })];
  if (zufall([true, false])) gl.push(pot(zufall(KOEFF), zufall([0, 1])));
  return stammAufgabe(mische(gl));
}
// schwierig: Sinus und Kosinus mit innerer Ableitung, dazu Potenzen — auch 1/x mit ln.
function generateS6() {
  const gl = [trig(zufall(KOEFF), zufall(["sin", "cos"]), zufall([2, 3, 4, q(1, 2)])), pot(zufall(KOEFF), zufall([1, 2, 3, -1]))];
  if (zufall([true, false])) gl.push(trig(zufall(KLEIN), zufall(["sin", "cos"]), 1));
  return stammAufgabe(mische(gl), mitLn(gl) ? NUR_POSITIV : {});
}
// komplex: Verkettung — lineare Verkettung (Potenzen, Wurzeln, 1/(mx + n) und Winkelfunktionen von
// mx + n), oder erst umformen: (x² − 1)² ausmultiplizieren (die Regel für mx + n gilt dort nicht),
// sin²(x) und sin(x) · cos(x) über den doppelten Winkel — die Umformung steht in der Aufgabe, denn die
// Seite leitet sie nicht her.
function generateK6() {
  const art = zufall(["linear", "linear", "ausmultiplizieren", "umformen"]);
  const gl = [];
  if (art === "linear") {
    gl.push(kette(zufall([1, 2, 3, 4, -2]), zufall([2, 3, 4]), zufall([1, 2, 3]), zufall([2, 3, 4, -2, -3, -1, q(1, 2), q(-1, 2)])));
    gl.push(trig(zufall(KLEIN), zufall(["sin", "cos"]), zufall([2, 3]), 1));
    if (zufall([true, false])) gl.push(pot(zufall(KOEFF), zufall([1, 2])));
  } else if (art === "ausmultiplizieren") {
    gl.push(zufall([true, true, false])
      ? verkettung(zufall([1, 2, 3, -1]), zufall([1, 2]), zufall([2, 3]), zufall([1, 2, 3, -1, -2, -3]), 2, { p: zufall([0, 0, 1]) })
      : verkettung(zufall([1, 2, -1]), 1, 2, zufall([1, -1, 2, -2]), 3));
    if (zufall([true, false])) gl.push(pot(zufall(KOEFF), 1));
  } else {
    const [s, c] = zufall([[2, 0], [0, 2], [1, 1]]);
    gl.push(trigPotenz(zufall([1, 2, 4, -2, 3]), s, c, zufall([1, 2])));
    gl.push(pot(zufall(KOEFF), zufall([0, 1, 2])));
  }
  return stammAufgabe(mische(gl), mitLn(gl) ? NUR_POSITIV : {});
}

export const AUFGABEN = [
  { schwierigkeit: "einfach", titel: "Integral einer e-Funktion", generate: generateE1 },
  { schwierigkeit: "einfach", titel: "Sinus und Kosinus (LK)", generate: generateE2 },
  { schwierigkeit: "einfach", titel: "Integral von c/x (LK)", generate: generateE3 },
  { schwierigkeit: "einfach", titel: "Uneigentliches Integral in zwei Schritten (LK)", generate: generateE4 },
  { schwierigkeit: "einfach", titel: "Stammfunktion durch einen Punkt", generate: generateE5 },
  { schwierigkeit: "einfach", titel: "Stammfunktion: e-Funktionen", generate: generateE6, wuerfelText: "🎲 Neue Funktion" },
  { schwierigkeit: "mittel", titel: "Stammfunktion per Ansatz", generate: generateM1 },
  { schwierigkeit: "mittel", titel: "Zufluss mit abklingender Rate", generate: generateM2 },
  { schwierigkeit: "mittel", titel: "Lineare Verkettung (LK)", generate: generateM3 },
  { schwierigkeit: "mittel", titel: "Polstelle am Rand (LK)", generate: generateM4 },
  { schwierigkeit: "mittel", titel: "Obere Grenze bei c/x (LK)", generate: generateM5 },
  { schwierigkeit: "mittel", titel: "Stammfunktion: Produkte mit e", generate: generateM6, wuerfelText: "🎲 Neue Funktion" },
  { schwierigkeit: "schwierig", titel: "Fläche unter x · e^(−kx)", generate: generateS1 },
  { schwierigkeit: "schwierig", titel: "Mittlere Temperatur", generate: generateS2 },
  { schwierigkeit: "schwierig", titel: "Rotationsvolumen (LK)", generate: generateS3 },
  { schwierigkeit: "schwierig", titel: "Uneigentliches Integral (LK)", generate: generateS4 },
  { schwierigkeit: "schwierig", titel: "Unendlich langer Rotationskörper (LK)", generate: generateS5 },
  { schwierigkeit: "schwierig", titel: "Stammfunktion: Sinus, Kosinus und 1/x (LK)", generate: generateS6, wuerfelText: "🎲 Neue Funktion" },
  { schwierigkeit: "komplex", titel: "Größter Bestand bei abklingendem Zufluss", generate: generateK1 },
  { schwierigkeit: "komplex", titel: "Rotationskörper unter einer e-Funktion (LK)", generate: generateK2 },
  { schwierigkeit: "komplex", titel: "Kugelschicht (LK)", generate: generateK3 },
  { schwierigkeit: "komplex", titel: "Unbegrenzte Fläche zwischen zwei Graphen (LK)", generate: generateK4 },
  { schwierigkeit: "komplex", titel: "Grenze aus einer unbegrenzten Fläche (LK)", generate: generateK5 },
  { schwierigkeit: "komplex", titel: "Stammfunktion: Verkettung und Umformen (LK)", generate: generateK6, wuerfelText: "🎲 Neue Funktion" },
];
