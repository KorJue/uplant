// Fachliche Prüfung: Klasse 8, Körper, Thema 2 „Oberflächeninhalt von Prismen“.
//
// Nachgerechnet wird aus den Raumpunkten der Zeichnungen (data-p3) mit eigenen Verfahren
// (tests/lib/koerper.js):
//
//   1. QUADER: Das Netz bleibt beim Aufklappen starr, liegt am Ende flach in wahrer Größe ohne
//      Überdeckung; die Summe der gezeichneten Flächen ist die Oberfläche der Bilanz — und die Formel
//      2ab + 2ac + 2bc; jede Fläche ist richtig beschriftet.
//   2. MANTEL: nur die Seitenflächen, starr, am Ende ein Streifen u × h; M = Summe = u · h.
//   3. O = 2G + M: G ist der Inhalt der gezeichneten Grundfläche (Dreiecksfächer) und der vorgegebenen
//      Form (Gaußsche Trapezformel); O = Summe aller Flächen.
//   4. OFFENE KÖRPER: genau die erwartete Fläche fehlt (Deckel oben, Boden unten, Öffnung oben), das
//      Netz bleibt starr und liegt am Ende flach in wahrer Größe; O = Summe der vorhandenen Flächen;
//      die Umrechnung der Einheit stimmt.
//   Dazu die Kontrollfragen, alle Aufgaben mit ihren Fehlern (die L-Figur aus dem SVG gelesen), das
//   Gerüst (kein Vorgriff auf das Volumen in cm³) und der Dunkelmodus.

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
const SEITE = "/mathematik/klasse-8/koerper/oberflaeche-prisma.html";
const WURZEL = path.resolve(__dirname, "..", "..");
const NUR = (process.env.UPLANT_NUR || "").split(",").map((t) => t.trim()).filter(Boolean);
const will = (teil) => NUR.length === 0 || NUR.includes(teil);
const { dist, inhalt3, starrGleich, lies, texte, rolleText, waehle, ueberdecken } = K;
const kavalierBild = (teile, wo) => K.kavalierBild(pruefe, teile, wo);

const FORMEN = {
  "dreieck-rw": [[0, 0], [4, 0], [0, 3]],
  "dreieck-gs": [[0, 0], [6, 0], [3, 4]],
  trapez: [[0, 0], [8, 0], [5, 4], [3, 4]],
  haus: [[0, 0], [6, 0], [6, 3], [3, 7], [0, 3]],
  sechseck: [[1.5, 0], [4.5, 0], [6, 2], [4.5, 4], [1.5, 4], [0, 2]],
};
const gauss = (P) => Math.abs(P.reduce((s, p, i) => s + p[0] * P[(i + 1) % P.length][1] - P[(i + 1) % P.length][0] * p[1], 0)) / 2;
const seiten = (P) => P.map((p, i) => Math.hypot(P[(i + 1) % P.length][0] - p[0], P[(i + 1) % P.length][1] - p[1]));
const sum = (xs) => xs.reduce((s, x) => s + x, 0);
const key = (x) => `${x.rolle}${x.nr ?? ""}`;
// Deutsche Zahl mit Tausenderpunkt und Komma.
const z = (s) => Number(String(s).replace(/\./g, "").replace(",", "."));
const nahe = (a, b, eps = 1e-6) => Math.abs(a - b) < eps;

// Gemeinsamer Teil der Netz-Prüfungen: starr gegenüber der Anfangsstellung; am Ende flach, in wahrer
// Größe, ohne Überdeckung.
function pruefeNetz(fl, anfang, t, wo, eben) {
  const verbogen = fl.filter((x) => !anfang[key(x)] || !starrGleich(x.p3, anfang[key(x)]));
  pruefe(verbogen.length === 0, `${wo}: ${verbogen.map(key).join(", ")} nicht starr geblieben`);
  if (t !== 1) return;
  pruefe(fl.every((x) => x.p3.every(eben)), `${wo}: das Netz liegt am Ende nicht flach in einer Ebene`);
  const S = K.massstab(fl);
  pruefe(K.wahreGroesse(fl, S) === 0, `${wo}: das Netz ist am Ende nicht in wahrer Größe gezeichnet`);
  for (let i = 0; i < fl.length; i++) for (let j = i + 1; j < fl.length; j++) pruefe(!ueberdecken(fl[i].p2, fl[j].p2), `${wo}: ${key(fl[i])} und ${key(fl[j])} überdecken sich`);
}
const zImNetz = (p) => Math.abs(p[2]) < 1e-6;

// ── 1. Quader ──────────────────────────────────────────────────────────────

