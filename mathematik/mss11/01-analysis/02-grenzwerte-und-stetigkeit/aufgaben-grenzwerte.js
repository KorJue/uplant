// Die sechzehn Übungsaufgaben zu „Grenzwerte und Stetigkeit“ — vier je Stufe.
//
//   einfach   — Grenzwert für x → ∞, Einsetzen bei stetigen Funktionen, hebbare Lücke, Polstelle.
//   mittel    — einseitige Grenzwerte, x₀ zum ε-Streifen, Parameter für Stetigkeit,
//               stetige Fortsetzung eines Bruchs.
//   schwierig — √(x² + ax) − x, Intervallhalbierung, Parameter auf beiden Seiten, Nullstellensatz.
//   komplex   — Funktion zu Asymptote und Polstellen, (x³ − x₀³)/(x − x₀), drei Teile stetig
//               zusammensetzen, Zahl der Halbierungsschritte.
//
// Kein Logarithmus (der kommt später): Die Zahl der Halbierungsschritte findet man über Zweierpotenzen.

"use strict";

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
function glatt(x, stellen = 4) {
  const f = Math.pow(10, stellen);
  return Math.abs(Math.round(x * f) - x * f) < 1e-6;
}
function spaeter(bauen) {
  let liste = null;
  return () => (liste ??= bauen());
}
function bruch(z, n) {
  return `<span class="bruch"><span class="z">${z}</span><span class="n">${n}</span></span>`;
}
function ggt(a, b) {
  return b ? ggt(b, a % b) : Math.abs(a);
}
function bruchGekuerzt(z, n) {
  if (n < 0) { z = -z; n = -n; }
  const g = ggt(z, n) || 1;
  z /= g; n /= g;
  if (n === 1) return num(z);
  return (z < 0 ? "−" : "") + bruch(Math.abs(z), n);
}

export function parseZahl(raw) {
  if (raw == null) return NaN;
  let s = String(raw).trim().replace(/\s/g, "").replace(/−/g, "-");
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
const GANZ = `<br><span class="progress-note">Gib eine ganze Zahl ein.</span>`;
const TOL = 0.0001;
const EPS = 0.001;

// ================= einfach =================

// ---------- E1: Grenzwert für x → ∞ ----------
const E1_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const a of [1, 2, 3, 4, 5, 6, -2, -3]) for (const c of [1, 2, 3, 4, 5]) for (const b of [-4, -1, 2, 5]) for (const d of [-3, 1, 2, 7]) {
    if (c + d === 0) continue;
    out.push({ a, b, c, d });
  }
  return out;
});
function generateE1() {
  const k = ohneKollision(E1_KANDIDATEN(), (v) => [v.a / v.c, v.b / v.d, (v.a + v.b) / (v.c + v.d), 0], EPS);
  const { a, b, c, d } = k;
  const z = `${glied(a, "x", false)} ${plusMinus(b)}`, n = `${glied(c, "x", false)} ${plusMinus(d)}`;
  return {
    promptHtml: `<strong>Bestimme lim<sub>x→∞</sub> ${bruch(z, n)}.</strong><br><span class="progress-note">(Zähler: ${z}; Nenner: ${n}.)</span>` + ZAHL,
    correct: a / c,
    tolerance: TOL,
    placeholder: "g",
    hinweis: (roh, v) => {
      if (nahe(v, b / d, TOL)) return "Für großes x spielen die Summanden ohne x keine Rolle — es zählen die Vorfaktoren von x.";
      if (nahe(v, (a + b) / (c + d), TOL)) return "Das ist f(1). Gefragt ist, was für sehr große x passiert.";
      if (nahe(v, 0, TOL)) return "Zähler und Nenner wachsen gleich schnell — der Quotient geht nicht gegen 0.";
      return "Teile Zähler und Nenner durch x.";
    },
    tipps: ["Durch x teilen: Was bleibt übrig, wenn 1/x → 0?"],
    musterloesungHtml: `${bruch(z, n)} = ${bruch(`${num(a)} ${plusMinus(b)}/x`, `${num(c)} ${plusMinus(d)}/x`)} → ${bruch(num(a), num(c))} = <strong>${bruchGekuerzt(a, c)}</strong>`,
  };
}

// ---------- E2: stetig — einfach einsetzen ----------
const E2_KANDIDATEN = spaeter(() => {
  const out = [];
  for (let x0 = -3; x0 <= 4; x0++) for (const b of [-4, -3, -2, -1, 1, 2, 3, 5]) for (const c of [-6, -2, 1, 3, 7]) {
    if (x0 === 0) continue;
    out.push({ x0, b, c });
  }
  return out;
});
function generateE2() {
  const k = ohneKollision(E2_KANDIDATEN(), (v) => [v.x0 ** 2 + v.b * v.x0 + v.c, v.x0 < 0 ? -(v.x0 ** 2) + v.b * v.x0 + v.c : NaN, v.x0 === 1 ? NaN : v.x0 ** 2 + v.b + v.c], 0.5);
  const { x0, b, c } = k;
  const soll = x0 ** 2 + b * x0 + c;
  return {
    promptHtml: `<strong>Bestimme lim<sub>x→${num(x0)}</sub> (x² ${glied(b, "x", true)} ${plusMinus(c)}).</strong>` + ZAHL,
    correct: soll,
    tolerance: TOL,
    placeholder: "g",
    hinweis: (roh, v) => {
      if (x0 < 0 && nahe(v, -(x0 ** 2) + b * x0 + c, TOL)) return `(${num(x0)})² = ${num(x0 * x0)} ist positiv — die Klammer gehört mit zum Quadrat.`;
      if (x0 !== 1 && nahe(v, x0 ** 2 + b + c, TOL)) return `Der mittlere Summand ist ${num(b)} · x, also ${num(b)} · ${numK(x0)}.`;
      return "Ein Polynom ist stetig — der Grenzwert ist einfach der Funktionswert.";
    },
    tipps: ["Polynome sind stetig: einsetzen genügt."],
    musterloesungHtml: `Polynome sind stetig, also lim = f(${num(x0)}) = ${numK(x0)}² ${glied(b, "", true)} · ${numK(x0)} ${plusMinus(c)} = <strong>${num(soll)}</strong>`,
  };
}

