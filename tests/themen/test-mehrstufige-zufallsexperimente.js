// Fachliche Prüfung: Kapitel 3, Thema 3 „Mehrstufige Zufallsexperimente“.
//
// Der Kern sind die beiden Pfadregeln — entlang eines Pfades multiplizieren,
// über verschiedene Pfade addieren — und der Unterschied zwischen Ziehen mit
// und ohne Zurücklegen. Das Vergleichswerkzeug muss beides zugleich einlösen:
// Beide Bäume haben die Pfadsumme 1, aber ohne Zurücklegen wird „zweimal
// dieselbe Farbe“ unwahrscheinlicher und „gemischt“ wahrscheinlicher.

"use strict";

const { neuerBericht } = require("../lib/pruefen");
const { starteBrowser, neueSeite, oeffne, setzeRegler, text } = require("../lib/seite");
const { pruefeNotation } = require("../lib/notation");
const { pruefeKontrast } = require("../lib/kontrast");
const { pruefeAufgabe } = require("../lib/aufgaben");

const bericht = neuerBericht();
const { pruefe } = bericht;
const SEITE = "/mathematik/grundwissen-5-10/03-daten-und-zufall/03-mehrstufige-zufallsexperimente/index.html";

const de = (x, stellen = 4) => Number(x.toFixed(stellen)).toLocaleString("de-DE", { maximumFractionDigits: stellen });
const zeichen = (x, stellen = 2) => {
  const f = Math.pow(10, stellen);
  return Math.abs(x - Math.round(x * f) / f) < 1e-12 ? "=" : "≈";
};

// ── Mit und ohne Zurücklegen ──────────────────────────────────────────────
async function zuruecklegen(page) {
  for (let rot = 1; rot <= 8; rot++) {
    for (const blau of [1, 3, 5, 8]) {
      await setzeRegler(page, "zz-rot", rot);
      await setzeRegler(page, "zz-blau", blau);
      const n = rot + blau, wo = `${rot} rot, ${blau} blau`;
      const anz = { rot, blau };

      const zeilen = await page.evaluate(() => [...document.querySelectorAll("#zz-tabelle tr")]
        .map((z) => z.innerText.replace(/\s+/g, " ").trim()));
      pruefe(zeilen.length === 6, `Zurücklegen: ${wo} — ${zeilen.length} Tabellenzeilen statt 6`);

      const paare = [["rot", "rot"], ["rot", "blau"], ["blau", "rot"], ["blau", "blau"]];
      let sMit = 0, sOhne = 0;
      paare.forEach(([a, b], i) => {
        const zMit = anz[a] * anz[b];
        const zOhne = anz[a] * (a === b ? anz[b] - 1 : anz[b]);
        const pMit = zMit / (n * n), pOhne = zOhne / (n * (n - 1));
        sMit += pMit; sOhne += pOhne;
        const zeile = zeilen[i + 1] || "";
        pruefe(zeile.includes(`${de(zMit)} : ${de(n * n)} ${zeichen(pMit, 4)} ${de(pMit, 4)}`),
          `Zurücklegen: ${wo} — „${a}, ${b}“ mit Zurücklegen stimmt nicht — „${zeile}“`);
        pruefe(zeile.includes(`${de(zOhne)} : ${de(n * (n - 1))} ${zeichen(pOhne, 4)} ${de(pOhne, 4)}`),
          `Zurücklegen: ${wo} — „${a}, ${b}“ ohne Zurücklegen stimmt nicht — „${zeile}“`);
        // Die Aussage des Abschnitts: gleiche Farben werden seltener,
        // gemischte häufiger.
        if (a === b) {
          pruefe(pOhne <= pMit + 1e-12,
            `Zurücklegen: ${wo} — P(${a}, ${b}) ist ohne Zurücklegen nicht kleiner (${pOhne} statt ≤ ${pMit})`);
        } else {
          pruefe(pOhne >= pMit - 1e-12,
            `Zurücklegen: ${wo} — P(${a}, ${b}) ist ohne Zurücklegen nicht größer (${pOhne} statt ≥ ${pMit})`);
        }
      });

      // Beide Bäume sind vollständig: Die Pfadwahrscheinlichkeiten ergeben 1.
      pruefe(Math.abs(sMit - 1) < 1e-9 && Math.abs(sOhne - 1) < 1e-9,
        `Zurücklegen: ${wo} — die Pfadsummen sind ${sMit} und ${sOhne}, nicht 1`);
      pruefe((zeilen[5] || "").includes("1"), `Zurücklegen: ${wo} — die Summenzeile zeigt nicht 1 — „${zeilen[5]}“`);

      const bilanz = await text(page, "#zz-bilanz");
      if (rot === 1) {
        // Mit nur einer roten Kugel ist „zweimal rot“ ohne Zurücklegen
        // unmöglich — das darf nicht als „kleiner“ verharmlost werden.
        pruefe(bilanz.includes("unmöglich"),
          `Zurücklegen: ${wo} — bei einer roten Kugel fehlt die Aussage „unmöglich“ — „${bilanz}“`);
      } else {
        pruefe(bilanz.includes("Pfadsumme 1"),
          `Zurücklegen: ${wo} — die Bilanz erwähnt die Pfadsumme nicht — „${bilanz}“`);
      }
    }
  }
}

