// Fachliche Prüfung: Physik, Klasse 8, Thermische Ausdehnung, Thema 2 „Längenausdehnung“.
//
// Nachgerechnet wird mit eigenen Tabellenwerten (tests/lib/physik.js) und eigenen Verfahren; die Zeichnungen
// werden aus dem SVG zurückgelesen:
//
//   1. MESSUNG: Messuhr aus Zeigerwinkel und Zähler gelesen; Messpunkte und Gerade im Diagramm; Messreihe
//      mit gleichen Quotienten.
//   2. LÄNGE: L0 Meterstücke, jedes um denselben Betrag verlängert, gezeichnet genau so vielfach wie angegeben.
//   3. STOFF: Balkenhöhen aus den Gitterlinien = α · L0 · ΔT für alle fünf Stoffe; Tabelle = Lehrbuch.
//   4. RÜCKWÄRTS: α aus der abgelesenen Messuhr; die Bilanz nennt den Stoff, der dazu passt.
//   5. FUGE: Fugenbreite aus dem Maßstab des Ausschnitts = α · L0 · (40 °C − ϑ).
//   6. BIMETALL: zwei parallele Bögen, Kupfer außen, gezeichneter Winkel = Faktor · θ; Hub der Spitze durch
//      numerische Integration; Kontakt folgt der Spitze bis zum Anschlag.
//   7. VOLUMEN: ΔV = γ · V0 · ΔT, Säule an der Skala; Tabelle = Lehrbuch; der Würfel im Beispiel.
//   Dazu die Kontrollfragen, alle Aufgaben mit ihren Fehlern, das Gerüst und der Dunkelmodus.

"use strict";

const { neuerBericht } = require("../lib/pruefen");
const { setzeRegler, text } = require("../lib/seite");
const { pruefeAufgabe } = require("../lib/aufgaben");
const { nahe, z, r2, trifft, ALPHA, GAMMA, lies, welt, weltY, pfad, pfadPx, pkt, rolle, waehle, tabelle, messuhr, kasten, pruefeQuizze, pruefeGeruest, fuehreAus } = require("../lib/physik");

const bericht = neuerBericht();
const { pruefe } = bericht;
const SEITE = "/physik/klasse-8/thermische-ausdehnung/laengenausdehnung.html";
const name = (stoff) => stoff[0].toUpperCase() + stoff.slice(1);
const de = (x, st) => x.toFixed(st).replace(".", ",");

// ════════════════ 1. Die Messreihe ════════════════

async function messung(page) {
  const a = ALPHA.Kupfer;
  for (const dTw of [0, 10, 20, 30, 50, 80]) {
    const dT = await setzeRegler(page, "mr-dt", dTw), dL = a * dT, wo = `Messreihe ΔT = ${dT} K`;
    const abgelesen = await messuhr(page, "#mr-mount");
    pruefe(nahe(abgelesen, dL, 1e-3), `${wo}: die Messuhr zeigt ${abgelesen.toFixed(4)} mm statt ${dL.toFixed(4)} mm`);
    const sv = await lies(page, '#mr-mount g[data-diagramm="messreihe"]'), w = welt(sv);
    const punkte = pkt(sv, w, "messpunkt");
    pruefe(punkte.length === dT / 10 + 1 && punkte.every(([x, y], i) => nahe(x, 10 * i, 0.3) && nahe(y, a * 10 * i, 3e-3)), `${wo}: die Messpunkte stehen nicht bei (t | 0,017 · t)`);
    const gerade = pfad(sv, w, "gerade");
    pruefe(dT >= 20 ? gerade.length >= 2 && nahe(gerade[0][0], 0, 0.3) && nahe(gerade[0][1], 0, 3e-3) && gerade.every(([x, y]) => nahe(y, a * x, 3e-3)) : gerade.length === 0,
      `${wo}: die Ursprungsgerade fehlt, steht zu früh da oder hat nicht die Steigung 0,017`);
    // Die Messreihe in der Bilanz: angezeigte Werte, und ihr Quotient ist wirklich gleich.
    for (let t = 10; t <= dT; t += 10) {
      const zeile = await rolle(page, "#mr-bilanz", `dl-${t}`), q = await rolle(page, "#mr-bilanz", `q-${t}`);
      pruefe(trifft(zeile, a * t, 2) && trifft(q, a, 3) && nahe(z(zeile) / t, z(q), 1e-12), `${wo}: die Messreihe stimmt bei ${t} K nicht (${zeile} mm, Quotient ${q})`);
    }
    pruefe(trifft(await rolle(page, "#mr-bilanz", "dl"), dL, 2), `${wo}: die Bilanz stimmt nicht`);
    pruefe(/proportional/.test(await text(page, "#mr-text")) === (dT >= 20), `${wo}: der Text urteilt zu früh oder gar nicht über die Proportionalität`);
  }
}

