// Die sechzehn Übungsaufgaben zu „Grundbegriffe, Baumdiagramme und Vierfeldertafel“ — vier je Stufe.
//
//   einfach   — ein Begriff, ein Schritt: relative Häufigkeit, Gegenereignis, Laplace, Summenregel.
//   mittel    — zwei Stufen: Pfadmultiplikation, ohne Zurücklegen, Pfadaddition, Vierfeldertafel.
//   schwierig — mit einer Stolperstelle: „mindestens einmal“ über das Gegenereignis, eine
//               Vierfeldertafel aus Prozentangaben, zwei verschiedene Farben ohne Zurücklegen,
//               vom Baum in die Tafel.
//   komplex   — rückwärts oder mehrschrittig: Kugelzahl aus einer Pfadwahrscheinlichkeit, Mindest-
//               anzahl von Würfen, Vierfeldertafel aus einem Text, Augensumme zweier Glücksräder.
//
// Kein Vorgriff auf Kapitel 2: Bedingte Wahrscheinlichkeiten heißen hier „Wahrscheinlichkeit beim
// zweiten Zug“, nicht P_A(B). Die Äste eines Baums mit abhängigen Stufen werden aus dem
// Urneninhalt abgezählt, nicht aus einer Formel.
//
// Alle Zahlen entstehen aus vorher gefilterten Listen, nie durch Verwerfen und Neuziehen. Die
// Werte, auf die die Fehlerhinweise anspringen, sind untereinander und von der Lösung deutlich
// verschieden — sonst bekäme eine falsche Rechnung ein ✓ oder die Diagnose wäre mehrdeutig.

"use strict";

// ---------- Helfer (stehen in jeder Seite noch einmal) ----------

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
// Ganzzahlig gerechnet, damit 0,1 · 1000 nicht als 99,99999 durchfällt.
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
const ggt = (a, b) => (b ? ggt(b, a % b) : Math.abs(a));
function gekuerzt(z, n) {
  const g = ggt(z, n);
  return [z / g, n / g];
}

// Eingaben: Dezimalkomma, Prozent („37,5 %“) und Brüche („3/8“) — alle drei Schreibweisen einer
// Wahrscheinlichkeit sind gleich richtig.
export function parseZahl(raw) {
  if (raw == null) return NaN;
  let s = String(raw).trim().replace(/\s/g, "").replace(/−/g, "-");
  const b = s.match(/^(-?\d+(?:,\d+)?)\/(\d+(?:,\d+)?)$/);
  if (b) {
    const z = parseFloat(b[1].replace(",", ".")), n = parseFloat(b[2].replace(",", "."));
    return n === 0 ? NaN : z / n;
  }
  const prozent = s.endsWith("%");
  if (prozent) s = s.slice(0, -1);
  if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) s = s.replace(/\./g, "");
  s = s.replace(",", ".");
  if (!/^-?\d*\.?\d+$/.test(s)) return NaN;
  const v = parseFloat(s);
  return prozent ? v / 100 : v;
}

const WAHRSCH = `<br><span class="progress-note">Gib die Wahrscheinlichkeit als Dezimalzahl (auf vier Stellen), in Prozent oder als Bruch ein.</span>`;
const ANZAHL = `<br><span class="progress-note">Gib eine ganze Zahl ein.</span>`;
const TOL = 0.0006;
const EPS = 0.002;   // Fehlerwerte liegen weiter auseinander als die Eingabetoleranz

// ================= einfach =================

// ---------- E1: relative Häufigkeit ----------
const E1_KANDIDATEN = spaeter(() => {
  const out = [];
  const lagen = [
    { was: "Beim Werfen einer Reißzwecke", ereignis: "„Spitze nach oben“" },
    { was: "Beim Drehen eines Glücksrads", ereignis: "„Rot“" },
    { was: "Bei einer Verkehrszählung", ereignis: "„Lkw“ (unter allen Fahrzeugen)" },
    { was: "Beim Werfen eines Kronkorkens", ereignis: "„Zacken nach oben“" },
  ];
  for (const n of [40, 50, 80, 125, 200, 250, 400, 500, 800, 1000]) {
    for (let H = 3; H < n; H++) {
      if (!glatt(H / n, 4) || H / n < 0.05 || H / n > 0.95) continue;
      for (const l of lagen) out.push({ n, H, ...l });
    }
  }
  return out;
});
function generateE1() {
  const k = ohneKollision(E1_KANDIDATEN(), (v) => [v.H / v.n, v.n / v.H, (v.n - v.H) / v.n, v.H / 100], EPS);
  const { n, H, was, ereignis } = k;
  const h = H / n;
  return {
    promptHtml: `${was} wurde ${num(n)}-mal beobachtet. Das Ergebnis ${ereignis} trat <strong>${num(H)}-mal</strong> auf.<br>` +
      `<strong>Berechne die relative Häufigkeit h von ${ereignis}.</strong>` + WAHRSCH,
    correct: h,
    tolerance: TOL,
    placeholder: "h",
    hinweis: (roh, v) => {
      if (nahe(v, n / H, TOL)) return `Zähler und Nenner vertauscht: h = H : n — die Anzahl der Treffer <strong>durch</strong> die Anzahl aller Versuche. Eine relative Häufigkeit liegt immer zwischen 0 und 1.`;
      if (nahe(v, (n - H) / n, TOL)) return `Das ist die relative Häufigkeit des <em>Gegenteils</em>. Gezählt wird ${ereignis}.`;
      if (nahe(v, H / 100, TOL) && n !== 100) return `Durch 100 geteilt? Geteilt wird durch die Zahl der Versuche, hier ${num(n)}.`;
      return `h = H : n = ${num(H)} : ${num(n)}.`;
    },
    tipps: ["Absolute Häufigkeit H: wie oft. Relative Häufigkeit h: welcher Anteil aller Versuche.", `h = H : n`],
    musterloesungHtml: `h = ${bruch("H", "n")} = ${bruch(num(H), num(n))} = <strong>${num(h)}</strong> = ${num(h * 100, 2)} %<br>` +
      `Nach dem Gesetz der großen Zahlen ist h ein Schätzwert für die Wahrscheinlichkeit — je größer n, desto verlässlicher.`,
  };
}

