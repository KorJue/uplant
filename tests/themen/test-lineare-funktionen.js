// Fachliche Prüfung: Kapitel 4, Thema 5 „Lineare Funktionen“.
//
// Die Steigung ist Δy : Δx — Höhe je Schritt nach rechts, nicht umgekehrt und
// nicht gemischt. Genau diese drei Verwechslungen werden als Antwort
// eingetragen, dazu die Punkt-vor-Strich-Falle beim Einsetzen und der
// Schnittpunkt zweier Geraden, bei dem beide Funktionen denselben Wert liefern
// müssen.

"use strict";

const { neuerBericht } = require("../lib/pruefen");
const { starteBrowser, neueSeite, oeffne } = require("../lib/seite");
const { pruefeNotation } = require("../lib/notation");
const { pruefeKontrast } = require("../lib/kontrast");
const { pruefeAufgabe } = require("../lib/aufgaben");

const bericht = neuerBericht();
const { pruefe } = bericht;
const SEITE = "/mathematik/grundwissen-5-10/04-gleichungen-zuordnungen-funktionen/05-lineare-funktionen/index.html";

const minus = (s) => s.replace(/−/g, "-");

async function aufgaben(page) {
  // Aufgabe 1 — Funktionswert einsetzen. Gemessen mit tests/werkzeug-streuung.js: 188
  // verschiedene in 200 Würfen, zurückgerechnet also rund 1592 Kandidaten. Die Schranke ist das
  // simulierte 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für 0,8 · n gerechnet — 26.
  await pruefeAufgabe(page, bericht, {
    nr: 1, name: "A1 Funktionswert", runden: 30, mindestensVerschieden: 26,
    deute: (frage) => {
      const m = minus(frage).match(/f\(x\) = (-?\d+)x ([+-]) (\d+) Berechne f\((-?\d+)\)/);
      if (!m) return null;
      const st = Number(m[1]);
      const b = (m[2] === "-" ? -1 : 1) * Number(m[3]);
      const x = Number(m[4]);
      return {
        richtig: st * x + b,
        toleranz: 0.0005,
        falsch: [
          // Das Vorzeichen von b verdreht.
          [st * x - b, "Vorzeichen von"],
          // Erst addiert, dann multipliziert.
          [st * (x + b), "Punkt vor Strich"],
          // f(1) statt f(x) gerechnet.
          [st + b, "wäre f(1)"],
        ],
        pruefe: (f, rueck) => {
          pruefe(st !== 0 && b !== 0, `A1: mit m = ${st} und b = ${b} ist nichts zu rechnen — „${f}“`);
          // Die Musterlösung setzt in Klammern ein — sonst entstünde bei
          // negativem x eine unlesbare Zeile.
          pruefe(rueck.includes(`(${x < 0 ? "−" : ""}${Math.abs(x)})`),
            `A1: die Musterlösung setzt nicht in Klammern ein — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 2 — ablesen und Punktprobe. Gemessen mit tests/werkzeug-streuung.js: 198 verschiedene
  // in 200 Würfen. Die Schranke ist das simulierte 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber
  // für 0,8 · n gerechnet — 27.
  let drauf = 0, daneben = 0;
  await pruefeAufgabe(page, bericht, {
    nr: 2, name: "A2 ablesen und Punktprobe", runden: 30, mindestensVerschieden: 27,
    deute: (frage) => {
      // geradeText schreibt „x“ statt „1x“ und „−x“ statt „−1x“.
      const mg = frage.match(/g\(x\) = (−?\d*)x ([+−]) (\d+)/);
      const mp = frage.match(/P\(([−-]?\d+) \| ([−-]?\d+)\)/);
      if (!mg || !mp) return null;
      const zahl = (t) => Number(String(t).replace("−", "-"));
      const m = mg[1] === "" ? 1 : mg[1] === "−" ? -1 : zahl(mg[1]);
      const b = (mg[2] === "+" ? 1 : -1) * Number(mg[3]);
      const p = zahl(mp[1]), q = zahl(mp[2]);
      const liegt = m * p + b === q;
      if (liegt) drauf++; else daneben++;
      return {
        felder: [m, b, liegt ? 1 : 2],
        toleranz: 0.0002,
        falschFelder: [
          [0, b, "y-Achsenabschnitt"],
          [0, -m, "Vorzeichen"],
          [1, m, "Steigung"],
          [1, -b, "Vorzeichen"],
          [2, liegt ? 2 : 1, "Setze die x-Koordinate ein"],
        ],
      };
    },
  });
  pruefe(drauf > 0 && daneben > 0,
    `A2: in 30 Zügen lag P ${drauf}-mal auf der Geraden und ${daneben}-mal nicht — beides muss vorkommen`);

  // Aufgabe 3 — Steigung aus zwei Punkten. Gemessen mit tests/werkzeug-streuung.js: 186
  // verschiedene in 200 Würfen, zurückgerechnet also rund 1355 Kandidaten. Die Schranke ist das
  // simulierte 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für 0,8 · n gerechnet — 26.
  await pruefeAufgabe(page, bericht, {
    nr: 3, name: "A3 Steigung", runden: 30, mindestensVerschieden: 26,
    deute: (frage) => {
      const m = minus(frage).match(/P\((-?\d+) \| (-?\d+)\) und Q\((-?\d+) \| (-?\d+)\)/);
      if (!m) return null;
      const [x1, y1, x2, y2] = m.slice(1).map(Number);
      const dx = x2 - x1, dy = y2 - y1;
      return {
        richtig: dy / dx,
        toleranz: 0.0005,
        falsch: [
          // Den Bruch auf den Kopf gestellt.
          [dx / dy, "auf dem Kopf"],
          // Nur Δy bzw. nur Δx genommen.
          [dy, "Höhenunterschied"],
          [dx, "waagerechte Abstand"],
          // Die Reihenfolge nur in einer der beiden Differenzen gedreht.
          [(y1 - y2) / (x2 - x1), "in beiden"],
          [dy + dx, null],
        ],
        pruefe: (f) => {
          pruefe(dx > 0, `A3: Δx = ${dx} ist nicht positiv — „${f}“`);
          pruefe(Number.isInteger(dy / dx), `A3: die Steigung ${dy / dx} ist nicht ganzzahlig — „${f}“`);
          // Beide Punkte müssen wirklich auf derselben Geraden liegen — das
          // ist bei zwei Punkten trivial, aber Δx darf nicht 0 sein.
          pruefe(x1 !== x2, `A3: P und Q haben dieselbe x-Koordinate — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 4 — die Wertetabelle. Gemessen: 197 verschiedene in 200 Würfen. Schranke:
  // simuliertes 10⁻⁴-Quantil bei 30 Zügen für 0,8 · n — 27.
  let linear = 0, krumm = 0;
  await pruefeAufgabe(page, bericht, {
    nr: 4, name: "A4 Wertetabelle", runden: 30, mindestensVerschieden: 27,
    deute: (frage) => {
      const m = frage.match(/\? x ([^y]*) y (.*?) Vergleiche/);
      if (!m) return null;
      const zahlen = (t) => (t.match(/[−-]?\d+/g) || []).map((z) => Number(z.replace("−", "-")));
      const xs = zahlen(m[1]), ys = zahlen(m[2]);
      if (xs.length !== 4 || ys.length !== 4) return null;
      const m1 = (ys[1] - ys[0]) / (xs[1] - xs[0]);
      const m2 = (ys[3] - ys[2]) / (xs[3] - xs[2]);
      // Unabhängig geprüft: linear heißt, dass ALLE drei Steigungen übereinstimmen.
      const alle = [0, 1, 2].map((i) => (ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
      const istLinear = alle.every((v) => Math.abs(v - alle[0]) < 1e-9);
      pruefe(istLinear === (Math.abs(m1 - m2) < 1e-9),
        `A4: die beiden abgefragten Steigungen entscheiden die Frage nicht — „${frage}“`);
      pruefe(new Set(xs.map((x, i) => (i ? x - xs[i - 1] : null)).slice(1)).size === 1,
        `A4: die x-Schritte sind nicht gleich groß — „${frage}“`);
      if (istLinear) linear++; else krumm++;
      return {
        felder: [m1, m2, istLinear ? 1 : 2],
        toleranz: 0.0002,
        falschFelder: [
          [0, xs[1] - xs[0] !== 1 ? ys[1] - ys[0] : null, "geteilt"],
          [0, (xs[1] - xs[0]) / (ys[1] - ys[0]), "verkehrt herum"],
          [1, !istLinear ? m1 : null, "nicht gleich"],
          [2, istLinear ? 2 : 1, "Vergleiche die beiden Steigungen"],
        ],
      };
    },
  });
  pruefe(linear > 0 && krumm > 0,
    `A4: in 30 Zügen war die Tabelle ${linear}-mal linear und ${krumm}-mal nicht — beides muss vorkommen`);

  // Aufgabe 5 — von zwei Punkten zur Funktionsgleichung und zurück. Gemessen mit
  // tests/werkzeug-streuung.js: 199 verschiedene in 200 Würfen, zurückgerechnet also rund 19834
  // Kandidaten. Die Schranke ist das simulierte 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für
  // 0,8 · n gerechnet — 27.
  await pruefeAufgabe(page, bericht, {
    nr: 5, name: "A5 Gleichung aufstellen", runden: 30, mindestensVerschieden: 27,
    deute: (frage) => {
      const m = minus(frage).match(/P\((-?\d+) \| (-?\d+)\) und Q\((-?\d+) \| (-?\d+)\)\. Berechne f\((-?\d+)\)/);
      if (!m) return null;
      const [x1, y1, x2, y2, x3] = m.slice(1).map(Number);
      const st = (y2 - y1) / (x2 - x1);
      const b = y1 - st * x1;
      return {
        richtig: st * x3 + b,
        toleranz: 0.0005,
        falsch: [
          // Den y-Achsenabschnitt vergessen.
          [st * x3, "nur mit der Steigung"],
          // Bei b bzw. m stehen geblieben.
          [b, "y-Achsenabschnitt"],
          [st, "ist die Steigung"],
          // Das Vorzeichen der Steigung verdreht.
          [-st * x3 + b, "Vorzeichen der Steigung"],
        ],
        pruefe: (f) => {
          pruefe(Number.isInteger(st) && Number.isInteger(b),
            `A5: m = ${st} und b = ${b} sind nicht beide ganzzahlig — „${f}“`);
          // Beide gegebenen Punkte müssen die aufgestellte Gleichung erfüllen.
          pruefe(Math.abs(st * x1 + b - y1) < 1e-9 && Math.abs(st * x2 + b - y2) < 1e-9,
            `A5: die Gerade y = ${st}x + ${b} geht nicht durch beide Punkte — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 6 — die Parallele durch einen Punkt. Gemessen: 200 verschiedene in 200 Würfen.
  // Schranke: simuliertes 10⁻⁴-Quantil bei 30 Zügen für ein vorsichtig angesetztes n — 27.
  await pruefeAufgabe(page, bericht, {
    nr: 6, name: "A6 Parallele durch einen Punkt", runden: 30, mindestensVerschieden: 27,
    deute: (frage) => {
      const mg = frage.match(/g\(x\) = (−?\d*)x ([+−]) (\d+)/);
      const mp = frage.match(/P\(([−-]?\d+) \| ([−-]?\d+)\)/);
      const mc = frage.match(/h\(x\) = ([−-]?\d+)\?/);
      if (!mg || !mp || !mc) return null;
      const zahl = (t) => Number(String(t).replace("−", "-"));
      const m = mg[1] === "" ? 1 : mg[1] === "−" ? -1 : zahl(mg[1]);
      const b = (mg[2] === "+" ? 1 : -1) * Number(mg[3]);
      const p = zahl(mp[1]), q = zahl(mp[2]), c = zahl(mc[1]);
      const bNeu = q - m * p;
      const x0 = (c - bNeu) / m;
      pruefe(bNeu !== b, `A6: die „Parallele“ wäre die Gerade selbst — „${frage}“`);
      pruefe(Number.isInteger(x0), `A6: (${c} − ${bNeu}) : ${m} = ${x0} ist nicht ganzzahlig — „${frage}“`);
      return {
        felder: [m, bNeu, x0],
        toleranz: 0.0002,
        falschFelder: [
          [0, -m, "senkrechten"],
          [1, b, "von <strong>g</strong>".replace(/<[^>]*>/g, "")],
          [1, q + m * p, "Umstellen"],
          [1, q, "y-Koordinate von P"],
          [2, m !== 1 ? (c - bNeu) * m : null, "Teilen"],
          [2, (c + bNeu) / m, "Hinüberbringen"],
          [2, c, "Funktionswert"],
        ],
      };
    },
  });

  // Aufgabe 7 — Schnittpunkt zweier Geraden. Gemessen mit tests/werkzeug-streuung.js: 190
  // verschiedene in 200 Würfen, zurückgerechnet also rund 1923 Kandidaten. Die Schranke ist das
  // simulierte 10⁻⁴-Quantil bei 30 Zügen, vorsichtshalber für 0,8 · n gerechnet — 26.
  await pruefeAufgabe(page, bericht, {
    nr: 7, name: "A7 Schnittpunkt", runden: 30, mindestensVerschieden: 26,
    deute: (frage) => {
      // Die Seite schreibt „x“ statt „1x“ und „−x“ statt „−1x“ — beides muss gelesen werden.
      // Und bei b = 0 lässt sie das konstante Glied ganz weg („h(x) = −5x“), denn „−5x + 0“
      // schreibt niemand. Das kommt selten vor; steht es nicht im Muster, fällt die Prüfung
      // nur hin und wieder aus, und zwar an einer Seite, an der nichts kaputt ist.
      const m = minus(frage).match(/g\(x\) = (-?\d*)x(?: ([+-]) (\d+))? und h\(x\) = (-?\d*)x(?: ([+-]) (\d+))?/);
      if (!m) return null;
      const koeff = (t) => (t === "" ? 1 : t === "-" ? -1 : Number(t));
      const glied = (vz, zahl) => (vz ? (vz === "-" ? -1 : 1) * Number(zahl) : 0);
      const m1 = koeff(m[1]);
      const b1 = glied(m[2], m[3]);
      const m2 = koeff(m[4]);
      const b2 = glied(m[5], m[6]);
      const xs = (b2 - b1) / (m1 - m2);
      const ys = m1 * xs + b1;
      return {
        richtig: ys,
        toleranz: 0.0005,
        falsch: [
          // Die x-Koordinate statt der y-Koordinate angegeben.
          [xs, "-Koordinate des Schnittpunkts"],
          // Beim Sortieren die Steigungen addiert.
          [(b2 - b1) / (m1 + m2), "subtrahiert"],
          // Die Achsenabschnitte addiert.
          [(b1 + b2) / (m1 - m2), "Auch die Zahlen"],
          [b1, "y-Achsenabschnitt"],
        ],
        pruefe: (f, rueck) => {
          pruefe(m1 !== m2, `A7: parallele Geraden mit m = ${m1} schneiden sich nicht — „${f}“`);
          pruefe(Number.isInteger(xs), `A7: die x-Koordinate ${xs} ist nicht ganzzahlig — „${f}“`);
          // Der Kern: Im Schnittpunkt liefern beide Funktionen denselben Wert.
          pruefe(Math.abs(m1 * xs + b1 - (m2 * xs + b2)) < 1e-9,
            `A7: g(${xs}) = ${m1 * xs + b1}, aber h(${xs}) = ${m2 * xs + b2} — „${f}“`);
          pruefe(rueck.includes(`S(${xs < 0 ? "−" : ""}${Math.abs(xs)} | ${ys < 0 ? "−" : ""}${Math.abs(ys)})`),
            `A7: die Musterlösung nennt den Schnittpunkt nicht als Paar — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 8 — eine Gerade mit Bedeutung: Steigung, Anfangswert, Nullstelle. Gemessen: 199
  // verschiedene in 200 Würfen. Schranke: simuliertes 10⁻⁴-Quantil bei 30 Zügen für 0,8 · n — 27.
  await pruefeAufgabe(page, bericht, {
    nr: 8, name: "A8 Gerade mit Bedeutung", runden: 30, mindestensVerschieden: 27,
    deute: (frage) => {
      const m = frage.match(/Nach (\d+) \S+ beträgt \S+ ([\d.]+) \S+, nach (\d+) \S+ nur noch ([\d.]+)/);
      if (!m) return null;
      const zahl = (t) => Number(t.replace(/\./g, ""));
      const t1 = Number(m[1]), h1 = zahl(m[2]), t2 = Number(m[3]), h2 = zahl(m[4]);
      // Alles unabhängig aus den beiden Messwerten hergeleitet.
      const steigung = (h2 - h1) / (t2 - t1);
      const anfang = h1 - steigung * t1;
      const nullstelle = -anfang / steigung;
      pruefe(steigung < 0, `A8: der Wert nimmt nicht ab (Steigung ${steigung}) — „${frage}“`);
      pruefe(Number.isInteger(steigung) && Number.isInteger(anfang) && Number.isInteger(nullstelle),
        `A8: ein Wert geht nicht glatt auf (${steigung}, ${anfang}, ${nullstelle}) — „${frage}“`);
      pruefe(t2 < nullstelle, `A8: die zweite Messung läge nach dem Ende (${t2} ≥ ${nullstelle}) — „${frage}“`);
      return {
        felder: [steigung, anfang, nullstelle],
        toleranz: 0.0002,
        falschFelder: [
          [0, -steigung, "nimmt <strong>ab</strong>".replace(/<[^>]*>/g, "")],
          [0, t2 - t1 !== 1 ? h2 - h1 : null, "geteilt"],
          [1, t1 !== 0 ? h1 : null, "erst nach"],
          [2, anfang, "keine Zeit"],
          [2, anfang * -steigung, "hineinpasst"],
          [2, t2, "übrig"],
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
