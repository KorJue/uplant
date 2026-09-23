// Fachliche Prüfung: MSS 13, Wahrscheinlichkeitsrechnung, Thema 5 „Bernoulli-Ketten und
// Binomialverteilung“.
//
// Die Seite behauptet in jedem Abschnitt eine Zahl und zeigt sie als Zeichnung. Beides wird hier
// UNABHÄNGIG nachgerechnet — mit einer eigenen Binomialverteilung, nicht mit der der Seite:
//
//   * Histogramme werden aus dem SVG zurückgelesen: Der Maßstab kommt aus zwei Gitterlinien, jede
//     Säulenhöhe muss die nachgerechnete Wahrscheinlichkeit sein. Grün markierte Säulen müssen
//     genau zum gewählten Ereignis gehören.
//   * Das Gitter der 36 Würfelergebnisse, die Pfade des Baums, die Wörter aus T und N und das
//     Pascal'sche Dreieck werden gezählt, nicht abgelesen.
//   * Die Bilanzen müssen die nachgerechneten Zahlen nennen, und zwar an vielen Reglerstellungen.
//   * Jede der sechzehn Aufgaben wird über viele Runden gewürfelt, nachgerechnet und mit jedem
//     vorgesehenen Fehlerwert geprüft.
//
// Diese Seite liegt außerhalb des Grundwissens und wird deshalb von test-seiten-gesamt.js nicht
// gefunden. Verweise, Skriptfehler in beiden Modi, Menüeintrag und Formelsammlung prüft diese
// Datei selbst.

"use strict";

const { neuerBericht } = require("../lib/pruefen");
const { starteBrowser, neueSeite, oeffne, setzeRegler, text } = require("../lib/seite");
const { pruefeNotation } = require("../lib/notation");
const { pruefeKontrast } = require("../lib/kontrast");
const { pruefeAufgabe } = require("../lib/aufgaben");
const fs = require("fs");
const path = require("path");

const bericht = neuerBericht();
const { pruefe } = bericht;
const ORDNER = "/mathematik/mss13/01-wahrscheinlichkeitsrechnung/05-bernoulli-ketten-binomialverteilung/";
const SEITE = ORDNER + "index.html";
const WURZEL = path.resolve(__dirname, "..", "..");

// Deutsche Zahl mit höchstens `stellen` Nachkommastellen — so, wie die Seite sie schreibt.
const de = (x, stellen = 4) => {
  const g = Number(x.toFixed(stellen));
  return (g === 0 ? 0 : g).toLocaleString("de-DE", { maximumFractionDigits: stellen }).replace("-", "−");
};

// ---------- eigene Binomialverteilung (unabhängig von der Seite) ----------
//
// Über Logarithmen, nicht über den Binomialkoeffizienten der Seite: Ein Fehler dort fiele sonst
// in Prüfung und Seite gleichermaßen und bliebe unbemerkt.
function lnFak(n) {
  let s = 0;
  for (let i = 2; i <= n; i++) s += Math.log(i);
  return s;
}
function kombi(n, k) {
  if (k < 0 || k > n) return 0;
  return Math.round(Math.exp(lnFak(n) - lnFak(k) - lnFak(n - k)));
}
function Bb(n, p, k) {
  if (k < 0 || k > n) return 0;
  if (p === 0) return k === 0 ? 1 : 0;
  if (p === 1) return k === n ? 1 : 0;
  return Math.exp(lnFak(n) - lnFak(k) - lnFak(n - k) + k * Math.log(p) + (n - k) * Math.log(1 - p));
}
function Fb(n, p, k) {
  let s = 0;
  for (let i = 0; i <= Math.min(k, n); i++) s += Bb(n, p, i);
  return k < 0 ? 0 : Math.min(1, s);
}

// ---------- Histogramm aus dem SVG ----------
//
// Maßstab aus den Gitterlinien: zwei Linien mit bekanntem Wert (data-wert) → Bildpunkte je Einheit.
async function liesHistogramm(page, mountId) {
  return page.evaluate((id) => {
    const svg = document.querySelector(`#${id} svg`);
    if (!svg) return null;
    const linien = [...svg.querySelectorAll(".bk-gitterlinie")].map((l) => ({ wert: Number(l.dataset.wert), y: Number(l.getAttribute("y1")) }));
    const saeulen = [...svg.querySelectorAll("rect.bk-saeule:not(.vergleich)")].map((r) => ({
      x: Number(r.dataset.x), y: Number(r.getAttribute("y")), h: Number(r.getAttribute("height")),
      links: Number(r.getAttribute("x")), breite: Number(r.getAttribute("width")),
      klasse: r.getAttribute("class"),
    }));
    const mu = svg.querySelector(".bk-mu");
    return { linien, saeulen, muX: mu ? Number(mu.getAttribute("x1")) : null };
  }, mountId);
}
function hoehenAusBild(h) {
  const a = h.linien[0], b = h.linien[h.linien.length - 1];
  const proEinheit = (a.y - b.y) / (b.wert - a.wert);
  const basis = a.y + a.wert * proEinheit;
  return h.saeulen.map((s) => ({ ...s, p: (basis - s.y) / proEinheit, unten: (basis - s.y - s.h) / proEinheit }));
}

// ════════════════ 1. Zufallsgröße ════════════════

const ZG = {
  summe: (a, b) => a + b,
  differenz: (a, b) => Math.abs(a - b),
  maximum: (a, b) => Math.max(a, b),
  sechsen: (a, b) => (a === 6 ? 1 : 0) + (b === 6 ? 1 : 0),
};
const REL = { eq: (v, x) => v === x, le: (v, x) => v <= x, lt: (v, x) => v < x, ge: (v, x) => v >= x, gt: (v, x) => v > x };
const RELZ = { eq: "=", le: "≤", lt: "<", ge: "≥", gt: ">" };

