// Die zwölf Übungsaufgaben zu „Zusammengesetzte Figuren“ — drei je Schwierigkeitsstufe:
//   einfach   — eine Größe aus einer beschrifteten Zeichnung: addieren, Rand abschreiten, abziehen,
//   mittel    — Flächeninhalt UND Umfang, mit Dreieck, Kreisausschnitten oder Ausschnitten,
//   schwierig — Trapez mit Halbkreis, die Umkehrung (mit Probe), Radien erschließen,
//   komplex   — Sachaufgaben, in denen aus Flächeninhalt und Umfang weitergerechnet wird.
//
// Jede Figur wird in Zentimetern beschrieben und maßstäblich gezeichnet. Ihr Rand ist EIN
// geschlossener Linienzug (Bögen fein abgetastet): Die Prüfung liest ihn aus dem SVG zurück, misst
// Flächeninhalt und Umfang mit der Gaußschen Trapezformel und der Sehnensumme nach und vergleicht
// beides mit dem, was sich aus den angeschriebenen Maßen ergibt. Eine Figur, die 5 cm zeichnet und
// 6 cm meint, fiele so auf.
//
// Klasse 8 kennt den Satz des Pythagoras noch nicht. Schräge Seiten stehen deshalb als „gemessen“
// in der Aufgabe — und sind trotzdem genau: Die Dreiecke stammen aus pythagoreischen Zahlentripeln
// (3 : 4 : 5 und Verwandte), sodass Zeichnung und Rechnung dieselbe Zahl benutzen.
//
// Kreisteile gehen fast nie glatt auf. Gerechnet wird mit der π-Taste, gerundet auf zwei
// Nachkommastellen; anerkannt wird auch, wer gerundete Teilergebnisse addiert hat (Toleranz 0,03).
// Die Fehlerwerte liegen deshalb mindestens 0,07 auseinander — sonst wäre nicht zu entscheiden,
// welcher Fehler gemacht wurde.
//
// Alle Zahlen kommen aus vorher gefilterten Listen, nie durch Verwerfen und Neuziehen.

"use strict";

// ---------- Zahlen ----------

const ZAHLFORMATE = new Map();
function zahlformat(stellen) {
  let f = ZAHLFORMATE.get(stellen);
  if (!f) ZAHLFORMATE.set(stellen, (f = new Intl.NumberFormat("de-DE", { maximumFractionDigits: stellen })));
  return f;
}
function num(x, digits = 4) {
  const f = Math.pow(10, digits);
  const gerundet = Math.round(x * f) / f;
  return zahlformat(digits).format(gerundet === 0 ? 0 : gerundet);
}
// Auf zwei Nachkommastellen, aber immer mit beiden Stellen: „31,40“ sieht nach Rundung aus,
// „31,4“ nach einem genauen Wert.
const ZWEI = new Intl.NumberFormat("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
function zwei(x) {
  const g = Math.round(x * 100) / 100;
  return ZWEI.format(g === 0 ? 0 : g);
}
function bruch(zaehler, nenner) {
  return `<span class="bruch"><span class="z">${zaehler}</span><span class="n">${nenner}</span></span>`;
}
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const TOL = 0.03;     // auch die Summe gerundeter Teilergebnisse wird anerkannt
const EPS = 0.07;     // Mindestabstand zwischen Lösung und Fehlerwerten: mehr als die doppelte Toleranz
function trifft(val, soll, tol = TOL) {
  return Number.isFinite(val) && Number.isFinite(soll) && Math.abs(val - soll) <= tol + 1e-9;
}
function paarweiseVerschieden(werte, eps) {
  const echt = werte.filter((x) => Number.isFinite(x));
  return echt.every((x, i) => echt.every((y, j) => i === j || Math.abs(x - y) > eps));
}
// Wählt aus einer VORHER gefilterten Liste. Kollidieren müssen die Werte nur innerhalb eines
// Feldes — nur dort entscheidet die Zahl über den Hinweis. `gruppen(k)` liefert je Feld die Lösung
// und ihre Fehlerwerte; `eps` darf je Feld verschieden sein. Bleiben von vielen Kandidaten fast
// keine übrig, steht vermutlich ein Wert doppelt in der Liste.
function ohneFeldKollision(kandidaten, gruppen, eps = EPS) {
  const sauber = kandidaten.filter((k) => gruppen(k).every((g, i) => paarweiseVerschieden(g, Array.isArray(eps) ? eps[i] : eps)));
  if (kandidaten.length > 20 && sauber.length < 2) {
    throw new Error(`Aufgabengenerator: nur ${sauber.length} von ${kandidaten.length} Kandidaten übrig — vermutlich steht ein Wert doppelt in der Liste`);
  }
  if (!sauber.length) throw new Error("Aufgabengenerator ohne gültige Kandidaten");
  return pick(sauber);
}
// Die Kandidatenlisten entstehen beim ersten Würfeln, nicht beim Laden der Seite.
function spaeter(bauen) {
  let liste = null;
  return () => (liste ??= bauen());
}

// Rechnen mit π ≈ 3,14 statt der π-Taste: nur dann ein eigener Fehlerwert, wenn er sich von der
// Lösung deutlich unterscheidet — sonst wird die Eingabe ohnehin anerkannt.
function mitDreiVierzehn(soll, wert314) {
  return Math.abs(wert314 - soll) > EPS ? wert314 : NaN;
}
const HINWEIS_314 = "Du hast mit π ≈ 3,14 gerechnet. Für zwei Nachkommastellen ist das zu ungenau: Nimm die π-Taste und runde erst das Ergebnis.";
const HINWEIS_FAST = "Fast — das sieht nach einem Rundungsfehler aus. Rechne mit der π-Taste weiter und runde erst das Endergebnis.";

// Der Hinweis zu einer Eingabe: erst die vorgesehenen Fehlerwerte in ihrer Reihenfolge, dann „fast
// richtig“ (weniger als ein halbes Prozent daneben), sonst der allgemeine Hinweis. „Fast richtig“
// gibt es nur, wo π im Spiel ist (`fast`) — bei glatten Ergebnissen wäre ein Rundungsfehler die
// falsche Diagnose.
function hinweisAus(soll, falsch, texte, sonst, { tol = TOL, fast = true } = {}) {
  return (roh, val) => {
    for (const [wert, schluessel] of falsch) if (trifft(val, wert, tol)) return texte[schluessel];
    if (fast && Number.isFinite(val) && Math.abs(val - soll) <= Math.max(0.15, Math.abs(soll) * 0.005)) return HINWEIS_FAST;
    return sonst;
  };
}
const werteVon = (soll, falsch) => [soll, ...falsch.map((f) => f[0])];

// ---------- Zeichnungen für die Aufgabentexte ----------

const FEIN = Math.PI / 90;
const P = (x, y) => ({ x, y });
// Punkte eines Bogens um M, Winkel in Grad; g1 < g0 läuft im Uhrzeigersinn.
function bogen(M, r, g0, g1) {
  const a0 = (g0 * Math.PI) / 180, a1 = (g1 * Math.PI) / 180;
  const n = Math.max(2, Math.ceil(Math.abs(a1 - a0) / FEIN));
  const out = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    out.push(P(M.x + r * Math.cos(a), M.y + r * Math.sin(a)));
  }
  return out;
}
const f2 = (x) => x.toFixed(2);

// Eine Figur für den Aufgabentext.
//   rand      geschlossener Linienzug in Zentimetern — der Rand der Figur
//   schnitte  [[p, q, …], …]  gestrichelte Linien: Schnittkanten und weggeschnittene Ecken
//   hilfen    [[p, q, …], …]  blasse Hilfslinien
//   linien    [{ punkte, klasse }]  weitere Linien im Inneren (eine Höhe)
//   masse     [{ name, von, bis, versatz, text, art, bei }]  Maßlinien; versatz in Bildpunkten nach
//             links (in Laufrichtung; negativ: nach rechts). art: "laenge", "hoehe" oder "radius".
//             Ohne Versatz liegt die Linie auf der Strecke selbst (ein Radius, eine Höhe im
//             Inneren); `seite` (1 oder −1) sagt dann, wo die Beschriftung steht
//   winkel    [{ name, M, r, g0, g1, text }]  Winkelbogen mit Beschriftung auf der Winkelhalbierenden
//   texte     [{ p, text, klasse, anker, dx, dy }]
//   platz     Ränder in Bildpunkten für Beschriftungen, die neben der Figur stehen
function figur(art, { rand, schnitte = [], hilfen = [], linien = [], masse = [], winkel = [], texte = [], breite = 330, maxHoehe = 200, platz = {} }) {
  const pl = Object.assign({ links: 24, rechts: 24, oben: 26, unten: 26 }, platz);
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const p of [...rand, ...hilfen.flat()]) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  const spanX = maxX - minX, spanY = maxY - minY;
  const skala = Math.min((breite - pl.links - pl.rechts) / spanX, (maxHoehe - pl.oben - pl.unten) / spanY);
  const hoehe = Math.round(spanY * skala + pl.oben + pl.unten);
  const ox = pl.links + (breite - pl.links - pl.rechts - spanX * skala) / 2 - minX * skala;
  const oy = hoehe - pl.unten + minY * skala;
  const X = (p) => ox + p.x * skala, Y = (p) => oy - p.y * skala;
  const zug = (punkte, zu) => "M " + punkte.map((p) => `${f2(X(p))},${f2(Y(p))}`).join(" L ") + (zu ? " Z" : "");

  let out = `<svg viewBox="0 0 ${breite} ${hoehe}" width="${breite}" height="${hoehe}" class="fl-aufgaben-figur" data-figur="${art}" role="img" aria-label="Zeichnung zur Aufgabe: Die Maße stehen an der Figur.">`;
  for (const h of hilfen) out += `<path d="${zug(h, false)}" class="kr-fig-hilfe"/>`;
  out += `<path d="${zug(rand, true)}" class="fl-fig-flaeche" data-rolle="flaeche"/>`;
  for (const s of schnitte) out += `<path d="${zug(s, false)}" class="zf-fig-schnitt"/>`;
  for (const l of linien) out += `<path d="${zug(l.punkte, false)}" class="${l.klasse}" fill="none"/>`;
  out += `<path d="${zug(rand, true)}" class="fl-fig-kante" data-rolle="rand"/>`;
  for (const w of winkel) {
    out += `<path d="${zug([w.M, ...bogen(w.M, w.r / skala, w.g0, w.g1)], true)}" class="zf-winkel"/>`;
    const m = ((w.g0 + w.g1) / 2) * (Math.PI / 180), ab = (w.r + 15 + (w.ab || 0)) / skala;
    out += `<text x="${f2(X(w.M) + ab * skala * Math.cos(m))}" y="${f2(Y(w.M) - ab * skala * Math.sin(m) + 4.5)}" text-anchor="middle" class="fl-fig-hoehe-text kr-fig-halo" data-mass="${w.name}">${w.text}</text>`;
  }
  for (const ms of masse) {
    const a = P(X(ms.von), Y(ms.von)), c = P(X(ms.bis), Y(ms.bis));
    const len = Math.hypot(c.x - a.x, c.y - a.y);
    // Die Normale nach links in Laufrichtung — in Bildpunkten, wo y nach unten zeigt.
    const nx = (c.y - a.y) / len, ny = -(c.x - a.x) / len;
    const v = ms.versatz || 0;
    const a2 = P(a.x + nx * v, a.y + ny * v), c2 = P(c.x + nx * v, c.y + ny * v);
    const radius = ms.art === "radius";
    const linienKlasse = radius ? "fl-fig-grund" : ms.art === "hoehe" ? "zf-fig-mass-hoehe" : "zf-fig-mass";
    out += `<line x1="${f2(a2.x)}" y1="${f2(a2.y)}" x2="${f2(c2.x)}" y2="${f2(c2.y)}" class="${linienKlasse}" data-rolle="mass" data-mass="${ms.name}"/>`;
    if (!radius && v !== 0) {
      for (const e of [a2, c2]) out += `<line x1="${f2(e.x - nx * 4)}" y1="${f2(e.y - ny * 4)}" x2="${f2(e.x + nx * 4)}" y2="${f2(e.y + ny * 4)}" class="${linienKlasse}"/>`;
    }
    // Die Beschriftung steht auf der Seite, auf die der Versatz zeigt — liegt die Linie auf der
    // Strecke selbst (Radius, Höhe im Inneren), entscheidet `seite`.
    const s = (v !== 0 ? v : ms.seite || 1) < 0 ? -1 : 1;
    const px = nx * s, py = ny * s;
    const bei = ms.bei ?? 0.5;
    const m = P(a2.x + (c2.x - a2.x) * bei, a2.y + (c2.y - a2.y) * bei);
    const anker = Math.abs(px) > 0.4 ? (px > 0 ? "start" : "end") : "middle";
    // Über einer geneigten Linie rückt eine mittig gesetzte Beschriftung weiter hinaus — sonst
    // strichte die Linie ihre Enden durch.
    const steigung = Math.abs(c.y - a.y) / Math.max(1e-9, Math.abs(c.x - a.x));
    const hinaus = 12 + (anker === "middle" ? Math.min(30, (steigung * ms.text.length * 6.2) / 2) : 0);
    const klasse = ms.art === "hoehe" ? "fl-fig-hoehe-text" : "fl-fig-grund-text";
    out += `<text x="${f2(m.x + px * 6)}" y="${f2(m.y + py * hinaus + 4.5)}" text-anchor="${anker}" class="${klasse} kr-fig-halo" data-mass="${ms.name}">${ms.text}</text>`;
  }
  for (const t of texte) {
    out += `<text x="${f2(X(t.p) + (t.dx || 0))}" y="${f2(Y(t.p) + (t.dy || 0))}" text-anchor="${t.anker || "middle"}" class="${t.klasse || "fl-fig-text"}">${t.text}</text>`;
  }
  return out + "</svg>";
}

