// Fachliche Prüfung: Klasse 8, Terme, Thema 2 „Terme vereinfachen“.
//
// Nachgerechnet wird mit dem eigenen Termauswerter (tests/lib/polynom.js), nicht mit dem der Seite:
//
//   1. Die KACHELN: Je Glied des gewählten Terms liegen so viele Kacheln, wie seine Zahl sagt, mit
//      seinem Vorzeichen; die Größen passen zueinander (x²-Quadrat mit der Seite des x-Streifens, y
//      anders lang) und bleiben beim Sortieren gleich. An keiner Reglerstellung überdecken sich zwei
//      Kacheln. Sortiert liegt jede Sorte in einer eigenen Bahn, die Nullpaare stimmen, und das
//      Ergebnis ist gleichwertig und vereinfacht.
//   2. Die PRODUKTE: a · b Kacheln, die zu Anfang das Rechteck genau ausfüllen; beim Auseinander-
//      ziehen keine Überdeckung; das Ergebnis ist das Produkt.
//   3. Die KLAMMERN: Nur Kacheln einer Minusklammer werden umgedreht, Breite und Lage bleiben, die
//      sichtbare Höhe folgt dem Umklappen; danach stimmen die Kacheln mit dem Term ohne Klammer.
//   4. Der RECHENWEG: Jeder Schritt ist gleichwertig mit dem Anfang und tut, was seine Regel sagt;
//      der Regler wird auf die Zahl der Schritte begrenzt; die Probe stimmt.
//   5. Die AUFGABEN: Jede der acht wird über viele Runden gewürfelt, aus dem Aufgabentext (bei der
//      Umfangsaufgabe aus der Zeichnung) nachgerechnet und mit den vorgesehenen Fehlern geprüft.

"use strict";

const { neuerBericht } = require("../lib/pruefen");
const { starteBrowser, neueSeite, oeffne, setzeRegler } = require("../lib/seite");
const { pruefeNotation } = require("../lib/notation");
const { pruefeKontrast, pruefeStrichKontrast } = require("../lib/kontrast");
const { pruefeAufgabe } = require("../lib/aufgaben");
const P = require("../lib/polynom");
const fs = require("fs");
const path = require("path");

const bericht = neuerBericht();
const { pruefe } = bericht;
const SEITE = "/mathematik/klasse-8/terme/terme-vereinfachen.html";
const WURZEL = path.resolve(__dirname, "..", "..");
// Für Gegenproben: UPLANT_NUR=kacheln,aufgaben lässt nur die genannten Teile laufen.
const NUR = (process.env.UPLANT_NUR || "").split(",").map((t) => t.trim()).filter(Boolean);
const will = (teil) => NUR.length === 0 || NUR.includes(teil);

const waehle = (page, id, wert) => page.evaluate(([i, w]) => {
  const e = document.getElementById(i);
  e.value = w;
  e.dispatchEvent(new Event("input", { bubbles: true }));
}, [id, wert]);
const optionText = (page, id) => page.evaluate((i) => { const s = document.getElementById(i); return s.options[s.selectedIndex].text; }, id);
const normal = (s) => String(s).replace(/\s+/g, " ").trim();

// Ein Glied „−3x²“ zerlegt: Zahl (mit Vorzeichen) und Sorte (x2, x, y, xy oder 1).
function glied(text) {
  const t = P.normiere(text);
  const m = t.match(/^([+-]?)(\d*)([a-z^0-9]*)$/);
  if (!m) return null;
  const vz = m[1] === "-" ? -1 : 1;
  const zahlTeil = m[3] === "" ? Number(m[2]) : (m[2] === "" ? 1 : Number(m[2]));
  const sorte = m[3] === "" ? "1" : m[3] === "x^2" ? "x2" : m[3];
  return { k: vz * zahlTeil, sorte };
}
// Überdecken sich zwei Rechtecke (mehr als eine Berührung)?
const ueberdeckt = (a, b) => Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x) > 0.3 && Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y) > 0.3;
function keineUeberdeckung(rects, wo) {
  for (let i = 0; i < rects.length; i++) {
    for (let j = i + 1; j < rects.length; j++) {
      if (ueberdeckt(rects[i], rects[j])) { pruefe(false, `${wo}: Kachel ${i} und ${j} überdecken sich`); return; }
    }
  }
  pruefe(true, "");
}
const liesKacheln = (page, mount) => page.evaluate((m) => [...document.querySelectorAll(`#${m} g[data-rolle="kachel"]`)].map((g) => {
  const r = g.querySelector("rect");
  return {
    art: g.dataset.art, vz: Number(g.dataset.vz), glied: g.dataset.glied === undefined ? null : Number(g.dataset.glied),
    klammer: g.dataset.klammer === undefined ? null : Number(g.dataset.klammer), vzAnfang: g.dataset.vzAnfang === undefined ? null : Number(g.dataset.vzAnfang),
    x: +r.getAttribute("x"), y: +r.getAttribute("y"), w: +r.getAttribute("width"), h: +r.getAttribute("height"),
    minus: !!g.querySelector("line"),
  };
}), mount);

// ── 1. Kacheln sortieren ─────────────────────────────────────────────────

