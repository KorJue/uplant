// Die acht Übungsaufgaben zu „Ausmultiplizieren und Ausklammern“ — zwei je Stufe.
//
// Beim Ausmultiplizieren ist der fertig vereinfachte Term gefragt (form "normal"), beim Ausklammern
// die Produktform, in der Klammer ohne gemeinsamen Faktor (form "ausgeklammert"). termwerk.js prüft
// beides exakt und nennt bei einer gleichwertigen, aber halb fertigen Eingabe den übrig gebliebenen
// Faktor. Jeder vorgesehene Fehler ist selbst ein Polynom mit eigenem Hinweis.
//
// Alle Zahlen kommen aus vorher gefilterten Listen oder werden unabhängig gezogen, wo keine
// Kombination stören kann — nie durch Verwerfen und Neuziehen.

"use strict";

import * as T from "./termwerk.js?v=1";
import { num, pick, trifft, ohneKollision, spaeter } from "./seite.js?v=1";

// Eine Summe von Gliedern als Text; das Vorzeichen steckt nur hier.
function S(...glieder) {
  return glieder.filter(([k]) => k !== 0).map(([k, v], i) => {
    const b = Math.abs(k);
    const kern = v === "" ? num(b) : (b === 1 ? "" : num(b)) + v;
    if (i === 0) return (k < 0 ? "−" : "") + kern;
    return (k < 0 ? " − " : " + ") + kern;
  }).join("") || "0";
}
const G = (k, v) => S([k, v]);                                  // ein einzelnes Glied
const K = (k, v) => (k < 0 ? `(${G(k, v)})` : G(k, v));        // ein Faktor, negativ in Klammern
const P = (text, vars = ["x"]) => T.P(text, vars);
const STELLE = { x: 1.37, y: 2.11, a: 1.73, b: 2.39, n: 1.29 };
const schluessel = (p) => T.wert(p, STELLE);
const fertig = (p, vars = ["x"]) => T.text(p, { reihenfolge: vars });
const ggT = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };

// ================= einfach =================

// ---------- C1: Eine Zahl mal eine Klammer ----------
function c1Polys({ k, m, c }) {
  return {
    soll: P(S([k * m, "x"], [k * c, ""])),
    falsch: [
      [P(S([k * m, "x"], [c, ""])), `Der Faktor ${num(k)} wird mit jedem Glied multipliziert — auch mit ${G(c, "")}: ${K(k, "")} · ${K(c, "")} = ${num(k * c)}.`],
      [P(S([k * m, "x"], [-k * c, ""])), `Das Vorzeichen beim zweiten Glied stimmt nicht: ${K(k, "")} · ${K(c, "")} = ${num(k * c)}${k < 0 && c < 0 ? " — Minus mal Minus gibt Plus" : ""}.`],
    ],
  };
}
const C1_KANDIDATEN = spaeter(() => {
  const liste = [];
  for (const k of [-6, -4, -3, -2, 2, 3, 4, 5]) for (const m of [1, 2, 3, 5]) for (const c of [-7, -5, -2, 1, 3, 4, 8]) liste.push({ k, m, c });
  return liste;
});
function generateC1() {
  const x = ohneKollision(C1_KANDIDATEN(), (v) => { const p = c1Polys(v); return [p.soll, ...p.falsch.map((f) => f[0])].map(schluessel); });
  const { k, m, c } = x;
  const { soll, falsch } = c1Polys(x);
  const term = `${num(k)} · (${S([m, "x"], [c, ""])})`;
  return T.termAufgabe({
    promptHtml: `Multipliziere aus: <strong>${term}</strong>`,
    soll, variablen: ["x"], form: "normal", falsch,
    tipps: [
      `Der Faktor ${num(k)} wird mit jedem der beiden Glieder multipliziert.`,
      `${K(k, "")} · ${G(m, "x")} = ${G(k * m, "x")} und ${K(k, "")} · ${K(c, "")} = ?`,
      "Plus mal Minus gibt Minus, Minus mal Minus gibt Plus.",
    ],
    musterloesungHtml:
      `${term} = ${K(k, "")} · ${G(m, "x")} + ${K(k, "")} · ${K(c, "")} = <strong>${fertig(soll)}</strong>`,
    platzhalter: "ausmultiplizierter Term",
  });
}

