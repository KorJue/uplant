// Die acht Übungsaufgaben zu „Oberflächeninhalt von Zylindern“ — zwei je Stufe:
//   einfach   — Mantel (aus r oder d); Etikett einer Dose (Länge und Breite)
//   mittel    — Oberfläche (aus r oder d); Oberfläche aus einem Netz mit Maßen (Figur)
//   schwierig — Höhe aus Mantel oder Oberfläche (mit Probe); offene Zylinder
//   komplex   — Rohrstück mit Wanddicke; Dosen herstellen (Verschnitt, m²)
//
// Wie auf der Kreis-Seite: gerechnet mit der π-Taste, das Ergebnis auf zwei Nachkommastellen gerundet
// (Toleranz 0,015). Die Fehlerwerte liegen deshalb mindestens 0,05 auseinander; wer mit π ≈ 3,14
// rechnet, bekommt einen eigenen Hinweis, sofern das Ergebnis dadurch sichtbar abweicht. Den Radius aus
// einer Fläche zu bestimmen braucht die Quadratwurzel — rückwärts wird hier nur die Höhe gesucht.

import { num, zwei, pick, trifft, ohneKollision, TOL_PI, mitDreiVierzehn, HINWEIS_314 } from "./seite.js?v=1";

const PI = Math.PI;
const cm = (x, e = "cm") => `${num(x)} ${e}`;
const RUNDEN = `<br><span class="progress-note">Rechne mit der π-Taste und runde das Ergebnis auf zwei Nachkommastellen.</span>`;
// Ein Fehlerwert gilt als getroffen, wenn die Eingabe so nah an ihm liegt wie eine richtige Antwort an
// der Lösung.
const hinweisAus = (liste) => (roh, w) => (liste.find(([x]) => Number.isFinite(x) && trifft(w, x, TOL_PI + 1e-9)) || [0, ""])[1];
const r2 = (x) => Math.round(x * 100) / 100;

// Radius oder Durchmesser, gleich wahrscheinlich.
function rOderD(rs) {
  const r = pick(rs), mitD = Math.random() < 0.5;
  return { r, d: 2 * r, mitD, angabe: mitD ? `den Durchmesser ${cm(2 * r)}` : `den Radius ${cm(r)}`, rText: mitD ? `r = d : 2 = ${cm(r)}` : `r = ${cm(r)}` };
}

// ---------- Z1: Mantel ----------

const Z1 = {
  schwierigkeit: "einfach",
  titel: "Der Mantel",
  abschnitt: "sec-netz",
  generate() {
    const g = rOderD([1, 1.5, 2, 2.5, 3, 4, 5, 6]);
    const { h } = ohneKollision([3, 4, 5, 6, 8, 10, 12, 15].map((h) => ({ h })), ({ h }) => [2 * PI * g.r * h, PI * g.r * h, 2 * PI * g.r * g.r, g.mitD ? 2 * PI * g.d * h : NaN, mitDreiVierzehn(2 * PI * g.r * h, 2 * 3.14 * g.r * h)], 0.05);
    const M = 2 * PI * g.r * h;
    return {
      promptHtml: `Ein Zylinder hat ${g.angabe} und ist ${cm(h)} hoch. Wie groß ist sein Mantel (in cm²)?` + RUNDEN,
      correct: r2(M), tolerance: TOL_PI,
      hinweis: hinweisAus([
        [PI * g.r * h, "π · r ist nur der halbe Umfang. Der Mantel ist so lang wie der ganze Umfang 2 · π · r."],
        [2 * PI * g.r * g.r, "Der Mantel ist kein Kreis: Der Umfang 2 · π · r wird mit der Höhe multipliziert, nicht mit r."],
        [g.mitD ? 2 * PI * g.d * h : NaN, "Du hast den Durchmesser wie einen Radius eingesetzt. Mit d heißt es u = π · d."],
        [mitDreiVierzehn(M, 2 * 3.14 * g.r * h), HINWEIS_314],
      ]),
      tipps: ["Der Mantel ist ein Rechteck: Länge = Umfang des Kreises, Breite = Höhe.", "M = 2 · π · r · h"],
      musterloesungHtml: `${g.rText}<br>M = 2 · π · r · h = 2 · π · ${cm(g.r)} · ${cm(h)} = ${num(2 * g.r * h)} · π cm² ≈ <strong>${zwei(M)} cm²</strong>`,
    };
  },
};

// ---------- Z2: Etikett ----------

