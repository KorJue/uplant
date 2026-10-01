// Fachliche Prüfung: MSS 11, Analysis, Thema 2 „Grenzwerte und Stetigkeit“.
//
// Geprüft wird, was die Seite zeigt, gegen eine unabhängige Rechnung:
//   * Gerüst, Schreibweisen, Verweise, Menükarte, kein Logarithmus;
//   * x → ∞: x₀ gegen eine eigene Rechnung, und ab x₀ liegt der Graph wirklich im Streifen
//     (an 2000 Stellen nachgerechnet); die gezeichneten Graphteile sind richtig als drin/draußen
//     gefärbt (Punkte aus dem SVG über den Maßstab der Gitterlinien zurückgerechnet);
//   * Testfolgen: jeder Punkt liegt auf dem Graphen, die einseitigen Grenzwerte stimmen;
//   * gebrochenrationale Funktionen: Punkt, Asymptote, Werte bei 10 … 1000;
//   * Stetigkeit: Urteil genau dann „stetig“, wenn a + b = 1; Sprunglinie nur sonst;
//   * Definitionslücken: hebbar genau dann, wenn der Zähler an der Nennernullstelle 0 ist; der
//     Wert des Lochs ist der Grenzwert (numerisch von beiden Seiten); die Pol-Vorzeichen stimmen;
//   * Intervallhalbierung: jedes Intervall hat die Länge 2^−k und enthält die Nullstelle bzw. den
//     Sprung;
//   * Stolperstelle 1/x, Kontrollfragen, Selbsteinschätzung und alle sechzehn Aufgaben.

"use strict";

const { neuerBericht } = require("../lib/pruefen");
const { starteBrowser, neueSeite, oeffne, setzeRegler, text } = require("../lib/seite");
const { pruefeNotation } = require("../lib/notation");
const { pruefeKontrast } = require("../lib/kontrast");
const { pruefeAufgabe, zahl } = require("../lib/aufgaben");
const fs = require("fs");
const path = require("path");

const bericht = neuerBericht();
const { pruefe } = bericht;
const SEITE = "/mathematik/mss11/01-analysis/02-grenzwerte-und-stetigkeit/index.html";
const WURZEL = path.resolve(__dirname, "..", "..");
const nahe = (a, b, tol = 1e-6) => Number.isFinite(a) && Math.abs(a - b) <= tol;

async function waehle(page, id, wert) {
  await page.selectOption("#" + id, wert);
}

// Liest alle Pfade und Kreise einer Zeichnung und rechnet ihre Koordinaten über die Gitterlinien in
// (x | y) um — der Maßstab kommt aus zwei beschrifteten Linien, nicht aus dem Code der Seite.
async function lies(page, mount) {
  return page.evaluate((m) => {
    const svg = document.querySelector(`#${m} svg`);
    const linien = (achse) => [...svg.querySelectorAll(`line[data-achse="${achse}"]`)].map((l) => ({ w: Number(l.dataset.wert), p: achse === "y" ? Number(l.getAttribute("y1")) : Number(l.getAttribute("x1")) }));
    const skala = (L) => { const a = L[0], b = L[L.length - 1]; const s = (b.p - a.p) / (b.w - a.w); return (p) => a.w + (p - a.p) / s; };
    const X = skala(linien("x")), Y = skala(linien("y"));
    const pfade = [...svg.querySelectorAll("path[data-teil]")].map((p) => ({
      teil: p.dataset.teil, rolle: p.dataset.rolle,
      punkte: (p.getAttribute("d").match(/-?[\d.]+ -?[\d.]+/g) || []).map((s) => { const [a, b] = s.split(" ").map(Number); return [X(a), Y(b)]; }),
    }));
    const kreise = [...svg.querySelectorAll("circle")].map((c) => ({ x: X(Number(c.getAttribute("cx"))), y: Y(Number(c.getAttribute("cy"))), klasse: c.getAttribute("class"), daten: { ...c.dataset } }));
    // Zu jeder Rolle auch die gezeichnete Lage — sonst prüfte die Prüfung nur, was in data-wert steht,
    // und ein Loch an der falschen Stelle fiele niemandem auf.
    const n = (e, a) => Number(e.getAttribute(a));
    const rollen = Object.fromEntries([...svg.querySelectorAll("[data-rolle]")].map((e) => {
      const o = { ...e.dataset };
      if (e.tagName === "circle") Object.assign(o, { lageX: X(n(e, "cx")), lageY: Y(n(e, "cy")) });
      if (e.tagName === "line") Object.assign(o, { lageX1: X(n(e, "x1")), lageX2: X(n(e, "x2")), lageY1: Y(n(e, "y1")), lageY2: Y(n(e, "y2")) });
      return [e.dataset.rolle, o];
    }));
    return { pfade, kreise, rollen };
  }, mount);
}

