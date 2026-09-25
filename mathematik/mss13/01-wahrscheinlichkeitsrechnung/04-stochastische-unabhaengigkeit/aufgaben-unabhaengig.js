// Die sechzehn Übungsaufgaben zu „Stochastische Unabhängigkeit“ — vier je Stufe.
//
//   einfach   — die Multiplikationsregel anwenden, einen Test entscheiden, P_A(B) = P(B) nutzen,
//               eine Zelle unter Unabhängigkeit.
//   mittel    — Test an einer Tafel mit absoluten Zahlen, die fehlende Zelle für Unabhängigkeit,
//               „mindestens eines“, Urne mit und ohne Zurücklegen im Vergleich.
//   schwierig — P(B) zurückrechnen, Eriks Frage richtig beantworten, Test an einem Text, drei
//               unabhängige Ereignisse.
//   komplex   — Reihen- und Parallelschaltung, eine unabhängige Tafel vollständig aufbauen, die
//               Differenz P(A ∩ B) − P(A) · P(B) als Maß für die Abhängigkeit.
//
// Entscheidungsaufgaben („unabhängig: ja oder nein?“) haben eine rechnerische Begründung in der
// Musterlösung; die Eingabe ist das Wort „ja“ oder „nein“.

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
const P_ = (a, b) => `P<sub>${a}</sub>(${b})`;

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
// „ja“/„nein“ — mit und ohne Großschreibung, auch „unabhängig“/„abhängig“.
function jaNein(roh) {
  const t = String(roh || "").trim().toLowerCase();
  if (/^(ja|j|unabhängig)$/.test(t)) return "ja";
  if (/^(nein|n|abhängig)$/.test(t)) return "nein";
  return "";
}

const WAHRSCH = `<br><span class="progress-note">Gib die Wahrscheinlichkeit auf vier Nachkommastellen, in Prozent oder als Bruch ein.</span>`;
const JANEIN = `<br><span class="progress-note">Antworte mit „ja“ oder „nein“.</span>`;
const ANZAHL = `<br><span class="progress-note">Gib eine ganze Zahl ein.</span>`;
const TOL = 0.0006;
const EPS = 0.002;

// ================= einfach =================

// ---------- E1: Multiplikationsregel ----------
const E1_KANDIDATEN = spaeter(() => {
  const out = [];
  for (let a = 5; a <= 95; a += 5) for (let b = 5; b <= 95; b += 5) out.push({ a: a / 100, b: b / 100 });
  return out;
});
function generateE1() {
  const k = ohneKollision(E1_KANDIDATEN(), (v) => [v.a * v.b, v.a + v.b, v.a + v.b - v.a * v.b, (1 - v.a) * (1 - v.b)], EPS);
  const { a, b } = k;
  return {
    promptHtml: `A und B sind stochastisch unabhängig mit <strong>P(A) = ${num(a, 2)}</strong> und <strong>P(B) = ${num(b, 2)}</strong>.<br><strong>Berechne P(A ∩ B).</strong>` + WAHRSCH,
    correct: a * b,
    tolerance: TOL,
    placeholder: "P(A ∩ B)",
    hinweis: (roh, v) => {
      if (nahe(v, a + b, TOL)) return "Für „A und B“ wird bei Unabhängigkeit multipliziert, nicht addiert.";
      if (nahe(v, a + b - a * b, TOL)) return "Das ist P(A ∪ B) — „A oder B“. Gefragt ist „A und B“.";
      if (nahe(v, (1 - a) * (1 - b), TOL)) return "Das ist die Wahrscheinlichkeit, dass keines eintritt.";
      return "Bei Unabhängigkeit: P(A ∩ B) = P(A) · P(B).";
    },
    tipps: ["Unabhängig heißt: P_A(B) = P(B). Pfadmultiplikation liefert dann P(A) · P(B)."],
    musterloesungHtml: `P(A ∩ B) = P(A) · P(B) = ${num(a, 2)} · ${num(b, 2)} = <strong>${num(a * b)}</strong>`,
  };
}

