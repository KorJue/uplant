// Fachliche Prüfung: Klasse 8, Körper, Thema 4 „Oberflächeninhalt von Zylindern“.
//
// Nachgerechnet wird aus den Raumpunkten der Zeichnungen (data-p3) mit eigenen Verfahren
// (tests/lib/koerper.js):
//
//   1. PRISMA → ZYLINDER: Die Deckfläche ist ein regelmäßiges n-Eck mit dem Umkreisradius r, die
//      Mantelstreifen sind Rechtecke Seite × h; gezeichnet sind genau die zugewandten Streifen. Der
//      Umfang des n-Ecks (aus den Ecken gemessen) stimmt mit der Bilanz und rückt an 2πr heran.
//   2. NETZ: Der Mantel wird nur gebogen — sein Querschnitt liegt in jeder Stellung auf einem Kreis
//      (oder am Ende auf einer Geraden) und ist als Bogen immer 2πr lang; die Mantellinie vorn bleibt
//      stehen; die Kreise bleiben Kreise mit dem Radius r und hängen vorn am Mantel. Am Ende liegt
//      alles flach, in wahrer Größe: ein Rechteck 2πr × h mit zwei Kreisen.
//   3. FAST-RECHTECK: Jedes Stück bleibt ein Kreisausschnitt mit Radius r und Winkel 360° : n; zu Anfang
//      bilden die Stücke zwei Kreise, am Ende liegen sie überschneidungsfrei über dem Mantel.
//   4. OFFENE ZYLINDER: Die richtigen Kreise fehlen; O stimmt.
//   Dazu die Kontrollfragen, alle Aufgaben (die Netzfigur aus dem SVG gelesen), das Gerüst und der
//   Dunkelmodus.

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
const SEITE = "/mathematik/klasse-8/koerper/oberflaeche-zylinder.html";
const WURZEL = path.resolve(__dirname, "..", "..");
const NUR = (process.env.UPLANT_NUR || "").split(",").map((t) => t.trim()).filter(Boolean);
const will = (teil) => NUR.length === 0 || NUR.includes(teil);
const { dist, lies, rolleText, waehle, ueberdecken } = K;
const PI = Math.PI;
const nahe = (a, b, eps = 1e-6) => Math.abs(a - b) < eps;
const z = (s) => Number(String(s).replace(/\./g, "").replace(",", "."));
const r2 = (x) => Math.round(x * 100) / 100;
const TOL = 0.015;
// Der Wert in der Anzeige ist auf zwei Stellen gerundet.
// `mess` ist die zusätzliche Unsicherheit eines Werts, den die Prüfung aus gerundeten Raumpunkten misst.
const anzeige = (s, soll, mess = 0) => Math.abs(zahl(s) - soll) <= 0.005 + mess + 1e-9;
const gauss2 = (P) => Math.abs(P.reduce((s, p, i) => s + p[0] * P[(i + 1) % P.length][1] - P[(i + 1) % P.length][0] * p[1], 0)) / 2;
// Fehlerwert mit π ≈ 3,14 — nur, wenn er sich sichtbar unterscheidet (Regel der Kreis-Seite).
const mit314 = (soll, w) => (Math.abs(w - soll) > 0.05 ? w : NaN);

// ── 1. Vom Prisma zum Zylinder ─────────────────────────────────────────────

