// Selbstlernpfad "Pyramiden, Kegel und Kugeln" (Grundwissen Klasse 5-10).
// Rein clientseitiges Vanilla-JS, ohne Build-Schritt oder externe Bibliotheken.
//
// Leitgedanke: Der Faktor ⅓ ist keine Willkür, sondern eine Aussage über den
// VERGLEICH mit dem Prisma gleicher Grundfläche und Höhe. Deshalb steht in
// Abschnitt 2 beides nebeneinander und lässt sich umfüllen. Und die zweite
// große Fehlerquelle — Körperhöhe gegen Seitenhöhe — bekommt einen eigenen
// Abschnitt mit dem rechtwinkligen Dreieck, in dem beide vorkommen.
//
// Durchgehende Farbcodierung: Grundfläche grün, Mantel orange, Körperhöhe rot,
// Seitenhöhe und Mantellinie violett, Radius blau.

"use strict";

// ---------- Helfer ----------

const SVG_NS = "http://www.w3.org/2000/svg";
function svgEl(tag, attrs = {}) {
  const e = document.createElementNS(SVG_NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  return e;
}
function svgText(x, y, text, attrs = {}) {
  const t = svgEl("text", Object.assign({ x: Number(x).toFixed(2), y: Number(y).toFixed(2), "text-anchor": "middle" }, attrs));
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
function parseFlexibleNumber(raw) {
  if (raw == null) return NaN;
  const s = String(raw).trim().replace(/\s/g, "").replace(/−/g, "-").replace(/\./g, "").replace(",", ".");
  return parseFloat(s);
}
function neueFlaeche(w, h) {
  return svgEl("svg", { viewBox: `0 0 ${w} ${h}`, width: w, height: h, class: "geo-svg", preserveAspectRatio: "xMidYMid meet" });
}
function polygon(punkte, klasse) {
  return svgEl("polygon", { points: punkte.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" "), class: klasse });
}
function linie(p, q, klasse) {
  return svgEl("line", { x1: p.x.toFixed(2), y1: p.y.toFixed(2), x2: q.x.toFixed(2), y2: q.y.toFixed(2), class: klasse });
}
function mitte(p, q) {
  return { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 };
}
function regelEck(n, r, drehung = 90) {
  return Array.from({ length: n }, (_, i) => {
    const w = ((drehung + (i * 360) / n) * Math.PI) / 180;
    return { x: r * Math.cos(w), y: r * Math.sin(w) };
  });
}
function polyFlaeche(p) {
  let s = 0;
  for (let i = 0; i < p.length; i++) {
    const j = (i + 1) % p.length;
    s += p[i].x * p[j].y - p[j].x * p[i].y;
  }
  return Math.abs(s) / 2;
}
function polyUmfang(p) {
  let s = 0;
  for (let i = 0; i < p.length; i++) {
    const j = (i + 1) % p.length;
    s += Math.hypot(p[j].x - p[i].x, p[j].y - p[i].y);
  }
  return s;
}
function massstab(breiteEinheiten, hoeheEinheiten, platzB, platzH) {
  return Math.min(platzB / Math.max(breiteEinheiten, 0.001), platzH / Math.max(hoeheEinheiten, 0.001));
}
// Schrägbild: Tiefe nach rechts oben, Höhe nach oben.
const TIEFE_X = 0.42, TIEFE_Y = 0.30;
function schraeg(p, hoehe, px, ox, oy) {
  return { x: ox + p.x * px + p.y * px * TIEFE_X, y: oy - hoehe * px - p.y * px * TIEFE_Y };
}
// Maßstab UND Lage aus der Figur selbst berechnen, damit sie mittig in der
// Zeichenfläche steht statt am unteren Rand zu kleben — sonst wandert eine
// flache Figur ins Nichts und eine hohe stößt oben an.
function schraegRahmen(ecken, hoehe, platzB, platzH, cx, cy) {
  const xs = ecken.map((p) => p.x + TIEFE_X * p.y);
  const ys = ecken.map((p) => -TIEFE_Y * p.y);
  const xmin = Math.min(...xs), xmax = Math.max(...xs);
  const ymin = Math.min(-hoehe, ...ys), ymax = Math.max(...ys);
  const px = massstab(xmax - xmin, ymax - ymin, platzB, platzH);
  return {
    px,
    ox: cx - ((xmin + xmax) / 2) * px,
    oy: cy - ((ymin + ymax) / 2) * px,
    unten: cy + ((ymax - ymin) / 2) * px,
  };
}
// "=" oder "≈"? Wurzeln aus ganzen Zahlen sind entweder ganzzahlig oder
// irrational — ein exakter Wert darf nicht als Näherung ausgegeben werden.
function beschriftung(name, wert, stellen = 2) {
  return Number.isInteger(wert) ? `${name} = ${num(wert)}` : `${name} ≈ ${num(wert, stellen)}`;
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

// ================= 1. Die Pyramide =================

const PK_FORMEN = [
  { kuerzel: "Dreieck", formel: "3 Seitendreiecke", ecken: regelEck(3, 3.4, 90) },
  { kuerzel: "Quadrat", formel: "die klassische Pyramide", ecken: [{ x: -3, y: 3 }, { x: 3, y: 3 }, { x: 3, y: -3 }, { x: -3, y: -3 }] },
  { kuerzel: "Sechseck", formel: "6 Seitendreiecke", ecken: regelEck(6, 3.2, 90) },
];

let pkAktiv = 1;

function renderPyramide() {
  const h = Number(document.getElementById("pk-h").value);
  const alsNetz = document.getElementById("pk-netz").checked;
  document.getElementById("pk-h-anzeige").textContent = h + " cm";

  const reihe = document.getElementById("pk-reihe");
  reihe.innerHTML = "";
  PK_FORMEN.forEach((f, i) => {
    const btn = el("button", { type: "button", class: "py-koerper-karte" + (i === pkAktiv ? " aktiv" : "") }, [
      el("span", { class: "kuerzel" }, f.kuerzel),
      el("span", { class: "formel" }, f.formel),
    ]);
    btn.addEventListener("click", () => {
      pkAktiv = i;
      renderPyramide();
    });
    reihe.appendChild(btn);
  });

  const form = PK_FORMEN[pkAktiv];
  const n = form.ecken.length;
  const G = polyFlaeche(form.ecken);

  const svg = neueFlaeche(560, 340);
  const g = svgEl("g");

  if (alsNetz) {
    // Netz: die Grundfläche in der Mitte, an jede Seite ein Dreieck nach außen.
    // Die Dreiecke werden um die jeweilige Grundseite nach außen geklappt —
    // ihre Höhe ist die Seitenhöhe des Körpers.
    const inkreis = Math.min(...form.ecken.map((p, i) => {
      const q = form.ecken[(i + 1) % n];
      const l = Math.hypot(q.x - p.x, q.y - p.y);
      return Math.abs((q.x - p.x) * (0 - p.y) - (q.y - p.y) * (0 - p.x)) / l;
    }));
    const hs = Math.sqrt(h * h + inkreis * inkreis);
    // Die Spitzen zuerst in Einheiten ausrechnen — dann kennt man den wahren
    // Umriss des Netzes und kann ihn passgenau in die Fläche legen.
    const spitzenE = form.ecken.map((p, i) => {
      const q = form.ecken[(i + 1) % n];
      const m = { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 };
      const l = Math.hypot(m.x, m.y) || 1;
      return { x: m.x + (m.x / l) * hs, y: m.y + (m.y / l) * hs };
    });
    const alle = form.ecken.concat(spitzenE);
    const xmin = Math.min(...alle.map((p) => p.x)), xmax = Math.max(...alle.map((p) => p.x));
    const ymin = Math.min(...alle.map((p) => p.y)), ymax = Math.max(...alle.map((p) => p.y));
    const px = massstab(xmax - xmin, ymax - ymin, 460, 290);
    const ox = 280 - ((xmin + xmax) / 2) * px, oy = 165 - ((ymin + ymax) / 2) * px;
    const s = form.ecken.map((p) => ({ x: ox + p.x * px, y: oy + p.y * px }));
    g.appendChild(polygon(s, "py-grund"));
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const m = mitte(s[i], s[j]);
      const spitze = { x: ox + spitzenE[i].x * px, y: oy + spitzenE[i].y * px };
      g.appendChild(polygon([s[i], s[j], spitze], "py-mantel"));
      if (i === 0) {
        g.appendChild(linie(m, spitze, "py-seitenhoehe"));
        g.appendChild(svgText(mitte(m, spitze).x + 16, mitte(m, spitze).y, "hₛ", { class: "py-name-s", "text-anchor": "start" }));
      }
    }
    g.appendChild(svgText(ox, oy + 5, "G", { class: "py-name-g" }));
  } else {
    const { px, ox, oy, unten: tiefsterPunkt } = schraegRahmen(form.ecken, h, 430, 250, 280, 155);
    const unten = form.ecken.map((p) => schraeg(p, 0, px, ox, oy));
    const spitze = schraeg({ x: 0, y: 0 }, h, px, ox, oy);
    // Seitendreiecke zuerst, damit die Grundfläche darüber liegt
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      g.appendChild(polygon([unten[i], unten[j], spitze], i % 2 === 0 ? "py-mantel" : "py-mantel-hell"));
    }
    g.appendChild(polygon(unten, "py-grund"));
    for (let i = 0; i < n; i++) g.appendChild(linie(unten[i], spitze, "py-kante"));
    const fuss = schraeg({ x: 0, y: 0 }, 0, px, ox, oy);
    g.appendChild(linie(fuss, spitze, "py-hoehe"));
    g.appendChild(svgText(fuss.x - 8, mitte(fuss, spitze).y, "h = " + h, { class: "py-name-h", "text-anchor": "end" }));
    g.appendChild(svgEl("circle", { cx: fuss.x, cy: fuss.y, r: 3, fill: "#b3261e" }));
    // Beschriftung unter die Figur, nicht auf die Grundkante
    g.appendChild(svgText(ox, tiefsterPunkt + 22, "Grundfläche G", { class: "py-name-g" }));
  }

  svg.appendChild(g);
  const mount = document.getElementById("pk-mount");
  mount.innerHTML = "";
  mount.appendChild(svg);

  const gGanz = Number.isInteger(G);
  const vPyr = (G * h) / 3;
  document.getElementById("pk-bilanz").innerHTML =
    `Grundfläche: <span class="wg">G ${gGanz ? "=" : "≈"} ${num(G, 2)} cm²</span> &nbsp;·&nbsp; Höhe: <span class="wh">h = ${num(h)} cm</span><br>` +
    `Die Pyramide hat <strong>${n} Seitendreiecke</strong> und dazu die Grundfläche — zusammen ${n + 1} Flächen.<br>` +
    `<strong>V = ⅓ · G · h ${gGanz && Number.isInteger(vPyr) ? "=" : "≈"} ${num(vPyr, 2)} cm³</strong>`;

  document.getElementById("pk-text").textContent = alsNetz
    ? "Im Netz sieht man: Aus jeder Grundseite wird ein DREIECK, nicht wie beim Prisma ein Rechteck. Die Höhe dieser Dreiecke ist die Seitenhöhe — nicht die Körperhöhe."
    : "Alle Seitenkanten treffen sich in einem Punkt, der Spitze. Die Körperhöhe h steht senkrecht auf der Grundfläche und trifft sie bei einer regelmäßigen Pyramide im Mittelpunkt.";
}

