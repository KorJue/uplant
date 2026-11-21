// Die acht Übungsaufgaben zu „Volumen von Zylindern“ — zwei je Stufe:
//   einfach   — Volumen (aus r oder d); Inhalt eines Topfes in Litern
//   mittel    — Füllhöhe aus Litern (mit Probe); doppelter Radius, halbe Höhe
//   schwierig — Hohlzylinder (Außendurchmesser und Wandstärke); Masse eines Rohres (Dichte)
//   komplex   — Wassertank füllen (m³, Liter, Zeit); Werkstück mit Bohrung
//
// Wie auf der Kreis-Seite: gerechnet mit der π-Taste, das Ergebnis auf zwei Nachkommastellen gerundet
// (Toleranz 0,015). Den Radius aus einem Volumen zu bestimmen braucht die Quadratwurzel — rückwärts
// wird hier nur die Höhe gesucht.

import { num, zwei, pick, trifft, ohneKollision, glatt, TOL_PI, mitDreiVierzehn, HINWEIS_314 } from "./seite.js?v=1";

const PI = Math.PI;
const cm = (x, e = "cm") => `${num(x)} ${e}`;
const RUNDEN = `<br><span class="progress-note">Rechne mit der π-Taste und runde das Ergebnis auf zwei Nachkommastellen.</span>`;
const hinweisAus = (liste) => (roh, w) => (liste.find(([x]) => Number.isFinite(x) && trifft(w, x, TOL_PI + 1e-9)) || [0, ""])[1];
const r2 = (x) => Math.round(x * 100) / 100;

// ---------- W1: Volumen ----------

function vFehler(r, h, mitD) {
  const V = PI * r * r * h;
  return [
    // Bei r = 1 ist π · r · h, bei r = 2 ist 2 · π · r · h zahlengleich mit dem Volumen — dort gibt es
    // keinen Fehlerwert (NaN), sonst fiele der ganze Radius aus dem Vorrat.
    [r === 1 ? NaN : PI * r * h, "Der Radius wird quadriert: π · r · r · h."],
    [r === 2 ? NaN : 2 * PI * r * h, "2 · π · r · h ist der Mantel, eine Fläche. Das Volumen ist Grundfläche mal Höhe: π · r² · h."],
    [mitD ? PI * 4 * r * r * h : NaN, "Du hast den Durchmesser quadriert: d² = 4 · r². Erst r = d : 2."],
    [mitDreiVierzehn(V, 3.14 * r * r * h), HINWEIS_314],
  ];
}
const W1 = {
  schwierigkeit: "einfach",
  titel: "Das Volumen",
  abschnitt: "sec-volumen",
  generate() {
    const r = pick([1, 1.5, 2, 2.5, 3, 4, 5, 6]), mitD = Math.random() < 0.5;
    const { h } = ohneKollision([2, 3, 4, 5, 6, 8, 10, 12, 15].map((h) => ({ h })), ({ h }) => [PI * r * r * h, ...vFehler(r, h, mitD).map((x) => x[0])], 0.05);
    const V = PI * r * r * h;
    return {
      promptHtml: `Ein Zylinder hat ${mitD ? `den Durchmesser ${cm(2 * r)}` : `den Radius ${cm(r)}`} und ist ${cm(h)} hoch. Wie groß ist sein Volumen (in cm³)?` + RUNDEN,
      correct: r2(V), tolerance: TOL_PI,
      hinweis: hinweisAus(vFehler(r, h, mitD)),
      tipps: ["V = G · h — die Grundfläche ist ein Kreis.", "V = π · r² · h"],
      musterloesungHtml: `${mitD ? `r = ${cm(2 * r)} : 2 = ${cm(r)}<br>` : ""}V = π · (${cm(r)})² · ${cm(h)} = ${num(r * r * h)} · π cm³ ≈ <strong>${zwei(V)} cm³</strong>`,
    };
  },
};

// ---------- W2: Topf in Litern ----------

