// Selbstlernpfad "Volumen und Oberflächeninhalt" (Grundwissen Klasse 5-10).
// Rein clientseitiges Vanilla-JS, ohne Build-Schritt oder externe Bibliotheken.
//
// Durchgehende Farbcodierung: Volumen grün, Oberflächeninhalt blau, Kantenlänge orange.
// Oberfläche und Kante behalten damit genau die Farben, die sie in Thema 2 als
// Flächeninhalt und Umfang schon hatten — die Reihe bleibt optisch konsistent.
//
// Raumeinheiten werden über EXPONENTEN gerechnet (Zehnerpotenzen), nicht über wiederholte
// Multiplikation mit 1000. Sonst entstünden bei mm³ ↔ m³ Gleitkommafehler in der 12. Stelle.

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

// ---------- Schrägbild ----------
//
// Kabinettprojektion: x nach rechts, z nach oben, die Tiefe y schräg nach hinten
// rechts oben und verkürzt. Damit sieht man von jedem Quader genau drei Flächen —
// vorn, oben und rechts — und die Zeichnung bleibt trotzdem lesbar.

const TIEFE_X = 0.45; // waagerechter Anteil einer Tiefeneinheit
const TIEFE_Y = 0.32; // senkrechter Anteil einer Tiefeneinheit

function projektor(skala, ox, oy) {
  return (x, y, z) => ({
    X: ox + x * skala + y * skala * TIEFE_X,
    Y: oy - z * skala - y * skala * TIEFE_Y,
  });
}

// Ausdehnung des projizierten Bildes eines Quaders a × b × c, damit die
// Zeichenfläche passend gewählt und der Ursprung gesetzt werden kann.
function schraegMasse(a, b, c, skala) {
  return {
    breite: (a + b * TIEFE_X) * skala,
    hoehe: (c + b * TIEFE_Y) * skala,
    // Der Ursprung (0|0|0) liegt links unten vorn.
    ox: 0,
    oy: (c + b * TIEFE_Y) * skala,
  };
}

function polygon(p, punkte, klasse) {
  const d = punkte.map(([x, y, z]) => { const q = p(x, y, z); return `${q.X.toFixed(2)},${q.Y.toFixed(2)}`; }).join(" ");
  return svgEl("polygon", { points: d, class: klasse });
}

// Die drei vom Betrachter aus sichtbaren Flächen eines achsenparallelen Quaders,
// der bei (x0|y0|z0) beginnt und die Kantenlängen a, b, c hat.
function quaderFlaechen(gruppe, p, x0, y0, z0, a, b, c, klassen) {
  const k = klassen || { oben: "koerper-oben", vorn: "koerper-vorn", rechts: "koerper-rechts" };
  gruppe.appendChild(polygon(p, [[x0, y0, z0 + c], [x0 + a, y0, z0 + c], [x0 + a, y0 + b, z0 + c], [x0, y0 + b, z0 + c]], k.oben));
  gruppe.appendChild(polygon(p, [[x0, y0, z0], [x0 + a, y0, z0], [x0 + a, y0, z0 + c], [x0, y0, z0 + c]], k.vorn));
  gruppe.appendChild(polygon(p, [[x0 + a, y0, z0], [x0 + a, y0 + b, z0], [x0 + a, y0 + b, z0 + c], [x0 + a, y0, z0 + c]], k.rechts));
}

