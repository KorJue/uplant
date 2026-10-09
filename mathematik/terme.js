// Terme lesen, prüfen und erzeugen — gemeinsam für die Analysis-Seiten (Differential-,
// Funktionsuntersuchung, Integralrechnung).
//
//   leseTerm(text, { parameter })   liest eine getippte Eingabe ohne eval: Zahlen mit Komma, x, π,
//                                   Parameter, + − · * / ^, Klammern, sin, cos, tan, sqrt/√,
//                                   Hochzahlen (x², x⁻¹), sin²(x) und weggelassene Malzeichen
//                                   (2x, 3(x + 1), 3a²x).
//   pruefeTerm({ … })               vergleicht die Eingabe numerisch mit der exakten Ableitung bzw.
//                                   leitet beim Aufleiten die Eingabe ab und vergleicht mit f — und
//                                   nennt bei einem Fehler den wahrscheinlichen Grund.
//   Glieder                         Bausteine einer Funktion, die ihre Ableitung und Stammfunktion
//                                   exakt kennen (Brüche statt Kommazahlen). Daraus würfeln die
//                                   Seiten beliebig viele Übungsfunktionen, und Ableitung,
//                                   Stammfunktion und Musterlösung entstehen aus denselben Gliedern
//                                   wie die Angabe — sie können ihr nicht widersprechen.
//
// Ein Glied ist { typ, k, j, … } mit dem Koeffizienten k (ein Bruch { z, n }) und der Potenz j des
// Parameters a (0, wenn es keinen gibt):
//   pot    k · aʲ · xᵉ                 e ein Bruch (½ für √x); e = 0 ist eine Konstante
//   trig   k · aʲ · sin(bx + d) oder cos(bx + d)
//   kette  k · aʲ · (mx + n)ᵉ           lineare Verkettung; mx + n ist auf dem Prüfbereich positiv
//   prod   k · aʲ · xᵖ · v              v ein trig- oder kette-Glied mit k = 1 (nur zum Ableiten)
//   mono   k · aʲ · xᵖ · (m·xʳ + n·aᵗ)ᵉ · sinˢ(bx + d) · cosᶜ(bx + d)
//          verkettete Funktionen mit nichtlinearer innerer Funktion — (x² − 1)², √(x² + 1), (x − a)³ —
//          und Potenzen und Produkte von sin und cos — sin²(x), sin(x) · cos(x). Die Form ist unter
//          Ableiten abgeschlossen, also gibt es auch f″ und f‴. Eine Stammfunktion gibt es nur über
//          Umformen: Ausmultiplizieren bzw. sin²(u) = ½ − ½ · cos(2u) — die Kettenregel rückwärts
//          für nichtlineare innere Funktionen steht auf den Seiten nicht.

"use strict";

const FORMAT = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 6 });
const zahl = (x) => FORMAT.format(Math.abs(x) < 5e-7 ? 0 : x).replace("-", "−");

