// Fachliche Prüfung: Klasse 8, Körper, Thema 3 „Volumen von Prismen“.
//
// Nachgerechnet wird aus den Raumpunkten der Zeichnungen (data-p3) mit eigenen Verfahren
// (tests/lib/koerper.js; Rauminhalte über Tetraeder von der Körpermitte aus):
//
//   1. WÜRFEL: so viele Einheitswürfel wie angezeigt, alle im Quader, keiner doppelt, Schicht für
//      Schicht von unten gefüllt; V = a · b · h.
//   2. DREIECKSPRISMA: Blau und Orange füllen zu Anfang genau den Quader, überdecken sich nie, jedes
//      Stück bleibt starr; am Ende ist jedes orange Stück ein verschobenes Abbild des blauen Teils auf
//      seiner Seite der Höhe — also ist Blau der halbe Quader.
//   3. ZERLEGEN: Die Teile decken die Grundfläche genau ab, werden nur verschoben; G und V = G · h
//      stimmen mit den gezeichneten Teilen.
//   4. EINHEITEN: Platten, Stangen und Würfel haben ihre Maße, überdecken sich nicht und sind
//      zusammen immer 1000 cm³.
//   Dazu die Kontrollfragen, alle Aufgaben mit ihren Fehlern, das Gerüst und der Dunkelmodus.

"use strict";

const { neuerBericht } = require("../lib/pruefen");
const { starteBrowser, neueSeite, oeffne, setzeRegler } = require("../lib/seite");
const { pruefeNotation } = require("../lib/notation");
const { pruefeKontrast, pruefeStrichKontrast, pruefeTextAufFlaeche } = require("../lib/kontrast");
const { pruefeAufgabe, zahl } = require("../lib/aufgaben");
const K = require("../lib/koerper");
const fs = require("fs");
const path = require("path");

const bericht = neuerBericht();
const { pruefe } = bericht;
const SEITE = "/mathematik/klasse-8/koerper/volumen-prisma.html";
const WURZEL = path.resolve(__dirname, "..", "..");
const NUR = (process.env.UPLANT_NUR || "").split(",").map((t) => t.trim()).filter(Boolean);
const will = (teil) => NUR.length === 0 || NUR.includes(teil);
const { sub, dot, cross, dist, schwer, lies, texte, rolleText, waehle, ueberdecken } = K;
const kavalierBild = (teile, wo) => K.kavalierBild(pruefe, teile, wo);
const nahe = (a, b, eps = 1e-6) => Math.abs(a - b) < eps;
const z = (s) => Number(String(s).replace(/\./g, "").replace(",", "."));
const gauss = (P) => Math.abs(P.reduce((s, p, i) => s + p[0] * P[(i + 1) % P.length][1] - P[(i + 1) % P.length][0] * p[1], 0)) / 2;

// Rauminhalt eines konvexen Körpers aus seinen Flächen: Tetraeder von der Körpermitte zu jedem
// Dreieck eines Flächenfächers.
function rauminhalt(flaechen) {
  const m = schwer(flaechen.flat());
  let v = 0;
  for (const f of flaechen) for (let i = 1; i + 1 < f.length; i++) v += Math.abs(dot(sub(f[0], m), cross(sub(f[i], m), sub(f[i + 1], m)))) / 6;
  return v;
}
// Polygone nach einem data-Attribut gruppieren.
const gruppen = (page, mount, attr) => page.evaluate(([m, a]) => {
  const out = {};
  for (const e of document.querySelectorAll(`#${m} polygon[data-p3]`)) {
    const k = e.getAttribute(a);
    if (k === null) continue;
    (out[k] ||= []).push(e.dataset.p3.trim().split(/\s+/).map((s) => s.split(",").map(Number)));
  }
  return out;
}, [mount, attr]);
// Die Vorderfläche (z = 0) eines liegenden Prismas als [x, y]-Vieleck.
const vorn = (fl) => { const f = fl.find((x) => x.every((p) => Math.abs(p[2]) < 1e-6)); return f && f.map((p) => [p[0], p[1]]); };
const eckenAlle = (fl) => { const s = new Map(); fl.flat().forEach((p) => s.set(p.map((x) => x.toFixed(3)).join(","), p)); return [...s.values()].sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]); };
const profil = (pts) => { const d = []; for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) d.push(dist(pts[i], pts[j])); return d.sort((a, b) => a - b); };
const profilGleich = (p, q) => p.length === q.length && profil(p).every((d, i) => Math.abs(d - profil(q)[i]) < 2e-3);
// Sind zwei ebene Vielecke ([x, y]) bis auf eine Verschiebung gleich?
function verschoben(P, Q) {
  if (!P || !Q || P.length !== Q.length) return false;
  const a = [...P].sort((u, v) => u[0] - v[0] || u[1] - v[1]), b = [...Q].sort((u, v) => u[0] - v[0] || u[1] - v[1]);
  const d = [b[0][0] - a[0][0], b[0][1] - a[0][1]];
  return a.every((p, i) => nahe(p[0] + d[0], b[i][0], 2e-3) && nahe(p[1] + d[1], b[i][1], 2e-3));
}

