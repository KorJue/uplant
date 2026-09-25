// Fachliche Prüfung: MSS 13, Wahrscheinlichkeitsrechnung, Thema 4 „Stochastische Unabhängigkeit“.
//
// Geprüft wird, was die Seite zeigt, gegen eine unabhängige Rechnung:
//   * die Urne: mit Zurücklegen sind die Äste nach R gleich, ohne verschieden — und das Urteil passt;
//   * die beiden Tafeln: für jede Zelle nennt die Erklärung die Namen der angeklickten Zeile und
//     Spalte, die richtigen Wahrscheinlichkeiten und das richtige Urteil;
//   * das Flächenmodell: Flächen aus dem SVG gemessen, die Schnitte liegen genau dann gleich hoch,
//     wenn P_A(B) = P_Ā(B), und die Bilanz nennt d = P(A ∩ B) − P(A) · P(B);
//   * Eriks Stolperstelle: die genannten Grenzen 8 % und 47 % stimmen;
//   * die Aufgaben von beiden Seiten.

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
const SEITE = "/mathematik/mss13/01-wahrscheinlichkeitsrechnung/04-stochastische-unabhaengigkeit/index.html";
const WURZEL = path.resolve(__dirname, "..", "..");
const nahe = (a, b, tol = 5e-4) => Number.isFinite(a) && Math.abs(a - b) <= tol;

async function geruest(page) {
  const folge = await page.evaluate(() => [...document.querySelectorAll("main section[id]")].map((s) => s.id));
  const soll = ["sec-urne-unabhaengig", "sec-multiplikationsregel", "sec-korrelation-kausalitaet", "sec-stolperstelle",
    "sec-selbsteinschaetzung", "sec-vernetzung", "sec-formelsammlung", "sec-uebungen"];
  pruefe(JSON.stringify(folge) === JSON.stringify(soll), `Gerüst: Abschnitte ${folge.join(", ")} statt ${soll.join(", ")}`);
  pruefe(fs.existsSync(path.join(WURZEL, path.dirname(SEITE), "formelsammlung.pdf")), "Formelsammlung: formelsammlung.pdf fehlt");
  const notation = await page.evaluate(() => (document.querySelector(".notation-box") || {}).innerText || "");
  pruefe(/Bigalke\/Köhler/.test(notation) && /P\(B \| A\) = P\(B\)/.test(notation), "Gerüst: der Kasten mit den Schreibweisen fehlt");
  const links = await page.evaluate(() =>
    [...document.querySelectorAll("main a[href]")].map((a) => a.getAttribute("href")).filter((h) => !h.startsWith("#") && !h.startsWith("http")));
  for (const href of new Set(links)) {
    const ziel = new URL(href.split("#")[0], "http://localhost" + SEITE).pathname;
    const antwort = await page.request.get("http://localhost:" + (process.env.UPLANT_PORT || "8936") + ziel);
    pruefe(antwort.ok(), `Gerüst: der Verweis „${href}“ führt ins Leere (${antwort.status()})`);
  }
}

async function urne(page) {
  for (const modus of ["mit Zurücklegen", "ohne Zurücklegen"]) {
    await page.locator("#urn-mode-toggle button", { hasText: modus }).click();
    const t = await text(page, "#urn-vergleich");
    const m = t.match(/Pgrün\(R\) = ([\d,]+) Prot\(R\) = ([\d,]+) P\(R\) = ([\d,]+)/);
    // 3 grüne, 4 rote Kugeln; R: rot beim zweiten Zug.
    const soll = modus.startsWith("mit") ? [4 / 7, 4 / 7] : [4 / 6, 3 / 6];
    pruefe(!!m && nahe(zahl(m[1]), soll[0], 6e-4) && nahe(zahl(m[2]), soll[1], 6e-4) && nahe(zahl(m[3]), 4 / 7, 6e-4),
      `Urne ${modus}: „${t}“ statt ${soll.map((x) => x.toFixed(3)).join(" / ")}, P(R) = 0,571`);
    pruefe(/unabhängig/.test(t) === modus.startsWith("mit") && /abhängig/.test(t), `Urne ${modus}: falsches Urteil — „${t}“`);
  }
}

