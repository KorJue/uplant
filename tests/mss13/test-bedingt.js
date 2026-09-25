// Fachliche Prüfung: MSS 13, Wahrscheinlichkeitsrechnung, Thema 2 „Bedingte Wahrscheinlichkeit“.
//
// Geprüft wird, was die Seite zeigt, gegen eine unabhängige Rechnung:
//   * der Baum: die Erklärung nennt genau den Wert am zweiten Ast;
//   * die reduzierte Ergebnismenge: P_A(B) = |A ∩ B| : |A| für viele Paare von Ereignissen;
//   * die Vierfeldertafel: Zeile und Spalte als Bedingung, für jede Zelle;
//   * das Flächenmodell: Flächen aus dem SVG gemessen, der Quotient in der Bilanz stimmt, und
//     die Bedingung markiert genau die richtigen Rechtecke;
//   * Leons Baum: die Äste des falschen Baums ergeben nicht 1, die des richtigen schon;
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
const SEITE = "/mathematik/mss13/01-wahrscheinlichkeitsrechnung/02-bedingte-wahrscheinlichkeit/index.html";
const WURZEL = path.resolve(__dirname, "..", "..");
const nahe = (a, b, tol = 5e-4) => Number.isFinite(a) && Math.abs(a - b) <= tol;

async function geruest(page) {
  const folge = await page.evaluate(() => [...document.querySelectorAll("main section[id]")].map((s) => s.id));
  const soll = ["sec-baum-bedingt", "sec-reduziert", "sec-vft-bedingt", "sec-formel", "sec-stolperstelle",
    "sec-selbsteinschaetzung", "sec-vernetzung", "sec-formelsammlung", "sec-uebungen"];
  pruefe(JSON.stringify(folge) === JSON.stringify(soll), `Gerüst: Abschnitte ${folge.join(", ")} statt ${soll.join(", ")}`);
  pruefe(fs.existsSync(path.join(WURZEL, path.dirname(SEITE), "formelsammlung.pdf")), "Formelsammlung: formelsammlung.pdf fehlt");
  const notation = await page.evaluate(() => (document.querySelector(".notation-box") || {}).innerText || "");
  pruefe(/Bigalke\/Köhler/.test(notation) && /P\(B \| A\)/.test(notation), "Gerüst: der Kasten mit den Schreibweisen fehlt oder nennt P(B | A) nicht");
  const links = await page.evaluate(() =>
    [...document.querySelectorAll("main a[href]")].map((a) => a.getAttribute("href")).filter((h) => !h.startsWith("#") && !h.startsWith("http")));
  for (const href of new Set(links)) {
    const ziel = new URL(href.split("#")[0], "http://localhost" + SEITE).pathname;
    const antwort = await page.request.get("http://localhost:" + (process.env.UPLANT_PORT || "8936") + ziel);
    pruefe(antwort.ok(), `Gerüst: der Verweis „${href}“ führt ins Leere (${antwort.status()})`);
  }
  // Kein Vorgriff auf Thema 3: Die Regel von Bayes kommt hier nicht vor.
  const haupt = await page.evaluate(() => document.querySelector("main").innerText);
  pruefe(!/Bayes/.test(haupt), "Gerüst: die Regel von Bayes wird schon in Thema 2 benutzt");
}

async function baum(page) {
  const blaetter = await page.locator("#tree-bedingt-mount .tree-leaf-hit").count();
  const soll = [0.09, 0.91, 0.008, 0.992];
  for (let i = 0; i < blaetter; i++) {
    await page.locator("#tree-bedingt-mount .tree-leaf-hit").nth(i).click({ force: true });
    const t = await text(page, "#tree-bedingt-explain");
    const m = t.match(/P[MW]\([^)]*\) = ([\d,]+)/);
    pruefe(!!m && nahe(zahl(m[1]), soll[i], 6e-4), `Baum: Blatt ${i + 1} erklärt ${m && m[1]} statt ${soll[i]} — „${t}“`);
  }
}

