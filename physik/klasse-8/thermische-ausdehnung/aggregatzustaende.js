// Seite 1 „Aggregatzustände“ der Einheit „Thermische Ausdehnung“ (Physik, Klasse 8).
//
// Didaktische Reihenfolge — jeder Abschnitt benutzt nur, was davor steht:
//   1. Teilchenmodell: fest, flüssig, gasförmig, je zwei Temperaturen  (Temperatur in °C)
//   2. Übergänge und Erwärmungskurve von Wasser                         (Energie in kJ, abgelesen)
//   3. Bindungsenergie: Energiemulde, Umkehrpunkte, Mitte wandert       (erklärt 2 und die Ausdehnung)
// Die Übungsaufgaben stehen in aggregatzustaende-aufgaben.js.

import { svgEl, svgText, flaeche, zeige, num, zeichen, reglerZahl, setzeText, setzeHtml, wahl, mountQuizze, mountUebungsaufgaben } from "./seite.js?v=1";
import { T0, vMittel, kelvin, runde, bruch, diagramm, linienzug, kurvePunkte, punkt, zylinder } from "./gemeinsam.js?v=1";
import { AUFGABEN } from "./aggregatzustaende-aufgaben.js?v=1";

// ================= 1. Teilchenmodell =================

const ZUSTAENDE = [
  { key: "fest", name: "fest", stoff: "Eis", temps: [-150, -5] },
  { key: "fluessig", name: "flüssig", stoff: "Wasser", temps: [5, 95] },
  { key: "gas", name: "gasförmig", stoff: "Wasserdampf", temps: [110, 400] },
];
const V_BEZUG = vMittel(20);     // Bezug für die Geschwindigkeit in der Darstellung
const PB = 210, PH = 140;          // Größe eines Feldes
const RADIUS = 8;
// Feste Zufallszahlen: Jede Seite zeigt dieselben Teilchen, die Prüfung kann sie wiederfinden.
function zufall(saat) {
  let s = saat >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
const TEILCHEN = (() => {
  const z = zufall(20250804);
  const fest = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) fest.push({ gx: 30 + 30 * c, gy: 25 + 30 * r, w: 0.22 + 0.08 * z(), ph: 6.283 * z(), dir: 3.1416 * z() });
  const fluessig = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) {
    if ((r * 6 + c) % 7 === 3) continue;   // Lücken: Eine Flüssigkeit ist nicht dicht gepackt wie ein Gitter
    fluessig.push({ x: 22 + 30 * c + (r % 2) * 12 + 6 * (z() - 0.5), y: 22 + 31 * r + 6 * (z() - 0.5), w1: 0.05 + 0.03 * z(), w2: 0.05 + 0.03 * z(), p1: 6.283 * z(), p2: 6.283 * z() });
  }
  const gas = [];
  for (let i = 0; i < 7; i++) {
    const winkel = 6.283 * z(), v = 1.6 + 0.8 * z();
    gas.push({ x: RADIUS + (PB - 2 * RADIUS) * z(), y: RADIUS + (PH - 2 * RADIUS) * z(), vx: v * Math.cos(winkel), vy: v * Math.sin(winkel) });
  }
  return { fest, fluessig, gas };
})();
const A_FEST = 7, R_FLUESSIG = 9;
// Spiegelt eine gerade Bewegung an den Wänden lo und hi (Dreieckswelle).
function spiegel(x, lo, hi) {
  const L = hi - lo, P = 2 * L;
  const u = (((x - lo) % P) + P) % P;
  return lo + (u <= L ? u : P - u);
}
// Lage der Teilchen eines Feldes zur Zeit t. f = Geschwindigkeit relativ zum Bezug.
function lagen(key, f, t) {
  if (key === "fest") {
    // Schwingung um den Gitterplatz entlang einer festen Richtung; die Weite wächst mit f.
    return TEILCHEN.fest.map((q) => { const s = A_FEST * f * Math.sin(q.w * t + q.ph); return { x: q.gx + s * Math.cos(q.dir), y: q.gy + s * Math.sin(q.dir), gx: q.gx, gy: q.gy }; });
  }
  if (key === "fluessig") {
    // Wandern um einen Platz, ohne festes Gitter; die Weite wächst mit f. Bei gleichem Takt heißt
    // f-mal so weit auch f-mal so schnell — zu jedem Zeitpunkt, nicht nur im Mittel.
    return TEILCHEN.fluessig.map((q) => ({ x: q.x + R_FLUESSIG * f * Math.sin(q.w1 * t + q.p1), y: q.y + R_FLUESSIG * f * Math.sin(q.w2 * t + q.p2), gx: q.x, gy: q.y }));
  }
  return TEILCHEN.gas.map((q) => ({ x: spiegel(q.x + q.vx * f * t, RADIUS, PB - RADIUS), y: spiegel(q.y + q.vy * f * t, RADIUS, PH - RADIUS) }));
}