async function tafel(page, mount, erklaerung, zeilen, spalten, werte) {
  const N = werte.flat().reduce((s, x) => s + x, 0);
  const zellen = await page.locator(`#${mount} .vft-cell`).all();
  pruefe(zellen.length === 4, `Tafel ${mount}: ${zellen.length} Zellen`);
  for (let i = 0; i < zellen.length; i++) {
    await zellen[i].click();
    const t = await text(page, `#${erklaerung}`);
    const r = Math.floor(i / 2), c = i % 2;
    const pA = (werte[r][0] + werte[r][1]) / N, pB = (werte[0][c] + werte[1][c]) / N, pAB = werte[r][c] / N;
    const wo = `Tafel ${mount}, Zelle ${zeilen[r]} / ${spalten[c]}`;
    pruefe(t.includes(`P(${zeilen[r]}) =`) && t.includes(`P(${spalten[c]}) =`), `${wo}: die Erklärung nennt andere Ereignisse — „${t}“`);
    const z = [...t.matchAll(/= ([\d,]+)(?= |$)/g)].map((x) => zahl(x[1]));
    const inhalt = t.match(/≈ ([\d,]+) P\(.*∩.*\) = \d+\/\d+ ≈ ([\d,]+)/);
    pruefe(!!inhalt && nahe(zahl(inhalt[1]), pA * pB, 6e-4) && nahe(zahl(inhalt[2]), pAB, 6e-4),
      `${wo}: P(A) · P(B) bzw. P(A ∩ B) falsch — „${t}“ (soll ${(pA * pB).toFixed(3)} / ${pAB.toFixed(3)}; gelesen ${z.join(", ")})`);
    pruefe(/abhängig \(korreliert\)/.test(t) === Math.abs(pAB - pA * pB) >= 0.005, `${wo}: falsches Urteil — „${t}“`);
  }
}

async function flaechenmodell(page) {
  for (const [a, x, y] of [[40, 60, 30], [40, 60, 60], [10, 95, 5], [90, 5, 95], [50, 35, 35], [30, 20, 70], [70, 80, 80]]) {
    await setzeRegler(page, "um-a", a);
    await setzeRegler(page, "um-x", x);
    await setzeRegler(page, "um-y", y);
    const wo = `Flächenmodell (P(A) = ${a} %, P_A(B) = ${x} %, P_Ā(B) = ${y} %)`;
    const d = await page.evaluate(() => {
      const svg = document.querySelector("#um-mount svg");
      const q = svg.querySelector('[data-rolle="quadrat"]');
      const F = +q.getAttribute("width") * +q.getAttribute("height");
      const schnitt = Object.fromEntries([...svg.querySelectorAll("[data-schnitt]")].map((l) => [l.dataset.schnitt, +l.getAttribute("y1")]));
      return {
        teile: Object.fromEntries([...svg.querySelectorAll("rect[data-teil]")].map((r) => [r.dataset.teil, (+r.getAttribute("width") * +r.getAttribute("height")) / F])),
        schnitt,
      };
    });
    const pA = a / 100, px = x / 100, py = y / 100;
    const soll = { AB: pA * px, ABq: pA * (1 - px), AqB: (1 - pA) * py, AqBq: (1 - pA) * (1 - py) };
    for (const [k, v] of Object.entries(soll)) pruefe(Math.abs((d.teile[k] || 0) - v) < 2e-3, `${wo}: Fläche ${k} = ${(d.teile[k] || 0).toFixed(4)} statt ${v.toFixed(4)}`);
    const gleichHoch = Math.abs(d.schnitt.A - d.schnitt.Aq) < 0.05;
    pruefe(gleichHoch === (x === y), `${wo}: die Schnitte liegen ${gleichHoch ? "gleich" : "verschieden"} hoch`);
    const pB = soll.AB + soll.AqB, dd = soll.AB - pA * pB;
    const bilanz = await text(page, "#um-bilanz");
    const m = bilanz.match(/d = P\(A ∩ B\) − P\(A\) · P\(B\) = (−?[\d,]+)/);
    pruefe(!!m && nahe(zahl(m[1]), dd, 6e-5), `${wo}: die Bilanz nennt d = ${m && m[1]} statt ${dd.toFixed(4)} — „${bilanz}“`);
    const erkl = await text(page, "#um-text");
    pruefe(/sind unabhängig/.test(erkl) === (x === y), `${wo}: die Erklärung passt nicht — „${erkl}“`);
  }
}

