// Die acht Übungsaufgaben zu „Aggregatzustände“ — zwei je Stufe, alle zur Energie je Kilogramm
// aus Abschnitt 2 (die Teilchenbewegung und die Energiemulde sind Modelle zum Verstehen, nicht zum
// Rechnen):
//   einfach   — Eis schmelzen; Wasser erwärmen
//   mittel    — Eis erwärmen und schmelzen; Wasser erwärmen und verdampfen
//   schwierig — wie viel Eis? (Umkehr, mit Probe); welche Endtemperatur? (Umkehr, mit Probe)
//   komplex   — Dampf kondensiert und schmilzt Eis; Schmelzdauer auf der Herdplatte
//
// Jeder vorgesehene Fehler hat einen eigenen Wert; fallen zwei zusammen oder trifft einer die Lösung,
// steht an der Stelle NaN (siehe CLAUDE.md, „Die Kollisionsprüfung“). Gewürfelt wird aus VORHER
// gefilterten Listen — nie durch Verwerfen.

import { num, trifft, ohneKollision, glatt, spaeter } from "./seite.js?v=1";

// Energie je Kilogramm (kJ) und je Kilogramm und Kelvin (kJ/K) — wie in der Tabelle der Seite.
const C_EIS = 2.1, Q_S = 334, C_W = 4.19, Q_V = 2256;
const TOL = 0.0051;                          // ein auf zwei Stellen gerundeter Wert
const r2 = (x) => Math.round(x * 100) / 100;
const zwei = (x) => num(r2(x), 2);
const RUNDEN = `<br><span class="progress-note">Runde auf zwei Nachkommastellen.</span>`;
const hinweisAus = (liste, tol = TOL) => (roh, w) => (liste.find(([x]) => Number.isFinite(x) && trifft(w, x, tol + 1e-9)) || [0, ""])[1];
const TABELLE = "Eis erwärmen 2,1 kJ je kg und K, schmelzen 334 kJ je kg, Wasser erwärmen 4,19 kJ je kg und K, verdampfen 2256 kJ je kg";

// ---------- E1: Eis schmelzen ----------

function e1Fehler({ m }) {
  return [
    [Q_S, "Das ist die Energie für 1 kg. Die Energie ist proportional zur Masse: mit der Masse malnehmen."],
    [Q_S / m, "Geteilt statt malgenommen: Doppelte Masse braucht doppelte Energie, Q = m · 334 kJ je kg."],
    [m * Q_V, "2256 kJ je kg braucht das Verdampfen. Zum Schmelzen sind es 334 kJ je kg."],
  ];
}
const E1_KANDIDATEN = spaeter(() => [0.2, 0.25, 0.4, 0.5, 0.75, 1.5, 2, 2.5, 3, 4, 5, 8].map((m) => ({ m })));
const E1 = {
  schwierigkeit: "einfach",
  titel: "Eis schmelzen",
  abschnitt: "sec-uebergaenge",
  generate() {
    const v = ohneKollision(E1_KANDIDATEN(), (v) => [v.m * Q_S, ...e1Fehler(v).map((x) => x[0])], 0.02);
    const { m } = v, Q = m * Q_S;
    return {
      promptHtml: `${num(m, 2)} kg Eis von 0 °C sollen vollständig schmelzen. Wie viel Energie (in kJ) ist dafür nötig? Zum Schmelzen von 1 kg Eis braucht man 334 kJ.`,
      correct: r2(Q), tolerance: TOL,
      hinweis: hinweisAus(e1Fehler(v)),
      tipps: ["Die Energie ist proportional zur Masse.", "Q = m · 334 kJ je kg"],
      musterloesungHtml: `Q = ${num(m, 2)} kg · 334 kJ je kg = <strong>${zwei(Q)} kJ</strong>`,
    };
  },
};

// ---------- E2: Wasser erwärmen ----------

