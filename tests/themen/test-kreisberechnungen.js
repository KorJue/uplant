// Fachliche Prüfung: Kapitel 2, Thema 10 „Kreisberechnungen“.
//
// Der Kern ist die Unterscheidung von 2 · π · r und π · r² — und der Anteil
// α : 360°, mit dem beide Formeln auf den Ausschnitt übertragen werden. Beides
// wird doppelt geprüft: am Ausschnitts-Werkzeug, dessen gezeichneter Bogen dem
// eingestellten Winkel entsprechen muss, und an den Aufgaben, in denen jeweils
// die andere Formel als Antwort eingetragen wird.

"use strict";

const { neuerBericht } = require("../lib/pruefen");
const { starteBrowser, neueSeite, oeffne, setzeRegler, text } = require("../lib/seite");
const { pruefeNotation } = require("../lib/notation");
const { pruefeKontrast } = require("../lib/kontrast");
const { pruefeAufgabe } = require("../lib/aufgaben");

const bericht = neuerBericht();
const { pruefe } = bericht;
const SEITE = "/mathematik/grundwissen-5-10/02-geometrie/10-kreisberechnungen/index.html";

const de = (x, stellen = 4) => Number(x.toFixed(stellen)).toLocaleString("de-DE", { maximumFractionDigits: stellen });
function ggT(a, b) { return b === 0 ? a : ggT(b, a % b); }

// ── Kreisbogen und Kreisausschnitt ────────────────────────────────────────
// Der Regler stellt α in 15°-Schritten von 15° bis 345°. Geprüft wird die
// Bilanz — Anteil als gekürzter Bruch, Bogenlänge, Ausschnittsfläche — und
// dazu, dass der gezeichnete Bogen wirklich bei α endet.
async function ausschnitt(page) {
  const RP = 105, M = { x: 220, y: 140 };

  for (const r of [2, 5, 8]) {
    for (let alpha = 15; alpha <= 345; alpha += 15) {
      await setzeRegler(page, "as-r", r);
      await setzeRegler(page, "as-a", alpha);
      const wo = `r = ${r}, α = ${alpha}°`;

      const anteil = alpha / 360;
      const t = ggT(alpha, 360);
      const bruch = `${alpha / t}⁄${360 / t}`;
      const b = 2 * Math.PI * r * anteil;
      const As = Math.PI * r * r * anteil;

      const bilanz = await text(page, "#as-bilanz");
      pruefe(bilanz.includes(`${alpha}° : 360° = ${bruch} = ${de(anteil, 4)}`),
        `Ausschnitt: ${wo} — der Anteil steht nicht als ${bruch} in der Bilanz — „${bilanz}“`);
      pruefe(bilanz.includes(`${de(b, 2)} cm`),
        `Ausschnitt: ${wo} — die Bogenlänge ${de(b, 2)} cm fehlt — „${bilanz}“`);
      pruefe(bilanz.includes(`${de(As, 2)} cm²`),
        `Ausschnitt: ${wo} — die Ausschnittsfläche ${de(As, 2)} cm² fehlt — „${bilanz}“`);
      // Der Umfang des Ausschnitts ist der Bogen plus die beiden Radien —
      // die Stelle, an der das Thema erfahrungsgemäß schiefgeht.
      pruefe(bilanz.includes(`${de(b + 2 * r, 2)} cm`),
        `Ausschnitt: ${wo} — der Umfang b + 2r = ${de(b + 2 * r, 2)} cm fehlt — „${bilanz}“`);

      // Die Zeichnung muss den eingestellten Winkel zeigen, nicht irgendeinen.
      const d = await page.evaluate(() => document.querySelector("#as-mount .kr-bogen").getAttribute("d"));
      const zahlen = d.match(/-?\d+(?:\.\d+)?/g).map(Number);
      const [x1, y1, , , , gross, , x2, y2] = zahlen;
      const soll1 = { x: M.x + RP, y: M.y };
      const soll2 = { x: M.x + RP * Math.cos((alpha * Math.PI) / 180), y: M.y - RP * Math.sin((alpha * Math.PI) / 180) };
      pruefe(Math.abs(x1 - soll1.x) < 0.02 && Math.abs(y1 - soll1.y) < 0.02,
        `Ausschnitt: ${wo} — der Bogen beginnt bei (${x1}|${y1}) statt (${soll1.x}|${soll1.y})`);
      pruefe(Math.abs(x2 - soll2.x) < 0.02 && Math.abs(y2 - soll2.y) < 0.02,
        `Ausschnitt: ${wo} — der Bogen endet bei (${x2}|${y2}) statt (${soll2.x.toFixed(2)}|${soll2.y.toFixed(2)})`);
      // Ohne das large-arc-Flag zeichnete SVG bei α > 180° den kurzen Bogen —
      // das Bild zeigte dann einen anderen Winkel als der Regler.
      pruefe(gross === (alpha > 180 ? 1 : 0),
        `Ausschnitt: ${wo} — large-arc-flag ist ${gross}`);

      const satz = await text(page, "#as-text");
      if (alpha === 180) pruefe(satz.includes("Halbkreis"), `Ausschnitt: bei 180° fehlt der Halbkreis — „${satz}“`);
      if (alpha === 90) pruefe(satz.includes("Viertelkreis"), `Ausschnitt: bei 90° fehlt der Viertelkreis — „${satz}“`);
    }
  }
}

