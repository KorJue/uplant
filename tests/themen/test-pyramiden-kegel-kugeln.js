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

  // Aufgabe 2 — die Kugel: Volumen oder Oberfläche. Gemessen mit tests/werkzeug-streuung.js: 35
  // verschiedene in 200 Würfen. Die Schranke ist das simulierte 10⁻⁴-Quantil bei 30 Zügen,
  // vorsichtshalber für 0,8 · n gerechnet — 12.
  let kugelV = 0, kugelO = 0;
  await pruefeAufgabe(page, bericht, {
    nr: 2, name: "A2 Kugel", runden: 30, mindestensVerschieden: 12,
    deute: (frage) => {
      const m = frage.match(/r = (\d+) cm/);
      if (!m) return null;
      const r = Number(m[1]);
      const volumen = frage.includes("Volumen");
      const V = (4 / 3) * Math.PI * r * r * r;
      const O = 4 * Math.PI * r * r;
      if (volumen) kugelV++; else kugelO++;
      return {
        richtig: volumen ? V : O,
        toleranz: 0.01,
        falsch: volumen
          ? [
              [O, "Oberfläche"],
              [(4 / 3) * Math.PI * r * r, "r²"],
              [Math.PI * r * r * r, "⁴⁄₃"],
            ]
          : [
              [V, "Volumen"],
              [Math.PI * r * r, "viermal"],
              [2 * Math.PI * r * r, "Halb"],
              [4 * Math.PI * r * r * r, "r³"],
            ],
      };
    },
  });
  pruefe(kugelV > 0 && kugelO > 0,
    `A2: in 30 Zügen kam ${kugelV}-mal das Volumen und ${kugelO}-mal die Oberfläche — beide Fassungen müssen vorkommen`);

  // Aufgabe 3 — Oberfläche einer quadratischen Pyramide. Gemessen mit
  // tests/werkzeug-streuung.js: 6 verschiedene in 200 Würfen, zurückgerechnet also rund 6
  // Kandidaten. Die Schranke ist das simulierte 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für
  // 0,8 · n gerechnet — 3.
  await pruefeAufgabe(page, bericht, {
    nr: 3, name: "A3 Pyramidenoberfläche", runden: 30, mindestensVerschieden: 3,
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
          pruefe(Number.isInteger(hs), `A3: hₛ = ${hs} ist nicht ganzzahlig — „${f}“`);
          pruefe(hs > h, `A3: die Seitenhöhe ${hs} ist nicht länger als die Körperhöhe ${h} — „${f}“`);
          pruefe(paarweiseVerschieden([O, G + 2 * a * h, M, 2 * G + M, (G * h) / 3], 0.05),
            `A3: Lösung und Fehlerwerte sind nicht paarweise verschieden — „${f}“`);
          // Eine Pyramide hat keine Deckfläche: O = 1 · G + M.
          pruefe(rueck.includes(`O = G + M = ${de(G)} + ${de(M)}`),
            `A3: die Musterlösung zeigt O = G + M nicht — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 4 — Volumen eines Kegels in zwei Schritten. Gemessen: 116 verschiedene in 200 Würfen,
  // zurückgerechnet rund 165 Kandidaten. Schranke: simuliertes 10⁻⁴-Quantil bei 30 Zügen für
  // 0,8 · n — 21.
  await pruefeAufgabe(page, bericht, {
    nr: 4, name: "A4 Kegelvolumen", runden: 30, mindestensVerschieden: 21,
    deute: (frage) => {
      const m = frage.match(/r = (\d+) cm und die Höhe h = (\d+) cm/);
      if (!m) return null;
      const r = Number(m[1]), h = Number(m[2]);
      const G = Math.PI * r * r;
      return {
        felder: [G, (G * h) / 3],
        toleranz: 0.01,
        falschFelder: [
          [0, 2 * Math.PI * r, "Umfang"],
          [0, 2 * Math.PI * r * r, "Faktor 2"],
          [1, G * h, "Zylinders"],
          [1, (G * h) / 2, "halbiert"],
          [1, (Math.PI * r * h) / 3, "ganze Kreisfläche"],
        ],
      };
    },
  });

  // Aufgabe 5 — Mantelfläche eines Kegels, ebenfalls aus den kollisionsfreien Tripeln; hier
  // bleiben 5 Fassungen (E = 5,0, σ = 0,1) — Schranke 4. Gemessen mit
  // tests/werkzeug-streuung.js: 5 verschiedene in 200 Würfen, zurückgerechnet also rund 5
  // Kandidaten. Die Schranke ist das simulierte 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für
  // 0,8 · n gerechnet — 3.
  await pruefeAufgabe(page, bericht, {
    nr: 5, name: "A5 Kegelmantel", runden: 30, mindestensVerschieden: 3,
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
          pruefe(Number.isInteger(s), `A5: s = √(${r}² + ${h}²) = ${s} ist nicht ganzzahlig — „${f}“`);
          pruefe(s > h, `A5: die Mantellinie ${s} ist nicht länger als die Höhe ${h} — „${f}“`);
          pruefe(paarweiseVerschieden([M, Math.PI * r * h, O, V, 2 * M], 0.05),
            `A5: Lösung und Fehlerwerte sind nicht paarweise verschieden — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 6 — die Kugel rückwärts, über die Oberfläche oder über das Volumen. Gemessen: 31
  // verschiedene in 200 Würfen. Die Ziehung ist nicht gleichverteilt (40 % Volumenfassung mit
  // 8 Radien, sonst 23 Radien); nachgebildet ergibt sich E = 18,9 und ein 10⁻⁴-Quantil bei
  // 30 Zügen von 12.
  const rueckwege = new Set();
  await pruefeAufgabe(page, bericht, {
    nr: 6, name: "A6 Kugel rückwärts", runden: 30, mindestensVerschieden: 12,
    deute: (frage) => {
      const mo = frage.match(/Oberfläche O = ([\d.]+) · π cm²/);
      if (mo) {
        // Die Seite setzt Tausenderpunkte; sie müssen vor dem Umwandeln weg.
        const koeff = Number(mo[1].replace(/\./g, ""));
        const r = Math.sqrt(koeff / 4);
        pruefe(Number.isInteger(r), `A6: √(${koeff} : 4) = ${r} ist nicht ganzzahlig — „${frage}“`);
        rueckwege.add("O");
        return {
          felder: [r * r, r, (4 * r * r * r) / 3],
          toleranz: 0.002,
          falschFelder: [
            [0, koeff, "ganze Zahl vor π"],
            [0, koeff / 2, "durch"],
            [1, r * r, "Quadratwurzel"],
            [2, 4 * r * r * r, "⅓"],
            [2, (4 / 3) * r * r, "r³"],
          ],
        };
      }
      const mv = frage.match(/Volumen V = ([\d.]+) · π cm³/);
      if (!mv) return null;
      const vKoeff = Number(mv[1].replace(/\./g, ""));
      const r3 = (vKoeff * 3) / 4;
      const r = Math.round(Math.cbrt(r3));
      pruefe(r * r * r === r3, `A6: ${r3} ist keine Kubikzahl — „${frage}“`);
      rueckwege.add("V");
      return {
        felder: [r3, r, 4 * r * r],
        toleranz: 0.002,
        falschFelder: [
          [0, vKoeff, "ganze Zahl vor π"],
          [0, (4 * vKoeff) / 3, "⁴⁄₃ multipliziert"],
          [1, r3, "dritte Wurzel"],
          [1, r * r, "Quadratwurzel"],
          [2, r * r, "Faktor"],
          [2, 4 * r * r * r, "r²"],
        ],
      };
    },
  });
  pruefe(rueckwege.size === 2,
    "A6: in 30 Zügen kam nur einer der beiden Rückwege (über O bzw. über V) vor");

  // Aufgabe 7 — zusammengesetzter Körper, Zylinder mit Halbkugel oder Kegel.
  // 2 Formen × 7 Radien × bis zu 10 Höhen; bei 30 Zügen E = 27,1 und σ = 1,5,
  // das Quantil 10⁻⁴ liegt bei 21 — Schranke 20.
  await pruefeAufgabe(page, bericht, {
    nr: 7, name: "A7 zusammengesetzter Körper", runden: 30, mindestensVerschieden: 20,
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
            `A7: Lösung und Fehlerwerte sind nicht paarweise verschieden — „${f}“`);
          // Der Aufsatz ist genau die Hälfte des ganzen Körpers, um den es geht.
          pruefe(Math.abs(vAufsatz * 2 - vGanz) < 1e-9 || !halbkugel,
            `A7: die Halbkugel ist nicht die Hälfte der Kugel — „${f}“`);
          pruefe(rueck.includes("V = V₁ + V₂"),
            `A7: die Musterlösung addiert die Teilvolumina nicht sichtbar — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 8 — die Oberfläche desselben zusammengesetzten Körpers. Anders als beim Volumen wird
  // hier NICHT alles addiert: Der Schnittkreis zwischen Zylinder und Halbkugel liegt im Inneren.
  // Gemessen: 132 verschiedene in 200 Würfen, zurückgerechnet rund 222 Kandidaten. Schranke:
  // simuliertes 10⁻⁴-Quantil bei 30 Zügen für 0,8 · n — 22.
  let mitBoden = 0, ohneBoden = 0;
  await pruefeAufgabe(page, bericht, {
    nr: 8, name: "A8 Silo streichen", runden: 30, mindestensVerschieden: 22,
    deute: (frage) => {
      const m = frage.match(/r = (\d+) m und der Höhe (\d+) m/);
      if (!m) return null;
      const r = Number(m[1]), h = Number(m[2]);
      const boden = /vollständig.*gestrichen/.test(frage);
      pruefe(boden !== /Bodenfläche wird nicht/.test(frage),
        `A8: die Angabe zur Bodenfläche ist widersprüchlich — „${frage}“`);
      // Bei r = 6 fielen „ganze Kugel“ (4πr²) und „Volumen der Halbkugel“ (⅔πr³) auf dieselbe
      // Zahl; der Generator schließt diesen Radius aus.
      pruefe(r !== 6, `A8: bei r = 6 m fallen zwei Fehlerwerte zusammen — „${frage}“`);
      const mantel = 2 * Math.PI * r * h;
      const kappe = 2 * Math.PI * r * r;
      const kreis = Math.PI * r * r;
      const O = mantel + kappe + (boden ? kreis : 0);
      if (boden) mitBoden++; else ohneBoden++;
      return {
        felder: [mantel, kappe, O],
        toleranz: 0.01,
        falschFelder: [
          [0, Math.PI * r * h, "Faktor"],
          [0, Math.PI * r * r * h, "Volumen"],
          [1, 4 * Math.PI * r * r, "ganze"],
          [1, kreis, "Schnittkreises"],
          [1, (2 / 3) * Math.PI * r * r * r, "Volumen"],
          // Eine Kreisfläche zu viel: einmal der Schnittkreis, einmal der Boden.
          [2, O + kreis, boden ? "zu viel" : "nicht"],
          [2, mantel, "nur der"],
        ],
      };
    },
  });
  pruefe(mitBoden > 0 && ohneBoden > 0,
    `A8: in 30 Zügen wurde ${mitBoden}-mal mit und ${ohneBoden}-mal ohne Boden gestrichen — beide Fassungen müssen vorkommen`);
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