const Z2 = {
  schwierigkeit: "einfach",
  titel: "Ein Etikett",
  abschnitt: "sec-zylinder",
  generate() {
    const d = pick([5, 6, 7, 7.5, 8, 9, 10, 12]), h = pick([4, 5, 6, 8, 10, 11, 12]);
    const u = PI * d;
    return {
      promptHtml: `Ein Etikett umschließt den Mantel einer Dose genau (ohne Überlappung). Die Dose hat den Durchmesser ${cm(d)} und ist ${cm(h)} hoch. Wie lang und wie breit ist das Etikett?` + RUNDEN,
      felder: [
        {
          name: "Länge", einheit: "cm", soll: r2(u), toleranz: TOL_PI,
          hinweis: hinweisAus([[d, "Das ist der Durchmesser. Das Etikett läuft einmal um die Dose herum: so lang wie der Umfang π · d."], [PI * d / 2, "Das ist nur der halbe Umfang."], [2 * PI * d, "Der Umfang ist π · d (oder 2 · π · r) — du hast den Durchmesser wie einen Radius eingesetzt."], [mitDreiVierzehn(u, 3.14 * d), HINWEIS_314]]),
        },
        { name: "Breite", einheit: "cm", soll: h, toleranz: TOL_PI, hinweis: hinweisAus([[u, "Länge und Breite vertauscht? Die Breite ist die Höhe der Dose."]]) },
      ],
      tipps: ["Rollt man das Etikett ab, ist es ein Rechteck.", "Länge = Umfang des Kreises, Breite = Höhe der Dose."],
      musterloesungHtml: `Länge = Umfang: u = π · d = π · ${cm(d)} ≈ <strong>${zwei(u)} cm</strong><br>Breite = Höhe der Dose: <strong>${cm(h)}</strong>`,
    };
  },
};

// ---------- Z3: Oberfläche ----------

function oFehler(r, h, mitD) {
  const O = 2 * PI * r * r + 2 * PI * r * h;
  return [
    [PI * r * r + 2 * PI * r * h, "Es gibt zwei Kreise — Grund- und Deckfläche: 2 · π · r²."],
    [2 * PI * r * h, "Das ist nur der Mantel. Grund- und Deckfläche kommen dazu."],
    [4 * PI * PI * r * r + 2 * PI * r * h, "(2 · π · r)² ist zu viel: Quadriert wird nur r — 2 · π · r²."],
    [mitD ? 2 * PI * 4 * r * r + 2 * PI * 2 * r * h : NaN, "Du hast den Durchmesser wie einen Radius eingesetzt: r = d : 2."],
    [mitDreiVierzehn(O, 2 * 3.14 * r * r + 2 * 3.14 * r * h), HINWEIS_314],
  ];
}
const Z3 = {
  schwierigkeit: "mittel",
  titel: "Die Oberfläche",
  abschnitt: "sec-oberflaeche",
  generate() {
    const g = rOderD([1, 1.5, 2, 2.5, 3, 4, 5]);
    const { h } = ohneKollision([2, 3, 4, 5, 6, 8, 10, 12].map((h) => ({ h })), ({ h }) => [2 * PI * g.r * (g.r + h), ...oFehler(g.r, h, g.mitD).map((x) => x[0])], 0.05);
    const O = 2 * PI * g.r * (g.r + h);
    return {
      promptHtml: `Ein Zylinder hat ${g.angabe} und ist ${cm(h)} hoch. Wie groß ist seine Oberfläche (in cm²)?` + RUNDEN,
      correct: r2(O), tolerance: TOL_PI,
      hinweis: hinweisAus(oFehler(g.r, h, g.mitD)),
      tipps: ["Die Oberfläche besteht aus zwei Kreisen und dem Mantel.", "O = 2 · π · r² + 2 · π · r · h = 2 · π · r · (r + h)"],
      musterloesungHtml:
        `${g.rText}<br>Kreise: 2 · π · r² = 2 · π · ${num(g.r * g.r)} cm² ≈ ${zwei(2 * PI * g.r * g.r)} cm²; Mantel: 2 · π · r · h ≈ ${zwei(2 * PI * g.r * h)} cm²<br>` +
        `O = 2 · π · ${cm(g.r)} · (${cm(g.r)} + ${cm(h)}) = ${num(2 * g.r * (g.r + h))} · π cm² ≈ <strong>${zwei(O)} cm²</strong>`,
    };
  },
};

