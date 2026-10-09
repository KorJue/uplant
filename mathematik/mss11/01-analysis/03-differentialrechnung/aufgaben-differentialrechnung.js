// Die vierundzwanzig Übungsaufgaben zu „Differentialrechnung“ — sechs je Stufe.
//
//   einfach   — mittlere Änderungsrate, Ableitung an einer Stelle, Potenzregel mit negativen
//               Exponenten und √x, Steigungswinkel, waagerechte Tangente.
//   mittel    — Differenzenquotient für ein festes x, Tangente, Normale, Nullstellen durch
//               Substitution, Hoch- oder Tiefpunkt einer kubischen Funktion.
//   schwierig — Schnittwinkel, differenzierbar zusammensetzen, Kettenregel, Produktregel,
//               Tangenten von einem Punkt außerhalb.
//   komplex   — Parabel aus Bedingungen, Durchschnitts- und Momentangeschwindigkeit,
//               biquadratische Funktion, zweiter Schnittpunkt der Tangente, Kettenregel und Tangente.
//
// Die sechste Aufgabe jeder Stufe ist ein Ableitungstraining mit beliebig vielen Funktionen: Die
// Funktion wird aus Gliedern zusammengesetzt (mathematik/terme.js), die ihre Ableitung exakt kennen;
// die Eingabe wird als Term gelesen und an vielen Stellen numerisch nachgeprüft. Stufen: ganzrational,
// Potenzen und Wurzeln, Kettenregel (lineare Verkettung, Sinus/Kosinus), Produktregel.
//
// Gewürfelt wird konstruktiv: Die Kandidatenlisten werden vorher gesiebt, ohneKollision() wählt aus
// dem Rest. Jeder Fehlerwert ist von der Lösung und von den anderen Fehlerwerten verschieden — wo ein
// Fehler mit der Lösung zusammenfiele, steht NaN.

"use strict";

import { pot, trig, kette, prod, q, ableitungsAufgabe, pick as zufall, mische } from "../../../terme.js?v=1";

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
const GRAD = 180 / Math.PI;
function grad(m) {
  return Math.atan(m) * GRAD;
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
const WINKEL = `<br><span class="progress-note">Gib den Winkel in Grad auf zwei Nachkommastellen gerundet ein (Taschenrechner auf DEG).</span>`;
const TOL = 0.0001;
const TOL_WINKEL = 0.006;
const EPS = 0.001;

// ================= einfach =================

// ---------- E1: mittlere Änderungsrate ----------
const E1_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const a of [0.5, 1, 2, 3, -1, -2]) for (const c of [-3, -1, 0, 2, 4]) for (const x1 of [-2, -1, 0, 1, 2]) for (const d of [1, 2, 3]) out.push({ art: "term", a, c, x1, x2: x1 + d });
  for (const x1 of [0, 1, 2, 3]) for (const d of [1, 2, 3]) out.push({ art: "fall", a: 5, c: 0, x1, x2: x1 + d });
  return out;
});
function e1Werte(v) {
  const f = (x) => v.a * x * x + v.c;
  const dy = f(v.x2) - f(v.x1), soll = dy / (v.x2 - v.x1);
  // Bei der Intervalllänge 1 fällt „nicht geteilt“ mit der Lösung zusammen, bei soll = 0 das
  // falsche Vorzeichen — dort gibt es diesen Fehler nicht zu erkennen.
  return { f, dy, soll, nichtGeteilt: v.x2 - v.x1 === 1 ? NaN : dy, vorzeichen: soll === 0 ? NaN : -soll, mittel: (f(v.x1) + f(v.x2)) / 2 };
}
function generateE1() {
  const fall = Math.random() < 0.3;
  const k = ohneKollision(E1_KANDIDATEN().filter((v) => (v.art === "fall") === fall), (v) => {
    const w = e1Werte(v);
    return [w.soll, w.nichtGeteilt, w.vorzeichen, w.mittel];
  }, EPS);
  const { a, c, x1, x2 } = k;
  const w = e1Werte(k);
  const term = poly([[a, "x²"], [c, ""]]);
  const promptHtml = fall
    ? `Ein Stein fällt aus der Ruhe; nach t Sekunden hat er s(t) = 5t² Meter zurückgelegt.<br><strong>Berechne seine Durchschnittsgeschwindigkeit in m/s zwischen t = ${num(x1)} s und t = ${num(x2)} s.</strong>` + ZAHL
    : `Gegeben ist f(x) = ${term}.<br><strong>Berechne die mittlere Änderungsrate von f im Intervall [${num(x1)}; ${num(x2)}].</strong>` + ZAHL;
  const n = fall ? "s" : "f";
  return {
    promptHtml,
    correct: w.soll,
    tolerance: TOL,
    placeholder: fall ? "m/s" : "Änderungsrate",
    hinweis: (roh, v) => {
      if (nahe(v, w.nichtGeteilt, TOL)) return `Das ist die Änderung ${n}(${num(x2)}) − ${n}(${num(x1)}) = ${num(w.dy)}. Die mittlere Änderungsrate teilt sie noch durch die Intervalllänge ${num(x2 - x1)}.`;
      if (nahe(v, w.vorzeichen, TOL)) return `Vorzeichen: Im Zähler steht ${n}(b) − ${n}(a), der Wert am rechten Rand zuerst.`;
      if (nahe(v, w.mittel, TOL)) return `Das ist der Mittelwert der Funktionswerte, nicht ihrer Änderung. Gesucht ist (${n}(b) − ${n}(a)) : (b − a).`;
      return `Rechne ${n}(${num(x2)}) und ${n}(${num(x1)}) aus, bilde die Differenz und teile durch ${num(x2 - x1)}.`;
    },
    tipps: [`${n}(${num(x2)}) = ${num(w.f(x2))}, ${n}(${num(x1)}) = ${num(w.f(x1))}`, `mittlere Änderungsrate = ${bruch(`${n}(b) − ${n}(a)`, "b − a")}`],
    musterloesungHtml: `${n}(${num(x2)}) = ${num(w.f(x2))}, &nbsp; ${n}(${num(x1)}) = ${num(w.f(x1))}<br>` +
      `${bruch(`${n}(${num(x2)}) − ${n}(${num(x1)})`, `${num(x2)} − ${numK(x1)}`)} = ${bruch(`${num(w.f(x2))} − ${numK(w.f(x1))}`, num(x2 - x1))} = <strong>${num(w.soll)}${fall ? " m/s" : ""}</strong>`,
  };
}

// ---------- E2: Ableitung eines Polynoms an einer Stelle ----------
const E2_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const a of [-2, -1, 1, 2]) for (const b of [-3, -1, 0, 2, 3]) for (const c of [-4, -2, 0, 1, 3]) for (const d of [-5, -2, 3, 4]) for (const x0 of [-2, -1, 1, 2, 3]) out.push({ a, b, c, d, x0 });
  return out;
});
function e2Werte(v) {
  const { a, b, c, d, x0 } = v;
  return { soll: 3 * a * x0 * x0 + 2 * b * x0 + c, fx: a * x0 ** 3 + b * x0 * x0 + c * x0 + d, ohneFaktor: a * x0 * x0 + b * x0 + c };
}
function generateE2() {
  const k = ohneKollision(E2_KANDIDATEN(), (v) => {
    const w = e2Werte(v);
    return [w.soll, w.fx, w.ohneFaktor, w.soll + v.d];
  }, EPS);
  const { a, b, c, d, x0 } = k;
  const w = e2Werte(k);
  const ableitung = poly([[3 * a, "x²"], [2 * b, "x"], [c, ""]]);
  return {
    promptHtml: `Gegeben ist f(x) = ${poly([[a, "x³"], [b, "x²"], [c, "x"], [d, ""]])}.<br><strong>Berechne f′(${num(x0)}).</strong>` + ZAHL,
    correct: w.soll,
    tolerance: TOL,
    placeholder: "f′(x₀)",
    hinweis: (roh, v) => {
      if (nahe(v, w.fx, TOL)) return `Das ist der Funktionswert f(${num(x0)}), nicht die Steigung. Erst ableiten, dann einsetzen.`;
      if (nahe(v, w.ohneFaktor, TOL)) return "Beim Ableiten wandert der Exponent als Faktor nach vorn: (x³)′ = 3x², nicht x².";
      if (nahe(v, w.soll + d, TOL)) return `Der konstante Summand ${num(d)} fällt beim Ableiten weg — er verschiebt den Graphen nur.`;
      return `f′(x) = ${ableitung}; setze x = ${num(x0)} ein.`;
    },
    tipps: ["Leite Summand für Summand ab: (a · xⁿ)′ = a · n · xⁿ⁻¹.", `f′(x) = ${ableitung}`],
    musterloesungHtml: `f′(x) = ${ableitung}<br>f′(${num(x0)}) = ${einsetzen([[3 * a, `${numK(x0)}²`], [2 * b, numK(x0)], [c, ""]])} = <strong>${num(w.soll)}</strong>`,
  };
}