// ════════════════ 2. Doppelte Länge ════════════════

async function laenge(page) {
  const a = ALPHA.Kupfer;
  for (const [Lw, dTw] of [[1, 0], [1, 80], [3, 50], [6, 80], [4, 10]]) {
    const L0 = await setzeRegler(page, "la-l", Lw), dT = await setzeRegler(page, "la-dt", dTw), wo = `Länge ${L0} m, ${dT} K`;
    const sv = await lies(page, "#la-mount");
    const alt = sv.rects.filter((r) => r.rolle === "stueck-alt"), neu = sv.rects.filter((r) => r.rolle === "stueck-neu");
    const faktor = Number(((await rolle(page, "#la-mount", "ueberhoehung")) || "").match(/(\d+)-fach/)?.[1]);
    pruefe(alt.length === L0 && neu.length === L0, `${wo}: ${alt.length} und ${neu.length} Meterstücke statt ${L0}`);
    const M = alt[0].b, M2 = neu[0].b;
    pruefe(alt.every((r) => nahe(r.b, M, 1e-3)) && neu.every((r, i) => nahe(r.b, M2, 1e-3) && nahe(r.x, neu[0].x + i * M2, 0.01)), `${wo}: die Meterstücke sind nicht gleich lang oder liegen nicht aneinander`);
    // Jedes Meterstück: 1000 mm werden um α · ΔT mm länger, gezeichnet faktor-fach.
    pruefe(faktor === 100 && nahe(M2 / M - 1, (faktor * a * dT) / 1000, 1e-5), `${wo}: die gezeichnete Verlängerung ist nicht ${faktor}-fach`);
    const dl = sv.linien.find((l) => l.rolle === "dl");
    pruefe(dT === 0 ? !dl : !!dl && nahe(dl.x2 - dl.x1, L0 * (M2 - M), 0.02), `${wo}: die Gesamtverlängerung ist nicht L₀-mal die eines Meters`);
    pruefe(trifft(await rolle(page, "#la-bilanz", "je-meter"), a * dT, 2) && trifft(await rolle(page, "#la-bilanz", "dl"), L0 * a * dT, 2), `${wo}: die Bilanz stimmt nicht`);
  }
  const b = await kasten(page, "sec-laenge");
  pruefe(b.includes(`um ${de(a * 50, 2)} mm länger`) && b.includes(`3 · ${de(a * 50, 2)} mm = ${de(3 * a * 50, 2)} mm`), "Länge: das Beispiel rechnet falsch");
}

// ════════════════ 3. Der Stoff entscheidet ════════════════

async function stoff(page) {
  const tab = await tabelle(page, "sec-alpha");
  pruefe(tab.length === 5, `Stoff: die Tabelle hat ${tab.length} Stoffe`);
  for (const [n, a] of tab) pruefe(nahe(z(a), ALPHA[n], 1e-12), `Stoff: Tabelle nennt für ${n} α = ${a}`);
  for (const [Lw, dTw] of [[10, 50], [1, 1], [100, 80], [37, 13], [5, 0]]) {
    const L0 = await setzeRegler(page, "al-l", Lw), dT = await setzeRegler(page, "al-dt", dTw), wo = `Stoff ${L0} m, ${dT} K`;
    const sv = await lies(page, '#al-mount g[data-diagramm="balken"]'), w = weltY(sv);
    const balken = sv.rects.filter((r) => r.rolle === "balken");
    pruefe(balken.length === 5, `${wo}: ${balken.length} Balken statt 5`);
    for (const [n, a] of Object.entries(ALPHA)) {
      const r = balken.find((x) => x.stoff === n), dL = a * L0 * dT;
      pruefe(!!r && nahe(r.h / w.sy, dL, 1e-3 * Math.max(1, dL)) && nahe(w.Y(r.y + r.h), 0, 1e-6 + 1e-3 * dL), `${wo}: der Balken ${n} ist nicht ${dL.toFixed(4)} mm hoch`);
      pruefe(trifft(await rolle(page, "#al-bilanz", `dl-${n}`), dL, 3), `${wo}: die Bilanz für ${n} stimmt nicht`);
    }
  }
  const b = await kasten(page, "sec-alpha");
  pruefe(b.includes(`= ${de(ALPHA.Stahl * 30 * 40, 1)} mm`) && b.includes(`${de(30 + (ALPHA.Stahl * 30 * 40) / 1000, 4)} m lang`), "Stoff: das Beispiel der Stahlschiene rechnet falsch");
}

