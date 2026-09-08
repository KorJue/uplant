// Fachliche Prüfung: Kapitel 4, Thema 2 „Prozent- und Zinsrechnung“.
//
// Drei Größen, drei Formeln — und ein Fehler, der sich durch das ganze Thema
// zieht: Prozentangaben beziehen sich auf verschiedene Grundwerte und dürfen
// deshalb nicht addiert oder subtrahiert werden. In Aufgabe 4 wird genau das
// als Antwort eingetragen: 20 % rauf und 20 % runter ergeben nicht 0 %.

"use strict";

const { neuerBericht } = require("../lib/pruefen");
const { starteBrowser, neueSeite, oeffne } = require("../lib/seite");
const { pruefeNotation } = require("../lib/notation");
const { pruefeKontrast } = require("../lib/kontrast");
const { pruefeAufgabe } = require("../lib/aufgaben");

const bericht = neuerBericht();
const { pruefe } = bericht;
const SEITE = "/mathematik/grundwissen-5-10/04-gleichungen-zuordnungen-funktionen/02-prozent-und-zinsrechnung/index.html";

const de = (x, stellen = 4) => Number(x.toFixed(stellen)).toLocaleString("de-DE", { maximumFractionDigits: stellen });
// Zahlen des Aufgabentextes: Tausenderpunkt weg, Komma zu Punkt.
const zahlen = (s) => (s.replace(/\.(?=\d{3}\b)/g, "").match(/\d+(?:,\d+)?/g) || []).map((z) => Number(z.replace(",", ".")));

