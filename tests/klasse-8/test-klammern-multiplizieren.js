// Fachliche Prüfung: Klasse 8, Terme, Thema 4 „Terme mit Klammern multiplizieren“.
//
// Nachgerechnet wird mit dem eigenen Termauswerter (tests/lib/polynom.js), nicht mit dem der Seite:
//
//   1. Das RECHTECK: vier Blöcke (x · mx, x · a, b · mx, b · a) aus Kacheln passender Größe; zu Anfang
//      füllen sie das Rechteck genau aus, beim Auseinanderziehen rückt jeder Block starr in seine
//      Richtung, und die vier Produkte und das Ergebnis stimmen.
//   2. JEDES GLIED MIT JEDEM: genau n1 · n2 Produkte, jedes aus einem Glied jeder Klammer; jeder Schritt
//      gleichwertig, am Ende vereinfacht; die Probe stimmt.
//   3. MEHR FAKTOREN: jeder Schritt gleichwertig mit dem Anfang, am Ende ohne Klammern und vereinfacht.
//   4. Die FLÄCHENÄNDERUNG: Quadrat und Rechteck maßstäblich, der Regler auf x > b begrenzt, Terme und
//      Zahlen der Bilanz nachgerechnet, „größer/kleiner“ passend zum Vorzeichen.
//   5. Die AUFGABEN: jede der acht über viele Runden, aus dem Aufgabentext (bei der Lochplatte aus der
//      Zeichnung) nachgerechnet, mit den vorgesehenen Fehlern.

"use strict";

const { neuerBericht } = require("../lib/pruefen");
const { starteBrowser, neueSeite, oeffne, setzeRegler } = require("../lib/seite");
const { pruefeNotation } = require("../lib/notation");
const { pruefeKontrast, pruefeStrichKontrast, pruefeTextAufFlaeche } = require("../lib/kontrast");
const { pruefeAufgabe } = require("../lib/aufgaben");
const P = require("../lib/polynom");
const fs = require("fs");
const path = require("path");

const bericht = neuerBericht();
const { pruefe } = bericht;
const SEITE = "/mathematik/klasse-8/terme/klammern-multiplizieren.html";
const WURZEL = path.resolve(__dirname, "..", "..");
const NUR = (process.env.UPLANT_NUR || "").split(",").map((t) => t.trim()).filter(Boolean);
const will = (teil) => NUR.length === 0 || NUR.includes(teil);

const waehle = (page, id, wert) => page.evaluate(([i, w]) => {
  const e = document.getElementById(i);
  e.value = w;
  e.dispatchEvent(new Event("input", { bubbles: true }));
}, [id, wert]);
const optionText = (page, id) => page.evaluate((i) => { const s = document.getElementById(i); return s.options[s.selectedIndex].text; }, id);
const normal = (s) => String(s).replace(/\s+/g, " ").trim();
const ggT = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
const zahl = (s) => Number(String(s).replace("−", "-"));
const ueberdeckt = (a, b) => Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x) > 0.3 && Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y) > 0.3;
function keineUeberdeckung(rects, wo) {
  for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
    if (ueberdeckt(rects[i], rects[j])) { pruefe(false, `${wo}: Kachel ${i} und ${j} überdecken sich`); return; }
  }
  pruefe(true, "");
}
const liesKacheln = (page, mount) => page.evaluate((m) => [...document.querySelectorAll(`#${m} g[data-rolle="kachel"]`)].map((g) => {
  const r = g.querySelector("rect");
  return { art: g.dataset.art, teil: g.dataset.teil, zeile: g.dataset.zeile, rest: r.classList.contains("tm-rest"), x: +r.getAttribute("x"), y: +r.getAttribute("y"), w: +r.getAttribute("width"), h: +r.getAttribute("height") };
}), mount);
const texte = (page, mount) => page.evaluate((m) => Object.fromEntries([...document.querySelectorAll(`#${m} [data-rolle]`)].filter((e) => e.tagName === "text").map((e) => [e.dataset.rolle, e.textContent])), mount);

// ── 1. Summe mal Summe am Rechteck ───────────────────────────────────────