const ECKEN = [3, 4, 5, 6, 8, 12, 24, 48, 96];
async function zylinder(page) {
  const e = (22 * PI) / 180, sicht = [0, Math.sin(e), -Math.cos(e)];
  for (let k = 0; k < ECKEN.length; k++) {
    await setzeRegler(page, "zy-k", k);
    const n = ECKEN[k];
    for (const [r, h] of [[1, 2], [2.5, 4], [4, 6]]) {
      await setzeRegler(page, "zy-r", r); await setzeRegler(page, "zy-h", h);
      const wo = `Prisma → Zylinder, n = ${n}, r = ${r}, h = ${h}`;
      const teile = await lies(page, "zy-mount");
      K.ansichtBild(pruefe, teile.filter((t) => t.tag !== "line" || t.rolle !== "hoehe"), 22, 0, wo);
      const deckel = teile.find((t) => t.rolle === "deckel");
      pruefe(!!deckel && deckel.p3.length === n && deckel.p3.every((p) => nahe(Math.hypot(p[0], p[2]), r, 1e-3) && nahe(p[1], h, 1e-6)), `${wo}: die Deckfläche ist kein ${n}-Eck im Kreis mit r = ${r} auf der Höhe ${h}`);
      if (!deckel) continue;
      const s = dist(deckel.p3[0], deckel.p3[1]);
      pruefe(deckel.p3.every((p, i) => nahe(dist(p, deckel.p3[(i + 1) % n]), s, 2e-3)), `${wo}: das n-Eck ist nicht regelmäßig`);
      const streifen = teile.filter((t) => t.rolle === "mantel");
      pruefe(streifen.every((t) => K.istRechteck(t.p3, s, h, 2e-3)), `${wo}: die Mantelstreifen sind keine Rechtecke ${s.toFixed(3)} × ${h}`);
      // Genau die zugewandten Streifen: Ihre Außennormale zeigt zum Betrachter.
      const zugewandt = (t) => { const m = K.schwer(t.p3); return m[0] * sicht[0] + m[2] * sicht[2] > 0; };
      const sollAnzahl = Array.from({ length: n }, (_, i) => { const a = (2 * PI * (i + 0.5)) / n; return -Math.cos(a) * sicht[2] > 1e-9; }).filter(Boolean).length;
      pruefe(streifen.length === sollAnzahl && streifen.every(zugewandt), `${wo}: ${streifen.length} Mantelstreifen gezeichnet, zugewandt sind ${sollAnzahl}`);
      const un = n * s, u = 2 * PI * r;
      pruefe(anzeige(await rolleText(page, '#zy-bilanz [data-rolle="u"]'), u), `${wo}: der Kreisumfang ist nicht 2πr`);
      if (k < ECKEN.length - 1) {
        // s ist aus Raumpunkten mit vier Nachkommastellen gemessen: je Seite bis zu 2 · 10⁻⁴ ungenau.
        pruefe(anzeige(await rolleText(page, '#zy-bilanz [data-rolle="un"]'), un, n * 2e-4), `${wo}: der Umfang des n-Ecks ist nicht ${un.toFixed(3)}`);
        pruefe(anzeige(await rolleText(page, '#zy-bilanz [data-rolle="M"]'), un * h, n * h * 2e-4), `${wo}: der Mantel ist nicht u · h`);
        pruefe(/gemessen/.test(await page.evaluate(() => document.getElementById("zy-bilanz").innerText)), `${wo}: die Seitenlänge steht ohne „gemessen“ da`);
      } else pruefe(anzeige(await rolleText(page, '#zy-bilanz [data-rolle="M"]'), u * h), `${wo}: der Mantel ist nicht 2πr · h`);
      if (n >= 48) pruefe(Math.abs(un - u) < 0.01 * u, `${wo}: bei ${n} Ecken liegt der Umfang ${un.toFixed(3)} noch weit von 2πr`);
    }
  }
}

// ── 2. Das Netz ────────────────────────────────────────────────────────────

