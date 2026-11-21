// Die acht Übungsaufgaben zu „Prismen: Netz und Schrägbild“ — zwei je Stufe:
//   einfach   — Ecken, Kanten, Flächen zählen; Längen im Schrägbild
//   mittel    — Würfelnetz: welche Fläche liegt gegenüber?; Quadernetz: Maße ablesen
//   schwierig — Kantenmodell rückwärts (Höhe aus der Drahtlänge); Prisma aus einer Anzahl erkennen
//   komplex   — Kantenmodell nach einem Schrägbild; Mantel eines liegenden Prismas
//
// Die Figuren tragen ihre Maße (wie im Buch); die Prüfung liest sie aus dem SVG zurück. Alle Zahlen
// kommen aus vorher gefilterten Listen, nie durch Verwerfen und Neuziehen. Schräge Seiten gehören zu
// Dreiecken mit 3, 4 und 5 Teilen — gegeben, nicht berechnet (der Satz des Pythagoras kommt in Klasse 9).

import { num, pick, trifft, ohneKollision, spaeter } from "./seite.js?v=1";
import * as R from "./raum.js?v=1";

const N_NAME = { 3: "Dreieck", 4: "Viereck", 5: "Fünfeck", 6: "Sechseck", 7: "Siebeneck", 8: "Achteck", 9: "Neuneck", 10: "Zehneck", 12: "Zwölfeck" };
const cm = (x) => `${num(x)} cm`;
const gleich = (w, x) => trifft(w, x, 0.01);
const KAV = R.kavalier();

// ---------- A1: Ecken, Kanten und Flächen ----------

const hinweisEcken = (n) => (roh, w) =>
  gleich(w, n) ? `Das sind nur die Ecken der Grundfläche. Die Deckfläche hat noch einmal ${n} Ecken: 2 · ${n}.`
    : gleich(w, 3 * n) ? "Das ist die Zahl der Kanten. Ecken sind die Punkte, an denen Kanten zusammenstoßen — je eine Ecke der Grundfläche unten und oben."
      : gleich(w, n + 2) ? "Das ist die Zahl der Flächen. Gezählt sind die Ecken: die der Grundfläche und die der Deckfläche."
        : "";
const hinweisKanten = (n) => (roh, w) =>
  gleich(w, 2 * n) ? `Du hast die Kanten von Grund- und Deckfläche gezählt. Dazu kommen die ${n} Seitenkanten, die die beiden verbinden: 3 · ${n}.`
    : gleich(w, n) ? `Das sind nur die Kanten einer Grundfläche. Es gibt ${n} unten, ${n} oben und ${n} Seitenkanten.`
      : gleich(w, 4 * n) ? "Du hast für jede Seitenfläche vier Kanten gezählt. Aber jede Seitenkante gehört zu zwei Seitenflächen und zählt nur einmal."
        : "";
const hinweisFlaechen = (n) => (roh, w) =>
  gleich(w, n) ? `Das sind nur die Seitenflächen. Grund- und Deckfläche kommen dazu: ${n} + 2.`
    : gleich(w, n + 1) ? "Es gibt zwei Grundflächen — die Grundfläche unten und die Deckfläche oben. Beide zählen."
      : gleich(w, 2) ? `Das sind nur Grund- und Deckfläche. Dazu kommen die ${n} rechteckigen Seitenflächen.`
        : "";

const A1 = {
  schwierigkeit: "einfach",
  titel: "Ecken, Kanten und Flächen",
  abschnitt: "sec-prisma",
  generate() {
    const n = pick([3, 4, 5, 6, 7, 8, 9, 10, 12]);
    return {
      promptHtml: `Ein Prisma hat ein <strong>${N_NAME[n]}</strong> als Grundfläche. Wie viele Ecken, Kanten und Flächen hat es?`,
      felder: [
        { name: "Ecken", soll: 2 * n, toleranz: 0.01, platzhalter: "Anzahl", hinweis: hinweisEcken(n) },
        { name: "Kanten", soll: 3 * n, toleranz: 0.01, platzhalter: "Anzahl", hinweis: hinweisKanten(n) },
        { name: "Flächen", soll: n + 2, toleranz: 0.01, platzhalter: "Anzahl", hinweis: hinweisFlaechen(n) },
      ],
      tipps: [
        `Ein ${N_NAME[n]} hat ${n} Ecken. Das Prisma hat eine solche Fläche unten und eine oben.`,
        "Kanten: unten, oben und dazwischen die senkrechten Seitenkanten. Flächen: zwei Grundflächen und für jede Seite ein Rechteck.",
      ],
      musterloesungHtml:
        `Die Grundfläche ist ein ${N_NAME[n]}: n = ${n}.<br>` +
        `<strong>Ecken:</strong> ${n} unten + ${n} oben = 2 · ${n} = <strong>${2 * n}</strong><br>` +
        `<strong>Kanten:</strong> ${n} unten + ${n} oben + ${n} Seitenkanten = 3 · ${n} = <strong>${3 * n}</strong><br>` +
        `<strong>Flächen:</strong> 2 Grundflächen + ${n} Seitenflächen = ${n} + 2 = <strong>${n + 2}</strong>`,
    };
  },
};

