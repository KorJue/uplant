// Fachliche Prüfung: Kapitel 2, Thema 8 „Ähnlichkeit“.
//
// Das Thema steht und fällt mit einem Satz: Längen wachsen mit k, Flächen mit
// k², Volumina mit k³. Geprüft wird er von beiden Seiten — an der Zeichnung,
// die genau k² Kästchen zeigen muss, und an den Aufgaben, in denen jeder
// vorgesehene Fehler (addieren statt multiplizieren, k statt k², k³ statt k²)
// eigens eingetragen wird.

"use strict";

const { neuerBericht } = require("../lib/pruefen");
const { starteBrowser, neueSeite, oeffne, setzeRegler, text } = require("../lib/seite");
const { pruefeNotation } = require("../lib/notation");
const { pruefeKontrast } = require("../lib/kontrast");
const { pruefeAufgabe } = require("../lib/aufgaben");

const bericht = neuerBericht();
const { pruefe } = bericht;
const SEITE = "/mathematik/grundwissen-5-10/02-geometrie/08-aehnlichkeit/index.html";

// Zahl in der Schreibweise der Seite: Komma statt Punkt, keine überflüssigen
// Nullen (toLocaleString mit maximumFractionDigits).
const de = (x, stellen) => Number(x.toFixed(stellen)).toLocaleString("de-DE", { maximumFractionDigits: stellen });

// ── Die Zeichnung zu k², k³ ────────────────────────────────────────────────
// Das Originalquadrat ist 3 cm groß und wird mit 22 px je cm gezeichnet; das
// Bildquadrat ist sein k-Faches. Das Gitter zeichnet die Trennlinien zwischen
// den Originalquadraten, in jeder Richtung eine weniger als Kästchen.
async function potenzen(page) {
  const SEITE_CM = 3, PX = 22, SCHRITT = SEITE_CM * PX;

  for (const stellung of [10, 15, 20, 25, 30, 35, 40]) {
    const k = stellung / 10;
    await setzeRegler(page, "pt-k", stellung);

    const angezeigt = await text(page, "#pt-k-anzeige");
    pruefe(angezeigt === de(k, 2), `Potenzen: bei k = ${k} zeigt die Anzeige „${angezeigt}“`);

    const bild = await page.evaluate(() => {
      const svg = document.querySelector("#pt-mount svg");
      const b = svg.querySelector("rect.ae-quadrate");
      const o = svg.querySelector("rect.ae-original");
      return {
        breiteBild: Number(b.getAttribute("width")),
        breiteOriginal: Number(o.getAttribute("width")),
        gitter: svg.querySelectorAll(".ae-gitter").length,
      };
    });

    // Die Zeichnung muss das Verhältnis zeigen, das sie behauptet.
    pruefe(Math.abs(bild.breiteBild - SCHRITT * k) < 0.01,
      `Potenzen: bei k = ${k} ist das Bildquadrat ${bild.breiteBild} px statt ${SCHRITT * k} px breit`);
    pruefe(Math.abs(bild.breiteOriginal - SCHRITT) < 0.01,
      `Potenzen: das Originalquadrat misst ${bild.breiteOriginal} px statt ${SCHRITT} px`);

    // Gezeichnet werden die Linien i · Schritt < Bildbreite − 0,5, in beiden
    // Richtungen gleich viele.
    let linien = 0;
    for (let i = 1; i * SCHRITT < SCHRITT * k - 0.5; i++) linien++;
    pruefe(bild.gitter === 2 * linien,
      `Potenzen: bei k = ${k} sind ${bild.gitter} Gitterlinien gezeichnet, erwartet ${2 * linien}`);

    // Die drei Karten nennen die Faktoren k, k² und k³ — der Kern des Themas.
    const karten = await page.evaluate(() => [...document.querySelectorAll("#pt-karten .ae-potenz-karte")]
      .map((c) => c.innerText.replace(/\s+/g, " ").trim()));
    pruefe(karten.length === 3, `Potenzen: ${karten.length} Karten statt 3`);
    const A = SEITE_CM * SEITE_CM, V = A * SEITE_CM;
    const erwartet = [
      [`k = ${de(k, 2)}`, `${de(SEITE_CM * k, 3)} cm`],
      [`k² = ${de(k * k, 4)}`, `${de(A * k * k, 3)} cm²`],
      [`k³ = ${de(k * k * k, 4)}`, `${de(V * k * k * k, 3)} cm³`],
    ];
    erwartet.forEach(([faktor, ergebnis], i) => {
      pruefe(karten[i] && karten[i].includes(faktor) && karten[i].includes(ergebnis),
        `Potenzen: bei k = ${k} fehlt in Karte ${i + 1} „${faktor}“ oder „${ergebnis}“ — „${karten[i]}“`);
    });

    // Der Begleitsatz darf nur bei ganzzahligem k von „genau k² Kästchen“
    // sprechen; bei k = 2,5 passt kein ganzzahliges Vielfaches hinein.
    const satz = await text(page, "#pt-text");
    if (Number.isInteger(k)) {
      pruefe(satz.includes(`genau ${k * k} Originalquadrate`),
        `Potenzen: bei k = ${k} nennt der Text nicht ${k * k} Originalquadrate — „${satz}“`);
      pruefe(bild.gitter === 2 * (k - 1),
        `Potenzen: bei k = ${k} soll das Gitter ${k}² Kästchen zeigen, es hat aber ${bild.gitter} Linien`);
    } else {
      pruefe(satz.includes("kein ganzzahliges Vielfaches"),
        `Potenzen: bei k = ${k} behauptet der Text ein ganzzahliges Vielfaches — „${satz}“`);
    }
  }
}

