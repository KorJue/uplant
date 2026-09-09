// Fachliche Prüfung: Kapitel 3, Thema 2 „Zufall und Wahrscheinlichkeit“.
//
// Zwei Grenzen tragen das Thema. Erstens: Im Nenner der Laplace-Formel steht
// die Gesamtzahl, nie die Zahl der anderen — sonst käme eine Wahrscheinlichkeit
// über 1 heraus. Zweitens: Abgezählt werden darf nur, wenn die Ergebnisse
// wirklich gleich wahrscheinlich sind. Beides wird an den Werkzeugen und an
// den Aufgaben geprüft.

"use strict";

const { neuerBericht } = require("../lib/pruefen");
const { starteBrowser, neueSeite, oeffne, setzeRegler, text } = require("../lib/seite");
const { pruefeNotation } = require("../lib/notation");
const { pruefeKontrast } = require("../lib/kontrast");
const { pruefeAufgabe } = require("../lib/aufgaben");

const bericht = neuerBericht();
const { pruefe } = bericht;
const SEITE = "/mathematik/grundwissen-5-10/03-daten-und-zufall/02-zufall-und-wahrscheinlichkeit/index.html";

const de = (x, stellen = 4) => Number(x.toFixed(stellen)).toLocaleString("de-DE", { maximumFractionDigits: stellen });
const zeichen = (x, stellen = 2) => {
  const f = Math.pow(10, stellen);
  return Math.abs(x - Math.round(x * f) / f) < 1e-12 ? "=" : "≈";
};
function ggT(a, b) { return b === 0 ? a : ggT(b, a % b); }

// ── Laplace an der Urne ───────────────────────────────────────────────────
async function laplace(page) {
  for (const blau of [1, 5, 12]) {
    for (let rot = 1; rot <= 12; rot++) {
      await setzeRegler(page, "lp-rot", rot);
      await setzeRegler(page, "lp-blau", blau);
      const n = rot + blau, wo = `${rot} rot, ${blau} blau`;
      const pRot = rot / n, pBlau = blau / n;

      const karten = await page.evaluate(() => [...document.querySelectorAll("#lp-karten .zu-karte")]
        .map((k) => k.innerText.replace(/\s+/g, " ").trim()));
      pruefe(karten[0] && karten[0].includes(`${zeichen(pRot * 100, 1) === "=" ? "" : "≈ "}${de(pRot * 100, 1)} %`),
        `Laplace: ${wo} — P(rot) steht nicht als ${de(pRot * 100, 1)} % — „${karten[0]}“`);
      pruefe(karten[1] && karten[1].includes(`${de(pBlau * 100, 1)} %`),
        `Laplace: ${wo} — P(blau) steht nicht als ${de(pBlau * 100, 1)} % — „${karten[1]}“`);
      pruefe(karten[2] && karten[2].includes(String(n)), `Laplace: ${wo} — |Ω| ist nicht ${n} — „${karten[2]}“`);

      const bilanz = await text(page, "#lp-bilanz");
      const g = ggT(rot, n);
      // Der gekürzte Bruch wird nur angezeigt, wenn wirklich gekürzt werden kann.
      if (g > 1) {
        pruefe(bilanz.includes(`${rot} : ${n} = ${rot / g} : ${n / g}`),
          `Laplace: ${wo} — die Kürzung auf ${rot / g} : ${n / g} fehlt — „${bilanz}“`);
      }
      pruefe(bilanz.includes(`${zeichen(pRot, 4)} ${de(pRot, 4)}`),
        `Laplace: ${wo} — P(rot) steht nicht mit „${zeichen(pRot, 4)}“ — „${bilanz}“`);
      // Die Probe: Beide Wahrscheinlichkeiten ergeben zusammen 1.
      pruefe(Math.abs(pRot + pBlau - 1) < 1e-12, `Laplace: ${wo} — die Wahrscheinlichkeiten ergeben nicht 1`);

      // Die Zeichnung muss so viele Kugeln zeigen, wie die Bilanz zählt.
      const kugeln = await page.evaluate(() => ({
        rot: document.querySelectorAll("#lp-mount .zu-kugel-rot").length,
        blau: document.querySelectorAll("#lp-mount .zu-kugel-blau").length,
      }));
      pruefe(kugeln.rot === rot && kugeln.blau === blau,
        `Laplace: ${wo} — gezeichnet sind ${kugeln.rot} rote und ${kugeln.blau} blaue Kugeln`);

      const satz = await text(page, "#lp-text");
      // „Fifty-fifty“ darf nur im einzigen Fall behauptet werden, in dem es stimmt.
      pruefe(satz.includes("fifty-fifty") === (rot === blau),
        `Laplace: ${wo} — die Aussage über „fifty-fifty“ passt nicht — „${satz}“`);
    }
  }
}