// ---------- E3: Potenzregel mit negativen Exponenten und √x ----------
const E3_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const a of [1, 2, 4, 8, -2, -4]) for (const n of [1, 2, 3, 4]) for (const x0 of [1, 2, -1, -2]) {
    const soll = (-n * a) / x0 ** (n + 1);
    if (glatt(soll, 4)) out.push({ art: "bruch", a, n, x0, soll });
  }
  for (const a of [1, 2, 3, 4, 5, 6, 8, 10, -2, -6]) for (const k of [1, 2, 3, 4, 5, 6]) {
    const soll = a / (2 * k);
    if (glatt(soll, 4)) out.push({ art: "wurzel", a, n: 0.5, x0: k * k, k, soll });
  }
  return out;
});
function e3Fehler(v) {
  if (v.art === "bruch") return { vorzeichen: -v.soll, exponent: (-v.n * v.a) / v.x0 ** (v.n - 1), fx: v.a / v.x0 ** v.n };
  return { ohneHalb: v.a / v.k, exponent: (v.a * v.k) / 2, fx: v.a * v.k };
}
function generateE3() {
  const wurzel = Math.random() < 0.4;
  const k = ohneKollision(E3_KANDIDATEN().filter((v) => (v.art === "wurzel") === wurzel), (v) => [v.soll, ...Object.values(e3Fehler(v))], EPS);
  const fe = e3Fehler(k);
  if (k.art === "bruch") {
    const { a, n, x0, soll } = k;
    const nenner = n === 1 ? "x" : `x${hochZahl(n)}`;
    return {
      promptHtml: `Gegeben ist f(x) = ${bruch(num(a), nenner)} = ${num(a)} · x⁻${hochZahl(n)}.<br><strong>Berechne f′(${num(x0)}).</strong>` + ZAHL,
      correct: soll,
      tolerance: TOL,
      placeholder: "f′(x₀)",
      hinweis: (roh, v) => {
        if (nahe(v, fe.vorzeichen, TOL)) return `Vorzeichen: Der Exponent −${n} kommt als Faktor nach vorn — ${num(a)} · (−${n}) = ${num(-n * a)}.`;
        if (nahe(v, fe.exponent, TOL)) return `Der Exponent wird um 1 kleiner: von −${n} auf −${n + 1}, nicht auf −${n - 1}.`;
        if (nahe(v, fe.fx, TOL)) return `Das ist der Funktionswert f(${num(x0)}). Erst ableiten, dann einsetzen.`;
        return `f′(x) = ${num(-n * a)} · x⁻${hochZahl(n + 1)}; setze x = ${num(x0)} ein.`;
      },
      tipps: [`Schreibe f(x) = ${num(a)} · x⁻${hochZahl(n)} und wende die Potenzregel an.`, `f′(x) = ${num(a)} · (−${n}) · x⁻${hochZahl(n + 1)} = ${bruch(num(-n * a), `x${hochZahl(n + 1)}`)}`],
      musterloesungHtml: `f(x) = ${num(a)} · x⁻${hochZahl(n)} &nbsp;⟹&nbsp; f′(x) = ${num(a)} · (−${n}) · x⁻${hochZahl(n + 1)} = ${bruch(num(-n * a), `x${hochZahl(n + 1)}`)}<br>` +
        `f′(${num(x0)}) = ${bruch(num(-n * a), `${numK(x0)}${hochZahl(n + 1)}`)} = ${bruch(num(-n * a), num(x0 ** (n + 1)))} = <strong>${num(soll)}</strong>`,
    };
  }
  const { a, x0, k: w, soll } = k;
  return {
    promptHtml: `Gegeben ist f(x) = ${glied(a, "√x", false)} = ${num(a)} · x<sup>½</sup>.<br><strong>Berechne f′(${num(x0)}).</strong>` + ZAHL,
    correct: soll,
    tolerance: TOL,
    placeholder: "f′(x₀)",
    hinweis: (roh, v) => {
      if (nahe(v, fe.ohneHalb, TOL)) return "Der Faktor ½ fehlt: (√x)′ = ½ · x^(−½) = 1/(2√x).";
      if (nahe(v, fe.exponent, TOL)) return "Der Exponent wird um 1 kleiner: von ½ auf −½. Dann steht √x im Nenner, nicht im Zähler.";
      if (nahe(v, fe.fx, TOL)) return `Das ist der Funktionswert f(${num(x0)}). Erst ableiten, dann einsetzen.`;
      return `f′(x) = ${bruch(num(a), "2√x")}; setze x = ${num(x0)} ein.`;
    },
    tipps: ["√x = x^½ — Potenzregel mit dem Exponenten ½.", `f′(x) = ${num(a)} · ½ · x^(−½) = ${bruch(num(a), "2√x")}`],
    musterloesungHtml: `f′(x) = ${num(a)} · ½ · x<sup>−½</sup> = ${bruch(num(a), "2√x")}<br>f′(${num(x0)}) = ${bruch(num(a), `2 · √${num(x0)}`)} = ${bruch(num(a), num(2 * w))} = <strong>${num(soll)}</strong>`,
  };
}

// ---------- E4: Steigungswinkel ----------
const E4_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const a of [0.5, 1, -1, 2, -0.5]) for (const b of [-2, -1, 0, 1, 2]) for (const c of [-1, 0, 2]) for (const x0 of [-2, -1, 0, 1, 2]) {
    const m = 2 * a * x0 + b;
    if (m !== 0) out.push({ a, b, c, x0, m });
  }
  return out;
});
function e4Werte(v) {
  const fx = v.a * v.x0 * v.x0 + v.b * v.x0 + v.c;
  return { soll: grad(v.m), fx, mitFx: fx === v.m ? NaN : grad(fx), bogen: Math.atan(v.m), komplement: 90 - grad(v.m) };
}
function generateE4() {
  const k = ohneKollision(E4_KANDIDATEN(), (v) => {
    const w = e4Werte(v);
    return [w.soll, w.mitFx, w.bogen, w.komplement];
  }, 0.02);
  const { a, b, c, x0, m } = k;
  const w = e4Werte(k);
  return {
    promptHtml: `Gegeben ist f(x) = ${poly([[a, "x²"], [b, "x"], [c, ""]])}.<br><strong>Berechne den Steigungswinkel α des Graphen an der Stelle x₀ = ${num(x0)}</strong> (−90° &lt; α &lt; 90°; negativ, wenn der Graph fällt).` + WINKEL,
    correct: w.soll,
    tolerance: TOL_WINKEL,
    placeholder: "α in Grad",
    hinweis: (roh, v) => {
      if (nahe(v, w.mitFx, TOL_WINKEL)) return `Du hast mit dem Funktionswert f(${num(x0)}) = ${num(w.fx)} gerechnet. Der Winkel hängt an der Steigung f′(${num(x0)}).`;
      if (nahe(v, w.bogen, 0.006)) return "Das ist der Winkel im Bogenmaß. Stell den Taschenrechner auf DEG.";
      if (nahe(v, w.komplement, TOL_WINKEL)) return "Das ist der Winkel zur y-Achse. Der Steigungswinkel wird zur x-Achse gemessen: tan α = m.";
      return `f′(${num(x0)}) = ${num(m)}, also α = tan⁻¹(${num(m)}).`;
    },
    tipps: [`f′(x) = ${poly([[2 * a, "x"], [b, ""]])}, also m = f′(${num(x0)}) = ${num(m)}`, "tan α = m ⟹ α = tan⁻¹(m)"],
    musterloesungHtml: `f′(x) = ${poly([[2 * a, "x"], [b, ""]])}, &nbsp; m = f′(${num(x0)}) = ${num(m)}<br>α = tan⁻¹(${num(m)}) ≈ <strong>${num(w.soll, 2)}°</strong>`,
  };
}

