// Prüft die Selbsteinschätzung aller Lernpfade mit Übungsaufgaben (assets/selbsteinschaetzung.js):
// Grundwissen, Klasse 8, MSS. Rätsel und Faktencheck haben ihre eigene je Fall.
//
//   * Quelltext: Jede dieser Seiten hat den Abschnitt, und zwar als LETZTEN, unmittelbar nach den
//     Übungsaufgaben — erst dann kann er auswerten, was dort geschehen ist. Auf den Grundwissen- und
//     Klasse-8-Seiten nennt er genau so viele Ich-kann-Sätze, wie „Worum geht es hier?“ Ziele
//     verspricht; die MSS-Seiten haben einen Satz je Abschnitt. Jeder Satz verweist auf einen
//     vorhandenen Abschnitt vor den Übungsaufgaben;
//   * im Browser, hell und dunkel: drei Knöpfe je Satz, keiner gedrückt; 🤔 führt mit einem
//     Verweis (beschriftet mit der Überschrift) zurück in den Abschnitt und empfiehlt die leichten
//     Stufen, 😐 die mittleren, lauter 😀 die schweren; die Auswahl übersteht das Neuladen und gilt
//     nur für diese eine Seite; auf dem Telefon ragt nichts seitlich heraus;
//   * Kontrollfragen und Aufgaben fließen ein: Eine beim ersten Versuch falsch beantwortete
//     Kontrollfrage steht beim Satz ihres Abschnitts und setzt ihn auf die Wiederholungsliste, auch
//     ohne Kreuz; wer dort trotzdem 😀 wählt, bekommt den Widerspruch genannt; ein Aufgabenergebnis
//     („uplant:aufgabe“) zählt bei allen Abschnitten der Aufgabe; zu wiederholenden Abschnitten folgen
//     Voraussetzungen aus früheren Themen; „Zurücksetzen“ löscht Einschätzung und Lernstand.

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

// Die Klasse-8-Lernpfade. Rätsel und Faktencheck haben ihre eigene Selbsteinschätzung je Fall.
const KLASSE_8 = ["flaecheninhalte", "grundkonstruktionen", "satz-des-thales", "kreis"].map((n) => `/mathematik/klasse-8/geometrie/${n}.html`);
// Die MSS-Lernpfade: jede Seite unter mss11/mss13 mit Übungsaufgaben. Ihre Sätze stehen je Abschnitt,
// nicht je Ziel aus „Worum geht es hier?“ — die Anzahl wird dort nicht verglichen.
const MSS = [];
for (const stufe of ["mss11", "mss13"]) {
  (function sammle(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const voll = path.join(dir, e.name);
      if (e.isDirectory()) sammle(voll);
      else if (e.name === "index.html" && fs.readFileSync(voll, "utf-8").includes('id="exercises-mount"')) MSS.push("/" + path.relative(WURZEL, voll));
    }
  })(path.join(WURZEL, "mathematik", stufe));
}
// Für Gegenproben: UPLANT_SEITEN=kreis,03-terme prüft nur Seiten, deren Pfad einen der Teile enthält.
const FILTER = (process.env.UPLANT_SEITEN || "").split(",").filter(Boolean);
const ALLE_SEITEN = [...alleThemen().map((t) => t.pfad), ...KLASSE_8, ...MSS.sort()];
const SEITEN = FILTER.length ? ALLE_SEITEN.filter((p) => FILTER.some((f) => p.includes(f))) : ALLE_SEITEN;
// So viele waren es, als die Selbsteinschätzung hinter die Übungsaufgaben rückte: 34 Grundwissen-
// Themen, 4 Klasse-8-Seiten und 13 MSS-Seiten.
const MINDESTENS = 51;

const lies = (p) => fs.readFileSync(path.join(WURZEL, p.slice(1)), "utf-8");
const ohneTags = (s) => s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

