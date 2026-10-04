// Fachliche Prüfung: MSS 11, Analysis, Thema 4 „Funktionsuntersuchung“.
//
// Geprüft wird, was die Seite zeigt, gegen eine unabhängige Rechnung. Ableitungen, Extrem- und
// Wendestellen bestimmt die Prüfung NICHT mit den Formeln der Seite, sondern numerisch: zentrale
// Differenzen für f′ und f″, Vorzeichenwechsel mit Bisektion für Nullstellen, Dreiteilung für
// Berührstellen. Eine falsch hergeleitete Formel auf der Seite fiele so auf.
//
//   * Gerüst: Abschnittsfolge und Nummern, Verweise und Sprungmarken, Menükarte, Formelsammlung,
//     Verweise von Thema 2 und 3 auf diese Seite;
//   * jede Zeichnung wird aus dem SVG zurückgelesen (Maßstab aus den Gitterlinien mit data-wert):
//     Graphen von f, f′, f″, Tangenten, Krümmungsfärbung, Lenkpfeil, Extrem- und Wendepunkte mit
//     Typ, Bänder für Monotonie und Krümmung, Randextrema, Ortskurve, Schachtelnetz, Newton-Folge;
//   * die Bilanzen werden gegen die unabhängige Rechnung gelesen;
//   * Kontrollfragen, Selbsteinschätzung und alle zwanzig Aufgaben — jede von beiden Seiten.

"use strict";

const { neuerBericht } = require("../lib/pruefen");
const { starteBrowser, neueSeite, oeffne, setzeRegler, text } = require("../lib/seite");
const { pruefeNotation } = require("../lib/notation");
const { pruefeKontrast } = require("../lib/kontrast");
const { pruefeAufgabe, zahl } = require("../lib/aufgaben");
const fs = require("fs");
const path = require("path");

const bericht = neuerBericht();
const { pruefe } = bericht;
const SEITE = "/mathematik/mss11/01-analysis/04-funktionsuntersuchung/index.html";
const WURZEL = path.resolve(__dirname, "..", "..");
const nahe = (a, b, tol = 1e-6) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= tol;

// ---------- Numerik: Ableitungen und besondere Stellen ohne Ableitungsregeln ----------
const abl = (f, x, h = 1e-5) => (f(x + h) - f(x - h)) / (2 * h);
const abl2 = (f, x, h = 1e-4) => (f(x + h) - 2 * f(x) + f(x - h)) / (h * h);
// Einfache Nullstellen einer Funktion g auf [lo, hi] (Vorzeichenwechsel, dann Bisektion).
function vzw(g, lo, hi, n = 3000) {
  const h = (hi - lo) / n, aus = [];
  // Beide Intervallenden aus demselben Raster: a + h und lo + (i + 1) · h können sich in der letzten
  // Binärstelle unterscheiden — dann fiele eine Nullstelle genau auf einem Rasterpunkt durch.
  for (let i = 0; i < n; i++) {
    let a = lo + i * h, b = lo + (i + 1) * h;
    const ga = g(a), gb = g(b);
    if (ga === 0) { if (!aus.some((z) => Math.abs(z - a) < 1e-6)) aus.push(a); continue; }
    if (Math.sign(ga) * Math.sign(gb) < 0) {
      for (let k = 0; k < 60; k++) { const m = (a + b) / 2; if (Math.sign(g(m)) === Math.sign(g(a))) a = m; else b = m; }
      aus.push((a + b) / 2);
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
    const links = d(z - 0.03), rechts = d(z + 0.03);
    return { x: z, typ: links > 0 && rechts < 0 ? "H" : links < 0 && rechts > 0 ? "T" : "S" };
  });
}
// Wendestellen: Vorzeichenwechsel von f″; Typ S, wenn dort auch f′ = 0 ist.
function wendestellen(f, lo, hi) {
  return vzw((x) => abl2(f, x), lo, hi, 2000).map((x) => ({ x, typ: Math.abs(abl(f, x)) < 1e-5 ? "S" : "W" }));
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

async function waehle(page, id, wert) {
  await page.selectOption("#" + id, wert);
}
async function haken(page, id, an) {
  await page.setChecked("#" + id, an);
}
async function spanWert(page, sel) {
  return zahl(await page.evaluate((s) => (document.querySelector(s) || {}).textContent || "", sel));
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
      pfade: [...svg.querySelectorAll("path[data-rolle]")].map((p) => ({ rolle: p.dataset.rolle, teil: p.dataset.teil, daten: { ...p.dataset }, klasse: p.getAttribute("class") || "", punkte: paare(p.getAttribute("d")).map(([a, b]) => [X(a), Y(b)]) })),
      kreise: [...svg.querySelectorAll("circle")].map((c) => ({ x: X(n(c, "cx")), y: Y(n(c, "cy")), klasse: c.getAttribute("class") || "", daten: { ...c.dataset } })),
      linien: [...svg.querySelectorAll("line[data-rolle]")].map((l) => ({ rolle: l.dataset.rolle, klasse: l.getAttribute("class") || "", daten: { ...l.dataset }, x1: X(n(l, "x1")), y1: Y(n(l, "y1")), x2: X(n(l, "x2")), y2: Y(n(l, "y2")) })),
      rechtecke: [...svg.querySelectorAll("rect[data-rolle]")].map((r) => ({ rolle: r.dataset.rolle, x1: X(n(r, "x")), x2: X(n(r, "x") + n(r, "width")), y1: Y(n(r, "y") + n(r, "height")), y2: Y(n(r, "y")) })),
    };
  }, sel);
}
const linie = (d, rolle) => d.linien.find((l) => l.rolle === rolle);
const linien = (d, rolle) => d.linien.filter((l) => l.rolle === rolle);
const kreise = (d, rolle) => d.kreise.filter((k) => k.daten.rolle === rolle);
const kreis = (d, rolle) => kreise(d, rolle)[0];
const steigung = (l) => (l.y2 - l.y1) / (l.x2 - l.x1);
// Wert einer gezeichneten Geraden an der Stelle x.
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
function faerbung(d, f, wo) {
  let schlecht = 0, beispiel = "";
  for (const q of d.pfade.filter((p) => p.rolle === "graph" && (p.teil === "links" || p.teil === "rechts"))) {
    for (const [x] of q.punkte) {
      const w = abl2(f, x);
      if (Math.abs(w) < 0.05) continue;
      if ((w > 0) !== (q.teil === "links")) { schlecht++; beispiel = `x = ${x.toFixed(3)}: ${q.teil}, f″ = ${w.toFixed(3)}`; }
    }
  }
  pruefe(schlecht === 0, `${wo}: Krümmungsfärbung falsch an ${schlecht} Stellen, z. B. ${beispiel}`);
}
// Gefundene Punkte (x, Typ) gegen die gezeichneten Kreise.
function punkteGleich(gezeichnet, soll, wo, f) {
  const g = gezeichnet.map((k) => ({ x: k.x, y: k.y, typ: k.daten.typ })).sort((a, b) => a.x - b.x);
  const s = [...soll].sort((a, b) => a.x - b.x);
  pruefe(g.length === s.length, `${wo}: ${g.length} Punkte gezeichnet statt ${s.length} (${s.map((p) => p.typ + p.x.toFixed(3)).join(", ")})`);
  if (g.length !== s.length) return;
  g.forEach((p, i) => {
    pruefe(nahe(p.x, s[i].x, 0.01) && nahe(p.y, f(s[i].x), 0.02), `${wo}: Punkt ${i + 1} bei (${p.x.toFixed(3)} | ${p.y.toFixed(3)}) statt (${s[i].x.toFixed(3)} | ${f(s[i].x).toFixed(3)})`);
    if (s[i].typ) pruefe(p.typ === s[i].typ, `${wo}: Punkt bei ${s[i].x.toFixed(3)} ist als ${p.typ} markiert statt ${s[i].typ}`);
  });
}

