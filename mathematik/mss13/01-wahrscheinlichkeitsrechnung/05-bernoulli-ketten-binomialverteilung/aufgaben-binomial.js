// Die sechzehn Übungsaufgaben zu „Bernoulli-Ketten und Binomialverteilung“ — vier je Stufe.
//
//   einfach   — ein Schritt: fehlende Wahrscheinlichkeit, Erwartungswert aus einer Tabelle,
//               Pfade zählen, genau k Treffer.
//   mittel    — zwei Schritte: Standardabweichung, fairer Einsatz, höchstens k Treffer, μ und σ.
//   schwierig — mit einer Stolperstelle: mindestens (Gegenereignis), zwischen (zwei Grenzen),
//               p > 0,5 (Nieten zählen), Mindestlänge n (Logarithmus, aufrunden).
//   komplex   — Sachaufgaben, in denen erst modelliert werden muss: Erwartungswert und seine
//               Wahrscheinlichkeit, k gesucht, p gesucht, mehrstufig (drei Lieferungen).
//
// Alle Zahlen entstehen aus vorher gefilterten Listen, nie durch Verwerfen und Neuziehen. Gefiltert
// wird auf zwei Dinge: Die Lösung muss sinnvoll sein (keine Wahrscheinlichkeit, die als 0,0000
// erscheint), und die Werte, auf die die Fehlerhinweise anspringen, müssen untereinander und von
// der Lösung deutlich verschieden sein — sonst bekäme eine falsche Rechnung ein ✓.
//
// Wahrscheinlichkeiten werden mit vier Nachkommastellen eingegeben. Die Toleranz von 0,0006 lässt
// das Runden und Tabellenwerte zu; Fehlerwerte liegen mindestens 0,0015 auseinander.

"use strict";

// ---------- Zahlen ----------

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
// Vergleich mit Toleranz — nie über ===: 0,1 + 0,2 ist nicht 0,3.
function nahe(val, soll, tol) {
  return Number.isFinite(val) && Number.isFinite(soll) && Math.abs(val - soll) <= tol;
}
function paarweiseVerschieden(werte, eps) {
  const echt = werte.filter((x) => Number.isFinite(x));
  return echt.every((x, i) => echt.every((y, j) => i === j || Math.abs(x - y) > eps));
}
// Wählt aus einer VORHER gefilterten Liste — nicht durch Verwerfen und Neuziehen.
function ohneKollision(kandidaten, werte, eps) {
  const sauber = kandidaten.filter((k) => paarweiseVerschieden(werte(k), eps));
  if (!sauber.length) throw new Error("Aufgabengenerator ohne gültige Kandidaten");
  if (kandidaten.length > 20 && sauber.length < 2) throw new Error("Nur noch ein Kandidat übrig — vermutlich steht ein Wert doppelt in der Liste");
  return pick(sauber);
}
// Die Kandidatenlisten werden erst beim ersten Würfeln gebaut, nicht beim Laden der Seite.
function spaeter(bauen) {
  let liste = null;
  return () => (liste ??= bauen());
}
function bruch(z, n) {
  return `<span class="bruch"><span class="z">${z}</span><span class="n">${n}</span></span>`;
}
function binomHtml(n, k) {
  return `<span class="binom"><span>${n}</span><span>${k}</span></span>`;
}

// Eingaben: Dezimalkomma, echtes Minus, auch „24,61 %“ und Tausenderpunkte.
export function parseZahl(raw) {
  if (raw == null) return NaN;
  let s = String(raw).trim().replace(/\s/g, "").replace(/−/g, "-").replace(/€/g, "");
  const prozent = s.endsWith("%");
  if (prozent) s = s.slice(0, -1);
  if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) s = s.replace(/\./g, "");
  s = s.replace(",", ".");
  if (!/^-?\d*\.?\d+$/.test(s)) return NaN;
  const v = parseFloat(s);
  return prozent ? v / 100 : v;
}

// ---------- Binomialverteilung ----------