function initPyramide() {
  ["pk-h", "pk-netz"].forEach((id) => document.getElementById(id).addEventListener("input", renderPyramide));
  renderPyramide();
}

// ================= 2. Der Faktor ein Drittel =================

function renderDrittel() {
  const G = Number(document.getElementById("dr-g").value);
  const h = Number(document.getElementById("dr-h").value);
  const fuell = Number(document.getElementById("dr-fuell").value);
  document.getElementById("dr-g-anzeige").textContent = G + " cm²";
  document.getElementById("dr-h-anzeige").textContent = h + " cm";
  document.getElementById("dr-fuell-anzeige").textContent = fuell + " von 3";

  const vPrisma = G * h;
  const vPyramide = vPrisma / 3;

  // Links das Prisma, rechts die Pyramide — gleiche Grundfläche, gleiche Höhe.
  const svg = neueFlaeche(560, 320);
  const g = svgEl("g");
  const breite = 5.2, tiefe = 3, luecke = 3;
  // Ein Körper ist (breite + 0,42·tiefe) breit und (h + 0,30·tiefe) hoch.
  // Beide zusammen mit einer Lücke dazwischen füllen die Fläche mittig aus.
  const einer = breite + tiefe * TIEFE_X;
  const px = massstab(2 * einer + luecke, h + tiefe * TIEFE_Y + 0.6, 470, 210);
  const oy = 148 + (px * (h + tiefe * TIEFE_Y)) / 2;
  const ox1 = (560 - px * (2 * einer + luecke)) / 2;
  const ox2 = ox1 + px * (einer + luecke);

  function grundEcken(ox, oy, z) {
    return [
      { x: ox, y: oy - z },
      { x: ox + breite * px, y: oy - z },
      { x: ox + breite * px + tiefe * px * TIEFE_X, y: oy - z - tiefe * px * TIEFE_Y },
      { x: ox + tiefe * px * TIEFE_X, y: oy - z - tiefe * px * TIEFE_Y },
    ];
  }

  const u1 = grundEcken(ox1, oy, 0), o1 = grundEcken(ox1, oy, h * px);
  g.appendChild(polygon([u1[0], u1[1], o1[1], o1[0]], "py-mantel"));
  g.appendChild(polygon([u1[1], u1[2], o1[2], o1[1]], "py-mantel-hell"));
  g.appendChild(polygon(o1, "py-grund"));
  g.appendChild(polygon(u1, "py-grund"));
  // Füllstand: jede Pyramidenfüllung ist ein Drittel der Prismenhöhe
  if (fuell > 0) {
    const fh = ((h * px) / 3) * fuell;
    const uf = grundEcken(ox1, oy, 0), of = grundEcken(ox1, oy, fh);
    g.appendChild(polygon([uf[0], uf[1], of[1], of[0]], "py-fuellung"));
    g.appendChild(polygon([uf[1], uf[2], of[2], of[1]], "py-fuellung"));
    g.appendChild(polygon(of, "py-fuellung"));
  }
  g.appendChild(svgText(ox1 + (einer * px) / 2, oy + 26, "Prisma: V = G · h", { class: "py-name-g" }));

  // Pyramide rechts
  const u2 = grundEcken(ox2, oy, 0);
  const spitze = {
    x: ox2 + (breite * px) / 2 + (tiefe * px * TIEFE_X) / 2,
    y: oy - h * px - (tiefe * px * TIEFE_Y) / 2,
  };
  g.appendChild(polygon([u2[0], u2[1], spitze], "py-mantel"));
  g.appendChild(polygon([u2[1], u2[2], spitze], "py-mantel-hell"));
  g.appendChild(polygon(u2, "py-grund"));
  [u2[0], u2[1], u2[2], u2[3]].forEach((p) => g.appendChild(linie(p, spitze, "py-kante")));
  const fuss2 = { x: spitze.x, y: oy - (tiefe * px * TIEFE_Y) / 2 };
  g.appendChild(linie(fuss2, spitze, "py-hoehe"));
  g.appendChild(svgText(ox2 + (einer * px) / 2, oy + 26, "Pyramide: V = ⅓ · G · h", { class: "py-name-g" }));

  svg.appendChild(g);
  const mount = document.getElementById("dr-mount");
  mount.innerHTML = "";
  mount.appendChild(svg);

  // Füllbalken
  const cm3 = (x) => `${Number.isInteger(x) ? "" : "≈ "}${num(x, 2)} cm³`;
  document.getElementById("dr-balken").innerHTML =
    `<div class="py-fuellsaeule"><div class="saeule" style="height:110px"><div class="inhalt" style="height:${(fuell / 3) * 110}px"></div></div>` +
    `<div class="wert">${cm3(vPyramide * fuell)}</div><div>im Prisma</div></div>` +
    `<div class="py-fuellsaeule"><div class="saeule" style="height:110px"><div class="inhalt" style="height:110px;opacity:0.2"></div></div>` +
    `<div class="wert">${cm3(vPrisma)}</div><div>Prisma voll</div></div>` +
    `<div class="py-fuellsaeule"><div class="saeule" style="height:36.67px"><div class="inhalt" style="height:36.67px"></div></div>` +
    `<div class="wert">${cm3(vPyramide)}</div><div>eine Pyramidenfüllung</div></div>`;

  // ⅓ von G · h geht nur auf, wenn G · h durch 3 teilbar ist — sonst ist der
  // angezeigte Wert gerundet und muss mit ≈ ausgewiesen werden.
  const glatt = Number.isInteger(vPyramide);
  const imPrisma = vPyramide * fuell;
  const prozent = (fuell / 3) * 100;
  document.getElementById("dr-bilanz").innerHTML =
    `<span class="wg">G = ${num(G)} cm²</span>, <span class="wh">h = ${num(h)} cm</span> — für <strong>beide</strong> Körper gleich.<br>` +
    `Prisma: V = G · h = ${num(G)} · ${num(h)} = <strong>${num(vPrisma)} cm³</strong><br>` +
    `Pyramide: V = ⅓ · G · h = ${num(vPrisma)} : 3 ${glatt ? "=" : "≈"} <strong>${num(vPyramide, 3)} cm³</strong><br>` +
    `Nach ${fuell} von 3 Füllungen sind ${Number.isInteger(imPrisma) ? "" : "rund "}<strong>${num(imPrisma, 3)} cm³</strong> im Prisma — ` +
    `das ${Number.isInteger(prozent) ? "sind" : "sind rund"} ${num(prozent, 1)} %.`;

  document.getElementById("dr-text").textContent =
    fuell === 3
      ? "Drei Pyramidenfüllungen füllen das Prisma genau aus. Genau das besagt der Faktor ⅓."
      : "Schiebe den Regler: Jede Füllung der Pyramide bringt ein Drittel des Prismenvolumens.";
}

