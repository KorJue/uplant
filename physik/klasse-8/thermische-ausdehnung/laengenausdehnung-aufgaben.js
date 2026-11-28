// Die acht Übungsaufgaben zu „Längenausdehnung“ — zwei je Stufe:
//   einfach   — Längenänderung berechnen (3); eine Messreihe fortsetzen (1)
//   mittel    — Endlänge in Metern, auch beim Abkühlen (3); andere Länge UND andere Erwärmung (1, 2)
//   schwierig — Temperaturänderung aus der Längenänderung (4, mit Probe); α bestimmen und den Stoff erkennen (4, mit Probe)
//   komplex   — Dehnungsfuge im Winter (5); Thermometer: Steighöhe der Säule (7)
//
// Jeder vorgesehene Fehler hat einen eigenen Wert; fallen zwei zusammen oder trifft einer die Lösung,
// steht an der Stelle NaN (siehe CLAUDE.md, „Die Kollisionsprüfung“). Gewürfelt wird aus VORHER
// gefilterten Listen — nie durch Verwerfen.

import { num, trifft, ohneKollision, glatt, spaeter } from "./seite.js?v=1";

const TOL = 0.0051;                          // ein auf zwei Stellen gerundeter Wert
const r2 = (x) => Math.round(x * 100) / 100;
const zwei = (x) => num(r2(x), 2);
const bruch = (z, n) => `<span class="bruch"><span class="z">${z}</span><span class="n">${n}</span></span>`;
const RUNDEN = `<br><span class="progress-note">Runde auf zwei Nachkommastellen.</span>`;
// Der erste vorgesehene Fehler, den die Eingabe trifft — sein Hinweis.
const hinweisAus = (liste, tol = TOL) => (roh, w) => (liste.find(([x]) => Number.isFinite(x) && trifft(w, x, tol + 1e-9)) || [0, ""])[1];
const ALPHA = [["Stahl", 0.012], ["Aluminium", 0.023], ["Kupfer", 0.017], ["Beton", 0.012], ["Glas", 0.009]];
const MMK = bruch("mm", "m · K");
const MLK = bruch("ml", "l · K");
const klammer = (x) => (x < 0 ? `(${num(x)})` : num(x));

// ---------- E1: Wie viel länger? ----------

function e1Fehler({ a, L0, t1, t2 }) {
  const dT = t2 - t1;
  return [
    [a * L0 * t2, `ΔT ist der Temperaturunterschied: ${num(t2)} °C − ${klammer(t1)} °C = ${num(dT)} K — nicht die Endtemperatur.`],
    [a * L0, "Das ist die Verlängerung bei nur 1 K. Die Temperatur ändert sich aber um ΔT — malnehmen mit ΔT."],
    [a * dT, "L₀ fehlt: Ein langer Stab dehnt sich mehr aus als ein kurzer. ΔL = α · L₀ · ΔT."],
    [(a * L0 * dT) / 1000, "Gefragt ist die Verlängerung in Millimetern. Mit α in mm/(m · K) und L₀ in Metern kommt ΔL schon in mm heraus."],
  ];
}
const E1_KANDIDATEN = spaeter(() => {
  const l = [];
  for (const [stoff, a] of ALPHA) for (const L0 of [10, 15, 20, 25, 30, 40, 50, 60, 80, 120]) for (const t1 of [-10, -5, 0, 5, 10]) for (const t2 of [25, 30, 35, 40, 45, 50]) {
    if (glatt(a * L0 * (t2 - t1), 2)) l.push({ stoff, a, L0, t1, t2 });
  }
  return l;
});
const E1 = {
  schwierigkeit: "einfach",
  titel: "Wie viel länger?",
  abschnitt: "sec-alpha",
  generate() {
    const v = ohneKollision(E1_KANDIDATEN(), (v) => [v.a * v.L0 * (v.t2 - v.t1), ...e1Fehler(v).map((x) => x[0])], 0.02);
    const { stoff, a, L0, t1, t2 } = v, dT = t2 - t1, dL = a * L0 * dT;
    return {
      promptHtml: `Ein Stab aus ${stoff} ist bei ${num(t1)} °C genau ${num(L0)} m lang. Um wie viele Millimeter wird er länger, wenn er sich auf ${num(t2)} °C erwärmt? (α = ${num(a, 3)} ${MMK})`,
      correct: r2(dL), tolerance: TOL,
      hinweis: hinweisAus(e1Fehler(v)),
      tipps: [`Erst die Temperaturänderung: ΔT = ${num(t2)} °C − ${klammer(t1)} °C.`, "ΔL = α · L₀ · ΔT, mit L₀ in Metern — dann kommt ΔL in Millimetern heraus."],
      musterloesungHtml: `ΔT = ${num(t2)} °C − ${klammer(t1)} °C = ${num(dT)} K<br>ΔL = α · L₀ · ΔT = ${num(a, 3)} ${MMK} · ${num(L0)} m · ${num(dT)} K = <strong>${zwei(dL)} mm</strong>`,
    };
  },
};