async function kacheln(page) {
  const n = await page.evaluate(() => document.getElementById("ka-term").options.length);
  pruefe(n === 5, `Kacheln: ${n} Terme statt 5`);
  for (let i = 0; i < n; i++) {
    await waehle(page, "ka-term", String(i));
    const term = await optionText(page, "ka-term");
    const glieder = P.summanden(term).map(glied);
    const wo = `Kacheln „${term}“`;
    pruefe(glieder.every(Boolean), `${wo}: ein Glied ist nicht lesbar`);
    const groesse = {};
    let anfang = null;
    for (const t of [0, 15, 35, 50, 65, 85, 100]) {
      await setzeRegler(page, "ka-t", t);
      const k = await liesKacheln(page, "ka-mount");
      const w2 = `${wo}, ${t} %`;
      // Je Glied: |Zahl| Kacheln seiner Sorte mit seinem Vorzeichen.
      glieder.forEach((g, gi) => {
        const eigene = k.filter((x) => x.glied === gi);
        pruefe(eigene.length === Math.abs(g.k) && eigene.every((x) => x.art === g.sorte && x.vz === Math.sign(g.k)),
          `${w2}: zum Glied ${gi + 1} liegen ${eigene.length} Kacheln (${[...new Set(eigene.map((x) => x.art + "/" + x.vz))]}) statt ${Math.abs(g.k)} × ${g.sorte}/${Math.sign(g.k)}`);
      });
      pruefe(k.length === glieder.reduce((s, g) => s + Math.abs(g.k), 0), `${w2}: ${k.length} Kacheln insgesamt`);
      pruefe(k.every((x) => x.minus === (x.vz < 0)), `${w2}: eine Kachel trägt das Minuszeichen nicht passend zu ihrem Vorzeichen`);
      // Größen: je Sorte gleich und über alle Reglerstellungen fest.
      for (const x of k) {
        const g = groesse[x.art] || (groesse[x.art] = { w: x.w, h: x.h });
        pruefe(Math.abs(g.w - x.w) < 0.01 && Math.abs(g.h - x.h) < 0.01, `${w2}: eine Kachel ${x.art} hat die Größe ${x.w} × ${x.h} statt ${g.w} × ${g.h}`);
      }
      keineUeberdeckung(k, w2);
      if (t === 0) anfang = k;
      if (t === 0) {
        // Wie geschrieben: Glied für Glied von links nach rechts, alle auf einer Grundlinie.
        for (let gi = 0; gi + 1 < glieder.length; gi++) {
          const rechts = Math.max(...k.filter((x) => x.glied === gi).map((x) => x.x + x.w));
          const links = Math.min(...k.filter((x) => x.glied === gi + 1).map((x) => x.x));
          pruefe(rechts < links, `${w2}: Glied ${gi + 1} und ${gi + 2} stehen nicht nacheinander`);
        }
        pruefe(new Set(k.map((x) => (x.y + x.h).toFixed(1))).size === 1, `${w2}: die Kacheln stehen nicht auf einer Linie`);
        const labels = await page.evaluate(() => [...document.querySelectorAll('#ka-mount [data-rolle="glied"]')].map((e) => e.textContent));
        pruefe(labels.length === glieder.length, `${w2}: ${labels.length} Gliedbeschriftungen für ${glieder.length} Glieder`);
        labels.forEach((l, gi) => {
          const g = glied(l.replace(/\s/g, ""));
          pruefe(g && g.k === glieder[gi].k && g.sorte === glieder[gi].sorte, `${w2}: über Glied ${gi + 1} steht „${l}“`);
        });
      }
      if (t === 100) {
        // Sortiert: jede Sorte in eigener Bahn — die Höhenbereiche verschiedener Sorten trennen sich.
        const sorten = [...new Set(k.map((x) => x.art))];
        const bereich = (s) => { const e = k.filter((x) => x.art === s); return [Math.min(...e.map((x) => x.y)), Math.max(...e.map((x) => x.y + x.h))]; };
        for (let a = 0; a < sorten.length; a++) for (let b = a + 1; b < sorten.length; b++) {
          const [a0, a1] = bereich(sorten[a]), [b0, b1] = bereich(sorten[b]);
          pruefe(a1 <= b0 + 0.3 || b1 <= a0 + 0.3, `${w2}: die Sorten ${sorten[a]} und ${sorten[b]} liegen nicht in getrennten Bahnen`);
        }
        // Nullpaare: so viele, wie Plus- und Minus-Kacheln einer Sorte zusammen ergeben.
        const sollPaare = sorten.reduce((s, so) => s + Math.min(k.filter((x) => x.art === so && x.vz > 0).length, k.filter((x) => x.art === so && x.vz < 0).length), 0);
        const paare = await page.evaluate(() => document.querySelectorAll('#ka-mount [data-rolle="nullpaar"]').length);
        pruefe(paare === sollPaare, `${w2}: ${paare} Nullpaare markiert statt ${sollPaare}`);
        // Das Ergebnis je Sorte und insgesamt.
        const sorteText = await page.evaluate(() => [...document.querySelectorAll('#ka-mount [data-rolle="sorte"]')].map((e) => ({ art: e.dataset.art, text: e.textContent })));
        for (const s of sorten) {
          const summe = k.filter((x) => x.art === s).reduce((z, x) => z + x.vz, 0);
          const l = sorteText.find((e) => e.art === s);
          const g = l && (l.text === "0" ? { k: 0, sorte: s } : glied(l.text));
          pruefe(!!g && g.k === summe && (summe === 0 || g.sorte === s), `${w2}: an der Bahn ${s} steht „${l && l.text}“, gezählt sind ${summe}`);
        }
        const ergebnis = await page.evaluate(() => { const e = document.querySelector('#ka-bilanz [data-rolle="ergebnis"]'); return e && e.textContent; });
        const vars = /y/.test(term) ? ["x", "y"] : ["x"];
        pruefe(!!ergebnis && P.gleichwertig(ergebnis, term, vars), `${w2}: das Ergebnis „${ergebnis}“ ist nicht gleichwertig mit dem Term`);
        pruefe(!!ergebnis && P.istVereinfacht(ergebnis), `${w2}: das Ergebnis „${ergebnis}“ ist nicht vereinfacht`);
        // Keine Kachel ist dazugekommen oder weggefallen: dieselben Kacheln wie am Anfang.
        pruefe(JSON.stringify(k.map((x) => x.art + x.vz + x.glied)) === JSON.stringify(anfang.map((x) => x.art + x.vz + x.glied)), `${w2}: andere Kacheln als am Anfang`);
      } else {
        const ergebnis = await page.evaluate(() => document.querySelector('#ka-bilanz [data-rolle="ergebnis"]'));
        pruefe(ergebnis === null, `${w2}: das Ergebnis steht schon da, bevor sortiert ist`);
      }
    }
    // Die Größen zueinander: x² ist ein Quadrat mit der Länge des x-Streifens, y ist anders lang, die
    // Einerkachel ist so breit wie ein Streifen.
    if (groesse.x2 && groesse.x) pruefe(Math.abs(groesse.x2.w - groesse.x2.h) < 0.01 && Math.abs(groesse.x2.w - groesse.x.h) < 0.01, `${wo}: das x²-Quadrat passt nicht zum x-Streifen`);
    if (groesse.x && groesse.y) pruefe(Math.abs(groesse.x.h - groesse.y.h) > 5 && Math.abs(groesse.x.w - groesse.y.w) < 0.01, `${wo}: x- und y-Streifen sind nicht zu unterscheiden`);
    if (groesse["1"] && groesse.x) pruefe(Math.abs(groesse["1"].w - groesse["1"].h) < 0.01 && Math.abs(groesse["1"].w - groesse.x.w) < 0.01, `${wo}: die Einerkachel passt nicht zur Streifenbreite`);
  }
  await setzeRegler(page, "ka-t", 0);
}

// ── 2. Produkte ──────────────────────────────────────────────────────────

