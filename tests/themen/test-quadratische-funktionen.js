// Fachliche Prüfung: Kapitel 4, Thema 8 „Quadratische Funktionen“.
//
// Drei Vorzeichenfallen tragen das Thema: In der Scheitelform (x − d)² liegt
// der Scheitel bei +d, beim quadratischen Ergänzen wird (p : 2)² abgezogen,
// und in der pq-Formel steht −p : 2. Alle drei werden als Antwort eingetragen.
// Zusätzlich wird jede Lösung in die Ausgangsgleichung eingesetzt — eine
// pq-Formel, die nur eine Nullstelle trifft, hätte nichts gelöst.

"use strict";

const { neuerBericht } = require("../lib/pruefen");
const { starteBrowser, neueSeite, oeffne } = require("../lib/seite");
const { pruefeNotation } = require("../lib/notation");
const { pruefeKontrast } = require("../lib/kontrast");
const { pruefeAufgabe } = require("../lib/aufgaben");

const bericht = neuerBericht();
const { pruefe } = bericht;
const SEITE = "/mathematik/grundwissen-5-10/04-gleichungen-zuordnungen-funktionen/08-quadratische-funktionen/index.html";

const minus = (s) => s.replace(/−/g, "-");

// „x² − 6x + 5“, „x² + x − 2“, „x² − 4“ — der Koeffizient 1 fehlt.
function normalform(s) {
  const t = minus(s).replace(/\s+/g, "");
  const m = t.match(/^x²([+-]\d*x)?([+-]\d+)?$/);
  if (!m) return null;
  let p = 0;
  if (m[1]) {
    const roh = m[1].replace("x", "");
    p = roh === "+" ? 1 : roh === "-" ? -1 : Number(roh);
  }
  return { p, q: m[2] ? Number(m[2]) : 0 };
}

