// Fachliche Prüfung: MSS 11, Analysis, Kapitel 5 „Faktencheck“ (Anwendungsaufgaben zu 1.1 bis 4.2).
//
// Die Seite rechnet ihre Sollwerte aus den Modellen; diese Prüfung rechnet jeden davon UNABHÄNGIG
// nach — nicht mit den Formeln der Seite, sondern durch Simulation (Zinseszins Jahr für Jahr,
// Dosis für Dosis), numerisches Ableiten, Simpson-Integration, Abtasten von Maxima und Mengen und
// Bisektion. Die Modellterme liest sie aus der Seite und vergleicht sie mit denen, die sie selbst
// verwendet; jede Zeichnung wird aus dem SVG zurückgelesen.
//
//   * Gerüst: Rahmen, Menükarte, zwanzig Fälle (je zwei zu 1.1 bis 4.2, vier komplexe mit
//     mindestens drei Kapiteln), Kurs-Marken, kein Leistungskursstoff in Grundkursfällen,
//     Verweise und Sprungmarken, Behauptungen in Anführungszeichen, Quellen;
//   * jeder Fall: Stufe 3 zeigt nur den Beleg, Merksatz gesperrt; Modelltext; Zeichnung;
//     Urteil mit genau einer richtigen von vier Antworten (Lage wechselt); jeder Fehlerwert löst
//     genau seinen Hinweis aus, ist von Sollwert und anderen Fehlerwerten verschieden; jeder
//     Sollwert wird anerkannt und steht in der Lösung des Schritts; Fall gelöst ⟹ Buchstabe;
//   * die allgemeinen Rückmeldungen (Einheit, Vorzeichen, knapp, unlesbar, unendlich) und die
//     Zahlenerkennung (Dezimalpunkt, Tausenderpunkt, Bruch, angehängte Einheit);
//   * jede Knobelfrage: Sollwert unabhängig nachgerechnet, jeder Fehlerwert löst seinen Hinweis
//     aus, der Vergleich mit der Musterantwort öffnet sich erst nach dem ersten Versuch, die
//     Musterantwort nennt jeden Sollwert; Hinweise zeigen kein rohes HTML;
//   * Modellkritik: ohne eigenen Satz keine Musterantwort, danach Selbsteinschätzung, gespeichert;
//   * Aufdecken, Musterlösung, Stufe 1, Grundkurs-Modus, Speicher, Pass, Lösungssatz unter der
//     Buchstabenleiste, Exit-Ticket auf der Seite, Zurücksetzen mit Rückfrage;
//   * Schreibweisen hell und dunkel, Kontrast im Dunkelmodus, keine Überbreite auf dem Telefon,
//     keine Skriptfehler.

"use strict";

const { neuerBericht } = require("../lib/pruefen");
const { starteBrowser, neueSeite, oeffne } = require("../lib/seite");
const { pruefeNotation } = require("../lib/notation");
const { pruefeKontrast } = require("../lib/kontrast");
const { zahlen } = require("../lib/aufgaben");
const fs = require("fs");
const path = require("path");

const bericht = neuerBericht();
const { pruefe } = bericht;
const SEITE = "/mathematik/mss11/01-analysis/06-anwendungsaufgaben/index.html";
const WURZEL = path.resolve(__dirname, "..", "..");
const ORDNER = path.join(WURZEL, "mathematik/mss11/01-analysis/06-anwendungsaufgaben");
const nahe = (a, b, tol) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= tol;

// ---------- Numerik ----------

const abl = (f, x, h = 1e-5) => (f(x + h) - f(x - h)) / (2 * h);
function simpson(f, a, b, n = 6000) {
  const h = (b - a) / n;
  let s = f(a) + f(b);
  for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(a + i * h);
  return (s * h) / 3;
}
function bisektion(g, a, b) {
  let ga = g(a);
  if (Math.sign(ga) === Math.sign(g(b))) return NaN;
  for (let k = 0; k < 100; k++) {
    const m = (a + b) / 2, gm = g(m);
    if (Math.sign(gm) === Math.sign(ga)) { a = m; ga = gm; } else b = m;
  }
  return (a + b) / 2;
}
// Stelle des Maximums durch Abtasten, danach Feinsuche (Dreiteilung) um den besten Abtastpunkt.
function argmax(f, a, b, n = 20000) {
  let bx = a, bw = -Infinity;
  for (let i = 0; i <= n; i++) { const x = a + ((b - a) * i) / n, w = f(x); if (w > bw) { bw = w; bx = x; } }
  let lo = Math.max(a, bx - (b - a) / n), hi = Math.min(b, bx + (b - a) / n);
  for (let k = 0; k < 100; k++) {
    const m1 = lo + (hi - lo) / 3, m2 = hi - (hi - lo) / 3;
    if (f(m1) < f(m2)) lo = m1; else hi = m2;
  }
  return (lo + hi) / 2;
}
const argmin = (f, a, b, n) => argmax((x) => -f(x), a, b, n);
// Maß der Menge {t in [a; b] : bedingung(t)} durch Abtasten.
function mass(bed, a, b, n = 400000) {
  let z = 0;
  for (let i = 0; i < n; i++) if (bed(a + ((i + 0.5) * (b - a)) / n)) z++;
  return (z * (b - a)) / n;
}
function deutsch(x) {
  if (x === Infinity) return "unendlich";
  return String(Number(x.toFixed(6))).replace(".", ",").replace("-", "−");
}

// ---------- Unabhängige Sollwerte und Modelle ----------
// Jeder Wert entsteht hier auf einem anderen Weg als auf der Seite. Die Modelle sind aus dem
// Aufgabentext abgeschrieben; MODELLTEXT prüft, dass die Seite genau diese Modelle zeigt.

const SOLL = {};
const KN = {};         // Knobelfragen: Sollwerte (Zahl) oder ein Textstück der richtigen Auswahl
const FIG = {};        // Kurven je Fall und Rolle
const PUNKTE = {};     // Punkte je Fall und Rolle: x ↦ y
const LINIEN = {};     // waagerechte und senkrechte Linien je Fall und Rolle: Wert
const MODELLTEXT = {};

// 1.1 a — Depot Jahr für Jahr fortschreiben statt Summenformel.
{
  const depot = (p, bis) => {
    let k = 0;
    for (let alter = 7; alter <= 67; alter++) {
      k *= 1 + p;
      if (alter <= 18) k += 120;
      if (alter === bis) return k;
    }
    return k;
  };
  let e1 = 120;
  for (let j = 8; j <= 18; j++) e1 *= 1.06;
  const k6 = depot(0.06, 67), k5 = depot(0.05, 67);
  SOLL.fruehstart = { e1, s12: depot(0.06, 18), k6, k5, verlust: 100 * (1 - k5 / k6) };
  // k ist die Nummer der Einzahlung; aus dem SVG kommt sie nur auf Bildpunkte genau zurück.
  const wertMit67 = (p, k) => { let w = 120; for (let a = 6 + Math.round(k) + 1; a <= 67; a++) w *= 1 + p; return w; };
  PUNKTE.fruehstart = { p6: (k) => wertMit67(0.06, k), p5: (k) => wertMit67(0.05, k) };
  KN.fruehstart = { welche: "die erste Einzahlung", faktor: wertMit67(0.06, 1) / wertMit67(0.06, 12) };
  MODELLTEXT.fruehstart = ["einmal im Jahr 120 €", "vom 7. bis zum 18.", "p = 6 %", "nur um 5 %", "am 67. Geburtstag"];
}

// 1.1 b — Dosis für Dosis; Abbau über die Halbwertszeit 4 h.
{
  const q = Math.exp((-Math.LN2 * 2) / 4);
  let a = 0;
  const folge = [];
  for (let k = 0; k < 3000; k++) { a = a * q + 80; folge.push(a); }
  const n250 = folge.findIndex((x) => x > 250) + 1;
  SOLL.koffein = { q, a3: folge[2], grenz: folge[2999], n250 };
  KN.koffein = { zeit: bisektion((t) => 270 * Math.exp((-Math.LN2 * t) / 4) - 80, 0, 50) };
  FIG.koffein = {
    koffein: (t) => { let s = 0; for (let d = 0; d <= 14; d += 2) if (d <= t) s += 80 * Math.exp((-Math.LN2 * (t - d)) / 4); return s; },
  };
  LINIEN.koffein = { behauptung: 160 };
  MODELLTEXT.koffein = ["80 mg", "Halbwertszeit sei 4 Stunden"];
}

