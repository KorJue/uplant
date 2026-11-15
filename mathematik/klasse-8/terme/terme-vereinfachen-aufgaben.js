// Die acht Übungsaufgaben zu „Terme vereinfachen“ — zwei je Stufe.
//
// Gefragt ist immer der FERTIGE Term: termwerk.js prüft exakt, ob die Eingabe gleichwertig ist, und
// danach, ob sie vereinfacht ist (keine Klammern, keine zwei gleichartigen Glieder). Die Reihenfolge
// der Glieder ist frei. Jeder vorgesehene Fehler ist selbst ein Polynom; trifft die Eingabe ihn,
// nennt die Seite den Grund.
//
// Alle Zahlen kommen aus vorher gefilterten Listen oder werden unabhängig voneinander gezogen, wo
// keine Kombination stören kann — nie durch Verwerfen und Neuziehen.

"use strict";

import * as T from "./termwerk.js?v=1";
import { num, pick, trifft, ohneKollision, spaeter } from "./seite.js?v=1";

// Eine Summe von Gliedern als Text: S([3, "x"], [-1, "x"], [5, ""]) → „3x − x + 5“. Das Vorzeichen
// steckt nur hier — nicht an jeder Stelle einzeln.
function S(...glieder) {
  return glieder.map(([k, v], i) => {
    const b = Math.abs(k);
    const kern = v === "" ? num(b) : (b === 1 ? "" : num(b)) + v;
    if (i === 0) return (k < 0 ? "−" : "") + kern;
    return (k < 0 ? " − " : " + ") + kern;
  }).join("");
}
// Ein Polynom aus einem Text mit echtem Minus (P liest − und · selbst).
const P = (text, vars = ["x"]) => T.P(text, vars);
// Ein Schlüssel zum Vergleichen zweier Polynome: der Wert an einer krummen Stelle. Zwei verschiedene
// Polynome mit kleinen ganzen Zahlen fallen dort nicht zusammen.
const STELLE = { x: 1.37, y: 2.11, a: 1.73 };
const schluessel = (p) => T.wert(p, STELLE);
const fertig = (p, vars = ["x"]) => T.text(p, { reihenfolge: vars });

// ================= einfach =================

// ---------- B1: Gleichartige Glieder zusammenfassen ----------
// Drei Reihenfolgen derselben fünf Glieder: a x, + b, − c x, + d x, − e.
const B1_FOLGEN = [
  (a, b, c, d, e) => S([a, "x"], [b, ""], [-c, "x"], [d, "x"], [-e, ""]),
  (a, b, c, d, e) => S([b, ""], [a, "x"], [-e, ""], [-c, "x"], [d, "x"]),
  (a, b, c, d, e) => S([a, "x"], [-c, "x"], [b, ""], [d, "x"], [-e, ""]),
];
function b1Polys({ a, b, c, d, e }) {
  return {
    soll: P(S([a - c + d, "x"], [b - e, ""])),
    falsch: [
      [P(S([a - c + d + b - e, "x"])), "Zahlen und x-Glieder sind nicht gleichartig: Die Zahlen bleiben für sich, nur die x-Glieder werden zusammengezählt."],
      [P(S([a + c + d, "x"], [b - e, ""])), `Vor ${S([c, "x"])} steht ein Minus — es gehört zum Glied: ${S([c, "x"])} wird abgezogen.`],
      [P(S([a - c + d, "x"], [b + e, ""])), `Vor der ${num(e)} steht ein Minus — die Zahl wird abgezogen, nicht addiert.`],
    ],
  };
}
const B1_KANDIDATEN = spaeter(() => {
  const liste = [];
  for (const f of [0, 1, 2]) for (const a of [2, 3, 5, 6]) for (const b of [3, 4, 7, 8]) for (const c of [1, 2, 4]) for (const d of [2, 3]) for (const e of [2, 5, 6, 9]) {
    // Ohne x-Glied oder ohne Zahl im Ergebnis wäre der Fehler „alles zusammengezählt“ nicht zu sehen.
    if (a - c + d !== 0 && b - e !== 0) liste.push({ f, a, b, c, d, e });
  }
  return liste;
});
function generateB1() {
  const k = ohneKollision(B1_KANDIDATEN(), (x) => { const p = b1Polys(x); return [p.soll, ...p.falsch.map((f) => f[0])].map(schluessel); });
  const { f, a, b, c, d, e } = k;
  const { soll, falsch } = b1Polys(k);
  const term = B1_FOLGEN[f](a, b, c, d, e);
  return T.termAufgabe({
    promptHtml: `Fasse zusammen: <strong>${term}</strong>`,
    soll, variablen: ["x"], form: "normal", falsch,
    tipps: [
      "Markiere die x-Glieder und die Zahlen in zwei verschiedenen Farben — jedes mit seinem Vorzeichen.",
      `x-Glieder: ${S([a, "x"], [-c, "x"], [d, "x"])} = ${S([a - c + d, "x"])}.`,
      `Zahlen: ${S([b, ""], [-e, ""])} = ${num(b - e)}.`,
    ],
    musterloesungHtml:
      `<strong>Ordnen:</strong> ${S([a, "x"], [-c, "x"], [d, "x"], [b, ""], [-e, ""])}<br>` +
      `<strong>x-Glieder:</strong> ${num(a)} − ${num(c)} + ${num(d)} = ${num(a - c + d)}, also ${S([a - c + d, "x"])}<br>` +
      `<strong>Zahlen:</strong> ${num(b)} − ${num(e)} = ${num(b - e)}<br>` +
      `Ergebnis: <strong>${fertig(soll)}</strong>`,
    platzhalter: "vereinfachter Term",
  });
}

