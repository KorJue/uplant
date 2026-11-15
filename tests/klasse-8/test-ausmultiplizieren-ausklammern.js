// Fachliche Prüfung: Klasse 8, Terme, Thema 3 „Ausmultiplizieren und Ausklammern“.
//
// Nachgerechnet wird mit dem eigenen Termauswerter (tests/lib/polynom.js), nicht mit dem der Seite:
//
//   1. Das RECHTECK: k Zeilen (oder eine Zeile der Höhe x) zu je m x-Streifen und c Einern; zu Anfang
//      füllen die Kacheln das Rechteck genau aus, der Einerteil rückt starr ab, und die beiden
//      Flächeninhalte und das Ergebnis stimmen.
//   2. Das AUSMULTIPLIZIEREN: ein Produkt je Glied der Klammer, jedes mit dem Faktor davor; alles
//      gleichwertig mit dem Anfang, am Ende vereinfacht; die Probe stimmt.
//   3. Das AUSKLAMMERN: Die Kacheln liegen in k Zeilen genau dann ohne Rest, wenn k beide Zahlen teilt;
//      der Rest ist der Divisionsrest; „vollständig“ heißt es genau beim größten gemeinsamen Teiler.
//   4. VOLLSTÄNDIG: Für jeden angebotenen Faktor wird hier selbst entschieden, ob er in allen Gliedern
//      steckt und ob danach in der Klammer noch etwas Gemeinsames bleibt.
//   5. Die AUFGABEN: jede der acht über viele Runden, aus dem Aufgabentext (bei der Beet-Aufgabe aus
//      der Zeichnung) nachgerechnet, mit den vorgesehenen Fehlern.

"use strict";

const { neuerBericht } = require("../lib/pruefen");
const { starteBrowser, neueSeite, oeffne, setzeRegler } = require("../lib/seite");
const { pruefeNotation } = require("../lib/notation");
const { pruefeKontrast, pruefeStrichKontrast } = require("../lib/kontrast");
const { pruefeAufgabe } = require("../lib/aufgaben");
const P = require("../lib/polynom");
const fs = require("fs");
const path = require("path");

const bericht = neuerBericht();
const { pruefe } = bericht;
const SEITE = "/mathematik/klasse-8/terme/ausmultiplizieren-ausklammern.html";
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

// ── 1. Das Distributivgesetz am Rechteck ─────────────────────────────────

