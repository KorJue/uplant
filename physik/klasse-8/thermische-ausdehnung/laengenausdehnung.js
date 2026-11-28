// Seite 2 „Längenausdehnung“ der Einheit „Thermische Ausdehnung“ (Physik, Klasse 8).
//
// Didaktische Reihenfolge — jeder Abschnitt benutzt nur, was davor steht:
//   1. Messreihe am Kupferrohr: ΔL ~ ΔT                (Kelvin nur als Temperaturdifferenz)
//   2. L0 Meter aus je 1 m: ΔL ~ L0                     (jedes Meterstück wie in 1)
//   3. Fünf Stoffe nebeneinander: α, ΔL = α · L0 · ΔT  (fasst 1 und 2 zusammen)
//   4. Rückwärts: α aus einer Messung, Stoff erkennen  (3 umgestellt)
//   5. Dehnungsfuge einer Brücke                       (3 mit Temperaturen statt ΔT)
//   6. Bimetall                                         (zwei Stoffe aus 3, verbunden)
//   7. Vom Stab zum Würfel, Flüssigkeiten, Thermometer (Volumen statt Länge)
// Die Längenänderungen sind winzig. Wo eine Zeichnung sie vergrößert, steht der Faktor daneben
// (§ 1: Die Zeichnung darf nicht stillschweigend übertreiben). Die Übungsaufgaben stehen in
// laengenausdehnung-aufgaben.js.

import { svgEl, svgText, flaeche, zeige, num, zeichen, eingesetzt, reglerZahl, setzeText, setzeHtml, wahl, mountQuizze, mountUebungsaufgaben } from "./seite.js?v=1";
import { bruch, diagramm, linienzug, punkt } from "./gemeinsam.js?v=1";
import { AUFGABEN } from "./laengenausdehnung-aufgaben.js?v=1";

const ALPHA = { aluminium: ["Aluminium", 0.023], kupfer: ["Kupfer", 0.017], stahl: ["Stahl", 0.012], beton: ["Beton", 0.012], glas: ["Glas", 0.009] };
const MMK = bruch("mm", "m · K");

// Eine Messuhr: Der große Zeiger macht je Millimeter eine Umdrehung (100 Teilstriche zu 0,01 mm),
// der Zähler darunter zählt die ganzen Millimeter.
function messuhr(svg, cx, cy, r, dL) {
  svg.appendChild(svgEl("circle", { cx, cy, r, class: "ta-feld" }));
  for (let i = 0; i < 100; i++) {
    const w = (i / 100) * 2 * Math.PI, lang = i % 10 === 0 ? 8 : 4;
    svg.appendChild(svgEl("line", { x1: (cx + (r - lang) * Math.sin(w)).toFixed(2), y1: (cy - (r - lang) * Math.cos(w)).toFixed(2), x2: (cx + r * Math.sin(w)).toFixed(2), y2: (cy - r * Math.cos(w)).toFixed(2), class: "ta-skala" }));
  }
  const ganz = Math.floor(dL + 1e-9), rest = dL - ganz;
  const w = rest * 2 * Math.PI;
  svg.appendChild(svgEl("line", { x1: cx, y1: cy, x2: (cx + (r - 10) * Math.sin(w)).toFixed(3), y2: (cy - (r - 10) * Math.cos(w)).toFixed(3), class: "ta-mass", "data-rolle": "zeiger" }));
  svg.appendChild(svgEl("circle", { cx, cy, r: 3, class: "ta-umkehr" }));
  // Zähler: ganze Umdrehungen = ganze Millimeter; der Zeiger zeigt den Rest in Hundertsteln.
  svg.appendChild(svgText(cx, cy + r + 16, `Zähler: ${ganz} mm`, { class: "ta-klein", "data-rolle": "zaehler", "data-mm": String(ganz) }));
  svg.appendChild(svgText(cx, cy + r + 32, `abgelesen: ${num(dL, 2)} mm`, { class: "ta-text", "data-rolle": "abgelesen" }));
  svg.appendChild(svgText(cx, cy - r - 6, "1 Teilstrich = 0,01 mm", { class: "ta-klein" }));
}

// ================= 1. Die Messreihe =================