// ── 1. Würfel ──────────────────────────────────────────────────────────────

async function wuerfel(page) {
  for (const [a, b, h] of [[5, 3, 4], [2, 1, 1], [6, 4, 5], [3, 2, 2]]) {
    await setzeRegler(page, "wf-a", a); await setzeRegler(page, "wf-b", b); await setzeRegler(page, "wf-h", h);
    const N = a * b * h;
    for (const tp of [0, 13, 40, 77, 100]) {
      const t = (await setzeRegler(page, "wf-t", tp)) / 100;
      const k = Math.floor(t * N + 1e-9);
      const wo = `Würfel ${a} × ${b} × ${h}, ${tp} %`;
      const teile = await lies(page, "wf-mount");
      if (teile.length) kavalierBild(teile, wo);
      const w = await gruppen(page, "wf-mount", "data-w");
      const lagen = Object.keys(w).map((s) => s.split(",").map(Number));
      pruefe(lagen.length === k, `${wo}: ${lagen.length} Würfel gezeichnet statt ${k}`);
      pruefe(zahl(await rolleText(page, '#wf-bilanz [data-rolle="anzahl"]')) === lagen.length, `${wo}: die Bilanz zählt andere Würfel als gezeichnet`);
      // Jeder Würfel 1 × 1 × 1 an seiner Stelle, im Quader.
      let schief = 0;
      for (const [key, fl] of Object.entries(w)) {
        const [i, l, j] = key.split(",").map(Number);
        const e = eckenAlle(fl);
        if (!(i >= 0 && i < a && l >= 0 && l < h && j >= 0 && j < b) || !e.every((p) => [i, i + 1].some((x) => nahe(p[0], x, 1e-6)) && [l, l + 1].some((y) => nahe(p[1], y, 1e-6)) && [j, j + 1].some((zz) => nahe(p[2], zz, 1e-6)))) schief++;
      }
      pruefe(schief === 0, `${wo}: ${schief} Würfel liegen nicht als Einheitswürfel im Quader`);
      // Schicht für Schicht: Jede Schicht unter der obersten belegten ist voll.
      const proSchicht = new Array(h).fill(0);
      lagen.forEach(([, l]) => proSchicht[l]++);
      const oberste = proSchicht.reduce((m, n, l) => (n > 0 ? l : m), -1);
      pruefe(proSchicht.every((n, l) => l >= oberste || n === a * b), `${wo}: gefüllt wird nicht Schicht für Schicht (${proSchicht.join("/")})`);
      pruefe(zahl(await rolleText(page, '#wf-bilanz [data-rolle="V"]')) === N, `${wo}: V ist nicht a · b · h = ${N}`);
    }
  }
}

// ── 2. Dreiecksprisma ──────────────────────────────────────────────────────