// ---------- E5: waagerechte Tangente ----------
const E5_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const a of [1, -1, 2, -2, 0.5, 3]) for (const xs of [-3, -2, -1, -0.5, 0.5, 1, 1.5, 2, 3]) for (const c of [-4, -1, 1, 5]) {
    const b = -2 * a * xs;
    if (b !== 0 && Number.isInteger(b * 2)) out.push({ a, b, c, xs });
  }
  return out;
});
function generateE5() {
  const k = ohneKollision(E5_KANDIDATEN(), (v) => [v.xs, -v.xs, -v.b / v.a], EPS);
  const { a, b, c, xs } = k;
  return {
    promptHtml: `<strong>An welcher Stelle hat der Graph von f(x) = ${poly([[a, "x²"], [b, "x"], [c, ""]])} eine waagerechte Tangente?</strong>` + ZAHL,
    correct: xs,
    tolerance: TOL,
    placeholder: "x",
    hinweis: (roh, v) => {
      if (nahe(v, -xs, TOL)) return `Vorzeichen: ${poly([[2 * a, "x"], [b, ""]])} = 0 ⟹ ${glied(2 * a, "x", false)} = ${num(-b)}.`;
      if (nahe(v, -b / a, TOL)) return `Die Ableitung von ${glied(a, "x²", false)} ist ${glied(2 * a, "x", false)} — der Faktor 2 fehlt.`;
      return "Waagerechte Tangente heißt f′(x) = 0.";
    },
    tipps: ["Waagerechte Tangente ⟺ Steigung 0 ⟺ f′(x) = 0.", `f′(x) = ${poly([[2 * a, "x"], [b, ""]])}`],
    musterloesungHtml: `f′(x) = ${poly([[2 * a, "x"], [b, ""]])} = 0 ⟹ x = ${bruch(num(-b), num(2 * a))} = <strong>${num(xs)}</strong><br>` +
      `<strong>Probe:</strong> Das ist die x-Koordinate des Scheitelpunkts der Parabel — dort ist die Tangente waagerecht.`,
  };
}

// ================= mittel =================

// ---------- M1: Differenzenquotient für ein festes x ----------
const M1_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const a of [1, 2, -1, 0.5, 3]) for (const b of [-3, -1, 0, 2, 3]) for (const x0 of [-2, -1, 0, 1, 2, 3]) for (const h of [0.1, 0.5, 2, -0.5, 1]) out.push({ a, b, x0, h });
  return out;
});
function m1Werte(v) {
  const soll = v.a * (2 * v.x0 + v.h) + v.b;
  return { soll, grenz: 2 * v.a * v.x0 + v.b, ungeteilt: v.h === 1 ? NaN : soll * v.h, rechts: 2 * v.a * (v.x0 + v.h) + v.b };
}
function generateM1() {
  const k = ohneKollision(M1_KANDIDATEN(), (v) => {
    const w = m1Werte(v);
    return [w.soll, w.grenz, w.ungeteilt, w.rechts];
  }, EPS);
  const { a, b, x0, h } = k;
  const c = pick([-2, 1, 3]);
  const f = (x) => a * x * x + b * x + c;
  const w = m1Werte(k);
  const x = x0 + h;
  return {
    // x₀-Methode wie in Elemente: die zweite Stelle heißt x, gerechnet wird mit h = x − x₀.
    promptHtml: `Gegeben ist f(x) = ${poly([[a, "x²"], [b, "x"], [c, ""]])}.<br><strong>Berechne den Differenzenquotienten ${bruch("f(x) − f(x₀)", "x − x₀")} für x₀ = ${num(x0)} und x = ${num(x)}.</strong>` + ZAHL,
    correct: w.soll,
    tolerance: TOL,
    placeholder: "Differenzenquotient",
    hinweis: (roh, v) => {
      if (nahe(v, w.grenz, TOL)) return `Das ist schon der Grenzwert für x → x₀, also f′(${num(x0)}). Gefragt ist der Quotient für das feste x = ${num(x)} — die Sekantensteigung.`;
      if (nahe(v, w.ungeteilt, TOL)) return `Das ist f(x) − f(x₀). Noch durch x − x₀ = ${num(h)} teilen.`;
      if (nahe(v, w.rechts, TOL)) return `Das ist die Steigung an der Stelle x = ${num(x)}. Gesucht ist die Sekantensteigung zwischen x₀ und x.`;
      return `Berechne f(${num(x)}) und f(${num(x0)}), bilde die Differenz und teile durch x − x₀ = ${num(h)}.`;
    },
    tipps: [`f(${num(x)}) = ${num(f(x))}`, `f(${num(x0)}) = ${num(f(x0))}; x − x₀ = ${num(x)} − ${numK(x0)} = ${num(h)}`],
    musterloesungHtml: `f(${num(x)}) = ${num(f(x))}, &nbsp; f(${num(x0)}) = ${num(f(x0))}<br>` +
      `${bruch(`${num(f(x))} − ${numK(f(x0))}`, `${num(x)} − ${numK(x0)}`)} = ${bruch(num(f(x) - f(x0)), num(h))} = <strong>${num(w.soll)}</strong><br>` +
      `Zum Vergleich: f′(${num(x0)}) = ${num(w.grenz)} — die Sekantensteigung weicht um ${num(Math.abs(w.soll - w.grenz))} = |${num(a)} · (x − x₀)| davon ab.`,
  };
}

// ---------- M2: Tangentengleichung ----------
const M2_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const a of [1, -1, 0.5]) for (const b of [0, 1, -2]) for (const c of [-3, -1, 2]) for (const d of [-2, 1, 4]) for (const x0 of [-2, -1, 1, 2]) {
    const fx = a * x0 ** 3 + b * x0 * x0 + c * x0 + d, m = 3 * a * x0 * x0 + 2 * b * x0 + c;
    out.push({ a, b, c, d, x0, fx, m, n: fx - m * x0 });
  }
  return out;
});
function generateM2() {
  // Typische Fehler: f(x₀) als Steigung; f(x₀) als Achsenabschnitt; Vorzeichen beim Auflösen.
  const k = ohneFeldKollision(M2_KANDIDATEN(), (v) => [[v.m, v.fx], [v.n, v.fx, v.fx + v.m * v.x0]], EPS);
  const { a, b, c, d, x0, fx, m, n } = k;
  return {
    promptHtml: `Gegeben ist f(x) = ${poly([[a, "x³"], [b, "x²"], [c, "x"], [d, ""]])}.<br><strong>Bestimme die Gleichung der Tangente an den Graphen im Punkt mit x₀ = ${num(x0)}</strong> in der Form t(x) = m · x + b.` + ZAHL,
    felder: [
      { name: "m =", soll: m, toleranz: TOL, hinweis: (roh, v) => (nahe(v, fx, TOL) ? `Das ist f(${num(x0)}), die Höhe des Punktes. Die Steigung ist f′(${num(x0)}).` : `Die Steigung der Tangente ist f′(${num(x0)}).`) },
      { name: "b =", soll: n, toleranz: TOL, hinweis: (roh, v) => (nahe(v, fx, TOL) ? `f(${num(x0)}) = ${num(fx)} ist die y-Koordinate von P, nicht der Achsenabschnitt — der liegt bei x = 0.` : nahe(v, fx + m * x0, TOL) ? "Vorzeichen: b = f(x₀) − m · x₀." : "Setze P in t(x) = m · x + b ein und löse nach b auf.") },
    ],
    tipps: [`P(${num(x0)} | ${num(fx)}), m = f′(${num(x0)})`, "t(x) = f′(x₀) · (x − x₀) + f(x₀) — ausmultiplizieren."],
    musterloesungHtml: `f(${num(x0)}) = ${num(fx)}; &nbsp; f′(x) = ${poly([[3 * a, "x²"], [2 * b, "x"], [c, ""]])}, f′(${num(x0)}) = ${num(m)}<br>` +
      `t(x) = ${num(m)} · (x ${plusMinus(-x0)}) ${plusMinus(fx)} = <strong>${poly([[m, "x"], [n, ""]])}</strong>, also m = ${num(m)}, b = ${num(n)}<br>` +
      `<strong>Probe:</strong> t(${num(x0)}) = ${num(m * x0 + n)} = f(${num(x0)}) ✓`,
  };
}

// ---------- M3: Normalengleichung ----------
const M3_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const a of [0.5, 1, 2, -1, -0.5, 0.25]) for (const b of [-2, -1, 0, 1, 2]) for (const c of [-1, 0, 2]) for (const x0 of [-2, -1, 1, 2, 3]) {
    const m = 2 * a * x0 + b;
    if (m === 0) continue;
    const y0 = a * x0 * x0 + b * x0 + c, mn = -1 / m, bn = y0 - mn * x0;
    if (glatt(mn, 4) && glatt(bn, 4)) out.push({ a, b, c, x0, m, y0, mn, bn });
  }
  return out;
});
function generateM3() {
  // −m fällt bei m = ±1 mit −1/m zusammen; dort gibt es diesen Fehler nicht zu erkennen.
  const k = ohneFeldKollision(M3_KANDIDATEN(), (v) => [[v.mn, Math.abs(v.m) === 1 ? NaN : -v.m, 1 / v.m], [v.bn, v.y0 - v.m * v.x0]], EPS);
  const { a, b, c, x0, m, y0, mn, bn } = k;
  return {
    promptHtml: `Gegeben ist f(x) = ${poly([[a, "x²"], [b, "x"], [c, ""]])}.<br><strong>Bestimme die Gleichung der Normalen im Punkt mit x₀ = ${num(x0)}</strong> in der Form n(x) = m · x + b.` + ZAHL,
    felder: [
      { name: "m =", soll: mn, toleranz: TOL, hinweis: (roh, v) => (nahe(v, -m, TOL) ? "Nur das Vorzeichen gewechselt — die Normalensteigung ist der negative Kehrwert −1/f′(x₀)." : nahe(v, 1 / m, TOL) ? "Der Kehrwert allein reicht nicht: Die Normalensteigung ist −1/f′(x₀), mit Minus." : "Normalensteigung = −1 : f′(x₀).") },
      { name: "b =", soll: bn, toleranz: TOL, hinweis: (roh, v) => (nahe(v, y0 - m * x0, TOL) ? "Das ist der Achsenabschnitt der Tangente. Rechne b mit der Normalensteigung." : `Setze P(${num(x0)} | ${num(y0)}) in n(x) = m · x + b ein.`) },
    ],
    tipps: [`f′(${num(x0)}) = ${num(m)}, also Normalensteigung −1 : ${numK(m)} = ${num(mn)}`, `P(${num(x0)} | ${num(y0)}) liegt auf der Normalen.`],
    musterloesungHtml: `f′(x) = ${poly([[2 * a, "x"], [b, ""]])}, f′(${num(x0)}) = ${num(m)}, f(${num(x0)}) = ${num(y0)}<br>` +
      `Normalensteigung: −1 : ${numK(m)} = ${num(mn)}; &nbsp; ${num(y0)} = ${num(mn)} · ${numK(x0)} + b ⟹ b = ${num(bn)}<br>` +
      `n(x) = <strong>${poly([[mn, "x"], [bn, ""]])}</strong>. <strong>Probe:</strong> ${num(m)} · ${numK(mn)} = −1 ✓`,
  };
}

