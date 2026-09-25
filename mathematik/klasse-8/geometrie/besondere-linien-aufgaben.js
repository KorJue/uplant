// Die zwölf Übungsaufgaben zu „Grundkonstruktionen und besondere Linien am Dreieck“ — drei je
// Schwierigkeitsstufe.
//
//   einfach   — eine Eigenschaft direkt anwenden: Mitte einer Strecke, halber Winkel, 2 : 1.
//   mittel    — eine Eigenschaft im Koordinatensystem oder mit der Winkelsumme verbinden.
//   schwierig — umkehren oder einen Winkel über Hilfsdreiecke begründen.
//   komplex   — zwei Überlegungen verketten (Flächenzerlegung, Eulersche Gerade, Winkeljagd).
//
// Was hier bewusst NICHT vorkommt: schräge Längen als Rechenergebnis. Sie bräuchten den Satz des
// Pythagoras (Klasse 9). Gerechnet wird deshalb mit Koordinaten entlang der Achsen, mit Winkeln
// und mit Verhältnissen.
//
// Alle Zahlen entstehen aus vorher gefilterten Listen, nie durch Verwerfen und Neuziehen. Die
// Werte, auf die die Fehlerhinweise anspringen, sind paarweise verschieden — sonst bekäme eine
// falsche Rechnung ein ✓ oder die Diagnose wäre mehrdeutig.

"use strict";

// ---------- Helfer (stehen in jeder Seite noch einmal) ----------

const ZAHLFORMATE = new Map();
function zahlformat(stellen) {
  let f = ZAHLFORMATE.get(stellen);
  if (!f) ZAHLFORMATE.set(stellen, (f = new Intl.NumberFormat("de-DE", { maximumFractionDigits: stellen })));
  return f;
}
// Das Vorzeichen steckt in num() selbst — eine Koordinate −3 wird als „−3“ geschrieben, mit
// echtem Minuszeichen, und nirgends einzeln nachgebessert.
export function num(x, digits = 4) {
  const f = Math.pow(10, digits);
  const gerundet = Math.round(x * f) / f;
  return zahlformat(digits).format(gerundet === 0 ? 0 : gerundet).replace("-", "−");
}
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function trifft(val, soll) {
  return Number.isFinite(val) && Number.isFinite(soll) && Math.abs(val - soll) <= 1e-6 * Math.max(1, Math.abs(soll));
}
function paarweiseVerschieden(werte, eps = 1e-9) {
  const echt = werte.filter((x) => Number.isFinite(x));
  return echt.every((x, i) => echt.every((y, j) => i === j || Math.abs(x - y) > eps));
}
// Wählt aus einer VORHER gefilterten Liste. Bleiben von vielen Kandidaten fast keine übrig,
// steht fast immer ein Wert doppelt in der Liste — dann lieber laut scheitern.
function ohneKollision(kandidaten, werte, eps) {
  const sauber = kandidaten.filter((k) => paarweiseVerschieden(werte(k), eps));
  if (kandidaten.length > 20 && sauber.length < 2) {
    throw new Error("Aufgabengenerator: fast alle Kandidaten kollidieren — vermutlich steht ein Wert doppelt in der Liste");
  }
  if (!sauber.length) throw new Error("Aufgabengenerator ohne gültige Kandidaten");
  return pick(sauber);
}
// Mehrere Felder: Kollidieren müssen die Werte nur INNERHALB eines Feldes, denn nur dort
// entscheidet die Zahl über den Hinweis.
function ohneFeldKollision(kandidaten, gruppen, eps = 1e-9) {
  const sauber = kandidaten.filter((k) => gruppen(k).every((g) => paarweiseVerschieden(g, eps)));
  if (kandidaten.length > 20 && sauber.length < 2) {
    throw new Error("Aufgabengenerator: fast alle Kandidaten kollidieren — vermutlich steht ein Wert doppelt in der Liste");
  }
  if (!sauber.length) throw new Error("Aufgabengenerator ohne gültige Kandidaten");
  return pick(sauber);
}
function glatt(x, stellen = 2) {
  const f = Math.pow(10, stellen);
  return Math.abs(Math.round(x * f) - x * f) < 1e-6;
}
// Kandidatenlisten erst beim ersten Würfeln bauen, nicht beim Laden der Seite.
function spaeter(bauen) {
  let liste = null;
  return () => (liste ??= bauen());
}
const bereich = (von, bis, schritt = 1) => {
  const out = [];
  for (let x = von; x <= bis + 1e-9; x += schritt) out.push(Math.round(x * 1000) / 1000);
  return out;
};
const P = (x, y) => `(${num(x)}&nbsp;|&nbsp;${num(y)})`;
const EINGABE = `<span class="progress-note">Gib nur die Zahl ein, ohne Einheit. Dezimaltrennzeichen ist das Komma.</span>`;
const EINGABE_GRAD = `<span class="progress-note">Gib nur die Gradzahl ein, ohne °-Zeichen.</span>`;

// ================= einfach =================