// ---------- E2: Gegenereignis ----------
const E2_KANDIDATEN = spaeter(() => {
  const out = [];
  const lagen = [
    { e: "E: „Der Zug hat Verspätung“", gegen: "„Der Zug ist pünktlich“" },
    { e: "E: „Das Los gewinnt“", gegen: "„Das Los ist eine Niete“" },
    { e: "E: „Es regnet morgen“", gegen: "„Es regnet morgen nicht“" },
    { e: "E: „Das Bauteil ist defekt“", gegen: "„Das Bauteil ist in Ordnung“" },
  ];
  for (let t = 3; t <= 97; t++) for (const l of lagen) out.push({ p: t / 100, ...l });
  return out;
});
function generateE2() {
  const k = ohneKollision(E2_KANDIDATEN(), (v) => [1 - v.p, v.p, 100 - v.p], EPS);
  const { p, e, gegen } = k;
  return {
    promptHtml: `Für das Ereignis ${e} gilt <strong>P(E) = ${num(p, 2)}</strong>.<br>` +
      `<strong>Wie groß ist die Wahrscheinlichkeit des Gegenereignisses Ē: ${gegen}?</strong>` + WAHRSCH,
    correct: 1 - p,
    tolerance: TOL,
    placeholder: "P(Ē)",
    hinweis: (roh, v) => {
      if (nahe(v, p, TOL)) return "Das ist P(E) selbst. Gegenereignis heißt: alles, was <strong>nicht</strong> zu E gehört.";
      return `P(E) + P(Ē) = 1 — zusammen sind E und Ē sicher. Also P(Ē) = 1 − ${num(p, 2)}.`;
    },
    tipps: ["Entweder tritt E ein oder Ē — eines von beiden sicher, beide zugleich nie."],
    musterloesungHtml: `P(Ē) = 1 − P(E) = 1 − ${num(p, 2)} = <strong>${num(1 - p, 2)}</strong><br>` +
      `<em>Schreibweise:</em> Bigalke/Köhler schreibt Ē, in Fundamente steht oft auch E̅ oder „nicht E“ — gemeint ist dasselbe.`,
  };
}

// ---------- E3: Laplace ----------
const E3_KANDIDATEN = spaeter(() => {
  const out = [];
  // Achtflächiger Würfel wie im Lernpfad, dazu ein Kartenspiel und ein Zwölferwürfel.
  const ex = [
    { name: "einen fairen Würfel mit acht Seiten (1 bis 8)", m: 8 },
    { name: "einen fairen Würfel mit zwölf Seiten (1 bis 12)", m: 12 },
    { name: "einen fairen Würfel mit zwanzig Seiten (1 bis 20)", m: 20 },
    { name: "einen fairen Würfel mit zehn Seiten (1 bis 10)", m: 10 },
  ];
  const ereignisse = [
    { text: "eine gerade Zahl", test: (z) => z % 2 === 0 },
    { text: "eine Primzahl", test: (z) => [2, 3, 5, 7, 11, 13, 17, 19].includes(z) },
    { text: "eine Zahl größer als 5", test: (z) => z > 5 },
    { text: "ein Vielfaches von 3", test: (z) => z % 3 === 0 },
    { text: "eine Zahl kleiner als 4", test: (z) => z < 4 },
    { text: "eine Quadratzahl", test: (z) => [1, 4, 9, 16].includes(z) },
    { text: "eine ungerade Zahl größer als 2", test: (z) => z % 2 === 1 && z > 2 },
    { text: "ein Teiler von 12", test: (z) => 12 % z === 0 },
  ];
  for (const w of ex) for (const e of ereignisse) {
    const guenstig = [];
    for (let z = 1; z <= w.m; z++) if (e.test(z)) guenstig.push(z);
    out.push({ ...w, e: e.text, guenstig });
  }
  return out;
});
function generateE3() {
  const k = ohneKollision(E3_KANDIDATEN(), (v) => [v.guenstig.length / v.m, (v.m - v.guenstig.length) / v.m, 1 / v.m, v.guenstig.length / (v.m - v.guenstig.length)], EPS);
  const { name, m, e, guenstig } = k;
  const g = guenstig.length;
  const [z, n] = gekuerzt(g, m);
  return {
    promptHtml: `Du wirfst ${name}. E sei das Ereignis „${e}“.<br><strong>Berechne P(E).</strong>` + WAHRSCH,
    correct: g / m,
    tolerance: TOL,
    placeholder: "P(E)",
    hinweis: (roh, v) => {
      if (nahe(v, (m - g) / m, TOL)) return "Das ist die Wahrscheinlichkeit des Gegenereignisses — du hast die ungünstigen Ergebnisse gezählt.";
      if (nahe(v, 1 / m, TOL)) return "Das ist die Wahrscheinlichkeit für <em>eine</em> bestimmte Zahl. E besteht aus mehreren Ergebnissen.";
      if (nahe(v, g / (m - g), TOL)) return "Im Nenner steht die Anzahl <strong>aller</strong> Ergebnisse, nicht nur der ungünstigen.";
      return `Zähle die Zahlen, die zu E gehören, und teile durch ${m}.`;
    },
    tipps: [`Schreibe E als Menge auf. Ω hat ${m} gleich wahrscheinliche Ergebnisse.`, "P(E) = |E| : |Ω|"],
    musterloesungHtml: `E = {${guenstig.join("; ")}} hat ${g} Elemente, Ω hat ${m}.<br>` +
      `P(E) = ${bruch(g, m)}${z !== g ? " = " + bruch(z, n) : ""} = <strong>${num(g / m)}</strong>`,
  };
}

// ---------- E4: Summenregel ----------
const FARBEN = ["Rot", "Blau", "Grün", "Gelb", "Weiß"];
const E4_KANDIDATEN = spaeter(() => {
  const out = [];
  const anteile = [[0.1, 0.2, 0.3, 0.4], [0.15, 0.25, 0.35, 0.25], [0.05, 0.3, 0.45, 0.2], [0.2, 0.2, 0.25, 0.35], [0.12, 0.18, 0.3, 0.4], [0.35, 0.15, 0.1, 0.4]];
  for (const a of anteile) {
    for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) out.push({ a, wahl: [i, j] });
  }
  return out;
});
function generateE4() {
  const k = ohneKollision(E4_KANDIDATEN(), (v) => {
    const s = v.a[v.wahl[0]] + v.a[v.wahl[1]];
    return [s, v.a[v.wahl[0]] * v.a[v.wahl[1]], 1 - s];
  }, EPS);
  const { a, wahl } = k;
  const s = a[wahl[0]] + a[wahl[1]];
  const f = (i) => FARBEN[i];
  return {
    promptHtml: `Ein Glücksrad hat die Felder ${a.map((p, i) => `${f(i)} (${num(p * 100)} %)`).join(", ")}.<br>` +
      `<strong>Berechne die Wahrscheinlichkeit für das Ereignis E: „${f(wahl[0])} oder ${f(wahl[1])}“.</strong>` + WAHRSCH,
    correct: s,
    tolerance: TOL,
    placeholder: "P(E)",
    hinweis: (roh, v) => {
      if (nahe(v, a[wahl[0]] * a[wahl[1]], TOL)) return "Multipliziert wird entlang eines Pfades (mehrere Stufen). Hier ist es <strong>eine</strong> Drehung, und E besteht aus zwei Ergebnissen — die Wahrscheinlichkeiten werden <strong>addiert</strong>.";
      if (nahe(v, 1 - s, TOL)) return "Das ist die Wahrscheinlichkeit, dass <em>keine</em> der beiden Farben kommt.";
      return "Summenregel: Die Wahrscheinlichkeit eines Ereignisses ist die Summe der Wahrscheinlichkeiten seiner Ergebnisse.";
    },
    tipps: ["E = {" + f(wahl[0]) + "; " + f(wahl[1]) + "}"],
    musterloesungHtml: `P(E) = P(${f(wahl[0])}) + P(${f(wahl[1])}) = ${num(a[wahl[0]], 2)} + ${num(a[wahl[1]], 2)} = <strong>${num(s, 2)}</strong>`,
  };
}