// ── Die Übungsaufgaben ─────────────────────────────────────────────────────
async function aufgaben(page) {
  // Aufgabe 1 — Zahl der Pfade. Gemessen mit tests/werkzeug-streuung.js: 12 verschiedene in 200
  // Würfen, zurückgerechnet also rund 12 Kandidaten. Die Schranke ist das simulierte
  // 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für 0,8 · n gerechnet — 6.
  await pruefeAufgabe(page, bericht, {
    nr: 1, name: "A1 Pfadzahl", runden: 30, mindestensVerschieden: 6,
    deute: (frage) => {
      const m = frage.match(/(\d+)-mal nacheinander.*?Jede Stufe hat (\d+) mögliche/);
      if (!m) return null;
      const k = Number(m[1]), basis = Number(m[2]);
      return {
        richtig: Math.pow(basis, k),
        toleranz: 0.005,
        falsch: [
          // Die Äste gezählt statt der Pfade.
          [basis * k, "Äste"],
          [basis + k, "Addieren"],
          // Basis und Exponent vertauscht.
          [Math.pow(k, basis), "Basis und Exponent"],
          [basis, "einzelnen"],
        ],
        pruefe: (f, rueck) => {
          pruefe(Math.pow(basis, k) <= 1296,
            `A1: ${basis}^${k} = ${Math.pow(basis, k)} überschreitet die vorgesehene Grenze — „${f}“`);
          // Die Musterlösung muss das Produkt ausschreiben, nicht nur die Potenz.
          pruefe(rueck.includes(Array(k).fill(String(basis)).join(" · ")),
            `A1: die Musterlösung schreibt ${basis}^${k} nicht als Produkt aus — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 2 — Zählprinzip bei Stufen verschiedener Größe. Gemessen mit tests/werkzeug-streuung.js:
  // 170 verschiedene in 200 Würfen, zurückgerechnet rund 600 Kandidaten. Die Schranke ist das
  // simulierte 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für 0,8 · n gerechnet — 24.
  await pruefeAufgabe(page, bericht, {
    nr: 2, name: "A2 Stufen verschiedener Größe", runden: 30, mindestensVerschieden: 24,
    deute: (frage) => {
      const m = frage.match(/(\d+) \S+, (\d+) \S+ und (\d+) \S+/);
      if (!m) return null;
      const [a, b, c] = m.slice(1).map(Number);
      // Die drei Zahlen müssen verschieden sein, sonst fallen Fehlerwerte zusammen.
      pruefe(a !== b && b !== c && a !== c, `A2: zwei Stufen sind gleich groß (${a}/${b}/${c}) — „${frage}“`);
      return {
        felder: [a * b, a * b * c],
        toleranz: 0.005,
        falschFelder: [
          [0, a + b, "addiert"],
          [0, a * b * c, "alle drei Stufen"],
          [1, a + b + c, "multipliziert"],
          [1, a * b, "ersten beiden"],
        ],
      };
    },
  });

  // Aufgabe 3 — 1. Pfadregel mit Zurücklegen. 22 zulässige Urnen; bei 30 Zügen
  // E = 11,1 und σ = 0,8, Kleinstwert 7 — Schranke 6.
  await pruefeAufgabe(page, bericht, {
    nr: 3, name: "A3 Produktregel", runden: 30, mindestensVerschieden: 6,
    deute: (frage) => {
      const m = frage.match(/(\d+) rote.*?(\d+) blaue/);
      if (!m) return null;
      const r = Number(m[1]), b = Number(m[2]), n = r + b;
      const proz = (r * b * 100) / (n * n);
      return {
        richtig: proz,
        toleranz: 0.02,
        falsch: [
          // Beide Reihenfolgen zusammengezählt, obwohl nur ein Pfad gefragt ist.
          [2 * proz, "beide Reihenfolgen"],
          [(r * 100) / n, "einzelnen"],
          // P(rot) und P(blau) addiert — das ergibt immer 100 %.
          [100, "addiert"],
          // Ohne Zurücklegen gerechnet.
          [(r * b * 100) / (n * (n - 1)), "ohne"],
        ],
        pruefe: (f) => {
          // Konstruktiv: der Prozentsatz muss ganzzahlig sein.
          pruefe(Number.isInteger(proz), `A3: P = ${proz} % ist nicht ganzzahlig — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 4 — „mindestens einmal“ über das Gegenereignis. Gemessen: 28 verschiedene in 200
  // Würfen. Schranke: simuliertes 10⁻⁴-Quantil bei 30 Zügen für 0,8 · n — 11.
  const geraete = new Set();
  await pruefeAufgabe(page, bericht, {
    nr: 4, name: "A4 mindestens einmal", runden: 30, mindestensVerschieden: 11,
    deute: (frage) => {
      const mk = frage.match(/(\d+)-mal (?:geworfen|gedreht)/);
      if (!mk) return null;
      const k = Number(mk[1]);
      // p wird unabhängig aus dem Aufbau gelesen, nicht aus einer Angabe der Seite übernommen.
      let p = null;
      const rad = frage.match(/mit (\d+) gleich großen Feldern, von denen (eines|\d+)/);
      if (rad) p = (rad[2] === "eines" ? 1 : Number(rad[2])) / Number(rad[1]);
      else if (/mindestens einmal eine 6 /.test(frage)) p = 1 / 6;
      else if (/eine 5 oder eine 6/.test(frage)) p = 2 / 6;
      else if (/eine gerade Zahl/.test(frage)) p = 3 / 6;
      else if (/mindestens einmal Kopf/.test(frage)) p = 1 / 2;
      if (p === null) { pruefe(false, `A4: der Aufbau ist nicht lesbar — „${frage}“`); return null; }
      geraete.add(String(p));
      const nie = Math.pow(1 - p, k) * 100;
      return {
        felder: [nie, 100 - nie],
        toleranz: 0.01,
        falschFelder: [
          [0, Math.pow(p, k) * 100, "jedes Mal"],
          [0, (1 - p) * 100, "eine"],
          [1, nie, "Gegenereignis"],
          [1, k * p * 100, "addiert"],
          [1, Math.pow(p, k) * 100, "jedes Mal"],
        ],
      };
    },
  });
  pruefe(geraete.size >= 4, `A4: nur ${geraete.size} verschiedene Einzelwahrscheinlichkeiten in 30 Zügen`);

  // Aufgabe 5 — beide Pfadregeln ohne Zurücklegen. Gemessen mit tests/werkzeug-streuung.js: 16
  // verschiedene in 200 Würfen, zurückgerechnet also rund 16 Kandidaten. Die Schranke ist das
  // simulierte 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für 0,8 · n gerechnet — 8.
  await pruefeAufgabe(page, bericht, {
    nr: 5, name: "A5 beide Pfadregeln", runden: 30, mindestensVerschieden: 8,
    deute: (frage) => {
      const m = frage.match(/(\d+) rote.*?(\d+) blaue/);
      if (!m) return null;
      const r = Number(m[1]), b = Number(m[2]), n = r + b;
      const proz = (200 * r * b) / (n * (n - 1));
      return {
        richtig: proz,
        toleranz: 0.02,
        falsch: [
          // Nur einen der beiden günstigen Pfade gerechnet.
          [proz / 2, "2. Pfadregel"],
          // In beiden Stufen denselben Nenner benutzt.
          [(200 * r * b) / (n * n), "mit"],
          [(100 * r * (r - 1)) / (n * (n - 1)), "beide rot"],
          [(100 * r) / n, "einzelnen Zug"],
        ],
        pruefe: (f, rueck) => {
          pruefe(Number.isInteger(proz), `A5: P = ${proz} % ist nicht ganzzahlig — „${f}“`);
          pruefe(proz > 0 && proz < 100, `A5: P = ${proz} % liegt nicht echt zwischen 0 und 100 — „${f}“`);
          // Beide Pfade müssen sichtbar sein, sonst ist die 2. Pfadregel nicht
          // nachvollziehbar.
          pruefe(rueck.includes("P(rot, blau)") && rueck.includes("P(blau, rot)"),
            `A5: die Musterlösung zeigt nicht beide Pfade — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 6 — zwei gleichfarbige Kugeln ohne Zurücklegen. Gemessen: 42 verschiedene in 200
  // Würfen. Schranke: simuliertes 10⁻⁴-Quantil bei 30 Zügen für 0,8 · n — 14.
  await pruefeAufgabe(page, bericht, {
    nr: 6, name: "A6 gleiche Farben", runden: 30, mindestensVerschieden: 14,
    deute: (frage) => {
      const m = frage.match(/(\d+) rote.*?(\d+) blaue/);
      if (!m) return null;
      const r = Number(m[1]), b = Number(m[2]);
      const n = r + b;
      const nenner = n * (n - 1);
      const rr = (r * (r - 1) * 100) / nenner;
      const bb = (b * (b - 1) * 100) / nenner;
      pruefe(r >= 2 && b >= 2, `A6: mit ${r} roten und ${b} blauen Kugeln ist ein Paar nicht möglich`);
      return {
        felder: [rr, bb, rr + bb],
        toleranz: 0.01,
        falschFelder: [
          [0, (r * r * 100) / (n * n), "zweiten Zug"],
          [0, (r * 100) / n, "einzelnen"],
          [1, rr, "beide rot"],
          [1, (b * b * 100) / (n * n), "zweiten Zug"],
          [2, rr, "zwei Pfade"],
          [2, 100 - rr - bb, "verschiedene"],
        ],
      };
    },
  });

  // Aufgabe 7 — zweistufiger Baum mit ungleichen Ästen. Gemessen mit
  // tests/werkzeug-streuung.js: 143 verschiedene in 200 Würfen, zurückgerechnet also rund 279
  // Kandidaten. Die Schranke ist das simulierte 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für
  // 0,8 · n gerechnet — 22.
  await pruefeAufgabe(page, bericht, {
    nr: 7, name: "A7 ungleiche Äste", runden: 30, mindestensVerschieden: 22,
    deute: (frage) => {
      // Alle drei Kontexte nennen die drei Prozentsätze in derselben
      // Reihenfolge: Gewicht des ersten Zweigs, dann seine beiden Trefferraten.
      const werte = (frage.match(/(\d+) %/g) || []).map((s) => Number(s.replace(" %", "")));
      if (werte.length !== 3) return null;
      const [p, q1, q2] = werte;
      const a1 = (p * q1) / 100, a2 = ((100 - p) * q2) / 100;
      return {
        richtig: a1 + a2,
        toleranz: 0.02,
        falsch: [
          // Der klassische Fehler: die beiden Raten gemittelt statt gewichtet.
          [(q1 + q2) / 2, "gemittelt"],
          [a1, "nur der Pfad"],
          [a2, "fehlt noch"],
          // Die Prozentsätze der zweiten Stufe einfach addiert.
          [q1 + q2, "nicht einfach addieren"],
        ],
        pruefe: (f, rueck) => {
          // Der gewichtete Wert liegt stets zwischen den beiden Raten — sonst
          // stimmte etwas an der Gewichtung nicht.
          pruefe(a1 + a2 >= Math.min(q1, q2) - 1e-9 && a1 + a2 <= Math.max(q1, q2) + 1e-9,
            `A7: ${a1 + a2} % liegt nicht zwischen ${q2} % und ${q1} % — „${f}“`);
          pruefe(q1 > q2, `A7: die beiden Raten ${q1} % und ${q2} % sind nicht verschieden geordnet — „${f}“`);
          // Der Mittelwert muss ausdrücklich als falsch benannt werden.
          pruefe(rueck.includes("falsch"),
            `A7: die Musterlösung warnt nicht vor dem Mittelwert — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 8 — zwei Drehungen, dann der Sprung zur erwarteten Anzahl. Gemessen: 109 verschiedene
  // in 200 Würfen, zurückgerechnet rund 146 Kandidaten. Schranke: simuliertes 10⁻⁴-Quantil bei
  // 30 Zügen für 0,8 · n — 20.
  await pruefeAufgabe(page, bericht, {
    nr: 8, name: "A8 zwei Drehungen", runden: 30, mindestensVerschieden: 20,
    deute: (frage) => {
      const m = frage.match(/(\d+) gleich große.*?Felder; (\d+) davon.*?(\d+) Runden/);
      if (!m) return null;
      const [n, g, runden] = m.slice(1).map(Number);
      const p = g / n;
      const zweimal = p * p * 100;
      const keinmal = (1 - p) * (1 - p) * 100;
      pruefe(g > 0 && g < n, `A8: ${g} von ${n} Feldern ist kein echtes Ereignis — „${frage}“`);
      // Ganzzahlig nachgerechnet — über den Prozentwert käme 64,00000000000001 heraus.
      const erwartet = (runden * g * g) / (n * n);
      pruefe(Number.isInteger(erwartet),
        `A8: die erwartete Anzahl ${erwartet} ist nicht ganzzahlig — „${frage}“`);
      return {
        felder: [zweimal, 100 - keinmal, erwartet],
        toleranz: 0.01,
        falschFelder: [
          [0, p * 100, "eine"],
          [0, 2 * p * 100, "verdoppelt"],
          [0, keinmal, "keinen"],
          [1, keinmal, "Gegenereignis"],
          [1, zweimal, "zweimal Gewinn"],
          [2, zweimal, "Prozentsatz"],
          [2, runden, "alle"],
          [2, (runden * (100 - keinmal)) / 100, "mindestens"],
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
    if (!dunkel) { await zuruecklegen(page); await aufgaben(page); }
    else await pruefeKontrast(page, bericht, "dunkel");
    await pruefeNotation(page, bericht, wo);
    for (const s of page.stoerungen) pruefe(false, `${wo}: ${s}`);
    await page.close();
  }
  await browser.close();
  bericht.abschluss();
})();
