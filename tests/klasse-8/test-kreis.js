// Fachliche Prüfung: Klasse 8, Geometrie, Thema 5 „Der Kreis“.
//
// Die Seite behauptet drei Dinge, und alle drei werden hier nachgerechnet — nicht nur abgelesen:
//
//   1. Die HERLEITUNGEN stimmen. Bei vielen Reglerstellungen wird die gezeichnete Figur aus dem
//      SVG zurückgelesen: Flächen über die Gaußsche Trapezformel, Längen als Summe der Sehnen, der
//      Maßstab aus einer bekannten Strecke zurückgerechnet. Was die Bilanz behauptet, muss die
//      Zeichnung zeigen.
//   2. Die BEWEGUNGEN sind flächentreu. Jedes Stück des Kreises hat in jeder Zwischenstellung
//      denselben Flächeninhalt wie am Anfang: Die Ausschnitte bleiben Ausschnitte (jeder Bogenpunkt
//      liegt im Abstand r von der Spitze), die Ringe behalten ihre Fläche w · L, die aus dem
//      Kreisring herausgehobene Scheibe ihre Fläche π · r², der abgerollte Bogen seine Länge, und
//      das Rad rollt, ohne zu rutschen.
//   3. Die AUFGABEN rechnen richtig. Jede der zwölf wird über viele Runden gewürfelt, unabhängig
//      nachgerechnet und mit jedem vorgesehenen Fehlerwert geprüft.
//
// Dazu das Gerüst: Reihenfolge der Abschnitte und der beiden Wege zum Kreisring (kein Vorgriff), die
// Dreisatz-Tabellen vor Bogen und Ausschnitt, keine Quadratwurzel und kein Satz
// des Pythagoras außer als ausdrücklicher Ausblick auf Klasse 9, gemessene Längen als gemessen
// gekennzeichnet, Kontrollfragen, Formelsammlung als PDF, Menükarte.

"use strict";

const { neuerBericht } = require("../lib/pruefen");
const { starteBrowser, neueSeite, oeffne, setzeRegler, text } = require("../lib/seite");
const { pruefeNotation } = require("../lib/notation");
const { pruefeKontrast } = require("../lib/kontrast");
const { pruefeAufgabe } = require("../lib/aufgaben");
const fs = require("fs");
const path = require("path");

const bericht = neuerBericht();
const { pruefe } = bericht;
const SEITE = "/mathematik/klasse-8/geometrie/kreis.html";
const WURZEL = path.resolve(__dirname, "..", "..");

const de = (x, stellen = 4) => Number(x.toFixed(stellen)).toLocaleString("de-DE", { maximumFractionDigits: stellen });
// Zwei feste Nachkommastellen, wie die Seite gerundete Kreisgrößen schreibt.
const de2 = (x) => (Math.round(x * 100) / 100).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const rund2 = (x) => Math.round(x * 100) / 100;

// ---------- Messen am SVG ----------

function flaeche(punkte) {
  let s = 0;
  for (let i = 0; i < punkte.length; i++) {
    const a = punkte[i], c = punkte[(i + 1) % punkte.length];
    s += a.x * c.y - c.x * a.y;
  }
  return Math.abs(s) / 2;
}
function laenge(punkte) {
  let s = 0;
  for (let i = 1; i < punkte.length; i++) s += Math.hypot(punkte[i].x - punkte[i - 1].x, punkte[i].y - punkte[i - 1].y);
  return s;
}
const abstand = (p, q) => Math.hypot(p.x - q.x, p.y - q.y);

// Alles, was in einer Zeichnung steht: Vielecke, Linienzüge, Linien, Kreise und Texte mit ihrer
// Rolle (data-rolle), dazu die benannten Punkte.
async function zeichnung(page, mountId) {
  return page.evaluate((id) => {
    const svg = document.querySelector(`#${id} svg`);
    const lies = (e) => e.getAttribute("points").trim().split(/\s+/).map((t) => {
      const [x, y] = t.split(",").map(Number);
      return { x, y };
    });
    const teile = [];
    for (const e of svg.querySelectorAll("polygon, polyline, line, circle, path, text")) {
      if (e.closest(".th-punkt-gruppe")) continue;
      const o = { tag: e.tagName, rolle: e.getAttribute("data-rolle"), nr: e.getAttribute("data-nr"), klasse: e.getAttribute("class") || "" };
      if (o.tag === "polygon" || o.tag === "polyline") o.punkte = lies(e);
      if (o.tag === "line") o.punkte = [{ x: +e.getAttribute("x1"), y: +e.getAttribute("y1") }, { x: +e.getAttribute("x2"), y: +e.getAttribute("y2") }];
      if (o.tag === "circle") { o.c = { x: +e.getAttribute("cx"), y: +e.getAttribute("cy") }; o.r = +e.getAttribute("r"); }
      // Ein Pfad aus mehreren geschlossenen Linienzügen „M x,y L x,y … Z M …“ — die Fläche mit Loch.
      if (o.tag === "path") {
        o.fuellregel = e.getAttribute("fill-rule");
        o.wege = e.getAttribute("d").split("M").map((t) => t.replace("Z", "").trim()).filter(Boolean)
          .map((t) => t.split("L").map((q) => { const [x, y] = q.trim().split(",").map(Number); return { x, y }; }));
      }
      if (o.tag === "text") o.text = e.textContent;
      teile.push(o);
    }
    const namen = {};
    for (const g of svg.querySelectorAll(".th-punkt-gruppe")) {
      const c = g.querySelector("circle");
      if (g.dataset.name) namen[g.dataset.name] = { x: +c.getAttribute("cx"), y: +c.getAttribute("cy") };
    }
    return { teile, namen };
  }, mountId);
}
const mitRolle = (z, rolle) => z.teile.filter((t) => t.rolle === rolle);

// ── Abschnitt 1: Abrollen ─────────────────────────────────────────────────
//
// Der Maßstab kommt aus dem Lineal unter dem Boden: vier Strecken, jede einen Durchmesser lang.
async function abrollen(page) {
  for (const d of [1, 2.5, 4]) {
    await setzeRegler(page, "ab-d", d);
    for (const tProzent of [0, 30, 62, 100]) {
      const t = (await setzeRegler(page, "ab-t", tProzent)) / 100;
      const wo = `d = ${d}, Abrollen ${tProzent} %`;
      const z = await zeichnung(page, "ab-mount");
      const lineal = mitRolle(z, "lineal");
      pruefe(lineal.length === 4, `Abrollen: ${wo} — ${lineal.length} Durchmesser im Lineal statt 4`);
      const skala = laenge(lineal[0].punkte) / d;
      pruefe(lineal.every((l) => Math.abs(laenge(l.punkte) / skala - d) < 0.01), `Abrollen: ${wo} — die Durchmesser im Lineal sind verschieden lang`);
      const [rad] = mitRolle(z, "rad");
      pruefe(!!rad && Math.abs(rad.r / skala - d / 2) < 0.01, `Abrollen: ${wo} — das Rad hat nicht den Radius ${de(d / 2)} cm`);
      if (!rad) continue;
      const U = Math.PI * d, s = t * U;
      // Ohne Rutschen: Der Mittelpunkt ist genau so weit gewandert, wie die Strecke lang ist.
      const start = lineal[0].punkte[0].x;
      pruefe(Math.abs((rad.c.x - start) / skala - s) < 0.02, `Abrollen: ${wo} — der Mittelpunkt ist ${de((rad.c.x - start) / skala, 3)} cm gewandert statt ${de(s, 3)} cm`);
      const strecke = mitRolle(z, "abgerollt")[0];
      const rand = mitRolle(z, "rand-abgerollt")[0];
      if (t === 0) {
        pruefe(!strecke && !rand, `Abrollen: ${wo} — vor dem Abrollen ist schon etwas abgerollt`);
      } else {
        pruefe(!!strecke && Math.abs(laenge(strecke.punkte) / skala - s) < 0.02, `Abrollen: ${wo} — die orange Strecke ist nicht ${de(s, 3)} cm lang`);
        pruefe(!!rand && Math.abs(laenge(rand.punkte) / skala - s) < 0.02, `Abrollen: ${wo} — das orange Randstück ist ${rand ? de(laenge(rand.punkte) / skala, 3) : "—"} cm lang statt ${de(s, 3)} cm`);
        pruefe(!!rand && rand.punkte.every((p) => Math.abs(abstand(p, rad.c) - rad.r) < 0.6), `Abrollen: ${wo} — das orange Randstück liegt nicht auf dem Rad`);
      }
      // Der Punkt P, der am Anfang unten lag: auf dem Rad, um t · 360° im Uhrzeigersinn gedreht.
      const P = z.namen.P;
      pruefe(!!P && Math.abs(abstand(P, rad.c) - rad.r) < 0.6, `Abrollen: ${wo} — P liegt nicht auf dem Rad`);
      if (P) {
        const soll = { x: rad.c.x - rad.r * Math.sin(2 * Math.PI * t), y: rad.c.y + rad.r * Math.cos(2 * Math.PI * t) };
        pruefe(abstand(P, soll) < 1, `Abrollen: ${wo} — P steht nicht dort, wo ein rollendes Rad ihn hintrüge`);
      }
      const bilanz = await text(page, "#ab-bilanz");
      pruefe(bilanz.includes(`U = π · d ≈ ${de2(U)} cm`), `Abrollen: ${wo} — die Bilanz nennt nicht U ≈ ${de2(U)} cm — „${bilanz}“`);
      pruefe(bilanz.includes(`3 Durchmesser (${de(3 * d)} cm) und noch etwa ${de2(U - 3 * d)} cm`), `Abrollen: ${wo} — die Bilanz zählt die Durchmesser nicht richtig — „${bilanz}“`);
      pruefe(bilanz.includes("U : d = π ≈ 3,14159"), `Abrollen: ${wo} — die Bilanz nennt π nicht`);
    }
  }
}

