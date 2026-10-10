// Die vierundzwanzig Übungsaufgaben zu „Ableitung weiterer Funktionen“ (Thema 2.2) — sechs je Stufe.
// Was nach dem rheinland-pfälzischen Lehrplan nur zum Leistungsfach gehört (sin und cos, Kettenregel,
// Quotientenregel, die Funktion ln), trägt im Titel „(LK)“; die übrigen Aufgaben brauchen nur
// a · e^(kx), die Produktregel aus Thema 2.1 und den natürlichen Logarithmus zum Lösen von Gleichungen.
//
//   einfach   — f′(ln c) bei a · e^(kx), Exponentialgleichung, sin und cos an besonderen Stellen (LK),
//               Wachstumsrate, waagerechte Tangente bei (x + b) · e^(kx).
//   mittel    — Tangente im y-Achsenabschnitt, Produktregel mit Ausklammern, Kettenregel (LK),
//               Quotientenregel (LK), Stelle mit vorgegebener Steigung.
//   schwierig — Extrempunkt von (ax + b) · e^(kx), sin x = c (LK), Tangente an ln (LK),
//               Kettenregel und Tangente (LK), Halbwertszeit und Abbaurate.
//   komplex   — Tangente von einem Punkt der x-Achse, gedämpfte Schwingung (LK), Schnittwinkel
//               zweier e-Funktionen, Parameter aus der Extremstelle, Abkühlung.
//
// Die sechste Aufgabe jeder Stufe ist ein Ableitungstraining mit beliebig vielen Funktionen
// (mathematik/terme.js): e-Funktionen, Produkte mit e-Funktionen, Kettenregel (LK), gemischte
// Funktionen mit e, ln, sin und cos (LK).
//
// Gewürfelt wird konstruktiv: Die Kandidatenlisten werden vorher gesiebt, ohneKollision() wählt aus
// dem Rest. Jeder Fehlerwert ist von der Lösung und von den anderen Fehlerwerten verschieden — wo ein
// Fehler mit der Lösung zusammenfiele, steht NaN. Wo die Lösung ein Logarithmus oder eine
// e-Potenz ist, wird auf vier Nachkommastellen gerundet eingegeben; sonst ist sie glatt.

"use strict";

import { pot, q, efunktion, lnGlied, trig, kette, prod, verkettung, trigPotenz, ableitungsAufgabe, pick as zufall, mische } from "../../../terme.js?v=3";

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
const GRAD = 180 / Math.PI;
function hochZahl(n) {
  return String(n).split("").map((c) => ({ "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "-": "⁻", "−": "⁻" })[c] || c).join("");
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
// ln(…) : k ohne „: 1“ und ohne negativen Nenner: −ln 3 statt ln 3 : (−1).
function durchK(zaehler, k) {
  if (k === 1) return zaehler;
  if (k === -1) return `−${zaehler}`;
  return k < 0 ? `−${bruch(zaehler, num(-k))}` : bruch(zaehler, num(k));
}
// Probe mit gerundetem Wert: „≈ 12 ✓“ oder „≈ 11,99 ≈ 12 ✓“.
function probe(wert, soll) {
  const w = num(wert, 2);
  return `≈ ${w}${w === num(soll) ? "" : ` ≈ ${num(soll)}`} ✓`;
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
const WINKEL = `<br><span class="progress-note">Gib x auf vier Nachkommastellen und den Winkel in Grad auf zwei Nachkommastellen gerundet ein.</span>`;
const TOL = 0.0001;
const TOL_WINKEL = 0.006;
const EPS = 0.001;
// Wer mit dem Taschenrechner rechnet, gibt die gerundete Zahl ein — sie muss als richtig gelten.
const r4 = (x) => Math.round(x * 1e4) / 1e4;

// ================= einfach =================

// ---------- E1: f′(ln c) bei a · e^(kx) ----------
// e^(k · ln c) = (e^(ln c))ᵏ = cᵏ — die Stelle ln c macht das Ergebnis glatt und übt e^(ln c) = c.
// Bei k = 1 ist f′ = f, „k vergessen“ also kein Fehler: dort NaN.
const E1_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const a of [1, 2, 3, -2, 0.5, 4]) for (const k of [1, 2, 3, -1, -2]) for (const c of [2, 3, 5, 0.5]) {
    const ck = c ** k, soll = a * k * ck;
    if (glatt(soll, 4) && glatt(ck, 4) && Math.abs(soll) <= 1000) out.push({ a, k, c, ck, soll });
  }
  return out;
});
function generateE1() {
  const v = ohneKollision(E1_KANDIDATEN(), (w) => [w.soll, w.k === 1 ? NaN : w.a * w.ck, w.k === 1 ? NaN : w.a * w.k * w.c], EPS);
  const { a, k, c, ck, soll } = v;
  const lnc = `ln ${num(c)}`;
  const kLn = k === 1 ? lnc : k === -1 ? `−${lnc}` : `${num(k)} ${lnc}`;
  return {
    promptHtml: `Gegeben ist f(x) = ${ae(a, k)}.<br><strong>Berechne f′(${lnc}) exakt.</strong>` + ZAHL,
    correct: soll,
    tolerance: TOL,
    placeholder: `f′(${lnc})`,
    hinweis: (roh, val) => {
      if (k !== 1 && nahe(val, a * ck, TOL)) return `Das ist f(${lnc}) — der Faktor k = ${num(k)} fehlt: (e<sup>kx</sup>)′ = k · e<sup>kx</sup>.`;
      if (k !== 1 && nahe(val, a * k * c, TOL)) return `${eh(kLn)} ist nicht ${num(k)} · ${num(c)}, sondern (${eh(lnc)})${hochZahl(k)} = ${num(c)}${hochZahl(k)} — Potenzgesetz.`;
      return `Leite zuerst ab: f′(x) = ${ae(a * k, k)}. Setze dann x = ${lnc} ein und benutze ${eh(lnc)} = ${num(c)}.`;
    },
    tipps: [`(e<sup>kx</sup>)′ = k · e<sup>kx</sup>, also f′(x) = ${num(a)} · ${numK(k)} · ${eh(kx(k))} = ${ae(a * k, k)}.`, `${eh(kLn)} = (${eh(lnc)})${hochZahl(k)} = ${num(c)}${hochZahl(k)} = ${num(ck)}`],
    musterloesungHtml: `f′(x) = ${num(a)} · ${numK(k)} · ${eh(kx(k))} = ${ae(a * k, k)}<br>` +
      `f′(${lnc}) = ${faktor(a * k)}${eh(kLn)} = ${num(a * k)} · (${eh(lnc)})${hochZahl(k)} = ${num(a * k)} · ${num(c)}${hochZahl(k)} = ${num(a * k)} · ${num(ck)} = <strong>${num(soll)}</strong>`,
  };
}

// ---------- E2: Exponentialgleichung a · e^(kx) + b = c ----------
// Die Fehlerbilder: mit k multipliziert statt geteilt (bei |k| = 1 dasselbe — NaN), nicht durch a
// geteilt, b vergessen, b mit falschem Vorzeichen (bei b = 0 kein Fehler — NaN).
const E2_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const a of [2, 3, 4, 5, 0.5]) for (const k of [0.5, 2, 3, -1, -0.5, 0.2]) for (const b of [0, 1, -2, 3, 5]) for (const c of [7, 10, 12, 20, 30]) {
    const r = (c - b) / a;
    // r = 1 gäbe x = 0 — das Logarithmieren wäre überflüssig.
    if (r <= 0 || Math.abs(r - 1) < 1e-9) continue;
    out.push({ a, k, b, c, r, soll: Math.log(r) / k });
  }
  return out;
});
const lnSicher = (x) => (x > 0 ? Math.log(x) : NaN);
function e2Fehler(w) {
  return {
    mal: Math.abs(w.k) === 1 ? NaN : Math.log(w.r) * w.k,
    ohneA: lnSicher(w.c - w.b) / w.k,
    ohneB: w.b === 0 ? NaN : lnSicher(w.c / w.a) / w.k,
    vorzeichen: w.b === 0 ? NaN : lnSicher((w.c + w.b) / w.a) / w.k,
  };
}
function generateE2() {
  const v = ohneKollision(E2_KANDIDATEN(), (w) => [w.soll, ...Object.values(e2Fehler(w))], EPS);
  const { a, k, b, c, r, soll } = v;
  const F = e2Fehler(v);
  const rT = glatt(r, 4) ? num(r) : bruch(num(c - b), num(a));
  const links = `${ae(a, k)}${b === 0 ? "" : " " + plusMinus(b)}`;
  return {
    promptHtml: `<strong>Löse die Gleichung</strong> ${links} = ${num(c)}.` + GERUNDET,
    correct: soll,
    tolerance: TOL,
    placeholder: "x",
    hinweis: (roh, val) => {
      if (nahe(val, F.mal, TOL)) return `Aus ${kx(k)} = ln(…) folgt x = ln(…) : ${numK(k)} — durch k teilen, nicht mit k multiplizieren.`;
      if (nahe(val, F.ohneA, TOL)) return `Erst durch ${num(a)} teilen, dann logarithmieren: ln(${num(a)} · ${eh(kx(k))}) ist nicht ${kx(k)}.`;
      if (nahe(val, F.ohneB, TOL)) return `Bring zuerst ${num(Math.abs(b))} auf die andere Seite — erst dann steht die e-Potenz allein.`;
      if (nahe(val, F.vorzeichen, TOL)) return `Vorzeichen: Auf der anderen Seite wird aus ${plusMinus(b)} ein ${plusMinus(-b)}.`;
      return "Stelle zuerst die e-Potenz frei, dann logarithmiere: e<sup>kx</sup> = r ⟺ kx = ln r.";
    },
    tipps: ["Bring alles außer der e-Potenz auf die andere Seite und teile durch den Vorfaktor.", `${eh(kx(k))} = ${rT} ⟺ ${kx(k)} = ln ${glatt(r, 4) ? num(r) : `(${rT})`}`],
    musterloesungHtml: (b === 0 ? "" : `${ae(a, k)} = ${num(c)} ${plusMinus(-b)} = ${num(c - b)}<br>`) +
      `${eh(kx(k))} = ${rT}<br>${kx(k)} = ln ${glatt(r, 4) ? num(r) : `(${rT})`} ${zeichen(Math.log(r))} ${num(Math.log(r))}<br>` +
      `x = ${durchK(`ln ${glatt(r, 4) ? num(r) : `(${rT})`}`, k)} ≈ <strong>${num(soll)}</strong><br>` +
      `<strong>Probe:</strong> ${num(a)} · ${eh(`${numK(k)} · ${numK(r4(soll))}`)}${b === 0 ? "" : " " + plusMinus(b)} ${probe(a * Math.exp(k * r4(soll)) + b, c)}`,
  };
}