// ---------- E3: hebbare Lücke ----------
const E3_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const a of [-3, -2, -1, 1, 2, 3, 4, 5]) for (const c of [-4, -3, -2, -1, 1, 2, 3, 6]) {
    if (a === c) continue;
    out.push({ a, c });
  }
  return out;
});
function generateE3() {
  const k = ohneKollision(E3_KANDIDATEN(), (v) => [v.a - v.c, v.c - v.a, 0], 0.5);
  const { a, c } = k;
  const s = -(a + c), p = a * c;
  const zaehler = `x² ${s === 0 ? "" : glied(s, "x", true)} ${plusMinus(p)}`.replace("  ", " ");
  return {
    promptHtml: `<strong>Bestimme lim<sub>x→${num(a)}</sub> ${bruch(zaehler, `x ${plusMinus(-a)}`)}.</strong><br><span class="progress-note">(Zähler: ${zaehler}; Nenner: x ${plusMinus(-a)}.)</span>` + ZAHL,
    correct: a - c,
    tolerance: TOL,
    placeholder: "g",
    hinweis: (roh, v) => {
      if (nahe(v, 0, TOL)) return "„0 : 0“ ist nicht 0 — erst kürzen, dann einsetzen.";
      if (nahe(v, c - a, TOL)) return `Vorzeichen: Nach dem Kürzen bleibt x ${plusMinus(-c)}, eingesetzt ${num(a)} ${plusMinus(-c)}.`;
      return `Der Zähler hat die Nullstelle ${num(a)} — faktorisiere ihn.`;
    },
    tipps: [`Zähler = (x ${plusMinus(-a)}) · (x ${plusMinus(-c)})`],
    musterloesungHtml: `${bruch(zaehler, `x ${plusMinus(-a)}`)} = ${bruch(`(x ${plusMinus(-a)})(x ${plusMinus(-c)})`, `x ${plusMinus(-a)}`)} = x ${plusMinus(-c)} für x ≠ ${num(a)}<br>lim = ${num(a)} ${plusMinus(-c)} = <strong>${num(a - c)}</strong>`,
  };
}

// ---------- E4: Polstelle ----------
const E4_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const p of [-5, -4, -3, -2, -1, 1, 2, 3, 4, 6]) for (const a of [-4, -2, 1, 3, 5, 7]) {
    if (a === -p) continue;
    out.push({ p, a });
  }
  return out;
});
function generateE4() {
  const k = ohneKollision(E4_KANDIDATEN(), (v) => [v.p, -v.p, -v.a], 0.5);
  const { p, a } = k;
  return {
    promptHtml: `Die Funktion f(x) = ${bruch(`x ${plusMinus(a)}`, `x ${plusMinus(-p)}`)} hat eine Polstelle.<br><span class="progress-note">(Zähler: x ${plusMinus(a)}; Nenner: x ${plusMinus(-p)}.)</span><br><strong>Wo liegt die senkrechte Asymptote? Gib x an.</strong>` + ZAHL,
    correct: p,
    tolerance: TOL,
    placeholder: "x",
    hinweis: (roh, v) => {
      if (nahe(v, -p, TOL)) return `Vorzeichen: x ${plusMinus(-p)} = 0 bei x = ${num(p)}.`;
      if (nahe(v, -a, TOL)) return "Das ist die Nullstelle des Zählers — eine Nullstelle von f, keine Polstelle.";
      return "Wo wird der Nenner 0?";
    },
    tipps: ["Polstelle: Nenner = 0, Zähler ≠ 0."],
    musterloesungHtml: `Nenner: x ${plusMinus(-p)} = 0 ⟺ x = ${num(p)}; Zähler dort: ${num(p)} ${plusMinus(a)} = ${num(p + a)} ≠ 0<br>Senkrechte Asymptote <strong>x = ${num(p)}</strong>`,
  };
}

// ================= mittel =================

// ---------- M1: einseitige Grenzwerte ----------
const M1_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const x0 of [-2, -1, 1, 2, 3]) for (const m1 of [-2, 1, 2, 3]) for (const c1 of [-3, 0, 2]) for (const m2 of [-1, 2, 4]) for (const c2 of [-5, 1, 4]) {
    const l = m1 * x0 + c1, r = m2 * x0 + c2;
    if (Math.abs(l - r) < 0.5) continue;   // sonst gäbe es keinen Sprung — und die beiden Felder wären nicht unterscheidbar
    out.push({ x0, m1, c1, m2, c2, l, r });
  }
  return out;
});
function lin(m, c) {
  return `${glied(m, "x", false)}${c === 0 ? "" : " " + plusMinus(c)}`;
}
function generateM1() {
  const k = ohneFeldKollision(M1_KANDIDATEN(), (v) => [[v.l, v.r], [v.r, v.l]], 0.5);
  const { x0, m1, c1, m2, c2, l, r } = k;
  return {
    promptHtml: `f(x) = ${lin(m1, c1)} für x &lt; ${num(x0)} und f(x) = ${lin(m2, c2)} für x ≥ ${num(x0)}.<br><strong>Bestimme den links- und den rechtsseitigen Grenzwert an der Stelle ${num(x0)}.</strong>` + ZAHL,
    felder: [
      { name: "linksseitig:", soll: l, toleranz: TOL, hinweis: (roh, v) => (nahe(v, r, TOL) ? `Von links (x &lt; ${num(x0)}) gilt die erste Vorschrift.` : `Setze ${num(x0)} in ${lin(m1, c1)} ein.`) },
      { name: "rechtsseitig:", soll: r, toleranz: TOL, hinweis: (roh, v) => (nahe(v, l, TOL) ? `Von rechts (x &gt; ${num(x0)}) gilt die zweite Vorschrift.` : `Setze ${num(x0)} in ${lin(m2, c2)} ein.`) },
    ],
    tipps: ["Jede Seite hat ihre eigene Vorschrift — beide sind Geraden, also stetig: einsetzen."],
    musterloesungHtml: `links: ${num(m1)} · ${numK(x0)} ${plusMinus(c1)} = <strong>${num(l)}</strong>; rechts: ${num(m2)} · ${numK(x0)} ${plusMinus(c2)} = <strong>${num(r)}</strong><br>Verschieden — f springt bei ${num(x0)} um ${num(r - l)} und hat dort keinen Grenzwert.`,
  };
}

