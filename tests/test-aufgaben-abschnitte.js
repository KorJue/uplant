// Prüft auf jeder Lernseite mit Übungsaufgaben die Zuordnung Aufgabe → Abschnitt
// (mathematik/aufgaben.js, Eigenschaft `abschnitt`) und alles, was daraus entsteht:
//
//   * Jede Aufgabe nennt einen oder mehrere Abschnitte; jeder davon steht auf der Seite VOR den
//     Übungsaufgaben und ist ein Erarbeitungsabschnitt (nicht Vernetzung, Formelsammlung …).
//   * Jede Aufgabe zeigt ihre Abschnitte als Zeile mit Verweisen dorthin.
//   * Die Themenleiste hat „Alle Themen“ und je Abschnitt mit Aufgaben einen Knopf, in der
//     Reihenfolge der Seite. Wählt man ein Thema, stehen in den Reitern zusammen genau die Aufgaben,
//     deren LETZTER Abschnitt dieses Thema ist — und kein Reiter zeigt eine fremde.
//   * Am Ende genau dieser Abschnitte steht ein Sprung „Gleich üben“; ein Klick wählt das Thema und
//     führt zu den Übungsaufgaben. Kein Sprung führt zu einer Aufgabe, die einen späteren Abschnitt
//     braucht (kein Vorgriff).
//   * Beim Prüfen meldet eine Aufgabe ihr Ergebnis als Ereignis „uplant:aufgabe“ mit ihren
//     Abschnitten — die Selbsteinschätzung zählt es. Ein Prüfen ohne Eingabe meldet nichts.
//   * Ohne gewähltes Thema ist alles wie vorher: dieselben Reiter, dieselben Aufgaben.
//
// Die Seiten werden aus dem Dateisystem gefunden (jede HTML-Datei mit #exercises-mount), damit eine
// neue Seite automatisch mitgeprüft wird.

"use strict";

const fs = require("fs");
const path = require("path");
const { neuerBericht } = require("./lib/pruefen");
const { starteBrowser, neueSeite, oeffne } = require("./lib/seite");
const { pruefeNotation } = require("./lib/notation");

const bericht = neuerBericht();
const { pruefe } = bericht;
const WURZEL = path.resolve(__dirname, "..");
// So viele Seiten mit Übungsaufgaben gab es, als die Zuordnung dazukam.
const MINDESTENS = 51;
const KEIN_THEMA = ["sec-vernetzung", "sec-formelsammlung", "sec-uebungen", "sec-selbsteinschaetzung"];

function seiten(dir = path.join(WURZEL, "mathematik"), out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const voll = path.join(dir, e.name);
    if (e.isDirectory()) seiten(voll, out);
    else if (e.name.endsWith(".html") && fs.readFileSync(voll, "utf-8").includes('id="exercises-mount"')) out.push("/" + path.relative(WURZEL, voll));
  }
  return out.sort();
}

// Für Gegenproben: UPLANT_SEITEN=kreis,03-terme prüft nur Seiten, deren Pfad einen der Teile enthält.
const FILTER = (process.env.UPLANT_SEITEN || "").split(",").filter(Boolean);