async function reduziert(page) {
  const faelle = [[[2, 4, 6], [4, 5, 6]], [[1, 2, 3], [2, 3, 5]], [[5, 6], [1, 2, 3, 4, 5, 6]], [[1, 3, 5], [2, 4, 6]], [[1, 2, 3, 4], [4]]];
  for (const [A, B] of faelle) {
    // Alle Knöpfe zurücksetzen: aktive noch einmal anklicken.
    for (const [picker, klasse] of [["#picker-a", "active-a"], ["#picker-b", "active-b"]]) {
      const kn = await page.locator(`${picker} button`).all();
      for (const k of kn) if ((await k.getAttribute("class") || "").includes(klasse)) await k.click();
    }
    for (const z of A) await page.locator("#picker-a button").nth(z - 1).click();
    for (const z of B) await page.locator("#picker-b button").nth(z - 1).click();
    const t = await text(page, "#reduziert-out");
    const schnitt = A.filter((z) => B.includes(z)).length;
    const m = t.match(/= (\d+)\/(\d+) = ([\d,]+)/);
    pruefe(!!m && Number(m[1]) === schnitt && Number(m[2]) === A.length && nahe(zahl(m[3]), schnitt / A.length, 6e-4),
      `Reduzierte Ergebnismenge A = {${A}}, B = {${B}}: „${t}“ statt ${schnitt}/${A.length}`);
  }
}

async function tafel(page) {
  // Die Zahlen der Tafel werden aus der Tafel gelesen und unabhängig nachgerechnet.
  const tab = await page.evaluate(() => [...document.querySelectorAll("#vft-bedingt-mount tr")].map((tr) => [...tr.children].map((c) => c.innerText.trim())));
  const z = tab.slice(1, 3).map((r) => [Number(r[1]), Number(r[2])]);
  const zeile = z.map((r) => r[0] + r[1]), spalte = [z[0][0] + z[1][0], z[0][1] + z[1][1]];
  pruefe(Number(tab[3][3]) === zeile[0] + zeile[1], "Tafel: die Gesamtsumme stimmt nicht");
  const zellen = await page.locator("#vft-bedingt-mount .vft-cell").all();
  for (let i = 0; i < 4; i++) {
    await zellen[i].click();
    const t = await text(page, "#vft-bedingt-explain");
    const r = Math.floor(i / 2), c = i % 2;
    const werte = [...t.matchAll(/= (\d+) \/ (\d+) = ([\d,]+)/g)];
    pruefe(werte.length === 2, `Tafel, Zelle ${i + 1}: zwei Rechnungen erwartet — „${t}“`);
    if (werte.length === 2) {
      pruefe(Number(werte[0][2]) === zeile[r] && nahe(zahl(werte[0][3]), z[r][c] / zeile[r], 6e-4), `Tafel, Zelle ${i + 1}: Zeile als Bedingung falsch — „${t}“`);
      pruefe(Number(werte[1][2]) === spalte[c] && nahe(zahl(werte[1][3]), z[r][c] / spalte[c], 6e-4), `Tafel, Zelle ${i + 1}: Spalte als Bedingung falsch — „${t}“`);
    }
  }
}

async function flaechenmodell(page) {
  for (const bed of ["A", "B"]) {
    await page.selectOption("#ff-bed", bed);
    for (const [a, x, y] of [[40, 70, 20], [10, 95, 5], [90, 5, 95], [50, 50, 50], [30, 20, 60]]) {
      await setzeRegler(page, "ff-a", a);
      await setzeRegler(page, "ff-x", x);
      await setzeRegler(page, "ff-y", y);
      const wo = `Flächenmodell (P(A) = ${a} %, P_A(B) = ${x} %, P_Ā(B) = ${y} %, Bedingung ${bed})`;
      const d = await page.evaluate(() => {
        const svg = document.querySelector("#ff-mount svg");
        const q = svg.querySelector('[data-rolle="quadrat"]');
        const F = +q.getAttribute("width") * +q.getAttribute("height");
        return {
          teile: Object.fromEntries([...svg.querySelectorAll("rect[data-teil]")].map((r) => [r.dataset.teil, (+r.getAttribute("width") * +r.getAttribute("height")) / F])),
          bedingung: [...svg.querySelectorAll("[data-bedingung]")].map((r) => r.dataset.bedingung).sort(),
        };
      });
      const pA = a / 100, px = x / 100, py = y / 100;
      const soll = { AB: pA * px, ABq: pA * (1 - px), AqB: (1 - pA) * py, AqBq: (1 - pA) * (1 - py) };
      for (const [k, v] of Object.entries(soll)) pruefe(Math.abs((d.teile[k] || 0) - v) < 2e-3, `${wo}: Fläche ${k} = ${(d.teile[k] || 0).toFixed(4)} statt ${v.toFixed(4)}`);
      const markiert = bed === "A" ? ["AB", "ABq"] : ["AB", "AqB"];
      pruefe(JSON.stringify(d.bedingung) === JSON.stringify(markiert.sort()), `${wo}: markiert sind ${d.bedingung.join(", ")} statt ${markiert.join(", ")}`);
      const bilanz = await text(page, "#ff-bilanz");
      const q = bed === "A" ? soll.AB / pA : soll.AB / (soll.AB + soll.AqB);
      const m = bilanz.match(/[=≈] ([\d,]+)(?: — die Höhe in der Spalte\.)?\s*$/);
      const genau = Math.abs(Math.round(q * 1e4) - q * 1e4) < 1e-9;
      pruefe(!m || bilanz.includes(`${genau ? "=" : "≈"} ${m[1]}`), `${wo}: „${genau ? "=" : "≈"}“ erwartet — „${bilanz}“`);
      pruefe(!!m && nahe(zahl(m[1]), q, 6e-5), `${wo}: die Bilanz nennt ${m && m[1]} statt ${q.toFixed(4)} — „${bilanz}“`);
    }
  }
}