function binom(n, k) {
  if (k < 0 || k > n) return 0;
  k = Math.min(k, n - k);
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
  return Math.round(r);
}
function B(n, p, k) {
  if (k < 0 || k > n) return 0;
  return binom(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
}
function F(n, p, k) {
  if (k < 0) return 0;
  let s = 0;
  for (let i = 0; i <= Math.min(k, n); i++) s += B(n, p, i);
  return Math.min(1, s);
}

const TOL = 0.0006;   // Eingabe mit vier Nachkommastellen, Tabellenwerte eingeschlossen
const EPS = 0.0015;   // Mindestabstand der Fehlerwerte untereinander und zur Lösung
const PLATZ = "auf 4 Nachkommastellen";

// Die Trefferwahrscheinlichkeiten der Aufgaben — mit ihrer Schreibweise im Text.
const P_LISTE = [0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5];
function pText(p) {
  return num(p, 2);
}

// ================= einfach =================

// E1 — die fehlende Wahrscheinlichkeit einer Verteilung
const E1_KANDIDATEN = spaeter(() => {
  const out = [];
  const xsListe = [[0, 1, 2, 3], [1, 2, 3, 4], [0, 2, 4, 6], [2, 4, 6, 8], [0, 1, 5, 10], [-1, 0, 1, 2]];
  for (const xs of xsListe) {
    for (let a = 5; a <= 60; a += 5) for (let b = 5; b <= 60; b += 5) for (let c = 5; c <= 60; c += 5) {
      const d = 100 - a - b - c;
      if (d < 5 || d > 60) continue;
      for (let fehlt = 0; fehlt < 4; fehlt++) out.push({ xs, ps: [a, b, c, d].map((v) => v / 100), fehlt });
    }
  }
  return out;
});
function tabelle(xs, ps, fehlt, kopf = "x") {
  const zelle = (i) => (i === fehlt ? "?" : num(ps[i], 2));
  return `<table class="bk-tabelle"><tr><th>${kopf}</th>${xs.map((x) => `<td>${num(x)}</td>`).join("")}</tr>` +
    `<tr><th>P(X = ${kopf})</th>${ps.map((_, i) => `<td>${zelle(i)}</td>`).join("")}</tr></table>`;
}
function generateE1() {
  const k = ohneKollision(E1_KANDIDATEN(), (v) => {
    const bekannt = v.ps.filter((_, i) => i !== v.fehlt).reduce((s, x) => s + x, 0);
    return [v.ps[v.fehlt], bekannt];
  }, EPS);
  const { xs, ps, fehlt } = k;
  const bekannt = ps.filter((_, i) => i !== fehlt);
  const summe = bekannt.reduce((s, x) => s + x, 0);
  const loesung = ps[fehlt];
  return {
    promptHtml: `Die Zufallsgröße X hat die folgende Wahrscheinlichkeitsverteilung. Eine Wahrscheinlichkeit fehlt.` +
      tabelle(xs, ps, fehlt) + `<strong>Bestimme P(X = ${num(xs[fehlt])}).</strong>`,
    correct: loesung,
    tolerance: TOL,
    placeholder: "P(X = …)",
    hinweis: (roh, val) => {
      if (nahe(val, summe, TOL)) return `Das ist die Summe der bekannten Wahrscheinlichkeiten. Sie ist der Teil, der schon <strong>vergeben</strong> ist — die fehlende Wahrscheinlichkeit ist der Rest bis 1.`;
      if (val > 1 || val < 0) return `Eine Wahrscheinlichkeit liegt immer zwischen 0 und 1.`;
      return `Alle Wahrscheinlichkeiten einer Verteilung ergeben zusammen 1.`;
    },
    tipps: [`Was ergibt die Summe aller Wahrscheinlichkeiten einer Verteilung?`, `Addiere die drei bekannten Werte und ziehe sie von 1 ab.`],
    musterloesungHtml: `Alle Wahrscheinlichkeiten zusammen ergeben 1:<br>` +
      `P(X = ${num(xs[fehlt])}) = 1 − (${bekannt.map((x) => num(x, 2)).join(" + ")}) = 1 − ${num(summe, 2)} = <strong>${num(loesung, 2)}</strong>`,
  };
}

// E2 — Erwartungswert aus einer Verteilungstabelle
const E2_KANDIDATEN = spaeter(() => {
  const out = [];
  const xsListe = [[0, 1, 2, 3], [1, 2, 3, 4], [0, 2, 5, 10], [0, 1, 4, 8], [1, 3, 5, 10], [0, 5, 10, 20]];
  for (const xs of xsListe) {
    for (let a = 10; a <= 50; a += 5) for (let b = 10; b <= 50; b += 5) for (let c = 5; c <= 40; c += 5) {
      const d = 100 - a - b - c;
      if (d < 5 || d > 40) continue;
      out.push({ xs, ps: [a, b, c, d].map((v) => v / 100) });
    }
  }
  return out;
});
function generateE2() {
  const k = ohneKollision(E2_KANDIDATEN(), (v) => {
    const E = v.xs.reduce((s, x, i) => s + x * v.ps[i], 0);
    const mittel = v.xs.reduce((s, x) => s + x, 0) / v.xs.length;
    return [E, mittel];
  }, 0.01);
  const { xs, ps } = k;
  const E = xs.reduce((s, x, i) => s + x * ps[i], 0);
  const mittel = xs.reduce((s, x) => s + x, 0) / xs.length;
  return {
    promptHtml: `Die Zufallsgröße X hat die folgende Wahrscheinlichkeitsverteilung.` + tabelle(xs, ps, -1) +
      `<strong>Berechne den Erwartungswert E(X).</strong>`,
    correct: E,
    tolerance: 0.001,
    placeholder: "E(X)",
    hinweis: (roh, val) => {
      if (nahe(val, mittel, 0.001)) return `Das ist das einfache Mittel der Werte. Beim Erwartungswert zählt jeder Wert so stark, wie er <strong>wahrscheinlich</strong> ist: x · P(X = x), dann addieren.`;
      return `E(X) = x<sub>1</sub> · P(X = x<sub>1</sub>) + … + x<sub>4</sub> · P(X = x<sub>4</sub>).`;
    },
    tipps: [`Multipliziere jeden Wert mit seiner Wahrscheinlichkeit.`, `Addiere die vier Produkte.`],
    musterloesungHtml: `E(X) = ${xs.map((x, i) => `${num(x)} · ${num(ps[i], 2)}`).join(" + ")} = ${xs.map((x, i) => num(x * ps[i], 4)).join(" + ")} = <strong>${num(E, 4)}</strong>`,
  };
}

// E3 — Pfade zählen: der Binomialkoeffizient
const E3_KANDIDATEN = spaeter(() => {
  const out = [];
  for (let n = 5; n <= 12; n++) for (let k = 2; k <= n - 2; k++) out.push({ n, k, art: n % 2 ? "kette" : "auswahl" }, { n, k, art: n % 2 ? "auswahl" : "kette" });
  return out;
});
function variationen(n, k) {
  let r = 1;
  for (let i = 0; i < k; i++) r *= n - i;
  return r;
}
function generateE3() {
  const k0 = ohneKollision(E3_KANDIDATEN(), (v) => [binom(v.n, v.k), variationen(v.n, v.k), Math.pow(2, v.n)], 0.5);
  const { n, k, art } = k0;
  const c = binom(n, k), perm = variationen(n, k), alle = Math.pow(2, n);
  const prompt = art === "kette"
    ? `Eine Bernoulli-Kette hat die Länge n = ${n}. <strong>Wie viele Pfade des Baumdiagramms enthalten genau ${k} Treffer?</strong>`
    : `Aus einer Gruppe von ${n} Personen sollen ${k} für eine Umfrage ausgewählt werden; die Reihenfolge spielt keine Rolle. <strong>Wie viele Möglichkeiten gibt es?</strong>`;
  return {
    promptHtml: prompt,
    correct: c,
    tolerance: 0.5,
    placeholder: "Anzahl",
    hinweis: (roh, val) => {
      if (nahe(val, perm, 0.5)) return `Das ist ${n} · ${n - 1} · … — so zählt man, wenn die <strong>Reihenfolge</strong> eine Rolle spielt. Jede Auswahl kommt darin ${k}! = ${variationen(k, k)}-mal vor; teile noch durch ${k}!.`;
      if (nahe(val, alle, 0.5)) return `2<sup>${n}</sup> sind <strong>alle</strong> Pfade des Baums. Gefragt sind nur die mit genau ${k} Treffern.`;
      return `Gesucht ist der Binomialkoeffizient ${binomHtml(n, k)}.`;
    },
    tipps: [`Das ist die Zahl der Möglichkeiten, ${k} von ${n} Plätzen auszuwählen: ${binomHtml(n, k)}.`, `${binomHtml(n, k)} = ${bruch(`${n}!`, `${k}! · ${n - k}!`)}`],
    musterloesungHtml: `${binomHtml(n, k)} = ${bruch(Array.from({ length: k }, (_, i) => n - i).join(" · "), Array.from({ length: k }, (_, i) => k - i).join(" · "))} = ${bruch(num(perm), num(variationen(k, k)))} = <strong>${num(c)}</strong>`,
  };
}

// E4 — genau k Treffer mit der Formel von Bernoulli
const E4_KONTEXTE = [
  { text: (n) => `Ein fairer Würfel wird ${n}-mal geworfen.`, was: (k) => `genau ${k}-mal eine Sechs`, p: 1 / 6, pZ: "1", pN: "6", qZ: "5" },
  { text: (n) => `Eine faire Münze wird ${n}-mal geworfen.`, was: (k) => `genau ${k}-mal „Zahl“`, p: 0.5, pZ: "1", pN: "2", qZ: "1" },
  { text: (n) => `Ein Tetraeder-Würfel mit den Zahlen 1 bis 4 wird ${n}-mal geworfen.`, was: (k) => `genau ${k}-mal die Eins`, p: 0.25, pZ: "1", pN: "4", qZ: "3" },
];
const E4_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const ctx of E4_KONTEXTE) for (let n = 4; n <= 10; n++) for (let k = 1; k <= n - 1; k++) {
    if (B(n, ctx.p, k) >= 0.01) out.push({ ctx, n, k });
  }
  return out;
});
function generateE4() {
  const v0 = ohneKollision(E4_KANDIDATEN(), (v) => {
    const { n, k } = v, p = v.ctx.p;
    return [B(n, p, k), Math.pow(p, k) * Math.pow(1 - p, n - k), binom(n, k) * Math.pow(p, n - k) * Math.pow(1 - p, k), binom(n, k) * Math.pow(p, k)];
  }, EPS);
  const { ctx, n, k } = v0;
  const p = ctx.p;
  const P = B(n, p, k), pfad = Math.pow(p, k) * Math.pow(1 - p, n - k);
  const vertauscht = binom(n, k) * Math.pow(p, n - k) * Math.pow(1 - p, k);
  const ohneNiete = binom(n, k) * Math.pow(p, k);
  return {
    promptHtml: `${ctx.text(n)} <strong>Mit welcher Wahrscheinlichkeit erhält man ${ctx.was(k)}?</strong><br><span class="progress-note">Antworte ${PLATZ}.</span>`,
    correct: P,
    tolerance: TOL,
    placeholder: "P(X = k)",
    hinweis: (roh, val) => {
      if (nahe(val, pfad, TOL)) return `Das ist die Wahrscheinlichkeit <strong>eines</strong> Pfades. Es gibt aber ${binomHtml(n, k)} = ${binom(n, k)} Pfade mit ${k} Treffern — der Binomialkoeffizient fehlt.`;
      if (nahe(val, vertauscht, TOL)) return `Die Exponenten sind vertauscht: p gehört zu den ${k} <strong>Treffern</strong>, 1 − p zu den ${n - k} Nieten.`;
      if (nahe(val, ohneNiete, TOL)) return `Der Faktor für die ${n - k} Nieten fehlt: (1 − p)<sup>${n - k}</sup>.`;
      return `P(X = ${k}) = ${binomHtml(n, k)} · p<sup>${k}</sup> · (1 − p)<sup>${n - k}</sup>`;
    },
    tipps: [`Bernoulli-Kette: n = ${n}, Trefferwahrscheinlichkeit p = ${ctx.pZ}/${ctx.pN}.`, `Formel von Bernoulli: B(n; p; k) = ${binomHtml("n", "k")} · p<sup>k</sup> · (1 − p)<sup>n − k</sup>.`],
    musterloesungHtml: `X: Anzahl der Treffer, n = ${n}, p = ${bruch(ctx.pZ, ctx.pN)}, k = ${k}.<br>` +
      `P(X = ${k}) = B(${n}; ${bruch(ctx.pZ, ctx.pN)}; ${k}) = ${binomHtml(n, k)} · (${bruch(ctx.pZ, ctx.pN)})<sup>${k}</sup> · (${bruch(ctx.qZ, ctx.pN)})<sup>${n - k}</sup> = ${binom(n, k)} · ${num(pfad, 6)} ≈ <strong>${num(P)}</strong>`,
  };
}