// ---------- E2: unabhängig oder nicht? ----------
const E2_KANDIDATEN = spaeter(() => {
  const out = [];
  for (let a = 10; a <= 90; a += 10) for (let b = 10; b <= 90; b += 10) {
    const prod = (a * b) / 10000;
    out.push({ a: a / 100, b: b / 100, ab: prod, unabh: true });
    for (const d of [-0.04, -0.02, 0.02, 0.05]) {
      const ab = Math.round((prod + d) * 10000) / 10000;
      if (ab > 0 && ab < Math.min(a, b) / 100) out.push({ a: a / 100, b: b / 100, ab, unabh: false });
    }
  }
  return out;
});
function generateE2() {
  const k = pick(E2_KANDIDATEN());
  const { a, b, ab, unabh } = k;
  const soll = unabh ? "ja" : "nein";
  return {
    promptHtml: `Es gilt <strong>P(A) = ${num(a, 2)}</strong>, <strong>P(B) = ${num(b, 2)}</strong> und <strong>P(A ∩ B) = ${num(ab)}</strong>.<br><strong>Sind A und B stochastisch unabhängig?</strong>` + JANEIN,
    check: (roh) => jaNein(roh) === soll,
    hinweis: (roh) => {
      const j = jaNein(roh);
      if (!j) return "Antworte mit „ja“ oder „nein“.";
      return `Vergleiche P(A) · P(B) = ${num(a * b)} mit P(A ∩ B) = ${num(ab)}.`;
    },
    tipps: ["Multiplikationsregel als Test: Unabhängig genau dann, wenn P(A ∩ B) = P(A) · P(B)."],
    musterloesungHtml: `P(A) · P(B) = ${num(a, 2)} · ${num(b, 2)} = ${num(a * b)} ${unabh ? "=" : "≠"} ${num(ab)} = P(A ∩ B)<br>` +
      `Also: <strong>${unabh ? "ja, unabhängig" : "nein, abhängig"}</strong>.`,
  };
}

// ---------- E3: P_A(B) bei Unabhängigkeit ----------
const E3_KANDIDATEN = spaeter(() => {
  const out = [];
  for (let a = 10; a <= 90; a += 5) for (let b = 5; b <= 95; b += 5) out.push({ a: a / 100, b: b / 100 });
  return out;
});
function generateE3() {
  const k = ohneKollision(E3_KANDIDATEN(), (v) => [v.b, v.a * v.b, v.a, v.b / v.a], EPS);
  const { a, b } = k;
  return {
    promptHtml: `A und B sind unabhängig, <strong>P(A) = ${num(a, 2)}</strong>, <strong>P(B) = ${num(b, 2)}</strong>.<br><strong>Wie groß ist ${P_("A", "B")}?</strong>` + WAHRSCH,
    correct: b,
    tolerance: TOL,
    placeholder: "P_A(B)",
    hinweis: (roh, v) => {
      if (nahe(v, a * b, TOL)) return "Das ist P(A ∩ B). Die Bedingung A ändert bei Unabhängigkeit nichts: P_A(B) = P(B).";
      if (nahe(v, a, TOL)) return "Das ist P(A). Gefragt ist die Wahrscheinlichkeit von B.";
      if (nahe(v, b / a, TOL)) return "P_A(B) = P(A ∩ B) : P(A) = P(A) · P(B) : P(A) = P(B).";
      return "Unabhängig heißt: Das Wissen um A ändert die Wahrscheinlichkeit von B nicht.";
    },
    tipps: ["Definition der Unabhängigkeit."],
    musterloesungHtml: `${P_("A", "B")} = ${bruch("P(A ∩ B)", "P(A)")} = ${bruch("P(A) · P(B)", "P(A)")} = P(B) = <strong>${num(b, 2)}</strong>`,
  };
}

// ---------- E4: eine Zelle unter Unabhängigkeit ----------
function generateE4() {
  const k = ohneKollision(E1_KANDIDATEN(), (v) => [(1 - v.a) * v.b, v.a * v.b, v.b - v.a, (1 - v.a) * (1 - v.b)], EPS);
  const { a, b } = k;
  return {
    promptHtml: `A und B sind unabhängig mit <strong>P(A) = ${num(a, 2)}</strong> und <strong>P(B) = ${num(b, 2)}</strong>.<br><strong>Berechne P(Ā ∩ B).</strong>` + WAHRSCH,
    correct: (1 - a) * b,
    tolerance: TOL,
    placeholder: "P(Ā ∩ B)",
    hinweis: (roh, v) => {
      if (nahe(v, a * b, TOL)) return "Das ist P(A ∩ B). Gesucht ist Ā — nicht A.";
      if (nahe(v, (1 - a) * (1 - b), TOL)) return "Das ist P(Ā ∩ B̄). Gesucht ist B, nicht B̄.";
      return "Mit A und B sind auch Ā und B unabhängig: P(Ā ∩ B) = P(Ā) · P(B).";
    },
    tipps: ["P(Ā) = 1 − P(A)"],
    musterloesungHtml: `P(Ā ∩ B) = P(Ā) · P(B) = ${num(1 - a, 2)} · ${num(b, 2)} = <strong>${num((1 - a) * b)}</strong><br>` +
      `Probe über die Spalte: P(B) − P(A ∩ B) = ${num(b, 2)} − ${num(a * b)} = ${num(b - a * b)} ✓`,
  };
}

// ================= mittel =================

