// Prüft das Vollbild („Zeichenfläche vergrößern“) auf allen Geometrie-Seiten.
//
// Drei Dinge, die vorher nachweislich schiefgingen und darum hier festgehalten werden:
//
// 1. Der Knopf zum Beenden muss im Vollbild sichtbar UND anklickbar bleiben. Vorher stand er im
//    Fluss unter der Zeichenfläche; auf einem hohen Gerät schob ihn der Inhalt aus dem Bild, und
//    weil die Vollbildkarte overflow: hidden hat, war er nicht mehr erreichbar — das Vollbild
//    ließ sich auf dem iPad nicht mehr verlassen.
//
// 2. Die Zeichenfläche muss dabei wirklich größer werden. Gemessen wird die NUTZBARE Fläche,
//    also der Teil des <svg>, den die viewBox ausfüllt — nicht das Rechteck des Elements.
//
// 3. Ein Klick muss im Vollbild dort ankommen, wo er hinzeigt. Passt die viewBox nicht zum
//    Seitenverhältnis der Fläche, legt preserveAspectRatio leere Streifen an den Rand;
//    toSvgPoint() rechnet aber linear über das ganze Rechteck. Auf dem Handy lag ein Klick
//    dadurch um 120 von 420 Modelleinheiten daneben — Konstruieren im Vollbild war unmöglich.
//    Geprüft wird beides: rechnerisch (Seitenverhältnis) und mit einem echten Zirkelschlag.

"use strict";

const { neuerBericht } = require("../lib/pruefen.js");
const { starteBrowser, neueSeite, oeffne } = require("../lib/seite.js");

const BASIS = "/mathematik/klasse-8/geometrie/";

const SEITEN = [
  ["grundkonstruktionen.html", "#btn-zoom", "#geo-svg"],
  ["mittelsenkrechte-umkreis.html", "#btn-zoom", "#geo-svg"],
  ["winkelhalbierende-inkreis.html", "#btn-zoom", "#geo-svg"],
  ["alle-linien.html", "#btn-zoom", "#geo-svg"],
  ["raetsel.html", "#btn-zoom", "#geo-svg"],
  ["satz-des-thales.html", "#btn-zoom", "#geo-svg"],
  ["satz-des-thales.html", "#ka-zoom", "#ka-svg"],
];

// Hoch- und Querformat eines iPads sowie ein schmales Handy: Das Vollbild rechnet mit der Fläche,
// die es vorfindet, und genau daran scheiterte es vorher unterschiedlich.
const GERAETE = [
  ["iPad hoch", 810, 1080],
  ["iPad quer", 1080, 810],
  ["Handy hoch", 390, 844],
];

// Der kleinste Zugewinn, den eine Seite in der Messung noch zeigte (Satz des Thales im Querformat:
// dort ist die Zeichenfläche schon im normalen Fluss breit). Alles darunter wäre ein Rückschritt.
const MIN_FAKTOR = 1.15;

// Auf diese Entfernung rastet das freie Konstruieren auf einen Punkt ein (TOL_PT in
// tri-construct.js). Ein Klick, der weiter danebenliegt, erzeugt einen Kreis irgendwo im Nichts.
const SNAP = 16;