// ---------- A2: Längen im Schrägbild ----------

const A2 = {
  schwierigkeit: "einfach",
  titel: "Längen im Schrägbild",
  abschnitt: "sec-schraegbild",
  generate() {
    const a = pick([2, 3, 4, 5, 6, 7, 8]), b = pick([2, 3, 4, 5, 6]), c = pick([2, 3, 4, 5, 6, 7, 8, 9, 10]);
    const wahr = "Die Vorderfläche wird in wahrer Größe gezeichnet — verkürzt werden nur die Kanten, die nach hinten laufen.";
    return {
      promptHtml: `Ein Quader ist ${cm(a)} breit, ${cm(b)} hoch und ${cm(c)} tief. Du zeichnest sein Schrägbild so, dass die Fläche ${cm(a)} × ${cm(b)} vorn steht. Wie lang zeichnest du Breite, Höhe und Tiefe?`,
      felder: [
        { name: "Breite im Bild", einheit: "cm", soll: a, toleranz: 0.01, hinweis: (r, w) => (gleich(w, a / 2) ? wahr : "") },
        { name: "Höhe im Bild", einheit: "cm", soll: b, toleranz: 0.01, hinweis: (r, w) => (gleich(w, b / 2) ? wahr : "") },
        {
          name: "Tiefe im Bild", einheit: "cm", soll: c / 2, toleranz: 0.01,
          hinweis: (r, w) => (gleich(w, c) ? `Die Tiefe wird im Schrägbild nicht in wahrer Größe gezeichnet, sondern halb so lang: ${num(c)} : 2.`
            : gleich(w, 2 * c) ? `Verkürzt heißt halbiert, nicht verdoppelt: ${num(c)} : 2.` : ""),
        },
      ],
      tipps: ["Welche Kanten laufen nach hinten? Nur sie werden verkürzt.", "Nach hinten: unter 45° und halb so lang wie in Wirklichkeit."],
      musterloesungHtml:
        `Die Vorderfläche ${cm(a)} × ${cm(b)} steht in wahrer Größe: <strong>Breite ${cm(a)}</strong>, <strong>Höhe ${cm(b)}</strong>.<br>` +
        `Die Tiefe läuft nach hinten: unter 45° und halb so lang, ${num(c)} cm : 2 = <strong>${cm(c / 2)}</strong>.`,
    };
  },
};

// ---------- A3: Würfelnetz — gegenüberliegende Fläche ----------

// Die elf Würfelnetze als Kästchen [Spalte, Zeile].
const WUERFELNETZE = [
  [[0, 0], [0, 1], [1, 1], [2, 1], [3, 1], [0, 2]],
  [[0, 0], [0, 1], [1, 1], [2, 1], [3, 1], [1, 2]],
  [[0, 0], [0, 1], [1, 1], [2, 1], [3, 1], [2, 2]],
  [[0, 0], [0, 1], [1, 1], [2, 1], [3, 1], [3, 2]],
  [[1, 0], [0, 1], [1, 1], [2, 1], [3, 1], [1, 2]],
  [[1, 0], [0, 1], [1, 1], [2, 1], [3, 1], [2, 2]],
  [[0, 0], [1, 0], [1, 1], [2, 1], [3, 1], [1, 2]],
  [[0, 0], [1, 0], [1, 1], [2, 1], [3, 1], [2, 2]],
  [[0, 0], [1, 0], [1, 1], [2, 1], [3, 1], [3, 2]],
  [[0, 0], [1, 0], [1, 1], [2, 1], [2, 2], [3, 2]],
  [[0, 0], [1, 0], [2, 0], [2, 1], [3, 1], [4, 1]],
];
// Gedreht (k mod 4 Vierteldrehungen) und gespiegelt (k ≥ 4).
function lage(zellen, k) {
  let z = zellen.map(([c, r]) => (k >= 4 ? [-c, r] : [c, r]));
  for (let i = 0; i < k % 4; i++) z = z.map(([c, r]) => [-r, c]);
  const c0 = Math.min(...z.map((p) => p[0])), r0 = Math.min(...z.map((p) => p[1]));
  return z.map(([c, r]) => [c - c0, r - r0]);
}
// Falten durch Abrollen: Der Würfel liegt auf Kästchen 0 und rollt über die Nachbarkästchen. Jedes
// Kästchen bekommt die Würfelseite, die beim Abrollen unten liegt. Gegenüber liegen 0/1, 2/3, 4/5.
function wuerfelSeiten(zellen) {
  const k = (c, r) => `${c},${r}`;
  const nr = new Map(zellen.map(([c, r], i) => [k(c, r), i]));
  const seite = new Array(zellen.length);
  const ROLLEN = [
    [1, 0, (o) => ({ U: o.O, O: o.D, D: o.W, W: o.U, N: o.N, S: o.S })],
    [-1, 0, (o) => ({ U: o.W, W: o.D, D: o.O, O: o.U, N: o.N, S: o.S })],
    [0, -1, (o) => ({ U: o.N, N: o.D, D: o.S, S: o.U, O: o.O, W: o.W })],
    [0, 1, (o) => ({ U: o.S, S: o.D, D: o.N, N: o.U, O: o.O, W: o.W })],
  ];   // U unten, D oben, N/S hinten/vorn, O/W rechts/links
  const start = { U: 0, D: 1, N: 2, S: 3, O: 4, W: 5 };
  seite[0] = 0;
  const offen = [[0, start]];
  while (offen.length) {
    const [i, o] = offen.shift();
    const [c, r] = zellen[i];
    for (const [dc, dr, roll] of ROLLEN) {
      const j = nr.get(k(c + dc, r + dr));
      if (j === undefined || seite[j] !== undefined) continue;
      const neu = roll(o);
      seite[j] = neu.U;
      offen.push([j, neu]);
    }
  }
  return seite;
}
function gemischt(liste) {
  const a = liste.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const benachbartImNetz = (p, q) => Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]) === 1;