(async () => {
  pruefe(ALLE_SEITEN.length >= MINDESTENS, `nur ${ALLE_SEITEN.length} Seiten — erwartet mindestens ${MINDESTENS}`);

  // ---- Quelltext ----
  const erwartet = new Map();   // Seite → [{ abschnitt, text }]
  for (const p of SEITEN) {
    const html = lies(p);
    const m = html.match(/<section class="card" id="sec-selbsteinschaetzung">([\s\S]*?)<\/section>/);
    pruefe(!!m, `${p}: kein Abschnitt „Selbsteinschätzung“`);
    if (!m) continue;
    const punkte = [...m[1].matchAll(/<li data-abschnitt="([^"]+)">([\s\S]*?)<\/li>/g)].map((x) => ({ abschnitt: x[1], text: ohneTags(x[2]) }));
    erwartet.set(p, punkte);

    if (!MSS.includes(p)) {
      const ziele = (html.match(/<ul class="lern-intro-list">([\s\S]*?)<\/ul>/) || ["", ""])[1].match(/<li/g) || [];
      pruefe(punkte.length > 0 && punkte.length === ziele.length, `${p}: ${punkte.length} Ich-kann-Sätze, aber ${ziele.length} Ziele in „Worum geht es hier?“`);
    }
    pruefe(punkte.length > 0, `${p}: keine Ich-kann-Sätze`);
    const ids = [...html.matchAll(/<section class="card" id="([^"]+)"/g)].map((x) => x[1]);
    const hier = ids.indexOf("sec-selbsteinschaetzung");
    const ue = ids.indexOf("sec-uebungen");
    // Dazwischen darf nur noch ein Übungsabschnitt stehen (Thales: „Übungsaufgaben fürs Heft“).
    pruefe(ue >= 0 && hier === ids.length - 1 && ids.slice(ue + 1, hier).every((x) => x === "sec-heft"),
      `${p}: Selbsteinschätzung steht nicht als letzter Abschnitt nach den Übungsaufgaben (${ids.join(", ")})`);
    for (const { abschnitt, text } of punkte) {
      const wo = ids.indexOf(abschnitt);
      pruefe(wo >= 0 && wo < ue, `${p}: „${text}“ verweist auf ${abschnitt} — gibt es nicht oder steht nicht vor den Übungsaufgaben`);
      // Grundwissen und Klasse 8: „Ich kann/erkenne/weiß …“. Die MSS-Seiten schreiben je Abschnitt einen
      // Satz in der ersten Person („Ich integriere Produkte nicht Faktor für Faktor.“). Kein \b nach dem
      // Verb: Hinter „ß“ sieht JavaScript keine Wortgrenze.
      const muster = MSS.includes(p) ? /^(\(LK\) )?Ich [a-zäöüß]+[ ,]/ : /^Ich (kann|erkenne|weiß)[ ,]/;
      pruefe(muster.test(text) && /[.!?]$/.test(text), `${p}: „${text}“ ist kein vollständiger Ich-kann-Satz`);
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
        // Der erste Absatz ist die Empfehlung; danach können Widerspruch und Voraussetzungen folgen.
        erster: (aus.querySelector("p") || aus).innerText.replace(/\s+/g, " ").trim(),
        verweise: [...aus.querySelectorAll("a")].map((a) => ({ href: a.getAttribute("href"), text: a.textContent.trim() })),
      };
    });
  }
  const klicke = (page, zeile, zeichen) => page.evaluate(([i, z]) => {
    const b = [...document.querySelectorAll("#sec-selbsteinschaetzung .se-zeile")][i].querySelectorAll("button");
    [...b].find((k) => k.textContent === z).click();
  }, [zeile, zeichen]);
  // Die Überschrift ohne Kursmarke („GK + LK“) — so beschriftet die Selbsteinschätzung ihre Verweise.
  const ueberschrift = (page, id) => page.evaluate((i) => {
    const h = document.querySelector(`#${i} h2`).cloneNode(true);
    h.querySelectorAll(".kurs-marke").forEach((m) => m.remove());
    return h.textContent.trim();
  }, id);
  const leeren = (page) => page.evaluate(() => {
    for (const k of Object.keys(localStorage)) if (/^uplant-(selbsteinschaetzung|lernstand):/.test(k)) localStorage.removeItem(k);
  });
  const ANFANG = /^Noch nichts angekreuzt\./;

  for (const dunkel of [false, true]) {
    const modus = dunkel ? "dunkel" : "hell";
    const page = await neueSeite(browser, { dunkel });
    for (const p of SEITEN) {
      const punkte = erwartet.get(p);
      if (!punkte) continue;
      await oeffne(page, p);
      await leeren(page);
      await oeffne(page, p);
      let z = await zustand(page);
      pruefe(z.bereit && z.zeilen.length === punkte.length, `${p} (${modus}): ${z.zeilen.length} Zeilen statt ${punkte.length}`);
      pruefe(z.zeilen.every((r, i) => r.text === punkte[i].text), `${p} (${modus}): Ich-kann-Sätze verändert`);
      pruefe(z.zeilen.every((r) => r.knoepfe.map((k) => k.zeichen).join("") === "😀😐🤔" && r.knoepfe.every((k) => k.gedrueckt === "false")),
        `${p} (${modus}): Knöpfe fehlen oder sind schon gedrückt`);
      pruefe(ANFANG.test(z.auswertung), `${p} (${modus}): Anfangsauswertung „${z.auswertung}“`);

      // Der letzte Punkt ist unsicher: Verweis auf genau seinen Abschnitt, leichte Stufen.
      const letzter = punkte.length - 1;
      await klicke(page, letzter, "🤔");
      z = await zustand(page);
      const soll = punkte[letzter].abschnitt;
      const h2 = await ueberschrift(page, soll);
      pruefe(z.zeilen[letzter].knoepfe.map((k) => k.gedrueckt).join() === "false,false,true", `${p} (${modus}): 🤔 nicht als gedrückt markiert`);
      pruefe(z.verweise.some((v) => v.href === `#${soll}` && v.text === h2), `${p} (${modus}): 🤔 verweist nicht auf „${h2}“ (${JSON.stringify(z.verweise)})`);
      pruefe(z.verweise.some((v) => v.href === "#sec-uebungen"), `${p} (${modus}): kein Verweis auf die Übungsaufgaben`);
      pruefe(/^Wiederhole zuerst: .*„einfach“ und „mittel“\.$/.test(z.erster), `${p} (${modus}): Auswertung bei 🤔 „${z.auswertung}“`);

      // Übersteht das Neuladen.
      await oeffne(page, p);
      z = await zustand(page);
      pruefe(z.zeilen[letzter].knoepfe[2].gedrueckt === "true" && /^Wiederhole zuerst/.test(z.auswertung), `${p} (${modus}): Auswahl nach dem Neuladen verloren`);

      // Alles sicher → schwere Stufen; dann ein Punkt teilweise → mittlere Stufen mit Verweis.
      for (let i = 0; i < punkte.length; i++) await klicke(page, i, "😀");
      z = await zustand(page);
      pruefe(z.erster === `Alle ${punkte.length} Punkte sicher — probier dich an den Übungsaufgaben auf den Stufen „schwierig“ und „komplex“.`,
        `${p} (${modus}): Auswertung bei lauter 😀 „${z.auswertung}“`);
      await klicke(page, 0, "😐");
      z = await zustand(page);
      const h2erst = await ueberschrift(page, punkte[0].abschnitt);
      pruefe(/^Sieh dir noch einmal an: .*„mittel“ und „schwierig“\.$/.test(z.erster) && z.verweise.some((v) => v.href === `#${punkte[0].abschnitt}` && v.text === h2erst),
        `${p} (${modus}): Auswertung bei 😐 „${z.auswertung}“`);

      // ---- Kontrollfragen und Aufgaben fließen ein ----
      await leeren(page);
      await oeffne(page, p);
      // Der erste Satz, in dessen Abschnitt eine Pflicht-Kontrollfrage steht.
      const mitFrage = await page.evaluate((abschnitte) => abschnitte.findIndex((id) =>
        [...document.querySelectorAll(`#${id} .quiz[id]`)].some((q) => !q.closest(".optional-teil"))), punkte.map((x) => x.abschnitt));
      pruefe(mitFrage >= 0, `${p} (${modus}): kein Satz, zu dessen Abschnitt es eine Kontrollfrage gibt`);
      if (mitFrage >= 0) {
        const id = punkte[mitFrage].abschnitt;
        // Beim ERSTEN Versuch falsch antworten. Ist die erste Antwort zufällig die richtige, alles
        // zurücksetzen und mit der zweiten beginnen — genau eine ist richtig, die zweite also falsch.
        const klickeErste = (nr) => page.evaluate(([i, k]) => {
          const q = [...document.querySelectorAll(`#${i} .quiz[id]`)].find((x) => !x.closest(".optional-teil"));
          q.querySelectorAll(".quiz-opt")[k].click();
          return !!q.querySelector(".quiz-feedback.err");
        }, [id, nr]);
        let falsch = await klickeErste(0);
        if (!falsch) {
          await leeren(page);
          await oeffne(page, p);
          falsch = await klickeErste(1);
        }
        // Danach alle übrigen Antworten — eine davon ist richtig. Gezählt wird trotzdem der erste Versuch.
        await page.evaluate((i) => {
          const q = [...document.querySelectorAll(`#${i} .quiz[id]`)].find((x) => !x.closest(".optional-teil"));
          q.querySelectorAll(".quiz-opt").forEach((b) => b.click());
        }, id);
        z = await zustand(page);
        const beleg = await page.evaluate((i) => document.querySelectorAll("#sec-selbsteinschaetzung .se-beleg")[i].textContent, mitFrage);
        pruefe(falsch && /✗/.test(beleg), `${p} (${modus}): die falsch beantwortete Kontrollfrage steht nicht beim Satz — „${beleg}“`);
        pruefe(/^Wiederhole zuerst/.test(z.auswertung) && z.verweise.some((v) => v.href === `#${id}`), `${p} (${modus}): ohne Kreuz, aber mit falscher Kontrollfrage keine Wiederholung von ${id} — „${z.auswertung}“`);
        // Trotzdem 😀: Der Widerspruch wird genannt.
        await klicke(page, mitFrage, "😀");
        const widerspruch = await page.evaluate(() => {
          const w = document.querySelector("#sec-selbsteinschaetzung .se-widerspruch");
          return w ? [...w.querySelectorAll("a")].map((a) => a.getAttribute("href")) : null;
        });
        pruefe(!!widerspruch && widerspruch.includes(`#${id}`), `${p} (${modus}): 😀 trotz falscher Kontrollfrage — kein Hinweis auf den Widerspruch`);
        // Voraussetzungen aus früheren Themen, wo die Seite welche verlinkt.
        const vor = await page.evaluate((i) => {
          const fremd = (w) => w ? [...w.querySelectorAll("a[href]")].filter((a) => !/^(#|https?:|mailto:)/.test(a.getAttribute("href")) && /[A-Za-zÄÖÜäöüß]{3}/.test(a.textContent) && !a.closest(".quiz, .uebung-sprung")).length : 0;
          // Dieselbe Reihe wie das Skript: im Abschnitt, im „Du brauchst …“, in „Baut auf“ der Vernetzung.
          const bautAuf = [...document.querySelectorAll("#sec-vernetzung li")].filter((li) => /^\s*Baut auf/.test(li.textContent)).reduce((n, li) => n + fremd(li), 0);
          const angebot = fremd(document.getElementById(i)) + fremd(document.querySelector("main > section.card:first-of-type .hinweis-box")) + bautAuf;
          const v = document.querySelector("#sec-selbsteinschaetzung .se-voraussetzungen");
          return { angebot, verweise: v ? v.querySelectorAll("a").length : 0 };
        }, id);
        pruefe(vor.angebot === 0 || vor.verweise > 0, `${p} (${modus}): keine Voraussetzungen genannt, obwohl die Seite ${vor.angebot} Verweise auf frühere Themen hat`);
      }
      // Ein Aufgabenergebnis zählt bei allen Abschnitten der Aufgabe.
      const zwei = punkte.slice(0, 2).map((x) => x.abschnitt);
      await page.evaluate((ab) => document.dispatchEvent(new CustomEvent("uplant:aufgabe", { detail: { titel: "Prüfaufgabe", abschnitte: ab, richtig: false } })), zwei);
      let belege = await page.evaluate(() => [...document.querySelectorAll("#sec-selbsteinschaetzung .se-beleg")].map((b) => b.textContent));
      pruefe(punkte.every((x, i) => zwei.includes(x.abschnitt) === /Aufgaben: 0 gelöst, 1 noch nicht/.test(belege[i])), `${p} (${modus}): ein Fehlversuch steht nicht genau bei ${zwei.join(" und ")} — ${JSON.stringify(belege)}`);
      await page.evaluate((ab) => document.dispatchEvent(new CustomEvent("uplant:aufgabe", { detail: { titel: "Prüfaufgabe", abschnitte: ab, richtig: true } })), zwei);
      belege = await page.evaluate(() => [...document.querySelectorAll("#sec-selbsteinschaetzung .se-beleg")].map((b) => b.textContent));
      pruefe(punkte.every((x, i) => !zwei.includes(x.abschnitt) || /Aufgaben: 1 gelöst$/.test(belege[i])), `${p} (${modus}): die gelöste Aufgabe zählt nicht — ${JSON.stringify(belege)}`);
      // Das übersteht das Neuladen; „Zurücksetzen“ löscht alles.
      await oeffne(page, p);
      belege = await page.evaluate(() => [...document.querySelectorAll("#sec-selbsteinschaetzung .se-beleg")].map((b) => b.textContent));
      pruefe(belege.some((b) => /1 gelöst/.test(b)), `${p} (${modus}): der Lernstand übersteht das Neuladen nicht`);
      await page.evaluate(() => document.querySelector("#sec-selbsteinschaetzung .se-zuruecksetzen").click());
      z = await zustand(page);
      belege = await page.evaluate(() => [...document.querySelectorAll("#sec-selbsteinschaetzung .se-beleg")].map((b) => b.textContent));
      pruefe(ANFANG.test(z.auswertung) && z.zeilen.every((r) => r.knoepfe.every((k) => k.gedrueckt === "false")) && belege.every((b) => !/gelöst|✗|✓/.test(b)),
        `${p} (${modus}): „Zurücksetzen“ lässt etwas stehen — „${z.auswertung}“ ${JSON.stringify(belege)}`);

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
    if (!FILTER.length) pruefe(paar.length === 3, `(${modus}): keine zwei Seiten mit gleichnamigem Abschnitt an derselben Stelle — die Trennung bliebe ungeprüft`);
    if (paar.length === 3) {
      const [a, b, i] = paar;
      await oeffne(page, a);
      await leeren(page);
      await oeffne(page, a);
      await klicke(page, i, "🤔");
      await oeffne(page, b);
      const z = await zustand(page);
      pruefe(ANFANG.test(z.auswertung) && z.zeilen[i].knoepfe.every((k) => k.gedrueckt === "false"),
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
