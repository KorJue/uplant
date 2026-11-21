// Die acht Übungsaufgaben zu „Volumen von Prismen“ — zwei je Stufe:
//   einfach   — Volumen eines Quaders oder Würfels; V = G · h
//   mittel    — Volumen eines Dreiecksprismas; Raumeinheiten umrechnen
//   schwierig — rückwärts (Höhe oder Grundfläche, auch mit Litern); Graben mit Trapez-Querschnitt
//   komplex   — Gartenhaus (Rechteck + Dreieck); Schwimmbecken mit schrägem Boden und Füllzeit
//
// Schräge Seiten gehören zu rechtwinkligen Dreiecken mit ganzen Seiten — gegeben, nicht berechnet.
// Alle Zahlen kommen aus vorher gefilterten Listen, nie durch Verwerfen und Neuziehen.

import { num, pick, trifft, ohneKollision, spaeter, glatt } from "./seite.js?v=1";

const gleich = (w, x) => trifft(w, x, 0.01);
const cm = (x, e = "cm") => `${num(x)} ${e}`;
const hinweisAus = (liste) => (roh, w) => (liste.find(([x]) => Number.isFinite(x) && gleich(w, x)) || [0, ""])[1];

// ---------- V1: Quader und Würfel ----------

const V1_QUADER = spaeter(() => {
  const out = [];
  for (let a = 3; a <= 12; a++) for (let b = 2; b < a; b++) for (let c = 2; c <= 10; c++) if (c !== a && c !== b) out.push({ a, b, c });
  return out;
});
const V1 = {
  schwierigkeit: "einfach",
  titel: "Volumen eines Quaders",
  abschnitt: "sec-wuerfel",
  generate() {
    // Ein Drittel Würfel: In 20 Zügen fehlt die Fassung nur mit (⅔)²⁰ ≈ 0,03 ‰.
    if (Math.random() < 1 / 3) {
      // Ohne a = 3 und a = 6: Dort fallen 3 · a und a² bzw. a³ und 6 · a² zusammen.
      const a = pick([2, 4, 5, 7, 8, 9, 10, 12]);
      return {
        promptHtml: `Ein Würfel hat die Kantenlänge ${cm(a)}. Wie groß ist sein Volumen?`,
        correct: a ** 3, tolerance: 0.01,
        hinweis: hinweisAus([[6 * a * a, "Das ist die Oberfläche (sechs Quadrate). Das Volumen zählt Würfel: a · a · a."], [3 * a, "Beim Volumen wird multipliziert, nicht addiert: a · a · a."], [a * a, "Das ist nur eine Schicht. Es gibt a Schichten übereinander."]]),
        tipps: ["Wie viele Würfel von 1 cm³ passen in eine Schicht, wie viele Schichten gibt es?", "V = a · a · a = a³"],
        musterloesungHtml: `Eine Schicht: ${a} · ${a} = ${a * a} Würfel; ${a} Schichten.<br>V = ${a} cm · ${a} cm · ${a} cm = <strong>${num(a ** 3)} cm³</strong>`,
      };
    }
    const { a, b, c } = ohneKollision(V1_QUADER(), ({ a, b, c }) => [a * b * c, 2 * (a * b + a * c + b * c), a + b + c, a * b]);
    return {
      promptHtml: `Ein Quader ist ${cm(a)} lang, ${cm(b)} breit und ${cm(c)} hoch. Wie groß ist sein Volumen?`,
      correct: a * b * c, tolerance: 0.01,
      hinweis: hinweisAus([[2 * (a * b + a * c + b * c), "Das ist die Oberfläche in cm². Das Volumen zählt Würfel: a · b · c."], [a + b + c, "Beim Volumen wird multipliziert, nicht addiert."], [a * b, "Das ist nur die unterste Schicht. Es gibt so viele Schichten, wie der Quader hoch ist."]]),
      tipps: ["Wie viele Würfel von 1 cm³ liegen in der untersten Schicht?", "V = a · b · c = G · h"],
      musterloesungHtml: `Eine Schicht: ${a} · ${b} = ${a * b} Würfel; ${c} Schichten.<br>V = ${cm(a)} · ${cm(b)} · ${cm(c)} = <strong>${num(a * b * c)} cm³</strong>`,
    };
  },
};