// ---------- Z4: Oberfläche aus dem Netz ----------

// Das Netz maßstäblich: das Mantelrechteck (π · d lang, h hoch), darüber und darunter je ein Kreis, an
// der Mitte des Rechtecks anliegend. Beschriftet: d an einem Kreis, h am Rechteck.
function netzSvg(d, h) {
  const r = d / 2, L = PI * d;
  const S = Math.min(18, 300 / L, 240 / (h + 2 * d)), rand = 30;
  const breite = Math.ceil(L * S + 2 * rand + 40), hoehe = Math.ceil((h + 2 * d) * S + 2 * rand);
  const X = (x) => (rand + 40 + x * S).toFixed(2), Y = (y) => (rand + (h + d - y) * S).toFixed(2);
  let s = `<svg viewBox="0 0 ${breite} ${hoehe}" width="${breite}" height="${hoehe}" class="kp-aufgaben-figur" data-figur="zylindernetz" role="img" aria-label="Netz eines Zylinders">`;
  s += `<rect x="${X(0)}" y="${Y(h)}" width="${(L * S).toFixed(2)}" height="${(h * S).toFixed(2)}" class="kp-m" data-rolle="mantel"/>`;
  s += `<circle cx="${X(L / 2)}" cy="${Y(h + r)}" r="${(r * S).toFixed(2)}" class="kp-g" data-rolle="kreis"/>`;
  s += `<circle cx="${X(L / 2)}" cy="${Y(-r)}" r="${(r * S).toFixed(2)}" class="kp-g" data-rolle="kreis"/>`;
  // Durchmesser im oberen Kreis, waagerecht.
  s += `<line x1="${X(L / 2 - r)}" y1="${Y(h + r)}" x2="${X(L / 2 + r)}" y2="${Y(h + r)}" class="kp-hilfe" data-rolle="durchmesser"/>`;
  s += `<text x="${X(L / 2 + r)}" y="${(Number(Y(h + r)) - 6).toFixed(2)}" text-anchor="start" class="kp-figur-mass" data-rolle="mass-d">d = ${cm(d)}</text>`;
  s += `<text x="${(Number(X(0)) - 6).toFixed(2)}" y="${(Number(Y(h / 2)) + 5).toFixed(2)}" text-anchor="end" class="kp-figur-mass" data-rolle="mass-h">${cm(h)}</text>`;
  return s + "</svg>";
}
const Z4 = {
  schwierigkeit: "mittel",
  titel: "Oberfläche aus dem Netz",
  abschnitt: "sec-oberflaeche",
  generate() {
    const kand = [];
    for (const d of [2, 3, 4, 5, 6]) for (const h of [3, 4, 5, 6, 7, 8]) kand.push({ d, h });
    const { d, h } = ohneKollision(kand, ({ d, h }) => [2 * PI * (d / 2) * (d / 2 + h), ...oFehler(d / 2, h, true).map((x) => x[0])], 0.05);
    const r = d / 2, O = 2 * PI * r * (r + h);
    return {
      promptHtml: `Das Netz eines Zylinders ist maßstäblich gezeichnet. Berechne die Oberfläche des Zylinders (in cm²).` + netzSvg(d, h) + RUNDEN,
      correct: r2(O), tolerance: TOL_PI,
      hinweis: hinweisAus(oFehler(r, h, true)),
      tipps: ["Am Kreis steht der Durchmesser — der Radius ist die Hälfte.", "Zwei Kreise und ein Rechteck: O = 2 · π · r² + 2 · π · r · h."],
      musterloesungHtml: `r = ${cm(d)} : 2 = ${cm(r)}<br>O = 2 · π · ${cm(r)} · (${cm(r)} + ${cm(h)}) = ${num(2 * r * (r + h))} · π cm² ≈ <strong>${zwei(O)} cm²</strong>`,
    };
  },
};

// ---------- Z5: Höhe aus Mantel oder Oberfläche ----------

