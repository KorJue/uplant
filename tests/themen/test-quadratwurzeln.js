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

// Zerlegt a in f² · rest mit dem größtmöglichen f — hier unabhängig von der
// Seite nachgerechnet, damit der Test nicht ihre eigene Zerlegung glaubt.
function quadratfaktor(a) {
  let rest = a, f = 1;
  for (let k = 2; k * k <= rest; k++) {
    while (rest % (k * k) === 0) { rest /= k * k; f *= k; }
  }
  return { f, rest };
}

// Über alle Runden gesammelt: Aufgabe 4 muss verschiedene Arten von Zahlen zeigen,
// nicht dreißigmal dieselbe Sorte Wurzel.
const artenA4 = new Set();

// Welcher Grund im Hinweis stehen MUSS. Ein Hinweis, der nur „falsch“ sagt,
// oder einer, der bei π von Quadratzahlen redet, fällt damit auf.
function begruendungsMuster(text, rational) {
  if (text === "π") return "ohne Periode";
  if (/periodisch/.test(text)) return "wiederholt sich";
  if (/^\d+ · √/.test(text)) return "bleibt irrational";
  if (/^√/.test(text)) return rational ? "eine ganze Zahl" : "keine Quadratzahl";
  if (/^\d+\/\d+$/.test(text)) return "Definition von rational";
  return "bricht ab";
}

