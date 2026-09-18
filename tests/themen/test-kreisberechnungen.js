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

  // Aufgabe 2 — Umfang aus dem Durchmesser. Gemessen mit tests/werkzeug-streuung.js: 56
  // verschiedene in 200 Würfen, zurückgerechnet rund 58 Kandidaten. Die Schranke ist das
  // simulierte 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für 0,8 · n gerechnet — 15.
  await pruefeAufgabe(page, bericht, {
    nr: 2, name: "A2 Umfang aus dem Durchmesser", runden: 30, mindestensVerschieden: 15,
    deute: (frage) => {
      const m = frage.match(/d = (\d+) cm/);
      if (!m) return null;
      const d = Number(m[1]), r = d / 2;
      return {
        richtig: Math.PI * d,
        toleranz: 0.01,
        falsch: [
          // d als Radius genommen — der häufigste Fehler beim Kreis.
          [2 * Math.PI * d, "als Radius"],
          // Den Faktor 2 vergessen.
          [Math.PI * r, "Faktor"],
          // Die Flächenformel genommen.
          [Math.PI * r * r, "Flächeninhalt"],
          [Math.PI * d * d, "quadriert"],
        ],
        pruefe: (f, rueck) => {
          pruefe(rueck.includes("π · d"), `A2: die Musterlösung nennt die Kurzform U = π · d nicht — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 3 — Bogen und Ausschnittsfläche. 10 Radien × 7 Winkel × 2 Formen
  // = 140 Fassungen; bei 30 Zügen E = 27,1 und σ = 1,5, Quantil 10⁻⁴ bei 21.
  await pruefeAufgabe(page, bericht, {
    nr: 3, name: "A3 Bogen und Ausschnitt", runden: 30, mindestensVerschieden: 20,
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
          pruefe(alpha % 45 === 0 && alpha < 360, `A3: α = ${alpha}° ist kein Achtel des Vollkreises — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 4 — der Rand eines Tortenstücks. Gemessen: 65 verschiedene in 200 Würfen,
  // zurückgerechnet rund 69 Kandidaten. Schranke: simuliertes 10⁻⁴-Quantil bei 30 Zügen für
  // 0,8 · n — 16.
  await pruefeAufgabe(page, bericht, {
    nr: 4, name: "A4 Rand eines Tortenstücks", runden: 30, mindestensVerschieden: 16,
    deute: (frage) => {
      const m = frage.match(/r = (\d+) cm.*?α = (\d+)°/);
      if (!m) return null;
      const r = Number(m[1]), alpha = Number(m[2]);
      const anteil = alpha / 360;
      const bogen = 2 * Math.PI * r * anteil;
      pruefe(alpha % 45 === 0 && alpha < 360, `A4: α = ${alpha}° ist kein Achtel des Vollkreises — „${frage}“`);
      // Bei r · k = 16 wären „ganzer Umfang“ und „Ausschnittsfläche“ dieselbe Zahl; der
      // Generator schließt das aus, damit beide Fehler unterscheidbar bleiben.
      pruefe(r * (alpha / 45) !== 16,
        `A4: bei r = ${r} cm und α = ${alpha}° fallen zwei Fehlerwerte zusammen — „${frage}“`);
      return {
        felder: [bogen, bogen + 2 * r],
        toleranz: 0.01,
        falschFelder: [
          [0, 2 * Math.PI * r, "ganze"],
          [0, Math.PI * r * r * anteil, "Fläche"],
          [1, bogen, "nur der"],
          [1, bogen + r, "einen"],
        ],
      };
    },
  });

  // Aufgabe 5 — rückwärts zum Radius. 12 Radien × 2 Formen = 24 Fassungen;
  // bei 30 Zügen E = 17,3 und σ = 1,6, Quantil 10⁻⁴ bei 11 — Schranke 10.
  await pruefeAufgabe(page, bericht, {
    nr: 5, name: "A5 Radius rückwärts", runden: 30, mindestensVerschieden: 10,
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
            `A5: die Musterlösung nennt die umgestellte Formel nicht — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 6 — rückwärts vom Bogen zum Mittelpunktswinkel. Gemessen: 103 verschiedene in 200
  // Würfen, zurückgerechnet rund 132 Kandidaten. Schranke: simuliertes 10⁻⁴-Quantil bei 30 Zügen
  // für 0,8 · n — 20.
  await pruefeAufgabe(page, bericht, {
    nr: 6, name: "A6 vom Bogen zum Winkel", runden: 30, mindestensVerschieden: 20,
    deute: (frage) => {
      const m = frage.match(/r = (\d+) cm.*?b = ([\d.,]+) cm/);
      if (!m) return null;
      const r = Number(m[1]);
      const bogen = Number(m[2].replace(/\./g, "").replace(",", "."));
      const U = 2 * Math.PI * r;
      // Aus genau der gestellten (gerundeten) Bogenlänge rechnen und auf ganze Grad runden —
      // so, wie es die Aufgabe verlangt.
      const alpha = Math.round((bogen / U) * 360);
      pruefe(alpha % 30 === 0 && alpha > 0 && alpha < 360,
        `A6: aus b = ${bogen} cm und r = ${r} cm folgt α = ${alpha}° — kein Vielfaches von 30° — „${frage}“`);
      return {
        felder: [U, alpha],
        toleranz: 0.01,
        falschFelder: [
          [0, Math.PI * r, "Faktor 2"],
          [0, Math.PI * r * r, "Fläche"],
          [1, Math.round((bogen / U) * 100), "Prozent"],
          [1, 360 - alpha, "übrigen"],
        ],
      };
    },
  });

  // Aufgabe 7 — Kreisring als Weg um einen Brunnen. Gemessen mit tests/werkzeug-streuung.js: 29
  // verschiedene in 200 Würfen, zurückgerechnet also rund 29 Kandidaten. Die Schranke ist das
  // simulierte 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für 0,8 · n gerechnet — 11.
  await pruefeAufgabe(page, bericht, {
    nr: 7, name: "A7 Kreisring", runden: 30, mindestensVerschieden: 11,
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
          pruefe(Number.isInteger(ri), `A7: der Innenradius ${ri} m ist nicht ganzzahlig — „${f}“`);
          // Bei b = r fielen π·b² und π·r² zusammen; die Aufgabe schließt das
          // aus, damit beide Fehler unterscheidbar bleiben.
          pruefe(b !== ri, `A7: Wegbreite und Innenradius sind beide ${b} m — „${f}“`);
          // Die Ringfläche ist exakt π · b · (d + b), also ein ganzzahliges
          // Vielfaches von π.
          pruefe(rueck.includes(`π · ${de(b * (d + b))}`),
            `A7: die Musterlösung nennt π · ${b * (d + b)} nicht — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 8 — Sportplatz aus Rechteck und zwei Halbkreisen. Gemessen: 199 verschiedene in 200
  // Würfen, zurückgerechnet rund 19 800 Kandidaten. Schranke: simuliertes 10⁻⁴-Quantil bei
  // 30 Zügen für 0,8 · n — 28.
  await pruefeAufgabe(page, bericht, {
    nr: 8, name: "A8 Sportplatz", runden: 30, mindestensVerschieden: 28,
    deute: (frage) => {
      const m = frage.match(/Rechteck von (\d+) m × (\d+) m.*?kostet (\d+) €/);
      if (!m) return null;
      const [l, b, preis] = m.slice(1).map(Number);
      // Die beiden Halbkreise ergeben zusammen einen Kreis mit dem Durchmesser b.
      const umfang = 2 * l + Math.PI * b;
      const flaeche = l * b + (Math.PI * b * b) / 4;
      return {
        felder: [umfang, flaeche, Math.round(flaeche * preis)],
        toleranz: 0.01,
        falschFelder: [
          [0, 2 * (l + b), "Rechtecks"],
          [0, 2 * l + (Math.PI * b) / 2, "einen"],
          [0, 2 * l + 2 * Math.PI * b, "als Radius"],
          [1, l * b, "nur das"],
          [1, l * b + Math.PI * b * b, "Durchmesser"],
          [2, Math.round(l * b * preis), "nur das Rechteck bezahlt"],
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
    if (!dunkel) { await ausschnitt(page); await aufgaben(page); }
    else await pruefeKontrast(page, bericht, "dunkel");
    await pruefeNotation(page, bericht, wo);
    for (const s of page.stoerungen) pruefe(false, `${wo}: ${s}`);
    await page.close();
  }
  await browser.close();
  bericht.abschluss();
})();