// ---------- E1: Mittelpunkt einer Strecke ----------
//
// Die Mittelsenkrechte geht durch die Mitte von AB. Im Koordinatensystem ist das der
// Mittelwert der Koordinaten — je Koordinate einzeln.
const E1_KANDIDATEN = spaeter(() => {
  const liste = [];
  for (const x1 of bereich(-4, 6)) for (const x2 of bereich(-4, 8)) for (const y1 of bereich(-3, 5)) for (const y2 of bereich(-3, 6)) {
    if (x1 === x2 || y1 === y2) continue;
    if (Math.abs(x2 - x1) < 2 || Math.abs(y2 - y1) < 2) continue;
    liste.push({ x1, y1, x2, y2 });
  }
  return liste;
});
function generateE1() {
  const k = ohneFeldKollision(E1_KANDIDATEN(), (v) => [
    [(v.x1 + v.x2) / 2, (v.x2 - v.x1) / 2, v.x1 + v.x2, v.x2 - v.x1],
    [(v.y1 + v.y2) / 2, (v.y2 - v.y1) / 2, v.y1 + v.y2, v.y2 - v.y1],
  ]);
  const { x1, y1, x2, y2 } = k;
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const hinweis = (a, b, name) => (roh, v) => {
    if (trifft(v, b - a)) return `${name}: Du hast die Differenz genommen. Die Mitte ist der <strong>Mittelwert</strong>: (${num(a)} + ${num(b)}) : 2.`;
    if (trifft(v, (b - a) / 2)) return `${name}: Das ist die halbe <em>Länge</em> in dieser Richtung, nicht die Lage der Mitte. Addiere die beiden Koordinaten und halbiere dann.`;
    if (trifft(v, a + b)) return `${name}: Die Summe stimmt — jetzt noch durch 2 teilen.`;
    return `${name}: Rechne (${num(a)} + ${num(b)}) : 2.`;
  };
  return {
    promptHtml:
      `Die Mittelsenkrechte der Strecke AB mit A${P(x1, y1)} und B${P(x2, y2)} schneidet AB im Mittelpunkt M.<br>` +
      `<strong>Bestimme die Koordinaten von M.</strong>` + EINGABE,
    felder: [
      { name: "x<sub>M</sub> =", soll: mx, toleranz: 0.001, hinweis: hinweis(x1, x2, "x-Koordinate") },
      { name: "y<sub>M</sub> =", soll: my, toleranz: 0.001, hinweis: hinweis(y1, y2, "y-Koordinate") },
    ],
    tipps: [
      "Die Mitte liegt in jeder Richtung genau zwischen den beiden Werten.",
      `x<sub>M</sub> = (x<sub>A</sub> + x<sub>B</sub>) : 2, ebenso für y.`,
    ],
    musterloesungHtml:
      `<strong>1. x-Koordinate:</strong> x<sub>M</sub> = (${num(x1)} + ${num(x2)}) : 2 = ${num(x1 + x2)} : 2 = <strong>${num(mx)}</strong><br>` +
      `<strong>2. y-Koordinate:</strong> y<sub>M</sub> = (${num(y1)} + ${num(y2)}) : 2 = ${num(y1 + y2)} : 2 = <strong>${num(my)}</strong><br>` +
      `<strong>Ergebnis:</strong> M${P(mx, my)}. Probe: Von A nach M geht es um ${num(mx - x1)} nach rechts und ${num(my - y1)} nach oben — von M nach B genauso.`,
  };
}

// ---------- E2: halber Winkel ----------
const E2_KANDIDATEN = spaeter(() => bereich(30, 170, 2).map((alpha) => ({ alpha })));
function generateE2() {
  const k = ohneKollision(E2_KANDIDATEN(), (v) => [v.alpha / 2, v.alpha, 2 * v.alpha, 90 - v.alpha / 2, 180 - v.alpha]);
  const { alpha } = k;
  const loesung = alpha / 2;
  return {
    promptHtml:
      `Ein Winkel ist <strong>α = ${num(alpha)}°</strong> groß. Seine Winkelhalbierende w<sub>α</sub> wird konstruiert.<br>` +
      `<strong>Wie groß ist der Winkel zwischen w<sub>α</sub> und einem der beiden Schenkel?</strong>` + EINGABE_GRAD,
    correct: loesung,
    tolerance: 0.01,
    placeholder: "Winkel in °",
    hinweis: (roh, v) => {
      if (trifft(v, alpha)) return "Das ist der ganze Winkel. Die Winkelhalbierende teilt ihn in <strong>zwei gleiche</strong> Teile.";
      if (trifft(v, 2 * alpha)) return "Verdoppelt statt halbiert: Die Winkelhalbierende liegt <em>im</em> Winkel, der Teilwinkel ist kleiner als α.";
      if (trifft(v, 90 - alpha / 2)) return "Das wäre der Winkel zwischen w<sub>α</sub> und einem Lot auf den Schenkel. Gefragt ist der Winkel zum Schenkel selbst.";
      if (trifft(v, 180 - alpha)) return "Das ist der Nebenwinkel von α — der liegt außerhalb des Winkelfelds.";
      return `Teile α durch 2: ${num(alpha)}° : 2.`;
    },
    tipps: ["„Halbieren“ heißt: zwei gleich große Teile."],
    musterloesungHtml:
      `Die Winkelhalbierende teilt α in zwei gleich große Winkel:<br>` +
      `${num(alpha)}° : 2 = <strong>${num(loesung)}°</strong><br>` +
      `Probe: ${num(loesung)}° + ${num(loesung)}° = ${num(alpha)}°.`,
  };
}

// ---------- E3: Schwerpunkt teilt 2 : 1 ----------
const E3_KANDIDATEN = spaeter(() => {
  const liste = [];
  for (const s of bereich(4.5, 18, 1.5)) for (const frage of ["ecke", "mitte"]) for (const seite of ["a", "b", "c"]) liste.push({ s, frage, seite });
  return liste;
});
function generateE3() {
  const k = ohneKollision(E3_KANDIDATEN(), (v) => {
    const lang = (2 * v.s) / 3, kurz = v.s / 3;
    return v.frage === "ecke" ? [lang, kurz, v.s / 2, 2 * v.s] : [kurz, lang, v.s / 2, 2 * v.s];
  });
  const { s, frage, seite } = k;
  const ecke = seite.toUpperCase();
  const lang = (2 * s) / 3, kurz = s / 3;
  const loesung = frage === "ecke" ? lang : kurz;
  const andere = frage === "ecke" ? kurz : lang;
  const gesucht = frage === "ecke" ? `die Entfernung von der Ecke ${ecke} bis zum Schwerpunkt S` : `die Entfernung vom Schwerpunkt S bis zur Seitenmitte M<sub>${seite}</sub>`;
  return {
    promptHtml:
      `In einem Dreieck ist die Seitenhalbierende <strong>s<sub>${seite}</sub> = ${num(s)} cm</strong> lang.<br>` +
      `<strong>Berechne ${gesucht}.</strong>` + EINGABE,
    correct: loesung,
    tolerance: 0.001,
    placeholder: "Länge in cm",
    hinweis: (roh, v) => {
      if (trifft(v, andere)) return frage === "ecke"
        ? "Das ist das <em>kurze</em> Stück, von S zur Seitenmitte. An der Ecke liegt das lange Stück: zwei von drei Teilen."
        : "Das ist das <em>lange</em> Stück, von der Ecke bis S. Zur Seitenmitte ist es nur ein Drittel.";
      if (trifft(v, s / 2)) return "S liegt nicht in der Mitte der Seitenhalbierenden. Er teilt sie im Verhältnis <strong>2 : 1</strong> — also in drei gleiche Teile.";
      if (trifft(v, 2 * s)) return "Das Verhältnis 2 : 1 heißt nicht „mal 2“: Die ganze Seitenhalbierende besteht aus 3 Teilen, das lange Stück aus 2 davon.";
      return `Teile ${num(s)} cm in drei gleiche Teile.`;
    },
    tipps: [
      "S teilt jede Seitenhalbierende im Verhältnis 2 : 1 — das längere Stück liegt an der Ecke.",
      `Ein Teil: ${num(s)} cm : 3 = ${num(s / 3)} cm.`,
    ],
    musterloesungHtml:
      `<strong>1. In drei Teile:</strong> ${num(s)} cm : 3 = ${num(kurz)} cm<br>` +
      `<strong>2. Verhältnis 2 : 1:</strong> Ecke bis S = 2 Teile = ${num(lang)} cm, S bis Seitenmitte = 1 Teil = ${num(kurz)} cm<br>` +
      `<strong>Ergebnis:</strong> <strong>${num(loesung)} cm</strong>. Probe: ${num(lang)} cm + ${num(kurz)} cm = ${num(s)} cm.`,
  };
}

