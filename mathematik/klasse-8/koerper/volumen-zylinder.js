// Selbstlernpfad „Volumen von Zylindern“ (Klasse 8, Körper, Thema 5).
//
// Reihenfolge — jeder Abschnitt benutzt nur, was vorher da war:
//   1. In den Zylinder werden regelmäßige n-Eck-Prismen gestellt. Ihr Volumen ist G_n · h (Thema 3);
//      G_n rückt mit wachsendem n an π · r² heran (aus n Dreiecken, gemessen).
//   2. V = π · r² · h: Der Zylinder wird aus Scheiben von 1 cm Dicke geschichtet.
//   3. Rückwärts: Wasser wird in einen Messzylinder gegossen; die Füllhöhe ist V : (π · r²).
//   4. Hohlzylinder: Der Kern wird starr nach oben herausgezogen; übrig bleibt π · (R² − r²) · h.
//
// Gerechnet wird mit den Reglerwerten und der π-Taste, gerundet erst bei der Ausgabe. Wo ein Regler
// nicht über einen anderen hinaus darf (Scheiben ≤ Höhe, Innenradius < Außenradius), schreibt
// begrenzt() den Wert in den Regler zurück.
// Farben: Grundfläche blau, Mantel orange, Höhe violett, Volumen grün, Wasser hellblau.
// Die Übungsaufgaben stehen in volumen-zylinder-aufgaben.js.

import { flaeche, zeige, num, zwei, reglerZahl, begrenzt, setzeText, setzeHtml, mountQuizze, mountUebungsaufgaben } from "./seite.js?v=1";
import * as R from "./raum.js?v=1";
import { AUFGABEN } from "./volumen-zylinder-aufgaben.js?v=1";

const W = 640;
const PI = Math.PI;
const prozent = (t) => `${Math.round(t * 100)} %`;
const cm = (x) => `${num(x)} cm`;
const KAM = R.ansicht(22);

// ================= 1. Annäherung durch Prismen =================

const NA_ECKEN = [3, 4, 5, 6, 8, 12, 24, 48];

function renderAnnaeherung() {
  const k = reglerZahl("na-k"), r = reglerZahl("na-r"), h = reglerZahl("na-h");
  const n = NA_ECKEN[k];
  setzeText("na-k-anzeige", String(n));
  setzeText("na-r-anzeige", cm(r));
  setzeText("na-h-anzeige", cm(h));
  const bu = R.buehne(KAM, [...R.kreisPunkte(4, 0), ...R.kreisPunkte(4, 6)], { breite: W, maxHoehe: 360, s0: 34, extra: { links: 80, unten: 10 } });
  const svg = flaeche(W, bu.hoehe, `Prisma mit regelmäßigem ${n}-Eck im Zylinder`);
  // Der Zylinder als Umriss: Rand oben, Rand unten, Seitenlinien — das Prisma steht darin.
  const rand = (y) => { const p = R.kreisPunkte(r, y); return [...p, p[0]]; };
  R.linienzug(svg, bu, rand(0), "kp-hilfe", { "data-rolle": "zylinder" });
  R.zeichneZylinder(svg, bu, { r, y0: 0, y1: h, n, kanten: n <= 24 });
  R.linienzug(svg, bu, rand(h), "kp-hilfe", { "data-rolle": "zylinder" });
  // Die Dreiecke der Grundfläche — von der Mitte zu jeder Ecke (bei vielen Ecken zu dicht).
  if (n <= 24) R.kreisPunkte(r, h, n).forEach((p) => R.strecke(svg, bu, [0, h, 0], p, "kp-hilfe", { "data-rolle": "speiche" }));
  R.strecke(svg, bu, [-r - 0.5, 0, 0], [-r - 0.5, h, 0], "kp-hoehe", { "data-rolle": "hoehe" });
  R.text(svg, bu, [-r - 0.5, h / 2, 0], `h = ${cm(h)}`, "kp-t-h", -8, 4, "end");
  zeige("na-mount", svg);
  const Gn = (n / 2) * r * r * Math.sin((2 * PI) / n), G = PI * r * r;
  setzeHtml("na-bilanz",
    `Grundfläche des Prismas: ${n} gleiche Dreiecke von der Mitte aus, zusammen <span class="wc">G<sub>${n}</sub> ≈ <strong data-rolle="Gn">${zwei(Gn)}</strong> cm²</span> (gemessen) — Kreisfläche π · r² ≈ <strong data-rolle="G">${zwei(G)}</strong> cm²<br>` +
    `Volumen des Prismas: <span class="wa">G<sub>${n}</sub> · h ≈ <strong data-rolle="Vn">${zwei(Gn * h)}</strong> cm³</span> — Zylinder: π · r² · h ≈ <strong data-rolle="V">${zwei(G * h)}</strong> cm³ (${num((Gn / G) * 100, 1)} % davon gefüllt)`);
  setzeText("na-text", n < 12
    ? `Das ${n}-Eck-Prisma füllt den Zylinder nur zum Teil — zwischen den Kanten und dem Mantel bleibt Platz.`
    : `Bei ${n} Ecken füllt das Prisma den Zylinder fast ganz aus: G · h des Prismas ist kaum noch von π · r² · h zu unterscheiden.`);
}

