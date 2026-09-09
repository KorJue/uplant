// Fachliche Prüfung: Kapitel 4, Thema 6 „Lineare Gleichungssysteme“.
//
// Drei Verfahren, eine Lösung: Gleichsetzen, Einsetzen und Addieren müssen
// dasselbe Zahlenpaar liefern. Der Test rechnet jedes System unabhängig nach
// und setzt die Lösung in BEIDE Gleichungen ein — ein Verfahren, das nur eine
// der beiden erfüllt, hätte nichts gelöst. Dazu wird jeder vorgesehene Fehler
// eingetragen: den anderen Wert angeben, das Vorzeichen verlieren, vor der
// Division stehen bleiben.

"use strict";

const { neuerBericht } = require("../lib/pruefen");
const { starteBrowser, neueSeite, oeffne } = require("../lib/seite");
const { pruefeNotation } = require("../lib/notation");
const { pruefeKontrast } = require("../lib/kontrast");
const { pruefeAufgabe } = require("../lib/aufgaben");

const bericht = neuerBericht();
const { pruefe } = bericht;
const SEITE = "/mathematik/grundwissen-5-10/04-gleichungen-zuordnungen-funktionen/06-lineare-gleichungssysteme/index.html";

const minus = (s) => s.replace(/−/g, "-");

// „y = 3x − 4“, „y = −x + 2“ — der Koeffizient 1 wird nicht geschrieben.
function nachY(s) {
  const m = s.match(/y = (-?\d*)x( [+-] \d+)?/);
  if (!m) return null;
  const st = m[1] === "" ? 1 : m[1] === "-" ? -1 : Number(m[1]);
  const b = m[2] ? Number(m[2].replace(/\s/g, "")) : 0;
  return { m: st, b };
}

// „2x + y = 5“, „3x − 4y = 1“ — auch hier fehlt der Koeffizient 1.
function gleichung(s) {
  const m = s.match(/(-?\d*)x ([+-]) (\d*)y = (-?\d+)/);
  if (!m) return null;
  const a = m[1] === "" ? 1 : m[1] === "-" ? -1 : Number(m[1]);
  const bBetrag = m[3] === "" ? 1 : Number(m[3]);
  return { a, b: (m[2] === "-" ? -1 : 1) * bBetrag, c: Number(m[4]) };
}

// Cramer: die eindeutige Lösung eines 2×2-Systems.
function loese(g1, g2) {
  const det = g1.a * g2.b - g2.a * g1.b;
  if (det === 0) return null;
  return { x: (g1.c * g2.b - g2.c * g1.b) / det, y: (g1.a * g2.c - g2.a * g1.c) / det };
}

