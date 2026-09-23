// Selbstlernpfad "Flächeninhalt und Umfang" (Grundwissen Klasse 5-10).
// Rein clientseitiges Vanilla-JS, ohne Build-Schritt oder externe Bibliotheken.
//
// Durchgehende Farbcodierung: Flächeninhalt blau (die Fläche selbst), Umfang orange (der Rand).
// Die beiden Größen werden erfahrungsgemäß verwechselt — die Farbe hält sie auseinander.
//
// Flächeneinheiten werden über EXPONENTEN gerechnet (Zehnerpotenzen), nicht über wiederholte
// Multiplikation mit 100. Sonst entstünden bei km² ↔ mm² Gleitkommafehler in der 12. Stelle.

"use strict";

import { mountUebungsaufgaben as mountUebungsaufgabenBasis } from "../../../aufgaben.js?v=2";

// ---------- Helfer ----------

const SVG_NS = "http://www.w3.org/2000/svg";
function svgEl(tag, attrs = {}) {
  const e = document.createElementNS(SVG_NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  return e;
}
function svgText(x, y, text, attrs = {}) {
  const t = svgEl("text", Object.assign({ x, y, "text-anchor": "middle" }, attrs));
  t.textContent = text;
  return t;
}
function el(tag, attrs = {}, children = []) {
  const e = document.createElement(tag);
  for (const k in attrs) {
    if (k === "class") e.className = attrs[k];
    else if (k === "html") e.innerHTML = attrs[k];
    else e.setAttribute(k, attrs[k]);
  }
  (Array.isArray(children) ? children : [children]).forEach((c) => {
    if (c == null) return;
    e.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  });
  return e;
}
// Ein Zahlformat je Stellenzahl, einmal angelegt: toLocaleString() baut bei jedem Aufruf ein neues
// Intl.NumberFormat, und das kostet rund 40-mal so viel wie das Formatieren selbst — bei jeder
// Reglerbewegung dutzendfach.
const ZAHLFORMATE = new Map();
function zahlformat(stellen) {
  let f = ZAHLFORMATE.get(stellen);
  if (!f) ZAHLFORMATE.set(stellen, (f = new Intl.NumberFormat("de-DE", { maximumFractionDigits: stellen })));
  return f;
}
function num(x, digits = 4) {
  return zahlformat(digits).format(x);
}
function randInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}
function clampZahl(v, lo, hi) {
  const n = Number(String(v).replace(",", "."));
  if (isNaN(n)) return lo;
  return Math.max(lo, Math.min(hi, n));
}
function clampInt(v, lo, hi) {
  return Math.round(clampZahl(v, lo, hi));
}
function parseFlexibleNumber(raw) {
  if (raw == null) return NaN;
  const s = String(raw).trim().replace(/\s/g, "").replace(/−/g, "-").replace(/\./g, "").replace(",", ".");
  return parseFloat(s);
}
function neueFlaeche(w, h) {
  return svgEl("svg", { viewBox: `0 0 ${w} ${h}`, width: w, height: h, class: "geo-svg", preserveAspectRatio: "xMidYMid meet" });
}

// ---------- Quiz-Komponente ----------

function mountQuiz(container, { q, options, correct, explain }) {
  container.innerHTML = "";
  container.appendChild(el("p", { class: "quiz-q" }, "❓ " + q));
  const optWrap = el("div", { class: "quiz-options" });
  const feedback = el("div", { class: "quiz-feedback" });
  options.forEach((optText, i) => {
    const btn = el("button", { type: "button", class: "quiz-opt" }, optText);
    btn.addEventListener("click", () => {
      [...optWrap.children].forEach((b) => b.classList.remove("correct", "wrong"));
      if (i === correct) {
        btn.classList.add("correct");
        feedback.className = "quiz-feedback ok";
        feedback.textContent = "✓ Richtig! " + (explain || "");
      } else {
        btn.classList.add("wrong");
        [...optWrap.children][correct].classList.add("correct");
        feedback.className = "quiz-feedback err";
        feedback.textContent = "✗ Nicht ganz. " + (explain || "");
      }
    });
    optWrap.appendChild(btn);
  });
  container.appendChild(optWrap);
  container.appendChild(feedback);
}

// Zwei Karten nebeneinander: Fläche blau, Umfang orange.
function groessenKarten(container, flaecheHtml, umfangHtml) {
  container.innerHTML = "";
  container.appendChild(
    el("div", { class: "groessen-karte flaeche", html: `Flächeninhalt A<span class="wert">${flaecheHtml}</span>` })
  );
  container.appendChild(el("div", { class: "groessen-karte umfang", html: `Umfang u<span class="wert">${umfangHtml}</span>` }));
}

// ================= 1. Auslegen mit Einheitsquadraten =================

function renderAuslegen() {
  const a = clampInt(document.getElementById("al-a").value, 1, 10);
  const b = clampInt(document.getElementById("al-b").value, 1, 7);
  const mount = document.getElementById("al-mount");
  mount.innerHTML = "";
  const k = 34; // Kantenlänge eines Einheitsquadrats in px
  const rand = 30;
  const W = a * k + 2 * rand,
    H = b * k + 2 * rand + 16;
  const svg = neueFlaeche(W, H);

  for (let r = 0; r < b; r++) {
    for (let c = 0; c < a; c++) {
      svg.appendChild(svgEl("rect", { x: rand + c * k, y: rand + r * k, width: k, height: k, class: "kachel" }));
      // Die Nummerierung macht das Auslegen zum Zählen — daher stammt die Formel a · b.
      svg.appendChild(
        svgText(rand + c * k + k / 2, rand + r * k + k / 2 + 4, String(r * a + c + 1), { class: "geo-beschriftung", "font-size": 11 })
      );
    }
  }
  // Der Rand ist der Umfang — orange und deutlich dicker gezeichnet
  svg.appendChild(svgEl("rect", { x: rand, y: rand, width: a * k, height: b * k, class: "rand-linie" }));
  svg.appendChild(svgText(rand + (a * k) / 2, rand - 10, `a = ${a} cm`, { class: "mass-text" }));
  svg.appendChild(
    svgText(rand - 14, rand + (b * k) / 2, `b = ${b} cm`, { class: "mass-text", transform: `rotate(-90 ${rand - 14} ${rand + (b * k) / 2})` })
  );
  mount.appendChild(svg);

  document.getElementById("al-text").innerHTML =
    `Die Figur ist mit <strong>${a * b}</strong> Einheitsquadraten ausgelegt — je Reihe ${a}, und davon ${b} Reihen.<br>` +
    `<span class="legende-flaeche">A = ${a} cm · ${b} cm = ${a * b} cm²</span> — abgekürztes Zählen.<br>` +
    `<span class="legende-umfang">u = 2 · (${a} cm + ${b} cm) = ${2 * (a + b)} cm</span> — einmal außen herum (orange).<br>` +
    `<span class="progress-note">Beachte die Einheiten: Der Flächeninhalt steht in cm², der Umfang in cm. Das sind verschiedene Größenarten.</span>`;
}
function initAuslegen() {
  ["al-a", "al-b"].forEach((id) => document.getElementById(id).addEventListener("input", renderAuslegen));
  renderAuslegen();
}

