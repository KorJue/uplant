// Die acht Übungsaufgaben zu „Oberflächeninhalt von Prismen“ — zwei je Stufe:
//   einfach   — Oberfläche eines Quaders oder Würfels; Mantel eines Prismas
//   mittel    — Oberfläche eines Dreiecksprismas; Oberfläche eines Trapezprismas
//   schwierig — Höhe aus der Oberfläche (rückwärts, mit Probe); offene Körper mit Einheiten
//   komplex   — Prisma mit L-förmiger Grundfläche (Figur); Balken lackieren (Einheiten, Dosen)
//
// Schräge Seiten gehören zu rechtwinkligen Dreiecken mit ganzen Seiten (3-4-5, 5-12-13 …). Sie sind
// gegeben, nicht berechnet — der Satz des Pythagoras kommt erst in Klasse 9. Alle Zahlen kommen aus
// vorher gefilterten Listen, nie durch Verwerfen und Neuziehen.

import { num, pick, trifft, ohneKollision, spaeter, glatt, zeichen } from "./seite.js?v=1";

const gleich = (w, x) => trifft(w, x, 0.01);
const cm = (x, e = "cm") => `${num(x)} ${e}`;
const qcm = (x, e = "cm") => `${num(x)} ${e}²`;
const summe = (xs) => xs.reduce((s, x) => s + x, 0);
// Ein Hinweis aus einer Liste [Wert, Text]: der erste, den die Eingabe trifft.
const hinweisAus = (liste) => (roh, w) => (liste.find(([x]) => Number.isFinite(x) && gleich(w, x)) || [0, ""])[1];

// ---------- E1: Oberfläche eines Quaders oder Würfels ----------

const E1_QUADER = spaeter(() => {
  const out = [];
  for (let a = 3; a <= 12; a++) for (let b = 2; b < a; b++) for (let c = 1; c <= 9; c++) if (c !== a && c !== b) out.push({ a, b, c });
  return out;
});
const E1 = {
  schwierigkeit: "einfach",
  titel: "Oberfläche eines Quaders",
  abschnitt: "sec-netzflaeche",
  generate() {
    // Ein Drittel Würfel: In 20 Zügen fehlt die Fassung nur mit (⅔)²⁰ ≈ 0,03 ‰.
    if (Math.random() < 1 / 3) {
      // Ohne a = 6: Dort ist 6 · a² = a³, und wer das Volumen ausrechnet, bekäme ein ✓.
      const a = pick([2, 3, 4, 5, 7, 8, 9, 10, 12, 15]);
      const falsch = [[a ** 3, "Das ist das Volumen des Würfels, keine Fläche."], [4 * a * a, "Ein Würfel hat sechs Flächen, nicht vier."], [6 * a, `Jede Fläche ist ein Quadrat mit ${cm(a)} · ${cm(a)} — nicht nur ${cm(a)}.`]];
      return {
        promptHtml: `Ein Würfel hat die Kantenlänge ${cm(a)}. Wie groß ist seine Oberfläche?`,
        correct: 6 * a * a, tolerance: 0.01,
        hinweis: hinweisAus(falsch),
        tipps: ["Wie viele Flächen hat ein Würfel, und welche Form haben sie?", "Alle sechs Flächen sind gleich große Quadrate."],
        musterloesungHtml: `Sechs gleiche Quadrate mit je ${cm(a)} · ${cm(a)} = ${qcm(a * a)}.<br>O = 6 · ${qcm(a * a)} = <strong>${qcm(6 * a * a)}</strong>.`,
      };
    }
    const v = ohneKollision(E1_QUADER(), ({ a, b, c }) => [2 * (a * b + a * c + b * c), a * b + a * c + b * c, a * b * c, 6 * a * b]);
    const { a, b, c } = v;
    const O = 2 * (a * b + a * c + b * c);
    return {
      promptHtml: `Ein Quader ist ${cm(a)} lang, ${cm(b)} breit und ${cm(c)} hoch. Wie groß ist seine Oberfläche?`,
      correct: O, tolerance: 0.01,
      hinweis: hinweisAus([
        [a * b + a * c + b * c, "Das ist nur die halbe Oberfläche: Zu jeder Fläche gibt es eine gegenüberliegende, gleich große."],
        [a * b * c, "a · b · c ist das Volumen des Quaders, keine Fläche."],
        [6 * a * b, "Nicht alle sechs Flächen sind gleich groß — nur je zwei gegenüberliegende."],
      ]),
      tipps: ["Der Quader hat drei Paare gleicher Rechtecke: Boden und Deckel, vorn und hinten, links und rechts.", "O = 2 · a · b + 2 · a · c + 2 · b · c"],
      musterloesungHtml:
        `Boden und Deckel: 2 · ${cm(a)} · ${cm(b)} = ${qcm(2 * a * b)}<br>` +
        `vorn und hinten: 2 · ${cm(a)} · ${cm(c)} = ${qcm(2 * a * c)}<br>` +
        `links und rechts: 2 · ${cm(b)} · ${cm(c)} = ${qcm(2 * b * c)}<br>` +
        `O = ${qcm(2 * a * b)} + ${qcm(2 * a * c)} + ${qcm(2 * b * c)} = <strong>${qcm(O)}</strong>`,
    };
  },
};

