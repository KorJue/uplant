// Fachliche Prüfung: Klasse 8, Geometrie, Thema 7 „Flächeninhalte“.
//
// Die Seite behauptet drei Dinge, und alle drei werden hier nachgerechnet — nicht nur
// abgelesen:
//
//   1. Die HERLEITUNGEN stimmen. Bei jeder Reglerstellung wird die gezeichnete Figur aus dem
//      SVG zurückgelesen und ihr Flächeninhalt mit der Gaußschen Trapezformel bestimmt. Er muss
//      mit dem übereinstimmen, was die Bilanz behauptet. Eine Zeichnung, die g · h schreibt und
//      etwas anderes zeigt, wäre schlimmer als gar keine.
//   2. Die BEWEGUNGEN sind starr. Die gedrehten Reststücke, das umgelegte Dreieck und die
//      gedrehte Kopie müssen in jeder Zwischenstellung denselben Flächeninhalt haben wie am
//      Anfang — sonst würde beim Verschieben oder Drehen etwas verschwinden, und die
//      Herleitung wäre wertlos.
//
//   3. Die AUFGABEN rechnen richtig. Jede der zwölf wird über viele Runden gewürfelt, unabhängig
//      nachgerechnet und mit jedem vorgesehenen Fehlerwert geprüft.
//
// Die Reihenfolge der Abschnitte ist selbst eine Behauptung: Dreieck, Parallelogramm, Trapez,
// und keine Herleitung greift auf eine spätere vor. Deshalb wird beim Dreieck geprüft, dass es
// wirklich zum Rechteck ergänzt wird — ein Rückgriff auf das Parallelogramm wäre an dieser
// Stelle ein Zirkelschluss.
//
// Außerdem: Auf dieser Seite darf weder der Satz des Pythagoras noch eine Quadratwurzel
// vorkommen — beides steht erst in Klasse 9 an. Wo eine schräge Länge als Zahl erscheint, muss
// „gemessen“ daneben stehen.

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
const SEITE = "/mathematik/klasse-8/geometrie/flaecheninhalte.html";

const de = (x, stellen = 4) => Number(x.toFixed(stellen)).toLocaleString("de-DE", { maximumFractionDigits: stellen });

// Flächeninhalt eines Polygons aus seinen Eckpunkten — unabhängig von jeder Formel der Seite.
function polygonFlaeche(punkte) {
  let s = 0;
  for (let i = 0; i < punkte.length; i++) {
    const a = punkte[i], c = punkte[(i + 1) % punkte.length];
    s += a.x * c.y - c.x * a.y;
  }
  return Math.abs(s) / 2;
}

// Liegt der Punkt q im Dreieck? Verglichen wird über die Teilflächen: Zerlegt man das Dreieck
// von q aus in drei Teile, so ergeben sie zusammen genau dann das Ganze, wenn q drinnen liegt.
// Der Spielraum ist in Bildpunkten angegeben — eine Ecke darf auf dem Rand liegen.
function imDreieck(q, ecken, spielraum = 1) {
  const [X, Y, Z] = ecken;
  const ganz = polygonFlaeche([X, Y, Z]);
  const teile = polygonFlaeche([q, X, Y]) + polygonFlaeche([q, Y, Z]) + polygonFlaeche([q, Z, X]);
  // Ein Punkt im Abstand d vom Rand vergrößert die Summe um höchstens d · Umfang.
  const umfang = Math.hypot(Y.x - X.x, Y.y - X.y) + Math.hypot(Z.x - Y.x, Z.y - Y.y) + Math.hypot(X.x - Z.x, X.y - Z.y);
  return teile - ganz <= spielraum * umfang;
}

// Alle Polygone einer Zeichnung, in Bildpunkten. Gelesen wird das points-Attribut; die
// Füllklasse sagt, welches Polygon welche Rolle hat.
async function polygone(page, mountId) {
  return page.evaluate((id) => {
    const out = [];
    for (const p of document.querySelectorAll(`#${id} svg polygon`)) {
      const punkte = p.getAttribute("points").trim().split(/\s+/).map((t) => {
        const [x, y] = t.split(",").map(Number);
        return { x, y };
      });
      out.push({ klasse: p.getAttribute("class") || "", fuellung: p.getAttribute("fill") || "", punkte });
    }
    return out;
  }, mountId);
}

// Der Maßstab der Bühne: Er steckt nicht im SVG, lässt sich aber aus zwei bekannten Punkten
// zurückrechnen. Gemessen wird an der Grundseite, deren Länge die Bilanz nennt.
function skalaAus(punkteA, punkteB, laengeCm) {
  return Math.hypot(punkteB.x - punkteA.x, punkteB.y - punkteA.y) / laengeCm;
}

async function punkte(page, mountId) {
  return page.evaluate((id) => {
    const out = {};
    for (const g of document.querySelectorAll(`#${id} svg .th-punkt-gruppe[data-name]`)) {
      const c = g.querySelector("circle");
      out[g.dataset.name] = { x: +c.getAttribute("cx"), y: +c.getAttribute("cy") };
    }
    return out;
  }, mountId);
}

// ── Abschnitt 1: Scherung ─────────────────────────────────────────────────
//
// Die Kernaussage lautet: Der Flächeninhalt hängt NICHT vom Versatz ab. Deshalb wird bei
// festem g und h über alle Versätze gelaufen und jedes Mal dieselbe Zahl verlangt — sowohl
// in der Bilanz als auch in der gezeichneten Figur.
async function scherung(page) {
  for (const g of [3, 6, 9]) {
    for (const h of [2, 4, 5]) {
      await setzeRegler(page, "sc-g", g);
      await setzeRegler(page, "sc-h", h);
      for (const s of [0, 1.5, 3, 4.5, 6]) {
        await setzeRegler(page, "sc-s", s);
        const wo = `g = ${g}, h = ${h}, Versatz = ${s}`;
        const A = g * h;

        const bilanz = await text(page, "#sc-bilanz");
        pruefe(bilanz.includes(`A = g · h = ${de(g)} cm · ${de(h)} cm = ${de(A)} cm²`),
          `Scherung: ${wo} — die Bilanz nennt nicht A = ${de(A)} cm² — „${bilanz}“`);

        // Die gezeichnete Figur muss diesen Flächeninhalt wirklich haben.
        const p = await punkte(page, "sc-mount");
        const skala = skalaAus(p.A, p.B, g);
        const flaeche = polygonFlaeche([p.A, p.B, p.C, p.D]) / (skala * skala);
        pruefe(Math.abs(flaeche - A) < 0.02 * Math.max(1, A),
          `Scherung: ${wo} — die Zeichnung hat ${de(flaeche, 2)} cm², behauptet werden ${de(A)} cm²`);

        // Und die schräge Seite muss mit dem Versatz wachsen — sonst zeigte die Figur nicht,
        // worum es geht.
        const b = Math.hypot(p.D.x - p.A.x, p.D.y - p.A.y) / skala;
        pruefe(Math.abs(b - Math.hypot(s, h)) < 0.05,
          `Scherung: ${wo} — die schräge Seite misst ${de(b, 2)} cm statt ${de(Math.hypot(s, h), 2)} cm`);
        pruefe(s === 0 ? Math.abs(b - h) < 0.05 : b > h + 1e-6,
          `Scherung: ${wo} — die schräge Seite ist nicht länger als die Höhe`);
      }
    }
  }
  // Die Bilanz muss die gemessene Länge auch als gemessen kennzeichnen: Berechnen ließe sie
  // sich nur mit dem Satz des Pythagoras, und der steht erst in Klasse 9 an.
  const bilanz = await text(page, "#sc-bilanz");
  pruefe(/gemessen/.test(bilanz), `Scherung: die schräge Seite ist nicht als gemessen gekennzeichnet — „${bilanz}“`);
}

