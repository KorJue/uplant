// Fachliche Prüfung: Kapitel 2, Thema 12 „Pyramiden, Kegel und Kugeln“.
//
// Der klassische Fehler dieses Themas ist die Verwechslung der drei Höhen:
// Körperhöhe h, Seitenhöhe hₛ und Seitenkante k. Für die Seitendreiecke wird
// immer hₛ gebraucht, nie h — und es gilt ausnahmslos h < hₛ < k. Das
// Höhen-Werkzeug muss diese Kette an jeder Reglerstellung einhalten, und in
// Aufgabe 2 und 3 wird eigens mit der falschen Höhe geantwortet.

"use strict";

const { neuerBericht } = require("../lib/pruefen");
const { starteBrowser, neueSeite, oeffne, setzeRegler, text } = require("../lib/seite");
const { pruefeNotation } = require("../lib/notation");
const { pruefeKontrast } = require("../lib/kontrast");
const { pruefeAufgabe } = require("../lib/aufgaben");

const bericht = neuerBericht();
const { pruefe } = bericht;
const SEITE = "/mathematik/grundwissen-5-10/02-geometrie/12-pyramiden-kegel-kugeln/index.html";

const de = (x, stellen = 4) => Number(x.toFixed(stellen)).toLocaleString("de-DE", { maximumFractionDigits: stellen });

function paarweiseVerschieden(werte, eps = 1e-9) {
  return werte.every((x, i) => werte.every((y, j) => i === j || Math.abs(x - y) > eps));
}

// ── Die drei Höhen ────────────────────────────────────────────────────────
async function hoehen(page) {
  const faelle = [];
  for (let a = 2; a <= 12; a++) faelle.push([a, 4]);
  for (const h of [2, 3, 7, 12]) faelle.push([6, h]);
  faelle.push([6, 8]);   // hₛ = 5 · … : ganzzahlige Seitenhöhe, „=“ statt „≈“
  faelle.push([8, 3]);   // hₛ = 5 exakt

  for (const was of ["hs", "k"]) {
    await page.evaluate((w) => {
      const s = document.getElementById("hh-was");
      s.value = w;
      s.dispatchEvent(new Event("change", { bubbles: true }));
    }, was);

    for (const [a, h] of faelle) {
      await setzeRegler(page, "hh-a", a);
      await setzeRegler(page, "hh-h", h);
      const wo = `a = ${a}, h = ${h}, ${was}`;

      const hs = Math.sqrt(h * h + (a / 2) * (a / 2));
      const d = a * Math.SQRT2;
      const k = Math.sqrt(h * h + (d / 2) * (d / 2));

      // Die Kette, um die es geht.
      pruefe(h < hs && hs < k, `Höhen: ${wo} — h < hₛ < k ist verletzt (${h}, ${hs}, ${k})`);

      const bilanz = await text(page, "#hh-bilanz");
      if (was === "hs") {
        pruefe(bilanz.includes(`hₛ² = h² + (a : 2)² = ${de(h * h)} + ${de((a / 2) * (a / 2), 2)} = ${de(h * h + (a / 2) * (a / 2), 2)}`),
          `Höhen: ${wo} — die Pythagoras-Zeile für hₛ stimmt nicht — „${bilanz}“`);
        pruefe(bilanz.includes(`${de(hs, 3)} cm`),
          `Höhen: ${wo} — hₛ = ${de(hs, 3)} cm fehlt — „${bilanz}“`);
        // Die Oberfläche benutzt hₛ, nicht h.
        const O = a * a + 2 * a * hs;
        pruefe(bilanz.includes(`${de(O, 2)} cm²`),
          `Höhen: ${wo} — die Oberfläche ${de(O, 2)} cm² fehlt — „${bilanz}“`);
      } else {
        pruefe(bilanz.includes(`d = a · √2 = ${de(a)} · √2 ≈ ${de(d, 3)} cm`),
          `Höhen: ${wo} — die Diagonale d = ${de(d, 3)} cm fehlt — „${bilanz}“`);
        pruefe(bilanz.includes(`${de(k, 3)} cm`),
          `Höhen: ${wo} — k = ${de(k, 3)} cm fehlt — „${bilanz}“`);
      }

      // = oder ≈ — die Bilanz darf eine Näherung nicht als Gleichheit ausgeben.
      const wert = was === "hs" ? hs : k;
      const zeichen = Number.isInteger(wert) ? "=" : "≈";
      pruefe(bilanz.includes(`${zeichen} ${de(wert, 3)} cm`),
        `Höhen: ${wo} — ${wert} steht nicht mit „${zeichen}“ — „${bilanz}“`);

      const satz = await text(page, "#hh-text");
      if (was === "k") {
        pruefe(satz.includes(`${de(h)} < ${de(hs, 2)} < ${de(k, 2)}`),
          `Höhen: ${wo} — die Kette h < hₛ < k steht nicht im Text — „${satz}“`);
      } else {
        pruefe(satz.includes("nie h"), `Höhen: ${wo} — der Text warnt nicht vor h — „${satz}“`);
      }
    }
  }
}