// ================= mittel =================

// ---------- M1: Umkreismittelpunkt, rechtwinklig mit achsenparallelen Katheten ----------
//
// Die Mittelsenkrechte der waagerechten Kathete ist senkrecht, die der senkrechten Kathete
// waagerecht. Ihr Schnitt hat also die x-Koordinate der einen und die y-Koordinate der anderen
// Seitenmitte — und das ist die Mitte der dritten Seite. Kein Vorgriff auf Thales nötig.
const M1_KANDIDATEN = spaeter(() => {
  const liste = [];
  for (const cx of bereich(-3, 3)) for (const cy of bereich(-3, 3)) for (const p of [-8, -6, -4, 4, 6, 8, 10]) for (const q of [-8, -6, -4, 4, 6, 8]) {
    liste.push({ cx, cy, p, q });
  }
  return liste;
});
function generateM1() {
  const k = ohneFeldKollision(M1_KANDIDATEN(), (v) => {
    const mx = v.cx + v.p / 2, my = v.cy + v.q / 2;
    const sx = (3 * v.cx + v.p) / 3, sy = (3 * v.cy + v.q) / 3;
    return [[mx, v.cx, glatt(sx, 3) ? sx : NaN, v.cx + v.p], [my, v.cy, glatt(sy, 3) ? sy : NaN, v.cy + v.q]];
  });
  const { cx, cy, p, q } = k;
  const A = { x: cx + p, y: cy }, B = { x: cx, y: cy + q }, C = { x: cx, y: cy };
  const mx = cx + p / 2, my = cy + q / 2;
  const sx = (A.x + B.x + C.x) / 3, sy = (A.y + B.y + C.y) / 3;
  const hinweis = (soll, ecke, s, name) => (roh, v) => {
    if (trifft(v, ecke)) return `${name}: Das ist die Koordinate von C. Der Umkreismittelpunkt liegt nicht in der Ecke mit dem rechten Winkel — dort liegt der Höhenschnittpunkt.`;
    if (glatt(s, 3) && trifft(v, s)) return `${name}: Das ist der Schwerpunkt (Mittelwert aller drei Ecken). Gesucht ist der Schnitt der <em>Mittelsenkrechten</em>.`;
    return `${name}: Die Mittelsenkrechte der Kathete in dieser Richtung geht durch deren Mitte.`;
  };
  return {
    promptHtml:
      `Das Dreieck ABC hat die Ecken A${P(A.x, A.y)}, B${P(B.x, B.y)} und C${P(C.x, C.y)}. Bei C ist ein rechter Winkel.<br>` +
      `<strong>Bestimme die Koordinaten des Umkreismittelpunkts M.</strong>` + EINGABE,
    felder: [
      { name: "x<sub>M</sub> =", soll: mx, toleranz: 0.001, hinweis: hinweis(mx, cx, sx, "x-Koordinate") },
      { name: "y<sub>M</sub> =", soll: my, toleranz: 0.001, hinweis: hinweis(my, cy, sy, "y-Koordinate") },
    ],
    tipps: [
      "Die Seite CA liegt waagerecht. Ihre Mittelsenkrechte ist eine senkrechte Gerade durch die Mitte von CA.",
      "Die Seite CB liegt senkrecht. Ihre Mittelsenkrechte ist eine waagerechte Gerade durch die Mitte von CB.",
      "M ist der Schnittpunkt dieser beiden Geraden.",
    ],
    musterloesungHtml:
      `<strong>1. Mittelsenkrechte von CA:</strong> CA ist waagerecht, ihre Mitte hat x = (${num(cx)} + ${num(A.x)}) : 2 = ${num(mx)}. Die Mittelsenkrechte ist die senkrechte Gerade x = ${num(mx)}.<br>` +
      `<strong>2. Mittelsenkrechte von CB:</strong> CB ist senkrecht, ihre Mitte hat y = (${num(cy)} + ${num(B.y)}) : 2 = ${num(my)}. Die Mittelsenkrechte ist die waagerechte Gerade y = ${num(my)}.<br>` +
      `<strong>3. Schnittpunkt:</strong> <strong>M${P(mx, my)}</strong><br>` +
      `Auffällig: M ist genau die Mitte von AB, denn (${num(A.x)} + ${num(B.x)}) : 2 = ${num(mx)} und (${num(A.y)} + ${num(B.y)}) : 2 = ${num(my)}. Beim rechtwinkligen Dreieck liegt M immer auf der Mitte der längsten Seite.`,
  };
}