const HINWEIS_BILD = `<span class="progress-note">Die Maße stehen an der Zeichnung. Rechne mit der π-Taste und runde das Ergebnis auf zwei Nachkommastellen.</span>`;
const HINWEIS_ZWEI = `<span class="progress-note">Die Maße stehen an der Zeichnung. Rechne mit der π-Taste und runde beide Ergebnisse auf zwei Nachkommastellen.</span>`;

// ================= einfach =================

// ---------- E1: Rechteck mit Halbkreis — Flächeninhalt ----------
// Der Halbkreis sitzt rechts (Durchmesser h) oder oben (Durchmesser b).
const E1_KANDIDATEN = spaeter(() => {
  const liste = [];
  for (const lage of ["rechts", "oben"]) {
    for (const b of [3, 4, 5, 6, 7, 8, 9, 10, 12]) {
      for (const h of [2, 3, 4, 5, 6, 8, 10]) {
        // Die Figur soll weder Streifen noch Turm sein — und der Halbkreis kein Punkt.
        if (b / h > 3 || h / b > 2) continue;
        liste.push({ lage, b, h });
      }
    }
  }
  return liste;
});
function e1Werte({ lage, b, h }) {
  const d = lage === "rechts" ? h : b, r = d / 2;
  const rechne = (pi) => b * h + (pi * r * r) / 2;
  const richtig = rechne(Math.PI);
  return {
    d, r, richtig,
    falsch: [
      [b * h + Math.PI * r * r, "ganz"],
      [b * h + (Math.PI * d * d) / 2, "Durchmesser"],
      [b * h, "fehlt"],
      [b * h + Math.PI * r, "Bogen"],
      [mitDreiVierzehn(richtig, rechne(3.14)), "3,14"],
    ],
  };
}
function e1Figur({ lage, b, h }) {
  const rand = lage === "rechts"
    ? [P(0, 0), P(b, 0), ...bogen(P(b, h / 2), h / 2, -90, 90), P(0, h)]
    : [P(0, 0), P(b, 0), ...bogen(P(b / 2, h), b / 2, 0, 180)];
  return figur("rechteck-halbkreis", {
    rand,
    schnitte: [lage === "rechts" ? [P(b, 0), P(b, h)] : [P(0, h), P(b, h)]],
    masse: [
      { name: "b", von: P(0, 0), bis: P(b, 0), versatz: -13, text: `b = ${num(b)} cm` },
      { name: "h", von: P(0, 0), bis: P(0, h), versatz: 13, text: `h = ${num(h)} cm`, art: "hoehe" },
    ],
    platz: { links: 84, unten: 38 },
  });
}
function generateE1() {
  const k = ohneFeldKollision(E1_KANDIDATEN(), (v) => { const w = e1Werte(v); return [werteVon(w.richtig, w.falsch)]; });
  const { lage, b, h } = k;
  const { d, r, richtig, falsch } = e1Werte(k);
  const seite = lage === "rechts" ? "h" : "b";
  const texte = {
    ganz: "Du hast einen ganzen Kreis addiert. An das Rechteck schließt nur ein Halbkreis an: ½ · π · r².",
    Durchmesser: `Du hast mit ${seite} = ${num(d)} cm als Radius gerechnet. Das ist der Durchmesser des Halbkreises — der Radius ist halb so lang.`,
    fehlt: "Das ist nur das Rechteck. Der Halbkreis gehört auch zur Figur.",
    Bogen: "Du hast die Länge des Halbkreisbogens addiert — eine Länge. Zum Flächeninhalt des Rechtecks gehört der Flächeninhalt des Halbkreises: ½ · π · r².",
    "3,14": HINWEIS_314,
  };
  return {
    promptHtml: `<strong>Berechne den Flächeninhalt der Figur.</strong> Sie besteht aus einem Rechteck und einem Halbkreis.` + e1Figur(k) + HINWEIS_BILD,
    correct: richtig,
    tolerance: TOL,
    placeholder: "A in cm²",
    hinweis: hinweisAus(richtig, falsch, texte, `Zerlege in Rechteck und Halbkreis. Der Durchmesser des Halbkreises ist ${seite}.`),
    tipps: [
      "Zerlege die Figur an der gestrichelten Linie: ein Rechteck und ein Halbkreis.",
      `Der Halbkreis sitzt auf der Seite ${seite} = ${num(d)} cm — das ist sein Durchmesser. Der Radius ist r = ${num(r)} cm.`,
      `A = b · h + ½ · π · r² = ${num(b)} · ${num(h)} cm² + ½ · π · ${num(r)}² cm²`,
    ],
    musterloesungHtml:
      `<strong>1. Zerlegen:</strong> Rechteck (${num(b)} cm breit, ${num(h)} cm hoch) und Halbkreis mit dem Durchmesser ${seite} = ${num(d)} cm, also r = ${num(r)} cm<br>` +
      `<strong>2. Rechteck:</strong> A<sub>1</sub> = b · h = ${num(b)} cm · ${num(h)} cm = ${num(b * h)} cm²<br>` +
      `<strong>3. Halbkreis:</strong> A<sub>2</sub> = ½ · π · r² = ½ · π · (${num(r)} cm)² = ${num((r * r) / 2)} · π cm² ≈ ${zwei((Math.PI * r * r) / 2)} cm²<br>` +
      `<strong>4. Addieren:</strong> A = A<sub>1</sub> + A<sub>2</sub> ≈ <strong>${zwei(richtig)} cm²</strong>`,
  };
}

// ---------- E2: Rechteck mit zwei Halbkreisen — Umfang ----------
const E2_KANDIDATEN = spaeter(() => {
  const liste = [];
  for (const l of [3, 4, 5, 6, 7, 8, 9, 10, 12]) {
    for (const d of [2, 3, 4, 5, 6, 7, 8]) {
      if (l / d > 3.5 || d > l) continue;
      liste.push({ l, d });
    }
  }
  return liste;
});
function e2Werte({ l, d }) {
  const rechne = (pi) => 2 * l + pi * d;
  const richtig = rechne(Math.PI);
  return {
    richtig,
    falsch: [
      [richtig + 2 * d, "Schnittkanten"],
      [2 * (l + d), "Rechteck"],
      [2 * l + 2 * Math.PI * d, "Radius"],
      [2 * l + (Math.PI * d) / 2, "einer"],
      [l * d + (Math.PI * d * d) / 4, "Flaeche"],
      [mitDreiVierzehn(richtig, rechne(3.14)), "3,14"],
    ],
  };
}
function e2Figur({ l, d }) {
  const r = d / 2;
  return figur("stadion", {
    rand: [P(0, 0), P(l, 0), ...bogen(P(l, r), r, -90, 90), P(0, d), ...bogen(P(0, r), r, 90, 270)],
    schnitte: [[P(0, 0), P(0, d)], [P(l, 0), P(l, d)]],
    masse: [
      { name: "l", von: P(0, d), bis: P(l, d), versatz: 13, text: `l = ${num(l)} cm` },
      // Der Durchmesser steht innen an der linken Schnittkante.
      { name: "d", von: P(0, 0), bis: P(0, d), versatz: -9, text: `d = ${num(d)} cm`, art: "hoehe" },
    ],
    platz: { oben: 38 },
  });
}
function generateE2() {
  const k = ohneFeldKollision(E2_KANDIDATEN(), (v) => { const w = e2Werte(v); return [werteVon(w.richtig, w.falsch)]; });
  const { l, d } = k;
  const { richtig, falsch } = e2Werte(k);
  const texte = {
    Schnittkanten: "Du hast die beiden gestrichelten Schnittkanten mitgezählt (je d). Sie liegen im Inneren der Figur — zum Rand gehören nur die zwei geraden Kanten und die zwei Halbkreisbögen.",
    Rechteck: "Das ist der Umfang des Rechtecks allein. Seine beiden kurzen Seiten liegen aber innen; an ihrer Stelle stehen am Rand die Halbkreisbögen.",
    Radius: "Du hast d wie einen Radius behandelt. Zwei Halbkreisbögen sind zusammen ein ganzer Kreisumfang: π · d.",
    einer: "Die Figur hat ZWEI Halbkreisbögen — zusammen ein ganzer Kreisumfang π · d.",
    Flaeche: "Das ist der Flächeninhalt der Figur. Gesucht ist der Umfang — die Länge des Randes.",
    "3,14": HINWEIS_314,
  };
  return {
    promptHtml: `<strong>Berechne den Umfang der Figur.</strong> Sie besteht aus einem Rechteck und zwei Halbkreisen.` + e2Figur(k) + HINWEIS_BILD,
    correct: richtig,
    tolerance: TOL,
    placeholder: "U in cm",
    hinweis: hinweisAus(richtig, falsch, texte, "Geh einmal außen herum: zwei gerade Kanten der Länge l und zwei Halbkreisbögen mit dem Durchmesser d."),
    tipps: [
      "Geh einmal außen um die Figur herum. Welche Stücke liegen am Rand — und welche nur im Inneren?",
      "Am Rand liegen zwei gerade Kanten der Länge l und zwei Halbkreisbögen. Die gestrichelten Schnittkanten zählen nicht.",
      `Zwei Halbkreisbögen sind zusammen ein ganzer Kreisumfang: U = 2 · l + π · d = 2 · ${num(l)} cm + π · ${num(d)} cm`,
    ],
    musterloesungHtml:
      `<strong>1. Rand abschreiten:</strong> unten l, rechts ein Halbkreisbogen, oben l, links ein Halbkreisbogen. Die beiden Schnittkanten liegen innen.<br>` +
      `<strong>2. Gerade Kanten:</strong> 2 · l = 2 · ${num(l)} cm = ${num(2 * l)} cm<br>` +
      `<strong>3. Bögen:</strong> Zwei Halbkreisbögen sind ein ganzer Kreisumfang: π · d = π · ${num(d)} cm ≈ ${zwei(Math.PI * d)} cm<br>` +
      `<strong>4. Addieren:</strong> U = 2 · l + π · d ≈ <strong>${zwei(richtig)} cm</strong>`,
  };
}

