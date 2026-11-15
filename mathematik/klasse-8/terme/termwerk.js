// Werkbank für die Termseiten der Klasse 8 — gemeinsam für alle fünf Lernpfade (Terme aufstellen,
// vereinfachen, ausmultiplizieren und ausklammern, Summen multiplizieren, binomische Formeln).
//
//   lies(text, variablen)      liest eine getippte Eingabe OHNE eval: Zahlen mit Komma, Variablen
//                              (ein Buchstabe), + − · * : /, Klammern, Hochzahlen (x^2, x², (a+b)²) und
//                              den weggelassenen Malpunkt (3x, 2xy, 3(x + 1), (x + 1)(x − 1)). Heraus
//                              kommt ein exaktes Polynom (Brüche, keine Kommazahlen) und die STRUKTUR
//                              der Eingabe — denn ob ein Term „vereinfacht“ oder „ausgeklammert“ ist,
//                              ist eine Frage der Schreibweise, nicht des Werts.
//   pruefe(roh, auftrag)       vergleicht exakt mit dem Sollterm, prüft die verlangte Form und nennt
//                              bei einem Fehler den wahrscheinlichen Grund.
//   text(p) / html(p)          schreibt ein Polynom ordentlich: 3x² − 2xy + 5.
//   termAufgabe({ … })         eine fertige Aufgabe für mountUebungsaufgaben() (mathematik/aufgaben.js).
//
// Exakt statt numerisch: Bei 0,1 + 0,2 soll niemand an einem Rundungsfehler scheitern, und zwei
// Terme sind genau dann gleichwertig, wenn ihre ausmultiplizierten Formen Glied für Glied
// übereinstimmen.

"use strict";

// ---------- Brüche ----------

const ggT = (a, b) => {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
};
export function Q(z, n = 1) {
  if (!Number.isInteger(z) || !Number.isInteger(n) || n === 0) throw new Error(`Kein Bruch: ${z}/${n}`);
  if (n < 0) {
    z = -z;
    n = -n;
  }
  const g = ggT(z, n) || 1;
  return { z: z / g, n: n / g };
}
const qPlus = (a, b) => Q(a.z * b.n + b.z * a.n, a.n * b.n);
const qMal = (a, b) => Q(a.z * b.z, a.n * b.n);
const qWert = (a) => a.z / a.n;
// Eine Zahl als Bruch — aus einer Kommazahl der Eingabe wird ein genauer Bruch (2,5 → 5/2).
function qAus(x) {
  if (typeof x === "object") return x;
  const s = String(x);
  const m = s.match(/^(-?)(\d+)(?:\.(\d+))?$/);
  if (!m) throw new Error(`Keine Zahl: ${s}`);
  const nach = m[3] || "";
  const z = Number(m[2] + nach) * (m[1] ? -1 : 1);
  return Q(z, 10 ** nach.length);
}

// ---------- Polynome ----------
//
// Ein Polynom ist eine Map: Schlüssel des Monoms → { v, k }. v ordnet jeder Variablen ihre Hochzahl
// zu ({ x: 2, y: 1 } für x²y), k ist der Koeffizient als Bruch. Der Schlüssel ist die sortierte
// Schreibweise („x^2y“), die Konstante hat den leeren Schlüssel.

