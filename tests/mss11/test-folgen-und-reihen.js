// Fachliche Prüfung: MSS 11, Analysis, Thema 1 „Folgen und Reihen“.
//
// Geprüft wird, was die Seite zeigt, gegen eine unabhängige Rechnung:
//   * Gerüst: Reihenfolge der Abschnitte, Schreibweisen-Kasten, Verweise, Formelsammlung;
//   * explizit/rekursiv: Tabelle und Punkte gegen die selbst gerechnete Folge;
//   * arithmetisch/geometrisch: Punkte aus dem SVG über den Maßstab der Gitterlinien, Zahl der
//     Pfeile = n − 1, Bilanz; ein unzulässiger Reglerwert springt und liefert dasselbe Bild wie das
//     Sprungziel;
//   * Monotonie: Urteil über die Schranken gegen den genauen kleinsten und größten Wert, und das
//     genannte Gegenbeispiel ist wirklich das erste;
//   * Grenzwert: jeder Punkt richtig als drin/draußen markiert, n₀ gegen eine Suche bis 100 000;
//   * Gauß: jede gedrehte Säule behält ihren Flächeninhalt (Gaußsche Trapezformel) an mehreren
//     Drehstellungen, die Bühne springt nicht, bei 180° füllen beide Treppen genau das Rechteck;
//   * Verschiebetrick: bei voller Verschiebung steht jede Zahl unter ihrem Zwilling, übrig bleiben
//     a₁ und a₁qⁿ, die Summe stimmt;
//   * unendliche Reihe: Strecken = Summanden, Grenzwert und Lücke;
//   * harmonische Reihe: Säulenhöhen 1/m, Blocksummen ≥ ½;
//   * Kontrollfragen, Selbsteinschätzung und alle sechzehn Aufgaben von beiden Seiten.

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
const SEITE = "/mathematik/mss11/01-analysis/01-folgen-und-reihen/index.html";
const WURZEL = path.resolve(__dirname, "..", "..");
const nahe = (a, b, tol = 1e-6) => Number.isFinite(a) && Math.abs(a - b) <= tol;

async function waehle(page, id, wert) {
  await page.selectOption("#" + id, wert);
}

// Liest die Punkte eines Folgengraphen und rechnet ihre Koordinaten über die Gitterlinien in
// (n | aₙ) zurück. Der Maßstab kommt aus zwei beliebigen beschrifteten Linien, nicht aus dem Code.
async function punkteLesen(page, mount) {
  return page.evaluate((m) => {
    const svg = document.querySelector(`#${m} svg`);
    const linien = (achse) => [...svg.querySelectorAll(`line[data-achse="${achse}"]`)].map((l) => ({ w: Number(l.dataset.wert), p: achse === "y" ? Number(l.getAttribute("y1")) : Number(l.getAttribute("x1")) }));
    const ys = linien("y"), xs = linien("x");
    const skala = (L) => { const a = L[0], b = L[L.length - 1]; const s = (b.p - a.p) / (b.w - a.w); return (p) => a.w + (p - a.p) / s; };
    const Y = skala(ys), X = skala(xs);
    return [...svg.querySelectorAll("circle[data-n]")].map((c) => ({
      n: X(Number(c.getAttribute("cx"))), y: Y(Number(c.getAttribute("cy"))), klasse: c.getAttribute("class"), dn: Number(c.dataset.n),
    }));
  }, mount);
}

