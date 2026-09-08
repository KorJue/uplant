// Fachliche Prüfung: Kapitel 2, Thema 7 „Flächenberechnungen“.
//
// Zwei Fallen tragen das Thema: die schräge Seite statt der Höhe zu nehmen und
// die Halbierung zu vergessen (oder eine zu viel zu machen). Beide werden in
// jeder Fassung eigens ausgelöst.

"use strict";

const { neuerBericht } = require("../lib/pruefen");
const { starteBrowser, neueSeite, oeffne } = require("../lib/seite");
const { pruefeNotation } = require("../lib/notation");
const { pruefeKontrast } = require("../lib/kontrast");
const { pruefeAufgabe } = require("../lib/aufgaben");

const bericht = neuerBericht();
const { pruefe } = bericht;
const SEITE = "/mathematik/grundwissen-5-10/02-geometrie/07-flaechenberechnungen/index.html";

async function aufgaben(page) {
  // Aufgabe 1 — Dreieck oder Parallelogramm, mit einer schrägen Seite als
  // Ablenkung. 12 Grundseiten × je mehrere Höhen × 2 Figuren.
  await pruefeAufgabe(page, bericht, {
    nr: 1, name: "A1 Dreieck und Parallelogramm", runden: 30, mindestensVerschieden: 24,
    deute: (frage) => {
      const m = frage.match(/(Dreieck|Parallelogramm) hat die Grundseite g = (\d+) cm.*?Höhe h = (\d+) cm.*?schräge Seite ist (\d+) cm/);
      if (!m) return null;
      const dreieck = m[1] === "Dreieck";
      const [g, h, b] = m.slice(2).map(Number);
      return {
        richtig: dreieck ? (g * h) / 2 : g * h,
        toleranz: 0.02,
        // In der Reihenfolge, in der die Seite ihre Hinweise prüft.
        falsch: [
          [dreieck ? (g * b) / 2 : g * b, "schrägen Seite"],
          [dreieck ? g * h : (g * h) / 2, dreieck ? "Parallelogramms" : "halbiert"],
          [2 * (g + h), "Umfang"],
        ],
      };
    },
  });

  // Aufgabe 2 — Trapez.
  await pruefeAufgabe(page, bericht, {
    nr: 2, name: "A2 Trapez", runden: 30, mindestensVerschieden: 25,
    deute: (frage) => {
      const m = frage.match(/a = (\d+) cm und c = (\d+) cm.*?h = (\d+) cm/);
      if (!m) return null;
      const [a, c, h] = m.slice(1).map(Number);
      return {
        richtig: ((a + c) * h) / 2,
        toleranz: 0.02,
        // In der Reihenfolge der Hinweiskette der Seite. (a · h) : 2 gehört
        // dazu, obwohl es scheinbar nur eine Variante von a · h ist: für
        // a = 6, c = 2, h = 4 fällt es mit a + c + h zusammen, und ohne
        // diesen Eintrag verlangte der Test dort den späteren Hinweis.
        falsch: [
          [(a + c) * h, "Halbierung vergessen"],
          [a * h, "nur mit a"],
          [(a * h) / 2, "das wäre ein Dreieck"],
          [a + c + h, "addiert"],
        ],
      };
    },
  });

  // Aufgabe 3 — rückwärts: aus der Fläche eine Länge bestimmen.
  await pruefeAufgabe(page, bericht, {
    nr: 3, name: "A3 rückwärts", runden: 30, mindestensVerschieden: 24,
    deute: (frage) => {
      const tz = frage.match(/Trapez hat den Flächeninhalt A = (\d+) cm².*?h = (\d+) cm.*?a = (\d+) cm/);
      if (tz) {
        const [A, h, a] = tz.slice(1).map(Number);
        const summe = (2 * A) / h;
        return {
          richtig: summe - a,
          toleranz: 0.02,
          falsch: [
            [summe, "a + c"],
            [summe - 2 * a, "zweimal abgezogen"],
            [A / h, "Halbierung vergessen"],
          ],
        };
      }
      const dp = frage.match(/(Dreieck|Parallelogramm) hat den Flächeninhalt A = (\d+) cm².*?g = (\d+) cm/);
      if (!dp) return null;
      const dreieck = dp[1] === "Dreieck";
      const A = Number(dp[2]), g = Number(dp[3]);
      return {
        richtig: dreieck ? (2 * A) / g : A / g,
        toleranz: 0.02,
        falsch: [
          [dreieck ? A / g : (2 * A) / g, dreieck ? "Halbierung vergessen" : "keine Halbierung"],
          [A - g, "subtrahieren"],
          [A * g, "multipliziert"],
        ],
      };
    },
  });

  // Aufgabe 4 — Hauswand aus Rechteck und Giebeldreieck.
  await pruefeAufgabe(page, bericht, {
    nr: 4, name: "A4 Hauswand", runden: 30, mindestensVerschieden: 26,
    deute: (frage) => {
      const m = frage.match(/Rechteck ist (\d+) m breit und (\d+) m hoch.*?Höhe (\d+) m.*?(\d+) € je Quadratmeter/);
      if (!m) return null;
      const [b, hR, hD, preis] = m.slice(1).map(Number);
      const flRechteck = b * hR, flGiebel = (b * hD) / 2;
      return {
        richtig: (flRechteck + flGiebel) * preis,
        toleranz: 0.02,
        falsch: [
          [(flRechteck + b * hD) * preis, "Halbierung"],
          [flRechteck * preis, "nur das Rechteck"],
          [flGiebel * preis, "nur das Giebeldreieck"],
          [flRechteck + flGiebel, "der Preis"],
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