// ---------- B2: Produkte vereinfachen ----------
// art: „xy“ a x · b y, „xx“ a x · b x, „x1“ a · x · b. s = −1 setzt ein Minus vor den ersten Faktor.
function b2Polys({ art, s, a, b }) {
  const v = { xy: "xy", xx: "x²", x1: "x" }[art];
  const vars = art === "xy" ? ["x", "y"] : ["x"];
  const falsch = [[P(S([s * (a + b), v]), vars), `Die Zahlen eines Produkts werden multipliziert, nicht addiert: ${num(a)} · ${num(b)} = ${num(a * b)}.`]];
  if (art === "xx") {
    falsch.push([P(S([s * a * b, "x"])), "x · x ist x², nicht x — das Rechteck aus zwei x-Seiten ist ein Quadrat."]);
    falsch.push([P(S([2 * s * a * b, "x"])), "x · x ist x², nicht 2x: Malnehmen ist nicht Addieren."]);
  }
  if (s < 0) falsch.push([P(S([a * b, v]), vars), "Das Vorzeichen fehlt: Minus mal Plus ergibt Minus."]);
  return { soll: P(S([s * a * b, v]), vars), falsch, vars, v };
}
const B2_KANDIDATEN = spaeter(() => {
  const liste = [];
  for (const art of ["xy", "xx", "x1"]) for (const s of [1, -1]) for (const a of [2, 3, 4, 5, 6, 7]) for (const b of [2, 3, 4, 5, 8, 9]) liste.push({ art, s, a, b });
  return liste;
});
function generateB2() {
  const k = ohneKollision(B2_KANDIDATEN(), (x) => { const p = b2Polys(x); return [p.soll, ...p.falsch.map((f) => f[0])].map(schluessel); });
  const { art, s, a, b } = k;
  const { soll, falsch, vars, v } = b2Polys(k);
  const vz = s < 0 ? "−" : "";
  const term = art === "xy" ? `${vz}${a}x · ${b}y` : art === "xx" ? `${vz}${a}x · ${b}x` : `${vz}${a} · x · ${b}`;
  const zerlegt = art === "xy" ? `${vz}${a} · ${b} · x · y` : art === "xx" ? `${vz}${a} · ${b} · x · x` : `${vz}${a} · ${b} · x`;
  return T.termAufgabe({
    promptHtml: `Vereinfache das Produkt: <strong>${term}</strong>`,
    soll, variablen: vars, form: "normal", falsch,
    tipps: [
      "In einem Produkt darf man die Faktoren vertauschen: erst alle Zahlen, dann alle Variablen.",
      `${zerlegt} — multipliziere zuerst die Zahlen.`,
      art === "xx" ? "x · x schreibt man als x²." : art === "xy" ? "x · y schreibt man als xy." : "Übrig bleibt ein x.",
    ],
    musterloesungHtml:
      `${term} = ${zerlegt} = ${s < 0 ? "−" : ""}${num(a * b)} · ${v} = <strong>${fertig(soll, vars)}</strong><br>` +
      `<em>Begründung:</em> Kommutativgesetz (Faktoren vertauschen) und Assoziativgesetz (anders zusammenfassen).`,
    platzhalter: "vereinfachter Term",
  });
}

// ================= mittel =================