async function geruest(page) {
  const folge = await page.evaluate(() => [...document.querySelectorAll("main section[id]")].map((s) => s.id));
  const soll = ["sec-unendlich", "sec-stelle", "sec-rational", "sec-stetigkeit", "sec-luecken", "sec-zwischenwert", "sec-stolperstelle",
    "sec-selbsteinschaetzung", "sec-vernetzung", "sec-formelsammlung", "sec-uebungen"];
  pruefe(JSON.stringify(folge) === JSON.stringify(soll), `Gerüst: Abschnitte ${folge.join(", ")} statt ${soll.join(", ")}`);
  pruefe(fs.existsSync(path.join(WURZEL, path.dirname(SEITE), "formelsammlung.pdf")), "Formelsammlung: formelsammlung.pdf fehlt");
  const notation = await page.evaluate(() => (document.querySelector(".notation-box") || {}).innerText || "");
  pruefe(/Elemente der Mathematik/.test(notation) && /Fundamente der Mathematik/.test(notation) && /linksseitig/.test(notation), "Gerüst: der Kasten mit den Schreibweisen fehlt oder ist unvollständig");
  const links = await page.evaluate(() =>
    [...document.querySelectorAll("main a[href]")].map((a) => a.getAttribute("href")).filter((h) => !h.startsWith("#") && !h.startsWith("http")));
  for (const href of new Set(links)) {
    const ziel = new URL(href.split("#")[0], "http://localhost" + SEITE).pathname;
    const antwort = await page.request.get("http://localhost:" + (process.env.UPLANT_PORT || "8936") + ziel);
    pruefe(antwort.ok(), `Gerüst: der Verweis „${href}“ führt ins Leere (${antwort.status()})`);
    const anker = href.split("#")[1];
    if (anker) pruefe((await antwort.text()).includes(`id="${anker}"`), `Gerüst: Sprungmarke „${anker}“ fehlt in ${ziel}`);
  }
  const haupt = await page.evaluate(() => document.querySelector("main").innerText);
  pruefe(!/\bln\s*\(|\blog\b|\blg\b/.test(haupt), "Gerüst: Die Seite benutzt einen Logarithmus, der erst später kommt");
  const menue = fs.readFileSync(path.join(WURZEL, "mathematik/mss11/01-analysis/index.html"), "utf-8");
  pruefe(/data-section="mss11" href="02-grenzwerte-und-stetigkeit\/index.html" hidden/.test(menue), "Menü: Karte für Grenzwerte und Stetigkeit fehlt oder ist nicht mit data-section/hidden versehen");
}

// ---------- 1. x → ∞ ----------
const GU = {
  a: { f: (x) => (2 * x + 1) / x, g: 2, x0: (eps) => 1 / eps },
  b: { f: (x) => (3 * x * x - 1) / (x * x + 1), g: 3, x0: (eps) => Math.sqrt(4 / eps - 1) },
  c: { f: (x) => Math.sin(x) / x, g: 0, x0: (eps) => 1 / eps },
  d: { f: (x) => (x * x) / (x + 1), divergent: true },
};
const EPS = [1, 0.5, 0.2, 0.1, 0.05, 0.02, 0.01];
async function unendlich(page) {
  for (const [art, def] of Object.entries(GU)) {
    await waehle(page, "gu-art", art);
    for (let i = 0; i < EPS.length; i += (art === "d" ? 3 : 1)) {
      await setzeRegler(page, "gu-e", i);
      const eps = EPS[i];
      const wo = `x → ∞, ${art}, ε = ${eps}`;
      const d = await lies(page, "gu-mount");
      // Jeder gezeichnete Punkt liegt auf dem Graphen und ist richtig gefärbt.
      for (const p of d.pfade.filter((q) => q.rolle === "graph")) {
        for (const [x, y] of p.punkte.slice(1, -1)) {
          if (x < 0.05) continue;
          pruefe(nahe(y, def.f(x), 0.02 * (Math.abs(def.f(x)) + 1)), `${wo}: Graphpunkt (${x.toFixed(3)} | ${y.toFixed(3)}) liegt nicht auf f`);
          if (!def.divergent) {
            const drin = Math.abs(def.f(x) - def.g) < eps;
            // Nahe am Streifenrand entscheidet die Pixelrundung — dort keine Aussage.
            if (Math.abs(Math.abs(def.f(x) - def.g) - eps) > 0.01) pruefe((p.teil === "drin") === drin, `${wo}: bei x = ${x.toFixed(3)} als ${p.teil} gefärbt`);
          }
        }
      }
      const bilanz = await text(page, "#gu-bilanz");
      if (def.divergent) {
        pruefe(/f\(x\) > [\d.,]+ für x > [\d.,]+/.test(bilanz), `${wo}: keine Schranke genannt — „${bilanz}“`);
        const m = bilanz.match(/f\(x\) > ([\d.,]+) für x > ([\d.,]+)/);
        if (m) { const S = zahl(m[1]), xs = zahl(m[2]); for (let x = xs + 0.001; x < xs + 500; x += 0.37) if (def.f(x) <= S) { pruefe(false, `${wo}: f(${x}) ≤ ${S}`); break; } }
        continue;
      }
      const x0 = def.x0(eps);
      const m = bilanz.match(/x₀ [=≈] ([\d.,]+)/);
      pruefe(!!m && nahe(zahl(m[1]), x0, 6e-5 * Math.max(1, x0)), `${wo}: x₀ = ${m && m[1]} statt ${x0}`);
      // Ab x₀ bleibt der Graph im Streifen — an 2000 Stellen bis x₀ + 1000 nachgerechnet.
      let ok = true;
      for (let j = 1; j <= 2000 && ok; j++) { const x = x0 + j * 0.5; if (Math.abs(def.f(x) - def.g) >= eps) { ok = false; pruefe(false, `${wo}: bei x = ${x} verlässt der Graph den Streifen`); } }
      if (art !== "c") pruefe(Math.abs(def.f(x0 * 0.999) - def.g) >= eps, `${wo}: x₀ ist nicht scharf — schon kurz davor liegt der Graph im Streifen`);
    }
  }
}

// ---------- 2. Testfolgen ----------
const TS = {
  luecke: { f: (x) => x + 1, l: 2, r: 2, ymax: 4 },
  sprung: { f: (x) => (x < 1 ? -1 : 1), l: -1, r: 1, ymax: 2 },
  pol: { f: (x) => 1 / ((x - 1) * (x - 1)), l: Infinity, r: Infinity, ymax: 12 },
  stetig: { f: (x) => (x - 1) * (x - 1) + 1, l: 1, r: 1, ymax: 3.5 },
};
async function testfolgen(page) {
  for (const [art, def] of Object.entries(TS)) {
    await waehle(page, "ts-art", art);
    for (const n of [1, 3, 10]) {
      await setzeRegler(page, "ts-n", n);
      const wo = `Testfolgen ${art}, n = ${n}`;
      const d = await lies(page, "ts-mount");
      const tests = d.kreise.filter((k) => k.daten.seite);
      let erwartet = 0;
      for (let k = 1; k <= n; k++) for (const x of [1 - 1 / k, 1 + 1 / k]) if (def.f(x) <= def.ymax) erwartet++;
      pruefe(tests.length === erwartet, `${wo}: ${tests.length} Folgenpunkte statt ${erwartet}`);
      for (const t of tests) {
        const k = Number(t.daten.k), xs = t.daten.seite === "links" ? 1 - 1 / k : 1 + 1 / k;
        pruefe(nahe(t.x, xs, 2e-3) && nahe(t.y, def.f(xs), 0.01 * (1 + Math.abs(def.f(xs)))), `${wo}: x${k} (${t.daten.seite}) bei (${t.x.toFixed(3)} | ${t.y.toFixed(3)}) statt (${xs} | ${def.f(xs)})`);
      }
      const bilanz = await text(page, "#ts-bilanz");
      const gleich = def.l === def.r && Number.isFinite(def.l);
      pruefe(gleich ? new RegExp(`lim ?x→1 f\\(x\\) = ${String(def.l).replace(".", ",")}`).test(bilanz) : /Kein Grenzwert an der Stelle 1/.test(bilanz), `${wo}: falsches Urteil — „${bilanz}“`);
      for (const [seite, g] of [["links", def.l], ["rechts", def.r]]) {
        pruefe(g === Infinity ? bilanz.includes(`von ${seite}: kein Grenzwert`) : bilanz.includes(`${seite}seitiger Grenzwert ${String(g).replace("-", "−")}`), `${wo}: ${seite}seitiger Grenzwert falsch — „${bilanz}“`);
      }
      // Die Tabelle: f(xₙ) für das aktuelle n, unabhängig gerechnet.
      const zellen = await page.evaluate((k) => [...document.querySelectorAll(`#ts-tabelle td[data-k="${k}"]`)].map((c) => c.textContent), n);
      pruefe(zellen.length === 2 && nahe(zahl(zellen[0]), def.f(1 - 1 / n), 6e-5 * (1 + Math.abs(def.f(1 - 1 / n)))) && nahe(zahl(zellen[1]), def.f(1 + 1 / n), 6e-5 * (1 + Math.abs(def.f(1 + 1 / n)))), `${wo}: Tabelle ${zellen.join(" / ")}`);
    }
  }
}

// ---------- 3. Gebrochenrationale Funktionen ----------
const RA = {
  a: { f: (x) => (2 * x + 3) / (x * x + 1), g: 0 },
  b: { f: (x) => (3 * x * x - x) / (2 * x * x + 1), g: 1.5 },
  c: { f: (x) => (4 - x * x) / (x * x + 2), g: -1 },
  d: { f: (x) => (x ** 3 - 2) / (x * x + 4), g: null },
};
async function rational(page) {
  for (const [art, def] of Object.entries(RA)) {
    await waehle(page, "ra-art", art);
    for (const x of [-20, -5, 0, 7, 20]) {
      await setzeRegler(page, "ra-x", x);
      const wo = `rational ${art}, x = ${x}`;
      const d = await lies(page, "ra-mount");
      const p = d.kreise.find((k) => k.daten.rolle === "aktuell");
      pruefe(!!p && nahe(p.x, x, 0.02) && nahe(Number(p.daten.wert), def.f(x), 1e-9), `${wo}: Punkt ${p && p.daten.wert} statt ${def.f(x)}`);
      if (p && def.f(x) > -1e9) pruefe(nahe(p.y, def.f(x), 0.02 * (1 + Math.abs(def.f(x)))), `${wo}: Punkt liegt bei y = ${p.y}`);
      if (def.g !== null) pruefe(d.rollen.asymptote && nahe(Number(d.rollen.asymptote.wert), def.g) && nahe(d.rollen.asymptote.lageY1, def.g, 0.02) && nahe(d.rollen.asymptote.lageY2, def.g, 0.02), `${wo}: Asymptote fehlt oder liegt falsch`);
      else pruefe(!d.rollen.asymptote, `${wo}: Es ist eine waagerechte Asymptote eingezeichnet, die es nicht gibt`);
      const bilanz = await text(page, "#ra-bilanz");
      for (const v of [10, 100, 1000]) {
        const m = bilanz.match(new RegExp(`f\\(${v === 1000 ? "1\\.000" : v}\\) [=≈] (−?[\\d,]+)`));
        pruefe(!!m && nahe(zahl(m[1]), def.f(v), 6e-5 * (1 + Math.abs(def.f(v)))), `${wo}: f(${v}) in der Bilanz ${m && m[1]}`);
      }
    }
    // Der Grenzwert selbst: weit draußen kommt f dem g beliebig nahe.
    if (def.g !== null) pruefe(Math.abs(def.f(1e7) - def.g) < 1e-5 && Math.abs(def.f(-1e7) - def.g) < 1e-5, `rational ${art}: g = ${def.g} ist nicht der Grenzwert`);
    else pruefe(def.f(1e4) > 1e3 && def.f(-1e4) < -1e3, `rational ${art}: wächst nicht über jede Grenze`);
  }
}

// ---------- 4. Stetigkeit ----------
async function stetigkeit(page) {
  for (const [a, b] of [[1, 1.5], [2, -1], [0, 1], [-1, 2], [3, -3], [0.5, 0.5], [-3, 3], [1, 0]]) {
    const A = await setzeRegler(page, "st-a", a), B = await setzeRegler(page, "st-b", b);
    const wo = `Stetigkeit a = ${A}, b = ${B}`;
    const stetig = Math.abs(A + B - 1) < 1e-12;
    const bilanz = await text(page, "#st-bilanz");
    pruefe(stetig ? /f ist an der Stelle 1 stetig/.test(bilanz) : /nicht stetig/.test(bilanz), `${wo}: falsches Urteil — „${bilanz}“`);
    const d = await lies(page, "st-mount");
    pruefe(!!d.rollen.sprung === !stetig, `${wo}: Sprunglinie ${d.rollen.sprung ? "da" : "fehlt"}`);
    pruefe(nahe(Number(d.rollen.funktionswert.wert), A + B), `${wo}: f(1) = ${d.rollen.funktionswert.wert} statt ${A + B}`);
    pruefe(nahe(d.rollen.funktionswert.lageX, 1, 0.02) && nahe(d.rollen.funktionswert.lageY, A + B, 0.03), `${wo}: f(1) gezeichnet bei (${d.rollen.funktionswert.lageX.toFixed(3)} | ${d.rollen.funktionswert.lageY.toFixed(3)})`);
    for (const p of d.pfade) for (const [x, y] of p.punkte) {
      if (y < -3.9 || y > 5.9) continue;
      const soll = p.rolle === "links" ? x * x : A * x + B;
      pruefe(nahe(y, soll, 0.02), `${wo}: ${p.rolle} bei x = ${x.toFixed(3)}: ${y.toFixed(3)} statt ${soll}`);
    }
  }
}

// ---------- 5. Definitionslücken ----------
async function luecken(page) {
  for (const [a, p] of [[2, 1], [1, 1], [2, -1], [-3, 3], [0.5, 0.5], [-1, -1], [3, -2.5]]) {
    const A = await setzeRegler(page, "dl-a", a), P = await setzeRegler(page, "dl-p", p);
    const wo = `Lücke a = ${A}, p = ${P}`;
    const f = (x) => ((x - A) * (x + 1)) / (x - P);
    const hebbar = Math.abs((P - A) * (P + 1)) < 1e-12;
    const d = await lies(page, "dl-mount");
    const bilanz = await text(page, "#dl-bilanz");
    pruefe(hebbar ? /Hebbare Lücke/.test(bilanz) : /Polstelle/.test(bilanz), `${wo}: falsches Urteil — „${bilanz}“`);
    pruefe(!!d.rollen.loch === hebbar && !!d.rollen["senkrechte-asymptote"] === !hebbar, `${wo}: Loch/Asymptote falsch gezeichnet`);
    if (hebbar) {
      // Der Grenzwert numerisch von beiden Seiten — unabhängig vom Kürzen der Seite.
      const g = (f(P - 1e-7) + f(P + 1e-7)) / 2;
      pruefe(nahe(Number(d.rollen.loch.wert), g, 1e-5), `${wo}: Loch bei ${d.rollen.loch.wert} statt ${g}`);
      pruefe(nahe(d.rollen.loch.lageX, P, 0.02) && nahe(d.rollen.loch.lageY, g, 0.03), `${wo}: Loch gezeichnet bei (${d.rollen.loch.lageX.toFixed(3)} | ${d.rollen.loch.lageY.toFixed(3)}) statt (${P} | ${g})`);
      pruefe(bilanz.includes(`f(${String(P).replace(".", ",").replace("-", "−")}) = ${String(Math.round(g * 1e4) / 1e4).replace(".", ",").replace("-", "−")}`), `${wo}: Fortsetzungswert fehlt in der Bilanz`);
    } else {
      const as = d.rollen["senkrechte-asymptote"];
      pruefe(nahe(as.lageX1, P, 0.02) && nahe(as.lageX2, P, 0.02), `${wo}: senkrechte Asymptote gezeichnet bei x = ${as.lageX1.toFixed(3)} statt ${P}`);
      const l = f(P - 1e-6) > 0 ? "+∞" : "−∞", r = f(P + 1e-6) > 0 ? "+∞" : "−∞";
      pruefe(bilanz.includes(`links von ${String(P).replace(".", ",").replace("-", "−")} strebt f(x) gegen ${l}, rechts gegen ${r}`), `${wo}: Vorzeichen am Pol falsch — „${bilanz}“`);
    }
    for (const q of d.pfade) for (const [x, y] of q.punkte.slice(1, -1)) {
      if (Math.abs(y) > 7.9) continue;
      pruefe(nahe(y, f(x), 0.03 * (1 + Math.abs(f(x)))), `${wo}: Graph bei x = ${x.toFixed(3)}: ${y.toFixed(3)} statt ${f(x)}`);
    }
  }
}

// ---------- 6. Intervallhalbierung ----------
const NULLSTELLE = (() => { let lo = 2, hi = 3; for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; if (m ** 3 - 2 * m - 5 > 0) hi = m; else lo = m; } return lo; })();
async function zwischenwert(page) {
  pruefe(Math.abs(NULLSTELLE ** 3 - 2 * NULLSTELLE - 5) < 1e-9, "Halbierung: die Prüfung selbst findet die Nullstelle nicht");
  for (const art of ["stetig", "sprung"]) {
    await waehle(page, "zw-art", art);
    for (const k of [0, 1, 3, 7, 10]) {
      await setzeRegler(page, "zw-k", k);
      const wo = `Halbierung ${art}, k = ${k}`;
      const iv = await page.evaluate(() => { const l = document.querySelector('#zw-mount [data-rolle="intervall"]'); return [Number(l.dataset.a), Number(l.dataset.b)]; });
      pruefe(nahe(iv[1] - iv[0], Math.pow(2, -k), 1e-12), `${wo}: Länge ${iv[1] - iv[0]} statt ${Math.pow(2, -k)}`);
      const ziel = art === "stetig" ? NULLSTELLE : 2.5;
      pruefe(iv[0] <= ziel + 1e-12 && ziel <= iv[1] + 1e-12, `${wo}: [${iv}] enthält ${ziel} nicht`);
      const text1 = await text(page, "#zw-text");
      pruefe(art === "stetig" ? /Nullstellensatz/.test(text1) : /keine Nullstelle/.test(text1), `${wo}: Erklärung passt nicht`);
    }
  }
}