// ================= 2. Rechteck und Quadrat =================

function renderRechteck() {
  const a = clampZahl(document.getElementById("rk-a").value, 1, 20);
  const b = clampZahl(document.getElementById("rk-b").value, 1, 20);
  const A = a * b,
    u = 2 * (a + b);
  const mount = document.getElementById("rk-mount");
  mount.innerHTML = "";
  const skala = 260 / Math.max(a, b, 1);
  const bw = a * skala,
    bh = b * skala;
  const rand = 34;
  const svg = neueFlaeche(bw + 2 * rand, bh + 2 * rand);
  svg.appendChild(svgEl("rect", { x: rand, y: rand, width: bw, height: bh, class: "flaeche-fuellung" }));
  svg.appendChild(svgEl("rect", { x: rand, y: rand, width: bw, height: bh, class: "rand-linie" }));
  svg.appendChild(svgText(rand + bw / 2, rand - 12, `a = ${num(a)} cm`, { class: "mass-text" }));
  svg.appendChild(
    svgText(rand - 16, rand + bh / 2, `b = ${num(b)} cm`, { class: "mass-text", transform: `rotate(-90 ${rand - 16} ${rand + bh / 2})` })
  );
  svg.appendChild(svgText(rand + bw / 2, rand + bh / 2 + 5, `A = ${num(A)} cm²`, { class: "mass-text", fill: "#1d4ed8", "font-size": 14 }));
  mount.appendChild(svg);

  groessenKarten(document.getElementById("rk-werte"), `${num(A)} cm²`, `${num(u)} cm`);

  const istQuadrat = Math.abs(a - b) < 1e-9;
  document.getElementById("rk-text").innerHTML =
    (istQuadrat
      ? `Wegen a = b ist das ein <strong>Quadrat</strong>. Dann gilt A = a² und u = 4 · a:<br>` +
        `<span class="legende-flaeche">A = ${num(a)} cm · ${num(a)} cm = ${num(A)} cm²</span><br>` +
        `<span class="legende-umfang">u = 4 · ${num(a)} cm = ${num(u)} cm</span>`
      : `<span class="legende-flaeche">A = a · b = ${num(a)} cm · ${num(b)} cm = ${num(A)} cm²</span><br>` +
        `<span class="legende-umfang">u = 2 · (a + b) = 2 · (${num(a)} cm + ${num(b)} cm) = ${num(u)} cm</span>`) +
    `<br><span class="progress-note">Das Quadrat ist kein eigener Fall, sondern ein Rechteck mit a = b — die Rechteckformeln gelten weiter.</span>`;
}
function initRechteck() {
  ["rk-a", "rk-b"].forEach((id) => document.getElementById(id).addEventListener("input", renderRechteck));
  renderRechteck();
}

// ================= 3. Gleicher Umfang, verschiedene Fläche =================

function renderIso() {
  const u = clampInt(document.getElementById("iso-u").value, 8, 40);
  const halb = u / 2; // a + b = u/2
  const aRegler = document.getElementById("iso-a");
  // Zulässig sind ganzzahlige a von 1 bis halb−1, damit b ≥ 1 bleibt.
  const maxA = Math.max(1, Math.floor(halb) - 1);
  aRegler.max = String(maxA);
  let a = clampInt(aRegler.value, 1, maxA);
  aRegler.value = String(a);
  const b = halb - a;
  document.getElementById("iso-a-anzeige").textContent = `a = ${num(a)} cm, b = ${num(b)} cm`;

  const A = a * b;
  const mount = document.getElementById("iso-mount");
  mount.innerHTML = "";
  const skala = 260 / Math.max(a, b, 1);
  const rand = 30;
  const svg = neueFlaeche(Math.max(a, b) * skala + 2 * rand, Math.max(a, b) * skala + 2 * rand);
  const bw = a * skala,
    bh = b * skala;
  svg.appendChild(svgEl("rect", { x: rand, y: rand, width: bw, height: bh, class: "flaeche-fuellung" }));
  svg.appendChild(svgEl("rect", { x: rand, y: rand, width: bw, height: bh, class: "rand-linie" }));
  svg.appendChild(svgText(rand + bw / 2, rand + bh / 2 + 5, `${num(A)} cm²`, { class: "mass-text", fill: "#1d4ed8", "font-size": 14 }));
  mount.appendChild(svg);

  groessenKarten(document.getElementById("iso-werte"), `${num(A)} cm²`, `${num(u)} cm <span style="font-size:0.7rem;font-weight:600">(fest)</span>`);

  // Alle ganzzahligen Aufteilungen auflisten — das Maximum liegt beim Quadrat bzw. am nächsten daran.
  const zeilen = [];
  let maxFlaeche = 0;
  for (let x = 1; x <= maxA; x++) {
    const y = halb - x;
    const flaeche = x * y;
    if (flaeche > maxFlaeche) maxFlaeche = flaeche;
    zeilen.push({ a: x, b: y, A: flaeche });
  }
  const tab = el("table", { class: "iso-tabelle" });
  const kopf = el("tr");
  ["a in cm", "b in cm", "u in cm", "A in cm²"].forEach((t) => kopf.appendChild(el("th", {}, t)));
  tab.appendChild(kopf);
  zeilen.forEach((z) => {
    const klassen = [];
    if (z.a === a) klassen.push("aktuell");
    if (Math.abs(z.A - maxFlaeche) < 1e-9) klassen.push("maximum");
    const tr = el("tr", klassen.length ? { class: klassen.join(" ") } : {});
    [num(z.a), num(z.b), num(u), num(z.A)].forEach((v) => tr.appendChild(el("td", {}, v)));
    tab.appendChild(tr);
  });
  const tm = document.getElementById("iso-tabelle");
  tm.innerHTML = "";
  tm.appendChild(tab);

  const beste = zeilen.filter((z) => Math.abs(z.A - maxFlaeche) < 1e-9);
  const kleinste = Math.min(...zeilen.map((z) => z.A));
  document.getElementById("iso-text").innerHTML =
    `Alle Rechtecke in der Tabelle haben denselben Umfang <span class="legende-umfang">u = ${num(u)} cm</span> — ihr Flächeninhalt reicht aber von ` +
    `<strong>${num(kleinste)} cm²</strong> bis <strong>${num(maxFlaeche)} cm²</strong>.<br>` +
    `<span class="progress-note">Am größten wird die Fläche bei ${beste.map((z) => `a = ${num(z.a)} cm, b = ${num(z.b)} cm`).join(" bzw. ")} — also dann, wenn das Rechteck einem <strong>Quadrat</strong> am nächsten kommt. Je länglicher es wird, desto weniger Fläche bleibt bei gleichem Rand.</span>`;
}
function initIso() {
  ["iso-u", "iso-a"].forEach((id) => document.getElementById(id).addEventListener("input", renderIso));
  renderIso();
}