// ── Die Übungsaufgaben ─────────────────────────────────────────────────────
async function aufgaben(page) {
  // Aufgabe 1 — zentrische Streckung vor- und rückwärts. k ∈ 2..5, a ∈ 3..12,
  // zwei Richtungen: 80 gleich wahrscheinliche Fassungen. Bei 30 Zügen ist
  // E = 25,1 und σ = 1,7; die Verteilung hat aber einen langen linken Rand
  // (Quantil 10⁻⁴ bei 18), deshalb liegt die Schranke bei 17.
  await pruefeAufgabe(page, bericht, {
    nr: 1, name: "A1 zentrische Streckung", runden: 30, mindestensVerschieden: 17,
    deute: (frage) => {
      const k = Number((frage.match(/k = (\d+)/) || [])[1]);
      if (!k) return null;

      const vor = frage.match(/Originalfigur ist (\d+) cm lang/);
      if (vor) {
        const a = Number(vor[1]);
        return {
          richtig: a * k,
          toleranz: 0.005,
          falsch: [
            [a + k, "addiert"],
            [a / k, "dividiert"],
          ],
          pruefe: (f) => {
            // Die Aufgabe verspricht, dass Streckung und Zuschlag nie
            // zusammenfallen — sonst ließe sich der Fehler nicht diagnostizieren.
            pruefe(a * k !== a + k, `A1: bei a = ${a}, k = ${k} ist a·k = a+k — „${f}“`);
          },
        };
      }

      const zurueck = frage.match(/Bildfigur ist (\d+) cm lang/);
      if (!zurueck) return null;
      const bild = Number(zurueck[1]);
      return {
        richtig: bild / k,
        toleranz: 0.005,
        falsch: [
          [bild * k, "multipliziert"],
          [bild - k, "subtrahiert"],
        ],
        pruefe: (f) => {
          // Konstruktiv erzeugt: Das Bild ist das k-Fache einer ganzen Zahl,
          // also muss auch die Rückrechnung ganzzahlig aufgehen.
          pruefe(bild % k === 0, `A1: ${bild} : ${k} geht nicht auf — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 2 — den Streckfaktor selbst bestimmen, hier auch für k < 1. Gemessen mit
  // tests/werkzeug-streuung.js: 65 verschiedene in 200 Würfen, zurückgerechnet rund 69
  // Kandidaten. Die nachgebildete Verteilung ergibt bei 30 Zügen E = 24,7 und ein
  // 10⁻⁴-Quantil von 18; angesetzt wird die vorsichtigere Rechnung mit 0,8 · n — 16.
  let kleinerEins = 0, groesserEins = 0;
  await pruefeAufgabe(page, bericht, {
    nr: 2, name: "A2 Streckfaktor bestimmen", runden: 30, mindestensVerschieden: 16,
    deute: (frage) => {
      const m = frage.match(/Strecke ist (\d+) cm lang.*?Bildstrecke (\d+) cm lang/);
      if (!m) return null;
      const a = Number(m[1]), bild = Number(m[2]);
      const k = bild / a;
      pruefe([0.25, 0.5, 0.75, 1.5, 2, 2.5, 3, 4].some((v) => Math.abs(v - k) < 1e-9),
        `A2: k = ${k} ist keiner der vorgesehenen Streckfaktoren — „${frage}“`);
      if (k < 1) kleinerEins++; else groesserEins++;
      return {
        richtig: k,
        toleranz: 0.0005,
        falsch: [
          [a / bild, "Original durch Bild"],
          [bild - a, "Differenz"],
          [a - bild, "verkehrt herum"],
        ],
      };
    },
  });
  pruefe(kleinerEins > 0 && groesserEins > 0,
    `A2: in 30 Zügen war k ${kleinerEins}-mal kleiner und ${groesserEins}-mal größer als 1 — beide Fälle müssen vorkommen`);

  // Aufgabe 3 — 1. Strahlensatz. m ∈ 2..4, p ∈ 3..9, q ∈ 3..9 mit Ausweichen
  // bei q = p; die Fassungen sind dadurch ungleich wahrscheinlich. Simuliert
  // man den Generator, ist bei 30 Zügen E = 27,0 und σ = 1,5 (Quantil 10⁻⁴
  // bei 21) — Schranke 20.
  await pruefeAufgabe(page, bericht, {
    nr: 3, name: "A3 1. Strahlensatz", runden: 30, mindestensVerschieden: 20,
    deute: (frage) => {
      const m = frage.match(/ZA = (\d+) cm, ZA. = (\d+) cm und ZB = (\d+) cm/);
      if (!m) return null;
      const [p, zas, q] = m.slice(1).map(Number);
      const faktor = zas / p;
      return {
        richtig: q * faktor,
        toleranz: 0.005,
        falsch: [
          // Die Differenz addiert statt das Verhältnis anzuwenden.
          [q + (zas - p), "Differenz"],
          // Das Verhältnis umgekehrt angesetzt.
          [q / faktor, "umgekehrt"],
        ],
        pruefe: (f, rueck) => {
          pruefe(Number.isInteger(faktor), `A3: ZA' : ZA = ${zas} : ${p} ist nicht ganzzahlig — „${f}“`);
          // Der Fehlerwert muss von der Lösung verschieden sein, sonst wäre er
          // nicht diagnostizierbar: q·m = q + p(m−1) gilt genau für q = p.
          pruefe(q !== p, `A3: ZB = ZA = ${p} cm macht den Differenzfehler unsichtbar — „${f}“`);
          pruefe(rueck.includes("1. Strahlensatz"),
            `A3: die Musterlösung benennt den Strahlensatz nicht — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 4 — 2. Strahlensatz: die gesuchte Strecke liegt auf den Parallelen. Gemessen: 104
  // verschiedene in 200 Würfen, zurückgerechnet rund 134 Kandidaten. Schranke: simuliertes
  // 10⁻⁴-Quantil bei 30 Zügen für 0,8 · n — 19.
  await pruefeAufgabe(page, bericht, {
    nr: 4, name: "A4 2. Strahlensatz", runden: 30, mindestensVerschieden: 19,
    deute: (frage) => {
      const m = frage.match(/ZA = (\d+) cm, ZA. = (\d+) cm und die Strecke AB = (\d+) cm/);
      if (!m) return null;
      const [p, zas, q] = m.slice(1).map(Number);
      const faktor = zas / p;
      pruefe(Number.isInteger(faktor), `A4: ZA' : ZA = ${zas} : ${p} ist nicht ganzzahlig — „${frage}“`);
      pruefe(q !== p, `A4: AB = ZA = ${p} cm macht den Differenzfehler unsichtbar — „${frage}“`);
      return {
        felder: [faktor, q * faktor],
        toleranz: 0.0005,
        falschFelder: [
          [0, zas - p, "Differenz"],
          [0, p / zas, "umgekehrt"],
          [1, q + (zas - p), "Differenz"],
          [1, q / faktor, "länger"],
        ],
      };
    },
  });

  // Aufgabe 5 — k aus zwei Seiten, dann die Fläche mit k². k ∈ 2..4, a ∈ 3..9,
  // A gerade aus 4..30: bei 30 Zügen E = 28,5, σ = 1,2, Quantil 10⁻⁴ bei 23.
  await pruefeAufgabe(page, bericht, {
    nr: 5, name: "A5 Fläche mit k²", runden: 30, mindestensVerschieden: 22,
    deute: (frage) => {
      const m = frage.match(/Seite (\d+) cm lang.*?Seite (\d+) cm lang.*?Flächeninhalt (\d+) cm²/);
      if (!m) return null;
      const [a, as, A] = m.slice(1).map(Number);
      const k = as / a;
      return {
        richtig: A * k * k,
        toleranz: 0.005,
        falsch: [
          [A * k, "nur mit"],
          [A * k * k * k, "k³"],
          [A + (as - a), "Differenz"],
        ],
        pruefe: (f) => {
          pruefe(Number.isInteger(k), `A5: ${as} : ${a} ist kein ganzzahliger Streckfaktor — „${f}“`);
          // A·k und A + a(k−1) fallen genau für A = a zusammen; die Aufgabe
          // schließt das aus, damit beide Fehler unterscheidbar bleiben.
          pruefe(A !== a, `A5: A = a = ${a} macht zwei Fehler ununterscheidbar — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 6 — rückwärts vom Flächen- oder Volumenfaktor auf k. Gemessen: 78 verschiedene in 200
  // Würfen, zurückgerechnet rund 86 Kandidaten. Die nachgebildete Verteilung ergibt bei 30 Zügen
  // E = 25,6 und ein 10⁻⁴-Quantil von 19; angesetzt wird die vorsichtigere Rechnung mit
  // 0,8 · n — 18.
  const wurzeln = new Set();
  await pruefeAufgabe(page, bericht, {
    nr: 6, name: "A6 vom Faktor zur Länge", runden: 30, mindestensVerschieden: 18,
    deute: (frage) => {
      const m = frage.match(/(Oberfläche|Volumen) des größeren ist (\d+)-mal so groß.*?Kante des kleineren Körpers ist (\d+) cm/);
      if (!m) return null;
      const ueberFlaeche = m[1] === "Oberfläche";
      const faktor = Number(m[2]), a = Number(m[3]);
      // Unabhängig nachgerechnet: k ist die zweite beziehungsweise dritte Wurzel aus dem Faktor.
      const k = Math.round(ueberFlaeche ? Math.sqrt(faktor) : Math.cbrt(faktor));
      pruefe(ueberFlaeche ? k * k === faktor : k * k * k === faktor,
        `A6: ${faktor} ist keine ${ueberFlaeche ? "Quadrat" : "Kubik"}zahl — „${frage}“`);
      wurzeln.add(m[1]);
      return {
        felder: [k, a * k],
        toleranz: 0.0005,
        falschFelder: [
          [0, faktor, ueberFlaeche ? "Faktor für die Oberfläche" : "Faktor für das Volumen"],
          [0, faktor / (ueberFlaeche ? 2 : 3), "Wurzelziehen"],
          [1, a * faktor, "gehört zu"],
          [1, a + k, "Zuschlag"],
        ],
      };
    },
  });
  pruefe(wurzeln.size === 2,
    "A6: in 30 Zügen kam nur eine der beiden Fassungen (Oberfläche / Volumen) vor");

  // Aufgabe 7 — Maßstab, Fläche mit k², dann cm² → m². Drei Maßstäbe mit 6, 3
  // und 3 Längen, dazu 10 Flächen: bei 30 Zügen E = 26,3 und σ = 1,6,
  // Quantil 10⁻⁴ bei 20 — Schranke 19.
  await pruefeAufgabe(page, bericht, {
    nr: 7, name: "A7 Modellauto", runden: 30, mindestensVerschieden: 19,
    deute: (frage) => {
      const m = frage.match(/ist (\d+) cm lang, das echte Auto ([\d,]+) m.*?beträgt (\d+) cm²/);
      if (!m) return null;
      const L = Number(m[1]);
      const R = Number(m[2].replace(",", "."));
      const F = Number(m[3]);
      // In Zentimetern rechnen: R · 100 wäre 460,00000000000006.
      const k = Math.round((R * 100) / L);
      const Z = (F * k * k) / 10000;
      return {
        richtig: Z,
        toleranz: 0.001,
        falsch: [
          // In Quadratzentimetern stehen geblieben.
          [F * k * k, "Quadratzentimetern"],
          // Nur mit k statt mit k² gestreckt.
          [Z / k, "gestreckt"],
          // Mit k³ gerechnet.
          [Z * k, "k³"],
        ],
        pruefe: (f, rueck) => {
          pruefe(Math.abs(R * 100 - L * k) < 1e-9,
            `A7: ${R} m sind nicht ${L} cm · ${k} — „${f}“`);
          // Konstruktiv gewählt: Die gesuchte Fläche muss ganzzahlig sein.
          pruefe(Number.isInteger(Z), `A7: die Lösung ${Z} m² ist nicht ganzzahlig — „${f}“`);
          pruefe(rueck.includes("10 000"),
            `A7: die Musterlösung nennt die Umrechnung 1 m² = 10 000 cm² nicht — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 8 — k, k² und k³ an einem Quader. Gemessen: 165 verschiedene in 200 Würfen,
  // zurückgerechnet rund 500 Kandidaten. Schranke: simuliertes 10⁻⁴-Quantil bei 30 Zügen für
  // 0,8 · n — 24.
  await pruefeAufgabe(page, bericht, {
    nr: 8, name: "A8 zwei ähnliche Behälter", runden: 30, mindestensVerschieden: 24,
    deute: (frage) => {
      const m = frage.match(/kleinere ist (\d+) cm lang, (\d+) cm breit und (\d+) cm hoch.*?größere ist (\d+) cm hoch/);
      if (!m) return null;
      const [l, b, h, hGross] = m.slice(1).map(Number);
      const k = hGross / h;
      // Oberfläche und Volumen werden aus den Kantenlängen nachgerechnet, nicht aus der Seite
      // übernommen — nur so prüft der Test wirklich etwas.
      const o1 = 2 * (l * b + l * h + b * h);
      const v1 = l * b * h;
      pruefe(Number.isInteger(k), `A8: ${hGross} : ${h} ist kein ganzzahliger Streckfaktor — „${frage}“`);
      return {
        felder: [k, o1 * k * k, (v1 * k * k * k) / 1000],
        toleranz: 0.005,
        falschFelder: [
          [0, hGross - h, "Differenz"],
          [0, h / hGross, "umgekehrt"],
          [1, o1, "kleineren"],
          [1, o1 * k, "nur mit k"],
          [1, o1 * k * k * k, "k³"],
          [2, v1 * k * k * k, "cm³"],
          [2, (v1 * k * k) / 1000, "k² gestreckt"],
          [2, v1 / 1000, "kleineren"],
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
    if (!dunkel) { await potenzen(page); await aufgaben(page); }
    else await pruefeKontrast(page, bericht, "dunkel");
    await pruefeNotation(page, bericht, wo);
    for (const s of page.stoerungen) pruefe(false, `${wo}: ${s}`);
    await page.close();
  }
  await browser.close();
  bericht.abschluss();
})();
