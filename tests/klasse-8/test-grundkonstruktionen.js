// Fachliche Prüfung: Klasse 8, Geometrie, Thema 1 „Grundkonstruktionen und besondere Linien am
// Dreieck“.
//
// Die Seite behauptet vier Sätze — die drei Mittelsenkrechten, Winkelhalbierenden,
// Seitenhalbierenden und Höhen schneiden sich jeweils in einem Punkt — und eine Reihe von
// Eigenschaften dieser Punkte. Nichts davon wird abgelesen, alles nachgerechnet:
//
//   1. Die ZEICHNUNGEN stimmen. Die Ecken werden aus dem SVG gelesen, der Maßstab aus der
//      bekannten Seite c zurückgerechnet, und dann wird geprüft, dass M von allen Ecken, I von
//      allen Seiten gleich weit weg ist, dass S die Seitenhalbierenden 2 : 1 teilt, dass H auf
//      allen drei Höhen liegt und M, S, H auf einer Geraden. Über viele Reglerstellungen,
//      spitz-, recht- und stumpfwinklig.
//   2. Die TEXTE sagen, was die Zeichnung zeigt: „außerhalb“ nur, wenn M bzw. H wirklich außen
//      liegt; „gemessen“ an jeder schrägen Länge.
//   3. Die AUFGABEN rechnen richtig — von beiden Seiten, mit jedem Fehlerwert.
//
// Wie auf den Flächeninhalten: kein Pythagoras, keine Wurzel.

"use strict";

const { neuerBericht } = require("../lib/pruefen");
const { starteBrowser, neueSeite, oeffne, setzeRegler, text } = require("../lib/seite");
const { pruefeNotation } = require("../lib/notation");
const { pruefeKontrast } = require("../lib/kontrast");
const { pruefeAufgabe, zahl, zahlen } = require("../lib/aufgaben");
const fs = require("fs");
const path = require("path");

const bericht = neuerBericht();
const { pruefe } = bericht;
const SEITE = "/mathematik/klasse-8/geometrie/grundkonstruktionen.html";
const WURZEL = path.resolve(__dirname, "..", "..");

const de = (x, stellen = 2) => Number(x.toFixed(stellen)).toLocaleString("de-DE", { maximumFractionDigits: stellen });
const ab = (p, q) => Math.hypot(q.x - p.x, q.y - p.y);
const RAD = Math.PI / 180;

// Abstand eines Punktes von der GERADEN durch Q und R.
function abstandGerade(P, Q, R) {
  return Math.abs((R.x - Q.x) * (P.y - Q.y) - (R.y - Q.y) * (P.x - Q.x)) / ab(Q, R);
}
// Innenwinkel bei V zwischen den Strahlen zu P und Q, in Grad.
function winkel(V, P, Q) {
  const u = { x: P.x - V.x, y: P.y - V.y }, w = { x: Q.x - V.x, y: Q.y - V.y };
  return Math.acos((u.x * w.x + u.y * w.y) / (Math.hypot(u.x, u.y) * Math.hypot(w.x, w.y))) / RAD;
}
// Liegt q im Dreieck (Teilflächen-Vergleich)? spielraum in Bildpunkten.
function flaeche(A, B, C) {
  return Math.abs((B.x - A.x) * (C.y - A.y) - (C.x - A.x) * (B.y - A.y)) / 2;
}
function imDreieck(q, A, B, C, spielraum = 1) {
  const teile = flaeche(q, A, B) + flaeche(q, B, C) + flaeche(q, C, A);
  return teile - flaeche(A, B, C) <= spielraum * (ab(A, B) + ab(B, C) + ab(C, A));
}

// Alles, was eine Zeichnung trägt: benannte Punkte, Linien und Kreise mit ihrer Rolle.
async function lies(page, mountId) {
  return page.evaluate((id) => {
    const svg = document.querySelector(`#${id} svg`);
    const punkte = Object.fromEntries([...svg.querySelectorAll(".th-punkt-gruppe")].map((g) => {
      const c = g.querySelector("circle");
      return [g.dataset.name, { x: +c.getAttribute("cx"), y: +c.getAttribute("cy") }];
    }));
    const linien = [...svg.querySelectorAll("line")].map((l) => ({
      rolle: l.dataset.rolle || "", x1: +l.getAttribute("x1"), y1: +l.getAttribute("y1"), x2: +l.getAttribute("x2"), y2: +l.getAttribute("y2"),
    }));
    const kreise = [...svg.querySelectorAll("circle[data-rolle]")].map((c) => ({
      rolle: c.dataset.rolle, x: +c.getAttribute("cx"), y: +c.getAttribute("cy"), r: +c.getAttribute("r"),
    }));
    return { punkte, linien, kreise, viewBox: svg.getAttribute("viewBox") };
  }, mountId);
}
const enden = (l) => [{ x: l.x1, y: l.y1 }, { x: l.x2, y: l.y2 }];

// Die Dreiecke, an denen geprüft wird: spitz-, recht- und stumpfwinklig, gleichschenklig und
// gleichseitig, dazu beide Anschläge der Regler.
const DREIECKE = [
  [7, 55, 65], [7, 50, 40], [6, 90, 45], [8, 30, 25], [5, 110, 30], [9, 20, 20],
  [6, 60, 60], [7, 70, 70], [4, 45, 45], [9, 120, 40], [5.5, 35, 80],
];
function art(alpha, beta) {
  const g = 180 - alpha - beta, m = Math.max(alpha, beta, g);
  return m === 90 ? "recht" : m > 90 ? "stumpf" : "spitz";
}

async function stelleDreieck(page, prefix, c, alpha, beta) {
  await setzeRegler(page, prefix + "-c", c);
  await setzeRegler(page, prefix + "-alpha", alpha);
  return setzeRegler(page, prefix + "-beta", beta);
}

// Ecken lesen und Winkel sowie Maßstab gegen die Reglerwerte prüfen.
function pruefeEcken(z, wo, c, alpha, beta) {
  const { A, B, C } = z.punkte;
  if (!A || !B || !C) { pruefe(false, `${wo}: eine Ecke fehlt`); return null; }
  const a = winkel(A, B, C), b = winkel(B, C, A);
  pruefe(Math.abs(a - alpha) < 0.3 && Math.abs(b - beta) < 0.3,
    `${wo}: gezeichnet α ≈ ${de(a, 1)}°, β ≈ ${de(b, 1)}° statt ${alpha}°, ${beta}°`);
  pruefe(Math.abs(A.y - B.y) < 0.5, `${wo}: die Seite c liegt nicht waagerecht`);
  return { A, B, C, skala: ab(A, B) / c };
}