// ---------- E3: sin und cos an besonderen Stellen (LK) ----------
// Damit das Ergebnis glatt bleibt: a sin x + b cos x an Vielfachen von π/2, a sin x allein an
// Vielfachen von π/3, b cos x allein an π/6 + Vielfachen von π/3. Bei b = 0 ist „Vorzeichen bei
// (cos x)′ vergessen“ kein Fehler — NaN.
const WERTE_PI = {
  "0": ["0", "1"], "π/2": ["1", "0"], "π": ["0", "−1"], "3π/2": ["−1", "0"],
  "π/3": ["√3/2", "1/2"], "2π/3": ["√3/2", "−1/2"], "4π/3": ["−√3/2", "−1/2"], "5π/3": ["−√3/2", "1/2"],
  "π/6": ["1/2", "√3/2"], "5π/6": ["1/2", "−√3/2"], "7π/6": ["−1/2", "−√3/2"], "11π/6": ["−1/2", "√3/2"],
};
const piText = (t) => (t.includes("/") ? bruch(...t.split("/")) : t);
const piWert = (t) => { const [z, n] = t.split("/"); const zz = z === "0" ? 0 : z === "π" ? 1 : Number(z.replace("π", "")); return (zz * Math.PI) / (n ? Number(n) : 1); };
const E3_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const a of [1, 2, 3, -2, 4]) for (const b of [1, 2, -1, -3, 5]) for (const t of ["0", "π/2", "π", "3π/2"]) out.push({ a, b, t });
  for (const a of [2, 4, 6, -2, -4, 3, 5]) for (const t of ["π/3", "2π/3", "4π/3", "5π/3"]) out.push({ a, b: 0, t });
  for (const b of [2, 4, 6, -2, -4, 3, 5]) for (const t of ["π/6", "5π/6", "7π/6", "11π/6"]) out.push({ a: 0, b, t });
  return out.map((w) => {
    const x0 = piWert(w.t), s = Math.sin(x0), c = Math.cos(x0);
    return { ...w, x0, soll: sauber(w.a * c - w.b * s), plus: w.b === 0 ? NaN : sauber(w.a * c + w.b * s), fx: sauber(w.a * s + w.b * c) };
  });
});
function generateE3() {
  const v = ohneKollision(E3_KANDIDATEN(), (w) => [w.soll, w.plus, w.fx], EPS);
  const { a, b, t, soll, plus, fx } = v;
  const fT = poly([[a, "sin x"], [b, "cos x"]]), dT = poly([[a, "cos x"], [-b, "sin x"]]);
  const [sT, cT] = WERTE_PI[t].map((z) => (z.includes("/") ? (z.startsWith("−") ? "−" : "") + bruch(...z.replace("−", "").split("/")) : z));
  const stelle = piText(t);
  // Eingesetzt: „2 · (−1) − 3 · 0“ — jeder Wert mit Klammer, wenn er ein Minus trägt.
  const kl = (z) => (z.startsWith("−") ? `(${z})` : z);
  const eingesetzt = [a !== 0 ? `${num(a)} · ${kl(cT)}` : "", b !== 0 ? `${a !== 0 ? (b > 0 ? "− " : "+ ") : b > 0 ? "−" : ""}${num(Math.abs(b))} · ${kl(sT)}` : ""].filter(Boolean).join(" ");
  return {
    promptHtml: `Gegeben ist f(x) = ${fT} (x im Bogenmaß).<br><strong>Berechne f′(${stelle}).</strong>` + ZAHL,
    correct: soll,
    tolerance: TOL,
    placeholder: "f′(x₀)",
    hinweis: (roh, val) => {
      if (nahe(val, plus, TOL)) return "(cos x)′ = −sin x — das Minuszeichen fehlt.";
      if (nahe(val, fx, TOL)) return `Das ist f(${stelle}) — erst ableiten: (sin x)′ = cos x, (cos x)′ = −sin x.`;
      if (nahe(val, -soll, TOL)) return "Beide Vorzeichen sind vertauscht: (sin x)′ = +cos x und (cos x)′ = −sin x.";
      return `f′(x) = ${dT}. Setze die Werte von sin und cos an der Stelle ${stelle} ein.`;
    },
    tipps: [`f′(x) = ${dT}`, `sin(${stelle}) = ${sT}, cos(${stelle}) = ${cT}`],
    musterloesungHtml: `f′(x) = ${dT}<br>sin(${stelle}) = ${sT}, cos(${stelle}) = ${cT}<br>` +
      `f′(${stelle}) = ${eingesetzt} = <strong>${num(soll)}</strong>`,
  };
}

// ---------- E4: Wachstums- und Zerfallsrate ----------
const E4_VORGAENGE = [
  { name: "N", a: [100, 200, 500, 1000], k: [0.1, 0.2, 0.3, 0.4], einheit: "h", rate: "Bakterien pro Stunde",
    text: (N0, k) => `Eine Bakterienkultur wächst nach N(t) = ${num(N0)} · ${eh(kx(k, "t"))} (t in Stunden).`, frage: (t1) => `Mit welcher Geschwindigkeit wächst sie nach ${num(t1)} Stunden?` },
  { name: "m", a: [50, 80, 120, 200], k: [-0.05, -0.1, -0.2], einheit: "Tagen", rate: "mg pro Tag",
    text: (N0, k) => `Die Masse eines radioaktiven Stoffes ist m(t) = ${num(N0)} · ${eh(kx(k, "t"))} (m in mg, t in Tagen).`, frage: (t1) => `Wie groß ist die momentane Änderungsrate der Masse nach ${num(t1)} Tagen?` },
];
const E4_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const [i, V] of E4_VORGAENGE.entries()) for (const N0 of V.a) for (const k of V.k) for (const t1 of [1, 2, 3, 5, 10]) {
    out.push({ i, N0, k, t1, soll: N0 * k * Math.exp(k * t1), bestand: N0 * Math.exp(k * t1), anfang: N0 * k });
  }
  return out;
});
function generateE4() {
  const v = ohneKollision(E4_KANDIDATEN(), (w) => [w.soll, w.bestand, w.anfang], EPS);
  const { i, N0, k, t1, soll, bestand, anfang } = v;
  const V = E4_VORGAENGE[i], n = V.name;
  return {
    promptHtml: `${V.text(N0, k)}<br><strong>${V.frage(t1)}</strong> Gib ${n}′(${num(t1)}) in ${V.rate} an.` + GERUNDET,
    correct: soll,
    tolerance: TOL,
    placeholder: `${n}′(${num(t1)})`,
    hinweis: (roh, val) => {
      if (nahe(val, bestand, TOL)) return `Das ist der Bestand ${n}(${num(t1)}), nicht seine Änderungsrate. Leite ab: ${n}′(t) = k · ${n}(t).`;
      if (nahe(val, anfang, TOL)) return `Das ist die Rate zu Beginn, ${n}′(0). Setze t = ${num(t1)} ein.`;
      if (nahe(val, -soll, TOL)) return `Vorzeichen: k = ${num(k)} gehört mit seinem Vorzeichen in die Ableitung.`;
      return `${n}′(t) = ${num(N0)} · ${numK(k)} · ${eh(kx(k, "t"))} = ${ae(N0 * k, k, "t")}.`;
    },
    tipps: [`(a · e<sup>kt</sup>)′ = a · k · e<sup>kt</sup>`, `${n}′(t) = ${ae(N0 * k, k, "t")}`],
    musterloesungHtml: `${n}′(t) = ${num(N0)} · ${numK(k)} · ${eh(kx(k, "t"))} = ${ae(N0 * k, k, "t")}<br>` +
      `${n}′(${num(t1)}) = ${num(N0 * k)} · ${eh(num(k * t1))} ≈ <strong>${num(soll)}</strong> ${V.rate}<br>` +
      `Zum Vergleich: ${n}(${num(t1)}) ≈ ${num(bestand)}, und ${n}′(${num(t1)}) : ${n}(${num(t1)}) = ${num(k)} — die Rate ist ${num(Math.abs(k) * 100)} % des Bestands${k < 0 ? ", mit negativem Vorzeichen, weil die Masse abnimmt" : ""}.`,
  };
}

