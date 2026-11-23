// Fachliche Prüfung: MSS 13, Wahrscheinlichkeitsrechnung, Thema 6 „Normalverteilung“.
//
// Jede Zahl und jede Zeichnung der Seite wird UNABHÄNGIG nachgerechnet:
//
//   * Die Binomialverteilung über eine Lanczos-Näherung der Gammafunktion (die Seite summiert
//     Logarithmen), Φ über die Simpsonregel an φ (die Seite benutzt eine Reihe), Φ rückwärts durch
//     Halbieren mit diesem Φ.
//   * Zeichnungen werden aus dem SVG zurückgelesen: Der Maßstab kommt aus zwei Gitterlinien
//     (data-wert, y) und zwei Achsenmarken (data-wert-x, x). Jede Säule muss dort stehen, so breit
//     und so hoch sein, wie es der Schritt des Standardisierens verlangt — an vielen Reglerstellungen,
//     auch mitten in jeder Bewegung. Kurven werden Punkt für Punkt mit φ, Φ und der Dichte
//     verglichen, Flächen über die Gaußsche Trapezformel ausgemessen.
//   * Die Bilanzen müssen die nachgerechneten Zahlen nennen; Regler, die begrenzt werden, müssen
//     den begrenzten Wert auch zeigen.
//   * Jede der sechzehn Aufgaben wird über viele Runden gewürfelt, nachgerechnet und mit jedem
//     vorgesehenen Fehlerwert geprüft.
//
// Teile einzeln: UPLANT_NUR=geruest,standardisieren,…

"use strict";

const { neuerBericht } = require("../lib/pruefen");
const { starteBrowser, neueSeite, oeffne, setzeRegler, text } = require("../lib/seite");
const { pruefeNotation } = require("../lib/notation");
const { pruefeKontrast, pruefeStrichKontrast } = require("../lib/kontrast");
const { pruefeAufgabe } = require("../lib/aufgaben");
const fs = require("fs");
const path = require("path");

const bericht = neuerBericht();
const { pruefe } = bericht;
const ORDNER = "/mathematik/mss13/01-wahrscheinlichkeitsrechnung/06-normalverteilung/";
const SEITE = ORDNER + "index.html";
const WURZEL = path.resolve(__dirname, "..", "..");
const NUR = (process.env.UPLANT_NUR || "").split(",").map((t) => t.trim()).filter(Boolean);
const will = (t) => NUR.length === 0 || NUR.includes(t);

// Deutsche Zahl, so wie die Seite sie schreibt; Zahl aus deutschem Text.
const de = (x, stellen = 4) => {
  const g = Number(x.toFixed(stellen));
  return (g === 0 ? 0 : g).toLocaleString("de-DE", { maximumFractionDigits: stellen }).replace("-", "−");
};
const zahl = (s) => Number(String(s).replace(/−/g, "-").replace(/\.(?=\d{3}\b)/g, "").replace(",", "."));
const nahe = (a, b, eps) => Math.abs(a - b) <= eps;

// ---------- eigene Mathematik (unabhängig von der Seite) ----------

// ln Γ nach Lanczos (g = 7, neun Koeffizienten) — ln(n!) = lnΓ(n + 1).
const LANCZOS = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059,
  12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
function lnGamma(x) {
  x -= 1;
  let a = LANCZOS[0];
  const t = x + 7.5;
  for (let i = 1; i < 9; i++) a += LANCZOS[i] / (x + i);
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}
function Bb(n, p, k) {
  if (k < 0 || k > n) return 0;
  return Math.exp(lnGamma(n + 1) - lnGamma(k + 1) - lnGamma(n - k + 1) + k * Math.log(p) + (n - k) * Math.log(1 - p));
}
function Fb(n, p, k) {
  let s = 0;
  for (let i = 0; i <= Math.min(k, n); i++) s += Bb(n, p, i);
  return k < 0 ? 0 : s;
}
const phi = (z) => Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI);
// Φ über die Simpsonregel von −10 bis z, 2000 Teilintervalle: Fehler unter 1e-12.
function Phi(z) {
  if (z === -Infinity || z < -10) return 0;
  if (z === Infinity || z > 10) return 1;
  const a = -10, N = 2000, h = (z - a) / N;
  let s = phi(a) + phi(z);
  for (let i = 1; i < N; i++) s += (i % 2 ? 4 : 2) * phi(a + i * h);
  return (s * h) / 3;
}
function PhiInv(g) {
  let a = -8, b = 8;
  for (let i = 0; i < 55; i++) { const m = (a + b) / 2; if (Phi(m) < g) a = m; else b = m; }
  return (a + b) / 2;
}

// ---------- Zeichnung aus dem SVG ----------

async function liesSvg(page, mount) {
  return page.evaluate((m) => {
    const svg = document.querySelector(`#${m} svg`);
    if (!svg) return null;
    const zahlen = (d) => (d.match(/-?\d+(\.\d+)?/g) || []).map(Number);
    return {
      gitter: [...svg.querySelectorAll(".bk-gitterlinie")].map((l) => ({ wert: Number(l.dataset.wert), y: Number(l.getAttribute("y1")) })),
      marken: [...svg.querySelectorAll(".nv-xmarke")].map((l) => ({ wert: Number(l.dataset.wertX), x: Number(l.getAttribute("x1")) })),
      rects: [...svg.querySelectorAll("rect")].map((r) => ({ klasse: r.getAttribute("class") || "", k: r.dataset.k, geist: r.dataset.geist, rolle: r.dataset.rolle,
        x: Number(r.getAttribute("x")), y: Number(r.getAttribute("y")), b: Number(r.getAttribute("width")), h: Number(r.getAttribute("height")) })),
      pfade: [...svg.querySelectorAll("path")].map((p) => ({ klasse: p.getAttribute("class") || "", rolle: p.dataset.rolle, z: zahlen(p.getAttribute("d")) })),
      punkte: [...svg.querySelectorAll("circle")].map((c) => ({ klasse: c.getAttribute("class") || "", rolle: c.dataset.rolle, x: Number(c.getAttribute("cx")), y: Number(c.getAttribute("cy")) })),
      linien: [...svg.querySelectorAll("line")].map((l) => ({ klasse: l.getAttribute("class") || "", rolle: l.dataset.rolle, x: Number(l.getAttribute("x1")), mu: l.dataset.mu })),
    };
  }, mount);
}
// Maßstab: x aus den Achsenmarken, y aus den Gitterlinien — beide aus je zwei Werten zurückgerechnet.
function welt(s) {
  const m = s.marken, g = s.gitter;
  const a = m[0], b = m[m.length - 1], c = g[0], d = g[g.length - 1];
  const sx = (b.x - a.x) / (b.wert - a.wert), sy = (c.y - d.y) / (d.wert - c.wert);
  return { sx, sy, X: (px) => a.wert + (px - a.x) / sx, Y: (py) => c.wert + (c.y - py) / sy };
}
// Säulen in Weltkoordinaten: links, rechts, Höhe.
function saeulen(s, w, filter) {
  return s.rects.filter(filter).map((r) => ({ ...r, x0: w.X(r.x), x1: w.X(r.x + r.b), hoehe: (r.h) / w.sy, oben: w.Y(r.y) }));
}
function pfadPunkte(p, w) {
  const out = [];
  for (let i = 0; i + 1 < p.z.length; i += 2) out.push([w.X(p.z[i]), w.Y(p.z[i + 1])]);
  return out;
}
function flaecheVieleck(pts) {
  let s = 0;
  for (let i = 0; i < pts.length; i++) { const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length]; s += x1 * y2 - x2 * y1; }
  return Math.abs(s) / 2;
}
async function rolle(page, sel, r) {
  return page.evaluate(([s, x]) => { const e = document.querySelector(`${s} [data-rolle="${x}"]`); return e ? e.textContent : null; }, [sel, r]);
}
async function waehle(page, id, wert) {
  await page.evaluate(([i, w]) => {
    const e = document.getElementById(i);
    if (e.type === "checkbox") e.checked = w; else e.value = String(w);
    e.dispatchEvent(new Event(e.tagName === "SELECT" || e.type === "checkbox" ? "change" : "input"));
  }, [id, wert]);
}
// Eine Bilanzzahl muss den nachgerechneten Wert auf ihre Stellen treffen.
function trifft(textWert, soll, stellen = 4) {
  return textWert !== null && nahe(zahl(textWert), soll, 0.5 * Math.pow(10, -stellen) + 1e-9);
}

// ════════════════ 1. Histogramme großer Ketten ════════════════