// ---------- E2: Mantel eines Prismas ----------

const DREIECKE = spaeter(() => {
  const out = [];
  for (let a = 3; a <= 12; a++) for (let b = a + 1; b <= 13; b++) for (let c = b + 1; c <= 14; c++) if (a + b > c) out.push([a, b, c]);
  return out;
});
function grundZumMantel() {
  const art = pick(["dreieck", "rechteck", "sechseck", "trapez"]);
  if (art === "dreieck") { const s = pick(DREIECKE()); return { L: s, text: `ein Dreieck mit den Seiten ${s.map(num).join(" cm, ")} cm` }; }
  if (art === "rechteck") { const a = pick([4, 5, 6, 7, 8, 9, 10]), b = pick([2, 3]); return { L: [a, b, a, b], text: `ein Rechteck mit den Seiten ${cm(a)} und ${cm(b)}` }; }
  if (art === "sechseck") { const s = pick([2, 3, 4, 5, 6]); return { L: [s, s, s, s, s, s], text: `ein Sechseck mit sechs gleich langen Seiten von je ${cm(s)}` }; }
  const c = pick([2, 3, 4, 5]), s = pick([5, 10]), p = s === 5 ? 3 : 6;
  return { L: [c + 2 * p, s, c, s], text: `ein gleichschenkliges Trapez mit den parallelen Seiten ${cm(c + 2 * p)} und ${cm(c)} und den Schenkeln ${cm(s)}` };
}
const E2 = {
  schwierigkeit: "einfach",
  titel: "Der Mantel",
  abschnitt: "sec-mantel",
  generate() {
    const g = grundZumMantel();
    const kand = [3, 4, 5, 6, 7, 8, 9, 10, 12, 15].map((h) => ({ h }));
    const u = summe(g.L);
    const { h } = ohneKollision(kand, ({ h }) => [u * h, u + h, g.L[0] * h, (u - g.L[g.L.length - 1]) * h]);
    return {
      promptHtml: `Die Grundfläche eines Prismas ist ${g.text}. Das Prisma ist ${cm(h)} hoch. Wie groß ist sein Mantel?`,
      correct: u * h, tolerance: 0.01,
      hinweis: hinweisAus([
        [u + h, "Der Mantel ist ein Rechteck: Seine Länge (der Umfang) wird mit seiner Breite (der Höhe) multipliziert, nicht addiert."],
        [g.L[0] * h, "Das ist nur eine Seitenfläche. Zum Mantel gehören alle — zusammen ein Rechteck, so lang wie der ganze Umfang."],
        [(u - g.L[g.L.length - 1]) * h, "Da fehlt eine Seitenfläche: Zähle alle Seiten der Grundfläche zum Umfang."],
      ]),
      tipps: ["Der Mantel ist ein Rechteck: so lang wie der Umfang der Grundfläche, so breit wie die Höhe des Prismas.", "Erst u als Summe aller Seiten, dann M = u · h."],
      musterloesungHtml: `u = ${g.L.map(num).join(" cm + ")} cm = ${cm(u)}<br>M = u · h = ${cm(u)} · ${cm(h)} = <strong>${qcm(u * h)}</strong>`,
    };
  },
};

// ---------- E3: Oberfläche eines Dreiecksprismas ----------