// ---------- M2: Schwerpunkt aus Koordinaten ----------
const M2_KANDIDATEN = spaeter(() => {
  const xs = bereich(-5, 8), ys = bereich(-4, 7);
  // Vorher gefiltert, nicht verworfen: Die Listen bestehen aus aufgezählten Tripeln, deren
  // Summe durch 3 teilbar ist.
  const liste = [];
  for (const x1 of xs) for (const x2 of xs) {
    if (x2 <= x1) continue;
    for (const x3 of xs) {
      if ((x1 + x2 + x3) % 3 !== 0 || x3 === x1 || x3 === x2) continue;
      liste.push([x1, x2, x3]);
    }
  }
  const yl = [];
  for (const y1 of ys) for (const y2 of ys) {
    if (y2 === y1) continue;
    for (const y3 of ys) {
      if ((y1 + y2 + y3) % 3 !== 0 || y3 === y1 || y3 === y2) continue;
      yl.push([y1, y2, y3]);
    }
  }
  return { xl: liste, yl };
});
function generateM2() {
  const { xl, yl } = M2_KANDIDATEN();
  // Zwei getrennte Listen statt eines Kreuzprodukts mit Hunderttausenden Einträgen: x und y
  // werden unabhängig gezogen, jede Liste für sich vorher gefiltert.
  const fehler = (t) => [(t[0] + t[1] + t[2]) / 3, (t[0] + t[1] + t[2]) / 2, t[0] + t[1] + t[2], (t[0] + t[1]) / 2];
  const tx = ohneKollision(xl, fehler);
  const ty = ohneKollision(yl, fehler);
  const A = { x: tx[0], y: ty[0] }, B = { x: tx[1], y: ty[1] }, C = { x: tx[2], y: ty[2] };
  const sx = (A.x + B.x + C.x) / 3, sy = (A.y + B.y + C.y) / 3;
  const hinweis = (t, name) => (roh, v) => {
    const summe = t[0] + t[1] + t[2];
    if (trifft(v, summe)) return `${name}: Die Summe ${num(summe)} stimmt — jetzt noch durch 3 teilen, denn es sind drei Ecken.`;
    if (trifft(v, summe / 2)) return `${name}: Durch 2 geteilt? Beim Schwerpunkt wird der Mittelwert aus <strong>drei</strong> Ecken gebildet.`;
    if (trifft(v, (t[0] + t[1]) / 2)) return `${name}: Das ist die Mitte von AB — ein Punkt der Seitenhalbierenden, aber nicht S.`;
    return `${name}: Addiere die drei Koordinaten und teile durch 3.`;
  };
  return {
    promptHtml:
      `Ein Dreieck hat die Ecken A${P(A.x, A.y)}, B${P(B.x, B.y)} und C${P(C.x, C.y)}.<br>` +
      `<strong>Bestimme die Koordinaten des Schwerpunkts S.</strong>` + EINGABE,
    felder: [
      { name: "x<sub>S</sub> =", soll: sx, toleranz: 0.001, hinweis: hinweis(tx, "x-Koordinate") },
      { name: "y<sub>S</sub> =", soll: sy, toleranz: 0.001, hinweis: hinweis(ty, "y-Koordinate") },
    ],
    tipps: ["Die Koordinaten von S sind die Mittelwerte der Eckkoordinaten — je Koordinate einzeln."],
    musterloesungHtml:
      `<strong>1. x-Koordinate:</strong> x<sub>S</sub> = (${num(A.x)} + ${num(B.x)} + ${num(C.x)}) : 3 = ${num(A.x + B.x + C.x)} : 3 = <strong>${num(sx)}</strong><br>` +
      `<strong>2. y-Koordinate:</strong> y<sub>S</sub> = (${num(A.y)} + ${num(B.y)} + ${num(C.y)}) : 3 = ${num(A.y + B.y + C.y)} : 3 = <strong>${num(sy)}</strong><br>` +
      `<strong>Ergebnis:</strong> S${P(sx, sy)}.`,
  };
}

// ---------- M3: Winkel am Inkreismittelpunkt ----------
//
// Im Dreieck BIC liegen bei B und C die halben Winkel. Mit der Winkelsumme:
// ∠BIC = 180° − (β + γ) : 2 = 90° + α : 2.
const M3_KANDIDATEN = spaeter(() => {
  const liste = [];
  for (const beta of bereich(30, 110, 2)) for (const gamma of bereich(30, 110, 2)) {
    if (beta + gamma >= 160) continue;
    liste.push({ beta, gamma });
  }
  return liste;
});
function generateM3() {
  const k = ohneKollision(M3_KANDIDATEN(), (v) => {
    const alpha = 180 - v.beta - v.gamma;
    // 90° − α : 2 ist dasselbe wie (β + γ) : 2 — der Wert steht nur einmal in der Liste, sonst
    // kollidierte jeder Kandidat mit sich selbst.
    return [180 - (v.beta + v.gamma) / 2, alpha, (v.beta + v.gamma) / 2, 180 - v.beta - v.gamma / 2];
  });
  const { beta, gamma } = k;
  const alpha = 180 - beta - gamma;
  const loesung = 180 - (beta + gamma) / 2;
  return {
    promptHtml:
      `In einem Dreieck ABC ist <strong>β = ${num(beta)}°</strong> und <strong>γ = ${num(gamma)}°</strong>. I ist der Inkreismittelpunkt.<br>` +
      `<strong>Wie groß ist der Winkel ∠BIC?</strong>` + EINGABE_GRAD,
    correct: loesung,
    tolerance: 0.01,
    placeholder: "Winkel in °",
    hinweis: (roh, v) => {
      if (trifft(v, alpha)) return "Das ist α, der Winkel bei A. Die Winkelhalbierenden halbieren β und γ — im Dreieck BIC liegen nur die <strong>Hälften</strong>.";
      if (trifft(v, (beta + gamma) / 2)) return "Das ist die Summe der beiden Winkel bei B und C im Dreieck BIC (gleich 90° − α : 2). Der dritte Winkel ergänzt sie zu 180° — ∠BIC ist immer stumpf.";
      if (trifft(v, 180 - beta - gamma / 2)) return "Bei B wurde nicht halbiert. I liegt auf <em>beiden</em> Winkelhalbierenden, also sind bei B und bei C nur die Hälften im Dreieck BIC.";
      return "Betrachte das Dreieck BIC und seine Winkel bei B und C.";
    },
    tipps: [
      "BI halbiert β, CI halbiert γ.",
      `Im Dreieck BIC sind die Winkel bei B und C also ${num(beta / 2)}° und ${num(gamma / 2)}°.`,
      "Winkelsumme im Dreieck: 180°.",
    ],
    musterloesungHtml:
      `<strong>1. Halbe Winkel:</strong> ∠IBC = β : 2 = ${num(beta / 2)}°, ∠ICB = γ : 2 = ${num(gamma / 2)}°<br>` +
      `<strong>2. Winkelsumme im Dreieck BIC:</strong> ∠BIC = 180° − ${num(beta / 2)}° − ${num(gamma / 2)}° = <strong>${num(loesung)}°</strong><br>` +
      `<strong>Probe mit der Regel:</strong> α = 180° − ${num(beta)}° − ${num(gamma)}° = ${num(alpha)}°, und 90° + α : 2 = 90° + ${num(alpha / 2)}° = ${num(loesung)}°.`,
  };
}