async function wachsen(page) {
  for (const p of [0.1, 0.5, 0.8]) for (const n of [10, 35, 60, 100]) {
    await setzeRegler(page, "wa-p", p);
    const nn = await setzeRegler(page, "wa-n", n);
    const wo = `Wachsen n = ${nn}, p = ${p}`;
    const s = await liesSvg(page, "wa-mount"), w = welt(s);
    const sl = saeulen(s, w, (r) => r.k !== undefined);
    pruefe(sl.length === nn + 1, `${wo}: ${sl.length} Säulen statt ${nn + 1}`);
    let falsch = 0, kmax = 0;
    for (let k = 0; k <= nn; k++) if (Bb(nn, p, k) > Bb(nn, p, kmax)) kmax = k;
    for (const r of sl) {
      const k = Number(r.k);
      if (!nahe(r.x0, k - 0.5, 0.01) || !nahe(r.x1, k + 0.5, 0.01) || !nahe(r.hoehe, Bb(nn, p, k), 2e-4)) falsch++;
    }
    pruefe(falsch === 0, `${wo}: ${falsch} Säulen stehen falsch oder haben die falsche Höhe`);
    const aktiv = sl.filter((r) => /aktiv/.test(r.klasse)).map((r) => Number(r.k));
    pruefe(aktiv.length === 1 && aktiv[0] === kmax, `${wo}: grün ist ${aktiv.join(",")}, die höchste Säule ist ${kmax}`);
    const mu = nn * p, sigma = Math.sqrt(nn * p * (1 - p));
    const muL = s.linien.find((l) => /bk-mu/.test(l.klasse));
    pruefe(!!muL && nahe(w.X(muL.x), mu, 0.01), `${wo}: die μ-Linie steht nicht bei ${mu}`);
    const band = s.rects.find((r) => r.rolle === "sigma-band");
    pruefe(!!band && nahe(w.X(band.x), mu - sigma, 0.01) && nahe(w.X(band.x + band.b), mu + sigma, 0.01), `${wo}: das σ-Band reicht nicht von μ − σ bis μ + σ`);
    pruefe(trifft(await rolle(page, "#wa-bilanz", "mu"), mu) && trifft(await rolle(page, "#wa-bilanz", "sigma"), sigma)
      && trifft(await rolle(page, "#wa-bilanz", "hmax"), Bb(nn, p, kmax)) && zahl(await rolle(page, "#wa-bilanz", "kmax")) === kmax
      && trifft(await rolle(page, "#wa-bilanz", "produkt"), sigma * Bb(nn, p, kmax), 3), `${wo}: die Bilanz stimmt nicht`);
    // Die Behauptung des Wissen-Kastens: σ · höchste Säule ≈ 0,4.
    if (sigma > 3) pruefe(nahe(sigma * Bb(nn, p, kmax), 0.4, 0.02), `${wo}: σ · höchste Säule = ${sigma * Bb(nn, p, kmax)} ist nicht etwa 0,4`);
  }
}

// ════════════════ 2. Standardisieren ════════════════

async function standardisieren(page) {
  // Regler lügen nicht: Bei p = 0,1 ist σ ≥ 1 erst ab n = 15 (auf dem Raster von 5).
  await setzeRegler(page, "st-p", 0.1);
  await waehle(page, "st-n", 10);
  pruefe(await page.evaluate(() => Number(document.getElementById("st-n").value)) === 15, "Standardisieren: bei p = 0,1 lässt sich n = 10 einstellen (σ < 1, „Stauchen“ wäre ein Strecken)");
  for (const [n, p, kWunsch] of [[40, 0.5, 23], [100, 0.5, 40], [60, 0.2, 0], [100, 0.9, 100], [15, 0.1, 3]]) {
    await setzeRegler(page, "st-p", p);
    const nn = await setzeRegler(page, "st-n", n);
    const mu = nn * p, s = Math.sqrt(nn * p * (1 - p));
    await waehle(page, "st-k", kWunsch);
    const k = await page.evaluate(() => Number(document.getElementById("st-k").value));
    const kMin = Math.max(0, Math.ceil(mu - 3 * s)), kMax = Math.min(nn, Math.floor(mu + 3 * s));
    pruefe(k === Math.min(kMax, Math.max(kMin, kWunsch)), `Standardisieren n = ${nn}, p = ${p}: die beobachtete Säule steht auf ${k}, erlaubt ist ${kMin} bis ${kMax}`);
    let summeB = 0;
    for (let i = 0; i <= nn; i++) summeB += Bb(nn, p, i);
    for (const tp of [0, 30, 100, 150, 200, 250, 300, 360, 400]) {
      const T = (await setzeRegler(page, "st-t", tp)) / 100;
      const wo = `Standardisieren n = ${nn}, p = ${p}, k = ${k}, Fortschritt ${Math.round(T * 100)}`;
      const t1 = Math.min(1, T), t2 = Math.min(1, Math.max(0, T - 1)), t3 = Math.min(1, Math.max(0, T - 3));
      const shift = t1 * mu, fx = 1 + t2 * (1 / s - 1), fy = 1 + t3 * (s - 1);
      const s2 = await liesSvg(page, "st-mount"), w = welt(s2);
      const sl = saeulen(s2, w, (r) => r.k !== undefined && /bk-saeule/.test(r.klasse));
      let falsch = 0, flaeche = 0;
      for (const r of sl) {
        const i = Number(r.k), m = (i - shift) * fx;
        flaeche += (r.x1 - r.x0) * r.hoehe;
        if (!nahe(r.x0, m - fx / 2, 2e-3) || !nahe(r.x1, m + fx / 2, 2e-3) || !nahe(r.hoehe, Bb(nn, p, i) * fy, 2e-4)) falsch++;
      }
      pruefe(sl.length > 0 && falsch === 0, `${wo}: ${falsch} von ${sl.length} Säulen sind nicht an ihrem Ort, nicht so breit oder nicht so hoch, wie der Schritt verlangt`);
      // Alle Säulen, die im Bild liegen müssten, sind da.
      const fehlen = [];
      for (let i = 0; i <= nn; i++) {
        const m = (i - shift) * fx;
        const imBild = m - fx / 2 >= w.X(s2.marken[0].x) - 1 && m + fx / 2 <= w.X(s2.marken[s2.marken.length - 1].x) + 1;
        if (Math.abs(i - mu) <= 4 * s && imBild && !sl.some((r) => Number(r.k) === i)) fehlen.push(i);
      }
      pruefe(fehlen.length === 0, `${wo}: die Säulen ${fehlen.slice(0, 5).join(", ")} fehlen`);
      // Gemessene Gesamtfläche = Breite · Höhe · Summe der Wahrscheinlichkeiten (bis auf die weggelassenen Ränder).
      pruefe(nahe(flaeche, fx * fy * summeB, 2e-3), `${wo}: die Säulen haben zusammen die Fläche ${flaeche.toFixed(4)}, erwartet ${(fx * fy).toFixed(4)}`);
      // Der Geist zeigt die Lage zu Beginn des laufenden Schritts.
      const phase = T <= 1 ? 1 : T <= 2 ? 2 : T <= 3 ? "lupe" : 3;
      const tPhase = T <= 1 ? T : T <= 2 ? T - 1 : T <= 3 ? T - 2 : T - 3;
      const geister = saeulen(s2, w, (r) => r.geist !== undefined);
      if (phase === "lupe" || tPhase === 0) pruefe(geister.length === 0, `${wo}: hier darf keine Ausgangslage eingezeichnet sein`);
      else {
        const soll = phase === 1 ? (i) => [i - 0.5, i + 0.5, Bb(nn, p, i)] : phase === 2 ? (i) => [i - mu - 0.5, i - mu + 0.5, Bb(nn, p, i)] : (i) => [(i - mu - 0.5) / s, (i - mu + 0.5) / s, Bb(nn, p, i)];
        const schief = geister.filter((g) => { const [a, b, h] = soll(Number(g.geist)); return !nahe(g.x0, a, 2e-3) || !nahe(g.x1, b, 2e-3) || !nahe(g.hoehe, h, 2e-4); });
        pruefe(geister.length > 0 && schief.length === 0, `${wo}: die gestrichelte Ausgangslage stimmt nicht (${schief.length} von ${geister.length})`);
      }
      const muL = s2.linien.find((l) => /bk-mu/.test(l.klasse));
      pruefe(!!muL && nahe(w.X(muL.x), (mu - shift) * fx, 2e-3), `${wo}: die μ-Linie steht nicht bei ${((mu - shift) * fx).toFixed(3)}`);
      const band = s2.rects.find((r) => r.rolle === "sigma-band");
      pruefe(!!band && nahe(w.X(band.x + band.b) - w.X(band.x), 2 * s * fx, 3e-3), `${wo}: das σ-Band ist nicht 2σ · ${fx.toFixed(3)} breit`);
      const B = Bb(nn, p, k);
      pruefe(trifft(await rolle(page, "#st-bilanz", "mitte"), (k - shift) * fx) && trifft(await rolle(page, "#st-bilanz", "breite"), fx)
        && trifft(await rolle(page, "#st-bilanz", "hoehe"), B * fy) && trifft(await rolle(page, "#st-bilanz", "flaeche"), fx * B * fy)
        && trifft(await rolle(page, "#st-bilanz", "gesamt"), fx * fy * summeB) && trifft(await rolle(page, "#st-bilanz", "mu-ort"), (mu - shift) * fx)
        && trifft(await rolle(page, "#st-bilanz", "band-breite"), 2 * s * fx), `${wo}: die Bilanz stimmt nicht`);
      // Die Schrittleiste zeigt, wo man ist.
      const leiste = await page.evaluate(() => [...document.querySelectorAll("#st-schritte li")].map((li) => li.className));
      const aktivIdx = leiste.indexOf("aktiv"), sollIdx = { 1: 0, 2: 1, lupe: 2, 3: 3 }[phase];
      pruefe(T >= 4 ? leiste.every((c) => c === "fertig") : aktivIdx === sollIdx && leiste.slice(0, sollIdx).every((c) => c === "fertig"), `${wo}: die Schrittleiste zeigt ${leiste.join("/")}`);
    }
  }
}