// ================= mittel =================

// ---------- M1: Pfadmultiplikation, unabhängige Stufen ----------
const WUERFEL = [
  { pw: 1 / 6, text: "eine Sechs" },
  { pw: 5 / 6, text: "keine Sechs" },
  { pw: 1 / 2, text: "eine gerade Zahl" },
  { pw: 1 / 3, text: "eine Zahl kleiner als 3" },
  { pw: 2 / 3, text: "eine Zahl größer als 2" },
];
const M1_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const pr of [0.1, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.75]) for (const w of WUERFEL) out.push({ pr, ...w });
  return out;
});
function generateM1() {
  const k = ohneKollision(M1_KANDIDATEN(), (v) => [v.pr * v.pw, v.pr + v.pw, v.pr * (1 - v.pw), (1 - v.pr) * v.pw], EPS);
  const { pr, pw, text } = k;
  const loesung = pr * pw;
  return {
    promptHtml: `Ein Glücksrad zeigt mit der Wahrscheinlichkeit ${num(pr, 2)} „Rot“. Danach wird unabhängig davon ein fairer Würfel geworfen.<br>` +
      `<strong>Mit welcher Wahrscheinlichkeit zeigt das Rad „Rot“ und der Würfel ${text}?</strong>` + WAHRSCH,
    correct: loesung,
    tolerance: TOL,
    placeholder: "P",
    hinweis: (roh, v) => {
      if (nahe(v, pr + pw, TOL)) return "Entlang eines Pfades wird <strong>multipliziert</strong> (Pfadmultiplikationsregel), nicht addiert.";
      if (nahe(v, pr * (1 - pw), TOL)) return "Am zweiten Ast hast du die Gegenwahrscheinlichkeit genommen. Lies genau, welches Würfelergebnis gefragt ist.";
      if (nahe(v, (1 - pr) * pw, TOL)) return "Am ersten Ast steht „Rot“ mit " + num(pr, 2) + ", nicht die Gegenwahrscheinlichkeit.";
      return "Zeichne den Pfad: erst Rad, dann Würfel. Multipliziere die beiden Astwahrscheinlichkeiten.";
    },
    tipps: ["Pfadmultiplikationsregel: Die Wahrscheinlichkeit eines Pfades ist das Produkt der Astwahrscheinlichkeiten.", `Würfel: P(${text}) = ${num(pw)}`],
    musterloesungHtml: `P(„Rot“ und ${text}) = ${num(pr, 2)} · ${num(pw)} = <strong>${num(loesung)}</strong>`,
  };
}

// Verschiedene Farbpaare, damit dieselbe Rechnung nicht immer gleich aussieht.
const FARBPAARE = [["rote", "blaue", "rot"], ["weiße", "schwarze", "weiß"], ["grüne", "gelbe", "grün"]];

// ---------- M2: ohne Zurücklegen, zweimal dieselbe Farbe ----------
const M2_KANDIDATEN = spaeter(() => {
  const out = [];
  for (let n = 5; n <= 26; n++) for (let r = 2; r < n; r++) {
    const p = (r / n) * ((r - 1) / (n - 1));
    if (!glatt(p, 4)) continue;
    for (const f of FARBPAARE) out.push({ n, r, f });
  }
  return out;
});
function generateM2() {
  const k = ohneKollision(M2_KANDIDATEN(), (v) => [(v.r / v.n) * ((v.r - 1) / (v.n - 1)), (v.r / v.n) ** 2, (v.r / v.n) * ((v.r - 1) / v.n), 2 * v.r / v.n], EPS);
  const { n, r, f } = k;
  const b = n - r;
  const loesung = (r / n) * ((r - 1) / (n - 1));
  return {
    promptHtml: `In einer Urne liegen ${r} ${f[0]} und ${b} ${f[1]} Kugeln. Es werden nacheinander zwei Kugeln <strong>ohne Zurücklegen</strong> gezogen.<br>` +
      `<strong>Mit welcher Wahrscheinlichkeit sind beide Kugeln ${f[2]}?</strong>` + WAHRSCH,
    correct: loesung,
    tolerance: TOL,
    placeholder: "P(rot, rot)",
    hinweis: (roh, v) => {
      if (nahe(v, (r / n) ** 2, TOL)) return "So wäre es <em>mit</em> Zurücklegen. Ohne Zurücklegen liegt beim zweiten Zug eine rote Kugel weniger in der Urne — und eine Kugel weniger insgesamt.";
      if (nahe(v, (r / n) * ((r - 1) / n), TOL)) return "Beim zweiten Zug fehlt nicht nur eine rote Kugel, sondern auch im Nenner eine: Es liegen nur noch " + (n - 1) + " Kugeln in der Urne.";
      if (nahe(v, (2 * r) / n, TOL)) return "Multiplizieren, nicht addieren — und die zweite Stufe hängt von der ersten ab.";
      return "Erster Zug: r/n. Zweiter Zug: eine rote Kugel und eine Kugel insgesamt weniger.";
    },
    tipps: ["Zeichne den Pfad rot → rot.", `Nach dem ersten Zug liegen noch ${r - 1} rote von ${n - 1} Kugeln in der Urne.`],
    musterloesungHtml: `P(rot, rot) = ${bruch(r, n)} · ${bruch(r - 1, n - 1)} = ${bruch(r * (r - 1), n * (n - 1))} = <strong>${num(loesung)}</strong><br>` +
      `Die Stufen sind <strong>abhängig</strong>: Die Wahrscheinlichkeit am zweiten Ast richtet sich nach dem Inhalt der Urne nach dem ersten Zug.`,
  };
}

