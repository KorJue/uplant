// Fachliche Prüfung: Klasse 8, Geometrie, Thema 3 „Satz des Thales“.
//
// Der Satz behauptet eine Gleichheit — genau 90°, nicht ungefähr. Deshalb wird an jeder
// Reglerstellung beides geprüft: dass die Bilanz 90° schreibt UND dass der gezeichnete Punkt C
// wirklich auf dem Kreis liegt und der gezeichnete Winkel dort wirklich ein rechter ist. Eine
// Zeichnung, die 90° behauptet und 89,4° zeigt, wäre schlimmer als gar keine.
//
// Die Umkehrung wird an ihrer Kernaussage geprüft: innerhalb des Kreises > 90°, auf dem Kreis
// = 90°, außerhalb < 90°. Und die Konstruktion wird wirklich ausgeführt — mit Zirkel- und
// Linealklicks auf die Zeichenfläche, bis „Prüfen“ sie anerkennt.

"use strict";

const { neuerBericht } = require("../lib/pruefen");
const { starteBrowser, neueSeite, oeffne, setzeRegler, text } = require("../lib/seite");
const { pruefeNotation } = require("../lib/notation");
const { pruefeKontrast } = require("../lib/kontrast");
const { pruefeAufgabe } = require("../lib/aufgaben");
const { neueWerkbank, kreisSchnitt } = require("../lib/konstruieren.js");

const bericht = neuerBericht();
const { pruefe } = bericht;
const SEITE = "/mathematik/klasse-8/geometrie/satz-des-thales.html";

const GRAD = Math.PI / 180;
const de = (x, stellen = 4) => Number(x.toFixed(stellen)).toLocaleString("de-DE", { maximumFractionDigits: stellen });

// Ganzzahlige Potenz ohne Math.pow — 41² muss exakt 1681 sein.
const q2 = (x) => x * x;

// Winkel ∡PVQ in Grad, aus Koordinaten.
function winkelBei(V, P, Q) {
  const u = { x: P.x - V.x, y: P.y - V.y };
  const v = { x: Q.x - V.x, y: Q.y - V.y };
  return Math.atan2(Math.abs(u.x * v.y - u.y * v.x), u.x * v.x + u.y * v.y) / GRAD;
}

// Punkte einer Zeichnung. Jede Marke steht in einer eigenen Gruppe, die ihren Namen trägt —
// gelesen wird der KREIS, nicht die Beschriftung: Sie sitzt versetzt daneben und läge bei eng
// benachbarten Punkten näher an der falschen Marke.
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