// ================= 4. Flächeneinheiten =================

// Exponent zur Basis 10, bezogen auf m². So bleibt jede Umrechnung exakt.
const FLAECHEN_EINHEITEN = [
  { key: "mm2", label: "mm²", exp: -6 },
  { key: "cm2", label: "cm²", exp: -4 },
  { key: "dm2", label: "dm²", exp: -2 },
  { key: "m2", label: "m²", exp: 0 },
  { key: "a", label: "a", exp: 2 },
  { key: "ha", label: "ha", exp: 4 },
  { key: "km2", label: "km²", exp: 6 },
];

function renderFeBild() {
  const mount = document.getElementById("fe-bild");
  mount.innerHTML = "";
  const k = 26;
  const rand = 34;
  const svg = neueFlaeche(10 * k + 2 * rand + 60, 10 * k + 2 * rand);
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 10; c++) {
      svg.appendChild(svgEl("rect", { x: rand + c * k, y: rand + r * k, width: k, height: k, class: "kachel" }));
    }
  }
  svg.appendChild(svgEl("rect", { x: rand, y: rand, width: 10 * k, height: 10 * k, class: "rand-linie" }));
  svg.appendChild(svgText(rand + 5 * k, rand - 12, "10 mm = 1 cm", { class: "mass-text" }));
  svg.appendChild(
    svgText(rand - 16, rand + 5 * k, "10 mm = 1 cm", { class: "mass-text", transform: `rotate(-90 ${rand - 16} ${rand + 5 * k})` })
  );
  svg.appendChild(svgText(rand + 5 * k, rand + 5 * k + 5, "1 cm² = 100 mm²", { class: "mass-text", fill: "#1d4ed8", "font-size": 15 }));
  mount.appendChild(svg);
}

function renderFeTreppe(vonKey, nachKey) {
  const mount = document.getElementById("fe-treppe");
  mount.innerHTML = "";
  const reihe = el("div", { class: "fe-treppe" });
  FLAECHEN_EINHEITEN.forEach((e, i) => {
    if (i > 0) {
      // Nach rechts (größere Einheit) wird dividiert, nach links (kleinere) multipliziert —
      // dieselbe Logik wie bei den Längen, nur mit dem Faktor 100.
      const faktor = Math.pow(10, e.exp - FLAECHEN_EINHEITEN[i - 1].exp).toLocaleString("de-DE");
      reihe.appendChild(
        el("span", { class: "fe-pfeil" }, [
          el("span", { class: "fe-groesser" }, "— : " + faktor + " →"),
          el("span", { class: "fe-kleiner" }, "← · " + faktor + " —"),
        ])
      );
    }
    reihe.appendChild(el("div", { class: "fe-einheit" + (e.key === vonKey || e.key === nachKey ? " active" : "") }, e.label));
  });
  mount.appendChild(reihe);
  mount.appendChild(
    el("p", { class: "fe-legende" }, [
      el("span", { class: "fe-groesser" }, "nach rechts"),
      " (größere Einheit) ⇒ dividieren · ",
      el("span", { class: "fe-kleiner" }, "nach links"),
      " (kleinere Einheit) ⇒ multiplizieren · jede Stufe ist ",
      el("strong", {}, "100"),
      " groß",
    ])
  );
}

function renderFlaechenEinheiten() {
  const wert = clampZahl(document.getElementById("fe-wert").value, 0, 1e9);
  const vonKey = document.getElementById("fe-von").value;
  const nachKey = document.getElementById("fe-nach").value;
  const von = FLAECHEN_EINHEITEN.find((e) => e.key === vonKey);
  const nach = FLAECHEN_EINHEITEN.find((e) => e.key === nachKey);
  renderFeTreppe(vonKey, nachKey);

  const diff = von.exp - nach.exp; // >0: Zieleinheit ist kleiner ⇒ multiplizieren
  const faktor = Math.pow(10, Math.abs(diff));
  const ergebnis = wert * Math.pow(10, diff);
  const stufen = Math.abs(diff) / 2;

  document.getElementById("fe-text").innerHTML =
    diff === 0
      ? `${num(wert)} ${von.label} = <strong>${num(ergebnis, 10)} ${nach.label}</strong> — dieselbe Einheit, nichts umzurechnen.`
      : `Von ${von.label} nach ${nach.label} sind es <strong>${stufen} Stufe${stufen === 1 ? "" : "n"}</strong> nach ${diff > 0 ? "links" : "rechts"} — jede Stufe ist 100 groß, zusammen also der Faktor ${num(faktor, 10)}.<br>` +
        `${num(wert)} ${von.label} ${diff > 0 ? "·" : ":"} ${num(faktor, 10)} = <strong>${num(ergebnis, 10)} ${nach.label}</strong><br>` +
        `<span class="progress-note">${diff > 0 ? "Die Zieleinheit ist kleiner, also wird die Maßzahl größer." : "Die Zieleinheit ist größer, also wird die Maßzahl kleiner."} Bei Längen wäre der Faktor je Stufe nur ${num(Math.pow(10, stufen))} — bei Flächen ist er quadriert.</span>`;
}

function initFlaechenEinheiten() {
  const vonSel = document.getElementById("fe-von");
  const nachSel = document.getElementById("fe-nach");
  FLAECHEN_EINHEITEN.forEach((e) => {
    vonSel.appendChild(el("option", { value: e.key }, e.label));
    nachSel.appendChild(el("option", { value: e.key }, e.label));
  });
  vonSel.value = "m2";
  nachSel.value = "cm2";
  renderFeBild();
  document.getElementById("fe-wert").addEventListener("input", renderFlaechenEinheiten);
  vonSel.addEventListener("change", renderFlaechenEinheiten);
  nachSel.addEventListener("change", renderFlaechenEinheiten);
  renderFlaechenEinheiten();
}

// ================= 5. Zusammengesetzte Flächen =================