// ════════════════ 4. Rückwärts ════════════════

async function rueckwaerts(page) {
  const gefunden = new Set();
  for (const stab of ["A", "B", "C"]) {
    await waehle(page, "rw-stab", stab);
    for (const dTw of [0, 5, 40, 80]) {
      const dT = await setzeRegler(page, "rw-dt", dTw), wo = `Rückwärts Stab ${stab}, ${dT} K`;
      const dL = await messuhr(page, "#rw-mount");
      if (dT === 0) {
        pruefe(nahe(dL, 0, 1e-6) && /Erst erwärmen/.test(await text(page, "#rw-bilanz")), `${wo}: ohne Erwärmung darf nichts bestimmt werden`);
        continue;
      }
      // α aus der Messung (2 m), dann in der eigenen Tabelle nachsehen.
      const a = dL / (2 * dT);
      const passt = Object.entries(ALPHA).filter(([, x]) => nahe(x, a, 2e-4)).map(([n]) => n);
      const genannt = await rolle(page, "#rw-bilanz", "stoff");
      pruefe(passt.length >= 1 && passt.includes(genannt), `${wo}: gemessen α ≈ ${a.toFixed(4)}, die Bilanz nennt ${genannt}`);
      pruefe(trifft(await rolle(page, "#rw-bilanz", "alpha"), a, 3), `${wo}: α in der Bilanz stimmt nicht`);
      gefunden.add(genannt);
    }
  }
  pruefe(gefunden.size === 3, `Rückwärts: die drei Stäbe sind nicht aus drei verschiedenen Stoffen (${[...gefunden].join(", ")})`);
  const b = await kasten(page, "sec-rueckwaerts");
  pruefe(nahe(9.6 / (ALPHA.Stahl * 20), 40, 1e-9) && b.includes("= 40 K") && b.includes(`Probe: 0,012 · 20 · 40 = ${de(ALPHA.Stahl * 20 * 40, 1)} mm`), "Rückwärts: das Beispiel rechnet falsch oder hat keine Probe");
}

// ════════════════ 5. Dehnungsfuge ════════════════

async function fuge(page) {
  for (const [st, Lw, thw] of [["stahl", 100, 10], ["stahl", 100, 40], ["stahl", 100, -20], ["aluminium", 200, -20], ["beton", 20, 35], ["aluminium", 50, 25]]) {
    await waehle(page, "fu-stoff", st);
    const L0 = await setzeRegler(page, "fu-l", Lw), th = await setzeRegler(page, "fu-theta", thw);
    const a = ALPHA[name(st)], s0 = a * L0 * 30, s = a * L0 * (40 - th), wo = `Fuge ${name(st)} ${L0} m, ${th} °C`;
    const sv = await lies(page, "#fu-mount");
    const bahn = sv.rects.find((r) => r.rolle === "fahrbahn"), lager = sv.rects.find((r) => r.rolle === "widerlager"), mst = sv.linien.find((l) => l.rolle === "massstab");
    const proMm = (mst.x2 - mst.x1) / mst.mm;
    const breite = (lager.x - (bahn.x + bahn.b)) / proMm;
    pruefe(nahe(breite, s, 0.01), `${wo}: die gezeichnete Fuge ist ${breite.toFixed(3)} mm statt ${s.toFixed(3)} mm`);
    const linie = sv.linien.find((l) => l.rolle === "fuge");
    pruefe(s < 1e-9 ? !linie : !!linie && nahe((linie.x2 - linie.x1) / proMm, s, 0.01), `${wo}: die Maßlinie der Fuge stimmt nicht`);
    pruefe(trifft(await rolle(page, "#fu-bilanz", "s0"), s0, 1) && trifft(await rolle(page, "#fu-bilanz", "s"), s, 1), `${wo}: die Bilanz stimmt nicht`);
    const t = await text(page, "#fu-text");
    pruefe(th === 40 ? /geschlossen/.test(t) : th < 10 ? /breiter/.test(t) : th > 10 ? /schmaler/.test(t) : /wie beim Bau/.test(t), `${wo}: der Text beschreibt die Fuge falsch`);
  }
  const b = await kasten(page, "sec-fuge");
  const s0 = ALPHA.Stahl * 100 * 30;
  pruefe(b.includes(`= ${de(s0, 0)} mm`) && b.includes(`= ${de(s0 + ALPHA.Stahl * 100 * 30, 0)} mm`), "Fuge: das Beispiel rechnet falsch");
}