// ── Abschnitt 2: Parallelogramm ───────────────────────────────────────────
//
// Geprüft wird die Bewegung: Das umgelegte Dreieck muss in JEDER Zwischenstellung
// deckungsgleich mit dem abgeschnittenen sein, und am Ende muss ein Rechteck dastehen.
async function parallelogramm(page) {
  for (const [g, h, s] of [[6, 3.5, 2], [4, 5, 0], [9, 2, 5], [5, 4, 5], [3, 2, 3]]) {
    await setzeRegler(page, "pa-g", g);
    await setzeRegler(page, "pa-h", h);
    await setzeRegler(page, "pa-s", s);
    // Der Versatz kann nicht größer sein als die Grundseite — sonst genügte ein Schnitt nicht.
    const sEcht = Math.min(s, g);
    const reglerS = await page.evaluate(() => Number(document.getElementById("pa-s").value));
    pruefe(reglerS === sEcht, `Parallelogramm: der Regler steht auf ${reglerS}, gerechnet wird mit ${sEcht}`);

    const A = g * h;
    let flaechenTeil = null;
    for (const t of [0, 26, 50, 74, 100]) {
      await setzeRegler(page, "pa-t", t);
      const wo = `g = ${g}, h = ${h}, Versatz = ${sEcht}, Umlegen = ${t} %`;

      const bilanz = await text(page, "#pa-bilanz");
      pruefe(bilanz.includes(`A = g · h = ${de(g)} · ${de(h)} = ${de(A)} cm²`),
        `Parallelogramm: ${wo} — die Bilanz nennt nicht A = ${de(A)} cm² — „${bilanz}“`);

      const p = await punkte(page, "pa-mount");
      const skala = skalaAus(p.A, p.B, g);
      const polys = await polygone(page, "pa-mount");
      const rest = polys.find((x) => x.klasse.includes("fl-flaeche-fuell"));
      const teil = polys.find((x) => x.klasse.includes("fl-flaeche-teil"));
      pruefe(!!rest && !!teil, `Parallelogramm: ${wo} — Reststück oder umgelegtes Dreieck fehlt`);
      if (!rest || !teil) continue;

      const aRest = polygonFlaeche(rest.punkte) / (skala * skala);
      const aTeil = polygonFlaeche(teil.punkte) / (skala * skala);
      // Beide Stücke zusammen ergeben immer die ganze Fläche — nichts geht verloren.
      pruefe(Math.abs(aRest + aTeil - A) < 0.03 * Math.max(1, A),
        `Parallelogramm: ${wo} — die beiden Stücke ergeben ${de(aRest + aTeil, 2)} cm² statt ${de(A)} cm²`);
      // Und das bewegte Dreieck behält seine Größe.
      if (flaechenTeil === null) flaechenTeil = aTeil;
      pruefe(Math.abs(aTeil - flaechenTeil) < 0.03 * Math.max(1, flaechenTeil),
        `Parallelogramm: ${wo} — das umgelegte Dreieck hat unterwegs ${de(aTeil, 2)} cm² statt ${de(flaechenTeil, 2)} cm²`);

      if (t === 100) {
        // Am Ende steht ein Rechteck: Die Vereinigung beider Stücke hat die Breite g und die
        // Höhe h, und ihre linke Kante steht senkrecht.
        const alle = rest.punkte.concat(teil.punkte);
        const xs = alle.map((q) => q.x), ys = alle.map((q) => q.y);
        const breite = (Math.max(...xs) - Math.min(...xs)) / skala;
        const hoehe = (Math.max(...ys) - Math.min(...ys)) / skala;
        pruefe(Math.abs(breite - g) < 0.05 && Math.abs(hoehe - h) < 0.05,
          `Parallelogramm: ${wo} — das Ergebnis misst ${de(breite, 2)} × ${de(hoehe, 2)} statt ${de(g)} × ${de(h)}`);
      }
    }

    // Die zweite Grundseite: b · h_b muss denselben Flächeninhalt liefern.
    await setzeRegler(page, "pa-t", 0);
    await page.locator("#pa-zweite").check();
    const bilanz = await text(page, "#pa-bilanz");
    if (sEcht > 0) {
      const bSeite = Math.hypot(sEcht, h);
      pruefe(bilanz.includes(`b ${Math.abs(bSeite - Number(bSeite.toFixed(2))) < 1e-12 ? "=" : "≈"} ${de(bSeite, 2)} cm`),
        `Parallelogramm: g = ${g}, h = ${h}, s = ${sEcht} — die zweite Seite fehlt in der Bilanz — „${bilanz}“`);
      pruefe(/gemessen/.test(bilanz),
        `Parallelogramm: die zweite Seite ist nicht als gemessen gekennzeichnet — „${bilanz}“`);
      const hb = A / bSeite;
      pruefe(Math.abs(bSeite * hb - A) < 1e-9,
        `Parallelogramm: b · h_b = ${de(bSeite * hb, 4)} statt ${de(A)}`);
    }
    await page.locator("#pa-zweite").uncheck();
  }
}

// ── Abschnitt 2: Dreieck ──────────────────────────────────────────────────
//
// Die Herleitung ergänzt zum Rechteck und darf deshalb das Parallelogramm NICHT benutzen —
// das kommt erst danach. Geprüft wird genau das, was die Zeichnung behauptet:
//   1. Die beiden Reststücke sind zusammen so groß wie das Dreieck (sonst wäre das Dreieck
//      nicht die Hälfte des Rechtecks).
//   2. Das Drehen ist starr — jedes Reststück behält in jeder Stellung seinen Flächeninhalt.
//   3. Nach der halben Drehung liegen beide Reststücke INNERHALB des Dreiecks; zusammen
//      decken sie es genau ab.
async function dreieck(page) {
  for (const [g, h, cx] of [[7, 4, 2], [4, 2, 0], [9, 5, 9], [5, 3, 5], [3, 2, 1.5]]) {
    await setzeRegler(page, "dr-g", g);
    await setzeRegler(page, "dr-h", h);
    await setzeRegler(page, "dr-cx", cx);
    const A = (g * h) / 2;
    // Der Regler ist auf 0 ≤ cx ≤ g begrenzt; nur dann zerlegt die Höhe das Rechteck.
    const cxEcht = Math.min(cx, g);
    const flaechenLinks = (cxEcht * h) / 2, flaechenRechts = ((g - cxEcht) * h) / 2;

    for (const t of [0, 30, 50, 80, 100]) {
      await setzeRegler(page, "dr-t", t);
      const wo = `g = ${g}, h = ${h}, Spitze = ${cxEcht}, Drehung = ${Math.round(t * 1.8)}°`;

      const bilanz = await text(page, "#dr-bilanz");
      pruefe(bilanz.includes(`2 · A = g · h = ${de(g)} · ${de(h)} = ${de(g * h)} cm²`),
        `Dreieck: ${wo} — die Bilanz nennt nicht 2 · A = ${de(g * h)} cm² — „${bilanz}“`);
      pruefe(bilanz.includes(`A = ½ · g · h = ${de(A)} cm²`),
        `Dreieck: ${wo} — die Bilanz nennt nicht A = ${de(A)} cm² — „${bilanz}“`);

      const p = await punkte(page, "dr-mount");
      const skala = skalaAus(p.A, p.B, g);
      const polys = await polygone(page, "dr-mount");
      const original = polys.find((x) => x.klasse.includes("fl-flaeche-fuell"));
      const reste = polys.filter((x) => x.klasse.includes("fl-flaeche-zweit"));
      pruefe(!!original, `Dreieck: ${wo} — das Dreieck fehlt in der Zeichnung`);
      pruefe(reste.length === 2, `Dreieck: ${wo} — ${reste.length} Reststücke statt 2`);
      if (!original || reste.length !== 2) continue;

      const aOrig = polygonFlaeche(original.punkte) / (skala * skala);
      pruefe(Math.abs(aOrig - A) < 0.03 * Math.max(1, A),
        `Dreieck: ${wo} — das gezeichnete Dreieck hat ${de(aOrig, 2)} cm² statt ${de(A)} cm²`);

      // Drehen ist eine starre Bewegung: Jedes Reststück behält seine Größe. Welches der
      // beiden zuerst gezeichnet wird, legt die Zeichnung fest — geprüft wird das Paar.
      const aReste = reste.map((r) => polygonFlaeche(r.punkte) / (skala * skala)).sort((x, y) => x - y);
      const sollReste = [flaechenLinks, flaechenRechts].sort((x, y) => x - y);
      for (let i = 0; i < 2; i++) {
        pruefe(Math.abs(aReste[i] - sollReste[i]) < 0.03 * Math.max(1, sollReste[i]),
          `Dreieck: ${wo} — ein Reststück hat ${de(aReste[i], 2)} cm² statt ${de(sollReste[i], 2)} cm²`);
      }
      // Der Kern der Herleitung: beide Reststücke zusammen sind genau das Dreieck.
      pruefe(Math.abs(aReste[0] + aReste[1] - A) < 0.03 * Math.max(1, A),
        `Dreieck: ${wo} — die Reststücke ergeben zusammen ${de(aReste[0] + aReste[1], 2)} cm² statt ${de(A)} cm²`);

      if (t === 100) {
        // Nach der halben Drehung muss jeder Eckpunkt der Reststücke im Dreieck liegen.
        for (const r of reste) {
          for (const q of r.punkte) {
            pruefe(imDreieck(q, original.punkte, 1.5),
              `Dreieck: ${wo} — nach der Drehung liegt ein Reststück-Eckpunkt außerhalb des Dreiecks`);
          }
        }
      }
      if (t === 0) {
        // Am Anfang füllen Dreieck und Reststücke zusammen genau das Rechteck g · h.
        const alle = original.punkte.concat(...reste.map((r) => r.punkte));
        const xs = alle.map((q) => q.x), ys = alle.map((q) => q.y);
        const breite = (Math.max(...xs) - Math.min(...xs)) / skala;
        const hoehe = (Math.max(...ys) - Math.min(...ys)) / skala;
        pruefe(Math.abs(breite - g) < 0.05 && Math.abs(hoehe - h) < 0.05,
          `Dreieck: ${wo} — das umschließende Rechteck misst ${de(breite, 2)} × ${de(hoehe, 2)} cm statt ${de(g)} × ${de(h)} cm`);
      }
    }
  }
}

