// Seite 3 „Gasgesetze“ der Einheit „Thermische Ausdehnung“ (Physik, Klasse 8).
//
// Didaktische Reihenfolge — jeder Abschnitt benutzt nur, was davor steht:
//   1. Gase bei gleichem Druck: Gay-Lussac, absoluter Nullpunkt, Kelvin (die Kelvin-Skala entsteht hier)
//   2. Gase bei gleicher Temperatur: Boyle-Mariotte                     (p · V = konstant)
//   3. Gase bei gleichem Volumen: Amontons                              (braucht die Kelvin-Skala aus 1)
//   4. Allgemeine Gasgleichung aus 2 und 3 in zwei Schritten
// Die Übungsaufgaben stehen in gasgesetze-aufgaben.js.

import { svgEl, svgText, flaeche, zeige, num, zeichen, reglerZahl, setzeText, setzeHtml, wahl, mountQuizze, mountUebungsaufgaben } from "./seite.js?v=1";
import { T0, vMittel, kelvin, runde, bruch, diagramm, linienzug, kurvePunkte, punkt, zylinder } from "./gemeinsam.js?v=1";
import { AUFGABEN } from "./gasgesetze-aufgaben.js?v=1";

// ================= Gemeinsam für die Gasgesetze =================

const V0_GL = 1.0;   // Liter bei 0 °C (Gay-Lussac)
const P1 = 1.0, V1 = 2.0, THETA1 = 20;    // Boyle-Mariotte und Gasgleichung: Anfangszustand
const PA0 = 1.0, THETA_A0 = 20;            // Amontons: 1,0 bar bei 20 °C

// ================= 6. Gay-Lussac und Kelvin =================

function renderGayLussac() {
  const theta = reglerZahl("gl-theta");
  setzeText("gl-theta-anzeige", `${num(theta)} °C`);
  const T = kelvin(theta), V = (V0_GL * T) / T0;
  const svg = flaeche(600, 330, "Gas bei gleichem Druck: Volumen und Temperatur");
  zylinder(svg, 30, 280, 90, 100 * V, 200, { beschriftung: [`ϑ = ${num(theta)} °C`, `V ≈ ${num(V, 2)} l`] });
  const d = diagramm(svg, { name: "gay-lussac", x0: 200, y0: 24, b: 380, h: 240, xmin: -300, xmax: 200, ymin: 0, ymax: 2, xSchritt: 50, ySchritt: 0.25, xStellen: 0, yStellen: 2, xName: "ϑ in °C", yName: "V in l" });
  const gerade = (t) => (V0_GL * kelvin(t)) / T0;
  linienzug(d, [[-T0, 0], [-100, gerade(-100)]], { class: "ta-kurve extra", "data-rolle": "verlaengert" });
  linienzug(d, [[-100, gerade(-100)], [200, gerade(200)]], { class: "ta-kurve", "data-rolle": "gemessen" });
  punkt(d, -T0, 0, "ta-umkehr", { "data-rolle": "nullpunkt" });
  d.g.appendChild(svgText(d.X(-T0) + 6, d.Y(0) - 10, "−273,15 °C", { class: "ta-klein", "text-anchor": "start" }));
  punkt(d, theta, V, "ta-punkt", { "data-rolle": "jetzt" });
  zeige("gl-mount", svg);
  setzeHtml("gl-bilanz",
    `T = ϑ + 273,15 K = <strong data-rolle="t">${num(T, 2)}</strong> K<br>` +
    `V = 1 l · ${bruch(num(T, 2) + " K", "273,15 K")} ${zeichen(V, 4)} <strong data-rolle="v">${num(V, 4)}</strong> l<br>` +
    `${bruch("V", "T")} = ${bruch(num(V, 4) + " l", num(T, 2) + " K")} ${zeichen(V / T, 6)} <strong data-rolle="v-durch-t">${num(V / T, 6)}</strong> ${bruch("l", "K")} — bei jeder Temperatur gleich`);
  setzeText("gl-text", `Bei ${num(theta)} °C nimmt das Gas ${num(V, 2)} l ein. Je Kelvin ändert sich das Volumen um 1 : 273,15 des Volumens bei 0 °C — bei −273,15 °C wäre es null.`);
}