function initDrittel() {
  ["dr-g", "dr-h", "dr-fuell"].forEach((id) => document.getElementById(id).addEventListener("input", renderDrittel));
  renderDrittel();
}

// ================= 3. Körperhöhe, Seitenhöhe, Seitenkante =================

function renderHoehen() {
  const a = Number(document.getElementById("hh-a").value);
  const h = Number(document.getElementById("hh-h").value);
  const was = document.getElementById("hh-was").value;
  document.getElementById("hh-a-anzeige").textContent = a + " cm";
  document.getElementById("hh-h-anzeige").textContent = h + " cm";

  const halbA = a / 2;
  const d = a * Math.SQRT2;            // Diagonale der quadratischen Grundfläche
  const hs = Math.sqrt(h * h + halbA * halbA);
  const k = Math.sqrt(h * h + (d / 2) * (d / 2));

  const ecken = [{ x: -halbA, y: halbA }, { x: halbA, y: halbA }, { x: halbA, y: -halbA }, { x: -halbA, y: -halbA }];
  const { px, ox, oy } = schraegRahmen(ecken, h, 400, 240, 265, 155);
  const unten = ecken.map((p) => schraeg(p, 0, px, ox, oy));
  const spitze = schraeg({ x: 0, y: 0 }, h, px, ox, oy);
  const fuss = schraeg({ x: 0, y: 0 }, 0, px, ox, oy);

  const svg = neueFlaeche(560, 340);
  const g = svgEl("g");
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4;
    g.appendChild(polygon([unten[i], unten[j], spitze], i % 2 === 0 ? "py-mantel" : "py-mantel-hell"));
  }
  g.appendChild(polygon(unten, "py-grund"));
  for (let i = 0; i < 4; i++) g.appendChild(linie(unten[i], spitze, "py-kante"));
  g.appendChild(linie(fuss, spitze, "py-hoehe"));
  g.appendChild(svgEl("circle", { cx: fuss.x, cy: fuss.y, r: 3, fill: "#b3261e" }));
  g.appendChild(svgText(fuss.x - 8, mitte(fuss, spitze).y, "h = " + num(h), { class: "py-name-h", "text-anchor": "end" }));

  if (was === "hs") {
    // Seitenhöhe: vom Fußpunkt zur Mitte der vorderen Grundkante, dann hoch zur Spitze
    const kanteMitte = mitte(unten[0], unten[1]);
    g.appendChild(linie(fuss, kanteMitte, "py-radius"));
    g.appendChild(svgText(mitte(fuss, kanteMitte).x + 4, mitte(fuss, kanteMitte).y + 16, "a : 2 = " + num(halbA, 2), { class: "py-name-r" }));
    g.appendChild(linie(kanteMitte, spitze, "py-seitenhoehe"));
    g.appendChild(svgText(mitte(kanteMitte, spitze).x + 34, mitte(kanteMitte, spitze).y, beschriftung("hₛ", hs), { class: "py-name-s" }));
  } else {
    // Seitenkante: vom Fußpunkt zu einer Ecke (halbe Diagonale), dann hoch
    g.appendChild(linie(fuss, unten[1], "py-radius"));
    g.appendChild(svgText(mitte(fuss, unten[1]).x + 6, mitte(fuss, unten[1]).y + 16, "d : 2 ≈ " + num(d / 2, 2), { class: "py-name-r" }));
    g.appendChild(linie(unten[1], spitze, "py-seitenhoehe"));
    g.appendChild(svgText(mitte(unten[1], spitze).x + 28, mitte(unten[1], spitze).y, beschriftung("k", k), { class: "py-name-s" }));
  }

  svg.appendChild(g);
  const mount = document.getElementById("hh-mount");
  mount.innerHTML = "";
  mount.appendChild(svg);

  const G = a * a;
  const M = 4 * (a * hs) / 2;
  document.getElementById("hh-bilanz").innerHTML =
    was === "hs"
      ? `Rechtwinkliges Dreieck aus <span class="wh">h = ${num(h)}</span> und <span class="wr">a : 2 = ${num(halbA, 2)}</span>:<br>` +
        `<span class="ws">hₛ² = h² + (a : 2)² = ${num(h * h)} + ${num(halbA * halbA, 2)} = ${num(h * h + halbA * halbA, 2)}</span><br>` +
        `<span class="ws">hₛ = √${num(h * h + halbA * halbA, 2)} ${Number.isInteger(hs) ? "=" : "≈"} ${num(hs, 3)} cm</span> — und hₛ ist stets <em>länger</em> als h.<br>` +
        `Damit die Oberfläche: O = a² + 4 · ½ · a · hₛ = ${num(G)} + ${num(M, 2)} = <strong>${num(G + M, 2)} cm²</strong>`
      : `Rechtwinkliges Dreieck aus <span class="wh">h = ${num(h)}</span> und der halben Diagonalen <span class="wr">d : 2 ≈ ${num(d / 2, 3)}</span>:<br>` +
        `Grundflächendiagonale: d = a · √2 = ${num(a)} · √2 ≈ ${num(d, 3)} cm<br>` +
        `<span class="ws">k² = h² + (d : 2)² = ${num(h * h)} + ${num((d / 2) * (d / 2), 2)} = ${num(h * h + (d / 2) * (d / 2), 2)}</span><br>` +
        `<span class="ws">k = √${num(h * h + (d / 2) * (d / 2), 2)} ${Number.isInteger(k) ? "=" : "≈"} ${num(k, 3)} cm</span> — die Seitenkante ist noch länger als die Seitenhöhe.`;

  document.getElementById("hh-text").textContent =
    was === "hs"
      ? `Vergleiche: h = ${num(h)} cm, aber hₛ ${Number.isInteger(hs) ? "=" : "≈"} ${num(hs, 2)} cm. Für die Seitendreiecke wird immer hₛ gebraucht, nie h.`
      : `Es gilt immer h < hₛ < k. Hier: ${num(h)} < ${num(hs, 2)} < ${num(k, 2)}.`;
}

