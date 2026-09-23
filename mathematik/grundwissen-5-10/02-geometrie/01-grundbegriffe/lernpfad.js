// Selbstlernpfad "Grundbegriffe der Geometrie" (Grundwissen Klasse 5-10).
// Rein clientseitiges Vanilla-JS, ohne Build-Schritt oder externe Bibliotheken.
//
// Zeichenfläche ist durchgehend ein SVG mit fester viewBox; alle Objekte werden in
// SVG-Koordinaten gerechnet. Damit Längenangaben in cm stimmen, gilt überall PX_PRO_CM.

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
function num(x, digits = 2) {
  return zahlformat(digits).format(x);
}
function randInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function clampInt(v, lo, hi) {
  const n = Math.round(Number(v));
  if (isNaN(n)) return lo;
  return Math.max(lo, Math.min(hi, n));
}
function parseFlexibleNumber(raw) {
  if (raw == null) return NaN;
  const s = String(raw).trim().replace(/\s/g, "").replace(/−/g, "-").replace(/°/g, "").replace(",", ".");
  return parseFloat(s);
}

// 40 px in der Zeichnung entsprechen 1 cm — so lassen sich Längen ehrlich beschriften.
const PX_PRO_CM = 40;
function alsCm(px) {
  return px / PX_PRO_CM;
}