const PR_ARTEN = { xy: { v2: "y", erg: (a, b) => `${a}x * ${b}y`, vars: ["x", "y"] }, xx: { v2: "x", erg: (a, b) => `${a}x * ${b}x`, vars: ["x"] }, x1: { v2: "1", erg: (a, b) => `${a}x * ${b}`, vars: ["x"] } };
async function produkte(page) {
  const laenge = {};
  for (const art of Object.keys(PR_ARTEN)) {
    await waehle(page, "pr-art", art);
    for (const [a, b] of [[1, 1], [2, 3], [3, 1], [4, 4]]) {
      const ga = await setzeRegler(page, "pr-a", a), gb = await setzeRegler(page, "pr-b", b);
      pruefe(ga === a && gb === b, `Produkte ${art}: Regler auf ${ga}/${gb} statt ${a}/${b}`);
      const wo = `Produkte ${art}, ${a} · ${b}`;
      let groesse = null;
      for (const t of [0, 30, 70, 100]) {
        await setzeRegler(page, "pr-t", t);
        const k = await liesKacheln(page, "pr-mount");
        const w2 = `${wo}, ${t} %`;
        pruefe(k.length === a * b, `${w2}: ${k.length} Kacheln statt ${a * b}`);
        groesse = groesse || { w: k[0].w, h: k[0].h };
        pruefe(k.every((x) => Math.abs(x.w - groesse.w) < 0.01 && Math.abs(x.h - groesse.h) < 0.01), `${w2}: die Kacheln haben nicht alle dieselbe Größe wie zu Anfang`);
        keineUeberdeckung(k, w2);
        if (t === 0) {
          // Zu Anfang füllen die Kacheln das Rechteck a·w × b·h genau aus.
          const x0 = Math.min(...k.map((x) => x.x)), y0 = Math.min(...k.map((x) => x.y));
          const x1 = Math.max(...k.map((x) => x.x + x.w)), y1 = Math.max(...k.map((x) => x.y + x.h));
          pruefe(Math.abs(x1 - x0 - a * groesse.w) < 0.05 && Math.abs(y1 - y0 - b * groesse.h) < 0.05, `${w2}: die Kacheln bilden kein Rechteck aus ${a} × ${b}`);
          const s = await page.evaluate(() => ({
            unten: [...document.querySelectorAll('#pr-mount [data-rolle="seite-unten"]')].map((e) => e.textContent),
            links: [...document.querySelectorAll('#pr-mount [data-rolle="seite-links"]')].map((e) => e.textContent),
            f1: document.querySelector('#pr-mount [data-rolle="faktor-1"]')?.textContent ?? null,
            f2: document.querySelector('#pr-mount [data-rolle="faktor-2"]')?.textContent ?? null,
          }));
          pruefe(s.unten.length === a && s.unten.every((x) => x === "x"), `${w2}: unten stehen ${s.unten.length} Seiten „${s.unten}“ statt ${a}-mal x`);
          pruefe(s.links.length === b && s.links.every((x) => x === PR_ARTEN[art].v2), `${w2}: links stehen „${s.links}“ statt ${b}-mal ${PR_ARTEN[art].v2}`);
          if (a > 1) pruefe(s.f1 !== null && P.gleichwertig(s.f1, `${a}x`, ["x"]), `${w2}: unten steht „${s.f1}“ statt ${a}x`);
          if (b > 1) pruefe(s.f2 !== null && P.gleichwertig(s.f2, art === "x1" ? String(b) : `${b}${PR_ARTEN[art].v2}`, PR_ARTEN[art].vars), `${w2}: links steht „${s.f2}“`);
        }
        if (t === 100) {
          const r = await page.evaluate(() => ({ erg: document.querySelector('#pr-bilanz [data-rolle="ergebnis"]')?.textContent ?? null, anzahl: document.querySelector('#pr-mount [data-rolle="anzahl"]')?.textContent ?? "" }));
          pruefe(r.erg !== null && P.gleichwertig(r.erg, PR_ARTEN[art].erg(a, b), PR_ARTEN[art].vars) && P.istVereinfacht(r.erg), `${w2}: das Ergebnis „${r.erg}“ ist nicht das vereinfachte Produkt`);
          pruefe(new RegExp(`= ${a * b} Kachel`).test(r.anzahl), `${w2}: die Anzahl „${r.anzahl}“ nennt nicht ${a * b} Kacheln`);
        }
      }
      // Die Längen über die Produktarten hinweg: Die x-Länge ist überall dieselbe, y und 1 sind anders.
      laenge[art] = groesse;
    }
  }
  pruefe(Math.abs(laenge.xy.w - laenge.xx.w) < 0.01 && Math.abs(laenge.x1.w - laenge.xx.w) < 0.01 && Math.abs(laenge.xx.w - laenge.xx.h) < 0.01, "Produkte: die x-Länge ist nicht in allen Rechtecken dieselbe");
  pruefe(Math.abs(laenge.xy.h - laenge.xx.h) > 5 && Math.abs(laenge.x1.h - laenge.xy.h) > 5, "Produkte: y und 1 sind nicht von x zu unterscheiden");
  await setzeRegler(page, "pr-t", 0);
}

// ── 3. Klammern ──────────────────────────────────────────────────────────