// ── Abschnitt 1: Mittelsenkrechte ─────────────────────────────────────────
async function mittelsenkrechte(page) {
  for (const g of [4, 4.5, 5, 6, 9]) {
    await setzeRegler(page, "ms-g", g);
    for (const wunsch of [2.5, 3, 4.5, 6, 9]) {
      const r = await setzeRegler(page, "ms-r", wunsch);
      const wo = `Mittelsenkrechte (AB = ${de(g)}, r = ${de(r)})`;
      // Regler lügen nicht: r muss größer als die halbe Strecke sein und auf dem Raster liegen.
      pruefe(r > g / 2 && Math.abs(r * 2 - Math.round(r * 2)) < 1e-9, `${wo}: der Regler steht auf ${r} — nicht größer als ${g / 2} oder nicht auf dem Raster`);
      if (wunsch > g / 2) pruefe(r === wunsch, `${wo}: der Wunschwert ${wunsch} wurde verstellt, obwohl er zulässig ist`);
      const z = await lies(page, "ms-mount");
      const { A, B } = z.punkte;
      const S1 = z.punkte["S₁"], S2 = z.punkte["S₂"];
      const skala = ab(A, B) / g;
      for (const [n, S] of [["S₁", S1], ["S₂", S2]]) {
        pruefe(Math.abs(ab(S, A) / skala - r) < 0.02 && Math.abs(ab(S, B) / skala - r) < 0.02,
          `${wo}: ${n} ist ${de(ab(S, A) / skala)} cm von A und ${de(ab(S, B) / skala)} cm von B entfernt statt je ${de(r)} cm`);
      }
      // Die Zirkelkreise haben wirklich den Radius r und die Mittelpunkte A, B.
      for (const [rolle, M] of [["zirkel-a", A], ["zirkel-b", B]]) {
        const k = z.kreise.find((x) => x.rolle === rolle);
        pruefe(!!k && ab(k, M) < 0.5 && Math.abs(k.r / skala - r) < 0.02, `${wo}: der Zirkelkreis ${rolle} passt nicht zu r`);
      }
      // Die gezeichnete Mittelsenkrechte geht durch S₁, S₂ und die Mitte und steht senkrecht auf AB.
      const ms = z.linien.find((l) => l.rolle === "mittelsenkrechte");
      const [P, Q] = enden(ms);
      for (const X of [S1, S2, z.punkte.M]) pruefe(abstandGerade(X, P, Q) < 0.5, `${wo}: ein Punkt liegt nicht auf der Mittelsenkrechten`);
      pruefe(Math.abs(ab(A, z.punkte.M) - ab(z.punkte.M, B)) < 0.5, `${wo}: M ist nicht die Mitte von AB`);
      const cos = ((Q.x - P.x) * (B.x - A.x) + (Q.y - P.y) * (B.y - A.y)) / (ab(P, Q) * ab(A, B));
      pruefe(Math.abs(cos) < 1e-3, `${wo}: die Mittelsenkrechte steht nicht senkrecht auf AB`);
      const bilanz = await text(page, "#ms-bilanz");
      pruefe(bilanz.includes(`r = ${de(r)} cm`), `${wo}: die Bilanz nennt r nicht — „${bilanz}“`);
      pruefe(bilanz.includes(`AM = MB = ${de(g / 2)} cm`), `${wo}: die Bilanz nennt die halbe Strecke nicht — „${bilanz}“`);
    }
  }
  // Derselbe Wert zweimal eingestellt: dasselbe Bild.
  await setzeRegler(page, "ms-g", 6); await setzeRegler(page, "ms-r", 5);
  const eins = await page.evaluate(() => document.getElementById("ms-mount").innerHTML);
  await setzeRegler(page, "ms-r", 7); await setzeRegler(page, "ms-r", 5);
  pruefe(eins === await page.evaluate(() => document.getElementById("ms-mount").innerHTML), "Mittelsenkrechte: derselbe Reglerwert liefert zwei verschiedene Bilder");

  // Der Punkt-Test.
  for (const px of [-1, 1, 3, 4.5, 7]) {
    for (const py of [-3, 0, 2]) {
      await setzeRegler(page, "mp-x", px);
      await setzeRegler(page, "mp-y", py);
      const wo = `Punkt P (${px} | ${py})`;
      const z = await lies(page, "mp-mount");
      const { A, B, P } = z.punkte;
      const skala = ab(A, B) / 6;
      const pa = ab(P, A) / skala, pb = ab(P, B) / skala;
      const bilanz = await text(page, "#mp-bilanz");
      pruefe(bilanz.includes(de(pa)) && bilanz.includes(de(pb)), `${wo}: die Bilanz nennt ${de(pa)} und ${de(pb)} nicht — „${bilanz}“`);
      pruefe(/gemessen/.test(bilanz), `${wo}: schräge Längen ohne „gemessen“`);
      const t = await text(page, "#mp-text");
      const auf = Math.abs(pa - pb) < 0.01;
      pruefe(/liegt auf der Mittelsenkrechten/.test(t) === auf, `${wo}: der Text passt nicht zu PA = ${de(pa)}, PB = ${de(pb)} — „${t}“`);
    }
  }
}