function schluessel(v) {
  return Object.keys(v).filter((n) => v[n] > 0).sort().map((n) => (v[n] === 1 ? n : `${n}^${v[n]}`)).join("");
}
function aufraeumen(p) {
  for (const [s, m] of p) if (m.k.z === 0) p.delete(s);
  return p;
}
export function zahl(x) {
  const k = qAus(x);
  return aufraeumen(new Map([["", { v: {}, k }]]));
}
export function variable(name, hoch = 1, k = 1) {
  const v = { [name]: hoch };
  return aufraeumen(new Map([[schluessel(v), { v, k: qAus(k) }]]));
}
export function plus(...ps) {
  const out = new Map();
  for (const p of ps) {
    for (const [s, m] of p) {
      const alt = out.get(s);
      out.set(s, { v: m.v, k: alt ? qPlus(alt.k, m.k) : m.k });
    }
  }
  return aufraeumen(out);
}
export function mal(...ps) {
  return ps.reduce((a, b) => {
    const out = new Map();
    for (const [, m1] of a) {
      for (const [, m2] of b) {
        const v = { ...m1.v };
        for (const n in m2.v) v[n] = (v[n] || 0) + m2.v[n];
        const s = schluessel(v);
        const alt = out.get(s);
        const k = qMal(m1.k, m2.k);
        out.set(s, { v, k: alt ? qPlus(alt.k, k) : k });
      }
    }
    return aufraeumen(out);
  }, zahl(1));
}
export const neg = (p) => mal(zahl(-1), p);
export const minus = (a, b) => plus(a, neg(b));
export function hoch(p, n) {
  let out = zahl(1);
  for (let i = 0; i < n; i++) out = mal(out, p);
  return out;
}
export function gleich(a, b) {
  const d = minus(a, b);
  return d.size === 0;
}
export const glieder = (p) => [...p.values()];
const grad = (m) => Object.values(m.v).reduce((s, e) => s + e, 0);
export const istKonstant = (p) => glieder(p).every((m) => grad(m) === 0);
// Der Wert eines Polynoms, wenn man für die Variablen Zahlen einsetzt.
export function wert(p, belegung) {
  let s = 0;
  for (const m of glieder(p)) {
    let t = qWert(m.k);
    for (const n in m.v) t *= Math.pow(belegung[n], m.v[n]);
    s += t;
  }
  return s;
}

// ---------- Schreiben ----------

const HOCH = { 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" };
const hochzahl = (e) => String(e).split("").map((c) => HOCH[c]).join("");
const FORMAT = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 6 });
// Ein Bruch als Zahl, wenn er abbricht (½ → 0,5), sonst als Bruch — in Text als „1/3“, in HTML gesetzt.
function bruchText(k, html) {
  let n = k.n;
  while (n % 2 === 0) n /= 2;
  while (n % 5 === 0) n /= 5;
  if (n === 1) return FORMAT.format(Math.abs(qWert(k)));
  return html
    ? `<span class="bruch"><span class="z">${Math.abs(k.z)}</span><span class="n">${k.n}</span></span>`
    : `${Math.abs(k.z)}/${k.n}`;
}
// Die Reihenfolge der Glieder: höchster Grad zuerst, bei gleichem Grad nach der Reihenfolge der
// Variablen (x² vor xy vor y²), die Zahl zuletzt — so, wie es im Heft steht.
function sortiert(p, reihenfolge) {
  const rang = (n) => {
    const i = reihenfolge.indexOf(n);
    return i < 0 ? 100 + n.charCodeAt(0) : i;
  };
  const vektor = (m) => {
    const out = [];
    const namen = Object.keys(m.v).sort((a, b) => rang(a) - rang(b));
    for (const n of namen) out.push([rang(n), m.v[n]]);
    return out;
  };
  return glieder(p).sort((a, b) => {
    if (grad(b) !== grad(a)) return grad(b) - grad(a);
    const va = vektor(a), vb = vektor(b);
    for (let i = 0; i < Math.max(va.length, vb.length); i++) {
      if (!va[i]) return 1;
      if (!vb[i]) return -1;
      if (va[i][0] !== vb[i][0]) return va[i][0] - vb[i][0];
      if (va[i][1] !== vb[i][1]) return vb[i][1] - va[i][1];
    }
    return 0;
  });
}
function monomText(m, reihenfolge, html) {
  const rang = (n) => {
    const i = reihenfolge.indexOf(n);
    return i < 0 ? 100 + n.charCodeAt(0) : i;
  };
  const vars = Object.keys(m.v).filter((n) => m.v[n] > 0).sort((a, b) => rang(a) - rang(b))
    .map((n) => n + (m.v[n] > 1 ? hochzahl(m.v[n]) : "")).join("");
  const betrag = { z: Math.abs(m.k.z), n: m.k.n };
  const k = betrag.z === 1 && betrag.n === 1 && vars ? "" : bruchText(betrag, html);
  return k + vars;
}
// Ein Polynom ordentlich geschrieben: „3x² − 2xy + 5“, mit echtem Minuszeichen.
export function text(p, { reihenfolge = ["x", "y", "z", "a", "b", "c", "n", "m"], html = false } = {}) {
  const g = sortiert(p, reihenfolge);
  if (!g.length) return "0";
  return g.map((m, i) => {
    const t = monomText(m, reihenfolge, html);
    const negativ = m.k.z < 0;
    return i === 0 ? (negativ ? "−" : "") + t : (negativ ? " − " : " + ") + t;
  }).join("");
}
export const html = (p, opt = {}) => text(p, { ...opt, html: true });
export const monom = (m, opt = {}) => text(new Map([[schluessel(m.v), m]]), opt);