async function geruest(page) {
  const folge = await page.evaluate(() => [...document.querySelectorAll("main section[id]")].map((s) => s.id));
  const soll = ["sec-folge", "sec-arith-geo", "sec-monotonie", "sec-grenzwert", "sec-arith-reihe", "sec-geo-reihe", "sec-unendlich", "sec-stolperstelle",
    "sec-selbsteinschaetzung", "sec-vernetzung", "sec-formelsammlung", "sec-uebungen"];
  pruefe(JSON.stringify(folge) === JSON.stringify(soll), `Gerüst: Abschnitte ${folge.join(", ")} statt ${soll.join(", ")}`);
  pruefe(fs.existsSync(path.join(WURZEL, path.dirname(SEITE), "formelsammlung.pdf")), "Formelsammlung: formelsammlung.pdf fehlt");
  const notation = await page.evaluate(() => (document.querySelector(".notation-box") || {}).innerText || "");
  pruefe(/Elemente der Mathematik/.test(notation) && /Fundamente der Mathematik/.test(notation) && /lim/.test(notation), "Gerüst: der Kasten mit den Schreibweisen fehlt oder ist unvollständig");
  const links = await page.evaluate(() =>
    [...document.querySelectorAll("main a[href]")].map((a) => a.getAttribute("href")).filter((h) => !h.startsWith("#") && !h.startsWith("http")));
  for (const href of new Set(links)) {
    const ziel = new URL(href.split("#")[0], "http://localhost" + SEITE).pathname;
    const antwort = await page.request.get("http://localhost:" + (process.env.UPLANT_PORT || "8936") + ziel);
    pruefe(antwort.ok(), `Gerüst: der Verweis „${href}“ führt ins Leere (${antwort.status()})`);
  }
  // Kein Vorgriff: Logarithmen kommen erst in einem späteren Thema.
  const haupt = await page.evaluate(() => document.querySelector("main").innerText);
  pruefe(!/\bln\s*\(|\blog\b|\blg\b/.test(haupt), "Gerüst: Die Seite benutzt einen Logarithmus, der erst später kommt");
  // Menü: Die Seite ist in der Analysis-Übersicht als Karte angemeldet.
  const menue = fs.readFileSync(path.join(WURZEL, "mathematik/mss11/01-analysis/index.html"), "utf-8");
  pruefe(/data-section="mss11" href="01-folgen-und-reihen\/index.html" hidden/.test(menue), "Menü: Karte für Folgen und Reihen fehlt oder ist nicht mit data-section/hidden versehen");
}

// ---------- 1. explizit und rekursiv ----------
const FOLGEN = {
  ungerade: (n) => 2 * n - 1,
  halbieren: (n) => 64 / Math.pow(2, n - 1),
  kehrwert: (n) => 1 / n,
  quadrat: (n) => n * n,
  // Fibonacci unabhängig über die Formel von Binet — nicht über dieselbe Rekursion wie die Seite.
  fibonacci: (n) => Math.round((Math.pow((1 + Math.sqrt(5)) / 2, n) - Math.pow((1 - Math.sqrt(5)) / 2, n)) / Math.sqrt(5)),
};
async function explizitRekursiv(page) {
  for (const [art, f] of Object.entries(FOLGEN)) {
    await waehle(page, "fo-art", art);
    for (const n of [1, 2, 5, 10]) {
      await setzeRegler(page, "fo-n", n);
      const wo = `Folge ${art}, n = ${n}`;
      const p = await punkteLesen(page, "fo-mount");
      pruefe(p.length === 10, `${wo}: ${p.length} Punkte statt 10`);
      for (const q of p) pruefe(nahe(q.n, q.dn, 1e-3) && nahe(q.y, f(q.dn), 2e-3 * Math.max(1, Math.abs(f(q.dn)))), `${wo}: Punkt ${q.dn} liegt bei (${q.n.toFixed(3)} | ${q.y.toFixed(3)}) statt (${q.dn} | ${f(q.dn)})`);
      pruefe(p.filter((q) => /aktiv/.test(q.klasse)).map((q) => q.dn).join() === String(n), `${wo}: hervorgehoben ist nicht genau a${n}`);
      const zelle = await text(page, `#fo-tabelle td[data-n="${n}"]`);
      const gelesen = /\d+ \d+/.test(zelle) ? zelle.split(" ").map(Number).reduce((a, b) => a / b) : zahl(zelle);
      pruefe(nahe(gelesen, f(n), 1e-9), `${wo}: Tabelle nennt „${zelle}“ statt ${f(n)}`);
      const bilanz = await text(page, "#fo-bilanz");
      const schritte = art === "fibonacci" ? Math.max(0, n - 2) : n - 1;
      const wort = schritte === 0 ? "kein Schritt" : schritte === 1 ? "ein Schritt" : `${schritte} Schritte`;
      pruefe(bilanz.includes(wort), `${wo}: Bilanz nennt nicht „${wort}“ — „${bilanz}“`);
    }
  }
}

// ---------- 2. arithmetisch und geometrisch ----------
async function arithGeo(page) {
  const faelle = [["arith", 2, 1.5, 0.5, 6], ["arith", -4, -3, 0.5, 8], ["arith", 8, 0, 0.5, 1], ["geo", 2, 1, 0.5, 6], ["geo", 3, 1, -1.5, 8], ["geo", -2, 1, 1.25, 5]];
  for (const [art, a, d, q, n] of faelle) {
    await waehle(page, "ag-art", art);
    const A = await setzeRegler(page, "ag-a", a);
    const D = await setzeRegler(page, "ag-d", d);
    const Qw = await setzeRegler(page, "ag-q", q);
    const N = await setzeRegler(page, "ag-n", n);
    const wo = `${art}, a₁ = ${A}, ${art === "geo" ? "q = " + Qw : "d = " + D}, n = ${N}`;
    const glied = (k) => (art === "geo" ? A * Math.pow(Qw, k - 1) : A + (k - 1) * D);
    const p = await punkteLesen(page, "ag-mount");
    for (const pt of p) pruefe(nahe(pt.y, glied(pt.dn), 2e-3 * Math.max(1, Math.abs(glied(pt.dn)))), `${wo}: Punkt ${pt.dn} bei ${pt.y.toFixed(4)} statt ${glied(pt.dn)}`);
    const pfeile = await page.locator("#ag-mount path[data-schritt]").count();
    pruefe(pfeile === N - 1, `${wo}: ${pfeile} Pfeile statt ${N - 1}`);
    const bilanz = await text(page, "#ag-bilanz");
    const m = bilanz.match(/= (−?[\d.,]+) · \d+ Glied/);
    pruefe(!!m && nahe(zahl(m[1]), glied(N), 1e-4 * Math.max(1, Math.abs(glied(N)))), `${wo}: Bilanz nennt ${m && m[1]} statt ${glied(N)} — „${bilanz}“`);
  }
  // Regler lügen nicht: a₁ = 0 ist bei einer geometrischen Folge nicht erlaubt und springt auf 1 —
  // dann muss das Bild dasselbe sein wie bei direkt eingestelltem a₁ = 1.
  await waehle(page, "ag-art", "geo");
  await setzeRegler(page, "ag-q", 2);
  const gesprungen = await setzeRegler(page, "ag-a", 0);
  pruefe(gesprungen === 1, `Regler a₁: 0 springt auf ${gesprungen} statt 1`);
  const bild1 = await page.evaluate(() => document.querySelector("#ag-mount").innerHTML);
  await setzeRegler(page, "ag-a", 3);
  await setzeRegler(page, "ag-a", 1);
  const bild2 = await page.evaluate(() => document.querySelector("#ag-mount").innerHTML);
  pruefe(bild1 === bild2, "Regler a₁: Das Bild nach dem Sprung 0 → 1 weicht vom direkt eingestellten a₁ = 1 ab");
  const qSprung = await setzeRegler(page, "ag-q", 0);
  pruefe(qSprung === 0.25, `Regler q: 0 springt auf ${qSprung} statt 0,25`);
  await waehle(page, "ag-art", "arith");
}

// ---------- 3. Monotonie und Beschränktheit ----------
const MB = {
  kehrwert: { f: (n) => 1 / n, inf: 0, sup: 1, mono: "streng monoton fallend" },
  bruch: { f: (n) => (n - 1) / n, inf: 0, sup: 1, mono: "streng monoton steigend" },
  alternierend: { f: (n) => Math.pow(-1, n) / n, inf: -1, sup: 0.5, mono: "nicht monoton" },
  quadrat: { f: (n) => (n * n) / 10, inf: 0.1, sup: Infinity, mono: "streng monoton steigend" },
};
async function monotonie(page) {
  for (const [art, def] of Object.entries(MB)) {
    await waehle(page, "mb-art", art);
    for (const [S, s] of [[1.2, -0.2], [0.9, 0.1], [0.4, -1], [2, -1.5], [1, 0]]) {
      const Sw = await setzeRegler(page, "mb-S", S);
      const sw = await setzeRegler(page, "mb-s", s);
      const wo = `Monotonie ${art}, S = ${Sw}, s = ${sw}`;
      const bilanz = await text(page, "#mb-bilanz");
      pruefe(bilanz.includes(def.mono), `${wo}: Monotonie-Urteil fehlt („${def.mono}“) — „${bilanz}“`);
      // Unabhängig: Monotonie an 200 Gliedern nachgezählt.
      const diffs = Array.from({ length: 200 }, (_, i) => def.f(i + 2) - def.f(i + 1));
      const steigt = diffs.every((x) => x > 0), faellt = diffs.every((x) => x < 0);
      pruefe(def.mono === (steigt ? "streng monoton steigend" : faellt ? "streng monoton fallend" : "nicht monoton"), `${wo}: das Monotonie-Urteil der Prüfung selbst ist falsch`);
      const obenOk = Sw >= def.sup - 1e-12, untenOk = sw <= def.inf + 1e-12;
      pruefe(bilanz.includes(`S = ${String(Sw).replace(".", ",").replace("-", "−")} ist ${obenOk ? "eine" : "keine"} obere Schranke`), `${wo}: falsches Urteil über S — „${bilanz}“`);
      pruefe(bilanz.includes(`s = ${String(sw).replace(".", ",").replace("-", "−")} ist ${untenOk ? "eine" : "keine"} untere Schranke`), `${wo}: falsches Urteil über s — „${bilanz}“`);
      if (!obenOk) {
        let k = 1; while (def.f(k) <= Sw + 1e-12) k++;
        pruefe(new RegExp(`a${String(k).split("").map((c) => "₀₁₂₃₄₅₆₇₈₉"[c]).join("")} = [−\\d,]+ > S`).test(bilanz), `${wo}: als Gegenbeispiel nicht das erste Glied a${k} genannt — „${bilanz}“`);
      }
      const linie = await page.evaluate(() => [...document.querySelectorAll("#mb-mount line[data-rolle]")].map((l) => [l.dataset.rolle, l.getAttribute("class")]));
      pruefe(linie.some(([r, k]) => r === "S" && /verletzt/.test(k) === !obenOk), `${wo}: die Linie S ist falsch markiert`);
    }
  }
}

// ---------- 4. Grenzwert ----------
const GW = {
  a: { f: (n) => (2 * n + 1) / n, g: 2 },
  b: { f: (n) => 3 + (2 * Math.pow(-1, n)) / n, g: 3 },
  c: { f: (n) => (n + 3) / (n + 1), g: 1 },
  d: { f: (n) => Math.pow(-1, n), g: 1, divergent: true },
};
const EPS = [1, 0.5, 0.2, 0.1, 0.05, 0.02, 0.01];
async function grenzwert(page) {
  for (const [art, def] of Object.entries(GW)) {
    await waehle(page, "gw-art", art);
    for (let i = 0; i < EPS.length; i++) {
      await setzeRegler(page, "gw-e", i);
      const eps = EPS[i];
      const wo = `Grenzwert ${art}, ε = ${eps}`;
      const p = await punkteLesen(page, "gw-mount");
      for (const q of p) {
        const drin = Math.abs(def.f(q.dn) - def.g) < eps - 1e-12;
        pruefe(/drin/.test(q.klasse) === drin, `${wo}: a${q.dn} ist als ${/drin/.test(q.klasse) ? "drin" : "draußen"} markiert`);
        pruefe(nahe(q.y, def.f(q.dn), 3e-3), `${wo}: a${q.dn} liegt bei ${q.y.toFixed(4)} statt ${def.f(q.dn)}`);
      }
      const streifen = await page.evaluate(() => { const r = document.querySelector('#gw-mount [data-rolle="streifen"]'); return [Number(r.dataset.oben), Number(r.dataset.unten)]; });
      pruefe(nahe(streifen[0], def.g + eps) && nahe(streifen[1], def.g - eps), `${wo}: Streifen von ${streifen[1]} bis ${streifen[0]}`);
      const bilanz = await text(page, "#gw-bilanz");
      if (def.divergent) {
        pruefe(/außerhalb/.test(bilanz), `${wo}: Die divergente Folge wird nicht als dauerhaft außerhalb erkannt`);
        continue;
      }
      // n₀ unabhängig: das kleinste n, ab dem bis 100 000 alle Glieder im Streifen liegen.
      let n0 = 100000;
      for (let n = 100000; n >= 1; n--) { if (Math.abs(def.f(n) - def.g) < eps - 1e-12) n0 = n; else break; }
      const m = bilanz.match(/n₀ = (\d+)/);
      pruefe(!!m && Number(m[1]) === n0, `${wo}: n₀ = ${m && m[1]} statt ${n0} — „${bilanz}“`);
    }
  }
}

// ---------- 5. Gauß ----------
async function gauss(page) {
  for (const [a, d, n] of [[1, 1, 6], [2, 3, 8], [4, 0, 2], [3, 2, 5]]) {
    await setzeRegler(page, "ga-a", a);
    await setzeRegler(page, "ga-d", d);
    await setzeRegler(page, "ga-n", n);
    const glied = (k) => a + (k - 1) * d;
    const H = glied(1) + glied(n);
    let viewBox = null;
    for (const t of [0, 25, 50, 75, 100]) {
      await setzeRegler(page, "ga-t", t);
      const wo = `Gauß a₁ = ${a}, d = ${d}, n = ${n}, ${t} %`;
      const d0 = await page.evaluate(() => {
        const svg = document.querySelector("#ga-mount svg");
        const ys = [...svg.querySelectorAll('line[data-achse="y"]')].map((l) => ({ w: Number(l.dataset.wert), p: Number(l.getAttribute("y1")) }));
        const xs = [...svg.querySelectorAll('line[data-achse="x"]')].map((l) => ({ w: Number(l.dataset.wert), p: Number(l.getAttribute("x1")) }));
        const teile = [...svg.querySelectorAll("path[data-teil]")].map((p) => ({ teil: p.dataset.teil, punkte: p.getAttribute("d").match(/-?[\d.]+ -?[\d.]+/g).map((s) => s.split(" ").map(Number)) }));
        return { viewBox: svg.getAttribute("viewBox"), ys, xs, teile, rahmen: !!svg.querySelector('[data-rolle="rechteck"]') };
      });
      if (viewBox === null) viewBox = d0.viewBox;
      pruefe(d0.viewBox === viewBox, `${wo}: Die Bühne springt (${d0.viewBox} statt ${viewBox})`);
      const sy = (d0.ys[d0.ys.length - 1].p - d0.ys[0].p) / (d0.ys[d0.ys.length - 1].w - d0.ys[0].w);
      const sx = (d0.xs[d0.xs.length - 1].p - d0.xs[0].p) / (d0.xs[d0.xs.length - 1].w - d0.xs[0].w);
      const inEinheiten = (pt) => [d0.xs[0].w + (pt[0] - d0.xs[0].p) / sx, d0.ys[0].w + (pt[1] - d0.ys[0].p) / sy];
      const flaeche = (pts) => Math.abs(pts.reduce((s, p, i) => { const q = pts[(i + 1) % pts.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0)) / 2;
      for (let k = 1; k <= n; k++) {
        const kopie = d0.teile.find((x) => x.teil === `kopie-${k}`).punkte.map(inEinheiten);
        // Die Eckpunkte stehen auf zwei Nachkommastellen in Bildpunkten — daher eine relative Toleranz.
        pruefe(nahe(flaeche(kopie), glied(k), 2e-3 * glied(k) + 2e-3), `${wo}: gedrehte Säule ${k} hat die Fläche ${flaeche(kopie).toFixed(4)} statt ${glied(k)}`);
        if (t === 100) {
          const xsK = kopie.map((p) => p[0]), ysK = kopie.map((p) => p[1]);
          const box = [Math.min(...xsK), Math.max(...xsK), Math.min(...ysK), Math.max(...ysK)];
          const soll = [n - k, n - k + 1, glied(n + 1 - k), H];
          pruefe(box.every((v, i) => nahe(v, soll[i], 5e-3)), `${wo}: Säule ${k} landet bei [${box.map((v) => v.toFixed(3))}] statt [${soll}]`);
        }
      }
      pruefe(d0.rahmen === (t === 100), `${wo}: Rechteckrahmen ${d0.rahmen ? "sichtbar" : "fehlt"}`);
    }
    const summe = Array.from({ length: n }, (_, i) => glied(i + 1)).reduce((x, y) => x + y, 0);
    const bilanz = await text(page, "#ga-bilanz");
    const m = bilanz.match(/= (\d+)$/);
    pruefe(!!m && Number(m[1]) === summe, `Gauß a₁ = ${a}, d = ${d}, n = ${n}: Bilanz endet mit ${m && m[1]} statt ${summe}`);
  }
}

// ---------- 6. Verschiebetrick ----------
async function geoSumme(page) {
  for (const [a, q, n] of [[3, 2, 5], [1, -2, 6], [5, 0.5, 4], [2, 1, 3], [4, -0.5, 2], [1, 3, 6]]) {
    await setzeRegler(page, "gs-a", a);
    const Q = await setzeRegler(page, "gs-q", q);
    await setzeRegler(page, "gs-n", n);
    await setzeRegler(page, "gs-t", 100);
    const wo = `Verschiebetrick a₁ = ${a}, q = ${Q}, n = ${n}`;
    const felder = await page.evaluate(() => [...document.querySelectorAll("#gs-mount g[data-rolle]")].map((g) => ({ rolle: g.dataset.rolle, wert: Number(g.dataset.wert), x: Number(g.dataset.x), weg: !!g.querySelector(".weg"), bleibt: !!g.querySelector(".bleibt") })));
    const oben = felder.filter((f) => f.rolle.startsWith("oben")), unten = felder.filter((f) => f.rolle.startsWith("unten"));
    pruefe(oben.length === n && unten.length === n, `${wo}: ${oben.length}/${unten.length} Felder statt ${n}`);
    oben.forEach((f, k) => pruefe(nahe(f.wert, a * Math.pow(Q, k), 1e-9), `${wo}: oben Feld ${k} = ${f.wert} statt ${a * Math.pow(Q, k)}`));
    unten.forEach((f, k) => pruefe(nahe(f.wert, a * Math.pow(Q, k + 1), 1e-9), `${wo}: unten Feld ${k} = ${f.wert} statt ${a * Math.pow(Q, k + 1)}`));
    if (Q !== 1) {
      // Jede untere Zahl außer der letzten steht genau unter ihrem Zwilling in der oberen Zeile.
      for (let k = 0; k < n - 1; k++) pruefe(nahe(unten[k].x, oben[k + 1].x, 0.01) && nahe(unten[k].wert, oben[k + 1].wert, 1e-9) && unten[k].weg && oben[k + 1].weg, `${wo}: unten ${k} steht nicht als Zwilling unter oben ${k + 1}`);
      pruefe(oben[0].bleibt && unten[n - 1].bleibt, `${wo}: a₁ und a₁qⁿ sind nicht als übrig markiert`);
    }
    const summe = Array.from({ length: n }, (_, k) => a * Math.pow(Q, k)).reduce((x, y) => x + y, 0);
    const bilanz = await text(page, "#gs-bilanz");
    const m = bilanz.match(/[=≈] (−?[\d.,]+)$/);
    pruefe(!!m && nahe(zahl(m[1]), summe, 1e-3 * Math.max(1, Math.abs(summe))), `${wo}: Bilanz endet mit ${m && m[1]} statt ${summe}`);
  }
  const sprung = await setzeRegler(page, "gs-q", 0);
  pruefe(sprung === 0.5, `Regler q: 0 springt auf ${sprung} statt 0,5`);
  await setzeRegler(page, "gs-t", 0);
}

// ---------- 7. Unendliche Reihe ----------
async function unendlich(page) {
  for (const [a, q] of [[1, 0.5], [2, -0.8], [3, 0.1], [0.5, 0.8], [1.5, -0.3]]) {
    const A = await setzeRegler(page, "ug-a", a);
    const Q = await setzeRegler(page, "ug-q", q);
    for (const n of [1, 4, 12]) {
      await setzeRegler(page, "ug-n", n);
      const wo = `Unendliche Reihe a₁ = ${A}, q = ${Q}, n = ${n}`;
      const strecken = await page.evaluate(() => [...document.querySelectorAll("#ug-mount line[data-k]")].map((l) => [Number(l.dataset.von), Number(l.dataset.bis)]));
      pruefe(strecken.length === n, `${wo}: ${strecken.length} Strecken statt ${n}`);
      let s = 0;
      strecken.forEach(([von, bis], i) => {
        pruefe(nahe(von, s, 1e-9) && nahe(bis - von, A * Math.pow(Q, i), 1e-9), `${wo}: Strecke ${i + 1} von ${von} bis ${bis}`);
        s += A * Math.pow(Q, i);
      });
      const grenz = await page.evaluate(() => Number(document.querySelector('#ug-mount [data-rolle="grenzwert"]').dataset.wert));
      pruefe(nahe(grenz, A / (1 - Q), 1e-9), `${wo}: Grenzwertlinie bei ${grenz} statt ${A / (1 - Q)}`);
      const bilanz = await text(page, "#ug-bilanz");
      const m = bilanz.match(/Lücke .* [=≈] (−?[\d,]+) —/);
      pruefe(!!m && nahe(zahl(m[1]), A / (1 - Q) - s, 6e-5), `${wo}: Lücke ${m && m[1]} statt ${(A / (1 - Q) - s).toFixed(5)} — „${bilanz}“`);
    }
  }
}

// ---------- 8. Harmonische Reihe ----------
async function harmonisch(page) {
  for (const k of [1, 3, 6]) {
    await setzeRegler(page, "hr-k", k);
    const wo = `Harmonische Reihe, ${k} Blöcke`;
    const d = await page.evaluate(() => {
      const svg = document.querySelector("#hr-mount svg");
      const ys = [...svg.querySelectorAll('line[data-achse="y"]')].map((l) => ({ w: Number(l.dataset.wert), p: Number(l.getAttribute("y1")) }));
      const s = (ys[ys.length - 1].p - ys[0].p) / (ys[ys.length - 1].w - ys[0].w);
      return [...svg.querySelectorAll("rect[data-m]")].map((r) => ({ m: Number(r.dataset.m), block: Number(r.dataset.block), h: -Number(r.getAttribute("height")) / s }));
    });
    pruefe(d.length === Math.pow(2, k), `${wo}: ${d.length} Säulen statt ${Math.pow(2, k)}`);
    for (const r of d) pruefe(nahe(r.h, 1 / r.m, 2e-3), `${wo}: Säule ${r.m} hat die Höhe ${r.h.toFixed(4)} statt ${1 / r.m}`);
    for (let j = 1; j <= k; j++) {
      const summe = d.filter((r) => r.block === j).reduce((s, r) => s + 1 / r.m, 0);
      pruefe(summe >= 0.5 - 1e-12, `${wo}: Block ${j} hat die Summe ${summe} < ½`);
    }
    let H = 0;
    for (let m = 1; m <= Math.pow(2, k); m++) H += 1 / m;
    const bilanz = await text(page, "#hr-bilanz");
    const m = bilanz.match(/1 \+ Blöcke [=≈] ([\d,]+) ≥ 1 \+ (\d+) · ½/);
    pruefe(!!m && nahe(zahl(m[1]), H, 6e-5) && Number(m[2]) === k, `${wo}: Bilanz ${m && m.slice(1)} statt ${H.toFixed(4)} — „${bilanz}“`);
  }
}

async function quizze(page) {
  const ids = await page.evaluate(() => [...document.querySelectorAll(".quiz")].map((q) => q.id));
  pruefe(ids.length === 8, `Kontrollfragen: ${ids.length} statt 8`);
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
  pruefe(/href="#sec-grenzwert"/.test(aus), `Selbsteinschätzung: kein Verweis zurück zum Grenzwert — „${aus}“`);
  await page.evaluate(() => localStorage.clear());
}

const T = 0.0001;
// Gemessen mit UPLANT_ZUEGE=25 tests/werkzeug-streuung.js (200 Würfe je Aufgabe, 10⁻⁴-Quantil für 0,8 · n):
//   UPLANT_ZUEGE=25 node tests/werkzeug-streuung.js /mathematik/mss11/01-analysis/01-folgen-und-reihen/index.html
const SCHRANKE = {1: 20, 2: 16, 3: 22, 4: 18, 5: 22, 6: 12, 7: 21, 8: 18, 9: 21, 10: 20, 11: 14, 12: 20, 13: 17, 14: 16, 15: 14, 16: 15};

const TIEF = { "₀": 0, "₁": 1, "₂": 2, "₃": 3, "₄": 4, "₅": 5, "₆": 6, "₇": 7, "₈": 8, "₉": 9 };
const index = (s) => Number([...s].map((c) => TIEF[c]).join(""));
const vz = (zeichen, betrag) => (zeichen === "−" ? -1 : 1) * zahl(betrag);

async function aufgaben(page) {
  const r = 25;
  const A = (nr, name, deute) => pruefeAufgabe(page, bericht, { nr, name, runden: r, mindestensVerschieden: SCHRANKE[nr] ?? 5, deute });
  await A(1, "A1 explizit", (f) => {
    const m = f.match(/aₙ = (−?\d*)n² ([+−]) (\d+)\. Berechne a([₀-₉]+)/);
    if (!m) return null;
    const p = m[1] === "" ? 1 : m[1] === "−" ? -1 : zahl(m[1]);
    const rr = vz(m[2], m[3]), n = index(m[4]);
    return { richtig: p * n * n + rr, toleranz: T, falsch: [[p * (n - 1) ** 2 + rr, "Index ist die Stelle"], [p === 1 ? NaN : (p * n) ** 2 + rr, "Potenz vor Punkt"], [p * n * n - rr, "Vorzeichen"]] };
  });
  await A(2, "A2 rekursiv", (f) => {
    const m = f.match(/a₁ = (−?\d+) und an\+1 = (−?\d*)(?: · )?aₙ ([+−]) (\d+)\. Berechne a₄/);
    if (!m) return null;
    const a1 = zahl(m[1]), c = m[2] === "−" ? -1 : zahl(m[2]), d = vz(m[3], m[4]);
    const a = [a1];
    for (let i = 0; i < 4; i++) a.push(c * a[i] + d);
    return { richtig: a[3], toleranz: T, falsch: [[a[2], "es fehlt noch ein Schritt"], [a[4], "ein Schritt zu viel"], [c * 4 + d, "keine explizite Formel"]] };
  });
  await A(3, "A3 arithmetisch", (f) => {
    const m = f.match(/a₁ = (−?[\d,]+) und d = (−?[\d,]+)\. Berechne a([₀-₉]+)/);
    if (!m) return null;
    const a1 = zahl(m[1]), d = zahl(m[2]), n = index(m[3]);
    return { richtig: a1 + (n - 1) * d, toleranz: T, falsch: [[a1 + n * d, "Schritte, nicht"], [d + (n - 1) * a1, "vertauscht"]] };
  });
  await A(4, "A4 geometrisch", (f) => {
    const m = f.match(/a₁ = (−?[\d,]+) und q = (−?[\d,]+)\. Berechne a([₀-₉]+)/);
    if (!m) return null;
    const a1 = zahl(m[1]), q = zahl(m[2]), n = index(m[3]);
    return { richtig: a1 * q ** (n - 1), toleranz: T, falsch: [[a1 * q ** n, "(n − 1)-mal"], [(a1 * q) ** (n - 1), "Nur q wird potenziert"], [a1 * q * (n - 1), "nicht mal (n − 1)"]] };
  });
  await A(5, "A5 arithmetisch aus zwei Gliedern", (f) => {
    const m = f.match(/a([₀-₉]+) = (−?\d+) und a([₀-₉]+) = (−?\d+)\. Berechne a([₀-₉]+)/);
    if (!m) return null;
    const k = index(m[1]), ak = zahl(m[2]), mm = index(m[3]), am = zahl(m[4]), n = index(m[5]);
    const d = (am - ak) / (mm - k);
    return { richtig: ak + (n - k) * d, toleranz: T, falsch: [[ak + (n - k) * ((am - ak) / (mm - k + 1)), "Schritte, nicht"], [ak + (n - 1) * d, "ist nicht a₁"]] };
  });
  await A(6, "A6 geometrisch aus zwei Gliedern", (f) => {
    const m = f.match(/a₂ = (−?[\d.,]+) und a₅ = (−?[\d.,]+)\. Berechne a₇/);
    if (!m) return null;
    const a2 = zahl(m[1]), a5 = zahl(m[2]);
    const q = Math.cbrt(a5 / a2);
    return { richtig: a5 * q * q, toleranz: T, falsch: [[a5 + 2 * ((a5 - a2) / 3), "arithmetische Folge"], [a5 * q, "Das ist a₆"], [(a2 / q) * q ** 7, "Das ist a₈"]] };
  });
  await A(7, "A7 arithmetische Summe", (f) => {
    const m = f.match(/a₁ = (−?[\d,]+) und d = (−?[\d,]+)\. Berechne die Summe der ersten (\d+) Glieder/);
    if (!m) return null;
    const a1 = zahl(m[1]), d = zahl(m[2]), n = Number(m[3]);
    // Unabhängig: Glied für Glied aufaddiert, nicht über die Summenformel.
    let s = 0;
    for (let k = 1; k <= n; k++) s += a1 + (k - 1) * d;
    const an = a1 + (n - 1) * d;
    return { richtig: s, toleranz: T, falsch: [[n * (a1 + an), "ganze Rechteck"], [(n * (2 * a1 + n * d)) / 2, "Das letzte Glied"], [n * an, "so groß wie das letzte"]] };
  });
  await A(8, "A8 geometrische Summe", (f) => {
    const m = f.match(/a₁ = (−?[\d,]+) und q = (−?[\d,]+)\. Berechne s([₀-₉]+)/);
    if (!m) return null;
    const a1 = zahl(m[1]), q = zahl(m[2]), n = index(m[3]);
    let s = 0;
    for (let k = 0; k < n; k++) s += a1 * q ** k;
    return { richtig: s, toleranz: T, falsch: [[s - a1 * q ** (n - 1), "Anzahl der Summanden"], [s + a1 * q ** n, "ein Summand zu viel"], [a1 * q ** (n - 1), "nur das letzte Glied"]] };
  });
  await A(9, "A9 Grenzwert eines Bruchs", (f) => {
    const m = f.match(/\(Zähler: (−?\d*)n(²?) ([+−]) (\d+)n?; Nenner: (\d*)n²? ([+−]) (\d+)\.\)/);
    if (!m) return null;
    const p = m[1] === "" ? 1 : m[1] === "−" ? -1 : zahl(m[1]);
    const rr = vz(m[3], m[4]), s = m[5] === "" ? 1 : Number(m[5]), t = vz(m[6], m[7]);
    // Unabhängig: den Bruch bei n = 10⁶ auswerten — die Abweichung vom Grenzwert ist dort winzig.
    const n = 1e6, grad = m[2] === "²" ? 2 : 1;
    const wert = grad === 2 ? (p * n * n + rr * n) / (s * n * n + t) : (p * n + rr) / (s * n + t);
    return { richtig: p / s, toleranz: T, pruefe: () => bericht.pruefe(Math.abs(wert - p / s) < 1e-4, `A9: der Bruch bei n = 10⁶ ist ${wert}, nicht ${p / s}`), falsch: [[rr / t, "niedrigeren Potenzen"], [(p + rr) / (s + t), "Das ist a₁"], [0, "gleich schnell"]] };
  });
  await A(10, "A10 n₀", (f) => {
    const m = f.match(/aₙ = (?:(−?\d+) )?([+−])? ?(\d) n hat den Grenzwert g = (−?\d+).*ε = ([\d,]+)/);
    if (!m) return null;
    const c = Number(m[3]), g = zahl(m[4]), eps = zahl(m[5]);
    // Unabhängig gesucht: das kleinste n mit c/n < ε (der Abstand fällt monoton).
    let n0 = 1;
    while (!(c / n0 < eps - 1e-12)) n0++;
    const k = Math.round(1 / eps);
    return { richtig: n0, toleranz: 0.5, falsch: [[c * k, "nicht kleiner als ε"], [c === 1 ? NaN : k + 1, "nicht 1/n"]], pruefe: () => bericht.pruefe(Number.isFinite(g), "A10: Grenzwert nicht gelesen") };
  });
  await A(11, "A11 unendliche geometrische Reihe", (f) => {
    const m = f.match(/Reihe (−?[\d,]+) ([+−]) ([\d,]+) ([+−]) ([\d,]+) ([+−]) ([\d,]+)/);
    if (!m) return null;
    const a1 = zahl(m[1]), a2 = vz(m[2], m[3]), a3 = vz(m[4], m[5]);
    const q = a2 / a1;
    if (Math.abs(a3 - a2 * q) > 1e-6) return null;
    // Unabhängig: die Partialsummen bis zu 400 Gliedern — bei |q| ≤ ¾ ist der Rest dort verschwindend.
    let s = 0;
    for (let k = 0; k < 400; k++) s += a1 * q ** k;
    return { richtig: s, toleranz: T, falsch: [[a1 / (1 + q), "Vorzeichen von q"], [a1 + a2 + a3, "ersten drei Glieder"], [a1 / q, "nicht q"]] };
  });
  await A(12, "A12 periodische Dezimalzahl", (f) => {
    const m = f.match(/Schreibe 0,(\d)?(\d\d) als Bruch/);
    if (!m) return null;
    const vor = m[1] === undefined ? null : Number(m[1]), p = Number(m[2]);
    const soll = vor === null ? p / 99 : vor / 10 + p / 990;
    // Unabhängig: die Dezimalzahl auf 40 Stellen ausschreiben und vergleichen.
    let s = vor === null ? "0." : "0." + vor;
    while (s.length < 42) s += m[2];
    const richtigBruch = vor === null ? `${p}/99` : `${vor * 99 + p}/990`;
    return { richtig: richtigBruch, toleranz: 1e-7, pruefe: () => bericht.pruefe(Math.abs(parseFloat(s) - soll) < 1e-12, `A12: ${richtigBruch} ist nicht 0,${vor ?? ""}(${p})`), falsch: [[vor === null ? `${p}/100` : `${vor * 100 + p}/1000`, "abgebrochene Dezimalzahl"], [vor === null ? `${p}/90` : `${vor * 100 + p}/999`, "nicht 90"]] };
  });
  await A(13, "A13 Trainingsplan", (f) => {
    const m = f.match(/ersten Trainingstag ([\d,]+) km .* jedem weiteren Tag ([\d,]+) km mehr .* mindestens (\d+) km/);
    if (!m) return null;
    const a1 = zahl(m[1]), d = zahl(m[2]), S = Number(m[3]);
    let n = 0, s = 0;
    while (s < S) { n++; s += a1 + (n - 1) * d; }
    return { richtig: n, toleranz: 0.5, falsch: [[n - 1, "noch weniger"], [Math.ceil(S / a1), "nicht jeden Tag gleich"]] };
  });
  await A(14, "A14 Sparplan", (f) => {
    const m = f.match(/Jahres ([\d.]+) € .* mit (\d) % verzinst .* nach der (\d+)\. Einzahlung/);
    if (!m) return null;
    const R = zahl(m[1]), p = Number(m[2]), n = Number(m[3]);
    // Unabhängig: Jahr für Jahr verzinsen und einzahlen.
    let k = 0;
    for (let j = 1; j <= n; j++) k = k * (1 + p / 100) + R;
    return { richtig: Math.round(k), toleranz: 1, falsch: [[R * n, "Ohne Zinsen"], [k * (1 + p / 100), "Jahresanfang"], [R * (1 + p / 100) ** n, "einzelne"]] };
  });
  await A(15, "A15 springender Ball", (f) => {
    const m = f.match(/aus ([\d,]+) m Höhe .* auf das ([\d,]+)-fache/);
    if (!m) return null;
    const h = zahl(m[1]), q = zahl(m[2]);
    // Unabhängig: 2000 Sprünge einzeln aufaddiert.
    let weg = h, hoehe = h;
    for (let i = 0; i < 2000; i++) { hoehe *= q; weg += 2 * hoehe; }
    return { richtig: Number(weg.toFixed(2)), toleranz: 0.01, falsch: [[h / (1 - q), "zweimal zurückgelegt"], [(2 * h) / (1 - q), "nur hinunter"], [(h * q) / (1 - q), "je einmal gezählt"]] };
  });
  await A(16, "A16 Achilles", (f) => {
    const m = f.match(/läuft (\d+)-mal so schnell .* die (\d+) m Vorsprung/);
    if (!m) return null;
    const r2 = Number(m[1]), V = Number(m[2]);
    // Unabhängig über die Bewegung: Einholen, wenn x = V + x/r, also x = V · r/(r − 1).
    const x = (V * r2) / (r2 - 1);
    return { richtig: Number(x.toFixed(2)), toleranz: 0.01, falsch: [[V, "erste Teilstück"], [V * (1 + 1 / r2), "ersten beiden"], [V / (1 + 1 / r2), "Vorzeichen"]] };
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
      await explizitRekursiv(page);
      await arithGeo(page);
      await monotonie(page);
      await grenzwert(page);
      await gauss(page);
      await geoSumme(page);
      await unendlich(page);
      await harmonisch(page);
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
