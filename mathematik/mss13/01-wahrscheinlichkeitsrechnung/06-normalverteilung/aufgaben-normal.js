// Die sechzehn Übungsaufgaben zu „Normalverteilung“ — vier je Stufe.
//
//   einfach   — ein Schritt: standardisieren, Laplace-Bedingung, ein Wert von φ, Φ und Symmetrie.
//   mittel    — lokale Näherung, globale Näherung „höchstens“, Normalverteilung „höchstens“,
//               σ-Regeln.
//   schwierig — mit einer Stolperstelle: „mindestens“ (Korrektur nach links), „zwischen“ (zwei
//               Korrekturen), Normalverteilung zwischen zwei Grenzen (keine Korrektur!), Grenze
//               gesucht (Φ rückwärts).
//   komplex   — Sachaufgaben: Überbuchung, σ gesucht, μ gesucht, symmetrischer Bereich um μ.
//
// Alle Zahlen entstehen aus vorher gefilterten Listen, nie durch Verwerfen und Neuziehen. Wo Φ
// abgelesen wird, sind die Zahlen so gewählt, dass der z-Wert genau zwei Nachkommastellen hat — dann
// liefert die Tabelle denselben Wert wie der Rechner, und beide Wege werden anerkannt. Deshalb
// haben die Bernoulli-Ketten der Näherungsaufgaben σ = 5 oder σ = 10.
//
// Wahrscheinlichkeiten werden mit vier Nachkommastellen eingegeben. Die Toleranz von 0,0006 lässt
// das Runden zu; Fehlerwerte liegen mindestens 0,0015 auseinander. Bei Grenzen, die über Φ
// rückwärts bestimmt werden, liefert die Tabelle z nur auf zwei Stellen: Die Toleranz 0,006 · σ +
// 0,05 deckt das ab, die Fehlerwerte liegen mindestens das 2,5-Fache davon auseinander.

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
// Immer genau so viele Nachkommastellen — für Tabellenwerte von Φ („0,8944“, nicht „0,894“).
function festeStellen(x, stellen = 4) {
  const g = Math.round(x * Math.pow(10, stellen)) / Math.pow(10, stellen);
  return new Intl.NumberFormat("de-DE", { minimumFractionDigits: stellen, maximumFractionDigits: stellen }).format(g === 0 ? 0 : g).replace("-", "−");
}
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
// Vergleich mit Toleranz — nie über ===.
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

// Eingaben: Dezimalkomma, echtes Minus, auch „95,4 %“ und Tausenderpunkte, Einheiten am Ende.
export function parseZahl(raw) {
  if (raw == null) return NaN;
  let s = String(raw).trim().replace(/\s/g, "").replace(/−/g, "-").replace(/(cm|g|kg|h|Stunden)$/i, "");
  const prozent = s.endsWith("%");
  if (prozent) s = s.slice(0, -1);
  if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) s = s.replace(/\./g, "");
  s = s.replace(",", ".");
  if (!/^-?\d*\.?\d+$/.test(s)) return NaN;
  const v = parseFloat(s);
  return prozent ? v / 100 : v;
}

// ---------- φ, Φ und die Binomialverteilung ----------

const WURZEL_2PI = Math.sqrt(2 * Math.PI);
function phi(z) {
  return Math.exp(-z * z / 2) / WURZEL_2PI;
}
// Φ über die Reihe von Marsaglia (2004): Φ(z) = 0,5 + φ(z) · (z + z³/3 + z⁵/(3 · 5) + …), auf
// etwa 15 Stellen genau für |z| < 8; außerhalb ist Φ auf 15 Stellen 0 oder 1.
function Phi(z) {
  if (z <= -8) return 0;
  if (z >= 8) return 1;
  let s = z, t = 0, b = z;
  const q = z * z;
  for (let i = 1; s !== t; ) { t = s; i += 2; b *= q / i; s = t + b; }
  return 0.5 + s * phi(z);
}
// Φ rückwärts: Halbieren des Intervalls, bis z auf 1e-12 feststeht.
function PhiInv(g) {
  let a = -8, b = 8;
  for (let i = 0; i < 60; i++) { const m = (a + b) / 2; if (Phi(m) < g) a = m; else b = m; }
  return (a + b) / 2;
}
const LNFAK = [0];
function lnFak(n) {
  while (LNFAK.length <= n) LNFAK.push(LNFAK[LNFAK.length - 1] + Math.log(LNFAK.length));
  return LNFAK[n];
}
function B(n, p, k) {
  if (k < 0 || k > n) return 0;
  return Math.exp(lnFak(n) - lnFak(k) - lnFak(n - k) + k * Math.log(p) + (n - k) * Math.log(1 - p));
}
function F(n, p, k) {
  if (k < 0) return 0;
  let s = 0;
  for (let i = 0; i <= Math.min(k, n); i++) s += B(n, p, i);
  return Math.min(1, s);
}

const TOL = 0.0006;   // Wahrscheinlichkeiten: vier Nachkommastellen, Tabelle eingeschlossen
const EPS = 0.0015;   // Mindestabstand der Fehlerwerte untereinander und zur Lösung
const PLATZ = "auf 4 Nachkommastellen";
// Toleranz für Grenzen über Φ rückwärts: z aus der Tabelle auf zwei Stellen, Ergebnis auf eine.
const tolGrenze = (s) => 0.006 * s + 0.05;

// Bernoulli-Ketten mit ganzzahligem μ und ganzzahligem σ. Der Würfel heißt im Text „Sechsen“ —
// p = 1/6 als Bruch hinzuschreiben wäre richtig, aber im Fließtext schwer lesbar.
function kette(n, p) {
  const mu = Math.round(n * p), s = Math.round(Math.sqrt(n * p * (1 - p)));
  return { n, p, mu, s };
}
const STANDARD_KETTEN = [[64, 0.5], [100, 0.5], [144, 0.5], [256, 0.5], [400, 0.5], [100, 0.2], [225, 0.2], [400, 0.2], [625, 0.2], [150, 0.4], [192, 0.25], [180, 1 / 6]].map(([n, p]) => kette(n, p));
// σ = 4, 5 oder 10: (k − μ) : σ hat höchstens zwei Nachkommastellen.
const LOKAL_KETTEN = [[64, 0.5], [100, 0.2], [100, 0.5], [180, 1 / 6], [400, 0.5], [625, 0.2]].map(([n, p]) => kette(n, p));
// σ = 5 oder 10: auch (k ± 0,5 − μ) : σ hat höchstens zwei Nachkommastellen.
const GLOBAL_KETTEN = [[100, 0.5], [180, 1 / 6], [400, 0.5], [625, 0.2], [625, 0.8], [720, 1 / 6]].map(([n, p]) => kette(n, p));

function ketteText({ n, p }) {
  if (Math.abs(p - 1 / 6) < 1e-12) return `Ein Würfel wird ${n}-mal geworfen; X ist die Anzahl der Sechsen.`;
  if (p === 0.5) return `Eine Münze wird ${n}-mal geworfen; X ist die Anzahl der Wappen.`;
  return `X ist binomialverteilt mit n = ${n} und p = ${num(p, 2)}.`;
}
function pText(p) {
  return Math.abs(p - 1 / 6) < 1e-12 ? bruch(1, 6) : num(p, 2);
}
// μ und σ als Rechnung — für Musterlösungen.
function kennText({ n, p, mu, s }) {
  return `μ = n · p = ${n} · ${pText(p)} = ${num(mu)}, &nbsp; σ = √(${n} · ${pText(p)} · ${pText(1 - p)}) = √${num(s * s)} = ${num(s)}`;
}
function zText(z) {
  return num(z, 2);
}

