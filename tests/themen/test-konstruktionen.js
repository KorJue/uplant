// Fachliche Prüfung: Kapitel 2, Thema 6 „Konstruktionen“.
//
// Die Dreiecksungleichung wird hier von beiden Rändern her geprüft: die
// kürzeste zulässige dritte Seite, die Anzahl der möglichen ganzzahligen
// Seiten und die Entscheidung, ob es ein Dreieck überhaupt gibt. Dazu kommen
// das gleichschenklige Dreieck, die Winkelhalbierende und die Kongruenzsätze
// — die Frage, wann eine Angabe die Figur schon festlegt.

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
  // Aufgabe 1 — kürzeste ganzzahlige dritte Seite. Gemessen mit tests/werkzeug-streuung.js: 108
  // verschiedene in 200 Würfen, zurückgerechnet also rund 143 Kandidaten. Die Schranke ist das
  // simulierte 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für 0,8 · n gerechnet — 20.
  await pruefeAufgabe(page, bericht, {
    nr: 1, name: "A1 Dreiecksungleichung", runden: 30, mindestensVerschieden: 20,
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

  // Aufgabe 2 — gibt es das Dreieck? Die Antwort ist eine Kennziffer (1 = ja, 2 = nein). Gemessen:
  // 188 verschiedene in 200 Würfen. Weil die Ziehung nicht gleichverteilt ist — c wird mal aus dem
  // erlaubten Bereich, mal gezielt daneben gezogen —, wurde die wirkliche Verteilung nachgebildet:
  // E = 29,7, 10⁻⁴-Quantil bei 30 Zügen = 26.
  let jaFaelle = 0, neinFaelle = 0;
  await pruefeAufgabe(page, bericht, {
    nr: 2, name: "A2 gibt es das Dreieck", runden: 30, mindestensVerschieden: 26,
    deute: (frage) => {
      const m = frage.match(/a = (\d+) cm.*?b = (\d+) cm.*?c = (\d+) cm/);
      if (!m) return null;
      const [a, b, c] = m.slice(1, 4).map(Number);
      // Unabhängig nachgerechnet: die längste Seite gegen die Summe der beiden anderen.
      const laengste = Math.max(a, b, c);
      const rest = a + b + c - laengste;
      const moeglich = rest > laengste;
      pruefe(moeglich === (c > Math.abs(a - b) && c < a + b),
        `A2: die beiden Formen der Dreiecksungleichung widersprechen sich bei ${a}/${b}/${c}`);
      if (moeglich) jaFaelle++; else neinFaelle++;
      return {
        richtig: moeglich ? 1 : 2,
        toleranz: 0.02,
        falsch: [[moeglich ? 2 : 1, "längste Seite"]],
      };
    },
  });
  pruefe(jaFaelle > 0 && neinFaelle > 0,
    `A2: in 30 Zügen kamen ${jaFaelle}-mal „ja“ und ${neinFaelle}-mal „nein“ — beide Fälle müssen vorkommen`);

  // Aufgabe 3 — gleichschenkliges Dreieck: Basis- und Spitzenwinkel. Gemessen: 24 verschiedene in
  // 200 Würfen, also 12 Basiswinkel × 2 Fragerichtungen. Schranke: simuliertes 10⁻⁴-Quantil bei
  // 30 Zügen für 0,8 · n — 10.
  await pruefeAufgabe(page, bericht, {
    nr: 3, name: "A3 gleichschenklig", runden: 30, mindestensVerschieden: 10,
    deute: (frage) => {
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

  // Aufgabe 4 — welcher Kongruenzsatz? Gemessen: 197 verschiedene in 200 Würfen. Auch hier ist die
  // Ziehung nicht gleichverteilt (erst der Fall, dann Zahlen aus verschieden breiten Bereichen);
  // nachgebildet ergibt sich E = 29,9 und ein 10⁻⁴-Quantil bei 30 Zügen von 27.
  const kongruenzFaelle = new Set();
  await pruefeAufgabe(page, bericht, {
    nr: 4, name: "A4 Kongruenzsatz", runden: 30, mindestensVerschieden: 27,
    deute: (frage) => {
      // Die Reihenfolge der Abfragen ist wesentlich: SsW nennt ebenfalls zwei Seiten, wird aber
      // durch den Zusatz über die längere Seite kenntlich.
      let soll = null;
      if (/liegt der längeren Seite gegenüber/.test(frage)) {
        soll = 4;
        const m = frage.match(/a = (\d+) cm, b = (\d+) cm, α = (\d+)°/);
        if (!m) return null;
        pruefe(Number(m[1]) > Number(m[2]),
          `A4: bei SsW liegt α nicht der längeren Seite gegenüber — a = ${m[1]}, b = ${m[2]}`);
      } else if (/γ = \d+°/.test(frage)) {
        soll = 2;
      } else if (/β = \d+°/.test(frage)) {
        soll = 3;
        const m = frage.match(/α = (\d+)°, β = (\d+)°/);
        if (!m) return null;
        pruefe(Number(m[1]) + Number(m[2]) < 180,
          `A4: bei WSW ist α + β = ${Number(m[1]) + Number(m[2])}° — dann gibt es das Dreieck nicht`);
      } else if (/c = \d+ cm/.test(frage)) {
        soll = 1;
        const m = frage.match(/a = (\d+) cm, b = (\d+) cm, c = (\d+) cm/);
        if (!m) return null;
        const [a, b, c] = m.slice(1, 4).map(Number);
        const laengste = Math.max(a, b, c);
        pruefe(a + b + c - laengste > laengste,
          `A4: die SSS-Angabe ${a}/${b}/${c} verletzt die Dreiecksungleichung`);
      }
      if (!soll) return null;
      kongruenzFaelle.add(soll);
      // Der Hinweis der Seite unterscheidet gerade die beiden Fälle mit zwei Seiten und einem
      // Winkel; die übrigen falschen Kennziffern müssen wenigstens zurückgewiesen werden.
      const mitHinweis = soll === 2 ? 4 : 2;
      const ohneHinweis = [1, 2, 3, 4].find((k) => k !== soll && k !== mitHinweis);
      return {
        richtig: soll,
        toleranz: 0.02,
        falsch: [[mitHinweis, "Achte darauf"], [ohneHinweis, null]],
      };
    },
  });
  pruefe(kongruenzFaelle.size === 4,
    `A4: nur ${kongruenzFaelle.size} der vier Kongruenzsätze kamen in 30 Zügen vor`);

  // Aufgabe 5 — Anzahl der ganzzahligen dritten Seiten: 2·min(a, b) − 1. Gemessen: 108 verschiedene
  // in 200 Würfen, zurückgerechnet rund 143 Kandidaten. Schranke: simuliertes 10⁻⁴-Quantil bei
  // 30 Zügen für 0,8 · n — 20.
  await pruefeAufgabe(page, bericht, {
    nr: 5, name: "A5 Anzahl der Möglichkeiten", runden: 30, mindestensVerschieden: 20,
    deute: (frage) => {
      const m = frage.match(/a = (\d+) cm.*?b = (\d+) cm/);
      if (!m) return null;
      const a = Number(m[1]), b = Number(m[2]);
      const anzahl = 2 * Math.min(a, b) - 1;
      pruefe(anzahl === (a + b - 1) - (Math.abs(a - b) + 1) + 1,
        `A5: die Zählformel stimmt nicht für a = ${a}, b = ${b}`);
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

  // Aufgabe 6 — Umfang und Basis eines gleichschenkligen Dreiecks, zwei Felder. Gemessen: 155
  // verschiedene in 200 Würfen; die wirkliche Verteilung (Basis mal im erlaubten Bereich, mal
  // darüber) ergibt E = 28,9 und ein 10⁻⁴-Quantil bei 30 Zügen von 24. Angesetzt wird die
  // vorsichtigere Schranke aus der Rechnung mit 0,8 · n — 23.
  let seinFaelle = 0, keinFaelle = 0;
  await pruefeAufgabe(page, bericht, {
    nr: 6, name: "A6 Umfang und Basis", runden: 30, mindestensVerschieden: 23,
    deute: (frage) => {
      const m = frage.match(/u = (\d+) cm.*?c = (\d+) cm/);
      if (!m) return null;
      const u = Number(m[1]), c = Number(m[2]);
      const schenkel = (u - c) / 2;
      pruefe(Number.isInteger(schenkel), `A6: die Schenkellänge (${u} − ${c}) : 2 ist nicht ganzzahlig`);
      const moeglich = c < 2 * schenkel;
      if (moeglich) seinFaelle++; else keinFaelle++;
      return {
        felder: [schenkel, moeglich ? 1 : 2],
        toleranz: 0.02,
        falschFelder: [
          [0, u - c, "beide Schenkel zusammen"],
          [1, moeglich ? 2 : 1, "Vergleiche die Basis"],
        ],
      };
    },
  });
  pruefe(seinFaelle > 0 && keinFaelle > 0,
    `A6: in 30 Zügen gab es ${seinFaelle}-mal ein mögliches und ${keinFaelle}-mal ein unmögliches Dreieck — beides muss vorkommen`);

  // Aufgabe 7 — Winkelhalbierende: ∠ADC = 180° − α − γ/2. Gemessen: 82 verschiedene in 200 Würfen,
  // zurückgerechnet rund 93 Kandidaten. Die Ziehung ist nicht gleichverteilt (der Bereich für α
  // hängt von γ ab); nachgebildet ergibt sich E = 25,7 und ein 10⁻⁴-Quantil bei 30 Zügen von 19.
  // Angesetzt wird die vorsichtigere Schranke aus der Rechnung mit 0,8 · n — 18.
  await pruefeAufgabe(page, bericht, {
    nr: 7, name: "A7 Winkelhalbierende", runden: 30, mindestensVerschieden: 18,
    deute: (frage) => {
      const m = frage.match(/α = (\d+)° und γ = (\d+)°/);
      if (!m) return null;
      const alpha = Number(m[1]), gamma = Number(m[2]);
      const halb = gamma / 2;
      pruefe(180 - alpha - gamma > 0, `A7: β = ${180 - alpha - gamma}° — das Dreieck gibt es nicht`);
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

  // Aufgabe 8 — eine WSW-Angabe durchdacht, drei Felder. Gemessen: 197 verschiedene in 200 Würfen;
  // die nachgebildete Verteilung ergibt E = 29,9 und ein 10⁻⁴-Quantil bei 30 Zügen von 27.
  await pruefeAufgabe(page, bericht, {
    nr: 8, name: "A8 WSW-Angabe", runden: 30, mindestensVerschieden: 27,
    deute: (frage) => {
      const m = frage.match(/c = (\d+) cm.*?α = (\d+)°.*?β = (\d+)°/);
      if (!m) return null;
      const [c, alpha, beta] = m.slice(1, 4).map(Number);
      pruefe(alpha + beta < 180, `A8: α + β = ${alpha + beta}° — dann schneiden sich die Schenkel nicht`);
      pruefe(c > 0, `A8: c = ${c} cm`);
      return {
        // γ aus der Winkelsumme, dann Eindeutigkeit (ja) und der Kongruenzsatz WSW.
        felder: [180 - alpha - beta, 1, 3],
        toleranz: 0.02,
        falschFelder: [
          [0, alpha + beta, "Summe der beiden gegebenen Winkel"],
          [1, 2, "genau einem Punkt"],
          [2, 2, "zwischen den beiden Winkeln"],
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