function initHoehen() {
  ["hh-a", "hh-h"].forEach((id) => document.getElementById(id).addEventListener("input", renderHoehen));
  document.getElementById("hh-was").addEventListener("change", renderHoehen);
  renderHoehen();
}

// ================= 4. Der Kegel =================

function renderKegel() {
  const r = Number(document.getElementById("kg-r").value);
  const h = Number(document.getElementById("kg-h").value);
  const abwickeln = document.getElementById("kg-abwickeln").checked;
  document.getElementById("kg-r-anzeige").textContent = r + " cm";
  document.getElementById("kg-h-anzeige").textContent = h + " cm";

  const s = Math.sqrt(r * r + h * h);
  const G = Math.PI * r * r;
  const M = Math.PI * r * s;
  const V = (G * h) / 3;
  // Der abgewickelte Mantel ist ein Kreisausschnitt mit Radius s, dessen
  // Bogen den Grundkreisumfang 2πr hat. Der Winkel folgt daraus:
  // alpha/360 = (2πr)/(2πs) = r/s.
  const alpha = (r / s) * 360;

  const svg = neueFlaeche(560, 340);
  const g = svgEl("g");

  if (abwickeln) {
    // Ausschnitt (Radius s) und Grundkreis (Radius r) stehen nebeneinander.
    // Beide gehen in den Maßstab ein, sonst läuft der Grundkreis bei kleinem h
    // (dann ist r fast so groß wie s) unten aus dem Bild. Und der Ausschnitt
    // wird mit seinem WIRKLICHEN Umriss vermessen: bei kleinem α ist er ein
    // schmaler Keil und nicht die ganze Kreisscheibe.
    const w = (alpha * Math.PI) / 180;
    const rand = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: Math.cos(w), y: Math.sin(w) }];
    for (const v of [Math.PI / 2, Math.PI, 1.5 * Math.PI]) {
      if (v < w) rand.push({ x: Math.cos(v), y: Math.sin(v) });
    }
    const ax0 = Math.min(...rand.map((p) => p.x)), ax1 = Math.max(...rand.map((p) => p.x));
    const ay0 = Math.min(...rand.map((p) => p.y)), ay1 = Math.max(...rand.map((p) => p.y));
    const bA = { x: (ax1 - ax0) * s, y: (ay1 - ay0) * s };
    const luecke = 0.12 * (bA.x + 2 * r);
    const gesamtB = bA.x + luecke + 2 * r;
    const px = massstab(gesamtB, Math.max(bA.y, 2 * r), 500, 250);
    const rp = s * px;
    const x0 = (560 - gesamtB * px) / 2;
    const cy = 155;
    const M0 = { x: x0 - ax0 * s * px, y: cy + ((ay0 + ay1) / 2) * s * px };
    const p1 = { x: M0.x + rp, y: M0.y };
    const p2 = { x: M0.x + rp * Math.cos(w), y: M0.y - rp * Math.sin(w) };
    const gross = alpha > 180 ? 1 : 0;
    g.appendChild(svgEl("path", {
      d: `M ${M0.x} ${M0.y} L ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} A ${rp.toFixed(2)} ${rp.toFixed(2)} 0 ${gross} 0 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)} Z`,
      class: "py-mantel",
    }));
    g.appendChild(linie(M0, p1, "py-seitenhoehe"));
    g.appendChild(svgText(mitte(M0, p1).x, mitte(M0, p1).y - 8, beschriftung("s", s), { class: "py-name-s" }));
    g.appendChild(svgText(M0.x + rp * 0.55 * Math.cos(w / 2), M0.y - rp * 0.55 * Math.sin(w / 2), num(alpha, 1) + "°", { class: "py-name-m" }));
    // Der Grundkreis daneben
    const kx = x0 + (bA.x + luecke + r) * px, ky = cy;
    g.appendChild(svgEl("circle", { cx: kx.toFixed(2), cy: ky, r: (r * px).toFixed(2), class: "py-grund" }));
    g.appendChild(linie({ x: kx, y: ky }, { x: kx + r * px, y: ky }, "py-radius"));
    g.appendChild(svgText(kx + (r * px) / 2, ky - 6, "r = " + num(r), { class: "py-name-r" }));
    g.appendChild(svgText(kx, ky + r * px + 20, "Grundkreis", { class: "py-name-g" }));
  } else {
    const ecken = regelEck(60, r, 90);
    const { px, ox, oy, unten: tiefsterPunkt } = schraegRahmen(ecken, h, 400, 240, 275, 150);
    const unten = ecken.map((p) => schraeg(p, 0, px, ox, oy));
    const spitze = schraeg({ x: 0, y: 0 }, h, px, ox, oy);
    // Konturlose Facetten — mit Kontur sähe der Kegel gestreift aus.
    for (let i = 0; i < unten.length; i++) {
      const j = (i + 1) % unten.length;
      g.appendChild(polygon([unten[i], unten[j], spitze], "py-mantel-glatt"));
    }
    // Silhouette
    const links = unten.reduce((a, b) => (a.x < b.x ? a : b));
    const rechts = unten.reduce((a, b) => (a.x > b.x ? a : b));
    g.appendChild(linie(links, spitze, "py-kante"));
    g.appendChild(linie(rechts, spitze, "py-kante"));
    g.appendChild(polygon(unten, "py-grund"));
    const fuss = schraeg({ x: 0, y: 0 }, 0, px, ox, oy);
    g.appendChild(linie(fuss, spitze, "py-hoehe"));
    g.appendChild(svgText(fuss.x - 8, mitte(fuss, spitze).y, "h = " + num(h), { class: "py-name-h", "text-anchor": "end" }));
    g.appendChild(linie(fuss, rechts, "py-radius"));
    // unter den Grundkreis, sonst liegt die Beschriftung auf der Ellipse
    g.appendChild(svgText(mitte(fuss, rechts).x, tiefsterPunkt + 20, "r = " + num(r), { class: "py-name-r" }));
    g.appendChild(linie(rechts, spitze, "py-seitenhoehe"));
    g.appendChild(svgText(mitte(rechts, spitze).x + 26, mitte(rechts, spitze).y, beschriftung("s", s), { class: "py-name-s", "text-anchor": "start" }));
  }

  svg.appendChild(g);
  const mount = document.getElementById("kg-mount");
  mount.innerHTML = "";
  mount.appendChild(svg);

  document.getElementById("kg-bilanz").innerHTML =
    `<span class="ws">s² = r² + h² = ${num(r * r)} + ${num(h * h)} = ${num(r * r + h * h)}</span> &nbsp;→&nbsp; ` +
    `<span class="ws">s = √${num(r * r + h * h)} ${Number.isInteger(s) ? "=" : "≈"} ${num(s, 3)} cm</span><br>` +
    `<span class="wg">G = π · ${num(r)}² ≈ ${num(G, 2)} cm²</span> &nbsp;·&nbsp; ` +
    `<span class="wm">M = π · r · s = π · ${num(r)} · ${num(s, 3)} ≈ ${num(M, 2)} cm²</span><br>` +
    `<strong>V = ⅓ · π · r² · h ≈ ${num(V, 2)} cm³</strong> &nbsp;·&nbsp; <strong>O = G + M ≈ ${num(G + M, 2)} cm²</strong><br>` +
    `Abgewickelter Mantel: Kreisausschnitt mit Radius s und Winkel α = (r : s) · 360° ≈ ${num(alpha, 1)}°`;

  document.getElementById("kg-text").textContent = abwickeln
    ? `Der Bogen des Ausschnitts ist genau der Grundkreisumfang 2 · π · ${num(r)} ≈ ${num(2 * Math.PI * r, 2)} cm. Daraus folgt der Winkel α = (r : s) · 360°.`
    : "In M = π · r · s steht die Mantellinie s, nicht die Höhe h. Vergleiche die violette und die rote Strecke: s ist immer länger.";
}