async function distributiv(page) {
  let verhaeltnis = null;
  for (const art of ["zahl", "x"]) {
    await waehle(page, "dg-art", art);
    for (const [k, m, c] of [[1, 1, 1], [3, 2, 3], [4, 3, 5], [2, 1, 4]]) {
      if (art === "x" && k !== 3) continue;   // die Zahl spielt bei x keine Rolle
      await setzeRegler(page, "dg-k", k); await setzeRegler(page, "dg-m", m); await setzeRegler(page, "dg-c", c);
      const f = art === "x" ? "x" : String(k);
      const zeilen = art === "x" ? 1 : k;
      const wo = `Rechteck ${f} · (${m}x + ${c})`;
      let anfang = null;
      for (const t of [0, 40, 100]) {
        await setzeRegler(page, "dg-t", t);
        const kk = await liesKacheln(page, "dg-mount");
        const w2 = `${wo}, ${t} %`;
        const xt = kk.filter((z) => z.teil === "x"), et = kk.filter((z) => z.teil === "1");
        pruefe(xt.length === zeilen * m && et.length === zeilen * c, `${w2}: ${xt.length} + ${et.length} Kacheln statt ${zeilen * m} + ${zeilen * c}`);
        pruefe(xt.every((z) => z.art === (art === "x" ? "x2" : "x")) && et.every((z) => z.art === (art === "x" ? "x" : "1")), `${w2}: die Kacheln haben die falsche Sorte`);
        // Größen: x-Teil x lang, Einerteil 1 breit, alle eine Zeile hoch; bei x ist die Zeile x hoch.
        const lx = xt[0].w, u = et[0].w, zh = xt[0].h;
        pruefe(kk.every((z) => Math.abs(z.h - zh) < 0.01) && xt.every((z) => Math.abs(z.w - lx) < 0.01) && et.every((z) => Math.abs(z.w - u) < 0.01), `${w2}: die Kacheln sind verschieden groß`);
        if (art === "x") pruefe(Math.abs(zh - lx) < 0.01, `${w2}: die Zeile ist nicht x hoch (x² kein Quadrat)`);
        else pruefe(Math.abs(zh - u) < 0.01, `${w2}: die Zeile ist nicht 1 hoch`);
        verhaeltnis = verhaeltnis || lx / u;
        pruefe(Math.abs(lx / u - verhaeltnis) < 0.01, `${w2}: x und 1 stehen in einem anderen Verhältnis als sonst`);
        keineUeberdeckung(kk, w2);
        if (t === 0) {
          anfang = kk;
          const x0 = Math.min(...kk.map((z) => z.x)), y0 = Math.min(...kk.map((z) => z.y));
          const x1 = Math.max(...kk.map((z) => z.x + z.w)), y1 = Math.max(...kk.map((z) => z.y + z.h));
          const flaeche = kk.reduce((s, z) => s + z.w * z.h, 0);
          pruefe(Math.abs(x1 - x0 - (m * lx + c * u)) < 0.05 && Math.abs(y1 - y0 - zeilen * zh) < 0.05 && Math.abs(flaeche - (x1 - x0) * (y1 - y0)) < 0.5, `${w2}: die Kacheln füllen das Rechteck nicht genau aus`);
          const s = await texte(page, "dg-mount");
          pruefe(P.gleichwertig(s["breite-x"] || "0", `${m}x`, ["x"]) && s["breite-1"] === String(c) && s.hoehe === f, `${w2}: die Seiten heißen ${s["breite-x"]}, ${s["breite-1"]}, ${s.hoehe}`);
        } else {
          // Der x-Teil bleibt liegen, der Einerteil rückt als Ganzes waagerecht ab.
          const ax = anfang.filter((z) => z.teil === "x"), ae = anfang.filter((z) => z.teil === "1");
          pruefe(xt.every((z, i) => Math.abs(z.x - ax[i].x) < 0.01 && Math.abs(z.y - ax[i].y) < 0.01), `${w2}: der x-Teil hat sich bewegt`);
          const dx = et[0].x - ae[0].x;
          pruefe(dx > 0 && et.every((z, i) => Math.abs(z.x - ae[i].x - dx) < 0.01 && Math.abs(z.y - ae[i].y) < 0.01), `${w2}: der Einerteil wird nicht als Ganzes verschoben`);
        }
        if (t === 100) {
          const s = await texte(page, "dg-mount");
          const rechts = (x) => (x || "").split(" = ").pop();
          pruefe(P.gleichwertig(rechts(s["flaeche-x"]), `${f} * ${m}x`, ["x"]), `${w2}: links steht „${s["flaeche-x"]}“`);
          pruefe(P.gleichwertig(rechts(s["flaeche-1"]), `${f} * ${c}`, ["x"]), `${w2}: rechts steht „${s["flaeche-1"]}“`);
          const erg = await page.evaluate(() => document.querySelector('#dg-bilanz [data-rolle="ergebnis"]')?.textContent ?? null);
          pruefe(erg !== null && P.gleichwertig(erg, `${f} * (${m}x + ${c})`, ["x"]) && P.istVereinfacht(erg), `${w2}: das Ergebnis „${erg}“ stimmt nicht`);
        }
      }
    }
  }
  await setzeRegler(page, "dg-t", 0);
}

// ── 2. Ausmultiplizieren mit Vorzeichen ──────────────────────────────────

const VARS = ["x", "y", "a", "b"];
async function ausmultiplizieren(page) {
  const n = await page.evaluate(() => document.getElementById("am-term").options.length);
  for (let i = 0; i < n; i++) {
    await waehle(page, "am-term", String(i));
    const term = await optionText(page, "am-term");
    const wo = `Ausmultiplizieren „${term}“`;
    const g = await setzeRegler(page, "am-schritt", 2);
    pruefe(g === 2, `${wo}: der Regler steht auf ${g}`);
    const s = await page.evaluate(() => [...document.querySelectorAll('#am-mount [data-rolle="schritt"]')].map((e) => ({ art: e.dataset.art, term: e.dataset.term, text: e.innerText })));
    pruefe(s.length === 3 && normal(s[0].term) === normal(term), `${wo}: ${s.length} Zeilen, Anfang „${s[0] && s[0].term}“`);
    const [faktor, innen] = term.match(/^(.+?) · \((.+)\)$/).slice(1);
    const glieder = P.summanden(innen);
    // Ein Produkt je Glied, jedes mit dem Faktor davor.
    const produkte = P.summanden(s[1].term);
    pruefe(produkte.length === glieder.length, `${wo}: ${produkte.length} Produkte für ${glieder.length} Glieder`);
    produkte.forEach((pr, j) => {
      pruefe(P.gleichwertig(pr, `(${faktor}) * (${glieder[j]})`, VARS), `${wo}: das Produkt „${pr}“ ist nicht ${faktor} mal ${glieder[j]}`);
    });
    pruefe(P.gleichwertig(s[1].term, term, VARS) && P.gleichwertig(s[2].term, term, VARS), `${wo}: ein Schritt ist nicht gleichwertig mit dem Anfang`);
    pruefe(P.istVereinfacht(s[2].term), `${wo}: das Ergebnis „${s[2].term}“ ist nicht vereinfacht`);
    pruefe(P.summanden(s[2].term).length === glieder.length, `${wo}: das Ergebnis hat nicht ${glieder.length} Glieder`);
    const text = await page.evaluate(() => document.getElementById("am-text").innerText);
    const m = text.match(/Probe mit (.+?): Der Anfang ergibt (−?\d+), das Ergebnis (−?\d+)/);
    pruefe(!!m, `${wo}: keine Probe — „${text}“`);
    if (m) {
      const bel = Object.fromEntries(m[1].split(", ").map((p) => p.split(" = ")).map(([v, z]) => [v, zahl(z)]));
      const wa = P.wert(term, bel);
      pruefe(zahl(m[2]) === wa && zahl(m[3]) === P.wert(s[2].term, bel) && wa === zahl(m[3]), `${wo}: die Probe stimmt nicht (nachgerechnet ${wa})`);
    }
  }
}

