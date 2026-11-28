// Gemeinsame Bausteine der Physikprüfungen (tests/physik/): eigene Konstanten und Tabellenwerte, Lesen
// der Zeichnungen aus dem SVG, Kontrollfragen, Gerüst (Abschnitte, Rahmen, Verweise, Menükarten,
// Formelsammlung) und der Ablauf hell/dunkel. Die fachlichen Teile stehen in den Prüfdateien der Seiten.
//
// Alles hier rechnet mit EIGENEN Werten — die Tabellen stehen so, wie sie im Lehrbuch stehen, und werden
// gegen die Seite gehalten, nicht von ihr übernommen.

"use strict";

const fs = require("fs");
const path = require("path");
const { starteBrowser, neueSeite, oeffne, text } = require("./seite");
const { pruefeNotation } = require("./notation");
const { pruefeKontrast, pruefeStrichKontrast } = require("./kontrast");

const WURZEL = path.resolve(__dirname, "..", "..");
const nahe = (a, b, eps) => Math.abs(a - b) <= eps;
// Eine angezeigte Zahl („1.234,5“, „−3,2“) als Zahl.
const z = (s) => Number(String(s).replace(/−/g, "-").replace(/\.(?=\d{3}\b)/g, "").replace(",", "."));
const r2 = (x) => Math.round(x * 100) / 100;
// Eine angezeigte Zahl mit `stellen` Nachkommastellen trifft den nachgerechneten Wert.
const trifft = (t, soll, stellen) => t !== null && t !== undefined && nahe(z(t), soll, 0.5 * 10 ** -stellen + 1e-9);

// ---------- eigene Physik ----------
const KB = 1.380649e-23, U = 1.66053906660e-27, M_H2O = 18.015 * U;
const NULL_K = 273.15;
const vMittel = (thetaC) => Math.sqrt((8 * KB * (thetaC + NULL_K)) / (Math.PI * M_H2O));
const ALPHA = { Aluminium: 0.023, Kupfer: 0.017, Stahl: 0.012, Beton: 0.012, Glas: 0.009 };
const GAMMA = { Ethanol: 1.1, Benzin: 1.0, Glycerin: 0.5, Wasser: 0.21, Quecksilber: 0.18 };

