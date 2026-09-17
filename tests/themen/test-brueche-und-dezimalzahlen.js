// Fachliche Prüfung: Kapitel 1, Thema 3 „Brüche und Dezimalzahlen“.
//
// Die Aufgaben dieses Themas erwarten teils einen Bruch als Antwort und prüfen
// nicht auf einen Zahlenwert, sondern auf vollständige Kürzung. Genau das wird
// hier von beiden Seiten geprüft: Der gekürzte Bruch muss anerkannt werden,
// der wertgleiche ungekürzte nicht — und dabei muss der Hinweis erscheinen,
// dass der Wert zwar stimmt, der Bruch aber noch kürzbar ist.

"use strict";

const { neuerBericht } = require("../lib/pruefen");
const { starteBrowser, neueSeite, oeffne } = require("../lib/seite");
const { pruefeNotation } = require("../lib/notation");
const { pruefeKontrast } = require("../lib/kontrast");
const { pruefeAufgabe } = require("../lib/aufgaben");

const bericht = neuerBericht();
const { pruefe } = bericht;
const SEITE = "/mathematik/grundwissen-5-10/01-groessen-und-rechnen/03-brueche-und-dezimalzahlen/index.html";

function ggT(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { const h = a % b; a = b; b = h; } return a; }
function kuerze(z, n) { const g = ggT(z, n); return [z / g, n / g]; }

// Die Brüche stehen als übereinandergesetzte Elemente im Text; aus dem reinen
// Text ließen sich Zähler und Nenner nicht auseinanderhalten.
async function brueche(page, box) {
  return page.evaluate((sel) => ({
    brueche: [...document.querySelectorAll(`${sel} .aufgabe-prompt .bruch`)]
      .map((b) => [Number(b.querySelector(".z").textContent), Number(b.querySelector(".n").textContent)]),
    text: document.querySelector(`${sel} .aufgabe-prompt`).innerText.replace(/\s+/g, " ").trim(),
  }), box);
}

