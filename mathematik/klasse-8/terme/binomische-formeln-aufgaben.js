// Die acht Übungsaufgaben zu „Binomische Formeln anwenden“ — zwei je Stufe.
//
// Vorwärts ist der fertig ausmultiplizierte Term gefragt (form "normal"), rückwärts die Produktform
// (form "produkt"). termwerk.js vergleicht exakt; jeder vorgesehene Fehler — das fehlende gemischte
// Glied, ab statt 2ab, −b² statt +b², a statt a² — ist selbst ein Polynom mit eigenem Hinweis.
//
// Alle Zahlen kommen aus vorher gefilterten Listen, nie durch Verwerfen und Neuziehen.

"use strict";

import * as T from "./termwerk.js?v=1";
import { num, pick, trifft, ohneKollision, spaeter } from "./seite.js?v=1";

function S(...glieder) {
  return glieder.filter(([k]) => k !== 0).map(([k, v], i) => {
    const b = Math.abs(k);
    const kern = v === "" ? num(b) : (b === 1 ? "" : num(b)) + v;
    if (i === 0) return (k < 0 ? "−" : "") + kern;
    return (k < 0 ? " − " : " + ") + kern;
  }).join("") || "0";
}
const G = (k, v) => S([k, v]);
const P = (text, vars = ["x"]) => T.P(text, vars);
const STELLE = { x: 1.37, a: 1.73, b: 2.39 };
const schluessel = (p) => T.wert(p, STELLE);
const fertig = (p, vars = ["x"]) => T.text(p, { reihenfolge: vars });
const kollision = (f) => (v) => { const p = f(v); return [p.soll, ...p.falsch.map((x) => x[0])].map(schluessel); };
const NAME = { 1: "erste", 2: "zweite", 3: "dritte" };
const ggT = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };

// ================= einfach =================

// ---------- E1: (x ± a)² ----------
function e1Polys({ s, a }) {
  return {
    soll: P(S([1, "x²"], [2 * s * a, "x"], [a * a, ""])),
    falsch: [
      [P(S([1, "x²"], [a * a, ""])), `Das gemischte Glied fehlt: 2 · x · ${a} = ${2 * a}x. Im Quadratbild sind das die beiden Rechtecke.`],
      [P(S([1, "x²"], [s * a, "x"], [a * a, ""])), `Das gemischte Glied ist das DOPPELTE Produkt: 2 · x · ${a} = ${2 * a}x — es gibt zwei Rechtecke.`],
      [P(S([1, "x²"], [2 * s * a, "x"], [-a * a, ""])), `Das letzte Glied ist ${a}² = ${a * a} — ein Quadrat ist nie negativ.`],
      [P(S([1, "x²"], [2 * s * a, "x"], [2 * a, ""])), `${a}² heißt ${a} · ${a} = ${a * a}, nicht ${a} · 2.`],
    ],
  };
}
const E1_KANDIDATEN = spaeter(() => {
  const l = [];
  for (const s of [1, -1]) for (const a of [1, 3, 4, 5, 6, 7, 8, 9, 10, 12]) l.push({ s, a });
  return l;
});
function generateE1() {
  const x = ohneKollision(E1_KANDIDATEN(), kollision(e1Polys));
  const { s, a } = x;
  const { soll, falsch } = e1Polys(x);
  const term = `(x ${s > 0 ? "+" : "−"} ${a})²`;
  const f = s > 0 ? 1 : 2;
  return T.termAufgabe({
    promptHtml: `Multipliziere mit der ${NAME[f]}n binomischen Formel aus: <strong>${term}</strong>`,
    soll, variablen: ["x"], form: "normal", falsch,
    tipps: [
      `${f === 1 ? "(a + b)² = a² + 2ab + b²" : "(a − b)² = a² − 2ab + b²"} mit a = x und b = ${a}.`,
      `Das gemischte Glied: 2 · x · ${a} = ${2 * a}x.`,
      `Das letzte Glied: ${a}² = ${a * a}.`,
    ],
    musterloesungHtml: `${term} = x² ${s > 0 ? "+" : "−"} 2 · x · ${a} + ${a}² = <strong>${fertig(soll)}</strong>`,
    platzhalter: "ausmultiplizierter Term",
  });
}