const W2 = {
  schwierigkeit: "einfach",
  titel: "Ein Kochtopf",
  abschnitt: ["sec-volumen", "sec-umkehr"],
  generate() {
    const d = pick([16, 18, 20, 22, 24, 26, 28]), h = pick([10, 12, 14, 15, 16, 18, 20]);
    const r = d / 2, V = PI * r * r * h, l = V / 1000;
    return {
      promptHtml: `Ein zylinderförmiger Kochtopf hat innen den Durchmesser ${cm(d)} und ist ${cm(h)} hoch. Wie viele Liter fasst er?` + RUNDEN,
      correct: r2(l), tolerance: TOL_PI,
      hinweis: hinweisAus([
        [V, "Das sind cm³. 1 l = 1000 cm³: durch 1000 teilen."],
        [V / 100, "1 l = 1000 cm³, nicht 100 cm³."],
        [4 * l, "Du hast den Durchmesser quadriert. Erst r = d : 2, dann r²."],
        [mitDreiVierzehn(l, (3.14 * r * r * h) / 1000), HINWEIS_314],
      ]),
      tipps: ["Erst das Volumen in cm³: V = π · r² · h mit r = d : 2.", "Dann in Liter: 1 l = 1 dm³ = 1000 cm³."],
      musterloesungHtml: `r = ${cm(d)} : 2 = ${cm(r)}<br>V = π · (${cm(r)})² · ${cm(h)} ≈ ${zwei(V)} cm³ ≈ <strong>${zwei(l)} l</strong>`,
    };
  },
};

// ---------- W3: Füllhöhe ----------

const W3_KAND = (() => {
  const out = [];
  for (const r of [3, 4, 5, 6, 8, 10]) for (const l of [0.5, 0.75, 1, 1.5, 2, 2.5, 3, 5]) {
    const h = (l * 1000) / (PI * r * r);
    if (h > 2 && h < 60) out.push({ r, l, h });
  }
  return out;
})();
const W3 = {
  schwierigkeit: "mittel",
  titel: "Wie hoch steht das Wasser?",
  abschnitt: "sec-umkehr",
  generate() {
    const { r, l, h } = ohneKollision(W3_KAND, ({ r, l, h }) => [h, l / (PI * r * r), (l * 1000) / (2 * PI * r), (l * 1000) / (PI * r), mitDreiVierzehn(h, (l * 1000) / (3.14 * r * r))], 0.05);
    return {
      promptHtml: `In ein zylinderförmiges Gefäß mit dem Innenradius ${cm(r)} werden ${num(l)} l Wasser gegossen. Wie hoch steht das Wasser (in cm)?` + RUNDEN,
      correct: r2(h), tolerance: TOL_PI,
      hinweis: hinweisAus([
        [l / (PI * r * r), "Erst die Liter in cm³ umrechnen: 1 l = 1000 cm³."],
        [(l * 1000) / (2 * PI * r), "Geteilt wird durch die Grundfläche π · r², nicht durch den Umfang."],
        [(l * 1000) / (PI * r), "Der Radius wird quadriert: Grundfläche π · r²."],
        [mitDreiVierzehn(h, (l * 1000) / (3.14 * r * r)), HINWEIS_314],
      ]),
      tipps: ["V = π · r² · h — stelle nach h um.", "h = V : (π · r²); vorher Liter in cm³."],
      musterloesungHtml: `V = ${num(l)} l = ${num(l * 1000)} cm³; G = π · ${num(r * r)} cm² ≈ ${zwei(PI * r * r)} cm²<br>h = V : G ≈ <strong>${zwei(h)} cm</strong><br><em>Probe:</em> π · ${num(r * r)} cm² · ${zwei(h)} cm ≈ ${num(PI * r * r * r2(h), 0)} cm³ ≈ ${num(l)} l.`,
    };
  },
};

// ---------- W4: doppelter Radius, halbe Höhe ----------