async function quader(page) {
  for (const [a, b, c] of [[5, 3, 2], [7, 4, 4], [2, 1, 1], [4, 4, 3]]) {
    await setzeRegler(page, "qd-a", a); await setzeRegler(page, "qd-b", b); await setzeRegler(page, "qd-c", c);
    let anfang = null;
    for (const tp of [0, 30, 60, 100]) {
      const t = (await setzeRegler(page, "qd-t", tp)) / 100;
      const wo = `Quader ${a} × ${b} × ${c}, ${tp} %`;
      const teile = await lies(page, "qd-mount");
      kavalierBild(teile, wo);
      const fl = teile.filter((x) => x.tag === "polygon");
      pruefe(fl.length === 6, `${wo}: ${fl.length} Flächen statt 6`);
      if (t === 0) { anfang = Object.fromEntries(fl.map((x) => [key(x), x.p3])); K.pruefeVerdeckt(pruefe, teile, wo); }
      else pruefeNetz(fl, anfang, t, wo, zImNetz);
      const O = 2 * (a * b + a * c + b * c);
      pruefe(nahe(sum(fl.map((x) => inhalt3(x.p3))), O, 1e-3), `${wo}: die gezeichneten Flächen haben zusammen nicht ${O} cm²`);
      pruefe(zahl(await rolleText(page, '#qd-bilanz [data-rolle="O"]')) === O, `${wo}: die Bilanz nennt nicht O = ${O} cm²`);
      if (t === 1) {
        const tx = (await texte(page, "qd-mount", "flaeche-text")).map((x) => zahl(x.text)).sort((p, q) => p - q);
        const soll = fl.map((x) => Math.round(inhalt3(x.p3) * 1e4) / 1e4).sort((p, q) => p - q);
        pruefe(JSON.stringify(tx) === JSON.stringify(soll), `${wo}: die Flächen sind als ${tx.join(", ")} beschriftet, gezeichnet sind ${soll.join(", ")}`);
      }
    }
  }
}

// ── 2. Mantel ──────────────────────────────────────────────────────────────

async function mantel(page) {
  for (const form of Object.keys(FORMEN)) {
    await waehle(page, "mt-form", form);
    const L = seiten(FORMEN[form]), u = sum(L), n = L.length;
    for (const h of [2, 5]) {
      const gh = await setzeRegler(page, "mt-h", h);
      let anfang = null;
      for (const tp of [0, 35, 70, 100]) {
        const t = (await setzeRegler(page, "mt-t", tp)) / 100;
        const wo = `Mantel ${form}, h = ${gh}, ${tp} %`;
        const teile = await lies(page, "mt-mount");
        kavalierBild(teile, wo);
        const fl = teile.filter((x) => x.tag === "polygon");
        pruefe(fl.length === n && fl.every((x) => x.rolle === "seite"), `${wo}: ${fl.length} Flächen, erwartet nur die ${n} Seitenflächen`);
        if (t === 0) anfang = Object.fromEntries(fl.map((x) => [key(x), x.p3]));
        else pruefeNetz(fl, anfang, t, wo, zImNetz);
        pruefe(fl.every((x) => K.istRechteck(x.p3, L[Number(x.nr)], gh)), `${wo}: die Seitenflächen sind keine Rechtecke Seite × h`);
        if (t === 1) {
          const xs = fl.flatMap((x) => x.p3.map((p) => p[0])), ys = fl.flatMap((x) => x.p3.map((p) => p[1]));
          pruefe(nahe(Math.max(...xs) - Math.min(...xs), u, 2e-3) && nahe(Math.max(...ys) - Math.min(...ys), gh, 2e-3), `${wo}: der Mantel ist am Ende kein Rechteck ${u} × ${gh}`);
          const ut = await page.evaluate(() => document.querySelector('#mt-mount [data-rolle="u-text"]')?.textContent);
          pruefe(ut === `u = ${String(u).replace(".", ",")} cm`, `${wo}: der Streifen ist als „${ut}“ beschriftet`);
        }
        const M = zahl(await rolleText(page, '#mt-bilanz [data-rolle="M"]'));
        pruefe(nahe(M, u * gh) && nahe(sum(fl.map((x) => inhalt3(x.p3))), u * gh, 1e-3), `${wo}: M = ${M} statt u · h = ${u * gh}`);
        pruefe(nahe(zahl(await rolleText(page, '#mt-bilanz [data-rolle="u"]')), u), `${wo}: die Bilanz nennt einen falschen Umfang`);
      }
    }
  }
}

// ── 3. O = 2G + M ──────────────────────────────────────────────────────────

