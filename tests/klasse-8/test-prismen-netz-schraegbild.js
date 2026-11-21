// Fachliche Prüfung: Klasse 8, Körper, Thema 1 „Prismen: Netz und Schrägbild“.
//
// Jede Fläche der Zeichnungen trägt ihre Raumpunkte (data-p3). Nachgerechnet wird damit — mit eigenen
// Verfahren, nicht mit denen der Seite:
//
//   1. PRISMA: Zählung aus der Zeichnung (Flächen, Kanten, Ecken) gegen die Bilanz; die Deckfläche ist
//      die verschobene Grundfläche; Seitenflächen sind Rechtecke; verdeckte Kanten über einen Strahl
//      zum Betrachter bestimmt (statt über Normalen wie die Seite).
//   2. NETZ: Jede Fläche bleibt in jeder Stellung starr (alle Abstände ihrer Ecken), die Seitenflächen
//      hängen als Kette aneinander, am Ende liegt alles in der Vorderebene, in wahrer Größe, ohne
//      Überdeckung, und der Streifen ist so lang wie der Umfang.
//   3. SCHRÄGBILD: Vorderfläche in wahrer Größe mit den richtigen Maßen, Tiefenkanten unter 45° und
//      halb so lang, Rückfläche verschoben, verdeckte Kanten über den Strahl; das Beispiel (Quader)
//      wird nachgeprüft.
//   4. LAGE: Das Kippen ist starr, um die vordere Kante, über dem Boden; die Höhe bleibt eine
//      Seitenkante der Länge h; die Standfläche ist am Ende die Seitenfläche 0.
//   Dazu jede Zeichnung als Kavalierprojektion (45°, ½) der Raumpunkte, die Kontrollfragen, alle
//   Aufgaben mit ihren Fehlern (Figuren aus dem SVG gelesen, das Würfelnetz im Raum gefaltet), das
//   Gerüst (kein Vorgriff auf Oberfläche und Volumen) und der Dunkelmodus.

"use strict";

const { neuerBericht } = require("../lib/pruefen");
const { starteBrowser, neueSeite, oeffne, setzeRegler } = require("../lib/seite");
const { pruefeNotation } = require("../lib/notation");
const { pruefeKontrast, pruefeStrichKontrast, pruefeTextAufFlaeche } = require("../lib/kontrast");
const { pruefeAufgabe, zahl } = require("../lib/aufgaben");
const fs = require("fs");
const path = require("path");

const bericht = neuerBericht();
const { pruefe } = bericht;
const SEITE = "/mathematik/klasse-8/koerper/prismen-netz-schraegbild.html";
const WURZEL = path.resolve(__dirname, "..", "..");
const NUR = (process.env.UPLANT_NUR || "").split(",").map((t) => t.trim()).filter(Boolean);
const will = (teil) => NUR.length === 0 || NUR.includes(teil);

// Die Grundflächen, wie die Seite sie nennt (Seitenlängen 3-4-5) — als Vertrag festgehalten.
const FORMEN = {
  quader: [[0, 0], [4, 0], [4, 3], [0, 3]],
  "dreieck-rw": [[0, 0], [4, 0], [0, 3]],
  "dreieck-gs": [[0, 0], [6, 0], [3, 4]],
  trapez: [[0, 0], [8, 0], [5, 4], [3, 4]],
  haus: [[0, 0], [6, 0], [6, 3], [3, 7], [0, 3]],
  sechseck: [[1.5, 0], [4.5, 0], [6, 2], [4.5, 4], [1.5, 4], [0, 2]],
};
const NAMEN_N = { Dreieck: 3, Viereck: 4, Fünfeck: 5, Sechseck: 6, Siebeneck: 7, Achteck: 8, Neuneck: 9, Zehneck: 10, Zwölfeck: 12, Fünfzehneck: 15 };

const K = require("../lib/koerper");
const { sub, add, dot, cross, len, dist, schwer, gleichP, normaleVon, inhalt3, starrGleich, lies, texte, rolleText, waehle, eckenVon, istRechteck, ueberdecken, gemeinsameEcken } = K;
const kavalierBild = (teile, wo) => K.kavalierBild(pruefe, teile, wo);
const pruefeVerdeckt = (teile, wo) => K.pruefeVerdeckt(pruefe, teile, wo);

// ── 1. Was ist ein Prisma? ─────────────────────────────────────────────────

async function prisma(page) {
  for (const n of [3, 4, 5, 6, 8]) {
    await waehle(page, "pr-n", String(n));
    for (const h of [2, 4, 6]) {
      const gh = await setzeRegler(page, "pr-h", h);
      for (const tp of [0, 35, 70, 100]) {
        const t = (await setzeRegler(page, "pr-t", tp)) / 100;
        const wo = `Prisma n = ${n}, h = ${gh}, ${Math.round(t * 100)} %`;
        const teile = await lies(page, "pr-mount");
        kavalierBild(teile, wo);
        const grund = teile.find((x) => x.rolle === "grund");
        pruefe(!!grund && grund.p3.length === n && grund.p3.every((p) => Math.abs(p[1]) < 1e-6), `${wo}: keine ${n}-eckige Grundfläche auf dem Boden`);
        if (!grund) continue;
        // Regelmäßig: gleich lange Seiten, alle Ecken gleich weit von der Mitte.
        const s = grund.p3.map((p, i) => dist(p, grund.p3[(i + 1) % n])), m = schwer(grund.p3);
        pruefe(s.every((x) => Math.abs(x - s[0]) < 2e-3) && grund.p3.every((p) => Math.abs(dist(p, m) - dist(grund.p3[0], m)) < 2e-3), `${wo}: die Grundfläche ist kein regelmäßiges ${n}-Eck`);
        const bilanz = await page.evaluate(() => document.getElementById("pr-bilanz").innerText);
        if (t === 0) {
          pruefe(teile.filter((x) => x.tag === "polygon").length === 1, `${wo}: flach, aber mehr als eine Fläche gezeichnet`);
          pruefe(bilanz.includes(`${n} Ecken`), `${wo}: die Bilanz nennt nicht ${n} Ecken`);
          continue;
        }
        const flaechen = teile.filter((x) => x.tag === "polygon");
        const kanten = pruefeVerdeckt(teile, wo);
        pruefe(flaechen.length === n + 2, `${wo}: ${flaechen.length} Flächen statt ${n + 2}`);
        pruefe(kanten.length === 3 * n, `${wo}: ${kanten.length} Kanten statt ${3 * n}`);
        pruefe(eckenVon(kanten) === 2 * n, `${wo}: ${eckenVon(kanten)} Ecken statt ${2 * n}`);
        // Die Bilanz zählt, was die Zeichnung zeigt.
        const z = { ecken: await rolleText(page, '#pr-bilanz [data-rolle="ecken"]'), kanten: await rolleText(page, '#pr-bilanz [data-rolle="kanten"]'), flaechen: await rolleText(page, '#pr-bilanz [data-rolle="flaechen"]') };
        pruefe(zahl(z.ecken) === eckenVon(kanten) && zahl(z.kanten) === kanten.length && zahl(z.flaechen) === flaechen.length, `${wo}: die Bilanz nennt ${z.ecken}/${z.kanten}/${z.flaechen}, gezeichnet sind ${eckenVon(kanten)}/${kanten.length}/${flaechen.length}`);
        // Deckfläche = Grundfläche, um t · h senkrecht verschoben.
        const deckel = flaechen.find((x) => x.rolle === "deckel");
        const verschoben = grund.p3.map((p) => [p[0], p[1] + t * gh, p[2]]);
        pruefe(!!deckel && deckel.p3.length === n && verschoben.every((p) => deckel.p3.some((q) => gleichP(p, q))), `${wo}: die Deckfläche ist nicht die um ${t * gh} cm hochgeschobene Grundfläche`);
        const seiten = flaechen.filter((x) => x.rolle === "seite");
        pruefe(seiten.length === n && seiten.every((x) => istRechteck(x.p3, s[0], t * gh)), `${wo}: die Seitenflächen sind keine Rechtecke ${s[0].toFixed(2)} × ${t * gh}`);
        const hoehe = teile.find((x) => x.rolle === "hoehe");
        pruefe(!!hoehe && Math.abs(dist(...hoehe.p3) - t * gh) < 2e-3 && Math.abs(hoehe.p3[0][0] - hoehe.p3[1][0]) < 1e-6 && Math.abs(hoehe.p3[0][2] - hoehe.p3[1][2]) < 1e-6, `${wo}: die Höhenmarke ist nicht senkrecht und ${t * gh} cm lang`);
        if (t === 1) pruefe((await page.evaluate(() => document.querySelector('#pr-mount [data-rolle="h-text"]')?.textContent)) === `h = ${gh} cm`, `${wo}: die Höhe ist nicht als h = ${gh} cm beschriftet`);
      }
    }
  }
  await setzeRegler(page, "pr-t", 100);
}