// ---------- M2: x₀ zum ε-Streifen ----------
const M2_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const g of [-2, 0, 1, 3, 5]) for (const c of [1, 2, 3, 4, 5, 8]) for (const k of [4, 5, 10, 20, 25, 50, 100]) out.push({ g, c, k });
  return out;
});
function generateM2() {
  const kand = ohneKollision(M2_KANDIDATEN(), (v) => [v.c * v.k, v.c === 1 ? NaN : v.k, v.c / v.k], 0.01);
  const { g, c, k } = kand;
  const eps = 1 / k;
  const term = g === 0 ? bruch(String(c), "x") : `${num(g)} + ${bruch(String(c), "x")}`;
  return {
    promptHtml: `Für x &gt; 0 ist f(x) = ${term} <span class="progress-note">(Abweichung von ${num(g)}: ${c}/x)</span>.<br>` +
      `<strong>Ab welcher Stelle x₀ gilt |f(x) − ${numK(g)}| &lt; ${num(eps)} für alle x &gt; x₀?</strong>` + ZAHL,
    correct: c * k,
    tolerance: TOL,
    placeholder: "x₀",
    hinweis: (roh, v) => {
      if (c !== 1 && nahe(v, k, TOL)) return `Der Abstand ist ${c}/x, nicht 1/x.`;
      if (nahe(v, c / k, TOL)) return `Umgekehrt: ${c}/x < ε ⟺ x > ${c} : ε — durch ε teilen, nicht mit ε malnehmen.`;
      return `Löse ${c}/x < ${num(eps)} nach x auf.`;
    },
    tipps: [`|f(x) − ${num(g)}| = ${c}/x`],
    musterloesungHtml: `${bruch(String(c), "x")} &lt; ${num(eps)} ⟺ x &gt; ${bruch(String(c), num(eps))} = <strong>${c * k}</strong><br><strong>Probe:</strong> x = ${c * k + 1}: Abstand ${num(c / (c * k + 1), 6)} &lt; ${num(eps)} ✓`,
  };
}

// ---------- M3: Parameter für Stetigkeit ----------
const M3_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const x0 of [-2, -1, 1, 2, 3]) for (const p of [-3, -1, 0, 2, 5]) for (const m of [-2, -1, 2, 3, 4]) out.push({ x0, p, m });
  return out;
});
function generateM3() {
  const k = ohneKollision(M3_KANDIDATEN(), (v) => [v.x0 ** 2 + v.p - v.m * v.x0, v.x0 ** 2 + v.p, v.x0 ** 2 + v.p + v.m * v.x0], 0.5);
  const { x0, p, m } = k;
  const soll = x0 ** 2 + p - m * x0;
  return {
    promptHtml: `f(x) = x²${p === 0 ? "" : " " + plusMinus(p)} für x &lt; ${num(x0)} und f(x) = ${glied(m, "x", false)} + b für x ≥ ${num(x0)}.<br><strong>Für welches b ist f an der Stelle ${num(x0)} stetig?</strong>` + ZAHL,
    correct: soll,
    tolerance: TOL,
    placeholder: "b",
    hinweis: (roh, v) => {
      if (nahe(v, x0 ** 2 + p, TOL)) return `Rechts steht ${num(m)} · ${numK(x0)} + b — der Summand ${num(m)} · ${numK(x0)} gehört dazu.`;
      if (nahe(v, x0 ** 2 + p + m * x0, TOL)) return `Beim Auflösen nach b wechselt ${num(m)} · ${numK(x0)} das Vorzeichen.`;
      return "Links- und rechtsseitigen Grenzwert gleichsetzen.";
    },
    tipps: [`links: ${numK(x0)}²${p === 0 ? "" : " " + plusMinus(p)}`, `rechts: ${num(m)} · ${numK(x0)} + b`],
    musterloesungHtml: `links: ${numK(x0)}²${p === 0 ? "" : " " + plusMinus(p)} = ${num(x0 ** 2 + p)}; rechts und f(${num(x0)}): ${num(m)} · ${numK(x0)} + b = ${num(m * x0)} + b<br>` +
      `${num(m * x0)} + b = ${num(x0 ** 2 + p)} ⟹ <strong>b = ${num(soll)}</strong>`,
  };
}

