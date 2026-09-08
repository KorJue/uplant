// Fachliche Prüfung: Kapitel 4, Thema 1 „Zuordnungen“.
//
// Der Kern ist die Unterscheidung dreier Fälle: y : x konstant (proportional),
// x · y konstant (antiproportional) und weder noch. Der Dreisatz gilt nur im
// ersten Fall — und genau das prüfen die Aufgaben, indem sie den falsch
// angewandten Dreisatz als Antwort eintragen.
//
// Am antiproportionalen Werkzeug wird zusätzlich geprüft, dass der Regler
// nicht lügt: Er rastet auf Teiler der Gesamtarbeit ein, und der eingerastete
// Wert muss auch im Regler selbst stehen.

"use strict";

const { neuerBericht } = require("../lib/pruefen");
const { starteBrowser, neueSeite, oeffne, setzeRegler, text } = require("../lib/seite");
const { pruefeNotation } = require("../lib/notation");
const { pruefeKontrast } = require("../lib/kontrast");
const { pruefeAufgabe } = require("../lib/aufgaben");

const bericht = neuerBericht();
const { pruefe } = bericht;
const SEITE = "/mathematik/grundwissen-5-10/04-gleichungen-zuordnungen-funktionen/01-zuordnungen/index.html";

const de = (x, stellen = 4) => Number(x.toFixed(stellen)).toLocaleString("de-DE", { maximumFractionDigits: stellen });
const teiler = (k, grenze) => {
  const out = [];
  for (let t = 1; t <= Math.min(k, grenze); t++) if (k % t === 0) out.push(t);
  return out;
};

// ── Das antiproportionale Werkzeug ────────────────────────────────────────
async function antiproportional(page) {
  for (let k = 12; k <= 72; k += 6) {
    const moeglich = teiler(k, 12);
    for (let roh = 1; roh <= 12; roh++) {
      await setzeRegler(page, "ap-k", k);
      const stand = await setzeRegler(page, "ap-x", roh);
      const wo = `k = ${k}, Regler auf ${roh}`;

      // Eingerastet wird auf den nächstgelegenen Teiler; bei Gleichstand
      // gewinnt der zuerst geprüfte, also der kleinere.
      const x = moeglich.reduce((a, b) => (Math.abs(b - roh) < Math.abs(a - roh) ? b : a), moeglich[0]);
      const y = k / x;

      // Ein Regler darf nichts anderes anzeigen als das, womit gerechnet wird.
      pruefe(stand === x, `Antiproportional: ${wo} — der Regler steht auf ${stand}, gerechnet wird mit ${x}`);
      const anzeige = await text(page, "#ap-x-anzeige");
      pruefe(anzeige.includes(`${de(x)} Arbeiter`), `Antiproportional: ${wo} — die Anzeige lautet „${anzeige}“`);
      pruefe(k % x === 0, `Antiproportional: ${wo} — ${x} ist kein Teiler von ${k}, die Tage wären krumm`);

      const karten = await page.evaluate(() => [...document.querySelectorAll("#ap-karten .zo-karte")]
        .map((c) => c.innerText.replace(/\s+/g, " ").trim()));
      pruefe(karten.length === 4, `Antiproportional: ${wo} — ${karten.length} Karten statt 4`);
      pruefe(karten[2] && karten[2].includes(`${de(y)} Tag`),
        `Antiproportional: ${wo} — die Zeitkarte zeigt nicht ${y} — „${karten[2]}“`);

      const bilanz = await text(page, "#ap-bilanz");
      pruefe(bilanz.includes(`${de(x)} · ${de(y)} = ${de(k)}`),
        `Antiproportional: ${wo} — die Bilanz zeigt nicht ${x} · ${y} = ${k} — „${bilanz}“`);
      // Die Verdopplungsaussage darf nur stehen, wenn die doppelte
      // Arbeiterzahl auch wirklich ganze Tage ergibt.
      pruefe(bilanz.includes("halbiert sich die Zeit") === moeglich.includes(2 * x),
        `Antiproportional: ${wo} — die Aussage über das Verdoppeln passt nicht zu den Teilern`);
      // Der Graph erreicht die Achsen nie — die Aussage gehört zur Hyperbel.
      pruefe(bilanz.includes("keine der beiden Achsen"),
        `Antiproportional: ${wo} — die Bilanz sagt nichts über die Asymptoten — „${bilanz}“`);

      // Gezeichnet wird nur, was in den Ausschnitt passt; jeder gezeichnete
      // Punkt gehört zu einem Teiler.
      const punkte = await page.evaluate(() => document.querySelectorAll("#ap-mount .zo-punkt.anti").length);
      const sichtbar = moeglich.filter((t) => k / t <= k + 4).length;
      pruefe(punkte === sichtbar + 1,
        `Antiproportional: ${wo} — ${punkte} Punkte gezeichnet, erwartet ${sichtbar} + 1 hervorgehobener`);
    }
  }
}