function renderZusammengesetzt() {
  const strategie = document.getElementById("zg-strategie").value;
  const a = clampInt(document.getElementById("zg-a").value, 3, 12);
  const b = clampInt(document.getElementById("zg-b").value, 3, 10);
  const cInput = document.getElementById("zg-c");
  const dInput = document.getElementById("zg-d");
  // c und d sind die Maße des HERAUSGESCHNITTENEN Stücks. Es muss echt kleiner sein als die
  // Gesamtfigur, sonst bleibt keine L-Form übrig.
  cInput.max = String(a - 1);
  dInput.max = String(b - 1);
  const c = clampInt(cInput.value, 1, a - 1);
  const d = clampInt(dInput.value, 1, b - 1);
  cInput.value = String(c);
  dInput.value = String(d);

  const mount = document.getElementById("zg-mount");
  mount.innerHTML = "";
  const k = 280 / Math.max(a, b);
  const rand = 30;
  const svg = neueFlaeche(a * k + 2 * rand, b * k + 2 * rand);
  const x0 = rand,
    y0 = rand;
  // L-Form: aus dem Rechteck a×b ist oben links ein Stück c×d herausgeschnitten
  const lForm = [
    [x0, y0 + d * k],
    [x0 + c * k, y0 + d * k],
    [x0 + c * k, y0],
    [x0 + a * k, y0],
    [x0 + a * k, y0 + b * k],
    [x0, y0 + b * k],
  ];

  if (strategie === "zerlegen") {
    // Teil 1: unterer Streifen über die volle Breite; Teil 2: der Block rechts oben
    svg.appendChild(svgEl("rect", { x: x0, y: y0 + d * k, width: a * k, height: (b - d) * k, class: "teil-a" }));
    svg.appendChild(svgEl("rect", { x: x0 + c * k, y: y0, width: (a - c) * k, height: d * k, class: "teil-b" }));
    svg.appendChild(svgText(x0 + (a * k) / 2, y0 + d * k + ((b - d) * k) / 2 + 5, "①", { class: "teil-label", fill: "#2563eb" }));
    svg.appendChild(svgText(x0 + c * k + ((a - c) * k) / 2, y0 + (d * k) / 2 + 5, "②", { class: "teil-label", fill: "#1a9e7a" }));
  } else {
    svg.appendChild(svgEl("rect", { x: x0, y: y0, width: a * k, height: b * k, class: "teil-a" }));
    svg.appendChild(svgEl("rect", { x: x0, y: y0, width: c * k, height: d * k, class: "teil-weg" }));
    svg.appendChild(svgText(x0 + (c * k) / 2, y0 + (d * k) / 2 + 5, "weg", { class: "teil-label", fill: "#b3261e", "font-size": 12 }));
  }
  // Der Rand der L-Form — er ist in beiden Strategien derselbe
  svg.appendChild(svgEl("polygon", { points: lForm.map((p) => p.map((v) => v.toFixed(1)).join(",")).join(" "), class: "rand-linie" }));
  svg.appendChild(svgText(x0 + (a * k) / 2, y0 + b * k + 18, `Gesamtbreite ${a} cm`, { class: "mass-text" }));
  mount.appendChild(svg);

  const A = a * b - c * d;
  // Umfang: einmal außen herum. Bei einer Eckaussparung sind die beiden neuen Kanten (c und d)
  // zusammen genauso lang wie die weggefallenen Randstücke — der Umfang bleibt deshalb 2·(a+b).
  const u = 2 * (a + b);
  const teilumfaenge = 2 * (a + (b - d)) + 2 * ((a - c) + d);
  groessenKarten(document.getElementById("zg-werte"), `${num(A)} cm²`, `${num(u)} cm`);

  document.getElementById("zg-text").innerHTML =
    (strategie === "zerlegen"
      ? `<strong>Zerlegen:</strong> Die Figur wird in zwei Rechtecke aufgeteilt, deren Flächeninhalte man <strong>addiert</strong>.<br>` +
        `① ${a} cm · ${b - d} cm = ${num(a * (b - d))} cm²<br>` +
        `② ${a - c} cm · ${d} cm = ${num((a - c) * d)} cm²<br>` +
        `<span class="legende-flaeche">A = ${num(a * (b - d))} cm² + ${num((a - c) * d)} cm² = ${num(A)} cm²</span>`
      : `<strong>Ergänzen:</strong> Die Figur wird zum vollen Rechteck ergänzt; das fehlende Stück wird <strong>subtrahiert</strong>.<br>` +
        `großes Rechteck: ${a} cm · ${b} cm = ${num(a * b)} cm²<br>` +
        `fehlendes Stück: ${c} cm · ${d} cm = ${num(c * d)} cm²<br>` +
        `<span class="legende-flaeche">A = ${num(a * b)} cm² − ${num(c * d)} cm² = ${num(A)} cm²</span>`) +
    `<br><span class="progress-note">Beide Strategien liefern <strong>${num(A)} cm²</strong> — probiere die andere aus.</span>` +
    `<br><span class="legende-umfang">u = ${num(u)} cm</span> — genauso groß wie beim umschließenden Rechteck. Das ist kein Zufall: Die beiden Kanten der Aussparung (${c} cm und ${d} cm) sind zusammen genauso lang wie die Randstücke, die sie ersetzen.<br>` +
    `<span class="progress-note">Die Teilumfänge zu addieren ergäbe dagegen ${num(teilumfaenge)} cm — die Schnittkante würde doppelt mitgezählt, obwohl sie gar nicht zum Rand gehört.</span>`;
}
function initZusammengesetzt() {
  ["zg-a", "zg-b", "zg-c", "zg-d"].forEach((id) => document.getElementById(id).addEventListener("input", renderZusammengesetzt));
  document.getElementById("zg-strategie").addEventListener("change", renderZusammengesetzt);
  renderZusammengesetzt();
}

// ================= 8. Gestaffelte Übungsaufgaben =================

// Die Werkbank für die Übungsaufgaben ist für alle Grundwissen-Seiten dieselbe und steht in
// ../../aufgaben.js. Mitgegeben wird nur, wie DIESE Seite eine Eingabe als Zahl liest.
const mountUebungsaufgaben = (container, defs) =>
  mountUebungsaufgabenBasis(container, defs, { parse: parseFlexibleNumber });

// ---------- Aufgaben-Definitionen ----------

// Fehlerhinweise vergleichen die Eingabe mit dem Wert, der bei einem
// bestimmten Fehler herauskäme. Ein Vergleich mit === trifft dabei nicht
// zuverlässig: 18 · 10⁻⁴ ergibt in Gleitkommaarithmetik nicht dieselbe Zahl
// wie die eingetippte 0,0018, und der Hinweis bliebe stumm. Verglichen wird
// deshalb mit einer relativen Schranke.
function trifft(val, soll) {
  return Number.isFinite(val) && Number.isFinite(soll)
    && Math.abs(val - soll) <= 1e-6 * Math.max(1, Math.abs(soll));
}


