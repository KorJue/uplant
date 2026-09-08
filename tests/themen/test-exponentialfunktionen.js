// Fachliche Prüfung: Kapitel 4, Thema 11 „Exponentialfunktionen“.
//
// Der Unterschied zum linearen Wachstum trägt das ganze Thema: Es wird nicht
// immer derselbe Betrag addiert, sondern immer derselbe Faktor multipliziert.
// Deshalb steht in jeder Aufgabe die lineare Rechnung als Fehlerwert — die
// Prozentsätze addieren, die Gesamtänderung durch die Schrittzahl teilen,
// 50 : p Tage rechnen.

"use strict";

const { neuerBericht } = require("../lib/pruefen");
const { starteBrowser, neueSeite, oeffne } = require("../lib/seite");
const { pruefeNotation } = require("../lib/notation");
const { pruefeKontrast } = require("../lib/kontrast");
const { pruefeAufgabe } = require("../lib/aufgaben");

const bericht = neuerBericht();
const { pruefe } = bericht;
const SEITE = "/mathematik/grundwissen-5-10/04-gleichungen-zuordnungen-funktionen/11-exponentialfunktionen/index.html";

const minus = (s) => s.replace(/−/g, "-");
const zahl = (s) => Number(minus(s).replace(/\.(?=\d{3}\b)/g, "").replace(",", "."));