const ALPHA_KUPFER = ALPHA.kupfer[1];
function renderMessung() {
  const dT = reglerZahl("mr-dt");
  setzeText("mr-dt-anzeige", `${num(dT)} K`);
  const dL = ALPHA_KUPFER * 1 * dT;
  const svg = flaeche(600, 300, "Messreihe: Längenänderung eines Kupferrohrs");
  // Aufbau: Rohr links eingespannt, rechts die Messuhr (Rohr nicht maßstäblich).
  svg.appendChild(svgEl("rect", { x: 14, y: 40, width: 12, height: 40, class: "ta-kolben" }));
  svg.appendChild(svgEl("rect", { x: 26, y: 54, width: 150, height: 12, class: "ta-stab neu" }));
  svg.appendChild(svgText(100, 92, "Kupferrohr, L₀ = 1 m", { class: "ta-klein" }));
  svg.appendChild(svgText(100, 108, "(nicht maßstäblich)", { class: "ta-klein" }));
  svg.appendChild(svgEl("line", { x1: 176, x2: 190, y1: 60, y2: 60, class: "ta-achse" }));   // Taster der Messuhr
  messuhr(svg, 230, 60, 40, dL);
  const d = diagramm(svg, { name: "messreihe", x0: 330, y0: 30, b: 250, h: 230, xmin: 0, xmax: 80, ymin: 0, ymax: 1.5, xSchritt: 10, ySchritt: 0.25, xStellen: 0, yStellen: 2, xName: "ΔT in K", yName: "ΔL in mm" });
  // Die Gerade erst, wenn es etwas zu verbinden gibt: Vorher behauptete sie eine Messung, die es nicht gibt.
  if (dT >= 20) linienzug(d, [[0, 0], [dT, ALPHA_KUPFER * dT]], { class: "ta-kurve extra", "data-rolle": "gerade" });
  const sT = [], sL = [], sQ = [];
  for (let t = 0; t <= dT; t += 10) {
    punkt(d, t, ALPHA_KUPFER * t, "ta-punkt", { "data-rolle": "messpunkt" });
    sT.push(`<td>${num(t)}</td>`);
    sL.push(`<td data-rolle="dl-${t}">${num(ALPHA_KUPFER * t, 2)}</td>`);
    sQ.push(`<td>${t === 0 ? "—" : `<span data-rolle="q-${t}">${num(ALPHA_KUPFER, 3)}</span>`}</td>`);
  }
  zeige("mr-mount", svg);
  setzeHtml("mr-bilanz",
    `<table class="ta-tabelle"><tr><th>ΔT in K</th>${sT.join("")}</tr><tr><th>ΔL in mm</th>${sL.join("")}</tr><tr><th>${bruch("ΔL", "ΔT")} in ${bruch("mm", "K")}</th>${sQ.join("")}</tr></table>` +
    `Jetzt: ΔT = ${num(dT)} K, ΔL = <strong data-rolle="dl">${num(dL, 2)}</strong> mm`);
  setzeText("mr-text", dT === 0
    ? "Noch nicht erwärmt: Die Messuhr steht auf null."
    : dT === 10 ? "Ein Messpunkt: Je Kelvin ist das Rohr um 0,017 mm länger geworden. Ob das so bleibt, zeigen weitere Messungen."
    : `Alle Quotienten sind gleich: Je Kelvin wird das Rohr um ${num(ALPHA_KUPFER, 3)} mm länger. Die Punkte liegen auf einer Geraden durch den Ursprung — ΔL ist proportional zu ΔT.`);
}

// ================= 2. Doppelte Länge, doppelte Verlängerung =================

const UEBER_LA = 100;   // jedes Meterstück 100-fach verlängert gezeichnet
function renderLaenge() {
  const L0 = reglerZahl("la-l"), dT = reglerZahl("la-dt");
  setzeText("la-l-anzeige", `${num(L0)} m`);
  setzeText("la-dt-anzeige", `${num(dT)} K`);
  const jeMeter = ALPHA_KUPFER * dT, dL = L0 * jeMeter;
  const svg = flaeche(600, 210, "Ein Stab aus Meterstücken vor und nach dem Erwärmen");
  const x0 = 30, M = 80;   // ein Meter = 80 Bildpunkte
  const M2 = M * (1 + (UEBER_LA * jeMeter) / 1000);
  for (let i = 0; i < L0; i++) {
    svg.appendChild(svgEl("rect", { x: x0 + i * M, y: 30, width: M, height: 22, class: "ta-stab alt", "data-rolle": "stueck-alt" }));
    svg.appendChild(svgEl("rect", { x: (x0 + i * M2).toFixed(3), y: 96, width: M2.toFixed(3), height: 22, class: "ta-stab neu", "data-rolle": "stueck-neu" }));
    svg.appendChild(svgText(x0 + i * M + M / 2, 46, "1 m", { class: "ta-klein" }));
  }
  svg.appendChild(svgText(x0, 22, `vorher: ${num(L0)} Stücke zu 1 m`, { class: "ta-text", "text-anchor": "start" }));
  svg.appendChild(svgText(x0, 88, `nach Erwärmen um ${num(dT)} K: jedes Stück + ${num(jeMeter, 2)} mm`, { class: "ta-text", "text-anchor": "start" }));
  if (dT > 0) {
    svg.appendChild(svgEl("line", { x1: x0 + L0 * M, x2: (x0 + L0 * M2).toFixed(2), y1: 130, y2: 130, class: "ta-mass", "data-rolle": "dl" }));
    svg.appendChild(svgText(x0 + L0 * M, 150, `ΔL = ${num(dL, 2)} mm`, { class: "ta-text", "text-anchor": "start" }));
  }
  svg.appendChild(svgText(x0, 190, `Verlängerungen ${UEBER_LA}-fach vergrößert gezeichnet`, { class: "ta-klein", "text-anchor": "start", "data-rolle": "ueberhoehung" }));
  zeige("la-mount", svg);
  setzeHtml("la-bilanz", `Ein Meter Kupfer: ${num(ALPHA_KUPFER, 3)} mm je K · ${num(dT)} K = <strong data-rolle="je-meter">${num(jeMeter, 2)}</strong> mm<br>` +
    `${num(L0)} Meter: ΔL = ${num(L0)} · ${num(jeMeter, 2)} mm = <strong data-rolle="dl">${num(dL, 2)}</strong> mm`);
  setzeText("la-text", `Jedes der ${num(L0)} Meterstücke wird gleich viel länger. Zusammen ${num(L0)}-mal so viel wie ein Meter: ΔL ist proportional zu L₀.`);
}

