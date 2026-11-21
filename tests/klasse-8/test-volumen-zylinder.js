// Fachliche Prüfung: Klasse 8, Körper, Thema 5 „Volumen von Zylindern“.
//
// Nachgerechnet wird aus den Raumpunkten der Zeichnungen (data-p3) mit eigenen Verfahren
// (tests/lib/koerper.js):
//
//   1. ANNÄHERUNG: Die Deckfläche des Prismas ist ein regelmäßiges n-Eck im Kreis; ihr gezeichneter
//      Inhalt (Dreiecksfächer) ist G_n der Bilanz, rückt an π · r² heran; V_n = G_n · h.
//   2. SCHEIBEN: so viele Scheiben wie angezeigt, jede 1 cm hoch mit dem Radius r, übereinander; der
//      Regler kann nicht über die Höhe hinaus; V = π · r² · h.
//   3. FÜLLHÖHE: Die Wasseroberfläche liegt bei V : (π · r²); sie stimmt mit der Bilanz.
//   4. HOHLZYLINDER: Rohr, Loch und Kern haben ihre Radien; der Kern gleitet starr nach oben; der
//      Innenradius bleibt unter dem Außenradius; V = π · (R² − r²) · h.
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
const SEITE = "/mathematik/klasse-8/koerper/volumen-zylinder.html";
const WURZEL = path.resolve(__dirname, "..", "..");
const NUR = (process.env.UPLANT_NUR || "").split(",").map((t) => t.trim()).filter(Boolean);
const will = (teil) => NUR.length === 0 || NUR.includes(teil);
const { lies, rolleText } = K;
const PI = Math.PI;
const nahe = (a, b, eps = 1e-6) => Math.abs(a - b) < eps;
const z = (s) => Number(String(s).replace(/\./g, "").replace(",", "."));
const r2 = (x) => Math.round(x * 100) / 100;
const TOL = 0.015;
const anzeige = (s, soll, mess = 0) => Math.abs(zahl(s) - soll) <= 0.005 + mess + 1e-9;
const mit314 = (soll, w) => (Math.abs(w - soll) > 0.05 ? w : NaN);
// Ein Kreis (als Vieleck) mit Mitte auf der Achse, Radius r, in der Höhe y?
const kreisAuf = (pts, r, y, mx = 0, mz = 0) => pts.length >= 24 && pts.every((p) => nahe(Math.hypot(p[0] - mx, p[2] - mz), r, 1e-3) && nahe(p[1], y, 6e-5));   // data-p3 trägt vier Nachkommastellen

// ── 1. Annäherung ──────────────────────────────────────────────────────────

const ECKEN = [3, 4, 5, 6, 8, 12, 24, 48];
async function annaeherung(page) {
  for (let k = 0; k < ECKEN.length; k++) {
    const n = ECKEN[k];
    await setzeRegler(page, "na-k", k);
    for (const [r, h] of [[1, 2], [3, 4], [4, 6]]) {
      await setzeRegler(page, "na-r", r); await setzeRegler(page, "na-h", h);
      const wo = `Annäherung n = ${n}, r = ${r}, h = ${h}`;
      const teile = await lies(page, "na-mount");
      K.ansichtBild(pruefe, teile, 22, 0, wo);
      const d = teile.find((t) => t.rolle === "deckel");
      pruefe(!!d && d.p3.length === n && d.p3.every((p) => nahe(Math.hypot(p[0], p[2]), r, 1e-3) && nahe(p[1], h)), `${wo}: die Deckfläche ist kein ${n}-Eck im Kreis`);
      if (!d) continue;
      const Gn = K.inhalt3(d.p3), G = PI * r * r;
      pruefe(anzeige(await rolleText(page, '#na-bilanz [data-rolle="Gn"]'), Gn, n * 1e-3) && anzeige(await rolleText(page, '#na-bilanz [data-rolle="G"]'), G), `${wo}: G_n oder π · r² stimmen nicht mit der Zeichnung`);
      pruefe(anzeige(await rolleText(page, '#na-bilanz [data-rolle="Vn"]'), Gn * h, n * h * 1e-3) && anzeige(await rolleText(page, '#na-bilanz [data-rolle="V"]'), G * h), `${wo}: V_n oder π · r² · h stimmen nicht`);
      pruefe(Gn < G && (n < 48 || Gn > 0.99 * G), `${wo}: G_n = ${Gn.toFixed(3)} liegt nicht unter, bei 48 Ecken nicht dicht an π · r² = ${G.toFixed(3)}`);
      pruefe(teile.filter((t) => t.rolle === "speiche").length === (n <= 24 ? n : 0), `${wo}: die Dreiecke der Grundfläche fehlen oder sind zu viele`);
      pruefe(/gemessen/.test(await page.evaluate(() => document.getElementById("na-bilanz").innerText)), `${wo}: G_n steht ohne „gemessen“ da`);
    }
  }
}

