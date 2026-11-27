// Fachliche Prüfung: Physik, Klasse 8, Thema 1 „Thermische Ausdehnung“.
//
// Nachgerechnet wird mit eigenen Formeln und Konstanten, die Zeichnungen werden aus dem SVG
// zurückgelesen (Maßstab aus Gitterlinien data-wert und Achsenmarken data-wert-x):
//
//   1. TEILCHEN: Gitterplätze regelmäßig; Auslenkung warm : kalt = v̄(warm) : v̄(kalt) mit
//      v̄ = √(8 k T / (π m)) aus Boltzmann-Konstante und Molekülmasse; Flüssigkeit und Gas bewegen sich
//      im selben Verhältnis schneller; Gas weit, Flüssigkeit dicht; Abspielen bewegt die Zeit.
//   2. ÜBERGÄNGE: Erwärmungskurve aus der eigenen Energiebilanz; Punkt, Anteile, Bilanz.
//   3. BINDUNG: Mulde, Umkehrpunkte durch Bisektion, Mitte wandert nach außen, Trennung bei W ≥ 1.
//   4. FEST: ΔL = α · L0 · ΔT, gezeichnete Verlängerung genau 100-fach; Tabelle = Regler.
//   5. FLÜSSIG: ΔV = γ · V0 · ΔT, Säule an der Skala; Tabelle = Regler.
//   6.–8. GASGESETZE: Gashöhen und Manometer proportional, Geraden durch den absoluten Nullpunkt,
//      Hyperbel und gleich große Rechtecke, Bilanzen.
//   9. GASGLEICHUNG: Weg in zwei Schritten, Zwischenzustand, p · V : T unterwegs konstant.
//   Dazu die Kontrollfragen, alle Aufgaben mit ihren Fehlern, das Gerüst, die Formelsammlung und der
//   Dunkelmodus.

"use strict";

const { neuerBericht } = require("../lib/pruefen");
const { starteBrowser, neueSeite, oeffne, setzeRegler, text } = require("../lib/seite");
const { pruefeNotation } = require("../lib/notation");
const { pruefeKontrast, pruefeStrichKontrast } = require("../lib/kontrast");
const { pruefeAufgabe, zahl } = require("../lib/aufgaben");
const fs = require("fs");
const path = require("path");

const bericht = neuerBericht();
const { pruefe } = bericht;
const SEITE = "/physik/klasse-8/thermische-ausdehnung.html";
const WURZEL = path.resolve(__dirname, "..", "..");
const NUR = (process.env.UPLANT_NUR || "").split(",").map((t) => t.trim()).filter(Boolean);
const will = (t) => NUR.length === 0 || NUR.includes(t);
const nahe = (a, b, eps) => Math.abs(a - b) <= eps;
const z = (s) => Number(String(s).replace(/−/g, "-").replace(/\.(?=\d{3}\b)/g, "").replace(",", "."));
const r2 = (x) => Math.round(x * 100) / 100;
// Eine angezeigte Zahl mit `stellen` Nachkommastellen trifft den nachgerechneten Wert.
const trifft = (t, soll, stellen) => t !== null && t !== undefined && nahe(z(t), soll, 0.5 * 10 ** -stellen + 1e-9);

// ---------- eigene Physik ----------
const KB = 1.380649e-23, U = 1.66053906660e-27, M_H2O = 18.015 * U;
const NULL_K = 273.15;
const vMittel = (thetaC) => Math.sqrt((8 * KB * (thetaC + NULL_K)) / (Math.PI * M_H2O));
// Tabellenwerte, wie sie im Lehrbuch stehen — gegen die Seite gehalten, nicht von ihr übernommen.
const ALPHA = { Aluminium: 0.023, Kupfer: 0.017, Stahl: 0.012, Beton: 0.012, Glas: 0.009 };
const GAMMA = { Ethanol: 1.1, Benzin: 1.0, Glycerin: 0.5, Wasser: 0.21, Quecksilber: 0.18 };
// Erwärmung von 1 kg Eis bei −20 °C: Energie Schritt für Schritt aufgebraucht.
function erwaermung(Q) {
  let rest = Q;
  const schritte = [["eis", 2.1 * 20], ["schmelzen", 334], ["wasser", 4.19 * 100], ["verdampfen", 2256], ["dampf", 2.0 * 20]];
  let theta = -20;
  for (const [art, bedarf] of schritte) {
    const teil = Math.min(rest, bedarf);
    const anteil = teil / bedarf;
    if (art === "eis") theta = -20 + 20 * anteil;
    if (art === "wasser") theta = 100 * anteil;
    if (art === "dampf") theta = 100 + 20 * anteil;
    if (rest <= bedarf + 1e-12) {
      const a = { eis: 0, wasser: 0, dampf: 0 };
      if (art === "eis") a.eis = 1;
      if (art === "schmelzen") { a.eis = 1 - anteil; a.wasser = anteil; }
      if (art === "wasser") a.wasser = 1;
      if (art === "verdampfen") { a.wasser = 1 - anteil; a.dampf = anteil; theta = 100; }
      if (art === "dampf") a.dampf = 1;
      if (art === "schmelzen") theta = 0;
      return { theta, ...a, art };
    }
    rest -= bedarf;
  }
  return { theta, eis: 0, wasser: 0, dampf: 1, art: "dampf" };
}
// Energiemulde (Modell der Seite) und ihre Umkehrpunkte — durch Bisektion, nicht über die Formel.
const mulde = (r) => (1 - Math.exp(-3 * (r - 1))) ** 2 - 1;
function nullstelle(f, a, b) {
  let fa = f(a);
  for (let i = 0; i < 200; i++) { const m = (a + b) / 2, fm = f(m); if ((fm > 0) === (fa > 0)) { a = m; fa = fm; } else b = m; }
  return (a + b) / 2;
}