// ================= mittel =================

// M1 — Standardabweichung aus einer Tabelle
const M1_KANDIDATEN = spaeter(() => {
  const out = [];
  const xsListe = [[1, 2, 3], [0, 1, 2], [0, 2, 4], [1, 3, 5], [0, 5, 10], [2, 4, 6]];
  for (const xs of xsListe) for (let a = 10; a <= 70; a += 10) for (let b = 10; b <= 70; b += 10) {
    const c = 100 - a - b;
    if (c < 10) continue;
    out.push({ xs, ps: [a / 100, b / 100, c / 100] });
  }
  return out;
});
function kenn(xs, ps) {
  const E = xs.reduce((s, x, i) => s + x * ps[i], 0);
  const V = xs.reduce((s, x, i) => s + (x - E) ** 2 * ps[i], 0);
  return { E, V, s: Math.sqrt(V) };
}
function generateM1() {
  const k = ohneKollision(M1_KANDIDATEN(), (v) => { const r = kenn(v.xs, v.ps); return [r.s, r.V, r.E]; }, 0.03);
  const { xs, ps } = k;
  const { E, V, s } = kenn(xs, ps);
  return {
    promptHtml: `Die Zufallsgröße X hat die folgende Wahrscheinlichkeitsverteilung.` + tabelle(xs, ps, -1) +
      `<strong>Berechne die Standardabweichung σ von X.</strong><br><span class="progress-note">Runde auf zwei Nachkommastellen.</span>`,
    correct: s,
    tolerance: 0.006,
    placeholder: "σ",
    hinweis: (roh, val) => {
      if (nahe(val, V, 0.006)) return `Das ist die Varianz V(X). Die Standardabweichung ist ihre <strong>Wurzel</strong>.`;
      if (nahe(val, E, 0.006)) return `Das ist der Erwartungswert μ. Er ist nur der erste Schritt — gefragt ist, wie weit die Werte um ihn streuen.`;
      return `Erst μ = E(X), dann V(X) = Σ (x − μ)² · P(X = x), dann σ = √V(X).`;
    },
    tipps: [`Berechne zuerst den Erwartungswert μ.`, `V(X) = (x₁ − μ)² · P(X = x₁) + … ; σ = √V(X).`],
    musterloesungHtml: `μ = ${xs.map((x, i) => `${num(x)} · ${num(ps[i], 2)}`).join(" + ")} = ${num(E)}<br>` +
      `V(X) = ${xs.map((x, i) => `(${num(x)} − ${num(E)})² · ${num(ps[i], 2)}`).join(" + ")} = ${num(V)}<br>` +
      `σ = √${num(V)} ≈ <strong>${num(s, 2)}</strong>`,
  };
}