// ---------- M4: stetige Fortsetzung eines Bruchs ----------
const M4_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const a of [-4, -3, -2, -1, 1, 2, 3, 4, 5]) for (const b of [-5, -4, -3, -1, 1, 2, 3, 5, 6]) {
    if (a + b === 0 || b === a || b === -a) continue;
    out.push({ a, b });
  }
  return out;
});
function generateM4() {
  const k = ohneKollision(M4_KANDIDATEN(), (v) => [(v.a + v.b) / (2 * v.a), 0, (v.a + v.b) / 2], EPS);
  const { a, b } = k;
  const s = b - a, p = -a * b;
  const zaehler = `x² ${s === 0 ? "" : glied(s, "x", true) + " "}${plusMinus(p)}`;
  const nenner = `x² ${plusMinus(-a * a)}`;
  const soll = (a + b) / (2 * a);
  return {
    promptHtml: `f(x) = ${bruch(zaehler, nenner)} hat bei x = ${num(a)} eine hebbare Lücke.<br><span class="progress-note">(Zähler: ${zaehler}; Nenner: ${nenner}.)</span><br><strong>Welchen Wert hat die stetige Fortsetzung an der Stelle ${num(a)}?</strong>` + ZAHL,
    correct: soll,
    tolerance: TOL,
    placeholder: `f(${num(a)})`,
    hinweis: (roh, v) => {
      if (nahe(v, 0, TOL)) return "„0 : 0“ ist nicht 0 — erst den gemeinsamen Faktor kürzen.";
      if (nahe(v, (a + b) / 2, TOL)) return `Der Nenner ist x² ${plusMinus(-a * a)} = (x ${plusMinus(-a)})(x ${plusMinus(a)}) — nach dem Kürzen bleibt x ${plusMinus(a)} im Nenner.`;
      return "Zähler und Nenner faktorisieren, den gemeinsamen Faktor kürzen, dann einsetzen.";
    },
    tipps: [`Zähler = (x ${plusMinus(-a)})(x ${plusMinus(b)})`, `Nenner = (x ${plusMinus(-a)})(x ${plusMinus(a)})`],
    musterloesungHtml: `f(x) = ${bruch(`(x ${plusMinus(-a)})(x ${plusMinus(b)})`, `(x ${plusMinus(-a)})(x ${plusMinus(a)})`)} = ${bruch(`x ${plusMinus(b)}`, `x ${plusMinus(a)}`)} für x ≠ ${num(a)}<br>` +
      `Fortsetzung: ${bruch(`${num(a)} ${plusMinus(b)}`, `${num(a)} ${plusMinus(a)}`)} = ${bruch(num(a + b), num(2 * a))} = <strong>${bruchGekuerzt(a + b, 2 * a)}</strong>`,
  };
}

// ================= schwierig =================

// ---------- S1: √(x² + ax) − x ----------
const S1_KANDIDATEN = spaeter(() => {
  const out = [];
  // Das Absolutglied c ändert den Grenzwert nicht — es verschwindet nach dem Teilen durch x.
  for (const a of [2, 3, 4, 5, 6, 7, 8, 9, 10, 12, -2, -3, -4, -5, -6, -8]) for (const c of [0, 1, 4, -3, 9]) out.push({ a, c });
  return out;
});
function generateS1() {
  const k = ohneKollision(S1_KANDIDATEN(), (v) => [v.a / 2, 0, v.a], 0.1);
  const { a, c } = k;
  const rad = `x² ${glied(a, "x", true)}${c === 0 ? "" : " " + plusMinus(c)}`;
  return {
    promptHtml: `<strong>Bestimme lim<sub>x→∞</sub> (√(${rad}) − x).</strong>` + ZAHL,
    correct: a / 2,
    tolerance: TOL,
    placeholder: "g",
    hinweis: (roh, v) => {
      if (nahe(v, 0, TOL)) return "„∞ − ∞“ ist nicht 0. Erweitere mit (√(…) + x), um die Wurzel loszuwerden.";
      if (nahe(v, a, TOL)) return "Nach dem Erweitern steht im Nenner √(…) + x — das sind für großes x etwa zwei x, nicht eins.";
      return "Mit (√(x² + ax) + x) erweitern: dritte binomische Formel.";
    },
    tipps: ["(√A − x)(√A + x) = A − x²", "Dann durch x teilen."],
    musterloesungHtml: `√(${rad}) − x = ${bruch(`(${rad}) − x²`, `√(${rad}) + x`)} = ${bruch(`${num(a)}x${c === 0 ? "" : " " + plusMinus(c)}`, `√(${rad}) + x`)} = ${bruch(`${num(a)}${c === 0 ? "" : " " + plusMinus(c) + "/x"}`, `√(1 ${plusMinus(a)}/x${c === 0 ? "" : " " + plusMinus(c) + "/x²"}) + 1`)} → ${bruch(num(a), "2")} = <strong>${num(a / 2)}</strong>`,
  };
}