// ---------- C2: Eine Zahl ausklammern ----------
// g · (p x ± q) mit teilerfremden p, q: Dann ist g der größte gemeinsame Teiler.
const C2_KANDIDATEN = spaeter(() => {
  const liste = [];
  for (const g of [2, 3, 4, 5, 6, 7]) for (const p of [1, 2, 3, 4, 5]) for (const q of [-7, -5, -3, -1, 1, 2, 3, 5]) if (ggT(p, q) === 1) liste.push({ g, p, q });
  return liste;
});
function generateC2() {
  const x = ohneKollision(C2_KANDIDATEN(), ({ g, p, q }) => [P(S([g * p, "x"], [g * q, ""])), P(`${g}*(${S([p, "x"], [g * q, ""])})`)].map(schluessel));
  const { g, p, q } = x;
  const term = S([g * p, "x"], [g * q, ""]);
  const soll = P(term);
  return T.termAufgabe({
    promptHtml: `Klammere den größten gemeinsamen Faktor aus: <strong>${term}</strong>`,
    soll, variablen: ["x"], form: "ausgeklammert",
    falsch: [[P(`${g}*(${S([p, "x"], [g * q, ""])})`), `In der Klammer steht, was übrig bleibt, wenn man JEDES Glied durch ${g} teilt — auch ${G(g * q, "")} : ${g} = ${num(q)}.`]],
    formHinweis: null,
    tipps: [
      `Welche Zahl teilt ${num(g * p)} und ${num(Math.abs(g * q))}? Nimm die größte.`,
      `Der größte gemeinsame Teiler ist ${g}. Teile jedes Glied durch ${g}.`,
      `${G(g * p, "x")} : ${g} = ${G(p, "x")} und ${G(g * q, "")} : ${g} = ${num(q)}.`,
    ],
    musterloesungHtml:
      `ggT(${num(g * p)}, ${num(Math.abs(g * q))}) = ${g}<br>` +
      `${term} = <strong>${g} · (${S([p, "x"], [q, ""])})</strong><br>` +
      `<em>Probe:</em> ${g} · ${G(p, "x")} + ${g} · ${K(q, "")} = ${term} ✓`,
    platzhalter: "Produkt mit Klammer",
  });
}

// ================= mittel =================

// ---------- C3: Eine Variable vor der Klammer ----------
// „x“: k x · (m x + c); „ab“: k a · (m a + c b).
function c3Polys({ art, k, m, c }) {
  if (art === "x") {
    return {
      vars: ["x"],
      term: `${G(k, "x")} · (${S([m, "x"], [c, ""])})`,
      zerlegt: `${K(k, "x")} · ${G(m, "x")} + ${K(k, "x")} · ${K(c, "")}`,
      soll: P(S([k * m, "x²"], [k * c, "x"])),
      falsch: [
        [P(S([k * m, "x²"], [k * c, ""])), `Auch das zweite Glied wird mit x multipliziert: ${K(k, "x")} · ${K(c, "")} = ${G(k * c, "x")}.`],
        [P(S([2 * k * m, "x"], [k * c, "x"])), "x · x ist x², nicht 2x."],
        [P(S([k * m, "x²"], [-k * c, "x"])), `Das Vorzeichen beim zweiten Glied stimmt nicht: ${K(k, "x")} · ${K(c, "")} = ${G(k * c, "x")}.`],
      ],
    };
  }
  return {
    vars: ["a", "b"],
    term: `${G(k, "a")} · (${S([m, "a"], [c, "b"])})`,
    zerlegt: `${K(k, "a")} · ${G(m, "a")} + ${K(k, "a")} · ${K(c, "b")}`,
    soll: P(S([k * m, "a²"], [k * c, "ab"]), ["a", "b"]),
    falsch: [
      [P(S([k * m, "a²"], [k * c, "b"]), ["a", "b"]), `Auch das zweite Glied wird mit a multipliziert: ${K(k, "a")} · ${K(c, "b")} = ${G(k * c, "ab")}.`],
      [P(S([2 * k * m, "a"], [k * c, "ab"]), ["a", "b"]), "a · a ist a², nicht 2a."],
      [P(S([k * m, "a²"], [-k * c, "ab"]), ["a", "b"]), `Das Vorzeichen beim zweiten Glied stimmt nicht: ${K(k, "a")} · ${K(c, "b")} = ${G(k * c, "ab")}.`],
    ],
  };
}
const C3_KANDIDATEN = spaeter(() => {
  const liste = [];
  for (const art of ["x", "ab"]) for (const k of [-4, -2, -1, 2, 3, 5]) for (const m of [1, 2, 3, 4]) for (const c of [-6, -5, -1, 2, 3, 7]) liste.push({ art, k, m, c });
  return liste;
});
function generateC3() {
  const x = ohneKollision(C3_KANDIDATEN(), (v) => { const p = c3Polys(v); return [p.soll, ...p.falsch.map((f) => f[0])].map(schluessel); });
  const { vars, term, zerlegt, soll, falsch } = c3Polys(x);
  const v = x.art === "x" ? "x" : "a";
  return T.termAufgabe({
    promptHtml: `Multipliziere aus: <strong>${term}</strong>`,
    soll, variablen: vars, form: "normal", falsch,
    tipps: [
      `${G(x.k, v)} wird mit jedem Glied der Klammer multipliziert.`,
      `${zerlegt}`,
      `Zahlen mal Zahlen, Variablen mal Variablen: ${v} · ${v} = ${v}².`,
    ],
    musterloesungHtml: `${term} = ${zerlegt} = <strong>${fertig(soll, vars)}</strong>`,
    platzhalter: "ausmultiplizierter Term",
  });
}

