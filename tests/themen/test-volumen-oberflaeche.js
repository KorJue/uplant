// Fachliche Prüfung: Kapitel 2, Thema 3 „Volumen und Oberflächeninhalt“.
//
// Die beiden Verwechslungen dieses Themas sind Volumen gegen Oberfläche und
// der Umrechnungsfaktor 1000 gegen 100. Beide werden eigens ausgelöst. Beim
// Becken ohne Deckel wird zusätzlich geprüft, dass die volle Oberfläche
// zurückgewiesen wird — der Deckel fehlt ja.

"use strict";

const { neuerBericht } = require("../lib/pruefen");
const { starteBrowser, neueSeite, oeffne } = require("../lib/seite");
const { pruefeNotation } = require("../lib/notation");
const { pruefeKontrast } = require("../lib/kontrast");
const { pruefeAufgabe } = require("../lib/aufgaben");

const bericht = neuerBericht();
const { pruefe } = bericht;
const SEITE = "/mathematik/grundwissen-5-10/02-geometrie/03-volumen-oberflaeche/index.html";

// Zehnerexponent der Raum- und Hohlmaße, bezogen auf m³.
const EXP = { "mm³": -9, "cm³": -6, "dm³": -3, "m³": 0, ml: -6, l: -3, hl: -1 };
const ohnePunkte = (s) => Number(String(s).replace(/\./g, "").replace(",", "."));

async function aufgaben(page) {
  // Aufgabe 1 — Quader: Volumen oder Oberfläche. 11 · 9 · 8 Kantentripel × 2 Fragen.
  await pruefeAufgabe(page, bericht, {
    nr: 1, name: "A1 Quader", runden: 30, mindestensVerschieden: 28,
    deute: (frage) => {
      const m = frage.match(/Kanten (\d+) cm, (\d+) cm und (\d+) cm/);
      if (!m) return null;
      const [a, b, c] = m.slice(1).map(Number);
      const V = a * b * c, O = 2 * (a * b + a * c + b * c);
      const nachVolumen = frage.includes("Volumen");
      return {
        richtig: nachVolumen ? V : O,
        toleranz: 0.02,
        falsch: [
          [nachVolumen ? O : V, nachVolumen ? "Das ist der Oberflächeninhalt" : "Das ist das Volumen"],
          [a * b + a * c + b * c, "zweimal"],
          // Bei manchen Kanten — etwa 2, 5 und 6 — ist die Kantensumme
          // zahlengleich mit der halben Oberfläche. Die Seite nennt dann den
          // zuerst geprüften Fehler; beide Hinweise wären dort richtig.
          [4 * (a + b + c) === a * b + a * c + b * c ? null : 4 * (a + b + c), "Kantensumme"],
        ],
      };
    },
  });

  // Aufgabe 2 — Raum- und Hohlmaße umrechnen.
  await pruefeAufgabe(page, bericht, {
    nr: 2, name: "A2 Raummaße", runden: 30, mindestensVerschieden: 25,
    deute: (frage) => {
      const m = frage.match(/Rechne um: ([\d.,]+) (mm³|cm³|dm³|m³|ml|l|hl) = \? (mm³|cm³|dm³|m³|ml|l|hl)/);
      if (!m) return null;
      const wert = ohnePunkte(m[1]);
      const diff = EXP[m[2]] - EXP[m[3]];
      const richtig = wert * Math.pow(10, diff);
      // Mit dem Flächenfaktor gerechnet: statt 1000 je Stufe nur 100.
      const stufen = diff / 3;
      const mitFlaeche = Number.isInteger(stufen) ? wert * Math.pow(10, stufen * 2) : null;
      return {
        richtig,
        toleranz: Math.max(1e-9, Math.abs(richtig) * 1e-9),
        falsch: [
          [mitFlaeche, "Faktor der Flächen"],
          [wert * Math.pow(10, -diff), "Richtung stimmt nicht"],
        ],
      };
    },
  });

  // Aufgabe 3 — Stufenkörper: voller Quader minus herausgeschnittener Block.
  await pruefeAufgabe(page, bericht, {
    nr: 3, name: "A3 Stufenkörper", runden: 30, mindestensVerschieden: 28,
    deute: (frage) => {
      const m = frage.match(/Quader von (\d+) cm × (\d+) cm × (\d+) cm, aus dem oben ein Block von (\d+) cm × (\d+) cm × (\d+) cm/);
      if (!m) return null;
      const [a, b, c, d, b2, e] = m.slice(1).map(Number);
      if (b2 !== b) return null;   // der Block geht über die volle Tiefe
      return {
        richtig: a * b * c - d * b * e,
        toleranz: 0.02,
        falsch: [
          [a * b * c, "vollen"],
          [d * b * e, "weggeschnittenen"],
        ],
      };
    },
  });

  // Aufgabe 4 — Becken ohne Deckel: Boden und vier Wände.
  await pruefeAufgabe(page, bericht, {
    nr: 4, name: "A4 Becken auskleiden", runden: 30, mindestensVerschieden: 28,
    deute: (frage) => {
      const m = frage.match(/innen (\d+) m lang, (\d+) m breit und (\d+) m tief.*?(\d+) € je Quadratmeter/);
      if (!m) return null;
      const [a, b, c, preis] = m.slice(1).map(Number);
      const O = a * b + 2 * a * c + 2 * b * c;      // Boden plus vier Wände
      return {
        richtig: O * preis,
        toleranz: 0.02,
        falsch: [
          [2 * (a * b + a * c + b * c) * preis, "keinen Deckel"],
          [a * b * c * preis, "mit dem Volumen gerechnet"],
          [O, "der Preis fehlt noch"],
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