// 1.2 a — der Tarif nach § 32a EStG 2026, hier noch einmal aus dem Gesetzestext.
{
  const zone3 = (x) => { const z = (x - 17799) / 10000; return (173.1 * z + 2397) * z + 1034.87; };
  const zone4 = (x) => 0.42 * x - 11135.63;
  const zone5 = (x) => 0.45 * x - 19470.38;
  const zone2 = (x) => { const y = (x - 12348) / 10000; return (914.51 * y + 1400) * y; };
  const T = (x) => (x <= 12348 ? 0 : x < 17800 ? zone2(x) : x < 69879 ? zone3(x) : x < 277826 ? zone4(x) : zone5(x));
  SOLL.steuer = {
    t3: zone3(69878), t4: zone4(69879), sprung: zone4(69879) - zone3(69879),
    grenz: T(69881) - T(69880), limes: (100 * T(1e12)) / 1e12,
  };
  FIG.steuer = { tarif: T };
  KN.steuer = { einkommen: bisektion((x) => T(x) / x - 0.3, 69879, 277825) };
  LINIEN.steuer = { zone: [17799, 69878] };
  MODELLTEXT.steuer = ["(173,10 · z + 2.397) · z + 1.034,87", "0,42 · x − 11.135,63", "0,45 · x − 19.470,38", "17.800 ≤ x ≤ 69.878"];
}

// 1.2 b — Nullstelle der Differenz durch Bisektion.
{
  const s1 = (t) => 2.25 * t + 0.3 * t * (t - 2) * (t - 4);
  const s2 = (t) => Math.max(0, 9 - 3 * t);
  const d = (t) => s1(t) - (9 - 3 * t);
  let k = 0;
  while (60 / 2 ** k >= 1) k++;
  SOLL.wanderung = { d0: d(0), d3: d(3), d15: d(1.5), d175: d(1.75), k, min: 60 * bisektion(d, 1, 2) };
  FIG.wanderung = { samstag: s1, sonntag: s2 };
  KN.wanderung = { pause: "mindestens eine" };
  MODELLTEXT.wanderung = ["s1(t) = 2,25t + 0,3t · (t − 2) · (t − 4), 0 ≤ t ≤ 4", "s2(t) = 9 − 3t, 0 ≤ t ≤ 3"];
}

// 2.1 a — Geschwindigkeit durch numerisches Ableiten, Dauer über das Maß der Menge.
{
  const s = (t) => -0.001 * t ** 3 + 0.09 * t ** 2 + (80 / 3) * t;
  const v = (t) => abl(s, t) * 3.6;
  SOLL.abschnitt = { vm: ((s(90) - s(0)) / 90) * 3.6, v10: v(10), vmax: v(argmax(v, 0, 90)), dauer: mass((t) => v(t) > 100, 0, 90) };
  FIG.abschnitt = { weg: s, sekante: (t) => (s(90) / 90) * t };
  KN.abschnitt = { zeitpunkt: bisektion((t) => v(t) - SOLL.abschnitt.vm, 31, 89), graph: "parallel zur Sekante" };
  MODELLTEXT.abschnitt = ["2,4 km", "90 Sekunden", "s(t) = −0,001t³ + 0,09t² + 803t"];
}

// 2.1 b — Berührstelle und Sichtweite durch Bisektion.
{
  const f = (x) => -(x * x) / 10000;
  const auge = f(-150) + 1;
  const u = bisektion((w) => f(w) + abl(f, w) * (-150 - w) - auge, -149, 100);
  const sicht = (x) => f(u) + abl(f, u) * (x - u);
  const ziel = bisektion((x) => sicht(x) - f(x) - 1, u + 1, 500);
  SOLL.kuppe = { steig: abl(f, -150) * 100, u, weite: ziel + 150, noetig: 2 * (100 / 3.6) * 15 };
  FIG.kuppe = { strasse: f, sichtlinie: sicht };
  {
    const a = -120, h = f(a) + 1;
    const u2 = bisektion((w) => f(w) + abl(f, w) * (a - w) - h, a + 1, 100);
    const t2 = (x) => f(u2) + abl(f, u2) * (x - u2);
    KN.kuppe = { beruehr: u2, sichtweite: bisektion((x) => t2(x) - f(x) - 1, u2 + 1, 500) - a };
  }
  PUNKTE.kuppe = { auge: () => auge };
  MODELLTEXT.kuppe = ["f(x) = −x²10.000", "A(−150 | −1,25)", "15 Sekunden"];
}

// 2.2 a — k durch Bisektion, Raten numerisch.
{
  const k = bisektion((w) => 100 - 90 * Math.exp(-30 * w) - 80, 0.001, 1);
  const L = (t) => 100 - 90 * Math.exp(-k * t);
  const t99 = bisektion((t) => L(t) - 99, 0, 1000);
  SOLL.laden = { k, r0: abl(L, 0), r30: abl(L, 30), t99, rest: t99 - 30 };
  FIG.laden = { ladestand: L };
  KN.laden = { rate90: abl(L, bisektion((t) => L(t) - 90, 0, 1000)) };
  LINIEN.laden = { voll: 100 };
  PUNKTE.laden = { werbung: () => 80 };
  MODELLTEXT.laden = ["L(t) = 100 − 90 · e−kt", "L(30) = 80"];
}

// 2.2 b — Ableitung numerisch, in Minuten pro Tag.
{
  const D = (t) => 12.2 + 4.1 * Math.sin(((2 * Math.PI) / 365) * (t - 80));
  SOLL.tageslaenge = { d80: D(80), d172: D(172), mittel: ((16.3 - 8.1) * 60) / 182.5, r80: abl(D, 80) * 60, r172: abl(D, 172) * 60 };
  FIG.tageslaenge = { tageslaenge: D };
  KN.tageslaenge = { von: bisektion((t) => abl(D, t) * 60 - 3, 0, 80), bis: bisektion((t) => abl(D, t) * 60 - 3, 80, 172) };
  LINIEN.tageslaenge = { fruehling: 80, sommer: 172 };
  MODELLTEXT.tageslaenge = ["D(t) = 12,2 + 4,1 · sin(2π365 · (t − 80))"];
}

// 3.1 a — Extrema durch Abtasten, Dauer über das Maß.
{
  const P = (t) => 0.025 * t ** 3 - 0.45 * t ** 2 - 2.1 * t + 57;
  const tt = argmin(P, 0, 20), tw = argmin((t) => abl(P, t), 0, 20);
  SOLL.kaub = { tt, pt: P(tt), tw, rw: abl(P, tw), pmax: P(argmax(P, 0, 20)), dauer: mass((t) => P(t) < 25, 0, 20) };
  FIG.kaub = { pegel: P };
  KN.kaub = { wieder: bisektion((t) => P(t) - 57, 1, 60) };
  LINIEN.kaub = { glw: 77, rekord: 25 };
  MODELLTEXT.kaub = ["P(t) = 0,025t³ − 0,45t² − 2,1t + 57", "0 ≤ t ≤ 20"];
}

// 3.1 b — Maximum durch Abtasten auf dem Definitionsbereich.
{
  const V = (x) => x * x * (300 - 4 * x);
  const xmax = bisektion((x) => 300 - 4 * x - x, 1, 100);
  const xopt = argmax(V, 0, xmax);
  SOLL.paket = { xmax, xopt, vopt: V(xopt) / 1000, mehr: (V(xopt) - V(xmax)) / 1000 };
  FIG.paket = { volumen: (x) => V(x) / 1000 };
  {
    // Hermes: längste + kürzeste Seite höchstens 80 cm; die mittlere Seite darf so lang sein wie die längste.
    const W = (a) => a * a * (80 - a);
    const a = argmax(W, 40, 80);
    KN.paket = { laengste: a, liter: W(a) / 1000 };
  }
  LINIEN.paket = { wuerfel: 60 };
  MODELLTEXT.paket = ["Breite = Höhe = x", "L + 2x + 2x = 300"];
}

// 3.2 a — Wirkdauern als Maß der Menge über der Schwelle.
{
  const c = (t) => 8 * t * Math.exp(-0.5 * t);
  const tm = argmax(c, 0, 12);
  SOLL.dosis = { tmax: tm, cmax: c(tm), d1: mass((t) => c(t) >= 4, 0, 40), d2: mass((t) => 2 * c(t) >= 4, 0, 40), cmax2: 2 * c(argmax((t) => 2 * c(t), 0, 12)) };
  FIG.dosis = { eine: c, zwei: (t) => 2 * c(t) };
  {
    const ts = argmin((t) => abl(c, t), 0, 12);
    KN.dosis = { abbau: ts, rate: abl(c, ts) };
  }
  LINIEN.dosis = { schwelle: 4 };
  MODELLTEXT.dosis = ["c(t) = 8t · e−0,5t", "c(t) ≥ 4"];
}

// 3.2 b — Periode aus zwei Nullstellen, Hochpunkte durch Abtasten.
{
  const y = (t) => 12 * Math.exp(-0.2 * t) * Math.sin(2 * t);
  const h = (t) => 12 * Math.exp(-0.2 * t);
  const z1 = bisektion(y, 1, 2), z2 = bisektion(y, 2.5, 3.5);
  const tH = argmax(y, 0, 1.5), tH2 = argmax(y, 3, 4.5);
  SOLL.geierlay = { T: 2 * (z2 - z1), tH, yH: y(tH), t2: bisektion((t) => h(t) - 2, 0, 30), q: y(tH2) / y(tH) };
  FIG.geierlay = { schwingung: y, huelle: h, "huelle-unten": (t) => -h(t) };
  {
    // Hochpunkte der Reihe nach abtasten: lokale Maxima mit positivem Wert.
    const hoch = [];
    const dt = 1e-4;
    for (let t = dt; t < 30; t += dt) if (y(t) > 0 && y(t) > y(t - dt) && y(t) >= y(t + dt)) hoch.push(t);
    const k = hoch.findIndex((t) => y(t) < 1);
    KN.geierlay = { nummer: k + 1, wann: hoch[k] };
  }
  MODELLTEXT.geierlay = ["y(t) = 12 · e−0,2t · sin(2t)"];
}