// ---------- Lesen ----------

export class Lesefehler extends Error {}

const HOCHGESTELLT = { "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9" };

function zerlege(text, variablen) {
  const s = String(text)
    .replace(/[−–]/g, "-").replace(/[·⋅×∙]/g, "*").replace(/:/g, "/").replace(/,/g, ".")
    .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g, (m) => "^" + [...m].map((c) => HOCHGESTELLT[c]).join(""))
    .replace(/\s+/g, "");
  if (!s) throw new Lesefehler("Die Eingabe ist leer.");
  const marken = [];
  for (let i = 0; i < s.length;) {
    const c = s[i];
    const z = s.slice(i).match(/^\d+(\.\d+)?/);
    if (z) {
      marken.push({ art: "zahl", wert: z[0] });
      i += z[0].length;
    } else if (/[a-z]/i.test(c)) {
      if (!variablen.includes(c)) {
        throw new Lesefehler(variablen.length === 1
          ? `„${c}“ kommt in diesem Term nicht vor — die Variable heißt ${variablen[0]}.`
          : `„${c}“ kommt in diesem Term nicht vor — die Variablen heißen ${variablen.join(", ")}.`);
      }
      marken.push({ art: "var", wert: c });
      i++;
    } else if ("+-*/^()".includes(c)) {
      marken.push({ art: c });
      i++;
    } else {
      throw new Lesefehler(`Das Zeichen „${c}“ kann ich nicht lesen.`);
    }
  }
  return marken;
}