function renderTeilchen() {
  const t = reglerZahl("tc-t");
  setzeText("tc-t-anzeige", num(t));
  const L = 92, GAP = 14, OBEN = 34, ZWISCHEN = 24;
  const svg = flaeche(L + 2 * PB + GAP + 6, OBEN + 3 * PH + 2 * ZWISCHEN + 6, "Teilchen von Eis, Wasser und Wasserdampf bei je zwei Temperaturen");
  svg.appendChild(svgText(L + PB / 2, 16, "kälter", { class: "ta-titel" }));
  svg.appendChild(svgText(L + PB + GAP + PB / 2, 16, "wärmer", { class: "ta-titel" }));
  const zeilen = [];
  ZUSTAENDE.forEach((z, r) => {
    const y0 = OBEN + r * (PH + ZWISCHEN);
    svg.appendChild(svgText(6, y0 + PH / 2 - 4, z.name, { class: "ta-titel", "text-anchor": "start" }));
    svg.appendChild(svgText(6, y0 + PH / 2 + 12, `(${z.stoff})`, { class: "ta-klein", "text-anchor": "start" }));
    const v = z.temps.map(vMittel);
    z.temps.forEach((theta, c) => {
      const x0 = L + c * (PB + GAP), f = v[c] / V_BEZUG;
      const g = svgEl("g", { "data-zustand": z.key, "data-theta": String(theta), transform: `translate(${x0} ${y0})` });
      g.appendChild(svgEl("rect", { x: 0, y: 0, width: PB, height: PH, rx: 6, class: "ta-feld" }));
      lagen(z.key, f, t).forEach((q, i) => {
        if (z.key === "fest") g.appendChild(svgEl("circle", { cx: q.gx, cy: q.gy, r: RADIUS + 1, class: "ta-gitterplatz" }));
        g.appendChild(svgEl("circle", Object.assign({ cx: q.x.toFixed(3), cy: q.y.toFixed(3), r: RADIUS, class: `ta-teilchen ${z.key}`, "data-i": String(i) },
          z.key === "gas" ? {} : { "data-gx": String(q.gx), "data-gy": String(q.gy) })));
      });
      g.appendChild(svgText(PB - 6, PH - 6, `${num(theta)} °C`, { class: "ta-text", "text-anchor": "end" }));
      svg.appendChild(g);
    });
    zeilen.push(`<strong>${z.name} (${z.stoff}):</strong> bei ${num(z.temps[0])} °C im Mittel <span data-rolle="v-${z.key}-0">${num(v[0], 0)}</span> m/s, ` +
      `bei ${num(z.temps[1])} °C <span data-rolle="v-${z.key}-1">${num(v[1], 0)}</span> m/s — also ${zeichen(v[1] / v[0], 2)} <strong data-rolle="faktor-${z.key}">${num(v[1] / v[0], 2)}</strong>-mal so schnell`);
  });
  zeige("tc-mount", svg);
  setzeHtml("tc-bilanz", "Mittlere Geschwindigkeit der Wassermoleküle:<br>" + zeilen.join("<br>") +
    `<br><span class="progress-note">In der Darstellung sind alle Bewegungen gleich stark verlangsamt — die Verhältnisse stimmen.</span>`);
  setzeText("tc-text", "Fest: Die Teilchen schwingen um ihre Gitterplätze (gestrichelt) — wärmer weiter aus. Flüssig: Sie gleiten dicht an dicht umeinander — wärmer weiter und schneller. Gasförmig: Sie fliegen frei und prallen an den Wänden ab — wärmer schneller.");
}