// M2 — der faire Einsatz
const M2_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const m of [4, 5, 8, 10]) for (let a = 1; a <= m - 2; a++) for (let b = 1; a + b <= m - 1; b++) {
    for (const x1 of [5, 10, 20]) for (const x2 of [1, 2, 3]) {
      const E = (a * x1 + b * x2) / m;
      if (Math.abs(Math.round(E * 100) - E * 100) > 1e-9) continue;   // glatt auf Cent
      out.push({ m, a, b, x1, x2 });
    }
  }
  return out;
});
function generateM2() {
  const k = ohneKollision(M2_KANDIDATEN(), (v) => [(v.a * v.x1 + v.b * v.x2) / v.m, (v.x1 + v.x2 + 0) / 3, v.a * v.x1 + v.b * v.x2], 0.02);
  const { m, a, b, x1, x2 } = k;
  const E = (a * x1 + b * x2) / m, rest = m - a - b;
  return {
    promptHtml: `Ein Glücksrad hat ${m} gleich große Sektoren. Bei ${a} ${a === 1 ? "Sektor" : "Sektoren"} werden ${x1} € ausgezahlt, bei ${b} ${b === 1 ? "Sektor" : "Sektoren"} ${x2} €, bei den übrigen ${rest} nichts. ` +
      `<strong>Wie hoch muss der Einsatz sein, damit das Spiel fair ist?</strong><br><span class="progress-note">Antworte in Euro.</span>`,
    correct: E,
    tolerance: 0.001,
    placeholder: "Einsatz in €",
    hinweis: (roh, val) => {
      if (nahe(val, (x1 + x2) / 3, 0.001)) return `Das ist das Mittel der drei Beträge. Sie sind aber nicht gleich wahrscheinlich — jeder Betrag zählt so oft, wie er Sektoren hat.`;
      if (nahe(val, a * x1 + b * x2, 0.001)) return `Das ist die Summe über alle Sektoren. Jeder Sektor hat nur die Wahrscheinlichkeit 1/${m} — es fehlt das Teilen durch ${m}.`;
      return `Fair ist das Spiel, wenn der Einsatz gleich dem Erwartungswert der Auszahlung ist.`;
    },
    tipps: [`X: Auszahlung. Fair heißt: Einsatz = E(X).`, `P(X = ${x1}) = ${a}/${m}, P(X = ${x2}) = ${b}/${m}, P(X = 0) = ${rest}/${m}.`],
    musterloesungHtml: `E(X) = ${x1} € · ${bruch(a, m)} + ${x2} € · ${bruch(b, m)} + 0 € · ${bruch(rest, m)} = ${bruch(a * x1 + b * x2, m)} € = <strong>${num(E, 2)} €</strong><br>Bei diesem Einsatz gewinnt auf Dauer weder Spieler noch Betreiber.`,
  };
}

// M3 — höchstens k Treffer
const M3_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const p of P_LISTE) for (let n = 6; n <= 15; n++) for (let k = 1; k <= 4; k++) {
    if (F(n, p, k) > 0.02 && F(n, p, k) < 0.98) out.push({ n, p, k });
  }
  return out;
});
function generateM3() {
  const v0 = ohneKollision(M3_KANDIDATEN(), (v) => [F(v.n, v.p, v.k), B(v.n, v.p, v.k), F(v.n, v.p, v.k - 1), 1 - F(v.n, v.p, v.k)], EPS);
  const { n, p, k } = v0;
  const P = F(n, p, k);
  return {
    promptHtml: `Bei einer Qualitätskontrolle ist jedes Bauteil mit der Wahrscheinlichkeit ${pText(p)} fehlerhaft. Es werden ${n} Bauteile zufällig entnommen. ` +
      `<strong>Mit welcher Wahrscheinlichkeit sind höchstens ${k} davon fehlerhaft?</strong><br><span class="progress-note">Antworte ${PLATZ}.</span>`,
    correct: P,
    tolerance: TOL,
    placeholder: "P(X ≤ k)",
    hinweis: (roh, val) => {
      if (nahe(val, B(n, p, k), TOL)) return `Das ist P(X = ${k}) — <strong>genau</strong> ${k}. „Höchstens ${k}“ schließt auch 0, 1, …, ${k - 1} fehlerhafte Teile ein.`;
      if (nahe(val, F(n, p, k - 1), TOL)) return `Das ist P(X ≤ ${k - 1}), also „weniger als ${k}“. Bei „höchstens ${k}“ gehört ${k} selbst noch dazu.`;
      if (nahe(val, 1 - P, TOL)) return `Das ist die Gegenwahrscheinlichkeit, also „mehr als ${k}“.`;
      return `P(X ≤ ${k}) = P(X = 0) + P(X = 1) + … + P(X = ${k}) = F(${n}; ${pText(p)}; ${k}).`;
    },
    tipps: [`X: Anzahl der fehlerhaften Teile, binomialverteilt mit n = ${n}, p = ${pText(p)}.`, `„Höchstens ${k}“ heißt X ≤ ${k}: Summe der Einzelwahrscheinlichkeiten von 0 bis ${k} — oder F(${n}; ${pText(p)}; ${k}) aus der Tabelle.`],
    musterloesungHtml: `X: Anzahl der fehlerhaften Teile; n = ${n}, p = ${pText(p)}.<br>` +
      `P(X ≤ ${k}) = ${Array.from({ length: k + 1 }, (_, i) => `B(${n}; ${pText(p)}; ${i})`).join(" + ")}<br>` +
      `= ${Array.from({ length: k + 1 }, (_, i) => num(B(n, p, i))).join(" + ")} ≈ <strong>${num(P)}</strong> &nbsp; (Tabelle: F(${n}; ${pText(p)}; ${k}))`,
  };
}

// M4 — Erwartungswert und Standardabweichung einer Binomialverteilung (zwei Felder)
const M4_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const n of [20, 25, 40, 50, 60, 80, 100, 120, 150, 200]) for (const p of [0.1, 0.2, 0.25, 0.3, 0.4, 0.6, 0.7, 0.75, 0.8]) {
    const mu = n * p;
    if (Math.abs(mu - Math.round(mu)) > 1e-9) continue;
    out.push({ n, p });
  }
  return out;
});
function generateM4() {
  const v0 = ohneKollision(M4_KANDIDATEN(), (v) => {
    const V = v.n * v.p * (1 - v.p);
    return [Math.sqrt(V), V];
  }, 0.02);
  const { n, p } = v0;
  const mu = n * p, V = n * p * (1 - p), s = Math.sqrt(V);
  return {
    promptHtml: `Erfahrungsgemäß erscheinen ${num(p * 100)} % aller angemeldeten Teilnehmer zu einer Veranstaltung. Es sind ${n} Personen angemeldet; X ist die Anzahl der erscheinenden. ` +
      `<strong>Berechne Erwartungswert μ und Standardabweichung σ von X.</strong><br><span class="progress-note">σ auf zwei Nachkommastellen.</span>`,
    felder: [
      { name: "μ =", soll: mu, toleranz: 0.001, hinweis: (roh, val) => nahe(val, n * (1 - p), 0.001) ? `Das ist n · (1 − p) — die Zahl der Personen, die <strong>nicht</strong> kommen.` : `μ = n · p.` },
      { name: "σ ≈", soll: s, toleranz: 0.006, hinweis: (roh, val) => nahe(val, V, 0.006) ? `Das ist die Varianz n · p · (1 − p). σ ist ihre <strong>Wurzel</strong>.` : `σ = √(n · p · (1 − p)).` },
    ],
    tipps: [`X ist binomialverteilt mit n = ${n} und p = ${num(p, 2)}.`, `μ = n · p, σ = √(n · p · (1 − p)).`],
    musterloesungHtml: `n = ${n}, p = ${num(p, 2)}.<br>μ = ${n} · ${num(p, 2)} = <strong>${num(mu)}</strong><br>σ = √(${n} · ${num(p, 2)} · ${num(1 - p, 2)}) = √${num(V)} ≈ <strong>${num(s, 2)}</strong>`,
  };
}

