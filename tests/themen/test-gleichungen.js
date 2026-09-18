// Fachliche Prüfung: Kapitel 4, Thema 3 „Gleichungen“.
//
// Geprüft wird das Äquivalenzumformen von beiden Seiten her: Die Lösung wird
// aus dem angezeigten Term selbst berechnet und eingesetzt, und jeder Fehler,
// vor dem die Aufgabe warnt, wird eigens eingetragen — die Zahl übersehen,
// beim Hinüberbringen das Vorzeichen nicht drehen, die x-Terme addieren statt
// subtrahieren, die Klammer nur teilweise ausmultiplizieren.

"use strict";

const { neuerBericht } = require("../lib/pruefen");
const { starteBrowser, neueSeite, oeffne } = require("../lib/seite");
const { pruefeNotation } = require("../lib/notation");
const { pruefeKontrast } = require("../lib/kontrast");
const { pruefeAufgabe } = require("../lib/aufgaben");

const bericht = neuerBericht();
const { pruefe } = bericht;
const SEITE = "/mathematik/grundwissen-5-10/04-gleichungen-zuordnungen-funktionen/03-gleichungen/index.html";

// Die Terme benutzen das echte Minuszeichen und schreiben den Koeffizienten 1
// nicht aus: „x + 3“, „−x − 4“, „5x − 2“.
function liesTerm(s) {
  const t = s.replace(/−/g, "-").replace(/\s+/g, "");
  const m = t.match(/^([+-]?\d*)x([+-]\d+)?$/);
  if (m) {
    const a = m[1] === "" || m[1] === "+" ? 1 : m[1] === "-" ? -1 : Number(m[1]);
    return { a, b: m[2] ? Number(m[2]) : 0 };
  }
  const nur = t.match(/^([+-]?\d+)$/);
  return nur ? { a: 0, b: Number(nur[1]) } : null;
}