// ── Abschnitt 1b: Einschachteln ───────────────────────────────────────────
async function einschachteln(page) {
  const ECKEN = [4, 6, 12, 24, 48, 96];
  const schranken = [];
  for (let i = 0; i < ECKEN.length; i++) {
    await setzeRegler(page, "es-n", i);
    const n = ECKEN[i];
    const z = await zeichnung(page, "es-mount");
    const [kreis] = mitRolle(z, "kreis");
    const [innen] = mitRolle(z, "innen");
    const [aussen] = mitRolle(z, "aussen");
    pruefe(!!kreis && !!innen && !!aussen, `Einschachteln: ${n} Ecken — Kreis oder Vielecke fehlen`);
    if (!kreis || !innen || !aussen) continue;
    const d = 2 * kreis.r;
    pruefe(innen.punkte.length === n && aussen.punkte.length === n, `Einschachteln: ${n} Ecken — gezeichnet sind ${innen.punkte.length} und ${aussen.punkte.length}`);
    // Innen: alle Ecken auf dem Kreis. Außen: jede Seite berührt den Kreis in ihrer Mitte.
    pruefe(innen.punkte.every((p) => Math.abs(abstand(p, kreis.c) - kreis.r) < 0.6), `Einschachteln: ${n} Ecken — das innere Vieleck hat Ecken neben dem Kreis`);
    const mitten = aussen.punkte.map((p, k) => { const q = aussen.punkte[(k + 1) % n]; return { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 }; });
    pruefe(mitten.every((m) => Math.abs(abstand(m, kreis.c) - kreis.r) < 0.6), `Einschachteln: ${n} Ecken — das äußere Vieleck berührt den Kreis nicht`);
    const fi = laenge([...innen.punkte, innen.punkte[0]]) / d;
    const fa = laenge([...aussen.punkte, aussen.punkte[0]]) / d;
    pruefe(fi < Math.PI && Math.PI < fa, `Einschachteln: ${n} Ecken — π liegt nicht zwischen ${de(fi)} und ${de(fa)}`);
    const bilanz = await text(page, "#es-bilanz");
    const zahlen = [...bilanz.matchAll(/([\d,]+) · d/g)].map((m) => Number(m[1].replace(",", ".")));
    pruefe(zahlen.length === 2 && Math.abs(zahlen[0] - fi) < 0.0015 && Math.abs(zahlen[1] - fa) < 0.0015,
      `Einschachteln: ${n} Ecken — die Bilanz nennt ${zahlen.join(" und ")}, gemessen sind ${de(fi)} und ${de(fa)}`);
    // Genau ohne Messen sind nur das Sechseck innen und das Quadrat außen; alles andere bräuchte
    // den Satz des Pythagoras und muss als gemessen gekennzeichnet sein.
    // text() fasst Leerraum zusammen; die Zeilen der Bilanz braucht es hier einzeln.
    const zeilen = (await page.locator("#es-bilanz").innerText()).split(/\n/);
    const innenZeile = zeilen.find((s) => /innen/.test(s)) || "", aussenZeile = zeilen.find((s) => /außen/.test(s)) || "";
    pruefe(n === 6 ? /genau/.test(innenZeile) && Math.abs(fi - 3) < 0.002 : /gemessen/.test(innenZeile), `Einschachteln: ${n} Ecken — innen „${innenZeile}“`);
    pruefe(n === 4 ? /genau/.test(aussenZeile) && Math.abs(fa - 4) < 0.002 : /gemessen/.test(aussenZeile), `Einschachteln: ${n} Ecken — außen „${aussenZeile}“`);
    schranken.push([fi, fa]);
  }
  // Mit mehr Ecken werden die Schranken enger.
  for (let i = 1; i < schranken.length; i++) {
    if (ECKEN[i] === 6) continue;   // vom Quadrat zum Sechseck rückt nur das innere näher
    pruefe(schranken[i][0] > schranken[i - 1][0] && schranken[i][1] < schranken[i - 1][1], `Einschachteln: von ${ECKEN[i - 1]} auf ${ECKEN[i]} Ecken werden die Schranken nicht enger`);
  }
}

// ── Abschnitt 2: Umfang mit dem Radius ────────────────────────────────────
async function radius(page) {
  let skalaVorher = null;
  for (const r of [1, 1.5, 2.25, 3]) {
    const gesetzt = await setzeRegler(page, "ra-r", r);
    const z = await zeichnung(page, "ra-mount");
    const [rad] = mitRolle(z, "radius");
    const [kreis] = mitRolle(z, "kreis");
    const [umfang] = mitRolle(z, "umfang");
    const skala = laenge(rad.punkte) / gesetzt;
    pruefe(Math.abs(kreis.r / skala - gesetzt) < 0.01, `Radius: r = ${gesetzt} — der Kreis passt nicht zum Radius`);
    pruefe(Math.abs(laenge(umfang.punkte) / skala - 2 * Math.PI * gesetzt) < 0.02, `Radius: r = ${gesetzt} — der abgerollte Umfang misst ${de(laenge(umfang.punkte) / skala, 3)} cm statt ${de(2 * Math.PI * gesetzt, 3)} cm`);
    // Fester Maßstab: Ein doppelt so großer Kreis muss auch doppelt so groß aussehen — sonst zeigte
    // die Zeichnung die Proportionalität nicht, um die es geht.
    if (skalaVorher !== null) pruefe(Math.abs(skala - skalaVorher) < 0.05, `Radius: der Maßstab ändert sich mit r (${de(skalaVorher, 2)} → ${de(skala, 2)} Bildpunkte je cm)`);
    skalaVorher = skala;
    const bilanz = await text(page, "#ra-bilanz");
    const U = 2 * Math.PI * gesetzt;
    pruefe(bilanz.includes(`U = π · d = π · ${de(2 * gesetzt)} cm ≈ ${de2(U)} cm`) && bilanz.includes(`U = 2 · π · r = 2 · π · ${de(gesetzt)} cm ≈ ${de2(U)} cm`),
      `Radius: r = ${gesetzt} — die Bilanz rechnet U nicht auf beiden Wegen zu ${de2(U)} cm — „${bilanz}“`);
    pruefe(bilanz.includes(`Rest von etwa ${de2(U - 6 * gesetzt)} cm`), `Radius: r = ${gesetzt} — der Rest nach 6 Radien stimmt nicht — „${bilanz}“`);
  }
}

// ── Abschnitt 3a: Ausschnitte zum Fast-Rechteck ───────────────────────────
//
// Jedes Stück muss in jeder Stellung ein Kreisausschnitt mit dem Radius r und dem Winkel 360° : n
// bleiben: Die Spitze ist der erste Punkt, alle Bogenpunkte liegen im Abstand r von ihr, und der
// Flächeninhalt ist π · r² : n.
// Ein Häkchen setzt man nicht über value, sondern über checked.
const setzeHaken = (page, id, an) => page.evaluate(([i, a]) => {
  const e = document.getElementById(i);
  e.checked = a;
  e.dispatchEvent(new Event("input", { bubbles: true }));
}, [id, an]);

async function ausschnitte(page) {
  await setzeHaken(page, "se-quadrate", false);
  for (const r of [2, 3, 4]) {
    await setzeRegler(page, "se-r", r);
    for (const n of [4, 8, 18, 32]) {
      await setzeRegler(page, "se-n", n);
      for (const tProzent of [0, 26, 50, 74, 100]) {
        const t = (await setzeRegler(page, "se-t", tProzent)) / 100;
        const wo = `r = ${r}, ${n} Stücke, Umlegen ${tProzent} %`;
        const z = await zeichnung(page, "se-mount");
        const kreis = z.teile.find((e) => e.tag === "circle");
        const skala = kreis.r / r;
        const stuecke = mitRolle(z, "stueck");
        pruefe(stuecke.length === n, `Ausschnitte: ${wo} — ${stuecke.length} Stücke statt ${n}`);
        let summe = 0;
        for (const s of stuecke) {
          const [spitze, ...bogen] = s.punkte;
          const af = flaeche(s.punkte) / (skala * skala);
          summe += af;
          pruefe(bogen.every((p) => Math.abs(abstand(p, spitze) / skala - r) < 0.01), `Ausschnitte: ${wo} — Stück ${s.nr} ist kein Ausschnitt mit dem Radius ${r} cm mehr`);
          pruefe(Math.abs(af - (Math.PI * r * r) / n) < 0.003 * (Math.PI * r * r) / n, `Ausschnitte: ${wo} — Stück ${s.nr} hat ${de(af, 3)} cm² statt ${de((Math.PI * r * r) / n, 3)} cm²`);
          pruefe(Math.abs(laenge(bogen) / skala - (2 * Math.PI * r) / n) < 0.003 * (2 * Math.PI * r) / n, `Ausschnitte: ${wo} — der Bogen von Stück ${s.nr} hat die falsche Länge`);
        }
        pruefe(Math.abs(summe - Math.PI * r * r) < 0.003 * Math.PI * r * r, `Ausschnitte: ${wo} — die Stücke haben zusammen ${de(summe, 2)} cm² statt π · r²`);
        if (t === 1) {
          // Das Fast-Rechteck: unten n/2 Bögen nebeneinander, die Spitzen abwechselnd oben und unten,
          // jedes Stück genau r hoch.
          const c = 2 * r * Math.sin(Math.PI / n), h = r * Math.cos(Math.PI / n);
          const spitzen = stuecke.map((s) => s.punkte[0]);
          // Gruppiert mit Toleranz, nicht über Math.round: Liegt eine Höhe bei x,5 Bildpunkten, teilte
          // die Rundung sie in zwei.
          const ys = [];
          for (const p of spitzen) if (!ys.some((y) => Math.abs(y - p.y) < 0.6)) ys.push(p.y);
          pruefe(ys.length === 2 && Math.abs(Math.abs(ys[0] - ys[1]) / skala - h) < 0.02, `Ausschnitte: ${wo} — die Spitzen liegen nicht abwechselnd auf zwei Höhen im Abstand ${de(h, 3)} cm`);
          const xs = spitzen.map((p) => p.x).sort((a, b) => a - b);
          pruefe(xs.every((x, i) => i === 0 || Math.abs((x - xs[i - 1]) / skala - c / 2) < 0.01), `Ausschnitte: ${wo} — die Stücke liegen nicht lückenlos nebeneinander`);
          const alle = stuecke.flatMap((s) => s.punkte);
          const breite = (Math.max(...alle.map((p) => p.x)) - Math.min(...alle.map((p) => p.x))) / skala;
          pruefe(Math.abs(breite - (n / 2 + 0.5) * c) < 0.02, `Ausschnitte: ${wo} — das Fast-Rechteck ist ${de(breite, 3)} cm breit statt ${de((n / 2 + 0.5) * c, 3)} cm`);
        }
        const bilanz = await text(page, "#se-bilanz");
        pruefe(bilanz.includes(`π · r ≈ ${de2(Math.PI * r)} cm`) && bilanz.includes(`A = π · r · r = π · r² ≈ ${de2(Math.PI * r * r)} cm²`),
          `Ausschnitte: ${wo} — die Bilanz stimmt nicht — „${bilanz}“`);
        const sehnen = (n / 2) * 2 * r * Math.sin(Math.PI / n);
        // „etwa“ nur, wo gerundet ist — beim Sechseck (n = 6) sind die Sehnen genau 3 · r.
        pruefe(bilanz.includes(`zusammen ${Math.abs(sehnen * 100 - Math.round(sehnen * 100)) < 1e-9 ? "" : "etwa "}${de2(sehnen)} cm lang (gemessen)`), `Ausschnitte: ${wo} — die Sehnen sind nicht als gemessen mit ${de2(sehnen)} cm angegeben — „${bilanz}“`);
      }
    }
  }
  // Die beiden Quadrate der Abschätzung 2 · r² < A < 4 · r².
  await setzeRegler(page, "se-r", 3);
  await setzeRegler(page, "se-t", 0);
  await setzeHaken(page, "se-quadrate", true);
  const z = await zeichnung(page, "se-mount");
  const kreis = z.teile.find((e) => e.tag === "circle");
  const skala = kreis.r / 3;
  const [qa] = mitRolle(z, "quadrat-aussen"), [qi] = mitRolle(z, "quadrat-innen");
  pruefe(!!qa && Math.abs(flaeche(qa.punkte) / skala ** 2 - 36) < 0.05, "Ausschnitte: das äußere Quadrat hat nicht 4 · r² = 36 cm²");
  pruefe(!!qi && Math.abs(flaeche(qi.punkte) / skala ** 2 - 18) < 0.05, "Ausschnitte: das innere Quadrat hat nicht 2 · r² = 18 cm²");
  const bilanz = await text(page, "#se-bilanz");
  pruefe(bilanz.includes("Quadrat innen 2 · r² = 18 cm², außen 4 · r² = 36 cm²"), `Ausschnitte: die Bilanz nennt die Quadrate nicht — „${bilanz}“`);
  await setzeHaken(page, "se-quadrate", false);
}