// ---------- SVG lesen ----------
async function lies(page, sel) {
  return page.evaluate((s) => {
    const wurzel = document.querySelector(s);
    if (!wurzel) return null;
    const zahlen = (d) => (d.match(/-?\d+(\.\d+)?/g) || []).map(Number);
    const r = (e) => e.dataset.rolle;
    return {
      gitter: [...wurzel.querySelectorAll("line[data-wert]")].map((l) => ({ wert: Number(l.dataset.wert), y: Number(l.getAttribute("y1")) })),
      marken: [...wurzel.querySelectorAll("line[data-wert-x]")].map((l) => ({ wert: Number(l.dataset.wertX), x: Number(l.getAttribute("x1")) })),
      pfade: [...wurzel.querySelectorAll("path[data-rolle]")].map((p) => ({ rolle: r(p), z: zahlen(p.getAttribute("d")) })),
      punkte: [...wurzel.querySelectorAll("circle[data-rolle]")].map((c) => ({ rolle: r(c), x: Number(c.getAttribute("cx")), y: Number(c.getAttribute("cy")) })),
      linien: [...wurzel.querySelectorAll("line[data-rolle]")].map((l) => ({ rolle: r(l), x1: Number(l.getAttribute("x1")), x2: Number(l.getAttribute("x2")), y1: Number(l.getAttribute("y1")), y2: Number(l.getAttribute("y2")) })),
      rects: [...wurzel.querySelectorAll("rect[data-rolle]")].map((e) => ({ rolle: r(e), x: Number(e.getAttribute("x")), y: Number(e.getAttribute("y")), b: Number(e.getAttribute("width")), h: Number(e.getAttribute("height")), px: Number(e.dataset.hoehePx), stoff: e.dataset.stoff })),
    };
  }, sel);
}
// Maßstab aus zwei Achsenmarken und zwei Gitterlinien.
function welt(s) {
  const m = [...s.marken].sort((a, b) => a.wert - b.wert), g = [...s.gitter].sort((a, b) => a.wert - b.wert);
  const a = m[0], b = m[m.length - 1], c = g[0], d = g[g.length - 1];
  const sx = (b.x - a.x) / (b.wert - a.wert), sy = (c.y - d.y) / (d.wert - c.wert);
  return { sx, sy, X: (px) => a.wert + (px - a.x) / sx, Y: (py) => c.wert + (c.y - py) / sy };
}
const pfad = (s, w, rolle) => { const p = s.pfade.find((x) => x.rolle === rolle); if (!p) return []; const o = []; for (let i = 0; i + 1 < p.z.length; i += 2) o.push([w.X(p.z[i]), w.Y(p.z[i + 1])]); return o; };
const pkt = (s, w, rolle) => s.punkte.filter((x) => x.rolle === rolle).map((x) => [w.X(x.x), w.Y(x.y)]);
const rolle = (page, sel, r) => page.evaluate(([s, x]) => { const e = document.querySelector(`${s} [data-rolle="${x}"]`); return e ? e.textContent : null; }, [sel, r]);
async function waehle(page, id, wert) {
  await page.evaluate(([i, w]) => { const e = document.getElementById(i); e.value = String(w); e.dispatchEvent(new Event(e.tagName === "SELECT" ? "change" : "input")); }, [id, wert]);
}

// ════════════════ 1. Teilchenmodell ════════════════

async function teilchen(page) {
  const ZUST = { fest: [-150, -5], fluessig: [5, 95], gas: [110, 400] };
  async function felder(t) {
    await setzeRegler(page, "tc-t", t);
    return page.evaluate(() => [...document.querySelectorAll("#tc-mount g[data-zustand]")].map((g) => ({
      zustand: g.dataset.zustand, theta: Number(g.dataset.theta),
      t: [...g.querySelectorAll("circle.ta-teilchen")].map((c) => ({ i: Number(c.dataset.i), x: Number(c.getAttribute("cx")), y: Number(c.getAttribute("cy")), gx: Number(c.dataset.gx), gy: Number(c.dataset.gy) })),
    })));
  }
  const vorher = await felder(37), nachher = await felder(38), spaeter = await felder(211);
  pruefe(vorher.length === 6, `Teilchen: ${vorher.length} Felder statt 6`);
  for (const [k, [t1, t2]] of Object.entries(ZUST)) {
    const f = vMittel(t2) / vMittel(t1);
    const fk = (feld, th) => feld.find((x) => x.zustand === k && x.theta === th);
    pruefe(!!fk(vorher, t1) && !!fk(vorher, t2), `Teilchen ${k}: die Temperaturen ${t1} °C und ${t2} °C fehlen`);
    if (!fk(vorher, t1) || !fk(vorher, t2)) continue;
    if (k !== "gas") {
      // Fest und flüssig: Auslenkung aus dem Platz, warm f-mal so weit (bei gleichem Takt also f-mal so schnell).
      for (const feld of [vorher, spaeter]) {
        const a = fk(feld, t1).t, b = fk(feld, t2).t;
        const xs = [...new Set(a.map((q) => q.gx))].sort((p, q) => p - q), ys = [...new Set(a.map((q) => q.gy))].sort((p, q) => p - q);
        const abst = xs.slice(1).map((x, i) => x - xs[i]).concat(ys.slice(1).map((y, i) => y - ys[i]));
        if (k === "fest") pruefe(xs.length * ys.length === a.length && abst.every((d) => nahe(d, abst[0], 1e-9)), "Teilchen fest: die Gitterplätze bilden kein regelmäßiges Gitter");
        const falsch = a.filter((q) => { const w = b.find((x) => x.i === q.i); return !w || w.gx !== q.gx || !nahe(w.x - w.gx, f * (q.x - q.gx), 2e-3) || !nahe(w.y - w.gy, f * (q.y - q.gy), 2e-3); });
        pruefe(falsch.length === 0, `Teilchen ${k}: bei ${falsch.length} Teilchen ist die Auslenkung warm nicht ${f.toFixed(4)}-mal die Auslenkung kalt`);
        const maxAus = Math.max(...a.map((q) => Math.hypot(q.x - q.gx, q.y - q.gy)), ...b.map((q) => Math.hypot(q.x - q.gx, q.y - q.gy)));
        if (k === "fest") pruefe(maxAus < 15 - 8, `Teilchen fest: Auslenkung ${maxAus.toFixed(2)} — Nachbarn würden sich berühren`);
      }
    } else {
      const da = fk(vorher, t1).t.map((q) => { const n = fk(nachher, t1).t.find((x) => x.i === q.i); return { i: q.i, d: Math.hypot(n.x - q.x, n.y - q.y), q }; });
      const db = fk(vorher, t2).t.map((q) => { const n = fk(nachher, t2).t.find((x) => x.i === q.i); return { i: q.i, d: Math.hypot(n.x - q.x, n.y - q.y), q }; });
      // An einer Wand wird die Bewegung gespiegelt — dort taugt der Schritt nicht als Maß.
      const frei = (q) => k !== "gas" || (q.x > 14 && q.x < 196 && q.y > 14 && q.y < 126);
      const paare = da.filter((x) => frei(x.q)).map((x) => [x, db.find((y) => y.i === x.i)]).filter(([a, y]) => y && frei(y.q) && a.d > 1e-3);
      const ratios = paare.map(([x, y]) => y.d / x.d).sort((p, q) => p - q);
      const median = ratios[Math.floor(ratios.length / 2)];
      pruefe(paare.length >= 3 && nahe(median, f, 2e-3),
        `Teilchen ${k}: warm bewegen sich die Teilchen ${median && median.toFixed(4)}-mal so schnell, nachgerechnet ${f.toFixed(4)}`);
    }
  }
  // Dichte: mittlerer Abstand zum nächsten Nachbarn — Gas weit, Flüssigkeit dicht wie das Gitter.
  const nn = (pts) => pts.reduce((s, p) => s + Math.min(...pts.filter((q) => q !== p).map((q) => Math.hypot(q.x - p.x, q.y - p.y))), 0) / pts.length;
  const nnF = nn(vorher.find((x) => x.zustand === "fest").t), nnL = nn(vorher.find((x) => x.zustand === "fluessig").t), nnG = nn(vorher.find((x) => x.zustand === "gas").t);
  pruefe(nnL < 1.4 * nnF && nnG > 1.5 * nnL, `Teilchen: Abstände fest ${nnF.toFixed(1)}, flüssig ${nnL.toFixed(1)}, gas ${nnG.toFixed(1)} — Gas ist nicht weit, Flüssigkeit nicht dicht`);
  // Bilanz: mittlere Geschwindigkeiten in m/s und ihr Verhältnis.
  for (const [k, [t1, t2]] of Object.entries(ZUST)) {
    pruefe(trifft(await rolle(page, "#tc-bilanz", `v-${k}-0`), vMittel(t1), 0) && trifft(await rolle(page, "#tc-bilanz", `v-${k}-1`), vMittel(t2), 0)
      && trifft(await rolle(page, "#tc-bilanz", `faktor-${k}`), vMittel(t2) / vMittel(t1), 2), `Teilchen ${k}: die Geschwindigkeiten in der Bilanz stimmen nicht`);
  }
  // Abspielen bewegt die Zeit, Anhalten hält sie an.
  await setzeRegler(page, "tc-t", 0);
  await page.click("#tc-play");
  await page.waitForTimeout(400);
  await page.click("#tc-play");
  const t1 = Number(await page.inputValue("#tc-t"));
  await page.waitForTimeout(250);
  const t2 = Number(await page.inputValue("#tc-t"));
  pruefe(t1 > 0 && t1 === t2, `Teilchen: Abspielen und Anhalten wirken nicht (Zeit ${t1} → ${t2})`);
}