// Der Blick: schräg (28° hoch, 22° seitlich), bis der Mantel gerade ist; in den letzten 20 % dreht er
// sich nach vorn (ε = ψ = 0).
const nzKamera = (t) => { const w = Math.max(0, (t - 0.8) / 0.2); return [28 * (1 - w), -22 * (1 - w)]; };
// Liegen Punkte (x, z) auf einem Kreis oder einer Geraden? Liefert die Bogenlänge vom ersten zum letzten.
function bogen(P) {
  // Drei weit auseinanderliegende Punkte bestimmen den Kreis — nicht Anfang und Ende: Beim
  // geschlossenen Mantel fallen sie zusammen.
  const [a, b, c] = [P[0], P[Math.floor(P.length / 4)], P[Math.floor(P.length / 2)]];
  const d = 2 * (a[0] * (b[1] - c[1]) + b[0] * (c[1] - a[1]) + c[0] * (a[1] - b[1]));
  if (Math.abs(d) < 1e-6) {
    // Gerade: alle auf der Linie, Länge vom ersten bis zum letzten Punkt.
    const e = P[P.length - 1], L = Math.hypot(e[0] - a[0], e[1] - a[1]);
    const auf = P.every((p) => Math.abs((e[0] - a[0]) * (p[1] - a[1]) - (e[1] - a[1]) * (p[0] - a[0])) / L < 1e-3);
    return { auf, laenge: L };
  }
  const ux = ((a[0] ** 2 + a[1] ** 2) * (b[1] - c[1]) + (b[0] ** 2 + b[1] ** 2) * (c[1] - a[1]) + (c[0] ** 2 + c[1] ** 2) * (a[1] - b[1])) / d;
  const uy = ((a[0] ** 2 + a[1] ** 2) * (c[0] - b[0]) + (b[0] ** 2 + b[1] ** 2) * (a[0] - c[0]) + (c[0] ** 2 + c[1] ** 2) * (b[0] - a[0])) / d;
  const R = Math.hypot(a[0] - ux, a[1] - uy);
  const auf = P.every((p) => Math.abs(Math.hypot(p[0] - ux, p[1] - uy) - R) < 1e-3 * Math.max(1, R / 10));
  // Winkel aufsummieren (der Bogen kann größer als 180° sein).
  let w = 0;
  for (let i = 1; i < P.length; i++) {
    const w1 = Math.atan2(P[i - 1][1] - uy, P[i - 1][0] - ux), w2 = Math.atan2(P[i][1] - uy, P[i][0] - ux);
    let d2 = w2 - w1;
    while (d2 > PI) d2 -= 2 * PI;
    while (d2 < -PI) d2 += 2 * PI;
    w += d2;
  }
  return { auf, laenge: Math.abs(w) * R };
}
async function pruefeZylNetz(page, mount, r, h, t, wo, fehlt) {
  const [eps, psi] = nzKamera(t);
  const teile = await lies(page, mount);
  const fl = teile.filter((x) => x.tag === "polygon");
  K.ansichtBild(pruefe, fl, eps, psi, wo);
  const streifen = fl.filter((x) => x.rolle === "mantel").sort((p, q) => p.nr - q.nr);
  pruefe(streifen.length === 96, `${wo}: ${streifen.length} Mantelstreifen statt 96`);
  // Jeder Streifen: zwei senkrechte Kanten der Länge h.
  pruefe(streifen.every((x) => nahe(x.p3[0][1], 0) && nahe(x.p3[3][1], h) && nahe(x.p3[0][0], x.p3[3][0]) && nahe(x.p3[0][2], x.p3[3][2]) && nahe(x.p3[1][0], x.p3[2][0])), `${wo}: ein Mantelstreifen ist nicht h hoch und senkrecht`);
  // Der Querschnitt unten: Kreisbogen oder Gerade, immer 2πr lang.
  const quer = [streifen[0].p3[0], ...streifen.map((x) => x.p3[1])].map((p) => [p[0], p[2]]);
  const b = bogen(quer);
  pruefe(b.auf && Math.abs(b.laenge - 2 * PI * r) < 2e-3 * r, `${wo}: der Mantel ist nicht nur gebogen — Querschnitt ${b.auf ? "" : "nicht auf einem Bogen, "}${b.laenge.toFixed(4)} statt 2πr = ${(2 * PI * r).toFixed(4)}`);
  // Die vordere Mantellinie (zwischen Streifen 47 und 48) steht fest.
  pruefe(nahe(streifen[48].p3[0][0], 0, 1e-3) && nahe(streifen[48].p3[0][2], -r, 1e-3), `${wo}: die vordere Mantellinie ist gewandert`);
  for (const rolle of ["deckel", "grund"]) {
    const k = fl.find((x) => x.rolle === rolle);
    pruefe(!!k && (fehlt[rolle] ? /kp-fehlt/.test(k.klasse) : !/kp-fehlt/.test(k.klasse)), `${wo}: ${rolle} ist ${fehlt[rolle] ? "nicht als fehlend" : "fälschlich als fehlend"} markiert`);
    if (!k) continue;
    const m = K.schwer(k.p3);
    pruefe(k.p3.length === 96 && k.p3.every((p) => nahe(dist(p, m), r, 2e-3)), `${wo}: ${rolle} ist kein Kreis mit dem Radius ${r}`);
    pruefe(k.p3.some((p) => K.gleichP(p, [0, rolle === "deckel" ? h : 0, -r], 1e-3)), `${wo}: ${rolle} hängt nicht vorn am Mantel`);
  }
  if (t === 1) {
    pruefe(fl.every((x) => x.p3.every((p) => nahe(p[2], -r, 1e-6))), `${wo}: das Netz liegt am Ende nicht flach`);
    const S = K.massstab(fl);
    pruefe(K.wahreGroesse(fl, S, 0.1) === 0, `${wo}: das Netz ist am Ende nicht in wahrer Größe gezeichnet`);
    const xs = streifen.flatMap((x) => x.p3.map((p) => p[0]));
    pruefe(nahe(Math.min(...xs), -PI * r, 1e-3) && nahe(Math.max(...xs), PI * r, 1e-3), `${wo}: der Mantel ist am Ende nicht 2πr lang`);
  }
}