// ── Abschnitt 3b: Grundseite und zugehörige Höhe ──────────────────────────
//
// Die Aussage: Alle drei Paare aus Seite und zugehöriger Höhe liefern denselben Flächeninhalt.
// Geprüft wird sie an den Zahlen der Bilanz — und daran, dass die gezeichnete Höhe wirklich
// senkrecht auf der gewählten Seite steht.
async function grundseiten(page) {
  const ecken = { A: { x: 0, y: 0 }, B: { x: 8, y: 0 }, C: { x: 3, y: 2.5 } };
  const A = polygonFlaeche([ecken.A, ecken.B, ecken.C]);
  const seiten = {
    c: [ecken.A, ecken.B, ecken.C],
    a: [ecken.B, ecken.C, ecken.A],
    b: [ecken.C, ecken.A, ecken.B],
  };
  for (const wahl of ["c", "a", "b"]) {
    await page.locator(`input[name="gh-seite"][value="${wahl}"]`).check();
    const bilanz = await text(page, "#gh-bilanz");
    const [P, Q, S] = seiten[wahl];
    const laenge = Math.hypot(Q.x - P.x, Q.y - P.y);
    const hoehe = (2 * A) / laenge;
    // Alle drei Zeilen stehen immer da; die gewählte ist nur hervorgehoben.
    for (const k of ["c", "a", "b"]) {
      const [P2, Q2] = seiten[k];
      const l2 = Math.hypot(Q2.x - P2.x, Q2.y - P2.y);
      const h2 = (2 * A) / l2;
      pruefe(bilanz.includes(`${de(l2, 2)} cm`) && bilanz.includes(`${de(h2, 2)} cm`),
        `Grundseiten (${wahl}): die Zeile für ${k} (${de(l2, 2)} cm, ${de(h2, 2)} cm) fehlt — „${bilanz}“`);
      // Der entscheidende Punkt: Alle drei Produkte ergeben denselben Flächeninhalt.
      pruefe(Math.abs((l2 * h2) / 2 - A) < 1e-9,
        `Grundseiten: ½ · ${de(l2, 4)} · ${de(h2, 4)} ist nicht ${de(A, 4)}`);
    }
    pruefe(bilanz.includes(`${de(A, 2)} cm²`),
      `Grundseiten (${wahl}): der gemeinsame Flächeninhalt ${de(A, 2)} cm² fehlt — „${bilanz}“`);

    // Die gezeichnete Höhe muss senkrecht auf der gewählten Seite stehen.
    const linien = await page.evaluate(() => [...document.querySelectorAll("#gh-mount svg line")].map((l) => ({
      x1: +l.getAttribute("x1"), y1: +l.getAttribute("y1"), x2: +l.getAttribute("x2"), y2: +l.getAttribute("y2"),
      farbe: l.getAttribute("stroke"),
    })));
    const hoeheLinie = linien.find((l) => l.farbe === "#6d28d9");
    const grundLinie = linien.find((l) => l.farbe === "#1d4ed8");
    pruefe(!!hoeheLinie && !!grundLinie, `Grundseiten (${wahl}): Höhe oder Grundseite fehlt in der Zeichnung`);
    if (hoeheLinie && grundLinie) {
      const u = { x: grundLinie.x2 - grundLinie.x1, y: grundLinie.y2 - grundLinie.y1 };
      const v = { x: hoeheLinie.x2 - hoeheLinie.x1, y: hoeheLinie.y2 - hoeheLinie.y1 };
      const cos = (u.x * v.x + u.y * v.y) / (Math.hypot(u.x, u.y) * Math.hypot(v.x, v.y));
      pruefe(Math.abs(cos) < 0.01,
        `Grundseiten (${wahl}): die Höhe steht nicht senkrecht auf der Grundseite (cos = ${de(cos, 4)})`);
      // Und ihre Länge muss die berechnete sein.
      const skala = Math.hypot(u.x, u.y) / laenge;
      const gezeichnet = Math.hypot(v.x, v.y) / skala;
      pruefe(Math.abs(gezeichnet - hoehe) < 0.05,
        `Grundseiten (${wahl}): die gezeichnete Höhe misst ${de(gezeichnet, 2)} cm statt ${de(hoehe, 2)} cm`);

      // Liegt der Fußpunkt auf der Strecke oder außerhalb? Gemessen an der Zeichnung, nicht an
      // den Koordinaten oben: Die Seite behauptete schon einmal „außerhalb“ an einem spitzwinkligen
      // Dreieck, dessen Fußpunkt mitten auf der Seite lag.
      const eckenBild = await page.evaluate(() => Object.fromEntries(
        [...document.querySelectorAll("#gh-mount .th-punkt-gruppe")].map((g) => {
          const c = g.querySelector("circle");
          return [g.dataset.name, { x: +c.getAttribute("cx"), y: +c.getAttribute("cy") }];
        })));
      const [nP, nQ, nS] = { c: ["A", "B", "C"], a: ["B", "C", "A"], b: ["C", "A", "B"] }[wahl];
      const Pb = eckenBild[nP], Qb = eckenBild[nQ], Sb = eckenBild[nS];
      const enden = [{ x: hoeheLinie.x1, y: hoeheLinie.y1 }, { x: hoeheLinie.x2, y: hoeheLinie.y2 }];
      const fuss = enden.sort((e1, e2) => Math.hypot(e2.x - Sb.x, e2.y - Sb.y) - Math.hypot(e1.x - Sb.x, e1.y - Sb.y))[0];
      const ux = Qb.x - Pb.x, uy = Qb.y - Pb.y;
      const lam = ((fuss.x - Pb.x) * ux + (fuss.y - Pb.y) * uy) / (ux * ux + uy * uy);
      const aussen = lam < -0.02 || lam > 1.02;
      pruefe(aussen === (wahl !== "c"),
        `Grundseiten (${wahl}): der gezeichnete Fußpunkt liegt ${aussen ? "außerhalb" : "auf"} der Seite (λ = ${de(lam, 2)}), ` +
        `im stumpfwinkligen Dreieck gehört er bei a und b nach außen, bei c auf die Seite`);
      const erklaerung = await text(page, "#gh-text");
      pruefe(/außerhalb/.test(erklaerung) === aussen,
        `Grundseiten (${wahl}): der Text sagt ${/außerhalb/.test(erklaerung) ? "„außerhalb“" : "nichts von „außerhalb“"}, ` +
        `die Zeichnung zeigt den Fußpunkt ${aussen ? "außerhalb" : "auf der Seite"} — „${erklaerung}“`);

      // Und der Winkel bei C muss in der Zeichnung wirklich stumpf sein — der Achtung-Kasten
      // verspricht an diesem Dreieck genau diesen Fall.
      const C = eckenBild.C, A_ = eckenBild.A, B_ = eckenBild.B;
      const skalar = (A_.x - C.x) * (B_.x - C.x) + (A_.y - C.y) * (B_.y - C.y);
      pruefe(skalar < 0, `Grundseiten: der gezeichnete Winkel bei C ist nicht stumpf`);
    }
  }
  const achtung = await page.evaluate(() =>
    [...document.querySelectorAll("#sec-dreieck .achtung-box")].map((e) => e.innerText).join(" "));
  pruefe(/stumpfwinklig/.test(achtung) && /bei C/.test(achtung),
    `Grundseiten: der Achtung-Kasten nennt das stumpfwinklige Dreieck nicht mehr beim Namen — „${achtung.slice(0, 160)}“`);
}

