// Die vierundzwanzig Übungsaufgaben zu „Untersuchung weiterer Funktionen“ (Thema 3.2) — sechs je Stufe.
// Was nach dem rheinland-pfälzischen Lehrplan nur zum Leistungsfach gehört (sin und cos, Ketten- und
// Quotientenregel, die Funktion ln), trägt im Titel „(LK)“; die übrigen Aufgaben brauchen nur
// p(x) · e^(kx), die Produktregel und den natürlichen Logarithmus zum Lösen von e^(kx) = c.
//
//   einfach   — f″(0) bei (ax + b) · e^(kx), Asymptote und y-Achsenabschnitt, Tiefpunkt von
//               x · (ln x − c) (LK), beschränktes Wachstum, Wendepunkt der Glockenkurve (LK).
//   mittel    — Wendepunkt, Krümmungsintervall von a · x² · e^(kx), Extrempunkte mit Sinus und
//               Kosinus (LK), Scharparameter aus dem Hochpunkt, logistisches Wachstum (LK).
//   schwierig — Hoch- und Tiefpunkt von (x² + px + q) · e^(±x), größtes Rechteck unter einer
//               e-Funktion, Hochpunkt von ln(ax)/x (LK), gedämpfte Schwingung (LK), Ortskurve der
//               Wendepunkte.
//   komplex   — Funktion aus dem Extrempunkt bestimmen, Rechteck unter dem Kosinus mit dem
//               Newton-Verfahren (LK), Wirkstoffkonzentration, x · (ln x − a)² vollständig (LK),
//               Wendetangente.
//
// Die sechste Aufgabe jeder Stufe verlangt f′ und f″ einer jedes Mal neu gewürfelten Funktion
// (mathematik/terme.js): e-Funktionen, Produkte mit e, Sinus und Kosinus (LK), Verkettungen und
// Funktionenscharen (LK).
//
// Gewürfelt wird konstruktiv: Die Kandidatenlisten werden vorher gesiebt, ohneKollision() wählt aus
// dem Rest. Jeder Fehlerwert ist von der Lösung und von den anderen Fehlerwerten verschieden — wo ein
// Fehler mit der Lösung zusammenfiele, steht NaN. Wo die Lösung eine e-Potenz, ein Logarithmus oder
// ein Newton-Schritt ist, wird auf vier Nachkommastellen gerundet eingegeben; sonst ist sie glatt.

"use strict";

import { pot, q, efunktion, lnGlied, trig, prod, verkettung, trigPotenz, ableitungsAufgabe, pick as zufall, mische } from "../../../terme.js?v=3";

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
// „=“ oder „≈“: Entscheidend ist, ob die Anzeige mit dieser Stellenzahl den Wert genau trifft.
function zeichen(x, stellen = 4) {
  const f = Math.pow(10, stellen);
  return Math.abs(x * f - Math.round(x * f)) < 1e-7 ? "=" : "≈";
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
// Eine Summe aus [Koeffizient, Rest]-Paaren; Nullen fallen weg, das erste Glied ohne „+“.
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
  const sauber = kandidaten.filter((k) => gruppen(k).every((g, i) => paarweiseVerschieden(g, Array.isArray(eps) ? eps[i] : eps)));
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
// cos(π/2) ist in Gleitkomma 6 · 10⁻¹⁷, nicht 0 — gerechnet wird mit dem bereinigten Wert.
function sauber(x) {
  const g = Math.round(x * 1e9) / 1e9;
  return g === 0 ? 0 : g;
}
// Große Kandidatenlisten erst beim ersten Würfeln bauen, nicht beim Laden der Seite.
function spaeter(bauen) {
  let liste = null;
  return () => (liste ??= bauen());
}
function bruch(z, n) {
  return `<span class="bruch"><span class="z">${z}</span><span class="n">${n}</span></span>`;
}
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
// a · e^(kx) als Faktor hinter „·“: mit Klammer, wenn es ein Minus trägt.
function aeK(a, k, v = "x") {
  return a < 0 ? `(${ae(a, k, v)})` : ae(a, k, v);
}
// Ein Faktor (x + b) mit richtigem Vorzeichen; für b = 0 steht nur x da.
function linear(a, b) {
  return poly([[a, "x"], [b, ""]]);
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
const GERUNDET = `<br><span class="progress-note">Gib das Ergebnis auf vier Nachkommastellen gerundet ein (Komma als Dezimalzeichen).</span>`;
const TOL = 0.0001;
const EPS = 0.001;

// p(x) · e^(kx) als Text: ein einzelnes Glied ohne Klammer („2x · e^(−x)“), sonst mit („(x − 2) · e^x“).
function pe(P, k, v = "x") {
  return `${/ [+−] /.test(P) ? `(${P})` : P} · ${eh(kx(k, v))}`;
}
// Ein Faktor ohne „1 · “: mal(1) = „“, mal(2) = „2 · “.
function mal(b) {
  return b === 1 ? "" : `${num(b)} · `;
}
// Ein Vorfaktor vor einem Produkt: „“, „−“ oder „2 · “.
function vor(a) {
  return a === 1 ? "" : a === -1 ? "−" : `${num(a)} · `;
}
// ln(x) mit einem Summanden — ohne „+ 0“: lnPlus(0) = „ln(x)“, lnPlus(−1) = „ln(x) − 1“.
function lnPlus(z) {
  return Math.abs(z) < 1e-12 ? "ln(x)" : `ln(x) ${plusMinus(z)}`;
}
// Ein eingesetzter linearer Term „a · x + b“ ohne „+ 0“.
function summe(a, x, b) {
  return `${num(a)} · ${numK(x)}${Math.abs(b) < 1e-12 ? "" : " " + plusMinus(b)}`;
}
const PI_HINWEIS = `<br><span class="progress-note">Gib x als Vielfaches von π an: Für x = 2π/3 tippst du 2/3.</span>`;

// ================= einfach =================

// ---------- E1: f″(0) bei (ax + b) · e^(kx) ----------
// f″(x) = (p″ + 2k · p′ + k² · p) · e^(kx) = (k²a · x + 2ka + k²b) · e^(kx), also f″(0) = 2ka + k²b.
// Fehlerbilder: f′(0) = a + kb (nur einmal abgeleitet), ka + k²b (beim zweiten Ableiten k · p nicht
// mit abgeleitet — k · p′ steht dann nur einmal da), 2a + b (der Faktor k aus (e^(kx))′ fehlt).
// k = 1 kommt nicht vor: Dort fielen 2a + b und f″(0) immer zusammen.
const E1_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const a of [1, 2, 3, -1, -2]) for (const b of [0, 1, 2, -1, -3, 4]) for (const k of [2, 3, -1, -2, 0.5, -0.5]) {
    out.push({ a, b, k, soll: 2 * k * a + k * k * b, f1: a + k * b, halb: k * a + k * k * b, ohneK: 2 * a + b });
  }
  return out;
});
function generateE1() {
  const v = ohneKollision(E1_KANDIDATEN(), (w) => [w.soll, w.f1, w.halb, w.ohneK], EPS);
  const { a, b, k, soll } = v;
  const P = linear(a, b), e = eh(kx(k));
  const k1 = linear(k * a, a + k * b), k2 = linear(k * k * a, 2 * k * a + k * k * b);
  return {
    promptHtml: `Gegeben ist f(x) = ${pe(P, k)}.<br><strong>Berechne f″(0).</strong>` + ZAHL,
    correct: soll,
    tolerance: TOL,
    placeholder: "f″(0)",
    hinweis: (roh, val) => {
      if (nahe(val, v.f1, TOL)) return `Das ist f′(0). f′(x) = (${k1}) · ${e} ist wieder ein Produkt — leite es noch einmal mit der Produktregel ab.`;
      if (nahe(val, v.halb, TOL)) return `Beim zweiten Ableiten muss auch der Summand ${num(k)} · p(x) in der Klammer abgeleitet werden. Deshalb steht in f″ = (p″ + 2k · p′ + k² · p) · ${e} der Teil k · p′ zweimal.`;
      if (nahe(val, v.ohneK, TOL)) return `Der Faktor k fehlt: (${e})′ = ${ae(k, k)}, nicht ${e}.`;
      return `Bilde f′(x) = (${k1}) · ${e}, dann f″(x) = (${k2}) · ${e}, und setze 0 ein (e⁰ = 1).`;
    },
    tipps: [`Produktregel mit u = ${P} und v = ${e}, v′ = ${ae(k, k)}; dann ${e} ausklammern.`, `f′ ist wieder „Polynom mal ${e}“ — dieselbe Regel noch einmal. Zur Probe: f″ = (p″ + 2k · p′ + k² · p) · ${e}.`],
    musterloesungHtml: `f′(x) = ${num(a)} · ${e} + (${P}) · ${aeK(k, k)} = (${k1}) · ${e}<br>` +
      `f″(x) = ${num(k * a)} · ${e} + (${k1}) · ${aeK(k, k)} = (${k2}) · ${e}<br>` +
      `<strong>Probe</strong> mit p″ + 2k · p′ + k² · p = 0 + 2 · ${numK(k)} · ${numK(a)} + ${numK(k)}² · (${P}) = ${k2} ✓<br>` +
      `f″(0) = ${num(2 * k * a + k * k * b)} · e⁰ = <strong>${num(soll)}</strong>`,
  };
}