// ================= 7. Boyle-Mariotte =================

function renderBoyle() {
  const V = Math.round(reglerZahl("bm-v") * 10) / 10;
  setzeText("bm-v-anzeige", `${num(V, 1)} l`);
  const p = (P1 * V1) / V;
  const svg = flaeche(600, 330, "Gas bei gleicher Temperatur: Druck und Volumen");
  zylinder(svg, 30, 280, 90, 50 * V, 210, { beschriftung: [`V = ${num(V, 1)} l`, `p ≈ ${num(p, 2)} bar`] });
  const d = diagramm(svg, { name: "boyle", x0: 200, y0: 24, b: 380, h: 240, xmin: 0, xmax: 4.5, ymin: 0, ymax: 4.5, xSchritt: 0.5, ySchritt: 0.5, xStellen: 1, yStellen: 1, xName: "V in l", yName: "p in bar" });
  // Die Rechtecke unter der Hyperbel: am Anfang gestrichelt, jetzt grün — gleicher Flächeninhalt p · V.
  const rechteck = (v, q, attrs) => d.g.appendChild(svgEl("rect", Object.assign({ x: d.X(0).toFixed(2), y: d.Y(q).toFixed(2), width: (d.X(v) - d.X(0)).toFixed(3), height: (d.Y(0) - d.Y(q)).toFixed(3) }, attrs)));
  rechteck(V1, P1, { class: "ta-flaeche alt", "data-rolle": "rechteck-anfang" });
  rechteck(V, p, { class: "ta-flaeche", "data-rolle": "rechteck" });
  linienzug(d, kurvePunkte((v) => (P1 * V1) / v, (P1 * V1) / 4.5, 4.5, 200), { class: "ta-kurve", "data-rolle": "hyperbel" });
  punkt(d, V1, P1, "ta-punkt anfang", { "data-rolle": "anfang" });
  punkt(d, V, p, "ta-punkt", { "data-rolle": "jetzt" });
  zeige("bm-mount", svg);
  setzeHtml("bm-bilanz",
    `p = ${bruch("p₁ · V₁", "V")} = ${bruch("1,0 bar · 2,0 l", num(V, 1) + " l")} ${zeichen(p, 4)} <strong data-rolle="p">${num(p, 4)}</strong> bar<br>` +
    `p · V = ${num(p, 4)} bar · ${num(V, 1)} l ${zeichen(p * V, 4)} <strong data-rolle="pv">${num(p * V, 4)}</strong> bar · l — so viel wie am Anfang: 1,0 bar · 2,0 l = 2,0 bar · l`);
  setzeText("bm-text", V < V1
    ? `Zusammengedrückt auf ${num(V, 1)} l: Die Teilchen haben weniger Platz und treffen öfter auf die Wände — der Druck steigt auf ${num(p, 2)} bar.`
    : V > V1
      ? `Auseinandergezogen auf ${num(V, 1)} l: Die Teilchen treffen seltener auf die Wände — der Druck sinkt auf ${num(p, 2)} bar.`
      : "Das ist der Anfangszustand: 2,0 l bei 1,0 bar.");
}

// ================= 8. Amontons =================