function initKegel() {
  ["kg-r", "kg-h", "kg-abwickeln"].forEach((id) => document.getElementById(id).addEventListener("input", renderKegel));
  renderKegel();
}

// ================= 5. Die Kugel =================

function renderKugel() {
  const r = Number(document.getElementById("ku-r").value);
  const mitZylinder = document.getElementById("ku-zylinder").checked;
  document.getElementById("ku-r-anzeige").textContent = r + " cm";

  const V = (4 / 3) * Math.PI * r * r * r;
  const O = 4 * Math.PI * r * r;
  const vZylinder = Math.PI * r * r * (2 * r);
  const grosskreis = Math.PI * r * r;

  const svg = neueFlaeche(420, 300);
  const g = svgEl("g");
  const px = massstab(2 * r, 2 * r, 210, 240);
  const M0 = { x: 210, y: 150 };
  const rp = r * px;

  if (mitZylinder) {
    // Umschreibender Zylinder: Radius r, Höhe 2r
    // Ein Zylinder hat zwei Mantellinien und zwei Kreise — kein Rechteck.
    // Die Höhe ist 2r, die Breite ebenfalls: die Kugel berührt ihn überall.
    const ry = rp * 0.42 * 0.7;
    const oben = M0.y - rp, unten = M0.y + rp;
    for (const vz of [-1, 1]) {
      g.appendChild(linie({ x: M0.x + vz * rp, y: oben }, { x: M0.x + vz * rp, y: unten }, "py-hilfslinie"));
    }
    g.appendChild(svgEl("ellipse", { cx: M0.x, cy: oben.toFixed(2), rx: rp.toFixed(2), ry: ry.toFixed(2), class: "py-hilfslinie" }));
    g.appendChild(svgEl("ellipse", { cx: M0.x, cy: unten.toFixed(2), rx: rp.toFixed(2), ry: ry.toFixed(2), class: "py-hilfslinie" }));
    g.appendChild(svgText(M0.x + rp + 36, M0.y, "Zylinder", { class: "py-hinweistext" }));
    g.appendChild(svgText(M0.x + rp + 36, M0.y + 15, "h = 2r", { class: "py-hinweistext" }));
  }

  g.appendChild(svgEl("circle", { cx: M0.x, cy: M0.y, r: rp.toFixed(2), class: "py-kugel" }));
  // Ein paar Breitenkreise, damit die Kugel räumlich wirkt
  for (const t of [-0.6, -0.3, 0, 0.3, 0.6]) {
    g.appendChild(svgEl("ellipse", {
      cx: M0.x, cy: (M0.y + t * rp).toFixed(2),
      rx: (rp * Math.sqrt(1 - t * t)).toFixed(2), ry: (rp * Math.sqrt(1 - t * t) * 0.28).toFixed(2),
      class: "py-breitenkreis",
    }));
  }
  g.appendChild(linie(M0, { x: M0.x + rp, y: M0.y }, "py-radius"));
  g.appendChild(svgText(M0.x + rp / 2, M0.y - 8, "r = " + num(r), { class: "py-name-r" }));
  g.appendChild(svgEl("circle", { cx: M0.x, cy: M0.y, r: 3, fill: "#1d4ed8" }));

  svg.appendChild(g);
  const mount = document.getElementById("ku-mount");
  mount.innerHTML = "";
  mount.appendChild(svg);

  document.getElementById("ku-bilanz").innerHTML =
    `<strong>V = ⁴⁄₃ · π · r³ = ⁴⁄₃ · π · ${num(r)}³ = ⁴⁄₃ · π · ${num(r * r * r)} ≈ ${num(V, 2)} cm³</strong><br>` +
    `<strong>O = 4 · π · r² = 4 · π · ${num(r * r)} ≈ ${num(O, 2)} cm²</strong><br>` +
    `Umschreibender Zylinder (r = ${num(r)}, h = ${num(2 * r)}): V = π · ${num(r * r)} · ${num(2 * r)} = ${num(2 * r * r * r)}π ≈ ${num(vZylinder, 2)} cm³<br>` +
    `Verhältnis Kugel : Zylinder = ⁴⁄₃ · π · r³ : 2 · π · r³ = ⁴⁄₃ : 2 = <strong>⅔</strong> — für <em>jeden</em> Radius derselbe Wert.`;

  document.getElementById("ku-tabelle").innerHTML =
    "<tr><th>Größe</th><th>Formel</th><th>Wert bei r = " + num(r) + "</th></tr>" +
    [
      ["Großkreisfläche", "π · r²", num(grosskreis, 2) + " cm²"],
      ["Kugeloberfläche", "4 · π · r² = 4 Großkreise", num(O, 2) + " cm²"],
      ["Kugelvolumen", "⁴⁄₃ · π · r³", num(V, 2) + " cm³"],
      ["umschreibender Zylinder", "π · r² · 2r", num(vZylinder, 2) + " cm³"],
    ]
      .map((z, i) => `<tr><td>${z[0]}</td><td${i === 1 || i === 2 ? ' class="drittel"' : ""}>${z[1]}</td><td>${z[2]}</td></tr>`)
      .join("");

  document.getElementById("ku-text").textContent =
    "Zwei Merkhilfen: Die Kugel füllt genau zwei Drittel des Zylinders, in den sie passt. Und ihre Oberfläche ist genau viermal die Fläche eines Großkreises.";
}