// ---------- M1: Test an einer Tafel mit absoluten Zahlen ----------
const M1_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const N of [100, 200, 400, 500]) for (let i = 2; i <= 8; i++) for (let j = 2; j <= 8; j++) {
    // Ganzzahlig über Zehntel von N — N · 0,1 summiert sich sonst zu 30,000000000000004.
    const A = (N * i) / 10, B = (N * j) / 10;
    const ab = (A * B) / N;
    if (Number.isInteger(ab)) out.push({ N, A, B, AB: ab, unabh: true });
    for (const d of [-6, -3, 4, 8]) {
      const x = Math.round(ab) + d;
      if (x > 2 && x < Math.min(A, B) - 2 && Math.abs(x - ab) > 0.5) out.push({ N, A, B, AB: x, unabh: false });
    }
  }
  return out;
});
function generateM1() {
  const k = pick(M1_KANDIDATEN());
  const { N, A, B, AB, unabh } = k;
  const soll = unabh ? "ja" : "nein";
  return {
    promptHtml: `Eine Umfrage unter ${N} Personen:` +
      `<table class="vft-mini"><tr><th></th><th>B</th><th>B̄</th><th>Σ</th></tr>` +
      `<tr><th>A</th><td>${AB}</td><td>${A - AB}</td><td>${A}</td></tr>` +
      `<tr><th>Ā</th><td>${B - AB}</td><td>${N - A - B + AB}</td><td>${N - A}</td></tr>` +
      `<tr><th>Σ</th><td>${B}</td><td>${N - B}</td><td>${N}</td></tr></table>` +
      `(A ∩ B: ${AB}, A: ${A}, B: ${B}, alle: ${N})<br><strong>Sind A und B stochastisch unabhängig?</strong>` + JANEIN,
    check: (roh) => jaNein(roh) === soll,
    hinweis: (roh) => (jaNein(roh) ? `Vergleiche ${P_("A", "B")} = ${AB}/${A} mit P(B) = ${B}/${N} — oder P(A ∩ B) mit P(A) · P(B).` : "Antworte mit „ja“ oder „nein“."),
    tipps: ["Rechne P(A), P(B), P(A ∩ B) aus der Tafel."],
    musterloesungHtml: `P(A) · P(B) = ${bruch(A, N)} · ${bruch(B, N)} = ${num((A * B) / (N * N))}; P(A ∩ B) = ${bruch(AB, N)} = ${num(AB / N)}<br>` +
      `${unabh ? "Gleich" : "Verschieden"} — also <strong>${unabh ? "unabhängig" : "abhängig"}</strong>. ` +
      `Gleichwertig: ${P_("A", "B")} = ${num(AB / A)} ${unabh ? "=" : "≠"} P(B) = ${num(B / N)}.`,
  };
}

// ---------- M2: die fehlende Zelle für Unabhängigkeit ----------
const M2_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const N of [100, 200, 300, 400, 500, 600]) for (let i = 2; i <= 8; i++) for (let j = 2; j <= 8; j++) {
    // Ganzzahlig über Zehntel von N — N · 0,1 summiert sich sonst zu 30,000000000000004.
    const A = (N * i) / 10, B = (N * j) / 10;
    const ab = (A * B) / N;
    if (!Number.isInteger(ab) || !Number.isInteger(A) || !Number.isInteger(B)) continue;
    out.push({ N, A, B, AB: ab });
  }
  return out;
});
function generateM2() {
  const k = ohneKollision(M2_KANDIDATEN(), (v) => [v.AB, v.A * v.B, (v.A + v.B) / 2, v.B - v.AB], 0.5);
  const { N, A, B, AB } = k;
  return {
    promptHtml: `Von ${N} Personen gehören ${A} zur Gruppe A und ${B} zur Gruppe B.<br><strong>Wie viele müssen zu beiden gehören, damit A und B stochastisch unabhängig sind?</strong>` + ANZAHL,
    correct: AB,
    tolerance: 0.5,
    placeholder: "|A ∩ B|",
    hinweis: (roh, v) => {
      if (nahe(v, A * B, 0.5)) return "Die Multiplikationsregel gilt für Wahrscheinlichkeiten. Mit Anzahlen: |A ∩ B| = |A| · |B| : N.";
      if (nahe(v, B - AB, 0.5)) return "Das ist die Zahl der Personen in B, aber nicht in A.";
      return "P(A ∩ B) = P(A) · P(B), dann mit N zurück in Anzahlen.";
    },
    tipps: [`P(A) = ${A}/${N}, P(B) = ${B}/${N}`],
    musterloesungHtml: `P(A ∩ B) = ${bruch(A, N)} · ${bruch(B, N)} = ${num((A * B) / (N * N))}; ` +
      `|A ∩ B| = ${num((A * B) / (N * N))} · ${N} = <strong>${AB}</strong><br>Kürzer: ${A} · ${B} : ${N} = ${AB}.`,
  };
}