// Malerreihenfolge: Je größer dieser Wert, desto weiter hinten liegt der Würfel.
// Der Betrachter steht vorn (kleines y), rechts (großes x) und oben (großes z).
function tiefenschluessel(x, y, z) {
  return y - x - z;
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

// Drei Karten nebeneinander: Volumen grün, Oberfläche blau, Kantensumme orange.
function groessenKarten(container, volumenHtml, oberflaecheHtml, kantenHtml) {
  container.innerHTML = "";
  container.appendChild(el("div", { class: "groessen-karte volumen", html: `Volumen V<span class="wert">${volumenHtml}</span>` }));
  container.appendChild(el("div", { class: "groessen-karte flaeche", html: `Oberflächeninhalt O<span class="wert">${oberflaecheHtml}</span>` }));
  if (kantenHtml != null) {
    container.appendChild(el("div", { class: "groessen-karte umfang", html: `Kantensumme k<span class="wert">${kantenHtml}</span>` }));
  }
}

// ================= 1. Ausfüllen mit Einheitswürfeln =================

function renderAusfuellen() {
  const a = clampInt(document.getElementById("af-a").value, 1, 6);
  const b = clampInt(document.getElementById("af-b").value, 1, 5);
  const c = clampInt(document.getElementById("af-c").value, 1, 5);
  const mount = document.getElementById("af-mount");
  mount.innerHTML = "";

  const skala = 34;
  const m = schraegMasse(a, b, c, skala);
  const rand = 26;
  const svg = neueFlaeche(m.breite + 2 * rand, m.hoehe + 2 * rand);
  const p = projektor(skala, rand + m.ox, rand + m.oy);

  // Jeder Einheitswürfel wird einzeln gezeichnet — so ist das Zählen wirklich zu sehen.
  // Die Reihenfolge sorgt dafür, dass vordere Würfel hintere überdecken.
  const wuerfel = [];
  for (let x = 0; x < a; x++) for (let y = 0; y < b; y++) for (let z = 0; z < c; z++) wuerfel.push([x, y, z]);
  wuerfel.sort((u, v) => tiefenschluessel(v[0], v[1], v[2]) - tiefenschluessel(u[0], u[1], u[2]));
  const g = svgEl("g");
  for (const [x, y, z] of wuerfel) {
    quaderFlaechen(g, p, x, y, z, 1, 1, 1, { oben: "wuerfel-oben", vorn: "wuerfel-vorn", rechts: "wuerfel-rechts" });
  }
  svg.appendChild(g);
  mount.appendChild(svg);

  const V = a * b * c;
  document.getElementById("af-text").innerHTML =
    `Der Körper ist mit <strong>${V}</strong> Einheitswürfeln lückenlos ausgefüllt.<br>` +
    `Gezählt wird schichtweise: Eine Schicht enthält ${a} · ${b} = <strong>${a * b}</strong> Würfel, und es liegen <strong>${c}</strong> Schichten übereinander.<br>` +
    `<span class="legende-volumen">V = ${a} · ${b} · ${c} = ${V} cm³</span><br>` +
    `<span class="progress-note">Die unterste Schicht ist die Grundfläche G = ${a * b} cm² — deshalb schreibt man auch V = G · h = ${a * b} · ${c} = ${V} cm³.</span>`;
}

function initAusfuellen() {
  ["af-a", "af-b", "af-c"].forEach((id) => document.getElementById(id).addEventListener("input", renderAusfuellen));
  renderAusfuellen();
}

// ================= 2. Quader und Würfel =================

function renderQuader() {
  const a = clampZahl(document.getElementById("qd-a").value, 1, 20);
  const b = clampZahl(document.getElementById("qd-b").value, 1, 20);
  const c = clampZahl(document.getElementById("qd-c").value, 1, 20);
  const mount = document.getElementById("qd-mount");
  mount.innerHTML = "";

  const skala = Math.min(30, 300 / Math.max(a + b * TIEFE_X, 1));
  const m = schraegMasse(a, b, c, skala);
  const rand = 34;
  const svg = neueFlaeche(m.breite + 2 * rand, m.hoehe + 2 * rand);
  const p = projektor(skala, rand + m.ox, rand + m.oy);

  // Verdeckte Kanten gestrichelt: Die hintere untere Ecke (0|b|0) gehört zum Quader,
  // ist aber vom Betrachter aus nicht zu sehen.
  const hinten = p(0, b, 0);
  [[0, 0, 0], [a, b, 0], [0, b, c]].forEach(([x, y, z]) => {
    const q = p(x, y, z);
    svg.appendChild(svgEl("line", { x1: hinten.X, y1: hinten.Y, x2: q.X, y2: q.Y, class: "koerper-kante-verdeckt" }));
  });
  quaderFlaechen(svg, p, 0, 0, 0, a, b, c);

  // Kantenbeschriftung an je einer Kante jeder Richtung
  const beschriftung = (x1, y1, z1, x2, y2, z2, text, dx, dy) => {
    const q1 = p(x1, y1, z1), q2 = p(x2, y2, z2);
    svg.appendChild(svgText((q1.X + q2.X) / 2 + dx, (q1.Y + q2.Y) / 2 + dy, text, { class: "geo-mass-text" }));
  };
  beschriftung(0, 0, 0, a, 0, 0, `a = ${num(a)} cm`, 0, 18);
  beschriftung(0, 0, 0, 0, 0, c, `c = ${num(c)} cm`, -30, 4);
  beschriftung(a, 0, 0, a, b, 0, `b = ${num(b)} cm`, 22, 16);
  mount.appendChild(svg);

  const V = a * b * c;
  const O = 2 * (a * b + a * c + b * c);
  const k = 4 * (a + b + c);
  groessenKarten(
    document.getElementById("qd-werte"),
    `${num(V)} cm³`,
    `${num(O)} cm²`,
    `${num(k)} cm`
  );

  const istWuerfel = a === b && b === c;
  document.getElementById("qd-text").innerHTML =
    `<span class="legende-volumen">V = a · b · c = ${num(a)} · ${num(b)} · ${num(c)} = ${num(V)} cm³</span><br>` +
    `<span class="legende-flaeche">O = 2 · (a·b + a·c + b·c) = 2 · (${num(a * b)} + ${num(a * c)} + ${num(b * c)}) = 2 · ${num(a * b + a * c + b * c)} = ${num(O)} cm²</span><br>` +
    `<span class="legende-umfang">k = 4 · (a + b + c) = 4 · ${num(a + b + c)} = ${num(k)} cm</span><br>` +
    (istWuerfel
      ? `<span class="progress-note">Hier ist a = b = c — der Quader ist ein <strong>Würfel</strong>. Dann verkürzen sich die Formeln zu V = a³ = ${num(a)}³ und O = 6 · a² = 6 · ${num(a * a)}.</span>`
      : `<span class="progress-note">Drei Zahlen, drei Einheiten: ${num(k)} <strong>cm</strong>, ${num(O)} <strong>cm²</strong>, ${num(V)} <strong>cm³</strong>. Die Einheit sagt, welche der drei Größen gemeint ist.</span>`);
}

function initQuader() {
  ["qd-a", "qd-b", "qd-c"].forEach((id) => document.getElementById(id).addEventListener("input", renderQuader));
  renderQuader();
}

// ================= 3. Das Netz =================

// Kreuznetz des Quaders: oben der Deckel, darunter das Band aus den vier Seitenflächen
// (vorn, rechts, hinten, links), darunter der Boden.
function netzTeile(a, b, c) {
  return [
    { x: 0, y: 0, w: a, h: b, klasse: "paar-ab", name: "Deckel", flaeche: a * b, formel: `a · b = ${a} · ${b}` },
    { x: 0, y: b, w: a, h: c, klasse: "paar-ac", name: "vorn", flaeche: a * c, formel: `a · c = ${a} · ${c}` },
    { x: a, y: b, w: b, h: c, klasse: "paar-bc", name: "rechts", flaeche: b * c, formel: `b · c = ${b} · ${c}` },
    { x: a + b, y: b, w: a, h: c, klasse: "paar-ac", name: "hinten", flaeche: a * c, formel: `a · c = ${a} · ${c}` },
    { x: 2 * a + b, y: b, w: b, h: c, klasse: "paar-bc", name: "links", flaeche: b * c, formel: `b · c = ${b} · ${c}` },
    { x: 0, y: b + c, w: a, h: b, klasse: "paar-ab", name: "Boden", flaeche: a * b, formel: `a · b = ${a} · ${b}` },
  ];
}

function renderNetz() {
  const a = clampInt(document.getElementById("nz-a").value, 1, 9);
  const b = clampInt(document.getElementById("nz-b").value, 1, 9);
  const c = clampInt(document.getElementById("nz-c").value, 1, 9);
  const mount = document.getElementById("nz-mount");
  mount.innerHTML = "";

  const teile = netzTeile(a, b, c);
  const breiteCm = 2 * a + 2 * b;
  const hoeheCm = 2 * b + c;
  const skala = Math.min(26, 420 / breiteCm, 260 / hoeheCm);
  const rand = 14;
  const svg = neueFlaeche(breiteCm * skala + 2 * rand, hoeheCm * skala + 2 * rand);
  for (const t of teile) {
    svg.appendChild(
      svgEl("rect", {
        x: rand + t.x * skala, y: rand + t.y * skala,
        width: t.w * skala, height: t.h * skala,
        class: "netz-flaeche " + t.klasse,
      })
    );
    svg.appendChild(
      svgText(rand + (t.x + t.w / 2) * skala, rand + (t.y + t.h / 2) * skala + 4, String(t.flaeche), { class: "netz-text" })
    );
  }
  mount.appendChild(svg);

  const O = 2 * (a * b + a * c + b * c);
  document.getElementById("nz-text").innerHTML =
    `Das Netz besteht aus sechs Rechtecken — aber nur aus <strong>drei verschiedenen</strong>, jedes davon zweimal:<br>` +
    `&nbsp;&nbsp;Deckel und Boden: 2 · (${a} · ${b}) = 2 · ${a * b} = <strong>${2 * a * b} cm²</strong><br>` +
    `&nbsp;&nbsp;vorn und hinten: 2 · (${a} · ${c}) = 2 · ${a * c} = <strong>${2 * a * c} cm²</strong><br>` +
    `&nbsp;&nbsp;rechts und links: 2 · (${b} · ${c}) = 2 · ${b * c} = <strong>${2 * b * c} cm²</strong><br>` +
    `<span class="legende-flaeche">O = 2 · (${a * b} + ${a * c} + ${b * c}) = ${O} cm²</span><br>` +
    `<span class="progress-note">Die Zahlen in den Rechtecken sind ihre Flächeninhalte in cm². Zusammengezählt ergeben sie ${O} — genau die Oberfläche.</span>`;
}

function initNetz() {
  ["nz-a", "nz-b", "nz-c"].forEach((id) => document.getElementById(id).addEventListener("input", renderNetz));
  renderNetz();
}

// ================= 4. Gleiches Volumen, verschiedene Oberfläche =================

const VERGLEICH_VOLUMEN = [24, 27, 36, 48, 64, 72, 96, 120];

// Alle Quader mit ganzzahligen Kanten a ≤ b ≤ c und a · b · c = V.
function quaderZuVolumen(V) {
  const liste = [];
  for (let a = 1; a * a * a <= V; a++) {
    if (V % a !== 0) continue;
    const rest = V / a;
    for (let b = a; b * b <= rest; b++) {
      if (rest % b !== 0) continue;
      const c = rest / b;
      liste.push({ a, b, c, O: 2 * (a * b + a * c + b * c) });
    }
  }
  liste.sort((u, v) => u.O - v.O);
  return liste;
}

function renderVolumenVergleich() {
  const V = Number(document.getElementById("vv-v").value);
  const liste = quaderZuVolumen(V);
  const minO = liste[0].O;
  const maxO = liste[liste.length - 1].O;

  const tab = el("table", { class: "iso-tabelle" });
  const kopf = el("tr");
  ["a", "b", "c", "V = a·b·c", "O = 2·(ab+ac+bc)"].forEach((h) => kopf.appendChild(el("th", {}, h)));
  tab.appendChild(kopf);
  for (const q of liste) {
    const tr = el("tr", { class: q.O === minO ? "bestwert" : "" });
    [q.a + " cm", q.b + " cm", q.c + " cm", V + " cm³", q.O + " cm²"].forEach((t) => tr.appendChild(el("td", {}, t)));
    tab.appendChild(tr);
  }
  const wrap = document.getElementById("vv-tabelle");
  wrap.innerHTML = "";
  wrap.appendChild(tab);

  // Der sparsamste und der verschwenderischste Quader nebeneinander
  const mount = document.getElementById("vv-mount");
  mount.innerHTML = "";
  const sparsam = liste[0];
  const lang = liste[liste.length - 1];
  const skala = 13;
  const rand = 20;
  const abstand = 40;
  const m1 = schraegMasse(sparsam.a, sparsam.b, sparsam.c, skala);
  const m2 = schraegMasse(lang.a, lang.b, lang.c, skala);
  const hoehe = Math.max(m1.hoehe, m2.hoehe) + 2 * rand + 18;
  const svg = neueFlaeche(m1.breite + m2.breite + abstand + 2 * rand, hoehe);
  const p1 = projektor(skala, rand, hoehe - rand - 18);
  quaderFlaechen(svg, p1, 0, 0, 0, sparsam.a, sparsam.b, sparsam.c);
  svg.appendChild(svgText(rand + m1.breite / 2, hoehe - 4, `${sparsam.a}×${sparsam.b}×${sparsam.c} → O = ${sparsam.O} cm²`, { class: "geo-mass-text" }));
  const p2 = projektor(skala, rand + m1.breite + abstand, hoehe - rand - 18);
  quaderFlaechen(svg, p2, 0, 0, 0, lang.a, lang.b, lang.c);
  svg.appendChild(svgText(rand + m1.breite + abstand + m2.breite / 2, hoehe - 4, `${lang.a}×${lang.b}×${lang.c} → O = ${lang.O} cm²`, { class: "geo-mass-text" }));
  mount.appendChild(svg);

  const istWuerfel = sparsam.a === sparsam.b && sparsam.b === sparsam.c;
  document.getElementById("vv-text").innerHTML =
    `Alle ${liste.length} Quader haben dasselbe Volumen <span class="legende-volumen">V = ${V} cm³</span>, ` +
    `aber Oberflächen von <span class="legende-flaeche">${minO} cm²</span> bis <span class="legende-flaeche">${maxO} cm²</span> — ` +
    `das ist mehr als das ${num(Math.floor((maxO / minO) * 10) / 10, 1)}-Fache.<br>` +
    `Am sparsamsten ist ${sparsam.a} × ${sparsam.b} × ${sparsam.c} cm${istWuerfel ? " — ein <strong>Würfel</strong>" : " — der Quader, der einem Würfel am nächsten kommt"}.<br>` +
    `<span class="progress-note">Je länglicher der Quader, desto größer die Oberfläche bei gleichem Volumen. Genau wie in der Ebene das Quadrat unter allen Rechtecken mit festem Umfang die größte Fläche hatte, hat hier der Würfel unter allen Quadern mit festem Volumen die kleinste Oberfläche.</span>`;
}

function initVolumenVergleich() {
  const sel = document.getElementById("vv-v");
  VERGLEICH_VOLUMEN.forEach((v) => sel.appendChild(el("option", { value: String(v) }, String(v))));
  sel.value = "24";
  sel.addEventListener("change", renderVolumenVergleich);
  renderVolumenVergleich();
}

// ================= 5. Raumeinheiten und Hohlmaße =================

// Exponenten zur Basis 10, bezogen auf m³. Eine Stufe ist 1000 = 10³ groß.
const RAUM_EINHEITEN = [
  { key: "mm3", label: "mm³", exp: -9 },
  { key: "cm3", label: "cm³", exp: -6 },
  { key: "dm3", label: "dm³", exp: -3 },
  { key: "m3", label: "m³", exp: 0 },
];

// Hohlmaße sind keine eigenen Größen, sondern andere Namen für dieselben Volumen.
const HOHLMASSE = [
  { label: "ml (Milliliter)", exp: -6, gleich: "1 cm³" },
  { label: "l (Liter)", exp: -3, gleich: "1 dm³" },
  { label: "hl (Hektoliter)", exp: -1, gleich: "100 l" },
];

function renderReBild() {
  const mount = document.getElementById("re-bild");
  mount.innerHTML = "";
  // Der Kubikzentimeter selbst, mit 10 × 10 Millimeterquadraten auf jeder sichtbaren Fläche.
  const n = 10;
  const skala = 17;
  const m = schraegMasse(n, n, n, skala);
  const rand = 22;
  const beschriftungshoehe = 26; // Platz für die Bildunterschrift unter dem Würfel
  const svg = neueFlaeche(m.breite + 2 * rand, m.hoehe + 2 * rand + beschriftungshoehe);
  const p = projektor(skala, rand, rand + m.oy);
  quaderFlaechen(svg, p, 0, 0, 0, n, n, n);
  // Raster auf den drei sichtbaren Flächen
  const linie = (x1, y1, z1, x2, y2, z2) => {
    const q1 = p(x1, y1, z1), q2 = p(x2, y2, z2);
    svg.appendChild(svgEl("line", { x1: q1.X, y1: q1.Y, x2: q2.X, y2: q2.Y, stroke: "#157347", "stroke-width": 0.5, opacity: 0.6 }));
  };
  for (let i = 1; i < n; i++) {
    linie(i, 0, 0, i, 0, n); linie(0, 0, i, n, 0, i); // vorn
    linie(i, 0, n, i, n, n); linie(0, i, n, n, i, n); // oben
    linie(n, i, 0, n, i, n); linie(n, 0, i, n, n, i); // rechts
  }
  svg.appendChild(svgText(rand + m.breite / 2, rand + m.oy + beschriftungshoehe - 4, "1 cm³ = 10 · 10 · 10 mm³ = 1000 mm³", { class: "geo-mass-text" }));
  mount.appendChild(svg);
}

function renderReTreppe(vonKey, nachKey) {
  const wrap = document.getElementById("re-treppe");
  wrap.innerHTML = "";
  const treppe = el("div", { class: "re-treppe" });
  RAUM_EINHEITEN.forEach((e, i) => {
    const aktiv = e.key === vonKey || e.key === nachKey;
    treppe.appendChild(el("span", { class: "re-einheit" + (aktiv ? " active" : "") }, e.label));
    if (i < RAUM_EINHEITEN.length - 1) {
      treppe.appendChild(
        el("span", { class: "re-pfeil" }, [
          el("span", { class: "re-groesser" }, "— : 1000 →"),
          el("span", { class: "re-kleiner" }, "← · 1000 —"),
        ])
      );
    }
  });
  wrap.appendChild(treppe);
  wrap.appendChild(
    el("p", { class: "progress-note", style: "text-align:center;margin:0" },
      "Nach rechts zur größeren Einheit: geteilt durch 1000, die Maßzahl wird kleiner. Nach links zur kleineren Einheit: mal 1000, die Maßzahl wird größer.")
  );
}

function renderRaumEinheiten() {
  const wert = clampZahl(document.getElementById("re-wert").value, 0, 1e12);
  const vonKey = document.getElementById("re-von").value;
  const nachKey = document.getElementById("re-nach").value;
  const von = RAUM_EINHEITEN.find((e) => e.key === vonKey);
  const nach = RAUM_EINHEITEN.find((e) => e.key === nachKey);
  renderReTreppe(vonKey, nachKey);

  const diff = von.exp - nach.exp;
  const stufen = Math.abs(diff) / 3;
  const faktor = Math.pow(10, Math.abs(diff));
  const ergebnis = wert * Math.pow(10, diff);
  document.getElementById("re-text").innerHTML =
    (stufen === 0
      ? `<strong>${num(wert, 10)} ${von.label} = ${num(ergebnis, 10)} ${nach.label}</strong> — dieselbe Einheit, nichts zu rechnen.`
      : `Von ${von.label} nach ${nach.label} sind es <strong>${stufen}</strong> Stufe${stufen === 1 ? "" : "n"}, jede Stufe ist 1000 groß ⇒ Faktor <strong>${num(faktor, 10)}</strong>.<br>` +
        `<span class="legende-volumen">${num(wert, 10)} ${von.label} ${diff > 0 ? "·" : ":"} ${num(faktor, 10)} = ${num(ergebnis, 10)} ${nach.label}</span>`) +
    `<br><span class="progress-note">Zum Vergleich: Bei Längen wäre der Faktor je Stufe 10, bei Flächen 100. Bei Volumen ist er 1000 — jede Stufe wirkt in drei Richtungen.</span>`;
}

function renderHohlmasse() {
  const mount = document.getElementById("hohlmass-mount");
  mount.innerHTML = "";
  const tab = el("table", { class: "hohlmass-tabelle" });
  const kopf = el("tr");
  ["Hohlmaß", "ist genau", "in m³"].forEach((h) => kopf.appendChild(el("th", {}, h)));
  tab.appendChild(kopf);
  for (const h of HOHLMASSE) {
    const tr = el("tr");
    tr.appendChild(el("td", {}, "1 " + h.label));
    tr.appendChild(el("td", { class: h.exp === -3 ? "merk" : "" }, h.gleich));
    tr.appendChild(el("td", {}, num(Math.pow(10, h.exp), 10) + " m³"));
    tab.appendChild(tr);
  }
  mount.appendChild(tab);
}

function initRaumEinheiten() {
  const von = document.getElementById("re-von");
  const nach = document.getElementById("re-nach");
  RAUM_EINHEITEN.forEach((e) => {
    von.appendChild(el("option", { value: e.key }, e.label));
    nach.appendChild(el("option", { value: e.key }, e.label));
  });
  von.value = "dm3";
  nach.value = "cm3";
  [von, nach].forEach((s) => s.addEventListener("change", renderRaumEinheiten));
  document.getElementById("re-wert").addEventListener("input", renderRaumEinheiten);
  renderReBild();
  renderHohlmasse();
  renderRaumEinheiten();
}

// ================= 6. Zusammengesetzte Körper =================

// Stufenkörper: ein Quader a × b × c, aus dem oben rechts ein Block d × b × e
// über die volle Tiefe herausgeschnitten ist. Von vorn sieht man eine L-Form.
function stufenKoerper(a, b, c, d, e) {
  const V = a * b * c - d * b * e;
  const untenV = a * b * (c - e); // unterer Riegel über die volle Länge
  const obenV = (a - d) * b * e; // Block, der oben stehen bleibt
  // Oberfläche: zwei L-förmige Stirnflächen plus das Band ringsherum.
  const lFlaeche = a * c - d * e;
  const lUmfang = 2 * (a + c); // bei einer Ecken-Einbuchtung genau der Umfang des Rechtecks
  const O = 2 * lFlaeche + lUmfang * b;
  return { V, untenV, obenV, lFlaeche, lUmfang, O };
}

function renderZusammengesetzt() {
  const strategie = document.getElementById("zk-strategie").value;
  const a = clampInt(document.getElementById("zk-a").value, 3, 10);
  const b = clampInt(document.getElementById("zk-b").value, 1, 6);
  const c = clampInt(document.getElementById("zk-c").value, 2, 8);
  const d = clampInt(document.getElementById("zk-d").value, 1, Math.max(1, a - 1));
  const e = clampInt(document.getElementById("zk-e").value, 1, Math.max(1, c - 1));
  const w = stufenKoerper(a, b, c, d, e);

  const mount = document.getElementById("zk-mount");
  mount.innerHTML = "";
  const skala = Math.min(30, 300 / (a + b * TIEFE_X));
  const m = schraegMasse(a, b, c, skala);
  const rand = 30;
  const svg = neueFlaeche(m.breite + 2 * rand, m.hoehe + 2 * rand);
  const p = projektor(skala, rand, rand + m.oy);

  // In beiden Fällen wird derselbe Stufenkörper gezeichnet: unten ein Riegel über die
  // volle Länge, darauf der stehengebliebene Block. Unterschiedlich ist nur, was
  // hervorgehoben wird — beim Zerlegen die beiden Teile, beim Ergänzen der Block,
  // der zum vollen Quader fehlt.
  const zweitfarbe = strategie === "zerlegen"
    ? { oben: "koerper2-oben", vorn: "koerper2-vorn", rechts: "koerper2-rechts" }
    : null;
  quaderFlaechen(svg, p, 0, 0, 0, a, b, c - e);
  quaderFlaechen(svg, p, 0, 0, c - e, a - d, b, e, zweitfarbe);
  if (strategie === "ergaenzen") {
    // Der fehlende Block als Geist obendrauf — zusammen ergäbe das den vollen Quader.
    const weg = { oben: "koerper-weg", vorn: "koerper-weg", rechts: "koerper-weg" };
    quaderFlaechen(svg, p, a - d, 0, c - e, d, b, e, weg);
    const mitte = p(a - d + d / 2, 0, c - e / 2);
    svg.appendChild(svgText(mitte.X, mitte.Y + 4, `${d}·${b}·${e}`, { class: "geo-mass-text" }));
  }
  mount.appendChild(svg);

  groessenKarten(document.getElementById("zk-werte"), `${w.V} cm³`, `${w.O} cm²`, null);

  document.getElementById("zk-text").innerHTML =
    (strategie === "zerlegen"
      ? `<strong>Zerlegen:</strong> unterer Riegel ${a} · ${b} · ${c - e} = <strong>${w.untenV} cm³</strong>, ` +
        `oberer Block ${a - d} · ${b} · ${e} = <strong>${w.obenV} cm³</strong><br>` +
        `<span class="legende-volumen">V = ${w.untenV} + ${w.obenV} = ${w.V} cm³</span>`
      : `<strong>Ergänzen:</strong> voller Quader ${a} · ${b} · ${c} = <strong>${a * b * c} cm³</strong>, ` +
        `weggeschnittener Block ${d} · ${b} · ${e} = <strong>${d * b * e} cm³</strong><br>` +
        `<span class="legende-volumen">V = ${a * b * c} − ${d * b * e} = ${w.V} cm³</span>`) +
    `<br><span class="progress-note">Die jeweils andere Strategie ergibt dasselbe: ` +
    (strategie === "zerlegen"
      ? `${a * b * c} − ${d * b * e} = ${w.V} cm³.`
      : `${w.untenV} + ${w.obenV} = ${w.V} cm³.`) +
    `</span><br>` +
    `<span class="legende-flaeche">O = 2 · ${w.lFlaeche} + ${w.lUmfang} · ${b} = ${2 * w.lFlaeche} + ${w.lUmfang * b} = ${w.O} cm²</span> ` +
    `<span class="progress-note">— zwei L-förmige Stirnflächen zu je ${w.lFlaeche} cm² plus das Band ringsherum: der Umfang der L-Form (${w.lUmfang} cm) mal der Tiefe (${b} cm).</span>`;
}

function initZusammengesetzt() {
  ["zk-strategie", "zk-a", "zk-b", "zk-c", "zk-d", "zk-e"].forEach((id) => {
    const n = document.getElementById(id);
    n.addEventListener("input", renderZusammengesetzt);
    n.addEventListener("change", renderZusammengesetzt);
  });
  renderZusammengesetzt();
}

// ================= 9. Gestaffelte Übungsaufgaben =================

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
  const a = randInt(2, 12);
  const b = randInt(2, 10);
  // Bei a·b·c = 2·(ab+ac+bc) hätten Volumen und Oberfläche dieselbe Maßzahl — dann
  // wäre die verwechselte Größe von der richtigen nicht zu unterscheiden.
  let c = randInt(2, 9);
  if (a * b * c === 2 * (a * b + a * c + b * c)) c = c === 9 ? 2 : c + 1;
  const V = a * b * c;
  const O = 2 * (a * b + a * c + b * c);
  const nachVolumen = Math.random() < 0.5;
  return {
    promptHtml:
      `Ein Quader hat die Kanten <strong>${a} cm</strong>, <strong>${b} cm</strong> und <strong>${c} cm</strong>. ` +
      `Berechne ${nachVolumen ? "sein <strong>Volumen</strong> in cm³" : "seinen <strong>Oberflächeninhalt</strong> in cm²"}.`,
    correct: nachVolumen ? V : O,
    tolerance: 0.01,
    placeholder: nachVolumen ? "Volumen in cm³" : "Oberflächeninhalt in cm²",
    hinweis: (raw, val) =>
      val === (nachVolumen ? O : V)
        ? nachVolumen
          ? "Das ist der <strong>Oberflächeninhalt</strong> (in cm²). Gefragt ist das Volumen: V = a · b · c."
          : "Das ist das <strong>Volumen</strong> (in cm³). Gefragt ist die Oberfläche: O = 2 · (a·b + a·c + b·c)."
        : val === a * b + a * c + b * c
          ? "Du hast die drei verschiedenen Rechtecke addiert, aber die Verdopplung vergessen: Jede Fläche kommt am Quader <strong>zweimal</strong> vor."
          : val === 4 * (a + b + c)
            ? "Das ist die <strong>Kantensumme</strong> (in cm) — die Länge aller zwölf Kanten zusammen."
            : "",
    musterloesungHtml: nachVolumen
      ? `<span class="legende-volumen">V = a · b · c = ${a} cm · ${b} cm · ${c} cm = ${V} cm³</span><br>` +
        `<span class="progress-note">Zum Vergleich: Die Oberfläche wäre O = 2 · (${a * b} + ${a * c} + ${b * c}) cm² = ${O} cm² — eine ganz andere Größe, in cm² statt cm³.</span>`
      : `O = 2 · (a·b + a·c + b·c)<br>` +
        `&nbsp;&nbsp;a·b = ${a * b} cm² &nbsp;·&nbsp; a·c = ${a * c} cm² &nbsp;·&nbsp; b·c = ${b * c} cm²<br>` +
        `<span class="legende-flaeche">O = 2 · (${a * b} + ${a * c} + ${b * c}) = 2 · ${a * b + a * c + b * c} = ${O} cm²</span><br>` +
        `<span class="progress-note">Zum Vergleich: Das Volumen wäre V = ${a} · ${b} · ${c} = ${V} cm³.</span>`,
  };
}

