// Fachliche Prüfung: Kapitel 2, Thema 5 „Winkelbetrachtungen“.
//
// Vier Zusammenhänge tragen das Thema: Scheitel- und Nebenwinkel, die Winkel
// an Parallelen, die Winkelsumme im Dreieck und der Außenwinkelsatz. Jeder
// wird aus dem Aufgabentext heraus nachgerechnet, und die vorgesehenen
// Verwechslungen werden eigens eingetragen.

"use strict";

const { neuerBericht } = require("../lib/pruefen");
const { starteBrowser, neueSeite, oeffne } = require("../lib/seite");
const { pruefeNotation } = require("../lib/notation");
const { pruefeKontrast } = require("../lib/kontrast");
const { pruefeAufgabe } = require("../lib/aufgaben");

const bericht = neuerBericht();
const { pruefe } = bericht;
const SEITE = "/mathematik/grundwissen-5-10/02-geometrie/05-winkelbetrachtungen/index.html";

// An Parallelen sind Stufen- und Wechselwinkel gleich groß; Nachbarwinkel
// ergänzen sich zu 180°.
const GLEICH = { Stufenwinkel: true, Wechselwinkel: true, Nachbarwinkel: false };

async function aufgaben(page) {
  // Aufgabe 1 — Scheitel- und Nebenwinkel. 32 Winkel × 2 Fragen = 64 Fassungen;
  // bei 30 Zügen ist E = 30·(1 − 29/(2·64)) ≈ 23,6 (erwartete Doppel 6,8,
  // σ ≈ 2,6) — Schranke rund 16.
  await pruefeAufgabe(page, bericht, {
    nr: 1, name: "A1 Scheitel- und Nebenwinkel", runden: 30, mindestensVerschieden: 16,
    deute: (frage) => {
      const m = frage.match(/α = (\d+)°.*?(Scheitelwinkel|Nebenwinkel)/);
      if (!m) return null;
      const alpha = Number(m[1]);
      const scheitel = m[2] === "Scheitelwinkel";
      return {
        richtig: scheitel ? alpha : 180 - alpha,
        toleranz: 0.02,
        falsch: [
          [scheitel ? 180 - alpha : alpha, scheitel ? "Das ist der Nebenwinkel" : "Das ist α selbst"],
          [360 - alpha, "nicht zu 360°"],
          [90 - alpha, "komplementäre"],
        ],
      };
    },
  });

  // Aufgabe 2 — Winkel an Parallelen. 29 Winkel × 3 Arten = 87 Fassungen.
  await pruefeAufgabe(page, bericht, {
    nr: 2, name: "A2 Winkel an Parallelen", runden: 30, mindestensVerschieden: 20,
    deute: (frage) => {
      const m = frage.match(/α = (\d+)°.*?(Stufenwinkel|Wechselwinkel|Nachbarwinkel)/);
      if (!m) return null;
      const alpha = Number(m[1]);
      const gleich = GLEICH[m[2]];
      return {
        richtig: gleich ? alpha : 180 - alpha,
        toleranz: 0.02,
        falsch: [
          [gleich ? 180 - alpha : alpha, gleich ? "gleich groß" : "Nachbarwinkel liegen"],
          [360 - alpha, "180°, nicht um 360°"],
        ],
      };
    },
  });

  // Aufgabe 3 — Winkelsumme im Dreieck.
  await pruefeAufgabe(page, bericht, {
    nr: 3, name: "A3 Winkelsumme", runden: 30, mindestensVerschieden: 26,
    deute: (frage) => {
      const m = frage.match(/α = (\d+)° und β = (\d+)°/);
      if (!m) return null;
      const alpha = Number(m[1]), beta = Number(m[2]);
      pruefe(alpha + beta < 180, `A3: α + β = ${alpha + beta}° lässt kein Dreieck zu`);
      return {
        richtig: 180 - alpha - beta,
        toleranz: 0.02,
        falsch: [
          [alpha + beta, "Summe"],
          [360 - alpha - beta, "nicht 360"],
          [180 - alpha, "nur α abgezogen"],
          [180 - beta, "nur β abgezogen"],
        ],
      };
    },
  });

  // Aufgabe 4 — Außenwinkelsatz: der Außenwinkel bei B ist α + γ.
  // α und γ je gleichverteilt aus 13 Werten, also 169 Paare; bei 30 Zügen ist
  // E = 27,5 und σ = 1,18 — Schranke 23.
  await pruefeAufgabe(page, bericht, {
    nr: 4, name: "A4 Außenwinkel", runden: 30, mindestensVerschieden: 23,
    deute: (frage) => {
      const m = frage.match(/α = (\d+)°.*?Außenwinkel bei B beträgt (\d+)°/);
      if (!m) return null;
      const alpha = Number(m[1]), aussen = Number(m[2]);
      const gamma = aussen - alpha;
      const beta = 180 - aussen;
      pruefe(gamma > 0 && beta > 0, `A4: unmögliche Winkel (α = ${alpha}°, außen = ${aussen}°)`);
      return {
        richtig: gamma,
        toleranz: 0.02,
        // In der Reihenfolge, in der die Seite ihre Hinweise prüft. Die dritte
        // und die vierte Zahl fallen zusammen, sobald α + Außenwinkel = 180° − 90°
        // ist; dann greift der zuerst geprüfte Hinweis.
        falsch: [
          [beta, "Innenwinkel bei B"],
          [aussen, "Außenwinkel selbst"],
          [180 - alpha - aussen, "wie einen Innenwinkel behandelt"],
          [aussen + alpha, "addiert statt subtrahiert"],
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