// ════════════════ 6. Bimetall ════════════════

// Hub der Spitze eines Bogens der Länge l mit der Krümmung κ: ∫ sin(κ s) ds, numerisch.
function hubNumerisch(l, winkel) {
  const n = 4000, ds = l / n, k = winkel / l;
  let h = 0;
  for (let i = 0; i < n; i++) h += Math.sin(k * (i + 0.5) * ds) * ds;
  return h;
}
async function bimetall(page) {
  const L = 60, D = 0.5;
  let offenGesehen = false, zuGesehen = false;
  for (const thw of [20, 60, 100, 130, 140, 220]) {
    const th = await setzeRegler(page, "bm-theta", thw), dT = th - 20, wo = `Bimetall ${th} °C`;
    const lCu = L + (ALPHA.Kupfer * (L / 1000) * dT), lSt = L + (ALPHA.Stahl * (L / 1000) * dT);
    const theta = (lCu - lSt) / D, hub = hubNumerisch((lCu + lSt) / 2, theta), offen = hub >= 2;
    offen ? (offenGesehen = true) : (zuGesehen = true);
    const sv = await lies(page, "#bm-mount");
    const st = pfadPx(sv, "stahl"), cu = pfadPx(sv, "kupfer");
    const faktor = Number(((await rolle(page, "#bm-mount", "ueberhoehung")) || "").match(/(\d+)-fach/)?.[1]);
    pruefe(st.length > 20 && st.length === cu.length && st.every(([x, y], i) => nahe(Math.hypot(cu[i][0] - x, cu[i][1] - y), 6, 0.05)), `${wo}: die Streifen liegen nicht parallel aneinander`);
    // Gezeichneter Winkel an der Spitze: Richtung des letzten Stücks (Mitte des letzten von 60 Schritten).
    const [x1, y1] = st[st.length - 2], [x2, y2] = st[st.length - 1];
    const w = Math.atan2(-(y2 - y1), x2 - x1), wSoll = faktor * theta * (59.5 / 60);
    pruefe(faktor === 5 && nahe(w, wSoll, 3e-3), `${wo}: der gezeichnete Winkel ist ${w.toFixed(4)} statt ${faktor}-mal ${theta.toFixed(4)}`);
    // Kupfer (größeres α) liegt außen: Bei Krümmung nach oben liegt es unten.
    if (dT > 0) pruefe(cu[cu.length - 1][1] > st[st.length - 1][1] && w > 0, `${wo}: der Streifen krümmt sich nicht zur Stahlseite`);
    else pruefe(st.every(([, y]) => nahe(y, st[0][1], 1e-6)), `${wo}: bei 20 °C ist der Streifen nicht gerade`);
    // Kontakt: Unterkante der Kupferspitze (3 Bildpunkte nach außen) gegen Oberkante des Kontakts.
    const [cx, cy] = cu[cu.length - 1], ux = cx + 3 * Math.sin(w / (59.5 / 60)), uy = cy + 3 * Math.cos(w / (59.5 / 60));
    const k = sv.rects.find((r) => r.rolle === "kontakt"), an = sv.linien.find((l) => l.rolle === "anschlag");
    pruefe(k.offen === String(offen), `${wo}: der Kontakt ist ${k.offen === "true" ? "offen" : "geschlossen"}, nachgerechnet ${offen ? "offen" : "geschlossen"} (Hub ${hub.toFixed(3)} mm)`);
    if (offen) pruefe(nahe(k.y, an.y1, 0.5) && uy < k.y - 0.5, `${wo}: offen, aber der Kontakt hängt nicht am Anschlag oder berührt noch die Spitze`);
    else pruefe(nahe(k.y, uy, 0.6) && nahe(k.x + 8, ux, 0.6) && k.y >= an.y1 - 0.5, `${wo}: geschlossen, aber der Kontakt berührt die Spitze nicht oder steht über dem Anschlag`);
    pruefe(new RegExp(offen ? "offen" : "geschlossen").test(await rolle(page, "#bm-mount", "zustand")), `${wo}: die Beschriftung des Kontakts stimmt nicht`);
    const B_ = (r) => rolle(page, "#bm-bilanz", r);
    pruefe(trifft(await B_("l-cu"), lCu, 4) && trifft(await B_("l-st"), lSt, 4) && trifft(await B_("winkel"), theta, 4) && trifft(await B_("grad"), (theta * 180) / Math.PI, 1) && trifft(await B_("hub"), hub, 2), `${wo}: die Bilanz stimmt nicht`);
  }
  pruefe(offenGesehen && zuGesehen, "Bimetall: der Kontakt öffnet im Reglerbereich nie oder ist immer offen");
  const b = await kasten(page, "sec-bimetall");
  const dCu = ALPHA.Kupfer * 0.06 * 100, dSt = ALPHA.Stahl * 0.06 * 100, th = (dCu - dSt) / D;
  pruefe(b.includes(`um ${de(dCu, 3)} mm`) && b.includes(`um ${de(dSt, 3)} mm`) && b.includes(`Unterschied von ${de(dCu - dSt, 2)} mm`) && b.includes(`Winkel von ${de(th, 2)}`) && b.includes(`etwa ${de((th * 180) / Math.PI, 1)}°`), "Bimetall: das Beispiel rechnet falsch");
}