// ---------- E2: (x + a)(x − a) ----------
function e2Polys({ a, umgekehrt }) {
  // umgekehrt: (a + x)(a − x) = a² − x²
  return umgekehrt
    ? { soll: P(S([-1, "x²"], [a * a, ""])), falsch: [[P(S([1, "x²"], [-a * a, ""])), `Hier steht die Zahl vorn: (${a} + x) · (${a} − x) = ${a}² − x². Das Minus gehört vor das x².`], [P(S([1, "x²"], [a * a, ""])), "Plus mal Minus gibt Minus: Das zweite Quadrat wird abgezogen."]] }
    : { soll: P(S([1, "x²"], [-a * a, ""])), falsch: [[P(S([1, "x²"], [a * a, ""])), `Plus mal Minus gibt Minus: ${a} · (−${a}) = −${a * a}.`], [P(S([1, "x²"], [-2 * a, "x"], [-a * a, ""])), "Bei der dritten Formel heben sich die gemischten Glieder auf: −ax + ax = 0."]] };
}
const E2_KANDIDATEN = spaeter(() => {
  const l = [];
  for (const a of [2, 3, 4, 5, 6, 7, 8, 9, 11, 12]) for (const umgekehrt of [false, true]) l.push({ a, umgekehrt });
  return l;
});
function generateE2() {
  const x = ohneKollision(E2_KANDIDATEN(), kollision(e2Polys));
  const { a, umgekehrt } = x;
  const { soll, falsch } = e2Polys(x);
  const term = umgekehrt ? `(${a} + x) · (${a} − x)` : `(x + ${a}) · (x − ${a})`;
  return T.termAufgabe({
    promptHtml: `Multipliziere mit der dritten binomischen Formel aus: <strong>${term}</strong>`,
    soll, variablen: ["x"], form: "normal", falsch,
    tipps: [
      "(a + b) · (a − b) = a² − b².",
      umgekehrt ? `Hier ist a = ${a} und b = x.` : `Hier ist a = x und b = ${a}.`,
      "Ein gemischtes Glied gibt es nicht — es hebt sich auf.",
    ],
    musterloesungHtml: `${term} = ${umgekehrt ? `${a}² − x²` : `x² − ${a}²`} = <strong>${fertig(soll)}</strong>`,
    platzhalter: "ausmultiplizierter Term",
  });
}

// ================= mittel =================

// ---------- E3: (m x ± a)² ----------
function e3Polys({ m, s, a }) {
  return {
    soll: P(S([m * m, "x²"], [2 * s * m * a, "x"], [a * a, ""])),
    falsch: [
      [P(S([m, "x²"], [2 * s * m * a, "x"], [a * a, ""])), `Auch die Zahl vor x wird quadriert: (${m}x)² = ${m * m}x².`],
      [P(S([m * m, "x²"], [a * a, ""])), `Das gemischte Glied fehlt: 2 · ${m}x · ${a} = ${2 * m * a}x.`],
      [P(S([m * m, "x²"], [s * m * a, "x"], [a * a, ""])), `Das gemischte Glied ist das doppelte Produkt: 2 · ${m}x · ${a} = ${2 * m * a}x.`],
      [P(S([m * m, "x²"], [2 * s * m * a, "x"], [-a * a, ""])), `Das letzte Glied ist ${a}² = ${a * a} — positiv, auch bei der zweiten Formel.`],
    ],
  };
}
const E3_KANDIDATEN = spaeter(() => {
  const l = [];
  for (const m of [2, 3, 4, 5]) for (const s of [1, -1]) for (const a of [1, 2, 3, 5, 7]) l.push({ m, s, a });
  return l;
});
function generateE3() {
  const x = ohneKollision(E3_KANDIDATEN(), kollision(e3Polys));
  const { m, s, a } = x;
  const { soll, falsch } = e3Polys(x);
  const term = `(${m}x ${s > 0 ? "+" : "−"} ${a})²`;
  return T.termAufgabe({
    promptHtml: `Multipliziere aus: <strong>${term}</strong>`,
    soll, variablen: ["x"], form: "normal", falsch,
    tipps: [
      `Welche Formel? ${s > 0 ? "Plus in der Klammer: die erste." : "Minus in der Klammer: die zweite."} a = ${m}x, b = ${a}.`,
      `a² = (${m}x)² = ${m}x · ${m}x = ${m * m}x².`,
      `2ab = 2 · ${m}x · ${a} = ${2 * m * a}x, b² = ${a * a}.`,
    ],
    musterloesungHtml: `${term} = (${m}x)² ${s > 0 ? "+" : "−"} 2 · ${m}x · ${a} + ${a}² = <strong>${fertig(soll)}</strong>`,
    platzhalter: "ausmultiplizierter Term",
  });
}