function generateAufgabe1() {
  const a = randInt(3, 15);
  // Bei (3|6), (4|4) und (6|3) hätten A und u dieselbe Maßzahl — dann könnte man
  // die verwechselte Größe nicht mehr von der richtigen unterscheiden.
  let b = randInt(2, 12);
  if (a * b === 2 * (a + b)) b += 1;
  const A = a * b,
    u = 2 * (a + b);
  const nachFlaeche = Math.random() < 0.5;
  return {
    promptHtml: `Ein Rechteck ist ${a} cm lang und ${b} cm breit. Berechne ${nachFlaeche ? "seinen <strong>Flächeninhalt</strong> in cm²" : "seinen <strong>Umfang</strong> in cm"}.`,
    correct: nachFlaeche ? A : u,
    tolerance: 0.01,
    placeholder: nachFlaeche ? "Flächeninhalt in cm²" : "Umfang in cm",
    hinweis: (raw, val) =>
      trifft(val, (nachFlaeche ? u : A))
        ? nachFlaeche
          ? "Das ist der <strong>Umfang</strong>. Gefragt ist der Flächeninhalt: A = a · b."
          : "Das ist der <strong>Flächeninhalt</strong>. Gefragt ist der Umfang: u = 2 · (a + b)."
        : trifft(val, a + b)
          ? "Du hast nur einmal Länge plus Breite gerechnet. Der Umfang umfasst <strong>alle vier</strong> Seiten."
          : "",
    tipps: [
      nachFlaeche
        ? "Der Flächeninhalt sagt, wie viele Quadratzentimeter in das Rechteck passen."
        : "Der Umfang ist die Länge des Randes — einmal ganz herum.",
      nachFlaeche ? "A = a · b" : "u = 2 · (a + b) — jede Seitenlänge kommt zweimal vor.",
      nachFlaeche ? `Also ${a} · ${b}.` : `Also 2 · (${a} + ${b}).`,
    ],
    musterloesungHtml: nachFlaeche
      ? `<span class="legende-flaeche">A = a · b = ${a} cm · ${b} cm = <strong>${A} cm²</strong></span><br><span class="progress-note">Zum Vergleich: Der Umfang wäre u = 2 · (${a} + ${b}) cm = ${u} cm — eine ganz andere Größe, in cm statt cm².</span>`
      : `<span class="legende-umfang">u = 2 · (a + b) = 2 · (${a} cm + ${b} cm) = 2 · ${a + b} cm = <strong>${u} cm</strong></span><br><span class="progress-note">Zum Vergleich: Der Flächeninhalt wäre A = ${a} · ${b} cm² = ${A} cm².</span>`,
  };
}

function generateAufgabe2() {
  // Umrechnung um genau eine oder zwei Stufen — die Maßzahl bleibt handhabbar.
  const runter = Math.random() < 0.5;
  // Nach unten (zur kleineren Einheit) sind zwei Stufen gut machbar; nach oben
  // bleibt es bei einer Stufe, damit die Ausgangszahl nicht ins Unhandliche wächst.
  const i = randInt(0, FLAECHEN_EINHEITEN.length - 2);
  const stufen = runter ? randInt(1, Math.min(2, FLAECHEN_EINHEITEN.length - 1 - i)) : 1;
  const von = FLAECHEN_EINHEITEN[i + stufen]; // größere Einheit
  const nach = FLAECHEN_EINHEITEN[i]; // kleinere Einheit
  const q = runter ? von : nach;
  const z = runter ? nach : von;
  const diff = q.exp - z.exp;
  const faktor = Math.pow(10, Math.abs(diff));
  // Konstruktiv so wählen, dass das Ergebnis ganzzahlig bleibt: Geht es zur
  // größeren Einheit hinauf (diff < 0), muss die Maßzahl ein Vielfaches des
  // Umrechnungsfaktors sein.
  const wert = runter ? randInt(2, 40) : randInt(2, 40) * faktor;
  const ergebnis = runter ? wert * faktor : wert / faktor;
  return {
    promptHtml: `Rechne um: <strong>${num(wert, 10)} ${q.label}</strong> = ? ${z.label}`,
    correct: ergebnis,
    tolerance: Math.max(1e-9, Math.abs(ergebnis) * 1e-9),
    placeholder: "Maßzahl in " + z.label,
    tipps: [
      "Bei Flächen ist jede Stufe <strong>100</strong> groß, nicht 10 — ein Quadrat wächst in zwei Richtungen.",
      `Zwischen ${q.label} und ${z.label} liegen ${Math.abs(diff) / 2} Stufe${Math.abs(diff) / 2 > 1 ? "n" : ""}, der Faktor ist also ${faktor.toLocaleString("de-DE")}.`,
      runter ? "Zur kleineren Einheit wird multipliziert." : "Zur größeren Einheit wird dividiert.",
    ],
    hinweis: (raw, val) => {
      // Der klassische Fehler: mit dem Längenfaktor 10 statt dem Flächenfaktor 100 rechnen
      const mitLaengenfaktor = wert * Math.pow(10, diff / 2);
      if (trifft(val, mitLaengenfaktor)) {
        return `Du hast mit dem Faktor der <strong>Längen</strong> gerechnet. Bei Flächen ist jede Stufe <strong>100</strong> groß, nicht 10 — denn ein Quadrat wächst in zwei Richtungen.`;
      }
      if (trifft(val, wert * Math.pow(10, -diff))) {
        return "Die Richtung stimmt nicht: Zu einer <strong>kleineren</strong> Einheit wird die Maßzahl größer, zu einer <strong>größeren</strong> kleiner.";
      }
      return "";
    },
    musterloesungHtml:
      `Von ${q.label} nach ${z.label} sind es ${Math.abs(diff) / 2} Stufe${Math.abs(diff) / 2 === 1 ? "" : "n"}, jede Stufe ist 100 groß ⇒ Faktor ${num(faktor, 10)}.<br>` +
      `${num(wert, 10)} ${q.label} ${diff > 0 ? "·" : ":"} ${num(faktor, 10)} = <strong>${num(ergebnis, 10)} ${z.label}</strong><br>` +
      `<span class="progress-note">${diff > 0 ? "Kleinere Einheit ⇒ größere Maßzahl." : "Größere Einheit ⇒ kleinere Maßzahl."}</span>`,
  };
}