// ---------- E2: Die Messreihe fortsetzen ----------

function e2Fehler({ x1, d1, d2 }) {
  return [
    [x1, "Die Längenänderung bleibt nicht gleich: Bei stärkerer Erwärmung wird das Rohr mehr länger. ΔL ist proportional zu ΔT."],
    [(x1 * d1) / d2, `Verhältnis umgedreht: ${num(d2)} K ist ${d2 > d1 ? "mehr" : "weniger"} als ${num(d1)} K, also wird das Rohr ${d2 > d1 ? "mehr" : "weniger"} länger.`],
    [x1 * d2, `Erst die Verlängerung je Kelvin: ${num(x1, 2)} mm : ${num(d1)} K — dann mit ${num(d2)} K malnehmen.`],
  ];
}
const E2_KANDIDATEN = spaeter(() => {
  const l = [];
  for (const [stoff, a] of ALPHA.filter(([s]) => s !== "Beton")) for (const L0 of [1, 2, 3, 5]) for (const d1 of [10, 20, 25, 30, 40]) for (const d2 of [15, 30, 45, 50, 60, 75, 80]) {
    const x1 = a * L0 * d1, x2 = a * L0 * d2;
    if (d1 !== d2 && glatt(x1, 2) && glatt(x2, 2)) l.push({ stoff, L0, d1, d2, x1: r2(x1), x2: r2(x2) });
  }
  return l;
});
const E2 = {
  schwierigkeit: "einfach",
  titel: "Die Messreihe fortsetzen",
  abschnitt: "sec-messung",
  generate() {
    const v = ohneKollision(E2_KANDIDATEN(), (v) => [v.x2, ...e2Fehler(v).map((x) => x[0])], 0.02);
    const { stoff, L0, d1, d2, x1, x2 } = v;
    return {
      promptHtml: `In einer Messreihe wird ein ${num(L0)} m langes Rohr aus ${stoff} erwärmt. Bei einer Erwärmung um ${num(d1)} K ist es ${num(x1, 2)} mm länger geworden. Um wie viele Millimeter wird es bei einer Erwärmung um ${num(d2)} K länger?`,
      correct: x2, tolerance: TOL,
      hinweis: hinweisAus(e2Fehler(v)),
      tipps: ["Die Längenänderung ist proportional zur Temperaturänderung: Der Quotient ΔL : ΔT bleibt gleich.", `Je Kelvin: ${num(x1, 2)} mm : ${num(d1)} K.`],
      musterloesungHtml: `ΔL ist proportional zu ΔT, also ist ${bruch("ΔL", "ΔT")} gleich:<br>` +
        `${bruch(num(x1, 2) + " mm", num(d1) + " K")} = ${num(x1 / d1, 4)} ${bruch("mm", "K")}, &nbsp; ΔL = ${num(x1 / d1, 4)} ${bruch("mm", "K")} · ${num(d2)} K = <strong>${zwei(x2)} mm</strong>`,
    };
  },
};

// ---------- M1: Die neue Länge ----------