// ---------- E2: Asymptote und y-Achsenabschnitt ----------
// f(x) = (ax + b) · e^(kx) + d: Auf der Seite, auf der kx → −∞ geht, setzt sich e^(kx) → 0 gegen den
// Polynomfaktor durch — Asymptote y = d. f(0) = b + d. Fehlerbilder: y = 0 (den Summanden d
// übersehen), f(0) als Grenzwert; bei f(0): d vergessen (b), e⁰ = 0 (d).
const E2_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const a of [1, 2, -1, 3, -2]) for (const b of [1, 2, 3, -1, -2, 4]) for (const k of [-1, -2, -0.5, 1, 2, 0.5]) for (const d of [1, 2, 3, -1, -2, 5]) {
    out.push({ a, b, k, d, y0: b + d });
  }
  return out;
});
function generateE2() {
  const v = ohneFeldKollision(E2_KANDIDATEN(), (w) => [[w.d, 0, w.y0], [w.y0, w.b, w.d]], EPS);
  const { a, b, k, d, y0 } = v;
  const P = linear(a, b), e = eh(kx(k)), seite = k < 0 ? "+∞" : "−∞";
  return {
    promptHtml: `Gegeben ist f(x) = ${pe(P, k)} ${plusMinus(d)}.<br><strong>Gib die waagerechte Asymptote y = c für x → ${seite} und den Schnittpunkt S<sub>y</sub>(0 | y₀) mit der y-Achse an.</strong>` + ZAHL,
    felder: [
      { name: "c =", soll: d, toleranz: TOL, hinweis: (roh, z) => (nahe(z, 0, TOL) ? `Ohne den Summanden ${num(d)} wäre y = 0 die Asymptote. Der Summand verschiebt den ganzen Graphen — die Asymptote mit.` : nahe(z, y0, TOL) ? "Das ist f(0). Gefragt ist der Grenzwert für x → " + seite + "." : `Für x → ${seite} geht ${e} → 0 und setzt sich gegen ${P} durch.`) },
      { name: "y₀ =", soll: y0, toleranz: TOL, hinweis: (roh, z) => (nahe(z, b, TOL) ? `Der Summand ${num(d)} gehört zu f(0) dazu.` : nahe(z, d, TOL) ? "e⁰ = 1, nicht 0 — der erste Summand ist bei x = 0 gleich b." : "Setze x = 0 ein; e⁰ = 1.") },
    ],
    tipps: [`Für x → ${seite} ist ${kx(k)} → −∞, also ${e} → 0 — und die e-Funktion setzt sich gegen jede Potenz durch.`, "Für den Schnittpunkt mit der y-Achse setzt du x = 0 ein."],
    musterloesungHtml: `Für x → ${seite} geht ${e} → 0 und setzt sich gegen den Faktor ${P} durch (Thema 2.2): (${P}) · ${e} → 0, also f(x) → ${num(d)}. <strong>Asymptote y = ${num(d)}</strong>.<br>` +
      `f(0) = ${num(b)} · e⁰ ${plusMinus(d)} = ${num(b)} ${plusMinus(d)} = <strong>${num(y0)}</strong>: S<sub>y</sub>(0 | ${num(y0)}).`,
  };
}

// ---------- E3: Tiefpunkt von a · x · (ln(x) − c) (LK) ----------
// f′(x) = a · (ln(x) − c + 1) = 0 ⟺ x = e^(c − 1); f″(x) = a/x > 0. y = −a · e^(c − 1).
// Fehlerbilder: e^c (der Summand x · 1/x der Produktregel fehlt), e^(c + 1) (Vorzeichen); bei y der
// Faktor a (bei a = 1 keiner — NaN) und das Vorzeichen.
const E3_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const a of [1, 2, 3, 0.5, 4]) for (const c of [-1, -0.5, 0, 0.5, 1, 1.5, 2, 3]) {
    out.push({ a, c, x: Math.exp(c - 1), y: -a * Math.exp(c - 1) });
  }
  return out;
});
function generateE3() {
  const v = ohneFeldKollision(E3_KANDIDATEN(), (w) => [[w.x, Math.exp(w.c), Math.exp(w.c + 1)], [w.y, w.a === 1 ? NaN : -Math.exp(w.c - 1), -w.y]], EPS);
  const { a, c, x, y } = v;
  const lnT = c === 0 ? "ln(x)" : `(ln(x) ${plusMinus(-c)})`;
  const ex = c - 1 === 0 ? "e⁰" : eh(num(c - 1));
  return {
    promptHtml: `Gegeben ist f(x) = ${vor(a)}x · ${lnT} für x &gt; 0.<br><strong>Bestimme die Koordinaten des Tiefpunkts.</strong>` + GERUNDET,
    felder: [
      { name: "x<sub>T</sub> =", soll: x, toleranz: TOL, hinweis: (roh, z) => (nahe(z, Math.exp(c), TOL) ? "Die Produktregel liefert zwei Summanden: Der zweite, x · (1/x) = 1, fehlt." : nahe(z, Math.exp(c + 1), TOL) ? `Vorzeichenfehler beim Auflösen: ${lnPlus(1 - c)} = 0 ⟺ ln(x) = ${num(c - 1)}.` : "Setze f′(x) = 0 und löse mit e auf.") },
      { name: "y<sub>T</sub> =", soll: y, toleranz: TOL, hinweis: (roh, z) => (a !== 1 && nahe(z, -Math.exp(c - 1), TOL) ? `Der Faktor ${num(a)} fehlt.` : nahe(z, -y, TOL) ? `Vorzeichen: An der Tiefstelle ist ${lnPlus(-c)} = −1.` : "y = f(x<sub>T</sub>).") },
    ],
    tipps: [`Produktregel: (x · ${lnT})′ = 1 · ${lnT} + x · ${bruch("1", "x")}.`, "ln(x) = c ⟺ x = e<sup>c</sup>"],
    musterloesungHtml: `f′(x) = ${a === 1 ? "" : `${num(a)} · `}(1 · ${lnT} + x · ${bruch("1", "x")}) = ${a === 1 ? "" : `${num(a)} · `}(${lnPlus(1 - c)})<br>` +
      `f′(x) = 0 ⟺ ln(x) = ${num(c - 1)} ⟺ <strong>x = ${ex}</strong> ${zeichen(x)} <strong>${num(x)}</strong>; f″(x) = ${bruch(num(a), "x")} &gt; 0: Tiefpunkt.<br>` +
      `<strong>y</strong> = ${vor(a)}${ex} · (−1) = −${a === 1 ? "" : num(a) + " · "}${ex} ${zeichen(y)} <strong>${num(y)}</strong>, denn an der Tiefstelle ist ${lnPlus(-c)} = −1.`,
  };
}

// ---------- E4: Beschränktes Wachstum ----------
// h(t) = S − c · e^(−kt): Grenze S, h(0) = S − c, h′(0) = c · k.
const E4_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const S of [20, 30, 40, 50, 60, 80, 100, 120]) for (const c of [15, 18, 25, 36, 45, 54, 70, 90]) for (const k of [0.1, 0.2, 0.25, 0.3, 0.4, 0.5]) {
    if (c < S) out.push({ S, c, k, h0: S - c, r: c * k });
  }
  return out;
});
function generateE4() {
  const v = ohneFeldKollision(E4_KANDIDATEN(), (w) => [[w.S, w.c, w.h0], [w.h0, w.S, -w.c], [w.r, -w.r, w.c]], EPS);
  const { S, c, k, h0, r } = v;
  const e = eh(kx(-k, "t"));
  return {
    promptHtml: `Eine Pflanze wächst nach h(t) = ${num(S)} − ${num(c)} · ${e} (h in cm, t in Wochen).<br><strong>Gib die Sättigungsgrenze S, die Anfangshöhe h(0) und die Wachstumsrate h′(0) zu Beginn an.</strong>` + ZAHL,
    felder: [
      { name: "S =", soll: S, toleranz: TOL, hinweis: (roh, z) => (nahe(z, c, TOL) ? `${num(c)} ist der Abstand zur Grenze am Anfang, nicht die Grenze.` : nahe(z, h0, TOL) ? `Das ist die Höhe zu Beginn. Die Grenze ist der Wert für t → ∞, wenn ${e} → 0 geht.` : `Für t → ∞ geht ${e} → 0.`) },
      { name: "h(0) =", soll: h0, toleranz: TOL, hinweis: (roh, z) => (nahe(z, S, TOL) ? "e⁰ = 1, nicht 0." : nahe(z, -c, TOL) ? `Der Summand ${num(S)} gehört dazu.` : "Setze t = 0 ein.") },
      { name: "h′(0) =", soll: r, toleranz: TOL, hinweis: (roh, z) => (nahe(z, -r, TOL) ? `Zwei Minuszeichen: −${num(c)} · (−${num(k)}) = +${num(r)}.` : nahe(z, c, TOL) ? `Der Faktor ${num(-k)} aus (${e})′ fehlt.` : `h′(t) = ${num(c)} · ${num(k)} · ${e}.`) },
    ],
    tipps: [`(${e})′ = ${num(-k)} · ${e}`, "Die Sättigungsgrenze ist der Grenzwert von h(t) für t → ∞."],
    musterloesungHtml: `Für t → ∞ geht ${e} → 0, also h(t) → <strong>S = ${num(S)}</strong> cm.<br>` +
      `h(0) = ${num(S)} − ${num(c)} · e⁰ = <strong>${num(h0)}</strong> cm.<br>` +
      `h′(t) = −${num(c)} · (−${num(k)}) · ${e} = ${num(r)} · ${e}, also <strong>h′(0) = ${num(r)}</strong> cm pro Woche — die größte Rate, denn h′ nimmt danach ab.`,
  };
}

// ---------- E5: Wendepunkt der Glockenkurve (LK) ----------
// f(x) = a · e^(−x²/c) mit c = 2σ²: Wendestellen ±σ, Höhe a · e^(−0,5). Fehlerbilder: c selbst, σ²
// (bei σ = 1 keiner — NaN), √c = σ√2; bei y die Höhe a des Hochpunkts und a · e^(−1).
const E5_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const s of [1, 2, 3, 4, 5]) for (const a of [1, 2, 3, 4, 5, 10]) out.push({ s, a, c: 2 * s * s, y: a * Math.exp(-0.5) });
  return out;
});
function generateE5() {
  const v = ohneFeldKollision(E5_KANDIDATEN(), (w) => [[w.s, w.c, w.s === 1 ? NaN : w.s * w.s, Math.sqrt(w.c)], [w.y, w.a, w.a * Math.exp(-1)]], EPS);
  const { s, a, c, y } = v;
  const e = eh(`−x²/${num(c)}`);
  return {
    promptHtml: `Gegeben ist f(x) = ${vor(a)}${e}.<br><strong>Bestimme den Wendepunkt mit positiver x-Koordinate.</strong>` + GERUNDET,
    felder: [
      { name: "x<sub>W</sub> =", soll: s, toleranz: TOL, hinweis: (roh, z) => (nahe(z, c, TOL) ? `${num(c)} ist 2σ². Die Wendestellen sind ±σ.` : nahe(z, s * s, TOL) ? `Das ist σ² = x² — ziehe noch die Wurzel.` : nahe(z, Math.sqrt(c), TOL) ? `√${num(c)} = σ · √2: Aus f″(x) = 0 folgt x² = ${bruch(num(c), "2")}, nicht x² = ${num(c)}.` : "Bilde f″ mit Ketten- und Produktregel und setze die Klammer null.") },
      { name: "y<sub>W</sub> =", soll: y, toleranz: TOL, hinweis: (roh, z) => (nahe(z, a, TOL) ? "Das ist die Höhe des Hochpunkts bei x = 0." : nahe(z, a * Math.exp(-1), TOL) ? `f(σ) = ${vor(a)}e<sup>−σ²/(2σ²)</sup> = ${vor(a)}e<sup>−0,5</sup>.` : "Setze die Wendestelle in f ein.") },
    ],
    tipps: [`Kettenregel: f′(x) = ${num(a)} · (−${bruch("2x", num(c))}) · ${e}`, `Produktregel für f″: f″(x) = ${num(a)} · (${bruch("4x²", num(c * c))} − ${bruch("2", num(c))}) · ${e}`],
    musterloesungHtml: `f′(x) = ${num(a)} · (−${bruch("2x", num(c))}) · ${e}<br>` +
      `f″(x) = ${num(a)} · (−${bruch("2", num(c))} + ${bruch("4x²", num(c * c))}) · ${e} = 0 ⟺ x² = ${bruch(num(c), "2")} = ${num(s * s)} ⟺ x = ±${num(s)}; die Klammer wechselt dort das Vorzeichen.<br>` +
      `<strong>W(${num(s)} | ${vor(a)}e<sup>−0,5</sup>)</strong> ≈ W(<strong>${num(s)}</strong> | <strong>${num(y)}</strong>) — die Höhe hängt nicht von σ ab.`,
  };
}