// ---------- E3: Rechteck mit ausgeschnittenem Viertelkreis — Flächeninhalt ----------
const E3_KANDIDATEN = spaeter(() => {
  const liste = [];
  for (const a of [5, 6, 7, 8, 9, 10, 12]) {
    for (const b of [4, 5, 6, 7, 8, 10]) {
      if (b > a || a / b > 2.5) continue;
      for (const r of [2, 3, 4, 5, 6]) {
        if (r > b - 1) continue;
        liste.push({ a, b, r });
      }
    }
  }
  return liste;
});
function e3Werte({ a, b, r }) {
  const rechne = (pi) => a * b - (pi * r * r) / 4;
  const richtig = rechne(Math.PI);
  return {
    richtig,
    falsch: [
      [a * b + (Math.PI * r * r) / 4, "addiert"],
      [a * b - Math.PI * r * r, "ganz"],
      [a * b - (Math.PI * r * r) / 2, "halb"],
      [a * b, "voll"],
      [(Math.PI * r * r) / 4, "nurAusschnitt"],
      [mitDreiVierzehn(richtig, rechne(3.14)), "3,14"],
    ],
  };
}
function e3Figur({ a, b, r }) {
  return figur("rechteck-viertelausschnitt", {
    // Die Ecke oben rechts fehlt: Der Bogen läuft von (a | b − r) im Uhrzeigersinn nach (a − r | b).
    rand: [P(0, 0), P(a, 0), ...bogen(P(a, b), r, 270, 180), P(0, b)],
    schnitte: [[P(a - r, b), P(a, b), P(a, b - r)]],
    masse: [
      { name: "a", von: P(0, 0), bis: P(a, 0), versatz: -13, text: `a = ${num(a)} cm` },
      { name: "b", von: P(0, 0), bis: P(0, b), versatz: 13, text: `b = ${num(b)} cm`, art: "hoehe" },
      { name: "r", von: P(a - r, b), bis: P(a, b), versatz: 13, text: `r = ${num(r)} cm` },
    ],
    platz: { links: 84, unten: 38, oben: 38 },
  });
}
function generateE3() {
  const k = ohneFeldKollision(E3_KANDIDATEN(), (v) => { const w = e3Werte(v); return [werteVon(w.richtig, w.falsch)]; });
  const { a, b, r } = k;
  const { richtig, falsch } = e3Werte(k);
  const texte = {
    addiert: "Du hast den Viertelkreis addiert. Er ist ausgeschnitten — er fehlt der Figur und wird abgezogen.",
    ganz: "Du hast einen ganzen Kreis abgezogen. Ausgeschnitten ist nur ein Viertelkreis: ¼ · π · r².",
    halb: "Du hast einen Halbkreis abgezogen. An der Ecke liegt ein rechter Winkel — ausgeschnitten ist ein Viertelkreis: ¼ · π · r².",
    voll: "Das ist das volle Rechteck. Die Ecke oben rechts fehlt: Zieh den Viertelkreis noch ab.",
    nurAusschnitt: "Das ist nur das ausgeschnittene Stück. Gesucht ist, was vom Rechteck übrig bleibt.",
    "3,14": HINWEIS_314,
  };
  return {
    promptHtml: `<strong>Berechne den Flächeninhalt der Figur.</strong> Aus einem Rechteck ist an einer Ecke ein Viertelkreis ausgeschnitten.` + e3Figur(k) + HINWEIS_BILD,
    correct: richtig,
    tolerance: TOL,
    placeholder: "A in cm²",
    hinweis: hinweisAus(richtig, falsch, texte, "Volles Rechteck minus Viertelkreis: A = a · b − ¼ · π · r²."),
    tipps: [
      "Ergänze die fehlende Ecke in Gedanken: Dann ist es ein volles Rechteck.",
      "Abgezogen wird das Stück, das fehlt — ein Viertelkreis mit dem Radius r.",
      `A = a · b − ¼ · π · r² = ${num(a)} · ${num(b)} cm² − ¼ · π · ${num(r)}² cm²`,
    ],
    musterloesungHtml:
      `<strong>1. Ergänzen:</strong> Mit der fehlenden Ecke wäre es ein Rechteck: A<sub>voll</sub> = a · b = ${num(a)} cm · ${num(b)} cm = ${num(a * b)} cm²<br>` +
      `<strong>2. Ausschnitt:</strong> ein Viertelkreis mit r = ${num(r)} cm: ¼ · π · r² = ${num((r * r) / 4)} · π cm² ≈ ${zwei((Math.PI * r * r) / 4)} cm²<br>` +
      `<strong>3. Abziehen:</strong> A = ${num(a * b)} cm² − ${num((r * r) / 4)} · π cm² ≈ <strong>${zwei(richtig)} cm²</strong>`,
  };
}

// ================= mittel =================

// Halbe Grundseite, Höhe und schräge Seite eines gleichschenkligen Dreiecks — pythagoreische
// Tripel, damit die „gemessene“ schräge Seite genau stimmt.
const DACH_TRIPEL = [
  [1.5, 2, 2.5], [2, 1.5, 2.5], [3, 4, 5], [4, 3, 5], [4.5, 6, 7.5], [6, 4.5, 7.5],
  [6, 2.5, 6.5], [2.5, 6, 6.5], [6, 8, 10], [8, 6, 10], [4, 7.5, 8.5], [7.5, 4, 8.5],
];

// ---------- M1: Haus — Rechteck mit Dreieck: Flächeninhalt und Umfang ----------
const M1_KANDIDATEN = spaeter(() => {
  const liste = [];
  for (const [halb, k, s] of DACH_TRIPEL) {
    for (const h of [2, 3, 4, 5, 6, 8, 10]) {
      const b = 2 * halb;
      if (h / b > 1.6 || b / h > 4 || k / h > 2.5) continue;
      liste.push({ b, h, k, s });
    }
  }
  return liste;
});
function m1Werte({ b, h, k, s }) {
  const A = b * h + (b * k) / 2, U = b + 2 * h + 2 * s;
  return {
    A, U,
    falschA: [[b * h + b * k, "halbieren"], [b * h + (b * s) / 2, "schraeg"], [b * h, "dach"], [(b * (h + k)) / 2, "allesHalb"]],
    falschU: [[U + 2 * b, "beide"], [U + b, "decke"], [b + 2 * h + 2 * k, "hoehe"], [2 * h + 2 * s, "boden"]],
  };
}
function m1Figur({ b, h, k, s }) {
  return figur("haus", {
    rand: [P(0, 0), P(b, 0), P(b, h), P(b / 2, h + k), P(0, h)],
    schnitte: [[P(0, h), P(b, h)]],
    linien: [{ punkte: [P(b / 2, h), P(b / 2, h + k)], klasse: "zf-fig-mass-hoehe" }],
    masse: [
      { name: "b", von: P(0, 0), bis: P(b, 0), versatz: -13, text: `b = ${num(b)} cm` },
      { name: "h", von: P(0, 0), bis: P(0, h), versatz: 13, text: `h = ${num(h)} cm` },
      // Die Höhe des Dreiecks ist innen als Linie eingezeichnet und rechts außen bemaßt: Im
      // Dreieck selbst läge die Beschriftung bei einem steilen Dach auf der schrägen Seite.
      { name: "k", von: P(b, h), bis: P(b, h + k), versatz: -13, text: `k = ${num(k)} cm`, art: "hoehe" },
      // Die schräge Seite ist links beschriftet, die Höhe rechts von ihrer Linie: Auf derselben Seite
      // lägen beide bei einem flachen Dach aufeinander.
      { name: "s", von: P(0, h), bis: P(b / 2, h + k), versatz: 11, text: `s = ${num(s)} cm`, bei: 0.55 },
    ],
    maxHoehe: 230,
    platz: { links: 84, rechts: 84, unten: 38 },
  });
}
function generateM1() {
  const kand = ohneFeldKollision(M1_KANDIDATEN(), (v) => { const w = m1Werte(v); return [werteVon(w.A, w.falschA), werteVon(w.U, w.falschU)]; }, [0.01, 0.01]);
  const { b, h, k, s } = kand;
  const { A, U, falschA, falschU } = m1Werte(kand);
  return {
    promptHtml:
      `<strong>Berechne Flächeninhalt und Umfang der Figur.</strong> Auf einem Rechteck sitzt ein gleichschenkliges Dreieck. Die schrägen Seiten s sind gemessen.` +
      m1Figur(kand) + `<span class="progress-note">Die Maße stehen an der Zeichnung. k ist die Höhe des Dreiecks.</span>`,
    felder: [
      {
        name: "Flächeninhalt A", soll: A, einheit: "cm²", toleranz: 0.005, platzhalter: "A",
        hinweis: hinweisAus(A, falschA, {
          halbieren: "Beim Dreieck fehlt das Halbieren: ½ · b · k. b · k wäre das Rechteck um das Dach herum.",
          schraeg: "s ist die schräge Seite — sie steht nicht senkrecht auf der Grundseite. Die Höhe des Dreiecks ist k.",
          dach: "Das ist nur das Rechteck. Das Dreieck darüber gehört auch zur Figur.",
          allesHalb: "Du hast die ganze Figur halbiert. Das ½ gehört nur zum Dreieck: b · h + ½ · b · k.",
        }, "Rechteck plus Dreieck: A = b · h + ½ · b · k.", { tol: 0.005, fast: false }),
      },
      {
        name: "Umfang U", soll: U, einheit: "cm", toleranz: 0.005, platzhalter: "U",
        hinweis: hinweisAus(U, falschU, {
          beide: "Das ist die Summe der Umfänge von Rechteck und Dreieck. Die gestrichelte Schnittkante steckt darin zweimal — sie liegt innen und zählt gar nicht.",
          decke: "Du hast die gestrichelte Schnittkante mitgezählt. Sie liegt im Inneren: Dort sitzt das Dreieck auf dem Rechteck.",
          hoehe: "k ist die Höhe des Dreiecks — sie liegt im Inneren. Am Rand liegen die schrägen Seiten s.",
          boden: "Die untere Seite b gehört auch zum Rand.",
        }, "Einmal außen herum: unten b, rechts h, zwei schräge Seiten s, links h.", { tol: 0.005, fast: false }),
      },
    ],
    tipps: [
      "Zerlege an der gestrichelten Linie: unten ein Rechteck, oben ein Dreieck mit der Grundseite b und der Höhe k.",
      `Flächeninhalt: A = b · h + ½ · b · k = ${num(b)} · ${num(h)} cm² + ½ · ${num(b)} · ${num(k)} cm²`,
      "Umfang: Geh außen herum. Die gestrichelte Linie liegt innen, die Höhe k auch — am Rand liegen b, zweimal h und zweimal s.",
    ],
    musterloesungHtml:
      `<strong>1. Rechteck:</strong> A<sub>1</sub> = b · h = ${num(b)} cm · ${num(h)} cm = ${num(b * h)} cm²<br>` +
      `<strong>2. Dreieck:</strong> A<sub>2</sub> = ½ · b · k = ½ · ${num(b)} cm · ${num(k)} cm = ${num((b * k) / 2)} cm²<br>` +
      `<strong>3. Flächeninhalt:</strong> A = A<sub>1</sub> + A<sub>2</sub> = <strong>${num(A)} cm²</strong><br>` +
      `<strong>4. Umfang:</strong> U = b + h + s + s + h = ${num(b)} cm + 2 · ${num(h)} cm + 2 · ${num(s)} cm = <strong>${num(U)} cm</strong><br>` +
      `<em>Die Schnittkante zwischen Rechteck und Dreieck und die Höhe k liegen innen — sie gehören nicht zum Rand.</em>`,
  };
}