const TOL4 = 0.000051;                       // vier Nachkommastellen in Metern: genau, nicht gerundet
function m1Fehler({ a, L0, t1, t2 }) {
  const dL = a * L0 * (t2 - t1), warm = t2 > t1;
  return [
    [L0 + dL, "Einheiten: ΔL kommt in Millimetern heraus. Vor dem Addieren in Meter umrechnen — 1 mm = 0,001 m."],
    [L0 + dL / 100, "1 m sind 1000 mm, nicht 100: ΔL in mm durch 1000 teilen."],
    [L0 - dL / 1000, warm ? "Beim Erwärmen wird der Körper länger, nicht kürzer: L = L₀ + ΔL." : "Beim Abkühlen wird der Körper kürzer: ΔT ist negativ, L = L₀ + ΔL ist kleiner als L₀."],
    [dL / 1000, "Das ist nur die Längenänderung. Gefragt ist die neue Länge: L = L₀ + ΔL."],
    // Bei 0 °C ist die Endtemperatur selbst der Unterschied — dann kein eigener Fehler.
    [t1 === 0 ? NaN : L0 + (a * L0 * t2) / 1000, `ΔT ist der Temperaturunterschied: ${num(t2)} °C − ${klammer(t1)} °C — nicht die Endtemperatur.`],
  ];
}
const M1_KANDIDATEN = spaeter(() => {
  const l = [];
  const faelle = [
    ["warm", [0, 5, 10, 15], [30, 35, 40, 45]],
    ["kalt", [15, 20, 25, 30], [-20, -15, -10, -5]],
  ];
  for (const [was, t1s, t2s] of faelle) for (const [stoff, a] of [["Stahl", 0.012], ["Aluminium", 0.023], ["Kupfer", 0.017]]) for (const L0 of [12, 18, 20, 25, 30, 36, 40, 50, 60, 120]) for (const t1 of t1s) for (const t2 of t2s) {
    if (glatt(a * L0 * (t2 - t1), 1)) l.push({ was, stoff, a, L0, t1, t2 });
  }
  return l;
});
const DING = { Stahl: "Eine Stahlschiene", Aluminium: "Eine Aluminiumleitung", Kupfer: "Ein Kupferrohr" };
const M1 = {
  schwierigkeit: "mittel",
  titel: "Die neue Länge",
  abschnitt: "sec-alpha",
  generate() {
    const v = ohneKollision(M1_KANDIDATEN(), (v) => [v.L0 + (v.a * v.L0 * (v.t2 - v.t1)) / 1000, ...m1Fehler(v).map((x) => x[0])], 0.0002);
    const { stoff, a, L0, t1, t2 } = v, dT = t2 - t1, dL = a * L0 * dT, L = L0 + dL / 1000;
    return {
      promptHtml: `${DING[stoff]} ist bei ${num(t1)} °C genau ${num(L0)} m lang. Wie lang ist sie bei ${num(t2)} °C? Gib die Länge in Metern an, auf vier Nachkommastellen genau. (α = ${num(a, 3)} ${MMK})`,
      correct: L, tolerance: TOL4,
      hinweis: hinweisAus(m1Fehler(v), TOL4),
      tipps: [`ΔT = ${num(t2)} °C − ${klammer(t1)} °C = ${num(dT)} K${dT < 0 ? " — negativ, weil es kälter wird" : ""}.`, "ΔL = α · L₀ · ΔT in mm, dann in m umrechnen und zu L₀ addieren."],
      musterloesungHtml: `ΔT = ${num(t2)} °C − ${klammer(t1)} °C = ${num(dT)} K<br>` +
        `ΔL = α · L₀ · ΔT = ${num(a, 3)} ${MMK} · ${num(L0)} m · ${klammer(dT)} K = ${num(dL, 1)} mm = ${num(dL / 1000, 4)} m<br>` +
        `L = L₀ + ΔL = ${num(L0)} m ${dL < 0 ? "−" : "+"} ${num(Math.abs(dL) / 1000, 4)} m = <strong>${num(L, 4)} m</strong>`,
    };
  },
};