function renderAmontons() {
  const theta = reglerZahl("am-theta");
  setzeText("am-theta-anzeige", `${num(theta)} °C`);
  const T = kelvin(theta), TA = kelvin(THETA_A0), p = (PA0 * T) / TA;
  const svg = flaeche(600, 330, "Gas bei gleichem Volumen: Druck und Temperatur");
  zylinder(svg, 30, 280, 90, 120, 120, { kolben: false, beschriftung: [`ϑ = ${num(theta)} °C`, `p ≈ ${num(p, 2)} bar`] });
  // Manometer als Säule: 100 Bildpunkte je bar.
  svg.appendChild(svgEl("rect", { x: 140, y: (280 - 100 * p).toFixed(3), width: 14, height: (100 * p).toFixed(3), class: "ta-fluessigkeit", "data-rolle": "manometer", "data-hoehe-px": (100 * p).toFixed(3) }));
  svg.appendChild(svgEl("rect", { x: 140, y: 80, width: 14, height: 200, class: "ta-glas" }));
  const d = diagramm(svg, { name: "amontons", x0: 200, y0: 24, b: 380, h: 240, xmin: 0, xmax: 600, ymin: 0, ymax: 2, xSchritt: 100, ySchritt: 0.25, xStellen: 0, yStellen: 2, xName: "T in K", yName: "p in bar" });
  const gerade = (Tk) => (PA0 * Tk) / TA;
  linienzug(d, [[0, 0], [kelvin(-50), gerade(kelvin(-50))]], { class: "ta-kurve extra", "data-rolle": "verlaengert" });
  linienzug(d, [[kelvin(-50), gerade(kelvin(-50))], [kelvin(250), gerade(kelvin(250))]], { class: "ta-kurve", "data-rolle": "gemessen" });
  punkt(d, 0, 0, "ta-umkehr", { "data-rolle": "nullpunkt" });
  d.g.appendChild(svgText(d.X(0) + 8, d.Y(0) - 10, "0 K", { class: "ta-klein", "text-anchor": "start" }));
  for (const c of [0, 100]) d.g.appendChild(svgText(d.X(kelvin(c)), d.Y(0) - 6, `${c} °C`, { class: "ta-klein" }));
  punkt(d, T, p, "ta-punkt", { "data-rolle": "jetzt" });
  zeige("am-mount", svg);
  setzeHtml("am-bilanz",
    `T = <strong data-rolle="t">${num(T, 2)}</strong> K &nbsp; p = 1,0 bar · ${bruch(num(T, 2) + " K", "293,15 K")} ${zeichen(p, 4)} <strong data-rolle="p">${num(p, 4)}</strong> bar<br>` +
    `${bruch("p", "T")} ${zeichen(p / T, 6)} <strong data-rolle="p-durch-t">${num(p / T, 6)}</strong> ${bruch("bar", "K")} — bei jeder Temperatur gleich`);
  setzeText("am-text", `Bei ${num(theta)} °C herrscht in der Dose ein Druck von ${num(p, 2)} bar. Die Gerade im Diagramm geht durch 0 K, nicht durch 0 °C.`);
}

// ================= 9. Allgemeine Gasgleichung =================