async function dreieck(page) {
  for (const art of ["rw", "bel"]) {
    await waehle(page, "dr-art", art);
    for (const [g, hg, h, pp] of [[4, 3, 2, 40], [6, 4, 4, 80], [3, 2, 1, 20], [5, 4, 3, 55]]) {
      await setzeRegler(page, "dr-g", g); await setzeRegler(page, "dr-hg", hg); await setzeRegler(page, "dr-h", h);
      const anteil = art === "bel" ? (await setzeRegler(page, "dr-p", pp)) / 100 : 0;
      const p = anteil * g;
      let anfang = null;
      for (const tp of [0, 25, 50, 75, 100]) {
        const t = (await setzeRegler(page, "dr-t", tp)) / 100;
        const wo = `Dreiecksprisma ${art} g = ${g}, hg = ${hg}, h = ${h}${art === "bel" ? `, Spitze ${pp} %` : ""}, ${tp} %`;
        kavalierBild(await lies(page, "dr-mount"), wo);
        const st = await gruppen(page, "dr-mount", "data-stueck");
        const namen = Object.keys(st).sort();
        pruefe(JSON.stringify(namen) === JSON.stringify(art === "rw" ? ["blau", "orange0"] : ["blau", "orange0", "orange1"]), `${wo}: Stücke ${namen}`);
        if (t === 0) anfang = Object.fromEntries(namen.map((n) => [n, eckenAlle(st[n])]));
        // Starr: Jedes Stück behält die Abstände seiner Ecken (als sortierte Liste verglichen — beim
        // Drehen ändert sich die Reihenfolge der Ecken, nicht ihre Abstände).
        for (const n of namen) pruefe(profilGleich(eckenAlle(st[n]), anfang[n]), `${wo}: ${n} ist nicht starr geblieben`);
        // Alle Stücke sind liegende Prismen der Tiefe h; ihre Vorderflächen überdecken sich nie.
        const V = Object.fromEntries(namen.map((n) => [n, vorn(st[n])]));
        pruefe(namen.every((n) => V[n] && st[n].flat().every((q) => q[2] > -1e-6 && q[2] < h + 1e-6)), `${wo}: ein Stück ist kein liegendes Prisma der Tiefe ${h}`);
        for (let i = 0; i < namen.length; i++) for (let j = i + 1; j < namen.length; j++) pruefe(!ueberdecken(V[namen[i]], V[namen[j]]), `${wo}: ${namen[i]} und ${namen[j]} überdecken sich`);
        const vol = Object.fromEntries(namen.map((n) => [n, rauminhalt(st[n])]));
        pruefe(nahe(namen.reduce((s, n) => s + vol[n], 0), g * hg * h, 1e-3), `${wo}: alle Stücke zusammen sind nicht der Quader g · hg · h`);
        pruefe(nahe(vol.blau, (g * hg * h) / 2, 1e-3), `${wo}: das blaue Prisma hat ${vol.blau.toFixed(3)} statt ½ · g · hg · h`);
        if (t === 0) {
          const xs = namen.flatMap((n) => V[n].map((q) => q[0])), ys = namen.flatMap((n) => V[n].map((q) => q[1]));
          pruefe(nahe(Math.min(...xs), 0, 1e-6) && nahe(Math.max(...xs), g, 1e-6) && nahe(Math.min(...ys), 0, 1e-6) && nahe(Math.max(...ys), hg, 1e-6), `${wo}: zu Anfang bilden die Stücke nicht den Quader g × hg`);
        }
        if (t === 1) {
          const blauLinks = [[0, 0], [p, 0], [p, hg]], blauRechts = art === "rw" ? [[0, 0], [g, 0], [0, hg]] : [[p, 0], [g, 0], [p, hg]];
          if (art === "rw") pruefe(verschoben(V.orange0, blauRechts), `${wo}: das orange Stück ist am Ende kein verschobenes Abbild des blauen`);
          else {
            pruefe(verschoben(V.orange0, blauLinks), `${wo}: das linke orange Stück ist kein Abbild des blauen Teils links der Höhe`);
            pruefe(verschoben(V.orange1, blauRechts), `${wo}: das rechte orange Stück ist kein Abbild des blauen Teils rechts der Höhe`);
          }
        }
        const b = { Vq: zahl(await rolleText(page, '#dr-bilanz [data-rolle="Vq"]')), V: zahl(await rolleText(page, '#dr-bilanz [data-rolle="V"]')) };
        pruefe(nahe(b.Vq, g * hg * h) && nahe(b.V, (g * hg * h) / 2), `${wo}: die Bilanz nennt ${b.Vq} und ${b.V}`);
      }
    }
  }
}

// ── 3. V = G · h ───────────────────────────────────────────────────────────