// ---------- M2: Länger und wärmer ----------

function m2Fehler({ x1, L1, L2, d1, d2 }) {
  return [
    [(x1 * L2) / L1, `Die Erwärmung ist auch anders: ${num(d2)} K statt ${num(d1)} K. ΔL ist proportional zu L₀ UND zu ΔT.`],
    [(x1 * d2) / d1, `Die Länge ist auch anders: ${num(L2)} m statt ${num(L1)} m. ΔL ist proportional zu L₀ UND zu ΔT.`],
    [x1, "Bei größerer Länge und anderer Erwärmung bleibt die Verlängerung nicht gleich."],
    [(x1 * L1 * d2) / (L2 * d1), `Längenverhältnis umgedreht: Ein ${num(L2)} m langes Rohr verlängert sich ${L2 > L1 ? "mehr" : "weniger"} als ein ${num(L1)} m langes.`],
  ];
}
const M2_KANDIDATEN = spaeter(() => {
  const l = [];
  for (const [stoff, a] of ALPHA.filter(([s]) => s !== "Beton")) for (const L1 of [1, 2, 4, 5]) for (const L2 of [3, 6, 8, 10, 12, 15, 20]) for (const d1 of [10, 20, 25, 40]) for (const d2 of [30, 50, 60, 75, 80]) {
    const x1 = a * L1 * d1, x2 = a * L2 * d2;
    if (glatt(x1, 2) && glatt(x2, 2)) l.push({ stoff, L1, L2, d1, d2, x1: r2(x1), x2: r2(x2) });
  }
  return l;
});
const M2 = {
  schwierigkeit: "mittel",
  titel: "Länger und wärmer",
  abschnitt: ["sec-messung", "sec-laenge"],
  generate() {
    const v = ohneKollision(M2_KANDIDATEN(), (v) => [v.x2, ...m2Fehler(v).map((x) => x[0])], 0.02);
    const { stoff, L1, L2, d1, d2, x1, x2 } = v;
    return {
      promptHtml: `Ein ${num(L1)} m langes Rohr aus ${stoff} wird bei einer Erwärmung um ${num(d1)} K um ${num(x1, 2)} mm länger. Um wie viele Millimeter wird ein ${num(L2)} m langes Rohr aus ${stoff} länger, das um ${num(d2)} K erwärmt wird?`,
      correct: x2, tolerance: TOL,
      hinweis: hinweisAus(m2Fehler(v)),
      tipps: ["Erst für 1 m und 1 K: durch die Länge und durch die Erwärmung teilen.", "Dann mit der neuen Länge und der neuen Erwärmung malnehmen."],
      musterloesungHtml: `1 m bei 1 K: ${num(x1, 2)} mm : ${num(L1)} : ${num(d1)} = ${num(x1 / (L1 * d1), 4)} mm<br>` +
        `${num(L2)} m bei ${num(d2)} K: ΔL = ${num(x1 / (L1 * d1), 4)} mm · ${num(L2)} · ${num(d2)} = <strong>${zwei(x2)} mm</strong>`,
    };
  },
};

// ---------- S1: Um wie viel wärmer? (Umkehraufgabe mit Probe) ----------

