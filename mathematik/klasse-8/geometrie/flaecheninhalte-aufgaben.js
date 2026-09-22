// Die zwölf Übungsaufgaben zu „Flächeninhalte“ — vier je Figur, eine je Schwierigkeitsstufe.
//
// Die Stufen einfach, mittel und schwierig sind den Buchaufgaben nachgebildet:
//   einfach   — der Flächeninhalt aus einer beschrifteten Zeichnung (alle Maße im Bild),
//   mittel    — der Flächeninhalt aus Zahlenangaben, die erst in eine gemeinsame Einheit
//               umgerechnet werden müssen,
//   schwierig — die Umkehrung: aus dem Flächeninhalt und einer Größe die fehlende bestimmen.
// Die Stufe komplex geht darüber hinaus: Dort wird zerlegt, zweimal dieselbe Fläche gelesen
// oder aus zwei Teilfiguren zusammengesetzt.
//
// Alle Zahlen entstehen aus vorher gefilterten Listen, nie durch Verwerfen und Neuziehen:
// Jeder Kandidat steht schon vor der Ziehung fest, und die Aufgabe kann nicht in eine
// Endlosschleife geraten. Gefiltert wird auf zwei Dinge — das Ergebnis muss glatt aufgehen,
// und die Werte, auf die die Fehlerhinweise anspringen, müssen paarweise verschieden sein.
// Fiele ein Fehlerwert mit der Lösung zusammen, bekäme eine falsche Rechnung ein ✓.

"use strict";

// ---------- Zahlen und Einheiten ----------