async function stolperstelle(page) {
  const summen = async (id) => page.evaluate((i) => {
    const l = [...document.querySelectorAll(`#${i} .tree-edge-label`)].map((t) => parseFloat(t.textContent.match(/\(([\d,]+)\)/)[1].replace(",", ".")));
    return [l[2] + l[3], l[4] + l[5]];
  }, id);
  const falsch = await summen("tree-leon-wrong-mount"), richtig = await summen("tree-leon-correct-mount");
  pruefe(falsch.every((s) => Math.abs(s - 1) > 0.05), `Stolperstelle: Leons Baum ergibt an den Knoten ${falsch.join(" / ")} — der Fehler wäre nicht sichtbar`);
  pruefe(richtig.every((s) => Math.abs(s - 1) < 1e-3), `Stolperstelle: der richtige Baum ergibt an den Knoten ${richtig.join(" / ")}`);
}

async function quizze(page) {
  const ids = await page.evaluate(() => [...document.querySelectorAll(".quiz")].map((q) => q.id));
  pruefe(ids.length === 5, `Kontrollfragen: ${ids.length} statt 5`);
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
  pruefe(/href="#sec-formel"/.test(aus), `Selbsteinschätzung: kein Verweis zurück zur Formel — „${aus}“`);
  await page.evaluate(() => localStorage.clear());
}

const T = 0.0006;
// Gemessen mit UPLANT_ZUEGE=25 tests/werkzeug-streuung.js (200 Würfe je Aufgabe, 10⁻⁴-Quantil für 0,8 · n).
const SCHRANKE = {1: 13, 2: 20, 3: 19, 4: 22, 5: 16, 6: 18, 7: 22, 8: 18, 9: 16, 10: 13, 11: 17, 12: 19, 13: 8, 14: 19, 15: 16, 16: 13};