// ════════════════ 3. Glockenkurve ════════════════

function pruefeKurve(pts, f, wo, was, eps = 2e-3) {
  const schief = pts.filter(([x, y]) => !nahe(y, f(x), eps));
  pruefe(pts.length > 50 && schief.length === 0, `${wo}: ${schief.length} von ${pts.length} Punkten der Kurve liegen nicht auf ${was}`);
}

async function glocke(page) {
  for (const [n, p] of [[20, 0.3], [50, 0.5], [300, 0.1], [500, 0.5], [10, 0.9]]) {
    await setzeRegler(page, "gl-n", n);
    await setzeRegler(page, "gl-p", p);
    const wo = `Glockenkurve n = ${n}, p = ${p}`;
    const mu = n * p, s = Math.sqrt(n * p * (1 - p));
    const s2 = await liesSvg(page, "gl-mount"), w = welt(s2);
    const sl = saeulen(s2, w, (r) => r.k !== undefined);
    const schief = sl.filter((r) => { const k = Number(r.k), z = (k - mu) / s; return !nahe(r.x0, z - 0.5 / s, 2e-3) || !nahe(r.x1, z + 0.5 / s, 2e-3) || !nahe(r.hoehe, s * Bb(n, p, k), 3e-4); });
    pruefe(sl.length > 0 && schief.length === 0, `${wo}: ${schief.length} standardisierte Säulen stimmen nicht`);
    const kurve = s2.pfade.find((x) => x.rolle === "phi");
    pruefeKurve(pfadPunkte(kurve, w), phi, wo, "φ");
    const wende = s2.punkte.filter((x) => x.rolle === "wende").map((x) => [w.X(x.x), w.Y(x.y)]).sort((a, b) => a[0] - b[0]);
    pruefe(wende.length === 2 && nahe(wende[0][0], -1, 0.01) && nahe(wende[1][0], 1, 0.01) && wende.every(([, y]) => nahe(y, phi(1), 1e-3)), `${wo}: die Wendepunkte liegen nicht bei (±1 | φ(1))`);
    let abw = 0;
    for (let k = 0; k <= n; k++) abw = Math.max(abw, Math.abs(s * Bb(n, p, k) - phi((k - mu) / s)));
    pruefe(trifft(await rolle(page, "#gl-bilanz", "abw"), abw) && trifft(await rolle(page, "#gl-bilanz", "phi0"), phi(0))
      && trifft(await rolle(page, "#gl-bilanz", "flaeche-phi"), Phi(4) - Phi(-4)) && trifft(await rolle(page, "#gl-bilanz", "sigma"), s), `${wo}: die Bilanz stimmt nicht`);
    const laplaceText = await page.evaluate(() => document.getElementById("gl-bilanz").innerText);
    pruefe(s > 3 ? /σ > 3 ✓/.test(laplaceText) : /nicht erfüllt/.test(laplaceText), `${wo}: die Laplace-Bedingung ist falsch beurteilt (σ = ${s.toFixed(3)})`);
  }
}

// ════════════════ 4. Lokale Näherung ════════════════

async function lokal(page) {
  for (const [n, p, kWunsch] of [[100, 0.5, 55], [500, 0.1, 40], [30, 0.3, 2], [200, 0.7, 200], [100, 0.5, 500]]) {
    await setzeRegler(page, "lo-n", n);
    await setzeRegler(page, "lo-p", p);
    await waehle(page, "lo-k", kWunsch);
    const k = await page.evaluate(() => Number(document.getElementById("lo-k").value));
    pruefe(k === Math.min(n, kWunsch), `Lokal n = ${n}: k steht auf ${k}, möglich ist höchstens ${n}`);
    const wo = `Lokal n = ${n}, p = ${p}, k = ${k}`;
    const mu = n * p, s = Math.sqrt(n * p * (1 - p)), z = (k - mu) / s, nae = phi(z) / s;
    const s2 = await liesSvg(page, "lo-mount"), w = welt(s2);
    const sl = saeulen(s2, w, (r) => r.k !== undefined);
    const schief = sl.filter((r) => { const i = Number(r.k); return !nahe(r.x0, i - 0.5, 0.01) || !nahe(r.x1, i + 0.5, 0.01) || !nahe(r.hoehe, Bb(n, p, i), 2e-4); });
    pruefe(sl.length > 0 && schief.length === 0, `${wo}: ${schief.length} Säulen stimmen nicht`);
    const gruen = sl.filter((r) => /aktiv/.test(r.klasse)).map((r) => Number(r.k));
    pruefe(gruen.length === 1 && gruen[0] === k, `${wo}: grün ist ${gruen.join(",")} statt ${k}`);
    pruefeKurve(pfadPunkte(s2.pfade.find((x) => x.rolle === "kurve"), w), (x) => phi((x - mu) / s) / s, wo, "(1/σ) · φ((x − μ)/σ)", 3e-4);
    const pk = s2.punkte.find((x) => x.rolle === "naeherung");
    pruefe(!!pk && nahe(w.X(pk.x), k, 0.01) && nahe(w.Y(pk.y), nae, 2e-4), `${wo}: der grüne Punkt liegt nicht bei (k | φ(z) : σ)`);
    pruefe(trifft(await rolle(page, "#lo-bilanz", "z"), z) && trifft(await rolle(page, "#lo-bilanz", "phi"), phi(z))
      && trifft(await rolle(page, "#lo-bilanz", "naeherung"), nae) && trifft(await rolle(page, "#lo-bilanz", "genau"), Bb(n, p, k))
      && trifft(await rolle(page, "#lo-bilanz", "abw"), Math.abs(nae - Bb(n, p, k))), `${wo}: die Bilanz stimmt nicht`);
    // Die Beschriftung von φ nennt dasselbe z wie die Rechnung (vier Stellen).
    const bil = await page.evaluate(() => document.getElementById("lo-bilanz").innerText);
    pruefe(bil.includes(`φ(${de(z)})`), `${wo}: φ ist mit einem anderen z beschriftet, als gerechnet wird`);
  }
}

// ════════════════ 5. Globale Näherung ════════════════