const Z5 = {
  schwierigkeit: "schwierig",
  titel: "Rückwärts: die Höhe",
  abschnitt: ["sec-netz", "sec-anwenden"],
  generate() {
    const r = pick([1.5, 2, 2.5, 3, 4, 5]);
    if (Math.random() < 0.5) {
      const { h } = ohneKollision([4, 5, 6, 7.5, 8, 10, 12, 15].map((h) => ({ h })), ({ h }) => { const M = r2(2 * PI * r * h); return [h, M / (PI * r), M / (2 * PI * r * r), M / 2 / r]; }, 0.05);
      const M = r2(2 * PI * r * h);
      return {
        promptHtml: `Der Mantel eines Zylinders mit dem Radius ${cm(r)} ist ${zwei(M)} cm² groß. Wie hoch ist der Zylinder?` + RUNDEN,
        correct: h, tolerance: TOL_PI,
        hinweis: hinweisAus([[M / (PI * r), "Teile durch den ganzen Umfang 2 · π · r, nicht durch π · r."], [M / (2 * PI * r * r), "Geteilt wird durch den Umfang 2 · π · r — ohne Quadrat."], [M / 2 / r, "π fehlt: Der Umfang ist 2 · π · r."]]),
        tipps: ["M = 2 · π · r · h — stelle nach h um.", "h = M : (2 · π · r)"],
        musterloesungHtml: `h = M : (2 · π · r) = ${zwei(M)} cm² : (2 · π · ${cm(r)}) ≈ <strong>${zwei(M / (2 * PI * r))} cm</strong>, also h = ${cm(h)}.<br><em>Probe:</em> 2 · π · ${cm(r)} · ${cm(h)} ≈ ${zwei(2 * PI * r * h)} cm².`,
      };
    }
    const { h } = ohneKollision([3, 4, 5, 6, 8, 10, 12].map((h) => ({ h })), ({ h }) => { const O = r2(2 * PI * r * (r + h)); return [h, O / (2 * PI * r), (O - PI * r * r) / (2 * PI * r), (O - 2 * PI * r * r) / (PI * r)]; }, 0.05);
    const O = r2(2 * PI * r * (r + h));
    return {
      promptHtml: `Ein Zylinder mit dem Radius ${cm(r)} hat die Oberfläche ${zwei(O)} cm². Wie hoch ist er?` + RUNDEN,
      correct: h, tolerance: TOL_PI,
      hinweis: hinweisAus([[O / (2 * PI * r), "Zieh zuerst die beiden Kreise ab — durch den Umfang geteilt wird nur der Mantel."], [(O - PI * r * r) / (2 * PI * r), "Es sind zwei Kreise: 2 · π · r² abziehen."], [(O - 2 * PI * r * r) / (PI * r), "Der Mantel ist 2 · π · r · h: Teile durch 2 · π · r."]]),
      tipps: ["Erst den Mantel bestimmen: M = O − 2 · π · r².", "Dann h = M : (2 · π · r)."],
      musterloesungHtml:
        `Kreise: 2 · π · ${num(r * r)} cm² ≈ ${zwei(2 * PI * r * r)} cm²; Mantel: M ≈ ${zwei(O)} cm² − ${zwei(2 * PI * r * r)} cm² = ${zwei(O - 2 * PI * r * r)} cm²<br>` +
        `h = M : (2 · π · r) ≈ ${zwei(O - 2 * PI * r * r)} cm² : ${zwei(2 * PI * r)} cm ≈ <strong>${zwei((O - 2 * PI * r * r) / (2 * PI * r))} cm</strong>, also h = ${cm(h)}.<br><em>Probe:</em> 2 · π · ${cm(r)} · (${cm(r)} + ${cm(h)}) ≈ ${zwei(2 * PI * r * (r + h))} cm².`,
    };
  },
};

// ---------- Z6: Offene Zylinder ----------

