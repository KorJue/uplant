// Die acht Übungsaufgaben zu „Terme mit Klammern multiplizieren“ — zwei je Stufe.
//
// Gefragt ist immer der fertig ausmultiplizierte und zusammengefasste Term (form "normal"); termwerk.js
// vergleicht exakt. Jeder vorgesehene Fehler — fehlende gemischte Produkte, ein verlorenes Vorzeichen,
// ein Faktor in beiden Klammern — ist selbst ein Polynom mit eigenem Hinweis.
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
const K = (k, v) => (k < 0 ? `(${G(k, v)})` : G(k, v));
const P = (text, vars = ["x"]) => T.P(text, vars);
const STELLE = { x: 1.37, a: 1.73, b: 2.39 };
const schluessel = (p) => T.wert(p, STELLE);
const fertig = (p, vars = ["x"]) => T.text(p, { reihenfolge: vars });
const kollision = (f) => (v) => { const p = f(v); return [p.soll, ...p.falsch.map((x) => x[0])].map(schluessel); };
// Die vier Produkte von (p + q) · (r + s) als Text: „x · x + x · 5 + (−3) · x + (−3) · 5“.
const vierProdukte = (g1, g2) => g1.flatMap((u) => g2.map((v) => `${u.startsWith("−") ? `(${u})` : u} · ${v.startsWith("−") ? `(${v})` : v}`)).join(" + ");

// ================= einfach =================

// ---------- D1: (x + a) · (x + b) ----------
function d1Polys({ a, b }) {
  return {
    soll: P(S([1, "x²"], [a + b, "x"], [a * b, ""])),
    falsch: [
      [P(S([1, "x²"], [a * b, ""])), `Es fehlen die gemischten Produkte x · ${b} und ${a} · x — im Rechteck die beiden Streifenblöcke.`],
      [P(S([1, "x²"], [a + b, "x"], [a + b, ""])), `Das letzte Glied ist das Produkt ${a} · ${b} = ${a * b}, nicht die Summe.`],
    ],
  };
}
const D1_KANDIDATEN = spaeter(() => {
  const l = [];
  for (const a of [1, 2, 3, 4, 5, 6, 7, 9]) for (const b of [2, 3, 4, 5, 6, 8]) if (a !== b) l.push({ a, b });
  return l;
});
function generateD1() {
  const x = ohneKollision(D1_KANDIDATEN(), kollision(d1Polys));
  const { a, b } = x;
  const { soll, falsch } = d1Polys(x);
  const term = `(x + ${a}) · (x + ${b})`;
  return T.termAufgabe({
    promptHtml: `Multipliziere aus und fasse zusammen: <strong>${term}</strong>`,
    soll, variablen: ["x"], form: "normal", falsch,
    tipps: [
      "Jedes Glied der ersten Klammer mal jedes Glied der zweiten — das sind 2 · 2 = 4 Produkte.",
      `${vierProdukte(["x", String(a)], ["x", String(b)])}`,
      "Die beiden x-Glieder sind gleichartig — zusammenfassen.",
    ],
    musterloesungHtml:
      `${term} = ${vierProdukte(["x", String(a)], ["x", String(b)])}<br>` +
      `= ${S([1, "x²"], [b, "x"], [a, "x"], [a * b, ""])} = <strong>${fertig(soll)}</strong>`,
    platzhalter: "ausmultiplizierter Term",
  });
}

