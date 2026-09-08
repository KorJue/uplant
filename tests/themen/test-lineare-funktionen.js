// Fachliche Prüfung: Kapitel 4, Thema 5 „Lineare Funktionen“.
//
// Die Steigung ist Δy : Δx — Höhe je Schritt nach rechts, nicht umgekehrt und
// nicht gemischt. Genau diese drei Verwechslungen werden als Antwort
// eingetragen, dazu die Punkt-vor-Strich-Falle beim Einsetzen und der
// Schnittpunkt zweier Geraden, bei dem beide Funktionen denselben Wert liefern
// müssen.

"use strict";

const { neuerBericht } = require("../lib/pruefen");
const { starteBrowser, neueSeite, oeffne } = require("../lib/seite");
const { pruefeNotation } = require("../lib/notation");
const { pruefeKontrast } = require("../lib/kontrast");
const { pruefeAufgabe } = require("../lib/aufgaben");

const bericht = neuerBericht();
const { pruefe } = bericht;
const SEITE = "/mathematik/grundwissen-5-10/04-gleichungen-zuordnungen-funktionen/05-lineare-funktionen/index.html";

const minus = (s) => s.replace(/−/g, "-");

async function aufgaben(page) {
  // Aufgabe 1 — Funktionswert einsetzen. 12 Steigungen × 18 Achsenabschnitte ×
  // 14 Stellen, gefiltert; Doppel sind bei 30 Zügen praktisch ausgeschlossen.
  await pruefeAufgabe(page, bericht, {
    nr: 1, name: "A1 Funktionswert", runden: 30, mindestensVerschieden: 28,
    deute: (frage) => {
      const m = minus(frage).match(/f\(x\) = (-?\d+)x ([+-]) (\d+) Berechne f\((-?\d+)\)/);
      if (!m) return null;
      const st = Number(m[1]);
      const b = (m[2] === "-" ? -1 : 1) * Number(m[3]);
      const x = Number(m[4]);
      return {
        richtig: st * x + b,
        toleranz: 0.0005,
        falsch: [
          // Das Vorzeichen von b verdreht.
          [st * x - b, "Vorzeichen von"],
          // Erst addiert, dann multipliziert.
          [st * (x + b), "Punkt vor Strich"],
          // f(1) statt f(x) gerechnet.
          [st + b, "wäre f(1)"],
        ],
        pruefe: (f, rueck) => {
          pruefe(st !== 0 && b !== 0, `A1: mit m = ${st} und b = ${b} ist nichts zu rechnen — „${f}“`);
          // Die Musterlösung setzt in Klammern ein — sonst entstünde bei
          // negativem x eine unlesbare Zeile.
          pruefe(rueck.includes(`(${x < 0 ? "−" : ""}${Math.abs(x)})`),
            `A1: die Musterlösung setzt nicht in Klammern ein — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 2 — Steigung aus zwei Punkten.
  await pruefeAufgabe(page, bericht, {
    nr: 2, name: "A2 Steigung", runden: 30, mindestensVerschieden: 28,
    deute: (frage) => {
      const m = minus(frage).match(/P\((-?\d+) \| (-?\d+)\) und Q\((-?\d+) \| (-?\d+)\)/);
      if (!m) return null;
      const [x1, y1, x2, y2] = m.slice(1).map(Number);
      const dx = x2 - x1, dy = y2 - y1;
      return {
        richtig: dy / dx,
        toleranz: 0.0005,
        falsch: [
          // Den Bruch auf den Kopf gestellt.
          [dx / dy, "auf dem Kopf"],
          // Nur Δy bzw. nur Δx genommen.
          [dy, "Höhenunterschied"],
          [dx, "waagerechte Abstand"],
          // Die Reihenfolge nur in einer der beiden Differenzen gedreht.
          [(y1 - y2) / (x2 - x1), "in beiden"],
          [dy + dx, null],
        ],
        pruefe: (f) => {
          pruefe(dx > 0, `A2: Δx = ${dx} ist nicht positiv — „${f}“`);
          pruefe(Number.isInteger(dy / dx), `A2: die Steigung ${dy / dx} ist nicht ganzzahlig — „${f}“`);
          // Beide Punkte müssen wirklich auf derselben Geraden liegen — das
          // ist bei zwei Punkten trivial, aber Δx darf nicht 0 sein.
          pruefe(x1 !== x2, `A2: P und Q haben dieselbe x-Koordinate — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 3 — von zwei Punkten zur Funktionsgleichung und zurück.
  await pruefeAufgabe(page, bericht, {
    nr: 3, name: "A3 Gleichung aufstellen", runden: 30, mindestensVerschieden: 28,
    deute: (frage) => {
      const m = minus(frage).match(/P\((-?\d+) \| (-?\d+)\) und Q\((-?\d+) \| (-?\d+)\)\. Berechne f\((-?\d+)\)/);
      if (!m) return null;
      const [x1, y1, x2, y2, x3] = m.slice(1).map(Number);
      const st = (y2 - y1) / (x2 - x1);
      const b = y1 - st * x1;
      return {
        richtig: st * x3 + b,
        toleranz: 0.0005,
        falsch: [
          // Den y-Achsenabschnitt vergessen.
          [st * x3, "nur mit der Steigung"],
          // Bei b bzw. m stehen geblieben.
          [b, "y-Achsenabschnitt"],
          [st, "ist die Steigung"],
          // Das Vorzeichen der Steigung verdreht.
          [-st * x3 + b, "Vorzeichen der Steigung"],
        ],
        pruefe: (f) => {
          pruefe(Number.isInteger(st) && Number.isInteger(b),
            `A3: m = ${st} und b = ${b} sind nicht beide ganzzahlig — „${f}“`);
          // Beide gegebenen Punkte müssen die aufgestellte Gleichung erfüllen.
          pruefe(Math.abs(st * x1 + b - y1) < 1e-9 && Math.abs(st * x2 + b - y2) < 1e-9,
            `A3: die Gerade y = ${st}x + ${b} geht nicht durch beide Punkte — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 4 — Schnittpunkt zweier Geraden.
  await pruefeAufgabe(page, bericht, {
    nr: 4, name: "A4 Schnittpunkt", runden: 30, mindestensVerschieden: 28,
    deute: (frage) => {
      const m = minus(frage).match(/g\(x\) = (-?\d+)x ([+-]) (\d+) und h\(x\) = (-?\d+)x ([+-]) (\d+)/);
      if (!m) return null;
      const m1 = Number(m[1]);
      const b1 = (m[2] === "-" ? -1 : 1) * Number(m[3]);
      const m2 = Number(m[4]);
      const b2 = (m[5] === "-" ? -1 : 1) * Number(m[6]);
      const xs = (b2 - b1) / (m1 - m2);
      const ys = m1 * xs + b1;
      return {
        richtig: ys,
        toleranz: 0.0005,
        falsch: [
          // Die x-Koordinate statt der y-Koordinate angegeben.
          [xs, "-Koordinate des Schnittpunkts"],
          // Beim Sortieren die Steigungen addiert.
          [(b2 - b1) / (m1 + m2), "subtrahiert"],
          // Die Achsenabschnitte addiert.
          [(b1 + b2) / (m1 - m2), "Auch die Zahlen"],
          [b1, "y-Achsenabschnitt"],
        ],
        pruefe: (f, rueck) => {
          pruefe(m1 !== m2, `A4: parallele Geraden mit m = ${m1} schneiden sich nicht — „${f}“`);
          pruefe(Number.isInteger(xs), `A4: die x-Koordinate ${xs} ist nicht ganzzahlig — „${f}“`);
          // Der Kern: Im Schnittpunkt liefern beide Funktionen denselben Wert.
          pruefe(Math.abs(m1 * xs + b1 - (m2 * xs + b2)) < 1e-9,
            `A4: g(${xs}) = ${m1 * xs + b1}, aber h(${xs}) = ${m2 * xs + b2} — „${f}“`);
          pruefe(rueck.includes(`S(${xs < 0 ? "−" : ""}${Math.abs(xs)} | ${ys < 0 ? "−" : ""}${Math.abs(ys)})`),
            `A4: die Musterlösung nennt den Schnittpunkt nicht als Paar — „${f}“`);
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