// ── Abschnitt 1: der rechte Winkel im Halbkreis ───────────────────────────
async function halbkreis(page) {
  for (let phi = 10; phi <= 170; phi += 5) {
    await setzeRegler(page, "hk-phi", phi);
    const wo = `φ = ${phi}°`;

    // Basiswinkel im gleichschenkligen Dreieck — exakt, nicht aus Koordinaten.
    const alpha = phi / 2;
    const beta = 90 - phi / 2;
    pruefe(Math.abs(alpha + beta - 90) < 1e-12, `Halbkreis: ${wo} — α + β = ${alpha + beta}°`);

    const anzeige = await text(page, "#hk-phi-anzeige");
    pruefe(anzeige === `φ = ${de(phi)}°`, `Halbkreis: ${wo} — die Reglerbeschriftung lautet „${anzeige}“`);

    const bilanz = await text(page, "#hk-bilanz");
    pruefe(bilanz.includes(`α = ${de(alpha, 1)}°`), `Halbkreis: ${wo} — α = ${de(alpha, 1)}° fehlt in der Bilanz — „${bilanz}“`);
    pruefe(bilanz.includes(`β = ${de(beta, 1)}°`), `Halbkreis: ${wo} — β = ${de(beta, 1)}° fehlt — „${bilanz}“`);
    // Der Satz behauptet eine Gleichheit. „≈ 90°“ wäre hier falsch.
    pruefe(bilanz.includes("γ = 90°"), `Halbkreis: ${wo} — die Bilanz schreibt nicht „γ = 90°“ — „${bilanz}“`);

    // Und nun die Zeichnung selbst: Liegt C wirklich auf dem Kreis, und ist der Winkel dort
    // wirklich ein rechter? Beides unabhängig aus den gezeichneten Koordinaten.
    const p = await punkte(page, "hk-mount");
    pruefe(!!(p.A && p.B && p.C && p.M), `Halbkreis: ${wo} — nicht alle Punkte beschriftet`);
    if (p.A && p.B && p.C && p.M) {
      const R = Math.hypot(p.A.x - p.M.x, p.A.y - p.M.y);
      const rC = Math.hypot(p.C.x - p.M.x, p.C.y - p.M.y);
      pruefe(Math.abs(rC - R) < 0.5, `Halbkreis: ${wo} — C liegt ${de(rC, 1)} statt ${de(R, 1)} vom Mittelpunkt entfernt`);
      pruefe(Math.abs(Math.hypot(p.B.x - p.M.x, p.B.y - p.M.y) - R) < 0.5,
        `Halbkreis: ${wo} — M ist nicht die Mitte von AB`);
      const gamma = winkelBei(p.C, p.A, p.B);
      pruefe(Math.abs(gamma - 90) < 0.15, `Halbkreis: ${wo} — der gezeichnete Winkel bei C misst ${de(gamma, 2)}°`);
      // Auch die beiden anderen Winkel müssen zu den ausgewiesenen Zahlen passen.
      pruefe(Math.abs(winkelBei(p.A, p.B, p.C) - alpha) < 0.15,
        `Halbkreis: ${wo} — gezeichnetes α = ${de(winkelBei(p.A, p.B, p.C), 2)}°, ausgewiesen ${alpha}°`);
      pruefe(Math.abs(winkelBei(p.B, p.A, p.C) - beta) < 0.15,
        `Halbkreis: ${wo} — gezeichnetes β = ${de(winkelBei(p.B, p.A, p.C), 2)}°, ausgewiesen ${beta}°`);
    }
  }

  // Der Schalter für die Radien muss auch wirklich drei Radien zeichnen.
  for (const an of [false, true]) {
    await page.evaluate((v) => {
      const c = document.getElementById("hk-radien");
      c.checked = v;
      c.dispatchEvent(new Event("input", { bubbles: true }));
    }, an);
    const gestrichelt = await page.evaluate(() =>
      [...document.querySelectorAll("#hk-mount svg line")].filter((l) => l.getAttribute("stroke-dasharray")).length);
    pruefe(gestrichelt === (an ? 3 : 0),
      `Halbkreis: Schalter „Radien“ ${an ? "an" : "aus"} — ${gestrichelt} gestrichelte Strecken statt ${an ? 3 : 0}`);
  }
  await page.evaluate(() => {
    const c = document.getElementById("hk-radien");
    c.checked = false;
    c.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

// ── Abschnitt 2: der Beweis ───────────────────────────────────────────────
async function beweis(page) {
  for (let phi = 20; phi <= 160; phi += 10) {
    await setzeRegler(page, "bw-phi", phi);
    const alpha = phi / 2, beta = 90 - phi / 2;
    const wo = `φ = ${phi}°`;

    // Bei diesem Regler sind α und β ganzzahlig — Schrittweite 10° halbiert sich zu 5°.
    pruefe(Number.isInteger(alpha) && Number.isInteger(beta),
      `Beweis: ${wo} — α = ${alpha}° und β = ${beta}° sind nicht beide ganzzahlig`);

    const bilanz = await text(page, "#bw-bilanz");
    pruefe(bilanz.includes(`∡MAC = ∡MCA = α = ${de(alpha)}°`),
      `Beweis: ${wo} — die Basiswinkel des Dreiecks AMC fehlen — „${bilanz}“`);
    pruefe(bilanz.includes(`∡MBC = ∡MCB = β = ${de(beta)}°`),
      `Beweis: ${wo} — die Basiswinkel des Dreiecks BMC fehlen — „${bilanz}“`);
    pruefe(bilanz.includes(`γ = α + β = ${de(alpha)}° + ${de(beta)}° = 90°`),
      `Beweis: ${wo} — die Zusammensetzung γ = α + β fehlt — „${bilanz}“`);
    pruefe(bilanz.includes("2 · γ = 180°"), `Beweis: ${wo} — der Schluss über die Winkelsumme fehlt — „${bilanz}“`);

    const p = await punkte(page, "bw-mount");
    if (p.A && p.B && p.C && p.M) {
      // Der eine zusätzliche Strich, um den es geht: die Zerlegung des Winkels bei C.
      const acm = winkelBei(p.C, p.A, p.M);
      const mcb = winkelBei(p.C, p.M, p.B);
      pruefe(Math.abs(acm - alpha) < 0.15, `Beweis: ${wo} — der gezeichnete Winkel ∡ACM misst ${de(acm, 2)}° statt ${alpha}°`);
      pruefe(Math.abs(mcb - beta) < 0.15, `Beweis: ${wo} — der gezeichnete Winkel ∡MCB misst ${de(mcb, 2)}° statt ${beta}°`);
      // Und die drei Radien sind wirklich gleich lang — sonst wären die Dreiecke nicht
      // gleichschenklig, und der ganze Beweis stünde auf einer falschen Zeichnung.
      const r = [p.A, p.B, p.C].map((P) => Math.hypot(P.x - p.M.x, P.y - p.M.y));
      pruefe(Math.max(...r) - Math.min(...r) < 0.5,
        `Beweis: ${wo} — die Radien sind ${r.map((v) => de(v, 1)).join(", ")} — nicht gleich lang`);
    }

    // Die beiden gleichschenkligen Teildreiecke müssen als Flächen sichtbar sein.
    const flaechen = await page.evaluate(() => document.querySelectorAll("#bw-mount svg polygon").length);
    pruefe(flaechen === 2, `Beweis: ${wo} — ${flaechen} hinterlegte Teildreiecke statt 2`);
  }
}

// ── Abschnitt 3: die Umkehrung ────────────────────────────────────────────
async function umkehrung(page) {
  const R = 100; // Radius in den Einheiten des Abstandsreglers
  for (let phi = 20; phi <= 160; phi += 10) {
    for (let d = 40; d <= 170; d += 5) {
      await setzeRegler(page, "uk-phi", phi);
      await setzeRegler(page, "uk-d", d);
      const wo = `φ = ${phi}°, d = ${d}`;

      const p = await punkte(page, "uk-mount");
      if (!p.A || !p.B || !p.C) { pruefe(false, `Umkehrung: ${wo} — Punkte fehlen`); continue; }
      const gamma = winkelBei(p.C, p.A, p.B);

      const urteilKlasse = await page.evaluate(() => document.getElementById("uk-urteil").className);
      const soll = d === R ? "recht" : d < R ? "innen" : "aussen";
      pruefe(urteilKlasse.split(/\s+/).includes(soll),
        `Umkehrung: ${wo} — Urteil „${urteilKlasse}“, erwartet „${soll}“`);

      // Die Kernaussage der Umkehrung, unabhängig aus der Zeichnung nachgerechnet.
      if (d < R) pruefe(gamma > 90.05, `Umkehrung: ${wo} — C liegt innen, der Winkel ist aber ${de(gamma, 2)}°`);
      else if (d > R) pruefe(gamma < 89.95, `Umkehrung: ${wo} — C liegt außen, der Winkel ist aber ${de(gamma, 2)}°`);
      else pruefe(Math.abs(gamma - 90) < 0.15, `Umkehrung: ${wo} — C liegt auf dem Kreis, der Winkel ist aber ${de(gamma, 2)}°`);

      // Das rechte-Winkel-Kästchen darf NUR im Gleichheitsfall stehen.
      const kaestchen = await page.evaluate(() => document.querySelectorAll("#uk-mount svg polyline").length);
      pruefe(kaestchen === (d === R ? 1 : 0),
        `Umkehrung: ${wo} — ${kaestchen} rechte-Winkel-Marken, erwartet ${d === R ? 1 : 0}`);

      const bilanz = await text(page, "#uk-bilanz");
      if (d === R) {
        pruefe(bilanz.includes("MC = r") && bilanz.includes("γ = 90°"),
          `Umkehrung: ${wo} — die Bilanz nennt den Gleichheitsfall nicht — „${bilanz}“`);
      } else {
        // Der Wert in der Bilanz muss der gezeichnete sein, und „=“ darf nur stehen, wenn die
        // Anzeige den Wert wirklich trifft.
        const m = bilanz.match(/γ ([=≈]) ([\d,]+)°/);
        pruefe(!!m, `Umkehrung: ${wo} — kein Winkelwert in der Bilanz — „${bilanz}“`);
        if (m) {
          const gezeigt = Number(m[2].replace(",", "."));
          pruefe(Math.abs(gezeigt - gamma) < 0.15,
            `Umkehrung: ${wo} — Bilanz zeigt ${m[2]}°, gezeichnet sind ${de(gamma, 2)}°`);
          const exakt = Math.abs(gamma - Math.round(gamma * 10) / 10) < 1e-9;
          pruefe((m[1] === "=") === exakt,
            `Umkehrung: ${wo} — „${m[1]}“ passt nicht zum Wert ${de(gamma, 6)}°`);
        }
      }
    }
  }
}

// ── Abschnitt 4: die Konstruktion ─────────────────────────────────────────

// Rechnet einen Punkt der Zeichenfläche in Bildschirmkoordinaten um und klickt dort.
//
// page.mouse.click rollt die Seite NICHT von sich aus — anders als locator.click(). Liegt die
// Zeichenfläche teilweise über dem Sichtfenster, landet der Klick bei negativen Bildschirm-
// koordinaten und verpufft. Deshalb wird vor jedem Klick gescrollt und der Rahmen danach neu
// gelesen.
async function klickeAuf(page, p) {
  const rahmen = await page.evaluate(() => {
    const svg = document.getElementById("geo-svg");
    svg.scrollIntoView({ block: "center" });
    const r = svg.getBoundingClientRect();
    const vb = svg.viewBox.baseVal;
    return { left: r.left, top: r.top, breite: r.width, hoehe: r.height, vbB: vb.width, vbH: vb.height };
  });
  await page.mouse.click(
    rahmen.left + (p.x / rahmen.vbB) * rahmen.breite,
    rahmen.top + (p.y / rahmen.vbH) * rahmen.hoehe,
  );
}

async function konstruktion(page) {
  // --- Die geführte Phase: Was jede Stufe zeigen muss.
  for (const stufe of [1, 2, 3]) {
    await page.locator(`#count-tabs .geo-mode-tab[data-count="${stufe}"]`).click();
    const bild = await page.evaluate(() => {
      const svg = document.getElementById("geo-svg");
      const punkteMit = (name) => {
        const t = [...svg.querySelectorAll("#layer-centers text")].find((e) => e.textContent === name);
        return t ? { x: +t.getAttribute("x"), y: +t.getAttribute("y") } : null;
      };
      const kreis = svg.querySelector("#layer-construct circle.geo-umkreis");
      const griffe = [...svg.querySelectorAll("#layer-vertices .geo-point-draggable")].map((g) => {
        const dot = g.querySelector(".geo-point-dot");
        const label = g.querySelector("text");
        return { name: label ? label.textContent : "", x: +dot.getAttribute("cx"), y: +dot.getAttribute("cy") };
      });
      return {
        mittelsenkrechte: svg.querySelectorAll("#layer-construct line.geo-mittelsenkrechte").length,
        kreis: kreis ? { x: +kreis.getAttribute("cx"), y: +kreis.getAttribute("cy"), r: +kreis.getAttribute("r") } : null,
        rechterWinkel: svg.querySelectorAll("#layer-construct .geo-rightangle").length,
        M: punkteMit("M"),
        C: punkteMit("C"),
        griffe,
      };
    });

    const A = bild.griffe.find((g) => g.name === "A");
    const B = bild.griffe.find((g) => g.name === "B");
    pruefe(!!(A && B), `Konstruktion: Stufe ${stufe} — die Endpunkte A und B fehlen`);
    pruefe(bild.mittelsenkrechte === 1, `Konstruktion: Stufe ${stufe} — ${bild.mittelsenkrechte} Mittelsenkrechte statt 1`);
    pruefe(!!bild.M, `Konstruktion: Stufe ${stufe} — der Mittelpunkt M ist nicht beschriftet`);

    if (A && B) {
      const mitte = { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 };
      const halb = Math.hypot(B.x - A.x, B.y - A.y) / 2;
      // Der Thaleskreis ist erst ab Stufe 2 da — vorher darf er auch nicht gezeichnet sein.
      pruefe(!!bild.kreis === stufe >= 2, `Konstruktion: Stufe ${stufe} — Thaleskreis ${bild.kreis ? "steht schon" : "fehlt"}`);
      if (bild.kreis) {
        pruefe(Math.hypot(bild.kreis.x - mitte.x, bild.kreis.y - mitte.y) < 0.5,
          `Konstruktion: Stufe ${stufe} — der Kreis sitzt nicht auf der Mitte von AB`);
        pruefe(Math.abs(bild.kreis.r - halb) < 0.5,
          `Konstruktion: Stufe ${stufe} — der Radius ist ${bild.kreis.r.toFixed(1)} statt ${halb.toFixed(1)} (halbe Strecke)`);
      }
      // Der Punkt C und der rechte Winkel gehören zu Stufe 3 — und nur dorthin.
      pruefe(!!bild.C === (stufe >= 3), `Konstruktion: Stufe ${stufe} — Punkt C ${bild.C ? "steht schon" : "fehlt"}`);
      pruefe(bild.rechterWinkel === (stufe >= 3 ? 1 : 0),
        `Konstruktion: Stufe ${stufe} — ${bild.rechterWinkel} rechte-Winkel-Marken`);
      if (stufe >= 3 && bild.C) {
        // Die Beschriftung trägt einen Versatz; geprüft wird deshalb großzügiger.
        const rC = Math.hypot(bild.C.x - mitte.x, bild.C.y - mitte.y);
        pruefe(Math.abs(rC - halb) < 16, `Konstruktion: Stufe ${stufe} — C liegt nicht auf dem Thaleskreis (${rC.toFixed(1)} statt ${halb.toFixed(1)})`);
      }
    }
  }

  // --- Die freie Phase: wirklich konstruieren, bis „Prüfen“ es anerkennt.
  await page.locator('#phase-tabs .geo-mode-tab[data-phase="free"]').click();

  const AB = await page.evaluate(() => {
    const griffe = [...document.querySelectorAll("#layer-vertices .geo-point-draggable")].map((g) => {
      const dot = g.querySelector(".geo-point-dot");
      return { name: g.querySelector("text").textContent, x: +dot.getAttribute("cx"), y: +dot.getAttribute("cy") };
    });
    return { A: griffe.find((g) => g.name === "A"), B: griffe.find((g) => g.name === "B") };
  });
  const { A, B } = AB;
  const laenge = Math.hypot(B.x - A.x, B.y - A.y);
  const rHilf = laenge * 0.62; // größer als die halbe Strecke — sonst schneiden sich die Bögen nicht
  const richtung = { x: (B.x - A.x) / laenge, y: (B.y - A.y) / laenge };
  const quer = { x: -richtung.y, y: richtung.x };
  const mitte = { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 };
  const hoehe = Math.sqrt(rHilf * rHilf - (laenge / 2) * (laenge / 2));
  const S1 = { x: mitte.x + quer.x * hoehe, y: mitte.y + quer.y * hoehe };
  const S2 = { x: mitte.x - quer.x * hoehe, y: mitte.y - quer.y * hoehe };

  // Ohne Zeichnung muss die Prüfung die Mittelsenkrechte anmahnen — und nicht etwa den Kreis.
  await page.locator("#btn-check").click();
  let rueck = await text(page, "#feedback-box");
  pruefe(rueck.includes("Mittelsenkrechte"), `Konstruktion: leere Zeichnung, aber die Rückmeldung lautet „${rueck}“`);

  // Zwei gleich große Hilfskreise um A und um B.
  await page.locator("#btn-tool-circle").click();
  await klickeAuf(page, A);
  await klickeAuf(page, { x: A.x + richtung.x * rHilf, y: A.y + richtung.y * rHilf });
  await klickeAuf(page, B);
  await klickeAuf(page, { x: B.x - richtung.x * rHilf, y: B.y - richtung.y * rHilf });

  const kreiseNachher = await page.evaluate(() => document.querySelectorAll("#layer-user circle.geo-user-circle").length);
  pruefe(kreiseNachher === 2, `Konstruktion: nach zwei Zirkelschlägen sind ${kreiseNachher} Kreise gezeichnet`);

  // Erst die Bögen, noch keine Gerade: Die Prüfung darf die Mittelsenkrechte noch nicht anerkennen.
  await page.locator("#btn-check").click();
  rueck = await text(page, "#feedback-box");
  pruefe(rueck.includes("Mittelsenkrechte"), `Konstruktion: nur Bögen gezeichnet, aber die Rückmeldung lautet „${rueck}“`);

  // Die beiden Schnittpunkte verbinden.
  await page.locator("#btn-tool-line").click();
  await klickeAuf(page, S1);
  await klickeAuf(page, S2);

  // Jetzt steht M — und die Prüfung muss den Thaleskreis anmahnen, nicht mehr die Gerade.
  await page.locator("#btn-check").click();
  rueck = await text(page, "#feedback-box");
  pruefe(rueck.includes("Thaleskreis"), `Konstruktion: Mittelsenkrechte steht, aber die Rückmeldung lautet „${rueck}“`);

  // Ein Kreis um M mit falschem Radius muss als falscher Radius erkannt werden.
  await page.locator("#btn-tool-circle").click();
  await klickeAuf(page, mitte);
  await klickeAuf(page, { x: mitte.x + richtung.x * (laenge * 0.3), y: mitte.y + richtung.y * (laenge * 0.3) });
  await page.locator("#btn-check").click();
  rueck = await text(page, "#feedback-box");
  pruefe(rueck.includes("Radius"), `Konstruktion: falscher Radius, aber die Rückmeldung lautet „${rueck}“`);
  await page.locator("#btn-undo").click();

  // Und nun richtig: Zirkel in M, Radius bis A.
  await page.locator("#btn-tool-circle").click();
  await klickeAuf(page, mitte);
  await klickeAuf(page, A);
  await page.locator("#btn-check").click();
  rueck = await text(page, "#feedback-box");
  pruefe(rueck.includes("Richtig konstruiert"), `Konstruktion: die vollständige Konstruktion wird nicht anerkannt — „${rueck}“`);

  // Die fertige Teilkonstruktion muss ihre Hilfskreise grau zurücktreten lassen.
  const grau = await page.evaluate(() => document.querySelectorAll("#layer-user circle.geo-done").length);
  pruefe(grau === 2, `Konstruktion: ${grau} Hilfskreise sind grau, erwartet 2`);

  await page.locator('#phase-tabs .geo-mode-tab[data-phase="guided"]').click();
}

// ── Abschnitt 5: Tangenten ────────────────────────────────────────────────
async function tangenten(page) {
  for (let r = 2; r <= 6; r++) {
    for (let d = 5; d <= 12; d++) {
      await setzeRegler(page, "tg-r", r);
      const stand = await setzeRegler(page, "tg-d", d);
      // P muss außerhalb liegen; der Regler wird bei Bedarf zurückgeschrieben und darf danach
      // nichts anderes anzeigen als das, womit gerechnet wird.
      const dEff = Math.max(d, r + 1);
      pruefe(stand === dEff, `Tangenten: r = ${r}, d = ${d} — der Regler steht auf ${stand}, gerechnet wird mit ${dEff}`);
      const wo = `r = ${r}, d = ${dEff}`;

      // Nur zur Kontrolle der Zeichnung — auf der Seite wird diese Länge nicht ausgerechnet.
      const t = Math.sqrt(q2(dEff) - q2(r));

      const bilanz = await text(page, "#tg-bilanz");
      pruefe(bilanz.includes("90°"), `Tangenten: ${wo} — die Bilanz nennt den rechten Winkel nicht — „${bilanz}“`);
      pruefe(bilanz.includes("Thaleskreis über MP"), `Tangenten: ${wo} — die Bilanz nennt den Thaleskreis nicht — „${bilanz}“`);
      pruefe(bilanz.includes("berührt"), `Tangenten: ${wo} — die Bilanz begründet die Berührung nicht — „${bilanz}“`);
      // In Klasse 8 sind Quadratwurzeln noch nicht bekannt: Die Bilanz darf keine verlangen.
      pruefe(!bilanz.includes("√"), `Tangenten: ${wo} — die Bilanz rechnet mit einer Wurzel — „${bilanz}“`);

      // Die Zeichnung: Liegen die Berührpunkte wirklich auf beiden Kreisen, und steht der
      // Radius dort wirklich senkrecht auf der Tangente?
      const p = await punkte(page, "tg-mount");
      pruefe(!!(p.M && p.P && p["T₁"] && p["T₂"]), `Tangenten: ${wo} — nicht alle Punkte beschriftet`);
      if (p.M && p.P && p["T₁"] && p["T₂"]) {
        const px = Math.hypot(p.P.x - p.M.x, p.P.y - p.M.y) / dEff; // Einheiten → Bildpunkte
        for (const name of ["T₁", "T₂"]) {
          const T = p[name];
          const aufKreis = Math.hypot(T.x - p.M.x, T.y - p.M.y) / px;
          pruefe(Math.abs(aufKreis - r) < 0.05, `Tangenten: ${wo} — ${name} liegt ${de(aufKreis, 2)} statt ${r} von M entfernt`);
          const winkel = winkelBei(T, p.M, p.P);
          pruefe(Math.abs(winkel - 90) < 0.2, `Tangenten: ${wo} — bei ${name} misst der Winkel ${de(winkel, 2)}° statt 90°`);
          const laenge = Math.hypot(T.x - p.P.x, T.y - p.P.y) / px;
          pruefe(Math.abs(laenge - t) < 0.05, `Tangenten: ${wo} — die Tangente P${name} misst ${de(laenge, 2)} statt ${de(t, 2)}`);
        }
      }
    }
  }
  // Der Thaleskreis lässt sich abschalten — und dann darf er auch nicht mehr dastehen.
  for (const an of [false, true]) {
    await page.evaluate((v) => {
      const c = document.getElementById("tg-thales");
      c.checked = v;
      c.dispatchEvent(new Event("input", { bubbles: true }));
    }, an);
    const gestrichelt = await page.evaluate(() =>
      [...document.querySelectorAll("#tg-mount svg circle")].filter((c) => c.getAttribute("stroke-dasharray")).length);
    pruefe(gestrichelt === (an ? 1 : 0),
      `Tangenten: Schalter „Thaleskreis“ ${an ? "an" : "aus"} — ${gestrichelt} gestrichelte Kreise`);
  }
}

// ── Abschnitt 5b: die Tangenten selbst konstruieren ───────────────────────
//
// Geprüft wird beides: dass die geführte Anleitung in jeder Stufe genau das zeigt, was sie
// ankündigt — und dass sich die Konstruktion wirklich ausführen lässt, Zirkelschlag für
// Zirkelschlag, bis „Prüfen“ sie anerkennt. Die Sollpunkte rechnet diese Prüfung selbst aus der
// Lage aus; aus der Seite kommen nur M, P und der Radius.

// Die aktuelle Vorgabe, so wie die Zeichenfläche sie zeigt.
async function tkLage(page) {
  return page.evaluate(() => {
    const punktMit = (name) => {
      const g = [...document.querySelectorAll("#tk-layer-vertices .geo-point-draggable")]
        .find((e) => e.querySelector("text") && e.querySelector("text").textContent === name);
      if (!g) return null;
      const dot = g.querySelector(".geo-point-dot");
      return { x: +dot.getAttribute("cx"), y: +dot.getAttribute("cy") };
    };
    const k = document.querySelector("#tk-layer-figure circle.th-gegeben-kreis");
    return { M: punktMit("M"), P: punktMit("P"), r: k ? +k.getAttribute("r") : null };
  });
}

// Was die Zeichenfläche gerade zeigt — nach Bestandteilen getrennt.
async function tkBild(page) {
  return page.evaluate(() => {
    const beschriftet = (name) => {
      const t = [...document.querySelectorAll("#tk-layer-centers text")].find((e) => e.textContent === name);
      return t ? { x: +t.getAttribute("x"), y: +t.getAttribute("y") } : null;
    };
    const linien = (sel) => [...document.querySelectorAll(sel)].map((l) => ({
      a: { x: +l.getAttribute("x1"), y: +l.getAttribute("y1") },
      b: { x: +l.getAttribute("x2"), y: +l.getAttribute("y2") },
    }));
    const thales = document.querySelector("#tk-layer-construct circle.geo-umkreis");
    return {
      mittelsenkrechte: document.querySelectorAll("#tk-layer-construct line.geo-mittelsenkrechte").length,
      hilfsstrecke: document.querySelectorAll("#tk-layer-construct line.th-hilfsstrecke").length,
      thales: thales ? { x: +thales.getAttribute("cx"), y: +thales.getAttribute("cy"), r: +thales.getAttribute("r") } : null,
      tangenten: linien("#tk-layer-construct line.geo-line.th-schenkel"),
      radien: document.querySelectorAll("#tk-layer-construct line.geo-segment.th-schenkel").length,
      rechteWinkel: document.querySelectorAll("#tk-layer-construct .geo-rightangle").length,
      Z: beschriftet("Z"),
      T1: beschriftet("T₁"),
      T2: beschriftet("T₂"),
    };
  });
}

// Abstand des Punktes p von der Geraden durch a und b.
function abstandZurGeraden(p, a, b) {
  const l = Math.hypot(b.x - a.x, b.y - a.y);
  return Math.abs((b.x - a.x) * (a.y - p.y) - (a.x - p.x) * (b.y - a.y)) / l;
}

async function tangentenKonstruktion(page) {
  const werkbank = neueWerkbank(page, {
    svg: "tk-svg",
    kreis: "#tk-circle",
    linie: "#tk-line",
    pruefen: "#tk-check",
    rueckmeldung: "#tk-feedback",
  });

  // --- Die geführte Phase: Was jede Stufe zeigen muss.
  for (const stufe of [1, 2, 3]) {
    await page.locator(`#tk-count-tabs .geo-mode-tab[data-count="${stufe}"]`).click();
    const lage = await tkLage(page);
    const bild = await tkBild(page);
    const wo = `Tangentenkonstruktion: Stufe ${stufe}`;
    pruefe(!!(lage.M && lage.P && lage.r), `${wo} — M, P oder der Kreis k fehlen`);
    if (!(lage.M && lage.P && lage.r)) return;

    const d = Math.hypot(lage.P.x - lage.M.x, lage.P.y - lage.M.y);
    const Z = { x: (lage.M.x + lage.P.x) / 2, y: (lage.M.y + lage.P.y) / 2 };
    pruefe(d > lage.r + 1, `${wo} — P liegt nicht außerhalb des Kreises (d = ${de(d, 1)}, r = ${de(lage.r, 1)})`);
    pruefe(bild.mittelsenkrechte === 1, `${wo} — ${bild.mittelsenkrechte} Mittelsenkrechte statt 1`);
    pruefe(bild.hilfsstrecke === 1, `${wo} — ${bild.hilfsstrecke} Hilfsstrecken MP statt 1`);
    pruefe(!!bild.Z, `${wo} — die Mitte Z ist nicht beschriftet`);

    // Der Thaleskreis gehört ab Stufe 2 dazu — vorher darf er nicht dastehen.
    pruefe(!!bild.thales === stufe >= 2, `${wo} — Thaleskreis ${bild.thales ? "steht schon" : "fehlt"}`);
    if (bild.thales) {
      pruefe(Math.hypot(bild.thales.x - Z.x, bild.thales.y - Z.y) < 0.5, `${wo} — der Thaleskreis sitzt nicht auf der Mitte von MP`);
      pruefe(Math.abs(bild.thales.r - d / 2) < 0.5, `${wo} — sein Radius ist ${de(bild.thales.r, 1)} statt ${de(d / 2, 1)}`);
    }
    pruefe(!!bild.T1 === (stufe >= 2) && !!bild.T2 === (stufe >= 2), `${wo} — die Berührpunkte sind ${bild.T1 ? "schon" : "nicht"} beschriftet`);

    // Die Tangenten und die Radien gehören zu Stufe 3 — und nur dorthin.
    pruefe(bild.tangenten.length === (stufe >= 3 ? 2 : 0), `${wo} — ${bild.tangenten.length} Tangenten gezeichnet`);
    pruefe(bild.radien === (stufe >= 3 ? 2 : 0), `${wo} — ${bild.radien} Radien gezeichnet`);
    pruefe(bild.rechteWinkel === (stufe >= 3 ? 2 : 0), `${wo} — ${bild.rechteWinkel} rechte-Winkel-Marken`);

    // Der fachliche Kern: Was da gezeichnet ist, muss den Kreis wirklich BERÜHREN — also durch P
    // laufen und von M genau den Abstand r haben. Eine Gerade, die ihn schneidet, wäre keine
    // Tangente, sähe aber fast genauso aus.
    for (const [i, t] of bild.tangenten.entries()) {
      pruefe(abstandZurGeraden(lage.P, t.a, t.b) < 0.5, `${wo} — Tangente ${i + 1} läuft nicht durch P`);
      const abstand = abstandZurGeraden(lage.M, t.a, t.b);
      pruefe(Math.abs(abstand - lage.r) < 0.5,
        `${wo} — Tangente ${i + 1} hat von M den Abstand ${de(abstand, 2)} statt r = ${de(lage.r, 2)} (sie berührt den Kreis also nicht)`);
    }
  }

  // --- Die gewürfelte Lage: Sie muss IMMER zulässig sein, nicht nur meistens. Geprüft wird an
  // vierzig Würfen, ob P wirklich außerhalb des Kreises liegt und ob beide Kreise ganz auf die
  // Fläche passen — ein Thaleskreis, der über den Rand hinausragt, versteckt einen Berührpunkt.
  for (let wurf = 0; wurf < 40; wurf++) {
    await page.locator("#tk-new").click();
    const lage = await tkLage(page);
    const bild = await tkBild(page);
    const d = Math.hypot(lage.P.x - lage.M.x, lage.P.y - lage.M.y);
    const wo = `Tangentenkonstruktion: Wurf ${wurf + 1}`;
    pruefe(d > lage.r + 1, `${wo} — P liegt innerhalb von k (d = ${de(d, 1)}, r = ${de(lage.r, 1)})`);
    const drin = (x, y, rad) => x - rad >= -0.5 && x + rad <= 600.5 && y - rad >= -0.5 && y + rad <= 420.5;
    pruefe(drin(lage.M.x, lage.M.y, lage.r), `${wo} — der Kreis k ragt über den Rand hinaus`);
    pruefe(!!bild.thales && drin(bild.thales.x, bild.thales.y, bild.thales.r),
      `${wo} — der Thaleskreis ragt über den Rand hinaus`);
    pruefe(bild.tangenten.length === 2 && bild.rechteWinkel === 2,
      `${wo} — die Figur zeigt ${bild.tangenten.length} Tangenten und ${bild.rechteWinkel} rechte Winkel`);
  }

  // --- Ziehen: Die Vorgabe darf nie in eine Lage geraten, in der es keine Tangenten gibt.
  const vorZiehen = await tkLage(page);
  const griff = await page.evaluate(() => {
    const g = [...document.querySelectorAll("#tk-layer-vertices .geo-point-draggable")]
      .find((e) => e.querySelector("text").textContent === "P");
    const dot = g.querySelector(".geo-point-dot");
    return { x: +dot.getAttribute("cx"), y: +dot.getAttribute("cy") };
  });
  // Einmal mitten auf den Kreismittelpunkt ziehen — dorthin darf P nicht folgen.
  await werkbank.klick(griff); // nur zum Scrollen an die richtige Stelle
  await page.mouse.move(0, 0);
  const rahmen = await page.evaluate(() => {
    const svg = document.getElementById("tk-svg");
    const r = svg.getBoundingClientRect();
    const vb = svg.viewBox.baseVal;
    return { left: r.left, top: r.top, breite: r.width, hoehe: r.height, vbB: vb.width, vbH: vb.height };
  });
  const aufSchirm = (p) => ({
    x: rahmen.left + (p.x / rahmen.vbB) * rahmen.breite,
    y: rahmen.top + (p.y / rahmen.vbH) * rahmen.hoehe,
  });
  const von = aufSchirm(griff), nach = aufSchirm(vorZiehen.M);
  await page.mouse.move(von.x, von.y);
  await page.mouse.down();
  await page.mouse.move(nach.x, nach.y, { steps: 8 });
  await page.mouse.up();
  const nachZiehen = await tkLage(page);
  const dNach = Math.hypot(nachZiehen.P.x - nachZiehen.M.x, nachZiehen.P.y - nachZiehen.M.y);
  pruefe(dNach > nachZiehen.r + 1,
    `Tangentenkonstruktion: nach dem Ziehen auf M liegt P mit dem Abstand ${de(dNach, 1)} bei r = ${de(nachZiehen.r, 1)} — es gäbe keine Berührpunkte mehr`);
  const bildNach = await tkBild(page);
  pruefe(bildNach.tangenten.length === 2, `Tangentenkonstruktion: nach dem Ziehen sind ${bildNach.tangenten.length} Tangenten gezeichnet`);
  for (const t of bildNach.tangenten) {
    const abstand = abstandZurGeraden(nachZiehen.M, t.a, t.b);
    pruefe(Math.abs(abstand - nachZiehen.r) < 0.5, `Tangentenkonstruktion: nach dem Ziehen berührt eine Tangente den Kreis nicht (${de(abstand, 2)} statt ${de(nachZiehen.r, 2)})`);
  }

  // --- Die freie Phase: wirklich konstruieren, bis „Prüfen“ es anerkennt.
  await page.locator('#tk-phase-tabs .geo-mode-tab[data-phase="free"]').click();
  const lage = await tkLage(page);
  const { M, P, r } = lage;
  const d = Math.hypot(P.x - M.x, P.y - M.y);
  const Z = { x: (M.x + P.x) / 2, y: (M.y + P.y) / 2 };
  const richtung = { x: (P.x - M.x) / d, y: (P.y - M.y) / d };
  const T = kreisSchnitt(M, r, Z, d / 2);

  let rueck = await werkbank.pruefen();
  pruefe(rueck.includes("Mittelsenkrechte"), `Tangentenkonstruktion: leere Zeichnung, aber die Rückmeldung lautet „${rueck}“`);

  const weite = d * 0.62;
  await werkbank.zirkel(M, { x: M.x + richtung.x * weite, y: M.y + richtung.y * weite });
  await werkbank.zirkel(P, { x: P.x - richtung.x * weite, y: P.y - richtung.y * weite });
  rueck = await werkbank.pruefen();
  pruefe(rueck.includes("Mittelsenkrechte"), `Tangentenkonstruktion: nur Bögen gezeichnet, aber die Rückmeldung lautet „${rueck}“`);

  const s = kreisSchnitt(M, weite, P, weite);
  await werkbank.lineal(s[0], s[1]);
  rueck = await werkbank.pruefen();
  pruefe(rueck.includes("Thaleskreis"), `Tangentenkonstruktion: Mittelsenkrechte steht, aber die Rückmeldung lautet „${rueck}“`);

  // Ein Kreis um Z mit falschem Radius muss als falscher Radius erkannt werden.
  await werkbank.zirkel(Z, { x: Z.x + richtung.x * (d * 0.3), y: Z.y + richtung.y * (d * 0.3) });
  rueck = await werkbank.pruefen();
  pruefe(rueck.includes("Radius"), `Tangentenkonstruktion: falscher Radius, aber die Rückmeldung lautet „${rueck}“`);
  await page.locator("#tk-undo").click();

  // Und nun richtig: Thaleskreis um Z durch M.
  await werkbank.zirkel(Z, M);
  rueck = await werkbank.pruefen();
  pruefe(rueck.includes("Berührpunkte"), `Tangentenkonstruktion: Thaleskreis steht, aber die Rückmeldung lautet „${rueck}“`);

  await werkbank.lineal(P, T[0]);
  rueck = await werkbank.pruefen();
  pruefe(rueck.includes("Eine Tangente steht schon"), `Tangentenkonstruktion: eine Tangente gezeichnet, aber die Rückmeldung lautet „${rueck}“`);

  await werkbank.lineal(P, T[1]);
  rueck = await werkbank.pruefen();
  pruefe(rueck.includes("Richtig konstruiert"), `Tangentenkonstruktion: die vollständige Konstruktion wird nicht anerkannt — „${rueck}“`);
  pruefe(await werkbank.istGruen(), "Tangentenkonstruktion: die Rückmeldung ist nicht als richtig gekennzeichnet");

  // Die fertige Mittelsenkrechte muss ihre Hilfskreise grau zurücktreten lassen.
  const grau = await page.evaluate(() => document.querySelectorAll("#tk-layer-user circle.geo-done").length);
  pruefe(grau === 2, `Tangentenkonstruktion: ${grau} Hilfskreise sind grau, erwartet 2`);

  await page.locator('#tk-phase-tabs .geo-mode-tab[data-phase="guided"]').click();
}

// ── Die Quizze ────────────────────────────────────────────────────────────
async function quizze(page) {
  const ids = ["quiz-satz", "quiz-beweis", "quiz-umkehrung", "quiz-tangenten"];
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
      if (r.ok) richtige++;
      pruefe(r.text.length > 40, `Quiz ${id}, Antwort ${i + 1}: die Erklärung ist nur ${r.text.length} Zeichen lang`);
    }
    pruefe(richtige === 1, `Quiz ${id}: ${richtige} Antworten gelten als richtig, erwartet genau eine`);
  }
}

// ── Die Übungsaufgaben ────────────────────────────────────────────────────
async function aufgaben(page) {
  // Aufgabe 1 — der zweite spitze Winkel. 70 Winkel (45° fällt heraus, dort wäre β = α);
  // bei 30 Zügen ist E = 24,5 und σ = 1,8, die Schranke E − 3σ liegt bei 19.
  await pruefeAufgabe(page, bericht, {
    nr: 1, name: "A1 zweiter spitzer Winkel", runden: 30, mindestensVerschieden: 19,
    deute: (frage) => {
      const m = frage.match(/α = (\d+)°/);
      if (!m) return null;
      const alpha = Number(m[1]);
      return {
        richtig: 90 - alpha,
        toleranz: 0.005,
        falsch: [
          [alpha, "gegebene"],
          // Von 180° statt von 90° abgezogen — der rechte Winkel wurde vergessen.
          [180 - alpha, "von 180° abgezogen"],
          [90, "Winkel bei"],
        ],
        pruefe: (f, rueck) => {
          pruefe(alpha !== 45, `A1: bei α = 45° wäre β = α, der Hinweis wäre nicht unterscheidbar — „${f}“`);
          pruefe(alpha > 0 && alpha < 90, `A1: α = ${alpha}° ist kein spitzer Winkel — „${f}“`);
          // Der Thales-Schritt muss in der Musterlösung stehen, nicht nur die Winkelsumme.
          pruefe(rueck.includes("Thales") && rueck.includes("γ = 90°"),
            `A1: die Musterlösung begründet den rechten Winkel nicht — „${f}“`);
          pruefe(!/Kathete|Hypotenuse/i.test(f + rueck), `A1: „Kathete“ oder „Hypotenuse“ kommt erst in Klasse 9 — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 2 — Umkreisradius und längste Seite, in beiden Richtungen. 18 Längen × 2 Richtungen
  // = 36 Fassungen, gefiltert. Gemessen mit tests/werkzeug-streuung.js: das simulierte
  // 10⁻⁴-Quantil bei 30 Zügen liegt bei 15.
  await pruefeAufgabe(page, bericht, {
    nr: 2, name: "A2 Umkreisradius", runden: 30, mindestensVerschieden: 15,
    deute: (frage) => {
      const nachRadius = /AB ist (\d+) cm/.test(frage);
      if (nachRadius) {
        const c = Number(frage.match(/AB ist (\d+) cm/)[1]);
        return {
          richtig: c / 2,
          toleranz: 0.005,
          falsch: [[c, "ganze"], [c * 2, "verdoppelt statt halbiert"]],
          pruefe: (f, rueck) => {
            pruefe(c % 2 === 0, `A2: AB = ${c} cm halbiert sich nicht glatt — „${f}“`);
            pruefe(rueck.includes("Mitte von AB"),
              `A2: die Musterlösung nennt den Umkreismittelpunkt nicht — „${f}“`);
            // Keine Aufgabe dieser Seite darf eine Wurzel verlangen — Klasse 9.
            pruefe(!/√|Wurzel/.test(f + rueck), `A2: in Aufgabe oder Lösung steht eine Wurzel — „${f}“`);
          },
        };
      }
      const m = frage.match(/Radius ([\d,]+) cm/);
      if (!m) return null;
      const r = Number(m[1].replace(",", "."));
      return {
        richtig: 2 * r,
        toleranz: 0.005,
        falsch: [[r, "gegebene"], [r / 2, "halbiert statt verdoppelt"]],
        pruefe: (f, rueck) => {
          pruefe(rueck.includes("Durchmesser"), `A2: die Musterlösung nennt AB nicht als Durchmesser — „${f}“`);
          pruefe(!/√|Wurzel/.test(f + rueck), `A2: in Aufgabe oder Lösung steht eine Wurzel — „${f}“`);
          pruefe(!/Kathete|Hypotenuse/i.test(f + rueck), `A2: „Kathete“ oder „Hypotenuse“ kommt erst in Klasse 9 — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 3 — die Winkel am Mittelpunkt, die Beweisfigur. 12 Winkel × 2 Ziele = 24
  // Fassungen, gefiltert. Gemessen: das simulierte 10⁻⁴-Quantil bei 30 Zügen liegt bei 11.
  await pruefeAufgabe(page, bericht, {
    nr: 3, name: "A3 Winkel am Mittelpunkt", runden: 30, mindestensVerschieden: 11,
    deute: (frage) => {
      const m = frage.match(/α = (\d+)°/);
      const z = frage.match(/Wie groß ist der Winkel ∡(AMC|CMB)/);
      if (!m || !z) return null;
      const alpha = Number(m[1]);
      const amc = 180 - 2 * alpha, cmb = 2 * alpha;
      const nachAMC = z[1] === "AMC";
      return {
        richtig: nachAMC ? amc : cmb,
        toleranz: 0.005,
        falsch: [
          [nachAMC ? cmb : amc, "andere"],
          [alpha, "gegebene Winkel bei A"],
          [90 - alpha, "Winkel bei B"],
          [90, "Winkel bei C"],
        ],
        pruefe: (f, rueck) => {
          pruefe(alpha !== 45, `A3: bei α = 45° fielen ∡AMC und ∡CMB zusammen — „${f}“`);
          pruefe(amc + cmb === 180, `A3: ∡AMC und ∡CMB ergänzen sich nicht zu 180° — „${f}“`);
          // Der Basiswinkelsatz ist der Kern; ohne ihn ist die Lösung nur eine Formel.
          pruefe(rueck.includes("gleichschenklig"), `A3: die Musterlösung begründet nicht über das gleichschenklige Dreieck — „${f}“`);
          pruefe(rueck.includes("Nebenwinkel"), `A3: die Musterlösung erklärt den zweiten Winkel bei M nicht — „${f}“`);
          pruefe(!/√|Wurzel/.test(f + rueck), `A3: in Aufgabe oder Lösung steht eine Wurzel — „${f}“`);
          pruefe(!/Kathete|Hypotenuse/i.test(f + rueck), `A3: „Kathete“ oder „Hypotenuse“ kommt erst in Klasse 9 — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 4 — die Höhe auf AB über den Flächeninhalt. Alle drei Seiten stehen in
  // der Angabe, gerechnet wird nur mit der Fläche. Glatt geht die Höhe nur bei den Vielfachen
  // von (3, 4, 5) und (7, 24, 25) auf; es bleiben 26 Fassungen, und das simulierte
  // 10⁻⁴-Quantil bei 30 Zügen liegt bei 11.
  await pruefeAufgabe(page, bericht, {
    nr: 4, name: "A4 Höhe über die Fläche", runden: 30, mindestensVerschieden: 11,
    deute: (frage) => {
      const m = frage.match(/AB = (\d+) cm.*?AC = (\d+) cm.*?BC = (\d+) cm/);
      if (!m) return null;
      const c = Number(m[1]), b = Number(m[2]), a = Number(m[3]);
      const flaeche = (a * b) / 2;
      return {
        richtig: (a * b) / c,
        toleranz: 0.005,
        falsch: [
          [flaeche, "Flächeninhalt"],
          [a * b, "Halbierung vergessen"],
          [c / 2, "Radius"],
          [(a + b) / 2, "Mittelwert"],
        ],
        pruefe: (f, rueck) => {
          // Die Angabe muss vollständig sein: Ohne die dritte Seite bräuchte man Pythagoras.
          pruefe(q2(a) + q2(b) === q2(c), `A4: ${a}, ${b}, ${c} bilden kein rechtwinkliges Dreieck — „${f}“`);
          pruefe(Number.isInteger(((a * b) / c) * 100), `A4: die Höhe ${(a * b) / c} ist nicht glatt — „${f}“`);
          // Die Höhe kann nie über den Radius hinausreichen.
          pruefe((a * b) / c <= c / 2 + 1e-9, `A4: die Höhe ${(a * b) / c} übertrifft den Radius ${c / 2} — „${f}“`);
          pruefe(rueck.includes("senkrecht aufeinander"),
            `A4: die Musterlösung sagt nicht, warum AC und BC Grundseite und Höhe sind — „${f}“`);
          pruefe(!/√|Wurzel/.test(f + rueck), `A4: in Aufgabe oder Lösung steht eine Wurzel — „${f}“`);
          pruefe(!/Kathete|Hypotenuse/i.test(f + rueck), `A4: „Kathete“ oder „Hypotenuse“ kommt erst in Klasse 9 — „${f}“`);
        },
      };
    },
  });
}

// ── Seitengerüst ──────────────────────────────────────────────────────────
async function geruest(page) {
  // Jeder Abschnitt der Seite ist über eine Sprungmarke erreichbar, und die Formelsammlung
  // liegt wirklich vor.
  const anker = ["sec-satz", "sec-beweis", "sec-umkehrung", "sec-konstruktion", "sec-tangenten", "sec-vernetzung", "sec-formelsammlung", "sec-uebungen"];
  for (const a of anker) {
    const da = await page.evaluate((id) => !!document.getElementById(id), a);
    pruefe(da, `Gerüst: der Abschnitt #${a} fehlt`);
  }
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
    return html.includes('href="satz-des-thales.html"');
  });
  pruefe(inMenue, "Gerüst: die Übersichtsseite verweist nicht auf den Satz des Thales");
}

(async () => {
  const browser = await starteBrowser();
  for (const dunkel of [false, true]) {
    const wo = dunkel ? "dunkel" : "hell";
    const page = await neueSeite(browser, { dunkel });
    await oeffne(page, SEITE);
    if (!dunkel) {
      await geruest(page);
      await halbkreis(page);
      await beweis(page);
      await umkehrung(page);
      await konstruktion(page);
      await tangenten(page);
      await tangentenKonstruktion(page);
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