// ---------- E5: waagerechte Tangente bei (x + b) · e^(kx) ----------
// f′(x) = (1 + k(x + b)) · e^(kx) = 0 ⟹ x = −b − 1/k. Fehlerbilder: Nullstelle von f (−b), falsches
// Vorzeichen (−b + 1/k), k statt 1/k (bei k = ±1 dasselbe — NaN).
const E5_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const k of [1, -1, 2, -2, 0.5, -0.5, 0.25, -0.25]) for (const b of [-3, -2, -1, 0, 1, 2, 3]) {
    const soll = -b - 1 / k;
    out.push({ k, b, soll, null_: -b, vz: -b + 1 / k, kStatt: Math.abs(k) === 1 ? NaN : -b - k });
  }
  return out;
});
function generateE5() {
  const v = ohneKollision(E5_KANDIDATEN(), (w) => [w.soll, w.null_, w.vz, w.kStatt], EPS);
  const { k, b, soll, null_, vz, kStatt } = v;
  const fT = `${b === 0 ? "x" : `(${linear(1, b)})`} · ${eh(kx(k))}`;
  const klammer = poly([[k, "x"], [1 + k * b, ""]]);
  return {
    promptHtml: `Gegeben ist f(x) = ${fT}.<br><strong>An welcher Stelle hat der Graph von f eine waagerechte Tangente?</strong>` + ZAHL,
    correct: soll,
    tolerance: TOL,
    placeholder: "x",
    hinweis: (roh, val) => {
      if (nahe(val, null_, TOL)) return `Dort ist f selbst null, nicht f′. Gesucht ist die Nullstelle der Ableitung.`;
      if (nahe(val, vz, TOL)) return "Vorzeichenfehler beim Auflösen — mach die Probe, indem du deine Stelle in die Klammer von f′ einsetzt.";
      if (nahe(val, kStatt, TOL)) return `Beim Auflösen von ${klammer} = 0 wird durch k = ${num(k)} geteilt, nicht mit k multipliziert.`;
      return `Produktregel: f′(x) = 1 · ${eh(kx(k))} + ${b === 0 ? "x" : `(${linear(1, b)})`} · ${aeK(k, k)}. Klammere ${eh(kx(k))} aus.`;
    },
    tipps: [`Produktregel mit u = ${linear(1, b)} und v = ${eh(kx(k))}; v′ = ${ae(k, k)}.`, `f′(x) = (${klammer}) · ${eh(kx(k))}, und ${eh(kx(k))} ist nie null.`],
    musterloesungHtml: `f′(x) = 1 · ${eh(kx(k))} + ${b === 0 ? "x" : `(${linear(1, b)})`} · ${aeK(k, k)} = (${klammer}) · ${eh(kx(k))}<br>` +
      `${eh(kx(k))} &gt; 0, also f′(x) = 0 ⟺ ${klammer} = 0 ⟺ <strong>x = ${num(soll)}</strong><br>` +
      `<strong>Probe:</strong> ${num(k)} · ${numK(soll)} ${plusMinus(1 + k * b)} = ${num(k * soll + 1 + k * b)} ✓`,
  };
}

// ================= Ableitungsfunktionen bestimmen (Termeingabe, je Stufe eine) =================
// Die Funktionen setzen sich aus Gliedern zusammen, die ihre Ableitung exakt kennen
// (mathematik/terme.js) — so gibt es beliebig viele, und die Musterlösung entsteht aus denselben
// Gliedern wie die Angabe. Gewürfelt wird konstruktiv aus festen Listen.
const bereich = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const KOEFF = [-6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6];
const KLEIN = [-3, -2, -1, 1, 2, 3];
const K_EXP = [1, 2, 3, -1, -2, q(1, 2), q(-1, 2), 4];
// Eine e-Funktion a · e^(kx + n); n nur manchmal, damit e^(x + 2) = e² · e^x auch vorkommt.
const eGlied = (Pl) => efunktion(Pl, { m: zufall(K_EXP), n: zufall([0, 0, 0, 1, -1, 2]) });

// einfach: a · e^(kx + n) und ein Polynomglied — nur die Regel aus Abschnitt 2.
function generateE6() {
  const gl = [eGlied([pot(zufall([1, 2, 3, 4, -1, -2, -3, q(1, 2)]), 0)]), pot(zufall(KOEFF), zufall([1, 2, 3]))];
  if (zufall([true, false])) gl.push(pot(zufall(KOEFF), 0));
  return ableitungsAufgabe(mische(gl));
}
// mittel: Polynom mal e-Funktion — Produktregel und Ausklammern.
function generateM6() {
  const grad = zufall([1, 1, 2]);
  const P = [pot(zufall(KLEIN), grad), ...(zufall([true, true, false]) ? [pot(zufall(KOEFF), zufall(bereich(0, grad - 1)))] : [])];
  const gl = [efunktion(P, { m: zufall([1, -1, 2, -2, q(1, 2), q(-1, 2), 3]) })];
  return ableitungsAufgabe(zufall([true, false]) ? [...gl, pot(zufall(KOEFF), zufall([1, 2]))] : gl);
}
// schwierig (LK): Kettenregel — lineare und nichtlineare innere Funktionen mit Potenz, sin/cos,
// e und ln. ln nur mit positivem Argument, geprüft wird für x > 0.
function generateS6() {
  const verkettet = [
    kette(zufall([1, 2, 3, -1, -2]), zufall([2, 3, 4]), zufall([1, 2, 3]), zufall([2, 3, 4, 5, -1, -2, q(1, 2)])),
    trig(zufall(KLEIN), zufall(["sin", "cos"]), zufall([2, 3, 4, q(1, 2)]), zufall([0, 0, 1])),
    // Bei x³ im Exponenten nur kleine positive Faktoren: e^(2x³) wäre an der Prüfstelle 2,45 schon
    // e²⁹ ≈ 4 · 10¹², und ein vergessenes „+ 3“ ginge in der Rundung unter.
    zufall([true, false])
      ? efunktion([pot(zufall([1, 2, 3, -1, -2]), 0)], { m: zufall([1, -1, 2, -2, q(1, 2), q(-1, 2)]), r: 2 })
      : efunktion([pot(zufall([1, 2, 3, -1, -2]), 0)], { m: zufall([-1, -2, q(1, 2), q(-1, 2)]), r: 3 }),
    lnGlied(zufall([1, 2, 3, -1]), { m: zufall([1, 2, 3]), r: zufall([1, 2]), n: zufall([1, 2, 3, 4]) }),
    verkettung(zufall([1, 2, 3, -1, -2]), zufall([1, 2]), zufall([2, 3]), zufall([1, 2, 3]), zufall([2, 3, q(1, 2), -1])),
  ];
  return ableitungsAufgabe([...mische(verkettet).slice(0, zufall([1, 2])), pot(zufall(KOEFF), zufall([1, 2, 3]))]);
}
// komplex (LK): Produkt-, Ketten- und Quotientenregel gemischt — x · ln x, e^(−x) · sin(2x), x · e^(−x²),
// x/(x² + 1), x² · sin(3x), sin²(x), (x² − 1)².
function generateK6() {
  const art = zufall(["eTrig", "eGauss", "lnProdukt", "quotient", "produkt", "trigPotenz", "innenPoly"]);
  let g;
  if (art === "eTrig") {
    const b = zufall([1, 2, 3]), fn = zufall(["S", "C"]);
    g = efunktion([], { m: zufall([1, -1, 2, -2, q(-1, 2)]) }, { [fn]: [pot(zufall([1, 2, 3, -1, -2]), 0)], b });
  } else if (art === "eGauss") {
    g = efunktion([pot(zufall([1, 2, -1, 3]), zufall([0, 1, 1]))], { m: zufall([-1, -2, q(-1, 2), 1]), r: 2 });
  } else if (art === "lnProdukt") {
    g = lnGlied(zufall([1, 2, 3, -1, -2]), { p: zufall([1, 2]), m: zufall([1, 2, 3]) });
  } else if (art === "quotient") {
    g = verkettung(zufall([1, 2, 3, -1, -2]), 1, 2, zufall([1, 2, 3, 4]), zufall([-1, -2]), { p: zufall([0, 1, 1]) });
  } else if (art === "produkt") {
    g = prod(zufall([1, 2, 3, -1, -2]), zufall([1, 2, 3]), zufall([trig(1, zufall(["sin", "cos"]), zufall([1, 2, 3])), kette(1, zufall([2, 3]), zufall([1, 2]), zufall([2, 3]))]));
  } else if (art === "trigPotenz") {
    const s = zufall([2, 3]), k = zufall(KLEIN), b = zufall([1, 2]);
    g = zufall([trigPotenz(k, s, 0, b), trigPotenz(k, 0, s, b), trigPotenz(k, 1, 1, b)]);
  } else {
    g = verkettung(zufall([1, 2, 3, -1, -2]), zufall([1, 2]), zufall([2, 3]), zufall([1, 2, 3, -1, -2, -3]), zufall([2, 3, 4]));
  }
  return ableitungsAufgabe(zufall([true, false]) ? mische([g, pot(zufall(KOEFF), zufall([1, 2, 3]))]) : [g]);
}

// ================= mittel =================

// ---------- M1: Tangente im Schnittpunkt mit der y-Achse ----------
// f(x) = a · e^(kx) + d · x + c: t(x) = (ak + d) · x + (a + c). Fehlerbilder: k vergessen (bei k = 1
// keiner — NaN), d · x vergessen (bei d = 0 keiner), e⁰ = 0 statt 1, c vergessen (bei c = 0 keiner).
const M1_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const a of [1, 2, 3, -1, -2, 4]) for (const k of [2, 3, -1, -2, 0.5, -0.5]) for (const d of [0, 1, -2, 3]) for (const c of [0, 1, -3, 2, 5]) {
    out.push({ a, k, d, c, m: a * k + d, b: a + c });
  }
  return out;
});
function generateM1() {
  const v = ohneFeldKollision(M1_KANDIDATEN(), (w) => [[w.m, w.k === 1 ? NaN : w.a + w.d, w.d === 0 ? NaN : w.a * w.k], [w.b, w.c, w.c === 0 ? NaN : w.a]], EPS);
  const { a, k, d, c, m, b } = v;
  const fT = poly([[a, eh(kx(k))], [d, "x"], [c, ""]]);
  return {
    promptHtml: `Gegeben ist f(x) = ${fT}.<br><strong>Bestimme die Tangente an den Graphen von f in seinem Schnittpunkt mit der y-Achse</strong> in der Form t(x) = m · x + b.` + ZAHL,
    felder: [
      { name: "m =", soll: m, toleranz: TOL, hinweis: (roh, z) => (k !== 1 && nahe(z, a + d, TOL) ? `Der Faktor k fehlt: (${ae(a, k)})′ = ${ae(a * k, k)}.` : d !== 0 && nahe(z, a * k, TOL) ? `Der Summand ${glied(d, "x", false)} hat die Ableitung ${num(d)} — er fehlt.` : "m = f′(0).") },
      { name: "b =", soll: b, toleranz: TOL, hinweis: (roh, z) => (nahe(z, c, TOL) ? "e⁰ = 1, nicht 0 — jede e-Funktion geht durch (0 | 1)." : c !== 0 && nahe(z, a, TOL) ? `Der konstante Summand ${num(c)} gehört zu f(0) dazu.` : "Der Berührpunkt liegt auf der y-Achse, also ist b = f(0).") },
    ],
    tipps: [`Der Schnittpunkt mit der y-Achse ist (0 | f(0)) — dort ist der y-Achsenabschnitt der Tangente gerade f(0).`, `f′(x) = ${poly([[a * k, eh(kx(k))], [d, ""]])}`],
    musterloesungHtml: `f(0) = ${num(a)} · e⁰${d === 0 ? "" : ` ${plusMinus(d)} · 0`}${c === 0 ? "" : ` ${plusMinus(c)}`} = ${num(b)}<br>` +
      `f′(x) = ${poly([[a * k, eh(kx(k))], [d, ""]])}, also f′(0) = ${num(a * k)} · 1${d === 0 ? "" : ` ${plusMinus(d)}`} = ${num(m)}<br>` +
      `<strong>t(x) = ${poly([[m, "x"], [b, ""]])}</strong> — m = ${num(m)}, b = ${num(b)}`,
  };
}