const Z6 = {
  schwierigkeit: "schwierig",
  titel: "Offene Zylinder",
  abschnitt: "sec-anwenden",
  generate() {
    const art = pick(["rohr", "becher", "saeule"]);
    if (art === "saeule") {
      const d = pick([1, 1.2, 1.5, 2]), h = pick([2.5, 3, 3.5, 4]);
      const M = PI * d * h;
      return {
        promptHtml: `Eine Litfaßsäule hat den Durchmesser ${cm(d, "m")}. Beklebt wird sie ${cm(h, "m")} hoch rundherum. Wie groß ist die Werbefläche (in m²)?` + RUNDEN,
        correct: r2(M), tolerance: TOL_PI,
        hinweis: hinweisAus([[M + 2 * PI * (d / 2) ** 2, "Beklebt wird nur der Mantel — Dach und Boden gehören nicht zur Werbefläche."], [2 * PI * d * h, "Mit dem Durchmesser ist der Umfang π · d, nicht 2 · π · d."], [mitDreiVierzehn(M, 3.14 * d * h), HINWEIS_314]]),
        tipps: ["Welche Fläche wird beklebt?", "Nur der Mantel: M = π · d · h."],
        musterloesungHtml: `Nur der Mantel: M = π · d · h = π · ${cm(d, "m")} · ${cm(h, "m")} ≈ <strong>${zwei(M)} m²</strong>`,
      };
    }
    const r = pick([1, 1.5, 2, 2.5, 3, 4]);
    const { h } = ohneKollision([5, 8, 10, 12, 15, 20, 25, 30].map((h) => ({ h })), ({ h }) => [2 * PI * r * h + (art === "becher" ? PI * r * r : 0), 2 * PI * r * h + 2 * PI * r * r, art === "becher" ? 2 * PI * r * h : 2 * PI * r * h + PI * r * r], 0.05);
    const M = 2 * PI * r * h, K = PI * r * r;
    if (art === "rohr") {
      return {
        promptHtml: `Ein Rohr hat den Radius ${cm(r)} und ist ${cm(h)} lang. Wie viel Blech braucht man für das Rohr (in cm²)?` + RUNDEN,
        correct: r2(M), tolerance: TOL_PI,
        hinweis: hinweisAus([[M + 2 * K, "Ein Rohr ist an beiden Enden offen — es hat keine Kreisflächen."], [M + K, "Ein Rohr hat gar keinen Kreis: Es ist nur ein Mantel."], [mitDreiVierzehn(M, 2 * 3.14 * r * h), HINWEIS_314]]),
        tipps: ["Welche Flächen hat ein Rohr?", "Nur den Mantel: M = 2 · π · r · h."],
        musterloesungHtml: `Ein Rohr ist nur ein Mantel: M = 2 · π · ${cm(r)} · ${cm(h)} ≈ <strong>${zwei(M)} cm²</strong>`,
      };
    }
    return {
      promptHtml: `Ein Becher (ohne Deckel) hat den Radius ${cm(r)} und ist ${cm(h)} hoch. Wie viel Material braucht man (in cm²)?` + RUNDEN,
      correct: r2(M + K), tolerance: TOL_PI,
      hinweis: hinweisAus([[M + 2 * K, "Ein Becher hat keinen Deckel — nur einen Kreis, den Boden."], [M, "Der Boden fehlt: Zum Mantel kommt ein Kreis π · r²."], [mitDreiVierzehn(M + K, 2 * 3.14 * r * h + 3.14 * r * r), HINWEIS_314]]),
      tipps: ["Welche Flächen hat ein Becher?", "Mantel und Boden: 2 · π · r · h + π · r²."],
      musterloesungHtml: `Boden: π · ${num(r * r)} cm² ≈ ${zwei(K)} cm²; Mantel: 2 · π · ${cm(r)} · ${cm(h)} ≈ ${zwei(M)} cm²<br>O ≈ <strong>${zwei(M + K)} cm²</strong>`,
    };
  },
};

// ---------- Z7: Rohrstück mit Wanddicke ----------