// ---------- M4: Nullstellen durch Substitution ----------
const M4_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const s of [1, 2, 3, 4, 5]) {
    for (const t of [1, 2, 3, 4, 5]) if (t !== s) out.push({ s, u2: t * t, gross: Math.max(s, t), anzahl: 4 });
    for (const t of [1, 2, 3]) out.push({ s, u2: -t * t, gross: s, anzahl: 2 });
    out.push({ s, u2: 0, gross: s, anzahl: 3 });
  }
  // Mit Leitkoeffizient a: f(x) = a · (x⁴ + px² + q) — die Nullstellen bleiben, der Term ändert sich.
  const mit = [];
  for (const v of out) for (const a of [1, 2, 0.5]) {
    const u1 = v.s * v.s, p = -(u1 + v.u2), q = u1 * v.u2;
    if (Math.abs(a * q) <= 200) mit.push({ ...v, a, u1, p, q });
  }
  return mit;
});
function generateM4() {
  // Typischer Fehler: u statt x angegeben (Rücksubstitution vergessen); jedes u als Nullstelle gezählt.
  const k = ohneFeldKollision(M4_KANDIDATEN(), (v) => [[v.gross, Math.max(v.u1, v.u2)], [v.anzahl, v.anzahl === 4 ? NaN : 4]], EPS);
  const { a, u1, u2, gross, anzahl, p, q } = k;
  const term = poly([[a, "x⁴"], [a * p, "x²"], [a * q, ""]]);
  const uLoes = [u1, u2].sort((x, y) => y - x);
  const rueck = uLoes.map((u) => (u > 0 ? `x² = ${num(u)} ⟹ x = ±${num(Math.sqrt(u))}` : u === 0 ? "x² = 0 ⟹ x = 0 (doppelt)" : `x² = ${num(u)} hat keine Lösung`)).join("; ");
  return {
    promptHtml: `Gegeben ist f(x) = ${term}.<br><strong>Bestimme alle Nullstellen. Gib die größte Nullstelle und die Anzahl der verschiedenen Nullstellen an.</strong>` + ZAHL,
    felder: [
      { name: "größte Nullstelle:", soll: gross, toleranz: TOL, hinweis: (roh, v) => (nahe(v, Math.max(u1, u2), TOL) ? "Das ist eine Lösung für u = x². Rücksubstitution: x = ±√u." : "Substituiere u = x² und löse die quadratische Gleichung.") },
      { name: "Anzahl:", soll: anzahl, toleranz: 0.1, hinweis: (roh, v) => (nahe(v, 4, 0.1) ? (u2 < 0 ? "Ein negatives u liefert keine Nullstelle: x² kann nicht negativ sein." : "u = 0 liefert nur die eine Nullstelle x = 0 (doppelt).") : "Zähle die verschiedenen x-Werte nach der Rücksubstitution.") },
    ],
    tipps: [`${a === 1 ? "" : `Erst durch ${num(a)} teilen. `}Mit u = x²: ${poly([[1, "u²"], [p, "u"], [q, ""]])} = 0`, `pq-Formel: u₁ = ${num(uLoes[0])}, u₂ = ${num(uLoes[1])}`],
    musterloesungHtml: `${a === 1 ? "" : `f(x) = 0 ⟺ ${poly([[1, "x⁴"], [p, "x²"], [q, ""]])} = 0 (durch ${num(a)} geteilt).<br>`}u = x²: ${poly([[1, "u²"], [p, "u"], [q, ""]])} = 0 ⟹ u₁ = ${num(uLoes[0])}, u₂ = ${num(uLoes[1])}<br>Rücksubstitution: ${rueck}<br>` +
      `Größte Nullstelle <strong>${num(gross)}</strong>, <strong>${anzahl}</strong> verschiedene Nullstellen.`,
  };
}

// ---------- M5: Hoch- oder Tiefpunkt einer kubischen Funktion ----------
const M5_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const s of [1, -1]) for (const k of [1, 2, 3]) for (const c of [-3, -1, 0, 2, 4]) for (const gesucht of ["Tiefpunkt", "Hochpunkt"]) {
    // f(x) = s · (x³ − 3k²x) + c. Für s = 1 liegt der Tiefpunkt bei k, für s = −1 bei −k.
    const f = (x) => s * (x ** 3 - 3 * k * k * x) + c;
    const xT = s === 1 ? k : -k, xH = -xT;
    const xs = gesucht === "Tiefpunkt" ? xT : xH, xa = gesucht === "Tiefpunkt" ? xH : xT;
    out.push({ s, k, c, gesucht, x: xs, y: f(xs), xAnders: xa, yAnders: f(xa) });
  }
  return out;
});
function generateM5() {
  const k = ohneFeldKollision(M5_KANDIDATEN(), (v) => [[v.x, v.xAnders], [v.y, v.yAnders, v.c]], EPS);
  const { s, k: kk, c, gesucht, x, y, xAnders, yAnders } = k;
  const anders = gesucht === "Tiefpunkt" ? "Hochpunkt" : "Tiefpunkt";
  const term = poly([[s, "x³"], [-3 * s * kk * kk, "x"], [c, ""]]);
  const abl = poly([[3 * s, "x²"], [-3 * s * kk * kk, ""]]);
  return {
    promptHtml: `Der Graph von f(x) = ${term} hat einen Hochpunkt und einen Tiefpunkt.<br><strong>Bestimme die Koordinaten des ${gesucht}s.</strong>` + ZAHL,
    felder: [
      { name: "x =", soll: x, toleranz: TOL, hinweis: (roh, v) => (nahe(v, xAnders, TOL) ? `Dort liegt der ${anders}: Prüfe, wie f′ an dieser Stelle das Vorzeichen wechselt.` : "Nullstellen von f′ bestimmen.") },
      { name: "y =", soll: y, toleranz: TOL, hinweis: (roh, v) => (nahe(v, yAnders, TOL) ? `Das ist die Höhe des ${anders}s.` : nahe(v, c, TOL) ? "Das ist f(0). Setze die x-Koordinate des Extrempunkts in f ein." : "y = f(x) an der gefundenen Stelle.") },
    ],
    tipps: [`f′(x) = ${abl} = ${num(3 * s)}(x² − ${num(kk * kk)}) = 0 ⟹ x = ±${num(kk)}`, gesucht === "Tiefpunkt" ? "Am Tiefpunkt wechselt f′ von − nach +." : "Am Hochpunkt wechselt f′ von + nach −."],
    musterloesungHtml: `f′(x) = ${abl} = 0 ⟹ x² = ${num(kk * kk)} ⟹ x = −${num(kk)} oder x = ${num(kk)}<br>` +
      `f′ ist ein${s > 0 ? "e nach oben" : "e nach unten"} geöffnete Parabel: ${s > 0 ? "positiv außen, negativ zwischen den Nullstellen" : "negativ außen, positiv zwischen den Nullstellen"}. ` +
      `Also wechselt f′ bei ${num(x)} ${gesucht === "Tiefpunkt" ? "von − nach +" : "von + nach −"}.<br>` +
      `f(${num(x)}) = ${num(y)}: ${gesucht} <strong>(${num(x)} | ${num(y)})</strong>`,
  };
}

// ================= schwierig =================