// ---------- S2: Intervallhalbierung ----------
function halbieren(f, a, b, k) {
  for (let i = 0; i < k; i++) {
    const m = (a + b) / 2;
    if (f(a) * f(m) < 0) b = m; else a = m;
  }
  return [a, b];
}
const S2_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const s0 of [1, 2, 3]) for (let c = s0 * s0 + 1; c < (s0 + 2) ** 2; c++) for (const schritte of [3, 4]) {
    // Keine Mitte darf genau auf der Nullstelle landen: Für Nicht-Quadratzahlen c ist √c irrational.
    if (Number.isInteger(Math.sqrt(c))) continue;
    const f = (x) => x * x - c;
    const [a, b] = halbieren(f, s0, s0 + 2, schritte);
    // Der typische Fehler: im letzten Schritt die Hälfte ohne Vorzeichenwechsel behalten.
    const [a2, b2] = halbieren(f, s0, s0 + 2, schritte - 1);
    const m = (a2 + b2) / 2;
    const falsch = a === a2 ? [m, b2] : [a2, m];
    out.push({ c, s0, schritte, a, b, falsch });
  }
  return out;
});
function generateS2() {
  const k = ohneFeldKollision(S2_KANDIDATEN(), (v) => [[v.a, v.falsch[0]], [v.b, v.falsch[1]]], 0.01);
  const { c, s0, schritte, a, b, falsch } = k;
  const wort = schritte === 3 ? "drei" : "vier";
  return {
    promptHtml: `f(x) = x² − ${c} hat in [${s0}; ${s0 + 2}] eine Nullstelle. <strong>Schachtele sie durch ${wort} Halbierungsschritte ein: In welchem Intervall liegt sie danach?</strong>` + ZAHL,
    felder: [
      { name: "linke Grenze:", soll: a, toleranz: TOL, hinweis: (roh, v) => (nahe(v, falsch[0], TOL) ? "Im letzten Schritt die andere Hälfte genommen: Behalte die Hälfte, an deren Enden f verschiedene Vorzeichen hat." : "Prüfe in jedem Schritt das Vorzeichen von f in der Mitte.") },
      { name: "rechte Grenze:", soll: b, toleranz: TOL, hinweis: (roh, v) => (nahe(v, falsch[1], TOL) ? "Im letzten Schritt die andere Hälfte genommen: Behalte die Hälfte, an deren Enden f verschiedene Vorzeichen hat." : `Nach ${wort} Schritten ist das Intervall 2 : 2${schritte === 3 ? "³" : "⁴"} = ${num(2 / 2 ** schritte)} lang.`) },
    ],
    tipps: [`Schritt 1: Mitte ${s0 + 1}.`, "Behalte immer die Hälfte mit Vorzeichenwechsel."],
    musterloesungHtml: (() => {
      const f = (x) => x * x - c;
      let lo = s0, hi = s0 + 2;
      const zeilen = [];
      for (let i = 1; i <= schritte; i++) {
        const m = (lo + hi) / 2;
        const fm = f(m);
        if (f(lo) * fm < 0) hi = m; else lo = m;
        zeilen.push(`Schritt ${i}: f(${num(m)}) = ${num(fm)} ${fm > 0 ? "&gt;" : "&lt;"} 0 → [${num(lo)}; ${num(hi)}]`);
      }
      return zeilen.join("<br>") + `<br>Die Nullstelle √${c} ≈ ${num(Math.sqrt(c))} liegt in <strong>[${num(a)}; ${num(b)}]</strong>.`;
    })(),
  };
}

// ---------- S3: Parameter auf beiden Seiten ----------
const S3_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const x0 of [2, 3]) for (let m = -30; m <= 32; m++) {
    if (m === 0) continue;
    const a = (m * x0) / (x0 * x0 - 1);
    if (!glatt(a, 4)) continue;
    out.push({ x0, m, a });
  }
  return out;
});
function generateS3() {
  const k = ohneKollision(S3_KANDIDATEN(), (v) => [v.a, v.m / v.x0, (v.m * v.x0) / (v.x0 * v.x0 + 1)], EPS);
  const { x0, m, a } = k;
  return {
    promptHtml: `f(x) = a · x² für x ≤ ${x0} und f(x) = ${glied(m, "x", false)} + a für x &gt; ${x0}.<br><strong>Für welches a ist f stetig?</strong>` + ZAHL,
    correct: a,
    tolerance: TOL,
    placeholder: "a",
    hinweis: (roh, v) => {
      if (nahe(v, m / x0, TOL)) return "Das a steht auf beiden Seiten — rechts kommt + a dazu.";
      if (nahe(v, (m * x0) / (x0 * x0 + 1), TOL)) return `Beim Sammeln: ${x0 * x0}a − a = ${x0 * x0 - 1}a, nicht ${x0 * x0 + 1}a.`;
      return "Beide Seiten bei x = " + x0 + " gleichsetzen, dann nach a auflösen.";
    },
    tipps: [`links: a · ${x0}² = ${x0 * x0}a`, `rechts: ${num(m)} · ${x0} + a`],
    musterloesungHtml: `${x0 * x0}a = ${num(m * x0)} + a ⟺ ${x0 * x0 - 1}a = ${num(m * x0)} ⟺ <strong>a = ${num(a)}</strong><br><strong>Probe:</strong> links ${num(a * x0 * x0)}, rechts ${num(m * x0)} + ${numK(a)} = ${num(m * x0 + a)} ✓`,
  };
}

// ---------- S4: Nullstellensatz ----------
const S4_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const p of [1, 2, 3, 4, 5]) for (let q = -40; q <= 40; q += 3) {
    if (q === 0) continue;
    const f = (x) => x ** 3 + p * x + q;
    // f ist streng monoton steigend (p > 0) — genau eine Nullstelle. Sie liegt zwischen −5 und 5.
    let k = -5;
    while (f(k + 1) <= 0) k++;
    if (f(k) === 0 || f(k + 1) === 0) continue;   // keine ganzzahlige Nullstelle: dann wäre das Intervall nicht eindeutig
    out.push({ p, q, k });
  }
  return out;
});
function generateS4() {
  const kand = ohneKollision(S4_KANDIDATEN(), (v) => [v.k, v.k + 1, -v.k - 1], 0.5);
  const { p, q, k } = kand;
  const f = (x) => x ** 3 + p * x + q;
  return {
    promptHtml: `f(x) = x³ ${glied(p, "x", true)} ${plusMinus(q)} hat genau eine Nullstelle.<br><strong>Sie liegt in einem Intervall [k; k + 1] mit ganzem k. Bestimme k.</strong>` + GANZ,
    correct: k,
    tolerance: 0.5,
    placeholder: "k",
    hinweis: (roh, v) => {
      if (nahe(v, k + 1, 0.5)) return `Gefragt ist die linke Grenze: f(${k}) und f(${k + 1}) haben verschiedene Vorzeichen.`;
      if (nahe(v, -k - 1, 0.5)) return "Vorzeichen prüfen: Setze ganze Zahlen ein und suche den Vorzeichenwechsel.";
      return "Setze ganze Zahlen ein und suche zwei benachbarte mit verschiedenem Vorzeichen.";
    },
    tipps: ["f ist stetig — ein Vorzeichenwechsel zwischen k und k + 1 garantiert eine Nullstelle dort."],
    musterloesungHtml: `f(${k}) = ${num(f(k))} &lt; 0, f(${k + 1}) = ${num(f(k + 1))} &gt; 0<br>f ist stetig, also liegt nach dem Nullstellensatz eine Nullstelle in [${k}; ${k + 1}]: <strong>k = ${k}</strong>`,
  };
}