(async () => {
  const gefunden = seiten();
  pruefe(gefunden.length >= MINDESTENS, `nur ${gefunden.length} Seiten mit Übungsaufgaben — erwartet mindestens ${MINDESTENS}`);
  const alle = FILTER.length ? gefunden.filter((p) => FILTER.some((f) => p.includes(f))) : gefunden;
  const browser = await starteBrowser();
  let aufgabenGesamt = 0;

  for (const dunkel of [false, true]) {
    const page = await neueSeite(browser, { dunkel });
    for (const p of alle) {
      await oeffne(page, p);
      const wo = `${p} (${dunkel ? "dunkel" : "hell"})`;
      if (dunkel) {
        // Im Dunkelmodus nur, dass alles erscheint und die Schreibweise stimmt.
        const n = await page.locator("#exercises-mount .aufgaben-themen button").count();
        pruefe(n >= 2, `${wo}: keine Themenleiste`);
        await pruefeNotation(page, bericht, wo);
        for (const s of page.stoerungen) pruefe(false, `${wo}: ${s}`);
        continue;
      }

      // ---- Bestand: alle Aufgaben über alle Reiter, ohne Thema ----
      const bestand = await page.evaluate((keinThema) => {
        const folge = [...document.querySelectorAll("main section[id]")].map((s) => s.id);
        const ue = folge.indexOf("sec-uebungen");
        const tabs = [...document.querySelectorAll("#exercises-mount .schwierigkeit-tabs button")];
        const aufgaben = [];
        tabs.forEach((t, i) => {
          t.click();
          for (const box of document.querySelectorAll("#exercises-mount .schwierigkeit-tab-panel .aufgabe-box")) {
            const zeile = box.querySelector(".aufgabe-thema");
            const ab = zeile ? [...zeile.querySelectorAll("a")].map((a) => a.getAttribute("href").slice(1)) : [];
            aufgaben.push({ tab: i, titel: box.querySelector("h3").childNodes[0].textContent.trim(), ab });
          }
        });
        tabs[0].click();
        const themen = [...document.querySelectorAll("#exercises-mount .aufgaben-themen button")].map((b) => ({ id: b.dataset.thema || null, text: b.textContent.trim() }));
        const spruenge = [...document.querySelectorAll(".uebung-sprung a")].map((a) => ({
          abschnitt: a.closest("section[id]").id, thema: a.dataset.thema, href: a.getAttribute("href"), text: a.textContent.trim(),
          zuletzt: a.closest("section[id]").lastElementChild === a.closest(".uebung-sprung"),
        }));
        return { folge, ue, tabs: tabs.length, aufgaben, themen, spruenge, keinThema };
      }, KEIN_THEMA);
      aufgabenGesamt += bestand.aufgaben.length;
      const pos = (id) => bestand.folge.indexOf(id);
      const thema = (a) => a.ab.reduce((x, y) => (x === null || pos(y) > pos(x) ? y : x), null);

      for (const a of bestand.aufgaben) {
        pruefe(a.ab.length >= 1, `${wo}: „${a.titel}“ nennt keinen Abschnitt`);
        for (const id of a.ab) {
          pruefe(pos(id) >= 0 && pos(id) < bestand.ue && !KEIN_THEMA.includes(id), `${wo}: „${a.titel}“ verweist auf ${id} — kein Erarbeitungsabschnitt vor den Übungsaufgaben`);
        }
        pruefe(new Set(a.ab).size === a.ab.length, `${wo}: „${a.titel}“ nennt einen Abschnitt doppelt`);
      }

      // ---- Themenleiste ----
      const sollThemen = bestand.folge.filter((id) => bestand.aufgaben.some((a) => thema(a) === id));
      const istThemen = bestand.themen.filter((t) => t.id).map((t) => t.id);
      if (sollThemen.length > 1) {
        pruefe(bestand.themen[0] && bestand.themen[0].id === null && /Alle Themen/.test(bestand.themen[0].text), `${wo}: die Themenleiste beginnt nicht mit „Alle Themen“`);
        pruefe(JSON.stringify(istThemen) === JSON.stringify(sollThemen), `${wo}: Themen ${istThemen.join(", ")} statt ${sollThemen.join(", ")}`);
      }
      for (const t of bestand.themen.filter((x) => x.id)) {
        const h2 = await page.evaluate((id) => document.querySelector(`#${id} h2`).textContent.replace(/\s+/g, " ").trim(), t.id);
        pruefe(h2.startsWith(t.text.replace(/\s+/g, " ")), `${wo}: der Themenknopf „${t.text}“ passt nicht zur Überschrift „${h2}“`);
      }

      // Je Thema: in allen Reitern zusammen genau die Aufgaben mit diesem letzten Abschnitt.
      for (const id of istThemen) {
        const r = await page.evaluate((thema) => {
          document.querySelector(`#exercises-mount .aufgaben-themen button[data-thema="${thema}"]`).click();
          const tabs = [...document.querySelectorAll("#exercises-mount .schwierigkeit-tabs button")];
          const titel = [], leerAn = [];
          tabs.forEach((t, i) => {
            if (t.disabled) { leerAn.push(i); return; }
            t.click();
            for (const b of document.querySelectorAll("#exercises-mount .schwierigkeit-tab-panel .aufgabe-box")) titel.push(b.querySelector("h3").childNodes[0].textContent.trim());
          });
          const anzahl = tabs.map((t) => t.querySelector(".anzahl").textContent);
          return { titel, leerAn, anzahl };
        }, id);
        const soll = bestand.aufgaben.filter((a) => thema(a) === id).map((a) => a.titel).sort();
        pruefe(JSON.stringify(r.titel.slice().sort()) === JSON.stringify(soll), `${wo}: Thema ${id} zeigt ${r.titel.length} Aufgaben (${r.titel.join("; ")}) statt ${soll.length} (${soll.join("; ")})`);
        for (let i = 0; i < bestand.tabs; i++) {
          const n = bestand.aufgaben.filter((a) => a.tab === i && thema(a) === id).length;
          pruefe(r.anzahl[i] === String(n) && (n === 0) === r.leerAn.includes(i), `${wo}: Thema ${id}, Reiter ${i + 1}: Anzeige „${r.anzahl[i]}“, ${r.leerAn.includes(i) ? "gesperrt" : "offen"}, aber ${n} Aufgaben`);
        }
      }
      // Zurück auf alle Themen: wieder alles wie vorher.
      const zurueck = await page.evaluate(() => {
        document.querySelector("#exercises-mount .aufgaben-themen button:not([data-thema])").click();
        const tabs = [...document.querySelectorAll("#exercises-mount .schwierigkeit-tabs button")];
        let n = 0;
        tabs.forEach((t) => { t.click(); n += document.querySelectorAll("#exercises-mount .schwierigkeit-tab-panel .aufgabe-box").length; });
        tabs[0].click();
        return { n, gesperrt: tabs.filter((t) => t.disabled).length, anzahl: tabs.map((t) => t.querySelector(".anzahl").textContent).join("") };
      });
      pruefe(zurueck.n === bestand.aufgaben.length && zurueck.gesperrt === 0 && zurueck.anzahl === "", `${wo}: nach „Alle Themen“ nicht wieder alle Aufgaben — ${JSON.stringify(zurueck)}`);

      // ---- Sprünge ----
      const sprungAn = bestand.spruenge.map((s) => s.abschnitt);
      pruefe(JSON.stringify(sprungAn) === JSON.stringify(sollThemen), `${wo}: Sprünge in ${sprungAn.join(", ")} statt ${sollThemen.join(", ")}`);
      for (const s of bestand.spruenge) {
        const n = bestand.aufgaben.filter((a) => thema(a) === s.abschnitt).length;
        pruefe(s.thema === s.abschnitt && s.href === "#sec-uebungen" && s.zuletzt, `${wo}: der Sprung in ${s.abschnitt} ist falsch gebaut — ${JSON.stringify(s)}`);
        pruefe(s.text.includes(n === 1 ? "eine Aufgabe" : `${n} Aufgaben`), `${wo}: der Sprung in ${s.abschnitt} nennt nicht ${n} Aufgaben — „${s.text}“`);
      }
      // Einen Sprung wirklich anklicken: Thema gewählt, Übungsaufgaben im Bild.
      if (bestand.spruenge.length) {
        const s = bestand.spruenge[Math.floor(bestand.spruenge.length / 2)];
        await page.locator(`#${s.abschnitt} .uebung-sprung a`).scrollIntoViewIfNeeded();
        await page.locator(`#${s.abschnitt} .uebung-sprung a`).click();
        await page.waitForTimeout(150);
        const nach = await page.evaluate(() => {
          const b = document.querySelector("#exercises-mount .aufgaben-themen button.active");
          const r = document.getElementById("sec-uebungen").getBoundingClientRect();
          return { thema: b ? b.dataset.thema : null, sichtbar: r.top < window.innerHeight && r.bottom > 0, hash: location.hash };
        });
        pruefe(nach.thema === s.abschnitt && nach.sichtbar && nach.hash === "#sec-uebungen", `${wo}: der Sprung aus ${s.abschnitt} wählt nicht das Thema oder führt nicht zu den Übungsaufgaben — ${JSON.stringify(nach)}`);
        await page.evaluate(() => document.querySelector("#exercises-mount .aufgaben-themen button:not([data-thema])").click());
      }

      // ---- Ereignis beim Prüfen ----
      const ereignis = await page.evaluate(() => {
        const gemeldet = [];
        const lausche = (e) => gemeldet.push(e.detail);
        document.addEventListener("uplant:aufgabe", lausche);
        const box = document.querySelector("#exercises-mount .schwierigkeit-tab-panel .aufgabe-box");
        const pruefen = [...box.querySelectorAll("button")].find((b) => b.textContent.trim() === "Prüfen");
        const felder = [...box.querySelectorAll("input[type=text]")];
        felder.forEach((f) => { f.value = ""; });
        pruefen.click();                       // leer: zählt nicht
        const leer = gemeldet.length;
        felder.forEach((f) => { f.value = "987654321"; });
        pruefen.click();                       // sicher falsch
        document.removeEventListener("uplant:aufgabe", lausche);
        const ab = [...box.querySelectorAll(".aufgabe-thema a")].map((a) => a.getAttribute("href").slice(1));
        return { leer, gemeldet, ab, titel: box.querySelector("h3").childNodes[0].textContent.trim() };
      });
      pruefe(ereignis.leer === 0, `${wo}: ein Prüfen ohne Eingabe meldet ein Ergebnis`);
      const e = ereignis.gemeldet[ereignis.gemeldet.length - 1];
      pruefe(ereignis.gemeldet.length === 1 && e && e.titel === ereignis.titel && e.richtig === false
        && JSON.stringify(e.abschnitte) === JSON.stringify(ereignis.ab), `${wo}: das Ereignis „uplant:aufgabe“ fehlt oder stimmt nicht — ${JSON.stringify(ereignis)}`);

      for (const s of page.stoerungen) pruefe(false, `${wo}: ${s}`);
    }
    await page.close();
  }
  // Gezählt wird nur im hellen Durchgang.
  if (!FILTER.length) pruefe(aufgabenGesamt >= 568, `nur ${aufgabenGesamt} Aufgaben gefunden — erwartet mindestens 568`);
  await browser.close();
  bericht.abschluss();
})();