// ---------- M2: Produktregel und Ausklammern ----------
// f(x) = (ax + b) · e^(kx) ⟹ f′(x) = (ka · x + a + kb) · e^(kx). Fehlerbilder für p: 0 (faktorweise
// oder nur u′ · v), a (k vergessen); für q: a · k (faktorweise), k · b (nur u · v′), a + b (k vergessen).
const M2_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const a of [1, 2, 3, -1, -2]) for (const b of [-3, -2, -1, 1, 2, 4]) for (const k of [2, 3, -1, -2, 0.5, -3]) {
    out.push({ a, b, k, p: k * a, qq: a + k * b });
  }
  return out;
});
function generateM2() {
  const v = ohneFeldKollision(M2_KANDIDATEN(), (w) => [[w.p, 0, w.a], [w.qq, w.a * w.k, w.k * w.b, w.a + w.b]], EPS);
  const { a, b, k, p, qq } = v;
  const uT = linear(a, b), e = eh(kx(k));
  return {
    promptHtml: `Gegeben ist f(x) = (${uT}) · ${e}.<br><strong>Bestimme f′(x) in der Form f′(x) = (p · x + q) · ${e}.</strong> Gib p und q an.` + ZAHL,
    felder: [
      { name: "p =", soll: p, toleranz: TOL, hinweis: (roh, z) => (nahe(z, 0, TOL) ? `Ohne x in der Klammer fehlt der Summand u · v′ = (${uT}) · ${aeK(k, k)} — Produktregel: u′ · v + u · v′.` : nahe(z, a, TOL) ? `(${e})′ = ${ae(k, k)} — der Faktor k fehlt.` : "p ist der Faktor vor x, wenn du die Klammer zusammenfasst.") },
      { name: "q =", soll: qq, toleranz: TOL, hinweis: (roh, z) => (nahe(z, a * k, TOL) ? "Das ist u′ · v′ — ein Produkt wird nicht faktorweise abgeleitet." : nahe(z, k * b, TOL) ? `Der Summand u′ · v = ${num(a)} · ${e} fehlt.` : nahe(z, a + b, TOL) ? `(${e})′ = ${ae(k, k)} — der Faktor k fehlt.` : "q ist der Summand ohne x in der zusammengefassten Klammer.") },
    ],
    tipps: [`u = ${uT}, u′ = ${num(a)}; v = ${e}, v′ = ${ae(k, k)}`, `f′(x) = ${num(a)} · ${e} + (${uT}) · ${aeK(k, k)} — klammere ${e} aus.`],
    musterloesungHtml: `f′(x) = u′ · v + u · v′ = ${num(a)} · ${e} + (${uT}) · ${numK(k)} · ${e}<br>` +
      `= (${num(a)} ${plusMinus(k)} · (${uT})) · ${e} = (${poly([[p, "x"], [qq, ""]])}) · ${e}<br><strong>p = ${num(p)}, q = ${num(qq)}</strong>`,
  };
}

// ---------- M3: Kettenregel (LK) ----------
const M3_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const a of [2, 3, -1, -2, 0.5]) for (const b of [-3, -1, 1, 2, 3]) for (const n of [2, 3, 4, 5]) for (const x0 of [-1, 0, 1, 2]) {
    const u = a * x0 + b, soll = n * a * u ** (n - 1);
    if (Math.abs(soll) <= 2000 && glatt(soll, 4)) out.push({ a, b, n, x0, u, soll });
  }
  return out;
});
function generateM3() {
  const k = ohneKollision(M3_KANDIDATEN(), (v) => [v.soll, v.n * v.u ** (v.n - 1), v.u ** v.n, v.n * v.a * v.u ** v.n], EPS);
  const { a, b, n, x0, u, soll } = k;
  const innen = linear(a, b);
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

// ---------- M4: Quotientenregel (LK) ----------
// Zwei Formen: (ax + b) : (cx + d) und ax : (x² + c). Fehlerbilder: Zähler in falscher Reihenfolge
// (−soll), Nenner nicht quadriert, u′ : v′. Bei soll = 0 fiele −soll mit soll zusammen — solche
// Kandidaten siebt ohneKollision heraus.
const M4_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const a of [1, 2, 3, -1, -2]) for (const b of [-3, -1, 1, 2, 4]) for (const c of [1, 2, -1]) for (const d of [-2, 1, 3, 2]) for (const x0 of [-1, 0, 1, 2, 3]) {
    const v = c * x0 + d, z = a * d - b * c;
    if (v === 0 || z === 0) continue;
    const soll = z / (v * v);
    if (glatt(soll, 4)) out.push({ form: "linear", a, b, c, d, x0, soll, ohneQuadrat: z / v, faktorweise: a / c, u: a * x0 + b, v, du: a, dv: c });
  }
  for (const a of [1, 2, 3, 4, -2]) for (const c of [1, 2, 3, 4]) for (const x0 of [-2, -1, 1, 2, 3]) {
    const v = x0 * x0 + c, soll = (a * (c - x0 * x0)) / (v * v);
    if (glatt(soll, 4)) out.push({ form: "quadrat", a, c, x0, soll, ohneQuadrat: (a * (c - x0 * x0)) / v, faktorweise: a / (2 * x0), u: a * x0, v, du: a, dv: 2 * x0 });
  }
  return out;
});
function generateM4() {
  const w = ohneKollision(M4_KANDIDATEN(), (k) => [k.soll, -k.soll, k.ohneQuadrat, k.faktorweise], EPS);
  const { form, x0, soll, u, v, du, dv } = w;
  const uT = form === "linear" ? linear(w.a, w.b) : glied(w.a, "x", false);
  const vT = form === "linear" ? linear(w.c, w.d) : poly([[1, "x²"], [w.c, ""]]);
  const duT = num(w.a), dvT = form === "linear" ? num(w.c) : "2x";
  return {
    promptHtml: `Gegeben ist f(x) = ${bruch(uT, vT)}.<br><strong>Berechne f′(${num(x0)}) mit der Quotientenregel.</strong>` + ZAHL,
    correct: soll,
    tolerance: TOL,
    placeholder: "f′(x₀)",
    hinweis: (roh, val) => {
      if (nahe(val, -soll, TOL)) return "Reihenfolge im Zähler: u′ · v − u · v′, nicht u · v′ − u′ · v.";
      if (nahe(val, w.ohneQuadrat, TOL)) return "Der Nenner ist v², nicht v.";
      if (nahe(val, w.faktorweise, TOL)) return "Ein Quotient wird nicht faktorweise abgeleitet: (u : v)′ ist nicht u′ : v′.";
      return `f′(x) = ${bruch("u′ · v − u · v′", "v²")} mit u = ${uT}, v = ${vT}.`;
    },
    tipps: [`u = ${uT}, u′ = ${duT}; v = ${vT}, v′ = ${dvT}`, `An der Stelle ${num(x0)}: u = ${num(u)}, u′ = ${num(du)}, v = ${num(v)}, v′ = ${num(dv)}`],
    musterloesungHtml: `u = ${uT}, u′ = ${duT}; v = ${vT}, v′ = ${dvT}<br>` +
      `f′(${num(x0)}) = ${bruch(`${numK(du)} · ${numK(v)} − ${numK(u)} · ${numK(dv)}`, `${numK(v)}²`)} = ${bruch(num(du * v - u * dv), num(v * v))} = <strong>${num(soll)}</strong>`,
  };
}

// ---------- M5: Stelle mit vorgegebener Steigung ----------
// f(x) = a · e^(kx), f′(x) = m ⟹ x = ln(m : (ak)) : k. Fehlerbilder: k beim Ableiten vergessen,
// mit k multipliziert statt geteilt (bei |k| = 1 dasselbe — NaN), gar nicht durch k geteilt (bei
// k = 1 kein Fehler — NaN).
const M5_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const a of [1, 2, 3, 0.5, 4]) for (const k of [2, 3, 0.5, -1, -2, -0.5]) for (const mb of [1, 3, 5, 10, 12, 20]) {
    const m = Math.sign(a * k) * mb, r = m / (a * k);
    if (Math.abs(r - 1) < 1e-9) continue;
    out.push({ a, k, m, r, soll: Math.log(r) / k });
  }
  return out;
});
function m5Fehler(w) {
  return {
    ohneK: lnSicher(w.m / w.a) / w.k,
    mal: Math.abs(w.k) === 1 ? NaN : Math.log(w.r) * w.k,
    nichtGeteilt: w.k === 1 ? NaN : Math.log(w.r),
  };
}
function generateM5() {
  const v = ohneKollision(M5_KANDIDATEN(), (w) => [w.soll, ...Object.values(m5Fehler(w))], EPS);
  const { a, k, m, r, soll } = v;
  const F = m5Fehler(v);
  const rT = glatt(r, 4) ? num(r) : bruch(num(m), num(a * k));
  return {
    promptHtml: `Gegeben ist f(x) = ${ae(a, k)}.<br><strong>An welcher Stelle hat der Graph von f die Steigung ${num(m)}?</strong>` + GERUNDET,
    correct: soll,
    tolerance: TOL,
    placeholder: "x",
    hinweis: (roh, val) => {
      if (nahe(val, F.ohneK, TOL)) return `Gesucht ist f′(x) = ${num(m)}, und f′(x) = ${ae(a * k, k)} — der Faktor k fehlt beim Ableiten.`;
      if (nahe(val, F.mal, TOL)) return `Aus ${kx(k)} = ln(…) folgt x = ln(…) : ${numK(k)} — teilen, nicht multiplizieren.`;
      if (nahe(val, F.nichtGeteilt, TOL)) return `Das ist ${kx(k)}, nicht x — teile noch durch ${numK(k)}.`;
      return `Löse f′(x) = ${ae(a * k, k)} = ${num(m)} nach x auf.`;
    },
    tipps: [`f′(x) = ${ae(a * k, k)}`, `${ae(a * k, k)} = ${num(m)} ⟺ ${eh(kx(k))} = ${rT}`],
    musterloesungHtml: `f′(x) = ${ae(a * k, k)} = ${num(m)} ⟹ ${eh(kx(k))} = ${rT} ⟹ ${kx(k)} = ln ${glatt(r, 4) ? num(r) : `(${rT})`} ⟹ x = ${durchK(`ln ${glatt(r, 4) ? num(r) : `(${rT})`}`, k)} ≈ <strong>${num(soll)}</strong><br>` +
      `<strong>Probe:</strong> f′(${num(r4(soll))}) = ${num(a * k)} · ${eh(`${numK(k)} · ${numK(r4(soll))}`)} ${probe(a * k * Math.exp(k * r4(soll)), m)}`,
  };
}

