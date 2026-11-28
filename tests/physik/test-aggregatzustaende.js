// Fachliche Prüfung: Physik, Klasse 8, Thermische Ausdehnung, Thema 1 „Aggregatzustände“.
//
// Nachgerechnet wird mit eigenen Formeln und Konstanten (tests/lib/physik.js), die Zeichnungen werden aus dem
// SVG zurückgelesen (Maßstab aus Gitterlinien data-wert und Achsenmarken data-wert-x):
//
//   1. TEILCHEN: Gitterplätze regelmäßig; Auslenkung warm : kalt = v̄(warm) : v̄(kalt) mit
//      v̄ = √(8 k T / (π m)) aus Boltzmann-Konstante und Molekülmasse; Flüssigkeit und Gas bewegen sich
//      im selben Verhältnis schneller; Gas weit, Flüssigkeit dicht; Abspielen bewegt die Zeit.
//   2. KELVIN: Reglerstufen bis genau −273,15 °C und nie darunter; Energiegerade E : E(0 °C) = T : 273,15 K mit
//      dem Ende beim absoluten Nullpunkt; Kelvin-Marken genau 273,15 neben den Celsius-Marken; Pfeillängen im
//      Verhältnis der mittleren Geschwindigkeiten, am Nullpunkt keine Pfeile und alle Teilchen auf ihren Plätzen.
//   3. ÜBERGÄNGE: Erwärmungskurve aus der eigenen Energiebilanz; Punkt, Anteile, Bilanz; Tabelle der
//      Energie je Kilogramm.
//   4. BINDUNG: Mulde, Umkehrpunkte durch Bisektion, Mitte wandert nach außen, Trennung bei W ≥ 1.
//   Dazu die Kontrollfragen, alle Aufgaben mit ihren Fehlern, das Gerüst und der Dunkelmodus.

"use strict";

const { neuerBericht } = require("../lib/pruefen");
const { setzeRegler, text } = require("../lib/seite");
const { pruefeAufgabe } = require("../lib/aufgaben");
const { nahe, z, r2, trifft, vMittel, NULL_K, ALPHA, lies, welt, pfad, pkt, rolle, kasten, pruefeQuizze, pruefeGeruest, fuehreAus } = require("../lib/physik");

const bericht = neuerBericht();
const { pruefe } = bericht;
const SEITE = "/physik/klasse-8/thermische-ausdehnung/aggregatzustaende.html";
// Energie je Kilogramm (kJ) und je Kilogramm und Kelvin (kJ/K), wie im Lehrbuch.
const C_EIS = 2.1, Q_S = 334, C_W = 4.19, Q_V = 2256, C_D = 2.0;

