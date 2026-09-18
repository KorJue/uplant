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
  // Aufgabe 1 — Quader: Volumen oder Oberfläche. Gemessen mit tests/werkzeug-streuung.js: 190
  // verschiedene in 200 Würfen, zurückgerechnet also rund 1923 Kandidaten. Die Schranke ist das
  // simulierte 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für 0,8 · n gerechnet — 26.
  await pruefeAufgabe(page, bericht, {
    nr: 1, name: "A1 Quader", runden: 30, mindestensVerschieden: 26,
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
          [4 * (a + b + c), "Kantensumme"],
        ],
      };
    },
  });

  // Aufgabe 2 — Raum- und Hohlmaße umrechnen. Gemessen mit tests/werkzeug-streuung.js: 142
  // verschiedene in 200 Würfen, zurückgerechnet also rund 273 Kandidaten. Die Schranke ist das
  // simulierte 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für 0,8 · n gerechnet — 22.
  await pruefeAufgabe(page, bericht, {
    nr: 3, name: "A3 Raummaße", runden: 30, mindestensVerschieden: 22,
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
    nr: 5, name: "A5 Stufenkörper", runden: 30, mindestensVerschieden: 28,
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

  // Aufgabe 4 — Becken ohne Deckel: Boden und vier Wände. Gemessen mit
  // tests/werkzeug-streuung.js: 192 verschiedene in 200 Würfen, zurückgerechnet also rund 2421
  // Kandidaten. Die Schranke ist das simulierte 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für
  // 0,8 · n gerechnet — 27.
  await pruefeAufgabe(page, bericht, {
    nr: 7, name: "A7 Becken auskleiden", runden: 30, mindestensVerschieden: 27,
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

  // Aufgabe 2 — Volumen und Oberfläche nebeneinander (Aufgabe zum Ausfüllen). Gemessen mit
  // tests/werkzeug-streuung.js: 182 verschiedene in 200 Würfen, zurückgerechnet rund 1039
  // Kandidaten (11 · 9 · 8 = 792 Kantentripel). Die Schranke ist das simulierte 10⁻⁴-Quantil bei
  // 30 Zügen, vorsichtshalber für 0,8 · n gerechnet — 26.
  await pruefeAufgabe(page, bericht, {
    nr: 2, name: "A2 Volumen und Oberfläche", runden: 30, mindestensVerschieden: 26,
    deute: (frage) => {
      const m = frage.match(/Kanten (\d+) cm, (\d+) cm und (\d+) cm/);
      if (!m) return null;
      const [a, b, c] = m.slice(1).map(Number);
      const V = a * b * c, O = 2 * (a * b + a * c + b * c);
      pruefe(V !== O, `A2: bei ${a}×${b}×${c} haben Volumen und Oberfläche dieselbe Maßzahl (${V})`);
      return {
        felder: [V, O],
        falschFelder: [
          [0, O, "Oberflächeninhalt"],
          [1, V, "Volumen"],
        ],
      };
    },
  });

  // Aufgabe 4 — die fehlende Kante. Gemessen mit tests/werkzeug-streuung.js: 179 verschiedene in
  // 200 Würfen, zurückgerechnet rund 880 Kandidaten (11 · 9 · 11 = 1089 Tripel, von denen einige
  // dasselbe Volumen ergeben). Die Schranke ist das simulierte 10⁻⁴-Quantil bei 30 Zügen,
  // vorsichtshalber für 0,8 · n gerechnet — 25.
  await pruefeAufgabe(page, bericht, {
    nr: 4, name: "A4 fehlende Kante", runden: 30, mindestensVerschieden: 25,
    deute: (frage) => {
      const m = frage.match(/Volumen ([\d.]+) cm³.*?Kanten sind (\d+) cm und (\d+) cm lang/);
      if (!m) return null;
      const V = Number(m[1].replace(/\./g, "")), a = Number(m[2]), b = Number(m[3]);
      pruefe(V % (a * b) === 0, `A4: ${V} cm³ lässt sich nicht glatt durch ${a} · ${b} teilen`);
      return {
        richtig: V / (a * b),
        falsch: [
          [V - a * b, "dividiert"],
          [V / a !== V / (a * b) ? V / a : null, "beide"],
        ],
      };
    },
  });

  // Aufgabe 6 — gleiches Volumen, andere Oberfläche (Aufgabe zum Ausfüllen). Gemessen mit
  // tests/werkzeug-streuung.js: 113 verschiedene in 200 Würfen, zurückgerechnet rund 156
  // Kandidaten. Die Schranke ist das simulierte 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für
  // 0,8 · n gerechnet — 20.
  await pruefeAufgabe(page, bericht, {
    nr: 6, name: "A6 gleiches Volumen", runden: 30, mindestensVerschieden: 20,
    deute: (frage) => {
      const m = frage.match(/je (\d+) Einheitswürfeln.*?Quader I: (\d+) × (\d+) × (\d+)\s*Quader II: (\d+) × (\d+) × (\d+)/);
      if (!m) return null;
      const [V, x1, y1, z1, x2, y2, z2] = m.slice(1).map(Number);
      // Der Kern der Aufgabe: Beide Quader müssen wirklich dasselbe Volumen haben.
      pruefe(x1 * y1 * z1 === V && x2 * y2 * z2 === V,
        `A6: die Volumina stimmen nicht überein (${x1 * y1 * z1} und ${x2 * y2 * z2}, angekündigt ${V})`);
      const O1 = 2 * (x1 * y1 + x1 * z1 + y1 * z1);
      const O2 = 2 * (x2 * y2 + x2 * z2 + y2 * z2);
      pruefe(O1 !== O2, `A6: beide Oberflächen sind gleich groß (${O1}) — dann gibt es keinen Unterschied zu nennen`);
      return {
        felder: [O1, O2, Math.abs(O1 - O2)],
        falschFelder: [
          [0, O1 !== V ? V : null, "Volumen"],
          [2, O1 + O2, "Unterschied"],
        ],
      };
    },
  });

  // Aufgabe 8 — Aquarium (Aufgabe zum Ausfüllen). Gemessen mit tests/werkzeug-streuung.js:
  // 135 verschiedene in 200 Würfen, zurückgerechnet rund 236 Kandidaten (9 · 6 · 5 = 270 Tripel).
  // Die Schranke ist das simulierte 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für 0,8 · n
  // gerechnet — 22.
  await pruefeAufgabe(page, bericht, {
    nr: 8, name: "A8 Aquarium", runden: 30, mindestensVerschieden: 22,
    deute: (frage) => {
      const m = frage.match(/innen (\d+) dm lang, (\d+) dm breit und (\d+) dm hoch/);
      if (!m) return null;
      const [a, b, h] = m.slice(1).map(Number);
      pruefe(h >= 2, `A8: bei ${h} dm Höhe bliebe nach „1 dm unter dem Rand“ nichts übrig`);
      const V = a * b * h;
      const gefuellt = a * b * (h - 1);
      const glas = a * b + 2 * a * h + 2 * b * h;
      return {
        felder: [V, gefuellt, glas],
        falschFelder: [
          [0, V * 1000, "Liter"],
          [1, V - 1, "Schicht"],
          [2, 2 * (a * b + a * h + b * h), "Deckel"],
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