// ---------- B3: Zwei Sorten zusammenfassen ----------
// „q“: a x² + b x − c x² + d x; „y“: a x + b y − c x − d y + e.
function b3Polys({ art, a, b, c, d, e }) {
  if (art === "q") {
    return {
      vars: ["x"],
      term: S([a, "x²"], [b, "x"], [-c, "x²"], [d, "x"]),
      soll: P(S([a - c, "x²"], [b + d, "x"])),
      falsch: [
        [P(S([a - c + b + d, "x²"])), "x² und x sind nicht gleichartig — ein Quadrat und ein Streifen lassen sich nicht zusammenlegen."],
        [P(S([a - c + b + d, "x"])), "x² und x sind nicht gleichartig: Die x²-Glieder und die x-Glieder werden getrennt zusammengefasst."],
        [P(S([a + c, "x²"], [b + d, "x"])), `Vor ${S([c, "x²"])} steht ein Minus — es wird abgezogen.`],
      ],
      ordnen: `${S([a, "x²"], [-c, "x²"], [b, "x"], [d, "x"])}`,
    };
  }
  return {
    vars: ["x", "y"],
    term: S([a, "x"], [b, "y"], [-c, "x"], [-d, "y"], [e, ""]),
    soll: P(S([a - c, "x"], [b - d, "y"], [e, ""]), ["x", "y"]),
    falsch: [
      [P(S([a - c + b - d, "xy"], [e, ""]), ["x", "y"]), "x und y sind nicht gleichartig: x + y lässt sich nicht kürzer schreiben — und ist schon gar nicht xy."],
      [P(S([a - c, "x"], [b + d, "y"], [e, ""]), ["x", "y"]), `Vor ${S([d, "y"])} steht ein Minus — es wird abgezogen.`],
      [P(S([a - c + b - d, "x"], [e, ""]), ["x", "y"]), "Die y-Glieder gehören nicht zu den x-Gliedern — fasse x und y getrennt zusammen."],
    ],
    ordnen: `${S([a, "x"], [-c, "x"], [b, "y"], [-d, "y"], [e, ""])}`,
  };
}
const B3_KANDIDATEN = spaeter(() => {
  const liste = [];
  for (const art of ["q", "y"]) for (const a of [3, 5, 6, 8]) for (const b of [2, 4, 7]) for (const c of [1, 2, 4]) for (const d of [1, 3, 5]) for (const e of [2, 6]) {
    if (art === "q" && e !== 2) continue;   // die Zahl e kommt nur in der x-y-Fassung vor
    if (a !== c && (art === "q" || b !== d)) liste.push({ art, a, b, c, d, e });
  }
  return liste;
});
function generateB3() {
  const k = ohneKollision(B3_KANDIDATEN(), (x) => { const p = b3Polys(x); return [p.soll, ...p.falsch.map((f) => f[0])].map(schluessel); });
  const { art, a, b, c, d } = k;
  const { vars, term, soll, falsch, ordnen } = b3Polys(k);
  return T.termAufgabe({
    promptHtml: `Fasse zusammen: <strong>${term}</strong>`,
    soll, variablen: vars, form: "normal", falsch,
    tipps: [
      art === "q" ? "x²-Glieder und x-Glieder sind verschiedene Sorten — fasse sie getrennt zusammen." : "x-Glieder, y-Glieder und die Zahl sind drei verschiedene Sorten.",
      `Ordne zuerst: ${ordnen}.`,
      art === "q" ? `x²-Glieder: ${num(a)} − ${num(c)} = ${num(a - c)}.` : `x-Glieder: ${num(a)} − ${num(c)} = ${num(a - c)}; y-Glieder: ${num(b)} − ${num(d)} = ${num(b - d)}.`,
    ],
    musterloesungHtml:
      `<strong>Ordnen:</strong> ${ordnen}<br>` +
      (art === "q"
        ? `<strong>x²-Glieder:</strong> ${num(a)} − ${num(c)} = ${num(a - c)}; <strong>x-Glieder:</strong> ${num(b)} + ${num(d)} = ${num(b + d)}<br>`
        : `<strong>x-Glieder:</strong> ${num(a)} − ${num(c)} = ${num(a - c)}; <strong>y-Glieder:</strong> ${num(b)} − ${num(d)} = ${num(b - d)}; die Zahl bleibt<br>`) +
      `Ergebnis: <strong>${fertig(soll, vars)}</strong>`,
    platzhalter: "vereinfachter Term",
  });
}