// ════════════════ 7. Volumen und Thermometer ════════════════

async function volumen(page) {
  const tab = await tabelle(page, "sec-volumen");
  pruefe(tab.length === 5, `Volumen: die Tabelle hat ${tab.length} Stoffe`);
  for (const [n, g] of tab) pruefe(nahe(z(g), GAMMA[n.split(" ")[0]], 1e-12), `Volumen: Tabelle nennt für ${n} γ = ${g}`);
  for (const [st, V0, A, dT] of [["ethanol", 0.5, 0.2, 10], ["ethanol", 1, 0.1, 20], ["quecksilber", 0.3, 0.45, 7], ["wasser", 0.8, 0.25, 0], ["glycerin", 0.1, 0.5, 13]]) {
    await waehle(page, "fl-stoff", st);
    const v = await setzeRegler(page, "fl-v", V0), a = await setzeRegler(page, "fl-a", A), t = await setzeRegler(page, "fl-dt", dT);
    const g = GAMMA[name(st)], dV = g * v * t, h = dV / a, wo = `Volumen ${st} ${v} ml, ${a} mm², ${t} K`;
    const sk = await page.evaluate(() => [...document.querySelectorAll('#fl-mount line[data-wert]')].map((l) => [Number(l.dataset.wert), Number(l.getAttribute("y1"))]));
    const proMm = (sk[0][1] - sk[sk.length - 1][1]) / (sk[sk.length - 1][0] - sk[0][0]);
    const nullY = sk.find(([wert]) => wert === 0)[1];
    const saeule = (await lies(page, "#fl-mount")).rects.find((r) => r.rolle === "saeule");
    pruefe(!!saeule && nahe((nullY - saeule.y) / proMm, h, 0.01), `${wo}: die Säule steigt nicht um ${h.toFixed(3)} mm`);
    pruefe(trifft(await rolle(page, "#fl-bilanz", "dv"), dV, 3) && trifft(await rolle(page, "#fl-bilanz", "h"), h, 2) && trifft(await rolle(page, "#fl-bilanz", "je-k"), (g * v) / a, 3), `${wo}: die Bilanz stimmt nicht`);
  }
  // Der Würfel: Kante 1 m, 100 K Stahl — Volumen gerechnet, nicht abgeschrieben.
  const w = await kasten(page, "sec-volumen", "beispiel-box", 0), kante = 1 + (ALPHA.Stahl * 100) / 1000, V = kante ** 3;
  pruefe(w.includes(`= ${de(ALPHA.Stahl * 100, 1)} mm länger`) && w.includes(`${de(kante, 4)}³ ≈ ${de(V, 4)} m³`) && w.includes(`${de((V - 1) * 1000, 1)} Liter mehr`) && w.includes(`= ${de((10 * 10 * ALPHA.Stahl * 100) / 100, 1)} dm³`) && nahe((V - 1) * 1000 / 1.2, 3, 0.01),
    "Volumen: das Würfel-Beispiel rechnet falsch");
  const b = await kasten(page, "sec-volumen", "beispiel-box", 1);
  pruefe(b.includes("= 5,5 mm³") && nahe(1.1 * 0.5 * 10, 5.5, 1e-9) && b.includes("= 27,5 mm") && nahe(5.5 / 0.2, 27.5, 1e-9) && b.includes("2,75 mm je Kelvin"), "Volumen: das Thermometer-Beispiel rechnet falsch");
}