// ---------- M2: zwei Kreisausschnitte — Flächeninhalt und Umfang ----------
const M2_KANDIDATEN = spaeter(() => {
  const liste = [];
  for (const r of [2, 3, 4, 5, 6, 8]) {
    for (const alpha of [30, 40, 45, 50, 60, 70, 80]) {
      for (const beta of [30, 40, 45, 50, 60, 70, 80, 90]) {
        if (alpha === beta || alpha + beta > 150) continue;
        liste.push({ r, alpha, beta });
      }
    }
  }
  return liste;
});
function m2Werte({ r, alpha, beta }) {
  const k = (alpha + beta) / 360;
  const rechne = (pi) => ({ A: k * pi * r * r, bog: k * 2 * pi * r });
  const { A, bog } = rechne(Math.PI), U = bog + 4 * r;
  const p = rechne(3.14);
  return {
    A, U, bog,
    falschA: [
      [bog, "bogen"],
      [((180 - alpha - beta) / 360) * Math.PI * r * r, "luecke"],
      [(Math.PI * r * r) / 2, "halbkreis"],
      [k * Math.PI * r, "quadrat"],
      [mitDreiVierzehn(A, p.A), "3,14"],
    ],
    falschU: [
      [bog, "radien"],
      [bog + 2 * r, "zwei"],
      [Math.PI * r + 2 * r, "halbkreis"],
      [mitDreiVierzehn(U, p.bog + 4 * r), "3,14"],
    ],
  };
}
function m2Figur({ r, alpha, beta }) {
  const M = P(0, 0);
  return figur("zwei-ausschnitte", {
    // Beide Ausschnitte in einem Zug: von M über den rechten Ausschnitt zurück nach M und weiter
    // über den linken. So ist der Zug der ganze Rand beider Ausschnitte.
    rand: [M, ...bogen(M, r, 0, beta), M, ...bogen(M, r, 180 - alpha, 180)],
    hilfen: [bogen(M, r, 0, 180), [P(-r, 0), P(r, 0)]],
    masse: [{ name: "r", von: M, bis: P(r, 0), versatz: 0, seite: -1, art: "radius", text: `r = ${num(r)} cm`, bei: 0.6 }],
    winkel: [
      // Die Beschriftungen stehen ein gutes Stück außerhalb der Winkelbögen, mitten im Ausschnitt:
      // Dicht am Mittelpunkt lägen sie auf den Bögen und aufeinander.
      { name: "beta", M, r: 22, g0: 0, g1: beta, text: `β = ${beta}°`, ab: 24 },
      { name: "alpha", M, r: 22, g0: 180 - alpha, g1: 180, text: `α = ${alpha}°`, ab: 24 },
    ],
    texte: [{ p: M, text: "M", dy: 16 }],
    breite: 340, maxHoehe: 215,
    platz: { unten: 30 },
  });
}
function generateM2() {
  const kand = ohneFeldKollision(M2_KANDIDATEN(), (v) => { const w = m2Werte(v); return [werteVon(w.A, w.falschA), werteVon(w.U, w.falschU)]; });
  const { r, alpha, beta } = kand;
  const { A, U, bog, falschA, falschU } = m2Werte(kand);
  const summe = alpha + beta;
  return {
    promptHtml:
      `<strong>Berechne Flächeninhalt und Umfang der Figur aus zwei Kreisausschnitten.</strong> Beide haben denselben Mittelpunkt M und denselben Radius. Zum Umfang gehört der ganze Rand beider Ausschnitte.` +
      m2Figur(kand) + HINWEIS_ZWEI,
    felder: [
      {
        name: "Flächeninhalt A", soll: A, einheit: "cm²", toleranz: TOL, platzhalter: "A",
        hinweis: hinweisAus(A, falschA, {
          bogen: "Das ist die Länge der beiden Bögen zusammen — eine Länge. Für den Flächeninhalt: Anteil mal π · r².",
          luecke: "Das ist die Lücke zwischen den Ausschnitten. Gefragt sind die beiden gefärbten Ausschnitte: Ihr Winkel ist zusammen α + β.",
          halbkreis: "Das ist der ganze Halbkreis. Zwischen den Ausschnitten bleibt aber eine Lücke: Zusammen haben sie nur den Winkel α + β.",
          quadrat: "Du hast das Quadrieren vergessen: π · r², nicht π · r.",
          "3,14": HINWEIS_314,
        }, "Beide Ausschnitte zusammen sind der Anteil (α + β) : 360° des ganzen Kreises."),
      },
      {
        name: "Umfang U", soll: U, einheit: "cm", toleranz: TOL, platzhalter: "U",
        hinweis: hinweisAus(U, falschU, {
          radien: "Das sind nur die beiden Bögen. Jeder Ausschnitt hat außerdem zwei gerade Kanten — seine Radien.",
          zwei: "Jeder der beiden Ausschnitte hat ZWEI Radien am Rand: zusammen 4 · r.",
          halbkreis: "Das ist der Rand des ganzen Halbkreises. Die Figur besteht nur aus den beiden Ausschnitten — mit vier Radien und zwei kürzeren Bögen.",
          "3,14": HINWEIS_314,
        }, "Zwei Bögen und vier Radien: U = (α + β) : 360° · 2 · π · r + 4 · r."),
      },
    ],
    tipps: [
      "Beide Ausschnitte haben denselben Radius. Du darfst ihre Winkel zusammenfassen: α + β.",
      `Flächeninhalt: A = ${bruch("α + β", "360°")} · π · r² = ${bruch(`${summe}°`, "360°")} · π · ${num(r)}² cm²`,
      "Umfang: Jeder Ausschnitt ist von zwei Radien und einem Bogen begrenzt. Zusammen also vier Radien und beide Bögen.",
    ],
    musterloesungHtml:
      `<strong>1. Winkel zusammenfassen:</strong> α + β = ${alpha}° + ${beta}° = ${summe}°<br>` +
      `<strong>2. Flächeninhalt:</strong> A = ${bruch(`${summe}°`, "360°")} · π · (${num(r)} cm)² ≈ <strong>${zwei(A)} cm²</strong><br>` +
      `<strong>3. Bögen:</strong> ${bruch(`${summe}°`, "360°")} · 2 · π · ${num(r)} cm ≈ ${zwei(bog)} cm<br>` +
      `<strong>4. Umfang:</strong> Dazu kommen vier Radien: U ≈ ${zwei(bog)} cm + 4 · ${num(r)} cm ≈ <strong>${zwei(U)} cm</strong>`,
  };
}

// ---------- M3: Rechteck mit zwei Viertelkreis-Ausschnitten — Flächeninhalt und Umfang ----------
const M3_KANDIDATEN = spaeter(() => {
  const liste = [];
  for (const a of [6, 7, 8, 9, 10, 12]) {
    for (const h of [4, 5, 6, 7, 8]) {
      if (h > a) continue;
      for (const r of [1, 1.5, 2, 2.5, 3]) {
        if (2 * r > a - 2 || r > h - 1.5) continue;
        liste.push({ a, h, r });
      }
    }
  }
  return liste;
});
function m3Werte({ a, h, r }) {
  const rechne = (pi) => ({ A: a * h - (pi * r * r) / 2, U: 2 * a + 2 * h - 4 * r + pi * r });
  const { A, U } = rechne(Math.PI), p = rechne(3.14);
  return {
    A, U,
    falschA: [
      [a * h + (Math.PI * r * r) / 2, "addiert"],
      [a * h - (Math.PI * r * r) / 4, "einer"],
      [a * h - Math.PI * r * r, "ganz"],
      [a * h, "voll"],
      [mitDreiVierzehn(A, p.A), "3,14"],
    ],
    falschU: [
      [2 * (a + h), "rechteck"],
      [2 * a + 2 * h - 4 * r, "boegen"],
      [2 * a + 2 * h - 4 * r - Math.PI * r, "abgezogen"],
      [2 * a + 2 * h + Math.PI * r, "gerade"],
      [mitDreiVierzehn(U, p.U), "3,14"],
    ],
  };
}
function m3Figur({ a, h, r }) {
  return figur("zwei-viertelausschnitte", {
    rand: [P(r, 0), P(a - r, 0), ...bogen(P(a, 0), r, 180, 90), P(a, h), P(0, h), ...bogen(P(0, 0), r, 90, 0)],
    schnitte: [[P(r, 0), P(0, 0), P(0, r)], [P(a - r, 0), P(a, 0), P(a, r)]],
    masse: [
      { name: "a", von: P(0, h), bis: P(a, h), versatz: 13, text: `a = ${num(a)} cm` },
      { name: "h", von: P(a, 0), bis: P(a, h), versatz: -13, text: `h = ${num(h)} cm`, art: "hoehe" },
      { name: "r", von: P(0, 0), bis: P(r, 0), versatz: -13, text: `r = ${num(r)} cm` },
    ],
    platz: { rechts: 84, oben: 38, unten: 38 },
  });
}
function generateM3() {
  const kand = ohneFeldKollision(M3_KANDIDATEN(), (v) => { const w = m3Werte(v); return [werteVon(w.A, w.falschA), werteVon(w.U, w.falschU)]; });
  const { a, h, r } = kand;
  const { A, U, falschA, falschU } = m3Werte(kand);
  return {
    promptHtml:
      `<strong>Berechne Flächeninhalt und Umfang der Figur.</strong> Aus einem Rechteck sind unten an beiden Ecken Viertelkreise mit dem Radius r ausgeschnitten.` +
      m3Figur(kand) + HINWEIS_ZWEI,
    felder: [
      {
        name: "Flächeninhalt A", soll: A, einheit: "cm²", toleranz: TOL, platzhalter: "A",
        hinweis: hinweisAus(A, falschA, {
          addiert: "Du hast die Viertelkreise addiert. Sie sind ausgeschnitten — sie fehlen der Figur und werden abgezogen.",
          einer: "Es sind ZWEI Viertelkreise ausgeschnitten — zusammen ein Halbkreis: ½ · π · r².",
          ganz: "Zwei Viertelkreise sind zusammen ein Halbkreis, kein ganzer Kreis: ½ · π · r².",
          voll: "Das ist das volle Rechteck. Die beiden Ecken unten fehlen: Zieh die Viertelkreise noch ab.",
          "3,14": HINWEIS_314,
        }, "Volles Rechteck minus zwei Viertelkreise: A = a · h − ½ · π · r²."),
      },
      {
        name: "Umfang U", soll: U, einheit: "cm", toleranz: TOL, platzhalter: "U",
        hinweis: hinweisAus(U, falschU, {
          rechteck: "Das ist der Umfang des vollen Rechtecks. An den beiden Ecken fehlen je zwei gerade Stücke der Länge r — dafür liegen dort Viertelbögen am Rand.",
          boegen: "Die geraden Stücke stimmen. Es fehlen die beiden Viertelbögen — zusammen ein Halbkreisbogen π · r.",
          abgezogen: "Die Bögen gehören zum Rand: Sie kommen dazu. Abgezogen werden nur die vier geraden Stücke, die an den Ecken fehlen.",
          gerade: "Die Bögen sind richtig dazugekommen. An jeder der beiden Ecken fehlen aber zwei gerade Stücke der Länge r — zusammen 4 · r.",
          "3,14": HINWEIS_314,
        }, "Einmal außen herum: oben a, die Seiten je h − r, unten a − 2 · r, dazu zwei Viertelbögen."),
      },
    ],
    tipps: [
      "Flächeninhalt: Ergänze die beiden Ecken zum vollen Rechteck und zieh die zwei Viertelkreise ab — zusammen ein Halbkreis.",
      "Umfang: Geh außen herum. Die Seiten sind nur noch h − r lang, die untere Kante a − 2 · r.",
      `Zwei Viertelbögen sind zusammen ein Halbkreisbogen: π · r = π · ${num(r)} cm.`,
    ],
    musterloesungHtml:
      `<strong>1. Flächeninhalt:</strong> A = a · h − 2 · ¼ · π · r² = ${num(a * h)} cm² − ${num((r * r) / 2)} · π cm² ≈ <strong>${zwei(A)} cm²</strong><br>` +
      `<strong>2. Gerade Randstücke:</strong> oben a = ${num(a)} cm, zwei Seiten je h − r = ${num(h - r)} cm, unten a − 2 · r = ${num(a - 2 * r)} cm — zusammen ${num(2 * a + 2 * h - 4 * r)} cm<br>` +
      `<strong>3. Bögen:</strong> zwei Viertelbögen = ein Halbkreisbogen: π · r = π · ${num(r)} cm ≈ ${zwei(Math.PI * r)} cm<br>` +
      `<strong>4. Umfang:</strong> U ≈ ${num(2 * a + 2 * h - 4 * r)} cm + ${zwei(Math.PI * r)} cm ≈ <strong>${zwei(U)} cm</strong><br>` +
      `<em>Vergleich:</em> Das volle Rechteck hätte den Umfang ${num(2 * (a + h))} cm. Hier wird durch das Ausschneiden auch der Umfang kleiner: Ein Viertelbogen (½ · π · r ≈ 1,57 · r) ist kürzer als die zwei geraden Stücke (zusammen 2 · r), die er ersetzt. Beim Halbkreis-Ausschnitt in Abschnitt 4 war es umgekehrt.`,
  };
}