// ================= 3. Der Stoff entscheidet =================

function renderAlpha() {
  const L0 = reglerZahl("al-l"), dT = reglerZahl("al-dt");
  setzeText("al-l-anzeige", `${num(L0)} m`);
  setzeText("al-dt-anzeige", `${num(dT)} K`);
  const stoffe = Object.values(ALPHA);
  const werte = stoffe.map(([n, a]) => [n, a, a * L0 * dT]);
  const maxW = Math.max(...werte.map((w) => w[2]), 1e-9);
  const schritt = [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50].find((s) => maxW / s <= 5) || 50;
  const ymax = Math.max(schritt, Math.ceil(maxW / schritt - 1e-9) * schritt);
  const svg = flaeche(600, 290, "Längenänderung von fünf Stoffen");
  const d = diagramm(svg, { name: "balken", x0: 70, y0: 26, b: 500, h: 210, xmin: 0, xmax: 5, ymin: 0, ymax, xSchritt: 1, ohneX: true, ySchritt: schritt, yStellen: schritt < 1 ? 2 : 0, xName: "", yName: "ΔL in mm" });
  werte.forEach(([n, a, w], i) => {
    d.g.appendChild(svgEl("rect", { x: d.X(i + 0.2).toFixed(2), y: d.Y(w).toFixed(3), width: (d.X(0.6) - d.X(0)).toFixed(2), height: (d.Y(0) - d.Y(w)).toFixed(3), class: "ta-stab neu", "data-rolle": "balken", "data-stoff": n }));
    d.g.appendChild(svgText(d.X(i + 0.5), d.Y(0) + 20, n, { class: "ta-klein" }));
  });
  zeige("al-mount", svg);
  setzeHtml("al-bilanz", `ΔL = α · L₀ · ΔT mit α in ${MMK}, L₀ in m, ΔT in K:<br>` + werte.map(([n, a, w]) => `${n}: ${num(a, 3)} · ${num(L0)} · ${num(dT)} ${zeichen(w, 3)} <strong data-rolle="dl-${n}">${num(w, 3)}</strong> mm`).join("<br>"));
  setzeText("al-text", dT === 0 ? "Ohne Erwärmung bleiben alle Stäbe gleich lang." : `Gleiche Länge, gleiche Erwärmung — und doch wird Aluminium mehr als doppelt so viel länger als Glas und fast doppelt so viel wie Stahl. Der Stoff steckt im Faktor α; Stahl und Beton sind gleich auf.`);
}

// ================= 4. Rückwärts =================

// Wer den Quelltext liest, findet die Lösung — auf der Seite ist sie verdeckt, bis gerechnet wurde.
const STAEBE = { A: "aluminium", B: "glas", C: "kupfer" };
const L0_RW = 2;
function renderRueckwaerts() {
  const stab = wahl("rw-stab"), dT = reglerZahl("rw-dt");
  setzeText("rw-dt-anzeige", `${num(dT)} K`);
  const [stoff, a] = ALPHA[STAEBE[stab]];
  const dL = a * L0_RW * dT;
  const svg = flaeche(600, 170, "Unbekannter Stab mit Messuhr");
  svg.appendChild(svgEl("rect", { x: 14, y: 40, width: 12, height: 40, class: "ta-kolben" }));
  svg.appendChild(svgEl("rect", { x: 26, y: 54, width: 300, height: 12, class: "ta-stab alt" }));
  svg.appendChild(svgText(176, 92, `Stab ${stab}, L₀ = 2 m`, { class: "ta-klein" }));
  svg.appendChild(svgEl("line", { x1: 326, x2: 340, y1: 60, y2: 60, class: "ta-achse" }));   // Taster der Messuhr
  messuhr(svg, 380, 60, 40, dL);
  zeige("rw-mount", svg);
  if (dT === 0) {
    setzeHtml("rw-bilanz", "Erst erwärmen: Ohne Temperaturänderung lässt sich α nicht bestimmen (durch 0 kann man nicht teilen).");
    setzeText("rw-text", "Zieh am Regler ΔT.");
    return;
  }
  const alpha = dL / (L0_RW * dT);
  setzeHtml("rw-bilanz",
    `α = ${bruch("ΔL", "L₀ · ΔT")} = ${bruch(num(dL, 3) + " mm", "2 m · " + num(dT) + " K")} ${zeichen(alpha, 3)} <strong data-rolle="alpha">${num(alpha, 3)}</strong> ${MMK} — das ist <strong data-rolle="stoff">${stoff}</strong><br>` +
    `<em>Probe:</em> ${num(alpha, 3)} · 2 · ${num(dT)} = ${num(alpha * L0_RW * dT, 3)} mm ✓`);
  setzeText("rw-text", `In der Tabelle hat ${stoff} α = ${num(a, 3)} mm/(m · K). Stab ${stab} ist aus ${stoff}.`);
}