// Umrechnungspaare für Aufgabe 2. Der Faktor ist immer eine Zehnerpotenz, und die
// Aufgabe wird so konstruiert, dass das Ergebnis ganzzahlig bleibt.
const UMRECHNUNG_PAARE = [
  { von: "cm³", nach: "mm³", diff: 3 },
  { von: "dm³", nach: "cm³", diff: 3 },
  { von: "m³", nach: "dm³", diff: 3 },
  { von: "dm³", nach: "mm³", diff: 6 },
  { von: "m³", nach: "cm³", diff: 6 },
  { von: "m³", nach: "l", diff: 3 },
  { von: "l", nach: "ml", diff: 3 },
  { von: "l", nach: "cm³", diff: 3 },
  { von: "hl", nach: "l", diff: 2 },
];

function generateAufgabe2() {
  const paar = pick(UMRECHNUNG_PAARE);
  const runter = Math.random() < 0.5; // von der größeren zur kleineren Einheit
  const faktor = Math.pow(10, paar.diff);
  const von = runter ? paar.von : paar.nach;
  const nach = runter ? paar.nach : paar.von;
  // Geht es zur größeren Einheit hinauf, muss die Maßzahl ein Vielfaches des
  // Faktors sein, damit das Ergebnis ganzzahlig bleibt.
  const wert = runter ? randInt(2, 40) : randInt(2, 12) * faktor;
  const ergebnis = runter ? wert * faktor : wert / faktor;
  const gleichung =
    paar.von === "m³" && paar.nach === "l"
      ? "1 m³ = 1000 l"
      : paar.von === "l" && paar.nach === "cm³"
        ? "1 l = 1 dm³ = 1000 cm³"
        : paar.von === "l" && paar.nach === "ml"
          ? "1 l = 1000 ml"
          : paar.von === "hl" && paar.nach === "l"
            ? "1 hl = 100 l"
            : `1 ${paar.von} = ${num(faktor, 10)} ${paar.nach}`;
  return {
    promptHtml: `Rechne um: <strong>${num(wert, 10)} ${von}</strong> = ? ${nach}`,
    correct: ergebnis,
    tolerance: Math.max(1e-9, Math.abs(ergebnis) * 1e-9),
    placeholder: "Maßzahl in " + nach,
    hinweis: (raw, val) => {
      // Der klassische Fehler: mit dem Flächenfaktor 100 statt dem Raumfaktor 1000 rechnen
      const mitFlaechenfaktor = runter ? wert * Math.pow(10, (paar.diff / 3) * 2) : wert / Math.pow(10, (paar.diff / 3) * 2);
      if (paar.diff % 3 === 0 && val === mitFlaechenfaktor && val !== ergebnis) {
        return "Du hast mit dem Faktor der <strong>Flächen</strong> gerechnet. Bei Volumen ist jede Stufe <strong>1000</strong> groß, nicht 100 — ein Würfel wächst in drei Richtungen.";
      }
      if (val === (runter ? wert / faktor : wert * faktor)) {
        return "Die Richtung stimmt nicht: Zu einer <strong>kleineren</strong> Einheit wird die Maßzahl größer, zu einer <strong>größeren</strong> kleiner.";
      }
      return "";
    },
    musterloesungHtml:
      `Es gilt <strong>${gleichung}</strong>.<br>` +
      `${num(wert, 10)} ${von} ${runter ? "·" : ":"} ${num(faktor, 10)} = <strong>${num(ergebnis, 10)} ${nach}</strong><br>` +
      `<span class="progress-note">${runter ? "Kleinere Einheit ⇒ größere Maßzahl." : "Größere Einheit ⇒ kleinere Maßzahl."}</span>`,
  };
}