// ================= Ableitungsfunktionen (Termeingabe, je Stufe eine) =================
// Die Funktionen setzen sich aus Gliedern zusammen, die ihre Ableitung exakt kennen
// (mathematik/terme.js); gefragt sind f′ und f″. Gewürfelt wird konstruktiv aus festen Listen.
const bereich = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const KOEFF = [-6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6];
const KLEIN = [-3, -2, -1, 1, 2, 3];
const K_EXP = [1, 2, 3, -1, -2, q(1, 2), q(-1, 2)];

// einfach: a · e^(kx) neben Potenzen — f″ verlangt die Regel (e^(kx))′ = k · e^(kx) zweimal.
function generateE6() {
  const gl = [efunktion([pot(zufall([1, 2, 3, 4, -1, -2, q(1, 2)]), 0)], { m: zufall(K_EXP) }), pot(zufall(KOEFF), zufall([2, 3]))];
  if (zufall([true, false])) gl.push(pot(zufall(KOEFF), 1));
  return ableitungsAufgabe(mische(gl), { zweite: true });
}
// mittel: Polynom mal e-Funktion — zweimal Produktregel und Ausklammern.
function generateM6() {
  const grad = zufall([1, 2, 2]);
  const P = [pot(zufall(KLEIN), grad), ...(zufall([true, true, false]) ? [pot(zufall(KOEFF), zufall(bereich(0, grad - 1)))] : [])];
  return ableitungsAufgabe([efunktion(P, { m: zufall([1, -1, 2, -2, q(1, 2), q(-1, 2)]) })], { zweite: true });
}
// schwierig (LK): Sinus und Kosinus mit innerer Funktion oder ein Produkt x · sin(x).
function generateS6() {
  const welle = zufall([
    trig(zufall(KLEIN), zufall(["sin", "cos"]), zufall([1, 2, 3, q(1, 2)])),
    prod(zufall([1, -1, 2]), 1, trig(1, zufall(["sin", "cos"]), 1)),
  ]);
  return ableitungsAufgabe(mische([welle, pot(zufall(KOEFF), zufall([2, 3]))]), { zweite: true });
}
// komplex (LK): Funktionenschar — der Parameter a ist beim Ableiten eine feste Zahl, auch in (x − a)² —
// oder eine Verkettung: (x² − 1)², √(x² + 1), sin²(x), sin(x) · cos(x), e^(−x) · sin(2x), x · ln(x).
function generateK6() {
  if (zufall([true, false])) {
    const schar = { zweite: true, name: "fₐ", parameter: ["a"], zusatz: " (a &gt; 0)" };
    const rest = [pot(zufall(KLEIN), 1, 2), pot(zufall([1, 2, -1]), 0, 3), trig(zufall([1, -1, 2]), zufall(["sin", "cos"]), 1, 0, 1), pot(zufall([1, -1]), 4, 1)];
    if (zufall([true, false])) return ableitungsAufgabe(mische([pot(zufall([1, -1, 2]), 3), pot(zufall(KLEIN), 2, 1), ...rest]).slice(0, 3), schar);
    // (x − a)³ enthält x³ und ax² — neben −x³ und 3ax² bliebe davon nur 3a²x − a³ übrig, mit f″ = 0.
    // Deshalb steht eine verkettete Schar nur neben Gliedern, die sie nicht aufheben können.
    const kette = zufall([verkettung(1, 1, 1, zufall([-1, 1, -2]), zufall([2, 3]), { t: 1 }), verkettung(zufall([1, -1]), 1, 2, zufall([-1, 1]), 2, { t: 1 })]);
    return ableitungsAufgabe(mische([kette, ...mische(rest).slice(0, 2)]), schar);
  }
  const g = zufall([
    verkettung(zufall([1, 2, -1]), 1, 2, zufall([1, -1, 2, -2, 3]), zufall([2, 3])),
    verkettung(zufall([1, 2, 4]), 1, 2, zufall([1, 2, 4]), q(1, 2)),
    trigPotenz(zufall(KLEIN), 2, 0, zufall([1, 2])),
    trigPotenz(zufall(KLEIN), 0, 2, zufall([1, 2])),
    trigPotenz(zufall([1, 2, -1]), 1, 1, 1),
    efunktion([], { m: zufall([-1, -2, q(-1, 2)]) }, { [zufall(["S", "C"])]: [pot(zufall([1, 2, 3, -1, -2]), 0)], b: zufall([1, 2, 3]) }),
    lnGlied(zufall([1, 2, 3, -1, -2]), { p: zufall([1, 2]), m: zufall([1, 2, 3]) }),
  ]);
  return ableitungsAufgabe(zufall([true, false]) ? mische([g, pot(zufall(KOEFF), zufall([1, 2, 3]))]) : [g], { zweite: true });
}

// ================= mittel =================

// ---------- M1: Wendepunkt von (αx + β) · e^(kx) ----------
// f″(x) = (k²α · x + 2kα + k²β) · e^(kx) = 0 ⟺ x_W = −β/α − 2/k; y_W = −(2α/k) · e^(k · x_W).
// Fehlerbilder: die Extremstelle −β/α − 1/k, das Vorzeichen −β/α + 2/k; bei y der Faktor e^(k x_W).
const M1_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const al of [1, 2, -1, 3, -2]) for (const be of [0, 1, 2, -1, -3, 3, 4]) for (const k of [1, -1, 2, -2, 0.5, -0.5]) {
    const x = -be / al - 2 / k;
    if (!glatt(x, 4) || !glatt(-be / al - 1 / k, 4)) continue;
    out.push({ al, be, k, x, y: (-2 * al / k) * Math.exp(k * x) });
  }
  return out;
});
function generateM1() {
  const v = ohneFeldKollision(M1_KANDIDATEN(), (w) => [[w.x, -w.be / w.al - 1 / w.k, -w.be / w.al + 2 / w.k], [w.y, -2 * w.al / w.k]], EPS);
  const { al, be, k, x, y } = v;
  const P = linear(al, be), e = eh(kx(k));
  const k1 = linear(k * al, al + k * be), k2 = linear(k * k * al, 2 * k * al + k * k * be);
  return {
    promptHtml: `Gegeben ist f(x) = ${pe(P, k)}.<br><strong>Bestimme den Wendepunkt des Graphen.</strong>` + GERUNDET,
    felder: [
      { name: "x<sub>W</sub> =", soll: x, toleranz: TOL, hinweis: (roh, z) => (nahe(z, -be / al - 1 / k, TOL) ? "Das ist die Extremstelle — dort ist die Klammer von f′ null. Für den Wendepunkt brauchst du f″." : nahe(z, -be / al + 2 / k, TOL) ? "Vorzeichenfehler beim Auflösen der Klammer von f″." : `f″(x) = (${k2}) · ${e}; setze die Klammer null.`) },
      { name: "y<sub>W</sub> =", soll: y, toleranz: TOL, hinweis: (roh, z) => (nahe(z, -2 * al / k, TOL) ? `Das ist nur der Wert von ${P} — der Faktor ${e} gehört zum Funktionswert dazu.` : "y<sub>W</sub> = f(x<sub>W</sub>).") },
    ],
    tipps: [`f′(x) = (${k1}) · ${e}`, `f″(x) = (${k2}) · ${e} — die Klammer ist linear und wechselt an ihrer Nullstelle das Vorzeichen.`],
    musterloesungHtml: `f′(x) = ${num(al)} · ${e} + (${P}) · ${aeK(k, k)} = (${k1}) · ${e}<br>` +
      `f″(x) = ${num(k * al)} · ${e} + (${k1}) · ${aeK(k, k)} = (${k2}) · ${e}<br>` +
      `f″(x) = 0 ⟺ ${k2} = 0 ⟺ <strong>x = ${num(x)}</strong>; die Klammer wechselt dort das Vorzeichen, ${e} &gt; 0 nicht — ein Wendepunkt.<br>` +
      `<strong>y</strong> = (${summe(al, x, be)}) · ${eh(num(k * x))} = ${num(al * x + be)} · ${eh(num(k * x))} ${zeichen(y)} <strong>${num(y)}</strong>`,
  };
}

// ---------- M2: Krümmungsintervall von a · x² · e^(kx) ----------
// f″(x) = a · (k²x² + 4kx + 2) · e^(kx); Nullstellen (−2 ± √2)/k. Zwischen ihnen hat die Klammer das
// Vorzeichen −1, f″ also das von −a: Rechtskurve bei a > 0, Linkskurve bei a < 0.
// Fehlerbild: die Extremstellen 0 und −2/k (Nullstellen von f′) als Grenzen.
const M2_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const a of [1, 2, 3, -1, -2, 0.5]) for (const k of [1, -1, 2, -2, 0.5, -0.5, 4]) {
    const w = [(-2 - Math.SQRT2) / k, (-2 + Math.SQRT2) / k].sort((p, qq) => p - qq), ex = [0, -2 / k].sort((p, qq) => p - qq);
    out.push({ a, k, w1: w[0], w2: w[1], e1: ex[0], e2: ex[1] });
  }
  return out;
});
function generateM2() {
  const v = ohneFeldKollision(M2_KANDIDATEN(), (w) => [[w.w1, w.w2, w.e1], [w.w2, w.w1, w.e2]], EPS);
  const { a, k, w1, w2 } = v;
  const art = a > 0 ? "Rechtskurve" : "Linkskurve", e = eh(kx(k));
  const klammer = poly([[k * k, "x²"], [4 * k, "x"], [2, ""]]);
  const hin = (andere, ex) => (roh, z) => (nahe(z, andere, TOL) ? "Die Grenzen sind vertauscht — x₁ ist die kleinere." :
    nahe(z, ex, TOL) ? "Das ist eine Extremstelle (Nullstelle von f′). Die Grenzen der Krümmungsintervalle sind die Nullstellen von f″." :
    `f″(x) = ${num(a)} · (${klammer}) · ${e}; setze die Klammer null.`);
  return {
    promptHtml: `Gegeben ist f(x) = ${faktor(a)}x² · ${e}.<br><strong>Auf welchem Intervall ]x₁; x₂[ ist der Graph von f eine ${art}?</strong>` + GERUNDET,
    felder: [
      { name: "x₁ =", soll: w1, toleranz: TOL, hinweis: hin(w2, v.e1) },
      { name: "x₂ =", soll: w2, toleranz: TOL, hinweis: hin(w1, v.e2) },
    ],
    tipps: [`f′(x) = ${num(a)} · (${poly([[k, "x²"], [2, "x"]])}) · ${e}`, `f″(x) = ${num(a)} · (${klammer}) · ${e}. Die Klammer ist eine nach oben geöffnete Parabel — zwischen ihren Nullstellen negativ.`],
    musterloesungHtml: `f′(x) = ${vor(a)}(2x · ${e} + x² · ${aeK(k, k)}) = ${vor(a)}(${poly([[k, "x²"], [2, "x"]])}) · ${e} — den Faktor ${num(a)} zieht man vor die Klammer.<br>` +
      `f″(x) = ${vor(a)}((${poly([[2 * k, "x"], [2, ""]])}) · ${e} + (${poly([[k, "x²"], [2, "x"]])}) · ${aeK(k, k)}) = ${vor(a)}(${klammer}) · ${e}<br>` +
      `${klammer} = 0${Math.abs(k) === 1 ? "" : ` ⟺ x² ${plusMinus(4 / k)}x ${plusMinus(2 / (k * k))} = 0`} ⟺ x = ${num(-2 / k)} ± √${num(2 / (k * k))}, also x₁ ≈ ${num(w1)} und x₂ ≈ ${num(w2)}.<br>` +
      `Zwischen den Nullstellen ist die Klammer negativ; mit dem Faktor ${num(a)} ist f″ dort ${a > 0 ? "negativ" : "positiv"}: <strong>${art} auf ]${num(w1)}; ${num(w2)}[</strong>.`,
  };
}

