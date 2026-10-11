// Fachliche Prüfung: MSS 11, Analysis, Thema 4.2 „Integration weiterer Funktionen“ (Leistungskurs,
// die Abschnitte zur e-Funktion auch Grundkurs).
//
// Geprüft wird, was die Seite zeigt, gegen eine unabhängige Rechnung. Integrale bestimmt die Prüfung
// NICHT mit den Stammfunktionen der Seite, sondern numerisch (Simpson-Regel, Nullstellen über
// Vorzeichenwechsel und Bisektion); gezeichnete Stammfunktionen werden numerisch abgeleitet.
//
//   * Gerüst: Abschnittsfolge, Nummern und Kurs-Marken, kein Vorgriff eines Grundkurs-Abschnitts auf
//     Leistungskurs-Stoff (hier oder in Thema 2.2), „(LK)“ in Auswahl und Aufgabentiteln, ein Kasten
//     „Anders als bei ganzrationalen Funktionen“ in jedem Abschnitt, die Rechenweg-Übersicht,
//     Verweise und Sprungmarken, Menükarte, Formelsammlung, Verweise der Nachbarthemen hierher;
//   * jede Zeichnung wird aus dem SVG zurückgelesen (Maßstab aus den Gitterlinien mit data-wert):
//     Flächen mit der Gaußschen Trapezformel, Stammfunktionen über die Steigung des gezeichneten
//     Pfades, Tangenten, Zuwachs, Asymptote, Scheiben;
//   * die Bilanzen werden gegen die unabhängige Rechnung gelesen;
//   * Kontrollfragen, Selbsteinschätzung und alle vierundzwanzig Aufgaben — jede von beiden Seiten.

"use strict";

const { neuerBericht } = require("../lib/pruefen");
const { starteBrowser, neueSeite, oeffne, setzeRegler, text } = require("../lib/seite");
const { pruefeNotation } = require("../lib/notation");
const { pruefeKontrast } = require("../lib/kontrast");
const { pruefeAufgabe, zahl, zahlen } = require("../lib/aufgaben");
const { liesTermAufgabe, termDeuter, pruefeTermleser } = require("../lib/terme");
const fs = require("fs");
const path = require("path");

const bericht = neuerBericht();
const { pruefe } = bericht;
const SEITE = "/mathematik/mss11/01-analysis/05b-weitere-funktionen-integrieren/index.html";
const WURZEL = path.resolve(__dirname, "..", "..");
const nahe = (a, b, tol = 1e-6) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= tol;

// ---------- Numerik ----------
const abl = (f, x, h = 1e-5) => (f(x + h) - f(x - h)) / (2 * h);
// Simpson-Regel; für Polynome bis Grad 3 exakt, sonst sehr genau.
function integral(f, a, b, n = 2000) {
  if (a === b) return 0;
  const h = (b - a) / n;
  let s = f(a) + f(b);
  for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(a + i * h);
  return (s * h) / 3;
}
// Einfache Nullstellen von g auf [lo, hi] (Vorzeichenwechsel, dann Bisektion).
function vzw(g, lo, hi, n = 3000) {
  const h = (hi - lo) / n, aus = [];
  for (let i = 0; i < n; i++) {
    let a = lo + i * h, b = lo + (i + 1) * h;
    const ga = g(a), gb = g(b);
    if (ga === 0) { if (!aus.some((z) => Math.abs(z - a) < 1e-6)) aus.push(a); continue; }
    if (Math.sign(ga) * Math.sign(gb) < 0) {
      for (let k = 0; k < 60; k++) { const m = (a + b) / 2; if (Math.sign(g(m)) === Math.sign(g(a))) a = m; else b = m; }
      aus.push((a + b) / 2);
    }
  }
  return aus;
}
// Flächeninhalt zwischen f und der x-Achse: an den Nullstellen teilen, Beträge addieren.
function flaecheBetrag(f, a, b) {
  const g = [a, ...vzw(f, a, b).filter((z) => z > a + 1e-9 && z < b - 1e-9), b];
  let A = 0;
  for (let i = 0; i + 1 < g.length; i++) A += Math.abs(integral(f, g[i], g[i + 1]));
  return A;
}
// Lösung von G(x) = ziel für steigendes G auf [lo, hi].
function loese(G, ziel, lo, hi) {
  for (let k = 0; k < 100; k++) { const m = (lo + hi) / 2; if (G(m) < ziel) lo = m; else hi = m; }
  return (lo + hi) / 2;
}

async function waehle(page, id, wert) {
  await page.selectOption("#" + id, wert);
}
async function spanWert(page, sel) {
  return zahl(await page.evaluate((s) => (document.querySelector(s) || {}).textContent || "", sel));
}
async function spanText(page, sel) {
  return page.evaluate((s) => (document.querySelector(s) || {}).innerText || "", sel);
}
// Eine Zeile einer Bilanz (getrennt durch <br>) als Klartext. innerText taugt dafür nicht: Die
// übereinandergesetzten Integralgrenzen erzeugen eigene Zeilenumbrüche.
async function bilanzZeile(page, sel, i) {
  return page.evaluate(([s, k]) => {
    const t = document.createElement("div");
    t.innerHTML = (document.querySelector(s).innerHTML.split(/<br\s*\/?>/)[k] || "");
    return t.textContent;
  }, [sel, i]);
}
// Die letzte Zahl eines Elements (etwa „16π/3 ≈ 16,7552“ → 16,7552).
async function letzteZahl(page, sel) {
  const z = zahlen(await spanText(page, sel));
  return z.length ? z[z.length - 1] : NaN;
}

// Liest eine Zeichnung und rechnet alle Koordinaten über die Gitterlinien in (x | y) um — der
// Maßstab kommt aus zwei beschrifteten Linien, nicht aus dem Code der Seite.
async function lies(page, sel) {
  return page.evaluate((s) => {
    const svg = document.querySelector(s);
    if (!svg) return null;
    const linien = (achse) => [...svg.querySelectorAll(`line[data-achse="${achse}"]`)].map((l) => ({ w: Number(l.dataset.wert), p: achse === "y" ? Number(l.getAttribute("y1")) : Number(l.getAttribute("x1")) }));
    const skala = (L) => { const a = L[0], b = L[L.length - 1]; const st = (b.p - a.p) / (b.w - a.w); return { wert: (p) => a.w + (p - a.p) / st, pro: Math.abs(st) }; };
    const SX = skala(linien("x")), SY = skala(linien("y"));
    const X = SX.wert, Y = SY.wert;
    const n = (e, a) => Number(e.getAttribute(a));
    const paare = (d) => (d.match(/-?[\d.]+ -?[\d.]+/g) || []).map((t) => t.split(" ").map(Number));
    const clip = svg.querySelector("clipPath rect");
    return {
      proX: SX.pro, proY: SY.pro,
      ymax: Y(n(clip, "y")), ymin: Y(n(clip, "y") + n(clip, "height")),
      pfade: [...svg.querySelectorAll("path[data-rolle]")].map((p) => ({ rolle: p.dataset.rolle, klasse: p.getAttribute("class") || "", punkte: paare(p.getAttribute("d")).map(([a, b]) => [X(a), Y(b)]) })),
      vielecke: [...svg.querySelectorAll("polygon[data-rolle]")].map((p) => ({ rolle: p.dataset.rolle, vz: p.dataset.vorzeichen, klasse: p.getAttribute("class") || "",
        punkte: p.getAttribute("points").trim().split(/\s+/).map((t) => t.split(",").map(Number)).map(([a, b]) => [X(a), Y(b)]) })),
      kreise: [...svg.querySelectorAll("circle")].map((c) => ({ x: X(n(c, "cx")), y: Y(n(c, "cy")), klasse: c.getAttribute("class") || "", daten: { ...c.dataset } })),
      linien: [...svg.querySelectorAll("line[data-rolle]")].map((l) => ({ rolle: l.dataset.rolle, x1: X(n(l, "x1")), y1: Y(n(l, "y1")), x2: X(n(l, "x2")), y2: Y(n(l, "y2")) })),
      rechtecke: [...svg.querySelectorAll("rect[data-rolle]")].map((r) => ({ rolle: r.dataset.rolle, k: r.dataset.k, x1: X(n(r, "x")), x2: X(n(r, "x") + n(r, "width")), y1: Y(n(r, "y") + n(r, "height")), y2: Y(n(r, "y")) })),
    };
  }, sel);
}
const linie = (d, rolle) => d.linien.find((l) => l.rolle === rolle);
const kreise = (d, rolle) => d.kreise.filter((k) => k.daten.rolle === rolle);
const kreis = (d, rolle) => kreise(d, rolle)[0];
const steigung = (l) => (l.y2 - l.y1) / (l.x2 - l.x1);
const aufGerade = (l, x) => l.y1 + steigung(l) * (x - l.x1);
const vielecke = (d, rolle) => d.vielecke.filter((v) => v.rolle === rolle);
// Gaußsche Trapezformel — vorzeichenloser Inhalt eines Vielecks.
function gauss(p) {
  let s = 0;
  for (let i = 0; i < p.length; i++) { const [x1, y1] = p[i], [x2, y2] = p[(i + 1) % p.length]; s += x1 * y2 - x2 * y1; }
  return Math.abs(s) / 2;
}
// Orientierte Summe der Flächenstücke: Inhalt mal Vorzeichen.
const orientiert = (stuecke) => stuecke.reduce((s, v) => s + (v.vz === "-" ? -1 : 1) * gauss(v.punkte), 0);
// Toleranz für gemessene Flächen: Koordinaten sind auf 0,01 Bildpunkte gerundet, die Ränder sind
// Sehnenzüge — beides zusammen bleibt weit unter einem Promille.
const tolFlaeche = (A, d) => 2e-3 * (1 + Math.abs(A)) + 0.5 / (d.proX * d.proY) * 100;
// Alle Punkte der Pfade mit dieser Rolle müssen auf f liegen (Toleranz: 1,5 Bildpunkte).
// Die Koordinaten sind auf 0,01 Bildpunkte gerundet; wo der Graph steil ist (1/x² nahe 0), wird
// daraus in y ein merklicher Fehler — die Toleranz wächst deshalb mit der Steigung.
// Am Rand des Definitionsbereichs (√x bei 0) gibt es keine zentrale Differenz — dort die einseitige.
const steil = (f, x) => { const s = abl(f, x); return Number.isFinite(s) ? Math.abs(s) : Math.abs((f(x + 1e-4) - f(x)) / 1e-4); };
const tolY = (d, f, x) => 1.5 / d.proY + steil(f, x) * (0.02 / d.proX) + 1e-6;
function pfadAuf(d, rolle, f, wo) {
  const p = d.pfade.filter((q) => q.rolle === rolle);
  pruefe(p.length > 0, `${wo}: kein Pfad „${rolle}“`);
  let schlecht = 0, beispiel = "";
  for (const q of p) for (const [x, y] of q.punkte) if (!nahe(y, f(x), tolY(d, f, x))) { schlecht++; beispiel = `(${x.toFixed(3)} | ${y.toFixed(3)}) statt ${f(x).toFixed(3)}`; }
  pruefe(schlecht === 0, `${wo}: ${schlecht} Punkte von „${rolle}“ liegen nicht auf dem Graphen, z. B. ${beispiel}`);
}
// Jedes Flächenstück liegt zwischen f und g, und sein Vorzeichen ist das von f − g im Inneren.
function stueckeZwischen(d, rolle, f, g, wo) {
  let schlecht = 0, beispiel = "";
  for (const v of vielecke(d, rolle)) {
    for (const [x, y] of v.punkte) {
      if (!nahe(y, f(x), tolY(d, f, x)) && !nahe(y, g(x), tolY(d, g, x))) { schlecht++; beispiel = `(${x.toFixed(3)} | ${y.toFixed(3)})`; }
      const diff = f(x) - g(x);
      if (Math.abs(diff) > 0.05 && (diff > 0) !== (v.vz === "+")) { schlecht++; beispiel = `Vorzeichen „${v.vz}“ bei x = ${x.toFixed(3)}, f − g = ${diff.toFixed(3)}`; }
    }
  }
  pruefe(schlecht === 0, `${wo}: Flächenstücke „${rolle}“ falsch, z. B. ${beispiel}`);
}