async function global(page) {
  for (const [n, p, art, a, b, korr] of [[100, 0.5, "le", 45, 55, true], [100, 0.5, "zw", 45, 55, true], [100, 0.5, "zw", 45, 55, false],
    [400, 0.2, "ge", 85, 0, true], [200, 0.3, "zw", 70, 50, true], [500, 0.5, "le", 0, 260, false], [30, 0.5, "ge", 18, 0, true]]) {
    await setzeRegler(page, "gb-n", n);
    await setzeRegler(page, "gb-p", p);
    await waehle(page, "gb-art", art);
    await waehle(page, "gb-korrektur", korr);
    await waehle(page, "gb-a", a);
    await waehle(page, "gb-b", b);
    const [aa, bb] = await page.evaluate(() => [Number(document.getElementById("gb-a").value), Number(document.getElementById("gb-b").value)]);
    if (art === "zw") pruefe(bb >= aa, `Global: bei „von a bis b“ steht b = ${bb} unter a = ${aa}`);
    const wo = `Global n = ${n}, p = ${p}, ${art}, a = ${aa}, b = ${bb}, ${korr ? "mit" : "ohne"} Korrektur`;
    const mu = n * p, s = Math.sqrt(n * p * (1 - p)), h = korr ? 0.5 : 0;
    const lo = art === "le" ? 0 : aa, hi = art === "ge" ? n : bb;
    const za = art === "le" ? -Infinity : (aa - h - mu) / s, zb = art === "ge" ? Infinity : (bb + h - mu) / s;
    const nae = Phi(zb) - Phi(za);
    let genau = 0;
    for (let i = lo; i <= hi; i++) genau += Bb(n, p, i);
    const s2 = await liesSvg(page, "gb-mount"), w = welt(s2);
    const sl = saeulen(s2, w, (r) => r.k !== undefined);
    const schief = sl.filter((r) => { const i = Number(r.k), z = (i - mu) / s; return !nahe(r.x0, z - 0.5 / s, 2e-3) || !nahe(r.x1, z + 0.5 / s, 2e-3) || !nahe(r.hoehe, s * Bb(n, p, i), 3e-4); });
    pruefe(sl.length > 0 && schief.length === 0, `${wo}: ${schief.length} standardisierte Säulen stimmen nicht`);
    const falschGruen = sl.filter((r) => /aktiv/.test(r.klasse) !== (Number(r.k) >= lo && Number(r.k) <= hi));
    pruefe(falschGruen.length === 0, `${wo}: ${falschGruen.length} Säulen sind falsch eingefärbt`);
    // Die grüne Fläche: im Bild von max(za, −4,5) bis min(zb, 4,5).
    const fl = s2.pfade.find((x) => x.rolle === "flaeche");
    const xa = Math.max(za, -4.5), xb = Math.min(zb, 4.5);
    pruefe(!!fl && (korr ? !/ohne/.test(fl.klasse) : /ohne/.test(fl.klasse)), `${wo}: die Fläche ist nicht als ${korr ? "mit" : "ohne"} Korrektur gekennzeichnet`);
    if (fl) {
      const pts = pfadPunkte(fl, w);
      const xs = pts.map((q) => q[0]);
      pruefe(nahe(Math.min(...xs), xa, 3e-3) && nahe(Math.max(...xs), xb, 3e-3), `${wo}: die Fläche reicht von ${Math.min(...xs).toFixed(3)} bis ${Math.max(...xs).toFixed(3)} statt von ${xa.toFixed(3)} bis ${xb.toFixed(3)}`);
      pruefe(nahe(flaecheVieleck(pts), Phi(xb) - Phi(xa), 2e-3), `${wo}: die grüne Fläche misst ${flaecheVieleck(pts).toFixed(4)}, Φ ergibt ${(Phi(xb) - Phi(xa)).toFixed(4)}`);
    }
    for (const [r, z] of [["grenze-a", za], ["grenze-b", zb]]) {
      const l = s2.linien.find((x) => x.rolle === r);
      if (Number.isFinite(z) && Math.abs(z) <= 4.5) pruefe(!!l && nahe(w.X(l.x), z, 3e-3), `${wo}: die Grenze ${r} steht nicht bei z = ${z.toFixed(3)}`);
      else pruefe(!l, `${wo}: eine Grenze ${r} ist eingezeichnet, obwohl es keine gibt`);
    }
    // Rechts: Φ als Kurve, die Punkte auf ihr.
    const q = await liesSvg(page, "gb-phi"), wq = welt(q);
    pruefeKurve(pfadPunkte(q.pfade.find((x) => x.rolle === "Phi"), wq), Phi, wo, "Φ", 3e-3);
    for (const [r, z] of [["Phi-b", zb], ["Phi-a", za]]) {
      const pt = q.punkte.find((x) => x.rolle === r);
      if (Number.isFinite(z) && Math.abs(z) <= 4) pruefe(!!pt && nahe(wq.X(pt.x), z, 0.01) && nahe(wq.Y(pt.y), Phi(z), 3e-3), `${wo}: der Punkt ${r} liegt nicht bei (z | Φ(z))`);
    }
    pruefe(trifft(await rolle(page, "#gb-bilanz", "naeherung"), nae) && trifft(await rolle(page, "#gb-bilanz", "genau"), genau)
      && trifft(await rolle(page, "#gb-bilanz", "andere"), Phi(art === "ge" ? Infinity : (bb + (korr ? 0 : 0.5) - mu) / s) - Phi(art === "le" ? -Infinity : (aa - (korr ? 0 : 0.5) - mu) / s)),
      `${wo}: die Bilanz stimmt nicht`);
    if (Number.isFinite(zb)) pruefe(trifft(await rolle(page, "#gb-bilanz", "zb"), zb), `${wo}: z_b ist falsch`);
    if (Number.isFinite(za)) pruefe(trifft(await rolle(page, "#gb-bilanz", "za"), za), `${wo}: z_a ist falsch`);
    // Die Behauptung der Seite: Mit Korrektur ist die Näherung besser — bei σ > 3 und einem Ereignis mit Rand.
    if (korr && s > 3) pruefe(Math.abs(nae - genau) < 0.005, `${wo}: die Näherung weicht um ${Math.abs(nae - genau).toFixed(4)} ab`);
  }
}

// ════════════════ 6. Normalverteilung ════════════════

async function normal(page) {
  for (const [mu, s, art, a, b, regeln] of [[172, 8, "zw", 165, 180, false], [172, 4, "zw", 165, 180, true], [150, 12, "ge", 160, 0, true],
    [190, 6.5, "le", 0, 200, false], [160, 5, "zw", 170, 150, false]]) {
    await setzeRegler(page, "nv-mu", mu);
    await setzeRegler(page, "nv-sigma", s);
    await waehle(page, "nv-art", art);
    await waehle(page, "nv-regeln", regeln);
    await waehle(page, "nv-a", a);
    await waehle(page, "nv-b", b);
    const [aa, bb] = await page.evaluate(() => [Number(document.getElementById("nv-a").value), Number(document.getElementById("nv-b").value)]);
    if (art === "zw") pruefe(bb >= aa, `Normal: bei a ≤ X ≤ b steht b = ${bb} unter a = ${aa}`);
    const wo = `Normal μ = ${mu}, σ = ${s}, ${art}, a = ${aa}, b = ${bb}`;
    const f = (x) => phi((x - mu) / s) / s;
    const za = art === "le" ? -Infinity : (aa - mu) / s, zb = art === "ge" ? Infinity : (bb - mu) / s;
    const P = Phi(zb) - Phi(za);
    const s2 = await liesSvg(page, "nv-mount"), w = welt(s2);
    pruefeKurve(pfadPunkte(s2.pfade.find((x) => x.rolle === "dichte"), w), f, wo, "der Dichte", 2e-4);
    const fl = s2.pfade.find((x) => x.rolle === "flaeche");
    const xa = art === "le" ? 100 : aa, xb = art === "ge" ? 240 : bb;
    if (xb > xa) {
      const pts = pfadPunkte(fl, w);
      pruefe(nahe(flaecheVieleck(pts), Phi((xb - mu) / s) - Phi((xa - mu) / s), 1e-3), `${wo}: die grüne Fläche misst ${flaecheVieleck(pts).toFixed(4)} statt ${P.toFixed(4)}`);
    }
    const wende = s2.punkte.filter((x) => x.rolle === "wende").map((x) => w.X(x.x)).sort((u, v) => u - v);
    pruefe(wende.length === 2 && nahe(wende[0], mu - s, 0.05) && nahe(wende[1], mu + s, 0.05), `${wo}: die Wendepunkte liegen nicht bei μ ± σ`);
    pruefe(trifft(await rolle(page, "#nv-bilanz", "P"), P), `${wo}: P ist falsch`);
    if (Number.isFinite(za)) pruefe(trifft(await rolle(page, "#nv-bilanz", "za"), za), `${wo}: z_a ist falsch`);
    if (Number.isFinite(zb)) pruefe(trifft(await rolle(page, "#nv-bilanz", "zb"), zb), `${wo}: z_b ist falsch`);
    const baender = s2.rects.filter((r) => /^band\d$/.test(r.rolle || ""));
    if (regeln) {
      for (const m of [1, 2, 3]) {
        const r = baender.find((x) => x.rolle === `band${m}`);
        pruefe(!!r && nahe(w.X(r.x), Math.max(100, mu - m * s), 0.05) && nahe(w.X(r.x + r.b), Math.min(240, mu + m * s), 0.05), `${wo}: die ${m}σ-Umgebung ist falsch eingezeichnet`);
        pruefe(trifft(await rolle(page, "#nv-bilanz", `regel${m}`), Phi(m) - Phi(-m)), `${wo}: die σ-Regel für ${m}σ ist falsch`);
      }
    } else pruefe(baender.length === 0, `${wo}: σ-Umgebungen sind eingezeichnet, obwohl sie abgeschaltet sind`);
  }
}