async function zufallsgroesse(page) {
  for (const art of Object.keys(ZG)) {
    await page.selectOption("#zg-art", art);
    const [min, max] = await page.evaluate(() => [Number(document.getElementById("zg-x").min), Number(document.getElementById("zg-x").max)]);
    const werte = new Map();
    for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) { const v = ZG[art](a, b); werte.set(v, (werte.get(v) || 0) + 1); }
    pruefe(min === Math.min(...werte.keys()) && max === Math.max(...werte.keys()),
      `Zufallsgröße ${art}: der Regler reicht von ${min} bis ${max}, die Werte von ${Math.min(...werte.keys())} bis ${Math.max(...werte.keys())}`);
    for (const rel of Object.keys(REL)) {
      await page.selectOption("#zg-rel", rel);
      for (const wunsch of [min, Math.round((min + max) / 2), max]) {
        const x = await setzeRegler(page, "zg-x", wunsch);
        const wo = `Zufallsgröße ${art}, X ${RELZ[rel]} ${x}`;
        const zellen = await page.evaluate(() => [...document.querySelectorAll("#zg-gitter rect.bk-zelle")].map((r) => ({
          a: Number(r.dataset.a), b: Number(r.dataset.b), wert: Number(r.dataset.wert), aktiv: r.classList.contains("aktiv"),
          text: r.nextElementSibling ? r.nextElementSibling.textContent : "",
        })));
        pruefe(zellen.length === 36, `${wo}: ${zellen.length} Ergebnisse im Gitter statt 36`);
        let treffer = 0;
        for (const z of zellen) {
          const soll = ZG[art](z.a, z.b);
          pruefe(z.wert === soll && Number(z.text) === soll, `${wo}: Ergebnis (${z.a}|${z.b}) zeigt ${z.text} statt ${soll}`);
          const drin = REL[rel](soll, x);
          if (drin) treffer++;
          pruefe(z.aktiv === drin, `${wo}: Ergebnis (${z.a}|${z.b}) ist ${z.aktiv ? "" : "nicht "}markiert`);
        }
        // Histogramm: jede Säule = Anzahl : 36
        const h = await liesHistogramm(page, "zg-histo");
        for (const s of hoehenAusBild(h)) {
          const soll = (werte.get(s.x) || 0) / 36;
          pruefe(Math.abs(s.p - soll) < 0.002, `${wo}: die Säule bei ${s.x} ist ${s.p.toFixed(4)} hoch statt ${soll.toFixed(4)}`);
          pruefe(s.klasse.includes("aktiv") === REL[rel](s.x, x), `${wo}: die Säule bei ${s.x} ist falsch markiert`);
        }
        const bilanz = await text(page, "#zg-bilanz");
        const P = treffer / 36;
        pruefe(bilanz.includes(`P(X ${RELZ[rel]} ${x})`), `${wo}: die Bilanz nennt das Ereignis nicht — „${bilanz}“`);
        pruefe(P === 0 ? bilanz.includes("= 0") : bilanz.includes(de(P)), `${wo}: die Bilanz nennt nicht P = ${de(P)} — „${bilanz}“`);
        pruefe(bilanz.includes("= 1"), `${wo}: die Kontrolle „Summe = 1“ fehlt`);
      }
    }
  }
}

// ════════════════ 2. Erwartungswert ════════════════

async function erwartungswert(page) {
  const faelle = [[4, 3, 0.5, 2, 0.5], [2, 2, 1, 4, 1.5], [0, 8, 0.75, 3, 0.75], [8, 0, 1, 1, 0], [3, 3, 0, 10, 1.25], [1, 4, 2, 6, 2.5]];
  for (const [rot, weissWunsch, aw, as, einsatz] of faelle) {
    await setzeRegler(page, "ew-rot", rot);
    const weiss = await setzeRegler(page, "ew-weiss", weissWunsch);
    pruefe(weiss <= 8 - rot, `Erwartungswert: ${weiss} weiße Sektoren bei ${rot} roten — zusammen mehr als 8`);
    await setzeRegler(page, "ew-aw", aw);
    await setzeRegler(page, "ew-as", as);
    await setzeRegler(page, "ew-einsatz", einsatz);
    const schwarz = 8 - rot - weiss;
    const wo = `Erwartungswert: rot ${rot}, weiß ${weiss} (${aw} €), schwarz ${schwarz} (${as} €), Einsatz ${einsatz} €`;
    const mu = (weiss * aw + schwarz * as) / 8;
    const V = (rot * (0 - mu) ** 2 + weiss * (aw - mu) ** 2 + schwarz * (as - mu) ** 2) / 8;
    const sigma = Math.sqrt(V);
    const bilanz = await text(page, "#ew-bilanz");
    pruefe(bilanz.includes(de(mu) + " €"), `${wo}: E(X) = ${de(mu)} € fehlt — „${bilanz}“`);
    pruefe(bilanz.includes(de(sigma) + " €"), `${wo}: σ = ${de(sigma)} € fehlt — „${bilanz}“`);
    const fair = Math.abs(mu - einsatz) < 1e-9;
    pruefe(/fair/.test(bilanz) === fair || bilanz.includes("verliert"), `${wo}: das Urteil „fair“ stimmt nicht — „${bilanz}“`);
    pruefe(fair ? /fair/.test(bilanz) : mu < einsatz ? /verliert der Spieler/.test(bilanz) : /verliert der Betreiber/.test(bilanz),
      `${wo}: das Urteil passt nicht zu E(X) − Einsatz = ${de(mu - einsatz)} — „${bilanz}“`);

    // Das Glücksrad: Sektoren zählen.
    const sektoren = await page.evaluate(() => [...document.querySelectorAll("#ew-rad .bk-sektor")].map((s) => s.dataset.farbe));
    pruefe(sektoren.length === 8 && sektoren.filter((f) => f === "rot").length === rot && sektoren.filter((f) => f === "weiss").length === weiss,
      `${wo}: das Glücksrad zeigt ${sektoren.join(", ")}`);

    // Die Waage: Der Drehpunkt liegt dort, wo μ auf der Achse der Gewichte liegt. Die Achse wird aus
    // zwei Gewichten mit verschiedenen Beträgen zurückgerechnet.
    const waage = await page.evaluate(() => ({
      gewichte: [...document.querySelectorAll("#ew-waage circle.bk-saeule")].map((c) => ({ x: Number(c.dataset.x), cx: Number(c.getAttribute("cx")), r: Number(c.getAttribute("r")) })),
      dreh: (() => { const pts = document.querySelector("#ew-waage .bk-drehpunkt").getAttribute("points").split(" ")[0].split(","); return Number(pts[0]); })(),
    }));
    const g = waage.gewichte;
    if (g.length >= 2 && Math.abs(g[g.length - 1].x - g[0].x) > 1e-9) {
      const proEuro = (g[g.length - 1].cx - g[0].cx) / (g[g.length - 1].x - g[0].x);
      const soll = g[0].cx + (mu - g[0].x) * proEuro;
      pruefe(Math.abs(waage.dreh - soll) < 1, `${wo}: der Drehpunkt steht bei ${waage.dreh.toFixed(1)} px statt bei μ (${soll.toFixed(1)} px)`);
      // Gleichgewicht: Summe der Hebelmomente um den Drehpunkt, gewichtet mit der Wahrscheinlichkeit.
      const anteil = (x) => (Math.abs(x - 0) < 1e-9 ? rot : 0) + (Math.abs(x - aw) < 1e-9 ? weiss : 0) + (Math.abs(x - as) < 1e-9 ? schwarz : 0);
      const moment = g.reduce((s, w) => s + (w.cx - waage.dreh) * anteil(w.x) / 8, 0);
      pruefe(Math.abs(moment) < 0.5, `${wo}: die Waage ist nicht im Gleichgewicht (Moment ${moment.toFixed(2)})`);
    }
  }
}

// ════════════════ 3. Bernoulli-Kette am Baum ════════════════

const P_OPTIONEN = { "1/6": 1 / 6, "1/4": 0.25, "1/3": 1 / 3, "1/2": 0.5, "0.2": 0.2, "0.4": 0.4, "0.7": 0.7, "0.9": 0.9 };