// ── Abschnitt 2: Umkreis ──────────────────────────────────────────────────
async function umkreis(page) {
  for (const [c, alpha, betaW] of DREIECKE) {
    await setzeRegler(page, "uk-schritt", 3);
    const beta = await stelleDreieck(page, "uk", c, alpha, betaW);
    const wo = `Umkreis (c = ${c}, α = ${alpha}°, β = ${beta}°)`;
    const z = await lies(page, "uk-mount");
    const e = pruefeEcken(z, wo, c, alpha, beta);
    if (!e) continue;
    const { A, B, C, skala } = e;
    const M = z.punkte.M;
    const r = [ab(M, A), ab(M, B), ab(M, C)];
    pruefe(Math.max(...r) - Math.min(...r) < 0.6, `${wo}: M ist nicht von allen Ecken gleich weit entfernt (${r.map((x) => de(x / skala)).join(" / ")} cm)`);
    const k = z.kreise.find((x) => x.rolle === "umkreis");
    pruefe(!!k && ab(k, M) < 0.5 && Math.abs(k.r - r[0]) < 0.6, `${wo}: der Umkreis hat nicht M als Mittelpunkt und MA als Radius`);
    // Jede Mittelsenkrechte: durch die Seitenmitte, senkrecht zur Seite, durch M.
    for (const [n, P, Q] of [["c", A, B], ["a", B, C], ["b", C, A]]) {
      const l = z.linien.find((x) => x.rolle === "ms-" + n);
      if (!l) { pruefe(false, `${wo}: die Mittelsenkrechte m_${n} fehlt`); continue; }
      const [U, V] = enden(l);
      const mitte = { x: (P.x + Q.x) / 2, y: (P.y + Q.y) / 2 };
      pruefe(abstandGerade(mitte, U, V) < 0.5 && abstandGerade(M, U, V) < 0.5, `${wo}: m_${n} geht nicht durch die Seitenmitte und M`);
      const cos = ((V.x - U.x) * (Q.x - P.x) + (V.y - U.y) * (Q.y - P.y)) / (ab(U, V) * ab(P, Q));
      pruefe(Math.abs(cos) < 1e-3, `${wo}: m_${n} steht nicht senkrecht auf ${n}`);
    }
    // Die Lage von M und was der Text dazu sagt.
    const a = art(alpha, beta);
    const innen = imDreieck(M, A, B, C, 0.02) ;
    const aufSeite = [[A, B], [B, C], [C, A]].some(([P, Q]) => Math.abs(ab(P, M) + ab(M, Q) - ab(P, Q)) < 0.5);
    pruefe(a === "spitz" ? innen && !aufSeite : a === "recht" ? aufSeite : !innen,
      `${wo}: M liegt ${innen ? "innen" : "außen"}${aufSeite ? " auf einer Seite" : ""}, das Dreieck ist aber ${a}winklig`);
    const t = await text(page, "#uk-text");
    const soll = { spitz: /im Inneren/, recht: /Mitte der längsten Seite/, stumpf: /außerhalb/ }[a];
    pruefe(soll.test(t), `${wo}: der Text beschreibt die Lage von M nicht passend (${a}winklig) — „${t}“`);
    const bilanz = await text(page, "#uk-bilanz");
    pruefe(bilanz.includes(de(r[0] / skala)) && /gemessen/.test(bilanz), `${wo}: die Bilanz nennt den gemessenen Radius ${de(r[0] / skala)} cm nicht — „${bilanz}“`);
    pruefe(bilanz.includes(`γ = ${180 - alpha - beta}°`), `${wo}: γ fehlt oder ist falsch — „${bilanz}“`);
  }
  // Der Regler „Schritt“: erst eine, dann zwei Mittelsenkrechten; Kreis erst am Schluss.
  await stelleDreieck(page, "uk", 7, 55, 65);
  for (const s of [1, 2, 3]) {
    await setzeRegler(page, "uk-schritt", s);
    const z = await lies(page, "uk-mount");
    const anzahl = z.linien.filter((l) => l.rolle.startsWith("ms-")).length;
    pruefe(anzahl === s, `Umkreis, Schritt ${s}: ${anzahl} Mittelsenkrechten gezeichnet`);
    pruefe(z.kreise.some((k) => k.rolle === "umkreis") === (s === 3), `Umkreis, Schritt ${s}: der Kreis ist ${s === 3 ? "nicht " : ""}zu sehen`);
    pruefe(!!z.punkte.M === (s >= 2), `Umkreis, Schritt ${s}: M ist ${s >= 2 ? "nicht " : ""}zu sehen`);
  }
  // Regler lügen nicht: γ ≥ 20°, β wird begrenzt und zurückgeschrieben.
  const beta = await stelleDreieck(page, "uk", 7, 120, 120);
  pruefe(beta === 40, `Umkreis: β = 120° bei α = 120° wurde auf ${beta} statt 40 begrenzt`);
  const angezeigt = await text(page, "#uk-beta-anzeige");
  pruefe(angezeigt === "40°", `Umkreis: die Anzeige nennt ${angezeigt} statt 40°`);
}

// ── Abschnitt 3: Winkelhalbierende ────────────────────────────────────────
async function winkelhalbierende(page) {
  await setzeRegler(page, "wh-schritt", 0);
  for (const alpha of [30, 45, 70, 90, 125, 150]) {
    await setzeRegler(page, "wh-alpha", alpha);
    for (const t of [1, 3, 6]) {
      await setzeRegler(page, "wh-p", t);
      const wo = `Winkelhalbierende (α = ${alpha}°, P bei ${t} cm)`;
      const z = await lies(page, "wh-mount");
      const S = z.punkte.S, P = z.punkte.P;
      const s1 = z.linien.find((l) => l.rolle === "schenkel-1"), s2 = z.linien.find((l) => l.rolle === "schenkel-2");
      const w = z.linien.find((l) => l.rolle === "winkelhalbierende");
      const E1 = enden(s1)[1], E2 = enden(s2)[1], W = enden(w)[1];
      pruefe(Math.abs(winkel(S, E1, E2) - alpha) < 0.3, `${wo}: der gezeichnete Winkel ist ${de(winkel(S, E1, E2), 1)}°`);
      pruefe(Math.abs(winkel(S, E1, W) - alpha / 2) < 0.3 && Math.abs(winkel(S, W, E2) - alpha / 2) < 0.3, `${wo}: die Winkelhalbierende halbiert nicht`);
      const d1 = abstandGerade(P, S, E1), d2 = abstandGerade(P, S, E2);
      pruefe(Math.abs(d1 - d2) < 0.5, `${wo}: P ist von den Schenkeln ${de(d1, 1)} und ${de(d2, 1)} Bildpunkte entfernt`);
      // Die Lote sind wirklich die Abstände: ihre Länge gleich dem Abstand zur Geraden.
      for (const [rolle, E] of [["lot-1", E1], ["lot-2", E2]]) {
        const l = z.linien.find((x) => x.rolle === rolle);
        pruefe(!!l && Math.abs(ab(...enden(l)) - abstandGerade(P, S, E)) < 0.5, `${wo}: ${rolle} ist nicht das Lot`);
      }
      const bilanz = await text(page, "#wh-bilanz");
      pruefe(/gemessen/.test(bilanz), `${wo}: die Abstände stehen ohne „gemessen“ da`);
      pruefe(bilanz.includes(`${de(alpha / 2, 1)}°`), `${wo}: die Bilanz nennt α : 2 nicht`);
    }
  }
  // Die Konstruktion: X, Y auf den Schenkeln mit SX = SY; Z mit XZ = YZ = SX; Z auf der Halbierenden.
  await setzeRegler(page, "wh-alpha", 70);
  for (const s of [1, 2, 3]) {
    await setzeRegler(page, "wh-schritt", s);
    const z = await lies(page, "wh-mount");
    const { S, X, Y } = z.punkte;
    pruefe(!!X && !!Y && Math.abs(ab(S, X) - ab(S, Y)) < 0.5, `Winkelhalbierende, Schritt ${s}: SX ≠ SY`);
    if (s >= 2) {
      const Z = z.punkte.Z;
      pruefe(!!Z && Math.abs(ab(X, Z) - ab(S, X)) < 0.5 && Math.abs(ab(Y, Z) - ab(S, X)) < 0.5, `Winkelhalbierende, Schritt ${s}: SXZY ist keine Raute`);
    }
    if (s === 3) {
      const w = z.linien.find((l) => l.rolle === "winkelhalbierende");
      pruefe(!!w && abstandGerade(z.punkte.Z, ...enden(w)) < 0.5, "Winkelhalbierende, Schritt 3: Z liegt nicht auf der Halbierenden");
    }
  }
  await setzeRegler(page, "wh-schritt", 0);
}