// ---------- SVG lesen ----------
async function lies(page, sel) {
  return page.evaluate((s) => {
    const wurzel = document.querySelector(s);
    if (!wurzel) return null;
    const zahlen = (d) => (d.match(/-?\d+(\.\d+)?/g) || []).map(Number);
    const r = (e) => e.dataset.rolle;
    return {
      gitter: [...wurzel.querySelectorAll("line[data-wert]")].map((l) => ({ wert: Number(l.dataset.wert), y: Number(l.getAttribute("y1")) })),
      marken: [...wurzel.querySelectorAll("line[data-wert-x]")].map((l) => ({ wert: Number(l.dataset.wertX), x: Number(l.getAttribute("x1")) })),
      pfade: [...wurzel.querySelectorAll("path[data-rolle]")].map((p) => ({ rolle: r(p), z: zahlen(p.getAttribute("d")), winkelPx: Number(p.dataset.winkelPx) })),
      punkte: [...wurzel.querySelectorAll("circle[data-rolle]")].map((c) => ({ rolle: r(c), x: Number(c.getAttribute("cx")), y: Number(c.getAttribute("cy")) })),
      linien: [...wurzel.querySelectorAll("line[data-rolle]")].map((l) => ({ rolle: r(l), x1: Number(l.getAttribute("x1")), x2: Number(l.getAttribute("x2")), y1: Number(l.getAttribute("y1")), y2: Number(l.getAttribute("y2")), mm: Number(l.dataset.mm) })),
      rects: [...wurzel.querySelectorAll("rect[data-rolle]")].map((e) => ({ rolle: r(e), x: Number(e.getAttribute("x")), y: Number(e.getAttribute("y")), b: Number(e.getAttribute("width")), h: Number(e.getAttribute("height")), px: Number(e.dataset.hoehePx), stoff: e.dataset.stoff, offen: e.dataset.offen })),
      texte: [...wurzel.querySelectorAll("text[data-rolle]")].map((t) => ({ rolle: r(t), text: t.textContent, mm: t.dataset.mm })),
    };
  }, sel);
}
// Maßstab aus zwei Achsenmarken und zwei Gitterlinien.
function welt(s) {
  const m = [...s.marken].sort((a, b) => a.wert - b.wert), g = [...s.gitter].sort((a, b) => a.wert - b.wert);
  const a = m[0], b = m[m.length - 1], c = g[0], d = g[g.length - 1];
  const sx = (b.x - a.x) / (b.wert - a.wert), sy = (c.y - d.y) / (d.wert - c.wert);
  return { sx, sy, X: (px) => a.wert + (px - a.x) / sx, Y: (py) => c.wert + (c.y - py) / sy };
}
// Nur die y-Achse (Balkendiagramm ohne Zahlen an der x-Achse).
function weltY(s) {
  const g = [...s.gitter].sort((a, b) => a.wert - b.wert), c = g[0], d = g[g.length - 1];
  const sy = (c.y - d.y) / (d.wert - c.wert);
  return { sy, Y: (py) => c.wert + (c.y - py) / sy };
}
const pfad = (s, w, rolle) => { const p = s.pfade.find((x) => x.rolle === rolle); if (!p) return []; const o = []; for (let i = 0; i + 1 < p.z.length; i += 2) o.push([w.X(p.z[i]), w.Y(p.z[i + 1])]); return o; };
const pfadPx = (s, rolle) => { const p = s.pfade.find((x) => x.rolle === rolle); if (!p) return []; const o = []; for (let i = 0; i + 1 < p.z.length; i += 2) o.push([p.z[i], p.z[i + 1]]); return o; };
const pkt = (s, w, rolle) => s.punkte.filter((x) => x.rolle === rolle).map((x) => [w.X(x.x), w.Y(x.y)]);
const rolle = (page, sel, r) => page.evaluate(([s, x]) => { const e = document.querySelector(`${s} [data-rolle="${x}"]`); return e ? e.textContent : null; }, [sel, r]);
async function waehle(page, id, wert) {
  await page.evaluate(([i, w]) => { const e = document.getElementById(i); e.value = String(w); e.dispatchEvent(new Event(e.tagName === "SELECT" ? "change" : "input")); }, [id, wert]);
}
// Die erste Tabelle in einem Merkkasten des Abschnitts: Kopfzeile → Werte der zweiten Zeile.
async function tabelle(page, sec) {
  return page.evaluate((s) => {
    const t = [...document.querySelectorAll(`#${s} .wissen-box table.ta-tabelle`)].pop();
    const z = [...t.querySelectorAll("tr")].map((tr) => [...tr.children].map((c) => c.innerText.trim()));
    return z[0].slice(1).map((n, i) => [n, z[1][i + 1]]);
  }, sec);
}
// Die Messuhr: Zähler (ganze Millimeter) plus Zeigerstellung (eine Umdrehung = 1 mm), aus dem Bild gelesen.
async function messuhr(page, mountSel) {
  const s = await lies(page, mountSel);
  const zeiger = s.linien.find((l) => l.rolle === "zeiger"), zaehler = s.texte.find((t) => t.rolle === "zaehler");
  if (!zeiger || !zaehler) return NaN;
  let w = Math.atan2(zeiger.x2 - zeiger.x1, -(zeiger.y2 - zeiger.y1));
  if (w < -1e-9) w += 2 * Math.PI;
  const ganz = Number((zaehler.text.match(/(\d+) mm/) || [])[1]);
  return ganz + w / (2 * Math.PI);
}
// Ein Beispielkasten als Klartext (der n-te seiner Art im Abschnitt).
const kasten = (page, sec, art = "beispiel-box", n = 0) => page.evaluate(([s, a, i]) => {
  const k = document.querySelectorAll(`#${s} .${a}`)[i];
  return k ? k.innerText.replace(/\s+/g, " ") : "";
}, [sec, art, n]);

