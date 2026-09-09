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
  // Aufgabe 1 — Zahl der Pfade. 17 Kombinationen aus 6 Experimenten und den
  // Stufenzahlen 2 bis 4, gefiltert; simuliert man den Generator, ist bei 30
  // Zügen E = 11,1 und σ = 0,8, der beobachtete Kleinstwert liegt bei 8 —
  // Schranke 7.
  await pruefeAufgabe(page, bericht, {
    nr: 1, name: "A1 Pfadzahl", runden: 30, mindestensVerschieden: 7,
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

  // Aufgabe 2 — 1. Pfadregel mit Zurücklegen. 22 zulässige Urnen; bei 30 Zügen
  // E = 11,1 und σ = 0,8, Kleinstwert 7 — Schranke 6.
  await pruefeAufgabe(page, bericht, {
    nr: 2, name: "A2 Produktregel", runden: 30, mindestensVerschieden: 6,
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
          pruefe(Number.isInteger(proz), `A2: P = ${proz} % ist nicht ganzzahlig — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 3 — beide Pfadregeln ohne Zurücklegen. 29 zulässige Urnen; bei 30
  // Zügen E = 13,7 und σ = 1,2, Kleinstwert 10 — Schranke 9.
  await pruefeAufgabe(page, bericht, {
    nr: 3, name: "A3 beide Pfadregeln", runden: 30, mindestensVerschieden: 9,
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
          pruefe(Number.isInteger(proz), `A3: P = ${proz} % ist nicht ganzzahlig — „${f}“`);
          pruefe(proz > 0 && proz < 100, `A3: P = ${proz} % liegt nicht echt zwischen 0 und 100 — „${f}“`);
          // Beide Pfade müssen sichtbar sein, sonst ist die 2. Pfadregel nicht
          // nachvollziehbar.
          pruefe(rueck.includes("P(rot, blau)") && rueck.includes("P(blau, rot)"),
            `A3: die Musterlösung zeigt nicht beide Pfade — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 4 — zweistufiger Baum mit ungleichen Ästen. 252 Zahlentripel × 3
  // Kontexte; bei 30 Zügen E = 28,3 und σ = 1,2, Kleinstwert 24 — Schranke 23.
  await pruefeAufgabe(page, bericht, {
    nr: 4, name: "A4 ungleiche Äste", runden: 30, mindestensVerschieden: 23,
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
            `A4: ${a1 + a2} % liegt nicht zwischen ${q2} % und ${q1} % — „${f}“`);
          pruefe(q1 > q2, `A4: die beiden Raten ${q1} % und ${q2} % sind nicht verschieden geordnet — „${f}“`);
          // Der Mittelwert muss ausdrücklich als falsch benannt werden.
          pruefe(rueck.includes("falsch"),
            `A4: die Musterlösung warnt nicht vor dem Mittelwert — „${f}“`);
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
    if (!dunkel) { await zuruecklegen(page); await aufgaben(page); }
    else await pruefeKontrast(page, bericht, "dunkel");
    await pruefeNotation(page, bericht, wo);
    for (const s of page.stoerungen) pruefe(false, `${wo}: ${s}`);
    await page.close();
  }
  await browser.close();
  bericht.abschluss();
})();