// ================= einfach =================

// E1 — einen Wert standardisieren
const E1_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const k of STANDARD_KETTEN) for (let j = -2 * k.s; j <= 2 * k.s; j++) if (j !== 0) out.push({ ...k, j });
  return out;
});
function generateE1() {
  const v = ohneKollision(E1_KANDIDATEN(), ({ j, s }) => [j / s, j, j / (s * s), -j / s], 0.015);
  const { mu, s, j } = v, k = mu + j, z = j / s;
  return {
    promptHtml: `${ketteText(v)} Standardisiere den Wert k = ${k}: <strong>Welcher Wert z gehört zu k = ${k}?</strong> Runde auf zwei Nachkommastellen.`,
    correct: z, tolerance: 0.006, placeholder: "z = …",
    hinweis: (roh, val) => {
      if (nahe(val, j, 0.006)) return `Das ist nur k − μ, also Schritt 1. Schritt 2 staucht noch mit dem Faktor ${bruch(1, "σ")}: durch σ teilen.`;
      if (nahe(val, j / (s * s), 0.006)) return `Du hast durch σ² = V(X) geteilt. Gestaucht wird mit der Standardabweichung σ, nicht mit der Varianz.`;
      if (nahe(val, -z, 0.006)) return `Das Vorzeichen stimmt nicht: z = (k − μ) : σ, nicht (μ − k) : σ. Werte rechts von μ haben ein positives z.`;
      return `Erst μ und σ ausrechnen, dann z = (k − μ) : σ.`;
    },
    tipps: [`μ = n · p und σ = √(n · p · (1 − p)).`, `z = (k − μ) : σ — erst verschieben, dann stauchen.`],
    musterloesungHtml: `${kennText(v)}<br>z = ${bruch(`${k} − ${mu}`, s)} = ${bruch(num(j), s)} = <strong>${zText(z)}</strong>`,
  };
}

// E2 — Laplace-Bedingung: kleinstes n mit σ > 3
// p als Bruch z/n, damit 9 : (p · (1 − p)) exakt ganzzahlig gerechnet wird — 9 : 0,09 ist im
// Rechner 100,00000000000001, und das Abrunden träfe dann die falsche Zahl.
const E2_P = [[1, 10], [1, 5], [1, 4], [3, 10], [2, 5], [1, 2], [3, 5], [7, 10], [3, 4], [4, 5], [9, 10]];
function kleinstesN(zaehler, nenner, grenze) {
  // σ² > grenze ⟺ n · z · (N − z) > grenze · N² — ganzzahlig.
  const a = zaehler * (nenner - zaehler), b = grenze * nenner * nenner;
  return Math.floor(b / a) + 1;
}
function generateE2() {
  const v = ohneKollision(E2_P.map(([z, n]) => ({ z, n })), ({ z, n }) => {
    const p = z / n;
    return [kleinstesN(z, n, 9), kleinstesN(z, n, 3), Math.floor(3 / p) + 1];
  }, 0.9);
  const p = v.z / v.n, nmin = kleinstesN(v.z, v.n, 9), grenze = 9 / (p * (1 - p));
  const glatt = (9 * v.n * v.n) % (v.z * (v.n - v.z)) === 0;
  return {
    promptHtml: `Eine Bernoulli-Kette hat die Trefferwahrscheinlichkeit p = ${num(p, 2)}. <strong>Wie lang muss sie mindestens sein, damit die Laplace-Bedingung σ &gt; 3 erfüllt ist?</strong>`,
    correct: nmin, tolerance: 0.4, placeholder: "n = …",
    hinweis: (roh, val) => {
      if (nahe(val, kleinstesN(v.z, v.n, 3), 0.4)) return `Mit diesem n ist σ² = n · p · (1 − p) größer als 3 — gefordert ist aber σ &gt; 3, also σ² &gt; 9.`;
      if (nahe(val, Math.floor(3 / p) + 1, 0.4)) return `Mit diesem n ist μ = n · p größer als 3. Die Laplace-Bedingung verlangt σ &gt; 3, und σ ist viel kleiner als μ.`;
      if (glatt && nahe(val, grenze, 0.4)) return `Bei n = ${num(grenze)} ist σ genau 3 — verlangt ist σ <strong>größer</strong> als 3.`;
      if (val > nmin) return `Mit diesem n ist die Bedingung erfüllt — aber es geht auch kürzer. Gesucht ist das kleinste n.`;
      return `σ &gt; 3 ⟺ n · p · (1 − p) &gt; 9. Nach n auflösen und aufrunden.`;
    },
    tipps: [`σ = √(n · p · (1 − p)) &gt; 3 ⟺ n · p · (1 − p) &gt; 9.`, `n &gt; 9 : (p · (1 − p)); dann die nächste ganze Zahl.`],
    musterloesungHtml: `σ &gt; 3 ⟺ n · ${num(p, 2)} · ${num(1 - p, 2)} &gt; 9 ⟺ n &gt; ${bruch(9, num(p * (1 - p), 4))} ${Math.abs(grenze * 100 - Math.round(grenze * 100)) < 1e-6 ? "=" : "≈"} ${num(grenze, 2)}<br>` +
      `Kleinstes n: <strong>${nmin}</strong>. <em>Probe:</em> σ = √(${nmin} · ${num(p * (1 - p), 4)}) ≈ ${num(Math.sqrt(nmin * p * (1 - p)), 3)} &gt; 3, ` +
      `aber mit n = ${nmin - 1}: σ ≈ ${num(Math.sqrt((nmin - 1) * p * (1 - p)), 3)}.`,
  };
}

// E3 — ein Wert der Glockenfunktion
const E3_KANDIDATEN = spaeter(() => {
  const out = [];
  for (let i = -25; i <= 25; i++) if (i !== 0) out.push({ z: i / 10 });
  return out;
});
function generateE3() {
  const { z } = ohneKollision(E3_KANDIDATEN(), ({ z }) => [phi(z), Math.exp(-z * z / 2), Math.exp(-z * z) / WURZEL_2PI, Phi(z)], EPS);
  const w = phi(z);
  return {
    promptHtml: `<strong>Berechne φ(${zText(z)})</strong>, den Wert der Gaußschen Glockenfunktion an der Stelle z = ${zText(z)}. Runde ${PLATZ}.`,
    correct: w, tolerance: TOL, placeholder: "φ(z) = …",
    hinweis: (roh, val) => {
      if (nahe(val, Math.exp(-z * z / 2), TOL)) return `Der Vorfaktor ${bruch(1, "√(2π)")} ≈ 0,3989 fehlt. Ohne ihn hätte die Fläche unter der Kurve nicht den Inhalt 1.`;
      if (nahe(val, Math.exp(-z * z) / WURZEL_2PI, TOL)) return `Im Exponenten steht −z² : 2, nicht −z². Die halbe Zahl im Exponenten macht die Kurve breiter.`;
      if (nahe(val, Phi(z), TOL)) return `Das ist Φ(${zText(z)}), die Fläche links von z. Gefragt ist die Höhe der Kurve φ(${zText(z)}).`;
      return `φ(z) = ${bruch(1, "√(2π)")} · e<sup>−z² : 2</sup>.`;
    },
    tipps: [`φ(z) = ${bruch(1, "√(2π)")} · e<sup>−z² : 2</sup>`, `Erst den Exponenten −z² : 2 ausrechnen, dann e hoch das, dann durch √(2π) ≈ 2,5066 teilen.`],
    musterloesungHtml: `−z² : 2 = −(${zText(z)})² : 2 = ${num(-z * z / 2, 3)}<br>` +
      `φ(${zText(z)}) = ${bruch(1, "√(2π)")} · e<sup>${num(-z * z / 2, 3)}</sup> ≈ ${bruch(num(Math.exp(-z * z / 2), 4), "2,5066")} ≈ <strong>${num(w)}</strong>` +
      (z < 0 ? `<br><span class="progress-note">Symmetrie: φ(${zText(z)}) = φ(${zText(-z)}).</span>` : ""),
  };
}