async function bernoulliKette(page) {
  for (const [wert, p] of Object.entries(P_OPTIONEN)) {
    await page.selectOption("#bk-p", wert);
    for (let n = 1; n <= 4; n++) {
      await setzeRegler(page, "bk-n", n);
      for (let wunsch = 0; wunsch <= 4; wunsch++) {
        const k = await setzeRegler(page, "bk-k", wunsch);
        const wo = `Bernoulli-Kette n = ${n}, p = ${wert}, k = ${k}`;
        pruefe(k === Math.min(wunsch, n), `${wo}: der Regler steht auf ${k} statt auf ${Math.min(wunsch, n)}`);
        const blaetter = await page.evaluate(() => [...document.querySelectorAll("#bk-mount .bk-blatt")].map((b) => ({ wort: b.dataset.wort, aktiv: b.classList.contains("aktiv") })));
        pruefe(blaetter.length === 2 ** n, `${wo}: ${blaetter.length} Blätter statt ${2 ** n}`);
        pruefe(new Set(blaetter.map((b) => b.wort)).size === 2 ** n, `${wo}: nicht alle Pfade sind verschieden`);
        for (const b of blaetter) {
          const t = [...b.wort].filter((c) => c === "T").length;
          pruefe(b.aktiv === (t === k), `${wo}: der Pfad ${b.wort} ist ${b.aktiv ? "" : "nicht "}markiert`);
        }
        const P = Bb(n, p, k);
        const bilanz = await text(page, "#bk-bilanz");
        pruefe(bilanz.includes(`das sind ${kombi(n, k)}`), `${wo}: die Bilanz zählt nicht ${kombi(n, k)} Pfade — „${bilanz}“`);
        pruefe(bilanz.includes(`P(X = ${k}) = ${kombi(n, k)} ·`) && bilanz.includes(de(P)), `${wo}: P(X = ${k}) = ${de(P)} fehlt — „${bilanz}“`);
      }
    }
  }
}

// ════════════════ 4. Binomialkoeffizient ════════════════

async function binomialkoeffizient(page) {
  // Das Dreieck ist fest: jede Zahl einzeln gegen den eigenen Binomialkoeffizienten.
  const felder = await page.evaluate(() => [...document.querySelectorAll("#ko-pascal rect.bk-pascal")].map((r) => ({
    n: Number(r.dataset.n), k: Number(r.dataset.k), text: r.nextElementSibling.textContent,
  })));
  pruefe(felder.length === 66, `Pascal'sches Dreieck: ${felder.length} Felder statt 66`);
  for (const f of felder) pruefe(Number(f.text.replace(/\./g, "")) === kombi(f.n, f.k), `Pascal'sches Dreieck: (${f.n} über ${f.k}) zeigt ${f.text}`);
  for (const n of [1, 3, 5, 7, 10]) {
    await setzeRegler(page, "ko-n", n);
    for (const wunsch of [0, 1, Math.floor(n / 2), n, 10]) {
      const k = await setzeRegler(page, "ko-k", wunsch);
      const wo = `Binomialkoeffizient (${n} über ${k})`;
      pruefe(k <= n, `${wo}: der Regler steht auf k = ${k} > n`);
      const c = kombi(n, k);
      const aktiv = await page.evaluate(() => [...document.querySelectorAll("#ko-pascal rect.bk-pascal.aktiv")].map((r) => [Number(r.dataset.n), Number(r.dataset.k)]));
      pruefe(aktiv.length === 1 && aktiv[0][0] === n && aktiv[0][1] === k, `${wo}: im Dreieck ist ${JSON.stringify(aktiv)} markiert`);
      const woerter = await page.evaluate(() => [...document.querySelectorAll("#ko-woerter .bk-wort")].map((w) => w.textContent));
      if (c <= 70) {
        pruefe(woerter.length === c, `${wo}: ${woerter.length} Wörter statt ${c}`);
        pruefe(new Set(woerter).size === woerter.length, `${wo}: ein Wort kommt doppelt vor`);
        pruefe(woerter.every((w) => w.length === n && [...w].filter((z) => z === "T").length === k), `${wo}: ein Wort hat nicht genau ${k}-mal T`);
      }
      const bilanz = await text(page, "#ko-bilanz");
      pruefe(bilanz.includes(`= ${c.toLocaleString("de-DE")}`), `${wo}: der Wert ${c} fehlt in der Bilanz — „${bilanz}“`);
    }
  }
}

// ════════════════ 5./6. Formel und Verteilung ════════════════

async function pruefeHistogrammBinomial(page, mountId, n, p, wo) {
  const h = await liesHistogramm(page, mountId);
  const saeulen = hoehenAusBild(h);
  pruefe(saeulen.length === n + 1, `${wo}: ${saeulen.length} Säulen statt ${n + 1}`);
  let summe = 0;
  for (const s of saeulen) {
    const soll = Bb(n, p, s.x);
    summe += s.p;
    pruefe(Math.abs(s.p - soll) < 0.0015, `${wo}: die Säule bei k = ${s.x} ist ${s.p.toFixed(4)} hoch statt ${soll.toFixed(4)}`);
  }
  pruefe(Math.abs(summe - 1) < 0.01, `${wo}: die Säulen ergeben zusammen ${summe.toFixed(4)} statt 1`);
  return { h, saeulen };
}

async function formel(page) {
  for (const [n, p, k] of [[10, 0.3, 3], [1, 0.5, 1], [20, 0.05, 0], [20, 0.95, 20], [15, 0.6, 11], [12, 0.25, 7]]) {
    await setzeRegler(page, "bf-n", n);
    const pp = await setzeRegler(page, "bf-p", p);
    const kk = await setzeRegler(page, "bf-k", k);
    const wo = `Formel n = ${n}, p = ${pp}, k = ${kk}`;
    const P = Bb(n, pp, kk);
    const bilanz = await text(page, "#bf-bilanz");
    pruefe(bilanz.includes(`B(${n}; ${de(pp, 2)}; ${kk})`), `${wo}: die Schreibweise B(n; p; k) fehlt — „${bilanz}“`);
    pruefe(bilanz.includes(`B${n};${de(pp, 2)}(${kk})`), `${wo}: die Schreibweise aus Fundamente fehlt — „${bilanz}“`);
    pruefe(bilanz.includes(de(P)), `${wo}: P = ${de(P)} fehlt — „${bilanz}“`);
    if (pp > 0.5) pruefe(bilanz.includes(`B(${n}; ${de(1 - pp, 2)}; ${n - kk})`), `${wo}: der Tabellenweg für p > 0,5 fehlt`);
    const faktoren = await text(page, "#bf-faktoren");
    pruefe(faktoren.includes(kombi(n, kk).toLocaleString("de-DE")), `${wo}: der Binomialkoeffizient ${kombi(n, kk)} fehlt bei den Faktoren`);
    const { saeulen } = await pruefeHistogrammBinomial(page, "bf-mount", n, pp, wo);
    for (const s of saeulen) pruefe(s.klasse.includes("aktiv") === (s.x === kk), `${wo}: die Säule bei ${s.x} ist falsch markiert`);
  }
}