// ── 2. Das Netz ────────────────────────────────────────────────────────────

// Drehwinkel (Bogenmaß, mit Vorzeichen) von der Richtung a→b zur Richtung b→c in der x-z-Ebene.
function drehung(a, b, c) {
  let d = Math.atan2(c[1] - b[1], c[0] - b[0]) - Math.atan2(b[1] - a[1], b[0] - a[0]);
  while (d <= -Math.PI) d += 2 * Math.PI;
  while (d > Math.PI) d -= 2 * Math.PI;
  return d;
}
// Knick zwischen zwei senkrecht stehenden Seitenflächen am gemeinsamen unteren Eckpunkt: die
// Drehung von der unteren Kante der einen zur unteren Kante der anderen. null, wenn sie keinen
// Eckpunkt unten teilen (die Schnittkante).
function knickZwischen(p, q) {
  const unten = (f) => f.filter((x) => Math.abs(x[1]) < 1e-3);
  const a = unten(p), b = unten(q);
  const s = a.find((x) => b.some((y) => gleichP(x, y)));
  if (!s || a.length !== 2 || b.length !== 2) return null;
  const A = a.find((x) => x !== s), E = b.find((y) => !gleichP(y, s));
  return drehung([A[0], A[2]], [s[0], s[2]], [E[0], E[2]]);
}