// ---------- B4: Eine Minusklammer auflösen ----------
// „a“: a x − (b x − c); „b“: a − (b x + c); „c“: a x + c − (b x − d).
function b4Polys({ art, a, b, c, d }) {
  if (art === "a") {
    return {
      term: `${S([a, "x"])} − (${S([b, "x"], [-c, ""])})`,
      ohne: S([a, "x"], [-b, "x"], [c, ""]),
      soll: P(S([a - b, "x"], [c, ""])),
      falsch: [
        [P(S([a - b, "x"], [-c, ""])), `Die Minusklammer dreht jedes Vorzeichen um, nicht nur das erste: aus −${num(c)} wird +${num(c)}.`],
        [P(S([a + b, "x"], [-c, ""])), "Vor der Klammer steht ein Minus — alles in der Klammer wird abgezogen, auch das erste Glied."],
      ],
    };
  }
  if (art === "b") {
    return {
      term: `${num(a)} − (${S([b, "x"], [c, ""])})`,
      ohne: S([a, ""], [-b, "x"], [-c, ""]),
      soll: P(S([-b, "x"], [a - c, ""])),
      falsch: [
        [P(S([-b, "x"], [a + c, ""])), `Die Minusklammer dreht jedes Vorzeichen um, nicht nur das erste: aus +${num(c)} wird −${num(c)}.`],
        [P(S([b, "x"], [a + c, ""])), "Vor der Klammer steht ein Minus — alles in der Klammer wird abgezogen, auch das erste Glied."],
      ],
    };
  }
  return {
    term: `${S([a, "x"], [c, ""])} − (${S([b, "x"], [-d, ""])})`,
    ohne: S([a, "x"], [c, ""], [-b, "x"], [d, ""]),
    soll: P(S([a - b, "x"], [c + d, ""])),
    falsch: [
      [P(S([a - b, "x"], [c - d, ""])), `Die Minusklammer dreht jedes Vorzeichen um, nicht nur das erste: aus −${num(d)} wird +${num(d)}.`],
      [P(S([a + b, "x"], [c - d, ""])), "Vor der Klammer steht ein Minus — alles in der Klammer wird abgezogen, auch das erste Glied."],
    ],
  };
}
const B4_KANDIDATEN = spaeter(() => {
  const liste = [];
  for (const art of ["a", "b", "c"]) for (const a of [3, 5, 7, 9]) for (const b of [2, 4, 6]) for (const c of [1, 3, 5, 8]) for (const d of [2, 4, 7]) {
    if (art !== "c" && d !== 2) continue;    // d kommt nur in der dritten Fassung vor
    if (a !== b && a !== c) liste.push({ art, a, b, c, d });
  }
  return liste;
});
function generateB4() {
  const k = ohneKollision(B4_KANDIDATEN(), (x) => { const p = b4Polys(x); return [p.soll, ...p.falsch.map((f) => f[0])].map(schluessel); });
  const { term, ohne, soll, falsch } = b4Polys(k);
  return T.termAufgabe({
    promptHtml: `Löse die Klammer auf und fasse zusammen: <strong>${term}</strong>`,
    soll, variablen: ["x"], form: "normal", falsch,
    tipps: [
      "Vor der Klammer steht ein Minus: Jedes Glied in der Klammer bekommt das umgekehrte Vorzeichen.",
      `Ohne Klammer: ${ohne}.`,
      "Jetzt die x-Glieder und die Zahlen getrennt zusammenfassen.",
    ],
    musterloesungHtml:
      `<strong>Klammer auflösen:</strong> ${term} = ${ohne}<br>` +
      `<strong>Zusammenfassen:</strong> <strong>${fertig(soll)}</strong><br>` +
      `<em>Probe mit x = 2:</em> ${num(T.wert(P(term), { x: 2 }))} und ${num(T.wert(soll, { x: 2 }))} ✓`,
    platzhalter: "vereinfachter Term",
  });
}

// ================= schwierig =================