// ---------- M3: mindestens eines ----------
function generateM3() {
  const k = ohneKollision(E1_KANDIDATEN(), (v) => [v.a + v.b - v.a * v.b, v.a + v.b, v.a * v.b, 1 - v.a * v.b], EPS);
  const { a, b } = k;
  const soll = 1 - (1 - a) * (1 - b);
  return {
    promptHtml: `Zwei Rauchmelder arbeiten unabhängig voneinander. Der erste schlägt bei Rauch mit Wahrscheinlichkeit ${num(a, 2)} an, der zweite mit ${num(b, 2)}.<br>` +
      `<strong>Mit welcher Wahrscheinlichkeit schlägt mindestens einer an?</strong>` + WAHRSCH,
    correct: soll,
    tolerance: TOL,
    placeholder: "P(mindestens einer)",
    hinweis: (roh, v) => {
      if (nahe(v, a + b, TOL)) return "Beim Addieren wird der Fall „beide“ doppelt gezählt — die Summe kann sogar über 1 liegen.";
      if (nahe(v, a * b, TOL)) return "Das ist „beide schlagen an“. Gefragt ist „mindestens einer“.";
      if (nahe(v, 1 - a * b, TOL)) return "Das Gegenteil von „mindestens einer“ ist „keiner“, nicht „nicht beide“.";
      return "Gegenereignis: Keiner schlägt an.";
    },
    tipps: ["P(keiner) = (1 − p₁) · (1 − p₂) — auch die Gegenereignisse sind unabhängig."],
    musterloesungHtml: `P(keiner) = ${num(1 - a, 2)} · ${num(1 - b, 2)} = ${num((1 - a) * (1 - b))}<br>P(mindestens einer) = 1 − ${num((1 - a) * (1 - b))} = <strong>${num(soll)}</strong>`,
  };
}

// ---------- M4: mit und ohne Zurücklegen ----------
const M4_KANDIDATEN = spaeter(() => {
  const out = [];
  // Brüche wie 3/7 sind erlaubt: Eingegeben wird auf vier Stellen gerundet oder als Bruch.
  for (let n = 5; n <= 16; n++) for (let r = 2; r < n; r++) out.push({ n, r });
  return out;
});
function generateM4() {
  const k = ohneFeldKollision(M4_KANDIDATEN(), (v) => [[v.r / v.n, (v.r - 1) / (v.n - 1)], [(v.r - 1) / (v.n - 1), v.r / v.n, (v.r / v.n) * ((v.r - 1) / (v.n - 1))]], EPS);
  const { n, r } = k;
  return {
    promptHtml: `In einer Urne liegen ${r} grüne und ${n - r} rote Kugeln; es werden zwei gezogen. G: „grün beim ersten Zug“, H: „grün beim zweiten Zug“.<br>` +
      `<strong>Bestimme ${P_("G", "H")} — einmal mit, einmal ohne Zurücklegen.</strong>` + WAHRSCH,
    felder: [
      { name: `mit Zurücklegen: ${P_("G", "H")} =`, soll: r / n, toleranz: TOL, hinweis: (roh, v) => (nahe(v, (r - 1) / (n - 1), TOL) ? "Mit Zurücklegen ist die Urne beim zweiten Zug wieder vollständig." : "Die zweite Ziehung „weiß nichts“ von der ersten.") },
      { name: `ohne Zurücklegen: ${P_("G", "H")} =`, soll: (r - 1) / (n - 1), toleranz: TOL, hinweis: (roh, v) => (nahe(v, r / n, TOL) ? "Ohne Zurücklegen fehlt eine grüne Kugel — und eine Kugel insgesamt." : nahe(v, (r / n) * ((r - 1) / (n - 1)), TOL) ? "Das ist der Pfad P(G ∩ H). Am Ast steht nur die Wahrscheinlichkeit der zweiten Stufe." : "Nach einer grünen Kugel liegen noch " + (r - 1) + " grüne von " + (n - 1) + " Kugeln in der Urne.") },
    ],
    tipps: ["Vergleiche jeweils mit P(H) = " + r + "/" + n + " — gleich heißt unabhängig."],
    musterloesungHtml: `Mit Zurücklegen: ${P_("G", "H")} = ${bruch(r, n)} = <strong>${num(r / n)}</strong> = P(H) — unabhängig.<br>` +
      `Ohne Zurücklegen: ${P_("G", "H")} = ${bruch(r - 1, n - 1)} = <strong>${num((r - 1) / (n - 1))}</strong> ≠ P(H) = ${num(r / n)} — abhängig.`,
  };
}

// ================= schwierig =================