const HOCHGESTELLT = { "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9", "⁻": "-" };
export function leseTerm(text, { parameter = [] } = {}) {
  const quelle = String(text).toLowerCase()
    .replace(/[−–]/g, "-").replace(/[·×]/g, "*").replace(/:/g, "/").replace(/,/g, ".")
    // Hochgestellte Ziffern als Exponent: x² wird x^2, x⁻¹ wird x^(-1), (2x + 1)¹⁰ wird (2x + 1)^10.
    .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+/g, (m) => {
      const e = [...m].map((c) => HOCHGESTELLT[c]).join("");
      return e.startsWith("-") ? `^(${e})` : `^${e}`;
    })
    .replace(/√/g, "sqrt").replace(/π/g, "pi").replace(/\s+/g, "")
    // Wer „f′(x) = …“ oder „F(x) = …“ mit abschreibt, soll nicht scheitern.
    .replace(/^[a-zₐ]+['′″‴]*\(x\)=/, "");
  if (!quelle) throw new Error("Die Eingabe ist leer.");
  // Funktionsnamen zuerst: „tan“ enthält das a einer Schar.
  const NAMEN = ["sqrt", "wurzel", "sin", "cos", "tan", "pi", ...parameter, "x"];
  const marken = [];
  for (let i = 0; i < quelle.length;) {
    const rest = quelle.slice(i);
    const z = rest.match(/^(\d+\.?\d*|\.\d+)/);
    if (z) { marken.push({ art: "zahl", wert: parseFloat(z[1]) }); i += z[1].length; continue; }
    if ("+-*/^()".includes(rest[0])) { marken.push({ art: rest[0] }); i++; continue; }
    const name = NAMEN.find((n) => rest.startsWith(n));
    if (name) { marken.push({ art: "name", wert: name === "wurzel" ? "sqrt" : name }); i += name.length; continue; }
    throw new Error(`Unbekanntes Zeichen „${rest[0]}“.`);
  }
  let k = 0;
  const sieh = () => marken[k], nimm = () => marken[k++];
  const beginntFaktor = (m) => m && (m.art === "zahl" || m.art === "name" || m.art === "(");
  function summe() {
    let a = produkt();
    while (sieh() && (sieh().art === "+" || sieh().art === "-")) {
      const op = nimm().art, b = produkt(), l = a;
      a = op === "+" ? { f: (x, p) => l.f(x, p) + b.f(x, p), t: `${l.t} + ${b.t}` } : { f: (x, p) => l.f(x, p) - b.f(x, p), t: `${l.t} − ${b.t}` };
    }
    return a;
  }
  function produkt() {
    let a = vorzeichen();
    for (;;) {
      const m = sieh();
      if (m && (m.art === "*" || m.art === "/")) {
        nimm();
        const b = vorzeichen(), l = a;
        a = m.art === "*" ? { f: (x, p) => l.f(x, p) * b.f(x, p), t: `${l.t} · ${b.t}` } : { f: (x, p) => l.f(x, p) / b.f(x, p), t: `${l.t} / ${b.t}` };
      } else if (beginntFaktor(m)) {
        // Weggelassener Malpunkt: 2x, 3(x + 1), x sin(x).
        const b = potenz(), l = a;
        a = { f: (x, p) => l.f(x, p) * b.f(x, p), t: `${l.t} · ${b.t}` };
      } else return a;
    }
  }
  function vorzeichen() {
    const m = sieh();
    if (m && (m.art === "-" || m.art === "+")) {
      nimm();
      const a = vorzeichen();
      return m.art === "-" ? { f: (x, p) => -a.f(x, p), t: `−${a.t}` } : a;
    }
    return potenz();
  }
  function potenz() {
    const a = grund();
    if (sieh() && sieh().art === "^") {
      nimm();
      const b = vorzeichen();
      return { f: (x, p) => Math.pow(a.f(x, p), b.f(x, p)), t: `${a.t}^${b.t}` };
    }
    return a;
  }
  function grund() {
    const m = nimm();
    if (!m) throw new Error("Der Term endet zu früh.");
    if (m.art === "zahl") return { f: () => m.wert, t: zahl(m.wert) };
    if (m.art === "(") {
      const a = summe();
      if (!sieh() || nimm().art !== ")") throw new Error("Eine Klammer wird nicht geschlossen.");
      return { f: a.f, t: `(${a.t})` };
    }
    if (m.art === "name") {
      if (m.wert === "x") return { f: (x) => x, t: "x" };
      if (m.wert === "pi") return { f: () => Math.PI, t: "π" };
      if (parameter.includes(m.wert)) return { f: (x, p) => p[m.wert], t: m.wert };
      // sin²(x) und sin^2(x): Die Hochzahl gehört zum Funktionswert, nicht zum Argument. sin⁻¹ wäre
      // mehrdeutig (Kehrwert oder Umkehrfunktion) und wird deshalb nicht gelesen.
      let hochzahl = null;
      if (m.wert !== "sqrt" && m.wert !== "wurzel" && sieh() && sieh().art === "^") {
        nimm();
        hochzahl = grund();
        if (!(hochzahl.f(1, {}) > 0)) throw new Error(`${m.wert} mit negativer Hochzahl ist mehrdeutig — schreibe 1/${m.wert}(x).`);
      }
      // sin x und sin(x) sind beide erlaubt; ohne Klammer gilt nur das nächste Grundelement.
      const arg = grund(), fn = { sqrt: Math.sqrt, sin: Math.sin, cos: Math.cos, tan: Math.tan }[m.wert];
      const innen = arg.t.replace(/^\((.*)\)$/, "$1");
      if (hochzahl) return { f: (x, p) => Math.pow(fn(arg.f(x, p)), hochzahl.f(x, p)), t: `${m.wert}^${hochzahl.t}(${innen})` };
      return { f: (x, p) => fn(arg.f(x, p)), t: `${m.wert === "sqrt" ? "√" : m.wert}(${innen})` };
    }
    throw new Error(`„${m.art}“ steht an einer Stelle, an der eine Zahl, x oder eine Klammer erwartet wird.`);
  }
  const ergebnis = summe();
  if (k < marken.length) {
    const m = marken[k];
    throw new Error(`Nach „${ergebnis.t}“ bleibt „${m.art === "name" ? m.wert : m.art === "zahl" ? zahl(m.wert) : m.art}“ übrig.`);
  }
  return ergebnis;
}

// ================= Brüche =================

const ggT = (a, b) => (b ? ggT(b, a % b) : Math.abs(a));
export function q(z, n = 1) {
  if (n < 0) { z = -z; n = -n; }
  const g = ggT(z, n) || 1;
  return { z: z / g, n: n / g };
}
const qMal = (a, b) => q(a.z * b.z, a.n * b.n);
const qDurch = (a, b) => q(a.z * b.n, a.n * b.z);
const qPlus = (a, b) => q(a.z * b.n + b.z * a.n, a.n * b.n);
const qNeg = (a) => q(-a.z, a.n);
const qWert = (a) => a.z / a.n;
const EINS = q(1), NULL = q(0);

const bruchHtml = (z, n) => `<span class="bruch"><span class="z">${z}</span><span class="n">${n}</span></span>`;
const HOCH = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" };
const hoch = (n) => String(n).split("").map((c) => HOCH[c]).join("");
// Ein Bruch, der sich als kurze Dezimalzahl schreiben lässt (Nenner nur aus 2 und 5, höchstens 100).
const dezimal = (a) => { let n = a.n; while (n % 2 === 0) n /= 2; while (n % 5 === 0) n /= 5; return n === 1 && a.n <= 100; };
const betragHtml = (a) => (a.n === 1 ? String(Math.abs(a.z)) : dezimal(a) ? zahl(Math.abs(qWert(a))) : bruchHtml(Math.abs(a.z), a.n));
const betragLin = (a) => (a.n === 1 ? String(Math.abs(a.z)) : dezimal(a) ? zahl(Math.abs(qWert(a))) : `(${Math.abs(a.z)}/${a.n})`);
const aHtml = (j) => (j === 0 ? "" : j === 1 ? "a" : "a" + hoch(j));
const aLin = (j) => (j === 0 ? "" : j === 1 ? "a" : `a^${j}`);

// ================= Glieder: Darstellung =================

// xᵉ für e > 0: ganzzahlig oder halbzahlig (Wurzeln).
function xPot(e, lin) {
  const ganz = Math.floor(qWert(e)), halb = e.n === 2;
  const p = ganz === 0 ? "" : ganz === 1 ? "x" : lin ? `x^${ganz}` : "x" + hoch(ganz);
  if (!halb) return p;
  return lin ? (p ? `${p}*sqrt(x)` : "sqrt(x)") : p + "√x";
}
const innen = (m, n, lin) => {
  const mt = m.z === m.n ? "x" : m.z === -m.n ? "−x" : `${lin ? betragLin(m) : betragHtml(m)}x`.replace(/^/, m.z < 0 ? "−" : "");
  if (n.z === 0) return mt;
  return `${mt} ${n.z < 0 ? "−" : "+"} ${lin ? betragLin(n) : betragHtml(n)}`;
};
// (mx + n)ᵉ für e > 0.
function kettePot(g, e, lin) {
  const i = innen(g.m, g.n, lin).replace(/ /g, lin ? "" : " "), ganz = Math.floor(qWert(e)), halb = e.n === 2;
  const klammer = `(${i})`;
  const p = ganz === 0 ? "" : ganz === 1 ? klammer : lin ? `${klammer}^${ganz}` : klammer + hoch(ganz);
  if (!halb) return p;
  const w = lin ? `sqrt(${i})` : `√(${i})`;
  return p ? (lin ? `${p}*${w}` : p + w) : w;
}
function trigKern(g, lin) {
  const b = g.b, d = g.d;
  const bt = b.z === b.n ? "x" : `${lin ? betragLin(b) : betragHtml(b)}x`;
  const arg = d.z === 0 ? bt : `${bt} ${d.z < 0 ? "−" : "+"} ${lin ? betragLin(d) : betragHtml(d)}`;
  return `${g.fn}(${lin ? arg.replace(/ /g, "") : arg})`;
}
const negativ = (g) => (g.typ === "pot" || g.typ === "kette") && g.e.z < 0;
// Der Teil ohne Koeffizient (für positive Exponenten) bzw. der Nenner (für negative).
function kern(g, lin) {
  if (g.typ === "pot") return g.e.z === 0 ? "" : xPot(g.e.z < 0 ? qNeg(g.e) : g.e, lin);
  if (g.typ === "trig") return trigKern(g, lin);
  if (g.typ === "kette") return kettePot(g, g.e.z < 0 ? qNeg(g.e) : g.e, lin);
  return `${xPot(q(g.p), lin)}${lin ? "*" : " · "}${kern(g.v, lin)}`;
}
// Getippt braucht nur ein zusammengesetzter Nenner eine Klammer: 4/x^3, 1/(x+1)^2 und 1/sqrt(x+4) liest
// jeder Rechner richtig, 3/2sqrt(x) dagegen als (3/2) · √x.
const nennerLin = (n) => (/^(x(\^\d+)?|\([^()]*\)(\^\d+)?|sqrt\([^()]*\))$/.test(n) ? n : `(${n})`);

// ---------- mono: verkettete Glieder ----------
const P = (m, r, n, t, e) => ({ m, r, n, t, e });
const T = (b, d, s, c) => ({ b, d, s, c });
const M = (k, j, p, poly, trig) => ({ typ: "mono", k, j, p, poly, trig });
const xHoch = (p, lin) => (p === 0 ? "" : p === 1 ? "x" : lin ? `x^${p}` : "x" + hoch(p));

// Die innere Funktion m·xʳ + n·aᵗ.
function innenPoly(P, lin) {
  const eins = Math.abs(P.m.z) === P.m.n;
  const mt = (P.m.z < 0 ? (lin ? "-" : "−") : "") + (eins ? "" : lin ? betragLin(P.m) : betragHtml(P.m)) + xHoch(P.r, lin);
  if (P.n.z === 0) return mt;
  const nb = q(Math.abs(P.n.z), P.n.n), a = lin ? aLin(P.t) : aHtml(P.t);
  const nt = P.t && nb.z === nb.n ? a : (lin ? betragLin(nb) : betragHtml(nb)) + a;
  return lin ? `${mt}${P.n.z < 0 ? "-" : "+"}${nt}` : `${mt} ${P.n.z < 0 ? "−" : "+"} ${nt}`;
}
// (m·xʳ + n·aᵗ)ᵉ für e > 0, ganz- oder halbzahlig.
function polyPot(P, e, lin) {
  const i = innenPoly(P, lin), ganz = Math.floor(qWert(e)), halb = e.n === 2;
  const klammer = `(${i})`;
  const pt = ganz === 0 ? "" : ganz === 1 ? klammer : lin ? `${klammer}^${ganz}` : klammer + hoch(ganz);
  if (!halb) return pt;
  const w = lin ? `sqrt(${i})` : `√(${i})`;
  return pt ? (lin ? `${pt}*${w}` : pt + w) : w;
}
// sinˢ(bx + d) und cosᶜ(bx + d) als einzelne Faktoren; getippt als sin(x)^2.
function trigFaktoren(Tr, lin) {
  const bt = Tr.b.z === Tr.b.n ? "x" : `${lin ? betragLin(Tr.b) : betragHtml(Tr.b)}x`;
  const arg = Tr.d.z === 0 ? bt : lin ? `${bt}${Tr.d.z < 0 ? "-" : "+"}${betragLin(Tr.d)}` : `${bt} ${Tr.d.z < 0 ? "−" : "+"} ${betragHtml(Tr.d)}`;
  const f = (fn, e) => (e === 0 ? null : e === 1 ? `${fn}(${arg})` : lin ? `${fn}(${arg})^${e}` : `${fn}${hoch(e)}(${arg})`);
  return [f("sin", Tr.s), f("cos", Tr.c)].filter(Boolean);
}
// Malpunkt nur, wo er beim Lesen hilft: 4x(x² − 1)², 2sin(x) und x√(x² + 1), aber x · sin(x),
// a · √(…) und sin(x) · cos(x). Getippt steht vor sqrt und vor jeder Winkelfunktion, die nicht direkt
// auf eine Zahl folgt, ein Stern — „asin“ läse sich sonst wie arcsin.
function verbinde(teile, lin) {
  let s = "", vorher = null;
  for (const { art, t } of teile) {
    if (!vorher) { s = t; vorher = art; continue; }
    const wurzel = /^(√|sqrt)/.test(t);
    let punkt;
    if (art === "trig") punkt = vorher !== "zahl";
    else if (wurzel) punkt = lin || vorher === "a";
    else punkt = false;
    s += punkt ? (lin ? "*" : " · ") : "";
    s += t;
    vorher = art;
  }
  return s;
}
function monoText(g, lin) {
  const c = q(Math.abs(g.k.z), g.k.n), a = lin ? aLin(g.j) : aHtml(g.j);
  const neg = g.poly && g.poly.e.z < 0;
  const polyT = g.poly ? polyPot(g.poly, neg ? qNeg(g.poly.e) : g.poly.e, lin) : "";
  const trigT = g.trig ? trigFaktoren(g.trig, lin) : [];
  const rest = [a && { art: "a", t: a }, g.p && { art: "x", t: xHoch(g.p, lin) }, !neg && polyT && { art: "poly", t: polyT }, ...trigT.map((t) => ({ art: "trig", t }))].filter(Boolean);
  if (!neg) {
    const zahl = c.z === c.n && rest.length ? "" : lin ? betragLin(c) : betragHtml(c);
    return verbinde([zahl && { art: "zahl", t: zahl }, ...rest].filter(Boolean), lin);
  }
  // Negative Hochzahl: Die Klammer steht im Nenner, der Nenner des Koeffizienten davor.
  const zaehler = verbinde([(c.z !== 1 || !rest.length) && { art: "zahl", t: String(c.z) }, ...rest].filter(Boolean), lin);
  const nenner = `${c.n === 1 ? "" : c.n}${polyT}`;
  return lin ? `${zaehler}/${nennerLin(nenner)}` : bruchHtml(zaehler, nenner);
}

// Ein Glied ohne sein Vorzeichen.
function gliedText(g, lin) {
  if (g.typ === "mono") return monoText(g, lin);
  const c = q(Math.abs(g.k.z), g.k.n), a = lin ? aLin(g.j) : aHtml(g.j);
  if (negativ(g)) {
    const zaehler = c.z === 1 && a ? a : `${c.z}${a}`;
    const nenner = `${c.n === 1 ? "" : c.n}${kern(g, lin)}`;
    return lin ? `${zaehler}/${nennerLin(nenner)}` : bruchHtml(zaehler, nenner);
  }
  const kt = kern(g, lin);
  if (!kt) return c.z === c.n && a ? a : (lin ? betragLin(c) : betragHtml(c)) + a;
  const vorn = c.z === c.n ? a : (lin ? betragLin(c) : betragHtml(c)) + a;
  // „a sin(x)“ ohne Malpunkt läse sich wie arcsin — nach dem Parameter steht vor einer Funktion
  // deshalb ein Malpunkt. Die getippte Form braucht ihn zusätzlich vor einer Wurzel.
  if (a && vorn.endsWith(a) && /^(sin|cos|√|sqrt)/.test(kt)) return lin ? `${vorn}*${kt}` : `${vorn} · ${kt}`;
  return lin && vorn && /^sqrt/.test(kt) ? `${vorn}*${kt}` : vorn + kt;
}
export function summeHtml(gl) {
  if (!gl.length) return "0";
  return gl.map((g, i) => (i === 0 ? (g.k.z < 0 ? "−" : "") : g.k.z < 0 ? " − " : " + ") + gliedText(g, false)).join("");
}
export function summeLin(gl) {
  if (!gl.length) return "0";
  return gl.map((g, i) => (i === 0 ? (g.k.z < 0 ? "-" : "") : g.k.z < 0 ? " - " : " + ") + gliedText(g, true)).join("");
}

// ================= Glieder: Werte, Ableitung, Stammfunktion =================

function gliedWert(g, x, p) {
  const c = qWert(g.k) * (g.j ? Math.pow(p.a, g.j) : 1);
  if (g.typ === "pot") return c * Math.pow(x, qWert(g.e));
  if (g.typ === "trig") return c * Math[g.fn](qWert(g.b) * x + qWert(g.d));
  if (g.typ === "kette") return c * Math.pow(qWert(g.m) * x + qWert(g.n), qWert(g.e));
  if (g.typ === "mono") {
    let w = c * Math.pow(x, g.p);
    if (g.poly) w *= Math.pow(qWert(g.poly.m) * Math.pow(x, g.poly.r) + qWert(g.poly.n) * (g.poly.t ? Math.pow(p.a, g.poly.t) : 1), qWert(g.poly.e));
    if (g.trig) { const u = qWert(g.trig.b) * x + qWert(g.trig.d); w *= Math.pow(Math.sin(u), g.trig.s) * Math.pow(Math.cos(u), g.trig.c); }
    return w;
  }
  return c * Math.pow(x, g.p) * gliedWert(g.v, x, p);
}
export const funktion = (gl) => (x, p = {}) => gl.reduce((s, g) => s + gliedWert(g, x, p), 0);

// Bringt ein mono-Glied in die einfachste Form: (…)¹ wird ausmultipliziert, und was danach ohne
// verkettete Faktoren bleibt, wird wieder pot, trig, kette oder prod — sonst fänden gleichartige
// Glieder beim Zusammenfassen nicht zueinander (f″ von sin²(x) + x² hätte sonst zwei x⁰-Glieder).
function normiere(g) {
  if (g.typ !== "mono") return [g];
  if (g.k.z === 0) return [];
  let { poly, trig } = g;
  if (poly && poly.e.z === 0) poly = null;
  if (trig && trig.s === 0 && trig.c === 0) trig = null;
  if (poly && poly.e.z === 1 && poly.e.n === 1) {
    return [
      ...normiere(M(qMal(g.k, poly.m), g.j, g.p + poly.r, null, trig)),
      ...normiere(M(qMal(g.k, poly.n), g.j + poly.t, g.p, null, trig)),
    ];
  }
  if (!poly && !trig) return [{ typ: "pot", k: g.k, j: g.j, e: q(g.p) }];
  if (!poly && trig.s + trig.c === 1) {
    const v = { typ: "trig", k: EINS, j: 0, fn: trig.s ? "sin" : "cos", b: trig.b, d: trig.d };
    return [g.p === 0 ? { ...v, k: g.k, j: g.j } : { typ: "prod", k: g.k, j: g.j, p: g.p, v }];
  }
  if (!trig && poly.r === 1 && poly.t === 0 && g.p === 0) return [{ typ: "kette", k: g.k, j: g.j, m: poly.m, n: poly.n, e: poly.e }];
  return [M(g.k, g.j, g.p, poly, trig)];
}
// Produktregel über alle Faktoren, für die verketteten mit der Kettenregel:
//   (xᵖ)′ = p·xᵖ⁻¹,  ((m·xʳ + n)ᵉ)′ = e·(m·xʳ + n)ᵉ⁻¹ · m·r·xʳ⁻¹,
//   (sinˢ u)′ = s·sinˢ⁻¹ u · cos u · b,  (cosᶜ u)′ = −c·cosᶜ⁻¹ u · sin u · b.
function ableitungMono(g) {
  const teile = [];
  if (g.p > 0) teile.push(M(qMal(g.k, q(g.p)), g.j, g.p - 1, g.poly, g.trig));
  if (g.poly) {
    const { m, r, e } = g.poly;
    teile.push(M(qMal(qMal(g.k, e), qMal(m, q(r))), g.j, g.p + r - 1, { ...g.poly, e: qPlus(e, q(-1)) }, g.trig));
  }
  if (g.trig) {
    const { b, s, c } = g.trig;
    if (s > 0) teile.push(M(qMal(g.k, qMal(q(s), b)), g.j, g.p, g.poly, { ...g.trig, s: s - 1, c: c + 1 }));
    if (c > 0) teile.push(M(qNeg(qMal(g.k, qMal(q(c), b))), g.j, g.p, g.poly, { ...g.trig, s: s + 1, c: c - 1 }));
  }
  return vereinfache(zusammenfassen(teile.flatMap(normiere)));
}
// Ist die Ableitung eines Glieds ganzrational und steht dort Ausmultipliziertes neben einer Klammer —
// (x² + 1)² + 4x⁴ + 4x² aus x(x² + 1)² —, wird ganz ausmultipliziert: 5x⁴ + 6x² + 1. Eine reine
// Kettenregel-Form wie 6x(x² + 3)² bleibt stehen.
const ganzrational = (g) => (g.typ === "pot" && g.e.n === 1 && g.e.z >= 0) || (g.typ === "mono" && !g.trig && g.poly && g.poly.e.n === 1 && g.poly.e.z > 0);
function vereinfache(gl) {
  if (!gl.every(ganzrational) || !gl.some((g) => g.typ === "pot") || !gl.some((g) => g.typ === "mono")) return gl;
  return zusammenfassen(gl.flatMap((g) => (g.typ === "mono" ? umform(g) : [g])));
}
function ableitungGlied(g) {
  if (g.typ === "mono") return ableitungMono(g);
  if (g.typ === "pot") return g.e.z === 0 ? [] : [{ ...g, k: qMal(g.k, g.e), e: qPlus(g.e, q(-1)) }];
  if (g.typ === "trig") return [{ ...g, fn: g.fn === "sin" ? "cos" : "sin", k: g.fn === "sin" ? qMal(g.k, g.b) : qNeg(qMal(g.k, g.b)) }];
  if (g.typ === "kette") {
    if (g.e.z === 0) return [];
    const k = qMal(qMal(g.k, g.e), g.m), e = qPlus(g.e, q(-1));
    return e.z === 0 ? [{ typ: "pot", k, j: g.j, e: NULL }] : [{ ...g, k, e }];
  }
  // Produktregel: (xᵖ · v)′ = p · xᵖ⁻¹ · v + xᵖ · v′.
  const teil1 = g.p === 1 ? { ...g.v, k: g.k, j: g.j } : { ...g, k: qMal(g.k, q(g.p)), p: g.p - 1 };
  const w = ableitungGlied(g.v)[0];
  const teil2 = w.typ === "pot" ? { typ: "pot", k: qMal(g.k, w.k), j: g.j, e: q(g.p) } : { typ: "prod", k: qMal(g.k, w.k), j: g.j, p: g.p, v: { ...w, k: EINS, j: 0 } };
  return [teil1, teil2];
}
// Gleichartige Glieder zusammenfassen (die Produktregel liefert sie bei f″ doppelt); Nullen fallen weg.
function zusammenfassen(gl) {
  const aus = [];
  for (const g of gl) {
    const schluessel = JSON.stringify({ ...g, k: null });
    const da = aus.find((h) => JSON.stringify({ ...h, k: null }) === schluessel);
    if (da) da.k = qPlus(da.k, g.k); else aus.push({ ...g });
  }
  return aus.filter((g) => g.k.z !== 0);
}
export const ableitung = (gl) => zusammenfassen(gl.flatMap(ableitungGlied));

function stammGlied(g) {
  if (g.typ === "pot") { const e = qPlus(g.e, EINS); return { ...g, k: qDurch(g.k, e), e }; }
  if (g.typ === "trig") return { ...g, fn: g.fn === "sin" ? "cos" : "sin", k: g.fn === "sin" ? qNeg(qDurch(g.k, g.b)) : qDurch(g.k, g.b) };
  if (g.typ === "kette") { const e = qPlus(g.e, EINS); return { ...g, k: qDurch(g.k, qMal(g.m, e)), e }; }
  throw new Error("Zu einem Produkt gibt es hier keine Stammfunktion.");
}
const binom = (n, k) => (k === 0 || k === n ? 1 : binom(n - 1, k - 1) + binom(n - 1, k));
const qHoch = (a, i) => q(Math.pow(a.z, i), Math.pow(a.n, i));
// Ein mono-Glied so umschreiben, dass die Regeln der Integralrechnung-Seite greifen:
// (m·xʳ + n)ᵉ ausmultiplizieren (ganzes e), sin²/cos² und sin · cos über den doppelten Winkel.
function umform(g) {
  if (g.poly && !g.trig && g.poly.e.n === 1 && g.poly.e.z > 0) {
    const { m, r, n, t } = g.poly, E = g.poly.e.z, aus = [];
    for (let i = E; i >= 0; i--) {
      const k = qMal(qMal(g.k, q(binom(E, i))), qMal(qHoch(m, i), qHoch(n, E - i)));
      aus.push({ typ: "pot", k, j: g.j + t * (E - i), e: q(g.p + r * i) });
    }
    return zusammenfassen(aus);
  }
  if (g.trig && !g.poly && g.p === 0) {
    const { b, d, s, c } = g.trig, b2 = qMal(b, q(2)), d2 = qMal(d, q(2)), halb = qMal(g.k, q(1, 2));
    if (s === 2 && c === 0) return [{ typ: "pot", k: halb, j: g.j, e: NULL }, { typ: "trig", k: qNeg(halb), j: g.j, fn: "cos", b: b2, d: d2 }];
    if (s === 0 && c === 2) return [{ typ: "pot", k: halb, j: g.j, e: NULL }, { typ: "trig", k: halb, j: g.j, fn: "cos", b: b2, d: d2 }];
    if (s === 1 && c === 1) return [{ typ: "trig", k: halb, j: g.j, fn: "sin", b: b2, d: d2 }];
  }
  throw new Error("Zu diesem Glied gibt es hier keine Stammfunktion.");
}
// sin²(x) = 0,5 − 0,5cos(2x): die Umformung, die eine Aufgabe dazu mit angibt.
const identitaet = (g) => { const h = M(EINS, 0, 0, null, g.trig); return `${summeHtml([h])} = ${summeHtml(umform(h))}`; };
const stammGlieder = (g) => (g.typ === "mono" ? zusammenfassen(umform(g).map(stammGlied)) : [stammGlied(g)]);
export const stammfunktion = (gl) => zusammenfassen(gl.flatMap(stammGlieder));

// ================= Musterlösungen =================

const eingabeform = (gl) => `<br>So tippst du es ein: <span class="eingabeform">${summeLin(gl)}</span>`;
const innenAbl = (P) => summeHtml([{ typ: "pot", k: qMal(P.m, q(P.r)), j: 0, e: q(P.r - 1) }]);
const nurPoly = (g) => g.typ === "mono" && g.poly && !g.trig && g.p === 0;
const nurTrigPotenz = (g) => g.typ === "mono" && g.trig && !g.poly && g.p === 0 && (g.trig.s === 0 || g.trig.c === 0);
function regelMono(g) {
  if (nurPoly(g)) return `Kettenregel: äußere Ableitung mal innere Ableitung (${innenPoly(g.poly, false)})′ = ${innenAbl(g.poly)}`;
  if (nurTrigPotenz(g)) {
    const e = g.trig.s || g.trig.c, u = trigFaktoren(T(g.trig.b, g.trig.d, g.trig.s ? 1 : 0, g.trig.c ? 1 : 0), false)[0];
    return `Kettenregel mit u = ${u}: (u${hoch(e)})′ = ${e}u${e > 2 ? hoch(e - 1) : ""} · u′`;
  }
  if (g.trig && !g.poly && g.p === 0 && g.trig.s === 1 && g.trig.c === 1) {
    const [u, v] = trigFaktoren(g.trig, false);
    return `Produktregel mit u = ${u} und v = ${v}: u′ · v + u · v′`;
  }
  if (g.poly && !g.trig) return `Produktregel mit u = ${xHoch(g.p, false)} und v = ${polyPot(g.poly, g.poly.e.z < 0 ? qNeg(g.poly.e) : g.poly.e, false)}${g.poly.e.z < 0 ? " im Nenner" : ""}; v′ mit der Kettenregel`;
  return "Produktregel und Kettenregel";
}
// Der Zwischenschritt der Kettenregel, solange er etwas zeigt: ((x² − 1)²)′ = 2(x² − 1) · 2x.
// Bei xᵖ · (…)ᵉ auch der Zwischenschritt der Produktregel: (x(x² + 1)²)′ = (x² + 1)² + x · 2(x² + 1) · 2x.
function zwischenAbl(g) {
  if (g.typ !== "mono" || !g.poly || g.trig || g.poly.e.n !== 1 || g.poly.e.z < 2) return "";
  const ia = innenAbl(g.poly), iaText = ia.startsWith("−") ? `(${ia})` : ia;
  const aussen = (k) => summeHtml([M(qMal(k, g.poly.e), g.j, 0, { ...g.poly, e: qPlus(g.poly.e, q(-1)) }, null)]);
  if (g.p === 0) return ia === "1" ? "" : `${aussen(g.k)} · ${iaText} = `;
  const teil1 = summeHtml([M(qMal(g.k, q(g.p)), g.j, g.p - 1, g.poly, null)]);
  const u = monoText(M(q(Math.abs(g.k.z), g.k.n), g.j, g.p, null, null), false);
  return `${teil1} ${g.k.z < 0 ? "−" : "+"} ${u} · ${aussen(EINS)}${ia === "1" ? "" : ` · ${iaText}`} = `;
}
function regelAbl(g) {
  if (g.typ === "mono") return regelMono(g);
  if (g.typ === "pot") return g.e.z === 0 ? "konstanter Summand fällt weg" : "Potenzregel: Exponent als Faktor nach vorn, Exponent um 1 verringern";
  if (g.typ === "trig") {
    const basis = g.fn === "sin" ? "(sin u)′ = cos u" : "(cos u)′ = −sin u";
    return g.b.z === g.b.n && g.d.z === 0 ? basis.replace(/u/g, "x") : `Kettenregel: ${basis}, mal innere Ableitung ${betragHtml(g.b)}`;
  }
  if (g.typ === "kette") return `Kettenregel: äußere Ableitung mal innere Ableitung ${g.m.z < 0 ? "−" : ""}${betragHtml(g.m)}`;
  return `Produktregel mit u = ${xPot(q(g.p), false)} und v = ${kern(g.v, false)}: u′ · v + u · v′`;
}
function regelStamm(g) {
  if (g.typ === "mono" && g.poly) return `ausmultiplizieren — innen steht ${innenPoly(g.poly, false)} und nicht mx + n, die Regel für lineare Verkettung gilt hier nicht —, dann Potenzregel rückwärts`;
  if (g.typ === "mono") return `umschreiben mit ${identitaet(g)}, dann lineare Verkettung`;
  if (g.typ === "pot") return g.e.z === 0 ? "Konstante k wird zu k · x" : "Potenzregel rückwärts: Exponent um 1 erhöhen, durch den neuen Exponenten teilen";
  if (g.typ === "trig") return `${g.fn === "sin" ? "sin wird zu −cos" : "cos wird zu sin"}${g.b.z === g.b.n ? "" : `, durch die innere Ableitung ${betragHtml(g.b)} teilen`}`;
  return `lineare Verkettung: Exponent um 1 erhöhen, durch den neuen Exponenten und durch die innere Ableitung ${g.m.z < 0 ? "−" : ""}${betragHtml(g.m)} teilen`;
}
const zeile = (links, rechts, regel) => `${links} ${rechts} <span class="progress-note">(${regel})</span>`;

// Rechenweg der Ableitung: Glied für Glied, dann das Ergebnis (ergebnis etwa „f′(x)“).
export function ableitungsWeg(gl, ergebnis = "f′(x)") {
  const teile = gl.map((g) => zeile(`(${summeHtml([g])})′ =`, zwischenAbl(g) + summeHtml(ableitungGlied(g)), regelAbl(g)));
  return `${teile.join("<br>")}<br><strong>${ergebnis} = <span class="term">${summeHtml(ableitung(gl))}</span></strong>`;
}
export function stammWeg(gl, ergebnis = "F(x)") {
  const teile = gl.map((g) => zeile(`${summeHtml([g])}${g.typ === "mono" ? ` = ${summeHtml(umform(g))}` : ""} &nbsp;→&nbsp;`, summeHtml(stammGlieder(g)), regelStamm(g)));
  return `${teile.join("<br>")}<br><strong>${ergebnis} = <span class="term">${summeHtml(stammfunktion(gl))}</span> + C</strong>`;
}
export { eingabeform };

// ================= Prüfen =================

const STELLEN = [0.3, 0.55, 0.8, 1.05, 1.3, 1.7, 2.1, 2.45];
const A_WERTE = [0.7, 1.6, 2.3];
const numAbl = (g, x, p, h = 1e-5) => (g(x + h, p) - g(x - h, p)) / (2 * h);
const gleich = (a, b, tol) => Math.abs(a - b) <= tol * (1 + Math.abs(b));
const STRICHE = ["", "′", "″", "‴"];

// art "ableitung": abl = [f, f′, f″, f‴] exakt, geprüft wird die Ordnung `ordnung`.
// art "stamm":     f exakt, fAbl = f′ exakt (für die Diagnose „das ist die Ableitung“).
// Liefert { ok, hinweis } — der Hinweis erklärt den wahrscheinlichen Fehler.
// extra: [{ f, text }] — Fehler, die nur zu dieser Funktion passen (etwa die vergessene innere
// Ableitung); f ist das, was bei diesem Fehler herauskäme (beim Aufleiten: die Ableitung davon).
export function pruefeTerm({ eingabe, art, ordnung = 1, abl, f, fAbl, parameter = [], fName = "f", extra = [] }) {
  let g;
  try { g = leseTerm(eingabe, { parameter }); } catch (e) {
    return { ok: false, hinweis: `Die Eingabe ist nicht lesbar: ${e.message}` };
  }
  const gelesen = `<br><span class="progress-note">Gelesen als: ${g.t}</span>`;
  const punkte = [];
  for (const x of STELLEN) for (const a of parameter.length ? A_WERTE : [null]) punkte.push({ x, p: a === null ? {} : { [parameter[0]]: a } });
  const k = ordnung, S = (i) => `${fName}${STRICHE[i]}`;
  const soll = art === "stamm" ? f : abl[k];
  const proben = punkte.map(({ x, p }) => ({ x, p, ist: art === "stamm" ? numAbl(g.f, x, p) : g.f(x, p), soll: soll(x, p), roh: g.f(x, p) }))
    .filter((r) => [r.ist, r.soll, r.roh].every(Number.isFinite));
  if (proben.length < 4) return { ok: false, hinweis: `Deine Eingabe ist an zu vielen Prüfstellen nicht definiert.${gelesen}` };
  const alle = (bed) => proben.every(bed);
  const tol = art === "stamm" ? 1e-5 : 1e-7;
  if (alle((r) => gleich(r.ist, r.soll, tol))) return { ok: true, hinweis: "" };
  // Ab hier: Diagnose. Die Vergleiche mit numerisch abgeleiteten Funktionen brauchen etwas mehr Spiel.
  const v = proben.find((r) => Math.abs(r.soll) > 1e-6), verh = v ? v.ist / v.soll : NaN;
  const diff = proben[0].ist - proben[0].soll;
  let grund;
  // Ein vergessener konstanter Summand zuerst: Bei großen Funktionswerten — (4x + 3)⁵ — ist „+ 3“
  // weniger als ein halbes Prozent und sähe sonst wie Runden aus. Erst ab 0,05, damit 0,33 statt 1/3
  // als Rundung erkannt bleibt. Ist die Lösung selbst konstant (f″ = 2), wäre „4“ zugleich „f″ + 2“
  // und „2 · f″“ — dann gilt die Reihenfolge weiter unten, und der Faktor wird zuerst genannt.
  const sollKonstant = alle((r) => gleich(r.soll, proben[0].soll, 1e-9));
  if (art !== "stamm" && !sollKonstant && Math.abs(diff) >= 0.05 && alle((r) => gleich(r.ist - r.soll, diff, 1e-7)))
    grund = `<strong>Bis auf eine Konstante richtig:</strong> Deine Eingabe ist ${S(k)}(x) ${diff < 0 ? "−" : "+"} ${zahl(Math.abs(diff))}. Ein konstanter Summand fällt beim Ableiten weg.`;
  // 2,5 %: 0,33 statt 1/3 liegt schon 1 % daneben, 0,17 statt 1/6 gut 2 %.
  else if (alle((r) => gleich(r.ist, r.soll, 0.025)))
    grund = "<strong>Fast richtig:</strong> Deine Eingabe weicht überall um weniger als 2,5 % ab. Vermutlich wurde gerundet — schreibe Brüche als Bruch, etwa 1/3 statt 0,33.";
  else if (extra.some((d) => alle((r) => gleich(r.ist, d.f(r.x, r.p), art === "stamm" ? 1e-5 : 1e-7))))
    grund = extra.find((d) => alle((r) => gleich(r.ist, d.f(r.x, r.p), art === "stamm" ? 1e-5 : 1e-7))).text;
  else if (art === "stamm") {
    if (alle((r) => gleich(r.roh, fAbl(r.x, r.p), 1e-6))) grund = `Das ist die <strong>Ableitung</strong> von ${fName}, nicht eine Stammfunktion. Gesucht ist ein F mit F′ = ${fName} — die Ableitungsregeln rückwärts.`;
    else if (alle((r) => gleich(r.roh, r.soll, 1e-6))) grund = `Das ist ${fName} selbst. Gesucht ist eine Funktion, deren Ableitung ${fName} ergibt.`;
    else if (alle((r) => gleich(r.ist, -r.soll, 1e-5))) grund = `<strong>Vorzeichenfehler:</strong> Die Ableitung deiner Eingabe ist genau −${fName}. Häufig bei sin und cos: (−cos x)′ = sin x, (sin x)′ = cos x.`;
    else if (Number.isFinite(verh) && Math.abs(verh) > 1e-6 && alle((r) => gleich(r.ist, verh * r.soll, 1e-5)))
      grund = `<strong>Bis auf einen Faktor richtig:</strong> Die Ableitung deiner Eingabe ist ${zahl(verh)} · ${fName}(x). Oft fehlt das Teilen durch den neuen Exponenten oder durch die innere Ableitung.`;
    else {
      const r = proben.find((s) => !gleich(s.ist, s.soll, 1e-5));
      grund = `Die Probe stimmt nicht: Bei x = ${zahl(r.x)} hat deine Eingabe die Steigung ${zahl(r.ist)}, aber ${fName}(x) = ${zahl(r.soll)}.`;
    }
  } else {
    if (alle((r) => gleich(r.ist, abl[k - 1](r.x, r.p), 1e-7)))
      grund = k === 1 ? `Das ist ${fName} selbst — noch nicht abgeleitet.` : `Das ist ${S(k - 1)} — einmal zu wenig abgeleitet. ${S(k)} ist die Ableitung von ${S(k - 1)}.`;
    else if (abl[k + 1] && alle((r) => gleich(r.ist, abl[k + 1](r.x, r.p), 1e-7)))
      grund = `Das ist ${S(k + 1)} — einmal zu oft abgeleitet.`;
    else if (k === 1 && alle((r) => gleich(numAbl(g.f, r.x, r.p), abl[0](r.x, r.p), 1e-5)))
      grund = `Leitet man deine Eingabe ab, kommt ${fName} heraus — du hast in die falsche Richtung gerechnet. Gesucht ist ${S(1)}: Exponent als Faktor nach vorn, Exponent um 1 verringern.`;
    else if (parameter.length && alle((r) => {
      const a = parameter[0], h = 1e-5;
      const nachA = (abl[k - 1](r.x, { ...r.p, [a]: r.p[a] + h }) - abl[k - 1](r.x, { ...r.p, [a]: r.p[a] - h })) / (2 * h);
      return gleich(r.ist, nachA, 1e-5);
    }))
      grund = `Das ist die Ableitung <strong>nach ${parameter[0]}</strong>. Abgeleitet wird nach x; ${parameter[0]} ist eine feste Zahl.`;
    else if (alle((r) => gleich(r.ist, -r.soll, 1e-7)))
      grund = `<strong>Vorzeichenfehler:</strong> Deine Eingabe ist genau −${S(k)}(x). Häufig bei cos ((cos x)′ = −sin x) oder bei negativen Exponenten ((x⁻¹)′ = −x⁻²).`;
    else if (Number.isFinite(verh) && Math.abs(verh) > 1e-6 && alle((r) => gleich(r.ist, verh * r.soll, 1e-7)))
      grund = `<strong>Bis auf einen Faktor richtig:</strong> Deine Eingabe ist ${zahl(verh)} · ${S(k)}(x). Oft fehlt der alte Exponent als Faktor oder die innere Ableitung.`;
    else if (Math.abs(diff) > 1e-6 && alle((r) => gleich(r.ist - r.soll, diff, 1e-7)))
      grund = `<strong>Bis auf eine Konstante richtig:</strong> Deine Eingabe ist ${S(k)}(x) ${diff < 0 ? "−" : "+"} ${zahl(Math.abs(diff))}. Ein konstanter Summand fällt beim Ableiten weg.`;
    else {
      const r = proben.find((s) => !gleich(s.ist, s.soll, 1e-7));
      grund = `Bei x = ${zahl(r.x)}${parameter.length ? ` und ${parameter[0]} = ${zahl(r.p[parameter[0]])}` : ""} ergibt deine Eingabe ${zahl(r.ist)}, aber ${S(k)}(x) = ${zahl(r.soll)}.`;
    }
  }
  return { ok: false, hinweis: grund + gelesen };
}

// Für die Aufgabenwerkbank: check und hinweis rufen dieselbe Prüfung auf — einmal gerechnet genügt.
export function termCheck(optionen) {
  let letzte = null, ergebnis = null;
  const pruefe = (roh) => {
    if (roh !== letzte) { letzte = roh; ergebnis = roh.trim() ? pruefeTerm({ ...optionen, eingabe: roh }) : { ok: false, hinweis: "" }; }
    return ergebnis;
  };
  return { check: (roh) => pruefe(roh).ok, hinweis: (roh) => pruefe(roh).hinweis };
}

// Hilfen zum Würfeln.
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export function mische(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
// Kurzschreibweisen für die Seiten.
export const pot = (k, e, j = 0) => ({ typ: "pot", k: typeof k === "number" ? q(k) : k, j, e: typeof e === "number" ? q(e) : e });
export const trig = (k, fn, b = 1, d = 0, j = 0) => ({ typ: "trig", k: typeof k === "number" ? q(k) : k, j, fn, b: typeof b === "number" ? q(b) : b, d: typeof d === "number" ? q(d) : d });
export const kette = (k, m, n, e, j = 0) => ({ typ: "kette", k: typeof k === "number" ? q(k) : k, j, m: q(m), n: q(n), e: typeof e === "number" ? q(e) : e });
export const prod = (k, p, v, j = 0) => ({ typ: "prod", k: typeof k === "number" ? q(k) : k, j, p, v: { ...v, k: EINS, j: 0 } });
const alsQ = (z) => (typeof z === "number" ? q(z) : z);
const einGlied = (g) => { const n = normiere(g); if (n.length !== 1) throw new Error("Das Glied zerfällt beim Vereinfachen."); return n[0]; };
// k · aʲ · xᵖ · (m·xʳ + n·aᵗ)ᵉ, etwa verkettung(1, 1, 2, -1, 2) = (x² − 1)².
export const verkettung = (k, m, r, n, e, { p = 0, t = 0, j = 0 } = {}) => einGlied(M(alsQ(k), j, p, P(alsQ(m), r, alsQ(n), t, alsQ(e)), null));
// k · aʲ · sinˢ(bx + d) · cosᶜ(bx + d), etwa trigPotenz(3, 2, 0) = 3sin²(x).
export const trigPotenz = (k, s, c, b = 1, d = 0, j = 0) => einGlied(M(alsQ(k), j, 0, null, T(alsQ(b), alsQ(d), s, c)));

// ================= Aufgabenbauer für die Werkbank (mathematik/aufgaben.js) =================

const SCHREIBWEISE = `<br><span class="progress-note">Tippe den Term ein, etwa 3x^2 − 4/x^2 + sqrt(x) oder 2sin(3x); x³ und √x gehen auch, der Malpunkt darf fehlen. Brüche als Bruch: 1/3 statt 0,33.</span>`;
const unikat = (arr) => [...new Set(arr)];

// Ableiten: eine Ableitung (f′) oder zwei Felder (f′ und f″).
export function ableitungsAufgabe(gl, { name = "f", parameter = [], zweite = false, zusatz = "" } = {}) {
  const a1 = ableitung(gl), a2 = ableitung(a1), a3 = ableitung(a2);
  const abl = [gl, a1, a2, a3].map(funktion);
  const optionen = { art: "ableitung", abl, parameter, fName: name };
  // Die häufigste Panne bei der Kettenregel: nur die äußere Funktion abgeleitet.
  const ketten = gl.filter((g) => nurPoly(g) || nurTrigPotenz(g));
  const extra = [];
  if (ketten.length) {
    const aussen = (g) => (nurPoly(g)
      ? [M(qMal(g.k, g.poly.e), g.j, 0, { ...g.poly, e: qPlus(g.poly.e, q(-1)) }, null)]
      : [M(qMal(g.k, q(g.trig.s || g.trig.c)), g.j, 0, null, { ...g.trig, s: Math.max(g.trig.s - 1, 0), c: Math.max(g.trig.c - 1, 0) })]);
    const innere = unikat(ketten.map((g) => (nurPoly(g)
      ? `(${innenPoly(g.poly, false)})′ = ${innenAbl(g.poly)}`
      : (() => { const u = { typ: "trig", k: EINS, j: 0, fn: g.trig.s ? "sin" : "cos", b: g.trig.b, d: g.trig.d }; return `(${summeHtml([u])})′ = ${summeHtml(ableitungGlied(u))}`; })())));
    extra.push({
      f: funktion(gl.flatMap((g) => (ketten.includes(g) ? aussen(g) : ableitungGlied(g)))),
      text: `Die <strong>innere Ableitung fehlt:</strong> Nach der Kettenregel wird die äußere Ableitung noch mit der Ableitung der inneren Funktion multipliziert — hier ${innere.join(" und ")}.`,
    });
  }
  const tipps = unikat(gl.map(regelAbl)).map((t) => t[0].toUpperCase() + t.slice(1) + ".");
  const angabe = `${name}(x) = <span class="term">${summeHtml(gl)}</span>${zusatz}`;
  if (!zweite) {
    return {
      promptHtml: `Gegeben ist ${angabe}.<br><strong>Bestimme die Ableitungsfunktion ${name}′.</strong>` + SCHREIBWEISE,
      ...termCheck({ ...optionen, ordnung: 1, extra }),
      placeholder: `${name}′(x) = …`,
      tipps,
      musterloesungHtml: ableitungsWeg(gl, `${name}′(x)`) + eingabeform(a1),
    };
  }
  return {
    promptHtml: `Gegeben ist ${angabe}.<br><strong>Bestimme ${name}′(x) und ${name}″(x).</strong>` + SCHREIBWEISE,
    felder: [
      { name: `${name}′(x) =`, platzhalter: `${name}′(x)`, ...termCheck({ ...optionen, ordnung: 1, extra }) },
      { name: `${name}″(x) =`, platzhalter: `${name}″(x)`, ...termCheck({ ...optionen, ordnung: 2 }) },
    ],
    tipps: [...tipps, `${name}″ ist die Ableitung von ${name}′ — leite dein Ergebnis noch einmal ab.`],
    musterloesungHtml: ableitungsWeg(gl, `${name}′(x)`) + eingabeform(a1) + "<br><br>" + ableitungsWeg(a1, `${name}″(x)`) + eingabeform(a2),
  };
}

// Aufleiten: eine Stammfunktion F.
export function stammAufgabe(gl, { name = "f" } = {}) {
  const F = stammfunktion(gl);
  // Die Regel für lineare Verkettung auf (x² − 1)² angewandt, ergibt (x² − 1)³ / 3; abgeleitet kommt
  // die innere Ableitung 2x als Faktor dazu. Durch m geteilt (wie bei mx + n) bleibt r·xʳ⁻¹ übrig.
  const nichtlinear = gl.filter((g) => nurPoly(g) && g.poly.r > 1);
  const extra = nichtlinear.length ? [{
    f: (x, p) => gl.reduce((s, g) => s + gliedWert(g, x, p) * (nichtlinear.includes(g) ? g.poly.r * Math.pow(x, g.poly.r - 1) : 1), 0),
    text: `Die Regel für lineare Verkettung gilt nur, wenn innen mx + n steht — hier steht ${unikat(nichtlinear.map((g) => innenPoly(g.poly, false))).join(" bzw. ")}. Leitet man deine Eingabe zur Probe ab, kommt nach der Kettenregel die innere Ableitung als Faktor dazu, und es entsteht nicht ${name}. Multipliziere zuerst aus.`,
  }] : [];
  const umformungen = unikat(gl.filter((g) => g.typ === "mono" && g.trig).map(identitaet));
  const tipps = unikat(gl.map(regelStamm)).map((t) => t[0].toUpperCase() + t.slice(1) + ".");
  return {
    promptHtml: `Gegeben ist ${name}(x) = <span class="term">${summeHtml(gl)}</span>.<br><strong>Bestimme eine Stammfunktion F von ${name}.</strong>` +
      (umformungen.length ? `<br>Verwende dabei ${umformungen.join(" und ")}.` : "") + SCHREIBWEISE,
    ...termCheck({ art: "stamm", f: funktion(gl), fAbl: funktion(ableitung(gl)), fName: name, extra }),
    placeholder: "F(x) = …",
    tipps: [...tipps, "Mach die Probe: Leite dein F ab — es muss genau f herauskommen."],
    musterloesungHtml: stammWeg(gl) + `<br><strong>Probe:</strong> (${summeHtml(F)})′ = ${summeHtml(ableitung(F))} = ${name}(x) ✓` + eingabeform(F),
  };
}