// ---------- D2: (x ± a) · (x ± b) mit Vorzeichen ----------
function d2Polys({ a, b }) {
  return {
    soll: P(S([1, "x²"], [a + b, "x"], [a * b, ""])),
    falsch: [
      [P(S([1, "x²"], [a * b, ""])), "Es fehlen die gemischten Produkte — jedes Glied mal jedes, das sind vier."],
      [P(S([1, "x²"], [a + b, "x"], [-a * b, ""])), `Das Vorzeichen des letzten Produkts stimmt nicht: ${K(a, "")} · ${K(b, "")} = ${num(a * b)}.`],
      [P(S([1, "x²"], [-(a + b), "x"], [a * b, ""])), `Bei den x-Gliedern stimmt ein Vorzeichen nicht: x · ${K(b, "")} = ${G(b, "x")} und ${K(a, "")} · x = ${G(a, "x")}.`],
    ],
  };
}
const D2_KANDIDATEN = spaeter(() => {
  const l = [];
  for (const a of [-7, -5, -4, -3, -2, -1, 2, 3, 6]) for (const b of [-6, -5, -3, -2, 1, 4, 5, 8]) {
    if (a < 0 || b < 0) l.push({ a, b });   // mindestens ein Minus — sonst wäre es D1
  }
  return l;
});
function generateD2() {
  const x = ohneKollision(D2_KANDIDATEN(), kollision(d2Polys));
  const { a, b } = x;
  const { soll, falsch } = d2Polys(x);
  const term = `(${S([1, "x"], [a, ""])}) · (${S([1, "x"], [b, ""])})`;
  return T.termAufgabe({
    promptHtml: `Multipliziere aus und fasse zusammen: <strong>${term}</strong>`,
    soll, variablen: ["x"], form: "normal", falsch,
    tipps: [
      "Jedes Glied mal jedes — und jedes Glied mit seinem Vorzeichen.",
      `${vierProdukte(["x", G(a, "")], ["x", G(b, "")])}`,
      "Plus mal Minus gibt Minus, Minus mal Minus gibt Plus. Dann die x-Glieder zusammenfassen.",
    ],
    musterloesungHtml:
      `${term} = ${vierProdukte(["x", G(a, "")], ["x", G(b, "")])}<br>` +
      `= ${S([1, "x²"], [b, "x"], [a, "x"], [a * b, ""])} = <strong>${fertig(soll)}</strong>`,
    platzhalter: "ausmultiplizierter Term",
  });
}

// ================= mittel =================

// ---------- D3: (m x + a) · (n x + b) ----------
function d3Polys({ m, a, n, b }) {
  return {
    soll: P(S([m * n, "x²"], [m * b + a * n, "x"], [a * b, ""])),
    falsch: [
      [P(S([m * n, "x²"], [a * b, ""])), "Es fehlen die gemischten Produkte — jedes Glied mal jedes, das sind vier."],
      [P(S([m * n, "x²"], [m * b, "x"], [a * b, ""])), `Ein Produkt fehlt: ${K(a, "")} · ${G(n, "x")} = ${G(a * n, "x")}.`],
      [P(S([m * n, "x²"], [m * b + a * n, "x"], [-a * b, ""])), `Das Vorzeichen des letzten Produkts stimmt nicht: ${K(a, "")} · ${K(b, "")} = ${num(a * b)}.`],
      [P(S([m + n, "x"], [m * b + a * n, "x"], [a * b, ""])), `${G(m, "x")} · ${G(n, "x")} ist ${G(m * n, "x²")} — Zahlen mal Zahlen, x · x = x².`],
    ],
  };
}
const D3_KANDIDATEN = spaeter(() => {
  const l = [];
  for (const m of [2, 3, 5]) for (const n of [1, 2, 4]) for (const a of [-5, -3, -1, 2, 4]) for (const b of [-4, -2, 1, 3, 7]) {
    if (m * b + a * n !== 0) l.push({ m, a, n, b });   // sonst verschwände das x-Glied
  }
  return l;
});
function generateD3() {
  const x = ohneKollision(D3_KANDIDATEN(), kollision(d3Polys));
  const { m, a, n, b } = x;
  const { soll, falsch } = d3Polys(x);
  const term = `(${S([m, "x"], [a, ""])}) · (${S([n, "x"], [b, ""])})`;
  return T.termAufgabe({
    promptHtml: `Multipliziere aus und fasse zusammen: <strong>${term}</strong>`,
    soll, variablen: ["x"], form: "normal", falsch,
    tipps: [
      "Vier Produkte: erstes Glied mal beide, zweites Glied mal beide.",
      `${vierProdukte([G(m, "x"), G(a, "")], [G(n, "x"), G(b, "")])}`,
      `Erstes Produkt: ${G(m, "x")} · ${G(n, "x")} = ${G(m * n, "x²")}.`,
    ],
    musterloesungHtml:
      `${term} = ${vierProdukte([G(m, "x"), G(a, "")], [G(n, "x"), G(b, "")])}<br>` +
      `= ${S([m * n, "x²"], [m * b, "x"], [a * n, "x"], [a * b, ""])} = <strong>${fertig(soll)}</strong>`,
    platzhalter: "ausmultiplizierter Term",
  });
}