// Rechtwinklige Dreiecke mit ganzen Seiten und Dreiecke mit ganzzahliger Höhe auf einer Seite (aus
// zwei solchen zusammengesetzt). Die Höhe hg steht auf der Grundseite g.
const RW = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 15, 17]];
const ALLG = [
  { g: 14, hg: 12, s: [13, 15] }, { g: 6, hg: 4, s: [5, 5] }, { g: 8, hg: 3, s: [5, 5] }, { g: 12, hg: 8, s: [10, 10] },
  { g: 10, hg: 12, s: [13, 13] }, { g: 21, hg: 8, s: [10, 17] }, { g: 21, hg: 12, s: [13, 20] }, { g: 16, hg: 15, s: [17, 17] },
];
const E3 = {
  schwierigkeit: "mittel",
  titel: "Oberfläche eines Dreiecksprismas",
  abschnitt: "sec-formel",
  generate() {
    const allgemein = Math.random() < 0.5;
    const d = allgemein ? pick(ALLG) : (() => { const [a, b, c] = pick(RW); return { g: a, hg: b, s: [b, c], rw: true }; })();
    const u = d.g + d.s[0] + d.s[1], G = (d.g * d.hg) / 2;
    const hs = [3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20].filter((h) => h !== d.hg);
    const { h } = ohneKollision(hs.map((h) => ({ h })), ({ h }) => [2 * G + u * h, 4 * G + u * h, G + u * h, u * h, 2 * G + u * d.hg]);
    const O = 2 * G + u * h;
    const angabe = d.rw
      ? `Die Grundfläche ist ein rechtwinkliges Dreieck mit den Katheten ${cm(d.g)} und ${cm(d.hg)} und der Hypotenuse ${cm(d.s[1])}.`
      : `Die Grundfläche ist ein Dreieck mit den Seiten ${cm(d.g)}, ${cm(d.s[0])} und ${cm(d.s[1])}; die Höhe auf die Seite ${cm(d.g)} ist ${cm(d.hg)} lang.`;
    return {
      promptHtml: `${angabe} Das Prisma ist ${cm(h)} hoch. Wie groß ist seine Oberfläche?`,
      correct: O, tolerance: 0.01,
      hinweis: hinweisAus([
        [4 * G + u * h, "Beim Dreieck wird halbiert: G = ½ · g · h<sub>g</sub>."],
        [G + u * h, "Es gibt zwei Grundflächen — Grund- und Deckfläche: 2 · G."],
        [u * h, "Das ist nur der Mantel. Grund- und Deckfläche kommen dazu."],
        [2 * G + u * d.hg, "Für den Mantel brauchst du die Höhe des Prismas, nicht die Höhe des Dreiecks."],
      ]),
      tipps: [d.rw ? "Im rechtwinkligen Dreieck sind die Katheten Grundseite und Höhe." : "G = ½ · g · h<sub>g</sub> mit der Höhe des Dreiecks.", "O = 2 · G + u · h — hier mit der Höhe des Prismas."],
      musterloesungHtml:
        `G = ½ · ${cm(d.g)} · ${cm(d.hg)} = ${qcm(G)}<br>` +
        `u = ${cm(d.g)} + ${cm(d.s[0])} + ${cm(d.s[1])} = ${cm(u)}; M = ${cm(u)} · ${cm(h)} = ${qcm(u * h)}<br>` +
        `O = 2 · ${qcm(G)} + ${qcm(u * h)} = <strong>${qcm(O)}</strong>`,
    };
  },
};

// ---------- E4: Oberfläche eines Trapezprismas ----------

// Überstände p, q der Schenkel über die kurze Seite mit ganzzahligen Schenkeln zur Trapezhöhe hT.
const UEBERSTAND = { 4: [[0, 4], [3, 5]], 8: [[0, 8], [6, 10], [15, 17]], 12: [[0, 12], [5, 13], [9, 15], [16, 20]] };
const E4_KAND = spaeter(() => {
  const out = [];
  for (const hT of [4, 8, 12]) for (const [p, s1] of UEBERSTAND[hT]) for (const [q, s2] of UEBERSTAND[hT]) {
    if (p + q === 0 || p > q) continue;
    for (const c of [2, 3, 4, 5, 6, 8]) for (const h of [5, 6, 8, 10, 12, 15, 20]) if (h !== hT) out.push({ hT, c, a: c + p + q, s1, s2, h });
  }
  return out;
});
const E4 = {
  schwierigkeit: "mittel",
  titel: "Oberfläche eines Trapezprismas",
  abschnitt: "sec-formel",
  generate() {
    const werte = (k) => { const G = ((k.a + k.c) / 2) * k.hT, u = k.a + k.c + k.s1 + k.s2; return [2 * G + u * k.h, G + u * k.h, 4 * G + u * k.h, 2 * G + (k.a + k.c) * k.h, u * k.h]; };
    const k = ohneKollision(E4_KAND(), werte);
    const G = ((k.a + k.c) / 2) * k.hT, u = k.a + k.c + k.s1 + k.s2, O = 2 * G + u * k.h;
    return {
      promptHtml: `Die Grundfläche eines Prismas ist ein Trapez mit den parallelen Seiten ${cm(k.a)} und ${cm(k.c)}, den Schenkeln ${cm(k.s1)} und ${cm(k.s2)} und der Höhe ${cm(k.hT)}. Das Prisma ist ${cm(k.h)} hoch. Wie groß ist seine Oberfläche?`,
      correct: O, tolerance: 0.01,
      hinweis: hinweisAus([
        [G + u * k.h, "Es gibt zwei Grundflächen — Grund- und Deckfläche: 2 · G."],
        [4 * G + u * k.h, "Beim Trapez wird der Mittelwert der parallelen Seiten genommen: (a + c) : 2 · h<sub>T</sub>."],
        [2 * G + (k.a + k.c) * k.h, "Zum Umfang gehören alle vier Seiten des Trapezes, auch die Schenkel."],
        [u * k.h, "Das ist nur der Mantel. Grund- und Deckfläche kommen dazu."],
      ]),
      tipps: ["G = (a + c) : 2 · h<sub>T</sub> mit der Höhe des Trapezes.", "u = alle vier Seiten; dann O = 2 · G + u · h mit der Höhe des Prismas."],
      musterloesungHtml:
        `G = (${cm(k.a)} + ${cm(k.c)}) : 2 · ${cm(k.hT)} = ${qcm(G)}<br>` +
        `u = ${cm(k.a)} + ${cm(k.c)} + ${cm(k.s1)} + ${cm(k.s2)} = ${cm(u)}; M = ${cm(u)} · ${cm(k.h)} = ${qcm(u * k.h)}<br>` +
        `O = 2 · ${qcm(G)} + ${qcm(u * k.h)} = <strong>${qcm(O)}</strong>`,
    };
  },
};