async function netz(page) {
  for (const [r, h] of [[1, 2], [2, 4], [3, 6], [1.5, 5]]) {
    await setzeRegler(page, "nz-r", r); await setzeRegler(page, "nz-h", h);
    for (const tp of [5, 20, 35, 50, 70, 85, 100]) {
      const t = (await setzeRegler(page, "nz-t", tp)) / 100;
      await pruefeZylNetz(page, "nz-mount", r, h, t, `Netz r = ${r}, h = ${h}, ${tp} %`, {});
      pruefe(anzeige(await rolleText(page, '#nz-bilanz [data-rolle="u"]'), 2 * PI * r) && anzeige(await rolleText(page, '#nz-bilanz [data-rolle="M"]'), 2 * PI * r * h), `Netz r = ${r}, h = ${h}: die Bilanz nennt falsche Werte`);
    }
    await setzeRegler(page, "nz-t", 0);
    const zu = await lies(page, "nz-mount");
    const d = zu.find((x) => x.rolle === "deckel");
    pruefe(!!d && d.p3.every((p) => nahe(Math.hypot(p[0], p[2]), r, 1e-3) && nahe(p[1], h)), `Netz r = ${r}, h = ${h}, 0 %: der geschlossene Zylinder hat keinen Deckel mit dem Radius r`);
  }
}

// ── 3. Fast-Rechteck ───────────────────────────────────────────────────────

const stuecke = (page) => page.evaluate(() => [...document.querySelectorAll('#fr-mount [data-rolle="stueck"]')].map((e) => ({ kreis: e.dataset.kreis, p: e.dataset.p3.trim().split(/\s+/).map((s) => s.split(",").map(Number)) })));
async function fastRechteck(page) {
  for (const [r, h, n] of [[1.5, 3, 12], [2.5, 5, 24], [1, 2, 8], [2, 4, 16]]) {
    await setzeRegler(page, "fr-r", r); await setzeRegler(page, "fr-h", h); await setzeRegler(page, "fr-n", n);
    let flaechenAnfang = null;
    for (const tp of [0, 30, 60, 100]) {
      await setzeRegler(page, "fr-t", tp);
      const wo = `Fast-Rechteck r = ${r}, h = ${h}, ${n} Stücke, ${tp} %`;
      const teile = await lies(page, "fr-mount");
      K.ansichtBild(pruefe, teile, 0, 0, wo);
      const mantel = teile.find((x) => x.rolle === "mantel");
      pruefe(!!mantel && K.istRechteck(mantel.p3, 2 * PI * r, h, 1e-3) && mantel.p3.every((p) => p[1] > -1e-6 && p[1] < h + 1e-6), `${wo}: der Mantel ist kein Rechteck 2πr × h`);
      const st = (await stuecke(page)).map((x) => ({ ...x, q: x.p.map((p) => [p[0], p[1]]) }));
      pruefe(st.length === 2 * n, `${wo}: ${st.length} Stücke statt ${2 * n}`);
      // Jedes Stück ein Kreisausschnitt: Spitze zuerst, alle Bogenpunkte im Abstand r, Winkel 360° : n.
      let schief = 0;
      for (const s of st) {
        const A = s.q[0], B = s.q.slice(1);
        const w = Math.acos(Math.max(-1, Math.min(1, ((B[0][0] - A[0]) * (B[B.length - 1][0] - A[0]) + (B[0][1] - A[1]) * (B[B.length - 1][1] - A[1])) / (r * r))));
        if (!B.every((p) => nahe(Math.hypot(p[0] - A[0], p[1] - A[1]), r, 1e-3)) || !nahe(w, (2 * PI) / n, 1e-3)) schief++;
      }
      pruefe(schief === 0, `${wo}: ${schief} Stücke sind keine Kreisausschnitte mit r = ${r} und 360° : ${n}`);
      const fl = st.map((s) => gauss2(s.q));
      if (tp === 0) {
        flaechenAnfang = fl;
        for (const j of ["0", "1"]) {
          const spitzen = st.filter((s) => s.kreis === j).map((s) => s.q[0]);
          pruefe(spitzen.length === n && spitzen.every((p) => nahe(p[0], spitzen[0][0], 1e-6) && nahe(p[1], spitzen[0][1], 1e-6)), `${wo}: die Stücke von Kreis ${j} bilden keinen Kreis`);
        }
        pruefe(st.every((s) => s.q.every((p) => p[1] > h + 1e-6)), `${wo}: die Kreise liegen nicht über dem Mantel`);
      } else pruefe(fl.every((a, i) => nahe(a, flaechenAnfang[i], 1e-3)), `${wo}: ein Stück hat seinen Flächeninhalt geändert`);
      if (tp === 100) {
        for (let i = 0; i < st.length; i++) for (let j = i + 1; j < st.length; j++) pruefe(!ueberdecken(st[i].q, st[j].q), `${wo}: Stück ${i} und ${j} überdecken sich`);
        const ys = st.flatMap((s) => s.q.map((p) => p[1])), xs = st.flatMap((s) => s.q.map((p) => p[0]));
        const theta = (2 * PI) / n;
        pruefe(Math.min(...ys) > h - 1e-3 && Math.max(...ys) < h + 2 * r - r * Math.cos(theta / 2) + 1e-3, `${wo}: die Stücke liegen nicht als Streifen der Höhe r über dem Mantel`);
        pruefe(Math.min(...xs) > -1e-3 && Math.max(...xs) < 2 * PI * r + r, `${wo}: die Stücke liegen nicht über dem Mantel`);
      }
      pruefe(anzeige(await rolleText(page, '#fr-bilanz [data-rolle="O"]'), 2 * PI * r * (r + h)), `${wo}: O ist nicht 2πr(r + h)`);
    }
  }
}