// ================= 5. Dehnungsfuge =================

const THETA_BAU = 10, THETA_MIN = -20, THETA_MAX = 40;
const PX_JE_MM = 1;     // Ausschnitt an der Fuge: 1 mm = 1 Bildpunkt (bei 200 m Aluminium und −20 °C ist die Fuge 276 mm breit)
function renderFuge() {
  const [stoff, a] = ALPHA[wahl("fu-stoff")];
  const L0 = reglerZahl("fu-l"), theta = reglerZahl("fu-theta");
  setzeText("fu-l-anzeige", `${num(L0)} m`);
  setzeText("fu-theta-anzeige", `${num(theta)} °C`);
  const s0 = a * L0 * (THETA_MAX - THETA_BAU), s = s0 - a * L0 * (theta - THETA_BAU);
  const svg = flaeche(600, 250, "Brücke mit Dehnungsfuge");
  // Oben die ganze Brücke als Übersicht (nicht maßstäblich), unten ein Ausschnitt an der Fuge im Maßstab
  // 1 mm = PX_JE_MM Bildpunkte. Im Ausschnitt reicht die Fahrbahn über den linken Rand hinaus — dass sich ihr
  // Ende bewegt, ist dann richtig zu lesen: Die Brücke wird kürzer oder länger, nicht der Ausschnitt.
  svg.appendChild(svgEl("rect", { x: 20, y: 34, width: 30, height: 36, class: "ta-kolben" }));
  svg.appendChild(svgEl("rect", { x: 50, y: 34, width: 458, height: 8, class: "ta-stab alt" }));
  svg.appendChild(svgEl("rect", { x: 512, y: 34, width: 30, height: 36, class: "ta-kolben" }));
  for (const x of [160, 280, 400]) svg.appendChild(svgEl("rect", { x: x - 4, y: 42, width: 8, height: 28, class: "ta-kolben" }));
  svg.appendChild(svgEl("circle", { cx: 510, cy: 38, r: 14, class: "ta-rahmen" }));
  svg.appendChild(svgText(20, 22, `Brücke aus ${stoff}, ${num(L0)} m lang — Übersicht, nicht maßstäblich`, { class: "ta-klein", "text-anchor": "start" }));
  svg.appendChild(svgText(560, 22, "Ausschnitt unten", { class: "ta-klein", "text-anchor": "end" }));
  const L = 40, R = 580, OBEN = 96, UNTEN = 210;   // Rahmen des Ausschnitts
  const rechts = R - 100;                           // linke Kante des Widerlagers im Ausschnitt
  const ende = rechts - PX_JE_MM * s;               // Ende der Fahrbahn bei ϑ
  svg.appendChild(svgEl("rect", { x: L, y: OBEN, width: R - L, height: UNTEN - OBEN, class: "ta-rahmen" }));
  svg.appendChild(svgEl("rect", { x: L, y: 140, width: (ende - L).toFixed(3), height: 24, class: "ta-stab alt", "data-rolle": "fahrbahn" }));
  svg.appendChild(svgEl("rect", { x: rechts, y: 140, width: R - rechts, height: UNTEN - 140, class: "ta-kolben", "data-rolle": "widerlager" }));
  if (s > 1e-9) svg.appendChild(svgEl("line", { x1: ende.toFixed(3), x2: rechts, y1: 128, y2: 128, class: "ta-mass", "data-rolle": "fuge" }));
  svg.appendChild(svgText(Math.min((ende + rechts) / 2, rechts - 40), 118, `s = ${num(s, 1)} mm`, { class: "ta-text" }));
  // Maßstab des Ausschnitts: eine Strecke von 20 mm.
  svg.appendChild(svgEl("line", { x1: L, x2: L + 20 * PX_JE_MM, y1: 232, y2: 232, class: "ta-mass", "data-rolle": "massstab", "data-mm": "20" }));
  svg.appendChild(svgText(L + 20 * PX_JE_MM + 8, 236, "20 mm — der Ausschnitt ist maßstäblich", { class: "ta-klein", "text-anchor": "start" }));
  zeige("fu-mount", svg);
  setzeHtml("fu-bilanz",
    `${stoff}: beim Bau (10 °C) s₀ = α · L₀ · (40 °C − 10 °C) = ${num(a, 3)} · ${num(L0)} · 30 ${zeichen(s0, 1)} <strong data-rolle="s0">${num(s0, 1)}</strong> mm<br>` +
    `bei ${num(theta)} °C: s = s₀ − α · L₀ · (ϑ − 10 °C) = ${num(s0, 1)} − ${num(a, 3)} · ${num(L0)} · ${eingesetzt(theta - THETA_BAU)} ${zeichen(s, 1)} <strong data-rolle="s">${num(s, 1)}</strong> mm`);
  setzeText("fu-text", theta === THETA_MAX
    ? "Bei 40 °C ist die Fuge geschlossen — gerade eben. Wärmer darf es nicht werden."
    : theta === THETA_BAU
      ? `Bei 10 °C ist die Fuge so breit wie beim Bau: ${num(s0, 1)} mm.`
    : theta < THETA_BAU
      ? `Bei ${num(theta)} °C ist die Brücke kürzer als beim Bau, die Fuge breiter: ${num(s, 1)} mm.`
      : `Bei ${num(theta)} °C ist die Brücke länger als beim Bau, die Fuge schmaler: ${num(s, 1)} mm.`);
}

