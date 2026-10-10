// Fachliche Prüfung: MSS 11, Analysis, Thema 2.2 „Ableitung weiterer Funktionen“ (Leistungskurs).
//
// Geprüft wird, was die Seite zeigt, gegen eine unabhängige Rechnung. Ableitungen bestimmt die
// Prüfung NICHT mit den Regeln der Seite, sondern numerisch als zentralen Differenzenquotienten;
// Nullstellen, Extremstellen und Lösungen von Gleichungen über Vorzeichenwechsel und Bisektion.
// Eine falsch hergeleitete Formel auf der Seite fiele so auf.
//
//   * Gerüst: Abschnittsfolge und Nummern, Kursmarken (GK + LK oder LK) an jedem Abschnitt, kein
//     Vorgriff der Grundkurs-Abschnitte auf Leistungskurs-Stoff, Verweise und Sprungmarken,
//     Menükarte mit Marke, Verweise aus Thema 2.1, 3 und 4, Formelsammlung;
//   * jede Zeichnung wird aus dem SVG zurückgelesen (Maßstab aus den Gitterlinien mit data-wert):
//     Graphen, Tangenten, Steigungsdreiecke (auch gespiegelt und gestaucht), Kreis und Bogen,
//     Zahlengeraden der Kettenregel, Nullstellen- und Extremmarken, Kopien bei Symmetrie und Periode
//     Punkt für Punkt;
//   * jede Bilanz wird gegen die unabhängige Rechnung gelesen, ebenso die Urteile (symmetrisch,
//     Hoch-/Tiefpunkt, Monotonie);
//   * Kontrollfragen, Selbsteinschätzung und alle vierundzwanzig Aufgaben — jede von beiden Seiten.

"use strict";

const { neuerBericht } = require("../lib/pruefen");
const { starteBrowser, neueSeite, oeffne, setzeRegler, text } = require("../lib/seite");
const { pruefeNotation } = require("../lib/notation");
const { pruefeKontrast } = require("../lib/kontrast");
const { pruefeAufgabe, zahl } = require("../lib/aufgaben");
const { liesTermAufgabe, termDeuter } = require("../lib/terme");
const fs = require("fs");
const path = require("path");

const bericht = neuerBericht();
const { pruefe } = bericht;
const SEITE = "/mathematik/mss11/01-analysis/03b-weitere-funktionen-ableiten/index.html";
const WURZEL = path.resolve(__dirname, "..", "..");
const nahe = (a, b, tol = 1e-6) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= tol;
// Zentrale Differenz: die Ableitung, ohne eine Ableitungsregel zu benutzen.
const ableitung = (f, x, h = 1e-6) => (f(x + h) - f(x - h)) / (2 * h);
const GRAD = 180 / Math.PI;
const E = Math.exp;

async function waehle(page, id, wert) {
  await page.selectOption("#" + id, wert);
}
async function spanWert(page, sel) {
  return zahl(await page.evaluate((s) => (document.querySelector(s) || {}).textContent || "", sel));
}
// Der Text eines Elements, Brüche als „(z)/(n)“ und Hochzahlen als „^(…)“.
async function klartext(page, sel) {
  return page.evaluate((s) => {
    const e = document.querySelector(s);
    if (!e) return "";
    const k = e.cloneNode(true);
    k.querySelectorAll("sup").forEach((t) => t.replaceWith(`^(${t.textContent})`));
    k.querySelectorAll(".bruch").forEach((b) => b.replaceWith(`(${b.querySelector(".z").textContent})/(${b.querySelector(".n").textContent})`));
    return k.textContent.replace(/\s+/g, " ").trim();
  }, sel);
}

// Liest eine Zeichnung und rechnet alle Koordinaten über die Gitterlinien in (x | y) um — der
// Maßstab kommt aus zwei beschrifteten Linien, nicht aus dem Code der Seite.
async function lies(page, sel) {
  return page.evaluate((s) => {
    const svg = document.querySelector(s);
    if (!svg) return null;
    const linien = (achse) => [...svg.querySelectorAll(`line[data-achse="${achse}"]`)].map((l) => ({ w: Number(l.dataset.wert), p: achse === "y" ? Number(l.getAttribute("y1")) : Number(l.getAttribute("x1")) }));
    const skala = (L) => { const a = L[0], b = L[L.length - 1]; const st = (b.p - a.p) / (b.w - a.w); return { wert: (p) => a.w + (p - a.p) / st, pro: Math.abs(st) }; };
    const SX = skala(linien("x")), SY = skala(linien("y"));
    const X = SX.wert, Y = SY.wert;
    const n = (e, a) => Number(e.getAttribute(a));
    const paare = (d) => (d.match(/-?[\d.]+ -?[\d.]+/g) || []).map((t) => t.split(" ").map(Number));
    return {
      proX: SX.pro, proY: SY.pro,
      pfade: [...svg.querySelectorAll("path[data-rolle]")].map((p) => ({ rolle: p.dataset.rolle, teil: p.dataset.teil, daten: { ...p.dataset }, punkte: paare(p.getAttribute("d")).map(([a, b]) => [X(a), Y(b)]) })),
      kreise: [...svg.querySelectorAll("circle")].map((c) => ({ x: X(n(c, "cx")), y: Y(n(c, "cy")), r: n(c, "r") / SX.pro, klasse: c.getAttribute("class") || "", daten: { ...c.dataset } })),
      linien: [...svg.querySelectorAll("line[data-rolle]")].map((l) => ({ rolle: l.dataset.rolle, klasse: l.getAttribute("class") || "", daten: { ...l.dataset }, x1: X(n(l, "x1")), y1: Y(n(l, "y1")), x2: X(n(l, "x2")), y2: Y(n(l, "y2")) })),
      vielecke: [...svg.querySelectorAll("polygon[data-rolle]")].map((p) => ({ rolle: p.dataset.rolle, punkte: p.getAttribute("points").trim().split(/\s+/).map((t) => { const [a, b] = t.split(",").map(Number); return [X(a), Y(b)]; }) })),
    };
  }, sel);
}
const linie = (d, rolle) => d.linien.find((l) => l.rolle === rolle);
const kreis = (d, rolle) => d.kreise.find((k) => k.daten.rolle === rolle);
const pfadPunkte = (d, rolle) => d.pfade.filter((p) => p.rolle === rolle).flatMap((p) => p.punkte);
const steigung = (l) => (l.y2 - l.y1) / (l.x2 - l.x1);
// Jeder Pfadpunkt liegt auf dem Graphen — gemessen in der Höhe, mit Spielraum für steile Stellen.
function aufGraph(wo, punkte, f, tol = 0.02) {
  let schlecht = 0, bsp = "";
  for (const [x, y] of punkte) {
    const s = Math.abs(ableitung(f, x, 1e-5));
    if (!nahe(y, f(x), tol + 0.004 * s)) { schlecht++; bsp = `(${x.toFixed(3)} | ${y.toFixed(3)}) statt ${f(x).toFixed(3)}`; }
  }
  pruefe(punkte.length > 10 && schlecht === 0, `${wo}: ${schlecht} von ${punkte.length} Punkten liegen nicht auf dem Graphen, etwa ${bsp}`);
}
// Nullstellen mit Vorzeichenwechsel auf [lo; hi], halbiert. Jeder Rasterpunkt wird genau einmal
// ausgewertet: Rechnete man b = a + h und das nächste a getrennt aus, wären es zwei verschiedene
// Gleitkommazahlen — liegt die Nullstelle genau dort, kann das Rauschen der numerischen Ableitung
// beiden Paaren denselben Vorzeichenwechsel unterschlagen.
function vzw(g, lo, hi, n = 4000) {
  const xs = Array.from({ length: n + 1 }, (_, i) => lo + ((hi - lo) * i) / n), gs = xs.map(g), aus = [];
  const neu = (z) => { if (!aus.some((w) => Math.abs(w - z) < 1e-5)) aus.push(z); };
  for (let i = 0; i < n; i++) {
    if (gs[i] === 0) { neu(xs[i]); continue; }
    if (Math.sign(gs[i]) * Math.sign(gs[i + 1]) < 0) {
      let a = xs[i], b = xs[i + 1];
      for (let k = 0; k < 80; k++) { const m = (a + b) / 2; if (Math.sign(g(m)) === Math.sign(g(a))) a = m; else b = m; }
      neu((a + b) / 2);
    }
  }
  return aus;
}
// Die einzige Lösung von g = 0 auf [lo; hi] bei streng monotonem g.
function bisektion(g, lo, hi) {
  let a = lo, b = hi;
  for (let k = 0; k < 200; k++) { const m = (a + b) / 2; if (Math.sign(g(m)) === Math.sign(g(a))) a = m; else b = m; }
  return (a + b) / 2;
}

// ---------- Gerüst ----------
const ABSCHNITTE = ["sec-e", "sec-ex", "sec-ln", "sec-produkt-e", "sec-sinus", "sec-kette", "sec-quotient", "sec-lnfunktion",
  "sec-verhalten", "sec-symmetrie", "sec-nullstellen", "sec-monotonie", "sec-wachstum", "sec-stolperstelle"];