// ================= schwierig =================

// ---------- S1: Trapez mit Halbkreis — Flächeninhalt und Umfang ----------
// Waagerechter Unterschied der parallelen Seiten, Höhe und schräge Seite: wieder Tripel.
const S1_TRIPEL = [[1.5, 2, 2.5], [3, 4, 5], [4.5, 6, 7.5], [6, 8, 10], [2.5, 6, 6.5], [8, 6, 10], [7.5, 4, 8.5]];
const S1_KANDIDATEN = spaeter(() => {
  const liste = [];
  for (const [e, h, s] of S1_TRIPEL) {
    for (const c of [2, 3, 4, 5, 6, 8]) {
      const a = c + e;
      if (a / h > 3.5 || h / a > 1.3) continue;
      liste.push({ a, c, h, s });
    }
  }
  return liste;
});
function s1Werte({ a, c, h, s }) {
  const R = h / 2;
  const rechne = (pi) => ({ A: ((a + c) * h) / 2 + (pi * R * R) / 2, U: a + c + s + pi * R });
  const { A, U } = rechne(Math.PI), p = rechne(3.14);
  const T = ((a + c) * h) / 2;
  return {
    R, T, A, U,
    falschA: [
      [(a + c) * h + (Math.PI * R * R) / 2, "halbieren"],
      [T + Math.PI * R * R, "ganz"],
      [T + (Math.PI * h * h) / 2, "durchmesser"],
      [((a + c) * s) / 2 + (Math.PI * R * R) / 2, "schraeg"],
      [T, "fehlt"],
      [mitDreiVierzehn(A, p.A), "3,14"],
    ],
    falschU: [
      [U + h, "schnittkante"],
      [a + c + s + 2 * Math.PI * R, "ganz"],
      [a + c + h + Math.PI * R, "hoehe"],
      [a + c + s, "bogen"],
      [mitDreiVierzehn(U, p.U), "3,14"],
    ],
  };
}
function s1Figur({ a, c, h, s }) {
  return figur("trapez-halbkreis", {
    rand: [P(0, 0), P(a, 0), ...bogen(P(a, h / 2), h / 2, -90, 90), P(a - c, h)],
    schnitte: [[P(a, 0), P(a, h)]],
    masse: [
      { name: "a", von: P(0, 0), bis: P(a, 0), versatz: -13, text: `a = ${num(a)} cm` },
      { name: "c", von: P(a - c, h), bis: P(a, h), versatz: 13, text: `c = ${num(c)} cm` },
      // Die Höhe steht innen an der Schnittkante.
      { name: "h", von: P(a, 0), bis: P(a, h), versatz: 9, text: `h = ${num(h)} cm`, art: "hoehe" },
      { name: "s", von: P(0, 0), bis: P(a - c, h), versatz: 11, text: `s = ${num(s)} cm` },
    ],
    breite: 340,
    platz: { links: 78, oben: 38, unten: 38 },
  });
}
function generateS1() {
  const kand = ohneFeldKollision(S1_KANDIDATEN(), (v) => { const w = s1Werte(v); return [werteVon(w.A, w.falschA), werteVon(w.U, w.falschU)]; });
  const { a, c, h, s } = kand;
  const { R, T, A, U, falschA, falschU } = s1Werte(kand);
  return {
    promptHtml:
      `<strong>Berechne Flächeninhalt und Umfang der Figur.</strong> An ein Trapez mit zwei rechten Winkeln schließt rechts ein Halbkreis an. Die schräge Seite s ist gemessen.` +
      s1Figur(kand) + HINWEIS_ZWEI,
    felder: [
      {
        name: "Flächeninhalt A", soll: A, einheit: "cm²", toleranz: TOL, platzhalter: "A",
        hinweis: hinweisAus(A, falschA, {
          halbieren: "Beim Trapez fehlt das Halbieren: ½ · (a + c) · h.",
          ganz: "Du hast einen ganzen Kreis addiert. Rechts sitzt nur ein Halbkreis: ½ · π · r².",
          durchmesser: "h ist der Durchmesser des Halbkreises. In die Formel gehört der Radius r = h : 2.",
          schraeg: "s ist die schräge Seite — sie steht nicht senkrecht auf den parallelen Seiten. Die Höhe des Trapezes ist h.",
          fehlt: "Das ist nur das Trapez. Der Halbkreis gehört auch zur Figur.",
          "3,14": HINWEIS_314,
        }, "Trapez plus Halbkreis: A = ½ · (a + c) · h + ½ · π · r² mit r = h : 2."),
      },
      {
        name: "Umfang U", soll: U, einheit: "cm", toleranz: TOL, platzhalter: "U",
        hinweis: hinweisAus(U, falschU, {
          schnittkante: "Du hast die gestrichelte Schnittkante mitgezählt. Sie liegt im Inneren — dort schließt der Halbkreis an.",
          ganz: "Am Rand liegt nur ein Halbkreisbogen: π · r, nicht 2 · π · r.",
          hoehe: "Links liegt die schräge Seite s am Rand, nicht die Höhe h — die ist rechts die Schnittkante.",
          bogen: "Der Halbkreisbogen fehlt noch: π · r.",
          "3,14": HINWEIS_314,
        }, "Einmal außen herum: unten a, der Halbkreisbogen π · r, oben c, links die schräge Seite s."),
      },
    ],
    tipps: [
      "Zerlege an der gestrichelten Linie: links ein Trapez mit den parallelen Seiten a und c und der Höhe h, rechts ein Halbkreis mit dem Durchmesser h.",
      `Flächeninhalt: A = ½ · (a + c) · h + ½ · π · r² mit r = h : 2 = ${num(R)} cm.`,
      "Umfang: Am Rand liegen a, c, die schräge Seite s und der Halbkreisbogen π · r. Die gestrichelte Seite liegt innen.",
    ],
    musterloesungHtml:
      `<strong>1. Trapez:</strong> A<sub>1</sub> = ½ · (a + c) · h = ½ · (${num(a)} cm + ${num(c)} cm) · ${num(h)} cm = ${num(T)} cm²<br>` +
      `<strong>2. Halbkreis:</strong> r = h : 2 = ${num(R)} cm, A<sub>2</sub> = ½ · π · r² = ${num((R * R) / 2)} · π cm² ≈ ${zwei((Math.PI * R * R) / 2)} cm²<br>` +
      `<strong>3. Flächeninhalt:</strong> A = A<sub>1</sub> + A<sub>2</sub> ≈ <strong>${zwei(A)} cm²</strong><br>` +
      `<strong>4. Umfang:</strong> U = a + c + s + π · r = ${num(a)} cm + ${num(c)} cm + ${num(s)} cm + π · ${num(R)} cm ≈ <strong>${zwei(U)} cm</strong>`,
  };
}

// ---------- S2: rückwärts — die Gerade der Laufbahn ----------
const S2_KANDIDATEN = spaeter(() => {
  const liste = [];
  for (const U of [200, 250, 300, 400]) {
    for (const d of [20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70]) {
      const l = (U - Math.PI * d) / 2;
      // Die Gerade soll deutlich länger sein als die Bahn breit ist, sonst sieht es nicht nach
      // Laufbahn aus — und nicht so lang, dass die Zeichnung zum Strich wird.
      if (l < 1.2 * d || l > 4.5 * d) continue;
      liste.push({ U, d });
    }
  }
  return liste;
});
function s2Werte({ U, d }) {
  const rechne = (pi) => (U - pi * d) / 2;
  const richtig = rechne(Math.PI);
  return {
    richtig,
    falsch: [
      [U - Math.PI * d, "beide"],
      [(U - 2 * Math.PI * d) / 2, "radius"],
      [(U - (Math.PI * d) / 2) / 2, "einBogen"],
      [U / 2 - d, "strecke"],
      [mitDreiVierzehn(richtig, rechne(3.14)), "3,14"],
    ],
  };
}
function s2Figur({ U, d }) {
  const l = (U - Math.PI * d) / 2, r = d / 2;
  return figur("laufbahn", {
    rand: [P(0, 0), P(l, 0), ...bogen(P(l, r), r, -90, 90), P(0, d), ...bogen(P(0, r), r, 90, 270)],
    schnitte: [[P(0, 0), P(0, d)], [P(l, 0), P(l, d)]],
    masse: [
      { name: "l", von: P(0, d), bis: P(l, d), versatz: 13, text: "l = ?" },
      { name: "d", von: P(0, 0), bis: P(0, d), versatz: -9, text: `d = ${num(d)} m`, art: "hoehe" },
    ],
    breite: 340, maxHoehe: 170,
    platz: { oben: 38 },
  });
}
function generateS2() {
  const k = ohneFeldKollision(S2_KANDIDATEN(), (v) => { const w = s2Werte(v); return [werteVon(w.richtig, w.falsch)]; });
  const { U, d } = k;
  const { richtig, falsch } = s2Werte(k);
  const bog = Math.PI * d;
  const rund2 = (x) => Math.round(x * 100) / 100;
  const probe = 2 * rund2(richtig) + rund2(bog);
  const texte = {
    beide: "Das ist die Länge BEIDER Geraden zusammen. Gefragt ist eine — noch halbieren.",
    radius: "Du hast d wie einen Radius behandelt. Die zwei Halbkreisbögen sind zusammen ein Kreisumfang mit dem Durchmesser d: π · d.",
    einBogen: "Die Bahn hat ZWEI Halbkreisbögen — zusammen ein ganzer Kreisumfang π · d.",
    strecke: "Du hast für jede Kurve die Strecke d abgezogen. Die Kurven sind aber Halbkreisbögen — jeder ist ½ · π · d lang.",
    "3,14": HINWEIS_314,
  };
  return {
    promptHtml:
      `Eine Laufbahn besteht aus zwei gleich langen Geraden und zwei Halbkreisbögen mit dem Durchmesser d. Eine Runde am inneren Rand ist <strong>U = ${num(U)} m</strong> lang. ` +
      `<strong>Wie lang ist eine der beiden Geraden?</strong>` + s2Figur(k) +
      `<span class="progress-note">Rechne mit der π-Taste und runde das Ergebnis auf zwei Nachkommastellen. Angabe in m.</span>`,
    correct: richtig,
    tolerance: TOL,
    placeholder: "l in m",
    hinweis: hinweisAus(richtig, falsch, texte, "Stell den Umfang als Formel auf: U = 2 · l + π · d. Dann nach l auflösen."),
    tipps: [
      "Schreib auf, woraus der Rand besteht: zwei Geraden der Länge l und zwei Halbkreisbögen.",
      "Zwei Halbkreisbögen sind ein ganzer Kreisumfang: U = 2 · l + π · d.",
      `Zieh die Bögen vom Umfang ab und halbiere: l = (U − π · d) : 2 = (${num(U)} m − π · ${num(d)} m) : 2`,
    ],
    musterloesungHtml:
      `<strong>1. Formel für den Umfang:</strong> U = 2 · l + π · d<br>` +
      `<strong>2. Die Bögen:</strong> π · d = π · ${num(d)} m ≈ ${zwei(bog)} m<br>` +
      `<strong>3. Auflösen:</strong> 2 · l = U − π · d ≈ ${num(U)} m − ${zwei(bog)} m = ${zwei(U - bog)} m, also l ≈ <strong>${zwei(richtig)} m</strong><br>` +
      `<em>Probe:</em> 2 · ${zwei(richtig)} m + ${zwei(bog)} m = ${zwei(probe)} m` +
      (Math.abs(probe - U) < 0.005 ? " ✓" : ` ≈ ${num(U)} m ✓ (die letzte Stelle weicht nur durch das Runden ab)`),
  };
}

