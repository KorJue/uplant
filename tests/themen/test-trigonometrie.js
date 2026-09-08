// Fachliche Prüfung: Kapitel 4, Thema 10 „Trigonometrie“.
//
// Alles hängt daran, die Seiten VOM WINKEL AUS zu benennen: Was Gegenkathete
// ist, hängt davon ab, welchen Winkel man betrachtet. Deshalb wird in jeder
// Aufgabe die falsche Winkelfunktion und die vertauschte Rechenart als Antwort
// eingetragen — und in Aufgabe 4 das Vergessen der Augenhöhe, der klassische
// Fehler beim Messen im Gelände.

"use strict";

const { neuerBericht } = require("../lib/pruefen");
const { starteBrowser, neueSeite, oeffne } = require("../lib/seite");
const { pruefeNotation } = require("../lib/notation");
const { pruefeKontrast } = require("../lib/kontrast");
const { pruefeAufgabe } = require("../lib/aufgaben");

const bericht = neuerBericht();
const { pruefe } = bericht;
const SEITE = "/mathematik/grundwissen-5-10/04-gleichungen-zuordnungen-funktionen/10-trigonometrie/index.html";

const BOGEN = Math.PI / 180;
// Bei den runden Winkeln exakt rechnen — sin 30° ist 0,5 und nicht 0,49999…
function sinG(g) { const r = ((g % 360) + 360) % 360; return r % 90 === 0 ? [0, 1, 0, -1][r / 90] : Math.sin(g * BOGEN); }
function cosG(g) { const r = ((g % 360) + 360) % 360; return r % 90 === 0 ? [1, 0, -1, 0][r / 90] : Math.cos(g * BOGEN); }
const tanG = (g) => sinG(g) / cosG(g);
const atanG = (v) => Math.atan(v) / BOGEN;

const AUGE = 1.6;
const minus = (s) => s.replace(/−/g, "-");
const zahl = (s) => Number(minus(s).replace(",", "."));