let abspielen = null;
function abspielenUmschalten() {
  const knopf = document.getElementById("tc-play");
  if (abspielen) {
    clearInterval(abspielen);
    abspielen = null;
    knopf.textContent = "▶ Abspielen";
    return;
  }
  knopf.textContent = "⏸ Anhalten";
  abspielen = setInterval(() => {
    const e = document.getElementById("tc-t");
    e.value = String((Number(e.value) + 1) % (Number(e.max) + 1));
    renderTeilchen();
  }, 40);
}

// ================= 2. Übergänge: Erwärmungskurve =================

// Für 1 kg Wasser, Werte in kJ: spezifische Wärmekapazitäten je Kelvin, Schmelz- und Verdampfungswärme.
const C_EIS = 2.1, C_WASSER = 4.19, C_DAMPF = 2.0, Q_SCHMELZ = 334, Q_VERDAMPF = 2256;
const KNICKE = (() => {
  const q1 = C_EIS * 20, q2 = q1 + Q_SCHMELZ, q3 = q2 + C_WASSER * 100, q4 = q3 + Q_VERDAMPF, q5 = q4 + C_DAMPF * 20;
  return [[0, -20], [q1, 0], [q2, 0], [q3, 100], [q4, 100], [q5, 120]];
})();
// Zustand nach der zugeführten Energie Q: Temperatur und Anteile Eis, Wasser, Dampf.
function zustandBei(Q) {
  const [, [q1], [q2], [q3], [q4]] = KNICKE;
  if (Q <= q1) return { theta: -20 + Q / C_EIS, eis: 1, wasser: 0, dampf: 0, phase: "Eis wird erwärmt" };
  if (Q <= q2) { const a = (Q - q1) / Q_SCHMELZ; return { theta: 0, eis: 1 - a, wasser: a, dampf: 0, phase: "Eis schmilzt" }; }
  if (Q <= q3) return { theta: (Q - q2) / C_WASSER, eis: 0, wasser: 1, dampf: 0, phase: "Wasser wird erwärmt" };
  if (Q <= q4) { const a = (Q - q3) / Q_VERDAMPF; return { theta: 100, eis: 0, wasser: 1 - a, dampf: a, phase: "Wasser verdampft" }; }
  return { theta: 100 + (Q - q4) / C_DAMPF, eis: 0, wasser: 0, dampf: 1, phase: "Dampf wird erwärmt" };
}
function renderUebergaenge() {
  const Q = reglerZahl("ue-q");
  setzeText("ue-q-anzeige", `${num(Q)} kJ`);
  const z = zustandBei(Q);
  const svg = flaeche(580, 330, "Erwärmungskurve von 1 kg Wasser");
  const d = diagramm(svg, { name: "kurve", x0: 58, y0: 24, b: 500, h: 210, xmin: 0, xmax: 3200, ymin: -30, ymax: 130, xSchritt: 500, ySchritt: 20, xStellen: 0, yStellen: 0, xName: "zugeführte Energie Q in kJ", yName: "Temperatur ϑ in °C" });
  linienzug(d, KNICKE, { class: "ta-kurve blass", "data-rolle": "ganze-kurve" });
  const weg = KNICKE.filter(([q]) => q < Q).concat([[Q, z.theta]]);
  linienzug(d, weg, { class: "ta-kurve", "data-rolle": "weg" });
  punkt(d, Q, z.theta, "ta-punkt", { "data-rolle": "jetzt" });
  d.g.appendChild(svgText(d.X((KNICKE[1][0] + KNICKE[2][0]) / 2), d.Y(0) - 8, "Schmelzen", { class: "ta-klein" }));
  d.g.appendChild(svgText(d.X((KNICKE[3][0] + KNICKE[4][0]) / 2), d.Y(100) - 8, "Verdampfen (Sieden)", { class: "ta-klein" }));
  // Anteile als Balken unter dem Diagramm.
  const by = 286, bx = 58, bb = 500;
  let x = bx;
  for (const [key, a, name] of [["fest", z.eis, "Eis"], ["fluessig", z.wasser, "Wasser"], ["gas", z.dampf, "Dampf"]]) {
    if (a > 0) svg.appendChild(svgEl("rect", { x: x.toFixed(2), y: by, width: (a * bb).toFixed(3), height: 16, class: `ta-anteil ${key}`, "data-rolle": "anteil", "data-stoff": name }));
    x += a * bb;
  }
  svg.appendChild(svgEl("rect", { x: bx, y: by, width: bb, height: 16, class: "ta-rahmen", "data-rolle": "anteil-rahmen" }));
  svg.appendChild(svgText(bx, by + 34, "Anteile: Eis blau, Wasser türkis, Dampf orange", { class: "ta-klein", "text-anchor": "start" }));
  zeige("ue-mount", svg);
  const pr = (a) => num(a * 100, 1);
  setzeHtml("ue-bilanz",
    `Zugeführt: Q = <strong data-rolle="q">${num(Q)}</strong> kJ — <strong data-rolle="phase">${z.phase}</strong><br>` +
    `Temperatur: ϑ ${zeichen(z.theta, 1)} <strong data-rolle="theta">${num(z.theta, 1)}</strong> °C &nbsp; ` +
    `Eis <span data-rolle="eis">${pr(z.eis)}</span> %, Wasser <span data-rolle="wasser">${pr(z.wasser)}</span> %, Dampf <span data-rolle="dampf">${pr(z.dampf)}</span> %`);
  const plateau = z.phase === "Eis schmilzt" || z.phase === "Wasser verdampft";
  setzeText("ue-text", plateau
    ? `${z.phase}: Die Temperatur bleibt bei ${num(z.theta)} °C, obwohl Energie zugeführt wird — sie löst die Teilchen voneinander.`
    : `${z.phase}: Die zugeführte Energie macht die Teilchen schneller, die Temperatur steigt.`);
}