// Polynom aus dem Klartext: „−2x³ − x² − 2x − 5“ → {3: −2, 2: −1, 1: −2, 0: −5}.
const HOCH = { "²": 2, "³": 3, "⁴": 4, "⁵": 5 };
function liesPoly(s, v = "x") {
  const t = String(s).replace(/−/g, "-").replace(/\s+/g, "");
  const re = new RegExp(`([+-]?)(\\d+(?:,\\d+)?)?(${v}([²³⁴⁵]?))?`, "g");
  const k = {};
  let m;
  while ((m = re.exec(t))) {
    if (m[0] === "") { re.lastIndex++; if (re.lastIndex > t.length) break; continue; }
    if (!m[2] && !m[3]) continue;
    const c = (m[1] === "-" ? -1 : 1) * (m[2] ? parseFloat(m[2].replace(",", ".")) : 1);
    const e = m[3] ? (m[4] ? HOCH[m[4]] : 1) : 0;
    k[e] = (k[e] || 0) + c;
  }
  return k;
}
const polyFn = (k) => (x) => Object.entries(k).reduce((s, [e, c]) => s + c * x ** Number(e), 0);
const polyAbl = (k) => Object.fromEntries(Object.entries(k).filter(([e]) => Number(e) > 0).map(([e, c]) => [Number(e) - 1, c * Number(e)]));
const grad = (k) => Math.max(...Object.keys(k).map(Number).filter((e) => Math.abs(k[e]) > 1e-12));


// Steigung eines gezeichneten Pfades zwischen benachbarten Punkten gegen f am Mittelpunkt. Die
// Koordinaten sind auf 0,01 Bildpunkte gerundet — bei steilem Bildmaßstab streut die Sekante etwas.
function steigungStimmt(d, rolle, f, wo, faktor = 1) {
  const P = d.pfade.filter((p) => p.rolle === rolle).flatMap((p) => p.punkte);
  let schlecht = 0, beispiel = "";
  for (let i = 0; i + 1 < P.length; i++) {
    const [x1, y1] = P[i], [x2, y2] = P[i + 1];
    if (x2 - x1 < 1e-6) continue;
    const xm = (x1 + x2) / 2, soll = faktor * f(xm), ist = (y2 - y1) / (x2 - x1);
    // Außerhalb des Bildes ist der Pfad abgeschnitten — dort zählt nur, was sichtbar ist.
    if (Math.max(y1, y2) > d.ymax + 1 || Math.min(y1, y2) < d.ymin - 1) continue;
    const tol = 0.03 * (1 + Math.abs(soll)) + 0.03 / (d.proY * (x2 - x1)) + Math.abs(abl((x) => faktor * f(x), xm)) * (x2 - x1);
    if (!nahe(ist, soll, tol)) { schlecht++; beispiel = `bei x = ${xm.toFixed(3)}: ${ist.toFixed(4)} statt ${soll.toFixed(4)}`; }
  }
  pruefe(P.length > 100 && schlecht === 0, `${wo}: „${rolle}“ hat an ${schlecht} Stellen nicht die Steigung ${faktor === 1 ? "f" : faktor + " · f"} (${beispiel})`);
}
// Eine Tangente: Steigung m und Berührpunkt auf dem Pfad mit dieser Rolle bei x₀.
function tangenteStimmt(d, rolle, m, x0, y0, wo) {
  const t = linie(d, rolle);
  pruefe(t && nahe(steigung(t), m, 1e-3 * (1 + Math.abs(m))) && nahe(aufGerade(t, x0), y0, 0.02 * (1 + Math.abs(y0))), `${wo}: Tangente „${rolle}“ falsch (Steigung ${t ? steigung(t).toFixed(4) : "–"} statt ${m.toFixed(4)})`);
}
// Der Wert eines gezeichneten Pfades an der Stelle x (lineare Interpolation zwischen den Punkten).
function pfadWert(d, rolle, x) {
  const P = d.pfade.filter((p) => p.rolle === rolle).flatMap((p) => p.punkte).sort((a, b) => a[0] - b[0]);
  for (let i = 0; i + 1 < P.length; i++) if (P[i][0] <= x && x <= P[i + 1][0]) {
    const [x1, y1] = P[i], [x2, y2] = P[i + 1];
    return x2 === x1 ? y1 : y1 + ((y2 - y1) * (x - x1)) / (x2 - x1);
  }
  return NaN;
}
// Der gezeichnete Zuwachs: senkrechte Strecke bei b von F(a) bis F(b).
const zuwachsLaenge = (d) => { const z = linie(d, "zuwachs"); return z ? z.y2 - z.y1 : NaN; };

// ---------- Gerüst ----------
const ABSCHNITTE = ["sec-vergleich", "sec-ekx", "sec-ansatz", "sec-bestand", "sec-sinus", "sec-verkettung", "sec-ln",
  "sec-uneigentlich", "sec-rotation", "sec-stolperstelle"];
