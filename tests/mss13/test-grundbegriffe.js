// Fachliche Prüfung: MSS 13, Wahrscheinlichkeitsrechnung, Thema 1 „Grundbegriffe, Baumdiagramme
// und Vierfeldertafel“.
//
// Die Seite behauptet Regeln — Summenregel, Gegenereignis, Laplace, Pfadmultiplikation und
// Pfadaddition — und zeigt sie an Simulationen und am Flächenmodell. Geprüft wird:
//
//   1. Die ANZEIGEN rechnen richtig: Jede angezeigte Wahrscheinlichkeit wird aus den Angaben der
//      Seite (Kugelzahlen, gewählte Ergebnisse) unabhängig nachgerechnet.
//   2. Das FLÄCHENMODELL zeigt, was es sagt: Die Fläche jedes Rechtecks wird aus dem SVG
//      gemessen und muss die Pfadwahrscheinlichkeit sein; die vier füllen das Quadrat. Mit
//      Zurücklegen liegen die Schnitte gleich hoch, ohne nicht.
//   3. Die SIMULATION hält das Gesetz der großen Zahlen ein (nach 2000 Drehungen weicht keine
//      relative Häufigkeit um mehr als 0,06 von P ab — bei der Streuung dieser Zahlen ein
//      Fehlalarm seltener als einmal in einer Million Läufe).
//   4. Die AUFGABEN rechnen richtig — von beiden Seiten, mit jedem Fehlerwert.

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
const SEITE = "/mathematik/mss13/01-wahrscheinlichkeitsrechnung/01-grundbegriffe-baumdiagramme-vierfeldertafel/index.html";
const WURZEL = path.resolve(__dirname, "..", "..");
const nahe = (a, b, tol = 5e-4) => Number.isFinite(a) && Math.abs(a - b) <= tol;

// Eine Wahrscheinlichkeit aus einem Anzeigetext: „0,24“, „24 %“, „24,0 %“.
function wkeit(t) {
  const s = String(t).trim();
  if (/%/.test(s)) return zahl(s) / 100;
  return zahl(s);
}