// ── Fester Maßstab ────────────────────────────────────────────────────────
//
// Ein größerer Radius muss im Bild größer sein. Passte die Bühne jede Figur auf dieselbe Größe ein,
// wäre die Änderung nur an der Zahl darunter zu erkennen — und Abschnitt 1 behauptete „das Bild
// wird größer oder kleiner“, ohne es zu zeigen. Gemessen wird deshalb der Maßstab (Bildpunkte je
// Zentimeter) an einer Strecke bekannter Länge, beim kleinsten und beim größten Radius; er muss
// derselbe sein. Beim Bogen zusätzlich über den Winkel: Der doppelte Winkel gibt sichtbar den
// doppelten Bogen.
const MASSSTAB = [
  { mount: "ab-mount", name: "Abrollen", regler: "ab-d", werte: [1, 2.5, 4], sonst: [["ab-t", 50]],
    skala: (z, d) => laenge(mitRolle(z, "lineal")[0].punkte) / d },
  { mount: "se-mount", name: "Ausschnitte", regler: "se-r", werte: [2, 3, 4], sonst: [["se-n", 8], ["se-t", 100]],
    skala: (z, r) => z.teile.find((e) => e.tag === "circle").r / r },
  { mount: "ri-mount", name: "Ringe", regler: "ri-r", werte: [1.5, 2, 3], sonst: [["ri-n", 5], ["ri-t", 50]],
    skala: (z, r) => ringSkala(z, r) },
  { mount: "kd-mount", name: "Kreis minus Kreis", regler: "kd-gr", werte: [1.5, 2.25, 3], sonst: [["kd-kl", 0.5], ["kd-t", 100]],
    skala: (z, R) => laenge(mitRolle(z, "R")[0].punkte) / R },
  { mount: "kd-mount", name: "Kreis minus Kreis (r)", regler: "kd-kl", werte: [0.5, 1.5, 2.5], sonst: [["kd-gr", 3], ["kd-t", 100]],
    skala: (z) => laenge(mitRolle(z, "R")[0].punkte) / 3 },
  { mount: "kr-mount", name: "Kreisring aufbiegen", regler: "kr-gr", werte: [1.5, 2.25, 3], sonst: [["kr-kl", 0.5], ["kr-t", 0]],
    skala: (z, R) => (Math.max(...mitRolle(z, "ring")[0].punkte.map((p) => p.y)) - z.namen.M.y) / R },
  { mount: "bo-mount", name: "Bogen", regler: "bo-r", werte: [1.5, 2, 3], sonst: [["bo-a", 90], ["bo-t", 0]],
    skala: (z, r) => laenge(z.teile.find((e) => e.klasse === "kr-radius").punkte) / r },
  { mount: "bo-mount", name: "Bogen (Winkel)", regler: "bo-a", werte: [60, 90, 180, 360], sonst: [["bo-r", 2.5], ["bo-t", 50]],
    skala: (z) => laenge(z.teile.find((e) => e.klasse === "kr-radius").punkte) / 2.5 },
  { mount: "au-mount", name: "Ausschnitt", regler: "au-r", werte: [2, 3, 4], sonst: [["au-a", 120], ["au-k", 6], ["au-t", 100]],
    skala: (z, r) => z.teile.find((e) => e.tag === "circle").r / r },
];
async function masssstab(page) {
  for (const { mount, name, regler, werte, sonst, skala } of MASSSTAB) {
    for (const [id, v] of sonst) await setzeRegler(page, id, v);
    const gemessen = [];
    for (const w of werte) {
      const ist = await setzeRegler(page, regler, w);
      gemessen.push([ist, skala(await zeichnung(page, mount), ist)]);
    }
    const [, s0] = gemessen[0];
    for (const [w, sk] of gemessen) {
      pruefe(Math.abs(sk - s0) < 0.003 * s0, `Maßstab ${name}: bei ${regler} = ${w} ${de(sk, 2)} px/cm, bei ${gemessen[0][0]} aber ${de(s0, 2)} px/cm — die Änderung wäre im Bild nicht zu sehen`);
    }
  }
}

// ── Abschnitt 3b: Ringe zum Dreieck ───────────────────────────────────────
//
// Der Maßstab kommt aus dem Mittelpunkt M bei (0 | r) und dem tiefsten Punkt aller Ringe bei
// (0 | 0): Er bleibt beim Aufbiegen liegen.
function ringSkala(z, r) {
  const alle = mitRolle(z, "ring").flatMap((s) => s.punkte);
  const unten = Math.max(...alle.map((p) => p.y));
  return (unten - z.namen.M.y) / r;
}
async function ringe(page) {
  for (const r of [1.5, 2.5, 3]) {
    await setzeRegler(page, "ri-r", r);
    for (const n of [2, 5, 12]) {
      await setzeRegler(page, "ri-n", n);
      const w = r / n;
      for (const tProzent of [0, 30, 70, 100]) {
        const t = (await setzeRegler(page, "ri-t", tProzent)) / 100;
        const wo = `r = ${r}, ${n} Ringe, Aufbiegen ${tProzent} %`;
        const z = await zeichnung(page, "ri-mount");
        const streifen = mitRolle(z, "ring");
        pruefe(streifen.length === n, `Ringe: ${wo} — ${streifen.length} Ringe statt ${n}`);
        const skala = ringSkala(z, r);
        let summe = 0;
        for (const s of streifen) {
          const i = Number(s.nr), rho = r - (i + 0.5) * w;
          const soll = 2 * Math.PI * rho * w;
          const ist = flaeche(s.punkte) / (skala * skala);
          summe += ist;
          pruefe(Math.abs(ist - soll) < 0.003 * soll + 0.002, `Ringe: ${wo} — Ring ${i} hat ${de(ist, 4)} cm² statt ${de(soll, 4)} cm²`);
          if (t === 0) {
            // Vor dem Aufbiegen: wirklich der Ring zwischen den Radien r − i·w und r − (i+1)·w.
            const ab = s.punkte.map((p) => abstand(p, z.namen.M) / skala);
            pruefe(Math.abs(Math.max(...ab) - (r - i * w)) < 0.01 && Math.abs(Math.min(...ab) - (r - (i + 1) * w)) < 0.01, `Ringe: ${wo} — Ring ${i} liegt nicht zwischen den richtigen Radien`);
          }
          if (t === 1) {
            // Gerade: ein Rechteck, so lang wie die Mitte des Rings, so breit wie der Ring, mittig.
            const xs = s.punkte.map((p) => p.x), ys = s.punkte.map((p) => p.y);
            const lang = (Math.max(...xs) - Math.min(...xs)) / skala, hoch = (Math.max(...ys) - Math.min(...ys)) / skala;
            pruefe(Math.abs(lang - 2 * Math.PI * rho) < 0.02 && Math.abs(hoch - w) < 0.01, `Ringe: ${wo} — Streifen ${i} ist ${de(lang, 3)} × ${de(hoch, 3)} cm statt ${de(2 * Math.PI * rho, 3)} × ${de(w, 3)} cm`);
            pruefe(Math.abs((Math.max(...xs) + Math.min(...xs)) / 2 - z.namen.M.x) < 0.6, `Ringe: ${wo} — Streifen ${i} liegt nicht mittig`);
          }
        }
        pruefe(Math.abs(summe - Math.PI * r * r) < 0.003 * Math.PI * r * r, `Ringe: ${wo} — die Ringe haben zusammen ${de(summe, 3)} cm² statt π · r²`);
        if (t > 0) {
          const [dreieck] = mitRolle(z, "dreieck");
          pruefe(!!dreieck && Math.abs(flaeche(dreieck.punkte) / skala ** 2 - Math.PI * r * r) < 0.003 * Math.PI * r * r, `Ringe: ${wo} — das Dreieck hat nicht den Flächeninhalt π · r²`);
          if (dreieck) {
            const basis = abstand(dreieck.punkte[0], dreieck.punkte[1]) / skala;
            pruefe(Math.abs(basis - 2 * Math.PI * r) < 0.02 && abstand(dreieck.punkte[2], z.namen.M) < 0.6, `Ringe: ${wo} — das Dreieck hat nicht die Grundseite U und die Spitze in M`);
          }
        }
        const bilanz = await text(page, "#ri-bilanz");
        pruefe(bilanz.includes(`U = 2 · π · r ≈ ${de2(2 * Math.PI * r)} cm`) && bilanz.includes(`A = ½ · U · r = ½ · 2 · π · r · r = π · r² ≈ ${de2(Math.PI * r * r)} cm²`),
          `Ringe: ${wo} — die Bilanz stimmt nicht — „${bilanz}“`);
      }
    }
  }
}

