// Fachliche Prüfung: Klasse 8, Terme, Thema 1 „Terme aufstellen und Termwerte berechnen“.
//
// Nachgerechnet wird mit einem eigenen Termauswerter (tests/lib/polynom.js), nicht mit dem der Seite:
//
//   1. Das MUSTER: Die Zeichnung hat bei jeder Anzahl n wirklich 3n + 1 Hölzchen, jede Zählweise teilt
//      sie in Gruppen, deren Größen der Term nennt, und alle Terme in der Bilanz ergeben die
//      gezählte Zahl. Beim Auseinanderziehen wird jede Gruppe starr verschoben.
//   2. Der RECHENBAUM: Jeder Satz wird hier unabhängig übersetzt; die Wurzel trägt den Termwert, die
//      Blätter tragen x und die Zahlen des Satzes, und der Name des Terms passt zum letzten Schritt.
//   3. Die WERTETABELLE: Jede Zeile wird nachgerechnet, auch die eingesetzte Rechnung selbst, und
//      negative Zahlen stehen beim Einsetzen in Klammern.
//   4. Die GLEICHWERTIGKEIT: Jede Zeile ✓/✗ stimmt, ein genanntes Gegenbeispiel ist wirklich eines,
//      und wo alle Zeilen übereinstimmen, behauptet die Seite keinen Beweis.
//   5. Die AUFGABEN: Jede der acht wird über viele Runden gewürfelt, aus dem Aufgabentext (und bei
//      den Mustern aus der Zeichnung) nachgerechnet und mit den vorgesehenen Fehlern geprüft.

"use strict";

const { neuerBericht } = require("../lib/pruefen");
const { starteBrowser, neueSeite, oeffne, setzeRegler, text } = require("../lib/seite");
const { pruefeNotation } = require("../lib/notation");
const { pruefeKontrast, pruefeStrichKontrast } = require("../lib/kontrast");
const { pruefeAufgabe, zahl } = require("../lib/aufgaben");
const P = require("../lib/polynom");
const fs = require("fs");
const path = require("path");

const bericht = neuerBericht();
const { pruefe } = bericht;
const SEITE = "/mathematik/klasse-8/terme/terme-aufstellen.html";
const WURZEL = path.resolve(__dirname, "..", "..");
// Für Gegenproben: UPLANT_NUR=muster,aufgaben lässt nur die genannten Teile laufen.
const NUR = (process.env.UPLANT_NUR || "").split(",").map((t) => t.trim()).filter(Boolean);
const will = (teil) => NUR.length === 0 || NUR.includes(teil);

const de = (x) => (Math.round(x * 1e6) / 1e6).toLocaleString("de-DE", { maximumFractionDigits: 6 }).replace("-", "−");
const waehle = (page, id, wert) => page.evaluate(([i, w]) => {
  const e = document.getElementById(i);
  e.value = w;
  e.dispatchEvent(new Event("input", { bubbles: true }));
}, [id, wert]);

// ── 1. Muster ─────────────────────────────────────────────────────────────