const W4 = {
  schwierigkeit: "mittel",
  titel: "Breiter, aber niedriger",
  abschnitt: "sec-volumen",
  generate() {
    const r = pick([1.5, 2, 2.5, 3, 4, 5]), h = pick([4, 6, 8, 10, 12, 16, 20]);
    const VA = PI * r * r * h, VB = PI * (2 * r) ** 2 * (h / 2);
    return {
      promptHtml: `Dose A hat den Radius ${cm(r)} und die Höhe ${cm(h)}. Dose B ist doppelt so breit (doppelter Radius), aber nur halb so hoch. Berechne beide Volumen.` + RUNDEN,
      felder: [
        { name: "Dose A", einheit: "cm³", soll: r2(VA), toleranz: TOL_PI, hinweis: hinweisAus(vFehler(r, h, false)) },
        {
          name: "Dose B", einheit: "cm³", soll: r2(VB), toleranz: TOL_PI,
          hinweis: hinweisAus([[VA, "Doppelter Radius heißt vierfache Grundfläche (2 · r)² = 4 · r² — halbe Höhe gleicht nur die Hälfte davon aus."], [4 * VA, "Die Höhe ist auch halbiert: vierfache Grundfläche, halbe Höhe."], [PI * (2 * r) * (h / 2), "Der Radius wird quadriert: π · (2r)² · h/2."]]),
        },
      ],
      tipps: ["Rechne beide Dosen einzeln mit V = π · r² · h.", "Dose B: Radius 2 · r, Höhe h : 2."],
      musterloesungHtml:
        `A: V = π · (${cm(r)})² · ${cm(h)} ≈ <strong>${zwei(VA)} cm³</strong><br>` +
        `B: V = π · (${cm(2 * r)})² · ${cm(h / 2)} ≈ <strong>${zwei(VB)} cm³</strong> — doppelt so viel wie A: Der Radius geht quadriert ein, die Höhe nur einfach.`,
    };
  },
};

// ---------- W5: Hohlzylinder ----------

const W5 = {
  schwierigkeit: "schwierig",
  titel: "Ein Rohr",
  abschnitt: "sec-hohl",
  generate() {
    const kand = [];
    for (const D of [6, 8, 10, 12, 16, 20]) for (const w of [0.5, 1, 1.5, 2]) for (const h of [10, 20, 25, 50, 100]) if (w < D / 2 - 1) kand.push({ D, w, h });
    const werte = ({ D, w, h }) => { const R = D / 2, r = R - w; return [PI * (R * R - r * r) * h, PI * (R - r) ** 2 * h, PI * R * R * h, PI * (R * R + r * r) * h, PI * (D * D - (D - w) ** 2) * h]; };
    const { D, w, h } = ohneKollision(kand, werte, 0.05);
    const R = D / 2, r = R - w, V = PI * (R * R - r * r) * h;
    return {
      promptHtml: `Ein Rohr ist ${cm(h)} lang, hat den Außendurchmesser ${cm(D)} und die Wandstärke ${cm(w)}. Wie groß ist das Volumen des Materials (in cm³)?` + RUNDEN,
      correct: r2(V), tolerance: TOL_PI,
      hinweis: hinweisAus([
        [PI * (R - r) ** 2 * h, "Erst quadrieren, dann abziehen: π · (R² − r²) · h — nicht π · (R − r)² · h."],
        [PI * R * R * h, "Das ist der volle Zylinder. Das Loch muss abgezogen werden."],
        [PI * (R * R + r * r) * h, "Das Loch wird abgezogen, nicht addiert."],
        [PI * (D * D - (D - w) ** 2) * h, "Rechne mit Radien: R = D : 2, und der Innenradius ist R minus Wandstärke."],
      ]),
      tipps: ["Außenradius R = D : 2, Innenradius r = R − Wandstärke.", "V = π · (R² − r²) · h"],
      musterloesungHtml: `R = ${cm(D)} : 2 = ${cm(R)}; r = ${cm(R)} − ${cm(w)} = ${cm(r)}<br>V = π · (${num(R * R)} − ${num(r * r)}) cm² · ${cm(h)} ≈ <strong>${zwei(V)} cm³</strong>`,
    };
  },
};

