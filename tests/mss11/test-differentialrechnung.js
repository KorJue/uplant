// Fachliche Prüfung: MSS 11, Analysis, Thema 3 „Differentialrechnung“.
//
// Geprüft wird, was die Seite zeigt, gegen eine unabhängige Rechnung. Die Ableitungen rechnet die
// Prüfung NICHT mit den Formeln der Seite, sondern numerisch als zentralen Differenzenquotienten der
// hier noch einmal aufgeschriebenen Funktionen — eine falsch hergeleitete Formel fiele so auf.
//
//   * Gerüst: Abschnittsfolge, Wegweiser mit beiden Büchern, Schreibweisen, Verweise, Menükarte,
//     kein Logarithmus (der kommt erst in Thema 4), Formelsammlung vorhanden;
//   * jede Zeichnung wird aus dem SVG zurückgelesen (Maßstab aus den Gitterlinien mit data-wert):
//     Sekanten- und Tangentensteigungen, Punkte, Steigungsdreiecke, Flächen der Rechtecke, Kreis,
//     Bögen, Winkel, Drehungen (starr, Punkt für Punkt nachgerechnet), Nullstellenmarken;
//   * jede Bilanz wird gegen die unabhängige Rechnung gelesen, ebenso die Urteile
//     (differenzierbar, symmetrisch, Hoch-/Tief-/Sattelpunkt, Monotonie-Intervalle);
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
const SEITE = "/mathematik/mss11/01-analysis/03-differentialrechnung/index.html";
const WURZEL = path.resolve(__dirname, "..", "..");
const nahe = (a, b, tol = 1e-6) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= tol;
// Zentrale Differenz: die Ableitung, ohne eine Ableitungsregel zu benutzen.
const ableitung = (f, x, h = 1e-6) => (f(x + h) - f(x - h)) / (2 * h);
const GRAD = 180 / Math.PI;

async function waehle(page, id, wert) {
  await page.selectOption("#" + id, wert);
}
async function haken(page, id, an) {
  await page.setChecked("#" + id, an);
}
// Der Text eines Elements, Brüche als „z/n“ — sonst stünden Zähler und Nenner ununterscheidbar
// hintereinander.
async function klartext(page, sel) {
  return page.evaluate((s) => {
    const e = document.querySelector(s);
    if (!e) return "";
    const k = e.cloneNode(true);
    k.querySelectorAll(".bruch").forEach((b) => {
      const z = b.querySelector(".z"), n = b.querySelector(".n");
      b.replaceWith(`${z ? z.textContent : ""}/${n ? n.textContent : ""}`);
    });
    return k.textContent.replace(/\s+/g, " ").trim();
  }, sel);
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
      pfade: [...svg.querySelectorAll("path[data-rolle]")].map((p) => ({ rolle: p.dataset.rolle, teil: p.dataset.teil, daten: { ...p.dataset }, punkte: paare(p.getAttribute("d")).map(([a, b]) => [X(a), Y(b)]), px: paare(p.getAttribute("d")) })),
      kreise: [...svg.querySelectorAll("circle")].map((c) => ({ x: X(n(c, "cx")), y: Y(n(c, "cy")), r: n(c, "r") / SX.pro, rpx: n(c, "r"), klasse: c.getAttribute("class") || "", daten: { ...c.dataset } })),
      linien: [...svg.querySelectorAll("line[data-rolle]")].map((l) => ({ rolle: l.dataset.rolle, klasse: l.getAttribute("class") || "", daten: { ...l.dataset }, x1: X(n(l, "x1")), y1: Y(n(l, "y1")), x2: X(n(l, "x2")), y2: Y(n(l, "y2")) })),
      vielecke: [...svg.querySelectorAll("polygon[data-rolle]")].map((p) => ({ rolle: p.dataset.rolle, daten: { ...p.dataset }, punkte: p.getAttribute("points").trim().split(/\s+/).map((t) => { const [a, b] = t.split(",").map(Number); return [X(a), Y(b)]; }) })),
      rechtecke: [...svg.querySelectorAll("rect[data-rolle]")].map((r) => ({ rolle: r.dataset.rolle, x1: X(n(r, "x")), x2: X(n(r, "x") + n(r, "width")), y1: Y(n(r, "y") + n(r, "height")), y2: Y(n(r, "y")) })),
    };
  }, sel);
}
const linie = (d, rolle) => d.linien.find((l) => l.rolle === rolle);
const kreis = (d, rolle) => d.kreise.find((k) => k.daten.rolle === rolle);
const steigung = (l) => (l.y2 - l.y1) / (l.x2 - l.x1);
const rechteckFl = (r) => Math.abs((r.x2 - r.x1) * (r.y2 - r.y1));

