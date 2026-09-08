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

async function aufgaben(page) {
  // Aufgabe 1 — Bruch mal natürliche Zahl. 8 Nenner × (n−1) Zähler × 5
  // Faktoren; der Nenner wird zuerst gezogen, deshalb ist die Verteilung
  // ungleich. Mit p(n, z, k) = 1/(8 · (n−1) · 5) ist bei 30 Zügen E = 27,4 und
  // σ = 1,3 — Schranke E − 3σ ≈ 23.
  await pruefeAufgabe(page, bericht, {
    nr: 1, name: "A1 Bruch mal Zahl", runden: 30, mindestensVerschieden: 23, liesRoh: bruchdaten,
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

  // Aufgabe 2 — Bruch mal Bruch. 6 × 6 Nennerpaare mit je (n₁−1)(n₂−1)
  // Zählerpaaren; die Streuung liegt deutlich über der Schranke.
  await pruefeAufgabe(page, bericht, {
    nr: 2, name: "A2 Bruch mal Bruch", runden: 30, mindestensVerschieden: 24, liesRoh: bruchdaten,
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
    nr: 3, name: "A3 durch einen Bruch teilen", runden: 30, mindestensVerschieden: 22, liesRoh: bruchdaten,
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

  // Aufgabe 4 — Dezimalrechnung im Sachzusammenhang.
  await pruefeAufgabe(page, bericht, {
    nr: 4, name: "A4 Dezimalrechnung", runden: 30, mindestensVerschieden: 25,
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