const FORMEN = { trapez: [[0, 0], [8, 0], [5, 4], [3, 4]], haus: [[0, 0], [6, 0], [6, 3], [3, 7], [0, 3]], sechseck: [[1.5, 0], [4.5, 0], [6, 2], [4.5, 4], [1.5, 4], [0, 2]] };
async function zerlegen(page) {
  for (const [form, P] of Object.entries(FORMEN)) {
    await waehle(page, "gh-form", form);
    const G = gauss(P);
    for (const h of [2, 5]) {
      const gh = await setzeRegler(page, "gh-h", h);
      let anfang = null;
      for (const tp of [0, 50, 100]) {
        const t = (await setzeRegler(page, "gh-t", tp)) / 100;
        const wo = `Zerlegen ${form}, h = ${gh}, ${tp} %`;
        kavalierBild(await lies(page, "gh-mount"), wo);
        const st = await gruppen(page, "gh-mount", "data-stueck");
        const namen = Object.keys(st).sort();
        const V = namen.map((n) => vorn(st[n]));
        if (t === 0) {
          anfang = namen.map((n) => eckenAlle(st[n]));
          // Die Teile liegen genau in der Grundfläche: jede Ecke im Vieleck, zusammen genau ihr Inhalt.
          pruefe(nahe(V.reduce((s, q) => s + gauss(q), 0), G, 1e-3), `${wo}: die Teile ergeben nicht die Grundfläche ${G}`);
        }
        for (let i = 0; i < V.length; i++) for (let j = i + 1; j < V.length; j++) pruefe(!ueberdecken(V[i], V[j]), `${wo}: Teil ${i} und ${j} überdecken sich`);
        // Nur verschoben: alle Ecken eines Teils um denselben Vektor.
        namen.forEach((n, i) => {
          const e = eckenAlle(st[n]), d = sub(e[0], anfang[i][0]);
          pruefe(e.every((q, k) => dist(sub(q, d), anfang[i][k]) < 2e-3), `${wo}: Teil ${n} wird nicht nur verschoben`);
        });
        const vol = namen.reduce((s, n) => s + rauminhalt(st[n]), 0);
        const b = { G: zahl(await rolleText(page, '#gh-bilanz [data-rolle="G"]')), V: zahl(await rolleText(page, '#gh-bilanz [data-rolle="V"]')) };
        pruefe(nahe(b.G, G) && nahe(b.V, G * gh) && nahe(vol, G * gh, 1e-3), `${wo}: G = ${b.G}, V = ${b.V}, gezeichnet ${vol.toFixed(3)} — soll G = ${G}, V = ${G * gh}`);
        if (t === 1) {
          const gi = (await texte(page, "gh-mount", "gi-text")).map((x) => zahl(x.text)).sort((u, v) => u - v);
          const soll = V.map((q) => Math.round(gauss(q) * 1e3) / 1e3).sort((u, v) => u - v);
          pruefe(JSON.stringify(gi) === JSON.stringify(soll), `${wo}: die Teile sind als ${gi} beschriftet, gezeichnet ${soll}`);
        }
      }
    }
  }
}

// ── 4. Einheiten ───────────────────────────────────────────────────────────

