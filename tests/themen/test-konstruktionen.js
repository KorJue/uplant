// Fachliche Prüfung: Kapitel 2, Thema 6 „Konstruktionen“.
//
// Die Dreiecksungleichung wird hier von beiden Rändern her geprüft: Die
// kürzeste zulässige dritte Seite, die Anzahl der möglichen ganzzahligen
// Seiten — und dazu das gleichschenklige Dreieck sowie die Winkelhalbierende.

"use strict";

const { neuerBericht } = require("../lib/pruefen");
const { starteBrowser, neueSeite, oeffne } = require("../lib/seite");
const { pruefeNotation } = require("../lib/notation");
const { pruefeKontrast } = require("../lib/kontrast");
const { pruefeAufgabe } = require("../lib/aufgaben");

const bericht = neuerBericht();
const { pruefe } = bericht;
const SEITE = "/mathematik/grundwissen-5-10/02-geometrie/06-konstruktionen/index.html";

async function aufgaben(page) {
  // Aufgabe 1 — kürzeste ganzzahlige dritte Seite. 12 × 12 Paare ohne a = b.
  await pruefeAufgabe(page, bericht, {
    nr: 1, name: "A1 Dreiecksungleichung", runden: 30, mindestensVerschieden: 22,
    deute: (frage) => {
      const m = frage.match(/a = (\d+) cm.*?b = (\d+) cm/);
      if (!m) return null;
      const a = Number(m[1]), b = Number(m[2]);
      pruefe(a !== b, `A1: a und b sind beide ${a} cm — dann ist die Schranke 1 und die Aufgabe stumpf`);
      return {
        richtig: Math.abs(a - b) + 1,
        toleranz: 0.02,
        falsch: [
          [Math.abs(a - b), "eine Strecke"],
          [a + b, "Summe"],
          [a + b - 1, "längste"],
          [1, "So kurz darf c nicht sein"],
        ],
      };
    },
  });

  // Aufgabe 2 — gleichschenkliges Dreieck: Basis- und Spitzenwinkel.
  await pruefeAufgabe(page, bericht, {
    nr: 2, name: "A2 gleichschenklig", runden: 30, mindestensVerschieden: 10,
    deute: (frage) => {
      const nachSpitze = frage.includes("Basiswinkel") && frage.includes("Spitze</strong>") === false
        && /Basiswinkel (\d+)°/.test(frage);
      const mb = frage.match(/Basiswinkel (\d+)°/);
      const ms = frage.match(/Spitze (\d+)°/);
      if (mb) {
        const basis = Number(mb[1]);
        const spitze = 180 - 2 * basis;
        return {
          richtig: spitze,
          toleranz: 0.02,
          falsch: [
            [basis, "schon gegeben war"],
            // Nur einen der beiden gleich großen Basiswinkel abgezogen.
            [180 - basis, "beide"],
          ],
        };
      }
      if (ms) {
        const spitze = Number(ms[1]);
        const basis = (180 - spitze) / 2;
        return {
          richtig: basis,
          toleranz: 0.02,
          falsch: [
            [spitze, "schon gegeben war"],
            // Beide Basiswinkel zusammen statt eines.
            [180 - spitze, "durch 2 teilen"],
          ],
        };
      }
      return null;
    },
  });

  // Aufgabe 3 — Anzahl der ganzzahligen dritten Seiten: 2·min(a, b) − 1.
  await pruefeAufgabe(page, bericht, {
    nr: 3, name: "A3 Anzahl der Möglichkeiten", runden: 30, mindestensVerschieden: 22,
    deute: (frage) => {
      const m = frage.match(/a = (\d+) cm.*?b = (\d+) cm/);
      if (!m) return null;
      const a = Number(m[1]), b = Number(m[2]);
      const anzahl = 2 * Math.min(a, b) - 1;
      pruefe(anzahl === (a + b - 1) - (Math.abs(a - b) + 1) + 1,
        `A3: die Zählformel stimmt nicht für a = ${a}, b = ${b}`);
      return {
        richtig: anzahl,
        toleranz: 0.02,
        falsch: [
          [anzahl + 1, "eine Grenze zu viel"],
          [anzahl + 2, "Beide Randwerte"],
          [a + b - 1, "größte"],
          [a + b, "Das ist a + b"],
        ],
      };
    },
  });

  // Aufgabe 4 — Winkelhalbierende: ∠ADC = 180° − α − γ/2.
  await pruefeAufgabe(page, bericht, {
    nr: 4, name: "A4 Winkelhalbierende", runden: 30, mindestensVerschieden: 22,
    deute: (frage) => {
      const m = frage.match(/α = (\d+)° und γ = (\d+)°/);
      if (!m) return null;
      const alpha = Number(m[1]), gamma = Number(m[2]);
      const halb = gamma / 2;
      return {
        richtig: 180 - alpha - halb,
        toleranz: 0.02,
        falsch: [
          [halb, "halbe Winkel γ"],
          [180 - alpha - gamma, "das ganze γ"],
          [alpha + halb, "addiert"],
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