// ---------- 7. Stolperstelle ----------
async function stolperstelle(page) {
  for (const x0 of [-2, -0.5, 0, 0.5, 2]) {
    await setzeRegler(page, "sp-x", x0);
    const bilanz = await text(page, "#sp-bilanz");
    if (x0 === 0) pruefe(/gehört nicht zur Definitionsmenge/.test(bilanz), `Stolperstelle x₀ = 0: „${bilanz}“`);
    else pruefe(/stetig an der Stelle/.test(bilanz) && bilanz.includes(`= ${String(1 / x0).replace(".", ",").replace("-", "−")} —`), `Stolperstelle x₀ = ${x0}: „${bilanz}“`);
  }
}

async function quizze(page) {
  const ids = await page.evaluate(() => [...document.querySelectorAll(".quiz")].map((q) => q.id));
  pruefe(ids.length === 7, `Kontrollfragen: ${ids.length} statt 7`);
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
  await page.evaluate(() => localStorage.clear());
  await page.locator("#se-liste .se-zeile").nth(3).locator("button").nth(2).click();
  const aus = await page.evaluate(() => document.getElementById("se-auswertung").innerHTML);
  pruefe(/href="#sec-stetigkeit"/.test(aus), `Selbsteinschätzung: kein Verweis zurück zur Stetigkeit — „${aus}“`);
  await page.evaluate(() => localStorage.clear());
}

