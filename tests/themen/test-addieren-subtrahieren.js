// Fachliche Prüfung: Kapitel 1, Thema 4 „Brüche und Dezimalzahlen addieren
// und subtrahieren“.
//
// Der Kern ist der Hauptnenner und — bei gemischten Zahlen — das Entbündeln.
// Beides wird aus dem Aufgabentext heraus nachgerechnet. Zusätzlich wird der
// Fehler eingetragen, vor dem die Aufgabe warnt: Zähler und Nenner gemeinsam
// zu addieren.

"use strict";

const { neuerBericht } = require("../lib/pruefen");
const { starteBrowser, neueSeite, oeffne } = require("../lib/seite");
const { pruefeNotation } = require("../lib/notation");
const { pruefeKontrast } = require("../lib/kontrast");
const { pruefeAufgabe } = require("../lib/aufgaben");

const bericht = neuerBericht();
const { pruefe } = bericht;
const SEITE = "/mathematik/grundwissen-5-10/01-groessen-und-rechnen/04-addieren-subtrahieren/index.html";

function ggT(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { const h = a % b; a = b; b = h; } return a; }
function kgV(a, b) { return (a * b) / ggT(a, b); }
function kuerze(z, n) { const g = ggT(z, n); return [z / g, n / g]; }

// Brüche stehen als übereinandergesetzte Elemente; die ganze Zahl einer
// gemischten Zahl steht als Text unmittelbar davor.
async function bruchdaten(page, box) {
  return page.evaluate((sel) => {
    const p = document.querySelector(`${sel} .aufgabe-prompt`);
    const brueche = [...p.querySelectorAll(".bruch")].map((b) => {
      const vorher = b.previousSibling && b.previousSibling.nodeType === 3
        ? b.previousSibling.textContent.trim() : "";
      const m = vorher.match(/(\d+)$/);
      return {
        z: Number(b.querySelector(".z").textContent),
        n: Number(b.querySelector(".n").textContent),
        ganze: m ? Number(m[1]) : null,
      };
    });
    return { brueche, text: p.innerText.replace(/\s+/g, " ").trim() };
  }, box);
}

async function aufgaben(page) {
  // Aufgabe 1 — gleichnamig addieren. 7 Nenner mit je (n−2)(n−1)/2 Zählerpaaren,
  // zusammen 159 Kandidaten — aber nicht gleich wahrscheinlich: Der Nenner wird
  // zuerst gezogen, deshalb tragen die kleinen Nenner mit ihren wenigen Paaren
  // je ein Siebtel der Wahrscheinlichkeit. Mit der tatsächlichen Verteilung
  // p(n, z₁, z₂) = 1/(7 · (n−2) · (n−1−z₁)) ist bei 30 Zügen E = 24,1 und
  // σ = 2,03; die Schranke E − 3σ liegt bei 18.
  await pruefeAufgabe(page, bericht, {
    nr: 1, name: "A1 gleichnamig addieren", runden: 30, mindestensVerschieden: 18, liesRoh: bruchdaten,
    deute: (frage, roh) => {
      if (!roh || roh.brueche.length < 2) return null;
      const [a, b] = roh.brueche;
      if (a.n !== b.n) return null;
      const [zk, nk] = kuerze(a.z + b.z, a.n);
      return {
        richtig: `${zk}/${nk}`,
        falsch: [
          // Zähler und Nenner gemeinsam addiert — der Fehler, den das Thema behandelt.
          [`${a.z + b.z}/${a.n + b.n}`, "nur die Zähler"],
          // Wertgleich, aber ungekürzt.
          [a.z + b.z === zk ? null : `${a.z + b.z}/${a.n}`, "nicht vollständig gekürzt"],
        ],
      };
    },
  });

  // Aufgabe 2 — ungleichnamig addieren. 8·7 = 56 Nennerpaare mit jeweils
  // mehreren Zählerpaaren; die Streuung liegt weit über der Schranke.
  await pruefeAufgabe(page, bericht, {
    nr: 2, name: "A2 Hauptnenner", runden: 30, mindestensVerschieden: 20, liesRoh: bruchdaten,
    deute: (frage, roh) => {
      if (!roh || roh.brueche.length < 2) return null;
      const [a, b] = roh.brueche;
      if (a.n === b.n) return null;
      const hn = kgV(a.n, b.n);
      const summe = a.z * (hn / a.n) + b.z * (hn / b.n);
      const [zk, nk] = kuerze(summe, hn);
      return {
        richtig: `${zk}/${nk}`,
        falsch: [
          [`${a.z + b.z}/${a.n + b.n}`, null],
          [summe === zk ? null : `${summe}/${hn}`, "nicht vollständig gekürzt"],
        ],
        pruefe: (f, rueck) => {
          pruefe(rueck.includes(`kgV(${a.n}; ${b.n}) = ${hn}`) || rueck.includes(`kgV(${b.n}; ${a.n}) = ${hn}`),
            `A2: Musterlösung nennt den Hauptnenner ${hn} nicht — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 3 — gemischte Zahlen subtrahieren, mit Entbündeln.
  await pruefeAufgabe(page, bericht, {
    nr: 3, name: "A3 gemischte Zahlen", runden: 30, mindestensVerschieden: 20, liesRoh: bruchdaten,
    deute: (frage, roh) => {
      if (!roh || roh.brueche.length < 2) return null;
      const [a, b] = roh.brueche;
      if (a.ganze === null || b.ganze === null || a.n !== b.n) return null;
      const zErg = (a.ganze * a.n + a.z) - (b.ganze * b.n + b.z);
      const [zk, nk] = kuerze(zErg, a.n);
      return {
        richtig: `${zk}/${nk}`,
        falsch: [
          // Ganze und Bruchteile getrennt subtrahiert, ohne zu entbündeln —
          // der Bruchteil würde dabei negativ.
          [`${(a.ganze - b.ganze) * a.n + Math.abs(a.z - b.z)}/${a.n}`, null],
          [zErg === zk ? null : `${zErg}/${a.n}`, "kürze noch vollständig"],
        ],
      };
    },
  });

  // Aufgabe 4 — Sachaufgabe mit Bruch und Dezimalzahl.
  await pruefeAufgabe(page, bericht, {
    nr: 4, name: "A4 Bruch und Dezimalzahl", runden: 30, mindestensVerschieden: 25, liesRoh: bruchdaten,
    deute: (frage, roh) => {
      if (!roh || roh.brueche.length < 1) return null;
      const { z, n } = roh.brueche[0];
      const m = roh.text.match(/hat ([\d,]+) .*weitere ([\d,]+)/);
      if (!m) return null;
      const gesamt = Number(m[1].replace(",", "."));
      const zweite = Number(m[2].replace(",", "."));
      // In Zehnteln rechnen, damit 0,1 + 0,2 ≠ 0,3 nicht stört.
      const gesamtZ = Math.round(gesamt * 10), zweiteZ = Math.round(zweite * 10);
      const abZ = (gesamtZ / n) * z;
      const restZ = gesamtZ - abZ - zweiteZ;
      return {
        richtig: restZ / 10,
        toleranz: 0.001,
        falsch: [
          // Die zweite Menge vergessen.
          [(gesamtZ - abZ) / 10, null],
          // Den Anteil als Rest genommen statt ihn abzuziehen.
          [abZ / 10, null],
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