// ════════════════ Kontrollfragen ════════════════

async function quizze(page) {
  const zahlIn = (o) => z((o.match(/[\d,]+/) || [""])[0]);
  const kleiner = ALPHA.Stahl < ALPHA.Aluminium ? "Stahl" : "Aluminium";
  await pruefeQuizze(page, pruefe, 7, {
    "quiz-messung": (o) => nahe(zahlIn(o), (0.34 * 60) / 20, 1e-9),
    "quiz-laenge": (o) => nahe(zahlIn(o), 4 * 0.6, 1e-9),
    "quiz-alpha": (o) => nahe(zahlIn(o), ALPHA.Aluminium * 50 * 30, 1e-9) && / mm$/.test(o),
    "quiz-rueckwaerts": (o) => nahe(ALPHA[o] ?? NaN, 1.7 / (2 * 50), 1e-12),
    "quiz-fuge": (o) => nahe(zahlIn(o), ALPHA.Stahl * 50 * (40 - 10), 1e-9),
    "quiz-bimetall": (o) => o === `Zur ${kleiner}seite`,
    "quiz-volumen": (o) => /doppelt so hoch/.test(o),
  });
}

// ════════════════ Übungsaufgaben ════════════════

// Gemessen mit werkzeug-streuung.js (UPLANT_ZUEGE=20): verschieden in 200 Würfen und geschätzte Größe des
// Vorrats — E1 180/200 (n ≈ 928), E2 153/200 (n ≈ 354), M1 177/200 (n ≈ 798), M2 185/200 (n ≈ 1260),
// S1 144/200 (n ≈ 286), S2 144/200 (n ≈ 286), K1 173/200 (n ≈ 669), K2 167/200 (n ≈ 535).
const RUNDEN = 20;
const SCHRANKE = [17, 15, 16, 17, 15, 15, 16, 16];
const TOL = 0.0051, TOL4 = 0.000051, TOL3 = 0.00051;
const FASSUNGEN = new Set();
const DING = { "Eine Stahlschiene": "Stahl", "Eine Aluminiumleitung": "Aluminium", "Ein Kupferrohr": "Kupfer" };
async function aufgaben(page) {
  const auf = [
    ["E1 Wie viel länger?", (f) => {
      const m = f.match(/Ein Stab aus (\S+) ist bei (−?\d+) °C genau (\d+) m lang\. .*auf (\d+) °C erwärmt\? \(α = ([\d,]+)/);
      if (!m) return null;
      const a = ALPHA[m[1]], t1 = z(m[2]), L0 = Number(m[3]), t2 = Number(m[4]), dT = t2 - t1;
      if (!nahe(z(m[5]), a, 1e-12)) return null;
      return { richtig: r2(a * L0 * dT), toleranz: TOL, falsch: [[a * L0 * t2, "ΔT ist der Temperaturunterschied"], [a * L0, "Verlängerung bei nur 1 K"], [a * dT, "L₀ fehlt"], [(a * L0 * dT) / 1000, "Gefragt ist die Verlängerung in Millimetern"]] };
    }],
    ["E2 Die Messreihe fortsetzen", (f) => {
      const m = f.match(/ein (\d+) m langes Rohr aus (\S+) erwärmt\. Bei einer Erwärmung um (\d+) K ist es ([\d,]+) mm länger geworden\. Um wie viele Millimeter wird es bei einer Erwärmung um (\d+) K länger\?/);
      if (!m) return null;
      const L0 = Number(m[1]), a = ALPHA[m[2]], d1 = Number(m[3]), x1 = z(m[4]), d2 = Number(m[5]);
      if (!nahe(x1, a * L0 * d1, 1e-9)) return null;
      return { richtig: (x1 * d2) / d1, toleranz: TOL, falsch: [[x1, "bleibt nicht gleich"], [(x1 * d1) / d2, "Verhältnis umgedreht"], [x1 * d2, "Erst die Verlängerung je Kelvin"]] };
    }],
    ["M1 Die neue Länge", (f) => {
      const m = f.match(/(Eine Stahlschiene|Eine Aluminiumleitung|Ein Kupferrohr) ist bei (−?\d+) °C genau (\d+) m lang\. Wie lang ist sie bei (−?\d+) °C\?.*\(α = ([\d,]+)/);
      if (!m) return null;
      const a = ALPHA[DING[m[1]]], t1 = z(m[2]), L0 = Number(m[3]), t2 = z(m[4]);
      if (!nahe(z(m[5]), a, 1e-12)) return null;
      const dL = a * L0 * (t2 - t1), warm = t2 > t1;
      return { richtig: L0 + dL / 1000, toleranz: TOL4,
        falsch: [[L0 + dL, "Einheiten"], [L0 + dL / 100, "1 m sind 1000 mm"], [L0 - dL / 1000, warm ? "Beim Erwärmen wird" : "Beim Abkühlen wird"], [dL / 1000, "nur die Längenänderung"], [t1 === 0 ? NaN : L0 + (a * L0 * t2) / 1000, "ΔT ist der Temperaturunterschied"]],
        pruefe: () => FASSUNGEN.add(warm ? "warm" : "kalt") };
    }],
    ["M2 Länger und wärmer", (f) => {
      const m = f.match(/Ein (\d+) m langes Rohr aus (\S+) wird bei einer Erwärmung um (\d+) K um ([\d,]+) mm länger\. Um wie viele Millimeter wird ein (\d+) m langes Rohr aus \S+ länger, das um (\d+) K erwärmt wird\?/);
      if (!m) return null;
      const L1 = Number(m[1]), a = ALPHA[m[2]], d1 = Number(m[3]), x1 = z(m[4]), L2 = Number(m[5]), d2 = Number(m[6]);
      if (!nahe(x1, a * L1 * d1, 1e-9)) return null;
      return { richtig: a * L2 * d2, toleranz: TOL,
        falsch: [[(x1 * L2) / L1, "Die Erwärmung ist auch anders"], [(x1 * d2) / d1, "Die Länge ist auch anders"], [x1, "bleibt die Verlängerung nicht gleich"], [(x1 * L1 * d2) / (L2 * d1), "Längenverhältnis umgedreht"]] };
    }],
    ["S1 Um wie viel wärmer?", (f) => {
      const m = f.match(/Ein (\d+) m langer Stab aus (\S+) ist nach dem Erwärmen ([\d,]+) mm länger\. .*\(α = ([\d,]+)/);
      if (!m) return null;
      const L0 = Number(m[1]), a = ALPHA[m[2]], dL = z(m[3]);
      if (!nahe(z(m[4]), a, 1e-12)) return null;
      const dT = dL / (a * L0);
      return { richtig: dT, toleranz: TOL, falsch: [[dL * a * L0, "Rückwärts wird geteilt"], [dL / a, "L₀ fehlt"], [(dL * 1000) / (a * L0), "ΔL steht schon in Millimetern"]],
        pruefe: (frage, rueck) => pruefe(/Probe:/.test(rueck) && Number.isInteger(Math.round(dT * 1e6) / 1e6), `S1: keine Probe oder krummes ΔT — „${frage}“`) };
    }],
    ["S2 Woraus ist der Draht?", (f) => {
      const m = f.match(/Ein (\d+) m langer Draht aus einem unbekannten Stoff wird von (\d+) °C auf (\d+) °C erwärmt und ist danach ([\d,]+) mm länger\./);
      if (!m) return null;
      const L0 = Number(m[1]), t1 = Number(m[2]), t2 = Number(m[3]), dL = z(m[4]), dT = t2 - t1, a = dL / (L0 * dT);
      const stoffe = Object.entries(ALPHA).filter(([, x]) => nahe(x, a, 1e-9)).map(([n]) => n);
      return { richtig: a, toleranz: TOL3,
        falsch: [[dL / L0, "ΔT fehlt"], [dL / dT, "L₀ fehlt"], [dL / (L0 * t2), "ΔT ist der Temperaturunterschied"], [(L0 * dT) / dL, "Bruch umgedreht"]],
        pruefe: (frage, rueck) => pruefe(/Probe:/.test(rueck) && stoffe.length >= 1 && stoffe.some((n) => rueck.includes(`laut Tabelle ${n}`)), `S2: keine Probe, kein Stoff aus der Tabelle oder der falsche — „${frage}“`) };
    }],
    ["K1 Die Fuge im Winter", (f) => {
      const m = f.match(/Eine (\d+) m lange (Stahlbrücke|Betonbrücke|Fußgängerbrücke aus Aluminium) wird bei (\d+) °C gebaut\. .*bei (\d+) °C gerade schließt\. .*Wintertag mit (−\d+) °C\? \(α = ([\d,]+)/);
      if (!m) return null;
      const L0 = Number(m[1]), a = ALPHA[{ Stahlbrücke: "Stahl", Betonbrücke: "Beton", "Fußgängerbrücke aus Aluminium": "Aluminium" }[m[2]]], bau = Number(m[3]), max = Number(m[4]), min = z(m[5]);
      if (!nahe(z(m[6]), a, 1e-12)) return null;
      return { richtig: r2(a * L0 * (max - min)), toleranz: TOL,
        falsch: [[a * L0 * (max - bau), "Das ist die Fuge beim Bau"], [a * L0 * (bau - min), "Das ist nur, um wie viel"], [a * L0 * (max - 2 * bau + min), "addiert, nicht abgezogen"], [a * L0 * (max + min), "Vorzeichen"]] };
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
    const [n, deute] = auf[i];
    await pruefeAufgabe(page, bericht, { nr: i + 1, name: n, runden: RUNDEN, mindestensVerschieden: SCHRANKE[i], deute });
  }
  // Erwärmen und Abkühlen kommen beide vor — fiele eine Fassung durch eine Kollision weg, bliebe das sonst unbemerkt.
  pruefe(FASSUNGEN.size === 2, `M1: nur die Fassungen ${[...FASSUNGEN].join(", ")} gezogen`);
}

// ════════════════ Gerüst ════════════════

const ABSCHNITTE = ["sec-messung", "sec-laenge", "sec-alpha", "sec-rueckwaerts", "sec-fuge", "sec-bimetall", "sec-volumen"];
async function geruest(page) {
  await pruefeGeruest(page, pruefe, {
    seite: SEITE, abschnitte: ABSCHNITTE, ziele: 7, brot: "2. Längenausdehnung",
    karten: [["physik/klasse-8/thermische-ausdehnung/index.html", "laengenausdehnung.html", "2. Längenausdehnung"]],
    // Kein Vorgriff: Kelvin ist hier nur die Einheit einer Temperaturdifferenz; die absolute Temperatur
    // entsteht erst in Thema 3 aus dem Gesetz von Gay-Lussac.
    ohneAbsolut: ABSCHNITTE,
    formeln: ["ΔL = α · L0 · ΔT", "ΔV = γ · V0 · ΔT", "s0 = α · L0 · (ϑmax − ϑBau)", "Bimetall", "Messreihe"],
  });
  // Kelvin wird in Abschnitt 1 als Einheit einer Temperaturdifferenz eingeführt — als Unterschied, nicht als Skala.
  const s1 = await page.evaluate(() => document.getElementById("sec-messung").innerText);
  pruefe(/1 K ist ein Unterschied von 1 °C/.test(s1), "Gerüst: Abschnitt 1 führt Kelvin nicht als Einheit einer Temperaturdifferenz ein");
}

fuehreAus(bericht, SEITE, [
  ["geruest", geruest], ["messung", messung], ["laenge", laenge], ["stoff", stoff], ["rueckwaerts", rueckwaerts], ["fuge", fuge],
  ["bimetall", bimetall], ["volumen", volumen], ["quizze", quizze], ["aufgaben", aufgaben],
], ".ta-kurve, .ta-achse, .ta-mass, .ta-streifen, .ta-feder, .ta-skala");