// Eine Gerade „m x + b“ aus dem Klartext: „2x − 1“, „−x + 2“, „−1/2x + 1,5“, „0,2x − 7,6“, „3“.
function liesGerade(s) {
  const t = s.replace(/−/g, "-").replace(/\s+/g, "");
  let m = t.match(/^(-?)(\d+)\/(\d+)x([+-][\d,]+)?$/);
  if (m) return { m: (m[1] ? -1 : 1) * Number(m[2]) / Number(m[3]), b: m[4] ? zahl(m[4]) : 0 };
  m = t.match(/^(-?[\d,]*)x([+-][\d,]+)?$/);
  if (m) return { m: m[1] === "" ? 1 : m[1] === "-" ? -1 : zahl(m[1]), b: m[2] ? zahl(m[2]) : 0 };
  m = t.match(/^(-?[\d,]+)$/);
  if (m) return { m: 0, b: zahl(m[1]) };
  return null;
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
const ABSCHNITTE = ["sec-mittlere", "sec-lokal", "sec-ableitung", "sec-grafisch", "sec-potenz", "sec-regeln", "sec-sinus", "sec-produkt-kette",
  "sec-tangente", "sec-differenzierbar", "sec-ganzrational", "sec-nullstellen", "sec-monotonie", "sec-stolperstelle"];
async function geruest(page) {
  const folge = await page.evaluate(() => [...document.querySelectorAll("main section[id]")].map((s) => s.id));
  const soll = [...ABSCHNITTE, "sec-selbsteinschaetzung", "sec-vernetzung", "sec-formelsammlung", "sec-uebungen"];
  pruefe(JSON.stringify(folge) === JSON.stringify(soll), `Gerüst: Abschnitte ${folge.join(", ")} statt ${soll.join(", ")}`);
  // Die Nummern in den Überschriften laufen durch, und der Wegweiser führt dieselben Nummern.
  const titel = await page.evaluate((ids) => ids.map((id) => document.querySelector(`#${id} h2`).textContent), ABSCHNITTE);
  titel.forEach((t, i) => pruefe(t.startsWith(`${i + 1}. `), `Gerüst: Überschrift „${t}“ trägt nicht die Nummer ${i + 1}`));
  const weg = await page.evaluate(() => [...document.querySelectorAll("#wegweiser tbody tr")].map((r) => [...r.cells].map((c) => c.textContent.trim())));
  pruefe(weg.length === 13, `Wegweiser: ${weg.length} Zeilen statt 13`);
  weg.forEach((z, i) => pruefe(z[0].startsWith(`${i + 1} `) && z.length === 3, `Wegweiser: Zeile ${i + 1} „${z.join(" | ")}“`));
  const wegText = await text(page, "#wegweiser");
  pruefe(/Elemente der Mathematik/.test(wegText) && /Fundamente der Mathematik/.test(wegText), "Wegweiser: nicht beide Lehrwerke genannt");
  pruefe(fs.existsSync(path.join(WURZEL, path.dirname(SEITE), "formelsammlung.pdf")), "Formelsammlung: formelsammlung.pdf fehlt");
  const notation = await page.evaluate(() => [...document.querySelectorAll(".notation-box")].map((b) => b.innerText).join(" "));
  pruefe(/Leibniz/.test(notation) && /tan⁻¹/.test(notation) && /arctan/.test(notation), "Gerüst: Der Kasten mit den Schreibweisen ist unvollständig");
  const links = await page.evaluate(() =>
    [...document.querySelectorAll("main a[href]")].map((a) => a.getAttribute("href")).filter((h) => !h.startsWith("#") && !h.startsWith("http")));
  for (const href of new Set(links)) {
    const ziel = new URL(href.split("#")[0], "http://localhost" + SEITE).pathname;
    const antwort = await page.request.get("http://localhost:" + (process.env.UPLANT_PORT || "8936") + ziel);
    pruefe(antwort.ok(), `Gerüst: der Verweis „${href}“ führt ins Leere (${antwort.status()})`);
    const anker = href.split("#")[1];
    if (anker) pruefe((await antwort.text()).includes(`id="${anker}"`), `Gerüst: Sprungmarke „${anker}“ fehlt in ${ziel}`);
  }
  const haupt = await page.evaluate(() => document.querySelector("main").innerText);
  pruefe(!/\bln\s*\(|\blog\b|\blg\b|Logarithmus/.test(haupt.replace(/Exponential- und Logarithmusfunktionen/g, "")), "Gerüst: Die Seite benutzt einen Logarithmus, der erst in Thema 4 kommt");
  const menue = fs.readFileSync(path.join(WURZEL, "mathematik/mss11/01-analysis/index.html"), "utf-8");
  pruefe(/data-section="mss11" href="03-differentialrechnung\/index.html" hidden/.test(menue), "Menü: Karte für die Differentialrechnung fehlt oder ist nicht mit data-section/hidden versehen");
}

// ---------- 1. Mittlere Änderungsrate ----------
const MR = {
  fall: { f: (t) => 5 * t * t, lo: 0, hi: 4, spanne: 85 },
  para: { f: (x) => x * x, lo: -2, hi: 3, spanne: 10.5 },
  kubik: { f: (x) => 0.5 * x ** 3 - 1.5 * x, lo: -2.5, hi: 2.5, spanne: 9 },
};
async function mittlere(page) {
  for (const [art, def] of Object.entries(MR)) {
    await waehle(page, "mr-art", art);
    for (let a = def.lo; a <= def.hi - 0.5; a += 1) {
      for (const db of [0.5, 1.5, 3]) {
        const A = await setzeRegler(page, "mr-a", a);
        const B = await setzeRegler(page, "mr-b", Math.min(def.hi, A + db));
        const wo = `mittlere Änderungsrate ${art}, [${A}; ${B}]`;
        pruefe(B >= A + 0.5 - 1e-9 && B <= def.hi + 1e-9, `${wo}: b liegt nicht rechts von a`);
        const fa = def.f(A), fb = def.f(B), m = (fb - fa) / (B - A);
        const d = await lies(page, "#mr-mount svg");
        const tol = 0.004 * def.spanne;
        const pa = kreis(d, "punkt-a"), pb = kreis(d, "punkt-b");
        pruefe(pa && nahe(pa.x, A, 0.01) && nahe(pa.y, fa, tol), `${wo}: A liegt nicht bei (${A} | ${fa})`);
        pruefe(pb && nahe(pb.x, B, 0.01) && nahe(pb.y, fb, tol), `${wo}: B liegt nicht bei (${B} | ${fb})`);
        const s = linie(d, "sekante");
        pruefe(s && nahe(steigung(s), m, 0.01 * (1 + Math.abs(m))), `${wo}: Sekantensteigung ${s && steigung(s)} statt ${m}`);
        const dy = linie(d, "dy"), dx = linie(d, "dx");
        pruefe(dy && nahe(dy.y2 - dy.y1, fb - fa, tol) && nahe(dy.x1, B, 0.01), `${wo}: senkrechte Kathete passt nicht`);
        pruefe(dx && nahe(dx.x2 - dx.x1, B - A, 0.01) && nahe(dx.y1, fa, tol), `${wo}: waagerechte Kathete passt nicht`);
        pruefe(nahe(await spanWert(page, "#mr-bilanz .wo"), m, 6e-5 * (1 + Math.abs(m))), `${wo}: Bilanz nennt ${await spanWert(page, "#mr-bilanz .wo")} statt ${m}`);
        if (art !== "fall") {
          // Steigt und fällt f zwischen a und b? Unabhängig über das Vorzeichen der Ableitung.
          let plus = false, minus = false;
          for (let i = 1; i < 200; i++) { const x = A + ((B - A) * i) / 200, v = ableitung(def.f, x); if (v > 1e-6) plus = true; if (v < -1e-6) minus = true; }
          const satz = await text(page, "#mr-text");
          pruefe(/steigt f und fällt f auch/.test(satz) === (plus && minus), `${wo}: Hinweis auf Steigen und Fallen falsch — „${satz}“`);
        }
      }
    }
    // Regler lügen nicht: b links von a wird zurückgeschoben, und der Regler zeigt das an.
    const A = await setzeRegler(page, "mr-a", def.lo + 1);
    const B = await setzeRegler(page, "mr-b", def.lo);
    pruefe(nahe(B, A + 0.5), `mittlere Änderungsrate ${art}: b = ${B} statt ${A + 0.5} nach dem Zurückschieben`);
    pruefe((await text(page, "#mr-b-anzeige")).startsWith(String(B).replace(".", ",").replace("-", "−")), `mittlere Änderungsrate ${art}: Anzeige von b passt nicht zum Regler`);
  }
}

// ---------- 2. Lokale Änderungsrate ----------
const LR = {
  para: { f: (x) => x * x, xs: [-2, -1, 0, 1, 2] },
  kubik: { f: (x) => 0.5 * x ** 3 - 1.5 * x, xs: [-2, -0.5, 1, 2] },
  wurzel: { f: Math.sqrt, xs: [1, 2, 3] },
};
const H_LR = [-1, -0.5, -0.1, -0.01, -0.001, 0.001, 0.01, 0.1, 0.5, 1];
async function lokal(page) {
  for (const [art, def] of Object.entries(LR)) {
    await waehle(page, "lr-art", art);
    for (const x of def.xs) {
      const x0 = await setzeRegler(page, "lr-x", x);
      for (let i = 0; i < H_LR.length; i += (x === def.xs[0] ? 1 : 3)) {
        await setzeRegler(page, "lr-h", i);
        const h = H_LR[i], wo = `lokal ${art}, x₀ = ${x0}, h = ${h}`;
        const q = (def.f(x0 + h) - def.f(x0)) / h, m = ableitung(def.f, x0);
        const d = await lies(page, "#lr-mount svg");
        const s = linie(d, "sekante"), t = linie(d, "tangente");
        pruefe(s && nahe(steigung(s), q, 2e-3 * (1 + Math.abs(q))), `${wo}: Sekantensteigung ${s && steigung(s)} statt ${q}`);
        pruefe(t && nahe(steigung(t), m, 2e-3 * (1 + Math.abs(m))), `${wo}: Grenzlage ${t && steigung(t)} statt ${m}`);
        const pq = kreis(d, "q");
        pruefe(pq && nahe(pq.x, x0 + h, 0.01) && nahe(pq.y, def.f(x0 + h), 0.03), `${wo}: Q liegt falsch`);
        pruefe(nahe(await spanWert(page, "#lr-bilanz .wo"), q, 2e-6 * (1 + Math.abs(q))), `${wo}: Bilanz-Differenzenquotient falsch`);
        pruefe(nahe(await spanWert(page, "#lr-bilanz .wa"), m, 6e-5 * (1 + Math.abs(m))), `${wo}: Bilanz-Grenzlage falsch`);
        const zellen = await page.evaluate(() => [...document.querySelectorAll("#lr-tabelle td[data-h]")].map((c) => ({ h: Number(c.dataset.h), t: c.textContent, aktiv: c.classList.contains("aktiv") })));
        pruefe(zellen.length === 10, `${wo}: ${zellen.length} Tabellenzellen`);
        for (const z of zellen) {
          const soll = (def.f(x0 + z.h) - def.f(x0)) / z.h;
          pruefe(nahe(zahl(z.t), soll, 1e-6 * (1 + Math.abs(soll))), `${wo}: Tabelle bei h = ${z.h}: ${z.t} statt ${soll}`);
          pruefe(z.aktiv === (z.h === h), `${wo}: Tabellenzelle h = ${z.h} falsch hervorgehoben`);
        }
      }
    }
  }
}

// ---------- 3. Funktionenmikroskop ----------
const FM = {
  para: { f: (x) => x * x, knick: () => false },
  kubik: { f: (x) => 0.5 * x ** 3 - 1.5 * x, knick: () => false },
  betrag: { f: (x) => Math.abs(x * x - 1), knick: (x) => Math.abs(Math.abs(x) - 1) < 1e-9 },
};
const ZOOM = [1, 2, 5, 10, 100, 1000];
async function mikroskop(page) {
  for (const [art, def] of Object.entries(FM)) {
    await waehle(page, "fm-art", art);
    for (const x of [-2, -1, 0.5, 1]) {
      const x0 = await setzeRegler(page, "fm-x", x);
      for (let z = 0; z < ZOOM.length; z++) {
        await setzeRegler(page, "fm-z", z);
        const w = 2 / ZOOM[z], wo = `Mikroskop ${art}, x₀ = ${x0}, ${ZOOM[z]}-fach`;
        const d = await lies(page, "#fm-mount svg");
        pruefe(nahe(d.proX, d.proY, 1e-3 * d.proX), `${wo}: verzerrt (${d.proX} : ${d.proY} Bildpunkte je Einheit)`);
        const hoehe = 340 - 46;   // nutzbare Höhe der Zeichenfläche in Bildpunkten
        const fensterH = hoehe / d.proY;
        for (const p of d.pfade.filter((q) => q.rolle === "graph")) {
          for (const [px, py] of p.punkte) pruefe(nahe(py, def.f(px), 2e-3 * fensterH), `${wo}: Graphpunkt (${px} | ${py}) liegt nicht auf f`);
        }
        if (def.knick(x0)) {
          const l = linie(d, "halb-links"), r = linie(d, "halb-rechts");
          // Die beiden Steigungen von links und rechts, unabhängig als einseitige Quotienten.
          const sl = (def.f(x0) - def.f(x0 - 1e-7)) / 1e-7, sr = (def.f(x0 + 1e-7) - def.f(x0)) / 1e-7;
          pruefe(l && r && nahe(steigung(l), sl, 1e-3) && nahe(steigung(r), sr, 1e-3), `${wo}: Halbgeraden am Knick falsch`);
          pruefe(!linie(d, "tangente"), `${wo}: Am Knick ist eine Tangente gezeichnet`);
          continue;
        }
        const m = ableitung(def.f, x0, 1e-7), t = linie(d, "tangente");
        pruefe(t && nahe(steigung(t), m, 1e-3 * (1 + Math.abs(m))), `${wo}: Tangentensteigung ${t && steigung(t)} statt ${m}`);
        let abw = 0;
        for (let i = 0; i <= 4000; i++) { const xx = x0 - w + (2 * w * i) / 4000; abw = Math.max(abw, Math.abs(def.f(xx) - (def.f(x0) + m * (xx - x0)))); }
        const bilanz = await text(page, "#fm-bilanz");
        const g = bilanz.match(/höchstens (?:rund )?([\d,]+) auseinander — das sind (?:rund )?([\d,]+) %/);
        pruefe(!!g && nahe(zahl(g[1]), abw, 0.02 * abw + 1e-9 + 5 * Math.pow(10, -(g[1].split(",")[1] || "").length)), `${wo}: Abweichung ${g && g[1]} statt ${abw}`);
        pruefe(!!g && nahe(zahl(g[2]), (100 * abw) / fensterH, 0.02 * (100 * abw) / fensterH + 0.006), `${wo}: Prozentangabe ${g && g[2]} falsch`);
      }
    }
  }
}

// ---------- 4. Grafisches Differenzieren ----------
const GD = {
  para: { f: (x) => x * x, xs: [-2.5, 2.5] },
  kubik: { f: (x) => 0.5 * x ** 3 - 1.5 * x, xs: [-2.5, 2.5] },
  quartik: { f: (x) => 0.5 * x ** 4 - x * x + 0.5, xs: [-1.6, 1.6] },
  sinus: { f: Math.sin, xs: [-3.1, 3.1] },
};
async function grafisch(page) {
  for (const [art, def] of Object.entries(GD)) {
    await waehle(page, "gd-art", art);
    for (const anteil of [0, 0.3, 0.5, 0.8, 1]) {
      const x0 = await setzeRegler(page, "gd-x", Number((def.xs[0] + anteil * (def.xs[1] - def.xs[0])).toFixed(1)));
      const wo = `grafisch ${art}, x₀ = ${x0}`;
      const m = ableitung(def.f, x0), f0 = def.f(x0);
      const o = await lies(page, "#gd-mount svg[data-panel=f]");
      const t = linie(o, "tangente"), dy = linie(o, "dy"), dx = linie(o, "dx");
      pruefe(t && nahe(steigung(t), m, 3e-3 * (1 + Math.abs(m))), `${wo}: Tangentensteigung ${t && steigung(t)} statt ${m}`);
      pruefe(dx && nahe(dx.x1, x0, 0.01) && nahe(dx.x2, x0 + 1, 0.01) && nahe(dx.y1, f0, 0.02), `${wo}: Grundseite des Steigungsdreiecks ist nicht 1 lang`);
      pruefe(dy && nahe(dy.y2 - dy.y1, m, 0.02 * (1 + Math.abs(m))) && nahe(dy.x1, x0 + 1, 0.01), `${wo}: Höhe des Steigungsdreiecks ${dy && dy.y2 - dy.y1} statt ${m}`);
      const u = await lies(page, "#gd-mount svg[data-panel=a]");
      const pa = kreis(u, "punkt-ableitung");
      pruefe(pa && nahe(pa.x, x0, 0.01) && nahe(pa.y, m, 0.03 * (1 + Math.abs(m))), `${wo}: Punkt (x₀ | f′(x₀)) liegt bei (${pa && pa.x} | ${pa && pa.y})`);
      const spur = u.pfade.filter((p) => p.rolle === "spur").flatMap((p) => p.punkte);
      if (x0 > def.xs[0] + 0.05) {
        pruefe(spur.length > 1 && nahe(spur[0][0], def.xs[0], 0.02) && nahe(spur[spur.length - 1][0], x0, 0.02), `${wo}: Spur reicht nicht von ${def.xs[0]} bis x₀`);
        for (const [sx, sy] of spur) pruefe(nahe(sy, ableitung(def.f, sx), 0.03 * (1 + Math.abs(sy))), `${wo}: Spurpunkt (${sx} | ${sy}) liegt nicht auf f′`);
      }
      pruefe(nahe(await spanWert(page, "#gd-bilanz .wa"), m, 0.006 + 1e-6), `${wo}: Bilanz nennt eine andere Steigung`);
    }
    await haken(page, "gd-ganz", true);
    const u = await lies(page, "#gd-mount svg[data-panel=a]");
    const loes = u.pfade.filter((p) => p.rolle === "loesung").flatMap((p) => p.punkte);
    pruefe(loes.length > 50 && nahe(loes[0][0], def.xs[0], 0.02) && nahe(loes[loes.length - 1][0], def.xs[1], 0.02), `grafisch ${art}: Der ganze Graph von f′ fehlt oder ist zu kurz`);
    for (const [sx, sy] of loes) pruefe(nahe(sy, ableitung(def.f, sx), 0.03 * (1 + Math.abs(sy))), `grafisch ${art}: Punkt (${sx} | ${sy}) des ganzen Graphen liegt nicht auf f′`);
    await haken(page, "gd-ganz", false);
  }
}

// ---------- 5. Das wachsende Quadrat ----------
async function quadrat(page) {
  for (const x of [1, 1.5, 2, 3]) for (const h of [0.05, 0.3, 1]) {
    const X0 = await setzeRegler(page, "pq-x", x), H = await setzeRegler(page, "pq-h", h);
    const wo = `Quadrat x = ${X0}, h = ${H}`;
    const d = await lies(page, "#pq-mount svg");
    pruefe(nahe(d.proX, d.proY, 1e-3 * d.proX), `${wo}: verzerrt`);
    const r = Object.fromEntries(d.rechtecke.map((q) => [q.rolle, q]));
    const tol = 3e-3;
    pruefe(r.quadrat && nahe(rechteckFl(r.quadrat), X0 * X0, tol * 10), `${wo}: Quadrat hat den Flächeninhalt ${r.quadrat && rechteckFl(r.quadrat)}`);
    pruefe(r["streifen-rechts"] && nahe(rechteckFl(r["streifen-rechts"]), X0 * H, tol * 3), `${wo}: rechter Streifen ist nicht x · h`);
    pruefe(r["streifen-oben"] && nahe(rechteckFl(r["streifen-oben"]), X0 * H, tol * 3), `${wo}: oberer Streifen ist nicht x · h`);
    pruefe(r.ecke && nahe(rechteckFl(r.ecke), H * H, tol), `${wo}: Ecke ist nicht h²`);
    // Zusammen ergeben die vier Teile das Quadrat mit der Seite x + h.
    const summe = Object.values(r).reduce((s, q) => s + rechteckFl(q), 0);
    pruefe(nahe(summe, (X0 + H) ** 2, tol * 10) && nahe(r.ecke.x2, X0 + H, 0.01) && nahe(r.ecke.y2, X0 + H, 0.01), `${wo}: Die Teile ergeben nicht das Quadrat (x + h)²`);
    pruefe(nahe(await spanWert(page, "#pq-bilanz .wo"), 2 * X0 + H, 1e-4), `${wo}: Bilanz 2x + h falsch`);
    pruefe(nahe(zahl((await text(page, "#pq-bilanz .wa")).split("=")[1]), 2 * X0, 1e-4), `${wo}: Bilanz 2x falsch`);
  }
}

// ---------- 6. Faktor- und Summenregel ----------
async function regeln(page) {
  await waehle(page, "rg-art", "faktor");
  pruefe(!(await page.evaluate(() => document.getElementById("rg-k-label").hidden)), "Faktorregel: Der Regler k ist versteckt");
  const g = (x) => 0.5 * x * x;
  for (const k of [-2, -0.5, 0, 1, 3]) for (const x of [-2, 0, 1.5, 2]) {
    const K = await setzeRegler(page, "rg-k", k), x0 = await setzeRegler(page, "rg-x", x);
    const wo = `Faktorregel k = ${K}, x₀ = ${x0}`;
    const f = (t) => K * g(t);
    const d = await lies(page, "#rg-mount svg");
    const tf = linie(d, "tangente-f"), tg = linie(d, "tangente-g"), dyf = linie(d, "dy-f"), dyg = linie(d, "dy-g");
    pruefe(tf && nahe(steigung(tf), ableitung(f, x0), 3e-3 * (1 + Math.abs(K * x0))), `${wo}: Tangente an f hat die Steigung ${tf && steigung(tf)}`);
    pruefe(tg && nahe(steigung(tg), ableitung(g, x0), 3e-3 * (1 + Math.abs(x0))), `${wo}: Tangente an g hat die Steigung ${tg && steigung(tg)}`);
    pruefe(dyf && nahe(dyf.y2 - dyf.y1, ableitung(f, x0), 0.02) && nahe(dyf.y1, f(x0), 0.03), `${wo}: Steigungsdreieck von f falsch`);
    pruefe(dyg && nahe(dyg.y2 - dyg.y1, ableitung(g, x0), 0.02) && nahe(dyg.y1, g(x0), 0.03), `${wo}: Steigungsdreieck von g falsch`);
    pruefe(nahe(await spanWert(page, "#rg-bilanz .wa"), ableitung(f, x0), 1e-4), `${wo}: Bilanz nennt eine andere Steigung`);
  }
  await waehle(page, "rg-art", "summe");
  pruefe(await page.evaluate(() => document.getElementById("rg-k-label").hidden), "Summenregel: Der Regler k ist sichtbar, wirkt aber nicht");
  const h = (x) => 0.2 * x ** 3, f = (x) => g(x) + h(x);
  for (const x of [-2, -1, 0, 0.5, 2]) {
    const x0 = await setzeRegler(page, "rg-x", x);
    const wo = `Summenregel x₀ = ${x0}`;
    const d = await lies(page, "#rg-mount svg");
    const tf = linie(d, "tangente-f"), dyg = linie(d, "dy-g"), dyh = linie(d, "dy-h");
    pruefe(tf && nahe(steigung(tf), ableitung(f, x0), 3e-3 * (1 + Math.abs(ableitung(f, x0)))), `${wo}: Tangente an f falsch`);
    pruefe(dyg && nahe(dyg.y1, f(x0), 0.03) && nahe(dyg.y2 - dyg.y1, ableitung(g, x0), 0.02), `${wo}: Kathete g′ falsch`);
    pruefe(dyh && nahe(dyh.y1, dyg.y2, 0.02) && nahe(dyh.y2 - dyh.y1, ableitung(h, x0), 0.02), `${wo}: Kathete h′ sitzt nicht auf g′ oder ist falsch lang`);
    pruefe(dyh && nahe(dyh.y2, f(x0) + ableitung(f, x0), 0.03), `${wo}: Die gestapelten Katheten reichen nicht bis zur Tangente`);
    pruefe(nahe(await spanWert(page, "#rg-bilanz .wa"), ableitung(f, x0), 1e-4), `${wo}: Bilanz nennt eine andere Steigung`);
  }
}

// ---------- 7. Sinus am Einheitskreis ----------
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

// ---------- 8. Produkt- und Kettenregel ----------
async function produktKette(page) {
  await waehle(page, "pk-art", "produkt");
  const v = (t) => 0.25 * t * t + 1;
  for (const x of [0.5, 1, 2]) for (const h of [0.05, 0.25, 0.5]) {
    const X0 = await setzeRegler(page, "pk-x", x), H = await setzeRegler(page, "pk-h", h);
    const wo = `Produktregel x = ${X0}, h = ${H}`;
    const d = await lies(page, "#pk-mount svg");
    pruefe(nahe(d.proX, d.proY, 1e-3 * d.proX), `${wo}: verzerrt`);
    const r = Object.fromEntries(d.rechtecke.map((q) => [q.rolle, q]));
    const u0 = X0, v0 = v(X0), du = H, dv = v(X0 + H) - v(X0), tol = 3e-3;
    pruefe(r.rechteck && nahe(rechteckFl(r.rechteck), u0 * v0, tol * 5), `${wo}: Rechteck ist nicht u · v`);
    pruefe(r["streifen-rechts"] && nahe(rechteckFl(r["streifen-rechts"]), v0 * du, tol * 2), `${wo}: rechter Streifen ist nicht v · Δu`);
    pruefe(r["streifen-oben"] && nahe(rechteckFl(r["streifen-oben"]), u0 * dv, tol * 2), `${wo}: oberer Streifen ist nicht u · Δv`);
    pruefe(r.ecke && nahe(rechteckFl(r.ecke), du * dv, tol), `${wo}: Ecke ist nicht Δu · Δv`);
    const ges = (u0 + du) * v(X0 + H) - u0 * v0;
    pruefe(nahe(await spanWert(page, "#pk-bilanz .wo"), ges / H, 6e-5), `${wo}: Bilanz Δ(u · v) : h falsch`);
    pruefe(nahe(await spanWert(page, "#pk-bilanz .wa"), ableitung((t) => t * v(t), X0), 6e-5), `${wo}: Grenzwert der Produktregel falsch`);
  }
  await waehle(page, "pk-art", "kette");
  for (const x of [0.5, 1, 1.5, 2]) for (const h of [0.05, 0.5]) {
    const X0 = await setzeRegler(page, "pk-x", x), H = await setzeRegler(page, "pk-h", h);
    const wo = `Kettenregel x = ${X0}, h = ${H}`;
    // Jede Zahlengerade hat ihre eigenen Striche mit data-wert — daraus der Maßstab je Gerade.
    const iv = await page.evaluate(() => {
      const svg = document.querySelector("#pk-mount svg");
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
    const soll = { x: [X0, X0 + H], u: sortiert(X0 * X0, (X0 + H) ** 2), f: sortiert(Math.sin(X0 * X0), Math.sin((X0 + H) ** 2)) };
    for (const a of ["x", "u", "f"]) pruefe(nahe(iv[a][0], soll[a][0], 3e-3) && nahe(iv[a][1], soll[a][1], 3e-3), `${wo}: ${a}-Intervall [${iv[a]}] statt [${soll[a]}]`);
    const ff = (t) => Math.sin(t * t);
    pruefe(nahe(await spanWert(page, "#pk-bilanz .wo"), (ff(X0 + H) - ff(X0)) / H, 6e-5), `${wo}: Bilanz Δf : Δx falsch`);
    pruefe(nahe(await spanWert(page, "#pk-bilanz .wa"), ableitung(ff, X0), 6e-5), `${wo}: Grenzwert der Kettenregel falsch`);
  }
}

// ---------- 9. Tangente, Normale, Winkel ----------
async function tangente(page) {
  await waehle(page, "tn-art", "normale");
  const f = (x) => x * x;
  for (const x of [-2, -1.5, -0.5, 0, 1, 2]) for (const dreh of [0, 0.35, 1]) {
    const x0 = await setzeRegler(page, "tn-x", x), D = await setzeRegler(page, "tn-d", dreh);
    const wo = `Normale x₀ = ${x0}, Drehung ${D}`;
    const m = ableitung(f, x0), y0 = f(x0);
    const d = await lies(page, "#tn-mount svg");
    pruefe(nahe(d.proX, d.proY, 1e-3 * d.proX), `${wo}: verzerrt — der rechte Winkel wäre keiner`);
    const t = linie(d, "tangente"), n = linie(d, "normale");
    pruefe(t && nahe(steigung(t), m, 3e-3 * (1 + Math.abs(m))), `${wo}: Tangente falsch`);
    if (Math.abs(m) < 1e-9) pruefe(n && nahe(n.x1, x0, 0.01) && nahe(n.x2, x0, 0.01), `${wo}: Die Normale ist nicht senkrecht`);
    else pruefe(n && nahe(steigung(n) * m, -1, 3e-3), `${wo}: Normale steht nicht senkrecht (Steigung ${n && steigung(n)})`);
    // Das gedrehte Dreieck ist starr: gleiche Seiten wie das Original, gedreht um D · 90°.
    const gd = d.vielecke.find((v) => v.rolle === "dreieck-gedreht");
    const [P, A, B] = gd.punkte;
    const lang = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
    pruefe(nahe(P[0], x0, 0.01) && nahe(P[1], y0, 0.01), `${wo}: Das Dreieck dreht sich nicht um P`);
    pruefe(nahe(lang(P, A), 1, 0.01) && nahe(lang(A, B), Math.abs(m), 0.01) && nahe(lang(P, B), Math.hypot(1, m), 0.01), `${wo}: Das gedrehte Dreieck ist nicht starr`);
    pruefe(nahe(Math.atan2(A[1] - P[1], A[0] - P[0]) * GRAD, D * 90, 0.6), `${wo}: Drehwinkel ${Math.atan2(A[1] - P[1], A[0] - P[0]) * GRAD}° statt ${D * 90}°`);
    if (D === 1 && Math.abs(m) > 1e-9) pruefe(nahe((B[1] - P[1]) / (B[0] - P[0]), -1 / m, 0.01), `${wo}: Nach 90° liegt die Hypotenuse nicht auf der Normalen`);
    const bil = await klartext(page, "#tn-bilanz .wa");
    if (Math.abs(m) > 1e-9) {
      const tg = liesGerade(bil), ng = liesGerade(await klartext(page, "#tn-bilanz .wr"));
      pruefe(tg && nahe(tg.m, m, 1e-4) && nahe(tg.b, y0 - m * x0, 1e-4), `${wo}: Tangentengleichung „${bil}“ falsch`);
      pruefe(ng && nahe(ng.m, -1 / m, 1e-4) && nahe(ng.b, y0 + x0 / m, 1e-4), `${wo}: Normalengleichung falsch`);
    } else pruefe(/x = 0/.test(await text(page, "#tn-bilanz")), `${wo}: Bei f′(0) = 0 fehlt die senkrechte Normale x = 0`);
  }
  await waehle(page, "tn-art", "winkel");
  for (const mg of [-3, -0.5, 0, 0.25, 2, 3]) {
    const M = await setzeRegler(page, "tn-m", mg);
    const wo = `Schnittwinkel, g mit Steigung ${M}`;
    const al = Math.atan(ableitung(f, 1)) * GRAD, be = Math.atan(M) * GRAD, diff = Math.abs(al - be), ga = diff <= 90 ? diff : 180 - diff;
    const d = await lies(page, "#tn-mount svg");
    const g = linie(d, "gerade-g");
    pruefe(g && nahe(steigung(g), M, 3e-3 * (1 + Math.abs(M))) && nahe(g.y1 + steigung(g) * (1 - g.x1), 1, 0.01), `${wo}: g geht nicht durch P(1 | 1)`);
    const winkel = Object.fromEntries(d.pfade.filter((p) => p.rolle.startsWith("winkel-")).map((p) => [p.rolle, p]));
    // Der Bogen selbst: Anfangs- und Endrichtung, vom Mittelpunkt P aus gemessen (Bildschirm-y nach unten).
    const spanne = (p) => {
      const P = d.kreise.find((k) => k.daten.rolle === "p");
      const cx = (P.x - 0) * 1, cy = P.y;
      const ws = p.punkte.map(([a, b]) => Math.atan2(b - cy, a - cx) * GRAD);
      return Math.abs(ws[ws.length - 1] - ws[0]);
    };
    pruefe(winkel["winkel-alpha"] && nahe(Number(winkel["winkel-alpha"].daten.grad), al, 1e-6) && nahe(spanne(winkel["winkel-alpha"]), al, 0.5), `${wo}: Bogen α falsch`);
    pruefe(winkel["winkel-beta"] && nahe(spanne(winkel["winkel-beta"]), Math.abs(be), 0.5), `${wo}: Bogen β falsch`);
    pruefe(winkel["winkel-gamma"] && nahe(spanne(winkel["winkel-gamma"]), ga, 0.5), `${wo}: Bogen γ spannt ${winkel["winkel-gamma"] && spanne(winkel["winkel-gamma"])}° statt ${ga}°`);
    pruefe(nahe(await spanWert(page, "#tn-bilanz .wa"), ga, 0.006), `${wo}: Bilanz nennt γ = ${await spanWert(page, "#tn-bilanz .wa")} statt ${ga}`);
    const satz = await text(page, "#tn-text");
    if (M === 2) pruefe(/Tangente/.test(satz) && /0°/.test(satz), `${wo}: Bei γ = 0 fehlt der Hinweis auf die Tangente`);
    if (M === -0.5) pruefe(/Normale/.test(satz) && /90°/.test(satz), `${wo}: Bei γ = 90° fehlt der Hinweis auf die Normale`);
  }
}

// ---------- 10. Differenzierbarkeit ----------
const H_DF = [1, 0.5, 0.1, 0.01, 0.001];
async function differenzierbar(page) {
  const naht = (m) => (x) => (x < 2 ? x * x - 2 * x + 3 : 3 + m * (x - 2));
  const faelle = [["naht", 0], ["naht", 2], ["naht", 3.5], ["betrag", null], ["wurzel3", null]];
  for (const [art, mm] of faelle) {
    await waehle(page, "df-art", art);
    pruefe((await page.evaluate(() => document.getElementById("df-m-label").hidden)) === (art !== "naht"), `Differenzierbarkeit ${art}: Regler m falsch sichtbar`);
    const m = art === "naht" ? await setzeRegler(page, "df-m", mm) : null;
    const f = art === "naht" ? naht(m) : art === "betrag" ? Math.abs : Math.cbrt, x0 = art === "naht" ? 2 : 0;
    for (let i = 0; i < H_DF.length; i++) {
      await setzeRegler(page, "df-h", i);
      const h = H_DF[i], wo = `Differenzierbarkeit ${art}${m !== null ? ", m = " + m : ""}, |h| = ${h}`;
      const L = (f(x0) - f(x0 - h)) / h, R = (f(x0 + h) - f(x0)) / h;
      const d = await lies(page, "#df-mount svg");
      const sl = linie(d, "sekante-links"), sr = linie(d, "sekante-rechts");
      pruefe(sl && nahe(steigung(sl), L, 3e-3 * (1 + Math.abs(L))), `${wo}: linke Sekante ${sl && steigung(sl)} statt ${L}`);
      pruefe(sr && nahe(steigung(sr), R, 3e-3 * (1 + Math.abs(R))), `${wo}: rechte Sekante ${sr && steigung(sr)} statt ${R}`);
      const zellen = await page.evaluate(() => [...document.querySelectorAll("#df-tabelle td[data-h]")].map((c) => ({ s: c.dataset.seite, h: Number(c.dataset.h), t: c.textContent })));
      for (const z of zellen) {
        const soll = z.s === "links" ? (f(x0) - f(x0 - z.h)) / z.h : (f(x0 + z.h) - f(x0)) / z.h;
        pruefe(nahe(zahl(z.t), soll, 6e-5 * (1 + Math.abs(soll))), `${wo}: Tabelle ${z.s} bei ${z.h}: ${z.t} statt ${soll}`);
      }
    }
    // Das Urteil: unabhängig über die einseitigen Quotienten bei sehr kleinem h.
    const e = 1e-7, L = (f(x0) - f(x0 - e)) / e, R = (f(x0 + e) - f(x0)) / e;
    const diffbar = Math.abs(L - R) < 1e-4 && Math.abs(L) < 1e4;
    const b = await text(page, "#df-bilanz");
    pruefe(diffbar ? /ist an der Stelle 2 differenzierbar, f′\(2\) = 2/.test(b) : /nicht differenzierbar/.test(b), `Differenzierbarkeit ${art}${m !== null ? ", m = " + m : ""}: falsches Urteil — „${b}“`);
  }
}

// ---------- 11. Ganzrationale Funktionen ----------
const GR = {
  f: { f: (x) => 0.5 * x ** 4 - x * x + 0.5, leit: (x) => 0.5 * x ** 4 },
  g: { f: (x) => -0.5 * x ** 5 + 1.5 * x ** 3 + 2 * x, leit: (x) => -0.5 * x ** 5 },
  h: { f: (x) => 0.5 * x ** 3 - x * x + 1, leit: (x) => 0.5 * x ** 3 },
};
const GR_FENSTER = [2, 3, 5, 10, 20, 50];
async function ganzrational(page) {
  await waehle(page, "gr-modus", "aussen");
  for (const [name, def] of Object.entries(GR)) {
    await waehle(page, "gr-f", name);
    for (let z = 0; z < GR_FENSTER.length; z++) {
      await setzeRegler(page, "gr-z", z);
      const X = GR_FENSTER[z], wo = `ganzrational ${name}, Fenster ±${X}`;
      const d = await lies(page, "#gr-mount svg");
      const spanne = (d.proY ? 274 / d.proY : 1);
      for (const p of d.pfade) {
        const fn = p.rolle === "leit" ? def.leit : def.f;
        for (const [x, y] of p.punkte) pruefe(nahe(y, fn(x), 3e-3 * spanne), `${wo}: Punkt (${x} | ${y}) liegt nicht auf ${p.rolle}`);
      }
      const werte = await page.evaluate(() => [...document.querySelectorAll("#gr-bilanz .wo")].map((s) => s.textContent));
      pruefe(werte.length === 2 && nahe(zahl(werte[0]), def.f(X) / def.leit(X), 6e-5) && nahe(zahl(werte[1]), def.f(-X) / def.leit(-X), 6e-5), `${wo}: Verhältnisse ${werte.join(" / ")} falsch`);
    }
  }
  for (const modus of ["achse", "punkt"]) {
    await waehle(page, "gr-modus", modus);
    for (const [name, def] of Object.entries(GR)) {
      await waehle(page, "gr-f", name);
      // Unabhängig: symmetrisch, wenn f(−x) = f(x) bzw. −f(x) an vielen Stellen gilt.
      let sym = true;
      for (let x = 0.1; x < 4; x += 0.37) sym = sym && Math.abs(def.f(-x) - (modus === "achse" ? def.f(x) : -def.f(x))) < 1e-9;
      for (const t of [0, 0.5, 1]) {
        const T = await setzeRegler(page, "gr-t", t);
        const wo = `${modus === "achse" ? "Achsen" : "Punkt"}symmetrie ${name}, t = ${T}`;
        const d = await lies(page, "#gr-mount svg");
        pruefe(nahe(d.proX, d.proY, 1e-3 * d.proX), `${wo}: verzerrt — eine Drehung bliebe keine Drehung`);
        const kopie = d.pfade.find((p) => p.rolle === "kopie");
        // Punkt für Punkt nachgerechnet: Jeder Punkt der Kopie ist das Bild des entsprechenden
        // Graphenpunkts unter der Bewegung.
        const soll = [];
        for (let i = 0; i <= 600; i++) {
          const x = -5 + (10 * i) / 600, y = def.f(x);
          if (Math.abs(y) > 60) continue;
          soll.push(modus === "achse" ? [(1 - 2 * T) * x, y] : [x * Math.cos(Math.PI * T) - y * Math.sin(Math.PI * T), x * Math.sin(Math.PI * T) + y * Math.cos(Math.PI * T)]);
        }
        pruefe(kopie && kopie.punkte.length === soll.length, `${wo}: Kopie hat ${kopie && kopie.punkte.length} statt ${soll.length} Punkte`);
        if (kopie) {
          const schlecht = kopie.punkte.findIndex(([a, b], i) => !(nahe(a, soll[i][0], 0.01) && nahe(b, soll[i][1], 0.01)));
          pruefe(schlecht < 0, `${wo}: Kopiepunkt ${schlecht} liegt nicht beim Bild des Graphenpunkts`);
        }
        if (T === 1 && kopie) {
          const imBild = kopie.punkte.filter(([a, b]) => Math.abs(a) < 4.9 && Math.abs(b) < 4.5);
          const deckt = imBild.every(([a, b]) => Math.abs(b - def.f(a)) < 0.02);
          pruefe(deckt === sym, `${wo}: Kopie ${deckt ? "deckt" : "deckt nicht"} — unabhängig ${sym ? "symmetrisch" : "nicht symmetrisch"}`);
        }
        const b = await text(page, "#gr-bilanz");
        pruefe(sym ? / ist (achsen|punkt)symmetrisch/.test(b) && !/nicht (achsen|punkt)symmetrisch/.test(b) : /ist nicht (achsen|punkt)symmetrisch/.test(b), `${wo}: falsches Urteil — „${b}“`);
      }
    }
  }
}

// ---------- 12. Nullstellen und Vielfachheit ----------
async function nullstellen(page) {
  const faelle = [[-1.5, 2, 1.5, 1, false], [-1, 1, 2, 3, false], [0, 2, 0, 1, false], [1, 2, 1, 2, true], [-2, 3, 2, 2, true], [2.5, 1, -3, 1, true]];
  for (const [a, k1, b, k2, q] of faelle) {
    const r1 = await setzeRegler(page, "ns-r1", a), r2 = await setzeRegler(page, "ns-r2", b);
    await waehle(page, "ns-k1", String(k1));
    await waehle(page, "ns-k2", String(k2));
    await haken(page, "ns-q", q);
    const wo = `Nullstellen (x − ${r1})^${k1} (x − ${r2})^${k2}${q ? " (x² + 1)" : ""}`;
    const f = (x) => 0.25 * (x - r1) ** k1 * (x - r2) ** k2 * (q ? x * x + 1 : 1);
    const d = await lies(page, "#ns-mount svg");
    for (const p of d.pfade) for (const [x, y] of p.punkte) pruefe(nahe(y, f(x), 0.02), `${wo}: Graphpunkt (${x} | ${y}) liegt nicht auf f`);
    const marken = d.kreise.filter((k) => k.daten.rolle === "nullstelle");
    const soll = r1 === r2 ? [[r1, k1 + k2]] : [[r1, k1], [r2, k2]];
    pruefe(marken.length === soll.length, `${wo}: ${marken.length} Nullstellenmarken statt ${soll.length}`);
    for (const [r, k] of soll) {
      const mk = marken.find((x) => nahe(Number(x.daten.wert), r, 1e-9));
      pruefe(mk && Number(mk.daten.vielfachheit) === k && nahe(mk.x, r, 0.01) && nahe(mk.y, 0, 0.01), `${wo}: Marke bei ${r} fehlt oder hat die falsche Vielfachheit`);
      // Vorzeichenwechsel unabhängig: f links und rechts der Nullstelle.
      const wechsel = f(r - 1e-3) * f(r + 1e-3) < 0;
      pruefe(mk && /dr-schneidet/.test(mk.klasse) === wechsel, `${wo}: Bei ${r} ist ${wechsel ? "Schneiden" : "Berühren"} falsch markiert`);
    }
    const grad = k1 + k2 + (q ? 2 : 0);
    pruefe(nahe(await spanWert(page, "#ns-bilanz .wc"), grad, 1e-9), `${wo}: Grad falsch`);
    const bil = await text(page, "#ns-bilanz");
    pruefe(q ? /&lt;|< Grad/.test(bil) : /= Grad/.test(bil), `${wo}: Vergleich mit dem Grad falsch — „${bil}“`);
  }
}

// ---------- 13. f und f′ ----------
const MO = {
  quartik: { f: (x) => 0.5 * x ** 4 - x * x + 0.5, xs: [-1.8, 1.8] },
  kubik: { f: (x) => 0.5 * x ** 3 - 1.5 * x, xs: [-2.4, 2.4] },
  sattel: { f: (x) => 0.25 * x ** 4 - x ** 3, xs: [-1, 3.8] },
};
// Kritische Stellen unabhängig: einfache Nullstellen von f′ über einen Vorzeichenwechsel zwischen
// zwei Rasterpunkten (dann halbiert), doppelte über ein Minimum von |f′|, das fast 0 ist. Danach
// eingeordnet nach dem Vorzeichen von f′ links und rechts.
function kritisch(f, lo, hi) {
  const d = (x) => ableitung(f, x), n = 2000, h = (hi - lo) / n, aus = [];
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
      if (Math.abs(d(z)) < 1e-7) neu(z);
    }
  }
  return aus.sort((p, q) => p - q).map((z) => {
    const links = d(z - 0.05), rechts = d(z + 0.05);
    return { x: z, typ: links > 0 && rechts < 0 ? "H" : links < 0 && rechts > 0 ? "T" : "S" };
  });
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
      for (const p of u.pfade) for (const [x, y] of p.punkte) pruefe(nahe(y, ableitung(def.f, x), 0.05), `${wo}: Punkt (${x} | ${y}) liegt nicht auf f′`);
      const bil = await text(page, "#mo-bilanz");
      // Jeder genannte Extrem- oder Sattelpunkt wird nachgerechnet.
      const genannt = [...bil.matchAll(/([HTS])[₁₂]?\((−?[\d,]+) \| (−?[\d,]+)\)/g)];
      pruefe(genannt.length === krit.length, `${wo}: Bilanz nennt ${genannt.length} Punkte statt ${krit.length}`);
      for (const g of genannt) {
        const x = zahl(g[2]), k = krit.find((c) => nahe(c.x, x, 1e-3));
        pruefe(k && k.typ === g[1] && nahe(zahl(g[3]), def.f(x), 1e-4), `${wo}: „${g[0]}“ stimmt nicht`);
      }
      // Jedes genannte Monotonie-Intervall wird an inneren Stellen nachgeprüft.
      for (const satz of bil.split(/[;.]/)) {
        const art2 = /f fällt/.test(satz) ? -1 : /f steigt/.test(satz) ? 1 : 0;
        if (!art2) continue;
        for (const iv of satz.matchAll(/(−?[\d,]+) < x < (−?[\d,]+)|x < (−?[\d,]+)|x > (−?[\d,]+)/g)) {
          const lo = iv[1] ? zahl(iv[1]) : iv[4] ? zahl(iv[4]) : def.xs[0] - 1;
          const hi = iv[2] ? zahl(iv[2]) : iv[3] ? zahl(iv[3]) : def.xs[1] + 1;
          for (let i = 1; i < 20; i++) {
            const x = lo + ((hi - lo) * i) / 20;
            if (krit.some((c) => Math.abs(c.x - x) < 1e-6)) continue;
            pruefe(Math.sign(ableitung(def.f, x)) === art2, `${wo}: „${satz.trim()}“ — bei x = ${x} ist f′ = ${ableitung(def.f, x)}`);
          }
        }
      }
      const aktuell = await page.evaluate(() => { const s = [...document.querySelectorAll("#mo-bilanz span")].pop(); return s ? s.textContent : ""; });
      pruefe(nahe(zahl(aktuell), ableitung(def.f, x0), 1e-4), `${wo}: f′(x₀) in der Bilanz ${aktuell}`);
    }
  }
}