async function aufgaben(page) {
  // Aufgabe 1 — a · qᵏ ausrechnen. Mehrere hundert Fassungen; Doppel sind bei
  // 30 Zügen selten — Schranke 26.
  await pruefeAufgabe(page, bericht, {
    nr: 1, name: "A1 Wachstumsfaktor anwenden", runden: 30, mindestensVerschieden: 26,
    deute: (frage) => {
      const m = frage.match(/beginnt bei ([\d.]+).*?q = ([\d,]+).*?nach (\d+) Schritten/);
      if (!m) return null;
      const a = zahl(m[1]), q = zahl(m[2]), k = Number(m[3]);
      const ende = a * Math.pow(q, k);
      // Lineares Wachstum mit demselben ersten Schritt.
      const linear = a + k * (a * q - a);
      return {
        richtig: ende,
        toleranz: 0.4,
        falsch: [
          // Nur einmal mit q multipliziert und dann vervielfacht.
          [a * q * k, "einmal mit q"],
          // Linear gerechnet.
          [linear, "lineares"],
        ],
        pruefe: (f) => {
          // Konstruktiv: der Bestand bleibt ganzzahlig.
          pruefe(Math.abs(ende - Math.round(ende)) < 1e-6,
            `A1: der Bestand ${ende} ist nicht ganzzahlig — „${f}“`);
          // Wachstum und Zerfall gehen in die richtige Richtung.
          pruefe((ende > a) === (q > 1), `A1: q = ${q}, aber aus ${a} wird ${ende} — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 2 — Prozentangabe in einen Faktor übersetzen. 2 Richtungen × 15
  // Prozentsätze × 10 Anfangswerte × 6 Schrittzahlen; Schranke 26.
  await pruefeAufgabe(page, bericht, {
    nr: 2, name: "A2 Prozent als Faktor", runden: 30, mindestensVerschieden: 26,
    deute: (frage) => {
      const m = minus(frage).match(/Bestand von ([\d.]+) ändert sich in jedem Schritt um ([+-])(\d+) %.*?nach (\d+) Schritten/);
      if (!m) return null;
      const a = zahl(m[1]);
      const richtung = m[2] === "-" ? -1 : 1;
      const p = Number(m[3]), n = Number(m[4]);
      const q = 1 + (richtung * p) / 100;
      const wert = a * Math.pow(q, n);
      // Der lineare Fehler: die Prozentsätze addieren.
      const linear = a * (1 + (richtung * p * n) / 100);
      return {
        richtig: Math.round(wert * 100) / 100,
        toleranz: 0.005,
        falsch: [
          [Math.round(linear * 100) / 100, "addiert"],
          // p : 100 als Faktor genommen statt 1 ± p : 100.
          [a * Math.pow(p / 100, n), "Der Faktor ist nicht"],
        ],
        pruefe: (f, rueck) => {
          pruefe(q > 0, `A2: der Faktor ${q} ist nicht positiv — „${f}“`);
          // Bei Zunahme wächst der Bestand, bei Abnahme schrumpft er.
          pruefe((wert > a) === (richtung > 0), `A2: aus ${a} wird ${wert} bei ${richtung > 0 ? "Zunahme" : "Abnahme"} — „${f}“`);
          // Und exponentielles Wachstum überholt das lineare stets nach oben,
          // exponentieller Zerfall bleibt stets über der linearen Abnahme.
          pruefe(n < 2 || wert >= linear - 1e-6,
            `A2: exponentiell ${wert} liegt unter linear ${linear} — „${f}“`);
          pruefe(rueck.includes("q ="), `A2: die Musterlösung nennt den Faktor q nicht — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 3 — den Faktor aus Anfang und Ende zurückrechnen. Schranke 26.
  await pruefeAufgabe(page, bericht, {
    nr: 3, name: "A3 Faktor bestimmen", runden: 30, mindestensVerschieden: 26,
    deute: (frage) => {
      const m = frage.match(/Bestand (wächst|fällt) exponentiell von ([\d.]+) auf ([\d.]+) in (\d+) Schritten/);
      if (!m) return null;
      const waechst = m[1] === "wächst";
      const a = zahl(m[2]), ende = zahl(m[3]), k = Number(m[4]);
      const gesamt = ende / a;
      const q = Math.pow(gesamt, 1 / k);
      return {
        richtig: Math.round(q * 100) / 100,
        toleranz: 0.005,
        falsch: [
          // Den Gesamtfaktor angegeben statt des Faktors je Schritt.
          [Math.round(gesamt * 100) / 100, "alle"],
          // Die Gesamtänderung durch die Schrittzahl geteilt — linear gedacht.
          [Math.round(((ende - a) / a / k + 1) * 100) / 100, "geteilt"],
        ],
        pruefe: (f, rueck) => {
          // Die Probe: q hoch k muss den Gesamtfaktor ergeben.
          pruefe(Math.abs(Math.pow(q, k) - gesamt) < 1e-9,
            `A3: ${q}^${k} = ${Math.pow(q, k)} ist nicht ${gesamt} — „${f}“`);
          // Der Aufgabentext muss beschreiben, was wirklich geschieht: Drei
          // der sieben Faktoren sind kleiner als 1, dann fällt der Bestand.
          pruefe(waechst === (ende > a),
            `A3: der Text sagt „${m[1]}“, aber aus ${a} wird ${ende} — „${f}“`);
          // Die k-te Wurzel liegt stets zwischen dem Gesamtfaktor und 1 —
          // beim Wachsen darunter, beim Fallen darüber.
          pruefe(waechst ? (q > 1 && q < gesamt + 1e-9) : (q < 1 && q > gesamt - 1e-9),
            `A3: q = ${q} liegt nicht zwischen 1 und dem Gesamtfaktor ${gesamt} — „${f}“`);
          pruefe(rueck.includes("Wurzel"), `A3: die Musterlösung nennt die Wurzel nicht — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 4 — Halbwertszeit als kleinste ganze Schrittzahl. 33 Prozentsätze;
  // bei 30 Zügen ist E = 22,3 und σ = 1,8 — Schranke E − 3σ = 16.
  await pruefeAufgabe(page, bericht, {
    nr: 4, name: "A4 Halbwertszeit", runden: 30, mindestensVerschieden: 16,
    deute: (frage) => {
      const m = frage.match(/täglich um (\d+) %/);
      if (!m) return null;
      const p = Number(m[1]);
      const q = 1 - p / 100;
      let n = 1;
      while (Math.pow(q, n) >= 0.5 && n < 400) n++;
      return {
        richtig: n,
        toleranz: 0.3,
        falsch: [
          // Einen Tag zu früh.
          [n - 1, "noch"],
          // Linear gedacht: 50 : p Tage.
          [Math.round(50 / p), "linearer"],
        ],
        pruefe: (f, rueck) => {
          // Der Kern: n ist die KLEINSTE ganze Zahl mit qⁿ < 0,5.
          pruefe(Math.pow(q, n) < 0.5, `A4: nach ${n} Tagen sind noch ${Math.pow(q, n)} übrig — „${f}“`);
          pruefe(Math.pow(q, n - 1) >= 0.5,
            `A4: schon nach ${n - 1} Tagen ist weniger als die Hälfte übrig — „${f}“`);
          // Bei exponentiellem Zerfall wird nie exakt null erreicht.
          pruefe(Math.pow(q, n) > 0, `A4: der Rest ist auf 0 gefallen — „${f}“`);
          pruefe(rueck.includes("Halbwertszeit") || rueck.includes("Hälfte"),
            `A4: die Musterlösung spricht nicht von der Hälfte — „${f}“`);
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