// ---------- C4: Zweimal ausmultiplizieren, dann zusammenfassen ----------
// „plus“: a(x + b) + c(x − d); „minus“: a(x + b) − c(x − d).
function c4Polys({ art, a, b, c, d }) {
  const s = art === "plus" ? 1 : -1;
  const soll = P(S([a + s * c, "x"], [a * b - s * c * d, ""]));
  const falsch = art === "plus"
    ? [
      [P(S([a + c, "x"], [a * b - d, ""])), `Der Faktor ${c} gilt für die ganze zweite Klammer: ${c} · (−${d}) = −${c * d}.`],
      [P(S([a + c, "x"], [b - c * d, ""])), `Der Faktor ${a} gilt für die ganze erste Klammer: ${a} · ${b} = ${a * b}.`],
    ]
    : [
      [P(S([a - c, "x"], [a * b - c * d, ""])), `Minus mal Minus: (−${c}) · (−${d}) = +${c * d}.`],
      [P(S([a + c, "x"], [a * b - c * d, ""])), `Vor der zweiten Klammer steht −${c}: (−${c}) · x = −${c}x.`],
    ];
  return { soll, falsch, s };
}
const C4_KANDIDATEN = spaeter(() => {
  const liste = [];
  for (const art of ["plus", "minus"]) for (const a of [2, 3, 4, 5]) for (const b of [1, 2, 5, 6]) for (const c of [2, 3, 6]) for (const d of [1, 3, 4]) {
    if (art === "minus" && a === c) continue;   // sonst fiele das x-Glied weg
    liste.push({ art, a, b, c, d });
  }
  return liste;
});
function generateC4() {
  const x = ohneKollision(C4_KANDIDATEN(), (v) => { const p = c4Polys(v); return [p.soll, ...p.falsch.map((f) => f[0])].map(schluessel); });
  const { art, a, b, c, d } = x;
  const { soll, falsch, s } = c4Polys(x);
  const term = `${a} · (x + ${b}) ${art === "plus" ? "+" : "−"} ${c} · (x − ${d})`;
  const zwischen = S([a, "x"], [a * b, ""], [s * c, "x"], [-s * c * d, ""]);
  return T.termAufgabe({
    promptHtml: `Multipliziere aus und fasse zusammen: <strong>${term}</strong>`,
    soll, variablen: ["x"], form: "normal", falsch,
    tipps: [
      "Multipliziere jede Klammer einzeln aus — der Faktor davor gilt mit seinem Vorzeichen.",
      `Ausmultipliziert: ${zwischen}`,
      "Dann x-Glieder und Zahlen getrennt zusammenfassen.",
    ],
    musterloesungHtml:
      `<strong>Ausmultiplizieren:</strong> ${a} · x + ${a} · ${b} ${art === "plus" ? `+ ${c} · x + ${c} · (−${d})` : `+ (−${c}) · x + (−${c}) · (−${d})`} = ${zwischen}<br>` +
      `<strong>Zusammenfassen:</strong> <strong>${fertig(soll)}</strong>`,
    platzhalter: "vereinfachter Term",
  });
}

