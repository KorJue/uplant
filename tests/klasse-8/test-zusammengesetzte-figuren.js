// Fachliche Prüfung: Klasse 8, Geometrie, Thema 6 „Zusammengesetzte Figuren“.
//
// Die Seite behauptet vier Dinge, und alle vier werden hier nachgerechnet — nicht nur abgelesen:
//
//   1. Die ZEICHNUNGEN stimmen. Bei vielen Reglerstellungen wird jede Figur aus dem SVG zurückgelesen:
//      der Maßstab aus den Maßlinien (jede muss denselben ergeben — eine Linie, an der „6 cm“ steht,
//      ist 6 cm lang), die Teilflächen über die Gaußsche Trapezformel, der Rand als Summe der Sehnen.
//      Verglichen wird mit Formeln, die hier stehen und nicht aus der Seite stammen.
//   2. Die BEWEGUNGEN sind starr. Beim Auseinanderziehen und beim Verschieben von Hand (Maus,
//      Tastatur, auch auf dem verkleinerten Bild des Telefons) wird jedes Teil nur verschoben: Jede
//      Ecke wandert um denselben Vektor, der Flächeninhalt bleibt. Nichts verlässt die Zeichenfläche.
//   3. Die RECHNUNGEN der drei Beispiele stimmen von beiden Seiten: Jeder Schritt erkennt das
//      nachgerechnete Ergebnis an und weist jeden vorgesehenen Fehlerwert mit seinem Hinweis zurück.
//      Und was ein Schritt hervorhebt, ist das, wonach er fragt: Die hervorgehobenen Teile haben
//      zusammen den verlangten Flächeninhalt, die hervorgehobenen Randstücke die verlangte Länge.
//   4. Die AUFGABEN rechnen richtig. Jede der zwölf wird über viele Runden gewürfelt, aus den Maßen
//      an der Zeichnung unabhängig nachgerechnet und mit jedem vorgesehenen Fehlerwert geprüft. Die
//      Zeichnung selbst wird mitgemessen: Ihr Rand muss den Flächeninhalt und den Umfang haben, die
//      sich aus den angeschriebenen Maßen ergeben.
//
// Dazu das Gerüst: Reihenfolge der Abschnitte (erst Flächeninhalt, dann Umfang, dann Abziehen — kein
// Vorgriff), kein Satz des Pythagoras außer als Ausblick, schräge Seiten als „gemessen“
// gekennzeichnet und trotzdem genau, Kontrollfragen, Formelsammlung als PDF, Menükarte.

"use strict";

const { neuerBericht } = require("../lib/pruefen");
const { starteBrowser, neueSeite, oeffne, setzeRegler, text } = require("../lib/seite");
const { pruefeNotation } = require("../lib/notation");
const { pruefeKontrast } = require("../lib/kontrast");
const { pruefeAufgabe, deutsch } = require("../lib/aufgaben");
const fs = require("fs");
const path = require("path");

const bericht = neuerBericht();
const { pruefe } = bericht;
const SEITE = "/mathematik/klasse-8/geometrie/zusammengesetzte-figuren.html";
// Für Gegenproben: UPLANT_NUR=zerlegen,aufgaben lässt nur die genannten Teile laufen (geruest,
// zerlegen, umfang, teile, abziehen, ziehen, quizze, aufgaben, dunkel, telefon). Ohne die Angabe
// läuft alles.
const NUR = (process.env.UPLANT_NUR || "").split(",").map((t) => t.trim()).filter(Boolean);
const will = (teil) => NUR.length === 0 || NUR.includes(teil);
const WURZEL = path.resolve(__dirname, "..", "..");
const P = Math.PI;

const de = (x, stellen = 4) => Number(x.toFixed(stellen)).toLocaleString("de-DE", { maximumFractionDigits: stellen });
// Zwei feste Nachkommastellen, wie die Seite gerundete Kreisgrößen schreibt.
const de2 = (x) => (Math.round(x * 100) / 100).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const rund2 = (x) => Math.round(x * 100) / 100;
const zahl = (s) => Number(String(s).replace(/−/g, "-").replace(/\.(?=\d{3}\b)/g, "").replace(",", "."));

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
// Abstand eines Punkts von einem Linienzug.
function abstandZug(p, punkte) {
  let min = Infinity;
  for (let i = 1; i < punkte.length; i++) {
    const a = punkte[i - 1], b = punkte[i];
    const l2 = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
    const t = l2 ? Math.max(0, Math.min(1, ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2)) : 0;
    min = Math.min(min, Math.hypot(p.x - a.x - t * (b.x - a.x), p.y - a.y - t * (b.y - a.y)));
  }
  return min;
}
const kasten = (punkte) => ({
  minX: Math.min(...punkte.map((p) => p.x)), maxX: Math.max(...punkte.map((p) => p.x)),
  minY: Math.min(...punkte.map((p) => p.y)), maxY: Math.max(...punkte.map((p) => p.y)),
});
// Liegt der Punkt im Vieleck? (Strahl nach rechts, Schnitte zählen.)
function innen(p, vieleck) {
  let drin = false;
  for (let i = 0, j = vieleck.length - 1; i < vieleck.length; j = i++) {
    const a = vieleck[i], b = vieleck[j];
    if ((a.y > p.y) !== (b.y > p.y) && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) drin = !drin;
  }
  return drin;
}

// Alles, was in der Zeichnung eines Beispiels steht.
async function zeichnung(page, kuerzel) {
  return page.evaluate((id) => {
    const svg = document.querySelector(`#${id}-mount svg`);
    const lies = (e) => e.getAttribute("points").trim().split(/\s+/).map((t) => {
      const [x, y] = t.split(",").map(Number);
      return { x, y };
    });
    const rolle = (r) => [...svg.querySelectorAll(`[data-rolle="${r}"]`)];
    const vb = svg.viewBox.baseVal;
    return {
      breite: vb.width, hoehe: vb.height,
      teile: rolle("teil").map((e) => ({ index: Number(e.dataset.index), punkte: lies(e), aktiv: e.classList.contains("zf-aktiv"), klasse: e.getAttribute("class") })),
      rand: rolle("rand").map((e) => ({ nr: Number(e.dataset.nr), stueck: Number(e.dataset.stueck), punkte: lies(e), aktiv: e.classList.contains("zf-rand-aktiv") })),
      schnitte: rolle("schnitt").map((e) => ({ teil: Number(e.dataset.teil), punkte: lies(e), rot: e.classList.contains("zf-schnitt-rot") })),
      spur: rolle("spur").map((e) => lies(e)),
      laeufer: rolle("laeufer").map((e) => ({ x: +e.getAttribute("cx"), y: +e.getAttribute("cy") }))[0] || null,
      start: rolle("start").map((e) => ({ x: +e.getAttribute("cx"), y: +e.getAttribute("cy") }))[0] || null,
      winkel: rolle("winkel").map((e) => lies(e)),
      // Maßlinien und ihre Beschriftungen stehen in derselben Reihenfolge im Bild.
      massLinien: rolle("mass").map((e) => Math.hypot(e.getAttribute("x2") - e.getAttribute("x1"), e.getAttribute("y2") - e.getAttribute("y1"))),
      massTexte: [...svg.querySelectorAll("text.zf-mass-text")].map((t) => t.textContent),
      texte: [...svg.querySelectorAll("text")].map((t) => {
        const b = t.getBBox();
        return { text: t.textContent, klasse: t.getAttribute("class") || "", x0: b.x, x1: b.x + b.width, y0: b.y, y1: b.y + b.height };
      }),
    };
  }, kuerzel);
}

// Der Maßstab in Bildpunkten je Zentimeter — aus JEDER Maßlinie, und alle müssen übereinstimmen.
// Zurück kommen der Maßstab und die abgelesenen Maße nach ihrem Namen („r“, „b“, „s“ …).
function massstab(z, wo) {
  pruefe(z.massLinien.length === z.massTexte.length && z.massLinien.length >= 2,
    `${wo}: ${z.massLinien.length} Maßlinien, aber ${z.massTexte.length} Beschriftungen`);
  const masse = {};
  const skalen = [];
  z.massTexte.forEach((t, i) => {
    const m = t.match(/^(\S+) = ([\d,]+) cm/);
    pruefe(!!m, `${wo}: Maß „${t}“ nicht lesbar`);
    if (!m) return;
    const wert = zahl(m[2]);
    // Derselbe Name darf zweimal dastehen (r an beiden Viertelkreisen) — dann mit demselben Wert.
    if (m[1] in masse) pruefe(Math.abs(masse[m[1]] - wert) < 1e-9, `${wo}: ${m[1]} steht mit zwei verschiedenen Werten an der Zeichnung`);
    masse[m[1]] = wert;
    skalen.push(z.massLinien[i] / wert);
  });
  const skala = skalen[0];
  pruefe(skalen.every((s) => Math.abs(s - skala) < 0.012 * skala),
    `${wo}: die Maßlinien ergeben verschiedene Maßstäbe (${skalen.map((s) => s.toFixed(2)).join(", ")} px/cm) — eine Linie ist nicht so lang, wie an ihr steht`);
  return { skala, masse };
}

// Sind die Punktlisten bis auf EINE Verschiebung gleich? Zurück kommt der Vektor oder null.
function verschiebung(von, nach, eps = 0.03) {
  if (von.length !== nach.length) return null;
  const v = { x: nach[0].x - von[0].x, y: nach[0].y - von[0].y };
  return von.every((p, i) => Math.abs(nach[i].x - p.x - v.x) < eps && Math.abs(nach[i].y - p.y - v.y) < eps) ? v : null;
}

const klick = (page, sel) => page.evaluate((s) => document.querySelector(s).click(), sel);

