// Selbstlernpfad "Flächeninhalt und Umfang" (Grundwissen Klasse 5-10).
// Rein clientseitiges Vanilla-JS, ohne Build-Schritt oder externe Bibliotheken.
//
// Durchgehende Farbcodierung: Flächeninhalt blau (die Fläche selbst), Umfang orange (der Rand).
// Die beiden Größen werden erfahrungsgemäß verwechselt — die Farbe hält sie auseinander.
//
// Flächeneinheiten werden über EXPONENTEN gerechnet (Zehnerpotenzen), nicht über wiederholte
// Multiplikation mit 100. Sonst entstünden bei km² ↔ mm² Gleitkommafehler in der 12. Stelle.

"use strict";

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
function num(x, digits = 4) {
  return x.toLocaleString("de-DE", { maximumFractionDigits: digits });
}
function randInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
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

function mountStaffelAufgabe(container, def) {
  const box = el("div", { class: "aufgabe-box" });
  box.appendChild(el("h3", {}, [def.titel, el("span", { class: "schwierigkeit-badge " + def.schwierigkeit }, def.schwierigkeit)]));
  const promptEl = el("div", { class: "aufgabe-prompt" });
  box.appendChild(promptEl);
  const row = el("div", { class: "exercise-input-row" });
  const input = el("input", { type: "text", placeholder: "Antwort" });
  const btnPruefen = el("button", { type: "button", class: "btn btn-primary" }, "Prüfen");
  const btnWuerfeln = el("button", { type: "button", class: "btn" }, "🎲 Neue Zahlen");
  row.appendChild(input);
  row.appendChild(btnPruefen);
  row.appendChild(btnWuerfeln);
  box.appendChild(row);
  const feedback = el("div", { class: "aufgabe-feedback" });
  box.appendChild(feedback);

  let current;
  function neueAufgabe() {
    current = def.generate();
    promptEl.innerHTML = current.promptHtml;
    input.value = "";
    input.placeholder = current.placeholder || "Antwort";
    feedback.innerHTML = "";
  }
  btnPruefen.addEventListener("click", () => {
    const raw = input.value.trim();
    const val = parseFlexibleNumber(raw);
    const tol = current.tolerance ?? 0.01;
    const ok = !isNaN(val) && Math.abs(val - current.correct) < tol;
    const hinweis = !ok && current.hinweis ? current.hinweis(raw, val) : "";
    feedback.innerHTML =
      (ok
        ? `<div class="status ok">✓ Richtig!</div>`
        : `<div class="status err">✗ Noch nicht richtig${raw ? " — deine Eingabe: " + raw : " — du hast noch keine Antwort eingetragen"}.</div>` +
          (hinweis ? `<div style="margin-bottom:0.3rem">${hinweis}</div>` : "")) +
      `<div class="musterloesung"><span class="ml-label">Musterlösung</span>${current.musterloesungHtml}</div>`;
  });
  btnWuerfeln.addEventListener("click", neueAufgabe);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") btnPruefen.click();
  });

  neueAufgabe();
  container.appendChild(box);
}

function mountUebungsaufgaben(container, defs) {
  mountStaffelAufgabe(container, defs[0]);
  const tabBar = el("div", { class: "schwierigkeit-tabs" });
  const panel = el("div", { class: "schwierigkeit-tab-panel" });
  container.appendChild(tabBar);
  container.appendChild(panel);
  const rest = defs.slice(1);
  function showTab(idx) {
    [...tabBar.children].forEach((b, i) => b.classList.toggle("active", i === idx));
    panel.innerHTML = "";
    mountStaffelAufgabe(panel, rest[idx]);
  }
  rest.forEach((d, i) => {
    const label = d.schwierigkeit.charAt(0).toUpperCase() + d.schwierigkeit.slice(1);
    const btn = el("button", { type: "button" }, label);
    btn.addEventListener("click", () => showTab(i));
    tabBar.appendChild(btn);
  });
  showTab(0);
}