function initKugel() {
  ["ku-r", "ku-zylinder"].forEach((id) => document.getElementById(id).addEventListener("input", renderKugel));
  renderKugel();
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

// Wählt den letzten Parameter so, dass Lösung und alle Fehlerwerte paarweise
// verschieden bleiben — kein Verwerfen und Neuziehen, sondern Auswahl aus
// einer vorher gefilterten Liste. (Übernommen aus Thema 11.)
// eps: Mindestabstand. Bei gerundeten Antworten muss er über der Toleranz der
// Prüfung liegen, sonst könnte ein Hinweiswert doch noch als richtig durchgehen.
function ohneKollision(kandidaten, werte, notfall, eps = 1e-9) {
  const sauber = kandidaten.filter((kk) => {
    const alle = werte(kk);
    return alle.every((x, i) => alle.every((y, j) => i === j || Math.abs(x - y) > eps));
  });
  return sauber.length ? pick(sauber) : notfall;
}

// Aufgabe 1 — Volumen einer quadratischen Pyramide. Konstruktiv ganzzahlig:
// a² · h wird durch 3 teilbar gemacht, indem h bei Bedarf ein Vielfaches von 3 ist.
function generateAufgabe1() {
  const a = randInt(2, 12);
  const G = a * a;
  // Kandidaten für h: nur solche, bei denen G · h durch 3 teilbar ist —
  // sonst wäre das Volumen keine glatte Zahl.
  const moeglich = [];
  for (let k = 2; k <= 15; k++) if ((G * k) % 3 === 0) moeglich.push(k);
  // Die Liste enthält genau die Werte, die unten als Hinweis auftauchen:
  // Lösung, Prismenvolumen, Grundfläche, halbiert statt gedrittelt, a statt a².
  const h = ohneKollision(moeglich, (k) => [(G * k) / 3, G * k, G, (G * k) / 2, (a * k) / 3], moeglich[0]);
  const V = (G * h) / 3;

  return {
    promptHtml:
      `Eine Pyramide hat eine <strong>quadratische</strong> Grundfläche mit der Kantenlänge <strong>a = ${num(a)} cm</strong> ` +
      `und die Höhe <strong>h = ${num(h)} cm</strong>.<br>` +
      `Wie groß ist ihr Volumen in Kubikzentimetern?`,
    correct: V,
    placeholder: "V in cm³",
    hinweis: (raw, val) => {
      if (Math.abs(val - G * h) < 0.01)
        return `Das ist das Volumen des <strong>Prismas</strong> mit derselben Grundfläche und Höhe. Die Pyramide fasst nur ein Drittel davon: ${num(G * h)} : 3 = ${num(V)}.`;
      if (Math.abs(val - G) < 0.01)
        return `${num(G)} cm² ist erst die <strong>Grundfläche</strong> a² = ${num(a)}². Es fehlt noch · h und die Drittelung.`;
      if (Math.abs(val - (G * h) / 2) < 0.01)
        return `Du hast <strong>halbiert</strong> statt gedrittelt. Bei Pyramide und Kegel steht ⅓, nicht ½.`;
      if (Math.abs(val - (a * h) / 3) < 0.01)
        return `In V = ⅓ · G · h steht für G die ganze <strong>Grundfläche</strong> a² = ${num(G)} cm², nicht die Kantenlänge a.`;
      return `Erst G = a², dann V = ⅓ · G · h.`;
    },
    musterloesungHtml:
      `<strong>1. Grundfläche:</strong> G = a² = ${num(a)}² = <strong>${num(G)} cm²</strong><br>` +
      `<strong>2. Volumen:</strong> V = ⅓ · G · h = ⅓ · ${num(G)} · ${num(h)} = ${num(G * h)} : 3 = <strong>${num(V)} cm³</strong><br>` +
      `<em>Vergleich:</em> Ein Prisma mit derselben Grundfläche und Höhe fasste ${num(G * h)} cm³ — dreimal so viel.`,
  };
}

// Aufgabe 2 — Seitenhöhe und Oberfläche einer quadratischen Pyramide.
// Konstruktiv: (a/2, h, h_s) bildet ein pythagoreisches Tripel, damit h_s
// ganzzahlig ist und die Oberfläche glatt aufgeht.
const TRIPEL = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15], [12, 16, 20], [7, 24, 25]];

