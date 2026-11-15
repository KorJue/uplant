// Fachliche Prüfung: Klasse 8, Terme, Thema 5 „Binomische Formeln anwenden“.
//
// Nachgerechnet wird mit dem eigenen Termauswerter (tests/lib/polynom.js), nicht mit dem der Seite:
//
//   1. (a + b)²: vier Teile in den Maßen a², ab, ab, b², die zu Anfang das Quadrat (a + b)² genau
//      ausfüllen und starr auseinanderrücken; die Bilanz rechnet beide Seiten nach.
//   2. (a − b)²: Rest (a − b)², zwei Streifen a × b, die sich zu Anfang genau im Eckquadrat b²
//      überdecken; zusammen füllen sie a² aus; die Eckquadrate sind markiert.
//   3. (a + b)(a − b): Der umgelegte Streifen bleibt in jeder Stellung ein Rechteck derselben Maße,
//      überdeckt den oberen Teil nie und bildet am Ende mit ihm das Rechteck (a + b) × (a − b).
//   4. RÜCKWÄRTS UND IM KOPF: jeder Schritt gleichwertig (mit Zahlen: gleich), die genannte Formel
//      passt zur Gestalt der Aufgabe, der Schrittregler wird begrenzt.
//   5. Die AUFGABEN: jede der acht über viele Runden, aus dem Aufgabentext nachgerechnet, mit den
//      vorgesehenen Fehlern.

"use strict";

const { neuerBericht } = require("../lib/pruefen");
const { starteBrowser, neueSeite, oeffne, setzeRegler } = require("../lib/seite");
const { pruefeNotation } = require("../lib/notation");
const { pruefeKontrast, pruefeStrichKontrast, pruefeTextAufFlaeche } = require("../lib/kontrast");
const { pruefeAufgabe } = require("../lib/aufgaben");
const P = require("../lib/polynom");
const fs = require("fs");
const path = require("path");

const bericht = neuerBericht();
const { pruefe } = bericht;
const SEITE = "/mathematik/klasse-8/terme/binomische-formeln.html";
const WURZEL = path.resolve(__dirname, "..", "..");
const NUR = (process.env.UPLANT_NUR || "").split(",").map((t) => t.trim()).filter(Boolean);
const will = (teil) => NUR.length === 0 || NUR.includes(teil);

const waehle = (page, id, wert) => page.evaluate(([i, w]) => {
  const e = document.getElementById(i);
  e.value = w;
  e.dispatchEvent(new Event("input", { bubbles: true }));
}, [id, wert]);
const optionText = (page, id) => page.evaluate((i) => { const s = document.getElementById(i); return s.options[s.selectedIndex].text; }, id);
const normal = (s) => String(s).replace(/\s+/g, " ").trim();
const ggT = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
const zahl = (s) => Number(String(s).replace("−", "-"));
const ueberdeckt = (a, b) => Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x) > 0.3 && Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y) > 0.3;
function keineUeberdeckung(rects, wo) {
  for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
    if (ueberdeckt(rects[i], rects[j])) { pruefe(false, `${wo}: Kachel ${i} und ${j} überdecken sich`); return; }
  }
  pruefe(true, "");
}
const liesKacheln = (page, mount) => page.evaluate((m) => [...document.querySelectorAll(`#${m} g[data-rolle="kachel"]`)].map((g) => {
  const r = g.querySelector("rect");
  return { art: g.dataset.art, teil: g.dataset.teil, zeile: g.dataset.zeile, rest: r.classList.contains("tm-rest"), x: +r.getAttribute("x"), y: +r.getAttribute("y"), w: +r.getAttribute("width"), h: +r.getAttribute("height") };
}), mount);
const texte = (page, mount) => page.evaluate((m) => Object.fromEntries([...document.querySelectorAll(`#${m} [data-rolle]`)].filter((e) => e.tagName === "text").map((e) => [e.dataset.rolle, e.textContent])), mount);

const liesRechtecke = (page, mount) => page.evaluate((m) => [...document.querySelectorAll(`#${m} rect[data-rolle]`)].map((r) => ({
  rolle: r.dataset.rolle, teil: r.dataset.teil, klasse: r.getAttribute("class"), x: +r.getAttribute("x"), y: +r.getAttribute("y"), w: +r.getAttribute("width"), h: +r.getAttribute("height"),
})), mount);
const bilanzZahlen = (page, id) => page.evaluate((i) => ({ links: document.querySelector(`#${i} [data-rolle="links"]`)?.textContent, rechts: document.querySelector(`#${i} [data-rolle="rechts"]`)?.textContent }), id);
const flaecheVon = (r) => r.w * r.h;
const schnitt = (a, b) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));

// ── 1. (a + b)² ───────────────────────────────────────────────────────────