// ================= komplex =================

// ---------- K1: Funktion zu Asymptote und Polstellen ----------
const K1_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const c of [-3, -2, -1.5, -1, -0.5, 0.5, 1, 1.5, 2, 2.5, 3, 4]) for (const r of [1, 2, 3, 4, 5]) {
    // Ist der Zähler 2c · x² + 3x bei x = ±r ebenfalls 0, wäre dort keine Polstelle, sondern eine
    // hebbare Lücke — die Aufgabe behauptete dann etwas Falsches. Solche Paare fallen vorher heraus.
    if (Math.abs(2 * c * r * r - 3 * r) < 1e-9 || Math.abs(2 * c * r * r + 3 * r) < 1e-9) continue;
    out.push({ c, r });
  }
  return out;
});
function generateK1() {
  const k = ohneFeldKollision(K1_KANDIDATEN(), (v) => [[2 * v.c, v.c], [2 * v.r * v.r, v.r * v.r, 2 * v.r]], EPS);
  const { c, r } = k;
  return {
    promptHtml: `f(x) = ${bruch("a · x² + 3x", "2x² − b")} mit b &gt; 0.<br><span class="progress-note">(Zähler: a · x² + 3x; Nenner: 2x² − b.)</span><br>` +
      `<strong>Bestimme a und b so, dass y = ${num(c)} waagerechte Asymptote ist und f Polstellen bei x = ±${r} hat.</strong>` + ZAHL,
    felder: [
      { name: "a =", soll: 2 * c, toleranz: TOL, hinweis: (roh, v) => (nahe(v, c, TOL) ? "Die Asymptote ist der Quotient der Leitkoeffizienten: a : 2." : "Gleicher Grad: Grenzwert = a : 2.") },
      { name: "b =", soll: 2 * r * r, toleranz: TOL, hinweis: (roh, v) => (nahe(v, r * r, TOL) ? `Der Nenner ist 2x² − b: Bei x = ${r} muss 2 · ${r * r} − b = 0 sein.` : nahe(v, 2 * r, TOL) ? "x wird quadriert: 2x² bei x = " + r + " ist " + 2 * r * r + "." : "Nenner bei x = ±" + r + " gleich 0 setzen.") },
    ],
    tipps: ["Asymptote: Quotient der Leitkoeffizienten.", "Polstelle: Nenner = 0 (und Zähler ≠ 0)."],
    musterloesungHtml: `Asymptote: ${bruch("a", "2")} = ${num(c)} ⟹ <strong>a = ${num(2 * c)}</strong><br>Polstellen: 2 · ${r}² − b = 0 ⟹ <strong>b = ${2 * r * r}</strong><br>` +
      `<strong>Probe:</strong> Zähler bei x = ${r}: ${num(2 * c)} · ${r * r} + ${3 * r} = ${num(2 * c * r * r + 3 * r)} ≠ 0, bei x = −${r}: ${num(2 * c * r * r - 3 * r)} ≠ 0 — also wirklich Polstellen ✓`,
  };
}

