// Fachliche Prüfung: Kapitel 1, Thema 6 „Erweiterung des Zahlenbereichs“.
//
// Hier entscheidet das Vorzeichen. Jede der vier Aufgaben bietet einen
// Fehlerhinweis an, und jeder wird eigens ausgelöst: addieren statt
// subtrahieren, zwei Minuszeichen zu einem zusammenziehen, das Vorzeichen
// eines Produkts falsch zählen und die Richtungen einer Sachaufgabe vertauschen.

"use strict";

const { neuerBericht } = require("../lib/pruefen");
const { starteBrowser, neueSeite, oeffne } = require("../lib/seite");
const { pruefeNotation } = require("../lib/notation");
const { pruefeKontrast } = require("../lib/kontrast");
const { pruefeAufgabe } = require("../lib/aufgaben");

const bericht = neuerBericht();
const { pruefe } = bericht;
const SEITE = "/mathematik/grundwissen-5-10/01-groessen-und-rechnen/06-erweiterung-des-zahlenbereichs/index.html";

// Der Aufgabentext benutzt das echte Minuszeichen und setzt negative Zahlen in
// Klammern: „−12 + (−5)“.
function zahlenAusTerm(text) {
  return (text.replace(/−/g, "-").match(/-?\d+/g) || []).map(Number);
}

async function aufgaben(page) {
  // Aufgabe 1 — Summe mit mindestens einem negativen Summanden.
  // 25 · 25 = 625 Paare, davon werden die rein positiven umgelenkt; bei 30
  // Zügen sind 30·29/(2·625) ≈ 0,70 Doppel zu erwarten (Poisson, σ = 0,83).
  await pruefeAufgabe(page, bericht, {
    nr: 1, name: "A1 Summe", runden: 30, mindestensVerschieden: 26,
    deute: (frage) => {
      const m = frage.replace(/−/g, "-").match(/Berechne: (-?\d+) \+ \(?(-?\d+)\)?/);
      if (!m) return null;
      const a = Number(m[1]), b = Number(m[2]);
      return {
        richtig: a + b,
        // Subtrahiert statt addiert — dafür hat die Aufgabe einen Hinweis.
        falsch: [[a - b, "Hier wird addiert"]],
      };
    },
  });

  // Aufgabe 2 — Subtraktion einer negativen Zahl: die Stelle, an der aus zwei
  // Minuszeichen ein Plus wird. 25 · 12 = 300 Paare.
  await pruefeAufgabe(page, bericht, {
    nr: 2, name: "A2 Minus vor Minus", runden: 30, mindestensVerschieden: 24,
    deute: (frage) => {
      const m = frage.replace(/−/g, "-").match(/Berechne: (-?\d+) - \((-?\d+)\)/);
      if (!m) return null;
      const a = Number(m[1]), b = Number(m[2]);
      return {
        richtig: a - b,
        // Die beiden Minuszeichen wie eines behandelt.
        falsch: [[a + b, "Subtrahieren heißt, die Gegenzahl zu addieren"]],
        pruefe: (f, rueck) => {
          pruefe(b < 0, `A2: der Subtrahend ${b} ist nicht negativ — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 3 — Vorzeichen eines dreifachen Produkts. 5·5·4 Beträge × 7
  // Vorzeichenmuster mit mindestens einem Minus.
  await pruefeAufgabe(page, bericht, {
    nr: 3, name: "A3 Vorzeichen im Produkt", runden: 30, mindestensVerschieden: 24,
    deute: (frage) => {
      const werte = zahlenAusTerm(frage);
      if (werte.length !== 3) return null;
      const erg = werte[0] * werte[1] * werte[2];
      const negativ = werte.filter((w) => w < 0).length;
      return {
        richtig: erg,
        // Nur das Vorzeichen verfehlt — genau darauf zielt der Hinweis.
        falsch: [[-erg, "Vorzeichen"]],
        pruefe: (f, rueck) => {
          // Der Zusammenhang selbst: ungerade viele negative Faktoren ⇒ negativ.
          pruefe((erg < 0) === (negativ % 2 === 1),
            `A3: ${negativ} negative Faktoren, aber das Ergebnis ist ${erg} — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 4 — Sachaufgabe: erst hinunter, dann hinauf.
  // 26 Startwerte × 16 × 19 × 3 Kontexte = 23 712 Kandidaten.
  await pruefeAufgabe(page, bericht, {
    nr: 4, name: "A4 Sachaufgabe", runden: 30, mindestensVerschieden: 28,
    deute: (frage) => {
      // Alle drei Kontexte nennen genau drei Zahlen in derselben Reihenfolge:
      // Ausgangswert, Abnahme, Zunahme. Ein Muster je Kontext wäre unnötig
      // zerbrechlich.
      const zahlenAlle = (frage.replace(/−/g, "-").match(/-?\d+/g) || []).map(Number);
      if (zahlenAlle.length !== 3) return null;
      const [start, x, y] = zahlenAlle;
      return {
        richtig: start - x + y,
        // Die Richtungen vertauscht.
        falsch: [[start + x - y, "Reihenfolge der Richtungen"]],
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