async function netz(page) {
  for (const form of Object.keys(FORMEN)) {
    await waehle(page, "nz-form", form);
    const G = FORMEN[form], n = G.length;
    const L = G.map((p, i) => Math.hypot(G[(i + 1) % n][0] - p[0], G[(i + 1) % n][1] - p[1]));
    const u = L.reduce((s, x) => s + x, 0);
    const flaecheG = Math.abs(G.reduce((s, p, i) => s + p[0] * G[(i + 1) % n][1] - G[(i + 1) % n][0] * p[1], 0)) / 2;
    for (const h of [2, 4, 6]) {
      const gh = await setzeRegler(page, "nz-h", h);
      let anfang = null;
      // Scharniere öffnen sich nur: Der Knick zwischen zwei Nachbarseiten ist nie größer als am
      // geschlossenen Prisma und wird von Stellung zu Stellung nicht größer. Ohne das fiele ein
      // Mantel nicht auf, der weiter zuklappt, als das Prisma geschlossen ist — jede Seite bliebe
      // starr und hinge an ihrer Nachbarin.
      const knickG = G.map((_, i) => drehung(G[i], G[(i + 1) % n], G[(i + 2) % n]));
      let knickVorher = knickG.map(Math.abs);
      for (const tp of [0, 20, 40, 55, 70, 85, 100]) {
        const t = (await setzeRegler(page, "nz-t", tp)) / 100;
        const wo = `Netz ${form}, h = ${gh}, ${Math.round(t * 100)} %`;
        const teile = await lies(page, "nz-mount");
        const S = kavalierBild(teile, wo);
        const fl = teile.filter((x) => x.tag === "polygon");
        const key = (x) => `${x.rolle}${x.nr ?? ""}`;
        pruefe(fl.length === n + 2 && new Set(fl.map(key)).size === n + 2, `${wo}: ${fl.length} Flächen statt ${n + 2}`);
        if (t === 0) {
          anfang = Object.fromEntries(fl.map((x) => [key(x), x.p3]));
          pruefeVerdeckt(teile, wo);
          // Die Grundfläche ist die vorgegebene Form.
          const g = anfang.grund;
          pruefe(!!g && g.length === n && G.every(([x, z]) => g.some((p) => gleichP(p, [x, 0, z]))), `${wo}: die Grundfläche ist nicht die Form ${form}`);
          continue;
        }
        // Starr: Jede Fläche hat dieselben Eckenabstände wie im geschlossenen Prisma.
        const verbogen = fl.filter((x) => !anfang[key(x)] || !starrGleich(x.p3, anfang[key(x)]));
        pruefe(verbogen.length === 0, `${wo}: ${verbogen.map(key).join(", ")} ${verbogen.length === 1 ? "ist" : "sind"} nicht starr geblieben`);
        // Zusammenhang: Seitenflächen bilden eine Kette, Grund- und Deckfläche hängen an einer Seitenfläche.
        const seiten = fl.filter((x) => x.rolle === "seite").sort((a, b) => a.nr - b.nr);
        const knick = knickVorher.slice(), zu = [];
        for (let i = 0; i < n; i++) {
          const k = knickZwischen(seiten[i].p3, seiten[(i + 1) % n].p3);
          if (k === null) continue;   // aufgeschnitten
          const richtig = Math.abs(k) < 2e-3 || Math.sign(k) === Math.sign(knickG[i]);
          if (!richtig || Math.abs(k) > knickVorher[i] + 2e-3) zu.push(i);
          knick[i] = Math.abs(k);
        }
        pruefe(zu.length === 0, `${wo}: die Scharniere ${zu.join(", ")} klappen zu statt auf`);
        knickVorher = knick;
        let glieder = 0;
        for (let i = 0; i < n; i++) if (gemeinsameEcken(seiten[i].p3, seiten[(i + 1) % n].p3) >= 2) glieder++;
        pruefe(glieder >= n - 1, `${wo}: nur ${glieder} Seitenflächen hängen an ihrer Nachbarin (nötig ${n - 1})`);
        for (const r of ["grund", "deckel"]) {
          const f = fl.find((x) => x.rolle === r);
          pruefe(seiten.some((sx) => gemeinsameEcken(sx.p3, f.p3) >= 2), `${wo}: die ${r === "grund" ? "Grundfläche" : "Deckfläche"} hängt an keiner Seitenfläche`);
        }
        if (t === 1) {
          pruefe(fl.every((x) => x.p3.every((p) => Math.abs(p[2]) < 1e-6)), `${wo}: das Netz liegt nicht ganz in der Vorderebene`);
          // Wahre Größe: Bildabstände = S · Raumabstände.
          let falsch = 0;
          for (const x of fl) for (let i = 0; i < x.p3.length; i++) {
            const j = (i + 1) % x.p3.length;
            if (Math.abs(Math.hypot(x.p2[j][0] - x.p2[i][0], x.p2[j][1] - x.p2[i][1]) - S * dist(x.p3[i], x.p3[j])) > 0.1) falsch++;
          }
          pruefe(falsch === 0, `${wo}: ${falsch} Kanten des Netzes sind nicht in wahrer Größe gezeichnet`);
          for (let i = 0; i < fl.length; i++) for (let j = i + 1; j < fl.length; j++) {
            pruefe(!ueberdecken(fl[i].p2, fl[j].p2), `${wo}: ${key(fl[i])} und ${key(fl[j])} überdecken sich`);
          }
          const xs = seiten.flatMap((x) => x.p3.map((p) => p[0])), ys = seiten.flatMap((x) => x.p3.map((p) => p[1]));
          pruefe(Math.abs(Math.max(...xs) - Math.min(...xs) - u) < 2e-3 && Math.abs(Math.max(...ys) - Math.min(...ys) - gh) < 2e-3, `${wo}: der Mantel ist kein Streifen ${u} × ${gh}`);
          const summe = fl.reduce((s, x) => s + inhalt3(x.p3), 0);
          pruefe(Math.abs(summe - (2 * flaecheG + u * gh)) < 1e-2, `${wo}: das Netz hat ${summe.toFixed(2)} cm² statt 2 · G + u · h = ${2 * flaecheG + u * gh}`);
          const st = await texte(page, "nz-mount", "seite-text");
          pruefe(st.length === n && st.every((x) => zahl(x.text) === L[Number(x.nr)]), `${wo}: die Seitenlängen im Netz sind falsch beschriftet (${st.map((x) => x.text).join(", ")})`);
        }
        const b = { u: await rolleText(page, '#nz-bilanz [data-rolle="u"]'), streifen: await rolleText(page, '#nz-bilanz [data-rolle="streifen"]'), anzahl: await rolleText(page, '#nz-bilanz [data-rolle="anzahl"]') };
        pruefe(zahl(b.u) === u && b.streifen === `${String(u).replace(".", ",")} cm × ${gh} cm` && zahl(b.anzahl) === n + 2, `${wo}: die Bilanz nennt u = ${b.u}, Streifen ${b.streifen}, ${b.anzahl} Flächen`);
      }
    }
  }
  await setzeRegler(page, "nz-t", 0);
}

// ── 3. Das Schrägbild ──────────────────────────────────────────────────────

async function schraegbild(page) {
  for (const form of Object.keys(FORMEN)) {
    await waehle(page, "sb-form", form);
    const G = FORMEN[form], n = G.length;
    const L = G.map((p, i) => Math.hypot(G[(i + 1) % n][0] - p[0], G[(i + 1) % n][1] - p[1]));
    for (const h of [2, 5, 8]) {
      const gh = await setzeRegler(page, "sb-h", h);
      let S = null, vorn2 = null;
      for (const schritt of [1, 2, 3, 4]) {
        await setzeRegler(page, "sb-schritt", schritt);
        const wo = `Schrägbild ${form}, h = ${gh}, Schritt ${schritt}`;
        const teile = await lies(page, "sb-mount");
        S = kavalierBild(teile, wo);
        const vorn = teile.find((x) => x.rolle === (schritt < 4 ? "vorn" : "grund"));
        pruefe(!!vorn && vorn.p3.length === n && G.every(([x, y]) => vorn.p3.some((p) => gleichP(p, [x, y, 0]))), `${wo}: die Vorderfläche ist nicht die Form ${form} in der Ebene z = 0`);
        if (!vorn) continue;
        // Wahre Größe: jede Seite im Bild S-mal so lang wie im Raum, Winkel unverzerrt (Dreiecke aus
        // drei Ecken gleich).
        const b2 = G.map(([x, y]) => vorn.p2[vorn.p3.findIndex((p) => gleichP(p, [x, y, 0]))]);
        let falsch = 0;
        for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
          if (Math.abs(Math.hypot(b2[j][0] - b2[i][0], b2[j][1] - b2[i][1]) - S * Math.hypot(G[j][0] - G[i][0], G[j][1] - G[i][1])) > 0.1) falsch++;
        }
        pruefe(falsch === 0, `${wo}: die Vorderfläche ist nicht in wahrer Größe gezeichnet (${falsch} Abstände)`);
        if (schritt === 1) vorn2 = b2;
        const masse = await texte(page, "sb-mount", "vorn-mass");
        if (schritt === 1 || schritt >= 3) pruefe(masse.length === n && masse.every((x) => zahl(x.text) === L[Number(x.nr)]), `${wo}: die Seiten der Vorderfläche sind falsch beschriftet (${masse.map((x) => x.nr + ":" + x.text).join(", ")})`);
        else pruefe(masse.every((x) => zahl(x.text) === L[Number(x.nr)]), `${wo}: eine Seite der Vorderfläche ist falsch beschriftet`);
        if (schritt === 2 || schritt === 3) {
          const tiefe = teile.filter((x) => x.rolle === "tiefe");
          pruefe(tiefe.length === n, `${wo}: ${tiefe.length} Tiefenkanten statt ${n}`);
          for (const k of tiefe) {
            const dx = k.p2[1][0] - k.p2[0][0], dy = k.p2[1][1] - k.p2[0][1];
            pruefe(dx > 0 && dy < 0 && Math.abs(dx + dy) < 0.05, `${wo}: eine Tiefenkante läuft nicht unter 45° nach rechts oben`);
            pruefe(Math.abs(Math.hypot(dx, dy) - (S * gh) / 2) < 0.1, `${wo}: eine Tiefenkante ist im Bild ${(Math.hypot(dx, dy) / S).toFixed(2)} cm statt ${gh / 2} cm lang`);
            pruefe(G.some(([x, y]) => gleichP(k.p3[0], [x, y, 0])) && gleichP(k.p3[1], [k.p3[0][0], k.p3[0][1], gh]), `${wo}: eine Tiefenkante beginnt nicht an einer Ecke oder ist nicht ${gh} cm tief`);
          }
          const tt = await page.evaluate(() => document.querySelector('#sb-mount [data-rolle="tiefe-text"]')?.textContent);
          pruefe(tt === `${gh} : 2 = ${String(gh / 2).replace(".", ",")} cm`, `${wo}: die Tiefe ist als „${tt}“ beschriftet`);
        }
        if (schritt === 3) {
          const hinten = teile.find((x) => x.rolle === "hinten");
          const d = (S * gh) / 2 * Math.SQRT1_2;
          pruefe(!!hinten && G.every((g, i) => hinten.p2.some((p) => Math.abs(p[0] - (vorn2[i][0] + d)) < 0.06 && Math.abs(p[1] - (vorn2[i][1] - d)) < 0.06)), `${wo}: die Rückfläche ist nicht die schräg verschobene Vorderfläche`);
        }
        if (schritt === 4) {
          const kanten = pruefeVerdeckt(teile, wo);
          pruefe(kanten.length === 3 * n, `${wo}: ${kanten.length} Kanten statt ${3 * n}`);
          if (form === "quader") {
            // Das Beispiel: Verdeckt sind genau die drei Kanten an der Ecke hinten links unten.
            const v = kanten.filter((k) => k.rolle === "kante-verdeckt");
            pruefe(v.length === 3 && v.every((k) => k.p3.some((p) => gleichP(p, [0, 0, gh]))), `${wo}: verdeckt sind nicht genau die drei Kanten an der Ecke hinten links unten`);
          }
        }
      }
    }
  }
  await setzeRegler(page, "sb-schritt", 1);
}