// ================= 3. Bindungsenergie: die Energiemulde =================

// Energie zweier Teilchen beim Abstand r (in Vielfachen von r0), in Vielfachen der Bindungsenergie:
// tiefster Punkt −1 bei r = 1, für großes r gegen 0. Links steil (Abstoßung), rechts flach (Anziehung).
const MULDE_A = 3;
const mulde = (r) => (1 - Math.exp(-MULDE_A * (r - 1))) ** 2 - 1;
// Umkehrpunkte bei der Energie E = W − 1 (W zugeführt): gerechnet, wo mulde(r) = E.
function umkehrpunkte(W) {
  if (W <= 0) return [1, 1];
  const s = Math.sqrt(W);
  const r1 = 1 - Math.log(1 + s) / MULDE_A;
  const r2 = W < 1 ? 1 - Math.log(1 - s) / MULDE_A : Infinity;
  return [r1, r2];
}
function renderBindung() {
  const W = Math.round(reglerZahl("bi-w") * 100) / 100;
  setzeHtml("bi-w-anzeige", `${num(W, 2)} · E<sub>B</sub>`);
  const E = W - 1;
  const [r1, r2] = umkehrpunkte(W);
  const gebunden = W < 1;
  const svg = flaeche(580, 360, "Energie zweier Teilchen in Abhängigkeit vom Abstand");
  const d = diagramm(svg, { name: "mulde", x0: 58, y0: 24, b: 500, h: 230, xmin: 0, xmax: 3, ymin: -1.2, ymax: 0.6, xSchritt: 0.5, ySchritt: 0.2, xStellen: 1, yStellen: 1, xName: "Abstand r in Vielfachen von r₀", yName: "Energie (Bindungsenergie = 1)" });
  const rStart = 1 - Math.log(1 + Math.sqrt(1.6)) / MULDE_A;   // dort ist die Mulde bei 0,6 — der obere Rand
  linienzug(d, kurvePunkte(mulde, rStart, 3, 200), { class: "ta-kurve", "data-rolle": "mulde" });
  // Bindungsenergie: Tiefe der Mulde, als Pfeil von −1 bis 0.
  d.g.appendChild(svgEl("line", { x1: d.X(2.6), x2: d.X(2.6), y1: d.Y(-1), y2: d.Y(0), class: "ta-pfeil", "data-rolle": "eb" }));
  const eb = svgText(d.X(2.6) + 8, d.Y(-0.5), "E", { class: "ta-text", "text-anchor": "start" });
  const sub = svgEl("tspan", { "baseline-shift": "sub", "font-size": "9" });
  sub.textContent = "B";
  eb.appendChild(sub);
  d.g.appendChild(eb);
  d.g.appendChild(svgEl("line", { x1: d.X(1), x2: d.X(2.6), y1: d.Y(-1), y2: d.Y(-1), class: "ta-ruhe" }));
  d.g.appendChild(svgEl("line", { x1: d.X(1), x2: d.X(1), y1: d.Y(-1.2), y2: d.Y(0.6), class: "ta-ruhe", "data-rolle": "r0" }));
  // Energie des Paars und Umkehrpunkte.
  const rechts = Math.min(r2, 3);
  d.g.appendChild(svgEl("line", { x1: d.X(r1).toFixed(2), x2: d.X(rechts).toFixed(2), y1: d.Y(E).toFixed(2), y2: d.Y(E).toFixed(2), class: "ta-energie", "data-rolle": "energie" }));
  punkt(d, r1, E, "ta-umkehr", { "data-rolle": "umkehr" });
  if (gebunden && r2 <= 3) punkt(d, r2, E, "ta-umkehr", { "data-rolle": "umkehr" });
  const mitte = gebunden ? (r1 + r2) / 2 : null;
  if (gebunden && mitte <= 3) d.g.appendChild(svgEl("line", { x1: d.X(mitte).toFixed(2), x2: d.X(mitte).toFixed(2), y1: d.Y(E).toFixed(2), y2: d.Y(-1.2).toFixed(2), class: "ta-mitte", "data-rolle": "mitte" }));
  // Die beiden Teilchen auf derselben Abstandsachse: A bei r = 0, B an den Umkehrpunkten.
  const ty = 318;
  svg.appendChild(svgEl("circle", { cx: d.X(0), cy: ty, r: 12, class: "ta-teilchen fest" }));
  svg.appendChild(svgText(d.X(0), ty + 4, "A", { class: "ta-text" }));
  const bOrte = gebunden ? [r1, Math.min(r2, 3)] : [r1];
  bOrte.forEach((r) => {
    svg.appendChild(svgEl("circle", { cx: d.X(r).toFixed(2), cy: ty, r: 12, class: "ta-teilchen fluessig", "data-rolle": "b", "data-r": r.toFixed(4) }));
    svg.appendChild(svgText(d.X(r), ty + 4, "B", { class: "ta-text" }));
  });
  if (gebunden && r2 > r1) svg.appendChild(svgEl("line", { x1: d.X(r1).toFixed(2), x2: d.X(Math.min(r2, 3)).toFixed(2), y1: ty - 18, y2: ty - 18, class: "ta-energie" }));
  if (!gebunden) svg.appendChild(svgText(d.X(2.3), ty + 4, "B entfernt sich →", { class: "ta-text" }));
  zeige("bi-mount", svg);
  const r = (x) => num(x, 3);
  setzeHtml("bi-bilanz",
    `zugeführt: W = <strong data-rolle="w">${num(W, 2)}</strong> · E<sub>B</sub> &nbsp; Energie des Paars: E = W − E<sub>B</sub> = <strong data-rolle="e">${num(E, 2)}</strong> · E<sub>B</sub><br>` +
    (W === 0 ? `In Ruhe: B liegt im tiefsten Punkt, r = r₀.` :
      gebunden
        ? `Umkehrpunkte: r₁ ≈ <strong data-rolle="r1">${r(r1)}</strong> · r₀ und r₂ ≈ <strong data-rolle="r2">${r(r2)}</strong> · r₀ &nbsp; ` +
          `Mitte ≈ <strong data-rolle="mitte">${r(mitte)}</strong> · r₀, also <span data-rolle="prozent">${num((mitte - 1) * 100, 1)}</span> % weiter als in Ruhe<br>` +
          `Bis zur Trennung fehlen noch <strong data-rolle="fehlt">${num(1 - W, 2)}</strong> · E<sub>B</sub>.`
        : `Die Energie reicht, die Bindung zu lösen: Teilchen B entfernt sich. Nötig war mindestens die Bindungsenergie E<sub>B</sub>.`));
  setzeText("bi-text", W === 0
    ? "Ohne zugeführte Energie liegt B ruhig im tiefsten Punkt der Mulde."
    : gebunden
      ? `B schwingt zwischen den Umkehrpunkten hin und her. Nach innen kommt es ${r(1 - r1)} · r₀ weit, nach außen ${r(r2 - 1)} · r₀ — die Mitte liegt außerhalb von r₀: Der Abstand wächst.`
      : "Die Energie liegt über der Nulllinie: B kehrt nicht mehr um. So lösen sich beim Verdampfen die Teilchen voneinander.");
}

