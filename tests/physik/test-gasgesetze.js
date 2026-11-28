// Fachliche Prüfung: Physik, Klasse 8, Thermische Ausdehnung, Thema 3 „Gasgesetze“.
//
// Nachgerechnet wird mit eigenen Formeln und Konstanten (tests/lib/physik.js), die Zeichnungen werden aus dem
// SVG zurückgelesen (Maßstab aus Gitterlinien data-wert und Achsenmarken data-wert-x):
//
//   1.–3. GASGESETZE: Gashöhen und Manometer proportional, Geraden durch den absoluten Nullpunkt,
//      Hyperbel und gleich große Rechtecke, Bilanzen.
//   4. GASGLEICHUNG: Weg in zwei Schritten, Zwischenzustand, p · V : T unterwegs konstant.
//   Dazu die Kontrollfragen, alle Aufgaben mit ihren Fehlern, das Gerüst und der Dunkelmodus.

"use strict";

const { neuerBericht } = require("../lib/pruefen");
const { setzeRegler } = require("../lib/seite");
const { pruefeAufgabe } = require("../lib/aufgaben");
const { nahe, z, r2, trifft, NULL_K, lies, welt, pfad, pkt, rolle, kasten, pruefeQuizze, pruefeGeruest, fuehreAus } = require("../lib/physik");

const bericht = neuerBericht();
const { pruefe } = bericht;
const SEITE = "/physik/klasse-8/thermische-ausdehnung/gasgesetze.html";

// ════════════════ 1.–3. Die drei Gasgesetze ════════════════

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
  const s7 = await kasten(page, "sec-boyle");
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
  const s8 = await kasten(page, "sec-amontons");
  pruefe(s8.includes("≈ 3,41 bar") && nahe(3 * 333.15 / 293.15, 3.41, 0.005), "Amontons: das Beispiel rechnet falsch");
}

// ════════════════ 4. Allgemeine Gasgleichung ════════════════

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
  const s9 = await kasten(page, "sec-gasgleichung");
  const Vb = 4.0 * (1.0 / 0.26) * (223.15 / 288.15);
  pruefe(s9.includes("≈ 11,91 m³") && nahe(Vb, 11.91, 0.005) && Vb / 4 > 2.9 && Vb / 4 < 3, "Gasgleichung: das Wetterballon-Beispiel rechnet falsch");
}

// ════════════════ Kontrollfragen ════════════════

async function quizze(page) {
  const zahlIn = (o) => z((o.match(/[\d,]+/) || [""])[0]);
  await pruefeQuizze(page, pruefe, 4, {
    "quiz-gay-lussac": (o) => nahe(zahlIn(o), (3 * (127 + NULL_K)) / (27 + NULL_K), 0.05),
    "quiz-boyle": (o) => nahe(zahlIn(o), (1 * 60) / 20, 0.005),
    "quiz-amontons": (o) => nahe(zahlIn(o), (2 * (35 + NULL_K)) / (7 + NULL_K), 0.05) && !/^2,0/.test(o),
    "quiz-gasgleichung": (o) => /vervierfacht/.test(o) && 2 * (600 / 300) === 4,
  });
}

// ════════════════ Übungsaufgaben ════════════════

