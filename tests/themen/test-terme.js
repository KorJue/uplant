// Fachliche Prüfung: Kapitel 4, Thema 4 „Terme“.
//
// Drei Stolperstellen tragen das Thema, und alle drei werden eigens ausgelöst:
// das Quadrat einer negativen Zahl ist positiv, das Minus vor einer Klammer
// dreht ALLE Vorzeichen darin um, und ungleichartige Glieder lassen sich nicht
// zusammenfassen. Dazu die binomischen Formeln rückwärts gelesen.

"use strict";

const { neuerBericht } = require("../lib/pruefen");
const { starteBrowser, neueSeite, oeffne } = require("../lib/seite");
const { pruefeNotation } = require("../lib/notation");
const { pruefeKontrast } = require("../lib/kontrast");
const { pruefeAufgabe } = require("../lib/aufgaben");

const bericht = neuerBericht();
const { pruefe } = bericht;
const SEITE = "/mathematik/grundwissen-5-10/04-gleichungen-zuordnungen-funktionen/04-terme/index.html";

const minus = (s) => s.replace(/−/g, "-");

async function aufgaben(page) {
  // Aufgabe 1 — Termwert einsetzen. 3 · 10 · 8 · 8 Kandidaten, gefiltert;
  // Doppel sind bei 30 Zügen praktisch ausgeschlossen — Schranke 28.
  await pruefeAufgabe(page, bericht, {
    nr: 1, name: "A1 Termwert", runden: 30, mindestensVerschieden: 28,
    deute: (frage) => {
      const m = minus(frage).match(/von (-?\d*)x² ([+-]) (\d+)x ([+-]) (\d+) für x = (-?\d+)/);
      if (!m) return null;
      const a = m[1] === "" ? 1 : Number(m[1]);
      const b = (m[2] === "-" ? -1 : 1) * Number(m[3]);
      const c = (m[4] === "-" ? -1 : 1) * Number(m[5]);
      const x = Number(m[6]);
      return {
        richtig: a * x * x + b * x + c,
        toleranz: 0.0005,
        falsch: [
          // (−x)² als −x² gerechnet — der klassische Vorzeichenfehler.
          [-a * x * x + b * x + c, "positive"],
          // Das Vorzeichen des mittleren Glieds verdreht.
          [a * x * x - b * x + c, "mittleren Glieds"],
          // (a·x)² statt a·x².
          [a * x * (a * x) + b * x + c, "Erst wird quadriert"],
          // x² als 2x gerechnet.
          [a * x + b * x + c, "x · x"],
        ],
        pruefe: (f, rueck) => {
          // Der Kern: Das Quadrat ist nie negativ, gleichgültig welches
          // Vorzeichen x hat.
          pruefe(x * x > 0, `A1: x² = ${x * x} für x = ${x} — „${f}“`);
          // Die Musterlösung muss beim Einsetzen Klammern setzen.
          pruefe(rueck.includes(`(${x < 0 ? "−" : ""}${Math.abs(x)})²`),
            `A1: die Musterlösung setzt beim Quadrieren keine Klammern — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 2 — Klammer auflösen, zusammenfassen, einsetzen.
  await pruefeAufgabe(page, bericht, {
    nr: 2, name: "A2 Minus vor der Klammer", runden: 30, mindestensVerschieden: 28,
    deute: (frage) => {
      const m = minus(frage).match(/Term (\d+)x ([+-]) (\d+) - \((\d+)x ([+-]) (\d+)\)[\s\S]*?für x = (-?\d+)/);
      if (!m) return null;
      const a1 = Number(m[1]);
      const b1 = (m[2] === "-" ? -1 : 1) * Number(m[3]);
      const a2 = Number(m[4]);
      // Im Term steht −(a₂x − b₂); das b₂ des Generators ist die Gegenzahl.
      const inKlammer = (m[5] === "-" ? -1 : 1) * Number(m[6]);
      const b2 = -inKlammer;
      const x = Number(m[7]);
      const aGes = a1 - a2, bGes = b1 + b2;
      return {
        richtig: aGes * x + bGes,
        toleranz: 0.0005,
        falsch: [
          // Die x-Terme addiert, obwohl vor der Klammer ein Minus steht.
          [(a1 + a2) * x + bGes, "abgezogen"],
          // Das Minus nur auf das erste Glied der Klammer angewandt.
          [aGes * x + (b1 - b2), "dreht alle Vorzeichen"],
          // x-Term und Zahl zusammengefasst.
          [(aGes + bGes) * x, "gleichartig"],
        ],
        pruefe: (f, rueck) => {
          pruefe(aGes !== 0 && bGes !== 0,
            `A2: nach dem Zusammenfassen bleibt ${aGes}x + ${bGes} — ein Glied fällt weg — „${f}“`);
          // Die Probe rechnet am Ausgangsterm nach, nicht am vereinfachten.
          pruefe(Math.abs((a1 * x + b1) - (a2 * x - b2) - (aGes * x + bGes)) < 1e-9,
            `A2: vereinfachter und ursprünglicher Term stimmen bei x = ${x} nicht überein — „${f}“`);
          pruefe(rueck.includes("Probe am Ausgangsterm"),
            `A2: die Musterlösung prüft nicht am Ausgangsterm nach — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 3 — binomische Formeln rückwärts. 4 Formen × 14 Zahlen = 56
  // Fassungen; bei 30 Zügen ist E = 24,0 und σ = 1,8, die Schranke E − 3σ
  // liegt bei 18.
  await pruefeAufgabe(page, bericht, {
    nr: 3, name: "A3 binomische Formeln", runden: 30, mindestensVerschieden: 18,
    deute: (frage) => {
      const t = minus(frage);
      // 3. binomische Formel: x² − b² = (x + □)(x − □)
      const diff = t.match(/x² - (\d+) = \(x \+ □\)/);
      if (diff) {
        const q = Math.sqrt(Number(diff[1]));
        return {
          richtig: q,
          toleranz: 0.0005,
          falsch: [[q * q, "Quadrat von"], [2 * q, "mittlere Koeffizient"]],
          pruefe: (f) => pruefe(Number.isInteger(q), `A3: √${diff[1]} = ${q} ist nicht ganzzahlig — „${f}“`),
        };
      }
      // x² ± 2qx + □ = (x ± q)²
      const glied = t.match(/x² ([+-]) (\d+)x \+ □ = \(x ([+-]) (\d+)\)²/);
      if (glied) {
        const q = Number(glied[4]);
        const minusform = glied[1] === "-";
        return {
          richtig: q * q,
          toleranz: 0.0005,
          falsch: [
            [q, "in der Klammer"],
            [2 * q, "mittlere Koeffizient"],
            // Auch bei der 2. binomischen Formel ist das letzte Glied positiv.
            [minusform ? -q * q : null, "positiv"],
          ],
          pruefe: (f) => {
            pruefe(Number(glied[2]) === 2 * q,
              `A3: der mittlere Koeffizient ${glied[2]} ist nicht 2 · ${q} — „${f}“`);
          },
        };
      }
      // x² + □·x + q² = (x + q)²
      const mitte = t.match(/x² \+ □·x \+ (\d+) = \(x \+ (\d+)\)²/);
      if (!mitte) return null;
      const q = Number(mitte[2]);
      return {
        richtig: 2 * q,
        toleranz: 0.0005,
        falsch: [[q, "in der Klammer"], [q * q, "Quadrat von"]],
        pruefe: (f) => {
          pruefe(Number(mitte[1]) === q * q,
            `A3: das letzte Glied ${mitte[1]} ist nicht ${q}² — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 4 — Term aus einer geometrischen Situation. 7 · 5 · 10 Kandidaten,
  // gefiltert; Doppel sind bei 30 Zügen selten — Schranke 24.
  await pruefeAufgabe(page, bericht, {
    nr: 4, name: "A4 Flächenzuwachs", runden: 30, mindestensVerschieden: 24,
    deute: (frage) => {
      const m = frage.match(/(\d+) cm länger[\s\S]*?um (\d+) cm[\s\S]*?x = (\d+) cm/);
      if (!m) return null;
      const [p, d, x] = m.slice(1).map(Number);
      const alt = x * (x + p), neu = (x + d) * (x + p + d);
      return {
        richtig: neu - alt,
        toleranz: 0.0005,
        falsch: [
          [neu, "neue"],
          [alt, "alte"],
          // Nur das Eckquadrat gezählt.
          [d * d, "Eckquadrat"],
          // Beide Randstreifen mit der Länge x gerechnet.
          [2 * d * x, "Randstreifen"],
        ],
        pruefe: (f, rueck) => {
          // Der Zuwachs ist genau d · (2x + p + d) — zwei Streifen und die Ecke.
          pruefe(Math.abs(neu - alt - d * (2 * x + p + d)) < 1e-9,
            `A4: der Zuwachs ${neu - alt} passt nicht zu d · (2x + p + d) — „${f}“`);
          pruefe(neu > alt, `A4: die vergrößerte Fläche ${neu} ist nicht größer als ${alt} — „${f}“`);
          pruefe(rueck.includes("Zuwachs") || rueck.includes("Differenz"),
            `A4: die Musterlösung spricht nicht vom Zuwachs — „${f}“`);
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