// ---------- V2: V = G · h ----------

const V2_KAND = spaeter(() => {
  const out = [];
  for (const G of [12, 15, 18, 20, 24, 30, 35, 36, 42, 48, 50, 60]) for (const h of [3, 4, 5, 6, 7, 8, 9, 10, 12, 15]) out.push({ G, h });
  return out;
});
const V2 = {
  schwierigkeit: "einfach",
  titel: "V = G · h",
  abschnitt: "sec-gh",
  generate() {
    const { G, h } = ohneKollision(V2_KAND(), ({ G, h }) => [G * h, G + h, (G * h) / 2, 2 * G * h]);
    return {
      promptHtml: `Ein Prisma hat eine Grundfläche von ${cm(G)}² und ist ${cm(h)} hoch. Wie groß ist sein Volumen?`,
      correct: G * h, tolerance: 0.01,
      hinweis: hinweisAus([[G + h, "Grundfläche und Höhe werden multipliziert, nicht addiert: V = G · h."], [(G * h) / 2, "Halbiert wird nur beim Flächeninhalt des Dreiecks — G ist hier schon gegeben."], [2 * G * h, "2 · G gehört zur Oberfläche (Grund- und Deckfläche). Das Volumen ist G · h."]]),
      tipps: ["Die Grundfläche wird h-mal übereinander gestapelt.", "V = G · h"],
      musterloesungHtml: `V = G · h = ${cm(G)}² · ${cm(h)} = <strong>${num(G * h)} cm³</strong>`,
    };
  },
};

// ---------- V3: Dreiecksprisma ----------

const RW = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 15, 17]];
const ALLG = [
  { g: 14, hg: 12, s: [13, 15] }, { g: 6, hg: 4, s: [5, 5] }, { g: 8, hg: 3, s: [5, 5] }, { g: 12, hg: 8, s: [10, 10] },
  { g: 10, hg: 12, s: [13, 13] }, { g: 21, hg: 8, s: [10, 17] }, { g: 21, hg: 12, s: [13, 20] }, { g: 16, hg: 15, s: [17, 17] },
];
const V3 = {
  schwierigkeit: "mittel",
  titel: "Volumen eines Dreiecksprismas",
  abschnitt: "sec-dreieck",
  generate() {
    const allgemein = Math.random() < 0.5;
    const d = allgemein ? pick(ALLG) : (() => { const [a, b, c] = pick(RW); return { g: a, hg: b, s: [b, c], rw: true }; })();
    // Die Seite, die man fälschlich als Höhe nimmt: beim rechtwinkligen die Hypotenuse, sonst die erste Seite.
    const falscheSeite = d.rw ? d.s[1] : d.s[0];
    const hs = [3, 4, 5, 6, 7, 8, 10, 12, 15, 20];
    const { h } = ohneKollision(hs.map((h) => ({ h })), ({ h }) => [(d.g * d.hg * h) / 2, d.g * d.hg * h, (d.g * falscheSeite * h) / 2, (d.g * d.hg) / 2]);
    const V = (d.g * d.hg * h) / 2;
    const angabe = d.rw
      ? `Die Grundfläche ist ein rechtwinkliges Dreieck mit den Katheten ${cm(d.g)} und ${cm(d.hg)} und der Hypotenuse ${cm(d.s[1])}.`
      : `Die Grundfläche ist ein Dreieck mit den Seiten ${cm(d.g)}, ${cm(d.s[0])} und ${cm(d.s[1])}; die Höhe auf die Seite ${cm(d.g)} ist ${cm(d.hg)} lang.`;
    return {
      promptHtml: `${angabe} Das Prisma ist ${cm(h)} hoch. Wie groß ist sein Volumen?`,
      correct: V, tolerance: 0.01,
      hinweis: hinweisAus([
        [d.g * d.hg * h, "Das ist der ganze Quader. Das Dreiecksprisma ist seine Hälfte: ½ · g · h<sub>g</sub> · h."],
        [(d.g * falscheSeite * h) / 2, d.rw ? "Die Hypotenuse ist keine Höhe. Im rechtwinkligen Dreieck stehen die Katheten senkrecht aufeinander." : "Eine schräge Seite ist keine Höhe. Nimm die Höhe, die senkrecht auf der Grundseite steht."],
        [(d.g * d.hg) / 2, "Das ist nur die Grundfläche G. Das Volumen ist G · h."],
      ]),
      tipps: [d.rw ? "Im rechtwinkligen Dreieck sind die Katheten Grundseite und Höhe." : "G = ½ · g · h<sub>g</sub> mit der Höhe, die auf g senkrecht steht.", "V = G · h mit der Höhe des Prismas."],
      musterloesungHtml: `G = ½ · ${cm(d.g)} · ${cm(d.hg)} = ${num((d.g * d.hg) / 2)} cm²<br>V = G · h = ${num((d.g * d.hg) / 2)} cm² · ${cm(h)} = <strong>${num(V)} cm³</strong>`,
    };
  },
};