function wuerfelnetzSvg(zellen, buchstaben, markiert) {
  const Z = 42, rand = 8;
  const sp = Math.max(...zellen.map((p) => p[0])) + 1, ze = Math.max(...zellen.map((p) => p[1])) + 1;
  const breite = sp * Z + 2 * rand, hoehe = ze * Z + 2 * rand;
  let s = `<svg viewBox="0 0 ${breite} ${hoehe}" width="${breite}" height="${hoehe}" class="kp-aufgaben-figur" data-figur="wuerfelnetz" role="img" aria-label="Würfelnetz">`;
  zellen.forEach(([c, r], i) => {
    const x = rand + c * Z, y = rand + r * Z;
    s += `<rect x="${x}" y="${y}" width="${Z}" height="${Z}" class="${i === markiert ? "kp-g" : "kp-m"}" data-rolle="feld" data-zelle="${c},${r}" data-buchstabe="${buchstaben[i]}"/>`;
    s += `<text x="${x + Z / 2}" y="${y + Z / 2 + 6}" text-anchor="middle" class="kp-figur-name">${buchstaben[i]}</text>`;
  });
  return s + "</svg>";
}

const A3 = {
  schwierigkeit: "mittel",
  titel: "Würfelnetz: Was liegt gegenüber?",
  abschnitt: "sec-netz",
  generate() {
    const zellen = lage(pick(WUERFELNETZE), Math.floor(Math.random() * 8));
    const buchstaben = gemischt("ABCDEF".split(""));
    const seite = wuerfelSeiten(zellen);
    const x = Math.floor(Math.random() * 6);
    const gegen = seite.indexOf(seite[x] ^ 1);
    const X = buchstaben[x], Y = buchstaben[gegen];
    return {
      promptHtml: `Das Netz wird zu einem Würfel gefaltet. Welche Fläche liegt dann der blauen Fläche <strong>${X}</strong> gegenüber?` +
        wuerfelnetzSvg(zellen, buchstaben, x),
      placeholder: "Buchstabe",
      check: (roh) => roh.trim().toUpperCase() === Y,
      hinweis(roh) {
        const B = roh.trim().toUpperCase();
        const j = buchstaben.indexOf(B);
        if (j < 0) return "Gib den Buchstaben einer Fläche des Netzes ein, A bis F.";
        if (j === x) return `${X} ist die Fläche selbst. Gesucht ist die Fläche, die beim gefalteten Würfel auf der anderen Seite liegt.`;
        return benachbartImNetz(zellen[j], zellen[x])
          ? `${B} liegt im Netz direkt neben ${X}. Beim Falten klappt sie an der gemeinsamen Kante hoch und wird eine Nachbarfläche von ${X}, keine gegenüberliegende.`
          : `${B} liegt im Netz zwar nicht neben ${X}, aber beim Falten stoßen die beiden an einer Kante zusammen: ${B} wird eine Nachbarfläche von ${X}.`;
      },
      tipps: [
        "Liegen drei Flächen in einer Reihe, so liegen die beiden äußeren einander gegenüber.",
        `Stell dir vor, ${X} liegt unten. Welche Flächen klappen als Seitenwände hoch? Die übrig bleibende liegt oben.`,
      ],
      musterloesungHtml:
        `Liegt ${X} unten, klappen die vier Nachbarflächen ${buchstaben.filter((_, i) => i !== x && i !== gegen).join(", ")} als Wände hoch, und oben schließt <strong>${Y}</strong> den Würfel. ` +
        `Gegenüber von ${X} liegt also <strong>${Y}</strong>.`,
    };
  },
};

// ---------- A4: Quadernetz — Maße ablesen ----------

