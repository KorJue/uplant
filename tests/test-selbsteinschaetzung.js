// Prüft die Selbsteinschätzung der Grundwissen- und Klasse-8-Seiten (assets/selbsteinschaetzung.js).
//
//   * Quelltext: Jede Grundwissen-Seite und jede Klasse-8-Lernseite mit Übungsaufgaben hat den
//     Abschnitt, und zwar unmittelbar vor der Vernetzung. Er nennt genau so viele Ich-kann-Sätze,
//     wie „Worum geht es hier?“ Ziele verspricht — Ziel und Selbstkontrolle passen zueinander —,
//     jeder Satz verweist auf einen vorhandenen Abschnitt, der vor der Selbsteinschätzung steht;
//   * im Browser, hell und dunkel: drei Knöpfe je Satz, keiner gedrückt; 🤔 führt mit einem
//     Verweis (beschriftet mit der Überschrift) zurück in den Abschnitt und empfiehlt die leichten
//     Stufen, 😐 die mittleren, lauter 😀 die schweren; die Auswahl übersteht das Neuladen und gilt
//     nur für diese eine Seite; auf dem Telefon ragt nichts seitlich heraus.

"use strict";

const fs = require("fs");
const path = require("path");
const { neuerBericht } = require("./lib/pruefen");
const { starteBrowser, neueSeite, oeffne } = require("./lib/seite");
const { alleThemen } = require("./lib/themen");
const { pruefeNotation } = require("./lib/notation");
const { pruefeKontrast } = require("./lib/kontrast");

const bericht = neuerBericht();
const { pruefe } = bericht;
const WURZEL = path.resolve(__dirname, "..");

// Die Klasse-8-Lernpfade. Rätsel und Faktencheck haben ihre eigene Selbsteinschätzung je Fall,
// die MSS-Seiten bauen sie im eigenen Modul.
const KLASSE_8 = ["flaecheninhalte", "grundkonstruktionen", "satz-des-thales"].map((n) => `/mathematik/klasse-8/geometrie/${n}.html`);
const SEITEN = [...alleThemen().map((t) => t.pfad), ...KLASSE_8];
// So viele waren es, als die Selbsteinschätzung dazukam (34 Grundwissen-Themen und 3 Klasse-8-Seiten).
const MINDESTENS = 37;

const lies = (p) => fs.readFileSync(path.join(WURZEL, p.slice(1)), "utf-8");
const ohneTags = (s) => s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

