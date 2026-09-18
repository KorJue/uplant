// Fachliche Prüfung: Kapitel 4, Thema 6 „Lineare Gleichungssysteme“.
//
// Drei Verfahren, eine Lösung: Gleichsetzen, Einsetzen und Addieren müssen
// dasselbe Zahlenpaar liefern. Der Test rechnet jedes System unabhängig nach
// und setzt die Lösung in BEIDE Gleichungen ein — ein Verfahren, das nur eine
// der beiden erfüllt, hätte nichts gelöst. Dazu wird jeder vorgesehene Fehler
// eingetragen: den anderen Wert angeben, das Vorzeichen verlieren, vor der
// Division stehen bleiben.

"use strict";

const { neuerBericht } = require("../lib/pruefen");
const { starteBrowser, neueSeite, oeffne } = require("../lib/seite");
const { pruefeNotation } = require("../lib/notation");
const { pruefeKontrast } = require("../lib/kontrast");
const { pruefeAufgabe, zahlen } = require("../lib/aufgaben");

const bericht = neuerBericht();
const { pruefe } = bericht;
const SEITE = "/mathematik/grundwissen-5-10/04-gleichungen-zuordnungen-funktionen/06-lineare-gleichungssysteme/index.html";

const minus = (s) => s.replace(/−/g, "-");

// Über alle Runden gesammelt: Beide Aufgaben müssen jeden ihrer Fälle wirklich zeigen —
// eine Aufgabe, die immer „keine Lösung“ würfelt, hätte ihren Zweck verfehlt.
const faelleA2 = new Set();
const faelleA6 = new Set();

// „y = 3x − 4“, „y = −x + 2“ — der Koeffizient 1 wird nicht geschrieben.
function nachY(s) {
  const m = s.match(/y = (-?\d*)x( [+-] \d+)?/);
  if (!m) return null;
  const st = m[1] === "" ? 1 : m[1] === "-" ? -1 : Number(m[1]);
  const b = m[2] ? Number(m[2].replace(/\s/g, "")) : 0;
  return { m: st, b };
}

// „2x + y = 5“, „3x − 4y = 1“ — auch hier fehlt der Koeffizient 1.
function gleichung(s) {
  const m = s.match(/(-?\d*)x ([+-]) (\d*)y = (-?\d+)/);
  if (!m) return null;
  const a = m[1] === "" ? 1 : m[1] === "-" ? -1 : Number(m[1]);
  const bBetrag = m[3] === "" ? 1 : Number(m[3]);
  return { a, b: (m[2] === "-" ? -1 : 1) * bBetrag, c: Number(m[4]) };
}

// Cramer: die eindeutige Lösung eines 2×2-Systems.
function loese(g1, g2) {
  const det = g1.a * g2.b - g2.a * g1.b;
  if (det === 0) return null;
  return { x: (g1.c * g2.b - g2.c * g1.b) / det, y: (g1.a * g2.c - g2.a * g1.c) / det };
}