async function aufgaben(page) {
  // Aufgabe 1 — Prozentwert gesucht. 651 zulässige Paare aus Grundwert und
  // Prozentsatz × 4 Kontexte; bei 30 Zügen sind 435 : 2604 ≈ 0,17 Doppel zu
  // erwarten — Schranke 26.
  await pruefeAufgabe(page, bericht, {
    nr: 1, name: "A1 Prozentwert", runden: 30, mindestensVerschieden: 26,
    deute: (frage) => {
      const z = zahlen(frage);
      if (z.length < 2) return null;
      const [G, p] = z;
      const W = (G * p) / 100;
      return {
        richtig: W,
        toleranz: 0.005,
        falsch: [
          // Der Rest statt des Anteils.
          [G - W, "Rest"],
          // Durch p statt durch 100 geteilt.
          [G / p, "durch 100"],
          // Die Grundwertformel benutzt, obwohl G bekannt ist.
          [(G * 100) / p, "Grundwert"],
        ],
        pruefe: (f, rueck) => {
          pruefe(G % 100 === 0, `A1: der Grundwert ${G} ist kein Vielfaches von 100 — „${f}“`);
          pruefe(Number.isInteger(W), `A1: der Prozentwert ${W} ist nicht ganzzahlig — „${f}“`);
          // Die Probe muss zurück auf den Prozentsatz führen.
          pruefe(rueck.includes(`${de(p)} : 100`),
            `A1: die Probe führt nicht auf ${p} : 100 zurück — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 2 — Prozentsatz gesucht. 237 Paare × 4 Kontexte; ≈ 0,46 Doppel
  // bei 30 Zügen — Schranke 26.
  await pruefeAufgabe(page, bericht, {
    nr: 2, name: "A2 Prozentsatz", runden: 30, mindestensVerschieden: 26,
    deute: (frage) => {
      const z = zahlen(frage);
      if (z.length < 2) return null;
      const [G, W] = z;
      const p = (W * 100) / G;
      return {
        richtig: p,
        toleranz: 0.005,
        falsch: [
          [100 - p, "Gegenanteil"],
          // Den Bruch verkehrt herum gebildet.
          [(G * 100) / W, "verkehrt herum"],
          // Die Multiplikation mit 100 vergessen.
          [W / G, "Dezimalzahl"],
          // Differenz statt Anteil.
          [G - W, "Differenz"],
        ],
        pruefe: (f) => {
          pruefe(Number.isInteger(p), `A2: der Prozentsatz ${p} % ist nicht ganzzahlig — „${f}“`);
          pruefe(W < G, `A2: der Prozentwert ${W} ist nicht kleiner als der Grundwert ${G} — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 3 — Zinsen für eine Laufzeit unter einem Jahr. 667 Fassungen × 4
  // Kontexte; ≈ 0,16 Doppel bei 30 Zügen — Schranke 26.
  await pruefeAufgabe(page, bericht, {
    nr: 3, name: "A3 Monatszinsen", runden: 30, mindestensVerschieden: 26,
    deute: (frage) => {
      const m = frage.match(/([\d.]+) €[\s\S]*?([\d,]+) % pro Jahr[\s\S]*?(\d+) Monate/);
      if (!m) return null;
      const K = Number(m[1].replace(/\./g, ""));
      const p = Number(m[2].replace(",", "."));
      const monate = Number(m[3]);
      const zJahr = (K * p) / 100;
      const Z = (zJahr * monate) / 12;
      return {
        richtig: Z,
        toleranz: 0.005,
        falsch: [
          // Der Jahreszins, ohne den Zeitanteil.
          [zJahr, "ganzes"],
          // Mit den Monaten multipliziert, aber nicht durch 12 geteilt.
          [zJahr * monate, "nicht durch 12"],
          // Die Monatszahl an die Stelle des Zinssatzes gesetzt.
          [(K * monate) / 100, "Stelle des Zinssatzes"],
        ],
        pruefe: (f, rueck) => {
          pruefe(Number.isInteger(Z), `A3: die Zinsen ${Z} € sind nicht ganzzahlig — „${f}“`);
          pruefe(monate < 12, `A3: die Laufzeit ${monate} Monate ist nicht kürzer als ein Jahr — „${f}“`);
          // Der zweite Weg über die Zinstage muss auf dasselbe führen.
          pruefe(rueck.includes(`${de(monate * 30)}`) && rueck.includes("360"),
            `A3: die Musterlösung zeigt den Weg über die Zinstage nicht — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 4 — zwei prozentuale Änderungen, rückwärts. 240 Fassungen × 4
  // Kontexte; ≈ 0,45 Doppel bei 30 Zügen — Schranke 26.
  await pruefeAufgabe(page, bericht, {
    nr: 4, name: "A4 zwei Änderungen", runden: 30, mindestensVerschieden: 26,
    deute: (frage) => {
      const m = frage.match(/steigt um (\d+) %[\s\S]*?sinkt um (\d+) %[\s\S]*?kostet danach ([\d.]+) €/);
      if (!m) return null;
      const p1 = Number(m[1]), p2 = Number(m[2]);
      const E = Number(m[3].replace(/\./g, ""));
      const q1 = (100 + p1) / 100, q2 = (100 - p2) / 100;
      const qGes = q1 * q2;
      const k = p1 - p2 - (p1 * p2) / 100;
      // Ganzzahlig gerechnet: E : (q₁ · q₂) über die Faktoren zu teilen
      // ergäbe 2400,0000000000005 und ließe die Ganzzahligkeit falsch
      // aussehen. Der Generator wählt A ganzzahlig, also muss es hier auch
      // exakt herauskommen.
      const A = (E * 10000) / ((100 + p1) * (100 - p2));
      return {
        richtig: A,
        toleranz: 0.005,
        falsch: [
          // Die Prozentsätze verrechnet statt die Faktoren multipliziert.
          [(E * 100) / (100 + p1 - p2), "nicht addieren"],
          // Die Gesamtänderung auf den Endpreis statt auf den Anfangspreis bezogen.
          [(E * (100 - k)) / 100, "Endpreis"],
          [(E * 100) / (100 + p1), "nur die erste"],
          [(E * 100) / (100 - p2), "nur die zweite"],
          [E, "nach"],
        ],
        pruefe: (f, rueck) => {
          pruefe(Number.isInteger(A), `A4: der Anfangspreis ${A} € ist nicht ganzzahlig — „${f}“`);
          // Der Kern des Themas: Der Gesamtfaktor ist ein Produkt, keine Summe.
          pruefe(Math.abs(qGes - (100 + k) / 100) < 1e-9,
            `A4: q₁ · q₂ = ${qGes} passt nicht zur Gesamtänderung von ${k} % — „${f}“`);
          pruefe(Math.abs(p1 - p2) > 1e-12 || k !== 0,
            `A4: die beiden Änderungen heben sich auf — dann wäre nichts zu rechnen — „${f}“`);
          pruefe(rueck.includes("ergeben nicht"),
            `A4: die Musterlösung sagt nicht, dass ${p1} % und ${p2} % nicht verrechnet werden dürfen — „${f}“`);
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