// Zahl vor x und Zahl allein, durch Einsetzen zurückgerechnet (die Terme sind höchstens linear).
const linear = (term) => { const c0 = P.wert(term, { x: 0 }); return { c1: P.wert(term, { x: 1 }) - c0, c0 }; };
async function klammern(page) {
  const n = await page.evaluate(() => document.getElementById("kl-term").options.length);
  pruefe(n === 5, `Klammern: ${n} Terme statt 5`);
  for (let i = 0; i < n; i++) {
    await waehle(page, "kl-term", String(i));
    const term = await optionText(page, "kl-term");
    const wo = `Klammern „${term}“`;
    const soll = linear(term);
    let breite = null, voll = null;
    for (const t of [0, 25, 45, 55, 75, 100]) {
      await setzeRegler(page, "kl-t", t);
      const k = await liesKacheln(page, "kl-mount");
      const w2 = `${wo}, ${t} %`;
      const klapp = Math.abs(Math.cos((Math.PI * t) / 100));
      breite = breite || k.map((x) => x.w);
      pruefe(JSON.stringify(k.map((x) => x.w)) === JSON.stringify(breite), `${w2}: eine Kachel ist breiter oder schmaler geworden`);
      for (const x of k) {
        const dreht = x.klammer === -1;
        const vzSoll = dreht && t >= 50 ? -x.vzAnfang : x.vzAnfang;
        pruefe(x.vz === vzSoll, `${w2}: eine Kachel ${x.art} zeigt ${x.vz} statt ${vzSoll}`);
      }
      // Die sichtbare Höhe: voll (gemessen zu Anfang), in einer Minusklammer um den Faktor |cos| gestaucht.
      if (t === 0) { voll = {}; for (const x of k) voll[x.art] = voll[x.art] || x.h; }
      for (const x of k) {
        const sollH = voll[x.art] * (x.klammer === -1 ? klapp : 1);
        pruefe(Math.abs(x.h - sollH) < 0.6, `${w2}: eine Kachel ${x.art} ist ${x.h.toFixed(1)} hoch statt ${sollH.toFixed(1)}`);
      }
      keineUeberdeckung(k, w2);
      // Was die Kacheln zusammen bedeuten: außerhalb der Klammer zählt das gezeigte Vorzeichen, in einer
      // Minusklammer vor dem Umdrehen das Gegenteil, danach das gezeigte.
      const wertVon = (art) => k.filter((x) => x.art === art).reduce((s, x) => s + (x.klammer === -1 && t < 50 ? -x.vz : x.vz), 0);
      pruefe(wertVon("x") === soll.c1 && wertVon("1") === soll.c0, `${w2}: die Kacheln ergeben ${wertVon("x")}x + ${wertVon("1")}, der Term ${soll.c1}x + ${soll.c0}`);
      const rahmen = await page.evaluate(() => [...document.querySelectorAll('#kl-mount [data-rolle="klammer"]')].map((e) => Number(getComputedStyle(e).opacity)));
      if (t < 100) pruefe(rahmen.length === 1 && Math.abs(rahmen[0] - (1 - t / 100)) < 0.02, `${w2}: der Klammerrahmen hat die Deckkraft ${rahmen} statt ${1 - t / 100}`);
      else pruefe(rahmen.length === 0, `${w2}: die Klammer ist noch zu sehen`);
      if (t === 100) {
        const b = await page.evaluate(() => ({
          ohne: document.querySelector('#kl-bilanz [data-rolle="ohne-klammer"]')?.textContent ?? null,
          erg: document.querySelector('#kl-bilanz [data-rolle="ergebnis"]')?.textContent ?? null,
        }));
        pruefe(b.ohne !== null && !/[()]/.test(b.ohne) && P.gleichwertig(b.ohne, term, ["x"]), `${w2}: „${b.ohne}“ ist nicht der Term ohne Klammer`);
        // Ohne Klammer heißt: Glied für Glied übernommen, noch nichts zusammengefasst.
        const innen = term.match(/\((.+)\)/)[1];
        const sollGlieder = P.summanden(term.replace(/[+−]\s*\(.+\)/, "")).filter((s) => s !== "").length + P.summanden(innen).length;
        pruefe(b.ohne !== null && P.summanden(b.ohne).length === sollGlieder, `${w2}: „${b.ohne}“ hat nicht ${sollGlieder} Glieder`);
        pruefe(b.erg !== null && P.gleichwertig(b.erg, term, ["x"]) && P.istVereinfacht(b.erg), `${w2}: das Ergebnis „${b.erg}“ stimmt nicht`);
        // Die Kacheln selbst zeigen jetzt genau den Term ohne Klammer.
        const lo = b.ohne && linear(b.ohne);
        pruefe(!!lo && k.filter((x) => x.art === "x").reduce((s, x) => s + x.vz, 0) === lo.c1, `${w2}: die x-Kacheln passen nicht zu „${b.ohne}“`);
      }
    }
  }
  await setzeRegler(page, "kl-t", 0);
}

// ── 4. Der Rechenweg ─────────────────────────────────────────────────────

const SW_VARS = ["x", "y", "a", "b"];
const anzahl = (s, z) => (s.match(new RegExp(z.replace(/[()]/g, "\\$&"), "g")) || []).length;
const sortiert = (t) => P.summanden(t).map((g) => g.replace(/^\+/, "")).sort().join("|");
async function schritte(page) {
  const n = await page.evaluate(() => document.getElementById("sw-term").options.length);
  for (let i = 0; i < n; i++) {
    await waehle(page, "sw-term", String(i));
    const start = await optionText(page, "sw-term");
    const wo = `Rechenweg „${start}“`;
    // Der Regler wird auf die Zahl der Schritte begrenzt und zeigt das an.
    const gesetzt = await setzeRegler(page, "sw-schritt", 4);
    const alle = await page.evaluate(() => [...document.querySelectorAll('#sw-mount [data-rolle="schritt"]')].map((e) => ({ art: e.dataset.art, term: e.dataset.term, text: e.innerText })));
    pruefe(gesetzt === alle.length - 1, `${wo}: der Regler steht auf ${gesetzt}, es gibt ${alle.length - 1} Schritte`);
    pruefe(alle[0].art === "start" && normal(alle[0].term) === normal(start), `${wo}: der Rechenweg beginnt nicht mit dem gewählten Term`);
    for (let j = 1; j < alle.length; j++) {
      const s = alle[j], vor = alle[j - 1];
      const w2 = `${wo}, Schritt ${j} (${s.art})`;
      pruefe(P.gleichwertig(s.term, start, SW_VARS), `${w2}: „${s.term}“ ist nicht gleichwertig mit dem Anfang`);
      pruefe(s.text.includes(s.term), `${w2}: angezeigt wird etwas anderes als „${s.term}“`);
      if (s.art === "produkt") pruefe(anzahl(s.term, "·") < anzahl(vor.term, "·"), `${w2}: kein Malpunkt ist verschwunden`);
      else if (s.art === "klammer") pruefe(anzahl(s.term, "(") < anzahl(vor.term, "("), `${w2}: keine Klammer ist verschwunden`);
      else if (s.art === "ordnen") pruefe(sortiert(s.term) === sortiert(vor.term), `${w2}: beim Ordnen haben sich Glieder verändert`);
      else if (s.art === "zusammenfassen") pruefe(j === alle.length - 1 && P.istVereinfacht(s.term), `${w2}: „${s.term}“ ist nicht der vereinfachte Schluss`);
      else pruefe(false, `${w2}: unbekannte Schrittart`);
      // Die feste Reihenfolge: Produkte, Klammern, Ordnen, Zusammenfassen.
      const rang = { produkt: 0, klammer: 1, ordnen: 2, zusammenfassen: 3 };
      if (j > 1) pruefe(rang[s.art] > rang[vor.art], `${w2}: der Schritt steht nicht in der festen Reihenfolge`);
    }
    // Die Probe am Ende: hier selbst gerechnet.
    const text = await page.evaluate(() => document.getElementById("sw-text").innerText);
    const m = text.match(/Probe mit (.+?): Der Anfang ergibt (−?\d+), das Ergebnis (−?\d+)/);
    pruefe(!!m && /Fertig/.test(text), `${wo}: am Ende keine Probe — „${text}“`);
    if (m) {
      const bel = Object.fromEntries(m[1].split(", ").map((p) => p.split(" = ")).map(([v, z]) => [v, Number(z.replace("−", "-"))]));
      const ende = alle[alle.length - 1].term;
      const wa = P.wert(start, bel), we = P.wert(ende, bel);
      pruefe(Number(m[2].replace("−", "-")) === wa && Number(m[3].replace("−", "-")) === we && wa === we, `${wo}: die Probe stimmt nicht (nachgerechnet ${wa} und ${we})`);
    }
    // Zwischendrin ist nichts „fertig“.
    await setzeRegler(page, "sw-schritt", 1);
    const zwischen = await page.evaluate(() => document.getElementById("sw-text").innerText);
    pruefe(!/Fertig/.test(zwischen), `${wo}: nach dem ersten Schritt heißt es schon „fertig“`);
  }
}