// ================= 2. Scheiben =================

function renderScheiben() {
  const r = reglerZahl("sv-r"), h = reglerZahl("sv-h");
  // Nicht mehr Scheiben, als der Zylinder hoch ist.
  const k = begrenzt("sv-k", reglerZahl("sv-k"), 0, h);
  setzeText("sv-r-anzeige", cm(r));
  setzeText("sv-h-anzeige", cm(h));
  setzeText("sv-k-anzeige", `${k} von ${h}`);
  const bu = R.buehne(KAM, [...R.kreisPunkte(4, 0), ...R.kreisPunkte(4, 8)], { breite: W, maxHoehe: 400, s0: 30, extra: { links: 80, unten: 10 } });
  const svg = flaeche(W, bu.hoehe, `Zylinder aus ${k} Scheiben`);
  // Der ganze Zylinder als gestrichelter Rahmen.
  const rand = (y) => { const p = R.kreisPunkte(r, y); return [...p, p[0]]; };
  R.linienzug(svg, bu, rand(0), "kp-hilfe", { "data-rolle": "rahmen" });
  R.linienzug(svg, bu, rand(h), "kp-hilfe", { "data-rolle": "rahmen" });
  R.strecke(svg, bu, [-r, 0, 0], [-r, h, 0], "kp-hilfe", { "data-rolle": "rahmen" });
  R.strecke(svg, bu, [r, 0, 0], [r, h, 0], "kp-hilfe", { "data-rolle": "rahmen" });
  // Von unten nach oben: Jede Scheibe verdeckt den Deckel der darunter.
  for (let i = 0; i < k; i++) R.zeichneZylinder(svg, bu, { r, y0: i, y1: i + 1, verdeckt: i === 0, daten: { "data-scheibe": String(i) } });
  R.text(svg, bu, [-r - 0.5, h / 2, 0], `h = ${cm(h)}`, "kp-t-h", -8, 4, "end");
  zeige("sv-mount", svg);
  const G = PI * r * r;
  setzeHtml("sv-bilanz",
    `Eine Scheibe: <span class="wc">π · r² · 1 cm = π · ${num(r * r)} cm² · 1 cm ≈ ${zwei(G)} cm³</span><br>` +
    `${k} Scheiben: ${k} · ${zwei(G)} cm³ ≈ <strong data-rolle="Vk">${zwei(k * G)}</strong> cm³<br>` +
    `<span class="wa">Ganzer Zylinder: V = π · r² · h = π · ${num(r * r)} cm² · ${cm(h)} ≈ <strong data-rolle="V">${zwei(G * h)}</strong> cm³</span>`);
  setzeText("sv-text", k === 0
    ? "Noch leer. Leg Scheiben übereinander."
    : k < h
      ? `${k} von ${h} Scheiben. Jede hat dasselbe Volumen π · r² · 1 cm — die Grundfläche mal 1 cm.`
      : `Voll: ${h} Scheiben zu je π · r² · 1 cm. Zusammen π · r² · h ≈ ${zwei(G * h)} cm³.`);
}

// ================= 3. Füllhöhe =================

const FU_H = 20;   // Höhe des Messzylinders: 500 ml passen bei r = 3 cm noch hinein (17,7 cm).

