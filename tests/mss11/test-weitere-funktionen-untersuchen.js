// Fachliche Prüfung: MSS 11, Analysis, Thema 3.2 „Untersuchung weiterer Funktionen“ (Leistungskurs,
// die Abschnitte zu p(x) · e^(kx) auch Grundkurs).
//
// Geprüft wird, was die Seite zeigt, gegen eine unabhängige Rechnung. Ableitungen, Extrem- und
// Wendestellen bestimmt die Prüfung NICHT mit den Formeln der Seite, sondern numerisch: zentrale
// Differenzen für f′ und f″, Vorzeichenwechsel mit Bisektion für Nullstellen, Dreiteilung für
// Berührstellen und Maxima. Asymptoten und Randpunkte werden als Grenzwert weit draußen bzw. dicht am
// Rand nachgerechnet.
//
//   * Gerüst: Abschnittsfolge, Nummern und Kursmarken, kein Vorgriff der Grundkurs-Abschnitte auf
//     Leistungskurs-Stoff, Verweise und Sprungmarken, Menükarte, Formelsammlung, Verweise von 2.2 und
//     3.1 auf diese Seite;
//   * jede Zeichnung wird aus dem SVG zurückgelesen (Maßstab aus den Gitterlinien mit data-wert);
//   * die Bilanzen werden gegen die unabhängige Rechnung gelesen;
//   * Kontrollfragen, Selbsteinschätzung und alle vierundzwanzig Aufgaben — jede von beiden Seiten.

"use strict";

const { neuerBericht } = require("../lib/pruefen");
const { starteBrowser, neueSeite, oeffne, setzeRegler, text } = require("../lib/seite");
const { pruefeNotation } = require("../lib/notation");
const { pruefeKontrast } = require("../lib/kontrast");
const { pruefeAufgabe, zahl } = require("../lib/aufgaben");
const { liesTermAufgabe, termDeuter, pruefeTermleser } = require("../lib/terme");
const fs = require("fs");
const path = require("path");

const bericht = neuerBericht();
const { pruefe } = bericht;
const SEITE = "/mathematik/mss11/01-analysis/04b-weitere-funktionen-untersuchen/index.html";
const WURZEL = path.resolve(__dirname, "..", "..");
const nahe = (a, b, tol = 1e-6) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= tol;
const E = Math.exp, PI = Math.PI;

// ---------- Numerik: Ableitungen und besondere Stellen ohne Ableitungsregeln ----------
const abl = (f, x, h = 1e-5) => (f(x + h) - f(x - h)) / (2 * h);
const abl2 = (f, x, h = 1e-4) => (f(x + h) - 2 * f(x) + f(x - h)) / (h * h);
// Einfache Nullstellen einer Funktion g auf [lo, hi] (Vorzeichenwechsel, dann Bisektion). Die
// Rasterwerte werden einmal berechnet — so gehören beide Intervallenden zum selben Raster.
function vzw(g, lo, hi, n = 3000) {
  const xs = Array.from({ length: n + 1 }, (_, i) => lo + ((hi - lo) * i) / n), gs = xs.map(g), aus = [];
  const neu = (z) => { if (!aus.some((a) => Math.abs(a - z) < 1e-6)) aus.push(z); };
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
// Kritische Stellen von f: Nullstellen von f′ mit und ohne Vorzeichenwechsel, mit Typ H, T oder S.
function kritisch(f, lo, hi) {
  const d = (x) => abl(f, x), n = 2000, h = (hi - lo) / n, aus = [];
  const neu = (z) => { if (!aus.some((a) => Math.abs(a - z) < 1e-3)) aus.push(z); };
  for (let i = 0; i < n; i++) {
    let a = lo + i * h, b = a + h;
    if (Math.sign(d(a)) * Math.sign(d(b)) < 0) {
      for (let k = 0; k < 60; k++) { const m = (a + b) / 2; if (Math.sign(d(m)) === Math.sign(d(a))) a = m; else b = m; }
      neu((a + b) / 2);
    } else if (i > 0 && Math.abs(d(a)) <= Math.abs(d(a - h)) && Math.abs(d(a)) <= Math.abs(d(b))) {
      let l = a - h, r = b;
      for (let k = 0; k < 80; k++) { const m1 = l + (r - l) / 3, m2 = r - (r - l) / 3; if (Math.abs(d(m1)) < Math.abs(d(m2))) r = m2; else l = m1; }
      const z = (l + r) / 2;
      if (Math.abs(d(z)) < 1e-6) neu(z);
    }
  }
  return aus.sort((p, q) => p - q).map((z) => {
    const links = d(z - 0.01), rechts = d(z + 0.01);
    return { x: z, typ: links > 0 && rechts < 0 ? "H" : links < 0 && rechts > 0 ? "T" : "S" };
  });
}
// Wendestellen: Vorzeichenwechsel von f″; Typ S, wenn dort auch f′ = 0 ist.
function wendestellen(f, lo, hi, n = 2000) {
  return vzw((x) => abl2(f, x), lo, hi, n).map((x) => ({ x, typ: Math.abs(abl(f, x)) < 1e-5 ? "S" : "W" }));
}
// Größter Wert auf [a, b]: feines Raster, dann Dreiteilung um den besten Rasterpunkt.
function maxStelle(f, a, b) {
  const n = 4000;
  let best = a;
  for (let i = 0; i <= n; i++) { const x = a + ((b - a) * i) / n; if (f(x) > f(best)) best = x; }
  let l = Math.max(a, best - (b - a) / n), r = Math.min(b, best + (b - a) / n);
  for (let k = 0; k < 100; k++) { const m1 = l + (r - l) / 3, m2 = r - (r - l) / 3; if (f(m1) < f(m2)) l = m1; else r = m2; }
  return (l + r) / 2;
}
function nullstellenMitVielfachheit(f, lo, hi) {
  const z = vzw(f, lo, hi, 3000);
  for (const k of kritisch(f, lo, hi)) if (Math.abs(f(k.x)) < 1e-6 && !z.some((x) => Math.abs(x - k.x) < 1e-3)) z.push(k.x);
  return z.sort((a, b) => a - b).map((x) => ({ x, v: Math.abs(abl(f, x)) > 1e-4 ? 1 : Math.abs(abl2(f, x)) > 1e-3 ? 2 : 3 }));
}

async function waehle(page, id, wert) {
  await page.selectOption("#" + id, wert);
}
async function haken(page, id, an) {
  await page.setChecked("#" + id, an);
}

// Liest eine Zeichnung und rechnet alle Koordinaten über die Gitterlinien in (x | y) um — der
// Maßstab kommt aus zwei beschrifteten Linien, nicht aus dem Code der Seite. Dazu der sichtbare
// Bereich aus dem Rahmen der Zeichenfläche.
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
    const r = svg.querySelector("clipPath rect");
    return {
      proX: SX.pro, proY: SY.pro,
      bereich: { xmin: X(n(r, "x")), xmax: X(n(r, "x") + n(r, "width")), ymax: Y(n(r, "y")), ymin: Y(n(r, "y") + n(r, "height")) },
      pfade: [...svg.querySelectorAll("path[data-rolle]")].map((p) => ({ rolle: p.dataset.rolle, teil: p.dataset.teil, daten: { ...p.dataset }, klasse: p.getAttribute("class") || "", punkte: paare(p.getAttribute("d")).map(([a, b]) => [X(a), Y(b)]) })),
      kreise: [...svg.querySelectorAll("circle")].map((c) => ({ x: X(n(c, "cx")), y: Y(n(c, "cy")), klasse: c.getAttribute("class") || "", daten: { ...c.dataset } })),
      linien: [...svg.querySelectorAll("line[data-rolle]")].map((l) => ({ rolle: l.dataset.rolle, klasse: l.getAttribute("class") || "", daten: { ...l.dataset }, x1: X(n(l, "x1")), y1: Y(n(l, "y1")), x2: X(n(l, "x2")), y2: Y(n(l, "y2")) })),
      rechtecke: [...svg.querySelectorAll("rect[data-rolle]")].map((q) => ({ rolle: q.dataset.rolle, x1: X(n(q, "x")), x2: X(n(q, "x") + n(q, "width")), y1: Y(n(q, "y") + n(q, "height")), y2: Y(n(q, "y")) })),
    };
  }, sel);
}
const linie = (d, rolle) => d.linien.find((l) => l.rolle === rolle);
const linienMit = (d, rolle) => d.linien.filter((l) => l.rolle === rolle);
const kreise = (d, rolle) => d.kreise.filter((k) => k.daten.rolle === rolle);
const kreis = (d, rolle) => kreise(d, rolle)[0];
const steigung = (l) => (l.y2 - l.y1) / (l.x2 - l.x1);
const aufGerade = (l, x) => l.y1 + steigung(l) * (x - l.x1);
// Alle Punkte der Pfade mit dieser Rolle müssen auf f liegen (Toleranz: 1,5 Bildpunkte).
function pfadAuf(d, rolle, f, wo) {
  const p = d.pfade.filter((q) => q.rolle === rolle);
  pruefe(p.length > 0, `${wo}: kein Pfad „${rolle}“`);
  let schlecht = 0, beispiel = "";
  for (const q of p) for (const [x, y] of q.punkte) if (!nahe(y, f(x), 1.5 / d.proY + 1e-6)) { schlecht++; beispiel = `(${x.toFixed(3)} | ${y.toFixed(3)}) statt ${f(x).toFixed(3)}`; }
  pruefe(schlecht === 0, `${wo}: ${schlecht} Punkte von „${rolle}“ liegen nicht auf dem Graphen, z. B. ${beispiel}`);
}
// Krümmungsfärbung: Teil „links“ nur, wo f″ > 0, „rechts“ nur, wo f″ < 0 — abseits der Nullstellen von f″.
function faerbung(d, f, wo, schwelle = 0.02) {
  let schlecht = 0, beispiel = "";
  for (const q of d.pfade.filter((p) => p.rolle === "graph" && (p.teil === "links" || p.teil === "rechts"))) {
    // Der erste Punkt eines Teils ist der Anschluss an den vorigen Teil (graph() beginnt dort, damit
    // keine Lücke entsteht) — er liegt auf der anderen Seite der Wendestelle und zählt nicht.
    for (const [x] of q.punkte.slice(1)) {
      const w = abl2(f, x);
      if (!Number.isFinite(w) || Math.abs(w) < schwelle) continue;
      if ((w > 0) !== (q.teil === "links")) { schlecht++; beispiel = `x = ${x.toFixed(3)}: ${q.teil}, f″ = ${w.toFixed(4)}`; }
    }
  }
  pruefe(schlecht === 0, `${wo}: Krümmungsfärbung falsch an ${schlecht} Stellen, z. B. ${beispiel}`);
}
// Gefundene Punkte (x, Typ) gegen die gezeichneten Kreise.
function punkteGleich(gezeichnet, soll, wo, f, tolY = 0.02) {
  const g = gezeichnet.map((k) => ({ x: k.x, y: k.y, typ: k.daten.typ })).sort((a, b) => a.x - b.x);
  const s = [...soll].sort((a, b) => a.x - b.x);
  pruefe(g.length === s.length, `${wo}: ${g.length} Punkte gezeichnet statt ${s.length} (${s.map((p) => p.typ + p.x.toFixed(3)).join(", ")})`);
  if (g.length !== s.length) return;
  g.forEach((p, i) => {
    pruefe(nahe(p.x, s[i].x, 0.01) && nahe(p.y, f(s[i].x), tolY), `${wo}: Punkt ${i + 1} bei (${p.x.toFixed(3)} | ${p.y.toFixed(3)}) statt (${s[i].x.toFixed(3)} | ${f(s[i].x).toFixed(3)})`);
    if (s[i].typ) pruefe(p.typ === s[i].typ, `${wo}: Punkt bei ${s[i].x.toFixed(3)} ist als ${p.typ} markiert statt ${s[i].typ}`);
  });
}
// Alle Zahlen eines Textes nach einem Stichwort, z. B. „f′(x₀) ≈ −0,0015“.
function wertNach(textInhalt, stichwort) {
  const i = textInhalt.indexOf(stichwort);
  if (i < 0) return NaN;
  const m = textInhalt.slice(i + stichwort.length).match(/^\s*[=≈]\s*(−?[\d.]*\d(?:,\d+)?)/);
  return m ? zahl(m[1]) : NaN;
}

