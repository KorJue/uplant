// Die acht Übungsaufgaben zu „Gasgesetze“ — zwei je Stufe:
//   einfach   — Gay-Lussac mit Kelvin-Temperaturen (1); Amontons mit Kelvin-Temperaturen (3)
//   mittel    — Boyle-Mariotte (Luftpumpe, 2); Gay-Lussac mit Grad Celsius (Ballon, 1)
//   schwierig — Amontons (Spraydose, Reifen, 3); Boyle-Mariotte rückwärts: welches Volumen? (2, mit Probe)
//   komplex   — allgemeine Gasgleichung: die Luftblase (4); der Druck im warmen Zylinder (4)
//
// Ergebnisse auf zwei Nachkommastellen; eine Eingabe gilt als getroffen, wenn sie so nah liegt wie ein
// gerundeter Wert. Jeder vorgesehene Fehler hat einen eigenen Wert; fallen zwei zusammen, steht an
// der Stelle NaN (siehe CLAUDE.md, „Die Kollisionsprüfung“). Gewürfelt wird aus VORHER gefilterten
// Listen — nie durch Verwerfen.

import { num, trifft, ohneKollision, glatt, spaeter } from "./seite.js?v=1";

const T0 = 273.15;
const K = (theta) => theta + T0;
const TOL = 0.0051;                          // ein auf zwei Stellen gerundeter Wert
const r2 = (x) => Math.round(x * 100) / 100;
const zwei = (x) => num(r2(x), 2);
const bruch = (z, n) => `<span class="bruch"><span class="z">${z}</span><span class="n">${n}</span></span>`;
const RUNDEN = `<br><span class="progress-note">Runde auf zwei Nachkommastellen.</span>`;
// Der erste vorgesehene Fehler, den die Eingabe trifft — sein Hinweis.
const hinweisAus = (liste, tol = TOL) => (roh, w) => (liste.find(([x]) => Number.isFinite(x) && trifft(w, x, tol + 1e-9)) || [0, ""])[1];

// ---------- E2: Amontons mit Kelvin-Temperaturen ----------
// Die Kelvin-Skala kommt aus Thema 1 (Aggregatzustände, Abschnitt 2); hier wird nur noch mit ihr gerechnet.

function e2Fehler({ p1, T1, T2 }) {
  return [
    [(p1 * T1) / T2, "Bruch umgedreht: Wird das Gas wärmer, steigt der Druck. p₂ = p₁ · T₂ : T₁."],
    [p1, "Der Druck bleibt nicht gleich — bei gleichem Volumen ist p : T konstant."],
    [(p1 * (T2 - T1)) / T1, "Das ist nur die Zunahme des Drucks. Gefragt ist der ganze Druck p₂ = p₁ · T₂ : T₁."],
  ];
}
const E2_KANDIDATEN = spaeter(() => {
  const l = [];
  for (const p1 of [1, 1.2, 1.5, 2, 2.5, 3]) for (const T1 of [250, 280, 300, 320, 350, 400]) for (const T2 of [300, 350, 360, 400, 420, 450, 480, 500, 600]) {
    if (T2 > T1 && glatt((p1 * T2) / T1, 2)) l.push({ p1, T1, T2 });
  }
  return l;
});
const E2 = {
  schwierigkeit: "einfach",
  titel: "Amontons in Kelvin",
  abschnitt: "sec-amontons",
  generate() {
    const v = ohneKollision(E2_KANDIDATEN(), (v) => [(v.p1 * v.T2) / v.T1, ...e2Fehler(v).map((x) => x[0])], 0.02);
    const { p1, T1, T2 } = v, p2 = (p1 * T2) / T1;
    return {
      promptHtml: `In einer verschlossenen Stahlflasche hat ein Gas bei ${num(T1)} K den Druck ${num(p1, 1)} bar. Es wird auf ${num(T2)} K erwärmt; das Volumen bleibt gleich. Wie groß ist der Druck jetzt (in bar)?`,
      correct: r2(p2), tolerance: TOL,
      hinweis: hinweisAus(e2Fehler(v)),
      tipps: ["Gleiches Volumen: Der Druck ist proportional zur Temperatur in Kelvin.", `p₂ = p₁ · ${bruch("T₂", "T₁")}`],
      musterloesungHtml: `p₂ = p₁ · ${bruch("T₂", "T₁")} = ${num(p1, 1)} bar · ${bruch(num(T2) + " K", num(T1) + " K")} = <strong>${zwei(p2)} bar</strong>`,
    };
  },
};

