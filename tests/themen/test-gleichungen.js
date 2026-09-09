// Fachliche Prüfung: Kapitel 4, Thema 3 „Gleichungen“.
//
// Geprüft wird das Äquivalenzumformen von beiden Seiten her: Die Lösung wird
// aus dem angezeigten Term selbst berechnet und eingesetzt, und jeder Fehler,
// vor dem die Aufgabe warnt, wird eigens eingetragen — die Zahl übersehen,
// beim Hinüberbringen das Vorzeichen nicht drehen, die x-Terme addieren statt
// subtrahieren, die Klammer nur teilweise ausmultiplizieren.

"use strict";

const { neuerBericht } = require("../lib/pruefen");
const { starteBrowser, neueSeite, oeffne } = require("../lib/seite");
const { pruefeNotation } = require("../lib/notation");
const { pruefeKontrast } = require("../lib/kontrast");
const { pruefeAufgabe } = require("../lib/aufgaben");

const bericht = neuerBericht();
const { pruefe } = bericht;
const SEITE = "/mathematik/grundwissen-5-10/04-gleichungen-zuordnungen-funktionen/03-gleichungen/index.html";

// Die Terme benutzen das echte Minuszeichen und schreiben den Koeffizienten 1
// nicht aus: „x + 3“, „−x − 4“, „5x − 2“.
function liesTerm(s) {
  const t = s.replace(/−/g, "-").replace(/\s+/g, "");
  const m = t.match(/^([+-]?\d*)x([+-]\d+)?$/);
  if (m) {
    const a = m[1] === "" || m[1] === "+" ? 1 : m[1] === "-" ? -1 : Number(m[1]);
    return { a, b: m[2] ? Number(m[2]) : 0 };
  }
  const nur = t.match(/^([+-]?\d+)$/);
  return nur ? { a: 0, b: Number(nur[1]) } : null;
}