async function aufgaben(page) {
  const r = 25;
  const A = (nr, name, deute) => pruefeAufgabe(page, bericht, { nr, name, runden: r, mindestensVerschieden: SCHRANKE[nr] ?? 5, deute });
  const EREIGNIS = {
    "„gerade“": (z) => z % 2 === 0, "„ungerade“": (z) => z % 2 === 1, "„größer als 3“": (z) => z > 3,
    "„kleiner als 5“": (z) => z < 5, "„Primzahl“": (z) => [2, 3, 5, 7, 11].includes(z), "„durch 3 teilbar“": (z) => z % 3 === 0,
  };
  await A(1, "A1 reduzierte Ergebnismenge", (f) => {
    const m = f.match(/mit (\d+) Seiten .* Das Ergebnis ist („[^“]+“) \(Ereignis A\)\..* dann auch („[^“]+“)/);
    if (!m || !EREIGNIS[m[2]] || !EREIGNIS[m[3]]) return null;
    const N = Number(m[1]);
    let a = 0, ab = 0, b = 0;
    for (let z = 1; z <= N; z++) { if (EREIGNIS[m[2]](z)) a++; if (EREIGNIS[m[3]](z)) b++; if (EREIGNIS[m[2]](z) && EREIGNIS[m[3]](z)) ab++; }
    return { richtig: ab / a, toleranz: T, falsch: [[ab / N, "geschrumpft"], [b / N, "ohne jede"], [ab / b, "vertauscht"]] };
  });
  await A(2, "A2 Gegenast", (f) => {
    const m = f.match(/PA\(B\) = ([\d,]+)/);
    const pa = f.match(/P\(A\) = ([\d,]+)/);
    if (!m || !pa) return null;
    const x = zahl(m[1]), a = zahl(pa[1]);
    return { richtig: 1 - x, toleranz: T, falsch: [[x, "Ast nach B"], [a * (1 - x), "Pfadwahrscheinlichkeit"], [1 - a, "ersten Stufe"]] };
  });
  await A(3, "A3 Pfad", (f) => {
    const m = f.match(/P\(A\) = ([\d,]+) und PA\(B\) = ([\d,]+)/);
    if (!m) return null;
    const [a, x] = m.slice(1).map(zahl);
    return { richtig: a * x, toleranz: T, falsch: [[x, "innerhalb"], [a + x, "multipliziert"], [x / a, "Geteilt"]] };
  });
  await A(4, "A4 Bedingung Zeile", (f) => {
    const m = f.match(/A: (\d+), A ∩ App: (\d+), alle: (\d+), App: (\d+)/);
    if (!m) return null;
    const [nA, nAB, N, nB] = m.slice(1).map(Number);
    return { richtig: nAB / nA, toleranz: T, falsch: [[nAB / N, "allen"], [nAB / nB, "Spalte"], [nA / N, "P(A)"]] };
  });
  await A(5, "A5 Formel", (f) => {
    const m = f.match(/P\(A\) = ([\d,]+) und P\(A ∩ B\) = ([\d,]+)/);
    if (!m) return null;
    const [a, ab] = m.slice(1).map(zahl);
    return { richtig: ab / a, toleranz: T, falsch: [[ab * a, "Multipliziert"], [a / ab, "vertauscht"], [ab, "selbst"]] };
  });
  await A(6, "A6 Bedingung Spalte", (f) => {
    const m = f.match(/R ∩ B: (\d+), B: (\d+), R: (\d+), alle: (\d+)/);
    if (!m) return null;
    const [rb, b, rr, N] = m.slice(1).map(Number);
    return { richtig: rb / b, toleranz: T, falsch: [[rb / rr, "Spalte"], [rb / N, "bezogen auf alle"], [(b - rb) / b, "Nichtraucher"]] };
  });
  await A(7, "A7 zwei Pfade", (f) => {
    const m = f.match(/P\(A\) = ([\d,]+), PA\(B\) = ([\d,]+) und PĀ\(B\) = ([\d,]+)/);
    if (!m) return null;
    const [a, x, y] = m.slice(1).map(zahl);
    return { richtig: a * x + (1 - a) * y, toleranz: T, falsch: [[x + y, "verschiedene Gruppen"], [a * x, "nur der Pfad"], [(x + y) / 2, "Mittelwert"], [a * x + a * y, "erster Ast"]] };
  });
  await A(8, "A8 Äste aus der Tafel", (f) => {
    const m = f.match(/P\(A\) = ([\d,]+), P\(A ∩ B\) = ([\d,]+) und P\(Ā ∩ B\) = ([\d,]+)/);
    if (!m) return null;
    const [a, ab, aqb] = m.slice(1).map(zahl);
    return { felder: [ab / a, aqb / (1 - a)], toleranz: T, falschFelder: [[0, ab, "Pfad durch ersten Ast"], [0, ab / (ab + aqb), "Spaltensumme"], [1, aqb, "Teile durch"], [1, aqb / (ab + aqb), "Spaltensumme"]] };
  });
  await A(9, "A9 P_B(Ā)", (f) => {
    const m = f.match(/P\(B\) = ([\d,]+) und P\(A ∩ B\) = ([\d,]+)/);
    if (!m) return null;
    const [b, ab] = m.slice(1).map(zahl);
    return { richtig: 1 - ab / b, toleranz: T, falsch: [[ab / b, "Gegenereignis"], [1 - ab, "innerhalb"], [(b - ab) / (1 - b), "Nenner"]] };
  });
  await A(10, "A10 Sehschwäche", (f) => {
    const m = f.match(/([\d,]+) % aller Neugeborenen sind männlich\. Etwa ([\d,]+) % der Männer und ([\d,]+) % der Frauen/);
    if (!m) return null;
    const [mm, x, y] = m.slice(1).map((s) => zahl(s) / 100);
    return { richtig: mm * x + (1 - mm) * y, toleranz: 0.00006, falsch: [[x + y, "verschiedene Gruppen"], [(x + y) / 2, "gleich viele"], [mm * x, "nur der Pfad"]] };
  });
  await A(11, "A11 von allen oder von den", (f) => {
    const m = f.match(/sind ([\d,]+) % der Erwachsenen Raucher\. ([\d,]+) % aller Erwachsenen/);
    if (!m) return null;
    const [r, rb] = m.slice(1).map((s) => zahl(s) / 100);
    return { richtig: rb / r, toleranz: T, falsch: [[rb, "Anteil an allen"], [rb * r, "schon ein Pfad"], [r - rb, "ohne Husten"]] };
  });
  await A(12, "A12 P(A) zurück", (f) => {
    const m = f.match(/PA\(B\) = ([\d,]+) und P\(A ∩ B\) = ([\d,]+)/);
    if (!m) return null;
    const [x, ab] = m.slice(1).map(zahl);
    return { richtig: ab / x, toleranz: T, falsch: [[ab * x, "geteilt"], [x / ab, "vertauscht"], [x - ab, "Differenz"]] };
  });
  const ZW_A = {
    "„die Augensumme ist mindestens 9“": (a, b) => a + b >= 9, "„die Augensumme ist höchstens 5“": (a, b) => a + b <= 5,
    "„beide Augenzahlen sind gerade“": (a, b) => a % 2 === 0 && b % 2 === 0, "„die Augensumme ist gerade“": (a, b) => (a + b) % 2 === 0,
    "„der erste Würfel zeigt eine 6“": (a) => a === 6, "„die Augensumme ist ungerade“": (a, b) => (a + b) % 2 === 1,
    "„die Augenzahlen unterscheiden sich um höchstens 1“": (a, b) => Math.abs(a - b) <= 1,
  };
  const ZW_B = {
    "„mindestens eine 6“": (a, b) => a === 6 || b === 6, "„ein Pasch (beide gleich)“": (a, b) => a === b,
    "„der zweite Würfel zeigt mehr als 3“": (a, b) => b > 3, "„die Augensumme ist 10“": (a, b) => a + b === 10,
    "„die kleinere Augenzahl ist 1“": (a, b) => Math.min(a, b) === 1, "„die Augensumme ist 7“": (a, b) => a + b === 7,
  };
  await A(13, "A13 zwei Würfel", (f) => {
    const m = f.match(/Man erfährt: („[^“]+“) \(Ereignis A\)\..* dann („[^“]+“) \(Ereignis B\)/);
    if (!m || !ZW_A[m[1]] || !ZW_B[m[2]]) return null;
    let nA = 0, nAB = 0, nB = 0;
    for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) { if (ZW_A[m[1]](a, b)) nA++; if (ZW_B[m[2]](a, b)) nB++; if (ZW_A[m[1]](a, b) && ZW_B[m[2]](a, b)) nAB++; }
    return { richtig: nAB / nA, toleranz: T, falsch: [[nAB / 36, "36 Paaren"], [nB / 36, "ohne die Information"], [nAB / nB, "vertauscht"]] };
  });
  await A(14, "A14 fehlender Ast", (f) => {
    const m = f.match(/P\(A\) = ([\d,]+), PA\(B\) = ([\d,]+) und P\(B\) = ([\d,]+)/);
    if (!m) return null;
    const [a, x, b] = m.slice(1).map(zahl);
    const aqb = b - a * x;
    return { richtig: aqb / (1 - a), toleranz: T, falsch: [[aqb, "Pfad"], [b - x, "Pfaden"], [aqb / b, "Bedingung"]] };
  });
  await A(15, "A15 Teilzeit", (f) => {
    const m = f.match(/Von (\d+) Beschäftigten .* sind (\d+) % Frauen\. (\d+) % aller Beschäftigten arbeiten in Teilzeit, darunter (\d+) Frauen/);
    if (!m) return null;
    const [N, pw, pv, wv] = m.slice(1).map(Number);
    const W = (N * pw) / 100, V = (N * pv) / 100, M = N - W, Mv = V - wv;
    return { richtig: Mv / M, toleranz: T, falsch: [[Mv / V, "vertauscht"], [Mv / N, "allen Beschäftigten"], [wv / W, "Frauen"]] };
  });
  await A(16, "A16 zweite Kugel", (f) => {
    const m = f.match(/liegen (\d+) rote und (\d+) blaue Kugeln/);
    if (!m) return null;
    const r = Number(m[1]), b = Number(m[2]), n = r + b;
    // Unabhängig über beide Pfade gerechnet.
    const soll = (r / n) * ((r - 1) / (n - 1)) + (b / n) * (r / (n - 1));
    return { richtig: soll, toleranz: T, falsch: [[(r - 1) / (n - 1), "wüsste"], [r / (n - 1), "blauen"], [(r / n) * ((r - 1) / (n - 1)), "rot → rot"]] };
  });
  const n = await page.locator("#ausfuell-mount > *").count();
  pruefe(n >= 3, `Ausfüllaufgaben: nur ${n} gefunden`);
}

(async () => {
  const browser = await starteBrowser();
  for (const dunkel of [false, true]) {
    const wo = dunkel ? "dunkel" : "hell";
    const page = await neueSeite(browser, { dunkel });
    await oeffne(page, SEITE);
    if (!dunkel) {
      await geruest(page);
      await baum(page);
      await reduziert(page);
      await tafel(page);
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