// ════════════════ 2. Übergänge ════════════════

async function uebergaenge(page) {
  const knick = [[0, -20], [42, 0], [376, 0], [795, 100], [3051, 100], [3091, 120]];
  for (const Q of [0, 21, 42, 200, 376, 500, 795, 1500, 3051, 3071, 3091]) {
    const q = await setzeRegler(page, "ue-q", Q);
    const s = erwaermung(q), wo = `Übergänge Q = ${q}`;
    const sv = await lies(page, '#ue-mount g[data-diagramm="kurve"]'), w = welt(sv);
    const ganz = pfad(sv, w, "ganze-kurve");
    pruefe(ganz.length === knick.length && ganz.every(([x, y], i) => nahe(x, knick[i][0], 0.5) && nahe(y, knick[i][1], 0.05)), `${wo}: die Erwärmungskurve hat andere Knicke`);
    const weg = pfad(sv, w, "weg");
    const ende = weg[weg.length - 1];
    pruefe(!!ende && nahe(ende[0], q, 0.5) && nahe(ende[1], s.theta, 0.05), `${wo}: der Weg endet nicht bei (${q} | ${s.theta.toFixed(2)})`);
    pruefe(weg.every(([x, y]) => nahe(y, erwaermung(x).theta, 0.06)), `${wo}: der Weg verlässt die Kurve`);
    const [jetzt] = pkt(sv, w, "jetzt");
    pruefe(!!jetzt && nahe(jetzt[0], q, 0.5) && nahe(jetzt[1], s.theta, 0.05), `${wo}: der Punkt steht falsch`);
    const anteile = await page.evaluate(() => {
      const rahmen = document.querySelector('#ue-mount [data-rolle="anteil-rahmen"]');
      return { b: Number(rahmen.getAttribute("width")), teile: [...document.querySelectorAll('#ue-mount [data-rolle="anteil"]')].map((r) => [r.dataset.stoff, Number(r.getAttribute("width"))]) };
    });
    const soll = { Eis: s.eis, Wasser: s.wasser, Dampf: s.dampf };
    pruefe(Object.entries(soll).every(([n, a]) => nahe((anteile.teile.find(([m]) => m === n) || [0, 0])[1] / anteile.b, a, 1e-3)), `${wo}: der Anteilsbalken stimmt nicht`);
    pruefe(trifft(await rolle(page, "#ue-bilanz", "theta"), s.theta, 1) && trifft(await rolle(page, "#ue-bilanz", "eis"), 100 * s.eis, 1)
      && trifft(await rolle(page, "#ue-bilanz", "wasser"), 100 * s.wasser, 1) && trifft(await rolle(page, "#ue-bilanz", "dampf"), 100 * s.dampf, 1), `${wo}: die Bilanz stimmt nicht`);
    const plateau = s.art === "schmelzen" || s.art === "verdampfen";
    pruefe(/bleibt bei/.test(await text(page, "#ue-text")) === plateau, `${wo}: der Text beurteilt das Plateau falsch`);
  }
  // Die Zahlen im Beispiel-Kasten.
  const b = await page.evaluate(() => document.querySelector("#sec-uebergaenge .beispiel-box").innerText);
  for (const [txt, w] of [["−20 °C auf 0 °C: ", 2.1 * 20], ["Schmelzen: ", 334], ["0 °C auf 100 °C: ", 4.19 * 100], ["Verdampfen: ", 2256], ["100 °C auf 120 °C: ", 2.0 * 20]]) {
    pruefe(b.includes(`${txt}${String(Math.round(w))} kJ`), `Übergänge: „${txt}${Math.round(w)} kJ“ fehlt im Beispiel`);
  }
  pruefe(2256 / 419 > 5 && 2256 / 419 < 6 && b.includes("mehr als fünfmal"), "Übergänge: „mehr als fünfmal“ stimmt nicht");
}

// ════════════════ 3. Bindungsenergie ════════════════

async function bindung(page) {
  let mitteVorher = 1;
  for (const W of [0, 0.1, 0.4, 0.7, 0.99, 1, 1.2]) {
    const w0 = await setzeRegler(page, "bi-w", W);
    const wo = `Bindung W = ${w0}`, E = w0 - 1;
    const sv = await lies(page, '#bi-mount g[data-diagramm="mulde"]'), w = welt(sv);
    const kurve = pfad(sv, w, "mulde");
    pruefe(kurve.length > 50 && kurve.every(([x, y]) => nahe(y, mulde(x), 2e-3)), `${wo}: die Energiemulde ist falsch gezeichnet`);
    const tief = kurve.reduce((a, b) => (b[1] < a[1] ? b : a));
    pruefe(nahe(tief[0], 1, 0.02) && nahe(tief[1], -1, 2e-3), `${wo}: der tiefste Punkt liegt nicht bei (1 | −1)`);
    const r1 = w0 > 0 ? nullstelle((r) => mulde(r) - E, 0.5, 1) : 1;
    const r2 = w0 === 0 ? 1 : w0 < 1 ? nullstelle((r) => mulde(r) - E, 1, 60) : Infinity;
    const umkehr = pkt(sv, w, "umkehr").sort((a, b) => a[0] - b[0]);
    pruefe(umkehr.length >= 1 && nahe(umkehr[0][0], r1, 3e-3) && umkehr.every(([, y]) => nahe(y, E, 3e-3)), `${wo}: der innere Umkehrpunkt steht nicht bei r = ${r1.toFixed(4)}`);
    if (w0 > 0 && w0 < 1 && r2 <= 3) pruefe(umkehr.length === 2 && nahe(umkehr[1][0], r2, 3e-3), `${wo}: der äußere Umkehrpunkt steht nicht bei r = ${r2.toFixed(4)}`);
    const e = sv.linien.find((l) => l.rolle === "energie");
    pruefe(!!e && nahe(w.Y(e.y1), E, 3e-3) && nahe(w.X(e.x1), r1, 3e-3) && nahe(w.X(e.x2), Math.min(r2, 3), 3e-3), `${wo}: die Energielinie reicht nicht von r₁ bis r₂`);
    const eb = sv.linien.find((l) => l.rolle === "eb");
    pruefe(!!eb && nahe(Math.abs(w.Y(eb.y1) - w.Y(eb.y2)), 1, 3e-3), `${wo}: der Pfeil der Bindungsenergie ist nicht so lang wie die Mulde tief`);
    if (w0 > 0 && w0 < 1) {
      const m = (r1 + r2) / 2;
      const mi = sv.linien.find((l) => l.rolle === "mitte");
      pruefe(!!mi && nahe(w.X(mi.x1), m, 3e-3), `${wo}: die Mitte steht nicht bei ${m.toFixed(4)}`);
      pruefe(m > mitteVorher, `${wo}: die Mitte wandert nicht nach außen (${mitteVorher.toFixed(4)} → ${m.toFixed(4)})`);
      mitteVorher = m;
      const B_ = (r) => rolle(page, "#bi-bilanz", r);
      pruefe(trifft(await B_("r1"), r1, 3) && trifft(await B_("r2"), r2, 3) && trifft(await B_("mitte"), m, 3) && trifft(await B_("prozent"), (m - 1) * 100, 1) && trifft(await B_("fehlt"), 1 - w0, 2), `${wo}: die Bilanz stimmt nicht`);
    }
    if (w0 >= 1) pruefe(/kehrt nicht mehr um/.test(await text(page, "#bi-text")) && /entfernt sich/.test(await text(page, "#bi-bilanz")), `${wo}: die Trennung wird nicht genannt`);
  }
  const ach = await page.evaluate(() => document.querySelector("#sec-bindung .achtung-box").innerText);
  pruefe(ach.includes("1,2 Tausendstel") && nahe(ALPHA.Stahl * 100 / 1000, 0.0012, 1e-12), "Bindung: „1,2 Tausendstel“ für Stahl bei 100 K stimmt nicht");
}