// ── Abschnitt 3c: Drehen und Scheren ──────────────────────────────────────
//
// Die schräge Höhe allein erklärt nichts; das Widget dreht das Dreieck deshalb, bis die
// gewählte Seite unten liegt, zeichnet das Rechteck g · h darüber und schiebt die Spitze an
// dessen oberer Kante entlang, bis das Dreieck ein halbes Rechteck ist. Jede dieser Behauptungen
// wird an vielen Reglerstellungen aus dem SVG zurückgelesen:
//
//   * Die Drehung ist starr: Die drei Seiten behalten ihre Längen.
//   * Das Rechteck steht auf der Grundseite und ist g · h groß — also 2 · A.
//   * Die Spitze liegt immer im Abstand h von der Grundseite, der Flächeninhalt bleibt A.
//   * Nach der ganzen Drehung liegt die Grundseite waagerecht und die Spitze darüber.
//   * Am Ende des Schiebens ist das Dreieck rechtwinklig und genau die Hälfte des Rechtecks;
//     die orange Hälfte gibt es nur dort — vorher wäre sie eine Behauptung ohne Grundlage.
//   * „außerhalb“ steht im Text genau dann, wenn der gezeichnete Fußpunkt außerhalb liegt.
//   * Die Bühne springt beim Ziehen nicht.
async function grundseitenBewegung(page) {
  const ecken = { A: { x: 0, y: 0 }, B: { x: 8, y: 0 }, C: { x: 3, y: 2.5 } };
  const A = polygonFlaeche([ecken.A, ecken.B, ecken.C]);
  const laenge = (p, q) => Math.hypot(q.x - p.x, q.y - p.y);
  const seitenCm = [laenge(ecken.A, ecken.B), laenge(ecken.B, ecken.C), laenge(ecken.C, ecken.A)].sort((x, y) => x - y);
  const basis = { c: ["A", "B"], a: ["B", "C"], b: ["C", "A"] };
  const lies = () => page.evaluate(() => {
    const svg = document.querySelector("#gh-mount svg");
    const poly = {};
    for (const p of svg.querySelectorAll("polygon[data-rolle]")) {
      poly[p.dataset.rolle] = p.getAttribute("points").trim().split(/\s+/).map((t) => {
        const [x, y] = t.split(",").map(Number);
        return { x, y };
      });
    }
    const punkte = Object.fromEntries([...svg.querySelectorAll(".th-punkt-gruppe")].map((g) => {
      const c = g.querySelector("circle");
      return [g.dataset.name, { x: +c.getAttribute("cx"), y: +c.getAttribute("cy") }];
    }));
    return { viewBox: svg.getAttribute("viewBox"), poly, punkte, text: document.getElementById("gh-text").innerText };
  });

  for (const wahl of ["c", "a", "b"]) {
    await page.locator(`input[name="gh-seite"][value="${wahl}"]`).check();
    const [nP, nQ] = basis[wahl];
    const nS = ["A", "B", "C"].find((n) => n !== nP && n !== nQ);
    const gCm = laenge(ecken[nP], ecken[nQ]);
    const hCm = (2 * A) / gCm;
    // Bei c liegt die Grundseite schon waagerecht; der Drehregler ist dort gesperrt.
    const gesperrt = await page.evaluate(() => document.getElementById("gh-d").disabled);
    pruefe(gesperrt === (wahl === "c"),
      `Drehen (${wahl}): der Drehregler ist ${gesperrt ? "gesperrt" : "frei"}, obwohl ${wahl === "c" ? "c schon unten liegt" : "gedreht werden muss"}`);
    let viewBox = null;
    for (const d of wahl === "c" ? [100] : [0, 20, 50, 80, 100]) {
      if (wahl !== "c") await setzeRegler(page, "gh-d", d);
      for (const sw of [0, 30, 70, 100]) {
        const sEcht = await setzeRegler(page, "gh-s", sw);
        const wo = `Drehen (${wahl}, ${d} %, Spitze ${sEcht} %)`;
        const z = await lies();
        if (viewBox === null) viewBox = z.viewBox;
        pruefe(z.viewBox === viewBox, `${wo}: die Bühne springt (${z.viewBox} statt ${viewBox})`);
        const P = z.punkte[nP], Q = z.punkte[nQ], S = z.punkte[nS];
        const skala = laenge(P, Q) / gCm;
        const dreieck = z.poly.dreieck, rechteck = z.poly.rechteck;
        pruefe(!!dreieck && !!rechteck, `${wo}: Dreieck oder Rechteck fehlt`);
        if (!dreieck || !rechteck) continue;

        // Flächeninhalt des gezeichneten Dreiecks — in jeder Stellung A.
        const aBild = polygonFlaeche(dreieck) / (skala * skala);
        pruefe(Math.abs(aBild - A) < 0.03, `${wo}: das gezeichnete Dreieck ist ${de(aBild, 3)} cm² groß statt ${de(A, 3)} cm²`);
        // Abstand der Spitze von der Geraden PQ — die Höhe.
        const ux = (Q.x - P.x) / laenge(P, Q), uy = (Q.y - P.y) / laenge(P, Q);
        const abstand = Math.abs((S.x - P.x) * uy - (S.y - P.y) * ux) / skala;
        pruefe(Math.abs(abstand - hCm) < 0.03, `${wo}: die Spitze ist ${de(abstand, 3)} cm von der Grundseite entfernt statt ${de(hCm, 3)} cm`);
        // Starre Drehung: Solange die Spitze nicht verschoben ist, behalten alle Seiten ihre Länge.
        if (sEcht === 0) {
          const s3 = [laenge(z.punkte.A, z.punkte.B), laenge(z.punkte.B, z.punkte.C), laenge(z.punkte.C, z.punkte.A)]
            .map((l) => l / skala).sort((x, y) => x - y);
          pruefe(s3.every((l, i) => Math.abs(l - seitenCm[i]) < 0.03),
            `${wo}: die Drehung ist nicht starr — Seiten ${s3.map((l) => de(l, 2)).join(" / ")} cm`);
        }
        // Das Rechteck: steht auf P und Q, ist g · h = 2 · A groß und hat rechte Winkel.
        const rFlaeche = polygonFlaeche(rechteck) / (skala * skala);
        pruefe(Math.abs(rFlaeche - 2 * A) < 0.05, `${wo}: das Rechteck ist ${de(rFlaeche, 3)} cm² groß statt g · h = ${de(2 * A, 3)} cm²`);
        const nahe = (u, v) => laenge(u, v) < 1;
        pruefe(rechteck.some((e) => nahe(e, P)) && rechteck.some((e) => nahe(e, Q)),
          `${wo}: das Rechteck steht nicht auf der Grundseite ${nP}${nQ}`);
        for (let i = 0; i < 4; i++) {
          const a = rechteck[i], m = rechteck[(i + 1) % 4], c = rechteck[(i + 2) % 4];
          const cos = ((a.x - m.x) * (c.x - m.x) + (a.y - m.y) * (c.y - m.y)) / (laenge(a, m) * laenge(c, m));
          pruefe(Math.abs(cos) < 0.005, `${wo}: das Rechteck hat an Ecke ${i + 1} keinen rechten Winkel`);
        }
        // Ganz gedreht: Grundseite waagerecht, Spitze darüber (in SVG heißt „oben“ kleineres y).
        if (d === 100) {
          pruefe(Math.abs(P.y - Q.y) < 0.5, `${wo}: die Grundseite liegt nach dem Drehen nicht waagerecht`);
          pruefe(S.y < P.y - 5, `${wo}: die Spitze steht nach dem Drehen nicht über der Grundseite`);
        }
        // Fußpunkt der Höhe, als Anteil der Grundseite — und was der Text dazu sagt.
        const lam = ((S.x - P.x) * ux + (S.y - P.y) * uy) / laenge(P, Q);
        const aussen = lam < -0.01 || lam > 1.01;
        pruefe(/außerhalb/.test(z.text) === aussen,
          `${wo}: der Text ${/außerhalb/.test(z.text) ? "sagt" : "verschweigt"} „außerhalb“, der Fußpunkt liegt bei λ = ${de(lam, 2)} — „${z.text}“`);
        // Am Ziel: rechtwinklig, halbes Rechteck, orange Hälfte deckungsgleich.
        const haelfte = z.poly.haelfte;
        if (sEcht === 100) {
          pruefe(Math.abs(lam) < 0.005 || Math.abs(lam - 1) < 0.005,
            `${wo}: die Spitze steht am Ende nicht über einer Ecke der Grundseite (λ = ${de(lam, 3)})`);
          pruefe(!!haelfte, `${wo}: die andere Hälfte des Rechtecks fehlt`);
          if (haelfte) {
            const hF = polygonFlaeche(haelfte) / (skala * skala);
            pruefe(Math.abs(hF - A) < 0.03, `${wo}: die orange Hälfte ist ${de(hF, 3)} cm² groß statt ${de(A, 3)} cm²`);
            pruefe(haelfte.every((e) => rechteck.some((r) => nahe(e, r))), `${wo}: die orange Hälfte liegt nicht im Rechteck`);
          }
          pruefe(/Hälfte/.test(z.text) && /rechtwinklig/.test(z.text), `${wo}: der Text erklärt das halbe Rechteck nicht — „${z.text}“`);
        } else {
          pruefe(!haelfte, `${wo}: die orange Hälfte ist schon zu sehen, obwohl das Dreieck noch kein halbes Rechteck ist`);
        }
      }
      await setzeRegler(page, "gh-s", 0);
    }
  }
  // Beim Wechsel der Seite beginnen beide Schritte von vorn.
  await setzeRegler(page, "gh-s", 60);
  await page.locator('input[name="gh-seite"][value="a"]').check();
  const nachWechsel = await page.evaluate(() => [document.getElementById("gh-d").value, document.getElementById("gh-s").value]);
  pruefe(nachWechsel[0] === "0" && nachWechsel[1] === "0",
    `Drehen: nach dem Wechsel der Seite stehen die Regler auf ${nachWechsel.join(" / ")} statt 0 / 0`);
}

// ── Abschnitt 4: Trapez ───────────────────────────────────────────────────
async function trapez(page) {
  for (const [a, c, h] of [[8, 4, 3.5], [10, 0.5, 2], [6, 6, 5], [4, 2, 4], [9, 5, 2.5]]) {
    await setzeRegler(page, "tz-a", a);
    await setzeRegler(page, "tz-c", c);
    await setzeRegler(page, "tz-h", h);
    const cEcht = Math.min(c, a);
    const A = ((a + cEcht) * h) / 2;
    for (const t of [0, 35, 60, 100]) {
      await setzeRegler(page, "tz-t", t);
      const wo = `a = ${a}, c = ${cEcht}, h = ${h}, Drehung = ${Math.round(t * 1.8)}°`;

      const bilanz = await text(page, "#tz-bilanz");
      pruefe(bilanz.includes(`2 · A = (a + c) · h = ${de(a + cEcht)} · ${de(h)} = ${de((a + cEcht) * h)} cm²`),
        `Trapez: ${wo} — die Bilanz nennt nicht 2 · A — „${bilanz}“`);
      pruefe(bilanz.includes(`A = ½ · (a + c) · h = ${de(A)} cm²`),
        `Trapez: ${wo} — die Bilanz nennt nicht A = ${de(A)} cm² — „${bilanz}“`);

      const p = await punkte(page, "tz-mount");
      const skala = skalaAus(p.A, p.B, a);
      const polys = await polygone(page, "tz-mount");
      const original = polys.find((x) => x.klasse.includes("fl-flaeche-fuell"));
      const kopie = polys.find((x) => x.klasse.includes("fl-flaeche-zweit"));
      pruefe(!!original && !!kopie, `Trapez: ${wo} — Original oder Kopie fehlt`);
      if (!original || !kopie) continue;
      const aOrig = polygonFlaeche(original.punkte) / (skala * skala);
      const aKopie = polygonFlaeche(kopie.punkte) / (skala * skala);
      pruefe(Math.abs(aOrig - A) < 0.03 * Math.max(1, A),
        `Trapez: ${wo} — das gezeichnete Trapez hat ${de(aOrig, 2)} cm² statt ${de(A)} cm²`);
      pruefe(Math.abs(aKopie - A) < 0.03 * Math.max(1, A),
        `Trapez: ${wo} — die gedrehte Kopie hat ${de(aKopie, 2)} cm² statt ${de(A)} cm²`);

      if (t === 100) {
        const alle = original.punkte.concat(kopie.punkte);
        const ys = alle.map((q) => q.y);
        const hoehe = (Math.max(...ys) - Math.min(...ys)) / skala;
        pruefe(Math.abs(hoehe - h) < 0.05,
          `Trapez: ${wo} — das entstandene Parallelogramm ist ${de(hoehe, 2)} cm hoch statt ${de(h)} cm`);
        // Unten liegen jetzt a und c hintereinander.
        const untenY = Math.max(...ys);
        const unten = alle.filter((q) => Math.abs(q.y - untenY) < 1.5).map((q) => q.x);
        const breiteUnten = (Math.max(...unten) - Math.min(...unten)) / skala;
        pruefe(Math.abs(breiteUnten - (a + cEcht)) < 0.06,
          `Trapez: ${wo} — die Grundseite des Parallelogramms misst ${de(breiteUnten, 2)} cm statt ${de(a + cEcht)} cm`);
      }
    }
    // Die Mittellinie: m = (a + c) : 2, und m · h ist wieder der Flächeninhalt.
    await page.locator("#tz-mitte").check();
    const bilanz = await text(page, "#tz-bilanz");
    const m = (a + cEcht) / 2;
    pruefe(bilanz.includes(`Mittellinie m = (a + c) : 2 = ${de(m)} cm`),
      `Trapez: a = ${a}, c = ${cEcht} — die Mittellinie fehlt — „${bilanz}“`);
    pruefe(Math.abs(m * h - A) < 1e-9, `Trapez: m · h = ${de(m * h)} statt ${de(A)}`);
    await page.locator("#tz-mitte").uncheck();
  }
}