async function verteilung(page) {
  for (const [n, p] of [[10, 0.3], [1, 0.5], [60, 0.05], [60, 0.95], [25, 0.5], [40, 0.7]]) {
    await setzeRegler(page, "hv-n", n);
    const pp = await setzeRegler(page, "hv-p", p);
    const wo = `Verteilung n = ${n}, p = ${pp}`;
    const { h, saeulen } = await pruefeHistogrammBinomial(page, "hv-mount", n, pp, wo);
    const max = Math.max(...Array.from({ length: n + 1 }, (_, k) => Bb(n, pp, k)));
    for (const s of saeulen) pruefe(s.klasse.includes("aktiv") === (Math.abs(Bb(n, pp, s.x) - max) < 1e-12), `${wo}: die höchste Säule ist falsch markiert (k = ${s.x})`);
    // μ-Linie bei n · p: aus zwei Säulenmitten zurückgerechnet
    const a = saeulen[0], b = saeulen[saeulen.length - 1];
    const proK = n > 0 ? ((b.links + b.breite / 2) - (a.links + a.breite / 2)) / (b.x - a.x) : 0;
    if (n > 0) pruefe(Math.abs(h.muX - (a.links + a.breite / 2 + (n * pp - a.x) * proK)) < 1, `${wo}: die μ-Linie steht nicht bei n · p = ${de(n * pp)}`);
    const bilanz = await text(page, "#hv-bilanz");
    pruefe(bilanz.includes(`μ = n · p = ${n} · ${de(pp, 2)} = ${de(n * pp)}`), `${wo}: μ = ${de(n * pp)} fehlt — „${bilanz}“`);
    const gestalt = Math.abs(pp - 0.5) < 1e-9 ? "symmetrisch" : pp < 0.5 ? "linkslastig" : "rechtslastig";
    pruefe(bilanz.includes(gestalt), `${wo}: die Gestalt „${gestalt}“ fehlt — „${bilanz}“`);
  }
  // Das Spiegelbild für 1 − p
  await setzeRegler(page, "hv-n", 12);
  await setzeRegler(page, "hv-p", 0.3);
  await page.locator("#hv-spiegel").check();
  const vergleich = await page.evaluate(() => [...document.querySelectorAll("#hv-mount rect.vergleich")].map((r) => Number(r.dataset.vergleich)));
  pruefe(vergleich.length === 13, `Verteilung: das Spiegelbild hat ${vergleich.length} Säulen statt 13`);
  await page.locator("#hv-spiegel").uncheck();
}

// ════════════════ 7. kumuliert ════════════════

async function kumuliert(page) {
  const faelle = [["le", 4, 0], ["lt", 4, 0], ["ge", 6, 0], ["gt", 6, 0], ["zw", 3, 7], ["ge", 0, 0], ["lt", 0, 0], ["zw", 0, 5], ["le", 20, 0]];
  for (const [n, p] of [[20, 0.2], [15, 0.7], [8, 0.5]]) {
    await setzeRegler(page, "ku-n", n);
    const pp = await setzeRegler(page, "ku-p", p);
    for (const [art, aw, bw] of faelle) {
      await page.selectOption("#ku-art", art);
      const a = await setzeRegler(page, "ku-a", aw);
      const b = art === "zw" ? await setzeRegler(page, "ku-b", bw) : null;
      pruefe(a <= n, `Kumuliert: a = ${a} > n = ${n}`);
      const wo = `Kumuliert n = ${n}, p = ${pp}, ${art} a = ${a}${b !== null ? `, b = ${b}` : ""}`;
      const drin = (k) => art === "le" ? k <= a : art === "lt" ? k < a : art === "ge" ? k >= a : art === "gt" ? k > a : k >= a && k <= b;
      let P = 0;
      for (let k = 0; k <= n; k++) if (drin(k)) P += Bb(n, pp, k);
      const { saeulen } = await pruefeHistogrammBinomial(page, "ku-histo", n, pp, wo);
      for (const s of saeulen) pruefe(s.klasse.includes("aktiv") === drin(s.x), `${wo}: die Säule bei ${s.x} ist ${s.klasse.includes("aktiv") ? "" : "nicht "}grün`);
      const bilanz = await text(page, "#ku-bilanz");
      pruefe(bilanz.includes(de(P)), `${wo}: P = ${de(P)} fehlt — „${bilanz}“`);
      // Die richtige Grenze im F-Wert: „mindestens a“ über F(…; a − 1)
      if (art === "ge" && a > 0) pruefe(bilanz.includes(`1 − F(${n}; ${de(pp, 2)}; ${a - 1})`), `${wo}: die Rechnung nennt nicht 1 − F(…; ${a - 1}) — „${bilanz}“`);
      if (art === "zw" && a > 0) pruefe(bilanz.includes(`F(${n}; ${de(pp, 2)}; ${b}) − F(${n}; ${de(pp, 2)}; ${a - 1})`), `${wo}: die Rechnung nennt nicht F(…; ${b}) − F(…; ${a - 1})`);
      // Die Treppe: jeder Punkt auf der Höhe F(k)
      const treppe = await page.evaluate(() => {
        const svg = document.querySelector("#ku-treppe svg");
        const l = [...svg.querySelectorAll(".bk-gitterlinie")].map((x) => ({ w: Number(x.dataset.wert), y: Number(x.getAttribute("y1")) }));
        const pkt = [...svg.querySelectorAll(".bk-treppe-punkt")].map((c) => ({ k: Number(c.dataset.k), y: Number(c.getAttribute("cy")) }));
        return { l, pkt };
      });
      const la = treppe.l[0], lb = treppe.l[treppe.l.length - 1];
      const pro = (la.y - lb.y) / (lb.w - la.w);
      for (const q of treppe.pkt) {
        const F = (la.y + la.w * pro - q.y) / pro;
        pruefe(Math.abs(F - Fb(n, pp, q.k)) < 0.004, `${wo}: der Treppenpunkt bei k = ${q.k} liegt auf ${F.toFixed(3)} statt ${Fb(n, pp, q.k).toFixed(3)}`);
      }
    }
  }
}

// ════════════════ 8. μ und σ ════════════════

