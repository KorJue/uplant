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

  // Aufgabe 2 — Anteil einer Größe. 24 Brüche × 4 Einheiten × 37 Werte = 3552
  // Kandidaten; bei 30 Zügen sind 30·29/(2·3552) ≈ 0,12 Doppel zu erwarten.
  await pruefeAufgabe(page, bericht, {
    nr: 2, name: "A2 Anteil einer Größe", runden: 30, mindestensVerschieden: 28, liesRoh: brueche,
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

  // Aufgabe 3 — Dezimalzahl als Bruch. 23 abbrechende Brüche; bei 30 Zügen
  // ist E = 23·(1 − (22/23)^30) = 16,9 und σ = 1,58 — Schranke ≈ 12.
  await pruefeAufgabe(page, bericht, {
    nr: 3, name: "A3 Dezimalzahl als Bruch", runden: 30, mindestensVerschieden: 12,
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

  // Aufgabe 4 — Anteil vom Anteil. 8 · 6 · 8 · 3 = 1152 Kandidaten;
  // bei 30 Zügen sind 30·29/(2·1152) ≈ 0,38 Doppel zu erwarten.
  await pruefeAufgabe(page, bericht, {
    nr: 4, name: "A4 Anteil vom Anteil", runden: 30, mindestensVerschieden: 27, liesRoh: brueche,
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