// ---------- B5: Plus- und Minusklammern mit zwei Variablen ----------
// (a1 x + b1 y) − (a2 x − b2 y) + (a3 x − b3 y). Alle Zahlen ≥ 1: Dann sind die drei Fehler und die
// Lösung schon durch ihre x- oder y-Zahl verschieden, und die Zahlen dürfen unabhängig gezogen werden.
const B5_X = spaeter(() => {
  const l = [];
  for (const a1 of [3, 4, 6, 8]) for (const a2 of [1, 2, 5]) for (const a3 of [1, 2, 3]) if (a1 - a2 + a3 !== 0) l.push([a1, a2, a3]);
  return l;
});
const B5_Y = spaeter(() => {
  const l = [];
  for (const b1 of [2, 5, 7]) for (const b2 of [1, 3, 4]) for (const b3 of [2, 6, 9]) if (b1 + b2 - b3 !== 0) l.push([b1, b2, b3]);
  return l;
});
function generateB5() {
  const [a1, a2, a3] = pick(B5_X());
  const [b1, b2, b3] = pick(B5_Y());
  const V = ["x", "y"];
  const term = `(${S([a1, "x"], [b1, "y"])}) − (${S([a2, "x"], [-b2, "y"])}) + (${S([a3, "x"], [-b3, "y"])})`;
  const ohne = S([a1, "x"], [b1, "y"], [-a2, "x"], [b2, "y"], [a3, "x"], [-b3, "y"]);
  const soll = P(S([a1 - a2 + a3, "x"], [b1 + b2 - b3, "y"]), V);
  const falsch = [
    [P(S([a1 - a2 + a3, "x"], [b1 - b2 - b3, "y"]), V), `In der Minusklammer dreht sich jedes Vorzeichen um — auch das von ${S([-b2, "y"])}: Es wird +${S([b2, "y"])}.`],
    [P(S([a1 + a2 + a3, "x"], [b1 - b2 - b3, "y"]), V), "Vor der zweiten Klammer steht ein Minus — alles darin wird abgezogen."],
    [P(S([a1 - a2 - a3, "x"], [b1 + b2 + b3, "y"]), V), "Vor der dritten Klammer steht ein Plus — dort bleiben die Vorzeichen, wie sie sind."],
  ];
  return T.termAufgabe({
    promptHtml: `Löse die Klammern auf und fasse zusammen: <strong>${term}</strong>`,
    soll, variablen: V, form: "normal", falsch,
    tipps: [
      "Schau vor jede Klammer: Plus — Klammer weglassen. Minus — jedes Vorzeichen darin umdrehen.",
      `Ohne Klammern: ${ohne}.`,
      `x-Glieder: ${num(a1)} − ${num(a2)} + ${num(a3)}; y-Glieder: ${num(b1)} + ${num(b2)} − ${num(b3)}.`,
    ],
    musterloesungHtml:
      `<strong>Klammern auflösen:</strong> ${ohne}<br>` +
      `<strong>Ordnen:</strong> ${S([a1, "x"], [-a2, "x"], [a3, "x"], [b1, "y"], [b2, "y"], [-b3, "y"])}<br>` +
      `<strong>Zusammenfassen:</strong> <strong>${fertig(soll, V)}</strong>`,
    platzhalter: "vereinfachter Term",
  });
}

// ---------- B6: Produkte und Summen ----------
// a x · b x + c x² − d x · e
function b6Polys({ a, b, c, d, e }) {
  return {
    soll: P(S([a * b + c, "x²"], [-d * e, "x"])),
    falsch: [
      [P(S([c, "x²"], [a * b - d * e, "x"])), `${num(a)}x · ${num(b)}x ist ${num(a * b)}x², nicht ${num(a * b)}x — x · x = x².`],
      [P(S([c, "x²"], [2 * a * b - d * e, "x"])), "x · x ist x², nicht 2x: Malnehmen ist nicht Addieren."],
      [P(S([a * b + c, "x²"], [-(d + e), "x"])), `Die Zahlen eines Produkts werden multipliziert: ${num(d)}x · ${num(e)} = ${num(d * e)}x.`],
      [P(S([a + b + c, "x²"], [-d * e, "x"])), `Die Zahlen eines Produkts werden multipliziert: ${num(a)} · ${num(b)} = ${num(a * b)}.`],
    ],
  };
}
const B6_KANDIDATEN = spaeter(() => {
  const liste = [];
  for (const a of [2, 3, 4, 5]) for (const b of [2, 3, 5]) for (const c of [1, 4, 6]) for (const d of [2, 3, 4]) for (const e of [2, 3, 6]) liste.push({ a, b, c, d, e });
  return liste;
});
function generateB6() {
  const k = ohneKollision(B6_KANDIDATEN(), (x) => { const p = b6Polys(x); return [p.soll, ...p.falsch.map((f) => f[0])].map(schluessel); });
  const { a, b, c, d, e } = k;
  const { soll, falsch } = b6Polys(k);
  const term = `${num(a)}x · ${num(b)}x + ${S([c, "x²"])} − ${num(d)}x · ${num(e)}`;
  return T.termAufgabe({
    promptHtml: `Vereinfache: <strong>${term}</strong>`,
    soll, variablen: ["x"], form: "normal", falsch,
    tipps: [
      "Punkt vor Strich: Vereinfache zuerst die beiden Produkte.",
      `${num(a)}x · ${num(b)}x = ${num(a)} · ${num(b)} · x · x und ${num(d)}x · ${num(e)} = ${num(d)} · ${num(e)} · x.`,
      "Dann die x²-Glieder zusammenfassen; das x-Glied bleibt für sich.",
    ],
    musterloesungHtml:
      `<strong>Produkte:</strong> ${num(a)}x · ${num(b)}x = ${num(a * b)}x² und ${num(d)}x · ${num(e)} = ${num(d * e)}x<br>` +
      `<strong>Einsetzen:</strong> ${S([a * b, "x²"], [c, "x²"], [-d * e, "x"])}<br>` +
      `<strong>Zusammenfassen:</strong> <strong>${fertig(soll)}</strong>`,
    platzhalter: "vereinfachter Term",
  });
}