// ================= Kontrollfragen =================

const QUIZZE = {
  "quiz-teilchen": {
    q: "Ein Eisblock wird von −20 °C auf −5 °C erwärmt. Was ändert sich im Teilchenmodell?",
    options: ["Die Teilchen werden größer", "Die Teilchen verlassen ihre Gitterplätze", "Die Teilchen schwingen heftiger um ihre Plätze", "Die Teilchen bewegen sich langsamer"],
    correct: 2,
    explain: "Das Eis bleibt fest, die Teilchen bleiben auf ihren Gitterplätzen — aber sie schwingen heftiger, weil sie mehr Energie haben. Größer werden die Teilchen nie; ihre Plätze verlassen sie erst beim Schmelzen.",
  },
  "quiz-uebergaenge": {
    q: "Wasser siedet und wird weiter erhitzt. Was geschieht mit seiner Temperatur, solange noch Wasser im Topf ist?",
    options: ["Sie bleibt bei 100 °C", "Sie steigt langsam weiter", "Sie sinkt, weil Dampf entweicht", "Sie springt auf 120 °C"],
    correct: 0,
    explain: "Solange Wasser verdampft, geht die zugeführte Energie in das Lösen der Teilchen voneinander — die Temperatur bleibt bei 100 °C (waagerechtes Stück der Kurve). Erst wenn alles verdampft ist, steigt sie wieder.",
  },
  "quiz-bindung": {
    q: "Warum dehnt sich ein Stoff beim Erwärmen aus?",
    options: ["Die Teilchen werden beim Erwärmen größer", "Die Bindungsenergie wird kleiner", "Es kommen Teilchen hinzu", "Die Teilchen schwingen weiter, nach außen aber weiter als nach innen"],
    correct: 3,
    explain: "Die Energiemulde ist links steil und rechts flach. Mit mehr Energie schwingen die Teilchen weiter — nach außen weiter als nach innen. Die Mitte der Schwingung wandert nach außen, der mittlere Abstand wächst. Die Teilchen selbst und die Bindungsenergie ändern sich nicht.",
  },
};

// ================= Start =================

const REGLER = [
  [["tc-t"], renderTeilchen],
  [["ue-q"], renderUebergaenge],
  [["bi-w"], renderBindung],
];
for (const [ids, render] of REGLER) {
  ids.forEach((id) => {
    const e = document.getElementById(id);
    e.addEventListener(e.tagName === "SELECT" ? "change" : "input", render);
    if (e.tagName === "SELECT") e.addEventListener("input", render);
  });
  render();
}
document.getElementById("tc-play").addEventListener("click", abspielenUmschalten);
mountQuizze(QUIZZE);
mountUebungsaufgaben(document.getElementById("exercises-mount"), AUFGABEN);