// ---------- S3: Rechteck mit fünf Ausschnitten — Flächeninhalt und Umfang ----------
// Unten zwei Viertelkreise (Radius r), oben zwei kleinere (Radius q = h − r) und dazwischen ein
// Halbkreis (Radius p = a : 2 − q). Angeschrieben sind nur a, h und r.
const S3_KANDIDATEN = spaeter(() => {
  const liste = [];
  for (const a of [8, 9, 10, 12, 14]) {
    for (const h of [4, 5, 6]) {
      for (const r of [2, 2.5, 3, 3.5, 4, 4.5]) {
        const q = h - r, p = a / 2 - q;
        if (q < 1 || p < 1.5 || a - 2 * r < 1) continue;
        // Der Halbkreis oben darf die Viertelkreise unten nicht berühren und nicht bis an den
        // unteren Rand reichen.
        if (Math.hypot(a / 2, h) < p + r + 0.4 || p > h - 0.8) continue;
        // Verschiedene Radien: Sonst fielen Fehlerwerte zusammen, die sie verwechseln.
        if (Math.abs(q - r) < 0.4 || Math.abs(p - r) < 0.4 || Math.abs(p - q) < 0.4) continue;
        liste.push({ a, h, r });
      }
    }
  }
  return liste;
});
function s3Werte({ a, h, r }) {
  const q = h - r, p = a / 2 - q;
  const rechne = (pi) => ({ A: a * h - (pi * (r * r + q * q + p * p)) / 2, U: a - 2 * r + pi * (r + q + p) });
  const { A, U } = rechne(Math.PI), alt = rechne(3.14);
  return {
    q, p, A, U,
    falschA: [
      [a * h - (Math.PI * (r * r + q * q)) / 2, "halbkreis"],
      [a * h - (Math.PI * (r * r + q * q)) / 4 - (Math.PI * p * p) / 2, "einzeln"],
      [a * h - Math.PI * (r * r + q * q) - (Math.PI * p * p) / 2, "ganz"],
      [a * h - (Math.PI * r * r) / 2 - (Math.PI * r * r) / 2 - (Math.PI * p * p) / 2, "gleich"],
      [a * h, "voll"],
      [mitDreiVierzehn(A, alt.A), "3,14"],
    ],
    falschU: [
      [Math.PI * (r + q + p), "gerade"],
      [a + Math.PI * (r + q + p), "unten"],
      [2 * (a + h), "rechteck"],
      [a - 2 * r + Math.PI * (r + q), "halbkreis"],
      [mitDreiVierzehn(U, alt.U), "3,14"],
    ],
  };
}
function s3Figur({ a, h, r }) {
  const q = h - r, p = a / 2 - q;
  return figur("fuenf-ausschnitte", {
    rand: [
      P(r, 0), P(a - r, 0),
      ...bogen(P(a, 0), r, 180, 90),      // unten rechts, endet in (a | r)
      ...bogen(P(a, h), q, 270, 180),     // oben rechts, von (a | r) nach (a − q | h)
      ...bogen(P(a / 2, h), p, 360, 180), // der Halbkreis, von (a − q | h) nach (q | h)
      ...bogen(P(0, h), q, 0, -90),       // oben links, von (q | h) nach (0 | r)
      ...bogen(P(0, 0), r, 90, 0),        // unten links, zurück nach (r | 0)
    ],
    schnitte: [[P(0, 0), P(a, 0), P(a, h), P(0, h), P(0, 0)]],
    masse: [
      { name: "a", von: P(0, 0), bis: P(a, 0), versatz: -13, text: `a = ${num(a)} cm` },
      { name: "h", von: P(a, 0), bis: P(a, h), versatz: -13, text: `h = ${num(h)} cm`, art: "hoehe" },
      { name: "r", von: P(0, 0), bis: P(0, r), versatz: 13, text: `r = ${num(r)} cm` },
    ],
    breite: 340,
    platz: { links: 84, rechts: 84, unten: 38 },
  });
}
function generateS3() {
  const kand = ohneFeldKollision(S3_KANDIDATEN(), (v) => { const w = s3Werte(v); return [werteVon(w.A, w.falschA), werteVon(w.U, w.falschU)]; });
  const { a, h, r } = kand;
  const { q, p, A, U, falschA, falschU } = s3Werte(kand);
  return {
    promptHtml:
      `<strong>Berechne Flächeninhalt und Umfang der gefärbten Figur.</strong> Aus einem Rechteck sind fünf Kreisteile ausgeschnitten: unten zwei Viertelkreise mit dem Radius r, oben zwei kleinere Viertelkreise und dazwischen ein Halbkreis. Die Kreisteile stoßen am Rand des Rechtecks aneinander.` +
      s3Figur(kand) + `<span class="progress-note">Nur drei Maße stehen an der Zeichnung — die übrigen Radien erschließt du daraus. Rechne mit der π-Taste und runde beide Ergebnisse auf zwei Nachkommastellen.</span>`,
    felder: [
      {
        name: "Flächeninhalt A", soll: A, einheit: "cm²", toleranz: TOL, platzhalter: "A",
        hinweis: hinweisAus(A, falschA, {
          halbkreis: "Der Halbkreis oben in der Mitte ist noch nicht abgezogen.",
          einzeln: "Von jeder Sorte Viertelkreis gibt es ZWEI — zusammen je ein Halbkreis.",
          ganz: "Zwei Viertelkreise sind zusammen ein Halbkreis, kein ganzer Kreis.",
          gleich: `Die oberen Viertelkreise sind kleiner als die unteren: An der Seite stoßen beide aneinander, also ist ihr Radius h − r = ${num(q)} cm.`,
          voll: "Das ist das volle Rechteck. Die fünf Kreisteile fehlen: Zieh sie ab.",
          "3,14": HINWEIS_314,
        }, "Bestimme zuerst die Radien: oben h − r, in der Mitte (a − 2 · (h − r)) : 2. Dann volles Rechteck minus drei Halbkreisflächen."),
      },
      {
        name: "Umfang U", soll: U, einheit: "cm", toleranz: TOL, platzhalter: "U",
        hinweis: hinweisAus(U, falschU, {
          gerade: "Die Bögen stimmen. Unten bleibt zwischen den Viertelkreisen noch eine gerade Strecke stehen: a − 2 · r.",
          unten: "Unten ist nicht mehr die ganze Seite a da: An jeder Ecke fehlt ein Stück der Länge r.",
          rechteck: "Das ist der Umfang des vollen Rechtecks. Vom Rechteck bleibt am Rand nur die Strecke unten zwischen den Viertelkreisen — alles andere sind Bögen.",
          halbkreis: "Der Bogen des Halbkreises oben in der Mitte fehlt noch.",
          "3,14": HINWEIS_314,
        }, "Am Rand liegen fünf Bögen und unten die gerade Strecke a − 2 · r."),
      },
    ],
    tipps: [
      `An der Seite stoßen der untere und der obere Viertelkreis aneinander: r + q = h. Der obere Radius ist also q = h − r = ${num(q)} cm.`,
      `Oben stoßen die Viertelkreise an den Halbkreis: q + 2 · p + q = a. Sein Radius ist p = (a − 2 · q) : 2 = ${num(p)} cm.`,
      "Flächeninhalt: volles Rechteck minus zwei Viertelkreise (r), zwei Viertelkreise (q) und einen Halbkreis (p) — das sind drei Halbkreisflächen.",
      "Umfang: Die Seiten und die obere Kante des Rechtecks sind ganz weggeschnitten. Am Rand liegen fünf Bögen und unten die Strecke a − 2 · r.",
    ],
    musterloesungHtml:
      `<strong>1. Radien erschließen:</strong> oben q = h − r = ${num(h)} cm − ${num(r)} cm = ${num(q)} cm; in der Mitte p = (a − 2 · q) : 2 = (${num(a)} cm − ${num(2 * q)} cm) : 2 = ${num(p)} cm<br>` +
      `<strong>2. Ausschnitte:</strong> je zwei Viertelkreise sind ein Halbkreis, dazu der Halbkreis in der Mitte: ½ · π · (r² + q² + p²) = ½ · π · (${num(r * r)} + ${num(q * q)} + ${num(p * p)}) cm² = ${num((r * r + q * q + p * p) / 2)} · π cm²<br>` +
      `<strong>3. Flächeninhalt:</strong> A = a · h − ${num((r * r + q * q + p * p) / 2)} · π cm² = ${num(a * h)} cm² − ${zwei((Math.PI * (r * r + q * q + p * p)) / 2)} cm² ≈ <strong>${zwei(A)} cm²</strong><br>` +
      `<strong>4. Bögen:</strong> zwei Viertelbögen (r), zwei Viertelbögen (q) und ein Halbkreisbogen (p): π · r + π · q + π · p = π · ${num(r + q + p)} cm ≈ ${zwei(Math.PI * (r + q + p))} cm<br>` +
      `<strong>5. Umfang:</strong> Dazu die Strecke unten, a − 2 · r = ${num(a - 2 * r)} cm: U ≈ <strong>${zwei(U)} cm</strong>`,
  };
}

// ================= komplex =================