// ---------- E1: Gay-Lussac mit Kelvin-Temperaturen ----------

function e1Fehler({ V1, T1, T2 }) {
  return [
    [(V1 * T1) / T2, "Bruch umgedreht: Wird das Gas wärmer, wird es größer. V₂ = V₁ · T₂ : T₁."],
    [V1, "Das Volumen bleibt nicht gleich — bei gleichem Druck ist V : T konstant."],
    [(V1 * (T2 - T1)) / T1, "Das ist nur die Zunahme des Volumens. Gefragt ist das ganze Volumen V₂ = V₁ · T₂ : T₁."],
  ];
}
const E1_KANDIDATEN = spaeter(() => {
  const l = [];
  for (const V1 of [1, 1.5, 2, 2.4, 3, 4, 5, 6]) for (const T1 of [250, 280, 300, 320, 350, 400]) for (const T2 of [300, 350, 360, 400, 420, 450, 480, 500, 600]) {
    if (T2 > T1 && glatt((V1 * T2) / T1, 2)) l.push({ V1, T1, T2 });
  }
  return l;
});
const E1 = {
  schwierigkeit: "einfach",
  titel: "Gay-Lussac in Kelvin",
  abschnitt: "sec-gay-lussac",
  generate() {
    const v = ohneKollision(E1_KANDIDATEN(), (v) => [(v.V1 * v.T2) / v.T1, ...e1Fehler(v).map((x) => x[0])], 0.02);
    const { V1, T1, T2 } = v, V2 = (V1 * T2) / T1;
    return {
      promptHtml: `Ein Gas nimmt bei ${num(T1)} K ein Volumen von ${num(V1, 1)} l ein. Bei gleichem Druck wird es auf ${num(T2)} K erwärmt. Wie groß ist sein Volumen jetzt (in l)?`,
      correct: r2(V2), tolerance: TOL,
      hinweis: hinweisAus(e1Fehler(v)),
      tipps: ["Gleicher Druck: Das Volumen ist proportional zur Temperatur in Kelvin.", `V₂ = V₁ · ${bruch("T₂", "T₁")}`],
      musterloesungHtml: `V₂ = V₁ · ${bruch("T₂", "T₁")} = ${num(V1, 1)} l · ${bruch(num(T2) + " K", num(T1) + " K")} = <strong>${zwei(V2)} l</strong>`,
    };
  },
};

// ---------- M1: Boyle-Mariotte ----------

function m1Fehler({ p1, V1, V2 }) {
  return [
    [(p1 * V2) / V1, "Umgekehrt: Wird das Volumen kleiner, steigt der Druck. p₂ = p₁ · V₁ : V₂."],
    [p1, "Der Druck bleibt nicht gleich — bei gleicher Temperatur ist p · V konstant."],
    [p1 === 1 ? NaN : V1 / V2, "p₁ fehlt: p₂ = p₁ · V₁ : V₂."],
  ];
}
const M1_KANDIDATEN = spaeter(() => {
  const l = [];
  for (const p1 of [1, 1.2, 1.5, 2]) for (const V1 of [60, 80, 100, 120, 150, 200, 240]) for (const V2 of [20, 25, 30, 40, 50, 60, 75]) {
    if (V2 < V1 && glatt((p1 * V1) / V2, 2)) l.push({ p1, V1, V2 });
  }
  return l;
});
const M1 = {
  schwierigkeit: "mittel",
  titel: "Die zugehaltene Luftpumpe",
  abschnitt: "sec-boyle",
  generate() {
    const v = ohneKollision(M1_KANDIDATEN(), (v) => [(v.p1 * v.V1) / v.V2, ...m1Fehler(v).map((x) => x[0])], 0.02);
    const { p1, V1, V2 } = v, p2 = (p1 * V1) / V2;
    return {
      promptHtml: `In einer Luftpumpe sind ${num(V1)} cm³ Luft bei ${num(p1, 1)} bar eingeschlossen. Die Öffnung wird zugehalten und der Kolben hineingedrückt, bis die Luft nur noch ${num(V2)} cm³ einnimmt. Die Temperatur bleibt gleich. Wie groß ist jetzt der Druck (in bar)?` + RUNDEN,
      correct: r2(p2), tolerance: TOL,
      hinweis: hinweisAus(m1Fehler(v)),
      tipps: ["Die Temperatur bleibt gleich: Boyle-Mariotte, p₁ · V₁ = p₂ · V₂.", `p₂ = ${bruch("p₁ · V₁", "V₂")}`],
      musterloesungHtml: `p₂ = ${bruch("p₁ · V₁", "V₂")} = ${bruch(`${num(p1, 1)} bar · ${num(V1)} cm³`, `${num(V2)} cm³`)} = <strong>${zwei(p2)} bar</strong>`,
    };
  },
};