function generateAufgabe3() {
  // Stufenkörper: aus einem Quader ist oben ein Block über die volle Tiefe weggeschnitten.
  const a = randInt(5, 12);
  const b = randInt(2, 6);
  const c = randInt(4, 9);
  const d = randInt(1, a - 2);
  const e = randInt(1, c - 2);
  const w = stufenKoerper(a, b, c, d, e);
  return {
    promptHtml:
      `Ein Körper entsteht aus einem Quader von <strong>${a} cm × ${b} cm × ${c} cm</strong>, aus dem oben ein Block von ` +
      `<strong>${d} cm × ${b} cm × ${e} cm</strong> über die volle Tiefe herausgeschnitten wurde. ` +
      `Wie groß ist das <strong>Volumen</strong> des Körpers in cm³?`,
    correct: w.V,
    tolerance: 0.01,
    placeholder: "Volumen in cm³",
    hinweis: (raw, val) =>
      val === a * b * c
        ? "Das ist das Volumen des <strong>vollen</strong> Quaders. Der herausgeschnittene Block muss noch abgezogen werden."
        : val === d * b * e
          ? "Das ist nur das Volumen des <strong>weggeschnittenen</strong> Blocks. Gefragt ist, was übrig bleibt."
          : val === w.O
            ? "Das ist der <strong>Oberflächeninhalt</strong> (in cm²). Gefragt ist das Volumen in cm³."
            : "",
    musterloesungHtml:
      `<strong>Ergänzen (subtrahieren):</strong><br>` +
      `voller Quader: ${a} · ${b} · ${c} = ${a * b * c} cm³<br>` +
      `weggeschnitten: ${d} · ${b} · ${e} = ${d * b * e} cm³<br>` +
      `<span class="legende-volumen">V = ${a * b * c} − ${d * b * e} = ${w.V} cm³</span><br>` +
      `<span class="progress-note">Probe durch <strong>Zerlegen</strong>: unterer Riegel ${a} · ${b} · ${c - e} = ${w.untenV} cm³, oberer Block ${a - d} · ${b} · ${e} = ${w.obenV} cm³, zusammen ${w.untenV + w.obenV} cm³. ✓</span>`,
  };
}