async function rechteck(page) {
  let mass = null;
  for (const [m, a, b] of [[1, 1, 1], [1, 3, 2], [2, 4, 4], [2, 1, 3]]) {
    await setzeRegler(page, "re-m", m); await setzeRegler(page, "re-a", a); await setzeRegler(page, "re-b", b);
    const wo = `Rechteck (${m}x + ${a}) · (x + ${b})`;
    let anfang = null;
    for (const t of [0, 40, 100]) {
      await setzeRegler(page, "re-t", t);
      const k = await liesKacheln(page, "re-mount");
      const w2 = `${wo}, ${t} %`;
      const teil = (n) => k.filter((z) => z.teil === n);
      // Die vier Blöcke: Anzahl und Sorte.
      const soll = { xx: [m, "x2"], x1: [a, "x"], "1x": [m * b, "x"], 11: [a * b, "1"] };
      for (const [n, [anz, art]] of Object.entries(soll)) pruefe(teil(n).length === anz && teil(n).every((z) => z.art === art), `${w2}: Block ${n} hat ${teil(n).length} Kacheln statt ${anz} × ${art}`);
      // Größen: x-Länge und Einer, über alle Blöcke dieselben.
      const lx = teil("xx")[0].w, u = teil("11")[0].w;
      mass = mass || { lx, u };
      const passt = (z, w, h) => Math.abs(z.w - w) < 0.01 && Math.abs(z.h - h) < 0.01;
      pruefe(teil("xx").every((z) => passt(z, mass.lx, mass.lx)) && teil("x1").every((z) => passt(z, mass.u, mass.lx)) && teil("1x").every((z) => passt(z, mass.lx, mass.u)) && teil("11").every((z) => passt(z, mass.u, mass.u)), `${w2}: eine Kachel hat die falsche Größe`);
      keineUeberdeckung(k, w2);
      if (t === 0) {
        anfang = k;
        const x0 = Math.min(...k.map((z) => z.x)), y0 = Math.min(...k.map((z) => z.y));
        const x1 = Math.max(...k.map((z) => z.x + z.w)), y1 = Math.max(...k.map((z) => z.y + z.h));
        const fl = k.reduce((s, z) => s + z.w * z.h, 0);
        pruefe(Math.abs(x1 - x0 - (m * lx + a * u)) < 0.05 && Math.abs(y1 - y0 - (lx + b * u)) < 0.05 && Math.abs(fl - (x1 - x0) * (y1 - y0)) < 0.5, `${w2}: die Kacheln füllen das Rechteck nicht genau aus`);
        const s = await texte(page, "re-mount");
        pruefe(P.gleichwertig(s["oben-x"] || "0", `${m}x`, ["x"]) && s["oben-1"] === String(a) && s["links-x"] === "x" && s["links-1"] === String(b), `${w2}: die Seiten heißen ${s["oben-x"]}, ${s["oben-1"]}, ${s["links-x"]}, ${s["links-1"]}`);
      } else {
        // Jeder Block rückt als Ganzes: rechts nach rechts, unten nach unten, unten rechts beides.
        const weg = (n) => teil(n).map((z, i) => { const v = anfang.filter((y) => y.teil === n)[i]; return [z.x - v.x, z.y - v.y]; });
        const gleich = (l) => l.every((v) => Math.abs(v[0] - l[0][0]) < 0.01 && Math.abs(v[1] - l[0][1]) < 0.01);
        const [dxx, dx1, d1x, d11] = ["xx", "x1", "1x", "11"].map(weg);
        pruefe([dxx, dx1, d1x, d11].every(gleich), `${w2}: ein Block wird nicht als Ganzes verschoben`);
        const dx = dx1[0][0], dy = d1x[0][1];
        pruefe(Math.abs(dxx[0][0]) < 0.01 && Math.abs(dxx[0][1]) < 0.01 && dx > 0 && Math.abs(dx1[0][1]) < 0.01 && dy > 0 && Math.abs(d1x[0][0]) < 0.01 && Math.abs(d11[0][0] - dx) < 0.01 && Math.abs(d11[0][1] - dy) < 0.01, `${w2}: die Blöcke rücken nicht in ihre Richtungen`);
      }
      if (t === 100) {
        const pr = await page.evaluate(() => Object.fromEntries([...document.querySelectorAll('#re-mount [data-rolle="produkt"]')].map((e) => [e.dataset.teil, e.textContent])));
        const sollP = { xx: `x * ${m}x`, x1: `x * ${a}`, "1x": `${b} * ${m}x`, 11: `${b} * ${a}` };
        for (const [n, s] of Object.entries(sollP)) pruefe(pr[n] !== undefined && P.gleichwertig(pr[n], s, ["x"]), `${w2}: im Block ${n} steht „${pr[n]}“ statt ${s}`);
        const erg = await page.evaluate(() => document.querySelector('#re-bilanz [data-rolle="ergebnis"]')?.textContent ?? null);
        pruefe(erg !== null && P.gleichwertig(erg, `(${m}x + ${a}) * (x + ${b})`, ["x"]) && P.istVereinfacht(erg), `${w2}: das Ergebnis „${erg}“ stimmt nicht`);
      }
    }
  }
  await setzeRegler(page, "re-t", 0);
}