// ── Abschnitt 4, erster Weg: großer Kreis minus kleiner Kreis ─────────────
//
// Der Maßstab kommt aus dem Radius R, einer Linie bekannter Länge. Nachgemessen wird: Der Ring ist
// wirklich ein Ring zwischen r und R um M und hat π · (R² − r²); die kleine Scheibe ist ein Kreis mit
// dem Radius r und behält auf dem ganzen Weg ihren Flächeninhalt π · r² — sie wird nur waagerecht
// verschoben; am Anfang füllt sie genau das Loch, am Ende liegt sie ganz außerhalb des großen
// Kreises; Ring und Scheibe ergeben zusammen π · R².
const mittelpunkt = (punkte) => ({
  x: punkte.reduce((a, p) => a + p.x, 0) / punkte.length,
  y: punkte.reduce((a, p) => a + p.y, 0) / punkte.length,
});
async function kreisDifferenz(page) {
  for (const [R, rWunsch] of [[3, 1.5], [2.5, 2], [1.5, 0.5], [3, 2.75], [2, 1.75], [1.5, 1.5]]) {
    await setzeRegler(page, "kd-gr", R);
    const r = await setzeRegler(page, "kd-kl", rWunsch);
    const erwartet = Math.min(rWunsch, R - 0.5);
    pruefe(Math.abs(r - erwartet) < 1e-9, `Kreis minus Kreis: R = ${R}, gewünscht r = ${rWunsch} — der Regler steht auf ${r} statt ${erwartet}`);
    const anzeige = await text(page, "#kd-kl-anzeige");
    pruefe(anzeige === `${de(r)} cm`, `Kreis minus Kreis: R = ${R} — die Anzeige „${anzeige}“ passt nicht zum Regler ${r}`);
    const A = Math.PI * (R * R - r * r), Ak = Math.PI * r * r, Ag = Math.PI * R * R;
    let skalaAnfang = null, xVorher = -Infinity;
    for (const tProzent of [0, 26, 50, 74, 100]) {
      const t = (await setzeRegler(page, "kd-t", tProzent)) / 100;
      const wo = `R = ${R}, r = ${r}, Herausheben ${tProzent} %`;
      const z = await zeichnung(page, "kd-mount");
      const M = z.namen.M;
      const [radiusR] = mitRolle(z, "R");
      const skala = laenge(radiusR.punkte) / R;
      pruefe(abstand(radiusR.punkte[0], M) < 0.6, `Kreis minus Kreis: ${wo} — der Radius R beginnt nicht in M`);
      // Die Bühne hängt nicht von t ab: Sonst sähe die Scheibe größer oder kleiner aus, während sie wandert.
      if (t === 0) skalaAnfang = skala;
      else pruefe(Math.abs(skala - skalaAnfang) < 1e-3, `Kreis minus Kreis: ${wo} — der Maßstab ändert sich beim Herausheben`);

      const [ring] = mitRolle(z, "ring");
      pruefe(!!ring && ring.wege && ring.wege.length === 2 && ring.fuellregel === "evenodd", `Kreis minus Kreis: ${wo} — der Ring ist keine Fläche mit Loch`);
      if (!ring || !ring.wege || ring.wege.length !== 2) continue;
      const [aussen, innen] = ring.wege;
      const ringFl = (flaeche(aussen) - flaeche(innen)) / (skala * skala);
      pruefe(Math.abs(ringFl - A) < 0.003 * A, `Kreis minus Kreis: ${wo} — der Ring hat ${de(ringFl, 3)} cm² statt π · (R² − r²) = ${de(A, 3)} cm²`);
      pruefe(aussen.every((p) => Math.abs(abstand(p, M) / skala - R) < 0.01) && innen.every((p) => Math.abs(abstand(p, M) / skala - r) < 0.01),
        `Kreis minus Kreis: ${wo} — der Ring liegt nicht zwischen den Kreisen mit r und R um M`);

      const [klein] = mitRolle(z, "klein");
      const C = mittelpunkt(klein.punkte);
      pruefe(klein.punkte.every((p) => Math.abs(abstand(p, C) / skala - r) < 0.01), `Kreis minus Kreis: ${wo} — die kleine Scheibe ist kein Kreis mit dem Radius ${de(r)} cm mehr`);
      const kleinFl = flaeche(klein.punkte) / (skala * skala);
      pruefe(Math.abs(kleinFl - Ak) < 0.003 * Ak, `Kreis minus Kreis: ${wo} — die kleine Scheibe hat ${de(kleinFl, 3)} cm² statt π · r² = ${de(Ak, 3)} cm²`);
      pruefe(Math.abs(ringFl + kleinFl - Ag) < 0.003 * Ag, `Kreis minus Kreis: ${wo} — Ring und Scheibe ergeben zusammen ${de(ringFl + kleinFl, 3)} cm² statt π · R² = ${de(Ag, 3)} cm²`);
      // Starr und nur verschoben: waagerecht, von M weg, nie zurück.
      pruefe(Math.abs(C.y - M.y) < 0.6 && C.x >= xVorher - 0.01, `Kreis minus Kreis: ${wo} — die Scheibe wandert nicht waagerecht von M weg`);
      xVorher = C.x;
      if (t === 0) pruefe(abstand(C, M) < 0.6, `Kreis minus Kreis: ${wo} — die kleine Scheibe füllt am Anfang nicht genau das Loch`);
      if (t === 1) pruefe(abstand(C, M) / skala >= R + r + 0.1, `Kreis minus Kreis: ${wo} — die herausgehobene Scheibe liegt noch im großen Kreis`);
      if (t > 0) {
        const [loch] = mitRolle(z, "loch");
        pruefe(!!loch && Math.abs(loch.r / skala - r) < 0.01 && abstand(loch.c, M) < 0.6, `Kreis minus Kreis: ${wo} — das Loch ist nicht als Kreis mit dem Radius r um M zu sehen`);
      }
      const bilanz = await text(page, "#kd-bilanz");
      pruefe(bilanz.includes(`π · R² = π · ${de(R * R)} cm² ≈ ${de2(Ag)} cm²`) && bilanz.includes(`π · r² = π · ${de(r * r)} cm² ≈ ${de2(Ak)} cm²`)
        && bilanz.includes(`A = π · R² − π · r² = π · (R² − r²) = π · (${de(R * R)} − ${de(r * r)}) cm² = π · ${de(R * R - r * r)} cm² ≈ ${de2(A)} cm²`),
      `Kreis minus Kreis: ${wo} — die Bilanz stimmt nicht — „${bilanz}“`);
    }
  }
}

// ── Abschnitt 4, zweiter Weg: Kreisring aufbiegen ─────────────────────────
async function kreisring(page) {
  for (const [R, rWunsch] of [[3, 1.5], [2.5, 2], [1.5, 0.5], [3, 2.5], [2, 1.75]]) {
    await setzeRegler(page, "kr-gr", R);
    const r = await setzeRegler(page, "kr-kl", rWunsch);
    const erwartet = Math.min(rWunsch, R - 0.5);
    pruefe(Math.abs(r - erwartet) < 1e-9, `Kreisring: R = ${R}, gewünscht r = ${rWunsch} — der Regler steht auf ${r} statt ${erwartet}`);
    const anzeige = await text(page, "#kr-kl-anzeige");
    pruefe(anzeige === `${de(r)} cm`, `Kreisring: R = ${R} — die Anzeige „${anzeige}“ passt nicht zum Regler ${r}`);
    const A = Math.PI * (R * R - r * r);
    for (const tProzent of [0, 34, 68, 100]) {
      const t = (await setzeRegler(page, "kr-t", tProzent)) / 100;
      const wo = `R = ${R}, r = ${r}, Aufbiegen ${tProzent} %`;
      const z = await zeichnung(page, "kr-mount");
      const [ring] = mitRolle(z, "ring");
      const alle = ring.punkte;
      const unten = Math.max(...alle.map((p) => p.y));
      const M = t === 0 ? z.namen.M : null;
      // Maßstab: vor dem Aufbiegen aus dem Außenradius, danach aus der Ringbreite am Rechteck.
      let skala;
      if (M) skala = (unten - M.y) / R;
      else {
        const ys = alle.map((p) => p.y);
        skala = t === 1 ? (Math.max(...ys) - Math.min(...ys)) / (R - r) : null;
      }
      if (skala === null) {
        // Unterwegs: Der Maßstab bleibt derselbe wie am Anfang — der Ring liegt mit seinem tiefsten
        // Punkt auf, und die Bühne hängt nicht von t ab.
        skala = kreisringSkala;
      }
      if (t === 0) kreisringSkala = skala;
      const ist = flaeche(alle) / (skala * skala);
      pruefe(Math.abs(ist - A) < 0.003 * A, `Kreisring: ${wo} — der Ring hat ${de(ist, 3)} cm² statt ${de(A, 3)} cm²`);
      if (t === 0) {
        const ab = alle.map((p) => abstand(p, M) / skala);
        pruefe(Math.abs(Math.max(...ab) - R) < 0.01 && Math.abs(Math.min(...ab) - r) < 0.01, `Kreisring: ${wo} — der Ring liegt nicht zwischen r und R`);
      }
      if (t === 1) {
        const xs = alle.map((p) => p.x);
        const lang = (Math.max(...xs) - Math.min(...xs)) / skala;
        pruefe(Math.abs(lang - Math.PI * (R + r)) < 0.02, `Kreisring: ${wo} — das Rechteck ist ${de(lang, 3)} cm lang statt π · (R + r) = ${de(Math.PI * (R + r), 3)} cm`);
        const [trapez] = mitRolle(z, "trapez");
        pruefe(!!trapez && Math.abs(abstand(trapez.punkte[0], trapez.punkte[1]) / skala - 2 * Math.PI * R) < 0.02
          && Math.abs(abstand(trapez.punkte[2], trapez.punkte[3]) / skala - 2 * Math.PI * r) < 0.02
          && Math.abs(flaeche(trapez.punkte) / skala ** 2 - A) < 0.003 * A,
        `Kreisring: ${wo} — das Trapez hat nicht die Umfänge als parallele Seiten oder nicht den Flächeninhalt des Rings`);
      }
      const bilanz = await text(page, "#kr-bilanz");
      pruefe(bilanz.includes(`A = π · (R² − r²) = π · (${de(R * R)} − ${de(r * r)}) cm² ≈ ${de2(A)} cm²`)
        && bilanz.includes(`A = π · (R + r) · (R − r) = π · ${de(R + r)} · ${de(R - r)} cm² ≈ ${de2(A)} cm²`),
        `Kreisring: ${wo} — die Bilanz stimmt nicht — „${bilanz}“`);
    }
  }
}
let kreisringSkala = null;