// E4 — Φ und die Symmetrie
const E4_ARTEN = {
  neg: { frage: (z) => `P(Z ≤ ${zText(-z)})`, wert: (F) => 1 - F, falsch: (F) => [[F, "Das ist Φ(z) — die Fläche links vom <strong>positiven</strong> z. Links von −z liegt nur der Rest: 1 − Φ(z)."], [F - 0.5, "Das ist die Fläche zwischen 0 und z. Gefragt ist die Fläche links von −z — wegen der Symmetrie so groß wie die rechts von z: 1 − Φ(z)."]] },
  ge: { frage: (z) => `P(Z ≥ ${zText(z)})`, wert: (F) => 1 - F, falsch: (F) => [[F, "Das ist P(Z ≤ z). „Mindestens z“ ist die Fläche <strong>rechts</strong> von z: 1 − Φ(z)."], [F - 0.5, "Das ist die Fläche zwischen 0 und z. Rechts von z liegt 1 − Φ(z)."]] },
  symm: { frage: (z) => `P(${zText(-z)} ≤ Z ≤ ${zText(z)})`, wert: (F) => 2 * F - 1, falsch: (F) => [[F, "Das ist die Fläche links von z — dazu gehört auch alles links von −z, das abgezogen werden muss: Φ(z) − Φ(−z) = 2 · Φ(z) − 1."], [F - 0.5, "Das ist nur die Fläche zwischen 0 und z — die Hälfte. Wegen der Symmetrie kommt dieselbe Fläche links von 0 dazu."], [1 - F, "Das ist die Fläche rechts von z. Gesucht ist die Fläche zwischen −z und z: 2 · Φ(z) − 1."]] },
  geneg: { frage: (z) => `P(Z ≥ ${zText(-z)})`, wert: (F) => F, falsch: (F) => [[1 - F, "Das ist die Fläche links von −z. „Mindestens −z“ ist alles rechts davon — wegen der Symmetrie genau Φ(z)."], [2 * F - 1, "Das ist die Fläche zwischen −z und z. Rechts von −z liegt auch alles rechts von z: Φ(z)."]] },
};
const E4_KANDIDATEN = spaeter(() => {
  const out = [];
  for (let i = 10; i <= 50; i++) for (const art of Object.keys(E4_ARTEN)) out.push({ z: i / 20, art });
  return out;
});
function generateE4() {
  const v = ohneKollision(E4_KANDIDATEN(), ({ z, art }) => {
    const F = Math.round(Phi(z) * 1e4) / 1e4, a = E4_ARTEN[art];
    return [a.wert(F), ...a.falsch(F).map((x) => x[0])];
  }, EPS);
  const a = E4_ARTEN[v.art], Ft = Math.round(Phi(v.z) * 1e4) / 1e4, w = a.wert(Ft), falsch = a.falsch(Ft);
  const weg = { neg: `P(Z ≤ −z) = 1 − Φ(z)`, ge: `P(Z ≥ z) = 1 − Φ(z)`, symm: `P(−z ≤ Z ≤ z) = Φ(z) − Φ(−z) = Φ(z) − (1 − Φ(z)) = 2 · Φ(z) − 1`, geneg: `P(Z ≥ −z) = 1 − Φ(−z) = 1 − (1 − Φ(z)) = Φ(z)` }[v.art];
  const rechnung = { neg: `1 − ${festeStellen(Ft)}`, ge: `1 − ${festeStellen(Ft)}`, symm: `2 · ${festeStellen(Ft)} − 1`, geneg: festeStellen(Ft) }[v.art];
  return {
    promptHtml: `Z ist standardnormalverteilt. Aus der Tabelle liest man Φ(${zText(v.z)}) = ${festeStellen(Ft)} ab. <strong>Berechne ${a.frage(v.z)}.</strong>`,
    correct: w, tolerance: TOL, placeholder: "P = …",
    hinweis: (roh, val) => {
      const f = falsch.find(([x]) => nahe(val, x, TOL));
      return f ? f[1] : `Skizziere die Glockenkurve und markiere die gesuchte Fläche. Die ganze Fläche ist 1, die Kurve ist symmetrisch zu 0.`;
    },
    tipps: [`Zeichne die Glockenkurve und schraffiere die gesuchte Fläche. Φ(z) ist die Fläche links von z.`, `Die Gesamtfläche ist 1, und die Kurve ist symmetrisch: Φ(−z) = 1 − Φ(z).`],
    musterloesungHtml: `${weg}<br>${a.frage(v.z)} = ${rechnung} = <strong>${num(w)}</strong>`,
  };
}

// ================= mittel =================

// M1 — lokale Näherungsformel
const M1_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const k of LOKAL_KETTEN) for (let j = -2 * k.s; j <= 2 * k.s; j++) out.push({ ...k, j });
  return out;
});
function generateM1() {
  const v = ohneKollision(M1_KANDIDATEN(), ({ s, j }) => {
    const z = j / s;
    return [phi(z) / s, phi(z), phi(z) / (s * s)];
  }, EPS);
  const { n, p, mu, s, j } = v, k = mu + j, z = j / s, w = phi(z) / s, genau = B(n, p, k);
  return {
    promptHtml: `${ketteText(v)} <strong>Berechne P(X = ${k}) näherungsweise mit der lokalen Näherungsformel von de Moivre und Laplace.</strong> Runde ${PLATZ}.`,
    correct: w, tolerance: TOL, placeholder: "P(X = k) ≈ …",
    hinweis: (roh, val) => {
      if (nahe(val, phi(z), TOL)) return `Das ist φ(z), die Säulenhöhe im <strong>standardisierten</strong> Histogramm. Die Wahrscheinlichkeit ist σ-mal kleiner: durch σ = ${s} teilen.`;
      if (nahe(val, phi(z) / (s * s), TOL)) return `Du hast durch σ² geteilt. Die Formel lautet ${bruch(1, "σ")} · φ(z) — durch die Standardabweichung, nicht durch die Varianz.`;
      if (nahe(val, genau, TOL)) return `Das ist der genaue Wert nach der Formel von Bernoulli. Gefragt ist die Näherung ${bruch(1, "σ")} · φ(z) — sie weicht ein wenig ab.`;
      return `Erst μ, σ und z = (k − μ) : σ, dann P(X = k) ≈ ${bruch(1, "σ")} · φ(z).`;
    },
    tipps: [`μ = n · p, σ = √(n · p · (1 − p)), z = (k − μ) : σ.`, `B(n; p; k) ≈ ${bruch(1, "σ")} · φ(z) mit φ(z) = ${bruch(1, "√(2π)")} · e<sup>−z² : 2</sup>.`],
    musterloesungHtml: `${kennText(v)} &gt; 3 ✓<br>z = ${bruch(`${k} − ${mu}`, s)} = ${zText(z)}, &nbsp; φ(${zText(z)}) ≈ ${num(phi(z))}<br>` +
      `P(X = ${k}) ≈ ${bruch(1, s)} · ${num(phi(z))} ≈ <strong>${num(w)}</strong><br>` +
      `<span class="progress-note">Genau (Formel von Bernoulli): B(${n}; ${pText(p)}; ${k}) ≈ ${num(genau)}.</span>`,
  };
}