function s1Fehler({ a, L0, dL }) {
  return [
    [dL * a * L0, "Rückwärts wird geteilt, nicht malgenommen: ΔT = ΔL : (α · L₀)."],
    [dL / a, "L₀ fehlt: ΔT = ΔL : (α · L₀)."],
    [(dL * 1000) / (a * L0), "ΔL steht schon in Millimetern — nicht noch einmal mit 1000 malnehmen."],
  ];
}
const S1_KANDIDATEN = spaeter(() => {
  const l = [];
  for (const [stoff, a] of ALPHA) for (const L0 of [5, 10, 20, 25, 40, 50, 100]) for (const dT of [15, 20, 25, 30, 35, 40, 45, 50, 60]) {
    const dL = a * L0 * dT;
    if (glatt(dL, 2)) l.push({ stoff, a, L0, dT, dL: r2(dL) });
  }
  return l;
});
const S1 = {
  schwierigkeit: "schwierig",
  titel: "Um wie viel wärmer?",
  abschnitt: "sec-rueckwaerts",
  generate() {
    const v = ohneKollision(S1_KANDIDATEN(), (v) => [v.dT, ...s1Fehler(v).map((x) => x[0])], 0.02);
    const { stoff, a, L0, dT, dL } = v;
    return {
      promptHtml: `Ein ${num(L0)} m langer Stab aus ${stoff} ist nach dem Erwärmen ${num(dL, 2)} mm länger. Um wie viel Kelvin wurde er erwärmt? (α = ${num(a, 3)} ${MMK})`,
      correct: dT, tolerance: TOL,
      hinweis: hinweisAus(s1Fehler(v)),
      tipps: ["ΔL = α · L₀ · ΔT — gesucht ist diesmal ΔT.", `ΔT = ${bruch("ΔL", "α · L₀")}`],
      musterloesungHtml: `ΔT = ${bruch("ΔL", "α · L₀")} = ${bruch(`${num(dL, 2)} mm`, `${num(a, 3)} ${MMK} · ${num(L0)} m`)} = ${bruch(`${num(dL, 2)} mm`, `${num(a * L0, 3)} ${bruch("mm", "K")}`)} = <strong>${num(dT)} K</strong><br>` +
        `<em>Probe:</em> ${num(a, 3)} · ${num(L0)} · ${num(dT)} = ${num(a * L0 * dT, 2)} mm ✓`,
    };
  },
};

// ---------- S2: Woraus ist der Draht? (α bestimmen, mit Probe) ----------

const STOFF_VON = [["Aluminium", 0.023], ["Kupfer", 0.017], ["Stahl", 0.012], ["Glas", 0.009]];
const TOL3 = 0.00051;                        // α auf drei Nachkommastellen
function s2Fehler({ L0, t1, t2, dL }) {
  const dT = t2 - t1;
  return [
    [dL / L0, "ΔT fehlt: α ist die Verlängerung je Meter UND je Kelvin — α = ΔL : (L₀ · ΔT)."],
    [dL / dT, "L₀ fehlt: α ist die Verlängerung je Meter UND je Kelvin — α = ΔL : (L₀ · ΔT)."],
    [dL / (L0 * t2), `ΔT ist der Temperaturunterschied: ${num(t2)} °C − ${num(t1)} °C = ${num(dT)} K — nicht die Endtemperatur.`],
    [(L0 * dT) / dL, "Bruch umgedreht: Die Längenänderung steht im Zähler, α = ΔL : (L₀ · ΔT)."],
  ];
}
const S2_KANDIDATEN = spaeter(() => {
  const l = [];
  for (const [stoff, a] of STOFF_VON) for (const L0 of [2, 4, 5, 10, 20, 25, 50]) for (const t1 of [10, 15, 20]) for (const t2 of [50, 60, 70, 80, 90, 100]) {
    const dL = a * L0 * (t2 - t1);
    if (glatt(dL, 2)) l.push({ stoff, a, L0, t1, t2, dL: r2(dL) });
  }
  return l;
});
const S2 = {
  schwierigkeit: "schwierig",
  titel: "Woraus ist der Draht?",
  abschnitt: "sec-rueckwaerts",
  generate() {
    const v = ohneKollision(S2_KANDIDATEN(), (v) => [v.a, ...s2Fehler(v).map((x) => x[0])], 0.002);
    const { stoff, a, L0, t1, t2, dL } = v, dT = t2 - t1;
    return {
      promptHtml: `Ein ${num(L0)} m langer Draht aus einem unbekannten Stoff wird von ${num(t1)} °C auf ${num(t2)} °C erwärmt und ist danach ${num(dL, 2)} mm länger. Berechne den Längenausdehnungskoeffizienten α in ${MMK}.`,
      correct: a, tolerance: TOL3,
      hinweis: hinweisAus(s2Fehler(v), TOL3),
      tipps: [`ΔT = ${num(t2)} °C − ${num(t1)} °C = ${num(dT)} K.`, `α = ${bruch("ΔL", "L₀ · ΔT")} — das Ergebnis mit der Tabelle in Abschnitt 3 vergleichen.`],
      musterloesungHtml: `ΔT = ${num(t2)} °C − ${num(t1)} °C = ${num(dT)} K<br>` +
        `α = ${bruch("ΔL", "L₀ · ΔT")} = ${bruch(`${num(dL, 2)} mm`, `${num(L0)} m · ${num(dT)} K`)} = <strong>${num(a, 3)}</strong> ${MMK} — laut Tabelle ${stoff}.<br>` +
        `<em>Probe:</em> ${num(a, 3)} · ${num(L0)} · ${num(dT)} = ${num(a * L0 * dT, 2)} mm ✓`,
    };
  },
};

