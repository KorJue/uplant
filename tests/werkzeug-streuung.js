// Einmaliges Werkzeug: misst, wie viele verschiedene Aufgaben ein Generator überhaupt
// hergeben kann, und nennt dazu die ehrliche Streuungsschranke.
//
// Hintergrund: Die Schranken der fachlichen Prüfungen waren aus der Größe der
// Kandidatenliste gerechnet — ohneKollision() siebt davon aber einen guten Teil weg und zieht
// erst aus dem Rest. Die Schranken lagen dadurch zu hoch, und der Gesamtlauf schlug hin und
// wieder an einer Stelle fehl, an der nichts kaputt war.
//
// Vorgehen: Jede Aufgabe wird ZUEGE-mal gewürfelt; aus der Zahl der verschiedenen Aufgaben
// wird die Größe n der wirklich gezogenen Menge zurückgerechnet (Sammelbilderproblem:
// E[verschieden] = n · (1 − (1 − 1/n)^z)). Für ein vorsichtig kleines n wird dann simuliert,
// wie viele verschiedene Aufgaben in 30 Zügen mit Wahrscheinlichkeit 10⁻⁴ unterschritten
// werden — das ist die Schranke, die in die Prüfung gehört.
//
//     node tests/werkzeug-streuung.js [Namensfilter]
//
// Die gemeldete Schranke gilt für 30 Züge — das ist die übliche Rundenzahl. Prüft eine Aufgabe
// mit mehr Runden (UPLANT_ZUEGE setzt die Zahl), gehört die Schranke dafür neu gerechnet: Mehr
// Züge bedeuten mehr verschiedene Aufgaben und damit eine höhere Schranke.

"use strict";

const { starteBrowser, neueSeite, oeffne } = require("./lib/seite.js");
const { alleThemen } = require("./lib/themen.js");
const { oeffneAufgabe, aufgabenProReiter } = require("./lib/aufgaben.js");

const ZUEGE = 200;
const PRUEF_ZUEGE = Number(process.env.UPLANT_ZUEGE || 30);

// n aus der Zahl der verschiedenen Aufgaben zurückrechnen.
function schaetzeN(verschieden, zuege) {
  if (verschieden >= zuege) return Infinity;
  let lo = verschieden, hi = 200000;
  const erwartet = (n) => n * (1 - Math.pow(1 - 1 / n, zuege));
  for (let i = 0; i < 200; i++) {
    const m = (lo + hi) / 2;
    if (erwartet(m) < verschieden) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
}

// Das 10⁻⁴-Quantil der Zahl verschiedener Aufgaben bei PRUEF_ZUEGE Zügen aus n Kandidaten.
function schranke(n, versuche = 400000) {
  if (!isFinite(n) || n > 5000) return PRUEF_ZUEGE - 3;
  const zaehl = new Map();
  for (let s = 0; s < versuche; s++) {
    const gesehen = new Set();
    for (let i = 0; i < PRUEF_ZUEGE; i++) gesehen.add(Math.floor(Math.random() * n));
    zaehl.set(gesehen.size, (zaehl.get(gesehen.size) || 0) + 1);
  }
  let kum = 0;
  for (const v of [...zaehl.keys()].sort((a, b) => a - b)) {
    kum += zaehl.get(v);
    if (kum / versuche >= 1e-4) return v;
  }
  return 1;
}

// Die zu vermessenden Seiten: normalerweise die Grundwissen-Themen, die sich selbst finden.
// Ein Argument, das mit „/“ beginnt, ist dagegen ein Seitenpfad — damit lassen sich auch die
// Klasse-8-Seiten vermessen, die kein Thema im Sinne von alleThemen() sind.
function seitenAuswahl(argument) {
  if (argument.startsWith("/")) {
    const name = argument.split("/").pop().replace(/\.html$/, "");
    return [{ thema: name, name, pfad: argument }];
  }
  return alleThemen().filter((t) => !argument || t.name.includes(argument));
}

(async () => {
  const filter = process.argv[2] || "";
  const browser = await starteBrowser();
  const page = await neueSeite(browser);
  const zeilen = [];

  const seiten = seitenAuswahl(filter);
  if (!seiten.length) {
    console.error(`Keine Seite passt auf „${filter}“. Ein Grundwissen-Thema wird über einen Teil` +
      ` seines Namens gewählt, jede andere Seite über ihren Pfad ab der Wurzel, z. B.` +
      ` /mathematik/klasse-8/geometrie/flaecheninhalte.html`);
    await browser.close();
    process.exit(1);
  }

  for (const thema of seiten) {
    await oeffne(page, thema.pfad);
    const proReiter = await aufgabenProReiter(page);
    const anzahl = proReiter * 4;
    for (let nr = 1; nr <= anzahl; nr++) {
      const box = await oeffneAufgabe(page, nr, proReiter);
      const gesehen = new Set();
      for (let i = 0; i < ZUEGE; i++) {
        await page.locator(`${box} .btn-wuerfeln`).click();
        gesehen.add((await page.locator(`${box} .aufgabe-prompt`).innerText()).replace(/\s+/g, " ").trim());
      }
      const n = schaetzeN(gesehen.size, ZUEGE);
      // Vorsichtshalber mit einer kleineren Menge rechnen: Die Schätzung streut selbst.
      const sicher = isFinite(n) ? Math.max(2, Math.floor(n * 0.8)) : Infinity;
      zeilen.push({ thema: thema.thema, nr, verschieden: gesehen.size, n, schranke: schranke(sicher) });
      console.log(
        `${thema.thema.padEnd(38)} A${nr}  verschieden ${String(gesehen.size).padStart(3)}/${ZUEGE}` +
        `  n ≈ ${isFinite(n) ? Math.round(n) : "groß"}  →  Schranke ${zeilen[zeilen.length - 1].schranke}`,
      );
    }
  }

  await browser.close();
  const ziel = process.env.UPLANT_STREUUNG || require("path").join(require("os").tmpdir(), "streuung.json");
  require("fs").writeFileSync(ziel, JSON.stringify(zeilen, null, 1), "utf8");
  console.log(`\n${zeilen.length} Aufgaben vermessen — Ergebnis in ${ziel}`);
})();
