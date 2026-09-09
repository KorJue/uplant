// Fachliche Prüfung: Kapitel 2, Thema 9 „Satz des Pythagoras“.
//
// Zwei Dinge werden hier leicht falsch gelernt: dass der Satz die Längen
// addiere statt die Quadrate, und dass „c“ die Hypotenuse sei — statt der
// längsten Seite, wie immer sie heißt. Beides wird eigens geprüft: das
// Umkehrungs-Werkzeug bekommt Dreiecke, deren längste Seite a oder b heißt,
// und in jeder Aufgabe wird der Längenfehler als Antwort eingetragen.

"use strict";

const { neuerBericht } = require("../lib/pruefen");
const { starteBrowser, neueSeite, oeffne, setzeRegler, text } = require("../lib/seite");
const { pruefeNotation } = require("../lib/notation");
const { pruefeKontrast } = require("../lib/kontrast");
const { pruefeAufgabe } = require("../lib/aufgaben");

const bericht = neuerBericht();
const { pruefe } = bericht;
const SEITE = "/mathematik/grundwissen-5-10/02-geometrie/09-pythagoras/index.html";

// Schreibweise der Seite: Tausenderpunkt, Dezimalkomma.
const de = (x, stellen = 4) => Number(x.toFixed(stellen)).toLocaleString("de-DE", { maximumFractionDigits: stellen });

// ── Die Umkehrung: rechtwinklig, spitzwinklig, stumpfwinklig ───────────────
// Geprüft wird an Dreiecken, deren längste Seite bewusst nicht immer c heißt.
async function umkehrung(page) {
  const faelle = [
    { a: 3, b: 4, c: 5, art: "recht" },
    { a: 24, b: 32, c: 40, art: "recht" },   // vierstellige Quadrate: 1.600
    { a: 5, b: 3, c: 4, art: "recht" },      // längste Seite heißt a
    { a: 3, b: 5, c: 4, art: "recht" },      // längste Seite heißt b
    { a: 6, b: 7, c: 9, art: "spitz" },
    { a: 9, b: 6, c: 7, art: "spitz" },      // längste Seite heißt a
    { a: 2, b: 3, c: 4, art: "stumpf" },
    { a: 4, b: 2, c: 3, art: "stumpf" },     // längste Seite heißt a
    { a: 1, b: 2, c: 5, art: "keins" },      // Dreiecksungleichung verletzt
    { a: 1, b: 2, c: 3, art: "keins" },      // Grenzfall: 1 + 2 = 3
  ];

  for (const { a, b, c, art } of faelle) {
    await setzeRegler(page, "uk-a", a);
    await setzeRegler(page, "uk-b", b);
    await setzeRegler(page, "uk-c", c);

    const klasse = await page.evaluate(() => document.getElementById("uk-urteil").className);
    const urteil = await text(page, "#uk-urteil");
    const bilanz = await text(page, "#uk-bilanz");
    const wo = `${a} · ${b} · ${c}`;

    pruefe(klasse.split(/\s+/).includes(art),
      `Umkehrung: ${wo} wird als „${klasse}“ eingestuft, erwartet „${art}“`);

    if (art === "keins") {
      // Ohne Dreieck darf auch keine Zeichnung stehen — ein Bild darf nicht
      // behaupten, was es nicht gibt.
      const figuren = await page.evaluate(() => document.querySelectorAll("#uk-mount svg").length);
      pruefe(figuren === 0, `Umkehrung: ${wo} ist kein Dreieck, es wird aber gezeichnet`);
      pruefe(urteil.includes("Dreiecksungleichung"),
        `Umkehrung: ${wo} verletzt die Dreiecksungleichung, das Urteil sagt es nicht — „${urteil}“`);
      continue;
    }

    const [k1, k2, lang] = [a, b, c].slice().sort((x, y) => x - y);
    const name = lang === c ? "c" : lang === b ? "b" : "a";
    // Die Bilanz muss mit den beiden kürzeren Seiten rechnen und die längste
    // beim Namen nennen — auch dann, wenn dieser Name nicht „c“ ist.
    pruefe(bilanz.includes(`${name} = ${de(lang)}`),
      `Umkehrung: ${wo} — die Bilanz nennt die längste Seite nicht „${name} = ${lang}“ — „${bilanz}“`);
    pruefe(bilanz.includes(`${de(k1 * k1)} + ${de(k2 * k2)} = ${de(k1 * k1 + k2 * k2)}`),
      `Umkehrung: ${wo} — die Bilanz zeigt nicht ${k1 * k1} + ${k2 * k2} = ${k1 * k1 + k2 * k2} — „${bilanz}“`);
    pruefe(bilanz.includes(`${de(lang)}² = ${de(lang * lang)}`),
      `Umkehrung: ${wo} — die Bilanz zeigt nicht ${lang}² = ${lang * lang} — „${bilanz}“`);
    if (name !== "c") {
      pruefe(bilanz.includes(`längste Seite ist hier ${name}`),
        `Umkehrung: ${wo} — es fehlt der Hinweis, dass die längste Seite ${name} heißt — „${bilanz}“`);
    }

    // Der rechte Winkel wird nur im rechtwinkligen Fall markiert. Er ist das
    // einzige <path> der Zeichnung — Dreieck und Seiten sind polygon und line.
    const rechteWinkel = await page.evaluate(() => document.querySelectorAll("#uk-mount svg path").length);
    if (art === "recht") {
      pruefe(urteil.includes(`Seite ${name} gegenüber`),
        `Umkehrung: ${wo} — das Urteil sagt nicht, dass der rechte Winkel ${name} gegenüberliegt — „${urteil}“`);
      pruefe(rechteWinkel === 1,
        `Umkehrung: ${wo} ist rechtwinklig, der rechte Winkel ist aber nicht markiert`);
    } else {
      pruefe(rechteWinkel === 0,
        `Umkehrung: ${wo} ist nicht rechtwinklig, es wird aber ein rechter Winkel markiert`);
    }
  }

  // Die Schaltflächen mit den Grundtripeln müssen wirklich ein rechtwinkliges
  // Dreieck einstellen.
  const anzahl = await page.evaluate(() => document.querySelectorAll("#uk-tripel button").length);
  pruefe(anzahl === 7, `Umkehrung: ${anzahl} Tripel-Schaltflächen statt 7`);
  for (let i = 0; i < anzahl; i++) {
    const beschriftung = await page.evaluate((k) =>
      document.querySelectorAll("#uk-tripel button")[k].textContent.trim(), i);
    await page.evaluate((k) => document.querySelectorAll("#uk-tripel button")[k].click(), i);
    const [x, y, z] = beschriftung.split("·").map((s) => Number(s.trim()));
    pruefe(x * x + y * y === z * z, `Umkehrung: „${beschriftung}“ ist kein pythagoreisches Tripel`);
    const klasse = await page.evaluate(() => document.getElementById("uk-urteil").className);
    pruefe(klasse.includes("recht"), `Umkehrung: „${beschriftung}“ wird nicht als rechtwinklig erkannt`);
  }
}