// ── Die Übungsaufgaben ─────────────────────────────────────────────────────
async function aufgaben(page) {
  // Aufgabe 1 — proportionaler Dreisatz. 551 zulässige Zahlentripel × mehrere
  // Waren; bei 30 Zügen sind höchstens 435 : 551 ≈ 0,8 Doppel zu erwarten —
  // Schranke 27.
  await pruefeAufgabe(page, bericht, {
    nr: 1, name: "A1 proportionaler Dreisatz", runden: 30, mindestensVerschieden: 27,
    deute: (frage) => {
      const m = frage.match(/^(\d+) .*? kosten ([\d.,]+) €.*?Was kosten (\d+) /);
      if (!m) return null;
      const a = Number(m[1]);
      const preisA = Number(m[2].replace(/\./g, "").replace(",", "."));
      const b = Number(m[3]);
      const stueck = preisA / a;
      return {
        richtig: stueck * b,
        toleranz: 0.005,
        falsch: [
          // Beim Stückpreis stehen geblieben.
          [stueck, "für ein Stück"],
          // Den Unterschied addiert statt zu vervielfachen.
          [preisA + b - a, "addiert"],
          // Die beiden Anzahlen vertauscht.
          [(preisA * a) / b, "vertauscht"],
        ],
        pruefe: (f, rueck) => {
          pruefe(Number.isInteger(stueck), `A1: der Stückpreis ${stueck} € ist nicht ganzzahlig — „${f}“`);
          pruefe(a !== b, `A1: gegebene und gesuchte Anzahl sind beide ${a} — „${f}“`);
          // Die Probe muss die Richtung des Ergebnisses begründen.
          pruefe(rueck.includes(b > a ? "muss das Ergebnis größer" : "muss das Ergebnis kleiner"),
            `A1: die Probe begründet die Richtung nicht — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 2 — antiproportionaler Dreisatz. 363 Tripel × 3 Kontexte;
  // bei 30 Zügen ≈ 0,4 Doppel — Schranke 27.
  await pruefeAufgabe(page, bericht, {
    nr: 2, name: "A2 antiproportionaler Dreisatz", runden: 30, mindestensVerschieden: 27,
    deute: (frage) => {
      const m = frage.match(/^(\d+) \D+ (\d+) (Tage|Stunden)[\s\S]*?brauchen (\d+) /);
      if (!m) return null;
      const a = Number(m[1]), tageA = Number(m[2]), b = Number(m[4]);
      const k = a * tageA;
      return {
        richtig: k / b,
        toleranz: 0.005,
        falsch: [
          // Wie bei einer proportionalen Zuordnung gerechnet.
          [(tageA * b) / a, "proportionalen"],
          // Bei der Gesamtarbeit stehen geblieben.
          [k, "Gesamtarbeit"],
          [tageA + b - a, "dazugerechnet"],
        ],
        pruefe: (f, rueck) => {
          pruefe(Number.isInteger(k / b), `A2: ${k} : ${b} = ${k / b} ist nicht ganzzahlig — „${f}“`);
          // Die Probe des antiproportionalen Falls: gleiches Produkt.
          pruefe(rueck.includes(`${de(b)} · ${de(k / b)} = ${de(k)}`),
            `A2: die Probe zeigt das gemeinsame Produkt ${k} nicht — „${f}“`);
          pruefe(rueck.includes(b > a ? "muss das Ergebnis kleiner" : "muss das Ergebnis größer"),
            `A2: die Probe begründet die Richtung nicht — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 3 — Art bestimmen und ergänzen. 53 zulässige Tabellen; bei 30
  // Zügen ist E = 23,1 und σ = 1,9, die Schranke E − 3σ liegt bei 17.
  await pruefeAufgabe(page, bericht, {
    nr: 3, name: "A3 Art bestimmen", runden: 30, mindestensVerschieden: 17,
    liesRoh: (page2, box) => page2.evaluate((sel) => {
      const t = document.querySelector(`${sel} .aufgabe-prompt table.zo-tabelle`);
      if (!t) return null;
      // Die Tabelle hat nur zwei Zeilen — die Beschriftung steht im <caption>
      // und zählt nicht als Zeile mit.
      if (t.rows.length !== 2) return null;
      const zeile = (i) => [...t.rows[i].cells].slice(1).map((c) => c.textContent.trim());
      return { titel: t.querySelector("caption").textContent, xs: zeile(0), ys: zeile(1) };
    }, box),
    deute: (frage, roh) => {
      if (!roh || roh.xs.length !== 4) return null;
      const xs = roh.xs.map((s) => Number(s.replace(",", ".")));
      const luecke = roh.ys.findIndex((s) => s === "?");
      if (luecke < 1) return null;
      const ys = roh.ys.map((s) => (s === "?" ? null : Number(s.replace(".", "").replace(",", "."))));

      // Die Art wird aus den bekannten Spalten selbst erschlossen, nicht dem
      // Aufgabentext geglaubt.
      const bekannt = xs.map((x, i) => [x, ys[i]]).filter(([, y]) => y !== null);
      const produkte = bekannt.map(([x, y]) => x * y);
      const quotienten = bekannt.map(([x, y]) => y / x);
      const gleich = (v) => v.every((w) => Math.abs(w - v[0]) < 1e-9);
      const anti = gleich(produkte);
      if (!anti && !gleich(quotienten)) return null;
      const k = anti ? produkte[0] : quotienten[0];
      const x = xs[luecke], vor = xs[luecke - 1], yVor = ys[luecke - 1];
      const falscheArt = anti ? (yVor * x) / vor : (yVor * vor) / x;

      return {
        richtig: anti ? k / x : k * x,
        toleranz: 0.005,
        falsch: [
          [falscheArt, anti ? "für proportional gehalten" : "für antiproportional gehalten"],
          [k, anti ? "gemeinsame Produkt" : "gemeinsame Quotient"],
        ],
        pruefe: (f) => {
          // Genau eine der beiden Proben darf aufgehen — sonst wäre die Art
          // nicht bestimmbar.
          pruefe(gleich(produkte) !== gleich(quotienten),
            `A3: die Tabelle ist zugleich proportional und antiproportional (oder keines) — „${f}“`);
          pruefe(luecke === 2, `A3: die Lücke steht an Stelle ${luecke + 1}, erwartet die dritte — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 4 — Grundpreis und Stückpreis. Mehrere tausend Fassungen × 3
  // Kontexte; Doppel sind bei 30 Zügen praktisch ausgeschlossen.
  await pruefeAufgabe(page, bericht, {
    nr: 4, name: "A4 Grundpreis", runden: 30, mindestensVerschieden: 28,
    deute: (frage) => {
      // Alle drei Kontexte nennen die Zahlen in derselben Reihenfolge:
      // s₁, c₁, s₂, c₂ und zuletzt die gesuchte Größe s₃.
      const alle = (frage.replace(/\./g, "").match(/\d+(?:,\d+)?/g) || []).map((s) => Number(s.replace(",", ".")));
      if (alle.length < 5) return null;
      const [s1, c1, s2, c2] = alle;
      const s3 = alle[alle.length - 1];
      const p = (c2 - c1) / (s2 - s1);
      const g = c1 - s1 * p;
      if (!Number.isFinite(p) || !Number.isFinite(g)) return null;
      return {
        richtig: g + p * s3,
        toleranz: 0.005,
        falsch: [
          // Der Dreisatz, der hier nicht gilt.
          [(c1 / s1) * s3, "nicht proportional"],
          // Den Grundpreis vergessen.
          [p * s3, "kommt noch dazu"],
          // Die beiden gegebenen Preise addiert.
          [c1 + c2, "nicht addieren"],
        ],
        pruefe: (f, rueck) => {
          pruefe(Number.isInteger(p) && Number.isInteger(g),
            `A4: Stückpreis ${p} € und Grundpreis ${g} € sind nicht beide ganzzahlig — „${f}“`);
          pruefe(g > 0, `A4: ohne Grundpreis (${g} €) wäre die Zuordnung doch proportional — „${f}“`);
          // Beide gegebenen Angaben müssen zu derselben Geraden gehören.
          pruefe(Math.abs(g + p * s2 - c2) < 1e-9,
            `A4: die zweite Angabe passt nicht zu y = ${g} + ${p}x — „${f}“`);
          pruefe(rueck.includes("nicht proportional"),
            `A4: die Musterlösung sagt nicht, warum der Dreisatz hier nicht gilt — „${f}“`);
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
    if (!dunkel) { await antiproportional(page); await aufgaben(page); }
    else await pruefeKontrast(page, bericht, "dunkel");
    await pruefeNotation(page, bericht, wo);
    for (const s of page.stoerungen) pruefe(false, `${wo}: ${s}`);
    await page.close();
  }
  await browser.close();
  bericht.abschluss();
})();