function quadernetzSvg(a, b, c) {
  const S = 14, rand = 26, links = 34;
  const breite = (2 * a + 2 * b) * S + links + rand, hoehe = (c + 2 * b) * S + 2 * rand + 12;
  const X = (x) => links + x * S, Y = (y) => rand + 12 + y * S;
  const rechteck = (x, y, w, h, rolle, klasse) => `<rect x="${X(x)}" y="${Y(y)}" width="${w * S}" height="${h * S}" class="${klasse}" data-rolle="${rolle}"/>`;
  let s = `<svg viewBox="0 0 ${breite} ${hoehe}" width="${breite}" height="${hoehe}" class="kp-aufgaben-figur" data-figur="quadernetz" role="img" aria-label="Netz eines Quaders">`;
  s += rechteck(0, b, b, c, "seite-links", "kp-m");
  s += rechteck(b, b, a, c, "vorn", "kp-m");
  s += rechteck(b + a, b, b, c, "seite-rechts", "kp-m");
  s += rechteck(2 * b + a, b, a, c, "hinten", "kp-m");
  s += rechteck(b, 0, a, b, "oben", "kp-g");
  s += rechteck(b, b + c, a, b, "unten", "kp-g");
  // Maße dort, wo darunter nichts hängt: a unter der Rückseite, b unter der linken Seite, c links.
  s += `<text x="${X(2 * b + 1.5 * a)}" y="${Y(b + c) + 16}" text-anchor="middle" class="kp-figur-mass" data-rolle="mass-a">${num(a)} cm</text>`;
  s += `<text x="${X(b / 2)}" y="${Y(b + c) + 16}" text-anchor="middle" class="kp-figur-mass" data-rolle="mass-b">${num(b)} cm</text>`;
  s += `<text x="${X(0) - 5}" y="${Y(b + c / 2) + 5}" text-anchor="end" class="kp-figur-mass" data-rolle="mass-c">${num(c)} cm</text>`;
  // Die gesuchten Maße: x über die ganze Breite (über der Deckfläche), y über die ganze Höhe.
  s += `<line x1="${X(0)}" y1="${Y(0) - 8}" x2="${X(2 * a + 2 * b)}" y2="${Y(0) - 8}" class="kp-hilfe" data-rolle="pfeil-x"/>`;
  s += `<text x="${X(2 * b + a + a / 2)}" y="${Y(0) - 12}" text-anchor="middle" class="kp-figur-name" data-rolle="name-x">x</text>`;
  s += `<line x1="${X(2 * a + 2 * b) + 8}" y1="${Y(0)}" x2="${X(2 * a + 2 * b) + 8}" y2="${Y(c + 2 * b)}" class="kp-hilfe" data-rolle="pfeil-y"/>`;
  return s + `<text x="${X(2 * a + 2 * b) + 14}" y="${Y(b / 2) + 5}" text-anchor="start" class="kp-figur-name" data-rolle="name-y">y</text></svg>`;
}

const A4 = {
  schwierigkeit: "mittel",
  titel: "Quadernetz: Maße ablesen",
  abschnitt: "sec-netz",
  generate() {
    const a = pick([3, 4, 5, 6]), c = pick([2, 3, 4, 5]);
    const b = pick([1, 2, 3, 4].filter((x) => x !== a));
    return {
      promptHtml: `Das Netz eines Quaders ist maßstäblich gezeichnet; drei Maße stehen daran. Wie lang sind die Strecken x und y — also wie groß muss ein Blatt mindestens sein, damit das Netz darauf passt?` +
        quadernetzSvg(a, b, c),
      felder: [
        {
          name: "x", einheit: "cm", soll: 2 * a + 2 * b, toleranz: 0.01,
          hinweis: (r, w) => (gleich(w, a + b) ? "Das sind nur zwei Flächen des Streifens. Er besteht aus vier: zwei Seitenflächen und zwei lange Flächen."
            : gleich(w, 2 * a + b) || gleich(w, a + 2 * b) ? "Zähl noch einmal die Flächen im Streifen: Zwei sind so breit wie die lange Seite, zwei so breit wie die schmale." : ""),
        },
        {
          name: "y", einheit: "cm", soll: c + 2 * b, toleranz: 0.01,
          hinweis: (r, w) => (gleich(w, c + b) ? "Oben UND unten hängt je eine Fläche am Streifen."
            : gleich(w, c + 2 * a) ? `Die Flächen oben und unten sind ${cm(a)} lang, aber nur ${cm(b)} breit — im Netz ragen sie ${cm(b)} über den Streifen hinaus.`
              : gleich(w, c) ? "Das ist nur die Höhe des Streifens. Darüber und darunter hängt noch je eine Fläche." : ""),
        },
      ],
      tipps: [
        "Welche Kanten des Quaders stoßen beim Falten zusammen? Gleich lange Seiten gehören zusammen.",
        "Die blauen Flächen sind so lang wie die Fläche, an der sie hängen, und so breit wie die schmalen Seitenflächen.",
      ],
      musterloesungHtml:
        `Der Quader ist ${cm(a)} lang, ${cm(b)} breit und ${cm(c)} hoch.<br>` +
        `<strong>x:</strong> Im Streifen liegen zwei Flächen ${cm(a)} breit und zwei ${cm(b)} breit: x = 2 · ${num(a)} cm + 2 · ${num(b)} cm = <strong>${cm(2 * a + 2 * b)}</strong>.<br>` +
        `<strong>y:</strong> Der Streifen ist ${cm(c)} hoch; oben und unten hängt je eine Fläche ${cm(a)} × ${cm(b)}, die ${cm(b)} hinausragt: y = ${num(c)} cm + 2 · ${num(b)} cm = <strong>${cm(c + 2 * b)}</strong>.`,
    };
  },
};