// ---------- M3: Extrempunkte einer Funktion mit Sinus oder Kosinus (LK) ----------
// Vier Grundformen x ± 2 sin x, x ± 2 cos x, jeweils mit Faktor s; Stellen als Vielfache von π.
const M3_FORMEN = [
  { fn: "sin", z: 1, h: 2 / 3, t: 4 / 3, hT: "2/3", tT: "4/3", f1: "1 + 2 cos(x)", f2: "−2 sin(x)", gl: "cos(x) = −0,5" },
  { fn: "sin", z: -1, h: 5 / 3, t: 1 / 3, hT: "5/3", tT: "1/3", f1: "1 − 2 cos(x)", f2: "2 sin(x)", gl: "cos(x) = 0,5" },
  { fn: "cos", z: 1, h: 1 / 6, t: 5 / 6, hT: "1/6", tT: "5/6", f1: "1 − 2 sin(x)", f2: "−2 cos(x)", gl: "sin(x) = 0,5" },
  { fn: "cos", z: -1, h: 7 / 6, t: 11 / 6, hT: "7/6", tT: "11/6", f1: "1 + 2 sin(x)", f2: "2 cos(x)", gl: "sin(x) = −0,5" },
];
const M3_KANDIDATEN = spaeter(() => {
  const out = [];
  M3_FORMEN.forEach((form, i) => { for (const s of [1, 2, 0.5, -1, -2, 3]) out.push({ i, s }); });
  return out;
});
function m3Werte(v) {
  const form = M3_FORMEN[v.i];
  // Ein negativer Faktor spiegelt den Graphen: Hoch- und Tiefstelle tauschen die Rollen.
  return v.s > 0 ? { form, h: form.h, t: form.t, hT: form.hT, tT: form.tT } : { form, h: form.t, t: form.h, hT: form.tT, tT: form.hT };
}
function generateM3() {
  const k = ohneFeldKollision(M3_KANDIDATEN(), (v) => { const w = m3Werte(v); return [[w.h, w.t, w.h * 180], [w.t, w.h, w.t * 180]]; }, EPS);
  const w = m3Werte(k);
  const c = 2 * k.s * w.form.z;
  const trigT = `${Math.abs(c) === 1 ? "" : num(Math.abs(c)) + " "}${w.form.fn}(x)`;
  const term = `${Math.abs(k.s) === 1 ? (k.s < 0 ? "−" : "") : num(k.s)}x ${c < 0 ? "−" : "+"} ${trigT}`;
  // f″ an beiden Stellen: s · (−2z sin x) bzw. s · (−2z cos x).
  const f2 = (x) => k.s * -2 * w.form.z * (w.form.fn === "sin" ? Math.sin(x) : Math.cos(x));
  const tausch = "Hoch- und Tiefstelle sind vertauscht — prüfe das Vorzeichen von f″ an beiden Stellen.";
  const grad = "Das ist der Winkel in Grad. Gesucht ist das Vielfache von π (Bogenmaß).";
  return {
    promptHtml: `Gegeben ist f(x) = ${term} auf dem Intervall [0; 2π].<br><strong>Bestimme die Stelle des Hochpunkts und die Stelle des Tiefpunkts.</strong>` + PI_HINWEIS,
    felder: [
      { name: "x<sub>H</sub> = π ·", soll: w.h, toleranz: TOL, hinweis: (roh, z) => (nahe(z, w.t, TOL) ? tausch : nahe(z, w.h * 180, 0.01) ? grad : "Löse f′(x) = 0 im Intervall [0; 2π] — es gibt zwei Lösungen — und prüfe mit f″.") },
      { name: "x<sub>T</sub> = π ·", soll: w.t, toleranz: TOL, hinweis: (roh, z) => (nahe(z, w.h, TOL) ? tausch : nahe(z, w.t * 180, 0.01) ? grad : "Löse f′(x) = 0 im Intervall [0; 2π] — es gibt zwei Lösungen — und prüfe mit f″.") },
    ],
    tipps: [`f′(x) = ${num(k.s)} · (${w.form.f1})`, `f′(x) = 0 ⟺ ${w.form.gl}. Der Taschenrechner liefert nur eine Lösung — die zweite folgt aus der Symmetrie.`],
    musterloesungHtml: `f′(x) = ${num(k.s)} · (${w.form.f1}) = 0 ⟺ ${w.form.gl} ⟺ x = ${w.form.hT}π oder x = ${w.form.tT}π (in [0; 2π])<br>` +
      `f″(x) = ${num(k.s)} · ${w.form.f2}: f″(${w.hT}π) ≈ ${num(f2(w.h * Math.PI))} &lt; 0 und f″(${w.tT}π) ≈ ${num(f2(w.t * Math.PI))} &gt; 0.<br>` +
      `<strong>Hochstelle ${w.hT}π</strong>, <strong>Tiefstelle ${w.tT}π</strong>`,
  };
}

// ---------- M4: Scharparameter aus dem Hochpunkt ----------
// f_k(x) = a · x · e^(−kx) hat den Hochpunkt H(1/k | a/(k · e)). Liegt er bei x₀, ist k = 1/x₀.
// Fehlerbilder: k = x₀ (Kehrwert vergessen), k = 2/x₀ (Wendestelle 2/k verwechselt); y ohne e^(−1).
const M4_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const x0 of [0.5, 2, 4, 5, 0.25, 1.25, 2.5, 10]) for (const a of [1, 2, 3, 4, 0.5, 5]) out.push({ x0, a, k: 1 / x0, y: a * x0 * Math.exp(-1) });
  return out;
});
function generateM4() {
  const v = ohneFeldKollision(M4_KANDIDATEN(), (w) => [[w.k, w.x0, 2 / w.x0], [w.y, w.a * w.x0]], EPS);
  const { x0, a, k, y } = v;
  return {
    promptHtml: `Für k &gt; 0 ist f<sub>k</sub>(x) = ${faktor(a)}x · ${eh("−kx")} gegeben.<br><strong>Für welchen Wert von k liegt der Hochpunkt bei x = ${num(x0)}? Gib k und die y-Koordinate dieses Hochpunkts an.</strong>` + GERUNDET,
    felder: [
      { name: "k =", soll: k, toleranz: TOL, hinweis: (roh, z) => (nahe(z, x0, TOL) ? `Die Hochstelle ist ${bruch("1", "k")} — k ist also der Kehrwert von ${num(x0)}.` : nahe(z, 2 / x0, TOL) ? `${bruch("2", "k")} ist die Wendestelle; der Hochpunkt liegt bei ${bruch("1", "k")}.` : "Bestimme die Hochstelle in Abhängigkeit von k und setze sie gleich " + num(x0) + ".") },
      { name: "y<sub>H</sub> =", soll: y, toleranz: TOL, hinweis: (roh, z) => (nahe(z, a * x0, TOL) ? "Der Faktor e<sup>−1</sup> fehlt: An der Hochstelle ist k · x = 1." : "y = f<sub>k</sub>(x₀) mit dem gefundenen k.") },
    ],
    tipps: [`f<sub>k</sub>′(x) = ${num(a)} · (1 − kx) · ${eh("−kx")}`, `Die Hochstelle ist x = ${bruch("1", "k")}.`],
    musterloesungHtml: `f<sub>k</sub>′(x) = ${num(a)} · ${eh("−kx")} + ${faktor(a)}x · (−k) · ${eh("−kx")} = ${num(a)} · (1 − kx) · ${eh("−kx")} = 0 ⟺ x = ${bruch("1", "k")}; davor ist f<sub>k</sub>′ positiv, danach negativ: Hochpunkt.<br>` +
      `${bruch("1", "k")} = ${num(x0)} ⟺ <strong>k = ${num(k)}</strong><br>` +
      `<strong>y</strong> = ${num(a)} · ${num(x0)} · e<sup>−1</sup> ${zeichen(y)} <strong>${num(y)}</strong>`,
  };
}