// ---------- V4: Raumeinheiten ----------

// [von, nach, Faktor (Wert in „von“ mal Faktor ergibt „nach“), mögliche Werte]
const UMRECHNUNGEN = [
  ["dm³", "cm³", 1000, [2.5, 0.75, 3.2, 12, 0.04, 1.25]],
  ["cm³", "dm³", 0.001, [4500, 750, 80, 12500, 2300]],
  ["l", "ml", 1000, [2.5, 0.75, 1.2, 0.33, 4]],
  ["ml", "l", 0.001, [250, 1500, 330, 2000, 75]],
  ["m³", "l", 1000, [2, 0.5, 1.25, 3.6, 0.08]],
  ["l", "m³", 0.001, [500, 2500, 12000, 750]],
  ["m³", "dm³", 1000, [1.5, 0.25, 4, 0.7]],
  ["cm³", "ml", 1, [250, 750, 40, 1250]],
  ["dm³", "l", 1, [3.5, 12, 0.8, 250]],
];
const V4 = {
  schwierigkeit: "mittel",
  titel: "Raumeinheiten umrechnen",
  abschnitt: "sec-einheiten",
  generate() {
    const [von, nach, f, werte] = pick(UMRECHNUNGEN);
    const x = pick(werte), soll = x * f;
    const falsch = f === 1
      ? [[x * 1000, `${von} und ${nach} sind gleich groß: 1 ml = 1 cm³, 1 l = 1 dm³.`], [x / 1000, `${von} und ${nach} sind gleich groß: 1 ml = 1 cm³, 1 l = 1 dm³.`]]
      : [[f > 1 ? x * 100 : x / 100, "Bei Raumeinheiten ist die Umrechnungszahl 1000, nicht 100 — 10 · 10 · 10."], [f > 1 ? x * 10 : x / 10, "Bei Raumeinheiten ist die Umrechnungszahl 1000, nicht 10 — 10 · 10 · 10."], [f > 1 ? x / 1000 : x * 1000, `Falsche Richtung: ${nach} ist die ${f > 1 ? "kleinere" : "größere"} Einheit, also wird die Zahl ${f > 1 ? "größer" : "kleiner"}.`]];
    return {
      promptHtml: `Rechne um: ${num(x)} ${von} = ? ${nach}`,
      correct: soll, tolerance: Math.abs(soll) * 1e-9 + 1e-9,
      hinweis: hinweisAus(falsch),
      tipps: ["1 dm³ = 1000 cm³, 1 m³ = 1000 dm³; 1 l = 1 dm³, 1 ml = 1 cm³.", "In die kleinere Einheit: mal 1000. In die größere: durch 1000."],
      musterloesungHtml: f === 1
        ? `${von === "cm³" ? "1 ml = 1 cm³" : "1 l = 1 dm³"}, also ${num(x)} ${von} = <strong>${num(soll)} ${nach}</strong>.`
        : `${f > 1 ? `1 ${von} = 1000 ${nach}` : `1000 ${von} = 1 ${nach}`}, also ${num(x)} ${von} = ${num(x)} ${f > 1 ? "·" : ":"} 1000 ${nach} = <strong>${num(soll)} ${nach}</strong>.`,
    };
  },
};