// ---------- E5: Höhe aus der Oberfläche ----------

const E5_QUADER = spaeter(() => {
  const out = [];
  for (let a = 3; a <= 12; a++) for (let b = 2; b < a; b++) for (const c of [2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15]) out.push({ a, b, c });
  return out;
});
const E5_PRISMA = spaeter(() => {
  const out = [];
  for (const G of [6, 12, 15, 20, 24, 30, 36, 42]) for (const u of [12, 14, 16, 18, 20, 24, 30]) for (const h of [3, 4, 5, 6, 7, 8, 9, 10, 12, 15]) out.push({ G, u, h });
  return out;
});
const E5 = {
  schwierigkeit: "schwierig",
  titel: "Höhe aus der Oberfläche",
  abschnitt: "sec-formel",
  generate() {
    if (Math.random() < 0.5) {
      const { a, b, c } = ohneKollision(E5_QUADER(), ({ a, b, c }) => { const O = 2 * (a * b + a * c + b * c); return [c, (O - a * b) / (2 * a + 2 * b), O / (2 * a + 2 * b), (O - 2 * a * b) / (a + b)]; }, 0.02);
      const O = 2 * (a * b + a * c + b * c), u = 2 * a + 2 * b;
      return {
        promptHtml: `Ein Quader hat eine ${cm(a)} × ${cm(b)} große Grundfläche und die Oberfläche ${qcm(O)}. Wie hoch ist er?`,
        correct: c, tolerance: 0.01,
        hinweis: hinweisAus([
          [(O - a * b) / u, `Zieh beide Rechtecke ${cm(a)} × ${cm(b)} ab — Boden und Deckel.`],
          [O / u, "Erst Boden und Deckel abziehen, dann bleibt der Mantel u · h."],
          [(O - 2 * a * b) / (a + b), "Der Umfang der Grundfläche ist 2 · a + 2 · b, nicht a + b."],
        ]),
        tipps: ["O = 2 · G + u · h. Was ist G, was ist u?", "Zieh 2 · G von O ab und teile den Rest durch u."],
        musterloesungHtml:
          `G = ${cm(a)} · ${cm(b)} = ${qcm(a * b)}; u = 2 · ${cm(a)} + 2 · ${cm(b)} = ${cm(u)}<br>` +
          `M = O − 2 · G = ${qcm(O)} − ${qcm(2 * a * b)} = ${qcm(O - 2 * a * b)}<br>` +
          `h = M : u = ${num(O - 2 * a * b)} cm² : ${cm(u)} = <strong>${cm(c)}</strong><br>` +
          `<em>Probe:</em> 2 · ${qcm(a * b)} + ${cm(u)} · ${cm(c)} = ${qcm(O)}.`,
      };
    }
    const { G, u, h } = ohneKollision(E5_PRISMA(), ({ G, u, h }) => { const O = 2 * G + u * h; return [h, (O - G) / u, O / u, (O - 2 * G) / (2 * u)]; }, 0.02);
    const O = 2 * G + u * h;
    return {
      promptHtml: `Ein Prisma hat eine Grundfläche von ${qcm(G)}, deren Umfang ${cm(u)} beträgt. Seine Oberfläche ist ${qcm(O)}. Wie hoch ist das Prisma?`,
      correct: h, tolerance: 0.01,
      hinweis: hinweisAus([
        [(O - G) / u, "Es gibt zwei Grundflächen: Zieh 2 · G ab, nicht nur G."],
        [O / u, "Erst Grund- und Deckfläche abziehen — durch u geteilt wird nur der Mantel."],
        [(O - 2 * G) / (2 * u), "Der Mantel ist u · h, nicht 2 · u · h: Teile durch u."],
      ]),
      tipps: ["O = 2 · G + u · h — stelle nach h um.", "M = O − 2 · G, dann h = M : u."],
      musterloesungHtml:
        `M = O − 2 · G = ${qcm(O)} − 2 · ${qcm(G)} = ${qcm(O - 2 * G)}<br>` +
        `h = M : u = ${num(O - 2 * G)} cm² : ${cm(u)} = <strong>${cm(h)}</strong><br>` +
        `<em>Probe:</em> 2 · ${qcm(G)} + ${cm(u)} · ${cm(h)} = ${qcm(O)}.`,
    };
  },
};