// ---------- M5: Logistisches Wachstum (LK) ----------
// f(t) = S / (1 + a · e^(−kt)): Wendestelle t_W = ln(a)/k, dort f = S/2 und f′ = S · k/4.
// Fehlerbilder: ln(a) · k, ln(a) (nicht durch k geteilt), −ln(a)/k; bei der Rate S/2 (der Bestand)
// und S · k (der Faktor 1/4 fehlt).
const M5_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const S of [50, 100, 200, 500, 800, 1000]) for (const a of [4, 9, 19, 24, 49, 99]) for (const k of [0.2, 0.25, 0.4, 0.5, 0.8, 2]) {
    out.push({ S, a, k, t: Math.log(a) / k, r: (S * k) / 4 });
  }
  return out;
});
function generateM5() {
  const v = ohneFeldKollision(M5_KANDIDATEN(), (w) => [[w.t, Math.log(w.a) * w.k, Math.log(w.a), -w.t], [w.r, w.S / 2, w.S * w.k]], EPS);
  const { S, a, k, t, r } = v;
  const e = eh(kx(-k, "t"));
  return {
    promptHtml: `Ein Bestand wächst logistisch nach f(t) = ${bruch(num(S), `1 + ${num(a)} · ${e}`)} (t in Tagen).<br><strong>Zu welchem Zeitpunkt t<sub>W</sub> wächst der Bestand am schnellsten, und wie groß ist die Wachstumsrate dann?</strong>` + GERUNDET,
    felder: [
      { name: "t<sub>W</sub> =", soll: t, toleranz: TOL, hinweis: (roh, z) => (nahe(z, Math.log(a) * k, TOL) ? `Beim Auflösen von −${num(k)}t = −ln(${num(a)}) wird durch ${num(k)} geteilt, nicht multipliziert.` : nahe(z, Math.log(a), TOL) ? `Das ist ${num(k)}t — teile noch durch ${num(k)}.` : nahe(z, -t, TOL) ? `Vorzeichen: ${e} = ${bruch("1", num(a))} ⟺ −${num(k)}t = −ln(${num(a)}).` : `Am Wendepunkt ist ${num(a)} · ${e} = 1.`) },
      { name: "f′(t<sub>W</sub>) =", soll: r, toleranz: TOL, hinweis: (roh, z) => (nahe(z, S / 2, TOL) ? `${num(S / 2)} ist der Bestand am Wendepunkt, nicht die Rate.` : nahe(z, S * k, TOL) ? "Mit u = 1 ist f′ = S · k · u/(1 + u)² = S · k/4 — der Nenner (1 + 1)² fehlt." : "f′(t) = S · k · u/(1 + u)² mit u = a · e<sup>−kt</sup>.") },
    ],
    tipps: [`Mit u(t) = ${num(a)} · ${e}: f′(t) = ${bruch(`${num(S * k)}u`, "(1 + u)²")} und f″(t) = ${bruch(`${num(S * k * k)}u · (u − 1)`, "(1 + u)³")}.`, "f″ wechselt das Vorzeichen, wo u = 1 ist."],
    musterloesungHtml: `Mit u(t) = ${num(a)} · ${e} und u′ = −${num(k)}u: f′(t) = ${bruch(`${num(S * k)}u`, "(1 + u)²")}, f″(t) = ${bruch(`${num(S * k * k)}u · (u − 1)`, "(1 + u)³")} (Ketten- und Quotientenregel).<br>` +
      `f″(t) = 0 ⟺ u = 1 ⟺ ${e} = ${bruch("1", num(a))} ⟺ <strong>t<sub>W</sub> = ${bruch(`ln(${num(a)})`, num(k))} ≈ ${num(t)}</strong>. Vorher ist u &gt; 1 und f″ &gt; 0, danach f″ &lt; 0: Die Rate ist dort am größten.<br>` +
      `f(t<sub>W</sub>) = ${bruch(num(S), "2")} = ${num(S / 2)}; <strong>f′(t<sub>W</sub>) = ${bruch(`${num(S * k)} · 1`, "(1 + 1)²")} = ${num(r)}</strong> pro Tag.`,
  };
}

// ================= schwierig =================

// ---------- S1: Hoch- und Tiefpunkt von (x² + px + q) · e^(±x) ----------
// Gewürfelt werden die Extremstellen r₁ < r₂; daraus p und q. Bei e^x ist f′ = (x − r₁)(x − r₂) · e^x:
// Hochpunkt bei r₁. Bei e^(−x) ist f′ = −(x − r₁)(x − r₂) · e^(−x): Tiefpunkt bei r₁.
// Fehlerbilder: vertauscht; die Nullstellen von f (wo sie glatt sind).
const S1_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const r1 of [-4, -3, -2, -1, 0, 1, 2]) for (const r2 of [-3, -2, -1, 0, 1, 2, 3]) for (const k of [1, -1]) {
    if (r2 <= r1) continue;
    const p = k === 1 ? -(r1 + r2) - 2 : 2 - r1 - r2, qq = k === 1 ? r1 * r2 - p : r1 * r2 + p;
    const D = p * p - 4 * qq;
    const nz = D >= 0 ? [(-p - Math.sqrt(D)) / 2, (-p + Math.sqrt(D)) / 2].map((z) => (glatt(z, 4) ? z : NaN)) : [NaN, NaN];
    out.push({ r1, r2, k, p, q: qq, xH: k === 1 ? r1 : r2, xT: k === 1 ? r2 : r1, nz });
  }
  return out;
});
function generateS1() {
  const v = ohneFeldKollision(S1_KANDIDATEN(), (w) => [[w.xH, w.xT, ...w.nz], [w.xT, w.xH, ...w.nz]], EPS);
  const { r1, r2, k, p, q: qq, xH, xT } = v;
  const P = poly([[1, "x²"], [p, "x"], [qq, ""]]), e = eh(kx(k));
  const k1 = poly([[k, "x²"], [2 + k * p, "x"], [p + k * qq, ""]]);
  const fak = (r) => (r === 0 ? "x" : `(x ${plusMinus(-r)})`);
  const tausch = "Hoch- und Tiefstelle sind vertauscht — prüfe, wie f′ das Vorzeichen wechselt.";
  const nullst = "Das ist eine Nullstelle von f, nicht von f′.";
  return {
    promptHtml: `Gegeben ist f(x) = ${pe(P, k)}.<br><strong>Bestimme die Stelle des Hochpunkts und die Stelle des Tiefpunkts.</strong>` + ZAHL,
    felder: [
      { name: "x<sub>H</sub> =", soll: xH, toleranz: TOL, hinweis: (roh, z) => (nahe(z, xT, TOL) ? tausch : v.nz.some((n) => nahe(z, n, TOL)) ? nullst : `f′(x) = (${k1}) · ${e}; setze die Klammer null.`) },
      { name: "x<sub>T</sub> =", soll: xT, toleranz: TOL, hinweis: (roh, z) => (nahe(z, xH, TOL) ? tausch : v.nz.some((n) => nahe(z, n, TOL)) ? nullst : `f′(x) = (${k1}) · ${e}; setze die Klammer null.`) },
    ],
    tipps: [`Produktregel: f′(x) = (${poly([[2, "x"], [p, ""]])}) · ${e} + (${P}) · ${aeK(k, k)}`, `Klammere ${e} aus; die Klammer ist ${k1}.`],
    musterloesungHtml: `f′(x) = (${poly([[2, "x"], [p, ""]])}) · ${e} + (${P}) · ${aeK(k, k)} = (${k1}) · ${e}<br>` +
      `${k1} = ${k === 1 ? "" : "−"}${fak(r1)} · ${fak(r2)} = 0 ⟺ x = ${num(r1)} oder x = ${num(r2)}<br>` +
      `Vorzeichen von f′: ${k === 1 ? "+ vor " + num(r1) + ", − dazwischen, + nach " + num(r2) : "− vor " + num(r1) + ", + dazwischen, − nach " + num(r2)} (${e} &gt; 0).<br>` +
      `<strong>Hochstelle x<sub>H</sub> = ${num(xH)}</strong>, <strong>Tiefstelle x<sub>T</sub> = ${num(xT)}</strong>`,
  };
}

// ---------- S2: Größtes Rechteck unter a · e^(−kx) ----------
// A(u) = a · u · e^(−ku), A′(u) = a(1 − ku)e^(−ku) = 0 ⟺ u = 1/k; A = a/(k · e).
// Fehlerbilder: u = k; A ohne e^(−1) (a/k) und ohne u (a · e^(−1)).
const S2_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const a of [1, 2, 3, 4, 5, 6]) for (const k of [0.5, 0.25, 2, 0.2, 0.4, 4]) out.push({ a, k, u: 1 / k, A: a / (k * Math.E) });
  return out;
});
function generateS2() {
  const v = ohneFeldKollision(S2_KANDIDATEN(), (w) => [[w.u, w.k], [w.A, w.a / w.k, w.a * Math.exp(-1)]], EPS);
  const { a, k, u, A } = v;
  const e = eh(kx(-k, "u"));
  return {
    promptHtml: `Unter dem Graphen von f(x) = ${ae(a, -k)} liegt im ersten Quadranten ein Rechteck mit den Ecken O(0 | 0), P(u | 0), Q(u | f(u)) und R(0 | f(u)).<br><strong>Für welches u &gt; 0 ist sein Flächeninhalt am größten, und wie groß ist er?</strong>` + GERUNDET,
    felder: [
      { name: "u =", soll: u, toleranz: TOL, hinweis: (roh, z) => (nahe(z, k, TOL) ? `Aus 1 − ${num(k)}u = 0 folgt u = ${bruch("1", num(k))}.` : "Stelle A(u) = u · f(u) auf und setze A′(u) = 0.") },
      { name: "A =", soll: A, toleranz: TOL, hinweis: (roh, z) => (nahe(z, a / k, TOL) ? `Der Faktor e<sup>−1</sup> fehlt: f(u) = ${num(a)} · ${eh(`−${num(k)} · ${num(u)}`)}.` : nahe(z, a * Math.exp(-1), TOL) ? "Das ist nur die Höhe f(u) — der Flächeninhalt ist u · f(u)." : "A = u · f(u) an der gefundenen Stelle.") },
    ],
    tipps: [`A(u) = u · ${ae(a, -k, "u")}`, `A′(u) = ${num(a)} · (1 − ${kx(k, "u")}) · ${e}`],
    musterloesungHtml: `A(u) = u · ${ae(a, -k, "u")}; A′(u) = ${num(a)} · ${e} + ${num(a)}u · (−${num(k)}) · ${e} = ${num(a)} · (1 − ${kx(k, "u")}) · ${e}<br>` +
      `A′(u) = 0 ⟺ <strong>u = ${bruch("1", num(k))} = ${num(u)}</strong>; A′ wechselt dort von + nach −: Maximum. Am Rand: A(u) → 0 für u → 0 und für u → ∞.<br>` +
      `<strong>A</strong> = ${num(u)} · ${num(a)} · e<sup>−1</sup> ${zeichen(A)} <strong>${num(A)}</strong>`,
  };
}