// ================= schwierig =================

// ---------- C5: Vollständig ausklammern mit Variablen ----------
// „x“: g p x² ± g q x = g x (p x ± q); „x3“: g p x³ ± g q x² = g x² (p x ± q);
// „ab“: g p a²b ± g q ab² = g ab (p a ± q b). p und q teilerfremd.
const C5_ARTEN = {
  x: { vars: ["x"], term: (g, p, q) => S([g * p, "x²"], [g * q, "x"]), faktor: (g) => G(g, "x"), innen: (p, q) => S([p, "x"], [q, ""]) },
  x3: { vars: ["x"], term: (g, p, q) => S([g * p, "x³"], [g * q, "x²"]), faktor: (g) => G(g, "x²"), innen: (p, q) => S([p, "x"], [q, ""]) },
  ab: { vars: ["a", "b"], term: (g, p, q) => S([g * p, "a²b"], [g * q, "ab²"]), faktor: (g) => G(g, "ab"), innen: (p, q) => S([p, "a"], [q, "b"]) },
};
const C5_KANDIDATEN = spaeter(() => {
  const liste = [];
  for (const art of Object.keys(C5_ARTEN)) for (const g of [2, 3, 4, 5, 6]) for (const p of [1, 2, 3, 5]) for (const q of [-7, -3, -2, 1, 4, 5]) if (ggT(p, q) === 1) liste.push({ art, g, p, q });
  return liste;
});
function generateC5() {
  const { art, g, p, q } = pick(C5_KANDIDATEN());
  const A = C5_ARTEN[art];
  const term = A.term(g, p, q);
  const soll = P(term, A.vars);
  const f = A.faktor(g);
  const vorz = P(`${f} * (${A.innen(p, -q)})`.replace(/x²/g, "x^2"), A.vars);
  return T.termAufgabe({
    promptHtml: `Klammere vollständig aus: <strong>${term}</strong>`,
    soll, variablen: A.vars, form: "ausgeklammert",
    falsch: [[vorz, "Das Vorzeichen in der Klammer stimmt nicht — multipliziere zur Probe aus."]],
    tipps: [
      `Die Zahl: der größte gemeinsame Teiler von ${num(g * p)} und ${num(Math.abs(g * q))}.`,
      art === "ab" ? "Die Variablen: a und b stecken in beiden Gliedern — jeweils mindestens einmal." : art === "x3" ? "Die Variable: x steckt in beiden Gliedern mindestens zweimal (x³ und x²)." : "Die Variable: x steckt in beiden Gliedern mindestens einmal.",
      `Vor die Klammer kommt ${f}. Teile jedes Glied durch ${f}.`,
    ],
    musterloesungHtml:
      `ggT(${num(g * p)}, ${num(Math.abs(g * q))}) = ${g}; gemeinsame Variablen: ${f.replace(/^\d+/, "")}<br>` +
      `${term} = <strong>${f} · (${A.innen(p, q)})</strong><br>` +
      `<em>Probe:</em> ${f} · ${G(p, art === "ab" ? "a" : "x")} + ${f} · ${K(q, art === "ab" ? "b" : "")} = ${term} ✓`,
    platzhalter: "Produkt mit Klammer",
  });
}