// ---------- D4: zwei Variablen ----------
function d4Polys({ p, q, r, s }) {
  const V = ["a", "b"];
  return {
    soll: P(S([p * r, "a²"], [p * s + q * r, "ab"], [q * s, "b²"]), V),
    falsch: [
      [P(S([p * r, "a²"], [q * s, "b²"]), V), "Es fehlen die gemischten Produkte mit a · b."],
      [P(S([p * r, "a²"], [p * s + q * r, "ab"], [-q * s, "b²"]), V), `Das Vorzeichen beim b²-Glied stimmt nicht: ${K(q, "b")} · ${K(s, "b")} = ${G(q * s, "b²")}.`],
      [P(S([p * r, "a²"], [p * s - q * r, "ab"], [q * s, "b²"]), V), `Bei den ab-Gliedern stimmt ein Vorzeichen nicht: ${K(q, "b")} · ${G(r, "a")} = ${G(q * r, "ab")}.`],
    ],
  };
}
const D4_KANDIDATEN = spaeter(() => {
  const l = [];
  for (const p of [1, 2, 3]) for (const q of [-3, -1, 2, 4]) for (const r of [1, 2, 5]) for (const s of [-2, -1, 3]) {
    if (p * s + q * r !== 0) l.push({ p, q, r, s });
  }
  return l;
});
function generateD4() {
  const x = ohneKollision(D4_KANDIDATEN(), kollision(d4Polys));
  const { p, q, r, s } = x;
  const { soll, falsch } = d4Polys(x);
  const V = ["a", "b"];
  const term = `(${S([p, "a"], [q, "b"])}) · (${S([r, "a"], [s, "b"])})`;
  return T.termAufgabe({
    promptHtml: `Multipliziere aus und fasse zusammen: <strong>${term}</strong>`,
    soll, variablen: V, form: "normal", falsch,
    tipps: [
      "Vier Produkte, jedes mit Vorzeichen. a · a = a², a · b = ab, b · b = b².",
      `${vierProdukte([G(p, "a"), G(q, "b")], [G(r, "a"), G(s, "b")])}`,
      "ab und ba sind gleichartig — zusammenfassen.",
    ],
    musterloesungHtml:
      `${term} = ${vierProdukte([G(p, "a"), G(q, "b")], [G(r, "a"), G(s, "b")])}<br>` +
      `= ${S([p * r, "a²"], [p * s, "ab"], [q * r, "ab"], [q * s, "b²"])} = <strong>${fertig(soll, V)}</strong>`,
    platzhalter: "ausmultiplizierter Term",
  });
}

// ================= schwierig =================

// ---------- D5: Ein Faktor vor dem Produkt ----------
function d5Polys({ k, a, b }) {
  return {
    soll: P(S([k, "x²"], [k * (a + b), "x"], [k * a * b, ""])),
    falsch: [
      [P(S([k * k, "x²"], [k * k * (a + b), "x"], [k * k * a * b, ""])), `Der Faktor ${num(k)} gilt nur einmal: Er gehört in eine der Klammern, nicht in beide.`],
      [P(S([k, "x²"], [a + b, "x"], [a * b, ""])), `Der Faktor ${num(k)} wird mit jedem Glied des Produkts multipliziert, nicht nur mit x².`],
    ],
  };
}
const D5_KANDIDATEN = spaeter(() => {
  const l = [];
  for (const k of [-3, -2, 2, 3, 4]) for (const a of [-4, -2, 1, 3, 5]) for (const b of [-5, -1, 2, 6]) if (a + b !== 0) l.push({ k, a, b });
  return l;
});
function generateD5() {
  const x = ohneKollision(D5_KANDIDATEN(), kollision(d5Polys));
  const { k, a, b } = x;
  const { soll, falsch } = d5Polys(x);
  const innen = P(S([1, "x²"], [a + b, "x"], [a * b, ""]));
  const term = `${num(k)} · (${S([1, "x"], [a, ""])}) · (${S([1, "x"], [b, ""])})`;
  return T.termAufgabe({
    promptHtml: `Multipliziere aus und fasse zusammen: <strong>${term}</strong>`,
    soll, variablen: ["x"], form: "normal", falsch,
    tipps: [
      "Erst die beiden Klammern miteinander, das Ergebnis in Klammern stehen lassen.",
      `(${S([1, "x"], [a, ""])}) · (${S([1, "x"], [b, ""])}) = ${fertig(innen)}`,
      `Dann ${num(k)} mit jedem Glied multiplizieren.`,
    ],
    musterloesungHtml:
      `${term} = ${num(k)} · (${fertig(innen)}) = <strong>${fertig(soll)}</strong>`,
    platzhalter: "ausmultiplizierter Term",
  });
}