// Gemessen mit werkzeug-streuung.js (UPLANT_ZUEGE=20): verschieden in 200 Würfen und geschätzte Größe des
// Vorrats — E1 119/200 (n ≈ 174), E2 105/200 (n ≈ 136), M1 110/200 (n ≈ 148), M2 118/200 (n ≈ 171),
// S1 99/200 (n ≈ 123), S2 114/200 (n ≈ 159), K1 140/200 (n ≈ 262), K2 189/200 (n ≈ 1742). Bei Aufgaben,
// die zweimal gemessen wurden, steht die kleinere Schranke.
const RUNDEN = 20;
const SCHRANKE = [14, 13, 13, 14, 13, 14, 15, 17];
const TOL = 0.0051;
const FASSUNGEN = new Set();
async function aufgaben(page) {
  const auf = [
    ["E1 Gay-Lussac in Kelvin", (f) => {
      const m = f.match(/nimmt bei (\d+) K ein Volumen von ([\d,]+) l ein\. Bei gleichem Druck wird es auf (\d+) K erwärmt\./);
      if (!m) return null;
      const T1 = Number(m[1]), V1 = z(m[2]), T2 = Number(m[3]);
      return { richtig: r2((V1 * T2) / T1), toleranz: TOL, falsch: [[(V1 * T1) / T2, "Bruch umgedreht"], [V1, "Das Volumen bleibt nicht gleich"], [(V1 * (T2 - T1)) / T1, "nur die Zunahme"]] };
    }],
    ["E2 Amontons in Kelvin", (f) => {
      const m = f.match(/hat ein Gas bei (\d+) K den Druck ([\d,]+) bar\. Es wird auf (\d+) K erwärmt; das Volumen bleibt gleich\./);
      if (!m) return null;
      const T1 = Number(m[1]), p1 = z(m[2]), T2 = Number(m[3]);
      return { richtig: r2((p1 * T2) / T1), toleranz: TOL, falsch: [[(p1 * T1) / T2, "Bruch umgedreht"], [p1, "Der Druck bleibt nicht gleich"], [(p1 * (T2 - T1)) / T1, "nur die Zunahme"]] };
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
    ["S2 Wie weit zusammendrücken?", (f) => {
      const m = f.match(/sind (\d+) l Luft bei ([\d,]+) bar eingeschlossen\. .*damit der Druck ([\d,]+) bar beträgt\?/);
      if (!m) return null;
      const V1 = Number(m[1]), p1 = z(m[2]), p2 = z(m[3]), V2 = (p1 * V1) / p2;
      return { richtig: r2(V2), toleranz: TOL,
        falsch: [[(p2 * V1) / p1, "Umgekehrt"], [V1, "Das Volumen bleibt nicht gleich"], [p1 === 1 ? NaN : V1 / p2, "p₁ fehlt"], [(p1 * V1) / (p2 - p1), "nicht der Unterschied"]],
        pruefe: (frage, rueck) => pruefe(/Probe:/.test(rueck) && nahe(V2, r2(V2), 1e-9), `S2: keine Probe oder krummes Volumen — „${frage}“`) };
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
    ["K2 Zusammengedrückt und warm", (f) => {
      const m = f.match(/sind ([\d,]+) l Luft bei ([\d,]+) bar und (\d+) °C eingeschlossen\. Der Kolben drückt die Luft auf ([\d,]+) l zusammen; dabei erwärmt sie sich auf (\d+) °C\./);
      if (!m) return null;
      const V1 = z(m[1]), p1 = z(m[2]), t1 = Number(m[3]), V2 = z(m[4]), t2 = Number(m[5]), T1 = t1 + NULL_K, T2 = t2 + NULL_K;
      return { richtig: r2((p1 * V1 * T2) / (V2 * T1)), toleranz: TOL,
        falsch: [[(p1 * V1) / V2, "Die Temperatur fehlt"], [(p1 * T2) / T1, "Das Volumen fehlt"], [(p1 * V2 * T2) / (V1 * T1), "Volumenverhältnis umgedreht"], [(p1 * V1 * t2) / (V2 * t1), "Mit Grad Celsius geht es schief"]] };
    }],
  ];
  for (let i = 0; i < auf.length; i++) {
    const [name, deute] = auf[i];
    await pruefeAufgabe(page, bericht, { nr: i + 1, name, runden: RUNDEN, mindestensVerschieden: SCHRANKE[i], deute });
  }
  // Beide Fassungen von S1 kommen vor — eine Kollision ließ die Reifen einmal lautlos verschwinden.
  pruefe(FASSUNGEN.size === 2, `S1: nur die Fassungen ${[...FASSUNGEN].join(", ")} gezogen`);
}

// ════════════════ Gerüst ════════════════

const ABSCHNITTE = ["sec-gay-lussac", "sec-boyle", "sec-amontons", "sec-gasgleichung"];
async function geruest(page) {
  await pruefeGeruest(page, pruefe, {
    seite: SEITE, abschnitte: ABSCHNITTE, ziele: 4, brot: "3. Gasgesetze",
    karten: [["physik/klasse-8/thermische-ausdehnung/index.html", "gasgesetze.html", "3. Gasgesetze"]],
    formeln: ["T = ϑ + 273,15 K", "p1 · V1 = p2 · V2", "Allgemeine Gasgleichung", "Boyle-Mariotte", "Amontons"],
  });
  // Die Kelvin-Skala kommt aus Thema 1: Abschnitt 1 verweist dorthin, rechnet mit T = ϑ + 273,15 K und erkennt den
  // absoluten Nullpunkt wieder — eine zweite Definition der Skala steht hier nicht.
  const s1 = await page.evaluate(() => ({ text: document.getElementById("sec-gay-lussac").innerText, links: [...document.querySelectorAll("#sec-gay-lussac a")].map((a) => a.getAttribute("href")), def: !!document.querySelector("#sec-gay-lussac .definition-box") }));
  pruefe(/273,15/.test(s1.text) && /absoluten Nullpunkt/.test(s1.text) && s1.links.includes("aggregatzustaende.html#sec-kelvin") && !s1.def, "Gerüst: Abschnitt 1 verweist nicht auf die Kelvin-Skala aus Thema 1 oder definiert sie noch einmal");
  const vernetzung = await page.evaluate(() => [...document.querySelectorAll("#sec-vernetzung a")].map((a) => a.getAttribute("href")));
  pruefe(vernetzung.includes("aggregatzustaende.html#sec-kelvin"), "Gerüst: die Vernetzung nennt die Kelvin-Skala aus Thema 1 nicht");
}

fuehreAus(bericht, SEITE, [
  ["geruest", geruest], ["gaylussac", gaylussac], ["boyle", boyle], ["amontons", amontons], ["gasgleichung", gasgleichung], ["quizze", quizze], ["aufgaben", aufgaben],
], ".ta-kurve, .ta-achse, .ta-zylinder, .ta-pfeil");