function generateAufgabe3() {
  // L-Form: aus einem Rechteck a×b ist an einer Ecke ein Stück c×d herausgeschnitten.
  const a = randInt(5, 14),
    b = randInt(4, 11);
  const c = randInt(1, a - 2); // Breite des Ausschnitts
  const d = randInt(1, b - 2); // Höhe des Ausschnitts
  const A = a * b - c * d;
  return {
    promptHtml:
      `Eine L-förmige Fläche entsteht aus einem Rechteck von <strong>${a} cm × ${b} cm</strong>, aus dem an einer Ecke ein Rechteck von ` +
      `<strong>${c} cm × ${d} cm</strong> herausgeschnitten wurde. Wie groß ist der <strong>Flächeninhalt</strong> der L-Form in cm²?`,
    correct: A,
    tipps: [
      "Zeichne eine Skizze: ein großes Rechteck mit einer fehlenden Ecke.",
      "Rechne die Fläche des ganzen Rechtecks aus — so, als wäre nichts herausgeschnitten.",
      `Davon das herausgeschnittene Stück abziehen: ${a} · ${b} − ${c} · ${d}.`,
    ],
    tolerance: 0.01,
    placeholder: "Flächeninhalt in cm²",
    hinweis: (raw, val) =>
      trifft(val, a * b)
        ? "Das ist die Fläche des <strong>vollen</strong> Rechtecks. Der Ausschnitt muss noch abgezogen werden."
        : trifft(val, c * d)
          ? "Das ist nur die Fläche des <strong>Ausschnitts</strong>. Gefragt ist die Fläche, die übrig bleibt."
          : trifft(val, 2 * (a + b))
            ? "Das ist der <strong>Umfang</strong> des umschließenden Rechtecks. Gefragt ist der Flächeninhalt."
            : "",
    musterloesungHtml:
      `<strong>Ergänzen (subtrahieren):</strong><br>` +
      `großes Rechteck: ${a} cm · ${b} cm = ${a * b} cm²<br>` +
      `Ausschnitt: ${c} cm · ${d} cm = ${c * d} cm²<br>` +
      `<span class="legende-flaeche">A = ${a * b} cm² − ${c * d} cm² = <strong>${A} cm²</strong></span><br>` +
      `<span class="progress-note">Probe durch <strong>Zerlegen</strong>: unterer Streifen ${a} · ${b - d} = ${a * (b - d)} cm², Block oben ${a - c} · ${d} = ${(a - c) * d} cm², zusammen ${a * (b - d) + (a - c) * d} cm². ✓</span>`,
  };
}

function generateAufgabe4() {
  // Sachaufgabe, die Umfang UND Flächeninhalt in einer Aufgabe braucht — und dabei
  // zwei verschiedene Einheiten (m und m²) sauber auseinanderhalten muss.
  const a = randInt(8, 25),
    b = randInt(6, 20);
  // Die beiden Preise müssen verschieden sein — sonst fällt der typische Fehler
  // „Preise vertauscht“ zufällig mit der richtigen Lösung zusammen.
  const preisRasen = randInt(3, 9); // € je Quadratmeter
  const preisZaun = preisRasen + randInt(3, 9); // € je Meter
  const u = 2 * (a + b),
    A = a * b;
  const kostenZaun = u * preisZaun;
  const kostenRasen = A * preisRasen;
  const gesamt = kostenZaun + kostenRasen;
  return {
    promptHtml:
      `Ein rechteckiges Grundstück ist <strong>${a} m</strong> lang und <strong>${b} m</strong> breit. ` +
      `Es soll rundherum eingezäunt (<strong>${preisZaun} € je Meter</strong>) und vollständig mit Rasen belegt werden (<strong>${preisRasen} € je Quadratmeter</strong>). ` +
      `Wie hoch sind die <strong>Gesamtkosten</strong> in Euro?`,
    correct: gesamt,
    tolerance: 0.01,
    placeholder: "Gesamtkosten in €",
    hinweis: (raw, val) => {
      if (trifft(val, kostenZaun)) return "Das sind nur die Kosten für den <strong>Zaun</strong>. Der Rasen kommt noch dazu.";
      if (trifft(val, kostenRasen)) return "Das sind nur die Kosten für den <strong>Rasen</strong>. Der Zaun kommt noch dazu.";
      if (trifft(val, A * preisZaun + u * preisRasen))
        return "Du hast die beiden Preise vertauscht: Der Zaun wird nach dem <strong>Umfang</strong> (in m) berechnet, der Rasen nach dem <strong>Flächeninhalt</strong> (in m²).";
      return "";
    },
    tipps: [
      "Zwei Posten, zwei verschiedene Größen: Der Zaun läuft am Rand entlang, der Rasen bedeckt die Fläche.",
      "„je Meter“ verlangt den Umfang, „je Quadratmeter“ den Flächeninhalt.",
      `Also u = 2 · (${a} + ${b}) für den Zaun und A = ${a} · ${b} für den Rasen — beides mit seinem Preis multiplizieren und addieren.`,
    ],
    musterloesungHtml:
      `① Zaun — dafür braucht man den <span class="legende-umfang">Umfang</span>:<br>` +
      `&nbsp;&nbsp;u = 2 · (${a} m + ${b} m) = ${u} m ⇒ ${u} · ${preisZaun} € = <strong>${num(kostenZaun)} €</strong><br>` +
      `② Rasen — dafür braucht man den <span class="legende-flaeche">Flächeninhalt</span>:<br>` +
      `&nbsp;&nbsp;A = ${a} m · ${b} m = ${A} m² ⇒ ${A} · ${preisRasen} € = <strong>${num(kostenRasen)} €</strong><br>` +
      `③ zusammen: ${num(kostenZaun)} € + ${num(kostenRasen)} € = <strong>${num(gesamt)} €</strong><br>` +
      `<span class="progress-note">Die Einheiten verraten, welche Größe gebraucht wird: „je Meter“ ⇒ Umfang, „je Quadratmeter“ ⇒ Flächeninhalt.</span>`,
  };
}