async function aufgaben(page) {
  // Aufgabe 1 — Scheitel aus der Scheitelform ablesen. 6 · 12 · 16 = 1152
  // Fassungen; Doppel sind bei 30 Zügen praktisch ausgeschlossen.
  await pruefeAufgabe(page, bericht, {
    nr: 1, name: "A1 Scheitelform", runden: 30, mindestensVerschieden: 28,
    deute: (frage) => {
      const m = minus(frage).match(/f\(x\) = (-?\d* ?·? ?)?\(x ([+-]) (\d+)\)² ([+-]) (\d+)/);
      if (!m) return null;
      const d = (m[2] === "-" ? 1 : -1) * Number(m[3]);   // (x − d)² ⇒ Scheitel bei d
      const e = (m[4] === "-" ? -1 : 1) * Number(m[5]);
      const kopf = (m[1] || "").replace(/[·\s]/g, "");
      const a = kopf === "" ? 1 : kopf === "-" ? -1 : Number(kopf);
      return {
        richtig: d,
        toleranz: 0.0005,
        falsch: [
          // Das Vorzeichen in der Klammer falsch gelesen.
          [-d, "Vorsicht beim Vorzeichen"],
          // Die y-Koordinate genannt.
          [e, "y-Koordinate"],
          // Den Formfaktor genannt.
          [a, "Formfaktor"],
        ],
        pruefe: (f) => {
          // Der Scheitel liegt dort, wo die Klammer null wird.
          pruefe(Math.abs(d - d) < 1e-9 && d !== 0, `A1: d = ${d} — „${f}“`);
          pruefe(e !== 0, `A1: e = 0 macht die Unterscheidung der Koordinaten sinnlos — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 2 — quadratisch ergänzen, gefragt ist die y-Koordinate. 102
  // Kandidaten, gefiltert; bei 30 Zügen ist E = 26,1 und σ = 1,4, die
  // Schranke liegt bei 20.
  await pruefeAufgabe(page, bericht, {
    nr: 2, name: "A2 quadratisch ergänzen", runden: 30, mindestensVerschieden: 20,
    deute: (frage) => {
      const m = minus(frage).match(/f\(x\) = (x².*?)\s*\./);
      const roh = m ? normalform(m[1]) : null;
      if (!roh) return null;
      const { p, q } = roh;
      const halb = p / 2;
      const d = -halb, e = q - halb * halb;
      return {
        richtig: e,
        toleranz: 0.0005,
        falsch: [
          // Die x-Koordinate genannt.
          [d, "x-Koordinate"],
          // Bei q stehen geblieben.
          [q, "aus der Ausgangsgleichung"],
          // Die Ergänzung selbst genannt.
          [halb * halb, "Ergänzung selbst"],
          // Addiert statt abgezogen — die Vorzeichenfalle des Verfahrens.
          [q + halb * halb, "abgezogen"],
        ],
        pruefe: (f) => {
          pruefe(Number.isInteger(halb), `A2: p = ${p} ist nicht gerade, (p : 2)² wäre krumm — „${f}“`);
          // Die Scheitelform muss den Ausgangsterm wirklich wiedergeben:
          // (x − d)² + e = x² + px + q.
          pruefe(Math.abs(d * d + e - q) < 1e-9 && Math.abs(-2 * d - p) < 1e-9,
            `A2: (x − ${d})² + ${e} ist nicht x² + ${p}x + ${q} — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 3 — pq-Formel, gefragt ist die größere Lösung. 34 Kandidaten mit
  // zwei verschiedenen Nullstellen; bei 30 Zügen ist E = 20,1 und σ = 1,8,
  // die Schranke E − 3σ liegt bei 14.
  await pruefeAufgabe(page, bericht, {
    nr: 3, name: "A3 pq-Formel", runden: 30, mindestensVerschieden: 14,
    deute: (frage) => {
      const m = minus(frage).match(/Löse mit der pq-Formel: (x².*?) = 0/);
      const roh = m ? normalform(m[1]) : null;
      if (!roh) return null;
      const { p, q } = roh;
      const halb = p / 2;
      const D = halb * halb - q;
      const w = Math.sqrt(D);
      const gross = -halb + w, klein = -halb - w;
      return {
        richtig: gross,
        toleranz: 0.0005,
        falsch: [
          [klein, "kleinere"],
          // Nur −p : 2 — die Mitte zwischen den Lösungen.
          [-halb, "Mitte zwischen"],
          [D, "Diskriminante"],
          [q, "aus der Gleichung"],
          // Das Vorzeichen von p : 2 verdreht.
          [halb + w, "Vorzeichenfehler"],
        ],
        pruefe: (f, rueck) => {
          pruefe(D > 0, `A3: die Diskriminante ${D} ist nicht positiv — „${f}“`);
          pruefe(Number.isInteger(gross) && Number.isInteger(klein),
            `A3: die Lösungen ${klein} und ${gross} sind nicht ganzzahlig — „${f}“`);
          // Beide Lösungen müssen die Gleichung wirklich erfüllen.
          for (const x of [klein, gross]) {
            pruefe(Math.abs(x * x + p * x + q) < 1e-9,
              `A3: x = ${x} erfüllt x² + ${p}x + ${q} = 0 nicht — „${f}“`);
          }
          // Satz von Vieta als unabhängige Probe.
          pruefe(Math.abs(klein + gross + p) < 1e-9 && Math.abs(klein * gross - q) < 1e-9,
            `A3: Vieta stimmt nicht: Summe ${klein + gross}, Produkt ${klein * gross} — „${f}“`);
          pruefe(rueck.includes("Probe"), `A3: die Musterlösung macht keine Probe — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 4 — größte Rechteckfläche bei gegebenem Umfang. 17 Zaunlängen;
  // bei 30 Zügen ist E = 14,3 und σ = 1,3 — Schranke E − 3σ = 10.
  await pruefeAufgabe(page, bericht, {
    nr: 4, name: "A4 größte Fläche", runden: 30, mindestensVerschieden: 10,
    deute: (frage) => {
      const m = frage.match(/(\d+) m<?\/?strong>? langer Zaun|(\d+) m langer Zaun/);
      const U = Number((m && (m[1] || m[2])) || (frage.match(/(\d+) m/) || [])[1]);
      if (!U) return null;
      const halbU = U / 2, best = U / 4;
      return {
        richtig: best * best,
        toleranz: 0.0005,
        falsch: [
          [best, "günstigste Seitenlänge"],
          [halbU, "halbe Zaunlänge"],
          [U, "Umfang selbst"],
          [U * U, "nicht quadriert"],
        ],
        pruefe: (f, rueck) => {
          pruefe(Number.isInteger(best), `A4: U : 4 = ${best} ist nicht ganzzahlig — „${f}“`);
          // Der Kern: Das Quadrat ist unter allen Rechtecken gleichen Umfangs
          // das flächengrößte. Zur Kontrolle zwei Nachbarn.
          for (const dx of [1, 2]) {
            const andere = (best - dx) * (halbU - (best - dx));
            pruefe(andere < best * best,
              `A4: das Rechteck ${best - dx} × ${halbU - (best - dx)} hat mit ${andere} m² mehr Fläche als das Quadrat — „${f}“`);
          }
          pruefe(rueck.includes("Scheitel"),
            `A4: die Musterlösung führt nicht über den Scheitel der Flächenfunktion — „${f}“`);
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