// ---------- Kontrollfragen ----------
// Jede Kontrollfrage: vier verschiedene Antworten, genau eine richtig (nachgerechnet über RICHTIG),
// Erklärung nicht zu knapp, und die richtige Antwort nicht immer an derselben Stelle.
async function pruefeQuizze(page, pruefe, anzahl, RICHTIG) {
  const ids = await page.evaluate(() => [...document.querySelectorAll(".quiz[id]")].map((q) => q.id));
  pruefe(ids.length === anzahl, `Kontrollfragen: ${ids.length} statt ${anzahl}`);
  const ohne = await page.evaluate(() => [...document.querySelectorAll("main section.card[id]")].filter((s) => s.querySelector(".widget") && !s.querySelector(".quiz")).map((s) => s.id));
  pruefe(ohne.length === 0, `Kontrollfragen: Abschnitte ohne Kontrollfrage — ${ohne.join(", ")}`);
  pruefe(ids.every((id) => RICHTIG[id]), `Kontrollfragen: keine Nachrechnung für ${ids.filter((id) => !RICHTIG[id]).join(", ")}`);
  const stellen = [];
  for (const id of ids) {
    const opts = await page.evaluate((q) => [...document.querySelectorAll(`#${q} .quiz-opt`)].map((b) => b.textContent.trim()), id);
    pruefe(opts.length === 4 && new Set(opts).size === 4, `Kontrollfrage ${id}: keine vier verschiedenen Antworten`);
    let richtige = 0;
    for (let i = 0; i < opts.length; i++) {
      await page.locator(`#${id} .quiz-opt`).nth(i).click();
      const fb = await text(page, `#${id} .quiz-feedback`);
      const ok = fb.startsWith("✓");
      if (ok) { richtige++; stellen.push(i); }
      pruefe(ok === Boolean(RICHTIG[id] && RICHTIG[id](opts[i])), `Kontrollfrage ${id}: „${opts[i]}“ gilt als ${ok ? "richtig" : "falsch"}, nachgerechnet ist es umgekehrt`);
      pruefe(fb.length > 80, `Kontrollfrage ${id}: die Erklärung ist zu knapp`);
    }
    pruefe(richtige === 1, `Kontrollfrage ${id}: ${richtige} richtige Antworten`);
  }
  if (ids.length >= 3) pruefe(new Set(stellen).size >= 3, `Kontrollfragen: die richtige Antwort steht fast immer an derselben Stelle (${stellen.join(", ")})`);
}

// ---------- Gerüst ----------
// o: { seite, abschnitte (Erarbeitung), ziele, brot (Ende der Brotkrumen), karten: [[datei, href, titel]],
//      ohneAbsolut: [ids ohne absolute Temperatur], formeln: [Formeln, die in der Quelle der Formelsammlung stehen] }
const PDF = "physik/klasse-8/thermische-ausdehnung/formelsammlung.pdf";
const QUELLE = "tools/formelsammlung/formelsammlung-ta-quelle.html";
async function pruefeGeruest(page, pruefe, o) {
  const folge = await page.evaluate(() => [...document.querySelectorAll("main section[id]")].map((s) => s.id));
  const soll = [...o.abschnitte, "sec-vernetzung", "sec-formelsammlung", "sec-uebungen", "sec-selbsteinschaetzung"];
  pruefe(JSON.stringify(folge) === JSON.stringify(soll), `Gerüst: die Abschnitte stehen in der Reihenfolge ${folge.join(", ")}`);
  const nummern = await page.evaluate(() => [...document.querySelectorAll("main section[id] > h2")].map((h) => (h.textContent.match(/^(\d+)\./) || [])[1]).filter(Boolean).map(Number));
  const nSoll = Array.from({ length: o.abschnitte.length + 3 }, (_, i) => i + 1);
  pruefe(JSON.stringify(nummern) === JSON.stringify(nSoll), `Gerüst: die Abschnitte sind ${nummern.join(", ")} nummeriert`);
  const ziele = await page.evaluate(() => document.querySelectorAll(".lern-intro-list li").length);
  const saetze = await page.evaluate(() => [...document.querySelectorAll("#se-liste li")].map((l) => l.dataset.abschnitt));
  pruefe(ziele === o.ziele && JSON.stringify(saetze) === JSON.stringify(o.abschnitte), `Gerüst: ${ziele} Ziele, Selbsteinschätzung zu ${saetze.join(", ")}`);
  for (const id of o.ohneAbsolut || []) {
    const t = await page.evaluate((i) => document.getElementById(i).innerText, id);
    pruefe(!/273|absolute/.test(t), `Gerüst: ${id} benutzt die absolute Temperatur, bevor die Gasgesetze sie einführen`);
  }
  const rahmen = await page.evaluate((brot) => ({
    brot: document.querySelector("nav.breadcrumb").innerText.trim().endsWith(brot),
    haftung: !!document.querySelector('footer a[href$="haftungsausschluss.html"]'),
    lehrkraft: !!document.querySelector("section[data-lehrkraft][hidden]"),
  }), o.brot);
  pruefe(rahmen.brot && rahmen.haftung, "Gerüst: Brotkrumen oder Haftungsausschluss fehlen");
  pruefe(rahmen.lehrkraft, "Gerüst: der Platzhalter für die Hinweise für Lehrkräfte fehlt");
  const links = await page.evaluate(() => [...document.querySelectorAll("a[href]")].map((a) => a.getAttribute("href")).filter((h) => !h.startsWith("http")));
  for (const href of new Set(links)) {
    if (href.startsWith("#")) { pruefe(await page.evaluate((id) => !!document.getElementById(id), href.slice(1)), `Gerüst: Sprungmarke „${href}“ führt ins Leere`); continue; }
    const ziel = new URL(href, "http://localhost" + o.seite);
    const antwort = await page.request.get("http://localhost:" + (process.env.UPLANT_PORT || "8936") + ziel.pathname);
    pruefe(antwort.ok(), `Gerüst: der Verweis „${href}“ führt ins Leere (${antwort.status()})`);
    if (ziel.hash) pruefe((await antwort.text()).includes(`id="${ziel.hash.slice(1)}"`), `Gerüst: die Sprungmarke in „${href}“ gibt es nicht`);
  }
  // Menükarten: Physik → Klasse 8 → Einheit → Thema, jede mit hidden und data-section="physik", nur Titel.
  const karten = [["physik/index.html", "klasse-8/index.html", "Klasse 8"], ["physik/klasse-8/index.html", "thermische-ausdehnung/index.html", "1. Thermische Ausdehnung"], ...o.karten];
  for (const [datei, href, titel] of karten) {
    const menue = fs.readFileSync(path.join(WURZEL, datei), "utf8");
    const karte = menue.match(new RegExp(`<a class="menu-card"[^>]*href="${href.replace(/[.]/g, "\\.")}"[^>]*>([\\s\\S]*?)<\\/a>`));
    pruefe(!!karte && /\bhidden\b/.test(karte[0]) && /data-section="physik"/.test(karte[0]) && karte[1].includes(`<h2>${titel}</h2>`), `Gerüst: die Menükarte „${titel}“ in ${datei} fehlt oder ist unvollständig`);
    pruefe(/assets\/access-gate\.js/.test(menue), `Gerüst: ${datei} bindet access-gate.js nicht ein — die Karte bliebe unsichtbar`);
  }
  // Formelsammlung: Verweis, zwei Seiten quer, die Formeln der Seite in der Quelle.
  const verweis = await page.evaluate(() => { const a = document.querySelector("#sec-formelsammlung a[download]"); return a && a.getAttribute("href"); });
  pruefe(verweis === "formelsammlung.pdf", `Formelsammlung: der Verweis zeigt auf „${verweis}“`);
  const pdf = path.join(WURZEL, PDF);
  pruefe(fs.existsSync(pdf), "Formelsammlung: PDF fehlt");
  if (fs.existsSync(pdf)) {
    const roh = fs.readFileSync(pdf).toString("latin1");
    pruefe((roh.match(/\/Type\s*\/Page(?!s)/g) || []).length === 2, "Formelsammlung: nicht genau zwei Seiten");
    const box = roh.match(/\/MediaBox\s*\[\s*0 0 ([\d.]+) ([\d.]+)/);
    pruefe(!!box && Number(box[1]) > Number(box[2]), "Formelsammlung: nicht im Querformat");
  }
  const quelle = fs.readFileSync(path.join(WURZEL, QUELLE), "utf8").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/\s+/g, " ");
  for (const f of o.formeln) pruefe(quelle.includes(f), `Formelsammlung: „${f}“ fehlt in der Quelle`);
}