// Aufgabe 2 — beide Größen desselben Rechtecks in zwei Feldern. Flächeninhalt und Umfang werden
// gern verwechselt; nebeneinander abgefragt fällt der Unterschied nicht mehr unter den Tisch.
function generateAufgabe2b() {
  const a = randInt(3, 18);
  let b = randInt(2, 15);
  // Gleiche Maßzahl für A und u ließe die beiden Felder ununterscheidbar werden.
  if (a * b === 2 * (a + b)) b += 1;
  const A = a * b, u = 2 * (a + b);
  return {
    promptHtml: `Ein Rechteck ist <strong>${a} cm</strong> lang und <strong>${b} cm</strong> breit.`,
    felder: [
      {
        name: "Flächeninhalt", soll: A, einheit: "cm²", toleranz: 0.01,
        hinweis: (roh, val) => (trifft(val, u) ? "Das ist der Umfang. Der Flächeninhalt ist A = a · b." : ""),
      },
      {
        name: "Umfang", soll: u, einheit: "cm", toleranz: 0.01,
        hinweis: (roh, val) =>
          trifft(val, A) ? "Das ist der Flächeninhalt. Der Umfang ist u = 2 · (a + b)."
            : trifft(val, a + b) ? "Jede Seitenlänge kommt zweimal vor." : "",
      },
    ],
    tipps: [
      "Der Flächeninhalt sagt, wie viele Quadratzentimeter hineinpassen; der Umfang, wie lang der Rand ist.",
      `A = a · b = ${a} · ${b}.`,
      `u = 2 · (a + b) = 2 · (${a} + ${b}).`,
    ],
    musterloesungHtml:
      `<span class="legende-flaeche">A = a · b = ${a} cm · ${b} cm = <strong>${A} cm²</strong></span><br>` +
      `<span class="legende-umfang">u = 2 · (a + b) = 2 · ${a + b} cm = <strong>${u} cm</strong></span><br>` +
      `<span class="progress-note">Die Einheiten verraten den Unterschied: cm² für eine Fläche, cm für eine Länge.</span>`,
  };
}

// Aufgabe 4 — die fehlende Seitenlänge aus dem Flächeninhalt. Die Umkehrung zu Aufgabe 1: Aus
// A = a · b wird b = A : a.
function generateAufgabe4b() {
  const a = randInt(3, 16);
  const b = randInt(2, 14);
  const A = a * b;
  const nachUmfang = Math.random() < 0.4;
  return {
    promptHtml:
      `Ein Rechteck hat den Flächeninhalt <strong>${A} cm²</strong>. Eine Seite ist <strong>${a} cm</strong> lang.<br>` +
      (nachUmfang ? `Wie groß ist sein <strong>Umfang</strong>?` : `Wie lang ist die andere Seite?`),
    correct: nachUmfang ? 2 * (a + b) : b,
    tolerance: 0.01,
    placeholder: nachUmfang ? "Umfang in cm" : "Länge in cm",
    hinweis: (raw, val) =>
      trifft(val, A - a)
        ? "Hier wurde subtrahiert. Der Flächeninhalt entsteht durch Multiplizieren — rückwärts wird also dividiert."
        : nachUmfang && trifft(val, b)
          ? "Das ist die zweite Seitenlänge — der Umfang fehlt noch."
          : "",
    tipps: [
      "Aus A = a · b wird rückwärts b = A : a.",
      `Also ${A} : ${a}.`,
      nachUmfang ? "Mit beiden Seitenlängen dann u = 2 · (a + b)." : "Probe: Länge mal Breite muss wieder den Flächeninhalt ergeben.",
    ],
    musterloesungHtml:
      `① Zweite Seite: b = A : a = ${A} cm² : ${a} cm = <strong>${b} cm</strong><br>` +
      (nachUmfang ? `② Umfang: u = 2 · (${a} + ${b}) cm = <strong>${2 * (a + b)} cm</strong><br>` : "") +
      `Probe: ${a} cm · ${b} cm = ${A} cm² ✓`,
  };
}

// Aufgabe 6 — gleicher Umfang, verschiedene Fläche (Abschnitt 3). Zwei Rechtecke mit demselben
// Umfang; gefragt ist der Unterschied der Flächeninhalte — die Aussage des Abschnitts in Zahlen.
function generateAufgabe6() {
  const halbUmfang = randInt(10, 24);
  let a1 = randInt(1, Math.floor(halbUmfang / 2));
  let a2 = randInt(1, Math.floor(halbUmfang / 2));
  if (a1 === a2) a2 = a1 === 1 ? a1 + 1 : a1 - 1;
  const b1 = halbUmfang - a1, b2 = halbUmfang - a2;
  const A1 = a1 * b1, A2 = a2 * b2;
  const groesser = A1 >= A2 ? 1 : 2;
  return {
    promptHtml:
      `Zwei Rechtecke haben denselben Umfang von <strong>${2 * halbUmfang} cm</strong>:<br>` +
      `<div class="formula-block">Rechteck I: ${a1} cm × ${b1} cm &nbsp;&nbsp; Rechteck II: ${a2} cm × ${b2} cm</div>`,
    felder: [
      {
        name: "Flächeninhalt von Rechteck I", soll: A1, einheit: "cm²", toleranz: 0.01,
        hinweis: (roh, val) => (trifft(val, 2 * (a1 + b1)) ? "Das ist der Umfang — er ist bei beiden gleich. Gefragt ist die Fläche." : ""),
      },
      { name: "Flächeninhalt von Rechteck II", soll: A2, einheit: "cm²", toleranz: 0.01 },
      {
        name: "Um wie viel cm² ist die größere Fläche größer?", soll: Math.abs(A1 - A2), einheit: "cm²", toleranz: 0.01,
        hinweis: (roh, val) => (trifft(val, A1 + A2) ? "Gefragt ist der Unterschied, nicht die Summe." : ""),
      },
    ],
    tipps: [
      "Rechne für jedes Rechteck getrennt A = a · b aus.",
      "Der Umfang ist bei beiden gleich — daran ändert sich nichts.",
      "Der Unterschied ist die größere Fläche minus die kleinere.",
    ],
    musterloesungHtml:
      `Rechteck I: A = ${a1} · ${b1} = <strong>${A1} cm²</strong><br>` +
      `Rechteck II: A = ${a2} · ${b2} = <strong>${A2} cm²</strong><br>` +
      `Unterschied: ${Math.max(A1, A2)} − ${Math.min(A1, A2)} = <strong>${Math.abs(A1 - A2)} cm²</strong><br>` +
      `<span class="progress-note">Beide haben den Umfang ${2 * halbUmfang} cm — trotzdem ist Rechteck ${groesser === 1 ? "I" : "II"} größer. ` +
      `Gleicher Umfang bedeutet also nicht gleiche Fläche; am größten wird die Fläche, wenn die Seiten möglichst gleich lang sind.</span>`,
  };
}