// ---------- C6: Minus vor dem Faktor ----------
// „a“: e x − k · (m x − c); „b“: e − k · (c − m x).
function c6Polys({ art, e, k, m, c }) {
  if (art === "a") {
    return {
      term: `${G(e, "x")} − ${k} · (${S([m, "x"], [-c, ""])})`,
      zwischen: S([e, "x"], [-k * m, "x"], [k * c, ""]),
      soll: P(S([e - k * m, "x"], [k * c, ""])),
      falsch: [
        [P(S([e - k * m, "x"], [-k * c, ""])), `Minus mal Minus: (−${k}) · (−${c}) = +${k * c}.`],
        [P(S([e - k * m, "x"], [c, ""])), `Der Faktor −${k} gilt für jedes Glied der Klammer: (−${k}) · (−${c}) = +${k * c}.`],
      ],
    };
  }
  return {
    term: `${num(e)} − ${k} · (${S([c, ""], [-m, "x"])})`,
    zwischen: S([e, ""], [-k * c, ""], [k * m, "x"]),
    soll: P(S([k * m, "x"], [e - k * c, ""])),
    falsch: [
      [P(S([-k * m, "x"], [e - k * c, ""])), `Minus mal Minus: (−${k}) · (−${G(m, "x")}) = +${G(k * m, "x")}.`],
      [P(S([m, "x"], [e - k * c, ""])), `Der Faktor −${k} gilt für jedes Glied der Klammer: (−${k}) · (−${G(m, "x")}) = +${G(k * m, "x")}.`],
    ],
  };
}
const C6_KANDIDATEN = spaeter(() => {
  const liste = [];
  for (const art of ["a", "b"]) for (const e of [5, 7, 9, 12]) for (const k of [2, 3, 4]) for (const m of [1, 2, 3]) for (const c of [2, 5, 6]) {
    if (art === "a" && e === k * m) continue;   // das x-Glied fiele weg
    if (art === "b" && e === k * c) continue;   // die Zahl fiele weg
    liste.push({ art, e, k, m, c });
  }
  return liste;
});
function generateC6() {
  const x = ohneKollision(C6_KANDIDATEN(), (v) => { const p = c6Polys(v); return [p.soll, ...p.falsch.map((f) => f[0])].map(schluessel); });
  const { term, zwischen, soll, falsch } = c6Polys(x);
  return T.termAufgabe({
    promptHtml: `Multipliziere aus und fasse zusammen: <strong>${term}</strong>`,
    soll, variablen: ["x"], form: "normal", falsch,
    tipps: [
      `Vor der Klammer steht −${x.k}: Jedes Glied der Klammer wird mit −${x.k} multipliziert.`,
      `Ausmultipliziert: ${zwischen}`,
      "Dann gleichartige Glieder zusammenfassen.",
    ],
    musterloesungHtml:
      `<strong>Ausmultiplizieren mit −${x.k}:</strong> ${zwischen}<br>` +
      `<strong>Zusammenfassen:</strong> <strong>${fertig(soll)}</strong>`,
    platzhalter: "vereinfachter Term",
  });
}

// ================= komplex =================

