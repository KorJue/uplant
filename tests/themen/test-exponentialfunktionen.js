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

// Über alle Runden gesammelt: Aufgabe 2 muss beide Wachstumsarten zeigen.
const artenA2 = new Set();

async function aufgaben(page) {
  // Aufgabe 1 — a · qᵏ ausrechnen. Gemessen mit tests/werkzeug-streuung.js: 120 verschiedene in
  // 200 Würfen, zurückgerechnet also rund 177 Kandidaten. Die Schranke ist das simulierte
  // 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für 0,8 · n gerechnet — 21.
  await pruefeAufgabe(page, bericht, {
    nr: 1, name: "A1 Wachstumsfaktor anwenden", runden: 30, mindestensVerschieden: 21,
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

  // Aufgabe 2 — linear oder exponentiell? Nachgebildet wurde die wirkliche Ziehung (erst die
  // Art, dann der Kandidat aus 270 bzw. 78): Erwartungswert 28,3 verschiedene in 30 Zügen,
  // 10⁻⁴-Quantil 23. Schranke 22.
  await pruefeAufgabe(page, bericht, {
    nr: 2, name: "A2 linear oder exponentiell", runden: 30, mindestensVerschieden: 22,
    deute: (frage) => {
      const m = minus(frage).match(/n 0 1 2 3 Wert ([\d.,]+) ([\d.,]+) ([\d.,]+) ([\d.,]+)/);
      if (!m) return null;
      const w = m.slice(1, 5).map(zahl);
      if (w.some((x) => !isFinite(x) || x <= 0)) return null;
      const d = w[1] - w[0];
      const q = w[1] / w[0];
      // Unabhängig entschieden: Welche der beiden Spalten bleibt konstant?
      const linear = w.every((x, i) => i === 0 || Math.abs(x - w[i - 1] - d) < 1e-6);
      const exponentiell = w.every((x, i) => i === 0 || Math.abs(x / w[i - 1] - q) < 1e-9);
      if (linear === exponentiell) return null;
      artenA2.add(linear ? "linear" : "exponentiell");
      const kenn = linear ? d : q;
      const naechster = linear ? w[3] + d : w[3] * q;
      const andersHerum = linear ? Math.round(w[3] * q * 100) / 100 : w[3] + d;
      return {
        felder: [linear ? 1 : 2, kenn, naechster],
        toleranz: 0.006,
        falschFelder: [
          [0, linear ? 2 : 1, linear ? "Differenzen" : "Quotienten"],
          // Die jeweils andere Kenngröße.
          [1, linear ? q : d, linear ? "ist der Quotient" : "ist die Differenz"],
          // Die Tabelle mit der falschen Art fortgesetzt.
          [2, andersHerum, linear ? "bei exponentiellem Wachstum" : "bei linearem Wachstum"],
        ],
        pruefe: (f, rueck) => {
          // Beides zugleich kann eine Tabelle nicht sein (außer bei lauter gleichen Werten).
          pruefe(!(linear && exponentiell), `A2: die Tabelle ist linear UND exponentiell — „${f}“`);
          pruefe(linear ? Math.abs(d) > 0 : Math.abs(q - 1) > 1e-9,
            `A2: die Kenngröße ${kenn} beschreibt gar kein Wachstum — „${f}“`);
          // Die Fortsetzung muss zur erkannten Art passen.
          pruefe(Math.abs(naechster - (linear ? w[3] + d : w[3] * q)) < 1e-6,
            `A2: der nächste Wert passt nicht zur Art — „${f}“`);
          pruefe(rueck.includes("Differenzen") && rueck.includes("Quotienten"),
            `A2: die Musterlösung zeigt nicht beide Spalten — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 3 — Prozentangabe in einen Faktor übersetzen. 2 Richtungen × 15
  // Prozentsätze × 10 Anfangswerte × 6 Schrittzahlen; Schranke 26.
  await pruefeAufgabe(page, bericht, {
    nr: 3, name: "A3 Prozent als Faktor", runden: 30, mindestensVerschieden: 26,
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
          pruefe(q > 0, `A3: der Faktor ${q} ist nicht positiv — „${f}“`);
          // Bei Zunahme wächst der Bestand, bei Abnahme schrumpft er.
          pruefe((wert > a) === (richtung > 0), `A3: aus ${a} wird ${wert} bei ${richtung > 0 ? "Zunahme" : "Abnahme"} — „${f}“`);
          // Und exponentielles Wachstum überholt das lineare stets nach oben,
          // exponentieller Zerfall bleibt stets über der linearen Abnahme.
          pruefe(n < 2 || wert >= linear - 1e-6,
            `A3: exponentiell ${wert} liegt unter linear ${linear} — „${f}“`);
          pruefe(rueck.includes("q ="), `A3: die Musterlösung nennt den Faktor q nicht — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 4 — Zinseszins. Gemessen mit tests/werkzeug-streuung.js: 193 verschiedene in 200
  // Würfen, zurückgerechnet rund 2776 Kandidaten. Schranke bei 30 Zügen: 27.
  await pruefeAufgabe(page, bericht, {
    nr: 4, name: "A4 Zinseszins", runden: 30, mindestensVerschieden: 27,
    deute: (frage) => {
      const m = minus(frage).match(/Kapital von ([\d.]+) € wird mit ([\d,]+) % jährlich verzinst/);
      const mn = frage.match(/nach ([\d.]+) Jahren/);
      if (!m || !mn) return null;
      const kapital = zahl(m[1]), p = zahl(m[2]), n = zahl(mn[1]);
      const q = 1 + p / 100;
      const end = Math.round(kapital * Math.pow(q, n) * 100) / 100;
      const zins = Math.round((end - kapital) * 100) / 100;
      const einfach = Math.round(kapital * (1 + (p * n) / 100) * 100) / 100;
      return {
        felder: [end, zins, einfach],
        toleranz: 0.006,
        falschFelder: [
          // Die Prozentsätze addiert statt die Faktoren multipliziert.
          [0, einfach, "einfachen Zinsen"],
          [0, kapital, "ist das Anfangskapital"],
          [1, Math.round((einfach - kapital) * 100) / 100, "ohne Zinseszins"],
          [1, end, "gesamte Endkapital"],
          [2, end, "Wert mit Zinseszins"],
          [2, kapital, "Anfangskapital allein"],
        ],
        pruefe: (f, rueck) => {
          // Zinseszins bringt immer mehr als einfache Zinsen — bei n ≥ 2.
          pruefe(end > einfach, `A4: ${end} € ist nicht mehr als ${einfach} € — „${f}“`);
          pruefe(Math.abs(end - kapital - zins) < 0.011, `A4: ${kapital} + ${zins} ist nicht ${end} — „${f}“`);
          // Und die Zinsen einer einfachen Verzinsung sind n-mal derselbe Betrag.
          pruefe(Math.abs(einfach - kapital - (kapital * p * n) / 100) < 0.011,
            `A4: die einfachen Zinsen stimmen nicht — „${f}“`);
          pruefe(rueck.includes("ohne Zinseszins"), `A4: die Musterlösung vergleicht nicht — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 5 — den Faktor aus Anfang und Ende zurückrechnen. Gemessen mit
  // tests/werkzeug-streuung.js: 111 verschiedene in 200 Würfen, zurückgerechnet also rund 151
  // Kandidaten. Die Schranke ist das simulierte 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für
  // 0,8 · n gerechnet — 20.
  await pruefeAufgabe(page, bericht, {
    nr: 5, name: "A5 Faktor bestimmen", runden: 30, mindestensVerschieden: 20,
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
            `A5: ${q}^${k} = ${Math.pow(q, k)} ist nicht ${gesamt} — „${f}“`);
          // Der Aufgabentext muss beschreiben, was wirklich geschieht: Drei
          // der sieben Faktoren sind kleiner als 1, dann fällt der Bestand.
          pruefe(waechst === (ende > a),
            `A5: der Text sagt „${m[1]}“, aber aus ${a} wird ${ende} — „${f}“`);
          // Die k-te Wurzel liegt stets zwischen dem Gesamtfaktor und 1 —
          // beim Wachsen darunter, beim Fallen darüber.
          pruefe(waechst ? (q > 1 && q < gesamt + 1e-9) : (q < 1 && q > gesamt - 1e-9),
            `A5: q = ${q} liegt nicht zwischen 1 und dem Gesamtfaktor ${gesamt} — „${f}“`);
          pruefe(rueck.includes("Wurzel"), `A5: die Musterlösung nennt die Wurzel nicht — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 6 — Verdopplungszeit. Gemessen mit tests/werkzeug-streuung.js: 176 verschiedene in
  // 200 Würfen, zurückgerechnet rund 762 Kandidaten. Schranke bei 30 Zügen: 25.
  await pruefeAufgabe(page, bericht, {
    nr: 6, name: "A6 Verdopplungszeit", runden: 30, mindestensVerschieden: 25,
    deute: (frage) => {
      const m = minus(frage).match(/zu Beginn ([\d.,]+) .*?wächst je \S+ um (\d+) %/);
      if (!m) return null;
      const a = zahl(m[1]), p = zahl(m[2]);
      const q = 1 + p / 100;
      // Unabhängig nachgerechnet: das kleinste n mit qⁿ ≥ 2.
      let t = null;
      for (let i = 1; i <= 500; i++) if (Math.pow(q, i) >= 2) { t = i; break; }
      if (t === null) return null;
      const nachT = Math.round(a * Math.pow(q, t) * 10) / 10;
      return {
        felder: [Math.round(q * 100) / 100, t, nachT],
        toleranz: 0.006,
        falschFelder: [
          [0, p / 100, "nur der Anteil"],
          [0, p, "ist der Prozentsatz"],
          [1, t - 1, "noch nicht das Doppelte"],
          [1, Math.round(100 / p), "linearem Wachstum"],
          [2, 2 * a, "Genau das Doppelte"],
          [2, a, "ist der Anfangsbestand"],
        ],
        pruefe: (f, rueck) => {
          // Die Verdopplung muss bei t erreicht und bei t − 1 noch nicht erreicht sein.
          pruefe(Math.pow(q, t) >= 2 && Math.pow(q, t - 1) < 2,
            `A6: ${t} ist nicht die erste Verdopplung bei q = ${q} — „${f}“`);
          pruefe(nachT >= 2 * a, `A6: ${nachT} ist nicht mindestens das Doppelte von ${a} — „${f}“`);
          // Der Anfangswert darf keine Rolle spielen — das ist die Kernaussage.
          pruefe(rueck.includes("hängt <em>nur</em> von q ab") || rueck.includes("hängt nur von q ab"),
            `A6: die Musterlösung sagt nicht, dass die Zeit vom Anfangswert unabhängig ist — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 7 — Halbwertszeit als kleinste ganze Schrittzahl. Gemessen mit
  // tests/werkzeug-streuung.js: 33 verschiedene in 200 Würfen, zurückgerechnet also rund 33
  // Kandidaten. Die Schranke ist das simulierte 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für
  // 0,8 · n gerechnet — 12.
  await pruefeAufgabe(page, bericht, {
    nr: 7, name: "A7 Halbwertszeit", runden: 30, mindestensVerschieden: 12,
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
          pruefe(Math.pow(q, n) < 0.5, `A7: nach ${n} Tagen sind noch ${Math.pow(q, n)} übrig — „${f}“`);
          pruefe(Math.pow(q, n - 1) >= 0.5,
            `A7: schon nach ${n - 1} Tagen ist weniger als die Hälfte übrig — „${f}“`);
          // Bei exponentiellem Zerfall wird nie exakt null erreicht.
          pruefe(Math.pow(q, n) > 0, `A7: der Rest ist auf 0 gefallen — „${f}“`);
          pruefe(rueck.includes("Halbwertszeit") || rueck.includes("Hälfte"),
            `A7: die Musterlösung spricht nicht von der Hälfte — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 8 — wer holt wen ein? Gemessen mit tests/werkzeug-streuung.js: 200 verschiedene in
  // 200 Würfen — die Kandidatenmenge ist weit größer als 5000. Schranke bei 30 Zügen: 27.
  await pruefeAufgabe(page, bericht, {
    nr: 8, name: "A8 Überholen", runden: 30, mindestensVerschieden: 27,
    deute: (frage) => {
      const t = minus(frage);
      const treffer = [...t.matchAll(/heute ([\d.]+) [^.]*?wächst je \S+ um (\d+) %|enthält ([\d.]+) [^.]*?wächst je \S+ um (\d+) %/g)];
      const zahlenPaare = [...t.matchAll(/([\d.]+) (?:Einwohner|Mitglieder|€) und wächst je \S+ um (\d+) %/g)];
      if (zahlenPaare.length < 2) return null;
      const a1 = zahl(zahlenPaare[0][1]), p1 = Number(zahlenPaare[0][2]);
      const a2 = zahl(zahlenPaare[1][1]), p2 = Number(zahlenPaare[1][2]);
      if (!(a1 < a2 && p1 > p2)) return null;
      const q1 = 1 + p1 / 100, q2 = 1 + p2 / 100;
      let n = null;
      for (let i = 1; i <= 200; i++) {
        if (a1 * Math.pow(q1, i) >= a2 * Math.pow(q2, i)) { n = i; break; }
      }
      if (n === null) return null;
      const wa = Math.round(a1 * Math.pow(q1, n) * 10) / 10;
      const wb = Math.round(a2 * Math.pow(q2, n) * 10) / 10;
      return {
        felder: [n, wa, wb],
        toleranz: 0.006,
        falschFelder: [
          [0, n - 1, "liegt noch zurück"],
          [0, n + 1, "erste solche Jahr"],
          [1, wb, "Beide sind dann fast gleich"],
          [1, a1, "heutige Bestand"],
          [1, Math.round(a1 * (1 + (p1 * n) / 100) * 10) / 10, "Prozentsätze addiert"],
          [2, wa, "ist der Bestand"],
          [2, a2, "heutige Bestand"],
        ],
        pruefe: (f, rueck) => {
          // Bei n muss A vorn liegen, bei n − 1 noch nicht — das ist die ganze Aufgabe.
          pruefe(a1 * Math.pow(q1, n) >= a2 * Math.pow(q2, n),
            `A8: nach ${n} Jahren liegt A noch nicht vorn — „${f}“`);
          pruefe(a1 * Math.pow(q1, n - 1) < a2 * Math.pow(q2, n - 1),
            `A8: schon nach ${n - 1} Jahren läge A vorn — „${f}“`);
          pruefe(wa >= wb, `A8: ${wa} ist nicht mindestens ${wb} — „${f}“`);
          pruefe(rueck.includes("Der größere Faktor gewinnt immer"),
            `A8: die Musterlösung zieht die Folgerung nicht — „${f}“`);
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
      for (const a of ["linear", "exponentiell"]) {
        pruefe(artenA2.has(a), `A2: in 30 Runden kam keine ${a}e Tabelle vor`);
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