// 4.1 a — Energie durch Simpson, an den numerisch gefundenen Nullstellen geteilt.
{
  const P = (t) => Math.max(0, 600 - 15 * (t - 13) ** 2);
  const t1 = bisektion((t) => 600 - 15 * (t - 13) ** 2, 4, 13), t2 = bisektion((t) => 600 - 15 * (t - 13) ** 2, 13, 22);
  const u1 = bisektion((t) => P(t) - 150, 4, 13), u2 = bisektion((t) => P(t) - 150, 13, 22);
  const E = simpson(P, t1, t2) / 1000, U = simpson((t) => P(t) - 150, u1, u2) / 1000;
  SOLL.balkon = { t1, E, dauer: mass((t) => P(t) >= 150, 4, 22), U, anteil: (100 * (E - U)) / 3.6 };
  FIG.balkon = { leistung: P };
  {
    const ueberschuss = (g) => { const a = 13 - Math.sqrt((600 - g) / 15), b = 13 + Math.sqrt((600 - g) / 15); return simpson((t) => P(t) - g, a, b, 2000); };
    KN.balkon = { grundlast: bisektion((g) => ueberschuss(g) - 1000, 150, 599) };
  }
  LINIEN.balkon = { grundlast: 150 };
  MODELLTEXT.balkon = ["P(t) = 600 − 15 · (t − 13)²", "150 W"];
}

// 4.1 b — Wege durch Simpson über die stückweise gegebene Geschwindigkeit.
{
  const vonV0 = (v0) => (t) => (t <= 0.5 ? v0 - 8 * t * t : Math.max(0, v0 - 2 - 8 * (t - 0.5)));
  const weg = (kmh, reaktion) => {
    const v0 = kmh / 3.6, v = vonV0(v0);
    const stopp = bisektion((t) => v0 - 2 - 8 * (t - 0.5), 0.5, 10);
    return { r: reaktion * v0, p1: simpson(v, 0, 0.5), stopp, p2: simpson(v, 0.5, stopp) };
  };
  const a = weg(50, 0.4), m = weg(30, 1.0);
  SOLL.notbremse = { r50: a.r, p1: a.p1, tst: a.stopp, p2: a.p2, g50: a.r + a.p1 + a.p2, g30: m.r + m.p1 + m.p2 };
  FIG.notbremse = { v50: vonV0(50 / 3.6), v30: vonV0(30 / 3.6) };
  {
    // Fahrt Schritt für Schritt: erst die Reaktionszeit, dann die Bremsung, bis 18 m erreicht sind.
    const v0 = 50 / 3.6, v = vonV0(v0), dt = 1e-6;
    let x = 0.4 * v0, t = 0;
    while (x < 18 && v(t) > 0) { x += ((v(t) + v(t + dt)) / 2) * dt; t += dt; }
    KN.notbremse = { aufprall: v(t) * 3.6 };
  }
  MODELLTEXT.notbremse = ["0,4 s", "1,0 s", "v(t) = v₀ − 8t²", "v(t) = v₀ − 2 − 8 · (t − 0,5)"];
}

// 4.2 a — Bestand über das kumulierte Integral auf einem feinen Gitter.
{
  const z = (t) => 1200 * Math.exp(-0.4 * t);
  let V = 2000, best = V;
  const dt = 1e-4;
  for (let t = 0; t < 12; t += dt) { V += ((z(t) + z(t + dt)) / 2 - 300) * dt; best = Math.max(best, V); }
  SOLL.becken = { z2: simpson(z, 0, 2), zges: simpson(z, 0, 200, 40000), tg: bisektion((t) => z(t) - 300, 0, 12), vmax: best, res: 3500 - best };
  KN.becken = { rest: V };
  FIG.becken = { zufluss: z };
  LINIEN.becken = { abfluss: 300 };
  MODELLTEXT.becken = ["z(t) = 1.200 · e−0,4t", "300 m³/h", "V(0) = 2.000 m³", "3.500 m³"];
}

// 4.2 b — Anstiege als Simpson-Integrale der Rate.
{
  const r = (t) => (Math.PI / 4) * Math.sin((Math.PI * t) / 6);
  const st = (k) => simpson(r, k - 1, k);
  SOLL.zwoelfter = { hub: simpson(r, 0, 6), s1: st(1), s2: st(2), s3: st(3), z1: st(1) / 0.25, z3: st(3) / 0.25 };
  FIG.zwoelfter = { stand: (x) => simpson(r, 0, x, 400) };
  KN.zwoelfter = { cmMin: (r(argmax(r, 0, 6)) * 100) / 60 };
  PUNKTE.zwoelfter = { regel: (k) => ([0, 1, 3, 6, 9, 11, 12][Math.round(k)] * 3) / 12 };
  MODELLTEXT.zwoelfter = ["r(t) = π4 · sin(π6 · t), 0 ≤ t ≤ 6", "Tidenhub 3 m"];
}

// K1 — Spitzentag durch Abtasten, Gesamtzahl durch Simpson bis weit hinaus.
{
  const s = (t) => 2 * t * Math.exp(-0.25 * t);
  const tS = argmax(s, 0, 40);
  const ges = simpson(s, 0, 400, 40000);
  SOLL.song = { tS, sS: s(tS), q: s(2001) / s(2000), s30: simpson(s, 0, 30), ges, geld: ges * 1e6 * 0.003 };
  FIG.song = { streams: s };
  {
    // Die Reihe Σ 2k · q^k mit q = e^(−0,25) in geschlossener Form: 2q/(1 − q)².
    const q = Math.exp(-0.25);
    KN.song = { summe: (2 * q) / (1 - q) ** 2, vergleich: "kleiner als 32" };
  }
  MODELLTEXT.song = ["s(t) = 2t · e−0,25t", "0,3 Cent"];
}

// K2 — die vier Bedingungen nachprüfen, steilste Stelle durch Abtasten, Länge durch Bisektion.
{
  const f = (L) => (x) => 6 * (3 * (x / L) ** 2 - 2 * (x / L) ** 3);
  const steilste = (L) => abl(f(L), argmax((x) => abl(f(L), x), 0, L));
  for (const L of [100, 150]) {
    pruefe(nahe(f(L)(0), 0, 1e-12) && nahe(abl(f(L), 1e-6), 0, 1e-6) && nahe(f(L)(L), 6, 1e-9) && nahe(abl(f(L), L), 0, 1e-6), `Rampe L = ${L}: Die vier Bedingungen sind nicht erfüllt`);
  }
  for (const x of [10, 37, 80]) pruefe(nahe(f(100)(x), -0.000012 * x ** 3 + 0.0018 * x ** 2, 1e-9), `Rampe: f(x) = −0,000012x³ + 0,0018x² stimmt bei x = ${x} nicht mit der allgemeinen Form überein`);
  const L = bisektion((w) => steilste(w) - 0.06, 50, 1000);
  SOLL.radweg = { f25: f(100)(25), smax: 100 * steilste(100), winkel: (Math.atan(steilste(100)) * 180) / Math.PI, L, A: simpson(f(150), 0, 150) };
  KN.radweg = { x1: bisektion((x) => abl(f(150), x) - 0.03, 1, 75), x2: bisektion((x) => abl(f(150), x) - 0.03, 75, 149) };
  FIG.radweg = { l100: (x) => (x <= 100 ? f(100)(x) : 6), l150: f(150), gerade: (x) => 0.06 * x };
  MODELLTEXT.radweg = ["f(0) = 0 und f′(0) = 0", "f(L) = 6 und f′(L) = 0", "f(x) = −0,000012x³ + 0,0018x²"];
}

// K3 — Ladeenergie durch Simpson, Optimum durch Abtasten.
{
  const P = (t) => 100 * Math.exp(-0.04 * t);
  const eS = simpson(P, 0, 30) / 60, pM = eS / 0.5;
  const T = (v) => 600 / v + (6 * (8 + 0.00085 * v * v) - 50) / pM;
  SOLL.eauto = { eS, pM, t130: T(130) * 60, t180: T(180) * 60, vopt: argmin(T, 60, 300) };
  {
    // Ganze Stopps: so viele, bis die nachgeladene Energie reicht.
    const stopps = (v) => { let n = 0; while (50 + n * eS < 6 * (8 + 0.00085 * v * v)) n++; return n; };
    KN.eauto = { stopps130: stopps(130), stopps180: stopps(180) };
  }
  pruefe(T(0.01) > 1000 && T(1e5) > 1000, "E-Auto: T(v) wächst nicht an beiden Rändern über alle Grenzen");
  SOLL.eauto.rand = "für v → 0 und für v → ∞";   // Text der richtigen Auswahl
  FIG.eauto = { gesamtzeit: T };
  LINIEN.eauto = { v130: 130, v180: 180 };
  MODELLTEXT.eauto = ["600 km", "c(v) = 8 + 0,00085 · v²", "50 kWh", "30 Minuten", "P(t) = 100 · e−0,04t"];
}