// ---------- M3: Pfadaddition — genau eine rote, mit Zurücklegen ----------
const M3_KANDIDATEN = spaeter(() => {
  const out = [];
  for (let n = 4; n <= 20; n++) for (let r = 1; r < n; r++) {
    const p = r / n;
    const loes = 2 * p * (1 - p);
    if (!glatt(loes, 4)) continue;
    out.push({ n, r });
  }
  return out;
});
function generateM3() {
  const k = ohneKollision(M3_KANDIDATEN(), (v) => {
    const p = v.r / v.n;
    return [2 * p * (1 - p), p * (1 - p), p * p + (1 - p) * (1 - p), p + (1 - p)];
  }, EPS);
  const { n, r } = k;
  const p = r / n, q = 1 - p;
  const loesung = 2 * p * q;
  return {
    promptHtml: `In einer Urne liegen ${r} rote und ${n - r} blaue Kugeln. Es wird zweimal <strong>mit Zurücklegen</strong> gezogen.<br>` +
      `<strong>Mit welcher Wahrscheinlichkeit ist genau eine der beiden Kugeln rot?</strong>` + WAHRSCH,
    correct: loesung,
    tolerance: TOL,
    placeholder: "P(genau eine rot)",
    hinweis: (roh, v) => {
      if (nahe(v, p * q, TOL)) return "Das ist nur <strong>ein</strong> Pfad (rot → blau). Genau eine rote Kugel gibt es auch auf dem Pfad blau → rot — Pfadadditionsregel.";
      if (nahe(v, p * p + q * q, TOL)) return "Das ist die Wahrscheinlichkeit für zwei <em>gleiche</em> Farben — das Gegenteil des Gesuchten.";
      return "Welche Pfade gehören zum Ereignis? Multipliziere entlang jedes Pfades und addiere dann.";
    },
    tipps: ["Zwei Pfade gehören dazu: rot → blau und blau → rot.", "Pfadmultiplikation für jeden, dann Pfadaddition."],
    musterloesungHtml: `P(r, b) = ${bruch(r, n)} · ${bruch(n - r, n)}, P(b, r) = ${bruch(n - r, n)} · ${bruch(r, n)}<br>` +
      `P(genau eine rot) = 2 · ${num(p)} · ${num(q)} = <strong>${num(loesung)}</strong>`,
  };
}

// ---------- M4: Vierfeldertafel ergänzen (absolute Häufigkeiten) ----------
const M4_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const N of [100, 120, 150, 200, 240, 300, 400]) for (let A = Math.round(N * 0.3); A <= Math.round(N * 0.7); A += 5) for (let B = Math.round(N * 0.2); B <= Math.round(N * 0.6); B += 5) {
    for (const AB of [Math.round(A * B / N) - 10, Math.round(A * B / N) + 5, Math.round(A * B / N) + 15]) {
      if (AB <= 3 || AB >= Math.min(A, B) - 3) continue;
      const ABq = A - AB, AqB = B - AB, AqBq = N - A - B + AB;
      if (AqBq <= 3) continue;
      out.push({ N, A, B, AB, ABq, AqB, AqBq });
    }
  }
  return out;
});
const M4_LAGEN = [
  { A: "Mädchen", Aq: "Jungen", B: "fährt mit dem Rad zur Schule", Bq: "fährt nicht mit dem Rad", wer: "Schülerinnen und Schüler" },
  { A: "unter 30 Jahre", Aq: "30 Jahre und älter", B: "nutzt Mobile-Banking", Bq: "nutzt es nicht", wer: "Befragte" },
];
function generateM4() {
  const k = ohneFeldKollision(M4_KANDIDATEN(), (v) => [
    [v.AqB, v.B, v.A - v.AB === v.AqB ? NaN : v.A - v.AB],
    [v.AqBq, v.N - v.A, v.N - v.B],
  ], 0.5);
  const { N, A, B, AB, AqB, AqBq } = k;
  const l = pick(M4_LAGEN);
  return {
    promptHtml: `Von ${N} ${l.wer} sind ${A} ${l.A}. ${B} der ${l.wer} gilt: ${l.B}; darunter sind ${AB} ${l.A}.<br>` +
      `<strong>Ergänze in der Vierfeldertafel die beiden Felder der Zeile „${l.Aq}“.</strong>` + ANZAHL,
    felder: [
      { name: `${l.Aq} und „${l.B}“:`, soll: AqB, toleranz: 0.5, hinweis: (roh, v) => v === B ? "Das ist die ganze Spaltensumme. Davon gehören " + AB + " zur anderen Zeile." : "Spaltensumme minus das bekannte Feld der Spalte." },
      { name: `${l.Aq} und „${l.Bq}“:`, soll: AqBq, toleranz: 0.5, hinweis: (roh, v) => v === N - A ? "Das ist die Zeilensumme „" + l.Aq + "“. Davon gehören " + AqB + " schon ins erste Feld." : v === N - B ? "Das ist die Spaltensumme „" + l.Bq + "“ — davon gehört ein Teil zur Zeile „" + l.A + "“." : "Jede Zeile und jede Spalte muss ihre Summe ergeben." },
    ],
    tipps: [`Zeile „${l.Aq}“: ${N} − ${A} = ${N - A}.`, `Spalte „${l.B}“: ${B} − ${AB}.`],
    musterloesungHtml:
      `<table class="vft-mini"><tr><th></th><th>${l.B}</th><th>${l.Bq}</th><th>Σ</th></tr>` +
      `<tr><th>${l.A}</th><td>${AB}</td><td>${A - AB}</td><td>${A}</td></tr>` +
      `<tr><th>${l.Aq}</th><td><strong>${AqB}</strong></td><td><strong>${AqBq}</strong></td><td>${N - A}</td></tr>` +
      `<tr><th>Σ</th><td>${B}</td><td>${N - B}</td><td>${N}</td></tr></table>` +
      `${B} − ${AB} = ${AqB}; ${N - A} − ${AqB} = ${AqBq}. Probe: ${AB} + ${A - AB} + ${AqB} + ${AqBq} = ${N} ✓`,
  };
}

// ================= schwierig =================

