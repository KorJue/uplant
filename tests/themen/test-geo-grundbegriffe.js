// Fachliche Prüfung: Kapitel 2, Thema 1 „Grundbegriffe der Geometrie“.
//
// Die vier Aufgaben treten in mehreren Fassungen auf — Ergänzungswinkel,
// Spiegelung, Quadrant, Abstand von einer achsenparallelen Geraden. Jede wird
// aus ihrem Text heraus erkannt und unabhängig nachgerechnet; die vorgesehenen
// Verwechslungen (x- statt y-Koordinate, Umfang statt Fläche) werden eigens
// eingetragen.

"use strict";

const { neuerBericht } = require("../lib/pruefen");
const { starteBrowser, neueSeite, oeffne } = require("../lib/seite");
const { pruefeNotation } = require("../lib/notation");
const { pruefeKontrast } = require("../lib/kontrast");
const { pruefeAufgabe } = require("../lib/aufgaben");

const bericht = neuerBericht();
const { pruefe } = bericht;
const SEITE = "/mathematik/grundwissen-5-10/02-geometrie/01-grundbegriffe/index.html";

const VOLL = { "rechten Winkel": 90, "gestreckten Winkel": 180, Vollwinkel: 360 };

async function aufgaben(page) {
  // Aufgabe 1 — Ergänzungswinkel. Drei Fassungen mit 71, 141 bzw. 301
  // Gradzahlen; je Fassung wird gleichverteilt gezogen.
  await pruefeAufgabe(page, bericht, {
    nr: 1, name: "A1 Ergänzungswinkel", runden: 30, mindestensVerschieden: 25,
    deute: (frage) => {
      const m = frage.match(/der (\d+)° zu einem (rechten Winkel|gestreckten Winkel|Vollwinkel) ergänzt/);
      if (!m) return null;
      const g = Number(m[1]), voll = VOLL[m[2]];
      return {
        richtig: voll - g,
        // Die drei Vollwinkel verwechselt — der nächstliegende Fehler.
        falsch: Object.values(VOLL).filter((v) => v !== voll).map((v) => [v - g, null]),
      };
    },
  });

  // Aufgabe 2 — Spiegelung und Quadrant. 11 · 11 Punkte × 3 Fassungen.
  await pruefeAufgabe(page, bericht, {
    nr: 2, name: "A2 Koordinaten", runden: 30, mindestensVerschieden: 26,
    deute: (frage) => {
      const p = frage.replace(/−/g, "-").match(/P\((-?\d+) \| (-?\d+)\)/);
      if (!p) return null;
      const x = Number(p[1]), y = Number(p[2]);
      if (frage.includes("x-Achse")) {
        // Gespiegelt an der x-Achse: y wechselt das Vorzeichen.
        return { richtig: -y, falsch: [[y, null], [-x, null]] };
      }
      if (frage.includes("y-Achse")) {
        return { richtig: -x, falsch: [[x, null], [-y, null]] };
      }
      if (frage.includes("Quadranten")) {
        const q = x > 0 ? (y > 0 ? 1 : 4) : y > 0 ? 2 : 3;
        return { richtig: q, falsch: [[q === 4 ? 1 : q + 1, null]] };
      }
      return null;
    },
  });

  // Aufgabe 3 — Abstand von einer achsenparallelen Geraden.
  await pruefeAufgabe(page, bericht, {
    nr: 3, name: "A3 Abstand", runden: 30, mindestensVerschieden: 26,
    deute: (frage) => {
      const t = frage.replace(/−/g, "-");
      const g = t.match(/(waagerecht|senkrecht) durch alle Punkte mit ([xy]) = (-?\d+)/);
      const p = t.match(/P\((-?\d+) \| (-?\d+)\)/);
      if (!g || !p) return null;
      const lage = Number(g[3]), px = Number(p[1]), py = Number(p[2]);
      const waagerecht = g[1] === "waagerecht";
      // Bei einer waagerechten Geraden steht das Lot senkrecht: Es zählt y.
      return {
        richtig: Math.abs((waagerecht ? py : px) - lage),
        toleranz: 0.02,
        falsch: [[Math.abs((waagerecht ? px : py) - lage),
          waagerecht ? "Du hast die x-Koordinate verwendet" : "Du hast die y-Koordinate verwendet"]],
      };
    },
  });

  // Aufgabe 4 — Umfang eines Rechtecks aus seinen Eckpunkten.
  await pruefeAufgabe(page, bericht, {
    nr: 4, name: "A4 Umfang aus Eckpunkten", runden: 30, mindestensVerschieden: 26,
    deute: (frage) => {
      const t = frage.replace(/−/g, "-");
      const punkte = [...t.matchAll(/\((-?\d+) \| (-?\d+)\)/g)].map((m) => [Number(m[1]), Number(m[2])]);
      if (punkte.length !== 4) return null;
      const breite = Math.abs(punkte[1][0] - punkte[0][0]);
      const hoehe = Math.abs(punkte[2][1] - punkte[1][1]);
      return {
        richtig: 2 * (breite + hoehe),
        toleranz: 0.02,
        falsch: [
          [breite + hoehe, "alle vier"],
          [breite * hoehe, "Flächeninhalt"],
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