async function kenngroessen(page) {
  for (const [n, p] of [[20, 0.4], [1, 0.5], [100, 0.05], [100, 0.5], [37, 0.85]]) {
    await setzeRegler(page, "kg-n", n);
    const pp = await setzeRegler(page, "kg-p", p);
    const wo = `Kenngrößen n = ${n}, p = ${pp}`;
    let mu = 0, V = 0;
    for (let k = 0; k <= n; k++) mu += k * Bb(n, pp, k);
    for (let k = 0; k <= n; k++) V += (k - mu) ** 2 * Bb(n, pp, k);
    const sigma = Math.sqrt(V);
    pruefe(Math.abs(mu - n * pp) < 1e-9 && Math.abs(V - n * pp * (1 - pp)) < 1e-6, `${wo}: die eigene Nachrechnung trifft n · p bzw. n · p · (1 − p) nicht`);
    const bilanz = await text(page, "#kg-bilanz");
    pruefe(bilanz.includes(`μ = n · p = ${n} · ${de(pp, 2)} = ${de(n * pp)}`), `${wo}: μ fehlt — „${bilanz}“`);
    pruefe(bilanz.includes(de(sigma)), `${wo}: σ = ${de(sigma)} fehlt — „${bilanz}“`);
    const { saeulen } = await pruefeHistogrammBinomial(page, "kg-mount", n, pp, wo);
    for (const s of saeulen) {
      const im = s.x >= mu - sigma - 1e-9 && s.x <= mu + sigma + 1e-9;
      pruefe(s.klasse.includes("aktiv") === im, `${wo}: die Säule bei ${s.x} liegt ${im ? "im" : "außerhalb des"} Band(s) μ ± σ, ist aber anders markiert`);
    }
  }
}

// ════════════════ 9. Parameter gesucht ════════════════

async function parameter(page) {
  // n gesucht: Das kleinste n wird durch Hochzählen bestimmt, nicht über den Logarithmus.
  await page.selectOption("#pa-art", "n");
  for (const [p, a] of [[0.25, 0.95], [0.05, 0.99], [0.5, 0.5], [0.95, 0.99], [0.1, 0.9]]) {
    const pp = await setzeRegler(page, "pa-p", p);
    const aa = await setzeRegler(page, "pa-sicher", a);
    let n = 1;
    while (1 - (1 - pp) ** n < aa - 1e-12) n++;
    const wo = `n gesucht, p = ${pp}, Sicherheit ${aa}`;
    const bilanz = await text(page, "#pa-bilanz");
    pruefe(bilanz.includes(`n = ${n}`), `${wo}: n = ${n} fehlt — „${bilanz}“`);
    const h = hoehenAusBild(await liesHistogramm(page, "pa-mount"));
    const gruen = h.filter((s) => s.klasse.includes("aktiv")).map((s) => s.x);
    pruefe(gruen.length === 1 && gruen[0] === n, `${wo}: grün markiert ist ${gruen.join(", ")} statt ${n}`);
    for (const s of h) pruefe(Math.abs(s.p - (1 - (1 - pp) ** s.x)) < 0.004, `${wo}: die Säule bei n = ${s.x} ist ${s.p.toFixed(3)} hoch`);
  }
  // k gesucht
  await page.selectOption("#pa-art", "k");
  for (const [n, p, a] of [[20, 0.25, 0.95], [50, 0.7, 0.9], [10, 0.5, 0.5]]) {
    await setzeRegler(page, "pa-n", n);
    const pp = await setzeRegler(page, "pa-p", p);
    const aa = await setzeRegler(page, "pa-sicher", a);
    let k = 0;
    while (Fb(n, pp, k) < aa - 1e-12) k++;
    const wo = `k gesucht, n = ${n}, p = ${pp}, Sicherheit ${aa}`;
    const bilanz = await text(page, "#pa-bilanz");
    pruefe(bilanz.includes(`k = ${k}`), `${wo}: k = ${k} fehlt — „${bilanz}“`);
    const gruen = await page.evaluate(() => [...document.querySelectorAll("#pa-mount .bk-treppe-punkt.aktiv")].map((c) => Number(c.dataset.k)));
    pruefe(gruen.length === 1 && gruen[0] === k, `${wo}: auf der Treppe ist ${gruen.join(", ")} markiert statt ${k}`);
  }
  // p gesucht
  await page.selectOption("#pa-art", "p");
  for (const [n, a] of [[10, 0.99], [5, 0.9], [50, 0.5]]) {
    await setzeRegler(page, "pa-n", n);
    const aa = await setzeRegler(page, "pa-sicher", a);
    const pmin = 1 - (1 - aa) ** (1 / n);
    const wo = `p gesucht, n = ${n}, Sicherheit ${aa}`;
    const bilanz = await text(page, "#pa-bilanz");
    pruefe(bilanz.includes(de(pmin)), `${wo}: p = ${de(pmin)} fehlt — „${bilanz}“`);
    pruefe(Math.abs(1 - (1 - pmin) ** n - aa) < 1e-9, `${wo}: die eigene Probe geht nicht auf`);
  }
  await page.selectOption("#pa-art", "n");
}

// ════════════════ Kontrollfragen, Selbsteinschätzung ════════════════

async function quizze(page) {
  const ids = await page.evaluate(() => [...document.querySelectorAll(".quiz[id]")].map((q) => q.id));
  pruefe(ids.length === 9, `Kontrollfragen: ${ids.length} statt 9`);
  // Jeder Erarbeitungsabschnitt hat seine eigene Kontrollfrage.
  const ohne = await page.evaluate(() => [...document.querySelectorAll("main section.card[id]")]
    .filter((s) => s.querySelector(".widget") && !s.querySelector(".quiz")).map((s) => s.id));
  pruefe(ohne.length === 0, `Kontrollfragen: Abschnitte ohne Kontrollfrage — ${ohne.join(", ")}`);
  const richtigeStellen = [];
  for (const id of ids) {
    const n = await page.locator(`#${id} .quiz-opt`).count();
    pruefe(n === 4, `Kontrollfrage ${id}: ${n} Antworten statt 4`);
    let richtige = 0;
    for (let i = 0; i < n; i++) {
      await page.locator(`#${id} .quiz-opt`).nth(i).click();
      const fb = await text(page, `#${id} .quiz-feedback`);
      if (fb.startsWith("✓")) { richtige++; richtigeStellen.push(i); }
      pruefe(fb.length > 60, `Kontrollfrage ${id}: die Erklärung ist zu knapp — „${fb}“`);
    }
    pruefe(richtige === 1, `Kontrollfrage ${id}: ${richtige} richtige Antworten statt genau einer`);
  }
  pruefe(new Set(richtigeStellen).size >= 3, `Kontrollfragen: die richtige Antwort steht fast immer an derselben Stelle (${richtigeStellen.join(", ")})`);
}

async function selbsteinschaetzung(page) {
  const zeilen = await page.locator("#se-liste .se-zeile").count();
  pruefe(zeilen === 9, `Selbsteinschätzung: ${zeilen} Punkte statt 9`);
  await page.locator("#se-liste .se-zeile").nth(6).locator("button").nth(2).click();
  const aus = await text(page, "#se-auswertung");
  pruefe(aus.includes("Wiederhole zuerst"), `Selbsteinschätzung: nach „unsicher“ kein Wiederholungshinweis — „${aus}“`);
  const ziel = await page.evaluate(() => document.querySelector("#se-auswertung a").getAttribute("href"));
  pruefe(ziel === "#sec-kumuliert", `Selbsteinschätzung: der Verweis führt nach ${ziel} statt #sec-kumuliert`);
  await page.reload({ waitUntil: "networkidle" });
  const gedrueckt = await page.evaluate(() => document.querySelectorAll('#se-liste button[aria-pressed="true"]').length);
  pruefe(gedrueckt === 1, `Selbsteinschätzung: nach dem Neuladen sind ${gedrueckt} Einschätzungen gespeichert statt 1`);
  await page.evaluate(() => localStorage.removeItem("uplant-mss13-binomial-selbsteinschaetzung"));
  await page.reload({ waitUntil: "networkidle" });
}