// ── Abschnitt 4b: der Weg über die Mittellinie ────────────────────────────
//
// Zwei Behauptungen stehen hier, und beide werden nachgemessen:
//   1. Die Mittellinie ist (a + c)/2 lang — UNABHÄNGIG vom Versatz. Das ist der Kern des
//      Arguments „halbe Höhe, halber Versatz“, und es wird über alle Versätze geprüft.
//   2. Die beiden abgetrennten Ecken füllen nach der halben Drehung genau die Lücken: Am
//      Ende muss ein Rechteck der Breite m und der Höhe h dastehen, und zwar mit derselben
//      Fläche wie das Trapez.
async function mittellinie(page) {
  for (const [a, c, h] of [[9, 5, 4], [10, 2, 3], [6, 5.5, 5], [4, 4, 2], [8, 0.5, 4.5]]) {
    await setzeRegler(page, "ml-a", a);
    await setzeRegler(page, "ml-c", c);
    await setzeRegler(page, "ml-h", h);
    const cEcht = Math.min(c, a);
    const m = (a + cEcht) / 2;
    const A = m * h;

    // Der Versatz ist ein Anteil von a − c: 0 % lässt den linken Schenkel senkrecht stehen,
    // 100 % den rechten. Dazwischen liegen alle Trapeze, deren Schenkel beide nach innen fallen.
    for (const v of [0, 25, 50, 75, 100]) {
      await setzeRegler(page, "ml-v", v);
      for (const t of [0, 40, 70, 100]) {
        await setzeRegler(page, "ml-t", t);
        const wo = `a = ${a}, c = ${cEcht}, h = ${h}, Versatz = ${v}, Drehung = ${Math.round(t * 1.8)}°`;

        // Die Mittellinie hängt nicht vom Versatz ab — das ist die Aussage des Abschnitts.
        const bilanz = await text(page, "#ml-bilanz");
        pruefe(bilanz.includes(`= ${de(m)} cm — das Mittel von a und c`),
          `Mittellinie: ${wo} — die Bilanz nennt nicht m = ${de(m)} cm — „${bilanz}“`);
        pruefe(bilanz.includes(`= ${de(A)} cm²`),
          `Mittellinie: ${wo} — die Bilanz nennt nicht A = ${de(A)} cm² — „${bilanz}“`);

        const punkteML = await punkte(page, "ml-mount");
        pruefe(!!punkteML.P && !!punkteML.Q, `Mittellinie: ${wo} — P oder Q fehlt`);
        if (!punkteML.P || !punkteML.Q) continue;
        const skala = skalaAus(punkteML.P, punkteML.Q, m);

        const polys = await polygone(page, "ml-mount");
        const rumpf = polys.find((x) => x.klasse.includes("fl-flaeche-fuell"));
        const ecken = polys.filter((x) => x.klasse.includes("fl-flaeche-zweit"));
        pruefe(!!rumpf, `Mittellinie: ${wo} — der Rumpf fehlt`);
        pruefe(ecken.length === 2, `Mittellinie: ${wo} — ${ecken.length} Ecken statt 2`);
        if (!rumpf || ecken.length !== 2) continue;

        // Rumpf und Ecken ergeben zusammen immer das Trapez — beim Drehen geht nichts verloren.
        const aRumpf = polygonFlaeche(rumpf.punkte) / (skala * skala);
        const aEcken = ecken.map((e) => polygonFlaeche(e.punkte) / (skala * skala));
        pruefe(Math.abs(aRumpf + aEcken[0] + aEcken[1] - A) < 0.03 * Math.max(1, A),
          `Mittellinie: ${wo} — Rumpf und Ecken ergeben ${de(aRumpf + aEcken[0] + aEcken[1], 2)} cm² statt ${de(A)} cm²`);

        if (t === 100) {
          // Am Ende steht ein Rechteck: alles liegt zwischen den beiden Mittellinien-Enden,
          // und die Gesamtfigur ist genau m breit und h hoch.
          const alle = rumpf.punkte.concat(...ecken.map((e) => e.punkte));
          const xs = alle.map((q) => q.x), ys = alle.map((q) => q.y);
          const breite = (Math.max(...xs) - Math.min(...xs)) / skala;
          const hoehe = (Math.max(...ys) - Math.min(...ys)) / skala;
          pruefe(Math.abs(breite - m) < 0.05,
            `Mittellinie: ${wo} — die entstandene Figur ist ${de(breite, 2)} cm breit statt ${de(m)} cm`);
          pruefe(Math.abs(hoehe - h) < 0.05,
            `Mittellinie: ${wo} — die entstandene Figur ist ${de(hoehe, 2)} cm hoch statt ${de(h)} cm`);
          // Und die Ecken dürfen nicht mehr über die Mittellinien-Breite hinausragen.
          const linkeKante = Math.min(punkteML.P.x, punkteML.Q.x), rechteKante = Math.max(punkteML.P.x, punkteML.Q.x);
          for (const e of ecken) {
            for (const q of e.punkte) {
              pruefe(q.x >= linkeKante - 1.5 && q.x <= rechteKante + 1.5,
                `Mittellinie: ${wo} — nach der Drehung ragt eine Ecke noch über das Rechteck hinaus`);
            }
          }
        }
      }
    }
  }

  // Die Formel muss als echter Bruch dastehen — darum geht es in diesem Abschnitt.
  const brueche = await page.evaluate(() =>
    [...document.querySelectorAll("#sec-trapez .bruch")].map((b) => {
      const z = b.querySelector(".z"), n = b.querySelector(".n");
      return (z ? z.textContent : "") + " / " + (n ? n.textContent : "");
    }));
  pruefe(brueche.some((b) => /^a \+ c \/ 2$/.test(b)),
    `Mittellinie: die Formel steht nicht als Bruch (a + c)/2 — gefunden: ${brueche.join(" ; ")}`);
  pruefe(brueche.length >= 3,
    `Mittellinie: nur ${brueche.length} Brüche im Trapezabschnitt`);
}

// ── Abschnitt 5: Zusammenschau ────────────────────────────────────────────
//
// Die Behauptung: Die Trapezformel enthält die beiden anderen als Sonderfälle. Geprüft wird
// sie an den Grenzen — c = 0 muss das Dreieck liefern, c = a das Parallelogramm.
async function zusammenschau(page) {
  for (const a of [4, 7, 9]) {
    for (const h of [2, 4, 5]) {
      await setzeRegler(page, "zs-a", a);
      await setzeRegler(page, "zs-h", h);
      for (const c of [0, 1.5, a / 2, a, 9]) {
        await setzeRegler(page, "zs-c", c);
        const cEcht = Math.min(c, a);
        const wo = `a = ${a}, h = ${h}, c = ${cEcht}`;
        const A = ((a + cEcht) * h) / 2;

        const bilanz = await text(page, "#zs-bilanz");
        pruefe(bilanz.includes(`= ${de(A)} cm²`),
          `Zusammenschau: ${wo} — die Bilanz nennt nicht ${de(A)} cm² — „${bilanz}“`);

        // Die Sonderfälle müssen wirklich mit den anderen Formeln übereinstimmen.
        if (cEcht === 0) pruefe(Math.abs(A - (a * h) / 2) < 1e-9, `Zusammenschau: ${wo} — c = 0 ergibt nicht ½ · a · h`);
        if (cEcht === a) pruefe(Math.abs(A - a * h) < 1e-9, `Zusammenschau: ${wo} — c = a ergibt nicht a · h`);

        // Genau ein Fall ist hervorgehoben, und es ist der richtige.
        const aktiv = await page.evaluate(() =>
          [...document.querySelectorAll("#zs-faelle li")].map((li) => ({ aktiv: li.classList.contains("aktiv"), text: li.textContent })));
        pruefe(aktiv.length === 3, `Zusammenschau: ${wo} — ${aktiv.length} Fälle statt 3`);
        const markiert = aktiv.filter((x) => x.aktiv);
        pruefe(markiert.length === 1, `Zusammenschau: ${wo} — ${markiert.length} Fälle hervorgehoben, erwartet genau einer`);
        if (markiert.length === 1) {
          const erwartet = cEcht === 0 ? "Dreieck" : cEcht === a ? "Parallelogramm" : "Trapez";
          pruefe(markiert[0].text.includes(erwartet),
            `Zusammenschau: ${wo} — hervorgehoben ist „${markiert[0].text.slice(0, 40)}“, erwartet ${erwartet}`);
        }

        // Die gezeichnete Figur hat bei c = 0 wirklich nur drei Ecken.
        const polys = await polygone(page, "zs-mount");
        const figur = polys.find((x) => x.klasse.includes("fl-flaeche-fuell"));
        pruefe(!!figur && figur.punkte.length === (cEcht === 0 ? 3 : 4),
          `Zusammenschau: ${wo} — die Figur hat ${figur ? figur.punkte.length : 0} Ecken`);

        // Und sie hat wirklich den Flächeninhalt, den die Bilanz nennt. Der Maßstab steckt in
        // der Grundseite a: Sie ist im Polygon die Strecke von der ersten zur zweiten Ecke.
        if (figur) {
          const skala = skalaAus(figur.punkte[0], figur.punkte[1], a);
          const gezeichnet = polygonFlaeche(figur.punkte) / (skala * skala);
          pruefe(Math.abs(gezeichnet - A) < 0.02 * Math.max(1, A),
            `Zusammenschau: ${wo} — die Zeichnung hat ${de(gezeichnet, 2)} cm², behauptet werden ${de(A)} cm²`);

          // Die Deckseite muss auch wirklich c lang sein — sonst zeigte die Figur einen anderen
          // Sonderfall, als die Liste hervorhebt.
          if (cEcht > 0) {
            const cGezeichnet = Math.hypot(figur.punkte[2].x - figur.punkte[3].x,
              figur.punkte[2].y - figur.punkte[3].y) / skala;
            pruefe(Math.abs(cGezeichnet - cEcht) < 0.05,
              `Zusammenschau: ${wo} — die Deckseite misst ${de(cGezeichnet, 2)} cm statt ${de(cEcht)} cm`);
          }
        }
      }
    }
  }
}