async function stolperstelle(page) {
  const t = await text(page, "#sec-stolperstelle");
  // Männer 47 %, kurze Haare 61 %: mindestens 47 + 61 − 100 = 8 %, höchstens min(47, 61) = 47 %,
  // bei Unabhängigkeit 0,47 · 0,61 = 0,2867.
  pruefe(/zwischen 8 % und 47 %/.test(t), `Stolperstelle: die Grenzen für Männer mit kurzen Haaren fehlen oder sind falsch`);
  pruefe(/0,47 · 0,61 ≈ 0,29/.test(t) && nahe(0.47 * 0.61, 0.29, 0.005), "Stolperstelle: Eriks Rechnung ist falsch wiedergegeben");
  const aus = await text(page, "#sec-stolperstelle .wissen-box");
  pruefe(/1\/4 ≠ 1\/8/.test(aus), `Stolperstelle: der Ausblick auf paarweise Unabhängigkeit fehlt — „${aus}“`);
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
  await page.locator("#se-liste .se-zeile").nth(1).locator("button").nth(2).click();
  const aus = await page.evaluate(() => document.getElementById("se-auswertung").innerHTML);
  pruefe(/href="#sec-multiplikationsregel"/.test(aus), `Selbsteinschätzung: kein Verweis zurück zur Multiplikationsregel — „${aus}“`);
  await page.evaluate(() => localStorage.clear());
}

const T = 0.0006, T5 = 0.00006;
// Gemessen mit UPLANT_ZUEGE=25 tests/werkzeug-streuung.js (200 Würfe je Aufgabe, 10⁻⁴-Quantil für 0,8 · n).
const SCHRANKE = {1: 19, 2: 19, 3: 19, 4: 19, 5: 21, 6: 19, 7: 19, 8: 16, 9: 17, 10: 22, 11: 16, 12: 13, 13: 13, 14: 13, 15: 18, 16: 20};