function generateAufgabe4() {
  // Sachaufgabe: Ein Becken ohne Deckel wird ausgekleidet. Verlangt sind der
  // Flächeninhalt von Boden und vier Wänden — und die Unterscheidung von V und O.
  const a = randInt(3, 9);
  const b = randInt(2, 8);
  let c = randInt(1, 4);
  const teilO = (x, y, z) => x * y + 2 * x * z + 2 * y * z;
  // Fiele das Volumen zahlenmäßig mit der gesuchten Fläche zusammen, wäre der
  // Hinweis "du hast das Volumen genommen" nicht mehr von der Lösung zu trennen.
  if (a * b * c === teilO(a, b, c)) c = c === 4 ? 1 : c + 1;
  const preis = randInt(2, 15); // € je Quadratmeter, nie 1 — sonst wäre Fläche = Kosten
  const O = teilO(a, b, c);
  const kosten = O * preis;
  return {
    promptHtml:
      `Ein quaderförmiges Becken ist innen <strong>${a} m</strong> lang, <strong>${b} m</strong> breit und <strong>${c} m</strong> tief. ` +
      `Boden und alle vier Wände sollen mit Folie ausgekleidet werden — einen Deckel hat das Becken nicht. ` +
      `Die Folie kostet <strong>${preis} € je Quadratmeter</strong>. Wie hoch sind die Kosten in Euro?`,
    correct: kosten,
    tolerance: 0.01,
    placeholder: "Kosten in €",
    hinweis: (raw, val) => {
      if (val === 2 * (a * b + a * c + b * c) * preis)
        return "Du hast die <strong>volle</strong> Oberfläche gerechnet. Das Becken hat keinen Deckel — die obere Fläche fällt weg.";
      if (val === a * b * c * preis)
        return "Du hast mit dem <strong>Volumen</strong> gerechnet. Der Preis gilt „je Quadratmeter“, also für eine Fläche, nicht für einen Rauminhalt.";
      if (val === O) return "Das ist der Flächeninhalt in m² — richtig gerechnet, aber der Preis fehlt noch.";
      if (val === a * b * c) return "Das ist das Volumen in m³. Gefragt sind die Kosten für die <strong>Fläche</strong> von Boden und Wänden.";
      return "";
    },
    musterloesungHtml:
      `① Boden: ${a} m · ${b} m = ${a * b} m²<br>` +
      `② zwei lange Wände: 2 · (${a} · ${c}) = ${2 * a * c} m²<br>` +
      `③ zwei kurze Wände: 2 · (${b} · ${c}) = ${2 * b * c} m²<br>` +
      `<span class="legende-flaeche">auszukleidende Fläche: ${a * b} + ${2 * a * c} + ${2 * b * c} = ${O} m²</span><br>` +
      `④ Kosten: ${O} · ${preis} € = <strong>${num(kosten)} €</strong><br>` +
      `<span class="progress-note">Ohne Deckel sind es <strong>fünf</strong> Flächen, nicht sechs. Die volle Oberfläche wäre ${2 * (a * b + a * c + b * c)} m² — um genau die Deckelfläche von ${a * b} m² zu viel. Das Volumen ${a * b * c} m³ (= ${num(a * b * c * 1000)} Liter) wird hier gar nicht gebraucht.</span>`,
  };
}