async function aufgaben(page) {
  // Aufgabe 1 — kürzen. 24 Stammbrüche × 5 Erweiterungsfaktoren = 120
  // Kandidaten; bei 40 Zügen ist E = 120·(1 − (119/120)^40) = 28,5 und
  // σ = 1,86 (n·p + n(n−1)q − n²p² mit p = (119/120)^40, q = (118/120)^40).
  // Schranke E − 3σ ≈ 22.
  await pruefeAufgabe(page, bericht, {
    nr: 1, name: "A1 kürzen", runden: 40, mindestensVerschieden: 22, liesRoh: brueche,
    deute: (frage, roh) => {
      if (!roh || roh.brueche.length < 1) return null;
      const [z, n] = roh.brueche[0];
      const [zk, nk] = kuerze(z, n);
      const g = ggT(z, n);
      // Ein echter Teiler des ggT führt auf einen wertgleichen, aber noch
      // kürzbaren Bruch — genau den Fall, den der Hinweis erklären soll.
      let teilKuerzung = null;
      for (let t = 2; t < g; t++) if (g % t === 0) { teilKuerzung = `${z / t}/${n / t}`; break; }
      return {
        richtig: `${zk}/${nk}`,
        falsch: [
          [teilKuerzung, "nicht vollständig gekürzt"],
          // Wertverschieden: Zähler und Nenner vertauscht.
          [zk === nk ? null : `${nk}/${zk}`, null],
        ],
      };
    },
  });

  // Aufgabe 3 — Anteil einer Größe. Gemessen mit tests/werkzeug-streuung.js: 193 verschiedene
  // in 200 Würfen, zurückgerechnet also rund 2776 Kandidaten. Die Schranke ist das simulierte
  // 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für 0,8 · n gerechnet — 27.
  await pruefeAufgabe(page, bericht, {
    nr: 3, name: "A3 Anteil einer Größe", runden: 30, mindestensVerschieden: 27, liesRoh: brueche,
    deute: (frage, roh) => {
      if (!roh || roh.brueche.length < 1) return null;
      const [z, n] = roh.brueche[0];
      const m = roh.text.match(/von ([\d.]+) (g|min|cm|€)/);
      if (!m) return null;
      const wert = Number(m[1].replace(/\./g, ""));
      return {
        richtig: (wert / n) * z,
        // Nur ein n-tel genommen, das Vervielfachen mit z vergessen.
        falsch: [[wert / n, null], [(wert / z) * n, null]],
      };
    },
  });

  // Aufgabe 5 — Dezimalzahl als Bruch. Gemessen mit tests/werkzeug-streuung.js: 23 verschiedene
  // in 200 Würfen, zurückgerechnet also rund 23 Kandidaten. Die Schranke ist das simulierte
  // 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für 0,8 · n gerechnet — 10.
  await pruefeAufgabe(page, bericht, {
    nr: 5, name: "A5 Dezimalzahl als Bruch", runden: 30, mindestensVerschieden: 10,
    deute: (frage) => {
      const m = frage.match(/Dezimalzahl (\d+),(\d+) als/);
      if (!m) return null;
      const nachkomma = m[2];
      const nenner = Math.pow(10, nachkomma.length);
      const zaehler = Number(nachkomma) + Number(m[1]) * nenner;
      const [zk, nk] = kuerze(zaehler, nenner);
      return {
        richtig: `${zk}/${nk}`,
        // Der ungekürzte Stellenwertbruch ist wertgleich, aber nicht die Lösung.
        falsch: [[zaehler === zk ? null : `${zaehler}/${nenner}`, "nicht vollständig gekürzt"]],
      };
    },
  });

  // Aufgabe 7 — Anteil vom Anteil. Gemessen mit tests/werkzeug-streuung.js: 184 verschiedene in
  // 200 Würfen, zurückgerechnet also rund 1177 Kandidaten. Die Schranke ist das simulierte
  // 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für 0,8 · n gerechnet — 26.
  await pruefeAufgabe(page, bericht, {
    nr: 7, name: "A7 Anteil vom Anteil", runden: 30, mindestensVerschieden: 26, liesRoh: brueche,
    deute: (frage, roh) => {
      if (!roh || roh.brueche.length < 2) return null;
      const [[z1, n1], [z2, n2]] = roh.brueche;
      const m = roh.text.match(/umfasst ([\d.]+) /);
      if (!m) return null;
      const gesamt = Number(m[1].replace(/\./g, ""));
      const zwischen = (gesamt / n1) * z1;
      return {
        richtig: (zwischen / n2) * z2,
        falsch: [
          // Der häufigste Fehler: den zweiten Anteil auf die Gesamtzahl beziehen.
          [(gesamt / n2) * z2, null],
          // Beim ersten Schritt stehen geblieben.
          [zwischen, null],
        ],
        pruefe: (f, rueck) => {
          pruefe(rueck.includes("Zwischenergebnis"),
            `A4: Musterlösung weist nicht auf das Zwischenergebnis hin — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 2 — erweitern. Gemessen mit tests/werkzeug-streuung.js: 118 verschiedene in 200 Würfen,
  // zurückgerechnet rund 171 Kandidaten (24 Stammbrüche · 7 Faktoren = 168). Die Schranke ist das
  // simulierte 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für 0,8 · n gerechnet — 21.
  await pruefeAufgabe(page, bericht, {
    nr: 2, name: "A2 erweitern", runden: 30, mindestensVerschieden: 21, liesRoh: brueche,
    deute: (frage, roh) => {
      if (!roh || roh.brueche.length < 1) return null;
      const [z, n] = roh.brueche[0];
      const m = roh.text.match(/Nenner (\d+) ist/);
      if (!m) return null;
      const nNeu = Number(m[1]);
      pruefe(nNeu % n === 0, `A2: ${nNeu} ist kein Vielfaches von ${n} — so lässt sich nicht erweitern`);
      const k = nNeu / n;
      return {
        richtig: `${z * k}/${nNeu}`,
        falsch: [
          // Nur den Nenner erweitert — der Wert stimmt dann nicht mehr.
          [`${z}/${nNeu}`, "derselben"],
          [`${z}/${n}`, "Ausgangsbruch"],
        ],
      };
    },
  });

  // Aufgabe 4 — gemischte Zahl (Aufgabe zum Ausfüllen). Gemessen mit tests/werkzeug-streuung.js:
  // 146 verschiedene in 200 Würfen, zurückgerechnet rund 299 Kandidaten. Die Schranke ist das
  // simulierte 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für 0,8 · n gerechnet — 23.
  await pruefeAufgabe(page, bericht, {
    nr: 4, name: "A4 gemischte Zahl", runden: 30, mindestensVerschieden: 23, liesRoh: brueche,
    deute: (frage, roh) => {
      if (!roh || roh.brueche.length < 1) return null;
      const [z, n] = roh.brueche[0];
      pruefe(z > n, `A4: ${z}/${n} ist kein unechter Bruch`);
      const ganze = Math.floor(z / n), rest = z - ganze * n;
      pruefe(rest > 0, `A4: ${z}/${n} geht ganz auf — dann gibt es keine gemischte Zahl`);
      return {
        felder: [ganze, rest],
        falschFelder: [
          [0, z, "Zähler"],
          [1, n + rest, "kleiner"],
        ],
      };
    },
  });

  // Aufgabe 6 — Brüche vergleichen. Gemessen mit tests/werkzeug-streuung.js: 182 verschiedene in
  // 200 Würfen, zurückgerechnet rund 1039 Kandidaten. Die Schranke ist das simulierte
  // 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für 0,8 · n gerechnet — 25.
  await pruefeAufgabe(page, bericht, {
    nr: 6, name: "A6 Brüche vergleichen", runden: 30, mindestensVerschieden: 25, liesRoh: brueche,
    deute: (frage, roh) => {
      if (!roh || roh.brueche.length !== 3) return null;
      const werte = roh.brueche.map(([z, n]) => z / n);
      pruefe(new Set(werte).size === 3, `A6: zwei der drei Brüche sind gleich groß — ${roh.brueche.map((b) => b.join("/")).join(", ")}`);
      const gross = roh.brueche[werte.indexOf(Math.max(...werte))];
      const klein = roh.brueche[werte.indexOf(Math.min(...werte))];
      return {
        richtig: `${gross[0]}/${gross[1]}`,
        falsch: [[`${klein[0]}/${klein[1]}`, "nicht der größte"]],
      };
    },
  });

  // Aufgabe 8 — Anteil, Dezimalzahl, Runden (Aufgabe zum Ausfüllen). Gemessen mit
  // tests/werkzeug-streuung.js: 140 verschiedene in 200 Würfen, zurückgerechnet rund 262
  // Kandidaten (9 Brüche · 28 Vielfache = 252). Die Schranke ist das simulierte 10⁻⁴-Quantil bei
  // 30 Zügen, vorsichtshalber für 0,8 · n gerechnet — 22.
  await pruefeAufgabe(page, bericht, {
    nr: 8, name: "A8 Anteil und Dezimalzahl", runden: 30, mindestensVerschieden: 22, liesRoh: brueche,
    deute: (frage, roh) => {
      if (!roh || roh.brueche.length < 1) return null;
      const [z, n] = roh.brueche[0];
      const m = roh.text.match(/sind ([\d.]+) Schülerinnen/);
      if (!m) return null;
      const gesamt = Number(m[1].replace(/\./g, ""));
      pruefe(gesamt % n === 0, `A8: ${gesamt} ist nicht durch ${n} teilbar — es gäbe keine ganze Anzahl`);
      const anzahl = (gesamt / n) * z;
      const anteil = z / n;
      return {
        toleranz: 0.0004,
        felder: [anzahl, anteil, Math.round(anteil * 10) / 10],
        falschFelder: [
          [0, gesamt / n, "ein"],
          [1, n / z, "vertauscht"],
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