// ================= schwierig =================

// ---------- S1: Winkel am Höhenschnittpunkt ----------
//
// Im Viereck aus A, den Fußpunkten von h_b und h_c und H liegen zwei rechte Winkel. Der Winkel
// bei H ist deshalb 360° − 90° − 90° − α = 180° − α, und ∠BHC ist sein Scheitelwinkel.
const S1_KANDIDATEN = spaeter(() => bereich(20, 88, 1).map((alpha) => ({ alpha })));
function generateS1() {
  const k = ohneKollision(S1_KANDIDATEN(), (v) => [180 - v.alpha, v.alpha, 90 - v.alpha, 2 * v.alpha, 90 + v.alpha / 2]);
  const { alpha } = k;
  const loesung = 180 - alpha;
  return {
    promptHtml:
      `In einem spitzwinkligen Dreieck ABC ist <strong>α = ${num(alpha)}°</strong>. Die Höhen h<sub>b</sub> und h<sub>c</sub> schneiden sich im Höhenschnittpunkt H.<br>` +
      `<strong>Wie groß ist der Winkel ∠BHC?</strong>` + EINGABE_GRAD,
    correct: loesung,
    tolerance: 0.01,
    placeholder: "Winkel in °",
    hinweis: (roh, v) => {
      if (trifft(v, alpha)) return "∠BHC ist nicht gleich α — im Viereck um A liegen zwei rechte Winkel, und die vier Winkel ergeben zusammen 360°.";
      if (trifft(v, 90 - alpha)) return "90° − α ist ein Winkel in einem der rechtwinkligen Teildreiecke, etwa ∠ABH. Gesucht ist der Winkel bei H.";
      if (trifft(v, 2 * alpha)) return "2α ist der Winkel am <em>Umkreis</em>mittelpunkt, ∠BMC. Am Höhenschnittpunkt ergibt sich 180° − α.";
      if (trifft(v, 90 + alpha / 2)) return "90° + α : 2 gehört zum <em>Inkreis</em>mittelpunkt. Hier geht es um die Höhen.";
      return "Betrachte das Viereck aus A, den beiden Höhenfußpunkten und H.";
    },
    tipps: [
      "Die Höhe h<sub>b</sub> trifft AC im rechten Winkel, die Höhe h<sub>c</sub> trifft AB im rechten Winkel.",
      "Im Viereck A – Fußpunkt auf AB – H – Fußpunkt auf AC summieren sich die Winkel zu 360°.",
      "∠BHC ist der Scheitelwinkel des Viereckswinkels bei H.",
    ],
    musterloesungHtml:
      `<strong>1. Viereck um A:</strong> Ecken A, F<sub>c</sub> (Fußpunkt von h<sub>c</sub>), H, F<sub>b</sub> (Fußpunkt von h<sub>b</sub>). Bei F<sub>c</sub> und F<sub>b</sub> je 90°, bei A α = ${num(alpha)}°.<br>` +
      `<strong>2. Winkel bei H:</strong> 360° − 90° − 90° − ${num(alpha)}° = ${num(180 - alpha)}°<br>` +
      `<strong>3. Scheitelwinkel:</strong> ∠BHC liegt diesem Winkel gegenüber, also ∠BHC = <strong>${num(loesung)}°</strong>.`,
  };
}

// ---------- S2: Winkel am Umkreismittelpunkt ----------
//
// MA = MB = MC ⇒ die Dreiecke AMB, BMC, CMA sind gleichschenklig. Mit den Basiswinkeln folgt
// ∠BMC = 2α (im spitzwinkligen Dreieck). Bei α = 60° fiele 180° − α mit 2α zusammen — dort
// steht NaN in der Liste, statt den Fall zu opfern.
const S2_KANDIDATEN = spaeter(() => bereich(25, 85, 1).map((alpha) => ({ alpha })));
function generateS2() {
  const nebenwinkel = (a) => (a === 60 ? NaN : 180 - a);
  const k = ohneKollision(S2_KANDIDATEN(), (v) => [2 * v.alpha, v.alpha, nebenwinkel(v.alpha), 90 + v.alpha / 2, 360 - 2 * v.alpha]);
  const { alpha } = k;
  const loesung = 2 * alpha;
  return {
    promptHtml:
      `In einem spitzwinkligen Dreieck ABC ist <strong>α = ${num(alpha)}°</strong>. M ist der Umkreismittelpunkt.<br>` +
      `<strong>Wie groß ist der Winkel ∠BMC?</strong>` + EINGABE_GRAD,
    correct: loesung,
    tolerance: 0.01,
    placeholder: "Winkel in °",
    hinweis: (roh, v) => {
      if (trifft(v, alpha)) return "∠BMC ist größer als α: M liegt näher an BC als A, der Winkel öffnet sich weiter. Nutze die gleichschenkligen Dreiecke um M.";
      if (alpha !== 60 && trifft(v, 180 - alpha)) return "180° − α gehört zum <em>Höhen</em>schnittpunkt (∠BHC). Beim Umkreismittelpunkt verdoppelt sich α.";
      if (trifft(v, 90 + alpha / 2)) return "90° + α : 2 gehört zum <em>Inkreis</em>mittelpunkt. Hier geht es um M.";
      if (trifft(v, 360 - 2 * alpha)) return "Das ist der überstumpfe Winkel auf der anderen Seite von M. Gemeint ist der Winkel im Dreieck BMC.";
      return "Zeichne MA, MB, MC ein: Alle drei sind gleich lang.";
    },
    tipps: [
      "MA = MB = MC. Die Dreiecke AMB und AMC sind gleichschenklig.",
      "Nenne ∠MAB = x und ∠MAC = y. Dann ist α = x + y, und die Basiswinkel bei B bzw. C sind ebenfalls x bzw. y.",
      "Der Außenwinkel an M im Dreieck AMB ist 2x, im Dreieck AMC 2y.",
    ],
    musterloesungHtml:
      `<strong>1. Gleichschenklige Dreiecke:</strong> MA = MB = MC (Umkreisradius). Mit ∠MAB = x und ∠MAC = y ist α = x + y = ${num(alpha)}°.<br>` +
      `<strong>2. Basiswinkel:</strong> ∠MBA = x, ∠MCA = y.<br>` +
      `<strong>3. Winkel bei M:</strong> Verlängert man AM über M hinaus, zerlegt die Verlängerung ∠BMC in zwei Außenwinkel: 2x (Dreieck AMB) und 2y (Dreieck AMC).<br>` +
      `<strong>4. Ergebnis:</strong> ∠BMC = 2x + 2y = 2α = <strong>${num(loesung)}°</strong>.`,
  };
}