function renderFuellen() {
  const V = reglerZahl("fu-v"), r = reglerZahl("fu-r"), t = reglerZahl("fu-t") / 100;
  setzeText("fu-v-anzeige", `${V} ml`);
  setzeText("fu-r-anzeige", cm(r));
  setzeText("fu-t-anzeige", prozent(t));
  const hw = (t * V) / (PI * r * r);
  const bu = R.buehne(KAM, [...R.kreisPunkte(6, 0), ...R.kreisPunkte(6, FU_H)], { breite: W, maxHoehe: 440, s0: 16, extra: { rechts: 110, unten: 10 } });
  const svg = flaeche(W, bu.hoehe, "Messzylinder mit Wasser");
  const rand = (y) => { const p = R.kreisPunkte(r, y); return [...p, p[0]]; };
  // Glas hinten: der Rand oben (er liegt hinter dem Wasser nur zur Hälfte), dann das Wasser, dann das
  // Glas vorn darüber.
  R.linienzug(svg, bu, rand(FU_H), "kp-umriss", { "data-rolle": "glas" });
  if (hw > 1e-9) R.zeichneZylinder(svg, bu, { r, y0: 0, y1: hw, mantel: "kp-wasser", deckel: "kp-wasser", daten: { "data-teil": "wasser" } });
  // Unten nur die vordere Hälfte des Randes (von 270° über 0° bis 90°) — die hintere verdeckt das Wasser.
  const unten = rand(0), viertel = R.ZYL_N / 4;
  R.linienzug(svg, bu, unten.slice(3 * viertel).concat(unten.slice(1, viertel + 1)), "kp-umriss", { "data-rolle": "glas" });
  R.strecke(svg, bu, [-r, 0, 0], [-r, FU_H, 0], "kp-umriss", { "data-rolle": "glas" });
  R.strecke(svg, bu, [r, 0, 0], [r, FU_H, 0], "kp-umriss", { "data-rolle": "glas" });
  if (hw > 1e-9) {
    R.strecke(svg, bu, [r + 0.6, 0, 0], [r + 0.6, hw, 0], "kp-hoehe", { "data-rolle": "fuellhoehe" });
    R.text(svg, bu, [r + 0.6, hw / 2, 0], `h ≈ ${zwei(hw)} cm`, "kp-t-h kp-text-klein", 8, 4, "start");
  }
  zeige("fu-mount", svg);
  const G = PI * r * r;
  setzeHtml("fu-bilanz",
    `Eingegossen: ${num(t * V)} ml = ${num(t * V)} cm³; Grundfläche <span class="wc">π · r² = π · ${num(r * r)} cm² ≈ ${zwei(G)} cm²</span><br>` +
    `<span class="wr">Füllhöhe h = V : (π · r²) = ${num(t * V)} cm³ : ${zwei(G)} cm² ≈ <strong data-rolle="h">${zwei(hw)}</strong> cm</span>`);
  setzeText("fu-text", t === 0
    ? `Der Messzylinder ist leer. Gieß ${V} ml ein.`
    : t < 1
      ? "Das Wasser steigt gleichmäßig: Jeder Zentimeter Höhe fasst π · r² cm³."
      : `${V} ml stehen ${zwei(hw)} cm hoch. Bei einem breiteren Gefäß stünde dasselbe Wasser niedriger.`);
}

// ================= 4. Hohlzylinder =================

const HZ_LUECKE = 0.6;

function renderHohl() {
  const Ra = reglerZahl("hz-gr");
  // Der Kern muss schmaler sein als der Zylinder, sonst bliebe keine Wand.
  const r = begrenzt("hz-kr", reglerZahl("hz-kr"), 1, Ra - 0.5);
  const h = reglerZahl("hz-h"), t = reglerZahl("hz-t") / 100;
  setzeText("hz-gr-anzeige", cm(Ra));
  setzeText("hz-kr-anzeige", cm(r));
  setzeText("hz-h-anzeige", cm(h));
  setzeText("hz-t-anzeige", prozent(t));
  const lift = t * (h + HZ_LUECKE);
  const bu = R.buehne(KAM, [...R.kreisPunkte(4, 0), ...R.kreisPunkte(4, 2 * 5 + HZ_LUECKE)], { breite: W, maxHoehe: 440, s0: 26, extra: { links: 70, rechts: 70, unten: 10 } });
  const svg = flaeche(W, bu.hoehe, "Hohlzylinder, der Kern wird herausgezogen");
  // Das Rohr: Außenmantel, Deckfläche als Ring (Deckel mit dem Loch darauf).
  R.zeichneZylinder(svg, bu, { r: Ra, y0: 0, y1: h, daten: { "data-teil": "rohr" } });
  R.vieleck(svg, bu, R.kreisPunkte(r, h), "kp-loch", { "data-rolle": "loch", "data-teil": "rohr" });
  // Der Kern: Was über der Deckfläche des Rohrs liegt, ist zu sehen; der Rest steckt noch im Loch.
  const y0 = Math.max(h, lift), y1 = lift + h;
  if (y1 - y0 > 1e-9) R.zeichneZylinder(svg, bu, { r, y0, y1, mantel: "kp-a", deckel: "kp-a", verdeckt: false, daten: { "data-teil": "kern" } });
  else R.vieleck(svg, bu, R.kreisPunkte(r, h), "kp-a kp-flaeche", { "data-rolle": "deckel", "data-teil": "kern" });
  R.text(svg, bu, [-Ra, h / 2, 0], `h = ${cm(h)}`, "kp-t-h kp-text-klein", -8, 4, "end");
  zeige("hz-mount", svg);
  const Vg = PI * Ra * Ra * h, Vk = PI * r * r * h;
  setzeHtml("hz-bilanz",
    `Großer Zylinder: π · R² · h = π · ${num(Ra * Ra)} cm² · ${cm(h)} ≈ ${zwei(Vg)} cm³; Kern: π · r² · h = π · ${num(r * r)} cm² · ${cm(h)} ≈ ${zwei(Vk)} cm³<br>` +
    `<span class="wa">Rohr: V = π · (R² − r²) · h = π · (${num(Ra * Ra)} − ${num(r * r)}) cm² · ${cm(h)} ≈ <strong data-rolle="V">${zwei(Vg - Vk)}</strong> cm³</span>`);
  setzeText("hz-text", t === 0
    ? "Noch steckt der Kern im Zylinder — zusammen sind sie ein voller Zylinder. Zieh den Kern heraus."
    : t < 1
      ? "Der Kern gleitet nach oben heraus. Er bleibt, wie er ist; das Rohr auch."
      : "Draußen: Großer Zylinder minus Kern ist das Rohr. Seine Grundfläche ist ein Kreisring.");
}

