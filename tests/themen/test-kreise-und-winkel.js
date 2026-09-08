// Fachliche Prüfung: Kapitel 2, Thema 4 „Kreise und Winkel“.

"use strict";

const { neuerBericht } = require("../lib/pruefen");
const { starteBrowser, neueSeite, oeffne } = require("../lib/seite");
const { pruefeNotation } = require("../lib/notation");
const { pruefeKontrast } = require("../lib/kontrast");
const { pruefeAufgabe } = require("../lib/aufgaben");

const bericht = neuerBericht();
const { pruefe } = bericht;
const SEITE = "/mathematik/grundwissen-5-10/02-geometrie/04-kreise-und-winkel/index.html";

async function aufgaben(page) {
  // Aufgabe 1 — Radius und Durchmesser. Die Fassung wird zuerst gezogen,
  // danach der Wert: 39 Radien mit je 1/78, 24 Durchmesser mit je 1/48.
  // Damit ist bei 30 Zügen E = 23,8 und σ = 1,83 — Schranke 18.
  await pruefeAufgabe(page, bericht, {
    nr: 1, name: "A1 Radius und Durchmesser", runden: 30, mindestensVerschieden: 18,
    deute: (frage) => {
      const m = frage.match(/(Radius|Durchmesser) [rd] = (\d+) cm/);
      if (!m) return null;
      const gegeben = Number(m[2]);
      const nachD = m[1] === "Radius";     // gegeben ist r, gesucht d
      return {
        richtig: nachD ? 2 * gegeben : gegeben / 2,
        toleranz: 0.02,
        falsch: [
          [gegeben, "schon gegeben war"],
          [nachD ? gegeben / 2 : 2 * gegeben, "falsche Richtung"],
        ],
      };
    },
  });

  // Aufgabe 2 — Ergänzungswinkel zu 90°, 180° oder 360°. Das Ziel wird zuerst
  // gezogen, deshalb tragen die 17 Winkel zu 90° zusammen genauso viel
  // Wahrscheinlichkeit wie die 71 zu 360°. Mit der tatsächlichen Verteilung
  // (120 Paare) ist bei 30 Zügen E = 25,4 und σ = 1,79 — Schranke 20.
  await pruefeAufgabe(page, bericht, {
    nr: 2, name: "A2 Ergänzungswinkel", runden: 30, mindestensVerschieden: 20,
    deute: (frage) => {
      const m = frage.match(/\((\d+)°\)\. Der eine ist α = (\d+)°/);
      if (!m) return null;
      const ziel = Number(m[1]), alpha = Number(m[2]);
      return {
        richtig: ziel - alpha,
        toleranz: 0.02,
        falsch: [
          [alpha, "schon gegeben war"],
          [ziel, "ganze"],
          [alpha + ziel, "addiert statt subtrahiert"],
        ],
      };
    },
  });

  // Aufgabe 3 — die richtige Skala des Geodreiecks wählen. 32 Winkel (90°
  // wird auf 95° umgelenkt, das deshalb doppelt vorkommt); bei 30 Zügen ist
  // E = 19,5 und σ = 1,76 — Schranke 14.
  await pruefeAufgabe(page, bericht, {
    nr: 3, name: "A3 Geodreieck ablesen", runden: 30, mindestensVerschieden: 14,
    deute: (frage) => {
      const m = frage.match(/Skala (\d+)°, auf der anderen (\d+)°.*?(spitzen|stumpfen)/);
      if (!m) return null;
      const klein = Number(m[1]), gross = Number(m[2]);
      const spitz = m[3] === "spitzen";
      // Die Winkelart entscheidet, welche der beiden Ablesungen gemeint ist.
      const richtig = spitz ? klein : gross;
      const andere = spitz ? gross : klein;
      pruefe(klein + gross === 180, `A3: die beiden Ablesungen ergeben ${klein + gross}° statt 180°`);
      return {
        richtig,
        toleranz: 0.02,
        falsch: [
          [andere, "anderen"],
          [klein + gross, "addiert"],
          [gross - klein, "Differenz"],
        ],
      };
    },
  });

  // Aufgabe 4 — Mittelpunktswinkel im Kreisdiagramm.
  await pruefeAufgabe(page, bericht, {
    nr: 4, name: "A4 Kreisdiagramm", runden: 30, mindestensVerschieden: 27,
    deute: (frage) => {
      const m = frage.match(/Von (\d+) .*? (\d+)\. Wie groß/);
      if (!m) return null;
      const gesamt = Number(m[1]), teil = Number(m[2]);
      const winkel = (teil / gesamt) * 360;
      return {
        richtig: winkel,
        toleranz: 0.02,
        falsch: [
          [360 - winkel, "Rests"],
          [teil * (100 / gesamt), "Prozent"],
          [teil * (180 / gesamt), "180"],
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