// ── Gerüst ────────────────────────────────────────────────────────────────
async function geruest(page) {
  const folge = await page.evaluate(() => [...document.querySelectorAll("main section[id]")].map((s) => s.id));
  const soll = ["sec-ergebnis", "sec-haeufigkeit", "sec-ereignis", "sec-laplace", "sec-baum1", "sec-baum2",
    "sec-selbsteinschaetzung", "sec-vernetzung", "sec-formelsammlung", "sec-uebungen"];
  pruefe(JSON.stringify(folge) === JSON.stringify(soll), `Gerüst: Abschnitte ${folge.join(", ")} statt ${soll.join(", ")}`);
  const pdf = path.join(WURZEL, path.dirname(SEITE), "formelsammlung.pdf");
  pruefe(fs.existsSync(pdf), "Formelsammlung: formelsammlung.pdf fehlt");
  if (fs.existsSync(pdf)) {
    const roh = fs.readFileSync(pdf).toString("latin1");
    const box = roh.match(/\/MediaBox\s*\[\s*0 0 ([\d.]+) ([\d.]+)/);
    pruefe(!!box && Number(box[1]) > Number(box[2]), "Formelsammlung: das PDF ist nicht im Querformat");
  }
  const notation = await page.evaluate(() => (document.querySelector(".notation-box") || {}).innerText || "");
  pruefe(/Bigalke\/Köhler/.test(notation) && /Ē/.test(notation), "Gerüst: der Kasten mit den Schreibweisen fehlt");
  // Kein Vorgriff auf Thema 2: Die bedingte Wahrscheinlichkeit wird hier nur als Ausblick genannt.
  const erarbeitung = await page.evaluate(() =>
    [...document.querySelectorAll("#sec-ergebnis, #sec-haeufigkeit, #sec-ereignis, #sec-laplace, #sec-baum1, #sec-baum2")].map((s) => s.innerText).join(" "));
  pruefe(!/P_?[AB]\(|bedingte Wahrscheinlichkeit/.test(erarbeitung), "Gerüst: In den Erarbeitungsabschnitten wird die bedingte Wahrscheinlichkeit aus Thema 2 schon benutzt");
  const links = await page.evaluate(() =>
    [...document.querySelectorAll("main a[href]")].map((a) => a.getAttribute("href")).filter((h) => !h.startsWith("#") && !h.startsWith("http")));
  for (const href of new Set(links)) {
    const ziel = new URL(href.split("#")[0], "http://localhost" + SEITE).pathname;
    const antwort = await page.request.get("http://localhost:" + (process.env.UPLANT_PORT || "8936") + ziel);
    pruefe(antwort.ok(), `Gerüst: der Verweis „${href}“ führt ins Leere (${antwort.status()})`);
  }
}

// ── Glücksrad, Summenregel, Gesetz der großen Zahlen ─────────────────────
async function gluecksrad(page) {
  // Die Wahrscheinlichkeiten der vier Farben, so wie die Tabelle sie nennt.
  const zeilen = async () => page.evaluate(() => [...document.querySelectorAll("#stat-table tr")].slice(1).map((tr) => [...tr.children].map((td) => td.innerText.trim())));
  const z0 = await zeilen();
  const farben = z0.slice(0, -1).map((z) => ({ name: z[0], p: 0 }));
  z0.slice(0, -1).forEach((z, i) => { farben[i].p = zahl(z[3]) / 100; });
  pruefe(farben.length === 4 && nahe(farben.reduce((s, f) => s + f.p, 0), 1, 1e-3), `Glücksrad: die vier Wahrscheinlichkeiten ergeben nicht 1 (${farben.map((f) => f.p).join(", ")})`);

  // Summenregel und Gegenereignis — für jede Auswahl von Farben.
  const boxen = await page.locator("#event-picker input[type=checkbox]").all();
  for (let maske = 1; maske < 16; maske++) {
    for (let i = 0; i < 4; i++) {
      const soll = !!(maske & (1 << i));
      if ((await boxen[i].isChecked()) !== soll) await boxen[i].click();
    }
    const t = await text(page, "#event-result");
    const pE = farben.filter((_, i) => maske & (1 << i)).reduce((s, f) => s + f.p, 0);
    const werte = zahlen(t.split("P(E) =")[1] || "");
    const pEAnzeige = t.match(/P\(E\) = [^=]*= ([\d,]+)/);
    const pGAnzeige = t.match(/P\(Ē\) = 1 − [\d,]+ = ([\d,]+)/);
    pruefe(!!pEAnzeige && nahe(zahl(pEAnzeige[1]), pE, 1e-3), `Summenregel (Maske ${maske}): P(E) = ${pEAnzeige && pEAnzeige[1]} statt ${pE}`);
    pruefe(!!pGAnzeige && nahe(zahl(pGAnzeige[1]), 1 - pE, 1e-3), `Gegenereignis (Maske ${maske}): P(Ē) = ${pGAnzeige && pGAnzeige[1]} statt ${1 - pE}`);
    void werte;
  }

  // Gesetz der großen Zahlen: 2000 Drehungen.
  await page.locator("#reset-stats-btn").click();
  for (let i = 0; i < 2; i++) await page.locator('[data-spin-many="1000"]').click();
  await page.waitForTimeout(200);
  const z = await zeilen();
  const gesamt = zahl(z[z.length - 1][1]);
  pruefe(gesamt === 2000, `Glücksrad: nach 2 × 1000 Drehungen zählt die Tabelle ${gesamt}`);
  let summe = 0;
  z.slice(0, -1).forEach((zeile, i) => {
    const H = zahl(zeile[1]);
    summe += H;
    const h = zahl(zeile[2]) / 100;
    pruefe(nahe(h, H / gesamt, 6e-4), `Glücksrad: h = ${zeile[2]} passt nicht zu H = ${H} von ${gesamt}`);
    pruefe(Math.abs(H / gesamt - farben[i].p) < 0.06, `Glücksrad: nach ${gesamt} Drehungen ist h(${farben[i].name}) = ${H / gesamt}, P = ${farben[i].p}`);
  });
  pruefe(summe === gesamt, `Glücksrad: die absoluten Häufigkeiten ergeben ${summe} statt ${gesamt}`);
}

// ── Laplace-Würfel ────────────────────────────────────────────────────────
async function laplace(page) {
  const knoepfe = await page.locator("#face-picker .face-btn").all();
  pruefe(knoepfe.length === 8, `Laplace: ${knoepfe.length} Augenzahlen statt 8`);
  const gewaehlt = new Set();
  for (const f of [2, 5, 7, 8]) {
    await knoepfe[f - 1].click();
    gewaehlt.add(f);
    const t = await text(page, "#laplace-result");
    const m = t.match(/P\(E\) = (\d+)\/8 = ([\d,]+)/);
    pruefe(!!m && Number(m[1]) === gewaehlt.size && nahe(zahl(m[2]), gewaehlt.size / 8, 1e-3), `Laplace: bei |E| = ${gewaehlt.size} zeigt die Seite „${t}“`);
  }
  await page.locator('[data-roll-many="100"]').click();
  const t = await text(page, "#laplace-tally");
  const m = t.match(/Bisher (\d+) Würfe, davon (\d+) in E → relative Häufigkeit h\(E\) = ([\d,]+) %/);
  pruefe(!!m && nahe(Number(m[2]) / Number(m[1]), zahl(m[3]) / 100, 6e-4), `Laplace: die Strichliste rechnet h(E) falsch — „${t}“`);
}

// ── Baumdiagramme ─────────────────────────────────────────────────────────
async function baeume(page) {
  // Jedes Blatt: P = Produkt der beiden Äste davor (aus den Astbeschriftungen gelesen).
  async function pruefeBaum(mountId, wo, astSoll) {
    const d = await page.evaluate((id) => {
      const svg = document.querySelector(`#${id} svg`);
      return {
        aeste: [...svg.querySelectorAll(".tree-edge-label")].map((t) => t.textContent),
        blaetter: [...svg.querySelectorAll(".tree-leaf-prob")].map((t) => t.textContent),
      };
    }, mountId);
    const w = (s) => zahl(s.match(/\(([\d,]+)\)/)[1]);
    const erste = d.aeste.slice(0, 2).map(w), zweite = d.aeste.slice(2).map(w);
    pruefe(zweite.length === 4 && d.blaetter.length === 4, `${wo}: der Baum hat nicht vier Blätter`);
    for (let i = 0; i < 4; i++) {
      const soll = erste[Math.floor(i / 2)] * zweite[i];
      pruefe(nahe(zahl(d.blaetter[i]), soll, 6e-4), `${wo}: Blatt ${i + 1} zeigt ${d.blaetter[i]} statt ${soll}`);
      if (astSoll) pruefe(nahe(zweite[i], astSoll[i], 6e-4), `${wo}: der zweite Ast ${i + 1} ist ${zweite[i]} statt ${astSoll[i]}`);
    }
    pruefe(nahe(erste[0] + erste[1], 1, 1e-3) && nahe(zweite[0] + zweite[1], 1, 1e-3) && nahe(zweite[2] + zweite[3], 1, 1e-3), `${wo}: die Äste an einem Knoten ergeben nicht 1`);
  }
  await pruefeBaum("tree1-mount", "Baum Münze × Glücksrad");
  // Pfadaddition: alle Teilmengen der Blätter.
  const boxen = await page.locator("#tree1-event input[type=checkbox]").all();
  const labels = await page.locator("#tree1-event label").allInnerTexts();
  const pfade = labels.map((l) => zahl(l.match(/P = ([\d,]+)/)[1]));
  for (const maske of [1, 3, 6, 9, 15]) {
    for (let i = 0; i < 4; i++) if ((await boxen[i].isChecked()) !== !!(maske & (1 << i))) await boxen[i].click();
    const t = await page.locator("#tree1-event .event-result").innerText();
    const soll = pfade.filter((_, i) => maske & (1 << i)).reduce((s, p) => s + p, 0);
    const m = t.match(/= ([\d,]+)\s*$/);
    pruefe(!!m && nahe(zahl(m[1]), soll, 2e-3), `Pfadaddition (Maske ${maske}): „${t}“ statt ${soll}`);
  }

  // Urne 4 rot / 6 blau — unabhängig nachgerechnet.
  for (const [modus, knopf, zweite] of [
    ["mit", 0, [0.4, 0.6, 0.4, 0.6]],
    ["ohne", 1, [3 / 9, 6 / 9, 4 / 9, 5 / 9]],
  ]) {
    await page.locator("#urn-mode-toggle button").nth(knopf).click();
    await pruefeBaum("tree2-mount", `Urne ${modus} Zurücklegen`, zweite);
    // Vierfeldertafel: alle vier Blätter eintragen, dann Zellen = Pfade, Summen = erste Stufe.
    await page.locator("#vft-guide-reset").click();
    for (let i = 0; i < 4; i++) await page.locator("#vft-guide-next").click();
    const zellen = await page.evaluate(() => Object.fromEntries([...document.querySelectorAll("#vft-guide-table .vft-cell")].map((td) => [td.dataset.key, td.innerText])));
    const soll = { rot_rot: 0.4 * zweite[0], rot_blau: 0.4 * zweite[1], blau_rot: 0.6 * zweite[2], blau_blau: 0.6 * zweite[3] };
    for (const [k, p] of Object.entries(soll)) {
      pruefe(nahe(wkeit(zellen[k]), p, 6e-4), `Vierfeldertafel ${modus}: Zelle ${k} = ${zellen[k]} statt ${p}`);
    }
  }
}

// ── Flächenmodell ─────────────────────────────────────────────────────────
async function flaechenmodell(page) {
  for (const ohne of [false, true]) {
    await page.evaluate((o) => { const e = document.getElementById("fm-ohne"); e.checked = o; e.dispatchEvent(new Event("change")); }, ohne);
    for (const [r, b] of [[4, 6], [1, 8], [8, 1], [3, 3], [2, 7], [5, 5]]) {
      await setzeRegler(page, "fm-r", r);
      await setzeRegler(page, "fm-b", b);
      const n = r + b;
      const breite = { r: r / n, b: b / n };
      const hoehe = ohne
        ? { rr: (r - 1) / (n - 1), rb: b / (n - 1), br: r / (n - 1), bb: (b - 1) / (n - 1) }
        : { rr: r / n, rb: b / n, br: r / n, bb: b / n };
      const wo = `Flächenmodell (${r} rot, ${b} blau, ${ohne ? "ohne" : "mit"} Zurücklegen)`;
      const d = await page.evaluate(() => {
        const svg = document.querySelector("#fm-mount svg");
        const q = svg.querySelector('[data-rolle="quadrat"]');
        return {
          quadrat: { w: +q.getAttribute("width"), h: +q.getAttribute("height") },
          rechtecke: [...svg.querySelectorAll("rect[data-pfad]")].map((e) => ({ pfad: e.dataset.pfad, w: +e.getAttribute("width"), h: +e.getAttribute("height") })),
          schnitte: Object.fromEntries([...svg.querySelectorAll("line[data-schnitt]")].map((l) => [l.dataset.schnitt, +l.getAttribute("y1")])),
        };
      });
      const F = d.quadrat.w * d.quadrat.h;
      let summe = 0;
      for (const k of ["rr", "rb", "br", "bb"]) {
        const soll = breite[k[0]] * hoehe[k];
        const re = d.rechtecke.find((x) => x.pfad === k);
        const ist = re ? (re.w * re.h) / F : 0;
        summe += ist;
        pruefe(Math.abs(ist - soll) < 2e-3, `${wo}: das Rechteck ${k} hat die Fläche ${ist.toFixed(4)} statt ${soll.toFixed(4)}`);
      }
      pruefe(Math.abs(summe - 1) < 2e-3, `${wo}: die Rechtecke füllen das Quadrat nicht (${summe.toFixed(4)})`);
      const gleich = Math.abs(d.schnitte.r - d.schnitte.b) < 0.5;
      pruefe(gleich === !ohne, `${wo}: die Schnitte liegen ${gleich ? "gleich" : "verschieden"} hoch`);
      for (const pfad of ["rr", "rb", "br", "bb"]) {
        await page.selectOption("#fm-pfad", pfad);
        const bilanz = await text(page, "#fm-bilanz");
        const soll = breite[pfad[0]] * hoehe[pfad];
        const m = bilanz.match(/([=≈]) ([\d,]+) Alle vier/);
        pruefe(!!m && nahe(zahl(m[2]), soll, 6e-5), `${wo}, Pfad ${pfad}: die Bilanz nennt ${m && m[2]} statt ${soll.toFixed(4)} — „${bilanz}“`);
        // „=“ nur, wenn vier Stellen den Wert genau treffen (6/25 = 0,24; 2/15 ≈ 0,1333).
        const genau = Math.abs(Math.round(soll * 1e4) - soll * 1e4) < 1e-9;
        pruefe(!m || m[1] === (genau ? "=" : "≈"), `${wo}, Pfad ${pfad}: „${m && m[1]}“ statt „${genau ? "=" : "≈"}“ — „${bilanz}“`);
        pruefe(/= 1\b/.test(bilanz), `${wo}: die Bilanz zeigt nicht, dass die Flächen 1 ergeben`);
      }
      const t = await text(page, "#fm-text");
      pruefe(ohne ? /verschiedener Höhe/.test(t) : /derselben Höhe/.test(t), `${wo}: der Text passt nicht — „${t}“`);
    }
  }
}

// ── Kontrollfragen und Selbsteinschätzung ─────────────────────────────────
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
  pruefe(new Set(stellen).size >= 4, `Kontrollfragen: die richtige Antwort steht nur an ${new Set(stellen).size} Stellen (${stellen.join(", ")})`);
  for (const sec of ["sec-ergebnis", "sec-haeufigkeit", "sec-ereignis", "sec-laplace", "sec-baum1", "sec-baum2"]) {
    const n = await page.locator(`#${sec} .quiz`).count();
    pruefe(n >= 1, `${sec}: keine Kontrollfrage`);
  }
  // Selbsteinschätzung: „unsicher“ führt zum Abschnitt zurück.
  await page.evaluate(() => localStorage.clear());
  await page.locator("#se-liste .se-zeile").first().locator("button").nth(2).click();
  const aus = await page.evaluate(() => document.getElementById("se-auswertung").innerHTML);
  pruefe(/href="#sec-ergebnis"/.test(aus), `Selbsteinschätzung: kein Verweis zurück zu Abschnitt 1 — „${aus}“`);
  await page.evaluate(() => localStorage.clear());
}

// ── Übungsaufgaben ────────────────────────────────────────────────────────
//
// Die Toleranz der Seite ist 0,0006; die Fehlerwerte liegen mindestens 0,002 auseinander.
const T = 0.0006;
// Gemessen mit werkzeug-streuung.js (siehe SCHRANKE unten).
// Gemessen mit UPLANT_ZUEGE=25 tests/werkzeug-streuung.js (200 Würfe je Aufgabe, 10⁻⁴-Quantil für 0,8 · n).
const SCHRANKE = {1: 22, 2: 19, 3: 9, 4: 10, 5: 10, 6: 16, 7: 12, 8: 22, 9: 8, 10: 20, 11: 14, 12: 20, 13: 11, 14: 11, 15: 21, 16: 9};

function urne(f) {
  const m = f.match(/(\d+) (rote|weiße|grüne) und (\d+) (blaue|schwarze|gelbe) Kugeln/);
  return m ? { a: Number(m[1]), b: Number(m[3]) } : null;
}

async function aufgaben(page) {
  const r = 25;
  const A = (nr, name, deute) => pruefeAufgabe(page, bericht, { nr, name, runden: r, mindestensVerschieden: SCHRANKE[nr] ?? 5, deute });
  await A(1, "A1 relative Häufigkeit", (f) => {
    const m = f.match(/wurde ([\d.]+)-mal beobachtet\. .* trat (\d+)-mal auf/);
    if (!m) return null;
    const n = zahl(m[1]), H = Number(m[2]);
    return { richtig: H / n, toleranz: T, falsch: [[n / H, "vertauscht"], [(n - H) / n, "Gegenteil"], [n === 100 ? NaN : H / 100, "100"]] };
  });
  await A(2, "A2 Gegenereignis", (f) => {
    const m = f.match(/P\(E\) = ([\d,]+)/);
    if (!m) return null;
    const p = zahl(m[1]);
    return { richtig: 1 - p, toleranz: T, falsch: [[p, "P(E) selbst"]] };
  });
  await A(3, "A3 Laplace", (f) => {
    const m = f.match(/Seiten \(1 bis (\d+)\)\. E sei das Ereignis „([^“]+)“/);
    if (!m) return null;
    const N = Number(m[1]);
    const tests = {
      "eine gerade Zahl": (z) => z % 2 === 0,
      "eine Primzahl": (z) => [2, 3, 5, 7, 11, 13, 17, 19].includes(z),
      "eine Zahl größer als 5": (z) => z > 5,
      "ein Vielfaches von 3": (z) => z % 3 === 0,
      "eine Zahl kleiner als 4": (z) => z < 4,
      "eine Quadratzahl": (z) => [1, 4, 9, 16].includes(z),
      "eine ungerade Zahl größer als 2": (z) => z % 2 === 1 && z > 2,
      "ein Teiler von 12": (z) => 12 % z === 0,
    };
    const t = tests[m[2]];
    if (!t) return null;
    let g = 0;
    for (let z = 1; z <= N; z++) if (t(z)) g++;
    return { richtig: g / N, toleranz: T, falsch: [[(N - g) / N, "Gegenereignis"], [1 / N, "eine bestimmte"], [g / (N - g), "Nenner"]] };
  });
  await A(4, "A4 Summenregel", (f) => {
    const felder = Object.fromEntries([...f.matchAll(/(Rot|Blau|Grün|Gelb|Weiß) \(([\d,]+) %\)/g)].map((m) => [m[1], zahl(m[2]) / 100]));
    const m = f.match(/E: „([A-Za-zäöüÄÖÜß]+) oder ([A-Za-zäöüÄÖÜß]+)“/);
    if (!m || !(m[1] in felder)) return null;
    const a = felder[m[1]], b = felder[m[2]];
    return { richtig: a + b, toleranz: T, falsch: [[a * b, "addiert"], [1 - a - b, "keine"]] };
  });
  await A(5, "A5 Pfadmultiplikation", (f) => {
    const m = f.match(/Wahrscheinlichkeit ([\d,]+) „Rot“.*und der Würfel (eine Sechs|keine Sechs|eine gerade Zahl|eine Zahl kleiner als 3|eine Zahl größer als 2)\?/);
    if (!m) return null;
    const pr = zahl(m[1]);
    const pw = { "eine Sechs": 1 / 6, "keine Sechs": 5 / 6, "eine gerade Zahl": 1 / 2, "eine Zahl kleiner als 3": 2 / 6, "eine Zahl größer als 2": 4 / 6 }[m[2]];
    return { richtig: pr * pw, toleranz: T, falsch: [[pr + pw, "multipliziert"], [pr * (1 - pw), "Gegenwahrscheinlichkeit"], [(1 - pr) * pw, "ersten Ast"]] };
  });
  await A(6, "A6 ohne Zurücklegen", (f) => {
    const u = urne(f);
    if (!u) return null;
    const n = u.a + u.b;
    return { richtig: (u.a / n) * ((u.a - 1) / (n - 1)), toleranz: T, falsch: [[(u.a / n) ** 2, "mit"], [(u.a / n) * ((u.a - 1) / n), "Nenner"], [(2 * u.a) / n, "Multiplizieren"]] };
  });
  await A(7, "A7 Pfadaddition", (f) => {
    const u = urne(f);
    if (!u) return null;
    const p = u.a / (u.a + u.b), q = 1 - p;
    return { richtig: 2 * p * q, toleranz: T, falsch: [[p * q, "ein"], [p * p + q * q, "gleiche"]] };
  });
  await A(8, "A8 Vierfeldertafel ergänzen", (f) => {
    const m = f.match(/Von (\d+) .*? sind (\d+) .*?\. (\d+) der .*?; darunter sind (\d+) /);
    if (!m) return null;
    const [N, Aa, B, AB] = m.slice(1).map(Number);
    const x = B - AB, y = N - Aa - x;
    return { felder: [x, y], toleranz: 0.5, falschFelder: [[0, B, "Spaltensumme"], [1, N - Aa, "Zeilensumme"], [1, N - B, "Spaltensumme"]] };
  });
  await A(9, "A9 mindestens einmal", (f) => {
    const m = f.match(/Wahrscheinlichkeit ([\d,]+)\. Er wirft (\d)-mal/);
    if (!m) return null;
    const p = zahl(m[1]), n = Number(m[2]);
    return { richtig: 1 - (1 - p) ** n, toleranz: T, falsch: [[n * p, "keine Wahrscheinlichkeit"], [(1 - p) ** n, "keinen"], [1 - p ** n, "nie treffen"], [p ** n, "jedes Mal"]] };
  });
  await A(10, "A10 weder A noch B", (f) => {
    const m = f.match(/P\(A\) = ([\d,]+), P\(B\) = ([\d,]+) und P\(A ∩ B\) = ([\d,]+)/);
    if (!m) return null;
    const [a, b, ab] = m.slice(1).map(zahl);
    return { richtig: 1 - a - b + ab, toleranz: T, falsch: [[1 - a - b, "doppelt"], [(1 - a) * (1 - b), "unabhängig"], [1 - ab, "beide"], [1 - a - ab, "Zeilensumme"]] };
  });
  await A(11, "A11 verschiedene Farben", (f) => {
    const u = urne(f);
    if (!u) return null;
    const n = u.a + u.b;
    const pfad = (u.a / n) * (u.b / (n - 1));
    return { richtig: 2 * pfad, toleranz: T, falsch: [[pfad, "nur der Pfad"], [2 * (u.a / n) * (u.b / n), "mit"], [1 - (u.a / n) * ((u.a - 1) / (n - 1)), "blaue"]] };
  });
  await A(12, "A12 vom Baum in die Tafel", (f) => {
    const m = f.match(/([\d,]+) % der Kundschaft .* Von den Stammkunden nutzen ([\d,]+) % .* von den übrigen Kunden ([\d,]+) %/);
    if (!m) return null;
    const [a, x, y] = m.slice(1).map((s) => zahl(s) / 100);
    return { felder: [a * x, a * x + (1 - a) * y], toleranz: T, falschFelder: [[0, x, "Stammkunden"], [1, x + y, "addieren"], [1, (x + y) / 2, "Mittelwert"]] };
  });
  await A(13, "A13 wie viele rote Kugeln", (f) => {
    const m = f.match(/liegen (\d+) Kugeln.*beträgt ([\d,]+)\./);
    if (!m) return null;
    const n = Number(m[1]), P = zahl(m[2]);
    const r = Math.round(Math.sqrt(P) * n);
    pruefe(Math.abs((r / n) ** 2 - P) < 1e-9, `A13: ${P} ist keine Quadratzahl eines Anteils von ${n} — „${f}“`);
    return { richtig: r, toleranz: 0.01, falsch: [[n - r, "anderen"], [P * n, "Wurzel"], [r / n, "Anzahl"]] };
  });
  await A(14, "A14 wie oft mindestens", (f) => {
    const m = f.match(/mindestens ([\d,]+) %/);
    const pm = f.match(/(?:Gewinnwahrscheinlichkeit|P\(Rot\) =|Trefferwahrscheinlichkeit|P\(Kopf\) =|Ausschussquote) ([\d,]+)/);
    const p = /Würfel/.test(f) ? 1 / 6 : pm ? zahl(pm[1]) : NaN;
    if (!m || !Number.isFinite(p)) return null;
    const s = zahl(m[1]) / 100;
    // Unabhängig: durch Hochzählen, nicht mit dem Logarithmus.
    let n = 1;
    while (1 - (1 - p) ** n < s - 1e-12) n++;
    return { richtig: n, toleranz: 0.01, falsch: [[n - 1, "Aufrunden"]] };
  });
  await A(15, "A15 Vierfeldertafel aus Text", (f) => {
    const m = f.match(/mit (\d+) Schülerinnen und Schülern sind (\d+) % Mädchen\. (\d+) % aller Kinder tragen eine Brille\. (\d+) Jungen/);
    if (!m) return null;
    const [N, pm, pb, jb] = m.slice(1).map(Number);
    const M = (N * pm) / 100, B = (N * pb) / 100;
    const mb = B - jb;
    return { richtig: M - mb, toleranz: 0.01, falsch: [[mb, "mit"], [M - jb, "anderen Zeile"], [M - B, "aufteilen"]] };
  });
  await A(16, "A16 Augensumme", (f) => {
    const rad = [...f.matchAll(/(\d) \(mit Wahrscheinlichkeit ([\d,]+)\)/g)].map((m) => [Number(m[1]), zahl(m[2])]);
    const m = f.match(/Summe (\d+)\?/);
    if (rad.length !== 3 || !m) return null;
    const s = Number(m[1]);
    let p = 0;
    const pfade = [];
    for (const [a, pa] of rad) for (const [b, pb] of rad) if (a + b === s) { p += pa * pb; pfade.push(pa * pb); }
    return { richtig: p, toleranz: T, falsch: pfade.length > 1 ? [[pfade[0], "nur der Pfad"]] : [] };
  });
  // Die Ausfüllaufgaben am Baum und an der Tafel sind da.
  const n = await page.locator("#ausfuell-mount > *").count();
  pruefe(n >= 10, `Ausfüllaufgaben: nur ${n} gefunden`);
}

(async () => {
  const browser = await starteBrowser();
  for (const dunkel of [false, true]) {
    const wo = dunkel ? "dunkel" : "hell";
    const page = await neueSeite(browser, { dunkel });
    await oeffne(page, SEITE);
    if (!dunkel) {
      await geruest(page);
      await gluecksrad(page);
      await laplace(page);
      await baeume(page);
      await flaechenmodell(page);
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