// ---------- M2: Gay-Lussac mit Grad Celsius ----------

function m2Fehler({ V1, t1, t2 }) {
  return [
    [V1 * (t2 / t1), "Mit Grad Celsius geht es schief: Proportional ist das Volumen zur Temperatur in Kelvin. Erst T = ϑ + 273,15 K."],
    [(V1 * K(t1)) / K(t2), "Bruch umgedreht: Wird das Gas wärmer, wird es größer. V₂ = V₁ · T₂ : T₁."],
    [V1, "Das Volumen bleibt nicht gleich — bei gleichem Druck ist V : T konstant."],
  ];
}
const M2_KANDIDATEN = spaeter(() => {
  const l = [];
  for (const V1 of [1.5, 2, 2.5, 3, 4, 5, 6]) for (const t1 of [5, 10, 15, 20, 25]) for (const t2 of [40, 50, 60, 70, 80]) l.push({ V1, t1, t2 });
  return l;
});
const M2 = {
  schwierigkeit: "mittel",
  titel: "Ein Ballon in der Sonne",
  abschnitt: "sec-gay-lussac",
  generate() {
    const v = ohneKollision(M2_KANDIDATEN(), (v) => [(v.V1 * K(v.t2)) / K(v.t1), ...m2Fehler(v).map((x) => x[0])], 0.02);
    const { V1, t1, t2 } = v, V2 = (V1 * K(t2)) / K(t1);
    return {
      promptHtml: `Ein Ballon enthält bei ${num(t1)} °C ${num(V1, 1)} l Luft. In der Sonne erwärmt sich die Luft auf ${num(t2)} °C; der Druck bleibt gleich. Wie groß ist das Volumen jetzt (in l)?` + RUNDEN,
      correct: r2(V2), tolerance: TOL,
      hinweis: hinweisAus(m2Fehler(v)),
      tipps: ["Gleicher Druck: Gay-Lussac, V₁ : T₁ = V₂ : T₂ — mit T in Kelvin.", `T₁ = ${num(t1)} + 273,15 = ${num(K(t1), 2)} K, T₂ = ${num(K(t2), 2)} K`],
      musterloesungHtml: `T₁ = ${num(K(t1), 2)} K, T₂ = ${num(K(t2), 2)} K<br>V₂ = V₁ · ${bruch("T₂", "T₁")} = ${num(V1, 1)} l · ${bruch(num(K(t2), 2) + " K", num(K(t1), 2) + " K")} ≈ <strong>${zwei(V2)} l</strong>`,
    };
  },
};

// ---------- S1: Amontons ----------