async function formel(page) {
  for (const form of Object.keys(FORMEN)) {
    await waehle(page, "fo-form", form);
    const P = FORMEN[form], u = sum(seiten(P)), G = gauss(P);
    for (const h of [2, 4, 5]) {
      const gh = await setzeRegler(page, "fo-h", h);
      let anfang = null;
      for (const tp of [0, 50, 100]) {
        const t = (await setzeRegler(page, "fo-t", tp)) / 100;
        const wo = `Formel ${form}, h = ${gh}, ${tp} %`;
        const teile = await lies(page, "fo-mount");
        kavalierBild(teile, wo);
        const fl = teile.filter((x) => x.tag === "polygon");
        pruefe(fl.length === P.length + 2, `${wo}: ${fl.length} Flächen statt ${P.length + 2}`);
        if (t === 0) anfang = Object.fromEntries(fl.map((x) => [key(x), x.p3]));
        else pruefeNetz(fl, anfang, t, wo, zImNetz);
        const b = { G: zahl(await rolleText(page, '#fo-bilanz [data-rolle="G"]')), M: zahl(await rolleText(page, '#fo-bilanz [data-rolle="M"]')), O: zahl(await rolleText(page, '#fo-bilanz [data-rolle="O"]')) };
        const gGez = inhalt3(fl.find((x) => x.rolle === "grund").p3);
        pruefe(nahe(b.G, G) && nahe(gGez, G, 1e-3), `${wo}: G = ${b.G}, gezeichnet ${gGez.toFixed(3)}, nachgerechnet ${G}`);
        pruefe(nahe(b.M, u * gh) && nahe(b.O, 2 * G + u * gh), `${wo}: die Bilanz nennt M = ${b.M}, O = ${b.O}`);
        pruefe(nahe(sum(fl.map((x) => inhalt3(x.p3))), 2 * G + u * gh, 1e-3), `${wo}: die gezeichneten Flächen ergeben nicht O = ${2 * G + u * gh}`);
        if (t === 1) {
          const gt = await texte(page, "fo-mount", "g-text");
          pruefe(gt.length === 2 && gt.every((x) => x.text === `G = ${String(G).replace(".", ",")} cm²`), `${wo}: die Grundflächen sind nicht mit G = ${G} cm² beschriftet`);
        }
      }
    }
  }
}

// ── 4. Offene Körper ───────────────────────────────────────────────────────

const DINGE = {
  schachtel: { fehlt: "deckel", wo: "oben", einheit: "cm", liegt: false },
  zelt: { fehlt: "seite0", wo: "unten", einheit: "m", liegt: true },
  trog: { fehlt: "seite2", wo: "oben", einheit: "dm", liegt: true },
};
async function anwenden(page) {
  for (const [ding, d] of Object.entries(DINGE)) {
    await waehle(page, "an-ding", ding);
    let anfang = null;
    for (const tp of [0, 25, 50, 75, 100]) {
      const t = (await setzeRegler(page, "an-t", tp)) / 100;
      const wo = `Offen: ${ding}, ${tp} %`;
      const fl = (await lies(page, "an-mount")).filter((x) => x.tag === "polygon");
      const weg = fl.filter((x) => x.klasse.includes("kp-fehlt"));
      pruefe(weg.length === 1 && key(weg[0]) === d.fehlt, `${wo}: als fehlend markiert ist ${weg.map(key).join(", ") || "nichts"} statt ${d.fehlt}`);
      if (t === 0) {
        anfang = Object.fromEntries(fl.map((x) => [key(x), x.p3]));
        // Die fehlende Fläche liegt da, wo der Text sagt: Deckel und Öffnung oben, Boden unten.
        const ys = fl.flatMap((x) => x.p3.map((p) => p[1])), w = weg[0].p3.map((p) => p[1]);
        pruefe(d.wo === "oben" ? w.every((y) => nahe(y, Math.max(...ys), 1e-6)) : w.every((y) => nahe(y, Math.min(...ys), 1e-6)), `${wo}: die fehlende Fläche liegt nicht ${d.wo}`);
      } else pruefeNetz(fl, anfang, t, wo, d.liegt ? (p) => Math.abs(p[1]) < 1e-6 : zImNetz);
      const O = sum(fl.filter((x) => !x.klasse.includes("kp-fehlt")).map((x) => inhalt3(x.p3)));
      const bilanz = await page.evaluate(() => document.getElementById("an-bilanz").innerText);
      const bO = zahl(await rolleText(page, '#an-bilanz [data-rolle="O"]'));
      pruefe(nahe(bO, O, 1e-3), `${wo}: die Bilanz nennt O = ${bO}, die vorhandenen Flächen ergeben ${O.toFixed(3)}`);
      const um = bilanz.match(/= ([\d.,]+) (dm|m)²\s*$/);
      // Umgerechnet wird die Zahl der Bilanz (die Raumpunkte sind gerundet, ihre Summe nur auf 10⁻³ genau).
      const soll = d.einheit === "m" ? [bO * 100, "dm"] : d.einheit === "dm" ? [bO / 100, "m"] : [bO / 100, "dm"];
      pruefe(!!um && nahe(z(um[1]), soll[0], 1e-6) && um[2] === soll[1], `${wo}: die Umrechnung „${um && um[0]}“ stimmt nicht (${soll[0]} ${soll[1]}²)`);
    }
  }
}