// M2 — globale Näherung: höchstens k
const GLOBAL_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const k of GLOBAL_KETTEN) for (let j = -2 * k.s; j <= 2 * k.s; j++) out.push({ ...k, j });
  return out;
});
function generateM2() {
  const v = ohneKollision(GLOBAL_KANDIDATEN(), ({ s, j }) => [Phi((j + 0.5) / s), Phi(j / s), Phi((j - 0.5) / s), 1 - Phi((j + 0.5) / s)], EPS);
  const { n, p, mu, s, j } = v, k = mu + j, z = (j + 0.5) / s, w = Phi(z), genau = F(n, p, k);
  return {
    promptHtml: `${ketteText(v)} <strong>Berechne P(X ≤ ${k}) näherungsweise mit der globalen Näherungsformel.</strong> Runde ${PLATZ}.`,
    correct: w, tolerance: TOL, placeholder: "P(X ≤ k) ≈ …",
    hinweis: (roh, val) => {
      if (nahe(val, Phi(j / s), TOL)) return `Ohne Stetigkeitskorrektur: Die Säule über ${k} reicht bis ${k} + 0,5. Wer bei ${k} aufhört, schneidet ihre rechte Hälfte ab.`;
      if (nahe(val, Phi((j - 0.5) / s), TOL)) return `Die Korrektur geht hier nach rechts: Die Säule über ${k} gehört dazu, die Fläche endet an ihrem rechten Rand ${k} + 0,5.`;
      if (nahe(val, 1 - w, TOL)) return `Das ist die Fläche rechts — P(X &gt; ${k}). „Höchstens“ ist die Fläche links von z: Φ(z).`;
      if (nahe(val, genau, TOL)) return `Das ist der genaue Wert F(${n}; ${pText(p)}; ${k}). Gefragt ist die Näherung mit Φ.`;
      return `P(X ≤ k) ≈ Φ((k + 0,5 − μ) : σ).`;
    },
    tipps: [`μ und σ ausrechnen; σ &gt; 3?`, `P(X ≤ k) ≈ Φ(${bruch("k + 0,5 − μ", "σ")}) — die + 0,5 ist die Stetigkeitskorrektur.`],
    musterloesungHtml: `${kennText(v)} &gt; 3 ✓<br>z = ${bruch(`${k} + 0,5 − ${mu}`, s)} = ${zText(z)}<br>` +
      `P(X ≤ ${k}) ≈ Φ(${zText(z)}) ≈ <strong>${num(w)}</strong><br>` +
      `<span class="progress-note">Genau: F(${n}; ${pText(p)}; ${k}) ≈ ${num(genau)}.</span>`,
  };
}

// Normalverteilte Größen: Körpergröße und Füllgewicht. σ so, dass (x − μ) : σ höchstens zwei
// Nachkommastellen hat — für ganzzahlige Abstände reichen σ = 2, 4, 5, 10, 20, 25.
const GROESSEN = [
  { id: "koerper", text: (mu, s) => `Die Körpergröße X erwachsener Frauen ist näherungsweise normalverteilt mit μ = ${num(mu)} cm und σ = ${num(s)} cm.`, e: "cm", mus: [162, 164, 166, 168, 170], sigmas: [4, 5, 10] },
  { id: "kaffee", text: (mu, s) => `Das Füllgewicht X einer Packung Kaffee ist normalverteilt mit μ = ${num(mu)} g und σ = ${num(s)} g.`, e: "g", mus: [250, 500, 1000], sigmas: [2, 4, 5] },
];

// M3 — normalverteilt: höchstens b
const M3_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const g of GROESSEN) for (const mu of g.mus) for (const s of g.sigmas) for (let d = -Math.floor(2.5 * s); d <= Math.floor(2.5 * s); d++) if (d !== 0) out.push({ g: g.id, mu, s, d });
  return out;
});
function generateM3() {
  const v = ohneKollision(M3_KANDIDATEN(), ({ s, d }) => [Phi(d / s), Phi((d + 0.5) / s), Phi(d / (s * s)), 1 - Phi(d / s)], EPS);
  const g = GROESSEN.find((x) => x.id === v.g), b = v.mu + v.d, z = v.d / v.s, w = Phi(z);
  return {
    promptHtml: `${g.text(v.mu, v.s)} <strong>Mit welcher Wahrscheinlichkeit ist X höchstens ${num(b)} ${g.e}?</strong> Runde ${PLATZ}.`,
    correct: w, tolerance: TOL, placeholder: "P(X ≤ b) = …",
    hinweis: (roh, val) => {
      if (nahe(val, Phi((v.d + 0.5) / v.s), TOL)) return `Die Stetigkeitskorrektur gehört zu Histogrammen. X ist normalverteilt und hat keine Säulen — gerechnet wird mit (b − μ) : σ.`;
      if (nahe(val, Phi(v.d / (v.s * v.s)), TOL)) return `Du hast durch σ² geteilt. Standardisiert wird mit z = (b − μ) : σ.`;
      if (nahe(val, 1 - w, TOL)) return `Das ist P(X ≥ ${num(b)}). „Höchstens“ ist die Fläche links von b: Φ(z).`;
      return `Standardisieren: z = (b − μ) : σ, dann P(X ≤ b) = Φ(z).`;
    },
    tipps: [`Standardisiere: z = (b − μ) : σ.`, `P(X ≤ b) = Φ(z) — Tabelle oder Rechner.`],
    musterloesungHtml: `z = ${bruch(`${num(b)} − ${num(v.mu)}`, num(v.s))} = ${zText(z)}<br>P(X ≤ ${num(b)}) = Φ(${zText(z)}) ≈ <strong>${num(w)}</strong>`,
  };
}

// M4 — σ-Regeln
const M4_ARTEN = ["zwischen", "mehr", "weniger"];
const M4_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const g of GROESSEN) for (const mu of g.mus) for (const s of g.sigmas) for (const m of [1, 2, 3]) for (const art of M4_ARTEN) out.push({ g: g.id, mu, s, m, art });
  return out;
});
function m4Werte({ m, art }) {
  const innen = Phi(m) - Phi(-m);
  if (art === "zwischen") return { w: innen, falsch: [[Phi(m), "Das ist P(X ≤ μ + kσ) — die Fläche links von der oberen Grenze. Links von der unteren Grenze liegt noch ein Stück, das abgezogen werden muss."], [innen / 2, "Das ist nur eine Hälfte: die Fläche zwischen μ und μ + kσ. Die σ-Umgebung reicht nach beiden Seiten."]] };
  return { w: 1 - Phi(m), falsch: [[1 - innen, "Das sind beide Ränder zusammen — außerhalb der σ-Umgebung auf beiden Seiten. Gefragt ist nur eine Seite: die Hälfte davon."], [Phi(m), `Das ist die Fläche auf der anderen Seite der Grenze. Gefragt ist der Rand ${art === "mehr" ? "rechts" : "links"}.`]] };
}
function generateM4() {
  const v = ohneKollision(M4_KANDIDATEN(), (k) => { const { w, falsch } = m4Werte(k); return [w, ...falsch.map((x) => x[0])]; }, EPS);
  const g = GROESSEN.find((x) => x.id === v.g), { w, falsch } = m4Werte(v);
  const lo = v.mu - v.m * v.s, hi = v.mu + v.m * v.s;
  const frage = v.art === "zwischen" ? `liegt X zwischen ${num(lo)} ${g.e} und ${num(hi)} ${g.e}` : v.art === "mehr" ? `ist X größer als ${num(hi)} ${g.e}` : `ist X kleiner als ${num(lo)} ${g.e}`;
  const regel = { 1: "68,3 %", 2: "95,4 %", 3: "99,7 %" }[v.m];
  return {
    promptHtml: `${g.text(v.mu, v.s)} <strong>Mit welcher Wahrscheinlichkeit ${frage}?</strong> Gib das Ergebnis ${PLATZ} oder in Prozent an.`,
    correct: w, tolerance: TOL, placeholder: "P = …",
    hinweis: (roh, val) => {
      const f = falsch.find(([x]) => nahe(val, x, TOL));
      return f ? f[1] : `Wie viele σ liegt die Grenze von μ entfernt? Dann helfen die σ-Regeln.`;
    },
    tipps: [`Rechne aus, wie viele σ die Grenze${v.art === "zwischen" ? "n" : ""} von μ entfernt ${v.art === "zwischen" ? "liegen" : "liegt"}.`, `σ-Regeln: μ ± σ: 68,3 %, μ ± 2σ: 95,4 %, μ ± 3σ: 99,7 %.`],
    musterloesungHtml: (v.art === "zwischen"
      ? `${num(lo)} = μ − ${v.m}σ und ${num(hi)} = μ + ${v.m}σ: die ${v.m}σ-Umgebung.<br>P = Φ(${v.m}) − Φ(−${v.m}) ≈ <strong>${num(w)}</strong> — die σ-Regel ${regel}.`
      : `${num(v.art === "mehr" ? hi : lo)} = μ ${v.art === "mehr" ? "+" : "−"} ${v.m}σ. Außerhalb der ${v.m}σ-Umgebung liegen 1 − ${regel}, auf jeder Seite die Hälfte.<br>P = 1 − Φ(${v.m}) ≈ <strong>${num(w)}</strong>`),
  };
}