// ── 3. Ausklammern: Kacheln in Zeilen ─────────────────────────────────────

async function ausklammern(page) {
  const n = await page.evaluate(() => document.getElementById("ak-term").options.length);
  for (let i = 0; i < n; i++) {
    await waehle(page, "ak-term", String(i));
    const term = await optionText(page, "ak-term");
    const [, A, B] = term.match(/^(\d+)x \+ (\d+)$/).map(Number);
    const g = ggT(A, B);
    for (let k = 1; k <= 6; k++) {
      const gesetzt = await setzeRegler(page, "ak-k", k);
      pruefe(gesetzt === k, `Ausklammern „${term}“: Regler auf ${gesetzt} statt ${k}`);
      const wo = `Ausklammern „${term}“, ${k} Zeilen`;
      const kk = await liesKacheln(page, "ak-mount");
      pruefe(kk.filter((z) => z.art === "x").length === A && kk.filter((z) => z.art === "1").length === B, `${wo}: nicht ${A} x-Streifen und ${B} Einer`);
      keineUeberdeckung(kk, wo);
      const geht = A % k === 0 && B % k === 0;
      const rest = kk.filter((z) => z.rest);
      if (rest.length) await restAbgehoben(page, wo);
      pruefe(rest.filter((z) => z.art === "x").length === A % k && rest.filter((z) => z.art === "1").length === B % k, `${wo}: ${rest.length} Kacheln im Rest statt ${A % k} + ${B % k}`);
      for (let r = 0; r < k; r++) {
        const zeile = kk.filter((z) => z.zeile === String(r));
        pruefe(zeile.filter((z) => z.art === "x").length === Math.floor(A / k) && zeile.filter((z) => z.art === "1").length === Math.floor(B / k), `${wo}: Zeile ${r + 1} ist nicht gleich voll`);
        pruefe(new Set(zeile.map((z) => z.y.toFixed(1))).size === 1, `${wo}: Zeile ${r + 1} liegt nicht auf einer Höhe`);
      }
      const b = await page.evaluate(() => ({ produkt: document.querySelector('#ak-bilanz [data-rolle="produkt"]')?.textContent ?? null, text: document.getElementById("ak-text").innerText }));
      if (geht) {
        pruefe(b.produkt !== null && P.gleichwertig(b.produkt, term, ["x"]) && P.istProdukt(b.produkt) && b.produkt.startsWith(`${k} · (`), `${wo}: das Produkt „${b.produkt}“ stimmt nicht`);
        if (k === g) pruefe(/vollständig/.test(b.text), `${wo}: ${k} ist der ggT, aber die Seite sagt nicht „vollständig“`);
        else pruefe(!/vollständig/.test(b.text), `${wo}: ${k} ist nicht der ggT, die Seite sagt aber „vollständig“`);
      } else {
        pruefe(b.produkt === null && /kein gemeinsamer Teiler/.test(b.text), `${wo}: ${k} teilt nicht beide, die Seite behauptet ein Produkt`);
      }
    }
  }
  await setzeRegler(page, "ak-k", 1);
}

// Ein Rest muss als Rest zu sehen sein: anderer Rand als die Kacheln derselben Sorte im Rechteck.
// (Im Dunkelmodus überschrieb die Sortenfarbe einmal fast die Restfarbe — gleiche Sorte, gleicher Rand.)
async function restAbgehoben(page, wo) {
  const r = await page.evaluate(() => {
    const farbe = (sel) => [...document.querySelectorAll(sel)].map((e) => getComputedStyle(e).stroke);
    return ["x", "1"].map((a) => ({ a, rest: farbe(`#ak-mount g[data-art="${a}"][data-zeile="rest"] rect`), sonst: farbe(`#ak-mount g[data-art="${a}"]:not([data-zeile="rest"]) rect`) }));
  });
  for (const { a, rest, sonst } of r) {
    if (rest.length && sonst.length) pruefe(rest.every((f) => !sonst.includes(f)), `${wo}: der Rest (${a}) hat denselben Rand wie die übrigen Kacheln (${rest[0]})`);
  }
}

// ── 4. Vollständig ausklammern ────────────────────────────────────────────