// ── Die Rechnung eines Beispiels durchspielen ─────────────────────────────
//
// `schritte` ist die hier nachgerechnete Liste: { id, soll, art: "flaeche" | "rand", tol,
// falsch: [[wert, musterImHinweis], …], summeGerundet? }. Geprüft wird für jeden Schritt:
//   * er ist der einzige offene, die späteren warten;
//   * was er hervorhebt, hat den verlangten Flächeninhalt bzw. die verlangte Länge;
//   * eine leere Eingabe und jeder Fehlerwert werden zurückgewiesen, jeder mit seinem Hinweis;
//   * der Tipp erscheint;
//   * das nachgerechnete Ergebnis wird anerkannt, die Zeile zeigt es an.
async function spieleRechnung(page, kuerzel, schritte, wo, { zeigen = null } = {}) {
  const box = `#${kuerzel}-rechnung`;
  const zustaende = () => page.evaluate((b) => [...document.querySelectorAll(`${b} .zf-schritt`)].map((z) => ({
    id: z.dataset.schritt,
    art: ["aktiv", "fertig", "wartet"].find((k) => z.classList.contains(k)) || "?",
  })), box);
  const anfang = await zustaende();
  pruefe(anfang.map((z) => z.id).join(",") === schritte.map((s) => s.id).join(","),
    `${wo}: die Rechnung hat die Schritte ${anfang.map((z) => z.id).join(", ")} statt ${schritte.map((s) => s.id).join(", ")}`);
  pruefe(anfang.every((z, i) => z.art === (i === 0 ? "aktiv" : "wartet")), `${wo}: am Anfang ist nicht genau der erste Schritt offen (${anfang.map((z) => z.art).join(", ")})`);

  for (let nr = 0; nr < schritte.length; nr++) {
    const s = schritte[nr];
    const zeile = `${box} .zf-schritt[data-schritt="${s.id}"]`;
    const w = `${wo}, Schritt ${s.id}`;
    const stand = await zustaende();
    pruefe(stand.every((z, i) => z.art === (i < nr ? "fertig" : i === nr ? "aktiv" : "wartet")), `${w}: offen ist nicht genau dieser Schritt (${stand.map((z) => z.art).join(", ")})`);

    // Was hervorgehoben ist, ist das, wonach gefragt wird.
    const z = await zeichnung(page, kuerzel);
    const { skala } = massstab(z, w);
    if (s.art === "flaeche") {
      const A = z.teile.filter((t) => t.aktiv).reduce((a, t) => a + flaeche(t.punkte), 0) / (skala * skala);
      pruefe(Math.abs(A - s.soll) < 0.004 * s.soll + 0.01, `${w}: die hervorgehobenen Teile haben ${A.toFixed(3)} cm², gefragt sind ${s.soll.toFixed(3)} cm²`);
      pruefe(!z.rand.some((r) => r.aktiv), `${w}: bei einem Flächenschritt ist ein Randstück hervorgehoben`);
    } else {
      const L = z.rand.filter((r) => r.aktiv).reduce((a, r) => a + laenge(r.punkte), 0) / skala;
      pruefe(Math.abs(L - s.soll) < 0.004 * s.soll + 0.01, `${w}: die hervorgehobenen Randstücke sind ${L.toFixed(3)} cm lang, gefragt sind ${s.soll.toFixed(3)} cm`);
      pruefe(!z.teile.some((t) => t.aktiv), `${w}: bei einem Randschritt ist ein Teil hervorgehoben`);
    }

    const eingabe = async (roh) => {
      await page.locator(`${zeile} input`).fill(roh);
      await klick(page, `${zeile} .zf-pruefen`);
      return page.evaluate((zl) => {
        const e = document.querySelector(zl);
        const r = e.querySelector(".zf-rueck");
        return { fertig: e.classList.contains("fertig"), rueck: r ? r.innerText.replace(/\s+/g, " ").trim() : "", klasse: r ? r.className : "" };
      }, zeile);
    };

    const leer = await eingabe("");
    pruefe(!leer.fertig && /Trag eine Zahl ein/.test(leer.rueck), `${w}: eine leere Eingabe wird nicht mit einer Bitte um eine Zahl beantwortet — „${leer.rueck}“`);
    const halb = await eingabe("3 · 4");
    pruefe(!halb.fertig && /Trag eine Zahl ein/.test(halb.rueck), `${w}: „3 · 4“ gilt als Zahl`);

    // Die Fehlerwerte in der Reihenfolge, in der die Seite sie prüft. Fällt einer mit der Lösung
    // zusammen, ist er kein Fehler; fällt er mit einem früheren zusammen, nennt die Seite dessen
    // Hinweis — dann wird nur noch die Zurückweisung verlangt.
    const gleich = (a, b) => Math.abs(a - b) <= s.tol + 0.012;
    const bisher = [];
    for (const [wert, muster] of s.falsch) {
      if (!Number.isFinite(wert) || gleich(wert, s.soll)) continue;
      const verdeckt = bisher.some((f) => gleich(f, wert));
      bisher.push(wert);
      const r = await eingabe(deutsch(rund2(wert)));
      pruefe(!r.fertig && /err/.test(r.klasse), `${w}: der Fehlerwert ${de2(wert)} wird anerkannt`);
      if (!verdeckt) pruefe(r.rueck.includes(muster), `${w}: bei ${de2(wert)} fehlt der Hinweis „${muster}“ — „${r.rueck}“`);
    }
    // Knapp daneben ist auch daneben.
    const knapp = await eingabe(deutsch(rund2(s.soll + s.tol + 0.02)));
    pruefe(!knapp.fertig, `${w}: ${de2(s.soll + s.tol + 0.02)} wird anerkannt, obwohl es außerhalb der Toleranz liegt`);

    await klick(page, `${zeile} .zf-tipp`);
    const tipp = await page.evaluate((zl) => { const r = document.querySelector(`${zl} .zf-rueck`); return { text: r.innerText.trim(), klasse: r.className }; }, zeile);
    pruefe(/tipp/.test(tipp.klasse) && tipp.text.length > 30, `${w}: der Tipp fehlt oder ist zu kurz — „${tipp.text}“`);

    if (zeigen === s.id) {
      await klick(page, `${zeile} .zf-zeigen`);
    } else {
      // Eine Summe wird auch anerkannt, wenn sie aus gerundeten Teilergebnissen gebildet ist.
      const typ = s.summeGerundet !== undefined && nr % 2 === 1 ? s.summeGerundet : s.soll;
      const r = await eingabe(deutsch(rund2(typ)));
      pruefe(r.fertig, `${w}: das nachgerechnete Ergebnis ${de2(typ)} wird nicht anerkannt — „${r.rueck}“`);
    }
    const danach = await page.evaluate((zl) => {
      const e = document.querySelector(zl);
      const weg = e.querySelector(".zf-weg"), haken = e.querySelector(".zf-haken");
      return { fertig: e.classList.contains("fertig"), weg: weg ? weg.innerText.replace(/\s+/g, " ") : "", haken: haken ? haken.innerText.trim() : "", eingabe: !!e.querySelector("input") };
    }, zeile);
    pruefe(danach.fertig && !danach.eingabe, `${w}: der Schritt ist nach der Lösung nicht abgeschlossen`);
    pruefe(danach.haken === (zeigen === s.id ? "aufgedeckt" : "✓"), `${w}: die Zeile trägt „${danach.haken}“`);
    // Ein glattes Ergebnis steht genau da (3,375), ein gerundetes mit zwei Stellen.
    const erwartet = Math.abs(s.soll - Number(s.soll.toFixed(4))) < 1e-9 ? de(s.soll) : de2(s.soll);
    pruefe(danach.weg.includes(`${erwartet} cm`), `${w}: die Rechnung nennt das Ergebnis ${erwartet} cm nicht — „${danach.weg}“`);
  }
  const ende = await page.evaluate((b) => ({
    fertig: !!document.querySelector(`${b} .zf-fertig`),
    neu: !!document.querySelector(`${b} .zf-neu`),
  }), box);
  pruefe(ende.fertig && ende.neu, `${wo}: nach dem letzten Schritt fehlt die Abschlusszeile oder der Knopf zum Neubeginn`);
}

async function rechnungZurueck(page, kuerzel, wo) {
  await klick(page, `#${kuerzel}-rechnung .zf-neu`);
  const stand = await page.evaluate((b) => [...document.querySelectorAll(`${b} .zf-schritt`)].map((z) => z.className), `#${kuerzel}-rechnung`);
  pruefe(/aktiv/.test(stand[0]) && stand.slice(1).every((k) => /wartet/.test(k)), `${wo}: „Rechnung neu beginnen“ setzt die Schritte nicht zurück`);
}

// ── Starrheit: auseinanderziehen ──────────────────────────────────────────
//
// Bei jedem Anteil ist jedes Teil dasselbe Vieleck wie am Platz, nur verschoben — und zwar um den
// Anteil des ganzen Wegs. Am Ende liegt kein Teil mehr auf einem anderen, und nichts ragt aus dem Bild.
async function starr(page, kuerzel, wo, { flaechen } = {}) {
  await setzeRegler(page, `${kuerzel}-t`, 0);
  const z0 = await zeichnung(page, kuerzel);
  const { skala } = massstab(z0, wo);
  await setzeRegler(page, `${kuerzel}-t`, 100);
  const z1 = await zeichnung(page, kuerzel);
  const ganz = z0.teile.map((t, i) => verschiebung(t.punkte, z1.teile[i].punkte));
  pruefe(ganz.every((v) => v !== null), `${wo}: ganz auseinandergezogen ist ein Teil verformt`);
  pruefe(ganz.filter((v) => v && Math.hypot(v.x, v.y) > 0.5 * skala).length >= z0.teile.length - 1, `${wo}: beim Auseinanderziehen bewegen sich zu wenige Teile`);
  for (const tProzent of [35, 70]) {
    await setzeRegler(page, `${kuerzel}-t`, tProzent);
    const z = await zeichnung(page, kuerzel);
    z.teile.forEach((teil, i) => {
      const v = verschiebung(z0.teile[i].punkte, teil.punkte);
      pruefe(v !== null, `${wo}, ${tProzent} %: Teil ${i + 1} ist verformt — die Bewegung ist nicht starr`);
      if (v && ganz[i]) {
        pruefe(Math.abs(v.x - (tProzent / 100) * ganz[i].x) < 0.05 && Math.abs(v.y - (tProzent / 100) * ganz[i].y) < 0.05,
          `${wo}, ${tProzent} %: Teil ${i + 1} liegt nicht beim Anteil ${tProzent} % seines Wegs`);
      }
      if (flaechen) pruefe(Math.abs(flaeche(teil.punkte) / (skala * skala) - flaechen[i]) < 0.004 * flaechen[i] + 0.01,
        `${wo}, ${tProzent} %: Teil ${i + 1} hat ${(flaeche(teil.punkte) / (skala * skala)).toFixed(3)} cm² statt ${flaechen[i].toFixed(3)} cm²`);
    });
  }
  // Ganz auseinander: Kein Eckpunkt eines Teils liegt in einem anderen.
  for (let i = 0; i < z1.teile.length; i++) {
    for (let j = 0; j < z1.teile.length; j++) {
      if (i === j) continue;
      pruefe(!z1.teile[i].punkte.some((p) => innen(p, z1.teile[j].punkte)), `${wo}: ganz auseinandergezogen liegt Teil ${i + 1} noch auf Teil ${j + 1}`);
    }
  }
  imBild(z1, `${wo}, auseinandergezogen`);
  imBild(z0, `${wo}, zusammengesetzt`);
  await setzeRegler(page, `${kuerzel}-t`, 0);
  return { skala, z0 };
}

// Nichts ragt aus der Zeichenfläche — weder ein Teil noch eine Beschriftung.
function imBild(z, wo) {
  for (const t of z.teile) {
    const k = kasten(t.punkte);
    pruefe(k.minX >= 0 && k.minY >= 0 && k.maxX <= z.breite && k.maxY <= z.hoehe, `${wo}: Teil ${t.index + 1} ragt aus der Zeichenfläche`);
  }
  for (const t of z.texte) {
    pruefe(t.x0 >= 0 && t.y0 >= 0 && t.x1 <= z.breite && t.y1 <= z.hoehe,
      `${wo}: die Beschriftung „${t.text}“ ragt aus der Zeichenfläche (${t.x0.toFixed(0)}…${t.x1.toFixed(0)} von ${z.breite})`);
  }
}

// Der Rand ist EIN geschlossener Zug: Jedes Stück beginnt, wo das vorige endet.
function randGeschlossen(z, wo) {
  const r = z.rand.slice().sort((a, b) => a.nr - b.nr);
  r.forEach((stueck, i) => {
    const naechstes = r[(i + 1) % r.length];
    pruefe(abstand(stueck.punkte[stueck.punkte.length - 1], naechstes.punkte[0]) < 0.05, `${wo}: der Rand ist zwischen Stück ${i} und ${(i + 1) % r.length} unterbrochen`);
  });
  return r.reduce((a, s) => a + laenge(s.punkte), 0);
}

// ── Abschnitt 1: Flächeninhalt — Rechteck mit zwei Viertelkreisen ─────────

const viertelFalschFlaeche = (r) => [[P * r * r, "ganze Kreis"], [(P * r * r) / 2, "Halbkreis"], [(P * r) / 2, "Länge des Viertelbogens"], [(P * r) / 4, "Quadrieren vergessen"]];
const viertelFalschBogen = (r) => [[(P * r * r) / 4, "Flächeninhalt des Viertelkreises"], [2 * P * r, "ganze Kreisumfang"], [P * r, "Halbkreisbogen"], [(P * r) / 4, "Faktor 2 fehlt"]];