// ── Abschnitt 5: Kreisbogen ───────────────────────────────────────────────
async function bogen(page) {
  for (const r of [1.5, 2.5, 3]) {
    await setzeRegler(page, "bo-r", r);
    for (const alpha of [10, 90, 150, 270, 360]) {
      await setzeRegler(page, "bo-a", alpha);
      const b = (alpha / 360) * 2 * Math.PI * r;
      for (const tProzent of [0, 40, 80, 100]) {
        const t = (await setzeRegler(page, "bo-t", tProzent)) / 100;
        const wo = `r = ${r}, α = ${alpha}°, Abrollen ${tProzent} %`;
        const z = await zeichnung(page, "bo-mount");
        const radius = z.teile.find((e) => e.klasse === "kr-radius");
        const skala = laenge(radius.punkte) / r;
        const [bg] = mitRolle(z, "bogen");
        const [umfang] = mitRolle(z, "umfang");
        const [anteil] = mitRolle(z, "anteil");
        pruefe(Math.abs(laenge(umfang.punkte) / skala - 2 * Math.PI * r) < 0.02, `Bogen: ${wo} — der Umfang unter dem Boden misst nicht 2 · π · r`);
        pruefe(Math.abs(laenge(anteil.punkte) / skala - b) < 0.02, `Bogen: ${wo} — der Anteil unter dem Boden misst nicht ${de(b, 3)} cm`);
        pruefe(Math.abs(laenge(bg.punkte) / skala - b) < 0.003 * b + 0.01, `Bogen: ${wo} — der Bogen misst ${de(laenge(bg.punkte) / skala, 3)} cm statt ${de(b, 3)} cm`);
        const M = z.namen.M;
        if (t === 0) pruefe(bg.punkte.every((p) => Math.abs(abstand(p, M) / skala - r) < 0.01), `Bogen: ${wo} — der Bogen liegt nicht auf dem Kreis`);
        if (t === 1) pruefe(bg.punkte.every((p) => Math.abs(p.y - bg.punkte[0].y) < 0.6), `Bogen: ${wo} — der abgerollte Bogen liegt nicht gerade auf dem Boden`);
        // Er beginnt immer im tiefsten Punkt des Kreises.
        pruefe(Math.abs(bg.punkte[0].x - M.x) < 0.6 && Math.abs((bg.punkte[0].y - M.y) / skala - r) < 0.01, `Bogen: ${wo} — der Bogen beginnt nicht im tiefsten Punkt`);
        const bilanz = await text(page, "#bo-bilanz");
        pruefe(bilanz.includes(`U = 2 · π · r ≈ ${de2(2 * Math.PI * r)} cm`) && bilanz.includes(`b = ${alpha}° : 360° · 2 · π · ${de(r)} cm ≈ ${de2(b)} cm`),
          `Bogen: ${wo} — die Bilanz stimmt nicht — „${bilanz}“`);
      }
    }
  }
}

// ── Abschnitt 6: Kreisausschnitt ──────────────────────────────────────────
async function ausschnitt(page) {
  for (const [r, alpha, k] of [[3, 120, 6], [2, 30, 2], [4, 360, 16], [2.5, 250, 8], [3.5, 90, 10]]) {
    await setzeRegler(page, "au-r", r);
    await setzeRegler(page, "au-a", alpha);
    await setzeRegler(page, "au-k", k);
    const A = (alpha / 360) * Math.PI * r * r, b = (alpha / 360) * 2 * Math.PI * r;
    for (const tProzent of [0, 50, 100]) {
      const t = (await setzeRegler(page, "au-t", tProzent)) / 100;
      const wo = `r = ${r}, α = ${alpha}°, ${k} Teile, Umlegen ${tProzent} %`;
      const z = await zeichnung(page, "au-mount");
      const kreis = z.teile.find((e) => e.tag === "circle");
      const skala = kreis.r / r;
      const teile = mitRolle(z, "stueck");
      pruefe(teile.length === k, `Ausschnitt: ${wo} — ${teile.length} Teile statt ${k}`);
      let summe = 0;
      for (const s of teile) {
        const [spitze, ...bg] = s.punkte;
        summe += flaeche(s.punkte) / (skala * skala);
        pruefe(bg.every((p) => Math.abs(abstand(p, spitze) / skala - r) < 0.01), `Ausschnitt: ${wo} — Teil ${s.nr} ist kein Ausschnitt mit dem Radius ${r} cm mehr`);
      }
      pruefe(Math.abs(summe - A) < 0.003 * A, `Ausschnitt: ${wo} — die Teile haben zusammen ${de(summe, 3)} cm² statt ${de(A, 3)} cm²`);
      if (t === 1) {
        // Unten liegen die Bögen der halben Teile: zusammen b : 2.
        const unten = teile.filter((s) => s.punkte.slice(1).every((p) => p.y > s.punkte[0].y));
        const bogenUnten = unten.reduce((acc, s) => acc + laenge(s.punkte.slice(1)), 0) / skala;
        pruefe(unten.length === k / 2 && Math.abs(bogenUnten - b / 2) < 0.003 * b + 0.01, `Ausschnitt: ${wo} — unten liegen ${unten.length} Bögen mit ${de(bogenUnten, 3)} cm statt b : 2 = ${de(b / 2, 3)} cm`);
      }
      const bilanz = await text(page, "#au-bilanz");
      pruefe(bilanz.includes(`b = α : 360° · 2 · π · r ≈ ${de2(b)} cm`) && bilanz.includes(`A = α : 360° · π · r² ≈ ${de2(A)} cm²`) && bilanz.includes(`A = ½ · b · r ≈ ${de2(A)} cm²`),
        `Ausschnitt: ${wo} — die Bilanz stimmt nicht — „${bilanz}“`);
    }
  }
}

// ── Die Dreisatz-Tabellen in Abschnitt 5 und 6 ────────────────────────────
//
// Die Tabelle leitet den Anteil her, BEVOR die Zeichnung ihn zeigt: Sie steht im Abschnitt vor dem
// Regler. Nachgerechnet wird jede Zeile: Der Rechenschritt links führt vom Winkel der Zeile darüber
// auf den Winkel dieser Zeile, rechts steht derselbe Schritt, der Anteil ist Winkel : 360°
// (gekürzt), und das Ergebnis ist Anteil · Ganzes.
const ggT = (a, b) => (b ? ggT(b, a % b) : a);
async function tabellen(page) {
  for (const [sec, id, mount, ganzes] of [["sec-bogen", "bo-tabelle", "bo-mount", "2 · π · r"], ["sec-ausschnitt", "au-tabelle", "au-mount", "π · r²"]]) {
    const tab = await page.evaluate(([s, i, m]) => {
      const t = document.getElementById(i);
      if (!t) return null;
      // Brüche als „z/n“ lesen: innerText gäbe Zähler und Nenner je nach Satz auf zwei Zeilen.
      const lesbar = (td) => {
        const k = td.cloneNode(true);
        for (const b of k.querySelectorAll(".bruch")) b.replaceWith(`${b.querySelector(".z").textContent}/${b.querySelector(".n").textContent}`);
        return k.textContent.replace(/\s+/g, " ").trim();
      };
      return {
        imAbschnitt: !!t.closest("#" + s),
        vorDerZeichnung: !!(t.compareDocumentPosition(document.getElementById(m)) & Node.DOCUMENT_POSITION_FOLLOWING),
        zeilen: [...t.querySelectorAll("tbody tr")].map((tr) => [...tr.children].map(lesbar)),
      };
    }, [sec, id, mount]);
    pruefe(!!tab, `Tabelle: ${sec} hat keine Dreisatz-Tabelle #${id}`);
    if (!tab) continue;
    pruefe(tab.imAbschnitt && tab.vorDerZeichnung, `Tabelle ${id}: steht nicht in ${sec} vor der Zeichnung`);
    const winkel = tab.zeilen.map((z) => z[1]);
    pruefe(JSON.stringify(winkel) === JSON.stringify(["360°", "180°", "90°", "1°", "α"]), `Tabelle ${id}: Winkel ${winkel.join(", ")} statt 360°, 180°, 90°, 1°, α`);
    tab.zeilen.forEach((z, i) => {
      const [links, w, anteil, ergebnis, rechts] = z;
      const wo = `Tabelle ${id}, Zeile ${w}`;
      pruefe(z.length === 5, `${wo}: ${z.length} Zellen statt 5`);
      pruefe(links === rechts, `${wo}: links steht „${links}“, rechts „${rechts}“ — beim Dreisatz geschieht auf beiden Seiten dasselbe`);
      const zahl = w === "α" ? null : Number(w.replace("°", ""));
      if (i === 0) pruefe(links === "", `${wo}: die erste Zeile hat einen Rechenschritt`);
      else {
        const vorher = tab.zeilen[i - 1][1] === "α" ? null : Number(tab.zeilen[i - 1][1].replace("°", ""));
        const m = links.match(/^↓ ([:·]) (\d+|α)$/);
        pruefe(!!m, `${wo}: der Rechenschritt „${links}“ ist nicht lesbar`);
        if (m && zahl !== null) pruefe(m[1] === ":" && Math.abs(vorher / Number(m[2]) - zahl) < 1e-12, `${wo}: ${vorher}° ${m[1]} ${m[2]} ergibt nicht ${w}`);
        if (m && zahl === null) pruefe(m[1] === "·" && m[2] === "α" && vorher === 1, `${wo}: auf α kommt man nur von 1° mit · α, nicht mit „${links}“`);
      }
      let soll;
      if (zahl === null) soll = "α/360°";
      else if (zahl === 360) soll = "1";
      else { const g = ggT(zahl, 360); soll = `${zahl / g}/${360 / g}`; }
      pruefe(anteil === soll, `${wo}: Anteil „${anteil}“ statt ${soll}`);
      const sollErgebnis = soll === "1" ? ganzes : `${soll} · ${ganzes}`;
      pruefe(ergebnis === sollErgebnis, `${wo}: „${ergebnis}“ statt ${sollErgebnis}`);
    });
  }
}

