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
  // Aufgabe 1 — Summe mit mindestens einem negativen Summanden. Gemessen mit
  // tests/werkzeug-streuung.js: 161 verschiedene in 200 Würfen, zurückgerechnet also rund 442
  // Kandidaten. Die Schranke ist das simulierte 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für
  // 0,8 · n gerechnet — 24.
  await pruefeAufgabe(page, bericht, {
    nr: 1, name: "A1 Summe", runden: 30, mindestensVerschieden: 24,
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

  // Aufgabe 5 — Subtraktion einer negativen Zahl: die Stelle, an der aus zwei Minuszeichen ein
  // Plus wird. Gemessen mit tests/werkzeug-streuung.js: 141 verschiedene in 200 Würfen,
  // zurückgerechnet also rund 267 Kandidaten. Die Schranke ist das simulierte 10⁻⁴-Quantil bei
  // 30 Zügen, vorsichtshalber für 0,8 · n gerechnet — 22.
  await pruefeAufgabe(page, bericht, {
    nr: 3, name: "A3 Minus vor Minus", runden: 30, mindestensVerschieden: 22,
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
    nr: 5, name: "A5 Vorzeichen im Produkt", runden: 30, mindestensVerschieden: 24,
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

  // Aufgabe 4 — Sachaufgabe: erst hinunter, dann hinauf. Gemessen mit
  // tests/werkzeug-streuung.js: 199 verschiedene in 200 Würfen, zurückgerechnet also rund 19834
  // Kandidaten. Die Schranke ist das simulierte 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für
  // 0,8 · n gerechnet — 27.
  await pruefeAufgabe(page, bericht, {
    nr: 7, name: "A7 Sachaufgabe", runden: 30, mindestensVerschieden: 27,
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

  // Aufgabe 2 — Betrag und Gegenzahl (Aufgabe zum Ausfüllen). Gemessen mit
  // tests/werkzeug-streuung.js: 71 verschiedene in 200 Würfen, zurückgerechnet rund 77 Kandidaten
  // (2 · 39 Zahlen = 78). Die Schranke ist das simulierte 10⁻⁴-Quantil bei 30 Zügen,
  // vorsichtshalber für 0,8 · n gerechnet — 17.
  await pruefeAufgabe(page, bericht, {
    nr: 2, name: "A2 Betrag und Gegenzahl", runden: 30, mindestensVerschieden: 17,
    deute: (frage) => {
      const m = frage.match(/die Zahl (−?-?\d+)/);
      if (!m) return null;
      const n = Number(m[1].replace("−", "-"));
      pruefe(n !== 0, "A2: die Null taugt nicht — Gegenzahl und Betrag fielen zusammen");
      return {
        felder: [-n, Math.abs(n)],
        falschFelder: [
          [0, n, "Zahl selbst"],
          [1, -Math.abs(n), "nie negativ"],
        ],
      };
    },
  });

  // Aufgabe 4 — ordnen. Gemessen mit tests/werkzeug-streuung.js: in 200 Würfen kein einziges
  // Doppel (56 Zahlen, aus denen vier verschiedene gezogen werden). Die Schranke ist das
  // simulierte 10⁻⁴-Quantil bei 30 Zügen — 27.
  await pruefeAufgabe(page, bericht, {
    nr: 4, name: "A4 ordnen", runden: 30, mindestensVerschieden: 27,
    deute: (frage) => {
      const m = frage.match(/kleinste\?\s*(.+)$/);
      if (!m) return null;
      const zahlen = (m[1].match(/−?-?\d+/g) || []).map((x) => Number(x.replace("−", "-")));
      if (zahlen.length !== 4) return null;
      pruefe(new Set(zahlen).size === 4, `A4: die vier Zahlen sind nicht paarweise verschieden — ${zahlen.join(", ")}`);
      const betragsgroesste = zahlen.reduce((a, b) => (Math.abs(a) >= Math.abs(b) ? a : b));
      return {
        richtig: Math.min(...zahlen),
        falsch: [
          [Math.max(...zahlen), "größte"],
          [betragsgroesste !== Math.min(...zahlen) ? betragsgroesste : null, "Betrag"],
        ],
      };
    },
  });

  // Aufgabe 6 — Punkt vor Strich in ℤ. Gemessen mit tests/werkzeug-streuung.js: 198 verschiedene
  // in 200 Würfen, zurückgerechnet rund 9900 Kandidaten. Die Schranke ist das simulierte
  // 10⁻⁴-Quantil bei 30 Zügen — 27.
  await pruefeAufgabe(page, bericht, {
    nr: 6, name: "A6 Punkt vor Strich in ℤ", runden: 30, mindestensVerschieden: 27,
    deute: (frage) => {
      // Klammern stehen nur um negative Zahlen — die Prüfung darf sie deshalb nicht verlangen.
      const m = frage.match(/Berechne: (−?-?\d+) · \(?(−?-?\d+)\)? \+ \(?(−?-?\d+)\)?/);
      if (!m) return null;
      const [a, b, c] = m.slice(1).map((x) => Number(x.replace("−", "-")));
      return {
        richtig: a * b + c,
        falsch: [
          [a * (b + c), "Punkt vor Strich"],
          [-a * b + c, "Vorzeichen"],
        ],
      };
    },
  });

  // Aufgabe 8 — ein Verlauf mit Höchst- und Tiefstwert (Aufgabe zum Ausfüllen). Gemessen mit
  // tests/werkzeug-streuung.js: in 200 Würfen kein einziges Doppel (25 · 13 · 17 · 13 · 3
  // Möglichkeiten). Die Schranke ist das simulierte 10⁻⁴-Quantil bei 30 Zügen — 27.
  await pruefeAufgabe(page, bericht, {
    nr: 8, name: "A8 Verlauf", runden: 30, mindestensVerschieden: 27,
    deute: (frage) => {
      const zahlenImText = (frage.match(/−?-?\d+/g) || []).map((x) => Number(x.replace("−", "-")));
      if (zahlenImText.length < 4) return null;
      const [start, s1, s2, s3] = zahlenImText;
      const v1 = start + s1, v2 = v1 - s2, v3 = v2 - s3;
      const alle = [start, v1, v2, v3];
      const tief = Math.min(...alle), hoch = Math.max(...alle);
      return {
        felder: [v3, tief, hoch - tief],
        falschFelder: [
          [0, start + s1 + s2 + s3, "abgezogen"],
          [1, hoch, "höchste"],
          [2, tief - hoch, "nie negativ"],
        ],
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
