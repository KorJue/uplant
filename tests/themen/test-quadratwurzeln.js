// Fachliche Prüfung: Kapitel 4, Thema 7 „Quadratwurzeln“.
//
// Zwei Dinge werden hier leicht falsch gelernt: dass die Wurzel auch die
// negative Lösung meine (das Wurzelzeichen bezeichnet stets die nichtnegative
// Zahl), und dass √(a² + b²) irgendetwas mit a + b zu tun habe. Beides wird
// als Antwort eingetragen. Dazu das teilweise Wurzelziehen, bei dem die
// Quadratzahl als ihre Wurzel vor das Zeichen tritt.

"use strict";

const { neuerBericht } = require("../lib/pruefen");
const { starteBrowser, neueSeite, oeffne } = require("../lib/seite");
const { pruefeNotation } = require("../lib/notation");
const { pruefeKontrast } = require("../lib/kontrast");
const { pruefeAufgabe } = require("../lib/aufgaben");

const bericht = neuerBericht();
const { pruefe } = bericht;
const SEITE = "/mathematik/grundwissen-5-10/04-gleichungen-zuordnungen-funktionen/07-quadratwurzeln/index.html";

const istQuadrat = (n) => Number.isInteger(Math.sqrt(n));

async function aufgaben(page) {
  // Aufgabe 1 — Quadratzahlen von 4 bis 625. Von den 24 Kandidaten fallen die
  // beiden weg, bei denen zwei Ablenker zusammenfielen (n = 2: a = 2n; n = 4:
  // a/2 = 2n), es bleiben 22. Bei 30 Zügen ist E = 16,5 und σ = 1,4 —
  // Schranke E − 3σ = 12.
  await pruefeAufgabe(page, bericht, {
    nr: 1, name: "A1 Wurzel ziehen", runden: 30, mindestensVerschieden: 12,
    deute: (frage) => {
      const m = frage.match(/Berechne √([\d.]+)/);
      if (!m) return null;
      const a = Number(m[1].replace(/\./g, ""));
      const n = Math.sqrt(a);
      return {
        richtig: n,
        toleranz: 0.0005,
        falsch: [
          [a, "Radikand selbst"],
          [a / 2, "nicht die Hälfte"],
          // Die negative Lösung — das Wurzelzeichen meint sie nicht.
          [-n, "nichtnegative"],
        ],
        pruefe: (f, rueck) => {
          pruefe(Number.isInteger(n), `A1: √${a} = ${n} ist keine ganze Zahl — „${f}“`);
          // Der Kern des Abschnitts: Auch (−n)² ergibt a, aber das
          // Wurzelzeichen bezeichnet definitionsgemäß die nichtnegative Zahl.
          // Die Musterlösung muss beides sagen, nicht nur das Ergebnis.
          pruefe(rueck.includes(`(−${n})² = ${a}`) && rueck.includes("nicht negativ"),
            `A1: die Musterlösung stellt den negativen Fall nicht daneben — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 2 — Wurzel zwischen zwei ganzen Zahlen einschachteln. 184
  // Radikanden; Doppel sind bei 30 Zügen selten — Schranke 25.
  await pruefeAufgabe(page, bericht, {
    nr: 2, name: "A2 einschachteln", runden: 30, mindestensVerschieden: 25,
    deute: (frage) => {
      const m = frage.match(/liegt √([\d.]+)/);
      if (!m) return null;
      const a = Number(m[1].replace(/\./g, ""));
      const n = Math.floor(Math.sqrt(a));
      const unten = n * n, oben = (n + 1) * (n + 1);
      return {
        richtig: n,
        toleranz: 0.0005,
        falsch: [
          // Die größere der beiden Zahlen.
          [n + 1, "größere"],
          // Die Abstände zu den Nachbarquadratzahlen.
          [a - unten, "nächstkleineren"],
          [oben - a, "nächstgrößeren"],
        ],
        pruefe: (f, rueck) => {
          pruefe(!istQuadrat(a), `A2: ${a} ist selbst eine Quadratzahl — „${f}“`);
          // Die Einschachtelung muss wirklich eine sein.
          pruefe(unten < a && a < oben, `A2: ${a} liegt nicht zwischen ${unten} und ${oben} — „${f}“`);
          // Das Wurzelziehen erhält die Ordnung — das ist die Begründung.
          pruefe(rueck.includes("erhält die Reihenfolge"),
            `A2: die Musterlösung begründet die Einschachtelung nicht — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 3 — teilweise Wurzelziehen. Mehrere hundert Radikanden;
  // Doppel sind bei 30 Zügen selten — Schranke 26.
  await pruefeAufgabe(page, bericht, {
    nr: 3, name: "A3 teilweise Wurzel", runden: 30, mindestensVerschieden: 26,
    deute: (frage) => {
      const m = frage.match(/√([\d.]+) = c · √([\d.]+)/);
      if (!m) return null;
      const a = Number(m[1].replace(/\./g, ""));
      const rest = Number(m[2].replace(/\./g, ""));
      const f2 = a / rest;
      const f = Math.sqrt(f2);
      return {
        richtig: f,
        toleranz: 0.0005,
        falsch: [
          // Die Quadratzahl selbst statt ihrer Wurzel.
          [f2, "Quadratzahl"],
          [rest, "der Rest"],
          [a, "Radikand"],
          // Faktor und Rest multipliziert.
          [f * rest, "mit dem Rest multipliziert"],
        ],
        pruefe: (fr) => {
          pruefe(Number.isInteger(f), `A3: ${a} : ${rest} = ${f2} ist keine Quadratzahl — „${fr}“`);
          pruefe(f > 1, `A3: der Faktor ${f} bringt keine Vereinfachung — „${fr}“`);
          // Der Rest darf keine Quadratzahl mehr enthalten, sonst wäre die
          // Zerlegung nicht vollständig.
          pruefe(!Array.from({ length: 30 }, (_, i) => i + 2).some((t) => rest % (t * t) === 0),
            `A3: der Rest ${rest} enthält noch einen Quadratfaktor — „${fr}“`);
          pruefe(Math.abs(f * f * rest - a) < 1e-9, `A3: ${f}² · ${rest} ≠ ${a} — „${fr}“`);
        },
      };
    },
  });

  // Aufgabe 4 — Diagonale nach Pythagoras. 68 Seitenpaare; bei 30 Zügen ist
  // E = 24,4 und σ = 1,2 — Schranke E − 3σ = 20.
  await pruefeAufgabe(page, bericht, {
    nr: 4, name: "A4 Diagonale", runden: 30, mindestensVerschieden: 20,
    deute: (frage) => {
      const m = frage.match(/ist (\d+) \S+ breit und (\d+) \S+ hoch/);
      if (!m) return null;
      const [a, b] = m.slice(1).map(Number);
      const q = a * a + b * b;
      const d = Math.sqrt(q);
      return {
        richtig: d,
        toleranz: 0.0005,
        falsch: [
          // Der Weg um die Ecke.
          [a + b, "um die Ecke"],
          // Bei d² stehen geblieben.
          [q, "der Diagonalen"],
          [Math.abs(b - a), "Unterschied"],
          [a, "eine der beiden Seiten"],
        ],
        pruefe: (f, rueck) => {
          pruefe(Number.isInteger(d), `A4: √${q} = ${d} ist nicht ganzzahlig — „${f}“`);
          pruefe(a !== b, `A4: bei a = b = ${a} wäre der Hinweis auf die Differenz sinnlos — „${f}“`);
          // Die Diagonale liegt stets zwischen der längeren Seite und der
          // Summe beider — das ist die Dreiecksungleichung.
          pruefe(d > Math.max(a, b) && d < a + b,
            `A4: die Diagonale ${d} liegt nicht zwischen ${Math.max(a, b)} und ${a + b} — „${f}“`);
          pruefe(rueck.includes("pythagoreisches Tripel"),
            `A4: die Musterlösung nennt das Tripel nicht — „${f}“`);
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
