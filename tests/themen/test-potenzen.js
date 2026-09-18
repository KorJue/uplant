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

// Über alle Runden gesammelt: Jede der drei Aufgaben lebt von ihren Fällen —
// gerade und ungerade Exponenten, große und kleine Zahlen, mal und geteilt.
const artenA2 = new Set();
const artenA4 = new Set();
const artenA6 = new Set();
const artenA8 = new Set();

async function aufgaben(page) {
  // Aufgabe 1 — Potenzwert. Gemessen mit tests/werkzeug-streuung.js: 22 verschiedene in 200
  // Würfen, zurückgerechnet also rund 22 Kandidaten. Die Schranke ist das simulierte
  // 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für 0,8 · n gerechnet — 10.
  await pruefeAufgabe(page, bericht, {
    nr: 1, name: "A1 Potenzwert", runden: 30, mindestensVerschieden: 10,
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

  // Aufgabe 2 — wissenschaftliche Schreibweise. Gemessen mit tests/werkzeug-streuung.js: 180
  // verschiedene in 200 Würfen, zurückgerechnet rund 928 Kandidaten; die Aufgabe zieht aus einer
  // einzigen Liste, die Rückrechnung trägt also. Schranke bei 30 Zügen: 25.
  await pruefeAufgabe(page, bericht, {
    nr: 2, name: "A2 wissenschaftliche Schreibweise", runden: 30, mindestensVerschieden: 25,
    deute: (frage) => {
      const m = frage.match(/Schreibe ([\d.,]+) in/);
      if (!m) return null;
      const roh = m[1];
      const wert = Number(roh.replace(/\./g, "").replace(",", "."));
      if (!isFinite(wert) || wert <= 0) return null;
      // Unabhängig nachgerechnet: z und n aus dem Zahlenwert selbst.
      const n = Math.floor(Math.round(Math.log10(wert) * 1e9) / 1e9);
      const z = Math.round((wert / Math.pow(10, n)) * 1e6) / 1e6;
      artenA2.add(n > 0 ? "groß" : "klein");
      return {
        felder: [z, n],
        toleranz: 0.0005,
        falschFelder: [
          // Das Komma gar nicht gesetzt.
          [0, z * 10, "nicht kleiner als 10"],
          [0, z / 10, "kleiner als 1"],
          [0, n, "ist der Exponent"],
          // Das Vorzeichen des Exponenten verdreht.
          [1, -n, n > 0 ? "große" : "kleine"],
          [1, n + 1, "eine Stelle daneben"],
          [1, n - 1, "eine Stelle daneben"],
          [1, z, "ist die Vorzahl"],
        ],
        pruefe: (f, rueck) => {
          pruefe(z >= 1 && z < 10, `A2: z = ${z} liegt nicht zwischen 1 und 10 — „${f}“`);
          pruefe(Number.isInteger(n) && n !== 0, `A2: n = ${n} — „${f}“`);
          // Die Rückrechnung muss die Ausgangszahl wieder ergeben.
          pruefe(Math.abs(z * Math.pow(10, n) - wert) < Math.abs(wert) * 1e-9,
            `A2: ${z} · 10^${n} ist nicht ${wert} — „${f}“`);
          pruefe(rueck.includes("Größenordnung"), `A2: die Musterlösung deutet den Exponenten nicht — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 3 — die drei Potenzgesetze hintereinander. Gemessen mit tests/werkzeug-streuung.js:
  // 120 verschiedene in 200 Würfen, zurückgerechnet also rund 177 Kandidaten. Die Schranke ist
  // das simulierte 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für 0,8 · n gerechnet — 21.
  await pruefeAufgabe(page, bericht, {
    nr: 3, name: "A3 Potenzgesetze", runden: 30, mindestensVerschieden: 21,
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
          pruefe(e >= 0 && e <= 9, `A3: der Exponent ${e} liegt außerhalb des vorgesehenen Bereichs — „${f}“`);
          // Alle drei Gesetze müssen in der Musterlösung stehen.
          pruefe(rueck.includes("Gesetz (1)") && rueck.includes("Gesetz (2)") && rueck.includes("Gesetz (3)"),
            `A3: die Musterlösung benennt nicht alle drei Gesetze — „${f}“`);
          // a⁰ = 1 darf nicht verschwiegen werden.
          if (e === 0) {
            pruefe(rueck.includes("a0 = 1") || rueck.includes("gleich 1"),
              `A3: bei Exponent 0 fehlt der Hinweis auf a⁰ = 1 — „${f}“`);
          }
        },
      };
    },
  });

  // Aufgabe 4 — Potenzfunktionen. Gemessen mit tests/werkzeug-streuung.js: 39 verschiedene in
  // 200 Würfen — die Liste ist mit 39 Einträgen vollständig ausgeschöpft. Schranke bei 30
  // Zügen: 13.
  await pruefeAufgabe(page, bericht, {
    nr: 4, name: "A4 Potenzfunktionen", runden: 30, mindestensVerschieden: 13,
    deute: (frage) => {
      const m = minus(frage).match(/f\(x\) = x(\d).*?Stelle x = (\d+)/);
      if (!m) return null;
      const n = Number(m[1]), x0 = Number(m[2]);
      const w = potenz(x0, n);
      const gerade = n % 2 === 0;
      const zweiter = gerade ? w : -w;
      artenA4.add(gerade ? "gerade" : "ungerade");
      return {
        felder: [w, zweiter, gerade ? 1 : 2],
        toleranz: 0.0005,
        falschFelder: [
          // Vielfaches statt Potenz.
          [0, x0 * n, "als Faktor"],
          [0, n * x0 * x0, "Faktoren reichen nicht"],
          [0, x0, "ist die Stelle"],
          // Vorzeichen der Gegenstelle.
          [1, gerade ? -w : w, gerade ? "heben sich paarweise auf" : "bleibt übrig"],
          [1, -x0 * n, "Vielfache statt der Potenz"],
          [2, gerade ? 2 : 1, gerade ? "achsensymmetrisch zur y-Achse" : "punktsymmetrisch zum Ursprung"],
        ],
        pruefe: (f, rueck) => {
          pruefe(n >= 2 && n <= 6, `A4: n = ${n} — „${f}“`);
          // (−x)ⁿ muss wirklich (−1)ⁿ · xⁿ sein — unabhängig nachgerechnet.
          pruefe(potenz(-x0, n) === zweiter, `A4: (−${x0})^${n} ist ${potenz(-x0, n)}, nicht ${zweiter} — „${f}“`);
          pruefe(rueck.includes(gerade ? "achsensymmetrisch zur y-Achse" : "punktsymmetrisch zum Ursprung"),
            `A4: die Musterlösung nennt die Symmetrie nicht — „${f}“`);
          // Der Graph geht bei geradem n durch (−1|1), bei ungeradem durch (−1|−1).
          pruefe(rueck.includes(gerade ? "(−1 | 1)" : "(−1 | −1)"),
            `A4: die Musterlösung nennt den Punkt bei −1 falsch — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 5 — negativer Exponent als Kehrwert. Gemessen mit tests/werkzeug-streuung.js: 24
  // verschiedene in 200 Würfen, zurückgerechnet also rund 24 Kandidaten. Die Schranke ist das
  // simulierte 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für 0,8 · n gerechnet — 10.
  await pruefeAufgabe(page, bericht, {
    nr: 5, name: "A5 negativer Exponent", runden: 30, mindestensVerschieden: 10,
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
            `A5: a^(−${k + j}) · a^${j} ist nicht 1 : ${nenner} — „${f}“`);
          pruefe(j !== k, `A5: mit j = k = ${j} fielen zwei Fehlerwerte zusammen — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 6 — n-te Wurzel und Gleichung. Gemessen mit tests/werkzeug-streuung.js: 28
  // verschiedene in 200 Würfen — die Liste ist mit 28 Einträgen vollständig ausgeschöpft.
  // Schranke bei 30 Zügen: 11.
  await pruefeAufgabe(page, bericht, {
    nr: 6, name: "A6 n-te Wurzel", runden: 30, mindestensVerschieden: 11,
    deute: (frage) => {
      const m = frage.match(/Gleichung x(\d) = ([\d.]+)/);
      if (!m) return null;
      const n = Number(m[1]);
      const a = Number(m[2].replace(/\./g, ""));
      const b = Math.round(Math.pow(a, 1 / n));
      if (potenz(b, n) !== a) return null;
      const gerade = n % 2 === 0;
      artenA6.add(gerade ? "gerade" : "ungerade");
      return {
        felder: [b, gerade ? 2 : 1, gerade ? -b : b],
        toleranz: 0.0005,
        falschFelder: [
          // Die Wurzel ist als die nicht negative Zahl festgelegt.
          [0, -b, "nicht negative"],
          [0, a, "Radikand selbst"],
          [0, a / n, "nicht durch den Wurzelexponenten"],
          [1, gerade ? 1 : 2, gerade ? "ist gerade" : "ist ungerade"],
          [2, gerade ? b : -b, gerade ? "größere" : "keine Lösung"],
          [2, a, "rechte Seite der Gleichung"],
        ],
        pruefe: (f, rueck) => {
          pruefe(n >= 3 && n <= 5, `A6: n = ${n} — „${f}“`);
          pruefe(potenz(b, n) === a, `A6: ${b}^${n} ist nicht ${a} — „${f}“`);
          // Bei geradem n erfüllt auch −b die Gleichung, bei ungeradem nicht.
          pruefe((potenz(-b, n) === a) === gerade,
            `A6: (−${b})^${n} = ${potenz(-b, n)} passt nicht zum Exponenten ${n} — „${f}“`);
          pruefe(rueck.includes(gerade ? "2 Lösungen" : "1 Lösung"),
            `A6: die Musterlösung nennt die Anzahl nicht — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 7 — dritte Wurzel aus einer Zehnerpotenz. Gemessen mit tests/werkzeug-streuung.js:
  // 16 verschiedene in 200 Würfen, zurückgerechnet also rund 16 Kandidaten. Die Schranke ist
  // das simulierte 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für 0,8 · n gerechnet — 8.
  await pruefeAufgabe(page, bericht, {
    nr: 7, name: "A7 dritte Wurzel", runden: 30, mindestensVerschieden: 8,
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
            `A7: ${x}³ = ${x * x * x} ist nicht ${V} — „${f}“`);
          pruefe(Number.isInteger(c) && c >= 2 && c <= 9,
            `A7: die Mantisse ${c} liegt nicht zwischen 2 und 9 — „${f}“`);
          pruefe(rueck.includes("V = a³"), `A7: die Musterlösung nennt den Ansatz V = a³ nicht — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 8 — rechnen mit Zehnerpotenzen. Vorzahlen und Exponenten werden getrennt gezogen
  // (1702 · 26 bzw. 111 · 22 Paare, dazu je drei Zusammenhänge); gemessen mit
  // tests/werkzeug-streuung.js: 199 verschiedene in 200 Würfen. Schranke bei 30 Zügen: 27.
  await pruefeAufgabe(page, bericht, {
    nr: 8, name: "A8 Zehnerpotenzen", runden: 30, mindestensVerschieden: 27,
    deute: (frage) => {
      const t = minus(frage);
      const zahlen = [...t.matchAll(/([\d,]+) · 10(-?\d+)/g)];
      if (zahlen.length < 2) return null;
      const z1 = Number(zahlen[0][1].replace(",", ".")), n1 = Number(zahlen[0][2]);
      const z2 = Number(zahlen[1][1].replace(",", ".")), n2 = Number(zahlen[1][2]);
      // Ob multipliziert oder geteilt wird, steht im Text — nicht in den Zahlen.
      const mal = /mit je |jedes wiegt|über jeden/.test(t);
      const geteilt = /verteilt|geteilt/.test(t);
      if (mal === geteilt) return null;
      artenA8.add(mal ? "mal" : "geteilt");
      const roh = Math.round((mal ? z1 * z2 : z1 / z2) * 1000) / 1000;
      const zwischen = mal ? n1 + n2 : n1 - n2;
      const z = Math.round((mal ? roh / 10 : roh * 10) * 10000) / 10000;
      const n = mal ? zwischen + 1 : zwischen - 1;
      return {
        felder: [roh, z, n],
        toleranz: 0.0005,
        falschFelder: [
          [0, z, "fertige Vorzahl"],
          [0, z1 + z2, "nicht addiert"],
          [0, z1, "eine der beiden Vorzahlen"],
          [1, roh, mal ? "nicht kleiner als 10" : "kleiner als 1"],
          [1, z1, "gegebenen Vorzahlen"],
          // Der Normierungsschritt vergessen — genau der Fehler der Achtung-Box.
          [2, zwischen, "vor dem Normieren"],
          [2, n1, "einer der gegebenen Exponenten"],
          [2, n2, "einer der gegebenen Exponenten"],
        ],
        pruefe: (f, rueck) => {
          pruefe(z >= 1 && z < 10, `A8: z = ${z} liegt nicht zwischen 1 und 10 — „${f}“`);
          // Das Zwischenergebnis MUSS die Bedingung verletzen, sonst zeigt die Aufgabe nichts.
          pruefe(mal ? roh >= 10 : roh < 1,
            `A8: das Zwischenergebnis ${roh} braucht gar keine Nachnormierung — „${f}“`);
          // Beide Schreibweisen müssen dieselbe Zahl sein.
          pruefe(Math.abs(roh * Math.pow(10, zwischen) - z * Math.pow(10, n)) < Math.abs(z * Math.pow(10, n)) * 1e-9,
            `A8: ${roh}·10^${zwischen} ist nicht ${z}·10^${n} — „${f}“`);
          pruefe(rueck.includes("Nachnormieren"), `A8: die Musterlösung normiert nicht nach — „${f}“`);
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
      for (const [name, menge, faelle] of [
        ["A2", artenA2, ["groß", "klein"]],
        ["A4", artenA4, ["gerade", "ungerade"]],
        ["A6", artenA6, ["gerade", "ungerade"]],
        ["A8", artenA8, ["mal", "geteilt"]],
      ]) {
        for (const f of faelle) pruefe(menge.has(f), `${name}: in 30 Runden kam der Fall „${f}“ nicht vor`);
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
