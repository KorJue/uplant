// Prüft die Hinweise für Lehrkräfte (assets/lehrkraft.js): Sie erscheinen nur nach Eingabe des
// Codes für alle Bereiche (Menüpunkt-Zahl 15) und stehen nie im Quelltext einer Seite.
//
//   * Quelltext: Keine Seite enthält Hinweise für Lehrkräfte selbst (außerhalb von Skripten und
//     Kommentaren), sondern höchstens einen leeren, versteckten Platzhalter mit data-lehrkraft;
//     der Platzhalter nennt eine vorhandene Datei, die Seite bindet lehrkraft.js ein, die Datei ist
//     ein Bruchstück (keine eigene Seite) und ihre Verweise lösen auf;
//   * ohne Code und mit einem anderen Code: Platzhalter leer und versteckt, die Datei wird nicht
//     einmal angefragt;
//   * mit Code 15 (hier unabhängig nachgerechnet und über das Formular der Startseite eingegeben):
//     Hinweise sichtbar, mit Marke, hell und dunkel lesbar; „Freischaltung zurücksetzen“ nimmt sie
//     wieder weg; lässt sich die Datei nicht laden, steht dort eine Meldung statt einer Lücke.

"use strict";

const fs = require("fs");
const path = require("path");
const { neuerBericht } = require("./lib/pruefen");
const { starteBrowser, neueSeite, oeffne } = require("./lib/seite");
const { pruefeNotation } = require("./lib/notation");
const { pruefeKontrast } = require("./lib/kontrast");

const bericht = neuerBericht();
const { pruefe } = bericht;
const WURZEL = path.resolve(__dirname, "..");

// Seiten, deren Konzept Lösungswege nennt — sie MÜSSEN einen Platzhalter haben. Weitere Seiten mit
// Platzhalter findet die Prüfung selbst.
const PFLICHT = [
  "/mathematik/klasse-8/geometrie/raetsel.html",
  "/mathematik/mss11/01-analysis/06-anwendungsaufgaben/index.html",
];
// Woran man Hinweise für Lehrkräfte im Seitentext erkennt.
const VERRAETERISCH = /Lehrkr|Distraktor|class="[^"]*konzept/i;

function alleHtml(verzeichnis = WURZEL, gesammelt = []) {
  for (const e of fs.readdirSync(verzeichnis, { withFileTypes: true })) {
    if (e.name.startsWith(".") || e.name === "node_modules" || e.name === "tests") continue;
    const voll = path.join(verzeichnis, e.name);
    if (e.isDirectory()) alleHtml(voll, gesammelt);
    else if (e.name.endsWith(".html")) gesammelt.push(voll);
  }
  return gesammelt;
}
const webpfad = (datei) => "/" + path.relative(WURZEL, datei).split(path.sep).join("/");
// Was im Quelltext stehen darf: Skripte, Kommentare und der Name des Platzhalters selbst.
const ohneErlaubtes = (s) => s.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<!--[\s\S]*?-->/g, " ").replace(/\sdata-lehrkraft="[^"]*"/g, " ");

// Der Code wird hier unabhängig von der Startseite berechnet: (Jahr + Menüpunkt-Zahl) · Monat,
// davon die letzten vier Ziffern.
function code(nummer, datum = new Date()) {
  return String(((datum.getFullYear() + nummer) * (datum.getMonth() + 1)) % 10000).padStart(4, "0");
}