// ---------- S1: Schnittwinkel Parabel – Gerade ----------
const S1_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const x0 of [-2, -1.5, -1, -0.5, 0.5, 1, 1.5, 2]) for (const mg of [-3, -2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2.5, 3, 4]) {
    if (mg === 2 * x0) continue;   // dann wäre g die Tangente
    const al = grad(2 * x0), be = grad(mg), diff = Math.abs(al - be);
    out.push({ x0, mg, c: x0 * x0 - mg * x0, al, be, diff, soll: diff <= 90 ? diff : 180 - diff });
  }
  return out;
});
function generateS1() {
  // Bei waagerechter Gerade ist der Schnittwinkel der Steigungswinkel selbst — dort NaN.
  const k = ohneKollision(S1_KANDIDATEN(), (v) => [v.soll, v.diff > 90 ? v.diff : NaN, v.mg === 0 ? NaN : Math.abs(v.al), Math.abs(grad(2 * v.x0 - v.mg))], 0.02);
  const { x0, mg, c, al, be, diff, soll } = k;
  return {
    promptHtml: `Die Gerade g(x) = ${poly([[mg, "x"], [c, ""]])} und die Normalparabel f(x) = x² schneiden sich im Punkt P(${num(x0)} | ${num(x0 * x0)}).<br><strong>Berechne den Schnittwinkel γ von f und g in P.</strong>` + WINKEL,
    correct: soll,
    tolerance: TOL_WINKEL,
    placeholder: "γ in Grad",
    hinweis: (roh, v) => {
      if (diff > 90 && nahe(v, diff, TOL_WINKEL)) return `|α − β| ist größer als 90°. Der Schnittwinkel ist der kleinere der beiden Winkel: 180° − ${num(diff, 2)}°.`;
      if (mg !== 0 && nahe(v, Math.abs(al), TOL_WINKEL)) return "Das ist nur der Steigungswinkel der Parabel. Der Schnittwinkel liegt zwischen den beiden Geraden: Tangente an f und g.";
      if (nahe(v, Math.abs(grad(2 * x0 - mg)), TOL_WINKEL)) return "tan⁻¹ der Differenz der Steigungen ist nicht die Differenz der Winkel. Erst beide Steigungswinkel, dann subtrahieren.";
      return "Steigungswinkel von Tangente und Gerade bestimmen, Differenz bilden.";
    },
    tipps: [`f′(${num(x0)}) = ${num(2 * x0)} ⟹ α = tan⁻¹(${num(2 * x0)}); g hat die Steigung ${num(mg)} ⟹ β = tan⁻¹(${num(mg)})`, "γ = |α − β|, falls das höchstens 90° ist, sonst 180° − |α − β|."],
    musterloesungHtml: `α = tan⁻¹(${num(2 * x0)}) ≈ ${num(al, 2)}°, &nbsp; β = tan⁻¹(${num(mg)}) ≈ ${num(be, 2)}°<br>` +
      (diff > 90 ? `|α − β| ≈ ${num(diff, 2)}° &gt; 90°, also γ = 180° − |α − β| ≈ <strong>${num(soll, 2)}°</strong>` : `|α − β| ≤ 90°, also γ = |α − β| ≈ <strong>${num(soll, 2)}°</strong>`) +
      "<br>Erst am Ende runden: Mit schon gerundeten Winkeln kann die zweite Nachkommastelle abweichen.",
  };
}

// ---------- S2: differenzierbar zusammensetzen ----------
const S2_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const x0 of [1, 2, -1, -2, 4]) for (const m of [1, 2, 3, 4, -2, 6, 8]) for (const n of [-2, -1, 0, 1, 3]) {
    const a = m / (2 * x0), b = m * x0 + n - a * x0 * x0;
    if (glatt(a, 4) && glatt(b, 4)) out.push({ x0, m, n, a, b });
  }
  return out;
});
function generateS2() {
  // Typische Fehler: Faktor 2 beim Ableiten von a · x² vergessen; a · x₀² beim Auflösen vergessen.
  const k = ohneFeldKollision(S2_KANDIDATEN(), (v) => [[v.a, v.m / v.x0], [v.b, v.m * v.x0 + v.n, v.m * v.x0 + v.n - (v.m / v.x0) * v.x0 * v.x0]], EPS);
  const { x0, m, n, a, b } = k;
  const rechts = poly([[m, "x"], [n, ""]]);
  return {
    promptHtml: `f(x) = a · x² + b für x ≤ ${num(x0)} und f(x) = ${rechts} für x &gt; ${num(x0)}.<br><strong>Bestimme a und b so, dass f an der Stelle ${num(x0)} differenzierbar ist.</strong>` + ZAHL,
    felder: [
      { name: "a =", soll: a, toleranz: TOL, hinweis: (roh, v) => (nahe(v, m / x0, TOL) ? "Die Ableitung von a · x² ist 2a · x — der Faktor 2 fehlt." : "Gleiche Steigungen an der Nahtstelle: 2a · x₀ = m.") },
      { name: "b =", soll: b, toleranz: TOL, hinweis: (roh, v) => (nahe(v, m * x0 + n, TOL) ? `Das ist nur der Wert der Geraden bei ${num(x0)}. Es gilt a · x₀² + b = ${num(m * x0 + n)}, also noch a · x₀² abziehen.` : "Gleiche Funktionswerte an der Nahtstelle: a · x₀² + b = m · x₀ + n.") },
    ],
    tipps: ["Differenzierbar heißt hier: stetig (gleiche Werte) und ohne Knick (gleiche Steigungen) an der Nahtstelle.", `Steigungen: 2a · ${numK(x0)} = ${num(m)}; Werte: a · ${numK(x0)}² + b = ${num(m * x0 + n)}`],
    musterloesungHtml: `Gleiche Steigung: 2a · ${numK(x0)} = ${num(m)} ⟹ a = ${num(a)}<br>` +
      `Gleicher Wert: ${num(a)} · ${num(x0 * x0)} + b = ${num(m * x0 + n)} ⟹ b = ${num(b)}<br>` +
      `<strong>a = ${num(a)}, b = ${num(b)}</strong><br>` +
      `<strong>Probe:</strong> links f(${num(x0)}) = ${num(a * x0 * x0 + b)}, rechts ${num(m * x0 + n)} ✓; Steigungen ${num(2 * a * x0)} und ${num(m)} ✓`,
  };
}

// ---------- S3: Kettenregel ----------
const S3_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const a of [2, 3, -1, -2, 0.5]) for (const b of [-3, -1, 1, 2, 3]) for (const n of [2, 3, 4, 5]) for (const x0 of [-1, 0, 1, 2]) {
    const u = a * x0 + b, soll = n * a * u ** (n - 1);
    if (Math.abs(soll) <= 2000 && glatt(soll, 4)) out.push({ a, b, n, x0, u, soll });
  }
  return out;
});
function generateS3() {
  const k = ohneKollision(S3_KANDIDATEN(), (v) => [v.soll, v.n * v.u ** (v.n - 1), v.u ** v.n, v.n * v.a * v.u ** v.n], EPS);
  const { a, b, n, x0, u, soll } = k;
  const innen = poly([[a, "x"], [b, ""]]);
  return {
    promptHtml: `Gegeben ist f(x) = (${innen})${hochZahl(n)}.<br><strong>Berechne f′(${num(x0)}).</strong>` + ZAHL,
    correct: soll,
    tolerance: TOL,
    placeholder: "f′(x₀)",
    hinweis: (roh, v) => {
      if (nahe(v, n * u ** (n - 1), TOL)) return `Die innere Ableitung fehlt: (${innen})′ = ${num(a)}. Äußere Ableitung mal innere Ableitung.`;
      if (nahe(v, u ** n, TOL)) return `Das ist der Funktionswert f(${num(x0)}). Erst ableiten, dann einsetzen.`;
      if (nahe(v, n * a * u ** n, TOL)) return `Die äußere Ableitung von u${hochZahl(n)} ist ${n}u${hochZahl(n - 1)} — der Exponent wird um 1 kleiner.`;
      return `f′(x) = ${n}(${innen})${hochZahl(n - 1)} · ${numK(a)}`;
    },
    tipps: [`Außen u${hochZahl(n)}, innen u = ${innen}.`, `f′(x) = ${n} · (${innen})${hochZahl(n - 1)} · ${numK(a)}`],
    musterloesungHtml: `f′(x) = ${n} · (${innen})${hochZahl(n - 1)} · ${numK(a)}<br>u = ${num(a)} · ${numK(x0)} ${plusMinus(b)} = ${num(u)}; &nbsp; f′(${num(x0)}) = ${n} · ${numK(u)}${hochZahl(n - 1)} · ${numK(a)} = <strong>${num(soll)}</strong>`,
  };
}