// Rekursiver Abstieg. Jeder Knoten liefert sein Polynom und, für die Formprüfung, wie er gebaut ist.
//   summe   := produkt (('+' | '-') produkt)*
//   produkt := vorzeichen ('*' | '/' | ⟨weggelassen⟩) vorzeichen …
//   vorzeichen := ('+' | '-') vorzeichen | potenz
//   potenz  := grund ('^' ganzzahl)?
//   grund   := zahl | variable | '(' summe ')'
function leser(marken) {
  let i = 0;
  const sieh = () => marken[i];
  const nimm = (art) => {
    const m = marken[i];
    if (!m || m.art !== art) return null;
    i++;
    return m;
  };
  function summe() {
    const teile = [];
    let vz = 1;
    if (sieh() && (sieh().art === "+" || sieh().art === "-")) {
      vz = sieh().art === "-" ? -1 : 1;
      i++;
    }
    teile.push({ vz, knoten: produkt() });
    while (sieh() && (sieh().art === "+" || sieh().art === "-")) {
      const v = sieh().art === "-" ? -1 : 1;
      i++;
      if (sieh() && (sieh().art === "+" || sieh().art === "-")) {
        throw new Lesefehler("Zwei Rechenzeichen hintereinander — setz die negative Zahl in Klammern: 3 + (−2).");
      }
      teile.push({ vz: v, knoten: produkt() });
    }
    const p = plus(...teile.map((t) => (t.vz < 0 ? neg(t.knoten.p) : t.knoten.p)));
    return { art: "summe", p, teile };
  }
  function produkt() {
    const faktoren = [vorzeichen()];
    const ops = [];
    for (;;) {
      const m = sieh();
      if (!m) break;
      if (m.art === "*" || m.art === "/") {
        i++;
        ops.push(m.art);
        faktoren.push(vorzeichen());
      } else if (m.art === "zahl" || m.art === "var" || m.art === "(") {
        // Weggelassener Malpunkt: 3x, xy, 3(x + 1), (x + 1)(x − 1), x(x + 2). Eine Zahl HINTER
        // einer Variablen oder Klammer wäre missverständlich (x2 — heißt das x² oder 2x?).
        const vorher = marken[i - 1];
        if (m.art === "zahl" && vorher && (vorher.art === "var" || vorher.art === ")")) {
          throw new Lesefehler(`Schreib die Zahl vor die Variable (2x statt x2) und Hochzahlen mit ^ oder ²: x^2.`);
        }
        ops.push("·");
        faktoren.push(vorzeichen());
      } else break;
    }
    let p = faktoren[0].p;
    for (let j = 1; j < faktoren.length; j++) {
      if (ops[j - 1] === "/") {
        const f = faktoren[j].p;
        if (!istKonstant(f) || f.size === 0) throw new Lesefehler("Geteilt wird hier nur durch eine Zahl (und nie durch 0).");
        const k = glieder(f)[0].k;
        p = mal(p, zahl(1), new Map([["", { v: {}, k: Q(k.n, k.z) }]]));
      } else {
        p = mal(p, faktoren[j].p);
      }
    }
    return faktoren.length === 1 ? faktoren[0] : { art: "produkt", p, faktoren, ops };
  }
  function vorzeichen() {
    if (sieh() && (sieh().art === "-" || sieh().art === "+")) {
      const v = sieh().art === "-" ? -1 : 1;
      i++;
      const k = vorzeichen();
      return { art: "vorzeichen", vz: v, innen: k, p: v < 0 ? neg(k.p) : k.p };
    }
    return potenz();
  }
  function potenz() {
    const g = grund();
    if (nimm("^")) {
      const z = nimm("zahl");
      if (!z || !/^\d+$/.test(z.wert)) throw new Lesefehler("Nach ^ gehört eine ganze Zahl: x^2.");
      const e = Number(z.wert);
      if (e > 12) throw new Lesefehler("Diese Hochzahl ist zu groß.");
      return { art: "potenz", grund: g, e, p: hoch(g.p, e) };
    }
    return g;
  }
  function grund() {
    const m = sieh();
    if (!m) throw new Lesefehler("Der Term hört mitten drin auf — fehlt am Ende noch etwas?");
    if (m.art === "zahl") {
      i++;
      return { art: "zahl", wert: m.wert, p: zahl(m.wert) };
    }
    if (m.art === "var") {
      i++;
      return { art: "var", name: m.wert, p: variable(m.wert) };
    }
    if (m.art === "(") {
      i++;
      const innen = summe();
      if (!nimm(")")) throw new Lesefehler("Eine Klammer wird geöffnet, aber nicht geschlossen.");
      return { art: "klammer", innen, p: innen.p };
    }
    if (m.art === ")") throw new Lesefehler("Eine Klammer wird geschlossen, die nie geöffnet wurde — oder in ihr steht nichts.");
    throw new Lesefehler(`An dieser Stelle fehlt eine Zahl oder Variable (vor „${m.art === "*" ? "·" : m.art === "/" ? ":" : m.art}“).`);
  }
  const baum = summe();
  if (i < marken.length) {
    throw new Lesefehler(marken[i].art === ")" ? "Eine Klammer wird geschlossen, die nie geöffnet wurde." : "Der Term ist an einer Stelle nicht lesbar — prüf die Rechenzeichen.");
  }
  return baum;
}

// Ist der Knoten ein „fertiges“ Glied: eine Zahl, Variablen mit Hochzahlen, oder Zahl mal Variablen —
// jede Variable höchstens einmal, die Zahl (wenn überhaupt) vorn? So schreibt man ein vereinfachtes
// Glied: 3x²y, nicht 3 · x · x · y und nicht x · 3.
function gliedForm(knoten) {
  const faktoren = knoten.art === "produkt" ? knoten.faktoren : [knoten];
  if (knoten.art === "produkt" && knoten.ops.some((o) => o === "/")) return null;
  const v = {};
  let zahlen = 0;
  for (let j = 0; j < faktoren.length; j++) {
    const f = faktoren[j];
    if (f.art === "zahl") {
      if (j > 0) return null;
      zahlen++;
    } else if (f.art === "var" || (f.art === "potenz" && f.grund.art === "var" && f.e >= 2)) {
      const n = f.art === "var" ? f.name : f.grund.name;
      if (v[n]) return null;
      v[n] = f.art === "var" ? 1 : f.e;
    } else return null;
  }
  if (zahlen > 1) return null;
  return { v };
}