function e2Fehler({ m, t1, t2 }) {
  return [
    [m * C_W * t2, `ΔT ist der Temperaturunterschied: ${num(t2)} °C − ${num(t1)} °C = ${num(t2 - t1)} K — nicht die Endtemperatur.`],
    // Bei 1 kg ist die Energie für 1 kg die Lösung — dort kein eigener Fehler, sonst fiele 1 kg aus dem Vorrat.
    [m === 1 ? NaN : C_W * (t2 - t1), "Das ist die Energie für 1 kg. Mit der Masse malnehmen."],
    [m * C_W, "Das ist die Energie für 1 K. Die Temperatur steigt aber um ΔT — malnehmen mit ΔT."],
    [m * C_EIS * (t2 - t1), "2,1 kJ je kg und K gelten für Eis. Für Wasser sind es 4,19 kJ je kg und K."],
  ];
}
const E2_KANDIDATEN = spaeter(() => {
  const l = [];
  for (const m of [0.5, 1, 1.5, 2, 2.5, 3, 4, 5]) for (const t1 of [10, 12, 15, 20]) for (const t2 of [40, 50, 60, 80, 100]) {
    if (glatt(m * C_W * (t2 - t1), 2)) l.push({ m, t1, t2 });
  }
  return l;
});
const E2 = {
  schwierigkeit: "einfach",
  titel: "Wasser erwärmen",
  abschnitt: "sec-uebergaenge",
  generate() {
    const v = ohneKollision(E2_KANDIDATEN(), (v) => [v.m * C_W * (v.t2 - v.t1), ...e2Fehler(v).map((x) => x[0])], 0.02);
    const { m, t1, t2 } = v, dT = t2 - t1, Q = m * C_W * dT;
    return {
      promptHtml: `${num(m, 1)} kg Wasser werden von ${num(t1)} °C auf ${num(t2)} °C erwärmt. Wie viel Energie (in kJ) ist dafür nötig? Um 1 kg Wasser um 1 K zu erwärmen, braucht man 4,19 kJ.`,
      correct: r2(Q), tolerance: TOL,
      hinweis: hinweisAus(e2Fehler(v)),
      tipps: [`Erst die Temperaturänderung: ${num(t2)} °C − ${num(t1)} °C.`, "Q = m · 4,19 kJ je kg und K · ΔT"],
      musterloesungHtml: `ΔT = ${num(t2)} °C − ${num(t1)} °C = ${num(dT)} K<br>Q = ${num(m, 1)} · 4,19 · ${num(dT)} kJ = <strong>${zwei(Q)} kJ</strong>`,
    };
  },
};

// ---------- M1: Eis erwärmen und schmelzen ----------