// ── Wann das Abzählen falsch wird ─────────────────────────────────────────
async function nichtLaplace(page) {
  for (let d = 0; d <= 28; d++) {
    await setzeRegler(page, "nl-spreizung", d);
    const winkel = [90 + 3 * d, 90 + d, 90 - d, 90 - 3 * d];
    const wo = `Spreizung ${d}`;

    // Der Vollkreis bleibt ein Vollkreis, und jedes Feld bleibt ein Feld.
    pruefe(winkel.reduce((a, b) => a + b, 0) === 360, `Nicht-Laplace: ${wo} — die Winkel ergeben nicht 360°`);
    pruefe(winkel.every((w) => w > 0), `Nicht-Laplace: ${wo} — ein Feld hat keine positive Größe (${winkel})`);

    const zeilen = await page.evaluate(() => [...document.querySelectorAll("#nl-tabelle tr")]
      .map((z) => z.innerText.replace(/\s+/g, " ").trim()));
    pruefe(zeilen.length === 6, `Nicht-Laplace: ${wo} — ${zeilen.length} Tabellenzeilen statt 6`);
    winkel.forEach((w, i) => {
      const p = w / 360;
      const zeile = zeilen[i + 1] || "";
      pruefe(zeile.includes(`${de(w)}°`), `Nicht-Laplace: ${wo} — Zeile ${i + 1} nennt nicht ${w}° — „${zeile}“`);
      pruefe(zeile.includes(`${zeichen(p, 4)} ${de(p, 4)}`),
        `Nicht-Laplace: ${wo} — Zeile ${i + 1} zeigt P nicht als „${zeichen(p, 4)} ${de(p, 4)}“ — „${zeile}“`);
      // Das Abzählen liefert immer 0,25 — richtig ist das nur bei gleich
      // großen Feldern, und genau so muss es die Tabelle auszeichnen.
      pruefe(zeile.includes(d === 0 ? "0,25 ✓" : "0,25 ✗"),
        `Nicht-Laplace: ${wo} — Zeile ${i + 1} bewertet das Abzählen falsch — „${zeile}“`);
    });
    // Die Summenzeile: Wahrscheinlichkeiten ergeben zusammen 1, immer.
    pruefe((zeilen[5] || "").includes("360°") && (zeilen[5] || "").includes("1"),
      `Nicht-Laplace: ${wo} — die Summenzeile stimmt nicht — „${zeilen[5]}“`);

    // Die Zeichnung: vier Sektoren, nicht mehr und nicht weniger.
    const sektoren = await page.evaluate(() => document.querySelectorAll("#nl-mount .zu-sektor").length);
    pruefe(sektoren === 4, `Nicht-Laplace: ${wo} — ${sektoren} Sektoren statt 4`);

    const bilanz = await text(page, "#nl-bilanz");
    if (d === 0) {
      pruefe(bilanz.includes("P = 1 : 4 = 0,25"), `Nicht-Laplace: bei gleich großen Feldern fehlt P = ¼ — „${bilanz}“`);
    } else {
      const gr = Math.max(...winkel) / 360, kl = Math.min(...winkel) / 360;
      pruefe(bilanz.includes(`${de(gr / kl, 2)}-mal so wahrscheinlich`),
        `Nicht-Laplace: ${wo} — das Verhältnis ${de(gr / kl, 2)} fehlt — „${bilanz}“`);
      pruefe(bilanz.includes("falsch"), `Nicht-Laplace: ${wo} — das Abzählen wird nicht als falsch bezeichnet — „${bilanz}“`);
    }
  }
}