async function aufgaben(page) {
  // Aufgabe 1 — Gleichsetzungsverfahren. Die Kandidatenliste hat nach dem Kollisionsfilter 718
  // Einträge, die alle einen eigenen Aufgabentext ergeben; nachgebildet liegt der
  // Erwartungswert bei 29,4 verschiedenen in 30 Zügen und das 10⁻⁴-Quantil bei 25. Schranke 24.
  await pruefeAufgabe(page, bericht, {
    nr: 1, name: "A1 Gleichsetzen", runden: 30, mindestensVerschieden: 24,
    deute: (frage) => {
      const t = minus(frage);
      const m = t.match(/I: (y = .+?) II: (y = .+?) Wie groß/);
      if (!m) return null;
      const g1 = nachY(m[1]), g2 = nachY(m[2]);
      if (!g1 || !g2 || g1.m === g2.m) return null;
      const x0 = (g2.b - g1.b) / (g1.m - g2.m);
      const y0 = g1.m * x0 + g1.b;
      return {
        richtig: x0,
        toleranz: 0.0005,
        falsch: [
          // Das Vorzeichen beim Sortieren verloren.
          [-x0, "Vorzeichen"],
          // Den y-Wert angegeben.
          [y0, "y-Wert"],
          // Vor der Division stehen geblieben.
          [g2.b - g1.b, "Division"],
          [g1.m - g2.m, "Koeffizient vor dem x"],
        ],
        pruefe: (f, rueck) => {
          pruefe(Number.isInteger(x0), `A1: x = ${x0} ist nicht ganzzahlig — „${f}“`);
          // Beide Geraden müssen im Lösungspunkt denselben y-Wert haben.
          pruefe(Math.abs(g1.m * x0 + g1.b - (g2.m * x0 + g2.b)) < 1e-9,
            `A1: I liefert ${g1.m * x0 + g1.b}, II liefert ${g2.m * x0 + g2.b} — „${f}“`);
          pruefe(rueck.includes("Probe in II"), `A1: die Musterlösung macht keine Probe in II — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 2 — Die Probe. Gemessen mit tests/werkzeug-streuung.js: 200 verschiedene in 200
  // Würfen; jeder der zwölf Fälle siebt aus einer Liste von mehreren tausend Systemen, die
  // Kandidatenmenge ist also weit größer als 5000. Schranke bei 30 Zügen: 27.
  await pruefeAufgabe(page, bericht, {
    nr: 2, name: "A2 Probe", runden: 30, mindestensVerschieden: 27,
    deute: (frage) => {
      const t = minus(frage);
      const m = t.match(/I: (.+?) II: (.+?) Setze das Paar \((-?\d+) \| (-?\d+)\)/);
      if (!m) return null;
      const g1 = gleichung(m[1]), g2 = gleichung(m[2]);
      if (!g1 || !g2) return null;
      const xp = Number(m[3]), yp = Number(m[4]);
      const l1 = g1.a * xp + g1.b * yp, l2 = g2.a * xp + g2.b * yp;
      const istLoesung = l1 === g1.c && l2 === g2.c;
      faelleA2.add(istLoesung ? "ja" : l1 === g1.c ? "nurI" : l2 === g2.c ? "nurII" : "keine");
      return {
        felder: [l1, l2, istLoesung ? 1 : 2],
        toleranz: 0.0005,
        falschFelder: [
          // x und y beim Einsetzen vertauscht.
          [0, g1.a * yp + g1.b * xp, "vertauscht"],
          // Die rechte Seite abgeschrieben, statt links zu rechnen.
          [0, l1 === g1.c ? null : g1.c, "rechte Seite von I"],
          [1, g2.a * yp + g2.b * xp, "steht x vorn"],
          [1, l2 === g2.c ? null : g2.c, "rechte Seite von II"],
          // Eine erfüllte Gleichung für ausreichend gehalten — der Kern der Aufgabe.
          [2, istLoesung ? 2 : 1,
            istLoesung ? "Beide Vergleiche"
              : (l1 === g1.c || l2 === g2.c) ? "eine Lösung muss" : "Hier stimmt keine"],
        ],
        pruefe: (f, rueck) => {
          pruefe(xp !== yp, `A2: das Paar (${xp} | ${yp}) hat zwei gleiche Zahlen — der Vertauschungsfehler wäre keiner — „${f}“`);
          pruefe(g1.a * g2.b - g2.a * g1.b !== 0, `A2: die Determinante ist 0 — „${f}“`);
          // Das Urteil der Musterlösung muss zur nachgerechneten Probe passen.
          pruefe(rueck.includes(istLoesung ? "ist eine Lösung" : "ist keine Lösung"),
            `A2: die Musterlösung urteilt anders als die Nachrechnung (${l1} ${l1 === g1.c ? "=" : "≠"} ${g1.c}, ${l2} ${l2 === g2.c ? "=" : "≠"} ${g2.c}) — „${f}“`);
          pruefe(rueck.includes("Urteil"), `A2: die Musterlösung zieht kein Urteil — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 3 — Einsetzungsverfahren; gefragt ist y. Gemessen mit tests/werkzeug-streuung.js:
  // 199 verschiedene in 200 Würfen, zurückgerechnet also rund 19834 Kandidaten. Die Schranke
  // ist das simulierte 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für 0,8 · n gerechnet — 27.
  await pruefeAufgabe(page, bericht, {
    nr: 3, name: "A3 Einsetzen", runden: 30, mindestensVerschieden: 27,
    deute: (frage) => {
      const t = minus(frage);
      const m = t.match(/I: (.+?) II: (.+?) Wie groß/);
      if (!m) return null;
      const g1 = gleichung(m[1]), g2 = gleichung(m[2]);
      if (!g1 || !g2) return null;
      const l = loese(g1, g2);
      if (!l) return null;
      return {
        richtig: l.y,
        toleranz: 0.0005,
        falsch: [
          // Den x-Wert angegeben.
          [l.x, "x-Wert"],
          // Das Vorzeichen beim Auflösen der Klammer verloren.
          [-l.y, "Vorzeichen"],
          // Eine rechte Seite für y gehalten.
          [g1.c, "rechte Seite von Gleichung I"],
          [g2.c, "rechte Seite von Gleichung II"],
        ],
        pruefe: (f) => {
          pruefe(g1.b === 1, `A3: Gleichung I ist nicht nach y auflösbar ohne Bruch (b = ${g1.b}) — „${f}“`);
          pruefe(Number.isInteger(l.x) && Number.isInteger(l.y),
            `A3: die Lösung (${l.x} | ${l.y}) ist nicht ganzzahlig — „${f}“`);
          // Die Lösung muss beide Gleichungen erfüllen, nicht nur eine.
          pruefe(Math.abs(g1.a * l.x + g1.b * l.y - g1.c) < 1e-9
            && Math.abs(g2.a * l.x + g2.b * l.y - g2.c) < 1e-9,
            `A3: (${l.x} | ${l.y}) erfüllt nicht beide Gleichungen — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 4 — Additionsverfahren in Teilschritten. Gemessen mit tests/werkzeug-streuung.js:
  // 199 verschiedene in 200 Würfen; die Kandidatenliste hat nach dem Kollisionsfilter 11720
  // Einträge. Schranke bei 30 Zügen: 27.
  await pruefeAufgabe(page, bericht, {
    nr: 4, name: "A4 Additionsverfahren in Schritten", runden: 30, mindestensVerschieden: 27,
    deute: (frage) => {
      const t = minus(frage);
      const m = t.match(/I: (.+?) II: (.+?) Hier genügt/);
      if (!m) return null;
      const g1 = gleichung(m[1]), g2 = gleichung(m[2]);
      if (!g1 || !g2) return null;
      const l = loese(g1, g2);
      if (!l) return null;
      // Die Zahl, mit der I multipliziert wird, damit sich y weghebt.
      const k = -g2.b / g1.b;
      const naiv = g1.a + g2.a !== 0 ? (g1.c + g2.c) / (g1.a + g2.a) : null;
      return {
        felder: [k, l.x, l.y],
        toleranz: 0.0005,
        falschFelder: [
          // Mit dem falschen Vorzeichen multipliziert — dann bleibt y stehen.
          [0, -k, "andersherum"],
          [0, g2.b, "y-Koeffizient von II"],
          [0, g2.a, "x-Koeffizient von II"],
          [1, l.y, "y-Wert"],
          [1, -l.x, "Vorzeichen"],
          // Ohne Vorbereitung addiert.
          [1, naiv, "ohne Vorbereitung"],
          [2, l.x, "x-Wert"],
          [2, -l.y, "Vorzeichen"],
        ],
        pruefe: (f, rueck) => {
          pruefe(Number.isInteger(k) && Math.abs(k) >= 2,
            `A4: der Faktor ${k} ist nicht ganzzahlig oder trivial — „${f}“`);
          pruefe(k * g1.b + g2.b === 0, `A4: mit ${k} hebt sich y nicht weg — „${f}“`);
          pruefe(Number.isInteger(l.x) && Number.isInteger(l.y),
            `A4: die Lösung (${l.x} | ${l.y}) ist nicht ganzzahlig — „${f}“`);
          pruefe(Math.abs(g1.a * l.x + g1.b * l.y - g1.c) < 1e-9
            && Math.abs(g2.a * l.x + g2.b * l.y - g2.c) < 1e-9,
            `A4: (${l.x} | ${l.y}) erfüllt nicht beide Gleichungen — „${f}“`);
          // Der Hinweis auf die ganze Gleichung ist der Kern des Schritts.
          pruefe(rueck.includes("Faktor bestimmen"), `A4: die Musterlösung bestimmt den Faktor nicht — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 5 — Additionsverfahren; gefragt ist x. Gemessen mit tests/werkzeug-streuung.js: 199
  // verschiedene in 200 Würfen, zurückgerechnet also rund 19834 Kandidaten. Die Schranke ist
  // das simulierte 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für 0,8 · n gerechnet — 27.
  await pruefeAufgabe(page, bericht, {
    nr: 5, name: "A5 Additionsverfahren", runden: 30, mindestensVerschieden: 27,
    deute: (frage) => {
      const t = minus(frage);
      const m = t.match(/I: (.+?) II: (.+?) Wie groß/);
      if (!m) return null;
      const g1 = gleichung(m[1]), g2 = gleichung(m[2]);
      if (!g1 || !g2) return null;
      const l = loese(g1, g2);
      if (!l) return null;
      return {
        richtig: l.x,
        toleranz: 0.0005,
        falsch: [
          [l.y, "y-Wert"],
          [-l.x, "Vorzeichen"],
          // Die Gleichungen direkt addiert, ohne passend zu multiplizieren.
          [g1.a + g2.a !== 0 ? (g1.c + g2.c) / (g1.a + g2.a) : null, "direkt addiert"],
        ],
        pruefe: (f) => {
          pruefe(Number.isInteger(l.x) && Number.isInteger(l.y),
            `A5: die Lösung (${l.x} | ${l.y}) ist nicht ganzzahlig — „${f}“`);
          pruefe(Math.abs(g1.a * l.x + g1.b * l.y - g1.c) < 1e-9
            && Math.abs(g2.a * l.x + g2.b * l.y - g2.c) < 1e-9,
            `A5: (${l.x} | ${l.y}) erfüllt nicht beide Gleichungen — „${f}“`);
          // Das System muss eindeutig lösbar sein — sonst wäre die Frage falsch.
          pruefe(g1.a * g2.b - g2.a * g1.b !== 0,
            `A5: die Determinante ist 0, das System ist nicht eindeutig lösbar — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 6 — Die drei Lösungsfälle. Nachgebildet wurde die wirkliche Ziehung (erst der Fall,
  // dann der Kandidat aus 188 sauberen, dann die zweite Gerade): Erwartungswert 29,7 verschiedene
  // in 30 Zügen, das 10⁻⁴-Quantil liegt bei 26. Schranke deshalb 25.
  await pruefeAufgabe(page, bericht, {
    nr: 6, name: "A6 drei Lösungsfälle", runden: 30, mindestensVerschieden: 25,
    deute: (frage) => {
      const t = minus(frage);
      const m = t.match(/I: (.+?) II: (y = .+?) Löse dazu/);
      if (!m) return null;
      const g1 = gleichung(m[1]), g2 = nachY(m[2]);
      if (!g1 || !g2) return null;
      const m1 = -g1.a / g1.b, n1 = g1.c / g1.b;
      const fall = m1 !== g2.m ? 1 : n1 !== g2.b ? 2 : 3;
      faelleA6.add(fall);
      const falschFall = fall === 1
        ? [[2, "Steigungen sind verschieden"], [3, "Steigungen sind verschieden"]]
        : fall === 2
          ? [[1, "dieselbe Steigung"], [3, "echt parallel"]]
          : [[1, "einzige Gerade"], [2, "dieselbe Gerade"]];
      return {
        felder: [m1, n1, fall],
        toleranz: 0.0005,
        falschFelder: [
          // Den Koeffizienten der Normalform für die Steigung gehalten.
          [0, g1.a, "Koeffizient vor dem x"],
          [0, -m1, "Vorzeichen"],
          [0, fall === 1 ? g2.m : null, "zweiten Geraden"],
          [1, g1.c, "rechte Seite von I"],
          [1, -n1, "Vorzeichen"],
          [1, m1, "Steigung, nicht der y-Achsenabschnitt"],
          ...falschFall.map(([wert, muster]) => [2, wert, muster]),
        ],
        pruefe: (f, rueck) => {
          pruefe(Number.isInteger(m1) && Number.isInteger(n1),
            `A6: die aufgelöste Gerade y = ${m1}x + ${n1} hat keine ganzzahligen Kennzahlen — „${f}“`);
          pruefe(Math.abs(g1.b) >= 2, `A6: I ist mit b = ${g1.b} schon fast aufgelöst — „${f}“`);
          pruefe(m1 !== n1, `A6: Steigung und y-Achsenabschnitt sind beide ${m1} — die Felder wären nicht unterscheidbar — „${f}“`);
          pruefe(rueck.includes({ 1: "genau eine Lösung", 2: "keine Lösung", 3: "unendlich viele Lösungen" }[fall]),
            `A6: die Musterlösung nennt nicht den nachgerechneten Fall ${fall} — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 7 — Sachaufgabe: zwei Preise aus zwei Bestellungen. Gemessen mit
  // tests/werkzeug-streuung.js: 199 verschiedene in 200 Würfen, zurückgerechnet also rund 19834
  // Kandidaten. Die Schranke ist das simulierte 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für
  // 0,8 · n gerechnet — 27.
  await pruefeAufgabe(page, bericht, {
    nr: 7, name: "A7 zwei Preise", runden: 30, mindestensVerschieden: 27,
    deute: (frage) => {
      // Beide Sätze nennen ihre drei Zahlen in derselben Reihenfolge:
      // Anzahl der ersten Sorte, Anzahl der zweiten, Gesamtpreis.
      const z = (frage.match(/\d+/g) || []).map(Number);
      if (z.length < 6) return null;
      const g1 = { a: z[0], b: z[1], c: z[2] };
      const g2 = { a: z[3], b: z[4], c: z[5] };
      const l = loese(g1, g2);
      if (!l) return null;
      return {
        richtig: l.y,
        toleranz: 0.0005,
        falsch: [
          // Den Preis der ersten Sorte angegeben.
          [l.x, "Preis einer"],
          [l.x + l.y, "beider zusammen"],
          [l.x - l.y, "Preisunterschied"],
        ],
        pruefe: (f, rueck) => {
          pruefe(l.x > 0 && l.y > 0, `A7: die Preise ${l.x} € und ${l.y} € sind nicht beide positiv — „${f}“`);
          pruefe(Number.isInteger(l.x) && Number.isInteger(l.y),
            `A7: die Preise ${l.x} € und ${l.y} € sind nicht ganzzahlig — „${f}“`);
          // Beide Bestellungen müssen mit diesen Preisen aufgehen.
          pruefe(Math.abs(g1.a * l.x + g1.b * l.y - g1.c) < 1e-9
            && Math.abs(g2.a * l.x + g2.b * l.y - g2.c) < 1e-9,
            `A7: die Preise passen nicht zu beiden Angaben — „${f}“`);
          // Die Musterlösung muss die Unbekannten benennen, bevor sie rechnet.
          pruefe(rueck.includes("Benennen"), `A7: die Musterlösung benennt x und y nicht — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 8 — Mischungsaufgabe. Die Kandidatenliste hat 2926 Einträge, dazu vier Kontexte;
  // gemessen mit tests/werkzeug-streuung.js: 199 verschiedene in 200 Würfen. Schranke bei 30
  // Zügen: 27.
  await pruefeAufgabe(page, bericht, {
    nr: 8, name: "A8 Mischung", runden: 30, mindestensVerschieden: 27,
    deute: (frage) => {
      // Der Text nennt seine vier Zahlen in fester Reihenfolge: Preis der ersten Sorte,
      // Preis der zweiten, Gesamtmenge, Mischpreis.
      const z = zahlen(frage);
      if (z.length < 4) return null;
      const [p1, p2, g, mp] = z;
      if (p1 <= p2) return null;
      const s = Math.round(mp * g * 100) / 100;
      const x = (s - p2 * g) / (p1 - p2);
      const y = g - x;
      return {
        felder: [s, x, y],
        toleranz: 0.0005,
        falschFelder: [
          // Den Preis je Einheit für den Gesamtwert gehalten.
          [0, mp, "was die ganzen"],
          [0, g * p1, "teureren Sorte"],
          [0, g * p2, "günstigeren Sorte"],
          [0, p1 + p2, "Einzelpreise zu addieren"],
          // Die beiden Mengen vertauscht.
          [1, y, "die teurere Sorte"],
          [1, g / 2, "Halbe-halbe"],
          [1, g, "Gesamtmenge"],
          [2, x, "ergeben zusammen"],
          [2, g / 2, "genau in der Mitte"],
          [2, g, "nicht der Anteil"],
        ],
        pruefe: (f, rueck) => {
          pruefe(Number.isInteger(x) && Number.isInteger(y) && x > 0 && y > 0,
            `A8: die Mengen ${x} und ${y} sind nicht beide ganzzahlig und positiv — „${f}“`);
          // Der Mischpreis muss echt zwischen den Einzelpreisen liegen, sonst ist der Text falsch.
          pruefe(mp > p2 && mp < p1, `A8: der Mischpreis ${mp} liegt nicht zwischen ${p2} und ${p1} — „${f}“`);
          pruefe(Math.abs(p1 * x + p2 * y - s) < 1e-6, `A8: die Werte gehen nicht auf — „${f}“`);
          pruefe(x !== y, `A8: gleiche Mengen — der Vertauschungsfehler wäre keiner — „${f}“`);
          pruefe(rueck.includes("Benennen") && rueck.includes("Probe am Text"),
            `A8: die Musterlösung benennt die Unbekannten nicht oder macht keine Probe am Text — „${f}“`);
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
      // Beide Aufgaben leben von ihren Fällen; fehlt einer, prüft der Schüler ihn nie.
      pruefe(faelleA2.has("ja"), "A2: in 30 Runden kam kein Paar vor, das wirklich Lösung ist");
      pruefe(faelleA2.has("nurI") || faelleA2.has("nurII"),
        "A2: in 30 Runden kam kein Paar vor, das genau eine der beiden Gleichungen erfüllt");
      for (const f of [1, 2, 3]) {
        pruefe(faelleA6.has(f), `A6: in 30 Runden kam der Lösungsfall ${f} nicht vor`);
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