function s1Fehler({ p1, t1, t2 }) {
  const soll = (p1 * K(t2)) / K(t1), je273 = p1 * (1 + (t2 - t1) / T0);
  return [
    [p1 * (t2 / t1), "Mit Grad Celsius geht es schief: Proportional ist der Druck zur Temperatur in Kelvin. Erst T = ϑ + 273,15 K."],
    [(p1 * K(t1)) / K(t2), "Bruch umgedreht: Wird das Gas wärmer, steigt der Druck. p₂ = p₁ · T₂ : T₁."],
    // Liegt ϑ₁ nahe 0 °C, trifft dieser Fehler die Lösung fast — dann NaN, sonst fielen alle
    // Reifenaufgaben (ϑ₁ zwischen −10 °C und 10 °C) aus dem Vorrat.
    [Math.abs(je273 - soll) < 0.02 ? NaN : je273, "Das 1 : 273,15 je Kelvin bezieht sich auf den Druck bei 0 °C, nicht bei ϑ₁. Rechne mit p₂ = p₁ · T₂ : T₁."],
    [p1, "Der Druck bleibt nicht gleich — bei gleichem Volumen ist p : T konstant."],
  ];
}
const S1_KANDIDATEN = spaeter(() => {
  const l = [];
  for (const [was, p1s, t1s, t2s] of [
    ["Spraydose", [2.5, 3, 3.5, 4, 5], [15, 20, 25], [50, 60, 70]],
    ["Autoreifen", [1.8, 2, 2.2, 2.4, 2.5], [-10, -5, 5, 10], [30, 35, 40, 45]],
  ]) for (const p1 of p1s) for (const t1 of t1s) for (const t2 of t2s) l.push({ was, p1, t1, t2 });
  return l;
});
const S1 = {
  schwierigkeit: "schwierig",
  titel: "Druck in der Wärme",
  abschnitt: "sec-amontons",
  generate() {
    const v = ohneKollision(S1_KANDIDATEN(), (v) => [(v.p1 * K(v.t2)) / K(v.t1), ...s1Fehler(v).map((x) => x[0])], 0.02);
    const { was, p1, t1, t2 } = v, p2 = (p1 * K(t2)) / K(t1);
    const text = was === "Spraydose"
      ? `Eine Spraydose hat bei ${num(t1)} °C einen Innendruck von ${num(p1, 1)} bar. Im Auto wird sie ${num(t2)} °C heiß.`
      : `Ein Autoreifen wird bei ${num(t1)} °C auf ${num(p1, 1)} bar aufgepumpt. Nach einer langen Fahrt ist die Luft darin ${num(t2)} °C warm; das Volumen ändert sich kaum.`;
    return {
      promptHtml: `${text} Wie groß ist jetzt der Druck (in bar)?` + RUNDEN,
      correct: r2(p2), tolerance: TOL,
      hinweis: hinweisAus(s1Fehler(v)),
      tipps: ["Das Volumen bleibt gleich: Amontons, p₁ : T₁ = p₂ : T₂ — mit T in Kelvin.", `p₂ = p₁ · ${bruch("T₂", "T₁")}`],
      musterloesungHtml: `T₁ = ${num(t1)} + 273,15 = ${num(K(t1), 2)} K, T₂ = ${num(K(t2), 2)} K<br>p₂ = p₁ · ${bruch("T₂", "T₁")} = ${num(p1, 1)} bar · ${bruch(num(K(t2), 2) + " K", num(K(t1), 2) + " K")} ≈ <strong>${zwei(p2)} bar</strong>`,
    };
  },
};

// ---------- S2: Boyle-Mariotte rückwärts (mit Probe) ----------

