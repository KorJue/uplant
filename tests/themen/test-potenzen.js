// Fachliche Prüfung: Kapitel 4, Thema 9 „Potenzen“.
//
// Der Exponent sagt, wie oft die Basis als FAKTOR auftritt — nicht als
// Summand. Genau diese Verwechslung wird eingetragen, dazu die drei
// Potenzgesetze in ihrer typischen Vertauschung (bei (aᵐ)ʳ multiplizieren,
// beim Malnehmen addieren, beim Teilen subtrahieren) und der negative
// Exponent als Kehrwert.

"use strict";

const { neuerBericht } = require("../lib/pruefen");
const { starteBrowser, neueSeite, oeffne } = require("../lib/seite");
const { pruefeNotation } = require("../lib/notation");
const { pruefeKontrast } = require("../lib/kontrast");
const { pruefeAufgabe } = require("../lib/aufgaben");

const bericht = neuerBericht();
const { pruefe } = bericht;
const SEITE = "/mathematik/grundwissen-5-10/04-gleichungen-zuordnungen-funktionen/09-potenzen/index.html";

const minus = (s) => s.replace(/−/g, "-");
// Ganzzahlige Potenz ohne Math.pow: 2³ muss exakt 8 sein, nicht 7,999…
function potenz(a, n) {
  let r = 1;
  for (let i = 0; i < n; i++) r *= a;
  return r;
}