// ================= schwierig =================

// S1 — mindestens k Treffer: über das Gegenereignis
const S1_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const p of P_LISTE) for (let n = 10; n <= 20; n++) for (let k = 2; k <= 6; k++) {
    const P = 1 - F(n, p, k - 1);
    if (P > 0.02 && P < 0.98) out.push({ n, p, k });
  }
  return out;
});
function generateS1() {
  const v0 = ohneKollision(S1_KANDIDATEN(), (v) => [1 - F(v.n, v.p, v.k - 1), 1 - F(v.n, v.p, v.k), F(v.n, v.p, v.k - 1), B(v.n, v.p, v.k)], EPS);
  const { n, p, k } = v0;
  const P = 1 - F(n, p, k - 1);
  return {
    promptHtml: `Ein Basketballspieler trifft bei Freiwürfen mit der Wahrscheinlichkeit ${pText(p)}. Er wirft ${n}-mal; die Würfe sind unabhängig voneinander. ` +
      `<strong>Mit welcher Wahrscheinlichkeit trifft er mindestens ${k}-mal?</strong><br><span class="progress-note">Antworte ${PLATZ}.</span>`,
    correct: P,
    tolerance: TOL,
    placeholder: "P(X ≥ k)",
    hinweis: (roh, val) => {
      if (nahe(val, 1 - F(n, p, k), TOL)) return `Das ist 1 − P(X ≤ ${k}) = P(X ≥ ${k + 1}). Das Gegenereignis von „mindestens ${k}“ ist „höchstens <strong>${k - 1}</strong>“ — die ${k} gehört zum Ereignis selbst.`;
      if (nahe(val, F(n, p, k - 1), TOL)) return `Das ist P(X ≤ ${k - 1}) — das Gegenereignis. Es fehlt noch „1 minus“.`;
      if (nahe(val, B(n, p, k), TOL)) return `Das ist P(X = ${k}), also genau ${k} Treffer. Mindestens ${k} sind ${k}, ${k + 1}, …, ${n} Treffer.`;
      return `P(X ≥ ${k}) = 1 − P(X ≤ ${k - 1}) = 1 − F(${n}; ${pText(p)}; ${k - 1}).`;
    },
    tipps: [`X: Anzahl der Treffer, n = ${n}, p = ${pText(p)}. Rechne über das Gegenereignis.`, `Gegenereignis von „mindestens ${k}“ ist „höchstens ${k - 1}“.`],
    musterloesungHtml: `X: Anzahl der Treffer; n = ${n}, p = ${pText(p)}.<br>` +
      `P(X ≥ ${k}) = 1 − P(X ≤ ${k - 1}) = 1 − F(${n}; ${pText(p)}; ${k - 1}) ≈ 1 − ${num(F(n, p, k - 1))} = <strong>${num(P)}</strong>`,
  };
}

// S2 — zwischen a und b
const S2_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const p of P_LISTE) for (let n = 10; n <= 20; n++) for (let a = 2; a <= 6; a++) for (let b = a + 2; b <= a + 5 && b <= n - 1; b++) {
    const P = F(n, p, b) - F(n, p, a - 1);
    if (P > 0.05 && P < 0.95) out.push({ n, p, a, b });
  }
  return out;
});
function generateS2() {
  const v0 = ohneKollision(S2_KANDIDATEN(), (v) => {
    const { n, p, a, b } = v;
    return [F(n, p, b) - F(n, p, a - 1), F(n, p, b) - F(n, p, a), F(n, p, b - 1) - F(n, p, a - 1), F(n, p, b - 1) - F(n, p, a)];
  }, EPS);
  const { n, p, a, b } = v0;
  const P = F(n, p, b) - F(n, p, a - 1);
  return {
    promptHtml: `In einer Region nutzen ${num(p * 100)} % der Haushalte ein bestimmtes Streamingangebot. ${n} Haushalte werden zufällig befragt. ` +
      `<strong>Mit welcher Wahrscheinlichkeit nutzen mindestens ${a} und höchstens ${b} von ihnen das Angebot?</strong><br><span class="progress-note">Antworte ${PLATZ}.</span>`,
    correct: P,
    tolerance: TOL,
    placeholder: "P(a ≤ X ≤ b)",
    hinweis: (roh, val) => {
      if (nahe(val, F(n, p, b) - F(n, p, a), TOL)) return `Hier wurde F(…; ${a}) abgezogen — damit ist die Säule bei ${a} weg. Weil <strong>mindestens ${a}</strong> gefragt ist, zieht man F(…; ${a - 1}) ab.`;
      if (nahe(val, F(n, p, b - 1) - F(n, p, a - 1), TOL)) return `Die obere Grenze ${b} gehört dazu („höchstens ${b}“): oben F(…; ${b}), nicht F(…; ${b - 1}).`;
      if (nahe(val, F(n, p, b - 1) - F(n, p, a), TOL)) return `Beide Grenzen gehören zum Ereignis. Gerechnet wurde „mehr als ${a} und weniger als ${b}“.`;
      return `P(${a} ≤ X ≤ ${b}) = F(${n}; ${pText(p)}; ${b}) − F(${n}; ${pText(p)}; ${a - 1}).`;
    },
    tipps: [`X: Anzahl der Nutzer-Haushalte, n = ${n}, p = ${pText(p)}.`, `Alles bis ${b} minus alles bis ${a - 1}.`],
    musterloesungHtml: `X: Anzahl der Haushalte mit dem Angebot; n = ${n}, p = ${pText(p)}.<br>` +
      `P(${a} ≤ X ≤ ${b}) = P(X ≤ ${b}) − P(X ≤ ${a - 1}) = F(${n}; ${pText(p)}; ${b}) − F(${n}; ${pText(p)}; ${a - 1}) ≈ ${num(F(n, p, b))} − ${num(F(n, p, a - 1))} = <strong>${num(P)}</strong>`,
  };
}