// ── Abschnitt 4: Inkreis ──────────────────────────────────────────────────
async function inkreis(page) {
  for (const [c, alpha, betaW] of DREIECKE) {
    const beta = await stelleDreieck(page, "ik", c, alpha, betaW);
    const wo = `Inkreis (c = ${c}, α = ${alpha}°, β = ${beta}°)`;
    const z = await lies(page, "ik-mount");
    const e = pruefeEcken(z, wo, c, alpha, beta);
    if (!e) continue;
    const { A, B, C, skala } = e;
    const I = z.punkte.I;
    const d = [abstandGerade(I, A, B), abstandGerade(I, B, C), abstandGerade(I, C, A)];
    pruefe(Math.max(...d) - Math.min(...d) < 0.5, `${wo}: I ist nicht von allen Seiten gleich weit entfernt (${d.map((x) => de(x / skala)).join(" / ")} cm)`);
    pruefe(imDreieck(I, A, B, C, 0), `${wo}: I liegt außerhalb`);
    const k = z.kreise.find((x) => x.rolle === "inkreis");
    pruefe(!!k && ab(k, I) < 0.5 && Math.abs(k.r - d[0]) < 0.5, `${wo}: der Inkreis hat nicht I als Mittelpunkt und ρ als Radius`);
    // Jede Winkelhalbierende halbiert ihren Winkel.
    for (const [n, E, P, Q] of [["alpha", A, B, C], ["beta", B, C, A], ["gamma", C, A, B]]) {
      const l = z.linien.find((x) => x.rolle === "wh-" + n);
      const W = enden(l)[1];
      pruefe(Math.abs(winkel(E, P, W) - winkel(E, W, Q)) < 0.3, `${wo}: w_${n} halbiert den Winkel nicht`);
      pruefe(abstandGerade(W, P, Q) < 0.5, `${wo}: w_${n} endet nicht auf der Gegenseite`);
    }
    const bilanz = await text(page, "#ik-bilanz");
    pruefe(bilanz.includes(de(d[0] / skala)) && /gemessen/.test(bilanz), `${wo}: die Bilanz nennt ρ ≈ ${de(d[0] / skala)} cm nicht — „${bilanz}“`);
  }
}

// ── Abschnitt 5: Seitenhalbierende und Schwerpunkt ───────────────────────
async function schwerpunkt(page) {
  for (const alle of [false, true]) {
    await page.evaluate((an) => { const e = document.getElementById("sh-alle"); e.checked = an; e.dispatchEvent(new Event("input")); }, alle);
    for (const [c, alpha, betaW] of DREIECKE) {
      const beta = await stelleDreieck(page, "sh", c, alpha, betaW);
      const wo = `Schwerpunkt (c = ${c}, α = ${alpha}°, β = ${beta}°${alle ? ", alle" : ""})`;
      const z = await lies(page, "sh-mount");
      const e = pruefeEcken(z, wo, c, alpha, beta);
      if (!e) continue;
      const { A, B, C, skala } = e;
      const S = z.punkte.S;
      const soll = { x: (A.x + B.x + C.x) / 3, y: (A.y + B.y + C.y) / 3 };
      pruefe(ab(S, soll) < 0.5, `${wo}: S ist nicht der Schwerpunkt der Ecken`);
      const linien = z.linien.filter((l) => l.rolle.startsWith("sh-") && l.rolle.endsWith("-lang"));
      pruefe(linien.length === (alle ? 3 : 1), `${wo}: ${linien.length} Seitenhalbierende gezeichnet`);
      for (const [n, E, P, Q] of [["a", A, B, C], ["b", B, C, A], ["c", C, A, B]]) {
        if (!alle && n !== "a") continue;
        const lang = z.linien.find((x) => x.rolle === `sh-${n}-lang`), kurz = z.linien.find((x) => x.rolle === `sh-${n}-kurz`);
        const mitte = { x: (P.x + Q.x) / 2, y: (P.y + Q.y) / 2 };
        pruefe(ab(enden(lang)[0], E) < 0.5 && ab(enden(kurz)[1], mitte) < 0.5, `${wo}: s_${n} verbindet nicht Ecke und Seitenmitte`);
        pruefe(Math.abs(ab(...enden(lang)) - 2 * ab(...enden(kurz))) < 0.6, `${wo}: s_${n} wird nicht im Verhältnis 2 : 1 geteilt`);
      }
      const bilanz = await text(page, "#sh-bilanz");
      const lang = ab(A, S) / skala, kurz = ab(S, { x: (B.x + C.x) / 2, y: (B.y + C.y) / 2 }) / skala;
      pruefe(bilanz.includes(de(lang)) && bilanz.includes(de(kurz)) && /gemessen/.test(bilanz), `${wo}: die Bilanz nennt AS ≈ ${de(lang)} und SMₐ ≈ ${de(kurz)} nicht — „${bilanz}“`);
    }
  }
  const hinweis = await page.evaluate(() => document.getElementById("sec-schwerpunkt").innerText);
  pruefe(/gemessen/.test(hinweis) && /Klasse 9/.test(hinweis), "Schwerpunkt: das Verhältnis 2 : 1 ist nicht als gemessen und in Klasse 9 bewiesen ausgewiesen");
}