// ── Die Übungsaufgaben ─────────────────────────────────────────────────────
async function aufgaben(page) {
  // Aufgabe 1 — Vielfaches von π. 10 Radien × 2 Formen = 20 Fassungen; bei 30
  // Zügen ist E = 15,7 und σ = 1,4, das Quantil 10⁻⁴ liegt bei 10 — Schranke 9.
  await pruefeAufgabe(page, bericht, {
    nr: 1, name: "A1 Vielfaches von π", runden: 30, mindestensVerschieden: 9,
    deute: (frage) => {
      const m = frage.match(/r = (\d+) cm/);
      if (!m) return null;
      const r = Number(m[1]);
      const flaeche = frage.includes("Flächeninhalt");
      return {
        richtig: flaeche ? r * r : 2 * r,
        toleranz: 0.005,
        falsch: flaeche
          // Die Seite prüft beim Flächenfall zuerst 2r, dann r.
          ? [[2 * r, "Umfang"], [r, "r selbst eingetragen"]]
          : [[r, "Faktor"], [r * r, "Flächeninhalt"]],
        pruefe: (f) => {
          // r ≥ 3 hält r² und 2r auseinander; bei r = 2 wären beide 4 und die
          // Verwechslung der Formeln ließe sich nicht mehr diagnostizieren.
          pruefe(r * r !== 2 * r, `A1: bei r = ${r} ist r² = 2r — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 2 — Bogen und Ausschnittsfläche. 10 Radien × 7 Winkel × 2 Formen
  // = 140 Fassungen; bei 30 Zügen E = 27,1 und σ = 1,5, Quantil 10⁻⁴ bei 21.
  await pruefeAufgabe(page, bericht, {
    nr: 2, name: "A2 Bogen und Ausschnitt", runden: 30, mindestensVerschieden: 20,
    deute: (frage) => {
      const m = frage.match(/r = (\d+) cm.*?α = (\d+)°/);
      if (!m) return null;
      const r = Number(m[1]), alpha = Number(m[2]);
      const anteil = alpha / 360;
      const bogen = frage.includes("Kreisbogen");
      const wert = bogen ? 2 * Math.PI * r * anteil : Math.PI * r * r * anteil;
      return {
        richtig: wert,
        toleranz: 0.01,
        falsch: [
          // Den Anteil vergessen.
          [bogen ? 2 * Math.PI * r : Math.PI * r * r, "ganze Kreis"],
          // Die jeweils andere Formel genommen.
          [bogen ? Math.PI * r * r * anteil : 2 * Math.PI * r * anteil, bogen ? "Fläche" : "Bogenlänge"],
          // Beim Bogen die beiden Radien mitgezählt.
          [wert + 2 * r, "Radien mitgezählt"],
        ],
        pruefe: (f) => {
          // α ist stets ein Vielfaches von 45°, damit der Anteil exakt bleibt.
          pruefe(alpha % 45 === 0 && alpha < 360, `A2: α = ${alpha}° ist kein Achtel des Vollkreises — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 3 — rückwärts zum Radius. 12 Radien × 2 Formen = 24 Fassungen;
  // bei 30 Zügen E = 17,3 und σ = 1,6, Quantil 10⁻⁴ bei 11 — Schranke 10.
  await pruefeAufgabe(page, bericht, {
    nr: 3, name: "A3 Radius rückwärts", runden: 30, mindestensVerschieden: 10,
    deute: (frage) => {
      const ausUmfang = frage.includes("Umfang");
      const m = frage.match(/= ([\d.,]+) cm/);
      if (!m) return null;
      const gegeben = Number(m[1].replace(/\./g, "").replace(",", "."));
      // Aus GENAU der gestellten (gerundeten) Zahl rechnen — sonst weicht die
      // Lösung um mehr ab als die Toleranz erlaubt.
      const r = ausUmfang ? gegeben / (2 * Math.PI) : Math.sqrt(gegeben / Math.PI);
      return {
        richtig: r,
        toleranz: 0.01,
        falsch: ausUmfang
          ? [
              // Nur durch π geteilt: das ist der Durchmesser.
              [gegeben / Math.PI, "Durchmesser"],
              [gegeben * 2 * Math.PI, "multipliziert"],
            ]
          : [
              // Bei r² stehen geblieben.
              [gegeben / Math.PI, "Quadratwurzel"],
              // Wurzel und Division vertauscht.
              [Math.sqrt(gegeben) / Math.PI, "Reihenfolge"],
            ],
        pruefe: (f, rueck) => {
          pruefe(rueck.includes(ausUmfang ? "r = U : (2 · π)" : "r = √(A : π)"),
            `A3: die Musterlösung nennt die umgestellte Formel nicht — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 4 — Kreisring als Weg um einen Brunnen. 8 Durchmesser mit je 3
  // oder 4 Wegbreiten = 29 Fassungen; bei 30 Zügen E = 18,8 und σ = 1,7,
  // Quantil 10⁻⁴ bei 13 — Schranke 12.
  await pruefeAufgabe(page, bericht, {
    nr: 4, name: "A4 Kreisring", runden: 30, mindestensVerschieden: 12,
    deute: (frage) => {
      const m = frage.match(/d = (\d+) m.*?(\d+) m breiter/);
      if (!m) return null;
      const d = Number(m[1]), b = Number(m[2]);
      const ri = d / 2, ra = ri + b;
      return {
        richtig: Math.PI * (ra * ra - ri * ri),
        toleranz: 0.01,
        falsch: [
          [Math.PI * ra * ra, "gesamte"],
          [Math.PI * ri * ri, "Brunnens"],
          // Erst subtrahiert, dann quadriert.
          [Math.PI * b * b, "Erst"],
          // Mit dem Durchmesser statt dem Radius gerechnet.
          [Math.PI * ((d + b) * (d + b) - d * d), "Durchmesser"],
        ],
        pruefe: (f, rueck) => {
          pruefe(Number.isInteger(ri), `A4: der Innenradius ${ri} m ist nicht ganzzahlig — „${f}“`);
          // Bei b = r fielen π·b² und π·r² zusammen; die Aufgabe schließt das
          // aus, damit beide Fehler unterscheidbar bleiben.
          pruefe(b !== ri, `A4: Wegbreite und Innenradius sind beide ${b} m — „${f}“`);
          // Die Ringfläche ist exakt π · b · (d + b), also ein ganzzahliges
          // Vielfaches von π.
          pruefe(rueck.includes(`π · ${de(b * (d + b))}`),
            `A4: die Musterlösung nennt π · ${b * (d + b)} nicht — „${f}“`);
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
    if (!dunkel) { await ausschnitt(page); await aufgaben(page); }
    else await pruefeKontrast(page, bericht, "dunkel");
    await pruefeNotation(page, bericht, wo);
    for (const s of page.stoerungen) pruefe(false, `${wo}: ${s}`);
    await page.close();
  }
  await browser.close();
  bericht.abschluss();
})();