// Nach dem rheinland-pfälzischen Lehrplan nur Leistungsfach: Kettenregel, sin/cos, Quotientenregel,
// die Funktion ln — und alles, was auf ihnen aufbaut.
const NUR_LK = new Set(["sec-sinus", "sec-kette", "sec-quotient", "sec-lnfunktion", "sec-symmetrie"]);
async function geruest(page) {
  const folge = await page.evaluate(() => [...document.querySelectorAll("main section[id]")].map((s) => s.id));
  const soll = [...ABSCHNITTE, "sec-selbsteinschaetzung", "sec-vernetzung", "sec-formelsammlung", "sec-uebungen"];
  pruefe(JSON.stringify(folge) === JSON.stringify(soll), `Gerüst: Abschnitte ${folge.join(", ")} statt ${soll.join(", ")}`);
  const titel = await page.evaluate((ids) => ids.map((id) => {
    const h = document.querySelector(`#${id} h2`);
    return { text: h.textContent, marken: [...h.querySelectorAll(".kurs-marke")].map((m) => m.className) };
  }), ABSCHNITTE);
  titel.forEach((t, i) => {
    pruefe(t.text.startsWith(`${i + 1}. `), `Gerüst: Überschrift „${t.text}“ trägt nicht die Nummer ${i + 1}`);
    const erwartet = NUR_LK.has(ABSCHNITTE[i]) ? "kurs-marke lk" : "kurs-marke gk";
    pruefe(t.marken.length === 1 && t.marken[0] === erwartet, `Gerüst: ${ABSCHNITTE[i]} trägt die Marke ${t.marken.join(", ") || "keine"} statt „${erwartet}“`);
  });
  pruefe(await page.evaluate(() => !!document.querySelector(".page-header + main .kurs-hinweis .kurs-marke.lk, main section:first-child .kurs-hinweis .kurs-marke.lk")),
    "Gerüst: Der Einstieg kennzeichnet die Seite nicht als Leistungskurs");
  pruefe(/Elemente der Mathematik/.test(await text(page, "main")), "Gerüst: Die Schreibweise nach Elemente wird nicht genannt");
  pruefe(fs.existsSync(path.join(WURZEL, path.dirname(SEITE), "formelsammlung.pdf")), "Formelsammlung: formelsammlung.pdf fehlt");

  // Kein Vorgriff: Die Grundkurs-Abschnitte verweisen auf Leistungskurs-Abschnitte nur als Ausblick —
  // in einem Hinweiskasten oder in einem Satz, der den Leistungskurs nennt.
  const vorgriffe = await page.evaluate((lk) => {
    const aus = [];
    for (const s of document.querySelectorAll("main section[id]")) {
      if (lk.includes(s.id) || !s.querySelector("h2 .kurs-marke")) continue;
      for (const a of s.querySelectorAll('a[href^="#sec-"]')) {
        if (!lk.includes(a.getAttribute("href").slice(1))) continue;
        const block = a.closest("p, li, div");
        if (a.closest(".hinweis-box") || /Leistungskurs/.test(block ? block.textContent : "")) continue;
        aus.push(`${s.id} → ${a.getAttribute("href")}`);
      }
    }
    return aus;
  }, [...NUR_LK]);
  pruefe(vorgriffe.length === 0, `Gerüst: Grundkurs-Abschnitte stützen sich auf Leistungskurs-Stoff: ${vorgriffe.join("; ")}`);
  // Die ersten vier Abschnitte kommen ohne Kettenregel, Kosinus, Quotientenregel und ln-Funktion aus
  // (Hinweiskästen mit Ausblick ausgenommen) — sonst wäre die Reihenfolge ein Zirkelschluss.
  const frueh = await page.evaluate((ids) => ids.map((id) => {
    const k = document.getElementById(id).cloneNode(true);
    k.querySelectorAll(".hinweis-box, .quiz").forEach((e) => e.remove());
    return k.textContent;
  }).join(" "), ABSCHNITTE.slice(0, 4));
  pruefe(!/Kettenregel|\bcos\b|Kosinus|Quotientenregel|\(ln x\)′/.test(frueh), "Gerüst: Abschnitte 1–4 greifen auf Kettenregel, Kosinus, Quotientenregel oder (ln x)′ vor");
  // Leistungskurs-Funktionen in einem Grundkurs-Abschnitt stehen in der Auswahl mit „(LK)“.
  const ohneMarke = await page.evaluate((lk) => [...document.querySelectorAll("main section[id] select option")]
    .filter((o) => !lk.includes(o.closest("section").id) && /sin|cos|tan|ln\(/.test(o.textContent) && !/\(LK\)/.test(o.textContent))
    .map((o) => o.textContent), [...NUR_LK]);
  pruefe(ohneMarke.length === 0, `Gerüst: Auswahl in Grundkurs-Abschnitten ohne „(LK)“: ${ohneMarke.join("; ")}`);

  const links = await page.evaluate(() =>
    [...document.querySelectorAll("main a[href]")].map((a) => a.getAttribute("href")).filter((h) => !h.startsWith("http")));
  for (const href of new Set(links)) {
    if (href.startsWith("#")) {
      pruefe(await page.evaluate((id) => !!document.getElementById(id), href.slice(1)), `Gerüst: Sprungmarke „${href}“ fehlt auf der Seite`);
      continue;
    }
    const ziel = new URL(href.split("#")[0], "http://localhost" + SEITE).pathname;
    const antwort = await page.request.get("http://localhost:" + (process.env.UPLANT_PORT || "8936") + ziel);
    pruefe(antwort.ok(), `Gerüst: der Verweis „${href}“ führt ins Leere (${antwort.status()})`);
    const anker = href.split("#")[1];
    if (anker) pruefe((await antwort.text()).includes(`id="${anker}"`), `Gerüst: Sprungmarke „${anker}“ fehlt in ${ziel}`);
  }
  const menue = fs.readFileSync(path.join(WURZEL, "mathematik/mss11/01-analysis/index.html"), "utf-8");
  pruefe(/data-section="mss11" href="03b-weitere-funktionen-ableiten\/index.html" hidden/.test(menue), "Menü: Karte für Thema 2.2 fehlt oder ist nicht mit data-section/hidden versehen");
  pruefe(/<h2>2\.2 Ableitung weiterer Funktionen <span class="kurs-marke lk">/.test(menue), "Menü: Die Karte heißt nicht „2.2 Ableitung weiterer Funktionen“ mit der Marke LK");
  // Die Nachbarthemen verweisen hierher — der Sinus und die Kettenregel stehen nicht mehr in 2.1.
  const t21 = fs.readFileSync(path.join(WURZEL, "mathematik/mss11/01-analysis/03-differentialrechnung/index.html"), "utf-8");
  pruefe(t21.includes("../03b-weitere-funktionen-ableiten/index.html"), "Vernetzung: Thema 2.1 verweist nicht auf Thema 2.2");
  for (const t of ["04b-weitere-funktionen-untersuchen", "05-integralrechnung"]) {
    const h = fs.readFileSync(path.join(WURZEL, `mathematik/mss11/01-analysis/${t}/index.html`), "utf-8");
    pruefe(!/03-differentialrechnung\/index.html#sec-(sinus|produkt-kette)/.test(h), `Vernetzung: ${t} verweist noch auf den Sinus oder die Kettenregel in Thema 2.1`);
    pruefe(h.includes("../03b-weitere-funktionen-ableiten/index.html#sec-"), `Vernetzung: ${t} verweist nicht auf Thema 2.2`);
  }
}

// ---------- 1. b^x und die Zahl e ----------
async function basis(page) {
  for (const b of [1.5, 2, 2.72, 4]) for (const x of [-1.5, 0, 1, 2]) {
    const B = await setzeRegler(page, "eb-b", b), x0 = await setzeRegler(page, "eb-x", x);
    const wo = `Basis b = ${B}, x₀ = ${x0}`;
    const f = (t) => B ** t, f0 = f(x0), m = ableitung(f, x0);
    const d = await lies(page, "#eb-mount svg");
    aufGraph(wo, pfadPunkte(d, "graph"), f);
    const t = linie(d, "tangente"), dx = linie(d, "dx"), dy = linie(d, "dy"), p = kreis(d, "p");
    pruefe(p && nahe(p.x, x0, 0.01) && nahe(p.y, f0, 0.02 * (1 + f0)), `${wo}: P liegt nicht auf dem Graphen`);
    pruefe(t && nahe(steigung(t), m, 3e-3 * (1 + m)), `${wo}: Tangentensteigung ${t && steigung(t)} statt ${m}`);
    // Das Dreieck unter der Tangente: senkrecht f(x₀), waagerecht bis zum Schnitt der Tangente mit der x-Achse.
    pruefe(dy && nahe(dy.x1, x0, 0.01) && nahe(dy.y1, 0, 0.02) && nahe(dy.y2, f0, 0.02 * (1 + f0)), `${wo}: Die senkrechte Kathete ist nicht f(x₀)`);
    pruefe(dx && nahe(f0 + m * (dx.x1 - x0), 0, 0.03 * (1 + f0)) && nahe(dx.x2, x0, 0.01), `${wo}: Die waagerechte Kathete endet nicht am Schnitt der Tangente mit der x-Achse`);
    pruefe(nahe(await spanWert(page, "#eb-bilanz .wc"), f0, 6e-5 + 1e-9), `${wo}: Bilanz f(x₀) falsch`);
    pruefe(nahe(await spanWert(page, "#eb-bilanz .wa"), m, 6e-5 + 1e-6 * m), `${wo}: Bilanz f′(x₀) falsch`);
    pruefe(nahe(await spanWert(page, "#eb-bilanz .wr"), m / f0, 6e-5), `${wo}: Bilanz f′ : f falsch`);
    const bil = await klartext(page, "#eb-bilanz");
    const abst = bil.match(/immer \(1\)\/\(cb\) [=≈] ([\d,]+) links/);
    pruefe(!!abst && nahe(zahl(abst[1]), f0 / m, 6e-5), `${wo}: Der Abstand zum Schnitt mit der x-Achse ist ${abst && abst[1]} statt ${f0 / m}`);
    // Die Annäherung (b^0,001 − 1) : 0,001 steht da und stimmt.
    const ann = bil.match(/\(0,001\) [=≈] ([\d,]+)/);
    pruefe(!!ann && nahe(zahl(ann[1]), (B ** 0.001 - 1) / 0.001, 6e-5), `${wo}: Annäherung von c_b falsch`);
    const fastE = /fast genau 1/.test(await text(page, "#eb-text"));
    pruefe(fastE === Math.abs(Math.log(B) - 1) < 0.005, `${wo}: Der Text sagt ${fastE ? "" : "nicht "}„fast genau 1“`);
  }
}

// ---------- 2. e^(kx) ----------
async function ekx(page) {
  for (const k of [-2, -0.5, 0, 0.5, 1, 2]) for (const x of [-2, -1, 0, 1.5, 2]) {
    const K = await setzeRegler(page, "ek-k", k), x0 = await setzeRegler(page, "ek-x", x);
    const wo = `e^(kx) k = ${K}, x₀ = ${x0}`;
    // Regler lügen nicht: |k · x₀| ≤ 2, und was gezeigt wird, ist der eingestellte Wert.
    pruefe(Math.abs(K * x0) <= 2 + 1e-9, `${wo}: Der Partnerpunkt läge außerhalb des Bildes`);
    pruefe(Math.abs(K * x) > 2 + 1e-9 || nahe(x0, x, 1e-9), `${wo}: x₀ wurde ohne Not von ${x} auf ${x0} gesetzt`);
    pruefe(nahe(zahl(await text(page, "#ek-x-anzeige")), x0, 1e-9), `${wo}: Die Anzeige zeigt nicht den Reglerwert`);
    const f = (t) => E(K * t), f0 = f(x0), m = ableitung(f, x0);
    const d = await lies(page, "#ek-mount svg");
    aufGraph(wo, pfadPunkte(d, "f"), f);
    aufGraph(wo + " (e^x)", pfadPunkte(d, "ex"), E);
    const t = linie(d, "tangente");
    pruefe(t && nahe(steigung(t), m, 3e-3 * (1 + Math.abs(m))), `${wo}: Tangentensteigung ${t && steigung(t)} statt ${m}`);
    pruefe(nahe(await spanWert(page, "#ek-bilanz .wa"), m, 6e-5 + 1e-6 * Math.abs(m)), `${wo}: Bilanz f′(x₀) falsch`);
    if (K === 0) continue;
    const q = kreis(d, "q");
    pruefe(q && nahe(q.x, K * x0, 0.01) && nahe(q.y, f0, 0.02 * (1 + f0)) && nahe(q.y, E(q.x), 0.03 * (1 + f0)), `${wo}: Q liegt nicht gleich hoch auf dem Graphen von e^x`);
    const dyp = linie(d, "dy-p"), dyq = linie(d, "dy-q"), dxp = linie(d, "dx-p"), dxq = linie(d, "dx-q");
    // Gleiche Höhe, Breite durch k geteilt: Das ist die ganze Herleitung.
    pruefe(dyp && dyq && nahe(dyp.y2 - dyp.y1, dyq.y2 - dyq.y1, 0.02), `${wo}: Die beiden Steigungsdreiecke sind nicht gleich hoch`);
    pruefe(dxp && dxq && nahe(Math.abs(dxq.x2 - dxq.x1), Math.abs(K) * Math.abs(dxp.x2 - dxp.x1), 0.01), `${wo}: Das Dreieck bei Q ist nicht |k|-mal so breit`);
    pruefe(dyp && dxp && nahe((dyp.y2 - dyp.y1) / (dxp.x2 - dxp.x1), m, 0.03 * (1 + Math.abs(m))), `${wo}: Das Dreieck bei P hat nicht die Tangentensteigung`);
    pruefe(dyq && dxq && nahe((dyq.y2 - dyq.y1) / (dxq.x2 - dxq.x1), E(K * x0), 0.03 * (1 + f0)), `${wo}: Das Dreieck bei Q hat nicht die Steigung von e^x`);
  }
}

// ---------- 3. Natürlicher Logarithmus ----------
async function logarithmus(page) {
  const faelle = [["ex", [null]], ["ekx", [-2, -0.25, 0, 0.5]], ["zwei", [null]]];
  for (const [art, ks] of faelle) {
    await waehle(page, "lg-art", art);
    pruefe((await page.evaluate(() => document.getElementById("lg-k").closest("label").hidden)) === (art !== "ekx"), `Logarithmus ${art}: Der Regler k ist ${art === "ekx" ? "versteckt" : "sichtbar"}`);
    for (const k of ks) for (const c of [0.25, 1, 2, 8]) {
      const K = k === null ? null : await setzeRegler(page, "lg-k", k), C = await setzeRegler(page, "lg-c", c);
      const wo = `Logarithmus ${art}${K === null ? "" : `, k = ${K}`}, c = ${C}`;
      const f = art === "ex" ? E : art === "ekx" ? (x) => E(K * x) : (x) => 2 ** x;
      const d = await lies(page, "#lg-mount svg");
      aufGraph(wo, pfadPunkte(d, "graph"), f);
      const h = linie(d, "hoehe-c");
      pruefe(h && nahe(h.y1, C, 0.02) && nahe(h.y2, C, 0.02), `${wo}: Die Gerade y = c liegt falsch`);
      const l = kreis(d, "loesung");
      if (art === "ekx" && K === 0) {
        pruefe(!l, `${wo}: Bei k = 0 ist eine Lösung markiert`);
        pruefe(/keine Lösung|jedes x/.test(await text(page, "#lg-bilanz")), `${wo}: Die Bilanz sagt nicht, dass es keine oder jede Lösung gibt`);
        continue;
      }
      const x = bisektion((t) => f(t) - C, -200, 200);
      pruefe(l && nahe(l.x, x, 0.01) && nahe(l.y, 0, 0.01) && nahe(Number(l.daten.wert), x, 1e-9), `${wo}: Die Lösung ist bei ${l && l.x} statt ${x} markiert`);
      pruefe(nahe(await spanWert(page, "#lg-bilanz .wa"), x, 6e-5), `${wo}: Bilanz nennt eine andere Lösung`);
    }
  }
}

// ---------- 4. Produkte mit e ----------
const PE = {
  xe: { f: (x) => x * E(-x), klammer: (x) => 1 - x, xs: [-1, 4] },
  x2e: { f: (x) => x * x * E(-x), klammer: (x) => 2 * x - x * x, xs: [-1, 4] },
  lin: { f: (x) => (2 - x) * E(0.5 * x), klammer: (x) => -0.5 * x, xs: [-3, 3] },
};
async function produktE(page) {
  for (const [art, def] of Object.entries(PE)) {
    await waehle(page, "pe-art", art);
    const fd = (x) => ableitung(def.f, x);
    const kritisch = vzw(fd, def.xs[0] - 0.2, def.xs[1] + 0.2);
    for (const anteil of [0, 0.3, 0.5, 0.8, 1]) {
      const x0 = await setzeRegler(page, "pe-x", Number((def.xs[0] + anteil * (def.xs[1] - def.xs[0])).toFixed(1)));
      const wo = `Produkt ${art}, x₀ = ${x0}`;
      const o = await lies(page, "#pe-mount svg[data-panel=f]");
      aufGraph(wo, pfadPunkte(o, "f"), def.f);
      const t = linie(o, "tangente"), m = fd(x0);
      pruefe(t && nahe(steigung(t), m, 3e-3 * (1 + Math.abs(m))), `${wo}: Tangente hat die Steigung ${t && steigung(t)} statt ${m}`);
      const u = await lies(page, "#pe-mount svg[data-panel=a]");
      aufGraph(wo + " (f′)", pfadPunkte(u, "ableitung"), fd, 0.05);
      // Die Klammer hat überall das Vorzeichen von f′ — das ist der Sinn des Ausklammerns.
      for (const [x, y] of pfadPunkte(u, "klammer")) {
        if (Math.abs(fd(x)) > 1e-3 && Math.abs(y) > 0.02) pruefe(Math.sign(y) === Math.sign(fd(x)), `${wo}: Die Klammer hat bei x = ${x.toFixed(2)} ein anderes Vorzeichen als f′`);
      }
      for (const p of u.pfade.filter((q) => q.rolle === "ableitung")) {
        for (const [x, y] of p.punkte) if (Math.abs(y) > 0.01) pruefe((y > 0) === (p.teil === "positiv"), `${wo}: f′ bei x = ${x.toFixed(2)} als „${p.teil}“ gefärbt`);
      }
      const marken = u.kreise.filter((k) => k.daten.rolle === "nullstelle").map((k) => Number(k.daten.wert)).sort((a, b) => a - b);
      pruefe(marken.length === kritisch.length && marken.every((z, i) => nahe(z, kritisch[i], 1e-4)), `${wo}: Nullstellen von f′ bei ${marken} statt ${kritisch}`);
      const wert = await spanWert(page, "#pe-bilanz .wa, #pe-bilanz .wo, #pe-bilanz .wc");
      pruefe(nahe(wert, m, 6e-5), `${wo}: Bilanz nennt f′(x₀) = ${wert} statt ${m}`);
      // Genannte Extrempunkte werden nachgerechnet.
      for (const g of (await text(page, "#pe-bilanz")).matchAll(/([HT])\((−?[\d,]+) \| (−?[\d,]+)\)/g)) {
        const x = zahl(g[2]);
        pruefe(kritisch.some((z) => nahe(z, x, 1e-4)) && nahe(zahl(g[3]), def.f(x), 1e-4), `${wo}: „${g[0]}“ stimmt nicht`);
        pruefe((g[1] === "H") === (fd(x - 0.01) > 0), `${wo}: „${g[0]}“ hat den falschen Typ`);
      }
    }
  }
}

// ---------- 5. Sinus am Einheitskreis ----------
async function sinus(page) {
  for (const x of [0, 0.8, 2.5, 4, 6.2]) for (const h of [1.2, 0.3, 0.05]) {
    const X0 = await setzeRegler(page, "si-x", x), H = await setzeRegler(page, "si-h", h);
    const wo = `Sinus x = ${X0}, h = ${H}`;
    const k = await lies(page, "#si-mount svg[data-panel=kreis]");
    pruefe(nahe(k.proX, k.proY, 1e-3 * k.proX), `${wo}: Kreisbild verzerrt`);
    const ek = kreis(k, "einheitskreis");
    pruefe(ek && nahe(ek.r, 1, 3e-3) && nahe(ek.x, 0, 3e-3) && nahe(ek.y, 0, 3e-3), `${wo}: Einheitskreis hat nicht den Radius 1`);
    const p = kreis(k, "p"), q = kreis(k, "q");
    pruefe(p && nahe(p.x, Math.cos(X0), 3e-3) && nahe(p.y, Math.sin(X0), 3e-3), `${wo}: P liegt nicht bei (cos x | sin x)`);
    pruefe(q && nahe(q.x, Math.cos(X0 + H), 3e-3) && nahe(q.y, Math.sin(X0 + H), 3e-3), `${wo}: Q liegt falsch`);
    const bogen = k.pfade.find((b) => b.rolle === "bogen");
    pruefe(!!bogen && bogen.punkte.every(([a, b]) => nahe(Math.hypot(a, b), 1, 4e-3)), `${wo}: Der Bogen liegt nicht auf dem Einheitskreis`);
    const hub = linie(k, "hub");
    pruefe(hub && nahe(hub.x1, Math.cos(X0 + H), 3e-3) && nahe(hub.y1, Math.sin(X0), 3e-3) && nahe(hub.y2, Math.sin(X0 + H), 3e-3), `${wo}: Der Hub ist nicht sin(x + h) − sin x`);
    const g = await lies(page, "#si-mount svg[data-panel=graph]");
    const s = linie(g, "sekante"), t = linie(g, "tangente"), q0 = (Math.sin(X0 + H) - Math.sin(X0)) / H;
    pruefe(s && nahe(steigung(s), q0, 3e-3), `${wo}: Sekantensteigung ${s && steigung(s)} statt ${q0}`);
    pruefe(t && nahe(steigung(t), ableitung(Math.sin, X0), 3e-3), `${wo}: Tangentensteigung ${t && steigung(t)}`);
    pruefe(nahe(await spanWert(page, "#si-bilanz .wr"), Math.sin(X0 + H) - Math.sin(X0), 6e-5), `${wo}: Bilanz-Hub falsch`);
    pruefe(nahe(await spanWert(page, "#si-bilanz .wo"), q0, 6e-5), `${wo}: Bilanz Δ : h falsch`);
    pruefe(nahe(await spanWert(page, "#si-bilanz .wa"), ableitung(Math.sin, X0), 6e-5), `${wo}: Bilanz cos x falsch`);
  }
}

// ---------- 6. Kettenregel ----------
const KE = {
  sin: { u: (x) => x * x, g: Math.sin },
  exp: { u: (x) => -x * x, g: E },
  wurzel: { u: (x) => x * x + 1, g: Math.sqrt },
};
async function kette(page) {
  for (const [art, def] of Object.entries(KE)) {
    await waehle(page, "ke-art", art);
    const ff = (t) => def.g(def.u(t));
    for (const x of [0.5, 1, 1.5, 2]) for (const h of [0.05, 0.5]) {
      const X0 = await setzeRegler(page, "ke-x", x), H = await setzeRegler(page, "ke-h", h);
      const wo = `Kettenregel ${art}, x = ${X0}, h = ${H}`;
      // Jede Zahlengerade hat ihre eigenen Striche mit data-wert — daraus der Maßstab je Gerade.
      const iv = await page.evaluate(() => {
        const svg = document.querySelector("#ke-mount svg");
        const aus = {};
        for (const a of ["x", "u", "f"]) {
          const st = [...svg.querySelectorAll(`line[data-achse="${a}"]`)].map((l) => ({ w: Number(l.dataset.wert), p: Number(l.getAttribute("x1")) }));
          const A = st[0], B = st[st.length - 1], s = (B.p - A.p) / (B.w - A.w);
          const l = svg.querySelector(`line[data-rolle="intervall-${a}"]`);
          const w = (p) => A.w + (p - A.p) / s;
          aus[a] = [w(Number(l.getAttribute("x1"))), w(Number(l.getAttribute("x2")))];
          aus[a + "pro"] = s;
        }
        return aus;
      });
      pruefe(nahe(iv.xpro, iv.upro, 1e-6) && nahe(iv.upro, iv.fpro, 1e-6), `${wo}: Die drei Zahlengeraden haben verschiedene Maßstäbe`);
      const sortiert = (a, b) => [Math.min(a, b), Math.max(a, b)];
      const soll = { x: [X0, X0 + H], u: sortiert(def.u(X0), def.u(X0 + H)), f: sortiert(ff(X0), ff(X0 + H)) };
      for (const a of ["x", "u", "f"]) pruefe(nahe(iv[a][0], soll[a][0], 3e-3) && nahe(iv[a][1], soll[a][1], 3e-3), `${wo}: ${a}-Intervall [${iv[a]}] statt [${soll[a]}]`);
      pruefe(nahe(await spanWert(page, "#ke-bilanz .wo"), (ff(X0 + H) - ff(X0)) / H, 6e-5), `${wo}: Bilanz Δf : Δx falsch`);
      pruefe(nahe(await spanWert(page, "#ke-bilanz .wa"), ableitung(ff, X0), 6e-5), `${wo}: Grenzwert der Kettenregel falsch`);
    }
  }
}

// ---------- 7. Quotientenregel ----------
const QU = {
  rational: { f: (x) => x / (x * x + 1), xs: [-3, 3], pole: [] },
  expx: { f: (x) => E(x) / x, xs: [0.3, 2.5], pole: [0] },
  tan: { f: Math.tan, xs: [-1.3, 1.3], pole: [-Math.PI / 2, Math.PI / 2] },
};
async function quotient(page) {
  for (const [art, def] of Object.entries(QU)) {
    await waehle(page, "qu-art", art);
    for (const anteil of [0, 0.25, 0.5, 0.75, 1]) {
      const x0 = await setzeRegler(page, "qu-x", Number((def.xs[0] + anteil * (def.xs[1] - def.xs[0])).toFixed(1)));
      const wo = `Quotient ${art}, x₀ = ${x0}`;
      const d = await lies(page, "#qu-mount svg");
      // Kein Ast läuft über eine Polstelle hinweg — sonst stünde dort eine senkrechte Linie.
      for (const p of d.pfade.filter((q) => q.rolle === "f")) {
        const xs = p.punkte.map(([x]) => x);
        pruefe(!def.pole.some((z) => Math.min(...xs) < z && Math.max(...xs) > z), `${wo}: Ein Ast überquert eine Polstelle`);
        aufGraph(wo, p.punkte.filter(([, y]) => Math.abs(y) < 50), def.f, 0.03);
      }
      if (art === "tan") {
        const as = d.linien.filter((l) => l.rolle === "asymptote").map((l) => l.x1).sort((a, b) => a - b);
        pruefe(as.length === 2 && nahe(as[0], -Math.PI / 2, 0.01) && nahe(as[1], Math.PI / 2, 0.01), `${wo}: Asymptoten bei ${as}`);
      }
      const m = ableitung(def.f, x0), t = linie(d, "tangente");
      pruefe(t && nahe(steigung(t), m, 3e-3 * (1 + Math.abs(m))), `${wo}: Tangente hat die Steigung ${t && steigung(t)} statt ${m}`);
      pruefe(nahe(await spanWert(page, "#qu-bilanz .wa"), m, 6e-5 + 1e-6 * Math.abs(m)), `${wo}: Bilanz f′(x₀) falsch`);
      pruefe(nahe(await spanWert(page, "#qu-bilanz .wo"), (def.f(x0 + 0.001) - def.f(x0)) / 0.001, 6e-5 + 1e-6 * Math.abs(m)), `${wo}: Differenzenquotient falsch`);
    }
  }
}

// ---------- 8. Die Funktion ln ----------
async function lnFunktion(page) {
  for (const a of [-1.5, -0.5, 0, 0.5, 1.5]) {
    const A = await setzeRegler(page, "lf-a", a);
    const wo = `ln a = ${A}`;
    const d = await lies(page, "#lf-mount svg");
    pruefe(nahe(d.proX, d.proY, 1e-3 * d.proX), `${wo}: verzerrt — die Spiegelung an y = x wäre keine`);
    aufGraph(wo + " (ln)", pfadPunkte(d, "ln").filter(([x]) => x > 0.01), Math.log, 0.03);
    aufGraph(wo + " (e^x)", pfadPunkte(d, "exp"), E);
    const p = kreis(d, "p"), q = kreis(d, "q");
    pruefe(p && nahe(p.x, A, 0.01) && nahe(p.y, E(A), 0.02), `${wo}: P liegt nicht bei (a | e^a)`);
    pruefe(q && p && nahe(q.x, p.y, 0.01) && nahe(q.y, p.x, 0.01), `${wo}: Q ist nicht das Spiegelbild von P`);
    const tq = linie(d, "tangente-q"), tp = linie(d, "tangente-p");
    pruefe(tq && nahe(steigung(tq), ableitung(Math.log, E(A)), 3e-3), `${wo}: Tangente an ln hat die Steigung ${tq && steigung(tq)}`);
    pruefe(tp && nahe(steigung(tp), ableitung(E, A), 3e-3 * (1 + E(A))), `${wo}: Tangente an e^x falsch`);
    // Das Dreieck bei Q ist Punkt für Punkt das Spiegelbild des Dreiecks bei P.
    const dp = d.vielecke.find((v) => v.rolle === "dreieck-p"), dq = d.vielecke.find((v) => v.rolle === "dreieck-q");
    pruefe(dp && dq && dp.punkte.every(([x, y], i) => nahe(dq.punkte[i][0], y, 0.01) && nahe(dq.punkte[i][1], x, 0.01)), `${wo}: Das Dreieck bei Q ist nicht gespiegelt`);
    pruefe(nahe(await spanWert(page, "#lf-bilanz .wo"), E(A), 6e-5), `${wo}: Bilanz e^a falsch`);
    pruefe(nahe(await spanWert(page, "#lf-bilanz .wa"), ableitung(Math.log, E(A)), 6e-5), `${wo}: Bilanz 1/x falsch`);
  }
}

// ---------- 9. Verhalten für x → ±∞ ----------
const VH = {
  x3e: { f: (x) => x ** 3 * E(-x) },
  x2e: { f: (x) => x * x * E(x) },
  ex: { f: (x) => E(x) / (x * x) },
  lnx: { f: (x) => Math.log(x) / x },
  sin: { f: (x) => x * Math.sin(x) },
};
const HOCH = { "⁰": 0, "¹": 1, "²": 2, "³": 3, "⁴": 4, "⁵": 5, "⁶": 6, "⁷": 7, "⁸": 8, "⁹": 9 };
// „≈ 4,54 · 10⁻⁵“ oder „≈ 0,0454“ als Zahl.
function langeZahl(s) {
  const m = s.match(/(−?[\d.,]+)(?: · 10([⁻]?)([⁰¹²³⁴⁵⁶⁷⁸⁹]+))?/);
  if (!m) return NaN;
  const e = m[3] ? (m[2] ? -1 : 1) * Number([...m[3]].map((c) => HOCH[c]).join("")) : 0;
  return zahl(m[1]) * 10 ** e;
}
async function verhalten(page) {
  for (const [art, def] of Object.entries(VH)) {
    await waehle(page, "vh-art", art);
    for (let i = 0; i <= 4; i++) {
      await setzeRegler(page, "vh-w", i);
      const wo = `Verhalten ${art}, Fenster ${i}`;
      const d = await lies(page, "#vh-mount svg");
      // Der Ausschnitt passt sich dem Inhalt an — der Spielraum sind zwei Bildpunkte.
      aufGraph(wo, pfadPunkte(d, "f"), def.f, 2 / d.proY);
      const r = kreis(d, "rand"), xr = Number(r && r.daten.wert);
      pruefe(r && nahe(r.x, xr, 1e-3 * (1 + Math.abs(xr))), `${wo}: Randpunkt fehlt`);
      const bil = await text(page, "#vh-bilanz");
      const g = bil.match(/f\((−?[\d.,]+)\) (?:≈|=) (−?[\d.,]+(?: · 10⁻?[⁰¹²³⁴⁵⁶⁷⁸⁹]+)?)/);
      const w = g ? langeZahl(g[2]) : NaN, soll = def.f(zahl(g ? g[1] : "x"));
      pruefe(!!g && nahe(zahl(g[1]), xr, 1e-9) && nahe(w, soll, Math.max(6e-5, 0.006 * Math.abs(soll))), `${wo}: Bilanz nennt f(${g && g[1]}) ≈ ${g && g[2]} statt ${soll}`);
    }
  }
}

// ---------- 10. Symmetrie und Periode ----------
const SY = {
  cos: Math.cos, sin: Math.sin, gauss: (x) => E(-x * x), xgauss: (x) => x * E(-x * x), xsin: (x) => x * Math.sin(x), ex: E,
};
// Unabhängig, an vielen Stellen: Gilt die Gleichung überall?
function hatEigenschaft(f, modus) {
  for (let x = -6; x <= 6; x += 0.01) {
    const a = modus === "achse" ? f(-x) - f(x) : modus === "punkt" ? f(-x) + f(x) : f(x + 2 * Math.PI) - f(x);
    if (Math.abs(a) > 1e-9) return false;
  }
  return true;
}
async function symmetrie(page) {
  for (const [art, f] of Object.entries(SY)) {
    await waehle(page, "sy-art", art);
    for (const modus of ["achse", "punkt", "periode"]) {
      await waehle(page, "sy-modus", modus);
      const ja = hatEigenschaft(f, modus);
      for (const t of [0, 0.35, 0.5, 1]) {
        const T = await setzeRegler(page, "sy-t", t);
        const wo = `Symmetrie ${art}, ${modus}, t = ${T}`;
        const d = await lies(page, "#sy-mount svg");
        pruefe(nahe(d.proX, d.proY, 1e-3 * d.proX), `${wo}: verzerrt — eine Drehung wäre im Bild keine`);
        const kopie = pfadPunkte(d, "kopie");
        // Jeder Punkt der Kopie ist das Bild eines Graphpunkts: zurückbewegt, liegt er auf f.
        let schlecht = 0, bsp = "";
        for (const [u, v] of kopie) {
          let x, y;
          if (modus === "achse") {
            if (Math.abs(1 - 2 * T) < 1e-9) { if (Math.abs(u) > 0.01) { schlecht++; bsp = `${u}`; } continue; }
            [x, y] = [u / (1 - 2 * T), v];
          } else if (modus === "punkt") {
            const w = -Math.PI * T;
            [x, y] = [u * Math.cos(w) - v * Math.sin(w), u * Math.sin(w) + v * Math.cos(w)];
          } else [x, y] = [u - 2 * Math.PI * T, v];
          if (!nahe(y, f(x), 0.03 + 0.01 * Math.abs(ableitung(f, x, 1e-5)))) { schlecht++; bsp = `(${u.toFixed(2)} | ${v.toFixed(2)})`; }
        }
        pruefe(kopie.length > 100 && schlecht === 0, `${wo}: ${schlecht} Punkte der Kopie sind keine Bilder von Graphpunkten, etwa ${bsp}`);
        if (T === 1) {
          // Am Ende liegt die Kopie genau dann auf dem Graphen, wenn f die Eigenschaft hat.
          const drauf = kopie.filter(([u]) => Math.abs(u) <= 5).every(([u, v]) => nahe(v, f(u), 0.03 + 0.01 * Math.abs(ableitung(f, u, 1e-5))));
          pruefe(drauf === ja, `${wo}: Die Kopie liegt ${drauf ? "" : "nicht "}auf dem Graphen, die Eigenschaft gilt aber ${ja ? "" : "nicht"}`);
        }
        const urteil = await page.evaluate(() => (document.querySelector("#sy-bilanz .wa") ? "ja" : document.querySelector("#sy-bilanz .wg") ? "nein" : "?"));
        pruefe(urteil === (ja ? "ja" : "nein"), `${wo}: Die Bilanz urteilt „${urteil}“`);
      }
    }
  }
}

// ---------- 11. Nullstellen ----------
async function nullstellen(page) {
  const faelle = {
    produkt: { cs: [0, 0.25, 2, 4], f: (c) => (x) => (x * x - c) * E(-0.5 * x), bild: [-3, 5] },
    exp: { cs: [-1, 0, 0.25, 3, 6], f: (c) => (x) => E(x) - c, bild: [-3, 2.5] },
    sin: { cs: [-1, -0.75, -0.25, 0, 0.5, 1], f: (c) => (x) => Math.sin(x) - c, bild: [0, 2 * Math.PI - 1e-9] },
  };
  for (const [art, def] of Object.entries(faelle)) {
    await waehle(page, "ns-art", art);
    for (const c of def.cs) {
      const C = await setzeRegler(page, "ns-c", c);
      const wo = `Nullstellen ${art}, c = ${C}`;
      const g = def.f(C);
      // Unabhängig: Vorzeichenwechsel, dazu Berührstellen (|g| fast 0 ohne Wechsel).
      let soll = vzw(g, def.bild[0], def.bild[1]);
      if (art === "produkt" && C === 0) soll = [0];
      if (art === "sin" && Math.abs(C) === 1) soll = [C > 0 ? Math.PI / 2 : 1.5 * Math.PI];
      if (art === "sin" && C === 0) soll = [0, Math.PI];
      const d = await lies(page, "#ns-mount svg");
      const rolle = art === "sin" ? "loesung" : "nullstelle";
      const marken = d.kreise.filter((k) => k.daten.rolle === rolle).map((k) => Number(k.daten.wert)).sort((a, b) => a - b);
      pruefe(marken.length === soll.length && marken.every((z, i) => nahe(z, soll[i], 1e-5) && Math.abs(g(z)) < 1e-9), `${wo}: markiert ${marken} statt ${soll}`);
      for (const k of d.kreise.filter((q) => q.daten.rolle === rolle)) pruefe(nahe(k.x, Number(k.daten.wert), 0.01), `${wo}: Marke sitzt nicht an ihrer Stelle`);
      if (art === "produkt") aufGraph(wo + " (Polynom)", pfadPunkte(d, "polynom"), (x) => x * x - C);
      aufGraph(wo, pfadPunkte(d, "f"), art === "sin" ? Math.sin : (x) => g(x));
      // Grün hervorgehoben sind die Lösungen — und bei c = ±1 das Wort „eine“; gezählt werden die Zahlen.
      const genannt = await page.evaluate(() => [...document.querySelectorAll("#ns-bilanz .wa")].map((s) => s.textContent).filter((t) => /\d/.test(t)));
      if (!soll.length) {
        pruefe(genannt.length === 0 && /keine Lösung/.test(await text(page, "#ns-bilanz")), `${wo}: Die Bilanz nennt eine Lösung, wo keine ist`);
        continue;
      }
      // Jede genannte Zahl ist eine Nullstelle (±… zählt doppelt).
      const zahlen = genannt.flatMap((s) => (/^±/.test(s) ? [-zahl(s.slice(1)), zahl(s.slice(1))] : [zahl(s)]));
      pruefe(zahlen.length === soll.length && zahlen.every((z) => soll.some((w) => nahe(z, w, 6e-5))), `${wo}: Bilanz nennt ${zahlen} statt ${soll}`);
    }
  }
}

// ---------- 12. Monotonie und Extrempunkte ----------
const MO = {
  xe: { f: (x) => x * E(-x), xs: [-1, 4] },
  x2e: { f: (x) => (x * x - 3) * E(x), xs: [-4.5, 1.4] },
  xsin: { f: (x) => x - 2 * Math.sin(x), xs: [-1.5, 7] },
  xln: { f: (x) => x * Math.log(x), xs: [0.1, 3] },
};
function kritisch(f, lo, hi) {
  const d = (x) => ableitung(f, x);
  return vzw(d, lo, hi).map((z) => ({ x: z, typ: d(z - 0.02) > 0 && d(z + 0.02) < 0 ? "H" : d(z - 0.02) < 0 && d(z + 0.02) > 0 ? "T" : "S" }));
}
async function monotonie(page) {
  for (const [art, def] of Object.entries(MO)) {
    await waehle(page, "mo-art", art);
    const krit = kritisch(def.f, def.xs[0] + 0.05, def.xs[1] - 0.05);
    for (const anteil of [0, 0.25, 0.5, 0.75, 1]) {
      const x0 = await setzeRegler(page, "mo-x", Number((def.xs[0] + anteil * (def.xs[1] - def.xs[0])).toFixed(1)));
      const wo = `Monotonie ${art}, x₀ = ${x0}`;
      const o = await lies(page, "#mo-mount svg[data-panel=f]");
      for (const p of o.pfade.filter((q) => q.rolle === "graph")) {
        for (const [x, y] of p.punkte) {
          if (x <= 0.002 && art === "xln") continue;
          pruefe(nahe(y, def.f(x), 0.02), `${wo}: Graphpunkt (${x} | ${y}) liegt nicht auf f`);
          const v = ableitung(def.f, x);
          if (krit.every((k) => Math.abs(k.x - x) > 0.06)) pruefe((v > 0) === (p.teil === "steigt"), `${wo}: bei x = ${x.toFixed(2)} als „${p.teil}“ gefärbt, f′ = ${v}`);
        }
      }
      const t = linie(o, "tangente");
      pruefe(t && nahe(steigung(t), ableitung(def.f, x0), 3e-3 * (1 + Math.abs(ableitung(def.f, x0)))), `${wo}: Tangente falsch`);
      const marken = o.kreise.filter((k) => k.daten.rolle === "extrem");
      pruefe(marken.length === krit.length, `${wo}: ${marken.length} markierte Punkte statt ${krit.length}`);
      for (const k of krit) {
        const mk = marken.find((x) => nahe(x.x, k.x, 0.01));
        pruefe(mk && mk.daten.typ[0] === k.typ && nahe(mk.y, def.f(k.x), 0.02), `${wo}: Punkt bei ${k.x} fehlt oder ist kein ${k.typ}`);
      }
      const u = await lies(page, "#mo-mount svg[data-panel=a]");
      for (const p of u.pfade) for (const [x, y] of p.punkte) if (x > 0.002 || art !== "xln") pruefe(nahe(y, ableitung(def.f, x), 0.05), `${wo}: Punkt (${x} | ${y}) liegt nicht auf f′`);
      const nst = u.kreise.filter((k) => k.daten.rolle === "nullstelle-ableitung").map((k) => Number(k.daten.wert)).sort((a, b) => a - b);
      pruefe(nst.length === krit.length && nst.every((z, i) => nahe(z, krit[i].x, 1e-5)), `${wo}: Nullstellen von f′ bei ${nst}`);
      const bil = await text(page, "#mo-bilanz");
      // Jeder genannte Extrempunkt wird nachgerechnet (die Schreibweise mit Dezimalzahlen).
      const genannt = [...bil.matchAll(/([HT])[₁₂]?\((−?[\d,]+) \| (−?[\d,]+)\)/g)];
      pruefe(genannt.length === krit.length, `${wo}: Bilanz nennt ${genannt.length} Punkte statt ${krit.length}`);
      for (const g of genannt) {
        const x = zahl(g[2]), k = krit.find((c) => nahe(c.x, x, 1e-3));
        pruefe(k && k.typ === g[1] && nahe(zahl(g[3]), def.f(k.x), 1e-4), `${wo}: „${g[0]}“ stimmt nicht`);
      }
      // Monotonie-Aussagen mit Zahlengrenzen: Das Verb gilt bis zum nächsten Verb.
      let richtung = 0;
      for (const teil of bil.split(/;|\.|\bund\b|—/)) {
        if (/fällt/.test(teil)) richtung = -1; else if (/steigt/.test(teil)) richtung = 1;
        if (!richtung) continue;
        for (const iv of teil.matchAll(/(−?[\d,]+) < x < (−?[\d,]+)|x < (−?[\d,]+)|x > (−?[\d,]+)/g)) {
          const lo = iv[1] ? zahl(iv[1]) : iv[4] ? zahl(iv[4]) : def.xs[0];
          const hi = iv[2] ? zahl(iv[2]) : iv[3] ? zahl(iv[3]) : def.xs[1];
          for (let i = 1; i < 20; i++) {
            const x = lo + ((hi - lo) * i) / 20;
            pruefe(Math.sign(ableitung(def.f, x)) === richtung, `${wo}: „${teil.trim()}“ — bei x = ${x} ist f′ = ${ableitung(def.f, x)}`);
          }
        }
      }
      const aktuell = await page.evaluate(() => { const s = [...document.querySelectorAll("#mo-bilanz span")].pop(); return s ? s.textContent : ""; });
      pruefe(nahe(zahl(aktuell), ableitung(def.f, x0), 1e-4), `${wo}: f′(x₀) in der Bilanz ${aktuell}`);
    }
  }
}

// ---------- 13. Wachstum und Schwingung ----------
const WA = {
  bakterien: (t) => 500 * E(0.3 * t),
  abkuehlung: (t) => 20 + 70 * E(-0.1 * t),
  pendel: (t) => 4 * Math.sin(2 * t),
};
async function wachstum(page) {
  for (const [art, f] of Object.entries(WA)) {
    await waehle(page, "wa-art", art);
    for (const t of [0, 0.75, 2, 5.5, 10]) {
      const T = await setzeRegler(page, "wa-t", t);
      const wo = `Wachstum ${art}, t = ${T}`;
      const d = await lies(page, "#wa-mount svg");
      aufGraph(wo, pfadPunkte(d, "f"), f, art === "bakterien" ? 20 : 0.05);
      const m = ableitung(f, T, 1e-5), tg = linie(d, "tangente");
      pruefe(tg && nahe(steigung(tg), m, 3e-3 * (1 + Math.abs(m))), `${wo}: Tangente hat die Steigung ${tg && steigung(tg)} statt ${m}`);
      pruefe(nahe(await spanWert(page, "#wa-bilanz .wc"), f(T), 0.006), `${wo}: Bilanz nennt einen anderen Bestand`);
      pruefe(nahe(await spanWert(page, "#wa-bilanz .wa"), m, 0.006 + 1e-6 * Math.abs(m)), `${wo}: Bilanz nennt eine andere Rate`);
      if (art === "abkuehlung") {
        const as = linie(d, "asymptote");
        pruefe(as && nahe(as.y1, 20, 0.05), `${wo}: Die Raumtemperatur ist nicht als Asymptote eingezeichnet`);
      }
    }
  }
}

// ---------- 14. Stolperstelle ----------
async function stolperstelle(page) {
  for (let x = -2; x <= 2 + 1e-9; x += 0.5) {
    const x0 = await setzeRegler(page, "sp-x", Number(x.toFixed(1)));
    const wo = `Stolperstelle x₀ = ${x0}`;
    const d = await lies(page, "#sp-mount svg");
    aufGraph(wo, pfadPunkte(d, "graph"), E);
    const t = linie(d, "tangente"), fa = linie(d, "falsch"), m = ableitung(E, x0);
    pruefe(t && nahe(steigung(t), m, 3e-3 * (1 + m)), `${wo}: Die Tangente hat die Steigung ${t && steigung(t)} statt ${m}`);
    pruefe(fa && nahe(steigung(fa), x0 * E(x0 - 1), 3e-3 * (1 + Math.abs(x0))), `${wo}: Die falsche Gerade hat nicht die Steigung x₀ · e^(x₀ − 1)`);
    pruefe(fa && nahe(fa.y1 + steigung(fa) * (x0 - fa.x1), E(x0), 0.02), `${wo}: Die falsche Gerade geht nicht durch P`);
    pruefe(nahe(await spanWert(page, "#sp-bilanz .wa"), m, 6e-5), `${wo}: Bilanz: richtige Steigung falsch`);
    pruefe(nahe(await spanWert(page, "#sp-bilanz .wg"), x0 * E(x0 - 1), 6e-5), `${wo}: Bilanz: falsche Steigung falsch`);
    pruefe(nahe(await spanWert(page, "#sp-bilanz .wo"), (E(x0 + 0.001) - E(x0)) / 0.001, 6e-5), `${wo}: Bilanz: Differenzenquotient falsch`);
  }
}

// ---------- Kontrollfragen und Selbsteinschätzung ----------
async function quizze(page) {
  const ids = await page.evaluate(() => [...document.querySelectorAll(".quiz")].map((q) => q.id));
  pruefe(ids.length === 14, `Kontrollfragen: ${ids.length} statt 14`);
  const abschnitte = await page.evaluate(() => [...document.querySelectorAll(".quiz")].map((q) => q.closest("section").id));
  pruefe(JSON.stringify(abschnitte) === JSON.stringify(ABSCHNITTE), "Kontrollfragen: Nicht jeder Erarbeitungsabschnitt hat seine eigene");
  const stellen = [];
  for (const id of ids) {
    const anzahl = await page.locator(`#${id} .quiz-opt`).count();
    pruefe(anzahl === 4, `Quiz ${id}: ${anzahl} Antworten statt 4`);
    let richtige = 0;
    for (let i = 0; i < anzahl; i++) {
      await page.locator(`#${id} .quiz-opt`).nth(i).click();
      const r = await page.evaluate((q) => { const f = document.querySelector(`#${q} .quiz-feedback`); return { ok: f.classList.contains("ok"), text: f.textContent }; }, id);
      if (r.ok) { richtige++; stellen.push(i); }
      pruefe(r.text.length > 90, `Quiz ${id}: die Erklärung ist nur ${r.text.length} Zeichen lang`);
    }
    pruefe(richtige === 1, `Quiz ${id}: ${richtige} richtige Antworten`);
  }
  pruefe(new Set(stellen).size >= 4, `Kontrollfragen: die richtige Antwort steht nur an ${new Set(stellen).size} Stellen`);
  await page.evaluate(() => localStorage.clear());
  await page.locator("#se-liste .se-zeile").nth(5).locator("button").nth(2).click();
  const aus = await page.evaluate(() => document.getElementById("se-auswertung").innerHTML);
  pruefe(/href="#sec-kette">6\. Die Kettenregel</.test(aus), `Selbsteinschätzung: kein sauberer Verweis zurück zur Kettenregel — „${aus}“`);
  await page.evaluate(() => localStorage.clear());
}

// ---------- Übungsaufgaben ----------
const T = 0.0001;
// Gemessen mit tests/werkzeug-streuung.js (200 Würfe je Aufgabe, 10⁻⁴-Quantil für 0,8 · n):
//   UPLANT_ZUEGE=25 node tests/werkzeug-streuung.js /mathematik/mss11/01-analysis/03b-weitere-funktionen-ableiten/index.html
// Termaufgaben (6, 12, 18, 24) mit 12 Zügen: UPLANT_ZUEGE=12 …
const RT = 12;
// Messung: n ≈ 101, 1592, 104, 134, 55, groß, 554, 127, 205, 535, 174, 2421, 165, 346, 442, 119, 35,
// groß, 81, 55, 73, 71, 273, 1742 (Aufgaben 1 bis 24).
const SCHRANKE = {1: 16, 2: 22, 3: 16, 4: 17, 5: 13, 6: 9, 7: 20, 8: 16, 9: 18, 10: 20, 11: 17, 12: 10, 13: 17, 14: 19, 15: 20, 16: 16, 17: 11, 18: 9, 19: 15, 20: 13, 21: 14, 22: 14, 23: 19, 24: 10};
const ZAHL = "(−?[\\d,]+)";
// Ein Vorfaktor in der Angabe: „“ ist 1, „−“ ist −1.
const faktor = (s) => (s === "" || s === undefined ? 1 : s === "−" ? -1 : zahl(s));
// Die Aufgabenstellung mit Hochzahlen als „^(…)“ und Brüchen als „(z)/(n)“ — im reinen Text stünde
// aus 3e^(2x) ein „3e2x“.
async function liesHoch(page, box) {
  return page.evaluate((b) => {
    const e = document.querySelector(`${b} .aufgabe-prompt`).cloneNode(true);
    // Ein Zeilenumbruch zählt als Leerzeichen — textContent ließe ihn sonst einfach weg.
    e.querySelectorAll("br").forEach((s) => s.replaceWith(" "));
    e.querySelectorAll("sup").forEach((s) => s.replaceWith(`^(${s.textContent})`));
    e.querySelectorAll("sub").forEach((s) => s.replaceWith(`_${s.textContent}`));
    e.querySelectorAll(".bruch").forEach((x) => x.replaceWith(`(${x.querySelector(".z").textContent})/(${x.querySelector(".n").textContent})`));
    return e.textContent.replace(/\s+/g, " ").trim();
  }, box);
}
// „+ 3“ / „− 2“ als Zahl, fehlend 0.
const summand = (z, b) => (b === undefined ? 0 : (z === "−" ? -1 : 1) * zahl(b));
const lin = (s) => { const t = s.replace(/−/g, "-").replace(/\s+/g, ""); const m = t.match(/^(-?[\d,]*)x([+-][\d,]+)?$/); return m ? { a: m[1] === "" ? 1 : m[1] === "-" ? -1 : zahl(m[1]), b: m[2] ? zahl(m[2]) : 0 } : null; };

async function aufgaben(page) {
  const r = 25;
  const A = (nr, name, deute, mitHoch = true) => pruefeAufgabe(page, bericht, { nr, name, runden: r, mindestensVerschieden: SCHRANKE[nr] ?? 5,
    liesRoh: mitHoch ? liesHoch : undefined, deute: mitHoch ? (frage, roh) => deute(roh, frage) : (frage) => deute(frage, frage) });

  await A(1, "A1 Steigung an der Stelle ln c", (q) => {
    const m = q.match(new RegExp(`f\\(x\\) = (−?[\\d,]*)e\\^\\((−?[\\d,]*)x\\)\\. Berechne f′\\(ln ${ZAHL}\\) exakt`));
    if (!m) return null;
    const a = faktor(m[1]), k = faktor(m[2]), c = zahl(m[3]), f = (x) => a * E(k * x), x0 = Math.log(c);
    return { richtig: ableitung(f, x0), toleranz: T, falsch: [[k === 1 ? NaN : f(x0), "der Faktor k"], [k === 1 ? NaN : a * k * c, "Potenzgesetz"]] };
  });
  await A(2, "A2 Exponentialgleichung", (q) => {
    const m = q.match(new RegExp(`Löse die Gleichung (−?[\\d,]*)e\\^\\((−?[\\d,]*)x\\)(?: ([+−]) ([\\d,]+))? = ${ZAHL}\\.`));
    if (!m) return null;
    const a = faktor(m[1]), k = faktor(m[2]), b = summand(m[3], m[4]), c = zahl(m[5]);
    const x = bisektion((t) => a * E(k * t) + b - c, -150, 150), rr = (c - b) / a, ln = (z) => (z > 0 ? Math.log(z) : NaN);
    return { richtig: x, toleranz: T, pruefe: () => pruefe(nahe(a * E(k * x) + b, c, 1e-6), "A2: Die nachgerechnete Lösung erfüllt die Gleichung nicht"),
      falsch: [[Math.abs(k) === 1 ? NaN : Math.log(rr) * k, "nicht mit k multiplizieren"], [ln(c - b) / k, "dann logarithmieren"], [b === 0 ? NaN : ln(c / a) / k, "auf die andere Seite"], [b === 0 ? NaN : ln((c + b) / a) / k, "Vorzeichen"]] };
  });
  await A(3, "A3 Sinus und Kosinus ableiten", (q) => {
    const m = q.match(/f\(x\) = (.+?) \(x im Bogenmaß\)\. Berechne f′\((.+?)\)\./);
    if (!m) return null;
    const t = m[1].replace(/−/g, "-").replace(/\s+/g, "");
    const ks = (fn) => { const g = t.match(new RegExp(`([+-]?[\\d,]*)${fn}x`)); return g ? (g[1] === "" || g[1] === "+" ? 1 : g[1] === "-" ? -1 : zahl(g[1])) : 0; };
    const a = ks("sin"), b = ks("cos");
    const ausdruck = m[2].replace(/(\d)π/g, "$1*π").replace(/π/g, "Math.PI");
    if (!/^[\d()*/.Mathpi PI]+$/.test(ausdruck)) return null;
    const x0 = Function(`return ${ausdruck}`)();
    const f = (x) => a * Math.sin(x) + b * Math.cos(x);
    return { richtig: ableitung(f, x0), toleranz: T, falsch: [[b === 0 ? NaN : a * Math.cos(x0) + b * Math.sin(x0), "das Minuszeichen fehlt"], [f(x0), "erst ableiten"]] };
  });
  await A(4, "A4 Wachstums- und Zerfallsrate", (q) => {
    const m = q.match(/([Nm])\(t\) = ([\d.,]+) · e\^\((−?[\d,]+)t\)/), s = q.match(/Gib [Nm]′\(([\d,]+)\)/);
    if (!m || !s) return null;
    const N0 = zahl(m[2]), k = zahl(m[3]), t1 = zahl(s[1]), f = (t) => N0 * E(k * t);
    return { richtig: ableitung(f, t1, 1e-5), toleranz: T, falsch: [[f(t1), "nicht seine Änderungsrate"], [ableitung(f, 0, 1e-5), "die Rate zu Beginn"]] };
  });
  await A(5, "A5 Waagerechte Tangente", (q) => {
    const m = q.match(/f\(x\) = (?:\(x ([+−]) ([\d,]+)\)|x) · e\^\((−?[\d,]*)x\)\. An welcher Stelle/);
    if (!m) return null;
    const b = summand(m[1], m[2]), k = faktor(m[3]), f = (x) => (x + b) * E(k * x);
    const st = vzw((x) => ableitung(f, x), -40, 40);
    if (st.length !== 1) return null;
    return { richtig: st[0], toleranz: T, falsch: [[-b, "Dort ist f selbst null"], [-b + 1 / k, "Vorzeichenfehler"], [Math.abs(k) === 1 ? NaN : -b - k, "nicht mit k multipliziert"]] };
  });
  await A(7, "A7 Tangente auf der y-Achse", (q) => {
    const m = q.match(/f\(x\) = (−?[\d,]*)e\^\((−?[\d,]*)x\)(.*?)\. Bestimme die Tangente/);
    if (!m) return null;
    const a = faktor(m[1]), k = faktor(m[2]);
    const rest = m[3].replace(/−/g, "-").replace(/\s+/g, "");
    const dm = rest.match(/([+-][\d,]*)x/), cm = rest.replace(/[+-][\d,]*x/, "").match(/[+-][\d,]+/);
    const d = dm ? (dm[1] === "+" ? 1 : dm[1] === "-" ? -1 : zahl(dm[1])) : 0, c = cm ? zahl(cm[0]) : 0;
    const f = (x) => a * E(k * x) + d * x + c;
    return { felder: [ableitung(f, 0), f(0)], toleranz: T,
      falschFelder: [[0, k === 1 ? NaN : a + d, "Der Faktor k fehlt"], [0, d === 0 ? NaN : a * k, "hat die Ableitung"], [1, c, "e⁰ = 1"], [1, c === 0 ? NaN : a, "gehört zu f(0) dazu"]] };
  });
  await A(8, "A8 Produktregel und Ausklammern", (q) => {
    const m = q.match(/f\(x\) = \((.+?)\) · e\^\((−?[\d,]*)x\)\. Bestimme f′\(x\) in der Form/);
    if (!m) return null;
    const u = lin(m[1]), k = faktor(m[2]);
    if (!u) return null;
    const f = (x) => (u.a * x + u.b) * E(k * x), g = (x) => ableitung(f, x) / E(k * x);
    const qq = g(0), p = g(1) - g(0);
    return { felder: [p, qq], toleranz: T, pruefe: () => pruefe(nahe(g(2), 2 * p + qq, 1e-5), "A8: f′ : e^(kx) ist nicht linear"),
      falschFelder: [[0, 0, "Ohne x in der Klammer"], [0, k === 1 ? NaN : u.a, "der Faktor k fehlt"], [1, u.a * k, "nicht faktorweise"], [1, k * u.b, "Der Summand u′ · v"], [1, k === 1 ? NaN : u.a + u.b, "der Faktor k fehlt"]] };
  });
  await A(9, "A9 Kettenregel", (q) => {
    const m = q.match(new RegExp(`f\\(x\\) = \\((.+?)\\)([²³⁴⁵])\\. Berechne f′\\(${ZAHL}\\)`));
    if (!m) return null;
    const u = lin(m[1]), n = HOCH[m[2]], x0 = zahl(m[3]);
    if (!u) return null;
    const v = u.a * x0 + u.b, f = (x) => (u.a * x + u.b) ** n;
    return { richtig: ableitung(f, x0, 1e-6), toleranz: Math.max(T, 1e-6 * Math.abs(ableitung(f, x0, 1e-6))), falsch: [[n * v ** (n - 1), "Die innere Ableitung fehlt"], [v ** n, "Funktionswert"], [n * u.a * v ** n, "der Exponent wird um 1 kleiner"]] };
  }, false);
  await A(10, "A10 Quotientenregel", (q) => {
    const m = q.match(new RegExp(`f\\(x\\) = \\((.+?)\\)/\\((.+?)\\)\\. Berechne f′\\(${ZAHL}\\) mit der Quotientenregel`));
    if (!m) return null;
    const P = (s) => { const t = s.replace(/−/g, "-").replace(/\s+/g, ""); const k = {}; for (const g of t.matchAll(/([+-]?[\d,]*)(x²|x)?/g)) { if (!g[0]) continue; const c = g[1] === "" || g[1] === "+" ? 1 : g[1] === "-" ? -1 : zahl(g[1]); k[g[2] === "x²" ? 2 : g[2] ? 1 : 0] = c; } return (x) => (k[2] || 0) * x * x + (k[1] || 0) * x + (k[0] || 0); };
    const U = P(m[1]), V = P(m[2]), x0 = zahl(m[3]), f = (x) => U(x) / V(x), w = ableitung(f, x0);
    return { richtig: w, toleranz: T, pruefe: () => pruefe(nahe(f(x0), U(x0) / V(x0), 1e-12) && Math.abs(V(x0)) > 0, "A10: Nenner null"),
      falsch: [[-w, "Reihenfolge im Zähler"], [w * V(x0), "Der Nenner ist v²"], [ableitung(U, x0) / ableitung(V, x0), "nicht faktorweise"]] };
  });
  await A(11, "A11 Stelle mit vorgegebener Steigung", (q) => {
    const m = q.match(new RegExp(`f\\(x\\) = (−?[\\d,]*)e\\^\\((−?[\\d,]*)x\\)\\. An welcher Stelle hat der Graph von f die Steigung ${ZAHL}\\?`));
    if (!m) return null;
    const a = faktor(m[1]), k = faktor(m[2]), mm = zahl(m[3]), f = (x) => a * E(k * x);
    const x = bisektion((t) => ableitung(f, t, 1e-5) - mm, -60, 60), rr = mm / (a * k);
    return { richtig: x, toleranz: T, pruefe: () => pruefe(nahe(ableitung(f, x, 1e-5), mm, 1e-4), "A11: An der nachgerechneten Stelle ist die Steigung nicht die verlangte"),
      falsch: [[mm / a > 0 ? Math.log(mm / a) / k : NaN, "der Faktor k fehlt"], [Math.abs(k) === 1 ? NaN : Math.log(rr) * k, "teilen, nicht multiplizieren"], [k === 1 ? NaN : Math.log(rr), "teile noch durch"]] };
  });
  await A(13, "A13 Extrempunkt", (q) => {
    const m = q.match(/f\(x\) = \((.+?)\) · e\^\((−?[\d,]*)x\)\. Bestimme die Koordinaten des Extrempunkts/);
    if (!m) return null;
    const u = lin(m[1]), k = faktor(m[2]);
    if (!u) return null;
    const f = (x) => (u.a * x + u.b) * E(k * x), st = vzw((x) => ableitung(f, x), -40, 40);
    if (st.length !== 1) return null;
    const x = st[0];
    return { felder: [x, f(x)], toleranz: T,
      falschFelder: [[0, -u.b / u.a, "Dort ist f null"], [0, -u.b / u.a + 1 / k, "Vorzeichenfehler"], [1, Math.abs(x) < 1e-9 ? NaN : u.a * x + u.b, "gehört zum Funktionswert dazu"]] };
  });
  await A(14, "A14 Sinusgleichung", (q) => {
    const m = q.match(new RegExp(`Gleichung (−?[\\d,]*)sin x(?: ([+−]) ([\\d,]+))? = ${ZAHL} im Bereich`));
    if (!m) return null;
    const a = faktor(m[1]), d = summand(m[2], m[3]), e = zahl(m[4]);
    const ls = vzw((x) => a * Math.sin(x) + d - e, 0, 2 * Math.PI - 1e-9);
    if (ls.length !== 2) return null;
    const c = (e - d) / a, s = Math.asin(c);
    return { felder: ls, toleranz: T,
      falschFelder: [[0, s * GRAD, "Winkel in Grad"], [0, c < 0 ? s : NaN, "addiere 2π"], [1, Math.PI + s, "nicht π + sin⁻¹(c)"], [1, c > 0 ? 2 * Math.PI - s : NaN, "Symmetrie des Kosinus"], [1, s * GRAD, "Winkel in Grad"]] };
  });
  await A(15, "A15 Tangente an eine ln-Funktion", (q) => {
    const m = q.match(new RegExp(`f\\(x\\) = (−?[\\d,]*)ln\\(([\\d,]*)x\\)(?: ([+−]) ([\\d,]+))? \\(x > 0\\)\\. Bestimme die Tangente an den Graphen im Punkt mit x₀ = ${ZAHL}`));
    if (!m) return null;
    const a = faktor(m[1]), c = m[2] ? zahl(m[2]) : 1, d = summand(m[3], m[4]), x0 = zahl(m[5]);
    const f = (x) => a * Math.log(c * x) + d, s = ableitung(f, x0), b = f(x0) - s * x0;
    return { felder: [s, b], toleranz: T,
      falschFelder: [[0, c === 1 ? NaN : (a * c) / x0, "die innere Ableitung kürzt sich"], [0, x0 === 1 ? NaN : a * x0, "durch x₀ geteilt"], [1, f(x0), "nicht der Achsenabschnitt"], [1, f(x0) + s * x0, "Vorzeichen"]] };
  });
  await A(16, "A16 Kettenregel und Tangente", (q) => {
    const m = q.match(new RegExp(`f\\(x\\) = √\\((.+?)\\)\\. Bestimme die Tangente an den Graphen im Punkt mit x₀ = ${ZAHL}`));
    if (!m) return null;
    const u = lin(m[1]), x0 = zahl(m[2]);
    if (!u) return null;
    const f = (x) => Math.sqrt(u.a * x + u.b), s = ableitung(f, x0, 1e-6), b = f(x0) - s * x0;
    return { felder: [s, b], toleranz: T, falschFelder: [[0, u.a === 1 ? NaN : 1 / (2 * f(x0)), "Die innere Ableitung fehlt"], [1, f(x0), "nicht der Achsenabschnitt"]] };
  }, false);
  await A(17, "A17 Halbwertszeit und Abbaurate", (q) => {
    const m = q.match(/m\(t\) = ([\d,]+) · e\^\(−kt\) .*? Nach ([\d,]+) Stunden ist nur noch die Hälfte da/);
    if (!m) return null;
    const m0 = zahl(m[1]), Th = zahl(m[2]);
    const k = bisektion((kk) => E(-kk * Th) - 0.5, 1e-6, 10), rate = ableitung((t) => m0 * E(-k * t), Th, 1e-5);
    return { felder: [k, rate], toleranz: T,
      falschFelder: [[0, Th / Math.LN2, "Bruch umgedreht"], [0, Math.LN2 * Th, "nicht mit T multiplizieren"], [0, 1 / (2 * Th), "Halbieren"], [1, -k * m0, "die Rate zu Beginn"], [1, m0 / 2, "nicht ihre Änderungsrate"], [1, -rate, "negativ"]] };
  });
  await A(19, "A19 Tangente von einem Punkt der x-Achse", (q) => {
    const m = q.match(new RegExp(`f\\(x\\) = (−?[\\d,]*)e\\^\\((−?[\\d,]*)x\\)\\. Von (?:dem Ursprung O\\(0 \\| 0\\)|dem Punkt P\\(${ZAHL} \\| 0\\)) aus`));
    if (!m) return null;
    const a = faktor(m[1]), k = faktor(m[2]), p = m[3] ? zahl(m[3]) : 0, f = (x) => a * E(k * x);
    // Die Tangente in x₀ geht durch (p | 0): f(x₀) + f′(x₀) · (p − x₀) = 0.
    const st = vzw((x) => f(x) + ableitung(f, x, 1e-6) * (p - x), -30, 30);
    if (st.length !== 1) return null;
    const x0 = st[0];
    return { felder: [x0, ableitung(f, x0, 1e-6)], toleranz: T,
      falschFelder: [[0, p - 1 / k, "Vorzeichenfehler"], [0, Math.abs(k) === 1 ? NaN : p + k, "wird durch k"], [0, p === 0 ? NaN : 1 / k, "nicht durch den Ursprung"], [1, k === 1 ? NaN : f(x0), "Das ist f(x₀)"]] };
  });
  await A(20, "A20 Gedämpfte Schwingung", (q) => {
    const m = q.match(/s\(t\) = ([\d,]+) · e\^\(−([\d,]*)t\) · sin\(([\d,]*)t\)/);
    if (!m) return null;
    const A0 = zahl(m[1]), d = m[2] ? zahl(m[2]) : 1, w = m[3] ? zahl(m[3]) : 1, s = (t) => A0 * E(-d * t) * Math.sin(w * t);
    const t1 = vzw((t) => ableitung(s, t, 1e-6), 1e-4, Math.PI / w)[0];
    return { felder: [t1, s(t1)], toleranz: T, pruefe: () => pruefe(ableitung(s, t1 - 0.01) > 0 && ableitung(s, t1 + 0.01) < 0, "A20: Die erste Nullstelle von s′ ist kein Maximum"),
      falschFelder: [[0, Math.PI / (2 * w), "ohne Dämpfung"], [0, Math.atan(d / w) / w, "Bruch umgedreht"], [0, w === 1 ? NaN : Math.atan(w / d), "teile noch durch"], [1, A0 * Math.sin(w * t1), "Dämpfungsfaktor"]] };
  });
  await A(21, "A21 Schnittwinkel zweier e-Funktionen", (q) => {
    const m = q.match(/f\(x\) = ([\d,]*)e\^\(([\d,]*)x\) und g\(x\) = ([\d,]*)e\^\(−([\d,]*)x\)/);
    if (!m) return null;
    const a = faktor(m[1]), k = faktor(m[2]), b = faktor(m[3]), f = (x) => a * E(k * x), g = (x) => b * E(-k * x);
    const xs = bisektion((x) => f(x) - g(x), -50, 50);
    const w1 = Math.atan(ableitung(f, xs)) * GRAD, w2 = Math.atan(ableitung(g, xs)) * GRAD, roh = Math.abs(w1 - w2);
    return { felder: [xs, roh <= 90 ? roh : 180 - roh], toleranz: T,
      falschFelder: [[0, Math.log(b / a) / k, "fehlt der Faktor 2"], [0, -xs, "Bruch umgedreht"], [1, roh > 90 ? roh : NaN, "höchstens 90°"], [1, w1, "nur der Steigungswinkel"]] };
  });
  await A(22, "A22 Parameter aus der Extremstelle", (q) => {
    const m = q.match(new RegExp(`f\\(x\\) = (−?[\\d,]*)x · e\\^\\(kx\\) gegeben\\. Der Graph hat an der Stelle x = ${ZAHL} einen Extrempunkt`));
    if (!m) return null;
    const a = faktor(m[1]), xE = zahl(m[2]);
    const k = bisektion((kk) => ableitung((x) => a * x * E(kk * x), xE, 1e-6), -1 / xE - 0.5 * Math.abs(1 / xE), -1 / xE + 0.5 * Math.abs(1 / xE));
    const y = a * xE * E(k * xE);
    return { felder: [k, y], toleranz: T, pruefe: () => pruefe(nahe(ableitung((x) => a * x * E(k * x), xE, 1e-6), 0, 1e-6), "A22: Mit dem nachgerechneten k ist f′(x_E) nicht 0"),
      falschFelder: [[0, 1 / xE, "Vorzeichen"], [0, Math.abs(xE) === 1 ? NaN : -xE, "der Kehrwert fehlt"], [1, a * xE, "gehört dazu"], [1, a * xE * Math.E, "nicht e"]] };
  });
  await A(23, "A23 Abkühlung", (q) => {
    const m = q.match(/T\(t\) = ([\d,]+) \+ ([\d,]+) · e\^\(−([\d,]+)t\) ab .*? nur noch um ([\d,]+) °C pro Minute/);
    if (!m) return null;
    const U = zahl(m[1]), D = zahl(m[2]), k = zahl(m[3]), rr = zahl(m[4]), Tf = (t) => U + D * E(-k * t);
    const t = bisektion((s) => ableitung(Tf, s, 1e-5) + rr, 0, 500);
    return { felder: [t, Tf(t)], toleranz: T,
      falschFelder: [[0, Math.log(D / rr) / k, "fehlt beim Ableiten"], [1, Tf(t) - U, "Unterschied zur Raumtemperatur"], [1, U - (Tf(t) - U), "wird addiert"]] };
  });
  // Je Stufe eine Termaufgabe mit beliebig vielen Funktionen. Die Angabe wird mit einem eigenen
  // Termleser gelesen und numerisch abgeleitet (tests/lib/terme.js).
  for (const [nr, stufe] of [[6, "e-Funktionen"], [12, "Produkte mit e"], [18, "Kettenregel (LK)"], [24, "gemischte Funktionen (LK)"]]) {
    const name = `A${nr} Ableitungsfunktion: ${stufe}`;
    await pruefeAufgabe(page, bericht, { nr, name, runden: RT, mindestensVerschieden: SCHRANKE[nr] ?? 5,
      liesRoh: liesTermAufgabe, deute: termDeuter(bericht, name, "ableitung") });
  }
}

(async () => {
  const browser = await starteBrowser();
  for (const dunkel of [false, true]) {
    const wo = dunkel ? "dunkel" : "hell";
    const page = await neueSeite(browser, { dunkel });
    await oeffne(page, SEITE);
    if (!dunkel) {
      await geruest(page);
      await basis(page);
      await ekx(page);
      await logarithmus(page);
      await produktE(page);
      await sinus(page);
      await kette(page);
      await quotient(page);
      await lnFunktion(page);
      await verhalten(page);
      await symmetrie(page);
      await nullstellen(page);
      await monotonie(page);
      await wachstum(page);
      await stolperstelle(page);
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