// K4 — Ableitung numerisch, Abnahmezeit über das Maß, Jahresmittel durch Simpson.
{
  const Tr = (t) => 315.6 + 0.84 * t + 0.0125 * t * t;
  const C = (t) => Tr(t) + 3 * Math.sin(2 * Math.PI * (t - 0.08));
  const mittel = (n) => simpson(C, n, n + 1);
  SOLL.keeling = {
    tr: abl(Tr, 66.5), cmin: abl(C, argmin((t) => abl(C, t), 66, 67)),
    monate: 12 * mass((t) => abl(C, t) < 0, 66, 67), mittel: mittel(66),
    d2: mittel(62) - 2 * mittel(61) + mittel(60),
  };
  FIG.keeling = { co2: C, trend: Tr };
  {
    let n = 60;
    while (mittel(n) <= 450) n++;
    KN.keeling = { jahr: 1959 + n };
  }
  MODELLTEXT.keeling = ["C(t) = 315,6 + 0,84t + 0,0125t² + 3 · sin(2π · (t − 0,08))", "t = 66 ist Anfang 2025"];
}

// Erwartete Zuordnung zu Kapiteln und Kursen.
const KAPITEL = ["1.1", "1.1", "1.2", "1.2", "2.1", "2.1", "2.2", "2.2", "3.1", "3.1", "3.2", "3.2", "4.1", "4.1", "4.2", "4.2", "K", "K", "K", "K"];
const LK_FAELLE = new Set(["tageslaenge", "geierlay", "zwoelfter", "keeling"]);
const LOESUNGSSATZ = "ERST DENKEN, DANN TEILEN";
const WORT = LOESUNGSSATZ.replace(/[^A-Z]/g, "");

// Leistungskurs-Abschnitte der Themen 2.2, 3.2 und 4.2 — aus den Seiten selbst gelesen.
function lkAbschnitte() {
  const aus = new Set();
  for (const ordner of ["03b-weitere-funktionen-ableiten", "04b-weitere-funktionen-untersuchen", "05b-weitere-funktionen-integrieren"]) {
    const html = fs.readFileSync(path.join(WURZEL, "mathematik/mss11/01-analysis", ordner, "index.html"), "utf-8");
    for (const m of html.matchAll(/<section class="card" id="([^"]+)">\s*<h2>([\s\S]*?)<\/h2>/g)) {
      if (/kurs-marke lk/.test(m[2])) aus.add(`${ordner}/index.html#${m[1]}`);
    }
  }
  return aus;
}

// ---------- Seitenhelfer ----------

async function faelleLesen(page) {
  return page.evaluate(async () => {
    const m = await import("./faelle.js?v=2");
    return m.FAELLE.map((f) => ({
      key: f.key, nr: f.nr, kapitel: f.kapitel, kurs: f.kurs, behauptung: f.behauptung,
      quellen: f.quellen || [], kompetenzen: f.kompetenzen, buchstabe: f.buchstabe, position: f.position,
      knobel: (f.knobelFelder || []).map((x) => ({
        id: x.id, typ: x.typ || "zahl", soll: x.soll, tol: x.tol,
        optionen: (x.optionen || []).map((o) => ({ wert: o.wert, text: o.text })),
        falsch: (x.falsch || []).map((y) => ({ wert: y.wert, id: y.id, tol: y.tol })),
      })),
      schritte: f.schritte.map((s) => ({
        kern: !!s.kern, phase: s.phase, tipps: s.tipps.length,
        felder: s.felder.map((x) => ({
          id: x.id, typ: x.typ || "zahl", soll: x.soll, tol: x.tol, einheit: x.einheit,
          optionen: (x.optionen || []).map((o) => ({ wert: o.wert, text: o.text })),
          falsch: (x.falsch || []).map((y) => ({ wert: y.wert === Infinity ? "∞" : y.wert, id: y.id, tol: y.tol })),
        })),
      })),
    }));
  });
}

async function setze(page, key, feld, wert) {
  const sel = `[data-feld="${key}.${feld.id}"]`;
  if (feld.typ === "wahl") await page.selectOption(sel, String(wert));
  else await page.fill(sel, wert === "∞" ? "unendlich" : typeof wert === "number" ? deutsch(wert) : String(wert));
}
async function hinweis(page, key, id) {
  return page.evaluate((s) => { const e = document.querySelector(s); return e ? e.dataset.hinweis || "" : "(fehlt)"; }, `[data-rueck="${key}.${id}"]`);
}
// Die Rückmeldung als Text: Rohes HTML darf darin nicht zu sehen sein (die Hinweise enthalten
// Hochzahlen und werden deshalb als HTML gesetzt).
async function rueckText(page, sel) {
  return page.evaluate((s) => { const e = document.querySelector(s); return e ? e.textContent : ""; }, sel);
}
async function setzeKnobel(page, key, feld, wert) {
  const sel = `[data-knobel="${key}.${feld.id}"]`;
  if (feld.typ === "wahl") await page.selectOption(sel, String(wert));
  else await page.fill(sel, typeof wert === "number" ? deutsch(wert) : String(wert));
}
async function knobelHinweis(page, key, id) {
  return page.evaluate((s) => { const e = document.querySelector(s); return e ? e.dataset.hinweis || "" : "(fehlt)"; }, `[data-knobel-rueck="${key}.${id}"]`);
}
async function pruefeSchritt(page, i) {
  await page.click(`[data-pruefe="${i}"]`);
}
async function oeffneFall(page, i, stufe) {
  await page.click(`[data-fall="${i}"]`);
  if (stufe) await page.click(`[data-stufe="${stufe}"]`);
}

// Zeichnung zurücklesen: Maßstab aus den Gitterlinien, dann jede Kurve, jeden Punkt und jede Linie.
async function liesFigur(page, key) {
  return page.evaluate((k) => {
    const svg = document.getElementById("fc-svg-" + k);
    if (!svg) return null;
    const linien = (a) => [...svg.querySelectorAll(`line[data-achse="${a}"]`)].map((l) => ({ w: Number(l.dataset.wert), p: Number(l.getAttribute(a === "x" ? "x1" : "y1")) }));
    const skala = (L) => { const a = L[0], b = L[L.length - 1]; const st = (b.p - a.p) / (b.w - a.w); return { wert: (p) => a.w + (p - a.p) / st, pro: Math.abs(st) }; };
    const SX = skala(linien("x")), SY = skala(linien("y"));
    const paare = (d) => (d.match(/-?[\d.]+ -?[\d.]+/g) || []).map((t) => t.split(" ").map(Number));
    return {
      proX: SX.pro, proY: SY.pro,
      kurven: [...svg.querySelectorAll("path[data-rolle]")].map((p) => ({ rolle: p.dataset.rolle, punkte: paare(p.getAttribute("d")).map(([a, b]) => [SX.wert(a), SY.wert(b)]) })),
      punkte: [...svg.querySelectorAll("circle[data-rolle]")].map((c) => ({ rolle: c.dataset.rolle, x: SX.wert(Number(c.getAttribute("cx"))), y: SY.wert(Number(c.getAttribute("cy"))) })),
      linien: [...svg.querySelectorAll("line[data-rolle]")].map((l) => ({
        rolle: l.dataset.rolle, wert: Number(l.dataset.wert),
        waagrecht: l.getAttribute("y1") === l.getAttribute("y2"),
        lage: l.getAttribute("y1") === l.getAttribute("y2") ? SY.wert(Number(l.getAttribute("y1"))) : SX.wert(Number(l.getAttribute("x1"))),
      })),
      hinweis: (svg.closest("figure").querySelector(".fc-figur-hinweis") || {}).textContent || "",
    };
  }, key);
}