// ---------- S1: P(B) zurückrechnen ----------
const S1_KANDIDATEN = spaeter(() => {
  const out = [];
  for (let a = 10; a <= 90; a += 10) for (let b = 5; b <= 95; b += 5) out.push({ a: a / 100, b: b / 100, ab: (a * b) / 10000 });
  return out;
});
function generateS1() {
  const k = ohneKollision(S1_KANDIDATEN(), (v) => [v.b, v.ab * v.a, v.a - v.ab, v.ab], EPS);
  const { a, b, ab } = k;
  return {
    promptHtml: `A und B sind unabhängig. Es gilt <strong>P(A) = ${num(a, 2)}</strong> und <strong>P(A ∩ B) = ${num(ab)}</strong>.<br><strong>Berechne P(B).</strong>` + WAHRSCH,
    correct: b,
    tolerance: TOL,
    placeholder: "P(B)",
    hinweis: (roh, v) => {
      if (nahe(v, ab * a, TOL)) return "Geteilt, nicht multipliziert: P(B) = P(A ∩ B) : P(A).";
      if (nahe(v, a - ab, TOL)) return "Das ist P(A ∩ B̄).";
      if (nahe(v, ab, TOL)) return "Das ist P(A ∩ B) selbst.";
      return "P(A ∩ B) = P(A) · P(B) nach P(B) umstellen.";
    },
    tipps: ["Multiplikationsregel umstellen."],
    musterloesungHtml: `P(B) = ${bruch("P(A ∩ B)", "P(A)")} = ${bruch(num(ab), num(a, 2))} = <strong>${num(b, 2)}</strong><br><strong>Probe:</strong> ${num(a, 2)} · ${num(b, 2)} = ${num(ab)} ✓`,
  };
}

// ---------- S2: Eriks Frage richtig beantwortet ----------
const S2_KANDIDATEN = spaeter(() => {
  const out = [];
  for (let w = 40; w <= 60; w++) for (let l = 30; l <= 50; l++) for (let wl = 20; wl <= Math.min(w, l) - 5; wl += 2) {
    out.push({ w: w / 100, l: l / 100, wl: wl / 100 });
  }
  return out;
});
function generateS2() {
  const k = ohneKollision(S2_KANDIDATEN(), (v) => [1 - v.w - v.l + v.wl, (1 - v.w) * (1 - v.l), 1 - v.w - v.l, 1 - v.wl], EPS);
  const { w, l, wl } = k;
  const soll = 1 - w - l + wl;
  return {
    promptHtml: `Bei einer Umfrage waren ${num(w * 100)} % der Befragten weiblich, ${num(l * 100)} % hatten lange Haare, und ${num(wl * 100)} % waren weiblich mit langen Haaren.<br>` +
      `<strong>Wie groß ist der Anteil der Männer mit kurzen Haaren?</strong>` + WAHRSCH,
    correct: soll,
    tolerance: TOL,
    placeholder: "P(m ∩ k)",
    hinweis: (roh, v) => {
      if (nahe(v, (1 - w) * (1 - l), TOL)) return "Das ist Eriks Fehler: Die Multiplikationsregel gilt nur bei Unabhängigkeit — und Geschlecht und Haarlänge sind hier nicht unabhängig. Rechne mit der Vierfeldertafel.";
      if (nahe(v, 1 - w - l, TOL)) return "Der Anteil „weiblich mit langen Haaren“ wurde doppelt abgezogen.";
      if (nahe(v, 1 - wl, TOL)) return "Das ist der Anteil aller, die nicht weiblich-langhaarig sind.";
      return "Vierfeldertafel: Zeilen weiblich/männlich, Spalten lang/kurz.";
    },
    tipps: ["P(w ∩ k) = P(w) − P(w ∩ l)", "P(m ∩ k) = P(k) − P(w ∩ k)"],
    musterloesungHtml: `P(w ∩ k) = ${num(w, 2)} − ${num(wl, 2)} = ${num(w - wl, 2)}; P(k) = ${num(1 - l, 2)}<br>P(m ∩ k) = ${num(1 - l, 2)} − ${num(w - wl, 2)} = <strong>${num(soll, 2)}</strong><br>` +
      `Erik hätte ${num(1 - w, 2)} · ${num(1 - l, 2)} = ${num((1 - w) * (1 - l))} gerechnet — das stimmt nur, wenn P(w ∩ l) = P(w) · P(l) = ${num(w * l)} wäre; tatsächlich ist es ${num(wl, 2)}.`,
  };
}