// ── Abschnitt 6: Höhen ────────────────────────────────────────────────────
async function hoehen(page) {
  for (const [c, alpha, betaW] of DREIECKE) {
    const beta = await stelleDreieck(page, "ho", c, alpha, betaW);
    const wo = `Höhen (c = ${c}, α = ${alpha}°, β = ${beta}°)`;
    const z = await lies(page, "ho-mount");
    const e = pruefeEcken(z, wo, c, alpha, beta);
    if (!e) continue;
    const { A, B, C } = e;
    const H = z.punkte.H;
    // H liegt auf allen drei Höhen: (H − Ecke) senkrecht zur Gegenseite.
    for (const [n, E, P, Q] of [["a", A, B, C], ["b", B, C, A], ["c", C, A, B]]) {
      const u = { x: H.x - E.x, y: H.y - E.y }, v = { x: Q.x - P.x, y: Q.y - P.y };
      const l = Math.hypot(u.x, u.y);
      if (l > 0.5) pruefe(Math.abs((u.x * v.x + u.y * v.y) / (l * Math.hypot(v.x, v.y))) < 2e-3, `${wo}: H liegt nicht auf h_${n}`);
      const h = z.linien.find((x) => x.rolle === "ho-" + n);
      const [U, F] = enden(h);
      pruefe(ab(U, E) < 0.5 && abstandGerade(F, P, Q) < 0.5, `${wo}: h_${n} geht nicht von der Ecke zur Gegengeraden`);
      // Ein Fußpunkt außerhalb der Seite braucht die gezeichnete Verlängerung.
      const t = ((F.x - P.x) * v.x + (F.y - P.y) * v.y) / (v.x * v.x + v.y * v.y);
      const aussen = t < -0.01 || t > 1.01;
      pruefe(aussen === z.linien.some((x) => x.rolle === "verlaengerung-" + n), `${wo}: der Fußpunkt von h_${n} liegt ${aussen ? "außen, aber die Seite ist nicht verlängert" : "innen, trotzdem ist verlängert"}`);
    }
    const a = art(alpha, beta);
    const inEcke = [A, B, C].some((E) => ab(E, H) < 0.5);
    const innen = imDreieck(H, A, B, C, 0.02);
    pruefe(a === "spitz" ? innen && !inEcke : a === "recht" ? inEcke : !innen, `${wo}: H liegt ${innen ? "innen" : "außen"}, das Dreieck ist ${a}winklig`);
    const t = await text(page, "#ho-text");
    pruefe({ spitz: /im Inneren/, recht: /H = [ABC]/, stumpf: /außerhalb/ }[a].test(t), `${wo}: der Text passt nicht zu ${a}winklig — „${t}“`);
  }
}

// ── Abschnitt 7: Alle vier ────────────────────────────────────────────────
async function alle(page) {
  await page.evaluate(() => { const e = document.getElementById("al-euler"); e.checked = true; e.dispatchEvent(new Event("input")); });
  for (const [c, alpha, betaW] of DREIECKE) {
    const beta = await stelleDreieck(page, "al", c, alpha, betaW);
    const wo = `Alle vier (c = ${c}, α = ${alpha}°, β = ${beta}°)`;
    const z = await lies(page, "al-mount");
    const e = pruefeEcken(z, wo, c, alpha, beta);
    if (!e) continue;
    const { A, B, C } = e;
    const { M, I, S, H } = z.punkte;
    const rM = [ab(M, A), ab(M, B), ab(M, C)];
    pruefe(Math.max(...rM) - Math.min(...rM) < 0.6, `${wo}: M ist nicht die Umkreismitte`);
    const dI = [abstandGerade(I, A, B), abstandGerade(I, B, C), abstandGerade(I, C, A)];
    pruefe(Math.max(...dI) - Math.min(...dI) < 0.5, `${wo}: I ist nicht die Inkreismitte`);
    pruefe(ab(S, { x: (A.x + B.x + C.x) / 3, y: (A.y + B.y + C.y) / 3 }) < 0.5, `${wo}: S ist nicht der Schwerpunkt`);
    // Euler: S = M + (H − M) / 3, unabhängig nachgerechnet.
    pruefe(ab(S, { x: M.x + (H.x - M.x) / 3, y: M.y + (H.y - M.y) / 3 }) < 0.6, `${wo}: M, S, H liegen nicht im Verhältnis 1 : 2 auf einer Geraden`);
    const gleichseitig = alpha === 60 && beta === 60;
    if (gleichseitig) pruefe(ab(M, H) < 0.5 && ab(I, S) < 0.5, `${wo}: im gleichseitigen Dreieck fallen die Punkte nicht zusammen`);
    const t = await text(page, "#al-text");
    const gleichschenklig = alpha === beta || alpha === 180 - alpha - beta || beta === 180 - alpha - beta;
    pruefe(gleichseitig ? /Gleichseitig/.test(t) : gleichschenklig ? /Gleichschenklig/.test(t) : /Eulerschen Geraden/.test(t), `${wo}: der Text passt nicht zur Form — „${t}“`);
    pruefe(z.linien.some((l) => l.rolle === "euler") === !gleichseitig, `${wo}: die Eulersche Gerade ${gleichseitig ? "ist gezeichnet, obwohl M = H" : "fehlt"}`);
  }
  // Die Kästchen blenden wirklich aus.
  for (const k of ["m", "i", "s", "h"]) {
    await page.evaluate((id) => { const e = document.getElementById(id); e.checked = false; e.dispatchEvent(new Event("input")); }, "al-" + k);
    const z = await lies(page, "al-mount");
    pruefe(!z.punkte[k.toUpperCase()], `Alle vier: ${k.toUpperCase()} bleibt nach dem Ausblenden sichtbar`);
    await page.evaluate((id) => { const e = document.getElementById(id); e.checked = true; e.dispatchEvent(new Event("input")); }, "al-" + k);
  }
}