// ---------- K1: Die Fuge im Winter ----------

function k1Fehler({ a, L0, bau, max, min }) {
  return [
    [a * L0 * (max - bau), "Das ist die Fuge beim Bau. Bis zum Winter zieht sich die Brücke noch zusammen — die Fuge wird breiter."],
    [a * L0 * (bau - min), "Das ist nur, um wie viel die Brücke bis zum Winter kürzer wird. Die Fuge war beim Bau schon breit: s₀ kommt dazu."],
    [a * L0 * (max - 2 * bau + min), "Im Winter wird die Brücke kürzer, die Fuge also breiter — die Verkürzung wird zu s₀ addiert, nicht abgezogen."],
    [a * L0 * (max + min), `Vorzeichen: Der Unterschied zwischen ${num(max)} °C und ${num(min)} °C ist ${num(max)} − (${num(min)}) = ${num(max - min)} K.`],
  ];
}
const K1_KANDIDATEN = spaeter(() => {
  const l = [];
  for (const [stoff, a] of [["Stahl", 0.012], ["Beton", 0.012], ["Aluminium", 0.023]]) for (const L0 of [20, 30, 40, 50, 60, 80, 100, 120, 150, 200]) for (const bau of [5, 10, 15, 20]) for (const max of [35, 40, 45, 50]) for (const min of [-25, -20, -15, -10]) {
    l.push({ stoff, a, L0, bau, max, min });
  }
  return l;
});
const BRUECKE = { Stahl: "Stahlbrücke", Beton: "Betonbrücke", Aluminium: "Fußgängerbrücke aus Aluminium" };
const K1 = {
  schwierigkeit: "komplex",
  titel: "Die Fuge im Winter",
  abschnitt: "sec-fuge",
  generate() {
    const v = ohneKollision(K1_KANDIDATEN(), (v) => [v.a * v.L0 * (v.max - v.min), ...k1Fehler(v).map((x) => x[0])], 0.02);
    const { stoff, a, L0, bau, max, min } = v, s0 = a * L0 * (max - bau), s = a * L0 * (max - min);
    return {
      promptHtml: `Eine ${num(L0)} m lange ${BRUECKE[stoff]} wird bei ${num(bau)} °C gebaut. Die Dehnungsfuge wird so breit gemacht, dass sie sich bei ${num(max)} °C gerade schließt. Wie breit (in mm) ist die Fuge an einem Wintertag mit ${num(min)} °C? (α = ${num(a, 3)} ${MMK})`,
      correct: r2(s), tolerance: TOL,
      hinweis: hinweisAus(k1Fehler(v)),
      tipps: [`Erst die Fuge beim Bau: Bis ${num(max)} °C verlängert sich die Brücke um s₀ = α · L₀ · (${num(max)} °C − ${num(bau)} °C).`, `Bis zum Winter wird sie um α · L₀ · (${num(bau)} °C − (${num(min)} °C)) kürzer — so viel breiter wird die Fuge.`],
      musterloesungHtml: `Beim Bau: s₀ = ${num(a, 3)} ${MMK} · ${num(L0)} m · ${num(max - bau)} K = ${zwei(s0)} mm<br>` +
        `Bis zum Winter kürzer um ${num(a, 3)} · ${num(L0)} · ${num(bau - min)} = ${zwei(a * L0 * (bau - min))} mm<br>` +
        `s = ${zwei(s0)} mm + ${zwei(a * L0 * (bau - min))} mm = <strong>${zwei(s)} mm</strong><br>` +
        `In einem Schritt: Zwischen Winter und Sommer liegen ${num(max)} − (${num(min)}) = ${num(max - min)} K, und ${num(a, 3)} · ${num(L0)} · ${num(max - min)} = ${zwei(s)} mm ✓`,
    };
  },
};