// ================= schwierig =================

// ---------- S1: Extrempunkt von (ax + b) · e^(kx) ----------
// f′(x) = (ka · x + a + kb) · e^(kx) = 0 ⟹ x = −1/k − b/a; y = (ax + b) · e^(kx) = −a/k · e^(kx).
// Fehlerbilder: Nullstelle von f statt f′, falsches Vorzeichen, den e-Faktor im y-Wert vergessen
// (bei x = 0 ist er 1 — dann kein Fehler, NaN).
const S1_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const a of [1, 2, -1, -2]) for (const b of [-4, -3, -2, -1, 1, 2, 3, 4]) for (const k of [1, -1, 2, -2, 0.5, -0.5]) {
    const x = -1 / k - b / a;
    if (!glatt(x, 4) || Math.abs(k * x) > 4) continue;
    out.push({ a, b, k, x, y: (-a / k) * Math.exp(k * x), typ: k * a < 0 ? "Hochpunkt" : "Tiefpunkt" });
  }
  return out;
});
function generateS1() {
  const v = ohneFeldKollision(S1_KANDIDATEN(), (w) => [[w.x, -w.b / w.a, -w.b / w.a + 1 / w.k], [w.y, w.x === 0 ? NaN : -w.a / w.k]], EPS);
  const { a, b, k, x, y, typ } = v;
  const uT = linear(a, b), e = eh(kx(k)), klammer = poly([[k * a, "x"], [a + k * b, ""]]);
  return {
    promptHtml: `Gegeben ist f(x) = (${uT}) · ${e}.<br><strong>Bestimme die Koordinaten des Extrempunkts des Graphen.</strong>` + GERUNDET,
    felder: [
      { name: "x =", soll: x, toleranz: TOL, hinweis: (roh, z) => (nahe(z, -b / a, TOL) ? "Dort ist f null, nicht f′." : nahe(z, -b / a + 1 / k, TOL) ? "Vorzeichenfehler — setze deine Stelle zur Probe in die Klammer von f′ ein." : `f′(x) = (${klammer}) · ${e}; setze die Klammer null.`) },
      { name: "y =", soll: y, toleranz: TOL, hinweis: (roh, z) => (nahe(z, -a / k, TOL) ? `Das ist nur der Wert von ${uT} — der Faktor ${e} gehört zum Funktionswert dazu.` : "y = f(x) an der Extremstelle.") },
    ],
    tipps: [`Produktregel: f′(x) = ${num(a)} · ${e} + (${uT}) · ${aeK(k, k)} = (${klammer}) · ${e}`, `${e} ist nie null — nur die Klammer kann es sein.`],
    musterloesungHtml: `f′(x) = ${num(a)} · ${e} + (${uT}) · ${aeK(k, k)} = (${klammer}) · ${e}<br>` +
      `f′(x) = 0 ⟺ ${klammer} = 0 ⟺ <strong>x = ${num(x)}</strong>. Die Klammer ${k * a < 0 ? "fällt" : "steigt"} (Steigung ${num(k * a)}): f′ wechselt ${k * a < 0 ? "von + nach −" : "von − nach +"} — ein ${typ}.<br>` +
      `<strong>y</strong> = f(${num(x)}) = ${numK(a * x + b)} · ${eh(num(k * x))} ≈ <strong>${num(y)}</strong>`,
  };
}

// ---------- S2: sin x = c im Bereich 0 ≤ x < 2π (LK) ----------
// a · sin x + d = e mit c = (e − d) : a. Fehlerbilder: der Taschenrechnerwert sin⁻¹(c) selbst (bei
// c < 0 negativ), der Wert im Gradmaß, π + sin⁻¹(c) und 2π − sin⁻¹(c) als falsche „zweite Lösung“.
const S2_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const c of [-0.9, -0.8, -0.6, -0.4, -0.3, -0.2, -0.1, 0.1, 0.2, 0.3, 0.4, 0.6, 0.7, 0.9]) for (const a of [1, 2, 4, 5, -2, 10]) for (const d of [0, 1, -3, 2]) {
    const s = Math.asin(c), l = [s < 0 ? s + 2 * Math.PI : s, Math.PI - s].sort((p, qq) => p - qq);
    out.push({ c, a, d, e: a * c + d, s, x1: l[0], x2: l[1], grad: s * GRAD, pi: Math.PI + s, zweiPi: 2 * Math.PI - s });
  }
  return out;
});
function generateS2() {
  // Bei c > 0 ist sin⁻¹(c) selbst die erste Lösung — als Fehlerwert gilt es nur bei c < 0.
  const v = ohneFeldKollision(S2_KANDIDATEN(), (w) => [[w.x1, w.s < 0 ? w.s : NaN, w.grad], [w.x2, w.pi, w.zweiPi < 2 * Math.PI ? w.zweiPi : NaN, w.grad]], EPS);
  const { c, a, d, e, s, x1, x2 } = v;
  const gl = `${glied(a, "sin x", false)}${d === 0 ? "" : " " + plusMinus(d)} = ${num(e)}`;
  const hin = (wert) => (roh, z) => {
    if (nahe(z, v.grad, 0.01)) return "Das ist ein Winkel in Grad — gerechnet wird im Bogenmaß (Taschenrechner auf RAD).";
    if (nahe(z, s, TOL) && s < 0) return `sin⁻¹(${num(c)}) ist negativ und liegt nicht im Bereich 0 ≤ x &lt; 2π — addiere 2π.`;
    if (nahe(z, v.pi, TOL)) return "Die zweite Lösung ist π − sin⁻¹(c), nicht π + sin⁻¹(c) — die Sinuskurve ist symmetrisch zu x = π/2.";
    if (nahe(z, v.zweiPi, TOL)) return "2π − x gehört zur Symmetrie des Kosinus. Beim Sinus ist die zweite Lösung π − sin⁻¹(c).";
    return wert === 1 ? "x₁ ist die kleinere der beiden Lösungen im Bereich 0 ≤ x &lt; 2π." : "x₂ ist die größere der beiden Lösungen im Bereich 0 ≤ x &lt; 2π.";
  };
  return {
    promptHtml: `<strong>Bestimme alle Lösungen der Gleichung</strong> ${gl} im Bereich 0 ≤ x &lt; 2π (Bogenmaß).` + GERUNDET,
    felder: [
      { name: "x₁ =", soll: x1, toleranz: TOL, hinweis: hin(1) },
      { name: "x₂ =", soll: x2, toleranz: TOL, hinweis: hin(2) },
    ],
    tipps: [`Stelle nach sin x um: sin x = ${num(c)}.`, `Eine Lösung liefert sin⁻¹(${num(c)}) ≈ ${num(s)}; die zweite ist π − sin⁻¹(${num(c)}). Liegt eine Lösung unter 0, addiere 2π.`],
    musterloesungHtml: `${d === 0 ? "" : `${glied(a, "sin x", false)} = ${num(e - d)} ⟹ `}sin x = ${num(c)}<br>` +
      `sin⁻¹(${num(c)}) ≈ ${num(s)}${s < 0 ? ` — negativ, also plus 2π: ${num(s)} + 2π ≈ ${num(s + 2 * Math.PI)}` : ""}<br>` +
      `Zweite Lösung: π − sin⁻¹(${num(c)}) ≈ ${num(Math.PI - s)}<br>` +
      `<strong>x₁ ≈ ${num(x1)}, x₂ ≈ ${num(x2)}</strong>. <strong>Probe:</strong> sin(${num(x1)}) ≈ ${num(Math.sin(x1), 3)}, sin(${num(x2)}) ≈ ${num(Math.sin(x2), 3)} ✓`,
  };
}