// ---------- C7: Flächeninhalt eines zusammengesetzten Rechtecks ----------
// Ein Rechteck aus zwei Teilen: links (m x) breit, rechts c breit, beide h hoch — h ist eine Zahl
// oder x. Die Maße stehen an der Figur.
function figur(hText, linksText, rechtsText, mx, c) {
  const w1 = 46 * mx, w2 = 22 * c, h = 90;
  const x0 = 60, y0 = 26;
  const t = (x, y, s, rolle, anker = "middle") => `<text x="${x}" y="${y}" text-anchor="${anker}" class="tm-figur-mass" data-rolle="${rolle}">${s}</text>`;
  return `<svg viewBox="0 0 ${x0 + w1 + w2 + 30} ${y0 + h + 40}" width="${x0 + w1 + w2 + 30}" height="${y0 + h + 40}" class="tm-aufgaben-figur" data-figur="rechteck2" role="img" aria-label="Rechteck aus zwei Teilen">` +
    `<rect x="${x0}" y="${y0}" width="${w1}" height="${h}" class="tm-figur-flaeche tm-figur-flaeche-a" data-rolle="teil"/>` +
    `<rect x="${x0 + w1}" y="${y0}" width="${w2}" height="${h}" class="tm-figur-flaeche tm-figur-flaeche-b" data-rolle="teil"/>` +
    t(x0 + w1 / 2, y0 + h + 22, linksText, "links") + t(x0 + w1 + w2 / 2, y0 + h + 22, rechtsText, "rechts") +
    t(x0 - 10, y0 + h / 2 + 5, hText, "hoehe", "end") + `</svg>`;
}
const C7_KANDIDATEN = spaeter(() => {
  const liste = [];
  for (const h of ["x", 2, 3, 4, 5, 6]) for (const m of [1, 2, 3]) for (const c of [1, 2, 3, 4, 5]) liste.push({ h, m, c });
  return liste;
});
function generateC7() {
  const x = ohneKollision(C7_KANDIDATEN(), ({ h, m, c }) => {
    const hp = h === "x" ? "x" : String(h);
    return [P(`${hp}*(${m}x + ${c})`), P(`${hp}*${m}x + ${c}`), P(`${m}x + ${c}`)].map(schluessel);
  });
  const { h, m, c } = x;
  const hp = h === "x" ? "x" : String(h);
  const innen = `${G(m, "x")} + ${c}`;
  const soll = P(`${hp}*(${m}x + ${c})`);
  const links = T.text(P(`${hp}*${m}x`)), rechts = T.text(P(`${hp}*${c}`));
  return {
    promptHtml:
      `Ein Beet besteht aus zwei rechteckigen Teilen (Maße in m). <strong>Gib den Flächeninhalt des ganzen Beets einmal als Produkt mit Klammer und einmal als ausmultiplizierte Summe an.</strong>` +
      figur(hp, G(m, "x"), String(c), m, c) + T.EINGABE_HINWEIS,
    felder: [
      T.termFeld({ name: "als Produkt", soll, variablen: ["x"], form: "produkt", platzhalter: "Breite · Höhe", formHinweis: "Gleichwertig — aber hier ist die Produktform gefragt: ganze Höhe mal ganze Breite, mit Klammer." }),
      T.termFeld({
        name: "als Summe", soll, variablen: ["x"], form: "normal", platzhalter: "ausmultipliziert",
        falsch: [[P(`${hp}*${m}x + ${c}`), `Der rechte Teil ist auch ${hp} hoch: Sein Flächeninhalt ist ${hp} · ${c} = ${rechts}, nicht ${c}.`]],
      }),
    ],
    tipps: [
      `Das ganze Beet ist (${innen}) breit und ${hp} hoch.`,
      `Produkt: Höhe mal ganze Breite — ${hp} · (${innen}).`,
      `Summe: die beiden Teile einzeln — links ${hp} · ${G(m, "x")}, rechts ${hp} · ${c}.`,
    ],
    musterloesungHtml:
      `<strong>Als Produkt:</strong> A = ${hp} · (${innen})<br>` +
      `<strong>Als Summe:</strong> A = ${hp} · ${G(m, "x")} + ${hp} · ${c} = ${links} + ${rechts}<br>` +
      `Beides ist gleichwertig — das ist genau das Distributivgesetz.`,
  };
}