// ---------- S3: Umkehrung — aus A und S die Seitenmitte ----------
//
// S liegt auf der Seitenhalbierenden von A, und AS ist zwei Drittel davon. Von S zur Mitte ist
// es noch einmal die Hälfte von AS: M_a = S + (S − A) : 2.
const S3_KANDIDATEN = spaeter(() => {
  const liste = [];
  for (const ax of bereich(-4, 4)) for (const ay of bereich(-3, 3)) for (const dx of [-6, -4, -2, 2, 4, 6]) for (const dy of [-6, -4, -2, 2, 4, 6]) {
    liste.push({ ax, ay, dx, dy });
  }
  return liste;
});
function generateS3() {
  const k = ohneFeldKollision(S3_KANDIDATEN(), (v) => {
    const sx = v.ax + v.dx, sy = v.ay + v.dy;
    return [
      [sx + v.dx / 2, sx + v.dx, v.ax + v.dx / 2, v.ax + 3 * v.dx],
      [sy + v.dy / 2, sy + v.dy, v.ay + v.dy / 2, v.ay + 3 * v.dy],
    ];
  });
  const { ax, ay, dx, dy } = k;
  const sx = ax + dx, sy = ay + dy;
  const mx = sx + dx / 2, my = sy + dy / 2;
  const hinweis = (a, s, d, name) => (roh, v) => {
    if (trifft(v, s + d)) return `${name}: Du hast AS noch einmal angehängt — das wäre das Verhältnis 1 : 1. Von S bis zur Seitenmitte ist es nur <strong>die Hälfte</strong> von AS.`;
    if (trifft(v, a + d / 2)) return `${name}: Das ist die Mitte von AS. Gesucht ist der Punkt jenseits von S.`;
    if (trifft(v, a + 3 * d)) return `${name}: Zu weit: Die ganze Seitenhalbierende ist 1,5-mal so lang wie AS, nicht 3-mal.`;
    return `${name}: AS sind 2 Teile, bis zur Seitenmitte fehlt 1 Teil = die Hälfte von AS.`;
  };
  return {
    promptHtml:
      `Von einem Dreieck ABC kennt man die Ecke A${P(ax, ay)} und den Schwerpunkt S${P(sx, sy)}.<br>` +
      `<strong>Bestimme die Koordinaten der Mitte M<sub>a</sub> der Seite BC.</strong>` + EINGABE,
    felder: [
      { name: "x =", soll: mx, toleranz: 0.001, hinweis: hinweis(ax, sx, dx, "x-Koordinate") },
      { name: "y =", soll: my, toleranz: 0.001, hinweis: hinweis(ay, sy, dy, "y-Koordinate") },
    ],
    tipps: [
      "M<sub>a</sub> liegt auf der Geraden durch A und S, jenseits von S.",
      "AS : SM<sub>a</sub> = 2 : 1. Also ist SM<sub>a</sub> halb so lang wie AS.",
      `Von A nach S geht es ${num(dx)} in x-Richtung und ${num(dy)} in y-Richtung.`,
    ],
    musterloesungHtml:
      `<strong>1. Schritt von A nach S:</strong> Δx = ${num(sx)} − ${num(ax)} = ${num(dx)}, Δy = ${num(sy)} − ${num(ay)} = ${num(dy)}<br>` +
      `<strong>2. Verhältnis 2 : 1:</strong> Von S bis M<sub>a</sub> ist es die Hälfte davon: ${num(dx / 2)} und ${num(dy / 2)}<br>` +
      `<strong>3. Ergebnis:</strong> M<sub>a</sub>${P(mx, my)}<br>` +
      `<strong>Probe:</strong> Die ganze Seitenhalbierende AM<sub>a</sub> geht um ${num(mx - ax)} und ${num(my - ay)}; zwei Drittel davon sind ${num((2 * (mx - ax)) / 3)} und ${num((2 * (my - ay)) / 3)} — genau der Schritt von A nach S.`,
  };
}

// ================= komplex =================