// ── Die Übungsaufgaben ─────────────────────────────────────────────────────
async function aufgaben(page) {
  // Aufgabe 1 — Laplace an der Urne. 5 Urnengrößen mit je bis zu 24
  // Aufteilungen, ungleich gewichtet (die Größe wird zuerst gezogen);
  // simuliert man den Generator, ist bei 30 Zügen E = 19,7 und σ = 2,1,
  // das Quantil 10⁻⁴ liegt bei 12 — Schranke 11.
  await pruefeAufgabe(page, bericht, {
    nr: 1, name: "A1 Laplace", runden: 30, mindestensVerschieden: 11,
    deute: (frage) => {
      const m = frage.match(/(\d+) rote.*?(\d+) blaue/);
      if (!m) return null;
      const rot = Number(m[1]), blau = Number(m[2]);
      const n = rot + blau;
      return {
        richtig: (rot * 100) / n,
        toleranz: 0.005,
        falsch: [
          // Durch die Zahl der anderen geteilt — der Wert kann über 100 % liegen.
          [(rot * 100) / blau, "blauen"],
          [((n - rot) * 100) / n, "für blau"],
          [rot, "Anzahl"],
          [blau, "blauen Kugeln"],
        ],
        pruefe: (f) => {
          pruefe(rot + blau === n && rot >= 1 && blau >= 1,
            `A1: die Urne ist nicht sinnvoll besetzt (${rot}, ${blau}) — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 2 — Gegenereignis am Glücksrad. Gleiche Struktur wie A1;
  // Quantil 10⁻⁴ bei 11 — Schranke 10.
  await pruefeAufgabe(page, bericht, {
    nr: 2, name: "A2 Gegenereignis", runden: 30, mindestensVerschieden: 10,
    deute: (frage) => {
      const m = frage.match(/(\d+) gleich große.*?(\d+) davon sind rot/);
      if (!m) return null;
      const n = Number(m[1]), rot = Number(m[2]);
      return {
        richtig: ((n - rot) * 100) / n,
        toleranz: 0.005,
        falsch: [
          // Das Ereignis statt des Gegenereignisses.
          [(rot * 100) / n, "Gegenereignis"],
          [n - rot, "Anzahl"],
          [rot, "roten"],
          // Die Anzahl von 100 abgezogen statt des Prozentsatzes.
          [100 - rot, "von 100 abgezogen"],
        ],
        pruefe: (f, rueck) => {
          // Beide Wege müssen dasselbe ergeben — das ist die Probe der Aufgabe.
          pruefe(Math.abs(((n - rot) * 100) / n + (rot * 100) / n - 100) < 1e-9,
            `A2: die beiden Wahrscheinlichkeiten ergeben nicht 100 % — „${f}“`);
          pruefe(rueck.includes("Weg 1") && rueck.includes("Weg 2"),
            `A2: die Musterlösung zeigt nicht beide Wege — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 3 — vom Mittelpunktswinkel zur Wahrscheinlichkeit. 19 Vielfache
  // von 18°; bei 30 Zügen E = 14,3 und σ = 1,2, Quantil 10⁻⁴ bei 10 —
  // Schranke 9.
  await pruefeAufgabe(page, bericht, {
    nr: 3, name: "A3 Winkel und Wahrscheinlichkeit", runden: 30, mindestensVerschieden: 9,
    deute: (frage) => {
      const m = frage.match(/α = (\d+)°/);
      if (!m) return null;
      const alpha = Number(m[1]);
      return {
        richtig: (alpha * 100) / 360,
        toleranz: 0.005,
        falsch: [
          [alpha, "Winkel in Grad"],
          // P als Dezimalzahl — richtig gerechnet, aber nicht in Prozent.
          [alpha / 360, "Dezimalzahl"],
          [360 / alpha, "360 : α"],
          [((360 - alpha) * 100) / 360, "keinen"],
        ],
        pruefe: (f) => {
          // Konstruktiv ein Vielfaches von 18°, damit der Prozentsatz ganzzahlig ist.
          pruefe(alpha % 18 === 0 && alpha < 360,
            `A3: α = ${alpha}° ist kein Vielfaches von 18° unter 360° — „${f}“`);
          pruefe(Number.isInteger((alpha * 100) / 360),
            `A3: P = ${(alpha * 100) / 360} % ist nicht ganzzahlig — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 4 — erwartete Anzahl. 5 Ereignisse × bis zu 49 Wurfzahlen;
  // bei 30 Zügen E = 27,6 und σ = 1,4, Quantil 10⁻⁴ bei 22 — Schranke 21.
  await pruefeAufgabe(page, bericht, {
    nr: 4, name: "A4 erwartete Anzahl", runden: 30, mindestensVerschieden: 21,
    deute: (frage) => {
      const m = frage.match(/(\d+)-mal.*?zu erwarten/);
      if (!m) return null;
      const n = Number(m[1].replace(/\./g, ""));
      // „keine 6“ zuerst: Es enthält „eine 6“ als Teilzeichenkette.
      const guenstig = frage.includes("keine 6") ? 5
        : frage.includes("mindestens eine 3") ? 4
        : frage.includes("größer als 4") ? 2
        : frage.includes("kleiner als 3") ? 2
        : frage.includes("eine 6") ? 1 : null;
      if (guenstig === null) return null;
      const p = guenstig / 6;
      return {
        richtig: n * p,
        toleranz: 0.005,
        falsch: [
          [p * 100, "in Prozent"],
          [n, "aller"],
          [n - n * p, "übrigen"],
          // Durch die Zahl der günstigen Ergebnisse geteilt statt mit P multipliziert.
          [guenstig > 1 ? n / guenstig : null, "günstigen Ergebnisse geteilt"],
        ],
        pruefe: (f, rueck) => {
          pruefe(Number.isInteger(n * p), `A4: die erwartete Anzahl ${n * p} ist nicht ganzzahlig — „${f}“`);
          // Bei P = ½ wäre die erwartete Anzahl so groß wie die des
          // Gegenereignisses; solche Ereignisse kommen deshalb nicht vor.
          pruefe(Math.abs(p - 0.5) > 1e-9, `A4: bei P = ½ fällt das Gegenereignis mit der Lösung zusammen — „${f}“`);
          // Ein Erwartungswert ist keine Garantie — das muss dastehen.
          pruefe(rueck.includes("Erwartungswert"),
            `A4: die Musterlösung nennt den Erwartungswert nicht beim Namen — „${f}“`);
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
    if (!dunkel) { await laplace(page); await nichtLaplace(page); await aufgaben(page); }
    else await pruefeKontrast(page, bericht, "dunkel");
    await pruefeNotation(page, bericht, wo);
    for (const s of page.stoerungen) pruefe(false, `${wo}: ${s}`);
    await page.close();
  }
  await browser.close();
  bericht.abschluss();
})();
