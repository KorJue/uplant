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

// Wie normalform(), aber mit Dezimalzahlen: Bei ungeradem p ist (p : 2)² keine
// ganze Zahl, und q kann dann auf ,25 enden.
function normalformDezimal(s) {
  const t = minus(s).replace(/\s+/g, "");
  const m = t.match(/^x²([+-]\d*x)?([+-][\d,]+)?$/);
  if (!m) return null;
  let p = 0;
  if (m[1]) {
    const roh = m[1].replace("x", "");
    p = roh === "+" ? 1 : roh === "-" ? -1 : Number(roh);
  }
  return { p, q: m[2] ? Number(m[2].replace(",", ".")) : 0 };
}

// Über alle Runden gesammelt: Beide Aufgaben leben von ihren Fällen.
const faelleA2 = new Set();
const faelleA4 = new Set();

async function aufgaben(page) {
  // Aufgabe 1 — Scheitel aus der Scheitelform ablesen. Gemessen mit tests/werkzeug-streuung.js:
  // 179 verschiedene in 200 Würfen, zurückgerechnet also rund 880 Kandidaten. Die Schranke ist
  // das simulierte 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für 0,8 · n gerechnet — 25.
  await pruefeAufgabe(page, bericht, {
    nr: 1, name: "A1 Scheitelform", runden: 30, mindestensVerschieden: 25,
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

  // Aufgabe 2 — Punktprobe. Nachgebildet wurde die wirkliche Ziehung (erst die Abweichung, dann
  // der Kandidat): Erwartungswert 30,0 verschiedene in 30 Zügen, 10⁻⁴-Quantil 28. Schranke 27.
  await pruefeAufgabe(page, bericht, {
    nr: 2, name: "A2 Punktprobe", runden: 30, mindestensVerschieden: 27,
    deute: (frage) => {
      const t = minus(frage);
      const m = t.match(/f\(x\) = (-?\d* ?·? ?)?\(x ([+-]) (\d+)\)² ([+-]) (\d+)/);
      const pm = t.match(/P\((-?\d+) \| (-?\d+)\)/);
      if (!m || !pm) return null;
      const d = (m[2] === "-" ? 1 : -1) * Number(m[3]);
      const e = (m[4] === "-" ? -1 : 1) * Number(m[5]);
      const kopf = (m[1] || "").replace(/[·\s]/g, "");
      const a = kopf === "" ? 1 : kopf === "-" ? -1 : Number(kopf);
      const x0 = Number(pm[1]), yp = Number(pm[2]);
      const dx = x0 - d;
      const fw = a * dx * dx + e;
      const liegtDrauf = fw === yp;
      faelleA2.add(liegtDrauf ? "ja" : "nein");
      return {
        felder: [fw, liegtDrauf ? 1 : 2],
        toleranz: 0.0005,
        falschFelder: [
          // Die Zahl hinter der Klammer vergessen.
          [0, a * dx * dx, "hinter der Klammer fehlt"],
          // Erst multipliziert, dann quadriert.
          [0, (a * dx) * (a * dx), "Erst quadrieren"],
          // Die Verschiebung übersehen.
          [0, a * x0 * x0 + e, "wurde übersehen"],
          // Das Vorzeichen in der Klammer verdreht.
          [0, a * (x0 + d) * (x0 + d) + e, "Vorzeichen in der Klammer"],
          // Die angebotene y-Koordinate abgeschrieben, statt zu rechnen.
          [0, liegtDrauf ? null : yp, "musst du erst ausrechnen"],
          [1, liegtDrauf ? 2 : 1, liegtDrauf ? "genau das ist die y-Koordinate" : "liegt P"],
        ],
        pruefe: (f, rueck) => {
          pruefe(d !== 0 && e !== 0, `A2: d oder e ist 0 — „${f}“`);
          pruefe(dx !== 0, `A2: die Klammer wird null, dann fällt der Formfaktor heraus — „${f}“`);
          // Das Urteil der Musterlösung muss zur Nachrechnung passen.
          pruefe(rueck.includes(liegtDrauf ? "liegt auf dem Graphen" : "liegt nicht auf dem Graphen"),
            `A2: die Musterlösung urteilt anders als die Nachrechnung (f(${x0}) = ${fw}, P bei ${yp}) — „${f}“`);
          // Das Quadrat gehört zur Klammer — genau das muss die Musterlösung sagen.
          pruefe(rueck.includes("Das Quadrat gehört zur Klammer"),
            `A2: die Musterlösung erklärt die Reihenfolge nicht — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 3 — quadratisch ergänzen, gefragt ist die y-Koordinate. Gemessen mit
  // tests/werkzeug-streuung.js: 50 verschiedene in 200 Würfen, zurückgerechnet also rund 51
  // Kandidaten. Die Schranke ist das simulierte 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für
  // 0,8 · n gerechnet — 15.
  await pruefeAufgabe(page, bericht, {
    nr: 3, name: "A3 quadratisch ergänzen", runden: 30, mindestensVerschieden: 15,
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
          pruefe(Number.isInteger(halb), `A3: p = ${p} ist nicht gerade, (p : 2)² wäre krumm — „${f}“`);
          // Die Scheitelform muss den Ausgangsterm wirklich wiedergeben:
          // (x − d)² + e = x² + px + q.
          pruefe(Math.abs(d * d + e - q) < 1e-9 && Math.abs(-2 * d - p) < 1e-9,
            `A3: (x − ${d})² + ${e} ist nicht x² + ${p}x + ${q} — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 4 — Diskriminante. Nachgebildet wurde die wirkliche Ziehung (erst der Fall, dann der
  // Kandidat; D = 0 hat nur 21 Kandidaten und begrenzt die Streuung): Erwartungswert 27,8
  // verschiedene in 30 Zügen, 10⁻⁴-Quantil 21. Schranke 20.
  await pruefeAufgabe(page, bericht, {
    nr: 4, name: "A4 Diskriminante", runden: 30, mindestensVerschieden: 20,
    deute: (frage) => {
      const m = minus(frage).match(/Gleichung (x².*?) = 0/);
      if (!m) return null;
      const g = normalformDezimal(m[1]);
      if (!g) return null;
      const halb = g.p / 2, quadrat = halb * halb;
      const D = Math.round((quadrat - g.q) * 10000) / 10000;
      const anzahl = D > 0 ? 2 : D === 0 ? 1 : 0;
      faelleA4.add(anzahl);
      // Welcher Irrtum bei der Anzahl geprüft wird, hängt vom Fall ab.
      const falschAnzahl = D > 0
        ? [[0, "ist positiv"], [1, "ist positiv"]]
        : D === 0
          ? [[0, "heißt nicht"], [2, "ändert dann nichts"]]
          : [[1, "ist negativ"], [2, "ist negativ"]];
      return {
        felder: [quadrat, D, anzahl],
        toleranz: 0.0005,
        falschFelder: [
          [0, halb, "muss noch quadriert werden"],
          [0, g.p * g.p, "Quadriert wird die halbe Zahl"],
          [0, D === 0 ? null : g.q, "ist q, nicht"],
          [0, g.p, "Erst halbieren"],
          [1, quadrat + g.q, "abgezogen, nicht addiert"],
          [1, D === 0 ? null : g.q - quadrat, "Reihenfolge stimmt nicht"],
          [1, quadrat, "Davon wird q"],
          ...falschAnzahl.map(([wert, muster]) => [2, wert, muster]),
        ],
        pruefe: (f, rueck) => {
          pruefe(quadrat !== 0, `A4: (p : 2)² = 0 — „${f}“`);
          pruefe(g.q !== 0, `A4: q = 0, dann ist die Gleichung ohne Formel lösbar — „${f}“`);
          // Die Anzahl muss zur Diskriminante passen — unabhängig nachgerechnet.
          const wirklich = D < 0 ? 0 : D === 0 ? 1 : 2;
          pruefe(anzahl === wirklich, `A4: D = ${D} passt nicht zu ${anzahl} Lösungen — „${f}“`);
          pruefe(rueck.includes(anzahl === 2 ? "zwei Lösungen" : anzahl === 1 ? "genau eine Lösung" : "keine Lösung"),
            `A4: die Musterlösung nennt den Fall nicht — „${f}“`);
          // Bei zwei Lösungen muss die Probe aufgehen.
          if (anzahl === 2) {
            const w = Math.sqrt(D), x1 = -halb - w, x2 = -halb + w;
            pruefe(Math.abs(x1 * x1 + g.p * x1 + g.q) < 1e-6 && Math.abs(x2 * x2 + g.p * x2 + g.q) < 1e-6,
              `A4: die Lösungen ${x1} und ${x2} erfüllen die Gleichung nicht — „${f}“`);
          }
        },
      };
    },
  });

  // Aufgabe 5 — pq-Formel, gefragt ist die größere Lösung. Gemessen mit
  // tests/werkzeug-streuung.js: 22 verschiedene in 200 Würfen, zurückgerechnet also rund 22
  // Kandidaten. Die Schranke ist das simulierte 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für
  // 0,8 · n gerechnet — 10.
  await pruefeAufgabe(page, bericht, {
    nr: 5, name: "A5 pq-Formel", runden: 30, mindestensVerschieden: 10,
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
          pruefe(D > 0, `A5: die Diskriminante ${D} ist nicht positiv — „${f}“`);
          pruefe(Number.isInteger(gross) && Number.isInteger(klein),
            `A5: die Lösungen ${klein} und ${gross} sind nicht ganzzahlig — „${f}“`);
          // Beide Lösungen müssen die Gleichung wirklich erfüllen.
          for (const x of [klein, gross]) {
            pruefe(Math.abs(x * x + p * x + q) < 1e-9,
              `A5: x = ${x} erfüllt x² + ${p}x + ${q} = 0 nicht — „${f}“`);
          }
          // Satz von Vieta als unabhängige Probe.
          pruefe(Math.abs(klein + gross + p) < 1e-9 && Math.abs(klein * gross - q) < 1e-9,
            `A5: Vieta stimmt nicht: Summe ${klein + gross}, Produkt ${klein * gross} — „${f}“`);
          pruefe(rueck.includes("Probe"), `A5: die Musterlösung macht keine Probe — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 6 — Parabel aus Scheitel und Punkt. Die Kandidatenliste hat nach dem
  // Kollisionsfilter 1586 Einträge mit ebenso vielen Aufgabentexten; bei 30 Zügen liegt das
  // 10⁻⁴-Quantil bei 26. Schranke 25.
  await pruefeAufgabe(page, bericht, {
    nr: 6, name: "A6 Parabel aus Scheitel und Punkt", runden: 30, mindestensVerschieden: 25,
    deute: (frage) => {
      const t = minus(frage);
      const sm = t.match(/S\((-?\d+) \| (-?\d+)\)/);
      const pm = t.match(/P\((-?\d+) \| (-?\d+)\)/);
      if (!sm || !pm) return null;
      const d = Number(sm[1]), e = Number(sm[2]);
      const x0 = Number(pm[1]), y0 = Number(pm[2]);
      const dx = x0 - d;
      if (dx === 0) return null;
      const a = (y0 - e) / (dx * dx);
      const f0 = a * d * d + e;
      const zweite = 2 * d - x0;
      return {
        felder: [a, f0, zweite],
        toleranz: 0.0005,
        falschFelder: [
          // Durch die Klammer statt durch ihr Quadrat geteilt.
          [0, (y0 - e) / dx, "Quadrat der Klammer"],
          [0, y0 - e, "Höhenunterschied"],
          [0, -a, "Vorzeichen stimmt nicht"],
          [1, e, "Höhe des Scheitels"],
          [1, a * d * d, "hinter der Klammer fehlt"],
          [1, y0, "Höhe von P"],
          [2, x0, "schon bekannte Stelle"],
          [2, d, "Stelle des Scheitels"],
          [2, -x0, "nicht an der y-Achse"],
        ],
        pruefe: (f, rueck) => {
          pruefe(Number.isInteger(a) && a !== 0, `A6: a = ${a} ist nicht ganzzahlig — „${f}“`);
          // P muss wirklich auf der Parabel liegen.
          pruefe(Math.abs(a * dx * dx + e - y0) < 1e-9, `A6: P liegt nicht auf der Parabel — „${f}“`);
          // Und die gespiegelte Stelle muss denselben Wert haben.
          pruefe(Math.abs(a * (zweite - d) * (zweite - d) + e - y0) < 1e-9,
            `A6: f(${zweite}) ist nicht ${y0} — „${f}“`);
          pruefe(zweite !== x0, `A6: die zweite Stelle ist die erste — „${f}“`);
          pruefe(x0 !== 0, `A6: P liegt auf der y-Achse, dann ist f(0) schon gegeben — „${f}“`);
          pruefe(rueck.includes("Symmetrie"), `A6: die Musterlösung begründet die zweite Stelle nicht — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 7 — größte Rechteckfläche bei gegebenem Umfang. Gemessen mit
  // tests/werkzeug-streuung.js: 17 verschiedene in 200 Würfen, zurückgerechnet also rund 17
  // Kandidaten. Die Schranke ist das simulierte 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für
  // 0,8 · n gerechnet — 8.
  await pruefeAufgabe(page, bericht, {
    nr: 7, name: "A7 größte Fläche", runden: 30, mindestensVerschieden: 8,
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
          pruefe(Number.isInteger(best), `A7: U : 4 = ${best} ist nicht ganzzahlig — „${f}“`);
          // Der Kern: Das Quadrat ist unter allen Rechtecken gleichen Umfangs
          // das flächengrößte. Zur Kontrolle zwei Nachbarn.
          for (const dx of [1, 2]) {
            const andere = (best - dx) * (halbU - (best - dx));
            pruefe(andere < best * best,
              `A7: das Rechteck ${best - dx} × ${halbU - (best - dx)} hat mit ${andere} m² mehr Fläche als das Quadrat — „${f}“`);
          }
          pruefe(rueck.includes("Scheitel"),
            `A7: die Musterlösung führt nicht über den Scheitel der Flächenfunktion — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 8 — Wurfparabel. Nachgebildet wurde die wirkliche Ziehung (erst der Zusammenhang,
  // der die Größenordnung begrenzt, dann die Zahlen): Erwartungswert 24,5 verschiedene in 30
  // Zügen, 10⁻⁴-Quantil 18. Schranke 17.
  await pruefeAufgabe(page, bericht, {
    nr: 8, name: "A8 Wurfparabel", runden: 30, mindestensVerschieden: 17,
    deute: (frage) => {
      const t = minus(frage).replace(/,/g, ".");
      const m = t.match(/h\(x\) = -([\d.]+)x² \+ ([\d.]*)x/);
      if (!m) return null;
      const c = Number(m[1]);
      const b = m[2] === "" ? 1 : Number(m[2]);
      const w = Math.round((b / c) * 10000) / 10000;   // zweite Nullstelle
      const halb = w / 2;
      const e = Math.round((b * b / (4 * c)) * 10000) / 10000;
      return {
        felder: [halb, e, w],
        toleranz: 0.0005,
        falschFelder: [
          [0, w, "ist die ganze Weite"],
          [0, e, "keine Entfernung"],
          [0, b, "Koeffizient vor dem x"],
          [1, halb, "Stelle des höchsten Punktes"],
          [1, w, "ist die Weite, nicht die Höhe"],
          [2, halb, "halbe Strecke"],
          [2, e, "ist die Höhe, nicht die Weite"],
        ],
        pruefe: (f, rueck) => {
          pruefe(Number.isInteger(w) && w >= 8, `A8: die Weite ${w} ist nicht ganzzahlig — „${f}“`);
          pruefe(Number.isInteger(e) && e >= 2, `A8: die Höhe ${e} ist nicht ganzzahlig — „${f}“`);
          // Eine Wurfbahn ist deutlich weiter als hoch — sonst ist das Bild falsch.
          pruefe(2 * e <= w, `A8: ${e} m hoch bei ${w} m Weite ist keine Wurfbahn — „${f}“`);
          // Die Bahn muss an beiden Enden wirklich auf der Höhe 0 liegen.
          const h = (x) => -c * x * x + b * x;
          pruefe(Math.abs(h(0)) < 1e-9 && Math.abs(h(w)) < 1e-6,
            `A8: h(0) = ${h(0)}, h(${w}) = ${h(w)} — „${f}“`);
          pruefe(Math.abs(h(halb) - e) < 1e-6, `A8: der Scheitel liegt nicht bei ${e} — „${f}“`);
          pruefe(rueck.includes("Ausklammern"), `A8: die Musterlösung klammert nicht aus — „${f}“`);
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
    if (!dunkel) {
      await aufgaben(page);
      pruefe(faelleA2.has("ja"), "A2: in 30 Runden lag kein angebotener Punkt wirklich auf dem Graphen");
      pruefe(faelleA2.has("nein"), "A2: in 30 Runden lag jeder angebotene Punkt auf dem Graphen");
      for (const n of [0, 1, 2]) {
        pruefe(faelleA4.has(n), `A4: in 30 Runden kam der Fall „${n} Lösungen“ nicht vor`);
      }
    }
    else await pruefeKontrast(page, bericht, "dunkel");
    await pruefeNotation(page, bericht, wo);
    for (const s of page.stoerungen) pruefe(false, `${wo}: ${s}`);
    await page.close();
  }
  await browser.close();
  bericht.abschluss();
})();