(async () => {
  // ---- Quelltext ----
  const dateien = alleHtml();
  const plaetze = [];          // { seite, datei }
  for (const d of dateien) {
    const roh = fs.readFileSync(d, "utf-8");
    for (const m of roh.matchAll(/<(\w+)([^>]*)\sdata-lehrkraft="([^"]+)"([^>]*)>([\s\S]*?)<\/\1>/g)) {
      const attribute = m[2] + m[4];
      pruefe(/\shidden\b/.test(" " + attribute), `${webpfad(d)}: Platzhalter für ${m[3]} ohne hidden`);
      pruefe(m[5].trim() === "", `${webpfad(d)}: Platzhalter für ${m[3]} ist nicht leer`);
      plaetze.push({ seite: d, datei: path.join(path.dirname(d), m[3]), name: m[3] });
    }
  }
  const fragmente = new Set(plaetze.map((p) => p.datei));
  for (const p of PFLICHT) pruefe(plaetze.some((x) => webpfad(x.seite) === p), `${p}: kein Platzhalter für die Hinweise für Lehrkräfte`);

  for (const d of dateien) {
    if (fragmente.has(d)) continue;
    const text = ohneErlaubtes(fs.readFileSync(d, "utf-8"));
    const treffer = text.match(VERRAETERISCH);
    pruefe(!treffer, `${webpfad(d)}: Hinweis für Lehrkräfte im Quelltext der Seite („${treffer && treffer[0]}“)`);
  }

  for (const p of plaetze) {
    const seite = fs.readFileSync(p.seite, "utf-8");
    pruefe(/<script src="(\.\.\/)*assets\/lehrkraft\.js"><\/script>/.test(seite), `${webpfad(p.seite)}: bindet assets/lehrkraft.js nicht ein`);
    pruefe(fs.existsSync(p.datei), `${webpfad(p.seite)}: Datei ${p.name} fehlt`);
    if (!fs.existsSync(p.datei)) continue;
    const inhalt = fs.readFileSync(p.datei, "utf-8");
    pruefe(!/<!doctype|<html|<body/i.test(inhalt), `${webpfad(p.datei)}: ist eine ganze Seite statt eines Bruchstücks`);
    pruefe(/Lehrkr/.test(inhalt) && /class="lehrkraft-marke"/.test(inhalt), `${webpfad(p.datei)}: ohne Überschrift „… für Lehrkräfte“ und Marke`);
    // Verweise im Bruchstück gelten relativ zur Seite, in die es geladen wird.
    for (const m of inhalt.matchAll(/href="([^"]+)"/g)) {
      if (/^(https?:|mailto:)/.test(m[1])) continue;
      const [roh, anker] = m[1].split("#");
      const ziel = roh ? path.join(path.dirname(p.seite), roh) : p.seite;
      pruefe(fs.existsSync(ziel), `${webpfad(p.datei)}: Verweis ins Leere → ${m[1]}`);
      if (anker && fs.existsSync(ziel)) pruefe(fs.readFileSync(ziel, "utf-8").includes(`id="${anker}"`), `${webpfad(p.datei)}: Sprungmarke fehlt → ${m[1]}`);
    }
  }

  // ---- Im Browser ----
  const browser = await starteBrowser();

  async function zustand(page) {
    return page.evaluate(() => [...document.querySelectorAll("[data-lehrkraft]")].map((e) => ({
      hidden: e.hidden, sichtbar: e.offsetParent !== null, html: e.innerHTML.trim(), geladen: e.getAttribute("data-geladen"),
    })));
  }
  async function gibCodeEin(page, wert) {
    await oeffne(page, "/index.html");
    await page.fill("#access-code", wert);
    await page.click('#access-form button[type="submit"]');
    return page.evaluate(() => ({
      liste: JSON.parse(localStorage.getItem("uplant-access") || "[]"),
      status: document.getElementById("unlock-status").textContent,
      fehler: !document.getElementById("access-error").hidden,
    }));
  }
  const seiten = [...new Set(plaetze.map((p) => webpfad(p.seite)))];

  for (const dunkel of [false, true]) {
    const modus = dunkel ? "dunkel" : "hell";
    const page = await neueSeite(browser, { dunkel });
    const anfragen = [];
    page.on("request", (r) => anfragen.push(r.url()));

    // Ohne Code und mit dem Mathematik-Code: nichts zu sehen, nichts angefragt.
    for (const [name, wert] of [["ohne Code", null], ["Mathematik-Code", code(1)]]) {
      if (wert) {
        const r = await gibCodeEin(page, wert);
        pruefe(!r.fehler && r.liste.includes("mss11") && r.liste.includes("klasse-8"), `${name} (${modus}): schaltet Mathematik nicht frei`);
        pruefe(!r.liste.includes("lehrkraft") && !/Lehrkr/.test(r.status), `${name} (${modus}): schaltet die Hinweise für Lehrkräfte frei`);
      }
      for (const s of seiten) {
        anfragen.length = 0;
        await oeffne(page, s);
        for (const z of await zustand(page)) pruefe(z.hidden && !z.sichtbar && z.html === "", `${s} (${name}, ${modus}): Hinweise für Lehrkräfte zu sehen`);
        const fremd = anfragen.filter((u) => plaetze.some((p) => u.split("?")[0].endsWith(webpfad(p.datei))));
        pruefe(fremd.length === 0, `${s} (${name}, ${modus}): ${fremd.join(", ")} wird ohne Code 15 angefragt`);
        pruefe(!/Lehrkr/.test(await page.evaluate(() => document.body.innerText)), `${s} (${name}, ${modus}): „Lehrkräfte“ im Seitentext`);
        for (const st of page.stoerungen) pruefe(false, `${s} (${name}, ${modus}): ${st}`);
      }
    }

    // Code 15: Hinweise sichtbar.
    const r = await gibCodeEin(page, code(15));
    pruefe(!r.fehler && r.liste.includes("lehrkraft"), `Code 15 (${modus}): schaltet die Hinweise für Lehrkräfte nicht frei`);
    pruefe(r.liste.includes("physik") && r.liste.includes("mss13"), `Code 15 (${modus}): schaltet nicht mehr alle Bereiche frei`);
    pruefe(/Hinweise für Lehrkräfte/.test(r.status), `Code 15 (${modus}): Status nennt die Hinweise für Lehrkräfte nicht („${r.status}“)`);
    for (const s of seiten) {
      await oeffne(page, s);
      await page.waitForSelector("[data-lehrkraft][data-geladen]", { state: "attached", timeout: 5000 }).catch(() => {});
      const z = await zustand(page);
      for (const e of z) pruefe(!e.hidden && e.sichtbar && e.geladen === "ja" && /Konzept für Lehrkräfte/.test(e.html), `${s} (Code 15, ${modus}): Hinweise nicht geladen (${e.geladen})`);
      await page.evaluate(() => document.querySelectorAll("[data-lehrkraft] details").forEach((d) => { d.open = true; }));
      pruefe(/nur mit dem Code für alle Bereiche sichtbar/.test(await page.evaluate(() => document.body.innerText)), `${s} (Code 15, ${modus}): Marke fehlt`);
      await pruefeNotation(page, bericht, `${s} (Code 15, ${modus})`);
      if (dunkel) await pruefeKontrast(page, bericht, `${s} (Code 15, dunkel)`);
      for (const st of page.stoerungen) pruefe(false, `${s} (Code 15, ${modus}): ${st}`);
    }

    // Lässt sich die Datei nicht laden, steht eine Meldung da — keine stumme Lücke.
    if (!dunkel) {
      const s = seiten[0];
      await page.route(/-?lehrkraefte\.html/, (route) => route.fulfill({ status: 404, body: "" }));
      await oeffne(page, s);
      await page.waitForSelector("[data-lehrkraft][data-geladen]", { state: "attached", timeout: 5000 }).catch(() => {});
      const z = await zustand(page);
      pruefe(z.every((e) => e.geladen === "fehler" && !e.hidden && /nicht laden/.test(e.html)), `${s}: Ladefehler ohne Meldung`);
      await page.unroute(/-?lehrkraefte\.html/);
    }

    // „Freischaltung zurücksetzen“ nimmt die Hinweise wieder weg.
    await oeffne(page, "/index.html");
    await page.click("#lock-again");
    for (const s of seiten) {
      await oeffne(page, s);
      for (const z of await zustand(page)) pruefe(z.hidden && z.html === "", `${s} (zurückgesetzt, ${modus}): Hinweise noch zu sehen`);
    }
    await page.close();
  }

  await browser.close();
  bericht.abschluss();
})().catch((e) => { console.error(e); process.exit(1); });