// ---------- D6: Differenz zweier Produkte ----------
function d6Polys({ a, b, c, d }) {
  return {
    soll: P(S([a + b - c - d, "x"], [a * b - c * d, ""])),
    falsch: [
      [P(S([a + b + c + d, "x"], [a * b + c * d, ""])), "Das Minus gilt für das ganze zweite Produkt: Erst ausmultiplizieren, in Klammern stehen lassen, dann jedes Vorzeichen umdrehen."],
      [P(S([2, "x²"], [a + b + c + d, "x"], [a * b + c * d, ""])), "Vor dem zweiten Produkt steht ein Minus — es wird abgezogen, nicht addiert."],
    ],
  };
}
const D6_KANDIDATEN = spaeter(() => {
  const l = [];
  for (const a of [1, 3, 5]) for (const b of [2, -4]) for (const c of [2, -1, 4]) for (const d of [-3, 1, 6]) {
    if (a + b - c - d !== 0 && a * b - c * d !== 0) l.push({ a, b, c, d });
  }
  return l;
});
function generateD6() {
  const x = ohneKollision(D6_KANDIDATEN(), kollision(d6Polys));
  const { a, b, c, d } = x;
  const { soll, falsch } = d6Polys(x);
  const k = (u, v) => `(${S([1, "x"], [u, ""])}) · (${S([1, "x"], [v, ""])})`;
  const p1 = P(S([1, "x²"], [a + b, "x"], [a * b, ""])), p2 = P(S([1, "x²"], [c + d, "x"], [c * d, ""]));
  const term = `${k(a, b)} − ${k(c, d)}`;
  return T.termAufgabe({
    promptHtml: `Multipliziere aus und fasse zusammen: <strong>${term}</strong>`,
    soll, variablen: ["x"], form: "normal", falsch,
    tipps: [
      "Multipliziere jedes Produkt für sich aus und lass das Ergebnis in Klammern stehen.",
      `(${fertig(p1)}) − (${fertig(p2)})`,
      "Dann die Minusklammer auflösen: jedes Vorzeichen in ihr umdrehen.",
    ],
    musterloesungHtml:
      `${term} = (${fertig(p1)}) − (${fertig(p2)})<br>` +
      `= ${fertig(p1)} ${S([-1, "x²"], [-(c + d), "x"], [-c * d, ""]).replace(/^−/, "− ")} = <strong>${fertig(soll)}</strong>`,
    platzhalter: "vereinfachter Term",
  });
}

// ================= komplex =================