// ---------- S1: mindestens einmal ----------
const S1_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const p of [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.25, 0.75, 0.15, 0.05]) for (const n of [2, 3, 4]) {
    const loes = 1 - (1 - p) ** n;
    if (!glatt(loes, 4)) continue;
    out.push({ p, n });
  }
  return out;
});
function generateS1() {
  const k = ohneKollision(S1_KANDIDATEN(), (v) => [1 - (1 - v.p) ** v.n, v.n * v.p, (1 - v.p) ** v.n, 1 - v.p ** v.n, v.p ** v.n], EPS);
  const { p, n } = k;
  const loes = 1 - (1 - p) ** n;
  return {
    promptHtml: `Ein Basketballspieler trifft einen Freiwurf mit der Wahrscheinlichkeit ${num(p, 2)}. Er wirft ${n}-mal; die Würfe sind unabhängig voneinander.<br>` +
      `<strong>Mit welcher Wahrscheinlichkeit trifft er mindestens einmal?</strong>` + WAHRSCH,
    correct: loes,
    tolerance: TOL,
    placeholder: "P(mindestens einmal)",
    hinweis: (roh, v) => {
      if (nahe(v, n * p, TOL)) return `${n} · ${num(p, 2)} ist keine Wahrscheinlichkeit — bei genügend Würfen würde sie größer als 1. Die Pfade „Treffer beim ersten“ und „Treffer beim zweiten“ überschneiden sich.`;
      if (nahe(v, (1 - p) ** n, TOL)) return "Das ist die Wahrscheinlichkeit für <strong>keinen</strong> Treffer — das Gegenereignis. Jetzt noch 1 minus.";
      if (nahe(v, 1 - p ** n, TOL)) return "Das Gegenteil von „mindestens einmal treffen“ ist „nie treffen“, nicht „immer treffen“.";
      if (nahe(v, p ** n, TOL)) return "Das ist die Wahrscheinlichkeit, <em>jedes Mal</em> zu treffen.";
      return "Rechne über das Gegenereignis: Welcher einzige Pfad gehört NICHT dazu?";
    },
    tipps: ["„Mindestens einmal“ umfasst viele Pfade — das Gegenereignis „keinmal“ nur einen.", `P(keinmal) = ${num(1 - p, 2)}^${n}`],
    musterloesungHtml: `Gegenereignis „kein Treffer“: nur der Pfad Fehlwurf → … → Fehlwurf, P = ${num(1 - p, 2)}<sup>${n}</sup> = ${num((1 - p) ** n)}<br>` +
      `P(mindestens einmal) = 1 − ${num((1 - p) ** n)} = <strong>${num(loes)}</strong>`,
  };
}

// ---------- S2: Vierfeldertafel aus relativen Angaben ----------
const S2_KANDIDATEN = spaeter(() => {
  const out = [];
  for (let a = 30; a <= 70; a += 5) for (let b = 20; b <= 60; b += 5) for (let ab = 5; ab < Math.min(a, b); ab += 5) {
    const nn = 100 - a - b + ab;
    if (nn <= 0) continue;
    out.push({ a: a / 100, b: b / 100, ab: ab / 100 });
  }
  return out;
});
function generateS2() {
  const k = ohneKollision(S2_KANDIDATEN(), (v) => [1 - v.a - v.b + v.ab, 1 - v.a - v.b, (1 - v.a) * (1 - v.b), 1 - v.ab, (1 - v.a) - v.ab], EPS);
  const { a, b, ab } = k;
  const loes = 1 - a - b + ab;
  return {
    promptHtml: `Für zwei Ereignisse gilt <strong>P(A) = ${num(a, 2)}</strong>, <strong>P(B) = ${num(b, 2)}</strong> und <strong>P(A ∩ B) = ${num(ab, 2)}</strong>.<br>` +
      `<strong>Berechne P(Ā ∩ B̄)</strong> — die Wahrscheinlichkeit, dass weder A noch B eintritt.` + WAHRSCH,
    correct: loes,
    tolerance: TOL,
    placeholder: "P(Ā ∩ B̄)",
    hinweis: (roh, v) => {
      if (nahe(v, 1 - a - b, TOL)) return "A ∩ B wurde doppelt abgezogen: einmal in P(A) und einmal in P(B). Es muss einmal wieder dazu.";
      if (nahe(v, (1 - a) * (1 - b), TOL)) return "Das Produkt stimmt nur, wenn A und B unabhängig sind — das ist hier nicht gesagt. Rechne mit der Vierfeldertafel.";
      if (nahe(v, 1 - ab, TOL)) return "Das ist die Wahrscheinlichkeit, dass nicht <em>beide</em> eintreten. Gesucht ist: <em>keines</em> von beiden.";
      if (nahe(v, 1 - a - ab, TOL)) return "Das Feld Ā ∩ B̄ ist Zeilensumme P(Ā) minus das Feld Ā ∩ B — und P(Ā ∩ B) = P(B) − P(A ∩ B).";
      return "Trage die drei Angaben in eine Vierfeldertafel ein und fülle sie über die Summen auf.";
    },
    tipps: ["Vierfeldertafel: Zeilen A/Ā, Spalten B/B̄, alles zusammen 1.", `P(Ā ∩ B) = P(B) − P(A ∩ B) = ${num(b - ab, 2)}`],
    musterloesungHtml:
      `<table class="vft-mini"><tr><th></th><th>B</th><th>B̄</th><th>Σ</th></tr>` +
      `<tr><th>A</th><td>${num(ab, 2)}</td><td>${num(a - ab, 2)}</td><td>${num(a, 2)}</td></tr>` +
      `<tr><th>Ā</th><td>${num(b - ab, 2)}</td><td><strong>${num(loes, 2)}</strong></td><td>${num(1 - a, 2)}</td></tr>` +
      `<tr><th>Σ</th><td>${num(b, 2)}</td><td>${num(1 - b, 2)}</td><td>1</td></tr></table>` +
      `P(Ā ∩ B̄) = P(Ā) − P(Ā ∩ B) = ${num(1 - a, 2)} − ${num(b - ab, 2)} = <strong>${num(loes, 2)}</strong>`,
  };
}