function m1Fehler({ m, t1 }) {
  const d = -t1;
  return [
    [m * Q_S, `Das Eis muss erst von ${num(t1)} °C auf 0 °C erwärmt werden, bevor es schmelzen kann.`],
    [m * C_EIS * d, "Damit ist das Eis erst bei 0 °C — geschmolzen ist es noch nicht. Die Energie zum Schmelzen kommt dazu."],
    [m * (C_W * d + Q_S), "Bis 0 °C ist es noch Eis: 2,1 kJ je kg und K, nicht 4,19 wie bei Wasser."],
    [m * (Q_S - C_EIS * d), `Von ${num(t1)} °C auf 0 °C ist eine Erwärmung um ${num(d)} K — die Energie dafür kommt dazu, sie wird nicht abgezogen.`],
  ];
}
const M1_KANDIDATEN = spaeter(() => {
  const l = [];
  for (const m of [0.5, 1, 1.5, 2, 2.5, 3, 4, 5]) for (const t1 of [-25, -20, -18, -15, -12, -10, -8, -5]) {
    if (glatt(m * (C_EIS * -t1 + Q_S), 2)) l.push({ m, t1 });
  }
  return l;
});
const M1 = {
  schwierigkeit: "mittel",
  titel: "Eis aus der Kühltruhe",
  abschnitt: "sec-uebergaenge",
  generate() {
    const v = ohneKollision(M1_KANDIDATEN(), (v) => [v.m * (C_EIS * -v.t1 + Q_S), ...m1Fehler(v).map((x) => x[0])], 0.02);
    const { m, t1 } = v, d = -t1, Q1 = m * C_EIS * d, Q2 = m * Q_S;
    return {
      promptHtml: `${num(m, 1)} kg Eis kommen mit ${num(t1)} °C aus der Kühltruhe. Wie viel Energie (in kJ) braucht man, bis das ganze Eis zu Wasser von 0 °C geschmolzen ist? (${TABELLE})`,
      correct: r2(Q1 + Q2), tolerance: TOL,
      hinweis: hinweisAus(m1Fehler(v)),
      tipps: ["Zwei Schritte: Erst das Eis auf 0 °C erwärmen, dann schmelzen.", `Erwärmen um ${num(d)} K: m · 2,1 kJ je kg und K · ${num(d)} K; Schmelzen: m · 334 kJ je kg.`],
      musterloesungHtml: `Eis erwärmen: ${num(m, 1)} · 2,1 · ${num(d)} kJ = ${zwei(Q1)} kJ<br>Schmelzen: ${num(m, 1)} · 334 kJ = ${zwei(Q2)} kJ<br>Zusammen: <strong>${zwei(Q1 + Q2)} kJ</strong>`,
    };
  },
};

// ---------- M2: Wasser zum Kochen bringen und verdampfen ----------

function m2Fehler({ m, t1 }) {
  const d = 100 - t1;
  return [
    [m * Q_V, `Das Wasser muss erst von ${num(t1)} °C auf 100 °C erwärmt werden, bevor es verdampft.`],
    [m * C_W * d, "Damit siedet das Wasser erst — verdampft ist es noch nicht. Die Energie zum Verdampfen kommt dazu."],
    [m * (C_W * d + Q_S), "334 kJ je kg braucht das Schmelzen. Zum Verdampfen sind es 2256 kJ je kg."],
    [m * (C_W * 100 + Q_V), `Das Wasser hat schon ${num(t1)} °C: Es wird nur um ${num(d)} K erwärmt.`],
  ];
}
const M2_KANDIDATEN = spaeter(() => {
  const l = [];
  for (const m of [0.2, 0.25, 0.4, 0.5, 0.75, 1, 1.5, 2]) for (const t1 of [10, 15, 20, 25, 30, 40]) {
    if (glatt(m * (C_W * (100 - t1) + Q_V), 2)) l.push({ m, t1 });
  }
  return l;
});
const M2 = {
  schwierigkeit: "mittel",
  titel: "Der Topf kocht leer",
  abschnitt: "sec-uebergaenge",
  generate() {
    const v = ohneKollision(M2_KANDIDATEN(), (v) => [v.m * (C_W * (100 - v.t1) + Q_V), ...m2Fehler(v).map((x) => x[0])], 0.02);
    const { m, t1 } = v, d = 100 - t1, Q1 = m * C_W * d, Q2 = m * Q_V;
    return {
      promptHtml: `In einem Topf stehen ${num(m, 2)} kg Wasser von ${num(t1)} °C auf dem Herd. Wie viel Energie (in kJ) ist nötig, bis das ganze Wasser verdampft ist? (${TABELLE})`,
      correct: r2(Q1 + Q2), tolerance: TOL,
      hinweis: hinweisAus(m2Fehler(v)),
      tipps: ["Zwei Schritte: Erst bis zur Siedetemperatur 100 °C erwärmen, dann verdampfen.", `Erwärmen um ${num(d)} K: m · 4,19 kJ je kg und K · ${num(d)} K; Verdampfen: m · 2256 kJ je kg.`],
      musterloesungHtml: `Erwärmen: ${num(m, 2)} · 4,19 · ${num(d)} kJ = ${zwei(Q1)} kJ<br>Verdampfen: ${num(m, 2)} · 2256 kJ = ${zwei(Q2)} kJ<br>Zusammen: <strong>${zwei(Q1 + Q2)} kJ</strong>`,
    };
  },
};