// ---------- A5: Kantenmodell rückwärts ----------

const DREIECKE = spaeter(() => {
  const out = [];
  for (let a = 3; a <= 12; a++) for (let b = a; b <= 12; b++) for (let c = b; c <= 12; c++) if (a + b > c && c > a) out.push([a, b, c]);
  return out;
});
function grundflaecheZumDraht() {
  const art = pick(["dreieck", "rechteck", "sechseck"]);
  if (art === "dreieck") {
    const s = pick(DREIECKE());
    return { n: 3, u: s[0] + s[1] + s[2], text: `ein Dreieck mit den Seiten ${s.map(num).join(" cm, ")} cm`, rechnung: s.map(num).join(" cm + ") + " cm" };
  }
  if (art === "rechteck") {
    const a = pick([3, 4, 5, 6, 7, 8, 9, 10]), b = pick([2, 3, 4, 5, 6].filter((x) => x !== a));
    return { n: 4, u: 2 * a + 2 * b, text: `ein Rechteck mit den Seiten ${cm(a)} und ${cm(b)}`, rechnung: `2 · ${num(a)} cm + 2 · ${num(b)} cm` };
  }
  const s = pick([2, 3, 4, 5, 6]);
  return { n: 6, u: 6 * s, text: `ein Sechseck mit sechs gleich langen Seiten von je ${cm(s)}`, rechnung: `6 · ${num(s)} cm` };
}

const A5 = {
  schwierigkeit: "schwierig",
  titel: "Kantenmodell rückwärts",
  abschnitt: "sec-prisma",
  generate() {
    // Erst Grundfläche und Höhe, dann die Drahtlänge daraus — so geht die Höhe immer glatt auf. Je
    // Grundfläche fallen höchstens zwei Höhen durch die Kollisionsprüfung (wenn zwei Fehlerwerte
    // zusammenfallen), es bleiben immer genug.
    const g = grundflaecheZumDraht();
    const kand = [4, 5, 6, 7, 8, 9, 10, 12, 15, 18, 20].map((h) => ({ ...g, h, L: 2 * g.u + g.n * h }));
    const v = ohneKollision(kand, (k) => [k.h, (k.L - k.u) / k.n, k.L - 2 * k.u, k.n === 3 ? NaN : (k.L - 2 * k.u) / 3], 0.02);
    const { n, u, h, L } = v;
    return {
      promptHtml: `Aus einem ${cm(L)} langen Draht wird das Kantenmodell eines Prismas gebogen; es bleibt kein Rest. Die Grundfläche ist ${v.text}. Wie hoch ist das Prisma?`,
      correct: h,
      tolerance: 0.01,
      hinweis: (roh, w) =>
        gleich(w, (L - u) / n) ? "Du hast den Umfang nur einmal abgezogen. Das Kantenmodell hat zwei Grundflächen — unten und oben."
          : gleich(w, L - 2 * u) ? `Das ist die Länge aller Seitenkanten zusammen. Es sind ${n} gleich lange — teile noch durch ${n}.`
            : n !== 3 && gleich(w, (L - 2 * u) / 3) ? `Ein Prisma mit ${N_NAME[n]} als Grundfläche hat ${n} Seitenkanten, nicht 3.`
              : "",
      tipps: [
        "Der Draht ergibt alle Kanten: die der Grundfläche, die der Deckfläche und die Seitenkanten.",
        `Zieh zweimal den Umfang ab. Der Rest verteilt sich auf ${n} gleich lange Seitenkanten.`,
      ],
      musterloesungHtml:
        `Umfang der Grundfläche: u = ${v.rechnung} = ${cm(u)}.<br>` +
        `Grund- und Deckfläche: 2 · ${cm(u)} = ${cm(2 * u)}. Für die ${n} Seitenkanten bleiben ${num(L)} cm − ${num(2 * u)} cm = ${cm(L - 2 * u)}.<br>` +
        `Jede Seitenkante ist so lang wie die Höhe: h = ${num(L - 2 * u)} cm : ${n} = <strong>${cm(h)}</strong>.<br>` +
        `<em>Probe:</em> 2 · ${num(u)} cm + ${n} · ${num(h)} cm = ${cm(L)}.`,
    };
  },
};

// ---------- A6: Prisma aus einer Anzahl erkennen ----------