(async () => {
  pruefe(SEITEN.length >= MINDESTENS, `nur ${SEITEN.length} Seiten — erwartet mindestens ${MINDESTENS}`);

  // ---- Quelltext ----
  const erwartet = new Map();   // Seite → [{ abschnitt, text }]
  for (const p of SEITEN) {
    const html = lies(p);
    const m = html.match(/<section class="card" id="sec-selbsteinschaetzung">([\s\S]*?)<\/section>/);
    pruefe(!!m, `${p}: kein Abschnitt „Selbsteinschätzung“`);
    if (!m) continue;
    const punkte = [...m[1].matchAll(/<li data-abschnitt="([^"]+)">([\s\S]*?)<\/li>/g)].map((x) => ({ abschnitt: x[1], text: ohneTags(x[2]) }));
    erwartet.set(p, punkte);

    const ziele = (html.match(/<ul class="lern-intro-list">([\s\S]*?)<\/ul>/) || ["", ""])[1].match(/<li/g) || [];
    pruefe(punkte.length > 0 && punkte.length === ziele.length, `${p}: ${punkte.length} Ich-kann-Sätze, aber ${ziele.length} Ziele in „Worum geht es hier?“`);
    const ids = [...html.matchAll(/<section class="card" id="([^"]+)"/g)].map((x) => x[1]);
    const hier = ids.indexOf("sec-selbsteinschaetzung");
    pruefe(ids[hier + 1] === "sec-vernetzung", `${p}: Selbsteinschätzung steht nicht direkt vor der Vernetzung (${ids.join(", ")})`);
    for (const { abschnitt, text } of punkte) {
      const wo = ids.indexOf(abschnitt);
      pruefe(wo >= 0 && wo < hier, `${p}: „${text}“ verweist auf ${abschnitt} — gibt es nicht oder steht nicht davor`);
      pruefe(/^Ich (kann|erkenne|weiß)\b/.test(text) && /[.!?]$/.test(text), `${p}: „${text}“ ist kein vollständiger Ich-kann-Satz`);
    }
    pruefe(new Set(punkte.map((x) => x.text)).size === punkte.length, `${p}: ein Ich-kann-Satz steht doppelt`);
    const tiefe = p.split("/").length - 2;
    pruefe(html.includes(`<script src="${"../".repeat(tiefe)}assets/selbsteinschaetzung.js"></script>`), `${p}: bindet assets/selbsteinschaetzung.js nicht ein`);
  }

  // ---- Im Browser ----
  const browser = await starteBrowser();

  async function zustand(page) {
    return page.evaluate(() => {
      const s = document.getElementById("sec-selbsteinschaetzung");
      const aus = s.querySelector(".se-auswertung");
      return {
        bereit: s.classList.contains("se-bereit"),
        zeilen: [...s.querySelectorAll(".se-zeile")].map((z) => ({
          text: z.querySelector(".se-text").textContent.trim(),
          knoepfe: [...z.querySelectorAll("button")].map((b) => ({ zeichen: b.textContent, gedrueckt: b.getAttribute("aria-pressed") })),
        })),
        auswertung: aus.innerText.replace(/\s+/g, " ").trim(),
        verweise: [...aus.querySelectorAll("a")].map((a) => ({ href: a.getAttribute("href"), text: a.textContent.trim() })),
      };
    });
  }
  const klicke = (page, zeile, zeichen) => page.evaluate(([i, z]) => {
    const b = [...document.querySelectorAll("#sec-selbsteinschaetzung .se-zeile")][i].querySelectorAll("button");
    [...b].find((k) => k.textContent === z).click();
  }, [zeile, zeichen]);
  const ueberschrift = (page, id) => page.evaluate((i) => document.querySelector(`#${i} h2`).textContent.trim(), id);

  for (const dunkel of [false, true]) {
    const modus = dunkel ? "dunkel" : "hell";
    const page = await neueSeite(browser, { dunkel });
    for (const p of SEITEN) {
      const punkte = erwartet.get(p);
      if (!punkte) continue;
      await oeffne(page, p);
      await page.evaluate(() => { for (const k of Object.keys(localStorage)) if (k.startsWith("uplant-selbsteinschaetzung:")) localStorage.removeItem(k); });
      await oeffne(page, p);
      let z = await zustand(page);
      pruefe(z.bereit && z.zeilen.length === punkte.length, `${p} (${modus}): ${z.zeilen.length} Zeilen statt ${punkte.length}`);
      pruefe(z.zeilen.every((r, i) => r.text === punkte[i].text), `${p} (${modus}): Ich-kann-Sätze verändert`);
      pruefe(z.zeilen.every((r) => r.knoepfe.map((k) => k.zeichen).join("") === "😀😐🤔" && r.knoepfe.every((k) => k.gedrueckt === "false")),
        `${p} (${modus}): Knöpfe fehlen oder sind schon gedrückt`);
      pruefe(z.auswertung === "Noch nichts angekreuzt.", `${p} (${modus}): Anfangsauswertung „${z.auswertung}“`);

      // Der letzte Punkt ist unsicher: Verweis auf genau seinen Abschnitt, leichte Stufen.
      const letzter = punkte.length - 1;
      await klicke(page, letzter, "🤔");
      z = await zustand(page);
      const soll = punkte[letzter].abschnitt;
      const h2 = await ueberschrift(page, soll);
      pruefe(z.zeilen[letzter].knoepfe.map((k) => k.gedrueckt).join() === "false,false,true", `${p} (${modus}): 🤔 nicht als gedrückt markiert`);
      pruefe(z.verweise.some((v) => v.href === `#${soll}` && v.text === h2), `${p} (${modus}): 🤔 verweist nicht auf „${h2}“ (${JSON.stringify(z.verweise)})`);
      pruefe(z.verweise.some((v) => v.href === "#sec-uebungen"), `${p} (${modus}): kein Verweis auf die Übungsaufgaben`);
      pruefe(/^Wiederhole zuerst: .*„einfach“ und „mittel“\.$/.test(z.auswertung), `${p} (${modus}): Auswertung bei 🤔 „${z.auswertung}“`);

      // Übersteht das Neuladen.
      await oeffne(page, p);
      z = await zustand(page);
      pruefe(z.zeilen[letzter].knoepfe[2].gedrueckt === "true" && /^Wiederhole zuerst/.test(z.auswertung), `${p} (${modus}): Auswahl nach dem Neuladen verloren`);

      // Alles sicher → schwere Stufen; dann ein Punkt teilweise → mittlere Stufen mit Verweis.
      for (let i = 0; i < punkte.length; i++) await klicke(page, i, "😀");
      z = await zustand(page);
      pruefe(z.auswertung === `Alle ${punkte.length} Punkte sicher — probier dich an den Übungsaufgaben auf den Stufen „schwierig“ und „komplex“.`,
        `${p} (${modus}): Auswertung bei lauter 😀 „${z.auswertung}“`);
      await klicke(page, 0, "😐");
      z = await zustand(page);
      const h2erst = await ueberschrift(page, punkte[0].abschnitt);
      pruefe(/^Sieh dir noch einmal an: .*„mittel“ und „schwierig“\.$/.test(z.auswertung) && z.verweise.some((v) => v.href === `#${punkte[0].abschnitt}` && v.text === h2erst),
        `${p} (${modus}): Auswertung bei 😐 „${z.auswertung}“`);

      await pruefeNotation(page, bericht, `${p} (Selbsteinschätzung, ${modus})`);
      if (dunkel) await pruefeKontrast(page, bericht, `${p} (Selbsteinschätzung, dunkel)`);
      for (const s of page.stoerungen) pruefe(false, `${p} (${modus}): ${s}`);
    }

    // Jede Seite hat ihren eigenen Stand. Aussagekräftig ist das nur an zwei Seiten, deren Satz an
    // derselben Stelle auf einen gleichnamigen Abschnitt verweist (Pythagoras und Thales: sec-satz) —
    // bei verschiedenen Abschnitten fiele ein gemeinsamer Speicher gar nicht auf.
    const paar = [];
    for (const [a, pa] of erwartet) for (const [b, pb] of erwartet) {
      if (a < b && !paar.length) {
        const i = pa.findIndex((x, k) => pb[k] && pb[k].abschnitt === x.abschnitt);
        if (i >= 0) paar.push(a, b, i);
      }
    }
    pruefe(paar.length === 3, `(${modus}): keine zwei Seiten mit gleichnamigem Abschnitt an derselben Stelle — die Trennung bliebe ungeprüft`);
    if (paar.length === 3) {
      const [a, b, i] = paar;
      await oeffne(page, a);
      await page.evaluate(() => { for (const k of Object.keys(localStorage)) if (k.startsWith("uplant-selbsteinschaetzung:")) localStorage.removeItem(k); });
      await oeffne(page, a);
      await klicke(page, i, "🤔");
      await oeffne(page, b);
      const z = await zustand(page);
      pruefe(z.auswertung === "Noch nichts angekreuzt." && z.zeilen[i].knoepfe.every((k) => k.gedrueckt === "false"),
        `${b} (${modus}): übernimmt die Auswahl von ${a}`);
    }
    await page.close();
  }

  // Auf dem Telefon bricht jede Zeile um, statt die Seite seitlich zu verschieben.
  const telefon = await neueSeite(browser, { breite: 360, hoehe: 740 });
  for (const p of SEITEN) {
    await oeffne(telefon, p);
    const zu_breit = await telefon.evaluate(() => {
      const s = document.getElementById("sec-selbsteinschaetzung");
      return [...s.querySelectorAll(".se-zeile, .se-knoepfe")].some((e) => e.getBoundingClientRect().right > s.getBoundingClientRect().right + 1);
    });
    pruefe(!zu_breit, `${p} (Telefon): Selbsteinschätzung ragt seitlich heraus`);
  }
  await telefon.close();

  await browser.close();
  bericht.abschluss();
})().catch((e) => { console.error(e); process.exit(1); });