// S3 — p > 0,5: Treffer über die Nieten
const S3_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const p of [0.6, 0.7, 0.75, 0.8, 0.9]) for (let n = 10; n <= 20; n++) for (let k = n - 5; k <= n - 1; k++) {
    const P = F(n, p, k);
    if (P > 0.03 && P < 0.97) out.push({ n, p, k });
  }
  return out;
});
function generateS3() {
  const v0 = ohneKollision(S3_KANDIDATEN(), (v) => {
    const { n, p, k } = v;
    return [F(n, p, k), F(n, 1 - p, k), 1 - F(n, 1 - p, n - k), F(n, 1 - p, n - k - 1)];
  }, EPS);
  const { n, p, k } = v0;
  const P = F(n, p, k), q = 1 - p;
  return {
    promptHtml: `Ein Samenhändler gibt die Keimfähigkeit seiner Samen mit ${num(p * 100)} % an. Ein Gärtner sät ${n} Samen. ` +
      `<strong>Mit welcher Wahrscheinlichkeit keimen höchstens ${k} davon?</strong><br><span class="progress-note">Antworte ${PLATZ}. Die Tabelle reicht nur bis p = 0,5.</span>`,
    correct: P,
    tolerance: TOL,
    placeholder: "P(X ≤ k)",
    hinweis: (roh, val) => {
      if (nahe(val, F(n, q, k), TOL)) return `Hier wurde nur p durch 1 − p = ${num(q, 2)} ersetzt, aber k nicht umgerechnet. Mit 1 − p zählt man die <strong>nicht</strong> keimenden Samen — höchstens ${k} keimende sind mindestens ${n - k} nicht keimende.`;
      if (nahe(val, 1 - F(n, q, n - k), TOL)) return `Fast: Mindestens ${n - k} nicht keimende heißt 1 − P(Y ≤ <strong>${n - k - 1}</strong>) — hier wurde eine Stufe zu viel abgezogen.`;
      if (nahe(val, F(n, q, n - k - 1), TOL)) return `Das ist P(Y ≤ ${n - k - 1}) — die Gegenwahrscheinlichkeit. Es fehlt „1 minus“.`;
      return `F(${n}; ${num(p, 2)}; ${k}) = 1 − F(${n}; ${num(q, 2)}; ${n - k - 1}).`;
    },
    tipps: [`Zähle die nicht keimenden Samen: Y = ${n} − X ist binomialverteilt mit p = ${num(q, 2)}.`, `X ≤ ${k} ⟺ Y ≥ ${n - k}; also P = 1 − P(Y ≤ ${n - k - 1}).`],
    musterloesungHtml: `X: Anzahl der keimenden Samen; n = ${n}, p = ${num(p, 2)} &gt; 0,5.<br>` +
      `Y = ${n} − X zählt die nicht keimenden, p' = ${num(q, 2)}. Höchstens ${k} keimen ⟺ mindestens ${n - k} keimen nicht:<br>` +
      `P(X ≤ ${k}) = P(Y ≥ ${n - k}) = 1 − F(${n}; ${num(q, 2)}; ${n - k - 1}) ≈ 1 − ${num(F(n, q, n - k - 1))} = <strong>${num(P)}</strong>`,
  };
}

// S4 — die Mindestlänge n („mindestens-mindestens“)
const S4_KANDIDATEN = spaeter(() => {
  const out = [];
  const kontexte = [
    { p: 1 / 6, pText: "1/6", text: (a) => `Wie oft muss man einen fairen Würfel mindestens werfen, um mit einer Wahrscheinlichkeit von mindestens ${a} % mindestens eine Sechs zu erhalten?` },
    { p: 0.05, pText: "0,05", text: (a) => `Ein Los gewinnt mit der Wahrscheinlichkeit 0,05. Wie viele Lose muss man mindestens kaufen, um mit einer Wahrscheinlichkeit von mindestens ${a} % mindestens einen Gewinn zu haben?` },
    { p: 0.1, pText: "0,1", text: (a) => `Ein Bauteil ist mit der Wahrscheinlichkeit 0,1 defekt. Wie viele Bauteile muss man mindestens prüfen, um mit einer Wahrscheinlichkeit von mindestens ${a} % mindestens ein defektes zu finden?` },
    { p: 0.15, pText: "0,15", text: (a) => `Eine Spielerin trifft beim Torwandschießen mit der Wahrscheinlichkeit 0,15. Wie oft muss sie mindestens schießen, um mit einer Wahrscheinlichkeit von mindestens ${a} % mindestens einmal zu treffen?` },
    { p: 0.25, pText: "0,25", text: (a) => `Ein Glücksrad zeigt mit der Wahrscheinlichkeit 0,25 „Rot“. Wie oft muss man es mindestens drehen, um mit einer Wahrscheinlichkeit von mindestens ${a} % mindestens einmal „Rot“ zu erhalten?` },
    { p: 0.3, pText: "0,3", text: (a) => `Bei einer Umfrage ist eine angerufene Person mit der Wahrscheinlichkeit 0,3 zu einem Interview bereit. Wie viele Personen muss man mindestens anrufen, um mit einer Wahrscheinlichkeit von mindestens ${a} % mindestens ein Interview zu bekommen?` },
  ];
  for (const ctx of kontexte) for (const alpha of [0.8, 0.9, 0.95, 0.99]) out.push({ ctx, alpha });
  return out;
});
function mindestN(p, alpha) {
  let n = 1;
  while (1 - Math.pow(1 - p, n) < alpha - 1e-12) n++;
  return n;
}
function generateS4() {
  const v0 = ohneKollision(S4_KANDIDATEN(), (v) => [mindestN(v.ctx.p, v.alpha), mindestN(v.ctx.p, v.alpha) - 1, Math.round(1 / v.ctx.p)], 0.5);
  const { ctx, alpha } = v0;
  const p = ctx.p, n = mindestN(p, alpha);
  const log = Math.log(1 - alpha) / Math.log(1 - p);
  return {
    promptHtml: `${ctx.text(num(alpha * 100))}`,
    correct: n,
    tolerance: 0.5,
    placeholder: "n",
    hinweis: (roh, val) => {
      if (nahe(val, n - 1, 0.5)) return `Die Rechnung liefert n ≥ ${num(log, 2)}. n muss eine ganze Zahl sein und die Ungleichung erfüllen — also wird <strong>aufgerundet</strong>, nicht gerundet.`;
      if (nahe(val, Math.round(1 / p), 0.5)) return `Das ist die Anzahl, bei der man <strong>im Mittel</strong> einen Treffer erwartet (n · p = 1). Mit ${num(alpha * 100)} % Sicherheit braucht man deutlich mehr.`;
      return `Ansatz: P(X ≥ 1) = 1 − (1 − p)<sup>n</sup> ≥ ${num(alpha, 2)}, nach n auflösen.`;
    },
    tipps: [`Gegenereignis von „mindestens ein Treffer“ ist „kein Treffer“: P(X = 0) = (1 − p)<sup>n</sup>.`, `(1 − p)<sup>n</sup> ≤ ${num(1 - alpha, 2)}; logarithmieren. Achtung: ln(1 − p) ist negativ.`],
    musterloesungHtml: `X: Anzahl der Treffer bei n Versuchen, p = ${ctx.pText}.<br>` +
      `P(X ≥ 1) ≥ ${num(alpha, 2)} ⟺ 1 − (1 − p)<sup>n</sup> ≥ ${num(alpha, 2)} ⟺ (1 − p)<sup>n</sup> ≤ ${num(1 - alpha, 2)}<br>` +
      `⟺ n ≥ ${bruch(`ln ${num(1 - alpha, 2)}`, `ln(1 − ${ctx.pText})`)} ≈ ${num(log, 2)} ⟹ <strong>n = ${n}</strong><br>` +
      `Probe: n = ${n - 1}: ${num(1 - Math.pow(1 - p, n - 1))} &lt; ${num(alpha, 2)}; n = ${n}: ${num(1 - Math.pow(1 - p, n))} ≥ ${num(alpha, 2)} ✓`,
  };
}