// ── Kontrollfragen ────────────────────────────────────────────────────────

// Gleichartig: dieselben Variablen mit denselben Hochzahlen, die Zahl davor egal.
const variablenTeil = (g) => { const t = P.normiere(g).replace(/^[+-]?\d*/, ""); const v = {}; for (const m of t.matchAll(/([a-z])(?:\^(\d+))?/g)) v[m[1]] = (v[m[1]] || 0) + Number(m[2] || 1); return Object.keys(v).sort().map((k) => k + v[k]).join(""); };
async function quizze(page) {
  const ids = await page.evaluate(() => [...document.querySelectorAll(".quiz")].map((e) => e.id));
  pruefe(ids.length === 4, `Kontrollfragen: ${ids.length} statt 4`);
  for (const sec of ["sec-gleichartig", "sec-produkte", "sec-klammern", "sec-schritte"]) {
    pruefe(await page.evaluate((s) => document.querySelectorAll(`#${s} .quiz`).length === 1, sec), `Kontrollfragen: ${sec} hat nicht genau eine`);
  }
  const RICHTIG = {
    "quiz-gleichartig": (o) => { const [a, b] = o.split(" und "); return variablenTeil(a) === variablenTeil(b); },
    "quiz-produkte": (o) => P.gleichwertig(o, "2x * 3x", ["x"]),
    "quiz-klammern": (o) => P.gleichwertig(o, "7a − (2a − 4)", ["a"]),
    // Lenas Fehler: Sie hat 3x + 2 zuerst gerechnet. Richtig ist die Antwort, die Punkt vor Strich
    // nennt und auf 5x kommt.
    "quiz-schritte": (o) => /Punkt vor Strich/.test(o) && /5x/.test(o) && P.gleichwertig("3x + 2 * x", "5x", ["x"]),
  };
  const stellen = [];
  for (const id of ids) {
    const optionen = await page.evaluate((q) => [...document.querySelectorAll(`#${q} .quiz-opt`)].map((b) => b.textContent.trim()), id);
    pruefe(optionen.length === 4 && new Set(optionen).size === 4, `Quiz ${id}: keine vier verschiedenen Antworten`);
    let richtige = 0;
    for (let i = 0; i < optionen.length; i++) {
      await page.locator(`#${id} .quiz-opt`).nth(i).click();
      const r = await page.evaluate((q) => { const f = document.querySelector(`#${q} .quiz-feedback`); return { ok: f.classList.contains("ok"), text: f.textContent }; }, id);
      if (r.ok) { richtige++; stellen.push(i); }
      pruefe(r.ok === RICHTIG[id](optionen[i]), `Quiz ${id}: „${optionen[i]}“ gilt als ${r.ok ? "richtig" : "falsch"} — nachgerechnet ist es umgekehrt`);
      pruefe(r.text.length > 80, `Quiz ${id}: die Erklärung ist nur ${r.text.length} Zeichen lang`);
    }
    pruefe(richtige === 1, `Quiz ${id}: ${richtige} richtige Antworten`);
  }
  pruefe(new Set(stellen).size >= 3, `Kontrollfragen: die richtige Antwort steht nur an ${new Set(stellen).size} verschiedenen Stellen`);
}

// ── Die Übungsaufgaben ────────────────────────────────────────────────────