// Erwartete Gruppengrößen je Zählweise, hier aus der Sache gezählt: a — ein Hölzchen, dann je
// Quadrat drei; b — vier für das erste Quadrat, je weiteres drei; c — n oben, n unten, n + 1 senkrecht.
const GRUPPEN = {
  a: (n) => [1, ...Array(n).fill(3)],
  b: (n) => [4, ...Array(n - 1).fill(3)],
  c: (n) => [n, n, n + 1],
};
async function muster(page) {
  for (const art of ["a", "b", "c"]) {
    await waehle(page, "sm-art", art);
    for (const n of [1, 2, 4, 7, 10]) {
      await setzeRegler(page, "sm-n", n);
      const wo = `Muster ${art}, n = ${n}`;
      const lies = () => page.evaluate(() => ({
        holz: [...document.querySelectorAll('#sm-mount [data-rolle="holz"]')].map((l) => ({
          g: Number(l.dataset.gruppe), x1: +l.getAttribute("x1"), y1: +l.getAttribute("y1"), x2: +l.getAttribute("x2"), y2: +l.getAttribute("y2"),
        })),
        zahlen: [...document.querySelectorAll('#sm-mount [data-rolle="gruppenzahl"]')].map((t) => ({ g: Number(t.dataset.gruppe), n: Number(t.textContent) })),
        bilanz: document.getElementById("sm-bilanz").innerText,
        box: (() => { const s = document.querySelector("#sm-mount svg"); return { b: s.viewBox.baseVal.width, h: s.viewBox.baseVal.height }; })(),
        texte: [...document.querySelectorAll("#sm-mount svg text")].map((t) => { const k = t.getBBox(); return { x0: k.x, x1: k.x + k.width, y0: k.y, y1: k.y + k.height }; }),
      }));
      await setzeRegler(page, "sm-t", 0);
      const z0 = await lies();
      // Gezählt wird an der Zeichnung.
      pruefe(z0.holz.length === 3 * n + 1, `${wo}: ${z0.holz.length} Hölzchen statt ${3 * n + 1}`);
      const laengen = z0.holz.map((h) => Math.hypot(h.x2 - h.x1, h.y2 - h.y1));
      pruefe(laengen.every((l) => Math.abs(l - laengen[0]) < 0.05), `${wo}: die Hölzchen sind verschieden lang`);
      // Kein Hölzchen liegt doppelt: Zusammengesetzt sind alle Lagen verschieden.
      const lagen = new Set(z0.holz.map((h) => [h.x1, h.y1, h.x2, h.y2].map((v) => v.toFixed(1)).join(",")));
      pruefe(lagen.size === z0.holz.length, `${wo}: Hölzchen liegen aufeinander`);
      // Die Gruppen.
      const groessen = [];
      for (const h of z0.holz) groessen[h.g] = (groessen[h.g] || 0) + 1;
      pruefe(JSON.stringify(groessen) === JSON.stringify(GRUPPEN[art](n)), `${wo}: Gruppen ${JSON.stringify(groessen)} statt ${JSON.stringify(GRUPPEN[art](n))}`);
      for (const zz of z0.zahlen) pruefe(zz.n === groessen[zz.g], `${wo}: an Gruppe ${zz.g} steht ${zz.n}, sie hat ${groessen[zz.g]} Hölzchen`);
      pruefe(z0.zahlen.length === groessen.length, `${wo}: ${z0.zahlen.length} Gruppenzahlen für ${groessen.length} Gruppen`);
      // Die Bilanz: die gezählte Zahl, und jeder Term — hier selbst ausgewertet — ergibt sie.
      pruefe(z0.bilanz.includes(`Gezählt: ${3 * n + 1} Hölzchen`), `${wo}: die Bilanz nennt nicht die gezählte Zahl`);
      const terme = [...z0.bilanz.matchAll(/^(.*n.*?) = (.*?) = (\d+)$/gm)];
      pruefe(terme.length === 3, `${wo}: ${terme.length} Terme in der Bilanz statt 3`);
      for (const m of terme) {
        pruefe(Math.abs(P.wert(m[1], { n }) - (3 * n + 1)) < 1e-9, `${wo}: der Term ${m[1]} ergibt ${P.wert(m[1], { n })}, gezählt sind ${3 * n + 1}`);
        pruefe(Math.abs(P.wert(m[2], {}) - Number(m[3])) < 1e-9 && Number(m[3]) === 3 * n + 1, `${wo}: ${m[2]} = ${m[3]} stimmt nicht`);
        pruefe(P.gleichwertig(m[1], "3n + 1", ["n"]), `${wo}: ${m[1]} ist nicht gleichwertig mit 3n + 1`);
      }
      // Auseinanderziehen: Jede Gruppe wird als Ganzes verschoben, keine verformt.
      for (const t of [50, 100]) {
        await setzeRegler(page, "sm-t", t);
        const z = await lies();
        const weg = new Map();
        z.holz.forEach((h, i) => {
          const a = z0.holz[i];
          const v = [h.x1 - a.x1, h.y1 - a.y1, h.x2 - a.x2, h.y2 - a.y2];
          pruefe(Math.abs(v[0] - v[2]) < 0.05 && Math.abs(v[1] - v[3]) < 0.05, `${wo}, ${t} %: ein Hölzchen ist verformt`);
          if (!weg.has(h.g)) weg.set(h.g, v);
          else pruefe(Math.abs(weg.get(h.g)[0] - v[0]) < 0.05 && Math.abs(weg.get(h.g)[1] - v[1]) < 0.05, `${wo}, ${t} %: Gruppe ${h.g} wird nicht als Ganzes verschoben`);
        });
        if (t === 100 && n > 1) pruefe(new Set([...weg.values()].map((v) => v[0].toFixed(1) + "," + v[1].toFixed(1))).size === weg.size, `${wo}: ganz auseinandergezogen liegen zwei Gruppen noch aufeinander`);
        for (const k of z.texte) pruefe(k.x0 >= 0 && k.x1 <= z.box.b && k.y0 >= 0 && k.y1 <= z.box.h, `${wo}, ${t} %: eine Beschriftung ragt aus dem Bild`);
      }
    }
  }
  await setzeRegler(page, "sm-t", 0);
}

// ── 2. Rechenbaum ─────────────────────────────────────────────────────────