// ---------- S3: zwei verschiedene Farben, ohne Zurücklegen ----------
const S3_KANDIDATEN = spaeter(() => {
  const out = [];
  for (let n = 5; n <= 26; n++) for (let r = 2; r <= n - 2; r++) {
    const b = n - r;
    const loes = 2 * (r / n) * (b / (n - 1));
    if (!glatt(loes, 4)) continue;
    for (const f of FARBPAARE) out.push({ n, r, f });
  }
  return out;
});
function generateS3() {
  const k = ohneKollision(S3_KANDIDATEN(), (v) => {
    const b = v.n - v.r;
    return [2 * (v.r / v.n) * (b / (v.n - 1)), (v.r / v.n) * (b / (v.n - 1)), 2 * (v.r / v.n) * (b / v.n), 1 - (v.r / v.n) * ((v.r - 1) / (v.n - 1))];
  }, EPS);
  const { n, r, f } = k;
  const b = n - r;
  const pfad = (r / n) * (b / (n - 1));
  const loes = 2 * pfad;
  return {
    promptHtml: `In einer Urne liegen ${r} ${f[0]} und ${b} ${f[1]} Kugeln. Zwei Kugeln werden <strong>ohne Zurücklegen</strong> gezogen.<br>` +
      `<strong>Mit welcher Wahrscheinlichkeit haben sie verschiedene Farben?</strong>` + WAHRSCH,
    correct: loes,
    tolerance: TOL,
    placeholder: "P(verschieden)",
    hinweis: (roh, v) => {
      if (nahe(v, pfad, TOL)) return "Das ist nur der Pfad rot → blau. „Verschiedene Farben“ gilt auch für blau → rot.";
      if (nahe(v, 2 * (r / n) * (b / n), TOL)) return "So wäre es <em>mit</em> Zurücklegen. Beim zweiten Zug liegen nur noch " + (n - 1) + " Kugeln in der Urne.";
      if (nahe(v, 1 - (r / n) * ((r - 1) / (n - 1)), TOL)) return "Das Gegenereignis von „verschieden“ ist „gleich“ — und gleich sind auch zwei <em>blaue</em> Kugeln.";
      return "Zwei Pfade: rot → blau und blau → rot. Beide Male hat sich die Urne nach dem ersten Zug verändert.";
    },
    tipps: ["Zeichne den vollständigen Baum mit vier Pfaden.", `rot → blau: ${r}/${n} · ${b}/${n - 1}`],
    musterloesungHtml: `P(r, b) = ${bruch(r, n)} · ${bruch(b, n - 1)} = ${num(pfad)}; P(b, r) = ${bruch(b, n)} · ${bruch(r, n - 1)} = ${num(pfad)}<br>` +
      `P(verschieden) = ${num(pfad)} + ${num(pfad)} = <strong>${num(loes)}</strong><br>` +
      `Probe über das Gegenereignis: 1 − P(r, r) − P(b, b) = 1 − ${num((r * (r - 1)) / (n * (n - 1)))} − ${num((b * (b - 1)) / (n * (n - 1)))} = ${num(loes)} ✓`,
  };
}

// ---------- S4: vom Baum in die Vierfeldertafel ----------
//
// Zweistufig mit abhängigen Stufen: Die Äste der zweiten Stufe werden aus dem Text gelesen
// („von den Stammkunden kaufen 40 % …“) — als Anteil einer Gruppe, noch ohne das Wort „bedingt“.
const S4_KANDIDATEN = spaeter(() => {
  const out = [];
  for (let a = 20; a <= 80; a += 10) for (let x = 10; x <= 90; x += 10) for (let y = 10; y <= 90; y += 10) {
    if (x === y) continue;
    out.push({ a: a / 100, x: x / 100, y: y / 100 });
  }
  return out;
});
function generateS4() {
  const k = ohneFeldKollision(S4_KANDIDATEN(), (v) => [
    [v.a * v.x, v.x, v.a + v.x - 1],
    [v.a * v.x + (1 - v.a) * v.y, v.x + v.y, (v.x + v.y) / 2],
  ], EPS);
  const { a, x, y } = k;
  const zelle = a * x, spalte = a * x + (1 - a) * y;
  return {
    promptHtml: `In einem Geschäft sind ${num(a * 100)} % der Kundschaft Stammkunden (S). Von den Stammkunden nutzen ${num(x * 100)} % die Kundenkarte (K), von den übrigen Kunden ${num(y * 100)} %.<br>` +
      `<strong>Bestimme die Einträge der Vierfeldertafel: P(S ∩ K) und P(K).</strong>` + WAHRSCH,
    felder: [
      { name: "P(S ∩ K) =", soll: zelle, toleranz: TOL, hinweis: (roh, v) => nahe(v, x, TOL) ? "Die " + num(x * 100) + " % beziehen sich nur auf die Stammkunden. In die Tafel gehört der Anteil an <strong>allen</strong> Kunden: Pfad S → K." : "Pfadmultiplikation: P(S) · (Anteil der Kartennutzer unter den Stammkunden)." },
      { name: "P(K) =", soll: spalte, toleranz: TOL, hinweis: (roh, v) => nahe(v, x + y, TOL) ? "Die beiden Prozentsätze beziehen sich auf verschieden große Gruppen und lassen sich nicht einfach addieren." : nahe(v, (x + y) / 2, TOL) ? "Der Mittelwert stimmt nur, wenn beide Gruppen gleich groß sind." : "P(K) ist die Spaltensumme: beide Pfade, die in K enden." },
    ],
    tipps: ["Baum: erste Stufe S/S̄, zweite Stufe K/K̄.", "Jedes Blatt des Baums ist eine Zelle der Tafel; P(K) ist die Summe einer Spalte."],
    musterloesungHtml: `P(S ∩ K) = ${num(a, 2)} · ${num(x, 2)} = <strong>${num(zelle)}</strong><br>` +
      `P(S̄ ∩ K) = ${num(1 - a, 2)} · ${num(y, 2)} = ${num((1 - a) * y)}<br>` +
      `P(K) = ${num(zelle)} + ${num((1 - a) * y)} = <strong>${num(spalte)}</strong>`,
  };
}

// ================= komplex =================