// Die nutzbare Zeichenfläche in Bildpunkten: Breite und Höhe des Bereichs, den die viewBox
// tatsächlich einnimmt (preserveAspectRatio="xMidYMid meet").
const MESSEN = ([knopfSel, svgSel]) => {
  const k = document.querySelector(knopfSel);
  const s = document.querySelector(svgSel);
  if (!k || !s) return null;
  const rk = k.getBoundingClientRect();
  const rs = s.getBoundingClientRect();
  const vb = s.viewBox.baseVal;
  const m = Math.min(rs.width / vb.width, rs.height / vb.height);
  const oben = document.elementFromPoint(rk.left + rk.width / 2, rk.top + rk.height / 2);
  return {
    flaeche: vb.width * m * (vb.height * m),
    svg: { b: rs.width, h: rs.height },
    viewBox: [vb.x, vb.y, vb.width, vb.height],
    knopf: {
      text: k.textContent.trim(),
      imBild: rk.width > 0 && rk.top >= 0 && rk.left >= 0 && rk.bottom <= innerHeight && rk.right <= innerWidth,
      obenauf: !!oben && (oben === k || k.contains(oben)),
    },
    anleitungKnopf: (() => {
      const a = k.parentElement.querySelector(".geo-anleitung-btn");
      return a ? { sichtbar: a.getBoundingClientRect().width > 0, text: a.textContent.trim() } : null;
    })(),
    seiteCol: (() => {
      const karte = k.closest(".card");
      const sc = karte && karte.querySelector(".geo-side-col");
      return sc ? sc.getBoundingClientRect().height > 0 : null;
    })(),
    ueberschriftSichtbar: (() => {
      const karte = k.closest(".card");
      const h = karte && karte.querySelector("h2, h3");
      return h ? h.getBoundingClientRect().height > 0 : null;
    })(),
  };
};

// Rechnet einen Modellpunkt in Bildschirmkoordinaten um — unabhängig davon, ob die viewBox zum
// Seitenverhältnis passt, also auch dann richtig, wenn die Seite es falsch macht.
async function bildschirmPunkt(page, svgSel, p) {
  return page.evaluate(([sel, pt]) => {
    const s = document.querySelector(sel);
    const r = s.getBoundingClientRect();
    const vb = s.viewBox.baseVal;
    const m = Math.min(r.width / vb.width, r.height / vb.height);
    return {
      x: r.left + (r.width - vb.width * m) / 2 + (pt.x - vb.x) * m,
      y: r.top + (r.height - vb.height * m) / 2 + (pt.y - vb.y) * m,
    };
  }, [svgSel, p]);
}

// Was die Seite selbst an dieser Bildschirmstelle als Modellpunkt sieht (toSvgPoint, geo-svg.js).
async function gesehenerPunkt(page, svgSel, client) {
  return page.evaluate(([sel, c]) => {
    const s = document.querySelector(sel);
    const r = s.getBoundingClientRect();
    const vb = s.viewBox.baseVal;
    return {
      x: vb.x + ((c.x - r.left) / r.width) * vb.width,
      y: vb.y + ((c.y - r.top) / r.height) * vb.height,
    };
  }, [svgSel, client]);
}

// ---------- Prüfung einer Seite auf einem Gerät ----------

