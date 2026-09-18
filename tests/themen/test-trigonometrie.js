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

// Auf eine feste Stellenzahl gerundet — dieselbe Rechnung wie auf der Seite.
function rund(x, stellen) {
  const f = Math.pow(10, stellen);
  return Math.round(x * f) / f;
}

// Über alle Runden gesammelt: Beide Aufgaben müssen ihre Fälle wirklich zeigen.
const winkelA2 = new Set();
const lagenA4 = new Set();

async function aufgaben(page) {
  // Aufgabe 1 — Kathete aus Hypotenuse und Funktionswert. Gemessen mit
  // tests/werkzeug-streuung.js: 47 verschiedene in 200 Würfen, zurückgerechnet also rund 48
  // Kandidaten. Die Schranke ist das simulierte 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für
  // 0,8 · n gerechnet — 14.
  await pruefeAufgabe(page, bericht, {
    nr: 1, name: "A1 Kathete", runden: 30, mindestensVerschieden: 14,
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

  // Aufgabe 2 — die Werte für 30°, 45° und 60°. Gemessen mit tests/werkzeug-streuung.js: 63
  // verschiedene in 200 Würfen, zurückgerechnet rund 66 Kandidaten — die Liste ist damit
  // ausgeschöpft. Schranke bei 30 Zügen: 15.
  await pruefeAufgabe(page, bericht, {
    nr: 2, name: "A2 besondere Winkel", runden: 30, mindestensVerschieden: 15,
    deute: (frage) => {
      const m = frage.match(/Hypotenuse c = (\d+) cm und der Winkel α = (\d+)°/);
      if (!m) return null;
      const c = Number(m[1]), alpha = Number(m[2]);
      const s2 = sinG(alpha), co = cosG(alpha);
      const a = rund(c * s2, 1), b = rund(c * co, 1);
      winkelA2.add(alpha);
      return {
        felder: [rund(s2, 3), a, b],
        toleranz: 0.06,
        falschFelder: [
          // Sinus und Kosinus vertauscht — bei 45° sind sie gleich, dann entfällt die Probe.
          [0, alpha === 45 ? null : rund(co, 3), "Gefragt war der Sinus"],
          [0, rund(tanG(alpha), 3), "Das ist tan"],
          [1, alpha === 45 ? null : b, "Ankathete"],
          [1, c, "ist die Hypotenuse"],
          [1, rund(c / s2, 1), "geteilt statt multipliziert"],
          [2, alpha === 45 ? null : a, "Gegenkathete a"],
          [2, rund(c / co, 1), "geteilt statt multipliziert"],
        ],
        pruefe: (f, rueck) => {
          pruefe([30, 45, 60].includes(alpha), `A2: α = ${alpha}° ist keiner der drei besonderen Winkel — „${f}“`);
          // Die exakten Werte müssen wirklich exakt sein.
          pruefe(alpha !== 30 || Math.abs(s2 - 0.5) < 1e-12, `A2: sin 30° ist hier ${s2} — „${f}“`);
          // Pythagoras muss mit den gerundeten Seiten fast aufgehen.
          pruefe(Math.abs(a * a + b * b - c * c) < 0.5 * c, `A2: ${a}² + ${b}² passt nicht zu ${c}² — „${f}“`);
          pruefe(a < c && b < c, `A2: eine Kathete ist nicht kürzer als die Hypotenuse — „${f}“`);
          pruefe(rueck.includes("trigonometrische Pythagoras"),
            `A2: die Musterlösung verknüpft die Werte nicht mit sin² + cos² = 1 — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 3 — die richtige Formel wählen und umstellen. Gemessen mit
  // tests/werkzeug-streuung.js: 151 verschiedene in 200 Würfen, zurückgerechnet also rund 337
  // Kandidaten. Die Schranke ist das simulierte 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für
  // 0,8 · n gerechnet — 23.
  await pruefeAufgabe(page, bericht, {
    nr: 3, name: "A3 Formel wählen", runden: 30, mindestensVerschieden: 23,
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
            `A3: die Hypotenuse ${c} ist nicht die längste Seite — „${f}“`);
          // Und der Pythagoras muss aufgehen.
          pruefe(Math.abs(seite("geg") ** 2 + seite("ank") ** 2 - c * c) < 1e-6,
            `A3: die drei Seiten erfüllen den Pythagoras nicht — „${f}“`);
          pruefe(rueck.includes("längste Seite"),
            `A3: die Musterlösung nennt die Kontrolle über die Hypotenuse nicht — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 4 — der Einheitskreis. Gemessen mit tests/werkzeug-streuung.js: 116 verschiedene in
  // 200 Würfen, zurückgerechnet rund 165 Kandidaten. Schranke bei 30 Zügen: 20.
  await pruefeAufgabe(page, bericht, {
    nr: 4, name: "A4 Einheitskreis", runden: 30, mindestensVerschieden: 20,
    deute: (frage) => {
      const m = frage.match(/φ = (\d+)°/);
      if (!m) return null;
      const phi = Number(m[1]);
      const x = rund(cosG(phi), 3), y = rund(sinG(phi), 3);
      const partner = 180 - phi;
      lagenA4.add(phi > 90 ? "stumpf" : "spitz");
      return {
        felder: [x, y, partner],
        toleranz: 0.06,
        falschFelder: [
          [0, y, "ist die y-Koordinate"],
          [0, -x, "Vorzeichen stimmt nicht"],
          [1, x, "ist die x-Koordinate"],
          [1, -y, "oberhalb"],
          [2, phi, "gegebene Winkel selbst"],
          [2, 360 - phi, "Gespiegelt wird an der"],
          [2, -phi, "Negative Winkel"],
        ],
        pruefe: (f, rueck) => {
          // Der Punkt muss auf dem Einheitskreis liegen.
          pruefe(Math.abs(x * x + y * y - 1) < 0.003, `A4: ${x}² + ${y}² ist nicht 1 — „${f}“`);
          // Das Vorzeichen der x-Koordinate hängt am Viertel.
          pruefe((x < 0) === (phi > 90), `A4: cos ${phi}° = ${x} passt nicht zum Viertel — „${f}“`);
          pruefe(y > 0, `A4: sin ${phi}° = ${y} müsste zwischen 0° und 180° positiv sein — „${f}“`);
          // Und der Partnerwinkel muss denselben Sinus haben.
          pruefe(Math.abs(sinG(partner) - sinG(phi)) < 1e-9,
            `A4: sin ${partner}° ist nicht sin ${phi}° — „${f}“`);
          pruefe(partner !== phi, `A4: der Partnerwinkel ist der Winkel selbst — „${f}“`);
          pruefe(rueck.includes("Spiegelbild"), `A4: die Musterlösung begründet den zweiten Winkel nicht — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 5 — Winkel aus beiden Katheten. Gemessen mit tests/werkzeug-streuung.js: 130
  // verschiedene in 200 Würfen, zurückgerechnet also rund 213 Kandidaten. Die Schranke ist das
  // simulierte 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für 0,8 · n gerechnet — 22.
  await pruefeAufgabe(page, bericht, {
    nr: 5, name: "A5 Winkel bestimmen", runden: 30, mindestensVerschieden: 22,
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
          pruefe(a !== b, `A5: bei a = b = ${a} wäre α = β = 45° — „${f}“`);
          // Die Kontrolle der Aufgabe: α ist genau dann größer als 45°, wenn
          // die Gegenkathete länger ist als die Ankathete.
          pruefe((genau > 45) === (a > b),
            `A5: α = ${genau}° passt nicht zum Verhältnis ${a} : ${b} — „${f}“`);
          pruefe(rueck.includes(a > b ? "größer als 45°" : "kleiner als 45°"),
            `A5: die Musterlösung macht die Größenkontrolle nicht — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 6 — Steigung in Prozent. Gemessen mit tests/werkzeug-streuung.js: 123 verschiedene
  // in 200 Würfen, zurückgerechnet rund 187 Kandidaten. Schranke bei 30 Zügen: 20.
  await pruefeAufgabe(page, bericht, {
    nr: 6, name: "A6 Steigung", runden: 30, mindestensVerschieden: 20,
    deute: (frage) => {
      const m = frage.match(/Steigung von (\d+) %/);
      const ms = frage.match(/(?:Fahr|Weg)strecke von ([\d.]+) m/);
      if (!m || !ms) return null;
      const p = Number(m[1]), strecke = Number(ms[1].replace(/\./g, ""));
      const alpha = atanG(p / 100);
      const hoehe = rund(strecke * sinG(alpha), 1);
      const waagerecht = rund(strecke * cosG(alpha), 1);
      const naiv = rund((strecke * p) / 100, 1);
      return {
        felder: [rund(alpha, 1), hoehe, waagerecht],
        toleranz: 0.06,
        falschFelder: [
          [0, p, "Steigung in Prozent, nicht der Winkel"],
          [0, rund(Math.asin(p / 100) / BOGEN, 1), "also der Tangens"],
          // Der Kern der Aufgabe: die schräge Strecke als waagerechte behandelt.
          [1, naiv, "waagerecht gemessen wären"],
          [1, waagerecht, "ist die waagerechte Entfernung"],
          [1, strecke, "selbst"],
          [2, hoehe, "ist der Höhenunterschied"],
          [2, strecke, "schräge"],
        ],
        pruefe: (f, rueck) => {
          pruefe(alpha < 45, `A6: ${p} % ergäbe ${alpha}° — über 45° wäre die Steigung über 100 % — „${f}“`);
          // Die Höhe muss kleiner sein als die schräge Strecke, die waagerechte auch.
          pruefe(hoehe < strecke && waagerecht < strecke,
            `A6: ${hoehe} m bzw. ${waagerecht} m sind nicht kürzer als die Strecke ${strecke} m — „${f}“`);
          // Pythagoras im Steigungsdreieck.
          pruefe(Math.abs(hoehe * hoehe + waagerecht * waagerecht - strecke * strecke) < strecke,
            `A6: ${hoehe}² + ${waagerecht}² passt nicht zu ${strecke}² — „${f}“`);
          // Und die naive Rechnung muss wirklich zu groß sein, sonst zeigt der Hinweis nichts.
          pruefe(naiv > hoehe, `A6: der Kurzweg ergäbe ${naiv} m und wäre nicht zu groß — „${f}“`);
          pruefe(rueck.includes("Kurzweg"), `A6: die Musterlösung warnt nicht vor dem Kurzweg — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 7 — Turmhöhe mit Augenhöhe. Gemessen mit tests/werkzeug-streuung.js: 142
  // verschiedene in 200 Würfen, zurückgerechnet also rund 273 Kandidaten. Die Schranke ist das
  // simulierte 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für 0,8 · n gerechnet — 22.
  await pruefeAufgabe(page, bericht, {
    nr: 7, name: "A7 Turmhöhe", runden: 30, mindestensVerschieden: 22,
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
            `A7: bei α = ${alpha}° ist h₁ = ${h1} und d = ${d} — „${f}“`);
          pruefe(h > h1, `A7: die Gesamthöhe ${h} ist nicht größer als ${h1} — „${f}“`);
          pruefe(rueck.includes("1,6") || rueck.includes("Augenhöhe"),
            `A7: die Musterlösung erwähnt die Augenhöhe nicht — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 8 — Höhe aus zwei Standpunkten. Gemessen mit tests/werkzeug-streuung.js: 200
  // verschiedene in 200 Würfen — die Kandidatenmenge ist weit größer als 5000. Schranke bei 30
  // Zügen: 27.
  await pruefeAufgabe(page, bericht, {
    nr: 8, name: "A8 zwei Standpunkte", runden: 30, mindestensVerschieden: 27,
    deute: (frage) => {
      const ma = frage.match(/α = (\d+)°/);
      const mb = frage.match(/β = (\d+)°/);
      const md = frage.match(/Geht man ([\d.]+) m/);
      if (!ma || !mb || !md) return null;
      const alpha = Number(ma[1]), beta = Number(mb[1]), d = Number(md[1].replace(/\./g, ""));
      if (alpha <= beta) return null;
      // Unabhängig nachgerechnet: h aus den beiden Gleichungen tan α = h : x und
      // tan β = h : (x + d).
      const h0 = d / (1 / tanG(beta) - 1 / tanG(alpha));
      const h = rund(h0, 1);
      const x = rund(h0 / tanG(alpha), 1);
      const hinten = rund(h0 / tanG(beta), 1);
      const luft = rund(h0 / sinG(beta), 1);
      return {
        felder: [h, x, luft],
        toleranz: 0.16,
        falschFelder: [
          // Die Standpunkt-Entfernung für den Abstand zum Fußpunkt gehalten.
          [0, rund(d * tanG(alpha), 1), "zwischen den beiden Standpunkten"],
          [0, rund(d * tanG(beta), 1), "nicht erreichbar"],
          [0, x, "nicht die Höhe"],
          [1, h, "ist die Höhe"],
          [1, hinten, "das sind genau"],
          [2, rund(h0 / sinG(alpha), 1), "von A aus"],
          [2, hinten, "waagerechte Entfernung von B"],
        ],
        pruefe: (f, rueck) => {
          // Beide Messungen müssen zu derselben Höhe passen — ungerundet gerechnet.
          const xGenau = h0 / tanG(alpha);
          pruefe(Math.abs(h0 - xGenau * tanG(alpha)) < 1e-9
            && Math.abs(h0 - (xGenau + d) * tanG(beta)) < 1e-9,
            `A8: h = ${h0} passt nicht zu beiden Winkeln — „${f}“`);
          // Der hintere Standpunkt liegt wirklich weiter weg.
          pruefe(hinten > x, `A8: ${hinten} m ist nicht weiter als ${x} m — „${f}“`);
          pruefe(Math.abs(hinten - x - d) < 0.2, `A8: ${x} m + ${d} m ist nicht ${hinten} m — „${f}“`);
          // Die Luftlinie ist die Hypotenuse und damit die längste der drei Strecken.
          pruefe(luft > hinten && luft > h, `A8: die Luftlinie ${luft} m ist nicht die längste Strecke — „${f}“`);
          pruefe(rueck.includes("Mit einer einzigen Messung ginge es nicht"),
            `A8: die Musterlösung erklärt nicht, warum zwei Messungen nötig sind — „${f}“`);
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
    if (!dunkel) {
      await aufgaben(page);
      for (const w of [30, 45, 60]) {
        pruefe(winkelA2.has(w), `A2: in 30 Runden kam der Winkel ${w}° nicht vor`);
      }
      for (const l of ["spitz", "stumpf"]) {
        pruefe(lagenA4.has(l), `A4: in 30 Runden kam kein ${l}er Winkel vor`);
      }
    }
    else await pruefeKontrast(page, bericht, "dunkel");
    await pruefeNotation(page, bericht, wo);
    for (const s of page.stoerungen) pruefe(false, `${wo}: ${s}`);
    await page.close();
  }
  await browser.close();
  bericht.abschluss();
})();