// ---------- C8: Teilbarkeit aufeinanderfolgender Zahlen ----------
// k aufeinanderfolgende Zahlen (alle, nur gerade, nur ungerade), die kleinste heißt n, 2n oder 2n + 1.
const C8_FAELLE = [];
for (const k of [3, 4, 5, 6, 7]) C8_FAELLE.push({ art: "alle", k, a: k, b: (k * (k - 1)) / 2 });
for (const k of [3, 4, 5]) C8_FAELLE.push({ art: "gerade", k, a: 2 * k, b: k * (k - 1) });
for (const k of [3, 4, 5]) C8_FAELLE.push({ art: "ungerade", k, a: 2 * k, b: k * k });
const C8_WORT = { 3: "drei", 4: "vier", 5: "fünf", 6: "sechs", 7: "sieben" };
function generateC8() {
  const f = pick(C8_FAELLE);
  const g = ggT(f.a, f.b);
  const summeP = P(`${f.a}n + ${f.b}`, ["n"]);
  const zahlen = Array.from({ length: f.k }, (_, i) => (f.art === "alle" ? (i === 0 ? "n" : `(n + ${i})`) : f.art === "gerade" ? (i === 0 ? "2n" : `(2n + ${2 * i})`) : `(2n + ${2 * i + 1})`));
  const wer = { alle: "aufeinanderfolgende natürliche Zahlen", gerade: "aufeinanderfolgende gerade Zahlen", ungerade: "aufeinanderfolgende ungerade Zahlen" }[f.art];
  const kleinste = { alle: "n", gerade: "2n", ungerade: "2n + 1" }[f.art];
  const innen = S([f.a / g, "n"], [f.b / g, ""]);
  return {
    promptHtml:
      `Addiert man ${C8_WORT[f.k]} ${wer}, ist die Summe immer durch dieselbe Zahl teilbar. Die kleinste Zahl heißt <strong>${kleinste}</strong>. ` +
      `<strong>Stelle einen Term für die Summe auf und vereinfache ihn. Klammere dann vollständig aus. Durch welche Zahl ist die Summe also immer teilbar?</strong>` + T.EINGABE_HINWEIS,
    felder: [
      T.termFeld({ name: "Summe, vereinfacht", soll: summeP, variablen: ["n"], form: "normal", platzhalter: "Term mit n" }),
      T.termFeld({ name: "vollständig ausgeklammert", soll: summeP, variablen: ["n"], form: "ausgeklammert", platzhalter: "Produkt mit Klammer" }),
      {
        name: "immer teilbar durch", soll: g, toleranz: 1e-9, platzhalter: "Zahl",
        hinweis: (roh, val) => {
          if (trifft(val, f.k) && f.k !== g) return `Die Anzahl der Zahlen ist hier kein Teiler: Ausgeklammert steht ${g} vor der Klammer — und in der Klammer bleibt ${innen}, das nicht mehr durch etwas Gemeinsames teilbar ist.`;
          return "Lies die Zahl vor der Klammer ab — sie ist ein Faktor der Summe, egal was n ist.";
        },
      },
    ],
    tipps: [
      `Die ${C8_WORT[f.k]} Zahlen: ${zahlen.join(", ")}.`,
      `Summe: ${zahlen.join(" + ")} — Plusklammern weglassen und zusammenfassen.`,
      `Der größte gemeinsame Teiler von ${f.a} und ${f.b} kommt vor die Klammer.`,
    ],
    musterloesungHtml:
      `<strong>Summe:</strong> ${zahlen.join(" + ")} = <strong>${f.a}n + ${f.b}</strong><br>` +
      `<strong>Ausklammern:</strong> ggT(${f.a}, ${f.b}) = ${g}, also ${f.a}n + ${f.b} = <strong>${g} · (${innen})</strong><br>` +
      `Weil ${g} ein Faktor ist, ist die Summe für jedes n durch <strong>${g}</strong> teilbar.`,
  };
}

// ================= Liste =================

export const AUFGABEN = [
  { schwierigkeit: "einfach", titel: "Eine Zahl mal eine Klammer", abschnitt: "sec-ausmultiplizieren", generate: generateC1 },
  { schwierigkeit: "einfach", titel: "Eine Zahl ausklammern", abschnitt: "sec-ausklammern", generate: generateC2 },
  { schwierigkeit: "mittel", titel: "Eine Variable vor der Klammer", abschnitt: "sec-ausmultiplizieren", generate: generateC3 },
  { schwierigkeit: "mittel", titel: "Zweimal ausmultiplizieren", abschnitt: "sec-ausmultiplizieren", generate: generateC4 },
  { schwierigkeit: "schwierig", titel: "Vollständig ausklammern", abschnitt: "sec-vollstaendig", generate: generateC5 },
  { schwierigkeit: "schwierig", titel: "Minus vor dem Faktor", abschnitt: "sec-ausmultiplizieren", generate: generateC6 },
  { schwierigkeit: "komplex", titel: "Flächeninhalt eines Beets", abschnitt: "sec-distributiv", generate: generateC7 },
  { schwierigkeit: "komplex", titel: "Summen aufeinanderfolgender Zahlen", abschnitt: ["sec-ausklammern", "sec-vollstaendig"], generate: generateC8 },
];