// Ein Glied „−12x²“ oder „4a²b“ als Zahl und Hochzahlen.
function monom(text) {
  const t = P.normiere(text);
  const m = t.match(/^([+-]?)(\d*)((?:[a-z](?:\^\d+)?)*)$/);
  const v = {};
  for (const x of m[3].matchAll(/([a-z])(?:\^(\d+))?/g)) v[x[1]] = (v[x[1]] || 0) + Number(x[2] || 1);
  return { k: (m[1] === "-" ? -1 : 1) * (m[2] === "" ? 1 : Number(m[2])), v };
}
function teilt(f, g) {   // ist das Monom f ein Teiler des Monoms g (mit ganzer Zahl)?
  return g.k % f.k === 0 && Object.keys(f.v).every((n) => (g.v[n] || 0) >= f.v[n]);
}
async function vollstaendig(page) {
  const n = await page.evaluate(() => document.getElementById("va-term").options.length);
  for (let i = 0; i < n; i++) {
    await waehle(page, "va-term", String(i));
    const term = await optionText(page, "va-term");
    const glieder = P.summanden(term).map(monom);
    const faktoren = await page.evaluate(() => [...document.getElementById("va-faktor").options].map((o) => o.text));
    pruefe(faktoren.length >= 3, `Vollständig „${term}“: nur ${faktoren.length} Faktoren zur Wahl`);
    let vollGesehen = false, nichtGesehen = false;
    for (let j = 0; j < faktoren.length; j++) {
      await waehle(page, "va-faktor", String(j));
      const f = monom(faktoren[j]);
      const wo = `Vollständig „${term}“, Faktor ${faktoren[j]}`;
      const b = await page.evaluate(() => ({ produkt: document.querySelector('#va-bilanz [data-rolle="produkt"]')?.textContent ?? null, urteil: document.querySelector('#va-bilanz [data-rolle="urteil"]')?.textContent ?? "" }));
      const gemeinsam = glieder.every((g) => teilt(f, g));
      if (!gemeinsam) {
        nichtGesehen = true;
        pruefe(b.produkt === null && /kein gemeinsamer Faktor/.test(b.urteil), `${wo}: der Faktor steckt nicht in allen Gliedern, die Seite sagt „${b.urteil}“`);
        continue;
      }
      pruefe(b.produkt !== null && P.gleichwertig(b.produkt, term, ["x", "y", "a", "b"]) && P.istProdukt(b.produkt), `${wo}: „${b.produkt}“ ist nicht gleichwertig`);
      // Was in der Klammer übrig bleibt, hier selbst geteilt: noch eine gemeinsame Zahl oder Variable?
      const rest = glieder.map((g) => ({ k: g.k / f.k, v: Object.fromEntries(Object.keys(g.v).map((v) => [v, g.v[v] - (f.v[v] || 0)])) }));
      const zahlRest = rest.reduce((s, r) => ggT(s, r.k), 0);
      const varRest = Object.keys(rest[0].v).some((v) => rest.every((r) => (r.v[v] || 0) > 0));
      const voll = zahlRest === 1 && !varRest;
      if (voll) vollGesehen = true;
      pruefe(voll ? /^vollständig/.test(b.urteil) : /nicht vollständig/.test(b.urteil), `${wo}: hier ${voll ? "vollständig" : "nicht vollständig"}, die Seite sagt „${b.urteil}“`);
    }
    pruefe(vollGesehen && nichtGesehen, `Vollständig „${term}“: unter den Faktoren fehlt der vollständige oder ein unpassender`);
  }
}

// ── Kontrollfragen ────────────────────────────────────────────────────────