// ════════════════ 4. Feste Körper ════════════════

async function tabelle(page, sec) {
  return page.evaluate((s) => {
    const t = document.querySelector(`#${s} .wissen-box table.ta-tabelle`);
    const z = [...t.querySelectorAll("tr")].map((tr) => [...tr.children].map((c) => c.innerText.trim()));
    return z[0].slice(1).map((n, i) => [n, z[1][i + 1]]);
  }, sec);
}
async function fest(page) {
  const tab = await tabelle(page, "sec-fest");
  for (const [n, a] of tab) pruefe(nahe(z(a), ALPHA[n], 1e-12), `Fest: Tabelle nennt für ${n} α = ${a}`);
  for (const [stoff, L0, dT] of [["stahl", 30, 40], ["aluminium", 200, 80], ["kupfer", 1, 1], ["beton", 123, 57], ["glas", 50, 0]]) {
    await waehle(page, "fe-stoff", stoff);
    const l = await setzeRegler(page, "fe-l", L0), t = await setzeRegler(page, "fe-dt", dT);
    const name = stoff[0].toUpperCase() + stoff.slice(1), a = ALPHA[name], dL = a * l * t, wo = `Fest ${name} ${l} m, ${t} K`;
    const sv = await lies(page, "#fe-mount");
    const alt = sv.rects.find((r) => r.rolle === "stab-alt"), neu = sv.rects.find((r) => r.rolle === "stab-neu");
    const faktor = Number(((await rolle(page, "#fe-mount", "ueberhoehung")) || "").match(/(\d+)-fach/)?.[1]);
    pruefe(faktor === 100 && nahe(neu.b / alt.b - 1, (faktor * dL) / (1000 * l), 1e-5), `${wo}: die gezeichnete Verlängerung ist nicht ${faktor}-fach`);
    pruefe(trifft(await rolle(page, "#fe-bilanz", "dl"), dL, 3) && trifft(await rolle(page, "#fe-bilanz", "l"), l + dL / 1000, 6), `${wo}: die Bilanz stimmt nicht`);
  }
  const b = await page.evaluate(() => document.querySelector("#sec-fest .beispiel-box").innerText);
  pruefe(b.includes(`= ${(0.012 * 30 * 40).toFixed(1).replace(".", ",")} mm`) && b.includes(`${(30 + 0.012 * 30 * 40 / 1000).toFixed(4).replace(".", ",")} m`), "Fest: das Beispiel der Stahlschiene rechnet falsch");
}

// ════════════════ 5. Flüssigkeiten ════════════════

async function fluessig(page) {
  const tab = await tabelle(page, "sec-fluessig");
  for (const [n, g] of tab) pruefe(nahe(z(g), GAMMA[n.split(" ")[0]], 1e-12), `Flüssig: Tabelle nennt für ${n} γ = ${g}`);
  for (const [stoff, V0, A, dT] of [["ethanol", 0.5, 0.2, 10], ["ethanol", 1, 0.1, 20], ["quecksilber", 0.3, 0.45, 7], ["wasser", 0.8, 0.25, 0], ["glycerin", 0.1, 0.5, 13]]) {
    await waehle(page, "fl-stoff", stoff);
    const v = await setzeRegler(page, "fl-v", V0), a = await setzeRegler(page, "fl-a", A), t = await setzeRegler(page, "fl-dt", dT);
    const g = GAMMA[stoff[0].toUpperCase() + stoff.slice(1)], dV = g * v * t, h = dV / a, wo = `Flüssig ${stoff} ${v} ml, ${a} mm², ${t} K`;
    const sk = await page.evaluate(() => [...document.querySelectorAll('#fl-mount line[data-wert]')].map((l) => [Number(l.dataset.wert), Number(l.getAttribute("y1"))]));
    const proMm = (sk[0][1] - sk[sk.length - 1][1]) / (sk[sk.length - 1][0] - sk[0][0]);
    const nullY = sk.find(([wert]) => wert === 0)[1];
    const saeule = (await lies(page, "#fl-mount")).rects.find((r) => r.rolle === "saeule");
    pruefe(!!saeule && nahe((nullY - saeule.y) / proMm, h, 0.01), `${wo}: die Säule steigt nicht um ${h.toFixed(3)} mm`);
    pruefe(trifft(await rolle(page, "#fl-bilanz", "dv"), dV, 3) && trifft(await rolle(page, "#fl-bilanz", "h"), h, 2) && trifft(await rolle(page, "#fl-bilanz", "je-k"), (g * v) / a, 3), `${wo}: die Bilanz stimmt nicht`);
  }
  const b = await page.evaluate(() => document.querySelector("#sec-fluessig .beispiel-box").innerText);
  pruefe(b.includes("= 5,5 mm³") && nahe(1.1 * 0.5 * 10, 5.5, 1e-9) && b.includes("= 27,5 mm") && nahe(5.5 / 0.2, 27.5, 1e-9) && b.includes("2,75 mm je Kelvin"), "Flüssig: das Beispiel rechnet falsch");
}

// ════════════════ 6.–8. Gasgesetze ════════════════