// Erwärmung von 1 kg Eis bei −20 °C: Energie Schritt für Schritt aufgebraucht.
function erwaermung(Q) {
  let rest = Q;
  const schritte = [["eis", C_EIS * 20], ["schmelzen", Q_S], ["wasser", C_W * 100], ["verdampfen", Q_V], ["dampf", C_D * 20]];
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

// ════════════════ 2. Absoluter Nullpunkt und Kelvin-Skala ════════════════

async function kelvin(page) {
  // Die Stufen des Reglers: Die Anzeige nennt die Temperatur, mit der gerechnet wird.
  const max = Number(await page.getAttribute("#kv-stufe", "max"));
  const stufen = [];
  for (let i = 0; i <= max; i++) { await setzeRegler(page, "kv-stufe", i); stufen.push(z((await text(page, "#kv-stufe-anzeige")).replace(/\s*°C/, ""))); }
  pruefe(nahe(stufen[0], -NULL_K, 1e-9) && stufen.every((t) => t >= -NULL_K - 1e-9), `Kelvin: der Regler beginnt nicht genau beim absoluten Nullpunkt oder geht darunter (${stufen[0]})`);
  pruefe(stufen.every((t, i) => i === 0 || (t > stufen[i - 1] && t - stufen[i - 1] <= 10)) && [0, 20, 100, 400].every((t) => stufen.includes(t)), "Kelvin: die Reglerstufen steigen nicht gleichmäßig an oder 0, 20, 100, 400 °C fehlen");
  const v0 = vMittel(0);
  let pfeil0 = null;
  for (const t of [0, -NULL_K, -270, -200, -10, 20, 50, 100, 400]) {
    const i = stufen.findIndex((x) => nahe(x, t, 1e-9));
    await setzeRegler(page, "kv-stufe", i);
    const T = t + NULL_K, e = T / NULL_K, v = vMittel(t), wo = `Kelvin ${t} °C`;
    const sv = await lies(page, '#kv-mount g[data-diagramm="kelvin"]'), w = welt(sv);
    const gerade = pfad(sv, w, "energie");
    pruefe(gerade.length >= 2 && nahe(gerade[0][0], -NULL_K, 0.3) && nahe(gerade[0][1], 0, 3e-3) && gerade.every(([x, y]) => nahe(y, (x + NULL_K) / NULL_K, 3e-3)), `${wo}: die Gerade ist nicht E : E(0 °C) = T : 273,15 K oder beginnt nicht beim absoluten Nullpunkt`);
    const [jetzt] = pkt(sv, w, "jetzt"), [null0] = pkt(sv, w, "nullpunkt");
    pruefe(!!jetzt && nahe(jetzt[0], t, 0.3) && nahe(jetzt[1], e, 3e-3), `${wo}: der Punkt steht nicht bei (${t} | ${e.toFixed(4)})`);
    pruefe(!!null0 && nahe(null0[0], -NULL_K, 0.3) && nahe(null0[1], 0, 3e-3), `${wo}: der absolute Nullpunkt ist falsch markiert`);
    // Die Kelvin-Skala: Marke K steht genau unter ϑ = K − 273,15 °C. Auf 0,05 K genau — die Zeichnung trägt
    // Hundertstel Bildpunkte (≈ 0,02 K); eine um 0,15 verschobene Skala (273 statt 273,15) fiele sonst durch.
    const marken = await page.evaluate(() => [...document.querySelectorAll("#kv-mount line[data-wert-k]")].map((l) => [Number(l.dataset.wertK), Number(l.getAttribute("x1"))]));
    pruefe(marken.length >= 6 && marken.some(([K]) => K === 0) && marken.every(([K, x]) => nahe(w.X(x), K - NULL_K, 0.05)), `${wo}: die Kelvin-Marken stehen nicht 273,15 neben den Celsius-Marken`);
    // Teilchen und Pfeile.
    const feld = await page.evaluate(() => {
      const g = document.querySelector("#kv-mount g[data-zustand]");
      const r = g.querySelector("rect.ta-feld");
      return {
        zustand: g.dataset.zustand, b: Number(r.getAttribute("width")), h: Number(r.getAttribute("height")),
        pfeile: [...g.querySelectorAll('line[data-rolle="pfeil"]')].map((l) => ["x1", "y1", "x2", "y2"].map((a) => Number(l.getAttribute(a)))),
        teilchen: [...g.querySelectorAll("circle.ta-teilchen")].map((c) => [Number(c.getAttribute("cx")), Number(c.getAttribute("cy"))]),
        plaetze: [...g.querySelectorAll("circle.ta-gitterplatz")].map((c) => [Number(c.getAttribute("cx")), Number(c.getAttribute("cy"))]),
        still: !!g.querySelector('[data-rolle="stillstand"]'),
      };
    });
    pruefe(feld.zustand === (t <= 0 ? "fest" : t < 100 ? "fluessig" : "gas"), `${wo}: Wasser ist als „${feld.zustand}“ gezeichnet`);
    const laengen = feld.pfeile.map(([x1, y1, x2, y2]) => Math.hypot(x2 - x1, y2 - y1));
    if (T < 1e-9) {
      pruefe(laengen.length === 0 && feld.still && feld.teilchen.every(([x, y], k) => nahe(x, feld.plaetze[k][0], 1e-3) && nahe(y, feld.plaetze[k][1], 1e-3)), `${wo}: am absoluten Nullpunkt bewegen sich die Teilchen noch`);
    } else {
      if (t === 0) pfeil0 = laengen[0];
      pruefe(laengen.length >= 3 && pfeil0 !== null && laengen.every((l) => nahe(l / pfeil0, v / v0, 2e-3)), `${wo}: die Pfeile sind nicht ${(v / v0).toFixed(4)}-mal so lang wie bei 0 °C`);
      pruefe(feld.pfeile.every(([, , x2, y2]) => x2 > 0 && x2 < feld.b && y2 > 0 && y2 < feld.h), `${wo}: ein Pfeil ragt aus dem Feld`);
    }
    const B_ = (r) => rolle(page, "#kv-bilanz", r);
    pruefe(trifft(await B_("t"), T, 2) && trifft(await B_("v"), v, 0) && trifft(await B_("v0"), v0, 0) && trifft(await B_("e"), e, 4), `${wo}: die Bilanz stimmt nicht`);
    const tx = await text(page, "#kv-text");
    pruefe(T < 1e-9 ? /stehen die Teilchen still/.test(tx) : tx.includes(`noch ${String(r2(T)).replace(".", ",")} K`), `${wo}: der Text nennt den Abstand zum absoluten Nullpunkt nicht`);
  }
  const b = await kasten(page, "sec-kelvin");
  pruefe(b.includes(`T = 20 + 273,15 = ${String(20 + NULL_K).replace(".", ",")} K`) && b.includes(`100 °C = ${String(100 + NULL_K).replace(".", ",")} K`) && b.includes(`77 − 273,15 = −${String(r2(NULL_K - 77)).replace(".", ",")} °C`)
    && b.includes(`373,15 : 273,15 ≈ ${(373.15 / NULL_K).toFixed(2).replace(".", ",")}`), "Kelvin: das Beispiel rechnet falsch");
  const ach = await kasten(page, "sec-kelvin", "achtung-box");
  pruefe(ach.includes("313,15 K und 293,15 K") && ach.includes("rund 7 %") && nahe(313.15 / 293.15 - 1, 0.07, 0.005), "Kelvin: der Achtung-Kasten rechnet falsch");
  const def = await kasten(page, "sec-kelvin", "definition-box");
  pruefe(def.includes("T = ϑ + 273,15 K") && def.includes("0 K = −273,15 °C"), "Kelvin: die Definition der Kelvin-Skala fehlt");
}

// ════════════════ 3. Übergänge ════════════════

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
  const b = await kasten(page, "sec-uebergaenge");
  for (const [txt, w] of [["−20 °C auf 0 °C: ", 2.1 * 20], ["Schmelzen: ", 334], ["0 °C auf 100 °C: ", 4.19 * 100], ["Verdampfen: ", 2256], ["100 °C auf 120 °C: ", 2.0 * 20]]) {
    pruefe(b.includes(`${txt}${String(Math.round(w))} kJ`), `Übergänge: „${txt}${Math.round(w)} kJ“ fehlt im Beispiel`);
  }
  pruefe(2256 / 419 > 5 && 2256 / 419 < 6 && b.includes("mehr als fünfmal"), "Übergänge: „mehr als fünfmal“ stimmt nicht");
  // Die Tabelle „Energie je Kilogramm“: Werte wie im Lehrbuch, in der Reihenfolge der Erwärmungskurve.
  const tab = await page.evaluate(() => { const t = document.querySelectorAll("#sec-uebergaenge .wissen-box table.ta-tabelle")[1]; return [...t.querySelectorAll("tr")].map((tr) => [...tr.children].map((c) => c.innerText.trim())); });
  const de = (x, st) => x.toFixed(st).replace(".", ",");
  const soll = [`${de(C_EIS, 1)} kJ je K`, `${Q_S} kJ`, `${de(C_W, 2)} kJ je K`, `${Q_V} kJ`, `${de(C_D, 1)} kJ je K`];
  pruefe(JSON.stringify(tab[1].slice(1)) === JSON.stringify(soll), `Übergänge: die Tabelle der Energie je Kilogramm nennt ${tab[1].slice(1).join(" | ")}`);
}