// ---------- V5: Rückwärts ----------

const V5_VASE = spaeter(() => {
  const out = [];
  for (const G of [50, 80, 100, 120, 125, 150, 200, 250]) for (const l of [0.5, 0.75, 1, 1.2, 1.5, 2, 2.5, 3]) {
    const h = (l * 1000) / G;
    if (glatt(h, 1) && h >= 3 && h <= 40) out.push({ G, l, h });
  }
  return out;
});
const V5_PRISMA = spaeter(() => {
  const out = [];
  for (const G of [12, 15, 18, 20, 24, 30, 36, 45]) for (const h of [4, 5, 6, 8, 10, 12, 15]) out.push({ G, h, V: G * h });
  return out;
});
const V5 = {
  schwierigkeit: "schwierig",
  titel: "Rückwärts: Höhe oder Grundfläche",
  abschnitt: ["sec-gh", "sec-einheiten"],
  generate() {
    if (Math.random() < 0.5) {
      const { G, l, h } = ohneKollision(V5_VASE(), ({ G, l, h }) => [h, l / G, (l * 100) / G, (l * 1000) / (2 * G)], 0.02);
      return {
        promptHtml: `Ein Gefäß in Form eines Prismas hat innen eine Grundfläche von ${cm(G)}². Man füllt ${num(l)} l Wasser ein. Wie hoch steht das Wasser (in cm)?`,
        correct: h, tolerance: 0.01,
        hinweis: hinweisAus([[l / G, "Erst die Liter in cm³ umrechnen: 1 l = 1000 cm³."], [(l * 100) / G, "1 l = 1000 cm³, nicht 100 cm³."], [(l * 1000) / (2 * G), "V = G · h — es wird nur durch G geteilt."]]),
        tipps: ["V = G · h, also h = V : G.", "Rechne die Liter zuerst in cm³ um: 1 l = 1 dm³ = 1000 cm³."],
        musterloesungHtml: `V = ${num(l)} l = ${num(l * 1000)} cm³<br>h = V : G = ${num(l * 1000)} cm³ : ${cm(G)}² = <strong>${cm(h)}</strong><br><em>Probe:</em> ${cm(G)}² · ${cm(h)} = ${num(l * 1000)} cm³ = ${num(l)} l.`,
      };
    }
    const { G, h, V } = ohneKollision(V5_PRISMA(), ({ G, h, V }) => [G, V - h, V * h, V / (2 * h)], 0.02);
    return {
      promptHtml: `Ein Prisma ist ${cm(h)} hoch und hat das Volumen ${num(V)} cm³. Wie groß ist seine Grundfläche (in cm²)?`,
      correct: G, tolerance: 0.01,
      hinweis: hinweisAus([[V - h, "V = G · h: Um G zu finden, wird geteilt, nicht subtrahiert."], [V * h, "Rückwärts heißt: durch h teilen, nicht mal h."], [V / (2 * h), "Es gibt beim Volumen kein 2 · G — G = V : h."]]),
      tipps: ["V = G · h — welche Rechnung macht das „mal h“ rückgängig?", "G = V : h"],
      musterloesungHtml: `G = V : h = ${num(V)} cm³ : ${cm(h)} = <strong>${num(G)} cm²</strong><br><em>Probe:</em> ${num(G)} cm² · ${cm(h)} = ${num(V)} cm³.`,
    };
  },
};

// ---------- V6: Graben mit Trapez-Querschnitt ----------