// Polynom aus dem Klartext: „−2x³ − x² − 2x − 5“ → {3: −2, 2: −1, 1: −2, 0: −5}.
const HOCH = { "²": 2, "³": 3, "⁴": 4, "⁵": 5 };
function liesPoly(s, v = "x") {
  const t = String(s).replace(/−/g, "-").replace(/\s+/g, "");
  const re = new RegExp(`([+-]?)(\\d+(?:,\\d+)?)?(${v}([²³⁴⁵]?))?`, "g");
  const k = {};
  let m;
  while ((m = re.exec(t))) {
    if (m[0] === "") { re.lastIndex++; if (re.lastIndex > t.length) break; continue; }
    if (!m[2] && !m[3]) continue;
    const c = (m[1] === "-" ? -1 : 1) * (m[2] ? parseFloat(m[2].replace(",", ".")) : 1);
    const e = m[3] ? (m[4] ? HOCH[m[4]] : 1) : 0;
    k[e] = (k[e] || 0) + c;
  }
  return k;
}
const polyFn = (k) => (x) => Object.entries(k).reduce((s, [e, c]) => s + c * x ** Number(e), 0);

// ---------- Gerüst ----------
const ABSCHNITTE = ["sec-hoehere", "sec-kruemmung", "sec-extrem2", "sec-wendepunkte", "sec-schema", "sec-trig", "sec-global",
  "sec-fstrich", "sec-scharen", "sec-steckbrief", "sec-optimierung", "sec-newton", "sec-stolperstelle"];