const NUR_LK = new Set(["sec-sinus", "sec-verkettung", "sec-ln", "sec-uneigentlich", "sec-rotation"]);
// Abschnitte von Thema 2.2, die nur der Leistungskurs hat.
const LK_22 = ["sec-sinus", "sec-kette", "sec-quotient", "sec-lnfunktion", "sec-symmetrie"];
async function geruest(page) {
  const folge = await page.evaluate(() => [...document.querySelectorAll("main section[id]")].map((s) => s.id));
  const soll = [...ABSCHNITTE, "sec-selbsteinschaetzung", "sec-vernetzung", "sec-formelsammlung", "sec-uebungen"];
  pruefe(JSON.stringify(folge) === JSON.stringify(soll), `Gerüst: Abschnitte ${folge.join(", ")} statt ${soll.join(", ")}`);
  const titel = await page.evaluate((ids) => ids.map((id) => {
    const h = document.querySelector(`#${id} h2`);
    return { text: h.textContent, marken: [...h.querySelectorAll(".kurs-marke")].map((m) => m.className) };
  }), ABSCHNITTE);
  titel.forEach((t, i) => {
    pruefe(t.text.startsWith(`${i + 1}. `), `Gerüst: Überschrift „${t.text}“ trägt nicht die Nummer ${i + 1}`);
    const erwartet = NUR_LK.has(ABSCHNITTE[i]) ? "kurs-marke lk" : "kurs-marke gk";
    pruefe(t.marken.length === 1 && t.marken[0] === erwartet, `Gerüst: ${ABSCHNITTE[i]} trägt die Marke ${t.marken.join(", ") || "keine"} statt „${erwartet}“`);
  });
  pruefe(await page.evaluate(() => !!document.querySelector("main section:first-child .kurs-hinweis .kurs-marke.lk")), "Gerüst: Der Einstieg kennzeichnet die Seite nicht als Leistungskurs");
  pruefe(/Elemente der Mathematik/.test(await text(page, "main")) && /Fundamente der Mathematik/.test(await text(page, "main")), "Gerüst: Die beiden Lehrwerke werden nicht genannt");
  pruefe(fs.existsSync(path.join(WURZEL, path.dirname(SEITE), "formelsammlung.pdf")), "Formelsammlung: formelsammlung.pdf fehlt");
  // Kein Vorgriff: Grundkurs-Abschnitte verweisen auf Leistungskurs-Stoff — hier oder in Thema 2.2 —
  // nur als Ausblick, in einem Satz oder einer Tabellenzeile, die den Leistungskurs nennt.
  const vorgriffe = await page.evaluate(([lk, lk22]) => {
    const aus = [];
    for (const s of document.querySelectorAll("main section[id]")) {
      if (lk.includes(s.id) || !s.querySelector("h2 .kurs-marke")) continue;
      for (const a of s.querySelectorAll("a[href]")) {
        const h = a.getAttribute("href");
        const intern = h.startsWith("#sec-") && lk.includes(h.slice(1));
        const extern = h.includes("03b-weitere-funktionen-ableiten") && lk22.some((x) => h.endsWith("#" + x));
        if (!intern && !extern) continue;
        const block = a.closest("tr, p, li, div");
        if (a.closest(".hinweis-box") || /Leistungskurs|\(LK\)/.test(block ? block.textContent : "")) continue;
        aus.push(`${s.id} → ${h}`);
      }
    }
    return aus;
  }, [[...NUR_LK], LK_22]);
  pruefe(vorgriffe.length === 0, `Gerüst: Grundkurs-Abschnitte stützen sich auf Leistungskurs-Stoff: ${vorgriffe.join("; ")}`);
  // Ein Rechenweg in einem Grundkurs-Abschnitt, der Kettenregel, sin, cos oder ln als Funktion braucht,
  // ist als Leistungskurs-Kasten markiert.
  const lkWege = await page.evaluate((lk) => [...document.querySelectorAll("main section[id] .rechenweg-box")]
    .filter((b) => !lk.includes(b.closest("section").id) && b.closest("section").id !== "sec-vergleich" && !b.classList.contains("lk"))
    .filter((b) => /Kettenregel|Quotientenregel|\bcos\b|\bsin\b|\bln\(/.test(b.textContent))
    .map((b) => b.closest("section").id), [...NUR_LK]);
  pruefe(lkWege.length === 0, `Gerüst: Rechenweg mit Leistungskurs-Stoff ohne LK-Markierung in ${lkWege.join(", ")}`);
  // Leistungskurs-Funktionen in einem Grundkurs-Abschnitt stehen in der Auswahl mit „(LK)“.
  const ohneMarke = await page.evaluate((lk) => [...document.querySelectorAll("main section[id] select option")]
    .filter((o) => !lk.includes(o.closest("section").id) && /sin|cos|ln|1\/x/.test(o.textContent) && !/\(LK\)/.test(o.textContent))
    .map((o) => o.textContent), [...NUR_LK]);
  pruefe(ohneMarke.length === 0, `Gerüst: Auswahl in Grundkurs-Abschnitten ohne „(LK)“: ${ohneMarke.join("; ")}`);
  // Jeder Erarbeitungsabschnitt stellt sich ausdrücklich neben die ganzrationalen Funktionen.
  const ohneVergleich = await page.evaluate((ids) => ids.filter((id) => !document.querySelector(`#${id} .unterschied-box`)), ABSCHNITTE);
  pruefe(ohneVergleich.length === 0, `Gerüst: Abschnitte ohne „Anders als bei ganzrationalen Funktionen“: ${ohneVergleich.join(", ")}`);
  // Die Rechenweg-Übersicht in Abschnitt 1 nennt jeden neuen Rechenweg mit seinem Abschnitt.
  const uebersicht = await page.evaluate(() => [...document.querySelectorAll("#sec-vergleich .rechenweg-box a")].map((a) => a.getAttribute("href")));
  for (const id of ABSCHNITTE.slice(1, 9)) pruefe(uebersicht.includes("#" + id), `Gerüst: Die Rechenweg-Übersicht verweist nicht auf ${id}`);

  const links = await page.evaluate(() =>
    [...document.querySelectorAll("main a[href]")].map((a) => a.getAttribute("href")).filter((h) => !h.startsWith("http")));
  for (const href of new Set(links)) {
    if (href.startsWith("#")) {
      pruefe(await page.evaluate((id) => !!document.getElementById(id), href.slice(1)), `Gerüst: Sprungmarke „${href}“ fehlt auf der Seite`);
      continue;
    }
    const ziel = new URL(href.split("#")[0], "http://localhost" + SEITE).pathname;
    const antwort = await page.request.get("http://localhost:" + (process.env.UPLANT_PORT || "8936") + ziel);
    pruefe(antwort.ok(), `Gerüst: der Verweis „${href}“ führt ins Leere (${antwort.status()})`);
    const anker = href.split("#")[1];
    if (anker) pruefe((await antwort.text()).includes(`id="${anker}"`), `Gerüst: Sprungmarke „${anker}“ fehlt in ${ziel}`);
  }
  const menue = fs.readFileSync(path.join(WURZEL, "mathematik/mss11/01-analysis/index.html"), "utf-8");
  pruefe(/data-section="mss11" href="05b-weitere-funktionen-integrieren\/index.html" hidden/.test(menue), "Menü: Karte für Thema 4.2 fehlt oder ist nicht mit data-section/hidden versehen");
  pruefe(/<h2>4\.2 Integration weiterer Funktionen <span class="kurs-marke lk">/.test(menue), "Menü: Die Karte heißt nicht „4.2 Integration weiterer Funktionen“ mit der Marke LK");
  for (const t of ["05-integralrechnung", "03b-weitere-funktionen-ableiten", "04b-weitere-funktionen-untersuchen"]) {
    const h = fs.readFileSync(path.join(WURZEL, `mathematik/mss11/01-analysis/${t}/index.html`), "utf-8");
    pruefe(h.includes("../05b-weitere-funktionen-integrieren/index.html"), `Vernetzung: ${t} verweist nicht auf Thema 4.2`);
  }
  // Alle Leistungskurs-Aufgaben tragen „(LK)“; die übrigen kommen ohne sin, cos, ln und Verkettung aus.
  const quelle = fs.readFileSync(path.join(WURZEL, path.dirname(SEITE), "aufgaben-weitere-funktionen-integrieren.js"), "utf-8");
  const titelListe = [...quelle.matchAll(/titel: "([^"]+)", generate: generate(\w+)/g)].map((m) => ({ titel: m[1], name: m[2] }));
  pruefe(titelListe.length === 24, `Aufgaben: ${titelListe.length} Titel statt 24 gelesen`);
  const lkAnzahl = titelListe.filter((t) => /\(LK\)$/.test(t.titel)).length;
  pruefe(lkAnzahl === 15, `Aufgaben: ${lkAnzahl} Aufgaben mit „(LK)“ statt 15`);
  for (const stufe of ["einfach", "mittel", "schwierig", "komplex"]) {
    const gk = [...quelle.matchAll(new RegExp(`schwierigkeit: "${stufe}", titel: "([^"]+)"`, "g"))].filter((m) => !/\(LK\)$/.test(m[1])).length;
    pruefe(gk >= 1, `Aufgaben: Auf der Stufe „${stufe}“ gibt es keine Aufgabe für den Grundkurs`);
  }
}

// ---------- 1. Vergleich ----------
const VG = {
  potenz: { f: (x) => x * x, a: 0 },
  e: { f: Math.exp, a: 0 },
  ek: { f: (x) => Math.exp(-0.5 * x), a: 0 },
  produkt: { f: (x) => x * Math.exp(x), a: 0 },
  sinus: { f: Math.sin, a: 0 },
  kehr: { f: (x) => 1 / x, a: 0.25 },
};
async function vergleich(page) {
  for (const [art, d] of Object.entries(VG)) {
    await waehle(page, "vg-art", art);
    for (const bw of [0.25, 1, 2, 3]) {
      const b = await setzeRegler(page, "vg-b", bw);
      const wo = `Vergleich ${art}, b = ${b}`;
      const I = integral(d.f, d.a, b);
      const D1 = await lies(page, '#vg-mount svg[data-panel="f"]'), D2 = await lies(page, '#vg-mount svg[data-panel="F"]');
      pruefe(nahe(orientiert(vielecke(D1, "flaeche")), I, tolFlaeche(I, D1)), `${wo}: gezeichnete Fläche ${orientiert(vielecke(D1, "flaeche")).toFixed(4)} statt ${I.toFixed(4)}`);
      stueckeZwischen(D1, "flaeche", d.f, () => 0, wo);
      pfadAuf(D1, "graph", d.f, wo);
      pruefe(nahe(linie(D1, "grenze-a").x1, d.a, 0.01) && nahe(linie(D1, "grenze-b").x1, b, 0.01), `${wo}: Grenzen falsch gezeichnet`);
      steigungStimmt(D2, "stamm", d.f, wo);
      // Der gezeichnete Zuwachs ist so lang, wie die Fläche groß ist.
      pruefe(nahe(zuwachsLaenge(D2), I, 0.02 * (1 + Math.abs(I))), `${wo}: Zuwachs ${zuwachsLaenge(D2).toFixed(4)} statt ${I.toFixed(4)}`);
      pruefe(nahe(await spanWert(page, "#vg-bilanz .wc"), I, 1e-4), `${wo}: Bilanz nennt ${await spanWert(page, "#vg-bilanz .wc")} statt ${I}`);
    }
  }
  await waehle(page, "vg-art", "potenz");
}

// ---------- 2. e^(kx) ----------
const EK_K = [-2, -1, -0.5, 0.5, 1, 2];
async function ekx(page) {
  for (let i = 0; i < EK_K.length; i++) {
    const k = EK_K[await setzeRegler(page, "ek-k", i)];
    pruefe(nahe(await spanWert(page, "#ek-k-anzeige"), k, 1e-12), `e^(kx): Anzeige k falsch bei Stufe ${i}`);
    const f = (x) => Math.exp(k * x);
    for (const bw of [-1, -0.25, 0, 0.75, 2]) {
      const b = await setzeRegler(page, "ek-b", bw);
      const wo = `e^(kx), k = ${k}, b = ${b}`;
      const I = integral(f, 0, b);
      const D1 = await lies(page, '#ek-mount svg[data-panel="f"]'), D2 = await lies(page, '#ek-mount svg[data-panel="F"]');
      // Die Stücke liegen über [min; max] und sind positiv; das Integral zählt bei b < 0 negativ.
      pruefe(nahe(orientiert(vielecke(D1, "flaeche")), Math.abs(I), tolFlaeche(I, D1)), `${wo}: gezeichnete Fläche falsch`);
      pfadAuf(D1, "graph", f, wo);
      steigungStimmt(D2, "stamm", f, wo);
      steigungStimmt(D2, "falsch", f, `${wo}, falscher Versuch`, k * k);
      // Berührpunkte aus dem gezeichneten Wert bei 0 und der Fläche bis b — der Pfad selbst kann bei b
      // schon aus dem Bild gelaufen sein.
      const Fb = pfadWert(D2, "stamm", 0) + I, falschB = pfadWert(D2, "falsch", 0) + k * k * I;
      tangenteStimmt(D2, "tangente", f(b), b, Fb, wo);
      tangenteStimmt(D2, "tangente-falsch", k * k * f(b), b, falschB, wo);
      pruefe(nahe(await spanWert(page, "#ek-bilanz .wc"), I, 1e-4), `${wo}: Bilanz nennt ${await spanWert(page, "#ek-bilanz .wc")} statt ${I}`);
    }
  }
}

// ---------- 3. Ansatz ----------
const AN = {
  a: (x) => x * Math.exp(x),
  b: (x) => x * Math.exp(-x),
  c: (x) => (2 * x + 1) * Math.exp(0.5 * x),
  d: (x) => x * x * Math.exp(-x),
};
async function ansatz(page) {
  for (const [art, f] of Object.entries(AN)) {
    await waehle(page, "an-art", art);
    for (const xw of [-2, -1, 0, 0.75, 2.5]) {
      const x0 = await setzeRegler(page, "an-x", xw);
      const wo = `Ansatz ${art}, x₀ = ${x0}`;
      const D1 = await lies(page, '#an-mount svg[data-panel="F"]'), D2 = await lies(page, '#an-mount svg[data-panel="f"]');
      steigungStimmt(D1, "stamm", f, wo);
      tangenteStimmt(D1, "tangente", f(x0), x0, pfadWert(D1, "stamm", x0), wo);
      pfadAuf(D2, "graph", f, wo);
      pruefe(nahe(await spanWert(page, "#an-bilanz .wr"), f(x0), 1e-4), `${wo}: Bilanz nennt die Steigung falsch`);
      // Die Stammfunktion in der Bilanz: Ihr Polynomfaktor, numerisch abgeleitet, ergibt f.
      const t = (await spanText(page, "#an-bilanz .wa")).replace(/\s+/g, " ");
      const m = t.match(/F\(x\) = (−?)\((.+?)\) · e\^?\(?(−?[\d,]*)x\)?$/) || t.match(/F\(x\) = (−?)\((.+?)\) · e(−?[\d,]*)x$/);
      pruefe(!!m, `${wo}: Stammfunktion „${t}“ nicht lesbar`);
      if (m) {
        const k = m[3] === "" ? 1 : m[3] === "−" ? -1 : zahl(m[3]);
        const q = polyFn(liesPoly(m[2])), F = (x) => (m[1] ? -1 : 1) * q(x) * Math.exp(k * x);
        pruefe([-1.5, 0, 1, 2].every((x) => nahe(abl(F, x), f(x), 1e-6 * (1 + Math.abs(f(x))))), `${wo}: „${t}“ ist keine Stammfunktion von f`);
      }
    }
  }
  await waehle(page, "an-art", "a");
}

// ---------- 4. Bestand ----------
async function bestand(page) {
  for (const [aw, kw, tw] of [[8, 0.25, 4], [20, 0.1, 25], [2, 1, 0], [12, 0.5, 30], [5, 0.15, 7.5]]) {
    const a = await setzeRegler(page, "bs-a", aw), k = await setzeRegler(page, "bs-k", kw), t = await setzeRegler(page, "bs-t", tw);
    const wo = `Bestand a = ${a}, k = ${k}, t = ${t}`;
    const r = (s) => a * Math.exp(-k * s);
    const Z = integral(r, 0, t), gesamt = integral(r, 0, 80 / k);
    const D1 = await lies(page, '#bs-mount svg[data-panel="r"]'), D2 = await lies(page, '#bs-mount svg[data-panel="B"]');
    pruefe(nahe(orientiert(vielecke(D1, "flaeche")), Z, tolFlaeche(Z, D1)), `${wo}: gezeichnete Fläche falsch`);
    pfadAuf(D1, "graph", r, wo);
    const halb = linie(D1, "halbwert");
    if (halb) pruefe(nahe(r(halb.x1), a / 2, 0.01 * a), `${wo}: Halbierungszeit falsch gezeichnet`);
    pfadAuf(D2, "stamm", (x) => 20 + integral(r, 0, x, 200), wo);
    pruefe(nahe(zuwachsLaenge(D2), Z, 0.01 * (1 + Z)), `${wo}: Zuwachs falsch gezeichnet`);
    pruefe(nahe(linie(D2, "asymptote").y1, 20 + gesamt, 0.01 * (20 + gesamt)), `${wo}: Asymptote falsch`);
    pruefe(nahe(await spanWert(page, "#bs-bilanz .wa"), Z, 1e-4), `${wo}: Zufluss in der Bilanz falsch`);
    pruefe(nahe(await spanWert(page, "#bs-bilanz .wc"), 20 + Z, 1e-4), `${wo}: Bestand in der Bilanz falsch`);
    pruefe(nahe(await spanWert(page, "#bs-bilanz .wg"), 20 + gesamt, 1e-4), `${wo}: Grenze in der Bilanz falsch`);
    const th = zahlen(await bilanzZeile(page, "#bs-bilanz", 2)).slice(-1)[0];
    pruefe(nahe(r(th), a / 2, 1e-3 * a), `${wo}: Halbierungszeit ${th} in der Bilanz falsch`);
  }
}

// ---------- 5. Sinus und Kosinus ----------
const SN = { sin: Math.sin, cos: Math.cos };
const PI4 = ["0", "π/4", "π/2", "3π/4", "π", "5π/4", "3π/2", "7π/4", "2π"];
async function sinus(page) {
  for (const [art, f] of Object.entries(SN)) {
    await waehle(page, "sn-art", art);
    for (const [ia, ib] of [[0, 4], [0, 8], [2, 6], [1, 7], [6, 2], [3, 3], [0, 3]]) {
      await setzeRegler(page, "sn-a", ia);
      await setzeRegler(page, "sn-b", ib);
      const a = (ia * Math.PI) / 4, b = (ib * Math.PI) / 4;
      const wo = `Sinus ${art}, a = ${PI4[ia]}, b = ${PI4[ib]}`;
      pruefe((await spanText(page, "#sn-a-anzeige")) === PI4[ia] && (await spanText(page, "#sn-b-anzeige")) === PI4[ib], `${wo}: Anzeige der Grenzen falsch`);
      const I = integral(f, a, b);
      const D1 = await lies(page, '#sn-mount svg[data-panel="f"]'), D2 = await lies(page, '#sn-mount svg[data-panel="F"]');
      const J = integral(f, Math.min(a, b), Math.max(a, b));
      pruefe(nahe(orientiert(vielecke(D1, "flaeche")), J, tolFlaeche(J, D1)), `${wo}: orientierte Fläche ${orientiert(vielecke(D1, "flaeche")).toFixed(4)} statt ${J.toFixed(4)}`);
      stueckeZwischen(D1, "flaeche", f, () => 0, wo);
      pfadAuf(D1, "graph", f, wo);
      steigungStimmt(D2, "stamm", f, wo);
      if (ia !== ib) pruefe(nahe(zuwachsLaenge(D2), I, 0.02), `${wo}: Zuwachs ${zuwachsLaenge(D2).toFixed(4)} statt ${I.toFixed(4)}`);
      pruefe(nahe(await spanWert(page, "#sn-bilanz .wc"), I, 1e-4), `${wo}: Bilanz nennt ${await spanWert(page, "#sn-bilanz .wc")} statt ${I}`);
    }
  }
  await waehle(page, "sn-art", "sin");
  await setzeRegler(page, "sn-a", 0);
  await setzeRegler(page, "sn-b", 4);
}

// ---------- 6. Lineare Verkettung ----------
const VK_M = [0.5, 1, 2, 3];
const VK = {
  cos: (m) => (x) => Math.cos(m * x),
  pot: (m) => (x) => (m * x + 1) ** 2,
  e: (m) => (x) => Math.exp(m * x - 1),
};
async function verkettung(page) {
  for (const [art, g] of Object.entries(VK)) {
    await waehle(page, "vk-art", art);
    for (let i = 0; i < VK_M.length; i++) {
      const m = VK_M[await setzeRegler(page, "vk-m", i)], f = g(m);
      for (const xw of [-1, -0.25, 0.5, 1]) {
        const x0 = await setzeRegler(page, "vk-x", xw);
        const wo = `Verkettung ${art}, m = ${m}, x₀ = ${x0}`;
        const D1 = await lies(page, '#vk-mount svg[data-panel="F"]'), D2 = await lies(page, '#vk-mount svg[data-panel="f"]');
        steigungStimmt(D1, "stamm", f, wo);
        steigungStimmt(D1, "falsch", f, `${wo}, ohne Teilen`, m);
        tangenteStimmt(D1, "tangente", f(x0), x0, pfadWert(D1, "stamm", x0), wo);
        tangenteStimmt(D1, "tangente-falsch", m * f(x0), x0, pfadWert(D1, "falsch", x0), wo);
        pfadAuf(D2, "graph", f, wo);
        pruefe(nahe(await spanWert(page, "#vk-bilanz .wr"), f(x0), 1e-4), `${wo}: Steigung in der Bilanz falsch`);
        if (m !== 1) pruefe(nahe(await spanWert(page, "#vk-bilanz .wg"), m * f(x0), 1e-4), `${wo}: Steigung ohne Teilen in der Bilanz falsch`);
      }
    }
  }
  await waehle(page, "vk-art", "cos");
}

// ---------- 7. 1/x und ln ----------
const LN_N = [-2, -1.5, -1.2, -1.1, -1, -0.9, -0.8, -0.5, 0];
async function lnAbschnitt(page) {
  for (let i = 0; i < LN_N.length; i++) {
    const n = LN_N[await setzeRegler(page, "ln-n", i)], f = (x) => Math.pow(x, n);
    for (const bw of [0.25, 1, 3, 5]) {
      const b = await setzeRegler(page, "ln-b", bw);
      const wo = `1/x, n = ${n}, b = ${b}`;
      const I = integral(f, 1, b);
      const D1 = await lies(page, '#ln-mount svg[data-panel="f"]'), D2 = await lies(page, '#ln-mount svg[data-panel="F"]');
      pruefe(nahe(orientiert(vielecke(D1, "flaeche")), Math.abs(I), tolFlaeche(I, D1)), `${wo}: gezeichnete Fläche falsch`);
      pfadAuf(D1, "graph", f, wo);
      // ln(x) ist die Fläche unter 1/x ab 1 — numerisch, nicht mit Math.log.
      steigungStimmt(D2, "stamm", (x) => 1 / x, wo);
      pruefe(nahe(pfadWert(D2, "stamm", 2), integral((x) => 1 / x, 1, 2), 0.02), `${wo}: ln(2) falsch gezeichnet`);
      if (n !== -1) steigungStimmt(D2, "potenz-stamm", f, `${wo}, Stammfunktion der Potenz`);
      pruefe(nahe(await spanWert(page, "#ln-bilanz .wc"), I, 1e-4), `${wo}: Bilanz nennt ${await spanWert(page, "#ln-bilanz .wc")} statt ${I}`);
    }
  }
  await setzeRegler(page, "ln-n", 2);
}

// ---------- 8. Uneigentliche Integrale ----------
async function uneigentlich(page) {
  const FN = {
    quadrat: { f: (x) => 1 / (x * x), pol: false, a: 1, konvergent: 1 },
    wurzel: { f: (x) => 1 / Math.sqrt(x), pol: false, a: 1, konvergent: null },
    exp: { f: (x) => Math.exp(-x), pol: false, a: 0, konvergent: 1 },
    polwurzel: { f: (x) => 1 / Math.sqrt(x), pol: true, konvergent: 2 },
    polquadrat: { f: (x) => 1 / (x * x), pol: true, konvergent: null },
  };
  for (const [art, d] of Object.entries(FN)) {
    await waehle(page, "ue-art", art);
    const f = d.f;
    // Auf logarithmischer Skala integriert (x = eᵘ), damit auch b = 1000 und ε = 0,0001 genau werden;
    // e^(−x) ab 0 geradeaus — dort ist nichts steil.
    const I = (lo, hi) => (art === "exp" ? integral(f, lo, Math.min(hi, 60), 4000) : integral((u) => f(Math.exp(u)) * Math.exp(u), Math.log(lo), Math.log(hi), 4000));
    pruefe((await spanText(page, "#ue-k-name")) === (d.pol ? "ε" : "b"), `Uneigentlich ${art}: Der Regler heißt nicht ${d.pol ? "ε" : "b"}`);
    for (let k = 0; k <= 7; k++) {
      await setzeRegler(page, "ue-k", k);
      const w = zahl((await spanText(page, "#ue-k-anzeige")).replace(/\.(?=\d{3})/g, ""));
      const wo = `Uneigentlich ${art}, ${d.pol ? "ε" : "b"} = ${w}`;
      const soll = d.pol ? I(w, 1) : I(d.a, w);
      const z = zahlen(await bilanzZeile(page, "#ue-bilanz", 0));
      pruefe(nahe(z[z.length - 1], soll, 1e-4 * (1 + soll)), `${wo}: Bilanz ${z[z.length - 1]} statt ${soll}`);
      const D = await lies(page, "#ue-mount svg");
      stueckeZwischen(D, "flaeche", f, () => 0, wo);
      if (!d.pol) {
        const J = I(d.a, Math.min(w, 10.5));
        pruefe(nahe(orientiert(vielecke(D, "flaeche")), J, tolFlaeche(J, D)), `${wo}: gezeichnete Fläche falsch`);
        pruefe(nahe(linie(D, "grenze-a").x1, d.a, 0.01), `${wo}: untere Grenze falsch gezeichnet`);
      } else if (art === "polwurzel" || w >= 0.05) {
        // Nahe der Polstelle ist der Sehnenzug eine grobe Näherung — dort genügt ein Prozent.
        const J = I(w, 1);
        pruefe(nahe(orientiert(vielecke(D, "flaeche")), J, 0.01 * J + tolFlaeche(J, D)), `${wo}: gezeichnete Fläche ${orientiert(vielecke(D, "flaeche")).toFixed(4)} statt ${J.toFixed(4)}`);
      }
      if (d.pol) pruefe(nahe(linie(D, "pol").x1, 0, 0.01) && nahe(linie(D, "grenze-a").x1, w, 0.01), `${wo}: Polstelle oder ε falsch gezeichnet`);
    }
    const zeile2 = await bilanzZeile(page, "#ue-bilanz", 1);
    pruefe(d.konvergent !== null ? /konvergent/.test(zeile2) && nahe(await spanWert(page, "#ue-bilanz .wa"), d.konvergent, 1e-9) : /divergent/.test(zeile2), `Uneigentlich ${art}: Konvergenz falsch beurteilt`);
    // Der Grenzwert stimmt: Der Wert für das kleinste ε bzw. größte b liegt nahe daran (oder wächst weiter).
    const fern = d.pol ? I(1e-8, 1) : I(d.a, 1e8);
    pruefe(d.konvergent !== null ? nahe(fern, d.konvergent, 1e-3) : fern > 1000, `Uneigentlich ${art}: Grenzwert ${d.konvergent} passt nicht zur Rechnung (${fern})`);
  }
  await waehle(page, "ue-art", "quadrat");
}

// ---------- 9. Rotationskörper ----------
async function rotation(page) {
  const RK = {
    kegel: { f: (x) => 0.5 * x, a: 0, b: 4 },
    paraboloid: { f: (x) => Math.sqrt(x), a: 0, b: 4 },
    kugel: { f: (x) => Math.sqrt(Math.max(0, 4 - x * x)), a: -2, b: 2 },
    exp: { f: (x) => 2 * Math.exp(-0.5 * x), a: 0, b: 4 },
  };
  for (const [art, d] of Object.entries(RK)) {
    await waehle(page, "rk-art", art);
    const V = Math.PI * integral((x) => d.f(x) ** 2, d.a, d.b);
    for (const nw of [1, 2, 6, 15, 40]) {
      const n = await setzeRegler(page, "rk-n", nw);
      const wo = `Rotation ${art}, n = ${n}`;
      const D = await lies(page, "#rk-mount svg");
      const sch = D.rechtecke.filter((r) => r.rolle === "scheibe");
      pruefe(sch.length === n, `${wo}: ${sch.length} Scheiben statt ${n}`);
      // Volumen aus den gezeichneten Scheiben: π · r² · Dicke, r ist die halbe Höhe des Rechtecks.
      const summe = sch.reduce((s, r) => s + Math.PI * ((r.y2 - r.y1) / 2) ** 2 * (r.x2 - r.x1), 0);
      const dx = (d.b - d.a) / n;
      const soll = Array.from({ length: n }, (_, k) => Math.PI * d.f(d.a + (k + 0.5) * dx) ** 2 * dx).reduce((s, x) => s + x, 0);
      pruefe(nahe(summe, soll, 0.01 * (1 + soll)), `${wo}: gezeichnete Scheiben ergeben ${summe.toFixed(3)} statt ${soll.toFixed(3)}`);
      pruefe(sch.every((r) => nahe(r.y1, -r.y2, 2 / D.proY)), `${wo}: Scheiben nicht symmetrisch zur Achse`);
      const z = zahlen(await bilanzZeile(page, "#rk-bilanz", 0));
      pruefe(nahe(z[z.length - 1], soll, 1e-4), `${wo}: Scheibensumme ${z[z.length - 1]} statt ${soll}`);
      pruefe(nahe(await letzteZahl(page, "#rk-bilanz .wa"), V, 1e-4), `${wo}: Volumen falsch`);
      // „16π/3“ bzw. „4π · (1 − e^−4)“: Die exakte Angabe muss das Volumen treffen.
      const t = await spanText(page, "#rk-bilanz .wa");
      const m = t.match(/^(\d+)π(?:\/(\d+))?(?: · \(1 − e\s*−\s*(\d+)\))?/);
      pruefe(m && nahe((Number(m[1]) / Number(m[2] || 1)) * Math.PI * (m[3] ? 1 - Math.exp(-Number(m[3])) : 1), V, 1e-9), `${wo}: exakte Angabe „${t}“ passt nicht zu V = ${V}`);
      pfadAuf(D, "graph", d.f, wo);
      pfadAuf(D, "spiegel", (x) => -d.f(x), wo);
    }
  }
  await waehle(page, "rk-art", "kegel");
}

// ---------- 10. Stolperstelle ----------
async function stolperstelle(page) {
  const f = (x) => x * Math.exp(x), mia = (x) => 0.5 * x * x * Math.exp(x);
  for (const xw of [-3, -1, 0, 0.5, 1.5]) {
    const x0 = await setzeRegler(page, "st-x", xw);
    const wo = `Stolperstelle x₀ = ${x0}`;
    const D1 = await lies(page, '#st-mount svg[data-panel="F"]'), D2 = await lies(page, '#st-mount svg[data-panel="f"]');
    steigungStimmt(D1, "stamm", f, wo);
    pfadAuf(D1, "falsch", mia, wo);
    tangenteStimmt(D1, "tangente", f(x0), x0, pfadWert(D1, "stamm", x0), wo);
    tangenteStimmt(D1, "tangente-falsch", abl(mia, x0), x0, mia(x0), wo);
    pfadAuf(D2, "graph", f, wo);
    pruefe(nahe(await spanWert(page, "#st-bilanz .wa"), f(x0), 1e-4), `${wo}: Steigung der Stammfunktion in der Bilanz falsch`);
    pruefe(nahe(await spanWert(page, "#st-bilanz .wg"), abl(mia, x0), 1e-4), `${wo}: Steigung von Mias Kurve in der Bilanz falsch`);
    // Mias Kurve ist keine Stammfunktion: Ihre Steigung weicht überall außer bei 0 von f ab.
    if (Math.abs(x0) > 0.1) pruefe(Math.abs(abl(mia, x0) - f(x0)) > 1e-3, `${wo}: Der Unterschied ist nicht zu sehen`);
  }
}

// ---------- Kontrollfragen und Selbsteinschätzung ----------
async function quizze(page) {
  const ids = await page.evaluate(() => [...document.querySelectorAll(".quiz")].map((q) => q.id));
  const abschnitte = await page.evaluate(() => [...document.querySelectorAll(".quiz")].map((q) => q.closest("section").id));
  pruefe(JSON.stringify(abschnitte) === JSON.stringify(ABSCHNITTE), "Kontrollfragen: Nicht jeder Erarbeitungsabschnitt hat seine eigene");
  const stellen = [];
  for (const id of ids) {
    const anzahl = await page.locator(`#${id} .quiz-opt`).count();
    pruefe(anzahl === 4, `Quiz ${id}: ${anzahl} Antworten statt 4`);
    let richtige = 0;
    for (let i = 0; i < anzahl; i++) {
      await page.locator(`#${id} .quiz-opt`).nth(i).click();
      const r = await page.evaluate((q) => { const f = document.querySelector(`#${q} .quiz-feedback`); return { ok: f.classList.contains("ok"), text: f.textContent }; }, id);
      if (r.ok) { richtige++; stellen.push(i); }
      pruefe(r.text.length > 90, `Quiz ${id}: die Erklärung ist nur ${r.text.length} Zeichen lang`);
    }
    pruefe(richtige === 1, `Quiz ${id}: ${richtige} richtige Antworten`);
  }
  pruefe(new Set(stellen).size >= 4, `Kontrollfragen: die richtige Antwort steht nur an ${new Set(stellen).size} Stellen`);
  const haeufigste = Math.max(...[0, 1, 2, 3].map((i) => stellen.filter((s) => s === i).length));
  pruefe(haeufigste <= Math.ceil(stellen.length / 2), "Kontrollfragen: die richtige Antwort steht zu oft an derselben Stelle");
  const zeilen = await page.locator("#se-liste .se-zeile").count();
  pruefe(zeilen === ABSCHNITTE.length, `Selbsteinschätzung: ${zeilen} Zeilen statt ${ABSCHNITTE.length}`);
  for (const i of [0, 3, 6, 9]) {
    await page.evaluate(() => localStorage.clear());
    await page.locator("#se-liste .se-zeile").nth(i).locator("button").nth(2).click();
    const aus = await page.evaluate(() => document.getElementById("se-auswertung").innerHTML);
    pruefe(aus.includes(`href="#${ABSCHNITTE[i]}"`), `Selbsteinschätzung: Zeile ${i + 1} verweist nicht auf ${ABSCHNITTE[i]} — „${aus}“`);
  }
  await page.evaluate(() => localStorage.clear());
}

// ---------- Übungsaufgaben ----------
const T = 0.0001;
// Mit Tausenderpunkt: „1.005,2653“ kommt bei großen Werten wirklich vor. In den Mustern steht § dafür.
const Z = "(−?\\d+(?:\\.\\d{3})*(?:,\\d+)?)";
const R = (s) => new RegExp(s.replace(/§/g, Z));
// Ein Vorfaktor ohne „1“: „“ = 1, „−“ = −1, sonst die Zahl.
const fz = (s) => (s === "" || s === undefined ? 1 : s === "−" ? -1 : zahl(s));
// Grenzen wie „3π/2“, „π“, „2π“, „0“.
function liesPi(s) {
  if (s === "0") return 0;
  const m = s.match(/^(\d*)π(?:\/(\d+))?$/);
  return m ? ((Number(m[1] || 1)) * Math.PI) / Number(m[2] || 1) : NaN;
}
// Grenzen als Potenz von e: „1“, „√e“, „e“, „e²“, „e³“.
const E_GRENZE = { "1": 1, "√e": Math.sqrt(Math.E), "e": Math.E, "e²": Math.E ** 2, "e³": Math.E ** 3 };
// Die Aufgabenstellung mit Integralen als „∫[a;b]“, Hochzahlen als „^(…)“, Indizes als „_…“ und
// Brüchen als „(z)/(n)“ — im reinen Text stünde aus 3e^(2x) ein „3e2x“, und die übereinandergesetzten
// Grenzen ließen sich nicht von der Zahl dahinter trennen.
async function liesAngabe(page, box) {
  return page.evaluate((b) => {
    const e = document.querySelector(`${b} .aufgabe-prompt`).cloneNode(true);
    e.querySelectorAll("br").forEach((s) => s.replaceWith(" "));
    e.querySelectorAll(".integral").forEach((s) => {
      const o = s.querySelector(".grenzen .o"), u = s.querySelector(".grenzen .u");
      s.replaceWith(s.querySelector(".zeichen") ? `∫[${u.textContent};${o.textContent}]` : s.textContent);
    });
    e.querySelectorAll("sup").forEach((s) => s.replaceWith(`^(${s.textContent})`));
    e.querySelectorAll("sub").forEach((s) => s.replaceWith(`_${s.textContent}`));
    e.querySelectorAll(".bruch").forEach((x) => x.replaceWith(`(${x.querySelector(".z").textContent})/(${x.querySelector(".n").textContent})`));
    return e.textContent.replace(/\s+/g, " ").trim();
  }, box);
}
// Schranken gemessen mit werkzeug-streuung.js (25 Züge, 10⁻⁴-Quantil von 0,8 · n):
//   UPLANT_ZUEGE=25 node tests/werkzeug-streuung.js /mathematik/mss11/01-analysis/05b-weitere-funktionen-integrieren/index.html
// Termaufgaben (6, 12, 18, 24) mit 12 Zügen: UPLANT_ZUEGE=12 …
const RT = 12;
// Messung (25 Züge): n ≈ 109, 62, 60, 21, 134, –, 267, 286, 73, 30, 24, –, 43, 111, 32, 37, 32, –, 187, 15,
// 49, 20, 36 (Aufgaben 1 bis 23 ohne die Termaufgaben); Termaufgaben (12 Züge): n groß, 2421, groß, 2776.
const SCHRANKE = {1: 16, 2: 13, 3: 13, 4: 8, 5: 16, 6: 9, 7: 19, 8: 19, 9: 14, 10: 10, 11: 9, 12: 10, 13: 12, 14: 16, 15: 10, 16: 11, 17: 10, 18: 9, 19: 18, 20: 7, 21: 12, 22: 8, 23: 11, 24: 10};

async function aufgaben(page) {
  const r = 25;
  const A = (nr, name, deute) => pruefeAufgabe(page, bericht, { nr, name, runden: r, mindestensVerschieden: SCHRANKE[nr] ?? 5,
    liesRoh: liesAngabe, deute: (frage, roh) => deute(roh, frage) });

  // ---------- einfach ----------
  await A(1, "A1 Integral einer e-Funktion", (q) => {
    const m = q.match(R(String.raw`Berechne ∫\[0;§\] (−?[\d,]*)e\^\((−?[\d,]*)x\) dx\.`));
    if (!m) return null;
    const b = zahl(m[1]), a = fz(m[2]), k = fz(m[3]), f = (x) => a * Math.exp(k * x);
    const I = integral(f, 0, b);
    return { richtig: I, toleranz: T, falsch: [[a * k * (Math.exp(k * b) - 1), "multipliziert statt geteilt"], [I + a / k, "F(0) fehlt"],
      [Math.abs(k) === 1 ? NaN : a * (Math.exp(k * b) - 1), "hat nicht sich selbst als Stammfunktion"]] };
  });
  await A(2, "A2 Sinus und Kosinus", (q) => {
    const m = q.match(/Berechne ∫\[(\S+?);(\S+?)\] (?:(\d+) · )?(sin|cos)\(x\) dx\./);
    if (!m) return null;
    const a = liesPi(m[1]), b = liesPi(m[2]), c = Number(m[3] || 1), f = (x) => c * Math[m[4]](x);
    const I = integral(f, a, b), Ab = flaecheBetrag(f, a, b);
    return { richtig: I, toleranz: T, falsch: [[Math.abs(I) < 1e-9 ? NaN : -I, "Vorzeichen"], [nahe(Ab, Math.abs(I), 1e-6) ? NaN : Ab, "Flächeninhalt zwischen Graph und x-Achse"], [c === 1 ? NaN : I / c, "Der Faktor"]] };
  });
  await A(3, "A3 Integral von c/x", (q) => {
    const m = q.match(R(String.raw`Berechne ∫\[(1|√e|e²?|e³);(√e|e²?|e³)\] \(§\)/\(x\) dx\.`));
    if (!m) return null;
    const a = E_GRENZE[m[1]], b = E_GRENZE[m[2]], c = zahl(m[3]), f = (x) => c / x;
    const I = integral(f, a, b, 20000);
    return { richtig: I, toleranz: T, falsch: [[c === 1 ? NaN : I / c, "hat die Stammfunktion"], [a === 1 ? NaN : integral(f, 1, b, 20000), "Die untere Grenze fehlt"],
      [c * (1 / a - 1 / b), "Das ist die Rechnung für"]] };
  });
  await A(4, "A4 Uneigentliches Integral in zwei Schritten", (q) => {
    const m = q.match(R(String.raw`Berechne ∫\[1;b\] \(§\)/\(x²\) dx für b = § und den Grenzwert`));
    if (!m) return null;
    const c = zahl(m[1]), b = zahl(m[2]), f = (x) => c / (x * x);
    const I = integral(f, 1, b);
    // Mit u = 1/x wird ∫₁^∞ c/x² dx zu ∫₀¹ c du.
    const lim = integral(() => c, 0, 1);
    return { felder: [I, lim], toleranz: T, falschFelder: [[0, -c / b, "nur F(b)"], [0, -I, "Vorzeichen"], [1, I, "Das ist der Wert für b"], [1, 0, "Der Integrand geht gegen 0"]] };
  });
  await A(5, "A5 Stammfunktion durch einen Punkt", (q) => {
    const m = q.match(R(String.raw`f\(x\) = (−?[\d,]*)e\^\((−?[\d,]*)x\)\. Gesucht ist die Stammfunktion F von f, deren Graph durch P\(0 \| §\) geht`));
    if (!m) return null;
    const a = fz(m[1]), k = fz(m[2]), y0 = zahl(m[3]), f = (x) => a * Math.exp(k * x);
    // F(x) = a/k · e^(kx) + C hat die Ableitung f (numerisch geprüft); F(1) über die Fläche von 0 bis 1.
    const G = (x) => (a / k) * Math.exp(k * x);
    pruefe([-1, 0, 0.5].every((x) => nahe(abl(G, x), f(x), 1e-6 * (1 + Math.abs(f(x))))), "A5: a/k · e^(kx) ist keine Stammfunktion");
    const C = y0 - G(0), F1 = y0 + integral(f, 0, 1);
    return { felder: [C, F1], toleranz: T, falschFelder: [[0, y0 - a * k, "multipliziert statt geteilt"], [0, y0, "e⁰ = 1, nicht 0"], [0, y0 + G(0), "Vorzeichen"], [1, F1 - C, "Die Konstante C fehlt"]] };
  });

  // ---------- mittel ----------
  await A(7, "A7 Stammfunktion per Ansatz", (q) => {
    const m = q.match(/f\(x\) = \(?(.+?)\)? · e\^\((−?[\d,]*)x\)\. Eine Stammfunktion hat die Form/);
    if (!m) return null;
    const kp = liesPoly(m[1]), p = kp[1] || 0, qq = kp[0] || 0, k = fz(m[2]);
    const f = (x) => (p * x + qq) * Math.exp(k * x);
    // Aus F′ = (kAx + A + kB) · e^(kx) = f; die Lösung wird durch numerisches Ableiten bestätigt.
    const A_ = p / k, B_ = (qq - A_) / k, F = (x) => (A_ * x + B_) * Math.exp(k * x);
    pruefe([-1, 0, 1.5].every((x) => nahe(abl(F, x), f(x), 1e-6 * (1 + Math.abs(f(x))))), `A7: (Ax + B) · e^(kx) mit A = ${A_}, B = ${B_} ist keine Stammfunktion`);
    return { felder: [A_, B_], toleranz: T, falschFelder: [[0, Math.abs(k) === 1 ? NaN : p * k, "multipliziert statt geteilt"], [0, k === 1 ? NaN : p, "Beim Ableiten von"],
      [1, qq / k, "Der Summand A fehlt"], [1, (qq + A_) / k, "Vorzeichen"]] };
  });
  await A(8, "A8 Zufluss mit abklingender Rate", (q) => {
    const m = q.match(R(String.raw`in dem § m³ Wasser sind, fließt Wasser mit der Rate r\(t\) = § · e\^\(−([\d,]*)t\) .*nach § Stunden im Tank`));
    if (!m) return null;
    const B0 = zahl(m[1]), a = zahl(m[2]), k = m[3] === "" ? 1 : zahl(m[3]), Tt = zahl(m[4]);
    const r = (t) => a * Math.exp(-k * t);
    const Z1 = integral(r, 0, Tt), ges = integral(r, 0, 80 / k, 8000);
    return { felder: [B0 + Z1, B0 + ges], toleranz: T, falschFelder: [[0, B0 - (ges - Z1), "Die untere Grenze fehlt"], [0, B0 + Z1 * k * k, "multipliziert statt geteilt"], [0, Z1, "Das ist nur der Zufluss"],
      [1, B0, "Die Rate geht gegen 0"], [1, ges, "Das ist der gesamte Zufluss"], [1, B0 + ges * k * k, "multipliziert statt geteilt"]] };
  });
  await A(9, "A9 Lineare Verkettung", (q) => {
    const m = q.match(/Berechne ∫\[(\S+?);(\S+?)\] \((.+?)\)([²³]) dx\./);
    if (!m) return null;
    const a = zahl(m[1]), b = zahl(m[2]), k = HOCH[m[4]], innen = liesPoly(m[3]), mm = innen[1];
    const I = integral((x) => polyFn(innen)(x) ** k, a, b);
    const eins = Math.abs(Math.abs(mm) - 1) < 1e-9;
    return { richtig: I, toleranz: T, falsch: [[eins ? NaN : I * mm, "innere Ableitung"], [eins ? NaN : I * mm * mm, "multipliziert statt geteilt"], [I * (k + 1), "Der Exponent steigt"]] };
  });
  await A(10, "A10 Polstelle am Rand", (q) => {
    const m = q.match(R(String.raw`Integral ∫\[0;§\] \(§\)/\(√x\) dx\.`));
    if (!m) return null;
    const a = zahl(m[1]), c = zahl(m[2]);
    // Mit x = u² wird ∫₀ᵃ c/√x dx zu ∫₀^√a 2c du — ohne Polstelle.
    const I = integral(() => 2 * c, 0, Math.sqrt(a));
    return { richtig: I, toleranz: T, falsch: [[c * Math.sqrt(a), "Der Faktor 2 fehlt"], [-c / (2 * a * Math.sqrt(a)), "Ableitung des Integranden"], [a === 1 ? NaN : 2 * c * (Math.sqrt(a) - 1), "untere Grenze ist 0"]] };
  });
  await A(11, "A11 Obere Grenze bei c/x", (q) => {
    const m = q.match(R(String.raw`f\(x\) = \(§\)/\(x\), der x-Achse und den Geraden x = 1 und x = b \(b > 1\) hat den Inhalt §\.`));
    if (!m) return null;
    const c = zahl(m[1]), Aw = zahl(m[2]);
    const b = loese((s) => integral((x) => c / x, 1, s, 20000), Aw, 1, 100);
    // Die Fehlerwerte sind e-Potenzen bis e⁸ — dort wäre Simpson zu grob; sie sind nur Hinweiswerte.
    return { richtig: b, toleranz: T, falsch: [[integral((x) => c / x, 1, b, 20000) / c, "Das ist ln(b)"], [c === 1 ? NaN : Math.exp(Aw), "Der Faktor"],
      [c === 1 ? NaN : Math.exp(Aw * c), "multipliziert statt geteilt"]] };
  });

  // ---------- schwierig ----------
  await A(13, "A13 Fläche unter x · e^(−kx)", (q) => {
    const m = q.match(R(String.raw`f\(x\) = (?:§ · )?x · e\^\(−([\d,]*)x\)\. Für x ≥ 0 .*der Geraden x = §\.`));
    if (!m) return null;
    const a = m[1] ? zahl(m[1]) : 1, k = m[2] === "" ? 1 : zahl(m[2]), b = zahl(m[3]);
    const f = (x) => a * x * Math.exp(-k * x);
    const Af = integral(f, 0, b);
    // F(0) aus dem Ansatz F(x) = (Ax + B) · e^(−kx) ist B = −a/k²; die Prüfung bestätigt F′ = f.
    const F = (x) => (-a / k) * (x + 1 / k) * Math.exp(-k * x);
    pruefe([0, 1, 2].every((x) => nahe(abl(F, x), f(x), 1e-6)), "A13: Die Ansatz-Stammfunktion stimmt nicht");
    return { richtig: Af, toleranz: T, falsch: [[((a * b * b) / 2) * Math.exp(-k * b), "Produktregel rückwärts"], [F(b), "F(0) fehlt"], [(-a / k) * b * Math.exp(-k * b), "Im Ansatz fehlt B"]] };
  });
  await A(14, "A14 Mittlere Temperatur", (q) => {
    const m = q.match(R(String.raw`T\(t\) = § \+ § · e\^\(−([\d,]*)t\) .*in den ersten § Minuten`));
    if (!m) return null;
    const c = zahl(m[1]), d = zahl(m[2]), k = m[3] === "" ? 1 : zahl(m[3]), b = zahl(m[4]);
    const Tf = (t) => c + d * Math.exp(-k * t), I = integral(Tf, 0, b);
    return { richtig: I / b, toleranz: T, falsch: [[(Tf(0) + Tf(b)) / 2, "Mittel der beiden Randwerte"], [I, "Das ist das Integral"], [Tf(b / 2), "Temperatur in der Mitte"]] };
  });
  await A(15, "A15 Rotationsvolumen", (q) => {
    const m = q.match(R(String.raw`f\(x\) = √\(§?x\) rotiert über dem Intervall \[0; §\]`));
    if (!m) return null;
    const c = m[1] ? zahl(m[1]) : 1, b = zahl(m[2]);
    const V = integral((x) => Math.sqrt(c * x) ** 2, 0, b);
    return { richtig: V, toleranz: T, falsch: [[V * Math.PI, "als Dezimalzahl"], [c * b * b, "der Faktor ½ fehlt"], [(c * c * b ** 3) / 3, "Quadriert wurde zweimal"]] };
  });
  await A(16, "A16 Uneigentliches Integral", (q) => {
    const m = q.match(R(String.raw`Berechne ∫\[§;∞\] \(§\)/\(x([²³⁴])\) dx\.`));
    if (!m) return null;
    const a = zahl(m[1]), c = zahl(m[2]), n = HOCH[m[3]];
    // Mit u = 1/x wird ∫ₐ^∞ c/xⁿ dx zu ∫₀^(1/a) c · uⁿ⁻² du — ein gewöhnliches Integral.
    const I = integral((u) => c * u ** (n - 2), 0, 1 / a);
    return { richtig: I, toleranz: T, falsch: [[c / ((n + 1) * a ** (n + 1)), "falschen Exponenten"], [a === 1 ? NaN : c / (n - 1), "untere Grenze 1"], [-I, "Vorzeichen"]] };
  });
  await A(17, "A17 Unendlich langer Rotationskörper", (q) => {
    const m = q.match(R(String.raw`f\(x\) = \(§\)/\(x\) rotiert über \[§; ∞\)`));
    if (!m) return null;
    const c = zahl(m[1]), a = zahl(m[2]);
    // u = 1/x: ∫ₐ^∞ c²/x² dx = ∫₀^(1/a) c² du.
    const V = integral(() => c * c, 0, 1 / a);
    return { richtig: V, toleranz: T, falsch: [[c / a, "Quadriert wurde nicht"], [(c * c) / (a * a), "Die Stammfunktion von"], [V * Math.PI, "Dezimalzahl"]] };
  });

  // ---------- komplex ----------
  await A(19, "A19 Größter Bestand bei abklingendem Zufluss", (q) => {
    const m = q.match(R(String.raw`Becken mit § m³ Wasser fließt Wasser mit der Rate § · e\^\(−([\d,]*)t\) zu; gleichzeitig werden ständig § m³ pro Stunde abgepumpt`));
    if (!m) return null;
    const B0 = zahl(m[1]), a = zahl(m[2]), k = m[3] === "" ? 1 : zahl(m[3]), c = zahl(m[4]);
    const zu = (t) => a * Math.exp(-k * t), rate = (t) => zu(t) - c;
    const ts = vzw(rate, 0, 200)[0];
    const B = B0 + integral(rate, 0, ts);
    return { felder: [ts, B], toleranz: T, falschFelder: [[0, -ts, "Bruch verkehrt"], [0, ts * k * k, "geteilt, nicht multipliziert"],
      [1, B0 + integral(zu, 0, ts), "Der Abfluss fehlt"], [1, B - B0, "Das ist nur die Änderung"], [1, B + 2 * c * ts, "Vorzeichen"]] };
  });
  await A(20, "A20 Rotationskörper unter einer e-Funktion", (q) => {
    const m = q.match(/f\(x\) = ([\d,]*)e\^\(−([\d,]*)x\) rotiert für x ≥ 0/);
    if (!m) return null;
    const a = fz(m[1]), k = m[2] === "" ? 1 : zahl(m[2]), q2 = (x) => (a * Math.exp(-k * x)) ** 2;
    const V = integral(q2, 0, 40 / k, 8000);
    const b = loese((s) => integral(q2, 0, s, 400), V / 2, 0, 40 / k);
    return { felder: [V, b], toleranz: T, falschFelder: [[0, integral((x) => a * Math.exp(-k * x), 0, 40 / k, 8000), "Quadriert wurde nicht"], [0, 2 * V, "Beim Quadrieren verdoppelt"],
      [1, 2 * b, "Im Exponenten steht"], [1, -b, "Vorzeichen"]] };
  });
  await A(21, "A21 Kugelschicht", (q) => {
    const m = q.match(R(String.raw`f\(x\) = √\(§ − x²\) ist ein Halbkreis mit dem Radius §\. .*zwischen x = § und x = §\.`));
    if (!m) return null;
    const [r2, rr, a, b] = m.slice(1).map(zahl);
    pruefe(nahe(rr * rr, r2, 1e-9), `A21: Radius ${rr} passt nicht zu ${r2} − x²`);
    const V = integral((x) => r2 - x * x, a, b);
    return { richtig: V, toleranz: T, falsch: [[r2 * (b - a) + (b ** 3 - a ** 3) / 3, "Vorzeichen"], [a === -rr && b === rr ? NaN : (4 * rr ** 3) / 3, "ganze Kugel"], [r2 * (b - a), "Zylinder"]] };
  });
  await A(22, "A22 Unbegrenzte Fläche zwischen zwei Graphen", (q) => {
    const m = q.match(R(String.raw`f\(x\) = \(§\)/\(x²\) und g\(x\) = \(§\)/\(x³\)`));
    if (!m) return null;
    const a = zahl(m[1]), b = zahl(m[2]);
    const s = vzw((x) => a / (x * x) - b / x ** 3, 0.01, 100)[0];
    // u = 1/x: ∫ₛ^∞ (a/x² − b/x³) dx = ∫₀^(1/s) (a − b · u) du.
    const Af = integral((u) => a - b * u, 0, 1 / s);
    return { felder: [s, Af], toleranz: T, falschFelder: [[0, nahe(a, b) ? NaN : 1 / s, "Umgedreht"],
      [1, a / s, "nur die Fläche unter f"], [1, a / s + b / (2 * s * s), "Vorzeichen: Die Stammfunktion"], [1, -Af, "Rechts von S liegt f über g"]] };
  });
  await A(23, "A23 Grenze aus einer unbegrenzten Fläche", (q) => {
    const m = q.match(R(String.raw`f\(x\) = \(§\)/\(x³\), der x-Achse .*Ihr Inhalt ist §\.`));
    if (!m) return null;
    const c = zahl(m[1]), Aw = zahl(m[2]);
    // Fläche rechts von a über u = 1/x: ∫₀^(1/a) c · u du; sie fällt mit wachsendem a.
    const flaecheAb = (a) => integral((u) => c * u, 0, 1 / a, 200);
    const a = loese((x) => -flaecheAb(x), -Aw, 0.01, 100);
    return { richtig: a, toleranz: T, falsch: [[nahe(a, 1, 1e-9) ? NaN : a * a, "Das ist a²"], [Math.sqrt(c / Aw), "Der Faktor ½ fehlt"], [Math.pow(c / (4 * Aw), 0.25), "falschen Exponenten"]] };
  });

  // Je Stufe eine Termaufgabe mit beliebig vielen Funktionen. Die Angabe wird mit einem eigenen
  // Termleser gelesen und numerisch abgeleitet (tests/lib/terme.js) — die exakten Stammfunktionen der
  // Seite werden dafür nicht benutzt.
  for (const [nr, stufe] of [[6, "e-Funktionen"], [12, "Produkte mit e"], [18, "Sinus, Kosinus und 1/x"], [24, "Verkettung und Umformen"]]) {
    const name = `A${nr} Stammfunktion: ${stufe}`;
    await pruefeAufgabe(page, bericht, { nr, name, runden: RT, mindestensVerschieden: SCHRANKE[nr] ?? 5,
      liesRoh: liesTermAufgabe, deute: termDeuter(bericht, name, "stamm") });
  }
}

(async () => {
  const browser = await starteBrowser();
  for (const dunkel of [false, true]) {
    const wo = dunkel ? "dunkel" : "hell";
    const page = await neueSeite(browser, { dunkel });
    await oeffne(page, SEITE);
    if (!dunkel) {
      await geruest(page);
      await vergleich(page);
      await ekx(page);
      await ansatz(page);
      await bestand(page);
      await sinus(page);
      await verkettung(page);
      await lnAbschnitt(page);
      await uneigentlich(page);
      await rotation(page);
      await stolperstelle(page);
      await quizze(page);
      await pruefeTermleser(page, bericht);
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
