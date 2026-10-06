// Fachliche Prüfung: MSS 11, Analysis, Thema 4 „Integralrechnung“.
//
// Geprüft wird, was die Seite zeigt, gegen eine unabhängige Rechnung. Integrale bestimmt die Prüfung
// NICHT mit den Stammfunktionen der Seite, sondern numerisch (Simpson-Regel, Nullstellen über
// Vorzeichenwechsel und Bisektion). Eine falsch aufgeleitete Formel auf der Seite fiele so auf.
//
//   * Gerüst: Abschnittsfolge und Nummern, Verweise und Sprungmarken, Menükarte, Formelsammlung,
//     Verweise von Thema 2 und 3 auf diese Seite, kein Vorgriff auf die Stammfunktion vor dem
//     Hauptsatz;
//   * jede Zeichnung wird aus dem SVG zurückgelesen (Maßstab aus den Gitterlinien mit data-wert):
//     Flächenstücke werden mit der Gaußschen Trapezformel nachgemessen und müssen das richtige
//     Vorzeichen tragen, Streifen, Rechtecke und Scheiben werden einzeln nachgerechnet;
//   * die Bilanzen werden gegen die unabhängige Rechnung gelesen;
//   * Kontrollfragen, Selbsteinschätzung und alle zwanzig Aufgaben — jede von beiden Seiten.

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
const SEITE = "/mathematik/mss11/01-analysis/05-integralrechnung/index.html";
const WURZEL = path.resolve(__dirname, "..", "..");
const nahe = (a, b, tol = 1e-6) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= tol;

