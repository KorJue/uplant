// Fachliche Prüfung: Kapitel 1, Thema 2 „Rechnen mit natürlichen Zahlen“.
//
// Der Kern des Themas sind die Vorfahrtsregeln (Klammer vor Punkt vor Strich)
// und die Umkehraufgabe zur Subtraktion. Beides wird aus dem Aufgabentext
// heraus unabhängig nachgerechnet — einschließlich des Fehlers, den die
// Aufgabe abfragt: von links nach rechts zu rechnen.

"use strict";

const { neuerBericht } = require("../lib/pruefen");
const { starteBrowser, neueSeite, oeffne } = require("../lib/seite");
const { pruefeNotation } = require("../lib/notation");
const { pruefeKontrast } = require("../lib/kontrast");
const { pruefeAufgabe } = require("../lib/aufgaben");

const bericht = neuerBericht();
const { pruefe } = bericht;
const SEITE = "/mathematik/grundwissen-5-10/01-groessen-und-rechnen/02-rechnen-mit-natuerlichen-zahlen/index.html";

const ohnePunkte = (s) => Number(String(s).replace(/\./g, ""));

async function aufgaben(page) {
  // Aufgabe 1 — Vorfahrtsregeln. Gemessen mit tests/werkzeug-streuung.js: 182 verschiedene in
  // 200 Würfen, zurückgerechnet also rund 1039 Kandidaten. Die Schranke ist das simulierte
  // 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für 0,8 · n gerechnet — 26.
  await pruefeAufgabe(page, bericht, {
    nr: 1, name: "A1 Vorfahrtsregeln", runden: 30, mindestensVerschieden: 26,
    deute: (frage) => {
      const klammer = frage.match(/Berechne: \((\d+) \+ (\d+)\) · (\d+)/);
      if (klammer) {
        const [a, b, c] = klammer.slice(1).map(Number);
        return {
          richtig: (a + b) * c,
          // Wer die Klammer übersieht, rechnet Punkt vor Strich.
          falsch: [[a + b * c, null]],
        };
      }
      const ohne = frage.match(/Berechne: (\d+) \+ (\d+) · (\d+)/);
      if (!ohne) return null;
      const [a, b, c] = ohne.slice(1).map(Number);
      return {
        richtig: a + b * c,
        // Von links nach rechts gerechnet — der Fehler, vor dem die Regel schützt.
        falsch: [[(a + b) * c, null]],
      };
    },
  });

  // Aufgabe 2 — schriftliche Addition. Gemessen mit tests/werkzeug-streuung.js: in 200 Würfen
  // kein einziges Doppel, die Menge ist also viele Tausend groß. Die Schranke ist das
  // simulierte 10⁻⁴-Quantil bei 25 Zügen, vorsichtshalber für 0,8 · n gerechnet — 22.
  await pruefeAufgabe(page, bericht, {
    nr: 2, name: "A2 schriftliche Addition", runden: 25, mindestensVerschieden: 22,
    deute: (frage) => {
      const m = frage.match(/Berechne schriftlich: ([\d.]+) \+ ([\d.]+)/);
      if (!m) return null;
      const a = ohnePunkte(m[1]), b = ohnePunkte(m[2]);
      return {
        richtig: a + b,
        // Ohne Übertrag stellenweise addiert.
        falsch: [[Number(String(a).split("").map((z, i) => (Number(z) + Number(String(b)[i] || 0)) % 10).join("")), null]],
      };
    },
  });

  // Aufgabe 3 — Umkehraufgabe. Gemessen mit tests/werkzeug-streuung.js: in 200 Würfen kein
  // einziges Doppel, die Menge ist also viele Tausend groß. Die Schranke ist das simulierte
  // 10⁻⁴-Quantil bei 25 Zügen, vorsichtshalber für 0,8 · n gerechnet — 22.
  await pruefeAufgabe(page, bericht, {
    nr: 3, name: "A3 Subtrahend gesucht", runden: 25, mindestensVerschieden: 22,
    deute: (frage) => {
      const m = frage.match(/Minuend ([\d.]+), die Differenz ([\d.]+)/);
      if (!m) return null;
      const minuend = ohnePunkte(m[1]), differenz = ohnePunkte(m[2]);
      return {
        richtig: minuend - differenz,
        // Wer den Zusammenhang verdreht, addiert statt zu subtrahieren.
        falsch: [[minuend + differenz, null]],
        pruefe: (f, rueck) => {
          // Die Musterlösung führt eine Probe; sie muss den Minuenden nennen.
          pruefe(rueck.includes("Probe"), `A3: Musterlösung ohne Probe — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 4 — Sachaufgabe mit Rest. Gemessen mit tests/werkzeug-streuung.js: 197 verschiedene
  // in 200 Würfen, zurückgerechnet also rund 6567 Kandidaten. Die Schranke ist das simulierte
  // 10⁻⁴-Quantil bei 25 Zügen, vorsichtshalber für 0,8 · n gerechnet — 23.
  await pruefeAufgabe(page, bericht, {
    nr: 4, name: "A4 volle Packungen", runden: 25, mindestensVerschieden: 23,
    deute: (frage) => {
      const m = frage.match(/an (\d+) Tagen je (\d+) Teile\. (\d+) Teile davon sind fehlerhaft.*je (\d+) Stück/);
      if (!m) return null;
      const [tage, proTag, ausschuss, packung] = m.slice(1).map(Number);
      const gut = tage * proTag - ausschuss;
      return {
        richtig: Math.floor(gut / packung),
        // Aufgerundet statt abgeschnitten, und der Ausschuss vergessen.
        falsch: [[Math.ceil(gut / packung), null], [Math.floor(tage * proTag / packung), null]],
        pruefe: (f, rueck) => {
          const rest = gut % packung;
          pruefe(rueck.includes(`Rest ${rest}`),
            `A4: Musterlösung nennt den Rest ${rest} nicht — „${f}“`);
        },
      };
    },
  });
}

(async () => {
  const browser = await starteBrowser();
  for (const dunkel of [false, true]) {
    const wo = dunkel ? "dunkel" : "hell";
    const page = await neueSeite(browser, { dunkel });
    await oeffne(page, SEITE);
    if (!dunkel) await aufgaben(page);
    else await pruefeKontrast(page, bericht, "dunkel");
    await pruefeNotation(page, bericht, wo);
    for (const s of page.stoerungen) pruefe(false, `${wo}: ${s}`);
    await page.close();
  }
  await browser.close();
  bericht.abschluss();
})();