// ════════════════ Übungsaufgaben ════════════════

const zahl1 = (s) => Number(String(s).replace(",", "."));

async function aufgaben(page) {
  // Die Schranken sind mit werkzeug-streuung.js gemessen (2026-09-23, 30 Züge, 10⁻⁴-Quantil für
  // 0,8 · n), nicht geschätzt:
  //   UPLANT_ZUEGE=30 node tests/werkzeug-streuung.js /mathematik/mss13/01-wahrscheinlichkeitsrechnung/05-bernoulli-ketten-binomialverteilung/index.html
  const R = 30;

  await pruefeAufgabe(page, bericht, {
    nr: 1, name: "E1 fehlende Wahrscheinlichkeit", runden: R, mindestensVerschieden: 27,   // gemessen: 199/200 verschieden, n ≈ 19834
    deute: (f) => {
      const m = f.match(/P\(X = x\) (\S+) (\S+) (\S+) (\S+) Bestimme/);
      if (!m) return null;
      const ps = m.slice(1).map((s) => (s === "?" ? null : zahl1(s)));
      const bekannt = ps.filter((x) => x !== null).reduce((s, x) => s + x, 0);
      return { richtig: 1 - bekannt, toleranz: 0.0005, falsch: [[bekannt, "Summe der bekannten"]] };
    },
  });
  await pruefeAufgabe(page, bericht, {
    nr: 2, name: "E2 Erwartungswert", runden: R, mindestensVerschieden: 27,   // gemessen: 192/200 verschieden, n ≈ 2421
    deute: (f) => {
      const m = f.match(/x (\S+) (\S+) (\S+) (\S+) P\(X = x\) (\S+) (\S+) (\S+) (\S+) Berechne/);
      if (!m) return null;
      const xs = m.slice(1, 5).map(zahl1), ps = m.slice(5).map(zahl1);
      pruefe(Math.abs(ps.reduce((s, x) => s + x, 0) - 1) < 1e-9, `E2: die Verteilung ergibt nicht 1 — „${f}“`);
      const E = xs.reduce((s, x, i) => s + x * ps[i], 0);
      return { richtig: E, toleranz: 0.0005, falsch: [[xs.reduce((s, x) => s + x, 0) / 4, "einfache Mittel"]] };
    },
  });
  await pruefeAufgabe(page, bericht, {
    nr: 3, name: "E3 Pfade zählen", runden: R, mindestensVerschieden: 18,   // gemessen: 78/200 verschieden, n ≈ 86
    deute: (f) => {
      let m = f.match(/Länge n = (\d+)\. .* genau (\d+) Treffer/);
      let n, k;
      if (m) { n = +m[1]; k = +m[2]; } else {
        m = f.match(/Gruppe von (\d+) Personen sollen (\d+) für/);
        if (!m) return null;
        n = +m[1]; k = +m[2];
      }
      let perm = 1;
      for (let i = 0; i < k; i++) perm *= n - i;
      return { richtig: kombi(n, k), toleranz: 0.4, falsch: [[perm, "Reihenfolge"], [2 ** n, "alle"]] };
    },
  });
  const E4P = { "fairer Würfel": [1 / 6, "eine Sechs"], "faire Münze": [0.5, "„Zahl“"], "Tetraeder-Würfel": [0.25, "die Eins"] };
  await pruefeAufgabe(page, bericht, {
    nr: 4, name: "E4 genau k Treffer", runden: R, mindestensVerschieden: 14,   // gemessen: 47/200 verschieden, n ≈ 48
    deute: (f) => {
      const art = Object.keys(E4P).find((a) => f.includes(a));
      const m = f.match(/wird (\d+)-mal geworfen\. .* genau (\d+)-mal/);
      if (!art || !m) return null;
      const p = E4P[art][0], n = +m[1], k = +m[2];
      return {
        richtig: Bb(n, p, k), toleranz: 0.0005,
        falsch: [[p ** k * (1 - p) ** (n - k), "eines"], [kombi(n, k) * p ** (n - k) * (1 - p) ** k, "vertauscht"], [kombi(n, k) * p ** k, "Nieten fehlt"]],
      };
    },
  });
  await pruefeAufgabe(page, bericht, {
    nr: 5, name: "M1 Standardabweichung", runden: R, mindestensVerschieden: 21,   // gemessen: 124/200 verschieden, n ≈ 190
    deute: (f) => {
      const m = f.match(/x (\S+) (\S+) (\S+) P\(X = x\) (\S+) (\S+) (\S+) Berechne/);
      if (!m) return null;
      const xs = m.slice(1, 4).map(zahl1), ps = m.slice(4).map(zahl1);
      const E = xs.reduce((s, x, i) => s + x * ps[i], 0);
      const V = xs.reduce((s, x, i) => s + (x - E) ** 2 * ps[i], 0);
      return { richtig: Math.sqrt(V), toleranz: 0.005, falsch: [[V, "Varianz"], [E, "Erwartungswert"]] };
    },
  });
  await pruefeAufgabe(page, bericht, {
    nr: 6, name: "M2 fairer Einsatz", runden: R, mindestensVerschieden: 24,   // gemessen: 165/200 verschieden, n ≈ 500
    deute: (f) => {
      const m = f.match(/hat (\d+) gleich große Sektoren\. Bei (\d+) Sektor(?:en)? werden (\d+) € ausgezahlt, bei (\d+) Sektor(?:en)? (\d+) €/);
      if (!m) return null;
      const [mm, a, x1, b, x2] = m.slice(1).map(Number);
      return { richtig: (a * x1 + b * x2) / mm, toleranz: 0.0005, falsch: [[(x1 + x2) / 3, "Mittel der drei"], [a * x1 + b * x2, "Teilen durch"]] };
    },
  });
  await pruefeAufgabe(page, bericht, {
    nr: 7, name: "M3 höchstens k", runden: R, mindestensVerschieden: 22,   // gemessen: 143/200 verschieden, n ≈ 279
    deute: (f) => {
      const m = f.match(/Wahrscheinlichkeit (\S+) fehlerhaft\. Es werden (\d+) Bauteile .* höchstens (\d+) davon/);
      if (!m) return null;
      const p = zahl1(m[1]), n = +m[2], k = +m[3];
      return { richtig: Fb(n, p, k), toleranz: 0.0005, falsch: [[Bb(n, p, k), "genau"], [Fb(n, p, k - 1), "weniger als"], [1 - Fb(n, p, k), "Gegenwahrscheinlichkeit"]] };
    },
  });
  await pruefeAufgabe(page, bericht, {
    nr: 8, name: "M4 μ und σ", runden: R, mindestensVerschieden: 17,   // gemessen: 76/200 verschieden, n ≈ 84
    deute: (f) => {
      const m = f.match(/erscheinen (\d+) % .* Es sind (\d+) Personen/);
      if (!m) return null;
      const p = +m[1] / 100, n = +m[2];
      const V = n * p * (1 - p);
      return {
        felder: [n * p, Math.sqrt(V)], toleranz: 0.005,
        falschFelder: [[0, n * (1 - p), "nicht kommen"], [1, V, "Wurzel"]],
      };
    },
  });
  await pruefeAufgabe(page, bericht, {
    nr: 9, name: "S1 mindestens k", runden: R, mindestensVerschieden: 23,   // gemessen: 146/200 verschieden, n ≈ 299
    deute: (f) => {
      const m = f.match(/Wahrscheinlichkeit (\S+)\. Er wirft (\d+)-mal; .* mindestens (\d+)-mal/);
      if (!m) return null;
      const p = zahl1(m[1]), n = +m[2], k = +m[3];
      return { richtig: 1 - Fb(n, p, k - 1), toleranz: 0.0005, falsch: [[1 - Fb(n, p, k), "Gegenereignis von"], [Fb(n, p, k - 1), "1 minus"], [Bb(n, p, k), "genau"]] };
    },
  });
  await pruefeAufgabe(page, bericht, {
    nr: 10, name: "S2 zwischen", runden: R, mindestensVerschieden: 25,   // gemessen: 181/200 verschieden, n ≈ 980
    deute: (f) => {
      const m = f.match(/nutzen (\d+) % der Haushalte .* (\d+) Haushalte werden .* mindestens (\d+) und höchstens (\d+) von/);
      if (!m) return null;
      const p = +m[1] / 100, n = +m[2], a = +m[3], b = +m[4];
      return {
        richtig: Fb(n, p, b) - Fb(n, p, a - 1), toleranz: 0.0005,
        falsch: [[Fb(n, p, b) - Fb(n, p, a), "Säule bei"], [Fb(n, p, b - 1) - Fb(n, p, a - 1), "obere Grenze"], [Fb(n, p, b - 1) - Fb(n, p, a), "Beide Grenzen"]],
      };
    },
  });
  await pruefeAufgabe(page, bericht, {
    nr: 11, name: "S3 p > 0,5", runden: R, mindestensVerschieden: 21,   // gemessen: 126/200 verschieden, n ≈ 198
    deute: (f) => {
      const m = f.match(/mit (\d+) % an\. Ein Gärtner sät (\d+) Samen\. .* höchstens (\d+) davon/);
      if (!m) return null;
      const p = +m[1] / 100, n = +m[2], k = +m[3], q = 1 - p;
      return {
        richtig: Fb(n, p, k), toleranz: 0.0005,
        falsch: [[Fb(n, q, k), "nicht umgerechnet"], [1 - Fb(n, q, n - k), "eine Stufe zu viel"], [Fb(n, q, n - k - 1), "Gegenwahrscheinlichkeit"]],
      };
    },
  });
  const S4P = { "fairen Würfel": 1 / 6, "Los gewinnt": 0.05, "Bauteil ist": 0.1, "Torwandschießen": 0.15, "Glücksrad": 0.25, "Interview": 0.3 };
  await pruefeAufgabe(page, bericht, {
    nr: 12, name: "S4 Mindestlänge n", runden: R, mindestensVerschieden: 10,   // gemessen: 24/200 verschieden, n ≈ 24
    deute: (f) => {
      const art = Object.keys(S4P).find((a) => f.includes(a));
      const m = f.match(/mindestens (\d+) %/);
      if (!art || !m) return null;
      const p = S4P[art], a = +m[1] / 100;
      let n = 1;
      while (1 - (1 - p) ** n < a - 1e-12) n++;
      // Die Probe gehört dazu: n − 1 reicht NICHT, n reicht.
      pruefe(1 - (1 - p) ** (n - 1) < a, `S4: schon ${n - 1} Versuche reichen — „${f}“`);
      return { richtig: n, toleranz: 0.4, falsch: [[n - 1, "aufgerundet"], [Math.round(1 / p), "im Mittel"]] };
    },
  });
  await pruefeAufgabe(page, bericht, {
    nr: 13, name: "K1 Erwartungswert und P(X = μ)", runden: R, mindestensVerschieden: 13,   // gemessen: 40/200 verschieden, n ≈ 40
    deute: (f) => {
      const m = f.match(/wirkt bei (\d+) % .* bei (\d+) Patienten/);
      if (!m) return null;
      const p = +m[1] / 100, n = +m[2], mu = Math.round(n * p);
      pruefe(Math.abs(n * p - mu) < 1e-9, `K1: μ = ${n * p} ist keine ganze Zahl — „${f}“`);
      return {
        felder: [mu, Bb(n, p, mu)], toleranz: 0.0005,
        falschFelder: [[0, n - mu, "nicht wirkt"], [1, p ** mu * (1 - p) ** (n - mu), "einzelner Pfad"]],
      };
    },
  });
  await pruefeAufgabe(page, bericht, {
    nr: 14, name: "K2 Parkplätze", runden: R, mindestensVerschieden: 17,   // gemessen: 71/200 verschieden, n ≈ 77
    deute: (f) => {
      const m = f.match(/hat (\d+) Mitarbeiter\. .* Wahrscheinlichkeit (\S+) mit dem Auto\. .* mindestens (\d+) % der/);
      if (!m) return null;
      const n = +m[1], p = zahl1(m[2]), a = +m[3] / 100;
      let k = 0;
      while (Fb(n, p, k) < a - 1e-12) k++;
      return { richtig: k, toleranz: 0.4, falsch: [[k - 1, "weniger"], [Math.round(n * p), "Erwartungswert"]] };
    },
  });
  await pruefeAufgabe(page, bericht, {
    nr: 15, name: "K3 p gesucht", runden: R, mindestensVerschieden: 13,   // gemessen: 36/200 verschieden, n ≈ 36
    deute: (f) => {
      const m = f.match(/schießt (\d+)-mal .* mindestens (\d+) % mindestens einmal/);
      if (!m) return null;
      const n = +m[1], a = +m[2] / 100;
      const pmin = 1 - (1 - a) ** (1 / n);
      return { richtig: pmin, toleranz: 0.0005, falsch: [[(1 - a) ** (1 / n), "Fehlwahrscheinlichkeit"], [1 - a ** (1 / n), "Unter der Wurzel"]] };
    },
  });
  await pruefeAufgabe(page, bericht, {
    nr: 16, name: "K4 drei Lieferungen", runden: R, mindestensVerschieden: 11,   // gemessen: 27/200 verschieden, n ≈ 27
    deute: (f) => {
      const m = f.match(/entnimmt (\d+) Teile .* höchstens (\d+) davon defekt .* Wahrscheinlichkeit (\S+) defekt/);
      if (!m) return null;
      const n = +m[1], c = +m[2], p = zahl1(m[3]);
      const F1 = Fb(n, p, c);
      return { richtig: F1 ** 3, toleranz: 0.0005, falsch: [[F1, "eine Lieferung"], [1 - (1 - F1) ** 3, "mindestens eine"]] };
    },
  });
}