// ================= schwierig =================

// S1 — globale Näherung: mindestens a
function generateS1() {
  const v = ohneKollision(GLOBAL_KANDIDATEN(), ({ s, j }) => [1 - Phi((j - 0.5) / s), 1 - Phi((j + 0.5) / s), Phi((j - 0.5) / s), 1 - Phi(j / s)], EPS);
  const { n, p, mu, s, j } = v, a = mu + j, z = (j - 0.5) / s, w = 1 - Phi(z), genau = 1 - F(n, p, a - 1);
  return {
    promptHtml: `${ketteText(v)} <strong>Berechne P(X ≥ ${a}) näherungsweise mit der globalen Näherungsformel.</strong> Runde ${PLATZ}.`,
    correct: w, tolerance: TOL, placeholder: "P(X ≥ a) ≈ …",
    hinweis: (roh, val) => {
      if (nahe(val, 1 - Phi((j + 0.5) / s), TOL)) return `Die Korrektur zeigt in die falsche Richtung. Die Säule über ${a} gehört dazu: Die Fläche beginnt an ihrem <strong>linken</strong> Rand ${a} − 0,5.`;
      if (nahe(val, Phi(z), TOL)) return `Das ist P(X ≤ ${a - 1}), das Gegenereignis. „Mindestens“ ist 1 − Φ(z).`;
      if (nahe(val, 1 - Phi(j / s), TOL)) return `Ohne Stetigkeitskorrektur fehlt die linke Hälfte der Säule über ${a}.`;
      if (nahe(val, genau, TOL)) return `Das ist der genaue Wert. Gefragt ist die Näherung mit Φ.`;
      return `P(X ≥ a) = 1 − P(X ≤ a − 1) ≈ 1 − Φ((a − 0,5 − μ) : σ).`;
    },
    tipps: [`Gegenereignis: P(X ≥ ${a}) = 1 − P(X ≤ ${a - 1}).`, `P(X ≤ ${a - 1}) ≈ Φ(${bruch(`${a - 1} + 0,5 − μ`, "σ")}).`],
    musterloesungHtml: `${kennText(v)} &gt; 3 ✓<br>P(X ≥ ${a}) = 1 − P(X ≤ ${a - 1}) ≈ 1 − Φ(${bruch(`${a} − 0,5 − ${mu}`, s)}) = 1 − Φ(${zText(z)})<br>` +
      `≈ 1 − ${num(Phi(z))} = <strong>${num(w)}</strong><br><span class="progress-note">Genau: 1 − F(${n}; ${pText(p)}; ${a - 1}) ≈ ${num(genau)}.</span>`,
  };
}

// S2 — globale Näherung: von a bis b
const S2_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const k of GLOBAL_KETTEN) for (let ja = -2 * k.s; ja <= k.s; ja++) for (let jb = ja + 2; jb <= 2 * k.s; jb++) out.push({ ...k, ja, jb });
  return out;
});
function s2Werte({ s, ja, jb }) {
  return [Phi((jb + 0.5) / s) - Phi((ja - 0.5) / s), Phi(jb / s) - Phi(ja / s), Phi((jb - 0.5) / s) - Phi((ja + 0.5) / s), Phi((jb + 0.5) / s)];
}
function generateS2() {
  const v = ohneKollision(S2_KANDIDATEN(), s2Werte, EPS);
  const { n, p, mu, s, ja, jb } = v, a = mu + ja, b = mu + jb;
  const [w, ohne, innen, nurOben] = s2Werte(v);
  const genau = F(n, p, b) - F(n, p, a - 1);
  return {
    promptHtml: `${ketteText(v)} <strong>Berechne P(${a} ≤ X ≤ ${b}) näherungsweise mit der globalen Näherungsformel.</strong> Runde ${PLATZ}.`,
    correct: w, tolerance: TOL, placeholder: "P ≈ …",
    hinweis: (roh, val) => {
      if (nahe(val, ohne, TOL)) return `Ohne Stetigkeitskorrektur fehlen die äußeren Hälften der Säulen über ${a} und ${b}. Die Fläche reicht von ${a} − 0,5 bis ${b} + 0,5.`;
      if (nahe(val, innen, TOL)) return `Die Korrekturen zeigen nach innen. Beide Randsäulen gehören dazu: unten ab ${a} − 0,5, oben bis ${b} + 0,5.`;
      if (nahe(val, nurOben, TOL)) return `Das ist P(X ≤ ${b}). Alles unterhalb von ${a} muss noch abgezogen werden.`;
      if (nahe(val, genau, TOL)) return `Das ist der genaue Wert. Gefragt ist die Näherung mit Φ.`;
      return `P(a ≤ X ≤ b) ≈ Φ((b + 0,5 − μ) : σ) − Φ((a − 0,5 − μ) : σ).`;
    },
    tipps: [`Die Säulen von ${a} bis ${b} reichen von ${a} − 0,5 bis ${b} + 0,5.`, `P ≈ Φ(${bruch("b + 0,5 − μ", "σ")}) − Φ(${bruch("a − 0,5 − μ", "σ")}).`],
    musterloesungHtml: `${kennText(v)} &gt; 3 ✓<br>z<sub>b</sub> = ${bruch(`${b} + 0,5 − ${mu}`, s)} = ${zText((jb + 0.5) / s)}, &nbsp; z<sub>a</sub> = ${bruch(`${a} − 0,5 − ${mu}`, s)} = ${zText((ja - 0.5) / s)}<br>` +
      `P(${a} ≤ X ≤ ${b}) ≈ Φ(${zText((jb + 0.5) / s)}) − Φ(${zText((ja - 0.5) / s)}) ≈ ${num(Phi((jb + 0.5) / s))} − ${num(Phi((ja - 0.5) / s))} = <strong>${num(w)}</strong><br>` +
      `<span class="progress-note">Genau: F(${n}; ${pText(p)}; ${b}) − F(${n}; ${pText(p)}; ${a - 1}) ≈ ${num(genau)}.</span>`,
  };
}