// ---------- S1: Wie viel Eis? (Umkehraufgabe mit Probe) ----------

function s1Fehler({ Q, t2 }) {
  const je = Q_S + C_W * t2;
  return [
    [Q / Q_S, `334 kJ je kg reichen nur zum Schmelzen. Das Schmelzwasser soll aber noch auf ${num(t2)} °C kommen: Je Kilogramm braucht man 334 kJ + 4,19 · ${num(t2)} kJ.`],
    [Q * je, "Rückwärts wird geteilt: m = Q : (Energie je Kilogramm)."],
    [Q / (C_W * t2), "Das Eis muss erst schmelzen — die 334 kJ je kg kommen dazu."],
  ];
}
const S1_KANDIDATEN = spaeter(() => {
  const l = [];
  for (const m of [0.5, 1, 1.5, 2, 2.5, 3, 4, 5]) for (const t2 of [10, 20, 25, 30, 40, 50]) {
    const Q = m * (Q_S + C_W * t2);
    if (glatt(Q, 2)) l.push({ m, t2, Q: r2(Q) });
  }
  return l;
});
const S1 = {
  schwierigkeit: "schwierig",
  titel: "Wie viel Eis?",
  abschnitt: "sec-uebergaenge",
  generate() {
    const v = ohneKollision(S1_KANDIDATEN(), (v) => [v.m, ...s1Fehler(v).map((x) => x[0])], 0.02);
    const { m, t2, Q } = v, je = Q_S + C_W * t2;
    return {
      promptHtml: `Mit ${num(Q, 2)} kJ wird Eis von 0 °C geschmolzen und das Schmelzwasser auf ${num(t2)} °C erwärmt. Wie viel Kilogramm Eis waren es? (${TABELLE})`,
      correct: m, tolerance: TOL,
      hinweis: hinweisAus(s1Fehler(v)),
      tipps: [`Erst die Energie für 1 kg: schmelzen und dann um ${num(t2)} K erwärmen.`, "m = Q : (Energie je Kilogramm)"],
      musterloesungHtml: `Je Kilogramm: 334 kJ + 4,19 · ${num(t2)} kJ = ${num(je, 2)} kJ<br>m = ${num(Q, 2)} kJ : ${num(je, 2)} kJ je kg = <strong>${num(m, 2)} kg</strong><br>` +
        `<em>Probe:</em> ${num(m, 2)} · (334 + 4,19 · ${num(t2)}) = ${num(m * je, 2)} kJ ✓`,
    };
  },
};

// ---------- S2: Welche Endtemperatur? (Umkehraufgabe mit Probe) ----------