// ── 4. Offene Zylinder ─────────────────────────────────────────────────────

const DINGE = { dose: {}, offen: { deckel: true }, rohr: { deckel: true, grund: true } };
async function anwenden(page) {
  for (const [ding, fehlt] of Object.entries(DINGE)) {
    await waehle(page, "an-ding", ding);
    for (const [r, h] of [[1.5, 4], [3, 6]]) {
      await setzeRegler(page, "an-r", r); await setzeRegler(page, "an-h", h);
      for (const tp of [0, 50, 100]) {
        const t = (await setzeRegler(page, "an-t", tp)) / 100;
        await pruefeZylNetz(page, "an-mount", r, h, t, `Offen: ${ding}, r = ${r}, h = ${h}, ${tp} %`, fehlt);
        const kreise = 2 - Object.keys(fehlt).length;
        pruefe(anzeige(await rolleText(page, '#an-bilanz [data-rolle="O"]'), 2 * PI * r * h + kreise * PI * r * r), `Offen: ${ding}: O stimmt nicht`);
      }
    }
  }
}

// ── Kontrollfragen ─────────────────────────────────────────────────────────

async function quizze(page) {
  const ids = await page.evaluate(() => [...document.querySelectorAll(".quiz")].map((e) => e.id));
  pruefe(ids.length === 4, `Kontrollfragen: ${ids.length} statt 4`);
  for (const sec of ["sec-zylinder", "sec-netz", "sec-oberflaeche", "sec-anwenden"]) pruefe(await page.evaluate((x) => document.querySelectorAll(`#${x} .quiz`).length === 1, sec), `Kontrollfragen: ${sec} hat nicht genau eine`);
  const RICHTIG = {
    "quiz-zylinder": (o) => anzeige(o, PI * 10),
    "quiz-netz": (o) => { const m = o.match(/([\d,]+) cm × ([\d,]+) cm/); return !!m && anzeige(m[1], 2 * PI * 2) && z(m[2]) === 5; },
    "quiz-oberflaeche": (o) => anzeige(o, 2 * PI * 3 * (3 + 7)),
    "quiz-anwenden": (o) => anzeige(o, 2 * PI * 2 * 50),
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

const rAus = (art, wert) => (art === "den Durchmesser" ? z(wert) / 2 : z(wert));
const oFalsch = (r, h, mitD) => {
  const O = 2 * PI * r * (r + h);
  return [[PI * r * r + 2 * PI * r * h, "zwei Kreise"], [2 * PI * r * h, "nur der Mantel"], [4 * PI * PI * r * r + 2 * PI * r * h, "Quadriert wird nur r"], [mitD ? 8 * PI * r * r + 4 * PI * r * h : NaN, "wie einen Radius"], [mit314(O, 2 * 3.14 * r * (r + h)), "3,14"]];
};
const liesNetz = (page, box) => page.evaluate((b) => {
  const svg = document.querySelector(`${b} .aufgabe-prompt svg`);
  if (!svg) return null;
  const rect = svg.querySelector('rect[data-rolle="mantel"]');
  return {
    rect: { x: +rect.getAttribute("x"), y: +rect.getAttribute("y"), w: +rect.getAttribute("width"), h: +rect.getAttribute("height") },
    kreise: [...svg.querySelectorAll('circle[data-rolle="kreis"]')].map((c) => ({ cx: +c.getAttribute("cx"), cy: +c.getAttribute("cy"), r: +c.getAttribute("r") })),
    d: svg.querySelector('[data-rolle="mass-d"]')?.textContent, h: svg.querySelector('[data-rolle="mass-h"]')?.textContent,
  };
}, box);

// Gemessen mit tests/werkzeug-streuung.js (20 Züge): Z1 n ≈ 106, Z2 n ≈ 52, Z3 n ≈ 109, Z4 n ≈ 30,
// Z5 n ≈ 86, Z6 n ≈ 99, Z7 n ≈ 96, Z8 n ≈ 251.
const SCHRANKE = [13, 10, 13, 8, 12, 13, 12, 15];
const RUNDEN = 20;
const FASSUNGEN = { Z1: new Set(), Z5: new Set(), Z6: new Set() };

async function aufgaben(page) {
  await pruefeAufgabe(page, bericht, {
    nr: 1, name: "Z1 Mantel", runden: RUNDEN, mindestensVerschieden: SCHRANKE[0],
    deute: (frage) => {
      const m = frage.match(/Ein Zylinder hat (den Durchmesser|den Radius) ([\d,]+) cm und ist (\d+) cm hoch\. Wie groß ist sein Mantel/);
      if (!m) return null;
      FASSUNGEN.Z1.add(m[1]);
      const r = rAus(m[1], m[2]), h = Number(m[3]), M = 2 * PI * r * h;
      return { richtig: r2(M), toleranz: TOL, falsch: [[PI * r * h, "halbe Umfang"], [2 * PI * r * r, "kein Kreis"], [m[1] === "den Durchmesser" ? 4 * PI * r * h : NaN, "wie einen Radius"], [mit314(M, 2 * 3.14 * r * h), "3,14"]] };
    },
  });
  await pruefeAufgabe(page, bericht, {
    nr: 2, name: "Z2 Etikett", runden: RUNDEN, mindestensVerschieden: SCHRANKE[1],
    deute: (frage) => {
      const m = frage.match(/Durchmesser ([\d,]+) cm und ist (\d+) cm hoch\. Wie lang und wie breit/);
      if (!m) return null;
      const d = z(m[1]), h = Number(m[2]), u = PI * d;
      return { felder: [r2(u), h], toleranz: TOL, falschFelder: [[0, d, "Durchmesser"], [0, u / 2, "halbe Umfang"], [0, 2 * PI * d, "wie einen Radius"], [0, mit314(u, 3.14 * d), "3,14"], [1, r2(u), "vertauscht"]] };
    },
  });
  await pruefeAufgabe(page, bericht, {
    nr: 3, name: "Z3 Oberfläche", runden: RUNDEN, mindestensVerschieden: SCHRANKE[2],
    deute: (frage) => {
      const m = frage.match(/Ein Zylinder hat (den Durchmesser|den Radius) ([\d,]+) cm und ist (\d+) cm hoch\. Wie groß ist seine Oberfläche/);
      if (!m) return null;
      const r = rAus(m[1], m[2]), h = Number(m[3]);
      return { richtig: r2(2 * PI * r * (r + h)), toleranz: TOL, falsch: oFalsch(r, h, m[1] === "den Durchmesser") };
    },
  });
  await pruefeAufgabe(page, bericht, {
    nr: 4, name: "Z4 Oberfläche aus dem Netz", runden: RUNDEN, mindestensVerschieden: SCHRANKE[3],
    liesRoh: liesNetz,
    deute: (frage, f) => {
      if (!f || !f.d || !f.h) return null;
      const d = zahl(f.d), h = zahl(f.h), r = d / 2;
      // Maßstäblich: Rechteck π · d × h, zwei Kreise mit d, an der Mitte des Rechtecks oben und unten.
      const S = f.rect.h / h;
      pruefe(nahe(f.rect.w, PI * d * S, 0.05) && f.kreise.length === 2 && f.kreise.every((k) => nahe(k.r, r * S, 0.05) && nahe(k.cx, f.rect.x + f.rect.w / 2, 0.05)), `Z4: das Netz ist nicht maßstäblich (d = ${d}, h = ${h})`);
      pruefe(f.kreise.some((k) => nahe(k.cy + k.r, f.rect.y, 0.05)) && f.kreise.some((k) => nahe(k.cy - k.r, f.rect.y + f.rect.h, 0.05)), "Z4: die Kreise berühren das Rechteck nicht oben und unten");
      return { richtig: r2(2 * PI * r * (r + h)), toleranz: TOL, falsch: oFalsch(r, h, true) };
    },
  });
  await pruefeAufgabe(page, bericht, {
    nr: 5, name: "Z5 Höhe zurückrechnen", runden: RUNDEN, mindestensVerschieden: SCHRANKE[4],
    deute: (frage) => {
      let m = frage.match(/Der Mantel eines Zylinders mit dem Radius ([\d,]+) cm ist ([\d.,]+) cm² groß/);
      if (m) {
        FASSUNGEN.Z5.add("mantel");
        const r = z(m[1]), M = z(m[2]), h = M / (2 * PI * r);
        return { richtig: r2(h), toleranz: TOL, falsch: [[M / (PI * r), "ganzen Umfang"], [M / (2 * PI * r * r), "ohne Quadrat"], [M / 2 / r, "π fehlt"]] };
      }
      m = frage.match(/Ein Zylinder mit dem Radius ([\d,]+) cm hat die Oberfläche ([\d.,]+) cm²/);
      if (!m) return null;
      FASSUNGEN.Z5.add("oberfläche");
      const r = z(m[1]), O = z(m[2]), h = (O - 2 * PI * r * r) / (2 * PI * r);
      return { richtig: r2(h), toleranz: TOL, falsch: [[O / (2 * PI * r), "beiden Kreise ab"], [(O - PI * r * r) / (2 * PI * r), "zwei Kreise"], [(O - 2 * PI * r * r) / (PI * r), "Teile durch 2 · π · r"]] };
    },
  });
  await pruefeAufgabe(page, bericht, {
    nr: 6, name: "Z6 Offene Zylinder", runden: RUNDEN, mindestensVerschieden: SCHRANKE[5],
    deute: (frage) => {
      let m;
      if ((m = frage.match(/Ein Rohr hat den Radius ([\d,]+) cm und ist (\d+) cm lang/))) {
        FASSUNGEN.Z6.add("rohr");
        const r = z(m[1]), h = Number(m[2]), M = 2 * PI * r * h, Kr = PI * r * r;
        return { richtig: r2(M), toleranz: TOL, falsch: [[M + 2 * Kr, "beiden Enden offen"], [M + Kr, "gar keinen Kreis"], [mit314(M, 2 * 3.14 * r * h), "3,14"]] };
      }
      if ((m = frage.match(/Ein Becher \(ohne Deckel\) hat den Radius ([\d,]+) cm und ist (\d+) cm hoch/))) {
        FASSUNGEN.Z6.add("becher");
        const r = z(m[1]), h = Number(m[2]), M = 2 * PI * r * h, Kr = PI * r * r;
        return { richtig: r2(M + Kr), toleranz: TOL, falsch: [[M + 2 * Kr, "keinen Deckel"], [M, "Boden fehlt"], [mit314(M + Kr, 2 * 3.14 * r * h + 3.14 * r * r), "3,14"]] };
      }
      if ((m = frage.match(/Litfaßsäule hat den Durchmesser ([\d,]+) m\. Beklebt wird sie ([\d,]+) m hoch/))) {
        FASSUNGEN.Z6.add("säule");
        const d = z(m[1]), h = z(m[2]), M = PI * d * h;
        return { richtig: r2(M), toleranz: TOL, falsch: [[M + 2 * PI * (d / 2) ** 2, "nur der Mantel"], [2 * PI * d * h, "nicht 2 · π · d"], [mit314(M, 3.14 * d * h), "3,14"]] };
      }
      return null;
    },
  });
  await pruefeAufgabe(page, bericht, {
    nr: 7, name: "Z7 Rohrstück", runden: RUNDEN, mindestensVerschieden: SCHRANKE[6],
    deute: (frage) => {
      const m = frage.match(/ist (\d+) cm lang\. Sein Außenradius ist ([\d,]+) cm, sein Innenradius ([\d,]+) cm/);
      if (!m) return null;
      const h = Number(m[1]), R = z(m[2]), r = z(m[3]);
      const aussen = 2 * PI * R * h, innen = 2 * PI * r * h, ring = PI * (R * R - r * r);
      return { richtig: r2(aussen + innen + 2 * ring), toleranz: TOL, falsch: [[aussen + 2 * ring, "Innen wird auch"], [aussen + innen + 2 * PI * R * R, "Loch in der Mitte"], [aussen + innen + 2 * PI * (R - r) ** 2, "erst quadrieren"], [aussen + innen + ring, "zwei Stirnseiten"]] };
    },
  });
  await pruefeAufgabe(page, bericht, {
    nr: 8, name: "Z8 Dosen herstellen", runden: RUNDEN, mindestensVerschieden: SCHRANKE[7],
    deute: (frage) => {
      const m = frage.match(/stellt ([\d.]+) Dosen her, jede mit dem Radius ([\d,]+) cm und der Höhe (\d+) cm\. Beim Ausschneiden gehen (\d+) %/);
      if (!m) return null;
      const n = z(m[1]), r = z(m[2]), h = Number(m[3]), p = Number(m[4]);
      const O = 2 * PI * r * (r + h), blech = (n * O * (1 + p / 100)) / 1e4;
      return { felder: [r2(O), r2(blech)], toleranz: TOL, falschFelder: [...oFalsch(r, h, false).map(([w, mu]) => [0, w, mu]), [1, (n * O) / 1e4, "Verschnitt fehlt"], [1, blech * 10, "nicht 1000"], [1, blech * 100, "durch 10.000"]] };
    },
  });
  pruefe(FASSUNGEN.Z1.size === 2 && FASSUNGEN.Z5.size === 2 && FASSUNGEN.Z6.size === 3, `Fassungen: Z1 ${[...FASSUNGEN.Z1]}, Z5 ${[...FASSUNGEN.Z5]}, Z6 ${[...FASSUNGEN.Z6]}`);
}

// ── Gerüst ─────────────────────────────────────────────────────────────────

async function geruest(page) {
  const folge = await page.evaluate(() => [...document.querySelectorAll("main section[id]")].map((x) => x.id));
  const soll = ["sec-zylinder", "sec-netz", "sec-oberflaeche", "sec-anwenden", "sec-vernetzung", "sec-formelsammlung", "sec-uebungen", "sec-selbsteinschaetzung"];
  pruefe(JSON.stringify(folge) === JSON.stringify(soll), `Gerüst: Abschnitte ${folge.join(", ")} statt ${soll.join(", ")}`);
  // Kein Vorgriff: kein Volumen, keine Quadratwurzel (r aus einer Fläche).
  for (const id of soll.slice(0, 4)) pruefe(!/cm³|Volumen|√/.test(await page.evaluate((i) => document.getElementById(i).innerText, id)), `Gerüst: ${id} greift auf Volumen oder Wurzeln vor`);
  // Die Beispiele rechnen richtig.
  const b2 = await page.evaluate(() => document.querySelector("#sec-netz .beispiel-box").innerText);
  pruefe(b2.includes(`${String(r2(2 * PI * 2 * 4)).replace(".", ",")} cm²`), "Gerüst: das Mantel-Beispiel rechnet falsch");
  const b3 = await page.evaluate(() => document.querySelector("#sec-oberflaeche .beispiel-box").innerText);
  pruefe(b3.includes(`${String(r2(2 * PI * 3 * 10)).replace(".", ",")}0 cm²`) || b3.includes(`${String(r2(2 * PI * 3 * 10)).replace(".", ",")} cm²`), "Gerüst: das Oberflächen-Beispiel rechnet falsch");
  const b4 = await page.evaluate(() => document.querySelector("#sec-anwenden .beispiel-box").innerText);
  pruefe(nahe(188.5 / (2 * PI * 3), 10, 0.005) && b4.includes("10 cm"), "Gerüst: das Umkehr-Beispiel rechnet falsch");
  const links = await page.evaluate(() => [...document.querySelectorAll("main a[href]")].map((a) => a.getAttribute("href")).filter((h) => !h.startsWith("#") && !h.startsWith("http")));
  for (const href of new Set(links)) {
    const ziel = new URL(href.split("#")[0], "http://localhost/mathematik/klasse-8/koerper/").pathname;
    const antwort = await page.request.get("http://localhost:" + (process.env.UPLANT_PORT || "8936") + ziel);
    pruefe(antwort.ok(), `Gerüst: der Verweis „${href}“ führt ins Leere`);
    const anker = href.split("#")[1];
    if (anker && antwort.ok() && /\.html$/.test(ziel)) pruefe((await antwort.text()).includes(`id="${anker}"`), `Gerüst: die Sprungmarke „${anker}“ fehlt in ${ziel}`);
  }
  const menue = fs.readFileSync(path.join(WURZEL, "mathematik/klasse-8/koerper/index.html"), "utf8");
  const karte = menue.match(/<a class="menu-card"[^>]*href="oberflaeche-zylinder\.html"[^>]*>\s*<h2>([^<]*)<\/h2>/);
  pruefe(!!karte && /data-section="klasse-8"/.test(karte[0]) && /\shidden\b/.test(karte[0]) && karte[1] === "4. Oberflächeninhalt von Zylindern", "Gerüst: die Menükarte fehlt oder ist unvollständig");
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
      await teil("zylinder", zylinder, page);
      await teil("netz", netz, page);
      await teil("fastrechteck", fastRechteck, page);
      await teil("anwenden", anwenden, page);
      await teil("quizze", quizze, page);
      await teil("aufgaben", aufgaben, page);
    } else if (will("dunkel")) {
      await setzeRegler(page, "nz-t", 60);
      await setzeRegler(page, "fr-t", 100);
      await pruefeKontrast(page, bericht, "dunkel");
      await pruefeStrichKontrast(page, bericht, "dunkel, Linien und Flächen", "#zy-mount line, #zy-mount polyline, #nz-mount polygon[data-rolle=deckel], #nz-mount polyline, #fr-mount polygon, #an-mount polygon[data-fehlt]");
      await pruefeTextAufFlaeche(page, bericht, "dunkel, Beschriftungen", "#zy-mount text, #nz-mount text, #fr-mount text, #an-mount text");
    }
    await pruefeNotation(page, bericht, wo);
    for (const s of page.stoerungen) pruefe(false, `${wo}: ${s}`);
    await page.close();
  }
  await browser.close();
  bericht.abschluss();
})();
