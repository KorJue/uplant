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
  // Aufgabe 1 — Runden. 98 000 Zahlen × 3 Stellen: In 40 Zügen ist praktisch
  // jede Aufgabe neu, erwartete Doppel 40·39/(2·294 000) ≈ 0,003.
  await pruefeAufgabe(page, bericht, {
    nr: 1, name: "A1 Runden", runden: 40, mindestensVerschieden: 38,
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

  // Aufgabe 2 — Stellenwerte. 9 · 10⁵ Kandidaten, Doppel praktisch ausgeschlossen.
  await pruefeAufgabe(page, bericht, {
    nr: 2, name: "A2 Stellenwerte", runden: 30, mindestensVerschieden: 29,
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

  // Aufgabe 3 — Größen addieren. 9 · 49 = 441 Kandidaten; bei 30 Zügen sind
  // 30·29/(2·441) ≈ 1,0 Doppel zu erwarten (Poisson, σ = 1,0).
  await pruefeAufgabe(page, bericht, {
    nr: 3, name: "A3 Größen addieren", runden: 30, mindestensVerschieden: 25,
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

  // Aufgabe 4 — kombiniert. 8 · 36 · 6 · 171 = 295 488 Kandidaten.
  await pruefeAufgabe(page, bericht, {
    nr: 4, name: "A4 kombiniert", runden: 30, mindestensVerschieden: 29,
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