function s2Fehler({ p1, V1, p2 }) {
  return [
    [(p2 * V1) / p1, "Umgekehrt: Steigt der Druck, wird das Volumen kleiner. V₂ = p₁ · V₁ : p₂."],
    [V1, "Das Volumen bleibt nicht gleich — bei gleicher Temperatur ist p · V konstant."],
    [p1 === 1 ? NaN : V1 / p2, "p₁ fehlt: V₂ = p₁ · V₁ : p₂."],
    [(p1 * V1) / (p2 - p1), "p₂ ist der neue Druck selbst, nicht der Unterschied: V₂ = p₁ · V₁ : p₂."],
  ];
}
const S2_KANDIDATEN = spaeter(() => {
  const l = [];
  for (const p1 of [1, 1.2, 1.5, 2]) for (const V1 of [2, 3, 4, 5, 6, 8, 10, 12]) for (const p2 of [2.5, 3, 4, 5, 6, 8, 10]) {
    if (p2 > p1 + 0.5 && glatt((p1 * V1) / p2, 2)) l.push({ p1, V1, p2 });
  }
  return l;
});
const S2 = {
  schwierigkeit: "schwierig",
  titel: "Wie weit zusammendrücken?",
  abschnitt: "sec-boyle",
  generate() {
    const v = ohneKollision(S2_KANDIDATEN(), (v) => [(v.p1 * v.V1) / v.p2, ...s2Fehler(v).map((x) => x[0])], 0.02);
    const { p1, V1, p2 } = v, V2 = (p1 * V1) / p2;
    return {
      promptHtml: `In einem Zylinder sind ${num(V1)} l Luft bei ${num(p1, 1)} bar eingeschlossen. Auf welches Volumen (in l) muss man sie bei gleicher Temperatur zusammendrücken, damit der Druck ${num(p2, 1)} bar beträgt?`,
      correct: r2(V2), tolerance: TOL,
      hinweis: hinweisAus(s2Fehler(v)),
      tipps: ["Gleiche Temperatur: p₁ · V₁ = p₂ · V₂ — gesucht ist diesmal V₂.", `V₂ = ${bruch("p₁ · V₁", "p₂")}`],
      musterloesungHtml: `V₂ = ${bruch("p₁ · V₁", "p₂")} = ${bruch(`${num(p1, 1)} bar · ${num(V1)} l`, `${num(p2, 1)} bar`)} = <strong>${zwei(V2)} l</strong><br>` +
        `<em>Probe:</em> p₂ · V₂ = ${num(p2, 1)} · ${zwei(V2)} = ${num(p2 * r2(V2), 2)} bar · l und p₁ · V₁ = ${num(p1, 1)} · ${num(V1)} = ${num(p1 * V1, 2)} bar · l ✓`,
    };
  },
};

// ---------- K1: Die Luftblase (allgemeine Gasgleichung) ----------

function k1Fehler({ V1, p1, p2, t1, t2 }) {
  return [
    [V1 * (p1 / p2), "Die Temperatur fehlt: Auch sie ändert sich. V₂ = V₁ · (p₁ : p₂) · (T₂ : T₁)."],
    [V1 * (K(t2) / K(t1)), "Der Druck fehlt: Er sinkt beim Aufsteigen stark. V₂ = V₁ · (p₁ : p₂) · (T₂ : T₁)."],
    [V1 * (p2 / p1) * (K(t2) / K(t1)), "Druckverhältnis umgedreht: Weniger Druck heißt mehr Volumen — p₁ : p₂."],
    [V1 * (p1 / p2) * (t2 / t1), "Mit Grad Celsius geht es schief: Die Temperaturen gehören in Kelvin in die Gleichung."],
  ];
}
const K1_KANDIDATEN = spaeter(() => {
  const l = [];
  for (const V1 of [1, 1.5, 2, 2.5, 3, 4]) for (const tiefe of [10, 20, 30, 40]) for (const t1 of [4, 6, 8]) for (const t2 of [15, 18, 20, 22]) {
    l.push({ V1, tiefe, p1: 1 + tiefe / 10, p2: 1, t1, t2 });
  }
  return l;
});
const K1 = {
  schwierigkeit: "komplex",
  titel: "Die Luftblase",
  abschnitt: "sec-gasgleichung",
  generate() {
    const v = ohneKollision(K1_KANDIDATEN(), (v) => [v.V1 * (v.p1 / v.p2) * (K(v.t2) / K(v.t1)), ...k1Fehler(v).map((x) => x[0])], 0.02);
    const { V1, tiefe, p1, p2, t1, t2 } = v, V2 = V1 * (p1 / p2) * (K(t2) / K(t1));
    return {
      promptHtml: `Ein Taucher atmet in ${num(tiefe)} m Tiefe aus. Eine Luftblase hat dort ${num(V1, 1)} cm³, der Druck ist ${num(p1, 1)} bar, das Wasser ${num(t1)} °C kalt. Die Blase steigt an die Oberfläche: Dort ist der Druck ${num(p2, 1)} bar und das Wasser ${num(t2)} °C warm. Wie groß ist die Blase oben (in cm³)?` + RUNDEN,
      correct: r2(V2), tolerance: TOL,
      hinweis: hinweisAus(k1Fehler(v)),
      tipps: ["Druck und Temperatur ändern sich beide: allgemeine Gasgleichung p₁ · V₁ : T₁ = p₂ · V₂ : T₂.", `V₂ = V₁ · ${bruch("p₁", "p₂")} · ${bruch("T₂", "T₁")} — T in Kelvin.`, `T₁ = ${num(K(t1), 2)} K, T₂ = ${num(K(t2), 2)} K`],
      musterloesungHtml: `T₁ = ${num(K(t1), 2)} K, T₂ = ${num(K(t2), 2)} K<br>` +
        `V₂ = V₁ · ${bruch("p₁", "p₂")} · ${bruch("T₂", "T₁")} = ${num(V1, 1)} cm³ · ${bruch(num(p1, 1) + " bar", num(p2, 1) + " bar")} · ${bruch(num(K(t2), 2) + " K", num(K(t1), 2) + " K")} ≈ <strong>${zwei(V2)} cm³</strong>`,
    };
  },
};