async function aufgaben(page) {
  const r = 25;
  const A = (nr, name, deute) => pruefeAufgabe(page, bericht, { nr, name, runden: r, mindestensVerschieden: SCHRANKE[nr] ?? 5, deute });
  const jaNein = (unabh) => ({ richtig: unabh ? "ja" : "nein", falsch: [[unabh ? "nein" : "ja", "Vergleiche"], ["vielleicht", "„ja“ oder „nein“"]] });
  await A(1, "A1 Multiplikationsregel", (f) => {
    const m = f.match(/P\(A\) = ([\d,]+) und P\(B\) = ([\d,]+)\. Berechne P\(A ∩ B\)/);
    if (!m) return null;
    const [a, b] = m.slice(1).map(zahl);
    return { richtig: a * b, toleranz: T, falsch: [[a + b, "nicht addiert"], [a + b - a * b, "A oder B"], [(1 - a) * (1 - b), "keines"]] };
  });
  await A(2, "A2 ja oder nein", (f) => {
    const m = f.match(/P\(A\) = ([\d,]+), P\(B\) = ([\d,]+) und P\(A ∩ B\) = ([\d,]+)/);
    if (!m) return null;
    const [a, b, ab] = m.slice(1).map(zahl);
    return jaNein(Math.abs(a * b - ab) < 1e-9);
  });
  await A(3, "A3 P_A(B)", (f) => {
    const m = f.match(/P\(A\) = ([\d,]+), P\(B\) = ([\d,]+)\. Wie groß ist PA\(B\)/);
    if (!m) return null;
    const [a, b] = m.slice(1).map(zahl);
    return { richtig: b, toleranz: T, falsch: [[a * b, "ändert bei Unabhängigkeit nichts"], [a, "Das ist P(A)"], [b / a, "= P(B)"]] };
  });
  await A(4, "A4 Gegenereignis", (f) => {
    const m = f.match(/P\(A\) = ([\d,]+) und P\(B\) = ([\d,]+)\. Berechne P\(Ā ∩ B\)/);
    if (!m) return null;
    const [a, b] = m.slice(1).map(zahl);
    return { richtig: (1 - a) * b, toleranz: T, falsch: [[a * b, "nicht A"], [(1 - a) * (1 - b), "nicht B̄"]] };
  });
  await A(5, "A5 Umfrage", (f) => {
    const m = f.match(/\(A ∩ B: (\d+), A: (\d+), B: (\d+), alle: (\d+)\)/);
    if (!m) return null;
    const [ab, a, b, N] = m.slice(1).map(Number);
    // Ganzzahlig verglichen: |A ∩ B| · N = |A| · |B|.
    return jaNein(ab * N === a * b);
  });
  await A(6, "A6 Zelle für Unabhängigkeit", (f) => {
    const m = f.match(/Von (\d+) Personen gehören (\d+) zur Gruppe A und (\d+) zur Gruppe B/);
    if (!m) return null;
    const [N, a, b] = m.slice(1).map(Number);
    const ab = (a * b) / N;
    return { richtig: ab, toleranz: 0.5, falsch: [[a * b, "gilt für Wahrscheinlichkeiten"], [b - ab, "aber nicht in A"]] };
  });
  await A(7, "A7 mindestens einer", (f) => {
    const m = f.match(/Wahrscheinlichkeit ([\d,]+) an, der zweite mit ([\d,]+)\./);
    if (!m) return null;
    const [a, b] = m.slice(1).map(zahl);
    return { richtig: 1 - (1 - a) * (1 - b), toleranz: T, falsch: [[a + b, "doppelt gezählt"], [a * b, "beide schlagen an"], [1 - a * b, "nicht „nicht beide“"]] };
  });
  await A(8, "A8 mit und ohne Zurücklegen", (f) => {
    const m = f.match(/liegen (\d+) grüne und (\d+) rote Kugeln/);
    if (!m) return null;
    const g = Number(m[1]), n = g + Number(m[2]);
    return {
      felder: [g / n, (g - 1) / (n - 1)], toleranz: T,
      falschFelder: [[0, (g - 1) / (n - 1), "wieder vollständig"], [1, g / n, "fehlt eine grüne Kugel"], [1, (g / n) * ((g - 1) / (n - 1)), "Pfad P(G ∩ H)"]],
    };
  });
  await A(9, "A9 P(B) zurück", (f) => {
    const m = f.match(/P\(A\) = ([\d,]+) und P\(A ∩ B\) = ([\d,]+)\. Berechne P\(B\)/);
    if (!m) return null;
    const [a, ab] = m.slice(1).map(zahl);
    return { richtig: ab / a, toleranz: T, falsch: [[ab * a, "nicht multipliziert"], [a - ab, "P(A ∩ B̄)"], [ab, "selbst"]] };
  });
  await A(10, "A10 Eriks Frage", (f) => {
    const m = f.match(/waren ([\d,]+) % der Befragten weiblich, ([\d,]+) % hatten lange Haare, und ([\d,]+) % waren weiblich/);
    if (!m) return null;
    const [w, l, wl] = m.slice(1).map((z) => zahl(z) / 100);
    return { richtig: 1 - w - l + wl, toleranz: T, falsch: [[(1 - w) * (1 - l), "Eriks Fehler"], [1 - w - l, "doppelt abgezogen"], [1 - wl, "nicht weiblich-langhaarig"]] };
  });
  await A(11, "A11 Schal und Erkältung", (f) => {
    const m = f.match(/100 Personen: (\d+) tragen einen Schal \(S\), (\d+) sind erkältet \(E\), (\d+) tragen/);
    if (!m) return null;
    const [s, e, se] = m.slice(1).map(Number);
    return jaNein(se * 100 === s * e);
  });
  await A(12, "A12 drei Ereignisse", (f) => {
    const m = f.match(/Wahrscheinlichkeiten ([\d,]+), ([\d,]+) und ([\d,]+)\./);
    if (!m) return null;
    const [a, b, c] = m.slice(1).map(zahl);
    return { richtig: (1 - a) * (1 - b) * (1 - c), toleranz: T5, falsch: [[a * b * c, "alle drei bestanden"], [1 - a * b * c, "nicht alle drei"], [3 - a - b - c, "multipliziert"]] };
  });
  await A(13, "A13 Reihenschaltung", (f) => {
    const m = f.match(/Wahrscheinlichkeiten ([\d,]+), ([\d,]+) und ([\d,]+)\. Sie läuft/);
    if (!m) return null;
    const [a, b, c] = m.slice(1).map(zahl);
    return { richtig: a * b * c, toleranz: T5, falsch: [[1 - (1 - a) * (1 - b) * (1 - c), "Parallelschaltung"], [Math.min(a, b, c), "schwächste"], [(a + b + c) / 3, "Mittelwert"]] };
  });
  await A(14, "A14 Parallelschaltung", (f) => {
    const m = f.match(/Wahrscheinlichkeit ([\d,]+), ([\d,]+) bzw\. ([\d,]+)\./);
    if (!m) return null;
    const [a, b, c] = m.slice(1).map(zahl);
    const aus = (1 - a) * (1 - b) * (1 - c);
    return { richtig: 1 - aus, toleranz: T5, falsch: [[a * b * c, "Reihenschaltung"], [Math.max(a, b, c), "beste Pumpe"], [aus, "alle ausfallen"]] };
  });
  await A(15, "A15 unabhängige Tafel", (f) => {
    const m = f.match(/Von (\d+) Personen gehören (\d+) zu A und (\d+) zu B/);
    if (!m) return null;
    const [N, a, b] = m.slice(1).map(Number);
    const ab = (a * b) / N, qq = ((N - a) * (N - b)) / N;
    return { felder: [ab, qq], toleranz: 0.5, falschFelder: [[0, a * b, "durch N teilen"], [1, N - a - b, "doppelt abgezogen"]] };
  });
  await A(16, "A16 wie stark abhängig", (f) => {
    const m = f.match(/P\(A\) = ([\d,]+), PA\(B\) = ([\d,]+) und PĀ\(B\) = ([\d,]+)/);
    if (!m) return null;
    const [a, x, y] = m.slice(1).map(zahl);
    // Unabhängig über die Formel d = P(A) · P(Ā) · (P_A(B) − P_Ā(B)) gerechnet.
    const d = a * (1 - a) * (x - y);
    return { richtig: d, toleranz: T, falsch: [[-d, "Vorzeichen"], [a * x - a * y, "beide Pfade"], [x - y, "gefragt ist aber d"]] };
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
      await urne(page);
      await tafel(page, "mult-vft-mount", "mult-explain", ["arbeitet mehr als 40h/Woche", "arbeitet bis zu 40h/Woche"], ["schläft ruhig", "schläft unruhig"], [[213, 132], [126, 50]]);
      await tafel(page, "korrelation-vft-mount", "korrelation-explain", ["trägt Schal", "kein Schal"], ["erkältet", "nicht erkältet"], [[35, 15], [5, 45]]);
      await flaechenmodell(page);
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