async function aufgaben(page) {
  // Aufgabe 1 — ax + b = c. Gemessen mit tests/werkzeug-streuung.js: 195 verschiedene in 200
  // Würfen, zurückgerechnet also rund 3914 Kandidaten. Die Schranke ist das simulierte
  // 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für 0,8 · n gerechnet — 27.
  await pruefeAufgabe(page, bericht, {
    nr: 1, name: "A1 zweischrittig", runden: 30, mindestensVerschieden: 27,
    deute: (frage) => {
      const m = frage.match(/Löse die Gleichung: (.+?) = (−?\d+) Wie groß/);
      if (!m) return null;
      const links = liesTerm(m[1]);
      if (!links || links.a === 0) return null;
      const a = links.a, b = links.b;
      const c = Number(m[2].replace("−", "-"));
      return {
        richtig: (c - b) / a,
        toleranz: 0.0005,
        falsch: [
          // Nach dem ersten Schritt stehen geblieben.
          [c - b, "erste"],
          // Beim Hinüberbringen das Vorzeichen nicht gedreht.
          [(c + b) / a, "Vorzeichen"],
          // Die Zahl b übersehen.
          [c / a, "übersehen"],
        ],
        pruefe: (f, rueck) => {
          const x = (c - b) / a;
          pruefe(Number.isInteger(x), `A1: die Lösung ${x} ist nicht ganzzahlig — „${f}“`);
          pruefe(x !== 0 && b !== 0, `A1: mit x = ${x} und b = ${b} wird der Schritt trivial — „${f}“`);
          // Die Lösungsmenge gehört zur Antwort, nicht nur die Zahl.
          pruefe(rueck.includes(`L = {${x < 0 ? "−" : ""}${Math.abs(x)}}`),
            `A1: die Musterlösung nennt die Lösungsmenge nicht — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 2 — die Probe. Gemessen mit tests/werkzeug-streuung.js: 199 verschiedene in 200
  // Würfen. Die Schranke ist das simulierte 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für
  // 0,8 · n gerechnet — 28.
  let stimmt = 0, stimmtNicht = 0;
  await pruefeAufgabe(page, bericht, {
    nr: 2, name: "A2 Probe", runden: 30, mindestensVerschieden: 28,
    deute: (frage) => {
      const m = frage.match(/Gleichung (\d+)x ([+−]) (\d+) = ([−-]?\d+)/);
      const mk = frage.match(/x = ([−-]?\d+) sei/);
      if (!m || !mk) return null;
      const zahl = (t) => Number(String(t).replace("−", "-"));
      const a = Number(m[1]);
      const b = (m[2] === "+" ? 1 : -1) * Number(m[3]);
      const c = zahl(m[4]);
      const kandidat = zahl(mk[1]);
      const links = a * kandidat + b;
      const passt = links === c;
      if (passt) stimmt++; else stimmtNicht++;
      // Die Gleichung selbst muss eine ganzzahlige Lösung haben, sonst ist die Probe sinnlos.
      pruefe(Number.isInteger((c - b) / a), `A2: (${c} − ${b}) : ${a} ist nicht ganzzahlig — „${frage}“`);
      return {
        felder: [links, c, passt ? 1 : 2],
        toleranz: 0.0005,
        falschFelder: [
          [0, c, "rechte"],
          [0, a + kandidat + b, "mal"],
          [0, a * kandidat, "gehört noch dazu"],
          [1, links, "linken Seite"],
          [2, passt ? 2 : 1, "Vergleiche"],
        ],
      };
    },
  });
  pruefe(stimmt > 0 && stimmtNicht > 0,
    `A2: in 30 Zügen stimmte der Vorschlag ${stimmt}-mal und ${stimmtNicht}-mal nicht — beides muss vorkommen`);

  // Aufgabe 3 — x auf beiden Seiten.
  await pruefeAufgabe(page, bericht, {
    nr: 3, name: "A3 x auf beiden Seiten", runden: 30, mindestensVerschieden: 28,
    deute: (frage) => {
      const m = frage.match(/Löse die Gleichung: (.+?) = (.+?) Wie groß/);
      if (!m) return null;
      const l = liesTerm(m[1]), r = liesTerm(m[2]);
      if (!l || !r || l.a === r.a) return null;
      const { a, b } = l, { a: c, b: d } = r;
      const kk = a - c, mm = d - b;
      return {
        richtig: mm / kk,
        toleranz: 0.0005,
        falsch: [
          // Die x-Terme addiert statt subtrahiert.
          [(d - b) / (a + c), "addiert"],
          // Beim Hinüberbringen der Zahl das Vorzeichen nicht gedreht.
          [(d + b) / (a - c), "dreht sich"],
          // Nicht geteilt.
          [mm, "Division"],
        ],
        pruefe: (f, rueck) => {
          const x = mm / kk;
          pruefe(Number.isInteger(x), `A3: die Lösung ${x} ist nicht ganzzahlig — „${f}“`);
          // Beide Seiten müssen bei der Lösung wirklich denselben Wert haben.
          pruefe(Math.abs((a * x + b) - (c * x + d)) < 1e-9,
            `A3: bei x = ${x} sind die Seiten ${a * x + b} und ${c * x + d} — „${f}“`);
          pruefe(rueck.includes("Probe"), `A3: die Musterlösung macht keine Probe — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 4 — Gleichung mit Nenner, in zwei Bauformen. Gemessen: 199 verschiedene in 200
  // Würfen. Schranke: simuliertes 10⁻⁴-Quantil bei 30 Zügen für 0,8 · n — 28.
  let mitKlammer = 0, ohneKlammer = 0;
  await pruefeAufgabe(page, bericht, {
    nr: 4, name: "A4 Gleichung mit Nenner", runden: 30, mindestensVerschieden: 28,
    deute: (frage) => {
      const zahl = (t) => Number(String(t).replace("−", "-"));
      const kl = frage.match(/\(x ([+−]) (\d+)\) : (\d+) = ([−-]?\d+)/);
      if (kl) {
        const b = (kl[1] === "+" ? 1 : -1) * Number(kl[2]);
        const n = Number(kl[3]), c = zahl(kl[4]);
        const zwischen = c * n, x = zwischen - b;
        mitKlammer++;
        return {
          felder: [zwischen, x],
          toleranz: 0.0005,
          falschFelder: [
            [0, c / n, "multipliziert"],
            [0, c, "erst mit"],
            [1, zwischen + b, "Vorzeichen"],
            [1, zwischen, "Zwischenwert"],
          ],
        };
      }
      const oh = frage.match(/x : (\d+) ([+−]) (\d+) = ([−-]?\d+)/);
      if (!oh) return null;
      const n = Number(oh[1]);
      const b = (oh[2] === "+" ? 1 : -1) * Number(oh[3]);
      const c = zahl(oh[4]);
      const zwischen = c - b, x = zwischen * n;
      ohneKlammer++;
      return {
        felder: [zwischen, x],
        toleranz: 0.0005,
        falschFelder: [
          [0, c + b, "Vorzeichen"],
          [0, c, "ganze rechte Seite"],
          [1, zwischen / n, "noch einmal geteilt"],
          [1, zwischen, "Zwischenwert"],
        ],
      };
    },
  });
  pruefe(mitKlammer > 0 && ohneKlammer > 0,
    `A4: in 30 Zügen kam ${mitKlammer}-mal die Klammerform und ${ohneKlammer}-mal die andere — beide müssen vorkommen`);

  // Aufgabe 5 — mit Klammer: a · (x + b) = c · x + d.
  await pruefeAufgabe(page, bericht, {
    nr: 5, name: "A5 mit Klammer", runden: 30, mindestensVerschieden: 28,
    deute: (frage) => {
      const m = frage.match(/Löse die Gleichung: (−?\d+) · \(x ([+−]) (\d+)\) = (.+?) Wie groß/);
      if (!m) return null;
      const a = Number(m[1].replace("−", "-"));
      const b = (m[2] === "−" ? -1 : 1) * Number(m[3]);
      const r = liesTerm(m[4]);
      if (!r) return null;
      const c = r.a, d = r.b;
      const kk = a - c, mm = d - a * b;
      return {
        richtig: mm / kk,
        toleranz: 0.0005,
        falsch: [
          // Nur x mit a multipliziert, die Zahl in der Klammer vergessen.
          [(d - b) / (a - c), "Summand in der Klammer"],
          // Beim Hinüberbringen das Vorzeichen nicht gedreht.
          [(d + a * b) / (a - c), "dreht sich"],
          // Die x-Terme addiert.
          [(d - a * b) / (a + c), "subtrahiert"],
          // Nicht geteilt.
          [mm, "Division"],
        ],
        pruefe: (f, rueck) => {
          const x = mm / kk;
          pruefe(Number.isInteger(x), `A5: die Lösung ${x} ist nicht ganzzahlig — „${f}“`);
          pruefe(Math.abs(a * (x + b) - (c * x + d)) < 1e-9,
            `A5: bei x = ${x} sind die Seiten ${a * (x + b)} und ${c * x + d} — „${f}“`);
          // Das Distributivgesetz muss in der Musterlösung ausgeschrieben stehen.
          pruefe(rueck.includes("Klammer ausmultiplizieren"),
            `A5: die Musterlösung zeigt das Ausmultiplizieren nicht — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 6 — genau eine Lösung, keine, oder alle Zahlen. Gemessen: 186 verschiedene in 200
  // Würfen. Die drei Fälle haben verschieden viele Fassungen; die nachgebildete Mischung ergibt
  // bei 30 Zügen E = 29,4 und ein 10⁻⁴-Quantil von 25 — Schranke 24.
  const faelle = new Set();
  await pruefeAufgabe(page, bericht, {
    nr: 6, name: "A6 eine, keine oder alle", runden: 30, mindestensVerschieden: 24,
    deute: (frage) => {
      const gleichung = frage.split(" Sortiere")[0].replace("Löse die Gleichung: ", "").trim();
      const [linksText, rechtsText] = gleichung.split(" = ");
      const term = (t) => {
        // „7x − 1“, „x“, „−3“ — Koeffizient und Zahl getrennt lesen.
        const mx = t.match(/(^|[^\d])(\d*)x/);
        const koeff = mx ? (mx[2] === "" ? 1 : Number(mx[2])) : 0;
        const mz = t.match(/([+−]) (\d+)\s*$/);
        const zahl = mz ? (mz[1] === "+" ? 1 : -1) * Number(mz[2]) : (mx ? 0 : Number(t.replace("−", "-")));
        return [koeff, zahl];
      };
      const [a, b] = term(linksText);
      let c, d;
      const kl = rechtsText.match(/^(\d+) · \((\d*)x ([+−]) (\d+)\)$/);
      if (kl) {
        const k = Number(kl[1]);
        const m = kl[2] === "" ? 1 : Number(kl[2]);
        const t = (kl[3] === "+" ? 1 : -1) * Number(kl[4]);
        c = k * m; d = k * t;
      } else {
        [c, d] = term(rechtsText);
      }
      if (!a) return null;
      const kk = a - c, mm = d - b;
      const kennziffer = kk !== 0 ? 1 : mm === 0 ? 3 : 2;
      faelle.add(String(kennziffer));
      // Im Normalfall muss die Division am Ende glatt aufgehen.
      pruefe(kk === 0 || Number.isInteger(mm / kk),
        `A6: ${mm} : ${kk} ist nicht ganzzahlig — „${frage}“`);
      return {
        felder: [kk, mm, kennziffer],
        toleranz: 0.0005,
        falschFelder: [
          [0, a + c, "subtrahiert"],
          [0, a, "nur links"],
          [1, d + b, "Vorzeichen"],
          [1, d, "schon rechts"],
          [2, kennziffer === 1 ? 2 : 1, kennziffer === 1 ? "nicht 0" : kk === 0 && mm === 0 ? "jedes" : "kein"],
        ],
      };
    },
  });
  pruefe(faelle.size === 3, `A6: nur ${faelle.size} der drei Fälle kamen in 30 Zügen vor`);

  // Aufgabe 7 — Sachaufgabe: zwei Tarife, drei Kontexte. Gemessen mit
  // tests/werkzeug-streuung.js: 189 verschiedene in 200 Würfen, zurückgerechnet also rund 1742
  // Kandidaten. Die Schranke ist das simulierte 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für
  // 0,8 · n gerechnet — 26.
  await pruefeAufgabe(page, bericht, {
    nr: 7, name: "A7 zwei Tarife", runden: 30, mindestensVerschieden: 26,
    deute: (frage) => {
      // Alle drei Kontexte nennen die vier Zahlen in derselben Reihenfolge:
      // Grundgebühr und Preis des ersten Angebots, dann des zweiten.
      const z = (frage.match(/\d+/g) || []).map(Number);
      if (z.length < 4) return null;
      const [g1, p1, g2, p2] = z;
      if (p2 <= p1 || g1 <= g2) return null;
      const x = (g1 - g2) / (p2 - p1);
      return {
        richtig: x,
        toleranz: 0.0005,
        falsch: [
          // Die beiden Preise je Einheit addiert statt ihre Differenz zu nehmen.
          [(g1 - g2) / (p1 + p2), "x-Terme"],
          // Die festen Beträge addiert.
          [(g1 + g2) / (p2 - p1), "festen Beträge"],
          // Nach dem Sortieren nicht geteilt.
          [g1 - g2, "Division"],
        ],
        pruefe: (f, rueck) => {
          pruefe(Number.isInteger(x), `A7: die Lösung ${x} ist nicht ganzzahlig — „${f}“`);
          pruefe(x > 0, `A7: die Lösung ${x} ist nicht positiv, die Frage wäre sachlich sinnlos — „${f}“`);
          // Beim Schnittpunkt müssen beide Angebote wirklich gleich viel kosten.
          pruefe(Math.abs(g1 + p1 * x - (g2 + p2 * x)) < 1e-9,
            `A7: bei ${x} kosten die Angebote ${g1 + p1 * x} und ${g2 + p2 * x} — „${f}“`);
          pruefe(rueck.includes(`${g1 + p1 * x}`),
            `A7: die Musterlösung nennt den gemeinsamen Wert ${g1 + p1 * x} nicht — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 8 — Altersaufgabe. Gemessen: 46 verschiedene in 200 Würfen. Schranke: simuliertes
  // 10⁻⁴-Quantil bei 30 Zügen für 0,8 · n — 14.
  await pruefeAufgabe(page, bericht, {
    nr: 8, name: "A8 Vater und Sohn", runden: 30, mindestensVerschieden: 14,
    deute: (frage) => {
      const m = frage.match(/heute (\d+)-mal.*?In (\d+) Jahren.*?(\d+)-mal/);
      if (!m) return null;
      const [a, n, b] = m.slice(1).map(Number);
      // Unabhängig aus dem Ansatz a·S + n = b·(S + n) hergeleitet.
      const S = (n * (b - 1)) / (a - b);
      const V = a * S;
      pruefe(a > b, `A8: das Verhältnis wächst von ${a} auf ${b} — es muss kleiner werden — „${frage}“`);
      pruefe(Number.isInteger(S) && S > 0, `A8: das Alter des Sohnes wäre ${S} — „${frage}“`);
      pruefe(Math.abs(V + n - b * (S + n)) < 1e-9,
        `A8: in ${n} Jahren wäre der Vater ${V + n}, das ${b}-fache von ${S + n} ist aber ${b * (S + n)} — „${frage}“`);
      pruefe(V - S >= 18, `A8: der Altersabstand beträgt nur ${V - S} Jahre — „${frage}“`);
      return {
        felder: [S, V, V + n],
        toleranz: 0.0005,
        falschFelder: [
          [0, V, "Vaters"],
          [0, n, "Jahre, die vergehen"],
          [0, S + n, "erst in"],
          [1, S, "Sohnes"],
          [1, S + a, "mal"],
          [1, b * S, "gilt erst"],
          [2, V, "kommen noch dazu"],
          [2, V + b * n, "gleich viele Jahre"],
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
    if (!dunkel) await aufgaben(page);
    else await pruefeKontrast(page, bericht, "dunkel");
    await pruefeNotation(page, bericht, wo);
    for (const s of page.stoerungen) pruefe(false, `${wo}: ${s}`);
    await page.close();
  }
  await browser.close();
  bericht.abschluss();
})();