function renderGasgleichung() {
  const V2 = Math.round(reglerZahl("gg-v2") * 10) / 10, theta2 = reglerZahl("gg-theta2"), s = reglerZahl("gg-s");
  setzeText("gg-v2-anzeige", `${num(V2, 1)} l`);
  setzeText("gg-theta2-anzeige", `${num(theta2)} °C`);
  setzeText("gg-s-anzeige", s <= 100 ? `Schritt 1: ${s} %` : `Schritt 2: ${s - 100} %`);
  const T1 = kelvin(THETA1), T2 = kelvin(theta2);
  const pStern = (P1 * V1) / V2, p2 = (pStern * T2) / T1;
  let V, T, p;
  if (s <= 100) { V = V1 + ((V2 - V1) * s) / 100; T = T1; p = (P1 * V1) / V; }
  else { V = V2; T = T1 + ((T2 - T1) * (s - 100)) / 100; p = (pStern * T) / T1; }
  document.querySelectorAll("#gg-schritte li").forEach((li) => li.classList.toggle("aktiv", (li.dataset.schritt === "1") === (s <= 100)));
  const svg = flaeche(600, 340, "Zwei Schritte vom Zustand 1 zum Zustand 2");
  zylinder(svg, 30, 280, 90, 60 * V, 210, { beschriftung: [`ϑ ≈ ${num(T - T0, 1)} °C`, `p ≈ ${num(p, 2)} bar`] });
  const d = diagramm(svg, { name: "gasgleichung", x0: 200, y0: 24, b: 380, h: 240, xmin: 0, xmax: 3.5, ymin: 0, ymax: 3, xSchritt: 0.5, ySchritt: 0.5, xStellen: 1, yStellen: 1, xName: "V in l", yName: "p in bar" });
  // Die beiden Isothermen (gleiche Temperatur) als Hilfslinien.
  linienzug(d, kurvePunkte((v) => (P1 * V1) / v, (P1 * V1) / 3, 3.5, 160), { class: "ta-kurve blass", "data-rolle": "isotherme-1" });
  linienzug(d, kurvePunkte((v) => (P1 * V1 * T2) / (T1 * v), (P1 * V1 * T2) / (T1 * 3), 3.5, 160), { class: "ta-kurve blass", "data-rolle": "isotherme-2" });
  // Die obere Isotherme wird über, die untere unter ihrer Linie beschriftet — sonst lägen die beiden
  // Namen bei nahen Temperaturen übereinander.
  const oben = T2 >= T1;
  d.g.appendChild(svgText(d.X(3.45), d.Y((P1 * V1) / 3.45) + (oben ? 14 : -6), "T₁", { class: "ta-klein", "text-anchor": "end" }));
  d.g.appendChild(svgText(d.X(3.45), d.Y((P1 * V1 * T2) / (T1 * 3.45)) + (oben ? -6 : 14), "T₂", { class: "ta-klein", "text-anchor": "end" }));
  // Der zurückgelegte Weg: erst auf der Isotherme T₁, dann senkrecht bei V₂.
  const vBis = s <= 100 ? V : V2;
  const weg = kurvePunkte((v) => (P1 * V1) / v, V1, vBis, 80);
  if (s > 100) weg.push([V2, p]);
  linienzug(d, weg, { class: "ta-kurve weg", "data-rolle": "weg" });
  punkt(d, V1, P1, "ta-punkt anfang", { "data-rolle": "anfang" });
  if (s >= 100) punkt(d, V2, pStern, "ta-punkt zwischen", { "data-rolle": "zwischen" });
  punkt(d, V, p, "ta-punkt", { "data-rolle": "jetzt" });
  zeige("gg-mount", svg);
  const k1 = (P1 * V1) / T1;
  setzeHtml("gg-bilanz",
    `Zustand 1: p₁ = 1,0 bar, V₁ = 2,0 l, T₁ = 293,15 K &nbsp; ${bruch("p₁ · V₁", "T₁")} ${zeichen(k1, 6)} <strong data-rolle="k1">${num(k1, 6)}</strong> ${bruch("bar · l", "K")}<br>` +
    `Jetzt: p ${zeichen(p, 4)} <strong data-rolle="p">${num(p, 4)}</strong> bar, V = <strong data-rolle="v">${num(V, 2)}</strong> l, T = <strong data-rolle="t">${num(T, 2)}</strong> K &nbsp; ` +
    `${bruch("p · V", "T")} ${zeichen((p * V) / T, 6)} <strong data-rolle="k">${num((p * V) / T, 6)}</strong> ${bruch("bar · l", "K")}<br>` +
    `Zwischenzustand: p* = ${bruch("p₁ · V₁", "V₂")} ${zeichen(pStern, 4)} <strong data-rolle="p-stern">${num(pStern, 4)}</strong> bar &nbsp; ` +
    `Ende: p₂ = p* · ${bruch("T₂", "T₁")} ${zeichen(p2, 4)} <strong data-rolle="p2">${num(p2, 4)}</strong> bar`);
  setzeText("gg-text", s === 0
    ? "Zustand 1. Zieh am Regler „Weg“: Zuerst ändert sich das Volumen bei gleicher Temperatur."
    : s < 100
      ? "Schritt 1: Die Temperatur bleibt T₁ — der Punkt wandert auf der Isotherme T₁ (Boyle-Mariotte), p · V bleibt gleich."
      : s === 100
        ? `Zwischenzustand: V₂ ist erreicht, die Temperatur ist noch T₁; der Druck ist p* ≈ ${num(pStern, 2)} bar.`
        : s < 200
          ? "Schritt 2: Das Volumen bleibt V₂ — der Punkt wandert senkrecht (Amontons), p : T bleibt gleich."
          : `Zustand 2 erreicht: p₂ ≈ ${num(p2, 2)} bar. p · V : T hat sich auf dem ganzen Weg nicht geändert.`);
}