// ── Die Kontrollfragen ────────────────────────────────────────────────────
async function quizze(page) {
  const ids = await page.evaluate(() => [...document.querySelectorAll(".quiz")].map((e) => e.id));
  pruefe(ids.length === 9, `Kontrollfragen: ${ids.length} statt 9`);
  // Jeder Erarbeitungsabschnitt hat seine eigene Kontrollfrage.
  for (const sec of ["sec-umfang", "sec-radius", "sec-flaeche", "sec-ring", "sec-bogen", "sec-ausschnitt"]) {
    const n = await page.evaluate((s) => document.querySelectorAll(`#${s} .quiz`).length, sec);
    pruefe(n >= 1, `Kontrollfragen: Abschnitt ${sec} hat keine`);
  }
  // Bei den Rechenfragen wird die Lösung hier unabhängig nachgerechnet: Als richtig markiert sein
  // muss genau die Antwort, in der sie steht — sonst lobte die Seite eine falsche Rechnung.
  const LOESUNG = {
    "quiz-umfang": de(Math.round(P * 50)),                 // U = π · 50 cm
    "quiz-radius": de2(2 * P * 5),                         // U = 2 · π · 5 cm
    "quiz-flaeche": de2(P * 5 * 5),                        // d = 10 cm, also r = 5 cm
    "quiz-ring": de2(P * (36 - 16)),                       // R = 6 cm, r = 4 cm
    "quiz-ring-aufbiegen": `${de2(P * (7 + 3))} cm lang und ${de(7 - 3)} cm breit`,   // π · (R + r) und R − r
    "quiz-bogen": `${de(24 * 60 / 360)} cm`,               // 60° von 24 cm
    "quiz-ausschnitt": `${de(0.5 * 5 * 6)} cm²`,           // ½ · b · r
  };
  const stellen = [];
  for (const id of ids) {
    const optionen = await page.evaluate((q) => [...document.querySelectorAll(`#${q} .quiz-opt`)].map((b) => b.textContent.trim()), id);
    const anzahl = optionen.length;
    pruefe(anzahl === 4, `Quiz ${id}: ${anzahl} Antwortmöglichkeiten statt 4`);
    let richtige = 0;
    for (let i = 0; i < anzahl; i++) {
      await page.locator(`#${id} .quiz-opt`).nth(i).click();
      const r = await page.evaluate((q) => {
        const f = document.querySelector(`#${q} .quiz-feedback`);
        return { ok: f.classList.contains("ok"), text: f.textContent };
      }, id);
      if (r.ok) {
        richtige++;
        stellen.push(i);
        if (LOESUNG[id]) pruefe(optionen[i].includes(LOESUNG[id]), `Quiz ${id}: als richtig gilt „${optionen[i]}“, nachgerechnet ist ${LOESUNG[id]}`);
      }
      pruefe(r.text.length > 80, `Quiz ${id}, Antwort ${i + 1}: die Erklärung ist nur ${r.text.length} Zeichen lang`);
    }
    pruefe(richtige === 1, `Quiz ${id}: ${richtige} Antworten gelten als richtig, erwartet genau eine`);
  }
  pruefe(new Set(stellen).size >= 3, `Kontrollfragen: die richtige Antwort steht nur an ${new Set(stellen).size} verschiedenen Stellen (${stellen.join(", ")})`);
}

// ── Die Übungsaufgaben ────────────────────────────────────────────────────

const zahl = (s) => Number(String(s).replace(/−/g, "-").replace(/\.(?=\d{3}\b)/g, "").replace(",", "."));
const LAENGE = { mm: 0.1, cm: 1, dm: 10, m: 100 };
const FLAECHE = { "mm²": 0.01, "cm²": 1, "dm²": 100, "m²": 10000 };
const P = Math.PI;
// π ≈ 3,14 zählt nur als eigener Fehler, wenn es das gerundete Ergebnis sichtbar verschiebt.
const mit314 = (soll, wert) => (Math.abs(wert - soll) > 0.05 ? wert : NaN);

// Die Maße einer Aufgabenfigur stehen im SVG, nicht im Text — gelesen wird die Zeichnung.
async function figur(page, box) {
  return page.evaluate((sel) => {
    const svg = document.querySelector(`${sel} .aufgabe-prompt svg`);
    if (!svg) return null;
    return { art: svg.dataset.figur, texte: [...svg.querySelectorAll("text")].map((t) => t.textContent) };
  }, box);
}
const mass = (roh, name) => {
  const t = roh.texte.find((x) => new RegExp(`^${name} = `).test(x));
  return t ? zahl(t.replace(/^.* = /, "").replace(/ ?(cm|°)$/, "")) : NaN;
};

// Für alle Aufgaben mit gerundetem Ergebnis: Die richtige Antwort wird gerundet eingetippt, wie es
// ein Mensch täte, und muss in der Musterlösung mit zwei Stellen stehen.
function gerundet(name, richtig, falsch, extra = () => {}) {
  return {
    richtig: rund2(richtig),
    toleranz: 0.03,
    falsch: falsch.map(([w, m]) => [Number.isFinite(w) ? rund2(w) : w, m]),
    pruefe: (f, rueck) => {
      pruefe(rueck.includes(de2(richtig)), `${name}: das Ergebnis ${de2(richtig)} fehlt in der Musterlösung — „${f}“`);
      extra(f, rueck);
    },
  };
}

// Die Schranken für `mindestensVerschieden` sind gemessen, nicht geschätzt — mit
//
//   UPLANT_ZUEGE=25 node tests/werkzeug-streuung.js /mathematik/klasse-8/geometrie/kreis.html
//
// (25, weil hier mit `runden: 25` geprüft wird; die Schranke hängt an der Rundenzahl).
// Gemessen am 2026-11-03, sichere Schranke je Aufgabe:
//
//   A1 12   A2 13   A3 18   A4 20   A5 19   A6 21
//   A7 11   A8 14   A9 20   A10 14  A11 18  A12 17
//
// Eingetragen ist jeweils eine weniger: Eine zu hohe Schranke macht den Gesamtlauf launisch, und
// geprüft wird ja, ob ein Generator überhaupt streut, nicht wie gut.
const SCHRANKE = [11, 12, 17, 19, 18, 20, 10, 13, 19, 13, 17, 16];