// ---------- K1: Inkreisradius aus Flächeninhalt und Umfang ----------
//
// Die Strecken von I zu den Ecken zerlegen das Dreieck in drei Teildreiecke mit den Seiten a, b,
// c als Grundseiten und jeweils der Höhe ρ. Also A = ½ · ρ · (a + b + c) und ρ = 2A : u.
// Die Dreiecke haben ganzzahlige Seiten UND ganzzahligen Flächeninhalt (heronsche Dreiecke) —
// den Flächeninhalt nennt die Aufgabe, gerechnet wird er hier nicht.
const HERON = [
  [3, 4, 5, 6], [5, 5, 6, 12], [5, 5, 8, 12], [5, 12, 13, 30], [6, 8, 10, 24], [9, 12, 15, 54],
  [13, 14, 15, 84], [10, 10, 12, 48], [7, 15, 20, 42], [9, 10, 17, 36], [8, 15, 17, 60],
  [10, 13, 13, 60], [12, 16, 20, 96], [5, 29, 30, 72], [10, 17, 21, 84], [13, 13, 24, 60],
  [4, 13, 15, 24], [11, 13, 20, 66], [17, 17, 16, 120], [7, 24, 25, 84], [20, 21, 29, 210], [6, 25, 29, 60], [3, 25, 26, 36], [15, 15, 24, 108], [15, 15, 18, 108],
];
const K1_KANDIDATEN = spaeter(() => {
  const liste = [];
  for (const [a, b, c, A] of HERON) {
    for (const f of [1, 2, 0.5]) {
      const s = [a * f, b * f, c * f], F = A * f * f;
      const u = s[0] + s[1] + s[2];
      const rho = (2 * F) / u;
      if (!glatt(rho, 2)) continue;
      liste.push({ s, F, u, rho });
    }
  }
  return liste;
});
function generateK1() {
  const k = ohneKollision(K1_KANDIDATEN(), (v) => [v.rho, v.F / v.u, (2 * v.F) / v.s[0], (2 * v.F) / v.s[1], (2 * v.F) / v.s[2], v.u / 2]);
  const { s, F, u, rho } = k;
  return {
    promptHtml:
      `Ein Dreieck hat die Seiten <strong>a = ${num(s[0])} cm</strong>, <strong>b = ${num(s[1])} cm</strong> und <strong>c = ${num(s[2])} cm</strong> ` +
      `und den Flächeninhalt <strong>A = ${num(F)} cm²</strong>.<br>` +
      `<strong>Berechne den Inkreisradius ρ.</strong>` +
      `<span class="progress-note">Tipp zur Idee: Verbinde I mit den drei Ecken. Gib nur die Zahl in cm ein.</span>`,
    correct: rho,
    tolerance: 0.005,
    placeholder: "ρ in cm",
    hinweis: (roh, v) => {
      if (trifft(v, F / u)) return "Der Faktor ½ ist verloren gegangen: Jedes Teildreieck hat den Flächeninhalt ½ · Seite · ρ. Also A = ½ · ρ · u, und ρ = 2 · A : u.";
      for (const [i, n] of [[0, "a"], [1, "b"], [2, "c"]]) {
        if (trifft(v, (2 * F) / s[i])) return `Das ist die Höhe h<sub>${n}</sub> auf die Seite ${n}. Der Inkreisradius ist der Abstand von I zu <em>allen drei</em> Seiten — deshalb steht im Nenner der ganze Umfang.`;
      }
      if (trifft(v, u / 2)) return "Das ist der halbe Umfang. Er gehört in den Nenner: ρ = A : (u : 2).";
      return "Zerlege das Dreieck von I aus in drei Teildreiecke, jedes mit der Höhe ρ.";
    },
    tipps: [
      "Die Strecken IA, IB und IC zerlegen das Dreieck in drei Teildreiecke.",
      "Jedes Teildreieck hat eine Seite des Dreiecks als Grundseite — und die Höhe ρ, denn ρ ist der Abstand von I zu jeder Seite.",
      "A = ½ · a · ρ + ½ · b · ρ + ½ · c · ρ = ½ · ρ · u.",
    ],
    musterloesungHtml:
      `<strong>1. Zerlegen:</strong> A = ½ · a · ρ + ½ · b · ρ + ½ · c · ρ = ½ · ρ · (a + b + c)<br>` +
      `<strong>2. Umfang:</strong> u = ${num(s[0])} + ${num(s[1])} + ${num(s[2])} = ${num(u)} cm<br>` +
      `<strong>3. Umstellen:</strong> ρ = 2 · A : u = 2 · ${num(F)} : ${num(u)} = <strong>${num(rho)} cm</strong><br>` +
      `<strong>Probe:</strong> ½ · ${num(rho)} · ${num(u)} = ${num(0.5 * rho * u)} cm² ✓`,
  };
}

// ---------- K2: Eulersche Gerade — S aus M und H ----------
//
// S liegt auf MH und teilt die Strecke im Verhältnis MS : SH = 1 : 2. Also S = M + (H − M) : 3.
const K2_KANDIDATEN = spaeter(() => {
  const liste = [];
  for (const mx of bereich(-4, 4)) for (const my of bereich(-3, 3)) for (const dx of [-9, -6, -3, 3, 6, 9]) for (const dy of [-9, -6, -3, 3, 6]) {
    liste.push({ mx, my, dx, dy });
  }
  return liste;
});
function generateK2() {
  const k = ohneFeldKollision(K2_KANDIDATEN(), (v) => [
    [v.mx + v.dx / 3, v.mx + v.dx / 2, v.mx + (2 * v.dx) / 3],
    [v.my + v.dy / 3, v.my + v.dy / 2, v.my + (2 * v.dy) / 3],
  ]);
  const { mx, my, dx, dy } = k;
  const hx = mx + dx, hy = my + dy;
  const sx = mx + dx / 3, sy = my + dy / 3;
  const hinweis = (m, d, name) => (roh, v) => {
    if (trifft(v, m + d / 2)) return `${name}: Das ist die Mitte von MH. S teilt MH aber im Verhältnis <strong>1 : 2</strong>, nicht 1 : 1.`;
    if (trifft(v, m + (2 * d) / 3)) return `${name}: Umgekehrt: S liegt näher an <strong>M</strong>. MS ist ein Drittel, SH zwei Drittel von MH.`;
    return `${name}: Gehe von M aus ein Drittel des Weges nach H.`;
  };
  return {
    promptHtml:
      `In einem Dreieck liegt der Umkreismittelpunkt bei M${P(mx, my)} und der Höhenschnittpunkt bei H${P(hx, hy)}.<br>` +
      `<strong>Bestimme die Koordinaten des Schwerpunkts S.</strong>` + EINGABE,
    felder: [
      { name: "x<sub>S</sub> =", soll: sx, toleranz: 0.001, hinweis: hinweis(mx, dx, "x-Koordinate") },
      { name: "y<sub>S</sub> =", soll: sy, toleranz: 0.001, hinweis: hinweis(my, dy, "y-Koordinate") },
    ],
    tipps: [
      "M, S und H liegen auf der Eulerschen Geraden.",
      "SH ist doppelt so lang wie MS — S liegt also bei einem Drittel des Weges von M nach H.",
    ],
    musterloesungHtml:
      `<strong>1. Weg von M nach H:</strong> Δx = ${num(hx)} − ${num(mx)} = ${num(dx)}, Δy = ${num(hy)} − ${num(my)} = ${num(dy)}<br>` +
      `<strong>2. Ein Drittel davon:</strong> ${num(dx / 3)} und ${num(dy / 3)}<br>` +
      `<strong>3. Ergebnis:</strong> S${P(sx, sy)}<br>` +
      `<strong>Probe:</strong> Von S nach H sind es ${num(hx - sx)} und ${num(hy - sy)} — doppelt so viel wie von M nach S.`,
  };
}

