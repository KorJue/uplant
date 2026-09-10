// Fachliche Prüfung: Klasse 8, Geometrie, Thema 6 „Satz des Thales“.
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

      const t2 = q2(dEff) - q2(r);
      const t = Math.sqrt(t2);

      const bilanz = await text(page, "#tg-bilanz");
      pruefe(bilanz.includes(`d² − r² = ${de(q2(dEff))} − ${de(q2(r))} = ${de(t2)}`),
        `Tangenten: ${wo} — die Rechnung PT² = d² − r² fehlt — „${bilanz}“`);
      const zeichen = Number.isInteger(t) ? "=" : "≈";
      pruefe(bilanz.includes(`PT = √${de(t2)} ${zeichen} ${de(t, 2)}`),
        `Tangenten: ${wo} — PT steht nicht als „√${de(t2)} ${zeichen} ${de(t, 2)}“ — „${bilanz}“`);

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
        },
      };
    },
  });

  // Aufgabe 2 — die fehlende Kathete. 7 Tripel × 3 Vielfache × 2 Lagen = 42 Fassungen;
  // bei 30 Zügen E = 21,6 und σ = 1,8 — Schranke 16.
  await pruefeAufgabe(page, bericht, {
    nr: 2, name: "A2 fehlende Kathete", runden: 30, mindestensVerschieden: 16,
    deute: (frage) => {
      const m = frage.match(/AB = (\d+) cm.*?AC ist (\d+) cm/);
      if (!m) return null;
      const c = Number(m[1]), b = Number(m[2]);
      const a = Math.sqrt(q2(c) - q2(b));
      return {
        richtig: a,
        toleranz: 0.005,
        falsch: [
          [c - b, "Längen"],
          [q2(c) - q2(b), "Quadratwurzel"],
          [Math.sqrt(q2(c) + q2(b)), "addiert"],
          [c / 2, "Radius"],
        ],
        pruefe: (f, rueck) => {
          pruefe(Number.isInteger(a), `A2: √(${c}² − ${b}²) = ${a} ist nicht ganzzahlig — „${f}“`);
          pruefe(b < c, `A2: die Kathete ${b} ist nicht kürzer als der Durchmesser ${c} — „${f}“`);
          pruefe(rueck.includes("Thales"), `A2: die Musterlösung begründet den rechten Winkel nicht — „${f}“`);
          pruefe(rueck.includes("Hypotenuse"), `A2: die Musterlösung benennt AB nicht als Hypotenuse — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 3 — Tangentenlänge. Ebenfalls 42 Fassungen — Schranke 16.
  await pruefeAufgabe(page, bericht, {
    nr: 3, name: "A3 Tangentenlänge", runden: 30, mindestensVerschieden: 16,
    deute: (frage) => {
      const m = frage.match(/r = (\d+) cm.*?liegt (\d+) cm von M/);
      if (!m) return null;
      const r = Number(m[1]), d = Number(m[2]);
      const t = Math.sqrt(q2(d) - q2(r));
      return {
        richtig: t,
        toleranz: 0.005,
        falsch: [
          [d - r, "Längen"],
          [q2(d) - q2(r), "Quadratwurzel"],
          [Math.sqrt(q2(d) + q2(r)), "addiert"],
          [d / 2, "Thaleskreises"],
        ],
        pruefe: (f, rueck) => {
          pruefe(Number.isInteger(t), `A3: √(${d}² − ${r}²) = ${t} ist nicht ganzzahlig — „${f}“`);
          pruefe(d > r, `A3: P liegt mit ${d} nicht außerhalb des Kreises (r = ${r}) — „${f}“`);
          // Der Grund für den rechten Winkel gehört in die Musterlösung, nicht nur die Rechnung.
          pruefe(rueck.includes("senkrecht auf dem Radius"),
            `A3: die Musterlösung begründet den rechten Winkel bei T nicht — „${f}“`);
          pruefe(rueck.includes("Thaleskreis über MP"),
            `A3: die Musterlösung stellt den Zusammenhang zur Konstruktion nicht her — „${f}“`);
        },
      };
    },
  });

  // Aufgabe 4 — Flächeninhalt aus dem Halbkreis. 42 Fassungen — Schranke 16.
  await pruefeAufgabe(page, bericht, {
    nr: 4, name: "A4 Flächeninhalt", runden: 30, mindestensVerschieden: 16,
    deute: (frage) => {
      const m = frage.match(/AB = (\d+) cm.*?AC misst (\d+) cm/);
      if (!m) return null;
      const c = Number(m[1]), b = Number(m[2]);
      const a = Math.sqrt(q2(c) - q2(b));
      return {
        richtig: (a * b) / 2,
        toleranz: 0.005,
        falsch: [
          // Mit der Hypotenuse als Grundseite und einer Kathete als Höhe gerechnet.
          [(c * b) / 2, "keine Höhe"],
          [a * b, "Halbierung vergessen"],
          [a, "zweite Kathete"],
        ],
        pruefe: (f, rueck) => {
          pruefe(Number.isInteger(a), `A4: die zweite Kathete ${a} ist nicht ganzzahlig — „${f}“`);
          // Die Fläche liegt stets unter der des halben Umkreises — eine grobe Plausibilität.
          pruefe((a * b) / 2 < (Math.PI * q2(c / 2)) / 2,
            `A4: die Dreiecksfläche ${(a * b) / 2} übertrifft den Halbkreis — „${f}“`);
          pruefe(rueck.includes("Thales"), `A4: die Musterlösung begründet den rechten Winkel nicht — „${f}“`);
          // Der eigentliche Denkschritt: Die beiden Katheten sind Grundseite und Höhe zueinander.
          pruefe(rueck.includes("senkrecht aufeinander"),
            `A4: die Musterlösung sagt nicht, warum die Katheten Grundseite und Höhe sind — „${f}“`);
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