// ---------- S3: Hochpunkt von b · ln(ax)/x (LK) ----------
// f′(x) = b · (1 − ln(ax))/x² = 0 ⟺ ln(ax) = 1 ⟺ x = e/a; y = b · a/e.
// Fehlerbilder: x = 1/a (Nullstelle von f), x = a · e (falsch aufgelöst); y = b · e/a (Kehrwert) und
// b/e (mit x = e gerechnet — bei a = 1 richtig, dort NaN).
const S3_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const a of [1, 2, 3, 4, 0.5, 5, 0.25, 10]) for (const b of [1, 2, 3, 0.5, 4]) out.push({ a, b, x: Math.E / a, y: (a * b) / Math.E });
  return out;
});
function generateS3() {
  const v = ohneFeldKollision(S3_KANDIDATEN(), (w) => [[w.x, 1 / w.a, w.a * Math.E], [w.y, (w.b * Math.E) / w.a, w.a === 1 ? NaN : w.b / Math.E]], EPS);
  const { a, b, x, y } = v;
  const ln = a === 1 ? "ln(x)" : `ln(${num(a)}x)`;
  return {
    promptHtml: `Gegeben ist f(x) = ${vor(b)}${bruch(ln, "x")} für x &gt; 0.<br><strong>Bestimme die Koordinaten des Hochpunkts.</strong>` + GERUNDET,
    felder: [
      { name: "x<sub>H</sub> =", soll: x, toleranz: TOL, hinweis: (roh, z) => (nahe(z, 1 / a, TOL) ? `Bei x = ${num(1 / a)} ist ${ln} = 0 — dort ist f null, nicht f′.` : nahe(z, a * Math.E, TOL) ? `${ln} = 1 ⟺ ${a === 1 ? "x" : num(a) + "x"} = e ⟺ x = e : ${num(a)}.` : "Quotientenregel, dann den Zähler null setzen.") },
      { name: "y<sub>H</sub> =", soll: y, toleranz: TOL, hinweis: (roh, z) => (nahe(z, (b * Math.E) / a, TOL) ? `Kehrwert: f(e/${num(a)}) = ${vor(b)}${bruch("1", "e/" + num(a))} = ${bruch(num(a * b), "e")}.` : a !== 1 && nahe(z, b / Math.E, TOL) ? `Im Nenner steht x = e/${num(a)}, nicht e.` : "y = f(x<sub>H</sub>); an der Hochstelle ist der Zähler " + ln + " = 1.") },
    ],
    tipps: [`(${ln})′ = ${bruch(a === 1 ? "1" : num(a), a === 1 ? "x" : num(a) + "x")} = ${bruch("1", "x")} (Kettenregel)`, `Quotientenregel: f′(x) = ${vor(b)}${bruch(`${bruch("1", "x")} · x − ${ln} · 1`, "x²")}`],
    musterloesungHtml: `f′(x) = ${vor(b)}${bruch(`${bruch("1", "x")} · x − ${ln} · 1`, "x²")} = ${vor(b)}${bruch(`1 − ${ln}`, "x²")}<br>` +
      `f′(x) = 0 ⟺ ${ln} = 1 ⟺ ${a === 1 ? "x" : num(a) + "x"} = e ⟺ <strong>x = ${a === 1 ? "e" : bruch("e", num(a))} ≈ ${num(x)}</strong>; der Zähler fällt und wechselt von + nach −: Hochpunkt.<br>` +
      `<strong>y</strong> = ${vor(b)}${bruch("1", a === 1 ? "e" : `e/${num(a)}`)} = ${bruch(num(a * b), "e")} ≈ <strong>${num(y)}</strong>`,
  };
}

// ---------- S4: Gedämpfte Schwingung (LK) ----------
// f(x) = A · e^(−dx) · sin(x): f′ = 0 ⟺ tan(x) = 1/d, erste Hochstelle x₁ = tan⁻¹(1/d). Zwei
// aufeinanderfolgende Hochpunkte liegen 2π auseinander, ihre Höhen im Verhältnis e^(−2πd).
// Fehlerbilder: π/2 (Berührpunkt mit der Hüllkurve), tan⁻¹(d); beim Verhältnis e^(−πd).
const S4_KANDIDATEN = spaeter(() => {
  const out = [];
  // Kein d = 2: Das Verhältnis e^(−4π) ≈ 0,0000035 träfe auch die Eingabe 0.
  for (const d of [0.1, 0.2, 0.25, 0.4, 0.5, 0.8, 1]) for (const A of [1, 2, 3, 5, 10]) out.push({ d, A, x1: Math.atan(1 / d), q: Math.exp(-2 * Math.PI * d) });
  return out;
});
function generateS4() {
  const v = ohneFeldKollision(S4_KANDIDATEN(), (w) => [[w.x1, Math.PI / 2, Math.atan(w.d)], [w.q, Math.exp(-Math.PI * w.d)]], EPS);
  const { d, A, x1, q: qq } = v;
  const e = eh(kx(-d));
  return {
    promptHtml: `Eine gedämpfte Schwingung wird durch f(x) = ${vor(A)}${e} · sin(x) beschrieben.<br><strong>Bestimme die erste Hochstelle x₁ &gt; 0 und das Verhältnis q = f(x₁ + 2π) : f(x₁) der Höhen zweier aufeinanderfolgender Hochpunkte.</strong>` + GERUNDET,
    felder: [
      { name: "x₁ =", soll: x1, toleranz: TOL, hinweis: (roh, z) => (nahe(z, Math.PI / 2, TOL) ? "Bei π/2 berührt der Graph die Hüllkurve — der Hochpunkt liegt wegen der Dämpfung weiter links." : nahe(z, Math.atan(d), TOL) ? `tan(x) = ${bruch("1", num(d))}, nicht ${num(d)}.` : "Setze f′(x) = 0; die Klammer führt auf eine Gleichung tan(x) = c.") },
      { name: "q =", soll: qq, toleranz: TOL, hinweis: (roh, z) => (nahe(z, Math.exp(-Math.PI * d), TOL) ? "Nach π kommt ein Tiefpunkt — der nächste Hochpunkt liegt 2π weiter." : "sin(x₁ + 2π) = sin(x₁) — im Verhältnis bleibt nur der e-Faktor übrig.") },
    ],
    tipps: [`f′(x) = ${vor(A)}${e} · (cos(x) − ${num(d)} · sin(x))`, "tan hat die Periode π; sin die Periode 2π."],
    musterloesungHtml: `f′(x) = ${vor(A)}(−${num(d)}) · ${e} · sin(x) + ${vor(A)}${e} · cos(x) = ${vor(A)}${e} · (cos(x) − ${num(d)} · sin(x))<br>` +
      `f′(x) = 0 ⟺ tan(x) = ${bruch("1", num(d))} ⟺ x = tan⁻¹(${num(1 / d)}) + jπ; die erste Stelle <strong>x₁ ≈ ${num(x1)}</strong> ist eine Hochstelle (die Klammer wechselt von + nach −).<br>` +
      `<strong>q</strong> = ${bruch(`${eh(`−${num(d)}(x₁ + 2π)`)} · sin(x₁ + 2π)`, `${eh(`−${num(d)}x₁`)} · sin(x₁)`)} = ${eh(`−2π · ${num(d)}`)} ≈ <strong>${num(qq)}</strong>`,
  };
}

// ---------- S5: Ortskurve der Wendepunkte ----------
// f_k(x) = a · x · e^(−kx): W_k(2/k | 2a/(k · e²)), alle auf y = (a/e²) · x.
// Fehlerbilder: 1/k (Hochstelle), k/2 (bei k = 2 keiner — NaN); bei y die Höhe des Hochpunkts; bei c
// die Ortskurve der Hochpunkte a/e und a ohne e^(−2).
const S5_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const k of [0.25, 0.5, 2, 4, 0.2, 1, 0.4]) for (const a of [1, 2, 3, 4, 0.5, 6]) {
    out.push({ k, a, x: 2 / k, y: (2 * a) / (k * Math.E * Math.E), c: a / (Math.E * Math.E) });
  }
  return out;
});
function generateS5() {
  const v = ohneFeldKollision(S5_KANDIDATEN(), (w) => [[w.x, 1 / w.k, w.k === 2 ? NaN : w.k / 2], [w.y, w.a / (w.k * Math.E)], [w.c, w.a / Math.E, w.a]], EPS);
  const { k, a, x, y, c } = v;
  return {
    promptHtml: `Für k &gt; 0 ist f<sub>k</sub>(x) = ${faktor(a)}x · ${eh("−kx")} gegeben.<br><strong>Bestimme den Wendepunkt W(x<sub>W</sub> | y<sub>W</sub>) für k = ${num(k)} und die Zahl c, für die alle Wendepunkte der Schar auf der Geraden y = c · x liegen.</strong>` + GERUNDET,
    felder: [
      { name: "x<sub>W</sub> =", soll: x, toleranz: TOL, hinweis: (roh, z) => (nahe(z, 1 / k, TOL) ? `${bruch("1", "k")} ist die Hochstelle; die Wendestelle liegt bei ${bruch("2", "k")}.` : nahe(z, k / 2, TOL) ? "Die Wendestelle ist 2 geteilt durch k, nicht k geteilt durch 2." : "Bilde f<sub>k</sub>″ und setze die Klammer null.") },
      { name: "y<sub>W</sub> =", soll: y, toleranz: TOL, hinweis: (roh, z) => (nahe(z, a / (k * Math.E), TOL) ? "Das ist die Höhe des Hochpunkts." : "y = f<sub>k</sub>(x<sub>W</sub>).") },
      { name: "c =", soll: c, toleranz: TOL, hinweis: (roh, z) => (nahe(z, a / Math.E, TOL) ? `${bruch(num(a), "e")} gehört zur Ortskurve der Hochpunkte.` : nahe(z, a, TOL) ? "Der Faktor e<sup>−2</sup> fehlt." : "Löse x = 2/k nach k auf und setze in y ein.") },
    ],
    tipps: [`f<sub>k</sub>″(x) = ${num(a)} · k · (kx − 2) · ${eh("−kx")}`, "Ortskurve: k = 2/x in y<sub>W</sub> einsetzen."],
    musterloesungHtml: `f<sub>k</sub>′(x) = ${num(a)} · (1 − kx) · ${eh("−kx")}, f<sub>k</sub>″(x) = ${num(a)} · (−k − k(1 − kx)) · ${eh("−kx")} = ${num(a)} · k(kx − 2) · ${eh("−kx")}<br>` +
      `f<sub>k</sub>″(x) = 0 ⟺ x = ${bruch("2", "k")} (Vorzeichenwechsel); y = ${num(a)} · ${bruch("2", "k")} · e<sup>−2</sup>. Für k = ${num(k)}: <strong>W(${num(x)} | ${num(y)})</strong>${zeichen(y) === "≈" ? " (gerundet)" : ""}.<br>` +
      `Ortskurve: x = ${bruch("2", "k")} ⟺ k = ${bruch("2", "x")}, also y = ${num(a)} · x · e<sup>−2</sup>: <strong>c = ${bruch(num(a), "e²")} ≈ ${num(c)}</strong>`,
  };
}

// ================= komplex =================

