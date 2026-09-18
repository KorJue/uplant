// Fachliche Prüfung: Kapitel 2, Thema 2 „Flächeninhalt und Umfang“.
//
// Zwei Verwechslungen tragen dieses Thema: Fläche gegen Umfang und der
// Umrechnungsfaktor 100 gegen 10. Beide werden hier eigens ausgelöst — die
// Seite muss sie zurückweisen und benennen.

"use strict";

const { neuerBericht } = require("../lib/pruefen");
const { starteBrowser, neueSeite, oeffne } = require("../lib/seite");
const { pruefeNotation } = require("../lib/notation");
const { pruefeKontrast } = require("../lib/kontrast");
const { pruefeAufgabe } = require("../lib/aufgaben");

const bericht = neuerBericht();
const { pruefe } = bericht;
const SEITE = "/mathematik/grundwissen-5-10/02-geometrie/02-flaeche-umfang/index.html";

// Zehnerexponent der Flächeneinheiten, bezogen auf m².
const EXP = { "mm²": -6, "cm²": -4, "dm²": -2, "m²": 0, a: 2, ha: 4, "km²": 6 };
const ohnePunkte = (s) => Number(String(s).replace(/\./g, "").replace(",", "."));

async function aufgaben(page) {
  // Aufgabe 1 — Rechteck: Fläche oder Umfang. Gemessen mit tests/werkzeug-streuung.js: 144
  // verschiedene in 200 Würfen, zurückgerechnet also rund 286 Kandidaten. Die Schranke ist das
  // simulierte 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für 0,8 · n gerechnet — 22.
  await pruefeAufgabe(page, bericht, {
    nr: 1, name: "A1 Rechteck", runden: 30, mindestensVerschieden: 22,
    deute: (frage) => {
      const m = frage.match(/(\d+) cm lang und (\d+) cm breit/);
      if (!m) return null;
      const a = Number(m[1]), b = Number(m[2]);
      const flaeche = a * b, umfang = 2 * (a + b);
      const nachFlaeche = frage.includes("Flächeninhalt");
      return {
        richtig: nachFlaeche ? flaeche : umfang,
        toleranz: 0.02,
        falsch: [
          [nachFlaeche ? umfang : flaeche, nachFlaeche ? "Das ist der Umfang" : "Das ist der Flächeninhalt"],
          [nachFlaeche ? null : a + b, nachFlaeche ? null : "alle vier"],
        ],
      };
    },
  });

  // Aufgabe 2 — Flächeneinheiten umrechnen. Gemessen mit tests/werkzeug-streuung.js: 166
  // verschiedene in 200 Würfen, zurückgerechnet also rund 517 Kandidaten. Die Schranke ist das
  // simulierte 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für 0,8 · n gerechnet — 24.
  await pruefeAufgabe(page, bericht, {
    nr: 3, name: "A3 Flächeneinheiten", runden: 30, mindestensVerschieden: 24,
    deute: (frage) => {
      const m = frage.match(/Rechne um: ([\d.,]+) (mm²|cm²|dm²|m²|a|ha|km²) = \? (mm²|cm²|dm²|m²|a|ha|km²)/);
      if (!m) return null;
      const wert = ohnePunkte(m[1]);
      const diff = EXP[m[2]] - EXP[m[3]];
      const richtig = wert * Math.pow(10, diff);
      return {
        richtig,
        toleranz: Math.max(1e-9, Math.abs(richtig) * 1e-9),
        falsch: [
          // Mit dem Längenfaktor gerechnet: eine Stufe ist dann nur 10 groß.
          [wert * Math.pow(10, diff / 2), "Faktor der Längen"],
          // Die Richtung verdreht.
          [wert * Math.pow(10, -diff), "Richtung stimmt nicht"],
        ],
      };
    },
  });

  // Aufgabe 3 — L-Form: volles Rechteck minus Ausschnitt. Gemessen mit
  // tests/werkzeug-streuung.js: 190 verschiedene in 200 Würfen, zurückgerechnet also rund 1923
  // Kandidaten. Die Schranke ist das simulierte 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für
  // 0,8 · n gerechnet — 26.
  await pruefeAufgabe(page, bericht, {
    nr: 5, name: "A5 L-Form", runden: 30, mindestensVerschieden: 26,
    deute: (frage) => {
      const m = frage.match(/Rechteck von (\d+) cm × (\d+) cm, aus dem an einer Ecke ein Rechteck von (\d+) cm × (\d+) cm/);
      if (!m) return null;
      const [a, b, c, d] = m.slice(1).map(Number);
      return {
        richtig: a * b - c * d,
        toleranz: 0.02,
        falsch: [
          [a * b, "vollen"],
          [c * d, "Ausschnitts"],
          [2 * (a + b), "Umfang"],
        ],
      };
    },
  });

  // Aufgabe 4 — Zaun nach Umfang, Rasen nach Fläche. Gemessen mit tests/werkzeug-streuung.js:
  // 199 verschiedene in 200 Würfen, zurückgerechnet also rund 19834 Kandidaten. Die Schranke
  // ist das simulierte 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für 0,8 · n gerechnet — 27.
  await pruefeAufgabe(page, bericht, {
    nr: 7, name: "A7 Zaun und Rasen", runden: 30, mindestensVerschieden: 27,
    deute: (frage) => {
      const m = frage.match(/(\d+) m lang und (\d+) m breit.*?\((\d+) € je Meter\).*?\((\d+) € je Quadratmeter\)/);
      if (!m) return null;
      const [a, b, preisZaun, preisRasen] = m.slice(1).map(Number);
      const umfang = 2 * (a + b), flaeche = a * b;
      return {
        richtig: umfang * preisZaun + flaeche * preisRasen,
        toleranz: 0.02,
        falsch: [
          [umfang * preisZaun, "nur die Kosten für den Zaun"],
          [flaeche * preisRasen, "nur die Kosten für den Rasen"],
          // Die beiden Preise vertauscht.
          [flaeche * preisZaun + umfang * preisRasen, "Preise vertauscht"],
        ],
      };
    },
  });

  // Aufgabe 2 — Fläche und Umfang nebeneinander (Aufgabe zum Ausfüllen). Gemessen mit
  // tests/werkzeug-streuung.js: 135 verschiedene in 200 Würfen, zurückgerechnet rund 236
  // Kandidaten (16 · 14 = 224 Paare). Die Schranke ist das simulierte 10⁻⁴-Quantil bei 30 Zügen,
  // vorsichtshalber für 0,8 · n gerechnet — 22.
  await pruefeAufgabe(page, bericht, {
    nr: 2, name: "A2 Fläche und Umfang", runden: 30, mindestensVerschieden: 22,
    deute: (frage) => {
      const m = frage.match(/ist (\d+) cm lang und (\d+) cm breit/);
      if (!m) return null;
      const a = Number(m[1]), b = Number(m[2]);
      const A = a * b, u = 2 * (a + b);
      // Gleiche Maßzahl für beide Größen machte die Felder ununterscheidbar.
      pruefe(A !== u, `A2: bei ${a} × ${b} haben Fläche und Umfang dieselbe Maßzahl (${A})`);
      return {
        felder: [A, u],
        falschFelder: [
          [0, u, "Umfang"],
          [1, A, "Flächeninhalt"],
        ],
      };
    },
  });

  // Aufgabe 4 — die fehlende Seitenlänge. Gemessen mit tests/werkzeug-streuung.js: 143
  // verschiedene in 200 Würfen, zurückgerechnet rund 279 Kandidaten (14 · 13 · 2 Fragerichtungen).
  // Die Schranke ist das simulierte 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für 0,8 · n
  // gerechnet — 23.
  await pruefeAufgabe(page, bericht, {
    nr: 4, name: "A4 fehlende Seitenlänge", runden: 30, mindestensVerschieden: 23,
    deute: (frage) => {
      const m = frage.match(/Flächeninhalt (\d+) cm².*?Seite ist (\d+) cm lang/);
      if (!m) return null;
      const A = Number(m[1]), a = Number(m[2]);
      pruefe(A % a === 0, `A4: ${A} cm² lässt sich nicht glatt durch ${a} cm teilen`);
      const b = A / a;
      const nachUmfang = /Umfang/.test(frage);
      return {
        richtig: nachUmfang ? 2 * (a + b) : b,
        falsch: [[A - a, "dividiert"]],
      };
    },
  });

  // Aufgabe 6 — gleicher Umfang, andere Fläche (Aufgabe zum Ausfüllen). Gemessen mit
  // tests/werkzeug-streuung.js: 170 verschiedene in 200 Würfen, zurückgerechnet rund 596
  // Kandidaten. Die Schranke ist das simulierte 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für
  // 0,8 · n gerechnet — 24.
  await pruefeAufgabe(page, bericht, {
    nr: 6, name: "A6 gleicher Umfang", runden: 30, mindestensVerschieden: 24,
    deute: (frage) => {
      const m = frage.match(/Umfang von (\d+) cm.*?Rechteck I: (\d+) cm × (\d+) cm\s*Rechteck II: (\d+) cm × (\d+) cm/);
      if (!m) return null;
      const [u, a1, b1, a2, b2] = m.slice(1).map(Number);
      // Der Kern der Aufgabe: Beide Rechtecke müssen wirklich denselben Umfang haben.
      pruefe(2 * (a1 + b1) === u && 2 * (a2 + b2) === u,
        `A6: die Umfänge stimmen nicht überein (${2 * (a1 + b1)} und ${2 * (a2 + b2)}, angekündigt ${u})`);
      const A1 = a1 * b1, A2 = a2 * b2;
      pruefe(A1 !== A2, `A6: beide Flächen sind gleich groß (${A1}) — dann gibt es keinen Unterschied zu nennen`);
      return {
        felder: [A1, A2, Math.abs(A1 - A2)],
        falschFelder: [
          [0, 2 * (a1 + b1) !== A1 ? 2 * (a1 + b1) : null, "Umfang"],
          [2, A1 + A2, "Unterschied"],
        ],
      };
    },
  });

  // Aufgabe 8 — Weg um ein Beet (Aufgabe zum Ausfüllen). Gemessen mit tests/werkzeug-streuung.js:
  // 181 verschiedene in 200 Würfen, zurückgerechnet rund 980 Kandidaten (15 · 13 · 4 = 780, dazu
  // die Messungenauigkeit). Die Schranke ist das simulierte 10⁻⁴-Quantil bei 30 Zügen,
  // vorsichtshalber für 0,8 · n gerechnet — 25.
  await pruefeAufgabe(page, bericht, {
    nr: 8, name: "A8 Weg um das Beet", runden: 30, mindestensVerschieden: 25,
    deute: (frage) => {
      const m = frage.match(/Beet ist (\d+) m lang und (\d+) m breit.*?(\d+) m breiter Weg/);
      if (!m) return null;
      const [a, b, rand] = m.slice(1).map(Number);
      const innen = a * b;
      const aussen = (a + 2 * rand) * (b + 2 * rand);
      return {
        felder: [innen, aussen, aussen - innen],
        falschFelder: [
          [1, (a + rand) * (b + rand), "beiden"],
          [2, aussen, "abgezogen"],
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
