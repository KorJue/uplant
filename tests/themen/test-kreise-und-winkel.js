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
  // Aufgabe 1 — Radius und Durchmesser. Gemessen mit tests/werkzeug-streuung.js: 56
  // verschiedene in 200 Würfen, zurückgerechnet also rund 58 Kandidaten. Die Schranke ist das
  // simulierte 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für 0,8 · n gerechnet — 15.
  await pruefeAufgabe(page, bericht, {
    nr: 1, name: "A1 Radius und Durchmesser", runden: 30, mindestensVerschieden: 15,
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

  // Aufgabe 2 — Ergänzungswinkel zu 90°, 180° oder 360°. Gemessen mit
  // tests/werkzeug-streuung.js: 85 verschiedene in 200 Würfen, zurückgerechnet also rund 97
  // Kandidaten. Die Schranke ist das simulierte 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für
  // 0,8 · n gerechnet — 18.
  await pruefeAufgabe(page, bericht, {
    nr: 3, name: "A3 Ergänzungswinkel", runden: 30, mindestensVerschieden: 18,
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

  // Aufgabe 3 — die richtige Skala des Geodreiecks wählen. Gemessen mit
  // tests/werkzeug-streuung.js: 32 verschiedene in 200 Würfen, zurückgerechnet also rund 32
  // Kandidaten. Die Schranke ist das simulierte 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für
  // 0,8 · n gerechnet — 12.
  await pruefeAufgabe(page, bericht, {
    nr: 5, name: "A5 Geodreieck ablesen", runden: 30, mindestensVerschieden: 12,
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

  // Aufgabe 4 — Mittelpunktswinkel im Kreisdiagramm. Gemessen mit tests/werkzeug-streuung.js:
  // 170 verschiedene in 200 Würfen, zurückgerechnet also rund 596 Kandidaten. Die Schranke ist
  // das simulierte 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für 0,8 · n gerechnet — 24.
  await pruefeAufgabe(page, bericht, {
    nr: 7, name: "A7 Kreisdiagramm", runden: 30, mindestensVerschieden: 24,
    deute: (frage) => {
      // Jeder Zusammenhang hat seinen eigenen Satzbau; gemeinsam ist ihnen nur, dass zuerst die
      // Gesamtzahl und dann der Teil genannt wird.
      const m = frage.match(/(\d+) [^;.]*[;,] (\d+) davon/) || frage.match(/Von (\d+) [^]*? (\d+) /);
      if (!m) return null;
      const gesamt = Number(m[1]), teil = Number(m[2]);
      pruefe(teil < gesamt, `A7: der Teil ${teil} ist nicht kleiner als das Ganze ${gesamt}`);
      pruefe(360 % gesamt === 0, `A7: 360° lässt sich nicht glatt durch ${gesamt} teilen`);
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

  // Aufgabe 2 — Durchmesser und Lage eines Punktes (Aufgabe zum Ausfüllen). Gemessen mit
  // tests/werkzeug-streuung.js: 140 verschiedene in 200 Würfen, zurückgerechnet rund 262
  // Kandidaten. Die Schranke ist das simulierte 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für
  // 0,8 · n gerechnet — 22.
  await pruefeAufgabe(page, bericht, {
    nr: 2, name: "A2 Durchmesser und Lage", runden: 30, mindestensVerschieden: 22,
    deute: (frage) => {
      const m = frage.match(/Radius r = (\d+) cm.*?liegt (\d+) cm von M entfernt/);
      if (!m) return null;
      const r = Number(m[1]), abstand = Number(m[2]);
      const lage = abstand < r ? 1 : abstand === r ? 2 : 3;
      return {
        felder: [2 * r, lage],
        falschFelder: [
          [0, r / 2, "doppelt"],
          [1, lage === 1 ? 3 : 1, null],
        ],
      };
    },
  });

  // Aufgabe 4 — Winkelart. Hier führt die übliche Rückrechnung in die Irre: Sie setzt gleich
  // wahrscheinliche Kandidaten voraus, gezogen wird aber erst einer von fünf Bereichen und dann
  // eine Gradzahl darin — und zwei Bereiche („rechter“, „gestreckter Winkel“) enthalten genau
  // einen Wert. Zwei von fünf Würfen landen damit auf immer derselben Zahl. Simuliert man die
  // wirkliche Verteilung über 30 Züge, liegt der Erwartungswert bei 19,5 und das 10⁻⁴-Quantil
  // bei 10.
  await pruefeAufgabe(page, bericht, {
    nr: 4, name: "A4 Winkelart", runden: 30, mindestensVerschieden: 10,
    deute: (frage) => {
      const m = frage.match(/Art von Winkel ist (\d+)°/);
      if (!m) return null;
      const a = Number(m[1]);
      const nr = a < 90 ? 1 : a === 90 ? 2 : a < 180 ? 3 : a === 180 ? 4 : 5;
      return {
        richtig: nr,
        falsch: [[a !== nr ? a : null, "Kennziffer"]],
      };
    },
  });

  // Aufgabe 6 — drei Sektoren im Kreisdiagramm (Aufgabe zum Ausfüllen). Gemessen mit
  // tests/werkzeug-streuung.js: 196 verschiedene in 200 Würfen, zurückgerechnet rund 4900
  // Kandidaten. Die Schranke ist das simulierte 10⁻⁴-Quantil bei 30 Zügen — 27.
  await pruefeAufgabe(page, bericht, {
    nr: 6, name: "A6 drei Sektoren", runden: 30, mindestensVerschieden: 27,
    deute: (frage) => {
      const m = frage.match(/werden (\d+) .*? dargestellt\. (\d+) davon .*?, (\d+) /);
      if (!m) return null;
      const [gesamt, a, b] = m.slice(1).map(Number);
      // Der Vollwinkel muss sich ohne Rest aufteilen lassen, sonst wären die Winkel krumm.
      pruefe(360 % gesamt === 0, `A6: 360° lässt sich nicht glatt durch ${gesamt} teilen`);
      const je = 360 / gesamt;
      const rest = gesamt - a - b;
      pruefe(rest > 0, `A6: für den Rest bleibt nichts übrig (${a} + ${b} von ${gesamt})`);
      return {
        felder: [a * je, b * je, rest * je],
        falschFelder: [
          [0, a !== a * je ? a : null, "Anzahl"],
          [2, 360, "Vollwinkel"],
        ],
        pruefe: (f, rueck) => {
          pruefe(rueck.includes("360°"), `A6: die Musterlösung führt keine Probe über den Vollwinkel — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 8 — vom Winkel zurück zur Anzahl (Aufgabe zum Ausfüllen). Gemessen mit
  // tests/werkzeug-streuung.js: 176 verschiedene in 200 Würfen, zurückgerechnet rund 762
  // Kandidaten. Die Schranke ist das simulierte 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für
  // 0,8 · n gerechnet — 25.
  await pruefeAufgabe(page, bericht, {
    nr: 8, name: "A8 Winkel zurück zur Anzahl", runden: 30, mindestensVerschieden: 25,
    deute: (frage) => {
      const m = frage.match(/stellt (\d+) .*? dar.*?Mittelpunktswinkel (\d+)°/);
      if (!m) return null;
      const gesamt = Number(m[1]), winkel = Number(m[2]);
      pruefe(360 % gesamt === 0, `A8: 360° lässt sich nicht glatt durch ${gesamt} teilen`);
      const je = 360 / gesamt;
      pruefe(winkel % je === 0, `A8: ${winkel}° ist kein Vielfaches von ${je}°`);
      return {
        felder: [je, winkel / je],
        falschFelder: [
          [0, gesamt / 360 !== je ? gesamt / 360 : null, "Kopf"],
          [1, winkel !== winkel / je ? winkel : null, "Anzahl"],
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