// ---------- E4: zwei Variablen ----------
function e4Polys({ p, q, f }) {
  const V = ["a", "b"];
  if (f === 3) {
    return { soll: P(S([p * p, "a²"], [-q * q, "b²"]), V), falsch: [[P(S([p * p, "a²"], [q * q, "b²"]), V), "Plus mal Minus gibt Minus: Das zweite Quadrat wird abgezogen."], [P(S([p, "a²"], [-q, "b²"]), V), `Quadriert werden auch die Zahlen: (${p}a)² = ${p * p}a², (${q}b)² = ${q * q}b².`]] };
  }
  const s = f === 1 ? 1 : -1;
  return {
    soll: P(S([p * p, "a²"], [2 * s * p * q, "ab"], [q * q, "b²"]), V),
    falsch: [
      [P(S([p * p, "a²"], [q * q, "b²"]), V), `Das gemischte Glied fehlt: 2 · ${p}a · ${q}b = ${2 * p * q}ab.`],
      [P(S([p * p, "a²"], [s * p * q, "ab"], [q * q, "b²"]), V), `Das gemischte Glied ist das doppelte Produkt: 2 · ${p}a · ${q}b = ${2 * p * q}ab.`],
      [P(S([p, "a²"], [2 * s * p * q, "ab"], [q, "b²"]), V), `Quadriert werden auch die Zahlen: (${p}a)² = ${p * p}a², (${q}b)² = ${q * q}b².`],
    ],
  };
}
const E4_KANDIDATEN = spaeter(() => {
  const l = [];
  for (const f of [1, 2, 3]) for (const p of [2, 3, 5]) for (const q of [2, 3, 4, 7]) if (p !== q) l.push({ p, q, f });
  return l;
});
function generateE4() {
  const x = ohneKollision(E4_KANDIDATEN(), kollision(e4Polys));
  const { p, q, f } = x;
  const { soll, falsch } = e4Polys(x);
  const V = ["a", "b"];
  const term = f === 3 ? `(${p}a + ${q}b) · (${p}a − ${q}b)` : `(${p}a ${f === 1 ? "+" : "−"} ${q}b)²`;
  return T.termAufgabe({
    promptHtml: `Multipliziere aus: <strong>${term}</strong>`,
    soll, variablen: V, form: "normal", falsch,
    tipps: [
      `Das ist die ${NAME[f]} binomische Formel — mit ${p}a an der Stelle von a und ${q}b an der Stelle von b.`,
      `(${p}a)² = ${p * p}a² und (${q}b)² = ${q * q}b².`,
      f === 3 ? "Ein gemischtes Glied gibt es hier nicht." : `2 · ${p}a · ${q}b = ${2 * p * q}ab.`,
    ],
    musterloesungHtml: `${term} = ${f === 3 ? `(${p}a)² − (${q}b)²` : `(${p}a)² ${f === 1 ? "+" : "−"} 2 · ${p}a · ${q}b + (${q}b)²`} = <strong>${fertig(soll, V)}</strong>`,
    platzhalter: "ausmultiplizierter Term",
  });
}

// ================= schwierig =================