// ── 2. Jedes Glied mit jedem ──────────────────────────────────────────────

const VARS = ["x", "y", "a", "b"];
async function probePruefen(page, id, anfang, ende, wo) {
  const text = await page.evaluate((i) => document.getElementById(i).innerText, id);
  const m = text.match(/Probe mit (.+?): Der Anfang ergibt (−?\d+), das Ergebnis (−?\d+)/);
  pruefe(!!m, `${wo}: keine Probe — „${text}“`);
  if (!m) return;
  const bel = Object.fromEntries(m[1].split(", ").map((p) => p.split(" = ")).map(([v, z]) => [v, zahl(z)]));
  const wa = P.wert(anfang, bel);
  pruefe(zahl(m[2]) === wa && zahl(m[3]) === P.wert(ende, bel) && wa === zahl(m[3]), `${wo}: die Probe stimmt nicht (nachgerechnet ${wa})`);
}
const liesSchritte = (page, mount) => page.evaluate((m) => [...document.querySelectorAll(`#${m} [data-rolle="schritt"]`)].map((e) => ({ art: e.dataset.art, term: e.dataset.term })), mount);
async function jeder(page) {
  const n = await page.evaluate(() => document.getElementById("jj-term").options.length);
  for (let i = 0; i < n; i++) {
    await waehle(page, "jj-term", String(i));
    const term = await optionText(page, "jj-term");
    const wo = `Jedes mit jedem „${term}“`;
    pruefe(await setzeRegler(page, "jj-schritt", 3) === 3, `${wo}: der Regler erreicht Schritt 3 nicht`);
    const s = await liesSchritte(page, "jj-mount");
    pruefe(s.length === 4 && normal(s[0].term) === normal(term), `${wo}: ${s.length} Zeilen, Anfang „${s[0] && s[0].term}“`);
    const [, k1, k2] = term.match(/^\((.+)\) · \((.+)\)$/);
    const g1 = P.summanden(k1), g2 = P.summanden(k2);
    const paare = g1.flatMap((u) => g2.map((v) => `(${u}) * (${v})`));
    const produkte = P.summanden(s[1].term);
    pruefe(produkte.length === paare.length, `${wo}: ${produkte.length} Produkte statt ${g1.length} · ${g2.length} = ${paare.length}`);
    produkte.forEach((p, j) => pruefe(!!paare[j] && P.gleichwertig(p, paare[j], VARS), `${wo}: das ${j + 1}. Produkt „${p}“ ist nicht ${paare[j]}`));
    const ausgerechnet = P.summanden(s[2].term);
    pruefe(ausgerechnet.length === paare.length && ausgerechnet.every((p, j) => P.gleichwertig(p, paare[j], VARS)), `${wo}: die ausgerechneten Produkte passen nicht zu den Paaren`);
    pruefe(s.every((z) => P.gleichwertig(z.term, term, VARS)), `${wo}: ein Schritt ist nicht gleichwertig mit dem Anfang`);
    pruefe(P.istVereinfacht(s[3].term), `${wo}: das Ergebnis „${s[3].term}“ ist nicht zusammengefasst`);
    await probePruefen(page, "jj-text", term, s[3].term, wo);
  }
}