const A6 = {
  schwierigkeit: "schwierig",
  titel: "Vom Zählen zum Prisma",
  abschnitt: ["sec-prisma", "sec-netz"],
  generate() {
    const n = pick([3, 4, 5, 6, 7, 8, 9, 10, 12]);
    const art = pick(["ecken", "kanten", "netz"]);
    const angabe = art === "ecken" ? `Ein Prisma hat ${2 * n} Ecken.` : art === "kanten" ? `Ein Prisma hat ${3 * n} Kanten.` : `Das Netz eines Prismas besteht aus ${n + 2} Flächen.`;
    const hinweisN = (roh, w) =>
      art === "ecken" && gleich(w, 2 * n) ? "Das sind die Ecken des ganzen Prismas. Die Hälfte davon liegt unten — so viele hat die Grundfläche."
        : art === "kanten" && gleich(w, 3 * n / 2) ? "Du hast die Kanten halbiert. Ein Prisma mit n-eckiger Grundfläche hat aber 3 · n Kanten: n unten, n oben, n Seitenkanten."
          : art === "kanten" && gleich(w, 3 * n) ? "Das ist die Zahl der Kanten. Sie ist dreimal so groß wie die Eckenzahl der Grundfläche."
            : art === "netz" && gleich(w, n + 2) ? "Zum Netz gehören auch die zwei Grundflächen. Rechtecke — und damit Ecken der Grundfläche — sind es zwei weniger."
              : art === "netz" && gleich(w, n + 1) ? "Es sind zwei Grundflächen, nicht eine: Zieh 2 ab."
                : "";
    const felder = [{ name: "Ecken der Grundfläche", soll: n, toleranz: 0.01, platzhalter: "n", hinweis: hinweisN }];
    if (art !== "ecken") felder.push({ name: "Ecken des Prismas", soll: 2 * n, toleranz: 0.01, hinweis: hinweisEcken(n) });
    if (art !== "kanten") felder.push({ name: "Kanten", soll: 3 * n, toleranz: 0.01, hinweis: hinweisKanten(n) });
    if (art !== "netz") felder.push({ name: "Flächen", soll: n + 2, toleranz: 0.01, hinweis: hinweisFlaechen(n) });
    const rechnung = art === "ecken" ? `2 · n = ${2 * n}, also n = ${2 * n} : 2 = ${n}`
      : art === "kanten" ? `3 · n = ${3 * n}, also n = ${3 * n} : 3 = ${n}`
        : `n + 2 = ${n + 2} (zwei Grundflächen und n Rechtecke), also n = ${n + 2} − 2 = ${n}`;
    return {
      promptHtml: `${angabe} Wie viele Ecken hat seine Grundfläche? Ergänze die übrigen Anzahlen des Prismas.`,
      felder,
      tipps: ["Hat die Grundfläche n Ecken, so hat das Prisma 2 · n Ecken, 3 · n Kanten und n + 2 Flächen.", "Stell die passende Gleichung auf und löse sie nach n."],
      musterloesungHtml:
        `${rechnung}: Die Grundfläche ist ein <strong>${N_NAME[n]}</strong>.<br>` +
        `Ecken: 2 · ${n} = <strong>${2 * n}</strong>; Kanten: 3 · ${n} = <strong>${3 * n}</strong>; Flächen: ${n} + 2 = <strong>${n + 2}</strong>.`,
    };
  },
};

// ---------- Schrägbilder für A7 und A8 ----------

// Vorderflächen [x, y] in cm (Kante 0 unten, gegen den Uhrzeigersinn), mit ihrer senkrechten Höhe
// (oberste Ecke über der Grundlinie) und dem Fußpunkt, an dem diese Höhe eingezeichnet wird.
const VORDERFLAECHEN = {
  rechteck: (a, b) => ({ pts: [[0, 0], [a, 0], [a, b], [0, b]], hoehe: b, fuss: 0, name: "Rechteck" }),
  "dreieck-rw": (k) => ({ pts: [[0, 0], [4 * k, 0], [0, 3 * k]], hoehe: 3 * k, fuss: 0, name: "rechtwinkliges Dreieck" }),
  "dreieck-gs": (k) => ({ pts: [[0, 0], [6 * k, 0], [3 * k, 4 * k]], hoehe: 4 * k, fuss: 3 * k, name: "gleichschenkliges Dreieck" }),
  trapez: (k) => ({ pts: [[0, 0], [8 * k, 0], [5 * k, 4 * k], [3 * k, 4 * k]], hoehe: 4 * k, fuss: 3 * k, name: "Trapez" }),
  haus: (k) => ({ pts: [[0, 0], [6 * k, 0], [6 * k, 3 * k], [3 * k, 7 * k], [0, 3 * k]], hoehe: 7 * k, fuss: 3 * k, name: "Fünfeck" }),
};