const T = 0.0001;
// Gemessen mit UPLANT_ZUEGE=25 tests/werkzeug-streuung.js (200 Würfe je Aufgabe, 10⁻⁴-Quantil für 0,8 · n):
//   UPLANT_ZUEGE=25 node tests/werkzeug-streuung.js /mathematik/mss11/01-analysis/02-grenzwerte-und-stetigkeit/index.html
const SCHRANKE = {1: 20, 2: 19, 3: 13, 4: 12, 5: 21, 6: 18, 7: 16, 8: 13, 9: 14, 10: 13, 11: 15, 12: 16, 13: 11, 14: 13, 15: 10, 16: 10};
const vz = (zeichen, betrag) => (zeichen === "−" ? -1 : 1) * zahl(betrag);
const koeff = (s) => (s === "" ? 1 : s === "−" ? -1 : zahl(s));

async function aufgaben(page) {
  const r = 25;
  const A = (nr, name, deute) => pruefeAufgabe(page, bericht, { nr, name, runden: r, mindestensVerschieden: SCHRANKE[nr] ?? 5, deute });
  await A(1, "A1 x → ∞", (f) => {
    const m = f.match(/\(Zähler: (−?\d*)x ([+−]) (\d+); Nenner: (\d*)x ([+−]) (\d+)\.\)/);
    if (!m) return null;
    const a = koeff(m[1]), b = vz(m[2], m[3]), c = koeff(m[4]), d = vz(m[5], m[6]);
    const x = 1e7, wert = (a * x + b) / (c * x + d);
    return { richtig: a / c, toleranz: T, pruefe: () => bericht.pruefe(Math.abs(wert - a / c) < 1e-5, "A1: Grenzwert stimmt nicht mit f(10⁷)"), falsch: [[b / d, "Summanden ohne x"], [(a + b) / (c + d), "Das ist f(1)"], [0, "gleich schnell"]] };
  });
  await A(2, "A2 einsetzen", (f) => {
    const m = f.match(/lim ?x→(−?\d+) \(x² ([+−]) (\d*)x ([+−]) (\d+)\)/);
    if (!m) return null;
    const x0 = zahl(m[1]), b = vz(m[2], m[3] === "" ? "1" : m[3]), c = vz(m[4], m[5]);
    return { richtig: x0 * x0 + b * x0 + c, toleranz: T, falsch: [[x0 < 0 ? -(x0 * x0) + b * x0 + c : NaN, "ist positiv"], [x0 === 1 ? NaN : x0 * x0 + b + c, "mittlere Summand"]] };
  });
  await A(3, "A3 kürzen", (f) => {
    const m = f.match(/lim ?x→(−?\d+) .*\(Zähler: x²(?: ([+−]) (\d*)x)? ([+−]) (\d+); Nenner: x ([+−]) (\d+)\.\)/);
    if (!m) return null;
    const a = zahl(m[1]), s = m[2] ? vz(m[2], m[3] === "" ? "1" : m[3]) : 0, p = vz(m[4], m[5]);
    // Unabhängig: den Bruch dicht neben a auswerten.
    const g = (x) => (x * x + s * x + p) / (x - a);
    const wert = (g(a - 1e-7) + g(a + 1e-7)) / 2;
    const c = -s - a;
    return { richtig: wert, toleranz: 1e-4, falsch: [[0, "ist nicht 0"], [c - a, "Vorzeichen"]] };
  });
  await A(4, "A4 Polstelle", (f) => {
    const m = f.match(/\(Zähler: x ([+−]) (\d+); Nenner: x ([+−]) (\d+)\.\)/);
    if (!m) return null;
    const a = vz(m[1], m[2]), p = -vz(m[3], m[4]);
    return { richtig: p, toleranz: T, falsch: [[-p, "Vorzeichen"], [-a, "Nullstelle des Zählers"]] };
  });
  await A(5, "A5 einseitige Grenzwerte", (f) => {
    const m = f.match(/f\(x\) = (−?\d*)x(?: ([+−]) (\d+))? für x < (−?\d+) und f\(x\) = (−?\d*)x(?: ([+−]) (\d+))? für x ≥/);
    if (!m) return null;
    const m1 = koeff(m[1]), c1 = m[2] ? vz(m[2], m[3]) : 0, x0 = zahl(m[4]), m2 = koeff(m[5]), c2 = m[6] ? vz(m[6], m[7]) : 0;
    const l = m1 * x0 + c1, rr = m2 * x0 + c2;
    return { felder: [l, rr], toleranz: T, falschFelder: [[0, rr, "erste Vorschrift"], [1, l, "zweite Vorschrift"]] };
  });
  await A(6, "A6 x₀", (f) => {
    const m = f.match(/Abweichung von (−?\d+): (\d)\/x\).* \|f\(x\) − \(?(−?\d+)\)?\| < ([\d,]+)/);
    if (!m) return null;
    const c = Number(m[2]), eps = zahl(m[4]);
    // Unabhängig: die Grenze aus c/x = ε.
    return { richtig: c / eps, toleranz: T, falsch: [[c === 1 ? NaN : 1 / eps, "nicht 1/x"], [c * eps, "Umgekehrt"]] };
  });
  await A(7, "A7 Parameter b", (f) => {
    const m = f.match(/f\(x\) = x²(?: ([+−]) (\d+))? für x < (−?\d+) und f\(x\) = (−?\d*)x \+ b/);
    if (!m) return null;
    const p = m[1] ? vz(m[1], m[2]) : 0, x0 = zahl(m[3]), mm = koeff(m[4]);
    return { richtig: x0 * x0 + p - mm * x0, toleranz: T, falsch: [[x0 * x0 + p, "gehört dazu"], [x0 * x0 + p + mm * x0, "wechselt"]] };
  });
  await A(8, "A8 stetige Fortsetzung", (f) => {
    const m = f.match(/bei x = (−?\d+) eine hebbare Lücke.*\(Zähler: x²(?: ([+−]) (\d*)x)? ([+−]) (\d+); Nenner: x² ([+−]) (\d+)\.\)/);
    if (!m) return null;
    const a = zahl(m[1]), s = m[2] ? vz(m[2], m[3] === "" ? "1" : m[3]) : 0, p = vz(m[4], m[5]), q = vz(m[6], m[7]);
    const g = (x) => (x * x + s * x + p) / (x * x + q);
    const wert = (g(a - 1e-7) + g(a + 1e-7)) / 2;
    const b = s + a;
    return { richtig: wert, toleranz: 1e-4, falsch: [[0, "ist nicht 0"], [(a + b) / 2, "Nenner ist"]] };
  });
  await A(9, "A9 Wurzel minus x", (f) => {
    const m = f.match(/lim ?x→∞ \(√\(x² ([+−]) (\d*)x(?: ([+−]) (\d+))?\) − x\)/);
    if (!m) return null;
    const a = vz(m[1], m[2] === "" ? "1" : m[2]), c = m[3] ? vz(m[3], m[4]) : 0;
    // Unabhängig: bei x = 10⁶ ausgewertet, numerisch stabil über die erweiterte Form.
    const x = 1e6, wert = (a * x + c) / (Math.sqrt(x * x + a * x + c) + x);
    return { richtig: a / 2, toleranz: T, pruefe: () => bericht.pruefe(Math.abs(wert - a / 2) < 1e-4, `A9: f(10⁶) = ${wert}, nicht ${a / 2}`), falsch: [[0, "nicht 0"], [a, "zwei x"]] };
  });
  await A(10, "A10 Halbierung", (f) => {
    const m = f.match(/f\(x\) = x² − (\d+) hat in \[(\d+); (\d+)\] .* durch (drei|vier) Halbierungsschritte/);
    if (!m) return null;
    const c = Number(m[1]); let lo = Number(m[2]), hi = Number(m[3]);
    const k = m[4] === "drei" ? 3 : 4;
    // Unabhängig halbiert: die Hälfte behalten, die √c enthält.
    const w = Math.sqrt(c);
    let flo = lo, fhi = hi;
    for (let i = 0; i < k; i++) {
      const mid = (lo + hi) / 2;
      if (i === k - 1) { if (w < mid) { flo = mid; fhi = hi; } else { flo = lo; fhi = mid; } }
      if (w < mid) hi = mid; else lo = mid;
    }
    return { felder: [lo, hi], toleranz: T, falschFelder: [[0, flo, "andere Hälfte"], [1, fhi, "andere Hälfte"]] };
  });
  await A(11, "A11 Parameter a", (f) => {
    const m = f.match(/f\(x\) = a · x² für x ≤ (\d) und f\(x\) = (−?\d*)x \+ a/);
    if (!m) return null;
    const x0 = Number(m[1]), mm = koeff(m[2]);
    const a = (mm * x0) / (x0 * x0 - 1);
    return { richtig: a, toleranz: T, pruefe: () => bericht.pruefe(Math.abs(a * x0 * x0 - (mm * x0 + a)) < 1e-9, "A11: Probe der Prüfung selbst"), falsch: [[mm / x0, "beiden Seiten"], [(mm * x0) / (x0 * x0 + 1), "Beim Sammeln"]] };
  });
  await A(12, "A12 Nullstellensatz", (f) => {
    const m = f.match(/f\(x\) = x³ ([+−]) (\d*)x ([+−]) (\d+) hat genau eine Nullstelle/);
    if (!m) return null;
    const p = vz(m[1], m[2] === "" ? "1" : m[2]), q = vz(m[3], m[4]);
    const g = (x) => x ** 3 + p * x + q;
    let lo = -10, hi = 10;
    for (let i = 0; i < 80; i++) { const mid = (lo + hi) / 2; if (g(mid) > 0) hi = mid; else lo = mid; }
    const k = Math.floor(lo);
    return { richtig: k, toleranz: 0.5, falsch: [[k + 1, "linke Grenze"], [-k - 1, "Vorzeichen prüfen"]] };
  });
  await A(13, "A13 Asymptote und Pole", (f) => {
    const m = f.match(/dass y = (−?[\d,]+) waagerechte Asymptote ist und f Polstellen bei x = ±(\d)/);
    if (!m) return null;
    const c = zahl(m[1]), rr = Number(m[2]);
    return { felder: [2 * c, 2 * rr * rr], toleranz: T, falschFelder: [[0, c, "Leitkoeffizienten"], [1, rr * rr, "muss 2"], [1, 2 * rr, "quadriert"]] };
  });
  await A(14, "A14 Grenzwert mit x³", (f) => {
    const m = f.match(/\(Zähler: x³(?: ([+−]) (\d*)x)? ([+−]) (\d+); Nenner: x(²?) ([+−]) (\d+)\.\)/);
    const g = f.match(/lim ?x→(−?\d+)/);
    if (!m || !g) return null;
    const x0 = zahl(g[1]), quad = m[5] === "²";
    const p = m[1] ? (m[1] === "−" ? -1 : 1) * (m[2] === "" ? 1 : zahl(m[2])) : 0;
    const c = -vz(m[3], m[4]), n0 = -vz(m[6], m[7]);
    // Der Nenner muss an x₀ verschwinden, sonst wäre es keine 0 : 0-Aufgabe.
    pruefe(Math.abs((quad ? x0 * x0 : x0) - n0) < 1e-9, `A14: Nenner verschwindet nicht an x₀ = ${x0} — „${f}“`);
    pruefe(Math.abs(x0 ** 3 + p * x0 - c) < 1e-9, `A14: Zähler verschwindet nicht an x₀ = ${x0} — „${f}“`);
    const h = (x) => (x ** 3 + p * x - c) / (quad ? x * x - x0 * x0 : x - x0);
    const wert = (h(x0 - 1e-6) + h(x0 + 1e-6)) / 2;
    if (quad) return { richtig: wert, toleranz: 1e-4, falsch: [[0, "erst kürzen"], [3 * x0 * x0, "im Nenner"], [x0 / 2, "eingesetzt 3"]] };
    if (p) return { richtig: wert, toleranz: 1e-4, falsch: [[0, "erst kürzen"], [3 * x0 * x0, "fehlt"], [x0 * x0 + p, "drei Summanden"]] };
    return { richtig: wert, toleranz: 1e-4, falsch: [[0, "erst kürzen"], [x0 * x0, "drei Summanden"], [x0 ** 3, "Nicht x₀³"]] };
  });
  await A(15, "A15 drei Teile", (f) => {
    const m = f.match(/f\(x\) = (−?[\d,]*)x² für 1 ≤ x ≤ (\d)/);
    if (!m) return null;
    const c = m[1] === "" ? 1 : m[1] === "−" ? -1 : zahl(m[1]), q = Number(m[2]);
    // Unabhängig: das lineare Gleichungssystem mit der Cramerschen Regel.
    // a + b = c, a + q · b = c · q²
    const det = q - 1;
    const b = (c * q * q - c) / det, a = c - b;
    return { felder: [a, b], toleranz: T, falschFelder: [[0, -a, "Vorzeichen"], [1, c, "a = 0"]] };
  });
  await A(16, "A16 Halbierungsschritte", (f) => {
    const m = f.match(/Länge ([\d,]+)\. .* kürzer als ([\d,]+) ist/);
    if (!m) return null;
    const L = zahl(m[1]), eps = zahl(m[2]);
    let n = 0, l = L;
    while (!(l < eps)) { l /= 2; n++; }
    return { richtig: n, toleranz: 0.5, falsch: [[n - 1, "noch nicht kürzer"], [Math.ceil(L / eps), "Zweierpotenz"]] };
  });
}

(async () => {
  const browser = await starteBrowser();
  for (const dunkel of [false, true]) {
    const wo = dunkel ? "dunkel" : "hell";
    const page = await neueSeite(browser, { dunkel });
    await oeffne(page, SEITE);
    if (!dunkel) {
      await geruest(page);
      await unendlich(page);
      await testfolgen(page);
      await rational(page);
      await stetigkeit(page);
      await luecken(page);
      await zwischenwert(page);
      await stolperstelle(page);
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