// ---------- E6: Offene Körper ----------

const E6 = {
  schwierigkeit: "schwierig",
  titel: "Offene Körper",
  abschnitt: "sec-anwenden",
  generate() {
    const art = pick(["schachtel", "aquarium", "zelt", "trog"]);
    if (art === "schachtel" || art === "aquarium") {
      const aq = art === "aquarium";
      const kand = [];
      for (const a of aq ? [40, 50, 60, 80, 100] : [8, 10, 12, 15, 20]) for (const b of aq ? [20, 25, 30, 40] : [5, 6, 8, 10]) for (const c of aq ? [30, 35, 40, 50] : [3, 4, 5, 6]) if (a > b) kand.push({ a, b, c });
      const f = aq ? 100 : 1;
      const werte = ({ a, b, c }) => { const O = a * b + 2 * a * c + 2 * b * c; return aq ? [O / 100, (O + a * b) / 100, O, O / 10] : [O, O + a * b]; };
      const { a, b, c } = ohneKollision(kand, werte, 0.02);
      const O = a * b + 2 * a * c + 2 * b * c;
      return {
        promptHtml: aq
          ? `Ein Aquarium ohne Deckel ist ${cm(a)} lang, ${cm(b)} breit und ${cm(c)} hoch. Wie viel Glas braucht man? Gib das Ergebnis in dm² an.`
          : `Eine Schachtel ohne Deckel ist ${cm(a)} lang, ${cm(b)} breit und ${cm(c)} hoch. Wie viel Pappe braucht man ohne Klebefalze (in cm²)?`,
        correct: O / f, tolerance: 0.01,
        hinweis: hinweisAus([
          [(O + a * b) / f, "Der Deckel fehlt — er wird nicht mitgerechnet: nur ein Boden."],
          ...(aq ? [[O, "Das ist die Fläche in cm². In dm² ist es 100-mal weniger: 1 dm² = 100 cm²."], [O / 10, "Flächen rechnet man mit 100 um, nicht mit 10: 1 dm² = 10 cm · 10 cm = 100 cm²."]] : []),
        ]),
        tipps: ["Welche Flächen gibt es? Ein Boden und vier Seitenwände.", aq ? "Rechne in cm² und teile am Ende durch 100 — oder rechne gleich in dm." : "O = a · b + 2 · a · c + 2 · b · c"],
        musterloesungHtml:
          `Boden: ${cm(a)} · ${cm(b)} = ${qcm(a * b)}; Wände: 2 · ${cm(a)} · ${cm(c)} + 2 · ${cm(b)} · ${cm(c)} = ${qcm(2 * a * c + 2 * b * c)}<br>` +
          `O = ${qcm(a * b)} + ${qcm(2 * a * c + 2 * b * c)} = ${aq ? `${qcm(O)} = <strong>${qcm(O / 100, "dm")}</strong>` : `<strong>${qcm(O)}</strong>`}`,
      };
    }
    if (art === "zelt") {
      // Gleichschenkliges Dreieck aus zwei 3-4-5-Dreiecken, in m.
      const k = pick([0.5, 0.6, 0.75]);
      const g = 6 * k, s = 5 * k, hg = 4 * k;
      const kand = [2, 2.5, 3, 4, 5].map((L) => ({ L }));
      const werte = ({ L }) => { const O = g * hg + 2 * s * L; return [O, O + g * L, 2 * s * L, O + g * hg]; };
      const { L } = ohneKollision(kand, werte, 0.02);
      const O = g * hg + 2 * s * L;
      return {
        promptHtml: `Ein Zelt hat die Form eines liegenden Dreiecksprismas ohne Boden. Vorn und hinten ist ein gleichschenkliges Dreieck: ${cm(g, "m")} breit, ${cm(hg, "m")} hoch, die schrägen Seiten ${cm(s, "m")} lang. Das Zelt ist ${cm(L, "m")} lang. Wie viel Stoff braucht man (in m²)?`,
        correct: O, tolerance: 0.01,
        hinweis: hinweisAus([
          [O + g * L, "Das Zelt hat keinen Boden — die Seitenfläche, auf der es steht, fehlt."],
          [2 * s * L, "Vorn und hinten sind die Dreiecke — die gehören dazu."],
          [O + g * hg, "Ein Dreieck hat den Flächeninhalt ½ · g · h — du hast nicht halbiert."],
        ]),
        tipps: ["Die Dreiecke vorn und hinten sind die Grundflächen. Welche Seitenflächen gibt es?", "Zwei Dreiecke + zwei schräge Rechtecke; der Boden fehlt."],
        musterloesungHtml:
          `Dreiecke: 2 · ½ · ${cm(g, "m")} · ${cm(hg, "m")} = ${qcm(g * hg, "m")}<br>` +
          `Dach: 2 · ${cm(s, "m")} · ${cm(L, "m")} = ${qcm(2 * s * L, "m")}; der Boden fehlt.<br>` +
          `O = ${qcm(g * hg, "m")} + ${qcm(2 * s * L, "m")} = <strong>${qcm(O, "m")}</strong>`,
      };
    }
    // Trog: Trapez mit der kurzen Seite unten, Schenkel aus 3-4-5-Dreiecken; oben offen. In dm.
    const kand = [];
    for (const c of [2, 3, 4]) for (const kk of [1, 2]) for (const L of [8, 10, 12, 15]) kand.push({ c, kk, L });
    const masse = ({ c, kk, L }) => ({ c, a: c + 6 * kk, s: 5 * kk, hT: 4 * kk, L });
    const werte = (k) => { const m = masse(k); const G = ((m.a + m.c) / 2) * m.hT, O = 2 * G + (m.c + 2 * m.s) * m.L; return [O, O + m.a * m.L, O - G, (m.c + 2 * m.s) * m.L]; };
    const m = masse(ohneKollision(kand, werte, 0.02));
    const G = ((m.a + m.c) / 2) * m.hT, O = 2 * G + (m.c + 2 * m.s) * m.L;
    return {
      promptHtml: `Ein Futtertrog ist ein liegendes Prisma, oben offen. Vorn und hinten ist ein Trapez: unten ${cm(m.c, "dm")}, oben ${cm(m.a, "dm")} breit, ${cm(m.hT, "dm")} hoch, die schrägen Seiten ${cm(m.s, "dm")} lang. Der Trog ist ${cm(m.L, "dm")} lang. Wie viel Blech braucht man (in dm²)?`,
      correct: O, tolerance: 0.01,
      hinweis: hinweisAus([
        [O + m.a * m.L, "Der Trog ist oben offen — die obere Seitenfläche fehlt."],
        [O - G, "Vorn UND hinten ist ein Trapez: zwei Grundflächen."],
        [(m.c + 2 * m.s) * m.L, "Das sind nur Boden und schräge Wände. Die Trapeze vorn und hinten gehören dazu."],
      ]),
      tipps: ["Die Trapeze vorn und hinten sind die Grundflächen. Welche Seitenflächen hat der Trog?", "Boden und zwei schräge Wände — die Öffnung oben zählt nicht."],
      musterloesungHtml:
        `Trapeze: 2 · (${cm(m.c, "dm")} + ${cm(m.a, "dm")}) : 2 · ${cm(m.hT, "dm")} = ${qcm(2 * G, "dm")}<br>` +
        `Boden und Wände: (${cm(m.c, "dm")} + 2 · ${cm(m.s, "dm")}) · ${cm(m.L, "dm")} = ${qcm((m.c + 2 * m.s) * m.L, "dm")}; oben ist offen.<br>` +
        `O = ${qcm(2 * G, "dm")} + ${qcm((m.c + 2 * m.s) * m.L, "dm")} = <strong>${qcm(O, "dm")}</strong>`,
    };
  },
};

