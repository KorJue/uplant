// Eine Zeichenfläche mit Zirkel und Lineal bedienen — mit echten Mausklicks, wie eine Schülerin
// es täte.
//
// Die Seite hat zwei solche Werkbänke (Abschnitt 5 „Tangenten“ und die sechs Übungsaufgaben in
// Abschnitt 8), die anderen Geometrieseiten haben je eine weitere. Sie unterscheiden sich nur in
// den Kennungen ihrer Bedienelemente, nicht in der Bedienung — deshalb steht die hier einmal.
//
// Der wichtigste Punkt steckt in klick(): page.mouse.click rollt die Seite NICHT von selbst zum
// Ziel. Wird der Rahmen nicht vor JEDEM Klick neu gemessen, landen die späteren Klicks um die
// Rollhöhe versetzt — und die Prüfung meldet dann einen Fehler, den es gar nicht gibt.

"use strict";

const abst = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const mitte = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

// Die beiden Schnittpunkte zweier Kreise, der obere zuerst.
function kreisSchnitt(c1, r1, c2, r2) {
  const d = abst(c1, c2);
  const a = (d * d + r1 * r1 - r2 * r2) / (2 * d);
  const h = Math.sqrt(Math.max(0, r1 * r1 - a * a));
  const u = { x: (c2.x - c1.x) / d, y: (c2.y - c1.y) / d };
  const m = { x: c1.x + a * u.x, y: c1.y + a * u.y };
  const s = [
    { x: m.x - h * u.y, y: m.y + h * u.x },
    { x: m.x + h * u.y, y: m.y - h * u.x },
  ];
  return s.sort((p, q) => p.y - q.y);
}

/**
 * Bedienhilfe für eine Zeichenfläche.
 *
 * @param page    die Playwright-Seite
 * @param ids     { svg, kreis, linie, pruefen, rueckmeldung } — die Kennungen der Bedienelemente
 *                (svg ohne #, die übrigen als vollständige Auswahl)
 */
function neueWerkbank(page, ids) {
  async function rahmen() {
    return page.evaluate((svgId) => {
      const svg = document.getElementById(svgId);
      svg.scrollIntoView({ block: "center" });
      const r = svg.getBoundingClientRect();
      const vb = svg.viewBox.baseVal;
      return { left: r.left, top: r.top, breite: r.width, hoehe: r.height, vbX: vb.x, vbY: vb.y, vbB: vb.width, vbH: vb.height };
    }, ids.svg);
  }

  async function klick(p) {
    const r = await rahmen();
    await page.mouse.click(
      r.left + ((p.x - r.vbX) / r.vbB) * r.breite,
      r.top + ((p.y - r.vbY) / r.vbH) * r.hoehe,
    );
  }

  async function werkzeug(name) {
    await page.locator(name === "kreis" ? ids.kreis : ids.linie).click();
  }

  // Ein Zirkelschlag: Einstich, dann ein Punkt auf dem Kreis.
  async function zirkel(zentrum, punktAufKreis) {
    await werkzeug("kreis");
    await klick(zentrum);
    await klick(punktAufKreis);
  }

  async function lineal(p, q) {
    await werkzeug("linie");
    await klick(p);
    await klick(q);
  }

  // Die Mittelsenkrechte von PQ mit vorgegebener Hilfsweite. Zurück kommen ihre beiden
  // Schnittpunkte — dieselben, die die Seite als Klickziele anbietet.
  async function mittelsenkrechte(P, Q, weite, hilfsP, hilfsQ) {
    await zirkel(P, hilfsP);
    await zirkel(Q, hilfsQ);
    const s = kreisSchnitt(P, weite, Q, weite);
    await lineal(s[0], s[1]);
    return s;
  }

  // Das Lot VON einem Punkt C AUF die Gerade durch gA und gB: ein Kreis um C, der die Gerade
  // zweimal schneidet, dann die Mittelsenkrechte dieser beiden Schnittpunkte.
  async function lotVonPunkt(C, gA, gB, rKreis, rPaar) {
    const u = { x: (gB.x - gA.x) / abst(gA, gB), y: (gB.y - gA.y) / abst(gA, gB) };
    const t = (C.x - gA.x) * u.x + (C.y - gA.y) * u.y;
    const F = { x: gA.x + t * u.x, y: gA.y + t * u.y };
    const halb = Math.sqrt(rKreis * rKreis - abst(C, F) ** 2);
    const P1 = { x: F.x - halb * u.x, y: F.y - halb * u.y };
    const P2 = { x: F.x + halb * u.x, y: F.y + halb * u.y };
    await zirkel(C, P2);
    await zirkel(P1, { x: P1.x - u.y * rPaar, y: P1.y + u.x * rPaar });
    await zirkel(P2, { x: P2.x - u.y * rPaar, y: P2.y + u.x * rPaar });
    const s = kreisSchnitt(P1, rPaar, P2, rPaar);
    await lineal(s[0], s[1]);
    return { F, s };
  }

  // Das Lot IN F, wobei F schon auf der Geraden liegt: Kreis um F, dann die Mittelsenkrechte
  // seiner beiden Schnittpunkte mit der Geraden.
  async function lot(F, richtung, rKreis, rPaar) {
    const u = { x: richtung.x, y: richtung.y };
    const P1 = { x: F.x - u.x * rKreis, y: F.y - u.y * rKreis };
    const P2 = { x: F.x + u.x * rKreis, y: F.y + u.y * rKreis };
    await zirkel(F, P2);
    await zirkel(P1, { x: P1.x - u.y * rPaar, y: P1.y + u.x * rPaar });
    await zirkel(P2, { x: P2.x - u.y * rPaar, y: P2.y + u.x * rPaar });
    const s = kreisSchnitt(P1, rPaar, P2, rPaar);
    await lineal(s[0], s[1]);
    return s;
  }

  async function pruefen() {
    await page.locator(ids.pruefen).click();
    return (await page.locator(ids.rueckmeldung).innerText()).replace(/\s+/g, " ").trim();
  }

  async function istGruen() {
    return page.evaluate((sel) => document.querySelector(sel).className.includes("geo-feedback-ok"), ids.rueckmeldung);
  }

  return { klick, werkzeug, zirkel, lineal, mittelsenkrechte, lot, lotVonPunkt, pruefen, istGruen };
}

module.exports = { neueWerkbank, kreisSchnitt, abst, mitte };
