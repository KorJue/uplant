// Fachliche Prüfung: Kapitel 1, Thema 5 „Brüche und Dezimalzahlen
// multiplizieren und dividieren“.
//
// Der Kern ist die Kehrwertregel: Durch einen Bruch dividieren heißt, mit
// seinem Kehrwert zu multiplizieren. Deshalb wird bei der Divisionsaufgabe
// eigens das Ergebnis der Multiplikation eingetragen — die Seite muss es
// zurückweisen und den Fehler beim Namen nennen.

"use strict";

const { neuerBericht } = require("../lib/pruefen");
const { starteBrowser, neueSeite, oeffne } = require("../lib/seite");
const { pruefeNotation } = require("../lib/notation");
const { pruefeKontrast } = require("../lib/kontrast");
const { pruefeAufgabe } = require("../lib/aufgaben");

const bericht = neuerBericht();
const { pruefe } = bericht;
const SEITE = "/mathematik/grundwissen-5-10/01-groessen-und-rechnen/05-multiplizieren-dividieren/index.html";

function ggT(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { const h = a % b; a = b; b = h; } return a; }
function kuerze(z, n) { const g = ggT(z, n); return [z / g, n / g]; }

async function bruchdaten(page, box) {
  return page.evaluate((sel) => {
    const p = document.querySelector(`${sel} .aufgabe-prompt`);
    return {
      brueche: [...p.querySelectorAll(".bruch")].map((b) => ({
        z: Number(b.querySelector(".z").textContent),
        n: Number(b.querySelector(".n").textContent),
      })),
      text: p.innerText.replace(/\s+/g, " ").trim(),
    };
  }, box);
}

// Die Beschriftungen der Eingabefelder — bei den Ausfüllaufgaben steht dort ein Teil der Angabe.
async function feldnamen(page, box) {
  return page.evaluate((sel) => ({
    felder: [...document.querySelectorAll(`${sel} .aufgabe-feld-name`)].map((e) => e.innerText.replace(/\s+/g, " ").trim()),
    text: document.querySelector(`${sel} .aufgabe-prompt`).innerText.replace(/\s+/g, " ").trim(),
  }), box);
}