async function aufgaben(page) {
  // Aufgabe 1 — Potenzwert. 8 Basen × 3 Exponenten; die beiden Fälle, in denen
  // aⁿ mit a · n oder mit −aⁿ zusammenfiele (2² und (−2)²), siebt der
  // Generator aus, es bleiben 22. Bei 30 Zügen ist E = 16,6 und σ = 1,5 —
  // Schranke E − 3σ = 12.
  await pruefeAufgabe(page, bericht, {
    nr: 1, name: "A1 Potenzwert", runden: 30, mindestensVerschieden: 12,
    deute: (frage) => {
      const m = minus(frage).match(/Berechne \(?(-?\d+)\)?(\d)/);
      if (!m) return null;
      const a = Number(m[1]), n = Number(m[2]);
      if (n < 2 || n > 4) return null;
      const w = potenz(a, n);
      return {
        richtig: w,
        toleranz: 0.0005,
        falsch: [
          // Der Exponent als Faktor missverstanden.
          [a * n, "als Faktor"],
          // Das Vorzeichen der Potenz verdreht.
          [-w, null],
        ],
        pruefe: (f, rueck) => {
          // Bei negativer Basis entscheidet die Parität des Exponenten.
          if (a < 0) {
            pruefe((w > 0) === (n % 2 === 0),
              `A1: (${a})^${n} = ${w}, aber der Exponent ist ${n % 2 === 0 ? "gerade" : "ungerade"} — „${f}“`);
          }
          // Die Musterlösung schreibt die Faktorenkette aus.
          pruefe(rueck.includes(a < 0 ? `(${minus(String(a)).replace("-", "−")})` : String(a)),
            `A1: die Musterlösung zeigt die Basis nicht — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 2 — die drei Potenzgesetze hintereinander. 175 zulässige
  // Exponentenpaare; bei 30 Zügen ist E = 27,6 und σ = 1,4 — Schranke 23.
  await pruefeAufgabe(page, bericht, {
    nr: 2, name: "A2 Potenzgesetze", runden: 30, mindestensVerschieden: 23,
    deute: (frage) => {
      const m = frage.match(/\(a(\d)\)(\d) · a(\d) : a(\d)/);
      if (!m) return null;
      const [mm, r, n, k] = m.slice(1).map(Number);
      const innen = r * mm, zwischen = innen + n, e = zwischen - k;
      return {
        richtig: e,
        toleranz: 0.0005,
        falsch: [
          // Bei der Potenz einer Potenz addiert statt multipliziert.
          [mm + r + n - k, "multipliziert"],
          // Beim Malnehmen multipliziert statt addiert.
          [innen * n - k, "addiert"],
          // Beim Teilen addiert statt subtrahiert.
          [innen + n + k, "Division"],
        ],
        pruefe: (f, rueck) => {
          pruefe(e >= 0 && e <= 9, `A2: der Exponent ${e} liegt außerhalb des vorgesehenen Bereichs — „${f}“`);
          // Alle drei Gesetze müssen in der Musterlösung stehen.
          pruefe(rueck.includes("Gesetz (1)") && rueck.includes("Gesetz (2)") && rueck.includes("Gesetz (3)"),
            `A2: die Musterlösung benennt nicht alle drei Gesetze — „${f}“`);
          // a⁰ = 1 darf nicht verschwiegen werden.
          if (e === 0) {
            pruefe(rueck.includes("a0 = 1") || rueck.includes("gleich 1"),
              `A2: bei Exponent 0 fehlt der Hinweis auf a⁰ = 1 — „${f}“`);
          }
        },
      };
    },
  });

  // Aufgabe 3 — negativer Exponent als Kehrwert. 24 Fassungen; bei 30 Zügen
  // ist E = 17,3 und σ = 1,6 — Schranke E − 3σ = 12.
  await pruefeAufgabe(page, bericht, {
    nr: 3, name: "A3 negativer Exponent", runden: 30, mindestensVerschieden: 12,
    deute: (frage) => {
      const m = frage.match(/(\d+)n · (\d+)(\d) = 1 : ([\d.]+)/);
      if (!m) return null;
      const a = Number(m[1]);
      if (Number(m[2]) !== a) return null;
      const j = Number(m[3]);
      const nenner = Number(m[4].replace(/\./g, ""));
      // k aus a^k = nenner.
      let k = 0, probe = 1;
      while (probe < nenner && k < 12) { probe *= a; k++; }
      if (probe !== nenner) return null;
      return {
        richtig: -(k + j),
        toleranz: 0.0005,
        falsch: [
          // Das Vorzeichen des Kehrwerts vergessen.
          [k + j, "Kehrwert"],
          // Den Exponenten der linken Seite falsch verrechnet.
          [k - j, "linken"],
          [j - k, "linken"],
        ],
        pruefe: (f) => {
          // Die Probe: a^n · a^j muss wirklich 1 : a^k ergeben.
          pruefe(Math.abs(potenz(a, j) / potenz(a, k + j) - 1 / nenner) < 1e-12,
            `A3: a^(−${k + j}) · a^${j} ist nicht 1 : ${nenner} — „${f}“`);
          pruefe(j !== k, `A3: mit j = k = ${j} fielen zwei Fehlerwerte zusammen — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 4 — dritte Wurzel aus einer Zehnerpotenz. 16 Fassungen; bei 30
  // Zügen ist E = 13,7 und σ = 1,2 — Schranke E − 3σ = 10.
  await pruefeAufgabe(page, bericht, {
    nr: 4, name: "A4 dritte Wurzel", runden: 30, mindestensVerschieden: 10,
    deute: (frage) => {
      const m = minus(frage).match(/fasst ([\d,]+) · 10(\d+) mm³/);
      if (!m) return null;
      const mantisse = Number(m[1].replace(",", "."));
      const zehner = Number(m[2]);
      const V = mantisse * Math.pow(10, zehner);
      const x = Math.round(Math.cbrt(V));
      // c und e aus x = c · 10^e zurückgewinnen.
      const e = x % 10 === 0 ? (x % 100 === 0 ? 2 : 1) : 0;
      const c = x / Math.pow(10, e);
      return {
        richtig: x,
        toleranz: 0.0005,
        falsch: [
          // Die Zehnerpotenz nicht mit gewurzelt.
          [c * Math.pow(10, 3 * e), "Zehnerpotenz muss ebenfalls"],
          // Quadratwurzel statt dritter Wurzel.
          [Math.sqrt(V), "dritte"],
        ],
        pruefe: (f, rueck) => {
          // Der Kern: Die Kantenlänge muss zur dritten Potenz das Volumen ergeben.
          pruefe(Math.abs(x * x * x - V) / V < 1e-9,
            `A4: ${x}³ = ${x * x * x} ist nicht ${V} — „${f}“`);
          pruefe(Number.isInteger(c) && c >= 2 && c <= 9,
            `A4: die Mantisse ${c} liegt nicht zwischen 2 und 9 — „${f}“`);
          pruefe(rueck.includes("V = a³"), `A4: die Musterlösung nennt den Ansatz V = a³ nicht — „${f}“`);
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
