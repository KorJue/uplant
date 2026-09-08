// Fachliche Prüfung: Kapitel 2, Thema 11 „Prismen und Zylinder“.
//
// Zwei Dinge tragen das Thema. Erstens der Zylinder als Grenzfall des Prismas:
// Je mehr Ecken das Vieleck hat, desto näher liegen Grundfläche und Umfang an
// denen des Kreises — überschreiten dürfen sie ihn nie. Zweitens die
// Unterscheidung von Volumen und Oberfläche, an der die Aufgaben ihre
// Fehlerhinweise aufhängen. Die Aufgaben suchen ihre Parameter eigens so, dass
// Lösung und alle Fehlerwerte paarweise verschieden bleiben; genau das wird
// hier bei jeder gewürfelten Fassung nachgerechnet.

"use strict";

const { neuerBericht } = require("../lib/pruefen");
const { starteBrowser, neueSeite, oeffne, setzeRegler, text } = require("../lib/seite");
const { pruefeNotation } = require("../lib/notation");
const { pruefeKontrast } = require("../lib/kontrast");
const { pruefeAufgabe } = require("../lib/aufgaben");

const bericht = neuerBericht();
const { pruefe } = bericht;
const SEITE = "/mathematik/grundwissen-5-10/02-geometrie/11-prismen-zylinder/index.html";

const de = (x, stellen = 4) => Number(x.toFixed(stellen)).toLocaleString("de-DE", { maximumFractionDigits: stellen });

// Alle Werte paarweise verschieden — die Bedingung, die die Generatoren mit
// ohneKollision() herstellen. Fällt ein Fehlerwert mit der Lösung zusammen,
// bekommt eine falsche Rechnung ein ✓; fallen zwei Fehlerwerte zusammen, ist
// die Diagnose mehrdeutig.
function paarweiseVerschieden(werte) {
  return werte.every((x, i) => werte.every((y, j) => i === j || Math.abs(x - y) > 1e-9));
}

// ── Der Zylinder als Grenzfall des Prismas ────────────────────────────────
// Das einbeschriebene regelmäßige n-Eck hat den Flächeninhalt
// ½ · n · r² · sin(360°/n) und den Umfang 2 · n · r · sin(180°/n).
async function grenzfall(page) {
  for (const r of [1, 3, 6]) {
    await setzeRegler(page, "zy-r", r);
    await setzeRegler(page, "zy-h", 5);

    let vorherG = 0, vorherU = 0;
    for (let n = 3; n <= 40; n++) {
      await setzeRegler(page, "zy-n", n);
      const G = 0.5 * n * r * r * Math.sin((2 * Math.PI) / n);
      const u = 2 * n * r * Math.sin(Math.PI / n);
      const Gkreis = Math.PI * r * r, ukreis = 2 * Math.PI * r;
      const wo = `n = ${n}, r = ${r}`;

      const bilanz = await text(page, "#zy-bilanz");
      pruefe(bilanz.includes(`${n}-Eck`), `Grenzfall: ${wo} — die Bilanz spricht nicht vom ${n}-Eck — „${bilanz}“`);
      pruefe(bilanz.includes(`G = ${de(G, 3)} cm²`),
        `Grenzfall: ${wo} — G = ${de(G, 3)} cm² steht nicht in der Bilanz — „${bilanz}“`);
      pruefe(bilanz.includes(`u = ${de(u, 3)} cm`),
        `Grenzfall: ${wo} — u = ${de(u, 3)} cm steht nicht in der Bilanz — „${bilanz}“`);
      pruefe(bilanz.includes(`${de(Gkreis - G, 3)} cm²`),
        `Grenzfall: ${wo} — der Unterschied ${de(Gkreis - G, 3)} cm² fehlt — „${bilanz}“`);

      // Das einbeschriebene Vieleck liegt ganz im Kreis: Es kann ihn weder an
      // Fläche noch an Umfang übertreffen.
      pruefe(G < Gkreis + 1e-9, `Grenzfall: ${wo} — das Vieleck hat mehr Fläche als der Kreis`);
      pruefe(u < ukreis + 1e-9, `Grenzfall: ${wo} — das Vieleck hat mehr Umfang als der Kreis`);
      // Und es nähert sich mit jeder Ecke — das ist die ganze Begründung
      // dafür, dass V = G · h auch für den Zylinder gilt.
      pruefe(G > vorherG - 1e-9, `Grenzfall: ${wo} — die Fläche wächst nicht (${G} nach ${vorherG})`);
      pruefe(u > vorherU - 1e-9, `Grenzfall: ${wo} — der Umfang wächst nicht (${u} nach ${vorherU})`);
      vorherG = G; vorherU = u;

      // Die Zeichnung muss so viele Seitenflächen haben, wie das Vieleck Ecken
      // hat — sonst zeigte sie einen anderen Körper als die Bilanz beschreibt.
      const mantel = await page.evaluate(() => document.querySelectorAll("#zy-mount .pz-mantel").length);
      pruefe(mantel === n, `Grenzfall: ${wo} — ${mantel} Mantelflächen gezeichnet statt ${n}`);
    }

    // Erst am oberen Ende darf der Text behaupten, es sei praktisch ein Zylinder.
    const satz = await text(page, "#zy-text");
    pruefe(satz.includes("praktisch ein Zylinder"),
      `Grenzfall: bei 40 Ecken fehlt die Aussage über den Zylinder — „${satz}“`);
    await setzeRegler(page, "zy-n", 6);
    const wenig = await text(page, "#zy-text");
    pruefe(!wenig.includes("praktisch ein Zylinder"),
      `Grenzfall: schon bei 6 Ecken wird ein Zylinder behauptet — „${wenig}“`);
  }
}