// ---------- S3: Tangente an a · ln(cx) + d (LK) ----------
// f′(x) = a : x — die innere Ableitung c kürzt sich. m ist glatt, b enthält ln und wird gerundet.
// Fehlerbilder: a · c : x₀ (nicht gekürzt; bei c = 1 kein Fehler — NaN), a · x₀, f(x₀) als b.
const S3_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const a of [1, 2, 3, -1, -2, 4]) for (const c of [1, 2, 3, 0.5]) for (const d of [0, 1, -2, 3]) for (const x0 of [1, 2, 4, 0.5, 5]) {
    const m = a / x0, y0 = a * Math.log(c * x0) + d;
    if (!glatt(m, 4)) continue;
    out.push({ a, c, d, x0, m, y0, b: y0 - m * x0 });
  }
  return out;
});
function generateS3() {
  // Bei x₀ = 1 sind a : x₀ und a · x₀ dasselbe — dort ist die Verwechslung kein Fehler.
  const v = ohneFeldKollision(S3_KANDIDATEN(), (w) => [[w.m, w.c === 1 ? NaN : (w.a * w.c) / w.x0, w.x0 === 1 ? NaN : w.a * w.x0], [w.b, w.y0, w.y0 + w.m * w.x0]], EPS);
  const { a, c, d, x0, m, y0, b } = v;
  const arg = c === 1 ? "x" : `${num(c)}x`;
  const fT = `${faktor(a)}ln(${arg})${d === 0 ? "" : " " + plusMinus(d)}`;
  return {
    promptHtml: `Gegeben ist f(x) = ${fT} (x &gt; 0).<br><strong>Bestimme die Tangente an den Graphen im Punkt mit x₀ = ${num(x0)}</strong> in der Form t(x) = m · x + b.` + GERUNDET,
    felder: [
      { name: "m =", soll: m, toleranz: TOL, hinweis: (roh, z) => (c !== 1 && nahe(z, (a * c) / x0, TOL) ? `Kettenregel: (ln(${arg}))′ = ${bruch(num(c), arg)} = ${bruch("1", "x")} — die innere Ableitung kürzt sich.` : nahe(z, a * x0, TOL) ? `(ln x)′ = ${bruch("1", "x")}, also wird durch x₀ geteilt, nicht mit x₀ multipliziert.` : "m = f′(x₀).") },
      { name: "b =", soll: b, toleranz: TOL, hinweis: (roh, z) => (nahe(z, y0, TOL) ? "Das ist f(x₀), die y-Koordinate des Berührpunkts — nicht der Achsenabschnitt." : nahe(z, y0 + m * x0, TOL) ? "Vorzeichen: b = f(x₀) − m · x₀." : "b = f(x₀) − m · x₀.") },
    ],
    tipps: [`f′(x) = ${bruch(num(a), "x")}${c === 1 ? "" : ` — (ln(${arg}))′ = ${bruch(num(c), arg)} = ${bruch("1", "x")}`}`, `f(${num(x0)}) = ${faktor(a)}ln(${num(c * x0)})${d === 0 ? "" : " " + plusMinus(d)} ≈ ${num(y0)}`],
    musterloesungHtml: `f′(x) = ${bruch(num(a), "x")}, also <strong>m</strong> = f′(${num(x0)}) = ${bruch(num(a), num(x0))} = <strong>${num(m)}</strong><br>` +
      `f(${num(x0)}) = ${faktor(a)}ln(${num(c * x0)})${d === 0 ? "" : " " + plusMinus(d)} ${zeichen(y0)} ${num(y0)}<br>` +
      `<strong>b</strong> = f(x₀) − m · x₀ ${zeichen(b)} ${num(y0)} − ${numK(m)} · ${numK(x0)} ${zeichen(b)} <strong>${num(b)}</strong>`,
  };
}

// ---------- S4: Kettenregel und Tangente an √(ax + b) (LK) ----------
const S4_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const a of [1, 2, 3, 4, 6, 8, -2]) for (const k of [1, 2, 3, 4]) for (const x0 of [-2, -1, 0, 1, 2, 3, 4]) {
    const b = k * k - a * x0, m = a / (2 * k), n = k - m * x0;
    if (glatt(m, 4) && glatt(n, 4) && Math.abs(b) <= 20) out.push({ a, b, k, x0, m, n });
  }
  return out;
});
function generateS4() {
  const k = ohneFeldKollision(S4_KANDIDATEN(), (v) => [[v.m, v.a === 1 ? NaN : 1 / (2 * v.k)], [v.n, v.k]], EPS);
  const { a, b, k: w, x0, m, n } = k;
  const innen = linear(a, b);
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

// ---------- S5: Halbwertszeit und Abbaurate ----------
// m(t) = m₀ · e^(−kt) mit Halbwertszeit T: k = ln 2 : T, m′(T) = −k · m₀ : 2. Fehlerbilder für k:
// T : ln 2, ln 2 · T, 1 : (2T); für m′(T): die Rate zu Beginn, der Bestand, das Vorzeichen.
const S5_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const m0 of [80, 100, 200, 50, 500]) for (const T of [2, 4, 5, 8, 10, 20, 30]) {
    const k = Math.LN2 / T;
    out.push({ m0, T, k, rate: (-k * m0) / 2 });
  }
  return out;
});
function generateS5() {
  const v = ohneFeldKollision(S5_KANDIDATEN(), (w) => [[w.k, w.T / Math.LN2, Math.LN2 * w.T, 1 / (2 * w.T)], [w.rate, -w.k * w.m0, w.m0 / 2, -w.rate]], EPS);
  const { m0, T, k, rate } = v;
  return {
    promptHtml: `Ein Medikament wird im Körper abgebaut: Die Menge im Blut ist m(t) = ${num(m0)} · e<sup>−kt</sup> (m in mg, t in Stunden). Nach ${num(T)} Stunden ist nur noch die Hälfte da.<br>` +
      `<strong>Bestimme die Abbaukonstante k und die momentane Änderungsrate m′(${num(T)}) in mg pro Stunde.</strong>` + GERUNDET,
    felder: [
      { name: "k =", soll: k, toleranz: TOL, hinweis: (roh, z) => (nahe(z, T / Math.LN2, TOL) ? "Bruch umgedreht: k = ln 2 : T." : nahe(z, Math.LN2 * T, TOL) ? "Durch T teilen, nicht mit T multiplizieren." : nahe(z, 1 / (2 * T), TOL) ? "Halbieren ist nicht dasselbe wie „durch 2 teilen“ im Exponenten — setze m(T) = m₀ : 2 an und logarithmiere." : `Aus ${eh(`−k · ${num(T)}`)} = 0,5 folgt −k · ${num(T)} = ln 0,5 = −ln 2.`) },
      { name: `m′(${num(T)}) =`, soll: rate, toleranz: TOL, hinweis: (roh, z) => (nahe(z, -k * m0, TOL) ? `Das ist die Rate zu Beginn, m′(0). Zum Zeitpunkt ${num(T)} ist nur noch die Hälfte da — und die Rate auch nur halb so groß.` : nahe(z, m0 / 2, TOL) ? "Das ist die Menge, nicht ihre Änderungsrate." : nahe(z, -rate, TOL) ? "Die Menge nimmt ab — die Änderungsrate ist negativ." : "m′(t) = −k · m(t).") },
    ],
    tipps: [`m(${num(T)}) = ${num(m0 / 2)}: ${num(m0)} · ${eh(`−k · ${num(T)}`)} = ${num(m0 / 2)} ⟹ ${eh(`−${num(T)}k`)} = 0,5`, "m′(t) = −k · m₀ · e<sup>−kt</sup> = −k · m(t)"],
    musterloesungHtml: `${eh(`−${num(T)}k`)} = 0,5 ⟹ −${num(T)}k = ln 0,5 = −ln 2 ⟹ <strong>k</strong> = ${bruch("ln 2", num(T))} ≈ <strong>${num(k)}</strong><br>` +
      `m′(t) = −k · ${num(m0)} · e<sup>−kt</sup> = −k · m(t); m(${num(T)}) = ${num(m0 / 2)}<br>` +
      `<strong>m′(${num(T)})</strong> = −${bruch("ln 2", num(T))} · ${num(m0 / 2)} ≈ <strong>${num(rate)}</strong> mg pro Stunde`,
  };
}

// ================= komplex =================

// ---------- K1: Tangente von einem Punkt der x-Achse an a · e^(kx) ----------
// t(p) = 0 ⟺ a · e^(kx₀) · (1 + k(p − x₀)) = 0 ⟹ x₀ = p + 1/k. Fehlerbilder: p − 1/k, p + k (bei
// |k| = 1 dasselbe — NaN), 1/k (p vergessen; bei p = 0 kein Fehler — NaN); für m: k vergessen.
const K1_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const a of [1, 2, 0.5, 3]) for (const k of [1, 2, 0.5, -1, -0.5]) for (const p of [0, 1, -1, 2, -2]) {
    const x0 = p + 1 / k;
    if (Math.abs(k * x0) > 4) continue;
    out.push({ a, k, p, x0, m: a * k * Math.exp(k * x0) });
  }
  return out;
});
function generateK1() {
  const v = ohneFeldKollision(K1_KANDIDATEN(), (w) => [[w.x0, w.p - 1 / w.k, Math.abs(w.k) === 1 ? NaN : w.p + w.k, w.p === 0 ? NaN : 1 / w.k], [w.m, w.k === 1 ? NaN : w.a * Math.exp(w.k * w.x0)]], EPS);
  const { a, k, p, x0, m } = v;
  const P = p === 0 ? "dem Ursprung O(0 | 0)" : `dem Punkt P(${num(p)} | 0)`;
  return {
    promptHtml: `Gegeben ist f(x) = ${ae(a, k)}. Von ${P} aus wird eine Tangente an den Graphen von f gelegt.<br><strong>Bestimme die Berührstelle x₀ und die Steigung m der Tangente.</strong>` + GERUNDET,
    felder: [
      { name: "x₀ =", soll: x0, toleranz: TOL, hinweis: (roh, z) => (nahe(z, p - 1 / k, TOL) ? "Vorzeichenfehler — mach die Probe: t(p) muss 0 sein." : nahe(z, p + k, TOL) ? `Beim Auflösen wird durch k = ${num(k)} geteilt: x₀ − ${num(p)} = 1 : k.` : nahe(z, 1 / k, TOL) ? `Die Tangente soll durch (${num(p)} | 0) gehen, nicht durch den Ursprung.` : `Setze den Punkt in t(x) = f′(x₀) · (x − x₀) + f(x₀) ein und klammere ${eh(kx(k, "x₀"))} aus.`) },
      { name: "m =", soll: m, toleranz: TOL, hinweis: (roh, z) => (nahe(z, a * Math.exp(k * x0), TOL) ? `Das ist f(x₀). m = f′(x₀) = ${num(a * k)} · ${eh(kx(k, "x₀"))}.` : "m = f′(x₀).") },
    ],
    tipps: [`Tangente in x₀: t(x) = ${ae(a * k, k, "x₀")} · (x − x₀) + ${ae(a, k, "x₀")}`, `t(${num(p)}) = 0 ⟺ ${ae(a, k, "x₀")} · (${num(k)} · (${num(p)} − x₀) + 1) = 0`],
    musterloesungHtml: `t(x) = f′(x₀) · (x − x₀) + f(x₀) = ${ae(a, k, "x₀")} · (${num(k)}(x − x₀) + 1)<br>` +
      `t(${num(p)}) = 0: Da ${eh(kx(k, "x₀"))} &gt; 0, muss ${num(k)} · (${num(p)} − x₀) + 1 = 0 sein ⟹ ${num(p)} − x₀ = ${num(-1 / k)} ⟹ <strong>x₀ = ${num(x0)}</strong><br>` +
      `<strong>m</strong> = f′(${num(x0)}) = ${num(a * k)} · ${eh(num(k * x0))} ≈ <strong>${num(m)}</strong>`,
  };
}