// ════════════════ 7. Rückwärts ════════════════

async function umkehr(page) {
  // γ auf beiden Seiten von 0,5: Bei γ = 0,5 sind γ und 1 − γ gleich, und eine Verwechslung fiele nicht auf.
  pruefe(await page.evaluate(() => Number(document.getElementById("uk-gamma").min)) <= 0.05, "Rückwärts: γ = 0,05 (das Einstiegsbeispiel) lässt sich nicht einstellen");
  for (const [mu, s, art, g] of [[500, 5, "links", 0.05], [500, 5, "links", 0.95], [480, 10, "rechts", 0.1], [480, 10, "rechts", 0.9], [520, 2, "symm", 0.95], [500, 7.5, "symm", 0.2], [490, 3, "rechts", 0.5]]) {
    await setzeRegler(page, "uk-mu", mu);
    await setzeRegler(page, "uk-sigma", s);
    await waehle(page, "uk-art", art);
    const gg = await setzeRegler(page, "uk-gamma", g);
    const wo = `Rückwärts μ = ${mu}, σ = ${s}, ${art}, γ = ${gg}`;
    const f = (x) => phi((x - mu) / s) / s;
    const s2 = await liesSvg(page, "uk-mount"), w = welt(s2);
    pruefeKurve(pfadPunkte(s2.pfade.find((x) => x.rolle === "dichte"), w), f, wo, "der Dichte", 5e-4);
    const fl = pfadPunkte(s2.pfade.find((x) => x.rolle === "flaeche"), w);
    if (art === "symm") {
      const z = PhiInv((1 + gg) / 2), d = z * s;
      const li = s2.linien.find((x) => x.rolle === "c-links"), re = s2.linien.find((x) => x.rolle === "c-rechts");
      pruefe(!!li && !!re && nahe(w.X(li.x), mu - d, 0.02) && nahe(w.X(re.x), mu + d, 0.02), `${wo}: die Grenzen liegen nicht bei μ ± ${d.toFixed(3)}`);
      pruefe(trifft(await rolle(page, "#uk-bilanz", "z"), z, 3) && trifft(await rolle(page, "#uk-bilanz", "d"), d, 2), `${wo}: z oder d sind falsch`);
      pruefe(nahe(flaecheVieleck(fl), gg, 1.5e-3), `${wo}: die grüne Fläche misst ${flaecheVieleck(fl).toFixed(4)} statt ${gg}`);
    } else {
      const z = PhiInv(art === "links" ? gg : 1 - gg), c = mu + z * s;
      const l = s2.linien.find((x) => x.rolle === "c");
      pruefe(!!l && nahe(w.X(l.x), c, 0.02), `${wo}: die Grenze c liegt nicht bei ${c.toFixed(3)}`);
      pruefe(trifft(await rolle(page, "#uk-bilanz", "z"), z, 3) && trifft(await rolle(page, "#uk-bilanz", "c"), c, 2), `${wo}: z oder c sind falsch`);
      pruefe(nahe(flaecheVieleck(fl), gg, 1.5e-3), `${wo}: die grüne Fläche misst ${flaecheVieleck(fl).toFixed(4)} statt ${gg}`);
    }
  }
}

// ════════════════ Kontrollfragen ════════════════

async function quizze(page) {
  const ids = await page.evaluate(() => [...document.querySelectorAll(".quiz[id]")].map((q) => q.id));
  pruefe(ids.length === 7, `Kontrollfragen: ${ids.length} statt 7`);
  const ohne = await page.evaluate(() => [...document.querySelectorAll("main section.card[id]")].filter((s) => s.querySelector(".widget") && !s.querySelector(".quiz")).map((s) => s.id));
  pruefe(ohne.length === 0, `Kontrollfragen: Abschnitte ohne Kontrollfrage — ${ohne.join(", ")}`);
  // Was richtig ist, wird hier nachgerechnet — nicht aus der Seite übernommen.
  const sigmaAus = (o) => { const m = o.match(/n = (\d+), p = (\S+)/); return m ? Math.sqrt(+m[1] * zahl(m[2]) * (1 - zahl(m[2]))) : NaN; };
  const RICHTIG = {
    "quiz-wachsen": (o) => /verdoppelt/.test(o),
    "quiz-standardisieren": (o) => o === "z = " + de((60 - 50) / 5),
    "quiz-glockenkurve": (o) => sigmaAus(o) > 3,
    "quiz-lokal": (o) => nahe(zahl(o), phi(1) / 10, 5e-5),
    "quiz-global": (o) => o === `Φ(${de((55.5 - 50) / 5)})`,
    "quiz-normalverteilung": (o) => nahe(zahl(o.replace(/[^\d,]/g, "")) / 100, Phi(1) - Phi(-1), 6e-4),
    "quiz-umkehr": (o) => nahe(zahl(o.replace(/[^\d,]/g, "")), 500 + PhiInv(0.05) * 5, 0.06),
  };
  const stellen = [];
  for (const id of ids) {
    const opts = await page.evaluate((q) => [...document.querySelectorAll(`#${q} .quiz-opt`)].map((b) => b.textContent.trim()), id);
    pruefe(opts.length === 4 && new Set(opts).size === 4, `Kontrollfrage ${id}: keine vier verschiedenen Antworten`);
    let richtige = 0;
    for (let i = 0; i < opts.length; i++) {
      await page.locator(`#${id} .quiz-opt`).nth(i).click();
      const fb = await text(page, `#${id} .quiz-feedback`);
      const ok = fb.startsWith("✓");
      if (ok) { richtige++; stellen.push(i); }
      pruefe(ok === RICHTIG[id](opts[i]), `Kontrollfrage ${id}: „${opts[i]}“ gilt als ${ok ? "richtig" : "falsch"}, nachgerechnet ist es umgekehrt`);
      pruefe(fb.length > 80, `Kontrollfrage ${id}: die Erklärung ist zu knapp — „${fb}“`);
    }
    pruefe(richtige === 1, `Kontrollfrage ${id}: ${richtige} richtige Antworten`);
  }
  pruefe(new Set(stellen).size >= 3, `Kontrollfragen: die richtige Antwort steht fast immer an derselben Stelle (${stellen.join(", ")})`);
}

async function selbsteinschaetzung(page) {
  await page.evaluate(() => { for (const k of Object.keys(localStorage)) if (/^uplant-(selbsteinschaetzung|lernstand):/.test(k)) localStorage.removeItem(k); });
  await page.reload({ waitUntil: "networkidle" });
  const zeilen = await page.locator("#se-liste .se-zeile").count();
  pruefe(zeilen === 7, `Selbsteinschätzung: ${zeilen} Punkte statt 7 (einer je Abschnitt)`);
  await page.locator("#se-liste .se-zeile").nth(4).locator("button").nth(2).click();
  const ziel = await page.evaluate(() => { const a = document.querySelector("#se-auswertung a"); return a && a.getAttribute("href"); });
  pruefe(ziel === "#sec-global", `Selbsteinschätzung: der Verweis führt nach ${ziel} statt #sec-global`);
  await page.evaluate(() => { for (const k of Object.keys(localStorage)) if (/^uplant-(selbsteinschaetzung|lernstand):/.test(k)) localStorage.removeItem(k); });
  await page.reload({ waitUntil: "networkidle" });
}

// ════════════════ Übungsaufgaben ════════════════

function ketteAus(f) {
  let m = f.match(/Würfel wird (\d+)-mal/);
  if (m) return { n: +m[1], p: 1 / 6 };
  m = f.match(/Münze wird (\d+)-mal/);
  if (m) return { n: +m[1], p: 0.5 };
  m = f.match(/binomialverteilt mit n = (\d+) und p = (\d+,\d+)/);
  if (m) return { n: +m[1], p: zahl(m[2]) };
  return null;
}
function kenn({ n, p }) {
  return { mu: n * p, s: Math.sqrt(n * p * (1 - p)) };
}
function groesseAus(f) {
  const m = f.match(/normalverteilt mit μ = ([\d.]+) (cm|g) und σ = (\d+) \2/);
  return m ? { mu: zahl(m[1]), s: +m[3], e: m[2] } : null;
}
const tolGrenze = (s) => 0.006 * s + 0.05;