// ---------- D7: Wie ändert sich der Flächeninhalt? ----------
// Ein Quadrat mit der Seite x: eine Seite a länger, die andere b kürzer (a > b). Der Flächeninhalt
// bleibt bei x = ab : (a − b) gleich — nur Paare, bei denen das eine ganze Zahl ist.
const D7_PAARE = [[2, 1], [3, 2], [4, 2], [6, 3], [4, 3], [6, 4], [5, 4], [6, 2], [8, 4], [10, 5]];
function generateD7() {
  const [a, b] = pick(D7_PAARE);
  const neu = P(S([1, "x²"], [a - b, "x"], [-a * b, ""]));
  const aend = P(S([a - b, "x"], [-a * b, ""]));
  const gleich = (a * b) / (a - b);
  return {
    promptHtml:
      `Ein Quadrat hat die Seitenlänge x (in cm). Eine Seite wird um ${a} cm verlängert, die andere um ${b} cm verkürzt. ` +
      `<strong>Gib einen Term für den neuen Flächeninhalt an und einen für die Änderung gegenüber dem Quadrat. Für welche Seitenlänge x bleibt der Flächeninhalt gleich?</strong>` + T.EINGABE_HINWEIS,
    felder: [
      T.termFeld({
        name: "neuer Flächeninhalt", soll: neu, variablen: ["x"], form: "normal", platzhalter: "ausmultipliziert",
        falsch: [[P(S([1, "x²"], [-a * b, ""])), `Es fehlen die gemischten Produkte x · (−${b}) und ${a} · x.`], [P(S([1, "x²"], [a - b, "x"], [a * b, ""])), `Das Vorzeichen des letzten Produkts stimmt nicht: ${a} · (−${b}) = −${a * b}.`]],
      }),
      T.termFeld({
        name: "Änderung (neu − alt)", soll: aend, variablen: ["x"], form: "normal", platzhalter: "Term",
        falsch: [[P(S([b - a, "x"], [a * b, ""])), "Das ist alt − neu. Gefragt ist neu − alt: Wird der Flächeninhalt größer, ist die Änderung positiv."], [neu, "Das ist der neue Flächeninhalt selbst. Zieh das Quadrat x² davon ab."]],
      }),
      {
        name: "gleich groß für x =", soll: gleich, toleranz: 1e-9, platzhalter: "x in cm",
        hinweis: (roh, val) => {
          if (trifft(val, a * b)) return `Die Änderung ist ${fertig(aend)}. Sie ist null, wenn ${G(a - b, "x")} = ${a * b} ist — teile also noch durch ${a - b}.`;
          if (trifft(val, a - b)) return `Setz x = ${num(val)} in die Änderung ein: ${fertig(aend)} ergibt dann ${num((a - b) * val - a * b)}, nicht 0.`;
          return `Die Änderung ${fertig(aend)} muss 0 sein. Probier Werte aus oder rechne rückwärts.`;
        },
      },
    ],
    tipps: [
      `Die neuen Seiten sind x + ${a} und x − ${b}.`,
      `Neuer Flächeninhalt: (x + ${a}) · (x − ${b}). Für die Änderung zieh x² ab.`,
      `Gleich groß heißt: Die Änderung ${fertig(aend)} ist 0.`,
    ],
    musterloesungHtml:
      `<strong>Neu:</strong> (x + ${a}) · (x − ${b}) = x² − ${b}x + ${a}x − ${a * b} = <strong>${fertig(neu)}</strong><br>` +
      `<strong>Änderung:</strong> ${fertig(neu)} − x² = <strong>${fertig(aend)}</strong><br>` +
      `<strong>Gleich groß:</strong> ${G(a - b, "x")} − ${a * b} = 0 für x = ${a * b} : ${a - b} = <strong>${num(gleich)}</strong><br>` +
      `<em>Probe:</em> ${num(gleich + a)} · ${num(gleich - b)} = ${num((gleich + a) * (gleich - b))} = ${num(gleich)}² ✓`,
  };
}