// ── 4. Die Lage ────────────────────────────────────────────────────────────

async function lage(page) {
  for (const form of ["dreieck-gs", "trapez", "haus"]) {
    await waehle(page, "lg-form", form);
    const G = FORMEN[form], n = G.length;
    const L0 = Math.hypot(G[1][0] - G[0][0], G[1][1] - G[0][1]);
    for (const h of [3, 5, 7]) {
      const gh = await setzeRegler(page, "lg-h", h);
      let anfang = null;
      for (const tp of [0, 30, 60, 85, 100]) {
        const t = (await setzeRegler(page, "lg-t", tp)) / 100;
        const wo = `Lage ${form}, h = ${gh}, ${Math.round(t * 100)} %`;
        const teile = await lies(page, "lg-mount");
        kavalierBild(teile, wo);
        pruefeVerdeckt(teile, wo);
        const fl = teile.filter((x) => x.tag === "polygon");
        const key = (x) => `${x.rolle}${x.nr ?? ""}`;
        const f = Object.fromEntries(fl.map((x) => [key(x), x.p3]));
        pruefe(fl.length === n + 2, `${wo}: ${fl.length} Flächen statt ${n + 2}`);
        if (t === 0) {
          anfang = f;
          pruefe(G.every(([x, z]) => f.grund.some((p) => gleichP(p, [x, 0, z]))), `${wo}: das Prisma steht nicht auf seiner Grundfläche`);
        }
        // Der ganze Körper starr: alle Ecken zusammen behalten ihre Abstände (Ecken in fester Reihenfolge).
        const alle = (ff) => [...ff.grund, ...ff.deckel];
        pruefe(starrGleich(alle(f), alle(anfang)), `${wo}: das Prisma ist beim Kippen nicht starr geblieben`);
        pruefe(fl.every((x) => anfang[key(x)] && starrGleich(x.p3, anfang[key(x)])), `${wo}: eine Fläche hat sich beim Kippen verformt`);
        // Gedreht wird um die vordere untere Kante: deren Punkte bleiben, und nichts sinkt unter den Boden.
        pruefe([[G[0][0], 0, 0], [G[1][0], 0, 0]].every((q) => f.grund.some((p) => gleichP(p, q))), `${wo}: die vordere untere Kante ist nicht stehen geblieben`);
        pruefe(fl.every((x) => x.p3.every((p) => p[1] > -1e-6)), `${wo}: ein Teil des Prismas liegt unter dem Boden`);
        // Grund- und Deckfläche bleiben parallel, im Abstand h.
        const ng = normaleVon(f.grund), dd = sub(schwer(f.deckel), schwer(f.grund));
        pruefe(Math.abs(Math.abs(dot(ng, dd)) - gh) < 2e-3 && len(cross(ng, dd)) < 2e-3, `${wo}: Grund- und Deckfläche stehen nicht im Abstand h = ${gh} senkrecht übereinander`);
        const hoehe = teile.find((x) => x.rolle === "hoehe");
        pruefe(!!hoehe && Math.abs(dist(...hoehe.p3) - gh) < 2e-3 && f.grund.some((p) => gleichP(p, hoehe.p3[0])) && f.deckel.some((p) => gleichP(p, hoehe.p3[1])), `${wo}: die Höhenmarke ist keine Seitenkante der Länge h`);
        const stand = await rolleText(page, '#lg-bilanz [data-rolle="standflaeche"]');
        const unten = fl.filter((x) => x.p3.every((p) => Math.abs(p[1]) < 1e-6));
        if (t === 0) pruefe(unten.length === 1 && unten[0].rolle === "grund" && /Grundfläche/.test(stand), `${wo}: Standfläche „${stand}“`);
        else if (t === 1) {
          pruefe(unten.length === 1 && key(unten[0]) === "seite0" && istRechteck(unten[0].p3, L0, gh), `${wo}: das Prisma liegt nicht auf der Seitenfläche ${L0} × ${gh}`);
          pruefe(stand === `eine Seitenfläche (Rechteck ${L0} cm × ${gh} cm)`, `${wo}: Standfläche „${stand}“`);
          pruefe(Math.abs(ng[1]) < 1e-6, `${wo}: die Grundfläche steht am Ende nicht senkrecht`);
        } else pruefe(unten.length === 0 && /keine/.test(stand), `${wo}: beim Kippen liegt eine Fläche flach („${stand}“)`);
      }
    }
  }
  await setzeRegler(page, "lg-t", 0);
}

// ── Kontrollfragen ─────────────────────────────────────────────────────────