async function aufgaben(page) {
  // ---- einfach: aus der Zeichnung ----
  await pruefeAufgabe(page, bericht, {
    nr: 1, name: "A1 Kreis ablesen", runden: 25, mindestensVerschieden: SCHRANKE[0],
    liesRoh: figur,
    deute: (frage, roh) => {
      if (!roh || roh.art !== "kreis") return null;
      const rGeg = mass(roh, "r"), dGeg = mass(roh, "d");
      const art = Number.isFinite(rGeg) ? "r" : Number.isFinite(dGeg) ? "d" : null;
      if (!art) return null;
      const r = art === "r" ? rGeg : dGeg / 2, d = 2 * r;
      const umfang = /Umfang/.test(frage);
      if (!umfang && !/Flächeninhalt/.test(frage)) return null;
      const soll = umfang ? 2 * P * r : P * r * r;
      const falsch = umfang
        ? (art === "r"
          ? [[P * r, "π · r gerechnet"], [P * r * r, "Flächeninhalt π · r²"], [d, "nur der Durchmesser"]]
          : [[2 * P * d, "wie einen Radius behandelt"], [P * r * r, "Flächeninhalt π · r²"], [d, "nur der Durchmesser"]])
        : (art === "r"
          ? [[2 * P * r, "Umfang 2 · π · r"], [P * r, "Quadrieren vergessen"], [P * d * d, "Vierfache"]]
          : [[P * d * d, "Vierfache"], [P * d, "Umfang 2 · π · r"], [P * r, "Quadrieren vergessen"]]);
      falsch.push([mit314(soll, umfang ? 2 * 3.14 * r : 3.14 * r * r), "π ≈ 3,14"]);
      return gerundet("A1", soll, falsch, (f, rueck) => {
        pruefe(rueck.includes(art === "r" ? `r = ${de(r)} cm` : `d = ${de(d)} cm`), `A1: das abgelesene Maß fehlt in der Musterlösung — „${f}“`);
      });
    },
  });

  await pruefeAufgabe(page, bericht, {
    nr: 2, name: "A2 Kreisring ablesen", runden: 25, mindestensVerschieden: SCHRANKE[1],
    liesRoh: figur,
    deute: (frage, roh) => {
      if (!roh || roh.art !== "ring") return null;
      const R = mass(roh, "R"), r = mass(roh, "r");
      if (!(R > r && r > 0)) return null;
      const soll = P * (R * R - r * r);
      return gerundet("A2", soll, [
        [P * (R - r) ** 2, "π · (R − r)²"], [P * R * R, "große Kreis allein"], [P * (R * R + r * r), "addiert"],
        [2 * P * (R - r), "Unterschied der beiden Umfänge"], [mit314(soll, 3.14 * (R * R - r * r)), "π ≈ 3,14"],
      ]);
    },
  });

  await pruefeAufgabe(page, bericht, {
    nr: 3, name: "A3 Ausschnitt ablesen", runden: 25, mindestensVerschieden: SCHRANKE[2],
    liesRoh: figur,
    deute: (frage, roh) => {
      if (!roh || roh.art !== "sektor") return null;
      const r = mass(roh, "r"), alpha = mass(roh, "α");
      if (!(r > 0 && alpha > 0)) return null;
      const anteil = alpha / 360, b = anteil * 2 * P * r, A = anteil * P * r * r;
      const istBogen = /Kreisbogens/.test(frage);
      return istBogen
        ? gerundet("A3", b, [[2 * P * r, "ganze Kreis"], [A, "Flächeninhalt des Ausschnitts"], [b + 2 * r, "beiden Radien"], [anteil * P * r, "Anteil von π · r"], [mit314(b, anteil * 2 * 3.14 * r), "π ≈ 3,14"]])
        : gerundet("A3", A, [[P * r * r, "ganze Kreis"], [b, "Bogenlänge"], [4 * A, "Vierfache"], [mit314(A, anteil * 3.14 * r * r), "π ≈ 3,14"]]);
    },
  });

  // ---- mittel: mit Einheiten ----
  await pruefeAufgabe(page, bericht, {
    nr: 4, name: "A4 Kreis mit Einheiten", runden: 25, mindestensVerschieden: SCHRANKE[3],
    deute: (frage) => {
      const m = frage.match(/hat (den Radius|den Durchmesser) (r|d) = ([\d.,]+) (mm|cm|dm|m)\b.*Berechne (seinen Umfang|seinen Flächeninhalt) in (mm²|cm²|dm²|m²|mm|cm|dm|m)(?=\.)/);
      if (!m) return null;
      const art = m[2], wert = zahl(m[3]), eG = m[4], ziel = m[6];
      const rCm = (art === "r" ? wert : wert / 2) * LAENGE[eG], rNaiv = art === "r" ? wert : wert / 2;
      if (/Umfang/.test(m[5])) {
        const f = LAENGE[ziel], soll = (2 * P * rCm) / f;
        return gerundet("A4", soll, [
          [2 * P * rNaiv, "ohne die Einheit umzurechnen"],
          [art === "r" ? (P * rCm) / f : (4 * P * rCm) / f, art === "r" ? "halbe Umfang" : "doppelte Umfang"],
          [mit314(soll, (2 * 3.14 * rCm) / f), "π ≈ 3,14"],
        ]);
      }
      const f = FLAECHE[ziel], soll = (P * rCm * rCm) / f;
      const linear = LAENGE[eG] / LAENGE[ziel.replace("²", "")];
      return gerundet("A4", soll, [
        [P * rNaiv * rNaiv, "ohne die Einheit umzurechnen"], [P * rNaiv * rNaiv * linear, "zweimal"],
        [(4 * P * rCm * rCm) / f, "Vierfache"], [mit314(soll, (3.14 * rCm * rCm) / f), "π ≈ 3,14"],
      ]);
    },
  });

  await pruefeAufgabe(page, bericht, {
    nr: 5, name: "A5 Unterlegscheibe", runden: 25, mindestensVerschieden: SCHRANKE[4],
    deute: (frage) => {
      const m = frage.match(/Außendurchmesser ([\d.,]+) mm und dem Innendurchmesser ([\d.,]+) mm.*in (cm²|mm²)/);
      if (!m) return null;
      const D = zahl(m[1]), d = zahl(m[2]), ziel = m[3], f = ziel === "cm²" ? 100 : 1;
      const R = D / 2, r = d / 2, soll = (P * (R * R - r * r)) / f;
      return gerundet("A5", soll, [
        [(P * (D * D - d * d)) / f, "wie Radien eingesetzt"],
        [ziel === "cm²" ? P * (R * R - r * r) : NaN, "Fläche in mm²"],
        [ziel === "cm²" ? (P * (R * R - r * r)) / 10 : NaN, "Faktor zweimal"],
        [(P * (R - r) ** 2) / f, "π · (R − r)²"],
        [mit314(soll, (3.14 * (R * R - r * r)) / f), "π ≈ 3,14"],
      ]);
    },
  });

  await pruefeAufgabe(page, bericht, {
    nr: 6, name: "A6 Ausschnitt aus Bogen und Radius", runden: 25, mindestensVerschieden: SCHRANKE[5],
    deute: (frage) => {
      const m = frage.match(/Radius r = ([\d.,]+) (cm|dm|m) und den Bogen b = ([\d.,]+) (cm|dm|m)\b.*in (cm²|dm²)/);
      if (!m) return null;
      const rCm = zahl(m[1]) * LAENGE[m[2]], bCm = zahl(m[3]) * LAENGE[m[4]], f = FLAECHE[m[5]];
      const soll = (0.5 * bCm * rCm) / f;
      pruefe(bCm <= 2 * P * rCm, `A6: der Bogen ist länger als der ganze Umfang — „${frage}“`);
      return {
        richtig: soll, toleranz: 1e-4,
        falsch: [[(bCm * rCm) / f, "b · r gerechnet"], [0.5 * zahl(m[3]) * zahl(m[1]), "ohne umzurechnen"], [(P * rCm * rCm) / f, "ganze Kreis π · r²"]],
        pruefe: (f2, rueck) => pruefe(rueck.includes(`${de(soll)} ${m[5]}`), `A6: das Ergebnis ${de(soll)} ${m[5]} fehlt in der Musterlösung — „${f2}“`),
      };
    },
  });

  // ---- schwierig: rückwärts ----
  await pruefeAufgabe(page, bericht, {
    nr: 7, name: "A7 Radius oder Durchmesser aus dem Umfang", runden: 25, mindestensVerschieden: SCHRANKE[6],
    deute: (frage) => {
      const m = frage.match(/Umfang U = ([\d.,]+) cm\. Wie groß ist sein (Radius|Durchmesser)/);
      if (!m) return null;
      const U = zahl(m[1]), radiusGesucht = m[2] === "Radius";
      const soll = radiusGesucht ? U / (2 * P) : U / P;
      return gerundet("A7", soll, [
        [radiusGesucht ? U / P : U / (2 * P), radiusGesucht ? "ergibt den Durchmesser" : "ergibt den Radius"],
        [U * P, "multipliziert"], [U / 2, "nur halbiert"],
        [mit314(soll, radiusGesucht ? U / (2 * 3.14) : U / 3.14), "π ≈ 3,14"],
      ], (f, rueck) => pruefe(/Probe/.test(rueck), `A7: die Musterlösung hat keine Probe — „${f}“`));
    },
  });

  await pruefeAufgabe(page, bericht, {
    nr: 8, name: "A8 Ringbreite aus zwei Umfängen", runden: 25, mindestensVerschieden: SCHRANKE[7],
    deute: (frage) => {
      const m = frage.match(/äußeren Umfang ([\d.,]+) cm und den inneren Umfang ([\d.,]+) cm/);
      if (!m) return null;
      const Ua = zahl(m[1]), Ui = zahl(m[2]);
      return gerundet("A8", (Ua - Ui) / (2 * P), [
        [(Ua - Ui) / P, "DURCHMESSER"], [Ua - Ui, "Unterschied der beiden Umfänge"], [(Ua - Ui) / 2, "nur halbiert"], [Ua / (2 * P), "Außenradius"],
      ], (f, rueck) => pruefe(/Probe/.test(rueck), `A8: die Musterlösung hat keine Probe — „${f}“`));
    },
  });

  await pruefeAufgabe(page, bericht, {
    nr: 9, name: "A9 Mittelpunktswinkel", runden: 25, mindestensVerschieden: SCHRANKE[8],
    deute: (frage) => {
      const m = frage.match(/Radius r = ([\d.,]+) cm und den (Bogen b|Flächeninhalt A) = ([\d.,]+) cm/);
      if (!m) return null;
      const r = zahl(m[1]), wert = zahl(m[3]), ausBogen = /Bogen/.test(m[2]);
      const ganz = ausBogen ? 2 * P * r : P * r * r;
      const alpha = (wert / ganz) * 360;
      return {
        richtig: Math.round(alpha), toleranz: 1,
        falsch: [
          [Math.round((wert / ganz) * 1e4) / 1e4, "Anteil des Ausschnitts"],
          // Auf zwei Stellen, nicht auf ganze Grad: α : 4 kann auf ,5 enden, und dann läge die gerundete
          // Eingabe genau auf der Grenze der Toleranz.
          [rund2(ausBogen ? 2 * alpha : alpha / 4), ausBogen ? "durch π · r geteilt" : "Durchmesser"],
          [Math.abs(360 - 2 * alpha) < 2 ? NaN : rund2(360 - alpha), "restlichen Kreises"],
        ],
        pruefe: (f, rueck) => {
          pruefe(Math.abs(alpha - Math.round(alpha)) < 0.5, `A9: der Winkel ${de(alpha, 3)}° ist nicht sinnvoll auf ganze Grad zu runden — „${f}“`);
          pruefe(rueck.includes(`${Math.round(alpha)}°`) && /Probe/.test(rueck), `A9: Ergebnis oder Probe fehlen in der Musterlösung — „${f}“`);
        },
      };
    },
  });

  // ---- komplex ----
  await pruefeAufgabe(page, bericht, {
    nr: 10, name: "A10 Rundbogenfenster", runden: 25, mindestensVerschieden: SCHRANKE[9],
    deute: (frage) => {
      const m = frage.match(/Rechteck, ([\d.,]+) cm breit und ([\d.,]+) cm hoch/);
      if (!m) return null;
      const w = zahl(m[1]), h = zahl(m[2]), r = w / 2;
      if (/Flächeninhalt der Glasscheibe/.test(frage)) {
        const soll = w * h + (P * r * r) / 2;
        return gerundet("A10", soll, [[w * h + P * r * r, "ganzen Kreis aufgesetzt"], [w * h + (P * w * w) / 2, "Breite als Radius"], [w * h, "nur das Rechteck"], [mit314(soll, w * h + (3.14 * r * r) / 2), "π ≈ 3,14"]]);
      }
      if (!/Rahmen rundherum/.test(frage)) return null;
      const soll = w + 2 * h + P * r;
      return gerundet("A10", soll, [[w + 2 * h + 2 * P * r, "ganzen Kreisumfang"], [2 * w + 2 * h + P * r, "obere Kante"], [2 * h + P * r, "untere Kante fehlt"], [w + 2 * h + P * w, "Breite als Radius"], [mit314(soll, w + 2 * h + 3.14 * r), "π ≈ 3,14"]]);
    },
  });

  await pruefeAufgabe(page, bericht, {
    nr: 11, name: "A11 Rohrquerschnitt", runden: 25, mindestensVerschieden: SCHRANKE[10],
    deute: (frage) => {
      const m = frage.match(/Außendurchmesser ([\d.,]+) mm und die Wandstärke ([\d.,]+) mm.*in (cm²|mm²)/);
      if (!m) return null;
      const D = zahl(m[1]), s = zahl(m[2]), ziel = m[3], f = ziel === "cm²" ? 100 : 1;
      const R = D / 2, r = R - s;
      pruefe(r > 0, `A11: die Wand ist dicker als das Rohr — „${frage}“`);
      const A = (rr) => (P * (R * R - rr * rr)) / f;
      const soll = A(r);
      return gerundet("A11", soll, [
        [A(R - s / 2), "vom DURCHMESSER abgezogen"], [A(R - 2 * s), "zweimal vom Radius"],
        [(P * (D * D - (D - 2 * s) ** 2)) / f, "Durchmessern statt mit den Radien"],
        [ziel === "cm²" ? soll * 100 : NaN, "Fläche in mm²"], [mit314(soll, (3.14 * (R * R - r * r)) / f), "π ≈ 3,14"],
      ]);
    },
  });

  await pruefeAufgabe(page, bericht, {
    nr: 12, name: "A12 Minutenzeiger", runden: 25, mindestensVerschieden: SCHRANKE[11],
    deute: (frage) => {
      const m = frage.match(/ist ([\d.,]+) m lang\. (Welchen Weg|Welche Fläche) .* in (\d+) Minuten/);
      if (!m) return null;
      const L = zahl(m[1]), mins = Number(m[3]), weg = m[2] === "Welchen Weg";
      const anteil = (6 * mins) / 360, falscherAnteil = mins / 360;
      if (weg) {
        const soll = anteil * 2 * P * L;
        return gerundet("A12", soll, [[falscherAnteil * 2 * P * L, "um 6°"], [anteil * P * L * L, "überstrichene Fläche"], [2 * P * L, "ganze Stunde"], [mit314(soll, anteil * 2 * 3.14 * L), "π ≈ 3,14"]]);
      }
      const soll = anteil * P * L * L;
      return gerundet("A12", soll, [[falscherAnteil * P * L * L, "um 6°"], [anteil * 2 * P * L, "Weg der Spitze"], [P * L * L, "ganze Stunde"], [mit314(soll, anteil * 3.14 * L * L), "π ≈ 3,14"]]);
    },
  });
}