// ---------- K2: gedämpfte Schwingung (LK) ----------
// f(t) = A · e^(−dt) · sin(ωt): f′(t) = A · e^(−dt) · (ω cos ωt − d sin ωt) = 0 ⟹ tan(ωt) = ω/d ⟹
// t₁ = tan⁻¹(ω/d) : ω. Fehlerbilder: π : (2ω) (ungedämpft), tan⁻¹(d/ω) : ω, nicht durch ω geteilt
// (bei ω = 1 kein Fehler — NaN); für f(t₁): die Dämpfung vergessen.
const K2_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const A of [2, 3, 4, 5, 10]) for (const d of [0.1, 0.2, 0.5, 1]) for (const w of [1, 2, 3]) {
    const t1 = Math.atan(w / d) / w;
    out.push({ A, d, w, t1, y: A * Math.exp(-d * t1) * Math.sin(w * t1) });
  }
  return out;
});
function generateK2() {
  const v = ohneFeldKollision(K2_KANDIDATEN(), (z) => [[z.t1, Math.PI / (2 * z.w), Math.atan(z.d / z.w) / z.w, z.w === 1 ? NaN : Math.atan(z.w / z.d)], [z.y, z.A * Math.sin(z.w * z.t1)]], EPS);
  const { A, d, w, t1, y } = v;
  const sinT = `sin(${kx(w, "t")})`, cosT = `cos(${kx(w, "t")})`;
  return {
    promptHtml: `Die Auslenkung eines gedämpft schwingenden Pendels ist s(t) = ${num(A)} · ${eh(kx(-d, "t"))} · ${sinT} (s in cm, t in s).<br>` +
      `<strong>Zu welchem Zeitpunkt t₁ &gt; 0 erreicht das Pendel seine erste größte Auslenkung, und wie groß ist sie?</strong>` + GERUNDET,
    felder: [
      { name: "t₁ =", soll: t1, toleranz: TOL, hinweis: (roh, z) => (nahe(z, Math.PI / (2 * w), TOL) ? `Das wäre das erste Maximum ohne Dämpfung (${sinT} = 1). Die Dämpfung verschiebt es nach links — setze s′(t) = 0.` : nahe(z, Math.atan(d / w) / w, TOL) ? `Bruch umgedreht: tan(${kx(w, "t")}) = ${bruch(num(w), num(d))}.` : nahe(z, Math.atan(w / d), TOL) ? `Das ist ${kx(w, "t")} — teile noch durch ${num(w)}.` : `s′(t) = ${num(A)} · ${eh(kx(-d, "t"))} · (${num(w)}${cosT} − ${num(d)}${sinT}); setze die Klammer null.`) },
      { name: "s(t₁) =", soll: y, toleranz: TOL, hinweis: (roh, z) => (nahe(z, A * Math.sin(w * t1), TOL) ? `Der Dämpfungsfaktor ${eh(kx(-d, "t"))} gehört dazu.` : "Setze t₁ in s(t) ein.") },
    ],
    tipps: [`Produktregel und Kettenregel: s′(t) = ${num(A)} · (−${num(d)})${eh(kx(-d, "t"))} · ${sinT} + ${num(A)} · ${eh(kx(-d, "t"))} · ${num(w)}${cosT}`, `Klammere ${num(A)}${eh(kx(-d, "t"))} aus; die Klammer ist null für tan(${kx(w, "t")}) = ${bruch(num(w), num(d))}.`],
    musterloesungHtml: `s′(t) = ${num(A)} · ${eh(kx(-d, "t"))} · (${num(w)}${cosT} − ${num(d)}${sinT})<br>` +
      `s′(t) = 0 ⟺ ${num(w)}${cosT} = ${num(d)}${sinT} ⟺ tan(${kx(w, "t")}) = ${bruch(num(w), num(d))} ⟹ ${kx(w, "t")} = tan⁻¹(${num(w / d)}) ≈ ${num(w * t1)}<br>` +
      `<strong>t₁</strong> ≈ ${w === 1 ? "" : `${num(w * t1)} : ${num(w)} ≈ `}<strong>${num(t1)}</strong> s; davor ist s′ positiv, danach negativ — ein Maximum.<br>` +
      `<strong>s(t₁)</strong> = ${num(A)} · ${eh(num(-d * t1))} · sin(${num(w * t1)}) ≈ <strong>${num(y)}</strong> cm — kleiner als ${num(A)} cm, weil die Dämpfung schon wirkt.`,
  };
}

// ---------- K3: Schnittwinkel von a · e^(kx) und b · e^(−kx) ----------
// Schnittstelle x_S = ln(b/a) : (2k), Höhe √(ab), Steigungen ±k√(ab). Der Schnittwinkel ist der
// Winkel zwischen den Tangenten: 2 · tan⁻¹(k√(ab)), über 90° davon 180° minus.
const K3_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const a of [1, 2, 3, 4, 0.5]) for (const b of [1, 2, 3, 4, 8, 0.5]) for (const k of [1, 0.5, 2]) {
    if (a === b) continue;
    const xS = Math.log(b / a) / (2 * k), s = k * Math.sqrt(a * b), roh = 2 * Math.atan(s) * GRAD;
    out.push({ a, b, k, xS, s, roh, gamma: roh <= 90 ? roh : 180 - roh });
  }
  return out;
});
function generateK3() {
  const v = ohneFeldKollision(K3_KANDIDATEN(), (w) => [[w.xS, Math.log(w.b / w.a) / w.k, -w.xS], [w.gamma, w.roh > 90 ? w.roh : NaN, Math.atan(w.s) * GRAD]], [EPS, 0.02]);
  const { a, b, k, xS, s, roh, gamma } = v;
  return {
    promptHtml: `Die Graphen von f(x) = ${ae(a, k)} und g(x) = ${ae(b, -k)} schneiden sich in einem Punkt S.<br><strong>Bestimme die Schnittstelle x<sub>S</sub> und den Schnittwinkel γ der beiden Graphen.</strong>` + WINKEL,
    felder: [
      { name: "x<sub>S</sub> =", soll: xS, toleranz: TOL, hinweis: (roh2, z) => (nahe(z, Math.log(b / a) / k, TOL) ? `${eh(kx(2 * k))} = ${bruch(num(b), num(a))} — beim Auflösen fehlt der Faktor 2.` : nahe(z, -xS, TOL) ? "Bruch umgedreht: Bring die e-Potenzen auf eine Seite und teile durch a." : `Setze f(x) = g(x) und multipliziere mit ${eh(kx(k))}.`) },
      { name: "γ =", soll: gamma, toleranz: TOL_WINKEL, hinweis: (roh2, z) => (roh > 90 && nahe(z, roh, 0.01) ? "Der Schnittwinkel ist der kleinere der beiden Winkel zwischen den Tangenten — höchstens 90°." : nahe(z, Math.atan(s) * GRAD, 0.01) ? "Das ist nur der Steigungswinkel von f. Der Schnittwinkel liegt zwischen beiden Tangenten — die von g fällt genauso steil." : "Berechne beide Steigungswinkel mit tan⁻¹ und bilde den Unterschied.") },
    ],
    tipps: [`${ae(a, k)} = ${ae(b, -k)} ⟺ ${eh(kx(2 * k))} = ${bruch(num(b), num(a))}`, `In S: f′(x<sub>S</sub>) = ${num(k)} · f(x<sub>S</sub>) und g′(x<sub>S</sub>) = −${num(k)} · g(x<sub>S</sub>), und f(x<sub>S</sub>) = g(x<sub>S</sub>).`],
    musterloesungHtml: `${ae(a, k)} = ${ae(b, -k)} ⟺ ${eh(kx(2 * k))} = ${bruch(num(b), num(a))} ⟹ <strong>x<sub>S</sub></strong> = ${bruch(`ln ${glatt(b / a, 4) ? num(b / a) : `(${bruch(num(b), num(a))})`}`, num(2 * k))} ≈ <strong>${num(xS)}</strong><br>` +
      `f(x<sub>S</sub>) = g(x<sub>S</sub>) = √(${num(a)} · ${num(b)}) ${zeichen(Math.sqrt(a * b))} ${num(Math.sqrt(a * b))}; Steigungen f′(x<sub>S</sub>) ${zeichen(s)} ${num(s)} und g′(x<sub>S</sub>) ${zeichen(s)} −${num(s)}<br>` +
      `Steigungswinkel: ±tan⁻¹(${num(s)}) ≈ ±${num(Math.atan(s) * GRAD, 2)}°; Unterschied ≈ ${num(roh, 2)}°${roh > 90 ? ` &gt; 90°, also γ = 180° − ${num(roh, 2)}°` : ""} ⟹ <strong>γ ≈ ${num(gamma, 2)}°</strong>`,
  };
}