// ---------- S4: Produktregel ----------
const S4_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const a of [1, 2, -1, 3]) for (const b of [-2, -1, 1, 3]) for (const c of [1, -1, 2, 0.5]) for (const d of [-3, -1, 2, 4]) for (const x0 of [-2, -1, 1, 2]) {
    const u = a * x0 + b, v = c * x0 * x0 + d, du = a, dv = 2 * c * x0;
    out.push({ a, b, c, d, x0, u, v, du, dv, soll: du * v + u * dv });
  }
  return out;
});
function generateS4() {
  const k = ohneKollision(S4_KANDIDATEN(), (w) => [w.soll, w.du * w.dv, w.du * w.v, w.u * w.v], EPS);
  const { a, b, c, d, x0, u, v, du, dv, soll } = k;
  const uT = poly([[a, "x"], [b, ""]]), vT = poly([[c, "x²"], [d, ""]]);
  return {
    promptHtml: `Gegeben ist f(x) = (${uT}) · (${vT}).<br><strong>Berechne f′(${num(x0)}) mit der Produktregel.</strong>` + ZAHL,
    correct: soll,
    tolerance: TOL,
    placeholder: "f′(x₀)",
    hinweis: (roh, val) => {
      if (nahe(val, du * dv, TOL)) return "(u · v)′ ist nicht u′ · v′ — schon x · x hätte dann die Ableitung 1. Richtig: u′ · v + u · v′.";
      if (nahe(val, du * v, TOL)) return "Das ist nur der erste Summand u′ · v. Es fehlt u · v′.";
      if (nahe(val, u * v, TOL)) return `Das ist der Funktionswert f(${num(x0)}). Erst ableiten, dann einsetzen.`;
      return "f′(x) = u′(x) · v(x) + u(x) · v′(x).";
    },
    tipps: [`u = ${uT}, u′ = ${num(a)}; v = ${vT}, v′ = ${poly([[2 * c, "x"]])}`, `An der Stelle ${num(x0)}: u = ${num(u)}, u′ = ${num(du)}, v = ${num(v)}, v′ = ${num(dv)}`],
    musterloesungHtml: `u(${num(x0)}) = ${num(u)}, u′ = ${num(du)}, v(${num(x0)}) = ${num(v)}, v′(${num(x0)}) = ${num(dv)}<br>` +
      `f′(${num(x0)}) = ${num(du)} · ${numK(v)} + ${numK(u)} · ${numK(dv)} = <strong>${num(soll)}</strong><br>` +
      `<strong>Probe</strong> durch Ausmultiplizieren: f(x) = ${poly([[a * c, "x³"], [b * c, "x²"], [a * d, "x"], [b * d, ""]])}, f′(x) = ${poly([[3 * a * c, "x²"], [2 * b * c, "x"], [a * d, ""]])}, f′(${num(x0)}) = ${num(3 * a * c * x0 * x0 + 2 * b * c * x0 + a * d)} ✓`,
  };
}

// ---------- S5: Tangenten von einem Punkt außerhalb ----------
const S5_KANDIDATEN = spaeter(() => {
  const out = [];
  // f(x) = a · x². Die Tangente in x₀ ist t(x) = 2a·x₀·x − a·x₀²; durch Q(u | v) geht sie, wenn
  // x₀² − 2u·x₀ + v/a = 0 — mit v = a · (u² − d²) liegen die Berührstellen bei u ± d.
  for (const a of [1, 0.5, 2]) for (const u of [-3, -2, -1, 0, 1, 2, 3, 4]) for (const dd of [1, 2, 3, 4]) out.push({ a, u, v: a * (u * u - dd * dd), x1: u - dd, x2: u + dd });
  return out;
});
function generateS5() {
  const k = ohneFeldKollision(S5_KANDIDATEN(), (w) => [[w.x1, w.u], [w.x2, w.u]], EPS);
  const { a, u, v, x1, x2 } = k;
  const fT = glied(a, "x²", false);
  return {
    promptHtml: `Vom Punkt Q(${num(u)} | ${num(v)}) aus werden die beiden Tangenten an den Graphen von f(x) = ${fT} gelegt.<br><strong>Bestimme die beiden Berührstellen x₁ &lt; x₂.</strong>` + ZAHL,
    felder: [
      { name: "x₁ =", soll: x1, toleranz: TOL, hinweis: (roh, w) => (nahe(w, u, TOL) ? "Q liegt nicht auf der Parabel — die Tangente in x = u ist nicht gemeint. Setze Q in die allgemeine Tangentengleichung ein." : `Tangente in (x₀ | f(x₀)): t(x) = f′(x₀) · (x − x₀) + f(x₀). Q muss darauf liegen.`) },
      { name: "x₂ =", soll: x2, toleranz: TOL, hinweis: (roh, w) => (nahe(w, u, TOL) ? "Q liegt nicht auf der Parabel. Gesucht sind die Stellen x₀, deren Tangente durch Q geht." : "Löse die quadratische Gleichung für x₀.") },
    ],
    tipps: [`Tangente im Punkt (x₀ | f(x₀)): t(x) = ${glied(2 * a, "x₀", false)} · (x − x₀) + ${glied(a, "x₀²", false)} = ${glied(2 * a, "x₀", false)} · x − ${glied(a, "x₀²", false)}`, `Q einsetzen: ${num(v)} = ${glied(2 * a, "x₀", false)} · ${numK(u)} − ${glied(a, "x₀²", false)}`],
    musterloesungHtml: `Tangente in (x₀ | f(x₀)): t(x) = ${glied(2 * a, "x₀", false)} · x − ${glied(a, "x₀²", false)}. Q einsetzen: ${num(v)} = ${poly([[2 * a * u, "x₀"], [-a, "x₀²"]])}<br>` +
      `⟹ ${poly([[1, "x₀²"], [-2 * u, "x₀"], [v / a, ""]])} = 0 ⟹ x₀ = ${num(u)} ± √${v === 0 ? num(u * u) : `(${num(u * u)} ${plusMinus(-v / a)})`} = ${num(u)} ± ${num(x2 - u)}<br>` +
      `<strong>x₁ = ${num(x1)}, x₂ = ${num(x2)}</strong>. <strong>Probe:</strong> t(x) = ${poly([[2 * a * x1, "x"], [-a * x1 * x1, ""]])} geht durch Q: ${num(2 * a * x1 * u - a * x1 * x1)} = ${num(v)} ✓`,
  };
}

// ================= komplex =================

// ---------- K1: Parabel aus Bedingungen ----------
const K1_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const a of [1, -1, 2, -2, 0.5, 3]) for (const x2 of [-2, -1, 0, 1, 2, 3]) for (const x1 of [-2, -1, 0, 1, 2, 3]) for (const c of [-3, -1, 2, 4]) {
    if (x1 === x2) continue;
    out.push({ a, b: -2 * a * x2, c, x1, x2, m1: 2 * a * (x1 - x2) });
  }
  return out;
});
function generateK1() {
  // b = 0 macht den Vorzeichenfehler unsichtbar — dort NaN statt den Fall zu opfern.
  const k = ohneFeldKollision(K1_KANDIDATEN(), (v) => [[v.a, 2 * v.a], [v.b, v.b === 0 ? NaN : -v.b], [v.c]], EPS);
  const { a, b, c, x1, x2, m1 } = k;
  return {
    promptHtml: `Eine Parabel f(x) = ax² + bx + c geht durch P(0 | ${num(c)}), hat an der Stelle ${num(x1)} die Steigung ${num(m1)} und an der Stelle ${num(x2)} eine waagerechte Tangente.<br><strong>Bestimme a, b und c.</strong>` + ZAHL,
    felder: [
      { name: "a =", soll: a, toleranz: TOL, hinweis: (roh, v) => (nahe(v, 2 * a, TOL) ? "Die Ableitung von ax² ist 2ax — der Faktor 2 gehört zu a, nicht ins Ergebnis." : "Subtrahiere die beiden Steigungsgleichungen: b fällt heraus.") },
      { name: "b =", soll: b, toleranz: TOL, hinweis: (roh, v) => (nahe(v, -b, TOL) ? `Vorzeichen: 2a · ${numK(x2)} + b = 0 ⟹ b = −2a · ${numK(x2)}.` : "Setze a in f′(x₂) = 0 ein.") },
      { name: "c =", soll: c, toleranz: TOL, hinweis: () => "f(0) = c — P liegt auf der y-Achse." },
    ],
    tipps: ["f′(x) = 2ax + b. Drei Bedingungen: f(0), f′ an zwei Stellen.", `f(0) = c = ${num(c)}; f′(${num(x1)}) = 2a · ${numK(x1)} + b = ${num(m1)}; f′(${num(x2)}) = 2a · ${numK(x2)} + b = 0`],
    musterloesungHtml: `f(0) = c ⟹ c = ${num(c)}<br>` +
      `f′(${num(x1)}) − f′(${num(x2)}): 2a · (${num(x1)} − ${numK(x2)}) = ${num(m1)} ⟹ a = ${num(a)}<br>` +
      `f′(${num(x2)}) = 0: ${num(2 * a)} · ${numK(x2)} + b = 0 ⟹ b = ${num(b)}<br>` +
      `f(x) = <strong>${poly([[a, "x²"], [b, "x"], [c, ""]])}</strong>. <strong>Probe:</strong> f′(${num(x1)}) = ${num(2 * a * x1 + b)} ✓, f′(${num(x2)}) = ${num(2 * a * x2 + b)} ✓`,
  };
}

