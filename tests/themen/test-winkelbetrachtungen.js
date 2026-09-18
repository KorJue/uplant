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

// Die Beschriftungen der Eingabefelder — bei den Ausfüllaufgaben steht dort ein Teil der Frage.
async function feldnamen(page, box) {
  return page.evaluate((sel) => ({
    felder: [...document.querySelectorAll(`${sel} .aufgabe-feld-name`)].map((e) => e.innerText.replace(/\s+/g, " ").trim()),
  }), box);
}

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

  // Aufgabe 2 — Winkel an Parallelen. Gemessen mit tests/werkzeug-streuung.js: 74 verschiedene
  // in 200 Würfen, zurückgerechnet also rund 81 Kandidaten. Die Schranke ist das simulierte
  // 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für 0,8 · n gerechnet — 17.
  await pruefeAufgabe(page, bericht, {
    nr: 3, name: "A3 Winkel an Parallelen", runden: 30, mindestensVerschieden: 17,
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

  // Aufgabe 3 — Winkelsumme im Dreieck. Gemessen mit tests/werkzeug-streuung.js: 160
  // verschiedene in 200 Würfen, zurückgerechnet also rund 429 Kandidaten. Die Schranke ist das
  // simulierte 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für 0,8 · n gerechnet — 24.
  await pruefeAufgabe(page, bericht, {
    nr: 5, name: "A5 Winkelsumme", runden: 30, mindestensVerschieden: 24,
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

  // Aufgabe 4 — Außenwinkelsatz: der Außenwinkel bei B ist α + γ. Gemessen mit
  // tests/werkzeug-streuung.js: 115 verschiedene in 200 Würfen, zurückgerechnet also rund 162
  // Kandidaten. Die Schranke ist das simulierte 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für
  // 0,8 · n gerechnet — 20.
  await pruefeAufgabe(page, bericht, {
    nr: 7, name: "A7 Außenwinkel", runden: 30, mindestensVerschieden: 20,
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

  // Aufgabe 2 — alle vier Winkel am Geradenkreuz (Aufgabe zum Ausfüllen). Gemessen mit
  // tests/werkzeug-streuung.js: 32 verschiedene in 200 Würfen — mehr Gradzahlen gibt es nicht
  // (2 · 5° bis 34 · 5°, ohne 90°). Die Schranke ist das simulierte 10⁻⁴-Quantil bei 30 Zügen,
  // vorsichtshalber für 0,8 · n gerechnet — 12.
  await pruefeAufgabe(page, bericht, {
    nr: 2, name: "A2 vier Winkel am Kreuz", runden: 30, mindestensVerschieden: 12,
    deute: (frage) => {
      const m = frage.match(/einer davon ist α = (\d+)°/);
      if (!m) return null;
      const a = Number(m[1]);
      pruefe(a !== 90, "A2: bei 90° sind alle vier Winkel gleich — die beiden Regeln ließen sich nicht unterscheiden");
      return {
        felder: [180 - a, a, 180 - a],
        falschFelder: [
          [0, a, "180"],
          [1, 180 - a, "gleich"],
        ],
      };
    },
  });

  // Aufgabe 4 — Winkelsumme im Vieleck (Aufgabe zum Ausfüllen). Gemessen mit
  // tests/werkzeug-streuung.js: 110 verschiedene in 200 Würfen. Die Rückrechnung auf eine
  // gleichverteilte Kandidatenmenge führt hier in die Irre: Die Aufgabe mischt zwei Fassungen —
  // mit Wahrscheinlichkeit ½ ein regelmäßiges Vieleck (nur 8 mögliche Texte, die sich oft
  // wiederholen) und sonst ein unregelmäßiges mit zufälligen Winkeln (praktisch immer neu).
  // Diese Mischung wurde nachgebildet: bei 30 Zügen ist E = 21,8, das 10⁻⁴-Quantil liegt bei 13
  // und das beobachtete Minimum bei 11 — Schranke 12.
  //
  // Die frühere Schranke 20 stammte aus der Gleichverteilungsrechnung und war deshalb zu eng;
  // der vollständige Testlauf hat sie mit 17 verschiedenen Aufgaben widerlegt.
  await pruefeAufgabe(page, bericht, {
    nr: 4, name: "A4 Winkelsumme im Vieleck", runden: 30, mindestensVerschieden: 12, liesRoh: feldnamen,
    deute: (frage, roh) => {
      if (!roh) return null;
      // \w trifft in JavaScript keine Umlaute — „Fünfeck“ und „Zwölfeck“ fielen sonst durch.
      const reg = frage.match(/regelmäßiges ([A-Za-zÄÖÜäöüß]+eck)/);
      const ECKEN = { Dreieck: 3, Viereck: 4, Fünfeck: 5, Sechseck: 6, Siebeneck: 7, Achteck: 8, Neuneck: 9, Zehneck: 10, Elfeck: 11, Zwölfeck: 12 };
      if (reg) {
        const n = ECKEN[reg[1]];
        if (!n) return null;
        const summe = (n - 2) * 180;
        pruefe(summe % n === 0, `A4: ${summe}° lässt sich nicht glatt auf ${n} Ecken verteilen`);
        return {
          felder: [summe, summe / n],
          falschFelder: [
            [0, n * 180, "Dreiecke"],
            [1, 360 / n, "Mittelpunktswinkel"],
          ],
        };
      }
      const unreg = frage.match(/In einem ([A-Za-zÄÖÜäöüß]+eck) sind (\d+) Innenwinkel bekannt:\s*(.+)$/);
      if (!unreg) return null;
      const n = ECKEN[unreg[1]];
      const gegeben = (unreg[3].match(/\d+(?=°)/g) || []).map(Number);
      if (!n || gegeben.length !== n - 1) return null;
      const summe = (n - 2) * 180;
      const verbraucht = gegeben.reduce((x, y) => x + y, 0);
      const fehlt = summe - verbraucht;
      pruefe(fehlt > 0 && fehlt < 360, `A4: der fehlende Winkel wäre ${fehlt}° — das ist kein Innenwinkel`);
      return {
        felder: [summe, fehlt],
        falschFelder: [
          [0, n * 180, "Dreiecke"],
          [1, verbraucht, "bekannten"],
        ],
      };
    },
  });

  // Aufgabe 6 — Winkel mit einer Bedingung. Gemessen mit tests/werkzeug-streuung.js: 159
  // verschiedene in 200 Würfen, zurückgerechnet rund 417 Kandidaten (drei Bedingungsarten).
  // Die Schranke ist das simulierte 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für 0,8 · n
  // gerechnet — 24.
  await pruefeAufgabe(page, bericht, {
    nr: 6, name: "A6 Winkel mit Bedingung", runden: 30, mindestensVerschieden: 24,
    deute: (frage) => {
      let m = frage.match(/β doppelt so groß wie α.*?γ = (\d+)°/);
      if (m) {
        const gamma = Number(m[1]);
        pruefe((180 - gamma) % 3 === 0, `A6: 3α = ${180 - gamma}° ergibt kein ganzzahliges α`);
        const alpha = (180 - gamma) / 3;
        return { richtig: alpha, falsch: [[2 * alpha, "β"], [180 - gamma, "zusammen"]] };
      }
      m = frage.match(/β um (\d+)° größer als α.*?γ = (\d+)°/);
      if (m) {
        const d = Number(m[1]), gamma = Number(m[2]);
        pruefe((180 - gamma - d) % 2 === 0, `A6: 2α = ${180 - gamma - d}° ergibt kein ganzzahliges α`);
        const alpha = (180 - gamma - d) / 2;
        return { richtig: alpha, falsch: [[alpha + d, "β"]] };
      }
      m = frage.match(/Basiswinkel (\d+)°.*?Spitze/);
      if (m) {
        const basis = Number(m[1]);
        return { richtig: 180 - 2 * basis, falsch: [[180 - basis, "zwei"]] };
      }
      m = frage.match(/Spitze den Winkel (\d+)°.*?Basiswinkel/);
      if (m) {
        const spitze = Number(m[1]);
        pruefe((180 - spitze) % 2 === 0, `A6: (180° − ${spitze}°) : 2 ergibt keinen ganzzahligen Basiswinkel`);
        return { richtig: (180 - spitze) / 2, falsch: [[180 - spitze, "halb"]] };
      }
      return null;
    },
  });

  // Aufgabe 8 — drei Winkel an Parallelen (Aufgabe zum Ausfüllen). Gemessen an der ANGABE:
  // 28 verschiedene in 200 Würfen — mehr Gradzahlen gibt es nicht. Welche drei der vier
  // Winkelarten gefragt werden, wechselt zusätzlich, steht aber in den Feldbeschriftungen und
  // nicht in der Angabe; die Messung sieht es deshalb nicht. Die Schranke ist das simulierte
  // 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für 0,8 · n gerechnet — 11.
  await pruefeAufgabe(page, bericht, {
    nr: 8, name: "A8 drei Winkel an Parallelen", runden: 30, mindestensVerschieden: 11, liesRoh: feldnamen,
    deute: (frage, roh) => {
      const m = frage.match(/α = (\d+)°/);
      if (!m || !roh) return null;
      const a = Number(m[1]);
      pruefe(a !== 90, "A8: bei 90° wären alle Winkel gleich");
      // Welcher Winkel gefragt ist, steht in der Beschriftung des Feldes.
      const soll = roh.felder.map((name) => (/Stufenwinkel zu|Wechselwinkel zu/.test(name) ? a : 180 - a));
      pruefe(soll.length === 3, `A8: ${soll.length} Felder statt 3`);
      return { felder: soll };
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