// ---------- Numerik ----------
const abl = (f, x, h = 1e-5) => (f(x + h) - f(x - h)) / (2 * h);
// Simpson-Regel; für Polynome bis Grad 3 exakt, sonst sehr genau.
function integral(f, a, b, n = 2000) {
  if (a === b) return 0;
  const h = (b - a) / n;
  let s = f(a) + f(b);
  for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(a + i * h);
  return (s * h) / 3;
}
// Einfache Nullstellen von g auf [lo, hi] (Vorzeichenwechsel, dann Bisektion).
function vzw(g, lo, hi, n = 3000) {
  const h = (hi - lo) / n, aus = [];
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
// Flächeninhalt zwischen f und der x-Achse: an den Nullstellen teilen, Beträge addieren.
function flaecheBetrag(f, a, b) {
  const g = [a, ...vzw(f, a, b).filter((z) => z > a + 1e-9 && z < b - 1e-9), b];
  let A = 0;
  for (let i = 0; i + 1 < g.length; i++) A += Math.abs(integral(f, g[i], g[i + 1]));
  return A;
}
// Lösung von G(x) = ziel für steigendes G auf [lo, hi].
function loese(G, ziel, lo, hi) {
  for (let k = 0; k < 100; k++) { const m = (lo + hi) / 2; if (G(m) < ziel) lo = m; else hi = m; }
  return (lo + hi) / 2;
}

async function waehle(page, id, wert) {
  await page.selectOption("#" + id, wert);
}
async function spanWert(page, sel) {
  return zahl(await page.evaluate((s) => (document.querySelector(s) || {}).textContent || "", sel));
}
async function spanText(page, sel) {
  return page.evaluate((s) => (document.querySelector(s) || {}).innerText || "", sel);
}
// Eine Zeile einer Bilanz (getrennt durch <br>) als Klartext. innerText taugt dafür nicht: Die
// übereinandergesetzten Integralgrenzen erzeugen eigene Zeilenumbrüche.
async function bilanzZeile(page, sel, i) {
  return page.evaluate(([s, k]) => {
    const t = document.createElement("div");
    t.innerHTML = (document.querySelector(s).innerHTML.split(/<br\s*\/?>/)[k] || "");
    return t.textContent;
  }, [sel, i]);
}
// Die letzte Zahl eines Elements (etwa „16π/3 ≈ 16,7552“ → 16,7552).
async function letzteZahl(page, sel) {
  const z = zahlen(await spanText(page, sel));
  return z.length ? z[z.length - 1] : NaN;
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
      pfade: [...svg.querySelectorAll("path[data-rolle]")].map((p) => ({ rolle: p.dataset.rolle, klasse: p.getAttribute("class") || "", punkte: paare(p.getAttribute("d")).map(([a, b]) => [X(a), Y(b)]) })),
      vielecke: [...svg.querySelectorAll("polygon[data-rolle]")].map((p) => ({ rolle: p.dataset.rolle, vz: p.dataset.vorzeichen, klasse: p.getAttribute("class") || "",
        punkte: p.getAttribute("points").trim().split(/\s+/).map((t) => t.split(",").map(Number)).map(([a, b]) => [X(a), Y(b)]) })),
      kreise: [...svg.querySelectorAll("circle")].map((c) => ({ x: X(n(c, "cx")), y: Y(n(c, "cy")), klasse: c.getAttribute("class") || "", daten: { ...c.dataset } })),
      linien: [...svg.querySelectorAll("line[data-rolle]")].map((l) => ({ rolle: l.dataset.rolle, x1: X(n(l, "x1")), y1: Y(n(l, "y1")), x2: X(n(l, "x2")), y2: Y(n(l, "y2")) })),
      rechtecke: [...svg.querySelectorAll("rect[data-rolle]")].map((r) => ({ rolle: r.dataset.rolle, k: r.dataset.k, x1: X(n(r, "x")), x2: X(n(r, "x") + n(r, "width")), y1: Y(n(r, "y") + n(r, "height")), y2: Y(n(r, "y")) })),
    };
  }, sel);
}
const linie = (d, rolle) => d.linien.find((l) => l.rolle === rolle);
const kreise = (d, rolle) => d.kreise.filter((k) => k.daten.rolle === rolle);
const kreis = (d, rolle) => kreise(d, rolle)[0];
const steigung = (l) => (l.y2 - l.y1) / (l.x2 - l.x1);
const aufGerade = (l, x) => l.y1 + steigung(l) * (x - l.x1);
const vielecke = (d, rolle) => d.vielecke.filter((v) => v.rolle === rolle);
// Gaußsche Trapezformel — vorzeichenloser Inhalt eines Vielecks.
function gauss(p) {
  let s = 0;
  for (let i = 0; i < p.length; i++) { const [x1, y1] = p[i], [x2, y2] = p[(i + 1) % p.length]; s += x1 * y2 - x2 * y1; }
  return Math.abs(s) / 2;
}
// Orientierte Summe der Flächenstücke: Inhalt mal Vorzeichen.
const orientiert = (stuecke) => stuecke.reduce((s, v) => s + (v.vz === "-" ? -1 : 1) * gauss(v.punkte), 0);
// Toleranz für gemessene Flächen: Koordinaten sind auf 0,01 Bildpunkte gerundet, die Ränder sind
// Sehnenzüge — beides zusammen bleibt weit unter einem Promille.
const tolFlaeche = (A, d) => 2e-3 * (1 + Math.abs(A)) + 0.5 / (d.proX * d.proY) * 100;
// Alle Punkte der Pfade mit dieser Rolle müssen auf f liegen (Toleranz: 1,5 Bildpunkte).
// Die Koordinaten sind auf 0,01 Bildpunkte gerundet; wo der Graph steil ist (1/x² nahe 0), wird
// daraus in y ein merklicher Fehler — die Toleranz wächst deshalb mit der Steigung.
// Am Rand des Definitionsbereichs (√x bei 0) gibt es keine zentrale Differenz — dort die einseitige.
const steil = (f, x) => { const s = abl(f, x); return Number.isFinite(s) ? Math.abs(s) : Math.abs((f(x + 1e-4) - f(x)) / 1e-4); };
const tolY = (d, f, x) => 1.5 / d.proY + steil(f, x) * (0.02 / d.proX) + 1e-6;
function pfadAuf(d, rolle, f, wo) {
  const p = d.pfade.filter((q) => q.rolle === rolle);
  pruefe(p.length > 0, `${wo}: kein Pfad „${rolle}“`);
  let schlecht = 0, beispiel = "";
  for (const q of p) for (const [x, y] of q.punkte) if (!nahe(y, f(x), tolY(d, f, x))) { schlecht++; beispiel = `(${x.toFixed(3)} | ${y.toFixed(3)}) statt ${f(x).toFixed(3)}`; }
  pruefe(schlecht === 0, `${wo}: ${schlecht} Punkte von „${rolle}“ liegen nicht auf dem Graphen, z. B. ${beispiel}`);
}
// Jedes Flächenstück liegt zwischen f und g, und sein Vorzeichen ist das von f − g im Inneren.
function stueckeZwischen(d, rolle, f, g, wo) {
  let schlecht = 0, beispiel = "";
  for (const v of vielecke(d, rolle)) {
    for (const [x, y] of v.punkte) {
      if (!nahe(y, f(x), tolY(d, f, x)) && !nahe(y, g(x), tolY(d, g, x))) { schlecht++; beispiel = `(${x.toFixed(3)} | ${y.toFixed(3)})`; }
      const diff = f(x) - g(x);
      if (Math.abs(diff) > 0.05 && (diff > 0) !== (v.vz === "+")) { schlecht++; beispiel = `Vorzeichen „${v.vz}“ bei x = ${x.toFixed(3)}, f − g = ${diff.toFixed(3)}`; }
    }
  }
  pruefe(schlecht === 0, `${wo}: Flächenstücke „${rolle}“ falsch, z. B. ${beispiel}`);
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
const polyAbl = (k) => Object.fromEntries(Object.entries(k).filter(([e]) => Number(e) > 0).map(([e, c]) => [Number(e) - 1, c * Number(e)]));
const grad = (k) => Math.max(...Object.keys(k).map(Number).filter((e) => Math.abs(k[e]) > 1e-12));

// ---------- Gerüst ----------
const ABSCHNITTE = ["sec-rekonstruktion", "sec-summen", "sec-integral", "sec-integralfunktion", "sec-hauptsatz", "sec-stammfunktion",
  "sec-flaeche", "sec-zwischen", "sec-mittelwert", "sec-uneigentlich", "sec-rotation", "sec-stolperstelle"];
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
  pruefe(/data-section="mss11" href="05-integralrechnung\/index.html" hidden/.test(menue), "Menü: Karte für die Integralrechnung fehlt oder ist nicht mit data-section/hidden versehen");
  pruefe(/<h2>4 Integralrechnung/.test(menue), "Menü: Die Karte trägt nicht die Nummer 4");
  for (const t of ["03-differentialrechnung", "04-funktionsuntersuchung"]) {
    const h = fs.readFileSync(path.join(WURZEL, `mathematik/mss11/01-analysis/${t}/index.html`), "utf-8");
    pruefe(h.includes("../05-integralrechnung/index.html"), `Vernetzung: ${t} verweist nicht auf die Integralrechnung`);
  }
  // Kein Vorgriff: Die Stammfunktion kommt mit dem Hauptsatz in Abschnitt 5. Vorher darf weder
  // der Text noch eine Bilanz mit F rechnen — an mehreren Reglerstellungen, denn die Bilanzen ändern sich.
  for (const art of ["kubik", "para", "sinus"]) {
    await waehle(page, "in-art", art);
    for (const [a, b] of [[-1, 2], [2, -1], [0, 0]]) {
      await setzeRegler(page, "in-a", a);
      await setzeRegler(page, "in-b", b);
      const vorher = await page.evaluate((ids) => ids.map((id) => document.getElementById(id).innerText).join(" "), ABSCHNITTE.slice(0, 4));
      pruefe(!/Stammfunktion|\bF\(|\bF′|Hauptsatz/.test(vorher), `Gerüst: Abschnitte 1–4 greifen auf die Stammfunktion vor (${art}, a = ${a}, b = ${b})`);
    }
  }
  const haupt = await page.evaluate(() => document.querySelector("main").innerText);
  pruefe(!/\bln\s*\(|\blog\b|\blg\b/.test(haupt), "Gerüst: Die Seite rechnet mit einem Logarithmus, der erst später kommt");
}

// ---------- 1. Rekonstruktion ----------
async function rekonstruktion(page) {
  const MODELL = {
    becken: { r: (t) => (t < 2 ? 3 : t < 4 ? -1 : 2), B0: 5, ts: [0, 0.5, 1.75, 2, 2.25, 3, 4, 4.5, 6] },
    auto: { r: (t) => 2 * t, B0: 0, ts: [0, 1, 2.5, 4, 6] },
  };
  for (const [art, m] of Object.entries(MODELL)) {
    await waehle(page, "re-art", art);
    for (const tw of m.ts) {
      const t = await setzeRegler(page, "re-t", tw);
      const wo = `Rekonstruktion ${art}, t = ${t}`;
      // Bestand aus der Rate — stückweise integriert, damit die Sprünge der Rate nicht verwischen.
      const B = (s) => m.B0 + (art === "becken" ? [[0, 2], [2, 4], [4, 6]].reduce((acc, [u, o]) => acc + (s > u ? m.r(u) * (Math.min(o, s) - u) : 0), 0) : integral(m.r, 0, s));
      const D1 = await lies(page, '#re-mount svg[data-panel="rate"]');
      const D2 = await lies(page, '#re-mount svg[data-panel="bestand"]');
      const st = vielecke(D1, "flaeche");
      pruefe(nahe(orientiert(st), B(t) - m.B0, tolFlaeche(B(t), D1)), `${wo}: orientierte Fläche unter der Rate ${orientiert(st).toFixed(4)} statt ${B(t) - m.B0}`);
      if (art === "auto") stueckeZwischen(D1, "flaeche", m.r, () => 0, wo);
      else {
        // Die Rate springt; jedes Rechteck gehört zu genau einer Stufe und hat deren Höhe und Vorzeichen.
        const falsch = st.filter((v) => {
          const xs = v.punkte.map(([x]) => x), u = Math.min(...xs), o = Math.max(...xs), h = m.r((u + o) / 2);
          return !v.punkte.every(([, y]) => nahe(y, 0, 0.02) || nahe(y, h, 0.02)) || (h > 0) !== (v.vz === "+") || ![0, 2, 4].some((g) => nahe(u, g, 0.01)) || !nahe(o, Math.min(u + 2, t), 0.01);
        });
        pruefe(falsch.length === 0, `${wo}: ${falsch.length} Rechtecke passen nicht zu ihrer Stufe der Rate`);
      }
      pruefe(st.every((v) => v.punkte.every(([x]) => x <= t + 0.01)), `${wo}: Flächenstücke reichen über t hinaus`);
      const z = linie(D1, "zeit");
      pruefe(z && nahe(z.x1, t, 0.01) && nahe(z.x2, t, 0.01), `${wo}: Zeitmarke nicht bei t`);
      pfadAuf(D2, "bestand-ganz", B, `${wo}, Bestandskurve`);
      const p = kreis(D2, "p");
      pruefe(p && nahe(p.x, t, 0.01) && nahe(p.y, B(t), 0.03), `${wo}: Punkt auf der Bestandskurve falsch`);
      pruefe(nahe(await spanWert(page, "#re-bilanz .wa"), B(t), 1e-4), `${wo}: Bilanz ${await spanWert(page, "#re-bilanz .wa")} statt ${B(t)}`);
      // Zu jedem Vorgang gehört seine eigene Beschreibung und ein Text, der zur Reglerstellung passt.
      const vorgang = await spanText(page, "#re-vorgang"), erkl = await spanText(page, "#re-text");
      pruefe(vorgang.startsWith(art === "becken" ? "Becken:" : "Auto:"), `${wo}: Beschreibung passt nicht zum Vorgang — „${vorgang}“`);
      if (art === "auto" && t > 0) pruefe(zahlen(erkl).some((z) => nahe(z, t * t, 1e-9)) && /Dreieck/.test(erkl), `${wo}: Der Text nennt den Weg s(t) = ${t * t} nicht — „${erkl}“`);
    }
  }
}

// ---------- 2. Unter- und Obersummen ----------
async function summen(page) {
  for (const bw of [0.5, 1, 2, 3]) {
    const b = await setzeRegler(page, "su-b", bw);
    for (const nw of [1, 2, 4, 7, 20, 50]) {
      const n = await setzeRegler(page, "su-n", nw);
      const wo = `Summen b = ${b}, n = ${n}`;
      const f = (x) => x * x, dx = b / n;
      const D = await lies(page, "#su-mount svg");
      const ober = D.rechtecke.filter((r) => r.rolle === "ober"), unter = D.rechtecke.filter((r) => r.rolle === "unter");
      pruefe(ober.length === n && unter.length === n, `${wo}: ${ober.length}/${unter.length} Rechtecke statt ${n}`);
      let U = 0, O = 0, schlecht = 0;
      for (let k = 0; k < n; k++) {
        const u = k * dx, o = (k + 1) * dx;
        // Kleinster und größter Wert im Streifen — numerisch gesucht, nicht als „links/rechts“ angenommen.
        let lo = Infinity, hi = -Infinity;
        for (let i = 0; i <= 50; i++) { const y = f(u + (dx * i) / 50); lo = Math.min(lo, y); hi = Math.max(hi, y); }
        U += lo * dx; O += hi * dx;
        const ro = ober.find((r) => r.k === String(k)), ru = unter.find((r) => r.k === String(k));
        const tolY = 1.5 / D.proY;
        if (!ro || !nahe(ro.x1, u, 0.01) || !nahe(ro.x2, o, 0.01) || !nahe(ro.y2, hi, tolY) || !nahe(ro.y1, 0, tolY)) schlecht++;
        if (!ru || !nahe(ru.x1, u, 0.01) || !nahe(ru.x2, o, 0.01) || !nahe(ru.y2, lo, tolY) || !nahe(ru.y1, 0, tolY)) schlecht++;
      }
      pruefe(schlecht === 0, `${wo}: ${schlecht} Rechtecke haben nicht die Höhe des kleinsten bzw. größten Funktionswerts`);
      pruefe(nahe(await spanWert(page, "#su-bilanz .wa"), U, 1e-4), `${wo}: Untersumme ${await spanWert(page, "#su-bilanz .wa")} statt ${U}`);
      pruefe(nahe(await spanWert(page, "#su-bilanz .wo"), O, 1e-4), `${wo}: Obersumme ${await spanWert(page, "#su-bilanz .wo")} statt ${O}`);
      pfadAuf(D, "graph", f, wo);
    }
  }
}

// ---------- 3. Bestimmtes Integral ----------
const IN = { kubik: (x) => 0.5 * x ** 3 - 1.5 * x, para: (x) => x * x - 1, sinus: Math.sin };
async function bestimmtesIntegral(page) {
  const paare = [[-1, 2], [0, 3], [-3, 3], [-2, 0], [2, -1], [1, 1], [0, 1.75], [-3, -2]];
  for (const [art, f] of Object.entries(IN)) {
    await waehle(page, "in-art", art);
    for (const [aw, bw] of paare) {
      const a = await setzeRegler(page, "in-a", aw), b = await setzeRegler(page, "in-b", bw);
      const wo = `Integral ${art}, a = ${a}, b = ${b}`;
      const I = integral(f, a, b);
      const D = await lies(page, "#in-mount svg");
      const st = vielecke(D, "flaeche");
      // Die Stücke liegen über [min; max]; orientiert nach links→rechts gemessen.
      const J = integral(f, Math.min(a, b), Math.max(a, b));
      pruefe(nahe(orientiert(st), J, tolFlaeche(J, D)), `${wo}: orientierte Fläche ${orientiert(st).toFixed(4)} statt ${J.toFixed(4)}`);
      stueckeZwischen(D, "flaeche", f, () => 0, wo);
      pruefe(nahe(await spanWert(page, "#in-bilanz .wc"), I, 1e-4), `${wo}: Bilanz ${await spanWert(page, "#in-bilanz .wc")} statt ${I}`);
      pruefe(nahe(linie(D, "grenze-a").x1, a, 0.01) && nahe(linie(D, "grenze-b").x1, b, 0.01), `${wo}: Grenzen falsch gezeichnet`);
      pfadAuf(D, "graph", f, wo);
    }
  }
  await waehle(page, "in-art", "kubik");
  await setzeRegler(page, "in-a", -1);
  await setzeRegler(page, "in-b", 2);
}

// ---------- 4. Integralfunktion ----------
async function integralfunktion(page) {
  const f = (t) => 1.5 * t * t - 1.5;
  for (const aw of [-2, -1, 0, 0.5, 1]) {
    const a = await setzeRegler(page, "if-a", aw);
    for (const xw of [-2, -1, -0.25, 0, 1, 1.5, 2]) {
      const x = await setzeRegler(page, "if-x", xw);
      const wo = `Integralfunktion a = ${a}, x = ${x}`;
      const I = (s) => integral(f, a, s, 200);
      const D1 = await lies(page, '#if-mount svg[data-panel="f"]');
      const D2 = await lies(page, '#if-mount svg[data-panel="I"]');
      pfadAuf(D1, "graph", f, `${wo}, f`);
      pfadAuf(D2, "integralfunktion", I, `${wo}, Iₐ`);
      const st = vielecke(D1, "flaeche");
      stueckeZwischen(D1, "flaeche", f, () => 0, wo);
      const gemessen = orientiert(st) * (x >= a ? 1 : -1);
      pruefe(nahe(gemessen, I(x), tolFlaeche(I(x), D1)), `${wo}: Fläche ${gemessen.toFixed(4)} statt Iₐ(x) = ${I(x).toFixed(4)}`);
      const t = linie(D2, "tangente");
      pruefe(t && nahe(steigung(t), f(x), 1e-3) && nahe(aufGerade(t, x), I(x), 0.02), `${wo}: Tangente an Iₐ hat nicht die Steigung f(x) = ${f(x)}`);
      pruefe(nahe(steigung(t), abl(I, x), 1e-3), `${wo}: Tangentensteigung ist nicht die gemessene Steigung von Iₐ`);
      const p = kreis(D2, "p-I"), n = kreis(D2, "nullstelle-a");
      pruefe(p && nahe(p.x, x, 0.01) && nahe(p.y, I(x), 0.02), `${wo}: Punkt auf Iₐ falsch`);
      pruefe(n && nahe(n.x, a, 0.01) && nahe(n.y, 0, 0.02), `${wo}: Iₐ(a) = 0 nicht markiert`);
      pruefe(nahe(await spanWert(page, "#if-bilanz .wa"), I(x), 1e-4), `${wo}: Bilanz Iₐ(x) falsch`);
      pruefe(nahe(await spanWert(page, "#if-bilanz .wr"), f(x), 1e-4), `${wo}: Bilanz Steigung falsch`);
    }
  }
}

// ---------- 5. Hauptsatz ----------
async function hauptsatz(page) {
  const f = (x) => 0.5 * x * x + 1;
  for (const xw of [0, 0.5, 1, 2, 2.5]) {
    const x = await setzeRegler(page, "hs-x", xw);
    for (let k = 0; k <= 5; k++) {
      await setzeRegler(page, "hs-h", k);
      const h = zahl(await spanText(page, "#hs-h-anzeige"));
      const wo = `Hauptsatz x = ${x}, h = ${h}`;
      const D = await lies(page, "#hs-mount svg");
      const streifen = integral(f, x, x + h);
      const st = vielecke(D, "streifen");
      pruefe(nahe(orientiert(st), streifen, tolFlaeche(streifen, D)), `${wo}: Streifen ${orientiert(st).toFixed(5)} statt ${streifen.toFixed(5)}`);
      const bis = vielecke(D, "flaeche-bis-x");
      pruefe(nahe(orientiert(bis), integral(f, 0, x), tolFlaeche(integral(f, 0, x), D)), `${wo}: Fläche bis x falsch`);
      const ru = D.rechtecke.find((r) => r.rolle === "rechteck-unten"), ro = D.rechtecke.find((r) => r.rolle === "rechteck-oben");
      const tolY = 1.5 / D.proY;
      pruefe(ru && nahe(ru.x1, x, 0.01) && nahe(ru.x2, x + h, 0.01) && nahe(ru.y2, f(x), tolY), `${wo}: unteres Rechteck hat nicht die Höhe f(x)`);
      pruefe(ro && nahe(ro.x1, x, 0.01) && nahe(ro.x2, x + h, 0.01) && nahe(ro.y2, f(x + h), tolY), `${wo}: oberes Rechteck hat nicht die Höhe f(x + h)`);
      const q = streifen / h;
      pruefe(f(x) <= q + 1e-12 && q <= f(x + h) + 1e-12, `${wo}: Der Quotient liegt nicht zwischen f(x) und f(x + h)`);
      pruefe(nahe(await spanWert(page, "#hs-bilanz .wc"), f(x), 1e-6), `${wo}: Bilanz f(x) falsch`);
      pruefe(nahe(await spanWert(page, "#hs-bilanz .wr"), q, 2e-6), `${wo}: Bilanz Differenzenquotient ${await spanWert(page, "#hs-bilanz .wr")} statt ${q}`);
    }
  }
}

// ---------- 6. Stammfunktionen ----------
async function stammfunktion(page) {
  // f je Beispiel und der Wert der gezeichneten Stammfunktion bei 0 für C = 0 (−cos 0 = −1).
  const ARTEN = {
    para: { f: (x) => x * x - 1, F0: 0 },
    linear: { f: (x) => 2 * x + 1, F0: 0 },
    kubik: { f: (x) => x ** 3 - 3 * x, F0: 0 },
    sinus: { f: Math.sin, F0: -1 },
    kette: { f: (x) => Math.cos(2 * x), F0: 0 },
  };
  for (const [art, { f, F0 }] of Object.entries(ARTEN)) {
    await waehle(page, "sf-art", art);
    for (const cw of [-2, -0.5, 0, 1.5]) {
      const C = await setzeRegler(page, "sf-c", cw);
      for (const xw of [-2, -0.5, 0, 1.5, 2]) {
        const x0 = await setzeRegler(page, "sf-x", xw);
        const wo = `Stammfunktion ${art}, C = ${C}, x₀ = ${x0}`;
        const D1 = await lies(page, '#sf-mount svg[data-panel="F"]');
        const D2 = await lies(page, '#sf-mount svg[data-panel="f"]');
        // Die gezeichnete Stammfunktion: Ihre Steigung (aus den Bildpunkten) muss f sein.
        const F = D1.pfade.filter((p) => p.rolle === "stamm").flatMap((p) => p.punkte);
        let schlecht = 0;
        for (let i = 0; i + 1 < F.length; i++) {
          const [x1, y1] = F[i], [x2, y2] = F[i + 1];
          if (x2 - x1 < 1e-6) continue;
          // Rundung der Bildpunkte auf 0,01: Bei steilem Bildmaßstab streut die Sekantensteigung etwas mehr.
          if (!nahe((y2 - y1) / (x2 - x1), f((x1 + x2) / 2), 0.05 + 0.02 / (D1.proY * (x2 - x1)))) schlecht++;
        }
        pruefe(F.length > 100 && schlecht === 0, `${wo}: Die gezeichnete Stammfunktion hat an ${schlecht} Stellen nicht die Steigung f`);
        const beiNull = F.reduce((b, p) => (Math.abs(p[0]) < Math.abs(b[0]) ? p : b), [Infinity, 0]);
        pruefe(nahe(beiNull[1], F0 + C, 0.02), `${wo}: F(0) = ${beiNull[1].toFixed(3)} statt ${F0 + C}`);
        pruefe(nahe(zahlen(await bilanzZeile(page, "#sf-bilanz", 1)).slice(-1)[0], F0 + C, 1e-4), `${wo}: Die Bilanz nennt F(0) falsch`);
        // Die Schar: jede Kurve ist die gezeichnete Stammfunktion, um eine Konstante verschoben.
        const Ff = (x) => integral(f, 0, x, 200) + F0 + C;
        pfadAuf(D1, "stamm", Ff, wo);
        const schar = D1.pfade.filter((p) => p.rolle === "schar");
        pruefe(schar.length >= 4, `${wo}: nur ${schar.length} weitere Stammfunktionen`);
        for (const sc of schar) {
          const d = sc.punkte.map(([x, y]) => y - Ff(x));
          pruefe(Math.max(...d) - Math.min(...d) < 3 / D1.proY, `${wo}: Eine Scharkurve ist keine Verschiebung in y-Richtung`);
        }
        const t = linie(D1, "tangente");
        pruefe(t && nahe(steigung(t), f(x0), 1e-3) && nahe(aufGerade(t, x0), Ff(x0), 0.02), `${wo}: Tangente falsch`);
        for (const ts of D1.linien.filter((l) => l.rolle === "tangente-schar")) pruefe(nahe(steigung(ts), f(x0), 0.01), `${wo}: Tangentenstück der Schar nicht parallel`);
        pfadAuf(D2, "graph", f, `${wo}, f`);
        pruefe(nahe(await spanWert(page, "#sf-bilanz .wr"), f(x0), 1e-4), `${wo}: Bilanz F′(x₀) falsch`);
      }
    }
  }
  await waehle(page, "sf-art", "para");
}

// ---------- 6b. Selbsttest Stammfunktion ----------
// Je Aufgabe eine richtige Stammfunktion (von der Prüfung selbst aufgeleitet) und typische Fehler.
// Die Seite muss die richtige — auch mit + C — anerkennen und jeden Fehler mit seinem Hinweis zurückweisen.
async function selbsttest(page) {
  const urteil = async (aufgabe, F, f) => {
    await page.selectOption("#pr-aufgabe", aufgabe);
    if (f !== undefined) await page.fill("#pr-f", f);
    await page.fill("#pr-F", F);
    await page.click("#pr-pruefen");
    return (await page.locator("#pr-ergebnis").innerText()).replace(/\s+/g, " ");
  };
  const FAELLE = [
    // [Aufgabe, richtige Stammfunktion, Ableitung von f, f selbst, Faktor-Fehler, Vorzeichen-Fehler]
    ["0", "2x^3 − 2x^2 + x", "12x − 4", "6x^2 − 4x + 1", "6x^3 − 6x^2 + 3x", "−2x³ + 2x² − x"],
    ["1", "x^4/4", "3x^2", "x^3", "x^4", "−x^4/4"],
    ["2", "−1/x", "−2/x^3", "1/x^2", "−2/x", "1/x"],
    ["3", "2/3 · x^(3/2)", "1/(2√x)", "√x", "x^1,5", "−2/3 x√x"],
    ["4", "−cos(x) + 2x", "cos(x)", "sin(x) + 2", "−2cos(x) + 4x", "cos(x) − 2x"],
    ["5", "(3x + 1)^3 / 9", "6(3x + 1)", "(3x+1)^2", "(3x + 1)^3 / 3", "−(3x + 1)³/9"],
    ["6", "sin(2x)/2", "−2 sin(2x)", "cos(2x)", "sin(2x)", "−0,5 sin(2x)"],
  ];
  for (const [a, richtig, abl, selbst, faktor, minus] of FAELLE) {
    const wo = `Selbsttest Aufgabe ${a}`;
    for (const F of [richtig, `${richtig} + 7`, `${richtig} − 2,5`]) {
      const r = await urteil(a, F);
      pruefe(r.includes("✓ Richtig"), `${wo}: „${F}“ wird nicht anerkannt — „${r.slice(0, 160)}“`);
    }
    for (const [F, muster] of [[abl, "Ableitung"], [selbst, "Das ist f selbst"], [faktor, "Bis auf einen Faktor"], [minus, "Vorzeichenfehler"]]) {
      const r = await urteil(a, F);
      pruefe(r.includes("✗ Noch nicht") && r.includes(muster), `${wo}: „${F}“ — erwartet „${muster}“, erhalten „${r.slice(0, 160)}“`);
      pruefe(r.includes("Tipp"), `${wo}: kein Tipp bei „${F}“`);
    }
  }
  // Eigene Funktion, unlesbare Eingaben, Malpunkt-Varianten.
  pruefe((await urteil("eigen", "x³ − 2x + 4", "3x^2 − 2")).includes("✓ Richtig"), "Selbsttest: eigene Funktion 3x² − 2 nicht geprüft");
  pruefe((await urteil("eigen", "x^2", "3x^2 − 2")).includes("✗ Noch nicht"), "Selbsttest: falsche Stammfunktion zur eigenen Funktion anerkannt");
  pruefe((await urteil("eigen", "x^2", "3y")).includes("f(x) nicht lesbar"), "Selbsttest: unlesbares f nicht gemeldet");
  for (const F of ["x^^2", "2x)", "(x + 1", "y + 1", ""]) {
    const r = await urteil("0", F);
    pruefe(F === "" ? r.includes("Tippe") : r.includes("nicht lesbar"), `Selbsttest: „${F}“ nicht als unlesbar gemeldet — „${r.slice(0, 120)}“`);
  }
  for (const F of ["2·x^3 − 2·x^2 + x", "2*x³-2*x²+x", "2 x^3 - 2 x^2 + 1x"]) pruefe((await urteil("0", F)).includes("✓ Richtig"), `Selbsttest: Schreibweise „${F}“ nicht verstanden`);
  await page.selectOption("#pr-aufgabe", "0");
  await page.fill("#pr-F", "");
}

// ---------- 7. Fläche mit der x-Achse ----------
async function flaeche(page) {
  const f = (x) => 0.25 * x ** 3 - x;
  for (const aw of [-3, -2, -1, 0, 1, 2.5]) {
    const a = await setzeRegler(page, "fl-a", aw);
    for (const bw of [-2.5, -1, 0, 2, 3]) {
      const b = await setzeRegler(page, "fl-b", bw);
      const wo = `Fläche a = ${a}, b = ${b}`;
      // Regler lügen nicht: b liegt rechts von a, und die Anzeige ist der Reglerwert.
      pruefe(b >= a + 0.5 - 1e-9, `${wo}: b liegt nicht rechts von a`);
      pruefe(nahe(zahl(await spanText(page, "#fl-b-anzeige")), b, 1e-9), `${wo}: Anzeige von b weicht vom Regler ab`);
      const D = await lies(page, "#fl-mount svg");
      const st = vielecke(D, "flaeche");
      const I = integral(f, a, b), A = flaecheBetrag(f, a, b);
      stueckeZwischen(D, "flaeche", f, () => 0, wo);
      pruefe(nahe(orientiert(st), I, tolFlaeche(I, D)), `${wo}: orientierte Fläche falsch`);
      pruefe(nahe(st.reduce((s, v) => s + gauss(v.punkte), 0), A, tolFlaeche(A, D)), `${wo}: gezeichneter Flächeninhalt falsch`);
      const innen = vzw(f, a, b).filter((z) => z > a + 1e-9 && z < b - 1e-9);
      const tp = kreise(D, "teilstelle").map((k) => k.x).sort((p, q) => p - q);
      pruefe(tp.length === innen.length && tp.every((x, i) => nahe(x, innen[i], 0.01)), `${wo}: Teilstellen ${tp.map((x) => x.toFixed(2))} statt ${innen.map((x) => x.toFixed(2))}`);
      pruefe(nahe(await spanWert(page, "#fl-bilanz .wa"), A, 1e-4), `${wo}: Flächeninhalt ${await spanWert(page, "#fl-bilanz .wa")} statt ${A}`);
    }
  }
}

// ---------- 8. Fläche zwischen zwei Graphen ----------
async function zwischen(page) {
  const FN = { parabel: (x) => 4 - x * x, kubik: (x) => x ** 3 - 3 * x };
  for (const [art, f] of Object.entries(FN)) {
    await waehle(page, "zg-art", art);
    for (let mw = -3; mw <= 3; mw += 0.5) {
      const m = await setzeRegler(page, "zg-m", mw);
      const wo = `Zwischen ${art}, m = ${m}`;
      const g = (x) => m * x, d = (x) => f(x) - g(x);
      const s = vzw(d, -10, 10).sort((p, q) => p - q);
      pruefe(s.length === (art === "parabel" ? 2 : m === -3 ? 1 : 3), `${wo}: ${s.length} Schnittstellen`);
      let A = 0;
      for (let i = 0; i + 1 < s.length; i++) A += Math.abs(integral(d, s[i], s[i + 1]));
      const D = await lies(page, "#zg-mount svg");
      const gs = kreise(D, "schnitt").map((k) => k.x).sort((p, q) => p - q);
      pruefe(gs.length === s.length && gs.every((x, i) => nahe(x, s[i], 0.01)), `${wo}: Schnittpunkte ${gs.map((x) => x.toFixed(3))} statt ${s.map((x) => x.toFixed(3))}`);
      const st = vielecke(D, "flaeche");
      stueckeZwischen(D, "flaeche", f, g, wo);
      pruefe(nahe(st.reduce((sm, v) => sm + gauss(v.punkte), 0), A, tolFlaeche(A, D)), `${wo}: gezeichnete Fläche falsch (soll ${A.toFixed(4)})`);
      const gl = linie(D, "graph-g");
      pruefe(gl && nahe(steigung(gl), m, 1e-3) && nahe(aufGerade(gl, 0), 0, 0.02), `${wo}: Gerade falsch`);
      pfadAuf(D, "graph-f", f, wo);
      pruefe(nahe(await letzteZahl(page, "#zg-bilanz .wa"), A, 1e-3), `${wo}: Flächeninhalt in der Bilanz falsch`);
      // Der Rechenweg: fünf Schritte, und die genannten Schnittstellen stimmen.
      const weg = [];
      for (let i = 0; i < 5; i++) weg.push(await bilanzZeile(page, "#zg-bilanz", i));
      pruefe(weg.every((z, i) => z.startsWith("①②③④⑤"[i])), `${wo}: Der Rechenweg hat nicht die fünf Schritte`);
      pruefe(/Gleichsetzen/.test(weg[0]) && /Nullform/.test(weg[1]) && /(pq-Formel|ausklammern|x³ = 0)/.test(weg[2]), `${wo}: Schritte falsch benannt`);
      const genannt = zahlen(weg[2].split("⟹").slice(-1)[0]);
      pruefe(s.every((x) => genannt.some((z) => nahe(z, x, 1e-4))) || s.length === 1, `${wo}: Schritt ③ nennt die Schnittstellen ${s.map((x) => x.toFixed(4))} nicht — „${weg[2]}“`);
    }
  }
  await waehle(page, "zg-art", "parabel");
}

// ---------- 9. Mittelwert ----------
async function mittelwert(page) {
  const T = (t) => -0.5 * t * t + 3 * t + 10;
  for (let bw = 1; bw <= 6; bw += 0.5) {
    const b = await setzeRegler(page, "mw-b", bw);
    const wo = `Mittelwert b = ${b}`;
    const m = integral(T, 0, b) / b;
    const D = await lies(page, "#mw-mount svg");
    const r = D.rechtecke.find((q) => q.rolle === "mittel");
    pruefe(r && nahe(r.x1, 0, 0.01) && nahe(r.x2, b, 0.01) && nahe(r.y2, m, 1.5 / D.proY), `${wo}: Rechteck hat nicht die Höhe des Mittelwerts`);
    // Rechteck und Fläche unter dem Graphen sind gleich groß — das ist die Aussage des Bildes.
    const st = vielecke(D, "flaeche");
    pruefe(r && nahe(orientiert(st), (r.x2 - r.x1) * (r.y2 - r.y1), tolFlaeche(m * b, D) * 2), `${wo}: Rechteck und Fläche sind nicht gleich groß`);
    // Bis knapp über b suchen: Bei b = 4,5 liegt eine der Stellen genau auf dem Rand.
    const stellen = vzw((t) => T(t) - m, 0, b + 1e-6).filter((t) => t <= b + 1e-6).sort((p, q) => p - q);
    const gez = kreise(D, "mittelstelle").map((k) => k.x).sort((p, q) => p - q);
    pruefe(gez.length === stellen.length && gez.every((x, i) => nahe(x, stellen[i], 0.01)), `${wo}: Stellen mit T = m falsch markiert`);
    pruefe(nahe(await spanWert(page, "#mw-bilanz .wr"), m, 1e-4), `${wo}: Mittelwert ${await spanWert(page, "#mw-bilanz .wr")} statt ${m}`);
  }
}

// ---------- 10. Uneigentliche Integrale ----------
async function uneigentlich(page) {
  const FN = {
    quadrat: { f: (x) => 1 / (x * x), pol: false, konvergent: 1 },
    wurzel: { f: (x) => 1 / Math.sqrt(x), pol: false, konvergent: null },
    polwurzel: { f: (x) => 1 / Math.sqrt(x), pol: true, konvergent: 2 },
    polquadrat: { f: (x) => 1 / (x * x), pol: true, konvergent: null },
  };
  for (const [art, d] of Object.entries(FN)) {
    await waehle(page, "ue-art", art);
    const f = d.f;
    // Auf logarithmischer Skala integriert (x = eᵘ), damit auch b = 1000 und ε = 0,0001 genau werden.
    const I = (lo, hi) => integral((u) => f(Math.exp(u)) * Math.exp(u), Math.log(lo), Math.log(hi), 4000);
    pruefe((await spanText(page, "#ue-k-name")) === (d.pol ? "ε" : "b"), `Uneigentlich ${art}: Der Regler heißt nicht ${d.pol ? "ε" : "b"}`);
    for (let k = 0; k <= 7; k++) {
      await setzeRegler(page, "ue-k", k);
      const w = zahl((await spanText(page, "#ue-k-anzeige")).replace(/\.(?=\d{3})/g, ""));
      const wo = `Uneigentlich ${art}, ${d.pol ? "ε" : "b"} = ${w}`;
      const soll = d.pol ? I(w, 1) : I(1, w);
      const z = zahlen(await bilanzZeile(page, "#ue-bilanz", 0));
      pruefe(nahe(z[z.length - 1], soll, 1e-4 * (1 + soll)), `${wo}: Bilanz ${z[z.length - 1]} statt ${soll}`);
      const D = await lies(page, "#ue-mount svg");
      stueckeZwischen(D, "flaeche", f, () => 0, wo);
      if (!d.pol) {
        const J = I(1, Math.min(w, 10.5));
        pruefe(nahe(orientiert(vielecke(D, "flaeche")), J, tolFlaeche(J, D)), `${wo}: gezeichnete Fläche falsch`);
      } else if (art === "polwurzel" || w >= 0.05) {
        // Nahe der Polstelle ist der Sehnenzug eine grobe Näherung — dort genügt ein Prozent.
        const J = I(w, 1);
        pruefe(nahe(orientiert(vielecke(D, "flaeche")), J, 0.01 * J + tolFlaeche(J, D)), `${wo}: gezeichnete Fläche ${orientiert(vielecke(D, "flaeche")).toFixed(4)} statt ${J.toFixed(4)}`);
      }
      if (d.pol) pruefe(nahe(linie(D, "pol").x1, 0, 0.01) && nahe(linie(D, "grenze-a").x1, w, 0.01), `${wo}: Polstelle oder ε falsch gezeichnet`);
    }
    const zeile2 = await bilanzZeile(page, "#ue-bilanz", 1);
    pruefe(d.konvergent !== null ? /konvergent/.test(zeile2) && nahe(await spanWert(page, "#ue-bilanz .wa"), d.konvergent, 1e-9) : /divergent/.test(zeile2), `Uneigentlich ${art}: Konvergenz falsch beurteilt`);
    // Der Grenzwert stimmt: Der Wert für das kleinste ε bzw. größte b liegt nahe daran (oder wächst weiter).
    const fern = d.pol ? I(1e-8, 1) : I(1, 1e8);
    pruefe(d.konvergent !== null ? nahe(fern, d.konvergent, 1e-3) : fern > 1000, `Uneigentlich ${art}: Grenzwert ${d.konvergent} passt nicht zur Rechnung (${fern})`);
  }
  await waehle(page, "ue-art", "quadrat");
}

// ---------- 11. Rotationskörper ----------
async function rotation(page) {
  const RK = {
    kegel: { f: (x) => 0.5 * x, a: 0, b: 4 },
    paraboloid: { f: (x) => Math.sqrt(x), a: 0, b: 4 },
    kugel: { f: (x) => Math.sqrt(Math.max(0, 4 - x * x)), a: -2, b: 2 },
  };
  for (const [art, d] of Object.entries(RK)) {
    await waehle(page, "rk-art", art);
    const V = Math.PI * integral((x) => d.f(x) ** 2, d.a, d.b);
    for (const nw of [1, 2, 6, 15, 40]) {
      const n = await setzeRegler(page, "rk-n", nw);
      const wo = `Rotation ${art}, n = ${n}`;
      const D = await lies(page, "#rk-mount svg");
      const sch = D.rechtecke.filter((r) => r.rolle === "scheibe");
      pruefe(sch.length === n, `${wo}: ${sch.length} Scheiben statt ${n}`);
      // Volumen aus den gezeichneten Scheiben: π · r² · Dicke, r ist die halbe Höhe des Rechtecks.
      const summe = sch.reduce((s, r) => s + Math.PI * ((r.y2 - r.y1) / 2) ** 2 * (r.x2 - r.x1), 0);
      const dx = (d.b - d.a) / n;
      const soll = Array.from({ length: n }, (_, k) => Math.PI * d.f(d.a + (k + 0.5) * dx) ** 2 * dx).reduce((s, x) => s + x, 0);
      pruefe(nahe(summe, soll, 0.01 * (1 + soll)), `${wo}: gezeichnete Scheiben ergeben ${summe.toFixed(3)} statt ${soll.toFixed(3)}`);
      pruefe(sch.every((r) => nahe(r.y1, -r.y2, 2 / D.proY)), `${wo}: Scheiben nicht symmetrisch zur Achse`);
      const z = zahlen(await bilanzZeile(page, "#rk-bilanz", 0));
      pruefe(nahe(z[z.length - 1], soll, 1e-4), `${wo}: Scheibensumme ${z[z.length - 1]} statt ${soll}`);
      pruefe(nahe(await letzteZahl(page, "#rk-bilanz .wa"), V, 1e-4), `${wo}: Volumen falsch`);
      // „16π/3“: Der Bruch vor dem π muss das Volumen treffen.
      const m = (await spanText(page, "#rk-bilanz .wa")).match(/(\d+)π(?:\/(\d+))?/);
      pruefe(m && nahe((Number(m[1]) / Number(m[2] || 1)) * Math.PI, V, 1e-9), `${wo}: exakte Angabe „${m && m[0]}“ passt nicht zu V = ${V}`);
      pfadAuf(D, "graph", d.f, wo);
      pfadAuf(D, "spiegel", (x) => -d.f(x), wo);
    }
  }
}

// ---------- 12. Stolperstelle ----------
async function stolperstelle(page) {
  const f = (x) => 1 / (x * x);
  for (let k = 0; k <= 5; k++) {
    await setzeRegler(page, "st-k", k);
    const e = zahl(await spanText(page, "#st-k-anzeige"));
    const wo = `Stolperstelle ε = ${e}`;
    const A = 2 * integral((u) => f(Math.exp(u)) * Math.exp(u), Math.log(e), 0, 4000);
    pruefe(nahe(await spanWert(page, "#st-bilanz .wo"), A, 1e-3), `${wo}: Fläche ${await spanWert(page, "#st-bilanz .wo")} statt ${A}`);
    const D = await lies(page, "#st-mount svg");
    const st = vielecke(D, "flaeche");
    pruefe(st.length === 2 && st.every((v) => v.vz === "+"), `${wo}: zwei positive Flächenstücke erwartet`);
    stueckeZwischen(D, "flaeche", f, () => 0, wo);
    pruefe(st.every((v) => v.punkte.every(([x]) => Math.abs(x) >= e - 0.005 && Math.abs(x) <= 1.005)), `${wo}: Flächenstücke reichen in den Streifen um 0`);
    pruefe(nahe(linie(D, "pol").x1, 0, 0.01), `${wo}: Polstelle nicht bei 0`);
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
  // Jede Zeile der Selbsteinschätzung führt bei „unsicher“ zu ihrem Abschnitt zurück.
  const zeilen = await page.locator("#se-liste .se-zeile").count();
  pruefe(zeilen === ABSCHNITTE.length, `Selbsteinschätzung: ${zeilen} Zeilen statt ${ABSCHNITTE.length}`);
  for (const i of [0, 3, 6, 11]) {
    await page.evaluate(() => localStorage.clear());
    await page.locator("#se-liste .se-zeile").nth(i).locator("button").nth(2).click();
    const aus = await page.evaluate(() => document.getElementById("se-auswertung").innerHTML);
    pruefe(aus.includes(`href="#${ABSCHNITTE[i]}"`), `Selbsteinschätzung: Zeile ${i + 1} verweist nicht auf ${ABSCHNITTE[i]} — „${aus}“`);
  }
  await page.evaluate(() => localStorage.clear());
}

// ---------- Übungsaufgaben ----------
const T = 0.0001;
// Mit Tausenderpunkt: „∫ … dx = 1.944“ kommt bei großen Werten wirklich vor.
const Z = "(−?\\d+(?:\\.\\d{3})*(?:,\\d+)?)";
// Grenzen wie „3π/2“, „π“, „2π“, „0“.
function liesPi(s) {
  if (s === "0") return 0;
  const m = s.match(/^(\d*)π(?:\/(\d+))?$/);
  return m ? ((Number(m[1] || 1)) * Math.PI) / Number(m[2] || 1) : NaN;
}
// Schranken gemessen mit werkzeug-streuung.js (25 Züge, 10⁻⁴-Quantil von 0,8 · n):
//   UPLANT_ZUEGE=25 node tests/werkzeug-streuung.js /mathematik/mss11/01-analysis/05-integralrechnung/index.html
const SCHRANKE = {1: 13, 2: 22, 3: 21, 4: 17, 5: 14, 6: 20, 7: 8, 8: 14, 9: 22, 10: 22, 11: 14, 12: 15, 13: 16, 14: 10, 15: 22, 16: 12, 17: 10, 18: 11, 19: 16, 20: 22, 21: 10, 22: 15, 23: 16, 24: 12, 25: 8, 26: 8, 27: 15, 28: 11};

async function aufgaben(page) {
  const r = 25;
  const A = (nr, name, deute) => pruefeAufgabe(page, bericht, { nr, name, runden: r, mindestensVerschieden: SCHRANKE[nr] ?? 5, deute });
  await A(1, "A1 Potenzregel", (q) => {
    const m = q.match(/Berechne ∫ (\S+) (\S+) (.+?) dx\./);
    if (!m) return null;
    const b = zahl(m[1]), a = zahl(m[2]), k = liesPoly(m[3]), n = grad(k), c = k[n];
    const I = integral(polyFn(k), a, b);
    return { richtig: I, toleranz: T, falsch: [[c * b ** (n + 1), "fehlt das Teilen"], [c * n * b ** (n - 1), "Ableitung an der Stelle b"], [n === 1 ? NaN : (c * b ** (n + 1)) / n, "neuen"]] };
  });
  await A(2, "A2 Polynomintegral", (q) => {
    const m = q.match(/Berechne ∫ (\S+) (\S+) \((.+?)\) dx\./);
    if (!m) return null;
    const b = zahl(m[1]), a = zahl(m[2]), f = polyFn(liesPoly(m[3]));
    const I = integral(f, a, b), Fb = integral(f, 0, b);
    return { richtig: I, toleranz: T, falsch: [[Math.abs(I) < 1e-9 ? NaN : -I, "Vorzeichen vertauscht"], [a === 0 ? NaN : Fb, "Das ist nur F"], [f(b) - f(a), "Eingesetzt wurde in f"]] };
  });
  await A(3, "A3 Zu- und Abfluss", (q) => {
    const m = q.match(new RegExp(`zu Beginn ${Z} Liter Wasser\\. ${Z} Minuten lang fließen ${Z} Liter pro Minute zu, danach ${Z} Minuten lang ${Z} Liter pro Minute ab\\.`));
    if (!m) return null;
    const [B0, t1, r1, t2, r2] = m.slice(1).map(zahl);
    return { richtig: B0 + r1 * t1 - r2 * t2, toleranz: T, falsch: [[B0 + r1 * t1 + r2 * t2, "Der Abfluss wurde addiert"], [r1 * t1 - r2 * t2, "nur die Änderung"], [B0 + r1 * t1, "Der Abfluss fehlt"]] };
  });
  await A(4, "A4 Mittelwert", (q) => {
    const m = q.match(new RegExp(`f\\(x\\) = (.+?)\\. Berechne den Mittelwert m der Funktionswerte von f auf dem Intervall \\[0; ${Z}\\]\\.`));
    if (!m) return null;
    const f = polyFn(liesPoly(m[1])), b = zahl(m[2]);
    const I = integral(f, 0, b);
    return { richtig: I / b, toleranz: T, falsch: [[b === 1 ? NaN : I, "Das ist das Integral"], [(f(0) + f(b)) / 2, "Mittel der beiden Randwerte"], [f(b / 2), "Intervallmitte"]] };
  });
  await A(5, "A5 Sinus und Kosinus", (q) => {
    const m = q.match(/Berechne ∫ (\S+) (\S+) (?:(\d+) · )?(sin|cos)\(x\) dx\./);
    if (!m) return null;
    const b = liesPi(m[1]), a = liesPi(m[2]), c = Number(m[3] || 1), f = (x) => c * Math[m[4]](x);
    const I = integral(f, a, b), Ab = flaecheBetrag(f, a, b);
    return { richtig: I, toleranz: T, falsch: [[Math.abs(I) < 1e-9 ? NaN : -I, "Vorzeichen"], [nahe(Ab, Math.abs(I), 1e-6) ? NaN : Ab, "Flächeninhalt zwischen Graph und x-Achse"], [c === 1 ? NaN : I / c, "Der Faktor"]] };
  });
  await A(8, "A8 Fläche mit Vorzeichenwechsel", (q) => {
    const m = q.match(new RegExp(`f\\(x\\) = (.+?)\\. Berechne den Inhalt der Fläche zwischen dem Graphen von f und der x-Achse über dem Intervall \\[0; ${Z}\\]\\.`));
    if (!m) return null;
    const f = polyFn(liesPoly(m[1])), b = zahl(m[2]);
    const s = vzw(f, 0.01, b - 1e-9);
    pruefe(s.length === 1, `A8: ${s.length} Nullstellen im Inneren — erwartet genau eine`);
    if (s.length !== 1) return null;
    const I = integral(f, 0, b), I2 = integral(f, s[0], b);
    return { richtig: flaecheBetrag(f, 0, b), toleranz: T, falsch: [[I, "Das ist das Integral über"], [I >= 0 ? NaN : -I, "Der Betrag des Gesamtintegrals"], [Math.abs(I2), "nur die Teilfläche"]] };
  });
  const zweiGraphen = (q) => {
    const m = q.match(/f\(x\) = (.+?) und g\(x\) = (.+?)\. Berechne den Inhalt der Fläche, die die beiden Graphen einschließen\./);
    if (!m) return null;
    const kf = liesPoly(m[1]), kg = liesPoly(m[2]);
    const f = polyFn(kf), g = polyFn(kg), d = (x) => f(x) - g(x);
    const s = vzw(d, -10, 10);
    if (s.length !== 2) { pruefe(false, `zwei Graphen: ${s.length} Schnittstellen in „${q}“`); return null; }
    const D = integral(d, s[0], s[1]);
    return { f, g, s, D, A: Math.abs(D), k: (kf[2] || 0) - (kg[2] || 0) };
  };
  await A(9, "A9 Parabel und Gerade", (q) => {
    const w = zweiGraphen(q);
    if (!w) return null;
    return { richtig: w.A, toleranz: T, falsch: [[nahe(w.D, w.A, 1e-9) ? NaN : w.D, "Das Integral von f − g ist negativ"], [integral(w.f, w.s[0], w.s[1]), "nur das Integral über f"], [integral(w.g, w.s[0], w.s[1]), "nur das Integral über g"]] };
  });
  await A(10, "A10 Stammfunktion durch einen Punkt", (q) => {
    const m = q.match(new RegExp(`f\\(x\\) = (.+?)\\. Bestimme die Stammfunktion F\\(x\\) = … \\+ C von f, deren Graph durch P\\(${Z} \\| ${Z}\\) geht\\. Gib C und F\\(${Z}\\) an\\.`));
    if (!m) return null;
    const f = polyFn(liesPoly(m[1])), [x0, y0, x1] = [m[2], m[3], m[4]].map(zahl);
    const G = (x) => integral(f, 0, x);
    const C = y0 - G(x0), g0 = G(x0);
    return { felder: [C, G(x1) + C], toleranz: T, falschFelder: [
      [0, Math.abs(g0) < 1e-9 ? NaN : y0 + g0, "Vorzeichen"], [0, Math.abs(g0) < 1e-9 ? NaN : y0, "C ist nicht einfach"], [0, y0 - f(x0), "Eingesetzt wurde in f"],
      [1, Math.abs(C) < 1e-9 ? NaN : G(x1), "Die Konstante C fehlt"]] };
  });
  await A(11, "A11 Lineare Verkettung", (q) => {
    const m = q.match(/Berechne ∫ (\S+) (\S+) \((.+?)\)([²³]) dx\./);
    if (!m) return null;
    const b = zahl(m[1]), a = zahl(m[2]), k = HOCH[m[4]], innen = liesPoly(m[3]), mm = innen[1];
    const I = integral((x) => polyFn(innen)(x) ** k, a, b);
    const eins = Math.abs(Math.abs(mm) - 1) < 1e-9;
    return { richtig: I, toleranz: T, falsch: [[eins ? NaN : I * mm, "innere Ableitung"], [eins ? NaN : I * mm * mm, "multipliziert statt geteilt"], [I * (k + 1), "Der Exponent steigt"]] };
  });
  await A(12, "A12 Obere Grenze", (q) => {
    const m = q.match(new RegExp(`dass ∫ b 0 (.+?) dx = ${Z} gilt\\.`));
    if (!m) return null;
    const kp = liesPoly(m[1]), n = grad(kp), c = kp[n], Aw = zahl(m[2]);
    const b = loese((s) => integral(polyFn(kp), 0, s, 200), Aw, 0, 50);
    return { richtig: b, toleranz: T, falsch: [[(Aw / c) ** (1 / (n + 1)), "Die Stammfunktion hat den Faktor"], [b ** (n + 1), "Zum Schluss fehlt noch"], [n === 1 ? NaN : b ** ((n + 1) / n), "Gezogen wurde die"]] };
  });
  await A(15, "A15 Zwei Parabeln", (q) => {
    const w = zweiGraphen(q);
    if (!w) return null;
    const d = w.s[1] - w.s[0];
    return { richtig: w.A, toleranz: T, falsch: [[nahe(w.D, w.A, 1e-9) ? NaN : w.D, "Das Integral von f − g ist negativ"], [integral(w.f, w.s[0], w.s[1]), "Integral über f allein"], [Math.abs(Math.abs(w.k) - 1) < 1e-9 ? NaN : d ** 3 / 6, "der Vorfaktor"]] };
  });
  await A(16, "A16 Parameter aus der Fläche", (q) => {
    const m = q.match(new RegExp(`fk\\(x\\) = (?:${Z} · \\()?k² − x²\\)?\\. .*Inhalt ${Z} ein\\.`));
    if (!m) return null;
    const c = m[1] ? zahl(m[1]) : 1, Aw = zahl(m[2]);
    const k = loese((s) => integral((x) => c * (s * s - x * x), -s, s, 200), Aw, 0, 50);
    return { richtig: k, toleranz: T, falsch: [[k * Math.cbrt(2), "nur von 0 bis k"], [k ** 3, "Das ist k³"], [Math.sqrt(k ** 3), "Quadratwurzel"]] };
  });
  await A(17, "A17 Rotationsvolumen", (q) => {
    const m = q.match(new RegExp(`f\\(x\\) = √\\(${Z}?x\\) rotiert über dem Intervall \\[0; ${Z}\\]`));
    if (!m) return null;
    const c = m[1] ? zahl(m[1]) : 1, b = zahl(m[2]);
    const V = integral((x) => Math.sqrt(c * x) ** 2, 0, b);
    return { richtig: V, toleranz: T, falsch: [[V * Math.PI, "als Dezimalzahl"], [c * b * b, "der Faktor ½ fehlt"], [(c * c * b ** 3) / 3, "Quadriert wurde zweimal"]] };
  });
  await A(18, "A18 Uneigentliches Integral", (q) => {
    const m = q.match(new RegExp(`Berechne ∫ ∞ ${Z} ${Z} x([²³⁴]) dx\\.`));
    if (!m) return null;
    const a = zahl(m[1]), c = zahl(m[2]), n = HOCH[m[3]];
    // Mit u = 1/x wird ∫ₐ^∞ c/xⁿ dx zu ∫₀^(1/a) c · uⁿ⁻² du — ein gewöhnliches Integral.
    const I = integral((u) => c * u ** (n - 2), 0, 1 / a);
    return { richtig: I, toleranz: T, falsch: [[c / ((n + 1) * a ** (n + 1)), "falschen Exponenten"], [a === 1 ? NaN : c / (n - 1), "untere Grenze 1"], [-I, "Vorzeichen"]] };
  });
  await A(19, "A19 Größter Bestand", (q) => {
    const m = q.match(new RegExp(`r\\(t\\) = ${Z} − ${Z}t .*Zu Beginn sind ${Z} m³ im Speicher\\.`));
    if (!m) return null;
    const [r0, mm, B0] = m.slice(1).map(zahl);
    const rate = (t) => r0 - mm * t;
    const ts = vzw(rate, 0, 100)[0];
    const B = B0 + integral(rate, 0, ts);
    return { felder: [ts, B], toleranz: T, falschFelder: [[0, (2 * r0) / mm, "wieder so groß wie zu Beginn"], [1, B - B0, "nur die zugeflossene Menge"], [1, B0 + r0 * ts, "Gerechnet wurde mit r₀"]] };
  });
  await A(22, "A22 Tangente an eine kubische Funktion", (q) => {
    const m = q.match(new RegExp(`f\\(x\\) = (.+?)\\. Die Tangente t an den Graphen im Punkt P\\(${Z} \\| ${Z}\\)`));
    if (!m) return null;
    const kf = liesPoly(m[1]), f = polyFn(kf), x0 = zahl(m[2]);
    pruefe(nahe(f(x0), zahl(m[3]), 1e-9), `A22: P liegt nicht auf dem Graphen — „${q}“`);
    const mt = polyFn(polyAbl(kf))(x0), t = (x) => f(x0) + mt * (x - x0), d = (x) => f(x) - t(x);
    // x₀ ist doppelte Nullstelle von f − t (kein Vorzeichenwechsel); die einfache ist Q.
    const xs = vzw(d, -20, 20).filter((z) => Math.abs(z - x0) > 1e-3);
    if (xs.length !== 1) { pruefe(false, `A22: ${xs.length} zweite Schnittstellen — „${q}“`); return null; }
    const xq = xs[0], lo = Math.min(xq, x0), hi = Math.max(xq, x0);
    const D = integral(d, lo, hi), Af = Math.abs(D), a = kf[3];
    return { felder: [xq, Af], toleranz: T, falschFelder: [[0, -xq, "Vorzeichen"], [0, x0, "Berührpunkt P selbst"],
      [1, nahe(D, Af, 1e-9) ? NaN : D, "Das Integral von f − t ist hier negativ"], [1, integral(f, lo, hi), "Integral über f allein"], [1, Math.abs(Math.abs(a) - 1) < 1e-9 ? NaN : Af / Math.abs(a), "Der Faktor"]] };
  });
  await A(23, "A23 Maximum einer Integralfunktion", (q) => {
    const m = q.match(/f\(t\) = (.+?)\. Die Integralfunktion/);
    if (!m) return null;
    const f = polyFn(liesPoly(m[1], "t"));
    const s = vzw(f, -20, 20);
    if (s.length !== 2) { pruefe(false, `A23: ${s.length} Nullstellen von f — „${q}“`); return null; }
    const I = (x) => integral(f, 0, x);
    // Maximum von I: f wechselt von + nach −.
    const xm = s.find((z) => f(z - 0.01) > 0 && f(z + 0.01) < 0), xn = s.find((z) => z !== xm);
    return { felder: [xm, I(xm)], toleranz: T, falschFelder: [[0, xn, "lokales Minimum"], [0, (s[0] + s[1]) / 2, "Extremstelle von f"],
      [1, I(xn), "lokales Minimum"], [1, Math.abs(I(xm)) < 1e-9 ? NaN : -I(xm), "Vorzeichen"]] };
  });
  await A(24, "A24 Kugelschicht", (q) => {
    const m = q.match(new RegExp(`f\\(x\\) = √\\(${Z} − x²\\) ist ein Halbkreis mit dem Radius ${Z}\\. .*zwischen x = ${Z} und x = ${Z}\\.`));
    if (!m) return null;
    const [r2, rr, a, b] = m.slice(1).map(zahl);
    pruefe(nahe(rr * rr, r2, 1e-9), `A24: Radius ${rr} passt nicht zu ${r2} − x²`);
    const V = integral((x) => r2 - x * x, a, b);
    return { richtig: V, toleranz: T, falsch: [[r2 * (b - a) + (b ** 3 - a ** 3) / 3, "Vorzeichen"], [a === -rr && b === rr ? NaN : (4 * rr ** 3) / 3, "ganze Kugel"], [r2 * (b - a), "Zylinder"]] };
  });
  await A(25, "A25 Ursprungsgerade halbiert eine Fläche", (q) => {
    const m = q.match(/f\(x\) = (.+?) schließt mit der x-Achse/);
    if (!m) return null;
    const kf = liesPoly(m[1]), f = polyFn(kf), k = -kf[2];
    const c = vzw(f, 1e-6, 100)[0];
    const ganz = integral(f, 0, c);
    // Abgeschnittene Fläche zwischen f und y = m · x, numerisch — fällt mit wachsendem m.
    const ab = (mm) => { const s = vzw((x) => f(x) - mm * x, 1e-6, c + 1)[0] ?? 0; return integral((x) => f(x) - mm * x, 0, s, 400); };
    const mstern = loese((mm) => -ab(mm), -ganz / 2, 0, k * c);
    return { richtig: mstern, toleranz: T, falsch: [[(k * c) / 2, "Die halbe Steigung"], [k * c * (1 - Math.SQRT1_2), "Quadratwurzel"], [c * Math.cbrt(0.5), "Das ist die Schnittstelle"]] };
  });
  await A(26, "A26 Unbegrenzte Fläche zwischen zwei Graphen", (q) => {
    const m = q.match(new RegExp(`f\\(x\\) = ${Z} x² und g\\(x\\) = ${Z} x³`));
    if (!m) return null;
    const a = zahl(m[1]), b = zahl(m[2]);
    const s = vzw((x) => a / (x * x) - b / x ** 3, 0.01, 100)[0];
    // u = 1/x: ∫ₛ^∞ (a/x² − b/x³) dx = ∫₀^(1/s) (a − b · u) du.
    const Af = integral((u) => a - b * u, 0, 1 / s);
    return { felder: [s, Af], toleranz: T, falschFelder: [[0, nahe(a, b) ? NaN : 1 / s, "Umgedreht"],
      [1, a / s, "nur die Fläche unter f"], [1, a / s + b / (2 * s * s), "Vorzeichen: Die Stammfunktion"], [1, -Af, "Rechts von S liegt f über g"]] };
  });

  // ---------- Schnittstellen und uneigentliche Integrale ----------
  const schnitt = (f, g) => vzw((x) => f(x) - g(x), -20, 20).sort((p, q) => p - q);
  await A(6, "A6 Schnittstellen von Parabel und Gerade", (q) => {
    const m = q.match(/f\(x\) = (.+?) und g\(x\) = (.+?)\. Bestimme die Schnittstellen x₁ < x₂ der beiden Graphen\./);
    if (!m) return null;
    const f = polyFn(liesPoly(m[1])), g = polyFn(liesPoly(m[2]));
    const s = schnitt(f, g), nf = vzw(f, -20, 20).sort((p, r) => p - r);
    if (s.length !== 2) { pruefe(false, `A6: ${s.length} Schnittstellen — „${q}“`); return null; }
    pruefe(s.every((x) => nahe(f(x), g(x), 1e-9)), "A6: Probe f(x) = g(x) schlägt fehl");
    return { felder: s, toleranz: T, falschFelder: [[0, -s[1], "Vorzeichen in der pq-Formel"], [1, -s[0], "Vorzeichen in der pq-Formel"],
      [0, nf.length === 2 ? nf[0] : NaN, "Nullstelle von f allein"], [1, nf.length === 2 ? nf[1] : NaN, "Nullstelle von f allein"]] };
  });
  await A(7, "A7 Uneigentliches Integral in zwei Schritten", (q) => {
    const m = q.match(new RegExp(`Berechne ∫ b 1 ${Z} x² dx für b = ${Z} und den Grenzwert`));
    if (!m) return null;
    const c = zahl(m[1]), b = zahl(m[2]), f = (x) => c / (x * x);
    const I = integral(f, 1, b);
    // Mit u = 1/x wird ∫₁^∞ c/x² dx zu ∫₀¹ c du.
    const lim = integral(() => c, 0, 1);
    return { felder: [I, lim], toleranz: T, falschFelder: [[0, -c / b, "nur F(b)"], [0, -I, "Vorzeichen"], [1, I, "Das ist der Wert für b"], [1, 0, "Der Integrand geht gegen 0"]] };
  });
  // Drei Schnittstellen: Teilflächen einzeln betragen.
  const dreiGraphen = (q) => {
    const m = q.match(/f\(x\) = (.+?) und g\(x\) = (.+?)\. Die Graphen schneiden sich in drei Punkten/);
    if (!m) return null;
    const f = polyFn(liesPoly(m[1])), g = polyFn(liesPoly(m[2])), d = (x) => f(x) - g(x);
    const s = schnitt(f, g);
    if (s.length !== 3) { pruefe(false, `drei Graphen: ${s.length} Schnittstellen — „${q}“`); return null; }
    const I1 = integral(d, s[0], s[1]), I2 = integral(d, s[1], s[2]);
    return { richtig: Math.abs(I1) + Math.abs(I2), toleranz: T, falsch: [[Math.abs(I1 + I2), "auf einmal integriert"], [Math.abs(I1), "nur die Teilfläche über"], [nahe(Math.abs(I1), Math.abs(I2), 1e-9) ? NaN : Math.abs(I2), "nur die Teilfläche über"]] };
  };
  await A(13, "A13 Drei Schnittstellen", dreiGraphen);
  await A(14, "A14 Polstelle am Rand", (q) => {
    const m = q.match(new RegExp(`Integral ∫ ${Z} 0 ${Z} √x dx\\.`));
    if (!m) return null;
    const a = zahl(m[1]), c = zahl(m[2]);
    // Mit x = u² wird ∫₀ᵃ c/√x dx zu ∫₀^√a 2c du — ohne Polstelle.
    const I = integral(() => 2 * c, 0, Math.sqrt(a));
    return { richtig: I, toleranz: T, falsch: [[c * Math.sqrt(a), "Der Faktor 2 fehlt"], [-c / (2 * a * Math.sqrt(a)), "Ableitung des Integranden"], [a === 1 ? NaN : 2 * c * (Math.sqrt(a) - 1), "untere Grenze ist 0"]] };
  });
  await A(20, "A20 Schnittstellen und Fläche zweier Parabeln", (q) => {
    const m = q.match(/f\(x\) = (.+?) und g\(x\) = (.+?)\. Bestimme die Schnittstellen x₁ < x₂ und den Inhalt A/);
    if (!m) return null;
    const kf = liesPoly(m[1]), kg = liesPoly(m[2]), f = polyFn(kf), g = polyFn(kg);
    const s = schnitt(f, g);
    if (s.length !== 2) { pruefe(false, `A20: ${s.length} Schnittstellen — „${q}“`); return null; }
    const D = integral((x) => f(x) - g(x), s[0], s[1]), Af = Math.abs(D), k = (kf[2] || 0) - (kg[2] || 0);
    return { felder: [s[0], s[1], Af], toleranz: T, falschFelder: [[0, -s[1], "Vorzeichen in der pq-Formel"], [1, -s[0], "Vorzeichen in der pq-Formel"],
      [2, nahe(D, Af, 1e-9) ? NaN : D, "Das Integral von f − g ist negativ"], [2, Af / Math.abs(k), "Das Teilen durch"]] };
  });
  await A(21, "A21 Unendlich langer Rotationskörper", (q) => {
    const m = q.match(new RegExp(`f\\(x\\) = ${Z} x rotiert über \\[${Z}; ∞\\)`));
    if (!m) return null;
    const c = zahl(m[1]), a = zahl(m[2]);
    // u = 1/x: ∫ₐ^∞ c²/x² dx = ∫₀^(1/a) c² du.
    const V = integral(() => c * c, 0, 1 / a);
    return { richtig: V, toleranz: T, falsch: [[c / a, "Quadriert wurde nicht"], [(c * c) / (a * a), "Die Stammfunktion von"], [V * Math.PI, "Dezimalzahl"]] };
  });
  await A(27, "A27 Kubische Funktion und Parabel", dreiGraphen);
  await A(28, "A28 Grenze aus einer unbegrenzten Fläche", (q) => {
    const m = q.match(new RegExp(`f\\(x\\) = ${Z} x³ , der x-Achse .*Ihr Inhalt ist ${Z}\\.`));
    if (!m) return null;
    const c = zahl(m[1]), Aw = zahl(m[2]);
    // Fläche rechts von a über u = 1/x: ∫₀^(1/a) c · u du; sie fällt mit wachsendem a.
    const flaecheAb = (a) => integral((u) => c * u, 0, 1 / a, 200);
    const a = loese((x) => -flaecheAb(x), -Aw, 0.01, 100);
    return { richtig: a, toleranz: T, falsch: [[nahe(a, 1, 1e-9) ? NaN : a * a, "Das ist a²"], [Math.sqrt(c / Aw), "Der Faktor ½ fehlt"], [Math.pow(c / (4 * Aw), 0.25), "falschen Exponenten"]] };
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
      await rekonstruktion(page);
      await summen(page);
      await bestimmtesIntegral(page);
      await integralfunktion(page);
      await hauptsatz(page);
      await stammfunktion(page);
      await selbsttest(page);
      await flaeche(page);
      await zwischen(page);
      await mittelwert(page);
      await uneigentlich(page);
      await rotation(page);
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
