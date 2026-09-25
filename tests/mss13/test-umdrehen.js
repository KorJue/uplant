// Fachliche Prüfung: MSS 13, Wahrscheinlichkeitsrechnung, Thema 3 „Baumdiagramme umdrehen“.
//
// Geprüft wird, was die Seite zeigt, gegen eine unabhängige Rechnung:
//   * der Rechner: für viele Eingaben nennt er P_positiv(infiziert) und P_negativ(nicht infiziert)
//     richtig, und sein Kommentar passt zu den eingestellten Zahlen (kein fester Text);
//   * das Flächenmodell: Flächen aus dem SVG gemessen, genau die positiven Rechtecke umrandet,
//     und die Bilanz nennt denselben Quotienten;
//   * die Formel-Probe im Ausblick auf Bayes stimmt mit dem Rechner überein;
//   * Tims Baum: die Äste an der Wurzel ergeben nicht 1, die des richtigen Baums an jedem Knoten 1;
//   * die Aufgaben von beiden Seiten.

"use strict";

const { neuerBericht } = require("../lib/pruefen");
const { starteBrowser, neueSeite, oeffne, text } = require("../lib/seite");
const { pruefeNotation } = require("../lib/notation");
const { pruefeKontrast } = require("../lib/kontrast");
const { pruefeAufgabe, zahl } = require("../lib/aufgaben");
const fs = require("fs");
const path = require("path");

const bericht = neuerBericht();
const { pruefe } = bericht;
const SEITE = "/mathematik/mss13/01-wahrscheinlichkeitsrechnung/03-baumdiagramme-umdrehen/index.html";
const WURZEL = path.resolve(__dirname, "..", "..");
const nahe = (a, b, tol = 5e-4) => Number.isFinite(a) && Math.abs(a - b) <= tol;

async function geruest(page) {
  const folge = await page.evaluate(() => [...document.querySelectorAll("main section[id]")].map((s) => s.id));
  const soll = ["sec-bayes-rechner", "sec-tafel-umkehr", "sec-formeln", "sec-stolperstelle",
    "sec-selbsteinschaetzung", "sec-vernetzung", "sec-formelsammlung", "sec-uebungen"];
  pruefe(JSON.stringify(folge) === JSON.stringify(soll), `Gerüst: Abschnitte ${folge.join(", ")} statt ${soll.join(", ")}`);
  pruefe(fs.existsSync(path.join(WURZEL, path.dirname(SEITE), "formelsammlung.pdf")), "Formelsammlung: formelsammlung.pdf fehlt");
  const notation = await page.evaluate(() => (document.querySelector(".notation-box") || {}).innerText || "");
  pruefe(/Bigalke\/Köhler/.test(notation) && /P\(infiziert \| positiv\)/.test(notation), "Gerüst: der Kasten mit den Schreibweisen fehlt");
  const links = await page.evaluate(() =>
    [...document.querySelectorAll("main a[href]")].map((a) => a.getAttribute("href")).filter((h) => !h.startsWith("#") && !h.startsWith("http")));
  for (const href of new Set(links)) {
    const ziel = new URL(href.split("#")[0], "http://localhost" + SEITE).pathname;
    const antwort = await page.request.get("http://localhost:" + (process.env.UPLANT_PORT || "8936") + ziel);
    pruefe(antwort.ok(), `Gerüst: der Verweis „${href}“ führt ins Leere (${antwort.status()})`);
  }
}

