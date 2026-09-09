// Fachliche Prüfung: Kapitel 3, Thema 4 „Bedingte Wahrscheinlichkeit“.
//
// Der ganze Abschnitt hängt an einem Satz: P(A|B) und P(B|A) sind zwei
// verschiedene Zahlen. Der Zähler ist derselbe, die Bedingung entscheidet nur,
// welche Randsumme in den Nenner kommt. Das Werkzeug mit den beiden Bäumen muss
// das zeigen — und darf im Ausnahmefall gleicher Randsummen nicht so tun, als
// gälte der Unterschied immer.

"use strict";

const { neuerBericht } = require("../lib/pruefen");
const { starteBrowser, neueSeite, oeffne, setzeRegler, text } = require("../lib/seite");
const { pruefeNotation } = require("../lib/notation");
const { pruefeKontrast } = require("../lib/kontrast");
const { pruefeAufgabe } = require("../lib/aufgaben");

const bericht = neuerBericht();
const { pruefe } = bericht;
const SEITE = "/mathematik/grundwissen-5-10/03-daten-und-zufall/04-bedingte-wahrscheinlichkeit/index.html";

const de = (x, stellen = 4) => Number(x.toFixed(stellen)).toLocaleString("de-DE", { maximumFractionDigits: stellen });
const zeichen = (x, stellen = 2) => {
  const f = Math.pow(10, stellen);
  return Math.abs(x - Math.round(x * f) / f) < 1e-12 ? "=" : "≈";
};

// ── Die beiden Bäume derselben Tafel ──────────────────────────────────────
async function umdrehen(page) {
  const faelle = [
    [12, 8, 18, 12],
    [12, 8, 8, 12],    // Zeilen- und Spaltensumme gleich: der Ausnahmefall
    [1, 40, 1, 40],
    [40, 1, 1, 40],
    [20, 20, 20, 20],  // alles gleich — auch das ist der Ausnahmefall
    [7, 13, 29, 3],
    [1, 1, 40, 40],
    [33, 5, 9, 21],
  ];

  for (const [ab, anb, nab, nanb] of faelle) {
    await setzeRegler(page, "bu-ab", ab);
    await setzeRegler(page, "bu-anb", anb);
    await setzeRegler(page, "bu-nab", nab);
    await setzeRegler(page, "bu-nanb", nanb);

    const zeileA = ab + anb, spalteB = ab + nab, n = ab + anb + nab + nanb;
    const pBA = ab / zeileA, pAB = ab / spalteB;
    const wo = `${ab}/${anb}/${nab}/${nanb}`;

    const bilanz = await text(page, "#bu-bilanz");
    pruefe(bilanz.includes(`dieselben ${de(n)} Personen`),
      `Umdrehen: ${wo} — die Bilanz nennt nicht ${n} Personen — „${bilanz}“`);
    // Der gemeinsame Pfadwert: links wie rechts derselbe.
    pruefe(bilanz.includes(`${de(ab)} : ${de(n)}`),
      `Umdrehen: ${wo} — der Pfadwert ${ab} : ${n} fehlt — „${bilanz}“`);
    pruefe(bilanz.includes(`P(B|A) ${zeichen(pBA, 4)} ${de(pBA, 4)}`),
      `Umdrehen: ${wo} — P(B|A) steht nicht als ${de(pBA, 4)} — „${bilanz}“`);
    pruefe(bilanz.includes(`P(A|B) ${zeichen(pAB, 4)} ${de(pAB, 4)}`),
      `Umdrehen: ${wo} — P(A|B) steht nicht als ${de(pAB, 4)} — „${bilanz}“`);

    // Die Zerlegung muss auf beiden Wegen denselben Wert ergeben — das ist der
    // Grund, warum überhaupt zwei Bäume dieselbe Tafel beschreiben können.
    pruefe(Math.abs((zeileA / n) * pBA - ab / n) < 1e-12 && Math.abs((spalteB / n) * pAB - ab / n) < 1e-12,
      `Umdrehen: ${wo} — die beiden Zerlegungen ergeben nicht denselben Pfadwert`);

    // Der Ausnahmefall darf nur dann als solcher benannt werden, wenn er
    // wirklich vorliegt — und dann muss er benannt werden.
    pruefe(bilanz.includes("ausnahmsweise gleich") === (zeileA === spalteB),
      `Umdrehen: ${wo} — Zeilensumme ${zeileA}, Spaltensumme ${spalteB}, aber die Bilanz sagt „${bilanz.includes("ausnahmsweise gleich") ? "ausnahmsweise gleich" : "verschieden"}“`);
    if (zeileA !== spalteB) {
      pruefe(Math.abs(pBA - pAB) > 1e-12,
        `Umdrehen: ${wo} — P(B|A) und P(A|B) sind gleich, obwohl die Randsummen es nicht sind`);
    }
  }
}