// ---------- W6: Masse eines Rohres ----------

const STOFFE = [{ name: "Eisen", rho: 7.9 }, { name: "Kupfer", rho: 8.9 }, { name: "Aluminium", rho: 2.7 }];
const W6 = {
  schwierigkeit: "schwierig",
  titel: "Wie schwer ist das Rohr?",
  abschnitt: "sec-hohl",
  generate() {
    const s = pick(STOFFE);
    const kand = [];
    for (const R of [2, 2.5, 3, 4, 5]) for (const w of [0.2, 0.25, 0.4, 0.5]) for (const L of [50, 100, 150, 200]) kand.push({ R, r: Math.round((R - w) * 100) / 100, L });
    const { R, r, L } = ohneKollision(kand, ({ R, r, L }) => { const V = PI * (R * R - r * r) * L; return [V * s.rho / 1000, V * s.rho, V / s.rho / 1000]; }, 0.05);
    const V = PI * (R * R - r * r) * L, m = (V * s.rho) / 1000;
    return {
      promptHtml: `Ein Rohr aus ${s.name} (Dichte ${num(s.rho)} g/cm³) ist ${cm(L)} lang; sein Außenradius ist ${cm(R)}, sein Innenradius ${cm(r)}. Berechne das Volumen des Metalls und die Masse des Rohres in kg.` + RUNDEN,
      felder: [
        { name: "Volumen", einheit: "cm³", soll: r2(V), toleranz: TOL_PI, hinweis: hinweisAus([[PI * (R - r) ** 2 * L, "Erst quadrieren, dann abziehen: π · (R² − r²) · L."], [PI * R * R * L, "Das Loch in der Mitte gehört nicht zum Metall."]]) },
        { name: "Masse", einheit: "kg", soll: r2(m), toleranz: TOL_PI, hinweis: hinweisAus([[V * s.rho, "Das ist die Masse in Gramm. 1 kg = 1000 g."], [V / s.rho / 1000, "Masse = Dichte · Volumen — mal, nicht geteilt."]]) },
      ],
      tipps: ["V = π · (R² − r²) · L", "m = ρ · V in Gramm, dann durch 1000 für kg."],
      musterloesungHtml: `V = π · (${num(R * R)} − ${num(r * r)}) cm² · ${cm(L)} ≈ <strong>${zwei(V)} cm³</strong><br>m = ${num(s.rho)} g/cm³ · ${zwei(V)} cm³ ≈ ${num(V * s.rho, 0)} g ≈ <strong>${zwei(m)} kg</strong>`,
    };
  },
};

// ---------- W7: Wassertank füllen ----------

