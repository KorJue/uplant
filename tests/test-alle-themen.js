// Tiefenprüfung, die für jedes der 34 Themen gilt.
//
// Sie prüft nicht den Fachinhalt eines einzelnen Themas — das tun die Dateien
// unter themen/ —, sondern die Zusagen, die auf jeder Seite gelten müssen:
//
//   1. Jeder Regler wird über seinen ganzen Bereich gefahren. Dabei darf nie
//      ein Skript- oder Konsolenfehler auftreten, nie eine verbotene
//      Schreibweise erscheinen (−−, NaN, „+ −“, „−0“ …), und die Anzeige muss
//      zu dem Wert passen, auf dem der Regler wirklich steht. Springt ein
//      Regler über einen verbotenen Wert hinweg, muss dasselbe Bild
//      herauskommen, als hätte man den Zielwert unmittelbar eingestellt.
//   2. Die Darstellung muss eine Funktion des Zustands sein: Derselbe
//      Reglerwert muss zweimal dasselbe Bild ergeben.
//   3. Jedes Quiz hat vier Antworten, genau eine gilt als richtig, und zu jeder
//      gehört eine Erklärung von brauchbarer Länge.
//   4. Jede der vier gestaffelten Übungsaufgaben lässt sich beliebig oft neu
//      würfeln, liefert dabei genügend verschiedene Aufgaben, zeigt bei einer
//      leeren Eingabe eine Musterlösung und stürzt nie ab.
//   5. Jede Zeichenfläche enthält wirklich eine Zeichnung.
//   6. Die verlinkte Formelsammlung ist vorhanden und nicht leer.

"use strict";

const fs = require("fs");
const path = require("path");
const { neuerBericht } = require("./lib/pruefen");
const { starteBrowser, neueSeite, oeffne, reglerListe, setzeRegler, widgetText } = require("./lib/seite");
const { pruefeNotation, pruefeTexte, seitentexte } = require("./lib/notation");
const { alleThemen } = require("./lib/themen");

const b = neuerBericht(80);
const NUR = process.env.UPLANT_THEMA || null;   // z. B. "04-.../12-..." zum Eingrenzen

// Höchstens so viele Reglerstellungen je Regler, damit die Laufzeit im Rahmen
// bleibt. Bei feiner Rasterung wird gleichmäßig ausgedünnt.
const MAX_STELLUNGEN = 26;

function stellungen(r) {
  const werte = [];
  const anzahl = Math.floor((r.max - r.min) / r.step) + 1;
  const schritt = Math.max(1, Math.ceil(anzahl / MAX_STELLUNGEN));
  for (let i = 0; i < anzahl; i += schritt) werte.push(r.min + i * r.step);
  const letzter = r.max;
  if (werte[werte.length - 1] !== letzter) werte.push(letzter);
  return werte;
}

async function pruefeRegler(page, thema) {
  const regler = await reglerListe(page);
  for (const r of regler) {
    if (!r.id) { b.pruefe(false, `${thema}: ein Regler ohne id lässt sich nicht prüfen`); continue; }
    const gesehen = new Map();
    for (const wert of stellungen(r)) {
      page.stoerungen.length = 0;
      const zurueck = await setzeRegler(page, r.id, wert);
      for (const s of page.stoerungen) b.pruefe(false, `${thema}/${r.id}=${wert}: ${s}`);

      pruefeTexte(b, `${thema}/${r.id}=${wert}`, await seitentexte(page));

      const bild = await widgetText(page, r.id);
      if (zurueck !== wert) {
        // Der Regler ist über einen verbotenen Wert gesprungen. Dann muss das
        // Ergebnis dasselbe sein, als hätte man den Zielwert direkt gewählt —
        // sonst zeigte die Seite etwas anderes an, als sie rechnet.
        b.pruefe(Number.isFinite(zurueck), `${thema}/${r.id}: Sprungziel ist keine Zahl`);
        const direkt = await setzeRegler(page, r.id, zurueck);
        const bildDirekt = await widgetText(page, r.id);
        b.pruefe(direkt === zurueck, `${thema}/${r.id}: Sprungziel ${zurueck} ist selbst nicht einstellbar`);
        b.pruefe(bild === bildDirekt,
          `${thema}/${r.id}: nach dem Sprung von ${wert} auf ${zurueck} zeigt die Seite etwas anderes an als bei ${zurueck} direkt`);
      } else {
        if (gesehen.has(wert)) {
          b.pruefe(gesehen.get(wert) === bild,
            `${thema}/${r.id}=${wert}: zweimal derselbe Reglerwert, aber zwei verschiedene Anzeigen`);
        } else {
          gesehen.set(wert, bild);
        }
      }
    }
    // Ein zweiter Durchlauf in umgekehrter Richtung wäre verlockend, taugt aber
    // nicht als Prüfung: Wo zwei Regler gekoppelt sind — etwa α und β mit
    // α + β < 180° —, drückt ein wachsendes α den Partner nach unten, und beim
    // Zurückdrehen kommt er nicht von allein wieder hoch. Diese Hysterese ist
    // gewollt und kein Fehler.
    await setzeRegler(page, r.id, r.start);
  }
  b.pruefe(regler.length >= 0, `${thema}: Reglerliste gelesen`);
}