async function gaylussac(page) {
  const h0 = await (async () => { await setzeRegler(page, "gl-theta", 0); return (await lies(page, "#gl-mount")).rects.find((r) => r.rolle === "gas").px; })();
  for (const th of [-100, -50, 0, 25, 100, 200]) {
    const t = await setzeRegler(page, "gl-theta", th);
    const T = t + NULL_K, V = T / NULL_K, wo = `Gay-Lussac ${t} °C`;
    const ganz = await lies(page, "#gl-mount"), sv = await lies(page, '#gl-mount g[data-diagramm="gay-lussac"]'), w = welt(sv);
    pruefe(nahe(ganz.rects.find((r) => r.rolle === "gas").px / h0, V, 1e-4), `${wo}: die Gashöhe wächst nicht proportional zu T`);
    const vl = pfad(sv, w, "verlaengert"), gm = pfad(sv, w, "gemessen");
    pruefe(nahe(vl[0][0], -NULL_K, 0.3) && nahe(vl[0][1], 0, 2e-3), `${wo}: die Verlängerung trifft V = 0 nicht bei −273,15 °C`);
    pruefe([...vl, ...gm].every(([x, y]) => nahe(y, (x + NULL_K) / NULL_K, 3e-3)), `${wo}: die Gerade ist nicht V = V₀ · T : 273,15 K`);
    const [p] = pkt(sv, w, "jetzt");
    pruefe(!!p && nahe(p[0], t, 0.3) && nahe(p[1], V, 3e-3), `${wo}: der Punkt steht falsch`);
    pruefe(trifft(await rolle(page, "#gl-bilanz", "t"), T, 2) && trifft(await rolle(page, "#gl-bilanz", "v"), V, 4) && trifft(await rolle(page, "#gl-bilanz", "v-durch-t"), 1 / NULL_K, 6), `${wo}: die Bilanz stimmt nicht`);
  }
  const s6 = await page.evaluate(() => document.getElementById("sec-gay-lussac").innerText);
  pruefe(s6.includes("≈ 3,31 l") && nahe(3.0 * 323.15 / 293.15, 3.31, 0.005) && s6.includes("≈ 1,07") && nahe(313.15 / 293.15, 1.07, 0.005), "Gay-Lussac: Beispiel oder Achtung-Kasten rechnet falsch");
}
async function boyle(page) {
  const hVon = async (v) => { await setzeRegler(page, "bm-v", v); return (await lies(page, "#bm-mount")).rects.find((r) => r.rolle === "gas").px; };
  const h2 = await hVon(2);
  for (const V0 of [0.5, 1, 2, 3.3, 4]) {
    const V = r2(await setzeRegler(page, "bm-v", V0)), p = 2 / V, wo = `Boyle-Mariotte V = ${V} l`;
    const ganz = await lies(page, "#bm-mount"), sv = await lies(page, '#bm-mount g[data-diagramm="boyle"]'), w = welt(sv);
    pruefe(nahe(ganz.rects.find((r) => r.rolle === "gas").px / h2, V / 2, 1e-4), `${wo}: die Gashöhe ist nicht proportional zu V`);
    const hyp = pfad(sv, w, "hyperbel");
    pruefe(hyp.length > 50 && hyp.every(([x, y]) => nahe(x * y, 2, 0.02)), `${wo}: die Hyperbel ist nicht p · V = 2 bar · l`);
    for (const [r, vv, pp] of [["rechteck", V, p], ["rechteck-anfang", 2, 1]]) {
      const e = sv.rects.find((q) => q.rolle === r);
      pruefe(!!e && nahe(e.b / w.sx, vv, 3e-3) && nahe(e.h / w.sy, pp, 3e-3) && nahe(w.Y(e.y + e.h), 0, 3e-3), `${wo}: das Rechteck ${r} ist nicht ${vv} × ${pp.toFixed(3)}`);
    }
    const [q] = pkt(sv, w, "jetzt");
    pruefe(!!q && nahe(q[0], V, 3e-3) && nahe(q[1], p, 3e-3), `${wo}: der Punkt steht falsch`);
    pruefe(trifft(await rolle(page, "#bm-bilanz", "p"), p, 4) && trifft(await rolle(page, "#bm-bilanz", "pv"), 2, 4), `${wo}: die Bilanz stimmt nicht`);
  }
  const s7 = await page.evaluate(() => document.querySelector("#sec-boyle .beispiel-box").innerText);
  pruefe(s7.includes("= 4,0 bar") && nahe(1.0 * 2.0 / 0.5, 4, 1e-12), "Boyle-Mariotte: das Beispiel rechnet falsch");
}
async function amontons(page) {
  for (const th of [-50, 0, 20, 100, 250]) {
    const t = await setzeRegler(page, "am-theta", th);
    const T = t + NULL_K, p = T / (20 + NULL_K), wo = `Amontons ${t} °C`;
    const ganz = await lies(page, "#am-mount"), sv = await lies(page, '#am-mount g[data-diagramm="amontons"]'), w = welt(sv);
    pruefe(nahe(ganz.rects.find((r) => r.rolle === "manometer").px, 100 * p, 1e-2), `${wo}: das Manometer zeigt nicht ${p.toFixed(4)} bar`);
    const vl = pfad(sv, w, "verlaengert"), gm = pfad(sv, w, "gemessen");
    pruefe(nahe(vl[0][0], 0, 0.3) && nahe(vl[0][1], 0, 2e-3) && [...vl, ...gm].every(([x, y]) => nahe(y, x / (20 + NULL_K), 3e-3)), `${wo}: die Gerade geht nicht durch 0 K oder ist nicht p ~ T`);
    const [q] = pkt(sv, w, "jetzt");
    pruefe(!!q && nahe(q[0], T, 0.3) && nahe(q[1], p, 3e-3), `${wo}: der Punkt steht falsch`);
    pruefe(trifft(await rolle(page, "#am-bilanz", "t"), T, 2) && trifft(await rolle(page, "#am-bilanz", "p"), p, 4) && trifft(await rolle(page, "#am-bilanz", "p-durch-t"), 1 / (20 + NULL_K), 6), `${wo}: die Bilanz stimmt nicht`);
  }
  const s8 = await page.evaluate(() => document.querySelector("#sec-amontons .beispiel-box").innerText);
  pruefe(s8.includes("≈ 3,41 bar") && nahe(3 * 333.15 / 293.15, 3.41, 0.005), "Amontons: das Beispiel rechnet falsch");
}

// ════════════════ 9. Allgemeine Gasgleichung ════════════════

