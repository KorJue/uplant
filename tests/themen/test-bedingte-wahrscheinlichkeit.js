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
  // Aufgabe 1 — P(A|B) aus der Tafel. Gemessen mit tests/werkzeug-streuung.js: 199 verschiedene
  // in 200 Würfen, zurückgerechnet also rund 19834 Kandidaten. Die Schranke ist das simulierte
  // 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für 0,8 · n gerechnet — 27.
  await pruefeAufgabe(page, bericht, {
    nr: 1, name: "A1 P(A|B)", runden: 30, mindestensVerschieden: 27, liesRoh: tafeldaten,
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

  // Aufgabe 2 — die Vierfeldertafel überhaupt erst füllen. Gemessen mit tests/werkzeug-streuung.js:
  // in 200 Würfen kein einziges Doppel. Die Schranke ist das simulierte 10⁻⁴-Quantil bei
  // 30 Zügen — 28.
  await pruefeAufgabe(page, bericht, {
    nr: 2, name: "A2 Tafel füllen", runden: 30, mindestensVerschieden: 28,
    deute: (frage) => {
      // In der Aufgabenstellung stehen genau vier Zahlen: die Gesamtzahl und die drei
      // gegebenen Felder — in dieser Reihenfolge.
      const z = (frage.match(/\d+/g) || []).map(Number);
      if (z.length !== 4) return null;
      const [n, ab, anb, nab] = z;
      const nanb = n - ab - anb - nab;
      pruefe(nanb > 0, `A2: das vierte Feld wäre ${nanb} — die Tafel geht nicht auf — „${frage}“`);
      return {
        felder: [nanb, ab + anb, ab + nab],
        toleranz: 0.005,
        falschFelder: [
          [0, n - ab, "beiden"],
          [0, anb + nab, "genau einem"],
          [1, ab, "beiden"],
          [1, anb, "ohne das zweite"],
          [2, ab + anb, "andere Randsumme"],
          [2, nab, "ohne das erste"],
        ],
      };
    },
  });

  // Aufgabe 3 — dieselbe Tafel, die andere Bedingung. Gemessen mit tests/werkzeug-streuung.js:
  // 198 verschiedene in 200 Würfen, zurückgerechnet also rund 9884 Kandidaten. Die Schranke ist
  // das simulierte 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für 0,8 · n gerechnet — 28.
  await pruefeAufgabe(page, bericht, {
    nr: 3, name: "A3 P(B|A)", runden: 30, mindestensVerschieden: 28, liesRoh: tafeldaten,
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
          pruefe(tafelStimmt(t), `A3: die Vierfeldertafel geht nicht auf — „${f}“`);
          pruefe(frage.includes("P(B|A)"), `A3: die Frage benennt P(B|A) nicht — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 4 — Unabhängigkeit prüfen. Gemessen: 190 verschiedene in 200 Würfen, zurückgerechnet
  // rund 1900 Kandidaten. Schranke: simuliertes 10⁻⁴-Quantil bei 30 Zügen für 0,8 · n — 26.
  let unabhaengig = 0, abhaengig = 0;
  await pruefeAufgabe(page, bericht, {
    nr: 4, name: "A4 Unabhängigkeit prüfen", runden: 30, mindestensVerschieden: 26, liesRoh: tafeldaten,
    deute: (frage, t) => {
      if (!t) return null;
      pruefe(tafelStimmt(t), `A4: die Tafel stimmt in sich nicht — ${JSON.stringify(t)}`);
      const pA = (100 * t.zeileA) / t.n;
      const pB = (100 * t.spalteB) / t.n;
      const produkt = (pA * pB) / 100;
      const gemeinsam = (100 * t.ab) / t.n;
      // Ganzzahlig entschieden: P(A ∩ B) = P(A) · P(B) ist gleichbedeutend mit ab · n = a · b.
      const passt = t.ab * t.n === t.zeileA * t.spalteB;
      if (passt) unabhaengig++; else abhaengig++;
      return {
        felder: [produkt, gemeinsam, passt ? 1 : 2],
        toleranz: 0.01,
        falschFelder: [
          [0, pA + pB, "addiert"],
          [0, pA * pB, "hundertmal"],
          [0, gemeinsam, "P(A ∩ B)"],
          [1, (100 * t.ab) / t.spalteB, "P(A|B)"],
          [1, (100 * t.ab) / t.zeileA, "P(B|A)"],
          [1, produkt, "Produkt"],
          [2, passt ? 2 : 1, "Vergleiche"],
        ],
      };
    },
  });
  pruefe(unabhaengig > 0 && abhaengig > 0,
    `A4: in 30 Zügen war die Tafel ${unabhaengig}-mal unabhängig und ${abhaengig}-mal nicht — beide Fälle müssen vorkommen`);

  // Aufgabe 5 — die Zellbesetzung bei Unabhängigkeit. Gemessen mit tests/werkzeug-streuung.js:
  // 195 verschiedene in 200 Würfen, zurückgerechnet also rund 3914 Kandidaten. Die Schranke ist
  // das simulierte 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für 0,8 · n gerechnet — 27.
  await pruefeAufgabe(page, bericht, {
    nr: 5, name: "A5 Unabhängigkeit", runden: 30, mindestensVerschieden: 27,
    deute: (frage) => {
      // „Unter 200 Jugendlichen spielen 40 ein Instrument (Ereignis A), und 55 sind …“ —
      // die Anzahl steht in Verbzweitstellung hinter dem Verb, nicht am Ende des Satzteils.
      const m = frage.match(/Unter (\d+) \D+?(\d+) .*?\(Ereignis A\), und (\d+) /);
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
          pruefe(Number.isInteger(soll), `A5: ${a} · ${b} : ${n} = ${soll} ist nicht ganzzahlig — „${f}“`);
          // Der Wert muss überhaupt in die Tafel passen.
          pruefe(soll >= Math.max(0, a + b - n) && soll <= Math.min(a, b),
            `A5: ${soll} liegt außerhalb des möglichen Bereichs — „${f}“`);
          // Die Probe: unter dieser Besetzung ist P(B|A) = P(B).
          pruefe(Math.abs(soll / a - b / n) < 1e-12,
            `A5: bei ${soll} ist P(B|A) ≠ P(B) — „${f}“`);
          pruefe(rueck.includes("P(A ∩ B) = P(A) · P(B)"),
            `A5: die Musterlösung nennt die Unabhängigkeitsbedingung nicht — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 6 — die Richtung umdrehen. Gemessen: 196 verschiedene in 200 Würfen, zurückgerechnet
  // rund 4900 Kandidaten. Schranke: simuliertes 10⁻⁴-Quantil bei 30 Zügen für 0,8 · n — 27.
  await pruefeAufgabe(page, bericht, {
    nr: 6, name: "A6 Richtung umdrehen", runden: 30, mindestensVerschieden: 27,
    deute: (frage) => {
      const m = frage.match(/von (\d+) Personen (\d+) .*?und (\d+) /);
      const mq = frage.match(/(\d+) %.*?(\d+) %/);
      if (!m || !mq) return null;
      const n = Number(m[1]), g1 = Number(m[2]), g2 = Number(m[3]);
      const q1 = Number(mq[1]), q2 = Number(mq[2]);
      pruefe(g1 + g2 === n, `A6: ${g1} + ${g2} ≠ ${n} — „${frage}“`);
      pruefe(q1 !== q2, `A6: beide Raten sind ${q1} % — dann ist die Rückfrage stumpf — „${frage}“`);
      const m1 = (g1 * q1) / 100, m2 = (g2 * q2) / 100;
      pruefe(Number.isInteger(m1) && Number.isInteger(m2),
        `A6: ${q1} % von ${g1} oder ${q2} % von ${g2} ist keine ganze Person — „${frage}“`);
      const gesamt = m1 + m2;
      return {
        felder: [m1, gesamt, (100 * m1) / gesamt],
        toleranz: 0.01,
        falschFelder: [
          [0, q1, "Prozentsatz"],
          [0, g1, "Nur"],
          [0, Math.round((n * q1) / 100), "allen"],
          [1, m1, "eine Zweig"],
          [1, m2, "andere Zweig"],
          [2, q1, "umgekehrte"],
          [2, (100 * g1) / n, "ohne Bedingung"],
          [2, (100 * m1) / n, "durch alle"],
        ],
      };
    },
  });

  // Aufgabe 7 — P(krank | Test positiv). Gemessen mit tests/werkzeug-streuung.js: 110
  // verschiedene in 200 Würfen, zurückgerechnet also rund 148 Kandidaten. Die Schranke ist das
  // simulierte 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für 0,8 · n gerechnet — 20.
  await pruefeAufgabe(page, bericht, {
    nr: 7, name: "A7 Basisrate", runden: 30, mindestensVerschieden: 20,
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
            `A7: die Zahlen passen nicht zur Bevölkerung — „${f}“`);
          // Der Kern: Die gesuchte Zahl ist klein, obwohl der Test gut ist.
          pruefe((100 * richtig) / gesamt < (100 * richtig) / kranke,
            `A7: P(krank | Test +) ist nicht kleiner als P(Test + | krank) — „${f}“`);
          pruefe(rueck.includes("zwei verschiedene Zahlen"),
            `A7: die Musterlösung stellt die beiden Richtungen nicht gegenüber — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 8 — beide Richtungen nebeneinander an zwei Maschinen. Gemessen: 182 verschiedene in
  // 200 Würfen, zurückgerechnet rund 1000 Kandidaten. Schranke: simuliertes 10⁻⁴-Quantil bei
  // 30 Zügen für 0,8 · n — 25.
  await pruefeAufgabe(page, bericht, {
    nr: 8, name: "A8 zwei Maschinen", runden: 30, mindestensVerschieden: 25,
    deute: (frage) => {
      const m = frage.match(/stellt (\d+) Teile her.*?Maschine B (\d+)\D.*?A sind (\d+) %.*?B (\d+) %/);
      if (!m) return null;
      const [a, b, pa, pb] = m.slice(1).map(Number);
      const da = (a * pa) / 100, db = (b * pb) / 100;
      pruefe(Number.isInteger(da) && Number.isInteger(db),
        `A8: ${pa} % von ${a} oder ${pb} % von ${b} ist kein ganzes Teil — „${frage}“`);
      pruefe(pa !== pb, `A8: beide Quoten sind ${pa} % — dann ist die Rückfrage stumpf — „${frage}“`);
      const defekt = da + db;
      return {
        felder: [defekt, pa, (100 * da) / defekt],
        toleranz: 0.01,
        falschFelder: [
          [0, da, "nur die defekten Teile der Maschine A"],
          [0, db, "nur die defekten Teile der Maschine B"],
          [0, ((a + b) * (pa + pb)) / 200, "mitteln"],
          [1, (100 * da) / defekt, "umgekehrte"],
          [1, (100 * da) / (a + b), "alle"],
          [2, pa, "andere Richtung"],
          [2, (100 * a) / (a + b), "ganzen"],
          [2, (100 * da) / (a + b), "alle"],
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
    if (!dunkel) { await umdrehen(page); await aufgaben(page); }
    else await pruefeKontrast(page, bericht, "dunkel");
    await pruefeNotation(page, bericht, wo);
    for (const s of page.stoerungen) pruefe(false, `${wo}: ${s}`);
    await page.close();
  }
  await browser.close();
  bericht.abschluss();
})();
