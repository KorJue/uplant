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
  // Aufgabe 1 — Termwert einsetzen. Gemessen mit tests/werkzeug-streuung.js: 174 verschiedene
  // in 200 Würfen, zurückgerechnet also rund 698 Kandidaten. Die Schranke ist das simulierte
  // 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für 0,8 · n gerechnet — 25.
  await pruefeAufgabe(page, bericht, {
    nr: 1, name: "A1 Termwert", runden: 30, mindestensVerschieden: 25,
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

  // Aufgabe 2 — Ausmultiplizieren. Gemessen mit tests/werkzeug-streuung.js: 186 verschiedene in
  // 200 Würfen, zurückgerechnet rund 1400 Kandidaten. Die Schranke ist das simulierte
  // 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für 0,8 · n gerechnet — 26.
  await pruefeAufgabe(page, bericht, {
    nr: 2, name: "A2 Ausmultiplizieren", runden: 30, mindestensVerschieden: 26,
    deute: (frage) => {
      const m = frage.match(/([−-]?\d+) · \((\d+)x ([+−]) (\d+)\)/);
      if (!m) return null;
      const a = Number(m[1].replace("−", "-"));
      const b = Number(m[2]);
      const c = (m[3] === "+" ? 1 : -1) * Number(m[4]);
      pruefe(a !== 0 && b !== 0 && c !== 0, `A2: ein Faktor ist 0 — „${frage}“`);
      return {
        felder: [a * b, a * c],
        toleranz: 0.0002,
        falschFelder: [
          [0, b, "gehört auch vor das x"],
          [0, a + b, "multipliziert"],
          [1, c, "häufigste Fehler"],
          [1, -a * c, "Vorzeichen"],
          [1, a * b, "vor dem x"],
        ],
      };
    },
  });

  // Aufgabe 3 — Klammer auflösen, zusammenfassen, einsetzen.
  await pruefeAufgabe(page, bericht, {
    nr: 3, name: "A3 Minus vor der Klammer", runden: 30, mindestensVerschieden: 28,
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
            `A3: nach dem Zusammenfassen bleibt ${aGes}x + ${bGes} — ein Glied fällt weg — „${f}“`);
          // Die Probe rechnet am Ausgangsterm nach, nicht am vereinfachten.
          pruefe(Math.abs((a1 * x + b1) - (a2 * x - b2) - (aGes * x + bGes)) < 1e-9,
            `A3: vereinfachter und ursprünglicher Term stimmen bei x = ${x} nicht überein — „${f}“`);
          pruefe(rueck.includes("Probe am Ausgangsterm"),
            `A3: die Musterlösung prüft nicht am Ausgangsterm nach — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 4 — die binomischen Formeln vorwärts, in allen drei Bauformen. Gemessen: 112
  // verschiedene in 200 Würfen. Die nachgebildete Ziehung (Bauform × a × b) ergibt bei 30 Zügen
  // E = 27,5 und ein 10⁻⁴-Quantil von 21; angesetzt wird die vorsichtigere Rechnung mit
  // 0,8 · n — 20.
  const bauformen = new Set();
  await pruefeAufgabe(page, bericht, {
    nr: 4, name: "A4 binomische Formeln vorwärts", runden: 30, mindestensVerschieden: 20,
    deute: (frage) => {
      const prod = frage.match(/\((\d*)x \+ (\d+)\) · \((\d*)x − (\d+)\)/);
      const quad = frage.match(/\((\d*)x ([+−]) (\d+)\)²/);
      let a, b, art;
      if (prod) {
        a = prod[1] === "" ? 1 : Number(prod[1]);
        b = Number(prod[2]);
        pruefe(prod[3] === prod[1] && prod[4] === prod[2],
          `A4: die dritte binomische Formel verlangt dieselben Glieder — „${frage}“`);
        art = "produkt";
      } else if (quad) {
        a = quad[1] === "" ? 1 : Number(quad[1]);
        b = Number(quad[3]);
        art = quad[2] === "+" ? "plus" : "minus";
      } else {
        return null;
      }
      bauformen.add(art);
      // Unabhängig ausmultipliziert, nicht aus der Formel der Seite übernommen.
      const x2 = a * a;
      const x1 = art === "plus" ? 2 * a * b : art === "minus" ? -2 * a * b : 0;
      const konst = art === "produkt" ? -b * b : b * b;
      return {
        felder: [x2, x1, konst],
        toleranz: 0.0002,
        falschFelder: [
          [0, a !== 1 ? a : null, "quadriert"],
          [0, a !== 1 ? 2 * a : null, "verdoppeln"],
          [1, art !== "produkt" ? 0 : null, "2uv"],
          [1, art !== "produkt" ? a * b : null, "Faktor 2"],
          [1, art !== "produkt" ? -x1 : 2 * a * b, art !== "produkt" ? "binomischen Formel" : "heben sich"],
          [2, b, "quadriert"],
          [2, art === "produkt" ? b * b : art === "minus" ? -b * b : null,
            art === "produkt" ? "negativ" : "nie negativ"],
        ],
      };
    },
  });
  pruefe(bauformen.size === 3, `A4: nur ${bauformen.size} der drei Bauformen kamen in 30 Zügen vor`);

  // Aufgabe 5 — binomische Formeln rückwärts. Gemessen mit tests/werkzeug-streuung.js: 55
  // verschiedene in 200 Würfen, zurückgerechnet also rund 57 Kandidaten. Die Schranke ist das
  // simulierte 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für 0,8 · n gerechnet — 15.
  await pruefeAufgabe(page, bericht, {
    nr: 5, name: "A5 binomische Formeln", runden: 30, mindestensVerschieden: 15,
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
          pruefe: (f) => pruefe(Number.isInteger(q), `A5: √${diff[1]} = ${q} ist nicht ganzzahlig — „${f}“`),
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
              `A5: der mittlere Koeffizient ${glied[2]} ist nicht 2 · ${q} — „${f}“`);
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
            `A5: das letzte Glied ${mitte[1]} ist nicht ${q}² — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 6 — Ausklammern. Gemessen: 191 verschiedene in 200 Würfen, zurückgerechnet rund 2100
  // Kandidaten. Schranke: simuliertes 10⁻⁴-Quantil bei 30 Zügen für 0,8 · n — 27.
  await pruefeAufgabe(page, bericht, {
    nr: 6, name: "A6 Ausklammern", runden: 30, mindestensVerschieden: 27,
    deute: (frage) => {
      const m = frage.match(/aus: (\d+)x ([+−]) (\d+)/);
      if (!m) return null;
      const erst = Number(m[1]);
      const zweit = (m[2] === "+" ? 1 : -1) * Number(m[3]);
      // Der größte gemeinsame Teiler wird unabhängig bestimmt.
      const ggT = (x, y) => (y === 0 ? Math.abs(x) : ggT(y, x % y));
      const f = ggT(erst, Math.abs(zweit));
      pruefe(f > 1, `A6: ${erst} und ${Math.abs(zweit)} haben keinen gemeinsamen Teiler — „${frage}“`);
      return {
        felder: [f, erst / f, zweit / f],
        toleranz: 0.0002,
        falschFelder: [
          [0, 1, "ändert nichts"],
          [0, erst, "teilt die zweite Zahl nicht"],
          [1, erst, "vor dem Ausklammern"],
          [1, erst * f, "geteilt"],
          [2, zweit, "vor dem Ausklammern"],
          [2, -zweit / f, "Vorzeichen"],
        ],
      };
    },
  });

  // Aufgabe 7 — Term aus einer geometrischen Situation. Gemessen mit
  // tests/werkzeug-streuung.js: 121 verschiedene in 200 Würfen, zurückgerechnet also rund 180
  // Kandidaten. Die Schranke ist das simulierte 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für
  // 0,8 · n gerechnet — 21.
  await pruefeAufgabe(page, bericht, {
    nr: 7, name: "A7 Flächenzuwachs", runden: 30, mindestensVerschieden: 21,
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
            `A7: der Zuwachs ${neu - alt} passt nicht zu d · (2x + p + d) — „${f}“`);
          pruefe(neu > alt, `A7: die vergrößerte Fläche ${neu} ist nicht größer als ${alt} — „${f}“`);
          pruefe(rueck.includes("Zuwachs") || rueck.includes("Differenz"),
            `A7: die Musterlösung spricht nicht vom Zuwachs — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 8 — der Zahlentrick. Gemessen: 114 verschiedene in 200 Würfen, zurückgerechnet rund
  // 160 Kandidaten. Schranke: simuliertes 10⁻⁴-Quantil bei 30 Zügen für 0,8 · n — 20.
  await pruefeAufgabe(page, bericht, {
    nr: 8, name: "A8 Zahlentrick", runden: 30, mindestensVerschieden: 20,
    deute: (frage) => {
      const m = frage.match(/Zähle (\d+) dazu.*?mit (\d+).*?Ziehe (\d+) ab.*?Teile durch (\d+)/);
      if (!m) return null;
      const [a, k, bEcht, k2] = m.slice(1).map(Number);
      pruefe(k === k2, `A8: multipliziert wird mit ${k}, geteilt durch ${k2} — „${frage}“`);
      pruefe(bEcht % k === 0, `A8: ${bEcht} : ${k} geht nicht auf — „${frage}“`);
      const b = bEcht / k;
      const ergebnis = a - b;
      // Der Kern: Das Ergebnis hängt nicht von der gedachten Zahl ab. Nachgerechnet an zwei
      // verschiedenen Startzahlen.
      const durchlauf = (x) => ((x + a) * k - bEcht) / k - x;
      pruefe(Math.abs(durchlauf(3) - ergebnis) < 1e-9 && Math.abs(durchlauf(11) - ergebnis) < 1e-9,
        `A8: der Trick liefert für 3 und 11 nicht dasselbe Ergebnis — „${frage}“`);
      pruefe(ergebnis > 0, `A8: das Ergebnis ${ergebnis} ist nicht positiv — „${frage}“`);
      return {
        felder: [k, 0, ergebnis],
        toleranz: 0.0002,
        falschFelder: [
          [0, 1, "auch das x"],
          [0, k * a, "ohne"],
          [1, 1, "einzelnes x"],
          [1, k, "nur noch x"],
          [2, a - bEcht, "vor dem Teilen"],
          [2, a, "muss noch abgezogen"],
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