async function erste(page) {
  for (const [a, b] of [[2, 1], [5, 3], [8, 5], [4, 4]]) {
    await setzeRegler(page, "bf1-a", a); await setzeRegler(page, "bf1-b", b);
    const wo = `(a + b)², a = ${a}, b = ${b}`;
    let anfang = null;
    for (const t of [0, 40, 100]) {
      await setzeRegler(page, "bf1-t", t);
      const r = await liesRechtecke(page, "bf1-mount");
      const w2 = `${wo}, ${t} %`;
      const teil = Object.fromEntries(r.filter((x) => x.rolle === "teil").map((x) => [x.teil, x]));
      pruefe(["a2", "ab1", "ab2", "b2"].every((n) => teil[n]), `${w2}: es fehlt ein Teil`);
      const S = teil.a2.w / a;
      const passt = (x, w, h) => Math.abs(x.w - w * S) < 0.05 && Math.abs(x.h - h * S) < 0.05;
      pruefe(passt(teil.a2, a, a) && passt(teil.ab1, b, a) && passt(teil.ab2, a, b) && passt(teil.b2, b, b), `${w2}: die Teile haben nicht die Maße a², ab, ab, b²`);
      const liste = Object.values(teil);
      keineUeberdeckung(liste, w2);
      if (t === 0) {
        anfang = teil;
        const x0 = Math.min(...liste.map((x) => x.x)), y0 = Math.min(...liste.map((x) => x.y));
        const x1 = Math.max(...liste.map((x) => x.x + x.w)), y1 = Math.max(...liste.map((x) => x.y + x.h));
        pruefe(Math.abs(x1 - x0 - (a + b) * S) < 0.05 && Math.abs(y1 - y0 - (a + b) * S) < 0.05 && Math.abs(liste.reduce((s, x) => s + flaecheVon(x), 0) - ((a + b) * S) ** 2) < 1, `${w2}: die Teile füllen das Quadrat (a + b)² nicht genau aus`);
      } else {
        const d = (n) => [teil[n].x - anfang[n].x, teil[n].y - anfang[n].y];
        const [da, d1, d2, db] = ["a2", "ab1", "ab2", "b2"].map(d);
        pruefe(Math.abs(da[0]) < 0.01 && Math.abs(da[1]) < 0.01 && d1[0] > 0 && Math.abs(d1[1]) < 0.01 && Math.abs(d2[0]) < 0.01 && d2[1] > 0 && Math.abs(db[0] - d1[0]) < 0.01 && Math.abs(db[1] - d2[1]) < 0.01, `${w2}: die Teile rücken nicht in ihre Richtungen`);
      }
      const z = await bilanzZahlen(page, "bf1-bilanz");
      pruefe(zahl(z.links) === (a + b) ** 2 && zahl(z.rechts) === a * a + 2 * a * b + b * b, `${w2}: die Bilanz nennt ${z.links} und ${z.rechts}`);
    }
  }
  await setzeRegler(page, "bf1-t", 0);
}

// ── 2. (a − b)² ───────────────────────────────────────────────────────────

async function zweite(page) {
  for (const [a, b] of [[4, 1], [6, 2], [9, 3], [4, 3]]) {
    await setzeRegler(page, "bf2-a", a);
    const gb = await setzeRegler(page, "bf2-b", b);
    pruefe(gb === b && b < a, `(a − b)²: b steht auf ${gb}`);
    const wo = `(a − b)², a = ${a}, b = ${b}`;
    let anfang = null;
    for (const t of [0, 50, 100]) {
      await setzeRegler(page, "bf2-t", t);
      const r = await liesRechtecke(page, "bf2-mount");
      const w2 = `${wo}, ${t} %`;
      const eins = (rolle, teil) => r.find((x) => x.rolle === rolle && (teil === undefined || x.teil === teil));
      const um = eins("umriss"), rest = eins("rest"), R = eins("streifen", "rechts"), U = eins("streifen", "unten"), eR = eins("ecke", "rechts"), eU = eins("ecke", "unten");
      const S = um.w / a;
      pruefe(Math.abs(um.h - um.w) < 0.01 && Math.abs(rest.w - (a - b) * S) < 0.05 && Math.abs(rest.h - (a - b) * S) < 0.05 && Math.abs(rest.x - um.x) < 0.01 && Math.abs(rest.y - um.y) < 0.01, `${w2}: der Rest ist nicht das Quadrat (a − b)² in der Ecke von a²`);
      pruefe(Math.abs(R.w - b * S) < 0.05 && Math.abs(R.h - a * S) < 0.05 && Math.abs(U.w - a * S) < 0.05 && Math.abs(U.h - b * S) < 0.05, `${w2}: die Streifen sind nicht a × b`);
      // Das Eckquadrat b² liegt in jedem Streifen am Ende zur Ecke hin.
      pruefe(Math.abs(eR.w - b * S) < 0.05 && Math.abs(eR.h - b * S) < 0.05 && Math.abs(eR.x - R.x) < 0.05 && Math.abs(eR.y - (R.y + (a - b) * S)) < 0.05, `${w2}: das Eckquadrat im rechten Streifen sitzt falsch`);
      pruefe(Math.abs(eU.w - b * S) < 0.05 && Math.abs(eU.h - b * S) < 0.05 && Math.abs(eU.y - U.y) < 0.05 && Math.abs(eU.x - (U.x + (a - b) * S)) < 0.05, `${w2}: das Eckquadrat im unteren Streifen sitzt falsch`);
      if (t === 0) {
        anfang = { R, U };
        // Zu Anfang: Die Streifen überdecken sich genau im Eckquadrat, und mit dem Rest füllen sie a².
        pruefe(Math.abs(schnitt(R, U) - (b * S) ** 2) < 1, `${w2}: die Streifen überdecken sich in ${schnitt(R, U).toFixed(0)} statt im Eckquadrat ${((b * S) ** 2).toFixed(0)}`);
        const gesamt = flaecheVon(rest) + flaecheVon(R) + flaecheVon(U) - schnitt(R, U);
        pruefe(Math.abs(gesamt - flaecheVon(um)) < 1 && schnitt(rest, R) < 0.5 && schnitt(rest, U) < 0.5, `${w2}: Rest und Streifen füllen a² nicht genau aus`);
      } else {
        const dR = [R.x - anfang.R.x, R.y - anfang.R.y], dU = [U.x - anfang.U.x, U.y - anfang.U.y];
        pruefe(dR[0] > 0 && Math.abs(dR[1]) < 0.01 && dU[1] > 0 && Math.abs(dU[0]) < 0.01 && Math.abs(dR[0] - dU[1]) < 0.01, `${w2}: die Streifen werden nicht gleich weit nach außen gezogen`);
        if (t === 100) pruefe(schnitt(R, U) < 0.5 && schnitt(R, um) < 0.5 && schnitt(U, um) < 0.5, `${w2}: die Streifen liegen noch im Quadrat`);
      }
      const z = await bilanzZahlen(page, "bf2-bilanz");
      pruefe(zahl(z.links) === (a - b) ** 2 && zahl(z.rechts) === a * a - 2 * a * b + b * b, `${w2}: die Bilanz nennt ${z.links} und ${z.rechts}`);
    }
  }
  await setzeRegler(page, "bf2-t", 0);
}