// ---------- Ablauf ----------
// Hell: alle fachlichen Teile; dunkel: Kontrast. In beiden Modi die Notation und Skriptfehler.
// UPLANT_NUR=teil1,teil2 beschränkt auf einzelne Teile (für Gegenproben).
async function fuehreAus(bericht, seite, teile, striche) {
  const { pruefe } = bericht;
  const NUR = (process.env.UPLANT_NUR || "").split(",").map((t) => t.trim()).filter(Boolean);
  const will = (t) => NUR.length === 0 || NUR.includes(t);
  const browser = await starteBrowser();
  for (const dunkel of [false, true]) {
    const wo = dunkel ? "dunkel" : "hell";
    const page = await neueSeite(browser, { dunkel });
    await oeffne(page, seite);
    if (!dunkel) {
      for (const [name, fn] of teile) {
        if (!will(name)) continue;
        try { await fn(page); } catch (e) { pruefe(false, `${name}: Abbruch — ${String(e && e.message).split("\n")[0]}`); }
      }
    } else if (will("dunkel")) {
      await pruefeKontrast(page, bericht, "dunkel");
      await pruefeStrichKontrast(page, bericht, "dunkel, Kurven und Linien", striche);
    }
    await pruefeNotation(page, bericht, wo);
    for (const s of page.stoerungen) pruefe(false, `${wo}: ${s}`);
    await page.close();
  }
  await browser.close();
  bericht.abschluss();
}

module.exports = {
  WURZEL, nahe, z, r2, trifft, KB, U, M_H2O, NULL_K, vMittel, ALPHA, GAMMA,
  lies, welt, weltY, pfad, pfadPx, pkt, rolle, waehle, tabelle, messuhr, kasten,
  pruefeQuizze, pruefeGeruest, fuehreAus,
};