// ================= komplex =================

// K1 — Erwartungswert und die Wahrscheinlichkeit, dass er genau eintritt (zwei Felder)
const K1_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const n of [10, 12, 15, 16, 18, 20, 24, 25, 30]) for (const p of [0.1, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.75, 0.8]) {
    const mu = n * p;
    if (Math.abs(mu - Math.round(mu)) > 1e-9 || mu < 2 || mu > n - 2) continue;
    out.push({ n, p });
  }
  return out;
});
function generateK1() {
  const v0 = ohneKollision(K1_KANDIDATEN(), (v) => {
    const mu = Math.round(v.n * v.p);
    return [B(v.n, v.p, mu), Math.pow(v.p, mu) * Math.pow(1 - v.p, v.n - mu)];
  }, EPS);
  const { n, p } = v0;
  const mu = Math.round(n * p), P = B(n, p, mu);
  return {
    promptHtml: `Ein Medikament wirkt bei ${num(p * 100)} % aller Anwendungen. Es wird bei ${n} Patienten eingesetzt; die Behandlungen sind unabhängig voneinander. ` +
      `<strong>Bei wie vielen Patienten ist eine Wirkung zu erwarten, und mit welcher Wahrscheinlichkeit wirkt es bei genau so vielen?</strong><br><span class="progress-note">Wahrscheinlichkeit ${PLATZ}.</span>`,
    felder: [
      { name: "erwartet:", soll: mu, toleranz: 0.001, einheit: "Patienten", hinweis: (roh, val) => nahe(val, n - mu, 0.001) ? `Das ist die Zahl der Patienten, bei denen es <strong>nicht</strong> wirkt.` : `μ = n · p.` },
      { name: "P(X = μ) ≈", soll: P, toleranz: TOL, hinweis: (roh, val) => nahe(val, Math.pow(p, mu) * Math.pow(1 - p, n - mu), TOL) ? `Das ist ein einzelner Pfad — der Binomialkoeffizient ${binomHtml(n, mu)} fehlt.` : `B(${n}; ${num(p, 2)}; ${mu}) mit der Formel von Bernoulli.` },
    ],
    tipps: [`X: Anzahl der Patienten mit Wirkung, n = ${n}, p = ${num(p, 2)}. μ = n · p.`, `P(X = ${mu}) = ${binomHtml(n, mu)} · ${num(p, 2)}<sup>${mu}</sup> · ${num(1 - p, 2)}<sup>${n - mu}</sup>.`],
    musterloesungHtml: `μ = ${n} · ${num(p, 2)} = <strong>${mu}</strong><br>` +
      `P(X = ${mu}) = ${binomHtml(n, mu)} · ${num(p, 2)}<sup>${mu}</sup> · ${num(1 - p, 2)}<sup>${n - mu}</sup> ≈ <strong>${num(P)}</strong><br>` +
      `Der Erwartungswert ist der wahrscheinlichste Wert — aber genau ihn trifft man nur mit etwa ${num(P * 100, 0)} %.`,
  };
}

// K2 — k gesucht: Wie viele Parkplätze reichen?
const K2_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const n of [20, 25, 30, 40, 50]) for (const p of [0.3, 0.4, 0.5, 0.6, 0.7]) for (const alpha of [0.8, 0.9, 0.95]) out.push({ n, p, alpha });
  return out;
});
function kleinstesK(n, p, alpha) {
  for (let k = 0; k <= n; k++) if (F(n, p, k) >= alpha - 1e-12) return k;
  return n;
}
function generateK2() {
  const v0 = ohneKollision(K2_KANDIDATEN(), (v) => {
    const k = kleinstesK(v.n, v.p, v.alpha);
    return [k, k - 1, Math.round(v.n * v.p)];
  }, 0.5);
  const { n, p, alpha } = v0;
  const k = kleinstesK(n, p, alpha), mu = n * p;
  return {
    promptHtml: `Eine Firma hat ${n} Mitarbeiter. Jeder kommt unabhängig von den anderen mit der Wahrscheinlichkeit ${pText(p)} mit dem Auto. ` +
      `<strong>Wie viele Parkplätze sind mindestens nötig, damit sie an mindestens ${num(alpha * 100)} % der Arbeitstage ausreichen?</strong>`,
    correct: k,
    tolerance: 0.5,
    placeholder: "Parkplätze",
    hinweis: (roh, val) => {
      if (nahe(val, k - 1, 0.5)) return `Mit ${k - 1} Parkplätzen ist P(X ≤ ${k - 1}) ≈ ${num(F(n, p, k - 1))} — das ist noch <strong>weniger</strong> als ${num(alpha, 2)}.`;
      if (nahe(val, Math.round(mu), 0.5)) return `Das ist der Erwartungswert μ = ${num(mu)}. So viele Parkplätze reichen nur an gut der Hälfte der Tage.`;
      return `Gesucht ist das kleinste k mit F(${n}; ${pText(p)}; k) ≥ ${num(alpha, 2)}.`;
    },
    tipps: [`X: Anzahl der Autofahrer an einem Tag, n = ${n}, p = ${pText(p)}. Die Parkplätze reichen, wenn X ≤ k.`, `Suche in der Tabelle von F(${n}; ${pText(p)}; k) den ersten Wert ≥ ${num(alpha, 2)}.`],
    musterloesungHtml: `X: Anzahl der Autofahrer; n = ${n}, p = ${pText(p)}. Gesucht: kleinstes k mit P(X ≤ k) ≥ ${num(alpha, 2)}.<br>` +
      `F(${n}; ${pText(p)}; ${k - 1}) ≈ ${num(F(n, p, k - 1))} &lt; ${num(alpha, 2)} &nbsp; und &nbsp; F(${n}; ${pText(p)}; ${k}) ≈ ${num(F(n, p, k))} ≥ ${num(alpha, 2)}<br>` +
      `⟹ <strong>${k} Parkplätze</strong>`,
  };
}