// Aufgabe 8 — ein Weg um ein Beet: Fläche und Umfang an zwei ineinanderliegenden Rechtecken.
// Drei Felder, weil die Ringfläche eine Differenz zweier Flächen ist — und genau daran scheitert
// es meistens.
function generateAufgabe8() {
  const a = randInt(6, 20), b = randInt(4, 16);
  const rand = randInt(1, 4);
  const aussenA = a + 2 * rand, aussenB = b + 2 * rand;
  const innen = a * b, aussen = aussenA * aussenB;
  const wegflaeche = aussen - innen;
  return {
    promptHtml:
      `Ein rechteckiges Beet ist <strong>${a} m</strong> lang und <strong>${b} m</strong> breit. ` +
      `Rundherum verläuft ein <strong>${rand} m</strong> breiter Weg.`,
    felder: [
      {
        name: "Fläche des Beets", soll: innen, einheit: "m²", toleranz: 0.01,
        hinweis: (roh, val) => (trifft(val, 2 * (a + b)) ? "Das ist der Umfang des Beets." : ""),
      },
      {
        name: "Fläche von Beet und Weg zusammen", soll: aussen, einheit: "m²", toleranz: 0.01,
        hinweis: (roh, val) => (trifft(val, (a + rand) * (b + rand)) ? `Der Weg liegt auf <em>beiden</em> Seiten — die Länge wächst um 2 · ${rand} m.` : ""),
      },
      {
        name: "Fläche des Weges allein", soll: wegflaeche, einheit: "m²", toleranz: 0.01,
        hinweis: (roh, val) => (trifft(val, aussen) ? "Das ist die Gesamtfläche. Für den Weg allein muss das Beet abgezogen werden." : ""),
      },
    ],
    tipps: [
      "Zeichne eine Skizze: ein kleines Rechteck in einem größeren.",
      `Der Weg liegt auf beiden Seiten — das äußere Rechteck ist also ${a} + 2 · ${rand} lang und ${b} + 2 · ${rand} breit.`,
      "Die Wegfläche ist die große Fläche minus die kleine.",
    ],
    musterloesungHtml:
      `① Beet: A = ${a} m · ${b} m = <strong>${innen} m²</strong><br>` +
      `② Außen: (${a} + 2 · ${rand}) m · (${b} + 2 · ${rand}) m = ${aussenA} m · ${aussenB} m = <strong>${aussen} m²</strong><br>` +
      `③ Weg: ${aussen} m² − ${innen} m² = <strong>${wegflaeche} m²</strong><br>` +
      `<span class="progress-note">Der Weg ist ein Rahmen — seine Fläche lässt sich nicht mit einer einzigen Multiplikation bestimmen.</span>`,
  };
}

function initExercises() {
  mountUebungsaufgaben(document.getElementById("exercises-mount"), [
    { schwierigkeit: "einfach", titel: "Aufgabe 1 — Rechteck: Fläche oder Umfang", generate: generateAufgabe1 },
    { schwierigkeit: "einfach", titel: "Aufgabe 2 — Fläche und Umfang nebeneinander", generate: generateAufgabe2b },
    { schwierigkeit: "mittel", titel: "Aufgabe 3 — Flächeneinheiten umrechnen", generate: generateAufgabe2 },
    { schwierigkeit: "mittel", titel: "Aufgabe 4 — Die fehlende Seitenlänge", generate: generateAufgabe4b },
    { schwierigkeit: "schwierig", titel: "Aufgabe 5 — Zusammengesetzte Fläche", generate: generateAufgabe3 },
    { schwierigkeit: "schwierig", titel: "Aufgabe 6 — Gleicher Umfang, andere Fläche", generate: generateAufgabe6 },
    { schwierigkeit: "komplex", titel: "Aufgabe 7 — Zaun und Rasen", generate: generateAufgabe4 },
    { schwierigkeit: "komplex", titel: "Aufgabe 8 — Ein Weg um das Beet", generate: generateAufgabe8 },
  ]);
}

// ================= Quizze =================

function initQuizzes() {
  mountQuiz(document.getElementById("quiz-auslegen"), {
    q: "In welcher Einheit wird ein Flächeninhalt angegeben?",
    options: ["in cm", "in cm²", "in cm³", "das ist beliebig"],
    correct: 1,
    explain: "Der Flächeninhalt zählt Einheitsquadrate, also cm², m² und so weiter. Der Umfang dagegen ist eine Länge und steht in cm oder m.",
  });
  mountQuiz(document.getElementById("quiz-rechteck"), {
    q: "Ein Quadrat hat die Seitenlänge 5 cm. Wie groß sind Flächeninhalt und Umfang?",
    options: ["A = 20 cm², u = 25 cm", "A = 25 cm², u = 20 cm", "A = 25 cm², u = 25 cm", "A = 10 cm², u = 20 cm"],
    correct: 1,
    explain: "A = a² = 5 · 5 = 25 cm². u = 4 · a = 4 · 5 = 20 cm. Die beiden Zahlen sind leicht zu vertauschen — die Einheit hilft: cm² gehört zur Fläche.",
  });
  mountQuiz(document.getElementById("quiz-vergleich"), {
    q: "Zwei Rechtecke haben denselben Umfang. Was folgt daraus für ihren Flächeninhalt?",
    options: [
      "Er ist ebenfalls gleich",
      "Nichts — er kann sehr verschieden sein; am größten ist er beim quadratischsten Rechteck",
      "Das längere Rechteck hat mehr Fläche",
      "Das lässt sich nur mit dem Satz des Pythagoras entscheiden",
    ],
    correct: 1,
    explain: "Bei u = 24 cm etwa reicht die Fläche von 11 cm² (1 × 11) bis 36 cm² (6 × 6). Umfang und Flächeninhalt sind unabhängige Größen.",
  });
  mountQuiz(document.getElementById("quiz-einheiten"), {
    q: "Wie viele Quadratzentimeter sind 1 dm²?",
    options: ["10 cm²", "100 cm²", "1000 cm²", "10 000 cm²"],
    correct: 1,
    explain: "1 dm = 10 cm, und ein Quadrat mit 10 cm Seitenlänge enthält 10 · 10 = 100 cm². Bei Flächen ist jede Stufe 100 groß, nicht 10.",
  });
  mountQuiz(document.getElementById("quiz-zusammengesetzt"), {
    q: "Eine Figur wird in zwei Rechtecke zerlegt. Was darf man addieren?",
    options: [
      "Die Flächeninhalte und die Umfänge",
      "Nur die Flächeninhalte — der Umfang wird immer außen herum bestimmt",
      "Nur die Umfänge",
      "Weder noch, man muss neu messen",
    ],
    correct: 1,
    explain: "Die Schnittkante gehört bei der zusammengesetzten Figur nicht zum Rand. Deshalb ergäbe die Summe der Teilumfänge einen zu großen Wert.",
  });
}

// ================= Start =================

document.addEventListener("DOMContentLoaded", () => {
  initAuslegen();
  initRechteck();
  initIso();
  initFlaechenEinheiten();
  initZusammengesetzt();
  initExercises();
  initQuizzes();
});