const V6_KAND = spaeter(() => {
  const out = [];
  for (const c of [0.5, 0.8, 1, 1.2]) for (const zu of [0.4, 0.6, 1]) for (const t of [0.5, 0.6, 0.8, 1]) for (const L of [10, 12, 15, 20, 25]) {
    const a = c + zu, V = ((a + c) / 2) * t * L;
    if (glatt(V, 3) && glatt(a, 1)) out.push({ a: Math.round(a * 10) / 10, c, t, L, V });
  }
  return out;
});
const V6 = {
  schwierigkeit: "schwierig",
  titel: "Ein Graben",
  abschnitt: ["sec-gh", "sec-einheiten"],
  generate() {
    const k = ohneKollision(V6_KAND(), ({ a, c, t, L, V }) => [V, (a + c) * t * L, a * t * L, c * t * L], 0.005);
    const { a, c, t, L, V } = k;
    return {
      promptHtml: `Ein Graben ist ${cm(L, "m")} lang. Sein Querschnitt ist ein Trapez: oben ${cm(a, "m")} breit, unten ${cm(c, "m")} breit und ${cm(t, "m")} tief. Wie viel Erde wurde ausgehoben — in m³ und in Litern?`,
      felder: [
        { name: "Volumen", einheit: "m³", soll: V, toleranz: 0.0005, hinweis: hinweisAus([[(a + c) * t * L, "Beim Trapez wird der Mittelwert der parallelen Seiten genommen: (a + c) : 2."], [a * t * L, "So breit ist der Graben nur oben. Nimm den Mittelwert aus oben und unten."], [c * t * L, "So breit ist der Graben nur unten. Nimm den Mittelwert aus oben und unten."]]) },
        { name: "in Litern", einheit: "l", soll: V * 1000, toleranz: 0.5, hinweis: hinweisAus([[V * 100, "1 m³ = 1000 l (1000 dm³), nicht 100 l."], [V * 1e6, "Das sind cm³. In Litern: 1 m³ = 1000 dm³ = 1000 l."]]) },
      ],
      tipps: ["Der Graben ist ein liegendes Prisma; seine Grundfläche ist das Trapez.", "G = (a + c) : 2 · t, V = G · Länge; 1 m³ = 1000 l."],
      musterloesungHtml:
        `G = (${cm(a, "m")} + ${cm(c, "m")}) : 2 · ${cm(t, "m")} = ${num(((a + c) / 2) * t)} m²<br>` +
        `V = G · L = ${num(((a + c) / 2) * t)} m² · ${cm(L, "m")} = <strong>${num(V)} m³</strong> = <strong>${num(V * 1000)} l</strong>`,
    };
  },
};

// ---------- V7: Gartenhaus ----------

const V7_KAND = spaeter(() => {
  const out = [];
  for (const w of [2, 2.5, 3, 4]) for (const hw of [2, 2.2, 2.5]) for (const dach of [0.8, 1, 1.2, 1.5]) for (const L of [2, 3, 4, 5]) {
    const V = (w * hw + 0.5 * w * dach) * L;
    if (glatt(V, 2)) out.push({ w, hw, H: Math.round((hw + dach) * 10) / 10, dach, L, V });
  }
  return out;
});
const V7 = {
  schwierigkeit: "komplex",
  titel: "Ein Gartenhaus",
  abschnitt: "sec-gh",
  generate() {
    // Das Dach nicht zu halbieren ergibt dasselbe wie ein Quader bis zum First (w · hw + w · dach = w · H):
    // ein Fehlerwert, ein Hinweis.
    const k = ohneKollision(V7_KAND(), ({ w, hw, L, H, V }) => [V, w * H * L, w * hw * L], 0.01);
    const { w, hw, H, dach, L, V } = k;
    return {
      promptHtml: `Ein Gartenhaus hat ein Satteldach. Vorn ist es ${cm(w, "m")} breit; die Wände sind ${cm(hw, "m")} hoch, der First ist ${cm(H, "m")} hoch. Das Haus ist ${cm(L, "m")} lang. Wie groß ist der umbaute Raum (in m³)?`,
      correct: V, tolerance: 0.005,
      hinweis: hinweisAus([[w * H * L, "Das wäre ein Quader bis zum First. Das Dach ist im Querschnitt ein Dreieck: ½ · Breite · Dachhöhe."], [w * hw * L, "Da fehlt der Dachraum. Die Grundfläche ist Rechteck PLUS Dreieck."]]),
      tipps: ["Das Haus ist ein liegendes Prisma. Seine Grundfläche ist die Vorderseite: ein Rechteck mit einem Dreieck darauf.", `Die Dachhöhe ist First minus Wandhöhe: ${num(H)} m − ${num(hw)} m.`],
      musterloesungHtml:
        `Dachhöhe: ${cm(H, "m")} − ${cm(hw, "m")} = ${cm(dach, "m")}<br>` +
        `G = Rechteck + Dreieck = ${cm(w, "m")} · ${cm(hw, "m")} + ½ · ${cm(w, "m")} · ${cm(dach, "m")} = ${num(w * hw)} m² + ${num(0.5 * w * dach)} m² = ${num(w * hw + 0.5 * w * dach)} m²<br>` +
        `V = G · L = ${num(w * hw + 0.5 * w * dach)} m² · ${cm(L, "m")} = <strong>${num(V)} m³</strong>`,
    };
  },
};