async function zerlegen(page) {
  for (const [r, b] of [[4, 6], [2, 3], [2.5, 7], [3.5, 4.5]]) {
    await setzeRegler(page, "z1-r", r);
    await setzeRegler(page, "z1-b", b);
    const wo = `Beispiel 1 (r = ${r}, b = ${b})`;
    const A1 = (P * r * r) / 4, A2 = b * r, A = 2 * A1 + A2, U = P * r + 2 * (b + r);
    const { skala, z0 } = await starr(page, "z1", wo, { flaechen: [A1, A2, A1] });
    const { masse } = massstab(z0, wo);
    pruefe(masse.r === r && masse.b === b, `${wo}: an der Zeichnung stehen r = ${masse.r} und b = ${masse.b}`);
    pruefe(z0.teile.length === 3, `${wo}: ${z0.teile.length} Teile statt 3`);
    const flaechen = z0.teile.map((t) => flaeche(t.punkte) / (skala * skala));
    [A1, A2, A1].forEach((soll, i) => pruefe(Math.abs(flaechen[i] - soll) < 0.004 * soll + 0.01, `${wo}: Teil ${i + 1} hat ${flaechen[i].toFixed(3)} cm² statt ${soll.toFixed(3)} cm²`));
    // Der Viertelkreis ist ein Viertelkreis: Seine Bogenpunkte liegen alle r von der Ecke entfernt.
    for (const i of [0, 2]) {
      const [ecke, ...bogen] = z0.teile[i].punkte;
      pruefe(bogen.every((p) => Math.abs(abstand(p, ecke) / skala - r) < 0.01), `${wo}: Teil ${i + 1} ist kein Kreisteil mit dem Radius ${r} cm`);
    }
    const rand = randGeschlossen(z0, wo) / skala;
    pruefe(Math.abs(rand - U) < 0.003 * U, `${wo}: der gezeichnete Rand ist ${rand.toFixed(3)} cm lang statt ${U.toFixed(3)} cm`);
    pruefe(z0.schnitte.length === 4 && z0.schnitte.every((s) => Math.abs(laenge(s.punkte) / skala - r) < 0.01), `${wo}: die Schnittkanten sind nicht je ${r} cm lang`);

    await spieleRechnung(page, "z1", [
      { id: "a1", art: "flaeche", soll: A1, tol: 0.015, falsch: viertelFalschFlaeche(r) },
      { id: "a2", art: "flaeche", soll: A2, tol: 0.015, falsch: [[2 * (b + r), "Umfang des Rechtecks"], [2 * b * r, "nicht wie ihr Durchmesser"], [b + r, "addiert"]] },
      { id: "a3", art: "flaeche", soll: A1, tol: 0.015, falsch: viertelFalschFlaeche(r) },
      { id: "a", art: "flaeche", soll: A, tol: 0.035, summeGerundet: 2 * rund2(A1) + A2,
        falsch: [[A1 + A2, "fehlt ein Viertelkreis"], [A2 + P * r * r, "kein ganzer Kreis"], [A2, "nur das Rechteck"], [2 * A1, "nur die beiden Viertelkreise"]] },
    ], wo, { zeigen: r === 2 ? "a2" : null });
    // Gelöste Teile tragen ihren Flächeninhalt im Bild.
    const z = await zeichnung(page, "z1");
    const werte = z.texte.filter((t) => /zf-wert/.test(t.klasse)).map((t) => t.text);
    pruefe(werte.length === 3 && werte.includes(`${de2(A1)} cm²`) && werte.includes(`${de2(A2)} cm²`), `${wo}: nach der Rechnung stehen an den Teilen ${werte.join(" | ")}`);
    pruefe((await text(page, "#z1-text")).includes(de2(A)), `${wo}: der Text nennt den Flächeninhalt ${de2(A)} cm² nicht`);
    await rechnungZurueck(page, "z1", wo);
  }
  // Neue Maße sind eine neue Aufgabe: Ein gelöster Schritt verfällt.
  await setzeRegler(page, "z1-r", 3);
  await page.locator('#z1-rechnung .zf-schritt.aktiv input').fill(deutsch(rund2((P * 9) / 4)));
  await klick(page, "#z1-rechnung .zf-schritt.aktiv .zf-pruefen");
  pruefe(await page.evaluate(() => document.querySelectorAll("#z1-rechnung .zf-schritt.fertig").length) === 1, "Beispiel 1: der erste Schritt lässt sich nach dem Zurücksetzen nicht lösen");
  await setzeRegler(page, "z1-b", 5);
  pruefe(await page.evaluate(() => document.querySelectorAll("#z1-rechnung .zf-schritt.fertig").length) === 0, "Beispiel 1: nach einer Änderung der Maße gilt ein Schritt weiter als gelöst");
}

// ── Abschnitt 2: Umfang — den Rand abschreiten ────────────────────────────

async function umfang(page) {
  for (const [r, b] of [[4, 6], [2, 3], [3, 7]]) {
    await setzeRegler(page, "u1-r", r);
    await setzeRegler(page, "u1-b", b);
    const wo = `Umfang (r = ${r}, b = ${b})`;
    const bog = (P * r) / 2, ger = b + r, U = 2 * bog + 2 * ger;
    const { skala, z0 } = await starr(page, "u1", wo);
    pruefe(z0.schnitte.length === 4 && z0.schnitte.every((s) => s.rot), `${wo}: die Schnittkanten sind nicht rot`);
    // Keine Schnittkante liegt auf dem Rand: Ihre Mitte ist von jedem Randpunkt weit entfernt.
    for (const s of z0.schnitte) {
      const m = { x: (s.punkte[0].x + s.punkte[1].x) / 2, y: (s.punkte[0].y + s.punkte[1].y) / 2 };
      pruefe(z0.rand.every((st) => st.punkte.every((p) => abstand(p, m) > 0.3 * skala)), `${wo}: eine Schnittkante liegt auf dem Rand`);
    }
    // Die vier Nummern stehen an ihren Randstücken, und der Startpunkt liegt am Anfang des Randes.
    const nummern = z0.texte.filter((t) => /zf-nr-rand/.test(t.klasse)).map((t) => t.text).join("");
    pruefe(nummern === "①②③④", `${wo}: die Randstücke tragen „${nummern}“`);
    pruefe(!!z0.start && abstand(z0.start, z0.rand.find((s) => s.nr === 0).punkte[0]) < 0.05, `${wo}: der Startpunkt liegt nicht am Anfang des Randes`);

    // Abschreiten: Der orange Weg ist bei jedem Anteil genau so lang wie der Anteil des Umfangs,
    // er beginnt am Start, und der Läufer steht an seinem Ende.
    for (const sProzent of [0, 12, 26, 50, 78, 100]) {
      await setzeRegler(page, "u1-s", sProzent);
      const z = await zeichnung(page, "u1");
      const weg = z.spur.reduce((a, s) => a + laenge(s), 0) / skala;
      pruefe(Math.abs(weg - (sProzent / 100) * U) < 0.004 * U + 0.01, `${wo}, ${sProzent} % abgeschritten: der Weg ist ${weg.toFixed(3)} cm lang statt ${((sProzent / 100) * U).toFixed(3)} cm`);
      const ende = z.spur.length ? z.spur[z.spur.length - 1].slice(-1)[0] : z.start;
      pruefe(!!z.laeufer && abstand(z.laeufer, ende) < 0.05, `${wo}, ${sProzent} %: der Läufer steht nicht am Ende des Wegs`);
      if (z.spur.length) pruefe(abstand(z.spur[0][0], z.start) < 0.05, `${wo}, ${sProzent} %: der Weg beginnt nicht am Start`);
      // Der Weg läuft auf dem Rand: Jeder seiner Punkte liegt auf einem Randstück.
      for (const s of z.spur) {
        pruefe(s.every((p) => z.rand.some((st) => abstandZug(p, st.punkte) < 0.05)), `${wo}, ${sProzent} %: der Weg verlässt den Rand`);
      }
      const t = await text(page, "#u1-text");
      if (sProzent === 26) pruefe(/gerade Kante unten ②/.test(t), `${wo}: bei 26 % nennt der Text nicht die untere Kante — „${t}“`);
      if (sProzent === 100) pruefe(/wieder am Start/.test(t), `${wo}: bei 100 % steht nicht, dass der Weg wieder am Start ist — „${t}“`);
    }
    await setzeRegler(page, "u1-s", 0);

    await spieleRechnung(page, "u1", [
      { id: "u1", art: "rand", soll: bog, tol: 0.015, falsch: viertelFalschBogen(r) },
      { id: "u2", art: "rand", soll: ger, tol: 0.015, falsch: [[b, "nur das Stück unter dem Rechteck"], [b + 2 * r, "nur EIN Viertelkreis"], [r, "nur das Stück am Viertelkreis"]] },
      { id: "u3", art: "rand", soll: bog, tol: 0.015, falsch: viertelFalschBogen(r) },
      { id: "u4", art: "rand", soll: ger, tol: 0.015, falsch: [[b, "nur das Stück über dem Rechteck"], [b + 2 * r, "nur EIN Viertelkreis"], [r, "nur das Stück am Viertelkreis"]] },
      { id: "u", art: "rand", soll: U, tol: 0.035, summeGerundet: 2 * rund2(bog) + 2 * ger,
        falsch: [[U + 2 * r, "Schnittkanten mitgezählt"], [U + 4 * r, "Summe der Umfänge der drei Teile"], [2 * bog + 2 * b, "länger als b"], [2 * ger, "nur die beiden geraden Kanten"]] },
    ], wo);
    await rechnungZurueck(page, "u1", wo);
  }
  // Auseinandergezogen nennt der Text die Schnittkanten.
  await setzeRegler(page, "u1-t", 100);
  pruefe(/Schnittkanten/.test(await text(page, "#u1-text")), "Umfang: auseinandergezogen nennt der Text die Schnittkanten nicht");
  await setzeRegler(page, "u1-t", 0);
}

// ── Abschnitt 3: Rechteck, Dreieck und Kreisausschnitt ────────────────────

async function teile(page) {
  let skalaVorher = null;
  for (const [b, h, alpha] of [[4, 4, 60], [2, 2, 30], [5, 4, 120], [3.5, 3, 90], [2.5, 2, 110]]) {
    await setzeRegler(page, "t2-b", b);
    await setzeRegler(page, "t2-h", h);
    await setzeRegler(page, "t2-w", alpha);
    const wo = `Beispiel 2 (b = ${b}, h = ${h}, α = ${alpha}°)`;
    const { skala, z0 } = await starr(page, "t2", wo);
    const { masse } = massstab(z0, wo);
    // Fester Maßstab: Eine größere Figur ist im Bild größer.
    if (skalaVorher !== null) pruefe(Math.abs(skala - skalaVorher) < 0.01, `${wo}: der Maßstab hat sich geändert (${skala.toFixed(2)} statt ${skalaVorher.toFixed(2)} px/cm)`);
    skalaVorher = skala;
    const { c, s } = masse;
    pruefe(masse.b === b && masse.h === h, `${wo}: an der Zeichnung stehen b = ${masse.b} und h = ${masse.h}`);
    // Die schräge Seite ist „gemessen“ — und stimmt trotzdem genau (hier darf Pythagoras prüfen).
    pruefe(z0.massTexte.some((t) => /^s = .* cm \(gemessen\)$/.test(t)), `${wo}: die schräge Seite trägt nicht „gemessen“`);
    pruefe(Math.abs(c * c + h * h - s * s) < 1e-9, `${wo}: c = ${c}, h = ${h} und s = ${s} passen nicht zu einem rechtwinkligen Dreieck`);

    const k = alpha / 360;
    const A1 = b * h, A2 = (c * h) / 2, A3 = k * P * s * s, A = A1 + A2 + A3;
    const G = 2 * b + h + c + s, B = k * 2 * P * s, U = G + B;
    const flaechen = z0.teile.map((t) => flaeche(t.punkte) / (skala * skala));
    [A1, A2, A3].forEach((soll, i) => pruefe(Math.abs(flaechen[i] - soll) < 0.004 * soll + 0.01, `${wo}: Teil ${i + 1} hat ${flaechen[i].toFixed(3)} cm² statt ${soll.toFixed(3)} cm²`));
    // Der Ausschnitt: Spitze, dann lauter Punkte im Abstand s — und der Winkelbogen öffnet sich um α.
    const [spitze, ...bogen] = z0.teile[2].punkte;
    pruefe(bogen.every((p) => Math.abs(abstand(p, spitze) / skala - s) < 0.01), `${wo}: der Kreisausschnitt hat nicht überall den Radius ${s} cm`);
    const winkelVon = (punkte) => {
      const [m, ...rest] = punkte;
      let summe = 0;
      for (let i = 1; i < rest.length; i++) {
        const a = Math.atan2(rest[i - 1].y - m.y, rest[i - 1].x - m.x), w = Math.atan2(rest[i].y - m.y, rest[i].x - m.x);
        let d = w - a;
        if (d > Math.PI) d -= 2 * Math.PI;
        if (d < -Math.PI) d += 2 * Math.PI;
        summe += d;
      }
      return Math.abs(summe) * (180 / Math.PI);
    };
    pruefe(Math.abs(winkelVon(z0.teile[2].punkte) - alpha) < 0.1, `${wo}: der Kreisausschnitt öffnet sich um ${winkelVon(z0.teile[2].punkte).toFixed(1)}° statt ${alpha}°`);
    pruefe(z0.winkel.length === 1 && Math.abs(winkelVon(z0.winkel[0]) - alpha) < 0.3 && abstand(z0.winkel[0][0], spitze) < 0.05, `${wo}: der Winkelbogen zeigt nicht α = ${alpha}° an der Spitze des Ausschnitts`);
    const rand = randGeschlossen(z0, wo) / skala;
    pruefe(Math.abs(rand - U) < 0.003 * U, `${wo}: der gezeichnete Rand ist ${rand.toFixed(3)} cm lang statt ${U.toFixed(3)} cm`);

    await starr(page, "t2", wo, { flaechen: [A1, A2, A3] });
    await spieleRechnung(page, "t2", [
      { id: "a1", art: "flaeche", soll: A1, tol: 0.015, falsch: [[2 * (b + h), "Umfang des Rechtecks"], [b + h, "addiert"]] },
      { id: "a2", art: "flaeche", soll: A2, tol: 0.015, falsch: [[c * h, "halb so groß"], [(c * s) / 2, "steht nicht senkrecht auf c"], [(h * s) / 2, "steht nicht senkrecht auf h"], [c * s, "Zwei Fehler"]] },
      { id: "a3", art: "flaeche", soll: A3, tol: 0.015, falsch: [[P * s * s, "ganze Kreis"], [B, "Länge des Bogens"], [k * P * h * h, "nicht die Höhe h"], [k * P * s, "Quadrieren vergessen"]] },
      { id: "a", art: "flaeche", soll: A, tol: 0.035, summeGerundet: A1 + A2 + rund2(A3), falsch: [[A1 + A3, "Dreieck fehlt"], [A1 + A2, "Kreisausschnitt fehlt"], [A2 + A3, "Rechteck fehlt"]] },
      { id: "u1", art: "rand", soll: G, tol: 0.015, falsch: [[G + h + s, "beiden Schnittkanten mitgezählt"], [G + s, "nur einmal vor"], [G + h, "zählt nur einmal"], [G - s, "freie Radius"], [G - c, "kommt noch c"]] },
      { id: "u2", art: "rand", soll: B, tol: 0.015, falsch: [[A3, "Flächeninhalt des Ausschnitts"], [2 * P * s, "ganze Kreisumfang"], [k * 2 * P * h, "nicht die Höhe h"], [k * P * s, "Faktor 2 fehlt"]] },
      { id: "u", art: "rand", soll: U, tol: 0.035, summeGerundet: G + rund2(B), falsch: [[G + h + s + B, "liegen innen"], [G, "Bogen fehlt"], [B, "geraden Randstücke fehlen"]] },
    ], wo, { zeigen: alpha === 90 ? "a3" : null });
    await rechnungZurueck(page, "t2", wo);
  }
}