// ---------- K2: Der Druck im warmen Zylinder (allgemeine Gasgleichung) ----------

function k2Fehler({ p1, V1, t1, V2, t2 }) {
  return [
    [(p1 * V1) / V2, "Die Temperatur fehlt: Auch sie steigt. p₂ = p₁ · (V₁ : V₂) · (T₂ : T₁)."],
    [(p1 * K(t2)) / K(t1), "Das Volumen fehlt: Der Kolben drückt das Gas zusammen. p₂ = p₁ · (V₁ : V₂) · (T₂ : T₁)."],
    [p1 * (V2 / V1) * (K(t2) / K(t1)), "Volumenverhältnis umgedreht: Kleineres Volumen heißt höherer Druck — V₁ : V₂."],
    [p1 * (V1 / V2) * (t2 / t1), "Mit Grad Celsius geht es schief: Die Temperaturen gehören in Kelvin in die Gleichung."],
  ];
}
const K2_KANDIDATEN = spaeter(() => {
  const l = [];
  for (const p1 of [1, 1.2, 1.5, 2]) for (const V1 of [1, 1.5, 2, 2.5, 3]) for (const V2 of [0.5, 0.75, 1, 1.25, 1.5, 2]) for (const t1 of [10, 15, 20, 25]) for (const t2 of [40, 60, 80, 100, 150]) {
    if (V2 < V1) l.push({ p1, V1, t1, V2, t2 });
  }
  return l;
});
const K2 = {
  schwierigkeit: "komplex",
  titel: "Zusammengedrückt und warm",
  abschnitt: "sec-gasgleichung",
  generate() {
    const v = ohneKollision(K2_KANDIDATEN(), (v) => [v.p1 * (v.V1 / v.V2) * (K(v.t2) / K(v.t1)), ...k2Fehler(v).map((x) => x[0])], 0.02);
    const { p1, V1, t1, V2, t2 } = v, p2 = p1 * (V1 / V2) * (K(t2) / K(t1));
    return {
      promptHtml: `In einem Zylinder sind ${num(V1, 2)} l Luft bei ${num(p1, 1)} bar und ${num(t1)} °C eingeschlossen. Der Kolben drückt die Luft auf ${num(V2, 2)} l zusammen; dabei erwärmt sie sich auf ${num(t2)} °C. Wie groß ist jetzt der Druck (in bar)?` + RUNDEN,
      correct: r2(p2), tolerance: TOL,
      hinweis: hinweisAus(k2Fehler(v)),
      tipps: ["Volumen und Temperatur ändern sich beide: p₁ · V₁ : T₁ = p₂ · V₂ : T₂.", `p₂ = p₁ · ${bruch("V₁", "V₂")} · ${bruch("T₂", "T₁")} — T in Kelvin.`, `T₁ = ${num(K(t1), 2)} K, T₂ = ${num(K(t2), 2)} K`],
      musterloesungHtml: `T₁ = ${num(K(t1), 2)} K, T₂ = ${num(K(t2), 2)} K<br>` +
        `p₂ = p₁ · ${bruch("V₁", "V₂")} · ${bruch("T₂", "T₁")} = ${num(p1, 1)} bar · ${bruch(num(V1, 2) + " l", num(V2, 2) + " l")} · ${bruch(num(K(t2), 2) + " K", num(K(t1), 2) + " K")} ≈ <strong>${zwei(p2)} bar</strong>`,
    };
  },
};

export const AUFGABEN = [E1, E2, M1, M2, S1, S2, K1, K2];