function s2Fehler({ m, t1, Q }) {
  const dT = Q / (m * C_W);
  return [
    [dT, `Das ist die Temperaturänderung. Das Wasser hatte vorher schon ${num(t1)} °C — die Erwärmung kommt dazu.`],
    // Bei 1 kg fallen beide Masse-Fehler auf die Lösung — dort NaN, sonst fiele 1 kg aus dem Vorrat.
    [m === 1 ? NaN : t1 + Q / C_W, "Die Masse fehlt: Die Energie verteilt sich auf alle Kilogramm, ΔT = Q : (m · 4,19)."],
    [m === 1 ? NaN : t1 + (Q * m) / C_W, "Durch die Masse wird geteilt, nicht malgenommen: Mehr Wasser wird weniger warm."],
    [t1 + Q / (m * C_EIS), "2,1 kJ je kg und K gelten für Eis. Für Wasser sind es 4,19 kJ je kg und K."],
  ];
}
const S2_KANDIDATEN = spaeter(() => {
  const l = [];
  for (const m of [0.5, 1, 1.5, 2, 2.5, 3, 4]) for (const t1 of [10, 12, 15, 18, 20]) for (const dT of [20, 25, 30, 40, 45, 50, 60]) {
    const Q = m * C_W * dT;
    if (t1 + dT < 100 && glatt(Q, 2)) l.push({ m, t1, dT, Q: r2(Q) });
  }
  return l;
});
const S2 = {
  schwierigkeit: "schwierig",
  titel: "Wie warm wird das Wasser?",
  abschnitt: "sec-uebergaenge",
  generate() {
    const v = ohneKollision(S2_KANDIDATEN(), (v) => [v.t1 + v.dT, ...s2Fehler(v).map((x) => x[0])], 0.02);
    const { m, t1, dT, Q } = v;
    return {
      promptHtml: `${num(m, 1)} kg Wasser von ${num(t1)} °C bekommen ${num(Q, 2)} kJ Energie. Welche Temperatur (in °C) hat das Wasser danach? Um 1 kg Wasser um 1 K zu erwärmen, braucht man 4,19 kJ.`,
      correct: t1 + dT, tolerance: TOL,
      hinweis: hinweisAus(s2Fehler(v)),
      tipps: ["Erst die Temperaturänderung: ΔT = Q : (m · 4,19 kJ je kg und K).", `Dann zur Anfangstemperatur ${num(t1)} °C addieren.`],
      musterloesungHtml: `ΔT = ${num(Q, 2)} kJ : (${num(m, 1)} kg · 4,19 kJ je kg und K) = ${num(dT)} K<br>ϑ = ${num(t1)} °C + ${num(dT)} K = <strong>${num(t1 + dT)} °C</strong><br>` +
        `<em>Probe:</em> ${num(m, 1)} · 4,19 · ${num(dT)} = ${num(m * C_W * dT, 2)} kJ ✓`,
    };
  },
};

// ---------- K1: Dampf schmilzt Eis ----------

function k1Fehler({ mD }) {
  return [
    [(mD * Q_S) / Q_V, "Verhältnis umgedreht: Kondensieren setzt viel mehr Energie frei (2256 kJ je kg), als das Schmelzen braucht (334 kJ je kg) — es schmilzt also MEHR Eis, als Dampf kondensiert."],
    [mD, "Nicht gleich viel: Kondensieren setzt je Kilogramm 2256 kJ frei, Schmelzen braucht nur 334 kJ."],
    [mD * Q_V, "Das ist die frei werdende Energie in kJ. Gefragt ist, wie viel Kilogramm Eis sie schmilzt: durch 334 kJ je kg teilen."],
    [(mD * (Q_V + C_W * 100)) / Q_S, "Der Dampf kondensiert nur zu Wasser von 100 °C — dass es danach abkühlt, verlangt die Aufgabe nicht."],
  ];
}
const K1_KANDIDATEN = spaeter(() => [0.1, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.75, 0.8, 1, 1.2, 1.5, 2].map((mD) => ({ mD })));
const K1 = {
  schwierigkeit: "komplex",
  titel: "Dampf schmilzt Eis",
  abschnitt: "sec-uebergaenge",
  generate() {
    const v = ohneKollision(K1_KANDIDATEN(), (v) => [(v.mD * Q_V) / Q_S, ...k1Fehler(v).map((x) => x[0])], 0.02);
    const { mD } = v, Q = mD * Q_V, mE = Q / Q_S;
    return {
      promptHtml: `${num(mD, 2)} kg Wasserdampf von 100 °C kondensieren zu Wasser von 100 °C. Die frei werdende Energie wird vollständig an Eis von 0 °C abgegeben. Wie viel Kilogramm Eis kann sie schmelzen? (${TABELLE})` + RUNDEN,
      correct: r2(mE), tolerance: TOL,
      hinweis: hinweisAus(k1Fehler(v)),
      tipps: ["Beim Kondensieren wird genauso viel Energie frei, wie das Verdampfen gebraucht hat: 2256 kJ je kg.", "Diese Energie durch 334 kJ je kg teilen — so viel Kilogramm Eis schmelzen."],
      musterloesungHtml: `Frei beim Kondensieren: ${num(mD, 2)} · 2256 kJ = ${num(Q, 2)} kJ<br>Geschmolzenes Eis: ${num(Q, 2)} kJ : 334 kJ je kg ≈ <strong>${zwei(mE)} kg</strong>`,
    };
  },
};