// ── 2. Scheiben ────────────────────────────────────────────────────────────

async function scheiben(page) {
  for (const [r, h] of [[1, 1], [2.5, 6], [4, 8], [1.5, 3]]) {
    await setzeRegler(page, "sv-r", r); await setzeRegler(page, "sv-h", h);
    for (const wunsch of [0, 2, h, 8]) {
      const k = await setzeRegler(page, "sv-k", wunsch);
      const wo = `Scheiben r = ${r}, h = ${h}, ${wunsch} gewünscht`;
      pruefe(k === Math.min(wunsch, h), `${wo}: der Regler steht auf ${k}, möglich sind höchstens ${h}`);
      const teile = await lies(page, "sv-mount");
      if (teile.length) K.ansichtBild(pruefe, teile, 22, 0, wo);
      const deckel = await page.evaluate(() => [...document.querySelectorAll('#sv-mount [data-rolle="deckel"]')].map((e) => ({ i: e.dataset.scheibe, p: e.dataset.p3.trim().split(/\s+/).map((s) => s.split(",").map(Number)) })));
      pruefe(deckel.length === k && deckel.every((d) => kreisAuf(d.p, r, Number(d.i) + 1)), `${wo}: ${deckel.length} Scheiben statt ${k}, oder eine liegt falsch`);
      pruefe(anzeige(await rolleText(page, '#sv-bilanz [data-rolle="Vk"]'), k * PI * r * r) && anzeige(await rolleText(page, '#sv-bilanz [data-rolle="V"]'), PI * r * r * h), `${wo}: die Bilanz stimmt nicht`);
    }
  }
}

// ── 3. Füllhöhe ────────────────────────────────────────────────────────────

async function fuellen(page) {
  for (const [V, r] of [[250, 4], [500, 3], [100, 6], [350, 4.5]]) {
    await setzeRegler(page, "fu-v", V); await setzeRegler(page, "fu-r", r);
    for (const tp of [0, 40, 100]) {
      const t = (await setzeRegler(page, "fu-t", tp)) / 100;
      const wo = `Füllhöhe ${V} ml, r = ${r}, ${tp} %`;
      const teile = await lies(page, "fu-mount");
      K.ansichtBild(pruefe, teile, 22, 0, wo);
      const hw = (t * V) / (PI * r * r);
      const w = teile.filter((x) => x.rolle === "deckel");
      if (t === 0) pruefe(w.length === 0, `${wo}: Wasser im leeren Gefäß`);
      else pruefe(w.length === 1 && kreisAuf(w[0].p3, r, hw), `${wo}: die Wasseroberfläche liegt nicht bei V : (π · r²) = ${hw.toFixed(3)}`);
      pruefe(anzeige(await rolleText(page, '#fu-bilanz [data-rolle="h"]'), hw), `${wo}: die Füllhöhe der Bilanz stimmt nicht`);
      // Das Gefäß ist 20 cm hoch und fasst das Wasser.
      const glas = teile.filter((x) => x.rolle === "glas");
      pruefe(glas.some((x) => x.p3.every((p) => nahe(p[1], 20))) && hw < 20, `${wo}: das Glas ist nicht 20 cm hoch oder läuft über`);
    }
  }
}

// ── 4. Hohlzylinder ────────────────────────────────────────────────────────

async function hohl(page) {
  for (const [R, rw, h] of [[3, 2, 4], [4, 1.5, 5], [2, 3.5, 2], [2.5, 2, 3]]) {
    await setzeRegler(page, "hz-gr", R);
    const r = await setzeRegler(page, "hz-kr", rw);
    await setzeRegler(page, "hz-h", h);
    pruefe(r <= R - 0.5 + 1e-9 && r === Math.min(rw, R - 0.5), `Hohlzylinder R = ${R}: der Innenradius steht auf ${r}`);
    for (const tp of [0, 30, 60, 100]) {
      const t = (await setzeRegler(page, "hz-t", tp)) / 100;
      const wo = `Hohlzylinder R = ${R}, r = ${r}, h = ${h}, ${tp} %`;
      const teile = await lies(page, "hz-mount");
      K.ansichtBild(pruefe, teile, 22, 0, wo);
      const rohr = teile.find((x) => x.rolle === "deckel" && /\bkp-g\b/.test(x.klasse));
      const loch = teile.find((x) => x.rolle === "loch");
      pruefe(!!rohr && kreisAuf(rohr.p3, R, h) && !!loch && kreisAuf(loch.p3, r, h), `${wo}: Rohr oder Loch haben nicht die Radien R und r`);
      // Der Kern: oben ein Kreis mit r in der Höhe h + Hub; der Hub wächst mit t.
      const kern = teile.filter((x) => /\bkp-a\b/.test(x.klasse) && x.rolle === "deckel");
      const oben = Math.max(...kern.map((x) => x.p3[0][1]));
      pruefe(kern.length === 1 && kreisAuf(kern[0].p3, r, oben) && (t === 0 ? nahe(oben, h) : oben > h + 1e-6), `${wo}: der Kern liegt nicht im Loch bzw. darüber`);
      pruefe(anzeige(await rolleText(page, '#hz-bilanz [data-rolle="V"]'), PI * (R * R - r * r) * h), `${wo}: V ist nicht π · (R² − r²) · h`);
    }
  }
}