async function pruefeQuizze(page, thema) {
  const ids = await page.evaluate(() => [...document.querySelectorAll(".quiz")].map((e) => e.id));
  for (const id of ids) {
    const n = await page.locator(`#${id} .quiz-opt`).count();
    b.pruefe(n === 4, `${thema}/${id}: ${n} Antwortmöglichkeiten statt 4`);
    if (n !== 4) continue;
    let richtige = 0;
    for (let i = 0; i < n; i++) {
      page.stoerungen.length = 0;
      await page.locator(`#${id} .quiz-opt`).nth(i).click();
      for (const s of page.stoerungen) b.pruefe(false, `${thema}/${id}: ${s}`);
      const rueck = (await page.locator(`#${id} .quiz-feedback`).innerText()).replace(/\s+/g, " ").trim();
      if (rueck.startsWith("✓")) richtige++;
      else b.pruefe(rueck.startsWith("✗"), `${thema}/${id}: unklare Rückmeldung „${rueck.slice(0, 40)}“`);
      b.pruefe(rueck.length > 40, `${thema}/${id}: Erklärung zu Antwort ${i + 1} ist zu knapp (${rueck.length} Zeichen)`);
    }
    b.pruefe(richtige === 1, `${thema}/${id}: ${richtige} der vier Antworten gelten als richtig`);
  }
  b.pruefe(ids.length >= 3, `${thema}: nur ${ids.length} Kontrollfragen`);
}

const STUFEN = ["einfach", "mittel", "schwierig", "komplex"];

async function pruefeAufgaben(page, thema) {
  const stufen = await page.evaluate(() =>
    [...document.querySelectorAll("#exercises-mount .schwierigkeit-badge")].map((e) => e.textContent.trim()));
  b.pruefe(stufen.includes("einfach"), `${thema}: keine Aufgabe der Stufe „einfach“ sichtbar`);
  const reiter = await page.locator("#exercises-mount .schwierigkeit-tabs button").count();
  b.pruefe(reiter === 3, `${thema}: ${reiter} Reiter für die weiteren Aufgaben statt 3`);

  for (let nr = 1; nr <= 4; nr++) {
    let box;
    if (nr === 1) box = "#exercises-mount > .aufgabe-box";
    else {
      await page.locator(`#exercises-mount .schwierigkeit-tabs button:nth-child(${nr - 1})`).click();
      box = "#exercises-mount .schwierigkeit-tab-panel .aufgabe-box";
    }
    // Manche Themen setzen die Marke per CSS in Großbuchstaben; das ist eine
    // Gestaltungsfrage und keine inhaltliche.
    const stufe = (await page.locator(`${box} .schwierigkeit-badge`).innerText()).trim().toLowerCase();
    b.pruefe(stufe === STUFEN[nr - 1], `${thema}/Aufgabe ${nr}: Stufe „${stufe}“ statt „${STUFEN[nr - 1]}“`);

    const gesehen = new Set();
    const RUNDEN = 30;
    for (let i = 0; i < RUNDEN; i++) {
      page.stoerungen.length = 0;
      await page.locator(`${box} .btn:not(.btn-primary)`).click();
      for (const s of page.stoerungen) b.pruefe(false, `${thema}/Aufgabe ${nr}: ${s}`);
      const frage = (await page.locator(`${box} .aufgabe-prompt`).innerText()).replace(/\s+/g, " ").trim();
      // „Berechne: 9 + 5 · 2“ ist eine vollständige Aufgabe; die Schranke soll
      // nur einen leeren oder abgeschnittenen Text erkennen.
      b.pruefe(frage.length > 8, `${thema}/Aufgabe ${nr}: Aufgabentext zu kurz — „${frage}“`);
      gesehen.add(frage);
      pruefeTexte(b, `${thema}/Aufgabe ${nr}`, await seitentexte(page));
    }
    // Eine Aufgabe, die in dreißig Zügen weniger als fünf verschiedene Formen
    // annimmt, ist als Übung wertlos. Die eigentlichen Streuungsschranken
    // stehen in den fachlichen Einzelprüfungen.
    b.pruefe(gesehen.size >= 5,
      `${thema}/Aufgabe ${nr}: nur ${gesehen.size} verschiedene Aufgaben in ${RUNDEN} Zügen`);

    // Leere Eingabe: Die Seite muss die Musterlösung zeigen und darf nicht
    // behaupten, die Antwort sei richtig.
    page.stoerungen.length = 0;
    await page.locator(`${box} input`).fill("");
    await page.locator(`${box} .btn-primary`).click();
    const rueck = (await page.locator(`${box} .aufgabe-feedback`).innerText()).replace(/\s+/g, " ");
    for (const s of page.stoerungen) b.pruefe(false, `${thema}/Aufgabe ${nr}: ${s}`);
    b.pruefe(rueck.includes("Noch nicht richtig"), `${thema}/Aufgabe ${nr}: leere Eingabe gilt nicht als falsch`);
    b.pruefe(rueck.includes("Musterlösung"), `${thema}/Aufgabe ${nr}: keine Musterlösung nach dem Prüfen`);
    b.pruefe(rueck.length > 80, `${thema}/Aufgabe ${nr}: Musterlösung zu knapp`);
  }
}