// ---------- K2: Schmelzen auf der Herdplatte ----------

function k2Fehler({ m, t1, t2, P }) {
  const qE = m * C_EIS * -t1, qS = m * Q_S, qW = m * C_W * t2;
  return [
    [(qS + qW) / P, `Das Eis muss erst von ${num(t1)} °C auf 0 °C erwärmt werden.`],
    [(qE + qW) / P, "Das Schmelzen fehlt — und es braucht den größten Teil der Energie."],
    [(qE + qS) / P, `Das Schmelzwasser soll noch auf ${num(t2)} °C kommen: Die Energie dafür fehlt.`],
    [qE + qS + qW, `Das ist die Energie in kJ. Gefragt ist die Zeit: Die Platte liefert ${num(P)} kJ je Minute, also durch ${num(P)} teilen.`],
    [(qE + qS + qW) * P, "Malgenommen statt geteilt: Die Zeit ist die Energie geteilt durch die Energie je Minute."],
  ];
}
const K2_KANDIDATEN = spaeter(() => {
  const l = [];
  for (const m of [0.5, 1, 1.5, 2]) for (const t1 of [-20, -15, -10]) for (const t2 of [10, 20, 30, 40]) for (const P of [20, 25, 30, 40, 50, 60]) {
    const t = (m * (C_EIS * -t1 + Q_S + C_W * t2)) / P;
    if (glatt(t, 2)) l.push({ m, t1, t2, P });
  }
  return l;
});
const K2 = {
  schwierigkeit: "komplex",
  titel: "Schmelzen auf der Herdplatte",
  abschnitt: "sec-uebergaenge",
  generate() {
    const v = ohneKollision(K2_KANDIDATEN(), (v) => [(v.m * (C_EIS * -v.t1 + Q_S + C_W * v.t2)) / v.P, ...k2Fehler(v).map((x) => x[0])], 0.02);
    const { m, t1, t2, P } = v, qE = m * C_EIS * -t1, qS = m * Q_S, qW = m * C_W * t2, Q = qE + qS + qW;
    return {
      promptHtml: `In einem Topf liegen ${num(m, 1)} kg Eis von ${num(t1)} °C. Die Herdplatte gibt ${num(P)} kJ je Minute an den Topfinhalt ab. Wie viele Minuten dauert es, bis Wasser von ${num(t2)} °C im Topf ist? (${TABELLE})`,
      correct: r2(Q / P), tolerance: TOL,
      hinweis: hinweisAus(k2Fehler(v)),
      tipps: ["Drei Schritte: Eis auf 0 °C erwärmen, schmelzen, Wasser erwärmen — die Energien addieren.", `Dann die Zeit: Energie : ${num(P)} kJ je Minute.`],
      musterloesungHtml: `Eis erwärmen: ${num(m, 1)} · 2,1 · ${num(-t1)} kJ = ${zwei(qE)} kJ<br>Schmelzen: ${num(m, 1)} · 334 kJ = ${zwei(qS)} kJ<br>Wasser erwärmen: ${num(m, 1)} · 4,19 · ${num(t2)} kJ = ${zwei(qW)} kJ<br>` +
        `Zusammen ${zwei(Q)} kJ; Zeit: ${zwei(Q)} kJ : ${num(P)} kJ je Minute = <strong>${zwei(Q / P)} min</strong>`,
    };
  },
};

export const AUFGABEN = [E1, E2, M1, M2, S1, S2, K1, K2];