// ── Die Kontrollfragen ────────────────────────────────────────────────────
async function quizze(page) {
  const ids = ["quiz-scherung", "quiz-parallelogramm", "quiz-dreieck", "quiz-hoehe", "quiz-trapez",
    "quiz-mittellinie", "quiz-zusammenschau"];
  const stellen = [];
  for (const id of ids) {
    const anzahl = await page.evaluate((q) => document.querySelectorAll(`#${q} .quiz-opt`).length, id);
    pruefe(anzahl >= 3, `Quiz ${id}: nur ${anzahl} Antwortmöglichkeiten`);
    let richtige = 0;
    for (let i = 0; i < anzahl; i++) {
      await page.locator(`#${id} .quiz-opt`).nth(i).click();
      const r = await page.evaluate((q) => {
        const f = document.querySelector(`#${q} .quiz-feedback`);
        return { ok: f.classList.contains("ok"), text: f.textContent };
      }, id);
      if (r.ok) { richtige++; stellen.push(i); }
      pruefe(r.text.length > 60, `Quiz ${id}, Antwort ${i + 1}: die Erklärung ist nur ${r.text.length} Zeichen lang`);
    }
    pruefe(richtige === 1, `Quiz ${id}: ${richtige} Antworten gelten als richtig, erwartet genau eine`);
  }
  // Die richtige Antwort darf nicht immer an derselben Stelle stehen: Sonst ließen sich alle
  // sechs Fragen richtig anklicken, ohne eine davon gelesen zu haben.
  pruefe(new Set(stellen).size >= 3,
    `Kontrollfragen: die richtige Antwort steht nur an ${new Set(stellen).size} verschiedenen Stellen (${stellen.join(", ")}) — das lässt sich erraten`);
}

// ── Die Übungsaufgaben ────────────────────────────────────────────────────

// Deutsche Zahl aus dem Aufgabentext.
const zahl = (s) => Number(String(s).replace(/−/g, "-").replace(/\.(?=\d{3}\b)/g, "").replace(",", "."));

const LAENGE = { mm: 0.1, cm: 1, dm: 10, m: 100 };
const FLAECHE = { "mm²": 0.01, "cm²": 1, "dm²": 100, "m²": 10000 };

// Die Maße einer Aufgabenfigur: gelesen wird das gezeichnete SVG, nicht der Text. Nur so
// fällt auf, wenn die Zeichnung etwas anderes zeigt als die Musterlösung rechnet.
async function figurMasse(page, box) {
  return page.evaluate((sel) => {
    const svg = document.querySelector(`${sel} .aufgabe-prompt svg`);
    if (!svg) return null;
    const texte = [...svg.querySelectorAll("text")].map((t) => ({ text: t.textContent, klasse: t.getAttribute("class") }));
    return { art: svg.dataset.figur, texte };
  }, box);
}