async function gasgleichung(page) {
  const p1 = 1, V1 = 2, T1 = 20 + NULL_K, k1 = (p1 * V1) / T1;
  for (const [V2w, th2w] of [[1.5, 80], [1, 120], [3, -20], [2.5, 20]]) {
    const V2 = r2(await setzeRegler(page, "gg-v2", V2w)), th2 = await setzeRegler(page, "gg-theta2", th2w), T2 = th2 + NULL_K;
    const pS = (p1 * V1) / V2, p2 = (pS * T2) / T1;
    pruefe(nahe((p2 * V2) / T2, k1, 1e-12), "Gasgleichung: p₂ · V₂ : T₂ ≠ p₁ · V₁ : T₁ — die eigene Rechnung ist falsch");
    for (const s of [0, 50, 100, 150, 200]) {
      const ss = await setzeRegler(page, "gg-s", s), wo = `Gasgleichung V₂ = ${V2}, ϑ₂ = ${th2}, Weg ${ss}`;
      const V = ss <= 100 ? V1 + ((V2 - V1) * ss) / 100 : V2, T = ss <= 100 ? T1 : T1 + ((T2 - T1) * (ss - 100)) / 100, p = (p1 * V1 * T) / (T1 * V);
      const sv = await lies(page, '#gg-mount g[data-diagramm="gasgleichung"]'), w = welt(sv);
      const [jetzt] = pkt(sv, w, "jetzt"), [anfang] = pkt(sv, w, "anfang"), zw = pkt(sv, w, "zwischen");
      pruefe(!!jetzt && nahe(jetzt[0], V, 3e-3) && nahe(jetzt[1], p, 3e-3), `${wo}: der Punkt steht nicht bei (${V.toFixed(3)} | ${p.toFixed(4)})`);
      pruefe(!!anfang && nahe(anfang[0], V1, 3e-3) && nahe(anfang[1], p1, 3e-3), `${wo}: der Anfangspunkt steht falsch`);
      pruefe(ss >= 100 ? zw.length === 1 && nahe(zw[0][0], V2, 3e-3) && nahe(zw[0][1], pS, 3e-3) : zw.length === 0, `${wo}: der Zwischenzustand steht falsch oder zu früh`);
      const weg = pfad(sv, w, "weg");
      const aufT1 = weg.filter(([x, y], i) => i < weg.length - (ss > 100 ? 1 : 0));
      pruefe(weg.length > 2 && nahe(weg[0][0], V1, 3e-3) && aufT1.every(([x, y]) => nahe(x * y, p1 * V1, 0.01)) && nahe(weg[weg.length - 1][0], V, 3e-3) && nahe(weg[weg.length - 1][1], p, 3e-3), `${wo}: der Weg folgt nicht erst der Isotherme T₁ und dann der Senkrechten`);
      const iso2 = pfad(sv, w, "isotherme-2");
      pruefe(iso2.length > 50 && iso2.every(([x, y]) => nahe(x * y, (p1 * V1 * T2) / T1, 0.01)), `${wo}: die Isotherme T₂ stimmt nicht`);
      const B_ = (r) => rolle(page, "#gg-bilanz", r);
      pruefe(trifft(await B_("k1"), k1, 6) && trifft(await B_("k"), k1, 6) && trifft(await B_("p"), p, 4) && trifft(await B_("v"), V, 2) && trifft(await B_("t"), T, 2)
        && trifft(await B_("p-stern"), pS, 4) && trifft(await B_("p2"), p2, 4), `${wo}: die Bilanz stimmt nicht`);
      const aktiv = await page.evaluate(() => [...document.querySelectorAll("#gg-schritte li.aktiv")].map((l) => l.dataset.schritt));
      pruefe(JSON.stringify(aktiv) === JSON.stringify([ss <= 100 ? "1" : "2"]), `${wo}: hervorgehoben ist Schritt ${aktiv.join(", ")}`);
    }
  }
  const s9 = await page.evaluate(() => document.querySelector("#sec-gasgleichung .beispiel-box").innerText);
  const Vb = 4.0 * (1.0 / 0.26) * (223.15 / 288.15);
  pruefe(s9.includes("≈ 11,91 m³") && nahe(Vb, 11.91, 0.005) && Vb / 4 > 2.9 && Vb / 4 < 3, "Gasgleichung: das Wetterballon-Beispiel rechnet falsch");
}

// ════════════════ Kontrollfragen ════════════════

async function quizze(page) {
  const ids = await page.evaluate(() => [...document.querySelectorAll(".quiz[id]")].map((q) => q.id));
  pruefe(ids.length === 9, `Kontrollfragen: ${ids.length} statt 9`);
  const ohne = await page.evaluate(() => [...document.querySelectorAll("main section.card[id]")].filter((s) => s.querySelector(".widget") && !s.querySelector(".quiz")).map((s) => s.id));
  pruefe(ohne.length === 0, `Kontrollfragen: Abschnitte ohne Kontrollfrage — ${ohne.join(", ")}`);
  const zahlIn = (o) => z((o.match(/[\d,]+/) || [""])[0]);
  const RICHTIG = {
    "quiz-teilchen": (o) => /schwingen heftiger/.test(o),
    "quiz-uebergaenge": (o) => /bleibt bei 100 °C/.test(o),
    "quiz-bindung": (o) => /nach außen aber weiter/.test(o),
    "quiz-fest": (o) => nahe(zahlIn(o), 0.023 * 50 * 30, 1e-9) && / mm$/.test(o),
    "quiz-fluessig": (o) => /doppelt so hoch/.test(o),
    "quiz-gay-lussac": (o) => nahe(zahlIn(o), (3 * (127 + NULL_K)) / (27 + NULL_K), 0.05),
    "quiz-boyle": (o) => nahe(zahlIn(o), (1 * 60) / 20, 0.005),
    "quiz-amontons": (o) => nahe(zahlIn(o), (2 * (35 + NULL_K)) / (7 + NULL_K), 0.05) && !/^2,0/.test(o),
    "quiz-gasgleichung": (o) => /vervierfacht/.test(o) && 2 * (600 / 300) === 4,
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
      pruefe(ok === Boolean(RICHTIG[id] && RICHTIG[id](opts[i])), `Kontrollfrage ${id}: „${opts[i]}“ gilt als ${ok ? "richtig" : "falsch"}, nachgerechnet ist es umgekehrt`);
      pruefe(fb.length > 80, `Kontrollfrage ${id}: die Erklärung ist zu knapp`);
    }
    pruefe(richtige === 1, `Kontrollfrage ${id}: ${richtige} richtige Antworten`);
  }
  pruefe(new Set(stellen).size >= 3, `Kontrollfragen: die richtige Antwort steht fast immer an derselben Stelle (${stellen.join(", ")})`);
}

// ════════════════ Übungsaufgaben ════════════════