const MASSE = { platte: [10, 1, 10], stange: [10, 1, 1], wuerfel: [1, 1, 1] };
async function einheiten(page) {
  for (const tp of [0, 20, 35, 50, 70, 85, 100]) {
    await setzeRegler(page, "ei-t", tp);
    const wo = `Einheiten, ${tp} %`;
    kavalierBild(await lies(page, "ei-mount"), wo);
    // Je Teil seine sichtbaren Flächen (data-k): Ihre Hülle ist der ganze Quader des Teils.
    const teile = await page.evaluate(() => {
      const out = {};
      for (const e of document.querySelectorAll("#ei-mount polygon[data-k]")) (out[e.dataset.k] ||= { art: e.dataset.rolle, p: [] }).p.push(...e.dataset.p3.trim().split(/\s+/).map((s) => s.split(",").map(Number)));
      return Object.values(out);
    });
    const boxen = teile.map((x) => ({ art: x.art, lo: [0, 1, 2].map((i) => Math.min(...x.p.map((q) => q[i]))), hi: [0, 1, 2].map((i) => Math.max(...x.p.map((q) => q[i]))) }));
    let falsch = 0;
    for (const b of boxen) if (![0, 1, 2].every((i) => nahe(b.hi[i] - b.lo[i], MASSE[b.art][i], 1e-6))) falsch++;
    pruefe(falsch === 0, `${wo}: ${falsch} Teile haben nicht die Maße ihrer Art`);
    for (let i = 0; i < boxen.length; i++) for (let j = i + 1; j < boxen.length; j++) {
      const ov = [0, 1, 2].map((k) => Math.min(boxen[i].hi[k], boxen[j].hi[k]) - Math.max(boxen[i].lo[k], boxen[j].lo[k]));
      pruefe(!ov.every((x) => x > 1e-6), `${wo}: zwei Teile überdecken sich`);
    }
    const anz = (art) => boxen.filter((b) => b.art === art).length;
    const summe = anz("platte") * 100 + anz("stange") * 10 + anz("wuerfel");
    pruefe(summe === 1000, `${wo}: die Teile sind zusammen ${summe} cm³`);
    const b = { platten: zahl(await rolleText(page, '#ei-bilanz [data-rolle="platten"]')), stangen: zahl(await rolleText(page, '#ei-bilanz [data-rolle="stangen"]')), wuerfel: zahl(await rolleText(page, '#ei-bilanz [data-rolle="wuerfel"]')), summe: z(await rolleText(page, '#ei-bilanz [data-rolle="summe"]')) };
    pruefe(b.platten === anz("platte") && b.stangen === anz("stange") && b.wuerfel === anz("wuerfel") && b.summe === 1000, `${wo}: die Bilanz zählt ${JSON.stringify(b)}, gezeichnet ${anz("platte")}/${anz("stange")}/${anz("wuerfel")}`);
    if (tp === 0) pruefe(boxen.length === 10 && anz("platte") === 10, `${wo}: zu Anfang ist der Würfel nicht aus 10 Platten`);
    if (tp === 100) pruefe(anz("platte") === 9 && anz("stange") === 9 && anz("wuerfel") === 10, `${wo}: am Ende nicht 9 Platten, 9 Stangen, 10 Würfel`);
  }
}

// ── Kontrollfragen ─────────────────────────────────────────────────────────