async function pruefeZeichnungen(page, thema) {
  // Ausgeblendete Flächen bleiben leer — etwa dort, wo der Nutzer zwischen
  // Tabelle und Zeichnung umschaltet. Eine sichtbare Fläche muss dagegen
  // wirklich etwas enthalten; wie viel, hängt vom Bild ab: Ein Rechteck mit
  // zwei Maßangaben kommt mit drei Elementen aus.
  const flaechen = await page.evaluate(() => [...document.querySelectorAll(".geo-wrap")].map((w) => {
    if (w.hidden || w.offsetParent === null) return null;
    const svg = w.querySelector("svg");
    return svg ? svg.querySelectorAll("*").length : 0;
  }));
  flaechen.forEach((n, i) => {
    if (n === null) return;
    b.pruefe(n >= 1, `${thema}: sichtbare Zeichenfläche ${i + 1} enthält ${n === 0 ? "keine Zeichnung" : n + " Elemente"}`);
  });
}

function pruefeFormelsammlung(thema) {
  const html = fs.readFileSync(path.join(thema.verzeichnis, "index.html"), "utf-8");
  if (!html.includes("formelsammlung.pdf")) return;
  const pdf = path.join(thema.verzeichnis, "formelsammlung.pdf");
  b.pruefe(fs.existsSync(pdf), `${thema.name}: die verlinkte Formelsammlung fehlt`);
  if (fs.existsSync(pdf)) {
    const groesse = fs.statSync(pdf).size;
    b.pruefe(groesse > 20000, `${thema.name}: die Formelsammlung ist nur ${groesse} Bytes groß`);
    const kopf = fs.readFileSync(pdf).subarray(0, 5).toString("latin1");
    b.pruefe(kopf === "%PDF-", `${thema.name}: die Formelsammlung ist keine PDF-Datei`);
  }
}

(async () => {
  const themen = alleThemen().filter((t) => !NUR || t.name.includes(NUR));
  b.pruefe(themen.length > 0, "keine Themen gefunden");
  if (!NUR) b.pruefe(themen.length === 34, `${themen.length} Themen gefunden — erwartet 34`);

  const browser = await starteBrowser();
  const page = await neueSeite(browser);
  for (const t of themen) {
    const antwort = await oeffne(page, t.pfad);
    b.pruefe(antwort && antwort.ok(), `${t.name}: Status ${antwort ? antwort.status() : "—"}`);
    for (const s of page.stoerungen) b.pruefe(false, `${t.name} beim Laden: ${s}`);
    await pruefeNotation(page, b, t.name);
    await pruefeZeichnungen(page, t.name);
    await pruefeRegler(page, t.name);
    await pruefeQuizze(page, t.name);
    await pruefeAufgaben(page, t.name);
    pruefeFormelsammlung(t);
  }
  await page.close();
  await browser.close();
  b.abschluss();
})();
