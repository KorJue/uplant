// Fachliche Prüfung: Kapitel 2, Thema 7 „Flächenberechnungen“.
//
// Zwei Fallen tragen das Thema: die schräge Seite statt der Höhe zu nehmen und
// die Halbierung zu vergessen (oder eine zu viel zu machen). Beide werden in
// jeder Fassung eigens ausgelöst. Dazu kommen die Fälle, in denen nicht die
// Formel das Problem ist, sondern die Sache: eine Restfläche entsteht durch
// Abziehen, und Packungen gibt es nur ganz.

"use strict";

const { neuerBericht } = require("../lib/pruefen");
const { starteBrowser, neueSeite, oeffne } = require("../lib/seite");
const { pruefeNotation } = require("../lib/notation");
const { pruefeKontrast } = require("../lib/kontrast");
const { pruefeAufgabe, zahlen } = require("../lib/aufgaben");

const bericht = neuerBericht();
const { pruefe } = bericht;
const SEITE = "/mathematik/grundwissen-5-10/02-geometrie/07-flaechenberechnungen/index.html";

async function aufgaben(page) {
  // Aufgabe 1 — Dreieck oder Parallelogramm, mit einer schrägen Seite als Ablenkung. Gemessen mit
  // tests/werkzeug-streuung.js: 171 verschiedene in 200 Würfen, zurückgerechnet rund 618
  // Kandidaten. Die Schranke ist das simulierte 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für
  // 0,8 · n gerechnet — 25.
  await pruefeAufgabe(page, bericht, {
    nr: 1, name: "A1 Dreieck und Parallelogramm", runden: 30, mindestensVerschieden: 25,
    deute: (frage) => {
      const m = frage.match(/(Dreieck|Parallelogramm) hat die Grundseite g = (\d+) cm.*?Höhe h = (\d+) cm.*?schräge Seite ist (\d+) cm/);
      if (!m) return null;
      const dreieck = m[1] === "Dreieck";
      const [g, h, b] = m.slice(2).map(Number);
      pruefe(b > h, `A1: die schräge Seite (${b} cm) ist nicht länger als die Höhe (${h} cm) — das gibt es nicht`);
      return {
        richtig: dreieck ? (g * h) / 2 : g * h,
        toleranz: 0.02,
        // In der Reihenfolge, in der die Seite ihre Hinweise prüft.
        falsch: [
          [dreieck ? (g * b) / 2 : g * b, "schrägen Seite"],
          [dreieck ? g * h : (g * h) / 2, dreieck ? "Parallelogramms" : "halbiert"],
          [2 * (g + h), "Umfang"],
        ],
      };
    },
  });

  // Aufgabe 2 — Raute und Drachen: A = ½ · e · f. Gemessen: 140 verschiedene in 200 Würfen,
  // zurückgerechnet rund 262 Kandidaten. Schranke: simuliertes 10⁻⁴-Quantil bei 30 Zügen für
  // 0,8 · n — 22.
  await pruefeAufgabe(page, bericht, {
    nr: 2, name: "A2 Raute und Drachen", runden: 30, mindestensVerschieden: 22,
    deute: (frage) => {
      const m = frage.match(/Diagonalen e = (\d+) cm und f = (\d+) cm/);
      if (!m) return null;
      const e = Number(m[1]), f = Number(m[2]);
      pruefe((e * f) % 2 === 0, `A2: e · f = ${e * f} ist ungerade — die halbe Fläche wäre krumm`);
      return {
        richtig: (e * f) / 2,
        toleranz: 0.02,
        falsch: [
          [e * f, "Halbierung"],
          [(e + f) / 2, "Produkt"],
          [2 * (e + f), "Umfang"],
        ],
      };
    },
  });

  // Aufgabe 3 — Trapez. Gemessen: 173 verschiedene in 200 Würfen, zurückgerechnet rund 669
  // Kandidaten. Schranke: simuliertes 10⁻⁴-Quantil bei 30 Zügen für 0,8 · n — 25.
  await pruefeAufgabe(page, bericht, {
    nr: 3, name: "A3 Trapez", runden: 30, mindestensVerschieden: 25,
    deute: (frage) => {
      const m = frage.match(/a = (\d+) cm und c = (\d+) cm.*?h = (\d+) cm/);
      if (!m) return null;
      const [a, c, h] = m.slice(1).map(Number);
      pruefe(c < a, `A3: c = ${c} cm ist nicht kürzer als a = ${a} cm`);
      return {
        richtig: ((a + c) * h) / 2,
        toleranz: 0.02,
        // In der Reihenfolge der Hinweiskette der Seite. (a · h) : 2 gehört
        // dazu, obwohl es scheinbar nur eine Variante von a · h ist: für
        // a = 6, c = 2, h = 4 fällt es mit a + c + h zusammen, und ohne
        // diesen Eintrag verlangte der Test dort den späteren Hinweis.
        falsch: [
          [(a + c) * h, "Halbierung vergessen"],
          [a * h, "nur mit a"],
          [(a * h) / 2, "das wäre ein Dreieck"],
          [a + c + h, "addiert"],
        ],
      };
    },
  });

  // Aufgabe 4 — dasselbe Parallelogramm über beide Seiten gerechnet. Gemessen: 77 verschiedene in
  // 200 Würfen. Die Ziehung ist nicht gleichverteilt (q wird bei Gleichheit verschoben, m hängt
  // von d ab); die nachgebildete Verteilung ergibt E = 24,1 und ein 10⁻⁴-Quantil bei 30 Zügen
  // von 17.
  await pruefeAufgabe(page, bericht, {
    nr: 4, name: "A4 zwei Seiten, zwei Höhen", runden: 30, mindestensVerschieden: 17,
    deute: (frage) => {
      // Im Text steht h<sub>a</sub>; als reiner Text wird daraus „ha“. Deshalb werden die drei
      // Zahlen der Reihe nach gelesen statt über ein Formelzeichen adressiert.
      const z = zahlen(frage);
      if (z.length !== 3) return null;
      const [a, b, ha] = z;
      const A = a * ha;
      const hb = A / b;
      pruefe(a !== b, `A4: a und b sind beide ${a} cm — dann wären beide Höhen gleich`);
      pruefe(Number.isInteger(hb), `A4: h_b = ${A} : ${b} ist nicht ganzzahlig`);
      pruefe(ha < b && hb < a, `A4: eine Höhe ist länger als die Nachbarseite (h_a = ${ha}, b = ${b}; h_b = ${hb}, a = ${a})`);
      return {
        felder: [A, hb],
        toleranz: 0.02,
        falschFelder: [
          [0, a * b, "Seiten multipliziert"],
          [0, (a * ha) / 2, "Halbiert wird beim Dreieck"],
          [1, ha, "längeren"],
          [1, A * b, "multipliziert"],
        ],
      };
    },
  });

  // Aufgabe 5 — rückwärts: aus der Fläche eine Länge bestimmen. Gemessen: 156 verschiedene in 200
  // Würfen, zurückgerechnet rund 383 Kandidaten. Schranke: simuliertes 10⁻⁴-Quantil bei 30 Zügen
  // für 0,8 · n — 23.
  await pruefeAufgabe(page, bericht, {
    nr: 5, name: "A5 rückwärts", runden: 30, mindestensVerschieden: 23,
    deute: (frage) => {
      const tz = frage.match(/Trapez hat den Flächeninhalt A = (\d+) cm².*?h = (\d+) cm.*?a = (\d+) cm/);
      if (tz) {
        const [A, h, a] = tz.slice(1).map(Number);
        const summe = (2 * A) / h;
        pruefe(Number.isInteger(summe), `A5: 2 · ${A} : ${h} ist nicht ganzzahlig`);
        return {
          richtig: summe - a,
          toleranz: 0.02,
          falsch: [
            [summe, "a + c"],
            [summe - 2 * a, "zweimal abgezogen"],
            [A / h, "Halbierung vergessen"],
          ],
        };
      }
      const dp = frage.match(/(Dreieck|Parallelogramm) hat den Flächeninhalt A = (\d+) cm².*?g = (\d+) cm/);
      if (!dp) return null;
      const dreieck = dp[1] === "Dreieck";
      const A = Number(dp[2]), g = Number(dp[3]);
      return {
        richtig: dreieck ? (2 * A) / g : A / g,
        toleranz: 0.02,
        falsch: [
          [dreieck ? A / g : (2 * A) / g, dreieck ? "Halbierung vergessen" : "keine Halbierung"],
          [A - g, "subtrahieren"],
          [A * g, "multipliziert"],
        ],
      };
    },
  });

  // Aufgabe 6 — Restfläche: Zusammensetzen durch Wegnehmen. Gemessen: 198 verschiedene in 200
  // Würfen, zurückgerechnet rund 9900 Kandidaten. Schranke: simuliertes 10⁻⁴-Quantil bei 30 Zügen
  // für 0,8 · n — 28.
  const formen = new Set();
  await pruefeAufgabe(page, bericht, {
    nr: 6, name: "A6 Restfläche", runden: 30, mindestensVerschieden: 28,
    deute: (frage) => {
      const platte = frage.match(/Blechplatte von (\d+) cm × (\d+) cm/);
      if (!platte) return null;
      const br = Number(platte[1]), t = Number(platte[2]);
      const gesamt = br * t;
      let ausschnitt = null, ohneHalb = null, passt = true;
      const pg = frage.match(/(Dreieck|Parallelogramm) mit der Grundseite (\d+) cm und der Höhe (\d+) cm/);
      const tz = frage.match(/Trapez mit den parallelen Seiten (\d+) cm und (\d+) cm und der Höhe (\d+) cm/);
      if (pg) {
        const g = Number(pg[2]), h = Number(pg[3]);
        ausschnitt = pg[1] === "Dreieck" ? (g * h) / 2 : g * h;
        ohneHalb = pg[1] === "Dreieck" ? g * h : null;
        passt = g <= br && h <= t;
        formen.add(pg[1]);
      } else if (tz) {
        const [a, c, h] = tz.slice(1).map(Number);
        ausschnitt = ((a + c) * h) / 2;
        ohneHalb = (a + c) * h;
        passt = a <= br && h <= t && c < a;
        formen.add("Trapez");
      } else {
        return null;
      }
      pruefe(passt, `A6: der Ausschnitt passt nicht in die Platte ${br} × ${t} — „${frage}“`);
      pruefe(Number.isInteger(ausschnitt), `A6: die Ausschnittfläche ${ausschnitt} cm² ist nicht ganzzahlig`);
      pruefe(ausschnitt < gesamt, `A6: der Ausschnitt (${ausschnitt} cm²) ist nicht kleiner als die Platte (${gesamt} cm²)`);
      return {
        felder: [ausschnitt, gesamt - ausschnitt],
        toleranz: 0.02,
        falschFelder: [
          [0, ohneHalb, "Halbierung vergessen"],
          [1, gesamt, "ganze"],
          [1, gesamt + ausschnitt, "addiert"],
        ],
      };
    },
  });
  pruefe(formen.size === 3,
    `A6: nur ${formen.size} der drei Ausschnittformen kamen in 30 Zügen vor`);

  // Aufgabe 7 — Hauswand aus Rechteck und Giebeldreieck. Gemessen: 197 verschiedene in 200 Würfen,
  // zurückgerechnet rund 6600 Kandidaten. Schranke: simuliertes 10⁻⁴-Quantil bei 30 Zügen für
  // 0,8 · n — 28.
  await pruefeAufgabe(page, bericht, {
    nr: 7, name: "A7 Hauswand", runden: 30, mindestensVerschieden: 28,
    deute: (frage) => {
      const m = frage.match(/Rechteck ist (\d+) m breit und (\d+) m hoch.*?Höhe (\d+) m.*?(\d+) € je Quadratmeter/);
      if (!m) return null;
      const [b, hR, hD, preis] = m.slice(1).map(Number);
      const flRechteck = b * hR, flGiebel = (b * hD) / 2;
      return {
        richtig: (flRechteck + flGiebel) * preis,
        toleranz: 0.02,
        falsch: [
          [(flRechteck + b * hD) * preis, "Halbierung"],
          [flRechteck * preis, "nur das Rechteck"],
          [flGiebel * preis, "nur das Giebeldreieck"],
          [flRechteck + flGiebel, "der Preis"],
        ],
      };
    },
  });

  // Aufgabe 8 — vom Grundstück zum Einkaufszettel, drei Felder. Gemessen: 200 verschiedene in 200
  // Würfen; die Schranke ist das simulierte 10⁻⁴-Quantil bei 30 Zügen für ein vorsichtig auf
  // 16 000 gesetztes n — 28.
  let aufgerundet = 0;
  await pruefeAufgabe(page, bericht, {
    nr: 8, name: "A8 Rasen säen", runden: 30, mindestensVerschieden: 28,
    deute: (frage) => {
      const m = frage.match(
        /parallelen Seiten (\d+) m und (\d+) m und der Höhe (\d+) m.*?Höhe (\d+) m an.*?reicht für (\d+) m².*?kostet (\d+) €/);
      if (!m) return null;
      const [a, c, h, hd, reicht, preis] = m.slice(1).map(Number);
      const aTrapez = ((a + c) * h) / 2;
      const aDreieck = (c * hd) / 2;
      const A = aTrapez + aDreieck;
      const packungen = Math.ceil(A / reicht);
      pruefe(c < a, `A8: c = ${c} m ist nicht kürzer als a = ${a} m`);
      pruefe(Number.isInteger(aTrapez) && Number.isInteger(aDreieck),
        `A8: eine Teilfläche ist nicht ganzzahlig (${aTrapez}, ${aDreieck})`);
      pruefe(packungen * reicht >= A,
        `A8: ${packungen} Packungen decken nur ${packungen * reicht} m², gebraucht werden ${A} m²`);
      if (packungen * reicht > A) aufgerundet++;
      return {
        felder: [A, packungen, packungen * preis],
        toleranz: 0.02,
        falschFelder: [
          [0, aTrapez, "Das angesetzte Dreieck"],
          [0, (a + c) * h + aDreieck, "fehlt die Halbierung"],
          [1, Math.floor(A / reicht), "Abgerundet"],
          [2, (A / reicht) * preis, "Bezahlt werden"],
        ],
      };
    },
  });
  pruefe(aufgerundet > 0,
    "A8: in 30 Zügen ging die Packungszahl immer glatt auf — dann wird das Aufrunden nie geprüft");
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