function generateAufgabe2() {
  // x ist die halbe Grundkante, y die Körperhöhe, z die Seitenhöhe.
  // Tripel aussortieren, bei denen die Lösung O mit einem Fehlerwert
  // zusammenfiele — bei (6,8,10) etwa ist V zufällig genau so groß wie O.
  const [x, y, z] = ohneKollision(
    TRIPEL,
    ([p, q, w]) => {
      const aa = 2 * p, GG = aa * aa, MM = 2 * aa * w;
      return [GG + MM, GG + 2 * aa * q, MM, 2 * GG + MM, (GG * q) / 3];
    },
    TRIPEL[0],
    0.05
  );
  const a = 2 * x, h = y, hs = z;
  const G = a * a;
  const M = 2 * a * hs;      // 4 · ½ · a · hs
  const O = G + M;

  return {
    promptHtml:
      `Eine quadratische Pyramide hat die Grundkante <strong>a = ${num(a)} cm</strong> und die Körperhöhe <strong>h = ${num(h)} cm</strong>.<br>` +
      `Wie groß ist ihre <strong>Oberfläche</strong> in Quadratzentimetern?`,
    correct: O,
    placeholder: "O in cm²",
    hinweis: (raw, val) => {
      if (Math.abs(val - (G + 2 * a * h)) < 0.01)
        return `Du hast in den Seitendreiecken die <strong>Körperhöhe h = ${num(h)}</strong> benutzt. Dort gehört die <em>Seitenhöhe</em> hₛ = ${num(hs)} cm hin — sie ist länger.`;
      if (Math.abs(val - M) < 0.01)
        return `${num(M)} cm² ist nur der <strong>Mantel</strong>. Bei der Pyramide kommt die Grundfläche einmal dazu: O = G + M.`;
      if (Math.abs(val - (2 * G + M)) < 0.01)
        return `Du hast die Grundfläche <strong>doppelt</strong> gezählt. Eine Pyramide hat keine Deckfläche: O = <strong>1</strong> · G + M.`;
      if (Math.abs(val - (G * h) / 3) < 0.01)
        return `Das ist das <strong>Volumen</strong> in cm³. Gefragt ist eine Fläche.`;
      return `Erst hₛ aus h und a : 2 (Pythagoras), dann O = a² + 4 · ½ · a · hₛ.`;
    },
    musterloesungHtml:
      `<strong>1. Seitenhöhe (Pythagoras):</strong> hₛ² = h² + (a : 2)² = ${num(h)}² + ${num(a / 2)}² = ${num(h * h)} + ${num((a / 2) * (a / 2))} = ${num(hs * hs)}<br>` +
      `hₛ = √${num(hs * hs)} = <strong>${num(hs)} cm</strong><br>` +
      `<strong>2. Grundfläche:</strong> G = a² = ${num(G)} cm²<br>` +
      `<strong>3. Mantel:</strong> M = 4 · ½ · a · hₛ = 2 · ${num(a)} · ${num(hs)} = ${num(M)} cm²<br>` +
      `<strong>4. Oberfläche:</strong> O = G + M = ${num(G)} + ${num(M)} = <strong>${num(O)} cm²</strong><br>` +
      `<em>Achtung:</em> Mit der Körperhöhe ${num(h)} statt ${num(hs)} käme ${num(G + 2 * a * h)} cm² heraus — zu wenig.`,
  };
}

// Aufgabe 3 — Kegel: Mantellinie und Mantelfläche. Konstruktiv über ein
// pythagoreisches Tripel, damit s ganzzahlig ist.
function generateAufgabe3() {
  // Auch hier gibt es Tripel mit Kollisionen: bei (3,4,5) ist π·r·h genau so
  // groß wie das Volumen, bei (6,8,10) die Oberfläche genau so groß wie das
  // Volumen. Beides würde zwei Hinweise ununterscheidbar machen.
  const [x, y, z] = ohneKollision(
    TRIPEL,
    ([p, q, w]) => {
      const MM = Math.PI * p * w;
      return [MM, Math.PI * p * q, Math.PI * p * p + MM, (Math.PI * p * p * q) / 3, 2 * MM];
    },
    TRIPEL[2],
    0.05
  );
  const r = x, h = y, s = z;
  const M = Math.PI * r * s;
  const V = (Math.PI * r * r * h) / 3;
  const O = Math.PI * r * r + M;

  return {
    promptHtml:
      `Ein Kegel hat den Grundkreisradius <strong>r = ${num(r)} cm</strong> und die Höhe <strong>h = ${num(h)} cm</strong>.<br>` +
      `Wie groß ist seine <strong>Mantelfläche</strong> in Quadratzentimetern?<br>` +
      `<span class="progress-note">Runde auf zwei Nachkommastellen.</span>`,
    correct: M,
    tolerance: 0.015,
    placeholder: "M in cm²",
    hinweis: (raw, val) => {
      if (Math.abs(val - Math.PI * r * h) < 0.02)
        return `Du hast die <strong>Höhe h = ${num(h)}</strong> eingesetzt. In M = π · r · s steht die <em>Mantellinie</em> s = ${num(s)} cm — sie ist länger als h.`;
      if (Math.abs(val - O) < 0.02)
        return `Das ist die <strong>gesamte Oberfläche</strong> O = π · r² + M. Gefragt ist nur der Mantel.`;
      if (Math.abs(val - V) < 0.02)
        return `Das ist das <strong>Volumen</strong> in cm³. Gefragt ist eine Fläche.`;
      if (Math.abs(val - 2 * Math.PI * r * s) < 0.02)
        return `Eine <strong>2 zu viel</strong>. Beim Zylinder ist M = 2πrh, beim Kegel aber M = π · r · s — ohne Faktor 2.`;
      return `Erst s aus r und h (Pythagoras), dann M = π · r · s.`;
    },
    musterloesungHtml:
      `<strong>1. Mantellinie (Pythagoras):</strong> s² = r² + h² = ${num(r)}² + ${num(h)}² = ${num(r * r)} + ${num(h * h)} = ${num(s * s)}<br>` +
      `s = √${num(s * s)} = <strong>${num(s)} cm</strong><br>` +
      `<strong>2. Mantelfläche:</strong> M = π · r · s = π · ${num(r)} · ${num(s)} = ${num(r * s)}π ≈ <strong>${num(M, 2)} cm²</strong><br>` +
      `<em>Zum Vergleich:</em> Volumen V = ⅓ · π · r² · h ≈ ${num(V, 2)} cm³, Oberfläche O ≈ ${num(O, 2)} cm².`,
  };
}