// ── Abschnitt 4: ergänzen und abziehen ────────────────────────────────────

async function abziehen(page) {
  // Der Abstand a ist begrenzt: Der Ausschnitt muss in die Seite passen (Radius ≥ 0,5 cm) und darf
  // nicht bis an den rechten Rand reichen (≥ 1 cm Abstand). Der Regler zeigt, womit gerechnet wird,
  // und das Sprungziel ergibt dasselbe Bild, als hätte man es direkt gewählt.
  for (const b of [3, 4.5, 6]) {
    for (const h of [3, 4, 5, 6]) {
      await setzeRegler(page, "a3-b", b);
      await setzeRegler(page, "a3-h", h);
      for (const wunsch of [0.5, 1.5, 2.5]) {
        const a = await setzeRegler(page, "a3-a", wunsch);
        const r = h / 2 - a;
        const wo = `Beispiel 3, Grenzen (b = ${b}, h = ${h}, a gewünscht ${wunsch})`;
        pruefe(r >= 0.5 - 1e-9 && r <= b - 1 + 1e-9, `${wo}: der Regler steht auf a = ${a} — der Ausschnitt hätte den Radius ${r} cm`);
        pruefe((await text(page, "#a3-a-anzeige")) === `${de(a)} cm`, `${wo}: die Anzeige nennt nicht den Wert des Reglers`);
        const z = await zeichnung(page, "a3");
        const { masse } = massstab(z, wo);
        pruefe(masse.a === a && masse.h === h && masse.b === b, `${wo}: an der Zeichnung steht a = ${masse.a}, h = ${masse.h}, b = ${masse.b}`);
        if (a !== wunsch) {
          const bild = await page.evaluate(() => document.querySelector("#a3-mount").innerHTML);
          const direkt = await setzeRegler(page, "a3-a", a);
          pruefe(direkt === a && (await page.evaluate(() => document.querySelector("#a3-mount").innerHTML)) === bild, `${wo}: das Sprungziel a = ${a} ergibt direkt gewählt ein anderes Bild`);
        }
      }
    }
  }

  for (const [b, h, a] of [[4, 4, 1], [3, 6, 1.5], [6, 6, 0.5], [3, 3, 1], [5.5, 5, 1.5]]) {
    await setzeRegler(page, "a3-b", b);
    await setzeRegler(page, "a3-h", h);
    const gesetzt = await setzeRegler(page, "a3-a", a);
    const wo = `Beispiel 3 (b = ${b}, h = ${h}, a = ${a})`;
    pruefe(gesetzt === a, `${wo}: der Regler nimmt a = ${a} nicht an (steht auf ${gesetzt})`);
    const R = h / 2, r = R - a;
    const A1 = b * h, A2 = (P * R * R) / 2, A3 = (P * r * r) / 2, A = A1 + A2 - A3;
    const G = 2 * b + 2 * a, B1 = P * R, B2 = P * r, U = G + B1 + B2;
    const { skala, z0 } = await starr(page, "a3", wo, { flaechen: [A1 - A3, A2, A3] });
    pruefe(z0.teile.length === 3 && /zf-teil-b/.test(z0.teile[2].klasse) && !/zf-teil-b/.test(z0.teile[0].klasse), `${wo}: das herausgenommene Stück ist nicht als einziges orange`);
    const flaechen = z0.teile.map((t) => flaeche(t.punkte) / (skala * skala));
    [A1 - A3, A2, A3].forEach((soll, i) => pruefe(Math.abs(flaechen[i] - soll) < 0.004 * soll + 0.01, `${wo}: Teil ${i + 1} hat ${flaechen[i].toFixed(3)} cm² statt ${soll.toFixed(3)} cm²`));
    // Am Platz füllt das orange Stück die Lücke genau: Es liegt an der linken Kante des Rechtecks,
    // auf halber Höhe, und sein Bogen ist der Bogen der Lücke.
    const k0 = kasten(z0.teile[0].punkte), k2 = kasten(z0.teile[2].punkte);
    pruefe(Math.abs(k2.minX - k0.minX) < 0.05 && Math.abs((k2.minY + k2.maxY) / 2 - (k0.minY + k0.maxY) / 2) < 0.05, `${wo}: das orange Stück sitzt am Platz nicht in der Lücke`);
    pruefe(Math.abs((k2.maxY - k2.minY) / skala - 2 * r) < 0.01 && Math.abs((k2.maxX - k2.minX) / skala - r) < 0.01, `${wo}: das orange Stück ist kein Halbkreis mit dem Radius ${r} cm`);
    pruefe(Math.abs((k0.maxY - k0.minY) / skala - h) < 0.01 && Math.abs((k0.maxX - k0.minX) / skala - b) < 0.01, `${wo}: das Rechteck ist nicht ${b} cm breit und ${h} cm hoch`);
    const rand = randGeschlossen(z0, wo) / skala;
    pruefe(Math.abs(rand - U) < 0.003 * U, `${wo}: der gezeichnete Rand ist ${rand.toFixed(3)} cm lang statt ${U.toFixed(3)} cm`);

    const aStattR = (wert) => (Math.abs(a - r) < 1e-9 ? NaN : wert);
    await spieleRechnung(page, "a3", [
      { id: "a1", art: "flaeche", soll: A1, tol: 0.015, falsch: [[2 * (b + h), "Umfang des Rechtecks"], [A1 - A3, "GANZE Rechteck"]] },
      { id: "a2", art: "flaeche", soll: A2, tol: 0.015, falsch: [[P * R * R, "ganze Kreis"], [(P * h * h) / 2, "h ist der Durchmesser"], [P * R, "Länge des Halbkreisbogens"], [(P * R) / 2, "Quadrieren vergessen"]] },
      { id: "a3", art: "flaeche", soll: A3, tol: 0.015, falsch: [[aStattR((P * a * a) / 2), "nicht sein Radius"], [2 * P * r * r, "Durchmesser des Ausschnitts"], [P * r * r, "ganze Kreis"], [P * r, "Länge des Halbkreisbogens"]] },
      { id: "a", art: "flaeche", soll: A, tol: 0.035, summeGerundet: A1 + rund2(A2) - rund2(A3),
        falsch: [[A1 + A2 + A3, "nicht addiert"], [A1 + A2, "ohne Ausschnitt"], [A1 - A3, "große Halbkreis rechts"], [A1 - A2 - A3, "Nur der kleine Halbkreis wird abgezogen"]] },
      { id: "u1", art: "rand", soll: G, tol: 0.015, falsch: [[2 * b + h, "nicht mehr ganz da"], [G + h, "Schnittkante"], [2 * b, "zwei gerade Stücke"], [2 * b + a, "ZWEI gerade Stücke"]] },
      { id: "u2", art: "rand", soll: B1, tol: 0.015, falsch: [[2 * P * R, "nur der halbe"], [A2, "Flächeninhalt des Halbkreises"], [(P * R) / 2, "Viertelbogen"]] },
      { id: "u3", art: "rand", soll: B2, tol: 0.015, falsch: [[2 * P * r, "nur der halbe"], [A3, "Flächeninhalt des Ausschnitts"], [aStattR(P * a), "nicht der Radius des Ausschnitts"], [(P * r) / 2, "Viertelbogen"]] },
      { id: "u", art: "rand", soll: U, tol: 0.035, summeGerundet: G + rund2(B1) + rund2(B2),
        falsch: [[G + B1 - B2, "nichts abgezogen"], [2 * b + h + B1, "OHNE Ausschnitt"], [G + B1, "Rand des Ausschnitts fehlt"]] },
    ], wo, { zeigen: b === 3 && h === 6 ? "u2" : null });
    // Der Schlusstext vergleicht: ohne Ausschnitt weniger Rand als mit.
    const t = await text(page, "#a3-text");
    const ohne = 2 * b + h + B1;
    pruefe(t.includes(de2(ohne)) && t.includes(de2(U)) && U > ohne, `${wo}: der Schlusstext vergleicht nicht ${de2(ohne)} cm (ohne) mit ${de2(U)} cm (mit Ausschnitt) — „${t}“`);
    await rechnungZurueck(page, "a3", wo);
  }
}