// ── Kontrollfragen ────────────────────────────────────────────────────────
async function quizze(page) {
  const ids = ["quiz-mittelsenkrechte", "quiz-umkreis", "quiz-winkelhalbierende", "quiz-inkreis", "quiz-schwerpunkt", "quiz-hoehen", "quiz-alle"];
  const stellen = [];
  for (const id of ids) {
    const anzahl = await page.evaluate((q) => document.querySelectorAll(`#${q} .quiz-opt`).length, id);
    pruefe(anzahl === 4, `Quiz ${id}: ${anzahl} Antwortmöglichkeiten statt 4`);
    let richtige = 0;
    for (let i = 0; i < anzahl; i++) {
      await page.locator(`#${id} .quiz-opt`).nth(i).click();
      const r = await page.evaluate((q) => {
        const f = document.querySelector(`#${q} .quiz-feedback`);
        return { ok: f.classList.contains("ok"), text: f.textContent };
      }, id);
      if (r.ok) { richtige++; stellen.push(i); }
      pruefe(r.text.length > 80, `Quiz ${id}, Antwort ${i + 1}: die Erklärung ist nur ${r.text.length} Zeichen lang`);
    }
    pruefe(richtige === 1, `Quiz ${id}: ${richtige} Antworten gelten als richtig, erwartet genau eine`);
  }
  pruefe(new Set(stellen).size >= 4, `Kontrollfragen: die richtige Antwort steht nur an ${new Set(stellen).size} Stellen (${stellen.join(", ")})`);
  // Jeder Erarbeitungsabschnitt hat seine eigene Kontrollfrage.
  for (const sec of ["sec-mittelsenkrechte", "sec-umkreis", "sec-winkelhalbierende", "sec-inkreis", "sec-schwerpunkt", "sec-hoehen", "sec-alle"]) {
    const n = await page.evaluate((s) => document.querySelectorAll(`#${s} .quiz`).length, sec);
    pruefe(n === 1, `${sec}: ${n} Kontrollfragen statt einer`);
  }
}

// ── Übungsaufgaben ────────────────────────────────────────────────────────
//
// Die Streuungsschranken sind mit werkzeug-streuung.js gemessen (siehe unten bei SCHRANKE).
function koordinaten(frage, name) {
  const m = frage.match(new RegExp(name + "\\s?\\(\\s?(−?[\\d,]+)\\s?\\|\\s?(−?[\\d,]+)\\s?\\)"));
  return m ? { x: zahl(m[1]), y: zahl(m[2]) } : null;
}
function grad(frage, name) {
  const m = frage.match(new RegExp(name + " = (\\d+(?:,\\d+)?)°"));
  return m ? zahl(m[1]) : NaN;
}

// Gemessen am 25.09.2026 mit
//   UPLANT_ZUEGE=25 node tests/werkzeug-streuung.js /mathematik/klasse-8/geometrie/grundkonstruktionen.html
// verschieden von 200 / geschätzte Menge n: A1 197/6567, A2 65/69, A3 60/62, A4 192/2421, A5 200/groß,
// A6 178/837, A7 60/62, A8 56/58, A9 184/1177, A10 41/41, A11 191/2145, A12 171/618.
// A2, A3, A7, A8 und A10 haben kleine Vorräte (ganze Gradzahlen, Dreiteilbares, heronsche Dreiecke) —
// ihre Schranken liegen deshalb niedriger; höher geschätzt machten sie den Gesamtlauf launisch.
const SCHRANKE = { 1: 22, 2: 14, 3: 13, 4: 22, 5: 22, 6: 21, 7: 13, 8: 13, 9: 21, 10: 12, 11: 22, 12: 20 };