// ---------- D8: Restfläche mit einem Loch ----------
// Ein Rechteck (m x + a) breit und (x + b) hoch, aus dem ein Quadrat mit der Seite x ausgeschnitten
// ist. Die Maße stehen an der Figur.
function lochFigur(breite, hoehe, loch) {
  const t = (x, y, s, rolle, anker = "middle") => `<text x="${x}" y="${y}" text-anchor="${anker}" class="tm-figur-mass" data-rolle="${rolle}">${s}</text>`;
  return `<svg viewBox="0 0 360 200" width="360" height="200" class="tm-aufgaben-figur" data-figur="loch" role="img" aria-label="Rechteck mit quadratischem Loch">` +
    `<rect x="80" y="20" width="240" height="140" class="tm-figur-flaeche tm-figur-flaeche-b" data-rolle="aussen"/>` +
    `<rect x="210" y="45" width="80" height="80" class="tm-figur-loch" data-rolle="loch"/>` +
    t(200, 182, breite, "breite") + t(70, 95, hoehe, "hoehe", "end") + t(250, 92, loch, "loch-seite") + `</svg>`;
}
const D8_KANDIDATEN = spaeter(() => {
  const l = [];
  for (const m of [2, 3]) for (const a of [1, 3, 4, 5]) for (const b of [2, 3, 6]) for (const x0 of [4, 5, 10]) l.push({ m, a, b, x0 });
  return l;
});
function generateD8() {
  const x = ohneKollision(D8_KANDIDATEN(), ({ m, a, b, x0 }) => [(m * x0 + a) * (x0 + b) - x0 * x0, (m * x0 + a) * (x0 + b), (m - 1) * x0 * x0 + a * b]);
  const { m, a, b, x0 } = x;
  const rest = P(S([m - 1, "x²"], [m * b + a, "x"], [a * b, ""]));
  const ganz = P(S([m, "x²"], [m * b + a, "x"], [a * b, ""]));
  const wert = T.wert(rest, { x: x0 });
  return {
    promptHtml:
      `Aus einer rechteckigen Platte wird ein quadratisches Loch ausgeschnitten (Maße in cm). ` +
      `<strong>Stelle einen Term für die Restfläche auf und vereinfache ihn. Wie groß ist die Restfläche für x = ${x0}?</strong>` +
      lochFigur(S([m, "x"], [a, ""]), S([1, "x"], [b, ""]), "x") + T.EINGABE_HINWEIS,
    felder: [
      T.termFeld({
        name: "Restfläche", soll: rest, variablen: ["x"], form: "normal", platzhalter: "Term",
        falsch: [[ganz, "Das ist die ganze Platte. Das Loch x · x = x² muss noch abgezogen werden."], [P(S([m - 1, "x²"], [a * b, ""])), "Es fehlen die gemischten Produkte der beiden Klammern."]],
      }),
      {
        name: `Restfläche für x = ${x0}`, soll: wert, toleranz: 1e-9, platzhalter: "in cm²",
        hinweis: (roh, val) => {
          if (trifft(val, T.wert(ganz, { x: x0 }))) return `Das ist die ganze Platte. Zieh das Loch ab: ${x0} · ${x0} = ${x0 * x0}.`;
          return `Setz x = ${x0} in deinen Term ein — oder rechne ${m * x0 + a} · ${x0 + b} − ${x0}².`;
        },
      },
    ],
    tipps: [
      "Restfläche = ganze Platte − Loch.",
      `Platte: (${S([m, "x"], [a, ""])}) · (x + ${b}); Loch: x · x = x².`,
      `Probe für x = ${x0}: ${m * x0 + a} · ${x0 + b} − ${x0 * x0}.`,
    ],
    musterloesungHtml:
      `<strong>Platte:</strong> (${S([m, "x"], [a, ""])}) · (x + ${b}) = ${S([m, "x²"], [m * b, "x"], [a, "x"], [a * b, ""])} = ${fertig(ganz)}<br>` +
      `<strong>Rest:</strong> ${fertig(ganz)} − x² = <strong>${fertig(rest)}</strong><br>` +
      `<strong>Für x = ${x0}:</strong> ${m - 1 === 1 ? "" : `${m - 1} · `}${x0}² + ${m * b + a} · ${x0} + ${a * b} = ${num(wert)} cm²<br>` +
      `<em>Probe:</em> ${m * x0 + a} · ${x0 + b} − ${x0 * x0} = ${num(wert)} ✓`,
  };
}

// ================= Liste =================

export const AUFGABEN = [
  { schwierigkeit: "einfach", titel: "Zwei Summen multiplizieren", abschnitt: "sec-rechteck", generate: generateD1 },
  { schwierigkeit: "einfach", titel: "Mit Vorzeichen", abschnitt: "sec-jeder", generate: generateD2 },
  { schwierigkeit: "mittel", titel: "Mit Zahlen vor x", abschnitt: "sec-jeder", generate: generateD3 },
  { schwierigkeit: "mittel", titel: "Mit zwei Variablen", abschnitt: "sec-jeder", generate: generateD4 },
  { schwierigkeit: "schwierig", titel: "Ein Faktor vor dem Produkt", abschnitt: "sec-mehrere", generate: generateD5 },
  { schwierigkeit: "schwierig", titel: "Differenz zweier Produkte", abschnitt: "sec-mehrere", generate: generateD6 },
  { schwierigkeit: "komplex", titel: "Wie ändert sich der Flächeninhalt?", abschnitt: "sec-anwenden", generate: generateD7 },
  { schwierigkeit: "komplex", titel: "Restfläche mit Loch", abschnitt: ["sec-rechteck", "sec-anwenden"], generate: generateD8 },
];