// ── Verschieben von Hand ──────────────────────────────────────────────────
//
// Ein Teil wird mit der Maus gegriffen (an seiner Nummer — die lässt den Zeiger durch) und gezogen.
// page.mouse rollt die Seite nicht: Vor jedem Griff wird das Bild in den Blick geholt und die Lage
// neu gemessen. Die Wege stehen in Bildpunkten der viewBox; auf dem Schirm legt die Maus das
// `faktor`-Fache zurück (auf dem Telefon ist das Bild verkleinert). Gezogen wird bei den kleinsten
// Maßen — dann ist um die Figur herum Platz.
async function ziehen(page, kuerzel, wo, kleinste) {
  for (const [id, wert] of kleinste) await setzeRegler(page, id, wert);
  const mitte = async (i) => {
    await page.locator(`#${kuerzel}-mount svg`).scrollIntoViewIfNeeded();
    return page.evaluate(([id, idx]) => {
      const svg = document.querySelector(`#${id}-mount svg`);
      const nr = [...svg.querySelectorAll("text.zf-nr")][idx].getBoundingClientRect();
      const faktor = svg.getBoundingClientRect().width / svg.viewBox.baseVal.width;
      return { x: nr.x + nr.width / 2, y: nr.y + nr.height / 2, faktor };
    }, [kuerzel, i]);
  };
  const zieh = async (i, dx, dy) => {
    const m = await mitte(i);
    await page.mouse.move(m.x, m.y);
    await page.mouse.down();
    await page.mouse.move(m.x + (dx * m.faktor) / 2, m.y + (dy * m.faktor) / 2, { steps: 4 });
    await page.mouse.move(m.x + dx * m.faktor, m.y + dy * m.faktor, { steps: 4 });
    await page.mouse.up();
    return m.faktor;
  };
  const amPlatz = (z, z0) => z.teile.every((t, i) => { const w = verschiebung(z0.teile[i].punkte, t.punkte); return !!w && Math.hypot(w.x, w.y) < 0.01; });
  await setzeRegler(page, `${kuerzel}-t`, 0);
  const z0 = await zeichnung(page, kuerzel);

  // Ziehen: Teil 1 wandert um genau den Weg der Maus, starr; die anderen bleiben liegen.
  const faktor = await zieh(0, -34, -26);
  let z = await zeichnung(page, kuerzel);
  let v = verschiebung(z0.teile[0].punkte, z.teile[0].punkte);
  pruefe(v !== null, `${wo}: beim Ziehen mit der Maus verformt sich das Teil`);
  pruefe(!!v && Math.abs(v.x + 34) < 1.5 / faktor && Math.abs(v.y + 26) < 1.5 / faktor, `${wo}: das Teil folgt der Maus nicht (verschoben um ${v ? v.x.toFixed(1) + " | " + v.y.toFixed(1) : "?"} statt −34 | −26)`);
  // Die Ecken stehen auf Hundertstel Bildpunkte gerundet im Bild — deshalb ein Tausendstel Spielraum.
  pruefe(Math.abs(flaeche(z.teile[0].punkte) - flaeche(z0.teile[0].punkte)) < 0.001 * flaeche(z0.teile[0].punkte), `${wo}: beim Ziehen ändert das Teil seinen Flächeninhalt`);
  z.teile.slice(1).forEach((t, i) => {
    const w = verschiebung(z0.teile[i + 1].punkte, t.punkte);
    pruefe(!!w && Math.hypot(w.x, w.y) < 0.05, `${wo}: beim Ziehen von Teil 1 bewegt sich Teil ${i + 2} mit`);
  });
  // Auch die Maßlinien des Teils sind mitgewandert: Der Maßstab stimmt noch.
  massstab(z, `${wo}, nach dem Ziehen`);

  // Fast zurück: Das Teil rastet an seinem Platz ein.
  await zieh(0, 34 - 4, 26 - 3);
  z = await zeichnung(page, kuerzel);
  pruefe(amPlatz(z, z0), `${wo}: nahe am Platz losgelassen rastet das Teil nicht ein`);

  // Weit hinaus, in beide Richtungen: Das Teil bleibt samt seinen Beschriftungen in der Zeichenfläche.
  for (const [dx, dy] of [[-2500, -2000], [5000, 4000]]) {
    await zieh(0, dx, dy);
    z = await zeichnung(page, kuerzel);
    imBild(z, `${wo}, weit hinausgezogen`);
    pruefe(verschiebung(z0.teile[0].punkte, z.teile[0].punkte) !== null, `${wo}: am Rand der Zeichenfläche verformt sich das Teil`);
  }

  // Der Regler bestimmt die Lage wieder allein, und „Teile zusammensetzen“ legt alles an seinen Platz.
  await setzeRegler(page, `${kuerzel}-t`, 0);
  z = await zeichnung(page, kuerzel);
  pruefe(amPlatz(z, z0), `${wo}: nach dem Regler liegt ein von Hand verschobenes Teil nicht wieder an seinem Platz`);
  await zieh(1, 14, -12);
  await setzeRegler(page, `${kuerzel}-t`, 60);
  await klick(page, `#${kuerzel}-heim`);
  z = await zeichnung(page, kuerzel);
  pruefe(amPlatz(z, z0) && (await page.evaluate((id) => document.getElementById(id).value, `${kuerzel}-t`)) === "0", `${wo}: „Teile zusammensetzen“ legt nicht alles zurück`);

  // Mit der Tastatur: Jede Pfeiltaste verschiebt um einen Viertelzentimeter, und der Fokus bleibt.
  const { skala } = massstab(z0, wo);
  await page.locator(`#${kuerzel}-mount .zf-teil[data-index="2"]`).focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowUp");
  z = await zeichnung(page, kuerzel);
  v = verschiebung(z0.teile[2].punkte, z.teile[2].punkte);
  pruefe(!!v && Math.abs(v.x - 0.5 * skala) < 0.1 && Math.abs(v.y + 0.25 * skala) < 0.1, `${wo}: die Pfeiltasten verschieben das Teil nicht um Viertelzentimeter`);
  pruefe(await page.evaluate(() => document.activeElement && document.activeElement.dataset.index === "2"), `${wo}: nach einer Pfeiltaste hat das Teil den Fokus verloren`);
  await klick(page, `#${kuerzel}-heim`);
  // Eine Eingabe in der Rechnung bleibt stehen, während die Teile bewegt werden.
  await page.locator(`#${kuerzel}-rechnung .zf-schritt.aktiv input`).fill("12,3");
  await zieh(0, -20, -10);
  await setzeRegler(page, `${kuerzel}-t`, 40);
  pruefe((await page.locator(`#${kuerzel}-rechnung .zf-schritt.aktiv input`).inputValue()) === "12,3", `${wo}: beim Bewegen der Teile geht die Eingabe in der Rechnung verloren`);
  await page.locator(`#${kuerzel}-rechnung .zf-schritt.aktiv input`).fill("");
  await klick(page, `#${kuerzel}-heim`);
}
const KLEINSTE = {
  z1: [["z1-r", 2], ["z1-b", 3]],
  u1: [["u1-r", 2], ["u1-b", 3]],
  t2: [["t2-b", 2], ["t2-h", 2], ["t2-w", 30]],
  a3: [["a3-b", 3], ["a3-h", 3], ["a3-a", 1]],
};

// ── Kontrollfragen ────────────────────────────────────────────────────────

async function quizze(page) {
  const ids = await page.evaluate(() => [...document.querySelectorAll(".quiz")].map((e) => e.id));
  pruefe(ids.length === 4, `Kontrollfragen: ${ids.length} statt 4`);
  for (const sec of ["sec-zerlegen", "sec-umfang", "sec-teile", "sec-abziehen"]) {
    const n = await page.evaluate((s) => document.querySelectorAll(`#${s} .quiz`).length, sec);
    pruefe(n === 1, `Kontrollfragen: Abschnitt ${sec} hat ${n} statt einer`);
  }
  // Die Lösungen sind hier unabhängig nachgerechnet.
  const rechne = (s) => Function(`"use strict"; return (${s.replace(/½/g, "0.5").replace(/π/g, "Math.PI").replace(/(\d+)²/g, "($1**2)").replace(/·/g, "*")});`)();
  const LOESUNG = {
    "quiz-zerlegen": (opt) => Math.abs(rechne(opt) - (80 * 100 + 0.5 * P * 40 * 40)) < 1e-6,   // Rechteck plus Halbkreis mit r = 40 cm
    "quiz-umfang": (opt) => opt === `${2 * (10 + 5)} cm`,                                       // Rechteck 10 cm × 5 cm
    "quiz-teile": (opt) => opt === `${3 * 6 + 2 * 5} cm`,                                       // drei Quadratseiten, zwei Dachseiten
    "quiz-abziehen": (opt) => /Flächeninhalt wird kleiner/.test(opt) && /Umfang größer/.test(opt),
  };
  const stellen = [];
  for (const id of ids) {
    const optionen = await page.evaluate((q) => [...document.querySelectorAll(`#${q} .quiz-opt`)].map((b) => b.textContent.trim()), id);
    pruefe(optionen.length === 4, `Quiz ${id}: ${optionen.length} Antwortmöglichkeiten statt 4`);
    pruefe(new Set(optionen).size === optionen.length, `Quiz ${id}: zwei Antworten lauten gleich`);
    let richtige = 0;
    for (let i = 0; i < optionen.length; i++) {
      await page.locator(`#${id} .quiz-opt`).nth(i).click();
      const r = await page.evaluate((q) => {
        const f = document.querySelector(`#${q} .quiz-feedback`);
        return { ok: f.classList.contains("ok"), text: f.textContent };
      }, id);
      if (r.ok) {
        richtige++;
        stellen.push(i);
      }
      pruefe(r.ok === LOESUNG[id](optionen[i]), `Quiz ${id}: „${optionen[i]}“ gilt als ${r.ok ? "richtig" : "falsch"} — nachgerechnet ist es umgekehrt`);
      pruefe(r.text.length > 80, `Quiz ${id}, Antwort ${i + 1}: die Erklärung ist nur ${r.text.length} Zeichen lang`);
    }
    pruefe(richtige === 1, `Quiz ${id}: ${richtige} Antworten gelten als richtig, erwartet genau eine`);
  }
  pruefe(new Set(stellen).size >= 3, `Kontrollfragen: die richtige Antwort steht nur an ${new Set(stellen).size} verschiedenen Stellen (${stellen.join(", ")})`);
}

// ── Die Übungsaufgaben ────────────────────────────────────────────────────

// π ≈ 3,14 zählt nur als eigener Fehler, wenn es das gerundete Ergebnis sichtbar verschiebt.
const mit314 = (soll, wert) => (Math.abs(wert - soll) > 0.07 ? wert : NaN);

// Die Zeichnung einer Aufgabe: ihr Rand als Vieleck, die Maßlinien mit ihrer Länge und Beschriftung.
async function figur(page, box) {
  return page.evaluate((sel) => {
    const svg = document.querySelector(`${sel} .aufgabe-prompt svg`);
    if (!svg) return null;
    const rand = svg.querySelector('[data-rolle="rand"]');
    const punkte = rand.getAttribute("d").replace(/[MZ]/g, "").split("L").map((t) => {
      const [x, y] = t.trim().split(",").map(Number);
      return { x, y };
    });
    const masse = {};
    for (const l of svg.querySelectorAll('line[data-rolle="mass"]')) {
      masse[l.dataset.mass] = { laenge: Math.hypot(l.getAttribute("x2") - l.getAttribute("x1"), l.getAttribute("y2") - l.getAttribute("y1")) };
    }
    for (const t of svg.querySelectorAll("text[data-mass]")) (masse[t.dataset.mass] ||= {}).text = t.textContent;
    const vb = svg.viewBox.baseVal;
    const draussen = [...svg.querySelectorAll("text")].filter((t) => {
      const b = t.getBBox();
      return b.x < 0 || b.y < 0 || b.x + b.width > vb.width || b.y + b.height > vb.height;
    }).map((t) => t.textContent);
    return { art: svg.dataset.figur, punkte, masse, draussen };
  }, box);
}
// Ein Maß nach seinem Namen — die Zahl hinter dem Gleichheitszeichen.
function mass(roh, name) {
  const t = roh.masse[name] && roh.masse[name].text;
  const m = t && t.match(/= ([\d.,]+)/);
  return m ? zahl(m[1]) : NaN;
}
// Die Zeichnung trägt die Zahlen, mit denen gerechnet wird: Alle Maßlinien ergeben denselben
// Maßstab, und der gezeichnete Rand hat den Flächeninhalt und den Umfang, die sich aus den
// angeschriebenen Maßen ergeben.
function zeichnungPasst(name, roh, A, U, frage) {
  const skalen = Object.entries(roh.masse).filter(([n, m]) => m.laenge && Number.isFinite(mass(roh, n))).map(([n, m]) => m.laenge / mass(roh, n));
  pruefe(skalen.length >= 1, `${name}: keine Maßlinie mit Zahl in der Zeichnung — „${frage}“`);
  if (!skalen.length) return;
  const skala = skalen[0];
  pruefe(skalen.every((s) => Math.abs(s - skala) < 0.012 * skala), `${name}: die Maßlinien ergeben verschiedene Maßstäbe (${skalen.map((s) => s.toFixed(2)).join(", ")}) — „${frage}“`);
  const AFig = flaeche(roh.punkte) / (skala * skala);
  const UFig = laenge([...roh.punkte, roh.punkte[0]]) / skala;
  pruefe(Math.abs(AFig - A) < 0.006 * A + 0.02, `${name}: gezeichnet sind ${AFig.toFixed(3)} Flächeneinheiten, aus den Maßen folgen ${A.toFixed(3)} — „${frage}“`);
  pruefe(Math.abs(UFig - U) < 0.006 * U + 0.02, `${name}: der gezeichnete Rand ist ${UFig.toFixed(3)} lang, aus den Maßen folgen ${U.toFixed(3)} — „${frage}“`);
  pruefe(roh.draussen.length === 0, `${name}: Beschriftungen ragen aus der Zeichnung — ${roh.draussen.join(" | ")}`);
}