function neueFlaeche(w, h) {
  return svgEl("svg", { viewBox: `0 0 ${w} ${h}`, width: w, height: h, class: "geo-svg", preserveAspectRatio: "xMidYMid meet" });
}
function punktMarke(svg, x, y, name, dx = 0, dy = -12) {
  svg.appendChild(svgEl("circle", { cx: x, cy: y, r: 4.5, class: "geo-punkt" }));
  if (name) svg.appendChild(svgText(x + dx, y + dy, name, { class: "geo-punkt-name" }));
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

// ================= 1. Punkt, Strecke, Strahl, Gerade =================

function renderLinien() {
  const typ = document.getElementById("lin-typ").value;
  const mount = document.getElementById("lin-mount");
  mount.innerHTML = "";
  const W = 440,
    H = 150;
  const svg = neueFlaeche(W, H);
  const ax = 140,
    ay = 95,
    bx = 300,
    by = 55;

  // Richtungsvektor der Geraden durch A und B, normiert auf die Zeichenfläche verlängert
  const dx = bx - ax,
    dy = by - ay;
  const laenge = Math.hypot(dx, dy);
  const ex = dx / laenge,
    ey = dy / laenge;

  // Offene Enden bekommen eine Pfeilspitze — nur so ist auf einen Blick zu sehen, dass die Linie
  // dort weitergeht und nicht aufhört.
  function pfeilspitze(px, py, rx, ry) {
    const nx = -ry,
      ny = rx;
    svg.appendChild(
      svgEl("path", {
        d: `M ${px} ${py} L ${px - rx * 11 + nx * 5} ${py - ry * 11 + ny * 5} L ${px - rx * 11 - nx * 5} ${py - ry * 11 - ny * 5} Z`,
        fill: "#2563eb",
      })
    );
  }
  // Rand der Zeichenfläche, an dem die offenen Enden sichtbar auslaufen
  const randPuffer = 14;
  function bisRand(startX, startY, richtungX, richtungY) {
    let t = 0;
    while (
      startX + richtungX * (t + 1) > randPuffer &&
      startX + richtungX * (t + 1) < W - randPuffer &&
      startY + richtungY * (t + 1) > randPuffer &&
      startY + richtungY * (t + 1) < H - randPuffer
    ) {
      t += 1;
    }
    return [startX + richtungX * t, startY + richtungY * t];
  }

  if (typ === "gerade") {
    const [x2, y2] = bisRand(ax, ay, ex, ey);
    const [x1, y1] = bisRand(ax, ay, -ex, -ey);
    svg.appendChild(svgEl("line", { x1, y1, x2, y2, class: "geo-linie" }));
    pfeilspitze(x2, y2, ex, ey);
    pfeilspitze(x1, y1, -ex, -ey);
  } else if (typ === "strahl") {
    const [x2, y2] = bisRand(ax, ay, ex, ey);
    svg.appendChild(svgEl("line", { x1: ax, y1: ay, x2, y2, class: "geo-linie" }));
    pfeilspitze(x2, y2, ex, ey);
  } else {
    svg.appendChild(svgEl("line", { x1: ax, y1: ay, x2: bx, y2: by, class: "geo-linie" }));
    // Längenmaß nur bei der Strecke — nur sie hat überhaupt eine Länge.
    const mx = (ax + bx) / 2,
      my = (ay + by) / 2;
    svg.appendChild(svgText(mx + 6, my - 10, `${num(alsCm(laenge), 1)} cm`, { class: "geo-mass-text" }));
  }
  punktMarke(svg, ax, ay, "A", -12, 6);
  punktMarke(svg, bx, by, "B", 12, -8);
  mount.appendChild(svg);

  const texte = {
    strecke: {
      name: "Strecke",
      schreib: '<span style="text-decoration:overline">AB</span>',
      beschreibung: "Der kürzeste Weg von A nach B. Sie hat <strong>zwei Endpunkte</strong> und damit eine <strong>Länge</strong>.",
      laenge: `Hier ist <span style="text-decoration:overline">AB</span> = <strong>${num(alsCm(laenge), 1)} cm</strong> lang.`,
    },
    strahl: {
      name: "Strahl (Halbgerade)",
      schreib: "Strahl von A durch B",
      beschreibung: "Beginnt in <strong>A</strong>, geht durch B und dann unbegrenzt weiter. Er hat <strong>einen Anfangspunkt, aber kein Ende</strong>.",
      laenge: "Ein Strahl hat <strong>keine Länge</strong> — er ist unendlich lang.",
    },
    gerade: {
      name: "Gerade",
      schreib: "AB (oder kurz g)",
      beschreibung: "Nach <strong>beiden</strong> Seiten unbegrenzt. Sie hat weder Anfang noch Ende.",
      laenge: "Eine Gerade hat <strong>keine Länge</strong> — nach der Länge einer Geraden zu fragen ist sinnlos.",
    },
  };
  const t = texte[typ];
  document.getElementById("lin-text").innerHTML =
    `<strong>${t.name}</strong> · Schreibweise: ${t.schreib}<br>${t.beschreibung}<br><span class="progress-note">${t.laenge}</span>`;
}
function initLinien() {
  document.getElementById("lin-typ").addEventListener("change", renderLinien);
  renderLinien();
}

// ================= 2. Lagebeziehungen =================

function renderLage() {
  const grad = clampInt(document.getElementById("lage-winkel").value, 0, 180);
  document.getElementById("lage-winkel-anzeige").textContent = grad + "°";
  const mount = document.getElementById("lage-mount");
  mount.innerHTML = "";
  const W = 440,
    H = 200;
  const svg = neueFlaeche(W, H);
  const cx = W / 2,
    cy = H / 2;

  // g ist waagerecht, h wird um "grad" gedreht. Beide gehen durch die Mitte der Zeichenfläche,
  // außer bei 0°/180° — dann wird h nach unten versetzt, damit die Parallelität sichtbar wird.
  const parallel = grad === 0 || grad === 180;
  const senkrecht = grad === 90;
  const versatz = parallel ? 45 : 0;

  svg.appendChild(svgEl("line", { x1: 20, y1: cy - 25, x2: W - 20, y2: cy - 25, class: "geo-linie" }));
  svg.appendChild(svgText(W - 34, cy - 33, "g", { class: "geo-punkt-name", fill: "#2563eb" }));

  const rad = (grad * Math.PI) / 180;
  const hx = Math.cos(rad),
    hy = -Math.sin(rad);
  const hcy = cy - 25 + versatz;
  const L = 210;
  svg.appendChild(
    svgEl("line", { x1: cx - hx * L, y1: hcy - hy * L, x2: cx + hx * L, y2: hcy + hy * L, class: "geo-gerade-b" })
  );
  svg.appendChild(svgText(cx + hx * (L - 18), hcy + hy * (L - 18) - 8, "h", { class: "geo-punkt-name", fill: "#1a9e7a" }));

  if (!parallel) {
    // Schnittpunkt liegt auf g, also auf der Höhe cy − 25
    punktMarke(svg, cx, cy - 25, "S", 12, -10);
    if (senkrecht) {
      svg.appendChild(svgEl("path", { d: `M ${cx + 16} ${cy - 25} L ${cx + 16} ${cy - 41} L ${cx} ${cy - 41}`, class: "geo-rechter-winkel" }));
    }
  }
  mount.appendChild(svg);

  const schnittwinkel = Math.min(grad, 180 - grad);
  document.getElementById("lage-text").innerHTML = parallel
    ? `g ∥ h — die Geraden sind <strong>parallel</strong>. Sie haben überall denselben Abstand und schneiden sich nie.`
    : senkrecht
      ? `g ⊥ h — die Geraden stehen <strong>senkrecht</strong> aufeinander. Sie schneiden sich unter genau 90°.<br><span class="progress-note">Senkrecht ist ein Sonderfall des Schneidens.</span>`
      : `Die Geraden <strong>schneiden</strong> sich in genau einem Punkt S.<br>` +
        `<span class="progress-note">Der Schnittwinkel beträgt ${schnittwinkel}° (man gibt immer den kleineren der beiden Winkel an). Bei 90° wären sie senkrecht, bei 0° oder 180° parallel.</span>`;
}
function initLage() {
  document.getElementById("lage-winkel").addEventListener("input", renderLage);
  renderLage();
}

// ================= 3. Abstand =================

function renderAbstand() {
  const px = clampInt(document.getElementById("abst-x").value, 20, 380);
  const hoehe = clampInt(document.getElementById("abst-y").value, 20, 110);
  const qx = clampInt(document.getElementById("abst-q").value, 20, 380);
  const mount = document.getElementById("abst-mount");
  mount.innerHTML = "";
  const W = 440,
    H = 190;
  const svg = neueFlaeche(W, H);
  const gy = 150; // die Gerade g liegt waagerecht
  const py = gy - hoehe;

  svg.appendChild(svgEl("line", { x1: 12, y1: gy, x2: W - 12, y2: gy, class: "geo-linie" }));
  svg.appendChild(svgText(W - 26, gy + 18, "g", { class: "geo-punkt-name", fill: "#2563eb" }));

  // Lot von P auf g: senkrecht nach unten, Fußpunkt F hat dieselbe x-Koordinate
  svg.appendChild(svgEl("line", { x1: px, y1: py, x2: px, y2: gy, class: "geo-lot" }));
  svg.appendChild(svgEl("path", { d: `M ${px + 14} ${gy} L ${px + 14} ${gy - 14} L ${px} ${gy - 14}`, class: "geo-rechter-winkel" }));
  svg.appendChild(svgText(px - 26, (py + gy) / 2, `${num(alsCm(hoehe), 1)} cm`, { class: "geo-mass-text" }));

  // Schräge Vergleichsstrecke von P nach Q auf der Geraden
  const schraeg = Math.hypot(qx - px, hoehe);
  svg.appendChild(svgEl("line", { x1: px, y1: py, x2: qx, y2: gy, class: "geo-hilfslinie" }));
  svg.appendChild(svgText((px + qx) / 2 + 18, (py + gy) / 2 - 8, `${num(alsCm(schraeg), 1)} cm`, { class: "geo-beschriftung" }));

  punktMarke(svg, px, py, "P", 0, -12);
  punktMarke(svg, px, gy, "F", -14, 18);
  punktMarke(svg, qx, gy, "Q", 14, 18);
  mount.appendChild(svg);

  const gleich = Math.abs(qx - px) < 3;
  document.getElementById("abst-text").innerHTML =
    `Abstand von P zur Geraden g (Lot, violett gestrichelt): <strong>${num(alsCm(hoehe), 1)} cm</strong><br>` +
    `Schräge Verbindung von P nach Q (grau): ${num(alsCm(schraeg), 1)} cm<br>` +
    `<span class="progress-note">` +
    (gleich
      ? `Q liegt gerade auf dem Lotfußpunkt F — deshalb sind beide Strecken gleich lang. Verschiebe Q, und die schräge Verbindung wird sofort länger.`
      : `Die schräge Verbindung ist <strong>${num(alsCm(schraeg - hoehe), 1)} cm länger</strong> als das Lot. Egal wohin du Q schiebst: Kürzer als das Lot wird es nie. Deshalb ist der Abstand immer die Länge des Lots.`) +
    `</span>`;
}
function initAbstand() {
  ["abst-x", "abst-y", "abst-q"].forEach((id) => document.getElementById(id).addEventListener("input", renderAbstand));
  renderAbstand();
}

// ================= 4. Koordinatensystem =================

function renderKoordinaten() {
  const x = clampInt(document.getElementById("ks-x").value, -6, 6);
  const y = clampInt(document.getElementById("ks-y").value, -6, 6);
  const mount = document.getElementById("ks-mount");
  mount.innerHTML = "";
  const W = 380,
    H = 380,
    einheit = 27;
  const svg = neueFlaeche(W, H);
  const cx = W / 2,
    cy = H / 2;
  const sx = (v) => cx + v * einheit;
  const sy = (v) => cy - v * einheit;

  for (let i = -6; i <= 6; i++) {
    svg.appendChild(svgEl("line", { x1: sx(i), y1: sy(-6.4), x2: sx(i), y2: sy(6.4), class: "ks-gitter" }));
    svg.appendChild(svgEl("line", { x1: sx(-6.4), y1: sy(i), x2: sx(6.4), y2: sy(i), class: "ks-gitter" }));
  }
  svg.appendChild(svgEl("line", { x1: sx(-6.6), y1: cy, x2: sx(6.6), y2: cy, class: "ks-achse" }));
  svg.appendChild(svgEl("line", { x1: cx, y1: sy(-6.6), x2: cx, y2: sy(6.6), class: "ks-achse" }));
  svg.appendChild(svgText(sx(6.6) + 6, cy + 4, "x", { class: "geo-punkt-name", fill: "var(--text)" }));
  svg.appendChild(svgText(cx - 10, sy(6.6) - 2, "y", { class: "geo-punkt-name", fill: "var(--text)" }));
  for (let i = -6; i <= 6; i++) {
    if (i === 0) continue;
    svg.appendChild(svgText(sx(i), cy + 14, String(i), { class: "ks-label" }));
    svg.appendChild(svgText(cx - 14, sy(i) + 4, String(i), { class: "ks-label" }));
  }
  svg.appendChild(svgText(cx - 10, cy + 14, "0", { class: "ks-label" }));
  // Quadrantennummern
  [["I", 3.5, 3.5], ["II", -3.5, 3.5], ["III", -3.5, -3.5], ["IV", 3.5, -3.5]].forEach(([n, qx, qy]) =>
    svg.appendChild(svgText(sx(qx), sy(qy), n, { class: "ks-quadrant" }))
  );

  // Hilfslinien machen die Reihenfolge "erst x, dann y" sichtbar
  if (x !== 0) svg.appendChild(svgEl("line", { x1: cx, y1: cy, x2: sx(x), y2: cy, class: "ks-hilfslinie" }));
  if (y !== 0) svg.appendChild(svgEl("line", { x1: sx(x), y1: cy, x2: sx(x), y2: sy(y), class: "ks-hilfslinie" }));
  punktMarke(svg, sx(x), sy(y), `P(${x} | ${y})`, 0, -13);
  mount.appendChild(svg);

  const quadrant = x === 0 || y === 0 ? null : x > 0 ? (y > 0 ? "I" : "IV") : y > 0 ? "II" : "III";
  document.getElementById("ks-text").innerHTML =
    `<strong>P(${x} | ${y})</strong> — vom Ursprung aus ${x === 0 ? "keinen Schritt" : Math.abs(x) + " Schritt" + (Math.abs(x) === 1 ? "" : "e") + (x > 0 ? " nach rechts" : " nach links")}, ` +
    `dann ${y === 0 ? "keinen Schritt" : Math.abs(y) + " Schritt" + (Math.abs(y) === 1 ? "" : "e") + (y > 0 ? " nach oben" : " nach unten")}.<br>` +
    (quadrant
      ? `Der Punkt liegt im <strong>${quadrant}. Quadranten</strong>.`
      : x === 0 && y === 0
        ? `Der Punkt ist der <strong>Ursprung</strong> O(0 | 0).`
        : `Der Punkt liegt <strong>auf der ${x === 0 ? "y" : "x"}-Achse</strong> und gehört zu keinem Quadranten.`) +
    `<br><span class="progress-note">Vertauscht ergäbe P(${y} | ${x}) einen ${x === y ? "identischen Punkt — nur weil hier zufällig x = y ist" : "ganz anderen Punkt"}.</span>`;
}
function initKoordinaten() {
  ["ks-x", "ks-y"].forEach((id) => document.getElementById(id).addEventListener("input", renderKoordinaten));
  renderKoordinaten();
}

// ================= 5. Winkel =================

const WINKELARTEN = [
  { name: "spitzer Winkel", bereich: "0° < α < 90°", test: (g) => g > 0 && g < 90 },
  { name: "rechter Winkel", bereich: "α = 90°", test: (g) => g === 90 },
  { name: "stumpfer Winkel", bereich: "90° < α < 180°", test: (g) => g > 90 && g < 180 },
  { name: "gestreckter Winkel", bereich: "α = 180°", test: (g) => g === 180 },
  { name: "überstumpfer Winkel", bereich: "180° < α < 360°", test: (g) => g > 180 && g < 360 },
  { name: "Vollwinkel", bereich: "α = 360°", test: (g) => g === 360 },
];

function renderWinkel() {
  const grad = clampInt(document.getElementById("wk-grad").value, 0, 360);
  const laenge = clampInt(document.getElementById("wk-laenge").value, 40, 120);
  document.getElementById("wk-grad-anzeige").textContent = grad + "°";
  const mount = document.getElementById("wk-mount");
  mount.innerHTML = "";
  const W = 380,
    H = 260;
  const svg = neueFlaeche(W, H);
  const sxc = W / 2,
    syc = H / 2 + 20;

  // Erster Schenkel waagerecht nach rechts, zweiter um "grad" gegen den Uhrzeigersinn gedreht
  const rad = (grad * Math.PI) / 180;
  const ax = sxc + laenge,
    ay = syc;
  const bx = sxc + laenge * Math.cos(rad),
    by = syc - laenge * Math.sin(rad);

  // Winkelbogen — bei über 180° muss das large-arc-Flag gesetzt werden
  const r = Math.min(38, laenge * 0.42);
  if (grad > 0 && grad < 360) {
    const b1x = sxc + r,
      b1y = syc;
    const b2x = sxc + r * Math.cos(rad),
      b2y = syc - r * Math.sin(rad);
    const grossserBogen = grad > 180 ? 1 : 0;
    svg.appendChild(
      svgEl("path", { d: `M ${sxc} ${syc} L ${b1x} ${b1y} A ${r} ${r} 0 ${grossserBogen} 0 ${b2x.toFixed(2)} ${b2y.toFixed(2)} Z`, class: "wk-bogen" })
    );
  } else if (grad === 360) {
    svg.appendChild(svgEl("circle", { cx: sxc, cy: syc, r, class: "wk-bogen" }));
  }

  svg.appendChild(svgEl("line", { x1: sxc, y1: syc, x2: ax, y2: ay, class: "wk-schenkel" }));
  svg.appendChild(svgEl("line", { x1: sxc, y1: syc, x2: bx, y2: by, class: "wk-schenkel" }));
  // Beschriftung des Winkels in der Winkelhalbierenden-Richtung
  const halb = rad / 2;
  svg.appendChild(svgText(sxc + (r + 20) * Math.cos(halb), syc - (r + 20) * Math.sin(halb) + 5, grad + "°", { class: "wk-text" }));
  punktMarke(svg, sxc, syc, "S", -14, 16);
  svg.appendChild(svgText(ax + 12, ay + 5, "A", { class: "geo-punkt-name", fill: "#2563eb" }));
  svg.appendChild(svgText(bx + 12 * Math.cos(rad), by - 12 * Math.sin(rad) - 4, "B", { class: "geo-punkt-name", fill: "#2563eb" }));
  mount.appendChild(svg);

  const arten = document.getElementById("wk-arten");
  arten.innerHTML = "";
  WINKELARTEN.forEach((a) => {
    arten.appendChild(
      el("div", { class: "winkelart" + (a.test(grad) ? " aktiv" : ""), html: `${a.name}<span class="bereich">${a.bereich}</span>` })
    );
  });

  const art = WINKELARTEN.find((a) => a.test(grad));
  document.getElementById("wk-text").innerHTML =
    `∡ASB = <strong>${grad}°</strong> — ${art ? "ein <strong>" + art.name + "</strong>" : "ein Winkel von 0°: beide Schenkel fallen zusammen"}.<br>` +
    `Scheitelpunkt: <strong>S</strong> · Schenkel: SA und SB<br>` +
    `<span class="progress-note">Die Schenkel sind gerade ${num(alsCm(laenge), 1)} cm lang gezeichnet. Verändere den zweiten Regler: Die Zeichnung wird größer oder kleiner — die <strong>Gradzahl bleibt ${grad}°</strong>.</span>`;
}
function initWinkel() {
  ["wk-grad", "wk-laenge"].forEach((id) => document.getElementById(id).addEventListener("input", renderWinkel));
  renderWinkel();
}

// ================= 6. Symmetrie =================

function renderSymmetrie() {
  const art = document.getElementById("sym-art").value;
  const mount = document.getElementById("sym-mount");
  mount.innerHTML = "";
  const W = 440,
    H = 220;
  const svg = neueFlaeche(W, H);
  const mx = W / 2,
    my = H / 2;

  // Urfigur: ein unsymmetrisches Dreieck links der Mitte
  const figur = [
    [mx - 150, my - 55],
    [mx - 45, my - 20],
    [mx - 110, my + 60],
  ];
  const bild =
    art === "achse"
      ? figur.map(([x, y]) => [2 * mx - x, y]) // Spiegelung an der senkrechten Achse
      : figur.map(([x, y]) => [2 * mx - x, 2 * my - y]); // Drehung um 180° um Z

  svg.appendChild(svgEl("polygon", { points: figur.map((p) => p.join(",")).join(" "), class: "sym-figur" }));
  svg.appendChild(svgEl("polygon", { points: bild.map((p) => p.join(",")).join(" "), class: "sym-bild" }));

  // Verbindungslinien zwischen Punkt und Bildpunkt zeigen die Abbildungsvorschrift
  figur.forEach((p, i) => {
    svg.appendChild(svgEl("line", { x1: p[0], y1: p[1], x2: bild[i][0], y2: bild[i][1], class: "sym-verbindung" }));
  });

  if (art === "achse") {
    svg.appendChild(svgEl("line", { x1: mx, y1: 10, x2: mx, y2: H - 10, class: "sym-achse" }));
    svg.appendChild(svgText(mx + 14, 22, "a", { class: "geo-mass-text" }));
    // Rechter Winkel an einer Verbindungsstrecke: sie steht senkrecht auf der Achse
    const p = figur[0];
    svg.appendChild(svgEl("path", { d: `M ${mx - 13} ${p[1]} L ${mx - 13} ${p[1] - 13} L ${mx} ${p[1] - 13}`, class: "geo-rechter-winkel" }));
  } else {
    svg.appendChild(svgEl("circle", { cx: mx, cy: my, r: 5, class: "sym-zentrum" }));
    svg.appendChild(svgText(mx + 16, my - 8, "Z", { class: "geo-mass-text" }));
  }
  mount.appendChild(svg);

  document.getElementById("sym-text").innerHTML =
    art === "achse"
      ? `<strong>Achsenspiegelung an der Achse a.</strong><br>` +
        `Jeder Punkt und sein Bildpunkt haben <strong>denselben Abstand zur Achse</strong>. Ihre Verbindungsstrecke steht <strong>senkrecht</strong> auf der Achse (rechter Winkel eingezeichnet).<br>` +
        `<span class="progress-note">Die Bildfigur ist spiegelverkehrt — Umlaufsinn und Händigkeit kehren sich um.</span>`
      : `<strong>Punktspiegelung am Zentrum Z</strong> — das ist dasselbe wie eine <strong>Drehung um 180°</strong>.<br>` +
        `Z liegt bei jedem Punktepaar genau in der <strong>Mitte</strong> der Verbindungsstrecke.<br>` +
        `<span class="progress-note">Die Bildfigur ist <em>nicht</em> spiegelverkehrt — sie ist nur gedreht. Daran unterscheidet man die beiden Symmetriearten am schnellsten.</span>`;
}
function initSymmetrie() {
  document.getElementById("sym-art").addEventListener("change", renderSymmetrie);
  renderSymmetrie();
}

// ================= 9. Gestaffelte Übungsaufgaben =================

// Die Werkbank für die Übungsaufgaben ist für alle Grundwissen-Seiten dieselbe und steht in
// ../../aufgaben.js. Mitgegeben wird nur, wie DIESE Seite eine Eingabe als Zahl liest.
const mountUebungsaufgaben = (container, defs) =>
  mountUebungsaufgabenBasis(container, defs, { parse: parseFlexibleNumber });

// ---------- Aufgaben-Definitionen ----------

// Fehlerhinweise vergleichen die Eingabe mit dem Wert, der bei einem
// bestimmten Fehler herauskäme. Ein Vergleich mit === trifft dabei nicht
// zuverlässig: 7/10 · 360 ergibt 252,00000000000003, und wer den Rest zu 360°
// nennt, tippt 108 — der Hinweis bliebe stumm. Verglichen wird deshalb mit
// einer relativen Schranke.
function trifft(val, soll) {
  return Number.isFinite(val) && Number.isFinite(soll)
    && Math.abs(val - soll) <= 1e-6 * Math.max(1, Math.abs(soll));
}


function generateAufgabe1() {
  // Winkelart zu einer Gradzahl bestimmen — die Antwort ist eine Zahl, damit sie prüfbar bleibt:
  // gefragt wird nach der Ergänzung zum rechten bzw. gestreckten Winkel.
  const varianten = [
    () => {
      const g = randInt(10, 80);
      return {
        frage: `Wie groß ist der Winkel, der ${g}° zu einem <strong>rechten Winkel</strong> ergänzt?`,
        name: "rechter Winkel", ganz: 90,
        correct: 90 - g,
        loesung: `Ein rechter Winkel misst 90°. Also: 90° − ${g}° = <strong>${90 - g}°</strong>`,
      };
    },
    () => {
      const g = randInt(20, 160);
      return {
        frage: `Wie groß ist der Winkel, der ${g}° zu einem <strong>gestreckten Winkel</strong> ergänzt?`,
        name: "gestreckter Winkel", ganz: 180,
        correct: 180 - g,
        loesung: `Ein gestreckter Winkel misst 180°. Also: 180° − ${g}° = <strong>${180 - g}°</strong>`,
      };
    },
    () => {
      const g = randInt(30, 330);
      return {
        frage: `Wie groß ist der Winkel, der ${g}° zu einem <strong>Vollwinkel</strong> ergänzt?`,
        name: "Vollwinkel", ganz: 360,
        correct: 360 - g,
        loesung: `Ein Vollwinkel misst 360°. Also: 360° − ${g}° = <strong>${360 - g}°</strong>`,
      };
    },
  ];
  const v = pick(varianten)();
  return {
    promptHtml: v.frage,
    correct: v.correct,
    tolerance: 0.5,
    placeholder: "Winkel in Grad",
    hinweis: (roh, val) => (trifft(val, v.ganz + (v.ganz - v.correct)) ? "Hier wurde addiert statt ergänzt." : ""),
    tipps: [
      `Ein ${v.name} misst <strong>${v.ganz}°</strong>.`,
      "Ergänzen heißt: Was fehlt noch bis dahin?",
      `Also ${v.ganz}° minus der gegebene Winkel.`,
    ],
    musterloesungHtml: v.loesung,
  };
}

function generateAufgabe2() {
  // Koordinaten: gefragt ist eine einzelne Koordinate eines gespiegelten Punktes.
  const x = randInt(-5, 5) || 2;
  const y = randInt(-5, 5) || 3;
  const varianten = [
    {
      frage: `Der Punkt P(${x} | ${y}) wird an der <strong>x-Achse</strong> gespiegelt. Wie lautet die <strong>y-Koordinate</strong> des Bildpunkts P′?`,
      correct: -y,
      loesung: `Bei der Spiegelung an der x-Achse bleibt x gleich, y wechselt das Vorzeichen: P′(${x} | ${-y}). Die y-Koordinate ist <strong>${-y}</strong>.`,
    },
    {
      frage: `Der Punkt P(${x} | ${y}) wird an der <strong>y-Achse</strong> gespiegelt. Wie lautet die <strong>x-Koordinate</strong> des Bildpunkts P′?`,
      correct: -x,
      loesung: `Bei der Spiegelung an der y-Achse bleibt y gleich, x wechselt das Vorzeichen: P′(${-x} | ${y}). Die x-Koordinate ist <strong>${-x}</strong>.`,
    },
    {
      frage: `In welchem Quadranten liegt der Punkt P(${x} | ${y})? Gib die Nummer an (1, 2, 3 oder 4).`,
      correct: x > 0 ? (y > 0 ? 1 : 4) : y > 0 ? 2 : 3,
      loesung: `x = ${x} ist ${x > 0 ? "positiv (rechts)" : "negativ (links)"}, y = ${y} ist ${y > 0 ? "positiv (oben)" : "negativ (unten)"} ⇒ <strong>${x > 0 ? (y > 0 ? "I. Quadrant" : "IV. Quadrant") : y > 0 ? "II. Quadrant" : "III. Quadrant"}</strong>`,
    },
  ];
  const v = pick(varianten);
  return {
    promptHtml: v.frage,
    correct: v.correct,
    tolerance: 0.5,
    placeholder: "Zahl",
    tipps: [
      "Zeichne den Punkt ins Koordinatensystem — die erste Zahl ist der Weg nach rechts, die zweite der nach oben.",
      "Bei einer Spiegelung an einer Achse bleibt die Koordinate <em>entlang</em> dieser Achse gleich; die andere wechselt das Vorzeichen.",
      "Die Quadranten werden gegen den Uhrzeigersinn gezählt, beginnend rechts oben.",
    ],
    musterloesungHtml: v.loesung,
  };
}

function generateAufgabe3() {
  // Abstand eines Punktes von einer achsenparallelen Geraden — testet, dass das Lot gemeint ist.
  const achse = pick(["x", "y"]);
  const px = randInt(-6, 6);
  const py = randInt(-6, 6);
  const lage = randInt(-4, 4);
  if (achse === "x") {
    // Gerade y = lage, waagerecht: der Abstand ist |py − lage|
    const abstand = Math.abs(py - lage);
    return {
      promptHtml: `Die Gerade g verläuft waagerecht durch alle Punkte mit <strong>y = ${lage}</strong>. Welchen Abstand hat der Punkt P(${px} | ${py}) von g?`,
      correct: abstand,
      tolerance: 0.05,
      placeholder: "Abstand",
      hinweis: (raw, val) =>
        trifft(val, Math.abs(px - lage))
          ? "Du hast die x-Koordinate verwendet. Bei einer <strong>waagerechten</strong> Geraden führt das Lot senkrecht nach oben oder unten — es zählt also die <strong>y</strong>-Koordinate."
          : "",
      tipps: [
        "Der Abstand wird immer über das <strong>Lot</strong> gemessen — den kürzesten Weg zur Geraden.",
        "Bei einer waagerechten Geraden führt das Lot senkrecht nach oben oder unten.",
        `Es zählt also nur die y-Koordinate: |${py} − ${lage}|.`,
      ],
      musterloesungHtml:
        `g ist waagerecht, das Lot von P steht also senkrecht darauf und verläuft in y-Richtung.<br>` +
        `Abstand = |y<sub>P</sub> − ${lage}| = |${py} − ${lage}| = <strong>${abstand}</strong><br>` +
        `<span class="progress-note">Die x-Koordinate spielt keine Rolle — P kann beliebig weit links oder rechts liegen, der Abstand bleibt gleich.</span>`,
    };
  }
  // Gerade x = lage, senkrecht: der Abstand ist |px − lage|
  const abstand = Math.abs(px - lage);
  return {
    promptHtml: `Die Gerade g verläuft senkrecht durch alle Punkte mit <strong>x = ${lage}</strong>. Welchen Abstand hat der Punkt P(${px} | ${py}) von g?`,
    correct: abstand,
    tolerance: 0.05,
    placeholder: "Abstand",
    hinweis: (raw, val) =>
      trifft(val, Math.abs(py - lage))
        ? "Du hast die y-Koordinate verwendet. Bei einer <strong>senkrechten</strong> Geraden führt das Lot waagerecht — es zählt also die <strong>x</strong>-Koordinate."
        : "",
    tipps: [
      "Der Abstand wird immer über das <strong>Lot</strong> gemessen — den kürzesten Weg zur Geraden.",
      "Bei einer senkrechten Geraden führt das Lot waagerecht nach links oder rechts.",
      `Es zählt also nur die x-Koordinate: |${px} − ${lage}|.`,
    ],
    musterloesungHtml:
      `g ist senkrecht, das Lot von P verläuft also waagerecht in x-Richtung.<br>` +
      `Abstand = |x<sub>P</sub> − ${lage}| = |${px} − ${lage}| = <strong>${abstand}</strong><br>` +
      `<span class="progress-note">Die y-Koordinate spielt keine Rolle.</span>`,
  };
}

function generateAufgabe4() {
  // Mehrschrittig: Rechteck im Koordinatensystem, gefragt sind Umfang oder Seitenlänge.
  const x1 = randInt(-5, 1);
  const breite = randInt(2, 6);
  const y1 = randInt(-5, 1);
  let hoehe = randInt(2, 5);
  // Drei Sonderfälle würden die gezielten Fehlerhinweise unbrauchbar machen: Bei (4|4)
  // und (6|3) hätte der Flächeninhalt dieselbe Maßzahl wie der gesuchte Umfang, bei
  // (2|2) dieselbe wie die Summe aus Länge und Breite. Zu jeder Breite ist höchstens
  // eine Höhe betroffen, deshalb genügt ein einziger Weiterschritt.
  if (breite * hoehe === 2 * (breite + hoehe) || breite * hoehe === breite + hoehe) hoehe = hoehe === 5 ? 2 : hoehe + 1;
  const x2 = x1 + breite,
    y2 = y1 + hoehe;
  const umfang = 2 * (breite + hoehe);
  return {
    promptHtml:
      `Ein Rechteck hat die Eckpunkte A(${x1} | ${y1}), B(${x2} | ${y1}), C(${x2} | ${y2}) und D(${x1} | ${y2}). ` +
      `Alle Angaben in Zentimetern. Wie groß ist der <strong>Umfang</strong> des Rechtecks?`,
    correct: umfang,
    tolerance: 0.05,
    placeholder: "Umfang in cm",
    hinweis: (raw, val) =>
      trifft(val, breite + hoehe)
        ? "Du hast nur eine Länge und eine Breite addiert. Der Umfang umfasst <strong>alle vier</strong> Seiten — jede Länge kommt zweimal vor."
        : trifft(val, breite * hoehe)
          ? "Das ist der Flächeninhalt. Gefragt ist der <strong>Umfang</strong>, also die Summe aller Seitenlängen."
          : "",
    tipps: [
      "Lies die Seitenlängen aus den Koordinaten ab: Zwei Ecken auf gleicher Höhe liegen waagerecht nebeneinander.",
      `Die waagerechte Seite ist |${x2} − ${x1}| lang, die senkrechte |${y2} − ${y1}|.`,
      "Der Umfang ist die Summe aller vier Seiten — jede Länge kommt zweimal vor.",
    ],
    musterloesungHtml:
      `① Seitenlängen aus den Koordinaten ablesen:<br>` +
      `&nbsp;&nbsp;<span style="text-decoration:overline">AB</span> verläuft waagerecht: |${x2} − ${x1}| = <strong>${breite} cm</strong><br>` +
      `&nbsp;&nbsp;<span style="text-decoration:overline">BC</span> verläuft senkrecht: |${y2} − ${y1}| = <strong>${hoehe} cm</strong><br>` +
      `② Umfang = 2 · (${breite} cm + ${hoehe} cm) = <strong>${umfang} cm</strong><br>` +
      `<span class="progress-note">Gegenüberliegende Seiten eines Rechtecks sind gleich lang und parallel — deshalb reichen zwei Seitenlängen.</span>`,
  };
}

// Aufgabe 2 — Punktspiegelung am Ursprung. Zwei Felder, weil bei der Punktspiegelung BEIDE
// Koordinaten das Vorzeichen wechseln — bei der Achsenspiegelung nur eine. Genau das ist der
// Unterschied, den ein einzelnes Feld nicht abfragen könnte.
function generateAufgabe2b() {
  const x = randInt(-6, 6) || 3;
  const y = randInt(-6, 6) || 4;
  return {
    promptHtml:
      `Der Punkt P(${x} | ${y}) wird am <strong>Ursprung</strong> (0 | 0) gespiegelt. ` +
      `Wie lauten die Koordinaten des Bildpunkts P′?`,
    felder: [
      {
        name: "x-Koordinate von P′", soll: -x, toleranz: 0.5,
        hinweis: (roh, val) => (trifft(val, x) ? "Bei der Punktspiegelung am Ursprung wechseln <em>beide</em> Koordinaten das Vorzeichen." : ""),
      },
      {
        name: "y-Koordinate von P′", soll: -y, toleranz: 0.5,
        hinweis: (roh, val) => (trifft(val, y) ? "Auch die y-Koordinate wechselt das Vorzeichen — anders als bei der Spiegelung an der y-Achse." : ""),
      },
    ],
    tipps: [
      "Bei einer Punktspiegelung am Ursprung liegt der Ursprung genau in der Mitte zwischen P und P′.",
      "Um von P zum Ursprung zu kommen, geht man den Weg zurück — und genauso weit darüber hinaus.",
      "Beide Koordinaten wechseln also das Vorzeichen.",
    ],
    musterloesungHtml:
      `Der Ursprung ist die Mitte zwischen P und P′. Von P(${x} | ${y}) aus geht es ${Math.abs(x)} nach ` +
      `${x > 0 ? "links" : "rechts"} und ${Math.abs(y)} nach ${y > 0 ? "unten" : "oben"} zum Ursprung — und noch einmal ebenso weiter:<br>` +
      `P′(<strong>${-x}</strong> | <strong>${-y}</strong>)<br>` +
      `<span class="progress-note">Zum Vergleich: An der x-Achse gespiegelt wäre es (${x} | ${-y}), an der y-Achse (${-x} | ${y}). Nur bei der Punktspiegelung wechseln beide.</span>`,
  };
}

// Aufgabe 4 — Abstand zweier Punkte, die auf einer Parallelen zu einer Achse liegen. Ohne
// Wurzelrechnung, die erst in Klasse 9 kommt: Eine der beiden Koordinaten ist bei beiden gleich.
function generateAufgabe4b() {
  const waagerecht = Math.random() < 0.5;
  const fest = randInt(-6, 6);
  let a = randInt(-7, 7), b = randInt(-7, 7);
  if (a === b) b = a + randInt(1, 5);
  const A = waagerecht ? { x: a, y: fest } : { x: fest, y: a };
  const B = waagerecht ? { x: b, y: fest } : { x: fest, y: b };
  const abstand = Math.abs(a - b);
  return {
    promptHtml:
      `Welchen Abstand haben die Punkte A(${A.x} | ${A.y}) und B(${B.x} | ${B.y}) voneinander?` +
      `<br><span class="progress-note">Zähle die Einheiten im Koordinatensystem.</span>`,
    correct: abstand,
    tolerance: 0.05,
    placeholder: "Abstand",
    hinweis: (roh, val) =>
      trifft(val, a + b)
        ? "Die beiden Koordinaten werden nicht addiert: Der Abstand ist der <em>Unterschied</em>, also die größere minus die kleinere."
        : trifft(val, -abstand)
          ? "Ein Abstand ist nie negativ — gerechnet wird mit dem Betrag."
          : "",
    tipps: [
      `Vergleiche die Koordinaten: Die ${waagerecht ? "y" : "x"}-Koordinate ist bei beiden Punkten gleich (${fest}).`,
      `Die Strecke AB verläuft also ${waagerecht ? "waagerecht" : "senkrecht"} — der Abstand steckt allein in der ${waagerecht ? "x" : "y"}-Koordinate.`,
      `Abstand = |${a} − ${b}|.`,
    ],
    musterloesungHtml:
      `Beide Punkte haben dieselbe ${waagerecht ? "y" : "x"}-Koordinate (${fest}), die Strecke AB verläuft also ${waagerecht ? "waagerecht" : "senkrecht"}.<br>` +
      `Abstand = |${a} − ${b}| = <strong>${abstand}</strong><br>` +
      `<span class="progress-note">Bei schrägen Strecken geht das nicht so einfach — dafür braucht man den Satz des Pythagoras (Klasse 9).</span>`,
  };
}

// Aufgabe 6 — Spiegelung an einer Geraden, die NICHT eine der Achsen ist. Der Bildpunkt liegt so
// weit jenseits der Spiegelachse, wie der Urpunkt davor liegt; die andere Koordinate bleibt.
function generateAufgabe6() {
  const anX = Math.random() < 0.5;          // Spiegelachse waagerecht (y = c) oder senkrecht (x = c)
  const c = randInt(-4, 4);
  const px = randInt(-7, 7);
  const py = randInt(-7, 7);
  const beweglich = anX ? py : px;
  if (beweglich === c) return generateAufgabe6();   // auf der Achse gäbe es nichts zu spiegeln
  const gespiegelt = 2 * c - beweglich;
  const bild = anX ? { x: px, y: gespiegelt } : { x: gespiegelt, y: py };
  return {
    promptHtml:
      `Der Punkt P(${px} | ${py}) wird an der Geraden <strong>${anX ? "y" : "x"} = ${c}</strong> gespiegelt ` +
      `(sie verläuft ${anX ? "waagerecht" : "senkrecht"}). Wie lauten die Koordinaten von P′?`,
    felder: [
      {
        name: "x-Koordinate von P′", soll: bild.x, toleranz: 0.5,
        hinweis: (roh, val) => (!anX && trifft(val, px) ? "Bei einer senkrechten Spiegelachse ändert sich gerade die x-Koordinate." : ""),
      },
      {
        name: "y-Koordinate von P′", soll: bild.y, toleranz: 0.5,
        hinweis: (roh, val) => (anX && trifft(val, py) ? "Bei einer waagerechten Spiegelachse ändert sich gerade die y-Koordinate." : ""),
      },
    ],
    tipps: [
      `Die Spiegelachse verläuft ${anX ? "waagerecht" : "senkrecht"} — die ${anX ? "x" : "y"}-Koordinate bleibt deshalb unverändert.`,
      `P liegt ${Math.abs(beweglich - c)} Einheiten von der Achse entfernt. Das Bild liegt genauso weit auf der anderen Seite.`,
      `Von ${c} aus also ${Math.abs(beweglich - c)} Einheiten nach ${beweglich > c ? "unten bzw. links" : "oben bzw. rechts"}.`,
    ],
    musterloesungHtml:
      `Die ${anX ? "x" : "y"}-Koordinate bleibt: ${anX ? px : py}.<br>` +
      `Abstand von P zur Achse: |${beweglich} − ${c}| = ${Math.abs(beweglich - c)}<br>` +
      `Das Bild liegt genauso weit auf der anderen Seite: ${c} ${beweglich > c ? "−" : "+"} ${Math.abs(beweglich - c)} = <strong>${gespiegelt}</strong><br>` +
      `P′(<strong>${bild.x}</strong> | <strong>${bild.y}</strong>) &nbsp; — Kontrolle: Die Achse liegt genau in der Mitte zwischen ${beweglich} und ${gespiegelt}.`,
  };
}

// Aufgabe 8 — die vierte Ecke eines achsenparallelen Rechtecks und sein Umfang. Drei Felder: Die
// Koordinaten allein zeigen noch nicht, ob die Seitenlängen abgelesen wurden.
function generateAufgabe8() {
  const x1 = randInt(-6, 2), y1 = randInt(-6, 2);
  const breite = randInt(2, 7), hoehe = randInt(2, 6);
  const A = { x: x1, y: y1 };
  const B = { x: x1 + breite, y: y1 };
  const C = { x: x1 + breite, y: y1 + hoehe };
  const D = { x: x1, y: y1 + hoehe };
  const umfang = 2 * (breite + hoehe);
  return {
    promptHtml:
      `Drei Ecken eines achsenparallelen Rechtecks ABCD sind gegeben:<br>` +
      `<div class="formula-block">A(${A.x} | ${A.y}) &nbsp; B(${B.x} | ${B.y}) &nbsp; C(${C.x} | ${C.y})</div>`,
    felder: [
      {
        name: "x-Koordinate der vierten Ecke D", soll: D.x, toleranz: 0.5,
        hinweis: (roh, val) => (trifft(val, C.x) ? "D liegt über A, nicht über C — sonst wäre es kein Rechteck." : ""),
      },
      { name: "y-Koordinate der vierten Ecke D", soll: D.y, toleranz: 0.5 },
      {
        name: "der Umfang des Rechtecks", soll: umfang, toleranz: 0.5,
        hinweis: (roh, val) =>
          trifft(val, breite * hoehe)
            ? "Das ist der Flächeninhalt. Der Umfang ist die Länge des ganzen Randes."
            : trifft(val, breite + hoehe)
              ? "Jede Seitenlänge kommt zweimal vor."
              : "",
      },
    ],
    tipps: [
      "Zeichne die drei Punkte ins Koordinatensystem — dann sieht man sofort, wo die vierte Ecke liegen muss.",
      "In einem achsenparallelen Rechteck haben gegenüberliegende Ecken jeweils eine Koordinate gemeinsam: D hat dieselbe x-Koordinate wie A und dieselbe y-Koordinate wie C.",
      `Die Seiten sind ${breite} und ${hoehe} Einheiten lang; der Umfang ist 2 · (${breite} + ${hoehe}).`,
    ],
    musterloesungHtml:
      `A und B liegen auf derselben Höhe, B und C übereinander. D muss also über A und neben C liegen:<br>` +
      `D(<strong>${D.x}</strong> | <strong>${D.y}</strong>)<br>` +
      `Seitenlängen: AB = ${breite}, BC = ${hoehe}<br>` +
      `Umfang = 2 · (${breite} + ${hoehe}) = <strong>${umfang}</strong><br>` +
      `<span class="progress-note">Zum Vergleich: Der Flächeninhalt wäre ${breite} · ${hoehe} = ${breite * hoehe} — eine ganz andere Größe.</span>`,
  };
}

function initExercises() {
  mountUebungsaufgaben(document.getElementById("exercises-mount"), [
    { schwierigkeit: "einfach", titel: "Aufgabe 1 — Winkel ergänzen", generate: generateAufgabe1 },
    { schwierigkeit: "einfach", titel: "Aufgabe 2 — Punktspiegelung am Ursprung", generate: generateAufgabe2b },
    { schwierigkeit: "mittel", titel: "Aufgabe 3 — Punkte im Koordinatensystem", generate: generateAufgabe2 },
    { schwierigkeit: "mittel", titel: "Aufgabe 4 — Abstand zweier Punkte", generate: generateAufgabe4b },
    { schwierigkeit: "schwierig", titel: "Aufgabe 5 — Abstand von einer Geraden", generate: generateAufgabe3 },
    { schwierigkeit: "schwierig", titel: "Aufgabe 6 — Spiegeln an einer Geraden", generate: generateAufgabe6 },
    { schwierigkeit: "komplex", titel: "Aufgabe 7 — Rechteck aus Koordinaten", generate: generateAufgabe4 },
    { schwierigkeit: "komplex", titel: "Aufgabe 8 — Die vierte Ecke und der Umfang", generate: generateAufgabe8 },
  ]);
}

// ================= Quizze =================

function initQuizzes() {
  mountQuiz(document.getElementById("quiz-linien"), {
    q: "Welche Aussage über eine Gerade ist richtig?",
    options: [
      "Eine Gerade hat zwei Endpunkte",
      "Eine Gerade ist nach beiden Seiten unbegrenzt und hat deshalb keine Länge",
      "Eine Gerade ist genauso lang wie die Strecke zwischen ihren beiden Punkten",
      "Eine Gerade hat einen Anfangspunkt, aber kein Ende",
    ],
    correct: 1,
    explain: "Nur die Strecke hat zwei Endpunkte und eine Länge. Der Strahl hat einen Anfangspunkt, die Gerade gar keinen.",
  });
  mountQuiz(document.getElementById("quiz-lage"), {
    q: "Zwei Geraden schneiden sich unter einem Winkel von 90°. Wie nennt man das?",
    options: ["parallel", "senkrecht (orthogonal)", "windschief", "gestreckt"],
    correct: 1,
    explain: "Schreibweise g ⊥ h. Parallele Geraden dagegen schneiden sich überhaupt nicht — sie haben überall denselben Abstand.",
  });
  mountQuiz(document.getElementById("quiz-abstand"), {
    q: "Wie bestimmt man den Abstand eines Punktes P von einer Geraden g?",
    options: [
      "Man misst irgendeine Verbindungsstrecke von P zu g",
      "Man misst die Länge des Lots, also die senkrechte Verbindung",
      "Man misst die Strecke von P zum Anfangspunkt von g",
      "Der Abstand ist immer gleich null, wenn P nicht auf g liegt",
    ],
    correct: 1,
    explain: "Jede schräge Verbindung ist länger. Der Abstand ist immer die kürzeste Verbindung — und die steht senkrecht auf g.",
  });
  mountQuiz(document.getElementById("quiz-koordinaten"), {
    q: "Wo liegt der Punkt P(−4 | 2)?",
    options: ["im I. Quadranten", "im II. Quadranten", "im III. Quadranten", "im IV. Quadranten"],
    correct: 1,
    explain: "x = −4 liegt links, y = 2 liegt oben — das ist der II. Quadrant. Zuerst wird immer der x-Wert genannt.",
  });
  mountQuiz(document.getElementById("quiz-winkel"), {
    q: "Zwei Winkel messen beide 40°, aber der eine ist mit doppelt so langen Schenkeln gezeichnet. Was gilt?",
    options: [
      "Der mit den längeren Schenkeln ist größer",
      "Beide Winkel sind gleich groß — die Schenkellänge spielt keine Rolle",
      "Der mit den kürzeren Schenkeln ist größer",
      "Das lässt sich ohne Geodreieck nicht sagen",
    ],
    correct: 1,
    explain: "Gemessen wird die Drehung zwischen den Schenkeln, nicht ihre Länge. Beide Winkel messen 40°.",
  });
  mountQuiz(document.getElementById("quiz-symmetrie"), {
    q: "Woran erkennt man eine Punktspiegelung im Unterschied zur Achsenspiegelung?",
    options: [
      "Die Bildfigur ist spiegelverkehrt",
      "Die Bildfigur ist nur gedreht, nicht spiegelverkehrt — sie entsteht durch Drehung um 180°",
      "Die Bildfigur ist größer als die Urfigur",
      "Es gibt keinen Unterschied",
    ],
    correct: 1,
    explain: "Eine Punktspiegelung ist eine Drehung um 180° um das Zentrum Z; Z liegt jeweils in der Mitte zwischen Punkt und Bildpunkt. Nur die Achsenspiegelung kehrt den Umlaufsinn um.",
  });
}

// ================= Start =================

document.addEventListener("DOMContentLoaded", () => {
  initLinien();
  initLage();
  initAbstand();
  initKoordinaten();
  initWinkel();
  initSymmetrie();
  initExercises();
  initQuizzes();
});