// ── Die Übungsaufgaben ─────────────────────────────────────────────────────
async function aufgaben(page) {
  // Aufgabe 1 — Prisma mit dreieckiger Grundfläche. 8 Grundseiten × 8 Höhen
  // des Dreiecks × bis zu 11 Körperhöhen; simuliert man den Generator, ist bei
  // 30 Zügen E = 29,4 und σ = 0,8, das Quantil 10⁻⁴ liegt bei 25 — Schranke 24.
  await pruefeAufgabe(page, bericht, {
    nr: 1, name: "A1 Prismenvolumen", runden: 30, mindestensVerschieden: 24,
    deute: (frage) => {
      const m = frage.match(/g = (\d+) cm.*?Höhe (\d+) cm.*?ist (\d+) cm hoch/);
      if (!m) return null;
      const [g, hD, h] = m.slice(1).map(Number);
      const G = (g * hD) / 2;
      return {
        richtig: G * h,
        toleranz: 0.005,
        falsch: [
          [g * hD * h, "Halbierung vergessen"],
          [G, "Grundfläche"],
          [g + hD + h, "addiert"],
        ],
        pruefe: (f) => {
          pruefe(Number.isInteger(G), `A1: G = ½ · ${g} · ${hD} = ${G} ist nicht ganzzahlig — „${f}“`);
          pruefe(paarweiseVerschieden([G * h, g * hD * h, G, g + hD + h]),
            `A1: Lösung und Fehlerwerte sind nicht paarweise verschieden — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 2 — Oberfläche eines Quaders. 118 zulässige Grundrisse × bis zu 11
  // Höhen; bei 30 Zügen E = 29,7 und σ = 0,6, Quantil 10⁻⁴ bei 26 — Schranke 25.
  await pruefeAufgabe(page, bericht, {
    nr: 2, name: "A2 Oberfläche", runden: 30, mindestensVerschieden: 25,
    deute: (frage) => {
      const m = frage.match(/(\d+) cm lang, (\d+) cm breit und (\d+) cm hoch/);
      if (!m) return null;
      const [a, b, h] = m.slice(1).map(Number);
      const G = a * b, u = 2 * (a + b), M = u * h;
      return {
        richtig: 2 * G + M,
        toleranz: 0.005,
        falsch: [
          [M, "nur der"],
          [G + M, "einmal"],
          [a * b * h, "Volumen"],
          // Im Mantel die Grundfläche statt des Umfangs benutzt.
          [2 * G + G * h, "Umfang"],
        ],
        pruefe: (f) => {
          pruefe(paarweiseVerschieden([2 * G + M, M, G + M, a * b * h, 2 * G + G * h]),
            `A2: Lösung und Fehlerwerte sind nicht paarweise verschieden — „${f}“`);
          // Bei G = u wäre der Mantelfehler für jede Höhe unsichtbar; solche
          // Grundrisse siebt der Generator schon vor der Höhenwahl aus.
          pruefe(G !== u, `A2: G = u = ${G} macht den Mantelfehler unsichtbar — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 3 — Zylinder, Volumen oder Mantel. 10 Radien × bis zu 13 Höhen ×
  // 2 Formen; bei 30 Zügen E = 28,3 und σ = 1,2, Quantil 10⁻⁴ bei 23.
  await pruefeAufgabe(page, bericht, {
    nr: 3, name: "A3 Zylinder", runden: 30, mindestensVerschieden: 22,
    deute: (frage) => {
      const m = frage.match(/r = (\d+) cm.*?h = (\d+) cm/);
      if (!m) return null;
      const [r, h] = m.slice(1).map(Number);
      const volumen = frage.includes("Volumen");
      const V = Math.PI * r * r * h, M = 2 * Math.PI * r * h;
      const O = 2 * Math.PI * r * r + M;
      return {
        richtig: volumen ? V : M,
        toleranz: 0.01,
        falsch: [
          // Die jeweils andere Größe berechnet.
          [volumen ? M : V, volumen ? "Mantelfläche" : "Volumen"],
          // Ein Faktor 2 zu viel bzw. zu wenig.
          [volumen ? 2 * Math.PI * r * r * h : Math.PI * r * h, volumen ? "Faktor 2 zu viel" : "fehlt"],
          [O, "gesamte Oberfläche"],
        ],
        pruefe: (f) => {
          // Bei r = 2 wären V und M dieselbe Zahl; die Aufgabe beginnt bei 3.
          pruefe(r >= 3, `A3: bei r = ${r} fallen Volumen und Mantel zusammen — „${f}“`);
          pruefe(paarweiseVerschieden([V, M, 2 * Math.PI * r * r * h, Math.PI * r * h, O]),
            `A3: Lösung und Fehlerwerte sind nicht paarweise verschieden — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 4 — Fassungsvermögen in Litern. 8 × 8 Grundrisse × bis zu 8 Höhen;
  // bei 30 Zügen E = 29,2 und σ = 0,9, Quantil 10⁻⁴ bei 24 — Schranke 23.
  await pruefeAufgabe(page, bericht, {
    nr: 4, name: "A4 Liter", runden: 30, mindestensVerschieden: 23,
    deute: (frage) => {
      const m = frage.match(/(\d+) cm lang, (\d+) cm breit und (\d+) cm hoch/);
      if (!m) return null;
      const [a, b, h] = m.slice(1).map(Number);
      const cm3 = a * b * h;
      return {
        richtig: cm3 / 1000,
        toleranz: 0.001,
        falsch: [
          [cm3, "Kubikzentimetern"],
          // Durch 100 statt durch 1000 geteilt.
          [cm3 / 100, "durch"],
          [cm3 / 10, "Längen"],
          [a + b + h, "addiert"],
        ],
        pruefe: (f, rueck) => {
          // Konstruktiv: alle Kanten sind Vielfache von 10 cm, damit die
          // Umrechnung glatt aufgeht und die Lösung ganzzahlig wird.
          pruefe(a % 10 === 0 && b % 10 === 0 && h % 10 === 0,
            `A4: die Kanten ${a}, ${b}, ${h} cm sind keine Vielfachen von 10 — „${f}“`);
          pruefe(Number.isInteger(cm3 / 1000), `A4: ${cm3} cm³ sind keine ganze Zahl Liter — „${f}“`);
          pruefe(paarweiseVerschieden([cm3 / 1000, cm3, cm3 / 100, cm3 / 10, a + b + h]),
            `A4: Lösung und Fehlerwerte sind nicht paarweise verschieden — „${f}“`);
          pruefe(rueck.includes("1000 cm³"),
            `A4: die Musterlösung nennt 1 Liter = 1000 cm³ nicht — „${f}“`);
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
    if (!dunkel) { await grenzfall(page); await aufgaben(page); }
    else await pruefeKontrast(page, bericht, "dunkel");
    await pruefeNotation(page, bericht, wo);
    for (const s of page.stoerungen) pruefe(false, `${wo}: ${s}`);
    await page.close();
  }
  await browser.close();
  bericht.abschluss();
})();