// ---------- E5: Rückwärts — als Produkt schreiben ----------
// f = 1: m²x² + 2max + a² = (mx + a)²; f = 2: … − … = (mx − a)²; f = 3: m²x² − a² = (mx + a)(mx − a).
function e5Polys({ f, m, a }) {
  const mx = G(m, "x");
  const quadrat = (s) => P(`(${mx} ${s > 0 ? "+" : "-"} ${a})^2`);
  if (f === 3) {
    return { soll: P(S([m * m, "x²"], [-a * a, ""])), produkt: `(${mx} + ${a}) · (${mx} − ${a})`, falsch: [[quadrat(-1), `(${mx} − ${a})² hätte noch ein gemischtes Glied. Zwei Quadrate mit Minus dazwischen: dritte Formel.`]] };
  }
  const s = f === 1 ? 1 : -1;
  return { soll: quadrat(s), produkt: `(${mx} ${s > 0 ? "+" : "−"} ${a})²`, falsch: [[quadrat(-s), `Das Vorzeichen in der Klammer stimmt nicht: Das gemischte Glied hat ${s > 0 ? "ein Plus" : "ein Minus"}.`], [P(`(${mx} + ${a}) * (${mx} - ${a})`), "Die dritte Formel hat kein gemischtes Glied — hier gibt es eines."]] };
}
const E5_KANDIDATEN = spaeter(() => {
  const l = [];
  // m und a teilerfremd: Sonst steckte in der Klammer noch ein gemeinsamer Faktor, und (2x + 2)² wäre
  // zwar richtig, aber nicht die einfachste Produktform.
  for (const f of [1, 2, 3]) for (const m of [1, 2, 3, 5]) for (const a of [1, 2, 3, 4, 6, 7]) if (ggT(m, a) === 1) l.push({ f, m, a });
  return l;
});
function generateE5() {
  const x = ohneKollision(E5_KANDIDATEN(), (v) => { const p = e5Polys(v); return [p.soll, ...p.falsch.map((y) => y[0])].map(schluessel); });
  const { f, m, a } = x;
  const { soll, produkt, falsch } = e5Polys(x);
  const summe = fertig(soll);
  return T.termAufgabe({
    promptHtml: `Schreibe als Produkt — mit einer binomischen Formel rückwärts: <strong>${summe}</strong>`,
    soll, variablen: ["x"], form: "produkt", falsch,
    formHinweis: "Gleichwertig — aber gefragt ist die Produktform: eine Klammer im Quadrat oder zwei Klammern mal einander.",
    tipps: [
      f === 3 ? "Zwei Glieder, beide Quadrate, ein Minus dazwischen." : "Drei Glieder: Sind das erste und das letzte Quadrate? Ist das mittlere das doppelte Produkt?",
      `${m * m === 1 ? "x²" : `${m * m}x²`} = (${G(m, "x")})² und ${a * a} = ${a}².`,
      f === 3 ? "a² − b² = (a + b) · (a − b)." : `2 · ${G(m, "x")} · ${a} = ${G(2 * m * a, "x")} — ${f === 1 ? "mit Plus: (a + b)²" : "mit Minus: (a − b)²"}.`,
    ],
    musterloesungHtml:
      `${summe} = <strong>${produkt}</strong> — die ${NAME[f]} binomische Formel rückwärts.<br>` +
      `<em>Probe:</em> ausmultipliziert ergibt ${produkt} wieder ${summe} ✓`,
    platzhalter: "Produkt",
  });
}

// ---------- E6: Kopfrechnen ----------
// n = z ± d mit einer runden Zahl z: n² mit der ersten oder zweiten Formel, (z − d)(z + d) mit der dritten.
const E6_KANDIDATEN = spaeter(() => {
  const l = [];
  for (const z of [20, 30, 40, 50, 60, 70, 80, 100]) for (const d of [1, 2, 3]) for (const f of [1, 2, 3]) l.push({ z, d, f });
  return l;
});
function e6Werte({ z, d, f }) {
  if (f === 3) return { aufgabe: `${z - d} · ${z + d}`, richtig: z * z - d * d, falsch: [[z * z, `Das ist nur ${z}². Die dritte Formel zieht noch ${d}² = ${d * d} ab.`], [z * z + d * d, `${d}² wird abgezogen, nicht addiert: (a − b) · (a + b) = a² − b².`]] };
  const s = f === 1 ? 1 : -1;
  return {
    aufgabe: `${z + s * d}²`, richtig: (z + s * d) ** 2,
    falsch: [[z * z + d * d, `Das gemischte Glied fehlt: 2 · ${z} · ${d} = ${2 * z * d}.`], [z * z + s * z * d + d * d, `Das gemischte Glied ist das doppelte Produkt: 2 · ${z} · ${d} = ${2 * z * d}.`], [z * z + 2 * s * z * d - d * d, `Das letzte Glied ist ${d}² = ${d * d} und wird addiert.`]],
  };
}
function generateE6() {
  const x = ohneKollision(E6_KANDIDATEN(), (v) => { const w = e6Werte(v); return [w.richtig, ...w.falsch.map((y) => y[0])]; });
  const { z, d, f } = x;
  const { aufgabe, richtig, falsch } = e6Werte(x);
  const zerlegt = f === 3 ? `(${z} − ${d}) · (${z} + ${d}) = ${z}² − ${d}²` : `(${z} ${f === 1 ? "+" : "−"} ${d})² = ${z}² ${f === 1 ? "+" : "−"} 2 · ${z} · ${d} + ${d}²`;
  return {
    promptHtml: `Rechne im Kopf mit einer binomischen Formel: <strong>${aufgabe}</strong>`,
    correct: richtig, tolerance: 1e-9, placeholder: "Ergebnis",
    hinweis: (roh, val) => {
      for (const [w, h] of falsch) if (trifft(val, w)) return h;
      return `Schreib die Zahl als ${f === 3 ? `${z} − ${d} und ${z} + ${d}` : `${z} ${f === 1 ? "+" : "−"} ${d}`} und benutze die ${NAME[f]} binomische Formel.`;
    },
    tipps: [
      f === 3 ? `${z - d} und ${z + d} liegen gleich weit um ${z}.` : `${z + (f === 1 ? d : -d)} = ${z} ${f === 1 ? "+" : "−"} ${d}.`,
      zerlegt,
      f === 3 ? `${z * z} − ${d * d}` : `${z * z} ${f === 1 ? "+" : "−"} ${2 * z * d} + ${d * d}`,
    ],
    musterloesungHtml: `${aufgabe} = ${zerlegt} = ${f === 3 ? `${z * z} − ${d * d}` : `${z * z} ${f === 1 ? "+" : "−"} ${2 * z * d} + ${d * d}`} = <strong>${num(richtig)}</strong>`,
  };
}