// ════════════════ 4. Bindungsenergie ════════════════

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
  const ach = await kasten(page, "sec-bindung", "achtung-box");
  pruefe(ach.includes("1,2 Tausendstel") && nahe(ALPHA.Stahl * 100 / 1000, 0.0012, 1e-12), "Bindung: „1,2 Tausendstel“ für Stahl bei 100 K stimmt nicht");
}

// ════════════════ Kontrollfragen ════════════════

async function quizze(page) {
  await pruefeQuizze(page, pruefe, 4, {
    "quiz-teilchen": (o) => /schwingen heftiger/.test(o),
    "quiz-kelvin": (o) => /nicht mehr bewegen/.test(o),
    "quiz-uebergaenge": (o) => /bleibt bei 100 °C/.test(o),
    "quiz-bindung": (o) => /nach außen aber weiter/.test(o),
  });
}

// ════════════════ Übungsaufgaben ════════════════

// Gemessen mit werkzeug-streuung.js (UPLANT_ZUEGE=20): verschieden in 200 Würfen und geschätzte Größe des
// Vorrats — E1 22/200 (n ≈ 22), E2 106/200 (n ≈ 139), M1 61/200 (n ≈ 64), M2 36/200 (n ≈ 36), S1 44/200 (n ≈ 44),
// S2 131/200 (n ≈ 218), K1 13/200 (n ≈ 13), K2 63/200 (n ≈ 66). Für 80 Züge (UPLANT_ZUEGE=80): E2 47, S2 53.
const RUNDEN = 20;
const SCHRANKE = [7, 13, 11, 9, 10, 14, 5, 11];
const SCHRANKE_1KG = { E2: 47, S2: 53 };   // für 80 Züge
const TOL = 0.0051;
// E2 und S2: Bei 1 kg fallen Fehlerwerte auf die Lösung (dort steht NaN). Ob 1 kg wirklich gezogen wird, prüfen
// mehr Züge: Auf 1 kg entfallen gut 13 % der Kandidaten, 80 Züge verfehlen es mit Wahrscheinlichkeit unter 10⁻⁵.
const RUNDEN_1KG = 80;
const MIT_EINEM_KG = new Set();
async function aufgaben(page) {
  const auf = [
    ["E1 Celsius und Kelvin", (f) => {
      let m = f.match(/Rechne (−?\d+) °C in Kelvin um/);
      if (m) { const th = z(m[1]); return { richtig: th + NULL_K, toleranz: 0.001, falsch: [[th - NULL_K, "Kelvin-Werte sind größer als Celsius-Werte"], [th + 273, "genau gilt T = ϑ + 273,15 K"]] }; }
      m = f.match(/Rechne ([\d,]+) K in Grad Celsius um/);
      if (!m) return null;
      const T = z(m[1]);
      return { richtig: r2(T - NULL_K), toleranz: 0.001, falsch: [[T + NULL_K, "Celsius-Werte sind kleiner als Kelvin-Werte"], [T - 273, "genau gilt ϑ = T − 273,15 °C"]] };
    }],
    ["E2 Wasser erwärmen", (f) => {
      const m = f.match(/([\d,]+) kg Wasser werden von (\d+) °C auf (\d+) °C erwärmt\./);
      if (!m) return null;
      const kg = z(m[1]), t1 = Number(m[2]), t2 = Number(m[3]), dT = t2 - t1;
      return { richtig: r2(kg * C_W * dT), toleranz: TOL,
        falsch: [[kg * C_W * t2, "ΔT ist der Temperaturunterschied"], [kg === 1 ? NaN : C_W * dT, "Energie für 1 kg"], [kg * C_W, "Energie für 1 K"], [kg * C_EIS * dT, "gelten für Eis"]],
        pruefe: () => { if (kg === 1) MIT_EINEM_KG.add("E2"); } };
    }],
    ["M1 Eis aus der Kühltruhe", (f) => {
      const m = f.match(/([\d,]+) kg Eis kommen mit (−\d+) °C aus der Kühltruhe\./);
      if (!m) return null;
      const kg = z(m[1]), d = -z(m[2]);
      return { richtig: r2(kg * (C_EIS * d + Q_S)), toleranz: TOL,
        falsch: [[kg * Q_S, "erst von"], [kg * C_EIS * d, "geschmolzen ist es noch nicht"], [kg * (C_W * d + Q_S), "Bis 0 °C ist es noch Eis"], [kg * (Q_S - C_EIS * d), "nicht abgezogen"]] };
    }],
    ["M2 Der Topf kocht leer", (f) => {
      const m = f.match(/stehen ([\d,]+) kg Wasser von (\d+) °C auf dem Herd\./);
      if (!m) return null;
      const kg = z(m[1]), d = 100 - Number(m[2]);
      return { richtig: r2(kg * (C_W * d + Q_V)), toleranz: TOL,
        falsch: [[kg * Q_V, "erst von"], [kg * C_W * d, "verdampft ist es noch nicht"], [kg * (C_W * d + Q_S), "braucht das Schmelzen"], [kg * (C_W * 100 + Q_V), "Es wird nur um"]] };
    }],
    ["S1 Wie viel Eis?", (f) => {
      const m = f.match(/Mit ([\d.,]+) kJ wird Eis von 0 °C geschmolzen und das Schmelzwasser auf (\d+) °C erwärmt\./);
      if (!m) return null;
      const Q = z(m[1]), t2 = Number(m[2]), je = Q_S + C_W * t2;
      return { richtig: Q / je, toleranz: TOL, falsch: [[Q / Q_S, "reichen nur zum Schmelzen"], [Q * je, "Rückwärts wird geteilt"], [Q / (C_W * t2), "Das Eis muss erst schmelzen"]],
        pruefe: (frage, rueck) => pruefe(/Probe:/.test(rueck) && nahe(Q / je, r2(Q / je), 1e-9), `S1: keine Probe oder krumme Masse — „${frage}“`) };
    }],
    ["S2 Wie warm wird das Wasser?", (f) => {
      const m = f.match(/([\d,]+) kg Wasser von (\d+) °C bekommen ([\d.,]+) kJ Energie\./);
      if (!m) return null;
      const kg = z(m[1]), t1 = Number(m[2]), Q = z(m[3]), dT = Q / (kg * C_W);
      return { richtig: t1 + dT, toleranz: TOL,
        falsch: [[dT, "Das ist die Temperaturänderung"], [kg === 1 ? NaN : t1 + Q / C_W, "Die Masse fehlt"], [kg === 1 ? NaN : t1 + (Q * kg) / C_W, "geteilt, nicht malgenommen"], [t1 + Q / (kg * C_EIS), "gelten für Eis"]],
        pruefe: (frage, rueck) => { if (kg === 1) MIT_EINEM_KG.add("S2"); pruefe(/Probe:/.test(rueck) && t1 + dT < 100, `S2: keine Probe oder das Wasser siedet — „${frage}“`); } };
    }],
    ["K1 Dampf schmilzt Eis", (f) => {
      const m = f.match(/([\d,]+) kg Wasserdampf von 100 °C kondensieren zu Wasser von 100 °C\./);
      if (!m) return null;
      const mD = z(m[1]);
      return { richtig: r2((mD * Q_V) / Q_S), toleranz: TOL,
        falsch: [[(mD * Q_S) / Q_V, "Verhältnis umgedreht"], [mD, "Nicht gleich viel"], [mD * Q_V, "frei werdende Energie in kJ"], [(mD * (Q_V + C_W * 100)) / Q_S, "kondensiert nur zu Wasser von 100 °C"]] };
    }],
    ["K2 Schmelzen auf der Herdplatte", (f) => {
      const m = f.match(/liegen ([\d,]+) kg Eis von (−\d+) °C\. Die Herdplatte gibt (\d+) kJ je Minute .* bis Wasser von (\d+) °C im Topf ist\?/);
      if (!m) return null;
      const kg = z(m[1]), d = -z(m[2]), P = Number(m[3]), t2 = Number(m[4]);
      const qE = kg * C_EIS * d, qS = kg * Q_S, qW = kg * C_W * t2, Q = qE + qS + qW;
      return { richtig: r2(Q / P), toleranz: TOL,
        falsch: [[(qS + qW) / P, "erst von"], [(qE + qW) / P, "Das Schmelzen fehlt"], [(qE + qS) / P, "Die Energie dafür fehlt"], [Q, "Gefragt ist die Zeit"], [Q * P, "Malgenommen statt geteilt"]] };
    }],
  ];
  for (let i = 0; i < auf.length; i++) {
    const [name, deute] = auf[i];
    const viele = name.startsWith("E2") || name.startsWith("S2");
    await pruefeAufgabe(page, bericht, { nr: i + 1, name, runden: viele ? RUNDEN_1KG : RUNDEN, mindestensVerschieden: viele ? SCHRANKE_1KG[name.slice(0, 2)] : SCHRANKE[i], deute });
  }
  // 1 kg kommt vor: Dort fielen Fehlerwerte auf die Lösung — ohne NaN verschwände 1 kg lautlos aus dem Vorrat.
  for (const n of ["E2", "S2"]) pruefe(MIT_EINEM_KG.has(n), `${n}: 1 kg wurde in ${RUNDEN_1KG} Zügen nie gezogen — fällt es aus dem Vorrat?`);
}