// ---------- K2: Durchschnitts- und Momentangeschwindigkeit ----------
const K2_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const a of [0.5, 1, 1.5, 2, 2.5]) for (const v0 of [0, 1, 2, 3, 4]) for (const t1 of [0, 1, 2]) for (const d of [2, 4]) {
    const t2 = t1 + d, s = (t) => a * t * t + v0 * t;
    out.push({ a, v0, t1, t2, vq: (s(t2) - s(t1)) / d, ts: (t1 + t2) / 2, ds: s(t2) - s(t1), vom0: s(t2) / t2 });
  }
  return out;
});
function generateK2() {
  // Fehler: Weg statt Geschwindigkeit; Durchschnitt vom Start an; v₀ beim Auflösen vergessen.
  const k = ohneFeldKollision(K2_KANDIDATEN(), (v) => [[v.vq, v.ds, v.t1 === 0 ? NaN : v.vom0], [v.ts, v.v0 === 0 ? NaN : v.vq / (2 * v.a)]], EPS);
  const { a, v0, t1, t2, vq, ts, ds } = k;
  const s = (t) => a * t * t + v0 * t;
  return {
    promptHtml: `Ein Wagen fährt los; nach t Sekunden hat er s(t) = ${poly([[a, "t²"], [v0, "t"]])} Meter zurückgelegt.<br>` +
      `<strong>a) Berechne die Durchschnittsgeschwindigkeit zwischen t = ${num(t1)} s und t = ${num(t2)} s. b) Zu welchem Zeitpunkt ist die Momentangeschwindigkeit genau so groß?</strong>` + ZAHL,
    felder: [
      { name: "v̄ in m/s:", soll: vq, toleranz: TOL, hinweis: (roh, v) => (nahe(v, ds, TOL) ? "Das ist der zurückgelegte Weg in Metern. Teile noch durch die Zeitspanne." : nahe(v, s(t2) / t2, TOL) ? `Das ist der Durchschnitt ab t = 0. Gefragt ist der Durchschnitt ab t = ${num(t1)} s.` : "v̄ = (s(t₂) − s(t₁)) : (t₂ − t₁).") },
      { name: "t in s:", soll: ts, toleranz: TOL, hinweis: (roh, v) => (nahe(v, vq / (2 * a), TOL) ? `s′(t) = ${poly([[2 * a, "t"], [v0, ""]])} — der Summand ${num(v0)} gehört dazu.` : "Löse s′(t) = v̄ nach t auf.") },
    ],
    tipps: [`s(${num(t2)}) = ${num(s(t2))}, s(${num(t1)}) = ${num(s(t1))}`, `Momentangeschwindigkeit: s′(t) = ${poly([[2 * a, "t"], [v0, ""]])}`],
    musterloesungHtml: `a) v̄ = ${bruch(`s(${num(t2)}) − s(${num(t1)})`, `${num(t2)} − ${num(t1)}`)} = ${bruch(`${num(s(t2))} − ${num(s(t1))}`, num(t2 - t1))} = <strong>${num(vq)} m/s</strong><br>` +
      `b) s′(t) = ${poly([[2 * a, "t"], [v0, ""]])} = ${num(vq)} ⟹ t = <strong>${num(ts)} s</strong><br>` +
      `Das ist genau die Mitte des Zeitintervalls — bei einer quadratischen Weg-Zeit-Funktion ist das immer so.`,
  };
}

// ---------- K3: biquadratische Funktion ----------
const K3_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const a of [0.5, 1, 2, -0.5, -1]) for (const k of [1, 2, 3]) for (const c of [-2, 0, 1, 3, 5]) out.push({ a, k, c, xT: k, yT: c - a * k ** 4 });
  return out;
});
function generateK3() {
  // Fehler: u = x² statt x angegeben; Höhe des Hochpunkts statt des Tiefpunkts; c vergessen.
  const k = ohneFeldKollision(K3_KANDIDATEN(), (v) => [[v.xT, v.k * v.k === v.xT ? NaN : v.k * v.k], [v.yT, v.c, v.c === 0 ? NaN : -v.a * v.k ** 4]], EPS);
  const { a, k: kk, c, xT, yT } = k;
  const term = poly([[a, "x⁴"], [-2 * a * kk * kk, "x²"], [c, ""]]);
  // Bei negativem Leitkoeffizienten sind die beiden äußeren Extrempunkte Hochpunkte.
  const art = a > 0 ? "Tiefpunkt" : "Hochpunkt", gegen = a > 0 ? "Hochpunkt H" : "Tiefpunkt T", P = a > 0 ? "T" : "H";
  return {
    promptHtml: `Gegeben ist f(x) = ${term}. Der Graph ist achsensymmetrisch zur y-Achse und hat zwei ${art}e.<br><strong>Bestimme den rechten ${art} ${P}(x | y).</strong>` + ZAHL,
    felder: [
      { name: "x =", soll: xT, toleranz: TOL, hinweis: (roh, v) => (nahe(v, kk * kk, TOL) ? "Das ist x², nicht x." : "f′(x) = 0 lösen: x ausklammern.") },
      { name: "y =", soll: yT, toleranz: TOL, hinweis: (roh, v) => (nahe(v, c, TOL) ? `Das ist f(0), die Höhe des ${gegen === "Hochpunkt H" ? "Hochpunkts" : "Tiefpunkts"} auf der y-Achse.` : nahe(v, -a * kk ** 4, TOL) ? `Das Absolutglied ${num(c)} fehlt.` : "Setze x in f ein.") },
    ],
    tipps: [`f′(x) = ${poly([[4 * a, "x³"], [-4 * a * kk * kk, "x"]])} = ${num(4 * a)}x(x² − ${num(kk * kk)})`, `Nullstellen von f′: 0 und ±${num(kk)}. Wegen der Symmetrie reicht die rechte.`],
    musterloesungHtml: `f′(x) = ${poly([[4 * a, "x³"], [-4 * a * kk * kk, "x"]])} = ${num(4 * a)}x(x − ${num(kk)})(x + ${num(kk)})<br>` +
      `f′ wechselt bei ${num(kk)} ${a > 0 ? "von − nach +: Tiefpunkt" : "von + nach −: Hochpunkt"}. f(${num(kk)}) = ${num(a * kk ** 4)} ${plusMinus(-2 * a * kk ** 4)}${c === 0 ? "" : " " + plusMinus(c)} = ${num(yT)}<br>` +
      `<strong>${P}(${num(xT)} | ${num(yT)})</strong>, wegen der Symmetrie auch ${P}(−${num(xT)} | ${num(yT)}); ${gegen}(0 | ${num(c)}).`,
  };
}

// ---------- K4: zweiter Schnittpunkt der Tangente ----------
const K4_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const a of [0.5, 1, 2, -1, -0.5]) for (const c of [-3, -1, 1, 2]) for (const x0 of [-2, -1, 1, 2, 0.5, 1.5]) {
    const f = (x) => a * x ** 3 + c * x;
    out.push({ a, c, x0, xs: -2 * x0, ys: f(-2 * x0), y0: f(x0), m: 3 * a * x0 * x0 + c });
  }
  return out;
});
function generateK4() {
  const k = ohneFeldKollision(K4_KANDIDATEN(), (v) => [[v.xs, v.x0, 2 * v.x0, -v.x0], [v.ys, v.y0]], EPS);
  const { a, c, x0, xs, ys, y0, m } = k;
  const b = y0 - m * x0;
  return {
    promptHtml: `Die Tangente an den Graphen von f(x) = ${poly([[a, "x³"], [c, "x"]])} im Punkt mit x₀ = ${num(x0)} schneidet den Graphen noch in einem zweiten Punkt S.<br><strong>Bestimme S.</strong>` + ZAHL,
    felder: [
      { name: "x =", soll: xs, toleranz: TOL, hinweis: (roh, v) => (nahe(v, x0, TOL) ? "Das ist der Berührpunkt selbst. Gesucht ist die andere Lösung von f(x) = t(x)." : nahe(v, 2 * x0, TOL) || nahe(v, -x0, TOL) ? "Teile f(x) − t(x) durch (x − x₀)² und prüfe die verbleibende Nullstelle genau." : "Löse f(x) = t(x): x₀ ist eine doppelte Lösung.") },
      { name: "y =", soll: ys, toleranz: TOL, hinweis: (roh, v) => (nahe(v, y0, TOL) ? "Das ist die Höhe des Berührpunkts." : "Setze die zweite Stelle in f oder in t ein.") },
    ],
    tipps: [`t(x) = ${poly([[m, "x"], [b, ""]])}`, `f(x) − t(x) = ${poly([[a, "x³"], [c - m, "x"], [-b, ""]])} hat bei x₀ = ${num(x0)} eine doppelte Nullstelle: Teile durch (x ${plusMinus(-x0)})².`],
    musterloesungHtml: `f′(x) = ${poly([[3 * a, "x²"], [c, ""]])}, f′(${num(x0)}) = ${num(m)}, f(${num(x0)}) = ${num(y0)} ⟹ t(x) = ${poly([[m, "x"], [b, ""]])}<br>` +
      `f(x) − t(x) = ${poly([[a, "x³"], [c - m, "x"], [-b, ""]])} = ${a === 1 ? "" : a === -1 ? "−" : num(a) + " · "}(x ${plusMinus(-x0)})² · (x ${plusMinus(2 * x0)})<br>` +
      `Zweite Nullstelle x = ${num(xs)}; f(${num(xs)}) = ${num(ys)}: <strong>S(${num(xs)} | ${num(ys)})</strong>. <strong>Probe:</strong> t(${num(xs)}) = ${num(m * xs + b)} ✓`,
  };
}