// ---------- S3: Test an einem Text ----------
const S3_KANDIDATEN = spaeter(() => {
  const out = [];
  for (let s = 20; s <= 60; s += 10) for (let e = 10; e <= 50; e += 10) {
    const prod = (s * e) / 100;
    out.push({ s, e, se: prod, unabh: true });
    for (const d of [-4, -2, 3, 6]) if (prod + d > 1 && prod + d < Math.min(s, e)) out.push({ s, e, se: prod + d, unabh: false });
  }
  return out;
});
function generateS3() {
  const k = pick(S3_KANDIDATEN());
  const { s, e, se, unabh } = k;
  const soll = unabh ? "ja" : "nein";
  return {
    promptHtml: `Das Gesundheitsamt befragt 100 Personen: ${s} tragen einen Schal (S), ${e} sind erkältet (E), ${num(se)} tragen einen Schal und sind erkältet.<br>` +
      `<strong>Sind „Schal tragen“ und „erkältet sein“ stochastisch unabhängig?</strong>` + JANEIN,
    check: (roh) => jaNein(roh) === soll,
    hinweis: (roh) => (jaNein(roh) ? `Vergleiche ${P_("S", "E")} = ${num(se)}/${s} mit P(E) = ${e}/100.` : "Antworte mit „ja“ oder „nein“."),
    tipps: ["P_S(E) ausrechnen und mit P(E) vergleichen."],
    musterloesungHtml: `${P_("S", "E")} = ${bruch(num(se), s)} = ${num(se / s)}; P(E) = ${num(e / 100, 2)}<br>` +
      `${unabh ? "Gleich — also unabhängig." : "Verschieden — also abhängig."} <strong>${soll}</strong><br>` +
      (unabh ? "" : "Achtung: Abhängig heißt nicht „der Schal verursacht die Erkältung“ — beides kann vom kalten Wetter abhängen (Korrelation ist keine Kausalität)."),
  };
}

// ---------- S4: drei unabhängige Ereignisse ----------
const S4_KANDIDATEN = spaeter(() => {
  const out = [];
  const ps = [0.5, 0.6, 0.7, 0.8, 0.9, 0.95];
  for (const a of ps) for (const b of ps) for (const c of ps) {
    if (a > b || b > c) continue;
    out.push({ p: [a, b, c] });
  }
  return out;
});
function generateS4() {
  const k = ohneKollision(S4_KANDIDATEN(), (v) => {
    const [a, b, c] = v.p;
    return [(1 - a) * (1 - b) * (1 - c), a * b * c, 1 - a * b * c, (1 - a) + (1 - b) + (1 - c)];
  }, 0.0008);
  const [a, b, c] = k.p;
  const soll = (1 - a) * (1 - b) * (1 - c);
  return {
    promptHtml: `Drei Prüfungen werden unabhängig voneinander bestanden, mit den Wahrscheinlichkeiten ${num(a, 2)}, ${num(b, 2)} und ${num(c, 2)}.<br>` +
      `<strong>Mit welcher Wahrscheinlichkeit wird keine der drei bestanden?</strong>` +
      `<br><span class="progress-note">Gib die Wahrscheinlichkeit auf fünf Nachkommastellen oder in Prozent ein.</span>`,
    correct: soll,
    tolerance: 0.00006,
    placeholder: "P(keine)",
    hinweis: (roh, v) => {
      if (nahe(v, a * b * c, 0.00006)) return "Das ist „alle drei bestanden“. Gesucht ist „keine“ — mit den Gegenwahrscheinlichkeiten.";
      if (nahe(v, 1 - a * b * c, 0.00006)) return "Das ist „nicht alle drei“. „Keine“ ist viel seltener.";
      if (nahe(v, (1 - a) + (1 - b) + (1 - c), 0.00006)) return "Bei „und“ wird multipliziert.";
      return "Multipliziere die drei Gegenwahrscheinlichkeiten.";
    },
    tipps: ["Bei Unabhängigkeit gilt die Multiplikationsregel auch für drei Ereignisse — und für ihre Gegenereignisse."],
    musterloesungHtml: `P(keine) = ${num(1 - a, 2)} · ${num(1 - b, 2)} · ${num(1 - c, 2)} = <strong>${num(soll, 5)}</strong>`,
  };
}

// ================= komplex =================

// ---------- K1: Reihenschaltung ----------
function generateK1() {
  const k = ohneKollision(S4_KANDIDATEN(), (v) => {
    const [a, b, c] = v.p;
    return [a * b * c, 1 - (1 - a) * (1 - b) * (1 - c), Math.min(a, b, c), (a + b + c) / 3];
  }, 0.0008);
  const [a, b, c] = k.p;
  const soll = a * b * c;
  return {
    promptHtml: `Eine Maschine besteht aus drei Bauteilen, die unabhängig voneinander funktionieren — mit den Wahrscheinlichkeiten ${num(a, 2)}, ${num(b, 2)} und ${num(c, 2)}. Sie läuft nur, wenn <strong>alle drei</strong> funktionieren (Reihenschaltung).<br>` +
      `<strong>Mit welcher Wahrscheinlichkeit läuft die Maschine?</strong>` +
      `<br><span class="progress-note">Gib die Wahrscheinlichkeit auf fünf Nachkommastellen oder in Prozent ein.</span>`,
    correct: soll,
    tolerance: 0.00006,
    placeholder: "P(läuft)",
    hinweis: (roh, v) => {
      if (nahe(v, 1 - (1 - a) * (1 - b) * (1 - c), 0.00006)) return "Das wäre die Parallelschaltung — mindestens ein Bauteil funktioniert.";
      if (nahe(v, Math.min(a, b, c), 0.00006)) return "Das schwächste Bauteil begrenzt, aber auch die anderen können ausfallen: Alle drei müssen funktionieren.";
      if (nahe(v, (a + b + c) / 3, 0.00006)) return "Ein Mittelwert beschreibt kein „und“.";
      return "„Alle drei“ — Multiplikationsregel.";
    },
    tipps: ["Die Maschine ist ein Pfad durch drei Stufen."],
    musterloesungHtml: `P(läuft) = ${num(a, 2)} · ${num(b, 2)} · ${num(c, 2)} = <strong>${num(soll, 5)}</strong> — kleiner als die kleinste Einzelwahrscheinlichkeit.`,
  };
}