// Aufgabe 4 — zusammengesetzter Körper: Zylinder mit aufgesetzter Halbkugel
// (Silo) oder mit aufgesetztem Kegel (Turm). Zwei Teilvolumina addieren.
function generateAufgabe4() {
  const halbkugel = Math.random() < 0.5;
  const r = randInt(2, 8);
  const aufsatz = (rr) => (halbkugel ? (2 / 3) * Math.PI * rr * rr * rr : (Math.PI * rr * rr * rr) / 3);
  const ganz = (rr) => (halbkugel ? (4 / 3) * Math.PI * rr * rr * rr : Math.PI * rr * rr * rr);
  // Bei r = 6 und h = 4 wäre der Zylinder exakt so groß wie die Halbkugel —
  // dann trügen zwei Hinweise denselben Wert. Solche Höhen fallen heraus.
  const h = ohneKollision(
    [3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    (k) => {
      const vz = Math.PI * r * r * k;
      return [vz + aufsatz(r), vz, aufsatz(r), vz + ganz(r)];
    },
    3,
    0.05
  );
  const vZylinder = Math.PI * r * r * h;
  const vAufsatz = aufsatz(r);
  const V = vZylinder + vAufsatz;

  return {
    promptHtml:
      (halbkugel
        ? `Ein Silo besteht aus einem <strong>Zylinder</strong> mit dem Radius <strong>r = ${num(r)} m</strong> und der Höhe <strong>${num(h)} m</strong>, ` +
          `auf den oben eine <strong>Halbkugel</strong> mit demselben Radius aufgesetzt ist.`
        : `Ein Turm besteht aus einem <strong>Zylinder</strong> mit dem Radius <strong>r = ${num(r)} m</strong> und der Höhe <strong>${num(h)} m</strong>, ` +
          `auf den oben ein <strong>Kegel</strong> mit demselben Radius und der Höhe <strong>${num(r)} m</strong> aufgesetzt ist.`) +
      `<br>Wie groß ist das <strong>Gesamtvolumen</strong> in Kubikmetern?<br>` +
      `<span class="progress-note">Runde auf zwei Nachkommastellen.</span>`,
    correct: V,
    tolerance: 0.015,
    placeholder: "V in m³",
    hinweis: (raw, val) => {
      if (Math.abs(val - vZylinder) < 0.02)
        return `Das ist nur der <strong>Zylinder</strong>. Der ${halbkugel ? "Halbkugel" : "Kegel"}-Aufsatz mit ≈ ${num(vAufsatz, 2)} m³ fehlt noch.`;
      if (Math.abs(val - vAufsatz) < 0.02)
        return `Das ist nur der <strong>Aufsatz</strong>. Der Zylinder mit ≈ ${num(vZylinder, 2)} m³ kommt dazu.`;
      if (halbkugel && Math.abs(val - (vZylinder + (4 / 3) * Math.PI * r * r * r)) < 0.02)
        return `Du hast eine <strong>ganze Kugel</strong> gerechnet. Oben sitzt nur eine <em>halbe</em>: ⅔ · π · r³ statt ⁴⁄₃ · π · r³.`;
      if (!halbkugel && Math.abs(val - (vZylinder + Math.PI * r * r * r)) < 0.02)
        return `Beim Kegel fehlt das <strong>Drittel</strong>: V = ⅓ · π · r² · h, nicht π · r² · h.`;
      return `Beide Teilvolumina einzeln ausrechnen und addieren.`;
    },
    musterloesungHtml:
      `<strong>1. Zylinder:</strong> V₁ = π · r² · h = π · ${num(r * r)} · ${num(h)} = ${num(r * r * h)}π ≈ ${num(vZylinder, 2)} m³<br>` +
      (halbkugel
        ? `<strong>2. Halbkugel:</strong> V₂ = ½ · ⁴⁄₃ · π · r³ = ⅔ · π · ${num(r * r * r)} ≈ ${num(vAufsatz, 2)} m³<br>`
        : `<strong>2. Kegel:</strong> V₂ = ⅓ · π · r² · h = ⅓ · π · ${num(r * r)} · ${num(r)} ≈ ${num(vAufsatz, 2)} m³<br>`) +
      `<strong>3. Zusammen:</strong> V = V₁ + V₂ ≈ <strong>${num(V, 2)} m³</strong><br>` +
      `<em>Merke:</em> Volumina zusammengesetzter Körper werden addiert. Beim <em>Oberflächeninhalt</em> zählt dagegen nur, was wirklich außen liegt — die Kreisfläche zwischen den beiden Teilen gehört nicht dazu.`,
  };
}

function initExercises() {
  mountUebungsaufgaben(document.getElementById("exercises-mount"), [
    { schwierigkeit: "einfach", titel: "Aufgabe 1 — Volumen einer Pyramide", generate: generateAufgabe1 },
    { schwierigkeit: "mittel", titel: "Aufgabe 2 — Oberfläche einer Pyramide", generate: generateAufgabe2 },
    { schwierigkeit: "schwierig", titel: "Aufgabe 3 — Mantelfläche eines Kegels", generate: generateAufgabe3 },
    { schwierigkeit: "komplex", titel: "Aufgabe 4 — zusammengesetzter Körper", generate: generateAufgabe4 },
  ]);
}

// ================= Quizze =================

function initQuizzes() {
  mountQuiz(document.getElementById("quiz-pyramide"), {
    q: "Wie viele Flächen hat eine Pyramide mit sechseckiger Grundfläche?",
    options: ["6", "7", "8", "12"],
    correct: 1,
    explain: "Sechs Seitendreiecke und dazu die Grundfläche: 6 + 1 = 7 Flächen. Ein Prisma über demselben Sechseck hätte 8, denn es hat zusätzlich eine Deckfläche.",
  });
  mountQuiz(document.getElementById("quiz-drittel"), {
    q: "Ein Prisma und eine Pyramide haben dieselbe Grundfläche und dieselbe Höhe. Das Prisma fasst 60 cm³. Wie viel fasst die Pyramide?",
    options: ["30 cm³", "20 cm³", "180 cm³", "60 cm³"],
    correct: 1,
    explain: "V = ⅓ · G · h, also genau ein Drittel: 60 : 3 = 20 cm³. Die 30 cm³ wären die Hälfte — der Faktor ist aber ⅓, nicht ½.",
  });
  mountQuiz(document.getElementById("quiz-hoehen"), {
    q: "Eine quadratische Pyramide hat a = 6 cm und h = 4 cm. Wie lang ist die Seitenhöhe h_s?",
    options: ["4 cm", "5 cm", "7,21 cm", "10 cm"],
    correct: 1,
    explain: "h_s² = h² + (a : 2)² = 4² + 3² = 16 + 9 = 25, also h_s = 5 cm. Die 7,21 cm wären √(4² + 6²) — dort wurde die ganze Grundkante statt ihrer Hälfte eingesetzt.",
  });
  mountQuiz(document.getElementById("quiz-kegel"), {
    q: "Ein Kegel hat r = 3 cm und h = 4 cm. Wie groß ist seine Mantelfläche?",
    options: ["12π cm²", "15π cm²", "9π cm²", "20π cm²"],
    correct: 1,
    explain: "Zuerst die Mantellinie: s = √(3² + 4²) = 5 cm. Dann M = π · r · s = π · 3 · 5 = 15π cm². Die 12π kämen aus π · r · h — dort steht aber s, nicht h.",
  });
  mountQuiz(document.getElementById("quiz-kugel"), {
    q: "Eine Kugel und der Zylinder, in den sie genau hineinpasst, werden verglichen. Wie groß ist das Kugelvolumen im Verhältnis zum Zylindervolumen?",
    options: ["die Hälfte", "zwei Drittel", "ein Drittel", "drei Viertel"],
    correct: 1,
    explain: "Der Zylinder hat den Radius r und die Höhe 2r, also V = π · r² · 2r = 2πr³. Die Kugel hat ⁴⁄₃ πr³. Das Verhältnis ist (⁴⁄₃) : 2 = ⅔.",
  });
}

// ================= Start =================

initPyramide();
initDrittel();
initHoehen();
initKegel();
initKugel();
initExercises();
initQuizzes();