// S3 — normalverteilt: zwischen zwei Grenzen
const S3_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const g of GROESSEN) for (const mu of g.mus) for (const s of g.sigmas) {
    const r = Math.floor(2.5 * s);
    for (let da = -r; da <= r; da++) for (let db = da + 1; db <= r; db++) out.push({ g: g.id, mu, s, da, db });
  }
  return out;
});
function s3Werte({ s, da, db }) {
  return [Phi(db / s) - Phi(da / s), Phi((db + 0.5) / s) - Phi((da - 0.5) / s), Phi(db / (s * s)) - Phi(da / (s * s)), Phi(db / s)];
}
function generateS3() {
  const v = ohneKollision(S3_KANDIDATEN(), s3Werte, EPS);
  const g = GROESSEN.find((x) => x.id === v.g), a = v.mu + v.da, b = v.mu + v.db;
  const [w, korr, quadrat, nurOben] = s3Werte(v);
  return {
    promptHtml: `${g.text(v.mu, v.s)} <strong>Mit welcher Wahrscheinlichkeit liegt X zwischen ${num(a)} ${g.e} und ${num(b)} ${g.e}?</strong> Runde ${PLATZ}.`,
    correct: w, tolerance: TOL, placeholder: "P = …",
    hinweis: (roh, val) => {
      if (nahe(val, korr, TOL)) return `Hier keine Stetigkeitskorrektur: X ist normalverteilt, nicht binomialverteilt. Die ± 0,5 gehören zu den Säulen eines Histogramms.`;
      if (nahe(val, quadrat, TOL)) return `Du hast durch σ² geteilt. Standardisiert wird mit (x − μ) : σ.`;
      if (nahe(val, nurOben, TOL)) return `Das ist P(X ≤ ${num(b)}). Die Fläche links von ${num(a)} muss noch abgezogen werden.`;
      return `P(a ≤ X ≤ b) = Φ((b − μ) : σ) − Φ((a − μ) : σ).`;
    },
    tipps: [`Beide Grenzen standardisieren: z = (x − μ) : σ.`, `P(a ≤ X ≤ b) = Φ(z<sub>b</sub>) − Φ(z<sub>a</sub>); für negative z: Φ(−z) = 1 − Φ(z).`],
    musterloesungHtml: `z<sub>a</sub> = ${bruch(`${num(a)} − ${num(v.mu)}`, num(v.s))} = ${zText(v.da / v.s)}, &nbsp; z<sub>b</sub> = ${bruch(`${num(b)} − ${num(v.mu)}`, num(v.s))} = ${zText(v.db / v.s)}<br>` +
      `P = Φ(${zText(v.db / v.s)}) − Φ(${zText(v.da / v.s)}) ≈ ${num(Phi(v.db / v.s))} − ${num(Phi(v.da / v.s))} = <strong>${num(w)}</strong>`,
  };
}

// S4 — Grenze gesucht
const GAMMAS = [0.01, 0.025, 0.05, 0.1, 0.9, 0.95, 0.975, 0.99];
const S4_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const g of GROESSEN) for (const mu of g.mus) for (const s of g.sigmas) for (const anteil of GAMMAS) for (const seite of ["unter", "ueber"]) out.push({ g: g.id, mu, s, anteil, seite });
  return out;
});
function s4Werte({ mu, s, anteil, seite }) {
  // „anteil unterschreiten c“: P(X ≤ c) = anteil; „anteil überschreiten c“: P(X ≥ c) = anteil.
  const gamma = seite === "unter" ? anteil : 1 - anteil;
  const z = PhiInv(gamma), zweiseitig = PhiInv(gamma < 0.5 ? gamma / 2 : (1 + gamma) / 2);
  return { z, c: mu + z * s, falsch: [[mu - z * s, "Das Vorzeichen von z stimmt nicht."], [mu + zweiseitig * s, "zweiseitig"]] };
}
function generateS4() {
  const v = ohneKollision(S4_KANDIDATEN(), (k) => { const r = s4Werte(k); return [r.c, ...r.falsch.map((x) => x[0])]; }, 2.5 * tolGrenze(10));
  const g = GROESSEN.find((x) => x.id === v.g), { z, c, falsch } = s4Werte(v), tol = tolGrenze(v.s);
  const gamma = v.seite === "unter" ? v.anteil : 1 - v.anteil;
  const prozent = num(v.anteil * 100, 1) + " %";
  // „nur“ passt zu kleinen Anteilen: „nur 5 % unterschreiten c“, aber „90 % unterschreiten c“.
  const nur = v.anteil < 0.5 ? "nur " : "";
  const frage = v.seite === "unter" ? `Welchen Wert c unterschreiten ${nur}${prozent} der Werte?` : `Welchen Wert c überschreiten ${nur}${prozent} der Werte?`;
  return {
    promptHtml: `${g.text(v.mu, v.s)} <strong>${frage}</strong> Bestimme c auf eine Nachkommastelle.`,
    correct: c, tolerance: tol, placeholder: `c = … ${g.e}`,
    hinweis: (roh, val) => {
      if (nahe(val, falsch[0][0], tol)) return `Das liegt auf der falschen Seite von μ. ${gamma < 0.5 ? `Φ(z) = ${num(gamma, 3)} &lt; 0,5 heißt: z ist negativ, c liegt <strong>links</strong> von μ.` : `Φ(z) = ${num(gamma, 3)} &gt; 0,5 heißt: z ist positiv, c liegt <strong>rechts</strong> von μ.`}`;
      if (nahe(val, falsch[1][0], tol)) return `Du hast den Anteil auf beide Seiten verteilt. Hier liegt er nur auf einer Seite: Φ(z) = ${num(gamma, 3)}.`;
      return `Übersetze in Φ(z) = γ, lies z rückwärts ab und rechne c = μ + z · σ.`;
    },
    tipps: [`${v.seite === "unter" ? `P(X ≤ c) = ${num(gamma, 3)}` : `P(X ≥ c) = ${num(v.anteil, 3)}, also P(X ≤ c) = ${num(gamma, 3)}`}.`, `Gesucht ist z mit Φ(z) = ${num(gamma, 3)}; dann c = μ + z · σ.`],
    musterloesungHtml: `${v.seite === "unter" ? `P(X ≤ c) = ${num(gamma, 3)}` : `P(X ≥ c) = ${num(v.anteil, 3)} ⟺ P(X ≤ c) = ${num(gamma, 3)}`}<br>` +
      `Φ(z) = ${num(gamma, 3)} ⟹ z ≈ ${num(z, 3)}${gamma < 0.5 ? ` (wegen Φ(${num(-z, 3)}) ≈ ${num(1 - gamma, 3)})` : ""}<br>` +
      `c = μ + z · σ ≈ ${num(v.mu)} ${z < 0 ? "−" : "+"} ${num(Math.abs(z), 3)} · ${num(v.s)} ≈ <strong>${num(c, 1)} ${g.e}</strong><br>` +
      `<em>Probe:</em> Φ(${bruch(`${num(c, 1)} − ${num(v.mu)}`, num(v.s))}) ≈ ${num(Phi((Math.round(c * 10) / 10 - v.mu) / v.s), 3)} ✓`,
  };
}

// ================= komplex =================

