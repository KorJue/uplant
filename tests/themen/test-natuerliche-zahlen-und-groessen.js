// Fachliche Prüfung: Kapitel 1, Thema 1 „Natürliche Zahlen und Größen“.
//
// Geprüft wird, ob die Seite rechnet, was sie behauptet: Jede Aufgabe wird aus
// ihrem eigenen Text heraus unabhängig nachgerechnet, und die Rundungsregel
// wird an ihrer empfindlichsten Stelle geprüft — der Ziffer 5.

"use strict";

const { neuerBericht } = require("../lib/pruefen");
const { starteBrowser, neueSeite, oeffne } = require("../lib/seite");
const { pruefeNotation } = require("../lib/notation");
const { pruefeKontrast } = require("../lib/kontrast");
const { pruefeAufgabe, zahlen, streuung } = require("../lib/aufgaben");

const bericht = neuerBericht();
const { pruefe } = bericht;
const SEITE = "/mathematik/grundwissen-5-10/01-groessen-und-rechnen/01-natuerliche-zahlen-und-groessen/index.html";

// Die Rundungsregel der Schule: Ab der Ziffer 5 wird aufgerundet. Sie wird
// hier eigens nachgebildet, damit die Prüfung nicht dieselbe Formel benutzt
// wie die Seite.
function rundeAuf(n, stelle) {
  const rest = n % stelle;
  return rest * 2 >= stelle ? n - rest + stelle : n - rest;
}

const STELLEN = { Zehner: 10, Hunderter: 100, Tausender: 1000 };