async function aufgaben(page) {
  const r = 25;
  await pruefeAufgabe(page, bericht, {
    nr: 1, name: "A1 Mittelpunkt", runden: r, mindestensVerschieden: SCHRANKE[1],
    deute: (f) => {
      const A = koordinaten(f, "A"), B = koordinaten(f, "B");
      if (!A || !B) return null;
      const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2;
      return { felder: [mx, my], toleranz: 0.001, falschFelder: [[0, B.x - A.x, "Differenz"], [0, A.x + B.x, "durch 2"], [1, B.y - A.y, "Differenz"], [1, A.y + B.y, "durch 2"]] };
    },
  });
  await pruefeAufgabe(page, bericht, {
    nr: 2, name: "A2 halber Winkel", runden: r, mindestensVerschieden: SCHRANKE[2],
    deute: (f) => {
      const a = grad(f, "α");
      if (!Number.isFinite(a)) return null;
      return { richtig: a / 2, toleranz: 0.01, falsch: [[a, "ganze Winkel"], [2 * a, "Verdoppelt"], [90 - a / 2, "Lot"], [180 - a, "Nebenwinkel"]] };
    },
  });
  await pruefeAufgabe(page, bericht, {
    nr: 3, name: "A3 Schwerpunkt 2 : 1", runden: r, mindestensVerschieden: SCHRANKE[3],
    deute: (f) => {
      const m = f.match(/s[abc] = ([\d,]+) cm/);
      if (!m) return null;
      const s = zahl(m[1]);
      const ecke = /von der Ecke/.test(f);
      const soll = ecke ? (2 * s) / 3 : s / 3, andere = ecke ? s / 3 : (2 * s) / 3;
      return { richtig: soll, toleranz: 0.001, falsch: [[andere, ecke ? "kurze" : "lange"], [s / 2, "2 : 1"], [2 * s, "mal 2"]] };
    },
  });
  await pruefeAufgabe(page, bericht, {
    nr: 4, name: "A4 Umkreismittelpunkt rechtwinklig", runden: r, mindestensVerschieden: SCHRANKE[4],
    deute: (f) => {
      const A = koordinaten(f, "A"), B = koordinaten(f, "B"), C = koordinaten(f, "C");
      if (!A || !B || !C) return null;
      // Unabhängig: M ist von allen Ecken gleich weit entfernt — gelöst über zwei Gleichungen.
      // Katheten achsenparallel ⇒ M = Mitte der Hypotenuse; das wird hier als Abstandsgleichheit geprüft.
      const M = { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 };
      pruefe(Math.abs(ab(M, A) - ab(M, C)) < 1e-9, `A4: M ist nicht gleich weit von A und C — „${f}“`);
      pruefe(Math.abs((A.x - C.x) * (B.x - C.x) + (A.y - C.y) * (B.y - C.y)) < 1e-9, `A4: bei C ist kein rechter Winkel — „${f}“`);
      return { felder: [M.x, M.y], toleranz: 0.001, falschFelder: [[0, C.x, "Koordinate von C"], [1, C.y, "Koordinate von C"]] };
    },
  });
  await pruefeAufgabe(page, bericht, {
    nr: 5, name: "A5 Schwerpunkt aus Koordinaten", runden: r, mindestensVerschieden: SCHRANKE[5],
    deute: (f) => {
      const A = koordinaten(f, "A"), B = koordinaten(f, "B"), C = koordinaten(f, "C");
      if (!A || !B || !C) return null;
      const sx = (A.x + B.x + C.x) / 3, sy = (A.y + B.y + C.y) / 3;
      return {
        felder: [sx, sy], toleranz: 0.001,
        falschFelder: [[0, A.x + B.x + C.x, "durch 3"], [0, (A.x + B.x + C.x) / 2, "drei"], [0, (A.x + B.x) / 2, "Mitte von AB"],
          [1, A.y + B.y + C.y, "durch 3"], [1, (A.y + B.y + C.y) / 2, "drei"], [1, (A.y + B.y) / 2, "Mitte von AB"]],
      };
    },
  });
  await pruefeAufgabe(page, bericht, {
    nr: 6, name: "A6 Winkel am Inkreismittelpunkt", runden: r, mindestensVerschieden: SCHRANKE[6],
    deute: (f) => {
      const b = grad(f, "β"), g = grad(f, "γ");
      if (!Number.isFinite(b) || !Number.isFinite(g)) return null;
      const a = 180 - b - g;
      return { richtig: 90 + a / 2, toleranz: 0.01, falsch: [[a, "Hälften"], [(b + g) / 2, "ergänzt"], [180 - b - g / 2, "Bei B wurde nicht halbiert"]] };
    },
  });
  await pruefeAufgabe(page, bericht, {
    nr: 7, name: "A7 Winkel am Höhenschnittpunkt", runden: r, mindestensVerschieden: SCHRANKE[7],
    deute: (f) => {
      const a = grad(f, "α");
      if (!Number.isFinite(a)) return null;
      return { richtig: 180 - a, toleranz: 0.01, falsch: [[a, "360°"], [90 - a, "Teildreiecke"], [2 * a, "Umkreis"], [90 + a / 2, "Inkreis"]] };
    },
  });
  await pruefeAufgabe(page, bericht, {
    nr: 8, name: "A8 Winkel am Umkreismittelpunkt", runden: r, mindestensVerschieden: SCHRANKE[8],
    deute: (f) => {
      const a = grad(f, "α");
      if (!Number.isFinite(a)) return null;
      return { richtig: 2 * a, toleranz: 0.01, falsch: [[a, "größer als α"], [a === 60 ? NaN : 180 - a, "Höhen"], [90 + a / 2, "Inkreis"], [360 - 2 * a, "überstumpfe"]] };
    },
  });
  await pruefeAufgabe(page, bericht, {
    nr: 9, name: "A9 Seitenmitte aus Ecke und Schwerpunkt", runden: r, mindestensVerschieden: SCHRANKE[9],
    deute: (f) => {
      const A = koordinaten(f, "A"), S = koordinaten(f, "S");
      if (!A || !S) return null;
      // Unabhängig: A, S, M_a mit AS : SM_a = 2 : 1 ⇒ M_a = (3S − A) / 2.
      const mx = (3 * S.x - A.x) / 2, my = (3 * S.y - A.y) / 2;
      return {
        felder: [mx, my], toleranz: 0.001,
        falschFelder: [[0, 2 * S.x - A.x, "1 : 1"], [0, (A.x + S.x) / 2, "Mitte von AS"], [0, A.x + 3 * (S.x - A.x), "Zu weit"],
          [1, 2 * S.y - A.y, "1 : 1"], [1, (A.y + S.y) / 2, "Mitte von AS"], [1, A.y + 3 * (S.y - A.y), "Zu weit"]],
      };
    },
  });
  await pruefeAufgabe(page, bericht, {
    nr: 10, name: "A10 Inkreisradius", runden: r, mindestensVerschieden: SCHRANKE[10],
    deute: (f) => {
      const m = f.match(/a = ([\d,]+) cm, b = ([\d,]+) cm und c = ([\d,]+) cm und den Flächeninhalt A = ([\d,]+) cm²/);
      if (!m) return null;
      const [a, b, c, F] = m.slice(1).map(zahl);
      // Unabhängig: der Flächeninhalt muss zu den Seiten passen (Heronsche Formel, nur hier im
      // Test — auf der Seite kommt keine Wurzel vor).
      const s = (a + b + c) / 2;
      pruefe(Math.abs(Math.sqrt(s * (s - a) * (s - b) * (s - c)) - F) < 1e-6, `A10: der Flächeninhalt ${F} passt nicht zu den Seiten — „${f}“`);
      const rho = (2 * F) / (a + b + c);
      return { richtig: rho, toleranz: 0.005, falsch: [[F / (a + b + c), "Faktor ½"], [(2 * F) / a, "Höhe"], [(2 * F) / b, "Höhe"], [(2 * F) / c, "Höhe"]] };
    },
  });
  await pruefeAufgabe(page, bericht, {
    nr: 11, name: "A11 Eulersche Gerade", runden: r, mindestensVerschieden: SCHRANKE[11],
    deute: (f) => {
      const M = koordinaten(f, "M"), H = koordinaten(f, "H");
      if (!M || !H) return null;
      return {
        felder: [M.x + (H.x - M.x) / 3, M.y + (H.y - M.y) / 3], toleranz: 0.001,
        falschFelder: [[0, (M.x + H.x) / 2, "1 : 2"], [0, M.x + (2 * (H.x - M.x)) / 3, "näher an"], [1, (M.y + H.y) / 2, "1 : 2"], [1, M.y + (2 * (H.y - M.y)) / 3, "näher an"]],
      };
    },
  });
  await pruefeAufgabe(page, bericht, {
    nr: 12, name: "A12 Höhe und Winkelhalbierende", runden: r, mindestensVerschieden: SCHRANKE[12],
    deute: (f) => {
      const a = grad(f, "α"), b = grad(f, "β");
      if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
      const g = 180 - a - b;
      // Unabhängig über die Winkel an CA gerechnet, nicht über |α − β| : 2.
      const soll = Math.abs(g / 2 - (90 - a));
      return { richtig: soll, toleranz: 0.01, falsch: [[Math.abs(a - b), "Hälfte"], [g / 2, "Davon geht"], [90 - a, "Vergleiche"], [(a + b) / 2, "Addiert"]] };
    },
  });
}