// ================= komplex =================

// ---------- E7: Zwei Formeln in einem Term ----------
// „qq“: (x + a)² − (x − a)² = 4ax; „q3“: (x + a)² − (x + a)(x − a) = 2ax + 2a²; „3q“: (x + a)(x − a) − (x − a)² = 2ax − 2a².
function e7Polys({ art, a }) {
  if (art === "qq") {
    return { term: `(x + ${a})² − (x − ${a})²`, soll: P(S([4 * a, "x"])), falsch: [[P(S([2 * a * a, ""])), `Das Minus gilt für das ganze zweite Quadrat: −(x² − ${2 * a}x + ${a * a}) = −x² + ${2 * a}x − ${a * a}.`], [P(S([2, "x²"], [2 * a * a, ""])), "Vor dem zweiten Quadrat steht ein Minus — es wird abgezogen."]] };
  }
  if (art === "q3") {
    return { term: `(x + ${a})² − (x + ${a}) · (x − ${a})`, soll: P(S([2 * a, "x"], [2 * a * a, ""])), falsch: [[P(S([2 * a, "x"])), `Das Minus gilt für das ganze Produkt: −(x² − ${a * a}) = −x² + ${a * a}.`], [P(S([2, "x²"], [2 * a, "x"])), "Vor dem Produkt steht ein Minus — es wird abgezogen."]] };
  }
  return { term: `(x + ${a}) · (x − ${a}) − (x − ${a})²`, soll: P(S([2 * a, "x"], [-2 * a * a, ""])), falsch: [[P(S([-2 * a, "x"])), `Das Minus gilt für das ganze Quadrat: −(x² − ${2 * a}x + ${a * a}) = −x² + ${2 * a}x − ${a * a}.`], [P(S([2, "x²"], [-2 * a, "x"])), "Vor dem Quadrat steht ein Minus — es wird abgezogen."]] };
}
const E7_KANDIDATEN = spaeter(() => {
  const l = [];
  for (const art of ["qq", "q3", "3q"]) for (const a of [1, 2, 3, 4, 5, 6, 7, 9]) l.push({ art, a });
  return l;
});
function generateE7() {
  const x = ohneKollision(E7_KANDIDATEN(), (v) => { const p = e7Polys(v); return [p.soll, ...p.falsch.map((y) => y[0])].map(schluessel); });
  const { art, a } = x;
  const { term, soll, falsch } = e7Polys(x);
  const teile = { qq: [`x² + ${2 * a}x + ${a * a}`, `x² − ${2 * a}x + ${a * a}`], q3: [`x² + ${2 * a}x + ${a * a}`, `x² − ${a * a}`], "3q": [`x² − ${a * a}`, `x² − ${2 * a}x + ${a * a}`] }[art];
  return T.termAufgabe({
    promptHtml: `Vereinfache mit den binomischen Formeln: <strong>${term}</strong>`,
    soll, variablen: ["x"], form: "normal", falsch,
    tipps: [
      "Wende auf jeden Teil die passende Formel an und lass das Ergebnis in Klammern stehen.",
      `(${teile[0]}) − (${teile[1]})`,
      "Dann die Minusklammer auflösen und zusammenfassen.",
    ],
    musterloesungHtml:
      `${term} = (${teile[0]}) − (${teile[1]})<br>` +
      `= <strong>${fertig(soll)}</strong> — die x² heben sich auf.`,
    platzhalter: "vereinfachter Term",
  });
}