function pruefeFigur(key, d) {
  pruefe(d, `${key}: Zeichnung fehlt`);
  if (!d) return;
  const tolY = 1.5 / d.proY, dx = 0.03 / d.proX;
  for (const [rolle, f] of Object.entries(FIG[key] || {})) {
    const k = d.kurven.find((c) => c.rolle === rolle);
    pruefe(k && k.punkte.length > 20, `${key}: Kurve „${rolle}“ fehlt`);
    if (!k) continue;
    let schlecht = 0, bsp = "";
    for (const [x, y] of k.punkte) {
      // An Sprungstellen (Dosen, Knicke) entscheidet die Rundung der x-Koordinate, auf welcher Seite
      // der Punkt liegt — deshalb auch die Nachbarn ein Dreißigstel Bildpunkt daneben.
      const ok = [x - dx, x, x + dx].some((t) => Math.abs(f(t) - y) <= tolY);
      if (!ok) { schlecht++; if (!bsp) bsp = `(${x.toFixed(3)} | ${y.toFixed(3)}) statt ${f(x).toFixed(3)}`; }
    }
    pruefe(schlecht === 0, `${key}: ${schlecht} Punkte der Kurve „${rolle}“ liegen nicht auf dem Modell, z. B. ${bsp}`);
  }
  for (const c of d.kurven) pruefe(FIG[key] && FIG[key][c.rolle], `${key}: Kurve „${c.rolle}“ wird nicht geprüft`);
  for (const [rolle, f] of Object.entries(PUNKTE[key] || {})) {
    const pp = d.punkte.filter((p) => p.rolle === rolle);
    pruefe(pp.length > 0, `${key}: Punkte „${rolle}“ fehlen`);
    for (const p of pp) pruefe(Math.abs(f(p.x) - p.y) <= tolY, `${key}: Punkt „${rolle}“ (${p.x.toFixed(2)} | ${p.y.toFixed(2)}) liegt nicht bei ${f(p.x).toFixed(2)}`);
  }
  for (const p of d.punkte) pruefe(PUNKTE[key] && PUNKTE[key][p.rolle], `${key}: Punkt „${p.rolle}“ wird nicht geprüft`);
  for (const [rolle, w] of Object.entries(LINIEN[key] || {})) {
    const soll = [].concat(w);
    const ist = d.linien.filter((l) => l.rolle === rolle);
    pruefe(ist.length === soll.length, `${key}: ${ist.length} statt ${soll.length} Linien „${rolle}“`);
    for (const l of ist) {
      pruefe(soll.some((s) => nahe(l.wert, s, 1e-9)), `${key}: Linie „${rolle}“ trägt ${l.wert}`);
      pruefe(nahe(l.lage, l.wert, 0.02 / (l.waagrecht ? d.proY : d.proX) * 100), `${key}: Linie „${rolle}“ liegt bei ${l.lage} statt ${l.wert}`);
    }
  }
  for (const l of d.linien) pruefe(LINIEN[key] && LINIEN[key][l.rolle] !== undefined, `${key}: Linie „${l.rolle}“ wird nicht geprüft`);
  // „etwa n-fach überhöht“ muss zum wirklichen Maßstab passen.
  const m = d.hinweis.match(/etwa (\d+)-fach überhöht/);
  if (m) pruefe(Math.abs(Number(m[1]) - d.proY / d.proX) < 1, `${key}: „${m[1]}-fach überhöht“, gezeichnet ist ${(d.proY / d.proX).toFixed(1)}-fach`);
}

// ---------- Ablauf ----------