// Eine einzelne gerundete Antwort.
function gerundet(name, richtig, falsch) {
  return {
    richtig: rund2(richtig),
    toleranz: 0.07,
    falsch: falsch.map(([w, m]) => [Number.isFinite(w) ? rund2(w) : w, m]),
    pruefe: (f, rueck) => pruefe(rueck.includes(de2(richtig)), `${name}: das Ergebnis ${de2(richtig)} fehlt in der Musterlösung — „${f}“`),
  };
}
// Mehrere Felder: sollwerte in der Reihenfolge der Felder, falsch je Feld als [feld, wert, muster].
// `stellen` sagt je Feld, auf wie viele Stellen ein Mensch runden würde.
function felder(name, sollwerte, falsch, stellen) {
  const rund = (x, i) => Number(x.toFixed(stellen ? stellen[i] : 2));
  return {
    felder: sollwerte.map(rund),
    toleranz: 0.07,
    falschFelder: falsch.map(([i, w, m]) => [i, Number.isFinite(w) ? rund(w, i) : w, m]),
    pruefe: (f, rueck) => sollwerte.forEach((w, i) => {
      const s = (stellen ? stellen[i] : 2) === 0 ? de(w, 0) : Math.abs(w - rund2(w)) < 1e-9 ? de(w) : de2(w);
      pruefe(rueck.includes(s), `${name}: das Ergebnis ${s} (Feld ${i + 1}) fehlt in der Musterlösung — „${f}“`);
    }),
  };
}

// Die Schranken für `mindestensVerschieden` sind gemessen, nicht geschätzt — mit
//
//   UPLANT_ZUEGE=20 node tests/werkzeug-streuung.js /mathematik/klasse-8/geometrie/zusammengesetzte-figuren.html
//
// (20, weil hier mit `runden: 20` geprüft wird; die Schranke hängt an der Rundenzahl).
// Gemessen am 2026-11-14, verschiedene Fassungen in 200 Würfen und sichere Schranke je Aufgabe:
//
//   A1  51 → 10   A2  36 →  9   A3  93 → 13   A4   55 → 11   A5  129 → 14   A6  101 → 13
//   A7  37 →  9   A8  46 → 10   A9  35 →  9   A10 114 → 14   A11  71 → 12   A12 108 → 14
//
// Eingetragen ist jeweils eine weniger: Eine zu hohe Schranke macht den Gesamtlauf launisch, und
// geprüft wird ja, ob ein Generator überhaupt streut, nicht wie gut.
const SCHRANKE = [9, 8, 12, 10, 13, 12, 8, 9, 8, 13, 11, 13];
const RUNDEN = 20;