// ---------- K5: Kettenregel und Tangente ----------
const K5_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const a of [1, 2, 3, 4, 6, 8, -2]) for (const k of [1, 2, 3, 4]) for (const x0 of [-2, -1, 0, 1, 2, 3, 4]) {
    const b = k * k - a * x0, m = a / (2 * k), n = k - m * x0;
    if (glatt(m, 4) && glatt(n, 4) && Math.abs(b) <= 20) out.push({ a, b, k, x0, m, n });
  }
  return out;
});
function generateK5() {
  const k = ohneFeldKollision(K5_KANDIDATEN(), (v) => [[v.m, v.a === 1 ? NaN : 1 / (2 * v.k)], [v.n, v.k]], EPS);
  const { a, b, k: w, x0, m, n } = k;
  const innen = poly([[a, "x"], [b, ""]]);
  return {
    promptHtml: `Gegeben ist f(x) = √(${innen}).<br><strong>Bestimme die Tangente an den Graphen im Punkt mit x₀ = ${num(x0)}</strong> in der Form t(x) = m · x + b.` + ZAHL,
    felder: [
      { name: "m =", soll: m, toleranz: TOL, hinweis: (roh, v) => (nahe(v, 1 / (2 * w), TOL) ? `Die innere Ableitung fehlt: (${innen})′ = ${num(a)}.` : "f′(x) = 1 : (2√(…)) · innere Ableitung.") },
      { name: "b =", soll: n, toleranz: TOL, hinweis: (roh, v) => (nahe(v, w, TOL) ? `f(${num(x0)}) = ${num(w)} ist die y-Koordinate von P, nicht der Achsenabschnitt.` : "b = f(x₀) − m · x₀.") },
    ],
    tipps: [`f(${num(x0)}) = √${num(w * w)} = ${num(w)}`, `f′(x) = ${bruch(num(a), `2√(${innen})`)}`],
    musterloesungHtml: `f′(x) = ${bruch("1", `2√(${innen})`)} · ${numK(a)} = ${bruch(num(a), `2√(${innen})`)}<br>` +
      `f(${num(x0)}) = ${num(w)}, f′(${num(x0)}) = ${bruch(num(a), num(2 * w))} = ${num(m)}<br>` +
      `t(x) = ${num(m)} · (x ${plusMinus(-x0)}) + ${num(w)} = <strong>${poly([[m, "x"], [n, ""]])}</strong>. <strong>Probe:</strong> t(${num(x0)}) = ${num(m * x0 + n)} = f(${num(x0)}) ✓`,
  };
}

// ================= Ableitungsfunktionen bestimmen (Termeingabe, je Stufe eine) =================
// Die Funktionen setzen sich aus Gliedern zusammen, die ihre Ableitung exakt kennen
// (mathematik/terme.js) — so gibt es beliebig viele, und die Musterlösung entsteht aus denselben
// Gliedern wie die Angabe. Geprüft wird die getippte Ableitung numerisch, mit Fehlerdiagnose.

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

// einfach: ganzrational, Grad 2 bis 4.
function generateE6() {
  return ableitungsAufgabe(zufallsPolynom(2, 4, zufall([2, 3]), [...KOEFF, q(1, 2), q(-1, 2), q(3, 2)]));
}
// mittel: Potenz, negative Hochzahl und Wurzel.
function generateM6() {
  return ableitungsAufgabe(mische([
    pot(zufall(KOEFF), zufall([2, 3, 4])),
    pot(zufall(KOEFF), zufall([-1, -2, -3])),
    pot(zufall(KLEIN), zufall([q(1, 2), q(-1, 2), q(3, 2)])),
  ]));
}
// schwierig: Kettenregel — lineare Verkettung und/oder Sinus bzw. Kosinus mit innerer Funktion.
function generateS6() {
  const verkettet = [
    kette(zufall([1, 2, 3, -1, -2]), zufall([2, 3, 4]), zufall([1, 2, 3]), zufall([2, 3, 4, 5, -1, -2, q(1, 2)])),
    trig(zufall(KLEIN), zufall(["sin", "cos"]), zufall([2, 3, 4, q(1, 2)]), zufall([0, 0, 1])),
  ];
  return ableitungsAufgabe([...mische(verkettet).slice(0, zufall([1, 2])), pot(zufall(KOEFF), zufall([1, 2, 3]))]);
}
// komplex: Produktregel, innen auch mit Kettenregel.
function generateK6() {
  const v = zufall([trig(1, zufall(["sin", "cos"]), zufall([1, 2, 3])), kette(1, zufall([2, 3]), zufall([1, 2]), zufall([2, 3]))]);
  const gl = [prod(zufall([1, 2, 3, -1, -2]), zufall([1, 2, 3]), v)];
  if (zufall([true, false])) gl.push(zufall([pot(zufall(KOEFF), zufall([2, 3])), trig(zufall(KLEIN), zufall(["sin", "cos"]), zufall([1, 2]))]));
  return ableitungsAufgabe(gl);
}

export const AUFGABEN = [
  { schwierigkeit: "einfach", titel: "Mittlere Änderungsrate", generate: generateE1 },
  { schwierigkeit: "einfach", titel: "Ableitung an einer Stelle", generate: generateE2 },
  { schwierigkeit: "einfach", titel: "Negative Exponenten und Wurzeln", generate: generateE3 },
  { schwierigkeit: "einfach", titel: "Steigungswinkel", generate: generateE4 },
  { schwierigkeit: "einfach", titel: "Waagerechte Tangente", generate: generateE5 },
  { schwierigkeit: "einfach", titel: "Ableitungsfunktion: ganzrational", generate: generateE6, wuerfelText: "🎲 Neue Funktion" },
  { schwierigkeit: "mittel", titel: "Differenzenquotient für festes x", generate: generateM1 },
  { schwierigkeit: "mittel", titel: "Tangentengleichung", generate: generateM2 },
  { schwierigkeit: "mittel", titel: "Normalengleichung", generate: generateM3 },
  { schwierigkeit: "mittel", titel: "Nullstellen durch Substitution", generate: generateM4 },
  { schwierigkeit: "mittel", titel: "Hoch- oder Tiefpunkt", generate: generateM5 },
  { schwierigkeit: "mittel", titel: "Ableitungsfunktion: Potenzen und Wurzeln", generate: generateM6, wuerfelText: "🎲 Neue Funktion" },
  { schwierigkeit: "schwierig", titel: "Schnittwinkel", generate: generateS1 },
  { schwierigkeit: "schwierig", titel: "Differenzierbar zusammensetzen", generate: generateS2 },
  { schwierigkeit: "schwierig", titel: "Kettenregel", generate: generateS3 },
  { schwierigkeit: "schwierig", titel: "Produktregel", generate: generateS4 },
  { schwierigkeit: "schwierig", titel: "Tangenten von außen", generate: generateS5 },
  { schwierigkeit: "schwierig", titel: "Ableitungsfunktion: Kettenregel", generate: generateS6, wuerfelText: "🎲 Neue Funktion" },
  { schwierigkeit: "komplex", titel: "Parabel aus Bedingungen", generate: generateK1 },
  { schwierigkeit: "komplex", titel: "Durchschnitt und Augenblick", generate: generateK2 },
  { schwierigkeit: "komplex", titel: "Biquadratische Funktion", generate: generateK3 },
  { schwierigkeit: "komplex", titel: "Die Tangente schneidet wieder", generate: generateK4 },
  { schwierigkeit: "komplex", titel: "Kettenregel und Tangente", generate: generateK5 },
  { schwierigkeit: "komplex", titel: "Ableitungsfunktion: Produktregel", generate: generateK6, wuerfelText: "🎲 Neue Funktion" },
];