async function pruefeSeite(browser, pruefe, datei, knopf, svgSel, geraet, breite, hoehe) {
  const page = await neueSeite(browser, { breite, hoehe });
  const wo = `${datei} ${knopf} (${geraet})`;
  await oeffne(page, BASIS + datei);
  await page.waitForTimeout(150);

  // Der Anleitungs-Knopf gehört ins Vollbild und darf außerhalb nicht dastehen: Dort bewirkt er
  // nichts, weil die Anleitung ohnehin sichtbar ist.
  const vorAnleitung = await page.evaluate((sel) => {
    const k = document.querySelector(sel);
    const a = k && k.parentElement.querySelector(".geo-anleitung-btn");
    return a ? a.getBoundingClientRect().width > 0 : null;
  }, knopf);
  pruefe(vorAnleitung !== true, `${wo}: Anleitungs-Knopf steht außerhalb des Vollbilds sichtbar herum`);

  const vorher = await page.evaluate(MESSEN, [knopf, svgSel]);
  pruefe(!!vorher, `${wo}: Knopf oder Zeichenfläche nicht gefunden`);
  if (!vorher) { await page.close(); return; }

  await page.locator(knopf).click();
  await page.waitForTimeout(200);
  const nachher = await page.evaluate(MESSEN, [knopf, svgSel]);

  // 1. Der Weg zurück muss sichtbar und anklickbar sein.
  pruefe(nachher.knopf.text.includes("beenden"), `${wo}: Knopf im Vollbild beschriftet mit „${nachher.knopf.text}“`);
  pruefe(nachher.knopf.imBild, `${wo}: Knopf zum Beenden liegt im Vollbild außerhalb des Bildschirms`);
  pruefe(nachher.knopf.obenauf, `${wo}: Knopf zum Beenden ist im Vollbild überdeckt`);

  // 2. Die Zeichenfläche muss spürbar wachsen.
  const faktor = nachher.flaeche / vorher.flaeche;
  pruefe(faktor >= MIN_FAKTOR, `${wo}: Zeichenfläche wächst nur um Faktor ${faktor.toFixed(2)}`);

  // 3. Kein verschenkter Rand: viewBox und Fläche haben dasselbe Seitenverhältnis.
  const vbV = nachher.viewBox[2] / nachher.viewBox[3];
  const svgV = nachher.svg.b / nachher.svg.h;
  pruefe(Math.abs(vbV - svgV) / svgV < 0.01,
    `${wo}: viewBox (${vbV.toFixed(3)}) passt nicht zur Fläche (${svgV.toFixed(3)}) — Klicks landen daneben`);

  // … und derselbe Nachweis punktweise: ein Modellpunkt nahe am oberen Rand, wo der Fehler am
  // größten wäre.
  const soll = { x: nachher.viewBox[0] + nachher.viewBox[2] / 2, y: nachher.viewBox[1] + 20 };
  const client = await bildschirmPunkt(page, svgSel, soll);
  const ist = await gesehenerPunkt(page, svgSel, client);
  const fehler = Math.hypot(ist.x - soll.x, ist.y - soll.y);
  pruefe(fehler < 1, `${wo}: Klick im Vollbild um ${fehler.toFixed(0)} Modelleinheiten versetzt`);

  // 4. Die Anleitung bleibt zunächst stehen — im geführten Modus steht dort der aktuelle Schritt.
  if (vorher.seiteCol !== null) {
    pruefe(nachher.seiteCol === true, `${wo}: Anleitung fehlt beim Start des Vollbilds`);
    pruefe(nachher.anleitungKnopf && nachher.anleitungKnopf.sichtbar,
      `${wo}: Knopf zum Ausblenden der Anleitung fehlt im Vollbild`);

    // Ausblenden gibt der Zeichenfläche mehr Platz — und die viewBox muss mitziehen.
    await page.locator(".geo-fullscreen .geo-anleitung-btn").click();
    await page.waitForTimeout(150);
    const ohne = await page.evaluate(MESSEN, [knopf, svgSel]);
    pruefe(ohne.seiteCol === false, `${wo}: Anleitung lässt sich im Vollbild nicht ausblenden`);
    pruefe(ohne.flaeche > nachher.flaeche, `${wo}: Ausblenden der Anleitung bringt keinen Platz`);
    const vbO = ohne.viewBox[2] / ohne.viewBox[3];
    const svgO = ohne.svg.b / ohne.svg.h;
    pruefe(Math.abs(vbO - svgO) / svgO < 0.01, `${wo}: viewBox zieht nach dem Ausblenden nicht mit`);
    await page.locator(".geo-fullscreen .geo-anleitung-btn").click();
    await page.waitForTimeout(150);
  }

  // 5. Nebensachen treten zurück — und kommen beim Beenden zurück.
  pruefe(nachher.ueberschriftSichtbar !== true, `${wo}: Überschrift bleibt im Vollbild stehen und nimmt Platz`);

  // 6. Escape beendet das Vollbild und stellt den Ausgangszustand her.
  await page.keyboard.press("Escape");
  await page.waitForTimeout(200);
  const zurueck = await page.evaluate(MESSEN, [knopf, svgSel]);
  pruefe(zurueck.knopf.text.includes("vergrößern"), `${wo}: Escape beendet das Vollbild nicht`);
  pruefe(zurueck.viewBox.join(" ") === vorher.viewBox.join(" "),
    `${wo}: viewBox nach dem Beenden ${zurueck.viewBox.join(" ")} statt ${vorher.viewBox.join(" ")}`);
  pruefe(zurueck.ueberschriftSichtbar === vorher.ueberschriftSichtbar,
    `${wo}: Überschrift kommt nach dem Beenden nicht zurück`);
  pruefe(await page.evaluate(() => !document.body.classList.contains("geo-fullscreen-active")),
    `${wo}: Seite bleibt nach dem Beenden gesperrt`);

  pruefe(page.stoerungen.length === 0, `${wo}: Störungen — ${page.stoerungen.join(" | ")}`);
  await page.close();
}