// ---------- K2: Parallelschaltung ----------
function generateK2() {
  const k = ohneKollision(S4_KANDIDATEN(), (v) => {
    const [a, b, c] = v.p;
    return [1 - (1 - a) * (1 - b) * (1 - c), a * b * c, Math.max(a, b, c), (1 - a) * (1 - b) * (1 - c)];
  }, 0.0008);
  const [a, b, c] = k.p;
  const soll = 1 - (1 - a) * (1 - b) * (1 - c);
  return {
    promptHtml: `Drei unabhängige Pumpen fördern Wasser; jede funktioniert mit der Wahrscheinlichkeit ${num(a, 2)}, ${num(b, 2)} bzw. ${num(c, 2)}. Die Versorgung ist gesichert, wenn <strong>mindestens eine</strong> läuft (Parallelschaltung).<br>` +
      `<strong>Mit welcher Wahrscheinlichkeit ist die Versorgung gesichert?</strong>` +
      `<br><span class="progress-note">Gib die Wahrscheinlichkeit auf fünf Nachkommastellen oder in Prozent ein.</span>`,
    correct: soll,
    tolerance: 0.00006,
    placeholder: "P(gesichert)",
    hinweis: (roh, v) => {
      if (nahe(v, a * b * c, 0.00006)) return "Das wäre die Reihenschaltung — alle drei laufen.";
      if (nahe(v, Math.max(a, b, c), 0.00006)) return "Die beste Pumpe allein reicht nicht als Antwort: Die anderen erhöhen die Sicherheit weiter.";
      if (nahe(v, (1 - a) * (1 - b) * (1 - c), 0.00006)) return "Das ist die Wahrscheinlichkeit, dass alle ausfallen. Jetzt noch das Gegenereignis.";
      return "Gegenereignis: alle drei fallen aus.";
    },
    tipps: ["P(alle fallen aus) = (1 − p₁) · (1 − p₂) · (1 − p₃)"],
    musterloesungHtml: `P(alle aus) = ${num(1 - a, 2)} · ${num(1 - b, 2)} · ${num(1 - c, 2)} = ${num((1 - a) * (1 - b) * (1 - c), 5)}<br>P(gesichert) = 1 − ${num((1 - a) * (1 - b) * (1 - c), 5)} = <strong>${num(soll, 5)}</strong>`,
  };
}

// ---------- K3: eine unabhängige Tafel aufbauen ----------
function generateK3() {
  const k = ohneFeldKollision(M2_KANDIDATEN(), (v) => [
    [v.AB, v.A * v.B, v.B - v.AB],
    [v.N - v.A - v.B + v.AB, v.N - v.A - v.B, (v.N - v.A) * (v.N - v.B)],
  ], 0.5);
  const { N, A, B, AB } = k;
  return {
    promptHtml: `Von ${N} Personen gehören ${A} zu A und ${B} zu B; A und B sollen stochastisch unabhängig sein.<br>` +
      `<strong>Bestimme die Anzahl der Personen in A ∩ B und in Ā ∩ B̄.</strong>` + ANZAHL,
    felder: [
      { name: "|A ∩ B| =", soll: AB, toleranz: 0.5, hinweis: (roh, v) => (nahe(v, A * B, 0.5) ? "Noch durch N teilen: |A| · |B| : N." : "P(A ∩ B) = P(A) · P(B), in Anzahlen zurückrechnen.") },
      { name: "|Ā ∩ B̄| =", soll: N - A - B + AB, toleranz: 0.5, hinweis: (roh, v) => (nahe(v, N - A - B, 0.5) ? "A ∩ B wurde doppelt abgezogen." : "Über die Randsummen der Tafel — oder |Ā| · |B̄| : N.") },
    ],
    tipps: ["|A ∩ B| = |A| · |B| : N", "|Ā ∩ B̄| = |Ā| · |B̄| : N — bei Unabhängigkeit gilt die Regel für alle vier Felder."],
    musterloesungHtml: `|A ∩ B| = ${A} · ${B} : ${N} = <strong>${AB}</strong><br>|Ā ∩ B̄| = ${N - A} · ${N - B} : ${N} = <strong>${N - A - B + AB}</strong><br>` +
      `Probe über die Tafel: ${N} − ${A} − ${B} + ${AB} = ${N - A - B + AB} ✓`,
  };
}

