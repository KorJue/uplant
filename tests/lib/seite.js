// Browser und Seite aufsetzen, Störungen einsammeln, Regler bedienen.
//
// Der Browser ist das vorinstallierte Chromium; ein Herunterladen ist weder
// nötig noch möglich. Die Adresse des Prüfservers steht in UPLANT_PORT.

"use strict";

const { chromium } = require("playwright");
const path = require("path");

const BROWSER_PFAD = process.env.UPLANT_CHROMIUM || "/opt/pw-browsers/chromium";
const PORT = process.env.UPLANT_PORT || "8936";
const HOST = `http://localhost:${PORT}`;
const WURZEL = path.resolve(__dirname, "..", "..");

async function starteBrowser() {
  return chromium.launch({ executablePath: BROWSER_PFAD });
}

// Eine Seite mit Störungsmelder. `stoerungen` sammelt Skriptfehler,
// Konsolenfehler und fehlgeschlagene Anfragen; das eigene Favicon des Browsers
// wird ausgenommen, weil die Seiten bewusst keines mitbringen.
async function neueSeite(browser, { dunkel = false, breite = 1200, hoehe = 900 } = {}) {
  const page = await browser.newPage({ viewport: { width: breite, height: hoehe } });
  const stoerungen = [];
  page.on("pageerror", (e) => stoerungen.push("Skriptfehler: " + e.message));
  page.on("console", (m) => {
    if (m.type() === "error" && !m.location().url.endsWith("/favicon.ico")) {
      stoerungen.push("Konsole: " + m.text());
    }
  });
  page.on("requestfailed", (r) => {
    if (!r.url().endsWith("/favicon.ico")) stoerungen.push("Anfrage fehlgeschlagen: " + r.url());
  });
  page.stoerungen = stoerungen;
  if (dunkel) {
    // Der Schalter liegt im localStorage; er wirkt erst beim nächsten Laden.
    await page.goto(HOST + "/index.html", { waitUntil: "domcontentloaded" });
    await page.evaluate(() => localStorage.setItem("uplant-theme", "dark"));
    stoerungen.length = 0;
  }
  return page;
}

async function oeffne(page, pfad) {
  page.stoerungen.length = 0;
  const antwort = await page.goto(HOST + pfad, { waitUntil: "networkidle" });
  // Die Zeichnungen entstehen erst, nachdem das Modul gelaufen ist.
  await page.waitForTimeout(60);
  return antwort;
}

// Alle Regler einer Seite mit ihren Grenzen.
async function reglerListe(page) {
  return page.evaluate(() => [...document.querySelectorAll('input[type="range"]')].map((e) => ({
    id: e.id,
    min: Number(e.min === "" ? 0 : e.min),
    max: Number(e.max === "" ? 100 : e.max),
    step: Number(e.step === "" ? 1 : e.step),
    start: Number(e.value),
  })));
}

async function setzeRegler(page, id, wert) {
  return page.evaluate(([i, w]) => {
    const e = document.getElementById(i);
    e.value = String(w);
    e.dispatchEvent(new Event("input", { bubbles: true }));
    return Number(e.value);
  }, [id, wert]);
}

// Der sichtbare Text des Widgets, in dem ein Regler sitzt — ohne den
// Reglerwert selbst, denn der steht im DOM und nicht im Text.
async function widgetText(page, id) {
  return page.evaluate((i) => {
    const e = document.getElementById(i);
    const w = e.closest(".widget") || e.closest("section") || document.body;
    const svg = [...w.querySelectorAll("svg text")].map((t) => t.textContent).join(" ");
    return (w.innerText + " " + svg).replace(/\s+/g, " ").trim();
  }, id);
}

async function text(page, sel) {
  return (await page.locator(sel).innerText()).replace(/\s+/g, " ").trim();
}

module.exports = { starteBrowser, neueSeite, oeffne, reglerListe, setzeRegler, widgetText, text, HOST, WURZEL };