// ---------- K1: rückwärts — wie viele rote Kugeln? ----------
const K1_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const n of [5, 8, 10, 20, 25]) for (let r = 1; r < n; r++) {
    const p = (r / n) ** 2;
    if (!glatt(p, 4)) continue;
    out.push({ n, r });
  }
  return out;
});
function generateK1() {
  const k = ohneKollision(K1_KANDIDATEN(), (v) => [v.r, v.n - v.r, (v.r / v.n) ** 2 * v.n, v.r / v.n], 0.5);
  const { n, r } = k;
  const P = (r / n) ** 2;
  return {
    promptHtml: `In einer Urne liegen ${n} Kugeln, einige davon rot. Es wird zweimal <strong>mit Zurücklegen</strong> gezogen. Die Wahrscheinlichkeit, zweimal eine rote Kugel zu ziehen, beträgt <strong>${num(P)}</strong>.<br>` +
      `<strong>Wie viele rote Kugeln liegen in der Urne?</strong>` + ANZAHL,
    correct: r,
    tolerance: 0.01,
    placeholder: "Anzahl",
    hinweis: (roh, v) => {
      if (nahe(v, n - r, 0.01)) return "Das ist die Zahl der <em>anderen</em> Kugeln.";
      if (nahe(v, P * n, 0.01)) return "P(rot, rot) ist ein Produkt aus zwei gleichen Faktoren. Erst die Wurzel ziehen, dann mit " + n + " malnehmen.";
      if (nahe(v, r / n, 0.01)) return "Das ist die Wahrscheinlichkeit für rot bei einem Zug. Gefragt ist die Anzahl.";
      return "P(rot, rot) = p · p. Bestimme erst p, dann die Anzahl.";
    },
    tipps: ["Mit Zurücklegen ist P(rot) bei beiden Zügen dieselbe Zahl p.", `p² = ${num(P)}`],
    musterloesungHtml: `p · p = ${num(P)} ⟹ p = √${num(P)} = ${num(r / n)}<br>Anzahl rot = ${num(r / n)} · ${n} = <strong>${r}</strong><br>` +
      `<strong>Probe:</strong> (${r}/${n})² = ${num(P)} ✓`,
  };
}

// ---------- K2: Mindestanzahl von Versuchen ----------
const K2_KANDIDATEN = spaeter(() => {
  const out = [];
  const lagen = [
    { p: 1 / 6, text: "mindestens eine Sechs", wurf: "einen fairen Würfel", pText: "1/6" },
    { p: 0.1, text: "mindestens einen Gewinn", wurf: "ein Los mit Gewinnwahrscheinlichkeit 0,1", pText: "0,1" },
    { p: 0.2, text: "mindestens einmal „Rot“", wurf: "ein Glücksrad mit P(Rot) = 0,2", pText: "0,2" },
    { p: 0.25, text: "mindestens einen Treffer", wurf: "eine Torwand mit Trefferwahrscheinlichkeit 0,25", pText: "0,25" },
    { p: 0.3, text: "mindestens einmal Kopf auf einer gezinkten Münze", wurf: "eine gezinkte Münze mit P(Kopf) = 0,3", pText: "0,3" },
    { p: 0.05, text: "mindestens ein defektes Teil", wurf: "eine Prüfung von Teilen mit Ausschussquote 0,05", pText: "0,05" },
  ];
  for (const l of lagen) for (const s of [0.5, 0.75, 0.8, 0.9, 0.95, 0.99]) {
    const n = Math.ceil(Math.log(1 - s) / Math.log(1 - l.p) - 1e-12);
    out.push({ ...l, s, n });
  }
  return out;
});
function k2Werte(v) {
  const frei = (x) => (Math.abs(x - v.n) < 0.5 || Math.abs(x - (v.n - 1)) < 0.5 ? NaN : x);
  const a = frei(Math.ceil(v.s / v.p));
  const b = frei(Math.round(1 / v.p));
  return [v.n, v.n - 1, a, Math.abs(b - a) < 0.5 ? NaN : b];
}
function generateK2() {
  // Fällt ein Fehlerwert mit n oder n − 1 zusammen, steht dort NaN — sonst verschwänden gerade
  // die kleinen Sicherheiten lautlos aus dem Vorrat.
  const k = ohneKollision(K2_KANDIDATEN(), k2Werte, 0.5);
  const { p, text, wurf, s, n } = k;
  const q = 1 - p;
  return {
    promptHtml: `Wie oft muss man ${wurf} mindestens benutzen, damit man mit einer Wahrscheinlichkeit von mindestens ${num(s * 100)} % ${text} erhält?` + ANZAHL,
    correct: n,
    tolerance: 0.01,
    placeholder: "n",
    hinweis: (roh, v) => {
      if (nahe(v, n - 1, 0.01)) return `Bei ${n - 1} Versuchen ist die Wahrscheinlichkeit erst ${num(1 - q ** (n - 1))} — knapp zu wenig. Aufrunden!`;
      const [, , fa, fb] = k2Werte(k);
      if (nahe(v, fa, 0.01)) return "Wahrscheinlichkeiten von Versuchen addieren sich nicht zu n · p — das Gegenereignis „nie“ hilft.";
      if (nahe(v, fb, 0.01)) return "So oft erwartet man <em>im Mittel</em> einen Erfolg. Mit " + num(s * 100) + " % Sicherheit braucht man mehr.";
      return `Bedingung: 1 − ${num(q)}ⁿ ≥ ${num(s)}, also ${num(q)}ⁿ ≤ ${num(1 - s)}.`;
    },
    tipps: ["P(mindestens einmal) = 1 − P(nie) = 1 − (1 − p)ⁿ", `Probiere n aus oder rechne mit dem Logarithmus: n ≥ ln(${num(1 - s)}) : ln(${num(q)})`],
    musterloesungHtml: `1 − ${num(q)}ⁿ ≥ ${num(s)} ⟺ ${num(q)}ⁿ ≤ ${num(1 - s)} ⟺ n ≥ ${bruch("ln " + num(1 - s), "ln " + num(q))} ≈ ${num(Math.log(1 - s) / Math.log(q), 2)}<br>` +
      `Aufrunden: <strong>n = ${n}</strong><br>` +
      `<strong>Probe:</strong> n = ${n}: 1 − ${num(q)}<sup>${n}</sup> ≈ ${num(1 - q ** n)} ≥ ${num(s)} ✓; n = ${n - 1}: ${num(1 - q ** (n - 1))} &lt; ${num(s)}.`,
  };
}