// ---------- K4: wie stark abhängig? ----------
const K4_KANDIDATEN = spaeter(() => {
  const out = [];
  for (let a = 20; a <= 80; a += 10) for (let x = 10; x <= 90; x += 10) for (let y = 10; y <= 90; y += 10) {
    if (x === y) continue;
    out.push({ a: a / 100, x: x / 100, y: y / 100 });
  }
  return out;
});
function generateK4() {
  const k = ohneKollision(K4_KANDIDATEN(), (v) => {
    const ab = v.a * v.x, b = v.a * v.x + (1 - v.a) * v.y;
    return [ab - v.a * b, v.a * b - ab, ab - v.a * v.y, v.x - v.y];
  }, EPS);
  const { a, x, y } = k;
  const ab = a * x, b = a * x + (1 - a) * y;
  const d = ab - a * b;
  return {
    promptHtml: `Es gilt <strong>P(A) = ${num(a, 2)}</strong>, <strong>${P_("A", "B")} = ${num(x, 2)}</strong> und <strong>${P_("Ā", "B")} = ${num(y, 2)}</strong>.<br>` +
      `Wie weit sind A und B von der Unabhängigkeit entfernt? <strong>Berechne d = P(A ∩ B) − P(A) · P(B).</strong>` +
      `<br><span class="progress-note">d kann negativ sein. Vier Nachkommastellen.</span>`,
    correct: d,
    tolerance: TOL,
    placeholder: "d",
    hinweis: (roh, v) => {
      if (nahe(v, -d, TOL)) return "Vorzeichen: P(A ∩ B) minus P(A) · P(B).";
      if (nahe(v, ab - a * y, TOL)) return "P(B) ist nicht P_Ā(B): P(B) enthält beide Pfade.";
      if (nahe(v, x - y, TOL)) return "Der Unterschied der Äste zeigt die Abhängigkeit auch — gefragt ist aber d.";
      return "Erst P(A ∩ B) und P(B) aus dem Baum.";
    },
    tipps: ["P(A ∩ B) = P(A) · P_A(B)", "P(B) = beide Pfade nach B"],
    musterloesungHtml: `P(A ∩ B) = ${num(ab)}, P(B) = ${num(b)}, P(A) · P(B) = ${num(a * b)}<br>d = ${num(ab)} − ${num(a * b)} = <strong>${num(d)}</strong><br>` +
      `Allgemein ist d = P(A) · P(Ā) · (P<sub>A</sub>(B) − P<sub>Ā</sub>(B)) = ${num(a * (1 - a) * (x - y))}: d = 0 genau dann, wenn die Äste gleich sind — im Flächenmodell, wenn die Schnitte gleich hoch liegen.`,
  };
}

export const AUFGABEN = [
  { schwierigkeit: "einfach", titel: "Die Multiplikationsregel", generate: generateE1 },
  { schwierigkeit: "einfach", titel: "Unabhängig — ja oder nein?", generate: generateE2 },
  { schwierigkeit: "einfach", titel: "Die Bedingung ändert nichts", generate: generateE3 },
  { schwierigkeit: "einfach", titel: "Auch das Gegenereignis", generate: generateE4 },
  { schwierigkeit: "mittel", titel: "Test an einer Umfrage", generate: generateM1 },
  { schwierigkeit: "mittel", titel: "Die Zelle für Unabhängigkeit", generate: generateM2 },
  { schwierigkeit: "mittel", titel: "Mindestens einer", generate: generateM3 },
  { schwierigkeit: "mittel", titel: "Mit und ohne Zurücklegen", generate: generateM4 },
  { schwierigkeit: "schwierig", titel: "P(B) zurückrechnen", generate: generateS1 },
  { schwierigkeit: "schwierig", titel: "Eriks Frage richtig beantwortet", generate: generateS2 },
  { schwierigkeit: "schwierig", titel: "Schal und Erkältung", generate: generateS3 },
  { schwierigkeit: "schwierig", titel: "Drei unabhängige Ereignisse", generate: generateS4 },
  { schwierigkeit: "komplex", titel: "Reihenschaltung", generate: generateK1 },
  { schwierigkeit: "komplex", titel: "Parallelschaltung", generate: generateK2 },
  { schwierigkeit: "komplex", titel: "Eine unabhängige Tafel aufbauen", generate: generateK3 },
  { schwierigkeit: "komplex", titel: "Wie stark abhängig?", generate: generateK4 },
];