// ---------- K1: der Spielplatz — Fläche, Einfassung und Kosten ----------
const K1_KANDIDATEN = spaeter(() => {
  const liste = [];
  for (const l of [8, 9, 10, 12, 12.5, 15]) {
    for (const b of [4, 5, 6, 8]) {
      if (l / b < 1.4 || l / b > 3.2) continue;
      for (const pA of [24, 30, 36]) for (const pU of [9, 12, 15]) liste.push({ l, b, pA, pU });
    }
  }
  return liste;
});
function k1Werte({ l, b, pA, pU }) {
  const r = b / 2;
  const A = l * b + (Math.PI * r * r) / 2, U = 2 * l + b + Math.PI * r;
  const K = A * pA + U * pU;
  return {
    r, A, U, K,
    falschA: [[l * b + Math.PI * r * r, "ganz"], [l * b + (Math.PI * b * b) / 2, "durchmesser"], [l * b, "fehlt"]],
    falschU: [[U + b, "schnittkante"], [2 * l + b + 2 * Math.PI * r, "ganz"], [2 * (l + b), "rechteck"], [2 * l + Math.PI * r, "seite"]],
    falschK: [[A * pU + U * pA, "vertauscht"], [A * pA, "nurFlaeche"], [U * pU, "nurRand"], [(A + U) * (pA + pU), "alles"]],
  };
}
function k1Figur({ l, b }) {
  return figur("spielplatz", {
    rand: [P(0, 0), P(l, 0), ...bogen(P(l, b / 2), b / 2, -90, 90), P(0, b)],
    schnitte: [[P(l, 0), P(l, b)]],
    masse: [
      { name: "l", von: P(0, 0), bis: P(l, 0), versatz: -13, text: `l = ${num(l)} m` },
      { name: "b", von: P(0, 0), bis: P(0, b), versatz: 13, text: `b = ${num(b)} m`, art: "hoehe" },
    ],
    breite: 340, maxHoehe: 180,
    platz: { links: 84, unten: 38 },
  });
}
function generateK1() {
  // Die Kosten sind auf ganze Euro gerundet; ihre Fehlerwerte müssen entsprechend weit auseinanderliegen.
  const kand = ohneFeldKollision(K1_KANDIDATEN(), (v) => { const w = k1Werte(v); return [werteVon(w.A, w.falschA), werteVon(w.U, w.falschU), werteVon(w.K, w.falschK)]; }, [EPS, EPS, 2.5]);
  const { l, b, pA, pU } = kand;
  const { r, A, U, K, falschA, falschU, falschK } = k1Werte(kand);
  return {
    promptHtml:
      `Die Sandfläche eines Spielplatzes hat die Form eines Rechtecks mit einem Halbkreis an einer Schmalseite. Sie bekommt einen Fallschutzbelag für <strong>${num(pA)} € je m²</strong> und rundherum eine Einfassung für <strong>${num(pU)} € je m</strong>. ` +
      `<strong>Berechne die Fläche, die Länge der Einfassung und die Gesamtkosten.</strong>` + k1Figur(kand) +
      `<span class="progress-note">Fläche und Länge auf zwei Nachkommastellen, die Kosten auf ganze Euro gerundet.</span>`,
    felder: [
      {
        name: "Fläche A", soll: A, einheit: "m²", toleranz: TOL, platzhalter: "A",
        hinweis: hinweisAus(A, falschA, {
          ganz: "Du hast einen ganzen Kreis addiert. An der Schmalseite sitzt nur ein Halbkreis: ½ · π · r².",
          durchmesser: "b ist der Durchmesser des Halbkreises. In die Formel gehört der Radius r = b : 2.",
          fehlt: "Das ist nur das Rechteck. Der Halbkreis gehört auch zur Sandfläche.",
        }, "Rechteck plus Halbkreis: A = l · b + ½ · π · r² mit r = b : 2."),
      },
      {
        name: "Einfassung U", soll: U, einheit: "m", toleranz: TOL, platzhalter: "U",
        hinweis: hinweisAus(U, falschU, {
          schnittkante: "Du hast die gestrichelte Schnittkante mitgezählt. Dort schließt der Halbkreis an — eine Einfassung braucht man nur außen.",
          ganz: "Am Rand liegt nur ein Halbkreisbogen: π · r, nicht 2 · π · r.",
          rechteck: "Das ist der Umfang des Rechtecks. An der rechten Schmalseite liegt aber der Halbkreisbogen am Rand, nicht die gerade Seite.",
          seite: "Die linke Schmalseite b gehört auch zum Rand.",
        }, "Einmal außen herum: zwei Längsseiten l, die linke Schmalseite b und der Halbkreisbogen π · r."),
      },
      {
        name: "Gesamtkosten", soll: K, einheit: "€", toleranz: 1, platzhalter: "€",
        hinweis: hinweisAus(K, falschK, {
          vertauscht: "Du hast die Preise vertauscht: Der Belag kostet je m² (also mal der Fläche), die Einfassung je m (mal dem Umfang).",
          nurFlaeche: "Das ist nur der Belag. Die Einfassung kommt noch dazu.",
          nurRand: "Das ist nur die Einfassung. Der Belag kommt noch dazu.",
          alles: "Fläche und Länge lassen sich nicht addieren. Rechne beide Kosten getrennt aus und addiere die Euro-Beträge.",
        }, "Belag: Fläche mal Preis je m². Einfassung: Länge mal Preis je m. Dann beide Beträge addieren.", { tol: 1, fast: false }),
      },
    ],
    tipps: [
      `Die Fläche besteht aus einem Rechteck (l mal b) und einem Halbkreis mit dem Durchmesser b, also r = ${num(r)} m.`,
      "Die Einfassung läuft außen herum: zwei Längsseiten, die linke Schmalseite und der Halbkreisbogen. Die gestrichelte Linie liegt innen.",
      "Kosten: Fläche · Preis je m² + Länge · Preis je m.",
    ],
    musterloesungHtml:
      `<strong>1. Fläche:</strong> A = l · b + ½ · π · r² = ${num(l)} m · ${num(b)} m + ½ · π · (${num(r)} m)² ≈ <strong>${zwei(A)} m²</strong><br>` +
      `<strong>2. Einfassung:</strong> U = 2 · l + b + π · r = ${num(2 * l)} m + ${num(b)} m + π · ${num(r)} m ≈ <strong>${zwei(U)} m</strong><br>` +
      `<strong>3. Belag:</strong> ${zwei(A)} m² · ${num(pA)} € je m² ≈ ${zwei(A * pA)} €<br>` +
      `<strong>4. Einfassung:</strong> ${zwei(U)} m · ${num(pU)} € je m ≈ ${zwei(U * pU)} €<br>` +
      `<strong>5. Gesamtkosten:</strong> ${zwei(A * pA)} € + ${zwei(U * pU)} € ≈ <strong>${num(K, 0)} €</strong>`,
  };
}

// ---------- K2: das Blech — Fläche, Schnittlänge und Masse ----------
// Rechteck mit Halbkreis rechts; unten in der Mitte eine halbkreisförmige Aussparung. Links und
// rechts von ihr bleibt je die Strecke e stehen.
const K2_KANDIDATEN = spaeter(() => {
  const liste = [];
  for (const b of [6, 8, 10, 12]) {
    for (const h of [4, 5, 6, 8]) {
      if (b / h > 2.6 || h > b) continue;
      for (const e of [1, 1.5, 2, 2.5, 3]) {
        const r = b / 2 - e;
        if (r < 1 || r > h - 1.5 || Math.abs(e - r) < 0.4) continue;
        for (const dichte of [0.78, 0.27]) liste.push({ b, h, e, dichte });
      }
    }
  }
  return liste;
});
function k2Werte({ b, h, e, dichte }) {
  const R = h / 2, r = b / 2 - e;
  const A = b * h + (Math.PI * R * R) / 2 - (Math.PI * r * r) / 2;
  const U = b + h + 2 * e + Math.PI * R + Math.PI * r;
  const m = A * dichte;
  return {
    R, r, A, U, m,
    falschA: [
      [b * h + (Math.PI * R * R) / 2 + (Math.PI * r * r) / 2, "addiert"],
      [b * h + (Math.PI * R * R) / 2, "voll"],
      [b * h + (Math.PI * R * R) / 2 - (Math.PI * e * e) / 2, "abstand"],
      [b * h - (Math.PI * r * r) / 2, "halbkreis"],
    ],
    falschU: [
      [b + h + 2 * e + Math.PI * R - Math.PI * r, "abgezogen"],
      [2 * b + h + Math.PI * R, "ohne"],
      [U + h, "schnittkante"],
      [b + h + 2 * e + Math.PI * R, "bogen"],
    ],
    falschM: [[A / dichte, "geteilt"], [U * dichte, "umfang"]],
  };
}
function k2Figur({ b, h, e }) {
  const r = b / 2 - e;
  return figur("blech", {
    rand: [P(0, 0), P(e, 0), ...bogen(P(b / 2, 0), r, 180, 0), P(b, 0), ...bogen(P(b, h / 2), h / 2, -90, 90), P(0, h)],
    schnitte: [[P(b, 0), P(b, h)], [P(e, 0), P(b - e, 0)]],
    masse: [
      { name: "b", von: P(0, h), bis: P(b, h), versatz: 13, text: `b = ${num(b)} cm` },
      { name: "h", von: P(0, 0), bis: P(0, h), versatz: 13, text: `h = ${num(h)} cm`, art: "hoehe" },
      { name: "e", von: P(0, 0), bis: P(e, 0), versatz: -13, text: `e = ${num(e)} cm` },
    ],
    breite: 340,
    platz: { links: 84, oben: 38, unten: 38 },
  });
}
function generateK2() {
  const kand = ohneFeldKollision(K2_KANDIDATEN(), (v) => { const w = k2Werte(v); return [werteVon(w.A, w.falschA), werteVon(w.U, w.falschU), werteVon(w.m, w.falschM)]; }, [EPS, EPS, 0.2]);
  const { b, h, e, dichte } = kand;
  const { R, r, A, U, m, falschA, falschU, falschM } = k2Werte(kand);
  const stoff = dichte === 0.78 ? "Stahlblech" : "Aluminiumblech";
  return {
    promptHtml:
      `Ein Laser schneidet aus ${stoff} das abgebildete Bauteil: ein Rechteck mit einem Halbkreis an der rechten Seite und einer halbkreisförmigen Aussparung unten in der Mitte — links und rechts von ihr bleibt je die Strecke e stehen. Ein Quadratzentimeter des Blechs wiegt <strong>${num(dichte)} g</strong>. ` +
      `<strong>Berechne den Flächeninhalt, die Länge des Schnitts (einmal um das Bauteil) und die Masse des Bauteils.</strong>` + k2Figur(kand) +
      `<span class="progress-note">Alle drei Ergebnisse auf zwei Nachkommastellen gerundet.</span>`,
    felder: [
      {
        name: "Flächeninhalt A", soll: A, einheit: "cm²", toleranz: TOL, platzhalter: "A",
        hinweis: hinweisAus(A, falschA, {
          addiert: "Du hast die Aussparung addiert. Sie fehlt dem Bauteil — sie wird abgezogen.",
          voll: "Das ist das Bauteil ohne Aussparung. Zieh den kleinen Halbkreis noch ab.",
          abstand: "e ist der Abstand von der Ecke zur Aussparung, nicht ihr Radius. Der Durchmesser der Aussparung ist b − 2 · e.",
          halbkreis: "Der Halbkreis an der rechten Seite gehört auch zum Bauteil.",
        }, "Rechteck plus großer Halbkreis minus Aussparung: A = b · h + ½ · π · R² − ½ · π · r²."),
      },
      {
        name: "Schnittlänge U", soll: U, einheit: "cm", toleranz: TOL, platzhalter: "U",
        hinweis: hinweisAus(U, falschU, {
          abgezogen: "Beim Umfang wird nichts abgezogen: Der Bogen der Aussparung ist ein Stück Rand — der Laser fährt ihn entlang.",
          ohne: "Das ist der Umfang ohne Aussparung. Unten ist die Kante aber unterbrochen: Es bleiben zweimal e, und der Bogen der Aussparung kommt dazu.",
          schnittkante: "Du hast die gestrichelte Kante zwischen Rechteck und Halbkreis mitgezählt. Sie liegt innen — dort schneidet der Laser nicht.",
          bogen: "Der Bogen der Aussparung fehlt: Auch dort schneidet der Laser.",
        }, "Einmal außen herum: oben b, links h, unten zweimal e, dazu der große und der kleine Halbkreisbogen."),
      },
      {
        name: "Masse m", soll: m, einheit: "g", toleranz: 0.05, platzhalter: "m",
        hinweis: hinweisAus(m, falschM, {
          geteilt: "Du hast durch die Masse je cm² geteilt. Jeder Quadratzentimeter wiegt so viel — also malnehmen.",
          umfang: "Die Masse hängt von der Fläche ab, nicht von der Länge des Randes: Flächeninhalt mal Masse je cm².",
        }, "Masse = Flächeninhalt · Masse je cm².", { tol: 0.05 }),
      },
    ],
    tipps: [
      `Der große Halbkreis hat den Durchmesser h, also R = ${num(R)} cm. Die Aussparung hat den Durchmesser b − 2 · e, also r = ${num(r)} cm.`,
      "Flächeninhalt: Rechteck plus großer Halbkreis minus kleiner Halbkreis.",
      "Schnittlänge: der ganze Rand — oben b, links h, unten zweimal e, der große Bogen und der Bogen der Aussparung.",
      "Masse: Flächeninhalt mal Masse je Quadratzentimeter.",
    ],
    musterloesungHtml:
      `<strong>1. Radien:</strong> R = h : 2 = ${num(R)} cm; r = (b − 2 · e) : 2 = (${num(b)} cm − ${num(2 * e)} cm) : 2 = ${num(r)} cm<br>` +
      `<strong>2. Flächeninhalt:</strong> A = b · h + ½ · π · R² − ½ · π · r² = ${num(b * h)} cm² + ${num((R * R) / 2)} · π cm² − ${num((r * r) / 2)} · π cm² ≈ <strong>${zwei(A)} cm²</strong><br>` +
      `<strong>3. Schnittlänge:</strong> U = b + h + 2 · e + π · R + π · r = ${num(b + h + 2 * e)} cm + π · ${num(R + r)} cm ≈ <strong>${zwei(U)} cm</strong><br>` +
      `<strong>4. Masse:</strong> m = A · ${num(dichte)} g je cm² ≈ ${zwei(A)} · ${num(dichte)} g ≈ <strong>${zwei(m)} g</strong><br>` +
      `<em>Durch die Aussparung wird das Bauteil leichter — der Schnitt aber länger.</em>`,
  };
}