async function aufgaben(page) {
  // ---- einfach ----
  await pruefeAufgabe(page, bericht, {
    nr: 1, name: "A1 Rechteck mit Halbkreis", runden: RUNDEN, mindestensVerschieden: SCHRANKE[0], liesRoh: figur,
    deute: (frage, roh) => {
      if (!roh || roh.art !== "rechteck-halbkreis" || !/Flächeninhalt/.test(frage)) return null;
      const b = mass(roh, "b"), h = mass(roh, "h");
      if (!(b > 0 && h > 0)) return null;
      // Wo der Halbkreis sitzt, sagt die Zeichnung: Sie ist breiter als b (rechts) oder höher als h (oben).
      const k = kasten(roh.punkte), skala = roh.masse.b.laenge / b;
      const rechts = (k.maxX - k.minX) / skala > b + 0.2;
      const d = rechts ? h : b, r = d / 2;
      const soll = b * h + (P * r * r) / 2;
      zeichnungPasst("A1", roh, soll, rechts ? 2 * b + h + P * r : 2 * h + b + P * r, frage);
      return gerundet("A1", soll, [
        [b * h + P * r * r, "ganzen Kreis addiert"], [b * h + (P * d * d) / 2, "als Radius gerechnet"], [b * h, "nur das Rechteck"],
        [b * h + P * r, "Länge des Halbkreisbogens"], [mit314(soll, b * h + (3.14 * r * r) / 2), "π ≈ 3,14"],
      ]);
    },
  });

  await pruefeAufgabe(page, bericht, {
    nr: 2, name: "A2 zwei Halbkreise, Umfang", runden: RUNDEN, mindestensVerschieden: SCHRANKE[1], liesRoh: figur,
    deute: (frage, roh) => {
      if (!roh || roh.art !== "stadion" || !/Umfang/.test(frage)) return null;
      const l = mass(roh, "l"), d = mass(roh, "d");
      if (!(l > 0 && d > 0)) return null;
      const soll = 2 * l + P * d;
      zeichnungPasst("A2", roh, l * d + (P * d * d) / 4, soll, frage);
      return gerundet("A2", soll, [
        [soll + 2 * d, "Schnittkanten mitgezählt"], [2 * (l + d), "Umfang des Rechtecks allein"], [2 * l + 2 * P * d, "wie einen Radius"],
        [2 * l + (P * d) / 2, "ZWEI Halbkreisbögen"], [l * d + (P * d * d) / 4, "Flächeninhalt der Figur"], [mit314(soll, 2 * l + 3.14 * d), "π ≈ 3,14"],
      ]);
    },
  });

  await pruefeAufgabe(page, bericht, {
    nr: 3, name: "A3 ausgeschnittene Ecke", runden: RUNDEN, mindestensVerschieden: SCHRANKE[2], liesRoh: figur,
    deute: (frage, roh) => {
      if (!roh || roh.art !== "rechteck-viertelausschnitt" || !/Flächeninhalt/.test(frage)) return null;
      const a = mass(roh, "a"), b = mass(roh, "b"), r = mass(roh, "r");
      if (!(a > r && b > r && r > 0)) return null;
      const soll = a * b - (P * r * r) / 4;
      zeichnungPasst("A3", roh, soll, 2 * (a + b) - 2 * r + (P * r) / 2, frage);
      return gerundet("A3", soll, [
        [a * b + (P * r * r) / 4, "Viertelkreis addiert"], [a * b - P * r * r, "ganzen Kreis abgezogen"], [a * b - (P * r * r) / 2, "Halbkreis abgezogen"],
        [a * b, "volle Rechteck"], [(P * r * r) / 4, "nur das ausgeschnittene Stück"], [mit314(soll, a * b - (3.14 * r * r) / 4), "π ≈ 3,14"],
      ]);
    },
  });

  // ---- mittel ----
  await pruefeAufgabe(page, bericht, {
    nr: 4, name: "A4 Rechteck mit Dreieck", runden: RUNDEN, mindestensVerschieden: SCHRANKE[3], liesRoh: figur,
    deute: (frage, roh) => {
      if (!roh || roh.art !== "haus") return null;
      const b = mass(roh, "b"), h = mass(roh, "h"), k = mass(roh, "k"), s = mass(roh, "s");
      if (!(b > 0 && h > 0 && k > 0 && s > 0)) return null;
      // Die schräge Seite ist „gemessen“ — und muss trotzdem stimmen.
      pruefe(/gemessen/.test(frage), `A4: die schräge Seite ist nicht als gemessen gekennzeichnet — „${frage}“`);
      pruefe(Math.abs((b / 2) ** 2 + k * k - s * s) < 1e-9, `A4: b = ${b}, k = ${k}, s = ${s} ergeben kein Dreieck — „${frage}“`);
      const A = b * h + (b * k) / 2, U = b + 2 * h + 2 * s;
      zeichnungPasst("A4", roh, A, U, frage);
      return Object.assign(felder("A4", [A, U], [
        [0, b * h + b * k, "fehlt das Halbieren"], [0, b * h + (b * s) / 2, "nicht senkrecht"], [0, b * h, "nur das Rechteck"], [0, (b * (h + k)) / 2, "ganze Figur halbiert"],
        [1, U + 2 * b, "Summe der Umfänge"], [1, U + b, "Schnittkante mitgezählt"], [1, b + 2 * h + 2 * k, "Höhe des Dreiecks"], [1, 2 * h + 2 * s, "untere Seite b"],
      ]), { toleranz: 0.008 });
    },
  });

  await pruefeAufgabe(page, bericht, {
    nr: 5, name: "A5 zwei Kreisausschnitte", runden: RUNDEN, mindestensVerschieden: SCHRANKE[4], liesRoh: figur,
    deute: (frage, roh) => {
      if (!roh || roh.art !== "zwei-ausschnitte") return null;
      const r = mass(roh, "r"), alpha = mass(roh, "alpha"), beta = mass(roh, "beta");
      if (!(r > 0 && alpha > 0 && beta > 0 && alpha + beta < 180)) return null;
      const k = (alpha + beta) / 360;
      const A = k * P * r * r, bog = k * 2 * P * r, U = bog + 4 * r;
      zeichnungPasst("A5", roh, A, U, frage);
      return felder("A5", [A, U], [
        [0, bog, "Länge der beiden Bögen"], [0, ((180 - alpha - beta) / 360) * P * r * r, "Lücke zwischen"], [0, (P * r * r) / 2, "ganze Halbkreis"],
        [0, k * P * r, "Quadrieren vergessen"], [0, mit314(A, k * 3.14 * r * r), "π ≈ 3,14"],
        [1, bog, "nur die beiden Bögen"], [1, bog + 2 * r, "ZWEI Radien"], [1, P * r + 2 * r, "Rand des ganzen Halbkreises"], [1, mit314(U, k * 2 * 3.14 * r + 4 * r), "π ≈ 3,14"],
      ]);
    },
  });

  await pruefeAufgabe(page, bericht, {
    nr: 6, name: "A6 zwei ausgeschnittene Ecken", runden: RUNDEN, mindestensVerschieden: SCHRANKE[5], liesRoh: figur,
    deute: (frage, roh) => {
      if (!roh || roh.art !== "zwei-viertelausschnitte") return null;
      const a = mass(roh, "a"), h = mass(roh, "h"), r = mass(roh, "r");
      if (!(a > 2 * r && h > r && r > 0)) return null;
      const A = a * h - (P * r * r) / 2, U = 2 * a + 2 * h - 4 * r + P * r;
      zeichnungPasst("A6", roh, A, U, frage);
      // Hier wird auch der Umfang kleiner — und die Musterlösung sagt das.
      pruefe(U < 2 * (a + h), "A6: der Umfang wäre größer als der des Rechtecks");
      return Object.assign(felder("A6", [A, U], [
        [0, a * h + (P * r * r) / 2, "Viertelkreise addiert"], [0, a * h - (P * r * r) / 4, "ZWEI Viertelkreise"], [0, a * h - P * r * r, "kein ganzer Kreis"],
        [0, a * h, "volle Rechteck"], [0, mit314(A, a * h - (3.14 * r * r) / 2), "π ≈ 3,14"],
        [1, 2 * (a + h), "Umfang des vollen Rechtecks"], [1, 2 * a + 2 * h - 4 * r, "fehlen die beiden Viertelbögen"], [1, 2 * a + 2 * h - 4 * r - P * r, "kommen dazu"],
        [1, 2 * a + 2 * h + P * r, "zusammen 4 · r"], [1, mit314(U, 2 * a + 2 * h - 4 * r + 3.14 * r), "π ≈ 3,14"],
      ]), { pruefe: (f, rueck) => pruefe(/auch der Umfang kleiner/.test(rueck) && rueck.includes(de2(A)) && rueck.includes(de2(U)), `A6: die Musterlösung nennt die Ergebnisse oder den Vergleich nicht — „${f}“`) });
    },
  });

  // ---- schwierig ----
  await pruefeAufgabe(page, bericht, {
    nr: 7, name: "A7 Trapez mit Halbkreis", runden: RUNDEN, mindestensVerschieden: SCHRANKE[6], liesRoh: figur,
    deute: (frage, roh) => {
      if (!roh || roh.art !== "trapez-halbkreis") return null;
      const a = mass(roh, "a"), c = mass(roh, "c"), h = mass(roh, "h"), s = mass(roh, "s");
      if (!(a > c && c > 0 && h > 0 && s > 0)) return null;
      pruefe(/gemessen/.test(frage), `A7: die schräge Seite ist nicht als gemessen gekennzeichnet — „${frage}“`);
      pruefe(Math.abs((a - c) ** 2 + h * h - s * s) < 1e-9, `A7: a = ${a}, c = ${c}, h = ${h}, s = ${s} ergeben kein Trapez — „${frage}“`);
      const R = h / 2, T = ((a + c) * h) / 2;
      const A = T + (P * R * R) / 2, U = a + c + s + P * R;
      zeichnungPasst("A7", roh, A, U, frage);
      return felder("A7", [A, U], [
        [0, (a + c) * h + (P * R * R) / 2, "Trapez fehlt das Halbieren"], [0, T + P * R * R, "ganzen Kreis addiert"], [0, T + (P * h * h) / 2, "h ist der Durchmesser"],
        [0, ((a + c) * s) / 2 + (P * R * R) / 2, "nicht senkrecht"], [0, T, "nur das Trapez"], [0, mit314(A, T + (3.14 * R * R) / 2), "π ≈ 3,14"],
        [1, U + h, "Schnittkante mitgezählt"], [1, a + c + s + 2 * P * R, "nur ein Halbkreisbogen"], [1, a + c + h + P * R, "nicht die Höhe h"],
        [1, a + c + s, "Halbkreisbogen fehlt"], [1, mit314(U, a + c + s + 3.14 * R), "π ≈ 3,14"],
      ]);
    },
  });

  await pruefeAufgabe(page, bericht, {
    nr: 8, name: "A8 Laufbahn rückwärts", runden: RUNDEN, mindestensVerschieden: SCHRANKE[7], liesRoh: figur,
    deute: (frage, roh) => {
      const m = frage.match(/U = ([\d.,]+) m lang/);
      if (!m || !roh || roh.art !== "laufbahn") return null;
      const U = zahl(m[1]), d = mass(roh, "d");
      if (!(U > 0 && d > 0)) return null;
      pruefe(roh.masse.l && roh.masse.l.text === "l = ?", `A8: die gesuchte Gerade ist in der Zeichnung nicht als „l = ?“ beschriftet`);
      const soll = (U - P * d) / 2;
      pruefe(soll > d, `A8: die Gerade wäre mit ${soll.toFixed(1)} m kürzer als die Bahn breit ist — „${frage}“`);
      // Die Zeichnung zeigt die Bahn, um die es geht: Ihr Rand ist U lang.
      zeichnungPasst("A8", roh, soll * d + (P * d * d) / 4, U, frage);
      return Object.assign(gerundet("A8", soll, [
        [U - P * d, "BEIDER Geraden"], [(U - 2 * P * d) / 2, "wie einen Radius"], [(U - (P * d) / 2) / 2, "ZWEI Halbkreisbögen"],
        [U / 2 - d, "Strecke d abgezogen"], [mit314(soll, (U - 3.14 * d) / 2), "π ≈ 3,14"],
      ]), { pruefe: (f, rueck) => pruefe(rueck.includes(de2(soll)) && /Probe/.test(rueck) && /✓/.test(rueck.split("Probe")[1] || ""), `A8: Ergebnis oder Probe fehlen in der Musterlösung — „${f}“`) });
    },
  });

  await pruefeAufgabe(page, bericht, {
    nr: 9, name: "A9 fünf Ausschnitte", runden: RUNDEN, mindestensVerschieden: SCHRANKE[8], liesRoh: figur,
    deute: (frage, roh) => {
      if (!roh || roh.art !== "fuenf-ausschnitte") return null;
      const a = mass(roh, "a"), h = mass(roh, "h"), r = mass(roh, "r");
      if (!(a > 0 && h > r && r > 0)) return null;
      // Nur drei Maße stehen da; die beiden anderen Radien folgen aus ihnen.
      pruefe(Object.keys(roh.masse).length === 3, `A9: an der Zeichnung stehen ${Object.keys(roh.masse).join(", ")} statt nur a, h und r`);
      const q = h - r, p = a / 2 - q;
      if (!(q > 0 && p > 0)) return null;
      const A = a * h - (P * (r * r + q * q + p * p)) / 2, U = a - 2 * r + P * (r + q + p);
      zeichnungPasst("A9", roh, A, U, frage);
      return felder("A9", [A, U], [
        [0, a * h - (P * (r * r + q * q)) / 2, "noch nicht abgezogen"], [0, a * h - (P * (r * r + q * q)) / 4 - (P * p * p) / 2, "ZWEI"],
        [0, a * h - P * (r * r + q * q) - (P * p * p) / 2, "kein ganzer Kreis"], [0, a * h - P * r * r - (P * p * p) / 2, "kleiner als die unteren"],
        [0, a * h, "volle Rechteck"], [0, mit314(A, a * h - (3.14 * (r * r + q * q + p * p)) / 2), "π ≈ 3,14"],
        [1, P * (r + q + p), "gerade Strecke stehen"], [1, a + P * (r + q + p), "nicht mehr die ganze Seite"], [1, 2 * (a + h), "Umfang des vollen Rechtecks"],
        [1, a - 2 * r + P * (r + q), "Bogen des Halbkreises"], [1, mit314(U, a - 2 * r + 3.14 * (r + q + p)), "π ≈ 3,14"],
      ]);
    },
  });

  // ---- komplex ----
  await pruefeAufgabe(page, bericht, {
    nr: 10, name: "A10 Spielplatz", runden: RUNDEN, mindestensVerschieden: SCHRANKE[9], liesRoh: figur,
    deute: (frage, roh) => {
      const m = frage.match(/für ([\d,]+) € je m² .* für ([\d,]+) € je m\b/);
      if (!m || !roh || roh.art !== "spielplatz") return null;
      const pA = zahl(m[1]), pU = zahl(m[2]);
      const l = mass(roh, "l"), b = mass(roh, "b");
      if (!(l > 0 && b > 0 && pA > 0 && pU > 0)) return null;
      const r = b / 2;
      const A = l * b + (P * r * r) / 2, U = 2 * l + b + P * r, K = A * pA + U * pU;
      zeichnungPasst("A10", roh, A, U, frage);
      return felder("A10", [A, U, K], [
        [0, l * b + P * r * r, "ganzen Kreis addiert"], [0, l * b + (P * b * b) / 2, "b ist der Durchmesser"], [0, l * b, "nur das Rechteck"],
        [1, U + b, "Schnittkante mitgezählt"], [1, 2 * l + b + 2 * P * r, "nur ein Halbkreisbogen"], [1, 2 * (l + b), "Umfang des Rechtecks"], [1, 2 * l + P * r, "linke Schmalseite"],
        [2, A * pU + U * pA, "Preise vertauscht"], [2, A * pA, "nur der Belag"], [2, U * pU, "nur die Einfassung"], [2, (A + U) * (pA + pU), "nicht addieren"],
      ], [2, 2, 0]);
    },
  });

  await pruefeAufgabe(page, bericht, {
    nr: 11, name: "A11 Blech", runden: RUNDEN, mindestensVerschieden: SCHRANKE[10], liesRoh: figur,
    deute: (frage, roh) => {
      const m = frage.match(/wiegt ([\d,]+) g/);
      if (!m || !roh || roh.art !== "blech") return null;
      const dichte = zahl(m[1]);
      const b = mass(roh, "b"), h = mass(roh, "h"), e = mass(roh, "e");
      if (!(b > 2 * e && h > 0 && e > 0 && dichte > 0)) return null;
      const R = h / 2, r = b / 2 - e;
      const A = b * h + (P * R * R) / 2 - (P * r * r) / 2, U = b + h + 2 * e + P * R + P * r, masse = A * dichte;
      zeichnungPasst("A11", roh, A, U, frage);
      return felder("A11", [A, U, masse], [
        [0, b * h + (P * R * R) / 2 + (P * r * r) / 2, "Aussparung addiert"], [0, b * h + (P * R * R) / 2, "ohne Aussparung"],
        [0, b * h + (P * R * R) / 2 - (P * e * e) / 2, "nicht ihr Radius"], [0, b * h - (P * r * r) / 2, "Halbkreis an der rechten Seite"],
        [1, b + h + 2 * e + P * R - P * r, "nichts abgezogen"], [1, 2 * b + h + P * R, "ohne Aussparung"], [1, U + h, "liegt innen"], [1, b + h + 2 * e + P * R, "Bogen der Aussparung fehlt"],
        [2, A / dichte, "geteilt"], [2, U * dichte, "nicht von der Länge"],
      ]);
    },
  });

  await pruefeAufgabe(page, bericht, {
    nr: 12, name: "A12 Bühne", runden: RUNDEN, mindestensVerschieden: SCHRANKE[11], liesRoh: figur,
    deute: (frage, roh) => {
      const m = frage.match(/reicht für ([\d,]+) m²/);
      if (!m || !roh || roh.art !== "buehne") return null;
      const dose = zahl(m[1]);
      const b = mass(roh, "b"), c = mass(roh, "c"), h = mass(roh, "h"), s = mass(roh, "s"), alpha = mass(roh, "alpha");
      if (!(b > 0 && c > 0 && h > 0 && s > 0 && alpha > 0 && dose > 0)) return null;
      pruefe(/gemessen/.test(frage), `A12: die schräge Seite ist nicht als gemessen gekennzeichnet — „${frage}“`);
      pruefe(Math.abs(c * c + h * h - s * s) < 1e-9, `A12: c = ${c}, h = ${h}, s = ${s} ergeben kein rechtwinkliges Dreieck — „${frage}“`);
      const k = alpha / 360, sektor = k * P * s * s, bog = k * 2 * P * s;
      const A = b * h + c * h + 2 * sektor, U = 2 * (b + c) + 2 * s + 2 * bog;
      const dosen = Math.ceil(A / dose);
      // Die Dosenzahl darf nicht an der Rundung hängen.
      const rest = A / dose - Math.floor(A / dose);
      pruefe(rest > 0.05 && rest < 0.95, `A12: ${A.toFixed(3)} m² liegt zu knapp an einem Vielfachen von ${dose} m² — „${frage}“`);
      zeichnungPasst("A12", roh, A, U, frage);
      return felder("A12", [A, dosen, U], [
        [0, b * h + c * h + sektor, "ZWEI Kreisausschnitte"], [0, b * h + 2 * c * h + 2 * sektor, "fehlt das Halbieren"], [0, b * h + (c * h) / 2 + 2 * sektor, "ZWEI Dreiecke"],
        [0, b * h + c * h, "Kreisausschnitte fehlen"], [0, b * h + c * h + 2 * k * P * h * h, "nicht die Höhe h"],
        [1, dosen - 1, "Abgerundet reicht"],
        [2, U + 2 * h + 2 * s, "Schnittkanten mitgezählt"], [2, 2 * (b + c) + 2 * bog, "freien Radius"], [2, 2 * (b + c) + 2 * s + bog, "ZWEI Bögen"], [2, 2 * b + 2 * s + 2 * bog, "jeweils b + c"],
      ], [2, 0, 2]);
    },
  });
}

// ── Gerüst ────────────────────────────────────────────────────────────────