const Z7 = {
  schwierigkeit: "komplex",
  titel: "Ein Rohrstück mit Wanddicke",
  abschnitt: ["sec-oberflaeche", "sec-anwenden"],
  generate() {
    const kand = [];
    for (const R of [3, 4, 5, 6, 8]) for (const w of [0.5, 1, 1.5, 2]) for (const h of [5, 8, 10, 12, 15]) if (w < R - 1) kand.push({ R, r: R - w, h });
    const werte = ({ R, r, h }) => { const O = 2 * PI * R * h + 2 * PI * r * h + 2 * PI * (R * R - r * r); return [O, 2 * PI * R * h + 2 * PI * (R * R - r * r), 2 * PI * R * h + 2 * PI * r * h + 2 * PI * R * R, 2 * PI * R * h + 2 * PI * r * h + 2 * PI * (R - r) ** 2, 2 * PI * R * h + 2 * PI * r * h + PI * (R * R - r * r)]; };
    const { R, r, h } = ohneKollision(kand, werte, 0.05);
    const O = werte({ R, r, h })[0];
    return {
      promptHtml: `Ein Rohrstück ist ${cm(h)} lang. Sein Außenradius ist ${cm(R)}, sein Innenradius ${cm(r)}. Es wird rundherum lackiert — außen, innen und an beiden Stirnseiten. Wie groß ist die lackierte Fläche (in cm²)?` + RUNDEN,
      correct: r2(O), tolerance: TOL_PI,
      hinweis: hinweisAus([
        [2 * PI * R * h + 2 * PI * (R * R - r * r), "Innen wird auch lackiert: Der innere Mantel 2 · π · r · h fehlt."],
        [2 * PI * R * h + 2 * PI * r * h + 2 * PI * R * R, "Die Stirnseiten sind Kreisringe — das Loch in der Mitte gehört nicht dazu: π · (R² − r²)."],
        [2 * PI * R * h + 2 * PI * r * h + 2 * PI * (R - r) ** 2, "Ein Kreisring ist π · R² − π · r², nicht π · (R − r)²: erst quadrieren, dann abziehen."],
        [2 * PI * R * h + 2 * PI * r * h + PI * (R * R - r * r), "Es gibt zwei Stirnseiten — vorn und hinten."],
      ]),
      tipps: ["Welche Flächen hat das Rohrstück? Außenmantel, Innenmantel und zwei Kreisringe.", "Kreisring: π · (R² − r²)."],
      musterloesungHtml:
        `Außenmantel: 2 · π · ${cm(R)} · ${cm(h)} ≈ ${zwei(2 * PI * R * h)} cm²<br>Innenmantel: 2 · π · ${cm(r)} · ${cm(h)} ≈ ${zwei(2 * PI * r * h)} cm²<br>` +
        `Zwei Ringe: 2 · π · (${num(R * R)} − ${num(r * r)}) cm² ≈ ${zwei(2 * PI * (R * R - r * r))} cm²<br>O ≈ <strong>${zwei(O)} cm²</strong>`,
    };
  },
};

// ---------- Z8: Dosen herstellen ----------

const Z8 = {
  schwierigkeit: "komplex",
  titel: "Dosen herstellen",
  abschnitt: "sec-anwenden",
  generate() {
    const kand = [];
    for (const r of [3, 3.5, 4, 5]) for (const h of [8, 10, 11, 12]) for (const n of [500, 1000, 2000, 5000]) for (const p of [5, 10, 15, 20]) kand.push({ r, h, n, p });
    const werte = ({ r, h, n, p }) => { const O = 2 * PI * r * (r + h); return [n * O * (1 + p / 100) / 1e4, n * O / 1e4, n * O * (1 + p / 100) / 1e3, n * O * (1 + p / 100) / 100]; };
    const k = ohneKollision(kand, werte, 0.05);
    const { r, h, n, p } = k;
    const O = 2 * PI * r * (r + h), blech = (n * O * (1 + p / 100)) / 1e4;
    return {
      promptHtml: `Eine Firma stellt ${num(n)} Dosen her, jede mit dem Radius ${cm(r)} und der Höhe ${cm(h)}. Beim Ausschneiden gehen ${p} % zusätzlich als Verschnitt verloren. Wie groß ist die Oberfläche einer Dose, und wie viel Blech braucht die Firma insgesamt (in m²)?` + RUNDEN,
      felder: [
        { name: "eine Dose", einheit: "cm²", soll: r2(O), toleranz: TOL_PI, hinweis: hinweisAus(oFehler(r, h, false)) },
        {
          name: "Blech insgesamt", einheit: "m²", soll: r2(blech), toleranz: TOL_PI,
          hinweis: hinweisAus([[(n * O) / 1e4, `Der Verschnitt fehlt: ${p} % mehr, also mal ${num(1 + p / 100)}.`], [(n * O * (1 + p / 100)) / 1e3, "1 m² = 10.000 cm², nicht 1000 cm²."], [(n * O * (1 + p / 100)) / 100, "1 m² = 10.000 cm²: durch 10.000 teilen."]]),
        },
      ],
      tipps: ["Erst die Oberfläche einer Dose: O = 2 · π · r · (r + h).", `Dann mal ${num(n)}, plus ${p} % Verschnitt, und in m² umrechnen (1 m² = 10.000 cm²).`],
      musterloesungHtml:
        `Eine Dose: O = 2 · π · ${cm(r)} · ${cm(r + h)} ≈ <strong>${zwei(O)} cm²</strong><br>` +
        `${num(n)} Dosen mit ${p} % Verschnitt: ${num(n)} · ${zwei(O)} cm² · ${num(1 + p / 100)} ≈ ${num(n * O * (1 + p / 100), 0)} cm² ≈ <strong>${zwei(blech)} m²</strong>`,
    };
  },
};

export const AUFGABEN = [Z1, Z2, Z3, Z4, Z5, Z6, Z7, Z8];