// K1 — Überbuchung
const K1_KANDIDATEN = spaeter(() => {
  const out = [];
  for (let d = 3; d <= 25; d++) out.push({ ...kette(625, 0.8), d });
  return out;
});
function generateK1() {
  const v = ohneKollision(K1_KANDIDATEN(), ({ s, d }) => [1 - Phi((d + 0.5) / s), 1 - Phi(d / s), 1 - Phi((d - 0.5) / s), Phi((d + 0.5) / s)], EPS);
  const { n, p, mu, s, d } = v, plaetze = mu + d, z = (d + 0.5) / s, w = 1 - Phi(z);
  return {
    promptHtml: `Ein Ferienflieger hat ${plaetze} Plätze. Erfahrungsgemäß tritt jeder Fluggast mit der Wahrscheinlichkeit ${num(p, 2)} seinen Flug an, unabhängig von den anderen. Die Gesellschaft verkauft ${n} Tickets. <strong>Mit welcher Wahrscheinlichkeit erscheinen mehr Fluggäste, als Plätze da sind?</strong> Rechne mit der globalen Näherungsformel und runde ${PLATZ}.`,
    correct: w, tolerance: TOL, placeholder: "P ≈ …",
    hinweis: (roh, val) => {
      if (nahe(val, 1 - Phi(d / s), TOL)) return `Ohne Stetigkeitskorrektur. „Mehr als ${plaetze}“ heißt X ≥ ${plaetze + 1}; die Fläche beginnt am Rand ${plaetze} + 0,5.`;
      if (nahe(val, 1 - Phi((d - 0.5) / s), TOL)) return `Das ist P(X ≥ ${plaetze}). Wenn genau ${plaetze} kommen, reichen die Plätze noch — gefragt ist X &gt; ${plaetze}.`;
      if (nahe(val, Phi((d + 0.5) / s), TOL)) return `Das ist P(X ≤ ${plaetze}), die Wahrscheinlichkeit, dass alle einen Platz bekommen. Gefragt ist das Gegenereignis.`;
      return `X = Anzahl der erscheinenden Fluggäste, binomialverteilt mit n = ${n}, p = ${num(p, 2)}. Gesucht: P(X &gt; ${plaetze}) = 1 − P(X ≤ ${plaetze}).`;
    },
    tipps: [`X = Anzahl der Fluggäste, die erscheinen: n = ${n}, p = ${num(p, 2)}. Gesucht ist P(X &gt; ${plaetze}).`, `P(X &gt; ${plaetze}) = 1 − P(X ≤ ${plaetze}) ≈ 1 − Φ(${bruch(`${plaetze} + 0,5 − μ`, "σ")}).`],
    musterloesungHtml: `${kennText(v)} &gt; 3 ✓<br>P(X &gt; ${plaetze}) = 1 − P(X ≤ ${plaetze}) ≈ 1 − Φ(${bruch(`${plaetze} + 0,5 − ${mu}`, s)}) = 1 − Φ(${zText(z)})<br>` +
      `≈ 1 − ${num(Phi(z))} = <strong>${num(w)}</strong> — in etwa ${num(w * 100, 1)} % der Flüge reichen die Plätze nicht.`,
  };
}

// K2 — σ gesucht
const ALPHAS = [0.01, 0.02, 0.05, 0.1];
const K2_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const mu of [500, 1000]) for (const d of [5, 8, 10, 12, 15, 20]) for (const alpha of ALPHAS) out.push({ mu, d, alpha });
  return out;
});
function k2Werte({ d, alpha }) {
  const z = PhiInv(1 - alpha), z2 = PhiInv(1 - alpha / 2);
  return { z, s: d / z, falsch: [[d / z2, "zweiseitig"], [d * z, "mal"]] };
}
function generateK2() {
  const v = ohneKollision(K2_KANDIDATEN(), (k) => { const r = k2Werte(k); return [r.s, ...r.falsch.map((x) => x[0])]; }, 0.15);
  const { z, s, falsch } = k2Werte(v), m = v.mu - v.d, tol = 0.004 * s + 0.006;
  return {
    promptHtml: `Eine Anlage füllt Packungen mit dem Sollgewicht μ = ${num(v.mu)} g; das Füllgewicht ist normalverteilt. Höchstens ${num(v.alpha * 100)} % der Packungen dürfen weniger als ${num(m)} g enthalten. <strong>Wie groß darf die Standardabweichung σ höchstens sein?</strong> Runde auf zwei Nachkommastellen.`,
    correct: s, tolerance: tol, placeholder: "σ = … g",
    hinweis: (roh, val) => {
      if (nahe(val, falsch[0][0], tol)) return `Du hast die ${num(v.alpha * 100)} % auf beide Seiten verteilt. Zu wenig Kaffee gibt es nur auf einer Seite: Φ(z) = ${num(1 - v.alpha, 2)}.`;
      if (nahe(val, falsch[1][0], tol)) return `Aus (μ − ${num(m)}) : σ = z folgt σ = (μ − ${num(m)}) : z — geteilt, nicht malgenommen.`;
      return `P(X &lt; ${num(m)}) = Φ((${num(m)} − μ) : σ) ≤ ${num(v.alpha, 2)}. Löse nach σ auf.`;
    },
    tipps: [`P(X &lt; ${num(m)}) = Φ(${bruch(`${num(m)} − ${num(v.mu)}`, "σ")}) = ${num(v.alpha, 2)} gilt an der Grenze.`, `Φ(z) = ${num(v.alpha, 2)} ⟹ z = −${num(z, 3)}; dann σ = ${bruch(`${num(m)} − ${num(v.mu)}`, "z")}.`],
    musterloesungHtml: `Grenzfall: Φ(${bruch(`${num(m)} − ${num(v.mu)}`, "σ")}) = ${num(v.alpha, 2)} ⟹ ${bruch(`−${num(v.d)}`, "σ")} = −${num(z, 3)}<br>` +
      `σ = ${bruch(num(v.d), num(z, 3))} ≈ <strong>${num(s, 2)} g</strong>. Ist σ kleiner, liegen noch weniger Packungen unter ${num(m)} g.<br>` +
      `<em>Probe:</em> Φ(${bruch(`−${num(v.d)}`, num(s, 2))}) ≈ ${num(Phi(-v.d / (Math.round(s * 100) / 100)), 4)} ≈ ${num(v.alpha, 2)} ✓`,
  };
}