// ════════════════ Gerüst ════════════════

async function geruest(page) {
  const folge = await page.evaluate(() => [...document.querySelectorAll("main section[id]")].map((s) => s.id));
  const soll = ["sec-zufallsgroesse", "sec-erwartungswert", "sec-bernoulli", "sec-binomialkoeffizient", "sec-formel",
    "sec-binomialverteilung", "sec-kumuliert", "sec-kenngroessen", "sec-parameter"];
  const ist = folge.filter((id) => soll.includes(id));
  pruefe(JSON.stringify(ist) === JSON.stringify(soll), `Gerüst: die Herleitungen stehen in der Reihenfolge ${ist.join(", ")}`);
  // Vernetzung, Formelsammlung, Übungen am Ende in fester Reihenfolge
  const ende = folge.slice(-3);
  pruefe(JSON.stringify(ende) === JSON.stringify(["sec-vernetzung", "sec-formelsammlung", "sec-uebungen"]), `Gerüst: das Seitenende lautet ${ende.join(", ")}`);
  // Erst Zufallsgröße und Erwartungswert, dann Bernoulli — wie verlangt am Anfang.
  pruefe(folge.indexOf("sec-zufallsgroesse") < folge.indexOf("sec-bernoulli"), "Gerüst: Zufallsgrößen stehen nicht vor den Bernoulli-Ketten");

  // Beide Schreibweisen
  const haupt = await page.evaluate(() => document.querySelector("main").innerText);
  for (const s of ["B(n; p; k)", "F(n; p; k)", "Bn;p(k)", "Fn;p(k)", "Bigalke/Köhler", "Fundamente"]) {
    pruefe(haupt.includes(s), `Gerüst: die Schreibweise „${s}“ fehlt`);
  }

  // Rahmen
  const rahmen = await page.evaluate(() => ({
    brot: document.querySelector("nav.breadcrumb").innerText.trim().endsWith("5 Bernoulli-Ketten und Binomialverteilung"),
    haftung: !!document.querySelector('footer a[href$="haftungsausschluss.html"]'),
  }));
  pruefe(rahmen.brot, "Gerüst: die Brotkrumen enden nicht beim eigenen Titel");
  pruefe(rahmen.haftung, "Gerüst: der Haftungsausschluss fehlt");

  // Verweise
  const links = await page.evaluate(() => [...document.querySelectorAll("a[href]")].map((a) => a.getAttribute("href")).filter((h) => !h.startsWith("http")));
  for (const href of new Set(links)) {
    if (href.startsWith("#")) {
      const da = await page.evaluate((id) => !!document.getElementById(id), href.slice(1));
      pruefe(da, `Gerüst: die Sprungmarke „${href}“ führt ins Leere`);
      continue;
    }
    const ziel = new URL(href, "http://localhost" + SEITE);
    const antwort = await page.request.get("http://localhost:" + (process.env.UPLANT_PORT || "8936") + ziel.pathname);
    pruefe(antwort.ok(), `Gerüst: der Verweis „${href}“ führt ins Leere (${antwort.status()})`);
    if (ziel.hash) {
      const html = await antwort.text();
      pruefe(html.includes(`id="${ziel.hash.slice(1)}"`), `Gerüst: die Sprungmarke in „${href}“ gibt es nicht`);
    }
  }

  // Menükarte: vorhanden, mit hidden und data-section
  const menue = fs.readFileSync(path.join(WURZEL, "mathematik/mss13/01-wahrscheinlichkeitsrechnung/index.html"), "utf8");
  const karte = menue.match(/<a class="menu-card"[^>]*href="05-bernoulli-ketten-binomialverteilung\/index\.html"[^>]*>/);
  pruefe(!!karte, "Gerüst: die Menükarte fehlt");
  if (karte) pruefe(/\bhidden\b/.test(karte[0]) && /data-section="mss13"/.test(karte[0]), `Gerüst: der Menükarte fehlt hidden oder data-section — ${karte[0]}`);

  // Formelsammlung als PDF: Verweis, Datei, zwei Seiten, Querformat, und alle Formeln in der Quelle
  const verweis = await page.evaluate(() => { const a = document.querySelector("#sec-formelsammlung a[download]"); return a && a.getAttribute("href"); });
  pruefe(verweis === "formelsammlung.pdf", `Formelsammlung: der Download-Verweis zeigt auf „${verweis}“`);
  const pdf = path.join(WURZEL, ORDNER, "formelsammlung.pdf");
  pruefe(fs.existsSync(pdf), "Formelsammlung: formelsammlung.pdf fehlt");
  if (fs.existsSync(pdf)) {
    const roh = fs.readFileSync(pdf).toString("latin1");
    pruefe(roh.startsWith("%PDF-") && roh.length > 20000, "Formelsammlung: die Datei ist kein vollständiges PDF");
    const seiten = (roh.match(/\/Type\s*\/Page(?!s)/g) || []).length;
    pruefe(seiten === 2, `Formelsammlung: ${seiten} Seiten statt 2`);
    const box = roh.match(/\/MediaBox\s*\[\s*0 0 ([\d.]+) ([\d.]+)/);
    pruefe(!!box && Number(box[1]) > Number(box[2]), "Formelsammlung: das PDF ist nicht im Querformat");
  }
  const quelle = fs.readFileSync(path.join(WURZEL, "tools/formelsammlung/formelsammlung-bk-quelle.html"), "utf8")
    .replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ");
  for (const f of ["P(X = k) = B(n; p; k)", "P(X ≤ k) = F(n; p; k)", "μ = E(X) = n · p", "σ = √(n · p · (1 − p))",
    "1 − F(n; p; k − 1)", "F(n; p; b) − F(n; p; a − 1)", "F(n; p; k) = 1 − F(n; 1 − p; n − k − 1)", "Bn;p(k)", "Fn;p(k)"]) {
    pruefe(quelle.includes(f), `Formelsammlung: „${f}“ fehlt in der Quelle des PDFs`);
  }
}

// ════════════════ Ablauf ════════════════

(async () => {
  const browser = await starteBrowser();
  for (const dunkel of [false, true]) {
    const wo = dunkel ? "dunkel" : "hell";
    const page = await neueSeite(browser, { dunkel });
    await oeffne(page, SEITE);
    if (!dunkel) {
      await geruest(page);
      await zufallsgroesse(page);
      await erwartungswert(page);
      await bernoulliKette(page);
      await binomialkoeffizient(page);
      await formel(page);
      await verteilung(page);
      await kumuliert(page);
      await kenngroessen(page);
      await parameter(page);
      await quizze(page);
      await selbsteinschaetzung(page);
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