// ── Gerüst ────────────────────────────────────────────────────────────────
async function geruest(page) {
  // Die Reihenfolge ist die Herleitungskette: Umfang vor Fläche, Fläche vor Ring, Bogen vor Ausschnitt.
  const folge = await page.evaluate(() => [...document.querySelectorAll("main section[id]")].map((s) => s.id));
  const soll = ["sec-umfang", "sec-radius", "sec-flaeche", "sec-ring", "sec-bogen", "sec-ausschnitt",
    "sec-vernetzung", "sec-formelsammlung", "sec-uebungen", "sec-selbsteinschaetzung"];
  pruefe(JSON.stringify(folge) === JSON.stringify(soll), `Gerüst: Abschnitte ${folge.join(", ")} statt ${soll.join(", ")}`);

  // Die Einschachtelung ist ein markierter Zusatz: Sie steht in einem eigenen Teil mit der Marke
  // „optional“, samt ihrer Zeichnung und ihrer Kontrollfrage; die Pflicht-Kontrollfrage zum Umfang
  // steht davor. Und kein späterer Abschnitt baut auf ihr auf.
  const opt = await page.evaluate(() => {
    const t = document.querySelector("#sec-umfang .optional-teil");
    if (!t) return null;
    const marke = t.querySelector("h3 .optional-marke");
    return {
      marke: marke ? marke.textContent.trim().toLowerCase() : "",
      sichtbar: marke ? marke.getBoundingClientRect().width > 0 : false,
      inhalt: ["es-mount", "quiz-pi"].every((id) => t.contains(document.getElementById(id))),
      pflichtDavor: !t.contains(document.getElementById("quiz-umfang"))
        && !!(document.getElementById("quiz-umfang").compareDocumentPosition(t) & Node.DOCUMENT_POSITION_FOLLOWING),
      ueberspringen: !!t.querySelector('a[href="#sec-radius"]'),
    };
  });
  pruefe(!!opt && opt.marke === "optional" && opt.sichtbar, "Gerüst: die Einschachtelung ist nicht sichtbar als optional markiert");
  pruefe(!!opt && opt.inhalt && opt.pflichtDavor && opt.ueberspringen, `Gerüst: der optionale Teil enthält nicht Zeichnung und Kontrollfrage der Einschachtelung, die Pflichtfrage steht nicht davor, oder der Sprung zu Abschnitt 2 fehlt — ${JSON.stringify(opt)}`);
  for (const id of ["sec-radius", "sec-flaeche", "sec-ring", "sec-bogen", "sec-ausschnitt"]) {
    const t = await page.evaluate((i) => document.getElementById(i).innerText, id);
    pruefe(!/Sechseck|Vieleck|einschachtel|3 < π/i.test(t), `Gerüst: ${id} baut auf der optionalen Einschachtelung auf`);
  }

  // Kein Vorgriff: Der Umfang kommt ohne Flächenformel aus, der erste Flächenweg ohne die Ringe, und
  // der zweite Weg benutzt das Dreieck aus Thema 4 — nicht etwas, das erst danach kommt.
  const textVon = (id) => page.evaluate((i) => document.getElementById(i).innerText, id);
  for (const id of ["sec-umfang", "sec-radius"]) {
    const t = await textVon(id);
    pruefe(!/π · r²|r²/.test(t.replace(/78,54 cm²/g, "")), `Gerüst: ${id} benutzt schon den Flächeninhalt (π · r²)`);
  }
  const flaecheText = await textVon("sec-flaeche");
  const [ersterWeg] = flaecheText.split("Zweiter Weg");
  pruefe(!/Ring/.test(ersterWeg), "Gerüst: der erste Flächenweg greift auf die Ringe vor");
  pruefe(/Dreieck/.test(flaecheText.split("Zweiter Weg")[1] || "") && /Thema 4/.test(flaecheText), "Gerüst: der zweite Flächenweg führt nicht auf das Dreieck aus Thema 4 zurück");
  // Der Kreisring: erst die Differenz (braucht nur A = π · r²), dann das Aufbiegen (braucht die Ringe
  // aus Abschnitt 3). Der erste Weg darf vom zweiten noch nichts wissen.
  const ringText = await textVon("sec-ring");
  const iErst = ringText.indexOf("Erster Weg"), iZweit = ringText.indexOf("Zweiter Weg");
  pruefe(iErst >= 0 && iZweit > iErst, "Gerüst: der Kreisring hat nicht erst einen ersten, dann einen zweiten Weg");
  const ersterRingWeg = ringText.slice(iErst, iZweit), zweiterRingWeg = ringText.slice(iZweit);
  pruefe(/großer Kreis minus kleiner Kreis/.test(ersterRingWeg) && /π · R² − π · r²/.test(ersterRingWeg), "Gerüst: der erste Weg zum Kreisring ist nicht die Differenz der beiden Kreise");
  pruefe(!/aufbieg|aufgebogen|Abschnitt 3|Mittellinie|Rechteck/i.test(ersterRingWeg), "Gerüst: der erste Weg zum Kreisring greift auf das Aufbiegen vor");
  pruefe(/aufbiegen/i.test(zweiterRingWeg) && /Abschnitt 3/.test(zweiterRingWeg), "Gerüst: der zweite Weg zum Kreisring stützt sich nicht auf die Ringe aus Abschnitt 3");
  const ringFolge = await page.evaluate(() => [...document.querySelectorAll("#sec-ring .th-wrap, #sec-ring .quiz")].map((e) => e.id));
  pruefe(JSON.stringify(ringFolge) === JSON.stringify(["kd-mount", "quiz-ring", "kr-mount", "quiz-ring-aufbiegen"]),
    `Gerüst: im Kreisring stehen ${ringFolge.join(", ")} statt Differenz, Kontrollfrage, Aufbiegen, Kontrollfrage`);
  for (const id of ["sec-umfang", "sec-radius", "sec-flaeche", "sec-ring"]) {
    const t = await textVon(id);
    pruefe(!/Kreisbogen|α : 360/.test(t), `Gerüst: ${id} benutzt schon den Kreisbogen`);
  }

  // Wurzeln und Pythagoras kommen erst in Klasse 9 — außer als ausdrücklicher Ausblick.
  const haupt = await page.evaluate(() => document.querySelector("main").innerText);
  pruefe(!/√/.test(haupt), "Gerüst: es kommt ein Wurzelzeichen vor — Wurzeln gibt es erst in Klasse 9");
  for (const m of haupt.matchAll(/.{0,80}(Quadratwurzel|Pythagoras).{0,80}/g)) {
    pruefe(/Klasse 9|noch nicht|gemessen/.test(m[0]), `Gerüst: „${m[1]}“ wird erwähnt, ohne als Klasse-9-Stoff ausgewiesen zu sein — „${m[0].trim()}“`);
  }

  // Formelsammlung als PDF: Verweis, Datei, zwei Seiten A4 quer, und die Formeln in der Quelle.
  const verweis = await page.evaluate(() => {
    const a = document.querySelector("#sec-formelsammlung a[download]");
    return a ? a.getAttribute("href") : null;
  });
  pruefe(verweis === "kreis.pdf", `Formelsammlung: der Download-Verweis fehlt oder zeigt auf „${verweis}“`);
  const pdf = path.join(WURZEL, "mathematik/klasse-8/geometrie/kreis.pdf");
  pruefe(fs.existsSync(pdf), "Formelsammlung: kreis.pdf fehlt");
  if (fs.existsSync(pdf)) {
    const roh = fs.readFileSync(pdf);
    pruefe(roh.subarray(0, 5).toString("latin1") === "%PDF-", "Formelsammlung: die Datei ist kein PDF");
    pruefe(roh.length > 20000, `Formelsammlung: das PDF ist nur ${roh.length} Bytes groß`);
    const seiten = (roh.toString("latin1").match(/\/Type\s*\/Page(?!s)/g) || []).length;
    pruefe(seiten === 2, `Formelsammlung: das PDF hat ${seiten} Seiten statt 2`);
    const box = roh.toString("latin1").match(/\/MediaBox\s*\[\s*0 0 ([\d.]+) ([\d.]+)/);
    pruefe(!!box && Number(box[1]) > Number(box[2]), "Formelsammlung: das PDF ist nicht im Querformat");
  }
  const quellDatei = path.join(WURZEL, "tools/formelsammlung/formelsammlung-kr-quelle.html");
  pruefe(fs.existsSync(quellDatei), "Formelsammlung: die Quelle formelsammlung-kr-quelle.html fehlt");
  if (fs.existsSync(quellDatei)) {
    const quelle = fs.readFileSync(quellDatei, "utf8").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ")
      .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ");
    for (const f of ["U = π · d = 2 · π · r", "A = π · r²", "A = ½ · U · r", "A = π · (R² − r²)", "A = π · (R + r) · (R − r)",
      "b = α : 360° · 2 · π · r", "A = α : 360° · π · r²", "A = ½ · b · r", "d = U : π", "r = U : (2 · π)", "3 < π < 4"]) {
      pruefe(quelle.includes(f), `Formelsammlung: „${f}“ fehlt in der Quelle des PDFs`);
    }
  }

  // Alle Verweise führen irgendwohin.
  const links = await page.evaluate(() =>
    [...document.querySelectorAll("main a[href]")].map((a) => a.getAttribute("href")).filter((h) => !h.startsWith("#") && !h.startsWith("http")));
  for (const href of new Set(links)) {
    const ziel = new URL(href.split("#")[0], "http://localhost/mathematik/klasse-8/geometrie/").pathname;
    const antwort = await page.request.get("http://localhost:" + (process.env.UPLANT_PORT || "8936") + ziel);
    pruefe(antwort.ok(), `Gerüst: der Verweis „${href}“ führt ins Leere (${antwort.status()})`);
  }

  // Die Menükarte: auf der Übersichtsseite, mit Bereich und versteckt bis zur Freischaltung.
  const karte = await page.evaluate(async () => {
    const html = await (await fetch("index.html")).text();
    const m = html.match(/<a class="menu-card"[^>]*href="kreis\.html"[^>]*>/);
    return m ? m[0] : null;
  });
  pruefe(!!karte && /data-section="klasse-8"/.test(karte) && /\shidden\b/.test(karte), `Gerüst: die Menükarte fehlt oder ist unvollständig — ${karte}`);

  // Zwölf Aufgaben, drei je Stufe.
  const proStufe = await page.evaluate(async () => {
    const out = [];
    for (const t of document.querySelectorAll("#exercises-mount .schwierigkeit-tabs button")) {
      t.click();
      out.push(document.querySelectorAll("#exercises-mount .schwierigkeit-tab-panel .aufgabe-box").length);
    }
    return out;
  });
  pruefe(proStufe.length === 4 && proStufe.every((n) => n === 3), `Gerüst: die Stufen haben ${proStufe.join("/")} Aufgaben statt 3/3/3/3`);
}

(async () => {
  const browser = await starteBrowser();
  for (const dunkel of [false, true]) {
    const wo = dunkel ? "dunkel" : "hell";
    const page = await neueSeite(browser, { dunkel });
    await oeffne(page, SEITE);
    if (!dunkel) {
      await geruest(page);
      await abrollen(page);
      await einschachteln(page);
      await radius(page);
      await masssstab(page);
      await ausschnitte(page);
      await ringe(page);
      await kreisDifferenz(page);
      await kreisring(page);
      await tabellen(page);
      await bogen(page);
      await ausschnitt(page);
      await quizze(page);
      await aufgaben(page);
    } else {
      await pruefeKontrast(page, bericht, "dunkel");
    }
    await pruefeNotation(page, bericht, wo);
    for (const s of page.stoerungen) pruefe(false, `${wo}: ${s}`);
    await page.close();
  }
  await browser.close();
  bericht.abschluss();
})();
