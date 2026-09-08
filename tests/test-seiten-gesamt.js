// Prüft alle Seiten des Bereichs „Grundwissen Klasse 5-10“ auf einmal:
// Lädt jede Seite in hellem und dunklem Modus, sammelt Konsolenfehler,
// Skriptfehler und fehlgeschlagene Anfragen und verfolgt jeden internen
// Verweis samt Sprungmarke.
//
// Dieser Test ersetzt nicht die fachlichen Einzeltests, sondern sichert ab,
// dass keine Seite kaputt ist und kein Verweis ins Leere zeigt.

const fs = require("fs");
const path = require("path");
const { neuerBericht } = require("./lib/pruefen");
const { starteBrowser, neueSeite, oeffne } = require("./lib/seite");
const { alleSeiten, WURZEL } = require("./lib/themen");

const bericht = neuerBericht(80);
const { pruefe } = bericht;

(async () => {
  const alle = alleSeiten().sort();
  pruefe(alle.length >= 35, `nur ${alle.length} Seiten gefunden — erwartet mindestens 35`);

  const browser = await starteBrowser();
  // Die Sprungmarken jeder Datei einmal einlesen, statt sie je Verweis zu holen.
  const marken = new Map();
  for (const p of alle) {
    const inhalt = fs.readFileSync(path.join(WURZEL, p.slice(1)), "utf-8");
    marken.set(p, new Set([...inhalt.matchAll(/id="([^"]+)"/g)].map((m) => m[1])));
  }

  for (const dunkel of [false, true]) {
    const page = await neueSeite(browser, { dunkel });
    for (const p of alle) {
      const antwort = await oeffne(page, p);
      pruefe(antwort && antwort.ok(), `${p}: Status ${antwort ? antwort.status() : "—"}`);
      for (const s of page.stoerungen) pruefe(false, `${p} (${dunkel ? "dunkel" : "hell"}): ${s}`);

      if (dunkel) {
        const gesetzt = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
        pruefe(gesetzt === "dark", `${p}: Dunkelmodus nicht aktiv`);
        continue;
      }

      // Jeden internen Verweis auflösen — Datei und Sprungmarke.
      const verweise = await page.evaluate(() => [...document.querySelectorAll("a[href]")]
        .map((a) => a.getAttribute("href")).filter((h) => h && !/^(https?:|mailto:|#)/.test(h)));
      for (const v of new Set(verweise)) {
        const [roh, anker] = v.split("#");
        const ziel = path.posix.normalize(path.posix.join(path.posix.dirname(p), roh));
        const datei = path.join(WURZEL, ziel);
        pruefe(fs.existsSync(datei), `${p}: Verweis ins Leere → ${v}`);
        if (anker && marken.has(ziel)) {
          pruefe(marken.get(ziel).has(anker), `${p}: Sprungmarke „${anker}“ fehlt in ${ziel}`);
        } else if (anker && fs.existsSync(datei) && datei.endsWith(".html")) {
          const inhalt = fs.readFileSync(datei, "utf-8");
          pruefe(inhalt.includes(`id="${anker}"`), `${p}: Sprungmarke „${anker}“ fehlt in ${ziel}`);
        }
      }
    }
    await page.close();
  }
  await browser.close();

  bericht.abschluss();
})();