const W7_KAND = (() => {
  const out = [];
  for (const d of [1, 1.2, 1.5, 2, 2.4, 3]) for (const h of [1, 1.5, 2, 2.5]) for (const q of [20, 25, 40, 50, 60, 80, 100]) out.push({ d, h, q });
  return out;
})();
const W7 = {
  schwierigkeit: "komplex",
  titel: "Einen Wassertank füllen",
  abschnitt: ["sec-volumen", "sec-umkehr"],
  generate() {
    const werte = ({ d, h, q }) => { const V = PI * (d / 2) ** 2 * h; return [V * 1000, V, V * 4 * 1000]; };
    const { d, h, q } = ohneKollision(W7_KAND, werte, 0.05);
    const V = PI * (d / 2) ** 2 * h, l = V * 1000, min = l / q;
    return {
      promptHtml: `Ein zylinderförmiger Wassertank hat innen den Durchmesser ${cm(d, "m")} und ist ${cm(h, "m")} hoch. Ein Schlauch liefert ${q} Liter je Minute. Wie viele Liter fasst der Tank, und wie viele Minuten dauert es, ihn zu füllen?` + RUNDEN,
      felder: [
        { name: "Inhalt", einheit: "l", soll: r2(l), toleranz: TOL_PI, hinweis: hinweisAus([[V, "Das sind m³. 1 m³ = 1000 l."], [V * 4 * 1000, "Du hast den Durchmesser quadriert. Erst r = d : 2."], [V * 100, "1 m³ = 1000 l, nicht 100 l."]]) },
        { name: "Zeit", einheit: "min", soll: r2(min), toleranz: TOL_PI, hinweis: hinweisAus([[min / 60, "Das sind Stunden. Gefragt sind Minuten."], [l * q, "Teile den Inhalt durch die Liter je Minute — nicht malnehmen."]]) },
      ],
      tipps: ["Rechne in m: V = π · r² · h mit r = d : 2; dann 1 m³ = 1000 l.", "Zeit = Liter : (Liter je Minute)."],
      musterloesungHtml:
        `r = ${cm(d / 2, "m")}; V = π · (${cm(d / 2, "m")})² · ${cm(h, "m")} ≈ ${num(V, 4)} m³ ≈ <strong>${zwei(l)} l</strong><br>` +
        `Zeit: ${zwei(l)} l : ${q} l/min ≈ <strong>${zwei(min)} min</strong>`,
    };
  },
};

// ---------- W8: Werkstück mit Bohrung ----------

const W8 = {
  schwierigkeit: "komplex",
  titel: "Ein Werkstück mit Bohrung",
  abschnitt: ["sec-volumen", "sec-hohl"],
  generate() {
    const kand = [];
    for (const a of [6, 8, 10, 12]) for (const b of [4, 5, 6, 8]) for (const c of [3, 4, 5, 6, 8]) for (const d of [1, 1.5, 2, 2.5, 3]) if (d < Math.min(a, b) - 1 && glatt(a * b * c, 0)) kand.push({ a, b, c, d });
    const werte = ({ a, b, c, d }) => { const Q = a * b * c, Z = PI * (d / 2) ** 2 * c; return [Q - Z, Q + Z, Q - PI * d * d * c, Q - 2 * PI * (d / 2) * c]; };
    const { a, b, c, d } = ohneKollision(kand, werte, 0.05);
    const Q = a * b * c, Z = PI * (d / 2) ** 2 * c, V = Q - Z;
    return {
      promptHtml: `Ein quaderförmiges Werkstück (${cm(a)} × ${cm(b)} × ${cm(c)}) wird senkrecht durchbohrt: Die Bohrung ist ${cm(c)} lang und hat den Durchmesser ${cm(d)}. Wie groß ist das Volumen des Werkstücks danach (in cm³)?` + RUNDEN,
      correct: r2(V), tolerance: TOL_PI,
      hinweis: hinweisAus([
        [Q + Z, "Die Bohrung nimmt Material weg — abziehen, nicht addieren."],
        [Q - PI * d * d * c, "Für die Bohrung brauchst du den Radius r = d : 2, nicht den Durchmesser."],
        [Q - 2 * PI * (d / 2) * c, "2 · π · r · h ist der Mantel der Bohrung, kein Volumen. Abgezogen wird π · r² · h."],
      ]),
      tipps: ["Volumen des Quaders minus Volumen des Zylinders (der Bohrung).", "Bohrung: r = d : 2, V = π · r² · h."],
      musterloesungHtml: `Quader: ${cm(a)} · ${cm(b)} · ${cm(c)} = ${num(Q)} cm³<br>Bohrung: π · (${cm(d / 2)})² · ${cm(c)} ≈ ${zwei(Z)} cm³<br>V ≈ ${num(Q)} cm³ − ${zwei(Z)} cm³ = <strong>${zwei(V)} cm³</strong>`,
    };
  },
};

export const AUFGABEN = [W1, W2, W3, W4, W5, W6, W7, W8];