// ================= komplex =================

// ---------- B7: Umfang einer Figur ----------
// Die Seitenlängen stehen an der Figur. Rechteck: zwei Seiten beschriftet (die Gegenseiten sind gleich
// lang); gleichschenkliges Dreieck: die Basis und beide Schenkel; Dreieck: drei verschiedene Seiten.
const seite = (p, q) => S([p, "a"], [q, ""]);
function figurSvg(art, s) {
  const out = [];
  let w, h;
  const txt = (x, y, t, anker = "middle") => `<text x="${x}" y="${y}" text-anchor="${anker}" class="tm-figur-mass" data-rolle="seite">${t}</text>`;
  if (art === "rechteck") {
    w = 300; h = 150;
    out.push(`<rect x="70" y="20" width="200" height="100" class="tm-figur-linie" data-rolle="figur"/>`);
    out.push(txt(170, 142, s[0]));
    out.push(txt(62, 76, s[1], "end"));
  } else if (art === "gleichschenklig") {
    w = 320; h = 170;
    out.push(`<polygon points="60,140 260,140 160,24" class="tm-figur-linie" data-rolle="figur"/>`);
    out.push(txt(160, 162, s[0]));
    out.push(txt(100, 78, s[1], "end"));
    out.push(txt(220, 78, s[1], "start"));
  } else {
    w = 340; h = 170;
    out.push(`<polygon points="50,140 290,140 120,30" class="tm-figur-linie" data-rolle="figur"/>`);
    out.push(txt(170, 162, s[0]));
    out.push(txt(78, 80, s[1], "end"));
    out.push(txt(226, 86, s[2], "start"));
  }
  return `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" class="tm-aufgaben-figur" data-figur="${art}" role="img" aria-label="Figur mit den Seitenlängen ${s.join(", ")}">${out.join("")}</svg>`;
}
const B7_SEITEN = [[2, 3], [3, -1], [1, 4], [4, -2], [2, -1], [3, 2], [1, 5]];   // p a + q
const B7_KANDIDATEN = spaeter(() => {
  const liste = [];
  for (const art of ["rechteck", "gleichschenklig", "dreieck"]) {
    for (let i = 0; i < B7_SEITEN.length; i++) for (let j = 0; j < B7_SEITEN.length; j++) {
      if (i === j) continue;
      if (art !== "dreieck") liste.push({ art, s: [i, j] });
      else for (let m = 0; m < B7_SEITEN.length; m++) if (m !== i && m !== j && m > j) liste.push({ art, s: [i, j, m] });
    }
  }
  return liste;
});
function b7Polys({ art, s }) {
  const sp = s.map((i) => B7_SEITEN[i]);
  const V = ["a"];
  const summe = (liste) => P(S([liste.reduce((t, x) => t + x[0], 0), "a"], [liste.reduce((t, x) => t + x[1], 0), ""]), V);
  const alle = art === "rechteck" ? [sp[0], sp[1], sp[0], sp[1]] : art === "gleichschenklig" ? [sp[0], sp[1], sp[1]] : sp;
  const falsch = [];
  if (art === "rechteck") falsch.push([summe([sp[0], sp[1]]), "Ein Rechteck hat vier Seiten — die beiden beschrifteten Längen kommen je zweimal vor."]);
  if (art === "gleichschenklig") falsch.push([summe([sp[0], sp[1]]), "Das Dreieck hat drei Seiten: Beide Schenkel zählen, jeder mit seiner Länge."]);
  // Ein negatives q als Plus gelesen.
  const minus = alle.filter((x) => x[1] < 0);
  if (minus.length) {
    const [p, q] = minus[0];
    falsch.push([summe(alle.map((x) => [x[0], Math.abs(x[1])])), `Bei der Seite ${seite(p, q)} gehört das Minus dazu: Sie ist um ${num(-q)} cm kürzer als ${S([p, "a"])}, nicht länger.`]);
  }
  return { soll: summe(alle), falsch, alle, sp };
}
function generateB7() {
  const k = ohneKollision(B7_KANDIDATEN(), (x) => { const p = b7Polys(x); return [p.soll, ...p.falsch.map((f) => f[0])].map(schluessel); });
  const { soll, falsch, alle, sp } = b7Polys(k);
  const texte = sp.map(([p, q]) => seite(p, q));
  const name = { rechteck: "Rechteck", gleichschenklig: "gleichschenkliges Dreieck", dreieck: "Dreieck" }[k.art];
  const summeText = alle.map(([p, q]) => `(${seite(p, q)})`).join(" + ");
  return T.termAufgabe({
    promptHtml: `Die Seitenlängen des ${k.art === "rechteck" ? "Rechtecks" : k.art === "gleichschenklig" ? "gleichschenkligen Dreiecks" : "Dreiecks"} hängen von a ab (in cm). <strong>Stelle einen Term für den Umfang auf und vereinfache ihn so weit wie möglich.</strong>` + figurSvg(k.art, texte),
    soll, variablen: ["a"], form: "normal", falsch,
    tipps: [
      k.art === "rechteck" ? "Ein Rechteck hat vier Seiten; gegenüberliegende Seiten sind gleich lang." : k.art === "gleichschenklig" ? "Ein gleichschenkliges Dreieck hat zwei gleich lange Schenkel und eine Basis." : "Der Umfang ist die Summe aller drei Seiten.",
      `Umfang: ${summeText}`,
      "Vor jeder Klammer steht ein Plus — die Klammern fallen einfach weg. Dann a-Glieder und Zahlen zusammenfassen.",
    ],
    musterloesungHtml:
      `${name}: <strong>U = ${summeText}</strong><br>` +
      `Plusklammern weglassen und ordnen: ${S(...alle.map(([p]) => [p, "a"]), ...alle.map(([, q]) => [q, ""]))}<br>` +
      `Zusammenfassen: <strong>U = ${fertig(soll, ["a"])}</strong> (in cm)`,
    platzhalter: "Term für U",
  });
}