async function aufgaben(page) {
  // Aufgabe 1 — Quadratzahlen von 4 bis 625. Gemessen mit tests/werkzeug-streuung.js: 22
  // verschiedene in 200 Würfen, zurückgerechnet also rund 22 Kandidaten. Die Schranke ist das
  // simulierte 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für 0,8 · n gerechnet — 9.
  await pruefeAufgabe(page, bericht, {
    nr: 1, name: "A1 Wurzel ziehen", runden: 30, mindestensVerschieden: 9,
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

  // Aufgabe 2 — Produkt- und Quotientenregel. Die Kandidatenliste hat nach dem Kollisionsfilter
  // 159 Einträge, die alle einen eigenen Aufgabentext ergeben; simuliert liegt der
  // Erwartungswert bei 27,4 verschiedenen in 30 Zügen und das 10⁻⁴-Quantil bei 21. Schranke 20.
  await pruefeAufgabe(page, bericht, {
    nr: 2, name: "A2 Produkt- und Quotientenregel", runden: 30, mindestensVerschieden: 20,
    deute: (frage) => {
      const m = frage.match(/√([\d.]+) ([·:]) √([\d.]+)/);
      if (!m) return null;
      const a = Number(m[1].replace(/\./g, ""));
      const b = Number(m[3].replace(/\./g, ""));
      const mal = m[2] === "·";
      const radikand = mal ? a * b : a / b;
      const wert = Math.sqrt(radikand);
      return {
        felder: [radikand, wert],
        toleranz: 0.0005,
        falschFelder: [
          // Der klassische Fehler: die Radikanden addiert bzw. subtrahiert.
          [0, mal ? a + b : a - b, mal ? "multipliziert" : "geteilt"],
          [0, a, "erste Radikand"],
          [0, b, "zweite Radikand"],
          [1, radikand, "steht unter der Wurzel"],
          [1, a, "einer der beiden Radikanden"],
        ],
        pruefe: (f, rueck) => {
          pruefe(!istQuadrat(a) && !istQuadrat(b),
            `A2: ${a} oder ${b} ist selbst eine Quadratzahl — dann zeigt die Aufgabe nichts — „${f}“`);
          pruefe(istQuadrat(radikand) && Number.isInteger(wert),
            `A2: ${radikand} ist keine Quadratzahl — „${f}“`);
          pruefe(wert >= 2, `A2: das Ergebnis ${wert} ist zu klein, um etwas zu zeigen — „${f}“`);
          // Die Regel gilt für Produkte und Quotienten, nicht für Summen — das
          // muss die Musterlösung sagen, sonst lernt man sie falsch.
          pruefe(rueck.includes("Für Summen und Differenzen gibt es keine solche Regel"),
            `A2: die Musterlösung grenzt die Regel nicht gegen Summen ab — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 3 — Wurzel zwischen zwei ganzen Zahlen einschachteln. Gemessen mit
  // tests/werkzeug-streuung.js: 113 verschiedene in 200 Würfen, zurückgerechnet also rund 156
  // Kandidaten. Die Schranke ist das simulierte 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für
  // 0,8 · n gerechnet — 20.
  await pruefeAufgabe(page, bericht, {
    nr: 3, name: "A3 einschachteln", runden: 30, mindestensVerschieden: 20,
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
          pruefe(!istQuadrat(a), `A3: ${a} ist selbst eine Quadratzahl — „${f}“`);
          // Die Einschachtelung muss wirklich eine sein.
          pruefe(unten < a && a < oben, `A3: ${a} liegt nicht zwischen ${unten} und ${oben} — „${f}“`);
          // Das Wurzelziehen erhält die Ordnung — das ist die Begründung.
          pruefe(rueck.includes("erhält die Reihenfolge"),
            `A3: die Musterlösung begründet die Einschachtelung nicht — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 4 — rational oder irrational. Nachgebildet wurde die wirkliche Ziehung (je eine
  // rationale und eine irrationale Zahl gesetzt, die dritte aus dem Rest, dann gemischt):
  // Erwartungswert 30,0 verschiedene in 30 Zügen, das 10⁻⁴-Quantil liegt bei 29. Schranke 27.
  await pruefeAufgabe(page, bericht, {
    nr: 4, name: "A4 rational oder irrational", runden: 30, mindestensVerschieden: 27,
    deute: (frage) => {
      const m = frage.match(/ist:\s*a\)\s*(.+?)\s*b\)\s*(.+?)\s*c\)\s*(.+?)$/);
      if (!m) return null;
      const texte = m.slice(1, 4).map((t) => t.trim());
      // Unabhängig von der Seite entschieden: Eine Wurzel ist genau dann
      // rational, wenn ihr Radikand eine Quadratzahl ist.
      const istRational = (t) => {
        if (t === "π") return false;
        if (/periodisch/.test(t)) return true;
        const v = t.match(/^(\d+) · √([\d.]+)$/);
        if (v) return istQuadrat(Number(v[2].replace(/\./g, "")));
        const w = t.match(/^√([\d.]+)$/);
        if (w) return istQuadrat(Number(w[1].replace(/\./g, "")));
        if (/^\d+\/\d+$/.test(t)) return true;
        if (/^\d+,\d+$/.test(t)) return true;
        return null;
      };
      const werte = texte.map(istRational);
      if (werte.some((w) => w === null)) return null;
      texte.forEach((t) => artenA4.add(/^√/.test(t) ? "wurzel" : t === "π" ? "pi" : /periodisch/.test(t) ? "periodisch"
        : /√/.test(t) ? "vielfaches" : /\//.test(t) ? "bruch" : "dezimal"));
      return {
        felder: werte.map((w) => (w ? 1 : 2)),
        toleranz: 0.0005,
        // Jedes Feld wird einzeln verdorben; der Hinweis muss die Zahl selbst
        // begründen, nicht nur „falsch“ melden — und zwar mit IHREM Grund.
        falschFelder: werte.map((w, i) => [i, w ? 2 : 1, begruendungsMuster(texte[i], w)]),
        pruefe: (f, rueck) => {
          pruefe(werte.some((w) => w) && werte.some((w) => !w),
            `A4: alle drei Zahlen sind ${werte[0] ? "rational" : "irrational"} — dann ist nichts zu unterscheiden — „${f}“`);
          pruefe(new Set(texte).size === 3, `A4: eine Zahl kommt doppelt vor — „${f}“`);
          texte.forEach((t, i) => {
            pruefe(rueck.includes(`${"abc"[i]}) ${t} ist ${werte[i] ? "rational" : "irrational"}`),
              `A4: die Musterlösung ordnet ${t} nicht als ${werte[i] ? "rational" : "irrational"} ein — „${f}“`);
          });
        },
      };
    },
  });

  // Aufgabe 5 — teilweise Wurzelziehen. Gemessen mit tests/werkzeug-streuung.js: 122
  // verschiedene in 200 Würfen, zurückgerechnet also rund 184 Kandidaten. Die Schranke ist das
  // simulierte 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für 0,8 · n gerechnet — 21.
  await pruefeAufgabe(page, bericht, {
    nr: 5, name: "A5 teilweise Wurzel", runden: 30, mindestensVerschieden: 21,
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
          pruefe(Number.isInteger(f), `A5: ${a} : ${rest} = ${f2} ist keine Quadratzahl — „${fr}“`);
          pruefe(f > 1, `A5: der Faktor ${f} bringt keine Vereinfachung — „${fr}“`);
          // Der Rest darf keine Quadratzahl mehr enthalten, sonst wäre die
          // Zerlegung nicht vollständig.
          pruefe(!Array.from({ length: 30 }, (_, i) => i + 2).some((t) => rest % (t * t) === 0),
            `A5: der Rest ${rest} enthält noch einen Quadratfaktor — „${fr}“`);
          pruefe(Math.abs(f * f * rest - a) < 1e-9, `A5: ${f}² · ${rest} ≠ ${a} — „${fr}“`);
        },
      };
    },
  });

  // Aufgabe 6 — zwei Wurzeln zusammenfassen. Die Kandidatenliste hat nach dem Kollisionsfilter
  // 335 Einträge mit ebenso vielen Aufgabentexten; simuliert liegt der Erwartungswert bei 28,7
  // verschiedenen in 30 Zügen und das 10⁻⁴-Quantil bei 23. Schranke 22.
  await pruefeAufgabe(page, bericht, {
    nr: 6, name: "A6 Wurzeln zusammenfassen", runden: 30, mindestensVerschieden: 22,
    deute: (frage) => {
      const m = frage.match(/zusammen: √([\d.]+) ([+−]) √([\d.]+)/);
      if (!m) return null;
      const a = Number(m[1].replace(/\./g, ""));
      const b = Number(m[3].replace(/\./g, ""));
      const plus = m[2] === "+";
      const za = quadratfaktor(a), zb = quadratfaktor(b);
      if (za.rest !== zb.rest) return null;
      const r = za.rest;
      const c = plus ? za.f + zb.f : za.f - zb.f;
      const wert = c * Math.sqrt(r);
      const falschRadikand = plus ? a + b : a - b;
      return {
        felder: [c, r, wert],
        toleranz: 0.0005,
        falschFelder: [
          // Die Radikanden verrechnet — dann bliebe der Faktor 1 stehen.
          [0, 1, "häufigste Fehler"],
          [0, za.f * zb.f, plus ? "addiert, nicht multipliziert" : "subtrahiert, nicht multipliziert"],
          [0, za.f, "ersten Summanden"],
          [0, zb.f, "zweiten Summanden"],
          [1, falschRadikand, plus ? "nicht addiert" : "nicht subtrahiert"],
          [2, c * r, "unter der Wurzel steht"],
          [2, Math.sqrt(falschRadikand), "Radikanden wurden verrechnet"],
        ],
        pruefe: (f, rueck) => {
          pruefe(Number.isInteger(c) && c >= 1, `A6: der Faktor ${c} taugt nicht — „${f}“`);
          pruefe(za.f !== zb.f, `A6: beide Summanden haben denselben Faktor ${za.f} — „${f}“`);
          pruefe(!istQuadrat(r) && r >= 2, `A6: der Rest ${r} ist selbst eine Quadratzahl — „${f}“`);
          // Der Kern: Das Ergebnis ist NICHT die Wurzel aus der Summe.
          pruefe(Math.abs(wert - Math.sqrt(falschRadikand)) > 0.01,
            `A6: c·√r und √(a ${m[2]} b) liegen zu dicht beieinander — „${f}“`);
          pruefe(Math.abs(wert - (plus ? Math.sqrt(a) + Math.sqrt(b) : Math.sqrt(a) - Math.sqrt(b))) < 1e-9,
            `A6: ${c}·√${r} ist nicht √${a} ${m[2]} √${b} — „${f}“`);
          pruefe(rueck.includes("keine Wurzelregel"),
            `A6: die Musterlösung warnt nicht vor dem Kurzweg — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 7 — Diagonale nach Pythagoras. 68 Seitenpaare; bei 30 Zügen ist
  // E = 24,4 und σ = 1,2 — Schranke E − 3σ = 20.
  await pruefeAufgabe(page, bericht, {
    nr: 7, name: "A7 Diagonale", runden: 30, mindestensVerschieden: 20,
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
          pruefe(Number.isInteger(d), `A7: √${q} = ${d} ist nicht ganzzahlig — „${f}“`);
          pruefe(a !== b, `A7: bei a = b = ${a} wäre der Hinweis auf die Differenz sinnlos — „${f}“`);
          // Die Diagonale liegt stets zwischen der längeren Seite und der
          // Summe beider — das ist die Dreiecksungleichung.
          pruefe(d > Math.max(a, b) && d < a + b,
            `A7: die Diagonale ${d} liegt nicht zwischen ${Math.max(a, b)} und ${a + b} — „${f}“`);
          pruefe(rueck.includes("pythagoreisches Tripel"),
            `A7: die Musterlösung nennt das Tripel nicht — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 8 — Diagonale mit irrationaler Länge. 306 Seitenpaare nach dem Kollisionsfilter, dazu
  // vier Kontexte; simuliert liegt der Erwartungswert bei 29,7 verschiedenen in 30 Zügen und das
  // 10⁻⁴-Quantil bei 26. Schranke 25.
  await pruefeAufgabe(page, bericht, {
    nr: 8, name: "A8 Diagonale mit Wurzel", runden: 30, mindestensVerschieden: 25,
    deute: (frage) => {
      const m = frage.match(/ist (\d+) \S+ \w+ und (\d+) \S+ \w+\./);
      if (!m) return null;
      const b = Number(m[1]), a = Number(m[2]);
      const q = a * a + b * b;
      const { f, rest } = quadratfaktor(q);
      const d = Math.sqrt(q);
      return {
        felder: [q, f, d],
        toleranz: 0.0005,
        falschFelder: [
          [0, a + b, "um die Ecke"],
          [0, (a + b) * (a + b), "nicht a² + b²"],
          [0, a * b, "Flächeninhalt"],
          [0, b * b - a * a, "addiert, nicht subtrahiert"],
          [1, rest, "unter der Wurzel stehen"],
          [1, f * f, "Quadratzahl in"],
          [1, q, "ganze Radikand"],
          [2, q, "ist d², nicht d"],
          [2, a + b, "Weg um die Ecke"],
        ],
        pruefe: (fr, rueck) => {
          pruefe(!istQuadrat(q), `A8: ${q} ist eine Quadratzahl — dann gäbe es nichts zu runden — „${fr}“`);
          pruefe(f >= 2 && rest >= 2, `A8: aus ${q} lässt sich nichts herausziehen (${f}, ${rest}) — „${fr}“`);
          pruefe(!istQuadrat(rest), `A8: der Rest ${rest} enthält noch einen Quadratfaktor — „${fr}“`);
          pruefe(Math.abs(f * f * rest - q) < 1e-9, `A8: ${f}² · ${rest} ≠ ${q} — „${fr}“`);
          // Dreiecksungleichung: Die Diagonale liegt zwischen der längeren Seite und der Summe.
          pruefe(d > b && d < a + b, `A8: die Diagonale ${d} liegt nicht zwischen ${b} und ${a + b} — „${fr}“`);
          pruefe(rueck.includes("exakte") && rueck.includes("Näherung"),
            `A8: die Musterlösung unterscheidet exakten und gerundeten Wert nicht — „${fr}“`);
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
      pruefe(artenA4.size >= 4,
        `A4: in 30 Runden kamen nur ${artenA4.size} Arten von Zahlen vor (${[...artenA4].join(", ")})`);
    }
    else await pruefeKontrast(page, bericht, "dunkel");
    await pruefeNotation(page, bericht, wo);
    for (const s of page.stoerungen) pruefe(false, `${wo}: ${s}`);
    await page.close();
  }
  await browser.close();
  bericht.abschluss();
})();