async function aufgaben(page) {
  // Aufgabe 1 — Kathete aus Hypotenuse und Funktionswert. 2 Funktionen × 6
  // Werte × 4 Hypotenusen = 48 Fassungen; bei 30 Zügen ist E = 20,6 und
  // σ = 1,7 — Schranke E − 3σ = 15.
  await pruefeAufgabe(page, bericht, {
    nr: 1, name: "A1 Kathete", runden: 30, mindestensVerschieden: 15,
    deute: (frage) => {
      const m = frage.match(/c = (\d+) cm.*?(sin|cos) α = ([\d,]+).*?Wie lang ist die (Gegenkathete|Ankathete)/);
      if (!m) return null;
      const c = Number(m[1]);
      const fkt = m[2];
      const v = zahl(m[3]);
      const wert = c * v;
      const andere = Math.sqrt(c * c - wert * wert);
      return {
        richtig: wert,
        toleranz: 0.005,
        falsch: [
          // Geteilt statt multipliziert.
          [c / v, "geteilt statt multipliziert"],
          // Die andere Kathete berechnet.
          [andere, "Kathete. Gesucht war"],
        ],
        pruefe: (f) => {
          // Der Sinus gehört zur Gegenkathete, der Kosinus zur Ankathete.
          pruefe((fkt === "sin") === (m[4] === "Gegenkathete"),
            `A1: ${fkt} α wird nach der ${m[4]} gefragt — „${f}“`);
          // Eine Kathete ist stets kürzer als die Hypotenuse.
          pruefe(wert < c, `A1: die Kathete ${wert} ist nicht kürzer als die Hypotenuse ${c} — „${f}“`);
          // Und beide Katheten erfüllen den Pythagoras.
          pruefe(Math.abs(wert * wert + andere * andere - c * c) < 1e-6,
            `A1: ${wert}² + ${andere}² ≠ ${c}² — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 2 — die richtige Formel wählen und umstellen. 6 Paare × 13 Winkel
  // × 7 Längen = 546 Fassungen; Doppel sind bei 30 Zügen selten — Schranke 26.
  await pruefeAufgabe(page, bericht, {
    nr: 2, name: "A2 Formel wählen", runden: 30, mindestensVerschieden: 26,
    deute: (frage) => {
      const m = frage.match(/α = (\d+)°.*?(Hypotenuse c|Gegenkathete a|Ankathete b) = (\d+) cm.*?Wie lang ist die (Hypotenuse c|Gegenkathete a|Ankathete b)/);
      if (!m) return null;
      const alpha = Number(m[1]);
      const kurz = (s) => (s.startsWith("Hyp") ? "hyp" : s.startsWith("Geg") ? "geg" : "ank");
      const gegeben = kurz(m[2]), gesucht = kurz(m[4]);
      const laenge = Number(m[3]);
      if (gegeben === gesucht) return null;

      // Aus der gegebenen Seite die Hypotenuse bestimmen, daraus die gesuchte.
      const c = gegeben === "hyp" ? laenge
        : gegeben === "geg" ? laenge / sinG(alpha)
        : laenge / cosG(alpha);
      const seite = (art) => (art === "hyp" ? c : art === "geg" ? c * sinG(alpha) : c * cosG(alpha));
      const richtig = seite(gesucht);

      // Welche Funktion verbindet die beiden Seiten, und wird multipliziert?
      const paar = `${gegeben}>${gesucht}`;
      const wege = {
        "hyp>geg": ["sin", true], "hyp>ank": ["cos", true], "geg>hyp": ["sin", false],
        "geg>ank": ["tan", false], "ank>hyp": ["cos", false], "ank>geg": ["tan", true],
      };
      if (!wege[paar]) return null;
      const [fkt, mal] = wege[paar];
      const fw = { sin: sinG(alpha), cos: cosG(alpha), tan: tanG(alpha) }[fkt];
      const andereFkt = { sin: cosG(alpha), cos: sinG(alpha), tan: 1 / tanG(alpha) }[fkt];

      return {
        richtig: Math.round(richtig * 10) / 10,
        toleranz: 0.05,
        falsch: [
          // Die Rechenart vertauscht.
          [mal ? laenge / fw : laenge * fw, mal ? "geteilt statt multipliziert" : "multipliziert statt geteilt"],
          // Die falsche Winkelfunktion benutzt.
          [mal ? laenge * andereFkt : laenge / andereFkt, "falsche Winkelfunktion"],
        ],
        pruefe: (f, rueck) => {
          // Die Hypotenuse ist die längste Seite — das ist die Kontrolle der Aufgabe.
          pruefe(c >= seite("geg") - 1e-9 && c >= seite("ank") - 1e-9,
            `A2: die Hypotenuse ${c} ist nicht die längste Seite — „${f}“`);
          // Und der Pythagoras muss aufgehen.
          pruefe(Math.abs(seite("geg") ** 2 + seite("ank") ** 2 - c * c) < 1e-6,
            `A2: die drei Seiten erfüllen den Pythagoras nicht — „${f}“`);
          pruefe(rueck.includes("längste Seite"),
            `A2: die Musterlösung nennt die Kontrolle über die Hypotenuse nicht — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 3 — Winkel aus beiden Katheten. 15 · 15 − 15 = 210 Paare;
  // Doppel sind bei 30 Zügen selten — Schranke 26.
  await pruefeAufgabe(page, bericht, {
    nr: 3, name: "A3 Winkel bestimmen", runden: 30, mindestensVerschieden: 26,
    deute: (frage) => {
      const m = frage.match(/Gegenkathete a = (\d+) cm.*?Ankathete b = (\d+) cm/);
      if (!m) return null;
      const [a, b] = m.slice(1).map(Number);
      const genau = atanG(a / b);
      return {
        richtig: Math.round(genau),
        toleranz: 0.4,
        falsch: [
          // Den anderen spitzen Winkel berechnet.
          [90 - Math.round(genau), "spitze Winkel β"],
          // Der Taschenrechner stand auf Bogenmaß.
          [Math.round(Math.atan(a / b)), "Bogenmaß"],
        ],
        pruefe: (f, rueck) => {
          pruefe(a !== b, `A3: bei a = b = ${a} wäre α = β = 45° — „${f}“`);
          // Die Kontrolle der Aufgabe: α ist genau dann größer als 45°, wenn
          // die Gegenkathete länger ist als die Ankathete.
          pruefe((genau > 45) === (a > b),
            `A3: α = ${genau}° passt nicht zum Verhältnis ${a} : ${b} — „${f}“`);
          pruefe(rueck.includes(a > b ? "größer als 45°" : "kleiner als 45°"),
            `A3: die Musterlösung macht die Größenkontrolle nicht — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 4 — Turmhöhe mit Augenhöhe. 21 Winkel × 15 Abstände = 315
  // Fassungen; Doppel sind bei 30 Zügen selten — Schranke 26.
  await pruefeAufgabe(page, bericht, {
    nr: 4, name: "A4 Turmhöhe", runden: 30, mindestensVerschieden: 26,
    deute: (frage) => {
      const m = frage.match(/(\d+) m vom Fuß.*?(\d+)°/);
      if (!m) return null;
      const d = Number(m[1]), alpha = Number(m[2]);
      const h1 = d * tanG(alpha);
      const h = h1 + AUGE;
      return {
        richtig: Math.round(h * 10) / 10,
        toleranz: 0.05,
        falsch: [
          // Die Augenhöhe vergessen — der klassische Fehler beim Messen.
          [h1, "Augenhöhe fehlt"],
          // Den Sinus statt des Tangens benutzt.
          [d * sinG(alpha) + AUGE, "Sinus benutzt"],
          // Geteilt statt multipliziert.
          [d / tanG(alpha) + AUGE, "geteilt statt multipliziert"],
        ],
        pruefe: (f, rueck) => {
          // Unter 45° ist die Höhe über dem Messgerät kleiner als der Abstand,
          // darüber größer — eine Kontrolle ohne Taschenrechner.
          pruefe((h1 > d) === (alpha > 45),
            `A4: bei α = ${alpha}° ist h₁ = ${h1} und d = ${d} — „${f}“`);
          pruefe(h > h1, `A4: die Gesamthöhe ${h} ist nicht größer als ${h1} — „${f}“`);
          pruefe(rueck.includes("1,6") || rueck.includes("Augenhöhe"),
            `A4: die Musterlösung erwähnt die Augenhöhe nicht — „${f}“`);
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