// ---------- B8: Den Fehler in einer Rechnung finden ----------
// Tims Rechenweg für a x − (b x − c) + 2x · d − e in vier Schritten. Genau ein Schritt ist falsch
// (k = 1 … 4); die Schritte danach rechnen richtig mit dem falschen Zwischenergebnis weiter.
function b8Rechnung({ a, b, c, d, e, k }) {
  // Die richtigen Bausteine und je Schritt die mögliche Verfälschung.
  const prod = k === 1 ? 2 + d : 2 * d;                       // Schritt 1: 2x · d als (2 + d)x
  const kVz = k === 2 ? -1 : 1;                               // Schritt 2: nur das erste Vorzeichen umgedreht
  const oVz = k === 3 ? -1 : 1;                               // Schritt 3: beim Ordnen das Vorzeichen von c verloren
  const start = `${S([a, "x"])} − (${S([b, "x"], [-c, ""])}) + 2x · ${num(d)} − ${num(e)}`;
  const s1 = `${S([a, "x"])} − (${S([b, "x"], [-c, ""])}) + ${S([prod, "x"])} − ${num(e)}`;
  const s2 = S([a, "x"], [-b, "x"], [kVz * c, ""], [prod, "x"], [-e, ""]);
  const s3 = S([a, "x"], [-b, "x"], [prod, "x"], [oVz * kVz * c, ""], [-e, ""]);
  const xk = k === 4 ? a + b + prod : a - b + prod;           // Schritt 4: −b x als +b x zusammengefasst
  const s4 = S([xk, "x"], [oVz * kVz * c - e, ""]);
  return { start, schritte: [s1, s2, s3, s4] };
}
const B8_REGEL = [
  "Produkt vereinfacht",
  "Klammer aufgelöst",
  "geordnet",
  "zusammengefasst",
];
function generateB8() {
  // Unabhängig gezogen: a ≥ 3, b ≤ 6 und 2d ≥ 4 halten das x-Glied ≠ 0; c ≥ 1 und b ≥ 1 sorgen dafür,
  // dass jeder der vier Fehler das Ergebnis wirklich ändert.
  // Bei d = 2 wäre 2 + d = 2 · d: Der Fehler in Schritt 1 fiele nicht auf — dort also d ≥ 3.
  const k = pick([1, 2, 3, 4]);
  const a = pick([3, 4, 5, 7, 8, 9]), b = pick([1, 2, 3, 5, 6]), c = pick([2, 3, 4, 6, 7]), d = pick(k === 1 ? [3, 4, 5] : [2, 3, 4, 5]), e = pick([1, 5, 8, 9]);
  const { start, schritte } = b8Rechnung({ a, b, c, d, e, k });
  const soll = P(S([a - b + 2 * d, "x"], [c - e, ""]));
  const tim = P(schritte[3]);
  const richtig = b8Rechnung({ a, b, c, d, e, k: 0 });
  return {
    promptHtml:
      `Tim vereinfacht <strong>${start}</strong> so:<br>` +
      schritte.map((s, i) => `<span class="tm-tim-schritt">(${i + 1}) = ${s}</span>`).join("<br>") +
      `<br><strong>In welchem Schritt steckt der erste Fehler? Wie lautet das richtige Ergebnis?</strong>` + T.EINGABE_HINWEIS,
    felder: [
      {
        name: "Schritt mit dem ersten Fehler", soll: k, toleranz: 1e-9, platzhalter: "1 bis 4",
        hinweis: (roh, val) => {
          if (Number.isInteger(val) && val > k && val <= 4) return `In Schritt ${val} wird nur weitergerechnet — der Fehler steckt schon früher. Vergleiche jeden Schritt mit dem davor.`;
          if (Number.isInteger(val) && val >= 1 && val < k) return `Schritt ${val} ist richtig: ${B8_REGEL[val - 1]} — gleichwertig mit dem Schritt davor.`;
          return "Gib die Nummer des Schritts an, 1 bis 4.";
        },
      },
      T.termFeld({
        name: "richtiges Ergebnis", soll, variablen: ["x"], form: "normal", platzhalter: "vereinfachter Term",
        falsch: [[tim, "Das ist Tims Ergebnis — wegen seines Fehlers stimmt es nicht. Rechne selbst von vorn."]],
      }),
    ],
    tipps: [
      "Prüfe jeden Schritt einzeln: Ist er gleichwertig mit dem Schritt davor? Setz zur Probe x = 1 ein.",
      "Achte besonders auf Vorzeichen — beim Auflösen der Minusklammer und beim Umsortieren.",
      `Richtig wäre: ${richtig.schritte.map((s, i) => `(${i + 1}) ${s}`).join(" &nbsp; ")}`,
    ],
    musterloesungHtml:
      `<strong>Richtig gerechnet:</strong><br>` +
      `(1) Produkt: 2x · ${num(d)} = ${S([2 * d, "x"])} → ${richtig.schritte[0]}<br>` +
      `(2) Minusklammer: ${richtig.schritte[1]}<br>` +
      `(3) Ordnen: ${richtig.schritte[2]}<br>` +
      `(4) Zusammenfassen: <strong>${fertig(soll)}</strong><br>` +
      `<strong>Tims Fehler steckt in Schritt ${k}:</strong> ${[
        `2x · ${num(d)} ist ${S([2 * d, "x"])}, nicht ${S([2 + d, "x"])} — die Zahlen werden multipliziert.`,
        `Die Minusklammer dreht jedes Vorzeichen um: aus −${num(c)} wird +${num(c)}.`,
        `Beim Ordnen nimmt jedes Glied sein Vorzeichen mit: +${num(c)} bleibt +${num(c)}.`,
        `${S([a, "x"], [-b, "x"], [2 * d, "x"])} = ${S([a - b + 2 * d, "x"])} — das Minus vor ${S([b, "x"])} gehört dazu.`,
      ][k - 1]}<br>` +
      `<em>Probe mit x = 1:</em> Anfang ${num(T.wert(P(start), { x: 1 }))}, Ergebnis ${num(T.wert(soll, { x: 1 }))} ✓`,
  };
}

// ================= Liste =================

export const AUFGABEN = [
  { schwierigkeit: "einfach", titel: "Gleichartige Glieder zusammenfassen", abschnitt: "sec-gleichartig", generate: generateB1 },
  { schwierigkeit: "einfach", titel: "Ein Produkt vereinfachen", abschnitt: "sec-produkte", generate: generateB2 },
  { schwierigkeit: "mittel", titel: "Zwei Sorten zusammenfassen", abschnitt: "sec-gleichartig", generate: generateB3 },
  { schwierigkeit: "mittel", titel: "Eine Minusklammer auflösen", abschnitt: "sec-klammern", generate: generateB4 },
  { schwierigkeit: "schwierig", titel: "Plus- und Minusklammern", abschnitt: "sec-klammern", generate: generateB5 },
  { schwierigkeit: "schwierig", titel: "Produkte und Summen", abschnitt: ["sec-gleichartig", "sec-produkte"], generate: generateB6 },
  { schwierigkeit: "komplex", titel: "Umfang einer Figur", abschnitt: ["sec-gleichartig", "sec-klammern"], generate: generateB7 },
  { schwierigkeit: "komplex", titel: "Den Fehler finden", abschnitt: "sec-schritte", generate: generateB8 },
];