// ---------- K1: Funktion aus dem Extrempunkt bestimmen ----------
// f(x) = (ax + b) · e^(kx) mit f(0) = b und f′(x_E) = 0: a(1 + k · x_E) + k · b = 0 ⟹
// a = −kb/(1 + k · x_E). y_E = (a · x_E + b) · e^(k · x_E). Fehlerbilder: Vorzeichen; der Summand
// u′ · v = a · e^(kx) fehlt (a = −b/x_E); y ohne e-Faktor.
const K1_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const k of [-1, -0.5, -2, 1, 0.5, 2]) for (const b of [1, 2, 3, -1, -2, 4]) for (const xE of [-3, -2, -1, 1, 2, 3, 0.5, 4]) {
    const n = 1 + k * xE;
    if (Math.abs(n) < 1e-9) continue;
    const a = (-k * b) / n;
    if (!glatt(a, 4) || a === 0) continue;
    out.push({ k, b, xE, a, y: (a * xE + b) * Math.exp(k * xE) });
  }
  return out;
});
function generateK1() {
  const v = ohneFeldKollision(K1_KANDIDATEN(), (w) => [[w.a, -w.a, -w.b / w.xE], [w.y, w.a * w.xE + w.b]], EPS);
  const { k, b, xE, a, y } = v;
  const e = eh(kx(k));
  return {
    promptHtml: `Der Graph von f(x) = (ax + b) · ${e} schneidet die y-Achse bei y = ${num(b)} und hat an der Stelle x = ${num(xE)} einen Extrempunkt.<br><strong>Bestimme a und die y-Koordinate des Extrempunkts.</strong>` + GERUNDET,
    felder: [
      { name: "a =", soll: a, toleranz: TOL, hinweis: (roh, z) => (nahe(z, -a, TOL) ? "Vorzeichenfehler beim Auflösen nach a." : nahe(z, -b / xE, TOL) ? `In der Produktregel fehlt der Summand u′ · v = a · ${e}.` : `f′(x) = (a + ${numK(k)} · (ax + b)) · ${e}; setze x = ${num(xE)} und b = ${num(b)} ein.`) },
      { name: "y<sub>E</sub> =", soll: y, toleranz: TOL, hinweis: (roh, z) => (nahe(z, a * xE + b, TOL) ? `Der Faktor ${eh(num(k * xE))} gehört zum Funktionswert dazu.` : "y = f(x<sub>E</sub>) mit dem gefundenen a.") },
    ],
    tipps: [`f(0) = b · e⁰ = b, also b = ${num(b)}.`, `f′(x) = a · ${e} + (ax + b) · ${aeK(k, k)} = (a + ${numK(k)} · (ax + b)) · ${e}`],
    musterloesungHtml: `f(0) = b = ${num(b)}. f′(x) = (a + ${numK(k)} · (ax ${plusMinus(b)})) · ${e}.<br>` +
      `f′(${num(xE)}) = 0 ⟺ a + ${numK(k)} · (${glied(xE, "a", false)} ${plusMinus(b)}) = 0 ⟺ ${glied(1 + k * xE, "a", false)} = ${num(-k * b)} ⟺ <strong>a = ${num(a)}</strong>.<br>` +
      `Probe: Die Klammer von f′ ist ${linear(k * a, a + k * b)} — sie ist bei ${num(xE)} null und wechselt dort das Vorzeichen ✓<br>` +
      `<strong>y</strong> = (${num(a)} · ${numK(xE)} ${plusMinus(b)}) · ${eh(num(k * xE))} = ${num(a * xE + b)} · ${eh(num(k * xE))} ${zeichen(y)} <strong>${num(y)}</strong>`,
  };
}

// ---------- K2: Größtes Rechteck unter dem Kosinus — zwei Newton-Schritte (LK) ----------
// A(u) = 2u · cos(bu), A′(u) = 2 · g(u) mit g(u) = cos(bu) − bu · sin(bu); g′(u) = −2b · sin(bu) −
// b²u · cos(bu). Fehlerbilder: Plus statt Minus im Newton-Schritt; u₁ als u₂ (ein Schritt zu wenig).
const K2_KANDIDATEN = spaeter(() => {
  const out = [];
  const g = (b, u) => Math.cos(b * u) - b * u * Math.sin(b * u), dg = (b, u) => -2 * b * Math.sin(b * u) - b * b * u * Math.cos(b * u);
  for (const b of [1, 2, 0.5, 4]) for (const s of [0.5, 0.7, 0.8, 1, 1.2]) {
    const u0 = s / b, u1 = u0 - g(b, u0) / dg(b, u0), u2 = u1 - g(b, u1) / dg(b, u1);
    out.push({ b, u0, u1, u2, f1: u0 + g(b, u0) / dg(b, u0), f2: u1 + g(b, u1) / dg(b, u1), g0: g(b, u0), d0: dg(b, u0), g1: g(b, u1), d1: dg(b, u1) });
  }
  return out;
});
function generateK2() {
  const v = ohneFeldKollision(K2_KANDIDATEN(), (w) => [[w.u1, w.f1], [w.u2, w.f2, w.u1]], EPS);
  const { b, u0, u1, u2 } = v;
  const bu = kx(b, "u");
  return {
    promptHtml: `Unter dem Graphen von f(x) = cos(${kx(b)}) liegt ein zur y-Achse symmetrisches Rechteck mit den Ecken (±u | 0) und (±u | f(u)). Sein Flächeninhalt A(u) = 2u · cos(${bu}) ist am größten, wo g(u) = cos(${bu}) − ${bu} · sin(${bu}) null ist.<br><strong>Berechne mit dem Newton-Verfahren zum Startwert u₀ = ${num(u0)} die Näherungen u₁ und u₂.</strong>` + GERUNDET,
    felder: [
      { name: "u₁ =", soll: u1, toleranz: TOL, hinweis: (roh, z) => (nahe(z, v.f1, TOL) ? "Newton: u₁ = u₀ − g(u₀) : g′(u₀) — mit Minus." : "u₁ = u₀ − g(u₀) : g′(u₀) mit g′(u) = −2b · sin(bu) − b²u · cos(bu).") },
      { name: "u₂ =", soll: u2, toleranz: TOL, hinweis: (roh, z) => (nahe(z, v.f2, TOL) ? "Newton: u₂ = u₁ − g(u₁) : g′(u₁) — mit Minus." : nahe(z, u1, TOL) ? "Das ist u₁ — es fehlt noch ein Schritt." : "Wiederhole den Schritt mit u₁.") },
    ],
    tipps: [`A′(u) = 2 cos(${bu}) − 2${bu} · sin(${bu}) = 2 · g(u)`, `g′(u) = ${num(-2 * b)} · sin(${bu}) − ${glied(b * b, "u", false)} · cos(${bu}) (Produkt- und Kettenregel)`],
    musterloesungHtml: `A′(u) = 2 · cos(${bu}) + 2u · (−${mal(b)}sin(${bu})) = 2 · g(u) — die Gleichung g(u) = 0 lässt sich nicht nach u auflösen.<br>` +
      `g′(u) = −${mal(b)}sin(${bu}) − (${mal(b)}sin(${bu}) + ${bu} · ${mal(b)}cos(${bu})) = ${num(-2 * b)} · sin(${bu}) − ${glied(b * b, "u", false)} · cos(${bu})<br>` +
      `u₁ = u₀ − g(u₀) : g′(u₀) = ${num(u0)} − ${numK(v.g0)} : ${numK(v.d0)} ≈ <strong>${num(u1)}</strong><br>` +
      `u₂ = ${num(u1)} − ${numK(v.g1)} : ${numK(v.d1)} ≈ <strong>${num(u2)}</strong> — der genaue Wert ist u ≈ ${num(0.8603335890193797 / b)}, und A ≈ ${num(1.1221926763820902 / b)}.`,
  };
}

// ---------- K3: Wirkstoffkonzentration ----------
// c(t) = a · t · e^(−kt): Maximum bei 1/k mit a/(k · e), stärkste Abnahme an der Wendestelle 2/k.
// Fehlerbilder: t = k (bei k = 1 keiner — NaN); c ohne e^(−1); t_W = 1/k (das Maximum) oder k/2
// (bei k = 2 keiner — NaN).
const K3_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const a of [2, 4, 5, 10, 8, 3, 20]) for (const k of [0.5, 0.25, 0.2, 0.4, 2, 1, 0.1]) out.push({ a, k, tm: 1 / k, cm: a / (k * Math.E), tw: 2 / k });
  return out;
});
function generateK3() {
  const v = ohneFeldKollision(K3_KANDIDATEN(), (w) => [[w.tm, w.k === 1 ? NaN : w.k], [w.cm, w.a / w.k], [w.tw, w.tm, w.k === 2 ? NaN : w.k / 2]], EPS);
  const { a, k, tm, cm, tw } = v;
  const e = eh(kx(-k, "t"));
  return {
    promptHtml: `Nach der Einnahme eines Medikaments beträgt die Wirkstoffkonzentration im Blut c(t) = ${num(a)}t · ${e} (c in mg/l, t in Stunden).<br><strong>Wann ist die Konzentration am größten, wie groß ist sie dann, und wann nimmt sie am stärksten ab?</strong>` + GERUNDET,
    felder: [
      { name: "t<sub>max</sub> =", soll: tm, toleranz: TOL, hinweis: (roh, z) => (nahe(z, k, TOL) ? `1 − ${num(k)}t = 0 ⟺ t = ${bruch("1", num(k))}.` : "Setze c′(t) = 0.") },
      { name: "c<sub>max</sub> =", soll: cm, toleranz: TOL, hinweis: (roh, z) => (nahe(z, a / k, TOL) ? "Der Faktor e<sup>−1</sup> fehlt: An der Stelle 1/k ist kt = 1." : "c<sub>max</sub> = c(t<sub>max</sub>).") },
      { name: "t<sub>W</sub> =", soll: tw, toleranz: TOL, hinweis: (roh, z) => (nahe(z, tm, TOL) ? "Das ist der Zeitpunkt der größten Konzentration. Am stärksten nimmt sie ab, wo c′ am kleinsten ist — an der Wendestelle." : nahe(z, k / 2, TOL) ? "Die Wendestelle ist 2 geteilt durch k, nicht k geteilt durch 2." : "Setze c″(t) = 0.") },
    ],
    tipps: [`c′(t) = ${num(a)} · (1 − ${kx(k, "t")}) · ${e}`, `c″(t) = ${num(a * k)} · (${kx(k, "t")} − 2) · ${e}`],
    musterloesungHtml: `c′(t) = ${num(a)} · ${e} + ${num(a)}t · (−${num(k)}) · ${e} = ${num(a)} · (1 − ${kx(k, "t")}) · ${e} = 0 ⟺ <strong>t<sub>max</sub> = ${num(tm)}</strong> h (c′ wechselt von + nach −).<br>` +
      `<strong>c<sub>max</sub></strong> = ${num(a)} · ${num(tm)} · e<sup>−1</sup> ≈ <strong>${num(cm)}</strong> mg/l<br>` +
      `c″(t) = ${num(a * k)} · (${kx(k, "t")} − 2) · ${e} = 0 ⟺ <strong>t<sub>W</sub> = ${num(tw)}</strong> h; c″ wechselt dort von − nach +, also hat c′ dort sein Minimum: Die Konzentration nimmt am stärksten ab. Für t → ∞ geht c′(t) → 0, das Minimum ist also das kleinste c′ überhaupt.`,
  };
}