// ================= 6. Bimetall =================

// Modell: Jeder Streifen hat die Länge, die er allein hätte; beide liegen auf Kreisbögen um denselben
// Mittelpunkt, deren Mittellinien BI_D auseinander liegen. Dann haben beide Bögen denselben Winkel
// θ = (L_Cu − L_St) : BI_D (Bogenmaß), und die Spitze hebt sich um R · (1 − cos θ) mit R = L : θ.
const BI_L = 60, BI_D = 0.5, BI_KONTAKT = 2;   // mm; der Kontakt öffnet, wenn die Spitze 2 mm gestiegen ist
const BI_UEBER = 5;                            // Krümmungswinkel in der Zeichnung 5-fach vergrößert
function bimetall(dT) {
  const lCu = BI_L * (1 + (ALPHA.kupfer[1] * dT) / 1000), lSt = BI_L * (1 + (ALPHA.stahl[1] * dT) / 1000);
  const winkel = (lCu - lSt) / BI_D;
  const lMitte = (lCu + lSt) / 2;
  return { lCu, lSt, winkel, lMitte, hub: hubBei(lMitte, winkel) };
}
const hubBei = (l, w) => (w > 1e-12 ? (l / w) * (1 - Math.cos(w)) : 0);
// Winkel, bei dem die Spitze genau BI_KONTAKT steigt: Bisektion, hubBei wächst mit dem Winkel.
const W_KONTAKT = (() => { let u = 0, o = 1; for (let i = 0; i < 60; i++) { const m = (u + o) / 2; if (hubBei(BI_L, m) < BI_KONTAKT) u = m; else o = m; } return (u + o) / 2; })();