// ── Die Übungsaufgaben ─────────────────────────────────────────────────────
async function aufgaben(page) {
  // Aufgabe 1 — Pyramidenvolumen. 11 Kantenlängen × je die Höhen, bei denen
  // a² · h durch 3 teilbar ist; simuliert man den Generator, ist bei 30 Zügen
  // E = 23,2 und σ = 1,9, das Quantil 10⁻⁴ liegt bei 16 — Schranke 15.
  await pruefeAufgabe(page, bericht, {
    nr: 1, name: "A1 Pyramidenvolumen", runden: 30, mindestensVerschieden: 15,
    deute: (frage) => {
      const m = frage.match(/a = (\d+) cm.*?h = (\d+) cm/);
      if (!m) return null;
      const [a, h] = m.slice(1).map(Number);
      const G = a * a, V = (G * h) / 3;
      return {
        richtig: V,
        toleranz: 0.005,
        falsch: [
          [G * h, "Prismas"],
          [G, "ist erst die"],
          [(G * h) / 2, "halbiert"],
          [(a * h) / 3, "nicht die Kantenlänge"],
        ],
        pruefe: (f, rueck) => {
          // Konstruktiv: h wird so gewählt, dass a² · h durch 3 teilbar ist.
          pruefe(Number.isInteger(V), `A1: V = ${V} cm³ ist nicht ganzzahlig — „${f}“`);
          pruefe(paarweiseVerschieden([V, G * h, G, (G * h) / 2, (a * h) / 3]),
            `A1: Lösung und Fehlerwerte sind nicht paarweise verschieden — „${f}“`);
          // Die Pyramide fasst genau ein Drittel des Prismas — der Kern des Themas.
          pruefe(rueck.includes(`${de(G * h)} cm³`),
            `A1: die Musterlösung vergleicht nicht mit dem Prisma (${G * h} cm³) — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 2 — Oberfläche einer quadratischen Pyramide. Die Maße stammen aus
  // pythagoreischen Tripeln, von denen der Generator die kollisionsfreien
  // auswählt; es bleiben 6 Fassungen. Bei 30 Zügen E = 6,0 und σ = 0,2, der
  // beobachtete Kleinstwert liegt bei 4 — Schranke 4.
  await pruefeAufgabe(page, bericht, {
    nr: 2, name: "A2 Pyramidenoberfläche", runden: 30, mindestensVerschieden: 4,
    deute: (frage) => {
      const m = frage.match(/a = (\d+) cm.*?h = (\d+) cm/);
      if (!m) return null;
      const [a, h] = m.slice(1).map(Number);
      const hs = Math.sqrt(h * h + (a / 2) * (a / 2));
      const G = a * a, M = 2 * a * hs, O = G + M;
      return {
        richtig: O,
        toleranz: 0.005,
        falsch: [
          // Mit der Körperhöhe statt der Seitenhöhe gerechnet.
          [G + 2 * a * h, "Körperhöhe"],
          [M, "nur der"],
          [2 * G + M, "doppelt"],
          [(G * h) / 3, "Volumen"],
        ],
        pruefe: (f, rueck) => {
          // Konstruktiv über ein Tripel: hₛ muss ganzzahlig sein.
          pruefe(Number.isInteger(hs), `A2: hₛ = ${hs} ist nicht ganzzahlig — „${f}“`);
          pruefe(hs > h, `A2: die Seitenhöhe ${hs} ist nicht länger als die Körperhöhe ${h} — „${f}“`);
          pruefe(paarweiseVerschieden([O, G + 2 * a * h, M, 2 * G + M, (G * h) / 3], 0.05),
            `A2: Lösung und Fehlerwerte sind nicht paarweise verschieden — „${f}“`);
          // Eine Pyramide hat keine Deckfläche: O = 1 · G + M.
          pruefe(rueck.includes(`O = G + M = ${de(G)} + ${de(M)}`),
            `A2: die Musterlösung zeigt O = G + M nicht — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 3 — Mantelfläche eines Kegels, ebenfalls aus den kollisionsfreien
  // Tripeln; hier bleiben 5 Fassungen (E = 5,0, σ = 0,1) — Schranke 4.
  await pruefeAufgabe(page, bericht, {
    nr: 3, name: "A3 Kegelmantel", runden: 30, mindestensVerschieden: 4,
    deute: (frage) => {
      const m = frage.match(/r = (\d+) cm.*?h = (\d+) cm/);
      if (!m) return null;
      const [r, h] = m.slice(1).map(Number);
      const s = Math.sqrt(r * r + h * h);
      const M = Math.PI * r * s;
      const V = (Math.PI * r * r * h) / 3;
      const O = Math.PI * r * r + M;
      return {
        richtig: M,
        toleranz: 0.01,
        falsch: [
          // Die Höhe statt der Mantellinie eingesetzt.
          [Math.PI * r * h, "Höhe h"],
          [O, "gesamte Oberfläche"],
          [V, "Volumen"],
          // Die 2 des Zylindermantels mitgeschleppt.
          [2 * M, "2 zu viel"],
        ],
        pruefe: (f) => {
          pruefe(Number.isInteger(s), `A3: s = √(${r}² + ${h}²) = ${s} ist nicht ganzzahlig — „${f}“`);
          pruefe(s > h, `A3: die Mantellinie ${s} ist nicht länger als die Höhe ${h} — „${f}“`);
          pruefe(paarweiseVerschieden([M, Math.PI * r * h, O, V, 2 * M], 0.05),
            `A3: Lösung und Fehlerwerte sind nicht paarweise verschieden — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 4 — zusammengesetzter Körper, Zylinder mit Halbkugel oder Kegel.
  // 2 Formen × 7 Radien × bis zu 10 Höhen; bei 30 Zügen E = 27,1 und σ = 1,5,
  // das Quantil 10⁻⁴ liegt bei 21 — Schranke 20.
  await pruefeAufgabe(page, bericht, {
    nr: 4, name: "A4 zusammengesetzter Körper", runden: 30, mindestensVerschieden: 20,
    deute: (frage) => {
      const m = frage.match(/r = (\d+) m und der Höhe (\d+) m/);
      if (!m) return null;
      const [r, h] = m.slice(1).map(Number);
      const halbkugel = frage.includes("Halbkugel");
      const vZylinder = Math.PI * r * r * h;
      // Beim Kegel ist die Aufsatzhöhe gleich r.
      const vAufsatz = halbkugel ? (2 / 3) * Math.PI * r ** 3 : (Math.PI * r ** 3) / 3;
      const vGanz = halbkugel ? (4 / 3) * Math.PI * r ** 3 : Math.PI * r ** 3;
      return {
        richtig: vZylinder + vAufsatz,
        toleranz: 0.01,
        falsch: [
          [vZylinder, "nur der"],
          [vAufsatz, "nur der Aufsatz"],
          // Ganze Kugel statt halber bzw. das Drittel des Kegels vergessen.
          [vZylinder + vGanz, halbkugel ? "ganze Kugel" : "Drittel"],
        ],
        pruefe: (f, rueck) => {
          pruefe(paarweiseVerschieden([vZylinder + vAufsatz, vZylinder, vAufsatz, vZylinder + vGanz], 0.05),
            `A4: Lösung und Fehlerwerte sind nicht paarweise verschieden — „${f}“`);
          // Der Aufsatz ist genau die Hälfte des ganzen Körpers, um den es geht.
          pruefe(Math.abs(vAufsatz * 2 - vGanz) < 1e-9 || !halbkugel,
            `A4: die Halbkugel ist nicht die Hälfte der Kugel — „${f}“`);
          pruefe(rueck.includes("V = V₁ + V₂"),
            `A4: die Musterlösung addiert die Teilvolumina nicht sichtbar — „${f}“`);
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
    if (!dunkel) { await hoehen(page); await aufgaben(page); }
    else await pruefeKontrast(page, bericht, "dunkel");
    await pruefeNotation(page, bericht, wo);
    for (const s of page.stoerungen) pruefe(false, `${wo}: ${s}`);
    await page.close();
  }
  await browser.close();
  bericht.abschluss();
})();
