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
  // Aufgabe 1 — relative Häufigkeit. Gemessen mit tests/werkzeug-streuung.js: 140 verschiedene
  // in 200 Würfen, zurückgerechnet also rund 262 Kandidaten. Die Schranke ist das simulierte
  // 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für 0,8 · n gerechnet — 22.
  await pruefeAufgabe(page, bericht, {
    nr: 1, name: "A1 relative Häufigkeit", runden: 30, mindestensVerschieden: 22,
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

  // Aufgabe 2 — Modalwert und Spannweite. Beide werden abgelesen, nicht gerechnet. Gemessen mit
  // tests/werkzeug-streuung.js: in 200 Würfen kein einziges Doppel, die Menge ist also viele
  // Tausend groß. Schranke: simuliertes 10⁻⁴-Quantil bei 30 Zügen — 27.
  await pruefeAufgabe(page, bericht, {
    nr: 2, name: "A2 Modalwert und Spannweite", runden: 30, mindestensVerschieden: 27,
    deute: (frage) => {
      const m = frage.match(/Werte notiert: (.*)$/);
      if (!m) return null;
      const daten = liste(m[1]);
      if (daten.length < 5) return null;
      // Unabhängig nachgezählt: Der häufigste Wert muss eindeutig sein, sonst wäre die Frage
      // nach „dem“ Modalwert gar nicht beantwortbar.
      const moden = modalwerte(daten);
      pruefe(moden.length === 1, `A2: der Modalwert ist nicht eindeutig (${moden.join("/")}) — „${frage}“`);
      const kleinste = Math.min(...daten), groesste = Math.max(...daten);
      return {
        felder: [moden[0], groesste - kleinste],
        toleranz: 0.005,
        falschFelder: [
          [0, 3, "wie oft"],
          [0, groesste, "größte"],
          [0, median(daten), "Median"],
          [1, groesste, "Differenz"],
          [1, groesste + kleinste, "addiert"],
          [1, daten.length, "Anzahl"],
        ],
      };
    },
  });

  // Aufgabe 3 — arithmetisches Mittel. Gemessen mit tests/werkzeug-streuung.js: in 200 Würfen
  // kein einziges Doppel, die Menge ist also viele Tausend groß. Die Schranke ist das
  // simulierte 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für 0,8 · n gerechnet — 27.
  await pruefeAufgabe(page, bericht, {
    nr: 3, name: "A3 arithmetisches Mittel", runden: 30, mindestensVerschieden: 27,
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
          pruefe(Number.isInteger(s / anzahl), `A3: x̄ = ${s / anzahl} ist nicht ganzzahlig — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 4 — vom Anteil zum Kreisdiagramm. Gemessen: 189 verschiedene in 200 Würfen,
  // zurückgerechnet rund 1700 Kandidaten. Schranke: simuliertes 10⁻⁴-Quantil bei 30 Zügen für
  // 0,8 · n — 26.
  await pruefeAufgabe(page, bericht, {
    nr: 4, name: "A4 Kreisdiagramm", runden: 30, mindestensVerschieden: 26,
    deute: (frage) => {
      const m = frage.match(/Von (\d+) [^\d]+ (\d+) /);
      if (!m) return null;
      const n = Number(m[1]), H = Number(m[2]);
      const winkel = (H * 360) / n;
      pruefe(Number.isInteger(winkel), `A4: ${H} : ${n} · 360° = ${winkel}° ist nicht ganzzahlig — „${frage}“`);
      pruefe(H > 0 && H < n, `A4: H = ${H} von ${n} ergibt kein Kreisstück — „${frage}“`);
      // Bei H = n − 1 läge der Anteil als Dezimalzahl (fast 1) innerhalb der Rundungstoleranz
      // um „die übrigen“ (= 1); der Generator schließt solche H aus.
      pruefe(Math.abs((n - H) - H / n) > 0.05,
        `A4: bei H = ${H} von ${n} fallen zwei Fehlerwerte praktisch zusammen — „${frage}“`);
      return {
        felder: [(H * 100) / n, winkel],
        toleranz: 0.01,
        falschFelder: [
          [0, H, "absolute"],
          [0, H / n, "Dezimalzahl"],
          [0, n - H, "übrigen"],
          [1, (H * 100) / n, "Prozent"],
          [1, 360 - winkel, "restlichen"],
        ],
      };
    },
  });

  // Aufgabe 5 — Median bei gerader Anzahl. Gemessen mit tests/werkzeug-streuung.js: in 200
  // Würfen kein einziges Doppel, die Menge ist also viele Tausend groß. Die Schranke ist das
  // simulierte 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für 0,8 · n gerechnet — 27.
  await pruefeAufgabe(page, bericht, {
    nr: 5, name: "A5 Median", runden: 30, mindestensVerschieden: 27,
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
          pruefe(anzahl % 2 === 0, `A5: die Anzahl ${anzahl} ist nicht gerade — „${f}“`);
          // Konstruktiv: die beiden mittleren Werte haben gleiche Parität.
          pruefe(Number.isInteger(md), `A5: der Median ${md} ist nicht ganzzahlig — „${f}“`);
          // Erst dadurch, dass die Urlistenmitte etwas anderes ergibt, kann der
          // Hinweis „nicht geordnet“ überhaupt greifen.
          pruefe(Math.abs(mitteUnsortiert - md) > 1e-9,
            `A5: die Mitte der Urliste ist zufällig schon der Median — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 6 — gewichtetes Mittel aus der Häufigkeitstabelle. Gemessen: in 200 Würfen kein
  // Doppel. Schranke: simuliertes 10⁻⁴-Quantil bei 30 Zügen — 27.
  await pruefeAufgabe(page, bericht, {
    nr: 6, name: "A6 Notendurchschnitt", runden: 30, mindestensVerschieden: 27,
    deute: (frage) => {
      const paare = [...frage.matchAll(/Note (\d): (\d+)×/g)].map((t) => [Number(t[1]), Number(t[2])]);
      if (paare.length < 4) return null;
      const anzahl = summe(paare.map(([, h]) => h));
      const punkte = summe(paare.map(([note, h]) => note * h));
      const stufen = summe(paare.map(([note]) => note));
      pruefe(paare.every(([, h]) => h >= 1), `A6: eine aufgeführte Notenstufe kommt null mal vor — „${frage}“`);
      pruefe(punkte / anzahl >= 1 && punkte / anzahl <= 6,
        `A6: der Durchschnitt ${punkte / anzahl} liegt außerhalb der Notenskala — „${frage}“`);
      return {
        felder: [anzahl, punkte, punkte / anzahl],
        toleranz: 0.01,
        falschFelder: [
          [0, paare.length, "Notenstufen"],
          [0, punkte, "Summe aller Noten"],
          [1, stufen, "Notenstufen"],
          [1, anzahl, "Anzahl der Arbeiten"],
          [2, punkte / paare.length, "Notenstufen"],
          [2, stufen / paare.length, "gemittelt"],
        ],
      };
    },
  });

  // Aufgabe 7 — der fehlende Wert bei vorgegebenem Durchschnitt. Gemessen mit
  // tests/werkzeug-streuung.js: in 200 Würfen kein einziges Doppel, die Menge ist also viele
  // Tausend groß. Die Schranke ist das simulierte 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber
  // für 0,8 · n gerechnet — 27.
  await pruefeAufgabe(page, bericht, {
    nr: 7, name: "A7 fehlender Wert", runden: 30, mindestensVerschieden: 27,
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
          pruefe(rueck.includes("Probe"), `A7: die Musterlösung macht keine Probe — „${f}“`);
          pruefe(Math.abs((s + (anzahl * mittelwert - s)) / anzahl - mittelwert) < 1e-9,
            `A7: die Lösung führt nicht auf den Durchschnitt ${mittelwert} — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 8 — der Ausreißer: Median, arithmetisches Mittel und wie wenige darüber liegen.
  // Gemessen: in 200 Würfen kein Doppel. Schranke: simuliertes 10⁻⁴-Quantil bei 30 Zügen — 27.
  await pruefeAufgabe(page, bericht, {
    nr: 8, name: "A8 Ausreißer", runden: 30, mindestensVerschieden: 27,
    deute: (frage) => {
      const m = frage.match(/Monatsgehälter in Euro: (.*?) Runde/);
      if (!m) return null;
      // Die Gehälter stehen mit Tausenderpunkt; `liste` würde „3.200“ als 3 und 200 lesen.
      const daten = m[1].split("·").map((t) => Number(t.replace(/\./g, "").trim()));
      const anzahl = daten.length;
      if (anzahl !== 7 && anzahl !== 9 || daten.some((v) => !Number.isFinite(v))) return null;
      const sortiert = daten.slice().sort((a, b) => a - b);
      const md = sortiert[(anzahl - 1) / 2];
      const s = summe(daten);
      const mittel = s / anzahl;
      const ueberMittel = daten.filter((v) => v > mittel).length;
      const ueberMedian = daten.filter((v) => v > md).length;
      // Der fachliche Kern der Aufgabe: Ein einzelner Ausreißer zieht das Mittel über den Median,
      // und über dem Mittel liegt deshalb weniger als die Hälfte der Werte. Dass es STRENG
      // weniger sind als über dem Median, lässt sich nicht verlangen: Liegen mehrere Gehälter
      // genau auf dem Median, zählt auch dort nur der Ausreißer als „darüber“.
      pruefe(mittel > md, `A8: das Mittel (${mittel}) liegt nicht über dem Median (${md}) — „${frage}“`);
      pruefe(ueberMittel <= ueberMedian && ueberMittel < anzahl / 2,
        `A8: über dem Mittel liegen ${ueberMittel} von ${anzahl} (über dem Median ${ueberMedian}) — der Ausreißer wirkt nicht — „${frage}“`);
      return {
        felder: [md, mittel, ueberMittel],
        toleranz: 0.01,
        falschFelder: [
          [0, mittel, "arithmetische Mittel"],
          [0, daten[(anzahl - 1) / 2], "Urliste"],
          [0, (sortiert[0] + sortiert[anzahl - 1]) / 2, "kleinsten"],
          [1, s, "Summe"],
          [1, s / (anzahl - 1), "geteilt"],
          [1, md, "Median"],
          [2, ueberMedian, "Median"],
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
    if (!dunkel) { await mittelwerte(page); await aufgaben(page); }
    else await pruefeKontrast(page, bericht, "dunkel");
    await pruefeNotation(page, bericht, wo);
    for (const s of page.stoerungen) pruefe(false, `${wo}: ${s}`);
    await page.close();
  }
  await browser.close();
  bericht.abschluss();
})();