// ── 3. Mehr als zwei Faktoren ─────────────────────────────────────────────

async function mehrere(page) {
  const n = await page.evaluate(() => document.getElementById("mf-term").options.length);
  for (let i = 0; i < n; i++) {
    await waehle(page, "mf-term", String(i));
    const term = await optionText(page, "mf-term");
    const wo = `Mehr Faktoren „${term}“`;
    await setzeRegler(page, "mf-schritt", 3);
    const s = await liesSchritte(page, "mf-mount");
    pruefe(s.length === 4 && normal(s[0].term) === normal(term), `${wo}: ${s.length} Zeilen, Anfang „${s[0] && s[0].term}“`);
    s.forEach((z, j) => pruefe(P.gleichwertig(z.term, term, VARS), `${wo}: Schritt ${j} „${z.term}“ ist nicht gleichwertig mit dem Anfang`));
    const ende = s[s.length - 1].term;
    pruefe(!/[()]/.test(ende) && P.istVereinfacht(ende), `${wo}: der Schluss „${ende}“ ist nicht ausmultipliziert und zusammengefasst`);
    // Schrittweise: In jedem Zwischenschritt steht höchstens noch eine Klammer weniger als vorher.
    for (let j = 1; j < s.length; j++) pruefe((s[j].term.match(/\(/g) || []).length <= (s[j - 1].term.match(/\(/g) || []).length, `${wo}: in Schritt ${j} sind Klammern dazugekommen`);
    await probePruefen(page, "mf-text", term, ende, wo);
  }
}

// ── 4. Flächenänderung ────────────────────────────────────────────────────

async function anwenden(page) {
  const n = await page.evaluate(() => document.getElementById("fa-art").options.length);
  for (let i = 0; i < n; i++) {
    await waehle(page, "fa-art", String(i));
    const art = await optionText(page, "fa-art");
    const [, a, b] = art.match(/^(\d+) länger, (\d+) kürzer$/).map(Number);
    for (const wunsch of [3, 5, 6, 9, 12]) {
      const x = await setzeRegler(page, "fa-x", wunsch);
      const wo = `Flächenänderung „${art}“, x = ${x}`;
      // Die verkürzte Seite muss eine Länge behalten: Der Regler steht nie unter b + 1.
      pruefe(x === Math.max(wunsch, b + 1), `${wo}: der Regler steht auf ${x}, gewünscht ${wunsch}, kleinste erlaubte Länge ${b + 1}`);
      const r = await page.evaluate(() => {
        const q = (n) => { const e = document.querySelector(`#fa-mount [data-rolle="${n}"]`); return { x: +e.getAttribute("x"), y: +e.getAttribute("y"), w: +e.getAttribute("width"), h: +e.getAttribute("height") }; };
        const t = (n) => document.querySelector(`#fa-mount [data-rolle="${n}"]`)?.textContent ?? "";
        const bt = (n) => document.querySelector(`#fa-bilanz [data-rolle="${n}"]`)?.textContent ?? "";
        return { alt: q("alt"), neu: q("neu"), breite: t("breite"), hoehe: t("hoehe"), termNeu: bt("term-neu"), termAend: bt("term-aenderung"), aend: bt("aenderung"), text: document.getElementById("fa-text").innerText };
      });
      // Maßstab aus dem Quadrat zurückgerechnet.
      const s = r.alt.w / x;
      pruefe(Math.abs(r.alt.h - r.alt.w) < 0.01 && Math.abs(r.neu.w - (x + a) * s) < 0.05 && Math.abs(r.neu.h - (x - b) * s) < 0.05 && Math.abs(r.neu.x - r.alt.x) < 0.01 && Math.abs(r.neu.y - r.alt.y) < 0.01, `${wo}: Quadrat und Rechteck sind nicht maßstäblich`);
      pruefe(r.breite === `x + ${a} = ${x + a}` && r.hoehe === `x − ${b} = ${x - b}`, `${wo}: die Seiten heißen „${r.breite}“ und „${r.hoehe}“`);
      pruefe(P.gleichwertig(r.termNeu, `(x + ${a}) * (x - ${b})`, ["x"]) && P.istVereinfacht(r.termNeu), `${wo}: der neue Flächeninhalt heißt „${r.termNeu}“`);
      pruefe(P.gleichwertig(r.termAend, `(x + ${a}) * (x - ${b}) - x^2`, ["x"]), `${wo}: die Änderung heißt „${r.termAend}“`);
      const d = (x + a) * (x - b) - x * x;
      pruefe(zahl(r.aend) === d, `${wo}: die Änderung ist ${r.aend}, nachgerechnet ${d}`);
      pruefe(d > 0 ? /größer/.test(r.text.split(".")[0]) : d < 0 ? /kleiner/.test(r.text.split(".")[0]) : /gleich/.test(r.text.split(".")[0]), `${wo}: „${r.text}“ passt nicht zur Änderung ${d}`);
    }
  }
}

// ── Kontrollfragen ────────────────────────────────────────────────────────

async function quizze(page) {
  const ids = await page.evaluate(() => [...document.querySelectorAll(".quiz")].map((e) => e.id));
  pruefe(ids.length === 4, `Kontrollfragen: ${ids.length} statt 4`);
  for (const sec of ["sec-rechteck", "sec-jeder", "sec-mehrere", "sec-anwenden"]) {
    pruefe(await page.evaluate((s) => document.querySelectorAll(`#${s} .quiz`).length === 1, sec), `Kontrollfragen: ${sec} hat nicht genau eine`);
  }
  const RICHTIG = {
    "quiz-rechteck": (o) => P.gleichwertig(o, "(x + 2) * (x + 3)", ["x"]),
    "quiz-jeder": (o) => P.gleichwertig(o, "(x - 4) * (x + 2)", ["x"]),
    "quiz-mehrere": (o) => P.gleichwertig(o, "3 * (x + 1) * (x - 2)", ["x"]),
    // Hier selbst: Die Änderung (x + 2)(x − 2) − x² ist für jedes x −4.
    "quiz-anwenden": (o) => P.gleichwertig("(x + 2) * (x - 2) - x^2", "-4", ["x"]) && o === "Er wird um 4 kleiner.",
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

function bau(glieder) {
  const g = glieder.filter(([k]) => Math.abs(k) > 1e-9).reverse();
  if (!g.length) return "0";
  return g.map(([k, v], i) => {
    const b = Math.abs(k);
    const kern = v === "" ? String(b) : (b === 1 ? "" : String(b)) + v;
    return i === 0 ? (k < 0 ? "−" : "") + kern : (k < 0 ? " − " : " + ") + kern;
  }).join("");
}
const quad = (t) => { const f = (x) => P.wert(t, { x }); const c0 = f(0); return { c2: (f(1) + f(-1)) / 2 - c0, c1: (f(1) - f(-1)) / 2, c0 }; };
const qbau = (q) => bau([[q.c2, "x^2"], [q.c1, "x"], [q.c0, ""]]);
const termAus = (frage, vor) => { const m = frage.match(new RegExp(vor + " (.+?) Schreibweise:")); return m && m[1]; };
const vz = (s) => (s === "−" ? -1 : 1);
const VOR = "Multipliziere aus und fasse zusammen:";

// Die Schranken für `mindestensVerschieden` sind gemessen (tests/werkzeug-streuung.js, 20 Züge):
// D1 n ≈ 43, D2 n ≈ 54, D3 n ≈ 222, D4 n ≈ 108, D5 n ≈ 81, D6 n ≈ 47, D7 n ≈ 10, D8 n ≈ 74.
const SCHRANKE = [10, 11, 14, 13, 12, 10, 5, 12];
const RUNDEN = 20;

async function aufgaben(page) {
  await pruefeAufgabe(page, bericht, {
    nr: 1, name: "D1 Zwei Summen", runden: RUNDEN, mindestensVerschieden: SCHRANKE[0],
    deute: (frage) => {
      const term = termAus(frage, VOR);
      const m = term && term.match(/^\(x \+ (\d+)\) · \(x \+ (\d+)\)$/);
      if (!m) return null;
      const [a, b] = [m[1], m[2]].map(Number);
      return { richtig: qbau(quad(term)), falsch: [[bau([[1, "x^2"], [a * b, ""]]), "gemischten Produkte"], [bau([[1, "x^2"], [a + b, "x"], [a + b, ""]]), "nicht die Summe"]] };
    },
  });

  await pruefeAufgabe(page, bericht, {
    nr: 2, name: "D2 Mit Vorzeichen", runden: RUNDEN, mindestensVerschieden: SCHRANKE[1],
    deute: (frage) => {
      const term = termAus(frage, VOR);
      const m = term && term.match(/^\(x ([+−]) (\d+)\) · \(x ([+−]) (\d+)\)$/);
      if (!m) return null;
      const a = vz(m[1]) * Number(m[2]), b = vz(m[3]) * Number(m[4]);
      pruefe(a < 0 || b < 0, `D2: kein Minus in „${term}“`);
      return {
        richtig: qbau(quad(term)),
        falsch: [[bau([[1, "x^2"], [a * b, ""]]), "gemischten Produkte"], [bau([[1, "x^2"], [a + b, "x"], [-a * b, ""]]), "letzten Produkts"], [bau([[1, "x^2"], [-(a + b), "x"], [a * b, ""]]), "x-Gliedern"]],
      };
    },
  });

  await pruefeAufgabe(page, bericht, {
    nr: 3, name: "D3 Zahlen vor x", runden: RUNDEN, mindestensVerschieden: SCHRANKE[2],
    deute: (frage) => {
      const term = termAus(frage, VOR);
      const m = term && term.match(/^\((\d*)x ([+−]) (\d+)\) · \((\d*)x ([+−]) (\d+)\)$/);
      if (!m) return null;
      const mm = Number(m[1] || 1), a = vz(m[2]) * Number(m[3]), n = Number(m[4] || 1), b = vz(m[5]) * Number(m[6]);
      return {
        richtig: qbau(quad(term)),
        falsch: [
          [bau([[mm * n, "x^2"], [a * b, ""]]), "gemischten Produkte"],
          [bau([[mm * n, "x^2"], [mm * b, "x"], [a * b, ""]]), "Ein Produkt fehlt"],
          [bau([[mm * n, "x^2"], [mm * b + a * n, "x"], [-a * b, ""]]), "letzten Produkts"],
          [bau([[mm + n + mm * b + a * n, "x"], [a * b, ""]]), "x · x = x²"],
        ],
      };
    },
  });

  await pruefeAufgabe(page, bericht, {
    nr: 4, name: "D4 Zwei Variablen", runden: RUNDEN, mindestensVerschieden: SCHRANKE[3],
    deute: (frage) => {
      const term = termAus(frage, VOR);
      if (!term || !/^\(.*a.*b\) · \(.*a.*b\)$/.test(term)) return null;
      const f = (a, b) => P.wert(term, { a, b });
      const aa = f(1, 0), bb = f(0, 1), ab = f(1, 1) - aa - bb;
      // Das letzte Glied jeder Klammer mit Vorzeichen, für die Hinweise.
      const [, k1, k2] = term.match(/^\((.+)\) · \((.+)\)$/);
      const q = P.wert(k1, { a: 0, b: 1 }), r = P.wert(k2, { a: 1, b: 0 }), p = P.wert(k1, { a: 1, b: 0 }), s = P.wert(k2, { a: 0, b: 1 });
      pruefe(aa === p * r && bb === q * s && ab === p * s + q * r, `D4: die Prüfung liest den Term anders — „${frage}“`);
      return {
        richtig: bau([[aa, "a^2"], [ab, "ba"], [bb, "b^2"]]),
        falsch: [[bau([[aa, "a^2"], [bb, "b^2"]]), "gemischten Produkte"], [bau([[aa, "a^2"], [ab, "ab"], [-bb, "b^2"]]), "b²-Glied"], [bau([[aa, "a^2"], [p * s - q * r, "ab"], [bb, "b^2"]]), "ab-Gliedern"]],
      };
    },
  });

  await pruefeAufgabe(page, bericht, {
    nr: 5, name: "D5 Faktor vor dem Produkt", runden: RUNDEN, mindestensVerschieden: SCHRANKE[4],
    deute: (frage) => {
      const term = termAus(frage, VOR);
      const m = term && term.match(/^(−?\d+) · \(x ([+−]) (\d+)\) · \(x ([+−]) (\d+)\)$/);
      if (!m) return null;
      const k = zahl(m[1]);
      const innen = quad(`(x ${m[2] === "−" ? "-" : "+"} ${m[3]}) * (x ${m[4] === "−" ? "-" : "+"} ${m[5]})`);
      return {
        richtig: qbau(quad(term)),
        falsch: [[qbau({ c2: k * k * innen.c2, c1: k * k * innen.c1, c0: k * k * innen.c0 }), "nur einmal"], [qbau({ c2: k, c1: innen.c1, c0: innen.c0 }), "jedem Glied"]],
      };
    },
  });

  await pruefeAufgabe(page, bericht, {
    nr: 6, name: "D6 Differenz zweier Produkte", runden: RUNDEN, mindestensVerschieden: SCHRANKE[5],
    deute: (frage) => {
      const term = termAus(frage, VOR);
      const m = term && term.match(/^(\(x [+−] \d+\) · \(x [+−] \d+\)) − (\(x [+−] \d+\) · \(x [+−] \d+\))$/);
      if (!m) return null;
      const q = quad(term), p1 = quad(m[1]), p2 = quad(m[2]);
      pruefe(q.c2 === 0, `D6: x² hebt sich nicht auf — „${frage}“`);
      return {
        richtig: qbau(q),
        falsch: [[qbau({ c2: 0, c1: p1.c1 + p2.c1, c0: p1.c0 + p2.c0 }), "ganze zweite Produkt"], [qbau({ c2: 2, c1: p1.c1 + p2.c1, c0: p1.c0 + p2.c0 }), "abgezogen"]],
      };
    },
  });

  await pruefeAufgabe(page, bericht, {
    nr: 7, name: "D7 Flächenänderung", runden: RUNDEN, mindestensVerschieden: SCHRANKE[6],
    deute: (frage) => {
      const m = frage.match(/um (\d+) cm verlängert, die andere um (\d+) cm verkürzt/);
      if (!m) return null;
      const [a, b] = [m[1], m[2]].map(Number);
      const neu = quad(`(x + ${a}) * (x - ${b})`);
      const gleich = (a * b) / (a - b);
      pruefe(Number.isInteger(gleich) && (gleich + a) * (gleich - b) === gleich * gleich, `D7: bei x = ${gleich} ist der Flächeninhalt nicht gleich — „${frage}“`);
      const falschFelder = [[0, bau([[1, "x^2"], [-a * b, ""]]), "gemischten Produkte"], [0, bau([[1, "x^2"], [a - b, "x"], [a * b, ""]]), "letzten Produkts"], [1, bau([[b - a, "x"], [a * b, ""]]), "alt − neu"], [2, a * b, "teile"]];
      if (a - b !== gleich) falschFelder.push([2, a - b, "Setz"]);
      return { felder: [qbau(neu), bau([[a - b, "x"], [-a * b, ""]]), gleich], falschFelder };
    },
  });

  await pruefeAufgabe(page, bericht, {
    nr: 8, name: "D8 Restfläche", runden: RUNDEN, mindestensVerschieden: SCHRANKE[7],
    liesRoh: (page2, box) => page2.evaluate((sel) => {
      const svg = document.querySelector(`${sel} .aufgabe-prompt svg[data-figur="loch"]`);
      if (!svg) return null;
      const t = (r) => svg.querySelector(`[data-rolle="${r}"]`).textContent;
      const r = (n) => { const e = svg.querySelector(`[data-rolle="${n}"]`); return { x: +e.getAttribute("x"), y: +e.getAttribute("y"), w: +e.getAttribute("width"), h: +e.getAttribute("height") }; };
      return { breite: t("breite"), hoehe: t("hoehe"), loch: t("loch-seite"), aussen: r("aussen"), innen: r("loch") };
    }, box),
    deute: (frage, roh) => {
      const m = frage.match(/für x = (\d+)\?/);
      if (!m || !roh) return null;
      const x0 = Number(m[1]);
      const o = roh.aussen, i = roh.innen;
      pruefe(i.x > o.x && i.y > o.y && i.x + i.w < o.x + o.w && i.y + i.h < o.y + o.h && Math.abs(i.w - i.h) < 0.01, `D8: das Loch ist kein Quadrat innerhalb der Platte`);
      pruefe(roh.loch === "x", `D8: das Loch heißt „${roh.loch}“`);
      const rest = `(${roh.breite}) * (${roh.hoehe}) - x^2`;
      const ganz = `(${roh.breite}) * (${roh.hoehe})`;
      return {
        felder: [qbau(quad(rest)), P.wert(rest, { x: x0 })],
        falschFelder: [[0, qbau(quad(ganz)), "ganze Platte"], [1, P.wert(ganz, { x: x0 }), "ganze Platte"]],
      };
    },
  });
}

// ── Gerüst ────────────────────────────────────────────────────────────────

async function geruest(page) {
  const folge = await page.evaluate(() => [...document.querySelectorAll("main section[id]")].map((s) => s.id));
  const soll = ["sec-rechteck", "sec-jeder", "sec-mehrere", "sec-anwenden", "sec-vernetzung", "sec-formelsammlung", "sec-uebungen", "sec-selbsteinschaetzung"];
  pruefe(JSON.stringify(folge) === JSON.stringify(soll), `Gerüst: Abschnitte ${folge.join(", ")} statt ${soll.join(", ")}`);
  // Kein Vorgriff auf Thema 5: keine binomische Formel — gerechnet wird jedes Produkt einzeln.
  for (const id of soll.slice(0, 4)) {
    const t = await page.evaluate((i) => { const e = document.getElementById(i).cloneNode(true); e.querySelectorAll(".uebung-sprung, .quiz").forEach((x) => x.remove()); return e.innerText; }, id);
    pruefe(!/binomisch|a² ?\+ ?2ab|\(a \+ b\)²/i.test(t), `Gerüst: ${id} greift auf die binomischen Formeln vor`);
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
  const karte = menue.match(/<a class="menu-card"[^>]*href="klammern-multiplizieren\.html"[^>]*>\s*<h2>([^<]*)<\/h2>/);
  pruefe(!!karte && /data-section="klasse-8"/.test(karte[0]) && /\shidden\b/.test(karte[0]) && karte[1] === "4. Terme mit Klammern multiplizieren", "Gerüst: die Menükarte fehlt oder ist unvollständig");
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
      await teil("rechteck", rechteck, page);
      await teil("jeder", jeder, page);
      await teil("mehrere", mehrere, page);
      await teil("anwenden", anwenden, page);
      await teil("quizze", quizze, page);
      await teil("aufgaben", aufgaben, page);
    } else if (will("dunkel")) {
      await setzeRegler(page, "re-t", 100);
      await pruefeKontrast(page, bericht, "dunkel");
      await pruefeStrichKontrast(page, bericht, "dunkel, Rechteck", "#re-mount rect.tm-kachel, #fa-mount rect");
      await pruefeTextAufFlaeche(page, bericht, "dunkel, Produkte in den Blöcken", "#re-mount text[data-rolle=produkt], #fa-mount text[data-rolle=plus], #fa-mount text[data-rolle=minus]");
    }
    await pruefeNotation(page, bericht, wo);
    for (const s of page.stoerungen) pruefe(false, `${wo}: ${s}`);
    await page.close();
  }
  await browser.close();
  bericht.abschluss();
})();