// Gemessen mit werkzeug-streuung.js (UPLANT_ZUEGE=20): verschieden in 200 Würfen und geschätzte Größe
// des Vorrats — E1 185/200 (n ≈ 1260), E2 22/200 (n ≈ 22), M1 117/200 (n ≈ 168), M2 110/200 (n ≈ 148),
// S1 95/200 (n ≈ 115), S2 147/200 (n ≈ 306), K1 142/200 (n ≈ 273), K2 159/200 (n ≈ 417).
const RUNDEN = 20;
const SCHRANKE = [17, 7, 14, 13, 13, 15, 15, 15];
const TOL = 0.0051;
const FASSUNGEN = new Set();
async function aufgaben(page) {
  const auf = [
    ["E1 Wie viel länger?", (f) => {
      const m = f.match(/Ein Stab aus (\S+) ist bei (−?\d+) °C genau (\d+) m lang\. .*auf (\d+) °C erwärmt\? \(α = ([\d,]+)/);
      if (!m) return null;
      const a = ALPHA[m[1]], t1 = z(m[2]), L0 = Number(m[3]), t2 = Number(m[4]), dT = t2 - t1;
      if (!nahe(z(m[5]), a, 1e-12)) return null;
      return { richtig: r2(a * L0 * dT), toleranz: TOL, falsch: [[a * L0 * t2, "ΔT ist der Temperaturunterschied"], [a * L0, "Verlängerung bei nur 1 K"], [a * dT, "L₀ fehlt"], [(a * L0 * dT) / 1000, "Gefragt ist die Verlängerung in Millimetern"]] };
    }],
    ["E2 Celsius und Kelvin", (f) => {
      let m = f.match(/Rechne (−?\d+) °C in Kelvin um/);
      if (m) { const th = z(m[1]); return { richtig: th + NULL_K, toleranz: 0.001, falsch: [[th - NULL_K, "Falsche Richtung"], [th + 273, "Fast"]] }; }
      m = f.match(/Rechne ([\d,]+) K in Grad Celsius um/);
      if (!m) return null;
      const T = z(m[1]);
      return { richtig: r2(T - NULL_K), toleranz: 0.001, falsch: [[T + NULL_K, "Falsche Richtung"], [T - 273, "Fast"]] };
    }],
    ["M1 Luftpumpe", (f) => {
      const m = f.match(/sind (\d+) cm³ Luft bei ([\d,]+) bar .* nur noch (\d+) cm³ einnimmt/);
      if (!m) return null;
      const V1 = Number(m[1]), p1 = z(m[2]), V2 = Number(m[3]);
      return { richtig: r2((p1 * V1) / V2), toleranz: TOL, falsch: [[(p1 * V2) / V1, "Umgekehrt"], [p1, "Der Druck bleibt nicht gleich"], [p1 === 1 ? NaN : V1 / V2, "p₁ fehlt"]] };
    }],
    ["M2 Ballon", (f) => {
      const m = f.match(/bei (\d+) °C ([\d,]+) l Luft\. .*auf (\d+) °C/);
      if (!m) return null;
      const t1 = Number(m[1]), V1 = z(m[2]), t2 = Number(m[3]);
      return { richtig: r2((V1 * (t2 + NULL_K)) / (t1 + NULL_K)), toleranz: TOL, falsch: [[(V1 * t2) / t1, "Mit Grad Celsius geht es schief"], [(V1 * (t1 + NULL_K)) / (t2 + NULL_K), "Bruch umgedreht"], [V1, "Das Volumen bleibt nicht gleich"]] };
    }],
    ["S1 Druck in der Wärme", (f) => {
      const m = f.match(/bei (−?\d+) °C einen Innendruck von ([\d,]+) bar\. Im Auto wird sie (\d+) °C heiß/) || f.match(/bei (−?\d+) °C auf ([\d,]+) bar aufgepumpt\. .*Luft darin (\d+) °C warm/);
      if (!m) return null;
      const t1 = z(m[1]), p1 = z(m[2]), t2 = Number(m[3]);
      const soll = (p1 * (t2 + NULL_K)) / (t1 + NULL_K), je273 = p1 * (1 + (t2 - t1) / NULL_K);
      return { richtig: r2(soll), toleranz: TOL,
        falsch: [[(p1 * t2) / t1, "Mit Grad Celsius geht es schief"], [(p1 * (t1 + NULL_K)) / (t2 + NULL_K), "Bruch umgedreht"], [Math.abs(je273 - soll) < 0.02 ? NaN : je273, "bezieht sich auf den Druck bei 0 °C"], [p1, "Der Druck bleibt nicht gleich"]],
        pruefe: (frage) => FASSUNGEN.add(/Autoreifen/.test(frage) ? "Reifen" : "Spraydose") };
    }],
    ["S2 Um wie viel wärmer?", (f) => {
      const m = f.match(/Ein (\d+) m langer Stab aus (\S+) ist nach dem Erwärmen ([\d,]+) mm länger\. .*\(α = ([\d,]+)/);
      if (!m) return null;
      const L0 = Number(m[1]), a = ALPHA[m[2]], dL = z(m[3]);
      if (!nahe(z(m[4]), a, 1e-12)) return null;
      const dT = dL / (a * L0);
      return { richtig: dT, toleranz: TOL, falsch: [[dL * a * L0, "Rückwärts wird geteilt"], [dL / a, "L₀ fehlt"], [(dL * 1000) / (a * L0), "ΔL steht schon in Millimetern"]],
        pruefe: (frage, rueck) => pruefe(/Probe:/.test(rueck) && Number.isInteger(Math.round(dT * 1e6) / 1e6), `S2: keine Probe oder krummes ΔT — „${frage}“`) };
    }],
    ["K1 Luftblase", (f) => {
      const m = f.match(/in (\d+) m Tiefe aus\. Eine Luftblase hat dort ([\d,]+) cm³, der Druck ist ([\d,]+) bar, das Wasser (\d+) °C kalt\. .*Dort ist der Druck ([\d,]+) bar und das Wasser (\d+) °C warm/);
      if (!m) return null;
      const tiefe = Number(m[1]), V1 = z(m[2]), p1 = z(m[3]), t1 = Number(m[4]), p2 = z(m[5]), t2 = Number(m[6]);
      // Plausibel? Luftdruck plus Wasserdruck ρ · g · h, gerundet auf ganze bar.
      if (!nahe(p1, 1.013 + (1000 * 9.81 * tiefe) / 1e5, 0.1)) return null;
      const T1 = t1 + NULL_K, T2 = t2 + NULL_K;
      return { richtig: r2((V1 * p1 * T2) / (p2 * T1)), toleranz: TOL,
        falsch: [[(V1 * p1) / p2, "Die Temperatur fehlt"], [(V1 * T2) / T1, "Der Druck fehlt"], [(V1 * p2 * T2) / (p1 * T1), "Druckverhältnis umgedreht"], [(V1 * p1 * t2) / (p2 * t1), "Mit Grad Celsius geht es schief"]] };
    }],
    ["K2 Thermometer", (f) => {
      const m = f.match(/enthält ([\d,]+) ml (\S+) \(γ = ([\d,]+).*Querschnitt ([\d,]+) mm²\. .*von (\d+) °C auf (\d+) °C steigt/);
      if (!m) return null;
      const V0 = z(m[1]), g = GAMMA[m[2]], A = z(m[4]), t1 = Number(m[5]), t2 = Number(m[6]), dT = t2 - t1;
      if (!nahe(z(m[3]), g, 1e-12)) return null;
      const dV = g * V0 * dT;
      return { richtig: r2(dV / A), toleranz: TOL, falsch: [[dV, "zusätzliche Volumen ΔV in mm³"], [dV * A, "Geteilt, nicht malgenommen"], [(g * V0 * t2) / A, "ΔT ist der Temperaturunterschied"], [dV / (1000 * A), "nicht noch durch 1000 teilen"]] };
    }],
  ];
  for (let i = 0; i < auf.length; i++) {
    const [name, deute] = auf[i];
    await pruefeAufgabe(page, bericht, { nr: i + 1, name, runden: RUNDEN, mindestensVerschieden: SCHRANKE[i], deute });
  }
  // Beide Fassungen von S1 kommen vor — eine Kollision ließ die Reifen einmal lautlos verschwinden.
  pruefe(FASSUNGEN.size === 2, `S1: nur die Fassungen ${[...FASSUNGEN].join(", ")} gezogen`);
}

// ════════════════ Gerüst und Formelsammlung ════════════════

async function geruest(page) {
  const folge = await page.evaluate(() => [...document.querySelectorAll("main section[id]")].map((s) => s.id));
  const soll = ["sec-teilchen", "sec-uebergaenge", "sec-bindung", "sec-fest", "sec-fluessig", "sec-gay-lussac", "sec-boyle", "sec-amontons", "sec-gasgleichung",
    "sec-vernetzung", "sec-formelsammlung", "sec-uebungen", "sec-selbsteinschaetzung"];
  pruefe(JSON.stringify(folge) === JSON.stringify(soll), `Gerüst: die Abschnitte stehen in der Reihenfolge ${folge.join(", ")}`);
  const nummern = await page.evaluate(() => [...document.querySelectorAll("main section[id] > h2")].map((h) => (h.textContent.match(/^(\d+)\./) || [])[1]).filter(Boolean).map(Number));
  pruefe(JSON.stringify(nummern) === JSON.stringify([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]), `Gerüst: die Abschnitte sind ${nummern.join(", ")} nummeriert`);
  const ziele = await page.evaluate(() => document.querySelectorAll(".lern-intro-list li").length);
  const saetze = await page.evaluate(() => [...document.querySelectorAll("#se-liste li")].map((l) => l.dataset.abschnitt));
  pruefe(ziele === 9 && JSON.stringify(saetze) === JSON.stringify(soll.slice(0, 9)), `Gerüst: ${ziele} Ziele, Selbsteinschätzung zu ${saetze.join(", ")}`);
  // Kein Vorgriff: Kelvin als absolute Temperatur erst ab Abschnitt 6; in 4 und 5 nur als Differenz.
  for (const id of ["sec-teilchen", "sec-uebergaenge", "sec-bindung", "sec-fest", "sec-fluessig"]) {
    const t = await page.evaluate((i) => document.getElementById(i).innerText, id);
    pruefe(!/273|absolute/.test(t), `Gerüst: ${id} benutzt die absolute Temperatur vor Abschnitt 6`);
  }
  const rahmen = await page.evaluate(() => ({
    brot: document.querySelector("nav.breadcrumb").innerText.trim().endsWith("1. Thermische Ausdehnung"),
    haftung: !!document.querySelector('footer a[href$="haftungsausschluss.html"]'),
  }));
  pruefe(rahmen.brot && rahmen.haftung, "Gerüst: Brotkrumen oder Haftungsausschluss fehlen");
  const links = await page.evaluate(() => [...document.querySelectorAll("a[href]")].map((a) => a.getAttribute("href")).filter((h) => !h.startsWith("http")));
  for (const href of new Set(links)) {
    if (href.startsWith("#")) { pruefe(await page.evaluate((id) => !!document.getElementById(id), href.slice(1)), `Gerüst: Sprungmarke „${href}“ führt ins Leere`); continue; }
    const ziel = new URL(href, "http://localhost" + SEITE);
    const antwort = await page.request.get("http://localhost:" + (process.env.UPLANT_PORT || "8936") + ziel.pathname);
    pruefe(antwort.ok(), `Gerüst: der Verweis „${href}“ führt ins Leere (${antwort.status()})`);
    if (ziel.hash) pruefe((await antwort.text()).includes(`id="${ziel.hash.slice(1)}"`), `Gerüst: die Sprungmarke in „${href}“ gibt es nicht`);
  }
  // Menükarten: Physik → Klasse 8 → Thema, jede mit hidden und data-section="physik", nur Titel.
  for (const [datei, href, titel] of [["physik/index.html", "klasse-8/index.html", "Klasse 8"], ["physik/klasse-8/index.html", "thermische-ausdehnung.html", "1. Thermische Ausdehnung"]]) {
    const menue = fs.readFileSync(path.join(WURZEL, datei), "utf8");
    const karte = menue.match(new RegExp(`<a class="menu-card"[^>]*href="${href.replace(/[.]/g, "\\.")}"[^>]*>([\\s\\S]*?)<\\/a>`));
    pruefe(!!karte && /\bhidden\b/.test(karte[0]) && /data-section="physik"/.test(karte[0]) && karte[1].includes(`<h2>${titel}</h2>`), `Gerüst: die Menükarte „${titel}“ in ${datei} fehlt oder ist unvollständig`);
    pruefe(/assets\/access-gate\.js/.test(menue), `Gerüst: ${datei} bindet access-gate.js nicht ein — die Karte bliebe unsichtbar`);
  }
  // Formelsammlung: Verweis, zwei Seiten quer, die Formeln in der Quelle.
  const verweis = await page.evaluate(() => { const a = document.querySelector("#sec-formelsammlung a[download]"); return a && a.getAttribute("href"); });
  pruefe(verweis === "thermische-ausdehnung.pdf", `Formelsammlung: der Verweis zeigt auf „${verweis}“`);
  const pdf = path.join(WURZEL, "physik/klasse-8/thermische-ausdehnung.pdf");
  pruefe(fs.existsSync(pdf), "Formelsammlung: PDF fehlt");
  if (fs.existsSync(pdf)) {
    const roh = fs.readFileSync(pdf).toString("latin1");
    pruefe((roh.match(/\/Type\s*\/Page(?!s)/g) || []).length === 2, "Formelsammlung: nicht genau zwei Seiten");
    const box = roh.match(/\/MediaBox\s*\[\s*0 0 ([\d.]+) ([\d.]+)/);
    pruefe(!!box && Number(box[1]) > Number(box[2]), "Formelsammlung: nicht im Querformat");
  }
  const quelle = fs.readFileSync(path.join(WURZEL, "tools/formelsammlung/formelsammlung-ta-quelle.html"), "utf8").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/\s+/g, " ");
  for (const f of ["ΔL = α · L0 · ΔT", "ΔV = γ · V0 · ΔT", "T = ϑ + 273,15 K", "p1 · V1 = p2 · V2", "Bindungsenergie", "Schmelzen", "Resublimieren"]) pruefe(quelle.includes(f), `Formelsammlung: „${f}“ fehlt in der Quelle`);
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
      await teil("teilchen", teilchen, page);
      await teil("uebergaenge", uebergaenge, page);
      await teil("bindung", bindung, page);
      await teil("fest", fest, page);
      await teil("fluessig", fluessig, page);
      await teil("gaylussac", gaylussac, page);
      await teil("boyle", boyle, page);
      await teil("amontons", amontons, page);
      await teil("gasgleichung", gasgleichung, page);
      await teil("quizze", quizze, page);
      await teil("aufgaben", aufgaben, page);
    } else if (will("dunkel")) {
      await pruefeKontrast(page, bericht, "dunkel");
      await pruefeStrichKontrast(page, bericht, "dunkel, Kurven und Linien", ".ta-kurve, .ta-energie, .ta-mitte, .ta-achse, .ta-zylinder, .ta-pfeil");
    }
    await pruefeNotation(page, bericht, wo);
    for (const s of page.stoerungen) pruefe(false, `${wo}: ${s}`);
    await page.close();
  }
  await browser.close();
  bericht.abschluss();
})();