// ---------- K3: die Bühne — Rechteck, zwei Dreiecke, zwei Kreisausschnitte ----------
// Waagerechte Seite, Höhe und schräge Seite der Dreiecke: Tripel (in Metern).
const K3_TRIPEL = [[1.5, 2, 2.5], [3, 4, 5], [4.5, 6, 7.5], [2.25, 3, 3.75]];
const DOSE = 8;   // m² je Dose Lack
const K3_KANDIDATEN = spaeter(() => {
  const liste = [];
  for (const [c, h, s] of K3_TRIPEL) {
    for (const b of [2, 3, 4, 5, 6, 8]) {
      if (b / h > 2.2 || b / h < 0.5) continue;
      for (const alpha of [30, 40, 45, 50, 60, 70, 80, 90]) {
        const A = b * h + c * h + 2 * (alpha / 360) * Math.PI * s * s;
        // Liegt die Fläche knapp an einem Vielfachen der Dosengröße, entschiede die Rundung über
        // die Dosenzahl — solche Fälle bleiben draußen.
        const rest = A / DOSE - Math.floor(A / DOSE);
        if (rest < 0.06 || rest > 0.94) continue;
        liste.push({ b, c, h, s, alpha });
      }
    }
  }
  return liste;
});
function k3Werte({ b, c, h, s, alpha }) {
  const k = alpha / 360;
  const sektor = k * Math.PI * s * s, bog = k * 2 * Math.PI * s;
  const A = b * h + c * h + 2 * sektor;
  const U = 2 * (b + c) + 2 * s + 2 * bog;
  const dosen = Math.ceil(A / DOSE);
  return {
    sektor, bog, A, U, dosen,
    falschA: [
      [b * h + c * h + sektor, "einAusschnitt"],
      [b * h + 2 * c * h + 2 * sektor, "halbieren"],
      [b * h + (c * h) / 2 + 2 * sektor, "einDreieck"],
      [b * h + c * h, "ohneAusschnitte"],
      [b * h + c * h + 2 * k * Math.PI * h * h, "radius"],
    ],
    falschU: [
      [U + 2 * h + 2 * s, "schnittkanten"],
      [2 * (b + c) + 2 * bog, "radien"],
      [2 * (b + c) + 2 * s + bog, "einBogen"],
      [2 * b + 2 * s + 2 * bog, "dreieckseiten"],
    ],
    falschD: [[dosen - 1, "abgerundet"]],
  };
}
function k3Figur({ b, c, h, s, alpha }) {
  const L = P(0, 0), T = P(2 * c + b, h);
  const wL = (Math.atan2(h, c) * 180) / Math.PI;      // Richtung der schrägen Seite von L aus
  const wR = wL + 180;                                // … und von T aus
  const bogenR = bogen(T, s, wR, wR + alpha), bogenL = bogen(L, s, wL, wL + alpha);
  return figur("buehne", {
    // Unten von L nach rechts, über den rechten Ausschnitt zur Spitze T, oben zurück und über den
    // linken Ausschnitt wieder nach L.
    rand: [L, P(c + b, 0), ...bogenR, T, P(c, h), ...bogenL],
    schnitte: [[P(c, 0), P(c, h)], [P(c + b, 0), P(c + b, h)], [L, P(c, h)], [P(c + b, 0), T]],
    masse: [
      // c steht oben am rechten Dreieck, b unten am Rechteck — nebeneinander auf derselben Kante
      // stießen die beiden Beschriftungen bei kurzen Seiten zusammen.
      { name: "c", von: P(c + b, h), bis: T, versatz: 13, text: `c = ${num(c)} m` },
      { name: "b", von: P(c, 0), bis: P(c + b, 0), versatz: -13, text: `b = ${num(b)} m` },
      // Die Höhe steht innen an der linken Schnittkante des Rechtecks.
      { name: "h", von: P(c, 0), bis: P(c, h), versatz: -9, text: `h = ${num(h)} m`, art: "hoehe" },
      { name: "s", von: T, bis: bogenR[bogenR.length - 1], versatz: 11, text: `s = ${num(s)} m`, bei: 0.6 },
    ],
    winkel: [
      { name: "alpha", M: T, r: 20, g0: wR, g1: wR + alpha, text: `α = ${alpha}°`, ab: 6 },
      { name: "alpha2", M: L, r: 20, g0: wL, g1: wL + alpha, text: "α", ab: -3 },
    ],
    breite: 420, maxHoehe: 270,
    platz: { links: 30, rechts: 84, oben: 40, unten: 40 },
  });
}
function generateK3() {
  const kand = ohneFeldKollision(K3_KANDIDATEN(), (v) => { const w = k3Werte(v); return [werteVon(w.A, w.falschA), werteVon(w.U, w.falschU), werteVon(w.dosen, w.falschD)]; }, [EPS, EPS, 0.5]);
  const { b, c, h, s, alpha } = kand;
  const { sektor, bog, A, U, dosen, falschA, falschU, falschD } = k3Werte(kand);
  const anteil = bruch(`${alpha}°`, "360°");
  return {
    promptHtml:
      `Für das Schulfest wird eine Bühne gebaut. Ihr Boden besteht aus einem Rechteck, zwei gleichen rechtwinkligen Dreiecken und zwei gleichen Kreisausschnitten mit dem Winkel α; der Radius der Ausschnitte ist die schräge Seite s der Dreiecke (gemessen). Der Boden wird lackiert — eine Dose Lack reicht für <strong>${DOSE} m²</strong> —, und am Rand entlang wird eine Lichterkette befestigt. ` +
      `<strong>Berechne den Flächeninhalt des Bodens, die Zahl der Dosen und die Länge der Lichterkette.</strong>` + k3Figur(kand) +
      `<span class="progress-note">Flächeninhalt und Länge auf zwei Nachkommastellen gerundet; gekauft werden nur ganze Dosen.</span>`,
    felder: [
      {
        name: "Flächeninhalt A", soll: A, einheit: "m²", toleranz: TOL, platzhalter: "A",
        hinweis: hinweisAus(A, falschA, {
          einAusschnitt: "Es sind ZWEI Kreisausschnitte — links oben und rechts unten.",
          halbieren: "Bei den Dreiecken fehlt das Halbieren: Jedes hat den Flächeninhalt ½ · c · h, beide zusammen c · h.",
          einDreieck: "Es sind ZWEI Dreiecke — zusammen 2 · ½ · c · h = c · h.",
          ohneAusschnitte: "Die beiden Kreisausschnitte fehlen noch.",
          radius: "Der Radius der Ausschnitte ist die schräge Seite s, nicht die Höhe h.",
        }, "Rechteck b · h, zwei Dreiecke je ½ · c · h, zwei Ausschnitte je α : 360° · π · s²."),
      },
      {
        name: "Dosen Lack", soll: dosen, einheit: "Dosen", toleranz: 0.01, platzhalter: "Anzahl",
        hinweis: hinweisAus(dosen, falschD, {
          abgerundet: `Abgerundet reicht der Lack nicht: ${num(dosen - 1)} Dosen decken nur ${num((dosen - 1) * DOSE)} m². Es muss eine Dose mehr sein.`,
        }, `Teile den Flächeninhalt durch ${DOSE} m² und runde auf — eine angebrochene Dose muss ganz gekauft werden.`, { tol: 0.01, fast: false }),
      },
      {
        name: "Lichterkette U", soll: U, einheit: "m", toleranz: TOL, platzhalter: "U",
        hinweis: hinweisAus(U, falschU, {
          schnittkanten: "Du hast die gestrichelten Schnittkanten mitgezählt. Sie liegen im Inneren — dort hängt keine Lichterkette.",
          radien: "Jeder Kreisausschnitt hat einen freien Radius am Rand: zweimal s fehlt.",
          einBogen: "Es sind ZWEI Bögen — an jedem Ausschnitt einer.",
          dreieckseiten: "Oben und unten ist die gerade Kante jeweils b + c lang: Sie läuft am Rechteck und an einem Dreieck entlang.",
        }, "Einmal außen herum: unten c + b, ein Bogen, ein Radius s, oben b + c, ein Bogen, ein Radius s."),
      },
    ],
    tipps: [
      "Zerlege an den gestrichelten Linien: ein Rechteck, zwei Dreiecke mit den Seiten c und h am rechten Winkel, zwei Kreisausschnitte mit dem Radius s.",
      `Ein Ausschnitt: ${anteil} · π · s² = ${anteil} · π · ${num(s)}² m². Ein Bogen: ${anteil} · 2 · π · ${num(s)} m.`,
      "Am Rand liegen: unten c + b, oben b + c, zwei freie Radien s und zwei Bögen. Alle gestrichelten Linien liegen innen.",
      `Dosen: Flächeninhalt durch ${DOSE} m² teilen und aufrunden.`,
    ],
    musterloesungHtml:
      `<strong>1. Rechteck und Dreiecke:</strong> b · h + 2 · ½ · c · h = ${num(b * h)} m² + ${num(c * h)} m² = ${num(b * h + c * h)} m²<br>` +
      `<strong>2. Zwei Kreisausschnitte:</strong> 2 · ${anteil} · π · (${num(s)} m)² ≈ ${zwei(2 * sektor)} m²<br>` +
      `<strong>3. Flächeninhalt:</strong> A ≈ ${num(b * h + c * h)} m² + ${zwei(2 * sektor)} m² ≈ <strong>${zwei(A)} m²</strong><br>` +
      `<strong>4. Dosen:</strong> ${zwei(A)} m² : ${DOSE} m² ≈ ${zwei(A / DOSE)} — aufgerundet <strong>${num(dosen)} Dosen</strong><br>` +
      `<strong>5. Lichterkette:</strong> gerade Stücke 2 · (b + c) + 2 · s = ${num(2 * (b + c) + 2 * s)} m, zwei Bögen 2 · ${anteil} · 2 · π · ${num(s)} m ≈ ${zwei(2 * bog)} m — zusammen U ≈ <strong>${zwei(U)} m</strong>`,
  };
}

// ================= Liste =================

export const AUFGABEN = [
  { schwierigkeit: "einfach", titel: "Rechteck mit Halbkreis — Flächeninhalt", abschnitt: "sec-zerlegen", generate: generateE1 },
  { schwierigkeit: "einfach", titel: "Rechteck mit zwei Halbkreisen — Umfang", abschnitt: "sec-umfang", generate: generateE2 },
  { schwierigkeit: "einfach", titel: "Rechteck mit ausgeschnittener Ecke — Flächeninhalt", abschnitt: "sec-abziehen", generate: generateE3 },

  { schwierigkeit: "mittel", titel: "Rechteck mit Dreieck — Flächeninhalt und Umfang", abschnitt: "sec-teile", generate: generateM1 },
  { schwierigkeit: "mittel", titel: "Zwei Kreisausschnitte — Flächeninhalt und Umfang", abschnitt: "sec-teile", generate: generateM2 },
  { schwierigkeit: "mittel", titel: "Zwei ausgeschnittene Ecken — Flächeninhalt und Umfang", abschnitt: "sec-abziehen", generate: generateM3 },

  { schwierigkeit: "schwierig", titel: "Trapez mit Halbkreis — Flächeninhalt und Umfang", abschnitt: "sec-teile", generate: generateS1 },
  { schwierigkeit: "schwierig", titel: "Rückwärts — die Gerade der Laufbahn", abschnitt: "sec-umfang", generate: generateS2 },
  { schwierigkeit: "schwierig", titel: "Fünf Ausschnitte — Radien erschließen", abschnitt: "sec-abziehen", generate: generateS3 },

  { schwierigkeit: "komplex", titel: "Der Spielplatz — Fläche, Einfassung, Kosten", abschnitt: ["sec-zerlegen", "sec-umfang"], generate: generateK1 },
  { schwierigkeit: "komplex", titel: "Das Blech — Fläche, Schnittlänge, Masse", abschnitt: "sec-abziehen", generate: generateK2 },
  { schwierigkeit: "komplex", titel: "Die Bühne — Dreiecke und Kreisausschnitte", abschnitt: "sec-teile", generate: generateK3 },
];