async function aufgaben(page) {
  // Aufgabe 1 — Gleichsetzungsverfahren. Die Kandidatenliste ist groß;
  // Doppel sind bei 30 Zügen praktisch ausgeschlossen.
  await pruefeAufgabe(page, bericht, {
    nr: 1, name: "A1 Gleichsetzen", runden: 30, mindestensVerschieden: 28,
    deute: (frage) => {
      const t = minus(frage);
      const m = t.match(/I: (y = .+?) II: (y = .+?) Wie groß/);
      if (!m) return null;
      const g1 = nachY(m[1]), g2 = nachY(m[2]);
      if (!g1 || !g2 || g1.m === g2.m) return null;
      const x0 = (g2.b - g1.b) / (g1.m - g2.m);
      const y0 = g1.m * x0 + g1.b;
      return {
        richtig: x0,
        toleranz: 0.0005,
        falsch: [
          // Das Vorzeichen beim Sortieren verloren.
          [-x0, "Vorzeichen"],
          // Den y-Wert angegeben.
          [y0, "y-Wert"],
          // Vor der Division stehen geblieben.
          [g2.b - g1.b, "Division"],
          [g1.m - g2.m, "Koeffizient vor dem x"],
        ],
        pruefe: (f, rueck) => {
          pruefe(Number.isInteger(x0), `A1: x = ${x0} ist nicht ganzzahlig — „${f}“`);
          // Beide Geraden müssen im Lösungspunkt denselben y-Wert haben.
          pruefe(Math.abs(g1.m * x0 + g1.b - (g2.m * x0 + g2.b)) < 1e-9,
            `A1: I liefert ${g1.m * x0 + g1.b}, II liefert ${g2.m * x0 + g2.b} — „${f}“`);
          pruefe(rueck.includes("Probe in II"), `A1: die Musterlösung macht keine Probe in II — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 2 — Einsetzungsverfahren; gefragt ist y.
  await pruefeAufgabe(page, bericht, {
    nr: 2, name: "A2 Einsetzen", runden: 30, mindestensVerschieden: 28,
    deute: (frage) => {
      const t = minus(frage);
      const m = t.match(/I: (.+?) II: (.+?) Wie groß/);
      if (!m) return null;
      const g1 = gleichung(m[1]), g2 = gleichung(m[2]);
      if (!g1 || !g2) return null;
      const l = loese(g1, g2);
      if (!l) return null;
      return {
        richtig: l.y,
        toleranz: 0.0005,
        falsch: [
          // Den x-Wert angegeben.
          [l.x, "x-Wert"],
          // Das Vorzeichen beim Auflösen der Klammer verloren.
          [-l.y, "Vorzeichen"],
          // Eine rechte Seite für y gehalten.
          [g1.c, "rechte Seite von Gleichung I"],
          [g2.c, "rechte Seite von Gleichung II"],
        ],
        pruefe: (f) => {
          pruefe(g1.b === 1, `A2: Gleichung I ist nicht nach y auflösbar ohne Bruch (b = ${g1.b}) — „${f}“`);
          pruefe(Number.isInteger(l.x) && Number.isInteger(l.y),
            `A2: die Lösung (${l.x} | ${l.y}) ist nicht ganzzahlig — „${f}“`);
          // Die Lösung muss beide Gleichungen erfüllen, nicht nur eine.
          pruefe(Math.abs(g1.a * l.x + g1.b * l.y - g1.c) < 1e-9
            && Math.abs(g2.a * l.x + g2.b * l.y - g2.c) < 1e-9,
            `A2: (${l.x} | ${l.y}) erfüllt nicht beide Gleichungen — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 3 — Additionsverfahren; gefragt ist x.
  await pruefeAufgabe(page, bericht, {
    nr: 3, name: "A3 Additionsverfahren", runden: 30, mindestensVerschieden: 28,
    deute: (frage) => {
      const t = minus(frage);
      const m = t.match(/I: (.+?) II: (.+?) Wie groß/);
      if (!m) return null;
      const g1 = gleichung(m[1]), g2 = gleichung(m[2]);
      if (!g1 || !g2) return null;
      const l = loese(g1, g2);
      if (!l) return null;
      return {
        richtig: l.x,
        toleranz: 0.0005,
        falsch: [
          [l.y, "y-Wert"],
          [-l.x, "Vorzeichen"],
          // Die Gleichungen direkt addiert, ohne passend zu multiplizieren.
          [g1.a + g2.a !== 0 ? (g1.c + g2.c) / (g1.a + g2.a) : null, "direkt addiert"],
        ],
        pruefe: (f) => {
          pruefe(Number.isInteger(l.x) && Number.isInteger(l.y),
            `A3: die Lösung (${l.x} | ${l.y}) ist nicht ganzzahlig — „${f}“`);
          pruefe(Math.abs(g1.a * l.x + g1.b * l.y - g1.c) < 1e-9
            && Math.abs(g2.a * l.x + g2.b * l.y - g2.c) < 1e-9,
            `A3: (${l.x} | ${l.y}) erfüllt nicht beide Gleichungen — „${f}“`);
          // Das System muss eindeutig lösbar sein — sonst wäre die Frage falsch.
          pruefe(g1.a * g2.b - g2.a * g1.b !== 0,
            `A3: die Determinante ist 0, das System ist nicht eindeutig lösbar — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 4 — Sachaufgabe: zwei Preise aus zwei Bestellungen.
  await pruefeAufgabe(page, bericht, {
    nr: 4, name: "A4 zwei Preise", runden: 30, mindestensVerschieden: 28,
    deute: (frage) => {
      // Beide Sätze nennen ihre drei Zahlen in derselben Reihenfolge:
      // Anzahl der ersten Sorte, Anzahl der zweiten, Gesamtpreis.
      const z = (frage.match(/\d+/g) || []).map(Number);
      if (z.length < 6) return null;
      const g1 = { a: z[0], b: z[1], c: z[2] };
      const g2 = { a: z[3], b: z[4], c: z[5] };
      const l = loese(g1, g2);
      if (!l) return null;
      return {
        richtig: l.y,
        toleranz: 0.0005,
        falsch: [
          // Den Preis der ersten Sorte angegeben.
          [l.x, "Preis einer"],
          [l.x + l.y, "beider zusammen"],
          [l.x - l.y, "Preisunterschied"],
        ],
        pruefe: (f, rueck) => {
          pruefe(l.x > 0 && l.y > 0, `A4: die Preise ${l.x} € und ${l.y} € sind nicht beide positiv — „${f}“`);
          pruefe(Number.isInteger(l.x) && Number.isInteger(l.y),
            `A4: die Preise ${l.x} € und ${l.y} € sind nicht ganzzahlig — „${f}“`);
          // Beide Bestellungen müssen mit diesen Preisen aufgehen.
          pruefe(Math.abs(g1.a * l.x + g1.b * l.y - g1.c) < 1e-9
            && Math.abs(g2.a * l.x + g2.b * l.y - g2.c) < 1e-9,
            `A4: die Preise passen nicht zu beiden Angaben — „${f}“`);
          // Die Musterlösung muss die Unbekannten benennen, bevor sie rechnet.
          pruefe(rueck.includes("Benennen"), `A4: die Musterlösung benennt x und y nicht — „${f}“`);
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