(async () => {
  const browser = await starteBrowser();
  const page = await neueSeite(browser);
  await oeffne(page, SEITE);
  await page.evaluate(() => { try { localStorage.removeItem("uplant-mss11-faktencheck"); } catch (e) { /* egal */ } });
  await oeffne(page, SEITE);
  for (const s of page.stoerungen) pruefe(false, s);

  // ---- Gerüst ----
  const html = fs.readFileSync(path.join(ORDNER, "index.html"), "utf-8");
  pruefe(/<nav class="breadcrumb">[\s\S]*5 Anwendungsaufgaben: Faktencheck\s*<\/nav>/.test(html), "Brotkrumen enden nicht beim eigenen Titel");
  pruefe(/haftungsausschluss\.html/.test(html), "Haftungsausschluss fehlt");
  for (const id of ["sec-faelle", "sec-vernetzung", "sec-formelsammlung"]) pruefe(html.includes(`id="${id}"`), `Abschnitt ${id} fehlt`);
  pruefe(/assets\/theme\.js/.test(html.split("site.css")[0]), "theme.js muss vor dem Stylesheet stehen");
  pruefe(/<script type="module" src="faktencheck\.js\?v=\d+"><\/script>/.test(html), "Modul ohne Versionsnummer eingebunden");
  const menue = fs.readFileSync(path.join(WURZEL, "mathematik/mss11/01-analysis/index.html"), "utf-8");
  const karte = menue.match(/<a class="menu-card"[^>]*href="06-anwendungsaufgaben\/index.html"[^>]*>[\s\S]*?<\/a>/);
  pruefe(karte, "Menü: Karte für Kapitel 5 fehlt");
  if (karte) {
    pruefe(/data-section="mss11"/.test(karte[0]) && /\shidden/.test(karte[0]), "Menü: Karte braucht data-section und hidden");
    pruefe(/kurs-marke gk">GK \+ LK/.test(karte[0]), "Menü: Karte ohne Kurs-Marke GK + LK");
  }

  const FAELLE = await faelleLesen(page);
  pruefe(FAELLE.length === 20, `${FAELLE.length} Fälle statt 20`);
  pruefe(FAELLE.map((f) => f.kapitel).join() === KAPITEL.join(), `Kapitelzuordnung: ${FAELLE.map((f) => f.kapitel).join()}`);
  pruefe(FAELLE.map((f) => f.buchstabe).join("") === WORT, "Buchstaben ergeben nicht den Lösungssatz");
  for (const f of FAELLE) {
    pruefe((f.kurs === "lk") === LK_FAELLE.has(f.key), `${f.key}: Kurs ${f.kurs}`);
    pruefe(SOLL[f.key], `${f.key}: keine unabhängigen Sollwerte in der Prüfung`);
    pruefe(/^„[^„“]+“$/.test(f.behauptung), `${f.key}: Behauptung steht nicht in „…“`);
    for (const q of f.quellen) pruefe(/^https:\/\//.test(q.url), `${f.key}: Quelle ohne https: ${q.url}`);
    pruefe(f.schritte.some((s) => s.kern), `${f.key}: kein Beleg (Kernschritt)`);
    pruefe(f.schritte.some((s) => s.phase === 4), `${f.key}: kein Schritt „Ergebnis erklären“`);
    pruefe(f.schritte.every((s) => s.tipps > 0), `${f.key}: ein Schritt ohne Tipp`);
    if (f.kapitel === "K") pruefe(new Set(f.kompetenzen).size >= 3, `${f.key}: verbindet nur ${f.kompetenzen.join(", ")}`);
    pruefe(f.knobel.length > 0, `${f.key}: Knobelfrage ohne Eingabefeld`);
    const ids = [...f.schritte.flatMap((s) => s.felder), ...f.knobel].map((x) => x.id);
    pruefe(new Set(ids).size === ids.length, `${f.key}: Feldnamen doppelt (${ids.join(", ")})`);
    for (const x of f.knobel) pruefe(KN[f.key] && KN[f.key][x.id] !== undefined, `${f.key}: Knobelfeld ${x.id} ohne unabhängigen Sollwert`);
    for (const x of [...f.schritte.flatMap((s) => s.felder), ...f.knobel]) {
      const knobel = f.knobel.includes(x);
      if (!knobel) pruefe(SOLL[f.key] && SOLL[f.key][x.id] !== undefined, `${f.key}.${x.id}: kein unabhängiger Sollwert`);
      if (x.typ !== "zahl") continue;
      // Fehlerwerte paarweise verschieden und keiner trifft den Sollwert (CLAUDE.md § 5).
      const werte = x.falsch.filter((y) => y.wert !== "∞");
      for (const y of werte) pruefe(Math.abs(y.wert - x.soll) > x.tol + (y.tol ?? x.tol), `${f.key}.${x.id}: Fehlerwert ${y.id} fällt mit dem Sollwert zusammen`);
      for (let a = 0; a < werte.length; a++) for (let b = a + 1; b < werte.length; b++) {
        pruefe(Math.abs(werte[a].wert - werte[b].wert) > 2 * x.tol, `${f.key}.${x.id}: Fehlerwerte ${werte[a].id} und ${werte[b].id} fallen zusammen`);
      }
      pruefe(x.tol > 0 && x.tol <= Math.max(0.02 * Math.abs(x.soll), 0.01), `${f.key}.${x.id}: Toleranz ${x.tol} zu groß für ${x.soll}`);
    }
  }

  // ---- Kein Leistungskursstoff in Grundkursfällen ----
  const lk = lkAbschnitte();
  pruefe(lk.size >= 10, `nur ${lk.size} LK-Abschnitte gefunden`);
  const alleVerweise = new Set();

  // ---- Urteile: Lage der richtigen Antwort ----
  const lageRichtig = [];

  // ---- Jeder Fall von beiden Seiten ----
  for (let i = 0; i < FAELLE.length; i++) {
    const f = FAELLE[i];
    const S = SOLL[f.key] || {};
    await oeffneFall(page, i);
    // Stufe 3 ist der Start: nur die Kernschritte, Merksatz gesperrt, Knobelfrage sichtbar.
    const st3 = await page.evaluate(() => ({
      schritte: document.querySelectorAll("#fc-fall .fc-schritt").length,
      aktiv: (document.querySelector(".fc-stufen .fc-tab-aktiv") || {}).dataset.stufe,
      merksatz: document.querySelector(".fc-merksatz").textContent,
      knobel: !!document.querySelector(".fc-knobel"),
    }));
    pruefe(st3.aktiv === "3", `${f.key}: beginnt nicht auf Stufe 3`);
    pruefe(st3.schritte === f.schritte.filter((s) => s.kern).length, `${f.key}: Stufe 3 zeigt ${st3.schritte} Schritte`);
    pruefe(/erst, wenn der Fall gelöst ist/.test(st3.merksatz), `${f.key}: Merksatz auf Stufe 3 nicht gesperrt`);
    pruefe(st3.knobel, `${f.key}: Knobelfrage fehlt auf Stufe 3`);
    const htmlStufe3 = await page.evaluate(() => document.querySelector("#fc-fall").innerHTML);

    // Knobelfrage: Vergleich erst nach dem ersten Versuch, jeder Fehlerwert, dann der Sollwert.
    {
      const K = KN[f.key] || {};
      pruefe(await page.locator(".fc-knobel details").count() === 0, `${f.key}: Musterantwort der Knobelfrage schon vor dem ersten Versuch zu sehen`);
      for (const x of f.knobel) {
        for (const y of x.falsch) {
          await setzeKnobel(page, f.key, x, y.wert);
          await page.click("[data-knobel-pruefe]");
          const h = await knobelHinweis(page, f.key, x.id);
          pruefe(h === y.id, `${f.key}: Knobelfeld ${x.id}: Fehlerwert ${y.wert} löst „${h}“ statt „${y.id}“ aus`);
          const t = await rueckText(page, `[data-knobel-rueck="${f.key}.${x.id}"]`);
          pruefe(!/<\/?[a-z]/.test(t) && t.length > 20, `${f.key}: Knobelhinweis ${y.id} zeigt „${t}“`);
        }
        if (x.typ === "zahl") {
          pruefe(nahe(x.soll, K[x.id], x.tol), `${f.key}: Knobelfeld ${x.id}: Seite rechnet ${x.soll}, unabhängig ${K[x.id]}`);
          const daneben = K[x.id] + Math.max(0.02 * Math.abs(K[x.id]), 3 * x.tol);
          await setzeKnobel(page, f.key, x, daneben);
          await page.click("[data-knobel-pruefe]");
          pruefe(await knobelHinweis(page, f.key, x.id) !== "ok", `${f.key}: Knobelfeld ${x.id}: ${daneben} wird als richtig anerkannt`);
        }
      }
      for (const x of f.knobel) {
        const wert = x.typ === "wahl" ? (x.optionen.find((o) => o.text.includes(K[x.id])) || {}).wert : K[x.id];
        pruefe(wert !== undefined, `${f.key}: Knobelfeld ${x.id}: keine Option enthält „${K[x.id]}“`);
        if (wert !== undefined) await setzeKnobel(page, f.key, x, wert);
      }
      await page.click("[data-knobel-pruefe]");
      for (const x of f.knobel) {
        const h = await knobelHinweis(page, f.key, x.id);
        pruefe(h === "ok", `${f.key}: Knobelfeld ${x.id}: Sollwert ${K[x.id]} löst „${h}“ aus`);
      }
      const kn = await page.evaluate(() => ({
        fertig: document.querySelector(".fc-knobel").classList.contains("fc-fertig"),
        antwort: (document.querySelector(".fc-knobel .fc-musterantwort") || {}).textContent || "",
      }));
      pruefe(kn.fertig, `${f.key}: Knobelfrage nicht als gelöst markiert`);
      pruefe(kn.antwort.length > 60, `${f.key}: Knobelfrage ohne Musterantwort nach dem Versuch`);
      const z = zahlen(kn.antwort);
      for (const x of f.knobel) {
        if (x.typ !== "zahl") continue;
        pruefe(z.some((w) => Math.abs(w - K[x.id]) <= Math.max(x.tol, 0.006 * Math.abs(K[x.id]))), `${f.key}: Musterantwort der Knobelfrage nennt ${K[x.id]} nicht`);
      }
    }

    // Modellkritik: erst ein eigener Satz, dann die Musterantwort, dann die Selbsteinschätzung.
    {
      await page.evaluate(() => { document.querySelector(".fc-denkfrage").open = true; });
      await page.fill(`[data-denk="${f.key}"]`, "Weiß nicht genau.");
      await page.click("[data-denk-vergleich]");
      const kurz = await page.evaluate((k) => ({ h: document.querySelector(`[data-denk-rueck="${k}"]`).dataset.hinweis, v: document.querySelectorAll(".fc-vergleich").length }), f.key);
      pruefe(kurz.h === "kurz" && kurz.v === 0, `${f.key}: Musterantwort der Modellkritik ohne eigenen Satz zu sehen`);
      await page.fill(`[data-denk="${f.key}"]`, "Das Modell vereinfacht die Wirklichkeit an einer entscheidenden Stelle.");
      await page.click("[data-denk-vergleich]");
      const lang = await page.evaluate((k) => ({
        offen: document.querySelector(`[data-denk-box="${k}"]`).open,
        text: (document.querySelector(".fc-vergleich") || {}).textContent || "",
        eigen: document.querySelector(`[data-denk="${k}"]`).value,
      }), f.key);
      pruefe(lang.offen && lang.text.length > 120, `${f.key}: Musterantwort der Modellkritik fehlt nach eigener Antwort`);
      pruefe(/entscheidenden Stelle/.test(lang.eigen), `${f.key}: eigene Antwort nach dem Vergleich verloren`);
      await page.click('[data-denk-urteil="teils"]');
      pruefe(await page.locator('[data-denk-rat="teils"]').count() === 1, `${f.key}: Selbsteinschätzung der Modellkritik ohne Rat`);
    }
    // Das gezeigte Modell ist das, mit dem hier gerechnet wird.
    const modell = await page.evaluate(() => document.querySelector(".fc-modell").textContent.replace(/\s+/g, " "));
    for (const t of MODELLTEXT[f.key] || []) pruefe(modell.includes(t), `${f.key}: Modelltext „${t}“ fehlt`);
    pruefeFigur(f.key, await liesFigur(page, f.key));

    await page.click('[data-stufe="2"]');
    pruefe(await page.locator("#fc-fall .fc-schritt").count() === f.schritte.length, `${f.key}: Stufe 2 zeigt nicht alle Schritte`);

    // Kurs: Grundkursfälle ohne Sinus, Kosinus, Kettenregel und ohne Verweis auf LK-Abschnitte.
    const text = htmlStufe3 + await page.evaluate(() => document.querySelector("#fc-fall").innerHTML);
    const verweise = [...text.matchAll(/href="\.\.\/([^"#]+)#([^"]+)"/g)].map((m) => `${m[1]}#${m[2]}`);
    for (const v of verweise) alleVerweise.add(v);
    if (f.kurs !== "lk") {
      const roh = text.replace(/<[^>]+>/g, " ");
      pruefe(!/\b(sin|cos)\s*\(|Kettenregel|arctan/.test(roh), `${f.key}: Grundkursfall benutzt Sinus, Kosinus oder die Kettenregel`);
      for (const v of verweise) pruefe(!lk.has(v), `${f.key}: Grundkursfall verweist auf den LK-Abschnitt ${v}`);
    }

    // Urteil: genau eine von vier Antworten richtig, jede mit Erklärung.
    const urteile = [];
    const nOpt = await page.locator("[data-urteil]").count();
    pruefe(nOpt === 4, `${f.key}: ${nOpt} Antworten statt 4`);
    for (let j = 0; j < nOpt; j++) {
      await page.click(`[data-urteil="${j}"]`);
      urteile.push(await page.evaluate(() => { const b = document.getElementById("fc-urteil-rueck"); return { art: b.dataset.urteil, text: b.textContent.trim() }; }));
    }
    const richtig = urteile.map((u, j) => (u.art === "richtig" ? j : -1)).filter((j) => j >= 0);
    pruefe(richtig.length === 1, `${f.key}: ${richtig.length} richtige Urteile`);
    for (const u of urteile) pruefe(u.text.length > 40, `${f.key}: Urteil ohne Erklärung („${u.text}“)`);
    lageRichtig.push(richtig[0]);
    await page.click(`[data-urteil="${richtig[0]}"]`);
    pruefe(/fehlt noch der rechnerische Beleg/.test(await page.locator("#fc-urteil-rueck").innerText()), `${f.key}: Urteil richtig, aber kein Hinweis auf den fehlenden Beleg`);

    // Jeder Schritt: erst jeder Fehlerwert, dann der unabhängige Sollwert.
    for (let si = 0; si < f.schritte.length; si++) {
      const s = f.schritte[si];
      for (const x of s.felder) {
        for (const y of x.falsch) {
          await setze(page, f.key, x, y.wert);
          await pruefeSchritt(page, si);
          const h = await hinweis(page, f.key, x.id);
          pruefe(h === y.id, `${f.key}.${x.id}: Fehlerwert ${y.wert} löst „${h}“ statt „${y.id}“ aus`);
          const t = await rueckText(page, `[data-rueck="${f.key}.${x.id}"]`);
          pruefe(!/<\/?[a-z]/.test(t), `${f.key}.${x.id}: Hinweis zeigt rohes HTML: „${t}“`);
        }
        if (x.typ === "zahl" && Number.isFinite(S[x.id])) {
          pruefe(nahe(x.soll, S[x.id], x.tol), `${f.key}.${x.id}: Seite rechnet ${x.soll}, unabhängig ${S[x.id]}`);
          // Ein Wert knapp außerhalb der Toleranz (um 2 % daneben) darf nicht anerkannt werden.
          const daneben = S[x.id] + Math.max(0.02 * Math.abs(S[x.id]), 3 * x.tol);
          await setze(page, f.key, x, daneben);
          await pruefeSchritt(page, si);
          pruefe(await hinweis(page, f.key, x.id) !== "ok", `${f.key}.${x.id}: ${daneben} wird als richtig anerkannt`);
        }
      }
      for (const x of s.felder) {
        const wert = x.typ === "wahl" ? (x.optionen.find((o) => o.text.includes(S[x.id])) || {}).wert : S[x.id];
        pruefe(wert !== undefined, `${f.key}.${x.id}: keine Option enthält „${S[x.id]}“`);
        await setze(page, f.key, x, wert);
      }
      await pruefeSchritt(page, si);
      for (const x of s.felder) {
        const h = await hinweis(page, f.key, x.id);
        pruefe(h === "ok", `${f.key}.${x.id}: Sollwert ${S[x.id]} löst „${h}“ aus`);
      }
      // Die Lösung des Schritts nennt jeden Sollwert.
      const loes = await page.evaluate((k) => { const e = document.querySelector(`[data-schritt="${k}"] .fc-loesung`); return e ? e.textContent : ""; }, si);
      pruefe(loes, `${f.key}: Schritt ${si + 1} zeigt nach dem Lösen kein Zwischenergebnis`);
      for (const x of s.felder) {
        if (x.typ !== "zahl") continue;
        const z = zahlen(loes);
        pruefe(z.some((w) => Math.abs(w - S[x.id]) <= Math.max(x.tol, 0.006 * Math.abs(S[x.id]))), `${f.key}.${x.id}: Lösung „${loes.slice(0, 90)}“ nennt ${S[x.id]} nicht`);
      }
    }

    // Gelöst: Buchstabe an seiner Stelle, Reiter mit Haken, Musterlösung offen.
    const nach = await page.evaluate(() => ({
      buchstabe: document.querySelector(".fc-buchstabe").textContent,
      reiter: document.querySelector(".fc-tab-aktiv[data-fall]").textContent,
      wort: [...document.querySelectorAll(".fc-wort-feld")].map((e) => e.textContent).join(""),
      muster: document.querySelector(".fc-musterloesung").textContent,
      status: document.querySelector("#fc-fall .fc-status").textContent,
    }));
    pruefe(nach.buchstabe.includes(`lautet ${f.buchstabe}`), `${f.key}: Buchstabe nicht freigeschaltet`);
    pruefe(nach.reiter.startsWith("✅"), `${f.key}: Reiter ohne Haken`);
    pruefe(nach.wort[i] === f.buchstabe, `${f.key}: Buchstabe fehlt in der Leiste`);
    pruefe(/Urteil:/.test(nach.muster) && nach.muster.length > 300, `${f.key}: Musterlösung fehlt`);
    pruefe(/gelöst!/.test(nach.status), `${f.key}: Status „${nach.status}“`);
    // Schreibweisen mit allem, was jetzt zu sehen ist (auch Musterantworten).
    await page.evaluate(() => document.querySelectorAll("#fc-fall details").forEach((d) => { d.open = true; }));
    await pruefeNotation(page, bericht, `${f.key} (hell)`);
  }

  // Die richtige Antwort steht nicht immer an derselben Stelle.
  for (let j = 0; j < 4; j++) {
    const n = lageRichtig.filter((x) => x === j).length;
    pruefe(n >= 3, `Urteile: nur ${n}-mal ist Antwort ${j + 1} richtig`);
  }

  // Alle Fälle gelöst: der Lösungssatz — eingetragen direkt unter der Buchstabenleiste.
  pruefe(await page.evaluate(() => {
    const leiste = document.getElementById("fc-wort"), satz = document.getElementById("fc-satz");
    return !!satz && leiste.nextElementSibling && leiste.nextElementSibling.contains(satz);
  }), "Das Feld für den Lösungssatz steht nicht direkt unter der Buchstabenleiste");
  await page.fill("#fc-satz", "ERST RECHNEN");
  await page.click("#fc-satz-pruefen");
  pruefe(/Noch nicht/.test(await page.locator("#fc-satz-rueck").innerText()), "falscher Lösungssatz wird anerkannt");
  await page.fill("#fc-satz", "Erst denken, dann teilen!");
  await page.click("#fc-satz-pruefen");
  pruefe(/Richtig/.test(await page.locator("#fc-satz-rueck").innerText()), "Lösungssatz wird nicht anerkannt");
  await page.click("[data-pass]");
  const pass = await page.locator("#fc-pass").innerText();
  pruefe((pass.match(/✅ gelöst/g) || []).length === 20, "Pass zeigt nicht alle Fälle als gelöst");
  pruefe((pass.match(/🧩 gelöst/g) || []).length === 20, "Pass zeigt nicht alle Knobelfragen als gelöst");
  pruefe((pass.match(/🌗 teilweise/g) || []).length === 20, "Pass zeigt die Selbsteinschätzung der Modellkritik nicht");
  pruefe(/🎉 Gelöst: „ERST DENKEN, DANN TEILEN“/.test(pass), "Pass vermerkt den Lösungssatz nicht");
  pruefe(!/im Heft/.test(pass), "Exit-Ticket verweist noch aufs Heft");
  // Exit-Ticket: drei Antworten auf der Seite, gespeichert.
  const EXIT = ["Die Steuer, weil der Sprung keiner war.", "Beim Becken war das Modell schwer.", "Werbung für Akkus prüfe ich jetzt."];
  pruefe(await page.locator("[data-exit]").count() === 3, "Exit-Ticket ohne drei Eingabefelder");
  for (let i = 0; i < 3; i++) await page.fill(`[data-exit="${i}"]`, EXIT[i]);
  pruefe(/3 von 3 Antworten/.test(await page.locator("#fc-exit-status").innerText()), "Exit-Ticket zählt die Antworten nicht");
  await pruefeNotation(page, bericht, "Pass (hell)");

  // Speicher: nach dem Neuladen ist alles noch gelöst, alle Texte sind noch da.
  await oeffne(page, SEITE);
  pruefe(await page.locator(".fc-wort-feld.fc-wort-frei").count() === 20, "Fortschritt nach dem Neuladen verloren");
  pruefe(/Richtig/.test(await page.locator("#fc-satz-rueck").innerText()), "gelöster Lösungssatz nach dem Neuladen verloren");
  await oeffneFall(page, 0);
  pruefe(/entscheidenden Stelle/.test(await page.inputValue(`[data-denk="${FAELLE[0].key}"]`)), "Modellkritik nach dem Neuladen verloren");
  pruefe(await page.locator(`[data-denk-box="${FAELLE[0].key}"][open] .fc-vergleich`).count() === 1, "Vergleich der Modellkritik nach dem Neuladen zu");
  await page.click("[data-pass]");
  for (let i = 0; i < 3; i++) pruefe(await page.inputValue(`[data-exit="${i}"]`) === EXIT[i], `Exit-Ticket ${i + 1} nach dem Neuladen verloren`);

  // Verweise und Sprungmarken (auch die der Landkarte und aller Fälle).
  const statisch = await page.evaluate(() => [...document.querySelectorAll("a[href]")].map((a) => a.getAttribute("href")));
  for (const v of statisch) if (/^\.\.\//.test(v) && !v.includes("#")) alleVerweise.add(v.replace(/^\.\.\//, ""));
  for (const v of statisch) if (/^\.\.\/.*#/.test(v)) alleVerweise.add(v.replace(/^\.\.\//, ""));
  for (const v of alleVerweise) {
    const [datei, anker] = v.split("#");
    const voll = path.join(WURZEL, "mathematik/mss11/01-analysis", datei);
    pruefe(fs.existsSync(voll), `Verweis ins Leere: ${v}`);
    if (anker && fs.existsSync(voll)) pruefe(fs.readFileSync(voll, "utf-8").includes(`id="${anker}"`), `Sprungmarke fehlt: ${v}`);
  }
  for (const v of statisch.filter((h) => h && !/^(https?:|#|\.\.\/)/.test(h))) {
    pruefe(fs.existsSync(path.join(ORDNER, v.split("#")[0])), `Verweis ins Leere: ${v}`);
  }

  // ---- Allgemeine Rückmeldungen und Zahlenerkennung ----
  await page.click("[data-pass]");
  await page.click("#fc-reset");
  pruefe(await page.locator("#fc-reset-ja").count() === 1, "Zurücksetzen ohne Rückfrage");
  await page.click("#fc-reset-nein");
  pruefe(await page.inputValue('[data-exit="0"]') === EXIT[0], "Abbrechen hat trotzdem zurückgesetzt");
  await page.click("#fc-reset");
  await page.click("#fc-reset-ja");
  pruefe(await page.inputValue('[data-exit="0"]') === "" && await page.inputValue("#fc-satz") === "", "Zurücksetzen löscht Exit-Ticket oder Lösungssatz nicht");
  pruefe(await page.locator(".fc-wort-feld.fc-wort-frei").count() === 0, "Zurücksetzen löscht den Fortschritt nicht");
  const idx = (k) => FAELLE.findIndex((f) => f.key === k);
  const feldIn = (k, id) => { const f = FAELLE[idx(k)]; for (let si = 0; si < f.schritte.length; si++) { const x = f.schritte[si].felder.find((y) => y.id === id); if (x) return [si, x]; } return [-1, null]; };
  async function eingabe(k, id, roh) {
    const [si, x] = feldIn(k, id);
    await oeffneFall(page, idx(k), 2);
    await page.fill(`[data-feld="${k}.${id}"]`, roh);
    await pruefeSchritt(page, si);
    return { h: await hinweis(page, k, id), x };
  }
  const allgemein = [
    ["abschnitt", "vm", "26,67", "einheit"], ["balkon", "E", "5059,6", "einheit"], ["kaub", "rw", "4,8", "vorzeichen"],
    ["kaub", "rw", "−4,65", "knapp"], ["kaub", "rw", "drei", "unlesbar"], ["kaub", "rw", "", "leer"],
    ["song", "ges", "unendlich", "unendlich"], ["song", "ges", "∞", "unendlich"], ["becken", "zges", "unendlich", "unendlich"],
    ["abschnitt", "vm", "96 km/h", "ok"], ["laden", "k", "0.0501", "ok"], ["becken", "zges", "3.000", "ok"],
    ["zwoelfter", "s3", "3/4", "ok"], ["fruehstart", "k6", "35.178,90", "ok"], ["fruehstart", "k6", "35 179", "ok"],
    ["dosis", "cmax", "5.886", "ok"],
  ];
  for (const [k, id, roh, soll] of allgemein) {
    const { h } = await eingabe(k, id, roh);
    pruefe(h === soll, `Eingabe „${roh}“ bei ${k}.${id}: „${h}“ statt „${soll}“`);
  }

  // ---- Aufdecken, Kernschritte, Musterlösung ----
  {
    const k = "fruehstart", i = idx(k);
    await oeffneFall(page, i, 2);
    pruefe(await page.locator('[data-aufdecken="0"]').count() === 0, "Aufdecken schon vor dem ersten Versuch möglich (Stufe 2)");
    for (let n = 0; n < 2; n++) { await page.fill(`[data-feld="${k}.e1"]`, "100"); await pruefeSchritt(page, 0); }
    pruefe(await page.locator('[data-aufdecken="0"]').count() === 1, "nach zwei Fehlversuchen kein Aufdecken");
    await page.click('[data-aufdecken="0"]');
    const wert = await page.inputValue(`[data-feld="${k}.e1"]`);
    pruefe(nahe(Number(wert.replace(".", "").replace(",", ".")), SOLL.fruehstart.e1, 0.01), `aufgedeckter Wert ${wert}`);
    pruefe(await page.locator('[data-schritt="0"] .fc-loesung').count() === 1, "aufgedeckter Schritt zeigt keine Lösung");
    const kern = FAELLE[i].schritte.findIndex((s) => s.kern);
    for (let n = 0; n < 3; n++) { await page.fill(`[data-feld="${k}.verlust"]`, "7"); await pruefeSchritt(page, kern); }
    pruefe(await page.locator(`[data-aufdecken="${kern}"]`).count() === 0, "Kernschritt lässt sich aufdecken");
    pruefe(await page.locator("[data-muster]").count() === 1, "nach drei Fehlversuchen am Beleg keine Musterlösung angeboten");
    await page.click("[data-muster]");
    pruefe(/mit Musterlösung/.test(await page.locator("#fc-fall .fc-status").innerText()), "Musterlösung nicht vermerkt");
    await page.click("[data-pass]");
    pruefe(/📖 mit Musterlösung/.test(await page.locator("#fc-pass").innerText()), "Pass vermerkt die Musterlösung nicht");
  }

  // ---- Stufe 1: erster Tipp offen, Werkzeugkasten offen, sofort aufdeckbar ----
  {
    const i = idx("kaub");
    await oeffneFall(page, i, 1);
    const s1 = await page.evaluate(() => ({
      tipps: [...document.querySelectorAll("#fc-fall .fc-schritt")].map((s) => s.querySelectorAll(".fc-tipps li").length),
      werkzeug: document.querySelector(".fc-werkzeug").open,
      auf: document.querySelectorAll("[data-aufdecken]").length,
      merksatz: document.querySelector(".fc-merksatz").textContent,
    }));
    pruefe(s1.tipps.every((n) => n === 1), `Stufe 1: Tipps je Schritt ${s1.tipps.join()}`);
    pruefe(s1.werkzeug, "Stufe 1: Werkzeugkasten zu");
    pruefe(s1.auf === FAELLE[i].schritte.filter((s) => !s.kern).length, `Stufe 1: ${s1.auf} Schritte aufdeckbar`);
    pruefe(!/erst, wenn/.test(s1.merksatz), "Stufe 1: Merksatz gesperrt");
    await page.click('[data-tipp="0"]');
    pruefe(await page.locator('[data-schritt="0"] .fc-tipps li').count() === 2, "Tipp-Knopf zeigt keinen weiteren Tipp");
  }

  // ---- Grundkurs: Buchstaben der LK-Fälle geschenkt ----
  {
    await page.click('[data-kurs="gk"]');
    const geschenkt = await page.evaluate(() => [...document.querySelectorAll(".fc-wort-feld")].map((e, i) => (e.classList.contains("fc-wort-geschenkt") ? i : -1)).filter((i) => i >= 0));
    const soll = FAELLE.map((f, i) => (f.kurs === "lk" ? i : -1)).filter((i) => i >= 0);
    pruefe(geschenkt.join() === soll.join(), `Grundkurs: geschenkt ${geschenkt.join()} statt ${soll.join()}`);
    await oeffne(page, SEITE);
    pruefe(await page.locator('[data-kurs="gk"].fc-tab-aktiv').count() === 1, "Kurswahl nach dem Neuladen verloren");
    await oeffneFall(page, idx("geierlay"));
    pruefe(/geschenkt/.test(await page.locator("#fc-fall .fc-buchstabe").innerText()), "LK-Fall im Grundkurs ohne geschenkten Buchstaben");
    await page.click('[data-kurs="lk"]');
  }

  // ---- Selbsteinschätzung bleibt gespeichert ----
  {
    await oeffneFall(page, 0);
    await page.click('[data-ampel="teils"]');
    await oeffne(page, SEITE);
    await oeffneFall(page, 0);
    pruefe(await page.locator('[data-ampel="teils"].fc-ampel-aktiv').count() === 1, "Selbsteinschätzung nach dem Neuladen verloren");
  }
  for (const s of page.stoerungen) pruefe(false, s);
  await page.close();

  // ---- Dunkelmodus: Kontrast und Schreibweisen in jedem Fall ----
  const dunkel = await neueSeite(browser, { dunkel: true });
  await oeffne(dunkel, SEITE);
  for (let i = 0; i < FAELLE.length; i++) {
    // Stufe 3 zeigt die Knobelfrage, Stufe 1 alle Schritte mit Tipps.
    for (const stufe of [3, 1]) {
      await oeffneFall(dunkel, i, stufe);
      await dunkel.evaluate(() => document.querySelectorAll("#fc-fall details").forEach((d) => { d.open = true; }));
      await pruefeKontrast(dunkel, bericht, `${FAELLE[i].key}, Stufe ${stufe} (dunkel)`);
      await pruefeNotation(dunkel, bericht, `${FAELLE[i].key}, Stufe ${stufe} (dunkel)`);
    }
  }
  await dunkel.click("[data-pass]");
  await pruefeKontrast(dunkel, bericht, "Pass (dunkel)");
  for (const s of dunkel.stoerungen) pruefe(false, s);
  await dunkel.close();

  // ---- Telefonbreite: kein Fall verbreitert die Seite (lange Auswahltexte, Tabellen, Formeln) ----
  const mobil = await neueSeite(browser);
  await mobil.setViewportSize({ width: 390, height: 844 });
  await oeffne(mobil, SEITE);
  for (let i = 0; i < FAELLE.length; i++) {
    for (const stufe of [3, 1]) {
      await oeffneFall(mobil, i, stufe);
      const breite = await mobil.evaluate(() => document.documentElement.scrollWidth);
      pruefe(breite <= 391, `${FAELLE[i].key}, Stufe ${stufe}: Seite auf dem Telefon ${breite} statt 390 px breit`);
    }
  }
  await mobil.click("[data-pass]");
  pruefe(await mobil.evaluate(() => document.documentElement.scrollWidth) <= 391, "Pass verbreitert die Seite auf dem Telefon");
  for (const s of mobil.stoerungen) pruefe(false, s);
  await mobil.close();

  await browser.close();
  bericht.abschluss();
})().catch((e) => { console.error(e); process.exit(1); });