// ---------- K2: (x³ − x₀³)/(x − x₀), (x³ − x₀³)/(x² − x₀²) und (x³ + px − c)/(x − x₀) ----------
// In der dritten Fassung ist der Faktor (x − x₀) nicht an einer binomischen Form zu erkennen:
// Man sieht ihn erst, wenn man x₀ in den Zähler einsetzt und 0 herauskommt.
const K2_KANDIDATEN = spaeter(() => {
  const out = { linear: [], quadratisch: [], mitp: [] };
  for (const x0 of [-4, -3, -2, -1, 1, 2, 3, 4, 5]) for (const art of ["linear", "quadratisch"]) out[art].push({ x0, art, p: 0 });
  for (const x0 of [-3, -2, -1, 1, 2, 3]) for (const p of [-3, -2, -1, 1, 2, 3, 4, 5]) {
    // p = −x₀² machte das Absolutglied 0 und den Rest x² + x₀x — eine andere Aufgabe.
    if (p === -x0 * x0) continue;
    out.mitp.push({ x0, art: "mitp", p });
  }
  return out;
});
function generateK2() {
  // Erst die Fassung, dann der Kandidat — sonst käme die zahlreichste Fassung fast immer dran.
  const art = pick(["linear", "quadratisch", "mitp"]);
  const k = ohneKollision(K2_KANDIDATEN()[art], (v) => (v.art === "linear"
    ? [3 * v.x0 ** 2, 0, v.x0 ** 2, v.x0 ** 3]
    : v.art === "quadratisch"
      ? [1.5 * v.x0, 0, 3 * v.x0 ** 2, v.x0 / 2]
      : [3 * v.x0 ** 2 + v.p, 0, 3 * v.x0 ** 2, v.x0 ** 2 + v.p]), 0.25);
  const { x0, p } = k;
  const c = x0 ** 3 + p * x0;
  const zaehler = `x³ ${p ? glied(p, "x", true) + " " : ""}${plusMinus(-c)}`;
  const nenner = art === "quadratisch" ? `x² ${plusMinus(-x0 * x0)}` : `x ${plusMinus(-x0)}`;
  const soll = art === "quadratisch" ? 1.5 * x0 : 3 * x0 ** 2 + p;
  const rest = `x² ${glied(x0, "x", true)} ${plusMinus(x0 * x0 + p)}`;
  const kuerzen = art === "mitp"
    ? `„0 : 0“ — erst kürzen. Der Zähler ist bei x = ${num(x0)} gleich 0, hat also den Faktor (x ${plusMinus(-x0)}).`
    : "„0 : 0“ — erst kürzen. x³ − x₀³ hat den Faktor (x − x₀).";
  return {
    promptHtml: `<strong>Bestimme lim<sub>x→${num(x0)}</sub> ${bruch(zaehler, nenner)}.</strong><br><span class="progress-note">(Zähler: ${zaehler}; Nenner: ${nenner}.)</span>` + ZAHL,
    correct: soll,
    tolerance: TOL,
    placeholder: "g",
    hinweis: (roh, v) => {
      if (nahe(v, 0, TOL)) return kuerzen;
      if (art === "linear" && nahe(v, x0 ** 2, TOL)) return `Nach der Polynomdivision bleibt ${rest} — drei Summanden, eingesetzt dreimal ${num(x0 * x0)}.`;
      if (art === "linear" && nahe(v, x0 ** 3, TOL)) return "Nicht x₀³ — erst kürzen, dann einsetzen.";
      if (art === "quadratisch" && nahe(v, 3 * x0 ** 2, TOL)) return `Der Nenner ist x² − ${num(x0 * x0)} = (x − ${numK(x0)})(x + ${numK(x0)}) — nach dem Kürzen bleibt x + ${numK(x0)} im Nenner.`;
      if (art === "quadratisch" && nahe(v, x0 / 2, TOL)) return `Im Zähler bleibt ${rest}, eingesetzt 3 · ${num(x0 * x0)}, nicht ${num(x0 * x0)}.`;
      if (art === "mitp" && nahe(v, 3 * x0 ** 2, TOL)) return `Der Summand ${glied(p, "x", false)} fehlt: Nach der Polynomdivision bleibt ${rest}, im letzten Summanden steckt ${num(p)}.`;
      if (art === "mitp" && nahe(v, x0 ** 2 + p, TOL)) return `Nach der Polynomdivision bleibt ${rest} — drei Summanden, alle drei eingesetzt.`;
      return art === "mitp" ? `Polynomdivision durch (x ${plusMinus(-x0)}), dann x = ${num(x0)} einsetzen.` : "x³ − x₀³ = (x − x₀)(x² + x₀x + x₀²).";
    },
    tipps: art === "mitp"
      ? [`Setze x = ${num(x0)} in den Zähler ein: Es kommt 0 heraus, also steckt der Faktor (x ${plusMinus(-x0)}) darin.`, `Polynomdivision: (${zaehler}) : (x ${plusMinus(-x0)})`]
      : ["x³ − x₀³ = (x − x₀)(x² + x₀x + x₀²)", art === "linear" ? "Polynomdivision oder h-Methode." : "x² − x₀² = (x − x₀)(x + x₀)"],
    musterloesungHtml: art === "quadratisch"
      ? `${bruch(`(x ${plusMinus(-x0)})(${rest})`, `(x ${plusMinus(-x0)})(x ${plusMinus(x0)})`)} = ${bruch(rest, `x ${plusMinus(x0)}`)}<br>Eingesetzt: ${bruch(num(3 * x0 * x0), num(2 * x0))} = <strong>${num(soll)}</strong>`
      : (art === "mitp" ? `Zähler bei x = ${num(x0)}: ${num(x0 ** 3)} ${plusMinus(p * x0)} ${plusMinus(-c)} = 0 ⟹ Faktor (x ${plusMinus(-x0)})<br>` : "") +
        `${zaehler} = (x ${plusMinus(-x0)})(${rest})<br>Gekürzt: ${rest} → ${num(x0 * x0)} + ${num(x0 * x0)} ${plusMinus(x0 * x0 + p)} = <strong>${num(soll)}</strong>`,
  };
}