// ================= Kontrollfragen =================

const QUIZZE = {
  "quiz-gay-lussac": {
    q: "Ein Gas hat bei 27 °C ein Volumen von 3,0 l. Wie groß ist es bei 127 °C, wenn der Druck gleich bleibt?",
    options: ["≈ 4,0 l", "≈ 14,1 l", "≈ 3,3 l", "≈ 2,25 l"],
    correct: 0,
    explain: "In Kelvin: T₁ = 300,15 K, T₂ = 400,15 K. V₂ = 3,0 l · 400,15 : 300,15 ≈ 4,0 l. 14,1 l entsteht, wenn man mit Grad Celsius rechnet (127 : 27), 2,25 l, wenn man den Bruch umdreht.",
  },
  "quiz-boyle": {
    q: "In einer Spritze sind 60 ml Luft bei 1,0 bar. Die Öffnung wird zugehalten und der Kolben bis 20 ml gedrückt. Wie groß ist der Druck bei gleicher Temperatur?",
    options: ["≈ 0,33 bar", "1,0 bar", "2,0 bar", "3,0 bar"],
    correct: 3,
    explain: "p₁ · V₁ = p₂ · V₂: 1,0 bar · 60 ml = p₂ · 20 ml, also p₂ = 3,0 bar. Ein Drittel des Volumens, dreimal der Druck. 0,33 bar entsteht, wenn man das Verhältnis umdreht.",
  },
  "quiz-amontons": {
    q: "Ein Autoreifen hat bei 7 °C einen Druck von 2,0 bar. Nach der Fahrt ist er 35 °C warm. Welcher Druck herrscht ungefähr (gleiches Volumen)?",
    options: ["≈ 10 bar", "≈ 2,2 bar", "≈ 1,8 bar", "2,0 bar"],
    correct: 1,
    explain: "T₁ = 280,15 K, T₂ = 308,15 K: p₂ = 2,0 bar · 308,15 : 280,15 ≈ 2,2 bar. 10 bar entsteht mit Grad Celsius (35 : 7 = 5), 1,8 bar mit dem umgedrehten Bruch.",
  },
  "quiz-gasgleichung": {
    q: "Ein Gas wird auf das halbe Volumen zusammengedrückt und dabei von 300 K auf 600 K erwärmt. Wie ändert sich der Druck?",
    options: ["Er bleibt gleich", "Er verdoppelt sich", "Er vervierfacht sich", "Er halbiert sich"],
    correct: 2,
    explain: "p₂ = p₁ · (V₁ : V₂) · (T₂ : T₁) = p₁ · 2 · 2 = 4 · p₁. Das halbe Volumen verdoppelt den Druck (Schritt 1), die doppelte Temperatur verdoppelt ihn noch einmal (Schritt 2).",
  },
};

// ================= Start =================

const REGLER = [
  [["gl-theta"], renderGayLussac],
  [["bm-v"], renderBoyle],
  [["am-theta"], renderAmontons],
  [["gg-v2", "gg-theta2", "gg-s"], renderGasgleichung],
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