// K3 — μ gesucht
const K3_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const m of [250, 500, 1000]) for (const s of [2, 4, 5]) for (const alpha of ALPHAS) out.push({ m, s, alpha });
  return out;
});
function k3Werte({ m, s, alpha }) {
  const z = PhiInv(1 - alpha), z2 = PhiInv(1 - alpha / 2);
  return { z, mu: m + z * s, falsch: [[m - z * s, "Vorzeichen"], [m + z2 * s, "zweiseitig"]] };
}
function generateK3() {
  const v = ohneKollision(K3_KANDIDATEN(), (k) => { const r = k3Werte(k); return [r.mu, ...r.falsch.map((x) => x[0])]; }, 2.5 * tolGrenze(5));
  const { z, mu, falsch } = k3Werte(v), tol = tolGrenze(v.s);
  return {
    promptHtml: `Auf Packungen steht „${num(v.m)} g“. Die Anlage füllt normalverteilt mit σ = ${num(v.s)} g ab; den Mittelwert μ kann man einstellen. Höchstens ${num(v.alpha * 100)} % der Packungen dürfen weniger als ${num(v.m)} g enthalten. <strong>Auf welchen Wert muss μ mindestens eingestellt werden?</strong> Runde auf eine Nachkommastelle.`,
    correct: mu, tolerance: tol, placeholder: "μ = … g",
    hinweis: (roh, val) => {
      if (nahe(val, falsch[0][0], tol)) return `Dann läge μ unter ${num(v.m)} g, und mehr als die Hälfte der Packungen wäre zu leicht. μ muss um z · σ <strong>über</strong> ${num(v.m)} g liegen.`;
      if (nahe(val, falsch[1][0], tol)) return `Du hast die ${num(v.alpha * 100)} % auf beide Seiten verteilt. Zu leicht ist nur eine Seite: Φ(z) = ${num(1 - v.alpha, 2)}.`;
      return `P(X &lt; ${num(v.m)}) = Φ((${num(v.m)} − μ) : σ) = ${num(v.alpha, 2)} an der Grenze. Löse nach μ auf.`;
    },
    tipps: [`An der Grenze gilt Φ(${bruch(`${num(v.m)} − μ`, num(v.s))}) = ${num(v.alpha, 2)}.`, `Φ(z) = ${num(v.alpha, 2)} ⟹ z = −${num(z, 3)}; dann μ = ${num(v.m)} + ${num(z, 3)} · σ.`],
    musterloesungHtml: `Φ(${bruch(`${num(v.m)} − μ`, num(v.s))}) = ${num(v.alpha, 2)} ⟹ ${bruch(`${num(v.m)} − μ`, num(v.s))} = −${num(z, 3)}<br>` +
      `μ = ${num(v.m)} + ${num(z, 3)} · ${num(v.s)} ≈ <strong>${num(mu, 1)} g</strong><br>` +
      `<em>Probe:</em> Φ(${bruch(`${num(v.m)} − ${num(mu, 1)}`, num(v.s))}) ≈ ${num(Phi((v.m - Math.round(mu * 10) / 10) / v.s), 4)} ≈ ${num(v.alpha, 2)} ✓`,
  };
}

// K4 — symmetrischer Bereich um μ (Prognoseintervall)
const K4_GAMMAS = [0.9, 0.95, 0.99];
const K4_KANDIDATEN = spaeter(() => {
  const out = [];
  for (const k of GLOBAL_KETTEN) for (const gamma of K4_GAMMAS) out.push({ ...k, gamma });
  return out;
});
function k4Werte({ mu, s, gamma }) {
  const z = PhiInv((1 + gamma) / 2), z1 = PhiInv(gamma);
  return { z, z1, lo: mu - z * s, hi: mu + z * s, falschLo: [[mu - z1 * s, "einseitig"], [mu - z * s * s, "Varianz"]], falschHi: [[mu + z1 * s, "einseitig"], [mu + z * s * s, "Varianz"]] };
}
function generateK4() {
  const v = ohneKollision(K4_KANDIDATEN(), (k) => { const r = k4Werte(k); return [r.lo, ...r.falschLo.map((x) => x[0])]; }, 2.5 * tolGrenze(10));
  const { z, z1, lo, hi, falschLo, falschHi } = k4Werte(v), tol = tolGrenze(v.s);
  const prozent = num(v.gamma * 100) + " %";
  const hinweisFeld = (falsch, wo) => (roh, val) => {
    if (nahe(val, falsch[0][0], tol)) return `Mit z = ${num(z1, 3)} läge ${prozent} links von der ${wo === "oben" ? "oberen" : "unteren"} Grenze — symmetrisch um μ muss auf <strong>jeder</strong> Seite die Hälfte des Rests liegen: Φ(z) = ${num((1 + v.gamma) / 2, 3)}.`;
    if (nahe(val, falsch[1][0], tol)) return `Du hast mit σ² = ${num(v.s * v.s)} gerechnet. Der Bereich ist μ ± z · σ.`;
    return `Der Bereich ist μ ± z · σ mit Φ(z) = ${num((1 + v.gamma) / 2, 3)}.`;
  };
  return {
    promptHtml: `${ketteText(v)} <strong>In welchem symmetrischen Bereich um μ liegt X mit der Wahrscheinlichkeit ${prozent}?</strong> Rechne mit der Normalverteilung als Näherung und gib die Grenzen auf eine Nachkommastelle an.`,
    felder: [
      { name: "untere Grenze", soll: lo, toleranz: tol, platzhalter: "μ − d", hinweis: hinweisFeld(falschLo, "unten") },
      { name: "obere Grenze", soll: hi, toleranz: tol, platzhalter: "μ + d", hinweis: hinweisFeld(falschHi, "oben") },
    ],
    tipps: [`Symmetrisch um μ: Außerhalb liegen ${num(100 - v.gamma * 100)} %, auf jeder Seite die Hälfte.`, `Φ(z) = ${num((1 + v.gamma) / 2, 3)} ⟹ z ≈ ${num(z, 2)}; Grenzen μ ± z · σ.`],
    musterloesungHtml: `${kennText(v)}<br>Φ(z) = ${bruch(`1 + ${num(v.gamma, 2)}`, 2)} = ${num((1 + v.gamma) / 2, 3)} ⟹ z ≈ ${num(z, 3)}<br>` +
      `Bereich: ${num(v.mu)} ± ${num(z, 3)} · ${num(v.s)}, also von <strong>${num(lo, 1)}</strong> bis <strong>${num(hi, 1)}</strong><br>` +
      `<em>Probe:</em> Φ(${num(z, 3)}) − Φ(−${num(z, 3)}) ≈ ${num(Phi(z) - Phi(-z), 3)} ✓`,
  };
}

export const AUFGABEN = [
  { schwierigkeit: "einfach", titel: "Einen Wert standardisieren", abschnitt: "sec-standardisieren", generate: generateE1 },
  { schwierigkeit: "einfach", titel: "Laplace-Bedingung", abschnitt: "sec-laplace", generate: generateE2 },
  { schwierigkeit: "einfach", titel: "Ein Wert der Glockenfunktion", abschnitt: "sec-glockenkurve", generate: generateE3 },
  { schwierigkeit: "einfach", titel: "Φ und die Symmetrie", abschnitt: "sec-global", generate: generateE4 },
  { schwierigkeit: "mittel", titel: "Lokale Näherung", abschnitt: "sec-lokal", generate: generateM1 },
  { schwierigkeit: "mittel", titel: "Höchstens k — global genähert", abschnitt: "sec-global", generate: generateM2 },
  { schwierigkeit: "mittel", titel: "Normalverteilt: höchstens b", abschnitt: "sec-normalverteilung", generate: generateM3 },
  { schwierigkeit: "mittel", titel: "Die σ-Regeln", abschnitt: "sec-normalverteilung", generate: generateM4 },
  { schwierigkeit: "schwierig", titel: "Mindestens a — global genähert", abschnitt: "sec-global", generate: generateS1 },
  { schwierigkeit: "schwierig", titel: "Zwischen a und b — global genähert", abschnitt: "sec-global", generate: generateS2 },
  { schwierigkeit: "schwierig", titel: "Normalverteilt: zwischen zwei Grenzen", abschnitt: "sec-normalverteilung", generate: generateS3 },
  { schwierigkeit: "schwierig", titel: "Eine Grenze gesucht", abschnitt: "sec-umkehr", generate: generateS4 },
  { schwierigkeit: "komplex", titel: "Überbucht?", abschnitt: "sec-global", generate: generateK1 },
  { schwierigkeit: "komplex", titel: "Wie genau muss die Anlage sein?", abschnitt: "sec-umkehr", generate: generateK2 },
  { schwierigkeit: "komplex", titel: "Worauf einstellen?", abschnitt: "sec-umkehr", generate: generateK3 },
  { schwierigkeit: "komplex", titel: "Ein Bereich um μ", abschnitt: ["sec-global", "sec-umkehr"], generate: generateK4 },
];