// ---------- K3: drei Teile stetig zusammensetzen ----------
// Nahtstellen bei 1 und q: a · 1 + b = c (links), b · q + a = c · q² (rechts). Daraus
// a = c · q · (q − 1) / (1 − q) = −c · q und b = c − a = c · (1 + q).
const K3_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const q of [2, 3]) for (const c of [-4, -3, -2.5, -2, -1.5, -1, -0.5, 0.5, 1, 1.5, 2, 2.5, 3, 4, 5]) {
    const a = -c * q, b = c * (1 + q);
    out.push({ q, c, a, b });
  }
  return out;
});
function generateK3() {
  // Typische Fehler: a mit falschem Vorzeichen aufgelöst; b nur aus der ersten Nahtstelle mit a = 0.
  const k = ohneFeldKollision(K3_KANDIDATEN(), (v) => [[v.a, -v.a], [v.b, v.c]], EPS);
  const { q, c, a, b } = k;
  return {
    promptHtml: `f(x) = a · x + b für x &lt; 1, &nbsp; f(x) = ${glied(c, "x²", false)} für 1 ≤ x ≤ ${q}, &nbsp; f(x) = b · x + a für x &gt; ${q}.<br>` +
      `<strong>Bestimme a und b so, dass f überall stetig ist.</strong>` + ZAHL,
    felder: [
      { name: "a =", soll: a, toleranz: TOL, hinweis: (roh, v) => (nahe(v, -a, TOL) ? "Vorzeichen beim Auflösen prüfen: Setze dein a und b zur Probe in beide Gleichungen ein." : "Zwei Nahtstellen, zwei Gleichungen.") },
      { name: "b =", soll: b, toleranz: TOL, hinweis: (roh, v) => (nahe(v, c, TOL) ? `Das gilt nur, wenn a = 0 wäre. Die zweite Nahtstelle bei x = ${q} liefert die zweite Gleichung.` : "Die beiden Gleichungen voneinander abziehen.") },
    ],
    tipps: [`Bei x = 1: a + b = ${num(c)}`, `Bei x = ${q}: ${q}b + a = ${num(c * q * q)}`],
    musterloesungHtml: `x = 1: a + b = ${num(c)}; &nbsp; x = ${q}: ${q}b + a = ${num(c * q * q)}<br>Abziehen: ${q - 1}b = ${num(c * q * q - c)} ⟹ b = ${num(b)}, dann a = ${num(c)} − ${numK(b)} = ${num(a)}<br>` +
      `<strong>a = ${num(a)}, b = ${num(b)}</strong><br><strong>Probe:</strong> ${num(a)} + ${numK(b)} = ${num(c)} ✓, ${q} · ${numK(b)} + ${numK(a)} = ${num(c * q * q)} ✓`,
  };
}

// ---------- K4: Zahl der Halbierungsschritte ----------
const K4_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const L of [1, 2, 3, 4, 5]) for (const eps of [0.1, 0.05, 0.02, 0.01, 0.005, 0.001]) {
    let n = 0;
    while (!(L / 2 ** n < eps)) n++;
    if (Math.abs(L / 2 ** (n - 1) - eps) < 1e-12) continue;   // genau auf der Grenze: „kleiner als“ wäre heikel
    out.push({ L, eps, n });
  }
  return out;
});
function generateK4() {
  const k = ohneKollision(K4_KANDIDATEN(), (v) => [v.n, v.n - 1, Math.ceil(v.L / v.eps)], 0.5);
  const { L, eps, n } = k;
  return {
    promptHtml: `Eine Nullstelle liegt in einem Intervall der Länge ${num(L)}.<br><strong>Wie viele Halbierungsschritte braucht man mindestens, bis das Intervall kürzer als ${num(eps)} ist?</strong>` + GANZ,
    correct: n,
    tolerance: 0.5,
    placeholder: "Schritte",
    hinweis: (roh, v) => {
      if (nahe(v, n - 1, 0.5)) return `Nach ${n - 1} Schritten ist das Intervall ${num(L / 2 ** (n - 1), 5)} lang — noch nicht kürzer als ${num(eps)}.`;
      if (nahe(v, Math.ceil(L / eps), 0.5)) return "Das wäre bei gleich langen Stücken. Bei jedem Schritt halbiert sich die Länge — gesucht ist eine Zweierpotenz.";
      return `Gesucht ist das kleinste n mit ${num(L)} : 2ⁿ < ${num(eps)}, also 2ⁿ > ${num(L / eps)}.`;
    },
    tipps: [`${num(L)} : 2ⁿ < ${num(eps)} ⟺ 2ⁿ > ${num(L / eps)}`, "Zweierpotenzen: 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, …"],
    musterloesungHtml: `${num(L)} : 2ⁿ &lt; ${num(eps)} ⟺ 2ⁿ &gt; ${num(L / eps)}<br>2${n - 1 > 0 ? "<sup>" + (n - 1) + "</sup>" : "⁰"} = ${2 ** (n - 1)} reicht nicht, 2<sup>${n}</sup> = ${2 ** n} schon ⟹ <strong>${n} Schritte</strong>`,
  };
}

export const AUFGABEN = [
  { schwierigkeit: "einfach", titel: "Grenzwert für x → ∞", generate: generateE1 },
  { schwierigkeit: "einfach", titel: "Stetig: einfach einsetzen", generate: generateE2 },
  { schwierigkeit: "einfach", titel: "Erst kürzen, dann einsetzen", generate: generateE3 },
  { schwierigkeit: "einfach", titel: "Die senkrechte Asymptote", generate: generateE4 },
  { schwierigkeit: "mittel", titel: "Einseitige Grenzwerte", generate: generateM1 },
  { schwierigkeit: "mittel", titel: "x₀ zum ε-Streifen", generate: generateM2 },
  { schwierigkeit: "mittel", titel: "Parameter für Stetigkeit", generate: generateM3 },
  { schwierigkeit: "mittel", titel: "Stetige Fortsetzung", generate: generateM4 },
  { schwierigkeit: "schwierig", titel: "Wurzel minus x", generate: generateS1 },
  { schwierigkeit: "schwierig", titel: "Intervallhalbierung", generate: generateS2 },
  { schwierigkeit: "schwierig", titel: "Parameter auf beiden Seiten", generate: generateS3 },
  { schwierigkeit: "schwierig", titel: "Wo liegt die Nullstelle?", generate: generateS4 },
  { schwierigkeit: "komplex", titel: "Asymptote und Polstellen vorgeben", generate: generateK1 },
  { schwierigkeit: "komplex", titel: "Ein Grenzwert mit x³", generate: generateK2 },
  { schwierigkeit: "komplex", titel: "Drei Teile stetig zusammensetzen", generate: generateK3 },
  { schwierigkeit: "komplex", titel: "Wie viele Halbierungsschritte?", generate: generateK4 },
];