// Schrägbild eines liegenden Prismas: Vorderfläche in wahrer Größe (S Bildpunkte je cm), Tiefe d cm im
// Bild unter 45°. Beschriftet sind die Seiten der Vorderfläche, die Tiefe (Text frei wählbar) und auf
// Wunsch die senkrechte Höhe der Vorderfläche.
function schraegbildSvg(vf, dBild, tiefenText, mitHoehe) {
  const vorn = vf.pts.map(([x, y]) => [x, y, 0]);
  const tiefe = 2 * dBild;   // Kavalier verkürzt auf die Hälfte: Raumtiefe 2d ergibt d im Bild.
  const hinten = vf.pts.map(([x, y]) => [x, y, tiefe]);
  const n = vorn.length;
  const breite = 380;
  const b = R.buehne(KAV, [...vorn, ...hinten], { breite, maxHoehe: 300, s0: 24, rand: 18, extra: { links: 36, rechts: 80, unten: 18, oben: 4 } });
  return R.svgAlsText(breite, b.hoehe, "kp-aufgaben-figur", "schraegbild", (svg) => {
    const flaechen = [
      { rolle: "grund", pts: vorn.slice().reverse(), klasse: "kp-g kp-flaeche", daten: { "data-rolle": "vorn" } },
      { rolle: "deckel", pts: hinten, klasse: "kp-g kp-flaeche", daten: { "data-rolle": "hinten" } },
      ...vorn.map((p, i) => ({ rolle: "seite", pts: [vorn[i], vorn[(i + 1) % n], hinten[(i + 1) % n], hinten[i]], klasse: "kp-m kp-flaeche", daten: { "data-rolle": "seite" } })),
    ];
    R.zeichneKoerper(svg, b, flaechen);
    const L = R.seitenlaengen(vf.pts);
    R.vorderflaecheMasse(svg, b, vorn, hinten, (i) => `${num(L[i])} cm`, "kp-text-klein", (i) => ({ "data-rolle": "seite-mass", "data-nr": String(i) }));
    // Die Tiefe an der vorderen rechten unteren Ecke (Ecke 1): rechts darunter ist Platz.
    R.text(svg, b, [vorn[1][0], vorn[1][1], tiefe / 2], tiefenText, "kp-t-a kp-text-klein", 8, 14, "start", { "data-rolle": "tiefe-mass" });
    if (mitHoehe) {
      const oben = [vf.fuss, vf.hoehe, 0], fuss = [vf.fuss, 0, 0];
      // Gepunktet, nicht gestrichelt: Gestrichelt sind die verdeckten Kanten.
      R.strecke(svg, b, oben, fuss, "kp-hilfe kp-punktiert", { "data-rolle": "vorn-hoehe" });
      R.text(svg, b, [vf.fuss, vf.hoehe / 3, 0], `${num(vf.hoehe)} cm`, "kp-t-grau kp-text-klein", -5, 4, "end", { "data-rolle": "vorn-hoehe-mass" });
    }
  });
}

// ---------- A7: Kantenmodell nach einem Schrägbild ----------

const A7_FORMEN = spaeter(() => {
  const out = [];
  for (const a of [2, 3, 4, 5, 6]) for (const b of [2, 3, 4]) if (a !== b) out.push(VORDERFLAECHEN.rechteck(a, b));
  for (const k of [0.5, 1, 1.5]) for (const art of ["dreieck-rw", "dreieck-gs", "trapez", "haus"]) out.push(VORDERFLAECHEN[art](k));
  return out.filter((f) => Math.max(...f.pts.map((p) => p[0])) <= 9 && Math.max(...f.pts.map((p) => p[1])) <= 8);
});

const A7 = {
  schwierigkeit: "komplex",
  titel: "Kantenmodell nach einem Schrägbild",
  abschnitt: ["sec-prisma", "sec-schraegbild"],
  generate() {
    const kand = [];
    for (const vf of A7_FORMEN()) for (const d of [1, 1.5, 2, 2.5, 3]) {
      const u = R.seitenlaengen(vf.pts).reduce((s, x) => s + x, 0), n = vf.pts.length;
      kand.push({ vf, d, u, n });
    }
    const v = ohneKollision(kand, (k) => [2 * k.u + k.n * 2 * k.d, 2 * k.u + k.n * k.d, k.u + k.n * 2 * k.d, 2 * k.u + 2 * k.d], 0.02);
    const { vf, d, u, n } = v;
    const h = 2 * d, soll = 2 * u + n * h;
    return {
      promptHtml: `Das Schrägbild zeigt ein liegendes Prisma. Die Vorderfläche ist in wahrer Größe gezeichnet und beschriftet; die nach hinten laufenden Kanten sind im Bild ${cm(d)} lang. Wie viel Draht braucht man für ein Kantenmodell des echten Prismas?` +
        schraegbildSvg(vf, d, `im Bild ${cm(d)}`, false),
      correct: soll,
      tolerance: 0.01,
      hinweis: (roh, w) =>
        gleich(w, 2 * u + n * d) ? `Im Schrägbild ist die Tiefe auf die Hälfte verkürzt. Das echte Prisma ist 2 · ${num(d)} cm = ${cm(h)} tief.`
          : gleich(w, u + n * h) ? "Du hast nur eine Grundfläche gezählt. Das Kantenmodell hat vorn UND hinten eine — der Umfang zählt zweimal."
            : gleich(w, 2 * u + h) ? `Es gibt ${n} Kanten, die nach hinten laufen — eine an jeder Ecke der Vorderfläche.`
              : "",
      tipps: [
        `Die wahre Tiefe: Im Schrägbild ist sie halb so lang gezeichnet.`,
        `Draht = Umfang vorn + Umfang hinten + ${n} Tiefenkanten.`,
      ],
      musterloesungHtml:
        `Vorderfläche (${vf.name}): u = ${R.seitenlaengen(vf.pts).map(num).join(" cm + ")} cm = ${cm(u)}.<br>` +
        `Wahre Tiefe: Im Bild ${cm(d)}, verkürzt auf die Hälfte — also h = 2 · ${num(d)} cm = ${cm(h)}.<br>` +
        `Draht: 2 · ${num(u)} cm + ${n} · ${num(h)} cm = ${num(2 * u)} cm + ${num(n * h)} cm = <strong>${cm(soll)}</strong>.`,
    };
  },
};