// K3 — p gesucht: Wie gut muss man sein?
const K3_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const n of [3, 4, 5, 6, 8, 10, 12, 15, 20]) for (const alpha of [0.8, 0.9, 0.95, 0.99]) out.push({ n, alpha });
  return out;
});
function generateK3() {
  const v0 = ohneKollision(K3_KANDIDATEN(), (v) => [1 - Math.pow(1 - v.alpha, 1 / v.n), Math.pow(1 - v.alpha, 1 / v.n), 1 - Math.pow(v.alpha, 1 / v.n)], EPS);
  const { n, alpha } = v0;
  const pmin = 1 - Math.pow(1 - alpha, 1 / n);
  return {
    promptHtml: `Eine Bogenschützin schießt ${n}-mal auf eine Scheibe; die Schüsse sind unabhängig. ` +
      `<strong>Wie groß muss ihre Trefferwahrscheinlichkeit p mindestens sein, damit sie mit einer Wahrscheinlichkeit von mindestens ${num(alpha * 100)} % mindestens einmal trifft?</strong><br><span class="progress-note">Antworte ${PLATZ}.</span>`,
    correct: pmin,
    tolerance: TOL,
    placeholder: "p",
    hinweis: (roh, val) => {
      if (nahe(val, Math.pow(1 - alpha, 1 / n), TOL)) return `Das ist 1 − p, die höchstens zulässige <strong>Fehl</strong>wahrscheinlichkeit. Gesucht ist p = 1 minus diesen Wert.`;
      if (nahe(val, 1 - Math.pow(alpha, 1 / n), TOL)) return `Unter der Wurzel steht die Wahrscheinlichkeit für „kein Treffer“, also 1 − ${num(alpha, 2)} = ${num(1 - alpha, 2)}, nicht ${num(alpha, 2)}.`;
      return `Ansatz: 1 − (1 − p)<sup>${n}</sup> ≥ ${num(alpha, 2)}, nach p auflösen.`;
    },
    tipps: [`P(mindestens ein Treffer) = 1 − (1 − p)<sup>${n}</sup>.`, `(1 − p)<sup>${n}</sup> ≤ ${num(1 - alpha, 2)} ⟹ 1 − p ≤ ${num(1 - alpha, 2)}<sup>1/${n}</sup>.`],
    musterloesungHtml: `1 − (1 − p)<sup>${n}</sup> ≥ ${num(alpha, 2)} ⟺ (1 − p)<sup>${n}</sup> ≤ ${num(1 - alpha, 2)} ⟺ 1 − p ≤ ${num(1 - alpha, 2)}<sup>1/${n}</sup> ≈ ${num(Math.pow(1 - alpha, 1 / n))}<br>` +
      `⟹ p ≥ 1 − ${num(Math.pow(1 - alpha, 1 / n))} ≈ <strong>${num(pmin)}</strong><br>` +
      `Probe: 1 − (1 − ${num(pmin)})<sup>${n}</sup> ≈ ${num(1 - Math.pow(1 - pmin, n))} ✓`,
  };
}

// K4 — zweistufig: Annahmeprüfung bei drei Lieferungen
const K4_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const p of [0.05, 0.1, 0.15, 0.2]) for (const n of [10, 15, 20]) for (const c of [1, 2, 3]) {
    const f = F(n, p, c);
    if (f > 0.3 && f < 0.97) out.push({ p, n, c });
  }
  return out;
});
function generateK4() {
  const v0 = ohneKollision(K4_KANDIDATEN(), (v) => {
    const f = F(v.n, v.p, v.c);
    return [f ** 3, f, 1 - (1 - f) ** 3, 3 * f];
  }, EPS);
  const { p, n, c } = v0;
  const f = F(n, p, c), P = f ** 3;
  return {
    promptHtml: `Ein Händler prüft jede Lieferung: Er entnimmt ${n} Teile und nimmt die Lieferung nur an, wenn höchstens ${c} davon defekt sind. Jedes Teil ist mit der Wahrscheinlichkeit ${pText(p)} defekt. ` +
      `<strong>Mit welcher Wahrscheinlichkeit werden drei aufeinanderfolgende Lieferungen alle angenommen?</strong><br><span class="progress-note">Antworte ${PLATZ}.</span>`,
    correct: P,
    tolerance: TOL,
    placeholder: "P",
    hinweis: (roh, val) => {
      if (nahe(val, f, TOL)) return `Das ist die Wahrscheinlichkeit, dass <strong>eine</strong> Lieferung angenommen wird. Alle drei: noch hoch drei.`;
      if (nahe(val, 1 - (1 - f) ** 3, TOL)) return `Das ist die Wahrscheinlichkeit, dass <strong>mindestens eine</strong> der drei Lieferungen angenommen wird.`;
      return `Erst P(eine Lieferung wird angenommen) = F(${n}; ${pText(p)}; ${c}), dann drei unabhängige Lieferungen.`;
    },
    tipps: [`Eine Lieferung: X = Anzahl der defekten Teile in der Stichprobe, n = ${n}, p = ${pText(p)}; angenommen, wenn X ≤ ${c}.`, `Die drei Lieferungen sind unabhängig: Produktregel.`],
    musterloesungHtml: `Eine Lieferung wird angenommen mit P(X ≤ ${c}) = F(${n}; ${pText(p)}; ${c}) ≈ ${num(f)}.<br>` +
      `Drei unabhängige Lieferungen: ${num(f)}³ ≈ <strong>${num(P)}</strong><br>` +
      `<span class="progress-note">Das ist selbst eine Bernoulli-Kette der Länge 3 — mit „angenommen“ als Treffer und genau 3 Treffern.</span>`,
  };
}

export const AUFGABEN = [
  { schwierigkeit: "einfach", titel: "Die fehlende Wahrscheinlichkeit", generate: generateE1 },
  { schwierigkeit: "einfach", titel: "Erwartungswert aus einer Tabelle", generate: generateE2 },
  { schwierigkeit: "einfach", titel: "Pfade zählen", generate: generateE3 },
  { schwierigkeit: "einfach", titel: "Genau k Treffer", generate: generateE4 },
  { schwierigkeit: "mittel", titel: "Standardabweichung", generate: generateM1 },
  { schwierigkeit: "mittel", titel: "Ein faires Glücksrad", generate: generateM2 },
  { schwierigkeit: "mittel", titel: "Höchstens k fehlerhaft", generate: generateM3 },
  { schwierigkeit: "mittel", titel: "Erwartungswert und Streuung", generate: generateM4 },
  { schwierigkeit: "schwierig", titel: "Mindestens k Treffer", generate: generateS1 },
  { schwierigkeit: "schwierig", titel: "Zwischen zwei Grenzen", generate: generateS2 },
  { schwierigkeit: "schwierig", titel: "Wenn p größer als 0,5 ist", generate: generateS3 },
  { schwierigkeit: "schwierig", titel: "Wie oft mindestens?", generate: generateS4 },
  { schwierigkeit: "komplex", titel: "Erwartet — und wie wahrscheinlich genau?", generate: generateK1 },
  { schwierigkeit: "komplex", titel: "Wie viele Parkplätze?", generate: generateK2 },
  { schwierigkeit: "komplex", titel: "Wie gut muss man sein?", generate: generateK3 },
  { schwierigkeit: "komplex", titel: "Drei Lieferungen", generate: generateK4 },
];
