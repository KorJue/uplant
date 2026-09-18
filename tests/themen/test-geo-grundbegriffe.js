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
  // Aufgabe 1 — Ergänzungswinkel. Gemessen mit tests/werkzeug-streuung.js: 160 verschiedene in
  // 200 Würfen, zurückgerechnet also rund 429 Kandidaten. Die Schranke ist das simulierte
  // 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für 0,8 · n gerechnet — 24.
  await pruefeAufgabe(page, bericht, {
    nr: 1, name: "A1 Ergänzungswinkel", runden: 30, mindestensVerschieden: 24,
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

  // Aufgabe 2 — Spiegelung und Quadrant. Gemessen mit tests/werkzeug-streuung.js: 152
  // verschiedene in 200 Würfen, zurückgerechnet also rund 346 Kandidaten. Die Schranke ist das
  // simulierte 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für 0,8 · n gerechnet — 23.
  await pruefeAufgabe(page, bericht, {
    nr: 3, name: "A3 Koordinaten", runden: 30, mindestensVerschieden: 23,
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
    nr: 5, name: "A5 Abstand", runden: 30, mindestensVerschieden: 26,
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
    nr: 7, name: "A7 Umfang aus Eckpunkten", runden: 30, mindestensVerschieden: 26,
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

  // Aufgabe 2 — Punktspiegelung am Ursprung (Aufgabe zum Ausfüllen). Gemessen mit
  // tests/werkzeug-streuung.js: 107 verschiedene in 200 Würfen, zurückgerechnet rund 141
  // Kandidaten (13 · 13 = 169 Punkte, ohne die auf den Achsen). Die Schranke ist das simulierte
  // 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für 0,8 · n gerechnet — 20.
  await pruefeAufgabe(page, bericht, {
    nr: 2, name: "A2 Punktspiegelung", runden: 30, mindestensVerschieden: 20,
    deute: (frage) => {
      const m = frage.match(/P\((-?\d+) \| (-?\d+)\) wird am <?strong>?Ursprung/) || frage.match(/P\((-?\d+) \| (-?\d+)\) wird am Ursprung/);
      if (!m) return null;
      const x = Number(m[1]), y = Number(m[2]);
      return {
        felder: [-x, -y],
        falschFelder: [
          [0, x, "beide"],
          [1, y, "Vorzeichen"],
        ],
      };
    },
  });

  // Aufgabe 4 — Abstand zweier Punkte. Gemessen mit tests/werkzeug-streuung.js: 195 verschiedene
  // in 200 Würfen, zurückgerechnet rund 3900 Kandidaten. Die Schranke ist das simulierte
  // 10⁻⁴-Quantil bei 30 Zügen — 27.
  await pruefeAufgabe(page, bericht, {
    nr: 4, name: "A4 Abstand zweier Punkte", runden: 30, mindestensVerschieden: 27,
    deute: (frage) => {
      const m = frage.match(/A\((-?\d+) \| (-?\d+)\) und B\((-?\d+) \| (-?\d+)\)/);
      if (!m) return null;
      const [ax, ay, bx, by] = m.slice(1).map(Number);
      // Ohne Wurzeln geht das nur, wenn eine Koordinate übereinstimmt — genau das verspricht die
      // Aufgabe, und genau das wird hier nachgehalten.
      pruefe(ax === bx || ay === by, `A4: A(${ax}|${ay}) und B(${bx}|${by}) liegen schräg zueinander — ohne Pythagoras nicht lösbar`);
      const abstand = ax === bx ? Math.abs(ay - by) : Math.abs(ax - bx);
      pruefe(abstand > 0, `A4: A und B fallen zusammen`);
      return {
        richtig: abstand,
        falsch: [[ax === bx ? ay + by : ax + bx, "Unterschied"]],
      };
    },
  });

  // Aufgabe 6 — Spiegeln an einer achsenparallelen Geraden (Aufgabe zum Ausfüllen). Gemessen mit
  // tests/werkzeug-streuung.js: 196 verschiedene in 200 Würfen, zurückgerechnet rund 4900
  // Kandidaten. Die Schranke ist das simulierte 10⁻⁴-Quantil bei 30 Zügen — 27.
  await pruefeAufgabe(page, bericht, {
    nr: 6, name: "A6 Spiegeln an einer Geraden", runden: 30, mindestensVerschieden: 27,
    deute: (frage) => {
      const m = frage.match(/P\((-?\d+) \| (-?\d+)\) wird an der Geraden ([xy]) = (-?\d+) gespiegelt/);
      if (!m) return null;
      const px = Number(m[1]), py = Number(m[2]), achse = m[3], c = Number(m[4]);
      const beweglich = achse === "y" ? py : px;
      pruefe(beweglich !== c, `A6: P liegt auf der Spiegelachse — dann gibt es nichts zu spiegeln`);
      const bild = 2 * c - beweglich;
      const soll = achse === "y" ? [px, bild] : [bild, py];
      return {
        felder: soll,
        falschFelder: [
          [0, achse === "y" ? null : px, "x-Koordinate"],
          [1, achse === "y" ? py : null, "y-Koordinate"],
        ],
      };
    },
  });

  // Aufgabe 8 — vierte Ecke und Umfang (Aufgabe zum Ausfüllen). Gemessen mit
  // tests/werkzeug-streuung.js: 196 verschiedene in 200 Würfen, zurückgerechnet rund 4900
  // Kandidaten. Die Schranke ist das simulierte 10⁻⁴-Quantil bei 30 Zügen — 27.
  await pruefeAufgabe(page, bericht, {
    nr: 8, name: "A8 vierte Ecke", runden: 30, mindestensVerschieden: 27,
    deute: (frage) => {
      const m = frage.match(/A\((-?\d+) \| (-?\d+)\) B\((-?\d+) \| (-?\d+)\) C\((-?\d+) \| (-?\d+)\)/);
      if (!m) return null;
      const [ax, ay, bx, by, cx, cy] = m.slice(1).map(Number);
      pruefe(ay === by && bx === cx, `A8: A, B, C bilden kein achsenparalleles Rechteck`);
      const breite = Math.abs(bx - ax), hoehe = Math.abs(cy - by);
      pruefe(breite > 0 && hoehe > 0, `A8: das Rechteck ist entartet (${breite} × ${hoehe})`);
      return {
        felder: [ax, cy, 2 * (breite + hoehe)],
        falschFelder: [
          [0, cx !== ax ? cx : null, "über A"],
          [2, breite * hoehe !== 2 * (breite + hoehe) ? breite * hoehe : null, "Flächeninhalt"],
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