// ---------- K2: Das Thermometer ----------

const GAMMA = [["Ethanol", 1.1], ["Benzin", 1.0], ["Glycerin", 0.5], ["Quecksilber", 0.18]];
function k2Fehler({ g, V0, A, t1, t2 }) {
  const dT = t2 - t1, dV = g * V0 * dT;
  return [
    [dV, "Das ist das zusätzliche Volumen ΔV in mm³. Es verteilt sich auf die Kapillare: h = ΔV : A."],
    [dV * A, "Geteilt, nicht malgenommen: Je dünner die Kapillare, desto höher steigt die Säule. h = ΔV : A."],
    [(g * V0 * t2) / A, `ΔT ist der Temperaturunterschied: ${num(t2)} °C − ${num(t1)} °C = ${num(dT)} K.`],
    [(g * V0 * dT) / (1000 * A), "Mit γ in ml/(l · K) und V₀ in ml kommt ΔV schon in mm³ heraus — nicht noch durch 1000 teilen."],
  ];
}
const K2_KANDIDATEN = spaeter(() => {
  const l = [];
  for (const [stoff, g] of GAMMA) for (const V0 of [0.2, 0.4, 0.5, 0.8, 1]) for (const A of [0.1, 0.2, 0.25, 0.4, 0.5]) for (const [t1, t2] of [[15, 25], [18, 30], [20, 35], [10, 30], [20, 40]]) {
    const h = (g * V0 * (t2 - t1)) / A;
    if (glatt(h, 2) && h >= 2) l.push({ stoff, g, V0, A, t1, t2 });
  }
  return l;
});
const K2 = {
  schwierigkeit: "komplex",
  titel: "Das Thermometer",
  abschnitt: "sec-volumen",
  generate() {
    const v = ohneKollision(K2_KANDIDATEN(), (v) => [(v.g * v.V0 * (v.t2 - v.t1)) / v.A, ...k2Fehler(v).map((x) => x[0])], 0.02);
    const { stoff, g, V0, A, t1, t2 } = v, dT = t2 - t1, dV = g * V0 * dT, h = dV / A;
    return {
      promptHtml: `Ein Thermometer enthält ${num(V0, 1)} ml ${stoff} (γ = ${num(g, 2)} ${MLK}). Die Kapillare hat den Querschnitt ${num(A, 2)} mm². Um wie viele Millimeter steigt die Säule, wenn die Temperatur von ${num(t1)} °C auf ${num(t2)} °C steigt?` + RUNDEN,
      correct: r2(h), tolerance: TOL,
      hinweis: hinweisAus(k2Fehler(v)),
      tipps: [`Erst das zusätzliche Volumen: ΔV = γ · V₀ · ΔT mit ΔT = ${num(dT)} K — in mm³.`, "Es verteilt sich auf die Kapillare: h = ΔV : A."],
      musterloesungHtml: `ΔT = ${num(t2)} °C − ${num(t1)} °C = ${num(dT)} K<br>ΔV = γ · V₀ · ΔT = ${num(g, 2)} · ${num(V0, 1)} · ${num(dT)} = ${num(dV, 3)} mm³<br>` +
        `h = ${bruch("ΔV", "A")} = ${bruch(`${num(dV, 3)} mm³`, `${num(A, 2)} mm²`)} = <strong>${zwei(h)} mm</strong>`,
    };
  },
};

export const AUFGABEN = [E1, E2, M1, M2, S1, S2, K1, K2];