export function num(x, digits = 4) {
  const f = Math.pow(10, digits);
  const gerundet = Math.round(x * f) / f;
  return (gerundet === 0 ? 0 : gerundet).toLocaleString("de-DE", { maximumFractionDigits: digits });
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Fehlerhinweise vergleichen die Eingabe mit dem Wert, der bei einem bestimmten Fehler
// herauskäme. Ein Vergleich mit === trifft dabei nicht: 0,1 + 0,2 ist nicht 0,3.
function trifft(val, soll) {
  return Number.isFinite(val) && Number.isFinite(soll) && Math.abs(val - soll) <= 1e-6 * Math.max(1, Math.abs(soll));
}

function paarweiseVerschieden(werte) {
  const echt = werte.filter((x) => Number.isFinite(x));
  return echt.every((x, i) => echt.every((y, j) => i === j || Math.abs(x - y) > 1e-9));
}

// Wählt aus einer VORHER gefilterten Liste — nicht durch Verwerfen und Neuziehen.
function ohneKollision(kandidaten, werte) {
  const sauber = kandidaten.filter((k) => paarweiseVerschieden(werte(k)));
  if (!sauber.length) throw new Error("Aufgabengenerator ohne gültige Kandidaten");
  return pick(sauber);
}

// Hat die Zahl höchstens so viele Nachkommastellen? Gerechnet wird ganzzahlig, damit
// 1,375 · 1000 nicht als 1374,9999999 durchfällt.
function glatt(x, stellen = 2) {
  const f = Math.pow(10, stellen);
  return Math.abs(Math.round(x * f) - x * f) < 1e-6;
}

// Längeneinheiten, gemessen in Zentimetern. Intern wird durchgehend in cm gerechnet.
const LAENGE = [
  { name: "mm", cm: 0.1 },
  { name: "cm", cm: 1 },
  { name: "dm", cm: 10 },
  { name: "m", cm: 100 },
];
// Flächeneinheiten, gemessen in Quadratzentimetern.
const FLAECHE = [
  { name: "mm²", cm2: 0.01 },
  { name: "cm²", cm2: 1 },
  { name: "dm²", cm2: 100 },
  { name: "m²", cm2: 10000 },
];
const E = (name) => LAENGE.find((e) => e.name === name);
const F = (name) => FLAECHE.find((e) => e.name === name);

// „25 dm“ — Zahl und Einheit gehören zusammen und werden nie getrennt ausgegeben.
function mitEinheit(wert, einheit) {
  return `${num(wert)} ${einheit}`;
}

// ---------- Zeichnungen für die Aufgabentexte ----------
//
// Die Figuren ersetzen das Bild im Buch: Die Maße stehen an der Figur, nicht im Text.
// Gezeichnet wird in Zentimetern; der Maßstab ergibt sich aus der Größe der Figur, damit
// ein 3-cm-Dreieck nicht als Briefmarke und ein 9-cm-Trapez nicht über den Rand erscheint.

function svgKopf(breite, hoehe, art) {
  return `<svg viewBox="0 0 ${breite} ${hoehe}" width="${breite}" height="${hoehe}" ` +
    `class="fl-aufgaben-figur" data-figur="${art}" role="img">`;
}

function linie(p, q, klasse, extra = "") {
  return `<line x1="${p.x.toFixed(1)}" y1="${p.y.toFixed(1)}" x2="${q.x.toFixed(1)}" y2="${q.y.toFixed(1)}" class="${klasse}" ${extra}/>`;
}

function flaeche(punkte) {
  return `<polygon points="${punkte.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")}" class="fl-fig-flaeche"/>` +
    `<polygon points="${punkte.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")}" class="fl-fig-kante"/>`;
}

function beschriftung(p, text, klasse, anker = "middle") {
  return `<text x="${p.x.toFixed(1)}" y="${p.y.toFixed(1)}" text-anchor="${anker}" class="${klasse}">${text}</text>`;
}

// Rechter-Winkel-Kästchen in V, ausgerichtet auf P und Q — in Bildpunkten.
function winkelZeichen(V, P, Q, klasse, s = 9) {
  const n = (u) => { const l = Math.hypot(u.x, u.y) || 1; return { x: u.x / l, y: u.y / l }; };
  const d1 = n({ x: P.x - V.x, y: P.y - V.y });
  const d2 = n({ x: Q.x - V.x, y: Q.y - V.y });
  const p1 = { x: V.x + d1.x * s, y: V.y + d1.y * s };
  const p3 = { x: V.x + d2.x * s, y: V.y + d2.y * s };
  const p2 = { x: p1.x + d2.x * s, y: p1.y + d2.y * s };
  return `<polyline points="${[p1, p2, p3].map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")}" class="${klasse}" fill="none"/>`;
}

// Parallelogramm mit beschrifteter Grundseite und Höhe.
// variante 0: Höhe von der oberen linken Ecke nach unten, Grundseite unten.
// variante 1: dieselbe Figur gespiegelt — Grundseite oben, Höhe von unten nach oben.
function figurParallelogramm(g, h, s, variante) {
  const skala = Math.min(34, 250 / (g + s), 125 / h);
  const B = (g + s) * skala + 70, H = h * skala + 56;
  const oben = variante === 1;
  const P = (x, y) => ({ x: 34 + x * skala, y: oben ? 20 + y * skala : H - 24 - y * skala });
  const A = P(0, 0), Bp = P(g, 0), C = P(g + s, h), D = P(s, h);
  const Fuss = P(s, 0);
  let out = svgKopf(B, H, "parallelogramm");
  out += flaeche([A, Bp, C, D]);
  out += linie(A, Bp, "fl-fig-grund");
  out += linie(Fuss, D, "fl-fig-hoehe", 'stroke-dasharray="5 3"');
  out += winkelZeichen(Fuss, Bp, D, "fl-fig-hoehe");
  out += beschriftung({ x: (A.x + Bp.x) / 2, y: oben ? A.y - 8 : A.y + 18 }, num(g), "fl-fig-grund-text");
  out += beschriftung({ x: (Fuss.x + D.x) / 2 + 14, y: (Fuss.y + D.y) / 2 + 4 }, num(h), "fl-fig-hoehe-text", "start");
  return out + "</svg>";
}

// Dreieck mit Grundseite und Höhe. Bei spitze > g liegt der Höhenfußpunkt außerhalb der
// Grundseite; dann wird sie als Gerade verlängert — genau wie im Heft.
function figurDreieck(g, h, spitze, variante) {
  const links = Math.min(0, spitze) - 0.3;
  const rechts = Math.max(g, spitze) + 0.3;
  const skala = Math.min(34, 250 / (rechts - links), 125 / h);
  const B = (rechts - links) * skala + 60, H = h * skala + 56;
  const oben = variante === 1;
  const P = (x, y) => ({ x: 30 + (x - links) * skala, y: oben ? 20 + y * skala : H - 24 - y * skala });
  const A = P(0, 0), Bp = P(g, 0), C = P(spitze, h), Fuss = P(spitze, 0);
  let out = svgKopf(B, H, "dreieck");
  out += flaeche([A, Bp, C]);
  if (spitze > g) out += linie(P(g, 0), P(spitze + 0.25, 0), "fl-fig-hilfe", 'stroke-dasharray="5 3"');
  if (spitze < 0) out += linie(P(spitze - 0.25, 0), P(0, 0), "fl-fig-hilfe", 'stroke-dasharray="5 3"');
  out += linie(A, Bp, "fl-fig-grund");
  out += linie(Fuss, C, "fl-fig-hoehe", 'stroke-dasharray="5 3"');
  out += winkelZeichen(Fuss, A, C, "fl-fig-hoehe");
  out += beschriftung({ x: (A.x + Bp.x) / 2, y: oben ? A.y - 8 : A.y + 18 }, num(g), "fl-fig-grund-text");
  out += beschriftung({ x: (Fuss.x + C.x) / 2 + 13, y: (Fuss.y + C.y) / 2 + 4 }, num(h), "fl-fig-hoehe-text", "start");
  return out + "</svg>";
}

// Trapez mit den beiden parallelen Seiten und der Höhe.
// variante 0: a unten, allgemeine Lage. variante 1: a oben (auf dem Kopf).
// variante 2: rechtwinkliges Trapez — der linke Schenkel IST die Höhe.
function figurTrapez(a, c, h, versatz, variante) {
  const breiteCm = Math.max(a, versatz + c);
  const skala = Math.min(32, 250 / breiteCm, 120 / h);
  const B = breiteCm * skala + 66, H = h * skala + 58;
  const kopf = variante === 1;
  const P = (x, y) => ({ x: 32 + x * skala, y: kopf ? 22 + y * skala : H - 26 - y * skala });
  const A = P(0, 0), Bp = P(a, 0), C = P(versatz + c, h), D = P(versatz, h);
  const Fuss = P(versatz, 0);
  let out = svgKopf(B, H, "trapez");
  out += flaeche([A, Bp, C, D]);
  out += linie(A, Bp, "fl-fig-grund");
  out += linie(D, C, "fl-fig-grund");
  out += linie(Fuss, D, "fl-fig-hoehe", versatz === 0 ? "" : 'stroke-dasharray="5 3"');
  out += winkelZeichen(Fuss, Bp, D, "fl-fig-hoehe");
  out += beschriftung({ x: (A.x + Bp.x) / 2, y: kopf ? A.y - 8 : A.y + 18 }, num(a), "fl-fig-grund-text");
  out += beschriftung({ x: (D.x + C.x) / 2, y: kopf ? D.y + 18 : D.y - 8 }, num(c), "fl-fig-grund-text");
  out += beschriftung({ x: (Fuss.x + D.x) / 2 + (versatz === 0 ? 13 : 13), y: (Fuss.y + D.y) / 2 + 4 }, num(h), "fl-fig-hoehe-text", "start");
  return out + "</svg>";
}

const HINWEIS_BILD = `<span class="progress-note">Alle Angaben im Bild in cm. Antworte in cm², nur die Maßzahl.</span>`;

// ================= Parallelogramm =================

// ---------- einfach: Flächeninhalt aus der Zeichnung ----------
//
// Wie Aufgabe 1 im Buch: Grundseite und zugehörige Höhe stehen an der Figur, gerechnet wird
// ein einziges Produkt. Der Versatz sorgt dafür, dass die Figur wirklich schief steht — bei
// Versatz 0 wäre es ein Rechteck, und die Höhe ließe sich mit der Seite verwechseln, ohne
// dass es auffiele.
const P1_KANDIDATEN = (() => {
  const liste = [];
  for (const g of [3, 3.5, 4, 4.5, 5, 6, 6.5, 7, 8, 9]) {
    for (const h of [2, 2.5, 3, 3.5, 4, 4.5, 5]) {
      for (const s of [1, 1.5, 2, 2.5]) {
        for (const variante of [0, 1]) liste.push({ g, h, s, variante });
      }
    }
  }
  return liste;
})();

function generateP1() {
  const k = ohneKollision(P1_KANDIDATEN, (v) => [v.g * v.h, (v.g * v.h) / 2, v.g + v.h, 2 * (v.g + v.h), v.g, v.h]);
  const { g, h, s, variante } = k;
  const A = g * h;
  return {
    promptHtml:
      `<strong>Berechne den Flächeninhalt des Parallelogramms.</strong>` +
      figurParallelogramm(g, h, s, variante) + HINWEIS_BILD,
    correct: A,
    tolerance: 0.001,
    placeholder: "A in cm²",
    hinweis: (roh, val) => {
      if (trifft(val, A / 2)) return `Du hast noch halbiert. Der Faktor ½ gehört zum <strong>Dreieck</strong>; beim Parallelogramm heißt es schlicht A = g · h.`;
      if (trifft(val, g + h)) return `Die beiden Zahlen werden <strong>multipliziert</strong>, nicht addiert: A = ${num(g)} · ${num(h)}.`;
      if (trifft(val, 2 * (g + h))) return `Das wäre ein Umfang. Gesucht ist der Flächeninhalt — und der Umfang ließe sich hier gar nicht ausrechnen, denn die schräge Seite ist nicht angegeben.`;
      if (trifft(val, g) || trifft(val, h)) return `Das ist eine der beiden Angaben. Der Flächeninhalt ist ihr Produkt.`;
      return `Die blaue Zahl ist die Grundseite g, die violette die zugehörige Höhe h. Rechne A = g · h.`;
    },
    musterloesungHtml:
      `<strong>1. Ablesen:</strong> Grundseite g = ${num(g)} cm, zugehörige Höhe h = ${num(h)} cm<br>` +
      `<strong>2. Formel:</strong> A = g · h<br>` +
      `<strong>3. Einsetzen:</strong> A = ${num(g)} cm · ${num(h)} cm = <strong>${num(A)} cm²</strong><br>` +
      `<em>Warum die Höhe und nicht die schräge Seite?</em> Weil das Parallelogramm durch Umlegen eines Dreiecks zu einem Rechteck mit den Seiten ${num(g)} cm und ${num(h)} cm wird — und dessen Flächeninhalt ist ${num(g)} · ${num(h)}.`,
  };
}

// ---------- mittel: mit Einheitenumrechnung ----------
//
// Wie Aufgabe 3 im Buch, aber mit fester Zieleinheit: Ohne sie wäre jede Antwort richtig,
// die irgendeine Einheit meint, und die Prüfung könnte nichts entscheiden.
function baueEinheitenKandidaten(werteA, werteB, formel, stellen = 2) {
  const liste = [];
  for (const eA of LAENGE) {
    for (const eB of LAENGE) {
      for (const ziel of FLAECHE) {
        for (const a of werteA) {
          for (const b of werteB) {
            const aCm = a * eA.cm, bCm = b * eB.cm;
            if (aCm < 0.5 || aCm > 5000 || bCm < 0.5 || bCm > 5000) continue;
            const flaecheCm2 = formel(aCm, bCm);
            const ziffer = flaecheCm2 / ziel.cm2;
            if (!glatt(ziffer, stellen) || ziffer < 0.05 || ziffer > 20000) continue;
            liste.push({ a, b, eA: eA.name, eB: eB.name, ziel: ziel.name, loesung: Math.round(ziffer * 1e6) / 1e6 });
          }
        }
      }
    }
  }
  return liste;
}

const P2_KANDIDATEN = baueEinheitenKandidaten(
  [2, 2.5, 3, 4, 4.5, 5, 6, 7.5, 8, 12, 15, 20, 25, 40, 60, 80, 125],
  [4, 5, 6, 8, 9.5, 10, 12, 15, 24, 30, 40, 45, 55, 60, 95],
  (a, b) => a * b,
).filter((k) => k.eA !== k.eB);

function generateP2() {
  const k = ohneKollision(P2_KANDIDATEN, (v) => {
    const gCm = v.a * E(v.eA).cm, hCm = v.b * E(v.eB).cm;
    return [v.loesung, (v.a * v.b) / F(v.ziel).cm2, (gCm * hCm) / 2 / F(v.ziel).cm2, (gCm + hCm) / F(v.ziel).cm2];
  });
  const { a, b, eA, eB, ziel, loesung } = k;
  const gCm = a * E(eA).cm, hCm = b * E(eB).cm;
  const naiv = (a * b) / F(ziel).cm2;
  return {
    promptHtml:
      `Ein Parallelogramm hat die Grundseite <strong>g = ${mitEinheit(a, eA)}</strong> und die zugehörige Höhe ` +
      `<strong>h = ${mitEinheit(b, eB)}</strong>.<br>` +
      `<strong>Berechne den Flächeninhalt in ${ziel}.</strong>` +
      `<span class="progress-note">Rechne die beiden Längen zuerst in dieselbe Einheit um. Antworte nur mit der Maßzahl.</span>`,
    correct: loesung,
    tolerance: Math.max(1e-4, Math.abs(loesung) * 1e-6),
    placeholder: "A in " + ziel,
    hinweis: (roh, val) => {
      if (trifft(val, naiv))
        return `Du hast ${num(a)} · ${num(b)} gerechnet und die Einheiten stehen lassen. ${eA} und ${eB} sind aber verschieden lang — erst umrechnen, dann multiplizieren.`;
      if (trifft(val, (gCm * hCm) / 2 / F(ziel).cm2))
        return `Der Faktor ½ gehört zum Dreieck. Beim Parallelogramm ist A = g · h.`;
      if (trifft(val, (gCm + hCm) / F(ziel).cm2))
        return `Addiert statt multipliziert. Der Flächeninhalt ist das Produkt aus Grundseite und Höhe.`;
      return `Schreibe beide Längen in derselben Einheit auf: g = ${num(gCm)} cm und h = ${num(hCm)} cm. Dann A = g · h und zum Schluss in ${ziel} umrechnen.`;
    },
    musterloesungHtml:
      `<strong>1. Gemeinsame Einheit:</strong> g = ${mitEinheit(a, eA)} = ${num(gCm)} cm, &nbsp; h = ${mitEinheit(b, eB)} = ${num(hCm)} cm<br>` +
      `<strong>2. Formel:</strong> A = g · h = ${num(gCm)} cm · ${num(hCm)} cm = ${num(gCm * hCm)} cm²<br>` +
      `<strong>3. In ${ziel} umrechnen:</strong> 1 ${ziel} = ${num(F(ziel).cm2)} cm², also A = ${num(gCm * hCm)} cm² : ${num(F(ziel).cm2)} = <strong>${num(loesung)} ${ziel}</strong><br>` +
      `<em>Merke:</em> Beim Umrechnen von Flächen zählt der Faktor <strong>zweimal</strong> — 1 dm = 10 cm, aber 1 dm² = 100 cm².`,
  };
}

// ---------- schwierig: die fehlende Größe ----------
//
// Wie Aufgabe 8 und die Tabelle in Aufgabe 9: Gegeben sind der Flächeninhalt und eine der
// beiden Größen, gesucht die andere. Die Einheiten stimmen dabei absichtlich nicht überein.
const P3_KANDIDATEN = (() => {
  const liste = [];
  for (const g of [3, 4, 5, 6, 8, 9, 10, 12, 15, 16, 20, 24, 25]) {
    for (const h of [2, 2.5, 3, 4, 5, 6, 8, 9, 12, 15]) {
      const flaecheCm2 = g * h;
      for (const eL of LAENGE) {
        for (const eF of FLAECHE) {
          for (const gesucht of ["hoehe", "grund"]) {
            // Gegeben ist die eine Länge in eL, der Flächeninhalt in eF; gesucht die andere
            // Länge — und zwar in derselben Einheit wie die gegebene.
            const gegebenCm = gesucht === "hoehe" ? g : h;
            const gesuchtCm = gesucht === "hoehe" ? h : g;
            const gegebenZahl = gegebenCm / eL.cm;
            const gesuchtZahl = gesuchtCm / eL.cm;
            const flaecheZahl = flaecheCm2 / eF.cm2;
            if (!glatt(gegebenZahl, 2) || !glatt(gesuchtZahl, 2) || !glatt(flaecheZahl, 3)) continue;
            if (gegebenZahl < 0.5 || gegebenZahl > 2000) continue;
            if (gesuchtZahl < 0.5 || gesuchtZahl > 2000) continue;
            if (flaecheZahl < 0.05 || flaecheZahl > 50000) continue;
            liste.push({ gesucht, eL: eL.name, eF: eF.name, gegebenZahl, gesuchtZahl, flaecheZahl, gegebenCm, gesuchtCm, flaecheCm2 });
          }
        }
      }
    }
  }
  return liste;
})();

function generateP3() {
  const k = ohneKollision(P3_KANDIDATEN, (v) => [
    v.gesuchtZahl, v.gegebenZahl, v.flaecheZahl,
    v.flaecheZahl * v.gegebenZahl, v.flaecheZahl / v.gegebenZahl, 2 * v.gesuchtZahl,
  ]);
  const { gesucht, eL, eF, gegebenZahl, gesuchtZahl, flaecheZahl, gegebenCm, flaecheCm2 } = k;
  const nachHoehe = gesucht === "hoehe";
  const gegebenCm2 = flaecheCm2;
  const malStattGeteilt = flaecheZahl * gegebenZahl;
  const ohneUmrechnen = flaecheZahl / gegebenZahl;
  return {
    promptHtml:
      `Ein Parallelogramm hat den Flächeninhalt <strong>A = ${mitEinheit(flaecheZahl, eF)}</strong>. ` +
      `Die ${nachHoehe ? "Grundseite" : "Höhe"} ist <strong>${nachHoehe ? "g" : "h"} = ${mitEinheit(gegebenZahl, eL)}</strong>.<br>` +
      `<strong>Wie groß ist die ${nachHoehe ? "zugehörige Höhe h" : "Grundseite g"}?</strong> Antworte in ${eL}.` +
      `<span class="progress-note">Achte auf die Einheiten: ${eF} und ${eL} passen noch nicht zusammen.</span>`,
    correct: gesuchtZahl,
    tolerance: Math.max(1e-4, Math.abs(gesuchtZahl) * 1e-6),
    placeholder: (nachHoehe ? "h" : "g") + " in " + eL,
    hinweis: (roh, val) => {
      if (trifft(val, malStattGeteilt))
        return `Multipliziert statt geteilt. Aus A = g · h folgt ${nachHoehe ? "h = A : g" : "g = A : h"} — der Flächeninhalt wird <strong>geteilt</strong>.`;
      if (trifft(val, ohneUmrechnen))
        return `Die Rechenart stimmt, aber die Einheiten noch nicht: ${num(flaecheZahl)} ${eF} sind ${num(gegebenCm2)} cm², und ${num(gegebenZahl)} ${eL} sind ${num(gegebenCm)} cm. Rechne beides zuerst um.`;
      if (trifft(val, 2 * gesuchtZahl))
        return `Du hast irgendwo verdoppelt — vielleicht die Dreiecksformel benutzt. Beim Parallelogramm gibt es keinen Faktor 2.`;
      if (trifft(val, gegebenZahl))
        return `Das ist die <strong>gegebene</strong> Größe. Gesucht ist die andere.`;
      return `Stelle A = g · h um: ${nachHoehe ? "h = A : g" : "g = A : h"}. Rechne A und ${nachHoehe ? "g" : "h"} vorher in dieselbe Einheit um.`;
    },
    musterloesungHtml:
      `<strong>1. Einheiten angleichen:</strong> A = ${mitEinheit(flaecheZahl, eF)} = ${num(gegebenCm2)} cm², &nbsp; ` +
      `${nachHoehe ? "g" : "h"} = ${mitEinheit(gegebenZahl, eL)} = ${num(gegebenCm)} cm<br>` +
      `<strong>2. Formel umstellen:</strong> A = g · h &nbsp;⟹&nbsp; ${nachHoehe ? "h = A : g" : "g = A : h"}<br>` +
      `<strong>3. Einsetzen:</strong> ${nachHoehe ? "h" : "g"} = ${num(gegebenCm2)} cm² : ${num(gegebenCm)} cm = ${num(k.gesuchtCm)} cm<br>` +
      `<strong>4. In ${eL} angeben:</strong> ${num(k.gesuchtCm)} cm = <strong>${num(gesuchtZahl)} ${eL}</strong><br>` +
      `<em>Probe:</em> ${num(gegebenCm)} cm · ${num(k.gesuchtCm)} cm = ${num(gegebenCm2)} cm² ✓`,
  };
}

// ---------- komplex: zwei Seiten, zwei Höhen ----------
//
// Der Flächeninhalt gehört der Figur, nicht der gewählten Grundseite. Wer das begriffen hat,
// löst diese Aufgabe in zwei Zeilen; wer h für „die zweite Seite“ hält, kommt nicht weiter.
const P4_KANDIDATEN = (() => {
  const liste = [];
  for (const a of [6, 8, 9, 10, 12, 14, 15, 16, 18, 20]) {
    for (const ha of [3, 4, 5, 6, 7, 8, 9, 10]) {
      for (const b of [4, 5, 6, 7, 8, 9, 10, 12, 15, 16]) {
        if (b === a) continue;
        const A = a * ha;
        const hb = A / b;
        // Die Höhe zu einer Seite ist nie länger als die andere Seite — sonst gäbe es das
        // Parallelogramm gar nicht.
        if (hb > a || ha > b) continue;
        if (!glatt(hb, 2) || hb < 1) continue;
        liste.push({ a, ha, b, A, hb });
      }
    }
  }
  return liste;
})();

function generateP4() {
  const k = ohneKollision(P4_KANDIDATEN, (v) => [v.A, v.hb, v.a, v.ha, v.b, v.A / 2, v.b * v.ha]);
  const { a, ha, b, A, hb } = k;
  return {
    promptHtml:
      `Ein Parallelogramm hat die Seiten <strong>a = ${num(a)} cm</strong> und <strong>b = ${num(b)} cm</strong>. ` +
      `Zur Seite a gehört die Höhe <strong>h<sub>a</sub> = ${num(ha)} cm</strong>.` +
      `<span class="progress-note">Beide Felder in cm bzw. cm², nur die Maßzahl.</span>`,
    felder: [
      {
        name: "Flächeninhalt A", soll: A, einheit: "cm²", toleranz: 0.001, platzhalter: "A",
        hinweis: (roh, val) => {
          if (trifft(val, a * b)) return `${num(a)} · ${num(b)} multipliziert die beiden <strong>Seiten</strong>. In die Formel gehört zur Seite a ihre eigene Höhe h<sub>a</sub>.`;
          if (trifft(val, (a * ha) / 2)) return `Der Faktor ½ gehört zum Dreieck.`;
          if (trifft(val, b * ha)) return `Zur Höhe h<sub>a</sub> gehört die Seite <strong>a</strong>, nicht b.`;
          return `A = a · h<sub>a</sub> = ${num(a)} · ${num(ha)}.`;
        },
      },
      {
        name: "Höhe h<sub>b</sub> zur Seite b", soll: hb, einheit: "cm", toleranz: 0.001, platzhalter: "h_b",
        hinweis: (roh, val) => {
          if (trifft(val, ha)) return `h<sub>a</sub> und h<sub>b</sub> sind verschieden. Zur <strong>längeren</strong> Seite gehört die <strong>kürzere</strong> Höhe, denn das Produkt ist beide Male der Flächeninhalt.`;
          if (trifft(val, A * b)) return `Multipliziert statt geteilt: Aus A = b · h<sub>b</sub> folgt h<sub>b</sub> = A : b.`;
          if (trifft(val, b - a) || trifft(val, a - b)) return `Die Differenz der Seiten hilft hier nicht weiter. Lies denselben Flächeninhalt ein zweites Mal — jetzt mit b als Grundseite.`;
          return `Derselbe Flächeninhalt, andere Grundseite: A = b · h<sub>b</sub>, also h<sub>b</sub> = A : b.`;
        },
      },
    ],
    tipps: [
      "Ein Parallelogramm hat <strong>zwei</strong> Paare paralleler Seiten — und damit auch zwei Höhen. Zu jeder Seite gehört ihre eigene.",
      `Rechne zuerst den Flächeninhalt aus der Seite a und der Höhe h<sub>a</sub> aus: A = ${num(a)} cm · ${num(ha)} cm.`,
      `Der Flächeninhalt ist eine Eigenschaft der Figur und ändert sich nicht, wenn du eine andere Seite als Grundseite wählst. Also gilt auch A = b · h<sub>b</sub> — nach h<sub>b</sub> auflösen.`,
    ],
    musterloesungHtml:
      `<strong>1. Flächeninhalt über a:</strong> A = a · h<sub>a</sub> = ${num(a)} cm · ${num(ha)} cm = <strong>${num(A)} cm²</strong><br>` +
      `<strong>2. Derselbe Flächeninhalt über b:</strong> A = b · h<sub>b</sub>, also ${num(A)} cm² = ${num(b)} cm · h<sub>b</sub><br>` +
      `<strong>3. Auflösen:</strong> h<sub>b</sub> = ${num(A)} cm² : ${num(b)} cm = <strong>${num(hb)} cm</strong><br>` +
      `<em>Kontrolle:</em> ${num(b)} cm · ${num(hb)} cm = ${num(A)} cm² ✓ &nbsp; Und die Größenordnung stimmt: ` +
      `${b > a ? `b ist länger als a, also ist h<sub>b</sub> kürzer als h<sub>a</sub>` : `b ist kürzer als a, also ist h<sub>b</sub> länger als h<sub>a</sub>`}.`,
  };
}

// ================= Dreieck =================

// ---------- einfach: Flächeninhalt aus der Zeichnung ----------
const D1_KANDIDATEN = (() => {
  const liste = [];
  for (const g of [3, 4, 4.5, 5, 6, 7, 8, 9, 10]) {
    for (const h of [2, 2.5, 3, 3.5, 4, 4.5, 5, 6]) {
      if (!glatt((g * h) / 2, 2)) continue;
      // Die Spitze steht mal innerhalb, mal außerhalb der Grundseite: Nur so kommt der Fall
      // vor, in dem die Höhe außerhalb des Dreiecks liegt.
      for (const lage of ["innen", "innen", "aussen"]) {
        for (const variante of [0, 1]) liste.push({ g, h, lage, variante });
      }
    }
  }
  return liste;
})();

function generateD1() {
  const k = ohneKollision(D1_KANDIDATEN, (v) => [(v.g * v.h) / 2, v.g * v.h, v.g + v.h, v.g, v.h]);
  const { g, h, lage, variante } = k;
  const spitze = lage === "innen" ? Math.round(g * 0.35 * 2) / 2 : g + Math.min(2, Math.max(1, Math.round(g * 0.3)));
  const A = (g * h) / 2;
  return {
    promptHtml:
      `<strong>Berechne den Flächeninhalt des Dreiecks.</strong>` +
      figurDreieck(g, h, spitze, variante) + HINWEIS_BILD,
    correct: A,
    tolerance: 0.001,
    placeholder: "A in cm²",
    hinweis: (roh, val) => {
      if (trifft(val, g * h)) return `Das ist das <strong>Parallelogramm</strong> aus zwei solchen Dreiecken. Ein einzelnes ist halb so groß: A = ½ · g · h.`;
      if (trifft(val, g + h)) return `Die beiden Zahlen werden multipliziert und dann halbiert, nicht addiert.`;
      if (trifft(val, (g + h) / 2)) return `Der Mittelwert der beiden Zahlen ist kein Flächeninhalt. Gerechnet wird ½ · g · h.`;
      if (trifft(val, g) || trifft(val, h)) return `Das ist eine der beiden Angaben. Der Flächeninhalt ist ihr halbes Produkt.`;
      return `A = ½ · g · h — erst multiplizieren, dann halbieren.`;
    },
    musterloesungHtml:
      `<strong>1. Ablesen:</strong> Grundseite g = ${num(g)} cm, zugehörige Höhe h = ${num(h)} cm<br>` +
      `<strong>2. Formel:</strong> A = ½ · g · h<br>` +
      `<strong>3. Einsetzen:</strong> A = ½ · ${num(g)} cm · ${num(h)} cm = ½ · ${num(g * h)} cm² = <strong>${num(A)} cm²</strong><br>` +
      (lage === "aussen"
        ? `<em>Beachte:</em> Der Fußpunkt der Höhe liegt hier <strong>außerhalb</strong> der Grundseite — die Grundseite wurde dafür als Gerade verlängert. An der Formel ändert das nichts.`
        : `<em>Zur Kontrolle:</em> Zwei solche Dreiecke ergeben ein Parallelogramm mit ${num(g * h)} cm². Das Dreieck ist genau die Hälfte davon.`),
  };
}

// ---------- mittel: mit Einheitenumrechnung ----------
const D2_KANDIDATEN = baueEinheitenKandidaten(
  [2, 2.5, 3, 4, 4.5, 5, 6, 8, 10, 12, 15, 16, 20, 24, 30, 40, 50],
  [4, 5, 6, 8, 10, 12, 15, 20, 24, 25, 30, 36, 40, 60, 80],
  (a, b) => (a * b) / 2,
).filter((k) => k.eA !== k.eB);

function generateD2() {
  const k = ohneKollision(D2_KANDIDATEN, (v) => {
    const gCm = v.a * E(v.eA).cm, hCm = v.b * E(v.eB).cm;
    return [v.loesung, (gCm * hCm) / F(v.ziel).cm2, (v.a * v.b) / 2 / F(v.ziel).cm2, (gCm + hCm) / F(v.ziel).cm2];
  });
  const { a, b, eA, eB, ziel, loesung } = k;
  const gCm = a * E(eA).cm, hCm = b * E(eB).cm;
  const ohneHalbieren = (gCm * hCm) / F(ziel).cm2;
  const naiv = (a * b) / 2 / F(ziel).cm2;
  return {
    promptHtml:
      `Ein Dreieck hat die Grundseite <strong>g = ${mitEinheit(a, eA)}</strong> und die zugehörige Höhe ` +
      `<strong>h = ${mitEinheit(b, eB)}</strong>.<br>` +
      `<strong>Berechne den Flächeninhalt in ${ziel}.</strong>` +
      `<span class="progress-note">Rechne die beiden Längen zuerst in dieselbe Einheit um. Antworte nur mit der Maßzahl.</span>`,
    correct: loesung,
    tolerance: Math.max(1e-4, Math.abs(loesung) * 1e-6),
    placeholder: "A in " + ziel,
    hinweis: (roh, val) => {
      if (trifft(val, ohneHalbieren)) return `Das Halbieren fehlt: ${num(gCm)} cm · ${num(hCm)} cm ist das Parallelogramm aus zwei solchen Dreiecken.`;
      if (trifft(val, naiv)) return `Du hast ½ · ${num(a)} · ${num(b)} gerechnet und die Einheiten stehen lassen. ${eA} und ${eB} sind verschieden lang — erst umrechnen.`;
      if (trifft(val, (gCm + hCm) / F(ziel).cm2)) return `Addiert statt multipliziert.`;
      return `Erst beide Längen in dieselbe Einheit, dann A = ½ · g · h, zuletzt in ${ziel} umrechnen.`;
    },
    musterloesungHtml:
      `<strong>1. Gemeinsame Einheit:</strong> g = ${mitEinheit(a, eA)} = ${num(gCm)} cm, &nbsp; h = ${mitEinheit(b, eB)} = ${num(hCm)} cm<br>` +
      `<strong>2. Formel:</strong> A = ½ · g · h = ½ · ${num(gCm)} cm · ${num(hCm)} cm = ${num((gCm * hCm) / 2)} cm²<br>` +
      `<strong>3. In ${ziel} umrechnen:</strong> 1 ${ziel} = ${num(F(ziel).cm2)} cm², also A = <strong>${num(loesung)} ${ziel}</strong><br>` +
      `<em>Merke:</em> Erst umrechnen, dann rechnen. Wer die Einheiten bis zum Schluss mitschleppt, verrechnet sich seltener.`,
  };
}

// ---------- schwierig: die fehlende Größe ----------
const D3_KANDIDATEN = (() => {
  const liste = [];
  for (const g of [4, 5, 6, 8, 9, 10, 12, 14, 15, 16, 18, 20, 24, 25]) {
    for (const h of [3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 15, 18]) {
      const flaecheCm2 = (g * h) / 2;
      for (const eL of LAENGE) {
        for (const eF of FLAECHE) {
          for (const gesucht of ["hoehe", "grund"]) {
            const gegebenCm = gesucht === "hoehe" ? g : h;
            const gesuchtCm = gesucht === "hoehe" ? h : g;
            const gegebenZahl = gegebenCm / eL.cm;
            const gesuchtZahl = gesuchtCm / eL.cm;
            const flaecheZahl = flaecheCm2 / eF.cm2;
            if (!glatt(gegebenZahl, 2) || !glatt(gesuchtZahl, 2) || !glatt(flaecheZahl, 3)) continue;
            if (gegebenZahl < 0.5 || gegebenZahl > 2000) continue;
            if (gesuchtZahl < 0.5 || gesuchtZahl > 2000) continue;
            if (flaecheZahl < 0.05 || flaecheZahl > 50000) continue;
            liste.push({ gesucht, eL: eL.name, eF: eF.name, gegebenZahl, gesuchtZahl, flaecheZahl, gegebenCm, gesuchtCm, flaecheCm2 });
          }
        }
      }
    }
  }
  return liste;
})();

function generateD3() {
  const k = ohneKollision(D3_KANDIDATEN, (v) => [
    v.gesuchtZahl, v.gegebenZahl, v.flaecheZahl,
    v.gesuchtZahl / 2, 2 * v.gesuchtZahl, v.flaecheZahl / v.gegebenZahl,
  ]);
  const { gesucht, eL, eF, gegebenZahl, gesuchtZahl, flaecheZahl, gegebenCm, gesuchtCm, flaecheCm2 } = k;
  const nachHoehe = gesucht === "hoehe";
  return {
    promptHtml:
      `Ein Dreieck hat den Flächeninhalt <strong>A = ${mitEinheit(flaecheZahl, eF)}</strong>. ` +
      `Die ${nachHoehe ? "Grundseite" : "Höhe"} ist <strong>${nachHoehe ? "g" : "h"} = ${mitEinheit(gegebenZahl, eL)}</strong>.<br>` +
      `<strong>Wie groß ist die ${nachHoehe ? "zugehörige Höhe h" : "Grundseite g"}?</strong> Antworte in ${eL}.` +
      `<span class="progress-note">Achte auf den Faktor ½ — und auf die Einheiten.</span>`,
    correct: gesuchtZahl,
    tolerance: Math.max(1e-4, Math.abs(gesuchtZahl) * 1e-6),
    placeholder: (nachHoehe ? "h" : "g") + " in " + eL,
    hinweis: (roh, val) => {
      if (trifft(val, gesuchtZahl / 2))
        return `Einmal zu oft halbiert. Beim Umstellen wird der Faktor ½ zur <strong>Multiplikation mit 2</strong>: ${nachHoehe ? "h = 2 · A : g" : "g = 2 · A : h"}.`;
      if (trifft(val, 2 * gesuchtZahl))
        return `Einmal zu oft verdoppelt. Prüfe die Probe: ½ · g · h muss wieder ${num(flaecheZahl)} ${eF} ergeben.`;
      if (trifft(val, flaecheZahl / gegebenZahl))
        return `Hier fehlt die Umrechnung: ${num(flaecheZahl)} ${eF} sind ${num(flaecheCm2)} cm², und ${num(gegebenZahl)} ${eL} sind ${num(gegebenCm)} cm.`;
      if (trifft(val, gegebenZahl))
        return `Das ist die gegebene Größe. Gesucht ist die andere.`;
      return `Aus A = ½ · g · h wird 2 · A = g · h, also ${nachHoehe ? "h = 2 · A : g" : "g = 2 · A : h"}.`;
    },
    musterloesungHtml:
      `<strong>1. Einheiten angleichen:</strong> A = ${mitEinheit(flaecheZahl, eF)} = ${num(flaecheCm2)} cm², &nbsp; ` +
      `${nachHoehe ? "g" : "h"} = ${mitEinheit(gegebenZahl, eL)} = ${num(gegebenCm)} cm<br>` +
      `<strong>2. Formel umstellen:</strong> A = ½ · g · h &nbsp;⟹&nbsp; 2 · A = g · h &nbsp;⟹&nbsp; ${nachHoehe ? "h = 2 · A : g" : "g = 2 · A : h"}<br>` +
      `<strong>3. Einsetzen:</strong> ${nachHoehe ? "h" : "g"} = 2 · ${num(flaecheCm2)} cm² : ${num(gegebenCm)} cm = ${num(2 * flaecheCm2)} cm² : ${num(gegebenCm)} cm = ${num(gesuchtCm)} cm<br>` +
      `<strong>4. In ${eL} angeben:</strong> ${num(gesuchtCm)} cm = <strong>${num(gesuchtZahl)} ${eL}</strong><br>` +
      `<em>Probe:</em> ½ · ${num(gegebenCm)} cm · ${num(gesuchtCm)} cm = ${num(flaecheCm2)} cm² ✓`,
  };
}

// ---------- komplex: ein Viereck in zwei Dreiecke zerlegen ----------
//
// Die Diagonale zerlegt jedes Viereck in zwei Dreiecke. Beide haben dieselbe Grundseite —
// die Diagonale —, aber jedes seine eigene Höhe. Das ist das Grundmuster für alle Flächen,
// für die es keine eigene Formel gibt.
const D4_KANDIDATEN = (() => {
  const liste = [];
  for (const e of [6, 8, 9, 10, 12, 14, 15, 16, 18, 20]) {
    for (const h1 of [2, 3, 4, 5, 6, 7, 8]) {
      for (const h2 of [2, 3, 4, 5, 6, 7, 8, 9]) {
        if (h1 === h2) continue;             // sonst wären beide Teilflächen gleich
        const A1 = (e * h1) / 2, A2 = (e * h2) / 2;
        if (!glatt(A1, 2) || !glatt(A2, 2)) continue;
        liste.push({ e, h1, h2, A1, A2, A: A1 + A2 });
      }
    }
  }
  return liste;
})();

function generateD4() {
  const k = ohneKollision(D4_KANDIDATEN, (v) => [v.A1, v.A2, v.A, v.e * (v.h1 + v.h2), v.e, v.h1, v.h2]);
  const { e, h1, h2, A1, A2, A } = k;
  return {
    promptHtml:
      `Ein Viereck ABCD wird durch die Diagonale <strong>AC</strong> in zwei Dreiecke zerlegt. ` +
      `Die Diagonale ist <strong>AC = ${num(e)} cm</strong> lang. ` +
      `Der Punkt B hat von ihr den Abstand <strong>${num(h1)} cm</strong>, der Punkt D den Abstand <strong>${num(h2)} cm</strong>.` +
      `<span class="progress-note">Die beiden Abstände sind die Höhen der Teildreiecke auf die gemeinsame Grundseite AC. Alle Felder in cm².</span>`,
    felder: [
      {
        name: "Fläche des Dreiecks ABC", soll: A1, einheit: "cm²", toleranz: 0.001, platzhalter: "A₁",
        hinweis: (roh, val) => {
          if (trifft(val, e * h1)) return `Das Halbieren fehlt: A = ½ · g · h.`;
          if (trifft(val, A2)) return `Das ist das <strong>andere</strong> Teildreieck — das mit der Höhe ${num(h2)} cm.`;
          return `Grundseite ist die Diagonale AC = ${num(e)} cm, Höhe der Abstand von B: ${num(h1)} cm.`;
        },
      },
      {
        name: "Fläche des Dreiecks ACD", soll: A2, einheit: "cm²", toleranz: 0.001, platzhalter: "A₂",
        hinweis: (roh, val) => {
          if (trifft(val, e * h2)) return `Das Halbieren fehlt.`;
          if (trifft(val, A1)) return `Das ist das erste Teildreieck — das mit der Höhe ${num(h1)} cm.`;
          return `Dieselbe Grundseite AC = ${num(e)} cm, aber jetzt der Abstand von D: ${num(h2)} cm.`;
        },
      },
      {
        name: "Fläche des ganzen Vierecks", soll: A, einheit: "cm²", toleranz: 0.001, platzhalter: "A",
        hinweis: (roh, val) => {
          if (trifft(val, e * (h1 + h2))) return `Hier wurde zweimal das Halbieren vergessen. Jedes Teildreieck hat den Faktor ½.`;
          if (trifft(val, A2 - A1) || trifft(val, A1 - A2)) return `Die beiden Teilflächen werden <strong>addiert</strong>, nicht voneinander abgezogen — sie liegen nebeneinander, nicht ineinander.`;
          if (trifft(val, A1) || trifft(val, A2)) return `Das ist erst eine der beiden Hälften.`;
          return `Beide Teilflächen zusammenzählen.`;
        },
      },
    ],
    tipps: [
      "Zeichne das Viereck mit der Diagonalen AC. Sie zerlegt es in zwei Dreiecke, die nur diese eine Seite gemeinsam haben.",
      `Beide Dreiecke haben dieselbe Grundseite AC = ${num(e)} cm. Der Abstand eines Punktes von einer Geraden ist immer das <strong>Lot</strong> — also genau die Höhe.`,
      `Weil die Grundseite in beiden Dreiecken dieselbe ist, lässt sich am Ende auch abkürzen: A = ½ · ${num(e)} · (${num(h1)} + ${num(h2)}).`,
    ],
    musterloesungHtml:
      `<strong>1. Dreieck ABC:</strong> A₁ = ½ · AC · h₁ = ½ · ${num(e)} cm · ${num(h1)} cm = <strong>${num(A1)} cm²</strong><br>` +
      `<strong>2. Dreieck ACD:</strong> A₂ = ½ · AC · h₂ = ½ · ${num(e)} cm · ${num(h2)} cm = <strong>${num(A2)} cm²</strong><br>` +
      `<strong>3. Zusammen:</strong> A = A₁ + A₂ = ${num(A1)} cm² + ${num(A2)} cm² = <strong>${num(A)} cm²</strong><br>` +
      `<em>Kürzer:</em> Beide Dreiecke haben dieselbe Grundseite, also A = ½ · ${num(e)} cm · (${num(h1)} cm + ${num(h2)} cm) = ½ · ${num(e)} cm · ${num(h1 + h2)} cm = ${num(A)} cm² ✓<br>` +
      `<span class="progress-note">Dieselbe Rechnung wie beim Trapez — nur dass dort die beiden parallelen Seiten addiert werden und hier die beiden Höhen. In beiden Fällen steckt dahinter: gemeinsame Grundseite ausklammern.</span>`,
  };
}

// ================= Trapez =================

// ---------- einfach: Flächeninhalt aus der Zeichnung ----------
const T1_KANDIDATEN = (() => {
  const liste = [];
  for (const a of [4, 5, 6, 6.5, 7, 8, 9, 10]) {
    for (const c of [2, 2.5, 3, 3.5, 4, 4.5, 5]) {
      if (c >= a) continue;
      for (const h of [2, 2.5, 3, 3.5, 4, 5]) {
        if (!glatt(((a + c) * h) / 2, 2)) continue;
        for (const variante of [0, 1, 2]) liste.push({ a, c, h, variante });
      }
    }
  }
  return liste;
})();

function generateT1() {
  const k = ohneKollision(T1_KANDIDATEN, (v) => [
    ((v.a + v.c) * v.h) / 2, (v.a + v.c) * v.h, v.a * v.h, v.c * v.h, (v.a * v.c) / 2, v.a + v.c + v.h,
  ]);
  const { a, c, h, variante } = k;
  // variante 2 ist das rechtwinklige Trapez: Der linke Schenkel steht senkrecht, die Höhe
  // fällt mit ihm zusammen. So sieht es im Buch bei Aufgabe 1a und 1c aus.
  const versatz = variante === 2 ? 0 : Math.min(1.5, Math.round((a - c) / 2 * 2) / 2);
  const A = ((a + c) * h) / 2;
  return {
    promptHtml:
      `<strong>Berechne den Flächeninhalt des Trapezes.</strong>` +
      figurTrapez(a, c, h, versatz, variante) + HINWEIS_BILD,
    correct: A,
    tolerance: 0.001,
    placeholder: "A in cm²",
    hinweis: (roh, val) => {
      if (trifft(val, (a + c) * h)) return `Das Halbieren fehlt. ${num(a + c)} · ${num(h)} ist das Parallelogramm aus <strong>zwei</strong> solchen Trapezen.`;
      if (trifft(val, a * h)) return `Nur die längere der beiden parallelen Seiten benutzt. In die Formel gehören <strong>beide</strong>: ½ · (a + c) · h.`;
      if (trifft(val, c * h)) return `Nur die kürzere der beiden parallelen Seiten benutzt. In die Formel gehören beide.`;
      if (trifft(val, (a * c) / 2)) return `Die beiden parallelen Seiten werden <strong>addiert</strong>, nicht multipliziert. Multipliziert wird erst mit der Höhe.`;
      if (trifft(val, a + c + h)) return `Das ist eine Summe von Längen und kann kein Flächeninhalt sein.`;
      return `A = ½ · (a + c) · h — zuerst die beiden parallelen Seiten addieren.`;
    },
    musterloesungHtml:
      `<strong>1. Ablesen:</strong> parallele Seiten a = ${num(a)} cm und c = ${num(c)} cm, Höhe h = ${num(h)} cm<br>` +
      `<strong>2. Formel:</strong> A = ½ · (a + c) · h<br>` +
      `<strong>3. Einsetzen:</strong> A = ½ · (${num(a)} cm + ${num(c)} cm) · ${num(h)} cm = ½ · ${num(a + c)} cm · ${num(h)} cm = <strong>${num(A)} cm²</strong><br>` +
      `<em>Zur Kontrolle über die Mittellinie:</em> m = (${num(a)} + ${num(c)}) : 2 = ${num((a + c) / 2)} cm, und ${num((a + c) / 2)} cm · ${num(h)} cm = ${num(A)} cm² ✓ — ` +
      `das Trapez ist genauso groß wie ein Rechteck mit der Mittellinie als Breite.`,
  };
}

// ---------- mittel: mit Einheitenumrechnung ----------
//
// Wie Aufgabe 3 beim Trapez im Buch: a und c stehen oft in verschiedenen Einheiten
// (a = 700 m, c = 1,7 km), und die Höhe in einer dritten.
const T2_KANDIDATEN = (() => {
  const liste = [];
  const werte = [2, 2.5, 3, 4, 5, 6, 8, 10, 12, 15, 20, 24, 25, 40, 50, 60, 80, 100];
  for (const eA of LAENGE) {
    for (const eC of LAENGE) {
      if (eA.name === eC.name) continue;         // sonst ist nichts umzurechnen
      for (const ziel of FLAECHE) {
        for (const a of werte) {
          for (const c of werte) {
            const aCm = a * eA.cm, cCm = c * eC.cm;
            if (aCm <= cCm) continue;            // a ist die längere der beiden Seiten
            if (aCm > 8000 || cCm < 0.5) continue;
            for (const h of [2, 3, 4, 5, 6, 8, 10, 12, 20, 25, 40, 50]) {
              for (const eH of LAENGE) {
                const hCm = h * eH.cm;
                if (hCm < 0.5 || hCm > 5000) continue;
                const flaecheCm2 = ((aCm + cCm) * hCm) / 2;
                const ziffer = flaecheCm2 / ziel.cm2;
                if (!glatt(ziffer, 2) || ziffer < 0.05 || ziffer > 20000) continue;
                liste.push({ a, c, h, eA: eA.name, eC: eC.name, eH: eH.name, ziel: ziel.name, loesung: Math.round(ziffer * 1e6) / 1e6 });
              }
            }
          }
        }
      }
    }
  }
  return liste;
})();

function generateT2() {
  const k = ohneKollision(T2_KANDIDATEN, (v) => {
    const aCm = v.a * E(v.eA).cm, cCm = v.c * E(v.eC).cm, hCm = v.h * E(v.eH).cm;
    return [
      v.loesung,
      ((aCm + cCm) * hCm) / F(v.ziel).cm2,
      ((v.a + v.c) * v.h) / 2 / F(v.ziel).cm2,
      (aCm * hCm) / 2 / F(v.ziel).cm2,
    ];
  });
  const { a, c, h, eA, eC, eH, ziel, loesung } = k;
  const aCm = a * E(eA).cm, cCm = c * E(eC).cm, hCm = h * E(eH).cm;
  const ohneHalbieren = ((aCm + cCm) * hCm) / F(ziel).cm2;
  const naiv = ((a + c) * h) / 2 / F(ziel).cm2;
  return {
    promptHtml:
      `Ein Trapez hat die parallelen Seiten <strong>a = ${mitEinheit(a, eA)}</strong> und <strong>c = ${mitEinheit(c, eC)}</strong> ` +
      `sowie die Höhe <strong>h = ${mitEinheit(h, eH)}</strong>.<br>` +
      `<strong>Berechne den Flächeninhalt in ${ziel}.</strong>` +
      `<span class="progress-note">Drei Längen, drei Einheiten — rechne zuerst alles in dieselbe um. Antworte nur mit der Maßzahl.</span>`,
    correct: loesung,
    tolerance: Math.max(1e-4, Math.abs(loesung) * 1e-6),
    placeholder: "A in " + ziel,
    hinweis: (roh, val) => {
      if (trifft(val, ohneHalbieren)) return `Das Halbieren fehlt: (a + c) · h ist das Parallelogramm aus zwei Trapezen.`;
      if (trifft(val, naiv)) return `Du hast ½ · (${num(a)} + ${num(c)}) · ${num(h)} gerechnet und die Einheiten stehen lassen. Addieren darf man nur gleichnamige Größen — ${num(a)} ${eA} und ${num(c)} ${eC} sind das nicht.`;
      if (trifft(val, (aCm * hCm) / 2 / F(ziel).cm2)) return `Nur die Seite a benutzt. In die Formel gehören beide parallelen Seiten.`;
      return `Schreibe zuerst alle drei Längen in Zentimetern auf: a = ${num(aCm)} cm, c = ${num(cCm)} cm, h = ${num(hCm)} cm.`;
    },
    musterloesungHtml:
      `<strong>1. Gemeinsame Einheit:</strong> a = ${mitEinheit(a, eA)} = ${num(aCm)} cm, &nbsp; c = ${mitEinheit(c, eC)} = ${num(cCm)} cm, &nbsp; h = ${mitEinheit(h, eH)} = ${num(hCm)} cm<br>` +
      `<strong>2. Parallele Seiten addieren:</strong> a + c = ${num(aCm)} cm + ${num(cCm)} cm = ${num(aCm + cCm)} cm<br>` +
      `<strong>3. Formel:</strong> A = ½ · ${num(aCm + cCm)} cm · ${num(hCm)} cm = ${num(((aCm + cCm) * hCm) / 2)} cm²<br>` +
      `<strong>4. In ${ziel} umrechnen:</strong> 1 ${ziel} = ${num(F(ziel).cm2)} cm², also A = <strong>${num(loesung)} ${ziel}</strong><br>` +
      `<em>Merke:</em> Addieren geht nur bei gleicher Einheit. ${num(a)} ${eA} + ${num(c)} ${eC} ist keine sinnvolle Rechnung — so wenig wie „3 Äpfel + 4 Birnen = 7 Äpfel“.`,
  };
}

// ---------- schwierig: die fehlende Größe ----------
//
// Wie die Tabelle in Aufgabe 6: In jeder Zeile fehlt eine andere Größe. Gefragt wird
// abwechselnd nach einer der parallelen Seiten und nach der Höhe.
const T3_KANDIDATEN = (() => {
  const liste = [];
  for (const a of [6, 8, 10, 12, 14, 15, 16, 18, 20, 24, 27]) {
    for (const c of [3, 4, 5, 6, 7, 8, 9, 10, 12]) {
      if (c >= a) continue;
      for (const h of [2, 3, 4, 5, 6, 8, 9, 10, 12]) {
        const flaecheCm2 = ((a + c) * h) / 2;
        if (!glatt(flaecheCm2, 2)) continue;
        for (const gesucht of ["a", "c", "h"]) liste.push({ a, c, h, flaecheCm2, gesucht });
      }
    }
  }
  return liste;
})();

function generateT3() {
  const k = ohneKollision(T3_KANDIDATEN, (v) => {
    const soll = v.gesucht === "a" ? v.a : v.gesucht === "c" ? v.c : v.h;
    const summe = v.a + v.c;
    // Der klassische Fehler: beim Umstellen das Verdoppeln vergessen.
    const ohneVerdoppeln = v.gesucht === "h"
      ? v.flaecheCm2 / summe
      : v.flaecheCm2 / v.h - (v.gesucht === "a" ? v.c : v.a);
    // Nur die WIRKLICH gegebenen Größen stehen in der Liste. 2 · A : (a + c) ist die Höhe
    // selbst und dürfte hier nicht noch einmal auftauchen — sonst fiele jeder Kandidat durch.
    const gegeben = v.gesucht === "h" ? [v.a, v.c] : [v.h, v.gesucht === "a" ? v.c : v.a];
    return [soll, ...gegeben, ohneVerdoppeln, summe, 2 * soll];
  });
  const { a, c, h, flaecheCm2, gesucht } = k;
  const summe = a + c;
  const soll = gesucht === "a" ? a : gesucht === "c" ? c : h;
  const bekannt = gesucht === "a"
    ? `c = ${num(c)} cm</strong> und die Höhe <strong>h = ${num(h)} cm`
    : gesucht === "c"
      ? `a = ${num(a)} cm</strong> und die Höhe <strong>h = ${num(h)} cm`
      : `a = ${num(a)} cm</strong> und <strong>c = ${num(c)} cm`;
  const frage = gesucht === "a" ? "die Seite a" : gesucht === "c" ? "die Seite c" : "die Höhe h";
  // Der klassische Fehler: das Halbieren beim Umstellen vergessen.
  const ohneVerdoppeln = gesucht === "h" ? flaecheCm2 / summe : flaecheCm2 / h - (gesucht === "a" ? c : a);
  return {
    promptHtml:
      `Ein Trapez hat den Flächeninhalt <strong>A = ${num(flaecheCm2)} cm²</strong>. ` +
      `Bekannt sind <strong>${bekannt}</strong>.<br>` +
      `<strong>Wie groß ist ${frage}?</strong> Antworte in cm.` +
      `<span class="progress-note">Stelle A = ½ · (a + c) · h Schritt für Schritt um. Nur die Maßzahl.</span>`,
    correct: soll,
    tolerance: 0.001,
    placeholder: frage.split(" ")[1] + " in cm",
    hinweis: (roh, val) => {
      if (trifft(val, ohneVerdoppeln))
        return `Das Verdoppeln fehlt. Multipliziere die Gleichung zuerst mit 2: aus A = ½ · (a + c) · h wird <strong>2 · A = (a + c) · h</strong>.`;
      if (gesucht !== "h" && trifft(val, summe))
        return `${num(summe)} cm ist die <strong>Summe</strong> a + c. Davon muss die bekannte Seite noch abgezogen werden.`;
      if (gesucht === "a" && trifft(val, c)) return `Das ist die gegebene Seite c.`;
      if (gesucht === "c" && trifft(val, a)) return `Das ist die gegebene Seite a.`;
      if (trifft(val, h) && gesucht !== "h") return `Das ist die gegebene Höhe.`;
      if (trifft(val, 2 * soll)) return `Einmal zu oft verdoppelt — prüfe mit der Probe nach.`;
      return gesucht === "h"
        ? `2 · A = (a + c) · h, also h = 2 · A : (a + c).`
        : `2 · A = (a + c) · h, also a + c = 2 · A : h. Davon die bekannte Seite abziehen.`;
    },
    musterloesungHtml:
      `<strong>1. Formel:</strong> A = ½ · (a + c) · h&nbsp;&nbsp;|&nbsp; · 2<br>` +
      `<strong>2. Verdoppeln:</strong> 2 · A = (a + c) · h, also ${num(2 * flaecheCm2)} cm² = (a + c) · h<br>` +
      (gesucht === "h"
        ? `<strong>3. Summe einsetzen:</strong> a + c = ${num(a)} cm + ${num(c)} cm = ${num(summe)} cm<br>` +
          `<strong>4. Auflösen:</strong> h = ${num(2 * flaecheCm2)} cm² : ${num(summe)} cm = <strong>${num(h)} cm</strong><br>`
        : `<strong>3. Durch h teilen:</strong> a + c = ${num(2 * flaecheCm2)} cm² : ${num(h)} cm = ${num(summe)} cm<br>` +
          `<strong>4. Bekannte Seite abziehen:</strong> ${gesucht === "a" ? "a" : "c"} = ${num(summe)} cm − ${num(gesucht === "a" ? c : a)} cm = <strong>${num(soll)} cm</strong><br>`) +
      `<em>Probe:</em> ½ · (${num(a)} cm + ${num(c)} cm) · ${num(h)} cm = ½ · ${num(summe)} cm · ${num(h)} cm = ${num(flaecheCm2)} cm² ✓`,
  };
}

// ---------- komplex: zerlegen statt Formel ----------
//
// Dasselbe Trapez zweimal: einmal zerlegt in Rechteck und Dreieck, einmal mit der Formel.
// Dass beide Wege dieselbe Zahl liefern, ist keine Selbstverständlichkeit — es ist der
// Grund, warum die Formel überhaupt gilt.
const T4_KANDIDATEN = (() => {
  const liste = [];
  for (const c of [3, 4, 5, 6, 7, 8, 9, 10]) {
    for (const ueberhang of [2, 3, 4, 5, 6, 8]) {
      for (const h of [2, 3, 4, 5, 6, 8]) {
        const a = c + ueberhang;
        const rechteck = c * h;
        const dreieck = (ueberhang * h) / 2;
        if (!glatt(dreieck, 2)) continue;
        if (Math.abs(rechteck - dreieck) < 1e-9) continue;   // sonst wären beide Felder gleich
        liste.push({ a, c, h, ueberhang, rechteck, dreieck, gesamt: rechteck + dreieck });
      }
    }
  }
  return liste;
})();

function generateT4() {
  const k = ohneKollision(T4_KANDIDATEN, (v) => [
    v.rechteck, v.dreieck, v.gesamt, v.ueberhang * v.h, v.a * v.h, v.a, v.c, v.h, v.ueberhang,
  ]);
  const { a, c, h, ueberhang, rechteck, dreieck, gesamt } = k;
  return {
    promptHtml:
      `Ein rechtwinkliges Trapez hat die parallelen Seiten <strong>a = ${num(a)} cm</strong> (unten) und ` +
      `<strong>c = ${num(c)} cm</strong> (oben) und die Höhe <strong>h = ${num(h)} cm</strong>. ` +
      `Der linke Schenkel steht senkrecht auf beiden.<br>` +
      `Zerlege es durch einen senkrechten Schnitt in ein <strong>Rechteck</strong> und ein <strong>Dreieck</strong> ` +
      `und berechne beide Teile einzeln.` +
      `<span class="progress-note">Alle Felder in cm². Zum Schluss prüfst du dein Ergebnis mit der Trapezformel nach.</span>`,
    felder: [
      {
        name: "Fläche des Rechtecks", soll: rechteck, einheit: "cm²", toleranz: 0.001, platzhalter: "A₁",
        hinweis: (roh, val) => {
          if (trifft(val, a * h)) return `Das Rechteck ist nur so breit wie die <strong>kürzere</strong> parallele Seite c = ${num(c)} cm — der Rest gehört zum Dreieck.`;
          if (trifft(val, ueberhang * h)) return `${num(ueberhang)} cm ist der Überhang unten, aus dem das Dreieck entsteht. Das Rechteck ist ${num(c)} cm breit.`;
          if (trifft(val, dreieck)) return `Das ist die Dreiecksfläche.`;
          return `Das Rechteck hat die Breite c = ${num(c)} cm und die Höhe h = ${num(h)} cm.`;
        },
      },
      {
        name: "Fläche des Dreiecks", soll: dreieck, einheit: "cm²", toleranz: 0.001, platzhalter: "A₂",
        hinweis: (roh, val) => {
          if (trifft(val, ueberhang * h)) return `Das Halbieren fehlt: A = ½ · g · h.`;
          if (trifft(val, rechteck)) return `Das ist die Rechteckfläche.`;
          if (trifft(val, (a * h) / 2)) return `Die Grundseite des Dreiecks ist nicht a, sondern nur der <strong>Überhang</strong> a − c = ${num(a)} cm − ${num(c)} cm = ${num(ueberhang)} cm.`;
          return `Die Grundseite des Dreiecks ist a − c = ${num(ueberhang)} cm, seine Höhe ist ebenfalls h = ${num(h)} cm.`;
        },
      },
      {
        name: "Fläche des ganzen Trapezes", soll: gesamt, einheit: "cm²", toleranz: 0.001, platzhalter: "A",
        hinweis: (roh, val) => {
          if (trifft(val, rechteck - dreieck) || trifft(val, dreieck - rechteck)) return `Die beiden Teile liegen <strong>nebeneinander</strong> — sie werden addiert.`;
          if (trifft(val, a * h)) return `${num(a)} · ${num(h)} wäre das ganze umschließende Rechteck; oben rechts fehlt aber ein Stück.`;
          return `A = Rechteck + Dreieck.`;
        },
      },
    ],
    tipps: [
      "Zeichne das Trapez und schneide es senkrecht dort durch, wo die obere Seite c endet. Links entsteht ein Rechteck, rechts ein Dreieck.",
      `Das Rechteck ist so breit wie die obere Seite: ${num(c)} cm. Für das Dreieck bleibt unten der Rest übrig: a − c = ${num(a)} cm − ${num(c)} cm = ${num(ueberhang)} cm.`,
      `Beide Teile haben dieselbe Höhe h = ${num(h)} cm — der Schnitt verläuft ja senkrecht.`,
    ],
    musterloesungHtml:
      `<strong>1. Zerlegen:</strong> Der senkrechte Schnitt am Ende der oberen Seite teilt das Trapez in ein Rechteck der Breite c = ${num(c)} cm und ein Dreieck der Grundseite a − c = ${num(ueberhang)} cm. Beide sind h = ${num(h)} cm hoch.<br>` +
      `<strong>2. Rechteck:</strong> A₁ = ${num(c)} cm · ${num(h)} cm = <strong>${num(rechteck)} cm²</strong><br>` +
      `<strong>3. Dreieck:</strong> A₂ = ½ · ${num(ueberhang)} cm · ${num(h)} cm = <strong>${num(dreieck)} cm²</strong><br>` +
      `<strong>4. Zusammen:</strong> A = ${num(rechteck)} cm² + ${num(dreieck)} cm² = <strong>${num(gesamt)} cm²</strong><br>` +
      `<em>Probe mit der Trapezformel:</em> ½ · (${num(a)} + ${num(c)}) · ${num(h)} = ½ · ${num(a + c)} · ${num(h)} = ${num(((a + c) * h) / 2)} cm² ✓<br>` +
      `<span class="progress-note">Beide Wege führen zum selben Ergebnis — und das ist kein Zufall: Genau so lässt sich die Trapezformel auch herleiten. ` +
      `c · h + ½ · (a − c) · h = ½ · (2c + a − c) · h = ½ · (a + c) · h.</span>`,
  };
}

// ================= Die Liste für die Werkbank =================

export const AUFGABEN = [
  { schwierigkeit: "einfach", titel: "Parallelogramm — Flächeninhalt ablesen", generate: generateP1 },
  { schwierigkeit: "einfach", titel: "Dreieck — Flächeninhalt ablesen", generate: generateD1 },
  { schwierigkeit: "einfach", titel: "Trapez — Flächeninhalt ablesen", generate: generateT1 },

  { schwierigkeit: "mittel", titel: "Parallelogramm — mit Einheiten", generate: generateP2 },
  { schwierigkeit: "mittel", titel: "Dreieck — mit Einheiten", generate: generateD2 },
  { schwierigkeit: "mittel", titel: "Trapez — mit Einheiten", generate: generateT2 },

  { schwierigkeit: "schwierig", titel: "Parallelogramm — die fehlende Größe", generate: generateP3 },
  { schwierigkeit: "schwierig", titel: "Dreieck — die fehlende Größe", generate: generateD3 },
  { schwierigkeit: "schwierig", titel: "Trapez — die fehlende Größe", generate: generateT3 },

  { schwierigkeit: "komplex", titel: "Parallelogramm — zwei Seiten, zwei Höhen", generate: generateP4 },
  { schwierigkeit: "komplex", titel: "Dreieck — ein Viereck zerlegen", generate: generateD4 },
  { schwierigkeit: "komplex", titel: "Trapez — zerlegen statt Formel", generate: generateT4 },
];
