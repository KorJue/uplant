// Die zwölf Übungsaufgaben zu „Der Kreis“ — vier je Figur (Kreis, Kreisring, Kreisausschnitt),
// eine je Schwierigkeitsstufe. Aufbau wie bei den Flächeninhalten:
//   einfach   — aus einer beschrifteten Zeichnung (alle Maße im Bild),
//   mittel    — aus Zahlenangaben in verschiedenen Einheiten,
//   schwierig — die Umkehrung, mit Probe,
//   komplex   — eine Sachaufgabe, in der zusammengesetzt oder erst eine Größe bestimmt wird.
//
// Klasse 8 kennt die Quadratwurzel noch nicht. Rückwärts wird deshalb nur gerechnet, wo man durch
// π teilt — den Radius aus dem Flächeninhalt gibt es hier nicht.
//
// Kreisgrößen gehen fast nie glatt auf: Gerechnet wird mit der π-Taste, und das Ergebnis wird auf
// zwei Nachkommastellen gerundet (Toleranz 0,015, wie bei den Kreisberechnungen im Grundwissen).
// Die Fehlerwerte müssen deshalb deutlich weiter auseinanderliegen als die Toleranz — sonst wäre
// nicht zu entscheiden, welcher Fehler gemacht wurde. Wer mit π ≈ 3,14 rechnet, bekommt einen
// eigenen Hinweis, sofern das Ergebnis dadurch sichtbar abweicht.
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
export function num(x, digits = 4) {
  const f = Math.pow(10, digits);
  const gerundet = Math.round(x * f) / f;
  return zahlformat(digits).format(gerundet === 0 ? 0 : gerundet);
}
// Auf zwei Nachkommastellen, aber immer mit beiden Stellen: „31,40“ sieht nach Rundung aus,
// „31,4“ nach einem genauen Wert.
function zwei(x) {
  return new Intl.NumberFormat("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.round(x * 100) / 100);
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Die Eingabe ist gerundet. Ein Fehlerwert gilt als getroffen, wenn die Eingabe so nah an ihm liegt
// wie eine richtige Antwort an der Lösung.
const TOL = 0.015;
function trifft(val, soll, tol = TOL) {
  return Number.isFinite(val) && Number.isFinite(soll) && Math.abs(val - soll) <= tol + 1e-9;
}

// Paarweise deutlich verschieden: mindestens das Doppelte der Toleranz und dazu ein Rundungsschritt.
function paarweiseVerschieden(werte, eps = 0.05) {
  const echt = werte.filter((x) => Number.isFinite(x));
  return echt.every((x, i) => echt.every((y, j) => i === j || Math.abs(x - y) > eps));
}

// Wählt aus einer VORHER gefilterten Liste — nicht durch Verwerfen und Neuziehen. Bleiben von vielen
// Kandidaten fast keine übrig, steht vermutlich ein Wert doppelt in der Liste.
function ohneKollision(kandidaten, werte, eps = 0.05) {
  const sauber = kandidaten.filter((k) => paarweiseVerschieden(werte(k), eps));
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
  return Math.abs(wert314 - soll) > 0.05 ? wert314 : NaN;
}
const HINWEIS_314 = "Du hast mit π ≈ 3,14 gerechnet. Das ist für eine Überschlagsrechnung gut, aber zu ungenau für zwei Nachkommastellen: Nimm die π-Taste und runde erst das Ergebnis.";

const LAENGE = [
  { name: "mm", cm: 0.1 },
  { name: "cm", cm: 1 },
  { name: "dm", cm: 10 },
  { name: "m", cm: 100 },
];
const FLAECHE = [
  { name: "mm²", cm2: 0.01 },
  { name: "cm²", cm2: 1 },
  { name: "dm²", cm2: 100 },
  { name: "m²", cm2: 10000 },
];
const E = (name) => LAENGE.find((e) => e.name === name);
const F = (name) => FLAECHE.find((e) => e.name === name);

const RUNDEN = `<span class="progress-note">Rechne mit der π-Taste und runde das Ergebnis auf zwei Nachkommastellen.</span>`;

// ---------- Zeichnungen für die Aufgabentexte ----------
//
// Die Maße stehen an der Figur, nicht im Text — wie im Buch. Beim Kreisring stehen die beiden
// Radien im richtigen Verhältnis zueinander, beim Ausschnitt ist der Winkel so groß gezeichnet,
// wie er beschriftet ist.

function svgKopf(breite, hoehe, art) {
  return `<svg viewBox="0 0 ${breite} ${hoehe}" width="${breite}" height="${hoehe}" class="fl-aufgaben-figur" data-figur="${art}" role="img">`;
}
const f1 = (x) => x.toFixed(1);
function kreisSvg(cx, cy, r, klasse) {
  return `<circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(r)}" class="${klasse}"/>`;
}
function linieSvg(p, q, klasse) {
  return `<line x1="${f1(p.x)}" y1="${f1(p.y)}" x2="${f1(q.x)}" y2="${f1(q.y)}" class="${klasse}"/>`;
}
function textSvg(p, text, klasse, anker = "middle") {
  return `<text x="${f1(p.x)}" y="${f1(p.y)}" text-anchor="${anker}" class="${klasse}">${text}</text>`;
}
function punktSvg(p) {
  return `<circle cx="${f1(p.x)}" cy="${f1(p.y)}" r="3" class="kr-fig-punkt"/>`;
}

// Ein Kreis mit beschriftetem Radius (waagerecht nach rechts) oder Durchmesser (waagerecht durch M).
function figurKreis(art, wert) {
  const R = 70, B = 230, H = 2 * R + 30;
  const M = { x: B / 2, y: H / 2 };
  let out = svgKopf(B, H, "kreis");
  out += kreisSvg(M.x, M.y, R, "fl-fig-flaeche") + kreisSvg(M.x, M.y, R, "fl-fig-kante");
  if (art === "r") {
    out += linieSvg(M, { x: M.x + R, y: M.y }, "fl-fig-grund");
    out += textSvg({ x: M.x + R / 2, y: M.y - 8 }, `r = ${num(wert)} cm`, "fl-fig-grund-text");
  } else {
    out += linieSvg({ x: M.x - R, y: M.y }, { x: M.x + R, y: M.y }, "fl-fig-grund");
    out += textSvg({ x: M.x, y: M.y - 8 }, `d = ${num(wert)} cm`, "fl-fig-grund-text");
  }
  out += punktSvg(M) + textSvg({ x: M.x - 2, y: M.y + 16 }, "M", "fl-fig-text");
  return out + "</svg>";
}

// Zwei Kreise um denselben Mittelpunkt; die Radien im wahren Verhältnis.
function figurRing(R, r) {
  const RP = 80, rp = (RP * r) / R, B = 240, H = 2 * RP + 24;
  const M = { x: B / 2, y: H / 2 };
  let out = svgKopf(B, H, "ring");
  // Die Fläche als ein Pfad aus zwei Kreisen mit evenodd: Das Loch bleibt durchsichtig, statt mit
  // einer Hintergrundfarbe übermalt zu werden, die im Dunkelmodus nicht passen würde.
  const ring = (rad) => `M ${f1(M.x - rad)} ${f1(M.y)} a ${f1(rad)} ${f1(rad)} 0 1 0 ${f1(2 * rad)} 0 a ${f1(rad)} ${f1(rad)} 0 1 0 ${f1(-2 * rad)} 0 `;
  out += `<path d="${ring(RP)}${ring(rp)}" fill-rule="evenodd" class="fl-fig-flaeche"/>`;
  out += kreisSvg(M.x, M.y, RP, "fl-fig-kante") + kreisSvg(M.x, M.y, rp, "fl-fig-kante");
  // Außenradius nach rechts, Innenradius schräg nach links oben — so überdecken sich die
  // Beschriftungen nie, auch wenn r fast so groß ist wie R.
  out += linieSvg(M, { x: M.x + RP, y: M.y }, "fl-fig-grund");
  out += textSvg({ x: M.x + RP / 2 + rp / 4, y: M.y + 16 }, `R = ${num(R)} cm`, "fl-fig-grund-text");
  const a = (3 * Math.PI) / 4;
  const E = { x: M.x + rp * Math.cos(a), y: M.y - rp * Math.sin(a) };
  out += linieSvg(M, E, "fl-fig-zweit");
  out += textSvg({ x: E.x - 6, y: E.y - 8 }, `r = ${num(r)} cm`, "fl-fig-zweit-text", "end");
  out += punktSvg(M);
  return out + "</svg>";
}

// Ein Kreisausschnitt mit beschriftetem Radius und Mittelpunktswinkel. Der Winkel öffnet sich von
// der waagerechten Achse gegen den Uhrzeigersinn; der Bogen wird als echter SVG-Bogen gezeichnet.
function figurSektor(r, alpha) {
  const RP = 78, B = 250, H = 2 * RP + 34;
  const M = { x: B / 2, y: H / 2 + 4 };
  const a = (alpha * Math.PI) / 180;
  const P = { x: M.x + RP, y: M.y };
  const Q = { x: M.x + RP * Math.cos(a), y: M.y - RP * Math.sin(a) };
  const gross = alpha > 180 ? 1 : 0;
  let out = svgKopf(B, H, "sektor");
  out += `<circle cx="${f1(M.x)}" cy="${f1(M.y)}" r="${RP}" class="kr-fig-hilfe"/>`;
  const pfad = `M ${f1(M.x)} ${f1(M.y)} L ${f1(P.x)} ${f1(P.y)} A ${RP} ${RP} 0 ${gross} 0 ${f1(Q.x)} ${f1(Q.y)} Z`;
  out += `<path d="${pfad}" class="fl-fig-flaeche"/><path d="${pfad}" class="fl-fig-kante"/>`;
  out += linieSvg(M, P, "fl-fig-grund");
  out += textSvg({ x: M.x + RP / 2, y: M.y + 16 }, `r = ${num(r)} cm`, "fl-fig-grund-text");
  // Der Winkelbogen am Mittelpunkt und die Beschriftung auf seiner Winkelhalbierenden.
  const rw = 22, Pw = { x: M.x + rw, y: M.y }, Qw = { x: M.x + rw * Math.cos(a), y: M.y - rw * Math.sin(a) };
  out += `<path d="M ${f1(Pw.x)} ${f1(Pw.y)} A ${rw} ${rw} 0 ${gross} 0 ${f1(Qw.x)} ${f1(Qw.y)}" class="kr-fig-winkel"/>`;
  const halb = a / 2;
  out += textSvg({ x: M.x + 40 * Math.cos(halb), y: M.y - 40 * Math.sin(halb) + 5 }, `α = ${alpha}°`, "fl-fig-hoehe-text");
  out += punktSvg(M);
  return out + "</svg>";
}

const HINWEIS_BILD = `<span class="progress-note">Die Maße stehen an der Zeichnung. Rechne mit der π-Taste und runde das Ergebnis auf zwei Nachkommastellen.</span>`;

// ================= einfach =================

// ---------- K1: Kreis — Umfang oder Flächeninhalt aus der Zeichnung ----------
const K1_KANDIDATEN = spaeter(() => {
  const liste = [];
  for (const art of ["r", "d"]) {
    for (const wert of [2, 2.5, 3, 4, 4.5, 5, 6, 7, 8, 9, 10, 12, 15]) {
      for (const frage of ["U", "A"]) liste.push({ art, wert, frage });
    }
  }
  return liste;
});

function k1Werte({ art, wert, frage }) {
  const r = art === "r" ? wert : wert / 2;
  const d = 2 * r;
  const richtig = frage === "U" ? 2 * Math.PI * r : Math.PI * r * r;
  // Die Fehler hängen davon ab, was gegeben ist: Wer d bekommt und mit d wie mit r rechnet, macht
  // einen anderen Fehler als der, der r bekommt und ihn für d hält.
  const falsch = frage === "U"
    ? (art === "r"
      ? [[Math.PI * r, "Durchmesser"], [Math.PI * r * r, "Flächeninhalt"], [d, "π"]]
      : [[2 * Math.PI * d, "Radius"], [Math.PI * r * r, "Flächeninhalt"], [d, "π"]])
    : (art === "r"
      ? [[2 * Math.PI * r, "Umfang"], [Math.PI * r, "quadriert"], [Math.PI * d * d, "Vierfache"]]
      : [[Math.PI * d * d, "Vierfache"], [Math.PI * d, "Umfang"], [Math.PI * r, "quadriert"]]);
  const p314 = frage === "U" ? 2 * 3.14 * r : 3.14 * r * r;
  falsch.push([mitDreiVierzehn(richtig, p314), "3,14"]);
  return { r, d, richtig, falsch };
}

function generateK1() {
  const k = ohneKollision(K1_KANDIDATEN(), (v) => { const w = k1Werte(v); return [w.richtig, ...w.falsch.map((f) => f[0])]; });
  const { art, wert, frage } = k;
  const { r, d, richtig, falsch } = k1Werte(k);
  const hinweise = {
    Durchmesser: `Du hast π · r gerechnet. In U = π · d steht der Durchmesser — der ist doppelt so lang wie der Radius: U = 2 · π · r.`,
    Radius: `Du hast den Durchmesser wie einen Radius behandelt: 2 · π · d ist der doppelte Umfang. Mit dem Durchmesser heißt es einfach U = π · d.`,
    Flächeninhalt: `Das ist der Flächeninhalt π · r². Gesucht ist der Umfang — eine Länge: U = 2 · π · r.`,
    π: `Das ist nur der Durchmesser. Der Umfang ist gut dreimal so lang: U = π · d.`,
    Umfang: `Das ist der Umfang 2 · π · r — eine Länge. Für den Flächeninhalt wird r quadriert: A = π · r².`,
    quadriert: `Du hast π · r gerechnet und das Quadrieren vergessen: A = π · r · r.`,
    Vierfache: `Du hast den Durchmesser quadriert: π · d² ist das Vierfache des Flächeninhalts. Erst den Radius bestimmen, r = d : 2, dann A = π · r².`,
    "3,14": HINWEIS_314,
  };
  return {
    promptHtml:
      `<strong>Berechne den ${frage === "U" ? "Umfang" : "Flächeninhalt"} des Kreises.</strong>` +
      figurKreis(art, wert) + HINWEIS_BILD,
    correct: richtig,
    tolerance: TOL,
    placeholder: frage === "U" ? "U in cm" : "A in cm²",
    hinweis: (roh, val) => {
      for (const [w, schluessel] of falsch) if (trifft(val, w)) return hinweise[schluessel];
      return frage === "U"
        ? `Lies ab, ob der Radius oder der Durchmesser gegeben ist. Dann U = 2 · π · r oder U = π · d.`
        : `Bestimme zuerst den Radius${art === "d" ? " (r = d : 2)" : ""}. Dann A = π · r².`;
    },
    tipps: [
      art === "r" ? "Gegeben ist der Radius — die Strecke vom Mittelpunkt zum Rand." : "Gegeben ist der Durchmesser — die Strecke quer durch den Mittelpunkt.",
      frage === "U" ? "Der Umfang: U = π · d = 2 · π · r." : "Der Flächeninhalt: A = π · r² — dafür brauchst du den Radius.",
      frage === "U" ? (art === "r" ? `U = 2 · π · ${num(r)} cm` : `U = π · ${num(d)} cm`) : `A = π · ${num(r)}² cm² = π · ${num(r * r)} cm²`,
    ],
    musterloesungHtml:
      `<strong>1. Ablesen:</strong> ${art === "r" ? `r = ${num(r)} cm` : `d = ${num(d)} cm, also r = d : 2 = ${num(r)} cm`}<br>` +
      (frage === "U"
        ? `<strong>2. Formel:</strong> U = ${art === "r" ? "2 · π · r" : "π · d"}<br>` +
          `<strong>3. Einsetzen:</strong> U = ${art === "r" ? `2 · π · ${num(r)} cm` : `π · ${num(d)} cm`} ≈ <strong>${zwei(richtig)} cm</strong>`
        : `<strong>2. Formel:</strong> A = π · r²<br>` +
          `<strong>3. Einsetzen:</strong> A = π · (${num(r)} cm)² = π · ${num(r * r)} cm² ≈ <strong>${zwei(richtig)} cm²</strong>`),
  };
}

// ---------- R1: Kreisring — Flächeninhalt aus der Zeichnung ----------
const R1_KANDIDATEN = spaeter(() => {
  const liste = [];
  for (const R of [3, 4, 5, 6, 7, 8, 9, 10, 12]) {
    for (let r = 1; r < R; r += 1) liste.push({ R, r });
    if (R >= 5) liste.push({ R, r: R - 1.5 });
  }
  return liste;
});

function r1Werte({ R, r }) {
  const richtig = Math.PI * (R * R - r * r);
  return {
    richtig,
    falsch: [
      [Math.PI * (R - r) * (R - r), "erst quadrieren"],
      [Math.PI * R * R, "Loch"],
      [Math.PI * (R * R + r * r), "abziehen"],
      [2 * Math.PI * (R - r), "Umfänge"],
      [mitDreiVierzehn(richtig, 3.14 * (R * R - r * r)), "3,14"],
    ],
  };
}

function generateR1() {
  const k = ohneKollision(R1_KANDIDATEN(), (v) => { const w = r1Werte(v); return [w.richtig, ...w.falsch.map((f) => f[0])]; });
  const { R, r } = k;
  const { richtig, falsch } = r1Werte(k);
  const hinweise = {
    "erst quadrieren": `Du hast π · (R − r)² gerechnet — das ist ein Kreis mit der Ringbreite als Radius. Erst quadrieren, dann abziehen: A = π · (R² − r²).`,
    Loch: `Das ist der große Kreis allein. Das Loch in der Mitte gehört nicht zum Ring: Zieh den kleinen Kreis π · r² noch ab.`,
    abziehen: `Du hast die beiden Kreise addiert. Der Ring ist der große Kreis OHNE den kleinen: A = π · R² − π · r².`,
    Umfänge: `Das ist der Unterschied der beiden Umfänge — eine Länge. Gesucht ist die Fläche: A = π · (R² − r²).`,
    "3,14": HINWEIS_314,
  };
  return {
    promptHtml: `<strong>Berechne den Flächeninhalt des Kreisrings.</strong>` + figurRing(R, r) + HINWEIS_BILD,
    correct: richtig,
    tolerance: TOL,
    placeholder: "A in cm²",
    hinweis: (roh, val) => {
      for (const [w, schluessel] of falsch) if (trifft(val, w)) return hinweise[schluessel];
      return `Großer Kreis minus kleiner Kreis: A = π · R² − π · r² = π · (R² − r²).`;
    },
    tipps: [
      "Ein Kreisring ist der große Kreis ohne den kleinen.",
      "A = π · R² − π · r² = π · (R² − r²).",
      `A = π · (${num(R)}² − ${num(r)}²) cm² = π · (${num(R * R)} − ${num(r * r)}) cm²`,
    ],
    musterloesungHtml:
      `<strong>1. Ablesen:</strong> R = ${num(R)} cm, r = ${num(r)} cm<br>` +
      `<strong>2. Formel:</strong> A = π · (R² − r²)<br>` +
      `<strong>3. Einsetzen:</strong> A = π · (${num(R * R)} cm² − ${num(r * r)} cm²) = π · ${num(R * R - r * r)} cm² ≈ <strong>${zwei(richtig)} cm²</strong><br>` +
      `<em>Probe über das Aufbiegen:</em> π · (R + r) · (R − r) = π · ${num(R + r)} · ${num(R - r)} cm² = π · ${num((R + r) * (R - r))} cm² — dieselbe Zahl vor π.`,
  };
}

// ---------- S1: Kreisausschnitt — Bogen oder Flächeninhalt aus der Zeichnung ----------
const S1_WINKEL = [30, 45, 60, 72, 90, 120, 135, 150, 180, 210, 240, 270, 300];
const S1_KANDIDATEN = spaeter(() => {
  const liste = [];
  for (const alpha of S1_WINKEL) {
    for (const r of [2, 3, 4, 5, 6, 8, 9, 10, 12]) {
      for (const frage of ["b", "A"]) liste.push({ alpha, r, frage });
    }
  }
  return liste;
});

function s1Werte({ alpha, r, frage }) {
  const anteil = alpha / 360;
  const bogen = anteil * 2 * Math.PI * r, flaeche = anteil * Math.PI * r * r;
  const richtig = frage === "b" ? bogen : flaeche;
  const falsch = frage === "b"
    ? [[2 * Math.PI * r, "ganze"], [flaeche, "Fläche"], [bogen + 2 * r, "Radien"], [anteil * Math.PI * r, "2 · π · r"],
      [mitDreiVierzehn(bogen, anteil * 2 * 3.14 * r), "3,14"]]
    : [[Math.PI * r * r, "ganze"], [bogen, "Bogen"], [anteil * Math.PI * 4 * r * r, "Durchmesser"],
      [mitDreiVierzehn(flaeche, anteil * 3.14 * r * r), "3,14"]];
  return { anteil, bogen, flaeche, richtig, falsch };
}

function generateS1() {
  const k = ohneKollision(S1_KANDIDATEN(), (v) => { const w = s1Werte(v); return [w.richtig, ...w.falsch.map((f) => f[0])]; });
  const { alpha, r, frage } = k;
  const { anteil, richtig, falsch } = s1Werte(k);
  const hinweise = {
    ganze: `Das ist der ganze Kreis. Der Ausschnitt ist nur der Anteil α : 360° = ${alpha} : 360 davon.`,
    Fläche: `Das ist der Flächeninhalt des Ausschnitts. Gesucht ist der Bogen — eine Länge: b = α : 360° · 2 · π · r.`,
    Bogen: `Das ist die Bogenlänge. Gesucht ist die Fläche: A = α : 360° · π · r².`,
    Radien: `Du hast die beiden Radien dazugezählt — das wäre der ganze Rand des Tortenstücks. Der Bogen ist nur das krumme Stück.`,
    "2 · π · r": `Du hast den Anteil von π · r genommen. Der ganze Umfang ist aber 2 · π · r.`,
    Durchmesser: `Du hast mit dem Durchmesser statt mit dem Radius quadriert — das gibt das Vierfache.`,
    "3,14": HINWEIS_314,
  };
  return {
    promptHtml:
      `<strong>Berechne ${frage === "b" ? "die Länge des Kreisbogens b" : "den Flächeninhalt des Kreisausschnitts"}.</strong>` +
      figurSektor(r, alpha) + HINWEIS_BILD,
    correct: richtig,
    tolerance: TOL,
    placeholder: frage === "b" ? "b in cm" : "A in cm²",
    hinweis: (roh, val) => {
      for (const [w, schluessel] of falsch) if (trifft(val, w)) return hinweise[schluessel];
      return `Erst der Anteil: ${alpha}° : 360°. Dann diesen Anteil vom ganzen ${frage === "b" ? "Umfang 2 · π · r" : "Kreis π · r²"} nehmen.`;
    },
    tipps: [
      "Der Ausschnitt ist derselbe Anteil vom ganzen Kreis wie α vom Vollwinkel 360°.",
      `Anteil: ${alpha}° : 360° = ${num(anteil, 4)}.`,
      frage === "b" ? `b = ${num(anteil, 4)} · 2 · π · ${num(r)} cm` : `A = ${num(anteil, 4)} · π · ${num(r)}² cm²`,
    ],
    musterloesungHtml:
      `<strong>1. Ablesen:</strong> r = ${num(r)} cm, α = ${alpha}°<br>` +
      `<strong>2. Anteil:</strong> ${alpha}° : 360° = ${num(anteil, 4)}<br>` +
      (frage === "b"
        ? `<strong>3. Bogen:</strong> b = ${alpha}° : 360° · 2 · π · ${num(r)} cm ≈ <strong>${zwei(richtig)} cm</strong>`
        : `<strong>3. Fläche:</strong> A = ${alpha}° : 360° · π · (${num(r)} cm)² ≈ <strong>${zwei(richtig)} cm²</strong>`),
  };
}

// ================= mittel: mit Einheiten =================

// ---------- K2: Kreis — Umfang oder Fläche in einer anderen Einheit ----------
const K2_KANDIDATEN = spaeter(() => {
  const liste = [];
  const zahlen = [1.2, 1.5, 2, 2.4, 3, 3.5, 4, 4.5, 6, 8, 12, 15, 25, 30, 40, 45, 60, 75, 80];
  for (const art of ["r", "d"]) {
    for (const eG of LAENGE) {
      for (const wert of zahlen) {
        const cm = wert * eG.cm;
        if (cm < 0.5 || cm > 2000) continue;
        for (const eZ of LAENGE) {
          if (eZ.name === eG.name) continue;
          const U = (Math.PI * (art === "r" ? 2 * cm : cm)) / eZ.cm;
          if (U >= 0.5 && U <= 50000) liste.push({ art, wert, eG: eG.name, frage: "U", ziel: eZ.name });
        }
        for (const fZ of FLAECHE) {
          if (fZ.name === eG.name + "²") continue;
          const rr = art === "r" ? cm : cm / 2;
          const A = (Math.PI * rr * rr) / fZ.cm2;
          if (A >= 0.5 && A <= 50000) liste.push({ art, wert, eG: eG.name, frage: "A", ziel: fZ.name });
        }
      }
    }
  }
  return liste;
});

function k2Werte({ art, wert, eG, frage, ziel }) {
  const rCm = (art === "r" ? wert : wert / 2) * E(eG).cm;
  const rNaiv = art === "r" ? wert : wert / 2;   // die Zahl ohne Umrechnung
  if (frage === "U") {
    const f = E(ziel).cm;
    const richtig = (2 * Math.PI * rCm) / f;
    return {
      richtig,
      falsch: [
        [2 * Math.PI * rNaiv, "umgerechnet"],
        [art === "r" ? (Math.PI * rCm) / f : (4 * Math.PI * rCm) / f, art === "r" ? "Durchmesser" : "Radius"],
        [mitDreiVierzehn(richtig, (2 * 3.14 * rCm) / f), "3,14"],
      ],
    };
  }
  const f = F(ziel).cm2;
  const richtig = (Math.PI * rCm * rCm) / f;
  // Wer erst in der gegebenen Einheit rechnet und die FLÄCHE dann mit dem Längenfaktor umrechnet
  // (dm² → cm² mal 10 statt mal 100), liegt um diesen Faktor daneben.
  const linear = E(eG).cm / E(ziel.replace("²", "")).cm;
  return {
    richtig,
    falsch: [
      [Math.PI * rNaiv * rNaiv, "umgerechnet"],
      [Math.PI * rNaiv * rNaiv * linear, "zweimal"],
      [(4 * Math.PI * rCm * rCm) / f, "Vierfache"],
      [mitDreiVierzehn(richtig, (3.14 * rCm * rCm) / f), "3,14"],
    ],
  };
}

function generateK2() {
  const k = ohneKollision(K2_KANDIDATEN(), (v) => { const w = k2Werte(v); return [w.richtig, ...w.falsch.map((f) => f[0])]; });
  const { art, wert, eG, frage, ziel } = k;
  const { richtig, falsch } = k2Werte(k);
  const rCm = (art === "r" ? wert : wert / 2) * E(eG).cm;
  const hinweise = {
    umgerechnet: `Du hast mit ${num(wert)} gerechnet, ohne die Einheit umzurechnen. ${eG} und ${ziel} passen nicht zusammen — erst umrechnen, dann die Formel.`,
    Durchmesser: `Du hast π · r gerechnet: Das ist der halbe Umfang. U = 2 · π · r.`,
    Radius: `Du hast den Durchmesser wie einen Radius eingesetzt: 2 · π · d ist der doppelte Umfang. U = π · d.`,
    zweimal: `Beim Umrechnen von Flächen zählt der Faktor <strong>zweimal</strong>: 1 dm = 10 cm, aber 1 dm² = 100 cm².`,
    Vierfache: `Du hast mit dem Durchmesser quadriert — das gibt das Vierfache. Erst r = d : 2, dann A = π · r².`,
    "3,14": HINWEIS_314,
  };
  const groesse = art === "r" ? "den Radius" : "den Durchmesser";
  return {
    promptHtml:
      `Ein Kreis hat ${groesse} <strong>${art} = ${num(wert)} ${eG}</strong>.<br>` +
      `<strong>Berechne ${frage === "U" ? "seinen Umfang" : "seinen Flächeninhalt"} in ${ziel}.</strong>` + RUNDEN,
    correct: richtig,
    tolerance: TOL,
    placeholder: `${frage} in ${ziel}`,
    hinweis: (roh, val) => {
      for (const [w, schluessel] of falsch) if (trifft(val, w)) return hinweise[schluessel];
      return `Rechne die Länge zuerst in ${frage === "U" ? ziel : ziel.replace("²", "")} um. Dann ${frage === "U" ? "U = 2 · π · r" : "A = π · r²"}.`;
    },
    tipps: [
      `Rechne ${groesse} zuerst in ${frage === "U" ? ziel : ziel.replace("²", "")} um.`,
      art === "d" ? "Für den Flächeninhalt brauchst du den Radius: r = d : 2." : (frage === "U" ? "U = 2 · π · r" : "A = π · r²"),
      frage === "U" ? "U = 2 · π · r = π · d" : "A = π · r² — die Einheit wird dabei zur Flächeneinheit.",
    ],
    musterloesungHtml: (() => {
      const zielLaenge = frage === "U" ? ziel : ziel.replace("²", "");
      const rZ = rCm / E(zielLaenge).cm;
      return `<strong>1. Umrechnen:</strong> ${art} = ${num(wert)} ${eG} = ${num((art === "r" ? rCm : 2 * rCm) / E(zielLaenge).cm)} ${zielLaenge}` +
        (art === "d" ? `, also r = ${num(rZ)} ${zielLaenge}` : "") + `<br>` +
        (frage === "U"
          ? `<strong>2. Umfang:</strong> U = 2 · π · ${num(rZ)} ${ziel} ≈ <strong>${zwei(richtig)} ${ziel}</strong>`
          : `<strong>2. Flächeninhalt:</strong> A = π · (${num(rZ)} ${zielLaenge})² = π · ${num(rZ * rZ)} ${ziel} ≈ <strong>${zwei(richtig)} ${ziel}</strong>`);
    })(),
  };
}

// ---------- R2: Kreisring — die Unterlegscheibe ----------
// Außen- und Innendurchmesser in mm, gesucht die Fläche in cm² oder mm².
const R2_KANDIDATEN = spaeter(() => {
  const liste = [];
  for (const D of [12, 16, 18, 20, 24, 28, 30, 36, 40, 44, 50, 60]) {
    for (const d of [4, 5, 6, 8, 10, 12, 13, 16, 17, 20, 22, 25, 30]) {
      if (d >= D - 4) continue;
      for (const ziel of ["cm²", "mm²"]) liste.push({ D, d, ziel });
    }
  }
  return liste;
});

function r2Werte({ D, d, ziel }) {
  const f = ziel === "cm²" ? 100 : 1;   // mm² je Zieleinheit
  const R = D / 2, r = d / 2;
  const richtig = (Math.PI * (R * R - r * r)) / f;
  return {
    richtig,
    falsch: [
      [(Math.PI * (D * D - d * d)) / f, "Durchmesser"],
      [ziel === "cm²" ? Math.PI * (R * R - r * r) : NaN, "Einheit"],
      [ziel === "cm²" ? (Math.PI * (R * R - r * r)) / 10 : NaN, "zweimal"],
      [(Math.PI * (R - r) * (R - r)) / f, "erst quadrieren"],
      [mitDreiVierzehn(richtig, (3.14 * (R * R - r * r)) / f), "3,14"],
    ],
  };
}

function generateR2() {
  const k = ohneKollision(R2_KANDIDATEN(), (v) => { const w = r2Werte(v); return [w.richtig, ...w.falsch.map((f) => f[0])]; });
  const { D, d, ziel } = k;
  const { richtig, falsch } = r2Werte(k);
  const R = D / 2, r = d / 2;
  const hinweise = {
    Durchmesser: `Du hast die Durchmesser wie Radien eingesetzt — das gibt das Vierfache. Halbiere zuerst: R = ${num(R)} mm, r = ${num(r)} mm.`,
    Einheit: `Das ist die Fläche in mm². Gesucht ist sie in cm² — und 1 cm² = 100 mm².`,
    zweimal: `Beim Umrechnen von Flächen zählt der Faktor zweimal: 1 cm = 10 mm, aber 1 cm² = 100 mm².`,
    "erst quadrieren": `Du hast π · (R − r)² gerechnet — erst quadrieren, dann abziehen: A = π · (R² − r²).`,
    "3,14": HINWEIS_314,
  };
  return {
    promptHtml:
      `Eine Unterlegscheibe ist ein Kreisring mit dem Außendurchmesser <strong>${num(D)} mm</strong> und dem Innendurchmesser <strong>${num(d)} mm</strong>.<br>` +
      `<strong>Berechne ihren Flächeninhalt in ${ziel}.</strong>` + RUNDEN,
    correct: richtig,
    tolerance: TOL,
    placeholder: "A in " + ziel,
    hinweis: (roh, val) => {
      for (const [w, schluessel] of falsch) if (trifft(val, w)) return hinweise[schluessel];
      return `Erst die Radien (Durchmesser halbieren), dann A = π · (R² − r²)${ziel === "cm²" ? ", zum Schluss in cm² umrechnen" : ""}.`;
    },
    tipps: [
      "Die Formel braucht die Radien — halbiere die beiden Durchmesser.",
      `R = ${num(R)} mm und r = ${num(r)} mm; A = π · (R² − r²).`,
      ziel === "cm²" ? "Das Ergebnis ist in mm². 100 mm² = 1 cm²." : "Das Ergebnis ist schon in mm².",
    ],
    musterloesungHtml:
      `<strong>1. Radien:</strong> R = ${num(D)} mm : 2 = ${num(R)} mm, r = ${num(d)} mm : 2 = ${num(r)} mm<br>` +
      `<strong>2. Fläche:</strong> A = π · (${num(R * R)} − ${num(r * r)}) mm² = π · ${num(R * R - r * r)} mm² ≈ ${zwei(Math.PI * (R * R - r * r))} mm²<br>` +
      (ziel === "cm²" ? `<strong>3. In cm²:</strong> ${zwei(Math.PI * (R * R - r * r))} mm² : 100 ≈ <strong>${zwei(richtig)} cm²</strong>` : `<strong>Ergebnis:</strong> A ≈ <strong>${zwei(richtig)} mm²</strong>`),
  };
}

// ---------- S2: Kreisausschnitt — Fläche aus Bogen und Radius ----------
// A = ½ · b · r geht glatt auf: Hier braucht es kein π — nur die Einheiten müssen passen.
const S2_KANDIDATEN = spaeter(() => {
  const liste = [];
  for (const eB of ["cm", "dm", "m"]) {
    for (const eR of ["cm", "dm", "m"]) {
      if (eB === eR) continue;
      for (const b of [1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 12, 15, 20, 24, 30, 45, 60, 80]) {
        for (const r of [0.4, 0.5, 0.6, 0.8, 1.2, 1.5, 2, 3, 4, 5, 6, 8, 9, 12, 15, 25, 40, 50]) {
          const bCm = b * E(eB).cm, rCm = r * E(eR).cm;
          // Ein Ausschnitt mit einem Bogen länger als der ganze Umfang gibt es nicht — und ein
          // hauchdünner, bei dem der Bogen unter einem Zehntel des Radius liegt, zeichnet niemand.
          if (bCm > 2 * Math.PI * rCm || bCm < rCm / 10) continue;
          for (const ziel of ["cm²", "dm²"]) {
            const A = (0.5 * bCm * rCm) / F(ziel).cm2;
            if (Math.abs(Math.round(A * 100) - A * 100) > 1e-6 || A < 0.5 || A > 20000) continue;
            liste.push({ b, eB, r, eR, ziel, loesung: Math.round(A * 100) / 100 });
          }
        }
      }
    }
  }
  return liste;
});

function s2Werte({ b, eB, r, eR, ziel, loesung }) {
  const bCm = b * E(eB).cm, rCm = r * E(eR).cm;
  return {
    richtig: loesung,
    falsch: [
      [(bCm * rCm) / F(ziel).cm2, "halbieren"],
      [0.5 * b * r, "umgerechnet"],
      [(Math.PI * rCm * rCm) / F(ziel).cm2, "ganze"],
    ],
  };
}

function generateS2() {
  const k = ohneKollision(S2_KANDIDATEN(), (v) => { const w = s2Werte(v); return [w.richtig, ...w.falsch.map((f) => f[0])]; });
  const { b, eB, r, eR, ziel, loesung } = k;
  const { falsch } = s2Werte(k);
  const zielL = ziel.replace("²", "");
  const bZ = (b * E(eB).cm) / E(zielL).cm, rZ = (r * E(eR).cm) / E(zielL).cm;
  const hinweise = {
    halbieren: `Du hast b · r gerechnet. Das Fast-Parallelogramm ist aber nur b : 2 lang: A = ½ · b · r.`,
    umgerechnet: `Du hast mit ${num(b)} und ${num(r)} gerechnet, ohne umzurechnen. ${eB} und ${eR} sind verschieden lang — erst in dieselbe Einheit bringen.`,
    ganze: `Das ist der ganze Kreis π · r². Mit dem Bogen geht es ohne π: A = ½ · b · r.`,
  };
  return {
    promptHtml:
      `Ein Kreisausschnitt hat den Radius <strong>r = ${num(r)} ${eR}</strong> und den Bogen <strong>b = ${num(b)} ${eB}</strong>.<br>` +
      `<strong>Berechne seinen Flächeninhalt in ${ziel}.</strong>` +
      `<span class="progress-note">Rechne beide Längen zuerst in dieselbe Einheit um.</span>`,
    correct: loesung,
    tolerance: Math.max(1e-4, loesung * 1e-6),
    placeholder: "A in " + ziel,
    hinweis: (roh, val) => {
      for (const [w, schluessel] of falsch) if (trifft(val, w, Math.max(1e-4, w * 1e-6))) return hinweise[schluessel];
      return `Beide Längen in ${zielL} umrechnen, dann A = ½ · b · r.`;
    },
    tipps: [
      `Rechne b und r in ${zielL} um.`,
      "Der Ausschnitt lässt sich zu einem Fast-Parallelogramm umlegen: unten b : 2, Höhe r.",
      "A = ½ · b · r — dafür braucht man den Winkel gar nicht.",
    ],
    musterloesungHtml:
      `<strong>1. Gemeinsame Einheit:</strong> b = ${num(b)} ${eB} = ${num(bZ)} ${zielL}, r = ${num(r)} ${eR} = ${num(rZ)} ${zielL}<br>` +
      `<strong>2. Formel:</strong> A = ½ · b · r = ½ · ${num(bZ)} ${zielL} · ${num(rZ)} ${zielL} = <strong>${num(loesung)} ${ziel}</strong><br>` +
      `<em>Warum ohne π?</em> Das π steckt schon im Bogen: b ist ein Anteil von 2 · π · r.`,
  };
}

// ================= schwierig: die Umkehrung =================

// ---------- K3: Kreis — Radius oder Durchmesser aus dem Umfang ----------
// Der Umfang ist gerundet angegeben; die erwartete Lösung wird aus GENAU dieser Zahl berechnet,
// damit das Nachrechnen der Schülerin auf denselben Wert führt.
const K3_KANDIDATEN = spaeter(() => {
  const liste = [];
  for (const r0 of [1.5, 2, 2.5, 3, 4, 4.5, 5, 6, 7, 7.5, 8, 9, 10, 12, 14, 15, 18, 20, 25]) {
    for (const gesucht of ["r", "d"]) liste.push({ U: Math.round(2 * Math.PI * r0 * 100) / 100, gesucht });
  }
  return liste;
});

function k3Werte({ U, gesucht }) {
  const d = U / Math.PI, r = d / 2;
  const richtig = gesucht === "r" ? r : d;
  return {
    richtig,
    falsch: [
      [gesucht === "r" ? d : r, gesucht === "r" ? "Durchmesser" : "Radius"],
      [U * Math.PI, "multipliziert"],
      [U / 2, "π vergessen"],
      [mitDreiVierzehn(richtig, gesucht === "r" ? U / (2 * 3.14) : U / 3.14), "3,14"],
    ],
  };
}

function generateK3() {
  const k = ohneKollision(K3_KANDIDATEN(), (v) => { const w = k3Werte(v); return [w.richtig, ...w.falsch.map((f) => f[0])]; });
  const { U, gesucht } = k;
  const { richtig, falsch } = k3Werte(k);
  const hinweise = {
    Durchmesser: `Du hast nur durch π geteilt — das ergibt den Durchmesser. Der Radius ist halb so groß: r = U : (2 · π).`,
    Radius: `Du hast durch 2 · π geteilt — das ergibt den Radius. Der Durchmesser ist doppelt so groß: d = U : π.`,
    multipliziert: `Du hast mit π multipliziert statt zu teilen. Aus U = π · d wird d = U : π.`,
    "π vergessen": `Du hast nur halbiert. Der Umfang ist gut dreimal so lang wie der Durchmesser — es muss durch π geteilt werden.`,
    "3,14": HINWEIS_314,
  };
  const name = gesucht === "r" ? "Radius" : "Durchmesser";
  return {
    promptHtml:
      `Ein Kreis hat den Umfang <strong>U = ${zwei(U)} cm</strong>.<br><strong>Wie groß ist sein ${name} in Zentimetern?</strong>` + RUNDEN,
    correct: richtig,
    tolerance: TOL,
    placeholder: `${gesucht} in cm`,
    hinweis: (roh, val) => {
      for (const [w, schluessel] of falsch) if (trifft(val, w)) return hinweise[schluessel];
      return gesucht === "r" ? `Stelle U = 2 · π · r nach r um: r = U : (2 · π).` : `Stelle U = π · d nach d um: d = U : π.`;
    },
    tipps: [
      gesucht === "r" ? "Gehe von U = 2 · π · r aus." : "Gehe von U = π · d aus.",
      gesucht === "r" ? "r steht mit dem Faktor 2 · π da — also durch 2 · π teilen." : "d steht mit dem Faktor π da — also durch π teilen.",
      gesucht === "r" ? `r = ${zwei(U)} cm : (2 · π)` : `d = ${zwei(U)} cm : π`,
    ],
    musterloesungHtml:
      `<strong>1. Umstellen:</strong> ${gesucht === "r" ? "U = 2 · π · r ⟹ r = U : (2 · π)" : "U = π · d ⟹ d = U : π"}<br>` +
      `<strong>2. Einsetzen:</strong> ${gesucht} = ${zwei(U)} cm : ${gesucht === "r" ? "(2 · π)" : "π"} ≈ <strong>${zwei(richtig)} cm</strong><br>` +
      `<strong>Probe:</strong> ${gesucht === "r" ? `2 · π · ${zwei(richtig)} cm` : `π · ${zwei(richtig)} cm`} ≈ ${zwei(gesucht === "r" ? 2 * Math.PI * Math.round(richtig * 100) / 100 : Math.PI * Math.round(richtig * 100) / 100)} cm ✓ (bis auf Rundung)`,
  };
}

// ---------- R3: Kreisring — die Breite aus zwei Umfängen ----------
const R3_KANDIDATEN = spaeter(() => {
  const liste = [];
  for (const R of [3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20]) {
    for (const w of [0.5, 1, 1.5, 2, 2.5, 3, 4, 5]) {
      if (w >= R - 0.5) continue;
      liste.push({ Ua: Math.round(2 * Math.PI * R * 100) / 100, Ui: Math.round(2 * Math.PI * (R - w) * 100) / 100 });
    }
  }
  return liste;
});

function r3Werte({ Ua, Ui }) {
  const richtig = (Ua - Ui) / (2 * Math.PI);
  return {
    richtig,
    falsch: [
      [(Ua - Ui) / Math.PI, "Durchmesser"],
      [Ua - Ui, "Umfänge"],
      [(Ua - Ui) / 2, "π"],
      [Ua / (2 * Math.PI), "Außenradius"],
    ],
  };
}

function generateR3() {
  const k = ohneKollision(R3_KANDIDATEN(), (v) => { const w = r3Werte(v); return [w.richtig, ...w.falsch.map((f) => f[0])]; });
  const { Ua, Ui } = k;
  const { richtig, falsch } = r3Werte(k);
  const R = Ua / (2 * Math.PI), r = Ui / (2 * Math.PI);
  const hinweise = {
    Durchmesser: `Du hast nur durch π geteilt — das ist der Unterschied der beiden DURCHMESSER. Die Breite ist halb so groß: Sie liegt nur auf einer Seite des Lochs.`,
    Umfänge: `Das ist der Unterschied der beiden Umfänge. Die Breite ist der Unterschied der Radien — also noch durch 2 · π teilen.`,
    π: `Du hast nur halbiert. Ein Umfang ist 2 · π mal so lang wie sein Radius — teile durch 2 · π.`,
    Außenradius: `Das ist der Außenradius R. Gesucht ist die Breite R − r.`,
  };
  return {
    promptHtml:
      `Ein Kreisring hat den äußeren Umfang <strong>${zwei(Ua)} cm</strong> und den inneren Umfang <strong>${zwei(Ui)} cm</strong>.<br>` +
      `<strong>Wie breit ist der Ring in Zentimetern?</strong>` + RUNDEN,
    correct: richtig,
    tolerance: TOL,
    placeholder: "Breite in cm",
    hinweis: (roh, val) => {
      for (const [w, schluessel] of falsch) if (trifft(val, w)) return hinweise[schluessel];
      return `Die Breite ist R − r. Bestimme beide Radien aus den Umfängen (r = U : (2 · π)) und zieh sie voneinander ab.`;
    },
    tipps: [
      "Die Breite des Rings ist der Unterschied der beiden Radien: R − r.",
      "Aus U = 2 · π · r folgt r = U : (2 · π).",
      "Schneller: R − r = (U<sub>außen</sub> − U<sub>innen</sub>) : (2 · π).",
    ],
    musterloesungHtml:
      `<strong>1. Radien:</strong> R = ${zwei(Ua)} cm : (2 · π) ≈ ${num(R, 4)} cm, r = ${zwei(Ui)} cm : (2 · π) ≈ ${num(r, 4)} cm<br>` +
      `<strong>2. Breite:</strong> R − r ≈ <strong>${zwei(richtig)} cm</strong> &nbsp;(oder in einem Schritt: (${zwei(Ua)} − ${zwei(Ui)}) cm : (2 · π))<br>` +
      `<strong>Probe:</strong> Der äußere Umfang ist um 2 · π · ${zwei(richtig)} cm ≈ ${zwei(2 * Math.PI * Math.round(richtig * 100) / 100)} cm länger als der innere — ${zwei(Ua)} − ${zwei(Ui)} = ${zwei(Ua - Ui)} ✓ (bis auf Rundung)`,
  };
}

// ---------- S3: Kreisausschnitt — der Mittelpunktswinkel ----------
// Bogen bzw. Fläche sind gerundet angegeben; gesucht ist der Winkel auf ganze Grad.
const S3_KANDIDATEN = spaeter(() => {
  const liste = [];
  for (const alpha of [20, 30, 40, 45, 50, 60, 72, 75, 80, 90, 100, 108, 120, 135, 144, 150, 160, 180, 200, 216, 225, 240, 270, 288, 300, 315]) {
    for (const r of [2, 3, 4, 5, 6, 8, 10, 12]) {
      liste.push({ r, aus: "b", wert: Math.round((alpha / 360) * 2 * Math.PI * r * 100) / 100, alpha });
      liste.push({ r, aus: "A", wert: Math.round((alpha / 360) * Math.PI * r * r * 100) / 100, alpha });
    }
  }
  return liste;
});

function s3Werte({ r, aus, wert }) {
  const ganz = aus === "b" ? 2 * Math.PI * r : Math.PI * r * r;
  const richtig = (wert / ganz) * 360;
  return {
    richtig,
    falsch: [
      [wert / ganz, "Anteil"],
      [aus === "b" ? (wert / (Math.PI * r)) * 360 : (wert / (Math.PI * 4 * r * r)) * 360, aus === "b" ? "2 · π · r" : "Durchmesser"],
      // Bei 180° ist der Rest so groß wie der Ausschnitt; dort trägt der Wert keinen Hinweis — NaN
      // statt eines Kandidaten, der sonst lautlos aus dem Vorrat fiele.
      [Math.abs(360 - 2 * richtig) < 2 ? NaN : 360 - richtig, "Rest"],
    ],
  };
}

function generateS3() {
  // Ganze Grad: Die Fehlerwerte müssen mindestens zwei Grad auseinanderliegen.
  const k = ohneKollision(S3_KANDIDATEN(), (v) => { const w = s3Werte(v); return [w.richtig, ...w.falsch.map((f) => f[0])]; }, 2);
  const { r, aus, wert } = k;
  const { richtig, falsch } = s3Werte(k);
  const ganz = aus === "b" ? 2 * Math.PI * r : Math.PI * r * r;
  const hinweise = {
    Anteil: `Das ist der Anteil des Ausschnitts am ganzen Kreis. Der Winkel ist derselbe Anteil von 360° — also noch mit 360° malnehmen.`,
    "2 · π · r": `Du hast durch π · r geteilt. Der ganze Umfang ist 2 · π · r.`,
    Durchmesser: `Du hast mit dem Durchmesser statt mit dem Radius gerechnet. Die ganze Fläche ist π · r².`,
    Rest: `Das ist der Winkel des restlichen Kreises. Der Ausschnitt selbst hat 360° minus diesen Wert.`,
  };
  const was = aus === "b" ? `den Bogen <strong>b = ${zwei(wert)} cm</strong>` : `den Flächeninhalt <strong>A = ${zwei(wert)} cm²</strong>`;
  const rundeAlpha = Math.round(richtig);
  return {
    promptHtml:
      `Ein Kreisausschnitt hat den Radius <strong>r = ${num(r)} cm</strong> und ${was}.<br>` +
      `<strong>Wie groß ist sein Mittelpunktswinkel α?</strong>` +
      `<span class="progress-note">Rechne mit der π-Taste und runde auf ganze Grad.</span>`,
    correct: richtig,
    tolerance: 0.5,
    placeholder: "α in Grad",
    hinweis: (roh, val) => {
      for (const [w, schluessel] of falsch) if (trifft(val, w, schluessel === "Anteil" ? 0.005 : 0.5)) return hinweise[schluessel];
      return `Welcher Anteil vom ganzen ${aus === "b" ? "Umfang" : "Kreis"} ist der Ausschnitt? Derselbe Anteil von 360° ist α.`;
    },
    tipps: [
      `Bestimme zuerst ${aus === "b" ? "den ganzen Umfang 2 · π · r" : "die ganze Kreisfläche π · r²"}.`,
      `Der Anteil ist ${aus === "b" ? "b : U" : "A<sub>Ausschnitt</sub> : A<sub>Kreis</sub>"}.`,
      "α ist derselbe Anteil von 360°: α = Anteil · 360°.",
    ],
    musterloesungHtml:
      `<strong>1. Ganzer Kreis:</strong> ${aus === "b" ? `U = 2 · π · ${num(r)} cm ≈ ${num(ganz, 4)} cm` : `A = π · ${num(r)}² cm² ≈ ${num(ganz, 4)} cm²`}<br>` +
      `<strong>2. Anteil:</strong> ${zwei(wert)} : ${num(ganz, 4)} ≈ ${num(wert / ganz, 4)}<br>` +
      `<strong>3. Winkel:</strong> α ≈ ${num(wert / ganz, 4)} · 360° ≈ <strong>${rundeAlpha}°</strong><br>` +
      `<strong>Probe:</strong> ${rundeAlpha}° : 360° · ${aus === "b" ? `2 · π · ${num(r)} cm` : `π · ${num(r)}² cm²`} ≈ ${zwei((rundeAlpha / 360) * ganz)} ${aus === "b" ? "cm" : "cm²"} ✓`,
  };
}

// ================= komplex =================

// ---------- K4: Kreis — das Rundbogenfenster ----------
// Ein Rechteck mit aufgesetztem Halbkreis. Gesucht ist der Flächeninhalt der Glasscheibe oder die
// Länge des Rahmens rundherum.
const K4_KANDIDATEN = spaeter(() => {
  const liste = [];
  for (const w of [40, 50, 60, 70, 80, 90, 100, 120]) {
    for (const h of [60, 70, 80, 90, 100, 110, 120, 140, 150]) {
      if (h < w * 0.6) continue;
      for (const frage of ["A", "U"]) liste.push({ w, h, frage });
    }
  }
  return liste;
});

function k4Werte({ w, h, frage }) {
  const r = w / 2;
  if (frage === "A") {
    const richtig = w * h + (Math.PI * r * r) / 2;
    return {
      richtig,
      falsch: [
        [w * h + Math.PI * r * r, "Halbkreis"],
        [w * h + (Math.PI * w * w) / 2, "Radius"],
        [w * h, "Bogen fehlt"],
        [mitDreiVierzehn(richtig, w * h + (3.14 * r * r) / 2), "3,14"],
      ],
    };
  }
  const richtig = w + 2 * h + Math.PI * r;
  return {
    richtig,
    falsch: [
      [w + 2 * h + 2 * Math.PI * r, "Halbkreis"],
      [2 * w + 2 * h + Math.PI * r, "Kante"],
      [2 * h + Math.PI * r, "unten"],
      [w + 2 * h + Math.PI * w, "Radius"],
      [mitDreiVierzehn(richtig, w + 2 * h + 3.14 * r), "3,14"],
    ],
  };
}

function generateK4() {
  const k = ohneKollision(K4_KANDIDATEN(), (v) => { const ww = k4Werte(v); return [ww.richtig, ...ww.falsch.map((f) => f[0])]; });
  const { w, h, frage } = k;
  const { richtig, falsch } = k4Werte(k);
  const r = w / 2;
  const hinweise = frage === "A"
    ? {
      Halbkreis: `Du hast einen ganzen Kreis aufgesetzt. Oben sitzt nur ein HALBKREIS: ½ · π · r².`,
      Radius: `Du hast die Breite als Radius genommen. Der Halbkreis hat den Durchmesser ${num(w)} cm, also r = ${num(r)} cm.`,
      "Bogen fehlt": `Das ist nur das Rechteck. Der Halbkreis oben gehört auch zur Scheibe.`,
      "3,14": HINWEIS_314,
    }
    : {
      Halbkreis: `Du hast den ganzen Kreisumfang genommen. Oben ist nur ein halber Bogen: ½ · 2 · π · r = π · r.`,
      Kante: `Die obere Kante des Rechtecks gehört nicht zum Rahmen — dort sitzt der Bogen.`,
      unten: `Die untere Kante fehlt. Der Rahmen läuft ganz herum: unten, beide Seiten und der Bogen.`,
      Radius: `Du hast die Breite als Radius genommen. Der Bogen hat den Durchmesser ${num(w)} cm.`,
      "3,14": HINWEIS_314,
    };
  return {
    promptHtml:
      `Ein Fenster besteht aus einem Rechteck, <strong>${num(w)} cm</strong> breit und <strong>${num(h)} cm</strong> hoch, auf dem ein <strong>Halbkreis</strong> sitzt. Der Halbkreis ist so breit wie das Rechteck.<br>` +
      (frage === "A"
        ? `<strong>Berechne den Flächeninhalt der Glasscheibe in cm².</strong>`
        : `<strong>Wie lang ist der Rahmen rundherum (unten, beide Seiten und der Bogen) in cm?</strong>`) + RUNDEN,
    correct: richtig,
    tolerance: TOL,
    placeholder: frage === "A" ? "A in cm²" : "Länge in cm",
    hinweis: (roh, val) => {
      for (const [ww, schluessel] of falsch) if (trifft(val, ww)) return hinweise[schluessel];
      return frage === "A" ? `Rechteck plus Halbkreis: ${num(w)} · ${num(h)} + ½ · π · r² mit r = ${num(r)} cm.` : `Unten + zwei Seiten + halber Kreisumfang: ${num(w)} + 2 · ${num(h)} + π · r mit r = ${num(r)} cm.`;
    },
    tipps: [
      "Zerlege das Fenster in ein Rechteck und einen Halbkreis.",
      `Der Halbkreis hat den Durchmesser ${num(w)} cm, also den Radius ${num(r)} cm.`,
      frage === "A" ? "Halbkreisfläche: ½ · π · r²." : "Halber Kreisumfang: ½ · 2 · π · r = π · r.",
    ],
    musterloesungHtml: frage === "A"
      ? `<strong>1. Rechteck:</strong> ${num(w)} cm · ${num(h)} cm = ${num(w * h)} cm²<br>` +
        `<strong>2. Halbkreis:</strong> r = ${num(r)} cm, ½ · π · ${num(r)}² cm² ≈ ${zwei((Math.PI * r * r) / 2)} cm²<br>` +
        `<strong>3. Zusammen:</strong> A ≈ ${num(w * h)} cm² + ${zwei((Math.PI * r * r) / 2)} cm² ≈ <strong>${zwei(richtig)} cm²</strong>`
      : `<strong>1. Gerade Teile:</strong> unten ${num(w)} cm, Seiten 2 · ${num(h)} cm = ${num(2 * h)} cm<br>` +
        `<strong>2. Bogen:</strong> ½ · 2 · π · ${num(r)} cm = π · ${num(r)} cm ≈ ${zwei(Math.PI * r)} cm<br>` +
        `<strong>3. Zusammen:</strong> ${num(w + 2 * h)} cm + ${zwei(Math.PI * r)} cm ≈ <strong>${zwei(richtig)} cm</strong>`,
  };
}

// ---------- R4: Kreisring — der Rohrquerschnitt ----------
// Gegeben sind Außendurchmesser und Wandstärke; den Innenradius muss man erst bestimmen.
const R4_KANDIDATEN = spaeter(() => {
  const liste = [];
  for (const D of [20, 25, 30, 32, 40, 50, 60, 63, 75, 80, 90, 100, 110]) {
    for (const s of [1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) {
      if (s > D / 5) continue;
      for (const ziel of ["cm²", "mm²"]) liste.push({ D, s, ziel });
    }
  }
  return liste;
});

function r4Werte({ D, s, ziel }) {
  const f = ziel === "cm²" ? 100 : 1;
  const R = D / 2, r = R - s;
  const flaeche = (rr) => (Math.PI * (R * R - rr * rr)) / f;
  const richtig = flaeche(r);
  return {
    richtig,
    falsch: [
      [flaeche(R - s / 2), "halbe Wand"],
      [flaeche(R - 2 * s), "doppelt"],
      [(Math.PI * (D * D - (D - 2 * s) * (D - 2 * s))) / f, "Durchmesser"],
      [ziel === "cm²" ? richtig * 100 : NaN, "Einheit"],
      [mitDreiVierzehn(richtig, (3.14 * (R * R - r * r)) / f), "3,14"],
    ],
  };
}

function generateR4() {
  const k = ohneKollision(R4_KANDIDATEN(), (v) => { const w = r4Werte(v); return [w.richtig, ...w.falsch.map((f) => f[0])]; });
  const { D, s, ziel } = k;
  const { richtig, falsch } = r4Werte(k);
  const R = D / 2, r = R - s;
  const hinweise = {
    "halbe Wand": `Du hast die Wandstärke vom DURCHMESSER abgezogen. Die Wand liegt aber auf beiden Seiten: Der Innendurchmesser ist D − 2 · s, der Innenradius R − s.`,
    doppelt: `Du hast die Wandstärke zweimal vom Radius abgezogen. Vom Radius geht sie nur einmal ab: r = R − s.`,
    Durchmesser: `Du hast mit den Durchmessern statt mit den Radien gerechnet — das gibt das Vierfache.`,
    Einheit: `Das ist die Fläche in mm². Gesucht ist sie in cm² — 100 mm² = 1 cm².`,
    "3,14": HINWEIS_314,
  };
  return {
    promptHtml:
      `Ein Rohr hat den Außendurchmesser <strong>${num(D)} mm</strong> und die Wandstärke <strong>${num(s)} mm</strong>. Sein Querschnitt ist ein Kreisring.<br>` +
      `<strong>Berechne den Flächeninhalt des Querschnitts in ${ziel}.</strong>` + RUNDEN,
    correct: richtig,
    tolerance: TOL,
    placeholder: "A in " + ziel,
    hinweis: (roh, val) => {
      for (const [w, schluessel] of falsch) if (trifft(val, w)) return hinweise[schluessel];
      return `Außenradius R = D : 2, Innenradius r = R − s. Dann A = π · (R² − r²)${ziel === "cm²" ? " und in cm² umrechnen" : ""}.`;
    },
    tipps: [
      "Zeichne den Querschnitt: Die Wand ist der Ring zwischen Außen- und Innenkreis.",
      `Außenradius R = ${num(D)} mm : 2 = ${num(R)} mm. Die Wand ist ${num(s)} mm dick — also r = R − ${num(s)} mm.`,
      "A = π · (R² − r²)" + (ziel === "cm²" ? ", zum Schluss durch 100 teilen." : "."),
    ],
    musterloesungHtml:
      `<strong>1. Radien:</strong> R = ${num(D)} mm : 2 = ${num(R)} mm, r = R − s = ${num(R)} mm − ${num(s)} mm = ${num(r)} mm<br>` +
      `<strong>2. Fläche:</strong> A = π · (${num(R * R)} − ${num(r * r)}) mm² = π · ${num(R * R - r * r)} mm² ≈ ${zwei(Math.PI * (R * R - r * r))} mm²<br>` +
      (ziel === "cm²" ? `<strong>3. In cm²:</strong> ${zwei(Math.PI * (R * R - r * r))} mm² : 100 ≈ <strong>${zwei(richtig)} cm²</strong>` : `<strong>Ergebnis:</strong> A ≈ <strong>${zwei(richtig)} mm²</strong>`),
  };
}

// ---------- S4: Kreisausschnitt — der Minutenzeiger ----------
// In m Minuten dreht sich der Minutenzeiger um m · 6°. Gesucht ist der Weg seiner Spitze oder die
// Fläche, die er überstreicht.
const S4_KANDIDATEN = spaeter(() => {
  const liste = [];
  for (const L of [0.8, 1.2, 1.5, 1.8, 2, 2.5, 3, 3.5, 4]) {
    for (const m of [5, 10, 12, 15, 20, 25, 35, 40, 45, 50, 55]) {
      for (const frage of ["b", "A"]) liste.push({ L, m, frage });
    }
  }
  return liste;
});

function s4Werte({ L, m, frage }) {
  const alpha = 6 * m, anteil = alpha / 360;
  const richtig = frage === "b" ? anteil * 2 * Math.PI * L : anteil * Math.PI * L * L;
  const naiv = m / 360;   // die Minuten als Grad genommen
  return {
    alpha,
    richtig,
    falsch: [
      [frage === "b" ? naiv * 2 * Math.PI * L : naiv * Math.PI * L * L, "Grad"],
      [frage === "b" ? anteil * Math.PI * L * L : anteil * 2 * Math.PI * L, frage === "b" ? "Fläche" : "Bogen"],
      [frage === "b" ? 2 * Math.PI * L : Math.PI * L * L, "ganze"],
      [mitDreiVierzehn(richtig, frage === "b" ? anteil * 2 * 3.14 * L : anteil * 3.14 * L * L), "3,14"],
    ],
  };
}

function generateS4() {
  const k = ohneKollision(S4_KANDIDATEN(), (v) => { const w = s4Werte(v); return [w.richtig, ...w.falsch.map((f) => f[0])]; });
  const { L, m, frage } = k;
  const { alpha, richtig, falsch } = s4Werte(k);
  const hinweise = {
    Grad: `Du hast ${m}° gerechnet. In einer Minute dreht sich der Minutenzeiger aber um 6° — in einer Stunde einmal ganz herum, 360° : 60 = 6°.`,
    Fläche: `Das ist die überstrichene Fläche. Gesucht ist der Weg der Spitze — ein Bogen: b = α : 360° · 2 · π · r.`,
    Bogen: `Das ist der Weg der Spitze. Gesucht ist die überstrichene Fläche: A = α : 360° · π · r².`,
    ganze: `Das wäre eine ganze Stunde. In ${m} Minuten ist es nur der Anteil ${m} : 60.`,
    "3,14": HINWEIS_314,
  };
  return {
    promptHtml:
      `Der Minutenzeiger einer Turmuhr ist <strong>${num(L)} m</strong> lang.<br>` +
      (frage === "b"
        ? `<strong>Welchen Weg legt seine Spitze in ${m} Minuten zurück? Gib ihn in m an.</strong>`
        : `<strong>Welche Fläche überstreicht er in ${m} Minuten? Gib sie in m² an.</strong>`) + RUNDEN,
    correct: richtig,
    tolerance: TOL,
    placeholder: frage === "b" ? "Weg in m" : "Fläche in m²",
    hinweis: (roh, val) => {
      for (const [w, schluessel] of falsch) if (trifft(val, w)) return hinweise[schluessel];
      return `Erst der Winkel: In ${m} Minuten dreht sich der Zeiger um ${m} · 6°. Dann der Anteil vom ganzen ${frage === "b" ? "Umfang" : "Kreis"}.`;
    },
    tipps: [
      "In 60 Minuten dreht sich der Minutenzeiger einmal ganz herum — um 360°. In einer Minute also um 6°.",
      `In ${m} Minuten: α = ${m} · 6° = ${alpha}°. Der Zeiger ist der Radius: r = ${num(L)} m.`,
      frage === "b" ? "Die Spitze läuft auf einem Kreisbogen: b = α : 360° · 2 · π · r." : "Der Zeiger überstreicht einen Kreisausschnitt: A = α : 360° · π · r².",
    ],
    musterloesungHtml:
      `<strong>1. Winkel:</strong> ${m} Minuten · 6° = ${alpha}°, Anteil ${alpha}° : 360° = ${num(alpha / 360, 4)}<br>` +
      (frage === "b"
        ? `<strong>2. Bogen:</strong> b = ${alpha}° : 360° · 2 · π · ${num(L)} m ≈ <strong>${zwei(richtig)} m</strong>`
        : `<strong>2. Ausschnitt:</strong> A = ${alpha}° : 360° · π · (${num(L)} m)² ≈ <strong>${zwei(richtig)} m²</strong>`),
  };
}

// ---------- Die Liste ----------
//
// Die Reihenfolge ist bedeutsam: Die Prüfung rechnet aus der laufenden Nummer die erwartete Stufe
// zurück. Wer umsortiert, zieht tests/klasse-8/test-kreis.js mit.
export const AUFGABEN = [
  { schwierigkeit: "einfach", titel: "Kreis — Umfang oder Flächeninhalt ablesen", generate: generateK1 },
  { schwierigkeit: "einfach", titel: "Kreisring — Flächeninhalt ablesen", generate: generateR1 },
  { schwierigkeit: "einfach", titel: "Kreisausschnitt — Bogen oder Fläche ablesen", generate: generateS1 },

  { schwierigkeit: "mittel", titel: "Kreis — mit Einheiten", generate: generateK2 },
  { schwierigkeit: "mittel", titel: "Kreisring — die Unterlegscheibe", generate: generateR2 },
  { schwierigkeit: "mittel", titel: "Kreisausschnitt — Fläche aus Bogen und Radius", generate: generateS2 },

  { schwierigkeit: "schwierig", titel: "Kreis — Radius oder Durchmesser aus dem Umfang", generate: generateK3 },
  { schwierigkeit: "schwierig", titel: "Kreisring — die Breite aus zwei Umfängen", generate: generateR3 },
  { schwierigkeit: "schwierig", titel: "Kreisausschnitt — der Mittelpunktswinkel", generate: generateS3 },

  { schwierigkeit: "komplex", titel: "Kreis — das Rundbogenfenster", generate: generateK4 },
  { schwierigkeit: "komplex", titel: "Kreisring — der Rohrquerschnitt", generate: generateR4 },
  { schwierigkeit: "komplex", titel: "Kreisausschnitt — der Minutenzeiger", generate: generateS4 },
];