// ── 3. (a + b)(a − b) ─────────────────────────────────────────────────────

// Überdecken sich zwei konvexe Vielecke (mehr als 0,5 px tief)? Trennachsen-Test.
function ueberdecken(p, q) {
  for (const poly of [p, q]) {
    for (let i = 0; i < poly.length; i++) {
      const [x1, y1] = poly[i], [x2, y2] = poly[(i + 1) % poly.length];
      const n = [y2 - y1, x1 - x2], l = Math.hypot(...n);
      const proj = (pts) => pts.map(([x, y]) => (x * n[0] + y * n[1]) / l);
      const a = proj(p), b = proj(q);
      if (Math.max(...a) - Math.min(...b) < 0.5 || Math.max(...b) - Math.min(...a) < 0.5) return false;
    }
  }
  return true;
}
const abstand = ([x1, y1], [x2, y2]) => Math.hypot(x2 - x1, y2 - y1);
async function dritte(page) {
  for (const [a, b] of [[4, 1], [6, 2], [9, 3], [5, 3]]) {
    await setzeRegler(page, "bf3-a", a); await setzeRegler(page, "bf3-b", b);
    const wo = `(a + b)(a − b), a = ${a}, b = ${b}`;
    for (const t of [0, 20, 40, 55, 70, 85, 100]) {
      await setzeRegler(page, "bf3-t", t);
      const w2 = `${wo}, ${t} %`;
      const d = await page.evaluate(() => {
        const o = document.querySelector('#bf3-mount [data-rolle="oben"]'), w = document.querySelector('#bf3-mount [data-rolle="weg"]');
        const r = (e) => ({ x: +e.getAttribute("x"), y: +e.getAttribute("y"), w: +e.getAttribute("width"), h: +e.getAttribute("height") });
        const pts = document.querySelector('#bf3-mount [data-rolle="streifen"]').getAttribute("points").trim().split(/\s+/).map((p) => p.split(",").map(Number));
        return { oben: r(o), weg: r(w), pts };
      });
      const S = d.oben.w / a;
      const { oben, pts } = d;
      pruefe(Math.abs(oben.h - (a - b) * S) < 0.05, `${w2}: der obere Teil ist nicht a × (a − b)`);
      // Starr: ein Rechteck mit den Seiten (a − b) und b, rechtwinklig.
      const s = [0, 1, 2, 3].map((i) => abstand(pts[i], pts[(i + 1) % 4]));
      const diag = [abstand(pts[0], pts[2]), abstand(pts[1], pts[3])];
      pruefe(Math.abs(s[0] - (a - b) * S) < 0.05 && Math.abs(s[1] - b * S) < 0.05 && Math.abs(s[2] - s[0]) < 0.05 && Math.abs(s[3] - s[1]) < 0.05 && Math.abs(diag[0] - diag[1]) < 0.05, `${w2}: der Streifen ist kein Rechteck (a − b) × b mehr (${s.map((v) => v.toFixed(1))})`);
      const obenPts = [[oben.x, oben.y], [oben.x + oben.w, oben.y], [oben.x + oben.w, oben.y + oben.h], [oben.x, oben.y + oben.h]];
      pruefe(!ueberdecken(pts, obenPts), `${w2}: der Streifen überdeckt den oberen Teil`);
      const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
      const box = { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
      if (t === 0) pruefe(Math.abs(box.x - oben.x) < 0.05 && Math.abs(box.y - (oben.y + oben.h)) < 0.05 && Math.abs(box.w - (a - b) * S) < 0.05 && Math.abs(box.h - b * S) < 0.05, `${w2}: der Streifen liegt zu Anfang nicht unter dem oberen Teil`);
      if (t === 0) pruefe(Math.abs(d.weg.x - (oben.x + (a - b) * S)) < 0.05 && Math.abs(d.weg.y - (oben.y + oben.h)) < 0.05 && Math.abs(d.weg.w - b * S) < 0.05, `${w2}: das weggenommene Eckquadrat sitzt falsch`);
      if (t === 100) pruefe(Math.abs(box.x - (oben.x + oben.w)) < 0.05 && Math.abs(box.y - oben.y) < 0.05 && Math.abs(box.w - b * S) < 0.05 && Math.abs(box.h - (a - b) * S) < 0.05, `${w2}: der Streifen bildet mit dem oberen Teil kein Rechteck (a + b) × (a − b)`);
      const z = await bilanzZahlen(page, "bf3-bilanz");
      pruefe(zahl(z.links) === a * a - b * b && zahl(z.rechts) === (a + b) * (a - b), `${w2}: die Bilanz nennt ${z.links} und ${z.rechts}`);
    }
  }
  await setzeRegler(page, "bf3-t", 0);
}

// ── 4. Rückwärts und im Kopf ──────────────────────────────────────────────

// Welche Formel passt zur Gestalt? Hier selbst entschieden: Bei Zahlen aus dem ersten Schritt, bei
// Termen aus dem Produkt am Ende.
function formelVon(schritt) {
  if (/^\(.+\) · \(.+\)$/.test(schritt)) return 3;
  const m = schritt.match(/^\((.+)\)²$/);
  if (!m) return null;
  return /−/.test(m[1]) ? 2 : 1;
}
const NAME5 = { 1: "erste", 2: "zweite", 3: "dritte" };
async function anwenden(page) {
  const n = await page.evaluate(() => document.getElementById("bf4-term").options.length);
  for (let i = 0; i < n; i++) {
    await waehle(page, "bf4-term", String(i));
    const start = await optionText(page, "bf4-term");
    const wo = `Rückwärts „${start}“`;
    const gesetzt = await setzeRegler(page, "bf4-schritt", 3);
    const s = await page.evaluate(() => [...document.querySelectorAll('#bf4-mount [data-rolle="schritt"]')].map((e) => e.dataset.term));
    pruefe(gesetzt === s.length - 1, `${wo}: der Regler steht auf ${gesetzt}, es gibt ${s.length - 1} Schritte`);
    pruefe(normal(s[0]) === normal(start), `${wo}: der Rechenweg beginnt mit „${s[0]}“`);
    const mitX = /x/.test(start);
    if (mitX) s.forEach((z, j) => pruefe(P.gleichwertig(z, start, ["x"]), `${wo}: Schritt ${j} „${z}“ ist nicht gleichwertig`));
    else s.forEach((z, j) => pruefe(P.wert(z, {}) === P.wert(start, {}), `${wo}: Schritt ${j} „${z}“ ergibt ${P.wert(z, {})} statt ${P.wert(start, {})}`));
    const ende = s[s.length - 1];
    if (mitX) pruefe(P.istProdukt(ende), `${wo}: am Ende steht kein Produkt, sondern „${ende}“`);
    else pruefe(/^\d+$/.test(ende), `${wo}: am Ende steht keine Zahl, sondern „${ende}“`);
    const f = formelVon(mitX ? ende : s[1]);
    const text = await page.evaluate(() => document.getElementById("bf4-text").innerText);
    pruefe(f !== null && text.includes(`${NAME5[f]}n binomischen Formel`), `${wo}: hier die ${NAME5[f]} Formel, die Seite sagt „${text}“`);
  }
}

// ── Kontrollfragen ────────────────────────────────────────────────────────

async function quizze(page) {
  const ids = await page.evaluate(() => [...document.querySelectorAll(".quiz")].map((e) => e.id));
  pruefe(ids.length === 4, `Kontrollfragen: ${ids.length} statt 4`);
  for (const sec of ["sec-erste", "sec-zweite", "sec-dritte", "sec-anwenden"]) {
    pruefe(await page.evaluate((x) => document.querySelectorAll(`#${x} .quiz`).length === 1, sec), `Kontrollfragen: ${sec} hat nicht genau eine`);
  }
  const RICHTIG = {
    "quiz-erste": (o) => P.gleichwertig(o, "(x + 4)^2", ["x"]),
    "quiz-zweite": (o) => P.gleichwertig(o, "(2a - 3)^2", ["a"]),
    "quiz-dritte": (o) => zahl(o) === 21 * 19,
    "quiz-anwenden": (o) => P.gleichwertig(o, "x^2 - 10x + 25", ["x"]) && P.istProdukt(o),
  };
  const stellen = [];
  for (const id of ids) {
    const optionen = await page.evaluate((q) => [...document.querySelectorAll(`#${q} .quiz-opt`)].map((b) => b.textContent.trim()), id);
    pruefe(optionen.length === 4 && new Set(optionen).size === 4, `Quiz ${id}: keine vier verschiedenen Antworten`);
    let richtige = 0;
    for (let i = 0; i < optionen.length; i++) {
      await page.locator(`#${id} .quiz-opt`).nth(i).click();
      const r = await page.evaluate((q) => { const f = document.querySelector(`#${q} .quiz-feedback`); return { ok: f.classList.contains("ok"), text: f.textContent }; }, id);
      if (r.ok) { richtige++; stellen.push(i); }
      pruefe(r.ok === RICHTIG[id](optionen[i]), `Quiz ${id}: „${optionen[i]}“ gilt als ${r.ok ? "richtig" : "falsch"} — nachgerechnet ist es umgekehrt`);
      pruefe(r.text.length > 80, `Quiz ${id}: die Erklärung ist nur ${r.text.length} Zeichen lang`);
    }
    pruefe(richtige === 1, `Quiz ${id}: ${richtige} richtige Antworten`);
  }
  pruefe(new Set(stellen).size >= 3, `Kontrollfragen: die richtige Antwort steht nur an ${new Set(stellen).size} verschiedenen Stellen`);
}

// ── Die Übungsaufgaben ────────────────────────────────────────────────────

function bau(glieder) {
  const g = glieder.filter(([k]) => Math.abs(k) > 1e-9).reverse();
  if (!g.length) return "0";
  return g.map(([k, v], i) => {
    const b = Math.abs(k);
    const kern = v === "" ? String(b) : (b === 1 ? "" : String(b)) + v;
    return i === 0 ? (k < 0 ? "−" : "") + kern : (k < 0 ? " − " : " + ") + kern;
  }).join("");
}
const quad = (t) => { const f = (x) => P.wert(t, { x }); const c0 = f(0); return { c2: (f(1) + f(-1)) / 2 - c0, c1: (f(1) - f(-1)) / 2, c0 }; };
const qbau = (q) => bau([[q.c2, "x^2"], [q.c1, "x"], [q.c0, ""]]);
const termAus = (frage, vor) => { const m = frage.match(new RegExp(vor + " (.+?) Schreibweise:")); return m && m[1]; };
const mx = (m) => (m === 1 ? "x" : `${m}x`);

// Die Schranken für `mindestensVerschieden` sind gemessen (tests/werkzeug-streuung.js, 20 Züge):
// E1 n ≈ 20, E2 n ≈ 20, E3 n ≈ 40, E4 n ≈ 30, E5 n ≈ 55, E6 n ≈ 71, E7 n ≈ 24, E8 n ≈ 40.
const SCHRANKE = [7, 7, 9, 8, 11, 11, 8, 10];
const RUNDEN = 20;

// Welche Fassungen gezogen wurden — eine Fassung, deren Lösung mit einem Fehlerwert zusammenfällt,
// siebt die Kollisionsprüfung jedes Mal aus, und sie fiele lautlos aus dem Vorrat.
const FASSUNGEN = { E6: new Set() };
async function aufgaben(page) {
  await pruefeAufgabe(page, bericht, {
    nr: 1, name: "E1 Erste oder zweite Formel", runden: RUNDEN, mindestensVerschieden: SCHRANKE[0],
    deute: (frage) => {
      const m = frage.match(/mit der (erste|zweite)n binomischen Formel aus: \(x ([+−]) (\d+)\)²/);
      if (!m) return null;
      const s = m[2] === "+" ? 1 : -1, a = Number(m[3]);
      pruefe((m[1] === "erste") === (s > 0), `E1: „${m[1]}“ passt nicht zum Vorzeichen — „${frage}“`);
      return {
        richtig: qbau(quad(`(x ${s > 0 ? "+" : "-"} ${a})^2`)),
        falsch: [[bau([[1, "x^2"], [a * a, ""]]), "gemischte Glied fehlt"], [bau([[1, "x^2"], [s * a, "x"], [a * a, ""]]), "DOPPELTE"], [bau([[1, "x^2"], [2 * s * a, "x"], [-a * a, ""]]), "nie negativ"], [bau([[1, "x^2"], [2 * s * a, "x"], [2 * a, ""]]), `${a} · 2`]],
      };
    },
  });

  await pruefeAufgabe(page, bericht, {
    nr: 2, name: "E2 Dritte Formel", runden: RUNDEN, mindestensVerschieden: SCHRANKE[1],
    deute: (frage) => {
      const term = termAus(frage, "Multipliziere mit der dritten binomischen Formel aus:");
      const m = term && term.match(/^\((.+?)\) · \((.+?)\)$/);
      if (!m) return null;
      const q = quad(term);
      const umgekehrt = /^\d/.test(m[1]);
      const a2 = Math.abs(q.c0);
      return {
        richtig: qbau(q),
        falsch: umgekehrt ? [[bau([[1, "x^2"], [-a2, ""]]), "Zahl vorn"], [bau([[1, "x^2"], [a2, ""]]), "Plus mal Minus"]]
          : [[bau([[1, "x^2"], [a2, ""]]), "Plus mal Minus"], [bau([[1, "x^2"], [-2 * Math.sqrt(a2), "x"], [-a2, ""]]), "heben sich"]],
      };
    },
  });

  await pruefeAufgabe(page, bericht, {
    nr: 3, name: "E3 Zahl vor x", runden: RUNDEN, mindestensVerschieden: SCHRANKE[2],
    deute: (frage) => {
      const term = termAus(frage, "Multipliziere aus:");
      const m = term && term.match(/^\((\d+)x ([+−]) (\d+)\)²$/);
      if (!m) return null;
      const mm = Number(m[1]), s = m[2] === "+" ? 1 : -1, a = Number(m[3]);
      return {
        richtig: qbau(quad(`(${mm}x ${s > 0 ? "+" : "-"} ${a})^2`)),
        falsch: [[bau([[mm, "x^2"], [2 * s * mm * a, "x"], [a * a, ""]]), "Auch die Zahl vor x"], [bau([[mm * mm, "x^2"], [a * a, ""]]), "gemischte Glied fehlt"], [bau([[mm * mm, "x^2"], [s * mm * a, "x"], [a * a, ""]]), "doppelte Produkt"], [bau([[mm * mm, "x^2"], [2 * s * mm * a, "x"], [-a * a, ""]]), "positiv"]],
      };
    },
  });

  await pruefeAufgabe(page, bericht, {
    nr: 4, name: "E4 Zwei Variablen", runden: RUNDEN, mindestensVerschieden: SCHRANKE[3],
    deute: (frage) => {
      const term = termAus(frage, "Multipliziere aus:");
      if (!term || !/b/.test(term)) return null;
      const f = (a, b) => P.wert(term, { a, b });
      const aa = f(1, 0), bb = f(0, 1), ab = f(1, 1) - aa - bb;
      const p = Math.sqrt(aa), q = Math.sqrt(Math.abs(bb));
      const drei = / · /.test(term);
      if (drei) return { richtig: bau([[aa, "a^2"], [bb, "b^2"]]), falsch: [[bau([[aa, "a^2"], [-bb, "b^2"]]), "Plus mal Minus"], [bau([[p, "a^2"], [-q, "b^2"]]), "auch die Zahlen"]] };
      const s = Math.sign(ab);
      return {
        richtig: bau([[aa, "a^2"], [ab, "ba"], [bb, "b^2"]]),
        falsch: [[bau([[aa, "a^2"], [bb, "b^2"]]), "gemischte Glied fehlt"], [bau([[aa, "a^2"], [s * p * q, "ab"], [bb, "b^2"]]), "doppelte Produkt"], [bau([[p, "a^2"], [ab, "ab"], [q, "b^2"]]), "auch die Zahlen"]],
      };
    },
  });

  await pruefeAufgabe(page, bericht, {
    nr: 5, name: "E5 Rückwärts", runden: RUNDEN, mindestensVerschieden: SCHRANKE[4],
    deute: (frage) => {
      const term = termAus(frage, "Schreibe als Produkt — mit einer binomischen Formel rückwärts:");
      if (!term) return null;
      const q = quad(term);
      const m = Math.sqrt(q.c2), a = Math.sqrt(Math.abs(q.c0));
      pruefe(Number.isInteger(m) && Number.isInteger(a), `E5: ${term} hat keine Quadrate als äußere Glieder`);
      if (q.c1 === 0) {
        pruefe(q.c0 < 0, `E5: ${term} ist keine Differenz zweier Quadrate`);
        // Die Faktoren vertauscht eingetippt: Auch so muss es gelten.
        return { richtig: `(${mx(m)} − ${a})(${a} + ${mx(m)})`, falsch: [[term, "Produktform"], [`(${mx(m)} − ${a})^2`, "gemischtes Glied"]] };
      }
      pruefe(Math.abs(q.c1) === 2 * m * a && q.c0 > 0, `E5: das mittlere Glied von ${term} ist nicht das doppelte Produkt`);
      const s = Math.sign(q.c1);
      return {
        richtig: s > 0 ? `(${a} + ${mx(m)})^2` : `(${a} − ${mx(m)})²`,
        falsch: [[term, "Produktform"], [`(${mx(m)} ${s > 0 ? "−" : "+"} ${a})^2`, "Vorzeichen in der Klammer"], [`(${mx(m)} + ${a})(${mx(m)} − ${a})`, "dritte Formel"]],
      };
    },
  });

  await pruefeAufgabe(page, bericht, {
    nr: 6, name: "E6 Kopfrechnen", runden: RUNDEN, mindestensVerschieden: SCHRANKE[5],
    deute: (frage) => {
      let m = frage.match(/binomischen Formel: (\d+)²/);
      FASSUNGEN.E6.add(m ? "quadrat" : "produkt");
      if (m) {
        const n = Number(m[1]), z = Math.round(n / 10) * 10, d = Math.abs(n - z), s = Math.sign(n - z);
        return { richtig: n * n, toleranz: 0.5, falsch: [[z * z + d * d, "gemischte Glied fehlt"], [z * z + s * z * d + d * d, "doppelte Produkt"], [z * z + 2 * s * z * d - d * d, "addiert"]] };
      }
      m = frage.match(/binomischen Formel: (\d+) · (\d+)/);
      if (!m) return null;
      const p = Number(m[1]), q = Number(m[2]), z = (p + q) / 2, d = (q - p) / 2;
      return { richtig: p * q, toleranz: 0.5, falsch: [[z * z, `nur ${z}²`], [z * z + d * d, "abgezogen"]] };
    },
  });

  await pruefeAufgabe(page, bericht, {
    nr: 7, name: "E7 Zwei Formeln", runden: RUNDEN, mindestensVerschieden: SCHRANKE[6],
    deute: (frage) => {
      const term = termAus(frage, "Vereinfache mit den binomischen Formeln:");
      const m = term && term.match(/^(.+?) − (\(x [+−] \d+\)(?:²| · \(x [+−] \d+\)))$/);
      if (!m) return null;
      const erst = quad(m[1]), zweit = quad(m[2]);
      // Das Minus nur vor x² des zweiten Teils, oder gar nicht.
      const nurVorne = { c2: erst.c2 + zweit.c2 - 2, c1: erst.c1 + zweit.c1, c0: erst.c0 + zweit.c0 };
      const garNicht = { c2: erst.c2 + zweit.c2, c1: erst.c1 + zweit.c1, c0: erst.c0 + zweit.c0 };
      return { richtig: qbau(quad(term)), falsch: [[qbau(nurVorne), "ganze"], [qbau(garNicht), "abgezogen"]] };
    },
  });

  await pruefeAufgabe(page, bericht, {
    nr: 8, name: "E8 Lücken", runden: RUNDEN, mindestensVerschieden: SCHRANKE[7],
    deute: (frage) => {
      const m = frage.match(/\(□ ([+−]) □\)² = (.+?) Schreibweise:/);
      if (!m) return null;
      const q = quad(m[2]);
      const mm = Math.sqrt(q.c2), a = Math.sqrt(q.c0), s = m[1] === "+" ? 1 : -1;
      pruefe(Number.isInteger(mm) && Number.isInteger(a) && q.c1 === 2 * s * mm * a, `E8: ${m[2]} passt nicht zu (□ ${m[1]} □)²`);
      return {
        felder: [mx(mm), a],
        falschFelder: [[0, `${mm * mm}x`, "quadriert"], [0, `${mm * mm}x^2`, "schon das Quadrat"], [1, a * a, "schon das Quadrat"], [1, mm * a, "gemischte Glied"], [1, 2 * mm * a, "Teile noch"]],
      };
    },
  });

  // Ein Drittel der Kopfrechenaufgaben sind Produkte: In 20 Zügen fehlen sie nur mit (2/3)²⁰ ≈ 0,03 ‰.
  pruefe(FASSUNGEN.E6.has("quadrat") && FASSUNGEN.E6.has("produkt"), `E6: gezogen wurden nur ${[...FASSUNGEN.E6]} — eine Fassung fällt aus dem Vorrat`);
}

// ── Gerüst ────────────────────────────────────────────────────────────────

async function geruest(page) {
  const folge = await page.evaluate(() => [...document.querySelectorAll("main section[id]")].map((x) => x.id));
  const soll = ["sec-erste", "sec-zweite", "sec-dritte", "sec-anwenden", "sec-vernetzung", "sec-formelsammlung", "sec-uebungen", "sec-selbsteinschaetzung"];
  pruefe(JSON.stringify(folge) === JSON.stringify(soll), `Gerüst: Abschnitte ${folge.join(", ")} statt ${soll.join(", ")}`);
  // Jede Formel stützt sich auch auf Thema 4: Sie wird Glied für Glied ausmultipliziert — und das
  // ausmultiplizierte Produkt in der Merkbox ist wirklich gleichwertig mit der Formel.
  const FORMEL = { "sec-erste": ["(a + b)^2", "a^2 + 2ab + b^2"], "sec-zweite": ["(a - b)^2", "a^2 - 2ab + b^2"], "sec-dritte": ["(a + b)*(a - b)", "a^2 - b^2"] };
  for (const [id, [l, r]] of Object.entries(FORMEL)) {
    const t = await page.evaluate((i) => document.querySelector(`#${i} .wissen-box`).innerText, id);
    pruefe(/Glied für Glied/.test(t), `Gerüst: ${id} leitet die Formel nicht auch Glied für Glied her`);
    pruefe(P.gleichwertig(l, r, ["a", "b"]), `Gerüst: die Formel in ${id} stimmt nicht`);
    pruefe(t.includes(r.replace(/\^2/g, "²").replace(/ - /g, " − ").replace(/\*/g, " · ")), `Gerüst: ${id} nennt die Formel nicht als ${r}`);
  }
  const verweis = await page.evaluate(() => { const a = document.querySelector("#sec-formelsammlung a[download]"); return a && a.getAttribute("href"); });
  pruefe(verweis === "formelsammlung.pdf", `Formelsammlung: Verweis auf „${verweis}“`);
  const pdf = path.join(WURZEL, "mathematik/klasse-8/terme/formelsammlung.pdf");
  pruefe(fs.existsSync(pdf) && fs.readFileSync(pdf).subarray(0, 5).toString("latin1") === "%PDF-", "Formelsammlung: formelsammlung.pdf fehlt oder ist kein PDF");
  const links = await page.evaluate(() => [...document.querySelectorAll("main a[href]")].map((a) => a.getAttribute("href")).filter((h) => !h.startsWith("#") && !h.startsWith("http")));
  for (const href of new Set(links)) {
    const ziel = new URL(href.split("#")[0], "http://localhost/mathematik/klasse-8/terme/").pathname;
    const antwort = await page.request.get("http://localhost:" + (process.env.UPLANT_PORT || "8936") + ziel);
    pruefe(antwort.ok(), `Gerüst: der Verweis „${href}“ führt ins Leere`);
    const anker = href.split("#")[1];
    if (anker && antwort.ok() && /\.html$/.test(ziel)) pruefe((await antwort.text()).includes(`id="${anker}"`), `Gerüst: die Sprungmarke „${anker}“ fehlt in ${ziel}`);
  }
  const menue = fs.readFileSync(path.join(WURZEL, "mathematik/klasse-8/terme/index.html"), "utf8");
  const karte = menue.match(/<a class="menu-card"[^>]*href="binomische-formeln\.html"[^>]*>\s*<h2>([^<]*)<\/h2>/);
  pruefe(!!karte && /data-section="klasse-8"/.test(karte[0]) && /\shidden\b/.test(karte[0]) && karte[1] === "5. Binomische Formeln anwenden", "Gerüst: die Menükarte fehlt oder ist unvollständig");
  const proStufe = await page.evaluate(() => [...document.querySelectorAll("#exercises-mount .schwierigkeit-tabs button")].map((t) => { t.click(); return document.querySelectorAll("#exercises-mount .schwierigkeit-tab-panel .aufgabe-box").length; }));
  pruefe(JSON.stringify(proStufe) === "[2,2,2,2]", `Gerüst: die Stufen haben ${proStufe.join("/")} Aufgaben statt 2/2/2/2`);
}

// Ein Teil, der abbricht (etwa weil ein Aufgabengenerator der Seite wirft und die Aufgabe nie
// erscheint), ist ein Fehler — gemeldet wird er trotzdem, und die übrigen Teile laufen weiter.
async function teil(name, fn, page) {
  if (!will(name)) return;
  try {
    await fn(page);
  } catch (e) {
    pruefe(false, `${name}: Abbruch — ${String(e && e.message).split("\n")[0]}`);
  }
}

(async () => {
  const browser = await starteBrowser();
  for (const dunkel of [false, true]) {
    const wo = dunkel ? "dunkel" : "hell";
    const page = await neueSeite(browser, { dunkel });
    await oeffne(page, SEITE);
    if (!dunkel) {
      await teil("geruest", geruest, page);
      await teil("erste", erste, page);
      await teil("zweite", zweite, page);
      await teil("dritte", dritte, page);
      await teil("anwenden", anwenden, page);
      await teil("quizze", quizze, page);
      await teil("aufgaben", aufgaben, page);
    } else if (will("dunkel")) {
      await setzeRegler(page, "bf1-t", 100);
      await setzeRegler(page, "bf2-t", 50);
      await pruefeKontrast(page, bericht, "dunkel");
      await pruefeStrichKontrast(page, bericht, "dunkel, Flächen", "#bf1-mount rect, #bf2-mount rect, #bf3-mount rect, #bf3-mount polygon");
      // Die Namen a², ab, b² stehen auf den farbigen Teilen — gemessen gegen die Fläche darunter.
      await setzeRegler(page, "bf2-t", 100);
      await pruefeTextAufFlaeche(page, bericht, "dunkel, Namen in den Flächen", "#bf1-mount text[data-rolle=name], #bf2-mount text[data-rolle=name]");
    }
    await pruefeNotation(page, bericht, wo);
    for (const s of page.stoerungen) pruefe(false, `${wo}: ${s}`);
    await page.close();
  }
  await browser.close();
  bericht.abschluss();
})();