// Die Schranken für `mindestensVerschieden` sind gemessen, nicht geschätzt — mit
//
//   UPLANT_ZUEGE=25 node tests/werkzeug-streuung.js \
//       /mathematik/klasse-8/geometrie/flaecheninhalte.html
//
// (25, weil hier mit `runden: 25` geprüft wird; die Schranke hängt an der Rundenzahl).
// Gemessen am 2026-09-22, sichere Schranke je Aufgabe:
//
//   A1 13   A2 13   A3 18   A4 22   A5 22   A6 22
//   A7 22   A8 21   A9 22   A10 19  A11 18  A12 15
//
// Eingetragen sind durchweg kleinere Werte: Eine zu hohe Schranke macht den Gesamtlauf
// launisch, und verlorengehen darf dabei nichts — geprüft wird ja, ob ein Generator
// überhaupt streut, nicht wie gut.
async function aufgaben(page) {
  // ---- einfach: der Flächeninhalt aus der Zeichnung ----
  //
  // Die Maße stehen NUR im Bild. Der Test liest sie von dort — damit ist zugleich geprüft,
  // dass die Zeichnung die Zahlen trägt, mit denen die Musterlösung rechnet.
  for (const [nr, art, name, formel] of [
    [1, "dreieck", "A1 Dreieck ablesen", (m) => (m[0] * m[1]) / 2],
    [2, "parallelogramm", "A2 Parallelogramm ablesen", (m) => m[0] * m[1]],
    [3, "trapez", "A3 Trapez ablesen", (m) => ((m[0] + m[1]) * m[2]) / 2],
  ]) {
    await pruefeAufgabe(page, bericht, {
      nr, name, runden: 25, mindestensVerschieden: 12,
      liesRoh: async (p, box) => figurMasse(p, box),
      deute: (frage, roh) => {
        if (!roh || roh.art !== art) return null;
        // Reihenfolge im SVG: erst die blauen Grundseiten, dann die violette Höhe.
        const grund = roh.texte.filter((t) => t.klasse === "fl-fig-grund-text").map((t) => zahl(t.text));
        const hoehe = roh.texte.filter((t) => t.klasse === "fl-fig-hoehe-text").map((t) => zahl(t.text));
        if (hoehe.length !== 1) return null;
        const masse = grund.concat(hoehe);
        if (art === "trapez" ? masse.length !== 3 : masse.length !== 2) return null;
        const A = formel(masse);
        const falsch = art === "parallelogramm"
          ? [[A / 2, "Dreieck"], [masse[0] + masse[1], "multipliziert"]]
          : art === "dreieck"
            ? [[masse[0] * masse[1], "Rechteck"], [masse[0] + masse[1], "multipliziert"]]
            : [[(masse[0] + masse[1]) * masse[2], "Halbieren fehlt"], [masse[0] * masse[2], "beide"]];
        return {
          richtig: A,
          toleranz: 0.0005,
          falsch,
          pruefe: (f, rueck) => {
            pruefe(masse.every((x) => Number.isFinite(x) && x > 0),
              `${name}: unlesbare Maße ${JSON.stringify(masse)} — „${f}“`);
            // Die Musterlösung muss mit denselben Zahlen rechnen, die im Bild stehen.
            for (const x of masse) {
              pruefe(rueck.includes(`${de(x)} cm`), `${name}: das Maß ${de(x)} cm fehlt in der Musterlösung — „${f}“`);
            }
            pruefe(rueck.includes(`${de(A)} cm²`), `${name}: das Ergebnis ${de(A)} cm² fehlt in der Musterlösung`);
            if (art === "trapez") {
              pruefe(masse[0] !== masse[1], `${name}: beide parallelen Seiten sind ${de(masse[0])} cm lang — „${f}“`);
            }
          },
        };
      },
    });
  }

  // ---- mittel: mit Einheitenumrechnung ----
  for (const [nr, name, wort, formel] of [
    [4, "A4 Dreieck mit Einheiten", "Dreieck", (g, h) => (g * h) / 2],
    [5, "A5 Parallelogramm mit Einheiten", "Parallelogramm", (g, h) => g * h],
  ]) {
    await pruefeAufgabe(page, bericht, {
      nr, name, runden: 25, mindestensVerschieden: 18,
      deute: (frage) => {
        const m = frage.match(/g = ([\d.,]+) (mm|cm|dm|m) und die zugehörige Höhe h = ([\d.,]+) (mm|cm|dm|m)/);
        const z = frage.match(/Flächeninhalt in (mm²|cm²|dm²|m²)/);
        if (!m || !z) return null;
        const gCm = zahl(m[1]) * LAENGE[m[2]];
        const hCm = zahl(m[3]) * LAENGE[m[4]];
        const ziel = FLAECHE[z[1]];
        const A = formel(gCm, hCm) / ziel;
        return {
          richtig: Math.round(A * 1e6) / 1e6,
          toleranz: Math.max(1e-4, Math.abs(A) * 1e-5),
          falsch: [
            // Die Einheiten stehen gelassen — der Fehler, um den es in dieser Aufgabe geht.
            [formel(zahl(m[1]), zahl(m[3])) / ziel, "Einheiten"],
          ],
          pruefe: (f, rueck) => {
            pruefe(m[2] !== m[4], `${name}: beide Längen stehen in ${m[2]} — dann ist nichts umzurechnen — „${f}“`);
            pruefe(frage.includes(wort), `${name}: der Aufgabentext nennt die Figur nicht — „${f}“`);
            pruefe(rueck.includes(`${de(gCm)} cm`) && rueck.includes(`${de(hCm)} cm`),
              `${name}: die Musterlösung rechnet nicht in eine gemeinsame Einheit um — „${f}“`);
            pruefe(Math.abs(A - Math.round(A * 100) / 100) < 1e-9,
              `${name}: das Ergebnis ${A} hat mehr als zwei Nachkommastellen — „${f}“`);
          },
        };
      },
    });
  }
  await pruefeAufgabe(page, bericht, {
    nr: 6, name: "A6 Trapez mit Einheiten", runden: 25, mindestensVerschieden: 18,
    deute: (frage) => {
      const m = frage.match(/a = ([\d.,]+) (mm|cm|dm|m) und c = ([\d.,]+) (mm|cm|dm|m) sowie die Höhe h = ([\d.,]+) (mm|cm|dm|m)/);
      const z = frage.match(/Flächeninhalt in (mm²|cm²|dm²|m²)/);
      if (!m || !z) return null;
      const aCm = zahl(m[1]) * LAENGE[m[2]];
      const cCm = zahl(m[3]) * LAENGE[m[4]];
      const hCm = zahl(m[5]) * LAENGE[m[6]];
      const ziel = FLAECHE[z[1]];
      const A = ((aCm + cCm) * hCm) / 2 / ziel;
      return {
        richtig: Math.round(A * 1e6) / 1e6,
        toleranz: Math.max(1e-4, Math.abs(A) * 1e-5),
        falsch: [
          [((aCm + cCm) * hCm) / ziel, "Halbieren fehlt"],
          [((zahl(m[1]) + zahl(m[3])) * zahl(m[5])) / 2 / ziel, "gleichnamige"],
        ],
        pruefe: (f, rueck) => {
          pruefe(m[2] !== m[4], `A6: a und c stehen in derselben Einheit — dann ist nichts umzurechnen — „${f}“`);
          pruefe(aCm > cCm, `A6: a = ${de(aCm)} cm ist nicht länger als c = ${de(cCm)} cm — „${f}“`);
          pruefe(rueck.includes(`${de(aCm + cCm)} cm`),
            `A6: die Musterlösung addiert die parallelen Seiten nicht in einer gemeinsamen Einheit — „${f}“`);
        },
      };
    },
  });

  // ---- schwierig: die fehlende Größe ----
  for (const [nr, name, faktor] of [
    [7, "A7 Dreieck rückwärts", 0.5],
    [8, "A8 Parallelogramm rückwärts", 1],
  ]) {
    await pruefeAufgabe(page, bericht, {
      nr, name, runden: 25, mindestensVerschieden: 18,
      deute: (frage) => {
        const mA = frage.match(/A = ([\d.,]+) (mm²|cm²|dm²|m²)/);
        const mG = frage.match(/(Grundseite|Höhe) ist (?:g|h) = ([\d.,]+) (mm|cm|dm|m)/);
        const mZ = frage.match(/Antworte in (mm|cm|dm|m)\./);
        if (!mA || !mG || !mZ) return null;
        const flaecheCm2 = zahl(mA[1]) * FLAECHE[mA[2]];
        const gegebenCm = zahl(mG[2]) * LAENGE[mG[3]];
        // A = faktor · g · h  ⟹  gesucht = A : (faktor · gegeben)
        const gesuchtCm = flaecheCm2 / (faktor * gegebenCm);
        const gesucht = gesuchtCm / LAENGE[mZ[1]];
        return {
          richtig: Math.round(gesucht * 1e6) / 1e6,
          toleranz: Math.max(1e-4, Math.abs(gesucht) * 1e-5),
          falsch: [
            // Die Rechenart stimmt, die Umrechnung fehlt.
            [zahl(mA[1]) / (faktor * zahl(mG[2])), "Einheiten"],
          ],
          pruefe: (f, rueck) => {
            pruefe(mG[3] === mZ[1], `${name}: gegeben in ${mG[3]}, gefragt in ${mZ[1]} — das ist unnötig verwirrend — „${f}“`);
            // Die Probe muss in der Musterlösung stehen: Rückwärtsrechnen ohne Probe ist
            // die häufigste Quelle unbemerkter Vorzeichen- und Faktorfehler.
            pruefe(rueck.includes("Probe"), `${name}: die Musterlösung macht keine Probe — „${f}“`);
            pruefe(Math.abs(faktor * gegebenCm * gesuchtCm - flaecheCm2) < 1e-6 * Math.max(1, flaecheCm2),
              `${name}: die Probe geht nicht auf — „${f}“`);
            if (faktor === 0.5) {
              pruefe(/2 · A/.test(rueck), `${name}: die Musterlösung verdoppelt nicht, bevor sie teilt — „${f}“`);
            }
          },
        };
      },
    });
  }
  await pruefeAufgabe(page, bericht, {
    nr: 9, name: "A9 Trapez rückwärts", runden: 25, mindestensVerschieden: 18,
    deute: (frage) => {
      const mA = frage.match(/A = ([\d.,]+) cm²/);
      const mFrage = frage.match(/Wie groß ist (die Seite a|die Seite c|die Höhe h)\?/);
      if (!mA || !mFrage) return null;
      const A = zahl(mA[1]);
      if (mFrage[1] === "die Höhe h") {
        const m = frage.match(/a = ([\d.,]+) cm<\/strong> und <strong>c = ([\d.,]+) cm/) || frage.match(/a = ([\d.,]+) cm und c = ([\d.,]+) cm/);
        if (!m) return null;
        const a = zahl(m[1]), c = zahl(m[2]);
        const h = (2 * A) / (a + c);
        return {
          richtig: h, toleranz: 0.0005,
          falsch: [[A / (a + c), "Verdoppeln"], [a + c, "Summe"]],
          pruefe: (f, rueck) => {
            pruefe(Math.abs(((a + c) * h) / 2 - A) < 1e-6, `A9: die Probe geht nicht auf — „${f}“`);
            pruefe(rueck.includes("Probe"), `A9: die Musterlösung macht keine Probe — „${f}“`);
          },
        };
      }
      const nachA = mFrage[1] === "die Seite a";
      const m = frage.match(/(?:c|a) = ([\d.,]+) cm.*?Höhe.*?h = ([\d.,]+) cm/);
      if (!m) return null;
      const bekannt = zahl(m[1]), h = zahl(m[2]);
      const summe = (2 * A) / h;
      const gesucht = summe - bekannt;
      return {
        richtig: gesucht, toleranz: 0.0005,
        falsch: [[summe, "Summe"], [A / h - bekannt, "Verdoppeln"]],
        pruefe: (f, rueck) => {
          pruefe(gesucht > 0, `A9: die gesuchte Seite wäre ${de(gesucht)} cm — „${f}“`);
          pruefe(nachA ? gesucht > bekannt : gesucht < bekannt,
            `A9: a = ${de(nachA ? gesucht : bekannt)} cm ist nicht länger als c = ${de(nachA ? bekannt : gesucht)} cm — „${f}“`);
          pruefe(rueck.includes("Probe"), `A9: die Musterlösung macht keine Probe — „${f}“`);
        },
      };
    },
  });

  // ---- komplex ----
  await pruefeAufgabe(page, bericht, {
    nr: 11, name: "A11 zwei Seiten, zwei Höhen", runden: 25, mindestensVerschieden: 15,
    deute: (frage) => {
      const mA = frage.match(/a = ([\d.,]+) cm/);
      const mB = frage.match(/b = ([\d.,]+) cm/);
      const mH = frage.match(/gehört die Höhe h[^=]*= ([\d.,]+) cm/);
      if (!mA || !mB || !mH) return null;
      const a = zahl(mA[1]);
      const b = zahl(mB[1]);
      const ha = zahl(mH[1]);
      const A = a * ha, hb = A / b;
      return {
        felder: [A, hb],
        toleranz: 0.0005,
        falschFelder: [
          [0, a * b, "Seiten"],
          [0, (a * ha) / 2, "Dreieck"],
          [1, ha, "kürzere"],
        ],
        pruefe: (f, rueck) => {
          pruefe(hb <= a + 1e-9 && ha <= b + 1e-9,
            `A10: die Höhen passen nicht zu den Seiten (h_a = ${de(ha)}, b = ${de(b)}) — „${f}“`);
          pruefe(Math.abs(b * hb - A) < 1e-6, `A10: b · h_b ergibt nicht A — „${f}“`);
          pruefe((b > a) === (hb < ha), `A10: zur längeren Seite gehört nicht die kürzere Höhe — „${f}“`);
          pruefe(rueck.includes("Kontrolle"), `A10: die Musterlösung kontrolliert das Ergebnis nicht — „${f}“`);
        },
      };
    },
  });
  await pruefeAufgabe(page, bericht, {
    nr: 10, name: "A10 Viereck zerlegen", runden: 25, mindestensVerschieden: 15,
    deute: (frage) => {
      const mE = frage.match(/AC = ([\d.,]+) cm/);
      const mH = [...frage.matchAll(/Abstand ([\d.,]+) cm/g)].map((x) => zahl(x[1]));
      if (!mE || mH.length !== 2) return null;
      const e = zahl(mE[1]), [h1, h2] = mH;
      const A1 = (e * h1) / 2, A2 = (e * h2) / 2;
      return {
        felder: [A1, A2, A1 + A2],
        toleranz: 0.0005,
        falschFelder: [
          [0, e * h1, "Halbieren"],
          [1, e * h2, "Halbieren"],
          [2, e * (h1 + h2), "Halbieren"],
        ],
        pruefe: (f, rueck) => {
          pruefe(h1 !== h2, `A11: beide Abstände sind ${de(h1)} cm — dann sind beide Felder gleich — „${f}“`);
          // Die Abkürzung muss in der Musterlösung stehen — sie ist die Brücke zum Trapez.
          pruefe(rueck.includes("Kürzer"), `A11: die Musterlösung zeigt das Ausklammern nicht — „${f}“`);
          pruefe(Math.abs((e * (h1 + h2)) / 2 - (A1 + A2)) < 1e-9, `A11: das Ausklammern stimmt nicht — „${f}“`);
        },
      };
    },
  });
  await pruefeAufgabe(page, bericht, {
    nr: 12, name: "A12 Trapez zerlegen", runden: 25, mindestensVerschieden: 15,
    deute: (frage) => {
      const mA = frage.match(/a = ([\d.,]+) cm<\/strong> \(unten\)|a = ([\d.,]+) cm \(unten\)/);
      const mC = frage.match(/c = ([\d.,]+) cm \(oben\)/);
      const mH = frage.match(/Höhe h = ([\d.,]+) cm/);
      if (!mA || !mC || !mH) return null;
      const a = zahl(mA[1] || mA[2]);
      const c = zahl(mC[1]);
      const h = zahl(mH[1]);
      const rechteck = c * h, dreieck = ((a - c) * h) / 2;
      return {
        felder: [rechteck, dreieck, rechteck + dreieck],
        toleranz: 0.0005,
        falschFelder: [
          [0, a * h, "kürzere"],
          [1, (a - c) * h, "Halbieren"],
          [2, a * h, "umschließende"],
        ],
        pruefe: (f, rueck) => {
          pruefe(a > c, `A12: a = ${de(a)} cm ist nicht länger als c = ${de(c)} cm — „${f}“`);
          // Beide Wege müssen dasselbe liefern — das ist der Kern der Aufgabe.
          pruefe(Math.abs(rechteck + dreieck - ((a + c) * h) / 2) < 1e-9,
            `A12: Zerlegung und Trapezformel liefern Verschiedenes — „${f}“`);
          pruefe(rueck.includes("Probe mit der Trapezformel"),
            `A12: die Musterlösung prüft nicht mit der Trapezformel nach — „${f}“`);
        },
      };
    },
  });
}