async function aufgaben(page) {
  // Die Schranken sind mit werkzeug-streuung.js gemessen (30 Züge, 10⁻⁴-Quantil für 0,8 · n), nicht geschätzt:
  //   UPLANT_ZUEGE=30 node tests/werkzeug-streuung.js /mathematik/mss13/01-wahrscheinlichkeitsrechnung/06-normalverteilung/index.html
  // verschieden von 200: 147, 11, 48, 111, 119, 122, 179, 114, 128, 194, 198, 153, 20, 47, 36, 18
  // (n ≈ 306, 11, 49, 151, 174, 184, 880, 159, 205, 3250, 9884, 354, 20, 48, 36, 18). Schmal sind E2 (elf
  // Trefferwahrscheinlichkeiten), K1 (eine Kette mit σ = 10) und K4 (sechs Ketten, drei γ) — gewollt:
  // Nur bei σ = 5 oder 10 hat der z-Wert zwei Stellen und trifft die Tabelle.
  const R = 30;
  const SCHRANKE = [23, 6, 14, 20, 21, 21, 25, 20, 21, 27, 27, 23, 9, 14, 12, 8];

  await pruefeAufgabe(page, bericht, {
    nr: 1, name: "E1 standardisieren", runden: R, mindestensVerschieden: SCHRANKE[0],
    deute: (f) => {
      const k0 = ketteAus(f), m = f.match(/Standardisiere den Wert k = (\d+)/);
      if (!k0 || !m) return null;
      const { mu, s } = kenn(k0), k = +m[1], z = (k - mu) / s;
      return { richtig: z, toleranz: 0.006, falsch: [[k - mu, "nur k − μ"], [(k - mu) / (s * s), "durch σ²"], [-z, "Vorzeichen"]] };
    },
  });
  await pruefeAufgabe(page, bericht, {
    nr: 2, name: "E2 Laplace-Bedingung", runden: R, mindestensVerschieden: SCHRANKE[1],
    deute: (f) => {
      const m = f.match(/Trefferwahrscheinlichkeit p = (\d,\d+)/);
      if (!m) return null;
      const p = zahl(m[1]);
      let n = 1;
      while (Math.sqrt(n * p * (1 - p)) <= 3 + 1e-12) n++;
      let n3 = 1;
      while (n3 * p * (1 - p) <= 3 + 1e-12) n3++;
      let nmu = 1;
      while (nmu * p <= 3 + 1e-12) nmu++;
      pruefe(Math.sqrt((n - 1) * p * (1 - p)) <= 3, `E2: schon n = ${n - 1} erfüllt σ > 3 — „${f}“`);
      return { richtig: n, toleranz: 0.4, falsch: [[n3, "σ² = n · p · (1 − p) größer als 3"], [nmu, "μ = n · p größer als 3"]] };
    },
  });
  await pruefeAufgabe(page, bericht, {
    nr: 3, name: "E3 φ-Wert", runden: R, mindestensVerschieden: SCHRANKE[2],
    deute: (f) => {
      const m = f.match(/Berechne φ\((−?\d+(,\d+)?)\)/);
      if (!m) return null;
      const z = zahl(m[1]);
      return { richtig: phi(z), toleranz: 0.0006, falsch: [[Math.exp(-z * z / 2), "Vorfaktor"], [Math.exp(-z * z) / Math.sqrt(2 * Math.PI), "−z² : 2"], [Phi(z), "die Fläche links von z"]] };
    },
  });
  await pruefeAufgabe(page, bericht, {
    nr: 4, name: "E4 Φ und Symmetrie", runden: R, mindestensVerschieden: SCHRANKE[3],
    deute: (f) => {
      const m = f.match(/Φ\((\d+(?:,\d+)?)\) = (0,\d{4}) ab\. Berechne (P\(.*\))\./);
      if (!m) return null;
      const z = zahl(m[1]), F = zahl(m[2]), frage = m[3];
      pruefe(nahe(F, Phi(z), 5.1e-5), `E4: der Tabellenwert Φ(${m[1]}) = ${m[2]} stimmt nicht — „${f}“`);
      const zt = de(z, 2), nzt = "−" + zt;
      if (frage === `P(Z ≤ ${nzt})`) return { richtig: 1 - F, toleranz: 0.0006, falsch: [[F, "positiven"], [F - 0.5, "zwischen 0 und z"]] };
      if (frage === `P(Z ≥ ${zt})`) return { richtig: 1 - F, toleranz: 0.0006, falsch: [[F, "rechts"], [F - 0.5, "zwischen 0 und z"]] };
      if (frage === `P(${nzt} ≤ Z ≤ ${zt})`) return { richtig: 2 * F - 1, toleranz: 0.0006, falsch: [[F, "abgezogen werden muss"], [F - 0.5, "die Hälfte"], [1 - F, "rechts von z"]] };
      if (frage === `P(Z ≥ ${nzt})`) return { richtig: F, toleranz: 0.0006, falsch: [[1 - F, "links von −z"], [2 * F - 1, "zwischen −z und z"]] };
      pruefe(false, `E4: unbekannte Frage „${frage}“`);
      return null;
    },
  });
  await pruefeAufgabe(page, bericht, {
    nr: 5, name: "M1 lokale Näherung", runden: R, mindestensVerschieden: SCHRANKE[4],
    deute: (f) => {
      const k0 = ketteAus(f), m = f.match(/Berechne P\(X = (\d+)\) näherungsweise/);
      if (!k0 || !m) return null;
      const { mu, s } = kenn(k0), k = +m[1], z = (k - mu) / s, nae = phi(z) / s, genau = Bb(k0.n, k0.p, k);
      return { richtig: nae, toleranz: 0.0006, falsch: [[phi(z), "standardisierten"], [phi(z) / (s * s), "durch σ²"], [Math.abs(genau - nae) > 0.0012 ? genau : NaN, "genaue Wert"]] };
    },
  });
  await pruefeAufgabe(page, bericht, {
    nr: 6, name: "M2 höchstens k global", runden: R, mindestensVerschieden: SCHRANKE[5],
    deute: (f) => {
      const k0 = ketteAus(f), m = f.match(/Berechne P\(X ≤ (\d+)\) näherungsweise/);
      if (!k0 || !m) return null;
      const { mu, s } = kenn(k0), k = +m[1], w = Phi((k + 0.5 - mu) / s);
      pruefe(Math.abs(s - Math.round(s)) < 1e-9 && [5, 10].includes(Math.round(s)), `M2: σ = ${s} — der z-Wert hat dann mehr als zwei Stellen`);
      return { richtig: w, toleranz: 0.0006, falsch: [[Phi((k - mu) / s), "Ohne Stetigkeitskorrektur"], [Phi((k - 0.5 - mu) / s), "nach rechts"], [1 - w, "Fläche rechts"]] };
    },
  });
  await pruefeAufgabe(page, bericht, {
    nr: 7, name: "M3 normalverteilt höchstens", runden: R, mindestensVerschieden: SCHRANKE[6],
    deute: (f) => {
      const g = groesseAus(f), m = f.match(/höchstens ([\d.]+) (cm|g)\?/);
      if (!g || !m) return null;
      const b = zahl(m[1]), z = (b - g.mu) / g.s;
      return { richtig: Phi(z), toleranz: 0.0006, falsch: [[Phi((b + 0.5 - g.mu) / g.s), "keine Säulen"], [Phi((b - g.mu) / (g.s * g.s)), "durch σ²"], [1 - Phi(z), "Fläche links von b"]] };
    },
  });
  await pruefeAufgabe(page, bericht, {
    nr: 8, name: "M4 σ-Regeln", runden: R, mindestensVerschieden: SCHRANKE[7],
    deute: (f) => {
      const g = groesseAus(f);
      if (!g) return null;
      let m = f.match(/zwischen ([\d.]+) (?:cm|g) und ([\d.]+) (?:cm|g)\?/);
      if (m) {
        const k = (zahl(m[2]) - g.mu) / g.s;
        pruefe(Number.isInteger(k) && g.mu - zahl(m[1]) === zahl(m[2]) - g.mu, `M4: keine σ-Umgebung — „${f}“`);
        return { richtig: Phi(k) - Phi(-k), toleranz: 0.0006, falsch: [[Phi(k), "Links von der unteren Grenze"], [(Phi(k) - Phi(-k)) / 2, "nur eine Hälfte"]] };
      }
      m = f.match(/(größer|kleiner) als ([\d.]+) (?:cm|g)\?/);
      if (!m) return null;
      const k = Math.abs(zahl(m[2]) - g.mu) / g.s;
      return { richtig: 1 - Phi(k), toleranz: 0.0006, falsch: [[2 * (1 - Phi(k)), "beide Ränder"], [Phi(k), "anderen Seite"]] };
    },
  });
  await pruefeAufgabe(page, bericht, {
    nr: 9, name: "S1 mindestens a global", runden: R, mindestensVerschieden: SCHRANKE[8],
    deute: (f) => {
      const k0 = ketteAus(f), m = f.match(/Berechne P\(X ≥ (\d+)\) näherungsweise/);
      if (!k0 || !m) return null;
      const { mu, s } = kenn(k0), a = +m[1], w = 1 - Phi((a - 0.5 - mu) / s);
      return { richtig: w, toleranz: 0.0006, falsch: [[1 - Phi((a + 0.5 - mu) / s), "falsche Richtung"], [Phi((a - 0.5 - mu) / s), "Gegenereignis"], [1 - Phi((a - mu) / s), "Ohne Stetigkeitskorrektur"]] };
    },
  });
  await pruefeAufgabe(page, bericht, {
    nr: 10, name: "S2 zwischen global", runden: R, mindestensVerschieden: SCHRANKE[9],
    deute: (f) => {
      const k0 = ketteAus(f), m = f.match(/Berechne P\((\d+) ≤ X ≤ (\d+)\) näherungsweise/);
      if (!k0 || !m) return null;
      const { mu, s } = kenn(k0), a = +m[1], b = +m[2];
      const w = Phi((b + 0.5 - mu) / s) - Phi((a - 0.5 - mu) / s);
      return { richtig: w, toleranz: 0.0006, falsch: [[Phi((b - mu) / s) - Phi((a - mu) / s), "Ohne Stetigkeitskorrektur"], [Phi((b - 0.5 - mu) / s) - Phi((a + 0.5 - mu) / s), "nach innen"], [Phi((b + 0.5 - mu) / s), "abgezogen werden"]] };
    },
  });
  await pruefeAufgabe(page, bericht, {
    nr: 11, name: "S3 normalverteilt zwischen", runden: R, mindestensVerschieden: SCHRANKE[10],
    deute: (f) => {
      const g = groesseAus(f), m = f.match(/zwischen ([\d.]+) (?:cm|g) und ([\d.]+) (?:cm|g)\?/);
      if (!g || !m) return null;
      const a = zahl(m[1]), b = zahl(m[2]), P = Phi((b - g.mu) / g.s) - Phi((a - g.mu) / g.s);
      return { richtig: P, toleranz: 0.0006, falsch: [[Phi((b + 0.5 - g.mu) / g.s) - Phi((a - 0.5 - g.mu) / g.s), "keine Stetigkeitskorrektur"], [Phi((b - g.mu) / (g.s * g.s)) - Phi((a - g.mu) / (g.s * g.s)), "durch σ²"], [Phi((b - g.mu) / g.s), "noch abgezogen"]] };
    },
  });
  await pruefeAufgabe(page, bericht, {
    nr: 12, name: "S4 Grenze gesucht", runden: R, mindestensVerschieden: SCHRANKE[11],
    deute: (f) => {
      const g = groesseAus(f), m = f.match(/Welchen Wert c (unterschreiten|überschreiten) (?:nur )?(\d+(?:,\d+)?) % der Werte/);
      if (!g || !m) return null;
      const anteil = zahl(m[2]) / 100, gamma = m[1] === "unterschreiten" ? anteil : 1 - anteil;
      const z = PhiInv(gamma), c = g.mu + z * g.s, z2 = PhiInv(gamma < 0.5 ? gamma / 2 : (1 + gamma) / 2);
      return { richtig: c, toleranz: tolGrenze(g.s), falsch: [[g.mu - z * g.s, "falschen Seite"], [g.mu + z2 * g.s, "beide Seiten"]] };
    },
  });
  await pruefeAufgabe(page, bericht, {
    nr: 13, name: "K1 Überbuchung", runden: R, mindestensVerschieden: SCHRANKE[12],
    deute: (f) => {
      const m = f.match(/hat (\d+) Plätze\. .* Wahrscheinlichkeit (\d,\d+) .* verkauft (\d+) Tickets/);
      if (!m) return null;
      const plaetze = +m[1], p = zahl(m[2]), n = +m[3], { mu, s } = kenn({ n, p });
      const w = 1 - Phi((plaetze + 0.5 - mu) / s);
      return { richtig: w, toleranz: 0.0006, falsch: [[1 - Phi((plaetze - mu) / s), "Ohne Stetigkeitskorrektur"], [1 - Phi((plaetze - 0.5 - mu) / s), "reichen die Plätze noch"], [Phi((plaetze + 0.5 - mu) / s), "Gegenereignis"]] };
    },
  });
  await pruefeAufgabe(page, bericht, {
    nr: 14, name: "K2 σ gesucht", runden: R, mindestensVerschieden: SCHRANKE[13],
    deute: (f) => {
      const m = f.match(/Sollgewicht μ = ([\d.]+) g; .* Höchstens (\d+) % der Packungen dürfen weniger als ([\d.]+) g/);
      if (!m) return null;
      const mu = zahl(m[1]), alpha = +m[2] / 100, grenze = zahl(m[3]), d = mu - grenze;
      const z = PhiInv(1 - alpha), s = d / z;
      pruefe(nahe(Phi(-d / s), alpha, 1e-9), `K2: die Probe geht nicht auf — „${f}“`);
      return { richtig: s, toleranz: 0.004 * s + 0.006, falsch: [[d / PhiInv(1 - alpha / 2), "beide Seiten"], [d * z, "nicht malgenommen"]] };
    },
  });
  await pruefeAufgabe(page, bericht, {
    nr: 15, name: "K3 μ gesucht", runden: R, mindestensVerschieden: SCHRANKE[14],
    deute: (f) => {
      const m = f.match(/Auf Packungen steht „([\d.]+) g“\. .* σ = (\d+) g ab; .* Höchstens (\d+) % der Packungen/);
      if (!m) return null;
      const grenze = zahl(m[1]), s = +m[2], alpha = +m[3] / 100, z = PhiInv(1 - alpha);
      return { richtig: grenze + z * s, toleranz: tolGrenze(s), falsch: [[grenze - z * s, "über"], [grenze + PhiInv(1 - alpha / 2) * s, "beide Seiten"]] };
    },
  });
  await pruefeAufgabe(page, bericht, {
    nr: 16, name: "K4 Bereich um μ", runden: R, mindestensVerschieden: SCHRANKE[15],
    deute: (f) => {
      const k0 = ketteAus(f), m = f.match(/mit der Wahrscheinlichkeit (\d+) %/);
      if (!k0 || !m) return null;
      const { mu, s } = kenn(k0), gamma = +m[1] / 100, z = PhiInv((1 + gamma) / 2), z1 = PhiInv(gamma);
      return {
        felder: [mu - z * s, mu + z * s], toleranz: tolGrenze(s),
        falschFelder: [[0, mu - z1 * s, "jeder"], [1, mu + z1 * s, "jeder"], [0, mu - z * s * s, "σ²"], [1, mu + z * s * s, "σ²"]],
      };
    },
  });
}