// ---------- K3: Winkel zwischen Höhe und Winkelhalbierender ----------
//
// Beide gehen von C aus. Die Höhe h_c bildet mit CA den Winkel 90° − α (rechtwinkliges
// Teildreieck), die Winkelhalbierende den Winkel γ : 2. Die Differenz ist |α − β| : 2.
// Spitzwinklig und α ≠ β: sonst läge die Höhe außen bzw. fielen beide Linien zusammen.
const K3_KANDIDATEN = spaeter(() => {
  const liste = [];
  for (const alpha of bereich(30, 88, 2)) for (const beta of bereich(30, 88, 2)) {
    const gamma = 180 - alpha - beta;
    if (alpha === beta || gamma >= 90 || gamma < 20) continue;
    liste.push({ alpha, beta });
  }
  return liste;
});
function generateK3() {
  const k = ohneKollision(K3_KANDIDATEN(), (v) => {
    const gamma = 180 - v.alpha - v.beta;
    return [Math.abs(v.alpha - v.beta) / 2, Math.abs(v.alpha - v.beta), gamma / 2, 90 - v.alpha, (v.alpha + v.beta) / 2];
  });
  const { alpha, beta } = k;
  const gamma = 180 - alpha - beta;
  const loesung = Math.abs(alpha - beta) / 2;
  return {
    promptHtml:
      `In einem spitzwinkligen Dreieck ABC ist <strong>α = ${num(alpha)}°</strong> und <strong>β = ${num(beta)}°</strong>. ` +
      `Von C aus werden die Höhe h<sub>c</sub> und die Winkelhalbierende w<sub>γ</sub> gezeichnet.<br>` +
      `<strong>Wie groß ist der Winkel zwischen h<sub>c</sub> und w<sub>γ</sub>?</strong>` + EINGABE_GRAD,
    correct: loesung,
    tolerance: 0.01,
    placeholder: "Winkel in °",
    hinweis: (roh, v) => {
      if (trifft(v, Math.abs(alpha - beta))) return "Die Differenz von α und β ist richtig angesetzt — aber es kommt nur die <strong>Hälfte</strong> davon heraus. Rechne beide Winkel an CA getrennt aus.";
      if (trifft(v, gamma / 2)) return "Das ist der Winkel zwischen w<sub>γ</sub> und der Seite CA. Davon geht noch der Winkel zwischen h<sub>c</sub> und CA ab.";
      if (trifft(v, 90 - alpha)) return "Das ist der Winkel zwischen h<sub>c</sub> und der Seite CA. Vergleiche ihn mit dem Winkel zwischen w<sub>γ</sub> und CA.";
      if (trifft(v, (alpha + beta) / 2)) return "Addiert statt subtrahiert: Gesucht ist der <em>Unterschied</em> zweier Winkel an derselben Seite.";
      return "Miss beide Linien gegen dieselbe Seite CA.";
    },
    tipps: [
      "γ = 180° − α − β.",
      "Im rechtwinkligen Dreieck aus A, C und dem Fußpunkt von h<sub>c</sub>: Winkel zwischen CA und h<sub>c</sub> = 90° − α.",
      "Winkel zwischen CA und w<sub>γ</sub> = γ : 2. Gesucht ist der Unterschied.",
    ],
    musterloesungHtml:
      `<strong>1. Dritter Winkel:</strong> γ = 180° − ${num(alpha)}° − ${num(beta)}° = ${num(gamma)}°<br>` +
      `<strong>2. Höhe gegen CA:</strong> 90° − α = ${num(90 - alpha)}°<br>` +
      `<strong>3. Winkelhalbierende gegen CA:</strong> γ : 2 = ${num(gamma / 2)}°<br>` +
      `<strong>4. Unterschied:</strong> |${num(gamma / 2)}° − ${num(90 - alpha)}°| = <strong>${num(loesung)}°</strong><br>` +
      `Allgemein ergibt sich |α − β| : 2 = |${num(alpha)}° − ${num(beta)}°| : 2 = ${num(loesung)}°. Im gleichschenkligen Dreieck (α = β) fallen Höhe und Winkelhalbierende zusammen.`,
  };
}

// Die Reihenfolge ist die der Reiter: drei je Stufe. Die Prüfung rechnet aus der Nummer die
// Stufe zurück — wer umsortiert, muss sie mitziehen.
export const AUFGABEN = [
  { schwierigkeit: "einfach", titel: "Mittelpunkt einer Strecke", generate: generateE1 },
  { schwierigkeit: "einfach", titel: "Die Winkelhalbierende halbiert", generate: generateE2 },
  { schwierigkeit: "einfach", titel: "Der Schwerpunkt teilt 2 : 1", generate: generateE3 },
  { schwierigkeit: "mittel", titel: "Umkreismittelpunkt im Koordinatensystem", generate: generateM1 },
  { schwierigkeit: "mittel", titel: "Schwerpunkt aus den Ecken", generate: generateM2 },
  { schwierigkeit: "mittel", titel: "Der Winkel am Inkreismittelpunkt", generate: generateM3 },
  { schwierigkeit: "schwierig", titel: "Der Winkel am Höhenschnittpunkt", generate: generateS1 },
  { schwierigkeit: "schwierig", titel: "Der Winkel am Umkreismittelpunkt", generate: generateS2 },
  { schwierigkeit: "schwierig", titel: "Rückwärts: aus Ecke und Schwerpunkt die Seitenmitte", generate: generateS3 },
  { schwierigkeit: "komplex", titel: "Inkreisradius aus Fläche und Umfang", generate: generateK1 },
  { schwierigkeit: "komplex", titel: "Die Eulersche Gerade", generate: generateK2 },
  { schwierigkeit: "komplex", titel: "Höhe und Winkelhalbierende von derselben Ecke", generate: generateK3 },
];