// Die vier Zellen der Vierfeldertafel aus dem Aufgabentext lesen.
async function tafeldaten(page, box) {
  return page.evaluate((sel) => {
    const t = document.querySelector(`${sel} .aufgabe-prompt table.bw-tafel`);
    if (!t) return null;
    const zahl = (z, i) => Number(t.rows[z].cells[i].textContent.replace(/\./g, "").trim());
    return {
      ab: zahl(1, 1), anb: zahl(1, 2), zeileA: zahl(1, 3),
      nab: zahl(2, 1), nanb: zahl(2, 2), zeileNichtA: zahl(2, 3),
      spalteB: zahl(3, 1), spalteNichtB: zahl(3, 2), n: zahl(3, 3),
    };
  }, box);
}

// Die Tafel muss in sich stimmen — sonst rechnete jede Antwort mit falschen
// Randsummen.
function tafelStimmt(t) {
  return t && t.ab + t.anb === t.zeileA && t.nab + t.nanb === t.zeileNichtA
    && t.ab + t.nab === t.spalteB && t.anb + t.nanb === t.spalteNichtB
    && t.zeileA + t.zeileNichtA === t.n && t.spalteB + t.spalteNichtB === t.n;
}

// ── Die Übungsaufgaben ─────────────────────────────────────────────────────
async function aufgaben(page) {
  // Aufgabe 1 — P(A|B) aus der Tafel. 4213 zulässige Tafeln × 3 Kontexte;
  // bei 30 Zügen sind 30·29/(2·12 639) ≈ 0,03 Doppel zu erwarten — Schranke 29.
  await pruefeAufgabe(page, bericht, {
    nr: 1, name: "A1 P(A|B)", runden: 30, mindestensVerschieden: 29, liesRoh: tafeldaten,
    deute: (frage, t) => {
      if (!t) return null;
      return {
        richtig: (100 * t.ab) / t.spalteB,
        toleranz: 0.02,
        falsch: [
          // Die Verwechslung der beiden Richtungen.
          [(100 * t.ab) / t.zeileA, "Zeilensumme"],
          [(100 * t.ab) / t.n, "allen"],
          [(100 * t.zeileA) / t.n, "ganzen Umfrage"],
        ],
        pruefe: (f, rueck) => {
          pruefe(tafelStimmt(t), `A1: die Vierfeldertafel geht nicht auf — „${f}“`);
          pruefe(frage.includes("P(A|B)"), `A1: die Frage benennt P(A|B) nicht — „${f}“`);
          // Die Musterlösung muss die andere Richtung danebenstellen — sonst
          // bleibt der Unterschied unsichtbar.
          pruefe(rueck.includes("P(B|A)"),
            `A1: die Musterlösung vergleicht nicht mit P(B|A) — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 2 — dieselbe Tafel, die andere Bedingung. 3274 Tafeln × 3 Kontexte.
  await pruefeAufgabe(page, bericht, {
    nr: 2, name: "A2 P(B|A)", runden: 30, mindestensVerschieden: 29, liesRoh: tafeldaten,
    deute: (frage, t) => {
      if (!t) return null;
      return {
        richtig: (100 * t.ab) / t.zeileA,
        toleranz: 0.02,
        falsch: [
          [(100 * t.ab) / t.spalteB, "Spaltensumme"],
          // Die falsche Zelle: A ohne B statt A und B.
          [(100 * t.anb) / t.zeileA, "falsche Zelle"],
          [(100 * t.ab) / t.n, "A ∩ B"],
        ],
        pruefe: (f) => {
          pruefe(tafelStimmt(t), `A2: die Vierfeldertafel geht nicht auf — „${f}“`);
          pruefe(frage.includes("P(B|A)"), `A2: die Frage benennt P(B|A) nicht — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 3 — die Zellbesetzung bei Unabhängigkeit. 696 Fassungen × 3
  // Kontexte; bei 30 Zügen sind 0,2 Doppel zu erwarten — Schranke 28.
  await pruefeAufgabe(page, bericht, {
    nr: 3, name: "A3 Unabhängigkeit", runden: 30, mindestensVerschieden: 28,
    deute: (frage) => {
      const m = frage.match(/Unter (\d+) [\s\S]*?(\d+) \(Ereignis A\), und (\d+) /);
      if (!m) return null;
      const [n, a, b] = m.slice(1).map(Number);
      const soll = (a * b) / n;
      return {
        richtig: soll,
        toleranz: 0.005,
        falsch: [
          // Die kleinstmögliche Überschneidung — sie folgt aus dem Platz,
          // nicht aus der Unabhängigkeit.
          [a + b - n, "kleinstmögliche"],
          [(a + b) / 2, "Mittelwert"],
          // Die größtmögliche Überschneidung — stärkste Abhängigkeit.
          [Math.min(a, b), "größtmögliche"],
        ],
        pruefe: (f, rueck) => {
          pruefe(Number.isInteger(soll), `A3: ${a} · ${b} : ${n} = ${soll} ist nicht ganzzahlig — „${f}“`);
          // Der Wert muss überhaupt in die Tafel passen.
          pruefe(soll >= Math.max(0, a + b - n) && soll <= Math.min(a, b),
            `A3: ${soll} liegt außerhalb des möglichen Bereichs — „${f}“`);
          // Die Probe: unter dieser Besetzung ist P(B|A) = P(B).
          pruefe(Math.abs(soll / a - b / n) < 1e-12,
            `A3: bei ${soll} ist P(B|A) ≠ P(B) — „${f}“`);
          pruefe(rueck.includes("P(A ∩ B) = P(A) · P(B)"),
            `A3: die Musterlösung nennt die Unabhängigkeitsbedingung nicht — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 4 — P(krank | Test positiv). 151 Fassungen × 3 Kontexte;
  // bei 30 Zügen sind 435 : 453 ≈ 0,96 Doppel zu erwarten (Poisson, σ ≈ 0,98)
  // — Schranke 26.
  await pruefeAufgabe(page, bericht, {
    nr: 4, name: "A4 Basisrate", runden: 30, mindestensVerschieden: 26,
    deute: (frage) => {
      const m = frage.replace(/\./g, "").match(/Stadt mit (\d+) Personen sind (\d+) an.*?bei (\d+) der Kranken.*?bei (\d+) der Gesunden/);
      if (!m) return null;
      const [bev, kranke, richtig, falschPositiv] = m.slice(1).map(Number);
      const gesamt = richtig + falschPositiv;
      const gesunde = bev - kranke;
      return {
        richtig: (100 * richtig) / gesamt,
        toleranz: 0.02,
        falsch: [
          // Die berühmte Verwechslung: P(Test + | krank) statt P(krank | Test +).
          [(100 * richtig) / kranke, "umgekehrte"],
          [(100 * kranke) / bev, "ganzen Stadt"],
          [(100 * richtig) / bev, "durch die ganze Stadt"],
        ],
        pruefe: (f, rueck) => {
          pruefe(richtig <= kranke && falschPositiv <= gesunde,
            `A4: die Zahlen passen nicht zur Bevölkerung — „${f}“`);
          // Der Kern: Die gesuchte Zahl ist klein, obwohl der Test gut ist.
          pruefe((100 * richtig) / gesamt < (100 * richtig) / kranke,
            `A4: P(krank | Test +) ist nicht kleiner als P(Test + | krank) — „${f}“`);
          pruefe(rueck.includes("zwei verschiedene Zahlen"),
            `A4: die Musterlösung stellt die beiden Richtungen nicht gegenüber — „${f}“`);
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
    if (!dunkel) { await umdrehen(page); await aufgaben(page); }
    else await pruefeKontrast(page, bericht, "dunkel");
    await pruefeNotation(page, bericht, wo);
    for (const s of page.stoerungen) pruefe(false, `${wo}: ${s}`);
    await page.close();
  }
  await browser.close();
  bericht.abschluss();
})();