async function aufgaben(page) {
  // Aufgabe 1 — Bruch mal natürliche Zahl. Gemessen mit tests/werkzeug-streuung.js: 126
  // verschiedene in 200 Würfen, zurückgerechnet also rund 198 Kandidaten. Die Schranke ist das
  // simulierte 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für 0,8 · n gerechnet — 21.
  await pruefeAufgabe(page, bericht, {
    nr: 1, name: "A1 Bruch mal Zahl", runden: 30, mindestensVerschieden: 21, liesRoh: bruchdaten,
    deute: (frage, roh) => {
      if (!roh || roh.brueche.length !== 1) return null;
      const { z, n } = roh.brueche[0];
      const m = roh.text.match(/·\s*(\d+)\s*$/);
      if (!m) return null;
      const k = Number(m[1]);
      const [zk, nk] = kuerze(z * k, n);
      return {
        richtig: `${zk}/${nk}`,
        falsch: [
          // Auch den Nenner mit k multipliziert. Das ist wertverschieden und
          // bekommt deshalb keinen eigenen Hinweis — nur eine Zurückweisung.
          [`${z * k}/${n * k}`, null],
          [z * k === zk ? null : `${z * k}/${n}`, "nicht vollständig gekürzt"],
        ],
      };
    },
  });

  // Aufgabe 3 — Bruch mal Bruch. 6 × 6 Nennerpaare mit je (n₁−1)(n₂−1)
  // Zählerpaaren; die Streuung liegt deutlich über der Schranke.
  await pruefeAufgabe(page, bericht, {
    nr: 3, name: "A3 Bruch mal Bruch", runden: 30, mindestensVerschieden: 24, liesRoh: bruchdaten,
    deute: (frage, roh) => {
      if (!roh || roh.brueche.length !== 2 || !roh.text.includes("·")) return null;
      const [a, b] = roh.brueche;
      const [zk, nk] = kuerze(a.z * b.z, a.n * b.n);
      return {
        richtig: `${zk}/${nk}`,
        falsch: [
          [a.z * b.z === zk && a.n * b.n === nk ? null : `${a.z * b.z}/${a.n * b.n}`, "nicht vollständig gekürzt"],
          // Über Kreuz multipliziert — das wäre die Division.
          [`${a.z * b.n}/${a.n * b.z}`, null],
        ],
      };
    },
  });

  // Aufgabe 3 — Division durch einen Bruch.
  await pruefeAufgabe(page, bericht, {
    nr: 5, name: "A5 durch einen Bruch teilen", runden: 30, mindestensVerschieden: 22, liesRoh: bruchdaten,
    deute: (frage, roh) => {
      if (!roh || roh.brueche.length !== 2 || !roh.text.includes(":")) return null;
      const [a, b] = roh.brueche;
      const [zk, nk] = kuerze(a.z * b.n, a.n * b.z);
      const [mz, mn] = kuerze(a.z * b.z, a.n * b.n);
      return {
        richtig: `${zk}/${nk}`,
        falsch: [
          // Multipliziert statt dividiert — die Aufgabe hat dafür einen eigenen Hinweis.
          [`${mz}/${mn}`, "multipliziert statt dividiert"],
          [a.z * b.n === zk && a.n * b.z === nk ? null : `${a.z * b.n}/${a.n * b.z}`, "kürze noch vollständig"],
        ],
      };
    },
  });

  // Aufgabe 7 — Dezimalrechnung im Sachzusammenhang.
  await pruefeAufgabe(page, bericht, {
    nr: 7, name: "A7 Dezimalrechnung", runden: 30, mindestensVerschieden: 25,
    deute: (frage) => {
      const m = frage.match(/kauft (\d+) .* zu je ([\d,]+) €.* auf (\d+) Gruppen/);
      if (!m) return null;
      const menge = Number(m[1]);
      const preisCent = Math.round(Number(m[2].replace(",", ".")) * 100);
      const gruppen = Number(m[3]);
      const gesamtCent = preisCent * menge;
      return {
        richtig: gesamtCent / gruppen / 100,
        toleranz: 0.005,
        falsch: [
          // Das Teilen durch die Gruppen vergessen.
          [gesamtCent / 100, null],
          // Statt zu teilen mit der Gruppenzahl multipliziert.
          [(gesamtCent * gruppen) / 100, null],
        ],
      };
    },
  });

  // Aufgabe 2 — Kehrwert. Gemessen mit tests/werkzeug-streuung.js: 42 verschiedene in 200 Würfen,
  // zurückgerechnet rund 42 Kandidaten (14 ganze Zahlen + 28 echte Brüche). Die Schranke ist das
  // simulierte 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für 0,8 · n gerechnet — 14.
  await pruefeAufgabe(page, bericht, {
    nr: 2, name: "A2 Kehrwert", runden: 30, mindestensVerschieden: 14, liesRoh: bruchdaten,
    deute: (frage, roh) => {
      if (!roh) return null;
      if (roh.brueche.length >= 1) {
        const [z, n] = [roh.brueche[0].z, roh.brueche[0].n];
        return {
          richtig: `${n}/${z}`,
          falsch: [[`${z}/${n}`, "Bruch selbst"]],
        };
      }
      const m = roh.text.match(/Kehrwert von (\d+)\?/);
      if (!m) return null;
      const k = Number(m[1]);
      return {
        richtig: `1/${k}`,
        falsch: [[`${k}/1`, "Zahl selbst"]],
      };
    },
  });

  // Aufgabe 4 — Dezimalzahlen multiplizieren. Gemessen mit tests/werkzeug-streuung.js: in 200
  // Würfen kein einziges Doppel (880 · 79 Paare). Die Schranke ist das simulierte 10⁻⁴-Quantil bei
  // 30 Zügen — 27.
  await pruefeAufgabe(page, bericht, {
    nr: 4, name: "A4 Dezimalzahlen multiplizieren", runden: 30, mindestensVerschieden: 27,
    deute: (frage) => {
      const m = frage.match(/Berechne: ([\d,]+) · ([\d,]+)/);
      if (!m) return null;
      const aH = Math.round(Number(m[1].replace(",", ".")) * 100);
      const bZ = Math.round(Number(m[2].replace(",", ".")) * 10);
      return {
        richtig: (aH * bZ) / 1000,
        toleranz: 0.0004,
        falsch: [
          // Eine Nachkommastelle zu wenig abgezählt.
          [(aH * bZ) / 100, "Komma"],
          [aH * bZ, "ohne Komma"],
        ],
      };
    },
  });

  // Aufgabe 6 — durch eine Dezimalzahl dividieren. Gemessen mit tests/werkzeug-streuung.js:
  // 143 verschiedene in 200 Würfen, zurückgerechnet rund 279 Kandidaten (9 Divisoren · 38
  // Quotienten = 342). Die Schranke ist das simulierte 10⁻⁴-Quantil bei 30 Zügen,
  // vorsichtshalber für 0,8 · n gerechnet — 22.
  await pruefeAufgabe(page, bericht, {
    nr: 6, name: "A6 durch eine Dezimalzahl teilen", runden: 30, mindestensVerschieden: 22,
    deute: (frage) => {
      const m = frage.match(/Berechne: ([\d,]+) : ([\d,]+)/);
      if (!m) return null;
      const dividend = Math.round(Number(m[1].replace(",", ".")) * 100);
      const divisor = Math.round(Number(m[2].replace(",", ".")) * 100);
      pruefe(dividend % divisor === 0, `A6: ${m[1]} : ${m[2]} geht nicht auf`);
      const q = dividend / divisor;
      return {
        richtig: q,
        toleranz: 0.0004,
        falsch: [[(dividend * divisor) / 10000, "multipliziert"]],
      };
    },
  });

  // Aufgabe 8 — Rezept umrechnen (Aufgabe zum Ausfüllen). Gemessen mit tests/werkzeug-streuung.js:
  // 173 verschiedene in 200 Würfen, zurückgerechnet rund 669 Kandidaten. Die Schranke ist das
  // simulierte 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für 0,8 · n gerechnet — 25.
  await pruefeAufgabe(page, bericht, {
    nr: 8, name: "A8 Rezept umrechnen", runden: 30, mindestensVerschieden: 25, liesRoh: feldnamen,
    deute: (frage, roh) => {
      const m = frage.match(/für (\d+) Personen braucht ([\d,]+) kg .*?Kilogramm kostet ([\d,]+) €/);
      if (!m || !roh) return null;
      const personen = Number(m[1]);
      const gesamtH = Math.round(Number(m[2].replace(",", ".")) * 100);
      const preisC = Math.round(Number(m[3].replace(",", ".")) * 100);
      const zielM = (roh.felder[1] || "").match(/für (\d+) Personen/);
      if (!zielM) return null;
      const ziel = Number(zielM[1]);
      pruefe(gesamtH % personen === 0, `A8: ${m[2]} kg lässt sich nicht glatt durch ${personen} teilen`);
      const proPerson = gesamtH / personen;
      return {
        toleranz: 0.0004,
        felder: [proPerson / 100, (proPerson * ziel) / 100, (proPerson * ziel * preisC) / 10000],
        falschFelder: [
          [0, gesamtH / 100, "für alle"],
          [1, (gesamtH * ziel) / 100, "vervielfacht"],
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
