// Fachliche Prüfung: Kapitel 3, Thema 1 „Daten und Häufigkeiten“.
//
// Der fachliche Kern ist der Unterschied zwischen arithmetischem Mittel und
// Median: Ein einzelner Ausreißer zieht das Mittel beliebig weit, den Median
// höchstens auf den benachbarten Datenwert. Das Werkzeug muss diese Aussage
// über den ganzen Reglerbereich einlösen — und darf sie nicht überziehen, denn
// „der Median bleibt liegen“ wäre bequem, aber falsch.

"use strict";

const { neuerBericht } = require("../lib/pruefen");
const { starteBrowser, neueSeite, oeffne, setzeRegler, text } = require("../lib/seite");
const { pruefeNotation } = require("../lib/notation");
const { pruefeKontrast } = require("../lib/kontrast");
const { pruefeAufgabe } = require("../lib/aufgaben");

const bericht = neuerBericht();
const { pruefe } = bericht;
const SEITE = "/mathematik/grundwissen-5-10/03-daten-und-zufall/01-daten-und-haeufigkeiten/index.html";

const de = (x, stellen = 4) => Number(x.toFixed(stellen)).toLocaleString("de-DE", { maximumFractionDigits: stellen });
// „=“ nur, wenn die Anzeige den Wert wirklich trifft — nicht, wenn er zufällig
// ganzzahlig ist.
const zeichen = (x, stellen = 2) => {
  const f = Math.pow(10, stellen);
  return Math.abs(x - Math.round(x * f) / f) < 1e-12 ? "=" : "≈";
};
const summe = (v) => v.reduce((a, b) => a + b, 0);
const median = (v) => {
  const s = v.slice().sort((a, b) => a - b), n = s.length, m = Math.floor(n / 2);
  return n % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
function modalwerte(v) {
  const z = new Map();
  v.forEach((w) => z.set(w, (z.get(w) || 0) + 1));
  const max = Math.max(...z.values());
  return [...z.entries()].filter(([, h]) => h === max).map(([w]) => w).sort((a, b) => a - b);
}

// Zahlen einer Aufzählung „12 · 7 · 30“ lesen.
const liste = (s) => (s.match(/\d+/g) || []).map(Number);

// ── Mittelwert und Median unter einem Ausreißer ───────────────────────────
async function mittelwerte(page) {
  const OX = 30, BREITE = 500, ACHSE = 60;

  let mittelSpanne = [Infinity, -Infinity], medianSpanne = [Infinity, -Infinity];
  let vorherMedian = null;

  for (let a = 1; a <= 60; a += 1) {
    await setzeRegler(page, "mw-ausreisser", a);
    const wo = `Ausreißer ${a}`;

    // Die Daten aus der Bilanz lesen und alles selbst nachrechnen.
    const bilanz = await text(page, "#mw-bilanz");
    const geordnet = liste((bilanz.match(/geordnet: ([^\n]*?) x̄/s) || bilanz.match(/geordnet: (.*)/))[1]);
    pruefe(geordnet.includes(a), `Mittelwerte: ${wo} — der eingestellte Wert steht nicht in den Daten (${geordnet})`);
    pruefe(geordnet.every((v, i) => i === 0 || v >= geordnet[i - 1]),
      `Mittelwerte: ${wo} — die „geordnete“ Liste ist nicht geordnet (${geordnet})`);

    const xq = summe(geordnet) / geordnet.length;
    const md = median(geordnet);
    const sp = Math.max(...geordnet) - Math.min(...geordnet);
    const mo = modalwerte(geordnet);

    const karten = await page.evaluate(() => [...document.querySelectorAll("#mw-karten .da-karte")]
      .map((k) => k.innerText.replace(/\s+/g, " ").trim()));
    pruefe(karten.length === 4, `Mittelwerte: ${wo} — ${karten.length} Kennwertkarten statt 4`);
    pruefe(karten[0] && karten[0].includes(`${zeichen(xq, 2) === "=" ? "" : "≈ "}${de(xq, 2)}`),
      `Mittelwerte: ${wo} — die Mittelkarte zeigt nicht ${de(xq, 2)} — „${karten[0]}“`);
    pruefe(karten[1] && karten[1].includes(de(md, 2)),
      `Mittelwerte: ${wo} — die Mediankarte zeigt nicht ${de(md, 2)} — „${karten[1]}“`);
    pruefe(karten[2] && karten[2].includes(mo.join(" · ")),
      `Mittelwerte: ${wo} — die Modalkarte zeigt nicht ${mo.join(" · ")} — „${karten[2]}“`);
    pruefe(karten[3] && karten[3].includes(de(sp)),
      `Mittelwerte: ${wo} — die Spannweitenkarte zeigt nicht ${sp} — „${karten[3]}“`);

    // Ein gerundeter Wert darf nicht mit „=“ dastehen.
    pruefe(bilanz.includes(`${zeichen(xq, 3)} ${de(xq, 3)}`),
      `Mittelwerte: ${wo} — x̄ steht nicht mit „${zeichen(xq, 3)}“ in der Bilanz — „${bilanz}“`);

    // Die beiden Marken müssen an der Stelle stehen, für die sie stehen.
    const marken = await page.evaluate(() => ({
      mittel: Number(document.querySelector("#mw-mount .da-mittel").getAttribute("x1")),
      median: Number(document.querySelector("#mw-mount .da-median").getAttribute("x1")),
    }));
    pruefe(Math.abs(marken.mittel - (OX + (xq / ACHSE) * BREITE)) < 0.02,
      `Mittelwerte: ${wo} — die Mittelmarke steht bei ${marken.mittel} statt ${(OX + (xq / ACHSE) * BREITE).toFixed(2)}`);
    pruefe(Math.abs(marken.median - (OX + (md / ACHSE) * BREITE)) < 0.02,
      `Mittelwerte: ${wo} — die Medianmarke steht bei ${marken.median} statt ${(OX + (md / ACHSE) * BREITE).toFixed(2)}`);

    // Bei ungerader Anzahl ist der Median stets selbst ein Datenwert — er kann
    // gar nicht irgendwohin wandern, wo keine Daten liegen.
    if (geordnet.length % 2 === 1) {
      pruefe(geordnet.includes(md), `Mittelwerte: ${wo} — der Median ${md} ist kein Datenwert`);
    }
    // Und er springt nie über einen Datenwert hinweg.
    if (vorherMedian !== null) {
      const dazwischen = geordnet.filter((v) => v > Math.min(vorherMedian, md) && v < Math.max(vorherMedian, md));
      pruefe(dazwischen.length === 0,
        `Mittelwerte: ${wo} — der Median sprang von ${vorherMedian} auf ${md} über ${dazwischen} hinweg`);
    }
    vorherMedian = md;

    mittelSpanne = [Math.min(mittelSpanne[0], xq), Math.max(mittelSpanne[1], xq)];
    medianSpanne = [Math.min(medianSpanne[0], md), Math.max(medianSpanne[1], md)];

    const satz = await text(page, "#mw-text");
    if (xq - md > 1.5) {
      pruefe(satz.includes("nach rechts"), `Mittelwerte: ${wo} — x̄ liegt weit rechts, der Text sagt es nicht — „${satz}“`);
      // Der Text darf nicht behaupten, der Median bleibe liegen.
      pruefe(satz.includes("höchstens auf den nächsten Datenwert"),
        `Mittelwerte: ${wo} — der Text beschreibt die Beweglichkeit des Medians nicht genau — „${satz}“`);
    }
  }

  // Der Kern des Abschnitts: Über denselben Reglerweg wandert das Mittel
  // deutlich weiter als der Median.
  const wegMittel = mittelSpanne[1] - mittelSpanne[0];
  const wegMedian = medianSpanne[1] - medianSpanne[0];
  pruefe(wegMittel > wegMedian,
    `Mittelwerte: das Mittel wandert ${wegMittel.toFixed(2)}, der Median ${wegMedian.toFixed(2)} — der Abschnitt behauptet das Gegenteil`);
}

// ── Die Übungsaufgaben ─────────────────────────────────────────────────────
async function aufgaben(page) {
  // Aufgabe 1 — relative Häufigkeit. 3 Umfragegrößen × 4 Farben × bis zu 47
  // Häufigkeiten; bei 30 Zügen sind kaum Doppel zu erwarten (Schranke 25).
  await pruefeAufgabe(page, bericht, {
    nr: 1, name: "A1 relative Häufigkeit", runden: 30, mindestensVerschieden: 25,
    deute: (frage) => {
      const m = frage.match(/unter (\d+) Personen nannten (\d+) die Farbe/);
      if (!m) return null;
      const n = Number(m[1]), H = Number(m[2]);
      return {
        richtig: (H * 100) / n,
        toleranz: 0.005,
        falsch: [
          [H, "absolute"],
          // Der Anteil als Dezimalzahl — richtig gerechnet, aber nicht in Prozent.
          [H / n, "Dezimalzahl"],
          [(n * 100) / H, "n durch H"],
          [n - H, "übrigen"],
        ],
        pruefe: (f, rueck) => {
          // Die Probe der Musterlösung: beide Anteile ergeben zusammen 100 %.
          pruefe(rueck.includes(`${de(((n - H) * 100) / n)} %`),
            `A1: die Probe nennt den Gegenanteil ${de(((n - H) * 100) / n)} % nicht — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 2 — arithmetisches Mittel. Die Werte sind eine zufällige Auswahl
  // aus 28 Zahlen; verschiedene Fassungen sind praktisch sicher.
  await pruefeAufgabe(page, bericht, {
    nr: 2, name: "A2 arithmetisches Mittel", runden: 30, mindestensVerschieden: 29,
    deute: (frage) => {
      const m = frage.match(/Bei (\d+) Messungen wurden diese Werte notiert: (.*?) Wie groß/);
      if (!m) return null;
      const anzahl = Number(m[1]);
      const daten = liste(m[2]);
      if (daten.length !== anzahl) return null;
      const s = summe(daten);
      return {
        richtig: s / anzahl,
        toleranz: 0.005,
        falsch: [
          [s, "Summe"],
          [s / (anzahl - 1), "n − 1"],
          [(Math.min(...daten) + Math.max(...daten)) / 2, "kleinstem und größtem"],
          [median(daten), "Median"],
        ],
        pruefe: (f) => {
          // Konstruktiv: der letzte Wert macht die Summe durch n teilbar.
          pruefe(Number.isInteger(s / anzahl), `A2: x̄ = ${s / anzahl} ist nicht ganzzahlig — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 3 — Median bei gerader Anzahl.
  await pruefeAufgabe(page, bericht, {
    nr: 3, name: "A3 Median", runden: 30, mindestensVerschieden: 29,
    deute: (frage) => {
      const m = frage.match(/Diese (\d+) Werte wurden erhoben: (.*?) Wie groß/);
      if (!m) return null;
      const anzahl = Number(m[1]);
      const daten = liste(m[2]);
      if (daten.length !== anzahl) return null;
      const halb = anzahl / 2;
      const sortiert = daten.slice().sort((a, b) => a - b);
      const md = (sortiert[halb - 1] + sortiert[halb]) / 2;
      const xq = summe(daten) / anzahl;
      const mitteUnsortiert = (daten[halb - 1] + daten[halb]) / 2;
      return {
        richtig: md,
        toleranz: 0.005,
        falsch: [
          [xq, "arithmetische Mittel"],
          // Einen der beiden mittleren Werte allein genommen.
          [sortiert[halb - 1], "zwei mittlere Werte"],
          // Die Mitte der ungeordneten Urliste.
          [mitteUnsortiert, "Urliste"],
        ],
        pruefe: (f) => {
          pruefe(anzahl % 2 === 0, `A3: die Anzahl ${anzahl} ist nicht gerade — „${f}“`);
          // Konstruktiv: die beiden mittleren Werte haben gleiche Parität.
          pruefe(Number.isInteger(md), `A3: der Median ${md} ist nicht ganzzahlig — „${f}“`);
          // Erst dadurch, dass die Urlistenmitte etwas anderes ergibt, kann der
          // Hinweis „nicht geordnet“ überhaupt greifen.
          pruefe(Math.abs(mitteUnsortiert - md) > 1e-9,
            `A3: die Mitte der Urliste ist zufällig schon der Median — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 4 — der fehlende Wert bei vorgegebenem Durchschnitt.
  await pruefeAufgabe(page, bericht, {
    nr: 4, name: "A4 fehlender Wert", runden: 30, mindestensVerschieden: 29,
    deute: (frage) => {
      const m = frage.match(/Durchschnitt aller (\d+) Punktzahlen ist (\d+).*?bekannt: (.*?) Wie viele/);
      if (!m) return null;
      const anzahl = Number(m[1]), mittelwert = Number(m[2]);
      const bekannt = liste(m[3]);
      if (bekannt.length !== anzahl - 1) return null;
      const s = summe(bekannt);
      return {
        richtig: anzahl * mittelwert - s,
        toleranz: 0.005,
        falsch: [
          [anzahl * mittelwert, "Gesamtsumme"],
          [s, "bekannten"],
          [mittelwert, "Durchschnitt selbst"],
          [(anzahl - 1) * mittelwert - s, `mit ${anzahl - 1}`],
        ],
        pruefe: (f, rueck) => {
          // Die Probe muss zurück auf den vorgegebenen Durchschnitt führen.
          pruefe(rueck.includes("Probe"), `A4: die Musterlösung macht keine Probe — „${f}“`);
          pruefe(Math.abs((s + (anzahl * mittelwert - s)) / anzahl - mittelwert) < 1e-9,
            `A4: die Lösung führt nicht auf den Durchschnitt ${mittelwert} — „${f}“`);
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
    if (!dunkel) { await mittelwerte(page); await aufgaben(page); }
    else await pruefeKontrast(page, bericht, "dunkel");
    await pruefeNotation(page, bericht, wo);
    for (const s of page.stoerungen) pruefe(false, `${wo}: ${s}`);
    await page.close();
  }
  await browser.close();
  bericht.abschluss();
})();