async function quizze(page) {
  const ids = await page.evaluate(() => [...document.querySelectorAll(".quiz")].map((e) => e.id));
  pruefe(ids.length === 4, `Kontrollfragen: ${ids.length} statt 4`);
  for (const sec of ["sec-wuerfel", "sec-dreieck", "sec-gh", "sec-einheiten"]) pruefe(await page.evaluate((x) => document.querySelectorAll(`#${x} .quiz`).length === 1, sec), `Kontrollfragen: ${sec} hat nicht genau eine`);
  const RICHTIG = {
    "quiz-wuerfel": (o) => zahl(o) === 4 * 3 * 5,
    "quiz-dreieck": (o) => zahl(o) === (6 * 4 * 10) / 2,
    "quiz-gh": (o) => zahl(o) === 15 * 8,
    "quiz-einheiten": (o) => zahl(o) === 10 * 10 * 10,
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

// ── Aufgaben ───────────────────────────────────────────────────────────────

const pyth = (a, b, c) => Math.abs(a * a + b * b - c * c) < 1e-6;
const ueberstand = (s, h) => Math.sqrt(s * s - h * h);
// Raumeinheiten in cm³ — für die Umrechnungsaufgaben unabhängig festgehalten.
const IN_CM3 = { "mm³": 0.001, "cm³": 1, ml: 1, "dm³": 1000, l: 1000, "m³": 1e6 };

// Gemessen mit tests/werkzeug-streuung.js (20 Züge): V1 n ≈ 209, V2 n ≈ 121, V3 n ≈ 129, V4 n ≈ 42,
// V5 n ≈ 108, V6 n ≈ 273, V7 n ≈ 174, V8 n ≈ 470.
const SCHRANKE = [14, 13, 13, 10, 13, 15, 14, 16];
const RUNDEN = 20;
const FASSUNGEN = { V1: new Set(), V3: new Set(), V4: new Set(), V5: new Set() };

async function aufgaben(page) {
  await pruefeAufgabe(page, bericht, {
    nr: 1, name: "V1 Quader", runden: RUNDEN, mindestensVerschieden: SCHRANKE[0],
    deute: (frage) => {
      let m = frage.match(/Ein Würfel hat die Kantenlänge (\d+) cm/);
      if (m) { FASSUNGEN.V1.add("würfel"); const a = Number(m[1]); return { richtig: a ** 3, toleranz: 0.01, falsch: [[6 * a * a, "Oberfläche"], [3 * a, "nicht addiert"], [a * a, "nur eine Schicht"]] }; }
      m = frage.match(/ist (\d+) cm lang, (\d+) cm breit und (\d+) cm hoch/);
      if (!m) return null;
      FASSUNGEN.V1.add("quader");
      const [a, b, c] = m.slice(1).map(Number);
      return { richtig: a * b * c, toleranz: 0.01, falsch: [[2 * (a * b + a * c + b * c), "Oberfläche"], [a + b + c, "nicht addiert"], [a * b, "unterste Schicht"]] };
    },
  });
  await pruefeAufgabe(page, bericht, {
    nr: 2, name: "V2 V = G · h", runden: RUNDEN, mindestensVerschieden: SCHRANKE[1],
    deute: (frage) => {
      const m = frage.match(/Grundfläche von (\d+) cm² und ist (\d+) cm hoch/);
      if (!m) return null;
      const [G, h] = m.slice(1).map(Number);
      return { richtig: G * h, toleranz: 0.01, falsch: [[G + h, "nicht addiert"], [(G * h) / 2, "Halbiert wird nur"], [2 * G * h, "2 · G gehört zur Oberfläche"]] };
    },
  });
  await pruefeAufgabe(page, bericht, {
    nr: 3, name: "V3 Dreiecksprisma", runden: RUNDEN, mindestensVerschieden: SCHRANKE[2],
    deute: (frage) => {
      const mh = frage.match(/Das Prisma ist (\d+) cm hoch/);
      if (!mh) return null;
      const h = Number(mh[1]);
      let m, g, hg, s;
      if ((m = frage.match(/rechtwinkliges Dreieck mit den Katheten (\d+) cm und (\d+) cm und der Hypotenuse (\d+) cm/))) {
        [g, hg, s] = m.slice(1).map(Number);
        pruefe(pyth(g, hg, s), `V3: ${g}, ${hg}, ${s} ist nicht rechtwinklig`);
        FASSUNGEN.V3.add("rw");
      } else if ((m = frage.match(/Dreieck mit den Seiten (\d+) cm, (\d+) cm und (\d+) cm; die Höhe auf die Seite (\d+) cm ist (\d+) cm lang/))) {
        const [gg, s1, s2, g2, hh] = m.slice(1).map(Number);
        g = gg; hg = hh; s = s1;
        pruefe(g2 === g && nahe(ueberstand(s1, hg) + ueberstand(s2, hg), g, 1e-9), `V3: das Dreieck ${g}, ${s1}, ${s2} mit Höhe ${hg} gibt es nicht`);
        FASSUNGEN.V3.add("allgemein");
      } else return null;
      return { richtig: (g * hg * h) / 2, toleranz: 0.01, falsch: [[g * hg * h, "ganze Quader"], [(g * s * h) / 2, "keine Höhe"], [(g * hg) / 2, "nur die Grundfläche"]] };
    },
  });
  await pruefeAufgabe(page, bericht, {
    nr: 4, name: "V4 Raumeinheiten", runden: RUNDEN, mindestensVerschieden: SCHRANKE[3],
    deute: (frage) => {
      const m = frage.match(/Rechne um: ([\d.,]+) (\S+) = \? (\S+)/);
      if (!m || !(m[2] in IN_CM3) || !(m[3] in IN_CM3)) return null;
      const x = z(m[1]), q = IN_CM3[m[2]] / IN_CM3[m[3]];
      FASSUNGEN.V4.add(q === 1 ? "gleich" : q > 1 ? "kleiner" : "größer");
      const soll = x * q;
      const falsch = q === 1 ? [[x * 1000, "gleich groß"], [x / 1000, "gleich groß"]]
        : [[q > 1 ? x * 100 : x / 100, "nicht 100"], [q > 1 ? x * 10 : x / 10, "nicht 10"], [q > 1 ? x / 1000 : x * 1000, "Falsche Richtung"]];
      return { richtig: soll, toleranz: 1e-9, falsch };
    },
  });
  await pruefeAufgabe(page, bericht, {
    nr: 5, name: "V5 Rückwärts", runden: RUNDEN, mindestensVerschieden: SCHRANKE[4],
    deute: (frage) => {
      let m = frage.match(/Grundfläche von (\d+) cm²\. Man füllt ([\d,]+) l Wasser ein/);
      if (m) {
        FASSUNGEN.V5.add("vase");
        const G = Number(m[1]), l = z(m[2]);
        return { richtig: (l * 1000) / G, toleranz: 0.01, falsch: [[l / G, "1 l = 1000 cm³"], [(l * 100) / G, "nicht 100 cm³"], [(l * 1000) / (2 * G), "nur durch G"]] };
      }
      m = frage.match(/ist (\d+) cm hoch und hat das Volumen ([\d.]+) cm³/);
      if (!m) return null;
      FASSUNGEN.V5.add("prisma");
      const h = Number(m[1]), V = z(m[2]);
      return { richtig: V / h, toleranz: 0.01, falsch: [[V - h, "nicht subtrahiert"], [V * h, "nicht mal h"], [V / (2 * h), "kein 2 · G"]] };
    },
  });
  await pruefeAufgabe(page, bericht, {
    nr: 6, name: "V6 Graben", runden: RUNDEN, mindestensVerschieden: SCHRANKE[5],
    deute: (frage) => {
      const m = frage.match(/Graben ist (\d+) m lang\. Sein Querschnitt ist ein Trapez: oben ([\d,]+) m breit, unten ([\d,]+) m breit und ([\d,]+) m tief/);
      if (!m) return null;
      const [L, a, c, t] = m.slice(1).map(z);
      const V = ((a + c) / 2) * t * L;
      return { felder: [V, V * 1000], toleranz: 0.0001, falschFelder: [[0, (a + c) * t * L, "Mittelwert der parallelen"], [0, a * t * L, "nur oben"], [0, c * t * L, "nur unten"], [1, V * 100, "nicht 100 l"], [1, V * 1e6, "Das sind cm³"]] };
    },
  });
  await pruefeAufgabe(page, bericht, {
    nr: 7, name: "V7 Gartenhaus", runden: RUNDEN, mindestensVerschieden: SCHRANKE[6],
    deute: (frage) => {
      const m = frage.match(/Vorn ist es ([\d,]+) m breit; die Wände sind ([\d,]+) m hoch, der First ist ([\d,]+) m hoch\. Das Haus ist ([\d,]+) m lang/);
      if (!m) return null;
      const [w, hw, H, L] = m.slice(1).map(z);
      return { richtig: (w * hw + 0.5 * w * (H - hw)) * L, toleranz: 0.001, falsch: [[w * H * L, "½ · Breite"], [w * hw * L, "Dachraum"]] };
    },
  });
  await pruefeAufgabe(page, bericht, {
    nr: 8, name: "V8 Schwimmbecken", runden: RUNDEN, mindestensVerschieden: SCHRANKE[7],
    deute: (frage) => {
      const m = frage.match(/Schwimmbecken ist (\d+) m lang und (\d+) m breit\..*?einem Ende ist das Becken ([\d,]+) m tief, am anderen ([\d,]+) m\. Eine Pumpe füllt ([\d.]+) Liter in der Minute/);
      if (!m) return null;
      const [L, B, t1, t2, Q] = m.slice(1).map(z);
      const V = ((t1 + t2) / 2) * L * B, std = (V * 1000) / Q / 60;
      return { felder: [V, std], toleranz: 0.001, falschFelder: [[0, t2 * L * B, "tiefen Ende"], [0, t1 * L * B, "flachen Ende"], [0, (t1 + t2) * L * B, "Mittelwert genommen"], [1, std * 60, "Minuten"], [1, V / Q / 60, "1 m³ = 1000 l"]] };
    },
  });
  pruefe(FASSUNGEN.V1.size === 2 && FASSUNGEN.V3.size === 2 && FASSUNGEN.V5.size === 2, `Fassungen: V1 ${[...FASSUNGEN.V1]}, V3 ${[...FASSUNGEN.V3]}, V5 ${[...FASSUNGEN.V5]}`);
  pruefe(FASSUNGEN.V4.size === 3, `V4: gezogen nur ${[...FASSUNGEN.V4]}`);
}

// ── Gerüst ─────────────────────────────────────────────────────────────────

async function geruest(page) {
  const folge = await page.evaluate(() => [...document.querySelectorAll("main section[id]")].map((x) => x.id));
  const soll = ["sec-wuerfel", "sec-dreieck", "sec-gh", "sec-einheiten", "sec-vernetzung", "sec-formelsammlung", "sec-uebungen", "sec-selbsteinschaetzung"];
  pruefe(JSON.stringify(folge) === JSON.stringify(soll), `Gerüst: Abschnitte ${folge.join(", ")} statt ${soll.join(", ")}`);
  // Kein Vorgriff auf den Zylinder (π) in den Erarbeitungsabschnitten.
  for (const id of soll.slice(0, 4)) pruefe(!/π|Zylinder/.test(await page.evaluate((i) => document.getElementById(i).innerText, id)), `Gerüst: ${id} greift auf den Zylinder vor`);
  const bsp = await page.evaluate(() => document.querySelector("#sec-gh .beispiel-box").innerText);
  pruefe(bsp.includes(`= ${20 * 3} cm³`) && bsp.includes(`= ${String(90 / 20).replace(".", ",")} cm`), "Gerüst: das Beispiel in Abschnitt 3 rechnet falsch");
  const links = await page.evaluate(() => [...document.querySelectorAll("main a[href]")].map((a) => a.getAttribute("href")).filter((h) => !h.startsWith("#") && !h.startsWith("http")));
  for (const href of new Set(links)) {
    const ziel = new URL(href.split("#")[0], "http://localhost/mathematik/klasse-8/koerper/").pathname;
    const antwort = await page.request.get("http://localhost:" + (process.env.UPLANT_PORT || "8936") + ziel);
    pruefe(antwort.ok(), `Gerüst: der Verweis „${href}“ führt ins Leere`);
    const anker = href.split("#")[1];
    if (anker && antwort.ok() && /\.html$/.test(ziel)) pruefe((await antwort.text()).includes(`id="${anker}"`), `Gerüst: die Sprungmarke „${anker}“ fehlt in ${ziel}`);
  }
  const menue = fs.readFileSync(path.join(WURZEL, "mathematik/klasse-8/koerper/index.html"), "utf8");
  const karte = menue.match(/<a class="menu-card"[^>]*href="volumen-prisma\.html"[^>]*>\s*<h2>([^<]*)<\/h2>/);
  pruefe(!!karte && /data-section="klasse-8"/.test(karte[0]) && /\shidden\b/.test(karte[0]) && karte[1] === "3. Volumen von Prismen", "Gerüst: die Menükarte fehlt oder ist unvollständig");
  const proStufe = await page.evaluate(() => [...document.querySelectorAll("#exercises-mount .schwierigkeit-tabs button")].map((t) => { t.click(); return document.querySelectorAll("#exercises-mount .schwierigkeit-tab-panel .aufgabe-box").length; }));
  pruefe(JSON.stringify(proStufe) === "[2,2,2,2]", `Gerüst: die Stufen haben ${proStufe.join("/")} Aufgaben statt 2/2/2/2`);
}

async function teil(name, fn, page) {
  if (!will(name)) return;
  try { await fn(page); } catch (e) { pruefe(false, `${name}: Abbruch — ${String(e && e.message).split("\n")[0]}`); }
}

(async () => {
  const browser = await starteBrowser();
  for (const dunkel of [false, true]) {
    const wo = dunkel ? "dunkel" : "hell";
    const page = await neueSeite(browser, { dunkel });
    await oeffne(page, SEITE);
    if (!dunkel) {
      await teil("geruest", geruest, page);
      await teil("wuerfel", wuerfel, page);
      await teil("dreieck", dreieck, page);
      await teil("zerlegen", zerlegen, page);
      await teil("einheiten", einheiten, page);
      await teil("quizze", quizze, page);
      await teil("aufgaben", aufgaben, page);
    } else if (will("dunkel")) {
      await setzeRegler(page, "wf-t", 100);
      await setzeRegler(page, "dr-t", 100);
      await setzeRegler(page, "ei-t", 100);
      await pruefeKontrast(page, bericht, "dunkel");
      await pruefeStrichKontrast(page, bericht, "dunkel, Flächen und Kanten", "#wf-mount polygon, #wf-mount line, #dr-mount line, #gh-mount line, #ei-mount line");
      await pruefeTextAufFlaeche(page, bericht, "dunkel, Beschriftungen", "#wf-mount text, #dr-mount text, #gh-mount text, #ei-mount text");
    }
    await pruefeNotation(page, bericht, wo);
    for (const s of page.stoerungen) pruefe(false, `${wo}: ${s}`);
    await page.close();
  }
  await browser.close();
  bericht.abschluss();
})();