async function aufgaben(page) {
  // Aufgabe 1 — ax + b = c. 8 · 24 · 20 Kandidaten, gefiltert; Doppel sind bei
  // 30 Zügen praktisch ausgeschlossen — Schranke 28.
  await pruefeAufgabe(page, bericht, {
    nr: 1, name: "A1 zweischrittig", runden: 30, mindestensVerschieden: 28,
    deute: (frage) => {
      const m = frage.match(/Löse die Gleichung: (.+?) = (−?\d+) Wie groß/);
      if (!m) return null;
      const links = liesTerm(m[1]);
      if (!links || links.a === 0) return null;
      const a = links.a, b = links.b;
      const c = Number(m[2].replace("−", "-"));
      return {
        richtig: (c - b) / a,
        toleranz: 0.0005,
        falsch: [
          // Nach dem ersten Schritt stehen geblieben.
          [c - b, "erste"],
          // Beim Hinüberbringen das Vorzeichen nicht gedreht.
          [(c + b) / a, "Vorzeichen"],
          // Die Zahl b übersehen.
          [c / a, "übersehen"],
        ],
        pruefe: (f, rueck) => {
          const x = (c - b) / a;
          pruefe(Number.isInteger(x), `A1: die Lösung ${x} ist nicht ganzzahlig — „${f}“`);
          pruefe(x !== 0 && b !== 0, `A1: mit x = ${x} und b = ${b} wird der Schritt trivial — „${f}“`);
          // Die Lösungsmenge gehört zur Antwort, nicht nur die Zahl.
          pruefe(rueck.includes(`L = {${x < 0 ? "−" : ""}${Math.abs(x)}}`),
            `A1: die Musterlösung nennt die Lösungsmenge nicht — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 2 — x auf beiden Seiten.
  await pruefeAufgabe(page, bericht, {
    nr: 2, name: "A2 x auf beiden Seiten", runden: 30, mindestensVerschieden: 28,
    deute: (frage) => {
      const m = frage.match(/Löse die Gleichung: (.+?) = (.+?) Wie groß/);
      if (!m) return null;
      const l = liesTerm(m[1]), r = liesTerm(m[2]);
      if (!l || !r || l.a === r.a) return null;
      const { a, b } = l, { a: c, b: d } = r;
      const kk = a - c, mm = d - b;
      return {
        richtig: mm / kk,
        toleranz: 0.0005,
        falsch: [
          // Die x-Terme addiert statt subtrahiert.
          [(d - b) / (a + c), "addiert"],
          // Beim Hinüberbringen der Zahl das Vorzeichen nicht gedreht.
          [(d + b) / (a - c), "dreht sich"],
          // Nicht geteilt.
          [mm, "Division"],
        ],
        pruefe: (f, rueck) => {
          const x = mm / kk;
          pruefe(Number.isInteger(x), `A2: die Lösung ${x} ist nicht ganzzahlig — „${f}“`);
          // Beide Seiten müssen bei der Lösung wirklich denselben Wert haben.
          pruefe(Math.abs((a * x + b) - (c * x + d)) < 1e-9,
            `A2: bei x = ${x} sind die Seiten ${a * x + b} und ${c * x + d} — „${f}“`);
          pruefe(rueck.includes("Probe"), `A2: die Musterlösung macht keine Probe — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 3 — mit Klammer: a · (x + b) = c · x + d.
  await pruefeAufgabe(page, bericht, {
    nr: 3, name: "A3 mit Klammer", runden: 30, mindestensVerschieden: 28,
    deute: (frage) => {
      const m = frage.match(/Löse die Gleichung: (−?\d+) · \(x ([+−]) (\d+)\) = (.+?) Wie groß/);
      if (!m) return null;
      const a = Number(m[1].replace("−", "-"));
      const b = (m[2] === "−" ? -1 : 1) * Number(m[3]);
      const r = liesTerm(m[4]);
      if (!r) return null;
      const c = r.a, d = r.b;
      const kk = a - c, mm = d - a * b;
      return {
        richtig: mm / kk,
        toleranz: 0.0005,
        falsch: [
          // Nur x mit a multipliziert, die Zahl in der Klammer vergessen.
          [(d - b) / (a - c), "Summand in der Klammer"],
          // Beim Hinüberbringen das Vorzeichen nicht gedreht.
          [(d + a * b) / (a - c), "dreht sich"],
          // Die x-Terme addiert.
          [(d - a * b) / (a + c), "subtrahiert"],
          // Nicht geteilt.
          [mm, "Division"],
        ],
        pruefe: (f, rueck) => {
          const x = mm / kk;
          pruefe(Number.isInteger(x), `A3: die Lösung ${x} ist nicht ganzzahlig — „${f}“`);
          pruefe(Math.abs(a * (x + b) - (c * x + d)) < 1e-9,
            `A3: bei x = ${x} sind die Seiten ${a * (x + b)} und ${c * x + d} — „${f}“`);
          // Das Distributivgesetz muss in der Musterlösung ausgeschrieben stehen.
          pruefe(rueck.includes("Klammer ausmultiplizieren"),
            `A3: die Musterlösung zeigt das Ausmultiplizieren nicht — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 4 — Sachaufgabe: zwei Tarife, drei Kontexte.
  await pruefeAufgabe(page, bericht, {
    nr: 4, name: "A4 zwei Tarife", runden: 30, mindestensVerschieden: 27,
    deute: (frage) => {
      // Alle drei Kontexte nennen die vier Zahlen in derselben Reihenfolge:
      // Grundgebühr und Preis des ersten Angebots, dann des zweiten.
      const z = (frage.match(/\d+/g) || []).map(Number);
      if (z.length < 4) return null;
      const [g1, p1, g2, p2] = z;
      if (p2 <= p1 || g1 <= g2) return null;
      const x = (g1 - g2) / (p2 - p1);
      return {
        richtig: x,
        toleranz: 0.0005,
        falsch: [
          // Die beiden Preise je Einheit addiert statt ihre Differenz zu nehmen.
          [(g1 - g2) / (p1 + p2), "x-Terme"],
          // Die festen Beträge addiert.
          [(g1 + g2) / (p2 - p1), "festen Beträge"],
          // Nach dem Sortieren nicht geteilt.
          [g1 - g2, "Division"],
        ],
        pruefe: (f, rueck) => {
          pruefe(Number.isInteger(x), `A4: die Lösung ${x} ist nicht ganzzahlig — „${f}“`);
          pruefe(x > 0, `A4: die Lösung ${x} ist nicht positiv, die Frage wäre sachlich sinnlos — „${f}“`);
          // Beim Schnittpunkt müssen beide Angebote wirklich gleich viel kosten.
          pruefe(Math.abs(g1 + p1 * x - (g2 + p2 * x)) < 1e-9,
            `A4: bei ${x} kosten die Angebote ${g1 + p1 * x} und ${g2 + p2 * x} — „${f}“`);
          pruefe(rueck.includes(`${g1 + p1 * x}`),
            `A4: die Musterlösung nennt den gemeinsamen Wert ${g1 + p1 * x} nicht — „${f}“`);
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