// ── Seitengerüst ──────────────────────────────────────────────────────────
async function geruest(page) {
  const anker = ["sec-scherung", "sec-parallelogramm", "sec-dreieck", "sec-trapez",
    "sec-zusammenschau", "sec-vernetzung", "sec-formelsammlung", "sec-uebungen"];
  for (const a of anker) {
    const da = await page.evaluate((id) => !!document.getElementById(id), a);
    pruefe(da, `Gerüst: der Abschnitt #${a} fehlt`);
  }

  // Die Formelsammlung steht wie beim Thales-Pfad als PDF bereit. Geprüft wird der Verweis, die
  // Datei selbst (Kopf, Größe, genau zwei Seiten A4 quer) und dass ihre Quelle alle drei Formeln,
  // die Umkehrformeln und die Einheiten enthält — das PDF entsteht aus dieser Quelle.
  const verweis = await page.evaluate(() => {
    const a = document.querySelector("#sec-formelsammlung a[download]");
    return a ? a.getAttribute("href") : null;
  });
  pruefe(verweis === "flaecheninhalte.pdf", `Formelsammlung: der Download-Verweis fehlt oder zeigt auf „${verweis}“`);
  const wurzel = path.resolve(__dirname, "..", "..");
  const pdf = path.join(wurzel, "mathematik/klasse-8/geometrie/flaecheninhalte.pdf");
  pruefe(fs.existsSync(pdf), "Formelsammlung: flaecheninhalte.pdf fehlt");
  if (fs.existsSync(pdf)) {
    const roh = fs.readFileSync(pdf);
    pruefe(roh.subarray(0, 5).toString("latin1") === "%PDF-", "Formelsammlung: die Datei ist kein PDF");
    pruefe(roh.length > 20000, `Formelsammlung: das PDF ist nur ${roh.length} Bytes groß`);
    const seiten = (roh.toString("latin1").match(/\/Type\s*\/Page(?!s)/g) || []).length;
    pruefe(seiten === 2, `Formelsammlung: das PDF hat ${seiten} Seiten statt 2`);
    const box = roh.toString("latin1").match(/\/MediaBox\s*\[\s*0 0 ([\d.]+) ([\d.]+)/);
    pruefe(!!box && Number(box[1]) > Number(box[2]), "Formelsammlung: das PDF ist nicht im Querformat");
  }
  const quelle = fs.readFileSync(path.join(wurzel, "tools/formelsammlung/formelsammlung-fl-quelle.html"), "utf8")
    .replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/\s+/g, " ");
  for (const f of ["A = ½ · g · h", "A = g · h", "A = ½ · (a + c) · h", "g = A : h", "h = 2 · A : g",
    "h = 2 · A : (a + c)", "1 m² = 100 dm²", "m = a − (a − c) : 2 = (a + c) : 2"]) {
    pruefe(quelle.includes(f), `Formelsammlung: „${f}“ fehlt in der Quelle des PDFs`);
  }

  // Pythagoras und Wurzeln kommen erst in Klasse 9 — außer als ausdrücklicher Ausblick.
  const haupt = await page.evaluate(() => document.querySelector("main").innerText);
  const wurzeln = haupt.match(/√|Quadratwurzel|Wurzel ziehen/g) || [];
  pruefe(wurzeln.length === 0, `Gerüst: es kommen Wurzeln vor (${wurzeln.length}×) — die gibt es erst in Klasse 9`);
  const pyth = [...haupt.matchAll(/.{60}Pythagoras.{60}/gs)].map((m) => m[0]);
  for (const stelle of pyth) {
    pruefe(/Klasse 9|noch nicht|gemessen|berechnen statt/.test(stelle),
      `Gerüst: Pythagoras wird erwähnt, ohne ihn als Klasse-9-Stoff auszuweisen — „${stelle.trim()}“`);
  }

  // Alle Verweise müssen irgendwohin führen.
  const links = await page.evaluate(() =>
    [...document.querySelectorAll("main a[href]")].map((a) => a.getAttribute("href")).filter((h) => !h.startsWith("#") && !h.startsWith("http")));
  for (const href of new Set(links)) {
    const ziel = new URL(href.split("#")[0], "http://localhost/mathematik/klasse-8/geometrie/").pathname;
    const antwort = await page.request.get("http://localhost:" + (process.env.UPLANT_PORT || "8936") + ziel);
    pruefe(antwort.ok(), `Gerüst: der Verweis „${href}“ führt ins Leere (${antwort.status()})`);
  }

  // Die Menükarte auf der Übersichtsseite muss auf diese Seite zeigen.
  const inMenue = await page.evaluate(async () => {
    const html = await (await fetch("index.html")).text();
    return html.includes('href="flaecheninhalte.html"');
  });
  pruefe(inMenue, "Gerüst: die Übersichtsseite verweist nicht auf die Flächeninhalte");

  // Die Reihenfolge der Herleitungen: Dreieck, Parallelogramm, Trapez. Sie ist keine
  // Geschmacksfrage — der zweite Trapezweg benutzt das Parallelogramm, und das Dreieck steht
  // voran, weil es mit dem Rechteck allein auskommt.
  const folge = await page.evaluate(() =>
    [...document.querySelectorAll("main section[id]")].map((s) => s.id));
  const drin = (id) => folge.indexOf(id);
  pruefe(drin("sec-dreieck") < drin("sec-parallelogramm"),
    `Gerüst: das Dreieck steht nicht vor dem Parallelogramm — ${folge.join(", ")}`);
  pruefe(drin("sec-parallelogramm") < drin("sec-trapez"),
    `Gerüst: das Parallelogramm steht nicht vor dem Trapez — ${folge.join(", ")}`);

  // Im Trapez-Abschnitt kommt die Mittellinie zuerst: Sie braucht nur das Rechteck. Das
  // Verdoppeln steht danach, weil es das Parallelogramm aus Abschnitt 3 benutzt.
  const trapezFolge = await page.evaluate(() => {
    const s = document.getElementById("sec-trapez");
    const alle = [...s.querySelectorAll("h3, #ml-mount, #tz-mount, #quiz-mittellinie, #quiz-trapez")];
    return alle.map((e) => e.id || e.tagName + ":" + e.textContent.trim());
  });
  const stelle = (x) => trapezFolge.findIndex((e) => e.includes(x));
  pruefe(stelle("ml-mount") >= 0 && stelle("ml-mount") < stelle("tz-mount"),
    `Gerüst: im Trapez steht das Verdoppeln vor der Mittellinie — ${trapezFolge.join(" | ")}`);
  pruefe(/Mittellinie/.test(trapezFolge[0] || ""),
    `Gerüst: der erste Weg zum Trapez ist nicht die Mittellinie — ${trapezFolge.join(" | ")}`);
  pruefe(stelle("quiz-mittellinie") < stelle("tz-mount"),
    `Gerüst: die Kontrollfrage zur Mittellinie steht nicht beim ersten Weg — ${trapezFolge.join(" | ")}`);

  // Und die Herleitung des Dreiecks darf das Parallelogramm nicht schon benutzen: Es ist an
  // dieser Stelle noch nicht hergeleitet. Erwähnt werden darf es erst ab Abschnitt 3.
  const drText = await page.evaluate(() => {
    const s = document.getElementById("sec-dreieck");
    const bis = s.querySelector("h3");   // ab „Welche Höhe gehört zu welcher Grundseite?“
    let out = "";
    for (const k of s.children) { if (k === bis) break; out += " " + k.innerText; }
    return out;
  });
  pruefe(!/Parallelogramm/.test(drText),
    `Gerüst: die Dreiecksherleitung benutzt das Parallelogramm, das erst danach hergeleitet wird — „${drText.slice(0, 160)}“`);
  pruefe(/Rechteck/.test(drText),
    `Gerüst: die Dreiecksherleitung führt nicht auf das Rechteck zurück — „${drText.slice(0, 160)}“`);

  // Zwölf Aufgaben, drei je Stufe.
  const proStufe = await page.evaluate(async () => {
    const out = [];
    const tabs = [...document.querySelectorAll("#exercises-mount .schwierigkeit-tabs button")];
    for (const t of tabs) {
      t.click();
      out.push(document.querySelectorAll("#exercises-mount .schwierigkeit-tab-panel .aufgabe-box").length);
    }
    return out;
  });
  pruefe(proStufe.length === 4, `Gerüst: ${proStufe.length} Schwierigkeitsstufen statt 4`);
  pruefe(proStufe.every((n) => n === 3), `Gerüst: die Stufen haben ${proStufe.join("/")} Aufgaben statt 3/3/3/3`);
}

(async () => {
  const browser = await starteBrowser();
  for (const dunkel of [false, true]) {
    const wo = dunkel ? "dunkel" : "hell";
    const page = await neueSeite(browser, { dunkel });
    await oeffne(page, SEITE);
    if (!dunkel) {
      await geruest(page);
      await scherung(page);
      await parallelogramm(page);
      await dreieck(page);
      await grundseiten(page);
      await grundseitenBewegung(page);
      await trapez(page);
      await mittellinie(page);
      await zusammenschau(page);
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