// ════════════════ Gerüst ════════════════

const ABSCHNITTE = ["sec-teilchen", "sec-kelvin", "sec-uebergaenge", "sec-bindung"];
async function geruest(page) {
  await pruefeGeruest(page, pruefe, {
    seite: SEITE, abschnitte: ABSCHNITTE, ziele: 4, brot: "1. Aggregatzustände",
    karten: [["physik/klasse-8/thermische-ausdehnung/index.html", "aggregatzustaende.html", "1. Aggregatzustände"]],
    // Kein Vorgriff: Die absolute Temperatur entsteht in Abschnitt 2 aus dem Teilchenmodell — davor kommt sie nicht vor.
    ohneAbsolut: ["sec-teilchen"],
    formeln: ["T = ϑ + 273,15 K", "Absoluter Nullpunkt und Kelvin-Skala", "Bindungsenergie", "Schmelzen", "Resublimieren", "Die Energie ist proportional zur Masse", "Q = 2 · (334 + 4,19 · 20) = 835,6 kJ"],
  });
}

fuehreAus(bericht, SEITE, [
  ["geruest", geruest], ["teilchen", teilchen], ["kelvin", kelvin], ["uebergaenge", uebergaenge], ["bindung", bindung], ["quizze", quizze], ["aufgaben", aufgaben],
], ".ta-kurve, .ta-energie, .ta-mitte, .ta-achse, .ta-pfeil");