// ── Kontrollfragen ─────────────────────────────────────────────────────────

async function quizze(page) {
  const ids = await page.evaluate(() => [...document.querySelectorAll(".quiz")].map((e) => e.id));
  pruefe(ids.length === 4, `Kontrollfragen: ${ids.length} statt 4`);
  for (const sec of ["sec-annaeherung", "sec-volumen", "sec-umkehr", "sec-hohl"]) pruefe(await page.evaluate((x) => document.querySelectorAll(`#${x} .quiz`).length === 1, sec), `Kontrollfragen: ${sec} hat nicht genau eine`);
  const RICHTIG = {
    "quiz-annaeherung": (o) => /Prismen annähern/.test(o),
    "quiz-volumen": (o) => anzeige(o, PI * 9 * 10),
    "quiz-umkehr": (o) => anzeige(o, 500 / (PI * 16)),
    "quiz-hohl": (o) => anzeige(o, PI * (25 - 9) * 10),
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

const vFalsch = (r, h, mitD) => [[r === 1 ? NaN : PI * r * h, "quadriert"], [r === 2 ? NaN : 2 * PI * r * h, "Mantel"], [mitD ? 4 * PI * r * r * h : NaN, "Durchmesser quadriert"], [mit314(PI * r * r * h, 3.14 * r * r * h), "3,14"]];

// Gemessen mit tests/werkzeug-streuung.js (UPLANT_ZUEGE=20, je 200 Würfe): verschieden 113/44/41/41/99/140/125/150
// von 200, also n ≈ 156/44/41/41/123/262/194/329.
const SCHRANKE = [14, 10, 10, 10, 13, 15, 14, 15];
const RUNDEN = 20;
const FASSUNGEN = { W1: new Set() };

async function aufgaben(page) {
  await pruefeAufgabe(page, bericht, {
    nr: 1, name: "W1 Volumen", runden: RUNDEN, mindestensVerschieden: SCHRANKE[0],
    deute: (frage) => {
      const m = frage.match(/Ein Zylinder hat (den Durchmesser|den Radius) ([\d,]+) cm und ist (\d+) cm hoch\. Wie groß ist sein Volumen/);
      if (!m) return null;
      FASSUNGEN.W1.add(m[1]);
      const mitD = m[1] === "den Durchmesser", r = mitD ? z(m[2]) / 2 : z(m[2]), h = Number(m[3]);
      return { richtig: r2(PI * r * r * h), toleranz: TOL, falsch: vFalsch(r, h, mitD) };
    },
  });
  await pruefeAufgabe(page, bericht, {
    nr: 2, name: "W2 Kochtopf", runden: RUNDEN, mindestensVerschieden: SCHRANKE[1],
    deute: (frage) => {
      const m = frage.match(/Durchmesser (\d+) cm und ist (\d+) cm hoch\. Wie viele Liter/);
      if (!m) return null;
      const r = Number(m[1]) / 2, h = Number(m[2]), V = PI * r * r * h, l = V / 1000;
      return { richtig: r2(l), toleranz: TOL, falsch: [[V, "Das sind cm³"], [V / 100, "nicht 100 cm³"], [4 * l, "Durchmesser quadriert"], [mit314(l, (3.14 * r * r * h) / 1000), "3,14"]] };
    },
  });
  await pruefeAufgabe(page, bericht, {
    nr: 3, name: "W3 Füllhöhe", runden: RUNDEN, mindestensVerschieden: SCHRANKE[2],
    deute: (frage) => {
      const m = frage.match(/Innenradius (\d+) cm werden ([\d,]+) l Wasser gegossen/);
      if (!m) return null;
      const r = Number(m[1]), l = z(m[2]), h = (l * 1000) / (PI * r * r);
      return { richtig: r2(h), toleranz: TOL, falsch: [[l / (PI * r * r), "Liter in cm³"], [(l * 1000) / (2 * PI * r), "nicht durch den Umfang"], [(l * 1000) / (PI * r), "Radius wird quadriert"], [mit314(h, (l * 1000) / (3.14 * r * r)), "3,14"]] };
    },
  });
  await pruefeAufgabe(page, bericht, {
    nr: 4, name: "W4 doppelter Radius", runden: RUNDEN, mindestensVerschieden: SCHRANKE[3],
    deute: (frage) => {
      const m = frage.match(/Dose A hat den Radius ([\d,]+) cm und die Höhe (\d+) cm/);
      if (!m) return null;
      const r = z(m[1]), h = Number(m[2]), VA = PI * r * r * h, VB = PI * (2 * r) ** 2 * (h / 2);
      return { felder: [r2(VA), r2(VB)], toleranz: TOL, falschFelder: [...vFalsch(r, h, false).map(([w, mu]) => [0, w, mu]), [1, VA, "vierfache Grundfläche"], [1, 4 * VA, "auch halbiert"], [1, PI * 2 * r * (h / 2), "quadriert"]] };
    },
  });
  await pruefeAufgabe(page, bericht, {
    nr: 5, name: "W5 Rohr", runden: RUNDEN, mindestensVerschieden: SCHRANKE[4],
    deute: (frage) => {
      const m = frage.match(/ist (\d+) cm lang, hat den Außendurchmesser (\d+) cm und die Wandstärke ([\d,]+) cm/);
      if (!m) return null;
      const h = Number(m[1]), D = Number(m[2]), w = z(m[3]), R = D / 2, r = R - w;
      return { richtig: r2(PI * (R * R - r * r) * h), toleranz: TOL, falsch: [[PI * (R - r) ** 2 * h, "Erst quadrieren"], [PI * R * R * h, "volle Zylinder"], [PI * (R * R + r * r) * h, "nicht addiert"], [PI * (D * D - (D - w) ** 2) * h, "Rechne mit Radien"]] };
    },
  });
  await pruefeAufgabe(page, bericht, {
    nr: 6, name: "W6 Masse", runden: RUNDEN, mindestensVerschieden: SCHRANKE[5],
    deute: (frage) => {
      const m = frage.match(/aus (\S+) \(Dichte ([\d,]+) g\/cm³\) ist (\d+) cm lang; sein Außenradius ist ([\d,]+) cm, sein Innenradius ([\d,]+) cm/);
      if (!m) return null;
      const rho = z(m[2]), L = Number(m[3]), R = z(m[4]), r = z(m[5]);
      const V = PI * (R * R - r * r) * L, masse = (V * rho) / 1000;
      return { felder: [r2(V), r2(masse)], toleranz: TOL, falschFelder: [[0, PI * (R - r) ** 2 * L, "Erst quadrieren"], [0, PI * R * R * L, "Loch"], [1, V * rho, "Gramm"], [1, V / rho / 1000, "nicht geteilt"]] };
    },
  });
  await pruefeAufgabe(page, bericht, {
    nr: 7, name: "W7 Wassertank", runden: RUNDEN, mindestensVerschieden: SCHRANKE[6],
    deute: (frage) => {
      const m = frage.match(/Durchmesser ([\d,]+) m und ist ([\d,]+) m hoch\. Ein Schlauch liefert (\d+) Liter je Minute/);
      if (!m) return null;
      const d = z(m[1]), h = z(m[2]), q = Number(m[3]);
      const V = PI * (d / 2) ** 2 * h, l = V * 1000, min = l / q;
      return { felder: [r2(l), r2(min)], toleranz: TOL, falschFelder: [[0, V, "1 m³ = 1000 l"], [0, 4 * l, "Durchmesser quadriert"], [0, 100 * V, "nicht 100 l"], [1, min / 60, "Stunden"], [1, l * q, "nicht malnehmen"]] };
    },
  });
  await pruefeAufgabe(page, bericht, {
    nr: 8, name: "W8 Werkstück", runden: RUNDEN, mindestensVerschieden: SCHRANKE[7],
    deute: (frage) => {
      const m = frage.match(/Werkstück \((\d+) cm × (\d+) cm × (\d+) cm\) wird senkrecht durchbohrt: Die Bohrung ist (\d+) cm lang und hat den Durchmesser ([\d,]+) cm/);
      if (!m) return null;
      const [a, b, c] = m.slice(1, 4).map(Number), d = z(m[5]);
      pruefe(Number(m[4]) === c, "W8: die Bohrung ist nicht so lang wie das Werkstück hoch");
      const Q = a * b * c, Z = PI * (d / 2) ** 2 * c;
      return { richtig: r2(Q - Z), toleranz: TOL, falsch: [[Q + Z, "abziehen, nicht addieren"], [Q - PI * d * d * c, "Radius r = d : 2"], [Q - 2 * PI * (d / 2) * c, "Mantel der Bohrung"]] };
    },
  });
  pruefe(FASSUNGEN.W1.size === 2, `W1: gezogen nur ${[...FASSUNGEN.W1]}`);
}

// ── Gerüst ─────────────────────────────────────────────────────────────────

async function geruest(page) {
  const folge = await page.evaluate(() => [...document.querySelectorAll("main section[id]")].map((x) => x.id));
  const soll = ["sec-annaeherung", "sec-volumen", "sec-umkehr", "sec-hohl", "sec-vernetzung", "sec-formelsammlung", "sec-uebungen", "sec-selbsteinschaetzung"];
  pruefe(JSON.stringify(folge) === JSON.stringify(soll), `Gerüst: Abschnitte ${folge.join(", ")} statt ${soll.join(", ")}`);
  // Kein Vorgriff: keine Quadratwurzel (r aus V).
  for (const id of soll.slice(0, 4)) pruefe(!/√|Wurzel/.test(await page.evaluate((i) => document.getElementById(i).innerText, id)), `Gerüst: ${id} greift auf die Quadratwurzel vor`);
  const b2 = await page.evaluate(() => document.querySelector("#sec-volumen .beispiel-box").innerText);
  pruefe(b2.includes(`${String(r2(PI * 90)).replace(".", ",")} cm³`), "Gerüst: das Beispiel in Abschnitt 2 rechnet falsch");
  const b3 = await page.evaluate(() => document.querySelector("#sec-umkehr .beispiel-box").innerText);
  pruefe(b3.includes(`${String(r2(250 / (16 * PI))).replace(".", ",")} cm`), "Gerüst: das Beispiel in Abschnitt 3 rechnet falsch");
  const links = await page.evaluate(() => [...document.querySelectorAll("main a[href]")].map((a) => a.getAttribute("href")).filter((h) => !h.startsWith("#") && !h.startsWith("http")));
  for (const href of new Set(links)) {
    const ziel = new URL(href.split("#")[0], "http://localhost/mathematik/klasse-8/koerper/").pathname;
    const antwort = await page.request.get("http://localhost:" + (process.env.UPLANT_PORT || "8936") + ziel);
    pruefe(antwort.ok(), `Gerüst: der Verweis „${href}“ führt ins Leere`);
    const anker = href.split("#")[1];
    if (anker && antwort.ok() && /\.html$/.test(ziel)) pruefe((await antwort.text()).includes(`id="${anker}"`), `Gerüst: die Sprungmarke „${anker}“ fehlt in ${ziel}`);
  }
  const menue = fs.readFileSync(path.join(WURZEL, "mathematik/klasse-8/koerper/index.html"), "utf8");
  const karte = menue.match(/<a class="menu-card"[^>]*href="volumen-zylinder\.html"[^>]*>\s*<h2>([^<]*)<\/h2>/);
  pruefe(!!karte && /data-section="klasse-8"/.test(karte[0]) && /\shidden\b/.test(karte[0]) && karte[1] === "5. Volumen von Zylindern", "Gerüst: die Menükarte fehlt oder ist unvollständig");
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
      await teil("annaeherung", annaeherung, page);
      await teil("scheiben", scheiben, page);
      await teil("fuellen", fuellen, page);
      await teil("hohl", hohl, page);
      await teil("quizze", quizze, page);
      await teil("aufgaben", aufgaben, page);
    } else if (will("dunkel")) {
      await setzeRegler(page, "hz-t", 60);
      await pruefeKontrast(page, bericht, "dunkel");
      await pruefeStrichKontrast(page, bericht, "dunkel, Linien und Flächen", "#na-mount line, #na-mount polyline, #sv-mount polyline, #fu-mount polyline, #fu-mount line, #hz-mount polyline");
      await pruefeTextAufFlaeche(page, bericht, "dunkel, Beschriftungen", "#na-mount text, #sv-mount text, #fu-mount text, #hz-mount text");
    }
    await pruefeNotation(page, bericht, wo);
    for (const s of page.stoerungen) pruefe(false, `${wo}: ${s}`);
    await page.close();
  }
  await browser.close();
  bericht.abschluss();
})();