function initExercises() {
  mountUebungsaufgaben(document.getElementById("exercises-mount"), [
    { schwierigkeit: "einfach", titel: "Aufgabe 1 — Quader: Volumen oder Oberfläche", generate: generateAufgabe1 },
    { schwierigkeit: "mittel", titel: "Aufgabe 2 — Raumeinheiten und Hohlmaße", generate: generateAufgabe2 },
    { schwierigkeit: "schwierig", titel: "Aufgabe 3 — Zusammengesetzter Körper", generate: generateAufgabe3 },
    { schwierigkeit: "komplex", titel: "Aufgabe 4 — Becken auskleiden", generate: generateAufgabe4 },
  ]);
}

// ================= Quizze =================

function initQuizzes() {
  mountQuiz(document.getElementById("quiz-ausfuellen"), {
    q: "In welcher Einheit wird ein Volumen angegeben?",
    options: ["in cm", "in cm²", "in cm³", "in Liter oder cm² — beides geht"],
    correct: 2,
    explain: "Das Volumen zählt Einheitswürfel, also cm³, m³ und so weiter. Liter sind ebenfalls Raumeinheiten (1 l = 1 dm³), cm² dagegen ist eine Flächeneinheit.",
  });
  mountQuiz(document.getElementById("quiz-quader"), {
    q: "Ein Würfel hat die Kantenlänge 4 cm. Wie groß sind Volumen und Oberflächeninhalt?",
    options: ["V = 12 cm³, O = 16 cm²", "V = 64 cm³, O = 96 cm²", "V = 64 cm³, O = 16 cm²", "V = 16 cm³, O = 64 cm²"],
    correct: 1,
    explain: "V = a³ = 4 · 4 · 4 = 64 cm³ und O = 6 · a² = 6 · 16 = 96 cm². Die 12 cm³ im ersten Vorschlag wären die Kantensumme geteilt durch nichts — 12 · 4 = 48 cm ist die Kantensumme.",
  });
  mountQuiz(document.getElementById("quiz-netz"), {
    q: "Warum steht in O = 2 · (a·b + a·c + b·c) überall der Faktor 2?",
    options: [
      "Weil jede Fläche doppelt gezählt werden muss",
      "Weil gegenüberliegende Flächen gleich groß sind und es deshalb von jedem der drei Rechtecke genau zwei gibt",
      "Weil der Quader zwei Grundflächen hat",
      "Das ist nur eine Rechenvereinfachung",
    ],
    correct: 1,
    explain: "Das Netz hat sechs Rechtecke, aber nur drei verschiedene Sorten — Deckel/Boden, vorn/hinten, rechts/links. Jede Sorte kommt genau zweimal vor.",
  });
  mountQuiz(document.getElementById("quiz-vergleich"), {
    q: "Zwei Quader haben beide das Volumen 64 cm³. Was gilt für ihre Oberflächen?",
    options: [
      "Sie sind ebenfalls gleich groß",
      "Sie können verschieden sein; am kleinsten ist die Oberfläche beim Würfel",
      "Sie können verschieden sein; am kleinsten ist die Oberfläche beim längsten Quader",
      "Das lässt sich ohne die Kantenlängen gar nicht sagen",
    ],
    correct: 1,
    explain: "1 × 1 × 64 hat O = 258 cm², der Würfel 4 × 4 × 4 nur O = 96 cm². Bei festem Volumen ist der Würfel die sparsamste Form — deshalb sind Verpackungen oft möglichst würfelnah.",
  });
  mountQuiz(document.getElementById("quiz-einheiten"), {
    q: "Wie viele Liter sind 2 m³?",
    options: ["2 l", "200 l", "2000 l", "20 000 l"],
    correct: 2,
    explain: "1 m³ = 1000 dm³ und 1 dm³ = 1 l, also 1 m³ = 1000 l. Damit sind 2 m³ genau 2000 l.",
  });
  mountQuiz(document.getElementById("quiz-zusammengesetzt"), {
    q: "Ein Körper wird in zwei Quader zerlegt. Was darf man addieren?",
    options: [
      "Volumen und Oberflächen beider Teile",
      "nur die Volumen — die Oberflächen nicht",
      "nur die Oberflächen — die Volumen nicht",
      "weder das eine noch das andere",
    ],
    correct: 1,
    explain: "Die Volumen ergänzen sich lückenlos. Die Schnittfläche zwischen den Teilen liegt aber innen und gehört gar nicht zur Außenhaut — beim Addieren der Oberflächen würde sie sogar doppelt gezählt.",
  });
}

// ================= Start =================

initAusfuellen();
initQuader();
initNetz();
initVolumenVergleich();
initRaumEinheiten();
initZusammengesetzt();
initExercises();
initQuizzes();