// ---------- Konstruieren im Vollbild, mit echten Klicks ----------

async function pruefeZirkelschlag(browser, pruefe, geraet, breite, hoehe) {
  const page = await neueSeite(browser, { breite, hoehe });
  await oeffne(page, BASIS + "grundkonstruktionen.html");
  await page.waitForTimeout(150);

  // Auf „Selbst konstruieren“ umschalten (der zweite Reiter).
  await page.evaluate(() => {
    const b = [...document.querySelectorAll("#phase-tabs .geo-mode-tab")].find((e) => e.textContent.trim().startsWith("2."));
    if (b) b.click();
  });
  await page.waitForTimeout(150);

  await page.locator("#btn-zoom").click();
  await page.waitForTimeout(200);

  // Die beiden gegebenen Punkte, so wie die Seite sie zeichnet.
  const punkte = await page.evaluate(() =>
    [...document.querySelectorAll("#geo-svg .geo-point-dot")].map((c) => ({ x: +c.getAttribute("cx"), y: +c.getAttribute("cy") })));
  if (punkte.length < 2) { await page.close(); return; }

  await page.locator("#btn-tool-circle").click();
  for (const p of [punkte[0], punkte[1]]) {
    const c = await bildschirmPunkt(page, "#geo-svg", p);
    await page.mouse.click(c.x, c.y);
    await page.waitForTimeout(80);
  }

  // Der gezeichnete Kreis muss um den ersten Punkt liegen und durch den zweiten gehen.
  const kreise = await page.evaluate(() =>
    [...document.querySelectorAll("#geo-svg circle.geo-circle")].map((c) => ({
      x: +c.getAttribute("cx"), y: +c.getAttribute("cy"), r: +c.getAttribute("r"),
    })));
  const soll = Math.hypot(punkte[1].x - punkte[0].x, punkte[1].y - punkte[0].y);
  const treffer = kreise.find((k) => Math.hypot(k.x - punkte[0].x, k.y - punkte[0].y) < SNAP);
  pruefe(kreise.length === 1, `Zirkelschlag im Vollbild (${geraet}): ${kreise.length} Kreise statt einem`);
  pruefe(!!treffer, `Zirkelschlag im Vollbild (${geraet}): kein Kreis um den angeklickten Punkt`
    + (kreise.length ? ` — gezeichnet um ${kreise[0].x.toFixed(0)}|${kreise[0].y.toFixed(0)} statt ${punkte[0].x.toFixed(0)}|${punkte[0].y.toFixed(0)}` : ""));
  if (treffer) {
    pruefe(Math.abs(treffer.r - soll) < SNAP,
      `Zirkelschlag im Vollbild (${geraet}): Radius ${treffer.r.toFixed(0)} statt ${soll.toFixed(0)}`);
  }
  pruefe(page.stoerungen.length === 0, `Zirkelschlag im Vollbild (${geraet}): Störungen — ${page.stoerungen.join(" | ")}`);
  await page.close();
}

(async () => {
  const { pruefe, abschluss } = neuerBericht();
  const browser = await starteBrowser();
  try {
    for (const [geraet, breite, hoehe] of GERAETE) {
      for (const [datei, knopf, svgSel] of SEITEN) {
        await pruefeSeite(browser, pruefe, datei, knopf, svgSel, geraet, breite, hoehe);
      }
      await pruefeZirkelschlag(browser, pruefe, geraet, breite, hoehe);
    }
  } finally {
    await browser.close();
  }
  abschluss();
})();