// ---------- E7: Prisma mit L-förmiger Grundfläche ----------

// Die Grundfläche als Figur: ein L aus dem Rechteck A × B, dem oben rechts die Ecke (A − p) × (B − q)
// fehlt. Beschriftet sind A (unten), B (links), p (oben) und q (rechts) — die beiden inneren Seiten
// muss man daraus bestimmen, wie auf der Seite „Zusammengesetzte Figuren“.
function lSvg(A, B, p, q) {
  const S = Math.min(22, 230 / Math.max(A, B)), rand = 34;
  const X = (x) => rand + x * S, Y = (y) => rand - 6 + (B - y) * S;
  const pts = [[0, 0], [A, 0], [A, q], [p, q], [p, B], [0, B]];
  const breite = Math.ceil(A * S + 2 * rand), hoehe = Math.ceil(B * S + 2 * rand);
  let s = `<svg viewBox="0 0 ${breite} ${hoehe}" width="${breite}" height="${hoehe}" class="kp-aufgaben-figur" data-figur="l-grundflaeche" role="img" aria-label="L-förmige Grundfläche">`;
  s += `<polygon points="${pts.map(([x, y]) => `${X(x).toFixed(2)},${Y(y).toFixed(2)}`).join(" ")}" class="kp-g" data-rolle="grundflaeche"/>`;
  s += `<text x="${X(A / 2).toFixed(2)}" y="${(Y(0) + 17).toFixed(2)}" text-anchor="middle" class="kp-figur-mass" data-rolle="mass-A">${cm(A)}</text>`;
  s += `<text x="${(X(0) - 6).toFixed(2)}" y="${(Y(B / 2) + 5).toFixed(2)}" text-anchor="end" class="kp-figur-mass" data-rolle="mass-B">${cm(B)}</text>`;
  s += `<text x="${X(p / 2).toFixed(2)}" y="${(Y(B) - 7).toFixed(2)}" text-anchor="middle" class="kp-figur-mass" data-rolle="mass-p">${cm(p)}</text>`;
  s += `<text x="${(X(A) + 6).toFixed(2)}" y="${(Y(q / 2) + 5).toFixed(2)}" text-anchor="start" class="kp-figur-mass" data-rolle="mass-q">${cm(q)}</text>`;
  return s + "</svg>";
}
const E7_KAND = spaeter(() => {
  const out = [];
  for (const A of [6, 8, 10, 12]) for (const B of [5, 6, 8, 10]) for (const p of [2, 3, 4]) for (const q of [2, 3, 4]) for (const h of [5, 10, 12, 15, 20]) {
    if (p < A - 1 && q < B - 1) out.push({ A, B, p, q, h });
  }
  return out;
});
const E7 = {
  schwierigkeit: "komplex",
  titel: "Zusammengesetzte Grundfläche",
  abschnitt: "sec-formel",
  generate() {
    const werte = ({ A, B, p, q, h }) => {
      const G = p * B + (A - p) * q, u = 2 * A + 2 * B;
      return [2 * G + u * h, G + u * h, 2 * A * B + u * h, 2 * G + (A + B + p + q) * h];
    };
    const k = ohneKollision(E7_KAND(), werte);
    const { A, B, p, q, h } = k;
    const G = p * B + (A - p) * q, u = 2 * A + 2 * B, O = 2 * G + u * h;
    return {
      promptHtml: `Ein Werkstück ist ein Prisma mit der abgebildeten L-förmigen Grundfläche. Es ist ${cm(h)} lang. Wie groß ist seine Oberfläche?` + lSvg(A, B, p, q),
      correct: O, tolerance: 0.01,
      hinweis: hinweisAus([
        [G + u * h, "Es gibt zwei Grundflächen — vorn und hinten: 2 · G."],
        [2 * A * B + u * h, "Das wäre ein volles Rechteck. Beim L fehlt oben rechts eine Ecke — zerlege die Grundfläche in zwei Rechtecke."],
        [2 * G + (A + B + p + q) * h, "Zum Umfang gehören alle sechs Seiten des L — auch die beiden inneren, die nicht beschriftet sind."],
      ]),
      tipps: ["Zerlege das L in zwei Rechtecke. Die fehlenden Seiten: A − p und B − q.", "u: Die sechs Seiten des L sind zusammen so lang wie der Umfang des umgebenden Rechtecks."],
      musterloesungHtml:
        `G = ${cm(p)} · ${cm(B)} + (${cm(A)} − ${cm(p)}) · ${cm(q)} = ${qcm(p * B)} + ${qcm((A - p) * q)} = ${qcm(G)}<br>` +
        `u = ${cm(A)} + ${cm(q)} + ${cm(A - p)} + ${cm(B - q)} + ${cm(p)} + ${cm(B)} = ${cm(u)}<br>` +
        `M = ${cm(u)} · ${cm(h)} = ${qcm(u * h)}; O = 2 · ${qcm(G)} + ${qcm(u * h)} = <strong>${qcm(O)}</strong>`,
    };
  },
};