// ---------- Gerüst ----------
const ABSCHNITTE = ["sec-vergleich", "sec-zweite", "sec-schema", "sec-scharen", "sec-wachstum", "sec-optimierung", "sec-trig",
  "sec-schwingung", "sec-ln", "sec-glocke", "sec-stolperstelle"];
// Nach dem rheinland-pfälzischen Lehrplan nur Leistungsfach: sin/cos, Kettenregel, Quotientenregel, ln.
const NUR_LK = new Set(["sec-trig", "sec-schwingung", "sec-ln", "sec-glocke"]);
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
  pruefe(await page.evaluate(() => !!document.querySelector("main section:first-child .kurs-hinweis .kurs-marke.lk")), "Gerüst: Der Einstieg kennzeichnet die Seite nicht als Leistungskurs");
  pruefe(/Elemente der Mathematik/.test(await text(page, "main")) && /Fundamente der Mathematik/.test(await text(page, "main")), "Gerüst: Die beiden Lehrwerke werden nicht genannt");
  pruefe(fs.existsSync(path.join(WURZEL, path.dirname(SEITE), "formelsammlung.pdf")), "Formelsammlung: formelsammlung.pdf fehlt");
  // Kein Vorgriff: Grundkurs-Abschnitte verweisen auf Leistungskurs-Abschnitte nur als Ausblick — in
  // einem Satz oder einer Tabellenzeile, die den Leistungskurs nennt.
  const vorgriffe = await page.evaluate((lk) => {
    const aus = [];
    for (const s of document.querySelectorAll("main section[id]")) {
      if (lk.includes(s.id) || !s.querySelector("h2 .kurs-marke")) continue;
      for (const a of s.querySelectorAll('a[href^="#sec-"]')) {
        if (!lk.includes(a.getAttribute("href").slice(1))) continue;
        const block = a.closest("tr, p, li, div");
        if (a.closest(".hinweis-box") || /Leistungskurs|\(LK\)/.test(block ? block.textContent : "")) continue;
        aus.push(`${s.id} → ${a.getAttribute("href")}`);
      }
    }
    return aus;
  }, [...NUR_LK]);
  pruefe(vorgriffe.length === 0, `Gerüst: Grundkurs-Abschnitte stützen sich auf Leistungskurs-Stoff: ${vorgriffe.join("; ")}`);
  // Ein Rechenweg in einem Grundkurs-Abschnitt, der Ketten- oder Quotientenregel, sin, cos oder ln
  // braucht, ist als Leistungskurs-Kasten markiert.
  const lkWege = await page.evaluate((lk) => [...document.querySelectorAll("main section[id] .rechenweg-box")]
    .filter((b) => !lk.includes(b.closest("section").id) && b.closest("section").id !== "sec-vergleich" && !b.classList.contains("lk"))
    .filter((b) => /Kettenregel|Quotientenregel|\bcos\b|\bsin\b|\bln\(/.test(b.textContent))
    .map((b) => b.closest("section").id), [...NUR_LK]);
  pruefe(lkWege.length === 0, `Gerüst: Rechenweg mit Leistungskurs-Stoff ohne LK-Markierung in ${lkWege.join(", ")}`);
  // Leistungskurs-Funktionen in einem Grundkurs-Abschnitt stehen in der Auswahl mit „(LK)“, ebenso die
  // Zeichnungen des Vergleichs.
  const ohneMarke = await page.evaluate((lk) => [...document.querySelectorAll("main section[id] select option")]
    .filter((o) => !lk.includes(o.closest("section").id) && /sin|cos|tan|ln\(|\/ \(1 \+/.test(o.textContent) && !/\(LK\)/.test(o.textContent))
    .map((o) => o.textContent), [...NUR_LK]);
  pruefe(ohneMarke.length === 0, `Gerüst: Auswahl in Grundkurs-Abschnitten ohne „(LK)“: ${ohneMarke.join("; ")}`);
  // Jeder Erarbeitungsabschnitt stellt sich ausdrücklich neben die ganzrationalen Funktionen.
  const ohneVergleich = await page.evaluate((ids) => ids.filter((id) => !document.querySelector(`#${id} .unterschied-box, #${id} .wissen-box`)), ABSCHNITTE);
  pruefe(ohneVergleich.length === 0, `Gerüst: Abschnitte ohne Vergleich mit ganzrationalen Funktionen: ${ohneVergleich.join(", ")}`);
  const unterschiede = await page.evaluate(() => document.querySelectorAll("main .unterschied-box").length);
  pruefe(unterschiede >= 10, `Gerüst: nur ${unterschiede} Kästen „Anders als bei ganzrationalen Funktionen“`);

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
  pruefe(/data-section="mss11" href="04b-weitere-funktionen-untersuchen\/index.html" hidden/.test(menue), "Menü: Karte für Thema 3.2 fehlt oder ist nicht mit data-section/hidden versehen");
  pruefe(/<h2>3\.2 Untersuchung weiterer Funktionen <span class="kurs-marke lk">/.test(menue), "Menü: Die Karte heißt nicht „3.2 Untersuchung weiterer Funktionen“ mit der Marke LK");
  for (const t of ["03b-weitere-funktionen-ableiten", "04-funktionsuntersuchung"]) {
    const h = fs.readFileSync(path.join(WURZEL, `mathematik/mss11/01-analysis/${t}/index.html`), "utf-8");
    pruefe(h.includes("../04b-weitere-funktionen-untersuchen/index.html"), `Vernetzung: ${t} verweist nicht auf Thema 3.2`);
  }
}

// ---------- 1. Vergleich ----------
const VG = {
  poly: { f: (x) => 0.5 * x ** 3 - 1.5 * x, lo: -1e9 },
  exp: { f: (x) => x * E(-x), lo: -1e9 },
  ln: { f: (x) => (x > 0 ? x * Math.log(x) : NaN), lo: 0 },
  sin: { f: (x) => 2 * Math.sin(x), lo: -1e9 },
};
async function vergleich(page) {
  for (let s = 1; s <= 7; s++) {
    await setzeRegler(page, "vg-s", s);
    for (const [art, def] of Object.entries(VG)) {
      const wo = `Vergleich ${art}, Schritt ${s}`;
      const D = await lies(page, `#vg-mount svg[data-panel="${art}"]`);
      pruefe(!!D, `${wo}: Zeichnung fehlt`);
      if (!D) continue;
      const f = def.f, lo = Math.max(D.bereich.xmin, def.lo + 1e-3), hi = D.bereich.xmax;
      if (s >= 7) pfadAuf(D, "graph", f, wo); else pruefe(!D.pfade.some((p) => p.rolle === "graph"), `${wo}: Graph zu früh`);
      const aus = D.rechtecke.filter((r) => r.rolle === "ausserhalb-d");
      pruefe(art === "ln" ? aus.length === 1 && nahe(aus[0].x2, 0, 0.01) : aus.length === 0, `${wo}: Bereich außerhalb der Definitionsmenge falsch markiert`);
      // Punktsymmetrie zum Ursprung genau dann, wenn f(−x) = −f(x).
      const ungerade = art !== "ln" && [0.4, 1.3, 2.2].every((x) => nahe(f(-x), -f(x), 1e-9));
      pruefe(s >= 2 ? !!kreis(D, "symmetrie") === ungerade : !kreis(D, "symmetrie"), `${wo}: Symmetriezentrum falsch`);
      const ns = kreise(D, "nullstelle");
      if (s >= 3) {
        const soll = vzw(f, lo, hi, 4000);
        pruefe(ns.length === soll.length && ns.sort((a, b) => a.x - b.x).every((k, i) => nahe(k.x, soll.sort((a, b) => a - b)[i], 0.01) && nahe(k.y, 0, 0.01)), `${wo}: Nullstellen ${ns.map((k) => k.x.toFixed(3))} statt ${soll.map((x) => x.toFixed(3))}`);
      } else pruefe(ns.length === 0, `${wo}: Nullstellen zu früh`);
      const pfeile = D.pfade.filter((p) => p.rolle === "pfeil"), asym = linienMit(D, "asymptote"), rand = kreise(D, "randpunkt"), schranken = linienMit(D, "schranke");
      if (s >= 4) {
        for (const p of pfeile) {
          const x = p.daten.seite === "links" ? -1e4 : 1e4;
          pruefe(p.daten.richtung === (f(x) > 1e3 ? "oben" : f(x) < -1e3 ? "unten" : "?"), `${wo}: Pfeil ${p.daten.seite} zeigt nach ${p.daten.richtung}, f(${x}) = ${f(x)}`);
        }
        for (const a of asym) {
          const x = a.daten.seite === "rechts" ? 80 : -80;
          pruefe(nahe(f(x), Number(a.daten.y), 1e-6) && nahe(a.y1, Number(a.daten.y), 0.01), `${wo}: Asymptote y = ${a.daten.y}, aber f(${x}) = ${f(x)}`);
        }
        for (const r of rand) pruefe(nahe(r.x, 0, 0.01) && nahe(f(1e-9), r.y, 1e-6) && !Number.isFinite(f(0)), `${wo}: Randpunkt (${r.x} | ${r.y}) passt nicht zum Grenzwert für x → 0⁺`);
        if (schranken.length) {
          const w = Array.from({ length: 2001 }, (_, i) => f(-20 + i * 0.02));
          pruefe(schranken.length === 2 && nahe(Math.max(...w), Math.max(...schranken.map((l) => l.y1)), 0.01) && nahe(Math.min(...w), Math.min(...schranken.map((l) => l.y1)), 0.01), `${wo}: Schranken passen nicht zu Minimum und Maximum`);
        }
        // Jede Seite des Bildes ist erklärt: durch einen Pfeil, eine Asymptote, einen Randpunkt oder Schranken.
        const links = pfeile.some((p) => p.daten.seite === "links") || asym.some((a) => a.daten.seite === "links") || rand.length > 0 || schranken.length > 0;
        const rechts = pfeile.some((p) => p.daten.seite === "rechts") || asym.some((a) => a.daten.seite === "rechts") || schranken.length > 0;
        pruefe(links && rechts, `${wo}: Das Verhalten am ${links ? "rechten" : "linken"} Rand ist nicht eingezeichnet`);
      } else pruefe(pfeile.length + asym.length + rand.length + schranken.length === 0, `${wo}: Randverhalten zu früh`);
      const ex = kreise(D, "extrem"), we = kreise(D, "wende");
      if (s >= 5) punkteGleich(ex, kritisch(f, lo, hi).filter((p) => p.typ !== "S"), wo + ", Extrempunkte", f); else pruefe(ex.length === 0, `${wo}: Extrempunkte zu früh`);
      if (s >= 6) punkteGleich(we, wendestellen(f, lo, hi, 4000), wo + ", Wendepunkte", f); else pruefe(we.length === 0, `${wo}: Wendepunkte zu früh`);
    }
    const zeilen = await page.evaluate(() => [...document.querySelectorAll("#vg-bilanz tr[data-schritt]")].map((t) => t.className));
    pruefe(zeilen.length === s && zeilen[s - 1] === "aktiv", `Vergleich Schritt ${s}: ${zeilen.length} Tabellenzeilen`);
  }
}

// ---------- 2. Zweite Ableitung von p(x) · e^(kx) ----------
const ZW = {
  a: { f: (x) => x * E(-x), k: -1, xs: [-1, 0, 0.5, 1, 2, 3.25, 5] },
  b: { f: (x) => x * x * E(-x), k: -1, xs: [-1, 0, 0.5, 1.5, 3, 4, 6] },
  c: { f: (x) => (1 - x) * E(x), k: 1, xs: [-4, -2, -1, -0.5, 0, 1.5] },
};
async function zweite(page) {
  for (const [art, def] of Object.entries(ZW)) {
    await waehle(page, "zw-art", art);
    for (const x of def.xs) {
      const x0 = await setzeRegler(page, "zw-x", x);
      const wo = `Zweite Ableitung ${art}, x₀ = ${x0}`;
      pruefe(x0 === x, `${wo}: Regler steht auf ${x0} statt ${x}`);
      const f = def.f, f2 = (t) => abl2(f, t), q = (t) => abl2(f, t) / E(def.k * t);
      const D1 = await lies(page, '#zw-mount svg[data-panel="f"]');
      const D2 = await lies(page, '#zw-mount svg[data-panel="a2"]');
      pfadAuf(D1, "graph", f, wo);
      faerbung(D1, f, wo);
      const t = linie(D1, "tangente");
      pruefe(t && nahe(steigung(t), abl(f, x0), 1e-3) && nahe(aufGerade(t, x0), f(x0), 0.01), `${wo}: Tangente falsch`);
      // An einer Wendestelle gibt es keine Lenkrichtung — dort darf kein Pfeil stehen.
      const pfeil = D1.pfade.find((p) => p.rolle === "lenkpfeil"), w0 = f2(x0);
      if (Math.abs(w0) < 1e-6) pruefe(!pfeil, `${wo}: Lenkpfeil an der Wendestelle`);
      else pruefe(pfeil && pfeil.daten.art === (w0 > 0 ? "links" : "rechts"), `${wo}: Lenkpfeil ${pfeil && pfeil.daten.art} bei f″(x₀) = ${w0.toFixed(4)}`);
      pfadAuf(D2, "ableitung2", f2, `${wo}, f″`);
      // Die graue Kurve ist f″ geteilt durch den e-Faktor — dieselben Nullstellen, dasselbe Vorzeichen.
      pfadAuf(D2, "faktor", q, `${wo}, Klammer von f″`);
      const n2 = kreise(D2, "nullstelle-f2").map((k) => k.x).sort((a, b) => a - b), soll = vzw(f2, D2.bereich.xmin, D2.bereich.xmax);
      pruefe(n2.length === soll.length && n2.every((z, i) => nahe(z, soll[i], 0.01)), `${wo}: Nullstellen von f″ ${n2.map((z) => z.toFixed(3))} statt ${soll.map((z) => z.toFixed(3))}`);
      const pa = kreis(D2, "p-a2"), pq = kreis(D2, "p-q");
      pruefe(pa && nahe(pa.x, x0, 0.01) && nahe(pa.y, f2(x0), 0.02), `${wo}: Punkt auf f″ falsch`);
      pruefe(pq && nahe(pq.x, x0, 0.01) && nahe(pq.y, q(x0), 0.02), `${wo}: Punkt auf der Klammer falsch`);
      const b = await text(page, "#zw-bilanz");
      const mq = b.match(/x₀ = −?[\d,]+: Klammer .+? = (−?[\d,]+)/), mf = b.match(/f″\(x₀\) [=≈] (−?[\d,]+)/);
      pruefe(mq && nahe(zahl(mq[1]), q(x0), 1e-4), `${wo}: Bilanz Klammer falsch — „${b}“`);
      pruefe(mf && nahe(zahl(mf[1]), f2(x0), 1e-4), `${wo}: Bilanz f″(x₀) falsch — „${b}“`);
      pruefe(b.includes(Math.abs(w0) < 1e-6 ? "f″(x₀) = 0" : w0 > 0 ? "Linkskurve" : "Rechtskurve"), `${wo}: Bilanz nennt die Krümmung falsch — „${b}“`);
    }
  }
}

// ---------- 3. Vollständige Untersuchung ----------
const SC = { a: (x) => x * E(-x), b: (x) => x * x * E(-x), c: (x) => (1 - x) * E(x) };
async function schema(page) {
  for (const [art, f] of Object.entries(SC)) {
    await waehle(page, "sc-art", art);
    for (let s = 1; s <= 8; s++) {
      await setzeRegler(page, "sc-s", s);
      const wo = `Funktionsuntersuchung ${art}, Schritt ${s}`;
      const D = await lies(page, "#sc-mount svg");
      const lo = D.bereich.xmin, hi = D.bereich.xmax;
      const li = await page.evaluate(() => [...document.querySelectorAll("#sc-liste li")].map((l) => l.className));
      pruefe(li.length === 8 && li.filter((c) => c === "offen").length === 8 - s, `${wo}: Schrittliste ${li.join(",")}`);
      const pfeile = D.pfade.filter((p) => p.rolle === "pfeil"), asym = linienMit(D, "asymptote");
      if (s >= 2) {
        pruefe(pfeile.length === 1 && asym.length === 1 && pfeile[0].daten.seite !== asym[0].daten.seite, `${wo}: ${pfeile.length} Pfeile, ${asym.length} Asymptoten`);
        for (const p of pfeile) {
          const x = p.daten.seite === "links" ? -60 : 60;
          pruefe(p.daten.richtung === (f(x) > 0 ? "oben" : "unten") && Math.abs(f(x)) > 1e6, `${wo}: Pfeil ${p.daten.seite} zeigt nach ${p.daten.richtung}`);
        }
        for (const a of asym) {
          const x = a.daten.seite === "rechts" ? 80 : -80;
          pruefe(nahe(f(x), Number(a.daten.y), 1e-9) && nahe(a.y1, 0, 0.01), `${wo}: Asymptote ${a.daten.seite} — f(${x}) = ${f(x)}`);
        }
      } else pruefe(pfeile.length + asym.length === 0, `${wo}: Randverhalten schon in Schritt 1`);
      const sy = kreis(D, "sy");
      pruefe(s >= 3 ? sy && nahe(sy.x, 0, 0.01) && nahe(sy.y, f(0), 0.01) : !sy, `${wo}: Schnittpunkt mit der y-Achse`);
      const ns = kreise(D, "nullstelle");
      if (s >= 4) {
        const soll = nullstellenMitVielfachheit(f, lo, hi);
        pruefe(ns.length === soll.length, `${wo}: ${ns.length} Nullstellen statt ${soll.length}`);
        ns.sort((a, b) => a.x - b.x).forEach((k, i) => soll[i] && pruefe(nahe(k.x, soll[i].x, 0.01) && Number(k.daten.vielfach) === soll[i].v, `${wo}: Nullstelle ${k.x.toFixed(3)} (${k.daten.vielfach}-fach) statt ${soll[i].x.toFixed(3)} (${soll[i].v}-fach)`));
      } else pruefe(ns.length === 0, `${wo}: Nullstellen zu früh`);
      const ex = kreise(D, "extrem"), we = kreise(D, "wende");
      if (s >= 5) punkteGleich(ex, kritisch(f, lo, hi).filter((p) => p.typ !== "S"), wo + ", Extrempunkte", f, 0.01); else pruefe(ex.length === 0, `${wo}: Extrempunkte zu früh`);
      if (s >= 6) punkteGleich(we, wendestellen(f, lo, hi), wo + ", Wendepunkte", f, 0.01); else pruefe(we.length === 0, `${wo}: Wendepunkte zu früh`);
      const baender = D.linien.filter((l) => l.rolle === "band-mono" || l.rolle === "band-kruemm");
      if (s >= 7) {
        pruefe(baender.length > 0, `${wo}: keine Bänder`);
        for (const l of baender) {
          const mitte = (l.x1 + l.x2) / 2;
          const ok = l.rolle === "band-mono" ? l.daten.art === (abl(f, mitte) > 0 ? "steigt" : "faellt") : l.daten.art === (abl2(f, mitte) > 0 ? "links" : "rechts");
          pruefe(ok, `${wo}: Band ${l.rolle} „${l.daten.art}“ bei x = ${mitte.toFixed(2)} falsch`);
        }
        for (const r of ["band-mono", "band-kruemm"]) {
          const b = D.linien.filter((l) => l.rolle === r).sort((p, q) => p.x1 - q.x1);
          pruefe(nahe(b[0].x1, lo, 0.01) && nahe(b[b.length - 1].x2, hi, 0.01) && b.every((l, i) => i === 0 || nahe(l.x1, b[i - 1].x2, 1e-3)), `${wo}: Band ${r} lückenhaft`);
        }
      } else pruefe(baender.length === 0, `${wo}: Bänder zu früh`);
      if (s === 8) pfadAuf(D, "graph", f, wo); else pruefe(!D.pfade.some((p) => p.rolle === "graph"), `${wo}: Graph zu früh gezeichnet`);
    }
  }
}

// ---------- 4. Funktionenscharen ----------
async function scharen(page) {
  for (const ort of [false, true]) {
    await haken(page, "sa-ort", ort);
    for (const k0 of [0.25, 0.5, 0.75, 1, 1.5, 2]) {
      const k = await setzeRegler(page, "sa-k", k0);
      const wo = `Schar k = ${k}${ort ? ", mit Ortskurven" : ""}`;
      const f = (x) => x * E(-k * x);
      const D = await lies(page, "#sa-mount svg");
      pfadAuf(D, "graph", f, wo);
      faerbung(D, f, wo);
      const H = kritisch(f, 0.01, 30).filter((p) => p.typ !== "S"), W = wendestellen(f, 0.01, 30);
      punkteGleich(kreise(D, "extrem"), H, wo + ", Hochpunkt", f, 0.01);
      punkteGleich(kreise(D, "wende"), W, wo + ", Wendepunkt", f, 0.01);
      const oh = linie(D, "ortskurve-h"), ow = linie(D, "ortskurve-w");
      if (ort) {
        // Die Ortskurven müssen durch die Punkte JEDES Scharmitglieds gehen — geprüft an drei weiteren k.
        for (const kk of [0.25, 1.25, 2]) {
          const g = (x) => x * E(-kk * x), h = kritisch(g, 0.01, 30)[0].x, w = wendestellen(g, 0.01, 30)[0].x;
          pruefe(oh && nahe(aufGerade(oh, h), g(h), 0.005), `${wo}: Ortskurve der Hochpunkte verfehlt H für k = ${kk}`);
          pruefe(ow && nahe(aufGerade(ow, w), g(w), 0.005), `${wo}: Ortskurve der Wendepunkte verfehlt W für k = ${kk}`);
        }
      } else pruefe(!oh && !ow, `${wo}: Ortskurven ohne Haken gezeichnet`);
      const b = await text(page, "#sa-bilanz");
      const m = b.match(/= H\((−?[\d,]+) \| (−?[\d,]+)\).*?= W\((−?[\d,]+) \| (−?[\d,]+)\)/);
      pruefe(m && nahe(zahl(m[1]), H[0].x, 1e-4) && nahe(zahl(m[2]), f(H[0].x), 1e-4) && nahe(zahl(m[3]), W[0].x, 1e-4) && nahe(zahl(m[4]), f(W[0].x), 1e-4), `${wo}: Bilanz der Punkte falsch — „${b}“`);
    }
  }
}

// ---------- 5. Wachstumsmodelle ----------
const WA = {
  exp: (t) => 5 * E(0.15 * t),
  beschr: (t) => 100 - 90 * E(-0.2 * t),
  log: (t) => 100 / (1 + 9 * E(-0.4 * t)),
};
async function wachstum(page) {
  for (const [art, f] of Object.entries(WA)) {
    await waehle(page, "wa-art", art);
    for (const t0 of [0, 2.5, 5.5, 8, 14, 20]) {
      const t = await setzeRegler(page, "wa-t", t0);
      const wo = `Wachstum ${art}, t₀ = ${t}`;
      const D1 = await lies(page, '#wa-mount svg[data-panel="f"]');
      const D2 = await lies(page, '#wa-mount svg[data-panel="a"]');
      pfadAuf(D1, "graph", f, wo);
      faerbung(D1, f, wo, 0.005);
      const tg = linie(D1, "tangente");
      pruefe(tg && nahe(steigung(tg), abl(f, t), 1e-3) && nahe(aufGerade(tg, t), f(t), 0.05), `${wo}: Tangente falsch`);
      pfadAuf(D2, "ableitung", (x) => abl(f, x), `${wo}, f′`);
      // Sättigungsgrenze = Grenzwert für t → ∞; beim exponentiellen Wachstum gibt es keine.
      const S = linie(D1, "schranke"), grenz = f(400);
      pruefe(art === "exp" ? !S : S && nahe(Number(S.daten.y), grenz, 1e-6) && nahe(S.y1, grenz, 0.1), `${wo}: Sättigungsgrenze falsch`);
      // Größte Rate auf [0; 20]: numerisch gesucht, am Rand oder innen.
      const tm = maxStelle((x) => abl(f, x), 0, 20), rm = kreis(D2, "rate-max");
      if (art === "exp") pruefe(!rm, `${wo}: größte Rate markiert, obwohl die Rate immer wächst`);
      else pruefe(rm && nahe(rm.x, tm, 0.01) && nahe(rm.y, abl(f, tm), 0.05) && rm.daten.art === (tm < 1e-3 ? "rand" : "innen"), `${wo}: größte Rate bei ${tm.toFixed(3)} falsch markiert`);
      punkteGleich(kreise(D1, "wende"), wendestellen(f, 0.01, 20), wo + ", Wendepunkt", f, 0.1);
      const b = await text(page, "#wa-bilanz");
      pruefe(nahe(wertNach(b, "f(t₀)"), f(t), 1e-4) && nahe(wertNach(b, "f′(t₀)"), abl(f, t), 1e-4) && nahe(wertNach(b, "f″(t₀)"), abl2(f, t), 1e-4), `${wo}: Bilanz falsch — „${b}“`);
    }
  }
}

// ---------- 6. Extremwertprobleme ----------
const OP = {
  exp: { f: (x) => 2 * E(-0.5 * x), A: (u) => u * 2 * E(-0.5 * u), sym: false, us: [0.25, 1, 2, 3.5, 6], bis: 30 },
  cos: { f: Math.cos, A: (u) => 2 * u * Math.cos(u), sym: true, us: [0.05, 0.5, 0.85, 1.2, 1.5], bis: PI / 2 },
};
async function optimierung(page) {
  for (const [art, def] of Object.entries(OP)) {
    await waehle(page, "op-art", art);
    const uOpt = maxStelle(def.A, 1e-6, def.bis);
    for (const u0 of def.us) {
      const u = await setzeRegler(page, "op-u", u0);
      const wo = `Extremwertproblem ${art}, u = ${u}`;
      pruefe(nahe(u, u0, 1e-9), `${wo}: Regler steht auf ${u} statt ${u0}`);
      const D1 = await lies(page, '#op-mount svg[data-panel="f"]');
      const D2 = await lies(page, '#op-mount svg[data-panel="a"]');
      pfadAuf(D1, "graph", def.f, wo);
      const r = D1.rechtecke.find((q) => q.rolle === "rechteck");
      pruefe(r && nahe(r.x1, def.sym ? -u : 0, 0.01) && nahe(r.x2, u, 0.01) && nahe(r.y1, 0, 0.01) && nahe(r.y2, def.f(u), 0.01), `${wo}: Rechteck passt nicht unter den Graphen`);
      // Der Flächeninhalt des GEZEICHNETEN Rechtecks muss der Wert der Zielfunktion sein.
      const flaeche = r ? (r.x2 - r.x1) * (r.y2 - r.y1) : NaN, pa = kreis(D2, "p-a");
      pruefe(pa && nahe(pa.x, u, 0.01) && nahe(pa.y, flaeche, 0.02), `${wo}: Punkt auf A(u) bei ${pa && pa.y.toFixed(4)}, gezeichnete Fläche ${flaeche.toFixed(4)}`);
      pfadAuf(D2, "zielfunktion", (x) => (def.sym ? 2 * x : x) * def.f(x), `${wo}, Zielfunktion`);
      const mx = kreis(D2, "maximum");
      pruefe(mx && nahe(mx.x, uOpt, 0.005) && nahe(mx.y, def.A(uOpt), 0.01), `${wo}: Maximum bei ${uOpt.toFixed(4)} falsch markiert`);
      const b = await text(page, "#op-bilanz");
      const ma = b.match(/u = [\d,]+: A\(u\) [=≈] (−?[\d,]+), A′\(u\) [=≈] (−?[\d,]+)/);
      pruefe(ma && nahe(zahl(ma[1]), (def.sym ? 2 * u : u) * def.f(u), 1e-4), `${wo}: Bilanz A(u) falsch — „${b}“`);
      pruefe(ma && nahe(zahl(ma[2]), abl((x) => (def.sym ? 2 * x : x) * def.f(x), u), 1e-4), `${wo}: Bilanz A′(u) falsch — „${b}“`);
      if (art === "cos") {
        // Newton für g = A′/2 — die Ableitungen rechnet die Prüfung selbst.
        const g = (x) => abl(def.A, x) / 2, dg = (x) => abl2(def.A, x) / 2;
        const u1 = 1 - g(1) / dg(1), u2 = u1 - g(u1) / dg(u1);
        pruefe(nahe(wertNach(b, "u₁"), u1, 1e-4) && nahe(wertNach(b, "u₂"), u2, 1e-4), `${wo}: Newton-Schritte falsch — „${b}“`);
        pruefe(nahe(wertNach(b, "Maximum bei u"), uOpt, 1e-4) && nahe(wertNach(b, "mit A"), def.A(uOpt), 1e-4), `${wo}: Maximum in der Bilanz falsch — „${b}“`);
      } else pruefe(nahe(wertNach(b, "4e−1"), def.A(uOpt), 1e-4) && nahe(uOpt, 2, 1e-4), `${wo}: Maximum in der Bilanz falsch — „${b}“`);
    }
  }
}

// ---------- 7. Sinus und Kosinus ----------
async function trig(page) {
  const f = (x) => x + 2 * Math.sin(x);
  for (const [fenster, a, b, ks] of [["eins", 0, 2 * PI, [0, 3, 8, 12, 16, 24]], ["drei", -2 * PI, 4 * PI, [-24, -20, 0, 8, 30, 48]]]) {
    await waehle(page, "tr-fenster", fenster);
    const ex = kritisch(f, a + 0.01, b - 0.01).filter((p) => p.typ !== "S"), ws = wendestellen(f, a + 0.1, b - 0.1);
    for (const k of ks) {
      const kk = await setzeRegler(page, "tr-k", k);
      const x0 = (kk * PI) / 12, wo = `Sinus ${fenster}, x₀ = ${kk}π/12`;
      pruefe(kk === k, `${wo}: Regler steht auf ${kk} statt ${k}`);
      const D1 = await lies(page, '#tr-mount svg[data-panel="f"]');
      const D2 = await lies(page, '#tr-mount svg[data-panel="a"]');
      pfadAuf(D1, "graph", f, wo);
      faerbung(D1, f, wo);
      pfadAuf(D2, "ableitung", (t) => abl(f, t), `${wo}, f′`);
      punkteGleich(kreise(D1, "extrem"), ex, wo, f);
      punkteGleich(kreise(D1, "wende"), ws, wo, f);
      const nf = kreise(D2, "nullstelle-ableitung").map((p) => p.x).sort((p, q) => p - q), soll = vzw((t) => abl(f, t), a + 0.01, b - 0.01);
      pruefe(nf.length === soll.length && nf.every((z, i) => nahe(z, soll[i], 0.01)), `${wo}: Nullstellen von f′ falsch`);
      // Leitgeraden: Jeder Punkt eines Typs liegt auf der Geraden seines Typs.
      const lg = linienMit(D1, "leitgerade");
      if (fenster === "drei") {
        pruefe(lg.length === 3, `${wo}: ${lg.length} Leitgeraden`);
        for (const l of lg) {
          const pk = l.daten.art === "W" ? ws : ex.filter((p) => p.typ === l.daten.art);
          pruefe(pk.length > 0 && pk.every((p) => nahe(aufGerade(l, p.x), f(p.x), 0.01)), `${wo}: Leitgerade ${l.daten.art} verfehlt ihre Punkte`);
        }
      } else pruefe(lg.length === 0, `${wo}: Leitgeraden in einer Periode`);
      const t = linie(D1, "tangente");
      pruefe(t && nahe(steigung(t), abl(f, x0), 1e-3), `${wo}: Tangente falsch`);
      const bil = await text(page, "#tr-bilanz");
      const m = bil.match(/f′\(x₀\) = 1 \+ 2 cos\(x₀\) [=≈] (−?[\d,]+)/);
      pruefe(m && nahe(zahl(m[1]), abl(f, x0), 1e-4), `${wo}: Bilanz f′(x₀) falsch — „${bil}“`);
      const anz = bil.match(/(\d+) Hochpunkte, (\d+) Tiefpunkte, (\d+) Wendepunkte/);
      pruefe(anz && Number(anz[1]) === ex.filter((p) => p.typ === "H").length && Number(anz[2]) === ex.filter((p) => p.typ === "T").length && Number(anz[3]) === ws.length, `${wo}: Anzahlen in der Bilanz falsch — „${bil}“`);
    }
  }
}

// ---------- 8. Gedämpfte Schwingung ----------
async function schwingung(page) {
  for (const d0 of [0, 0.05, 0.2, 0.35, 0.5]) {
    const d = await setzeRegler(page, "sw-d", d0);
    const wo = `Schwingung d = ${d}`;
    const f = (x) => E(-d * x) * Math.sin(x), h = (x) => E(-d * x);
    const D = await lies(page, "#sw-mount svg");
    pfadAuf(D, "graph", f, wo);
    pfadAuf(D, "huelle-oben", h, `${wo}, Hüllkurve`);
    pfadAuf(D, "huelle-unten", (x) => -h(x), `${wo}, Hüllkurve`);
    const ex = kritisch(f, 0.01, 4 * PI - 0.01).filter((p) => p.typ !== "S");
    punkteGleich(kreise(D, "extrem"), ex, wo, f, 0.005);
    // Berührpunkte: auf dem Graphen UND auf einer Hüllkurve — dort, wo |f| = e^(−dx) ist.
    const br = kreise(D, "beruehr");
    pruefe(br.length === 4 && br.every((p) => nahe(p.y, f(p.x), 0.005) && nahe(Math.abs(p.y), h(p.x), 0.005) && nahe(Math.abs(Math.sin(p.x)), 1, 1e-4)), `${wo}: Berührpunkte mit der Hüllkurve falsch`);
    const x1 = ex[0].x, H2 = ex.filter((p) => p.typ === "H")[1].x;
    const b = await text(page, "#sw-bilanz");
    pruefe(nahe(wertNach(b, "Hochpunkt bei x₁"), x1, 1e-4) && nahe(wertNach(b, "mit f(x₁)"), f(x1), 1e-4), `${wo}: Bilanz Hochpunkt falsch — „${b}“`);
    pruefe(nahe(wertNach(b, "Tiefpunkt bei x₁ + π"), ex[1].x, 1e-4), `${wo}: Bilanz Tiefpunkt falsch — „${b}“`);
    const v = b.match(/Höhenverhältnis zweier Hochpunkte: .*? [=≈] ([\d,]+)/);
    pruefe(v && nahe(zahl(v[1]), f(H2) / f(x1), 1e-4), `${wo}: Bilanz Höhenverhältnis falsch — „${b}“`);
    if (d > 0) pruefe(x1 < PI / 2 - 0.01, `${wo}: Der Hochpunkt liegt nicht links vom Berührpunkt`);
  }
}

// ---------- 9. Funktionen mit ln ----------
const LN = {
  xlnx: { f: (x) => (x > 0 ? x * Math.log(x) : NaN), xs: [0.1, 0.3, 1, 2, 3], positiv: true },
  lnxx: { f: (x) => (x > 0 ? Math.log(x) / x : NaN), xs: [0.5, 1, 2.75, 4.5, 8, 12], positiv: true },
  lnq: { f: (x) => Math.log(x * x + 1), xs: [-3, -1, 0, 0.5, 2.25, 3], positiv: false },
};
async function lnFunktionen(page) {
  for (const [art, def] of Object.entries(LN)) {
    await waehle(page, "ln-art", art);
    for (const x of def.xs) {
      const x0 = await setzeRegler(page, "ln-x", x);
      const wo = `ln ${art}, x₀ = ${x0}`;
      pruefe(nahe(x0, x, 1e-9), `${wo}: Regler steht auf ${x0} statt ${x}`);
      const f = def.f;
      const D = await lies(page, "#ln-mount svg");
      const lo = def.positiv ? 1e-3 : D.bereich.xmin, hi = D.bereich.xmax;
      pfadAuf(D, "graph", f, wo);
      faerbung(D, f, wo);
      pruefe(D.pfade.filter((p) => p.rolle === "graph").every((p) => p.punkte.every(([px]) => !def.positiv || px > 0)), `${wo}: Graph links von 0`);
      const aus = D.rechtecke.filter((r) => r.rolle === "ausserhalb-d");
      pruefe(def.positiv ? aus.length === 1 && nahe(aus[0].x2, 0, 0.01) : aus.length === 0, `${wo}: Bereich außerhalb von D falsch`);
      const ns = kreise(D, "nullstelle").map((k) => k.x), sollN = nullstellenMitVielfachheit(f, lo, hi).map((z) => z.x);
      pruefe(ns.length === sollN.length && ns.sort((a, b) => a - b).every((z, i) => nahe(z, sollN[i], 0.01)), `${wo}: Nullstellen ${ns} statt ${sollN}`);
      punkteGleich(kreise(D, "extrem"), kritisch(f, lo, hi).filter((p) => p.typ !== "S"), wo + ", Extrempunkte", f, 0.01);
      punkteGleich(kreise(D, "wende"), wendestellen(f, lo, hi), wo + ", Wendepunkte", f, 0.01);
      const rp = kreise(D, "randpunkt");
      pruefe(art === "xlnx" ? rp.length === 1 && nahe(rp[0].x, 0, 0.01) && nahe(rp[0].y, f(1e-12), 1e-6) : rp.length === 0, `${wo}: Randpunkt falsch`);
      const senk = linie(D, "asymptote-senkrecht");
      pruefe(art === "lnxx" ? senk && nahe(senk.x1, 0, 0.01) && f(1e-8) < -1e6 : !senk, `${wo}: senkrechte Asymptote falsch`);
      const waag = linie(D, "asymptote");
      pruefe(art === "lnxx" ? waag && nahe(f(1e9), Number(waag.daten.y), 1e-6) : !waag, `${wo}: waagerechte Asymptote falsch`);
      const t = linie(D, "tangente");
      pruefe(t && nahe(steigung(t), abl(f, x0), 1e-3) && nahe(aufGerade(t, x0), f(x0), 0.01), `${wo}: Tangente falsch`);
      const b = await text(page, "#ln-bilanz");
      pruefe(nahe(wertNach(b, "f(x₀)"), f(x0), 1e-4) && nahe(wertNach(b, "f′(x₀)"), abl(f, x0), 1e-4) && nahe(wertNach(b, "f″(x₀)"), abl2(f, x0), 1e-4), `${wo}: Bilanz falsch — „${b}“`);
    }
  }
}

// ---------- 10. Glockenkurve ----------
async function glocke(page) {
  for (const s0 of [0.5, 1, 1.25, 2]) {
    const s = await setzeRegler(page, "gk-s", s0);
    const wo = `Glockenkurve σ = ${s}`;
    const f = (x) => E((-x * x) / (2 * s * s));
    const D = await lies(page, "#gk-mount svg");
    pfadAuf(D, "graph", f, wo);
    faerbung(D, f, wo);
    punkteGleich(kreise(D, "extrem"), kritisch(f, -5, 5).filter((p) => p.typ !== "S"), wo, f, 0.005);
    const W = wendestellen(f, -5, 5);
    punkteGleich(kreise(D, "wende"), W, wo, f, 0.005);
    const tg = linienMit(D, "wendetangente");
    pruefe(tg.length === 2 && W.every((w) => tg.some((l) => nahe(steigung(l), abl(f, w.x), 1e-3) && nahe(aufGerade(l, w.x), f(w.x), 0.005))), `${wo}: Wendetangenten falsch`);
    const tn = kreise(D, "tangente-nullstelle").map((p) => p.x).sort((a, b) => a - b);
    const soll = W.map((w) => w.x - f(w.x) / abl(f, w.x)).sort((a, b) => a - b);
    pruefe(tn.length === 2 && tn.every((x, i) => nahe(x, soll[i], 0.01)), `${wo}: Schnitt der Wendetangenten mit der x-Achse falsch`);
    const b = await text(page, "#gk-bilanz");
    const m = b.match(/Steigung .*? [=≈] (−?[\d,]+); sie schneidet die x-Achse bei 2σ = (−?[\d,]+)/);
    pruefe(m && nahe(zahl(m[1]), abl(f, W[1].x), 1e-4) && nahe(zahl(m[2]), soll[1], 1e-4), `${wo}: Bilanz der Wendetangente falsch — „${b}“`);
    const h = b.match(/W\(±(−?[\d,]+) \| e−0,5\) ≈ W\(±(−?[\d,]+) \| ([\d,]+)\)/);
    pruefe(h && nahe(zahl(h[1]), W[1].x, 1e-4) && nahe(zahl(h[3]), f(W[1].x), 1e-4), `${wo}: Bilanz der Wendepunkte falsch — „${b}“`);
  }
}

// ---------- 11. Stolperstelle ----------
async function stolperstelle(page) {
  const f = (x) => x ** 3 * E(-0.2 * x);
  for (const r0 of [5, 8, 10, 14, 16, 20, 25, 30, 40]) {
    const r = await setzeRegler(page, "st-r", r0);
    const wo = `Stolperstelle bis ${r}`;
    const D = await lies(page, "#st-mount svg");
    pfadAuf(D, "graph", f, wo);
    pruefe(nahe(D.bereich.xmin, -2, 0.01) && nahe(D.bereich.xmax, r, 0.01), `${wo}: Fenster [${D.bereich.xmin}; ${D.bereich.xmax}]`);
    // Im Fenster müssen genau die besonderen Punkte stehen, die die Rechnung im Fenster findet.
    punkteGleich(kreise(D, "extrem"), kritisch(f, -2, r - 1e-6).filter((p) => p.typ !== "S"), wo + ", Hochpunkt", f, 0.5);
    punkteGleich(kreise(D, "wende"), wendestellen(f, -2, r - 1e-6), wo + ", Wendepunkte", f, 0.5);
    const as = linie(D, "asymptote");
    pruefe(r >= 30 ? as && nahe(f(400), 0, 1e-9) : !as, `${wo}: Asymptote ${as ? "gezeichnet" : "fehlt"}`);
    // Die Bilanz nennt das Fenster, das wirklich gezeichnet ist.
    const b = await text(page, "#st-bilanz");
    const m = b.match(/Fenster: −2 ≤ x ≤ ([\d,]+), (−?[\d.,]+) ≤ y ≤ (−?[\d.,]+)/);
    // Zwei Nachkommastellen (±0,005) plus die Lesegenauigkeit der Gitterlinien.
    pruefe(m && nahe(zahl(m[1]), r, 1e-9) && nahe(zahl(m[2]), D.bereich.ymin, 0.015) && nahe(zahl(m[3]), D.bereich.ymax, 0.015), `${wo}: Fenster in der Bilanz ${m && m.slice(1)} statt [${D.bereich.ymin.toFixed(2)}; ${D.bereich.ymax.toFixed(2)}]`);
    const h = b.match(/Die Rechnung findet: .*?H\(15 \| ([\d,]+)\)/);
    pruefe(h && nahe(zahl(h[1]), f(15), 1e-4) && kritisch(f, 1, 30).some((p) => p.typ === "H" && nahe(p.x, 15, 1e-4)), `${wo}: Hochpunkt in der Bilanz falsch — „${b}“`);
  }
}

// ---------- Kontrollfragen und Selbsteinschätzung ----------
async function quizze(page) {
  const ids = await page.evaluate(() => [...document.querySelectorAll(".quiz")].map((q) => q.id));
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
  const haeufigste = Math.max(...[0, 1, 2, 3].map((i) => stellen.filter((s) => s === i).length));
  pruefe(haeufigste <= Math.ceil(stellen.length / 2), "Kontrollfragen: die richtige Antwort steht zu oft an derselben Stelle");
  await page.evaluate(() => localStorage.clear());
  await page.locator("#se-liste .se-zeile").nth(1).locator("button").nth(2).click();
  const aus = await page.evaluate(() => document.getElementById("se-auswertung").innerHTML);
  pruefe(/href="#sec-zweite"/.test(aus) && /Die zweite Ableitung von p\(x\)/.test(aus) && !/GK \+ LK/.test(aus), `Selbsteinschätzung: kein sauberer Verweis zurück zu Abschnitt 2 — „${aus}“`);
  await page.evaluate(() => localStorage.clear());
}

// ---------- Übungsaufgaben ----------
const T = 0.0001;
const Z = "(−?[\\d,.]+)";
// Ein Vorfaktor in der Angabe: „“ ist 1, „−“ ist −1.
const faktor = (s) => (s === "" || s === undefined ? 1 : s === "−" ? -1 : zahl(s));
const summand = (z, b) => (b === undefined ? 0 : (z === "−" ? -1 : 1) * zahl(b));
const lin = (s) => { const t = s.replace(/[()]/g, "").replace(/−/g, "-").replace(/\s+/g, ""); const m = t.match(/^(-?[\d,]*)x([+-][\d,]+)?$/); return m ? { a: m[1] === "" ? 1 : m[1] === "-" ? -1 : zahl(m[1]), b: m[2] ? zahl(m[2]) : 0 } : null; };
const HOCH = { "²": 2, "³": 3, "⁴": 4 };
function liesPoly(s) {
  const t = String(s).replace(/[()]/g, "").replace(/−/g, "-").replace(/\s+/g, "");
  const re = /([+-]?)(\d+(?:,\d+)?)?(x([²³⁴]?))?/g, k = {};
  let m;
  while ((m = re.exec(t))) {
    if (m[0] === "") { re.lastIndex++; if (re.lastIndex > t.length) break; continue; }
    if (!m[2] && !m[3]) continue;
    const c = (m[1] === "-" ? -1 : 1) * (m[2] ? parseFloat(m[2].replace(",", ".")) : 1);
    const e = m[3] ? (m[4] ? HOCH[m[4]] : 1) : 0;
    k[e] = (k[e] || 0) + c;
  }
  return (x) => Object.entries(k).reduce((sum, [e, c]) => sum + c * x ** Number(e), 0);
}
const glatt4 = (z) => Math.abs(Math.round(z * 1e4) - z * 1e4) < 1e-6;
// Die Aufgabenstellung mit Hochzahlen als „^(…)“, Indizes als „_…“ und Brüchen als „(z)/(n)“ — im
// reinen Text stünde aus 3e^(2x) ein „3e2x“.
async function liesHoch(page, box) {
  return page.evaluate((b) => {
    const e = document.querySelector(`${b} .aufgabe-prompt`).cloneNode(true);
    e.querySelectorAll("br").forEach((s) => s.replaceWith(" "));
    e.querySelectorAll("sup").forEach((s) => s.replaceWith(`^(${s.textContent})`));
    e.querySelectorAll("sub").forEach((s) => s.replaceWith(`_${s.textContent}`));
    e.querySelectorAll(".bruch").forEach((x) => x.replaceWith(`(${x.querySelector(".z").textContent})/(${x.querySelector(".n").textContent})`));
    return e.textContent.replace(/\s+/g, " ").trim();
  }, box);
}
// Gemessen mit UPLANT_ZUEGE=25 tests/werkzeug-streuung.js (200 Würfe je Aufgabe, 10⁻⁴-Quantil für 0,8 · n):
//   UPLANT_ZUEGE=25 node tests/werkzeug-streuung.js /mathematik/mss11/01-analysis/04b-weitere-funktionen-untersuchen/index.html
// Termaufgaben (6, 12, 18, 24) mit 12 Zügen: UPLANT_ZUEGE=12 …
const RT = 12;
// Messung: n ≈ 143, 1039, 40, 236, 30, groß, 177, 41, 23, 49, 134, 535, 44, 36, 35, 30, 41, 928, 156, 18,
// 50, 28, 86, 1742 (Aufgaben 1 bis 24; 6, 12, 18, 24 bei 12 Zügen).
const SCHRANKE = {1: 17, 2: 21, 3: 12, 4: 18, 5: 10, 6: 9, 7: 17, 8: 12, 9: 9, 10: 12, 11: 17, 12: 9, 13: 12, 14: 11, 15: 11, 16: 10, 17: 12, 18: 10, 19: 17, 20: 8, 21: 12, 22: 10, 23: 15, 24: 10};

async function aufgaben(page) {
  const r = 25;
  const A = (nr, name, deute) => pruefeAufgabe(page, bericht, { nr, name, runden: r, mindestensVerschieden: SCHRANKE[nr] ?? 5,
    liesRoh: liesHoch, deute: (frage, roh) => deute(roh, frage) });
  const pe = "\\(?(.+?)\\)? · e\\^\\((−?[\\d,]*)x\\)";

  await A(1, "A1 f″(0)", (q) => {
    const m = q.match(new RegExp(`f\\(x\\) = ${pe}\\. Berechne f″\\(0\\)`));
    if (!m) return null;
    const p = lin(m[1]), k = faktor(m[2]);
    if (!p) return null;
    const f = (x) => (p.a * x + p.b) * E(k * x);
    return { richtig: abl2(f, 0), toleranz: T, falsch: [[abl(f, 0), "Das ist f′(0)"], [k * p.a + k * k * p.b, "zweimal"], [2 * p.a + p.b, "Der Faktor k fehlt"]] };
  });
  await A(2, "A2 Asymptote und y-Achsenabschnitt", (q) => {
    const m = q.match(new RegExp(`f\\(x\\) = ${pe} ([+−]) ([\\d,]+)\\. Gib die waagerechte Asymptote y = c für x → ([+−])∞`));
    if (!m) return null;
    const p = lin(m[1]), k = faktor(m[2]), d = summand(m[3], m[4]);
    if (!p) return null;
    const f = (x) => (p.a * x + p.b) * E(k * x) + d, X = m[5] === "+" ? 200 / Math.abs(k) : -200 / Math.abs(k);
    pruefe(Math.sign(k * X) < 0, "A2: Die gefragte Seite hat keine Asymptote");
    return { felder: [f(X), f(0)], toleranz: T, falschFelder: [[0, 0, "Ohne den Summanden"], [0, f(0), "Das ist f(0)"], [1, p.b, "gehört zu f(0) dazu"], [1, d, "e⁰ = 1, nicht 0"]] };
  });
  await A(3, "A3 Tiefpunkt einer ln-Funktion", (q) => {
    const m = q.match(/f\(x\) = (?:([\d,]+) · )?x · (?:\(ln\(x\) ([+−]) ([\d,]+)\)|ln\(x\)) für x > 0\. Bestimme die Koordinaten des Tiefpunkts/);
    if (!m) return null;
    const a = m[1] ? zahl(m[1]) : 1, c = -summand(m[2], m[3]);
    const f = (x) => a * x * (Math.log(x) - c);
    const Tp = kritisch(f, 1e-3, 40).find((p) => p.typ === "T");
    if (!Tp) return null;
    return { felder: [Tp.x, f(Tp.x)], toleranz: T, falschFelder: [[0, E(c), "zwei Summanden"], [0, E(c + 1), "Vorzeichenfehler"], [1, a === 1 ? NaN : -E(c - 1), "fehlt"], [1, -f(Tp.x), "Vorzeichen: An der Tiefstelle"]] };
  });
  await A(4, "A4 Beschränktes Wachstum", (q) => {
    const m = q.match(/h\(t\) = ([\d,]+) − ([\d,]+) · e\^\(−([\d,]+)t\)/);
    if (!m) return null;
    const S = zahl(m[1]), c = zahl(m[2]), k = zahl(m[3]), f = (t) => S - c * E(-k * t);
    return { felder: [f(1e4), f(0), abl(f, 0)], toleranz: T, falschFelder: [[0, c, "Abstand zur Grenze"], [0, f(0), "Höhe zu Beginn"], [1, f(1e4), "e⁰ = 1"], [1, -c, "gehört dazu"], [2, -abl(f, 0), "Zwei Minuszeichen"], [2, c, "fehlt"]] };
  });
  await A(5, "A5 Wendepunkt der Glockenkurve", (q) => {
    const m = q.match(/f\(x\) = (?:([\d,]+) · )?e\^\(−x²\/([\d,]+)\)\. Bestimme den Wendepunkt mit positiver x-Koordinate/);
    if (!m) return null;
    const a = m[1] ? zahl(m[1]) : 1, c = zahl(m[2]), f = (x) => a * E((-x * x) / c);
    const w = wendestellen(f, 0.01, 30)[0].x;
    return { felder: [w, f(w)], toleranz: T, falschFelder: [[0, c, "ist 2σ²"], [0, nahe(w, 1, 1e-9) ? NaN : w * w, "ziehe noch die Wurzel"], [0, Math.sqrt(c), "σ · √2"], [1, a, "Hochpunkts"], [1, a * E(-1), "f(σ) ="]] };
  });
  await A(7, "A7 Wendepunkt", (q) => {
    const m = q.match(new RegExp(`f\\(x\\) = ${pe}\\. Bestimme den Wendepunkt des Graphen`));
    if (!m) return null;
    const p = lin(m[1]), k = faktor(m[2]);
    if (!p) return null;
    const f = (x) => (p.a * x + p.b) * E(k * x), ws = wendestellen(f, -12, 12), ex = kritisch(f, -12, 12);
    pruefe(ws.length === 1 && ex.length === 1, `A7: ${ws.length} Wende-, ${ex.length} Extremstellen`);
    const w = ws[0].x;
    return { felder: [w, f(w)], toleranz: T, falschFelder: [[0, ex[0].x, "Das ist die Extremstelle"], [0, -p.b / p.a + 2 / k, "Vorzeichenfehler"], [1, p.a * w + p.b, "gehört zum Funktionswert dazu"]] };
  });
  await A(8, "A8 Krümmungsintervall", (q) => {
    const m = q.match(/f\(x\) = (−?[\d,]*)x² · e\^\((−?[\d,]*)x\)\. Auf welchem Intervall \]x₁; x₂\[ ist der Graph von f eine (Linkskurve|Rechtskurve)\?/);
    if (!m) return null;
    const a = faktor(m[1]), k = faktor(m[2]), f = (x) => a * x * x * E(k * x);
    const w = wendestellen(f, -10, 10).map((p) => p.x).sort((p, qq) => p - qq), ex = kritisch(f, -10, 10).map((p) => p.x).sort((p, qq) => p - qq);
    pruefe(w.length === 2 && ex.length === 2, `A8: ${w.length} Wende-, ${ex.length} Extremstellen`);
    if (w.length !== 2 || ex.length !== 2) return null;
    const mitte = abl2(f, (w[0] + w[1]) / 2);
    pruefe(m[3] === "Linkskurve" ? mitte > 0 : mitte < 0, `A8: Zwischen den Wendestellen ist der Graph keine ${m[3]}`);
    return { felder: w, toleranz: T, falschFelder: [[0, w[1], "vertauscht"], [1, w[0], "vertauscht"], [0, ex[0], "Extremstelle"], [1, ex[1], "Extremstelle"]] };
  });
  await A(9, "A9 Sinus und Kosinus", (q) => {
    const m = q.match(/f\(x\) = (−?[\d,]*)x ([+−]) ([\d,]+ )?(sin|cos)\(x\) auf dem Intervall \[0; 2π\]/);
    if (!m) return null;
    const s = m[1] === "" ? 1 : m[1] === "−" ? -1 : zahl(m[1]);
    const c = (m[2] === "−" ? -1 : 1) * (m[3] ? zahl(m[3]) : 1);
    const tr = m[4] === "sin" ? Math.sin : Math.cos;
    const f = (x) => s * x + c * tr(x);
    const k = kritisch(f, 1e-4, 2 * PI - 1e-4), H = k.find((p) => p.typ === "H"), Tt = k.find((p) => p.typ === "T");
    if (!H || !Tt) return null;
    const h = H.x / PI, t = Tt.x / PI;
    return { felder: [h, t], toleranz: T, falschFelder: [[0, t, "vertauscht"], [0, h * 180, "Winkel in Grad"], [1, h, "vertauscht"], [1, t * 180, "Winkel in Grad"]] };
  });
  await A(10, "A10 Scharparameter", (q) => {
    const m = q.match(/f_k\(x\) = (−?[\d,]*)x · e\^\(−kx\) gegeben\. Für welchen Wert von k liegt der Hochpunkt bei x = ([\d,]+)\?/);
    if (!m) return null;
    const a = faktor(m[1]), x0 = zahl(m[2]);
    // k so, dass f_k′(x₀) = 0 ist — Bisektion über k, dann Probe: Vorzeichenwechsel + → −.
    const fk = (k) => (x) => a * x * E(-k * x);
    let lo = 1e-3, hi = 50;
    for (let i = 0; i < 200; i++) { const mid = (lo + hi) / 2; if (Math.sign(abl(fk(mid), x0)) === Math.sign(abl(fk(lo), x0))) lo = mid; else hi = mid; }
    const k = (lo + hi) / 2, f = fk(k);
    pruefe(abl(f, x0 - 0.01) > 0 && abl(f, x0 + 0.01) < 0, "A10: Bei x₀ liegt kein Hochpunkt");
    return { felder: [k, f(x0)], toleranz: T, falschFelder: [[0, x0, "Kehrwert"], [0, 2 / x0, "Wendestelle"], [1, a * x0, "An der Hochstelle ist k · x = 1"]] };
  });
  await A(11, "A11 Logistisches Wachstum", (q) => {
    const m = q.match(/f\(t\) = \(([\d.]+)\)\/\(1 \+ ([\d,]+) · e\^\(−([\d,]+)t\)\)/);
    if (!m) return null;
    const S = zahl(m[1]), a = zahl(m[2]), k = zahl(m[3]), f = (t) => S / (1 + a * E(-k * t));
    // Weit rechts ist f″ kleiner als das Rundungsrauschen der Differenzen — gesucht wird nur, solange
    // a · e^(−kt) noch über 10⁻⁶ liegt, und mit größerer Schrittweite (weniger Rauschen).
    const w = vzw((t) => abl2(f, t, 1e-3), 0.01, Math.log(a * 1e6) / k, 3000);
    pruefe(w.length === 1, `A11: ${w.length} Wendestellen`);
    return { felder: [w[0], abl(f, w[0])], toleranz: T, falschFelder: [[0, Math.log(a) * k, "nicht multipliziert"], [0, Math.log(a), "teile noch durch"], [0, -w[0], "Vorzeichen"], [1, S / 2, "Bestand am Wendepunkt"], [1, S * k, "Nenner"]] };
  });
  await A(13, "A13 Hoch- und Tiefpunkt", (q) => {
    const m = q.match(/f\(x\) = \(?(.+?)\)? · e\^\((−?)x\)\. Bestimme die Stelle des Hochpunkts/);
    if (!m) return null;
    const p = liesPoly(m[1]), k = m[2] === "−" ? -1 : 1, f = (x) => p(x) * E(k * x);
    const kr = kritisch(f, -15, 15), H = kr.find((z) => z.typ === "H"), Tt = kr.find((z) => z.typ === "T");
    if (!H || !Tt) return null;
    const nz = vzw(p, -30, 30).filter(glatt4);
    return { felder: [H.x, Tt.x], toleranz: T, falschFelder: [[0, Tt.x, "vertauscht"], [1, H.x, "vertauscht"], ...nz.flatMap((n) => [[0, n, "Nullstelle von f"], [1, n, "Nullstelle von f"]])] };
  });
  await A(14, "A14 Rechteck unter einer e-Funktion", (q) => {
    const m = q.match(/f\(x\) = ([\d,]*)e\^\(−([\d,]+)x\) liegt im ersten Quadranten/);
    if (!m) return null;
    const a = faktor(m[1]), k = zahl(m[2]), Af = (u) => u * a * E(-k * u);
    const u = maxStelle(Af, 1e-6, 30);
    return { felder: [u, Af(u)], toleranz: T, falschFelder: [[0, k, "folgt u ="], [1, a / k, "fehlt: f(u)"], [1, a * E(-1), "Das ist nur die Höhe"]] };
  });
  await A(15, "A15 Hochpunkt einer ln-Funktion", (q) => {
    const m = q.match(/f\(x\) = (?:([\d,]+) · )?\(ln\(([\d,]*)x\)\)\/\(x\) für x > 0\. Bestimme die Koordinaten des Hochpunkts/);
    if (!m) return null;
    const b = m[1] ? zahl(m[1]) : 1, a = faktor(m[2]), f = (x) => (b * Math.log(a * x)) / x;
    const H = kritisch(f, 1e-3, 60).find((p) => p.typ === "H");
    if (!H) return null;
    return { felder: [H.x, f(H.x)], toleranz: T, falschFelder: [[0, 1 / a, "dort ist f null"], [0, a * Math.E, "= e ⟺"], [1, (b * Math.E) / a, "Kehrwert"], [1, a === 1 ? NaN : b / Math.E, "Im Nenner steht"]] };
  });
  await A(16, "A16 Gedämpfte Schwingung", (q) => {
    const m = q.match(/f\(x\) = (?:([\d,]+) · )?e\^\(−([\d,]+)x\) · sin\(x\) beschrieben/);
    if (!m) return null;
    const A0 = m[1] ? zahl(m[1]) : 1, d = zahl(m[2]), f = (x) => A0 * E(-d * x) * Math.sin(x);
    const hs = kritisch(f, 1e-4, 4 * PI).filter((p) => p.typ === "H");
    if (hs.length < 2) return null;
    return { felder: [hs[0].x, f(hs[1].x) / f(hs[0].x)], toleranz: T, falschFelder: [[0, PI / 2, "berührt der Graph die Hüllkurve"], [0, Math.atan(d), "nicht"], [1, E(-PI * d), "Nach π kommt ein Tiefpunkt"]] };
  });
  await A(17, "A17 Ortskurve der Wendepunkte", (q) => {
    const m = q.match(/f_k\(x\) = (−?[\d,]*)x · e\^\(−kx\) gegeben\. Bestimme den Wendepunkt W\(x_W \| y_W\) für k = ([\d,]+) und die Zahl c/);
    if (!m) return null;
    const a = faktor(m[1]), k = zahl(m[2]), fk = (kk) => (x) => a * x * E(-kk * x), f = fk(k);
    const W = (kk) => { const w = vzw((x) => abl2(fk(kk), x, 1e-3), 0.01, 25 / kk, 3000)[0]; return [w, fk(kk)(w)]; };
    const [xw, yw] = W(k), c = yw / xw;
    // Ortskurve: Auch für andere k liegt W auf y = c · x.
    pruefe([0.5, 3].every((kk) => { const [x, y] = W(kk); return nahe(y / x, c, 1e-5); }), "A17: Die Wendepunkte liegen nicht auf einer Ursprungsgeraden");
    const H = kritisch(f, 0.01, 80).find((p) => p.typ === "H");
    return { felder: [xw, yw, c], toleranz: T, falschFelder: [[0, H.x, "ist die Hochstelle"], [0, nahe(k, 2, 1e-9) ? NaN : k / 2, "nicht k geteilt durch 2"], [1, f(H.x), "Höhe des Hochpunkts"], [2, f(H.x) / H.x, "Ortskurve der Hochpunkte"], [2, a, "Der Faktor e"]] };
  });
  await A(19, "A19 Funktion aus dem Extrempunkt", (q) => {
    const m = q.match(/f\(x\) = \(ax \+ b\) · e\^\((−?[\d,]*)x\) schneidet die y-Achse bei y = (−?[\d,]+) und hat an der Stelle x = (−?[\d,]+) einen Extrempunkt/);
    if (!m) return null;
    const k = faktor(m[1]), b = zahl(m[2]), xE = zahl(m[3]);
    // f′(x_E) hängt linear von a ab: zwei Auswertungen genügen.
    const g = (a) => abl((x) => (a * x + b) * E(k * x), xE), a = -g(0) / (g(1) - g(0)), f = (x) => (a * x + b) * E(k * x);
    pruefe(Math.sign(abl(f, xE - 0.01)) !== Math.sign(abl(f, xE + 0.01)), "A19: Bei x_E liegt kein Extrempunkt");
    return { felder: [a, f(xE)], toleranz: T, falschFelder: [[0, -a, "Vorzeichenfehler"], [0, -b / xE, "u′ · v"], [1, a * xE + b, "gehört zum Funktionswert dazu"]] };
  });
  await A(20, "A20 Rechteck unter dem Kosinus", (q) => {
    const m = q.match(/f\(x\) = cos\(([\d,]*)x\) liegt.*?Startwert u₀ = ([\d,]+) die Näherungen/);
    if (!m) return null;
    const b = faktor(m[1]), u0 = zahl(m[2]), Af = (u) => 2 * u * Math.cos(b * u);
    // g = A′/2 und g′ = A″/2, numerisch aus der Zielfunktion — nicht aus dem Term der Angabe.
    const g = (u) => abl(Af, u) / 2, dg = (u) => abl2(Af, u) / 2;
    const u1 = u0 - g(u0) / dg(u0), u2 = u1 - g(u1) / dg(u1);
    return { felder: [u1, u2], toleranz: T, falschFelder: [[0, u0 + g(u0) / dg(u0), "mit Minus"], [1, u1 + g(u1) / dg(u1), "mit Minus"], [1, u1, "es fehlt noch ein Schritt"]] };
  });
  await A(21, "A21 Wirkstoffkonzentration", (q) => {
    const m = q.match(/c\(t\) = ([\d,]+)t · e\^\(−([\d,]*)t\)/);
    if (!m) return null;
    const a = zahl(m[1]), k = faktor(m[2]), c = (t) => a * t * E(-k * t);
    const H = kritisch(c, 1e-3, 100).find((p) => p.typ === "H");
    const w = wendestellen(c, H.x, 200)[0].x;
    pruefe(abl(c, w) < abl(c, w - 0.05) && abl(c, w) < abl(c, w + 0.05), "A21: An der Wendestelle ist c′ nicht am kleinsten");
    return { felder: [H.x, c(H.x), w], toleranz: T, falschFelder: [[0, nahe(k, 1, 1e-9) ? NaN : k, "= 0 ⟺ t ="], [1, a / k, "Der Faktor e"], [2, H.x, "größten Konzentration"], [2, nahe(k, 2, 1e-9) ? NaN : k / 2, "nicht k geteilt durch 2"]] };
  });
  await A(22, "A22 ln-Funktion vollständig", (q) => {
    const m = q.match(/f\(x\) = (?:([\d,]+) · )?x · \(ln\(x\)(?: ([+−]) ([\d,]+))?\)² für x > 0/);
    if (!m) return null;
    const b = m[1] ? zahl(m[1]) : 1, a = -summand(m[2], m[3]), f = (x) => b * x * (Math.log(x) - a) ** 2;
    // Kritische Stellen über x = e^s — die Hochstelle e^(a − 2) liegt sonst zwischen zwei Rasterpunkten.
    const F = (s) => f(E(s)), kr = kritisch(F, -6, 4).map((p) => ({ x: E(p.x), typ: p.typ }));
    const H = kr.find((p) => p.typ === "H"), Tt = kr.find((p) => p.typ === "T"), w = vzw((x) => abl2(f, x), 0.01, 30, 6000);
    if (!H || !Tt || w.length !== 1) return null;
    return { felder: [H.x, Tt.x, w[0]], toleranz: T, falschFelder: [[0, Tt.x, "vertauscht"], [1, H.x, "vertauscht"], [0, E(a + 2), "Vorzeichen"], [2, E(a + 1), "Vorzeichen"]] };
  });
  await A(23, "A23 Wendetangente", (q) => {
    const m = q.match(new RegExp(`f\\(x\\) = ${pe}\\. Bestimme die Wendestelle und die Gleichung der Wendetangente`));
    if (!m) return null;
    const p = lin(m[1]), k = faktor(m[2]);
    if (!p) return null;
    const f = (x) => (p.a * x + p.b) * E(k * x), w = wendestellen(f, -12, 12)[0].x, ex = kritisch(f, -12, 12)[0].x;
    const mm = abl(f, w), n = f(w) - mm * w;
    return { felder: [w, mm, n], toleranz: T, falschFelder: [[0, ex, "Das ist die Extremstelle"], [1, f(w), "die y-Koordinate"], [2, nahe(w, 0, 1e-9) ? NaN : f(w), "y-Achsenabschnitt der Tangente"], [2, nahe(w, 0, 1e-9) ? NaN : f(w) + mm * w, "Vorzeichen"]] };
  });
  // Je Stufe eine Termaufgabe mit beliebig vielen Funktionen. Die Angabe wird mit einem eigenen
  // Termleser gelesen und numerisch abgeleitet (tests/lib/terme.js).
  for (const [nr, stufe] of [[6, "e-Funktionen"], [12, "Produkte mit e"], [18, "Sinus und Kosinus"], [24, "Verkettung und Funktionenschar"]]) {
    const name = `A${nr} f′ und f″: ${stufe}`;
    await pruefeAufgabe(page, bericht, { nr, name, runden: RT, mindestensVerschieden: SCHRANKE[nr] ?? 5,
      liesRoh: liesTermAufgabe, deute: termDeuter(bericht, name, "zweite") });
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
      await vergleich(page);
      await zweite(page);
      await schema(page);
      await scharen(page);
      await wachstum(page);
      await optimierung(page);
      await trig(page);
      await schwingung(page);
      await lnFunktionen(page);
      await glocke(page);
      await stolperstelle(page);
      await quizze(page);
      await pruefeTermleser(page, bericht);
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