async function geruest(page) {
  const folge = await page.evaluate(() => [...document.querySelectorAll("main section[id]")].map((s) => s.id));
  const soll = ["sec-zerlegen", "sec-umfang", "sec-teile", "sec-abziehen", "sec-vernetzung", "sec-formelsammlung", "sec-uebungen", "sec-selbsteinschaetzung"];
  pruefe(JSON.stringify(folge) === JSON.stringify(soll), `Gerüst: Abschnitte ${folge.join(", ")} statt ${soll.join(", ")}`);

  // Kein Vorgriff. Abschnitt 1 handelt nur vom Flächeninhalt; der Umfang und die Schnittkanten
  // kommen erst in Abschnitt 2. Abgezogen wird erst in Abschnitt 4.
  const textVon = (id) => page.evaluate((i) => {
    const e = document.getElementById(i).cloneNode(true);
    // Der Sprung zu den Übungsaufgaben nennt keinen Stoff.
    e.querySelectorAll(".uebung-sprung").forEach((x) => x.remove());
    return e.innerText;
  }, id);
  const t1 = await textVon("sec-zerlegen");
  pruefe(!/Umfang|Schnittkante|Rand abschreiten/.test(t1), "Gerüst: Abschnitt 1 greift auf den Umfang vor");
  for (const id of ["sec-zerlegen", "sec-umfang", "sec-teile"]) {
    const t = await textVon(id);
    pruefe(!/abzieh|abgezogen|ausgeschnitten|Aussparung|ergänz/i.test(t), `Gerüst: ${id} greift auf das Abziehen vor`);
    pruefe(!/−/.test(t), `Gerüst: in ${id} steht ein Minuszeichen — abgezogen wird erst in Abschnitt 4`);
  }
  const t4 = await textVon("sec-abziehen");
  pruefe(/Flächeninhalt kleiner/.test(t4) && /größer/.test(t4) && /π · r/.test(t4) && /2 · r/.test(t4), "Gerüst: Abschnitt 4 erklärt nicht, warum der Umfang wächst (Bogen π · r statt Strecke 2 · r)");
  const reihenfolge = await page.evaluate(() => [...document.querySelectorAll("main .th-wrap")].map((e) => e.id));
  pruefe(JSON.stringify(reihenfolge) === JSON.stringify(["z1-mount", "u1-mount", "t2-mount", "a3-mount"]), `Gerüst: die Zeichnungen stehen in der Reihenfolge ${reihenfolge.join(", ")}`);
  // Jede Zeichnung ist beim Laden da — ohne dass ein Regler angefasst wurde.
  for (const id of reihenfolge) {
    pruefe(await page.evaluate((i) => document.querySelectorAll(`#${i} svg [data-rolle="teil"]`).length === 3, id), `Gerüst: ${id} ist beim Laden leer`);
  }

  // Der Satz des Pythagoras kommt erst in Klasse 9 — außer als ausdrücklicher Ausblick. Und wo eine
  // schräge Seite als Zahl dasteht, steht „gemessen“ dabei.
  const haupt = await page.evaluate(() => document.querySelector("main").innerText);
  pruefe(!/√/.test(haupt), "Gerüst: es kommt ein Wurzelzeichen vor — Wurzeln gibt es erst in Klasse 9");
  for (const m of haupt.matchAll(/.{0,90}(Quadratwurzel|Pythagoras).{0,90}/g)) {
    pruefe(/Klasse 9|noch nicht|gemessen/.test(m[0]), `Gerüst: „${m[1]}“ wird erwähnt, ohne als Klasse-9-Stoff ausgewiesen zu sein — „${m[0].trim()}“`);
  }
  pruefe(/gemessen/.test(await textVon("sec-teile")), "Gerüst: Abschnitt 3 nennt die schräge Seite nicht „gemessen“");

  // Formelsammlung als PDF: Verweis, Datei, zwei Seiten A4 quer, und die Formeln in der Quelle.
  const verweis = await page.evaluate(() => {
    const a = document.querySelector("#sec-formelsammlung a[download]");
    return a ? a.getAttribute("href") : null;
  });
  pruefe(verweis === "zusammengesetzte-figuren.pdf", `Formelsammlung: der Download-Verweis fehlt oder zeigt auf „${verweis}“`);
  const pdf = path.join(WURZEL, "mathematik/klasse-8/geometrie/zusammengesetzte-figuren.pdf");
  pruefe(fs.existsSync(pdf), "Formelsammlung: zusammengesetzte-figuren.pdf fehlt");
  if (fs.existsSync(pdf)) {
    const roh = fs.readFileSync(pdf);
    pruefe(roh.subarray(0, 5).toString("latin1") === "%PDF-", "Formelsammlung: die Datei ist kein PDF");
    pruefe(roh.length > 20000, `Formelsammlung: das PDF ist nur ${roh.length} Bytes groß`);
    const seiten = (roh.toString("latin1").match(/\/Type\s*\/Page(?!s)/g) || []).length;
    pruefe(seiten === 2, `Formelsammlung: das PDF hat ${seiten} Seiten statt 2`);
    const box = roh.toString("latin1").match(/\/MediaBox\s*\[\s*0 0 ([\d.]+) ([\d.]+)/);
    pruefe(!!box && Number(box[1]) > Number(box[2]), "Formelsammlung: das PDF ist nicht im Querformat");
  }
  const quellDatei = path.join(WURZEL, "tools/formelsammlung/formelsammlung-zf-quelle.html");
  pruefe(fs.existsSync(quellDatei), "Formelsammlung: die Quelle formelsammlung-zf-quelle.html fehlt");
  if (fs.existsSync(quellDatei)) {
    const quelle = fs.readFileSync(quellDatei, "utf8").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ")
      .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ");
    for (const f of ["A = a · b", "A = ½ · g · h", "A = ½ · (a + c) · h", "A = π · r²", "U = 2 · π · r", "A = ½ · π · r²", "A = ¼ · π · r²",
      "A = α : 360° · π · r²", "b = α : 360° · 2 · π · r", "A = A₁ + A₂ + A₃", "A = Avoll − AAusschnitt", "U = Summe aller Randstücke", "gemessen"]) {
      pruefe(quelle.includes(f), `Formelsammlung: „${f}“ fehlt in der Quelle des PDFs`);
    }
  }

  // Alle Verweise führen irgendwohin — samt Sprungmarke.
  const links = await page.evaluate(() =>
    [...document.querySelectorAll("main a[href]")].map((a) => a.getAttribute("href")).filter((h) => !h.startsWith("#") && !h.startsWith("http")));
  for (const href of new Set(links)) {
    const ziel = new URL(href.split("#")[0], "http://localhost/mathematik/klasse-8/geometrie/").pathname;
    const antwort = await page.request.get("http://localhost:" + (process.env.UPLANT_PORT || "8936") + ziel);
    pruefe(antwort.ok(), `Gerüst: der Verweis „${href}“ führt ins Leere (${antwort.status()})`);
    const anker = href.split("#")[1];
    if (anker && antwort.ok() && /\.html$/.test(ziel)) pruefe((await antwort.text()).includes(`id="${anker}"`), `Gerüst: die Sprungmarke „${anker}“ fehlt in ${ziel}`);
  }

  // Die Menükarte: auf der Übersichtsseite, mit Bereich und versteckt bis zur Freischaltung, nach
  // dem Kreis. Und der Kreis führt in seiner Vernetzung hierher.
  const menue = fs.readFileSync(path.join(WURZEL, "mathematik/klasse-8/geometrie/index.html"), "utf8");
  const karte = menue.match(/<a class="menu-card"[^>]*href="zusammengesetzte-figuren\.html"[^>]*>\s*<h2>([^<]*)<\/h2>/);
  pruefe(!!karte && /data-section="klasse-8"/.test(karte[0]) && /\shidden\b/.test(karte[0]) && karte[1] === "6. Zusammengesetzte Figuren", `Gerüst: die Menükarte fehlt oder ist unvollständig — ${karte && karte[0]}`);
  pruefe(menue.indexOf('href="kreis.html"') < menue.indexOf('href="zusammengesetzte-figuren.html"'), "Gerüst: die Menükarte steht nicht nach dem Kreis");
  const kreis = fs.readFileSync(path.join(WURZEL, "mathematik/klasse-8/geometrie/kreis.html"), "utf8");
  pruefe(/Führt weiter zu:<\/strong>[^<]*<a href="zusammengesetzte-figuren\.html"/.test(kreis), "Gerüst: der Kreis führt in seiner Vernetzung nicht zu den zusammengesetzten Figuren");

  // Zwölf Aufgaben, drei je Stufe; jeder der vier Abschnitte hat Aufgaben und einen Sprung dorthin.
  const proStufe = await page.evaluate(async () => {
    const out = [];
    for (const t of document.querySelectorAll("#exercises-mount .schwierigkeit-tabs button")) {
      t.click();
      out.push(document.querySelectorAll("#exercises-mount .schwierigkeit-tab-panel .aufgabe-box").length);
    }
    return out;
  });
  pruefe(proStufe.length === 4 && proStufe.every((n) => n === 3), `Gerüst: die Stufen haben ${proStufe.join("/")} Aufgaben statt 3/3/3/3`);
  for (const id of ["sec-zerlegen", "sec-umfang", "sec-teile", "sec-abziehen"]) {
    pruefe(await page.evaluate((i) => !!document.querySelector(`#${i} > .uebung-sprung a`), id), `Gerüst: ${id} hat keinen Sprung zu seinen Übungsaufgaben`);
  }
}

// ── Auf dem Telefon ───────────────────────────────────────────────────────
//
// Das Bild ist dort schmaler dargestellt, als seine viewBox breit ist. Nichts ragt seitlich aus der
// Seite, und ein Teil folgt dem Finger trotzdem genau.
async function telefon(browser) {
  const page = await neueSeite(browser, { breite: 375, hoehe: 800 });
  await oeffne(page, SEITE);
  const zuBreit = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  pruefe(zuBreit <= 1, `Telefon: die Seite ist ${zuBreit} px breiter als der Schirm`);
  const faktor = await page.evaluate(() => { const s = document.querySelector("#z1-mount svg"); return s.getBoundingClientRect().width / s.viewBox.baseVal.width; });
  pruefe(faktor < 0.7, `Telefon: die Zeichnung ist nicht verkleinert (Faktor ${faktor.toFixed(2)}) — die Prüfung träfe den Fall nicht, für den sie da ist`);
  await ziehen(page, "z1", "Telefon, Beispiel 1", KLEINSTE.z1);
  for (const s of page.stoerungen) pruefe(false, `Telefon: ${s}`);
  await page.close();
}

(async () => {
  const browser = await starteBrowser();
  for (const dunkel of [false, true]) {
    const wo = dunkel ? "dunkel" : "hell";
    const page = await neueSeite(browser, { dunkel });
    await oeffne(page, SEITE);
    if (!dunkel) {
      if (will("geruest")) await geruest(page);
      if (will("zerlegen")) await zerlegen(page);
      if (will("umfang")) await umfang(page);
      if (will("teile")) await teile(page);
      if (will("abziehen")) await abziehen(page);
      if (will("ziehen")) for (const k of ["z1", "u1", "t2", "a3"]) await ziehen(page, k, `Verschieben (${k})`, KLEINSTE[k]);
      if (will("quizze")) await quizze(page);
      if (will("aufgaben")) await aufgaben(page);
    } else if (will("dunkel")) {
      // Damit auch die Farben der Rechnung und der auseinandergezogenen Teile geprüft werden: je
      // einen Schritt lösen, einen Tipp und einen Fehlerhinweis zeigen, die Teile auseinanderziehen.
      await page.locator("#z1-rechnung .zf-schritt.aktiv input").fill(deutsch(rund2(P * 4)));
      await klick(page, "#z1-rechnung .zf-schritt.aktiv .zf-pruefen");
      await klick(page, "#u1-rechnung .zf-schritt.aktiv .zf-tipp");
      await page.locator("#t2-rechnung .zf-schritt.aktiv input").fill("1");
      await klick(page, "#t2-rechnung .zf-schritt.aktiv .zf-pruefen");
      for (const k of ["z1", "u1", "t2", "a3"]) await setzeRegler(page, `${k}-t`, 100);
      await setzeRegler(page, "u1-s", 60);
      await pruefeKontrast(page, bericht, "dunkel");
      // Die Rückmeldungen der Rechnung stehen in Elementen, die der Kontrastmesser nicht kennt.
      const farben = await page.evaluate(() => [...document.querySelectorAll(".zf-rueck.err, .zf-rueck.tipp, .zf-weg, .zf-haken, .zf-gruppe, .zf-schritt-name")].map((e) => ({
        text: e.textContent.trim().slice(0, 30), farbe: getComputedStyle(e).color,
        grund: (() => { let x = e; while (x) { const f = getComputedStyle(x).backgroundColor; if (f && !/rgba\(0, 0, 0, 0\)|transparent/.test(f)) return f; x = x.parentElement; } return "rgb(255, 255, 255)"; })(),
      })));
      const hell = (f) => { const [r, g, b] = f.match(/[\d.]+/g).slice(0, 3).map((v) => { const c = v / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
      pruefe(farben.length >= 6, `dunkel: nur ${farben.length} Texte der Rechnung gefunden`);
      for (const f of farben) pruefe(Math.abs(hell(f.farbe) - hell(f.grund)) * 255 > 45, `dunkel: „${f.text}“ in der Rechnung hat zu wenig Abstand zum Untergrund`);
    }
    await pruefeNotation(page, bericht, wo);
    for (const s of page.stoerungen) pruefe(false, `${wo}: ${s}`);
    await page.close();
  }
  if (will("telefon")) await telefon(browser);
  await browser.close();
  bericht.abschluss();
})();