// ---------- K4: Funktion mit ln vollständig untersuchen (LK) ----------
// f(x) = b · x · (ln(x) − a)²: f′ = b · L(L + 2) mit L = ln(x) − a, f″ = b · (2L + 2)/x.
// Hochstelle e^(a − 2), Tiefstelle e^a, Wendestelle e^(a − 1). Fehlerbilder: vertauscht; e^(a + 2)
// und e^(a + 1) (Vorzeichen beim Auflösen).
const K4_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const a of [-1, -0.5, 0, 0.5, 1, 1.5, 2]) for (const b of [1, 2, 0.5, 3]) out.push({ a, b, xH: Math.exp(a - 2), xT: Math.exp(a), xW: Math.exp(a - 1) });
  return out;
});
function generateK4() {
  const v = ohneFeldKollision(K4_KANDIDATEN(), (w) => [[w.xH, w.xT, Math.exp(w.a + 2)], [w.xT, w.xH], [w.xW, Math.exp(w.a + 1)]], EPS);
  const { a, b, xH, xT, xW } = v;
  const L = lnPlus(-a), L2 = lnPlus(2 - a);
  const ex = (z) => (z === 0 ? "e⁰" : eh(num(z)));
  return {
    promptHtml: `Gegeben ist f(x) = ${vor(b)}x · (${L})² für x &gt; 0.<br><strong>Bestimme die Stellen des Hochpunkts, des Tiefpunkts und des Wendepunkts.</strong>` + GERUNDET,
    felder: [
      { name: "x<sub>H</sub> =", soll: xH, toleranz: TOL, hinweis: (roh, z) => (nahe(z, xT, TOL) ? "Hoch- und Tiefstelle sind vertauscht." : nahe(z, Math.exp(a + 2), TOL) ? `Vorzeichen: ${L2} = 0 ⟺ ln(x) = ${num(a - 2)}.` : "f′ ist ein Produkt aus zwei Klammern — setze beide null.") },
      { name: "x<sub>T</sub> =", soll: xT, toleranz: TOL, hinweis: (roh, z) => (nahe(z, xH, TOL) ? "Hoch- und Tiefstelle sind vertauscht." : "f′ ist ein Produkt aus zwei Klammern — setze beide null.") },
      { name: "x<sub>W</sub> =", soll: xW, toleranz: TOL, hinweis: (roh, z) => (nahe(z, Math.exp(a + 1), TOL) ? `Vorzeichen: 2 · (${L}) + 2 = 0 ⟺ ln(x) = ${num(a - 1)}.` : "Setze f″(x) = 0.") },
    ],
    tipps: [`f′(x) = ${vor(b)}((${L})² + x · 2(${L}) · ${bruch("1", "x")}) = ${vor(b)}(${L}) · (${L2})`, `f″(x) = ${num(b)} · ${bruch(`2 · (${L}) + 2`, "x")}`],
    musterloesungHtml: `Produkt- und Kettenregel: f′(x) = ${vor(b)}((${L})² + x · 2(${L}) · ${bruch("1", "x")}) = ${vor(b)}(${L}) · (${L2})<br>` +
      `Mit L = ${L}: f′ = ${b === 1 ? "" : num(b) + " · "}L(L + 2) ist positiv für L &lt; −2, negativ für −2 &lt; L &lt; 0, positiv für L &gt; 0.<br>` +
      `L = −2 ⟺ ln(x) = ${num(a - 2)}: <strong>Hochstelle ${ex(a - 2)} ${zeichen(xH)} ${num(xH)}</strong>; L = 0 ⟺ ln(x) = ${num(a)}: <strong>Tiefstelle ${ex(a)} ${zeichen(xT)} ${num(xT)}</strong>.<br>` +
      `f″(x) = ${num(b)} · ${bruch("2L + 2", "x")} = 0 ⟺ L = −1 ⟺ ln(x) = ${num(a - 1)} (Vorzeichenwechsel): <strong>Wendestelle ${ex(a - 1)} ${zeichen(xW)} ${num(xW)}</strong>`,
  };
}

// ---------- K5: Wendetangente von (αx + β) · e^(kx) ----------
// x_W = −β/α − 2/k; m = f′(x_W) = −α · e^(k x_W); y_W = −(2α/k) · e^(k x_W); n = y_W − m · x_W.
// Fehlerbilder: die Extremstelle; y_W als Steigung; y_W als Achsenabschnitt und y_W + m · x_W
// (beide bei x_W = 0 richtig — dort NaN).
const K5_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const al of [1, 2, -1, 3]) for (const be of [0, 1, 2, -1, -2, 3]) for (const k of [1, -1, 2, -2, 0.5, -0.5]) {
    const x = -be / al - 2 / k;
    if (!glatt(x, 4) || !glatt(-be / al - 1 / k, 4)) continue;
    const E = Math.exp(k * x), m = -al * E, y = (-2 * al / k) * E;
    out.push({ al, be, k, x, m, y, n: y - m * x });
  }
  return out;
});
function generateK5() {
  const v = ohneFeldKollision(K5_KANDIDATEN(), (w) => [[w.x, -w.be / w.al - 1 / w.k], [w.m, w.y], [w.n, w.x === 0 ? NaN : w.y, w.x === 0 ? NaN : w.y + w.m * w.x]], EPS);
  const { al, be, k, x, m, y, n } = v;
  const P = linear(al, be), e = eh(kx(k));
  const k1 = linear(k * al, al + k * be), k2 = linear(k * k * al, 2 * k * al + k * k * be);
  return {
    promptHtml: `Gegeben ist f(x) = ${pe(P, k)}.<br><strong>Bestimme die Wendestelle und die Gleichung der Wendetangente t(x) = m · x + n.</strong>` + GERUNDET,
    felder: [
      { name: "x<sub>W</sub> =", soll: x, toleranz: TOL, hinweis: (roh, z) => (nahe(z, -be / al - 1 / k, TOL) ? "Das ist die Extremstelle. Die Wendestelle ist die Nullstelle der Klammer von f″." : `f″(x) = (${k2}) · ${e}.`) },
      { name: "m =", soll: m, toleranz: TOL, hinweis: (roh, z) => (nahe(z, y, TOL) ? "Das ist f(x<sub>W</sub>), die y-Koordinate. Die Steigung ist f′(x<sub>W</sub>)." : `m = f′(x<sub>W</sub>) mit f′(x) = (${k1}) · ${e}.`) },
      { name: "n =", soll: n, toleranz: TOL, hinweis: (roh, z) => (nahe(z, y, TOL) ? "Das ist die y-Koordinate des Wendepunkts. n ist der y-Achsenabschnitt der Tangente: n = y<sub>W</sub> − m · x<sub>W</sub>." : nahe(z, y + m * x, TOL) ? "Vorzeichen: n = y<sub>W</sub> − m · x<sub>W</sub>." : "Die Tangente geht durch W: y<sub>W</sub> = m · x<sub>W</sub> + n.") },
    ],
    tipps: [`f′(x) = (${k1}) · ${e}, f″(x) = (${k2}) · ${e}`, "Tangente durch W(x<sub>W</sub> | f(x<sub>W</sub>)) mit Steigung f′(x<sub>W</sub>)."],
    musterloesungHtml: `f′(x) = (${k1}) · ${e}, f″(x) = (${k2}) · ${e}<br>` +
      `f″(x) = 0 ⟺ <strong>x<sub>W</sub> = ${num(x)}</strong> (die Klammer wechselt das Vorzeichen).<br>` +
      `y<sub>W</sub> = (${summe(al, x, be)}) · ${eh(num(k * x))} ≈ ${num(y)}; <strong>m</strong> = f′(${num(x)}) = (${summe(k * al, x, al + k * be)}) · ${eh(num(k * x))} ≈ <strong>${num(m)}</strong><br>` +
      `<strong>n</strong> = y<sub>W</sub> − m · x<sub>W</sub> ≈ ${num(y)} − ${numK(m)} · ${numK(x)} ≈ <strong>${num(n)}</strong>`,
  };
}

export const AUFGABEN = [
  { schwierigkeit: "einfach", titel: "Zweite Ableitung an der Stelle 0", generate: generateE1 },
  { schwierigkeit: "einfach", titel: "Asymptote und y-Achsenabschnitt", generate: generateE2 },
  { schwierigkeit: "einfach", titel: "Tiefpunkt einer ln-Funktion (LK)", generate: generateE3 },
  { schwierigkeit: "einfach", titel: "Beschränktes Wachstum", generate: generateE4 },
  { schwierigkeit: "einfach", titel: "Wendepunkt der Glockenkurve (LK)", generate: generateE5 },
  { schwierigkeit: "einfach", titel: "f′ und f″: e-Funktionen", generate: generateE6, wuerfelText: "🎲 Neue Funktion" },
  { schwierigkeit: "mittel", titel: "Wendepunkt", generate: generateM1 },
  { schwierigkeit: "mittel", titel: "Krümmungsintervall", generate: generateM2 },
  { schwierigkeit: "mittel", titel: "Extrempunkte mit Sinus und Kosinus (LK)", generate: generateM3 },
  { schwierigkeit: "mittel", titel: "Scharparameter aus dem Hochpunkt", generate: generateM4 },
  { schwierigkeit: "mittel", titel: "Logistisches Wachstum (LK)", generate: generateM5 },
  { schwierigkeit: "mittel", titel: "f′ und f″: Produkte mit e", generate: generateM6, wuerfelText: "🎲 Neue Funktion" },
  { schwierigkeit: "schwierig", titel: "Hoch- und Tiefpunkt", generate: generateS1 },
  { schwierigkeit: "schwierig", titel: "Größtes Rechteck unter einer e-Funktion", generate: generateS2 },
  { schwierigkeit: "schwierig", titel: "Hochpunkt einer ln-Funktion (LK)", generate: generateS3 },
  { schwierigkeit: "schwierig", titel: "Gedämpfte Schwingung (LK)", generate: generateS4 },
  { schwierigkeit: "schwierig", titel: "Ortskurve der Wendepunkte", generate: generateS5 },
  { schwierigkeit: "schwierig", titel: "f′ und f″: Sinus und Kosinus (LK)", generate: generateS6, wuerfelText: "🎲 Neue Funktion" },
  { schwierigkeit: "komplex", titel: "Funktion aus dem Extrempunkt bestimmen", generate: generateK1 },
  { schwierigkeit: "komplex", titel: "Größtes Rechteck unter dem Kosinus (LK)", generate: generateK2 },
  { schwierigkeit: "komplex", titel: "Wirkstoffkonzentration", generate: generateK3 },
  { schwierigkeit: "komplex", titel: "Funktion mit ln vollständig untersuchen (LK)", generate: generateK4 },
  { schwierigkeit: "komplex", titel: "Wendetangente", generate: generateK5 },
  { schwierigkeit: "komplex", titel: "f′ und f″: Verkettung und Funktionenschar (LK)", generate: generateK6, wuerfelText: "🎲 Neue Funktion" },
];