// Hier selbst übersetzt: Satz → Term und letzter Rechenschritt.
const UEBERSETZT = [
  ["das Doppelte einer Zahl, vermindert um 3", "2x − 3", "Differenz"],
  ["das Doppelte der um 3 verminderten Zahl", "2(x − 3)", "Produkt"],
  ["das Dreifache einer Zahl, vermehrt um 5", "3x + 5", "Summe"],
  ["die Summe aus einer Zahl und 5, verdreifacht", "3(x + 5)", "Produkt"],
  ["das Quadrat einer Zahl, vermehrt um 1", "x² + 1", "Summe"],
  ["das Quadrat der um 1 vermehrten Zahl", "(x + 1)²", "Potenz"],
];
async function baum(page) {
  for (let i = 0; i < UEBERSETZT.length; i++) {
    await waehle(page, "rb-satz", String(i));
    const [satz, term, name] = UEBERSETZT[i];
    const option = await page.evaluate(() => { const s = document.getElementById("rb-satz"); return s.options[s.selectedIndex].text; });
    pruefe(option === satz, `Rechenbaum ${i}: die Auswahl heißt „${option}“, erwartet „${satz}“`);
    for (const x of [-5, -2, 0, 3, 8]) {
      await setzeRegler(page, "rb-x", x);
      const wo = `Rechenbaum „${satz}“, x = ${x}`;
      const z = await page.evaluate(() => ({
        knoten: [...document.querySelectorAll('#rb-mount [data-rolle="knoten"]')].map((g) => ({
          op: g.dataset.op, wert: Number(g.dataset.wert), blatt: g.dataset.blatt === "ja",
          text: g.querySelector(".tm-knoten-text").textContent, wurzel: g.classList.contains("tm-wurzel"),
        })),
        bilanz: document.getElementById("rb-bilanz").innerText,
        termwert: Number((document.querySelector('#rb-bilanz [data-rolle="termwert"]') || {}).textContent?.replace("−", "-")),
      }));
      const soll = P.wert(term, { x });
      const wurzel = z.knoten.find((k) => k.wurzel);
      pruefe(!!wurzel && wurzel.wert === soll, `${wo}: die Wurzel trägt ${wurzel && wurzel.wert}, nachgerechnet ${soll}`);
      pruefe(z.termwert === soll, `${wo}: die Bilanz nennt ${z.termwert}, nachgerechnet ${soll}`);
      // Die Blätter: x mit der eingesetzten Zahl und die Zahlen des Satzes.
      const blaetter = z.knoten.filter((k) => k.blatt);
      const vars = blaetter.filter((k) => k.text === "x");
      pruefe(vars.length === 1 && vars[0].wert === x, `${wo}: das Blatt x trägt nicht die eingesetzte Zahl`);
      const zahlen = blaetter.filter((k) => k.text !== "x").map((k) => k.wert).sort();
      const zahlenSoll = (term.replace(/²/g, "").match(/\d+/g) || []).map(Number).sort();
      pruefe(JSON.stringify(zahlen) === JSON.stringify(zahlenSoll), `${wo}: die Blätter tragen ${zahlen}, der Satz enthält ${zahlenSoll}`);
      pruefe(z.knoten.length === blaetter.length + (term.match(/[+−·²]|\d(?=x|\()/g) || []).length, `${wo}: ${z.knoten.length} Knoten passen nicht zum Term ${term}`);
      pruefe(new RegExp(name).test(z.bilanz.split("\n")[0]), `${wo}: der Term heißt nicht ${name}`);
      // Die eingesetzte Rechnung in der Bilanz ergibt wirklich den Termwert.
      const m = z.bilanz.match(/Für x = [^:]+: (.+) = ([−\d,]+)\n/);
      pruefe(!!m && Math.abs(P.wert(m[1], {}) - soll) < 1e-9, `${wo}: die eingesetzte Rechnung „${m && m[1]}“ ergibt nicht ${soll}`);
      if (x < 0) pruefe(!!m && m[1].includes(`(${de(x)}`), `${wo}: die negative Zahl steht nicht in Klammern — „${m && m[1]}“`);
    }
  }
}

// ── 3. Wertetabelle ───────────────────────────────────────────────────────

async function tabelle(page) {
  const terme = await page.evaluate(() => [...document.getElementById("wt-term").options].map((o) => o.text));
  pruefe(terme.length === 5, `Wertetabelle: ${terme.length} Terme statt 5`);
  for (let i = 0; i < terme.length; i++) {
    await waehle(page, "wt-term", String(i));
    for (const [start, schritt] of [[-4, 1], [-2, 0.5], [0, 2], [2, 1.5]]) {
      await setzeRegler(page, "wt-start", start);
      await setzeRegler(page, "wt-schritt", schritt);
      const wo = `Wertetabelle ${terme[i]}, ab ${start} in Schritten von ${schritt}`;
      const zeilen = await page.evaluate(() => [...document.querySelectorAll("#wt-tabelle tbody tr")].map((tr) => [...tr.children].map((td) => td.textContent)));
      pruefe(zeilen.length === 6, `${wo}: ${zeilen.length} Zeilen statt 6`);
      zeilen.forEach(([xs, eins, ws], j) => {
        const x = start + j * schritt;
        pruefe(zahl(xs) === x, `${wo}: Zeile ${j + 1} hat x = ${xs} statt ${x}`);
        const soll = P.wert(terme[i], { x });
        pruefe(Math.abs(zahl(ws) - soll) < 1e-9, `${wo}: für x = ${x} steht ${ws}, nachgerechnet ${soll}`);
        pruefe(Math.abs(P.wert(eins, {}) - soll) < 1e-9, `${wo}: die eingesetzte Rechnung „${eins}“ ergibt nicht ${soll}`);
        if (x < 0) pruefe(eins.includes(`(${de(x)}`), `${wo}: x = ${x} steht beim Einsetzen nicht in Klammern — „${eins}“`);
      });
    }
  }
}

// ── 4. Gleichwertige Terme ────────────────────────────────────────────────

async function gleichwertig(page) {
  const paare = await page.evaluate(() => [...document.getElementById("gw-paar").options].map((o) => o.text.split(" und ")));
  for (let i = 0; i < paare.length; i++) {
    await waehle(page, "gw-paar", String(i));
    const [a, b] = paare[i];
    const gw = P.gleichwertig(a, b, ["x"]);
    for (const start of [-6, -2, 0, 4]) {
      await setzeRegler(page, "gw-start", start);
      const wo = `Gleichwertig: ${a} und ${b}, ab x = ${start}`;
      const z = await page.evaluate(() => ({
        kopf: [...document.querySelectorAll("#gw-tabelle th")].map((t) => t.textContent),
        zeilen: [...document.querySelectorAll("#gw-tabelle tbody tr")].map((tr) => [...tr.children].map((td) => td.textContent)),
        text: document.getElementById("gw-text").textContent,
      }));
      pruefe(z.kopf[1] === a && z.kopf[2] === b, `${wo}: die Spalten heißen ${z.kopf}`);
      let ungleich = 0;
      z.zeilen.forEach(([xs, wa, wb, urteil], j) => {
        const x = start + j;
        const sa = P.wert(a, { x }), sb = P.wert(b, { x });
        pruefe(zahl(xs) === x && zahl(wa) === sa && zahl(wb) === sb, `${wo}: Zeile x = ${x} zeigt ${wa} | ${wb}, nachgerechnet ${sa} | ${sb}`);
        pruefe(urteil === (sa === sb ? "✓ gleich" : "✗ verschieden"), `${wo}: x = ${x} ist als „${urteil}“ markiert`);
        if (sa !== sb) ungleich++;
      });
      if (ungleich) {
        const m = z.text.match(/Gegenbeispiel: Für x = ([−\d,]+)/);
        pruefe(!!m && P.wert(a, { x: zahl(m[1]) }) !== P.wert(b, { x: zahl(m[1]) }), `${wo}: das genannte Gegenbeispiel ist keines — „${z.text}“`);
        pruefe(/nicht gleichwertig/.test(z.text), `${wo}: der Text zieht nicht den Schluss „nicht gleichwertig“`);
        pruefe(!gw, `${wo}: die Seite findet ein Gegenbeispiel für gleichwertige Terme`);
      } else {
        pruefe(gw, `${wo}: in allen Zeilen gleich, aber die Terme sind nicht gleichwertig — die Tabelle wäre irreführend`);
        pruefe(/kein Beweis/.test(z.text) && !/sind gleichwertig/.test(z.text), `${wo}: bei lauter gleichen Werten behauptet die Seite mehr als einen Hinweis — „${z.text}“`);
      }
    }
  }
}

// ── Kontrollfragen ────────────────────────────────────────────────────────

async function quizze(page) {
  const ids = await page.evaluate(() => [...document.querySelectorAll(".quiz")].map((e) => e.id));
  pruefe(ids.length === 4, `Kontrollfragen: ${ids.length} statt 4`);
  for (const sec of ["sec-muster", "sec-rechenbaum", "sec-termwert", "sec-gleichwertig"]) {
    pruefe(await page.evaluate((s) => document.querySelectorAll(`#${s} .quiz`).length === 1, sec), `Kontrollfragen: ${sec} hat nicht genau eine`);
  }
  // Richtig ist, was hier nachgerechnet richtig ist.
  const RICHTIG = {
    "quiz-muster": (o) => /^[n\d +()·−]+$/.test(o) && P.gleichwertig(o.replace(/·/g, "*"), "3n + 1", ["n"]),
    "quiz-rechenbaum": (o) => o === "(3x − 4) : 2",
    "quiz-termwert": (o) => zahl(o) === P.wert("x² − 3x", { x: -2 }),
    "quiz-gleichwertig": (o) => /nicht gleichwertig/.test(o) && /x = 0/.test(o) && P.wert("x² + 2", { x: 0 }) !== P.wert("3x", { x: 0 }),
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

// Die Zeichnung eines Musters: Hölzchen je Figur.
async function musterFigur(page, box) {
  return page.evaluate((sel) => {
    const svg = document.querySelector(`${sel} .aufgabe-prompt svg[data-figur="muster"]`);
    if (!svg) return null;
    // Je Figurnummer gezählt; gezeigt werden drei aufeinanderfolgende Figuren, nicht immer ab Figur 1.
    const zaehl = {};
    for (const l of svg.querySelectorAll('[data-rolle="holz"]')) zaehl[l.dataset.figur] = (zaehl[l.dataset.figur] || 0) + 1;
    const nummern = Object.keys(zaehl).map(Number).sort((a, b) => a - b);
    const je = nummern.map((n) => zaehl[n]);
    // Liegen zwei Hölzchen derselben Figur aufeinander, wäre die Zählung wertlos.
    const lagen = [...svg.querySelectorAll('[data-rolle="holz"]')].map((l) => [l.dataset.figur, ...["x1", "y1", "x2", "y2"].map((a) => Number(l.getAttribute(a)).toFixed(0))].join(","));
    return { je, nummern, doppelt: lagen.length !== new Set(lagen).size };
  }, box);
}
// Ein Termfeld des Prüflings: der Term und Varianten, die die Seite als gleichwertig anerkennen muss.
const varianten = (a, b, v) => [`${b} + ${a}${v}`, `${a + b} + ${a}(${v} − 1)`, `${a}·${v} + ${b}`];

// Die Schranken für `mindestensVerschieden` sind gemessen (tests/werkzeug-streuung.js, 20 Züge):
// A1 n ≈ 1177, A2 n ≈ 101, A3 n ≈ 10 (gemessen für 40 Züge), A4 n ≈ 218, A5 n ≈ 321, A6 n ≈ 16,
// A7 n ≈ 102, A8 n ≈ 643.
const SCHRANKE = [17, 13, 6, 14, 15, 6, 13, 16];
const RUNDEN = 20;

async function aufgaben(page) {
  await pruefeAufgabe(page, bericht, {
    nr: 1, name: "A1 Termwert", runden: RUNDEN, mindestensVerschieden: SCHRANKE[0],
    deute: (frage) => {
      const m = frage.match(/Termwert von (.+) für x = ([−\d]+)\./);
      if (!m) return null;
      const term = m[1], v = zahl(m[2]);
      const f = (x) => P.wert(term, { x });
      // Koeffizienten aus drei Werten zurückgerechnet: c = f(0), a ± b aus f(1) und f(−1).
      const c = f(0), a = (f(1) + f(-1)) / 2 - c, b = (f(1) - f(-1)) / 2;
      const richtig = f(v);
      return {
        richtig, toleranz: 0.5,
        falsch: [[v < 0 ? -a * v * v + b * v + c : NaN, "Quadrat einer negativen Zahl"], [a * v * v - b * v + c, "Vorzeichen"], [a * a * v * v + b * v + c, "Erst quadrieren"]],
        pruefe: (f2, r) => pruefe(r.includes(de(richtig)), `A1: das Ergebnis ${de(richtig)} fehlt in der Musterlösung — „${f2}“`),
      };
    },
  });

  // A2: Hier selbst übersetzt.
  const A2 = [
    [/^das ([A-Za-zäöüß]+) einer Zahl, vermindert um (\d+)$/, (a, b) => `${a}x − ${b}`, (a, b) => `${a}(x − ${b})`, "Punkt geht vor Strich"],
    [/^das ([A-Za-zäöüß]+) der um (\d+) verminderten Zahl$/, (a, b) => `${a}(x − ${b})`, (a, b) => `${a}x − ${b}`, "Klammer"],
    [/^die Summe aus dem ([A-Za-zäöüß]+)n einer Zahl und (\d+)$/, (a, b) => `${a}x + ${b}`, (a, b) => `${a}(x + ${b})`, "letzte Schritt"],
    [/^das ([A-Za-zäöüß]+) der Summe aus einer Zahl und (\d+)$/, (a, b) => `${a}(x + ${b})`, (a, b) => `${a}x + ${b}`, "Klammern"],
    [/^das Quadrat der um (\d+) vermehrten Zahl$/, (a, b) => `(x + ${b})²`, (a, b) => `x² + ${b}`, "Klammern"],
    [/^die um (\d+) vermehrte Quadratzahl einer Zahl$/, (a, b) => `x² + ${b}`, (a, b) => `(x + ${b})²`, "Erst wird die Zahl quadriert"],
    [/^die Differenz aus (\d+) und dem ([A-Za-zäöüß]+)n einer Zahl$/, (a, b) => `${b} − ${a}x`, (a, b) => `${a}x − ${b}`, "A vorn"],
  ];
  const FAKTOR = { Doppelte: 2, Dreifache: 3, Vierfache: 4, Fünffache: 5, Sechsfache: 6 };
  await pruefeAufgabe(page, bericht, {
    nr: 2, name: "A2 Worte → Term", runden: RUNDEN, mindestensVerschieden: SCHRANKE[1],
    deute: (frage) => {
      const m = frage.match(/„(.+)“/);
      if (!m) return null;
      for (const [re, soll, falsch, muster] of A2) {
        const t = m[1].match(re);
        if (!t) continue;
        let a = null, b;
        if (/^die Differenz/.test(m[1])) { b = Number(t[1]); a = FAKTOR[t[2]]; }
        else if (/Quadrat/.test(m[1])) { b = Number(t[1]); }
        else { a = FAKTOR[t[1]]; b = Number(t[2]); }
        // Die Lösung wird in einer zweiten, gleichwertigen Schreibweise eingetippt, wo es eine gibt.
        const richtig = soll(a, b).replace(/(\d)\(x − (\d+)\)/, (_, k, c) => `${k}x − ${k * c}`);
        pruefe(P.gleichwertig(richtig, soll(a, b), ["x"]), `A2: die Prüfung selbst hat sich verrechnet (${richtig})`);
        return { richtig, falsch: [[falsch(a, b), muster]], pruefe: (f2, r) => pruefe(P.gleichwertig(r.match(/Term: (.+?)$/m)?.[1] || "0", soll(a, b), ["x"]), `A2: die Musterlösung nennt nicht ${soll(a, b)} — „${f2}“`) };
      }
      return null;
    },
  });

  await pruefeAufgabe(page, bericht, {
    // 40 statt 20 Züge: Es gibt nur zehn Muster samt Startfigur, und jedes soll sicher einmal drankommen.
    nr: 3, name: "A3 Muster → Term", runden: 40, mindestensVerschieden: SCHRANKE[2], liesRoh: musterFigur,
    deute: (frage, roh) => {
      if (!roh) return null;
      pruefe(!roh.doppelt, `A3: in der Zeichnung liegen Hölzchen doppelt — „${frage}“`);
      const [h1, h2, h3] = roh.je;
      const k = roh.nummern[0];
      pruefe(roh.je.length === 3 && roh.nummern[2] === k + 2, `A3: nicht drei aufeinanderfolgende Figuren (${roh.nummern}) — „${frage}“`);
      pruefe(frage.includes(`die Figuren ${k}, ${k + 1} und ${k + 2}`), `A3: der Text nennt andere Figuren als die Zeichnung (${roh.nummern}) — „${frage}“`);
      pruefe(h3 - h2 === h2 - h1 && h2 > h1, `A3: das Muster wächst nicht gleichmäßig (${roh.je}) — „${frage}“`);
      // Figur k hat a · k + b Hölzchen.
      const a = h2 - h1, b = h1 - a * k;
      return {
        richtig: varianten(a, b, "n")[1],
        // Jedes Teil voll gezählt — je nach Muster ein Quadrat, ein Dreieck, ein Haus oder eine Spalte.
        falsch: [[`${a + b}n`, "nur einmal"]],
        pruefe: (f2, r) => pruefe(r.includes(`${a} · n + ${b}`), `A3: die Musterlösung nennt nicht ${a} · n + ${b} — „${f2}“`),
      };
    },
  });

  await pruefeAufgabe(page, bericht, {
    nr: 4, name: "A4 Wertetabelle", runden: RUNDEN, mindestensVerschieden: SCHRANKE[3],
    deute: (frage) => {
      const m = frage.match(/für den Term (.+?) aus\. x = (.+)$/);
      if (!m) return null;
      const term = m[1];
      const xs = m[2].split("| x =").map((s) => zahl(s.trim()));
      return { felder: xs.map((x) => P.wert(term, { x })), falschFelder: xs.map((x, i) => [i, P.wert(term, { x }) + 1, null]) };
    },
  });

  await pruefeAufgabe(page, bericht, {
    nr: 5, name: "A5 Sachsituation", runden: RUNDEN, mindestensVerschieden: SCHRANKE[4],
    deute: (frage) => {
      let m = frage.match(/([\d,]+) € (?:Grundgebühr|beim Einsteigen) und ([\d,]+) € je (Stunde|gefahrenen Kilometer).*?(?:von|über) ([\d,]+) (?:Stunden|km)/);
      let g, p, s, v, ab = false;
      if (m) { g = zahl(m[1]); p = zahl(m[2]); s = zahl(m[4]); v = m[3] === "Stunde" ? "t" : "k"; }
      else {
        m = frage.match(/ist ([\d,]+) cm hoch und brennt in jeder Stunde ([\d,]+) cm herunter.*?nach ([\d,]+) Stunden/);
        if (!m) return null;
        g = zahl(m[1]); p = zahl(m[2]); s = zahl(m[3]); v = "t"; ab = true;
      }
      const term = ab ? `${String(g).replace(".", ",")} − ${String(p).replace(".", ",")}${v}` : `${String(p).replace(".", ",")}${v} + ${String(g).replace(".", ",")}`;
      const w = ab ? g - p * s : g + p * s;
      return {
        felder: [term, w],
        falschFelder: ab ? [[0, `${String(g).replace(".", ",")} + ${String(p).replace(".", ",")}${v}`, "abgezogen"], [1, g + p * s, "abziehen"]]
          : [[0, `${String(p).replace(".", ",")} + ${String(g).replace(".", ",")}${v}`, "Vertauscht"], [1, g * s + p, "Vertauscht"]],
      };
    },
  });

  await pruefeAufgabe(page, bericht, {
    nr: 6, name: "A6 Gegenbeispiel", runden: RUNDEN, mindestensVerschieden: SCHRANKE[5],
    deute: (frage) => {
      const m = frage.match(/Sind die Terme (.+?) und (.+?) gleichwertig\?/);
      if (!m) return null;
      const [a, b] = [m[1], m[2]];
      pruefe(!P.gleichwertig(a, b, ["x"]), `A6: die Terme ${a} und ${b} sind gleichwertig — „${frage}“`);
      const ganz = Array.from({ length: 21 }, (_, i) => i - 10);
      const gegen = ganz.find((x) => P.wert(a, { x }) !== P.wert(b, { x }));
      const gleich = ganz.filter((x) => P.wert(a, { x }) === P.wert(b, { x }));
      return { richtig: gegen, toleranz: 0.1, falsch: gleich.map((x) => [x, "kein Gegenbeispiel"]) };
    },
  });

  await pruefeAufgabe(page, bericht, {
    nr: 7, name: "A7 Muster vorwärts und rückwärts", runden: RUNDEN, mindestensVerschieden: SCHRANKE[6], liesRoh: musterFigur,
    deute: (frage, roh) => {
      const m = frage.match(/Figur (\d+)\?.*?genau (\d+) Hölzchen/);
      if (!m || !roh) return null;
      const [h1, h2] = roh.je;
      const a = h2 - h1, b = h1 - a;
      const N = Number(m[1]), M = Number(m[2]);
      pruefe((M - b) % a === 0, `A7: keine Figur hat genau ${M} Hölzchen — „${frage}“`);
      return { felder: [a * N + b, (M - b) / a], falschFelder: [[0, (a + b) * N, "nur einmal"], [0, a * N, "fehlen"], [1, M / a, "abziehen"]] };
    },
  });

  await pruefeAufgabe(page, bericht, {
    nr: 8, name: "A8 Zahlentrick", runden: RUNDEN, mindestensVerschieden: SCHRANKE[7],
    deute: (frage) => {
      const m = frage.match(/Addiere (\d+)\. ([A-Za-zäöüß]+) das Ergebnis\. Ziehe (\d+) ab\..*?am Ende (\d+)\./);
      if (!m) return null;
      const MAL = { Verdopple: 2, Verdreifache: 3, Vervierfache: 4, Verfünffache: 5 };
      const a = Number(m[1]), k = MAL[m[2]], b = Number(m[3]), R = Number(m[4]);
      const x = (R + b) / k - a;
      pruefe(Number.isInteger(x), `A8: die gedachte Zahl wäre ${x} — „${frage}“`);
      // Die Lösung ausmultipliziert eingetippt: Auch diese Form muss gelten.
      const c = k * a - b;
      const falsch2 = (R - b) / k - a;
      return {
        felder: [`${k}x ${c < 0 ? "−" : "+"} ${Math.abs(c)}`, x],
        // Ein Fehlerwert, der keine ganze Zahl ist, ließe sich nur gerundet eintippen — dann träfe er
        // den Hinweis der Seite nicht mehr genau.
        falschFelder: [[0, `${k}x + ${a} − ${b}`, "Klammern"], [1, Number.isInteger(falsch2) ? falsch2 : NaN, "addiere"]],
      };
    },
  });
}

// ── Gerüst ────────────────────────────────────────────────────────────────

async function geruest(page) {
  const folge = await page.evaluate(() => [...document.querySelectorAll("main section[id]")].map((s) => s.id));
  const soll = ["sec-muster", "sec-rechenbaum", "sec-termwert", "sec-gleichwertig", "sec-vernetzung", "sec-formelsammlung", "sec-uebungen", "sec-selbsteinschaetzung"];
  pruefe(JSON.stringify(folge) === JSON.stringify(soll), `Gerüst: Abschnitte ${folge.join(", ")} statt ${soll.join(", ")}`);
  // Kein Vorgriff: Umgeformt wird erst in Thema 2.
  for (const id of ["sec-muster", "sec-rechenbaum", "sec-termwert", "sec-gleichwertig"]) {
    const t = await page.evaluate((i) => { const e = document.getElementById(i).cloneNode(true); e.querySelectorAll(".uebung-sprung, .quiz").forEach((x) => x.remove()); return e.innerText; }, id);
    pruefe(!/ausmultipl|ausklammer|zusammenfass|Distributiv|binomisch/i.test(t), `Gerüst: ${id} greift auf das Umformen vor`);
  }
  // Formelsammlung: der gemeinsame Verweis und die Datei.
  const verweis = await page.evaluate(() => { const a = document.querySelector("#sec-formelsammlung a[download]"); return a && a.getAttribute("href"); });
  pruefe(verweis === "formelsammlung.pdf", `Formelsammlung: Verweis auf „${verweis}“`);
  const pdf = path.join(WURZEL, "mathematik/klasse-8/terme/formelsammlung.pdf");
  pruefe(fs.existsSync(pdf) && fs.readFileSync(pdf).subarray(0, 5).toString("latin1") === "%PDF-", "Formelsammlung: formelsammlung.pdf fehlt oder ist kein PDF");
  // Verweise mit Sprungmarke.
  const links = await page.evaluate(() => [...document.querySelectorAll("main a[href]")].map((a) => a.getAttribute("href")).filter((h) => !h.startsWith("#") && !h.startsWith("http")));
  for (const href of new Set(links)) {
    const ziel = new URL(href.split("#")[0], "http://localhost/mathematik/klasse-8/terme/").pathname;
    const antwort = await page.request.get("http://localhost:" + (process.env.UPLANT_PORT || "8936") + ziel);
    pruefe(antwort.ok(), `Gerüst: der Verweis „${href}“ führt ins Leere`);
    const anker = href.split("#")[1];
    if (anker && antwort.ok() && /\.html$/.test(ziel)) pruefe((await antwort.text()).includes(`id="${anker}"`), `Gerüst: die Sprungmarke „${anker}“ fehlt in ${ziel}`);
  }
  // Menü: Karte in Terme und die Karte „Terme“ in Klasse 8.
  const menue = fs.readFileSync(path.join(WURZEL, "mathematik/klasse-8/terme/index.html"), "utf8");
  const karte = menue.match(/<a class="menu-card"[^>]*href="terme-aufstellen\.html"[^>]*>\s*<h2>([^<]*)<\/h2>/);
  pruefe(!!karte && /data-section="klasse-8"/.test(karte[0]) && /\shidden\b/.test(karte[0]) && karte[1] === "1. Terme aufstellen und Termwerte berechnen", `Gerüst: die Menükarte fehlt oder ist unvollständig`);
  const k8 = fs.readFileSync(path.join(WURZEL, "mathematik/klasse-8/index.html"), "utf8");
  pruefe(/<a class="menu-card" data-section="klasse-8" href="terme\/index\.html" hidden>/.test(k8), "Gerüst: Klasse 8 hat keine Menükarte „Terme“");
  // Acht Aufgaben, zwei je Stufe.
  const proStufe = await page.evaluate(() => [...document.querySelectorAll("#exercises-mount .schwierigkeit-tabs button")].map((t) => { t.click(); return document.querySelectorAll("#exercises-mount .schwierigkeit-tab-panel .aufgabe-box").length; }));
  pruefe(JSON.stringify(proStufe) === "[2,2,2,2]", `Gerüst: die Stufen haben ${proStufe.join("/")} Aufgaben statt 2/2/2/2`);
}

(async () => {
  const browser = await starteBrowser();
  for (const dunkel of [false, true]) {
    const wo = dunkel ? "dunkel" : "hell";
    const page = await neueSeite(browser, { dunkel });
    await oeffne(page, SEITE);
    if (!dunkel) {
      if (will("geruest")) await geruest(page);
      if (will("muster")) await muster(page);
      if (will("baum")) await baum(page);
      if (will("tabelle")) await tabelle(page);
      if (will("gleichwertig")) await gleichwertig(page);
      if (will("quizze")) await quizze(page);
      if (will("aufgaben")) await aufgaben(page);
    } else if (will("dunkel")) {
      await setzeRegler(page, "sm-t", 100);
      await pruefeKontrast(page, bericht, "dunkel");
      // Jede Zählweise färbt ihre Gruppen anders — alle drei müssen auf dunklem Grund sichtbar sein.
      for (const art of ["a", "b", "c"]) {
        await waehle(page, "sm-art", art);
        await pruefeStrichKontrast(page, bericht, `dunkel, Zählweise ${art}`, "#sm-mount [data-rolle=holz]");
      }
    }
    await pruefeNotation(page, bericht, wo);
    for (const s of page.stoerungen) pruefe(false, `${wo}: ${s}`);
    await page.close();
  }
  await browser.close();
  bericht.abschluss();
})();