// Was die Formprüfung über eine Eingabe wissen muss.
function struktur(baum) {
  const teile = baum.art === "summe" ? baum.teile : [{ vz: 1, knoten: baum }];
  // „Normalform“: eine Summe fertiger Glieder, keine zwei gleichartig, keines mit dem Faktor 0.
  const formen = teile.map((t) => gliedForm(t.knoten));
  const schl = formen.map((f) => f && schluessel(f.v));
  const doppelt = schl.filter((s, j) => s !== null && schl.indexOf(s) !== j);
  const nullGlied = teile.some((t) => t.knoten.p.size === 0);
  const normal = formen.every(Boolean) && doppelt.length === 0 && !nullGlied;
  // „Produktform“: ein einziges Glied (höchstens mit Vorzeichen), das Klammern mit Summen enthält.
  let produkt = null;
  if (teile.length === 1) {
    let k = teile[0].knoten;
    while (k.art === "vorzeichen") k = k.innen;
    const faktoren = k.art === "produkt" ? k.faktoren : [k];
    const klammern = faktoren.filter((f) => {
      const g = f.art === "potenz" ? f.grund : f;
      return g.art === "klammer" && g.innen.art === "summe" && g.innen.teile.length >= 2;
    }).map((f) => (f.art === "potenz" ? f.grund.innen.p : f.innen.p));
    if (klammern.length) produkt = { klammern, faktoren: faktoren.length };
  }
  return { normal, doppelt, produkt, teile: teile.length };
}

export function lies(text, variablen = ["x"]) {
  const baum = leser(zerlege(text, variablen));
  return { p: baum.p, struktur: struktur(baum) };
}

// ---------- Prüfen ----------

// Hat eine Summe noch einen gemeinsamen Faktor — eine Zahl größer als 1 in allen Koeffizienten oder
// eine Variable in allen Gliedern? Dann ist sie nicht vollständig ausgeklammert.
export function gemeinsamerFaktor(p) {
  const g = glieder(p);
  if (g.length < 2) return null;
  const ganz = g.every((m) => m.k.n === 1);
  const t = ganz ? g.reduce((a, m) => ggT(a, m.k.z), 0) : 1;
  const v = {};
  for (const n of Object.keys(g[0].v)) {
    const e = Math.min(...g.map((m) => m.v[n] || 0));
    if (e > 0) v[n] = e;
  }
  if (t <= 1 && Object.keys(v).length === 0) return null;
  return { t, v };
}

// Belegungen zum Vorrechnen: kleine, verschiedene Zahlen, bei denen sich zwei Terme sichtbar
// unterscheiden. Gesucht wird in einer festen Liste — nichts wird verworfen und neu gezogen.
const PROBEN = [2, 3, -1, 5, -2, 4, 1, 6, -3, 7];
function probe(a, b, variablen) {
  for (let s = 0; s < PROBEN.length; s++) {
    const bel = {};
    variablen.forEach((n, j) => { bel[n] = PROBEN[(s + 3 * j) % PROBEN.length]; });
    const wa = wert(a, bel), wb = wert(b, bel);
    if (Math.abs(wa - wb) > 1e-9) return { bel, wa, wb };
  }
  return null;
}
const zahlText = (x) => FORMAT.format(Math.round(x * 1e6) / 1e6).replace("-", "−");

/**
 * Prüft eine Termeingabe.
 *   soll        das Sollpolynom
 *   variablen   die Buchstaben, die vorkommen dürfen
 *   form        "beliebig" | "normal" (vereinfacht, ohne Klammern) | "ausgeklammert" (Produkt mit
 *               Klammer, in der Klammer kein gemeinsamer Faktor mehr) | "produkt" (nur Produktform)
 *   falsch      [[polynom, hinweis], …] — typische Fehler; der erste passende Hinweis wird genannt
 *   formHinweis Text, wenn der Term gleichwertig ist, aber die Form nicht stimmt (sonst ein Standardtext)
 * Rückgabe: { ok, text }
 */