// ════════════════ Gerüst ════════════════

async function geruest(page) {
  const folge = await page.evaluate(() => [...document.querySelectorAll("main section[id]")].map((s) => s.id));
  const soll = ["sec-wachsen", "sec-standardisieren", "sec-glockenkurve", "sec-lokal", "sec-global", "sec-normalverteilung", "sec-umkehr",
    "sec-vernetzung", "sec-formelsammlung", "sec-uebungen", "sec-selbsteinschaetzung"];
  pruefe(JSON.stringify(folge) === JSON.stringify(soll), `Gerüst: die Abschnitte stehen in der Reihenfolge ${folge.join(", ")}`);
  // Nummern der Überschriften 1 bis 7, in der Reihenfolge der Seite.
  const nummern = await page.evaluate(() => [...document.querySelectorAll("main section[id] > h2")].map((h) => (h.textContent.match(/^(\d+)\./) || [])[1]).filter(Boolean).map(Number));
  pruefe(JSON.stringify(nummern) === "[1,2,3,4,5,6,7]", `Gerüst: die Abschnitte sind ${nummern.join(", ")} nummeriert`);
  const haupt = await page.evaluate(() => document.querySelector("main").innerText);
  for (const s of ["B(n; p; k)", "F(n; p; k)", "Bn;p(k)", "Bigalke/Köhler", "Fundamente", "Laplace-Bedingung", "Stetigkeitskorrektur", "de Moivre"]) pruefe(haupt.includes(s), `Gerüst: „${s}“ fehlt`);
  // Das Beispiel in Abschnitt 2 und 4 rechnet richtig: B(100; 0,5; 55), σ · B, φ(1) : 5.
  const b2 = await page.evaluate(() => document.querySelector("#sec-standardisieren .beispiel-box").innerText);
  const B55 = Bb(100, 0.5, 55);
  // Jede Aussage einzeln: Eine Zahl, die irgendwo im Kasten vorkommt, belegt nichts.
  const aussage = (re) => (b2.match(re) || [])[1];
  const H = 5 * B55;
  pruefe(aussage(/B\(100; 0,5; 55\) ≈ (\d,\d+)\./) === de(B55), "Gerüst: Beispiel Abschnitt 2 — B(100; 0,5; 55) falsch");
  pruefe(aussage(/Fläche jetzt 0,2 · (\d,\d+)/) === de(B55) && aussage(/Fläche jetzt 0,2 · \d,\d+ ≈ (\d,\d+)/) === de(0.2 * B55), "Gerüst: Beispiel Abschnitt 2 — Fläche nach Schritt 2 falsch");
  pruefe(aussage(/5 · B\(100; 0,5; 55\) ≈ (\d,\d+)/) === de(H), "Gerüst: Beispiel Abschnitt 2 — Höhe nach Schritt 3 falsch");
  pruefe(aussage(/Fläche wieder 0,2 · (\d,\d+)/) === de(H) && aussage(/Fläche wieder 0,2 · \d,\d+ ≈ (\d,\d+)/) === de(0.2 * zahl(de(H))), "Gerüst: Beispiel Abschnitt 2 — Fläche nach Schritt 3 falsch");
  pruefe(aussage(/Also: z = (\d+), Höhe/) === "1" && aussage(/Höhe ≈ (\d,\d+)/) === de(H), "Gerüst: Beispiel Abschnitt 2 — Ergebnis falsch");
  const b4 = await page.evaluate(() => document.querySelector("#sec-lokal .beispiel-box").innerText);
  pruefe(b4.includes(de(phi(1))) && b4.includes(de(Math.round(phi(1) * 1e4) / 1e4 / 5)) && b4.includes(de(B55)), "Gerüst: das Beispiel in Abschnitt 4 rechnet falsch");
  // Die σ-Regeln und Φ-Werte im Text.
  const t6 = await page.evaluate(() => document.getElementById("sec-normalverteilung").innerText);
  for (const m of [1, 2, 3]) pruefe(t6.includes(de((Phi(m) - Phi(-m)) * 100, 1) + " %"), `Gerüst: die σ-Regel für ${m}σ ist falsch angegeben`);
  const t7 = await page.evaluate(() => document.getElementById("sec-umkehr").innerText);
  for (const [z, g] of [[1.28, 0.9], [1.64, 0.95], [1.96, 0.975], [2.33, 0.99]]) pruefe(t7.includes(`Φ(${de(z, 2)}) ≈ ${de(g, 3)}`) && nahe(Phi(z), g, 0.005), `Gerüst: Φ(${z}) ≈ ${g} stimmt nicht oder fehlt`);
  for (const [z, g] of [[1.64, 0.9], [1.96, 0.95], [2.58, 0.99]]) pruefe(nahe(Phi(z) - Phi(-z), g, 0.0015), `Gerüst: μ ± ${z}σ enthält nicht ${g}`);
  const rahmen = await page.evaluate(() => ({
    brot: document.querySelector("nav.breadcrumb").innerText.trim().endsWith("6 Normalverteilung"),
    haftung: !!document.querySelector('footer a[href$="haftungsausschluss.html"]'),
  }));
  pruefe(rahmen.brot && rahmen.haftung, "Gerüst: Brotkrumen oder Haftungsausschluss fehlen");
  const links = await page.evaluate(() => [...document.querySelectorAll("a[href]")].map((a) => a.getAttribute("href")).filter((h) => !h.startsWith("http")));
  for (const href of new Set(links)) {
    if (href.startsWith("#")) { pruefe(await page.evaluate((id) => !!document.getElementById(id), href.slice(1)), `Gerüst: die Sprungmarke „${href}“ führt ins Leere`); continue; }
    const ziel = new URL(href, "http://localhost" + SEITE);
    const antwort = await page.request.get("http://localhost:" + (process.env.UPLANT_PORT || "8936") + ziel.pathname);
    pruefe(antwort.ok(), `Gerüst: der Verweis „${href}“ führt ins Leere (${antwort.status()})`);
    if (ziel.hash) pruefe((await antwort.text()).includes(`id="${ziel.hash.slice(1)}"`), `Gerüst: die Sprungmarke in „${href}“ gibt es nicht`);
  }
  const menue = fs.readFileSync(path.join(WURZEL, "mathematik/mss13/01-wahrscheinlichkeitsrechnung/index.html"), "utf8");
  const karte = menue.match(/<a class="menu-card"[^>]*href="06-normalverteilung\/index\.html"[^>]*>([\s\S]*?)<\/a>/);
  pruefe(!!karte && /\bhidden\b/.test(karte[0]) && /data-section="mss13"/.test(karte[0]) && /<h2>6 Normalverteilung<\/h2>/.test(karte[1]), "Gerüst: die Menükarte fehlt oder ist unvollständig");
  // Formelsammlung: Verweis, zwei Seiten im Querformat, die Formeln in der Quelle.
  const verweis = await page.evaluate(() => { const a = document.querySelector("#sec-formelsammlung a[download]"); return a && a.getAttribute("href"); });
  pruefe(verweis === "formelsammlung.pdf", `Formelsammlung: der Verweis zeigt auf „${verweis}“`);
  const pdf = path.join(WURZEL, ORDNER, "formelsammlung.pdf");
  pruefe(fs.existsSync(pdf), "Formelsammlung: formelsammlung.pdf fehlt");
  if (fs.existsSync(pdf)) {
    const roh = fs.readFileSync(pdf).toString("latin1");
    pruefe((roh.match(/\/Type\s*\/Page(?!s)/g) || []).length === 2, "Formelsammlung: nicht genau zwei Seiten");
    const box = roh.match(/\/MediaBox\s*\[\s*0 0 ([\d.]+) ([\d.]+)/);
    pruefe(!!box && Number(box[1]) > Number(box[2]), "Formelsammlung: nicht im Querformat");
  }
  const quelle = fs.readFileSync(path.join(WURZEL, "tools/formelsammlung/formelsammlung-nv-quelle.html"), "utf8").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/\s+/g, " ");
  for (const f of ["Φ((k + 0,5 − μ) : σ)", "1 − Φ((k − 0,5 − μ) : σ)", "Φ((b + 0,5 − μ) : σ) − Φ((a − 0,5 − μ) : σ)", "Φ(−z) = 1 − Φ(z)", "σ > 3", "c = μ + z · σ", "Keine Stetigkeitskorrektur"]) {
    pruefe(quelle.includes(f), `Formelsammlung: „${f}“ fehlt in der Quelle des PDFs`);
  }
}

