// Bausteine für die Prüfung der gestaffelten Übungsaufgaben.
//
// Jede fachliche Prüfung liest den gewürfelten Aufgabentext, rechnet die
// Antwort unabhängig nach und trägt sie ein. Zusätzlich wird — soweit die
// Aufgabe Fehlerhinweise anbietet — jeder vorgesehene Fehlerwert eingetragen
// und geprüft, dass genau sein Hinweis erscheint.

"use strict";

const STUFEN = ["einfach", "mittel", "schwierig", "komplex"];

// Deutsche Zahl aus einem Anzeigetext lesen: Tausenderpunkte weg, Komma zu
// Punkt, echtes Minuszeichen zu Bindestrich.
function zahl(text) {
  const m = String(text).replace(/−/g, "-").replace(/\.(?=\d{3}\b)/g, "").match(/-?\d+(?:,\d+)?/);
  return m ? parseFloat(m[0].replace(",", ".")) : NaN;
}

// Alle Zahlen einer Zeile in der Reihenfolge ihres Auftretens.
function zahlen(text) {
  const roh = String(text).replace(/−/g, "-").replace(/\.(?=\d{3}\b)/g, "");
  return (roh.match(/-?\d+(?:,\d+)?/g) || []).map((s) => parseFloat(s.replace(",", ".")));
}

// Zahlen werden in deutscher Schreibweise eingegeben; Zeichenketten — etwa
// ein Bruch „3/4“ — gehen unverändert durch.
function deutsch(x) {
  return typeof x === "number" ? String(x).replace(".", ",") : String(x);
}

async function oeffneAufgabe(page, nr) {
  if (nr === 1) return "#exercises-mount > .aufgabe-box";
  await page.locator(`#exercises-mount .schwierigkeit-tabs button:nth-child(${nr - 1})`).click();
  return "#exercises-mount .schwierigkeit-tab-panel .aufgabe-box";
}

async function wuerfle(page, box) {
  await page.locator(`${box} .btn:not(.btn-primary)`).click();
  return (await page.locator(`${box} .aufgabe-prompt`).innerText()).replace(/\s+/g, " ").trim();
}

async function antworte(page, box, wert) {
  await page.locator(`${box} input`).fill(deutsch(wert));
  await page.locator(`${box} .btn-primary`).click();
  return (await page.locator(`${box} .aufgabe-feedback`).innerText()).replace(/\s+/g, " ").trim();
}

// Treibt eine Aufgabe über viele Runden.
//
//   deute(frage, roh) → null (unlesbar) oder
//     { richtig, toleranz?, falsch?: [[wert, musterImHinweis], …], pruefe?(frage, rueckmeldung) }
//
// `roh` stammt aus dem optionalen `liesRoh(page, box)`. Es wird gebraucht, wo
// die Aufgabe Brüche als übereinandergesetzte Elemente zeigt: Im reinen Text
// stünde dann nur „3 4“, und Zähler und Nenner wären nicht zu unterscheiden.
//
// `mindestensVerschieden` ist die Streuungsschranke; sie gehört im Aufrufer
// ausgerechnet und kommentiert (E − 3σ), nicht geraten.
async function pruefeAufgabe(page, bericht, { nr, name, runden = 40, mindestensVerschieden, deute, liesRoh }) {
  const box = await oeffneAufgabe(page, nr);
  const stufe = (await page.locator(`${box} .schwierigkeit-badge`).innerText()).trim().toLowerCase();
  bericht.pruefe(stufe === STUFEN[nr - 1], `${name}: Stufe „${stufe}“ statt „${STUFEN[nr - 1]}“`);

  const gesehen = new Set();
  for (let i = 0; i < runden; i++) {
    const frage = await wuerfle(page, box);
    gesehen.add(frage);
    const roh = liesRoh ? await liesRoh(page, box) : null;
    const d = deute(frage, roh);
    if (!d) { bericht.pruefe(false, `${name}: Aufgabe nicht lesbar — „${frage}“`); continue; }

    const rueck = await antworte(page, box, d.richtig);
    bericht.pruefe(rueck.includes("✓ Richtig"),
      `${name}: die nachgerechnete Antwort ${d.richtig} wird nicht anerkannt — „${frage}“`);
    bericht.pruefe(rueck.includes("Musterlösung"), `${name}: keine Musterlösung — „${frage}“`);
    if (d.pruefe) d.pruefe(frage, rueck);

    for (const [falsch, muster] of d.falsch || []) {
      if (falsch === null || falsch === undefined) continue;
      if (typeof falsch === "number" && !Number.isFinite(falsch)) continue;
      // Fällt ein Fehlerwert mit der Lösung zusammen, taugt er nicht als Probe.
      if (typeof falsch === "number" && typeof d.richtig === "number"
          && Math.abs(falsch - d.richtig) < (d.toleranz ?? 0.5)) continue;
      if (typeof falsch === "string" && falsch === String(d.richtig)) continue;
      const r = await antworte(page, box, falsch);
      bericht.pruefe(r.includes("Noch nicht richtig"),
        `${name}: die falsche Antwort ${falsch} wird anerkannt — „${frage}“`);
      if (muster) {
        bericht.pruefe(r.includes(muster),
          `${name}: bei der Eingabe ${falsch} fehlt der Hinweis „${muster}“ — „${frage}“`);
      }
    }
  }
  bericht.pruefe(gesehen.size >= mindestensVerschieden,
    `${name}: nur ${gesehen.size} verschiedene Aufgaben in ${runden} Zügen (erwartet ≥ ${mindestensVerschieden})`);
}

// Erwartete Zahl verschiedener Aufgaben bei n gleich wahrscheinlichen
// Kandidaten und k Zügen, samt Streuung — damit die Schranke ausgerechnet und
// nicht geraten wird.
function streuung(n, k) {
  const a = Math.pow(1 - 1 / n, k);
  const b = Math.pow(1 - 2 / n, k);
  const E = n * (1 - a);
  const varianz = Math.max(0, n * a + n * (n - 1) * b - n * n * a * a);
  return { E, sigma: Math.sqrt(varianz), schranke: Math.floor(E - 3 * Math.sqrt(varianz)) };
}

module.exports = { oeffneAufgabe, wuerfle, antworte, pruefeAufgabe, zahl, zahlen, deutsch, streuung, STUFEN };