async function geruest(page) {
  const folge = await page.evaluate(() => [...document.querySelectorAll("main section[id]")].map((s) => s.id));
  const soll = [...ABSCHNITTE, "sec-selbsteinschaetzung", "sec-vernetzung", "sec-formelsammlung", "sec-uebungen"];
  pruefe(JSON.stringify(folge) === JSON.stringify(soll), `Gerüst: Abschnitte ${folge.join(", ")} statt ${soll.join(", ")}`);
  const titel = await page.evaluate((ids) => ids.map((id) => document.querySelector(`#${id} h2`).textContent), ABSCHNITTE);
  titel.forEach((t, i) => pruefe(t.startsWith(`${i + 1}. `), `Gerüst: Überschrift „${t}“ trägt nicht die Nummer ${i + 1}`));
  pruefe(fs.existsSync(path.join(WURZEL, path.dirname(SEITE), "formelsammlung.pdf")), "Formelsammlung: formelsammlung.pdf fehlt");
  pruefe(/Elemente der Mathematik/.test(await text(page, "main")) && /Fundamente der Mathematik/.test(await text(page, "main")), "Gerüst: Die beiden Lehrwerke werden nicht genannt");
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
  pruefe(/data-section="mss11" href="04-funktionsuntersuchung\/index.html" hidden/.test(menue), "Menü: Karte für die Funktionsuntersuchung fehlt oder ist nicht mit data-section/hidden versehen");
  // Die Nachbarthemen verweisen hierher — und nicht mehr auf ein „Thema 5“.
  for (const t of ["02-grenzwerte-und-stetigkeit", "03-differentialrechnung"]) {
    const h = fs.readFileSync(path.join(WURZEL, `mathematik/mss11/01-analysis/${t}/index.html`), "utf-8");
    pruefe(h.includes("../04-funktionsuntersuchung/index.html"), `Vernetzung: ${t} verweist nicht auf die Funktionsuntersuchung`);
    pruefe(!/Funktionsuntersuchung[^<]{0,40}Thema 5|Thema 5[^<]{0,80}Funktionsuntersuchung/.test(h), `Vernetzung: ${t} nennt die Funktionsuntersuchung noch Thema 5`);
  }
  const haupt = await page.evaluate(() => document.querySelector("main").innerText);
  pruefe(!/\bln\s*\(|\blog\b|\blg\b|Logarithmus/.test(haupt.replace(/Exponential- und Logarithmusfunktionen/g, "")), "Gerüst: Die Seite benutzt einen Logarithmus, der erst später kommt");
}

// ---------- 1. Höhere Ableitungen ----------
const HO = {
  kubik: { f: (x) => 0.5 * x ** 3 - 1.5 * x, xs: [-2, -1, 0, 0.5, 1, 2] },
  quartik: { f: (x) => 0.125 * x ** 4 - 0.75 * x * x, xs: [-2.5, -1, 0, 1, 1.5, 2.5] },
  fall: { f: (t) => 5 * t * t, xs: [0, 1, 2.5, 4] },
};
async function hoehere(page) {
  for (const [art, def] of Object.entries(HO)) {
    await waehle(page, "ho-art", art);
    for (const x of def.xs) {
      const x0 = await setzeRegler(page, "ho-x", x);
      const wo = `Höhere Ableitungen ${art}, x₀ = ${x0}`;
      pruefe(x0 === x, `${wo}: Regler steht auf ${x0} statt ${x}`);
      const f = def.f, f1 = (t) => abl(f, t), f2 = (t) => abl2(f, t);
      const D1 = await lies(page, '#ho-mount svg[data-panel="f"]');
      const D2 = await lies(page, '#ho-mount svg[data-panel="a"]');
      const D3 = await lies(page, '#ho-mount svg[data-panel="a2"]');
      pfadAuf(D1, "graph", f, `${wo}, Graph f`);
      pfadAuf(D2, "ableitung", f1, `${wo}, Graph f′`);
      pfadAuf(D3, "ableitung2", f2, `${wo}, Graph f″`);
      const t1 = linie(D1, "tangente-f"), t2 = linie(D2, "tangente-a");
      pruefe(t1 && nahe(steigung(t1), f1(x0), 1e-3) && nahe(aufGerade(t1, x0), f(x0), 0.02), `${wo}: Tangente an f falsch`);
      pruefe(t2 && nahe(steigung(t2), f2(x0), 1e-3) && nahe(aufGerade(t2, x0), f1(x0), 0.02), `${wo}: Tangente an f′ hat nicht die Steigung f″(x₀) = ${f2(x0)}`);
      const p3 = kreis(D3, "p-a2");
      pruefe(p3 && nahe(p3.x, x0, 0.01) && nahe(p3.y, f2(x0), 0.02 * (1 + Math.abs(f2(x0)))), `${wo}: Punkt auf f″ falsch`);
      pruefe(nahe(await spanWert(page, "#ho-bilanz .wa"), f1(x0), 1e-3), `${wo}: Bilanz f′(x₀) falsch`);
      pruefe(nahe(await spanWert(page, "#ho-bilanz .wr"), f2(x0), 1e-3), `${wo}: Bilanz f″(x₀) falsch`);
    }
  }
}

// ---------- 2. Krümmung ----------
const KR = {
  kubik: { f: (x) => 0.5 * x ** 3 - 1.5 * x, xs: [-2.5, -1, -0.25, 0, 0.25, 1.5, 2.5] },
  quartik: { f: (x) => 0.125 * x ** 4 - 0.75 * x * x, xs: [-2, -1, 0, 1, 2] },
  sinus: { f: Math.sin, xs: [-3, -1.5, 0, 1, 2.5, 4, 6.25] },
};
async function kruemmung(page) {
  for (const [art, def] of Object.entries(KR)) {
    await waehle(page, "kr-art", art);
    for (const x of def.xs) {
      const x0 = await setzeRegler(page, "kr-x", x);
      const wo = `Krümmung ${art}, x₀ = ${x0}`;
      const f = def.f, w = abl2(f, x0);
      const D1 = await lies(page, '#kr-mount svg[data-panel="f"]');
      const D2 = await lies(page, '#kr-mount svg[data-panel="a"]');
      pfadAuf(D1, "graph", f, wo);
      faerbung(D1, f, wo);
      pfadAuf(D2, "ableitung", (t) => abl(f, t), `${wo}, f′`);
      const t = linie(D1, "tangente");
      pruefe(t && nahe(steigung(t), abl(f, x0), 1e-3) && nahe(aufGerade(t, x0), f(x0), 0.02), `${wo}: Tangente falsch`);
      const ta = linie(D2, "tangente-a");
      pruefe(ta && nahe(steigung(ta), w, 1e-3), `${wo}: Tangente an f′ hat nicht die Steigung f″(x₀)`);
      const pfeil = D1.pfade.find((p) => p.rolle === "lenkpfeil");
      if (Math.abs(w) < 1e-6) pruefe(!pfeil, `${wo}: Lenkpfeil bei f″(x₀) = 0`);
      else pruefe(pfeil && pfeil.daten.art === (w > 0 ? "links" : "rechts"), `${wo}: Lenkpfeil ${pfeil && pfeil.daten.art} bei f″(x₀) = ${w.toFixed(3)}`);
      const bilanz = await text(page, "#kr-bilanz");
      if (Math.abs(w) > 1e-6) pruefe(bilanz.includes(w > 0 ? "Linkskurve" : "Rechtskurve"), `${wo}: Bilanz nennt die Krümmung falsch — „${bilanz}“`);
      // Der Abstand Graph − Tangente bei x₀ ± 0,5, unabhängig nachgerechnet.
      const tt = (s) => f(x0) + abl(f, x0) * (s - x0);
      const zahlenAbstand = bilanz.split("Abstand")[1] || "";
      const [dl, dr] = [...zahlenAbstand.matchAll(/: (−?[\d,]+)/g)].map((m) => zahl(m[1]));
      pruefe(nahe(dl, f(x0 - 0.5) - tt(x0 - 0.5), 2e-4) && nahe(dr, f(x0 + 0.5) - tt(x0 + 0.5), 2e-4), `${wo}: Abstand Graph − Tangente falsch (${dl}, ${dr})`);
    }
  }
}

// ---------- 3. Extremstellen mit f″ ----------
async function extrem2(page) {
  for (let a = -2; a <= 2 + 1e-9; a += 0.25) {
    const aa = await setzeRegler(page, "ex-a", a);
    const wo = `Extremstellen a = ${aa}`;
    const f = (x) => 0.25 * x ** 4 + 0.5 * aa * x * x;
    const D1 = await lies(page, '#ex-mount svg[data-panel="f"]');
    const D2 = await lies(page, '#ex-mount svg[data-panel="a"]');
    pfadAuf(D1, "graph", f, wo);
    pfadAuf(D2, "ableitung", (t) => abl(f, t), `${wo}, f′`);
    punkteGleich(kreise(D1, "extrem"), kritisch(f, -2.2, 2.2).filter((p) => p.typ !== "S"), wo, f);
    const ta = linie(D2, "tangente-a");
    pruefe(ta && nahe(steigung(ta), abl2(f, 0), 1e-3), `${wo}: Tangente an f′ in 0 hat nicht die Steigung f″(0)`);
    const b = await text(page, "#ex-bilanz");
    const typ0 = kritisch(f, -2.2, 2.2).reduce((b, p) => (Math.abs(p.x) < Math.abs(b.x) ? p : b)).typ;
    pruefe(b.includes(typ0 === "H" ? "Hochpunkt H(0 | 0)" : "Tiefpunkt T(0 | 0)"), `${wo}: Bilanz nennt bei 0 nicht ${typ0} — „${b}“`);
    if (Math.abs(aa) < 1e-9) pruefe(/keine Entscheidung/.test(b), `${wo}: Bei f″(0) = 0 fehlt der Hinweis, dass f″ nichts entscheidet`);
  }
}

// ---------- 4. Wendepunkte ----------
async function wendepunkte(page) {
  for (const b of [-1.5, -0.5, 0, 0.5, 0.75, 1, 2.25]) {
    const bb = await setzeRegler(page, "wp-b", b);
    const f = (x) => 0.25 * x ** 3 - 0.75 * x * x + bb * x + 1;
    const ws = wendestellen(f, -1.2, 3.2);
    for (const x of [-1, 0, 1, 2.5]) {
      const x0 = await setzeRegler(page, "wp-x", x);
      const wo = `Wendepunkte b = ${bb}, x₀ = ${x0}`;
      const D1 = await lies(page, '#wp-mount svg[data-panel="f"]');
      const D2 = await lies(page, '#wp-mount svg[data-panel="a"]');
      pfadAuf(D1, "graph", f, wo);
      faerbung(D1, f, wo);
      punkteGleich(kreise(D1, "wende"), ws, wo, f);
      const W = ws[0];
      const wt = linie(D1, "wendetangente");
      pruefe(wt && nahe(steigung(wt), abl(f, W.x), 1e-3) && nahe(aufGerade(wt, W.x), f(W.x), 0.02), `${wo}: Wendetangente falsch`);
      const t = linie(D1, "tangente");
      pruefe(t && nahe(steigung(t), abl(f, x0), 1e-3), `${wo}: Tangente in x₀ falsch`);
      // Der markierte Punkt auf f′ ist dessen Tiefpunkt.
      const m = kreis(D2, "min-ableitung"), f1 = (s) => abl(f, s);
      pruefe(m && nahe(m.x, W.x, 0.01) && nahe(m.y, f1(W.x), 0.02) && f1(W.x - 0.2) > f1(W.x) && f1(W.x + 0.2) > f1(W.x), `${wo}: Tiefpunkt von f′ falsch markiert`);
      const bil = await text(page, "#wp-bilanz");
      pruefe(bil.includes(W.typ === "S" ? "Sattelpunkt S" : "Wendepunkt W"), `${wo}: Bilanz nennt nicht ${W.typ}`);
    }
  }
}

// ---------- 5. Vollständige Funktionsuntersuchung ----------
const SC = {
  kubik: { f: (x) => x ** 3 - 6 * x * x + 9 * x, xs: [-0.75, 4.5] },
  bi: { f: (x) => 0.25 * x ** 4 - 1.5 * x * x, xs: [-3, 3] },
  sattel: { f: (x) => 0.25 * x ** 4 - x ** 3, xs: [-1.5, 4.5] },
};
// Nullstellen von f mit Vielfachheit: Vorzeichenwechsel und Berührstellen (Extremstellen mit f = 0).
function nullstellenMitVielfachheit(f, lo, hi) {
  const z = vzw(f, lo, hi, 3000);
  for (const k of kritisch(f, lo, hi)) if (Math.abs(f(k.x)) < 1e-6 && !z.some((x) => Math.abs(x - k.x) < 1e-3)) z.push(k.x);
  return z.sort((a, b) => a - b).map((x) => ({ x, v: Math.abs(abl(f, x)) > 1e-4 ? 1 : Math.abs(abl2(f, x)) > 1e-3 ? 2 : 3 }));
}
async function schema(page) {
  for (const [art, def] of Object.entries(SC)) {
    await waehle(page, "sc-art", art);
    const f = def.f, [lo, hi] = def.xs;
    for (let s = 1; s <= 8; s++) {
      await setzeRegler(page, "sc-s", s);
      const wo = `Funktionsuntersuchung ${art}, Schritt ${s}`;
      const D = await lies(page, "#sc-mount svg");
      const li = await page.evaluate(() => [...document.querySelectorAll("#sc-liste li")].map((l) => l.className));
      pruefe(li.length === 8 && li.filter((c) => c === "offen").length === 8 - s, `${wo}: Schrittliste ${li.join(",")}`);
      // Symmetrie: Achse nur bei f(−x) = f(x).
      const achse = [0.3, 1.1, 2.2].every((x) => nahe(f(-x), f(x), 1e-9));
      pruefe(!!linie(D, "symmetrie") === achse, `${wo}: Symmetrieachse ${achse ? "fehlt" : "gezeichnet, obwohl keine Symmetrie"}`);
      const pfeile = D.pfade.filter((p) => p.rolle === "pfeil");
      if (s >= 2) {
        for (const p of pfeile) {
          const x = p.daten.seite === "links" ? -1e4 : 1e4;
          pruefe(p.daten.richtung === (f(x) > 0 ? "oben" : "unten"), `${wo}: Pfeil ${p.daten.seite} zeigt nach ${p.daten.richtung}`);
        }
        pruefe(pfeile.length === 2, `${wo}: ${pfeile.length} Randpfeile`);
      } else pruefe(pfeile.length === 0, `${wo}: Randpfeile schon in Schritt 1`);
      const sy = kreis(D, "sy");
      pruefe(s >= 3 ? sy && nahe(sy.x, 0, 0.01) && nahe(sy.y, f(0), 0.02) : !sy, `${wo}: Schnittpunkt mit der y-Achse`);
      const ns = kreise(D, "nullstelle");
      if (s >= 4) {
        const soll = nullstellenMitVielfachheit(f, lo, hi);
        pruefe(ns.length === soll.length, `${wo}: ${ns.length} Nullstellen statt ${soll.length}`);
        ns.sort((a, b) => a.x - b.x).forEach((k, i) => soll[i] && pruefe(nahe(k.x, soll[i].x, 0.01) && Number(k.daten.vielfach) === soll[i].v, `${wo}: Nullstelle ${k.x.toFixed(3)} (${k.daten.vielfach}-fach) statt ${soll[i].x.toFixed(3)} (${soll[i].v}-fach)`));
      } else pruefe(ns.length === 0, `${wo}: Nullstellen zu früh`);
      const ex = kreise(D, "extrem"), we = kreise(D, "wende");
      if (s >= 5) punkteGleich(ex, kritisch(f, lo, hi).filter((p) => p.typ !== "S"), wo + ", Extrempunkte", f); else pruefe(ex.length === 0, `${wo}: Extrempunkte zu früh`);
      if (s >= 6) punkteGleich(we, wendestellen(f, lo, hi), wo + ", Wendepunkte", f); else pruefe(we.length === 0, `${wo}: Wendepunkte zu früh`);
      const baender = D.linien.filter((l) => l.rolle === "band-mono" || l.rolle === "band-kruemm");
      if (s >= 7) {
        pruefe(baender.length > 0, `${wo}: keine Bänder`);
        for (const l of baender) {
          const mitte = (l.x1 + l.x2) / 2;
          const ok = l.rolle === "band-mono" ? l.daten.art === (abl(f, mitte) > 0 ? "steigt" : "faellt") : l.daten.art === (abl2(f, mitte) > 0 ? "links" : "rechts");
          pruefe(ok, `${wo}: Band ${l.rolle} „${l.daten.art}“ bei x = ${mitte.toFixed(2)} falsch`);
        }
        // Die Bänder decken das Bild lückenlos ab.
        for (const r of ["band-mono", "band-kruemm"]) {
          const b = D.linien.filter((l) => l.rolle === r).sort((p, q) => p.x1 - q.x1);
          pruefe(nahe(b[0].x1, lo, 0.01) && nahe(b[b.length - 1].x2, hi, 0.01) && b.every((l, i) => i === 0 || nahe(l.x1, b[i - 1].x2, 1e-3)), `${wo}: Band ${r} lückenhaft`);
        }
      } else pruefe(baender.length === 0, `${wo}: Bänder zu früh`);
      if (s === 8) pfadAuf(D, "graph", f, wo); else pruefe(!D.pfade.some((p) => p.rolle === "graph"), `${wo}: Graph zu früh gezeichnet`);
    }
  }
}

// ---------- 6. Funktion mit Sinus ----------
async function trig(page) {
  const f = (x) => x + 2 * Math.sin(x);
  const ex = kritisch(f, 0.01, 2 * Math.PI - 0.01).filter((p) => p.typ !== "S");
  const ws = wendestellen(f, 0.1, 2 * Math.PI - 0.1);
  for (const k of [0, 3, 8, 12, 16, 20, 24]) {
    await setzeRegler(page, "tr-k", k);
    const x0 = (k * Math.PI) / 12, wo = `Sinus x₀ = ${k}π/12`;
    const D1 = await lies(page, '#tr-mount svg[data-panel="f"]');
    const D2 = await lies(page, '#tr-mount svg[data-panel="a"]');
    pfadAuf(D1, "graph", f, wo);
    faerbung(D1, f, wo);
    pfadAuf(D2, "ableitung", (t) => abl(f, t), `${wo}, f′`);
    punkteGleich(kreise(D1, "extrem"), ex, wo, f);
    punkteGleich(kreise(D1, "wende"), ws, wo, f);
    const t = linie(D1, "tangente");
    pruefe(t && nahe(steigung(t), abl(f, x0), 1e-3), `${wo}: Tangente falsch`);
    const b = await text(page, "#tr-bilanz");
    const m = b.match(/f′\(x₀\) = 1 \+ 2 cos\(x₀\) [=≈] (−?[\d,]+)/);
    pruefe(m && nahe(zahl(m[1]), abl(f, x0), 1e-4), `${wo}: Bilanz f′(x₀) falsch — „${b}“`);
  }
}

// ---------- 7. Globale Extrema ----------
async function global(page) {
  const f = (x) => 0.5 * x ** 3 - 1.5 * x;
  for (const [a, b] of [[-1.5, 2.5], [-3, 3], [-2, 1], [-1, 2], [-0.5, 0.5], [0.5, 3], [2.5, 3], [1, 0]]) {
    const aa = await setzeRegler(page, "gl-a", a);
    await setzeRegler(page, "gl-b", b);
    // Regler lügen nicht: b liegt mindestens 0,5 rechts von a, und der Regler zeigt das.
    const bb = await page.evaluate(() => Number(document.getElementById("gl-b").value));
    const wo = `Globale Extrema [${aa}; ${bb}]`;
    pruefe(bb >= aa + 0.5 - 1e-9 && (b >= aa + 0.5 ? bb === b : nahe(bb, aa + 0.5, 1e-9)), `${wo}: Regler b steht auf ${bb} (gewünscht ${b})`);
    const D = await lies(page, "#gl-mount svg");
    pfadAuf(D, "graph", f, wo);
    const xmax = maxStelle(f, aa, bb), xmin = maxStelle((x) => -f(x), aa, bb);
    const max = f(xmax), min = f(xmin);
    const k = kreise(D, "kandidat");
    const gMax = k.filter((p) => p.daten.global === "max"), gMin = k.filter((p) => p.daten.global === "min");
    pruefe(gMax.length > 0 && gMax.every((p) => nahe(p.y, max, 0.01)), `${wo}: Maximum ${max.toFixed(4)} falsch markiert`);
    pruefe(gMin.length > 0 && gMin.every((p) => nahe(p.y, min, 0.01)), `${wo}: Minimum ${min.toFixed(4)} falsch markiert`);
    // Jede Stelle, an der f den größten Wert annimmt, ist markiert — auch bei Gleichstand.
    for (const p of k) if (nahe(f(p.x), max, 1e-6)) pruefe(p.daten.global === "max", `${wo}: Kandidat ${p.x} erreicht das Maximum, ist aber nicht markiert`);
    for (const p of k) pruefe(p.daten.art === (nahe(p.x, aa, 1e-3) || nahe(p.x, bb, 1e-3) ? "rand" : "innen"), `${wo}: Kandidat ${p.x} als ${p.daten.art} markiert`);
    const bil = await text(page, "#gl-bilanz");
    const mm = bil.match(/Globales Maximum (−?[\d,]+)/), mn = bil.match(/globales Minimum (−?[\d,]+)/);
    pruefe(mm && nahe(zahl(mm[1]), max, 1e-4) && mn && nahe(zahl(mn[1]), min, 1e-4), `${wo}: Bilanz falsch — „${bil}“`);
  }
}

// ---------- 8. Vom Graphen von f′ auf f ----------
const FS = {
  a: { d: (x) => 0.25 * x ** 3 - 0.75 * x + 0.5 },
  b: { d: (x) => -0.5 * x * x + 2 },
};
async function fstrich(page) {
  for (const [art, def] of Object.entries(FS)) {
    await waehle(page, "fs-art", art);
    const g = def.d;
    // Nullstellen von f′ mit Art des Vorzeichenwechsels — numerisch, auch die Berührstelle.
    const nst = [...vzw(g, -3.2, 3.2).map((x) => ({ x, vzw: g(x - 0.05) < 0 ? "-+" : "+-" })),
      ...kritisch(g, -3.2, 3.2).filter((k) => Math.abs(g(k.x)) < 1e-6).map((k) => ({ x: k.x, vzw: "keiner" }))].sort((p, q) => p.x - q.x);
    const extA = kritisch(g, -3.2, 3.2).filter((k) => k.typ !== "S");
    for (const zeigen of [false, true]) {
      await haken(page, "fs-zeige", zeigen);
      for (const x of [-2.5, -2, -1, 0, 1, 2, 2.75]) {
        const x0 = await setzeRegler(page, "fs-x", x);
        const wo = `f′ → f (${art}), x₀ = ${x0}${zeigen ? ", mit f" : ""}`;
        const D1 = await lies(page, '#fs-mount svg[data-panel="a"]');
        pfadAuf(D1, "ableitung", g, wo);
        const nz = kreise(D1, "nullstelle-ableitung").sort((p, q) => p.x - q.x);
        pruefe(nz.length === nst.length && nz.every((k, i) => nahe(k.x, nst[i].x, 0.01) && k.daten.vzw === nst[i].vzw), `${wo}: Nullstellen von f′ falsch markiert`);
        // Typ von f an der Nullstelle von f′: aus dem Vorzeichenwechsel.
        nz.forEach((k, i) => nst[i] && pruefe(k.daten.typ === { "-+": "T", "+-": "H", keiner: "S" }[nst[i].vzw], `${wo}: bei ${k.x} steht ${k.daten.typ}`));
        const ea = kreise(D1, "extrem-ableitung").sort((p, q) => p.x - q.x);
        pruefe(ea.length === extA.length && ea.every((k, i) => nahe(k.x, extA[i].x, 0.01) && k.daten.typ === "W"), `${wo}: Extrempunkte von f′ (Wendestellen von f) falsch`);
        const ta = linie(D1, "tangente-a");
        pruefe(ta && nahe(steigung(ta), abl(g, x0), 1e-3), `${wo}: Tangente an f′ falsch`);
        const D2 = await lies(page, '#fs-mount svg[data-panel="f"]');
        pruefe(!!D2 === zeigen, `${wo}: Graph von f ${zeigen ? "fehlt" : "sichtbar, obwohl nicht gewählt"}`);
        if (D2) {
          // Der gezeichnete Graph von f hat überall die Steigung f′ — aus den Pfadpunkten nachgemessen.
          let schlecht = 0;
          for (const q of D2.pfade.filter((p) => p.rolle === "graph")) for (let i = 1; i < q.punkte.length; i++) {
            const [xa, ya] = q.punkte[i - 1], [xb, yb] = q.punkte[i];
            if (xb - xa < 1e-3) continue;
            if (!nahe((yb - ya) / (xb - xa), g((xa + xb) / 2), 0.08)) schlecht++;
          }
          pruefe(schlecht === 0, `${wo}: Der Graph von f hat an ${schlecht} Stellen nicht die Steigung f′`);
        }
        const b = await text(page, "#fs-bilanz");
        const m = g(x0), w = abl(g, x0);
        if (Math.abs(m) > 1e-9) pruefe(b.includes(m > 0 ? "f steigt" : "f fällt"), `${wo}: Bilanz zur Monotonie falsch — „${b}“`);
        if (Math.abs(w) > 1e-9) pruefe(b.includes(w > 0 ? "Linkskurve" : "Rechtskurve"), `${wo}: Bilanz zur Krümmung falsch — „${b}“`);
      }
    }
  }
  await haken(page, "fs-zeige", false);
}

// ---------- 9. Funktionenscharen ----------
async function scharen(page) {
  const A = [0.25, 0.5, 0.75, 1, 1.25, 1.5];
  // Spur: die Extrempunkte aller Reglerstellungen, numerisch bestimmt.
  const spur = A.flatMap((p) => kritisch((x) => x ** 3 - 3 * p * p * x, -2, 2).map((k) => [k.x, k.x ** 3 - 3 * p * p * k.x]));
  for (const a of A) {
    for (const ort of [true, false]) {
      const aa = await setzeRegler(page, "sa-a", a);
      await haken(page, "sa-ort", ort);
      const wo = `Schar a = ${aa}${ort ? ", mit Ortskurve" : ""}`;
      const f = (x) => x ** 3 - 3 * aa * aa * x;
      const D = await lies(page, "#sa-mount svg");
      pfadAuf(D, "graph", f, wo);
      const ex = kritisch(f, -2.5, 2.5).filter((k) => k.typ !== "S");
      punkteGleich(kreise(D, "extrem"), ex, wo, f);
      punkteGleich(kreise(D, "wende"), wendestellen(f, -2.5, 2.5), wo, f);
      const o = D.pfade.filter((p) => p.rolle === "ortskurve");
      pruefe(ort === o.length > 0, `${wo}: Ortskurve ${ort ? "fehlt" : "sichtbar"}`);
      if (o.length) {
        // Die Ortskurve geht durch Hoch- und Tiefpunkt: nächster Pfadpunkt in x, Höhe vergleichen.
        for (const e of ex) {
          const pts = o.flatMap((p) => p.punkte);
          const naechster = pts.reduce((b, p) => (Math.abs(p[0] - e.x) < Math.abs(b[0] - e.x) ? p : b));
          pruefe(Math.abs(naechster[0] - e.x) < 0.03 && nahe(naechster[1], f(e.x), 0.25), `${wo}: Ortskurve verfehlt ${e.typ}(${e.x.toFixed(3)} | ${f(e.x).toFixed(3)})`);
        }
      }
      const sp = kreise(D, "spur");
      pruefe(sp.length === spur.length && spur.every(([x, y]) => sp.some((k) => nahe(k.x, x, 0.01) && nahe(k.y, y, 0.03))), `${wo}: Spur der Extrempunkte falsch`);
    }
  }
  await haken(page, "sa-ort", true);
}

// ---------- 10. Steckbriefaufgaben ----------
async function steckbrief(page) {
  for (const u of [0.5, 1, 1.5, 2]) for (const v of [0.5, 1, 2, 3]) {
    const uu = await setzeRegler(page, "sb-u", u), vv = await setzeRegler(page, "sb-v", v);
    const wo = `Steckbrief H(${uu} | ${vv})`;
    const D = await lies(page, "#sb-mount svg");
    const pts = D.pfade.filter((p) => p.rolle === "graph").flatMap((p) => p.punkte);
    // Der gezeichnete Graph: punktsymmetrisch, geht durch H, hat dort eine waagerechte Tangente
    // und einen Hochpunkt — alles aus den Pfadpunkten gemessen.
    const yBei = (x) => { let b = pts[0]; for (const p of pts) if (Math.abs(p[0] - x) < Math.abs(b[0] - x)) b = p; return b; };
    const h = yBei(uu), hl = yBei(uu - 0.03), hr = yBei(uu + 0.03);
    pruefe(Math.abs(h[0] - uu) < 0.02 && nahe(h[1], vv, 0.03), `${wo}: Graph geht nicht durch H`);
    pruefe(hl[1] < vv && hr[1] < vv, `${wo}: H ist am Graphen kein Hochpunkt`);
    // Der zentrale Differenzenquotient einer kubischen Funktion weicht um a · h² von f′ ab — bei
    // steilen Graphen (kleines u) ist das spürbar, deshalb die Schranke mit a.
    const aK = vv / (2 * uu ** 3);
    pruefe(nahe((hr[1] - hl[1]) / (hr[0] - hl[0]), 0, 0.05 + aK * 0.002), `${wo}: Tangente in H nicht waagerecht`);
    pruefe(nahe(yBei(-uu)[1], -vv, 0.03), `${wo}: Graph nicht punktsymmetrisch (f(−u) ≠ −v)`);
    const e = kreise(D, "extrem");
    pruefe(e.some((k) => k.daten.typ === "H" && nahe(k.x, uu, 0.01) && nahe(k.y, vv, 0.01)) && e.some((k) => k.daten.typ === "T" && nahe(k.x, -uu, 0.01) && nahe(k.y, -vv, 0.01)), `${wo}: H oder T falsch markiert`);
    // Die Lösung des Gleichungssystems, unabhängig mit der Cramerschen Regel.
    const det = uu ** 3 * 1 - uu * 3 * uu * uu, a = (vv * 1 - uu * 0) / det, c = (uu ** 3 * 0 - vv * 3 * uu * uu) / det;
    const werte = await page.evaluate(() => [...document.querySelectorAll("#sb-bilanz .wc")].map((s) => s.textContent));
    pruefe(werte.length === 2 && nahe(zahl(werte[0]), a, 1e-4) && nahe(zahl(werte[1]), c, 1e-4), `${wo}: Bilanz a, c = ${werte.join(", ")} statt ${a}, ${c}`);
  }
}

// ---------- 11. Extremwertprobleme ----------
async function optimierung(page) {
  const V = (x) => x * (12 - 2 * x) ** 2;
  const xopt = maxStelle(V, 0.001, 5.999);
  for (let x = 0.25; x <= 5.75 + 1e-9; x += 0.5) {
    const xx = await setzeRegler(page, "op-x", x);
    const wo = `Schachtel x = ${xx}`;
    const N = await lies(page, '#op-mount svg:nth-of-type(1)');
    const G = await lies(page, '#op-mount svg:nth-of-type(2)');
    const blatt = N.rechtecke.find((r) => r.rolle === "blatt"), boden = N.rechtecke.find((r) => r.rolle === "boden");
    const aus = N.rechtecke.filter((r) => r.rolle === "ausschnitt");
    pruefe(blatt && nahe(blatt.x2 - blatt.x1, 12, 0.02) && nahe(blatt.y2 - blatt.y1, 12, 0.02), `${wo}: Karton nicht 12 × 12`);
    pruefe(aus.length === 4 && aus.every((r) => nahe(r.x2 - r.x1, xx, 0.02) && nahe(r.y2 - r.y1, xx, 0.02)), `${wo}: Eckquadrate nicht x × x`);
    // Die Ecken liegen wirklich in den Ecken des Kartons.
    pruefe(aus.every((r) => (nahe(r.x1, 0, 0.02) || nahe(r.x2, 12, 0.02)) && (nahe(r.y1, 0, 0.02) || nahe(r.y2, 12, 0.02))), `${wo}: Eckquadrate nicht in den Ecken`);
    const s = boden.x2 - boden.x1;
    pruefe(nahe(s, 12 - 2 * xx, 0.02) && nahe(boden.y2 - boden.y1, s, 0.02), `${wo}: Boden nicht (12 − 2x) × (12 − 2x)`);
    // Volumen aus der Zeichnung: Boden mal Höhe.
    const vZ = s * s * xx;
    const p = kreis(G, "p"), m = kreis(G, "maximum");
    pruefe(p && nahe(p.x, xx, 0.01) && nahe(p.y, vZ, 1.5), `${wo}: Punkt auf dem Volumengraphen (${p && p.y}) passt nicht zur Schachtel (${vZ})`);
    pruefe(m && nahe(m.x, xopt, 0.01) && nahe(m.y, V(xopt), 1), `${wo}: Maximum falsch markiert`);
    pfadAuf(G, "graph", V, wo);
    pruefe(nahe(await spanWert(page, "#op-bilanz .wa"), V(xx), 1e-3), `${wo}: Bilanz-Volumen falsch`);
  }
}

// ---------- 12. Newton-Verfahren ----------
async function newton(page) {
  const f = (x) => x ** 3 - 2 * x - 5;
  for (const x0 of [-2, -1, 0.75, 1, 2, 3, 4]) for (const n of [0, 1, 3, 5]) {
    const xx = await setzeRegler(page, "nw-x", x0), nn = await setzeRegler(page, "nw-n", n);
    const wo = `Newton x₀ = ${xx}, n = ${nn}`;
    // Die Folge, unabhängig: Tangente mit numerischer Ableitung schneiden.
    const xs = [xx];
    for (let k = 0; k < nn; k++) xs.push(xs[k] - f(xs[k]) / abl(f, xs[k]));
    const D = await lies(page, "#nw-mount svg");
    const nae = kreise(D, "naeherung").sort((p, q) => Number(p.daten.k) - Number(q.daten.k));
    pruefe(nae.length === xs.length, `${wo}: ${nae.length} Näherungen statt ${xs.length}`);
    nae.forEach((k, i) => pruefe(nahe(k.x, xs[i], 1e-3 * (1 + Math.abs(xs[i]))) && nahe(k.y, 0, 0.05), `${wo}: x${i} bei ${k.x} statt ${xs[i]}`));
    const tg = linien(D, "newton-tangente").sort((p, q) => Number(p.daten.k) - Number(q.daten.k));
    pruefe(tg.length === nn, `${wo}: ${tg.length} Tangenten statt ${nn}`);
    tg.forEach((l, k) => {
      pruefe(nahe(steigung(l), abl(f, xs[k]), 1e-3 * (1 + Math.abs(abl(f, xs[k])))), `${wo}: Tangente ${k} hat die falsche Steigung`);
      // Die Tangente schneidet die x-Achse beim nächsten Wert.
      pruefe(nahe(l.x1 - l.y1 / steigung(l), xs[k + 1], 1e-3 * (1 + Math.abs(xs[k + 1]))), `${wo}: Tangente ${k} schneidet die x-Achse nicht bei x${k + 1}`);
    });
    const zellen = await page.evaluate(() => [...document.querySelectorAll("#nw-tabelle tr")].slice(1).map((r) => [...r.cells].map((c) => c.textContent)));
    pruefe(zellen.length === xs.length && zellen.every((z, i) => nahe(zahl(z[1]), xs[i], 2e-6 * (1 + Math.abs(xs[i]))) && nahe(zahl(z[2]), f(xs[i]), 2e-6 * (1 + Math.abs(f(xs[i]))))), `${wo}: Tabelle falsch`);
  }
}

// ---------- 13. Stolperstelle ----------
async function stolperstelle(page) {
  for (let k = -2; k <= 2 + 1e-9; k += 0.25) {
    const kk = await setzeRegler(page, "st-k", k);
    const wo = `Stolperstelle k = ${kk}`;
    const f = (x) => 0.25 * x ** 4 + (kk / 3) * x ** 3;
    const D1 = await lies(page, '#st-mount svg[data-panel="f"]');
    const D2 = await lies(page, '#st-mount svg[data-panel="a2"]');
    pfadAuf(D1, "graph", f, wo);
    faerbung(D1, f, wo);
    pfadAuf(D2, "ableitung2", (x) => abl2(f, x), `${wo}, f″`);
    // Wendestellen nur dort, wo f″ das Vorzeichen wechselt — bei k = 0 also keine.
    punkteGleich(kreise(D1, "wende"), wendestellen(f, -2.5, 2.5), wo, f);
    punkteGleich(kreise(D1, "extrem"), kritisch(f, -2.5, 2.5).filter((p) => p.typ !== "S"), wo, f);
    const n2 = kreise(D2, "nullstelle-f2");
    const ws = wendestellen(f, -2.5, 2.5);
    if (ws.length) pruefe(n2.length === ws.length && n2.every((p) => p.daten.vzw === "ja"), `${wo}: Nullstellen von f″ falsch markiert`);
    else pruefe(n2.length === 1 && n2[0].daten.vzw === "keiner" && nahe(abl2(f, n2[0].x), 0, 1e-4), `${wo}: doppelte Nullstelle von f″ nicht als „ohne Vorzeichenwechsel“ markiert`);
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
  await page.locator("#se-liste .se-zeile").nth(3).locator("button").nth(2).click();
  const aus = await page.evaluate(() => document.getElementById("se-auswertung").innerHTML);
  pruefe(/href="#sec-wendepunkte"/.test(aus), `Selbsteinschätzung: kein Verweis zurück zu den Wendepunkten — „${aus}“`);
  await page.evaluate(() => localStorage.clear());
}

// ---------- Übungsaufgaben ----------
const T = 0.0001;
const Z = "(−?[\\d,]+)";
// Ableitung eines Polynoms über seine Koeffizienten — die Prüfung leitet selbst ab.
const polyAbl = (k) => Object.fromEntries(Object.entries(k).filter(([e]) => Number(e) > 0).map(([e, c]) => [Number(e) - 1, c * Number(e)]));
// Gauß-Verfahren für ein kleines lineares Gleichungssystem (Zeilen [Koeffizienten …, rechte Seite]).
function gauss(z) {
  const n = z.length, m = z.map((r) => r.slice());
  for (let i = 0; i < n; i++) {
    let p = i;
    for (let r = i + 1; r < n; r++) if (Math.abs(m[r][i]) > Math.abs(m[p][i])) p = r;
    [m[i], m[p]] = [m[p], m[i]];
    for (let r = 0; r < n; r++) if (r !== i) { const q = m[r][i] / m[i][i]; for (let s = i; s <= n; s++) m[r][s] -= q * m[i][s]; }
  }
  return m.map((r, i) => r[n] / r[i]);
}
// Gemessen mit UPLANT_ZUEGE=25 tests/werkzeug-streuung.js (200 Würfe je Aufgabe, 10⁻⁴-Quantil für 0,8 · n):
//   UPLANT_ZUEGE=25 node tests/werkzeug-streuung.js /mathematik/mss11/01-analysis/04-funktionsuntersuchung/index.html
const SCHRANKE = {1: 21, 2: 20, 3: 20, 4: 14, 5: 15, 6: 19, 7: 20, 8: 19, 9: 14, 10: 9, 11: 10, 12: 10, 13: 9, 14: 7, 15: 8, 16: 15, 17: 9, 18: 17, 19: 15, 20: 10};

async function aufgaben(page) {
  const r = 25;
  const A = (nr, name, deute) => pruefeAufgabe(page, bericht, { nr, name, runden: r, mindestensVerschieden: SCHRANKE[nr] ?? 5, deute });
  await A(1, "A1 f″ an einer Stelle", (q) => {
    const m = q.match(new RegExp(`f\\(x\\) = (.+?)\\. Berechne f″\\(${Z}\\)\\.`));
    if (!m) return null;
    const k = liesPoly(m[1]), x0 = zahl(m[2]);
    const [f, f1, f2, f3] = [k, polyAbl(k), polyAbl(polyAbl(k)), polyAbl(polyAbl(polyAbl(k)))].map(polyFn);
    return { richtig: f2(x0), toleranz: T, falsch: [[f1(x0), "nur einmal abgeleitet"], [f3(x0), "einmal zu oft"], [f(x0), "Funktionswert"]] };
  });
  await A(2, "A2 Wendestelle", (q) => {
    const m = q.match(/f\(x\) = (.+?)\. Bestimme die Wendestelle xW\./);
    if (!m) return null;
    const f = polyFn(liesPoly(m[1]));
    const w = wendestellen(f, -10, 10);
    pruefe(w.length === 1, `A2: ${w.length} Wendestellen gefunden`);
    const xw = w[0].x;
    return { richtig: xw, toleranz: T, falsch: [[f(xw), "y-Koordinate"], [Math.abs(xw) < 1e-9 ? NaN : -xw, "Vorzeichen"], [Math.abs(xw) < 1e-9 ? NaN : 3 * xw, "Faktor 3"]] };
  });
  await A(3, "A3 Hochstelle", (q) => {
    const m = q.match(/f\(x\) = (.+?)\. Bestimme die Stelle xH des Hochpunkts\./);
    if (!m) return null;
    const f = polyFn(liesPoly(m[1]));
    const k = kritisch(f, -10, 10), H = k.find((p) => p.typ === "H"), Tt = k.find((p) => p.typ === "T");
    if (!H || !Tt) return null;
    return { richtig: H.x, toleranz: T, falsch: [[Tt.x, "Tiefpunkt"], [(H.x + Tt.x) / 2, "Wendestelle"], [f(H.x), "y-Koordinate"]] };
  });
  await A(4, "A4 Newton-Schritt", (q) => {
    const m = q.match(new RegExp(`von f\\(x\\) = (.+?) mit dem Newton-Verfahren\\. Berechne x₁ zum Startwert x₀ = ${Z}\\.`));
    if (!m) return null;
    const f = polyFn(liesPoly(m[1])), x0 = zahl(m[2]);
    const y = f(x0), d = abl(f, x0);
    return { richtig: x0 - y / d, toleranz: T, falsch: [[x0 + y / d, "Vorzeichen"], [x0 - d / y, "vertauscht"], [-y / d, "nur die Korrektur"]] };
  });
  await A(5, "A5 globales Maximum", (q) => {
    const m = q.match(new RegExp(`f\\(x\\) = (.+?) auf dem Intervall \\[${Z}; ${Z}\\]\\. Bestimme den größten Funktionswert`));
    if (!m) return null;
    const f = polyFn(liesPoly(m[1])), l = zahl(m[2]), rr = zahl(m[3]);
    const max = f(maxStelle(f, l, rr)), min = f(maxStelle((x) => -f(x), l, rr));
    const H = kritisch(f, l + 1e-6, rr - 1e-6).find((p) => p.typ === "H");
    const hoch = H && !nahe(f(H.x), max, 1e-6) ? f(H.x) : NaN;
    const randKlein = Math.min(f(l), f(rr));
    return { richtig: max, toleranz: T, falsch: [[hoch, "Hochpunkt"], [min, "globale Minimum"], [nahe(randKlein, min, 1e-6) ? NaN : randKlein, "Randwert, aber nicht der größte"]] };
  });
  await A(6, "A6 Wendepunkt", (q) => {
    const m = q.match(/f\(x\) = (.+?)\. Bestimme den Wendepunkt W\(xW \| yW\)\./);
    if (!m) return null;
    const f = polyFn(liesPoly(m[1]));
    const xw = wendestellen(f, -10, 10)[0].x;
    const null0 = Math.abs(xw) < 1e-9;
    return { felder: [xw, f(xw)], toleranz: T, falschFelder: [[0, null0 ? NaN : -xw, "Vorzeichen"], [1, abl(f, xw), "Steigung der Wendetangente"], [1, null0 ? NaN : f(-xw), "Eingesetzt wurde"]] };
  });
  await A(7, "A7 Hoch- und Tiefpunkt", (q) => {
    const m = q.match(/f\(x\) = (.+?)\. Bestimme den Hochpunkt/);
    if (!m) return null;
    const f = polyFn(liesPoly(m[1]));
    const k = kritisch(f, -10, 10), H = k.find((p) => p.typ === "H"), Tt = k.find((p) => p.typ === "T");
    if (!H || !Tt) return null;
    return { felder: [H.x, f(H.x), Tt.x, f(Tt.x)], toleranz: T, falschFelder: [[0, Tt.x, "vertauscht"], [1, f(Tt.x), "vertauscht"], [2, H.x, "vertauscht"], [3, f(H.x), "vertauscht"]] };
  });
  await A(8, "A8 Wendetangente", (q) => {
    const m = q.match(/f\(x\) = (.+?)\. Bestimme die Gleichung der Wendetangente/);
    if (!m) return null;
    const f = polyFn(liesPoly(m[1]));
    const xw = wendestellen(f, -10, 10)[0].x, yw = f(xw), mm = abl(f, xw), b = yw - mm * xw;
    const ohne = Math.abs(xw) < 1e-9 || Math.abs(mm) < 1e-9;
    return { felder: [mm, b], toleranz: T, falschFelder: [[0, yw, "Höhe des Wendepunkts"], [1, yw, "nicht der Achsenabschnitt"], [1, ohne ? NaN : yw + mm * xw, "Vorzeichen"]] };
  });
  await A(9, "A9 Sattelpunkt", (q) => {
    const m = q.match(new RegExp(`f\\(x\\) = (.+?) \\+ k · x(?: ([+−]) ([\\d,]+))?\\. Für welchen Wert von k`));
    if (!m) return null;
    const g = polyFn(liesPoly(m[1]));
    // k verschiebt nur f′, nicht f″: Die Wendestelle hängt nicht von k ab. Dort muss f′ = 0 sein.
    const xs = wendestellen(g, -10, 10)[0].x, k = -abl(g, xs);
    return { felder: [k, xs], toleranz: T, falschFelder: [[0, -k, "Vorzeichen"], [0, Math.abs(xs) < 1e-9 ? NaN : 0, "Faktor 2 fehlt"], [1, Math.abs(xs) < 1e-9 ? NaN : -xs, "Vorzeichen"]] };
  });
  await A(10, "A10 Sinus und Kosinus", (q) => {
    const m = q.match(/f\(x\) = (−?[\d,]*)x ([+−]) ([\d,]+ )?(sin|cos)\(x\) auf dem Intervall \[0; 2π\]/);
    if (!m) return null;
    const s = m[1] === "" ? 1 : m[1] === "−" ? -1 : zahl(m[1]);
    const c = (m[2] === "−" ? -1 : 1) * (m[3] ? zahl(m[3]) : 1);
    const tr = m[4] === "sin" ? Math.sin : Math.cos;
    const f = (x) => s * x + c * tr(x);
    const k = kritisch(f, 1e-4, 2 * Math.PI - 1e-4), H = k.find((p) => p.typ === "H"), Tt = k.find((p) => p.typ === "T");
    if (!H || !Tt) return null;
    const h = H.x / Math.PI, t = Tt.x / Math.PI;
    return { felder: [h, t], toleranz: T, falschFelder: [[0, t, "vertauscht"], [0, h * 180, "Winkel in Grad"], [1, h, "vertauscht"], [1, t * 180, "Winkel in Grad"]] };
  });
  await A(11, "A11 Scharparameter", (q) => {
    const m = q.match(new RegExp(`fa\\(x\\) = (.+?) − ([\\d,]+)a² · x mit a > 0\\. Für welchen Wert von a hat der Tiefpunkt von fa die y-Koordinate ${Z}\\?`));
    if (!m) return null;
    const k = liesPoly(m[1])[3], K3 = zahl(m[2]), y = zahl(m[3]);
    // y-Koordinate des Tiefpunkts als Funktion von a, numerisch; dann a per Bisektion.
    const yT = (a) => { const f = (x) => k * x ** 3 - K3 * a * a * x; const t = kritisch(f, 0, 5 * a + 1).find((p) => p.typ === "T"); return f(t.x); };
    let lo = 0.05, hi = 6;
    for (let i = 0; i < 50; i++) { const mid = (lo + hi) / 2; if (yT(mid) > y) lo = mid; else hi = mid; }
    const a = (lo + hi) / 2;
    const eins = Math.abs(a - 1) < 1e-6;
    return { richtig: a, toleranz: T, falsch: [[eins ? NaN : a ** 3, "dritte Wurzel"], [eins ? NaN : Math.sqrt(a ** 3), "Quadratwurzel"]] };
  });
  await A(12, "A12 punktsymmetrischer Steckbrief", (q) => {
    const m = q.match(new RegExp(`im Punkt P\\(${Z} \\| ${Z}\\) einen (Hochpunkt|Tiefpunkt)\\. Bestimme f\\(x\\) = ax³ \\+ cx\\.`));
    if (!m) return null;
    const u = zahl(m[1]), v = zahl(m[2]);
    const [a, c] = gauss([[u ** 3, u, v], [3 * u * u, 1, 0]]);
    pruefe((6 * a * u < 0) === (m[3] === "Hochpunkt"), `A12: Die Lösung hat bei P keinen ${m[3]}`);
    return { felder: [a, c], toleranz: T, falschFelder: [[0, -a, "Vorzeichen"], [1, -c, "Vorzeichen"], [1, v / u, "nur f(u) = v"]] };
  });
  await A(13, "A13 Schachtel", (q) => {
    const m = q.match(new RegExp(`Karton mit ${Z} cm × ${Z} cm`));
    if (!m) return null;
    const a = zahl(m[1]), b = zahl(m[2]);
    const V = (x) => x * (a - 2 * x) * (b - 2 * x);
    const x = maxStelle(V, 1e-6, Math.min(a, b) / 2 - 1e-6);
    const x2 = vzw((t) => abl(V, t), Math.min(a, b) / 2, Math.max(a, b))[0];
    return { felder: [x, V(x)], toleranz: T, falschFelder: [[0, x2, "zweite Nullstelle"], [1, x * (a - x) * (b - x), "an beiden Enden"]] };
  });
  await A(14, "A14 Rechteck unter der Parabel", (q) => {
    const m = q.match(new RegExp(`f\\(x\\) = ${Z} − ([\\d,]*)x² liegt`));
    if (!m) return null;
    const h = zahl(m[1]), qq = m[2] ? zahl(m[2]) : 1;
    const A_ = (u) => 2 * u * (h - qq * u * u);
    const u = maxStelle(A_, 1e-6, Math.sqrt(h / qq));
    return { felder: [u, A_(u)], toleranz: T, falschFelder: [[0, Math.sqrt(h / qq), "Nullstelle der Parabel"], [1, A_(u) / 2, "halbe Fläche"]] };
  });
  await A(15, "A15 stärkstes Wachstum", (q) => {
    const m = q.match(new RegExp(`für 0 ≤ t ≤ ${Z} durch h\\(t\\) = (.+?) beschrieben`));
    if (!m) return null;
    const k = liesPoly(m[2], "t"), ende = zahl(m[1]);
    const h = polyFn(k), h1 = polyFn(polyAbl(k)), h2 = polyFn(polyAbl(polyAbl(k)));
    // Am schnellsten wächst h, wo h″ das Vorzeichen wechselt. Abgeleitet wird über die
    // Koeffizienten: Bei Höhen um 250 cm wäre die numerische zweite Ableitung zu verrauscht.
    const tw = vzw(h2, 0, ende)[0];
    pruefe(h1(tw) >= h1(tw - 0.1) && h1(tw) >= h1(tw + 0.1), "A15: An der Wendestelle ist h′ nicht am größten");
    return { felder: [tw, h1(tw)], toleranz: T, falschFelder: [[0, ende, "am höchsten"], [1, h(tw), "Höhe h(t)"]] };
  });
  await A(16, "A16 Steckbrief mit vier Bedingungen", (q) => {
    const m = q.match(new RegExp(`hat den (Hochpunkt|Tiefpunkt) E\\(0 \\| ${Z}\\) und den Wendepunkt W\\(${Z} \\| ${Z}\\)\\.`));
    if (!m) return null;
    const h = zahl(m[2]), w = zahl(m[3]), yw = zahl(m[4]);
    const [a, b, c, d] = gauss([[0, 0, 0, 1, h], [0, 0, 1, 0, 0], [6 * w, 2, 0, 0, 0], [w ** 3, w * w, w, 1, yw]]);
    pruefe((2 * b < 0) === (m[1] === "Hochpunkt"), `A16: Die Lösung hat bei E keinen ${m[1]}`);
    return { felder: [a, b, c, d], toleranz: T, falschFelder: [[0, -a, "Vorzeichen"], [1, -b, "Vorzeichen"]] };
  });
  await A(17, "A17 biquadratisch", (q) => {
    const m = q.match(/f\(x\) = (.+?)\. Bestimme den Wendepunkt mit positiver x-Koordinate/);
    if (!m) return null;
    const f = polyFn(liesPoly(m[1]));
    const xw = wendestellen(f, 1e-3, 20)[0].x, mm = abl(f, xw);
    return { felder: [xw, f(xw), mm], toleranz: T, falschFelder: [[0, Math.abs(xw - 1) < 1e-9 ? NaN : xw * xw, "Wurzel"], [1, -f(xw), "Vorzeichen"], [2, -mm, "Vorzeichen"]] };
  });
  await A(18, "A18 Gewinn bei begrenzter Kapazität", (q) => {
    const m = q.match(new RegExp(`höchstens ${Z} Tonnen.*G\\(x\\) = (.+?) \\(in Tausend Euro\\)`));
    if (!m) return null;
    const K = zahl(m[1]), G = polyFn(liesPoly(m[2]));
    const xo = maxStelle(G, 0, K);
    const H = kritisch(G, 1e-3, 50).find((p) => p.typ === "H");
    const rand = nahe(xo, K, 1e-6);
    const fix = [1, G(xo) - G(0), "Fixkosten"];
    return { felder: [xo, G(xo)], toleranz: T, falschFelder: rand
      ? [[0, H.x, "lokale Maximum"], fix, [1, G(H.x), "außerhalb der Kapazität"]]
      : [[0, K, "Am Rand"], fix, [1, G(K), "Gewinn am Rand"]] };
  });
  await A(19, "A19 zwei Newton-Schritte", (q) => {
    const m = q.match(new RegExp(`von f\\(x\\) = (.+?)\\. Berechne mit dem Newton-Verfahren x₁ und x₂ zum Startwert x₀ = ${Z}\\.`));
    if (!m) return null;
    const f = polyFn(liesPoly(m[1])), x0 = zahl(m[2]);
    const x1 = x0 - f(x0) / abl(f, x0), x2 = x1 - f(x1) / abl(f, x1);
    return { felder: [x1, x2], toleranz: T, falschFelder: [[0, x0 + f(x0) / abl(f, x0), "Vorzeichen"], [1, x1 + f(x1) / abl(f, x1), "Vorzeichen"], [1, x1, "es fehlt noch ein Schritt"]] };
  });
  await A(20, "A20 Ortskurve der Wendepunkte", (q) => {
    const m = q.match(new RegExp(`fa\\(x\\) = (.+?) − 3a · x² \\(a ≠ 0\\)\\. Bestimme für a = ${Z} den Wendepunkt`));
    if (!m) return null;
    const k = liesPoly(m[1])[3], a = zahl(m[2]);
    const W = (p) => { const f = (x) => k * x ** 3 - 3 * p * x * x; const x = wendestellen(f, -20, 20)[0].x; return [x, f(x)]; };
    const [xw, yw] = W(a);
    // Die Ortskurve aus zwei weiteren Scharmitgliedern: y/x³ muss für alle gleich sein.
    const [x1, y1] = W(1), [x2, y2] = W(2);
    const c = y1 / x1 ** 3;
    pruefe(nahe(y2 / x2 ** 3, c, 1e-6) && nahe(yw / xw ** 3, c, 1e-6), "A20: Die Wendepunkte liegen nicht auf einer Kurve y = c · x³");
    const eins = Math.abs(Math.abs(k) - 1) < 1e-9;
    return { felder: [xw, yw, c], toleranz: T, falschFelder: [[0, eins ? NaN : a * k, "nicht a"], [1, -yw, "Vorzeichen"], [2, eins ? NaN : -2, "Der Faktor k"], [2, -c, "Vorzeichen"]] };
  });
}

(async () => {
  const browser = await starteBrowser();
  for (const dunkel of [false, true]) {
    const wo = dunkel ? "dunkel" : "hell";
    const page = await neueSeite(browser, { dunkel });
    await oeffne(page, SEITE);
    if (!dunkel) {
      await geruest(page);
      await hoehere(page);
      await kruemmung(page);
      await extrem2(page);
      await wendepunkte(page);
      await schema(page);
      await trig(page);
      await global(page);
      await fstrich(page);
      await scharen(page);
      await steckbrief(page);
      await optimierung(page);
      await newton(page);
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