// ---------- K3: Vierfeldertafel aus einem Text ----------
const K3_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const N of [200, 250, 400, 500, 600, 800]) for (let pm = 40; pm <= 60; pm += 5) for (let pb = 20; pb <= 50; pb += 5) for (let jb = 10; jb <= 60; jb += 5) {
    const M = N * pm / 100, B = N * pb / 100;
    if (!Number.isInteger(M) || !Number.isInteger(B)) continue;
    const J = N - M;
    if (jb >= J || jb >= B) continue;
    const mb = B - jb, mo = M - mb;
    if (mb <= 0 || mo <= 0) continue;
    out.push({ N, pm, pb, jb, M, B, mb, mo });
  }
  return out;
});
function generateK3() {
  const k = ohneKollision(K3_KANDIDATEN(), (v) => [v.mo, v.M - v.jb, v.M - v.B, v.mb], 0.5);
  const { N, pm, pb, jb, M, B, mb, mo } = k;
  return {
    promptHtml: `An einer Schule mit ${N} Schülerinnen und Schülern sind ${pm} % Mädchen. ${pb} % aller Kinder tragen eine Brille. ${jb} Jungen tragen eine Brille.<br>` +
      `<strong>Wie viele Mädchen tragen keine Brille?</strong>` + ANZAHL,
    correct: mo,
    tolerance: 0.01,
    placeholder: "Anzahl",
    hinweis: (roh, v) => {
      if (nahe(v, mb, 0.01)) return "Das sind die Mädchen <em>mit</em> Brille.";
      if (nahe(v, M - jb, 0.01)) return "Die " + jb + " Jungen mit Brille gehören zur anderen Zeile. Von den Mädchen werden die Mädchen mit Brille abgezogen.";
      if (nahe(v, M - B, 0.01)) return "Von den Brillenträgern sind nicht alle Mädchen — erst die Spalte „Brille“ aufteilen.";
      return "Prozentangaben zuerst in Anzahlen umrechnen, dann die Tafel über die Summen füllen.";
    },
    tipps: [`Mädchen: ${pm} % von ${N} = ${M}; Brille: ${pb} % von ${N} = ${B}.`, `Mädchen mit Brille: ${B} − ${jb}.`],
    musterloesungHtml:
      `<table class="vft-mini"><tr><th></th><th>Brille</th><th>keine Brille</th><th>Σ</th></tr>` +
      `<tr><th>Mädchen</th><td>${mb}</td><td><strong>${mo}</strong></td><td>${M}</td></tr>` +
      `<tr><th>Jungen</th><td>${jb}</td><td>${N - M - jb}</td><td>${N - M}</td></tr>` +
      `<tr><th>Σ</th><td>${B}</td><td>${N - B}</td><td>${N}</td></tr></table>` +
      `Mädchen: ${M}, Brille: ${B}; Mädchen mit Brille: ${B} − ${jb} = ${mb}; ohne Brille: ${M} − ${mb} = <strong>${mo}</strong>`,
  };
}

// ---------- K4: Augensumme zweier Glücksräder ----------
const K4_KANDIDATEN = spaeter(() => {
  const out = [];
  const raeder = [
    [[1, 0.5], [2, 0.3], [3, 0.2]],
    [[1, 0.25], [2, 0.25], [3, 0.5]],
    [[1, 0.4], [2, 0.4], [3, 0.2]],
    [[0, 0.2], [1, 0.5], [2, 0.3]],
    [[1, 0.6], [2, 0.3], [5, 0.1]],
  ];
  for (const r of raeder) {
    const summen = new Map();
    for (const [a, pa] of r) for (const [b, pb] of r) summen.set(a + b, (summen.get(a + b) || 0) + pa * pb);
    for (const [s, p] of summen) {
      if (p < 0.02 || !glatt(p, 4)) continue;
      out.push({ r, s, p, pfade: r.flatMap(([a, pa]) => r.filter(([b]) => a + b === s).map(([b, pb]) => [a, b, pa * pb])) });
    }
  }
  return out;
});
function generateK4() {
  // Einziger Fehlerwert: nur ein Pfad gezählt. Gibt es nur einen Pfad, steht dort NaN.
  const k = ohneKollision(K4_KANDIDATEN(), (v) => [v.p, v.pfade.length > 1 ? v.pfade[0][2] : NaN], EPS);
  const { r, s, p, pfade } = k;
  const ein = pfade[0][2];
  return {
    promptHtml: `Ein Glücksrad trägt die Zahlen ${r.map(([z, q]) => `${z} (mit Wahrscheinlichkeit ${num(q, 2)})`).join(", ")}. Es wird zweimal gedreht, und die beiden Zahlen werden addiert.<br>` +
      `<strong>Mit welcher Wahrscheinlichkeit ist die Summe ${s}?</strong>` + WAHRSCH,
    correct: p,
    tolerance: TOL,
    placeholder: "P(Summe = " + s + ")",
    hinweis: (roh, v) => {
      if (pfade.length > 1 && nahe(v, ein, TOL)) return `Das ist nur der Pfad ${pfade[0][0]} → ${pfade[0][1]}. Zur Summe ${s} gehören ${pfade.length} Pfade.`;
      return "Suche alle Pfade (erste Zahl, zweite Zahl) mit der Summe " + s + " — die Reihenfolge zählt. Multipliziere je Pfad, dann addiere.";
    },
    tipps: [`Pfade mit Summe ${s}: ${pfade.map(([a, b]) => `(${a} | ${b})`).join(", ")}`],
    musterloesungHtml: pfade.map(([a, b, q]) => `P(${a}, ${b}) = ${num(q)}`).join("<br>") +
      `<br>P(Summe = ${s}) = ${pfade.map(([, , q]) => num(q)).join(" + ")} = <strong>${num(p)}</strong>`,
  };
}

export const AUFGABEN = [
  { schwierigkeit: "einfach", titel: "Relative Häufigkeit", generate: generateE1 },
  { schwierigkeit: "einfach", titel: "Das Gegenereignis", generate: generateE2 },
  { schwierigkeit: "einfach", titel: "Laplace-Wahrscheinlichkeit", generate: generateE3 },
  { schwierigkeit: "einfach", titel: "Summenregel am Glücksrad", generate: generateE4 },
  { schwierigkeit: "mittel", titel: "Pfadmultiplikation", generate: generateM1 },
  { schwierigkeit: "mittel", titel: "Ohne Zurücklegen", generate: generateM2 },
  { schwierigkeit: "mittel", titel: "Pfadaddition", generate: generateM3 },
  { schwierigkeit: "mittel", titel: "Vierfeldertafel ergänzen", generate: generateM4 },
  { schwierigkeit: "schwierig", titel: "Mindestens einmal", generate: generateS1 },
  { schwierigkeit: "schwierig", titel: "Weder A noch B", generate: generateS2 },
  { schwierigkeit: "schwierig", titel: "Zwei verschiedene Farben", generate: generateS3 },
  { schwierigkeit: "schwierig", titel: "Vom Baum in die Vierfeldertafel", generate: generateS4 },
  { schwierigkeit: "komplex", titel: "Rückwärts: wie viele rote Kugeln?", generate: generateK1 },
  { schwierigkeit: "komplex", titel: "Wie oft mindestens?", generate: generateK2 },
  { schwierigkeit: "komplex", titel: "Vierfeldertafel aus einem Text", generate: generateK3 },
  { schwierigkeit: "komplex", titel: "Augensumme zweier Glücksräder", generate: generateK4 },
];