export function pruefe(roh, { soll, variablen = ["x"], form = "beliebig", falsch = [], formHinweis = null }) {
  let e;
  try {
    e = lies(roh, variablen);
  } catch (err) {
    if (err instanceof Lesefehler) return { ok: false, text: err.message };
    throw err;
  }
  if (!gleich(e.p, soll)) {
    for (const [f, hinweis] of falsch) if (f && gleich(e.p, f)) return { ok: false, text: hinweis };
    if (gleich(e.p, neg(soll))) return { ok: false, text: "Genau das Gegenteil: Alle Vorzeichen sind vertauscht." };
    // Sind beide Polynome bis auf ein Glied gleich, wird dieses Glied genannt.
    const d = minus(e.p, soll);
    const dg = glieder(d);
    if (dg.length === 1 && e.p.size === soll.size) {
      const s = schluessel(dg[0].v);
      const mSoll = soll.get(s), mEin = e.p.get(s);
      if (mSoll && mEin && mSoll.k.z === -mEin.k.z && mSoll.k.n === mEin.k.n) {
        return { ok: false, text: `Fast: Beim Glied ${monom(mSoll)} stimmt das Vorzeichen nicht.` };
      }
      if (mSoll && mEin) return { ok: false, text: `Fast: Das Glied mit ${monom({ v: mSoll.v, k: Q(1) }).replace(/^1$/, "der Zahl")} stimmt nicht — es heißt ${monom(mSoll)}.` };
    }
    if (dg.length === 1 && e.p.size === soll.size - 1) return { ok: false, text: `Fast: Es fehlt ein Glied, nämlich ${monom(soll.get(schluessel(dg[0].v)))}.` };
    const pr = probe(e.p, soll, variablen);
    if (pr) {
      const belegung = variablen.map((n) => `${n} = ${zahlText(pr.bel[n])}`).join(", ");
      return { ok: false, text: `Dein Term ist nicht gleichwertig. Probe mit ${belegung}: Deiner ergibt ${zahlText(pr.wa)}, richtig wäre ${zahlText(pr.wb)}.` };
    }
    return { ok: false, text: "Dein Term ist nicht gleichwertig." };
  }
  // Gleichwertig — stimmt auch die Form?
  const st = e.struktur;
  if (form === "normal" && !st.normal) {
    if (formHinweis) return { ok: false, text: formHinweis };
    if (st.doppelt.length) return { ok: false, text: "Gleichwertig — aber noch nicht fertig: Es stehen noch gleichartige Glieder da, die sich zusammenfassen lassen." };
    return { ok: false, text: "Gleichwertig — aber noch nicht fertig: Löse alle Klammern auf, multipliziere die Zahlen aus und fasse gleichartige Glieder zusammen." };
  }
  if (form === "produkt" || form === "ausgeklammert") {
    if (!st.produkt) return { ok: false, text: formHinweis || "Gleichwertig — aber gefragt ist eine Produktform mit Klammer, keine Summe." };
    if (form === "ausgeklammert") {
      for (const k of st.produkt.klammern) {
        const gf = gemeinsamerFaktor(k);
        if (gf) {
          const rest = monom({ v: gf.v, k: Q(gf.t) });
          return { ok: false, text: `Gleichwertig — aber noch nicht vollständig ausgeklammert: In der Klammer steckt noch der gemeinsame Faktor ${rest}.` };
        }
      }
    }
  }
  return { ok: true, text: "" };
}

// ---------- Aufgaben ----------

export const EINGABE_HINWEIS = `<span class="progress-note tm-eingabe-hinweis">Schreibweise: Hochzahlen als x^2 oder x², den Malpunkt darfst du weglassen (3xy, 2(x + 1)), Komma als Dezimalzeichen.</span>`;

// Eine Aufgabe mit einem Term als Antwort, fertig für mountUebungsaufgaben().
export function termAufgabe({ promptHtml, soll, variablen = ["x"], form = "beliebig", falsch = [], formHinweis = null, tipps = [], musterloesungHtml, platzhalter = "Term" }) {
  return {
    promptHtml: promptHtml + EINGABE_HINWEIS,
    placeholder: platzhalter,
    check: (roh) => pruefe(roh, { soll, variablen, form, falsch, formHinweis }).ok,
    hinweis: (roh) => pruefe(roh, { soll, variablen, form, falsch, formHinweis }).text,
    tipps,
    musterloesungHtml,
  };
}
// Dasselbe als Feld einer Aufgabe mit mehreren Feldern.
export function termFeld({ name, soll, variablen = ["x"], form = "beliebig", falsch = [], formHinweis = null, platzhalter = "Term", einheit = "" }) {
  return {
    name, einheit, platzhalter,
    check: (roh) => pruefe(roh, { soll, variablen, form, falsch, formHinweis }).ok,
    hinweis: (roh) => pruefe(roh, { soll, variablen, form, falsch, formHinweis }).text,
  };
}

// Kurzschreibweise für Sollterme in den Seiten: P("3x^2 - 2x + 5", ["x"]).
export function P(text, variablen = ["x", "y", "a", "b"]) {
  return lies(text, variablen).p;
}

export function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