// ── Kontrollfragen ─────────────────────────────────────────────────────────

async function quizze(page) {
  const ids = await page.evaluate(() => [...document.querySelectorAll(".quiz")].map((e) => e.id));
  pruefe(ids.length === 4, `Kontrollfragen: ${ids.length} statt 4`);
  for (const sec of ["sec-netzflaeche", "sec-mantel", "sec-formel", "sec-anwenden"]) {
    pruefe(await page.evaluate((x) => document.querySelectorAll(`#${x} .quiz`).length === 1, sec), `Kontrollfragen: ${sec} hat nicht genau eine`);
  }
  const RICHTIG = {
    "quiz-netzflaeche": (o) => zahl(o) === 6 * 3 * 3,
    "quiz-mantel": (o) => zahl(o) === (3 + 4 + 5) * 10,
    "quiz-formel": (o) => zahl(o) === 2 * 20 + 20 * 5,
    "quiz-anwenden": (o) => zahl(o) === 5 * 4 + 2 * (5 + 4) * 3,
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

// ── Die Übungsaufgaben ─────────────────────────────────────────────────────

// Liegt ein rechtwinkliges Dreieck mit diesen Seiten vor? Die Aufgaben geben schräge Seiten als
// Zahlen; hier wird geprüft, dass die Figur, die sie beschreiben, existiert.
const pyth = (a, b, c) => Math.abs(a * a + b * b - c * c) < 1e-6;
const ueberstand = (s, h) => Math.sqrt(s * s - h * h);

const liesL = (page, box) => page.evaluate((b) => {
  const svg = document.querySelector(`${b} .aufgabe-prompt svg`);
  if (!svg) return null;
  const p = svg.querySelector('[data-rolle="grundflaeche"]');
  return {
    pts: p.getAttribute("points").trim().split(/\s+/).map((s) => s.split(",").map(Number)),
    masse: Object.fromEntries([...svg.querySelectorAll("text[data-rolle]")].map((t) => [t.dataset.rolle, t.textContent])),
  };
}, box);

// Gemessen mit tests/werkzeug-streuung.js (20 Züge): E1 n ≈ 168, E2 n ≈ 429, E3 n ≈ 111, E4 n ≈ 517,
// E5 n ≈ 1104, E6 n ≈ 141, E7 n ≈ 517, E8 n ≈ 109.
const SCHRANKE = [14, 16, 13, 16, 17, 13, 16, 13];
const RUNDEN = 20;
const FASSUNGEN = { E1: new Set(), E2: new Set(), E3: new Set(), E5: new Set(), E6: new Set(), E8: new Set() };

async function aufgaben(page) {
  await pruefeAufgabe(page, bericht, {
    nr: 1, name: "E1 Quader", runden: RUNDEN, mindestensVerschieden: SCHRANKE[0],
    deute: (frage) => {
      let m = frage.match(/Ein Würfel hat die Kantenlänge (\d+) cm/);
      if (m) {
        FASSUNGEN.E1.add("würfel");
        const a = Number(m[1]);
        return { richtig: 6 * a * a, toleranz: 0.01, falsch: [[a ** 3, "Volumen des Würfels"], [4 * a * a, "sechs Flächen"], [6 * a, "Quadrat"]] };
      }
      m = frage.match(/ist (\d+) cm lang, (\d+) cm breit und (\d+) cm hoch/);
      if (!m) return null;
      FASSUNGEN.E1.add("quader");
      const [a, b, c] = m.slice(1).map(Number);
      return { richtig: 2 * (a * b + a * c + b * c), toleranz: 0.01, falsch: [[a * b + a * c + b * c, "halbe Oberfläche"], [a * b * c, "Volumen des Quaders"], [6 * a * b, "je zwei gegenüberliegende"]] };
    },
  });

  await pruefeAufgabe(page, bericht, {
    nr: 2, name: "E2 Mantel", runden: RUNDEN, mindestensVerschieden: SCHRANKE[1],
    deute: (frage) => {
      const mh = frage.match(/Das Prisma ist (\d+) cm hoch/);
      if (!mh) return null;
      const h = Number(mh[1]);
      let m, L;
      if ((m = frage.match(/ein Dreieck mit den Seiten (\d+) cm, (\d+) cm, (\d+) cm/))) { L = m.slice(1).map(Number); FASSUNGEN.E2.add("dreieck"); pruefe(L[0] + L[1] > L[2] && L[0] + L[2] > L[1] && L[1] + L[2] > L[0], `E2: das Dreieck ${L} gibt es nicht`); }
      else if ((m = frage.match(/ein Rechteck mit den Seiten (\d+) cm und (\d+) cm/))) { L = [m[1], m[2], m[1], m[2]].map(Number); FASSUNGEN.E2.add("rechteck"); }
      else if ((m = frage.match(/Sechseck mit sechs gleich langen Seiten von je (\d+) cm/))) { L = new Array(6).fill(Number(m[1])); FASSUNGEN.E2.add("sechseck"); }
      else if ((m = frage.match(/Trapez mit den parallelen Seiten (\d+) cm und (\d+) cm und den Schenkeln (\d+) cm/))) {
        const [a, c, s] = m.slice(1).map(Number);
        L = [a, s, c, s]; FASSUNGEN.E2.add("trapez");
        // Gleichschenklig: Der Überstand je Seite ist (a − c) : 2 — das Trapez muss mit dieser Schenkellänge eine Höhe haben.
        pruefe(s > (a - c) / 2, `E2: ein Trapez ${a}, ${c} mit Schenkeln ${s} gibt es nicht`);
      } else return null;
      const u = sum(L);
      return { richtig: u * h, toleranz: 0.01, falsch: [[u + h, "nicht addiert"], [L[0] * h, "nur eine Seitenfläche"], [(u - L[L.length - 1]) * h, "fehlt eine Seitenfläche"]] };
    },
  });

  await pruefeAufgabe(page, bericht, {
    nr: 3, name: "E3 Dreiecksprisma", runden: RUNDEN, mindestensVerschieden: SCHRANKE[2],
    deute: (frage) => {
      const mh = frage.match(/Das Prisma ist (\d+) cm hoch/);
      if (!mh) return null;
      const h = Number(mh[1]);
      let g, hg, s1, s2, m;
      if ((m = frage.match(/rechtwinkliges Dreieck mit den Katheten (\d+) cm und (\d+) cm und der Hypotenuse (\d+) cm/))) {
        [g, hg, s2] = m.slice(1).map(Number); s1 = hg;
        pruefe(pyth(g, hg, s2), `E3: ${g}, ${hg}, ${s2} ist kein rechtwinkliges Dreieck`);
        FASSUNGEN.E3.add("rw");
      } else if ((m = frage.match(/Dreieck mit den Seiten (\d+) cm, (\d+) cm und (\d+) cm; die Höhe auf die Seite (\d+) cm ist (\d+) cm lang/))) {
        [g, s1, s2] = m.slice(1, 4).map(Number); hg = Number(m[5]);
        pruefe(Number(m[4]) === g && nahe(ueberstand(s1, hg) + ueberstand(s2, hg), g, 1e-9), `E3: ein Dreieck ${g}, ${s1}, ${s2} mit der Höhe ${hg} gibt es nicht`);
        FASSUNGEN.E3.add("allgemein");
      } else return null;
      const u = g + s1 + s2, G = (g * hg) / 2;
      return { richtig: 2 * G + u * h, toleranz: 0.01, falsch: [[4 * G + u * h, "halbiert"], [G + u * h, "zwei Grundflächen"], [u * h, "nur der Mantel"], [2 * G + u * hg, "Höhe des Prismas"]] };
    },
  });

  await pruefeAufgabe(page, bericht, {
    nr: 4, name: "E4 Trapezprisma", runden: RUNDEN, mindestensVerschieden: SCHRANKE[3],
    deute: (frage) => {
      const m = frage.match(/Trapez mit den parallelen Seiten (\d+) cm und (\d+) cm, den Schenkeln (\d+) cm und (\d+) cm und der Höhe (\d+) cm\. Das Prisma ist (\d+) cm hoch/);
      if (!m) return null;
      const [a, c, s1, s2, hT, h] = m.slice(1).map(Number);
      pruefe(nahe(ueberstand(s1, hT) + ueberstand(s2, hT), a - c, 1e-9), `E4: ein Trapez ${a}, ${c}, ${s1}, ${s2} mit der Höhe ${hT} gibt es nicht`);
      const G = ((a + c) / 2) * hT, u = a + c + s1 + s2;
      return { richtig: 2 * G + u * h, toleranz: 0.01, falsch: [[G + u * h, "zwei Grundflächen"], [4 * G + u * h, "Mittelwert"], [2 * G + (a + c) * h, "auch die Schenkel"], [u * h, "nur der Mantel"]] };
    },
  });

  await pruefeAufgabe(page, bericht, {
    nr: 5, name: "E5 Höhe aus der Oberfläche", runden: RUNDEN, mindestensVerschieden: SCHRANKE[4],
    deute: (frage) => {
      let m = frage.match(/Ein Quader hat eine (\d+) cm × (\d+) cm große Grundfläche und die Oberfläche ([\d.]+) cm²/);
      if (m) {
        FASSUNGEN.E5.add("quader");
        const a = Number(m[1]), b = Number(m[2]), O = z(m[3]), u = 2 * a + 2 * b;
        const c = (O - 2 * a * b) / u;
        pruefe(c > 0 && nahe(c, Math.round(c), 1e-9), `E5: die Höhe ${c} geht nicht glatt auf`);
        return { richtig: c, toleranz: 0.01, falsch: [[(O - a * b) / u, "Boden und Deckel"], [O / u, "Erst Boden und Deckel abziehen"], [(O - 2 * a * b) / (a + b), "2 · a + 2 · b"]] };
      }
      m = frage.match(/Grundfläche von ([\d.]+) cm², deren Umfang (\d+) cm beträgt\. Seine Oberfläche ist ([\d.]+) cm²/);
      if (!m) return null;
      FASSUNGEN.E5.add("prisma");
      const G = z(m[1]), u = Number(m[2]), O = z(m[3]);
      const h = (O - 2 * G) / u;
      pruefe(h > 0 && nahe(h, Math.round(h), 1e-9), `E5: die Höhe ${h} geht nicht glatt auf`);
      return { richtig: h, toleranz: 0.01, falsch: [[(O - G) / u, "2 · G ab"], [O / u, "Erst Grund- und Deckfläche"], [(O - 2 * G) / (2 * u), "nicht 2 · u · h"]] };
    },
  });

  await pruefeAufgabe(page, bericht, {
    nr: 6, name: "E6 Offene Körper", runden: RUNDEN, mindestensVerschieden: SCHRANKE[5],
    deute: (frage) => {
      let m;
      if ((m = frage.match(/Aquarium ohne Deckel ist (\d+) cm lang, (\d+) cm breit und (\d+) cm hoch/))) {
        FASSUNGEN.E6.add("aquarium");
        const [a, b, c] = m.slice(1).map(Number), O = a * b + 2 * a * c + 2 * b * c;
        return { richtig: O / 100, toleranz: 0.01, falsch: [[(O + a * b) / 100, "Deckel fehlt"], [O, "in cm²"], [O / 10, "mit 100 um"]] };
      }
      if ((m = frage.match(/Schachtel ohne Deckel ist (\d+) cm lang, (\d+) cm breit und (\d+) cm hoch/))) {
        FASSUNGEN.E6.add("schachtel");
        const [a, b, c] = m.slice(1).map(Number), O = a * b + 2 * a * c + 2 * b * c;
        return { richtig: O, toleranz: 0.01, falsch: [[O + a * b, "Deckel fehlt"]] };
      }
      if ((m = frage.match(/gleichschenkliges Dreieck: ([\d,]+) m breit, ([\d,]+) m hoch, die schrägen Seiten ([\d,]+) m lang\. Das Zelt ist ([\d,]+) m lang/))) {
        FASSUNGEN.E6.add("zelt");
        const [g, hg, s, L] = m.slice(1).map(z);
        pruefe(pyth(g / 2, hg, s), `E6: das Zeltdreieck ${g}, ${hg}, ${s} gibt es nicht`);
        const O = g * hg + 2 * s * L;
        return { richtig: O, toleranz: 0.001, falsch: [[O + g * L, "keinen Boden"], [2 * s * L, "Vorn und hinten"], [O + g * hg, "nicht halbiert"]] };
      }
      if ((m = frage.match(/Trapez: unten ([\d,]+) dm, oben ([\d,]+) dm breit, ([\d,]+) dm hoch, die schrägen Seiten ([\d,]+) dm lang\. Der Trog ist ([\d,]+) dm lang/))) {
        FASSUNGEN.E6.add("trog");
        const [c, a, hT, s, L] = m.slice(1).map(z);
        pruefe(pyth((a - c) / 2, hT, s), `E6: das Trogtrapez ${c}, ${a}, ${hT}, ${s} gibt es nicht`);
        const G = ((a + c) / 2) * hT, O = 2 * G + (c + 2 * s) * L;
        return { richtig: O, toleranz: 0.01, falsch: [[O + a * L, "oben offen"], [O - G, "zwei Grundflächen"], [(c + 2 * s) * L, "Trapeze vorn und hinten"]] };
      }
      return null;
    },
  });

  await pruefeAufgabe(page, bericht, {
    nr: 7, name: "E7 L-förmige Grundfläche", runden: RUNDEN, mindestensVerschieden: SCHRANKE[6],
    liesRoh: liesL,
    deute: (frage, fig) => {
      const mh = frage.match(/Es ist (\d+) cm lang/);
      if (!mh || !fig) return null;
      const h = Number(mh[1]);
      const A = zahl(fig.masse["mass-A"]), B = zahl(fig.masse["mass-B"]), p = zahl(fig.masse["mass-p"]), q = zahl(fig.masse["mass-q"]);
      // Die Figur ist das beschriftete L: Maßstab aus A, dann jede Ecke nachgemessen (y nach oben).
      const P = fig.pts.map(([x, y]) => [x, -y]);
      const x0 = Math.min(...P.map((v) => v[0])), y0 = Math.min(...P.map((v) => v[1]));
      const S = (Math.max(...P.map((v) => v[0])) - x0) / A;
      const soll = [[0, 0], [A, 0], [A, q], [p, q], [p, B], [0, B]];
      pruefe(P.length === 6 && soll.every(([sx, sy], i) => Math.abs(P[i][0] - x0 - sx * S) < 0.05 && Math.abs(P[i][1] - y0 - sy * S) < 0.05), `E7: die Figur ist nicht das L mit A = ${A}, B = ${B}, p = ${p}, q = ${q}`);
      // Die Figur ist auf 0,01 px gerundet: Gerechnet wird mit den Maßen, nachdem die Figur zu ihnen passt.
      const G = p * B + (A - p) * q, u = 2 * A + 2 * B;
      pruefe(Math.abs(gauss(P) / (S * S) - G) < 0.05 && Math.abs(sum(seiten(P)) / S - u) < 0.05, `E7: die gezeichnete Figur hat nicht G = ${G} und u = ${u}`);
      return { richtig: 2 * G + u * h, toleranz: 0.01, falsch: [[G + u * h, "zwei Grundflächen"], [2 * A * B + u * h, "volles Rechteck"], [2 * G + (A + B + p + q) * h, "alle sechs Seiten"]] };
    },
  });

  await pruefeAufgabe(page, bericht, {
    nr: 8, name: "E8 Balken lackieren", runden: RUNDEN, mindestensVerschieden: SCHRANKE[7],
    deute: (frage) => {
      const mL = frage.match(/Ein Holzbalken ist ([\d,]+) m lang/), md = frage.match(/reicht für ([\d,]+) m²/);
      if (!mL || !md) return null;
      const L = z(mL[1]), d = z(md[1]);
      let m, O, falschO, mantelAllein;
      if ((m = frage.match(/rechtwinkliges Dreieck mit den Katheten (\d+) cm und (\d+) cm und der Hypotenuse (\d+) cm/))) {
        FASSUNGEN.E8.add("dreieck");
        const [a, b, c] = m.slice(1).map(Number);
        pruefe(pyth(a, b, c), `E8: der Querschnitt ${a}, ${b}, ${c} ist kein rechtwinkliges Dreieck`);
        O = (a / 100) * (b / 100) + ((a + b + c) / 100) * L;
        falschO = a * b + (a + b + c) * L;
        mantelAllein = ((a + b + c) / 100) * L;
      } else if ((m = frage.match(/ein Rechteck (\d+) cm × (\d+) cm/))) {
        FASSUNGEN.E8.add("rechteck");
        const [a, b] = m.slice(1).map(Number);
        O = 2 * (a / 100) * (b / 100) + 2 * ((a + b) / 100) * L;
        falschO = 2 * a * b + 2 * (a + b) * L;
        mantelAllein = 2 * ((a + b) / 100) * L;
      } else return null;
      const dosen = Math.ceil(O / d - 1e-9);
      pruefe(dosen > O / d + 1e-9, `E8: ${O} : ${d} geht glatt auf — Auf- und Abrunden wären gleich`);
      return { felder: [O, dosen], toleranz: 0.001, falschFelder: [[0, falschO, "1 cm = 0,01 m"], [0, mantelAllein, "nur der Mantel"], [1, dosen - 1, "aufrunden"], [1, Math.round((O / d) * 100) / 100, "ganze Zahl auf"]] };
    },
  });

  // Jede Fassung muss vorkommen; die seltenste hat Anteil ¼ (E2, E6) oder ⅓ (E1): In 20 Zügen fehlt
  // sie mit (¾)²⁰ ≈ 0,3 % bzw. (⅔)²⁰ ≈ 0,03 ‰.
  pruefe(FASSUNGEN.E1.size === 2, `E1: gezogen nur ${[...FASSUNGEN.E1]}`);
  pruefe(FASSUNGEN.E3.size === 2, `E3: gezogen nur ${[...FASSUNGEN.E3]}`);
  pruefe(FASSUNGEN.E5.size === 2, `E5: gezogen nur ${[...FASSUNGEN.E5]}`);
  pruefe(FASSUNGEN.E8.size === 2, `E8: gezogen nur ${[...FASSUNGEN.E8]}`);
  pruefe(FASSUNGEN.E2.size >= 3 && FASSUNGEN.E6.size >= 3, `E2/E6: gezogen nur ${[...FASSUNGEN.E2]} / ${[...FASSUNGEN.E6]}`);
}

// ── Gerüst ─────────────────────────────────────────────────────────────────

async function geruest(page) {
  const folge = await page.evaluate(() => [...document.querySelectorAll("main section[id]")].map((x) => x.id));
  const soll = ["sec-netzflaeche", "sec-mantel", "sec-formel", "sec-anwenden", "sec-vernetzung", "sec-formelsammlung", "sec-uebungen", "sec-selbsteinschaetzung"];
  pruefe(JSON.stringify(folge) === JSON.stringify(soll), `Gerüst: Abschnitte ${folge.join(", ")} statt ${soll.join(", ")}`);
  for (const id of soll.slice(0, 4)) {
    const t = await page.evaluate((i) => document.getElementById(i).innerText, id);
    pruefe(!/cm³|dm³|m³|Liter/.test(t), `Gerüst: ${id} rechnet schon mit Rauminhalten`);
  }
  // Die Beispiele rechnen richtig.
  const b1 = await page.evaluate(() => document.querySelector("#sec-netzflaeche .beispiel-box").innerText);
  pruefe(b1.includes(`${2 * (15 + 10 + 6)} cm²`) && /a = 5 cm, b = 3 cm, c = 2 cm/.test(b1), "Gerüst: das Quader-Beispiel rechnet falsch");
  const b3 = await page.evaluate(() => document.querySelector("#sec-formel .beispiel-box").innerText);
  pruefe(b3.includes(`O = 2 · 12 cm² + 64 cm² = ${2 * 12 + 16 * 4} cm²`) && b3.includes(`G = ½ · 6 cm · 4 cm = ${(6 * 4) / 2} cm²`), "Gerüst: das Dreiecksprisma-Beispiel rechnet falsch");
  const verweis = await page.evaluate(() => { const a = document.querySelector("#sec-formelsammlung a[download]"); return a && a.getAttribute("href"); });
  pruefe(verweis === "formelsammlung.pdf", `Formelsammlung: Verweis auf „${verweis}“`);
  const links = await page.evaluate(() => [...document.querySelectorAll("main a[href]")].map((a) => a.getAttribute("href")).filter((h) => !h.startsWith("#") && !h.startsWith("http")));
  for (const href of new Set(links)) {
    const ziel = new URL(href.split("#")[0], "http://localhost/mathematik/klasse-8/koerper/").pathname;
    const antwort = await page.request.get("http://localhost:" + (process.env.UPLANT_PORT || "8936") + ziel);
    pruefe(antwort.ok(), `Gerüst: der Verweis „${href}“ führt ins Leere`);
    const anker = href.split("#")[1];
    if (anker && antwort.ok() && /\.html$/.test(ziel)) pruefe((await antwort.text()).includes(`id="${anker}"`), `Gerüst: die Sprungmarke „${anker}“ fehlt in ${ziel}`);
  }
  const menue = fs.readFileSync(path.join(WURZEL, "mathematik/klasse-8/koerper/index.html"), "utf8");
  const karte = menue.match(/<a class="menu-card"[^>]*href="oberflaeche-prisma\.html"[^>]*>\s*<h2>([^<]*)<\/h2>/);
  pruefe(!!karte && /data-section="klasse-8"/.test(karte[0]) && /\shidden\b/.test(karte[0]) && karte[1] === "2. Oberflächeninhalt von Prismen", "Gerüst: die Menükarte fehlt oder ist unvollständig");
  const proStufe = await page.evaluate(() => [...document.querySelectorAll("#exercises-mount .schwierigkeit-tabs button")].map((t) => { t.click(); return document.querySelectorAll("#exercises-mount .schwierigkeit-tab-panel .aufgabe-box").length; }));
  pruefe(JSON.stringify(proStufe) === "[2,2,2,2]", `Gerüst: die Stufen haben ${proStufe.join("/")} Aufgaben statt 2/2/2/2`);
}

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
      await teil("quader", quader, page);
      await teil("mantel", mantel, page);
      await teil("formel", formel, page);
      await teil("anwenden", anwenden, page);
      await teil("quizze", quizze, page);
      await teil("aufgaben", aufgaben, page);
    } else if (will("dunkel")) {
      await setzeRegler(page, "mt-t", 100);
      await setzeRegler(page, "an-t", 100);
      await waehle(page, "an-ding", "zelt");
      await pruefeKontrast(page, bericht, "dunkel");
      await pruefeStrichKontrast(page, bericht, "dunkel, Flächen und Linien", "#qd-mount polygon, #mt-mount polygon, #mt-mount line, #fo-mount polygon, #an-mount polygon");
      await pruefeTextAufFlaeche(page, bericht, "dunkel, Beschriftungen", "#qd-mount text, #mt-mount text, #fo-mount text, #an-mount text");
    }
    await pruefeNotation(page, bericht, wo);
    for (const s of page.stoerungen) pruefe(false, `${wo}: ${s}`);
    await page.close();
  }
  await browser.close();
  bericht.abschluss();
})();
