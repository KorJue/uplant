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

  // Aufgabe 2 — der Grundwert gesucht. Gemessen mit tests/werkzeug-streuung.js: 188 verschiedene
  // in 200 Würfen, zurückgerechnet rund 1600 Kandidaten. Die Schranke ist das simulierte
  // 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für 0,8 · n gerechnet — 26.
  await pruefeAufgabe(page, bericht, {
    nr: 2, name: "A2 Grundwert", runden: 30, mindestensVerschieden: 26,
    deute: (frage) => {
      const m = frage.match(/(\d+(?:\.\d{3})*) %.*?(\d+(?:\.\d{3})*)\D/);
      if (!m) return null;
      const zahl = (t) => Number(t.replace(/\./g, ""));
      const p = zahl(m[1]), W = zahl(m[2]);
      const G = (W * 100) / p;
      pruefe(Number.isInteger(G), `A2: ${W} · 100 : ${p} = ${G} ist nicht ganzzahlig — „${frage}“`);
      pruefe(p > 0 && p < 100, `A2: der Prozentsatz ${p} % liegt nicht zwischen 0 und 100 — „${frage}“`);
      return {
        felder: [W / p, G],
        toleranz: 0.002,
        falschFelder: [
          [0, W / 100, "schon"],
          [0, W * p, "multipliziert"],
          [1, W, "Prozentwert"],
          [1, (W * 100) / (100 - p), "Rest"],
          [1, W * p, "Weg geht über 1 %"],
        ],
      };
    },
  });

  // Aufgabe 3 — Prozentsatz gesucht. Gemessen mit tests/werkzeug-streuung.js: 180 verschiedene
  // in 200 Würfen, zurückgerechnet also rund 928 Kandidaten. Die Schranke ist das simulierte
  // 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für 0,8 · n gerechnet — 25.
  await pruefeAufgabe(page, bericht, {
    nr: 3, name: "A3 Prozentsatz", runden: 30, mindestensVerschieden: 25,
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
          pruefe(Number.isInteger(p), `A3: der Prozentsatz ${p} % ist nicht ganzzahlig — „${f}“`);
          pruefe(W < G, `A3: der Prozentwert ${W} ist nicht kleiner als der Grundwert ${G} — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 4 — der Weg über den Faktor. Gemessen: 190 verschiedene in 200 Würfen,
  // zurückgerechnet rund 1900 Kandidaten. Schranke: simuliertes 10⁻⁴-Quantil bei 30 Zügen für
  // 0,8 · n — 26.
  let rauf = 0, runter = 0;
  await pruefeAufgabe(page, bericht, {
    nr: 4, name: "A4 Weg über den Faktor", runden: 30, mindestensVerschieden: 26,
    deute: (frage) => {
      // Die Sachtexte formulieren die Änderung verschieden („um … gesenkt“, „dazu kommen …“,
      // „gibt es … Rabatt“, „wächst um …“); gelesen werden deshalb einfach die beiden Zahlen.
      const z = zahlen(frage);
      if (z.length !== 2) return null;
      const [G, p] = z;
      // Ob aufgeschlagen oder abgezogen wird, steht im Sachtext — nicht in einer Kennziffer.
      const hoch = /Mehrwertsteuer|wächst/.test(frage);
      const tief = /gesenkt|Rabatt/.test(frage);
      pruefe(hoch !== tief, `A4: die Richtung der Änderung ist nicht eindeutig — „${frage}“`);
      if (hoch) rauf++; else runter++;
      const q = hoch ? 1 + p / 100 : 1 - p / 100;
      return {
        felder: [q, G * q],
        toleranz: 0.0002,
        falschFelder: [
          [0, p / 100, "Änderung"],
          [0, hoch ? 1 - p / 100 : 1 + p / 100, hoch ? "größer als 1" : "kleiner als 1"],
          [0, p, "Prozentsatz"],
          [1, (G * p) / 100, hoch ? "Zuschlag" : "Abzug"],
          [1, G * (hoch ? 1 - p / 100 : 1 + p / 100), hoch ? "abgezogen statt addiert" : "addiert statt abgezogen"],
          [1, G, "Ausgangswert"],
        ],
      };
    },
  });
  pruefe(rauf > 0 && runter > 0,
    `A4: in 30 Zügen ging es ${rauf}-mal hinauf und ${runter}-mal hinunter — beide Richtungen müssen vorkommen`);

  // Aufgabe 5 — Zinsen für eine Laufzeit unter einem Jahr. 667 Fassungen × 4
  // Kontexte; ≈ 0,16 Doppel bei 30 Zügen — Schranke 26.
  await pruefeAufgabe(page, bericht, {
    nr: 5, name: "A5 Monatszinsen", runden: 30, mindestensVerschieden: 26,
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
          pruefe(Number.isInteger(Z), `A5: die Zinsen ${Z} € sind nicht ganzzahlig — „${f}“`);
          pruefe(monate < 12, `A5: die Laufzeit ${monate} Monate ist nicht kürzer als ein Jahr — „${f}“`);
          // Der zweite Weg über die Zinstage muss auf dasselbe führen.
          pruefe(rueck.includes(`${de(monate * 30)}`) && rueck.includes("360"),
            `A5: die Musterlösung zeigt den Weg über die Zinstage nicht — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 6 — die Zinsformel rückwärts, mal nach p, mal nach K. Gemessen: 177 verschiedene in
  // 200 Würfen, zurückgerechnet rund 800 Kandidaten. Schranke: simuliertes 10⁻⁴-Quantil bei
  // 30 Zügen für 0,8 · n — 25.
  let nachSatz = 0, nachKapital = 0;
  await pruefeAufgabe(page, bericht, {
    nr: 6, name: "A6 Zinsformel rückwärts", runden: 30, mindestensVerschieden: 25,
    deute: (frage) => {
      const zahl = (t) => Number(t.replace(/\./g, "").replace(",", "."));
      // Die Beträge können ein Dezimalkomma haben („62,5 € Zinsen“); es muss mitgelesen werden.
      const satz = frage.match(/Kapital von ([\d.,]+) €.*?([\d.,]+) € Zinsen/);
      if (satz) {
        const K = zahl(satz[1]), Z = zahl(satz[2]);
        const p = (100 * Z) / K;
        pruefe(p > 0 && p <= 5, `A6: der Zinssatz ${p} % ist unrealistisch — „${frage}“`);
        nachSatz++;
        return {
          felder: [Z / K, p],
          toleranz: 0.002,
          falschFelder: [
            [0, K / Z, "verkehrt herum"],
            [0, p, "schon der Zinssatz"],
            [1, Z / K, "Dezimalzahl"],
            [1, Z, "Zinsbetrag"],
          ],
        };
      }
      const kap = frage.match(/Zinssatz von ([\d.,]+) %.*?([\d.,]+) € Zinsen/);
      if (!kap) return null;
      const p = zahl(kap[1]), Z = zahl(kap[2]);
      const K = (100 * Z) / p;
      pruefe(Number.isInteger(K), `A6: ${Z} · 100 : ${p} = ${K} ist kein glatter Betrag — „${frage}“`);
      nachKapital++;
      return {
        felder: [Z / p, K],
        toleranz: 0.02,
        falschFelder: [
          [0, Z * p, "multipliziert"],
          [1, Z / p, "für 1 %"],
          [1, Z * 100, "übergangen"],
        ],
      };
    },
  });
  pruefe(nachSatz > 0 && nachKapital > 0,
    `A6: in 30 Zügen wurde ${nachSatz}-mal nach dem Zinssatz und ${nachKapital}-mal nach dem Kapital gefragt — beides muss vorkommen`);

  // Aufgabe 7 — zwei prozentuale Änderungen, rückwärts. 240 Fassungen × 4
  // Kontexte; ≈ 0,45 Doppel bei 30 Zügen — Schranke 26.
  await pruefeAufgabe(page, bericht, {
    nr: 7, name: "A7 zwei Änderungen", runden: 30, mindestensVerschieden: 26,
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
          pruefe(Number.isInteger(A), `A7: der Anfangspreis ${A} € ist nicht ganzzahlig — „${f}“`);
          // Der Kern des Themas: Der Gesamtfaktor ist ein Produkt, keine Summe.
          pruefe(Math.abs(qGes - (100 + k) / 100) < 1e-9,
            `A7: q₁ · q₂ = ${qGes} passt nicht zur Gesamtänderung von ${k} % — „${f}“`);
          pruefe(Math.abs(p1 - p2) > 1e-12 || k !== 0,
            `A7: die beiden Änderungen heben sich auf — dann wäre nichts zu rechnen — „${f}“`);
          pruefe(rueck.includes("ergeben nicht"),
            `A7: die Musterlösung sagt nicht, dass ${p1} % und ${p2} % nicht verrechnet werden dürfen — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 8 — Zinseszins. Gemessen: 185 verschiedene in 200 Würfen, zurückgerechnet rund 1300
  // Kandidaten. Schranke: simuliertes 10⁻⁴-Quantil bei 30 Zügen für 0,8 · n — 26.
  await pruefeAufgabe(page, bericht, {
    nr: 8, name: "A8 Zinseszins", runden: 30, mindestensVerschieden: 26,
    deute: (frage) => {
      const m = frage.match(/([\d.]+) € werden für (\d+) Jahre zu ([\d,]+) %/);
      if (!m) return null;
      const K = Number(m[1].replace(/\./g, ""));
      const jahre = Number(m[2]);
      const p = Number(m[3].replace(",", "."));
      const q = 1 + p / 100;
      const end = K * Math.pow(q, jahre);
      const einfach = K + (K * p * jahre) / 100;
      pruefe(jahre >= 2, `A8: bei ${jahre} Jahr gäbe es keinen Zinseszins — „${frage}“`);
      // Der Kern der Aufgabe: Zinseszins bringt mehr als die einfache Verzinsung.
      pruefe(end > einfach, `A8: das Endkapital ${end} übertrifft die einfache Verzinsung ${einfach} nicht — „${frage}“`);
      return {
        felder: [q, end, end - K],
        toleranz: 0.01,
        falschFelder: [
          [0, p / 100, "auch das Kapital"],
          [0, 1 - p / 100, "größer"],
          [1, einfach, "Anfangskapital"],
          [1, K * q * jahre, "angewandt"],
          [1, K * q, "einem Jahr"],
          [2, end, "Endkapital"],
          [2, einfach - K, "ohne Zinseszins"],
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