// ================= Kontrollfragen =================

mountQuizze({
  "quiz-annaeherung": {
    q: "Warum gilt V = G · h auch für einen Zylinder?",
    options: ["Weil er sich beliebig genau durch Prismen annähern lässt, für die V = G · h gilt", "Weil sein Mantel abgewickelt ein Rechteck ist", "Weil π ungefähr 3 ist", "Weil Grund- und Deckfläche zusammen 2 · G sind"],
    correct: 0,
    explain: "Die Prismen im Zylinder haben das Volumen G_n · h. Mit mehr Ecken füllen sie ihn immer besser, und G_n wird zur Kreisfläche — so überträgt sich V = G · h. Der Mantel als Rechteck gehört zur Oberfläche, nicht zum Volumen.",
  },
  "quiz-volumen": {
    q: "Ein Zylinder hat r = 3 cm und h = 10 cm. Wie groß ist sein Volumen?",
    options: ["≈ 94,25 cm³", "≈ 565,49 cm³", "≈ 282,74 cm³", "≈ 188,50 cm³"],
    correct: 2,
    explain: "V = π · r² · h = π · 9 cm² · 10 cm = 90 · π cm³ ≈ 282,74 cm³. 94,25 entsteht ohne Quadrat (π · r · h), 188,50 ist der Mantel 2 · π · r · h — eine Fläche in cm², kein Volumen.",
  },
  "quiz-umkehr": {
    q: "In einen Messzylinder mit r = 4 cm gießt man 0,5 l Wasser. Wie hoch steht es?",
    options: ["≈ 39,79 cm", "≈ 9,95 cm", "≈ 0,01 cm", "≈ 19,89 cm"],
    correct: 1,
    explain: "0,5 l = 500 cm³. h = 500 cm³ : (π · 16 cm²) ≈ 9,95 cm. Ohne Umrechnung käme 0,01 heraus — Liter und cm passen nicht zusammen.",
  },
  "quiz-hohl": {
    q: "Ein Rohr hat R = 5 cm, r = 3 cm und h = 10 cm. Wie groß ist sein Volumen?",
    options: ["≈ 125,66 cm³", "≈ 785,40 cm³", "≈ 1.068,14 cm³", "≈ 502,65 cm³"],
    correct: 3,
    explain: "V = π · (R² − r²) · h = π · (25 − 9) cm² · 10 cm = 160 · π cm³ ≈ 502,65 cm³. π · (R − r)² · h = 125,66 cm³ wäre ein dünner Zylinder mit der Wandstärke als Radius.",
  },
});

// ================= Verdrahten =================

["na-k", "na-r", "na-h"].forEach((id) => document.getElementById(id).addEventListener("input", renderAnnaeherung));
["sv-r", "sv-h", "sv-k"].forEach((id) => document.getElementById(id).addEventListener("input", renderScheiben));
["fu-v", "fu-r", "fu-t"].forEach((id) => document.getElementById(id).addEventListener("input", renderFuellen));
["hz-gr", "hz-kr", "hz-h", "hz-t"].forEach((id) => document.getElementById(id).addEventListener("input", renderHohl));
renderAnnaeherung();
renderScheiben();
renderFuellen();
renderHohl();

mountUebungsaufgaben(document.getElementById("exercises-mount"), AUFGABEN);