// ---------- Aufgaben-Definitionen ----------

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
      val === (nachFlaeche ? u : A)
        ? nachFlaeche
          ? "Das ist der <strong>Umfang</strong>. Gefragt ist der Flächeninhalt: A = a · b."
          : "Das ist der <strong>Flächeninhalt</strong>. Gefragt ist der Umfang: u = 2 · (a + b)."
        : val === a + b
          ? "Du hast nur einmal Länge plus Breite gerechnet. Der Umfang umfasst <strong>alle vier</strong> Seiten."
          : "",
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
    hinweis: (raw, val) => {
      // Der klassische Fehler: mit dem Längenfaktor 10 statt dem Flächenfaktor 100 rechnen
      const mitLaengenfaktor = wert * Math.pow(10, diff / 2);
      if (val === mitLaengenfaktor) {
        return `Du hast mit dem Faktor der <strong>Längen</strong> gerechnet. Bei Flächen ist jede Stufe <strong>100</strong> groß, nicht 10 — denn ein Quadrat wächst in zwei Richtungen.`;
      }
      if (val === wert * Math.pow(10, -diff)) {
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
    tolerance: 0.01,
    placeholder: "Flächeninhalt in cm²",
    hinweis: (raw, val) =>
      val === a * b
        ? "Das ist die Fläche des <strong>vollen</strong> Rechtecks. Der Ausschnitt muss noch abgezogen werden."
        : val === c * d
          ? "Das ist nur die Fläche des <strong>Ausschnitts</strong>. Gefragt ist die Fläche, die übrig bleibt."
          : val === 2 * (a + b)
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
      if (val === kostenZaun) return "Das sind nur die Kosten für den <strong>Zaun</strong>. Der Rasen kommt noch dazu.";
      if (val === kostenRasen) return "Das sind nur die Kosten für den <strong>Rasen</strong>. Der Zaun kommt noch dazu.";
      if (val === A * preisZaun + u * preisRasen)
        return "Du hast die beiden Preise vertauscht: Der Zaun wird nach dem <strong>Umfang</strong> (in m) berechnet, der Rasen nach dem <strong>Flächeninhalt</strong> (in m²).";
      return "";
    },
    musterloesungHtml:
      `① Zaun — dafür braucht man den <span class="legende-umfang">Umfang</span>:<br>` +
      `&nbsp;&nbsp;u = 2 · (${a} m + ${b} m) = ${u} m ⇒ ${u} · ${preisZaun} € = <strong>${num(kostenZaun)} €</strong><br>` +
      `② Rasen — dafür braucht man den <span class="legende-flaeche">Flächeninhalt</span>:<br>` +
      `&nbsp;&nbsp;A = ${a} m · ${b} m = ${A} m² ⇒ ${A} · ${preisRasen} € = <strong>${num(kostenRasen)} €</strong><br>` +
      `③ zusammen: ${num(kostenZaun)} € + ${num(kostenRasen)} € = <strong>${num(gesamt)} €</strong><br>` +
      `<span class="progress-note">Die Einheiten verraten, welche Größe gebraucht wird: „je Meter“ ⇒ Umfang, „je Quadratmeter“ ⇒ Flächeninhalt.</span>`,
  };
}

function initExercises() {
  mountUebungsaufgaben(document.getElementById("exercises-mount"), [
    { schwierigkeit: "einfach", titel: "Aufgabe 1 — Rechteck: Fläche oder Umfang", generate: generateAufgabe1 },
    { schwierigkeit: "mittel", titel: "Aufgabe 2 — Flächeneinheiten umrechnen", generate: generateAufgabe2 },
    { schwierigkeit: "schwierig", titel: "Aufgabe 3 — Zusammengesetzte Fläche", generate: generateAufgabe3 },
    { schwierigkeit: "komplex", titel: "Aufgabe 4 — Zaun und Rasen", generate: generateAufgabe4 },
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