function renderBimetall() {
  const theta = reglerZahl("bm-theta");
  setzeText("bm-theta-anzeige", `${num(theta)} °C`);
  const dT = theta - 20, b = bimetall(dT), offen = b.hub >= BI_KONTAKT;
  const svg = flaeche(600, 250, "Bimetallstreifen aus Kupfer und Stahl");
  const PX = 6, x0 = 70, y0 = 175, DICKE = 6, BODEN = 240;   // 1 mm Länge = 6 Bildpunkte; jeder Streifen 6 Bildpunkte dick gezeichnet
  // Ein Punkt des Streifens in der Zeichnung: u = Anteil der Länge (0 eingespannt, 1 Spitze), w = gezeichneter
  // Winkel, v = Versatz von der Mittellinie in Bildpunkten, positiv zum Krümmungsmittelpunkt (nach oben, Stahlseite).
  const bogenPunkt = (w, u, v) => {
    if (w < 1e-9) return [x0 + PX * BI_L * u, y0 - v];
    const R = (PX * BI_L) / w;
    return [x0 + (R - v) * Math.sin(w * u), y0 - (R - (R - v) * Math.cos(w * u))];
  };
  const w = BI_UEBER * b.winkel;
  const bahn = (v) => Array.from({ length: 61 }, (_, i) => {
    const [x, y] = bogenPunkt(w, i / 60, v);
    return `${i ? "L" : "M"} ${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(" ");
  svg.appendChild(svgEl("rect", { x: x0 - 30, y: y0 - 30, width: 30, height: 50, class: "ta-kolben" }));
  svg.appendChild(svgEl("path", { d: bahn(DICKE / 2), class: "ta-streifen stahl", "stroke-width": DICKE, "data-rolle": "stahl", "data-winkel-px": w.toFixed(6) }));
  svg.appendChild(svgEl("path", { d: bahn(-DICKE / 2), class: "ta-streifen kupfer", "stroke-width": DICKE, "data-rolle": "kupfer" }));
  // Der Gegenkontakt sitzt auf einer Feder: Er folgt der Spitze nach oben, bis er am Anschlag hängen bleibt.
  // Der Anschlag liegt dort, wo die Unterkante der Spitze in der Zeichnung steht, wenn sie in Wirklichkeit
  // 2 mm gestiegen ist — so zeigt das Bild „geschlossen“ nie mit einer Lücke und „offen“ nie ohne.
  const unterkante = (wz) => bogenPunkt(wz, 1, -DICKE);
  const [ax, ay] = unterkante(BI_UEBER * W_KONTAKT);
  const [sx, sy] = unterkante(w);
  const [kx, ky] = offen ? [ax, ay] : [sx, sy];
  svg.appendChild(svgEl("line", { x1: (ax + 10).toFixed(2), x2: (ax + 40).toFixed(2), y1: ay.toFixed(2), y2: ay.toFixed(2), class: "ta-achse", "data-rolle": "anschlag" }));
  svg.appendChild(svgText(ax + 44, ay + 4, "Anschlag", { class: "ta-klein", "text-anchor": "start" }));
  // Feder vom festen Sockel bis unter den Kontakt: Sie wird länger, wenn der Kontakt der Spitze folgt.
  const zacken = Array.from({ length: 7 }, (_, i) => `L ${(kx + (i === 0 || i === 6 ? 0 : i % 2 ? -6 : 6)).toFixed(2)} ${(ky + 10 + ((BODEN - ky - 10) * i) / 6).toFixed(2)}`).join(" ");
  svg.appendChild(svgEl("path", { d: `M ${kx.toFixed(2)} ${(ky + 10).toFixed(2)} ${zacken}`, class: "ta-feder" }));
  svg.appendChild(svgEl("line", { x1: (kx - 14).toFixed(2), x2: (kx + 14).toFixed(2), y1: BODEN, y2: BODEN, class: "ta-achse" }));
  svg.appendChild(svgEl("rect", { x: (kx - 8).toFixed(2), y: ky.toFixed(2), width: 16, height: 10, class: offen ? "ta-kontakt offen" : "ta-kontakt", "data-rolle": "kontakt", "data-offen": String(offen) }));
  svg.appendChild(svgText(580, 22, offen ? "Kontakt offen — Strom aus" : "Kontakt geschlossen — Strom an", { class: offen ? "ta-text ta-warn" : "ta-text", "text-anchor": "end", "data-rolle": "zustand" }));
  svg.appendChild(svgText(x0 - 30, 22, "oben Stahl (blau), unten Kupfer (orange)", { class: "ta-klein", "text-anchor": "start" }));
  svg.appendChild(svgText(x0 - 30, 38, `Krümmung ${BI_UEBER}-fach vergrößert gezeichnet`, { class: "ta-klein", "text-anchor": "start", "data-rolle": "ueberhoehung" }));
  zeige("bm-mount", svg);
  setzeHtml("bm-bilanz",
    `ΔT = ${num(dT)} K: Kupfer <strong data-rolle="l-cu">${num(b.lCu, 4)}</strong> mm, Stahl <strong data-rolle="l-st">${num(b.lSt, 4)}</strong> mm — Unterschied ${num(b.lCu - b.lSt, 4)} mm<br>` +
    `Winkel: ${num(b.lCu - b.lSt, 4)} mm : ${num(BI_D, 1)} mm ${zeichen(b.winkel, 4)} <strong data-rolle="winkel">${num(b.winkel, 4)}</strong> im Bogenmaß ≈ <span data-rolle="grad">${num((b.winkel * 180) / Math.PI, 1)}</span>°<br>` +
    `Die Spitze steigt um ≈ <strong data-rolle="hub">${num(b.hub, 2)}</strong> mm — der Kontakt öffnet bei ${num(BI_KONTAKT)} mm.`);
  setzeText("bm-text", dT === 0
    ? "Bei 20 °C ist der Streifen gerade, der Kontakt geschlossen."
    : `Das Kupfer will um ${num(b.lCu - b.lSt, 4)} mm länger werden als der Stahl. Es liegt außen, auf dem längeren Bogen: Der Streifen krümmt sich zur Stahlseite${offen ? ", die Spitze ist über den Anschlag gestiegen, der Kontakt ist offen." : ", der Kontakt folgt ihm auf seiner Feder und bleibt geschlossen."}`);
}

// ================= 7. Flüssigkeiten: das Thermometer =================

const GAMMA = { ethanol: ["Ethanol", 1.1], benzin: ["Benzin", 1.0], glycerin: ["Glycerin", 0.5], wasser: ["Wasser", 0.21], quecksilber: ["Quecksilber", 0.18] };
function renderFluessig() {
  const [stoff, gamma] = GAMMA[wahl("fl-stoff")];
  const V0 = Math.round(reglerZahl("fl-v") * 10) / 10, A = Math.round(reglerZahl("fl-a") * 100) / 100, dT = reglerZahl("fl-dt");
  setzeText("fl-v-anzeige", `${num(V0, 1)} ml`);
  setzeText("fl-a-anzeige", `${num(A, 2)} mm²`);
  setzeText("fl-dt-anzeige", `${num(dT)} K`);
  const dV = gamma * V0 * dT;       // in mm³: γ in ml/(l·K) · V0 in ml · ΔT in K
  const h = dV / A;                 // in mm
  const svg = flaeche(320, 330, "Flüssigkeitsthermometer");
  // Maßstab: 1 mm Steighöhe = 1 Bildpunkt. Die Skala trägt ihre Werte (data-wert) für die Prüfung.
  const kx = 150, kb = 10, boden = 270, start = 18;          // start: Füllstand vor dem Erwärmen über der Kugel
  const Y = (mm) => boden - start - mm;
  svg.appendChild(svgEl("circle", { cx: kx + kb / 2, cy: boden + 22, r: 26, class: "ta-fluessigkeit" }));
  svg.appendChild(svgEl("circle", { cx: kx + kb / 2, cy: boden + 22, r: 26, class: "ta-glas" }));
  svg.appendChild(svgEl("rect", { x: kx, y: (Y(h)).toFixed(3), width: kb, height: (boden - Y(h)).toFixed(3), class: "ta-fluessigkeit", "data-rolle": "saeule" }));
  svg.appendChild(svgEl("path", { d: `M ${kx} ${boden} L ${kx} ${Y(232)} M ${kx + kb} ${boden} L ${kx + kb} ${Y(232)}`, class: "ta-glas" }));
  svg.appendChild(svgEl("line", { x1: kx - 22, x2: kx + kb + 22, y1: Y(0), y2: Y(0), class: "ta-fluessigkeit alt", "data-rolle": "start" }));
  svg.appendChild(svgText(kx - 26, Y(0) + 4, "vorher", { class: "ta-klein", "text-anchor": "end" }));
  for (let mm = 0; mm <= 230; mm += 10) {
    const lang = mm % 50 === 0;
    svg.appendChild(svgEl("line", { x1: kx + kb + 4, x2: kx + kb + (lang ? 16 : 10), y1: Y(mm), y2: Y(mm), class: "ta-skala", "data-wert": String(mm) }));
    if (lang) svg.appendChild(svgText(kx + kb + 20, Y(mm) + 4, `${mm} mm`, { class: "ta-klein", "text-anchor": "start" }));
  }
  if (h > 0) svg.appendChild(svgText(kx - 10, Y(h) + 4, `+ ${num(h, 1)} mm`, { class: "ta-text", "text-anchor": "end" }));
  zeige("fl-mount", svg);
  setzeHtml("fl-bilanz",
    `${stoff}: γ = ${num(gamma, 2)} ${bruch("ml", "l · K")}<br>` +
    `ΔV = γ · V₀ · ΔT = ${num(gamma, 2)} · ${num(V0, 1)} · ${num(dT)} ${zeichen(dV, 3)} <strong data-rolle="dv">${num(dV, 3)}</strong> mm³<br>` +
    `h = ΔV : A = ${num(dV, 3)} mm³ : ${num(A, 2)} mm² ${zeichen(h, 2)} <strong data-rolle="h">${num(h, 2)}</strong> mm &nbsp; ` +
    `je Kelvin: <strong data-rolle="je-k">${num(gamma * V0 / A, 3)}</strong> mm`);
  setzeText("fl-text", dT === 0
    ? "Ohne Erwärmung bleibt die Säule beim Strich „vorher“."
    : `Das zusätzliche Volumen von ${num(dV, 1)} mm³ passt nur in die Kapillare — dort steigt die Säule um ${num(h, 1)} mm.`);
}


// ================= Kontrollfragen =================

const QUIZZE = {
  "quiz-messung": {
    q: "Bei 20 K Erwärmung wird ein Rohr um 0,34 mm länger. Um wie viel wird es bei 60 K Erwärmung länger?",
    options: ["0,68 mm", "1,02 mm", "0,34 mm", "3,4 mm"],
    correct: 1,
    explain: "ΔL ist proportional zu ΔT: dreifache Erwärmung, dreifache Verlängerung, 3 · 0,34 mm = 1,02 mm. 0,68 mm gehört zu 40 K, der doppelten Erwärmung; 0,34 mm würde bedeuten, dass die Erwärmung keine Rolle spielt.",
  },
  "quiz-laenge": {
    q: "Ein 1 m langer Stab wird beim Erwärmen um 0,6 mm länger. Um wie viel wird ein 4 m langer Stab aus demselben Stoff bei derselben Erwärmung länger?",
    options: ["0,6 mm", "0,15 mm", "2,4 mm", "4,6 mm"],
    correct: 2,
    explain: "Der 4 m lange Stab besteht aus vier Metern, und jeder wird um 0,6 mm länger: 4 · 0,6 mm = 2,4 mm. 0,6 mm hieße, die Länge spielte keine Rolle; 0,15 mm ist geteilt statt malgenommen, 4,6 mm addiert.",
  },
  "quiz-alpha": {
    q: "Eine 50 m lange Aluminiumleitung (α = 0,023 mm/(m · K)) erwärmt sich um 30 K. Um wie viel wird sie länger?",
    options: ["34,5 mm", "0,0345 mm", "34,5 m", "1,15 mm"],
    correct: 0,
    explain: "ΔL = α · L₀ · ΔT = 0,023 mm/(m · K) · 50 m · 30 K = 34,5 mm. 1,15 mm wäre die Verlängerung bei nur 1 K, und 34,5 m hätte die Einheit falsch: Mit α in mm/(m · K) kommt ΔL in Millimetern heraus.",
  },
  "quiz-rueckwaerts": {
    q: "Ein 2 m langer Stab wird bei 50 K Erwärmung um 1,7 mm länger. Woraus ist er?",
    options: ["Aluminium", "Stahl", "Glas", "Kupfer"],
    correct: 3,
    explain: "α = ΔL : (L₀ · ΔT) = 1,7 mm : (2 m · 50 K) = 0,017 mm/(m · K) — das ist Kupfer. Aluminium hätte 0,023, Stahl 0,012, Glas 0,009.",
  },
  "quiz-fuge": {
    q: "Eine 50 m lange Stahlbrücke wird bei 10 °C gebaut und wird im Sommer bis zu 40 °C warm. Wie breit muss die Fuge beim Bau mindestens sein?",
    options: ["24 mm", "18 mm", "36 mm", "6 mm"],
    correct: 1,
    explain: "Bis zum Sommer wird sie um 30 K wärmer: 0,012 mm/(m · K) · 50 m · 30 K = 18 mm. 24 mm entstehen, wenn man 40 °C für ΔT hält; 36 mm gehören zu den 60 K zwischen −20 °C und 40 °C — so viel ändert sich die Fuge übers ganze Jahr, die Verlängerung zählt aber erst ab dem Bau.",
  },
  "quiz-bimetall": {
    q: "Ein Bimetallstreifen aus Aluminium und Stahl wird erwärmt. Wohin krümmt er sich?",
    options: ["Zur Aluminiumseite", "Er bleibt gerade, beide dehnen sich aus", "Zur Stahlseite", "Er wird nur länger, nicht krumm"],
    correct: 2,
    explain: "Aluminium (0,023) will länger werden als Stahl (0,012). Weil beide verbunden sind, liegt das Aluminium außen auf dem längeren Bogen — der Streifen krümmt sich zur Stahlseite.",
  },
  "quiz-volumen": {
    q: "Ein Thermometer bekommt eine Kapillare mit halb so großem Querschnitt. Was geschieht bei derselben Erwärmung?",
    options: ["Die Säule steigt doppelt so hoch", "Die Säule steigt gleich hoch", "Die Säule steigt halb so hoch", "Die Flüssigkeit dehnt sich doppelt so stark aus"],
    correct: 0,
    explain: "Das zusätzliche Volumen ΔV = γ · V₀ · ΔT hängt nicht von der Kapillare ab. Verteilt auf den halben Querschnitt wird die Säule doppelt so hoch: h = ΔV : A. Deshalb sind Thermometerkapillaren so dünn.",
  },
};

// ================= Start =================

const REGLER = [
  [["mr-dt"], renderMessung],
  [["la-l", "la-dt"], renderLaenge],
  [["al-l", "al-dt"], renderAlpha],
  [["rw-stab", "rw-dt"], renderRueckwaerts],
  [["fu-stoff", "fu-l", "fu-theta"], renderFuge],
  [["bm-theta"], renderBimetall],
  [["fl-stoff", "fl-v", "fl-a", "fl-dt"], renderFluessig],
];
for (const [ids, render] of REGLER) {
  ids.forEach((id) => {
    const e = document.getElementById(id);
    e.addEventListener(e.tagName === "SELECT" ? "change" : "input", render);
    if (e.tagName === "SELECT") e.addEventListener("input", render);
  });
  render();
}
mountQuizze(QUIZZE);
mountUebungsaufgaben(document.getElementById("exercises-mount"), AUFGABEN);