// ════════════════ Ablauf ════════════════

async function teil(name, fn, page) {
  if (!will(name)) return;
  try { await fn(page); } catch (e) { pruefe(false, `${name}: Abbruch — ${String(e && e.message).split("\n")[0]}`); }
}

(async () => {
  const browser = await starteBrowser();
  for (const dunkel of [false, true]) {
    const wo = dunkel ? "dunkel" : "hell";
    const page = await neueSeite(browser, { dunkel });
    await oeffne(page, SEITE);
    if (!dunkel) {
      await teil("geruest", geruest, page);
      await teil("wachsen", wachsen, page);
      await teil("standardisieren", standardisieren, page);
      await teil("glocke", glocke, page);
      await teil("lokal", lokal, page);
      await teil("global", global, page);
      await teil("normal", normal, page);
      await teil("umkehr", umkehr, page);
      await teil("quizze", quizze, page);
      await teil("selbsteinschaetzung", selbsteinschaetzung, page);
      await teil("aufgaben", aufgaben, page);
    } else if (will("dunkel")) {
      await waehle(page, "nv-regeln", true);
      await pruefeKontrast(page, bericht, "dunkel");
      await pruefeStrichKontrast(page, bericht, "dunkel, Kurven und Grenzen", ".bk-kurve, .nv-grenze, .nv-c, .bk-mu, .nv-nullachse");
    }
    await pruefeNotation(page, bericht, wo);
    for (const s of page.stoerungen) pruefe(false, `${wo}: ${s}`);
    await page.close();
  }
  await browser.close();
  bericht.abschluss();
})();