async function quizze(page) {
  const ids = await page.evaluate(() => [...document.querySelectorAll(".quiz")].map((e) => e.id));
  pruefe(ids.length === 4, `Kontrollfragen: ${ids.length} statt 4`);
  for (const sec of ["sec-prisma", "sec-netz", "sec-schraegbild", "sec-lage"]) {
    pruefe(await page.evaluate((x) => document.querySelectorAll(`#${x} .quiz`).length === 1, sec), `Kontrollfragen: ${sec} hat nicht genau eine`);
  }
  const RICHTIG = {
    "quiz-prisma": (o) => { const m = o.match(/ein (\S+)$/); return !!m && 3 * NAMEN_N[m[1]] === 15; },
    "quiz-netz": (o) => { const m = o.match(/^(\d+) Sechsecke? und (\d+) Rechtecke$/); return !!m && Number(m[1]) === 2 && Number(m[2]) === 6; },
    "quiz-schraegbild": (o) => { const m = o.match(/^(\d+) cm lang, (.*)$/); return !!m && Number(m[1]) === 6 / 2 && /unter 45° nach rechts oben/.test(m[2]); },
    "quiz-lage": (o) => /^die Dreiecke/.test(o),
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

// Ein Würfelnetz im Raum falten: Jedes Kästchen dreht um die gemeinsame Kante mit seinem Vorgänger
// um 90° nach oben. Liefert die Außennormale jedes Kästchens.
function falteWuerfel(zellen) {
  const ident = [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]];
  const mm = (A, B) => A.map((r) => B[0].map((_, j) => r.reduce((s, x, k) => s + x * B[k][j], 0)));
  const anw = (M, p) => [0, 1, 2].map((i) => M[i][0] * p[0] + M[i][1] * p[1] + M[i][2] * p[2] + M[i][3]);
  // Drehung um die Achse durch a mit Richtung u (Einheitsvektor) um phi — als 4×4-Matrix.
  function dreh(a, u, phi) {
    const c = Math.cos(phi), s = Math.sin(phi), [x, y, z] = u, t = 1 - c;
    const R = [[t * x * x + c, t * x * y - s * z, t * x * z + s * y], [t * x * y + s * z, t * y * y + c, t * y * z - s * x], [t * x * z - s * y, t * y * z + s * x, t * z * z + c]];
    const v = [0, 1, 2].map((i) => a[i] - (R[i][0] * a[0] + R[i][1] * a[1] + R[i][2] * a[2]));
    return [[...R[0], v[0]], [...R[1], v[1]], [...R[2], v[2]], [0, 0, 0, 1]];
  }
  const M = new Array(zellen.length);
  M[0] = ident;
  const offen = [0];
  while (offen.length) {
    const i = offen.shift();
    zellen.forEach((z, j) => {
      if (M[j] || Math.abs(z[0] - zellen[i][0]) + Math.abs(z[1] - zellen[i][1]) !== 1) return;
      // Gemeinsame Kante im Raster, im Netz-Koordinatensystem (x = Spalte, y = Zeile, z = 0).
      const [ci, ri] = zellen[i], [cj, rj] = zellen[j];
      const a = cj > ci ? [cj, ri, 0] : cj < ci ? [ci, ri, 0] : rj > ri ? [ci, rj, 0] : [ci, ri, 0];
      const u = cj !== ci ? [0, 1, 0] : [1, 0, 0];
      const mitteJ = [cj + 0.5, rj + 0.5, 0];
      let D = dreh(a, u, Math.PI / 2);
      if (anw(D, mitteJ)[2] < 0) D = dreh(a, u, -Math.PI / 2);
      M[j] = mm(M[i], D);
      offen.push(j);
    });
  }
  return M.map((m) => { const p = anw(m, [0.5, 0.5, 0]), q = anw(m, [0.5, 0.5, 1]); return sub(q, p); });
}

const liesWuerfelnetz = (page, box) => page.evaluate((b) => [...document.querySelectorAll(`${b} .aufgabe-prompt [data-rolle="feld"]`)].map((r) => ({
  zelle: r.dataset.zelle.split(",").map(Number), buchstabe: r.dataset.buchstabe, blau: /kp-g/.test(r.getAttribute("class")),
  x: +r.getAttribute("x"), y: +r.getAttribute("y"), w: +r.getAttribute("width"),
  text: [...r.parentNode.querySelectorAll("text")].find((t) => Math.abs(+t.getAttribute("x") - (+r.getAttribute("x") + +r.getAttribute("width") / 2)) < 1 && Math.abs(+t.getAttribute("y") - (+r.getAttribute("y") + +r.getAttribute("height") / 2) - 6) < 1)?.textContent,
})), box);
const liesFigur = (page, box) => page.evaluate((b) => {
  const svg = document.querySelector(`${b} .aufgabe-prompt svg`);
  if (!svg) return null;
  const pkt = (e) => e.getAttribute("points").trim().split(/\s+/).map((s) => s.split(",").map(Number));
  return {
    rechtecke: [...svg.querySelectorAll("rect[data-rolle]")].map((r) => ({ rolle: r.dataset.rolle, x: +r.getAttribute("x"), y: +r.getAttribute("y"), w: +r.getAttribute("width"), h: +r.getAttribute("height") })),
    linien: [...svg.querySelectorAll("line[data-rolle]")].map((l) => ({ rolle: l.dataset.rolle, x1: +l.getAttribute("x1"), y1: +l.getAttribute("y1"), x2: +l.getAttribute("x2"), y2: +l.getAttribute("y2") })),
    texte: [...svg.querySelectorAll("text[data-rolle]")].map((t) => ({ rolle: t.dataset.rolle, nr: t.dataset.nr, an: t.dataset.an, text: t.textContent })),
    vorn: (() => { const v = svg.querySelector('polygon[data-rolle="vorn"]'); return v ? pkt(v) : null; })(),
  };
}, box);

// Die Vorderfläche eines Schrägbilds aus der Figur: Bildpunkte (y nach oben gedreht) und Maßstab aus
// den beschrifteten Seiten. Die Ecken stehen im SVG in umgekehrter Reihenfolge (die Grundfläche von
// außen gesehen); umgedreht ist Seite i die zwischen Ecke i und i + 1.
function vorderflaeche(fig, wo) {
  const v = fig.vorn.slice().reverse().map(([x, y]) => [x, -y]);
  const n = v.length;
  const L2 = v.map((p, i) => Math.hypot(v[(i + 1) % n][0] - p[0], v[(i + 1) % n][1] - p[1]));
  const masse = fig.texte.filter((t) => t.rolle === "seite-mass");
  const L = new Array(n);
  for (const m of masse) L[Number(m.nr)] = zahl(m.text);
  pruefe(masse.length === n && L.every((x) => Number.isFinite(x)), `${wo}: nicht jede Seite der Vorderfläche ist beschriftet`);
  // Kante 0 liegt unten waagerecht.
  pruefe(Math.abs(v[1][1] - v[0][1]) < 0.05 && v[1][0] > v[0][0] && v[0][1] <= Math.min(...v.map((p) => p[1])) + 0.05, `${wo}: die Seite 0 der Vorderfläche liegt nicht unten`);
  const S = L2[0] / L[0];
  pruefe(L2.every((x, i) => Math.abs(x - S * L[i]) < 0.15), `${wo}: die Vorderfläche passt nicht zu ihren Maßen (${L.join(", ")})`);
  return { S, L, n, u: L.reduce((s, x) => s + x, 0), v };
}
// Tiefenkanten der Figur: sichtbare und verdeckte Kanten, die unter 45° nach rechts oben laufen.
function tiefenkanten(fig) {
  return fig.linien.filter((l) => /^kante/.test(l.rolle)).map((l) => {
    const dx = l.x2 - l.x1, dy = l.y2 - l.y1;
    const s = dx < 0 ? -1 : 1;
    return { dx: s * dx, dy: s * dy };
  }).filter((k) => k.dx > 0.5 && Math.abs(k.dx + k.dy) < 0.05);
}

// Die Schranken für `mindestensVerschieden` sind gemessen (tests/werkzeug-streuung.js, 20 Züge):
// A1 n ≈ 9, A2 n ≈ 306, A3 n ≈ 4909, A4 n ≈ 55, A5 n ≈ 354, A6 n ≈ 27, A7 n ≈ 96, A8 n ≈ 58.
const SCHRANKE = [4, 15, 18, 11, 15, 8, 12, 11];
const RUNDEN = 20;
const FASSUNGEN = { A5: new Set(), A6: new Set() };

async function aufgaben(page) {
  await pruefeAufgabe(page, bericht, {
    nr: 1, name: "A1 Ecken, Kanten, Flächen", runden: RUNDEN, mindestensVerschieden: SCHRANKE[0],
    deute: (frage) => {
      const m = frage.match(/hat ein (\S+) als Grundfläche/);
      const n = m && NAMEN_N[m[1]];
      if (!n) return null;
      return {
        felder: [2 * n, 3 * n, n + 2],
        falschFelder: [[0, n, "Deckfläche hat noch einmal"], [0, 3 * n, "Zahl der Kanten"], [0, n + 2, "Zahl der Flächen"], [1, 2 * n, "Seitenkanten"], [1, n, "einer Grundfläche"], [1, 4 * n, "zwei Seitenflächen"], [2, n, "nur die Seitenflächen"], [2, n + 1, "zwei Grundflächen"], [2, 2, "rechteckigen Seitenflächen"]],
      };
    },
  });

  await pruefeAufgabe(page, bericht, {
    nr: 2, name: "A2 Längen im Schrägbild", runden: RUNDEN, mindestensVerschieden: SCHRANKE[1],
    deute: (frage) => {
      const m = frage.match(/ist (\d+) cm breit, (\d+) cm hoch und (\d+) cm tief/);
      if (!m) return null;
      const [a, b, c] = m.slice(1).map(Number);
      return { felder: [a, b, c / 2], falschFelder: [[0, a / 2, "wahrer Größe"], [1, b / 2, "wahrer Größe"], [2, c, "halb so lang"], [2, 2 * c, "nicht verdoppelt"]] };
    },
  });

  await pruefeAufgabe(page, bericht, {
    nr: 3, name: "A3 Würfelnetz", runden: RUNDEN, mindestensVerschieden: SCHRANKE[2],
    liesRoh: liesWuerfelnetz,
    deute: (frage, felder) => {
      const m = frage.match(/blauen Fläche ([A-F]) gegenüber/);
      if (!m || !felder || felder.length !== 6) return null;
      pruefe(felder.every((f) => f.text === f.buchstabe) && new Set(felder.map((f) => f.buchstabe)).size === 6, `A3: die Buchstaben im Netz stimmen nicht mit den Feldern überein`);
      const blau = felder.filter((f) => f.blau);
      pruefe(blau.length === 1 && blau[0].buchstabe === m[1], `A3: blau ist nicht genau die Fläche ${m[1]}`);
      // Die Kästchen liegen dort, wo ihr Raster sagt.
      const Z = felder[0].w;
      pruefe(felder.every((f) => Math.abs(f.x - felder[0].x - (f.zelle[0] - felder[0].zelle[0]) * Z) < 0.01 && Math.abs(f.y - felder[0].y - (f.zelle[1] - felder[0].zelle[1]) * Z) < 0.01), "A3: die Kästchen liegen nicht im Raster");
      const nor = falteWuerfel(felder.map((f) => f.zelle));
      const paare = nor.map((a, i) => nor.findIndex((b) => len(add(a, b)) < 1e-6));
      pruefe(paare.every((j, i) => j >= 0 && j !== i && paare[j] === i), `A3: das Netz faltet sich nicht zu einem Würfel — „${frage}“`);
      const x = felder.findIndex((f) => f.buchstabe === m[1]);
      const nachbarn = felder.filter((_, i) => i !== x && i !== paare[x]);
      return { richtig: felder[paare[x]].buchstabe, falsch: [[m[1], "die Fläche selbst"], ...nachbarn.map((f) => [f.buchstabe, "Nachbarfläche"])] };
    },
  });

  await pruefeAufgabe(page, bericht, {
    nr: 4, name: "A4 Quadernetz", runden: RUNDEN, mindestensVerschieden: SCHRANKE[3],
    liesRoh: liesFigur,
    deute: (frage, fig) => {
      if (!fig) return null;
      const t = (r) => zahl(fig.texte.find((x) => x.rolle === r)?.text);
      const a = t("mass-a"), b = t("mass-b"), c = t("mass-c");
      const R = Object.fromEntries(fig.rechtecke.map((r) => [r.rolle, r]));
      const S = R.hinten.w / a;
      const passt = (r, w, h) => Math.abs(r.w - w * S) < 0.05 && Math.abs(r.h - h * S) < 0.05;
      pruefe(passt(R["seite-links"], b, c) && passt(R.vorn, a, c) && passt(R["seite-rechts"], b, c) && passt(R.hinten, a, c) && passt(R.oben, a, b) && passt(R.unten, a, b), `A4: die Flächen passen nicht zu den Maßen ${a}, ${b}, ${c}`);
      // Das Netz faltet sich: Streifen nebeneinander, Deckel und Boden an der langen Fläche.
      const x0 = R["seite-links"].x, y0 = R["seite-links"].y;
      pruefe(Math.abs(R.vorn.x - (x0 + b * S)) < 0.05 && Math.abs(R.oben.x - R.vorn.x) < 0.05 && Math.abs(R.oben.y + R.oben.h - y0) < 0.05 && Math.abs(R.unten.y - (y0 + c * S)) < 0.05, "A4: die Flächen liegen nicht als Quadernetz");
      const xs = fig.rechtecke.flatMap((r) => [r.x, r.x + r.w]), ys = fig.rechtecke.flatMap((r) => [r.y, r.y + r.h]);
      const px = fig.linien.find((l) => l.rolle === "pfeil-x"), py = fig.linien.find((l) => l.rolle === "pfeil-y");
      pruefe(Math.abs(Math.min(px.x1, px.x2) - Math.min(...xs)) < 0.05 && Math.abs(Math.max(px.x1, px.x2) - Math.max(...xs)) < 0.05 && Math.abs(Math.min(py.y1, py.y2) - Math.min(...ys)) < 0.05 && Math.abs(Math.max(py.y1, py.y2) - Math.max(...ys)) < 0.05, "A4: x und y reichen nicht über das ganze Netz");
      const x = (Math.max(...xs) - Math.min(...xs)) / S, y = (Math.max(...ys) - Math.min(...ys)) / S;
      return { felder: [x, y], falschFelder: [[0, a + b, "zwei Flächen"], [0, 2 * a + b, "Zähl noch einmal"], [0, a + 2 * b, "Zähl noch einmal"], [1, c + b, "UND unten"], [1, c + 2 * a, "hinaus"], [1, c, "Höhe des Streifens"]] };
    },
  });

  await pruefeAufgabe(page, bericht, {
    nr: 5, name: "A5 Kantenmodell rückwärts", runden: RUNDEN, mindestensVerschieden: SCHRANKE[4],
    deute: (frage) => {
      const mL = frage.match(/Aus einem (\d+) cm langen Draht/);
      if (!mL) return null;
      const Ld = Number(mL[1]);
      let n, u, m;
      if ((m = frage.match(/ein Dreieck mit den Seiten (\d+) cm, (\d+) cm, (\d+) cm/))) {
        const s = m.slice(1).map(Number).sort((p, q) => p - q);
        pruefe(s[0] + s[1] > s[2], `A5: das Dreieck ${s.join(", ")} gibt es nicht`);
        n = 3; u = s[0] + s[1] + s[2];
      } else if ((m = frage.match(/ein Rechteck mit den Seiten (\d+) cm und (\d+) cm/))) { n = 4; u = 2 * Number(m[1]) + 2 * Number(m[2]); }
      else if ((m = frage.match(/Sechseck mit sechs gleich langen Seiten von je (\d+) cm/))) { n = 6; u = 6 * Number(m[1]); }
      else return null;
      FASSUNGEN.A5.add(n);
      const h = (Ld - 2 * u) / n;
      pruefe(Number.isInteger(h) && h > 0, `A5: die Höhe ${h} geht nicht glatt auf — „${frage}“`);
      return { richtig: h, toleranz: 0.01, falsch: [[(Ld - u) / n, "zwei Grundflächen"], [Ld - 2 * u, "teile noch"], [n === 3 ? NaN : (Ld - 2 * u) / 3, "nicht 3"]] };
    },
  });

  await pruefeAufgabe(page, bericht, {
    nr: 6, name: "A6 Vom Zählen zum Prisma", runden: RUNDEN, mindestensVerschieden: SCHRANKE[5],
    deute: (frage) => {
      let m, n, art;
      if ((m = frage.match(/Ein Prisma hat (\d+) Ecken\./))) { art = "ecken"; n = Number(m[1]) / 2; }
      else if ((m = frage.match(/Ein Prisma hat (\d+) Kanten\./))) { art = "kanten"; n = Number(m[1]) / 3; }
      else if ((m = frage.match(/Das Netz eines Prismas besteht aus (\d+) Flächen\./))) { art = "netz"; n = Number(m[1]) - 2; }
      else return null;
      FASSUNGEN.A6.add(art);
      pruefe(Number.isInteger(n) && n >= 3, `A6: aus „${frage}“ folgt kein Prisma`);
      const felder = [n], falschFelder = [];
      if (art === "ecken") falschFelder.push([0, 2 * n, "Hälfte davon"]);
      if (art === "kanten") falschFelder.push([0, 3 * n / 2, "halbiert"], [0, 3 * n, "dreimal so groß"]);
      if (art === "netz") falschFelder.push([0, n + 2, "zwei weniger"], [0, n + 1, "nicht eine"]);
      if (art !== "ecken") { const i = felder.length; felder.push(2 * n); falschFelder.push([i, n, "Deckfläche hat noch einmal"], [i, 3 * n, "Zahl der Kanten"], [i, n + 2, "Zahl der Flächen"]); }
      if (art !== "kanten") { const i = felder.length; felder.push(3 * n); falschFelder.push([i, 2 * n, "Seitenkanten"], [i, n, "einer Grundfläche"], [i, 4 * n, "zwei Seitenflächen"]); }
      if (art !== "netz") { const i = felder.length; felder.push(n + 2); falschFelder.push([i, n, "nur die Seitenflächen"], [i, n + 1, "zwei Grundflächen"], [i, 2, "rechteckigen Seitenflächen"]); }
      return { felder, falschFelder };
    },
  });

  await pruefeAufgabe(page, bericht, {
    nr: 7, name: "A7 Kantenmodell nach Schrägbild", runden: RUNDEN, mindestensVerschieden: SCHRANKE[6],
    liesRoh: liesFigur,
    deute: (frage, fig) => {
      if (!fig || !fig.vorn) return null;
      const { S, n, u } = vorderflaeche(fig, "A7");
      const tm = fig.texte.find((t) => t.rolle === "tiefe-mass");
      const d = zahl(tm && tm.text);
      pruefe(/^im Bild /.test(tm && tm.text), `A7: die Tiefe ist nicht als Bildlänge beschriftet („${tm && tm.text}“)`);
      const tk = tiefenkanten(fig);
      pruefe(tk.length === n && tk.every((k) => Math.abs(Math.hypot(k.dx, k.dy) - S * d) < 0.15), `A7: die Tiefenkanten sind im Bild nicht ${d} cm lang (${tk.map((k) => (Math.hypot(k.dx, k.dy) / S).toFixed(2)).join(", ")})`);
      const h = 2 * d;
      return { richtig: 2 * u + n * h, toleranz: 0.01, falsch: [[2 * u + n * d, "auf die Hälfte verkürzt"], [u + n * h, "nur eine Grundfläche"], [2 * u + h, "eine an jeder Ecke"]] };
    },
  });

  await pruefeAufgabe(page, bericht, {
    nr: 8, name: "A8 Mantel eines liegenden Prismas", runden: RUNDEN, mindestensVerschieden: SCHRANKE[7],
    liesRoh: liesFigur,
    deute: (frage, fig) => {
      if (!fig || !fig.vorn) return null;
      const { S, L, n, u, v } = vorderflaeche(fig, "A8");
      const h = zahl(fig.texte.find((t) => t.rolle === "tiefe-mass")?.text);
      const hv = zahl(fig.texte.find((t) => t.rolle === "vorn-hoehe-mass")?.text);
      const tk = tiefenkanten(fig);
      pruefe(tk.length === n && tk.every((k) => Math.abs(Math.hypot(k.dx, k.dy) - (S * h) / 2) < 0.15), `A8: die Tiefenkanten sind nicht halb so lang wie ${h} cm gezeichnet`);
      // Die eingezeichnete Höhe der Vorderfläche: senkrecht, von der Grundlinie bis zur obersten Ecke.
      const vh = fig.linien.find((l) => l.rolle === "vorn-hoehe");
      const yOben = Math.max(...v.map((p) => p[1])), yUnten = Math.min(...v.map((p) => p[1]));
      pruefe(!!vh && Math.abs(vh.x1 - vh.x2) < 0.05 && Math.abs(Math.abs(vh.y2 - vh.y1) - S * hv) < 0.15 && Math.abs((yOben - yUnten) - S * hv) < 0.15, `A8: die Höhe der Vorderfläche ist nicht ${hv} cm`);
      return { felder: [n, u, h], falschFelder: [[0, n + 2, "alle Flächen"], [0, n - 1, "auf der das Prisma liegt"], [1, u - L[0], "ganze Umfang"], [2, hv, "Höhe der Vorderfläche"], [2, h / 2, "Halbiert wird nur"]] };
    },
  });

  // Fassungen, die die Kollisionsprüfung jedes Mal aussiebte, fielen lautlos aus dem Vorrat.
  pruefe(FASSUNGEN.A5.size === 3, `A5: gezogen wurden nur die Grundflächen ${[...FASSUNGEN.A5]}`);
  pruefe(FASSUNGEN.A6.size === 3, `A6: gezogen wurden nur die Fassungen ${[...FASSUNGEN.A6]}`);
}

// ── Gerüst ─────────────────────────────────────────────────────────────────

async function geruest(page) {
  const folge = await page.evaluate(() => [...document.querySelectorAll("main section[id]")].map((x) => x.id));
  const soll = ["sec-prisma", "sec-netz", "sec-schraegbild", "sec-lage", "sec-vernetzung", "sec-formelsammlung", "sec-uebungen", "sec-selbsteinschaetzung"];
  pruefe(JSON.stringify(folge) === JSON.stringify(soll), `Gerüst: Abschnitte ${folge.join(", ")} statt ${soll.join(", ")}`);
  // Kein Vorgriff: Oberfläche und Volumen kommen erst auf den nächsten Seiten.
  for (const id of soll.slice(0, 4)) {
    const t = await page.evaluate((i) => document.getElementById(i).innerText, id);
    pruefe(!/cm²|cm³|Oberfläche|Volumen|Rauminhalt/.test(t), `Gerüst: ${id} greift auf Oberfläche oder Volumen vor`);
  }
  const verweis = await page.evaluate(() => { const a = document.querySelector("#sec-formelsammlung a[download]"); return a && a.getAttribute("href"); });
  pruefe(verweis === "formelsammlung.pdf", `Formelsammlung: Verweis auf „${verweis}“`);
  const pdf = path.join(WURZEL, "mathematik/klasse-8/koerper/formelsammlung.pdf");
  pruefe(fs.existsSync(pdf) && fs.readFileSync(pdf).subarray(0, 5).toString("latin1") === "%PDF-", "Formelsammlung: formelsammlung.pdf fehlt oder ist kein PDF");
  const links = await page.evaluate(() => [...document.querySelectorAll("main a[href]")].map((a) => a.getAttribute("href")).filter((h) => !h.startsWith("#") && !h.startsWith("http")));
  for (const href of new Set(links)) {
    const ziel = new URL(href.split("#")[0], "http://localhost/mathematik/klasse-8/koerper/").pathname;
    const antwort = await page.request.get("http://localhost:" + (process.env.UPLANT_PORT || "8936") + ziel);
    pruefe(antwort.ok(), `Gerüst: der Verweis „${href}“ führt ins Leere`);
    const anker = href.split("#")[1];
    if (anker && antwort.ok() && /\.html$/.test(ziel)) pruefe((await antwort.text()).includes(`id="${anker}"`), `Gerüst: die Sprungmarke „${anker}“ fehlt in ${ziel}`);
  }
  const menue = fs.readFileSync(path.join(WURZEL, "mathematik/klasse-8/koerper/index.html"), "utf8");
  const karte = menue.match(/<a class="menu-card"[^>]*href="prismen-netz-schraegbild\.html"[^>]*>\s*<h2>([^<]*)<\/h2>/);
  pruefe(!!karte && /data-section="klasse-8"/.test(karte[0]) && /\shidden\b/.test(karte[0]) && karte[1] === "1. Prismen: Netz und Schrägbild", "Gerüst: die Menükarte fehlt oder ist unvollständig");
  const k8 = fs.readFileSync(path.join(WURZEL, "mathematik/klasse-8/index.html"), "utf8");
  const k8karte = k8.match(/<a class="menu-card"[^>]*href="koerper\/index\.html"[^>]*>[\s\S]*?<h2>([^<]*)<\/h2>/);
  pruefe(!!k8karte && /data-section="klasse-8"/.test(k8karte[0]) && /\shidden\b/.test(k8karte[0]) && k8karte[1] === "Körper", "Gerüst: die Karte „Körper“ in Klasse 8 fehlt oder ist unvollständig");
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
      await teil("prisma", prisma, page);
      await teil("netz", netz, page);
      await teil("schraegbild", schraegbild, page);
      await teil("lage", lage, page);
      await teil("quizze", quizze, page);
      await teil("aufgaben", aufgaben, page);
    } else if (will("dunkel")) {
      await setzeRegler(page, "nz-t", 100);
      await setzeRegler(page, "sb-schritt", 4);
      await setzeRegler(page, "lg-t", 50);
      await pruefeKontrast(page, bericht, "dunkel");
      await pruefeStrichKontrast(page, bericht, "dunkel, Kanten und Flächen", "#pr-mount line, #pr-mount polygon.kp-g, #nz-mount polygon, #sb-mount line, #lg-mount line");
      await pruefeTextAufFlaeche(page, bericht, "dunkel, Beschriftungen", "#pr-mount text, #nz-mount text, #sb-mount text, #lg-mount text");
      await setzeRegler(page, "sb-schritt", 2);
      await pruefeStrichKontrast(page, bericht, "dunkel, Tiefenkanten", "#sb-mount line[data-rolle=tiefe]");
    }
    await pruefeNotation(page, bericht, wo);
    for (const s of page.stoerungen) pruefe(false, `${wo}: ${s}`);
    await page.close();
  }
  await browser.close();
  bericht.abschluss();
})();