// ---------- V8: Schwimmbecken ----------

const V8_KAND = spaeter(() => {
  const out = [];
  for (const L of [10, 12, 15, 20, 25]) for (const B of [4, 5, 6, 8]) for (const t1 of [0.8, 1, 1.2]) for (const t2 of [1.8, 2, 2.4]) for (const Q of [200, 250, 400, 500, 600, 800, 1000]) {
    const V = ((t1 + t2) / 2) * L * B, stunden = (V * 1000) / Q / 60;
    if (glatt(V, 2) && glatt(stunden, 1)) out.push({ L, B, t1, t2, Q, V, stunden });
  }
  return out;
});
const V8 = {
  schwierigkeit: "komplex",
  titel: "Ein Schwimmbecken füllen",
  abschnitt: ["sec-gh", "sec-einheiten"],
  generate() {
    const k = ohneKollision(V8_KAND(), ({ L, B, t1, t2, V }) => [V, t2 * L * B, t1 * L * B, (t1 + t2) * L * B], 0.01);
    const { L, B, t1, t2, Q, V, stunden } = k;
    return {
      promptHtml: `Ein Schwimmbecken ist ${cm(L, "m")} lang und ${cm(B, "m")} breit. Der Boden ist schräg: An einem Ende ist das Becken ${cm(t1, "m")} tief, am anderen ${cm(t2, "m")}. Eine Pumpe füllt ${num(Q)} Liter in der Minute ein. Wie viel Wasser fasst das Becken, und wie viele Stunden dauert das Füllen?`,
      felder: [
        { name: "Volumen", einheit: "m³", soll: V, toleranz: 0.005, hinweis: hinweisAus([[t2 * L * B, "So tief ist das Becken nur am tiefen Ende. Der Querschnitt längs ist ein Trapez: Mittelwert der beiden Tiefen."], [t1 * L * B, "So tief ist das Becken nur am flachen Ende. Nimm den Mittelwert der beiden Tiefen."], [(t1 + t2) * L * B, "Beim Trapez wird der Mittelwert genommen: (t₁ + t₂) : 2."]]) },
        { name: "Füllzeit", einheit: "h", soll: stunden, toleranz: 0.05, hinweis: hinweisAus([[stunden * 60, "Das sind Minuten. Gefragt sind Stunden: durch 60 teilen."], [V / Q / 60, "Erst die m³ in Liter umrechnen: 1 m³ = 1000 l."]]) },
      ],
      tipps: ["Das Becken ist ein liegendes Prisma: Seine Grundfläche ist der Längsschnitt, ein Trapez mit den Tiefen als parallelen Seiten.", "V = (t₁ + t₂) : 2 · L · B; dann in Liter umrechnen und durch die Liter je Minute teilen."],
      musterloesungHtml:
        `G = (${cm(t1, "m")} + ${cm(t2, "m")}) : 2 · ${cm(L, "m")} = ${num(((t1 + t2) / 2) * L)} m²<br>` +
        `V = G · B = ${num(((t1 + t2) / 2) * L)} m² · ${cm(B, "m")} = <strong>${num(V)} m³</strong> = ${num(V * 1000)} l<br>` +
        `Zeit: ${num(V * 1000)} l : ${num(Q)} l/min = ${num(stunden * 60)} min = <strong>${num(stunden)} h</strong>`,
    };
  },
};

export const AUFGABEN = [V1, V2, V3, V4, V5, V6, V7, V8];