// Vollständig ausgeklammert: „F · (Summe)“, und in der Summe haben die Glieder nichts mehr gemeinsam.
function vollAusgeklammert(o) {
  const m = o.match(/^(.+?) · \((.+)\)$/);
  if (!m) return false;
  const g = P.summanden(m[2]).map(monom);
  const z = g.reduce((s, r) => ggT(s, r.k), 0);
  const v = Object.keys(g[0].v).some((n) => g.every((r) => (r.v[n] || 0) > 0));
  return z === 1 && !v;
}
async function quizze(page) {
  const ids = await page.evaluate(() => [...document.querySelectorAll(".quiz")].map((e) => e.id));
  pruefe(ids.length === 4, `Kontrollfragen: ${ids.length} statt 4`);
  for (const sec of ["sec-distributiv", "sec-ausmultiplizieren", "sec-ausklammern", "sec-vollstaendig"]) {
    pruefe(await page.evaluate((s) => document.querySelectorAll(`#${s} .quiz`).length === 1, sec), `Kontrollfragen: ${sec} hat nicht genau eine`);
  }
  const RICHTIG = {
    "quiz-distributiv": (o) => P.gleichwertig(o, "4 * (x + 3)", ["x"]),
    "quiz-ausmultiplizieren": (o) => P.gleichwertig(o, "-2 * (3x - 4)", ["x"]),
    "quiz-ausklammern": (o) => P.gleichwertig(o, "5x + 5", ["x"]) && P.istProdukt(o),
    "quiz-vollstaendig": (o) => P.gleichwertig(o, "18a^2 + 12a", ["a"]) && vollAusgeklammert(o),
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

// Ein Term aus Zahlen, in UMGEKEHRTER Reihenfolge — die Seite muss jede Reihenfolge anerkennen.
function bau(glieder) {
  const g = glieder.filter(([k]) => Math.abs(k) > 1e-9).reverse();
  if (!g.length) return "0";
  return g.map(([k, v], i) => {
    const b = Math.abs(k);
    const kern = v === "" ? String(b) : (b === 1 ? "" : String(b)) + v;
    return i === 0 ? (k < 0 ? "−" : "") + kern : (k < 0 ? " − " : " + ") + kern;
  }).join("");
}
const linear = (t, v = "x") => { const c0 = P.wert(t, { [v]: 0 }); return { c1: P.wert(t, { [v]: 1 }) - c0, c0 }; };
const quad = (t) => { const f = (x) => P.wert(t, { x }); const c0 = f(0); return { c2: (f(1) + f(-1)) / 2 - c0, c1: (f(1) - f(-1)) / 2, c0 }; };
const termAus = (frage, vor) => { const m = frage.match(new RegExp(vor + " (.+?) Schreibweise:")); return m && m[1]; };
// Ein Faktor vor einer Summe in Klammern, als Text zum Eintippen: 3(2x − 5).
const produkt = (f, glieder) => `${f}(${bau(glieder.slice().reverse())})`;

// Die Schranken für `mindestensVerschieden` sind gemessen (tests/werkzeug-streuung.js, 20 Züge):
// C1 n ≈ 201, C2 n ≈ 226, C3 n ≈ 329, C4 n ≈ 299, C5 n ≈ 273, C6 n ≈ 198, C7 n ≈ 89, C8 n ≈ 11.
const SCHRANKE = [14, 14, 15, 15, 15, 14, 12, 5];
const RUNDEN = 20;

// Welche Fassungen einer Aufgabe gezogen wurden. Fällt eine Fassung ganz aus dem Vorrat — etwa weil
// ihr Sollwert mit einem Fehlerwert zusammenfällt und die Kollisionsprüfung sie jedes Mal aussiebt —,
// bliebe das sonst unbemerkt: Die übrigen Fassungen bestehen ja.
const FASSUNGEN = { C3: new Set(), C4: new Set(), C6: new Set() };
async function aufgaben(page) {
  await pruefeAufgabe(page, bericht, {
    nr: 1, name: "C1 Zahl mal Klammer", runden: RUNDEN, mindestensVerschieden: SCHRANKE[0],
    deute: (frage) => {
      const term = termAus(frage, "Multipliziere aus:");
      const m = term && term.match(/^(−?\d+) · \((\d*)x ([+−]) (\d+)\)$/);
      if (!m) return null;
      const k = zahl(m[1]), mm = m[2] === "" ? 1 : Number(m[2]), c = (m[3] === "−" ? -1 : 1) * Number(m[4]);
      pruefe(P.gleichwertig(bau([[k * mm, "x"], [k * c, ""]]), term, ["x"]), `C1: die Prüfung liest den Term anders — „${frage}“`);
      return {
        richtig: bau([[k * mm, "x"], [k * c, ""]]),
        falsch: [[bau([[k * mm, "x"], [c, ""]]), "mit jedem Glied"], [bau([[k * mm, "x"], [-k * c, ""]]), "Vorzeichen"]],
        pruefe: (f2, r) => pruefe(P.gleichwertig((r.match(/= ([^=]+)$/m) || [])[1] || "0", term, ["x"]), `C1: die Musterlösung endet nicht mit dem Ergebnis — „${f2}“`),
      };
    },
  });

  await pruefeAufgabe(page, bericht, {
    nr: 2, name: "C2 Zahl ausklammern", runden: RUNDEN, mindestensVerschieden: SCHRANKE[1],
    deute: (frage) => {
      const term = termAus(frage, "Klammere den größten gemeinsamen Faktor aus:");
      const m = term && term.match(/^(\d+)x ([+−]) (\d+)$/);
      if (!m) return null;
      const A = Number(m[1]), B = (m[2] === "−" ? -1 : 1) * Number(m[3]);
      const g = ggT(A, B);
      pruefe(g > 1, `C2: ${A} und ${B} haben keinen gemeinsamen Teiler — „${frage}“`);
      const falsch = [[term, "Produktform"], [produkt(g, [[A / g, "x"], [B, ""]]), "JEDES Glied"]];
      // Ein echter Teiler kleiner als der ggT: gleichwertig, aber nicht vollständig.
      const d = [2, 3, 5, 7].find((p) => g % p === 0 && p < g);
      if (d) falsch.push([produkt(d, [[A / d, "x"], [B / d, ""]]), "noch nicht vollständig"]);
      return { richtig: produkt(g, [[A / g, "x"], [B / g, ""]]), falsch, pruefe: (f2, r) => pruefe(r.includes(`ggT(${A}, ${Math.abs(B)}) = ${g}`), `C2: die Musterlösung nennt den ggT nicht — „${f2}“`) };
    },
  });

  await pruefeAufgabe(page, bericht, {
    nr: 3, name: "C3 Variable vor der Klammer", runden: RUNDEN, mindestensVerschieden: SCHRANKE[2],
    deute: (frage) => {
      const term = termAus(frage, "Multipliziere aus:");
      const m = term && term.match(/^(−?\d*)([xa]) · \((\d*)[xa] ([+−]) (\d*)(b?)\)$/);
      if (!m) return null;
      const k = m[1] === "" ? 1 : m[1] === "−" ? -1 : zahl(m[1]);
      const mm = m[3] === "" ? 1 : Number(m[3]);
      const c = (m[4] === "−" ? -1 : 1) * (m[5] === "" ? 1 : Number(m[5]));
      FASSUNGEN.C3.add(m[2]);
      if (m[2] === "x") {
        const q = quad(term);
        pruefe(q.c2 === k * mm && q.c1 === k * c, `C3: die Prüfung liest den Term anders — „${frage}“`);
        return {
          richtig: bau([[k * mm, "x^2"], [k * c, "x"]]),
          falsch: [[bau([[k * mm, "x^2"], [k * c, ""]]), "Auch das zweite Glied"], [bau([[2 * k * mm + k * c, "x"]]), "nicht 2x"], [bau([[k * mm, "x^2"], [-k * c, "x"]]), "Vorzeichen"]],
        };
      }
      const f = (a, b) => P.wert(term, { a, b });
      pruefe(f(1, 0) === k * mm && f(1, 1) - f(1, 0) === k * c, `C3: die Prüfung liest den Term anders — „${frage}“`);
      return {
        richtig: bau([[k * mm, "a^2"], [k * c, "ba"]]),
        falsch: [[bau([[k * mm, "a^2"], [k * c, "b"]]), "Auch das zweite Glied"], [bau([[2 * k * mm, "a"], [k * c, "ab"]]), "nicht 2a"], [bau([[k * mm, "a^2"], [-k * c, "ab"]]), "Vorzeichen"]],
      };
    },
  });

  await pruefeAufgabe(page, bericht, {
    nr: 4, name: "C4 Zweimal ausmultiplizieren", runden: RUNDEN, mindestensVerschieden: SCHRANKE[3],
    deute: (frage) => {
      const term = termAus(frage, "Multipliziere aus und fasse zusammen:");
      const m = term && term.match(/^(\d+) · \(x \+ (\d+)\) ([+−]) (\d+) · \(x − (\d+)\)$/);
      if (!m) return null;
      const [a, b, c, d] = [m[1], m[2], m[4], m[5]].map(Number);
      FASSUNGEN.C4.add(m[3]);
      const { c1, c0 } = linear(term);
      const falsch = m[3] === "+"
        ? [[bau([[a + c, "x"], [a * b - d, ""]]), "ganze zweite Klammer"], [bau([[a + c, "x"], [b - c * d, ""]]), "ganze erste Klammer"]]
        : [[bau([[a - c, "x"], [a * b - c * d, ""]]), "Minus mal Minus"], [bau([[a + c, "x"], [a * b - c * d, ""]]), "Vor der zweiten Klammer"]];
      return { richtig: bau([[c1, "x"], [c0, ""]]), falsch };
    },
  });

  await pruefeAufgabe(page, bericht, {
    nr: 5, name: "C5 Vollständig ausklammern", runden: RUNDEN, mindestensVerschieden: SCHRANKE[4],
    deute: (frage) => {
      const term = termAus(frage, "Klammere vollständig aus:");
      if (!term) return null;
      const g = P.summanden(term).map(monom);
      if (g.length !== 2) return null;
      // Hier selbst: ggT der Zahlen und die kleinste Hochzahl jeder gemeinsamen Variablen.
      const z = ggT(g[0].k, g[1].k);
      const v = {};
      for (const n of Object.keys(g[0].v)) { const e = Math.min(g[0].v[n], g[1].v[n] || 0); if (e > 0) v[n] = e; }
      const vText = Object.keys(v).sort().map((n) => n + (v[n] > 1 ? "^" + v[n] : "")).join("");
      const innen = g.map((m) => [m.k / z, Object.keys(m.v).sort().map((n) => (m.v[n] - (v[n] || 0) > 0 ? n + (m.v[n] - (v[n] || 0) > 1 ? "^" + (m.v[n] - (v[n] || 0)) : "") : "")).join("")]);
      const vars = /a/.test(term) ? ["a", "b"] : ["x"];
      const richtig = `${z}${vText}(${bau(innen.slice().reverse())})`;
      pruefe(P.gleichwertig(richtig, term, vars), `C5: die Prüfung selbst hat sich verrechnet (${richtig})`);
      return {
        richtig,
        falsch: [
          [term, "Produktform"],
          [`${z}(${bau(g.map((m) => [m.k / z, Object.keys(m.v).sort().map((n) => n + (m.v[n] > 1 ? "^" + m.v[n] : "")).join("")]).reverse())})`, "noch nicht vollständig"],
          // Das zweite Glied der Klammer mit falschem Vorzeichen.
          [`${z}${vText}(${bau([innen[0], [-innen[1][0], innen[1][1]]].reverse())})`, "Vorzeichen"],
        ],
      };
    },
  });

  await pruefeAufgabe(page, bericht, {
    nr: 6, name: "C6 Minus vor dem Faktor", runden: RUNDEN, mindestensVerschieden: SCHRANKE[5],
    deute: (frage) => {
      const term = termAus(frage, "Multipliziere aus und fasse zusammen:");
      if (!term) return null;
      let m = term.match(/^(\d*)x − (\d+) · \((\d*)x − (\d+)\)$/);
      const { c1, c0 } = linear(term);
      FASSUNGEN.C6.add(m ? "a" : "b");
      if (m) {
        const [e, k, mm, c] = [m[1] || "1", m[2], m[3] || "1", m[4]].map(Number);
        return { richtig: bau([[c1, "x"], [c0, ""]]), falsch: [[bau([[e - k * mm, "x"], [-k * c, ""]]), "Minus mal Minus"], [bau([[e - k * mm, "x"], [c, ""]]), "jedes Glied"]] };
      }
      m = term.match(/^(\d+) − (\d+) · \((\d+) − (\d*)x\)$/);
      if (!m) return null;
      const [e, k, c, mm] = [m[1], m[2], m[3], m[4] || "1"].map(Number);
      return { richtig: bau([[c1, "x"], [c0, ""]]), falsch: [[bau([[-k * mm, "x"], [e - k * c, ""]]), "Minus mal Minus"], [bau([[mm, "x"], [e - k * c, ""]]), "jedes Glied"]] };
    },
  });

  await pruefeAufgabe(page, bericht, {
    nr: 7, name: "C7 Beet", runden: RUNDEN, mindestensVerschieden: SCHRANKE[6],
    liesRoh: (page2, box) => page2.evaluate((sel) => {
      const svg = document.querySelector(`${sel} .aufgabe-prompt svg[data-figur="rechteck2"]`);
      if (!svg) return null;
      const t = (r) => svg.querySelector(`[data-rolle="${r}"]`).textContent;
      const teile = [...svg.querySelectorAll('[data-rolle="teil"]')].map((r) => ({ x: +r.getAttribute("x"), w: +r.getAttribute("width"), y: +r.getAttribute("y"), h: +r.getAttribute("height") }));
      return { hoehe: t("hoehe"), links: t("links"), rechts: t("rechts"), teile };
    }, box),
    deute: (frage, roh) => {
      if (!roh) return null;
      const [a, b] = roh.teile;
      pruefe(roh.teile.length === 2 && Math.abs(a.y - b.y) < 0.01 && Math.abs(a.h - b.h) < 0.01 && Math.abs(a.x + a.w - b.x) < 0.01, `C7: die beiden Teile bilden kein Rechteck — „${frage}“`);
      const h = roh.hoehe, l = roh.links, r = roh.rechts;
      const summe = `${h} * (${l}) + ${h} * ${r}`;
      const q = quad(summe);
      return {
        felder: [`${h}(${l} + ${r})`, bau([[q.c2, "x^2"], [q.c1, "x"], [q.c0, ""]])],
        falschFelder: [[0, bau([[q.c2, "x^2"], [q.c1, "x"], [q.c0, ""]]), "Produktform"], [1, (() => { const w = quad(`${h} * (${l}) + ${r}`); return bau([[w.c2, "x^2"], [w.c1, "x"], [w.c0, ""]]); })(), "auch"]],
      };
    },
  });

  await pruefeAufgabe(page, bericht, {
    nr: 8, name: "C8 Aufeinanderfolgende Zahlen", runden: RUNDEN, mindestensVerschieden: SCHRANKE[7],
    deute: (frage) => {
      const m = frage.match(/Addiert man (\S+) aufeinanderfolgende (natürliche|gerade|ungerade) Zahlen.*?Die kleinste Zahl heißt (n|2n \+ 1|2n)\./);
      if (!m) return null;
      const k = { drei: 3, vier: 4, fünf: 5, sechs: 6, sieben: 7 }[m[1]];
      const kleinste = { natürliche: "n", gerade: "2n", ungerade: "2n + 1" }[m[2]];
      pruefe(m[3] === kleinste, `C8: die kleinste Zahl heißt ${m[3]}, erwartet ${kleinste}`);
      const schritt = m[2] === "natürliche" ? 1 : 2;
      const summe = Array.from({ length: k }, (_, i) => `(${kleinste} + ${i * schritt})`).join(" + ");
      const { c1: A, c0: B } = linear(summe, "n");
      const g = ggT(A, B);
      const falschFelder = [[1, bau([[A, "n"], [B, ""]]), "Produktform"]];
      const d = [2, 3, 5].find((p) => g % p === 0 && p < g);
      if (d) falschFelder.push([1, produkt(d, [[A / d, "n"], [B / d, ""]]), "noch nicht vollständig"]);
      if (k !== g) falschFelder.push([2, k, "Anzahl"]);
      return { felder: [bau([[A, "n"], [B, ""]]), produkt(g, [[A / g, "n"], [B / g, ""]]), g], falschFelder };
    },
  });

  // Zwei Fassungen je Aufgabe, je zur Hälfte: In 20 Zügen fehlt eine nur mit Wahrscheinlichkeit 2 · 2⁻²⁰.
  for (const [name, soll] of [["C3", ["x", "a"]], ["C4", ["+", "−"]], ["C6", ["a", "b"]]]) {
    pruefe(soll.every((f) => FASSUNGEN[name].has(f)), `${name}: gezogen wurden nur die Fassungen ${[...FASSUNGEN[name]].join(", ")} — eine fällt aus dem Vorrat`);
  }
}

// ── Gerüst ────────────────────────────────────────────────────────────────

const SUMME_MAL_SUMME = /\([^()]*\S\s[+−]\s[^()]*\)\s*(?:·\s*)?\([^()]*\S\s[+−]\s[^()]*\)/;
async function geruest(page) {
  const folge = await page.evaluate(() => [...document.querySelectorAll("main section[id]")].map((s) => s.id));
  const soll = ["sec-distributiv", "sec-ausmultiplizieren", "sec-ausklammern", "sec-vollstaendig", "sec-vernetzung", "sec-formelsammlung", "sec-uebungen", "sec-selbsteinschaetzung"];
  pruefe(JSON.stringify(folge) === JSON.stringify(soll), `Gerüst: Abschnitte ${folge.join(", ")} statt ${soll.join(", ")}`);
  // Kein Vorgriff: Summen mal Summen (Thema 4) und binomische Formeln (Thema 5) kommen später.
  for (const id of soll.slice(0, 4)) {
    const t = await page.evaluate((i) => { const e = document.getElementById(i).cloneNode(true); e.querySelectorAll(".uebung-sprung, .quiz").forEach((x) => x.remove()); return e.innerText; }, id);
    // Summe mal Summe: zwei Klammern hintereinander, in beiden ein Rechenzeichen zwischen zwei Gliedern.
    // (−3) · (−5) ist kein Vorgriff — da stehen nur negative Zahlen in Klammern.
    pruefe(!/binomisch/i.test(t) && !SUMME_MAL_SUMME.test(t), `Gerüst: ${id} greift auf Summe mal Summe oder die binomischen Formeln vor`);
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
  const karte = menue.match(/<a class="menu-card"[^>]*href="ausmultiplizieren-ausklammern\.html"[^>]*>\s*<h2>([^<]*)<\/h2>/);
  pruefe(!!karte && /data-section="klasse-8"/.test(karte[0]) && /\shidden\b/.test(karte[0]) && karte[1] === "3. Ausmultiplizieren und Ausklammern", "Gerüst: die Menükarte fehlt oder ist unvollständig");
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
      await teil("distributiv", distributiv, page);
      await teil("ausmultiplizieren", ausmultiplizieren, page);
      await teil("ausklammern", ausklammern, page);
      await teil("vollstaendig", vollstaendig, page);
      await teil("quizze", quizze, page);
      await teil("aufgaben", aufgaben, page);
    } else if (will("dunkel")) {
      await setzeRegler(page, "dg-t", 100);
      await waehle(page, "ak-term", "4");
      await setzeRegler(page, "ak-k", 4);
      await pruefeKontrast(page, bericht, "dunkel");
      await pruefeStrichKontrast(page, bericht, "dunkel, Rechteck", "#dg-mount rect.tm-kachel, #ak-mount rect.tm-kachel");
      await restAbgehoben(page, "dunkel, Ausklammern 10x + 15 in 4 Zeilen");
      await waehle(page, "dg-art", "x");
      await pruefeStrichKontrast(page, bericht, "dunkel, Rechteck mit x", "#dg-mount rect.tm-kachel");
    }
    await pruefeNotation(page, bericht, wo);
    for (const s of page.stoerungen) pruefe(false, `${wo}: ${s}`);
    await page.close();
  }
  await browser.close();
  bericht.abschluss();
})();