// ---------- E8: Lücken füllen ----------
// (□ ± □)² = m²x² ± 2max + a²: das erste Glied (ein Term) und das zweite (eine Zahl) sind gesucht.
const E8_KANDIDATEN = spaeter(() => {
  const l = [];
  for (const m of [2, 3, 4, 5, 6]) for (const a of [1, 3, 4, 5, 7, 8]) for (const s of [1, -1]) l.push({ m, a, s });
  return l;
});
function generateE8() {
  const x = ohneKollision(E8_KANDIDATEN(), ({ m, a }) => [a, a * a, m * a, 2 * m * a]);
  const { m, a, s } = x;
  const summe = S([m * m, "x²"], [2 * s * m * a, "x"], [a * a, ""]);
  return {
    promptHtml: `Fülle die Lücken: <strong>(□ ${s > 0 ? "+" : "−"} □)² = ${summe}</strong>` + T.EINGABE_HINWEIS,
    felder: [
      T.termFeld({
        name: "erste Lücke", soll: P(`${m}x`), variablen: ["x"], form: "beliebig", platzhalter: "Term mit x",
        falsch: [[P(`${m * m}x`), `Gesucht ist das, was quadriert ${m * m}x² ergibt: (${m}x)² = ${m * m}x².`], [P(`${m * m}x^2`), `Das ist schon das Quadrat. In die Lücke gehört die Wurzel daraus: ${m}x.`]],
      }),
      {
        name: "zweite Lücke", soll: a, toleranz: 1e-9, platzhalter: "Zahl",
        hinweis: (roh, val) => {
          if (trifft(val, a * a)) return `${a * a} ist schon das Quadrat. In die Lücke gehört die Zahl, die quadriert ${a * a} ergibt.`;
          if (trifft(val, m * a)) return `Das gemischte Glied ist 2 · ${m}x · □ = ${2 * m * a}x — die Lücke ist also ${2 * m * a} : (2 · ${m}).`;
          if (trifft(val, 2 * m * a)) return `${2 * m * a} ist die Zahl vor x, also 2 · ${m} · □. Teile noch durch ${2 * m}.`;
          return `Welche Zahl ergibt quadriert ${a * a}? Prüfe dann das gemischte Glied: 2 · ${m}x · □ = ${2 * m * a}x.`;
        },
      },
    ],
    tipps: [
      `Das erste Glied rechts ist ${m * m}x² = (□)².`,
      `Das letzte Glied ist ${a * a} = (□)².`,
      `Probe mit dem gemischten Glied: 2 · ${m}x · ${a} = ${2 * m * a}x ✓`,
    ],
    musterloesungHtml:
      `${m * m}x² = (${m}x)² und ${a * a} = ${a}²; das gemischte Glied passt: 2 · ${m}x · ${a} = ${2 * m * a}x.<br>` +
      `<strong>(${m}x ${s > 0 ? "+" : "−"} ${a})² = ${summe}</strong>`,
  };
}

// ================= Liste =================

export const AUFGABEN = [
  { schwierigkeit: "einfach", titel: "Erste oder zweite Formel", abschnitt: ["sec-erste", "sec-zweite"], generate: generateE1 },
  { schwierigkeit: "einfach", titel: "Die dritte Formel", abschnitt: "sec-dritte", generate: generateE2 },
  { schwierigkeit: "mittel", titel: "Mit einer Zahl vor x", abschnitt: ["sec-erste", "sec-zweite"], generate: generateE3 },
  { schwierigkeit: "mittel", titel: "Mit zwei Variablen", abschnitt: ["sec-erste", "sec-zweite", "sec-dritte"], generate: generateE4 },
  { schwierigkeit: "schwierig", titel: "Rückwärts: als Produkt schreiben", abschnitt: "sec-anwenden", generate: generateE5 },
  { schwierigkeit: "schwierig", titel: "Im Kopf rechnen", abschnitt: "sec-anwenden", generate: generateE6 },
  { schwierigkeit: "komplex", titel: "Zwei Formeln in einem Term", abschnitt: ["sec-erste", "sec-zweite", "sec-dritte"], generate: generateE7 },
  { schwierigkeit: "komplex", titel: "Lücken füllen", abschnitt: "sec-anwenden", generate: generateE8 },
];