// ── Gerüst ────────────────────────────────────────────────────────────────
async function geruest(page) {
  const folge = await page.evaluate(() => [...document.querySelectorAll("main section[id]")].map((s) => s.id));
  const soll = ["sec-mittelsenkrechte", "sec-umkreis", "sec-winkelhalbierende", "sec-inkreis", "sec-schwerpunkt",
    "sec-hoehen", "sec-alle", "sec-konstruieren", "sec-vernetzung", "sec-formelsammlung", "sec-uebungen"];
  pruefe(JSON.stringify(folge) === JSON.stringify(soll), `Gerüst: Abschnitte ${folge.join(", ")} statt ${soll.join(", ")}`);
  // Die Didaktik: Umkreis direkt nach der Mittelsenkrechten, Inkreis direkt nach der
  // Winkelhalbierenden, Seitenhalbierende erst nach der Mittelsenkrechten (sie braucht die Mitte).

  for (const [datei, seiten] of [["grundkonstruktionen-formelsammlung.pdf", 2], ["grundkonstruktionen.pdf", null]]) {
    const pdf = path.join(WURZEL, "mathematik/klasse-8/geometrie", datei);
    pruefe(fs.existsSync(pdf), `Formelsammlung: ${datei} fehlt`);
    if (!fs.existsSync(pdf)) continue;
    const roh = fs.readFileSync(pdf);
    pruefe(roh.subarray(0, 5).toString("latin1") === "%PDF-", `Formelsammlung: ${datei} ist kein PDF`);
    const box = roh.toString("latin1").match(/\/MediaBox\s*\[\s*0 0 ([\d.]+) ([\d.]+)/);
    pruefe(!!box && Number(box[1]) > Number(box[2]), `Formelsammlung: ${datei} ist nicht im Querformat`);
    if (seiten) {
      const n = (roh.toString("latin1").match(/\/Type\s*\/Page(?!s)/g) || []).length;
      pruefe(n === seiten, `Formelsammlung: ${datei} hat ${n} Seiten statt ${seiten}`);
    }
  }
  const verweise = await page.evaluate(() => [...document.querySelectorAll("#sec-formelsammlung a[download]")].map((a) => a.getAttribute("href")));
  pruefe(verweise.includes("grundkonstruktionen-formelsammlung.pdf") && verweise.includes("grundkonstruktionen.pdf"),
    `Formelsammlung: die Download-Verweise sind ${verweise.join(", ")}`);
  const quelle = fs.readFileSync(path.join(WURZEL, "tools/formelsammlung/formelsammlung-gk-quelle.html"), "utf8")
    .replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/\s+/g, " ");
  for (const f of ["MA = MB = MC", "Umkreis", "Inkreis", "2 : 1", "Eulersche Gerade", "90° + α : 2", "ρ = 2 · A : u"]) {
    pruefe(quelle.includes(f), `Formelsammlung: „${f}“ fehlt in der Quelle des PDFs`);
  }

  const haupt = await page.evaluate(() => document.querySelector("main").innerText);
  pruefe(!/√|Quadratwurzel/.test(haupt), "Gerüst: es kommen Wurzeln vor — die gibt es erst in Klasse 9");
  for (const stelle of [...haupt.matchAll(/.{60}Pythagoras.{60}/gs)].map((m) => m[0])) {
    pruefe(/brauchst du nicht|Klasse 9|gemessen/.test(stelle), `Gerüst: Pythagoras ohne Hinweis auf Klasse 9 — „${stelle.trim()}“`);
  }

  // Die alten Einzelseiten sind aufgegangen; niemand darf mehr auf sie zeigen.
  for (const alt of ["mittelsenkrechte-umkreis.html", "winkelhalbierende-inkreis.html", "alle-linien.html"]) {
    pruefe(!fs.existsSync(path.join(WURZEL, "mathematik/klasse-8/geometrie", alt)), `Gerüst: ${alt} liegt noch da`);
  }
  const menue = fs.readFileSync(path.join(WURZEL, "mathematik/klasse-8/geometrie/index.html"), "utf8");
  pruefe(/href="grundkonstruktionen.html"[^>]*>\s*<h2>1\. Grundkonstruktionen und besondere Linien am Dreieck/.test(menue),
    "Gerüst: die Menükarte heißt nicht „1. Grundkonstruktionen und besondere Linien am Dreieck“");
  pruefe(!/geo-download-box/.test(menue), "Gerüst: die Konstruktionsschritte stehen noch als eigener Kasten im Menü statt auf der Seite");

  const links = await page.evaluate(() =>
    [...document.querySelectorAll("main a[href]")].map((a) => a.getAttribute("href")).filter((h) => !h.startsWith("#") && !h.startsWith("http")));
  for (const href of new Set(links)) {
    const ziel = new URL(href.split("#")[0], "http://localhost/mathematik/klasse-8/geometrie/").pathname;
    const antwort = await page.request.get("http://localhost:" + (process.env.UPLANT_PORT || "8936") + ziel);
    pruefe(antwort.ok(), `Gerüst: der Verweis „${href}“ führt ins Leere (${antwort.status()})`);
  }

  // Das Konstruktionswerkzeug ist eingebaut und zeichnet etwas.
  const werkzeug = await page.evaluate(() => ({
    tabs: document.querySelectorAll("#exercise-tabs .geo-mode-tab").length,
    punkte: document.querySelectorAll("#geo-svg .geo-point-dot").length,
    schritte: document.querySelectorAll("#steps-list li").length,
  }));
  pruefe(werkzeug.tabs === 4 && werkzeug.punkte >= 2 && werkzeug.schritte >= 3, `Konstruieren: das Werkzeug ist nicht vollständig (${JSON.stringify(werkzeug)})`);
}

(async () => {
  const browser = await starteBrowser();
  for (const dunkel of [false, true]) {
    const wo = dunkel ? "dunkel" : "hell";
    const page = await neueSeite(browser, { dunkel });
    await oeffne(page, SEITE);
    if (!dunkel) {
      await geruest(page);
      await mittelsenkrechte(page);
      await umkreis(page);
      await winkelhalbierende(page);
      await inkreis(page);
      await schwerpunkt(page);
      await hoehen(page);
      await alle(page);
      await quizze(page);
      await aufgaben(page);
    } else {
      await pruefeKontrast(page, bericht, "dunkel");
    }
    await pruefeNotation(page, bericht, wo);
    for (const s of page.stoerungen) pruefe(false, `${wo}: ${s}`);
    await page.close();
  }
  await browser.close();
  bericht.abschluss();
})();