// ---------- 14. Stolperstelle ----------
async function stolperstelle(page) {
  const f = (x) => 0.5 * x ** 3 - 1.5 * x;
  for (let x = -1.25; x <= 1.25 + 1e-9; x += 0.25) {
    const x0 = await setzeRegler(page, "sp-x", Number(x.toFixed(2)));
    const wo = `Stolperstelle x₀ = ${x0}`;
    const m = ableitung(f, x0), y0 = f(x0);
    const d = await lies(page, "#sp-mount svg");
    const t = linie(d, "tangente");
    pruefe(t && nahe(steigung(t), m, 3e-3 * (1 + Math.abs(m))), `${wo}: Tangente falsch`);
    const b = kreis(d, "beruehrpunkt");
    pruefe(b && nahe(b.x, x0, 0.01) && nahe(b.y, y0, 0.02), `${wo}: Berührpunkt falsch`);
    const s = kreis(d, "schnittpunkt");
    if (Math.abs(x0) < 1e-9) { pruefe(!s, `${wo}: Bei x₀ = 0 ist ein zweiter Schnittpunkt markiert`); continue; }
    // Der markierte Punkt liegt auf dem Graphen UND auf der gezeichneten Tangente.
    const aufT = t.y1 + steigung(t) * (s.x - t.x1);
    pruefe(s && nahe(s.y, f(s.x), 0.02) && nahe(s.y, aufT, 0.02) && Math.abs(s.x - x0) > 0.1, `${wo}: zweiter Schnittpunkt (${s && s.x} | ${s && s.y}) liegt nicht auf Graph und Tangente`);
    const tg = liesGerade((await text(page, "#sp-bilanz")).match(/t\(x\) = (.+?)\. f\(x\)/)[1]);
    pruefe(tg && nahe(tg.m, m, 1e-4) && nahe(tg.b, y0 - m * x0, 1e-4), `${wo}: Tangentengleichung falsch`);
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
  await page.locator("#se-liste .se-zeile").nth(3).locator("button").nth(2).click();
  const aus = await page.evaluate(() => document.getElementById("se-auswertung").innerHTML);
  pruefe(/href="#sec-grafisch"/.test(aus), `Selbsteinschätzung: kein Verweis zurück zum grafischen Differenzieren — „${aus}“`);
  await page.evaluate(() => localStorage.clear());
}

// ---------- Übungsaufgaben ----------
const T = 0.0001;
const TW = 0.006;
// Gemessen mit UPLANT_ZUEGE=25 tests/werkzeug-streuung.js (200 Würfe je Aufgabe, 10⁻⁴-Quantil für 0,8 · n):
//   UPLANT_ZUEGE=25 node tests/werkzeug-streuung.js /mathematik/mss11/01-analysis/03-differentialrechnung/index.html
const SCHRANKE = {1: 18, 2: 22, 3: 14, 4: 19, 5: 18, 6: 21, 7: 19, 8: 18, 9: 14, 10: 13, 11: 14, 12: 17, 13: 18, 14: 20, 15: 15, 16: 21, 17: 17, 18: 14, 19: 16, 20: 16};
const ZAHL = "(−?[\\d,]+)";

async function aufgaben(page) {
  const r = 25;
  const A = (nr, name, deute) => pruefeAufgabe(page, bericht, { nr, name, runden: r, mindestensVerschieden: SCHRANKE[nr] ?? 5, deute });
  await A(1, "A1 mittlere Änderungsrate", (q) => {
    let f, x1, x2;
    let m = q.match(new RegExp(`s\\(t\\) = 5t² Meter .* zwischen t = ${ZAHL} s und t = ${ZAHL} s`));
    if (m) { f = (t) => 5 * t * t; x1 = zahl(m[1]); x2 = zahl(m[2]); } else {
      m = q.match(new RegExp(`f\\(x\\) = (.+?)\\. Berechne die mittlere Änderungsrate von f im Intervall \\[${ZAHL}; ${ZAHL}\\]`));
      if (!m) return null;
      f = polyFn(liesPoly(m[1])); x1 = zahl(m[2]); x2 = zahl(m[3]);
    }
    const dy = f(x2) - f(x1), soll = dy / (x2 - x1);
    return { richtig: soll, toleranz: T, falsch: [[x2 - x1 === 1 ? NaN : dy, "teilt sie noch durch"], [soll === 0 ? NaN : -soll, "Im Zähler steht"], [(f(x1) + f(x2)) / 2, "Mittelwert der Funktionswerte"]] };
  });
  await A(2, "A2 Ableitung an einer Stelle", (q) => {
    const m = q.match(new RegExp(`f\\(x\\) = (.+?)\\. Berechne f′\\(${ZAHL}\\)`));
    if (!m) return null;
    const k = liesPoly(m[1]), f = polyFn(k), x0 = zahl(m[2]);
    const ohneFaktor = Object.entries(k).reduce((s, [e, c]) => (Number(e) >= 1 ? s + c * x0 ** (Number(e) - 1) : s), 0);
    return { richtig: ableitung(f, x0, 1e-5), toleranz: T, falsch: [[f(x0), "nicht die Steigung"], [ohneFaktor, "als Faktor nach vorn"], [ableitung(f, x0, 1e-5) + (k[0] || 0), "fällt beim Ableiten weg"]] };
  });
  await A(3, "A3 negative Exponenten und Wurzeln", (q) => {
    let m = q.match(new RegExp(`= ${ZAHL} · x⁻([¹²³⁴])\\. Berechne f′\\(${ZAHL}\\)`));
    if (m) {
      const a = zahl(m[1]), n = { "¹": 1, "²": 2, "³": 3, "⁴": 4 }[m[2]], x0 = zahl(m[3]);
      const f = (x) => a * x ** -n, soll = ableitung(f, x0, 1e-6);
      return { richtig: soll, toleranz: T, falsch: [[-soll, "kommt als Faktor nach vorn"], [-n * a * x0 ** (-n + 1), "Der Exponent wird um 1 kleiner"], [f(x0), "Funktionswert"]] };
    }
    m = q.match(new RegExp(`f\\(x\\) = (−?[\\d,]*)√x = .*Berechne f′\\(${ZAHL}\\)`));
    if (!m) return null;
    const a = m[1] === "" ? 1 : m[1] === "−" ? -1 : zahl(m[1]), x0 = zahl(m[2]);
    const f = (x) => a * Math.sqrt(x);
    return { richtig: ableitung(f, x0, 1e-6), toleranz: T, falsch: [[a / Math.sqrt(x0), "Der Faktor ½ fehlt"], [(a * Math.sqrt(x0)) / 2, "Der Exponent wird um 1 kleiner"], [f(x0), "Funktionswert"]] };
  });
  await A(4, "A4 Steigungswinkel", (q) => {
    const m = q.match(new RegExp(`f\\(x\\) = (.+?)\\. Berechne den Steigungswinkel α des Graphen an der Stelle x₀ = ${ZAHL}`));
    if (!m) return null;
    const f = polyFn(liesPoly(m[1])), x0 = zahl(m[2]), s = ableitung(f, x0, 1e-6), al = Math.atan(s) * GRAD;
    return { richtig: al, toleranz: TW, falsch: [[nahe(f(x0), s, 1e-6) ? NaN : Math.atan(f(x0)) * GRAD, "Du hast mit dem Funktionswert"], [Math.atan(s), "Bogenmaß"], [90 - al, "Winkel zur y-Achse"]] };
  });
  await A(5, "A5 waagerechte Tangente", (q) => {
    const m = q.match(/von f\(x\) = (.+?) eine waagerechte Tangente/);
    if (!m) return null;
    const k = liesPoly(m[1]), xs = -k[1] / (2 * k[2]);
    return { richtig: xs, toleranz: T, pruefe: () => pruefe(Math.abs(ableitung(polyFn(k), xs, 1e-6)) < 1e-6, "A5: An der Lösungsstelle ist f′ nicht 0"), falsch: [[-xs, "Vorzeichen"], [-k[1] / k[2], "der Faktor 2 fehlt"]] };
  });
  await A(6, "A6 Differenzenquotient", (q) => {
    const m = q.match(new RegExp(`f\\(x\\) = (.+?)\\. Berechne den Differenzenquotienten .* für x₀ = ${ZAHL} und h = ${ZAHL}\\.`));
    if (!m) return null;
    const f = polyFn(liesPoly(m[1])), x0 = zahl(m[2]), h = zahl(m[3]);
    const soll = (f(x0 + h) - f(x0)) / h;
    return { richtig: soll, toleranz: T, falsch: [[ableitung(f, x0, 1e-5), "schon der Grenzwert"], [h === 1 ? NaN : soll * h, "Noch durch h"], [ableitung(f, x0 + h, 1e-5), "Steigung an der Stelle x₀ + h"]] };
  });
  await A(7, "A7 Tangentengleichung", (q) => {
    const m = q.match(new RegExp(`f\\(x\\) = (.+?)\\. Bestimme die Gleichung der Tangente an den Graphen im Punkt mit x₀ = ${ZAHL}`));
    if (!m) return null;
    const f = polyFn(liesPoly(m[1])), x0 = zahl(m[2]), s = ableitung(f, x0, 1e-5), b = f(x0) - s * x0;
    return { felder: [s, b], toleranz: T, falschFelder: [[0, f(x0), "die Höhe des Punktes"], [1, f(x0), "nicht der Achsenabschnitt"], [1, f(x0) + s * x0, "Vorzeichen"]] };
  });
  await A(8, "A8 Normalengleichung", (q) => {
    const m = q.match(new RegExp(`f\\(x\\) = (.+?)\\. Bestimme die Gleichung der Normalen im Punkt mit x₀ = ${ZAHL}`));
    if (!m) return null;
    const f = polyFn(liesPoly(m[1])), x0 = zahl(m[2]), s = ableitung(f, x0, 1e-5), mn = -1 / s, bn = f(x0) - mn * x0;
    return { felder: [mn, bn], toleranz: T, falschFelder: [[0, Math.abs(Math.abs(s) - 1) < 1e-6 ? NaN : -s, "Nur das Vorzeichen gewechselt"], [0, 1 / s, "Der Kehrwert allein reicht nicht"], [1, f(x0) - s * x0, "Achsenabschnitt der Tangente"]] };
  });
  await A(9, "A9 Substitution", (q) => {
    const m = q.match(/f\(x\) = (.+?)\. Bestimme alle Nullstellen/);
    if (!m) return null;
    const k = liesPoly(m[1]), a = k[4], p = (k[2] || 0) / a, qq = (k[0] || 0) / a;
    const D = p * p / 4 - qq, us = [-p / 2 + Math.sqrt(D), -p / 2 - Math.sqrt(D)];
    const xs = new Set();
    for (const u of us) { if (u > 1e-12) { xs.add(Math.sqrt(u)); xs.add(-Math.sqrt(u)); } else if (Math.abs(u) <= 1e-12) xs.add(0); }
    const gross = Math.max(...xs), anzahl = xs.size;
    const f = polyFn(k);
    return { felder: [gross, anzahl], toleranz: T, pruefe: () => pruefe([...xs].every((x) => Math.abs(f(x)) < 1e-6), "A9: Eine nachgerechnete Nullstelle ist keine"),
      falschFelder: [[0, Math.max(...us), "Rücksubstitution"], [1, anzahl === 4 ? NaN : 4, us.some((u) => u < -1e-12) ? "Ein negatives u liefert keine Nullstelle" : "u = 0 liefert nur die eine Nullstelle"]] };
  });
  await A(10, "A10 Hoch- oder Tiefpunkt", (q) => {
    const m = q.match(/f\(x\) = (.+?) hat einen Hochpunkt und einen Tiefpunkt\. Bestimme die Koordinaten des (Tiefpunkt|Hochpunkt)s/);
    if (!m) return null;
    const k = liesPoly(m[1]), f = polyFn(k), z = Math.sqrt(-k[1] / (3 * k[3]));
    const typ = (x) => (ableitung(f, x - 0.01) < 0 && ableitung(f, x + 0.01) > 0 ? "Tiefpunkt" : "Hochpunkt");
    const x = typ(z) === m[2] ? z : -z, anders = -x;
    return { felder: [x, f(x)], toleranz: T, falschFelder: [[0, anders, "Dort liegt der"], [1, f(anders), "Das ist die Höhe des"], [1, f(0), "Das ist f(0)"]] };
  });
  await A(11, "A11 Schnittwinkel", (q) => {
    const m = q.match(new RegExp(`g\\(x\\) = (.+?) und die Normalparabel f\\(x\\) = x² schneiden sich im Punkt P\\(${ZAHL} \\| ${ZAHL}\\)`));
    if (!m) return null;
    const g = liesPoly(m[1]), x0 = zahl(m[2]), y0 = zahl(m[3]), mg = g[1] || 0;
    const al = Math.atan(ableitung((x) => x * x, x0, 1e-6)) * GRAD, be = Math.atan(mg) * GRAD, diff = Math.abs(al - be), ga = diff <= 90 ? diff : 180 - diff;
    return { richtig: ga, toleranz: TW, pruefe: () => pruefe(nahe(polyFn(g)(x0), y0, 1e-9) && nahe(x0 * x0, y0, 1e-9), "A11: P liegt nicht auf beiden Graphen"),
      falsch: [[diff > 90 ? diff : NaN, "Der Schnittwinkel ist der kleinere"], [mg === 0 ? NaN : Math.abs(al), "nur der Steigungswinkel der Parabel"], [Math.abs(Math.atan(2 * x0 - mg) * GRAD), "Differenz der Steigungen"]] };
  });
  await A(12, "A12 differenzierbar zusammensetzen", (q) => {
    const m = q.match(new RegExp(`f\\(x\\) = a · x² \\+ b für x ≤ ${ZAHL} und f\\(x\\) = (.+?) für x > `));
    if (!m) return null;
    const x0 = zahl(m[1]), g = liesPoly(m[2]), mm = g[1] || 0, n = g[0] || 0;
    const a = mm / (2 * x0), b = mm * x0 + n - a * x0 * x0;
    return { felder: [a, b], toleranz: T, falschFelder: [[0, mm / x0, "der Faktor 2 fehlt"], [1, mm * x0 + n, "noch a · x₀² abziehen"]] };
  });
  await A(13, "A13 Kettenregel", (q) => {
    const m = q.match(new RegExp(`f\\(x\\) = \\((.+?)\\)([²³⁴⁵])\\. Berechne f′\\(${ZAHL}\\)`));
    if (!m) return null;
    const g = liesPoly(m[1]), n = HOCH[m[2]], x0 = zahl(m[3]), a = g[1] || 0, u = polyFn(g)(x0);
    const f = (x) => polyFn(g)(x) ** n;
    return { richtig: ableitung(f, x0, 1e-6), toleranz: Math.max(T, 1e-6 * Math.abs(ableitung(f, x0, 1e-6))), falsch: [[n * u ** (n - 1), "Die innere Ableitung fehlt"], [u ** n, "Funktionswert"], [n * a * u ** n, "der Exponent wird um 1 kleiner"]] };
  });
  await A(14, "A14 Produktregel", (q) => {
    const m = q.match(new RegExp(`f\\(x\\) = \\((.+?)\\) · \\((.+?)\\)\\. Berechne f′\\(${ZAHL}\\)`));
    if (!m) return null;
    const U = polyFn(liesPoly(m[1])), V = polyFn(liesPoly(m[2])), x0 = zahl(m[3]);
    const du = ableitung(U, x0, 1e-5), dv = ableitung(V, x0, 1e-5);
    return { richtig: ableitung((x) => U(x) * V(x), x0, 1e-5), toleranz: T, falsch: [[du * dv, "ist nicht u′ · v′"], [du * V(x0), "nur der erste Summand"], [U(x0) * V(x0), "Funktionswert"]] };
  });
  await A(15, "A15 Tangenten von außen", (q) => {
    const m = q.match(new RegExp(`Q\\(${ZAHL} \\| ${ZAHL}\\) aus werden die beiden Tangenten an den Graphen von f\\(x\\) = (.+?) gelegt`));
    if (!m) return null;
    const u = zahl(m[1]), v = zahl(m[2]), a = liesPoly(m[3])[2];
    // Tangente in x₀ durch Q: v = f(x₀) + f′(x₀)(u − x₀) ⟺ a·x₀² − 2a·u·x₀ + v = 0.
    const D = u * u - v / a, x1 = u - Math.sqrt(D), x2 = u + Math.sqrt(D);
    const geht = (x0) => nahe(a * x0 * x0 + 2 * a * x0 * (u - x0), v, 1e-9);
    return { felder: [x1, x2], toleranz: T, pruefe: () => pruefe(geht(x1) && geht(x2), "A15: Die Tangenten gehen nicht durch Q"), falschFelder: [[0, u, "Q liegt nicht auf der Parabel"], [1, u, "Q liegt nicht auf der Parabel"]] };
  });
  await A(16, "A16 Parabel aus Bedingungen", (q) => {
    const m = q.match(new RegExp(`durch P\\(0 \\| ${ZAHL}\\), hat an der Stelle ${ZAHL} die Steigung ${ZAHL} und an der Stelle ${ZAHL} eine waagerechte Tangente`));
    if (!m) return null;
    const c = zahl(m[1]), x1 = zahl(m[2]), m1 = zahl(m[3]), x2 = zahl(m[4]);
    const a = m1 / (2 * (x1 - x2)), b = -2 * a * x2;
    return { felder: [a, b, c], toleranz: T, falschFelder: [[0, 2 * a, "der Faktor 2 gehört zu a"], [1, b === 0 ? NaN : -b, "Vorzeichen"]] };
  });
  await A(17, "A17 Durchschnitt und Augenblick", (q) => {
    const m = q.match(new RegExp(`s\\(t\\) = (.+?) Meter zurückgelegt\\. a\\) .*zwischen t = ${ZAHL} s und t = ${ZAHL} s`));
    if (!m) return null;
    const k = liesPoly(m[1], "t"), s = polyFn(k), t1 = zahl(m[2]), t2 = zahl(m[3]);
    const vq = (s(t2) - s(t1)) / (t2 - t1), a = k[2], v0 = k[1] || 0, ts = (vq - v0) / (2 * a);
    return { felder: [vq, ts], toleranz: T, pruefe: () => pruefe(nahe(ableitung(s, ts, 1e-5), vq, 1e-6), "A17: Zur nachgerechneten Zeit ist die Geschwindigkeit nicht v̄"),
      falschFelder: [[0, s(t2) - s(t1), "zurückgelegte Weg"], [0, t1 === 0 ? NaN : s(t2) / t2, "Durchschnitt ab t = 0"], [1, v0 === 0 ? NaN : vq / (2 * a), "gehört dazu"]] };
  });
  await A(18, "A18 biquadratisch", (q) => {
    const m = q.match(/f\(x\) = (.+?)\. Der Graph ist achsensymmetrisch zur y-Achse und hat zwei (Tiefpunkt|Hochpunkt)e\. Bestimme den rechten/);
    if (!m) return null;
    const k = liesPoly(m[1]), f = polyFn(k), xr = Math.sqrt(-k[2] / (2 * k[4]));
    const typ = ableitung(f, xr - 0.01) < 0 && ableitung(f, xr + 0.01) > 0 ? "Tiefpunkt" : "Hochpunkt";
    const c = k[0] || 0;
    return { felder: [xr, f(xr)], toleranz: T, pruefe: () => pruefe(typ === m[2], `A18: Am rechten Extrempunkt liegt ein ${typ}, die Aufgabe sagt ${m[2]}`),
      falschFelder: [[0, xr === 1 ? NaN : xr * xr, "Das ist x², nicht x"], [1, c, "Das ist f(0)"], [1, c === 0 ? NaN : f(xr) - c, "Das Absolutglied"]] };
  });
  await A(19, "A19 Tangente schneidet wieder", (q) => {
    const m = q.match(new RegExp(`f\\(x\\) = (.+?) im Punkt mit x₀ = ${ZAHL} schneidet den Graphen`));
    if (!m) return null;
    const k = liesPoly(m[1]), f = polyFn(k), x0 = zahl(m[2]);
    const s = ableitung(f, x0, 1e-6), t = (x) => f(x0) + s * (x - x0);
    // Unabhängig: f − t hat bei x₀ eine doppelte Nullstelle; die dritte liefert der Satz von Vieta
    // (Summe der Nullstellen = −Koeffizient von x² : Leitkoeffizient).
    const xs = -(k[2] || 0) / k[3] - 2 * x0;
    return { felder: [xs, f(xs)], toleranz: T, pruefe: () => pruefe(nahe(f(xs), t(xs), 1e-5) && Math.abs(xs - x0) > 1e-6, "A19: Der nachgerechnete Punkt liegt nicht auf der Tangente"),
      falschFelder: [[0, x0, "Das ist der Berührpunkt selbst"], [0, 2 * x0, "prüfe die verbleibende Nullstelle"], [0, -x0, "prüfe die verbleibende Nullstelle"], [1, f(x0), "Höhe des Berührpunkts"]] };
  });
  await A(20, "A20 Kettenregel und Tangente", (q) => {
    const m = q.match(new RegExp(`f\\(x\\) = √\\((.+?)\\)\\. Bestimme die Tangente an den Graphen im Punkt mit x₀ = ${ZAHL}`));
    if (!m) return null;
    const g = liesPoly(m[1]), x0 = zahl(m[2]), a = g[1] || 0;
    const f = (x) => Math.sqrt(polyFn(g)(x)), s = ableitung(f, x0, 1e-6), b = f(x0) - s * x0;
    return { felder: [s, b], toleranz: T, falschFelder: [[0, a === 1 ? NaN : 1 / (2 * f(x0)), "Die innere Ableitung fehlt"], [1, f(x0), "nicht der Achsenabschnitt"]] };
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
      await mittlere(page);
      await lokal(page);
      await mikroskop(page);
      await grafisch(page);
      await quadrat(page);
      await regeln(page);
      await sinus(page);
      await produktKette(page);
      await tangente(page);
      await differenzierbar(page);
      await ganzrational(page);
      await nullstellen(page);
      await monotonie(page);
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