async function setzeEingaben(page, p, s, sp) {
  await page.evaluate(([p, s, sp]) => {
    for (const [id, v] of [["input-praevalenz", p], ["input-sensitivitaet", s], ["input-spezifitaet", sp]]) {
      const e = document.getElementById(id);
      e.value = String(v);
      e.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }, [p, s, sp]);
}

const FAELLE = [[10, 96, 99], [1, 96, 99], [0.5, 99, 98], [30, 80, 90], [50, 90, 70], [2, 100, 95], [80, 95, 60]];

async function rechner(page) {
  for (const [p, s, sp] of FAELLE) {
    await setzeEingaben(page, p, s, sp);
    const wo = `Rechner (${p} %/${s} %/${sp} %)`;
    const pI = p / 100, sens = s / 100, spez = sp / 100;
    const tp = pI * sens, fp = (1 - pI) * (1 - spez), tn = (1 - pI) * spez, fn = pI * (1 - sens);
    const ppv = tp / (tp + fp), npv = tn / (tn + fn);
    const t = await text(page, "#bayes-result");
    const pos = t.match(/Ppositiv\(infiziert\) = [\d,]+ \/ [\d,]+ = ([\d,]+) %/);
    const neg = t.match(/Pnegativ\(nicht infiziert\) = [\d,]+ \/ [\d,]+ = ([\d,]+) %/);
    pruefe(!!pos && nahe(zahl(pos[1]) / 100, ppv, 6e-4), `${wo}: P_positiv(infiziert) = ${pos && pos[1]} % statt ${(ppv * 100).toFixed(2)} %`);
    pruefe(!!neg && nahe(zahl(neg[1]) / 100, npv, 6e-4), `${wo}: P_negativ(nicht infiziert) = ${neg && neg[1]} % statt ${(npv * 100).toFixed(2)} %`);
    // Der Kommentar darf nichts behaupten, was bei diesen Zahlen nicht stimmt.
    const kleiner = /nur zu [\d,]+ % wirklich infiziert/.test(t);
    pruefe(kleiner === ppv < sens, `${wo}: der Kommentar behauptet „${kleiner ? "kleiner" : "nicht kleiner"} als die Sensitivität“ — „${t}“`);
  }
  await setzeEingaben(page, 10, 96, 99);
}

async function flaechenmodell(page) {
  for (const [p, s, sp] of FAELLE) {
    await setzeEingaben(page, p, s, sp);
    const wo = `Flächenmodell (${p} %/${s} %/${sp} %)`;
    const d = await page.evaluate(() => {
      const svg = document.querySelector("#bm-mount svg");
      const q = svg.querySelector('[data-rolle="quadrat"]');
      const F = +q.getAttribute("width") * +q.getAttribute("height");
      return {
        teile: Object.fromEntries([...svg.querySelectorAll("rect[data-teil]")].map((r) => [r.dataset.teil, (+r.getAttribute("width") * +r.getAttribute("height")) / F])),
        positiv: [...svg.querySelectorAll("[data-positiv]")].map((r) => r.dataset.positiv).sort(),
        lupe: Object.fromEntries([...svg.querySelectorAll("[data-lupe]")].map((r) => [r.dataset.lupe, +r.getAttribute("width")])),
      };
    });
    const pI = p / 100, sens = s / 100, spez = sp / 100;
    const soll = { tp: pI * sens, fn: pI * (1 - sens), fp: (1 - pI) * (1 - spez), tn: (1 - pI) * spez };
    for (const [k, v] of Object.entries(soll)) pruefe(Math.abs((d.teile[k] || 0) - v) < 2e-3, `${wo}: Fläche ${k} = ${(d.teile[k] || 0).toFixed(4)} statt ${v.toFixed(4)}`);
    const erwartet = ["fp", "tp"].filter((k) => soll[k] > 1e-9);
    pruefe(JSON.stringify(d.positiv) === JSON.stringify(erwartet), `${wo}: umrandet sind ${d.positiv.join(", ")} statt ${erwartet.join(", ")}`);
    // Die Lupe teilt ihre Breite im Verhältnis der beiden positiven Flächen.
    const lupe = (d.lupe.tp || 0) / ((d.lupe.tp || 0) + (d.lupe.fp || 0));
    pruefe(nahe(lupe, soll.tp / (soll.tp + soll.fp), 2e-3), `${wo}: die Lupe zeigt ${lupe.toFixed(4)} richtig positiv statt ${(soll.tp / (soll.tp + soll.fp)).toFixed(4)}`);
    const bilanz = await text(page, "#bm-bilanz");
    const m = bilanz.match(/= ([\d,]+) — der Anteil/);
    pruefe(!!m && nahe(zahl(m[1]), soll.tp / (soll.tp + soll.fp), 6e-5), `${wo}: die Bilanz nennt ${m && m[1]} — „${bilanz}“`);
    const erklaerung = await text(page, "#bm-text");
    pruefe(/falscher Alarm/.test(erklaerung) === soll.fp > soll.tp, `${wo}: die Erklärung passt nicht zu den Flächen — „${erklaerung}“`);
  }
  await setzeEingaben(page, 10, 96, 99);
}

async function formeln(page) {
  // Die Probe im Ausblick nennt den Wert der Standardeinstellung.
  const t = await text(page, "#sec-formeln .wissen-box");
  const m = t.match(/= ([\d,]+) \/ ([\d,]+) ≈ ([\d,]+)/);
  pruefe(!!m && nahe(zahl(m[1]), 0.096, 1e-9) && nahe(zahl(m[2]), 0.105, 1e-9) && nahe(zahl(m[3]), 0.096 / 0.105, 6e-4),
    `Formeln: die Probe mit den Standardwerten stimmt nicht — „${t}“`);
}

async function stolperstelle(page) {
  const werte = async (id) => page.evaluate((i) =>
    [...document.querySelectorAll(`#${i} .tree-edge-label`)].map((t) => parseFloat(t.textContent.match(/\(([\d,]+)\)/)[1].replace(",", "."))), id);
  const falsch = await werte("tree-tim-wrong-mount"), richtig = await werte("tree-tim-correct-mount");
  pruefe(Math.abs(falsch[0] + falsch[1] - 1) > 0.05, `Stolperstelle: Tims Wurzel ergibt ${falsch[0] + falsch[1]} — der Fehler wäre nicht sichtbar`);
  const knoten = [richtig[0] + richtig[1], richtig[2] + richtig[3], richtig[4] + richtig[5]];
  pruefe(knoten.every((s) => Math.abs(s - 1) < 2e-3), `Stolperstelle: der richtige Baum ergibt an den Knoten ${knoten.join(" / ")}`);
  // Unabhängig: P(defekt) = 0,3 · 0,05 + 0,7 · 0,02 = 0,029; P_defekt(A) = 0,015 : 0,029.
  pruefe(nahe(richtig[0], 0.029, 6e-4) && nahe(richtig[2], 0.015 / 0.029, 6e-4), `Stolperstelle: der richtige Baum nennt ${richtig.join(" / ")}`);
}

async function quizze(page) {
  const ids = await page.evaluate(() => [...document.querySelectorAll(".quiz")].map((q) => q.id));
  pruefe(ids.length === 4, `Kontrollfragen: ${ids.length} statt 4`);
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
  pruefe(/href="#sec-stolperstelle"/.test(aus), `Selbsteinschätzung: kein Verweis zurück zur Stolperstelle — „${aus}“`);
  await page.evaluate(() => localStorage.clear());
}

const T = 0.0006;
// Gemessen mit UPLANT_ZUEGE=25 tests/werkzeug-streuung.js (200 Würfe je Aufgabe, 10⁻⁴-Quantil für 0,8 · n).
const SCHRANKE = {1: 22, 2: 15, 3: 21, 4: 15, 5: 15, 6: 15, 7: 16, 8: 16, 9: 12, 10: 13, 11: 14, 12: 18, 13: 13, 14: 12, 15: 10, 16: 13};
const INDEX = { "₁": 0, "₂": 1, "₃": 2 };

async function aufgaben(page) {
  const r = 25;
  const A = (nr, name, deute) => pruefeAufgabe(page, bericht, { nr, name, runden: r, mindestensVerschieden: SCHRANKE[nr] ?? 5, deute });
  const ppvVon = (p, s, sp) => (p * s) / (p * s + (1 - p) * (1 - sp));
  await A(1, "A1 neue erste Stufe", (f) => {
    const m = f.match(/P\(A\) = ([\d,]+), PA\(B\) = ([\d,]+), PĀ\(B\) = ([\d,]+)/);
    if (!m) return null;
    const [a, x, y] = m.slice(1).map(zahl);
    return { richtig: a * x + (1 - a) * y, toleranz: T, falsch: [[x + y, "verschiedenen Gruppen"], [a * x, "nur die Zelle"], [(x + y) / 2, "Mittelwert"]] };
  });
  await A(2, "A2 Zuverlässigkeit", (f) => {
    const m = f.match(/Von ([\d.]+) getesteten Personen erhielten (\d+) ein positives Ergebnis\. Davon waren (\d+) tatsächlich/);
    if (!m) return null;
    const N = Number(m[1].replace(/\./g, "")), pos = Number(m[2]), tp = Number(m[3]);
    return { richtig: tp / pos, toleranz: T, falsch: [[tp / N, "allen Getesteten"], [(pos - tp) / pos, "Falsch-Positiven"], [pos / N, "überhaupt"]] };
  });
  await A(3, "A3 Zelle absolut", (f) => {
    const m = f.match(/([\d,]+) % einer Gruppe von ([\d.]+) Personen .* erkennt ([\d,]+) % der/);
    if (!m) return null;
    const a = zahl(m[1]) / 100, N = Number(m[2].replace(/\./g, "")), x = zahl(m[3]) / 100;
    return { richtig: N * a * x, toleranz: 0.5, falsch: [[N * a, "Das sind alle"], [N * x, "bezieht sich auf"], [N * a * (1 - x), "übersieht"]] };
  });
  await A(4, "A4 Ast aus der Tafel", (f) => {
    const m = f.match(/P\(A ∩ B\) = ([\d,]+) und P\(Ā ∩ B\) = ([\d,]+)/);
    if (!m) return null;
    const [ab, aqb] = m.slice(1).map(zahl);
    return { richtig: ab / (ab + aqb), toleranz: T, falsch: [[ab, "Spaltensumme teilen"], [aqb / (ab + aqb), "von B nach Ā"], [ab + aqb, "ersten Stufe"]] };
  });
  await A(5, "A5 der ganze Weg", (f) => {
    const m = f.match(/P\(A\) = ([\d,]+), PA\(B\) = ([\d,]+) und PĀ\(B\) = ([\d,]+)\. Berechne/);
    if (!m) return null;
    const [a, x, y] = m.slice(1).map(zahl);
    const b = a * x + (1 - a) * y;
    return { richtig: (a * x) / b, toleranz: T, falsch: [[x, "Tims Fehler"], [a * x, "Noch durch die Spaltensumme"], [a, "ohne Information"], [(a * x) / (x + y), "Pfade, nicht Äste"]] };
  });
  await A(6, "A6 positive Tests", (f) => {
    const m = f.match(/([\d.]+) Personen werden getestet; (\d+) % davon sind infiziert\. Der Test erkennt (\d+) % der Infizierten \(Sensitivität\) und (\d+) %/);
    if (!m) return null;
    const N = Number(m[1].replace(/\./g, "")), [p, s, sp] = m.slice(2).map((z) => Number(z) / 100);
    const tp = N * p * s, fp = N * (1 - p) * (1 - sp);
    return { richtig: tp + fp, toleranz: 0.5, falsch: [[tp, "nur die richtig Positiven"], [fp, "nur die Falsch-Positiven"], [N * s, "gilt nur für die Infizierten"]] };
  });
  await A(7, "A7 positiver Vorhersagewert", (f) => {
    const m = f.match(/bei (\d+) % der Bevölkerung auf\. Ein Test erkennt (\d+) % der Kranken und (\d+) %/);
    if (!m) return null;
    const [p, s, sp] = m.slice(1).map((z) => Number(z) / 100);
    return { richtig: ppvVon(p, s, sp), toleranz: T, falsch: [[s, "Sensitivität"], [p * s, "Zelle"], [sp, "Spezifität betrifft"]] };
  });
  await A(8, "A8 beide Äste am Knoten B", (f) => {
    const m = f.match(/P\(A\) = ([\d,]+), PA\(B\) = ([\d,]+) und PĀ\(B\) = ([\d,]+)\. Bestimme/);
    if (!m) return null;
    const [a, x, y] = m.slice(1).map(zahl);
    const ab = a * x, aqb = (1 - a) * y, b = ab + aqb;
    return { felder: [ab / b, aqb / b], toleranz: T, falschFelder: [[0, x, "nicht umgedreht"], [0, ab, "noch durch P(B)"], [1, 1 - x, "alten Baum"], [1, aqb, "Zelle P(Ā ∩ B)"]] };
  });
  await A(9, "A9 negativer Vorhersagewert", (f) => {
    const m = f.match(/(\d+) % der Getesteten sind infiziert\. Der Test erkennt (\d+) % der Infizierten und (\d+) %/);
    if (!m) return null;
    const [p, s, sp] = m.slice(1).map((z) => Number(z) / 100);
    const tn = (1 - p) * sp, fn = p * (1 - s);
    return { richtig: tn / (tn + fn), toleranz: T, falsch: [[sp, "Spezifität"], [tn, "Zelle"], [fn / (tn + fn), "trotz negativem"]] };
  });
  await A(10, "A10 aus welcher Fabrik", (f) => {
    const m = f.match(/lässt ([\d,]+) % seiner Geräte in Fabrik A .* In A sind ([\d,]+) % der Geräte defekt, in B ([\d,]+) %/);
    if (!m) return null;
    const [a, x, y] = m.slice(1).map((z) => zahl(z) / 100);
    const ab = a * x;
    return { richtig: ab / (ab + (1 - a) * y), toleranz: T, falsch: [[a, "allen"], [x, "Richtung vertauscht"], [ab, "Zelle"]] };
  });
  await A(11, "A11 Tims Fehler in Zahlen", (f) => {
    const m = f.match(/Fabrik A fertigt ([\d,]+) % .* defekt sind ([\d,]+) % aus A und ([\d,]+) % aus B/);
    if (!m) return null;
    const [a, x, y] = m.slice(1).map((z) => zahl(z) / 100);
    const bA = (a * x) / (a * x + (1 - a) * y);
    return { richtig: bA - x, toleranz: T, falsch: [[bA, "richtige Wert selbst"], [x - bA, "Vorzeichen"]] };
  });
  await A(12, "A12 rückwärts", (f) => {
    const m = f.match(/P\(B\) = ([\d,]+), PB\(A\) = ([\d,]+)\. Außerdem ist P\(A\) = ([\d,]+)/);
    if (!m) return null;
    const [b, z, a] = m.slice(1).map(zahl);
    return { richtig: (b * z) / a, toleranz: T, falsch: [[z, "Umgedreht ändert"], [b * z, "Zelle"]] };
  });
  await A(13, "A13 Prävalenz ändert alles", (f) => {
    const m = f.match(/erkennt (\d+) % der Infizierten und (\d+) % der Nicht-Infizierten richtig\. .*Bevölkerung \((\d+) % infiziert\) und in einer Klinik \((\d+) % infiziert\)/);
    if (!m) return null;
    const [s, sp, p1, p2] = m.slice(1).map((z) => Number(z) / 100);
    const d = ppvVon(p2, s, sp) - ppvVon(p1, s, sp);
    return { richtig: d, toleranz: T, falsch: [[-d, "Vorzeichen"], [p2 - p1, "Prävalenzen"]] };
  });
  await A(14, "A14 zwei Tests", (f) => {
    const m = f.match(/(\d+) % einer Gruppe sind infiziert\. Ein Test erkennt (\d+) % der Infizierten und (\d+) %/);
    if (!m) return null;
    const [p, s, sp] = m.slice(1).map((z) => Number(z) / 100);
    // Unabhängig über die Pfade „infiziert → pos → pos“ und „nicht infiziert → pos → pos“ gerechnet.
    const soll = (p * s * s) / (p * s * s + (1 - p) * (1 - sp) * (1 - sp));
    return { richtig: soll, toleranz: T, falsch: [[ppvVon(p, s, sp), "ersten"], [s * s, "Richtung ist vertauscht"]] };
  });
  await A(15, "A15 nötige Falschpositiv-Rate", (f) => {
    const m = f.match(/Prävalenz von (\d+) %\. Ein Test erkennt (\d+) % der Kranken\. Ein positives Ergebnis soll zu (\d+) % zutreffen/);
    if (!m) return null;
    const [p, s, q] = m.slice(1).map((z) => Number(z) / 100);
    const fr = (p * s * (1 - q)) / (q * (1 - p));
    // Probe: mit dieser Rate trifft ein positives Ergebnis genau zu q zu.
    if (!nahe(ppvVon(p, s, 1 - fr), q, 1e-9)) return null;
    return { richtig: fr, toleranz: T, falsch: [[1 - fr, "Spezifität"]] };
  });
  await A(16, "A16 drei Fabriken", (f) => {
    const m = f.match(/liefern F₁: ([\d,]+) %, F₂: ([\d,]+) %, F₃: ([\d,]+) % der Teile\. Der Ausschuss beträgt F₁: ([\d,]+) %, F₂: ([\d,]+) %, F₃: ([\d,]+) %.*aus F([₁₂₃])\?/);
    if (!m) return null;
    const w = m.slice(1, 7).map((z) => zahl(z) / 100);
    const a = w.slice(0, 3), d = w.slice(3), i = INDEX[m[7]];
    const zell = a.map((x, j) => x * d[j]);
    const pd = zell[0] + zell[1] + zell[2];
    return { richtig: zell[i] / pd, toleranz: T, falsch: [[a[i], "allen Teilen"], [d[i], "Richtung vertauscht"], [zell[i], "Pfad"]] };
  });
  const n = await page.locator("#ausfuell-mount > *").count();
  pruefe(n >= 1, `Ausfüllaufgaben: nur ${n} gefunden`);
}

(async () => {
  const browser = await starteBrowser();
  for (const dunkel of [false, true]) {
    const wo = dunkel ? "dunkel" : "hell";
    const page = await neueSeite(browser, { dunkel });
    await oeffne(page, SEITE);
    if (!dunkel) {
      await geruest(page);
      await rechner(page);
      await flaechenmodell(page);
      await formeln(page);
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