// Einen Term aus Zahlen bauen, in UMGEKEHRTER Reihenfolge (Zahl zuerst): Die Seite muss jede
// Reihenfolge der Glieder anerkennen.
function bau(glieder) {
  const g = glieder.filter(([k]) => Math.abs(k) > 1e-9).reverse();
  if (!g.length) return "0";
  return g.map(([k, v], i) => {
    const b = Math.abs(k);
    const kern = v === "" ? String(b) : (b === 1 ? "" : String(b)) + v;
    return i === 0 ? (k < 0 ? "−" : "") + kern : (k < 0 ? " − " : " + ") + kern;
  }).join("");
}
// Koeffizienten durch Einsetzen: quadratisch in x (c2, c1, c0) oder linear in x und y.
const quad = (t) => { const f = (x) => P.wert(t, { x }); const c0 = f(0); return { c2: (f(1) + f(-1)) / 2 - c0, c1: (f(1) - f(-1)) / 2, c0 }; };
const linXY = (t) => { const f = (x, y) => P.wert(t, { x, y }); const c0 = f(0, 0); return { cx: f(1, 0) - c0, cy: f(0, 1) - c0, c0 }; };
const linA = (t) => { const c0 = P.wert(t, { a: 0 }); return { c1: P.wert(t, { a: 1 }) - c0, c0 }; };
// Kein Faktor direkt vor einer Klammer mit einer Summe darin — das wäre das Distributivgesetz aus
// Thema 3. Ein Wort vor einer Klammer („vertauschen (Kommutativgesetz)“) ist kein Faktor.
const FAKTOR_VOR_KLAMMER = /(?:^|[^a-zäöüß])[\da-z)]\s*(?:·\s*)?\((?=[^()]*[+−-])/;
const ohneDistributiv = (frage, name) => pruefe(!FAKTOR_VOR_KLAMMER.test(frage.replace(/Schreibweise:.*$/, "")), `${name}: die Aufgabe verlangt schon das Distributivgesetz — „${frage}“`);
const termAus = (frage, vor) => { const m = frage.match(new RegExp(vor + " (.+?) Schreibweise:")); return m && m[1]; };
const ergebnisPruefen = (name, soll, vars) => (f2, r) => {
  const m = r.match(/(?:Ergebnis|Zusammenfassen):? (?:U = )?(.+?)(?: \(in cm\))?$/m);
  pruefe(!!m && P.gleichwertig(m[1].replace(/^Zusammenfassen: /, ""), soll, vars), `${name}: die Musterlösung nennt kein gleichwertiges Ergebnis — „${f2}“`);
};

// Die Schranken für `mindestensVerschieden` sind gemessen (tests/werkzeug-streuung.js, 20 Züge):
// B1 n ≈ 1104, B2 n ≈ 209, B3 n ≈ 337, B4 n ≈ 246, B5 n ≈ 618, B6 n ≈ 286, B7 n ≈ 205, B8 n ≈ 6567.
const SCHRANKE = [17, 14, 15, 15, 16, 15, 14, 17];
const RUNDEN = 20;

// Welche Fassungen gezogen wurden — eine Fassung, die die Kollisionsprüfung jedes Mal aussiebt, fiele
// sonst lautlos aus dem Vorrat.
const FASSUNGEN = { B3: new Set(), B2: new Set() };
async function aufgaben(page) {
  await pruefeAufgabe(page, bericht, {
    nr: 1, name: "B1 Zusammenfassen", runden: RUNDEN, mindestensVerschieden: SCHRANKE[0],
    deute: (frage) => {
      const term = termAus(frage, "Fasse zusammen:");
      if (!term || /[y²]/.test(term)) return null;
      ohneDistributiv(frage, "B1");
      const { c1, c0 } = linear(term);
      const g = P.summanden(term);
      // Das abgezogene x-Glied (−x heißt −1) und die abgezogene Zahl, je als Betrag.
      const cx = -Number(g.find((s) => /^-\d*x$/.test(s)).replace("x", "").replace(/^-$/, "-1"));
      const eMinus = -Number(g.find((s) => /^-\d+$/.test(s)));
      return {
        richtig: bau([[c1, "x"], [c0, ""]]),
        falsch: [
          [bau([[c1 + c0, "x"]]), "nicht gleichartig"],
          [bau([[c1 + 2 * cx, "x"], [c0, ""]]), "steht ein Minus"],
          [bau([[c1, "x"], [c0 + 2 * eMinus, ""]]), "steht ein Minus"],
        ],
        pruefe: ergebnisPruefen("B1", term, ["x"]),
      };
    },
  });

  await pruefeAufgabe(page, bericht, {
    nr: 2, name: "B2 Produkt", runden: RUNDEN, mindestensVerschieden: SCHRANKE[1],
    deute: (frage) => {
      const term = termAus(frage, "Vereinfache das Produkt:");
      if (!term) return null;
      const vz = term.startsWith("−") ? -1 : 1;
      FASSUNGEN.B2.add(vz);
      const zahlen = (term.match(/\d+/g) || []).map(Number);
      if (zahlen.length !== 2) return null;
      const [a, b] = zahlen;
      const vars = (term.match(/[a-z]/g) || []).sort().join("");
      const v = vars === "xy" ? "xy" : vars === "xx" ? "x^2" : "x";
      const V = vars === "xy" ? ["x", "y"] : ["x"];
      pruefe(P.gleichwertig(bau([[vz * a * b, v]]), term, V), `B2: die Prüfung selbst hat sich verrechnet — „${frage}“`);
      const falsch = [[bau([[vz * (a + b), v]]), "nicht addiert"]];
      if (v === "x^2") { falsch.push([bau([[vz * a * b, "x"]]), "x · x ist x²"]); falsch.push([bau([[2 * vz * a * b, "x"]]), "nicht 2x"]); }
      if (vz < 0) falsch.push([bau([[a * b, v]]), "Vorzeichen"]);
      // Die Lösung mit vertauschten Variablen eingetippt: yx ist dasselbe wie xy.
      return { richtig: bau([[vz * a * b, v === "xy" ? "yx" : v]]), falsch, pruefe: (f2, r) => pruefe(/Kommutativgesetz/.test(r), `B2: die Musterlösung nennt das Gesetz nicht — „${f2}“`) };
    },
  });

  await pruefeAufgabe(page, bericht, {
    nr: 3, name: "B3 Zwei Sorten", runden: RUNDEN, mindestensVerschieden: SCHRANKE[2],
    deute: (frage) => {
      const term = termAus(frage, "Fasse zusammen:");
      if (!term) return null;
      const g = P.summanden(term);
      FASSUNGEN.B3.add(/y/.test(term) ? "y" : "q");
      if (/y/.test(term)) {
        const { cx, cy, c0 } = linXY(term);
        const d = -Number(g.find((s) => /^-\d*y$/.test(s)).replace("y", "").replace(/^-$/, "-1"));
        return {
          richtig: bau([[cx, "x"], [cy, "y"], [c0, ""]]),
          falsch: [
            [bau([[cx + cy, "xy"], [c0, ""]]), "nicht gleichartig"],
            [bau([[cx, "x"], [cy + 2 * d, "y"], [c0, ""]]), "steht ein Minus"],
            [bau([[cx + cy, "x"], [c0, ""]]), "getrennt"],
          ],
          pruefe: ergebnisPruefen("B3", term, ["x", "y"]),
        };
      }
      const { c2, c1 } = quad(term);
      const c = -Number(g.find((s) => /^-\d*x\^2$/.test(s)).replace("x^2", "").replace(/^-$/, "-1"));
      return {
        richtig: bau([[c2, "x^2"], [c1, "x"]]),
        falsch: [
          [bau([[c2 + c1, "x^2"]]), "nicht gleichartig"],
          [bau([[c2 + c1, "x"]]), "nicht gleichartig"],
          [bau([[c2 + 2 * c, "x^2"], [c1, "x"]]), "steht ein Minus"],
        ],
        pruefe: ergebnisPruefen("B3", term, ["x"]),
      };
    },
  });

  await pruefeAufgabe(page, bericht, {
    nr: 4, name: "B4 Minusklammer", runden: RUNDEN, mindestensVerschieden: SCHRANKE[3],
    deute: (frage) => {
      const term = termAus(frage, "Löse die Klammer auf und fasse zusammen:");
      if (!term) return null;
      ohneDistributiv(frage, "B4");
      const innen = term.match(/− \((.+)\)$/);
      if (!innen) return null;
      const [s1, s2] = P.summanden(innen[1]);
      const { c1, c0 } = linear(term);
      // Nur das erste Vorzeichen umgedreht: richtig + 2 · s2. Die Klammer wie eine Plusklammer: richtig + 2 · (s1 + s2).
      const plus = (t, s, f) => { const l = linear(`${s}`); return [t.c1 + f * l.c1, t.c0 + f * l.c0]; };
      const [n1, n0] = plus({ c1, c0 }, s2, 2);
      const l1 = linear(s1), l2 = linear(s2);
      return {
        richtig: bau([[c1, "x"], [c0, ""]]),
        falsch: [[bau([[n1, "x"], [n0, ""]]), "nicht nur das erste"], [bau([[c1 + 2 * (l1.c1 + l2.c1), "x"], [c0 + 2 * (l1.c0 + l2.c0), ""]]), "auch das erste Glied"]],
        pruefe: (f2, r) => pruefe(/Probe mit x = 2: (−?\d+) und (−?\d+) ✓/.test(r) && (() => { const m = r.match(/Probe mit x = 2: (−?\d+) und (−?\d+)/); return Number(m[1].replace("−", "-")) === P.wert(term, { x: 2 }) && m[1] === m[2]; })(), `B4: die Probe der Musterlösung stimmt nicht — „${f2}“`),
      };
    },
  });

  await pruefeAufgabe(page, bericht, {
    nr: 5, name: "B5 Plus- und Minusklammern", runden: RUNDEN, mindestensVerschieden: SCHRANKE[4],
    deute: (frage) => {
      const term = termAus(frage, "Löse die Klammern auf und fasse zusammen:");
      if (!term) return null;
      ohneDistributiv(frage, "B5");
      const m = term.match(/^\((.+?)\) − \((.+?)\) \+ \((.+?)\)$/);
      if (!m) return null;
      const s = linXY(term), k2 = linXY(m[2]), k3 = linXY(m[3]);
      const yTeil2 = k2.cy;   // das y-Glied der Minusklammer, mit Vorzeichen
      return {
        richtig: bau([[s.cx, "x"], [s.cy, "y"]]),
        falsch: [
          [bau([[s.cx, "x"], [s.cy + 2 * yTeil2, "y"]]), "auch das von"],
          [bau([[s.cx + 2 * k2.cx, "x"], [s.cy + 2 * k2.cy, "y"]]), "zweiten Klammer"],
          [bau([[s.cx - 2 * k3.cx, "x"], [s.cy - 2 * k3.cy, "y"]]), "dritten Klammer"],
        ],
        pruefe: ergebnisPruefen("B5", term, ["x", "y"]),
      };
    },
  });

  await pruefeAufgabe(page, bericht, {
    nr: 6, name: "B6 Produkte und Summen", runden: RUNDEN, mindestensVerschieden: SCHRANKE[5],
    deute: (frage) => {
      const term = termAus(frage, "Vereinfache:");
      const m = term && term.match(/^(\d+)x · (\d+)x \+ (\d*)x² − (\d+)x · (\d+)$/);
      if (!m) return null;
      const [a, b, c, d, e] = [m[1], m[2], m[3] || "1", m[4], m[5]].map(Number);
      const q = quad(term);
      pruefe(q.c2 === a * b + c && q.c1 === -d * e && q.c0 === 0, `B6: die Prüfung liest den Term anders — „${frage}“`);
      return {
        richtig: bau([[q.c2, "x^2"], [q.c1, "x"]]),
        falsch: [
          [bau([[c, "x^2"], [a * b - d * e, "x"]]), "x · x = x²"],
          [bau([[c, "x^2"], [2 * a * b - d * e, "x"]]), "nicht 2x"],
          [bau([[a * b + c, "x^2"], [-(d + e), "x"]]), "werden multipliziert"],
          [bau([[a + b + c, "x^2"], [-d * e, "x"]]), "werden multipliziert"],
        ],
        pruefe: ergebnisPruefen("B6", term, ["x"]),
      };
    },
  });

  await pruefeAufgabe(page, bericht, {
    nr: 7, name: "B7 Umfang", runden: RUNDEN, mindestensVerschieden: SCHRANKE[6],
    liesRoh: (page2, box) => page2.evaluate((sel) => {
      const svg = document.querySelector(`${sel} .aufgabe-prompt svg[data-figur]`);
      return svg && { art: svg.dataset.figur, seiten: [...svg.querySelectorAll('[data-rolle="seite"]')].map((t) => t.textContent), ecken: svg.querySelector('[data-rolle="figur"]').tagName };
    }, box),
    deute: (frage, roh) => {
      if (!roh) return null;
      const name = { rechteck: "des Rechtecks", gleichschenklig: "des gleichschenkligen Dreiecks", dreieck: "des Dreiecks" }[roh.art];
      pruefe(frage.includes(`Die Seitenlängen ${name}`), `B7: Text und Zeichnung nennen verschiedene Figuren (${roh.art}) — „${frage}“`);
      const s = roh.seiten;
      let alle, teil = null, hinweis = null;
      if (roh.art === "rechteck") {
        pruefe(s.length === 2 && roh.ecken === "rect", `B7: ein Rechteck mit ${s.length} Beschriftungen`);
        alle = [s[0], s[1], s[0], s[1]]; teil = [s[0], s[1]]; hinweis = "vier Seiten";
      } else if (roh.art === "gleichschenklig") {
        pruefe(s.length === 3 && s[1] === s[2], `B7: die Schenkel sind verschieden beschriftet (${s})`);
        alle = s; teil = [s[0], s[1]]; hinweis = "drei Seiten";
      } else {
        pruefe(s.length === 3 && new Set(s).size === 3, `B7: das Dreieck hat nicht drei verschiedene Seiten (${s})`);
        alle = s;
      }
      const summe = (l) => { const k = l.map(linA); return [k.reduce((z, x) => z + x.c1, 0), k.reduce((z, x) => z + x.c0, 0)]; };
      const [u1, u0] = summe(alle);
      const falsch = [];
      if (teil) { const [t1, t0] = summe(teil); falsch.push([bau([[t1, "a"], [t0, ""]]), hinweis]); }
      // Ein Minus in einer Seite als Plus gelesen.
      if (alle.some((x) => /−/.test(x))) { const [m1, m0] = summe(alle.map((x) => x.replace("−", "+"))); falsch.push([bau([[m1, "a"], [m0, ""]]), "gehört das Minus dazu"]); }
      return { richtig: bau([[u1, "a"], [u0, ""]]), falsch, pruefe: ergebnisPruefen("B7", alle.map((x) => `(${x})`).join(" + "), ["a"]) };
    },
  });

  await pruefeAufgabe(page, bericht, {
    nr: 8, name: "B8 Fehler finden", runden: RUNDEN, mindestensVerschieden: SCHRANKE[7],
    deute: (frage) => {
      const m = frage.match(/Tim vereinfacht (.+?) so: \(1\) = (.+?) \(2\) = (.+?) \(3\) = (.+?) \(4\) = (.+?) In welchem/);
      if (!m) return null;
      ohneDistributiv(frage, "B8");
      const start = m[1], st = [m[2], m[3], m[4], m[5]];
      const kette = [start, ...st];
      const k = st.findIndex((s, i) => !P.gleichwertig(s, kette[i], ["x"])) + 1;
      pruefe(k >= 1, `B8: Tims Rechnung hat keinen Fehler — „${frage}“`);
      // Nach dem Fehler rechnet Tim richtig weiter.
      for (let i = k; i < 4; i++) pruefe(P.gleichwertig(st[i], st[i - 1], ["x"]), `B8: nach dem Fehler in Schritt ${k} ist auch Schritt ${i + 1} falsch — „${frage}”`);
      pruefe(P.istVereinfacht(st[3]), `B8: Tims Schluss ist nicht vereinfacht — „${frage}“`);
      const { c1, c0 } = linear(start);
      const falschFelder = [];
      if (k < 4) falschFelder.push([0, k + 1, "weitergerechnet"]);
      if (k > 1) falschFelder.push([0, k - 1, "ist richtig"]);
      falschFelder.push([1, st[3], "Tims Ergebnis"]);
      return { felder: [k, bau([[c1, "x"], [c0, ""]])], falschFelder, pruefe: (f2, r) => pruefe(r.includes(`Tims Fehler steckt in Schritt ${k}`), `B8: die Musterlösung nennt nicht Schritt ${k} — „${f2}“`) };
    },
  });

  // Je zwei Fassungen zu gleichen Teilen: In 20 Zügen fehlt eine nur mit Wahrscheinlichkeit 2 · 2⁻²⁰.
  pruefe(FASSUNGEN.B3.has("q") && FASSUNGEN.B3.has("y"), `B3: gezogen wurden nur die Fassungen ${[...FASSUNGEN.B3]} — eine fällt aus dem Vorrat`);
  pruefe(FASSUNGEN.B2.has(1) && FASSUNGEN.B2.has(-1), "B2: nur Produkte mit einem Vorzeichen gezogen — die anderen fallen aus dem Vorrat");
}

// ── Gerüst ────────────────────────────────────────────────────────────────

async function geruest(page) {
  const folge = await page.evaluate(() => [...document.querySelectorAll("main section[id]")].map((s) => s.id));
  const soll = ["sec-gleichartig", "sec-produkte", "sec-klammern", "sec-schritte", "sec-vernetzung", "sec-formelsammlung", "sec-uebungen", "sec-selbsteinschaetzung"];
  pruefe(JSON.stringify(folge) === JSON.stringify(soll), `Gerüst: Abschnitte ${folge.join(", ")} statt ${soll.join(", ")}`);
  // Kein Vorgriff: Vor einer Klammer steht in den Abschnitten nur ein Vorzeichen; Ausmultiplizieren,
  // Ausklammern und binomische Formeln kommen erst später.
  for (const id of soll.slice(0, 4)) {
    const t = await page.evaluate((i) => { const e = document.getElementById(i).cloneNode(true); e.querySelectorAll(".uebung-sprung, .quiz").forEach((x) => x.remove()); return e.innerText; }, id);
    pruefe(!/ausmultipl|ausklammer|Distributiv|binomisch/i.test(t), `Gerüst: ${id} greift auf Thema 3 oder später vor`);
    const vor = t.match(FAKTOR_VOR_KLAMMER);
    pruefe(!vor, `Gerüst: ${id} hat einen Faktor vor einer Klammer — das ist das Distributivgesetz („${vor && t.slice(Math.max(0, vor.index - 15), vor.index + 25)}“)`);
  }
  const verweis = await page.evaluate(() => { const a = document.querySelector("#sec-formelsammlung a[download]"); return a && a.getAttribute("href"); });
  pruefe(verweis === "formelsammlung.pdf", `Formelsammlung: Verweis auf „${verweis}“`);
  const pdf = path.join(WURZEL, "mathematik/klasse-8/terme/formelsammlung.pdf");
  pruefe(fs.existsSync(pdf) && fs.readFileSync(pdf).subarray(0, 5).toString("latin1") === "%PDF-", "Formelsammlung: formelsammlung.pdf fehlt oder ist kein PDF");
  const links = await page.evaluate(() => [...document.querySelectorAll("main a[href]")].map((a) => a.getAttribute("href")).filter((h) => !h.startsWith("#") && !h.startsWith("http")));
  for (const href of new Set(links)) {
    const ziel = new URL(href.split("#")[0], "http://localhost/mathematik/klasse-8/terme/").pathname;
    const antwort = await page.request.get("http://localhost:" + (process.env.UPLANT_PORT || "8936") + ziel);
    pruefe(antwort.ok(), `Gerüst: der Verweis „${href}“ führt ins Leere`);
    const anker = href.split("#")[1];
    if (anker && antwort.ok() && /\.html$/.test(ziel)) pruefe((await antwort.text()).includes(`id="${anker}"`), `Gerüst: die Sprungmarke „${anker}“ fehlt in ${ziel}`);
  }
  const menue = fs.readFileSync(path.join(WURZEL, "mathematik/klasse-8/terme/index.html"), "utf8");
  const karte = menue.match(/<a class="menu-card"[^>]*href="terme-vereinfachen\.html"[^>]*>\s*<h2>([^<]*)<\/h2>/);
  pruefe(!!karte && /data-section="klasse-8"/.test(karte[0]) && /\shidden\b/.test(karte[0]) && karte[1] === "2. Terme vereinfachen", "Gerüst: die Menükarte fehlt oder ist unvollständig");
  const proStufe = await page.evaluate(() => [...document.querySelectorAll("#exercises-mount .schwierigkeit-tabs button")].map((t) => { t.click(); return document.querySelectorAll("#exercises-mount .schwierigkeit-tab-panel .aufgabe-box").length; }));
  pruefe(JSON.stringify(proStufe) === "[2,2,2,2]", `Gerüst: die Stufen haben ${proStufe.join("/")} Aufgaben statt 2/2/2/2`);
}

// Ein Teil, der abbricht (etwa weil ein Aufgabengenerator der Seite wirft und die Aufgabe nie
// erscheint), ist ein Fehler — gemeldet wird er trotzdem, und die übrigen Teile laufen weiter.
async function teil(name, fn, page) {
  if (!will(name)) return;
  try {
    await fn(page);
  } catch (e) {
    pruefe(false, `${name}: Abbruch — ${String(e && e.message).split("\n")[0]}`);
  }
}

(async () => {
  const browser = await starteBrowser();
  for (const dunkel of [false, true]) {
    const wo = dunkel ? "dunkel" : "hell";
    const page = await neueSeite(browser, { dunkel });
    await oeffne(page, SEITE);
    if (!dunkel) {
      await teil("geruest", geruest, page);
      await teil("kacheln", kacheln, page);
      await teil("produkte", produkte, page);
      await teil("klammern", klammern, page);
      await teil("schritte", schritte, page);
      await teil("quizze", quizze, page);
      await teil("aufgaben", aufgaben, page);
    } else if (will("dunkel")) {
      await waehle(page, "ka-term", "4");
      await setzeRegler(page, "ka-t", 100);
      await waehle(page, "kl-term", "1");
      await setzeRegler(page, "pr-t", 100);
      await pruefeKontrast(page, bericht, "dunkel");
      // Die Kacheln bestehen nur aus farbigen Rändern — jede Sorte und die Minus-Kacheln müssen auf
      // dunklem Grund sichtbar sein.
      await pruefeStrichKontrast(page, bericht, "dunkel, Kacheln", "#ka-mount rect.tm-kachel, #kl-mount rect.tm-kachel, #pr-mount rect.tm-kachel");
      await waehle(page, "ka-term", "2");
      await pruefeStrichKontrast(page, bericht, "dunkel, Kacheln mit y", "#ka-mount rect.tm-kachel");
    }
    await pruefeNotation(page, bericht, wo);
    for (const s of page.stoerungen) pruefe(false, `${wo}: ${s}`);
    await page.close();
  }
  await browser.close();
  bericht.abschluss();
})();