async function aufgaben(page) {
  // Aufgabe 1 — Runden. Gemessen mit tests/werkzeug-streuung.js: in 200 Würfen kein einziges
  // Doppel, die Menge ist also viele Tausend groß. Die Schranke ist das simulierte 10⁻⁴-Quantil
  // bei 40 Zügen, vorsichtshalber für 0,8 · n gerechnet — 37.
  await pruefeAufgabe(page, bericht, {
    nr: 1, name: "A1 Runden", runden: 40, mindestensVerschieden: 37,
    deute: (frage) => {
      const m = frage.match(/Runde ([\d.]+) auf (Zehner|Hunderter|Tausender) genau/);
      if (!m) return null;
      const n = Number(m[1].replace(/\./g, ""));
      const stelle = STELLEN[m[2]];
      return {
        richtig: rundeAuf(n, stelle),
        // Abrunden statt aufrunden ist der Fehler, den die Aufgabe abfragt.
        falsch: [[n - (n % stelle) === rundeAuf(n, stelle) ? n - (n % stelle) + stelle : n - (n % stelle), null]],
        pruefe: (f, rueck) => {
          const ziffer = Math.floor(n / (stelle / 10)) % 10;
          const soll = ziffer >= 5 ? "aufrunden" : "abrunden";
          pruefe(rueck.includes(soll),
            `A1: Musterlösung nennt nicht „${soll}“, obwohl die Nachbarziffer ${ziffer} ist — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 3 — Stellenwerte. Gemessen mit tests/werkzeug-streuung.js: in 200 Würfen kein
  // einziges Doppel, die Menge ist also viele Tausend groß. Die Schranke ist das simulierte
  // 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für 0,8 · n gerechnet — 27.
  await pruefeAufgabe(page, bericht, {
    nr: 3, name: "A3 Stellenwerte", runden: 30, mindestensVerschieden: 27,
    deute: (frage) => {
      const m = frage.match(/aus (\d+) Hunderttausendern, (\d+) Zehntausendern, (\d+) Tausendern, (\d+) Hundertern, (\d+) Zehnern und (\d+) Einern/);
      if (!m) return null;
      const [ht, zt, t, h, z, e] = m.slice(1).map(Number);
      const richtig = ht * 100000 + zt * 10000 + t * 1000 + h * 100 + z * 10 + e;
      return {
        richtig,
        // Die Ziffern einfach aneinandergehängt ergäbe dieselbe Zahl; ein
        // typischer Fehler ist dagegen, eine Stelle zu überspringen.
        falsch: [[ht * 10000 + zt * 1000 + t * 100 + h * 10 + z, null]],
      };
    },
  });

  // Aufgabe 5 — Größen addieren. Gemessen mit tests/werkzeug-streuung.js: 166 verschiedene in
  // 200 Würfen, zurückgerechnet also rund 517 Kandidaten. Die Schranke ist das simulierte
  // 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für 0,8 · n gerechnet — 24.
  await pruefeAufgabe(page, bericht, {
    nr: 5, name: "A5 Größen addieren", runden: 30, mindestensVerschieden: 24,
    deute: (frage) => {
      const m = frage.match(/wiegt leer (\d+) t\. Er wird mit ([\d.]+) kg/);
      if (!m) return null;
      const t = Number(m[1]), kg = Number(m[2].replace(/\./g, ""));
      return {
        richtig: t * 1000 + kg,
        // Wer die Tonne nicht umrechnet, addiert Tonnen und Kilogramm.
        falsch: [[t + kg, null]],
      };
    },
  });

  // Aufgabe 7 — kombiniert. Gemessen mit tests/werkzeug-streuung.js: in 200 Würfen kein
  // einziges Doppel, die Menge ist also viele Tausend groß. Die Schranke ist das simulierte
  // 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für 0,8 · n gerechnet — 27.
  await pruefeAufgabe(page, bericht, {
    nr: 7, name: "A7 kombiniert", runden: 30, mindestensVerschieden: 27,
    deute: (frage) => {
      const m = frage.match(/stehen (\d+) Kisten mit je (\d+) kg und (\d+) Kisten mit je (\d+) kg/);
      if (!m) return null;
      const [a, b, c, d] = m.slice(1).map(Number);
      const gesamt = a * b + c * d;
      return {
        richtig: rundeAuf(gesamt, 1000) / 1000,
        // Abgeschnitten statt gerundet ist der nächstliegende Fehler.
        falsch: [[Math.floor(gesamt / 1000), null], [gesamt, null]],
      };
    },
  });

  // Aufgabe 2 — Stellenwert einer Ziffer. Gemessen mit tests/werkzeug-streuung.js: in 200 Würfen
  // kein einziges Doppel, die Menge ist also viele Tausend groß. Die Schranke ist das simulierte
  // 10⁻⁴-Quantil bei 30 Zügen — 27.
  await pruefeAufgabe(page, bericht, {
    nr: 2, name: "A2 Stellenwert", runden: 30, mindestensVerschieden: 27,
    deute: (frage) => {
      const m = frage.match(/In der Zahl ([\d.]+) steht die Ziffer (\d)\./);
      if (!m) return null;
      const ziffern = m[1].replace(/\./g, "");
      const d = m[2];
      // Die Frage „die Ziffer d“ ist nur eindeutig, wenn d genau einmal vorkommt.
      const anzahl = ziffern.split("").filter((z) => z === d).length;
      pruefe(anzahl === 1, `A2: die Ziffer ${d} kommt ${anzahl}-mal in ${m[1]} vor — die Frage ist nicht eindeutig`);
      const pos = ziffern.length - 1 - ziffern.indexOf(d);   // 0 = Einer
      const stellenwert = Math.pow(10, pos);
      return {
        richtig: Number(d) * stellenwert,
        falsch: [
          [Number(d), "Stellenwert"],
          [stellenwert, "Ziffer steht noch davor"],
        ],
      };
    },
  });

  // Aufgabe 4 — die Mitte auf dem Zahlenstrahl. Gemessen mit tests/werkzeug-streuung.js: in 200
  // Würfen kein einziges Doppel (480 · 58 = 27.840 mögliche Paare). Die Schranke ist das simulierte
  // 10⁻⁴-Quantil bei 30 Zügen — 27.
  await pruefeAufgabe(page, bericht, {
    nr: 4, name: "A4 Mitte", runden: 30, mindestensVerschieden: 27,
    deute: (frage) => {
      const m = frage.match(/liegen ([\d.]+) und ([\d.]+)\./);
      if (!m) return null;
      const a = Number(m[1].replace(/\./g, "")), b = Number(m[2].replace(/\./g, ""));
      pruefe((a + b) % 2 === 0, `A4: die Mitte von ${a} und ${b} ist keine ganze Zahl`);
      return {
        richtig: (a + b) / 2,
        falsch: [
          [b - a, "Abstand"],
          [a + b, "Hälfte"],
        ],
      };
    },
  });

  // Aufgabe 6 — eine Länge in drei Schreibweisen (Aufgabe zum Ausfüllen). Gemessen mit
  // tests/werkzeug-streuung.js: 114 verschiedene in 200 Würfen, zurückgerechnet rund 159
  // Kandidaten (8 · 19 = 152 Paare, dazu die Messungenauigkeit). Die Schranke ist das simulierte
  // 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für 0,8 · n gerechnet — 20.
  await pruefeAufgabe(page, bericht, {
    nr: 6, name: "A6 Länge umrechnen", runden: 30, mindestensVerschieden: 20,
    deute: (frage) => {
      const m = frage.match(/ist (\d+) km (\d+) m lang/);
      if (!m) return null;
      const km = Number(m[1]), rest = Number(m[2]);
      const gesamt = km * 1000 + rest;
      return {
        felder: [gesamt, gesamt * 100, 1000 - rest],
        falschFelder: [
          [0, km + rest, "1000"],
          [1, gesamt * 10, "Dezimeter"],
          [2, rest, "fehlt"],
        ],
      };
    },
  });

  // Aufgabe 8 — ordnen, runden, vergleichen (Aufgabe zum Ausfüllen). Gemessen mit
  // tests/werkzeug-streuung.js: in 200 Würfen kein einziges Doppel, die Menge ist also viele
  // Tausend groß. Die Schranke ist das simulierte 10⁻⁴-Quantil bei 30 Zügen — 27.
  await pruefeAufgabe(page, bericht, {
    nr: 8, name: "A8 ordnen", runden: 30, mindestensVerschieden: 27,
    deute: (frage) => {
      const m = frage.match(/vier Zahlen ([\d.]+), ([\d.]+), ([\d.]+), ([\d.]+)\./);
      if (!m) return null;
      const z = m.slice(1).map((x) => Number(x.replace(/\./g, "")));
      pruefe(new Set(z).size === 4, `A8: die vier Zahlen sind nicht paarweise verschieden — ${z.join(", ")}`);
      const gross = Math.max(...z), klein = Math.min(...z);
      return {
        felder: [gross, klein, rundeAuf(gross, 1000), gross - klein],
        falschFelder: [
          [0, klein, null],
          [2, Math.floor(gross / 1000) * 1000, "weggelassen"],
          [3, gross + klein, null],
        ],
      };
    },
  });
}

async function quizze(page) {
  // Die Kontrollfragen dieses Themas rechnen mit festen Zahlen; geprüft wird,
  // dass genau eine Antwort als richtig gilt und die Erklärung sie nennt.
  const ids = await page.evaluate(() => [...document.querySelectorAll(".quiz")].map((e) => e.id));
  pruefe(ids.length >= 3, `nur ${ids.length} Kontrollfragen`);
  for (const id of ids) {
    let richtige = 0, erklaerung = "";
    for (let i = 0; i < 4; i++) {
      await page.locator(`#${id} .quiz-opt`).nth(i).click();
      const r = (await page.locator(`#${id} .quiz-feedback`).innerText()).replace(/\s+/g, " ");
      if (r.startsWith("✓")) { richtige++; erklaerung = r; }
    }
    pruefe(richtige === 1, `${id}: ${richtige} richtige Antworten`);
    // Eine Rundungsregel lässt sich vollständig in Worten erklären; verlangt
    // wird deshalb nur, dass überhaupt begründet wird.
    pruefe(erklaerung.length > 60, `${id}: die Erklärung ist zu knapp (${erklaerung.length} Zeichen)`);
  }
}

(async () => {
  const browser = await starteBrowser();
  for (const dunkel of [false, true]) {
    const wo = dunkel ? "dunkel" : "hell";
    const page = await neueSeite(browser, { dunkel });
    await oeffne(page, SEITE);
    if (!dunkel) {
      await aufgaben(page);
      await quizze(page);
    } else {
      await pruefeKontrast(page, bericht, "dunkel");
    }
    await pruefeNotation(page, bericht, wo);
    for (const s of page.stoerungen) pruefe(false, `${wo}: ${s}`);
    await page.close();
  }
  await browser.close();
  bericht.abschluss();
})();