// ---------- K4: Parameter aus der Extremstelle ----------
// f(x) = a · x · e^(kx) hat die Extremstelle −1/k. Gegeben x_E, gesucht k = −1/x_E und y_E = a · x_E · e⁻¹.
// Fehlerbilder: 1/x_E (Vorzeichen), −x_E (Kehrwert vergessen; bei |x_E| = 1 dasselbe — NaN); für y:
// e⁻¹ vergessen, e statt e⁻¹.
const K4_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const a of [1, 2, 3, -1, -2, 4]) for (const xE of [1, -1, 2, -2, 4, -4, 0.5, -0.5, 0.25, -0.25, 5, -5]) {
    const k = -1 / xE;
    if (!glatt(k, 4)) continue;
    out.push({ a, xE, k, y: a * xE * Math.exp(-1), typ: a * k < 0 ? "Hochpunkt" : "Tiefpunkt" });
  }
  return out;
});
function generateK4() {
  const v = ohneFeldKollision(K4_KANDIDATEN(), (w) => [[w.k, 1 / w.xE, Math.abs(w.xE) === 1 ? NaN : -w.xE], [w.y, w.a * w.xE, w.a * w.xE * Math.E]], EPS);
  const { a, xE, k, y, typ } = v;
  const fT = `${faktor(a)}x · ${eh("kx")}`;
  return {
    promptHtml: `Für jedes k ≠ 0 ist f(x) = ${fT} gegeben. Der Graph hat an der Stelle x = ${num(xE)} einen Extrempunkt.<br><strong>Bestimme k und die y-Koordinate dieses Extrempunkts.</strong>` + GERUNDET,
    felder: [
      { name: "k =", soll: k, toleranz: TOL, hinweis: (roh, z) => (nahe(z, 1 / xE, TOL) ? "Vorzeichen: Aus 1 + kx = 0 folgt k = −1 : x." : nahe(z, -xE, TOL) ? "Aus k · x = −1 folgt k = −1 : x — der Kehrwert fehlt." : `f′(x) = ${faktor(a)}(1 + kx) · ${eh("kx")}; setze x = ${num(xE)} und f′ = 0.`) },
      { name: "y =", soll: y, toleranz: TOL, hinweis: (roh, z) => (nahe(z, a * xE, TOL) ? `Der Faktor ${eh(`k · ${num(xE)}`)} = e<sup>−1</sup> gehört dazu.` : nahe(z, a * xE * Math.E, TOL) ? `k · x<sub>E</sub> = −1, also steht dort e<sup>−1</sup>, nicht e<sup>1</sup>.` : "y = f(x<sub>E</sub>) mit dem gefundenen k.") },
    ],
    tipps: [`Produktregel: f′(x) = ${poly([[a, eh("kx")], [a, `x · k${eh("kx")}`]])} = ${faktor(a)}(1 + kx) · ${eh("kx")}`, `An der Extremstelle ist 1 + k · ${numK(xE)} = 0.`],
    musterloesungHtml: `f′(x) = ${faktor(a)}(1 + kx) · ${eh("kx")}; ${eh("kx")} &gt; 0, also f′(${num(xE)}) = 0 ⟺ ${poly([[1, ""], [xE, "k"]])} = 0 ⟺ <strong>k = ${num(k)}</strong><br>` +
      `<strong>y</strong> = f(${num(xE)}) = ${num(a)} · ${numK(xE)} · ${eh(`${numK(k)} · ${numK(xE)}`)} = ${num(a * xE)} · e<sup>−1</sup> ≈ <strong>${num(y)}</strong><br>` +
      `Die Klammer ${faktor(a)}(${poly([[1, ""], [k, "x"]])}) ${a * k < 0 ? "fällt" : "steigt"}: f′ wechselt ${a * k < 0 ? "von + nach −" : "von − nach +"} — ein ${typ}.`,
  };
}

// ---------- K5: Abkühlung ----------
// T(t) = U + (T₀ − U) · e^(−kt); T′(t) = −k(T₀ − U) · e^(−kt) = −r ⟹ t = ln(k(T₀ − U) : r) : k und
// T = U + r/k (denn T′ = −k(T − U)). Fehlerbilder: k beim Ableiten vergessen, U vergessen, U − r/k.
const K5_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const U of [18, 20, 22, 25]) for (const T0 of [70, 80, 90, 95]) for (const k of [0.05, 0.1, 0.08, 0.2, 0.04]) for (const r of [0.5, 1, 2, 0.25]) {
    const quot = (k * (T0 - U)) / r;
    if (quot <= 1.2 || !glatt(r / k, 4)) continue;
    out.push({ U, T0, k, r, t: Math.log(quot) / k, T: U + r / k });
  }
  return out;
});
function generateK5() {
  const v = ohneFeldKollision(K5_KANDIDATEN(), (w) => [[w.t, lnSicher((w.T0 - w.U) / w.r) / w.k], [w.T, w.r / w.k, w.U - w.r / w.k]], EPS);
  const { U, T0, k, r, t, T } = v;
  const D = T0 - U;
  return {
    promptHtml: `Ein Getränk kühlt nach T(t) = ${num(U)} + ${num(D)} · ${eh(kx(-k, "t"))} ab (T in °C, t in Minuten).<br>` +
      `<strong>Nach wie vielen Minuten sinkt die Temperatur nur noch um ${num(r)} °C pro Minute, und wie warm ist das Getränk dann?</strong>` + GERUNDET,
    felder: [
      { name: "t =", soll: t, toleranz: TOL, hinweis: (roh, z) => (nahe(z, lnSicher(D / r) / k, TOL) ? `T′(t) = ${num(D)} · (−${num(k)}) · ${eh(kx(-k, "t"))} — der Faktor −${num(k)} fehlt beim Ableiten.` : `Löse T′(t) = −${num(r)}: Die Temperatur sinkt, also ist die Änderungsrate negativ.`) },
      { name: "T =", soll: T, toleranz: TOL, hinweis: (roh, z) => (nahe(z, r / k, TOL) ? `Das ist nur der Unterschied zur Raumtemperatur — die ${num(U)} °C kommen dazu.` : nahe(z, U - r / k, TOL) ? "Das Getränk ist wärmer als der Raum: Der Unterschied wird addiert." : "Setze t in T(t) ein — oder benutze T′ = −k · (T − U).") },
    ],
    tipps: [`T′(t) = ${num(-k * D)} · ${eh(kx(-k, "t"))}`, `T′(t) = −${num(r)} ⟺ ${eh(kx(-k, "t"))} = ${bruch(num(r), num(k * D))}`],
    musterloesungHtml: `T′(t) = ${num(D)} · (−${num(k)}) · ${eh(kx(-k, "t"))} = ${num(-k * D)} · ${eh(kx(-k, "t"))}<br>` +
      `T′(t) = −${num(r)} ⟺ ${eh(kx(-k, "t"))} = ${bruch(num(r), num(k * D))} ⟺ −${num(k)}t = ln ${bruch(num(r), num(k * D))} = −ln ${glatt((k * D) / r, 4) ? num((k * D) / r) : `(${bruch(num(k * D), num(r))})`} ⟹ <strong>t</strong> = ${bruch(`ln ${glatt((k * D) / r, 4) ? num((k * D) / r) : `(${bruch(num(k * D), num(r))})`}`, num(k))} ≈ <strong>${num(t)}</strong> min<br>` +
      `Wegen T′(t) = −${num(k)} · (T(t) − ${num(U)}) ist dann T − ${num(U)} = ${bruch(num(r), num(k))} = ${num(r / k)}, also <strong>T = ${num(T)} °C</strong>.`,
  };
}

export const AUFGABEN = [
  { schwierigkeit: "einfach", titel: "Steigung an der Stelle ln c", generate: generateE1 },
  { schwierigkeit: "einfach", titel: "Exponentialgleichung", generate: generateE2 },
  { schwierigkeit: "einfach", titel: "Sinus und Kosinus ableiten (LK)", generate: generateE3 },
  { schwierigkeit: "einfach", titel: "Wachstums- und Zerfallsrate", generate: generateE4 },
  { schwierigkeit: "einfach", titel: "Waagerechte Tangente", generate: generateE5 },
  { schwierigkeit: "einfach", titel: "Ableitungsfunktion: e-Funktionen", generate: generateE6, wuerfelText: "🎲 Neue Funktion" },
  { schwierigkeit: "mittel", titel: "Tangente auf der y-Achse", generate: generateM1 },
  { schwierigkeit: "mittel", titel: "Produktregel und Ausklammern", generate: generateM2 },
  { schwierigkeit: "mittel", titel: "Kettenregel (LK)", generate: generateM3 },
  { schwierigkeit: "mittel", titel: "Quotientenregel (LK)", generate: generateM4 },
  { schwierigkeit: "mittel", titel: "Stelle mit vorgegebener Steigung", generate: generateM5 },
  { schwierigkeit: "mittel", titel: "Ableitungsfunktion: Produkte mit e", generate: generateM6, wuerfelText: "🎲 Neue Funktion" },
  { schwierigkeit: "schwierig", titel: "Extrempunkt", generate: generateS1 },
  { schwierigkeit: "schwierig", titel: "Sinusgleichung (LK)", generate: generateS2 },
  { schwierigkeit: "schwierig", titel: "Tangente an eine ln-Funktion (LK)", generate: generateS3 },
  { schwierigkeit: "schwierig", titel: "Kettenregel und Tangente (LK)", generate: generateS4 },
  { schwierigkeit: "schwierig", titel: "Halbwertszeit und Abbaurate", generate: generateS5 },
  { schwierigkeit: "schwierig", titel: "Ableitungsfunktion: Kettenregel (LK)", generate: generateS6, wuerfelText: "🎲 Neue Funktion" },
  { schwierigkeit: "komplex", titel: "Tangente von einem Punkt der x-Achse", generate: generateK1 },
  { schwierigkeit: "komplex", titel: "Gedämpfte Schwingung (LK)", generate: generateK2 },
  { schwierigkeit: "komplex", titel: "Schnittwinkel zweier e-Funktionen", generate: generateK3 },
  { schwierigkeit: "komplex", titel: "Parameter aus der Extremstelle", generate: generateK4 },
  { schwierigkeit: "komplex", titel: "Abkühlung", generate: generateK5 },
  { schwierigkeit: "komplex", titel: "Ableitungsfunktion: gemischte Funktionen (LK)", generate: generateK6, wuerfelText: "🎲 Neue Funktion" },
];