// ── Die Übungsaufgaben ─────────────────────────────────────────────────────
async function aufgaben(page) {
  // Aufgabe 1 — Hypotenuse. 7 Grundtripel × 3 Vielfache × 2 Reihenfolgen der
  // Katheten = 42 gleich wahrscheinliche Fassungen; bei 30 Zügen ist E = 21,6
  // und σ = 1,8, das Quantil 10⁻⁴ liegt bei 15 — Schranke 14.
  await pruefeAufgabe(page, bericht, {
    nr: 1, name: "A1 Hypotenuse", runden: 30, mindestensVerschieden: 14,
    deute: (frage) => {
      const m = frage.match(/a = (\d+) cm.*?b = (\d+) cm/);
      if (!m) return null;
      const [a, b] = m.slice(1).map(Number);
      const c = Math.sqrt(a * a + b * b);
      return {
        richtig: c,
        toleranz: 0.005,
        falsch: [
          [a + b, "addiert"],
          [a * a + b * b, "Quadratwurzel"],
          [Math.sqrt(Math.abs(a * a - b * b)), "subtrahiert"],
        ],
        pruefe: (f, rueck) => {
          // Konstruktiv erzeugt: Die Lösung darf nie irrational sein.
          pruefe(Number.isInteger(c), `A1: √(${a}² + ${b}²) = ${c} ist nicht ganzzahlig — „${f}“`);
          pruefe(rueck.includes(`${de(c * c)}`),
            `A1: die Musterlösung nennt c² = ${c * c} nicht — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 2 — fehlende Kathete, gleiche Kandidatenmenge wie A1.
  await pruefeAufgabe(page, bericht, {
    nr: 2, name: "A2 Kathete", runden: 30, mindestensVerschieden: 14,
    deute: (frage) => {
      const m = frage.match(/c = (\d+) cm.*?a = (\d+) cm/);
      if (!m) return null;
      const [c, a] = m.slice(1).map(Number);
      const b = Math.sqrt(c * c - a * a);
      return {
        richtig: b,
        toleranz: 0.005,
        falsch: [
          // Die Längen statt der Quadrate subtrahiert.
          [c - a, "Quadrate"],
          // Bei b² stehen geblieben.
          [c * c - a * a, "Quadratwurzel"],
          // Addiert, obwohl die Hypotenuse schon bekannt ist.
          [Math.sqrt(c * c + a * a), "addiert"],
        ],
        pruefe: (f) => {
          pruefe(Number.isInteger(b), `A2: √(${c}² − ${a}²) = ${b} ist nicht ganzzahlig — „${f}“`);
          pruefe(a < c, `A2: die Kathete ${a} ist nicht kürzer als die Hypotenuse ${c} — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 3 — Höhensatz oder Kathetensatz, je zur Hälfte. Der Höhensatz-Zweig
  // hat 36 Ziehungen auf etwa 30 Paare, der Kathetensatz-Zweig nur 6 Fassungen;
  // simuliert man den Generator, ist bei 30 Zügen E = 17,2 und σ = 2,0, das
  // Quantil 10⁻⁴ liegt bei 10 — Schranke 9.
  await pruefeAufgabe(page, bericht, {
    nr: 3, name: "A3 Höhen- und Kathetensatz", runden: 30, mindestensVerschieden: 9,
    deute: (frage) => {
      const hoehe = frage.match(/p = (\d+) cm.*?q = (\d+) cm/);
      if (hoehe) {
        const [p, q] = hoehe.slice(1).map(Number);
        const h = Math.sqrt(p * q);
        return {
          richtig: h,
          toleranz: 0.005,
          falsch: [
            [p + q, "addiert"],
            [(p + q) / 2, "Mittelwert"],
            [p * q, "Quadratwurzel"],
          ],
          pruefe: (f) => {
            pruefe(Number.isInteger(h), `A3: √(${p} · ${q}) = ${h} ist nicht ganzzahlig — „${f}“`);
            // Bei p = q fielen geometrisches und arithmetisches Mittel zusammen,
            // und der Mittelwert-Fehler wäre nicht mehr zu diagnostizieren.
            pruefe(p !== q, `A3: p = q = ${p} macht den Mittelwertfehler unsichtbar — „${f}“`);
          },
        };
      }

      const kathete = frage.match(/c = (\d+) cm.*?p = (\d+) cm/);
      if (!kathete) return null;
      const [c, p] = kathete.slice(1).map(Number);
      const a = Math.sqrt(c * p);
      return {
        richtig: a,
        toleranz: 0.005,
        falsch: [
          [c * p, "Quadratwurzel"],
          // c − p ist der andere Abschnitt q.
          [c - p, "Hypotenusenabschnitt q"],
          // Mit q statt p gerechnet — das ergäbe die andere Kathete.
          [Math.sqrt(c * (c - p)), "falschen Abschnitt"],
        ],
        pruefe: (f) => {
          pruefe(Number.isInteger(a), `A3: √(${c} · ${p}) = ${a} ist nicht ganzzahlig — „${f}“`);
          pruefe(p < c, `A3: der Abschnitt ${p} ist nicht kürzer als die Hypotenuse ${c} — „${f}“`);
          // Der Kathetensatz muss mit dem Pythagoras verträglich sein:
          // a² = c·p und b² = c·q ergeben zusammen a² + b² = c².
          const b2 = c * (c - p);
          pruefe(Math.abs(c * p + b2 - c * c) < 1e-9,
            `A3: a² + b² = ${c * p + b2} statt c² = ${c * c} — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 4 — Raumdiagonale. 8 Quader × 3 Vielfache = 24 Fassungen; bei 30
  // Zügen E = 17,3 und σ = 1,6, Quantil 10⁻⁴ bei 12 — Schranke 11.
  await pruefeAufgabe(page, bericht, {
    nr: 4, name: "A4 Raumdiagonale", runden: 30, mindestensVerschieden: 11,
    deute: (frage) => {
      const m = frage.match(/(\d+) cm lang, (\d+) cm breit und (\d+) cm hoch/);
      if (!m) return null;
      const [l, b, h] = m.slice(1).map(Number);
      const e = Math.sqrt(l * l + b * b + h * h);
      return {
        richtig: e,
        toleranz: 0.005,
        falsch: [
          [l + b + h, "addiert"],
          [l * l + b * b + h * h, "Quadratwurzel"],
          [Math.sqrt(l * l + b * b), "Bodendiagonale"],
          [Math.sqrt(l * l + h * h), "zwei der drei Kanten"],
        ],
        pruefe: (f, rueck) => {
          pruefe(Number.isInteger(e), `A4: √(${l}² + ${b}² + ${h}²) = ${e} ist nicht ganzzahlig — „${f}“`);
          // Die beiden letzten Fehler wären bei b = h dieselbe Zahl; die
          // Kantenliste ist eigens so geordnet, dass das nicht vorkommt.
          pruefe(b !== h, `A4: Breite und Höhe sind beide ${b} cm — zwei Fehler fallen zusammen — „${f}“`);
          pruefe(rueck.includes("Bodendiagonale"),
            `A4: die Musterlösung führt den Zwischenschritt nicht — „${f}“`);
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
    if (!dunkel) { await umkehrung(page); await aufgaben(page); }
    else await pruefeKontrast(page, bericht, "dunkel");
    await pruefeNotation(page, bericht, wo);
    for (const s of page.stoerungen) pruefe(false, `${wo}: ${s}`);
    await page.close();
  }
  await browser.close();
  bericht.abschluss();
})();