// ---------- E8: Balken lackieren ----------

const E8_KAND = spaeter(() => {
  const out = [];
  // Querschnitt in cm, Länge in m, Ergiebigkeit einer Dose in m².
  for (const q of [{ art: "dreieck", a: 30, b: 40, c: 50 }, { art: "dreieck", a: 15, b: 20, c: 25 }, { art: "rechteck", a: 20, b: 10 }, { art: "rechteck", a: 16, b: 12 }, { art: "rechteck", a: 24, b: 8 }]) {
    for (const L of [2, 2.5, 3, 4, 5]) for (const d of [1.5, 2, 2.5, 3]) {
      const a = q.a / 100, b = q.b / 100;
      const O = q.art === "dreieck" ? a * b + (a + b + q.c / 100) * L : 2 * a * b + 2 * (a + b) * L;
      // Nur Fälle, in denen die letzte Dose angebrochen wird — sonst wäre Auf- und Abrunden gleich.
      if (!glatt(O / d, 0) && glatt(O, 4)) out.push({ ...q, L, d, O });
    }
  }
  return out;
});
const E8 = {
  schwierigkeit: "komplex",
  titel: "Balken lackieren",
  abschnitt: ["sec-formel", "sec-anwenden"],
  generate() {
    const werte = (k) => {
      const ohneUmrechnen = k.art === "dreieck" ? k.a * k.b + (k.a + k.b + k.c) * k.L : 2 * k.a * k.b + 2 * (k.a + k.b) * k.L;
      const nurMantel = k.art === "dreieck" ? ((k.a + k.b + k.c) / 100) * k.L : (2 * (k.a + k.b) / 100) * k.L;
      return [k.O, ohneUmrechnen, nurMantel];
    };
    const k = ohneKollision(E8_KAND(), werte, 0.012);
    const a = k.a / 100, b = k.b / 100;
    const dosen = Math.ceil(k.O / k.d - 1e-9);
    const quer = k.art === "dreieck"
      ? `ein rechtwinkliges Dreieck mit den Katheten ${cm(k.a)} und ${cm(k.b)} und der Hypotenuse ${cm(k.c)}`
      : `ein Rechteck ${cm(k.a)} × ${cm(k.b)}`;
    const G = k.art === "dreieck" ? (a * b) / 2 : a * b, u = k.art === "dreieck" ? a + b + k.c / 100 : 2 * (a + b);
    const [, ohneUmrechnen, nurMantel] = werte(k);
    return {
      promptHtml: `Ein Holzbalken ist ${cm(k.L, "m")} lang; sein Querschnitt ist ${quer}. Er wird rundum lackiert. Eine Dose Lack reicht für ${qcm(k.d, "m")}. Wie groß ist die Oberfläche in m² (auf zwei Nachkommastellen), und wie viele Dosen braucht man?`,
      felder: [
        {
          name: "Oberfläche", einheit: "m²", soll: k.O, toleranz: 0.006,
          hinweis: hinweisAus([[ohneUmrechnen, "Die Maße stehen in cm und in m. Rechne vor dem Multiplizieren alles in m um: 1 cm = 0,01 m."], [nurMantel, "Das ist nur der Mantel. Die beiden Stirnflächen werden auch lackiert."]]),
        },
        {
          name: "Dosen", soll: dosen, toleranz: 0.01,
          hinweis: hinweisAus([[dosen - 1, "Mit so vielen Dosen bleibt ein Rest unlackiert — angebrochene Dosen zählen ganz: aufrunden."], [k.O / k.d, "Dosen kauft man nur ganz: Runde auf die nächste ganze Zahl auf."]]),
        },
      ],
      tipps: ["Rechne alle Längen in m um, bevor du multiplizierst.", "O = 2 · G + u · h; Dosen = O : (Fläche je Dose), aufgerundet."],
      musterloesungHtml:
        `In m: ${k.art === "dreieck" ? `Katheten ${cm(a, "m")} und ${cm(b, "m")}, Hypotenuse ${cm(k.c / 100, "m")}` : `${cm(a, "m")} × ${cm(b, "m")}`}.<br>` +
        `G = ${k.art === "dreieck" ? `½ · ${cm(a, "m")} · ${cm(b, "m")}` : `${cm(a, "m")} · ${cm(b, "m")}`} = ${qcm(G, "m")}; u = ${cm(u, "m")}<br>` +
        `O = 2 · ${qcm(G, "m")} + ${cm(u, "m")} · ${cm(k.L, "m")} = <strong>${qcm(k.O, "m")}</strong><br>` +
        `Dosen: ${num(k.O)} : ${num(k.d)} ${zeichen(k.O / k.d)} ${num(k.O / k.d, 2)} → aufgerundet <strong>${dosen}</strong> Dosen.`,
    };
  },
};

export const AUFGABEN = [E1, E2, E3, E4, E5, E6, E7, E8];