// ---------- A8: Mantel eines liegenden Prismas ----------

const A8_FORMEN = spaeter(() => {
  const out = [];
  for (const k of [1, 1.5, 2]) for (const art of ["dreieck-gs", "trapez", "haus"]) out.push(VORDERFLAECHEN[art](k));
  return out.filter((f) => Math.max(...f.pts.map((p) => p[1])) <= 10);
});

const A8 = {
  schwierigkeit: "komplex",
  titel: "Der Mantel eines liegenden Prismas",
  abschnitt: ["sec-netz", "sec-schraegbild", "sec-lage"],
  generate() {
    const kand = [];
    for (const vf of A8_FORMEN()) for (const h of [5, 6, 7, 8, 9, 10, 12, 14, 15, 16]) kand.push({ vf, h });
    // Die Breite des Streifens darf weder mit der Höhe der Vorderfläche noch mit ihrer Hälfte
    // zusammenfallen — sonst wäre der Fehler nicht zu erkennen.
    const v = ohneKollision(kand, (k) => [k.h, k.vf.hoehe, k.h / 2], 0.02);
    const { vf, h } = v;
    const L = R.seitenlaengen(vf.pts), n = L.length;
    const u = L.reduce((s, x) => s + x, 0);
    return {
      promptHtml: `Das Prisma liegt auf einer Seitenfläche; das Schrägbild ist mit den wahren Längen beschriftet. Sein Mantel soll aus einem einzigen rechteckigen Streifen gefaltet werden. Aus wie vielen Rechtecken besteht der Mantel, und wie lang und wie breit ist der Streifen?` +
        schraegbildSvg(vf, h / 2, cm(h), true),
      felder: [
        {
          name: "Rechtecke im Mantel", soll: n, toleranz: 0.01,
          hinweis: (r, w) => (gleich(w, n + 2) ? "Das sind alle Flächen des Prismas. Zum Mantel gehören nur die Rechtecke — nicht die beiden Grundflächen vorn und hinten."
            : gleich(w, n - 1) ? "Auch die Fläche, auf der das Prisma liegt, ist eine Seitenfläche und gehört zum Mantel." : ""),
        },
        {
          name: "Länge des Streifens", einheit: "cm", soll: u, toleranz: 0.01,
          hinweis: (r, w) => (gleich(w, u - L[0]) ? "Auch die Fläche, auf der das Prisma liegt, gehört zum Mantel: Der Streifen ist so lang wie der ganze Umfang der Vorderfläche." : ""),
        },
        {
          name: "Breite des Streifens", einheit: "cm", soll: h, toleranz: 0.01,
          hinweis: (r, w) => (gleich(w, vf.hoehe) ? `${cm(vf.hoehe)} ist die Höhe der Vorderfläche, nicht die des Prismas. Die Höhe des Prismas ist der Abstand der Grundflächen — hier von vorn nach hinten.`
            : gleich(w, h / 2) ? "Beschriftet ist die wahre Länge. Halbiert wird nur beim Zeichnen, nicht beim Rechnen." : ""),
        },
      ],
      tipps: [
        "Welche Flächen sind die Grundflächen? Die zwei deckungsgleichen — hier vorn und hinten.",
        "Der Mantel ist so lang wie der Umfang der Grundfläche und so breit wie die Höhe des Prismas.",
      ],
      musterloesungHtml:
        `Die Grundflächen sind die beiden ${vf.name}e vorn und hinten. Alle anderen Flächen — auch die, auf der das Prisma liegt — bilden den Mantel: <strong>${n} Rechtecke</strong>.<br>` +
        `Länge des Streifens = Umfang der Grundfläche: ${L.map(num).join(" cm + ")} cm = <strong>${cm(u)}</strong>.<br>` +
        `Breite des Streifens = Höhe des Prismas, der Abstand von vorn nach hinten: <strong>${cm(h)}</strong> (nicht die Höhe ${cm(vf.hoehe)} der Vorderfläche).`,
    };
  },
};

export const AUFGABEN = [A1, A2, A3, A4, A5, A6, A7, A8];
