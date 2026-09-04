// Selbstlernpfad "Prismen und Zylinder" (Grundwissen Klasse 5-10).
// Rein clientseitiges Vanilla-JS, ohne Build-Schritt oder externe Bibliotheken.
//
// Leitgedanke: Prisma und Zylinder sind derselbe Körper — eine ebene Figur,
// senkrecht hochgezogen. Deshalb gilt für beide V = G · h, und der Mantel ist
// bei beiden ein Rechteck der Breite u und der Höhe h. Der Zylinder ist nur
// der Grenzfall, in dem die Eckenzahl über alle Grenzen wächst; Abschnitt 4
// lässt genau das durchspielen.
//
// Durchgehende Farbcodierung: Grundfläche grün, Mantel orange, Höhe rot,
// Umfang der Grundfläche blau.

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
// Regelmäßiges n-Eck mit Umkreisradius r, erste Ecke unten in der Mitte,
// damit die Figuren aufrecht stehen.
function regelEck(n, r, drehung = -90) {
  return Array.from({ length: n }, (_, i) => {
    const w = ((drehung + (i * 360) / n) * Math.PI) / 180;
    return { x: r * Math.cos(w), y: r * Math.sin(w) };
  });
}
// Fläche eines Polygons (gaußsche Trapezformel)
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
// Pixel je Einheit, damit die Figur den Rahmen ausfüllt und die Schriftgröße
// dabei konstant bleibt (siehe die Notiz in Thema 9).
function massstab(breiteEinheiten, hoeheEinheiten, platzB, platzH) {
  return Math.min(platzB / Math.max(breiteEinheiten, 0.001), platzH / Math.max(hoeheEinheiten, 0.001));
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

// ================= 1. Was ist ein Prisma =================

// Die Grundflächen sind als Polygone in Zentimetern angegeben, damit sich
// Flächeninhalt und Umfang aus der Zeichnung selbst ergeben und nicht
// nebenher behauptet werden müssen.
const PR_FORMEN = [
  { kuerzel: "Dreieck", formel: "3 Seitenflächen", ecken: [{ x: -3, y: 2 }, { x: 3, y: 2 }, { x: 0, y: -2.2 }] },
  { kuerzel: "Rechteck", formel: "der Quader", ecken: [{ x: -3, y: 2 }, { x: 3, y: 2 }, { x: 3, y: -2 }, { x: -3, y: -2 }] },
  { kuerzel: "Fünfeck", formel: "5 Seitenflächen", ecken: regelEck(5, 3, 90) },
  { kuerzel: "Sechseck", formel: "6 Seitenflächen", ecken: regelEck(6, 3, 90) },
];

let prAktiv = 1;

// Schrägbild: die Tiefe geht nach rechts oben, die Höhe nach oben.
function schraeg(p, hoehe, px, ox, oy) {
  return { x: ox + p.x * px + p.y * px * 0.42, y: oy - hoehe * px - p.y * px * 0.30 };
}

function renderPrisma() {
  const h = Number(document.getElementById("pr-h").value);
  const alsNetz = document.getElementById("pr-netz").checked;
  document.getElementById("pr-h-anzeige").textContent = h + " cm";

  const reihe = document.getElementById("pr-reihe");
  reihe.innerHTML = "";
  PR_FORMEN.forEach((f, i) => {
    const btn = el("button", { type: "button", class: "pz-form-karte" + (i === prAktiv ? " aktiv" : "") }, [
      el("span", { class: "kuerzel" }, f.kuerzel),
      el("span", { class: "formel" }, f.formel),
    ]);
    btn.addEventListener("click", () => {
      prAktiv = i;
      renderPrisma();
    });
    reihe.appendChild(btn);
  });

  const form = PR_FORMEN[prAktiv];
  const G = polyFlaeche(form.ecken);
  const u = polyUmfang(form.ecken);
  const seiten = form.ecken.length;

  const svg = neueFlaeche(560, 340);
  const g = svgEl("g");

  if (alsNetz) {
    // Netz: Grundfläche links, dann der Mantel als Streifen aus Rechtecken,
    // dann die Deckfläche. Die Breiten der Mantelrechtecke sind genau die
    // Seitenlängen der Grundfläche — deshalb ist der Streifen u breit.
    const px = massstab(u + 14, Math.max(h, 6) + 8, 470, 250);
    const ox = 40, oy = 180;
    const mitteX = form.ecken.reduce((s, p) => s + p.x, 0) / seiten;
    const mitteY = form.ecken.reduce((s, p) => s + p.y, 0) / seiten;
    const grund = form.ecken.map((p) => ({ x: ox + (p.x - mitteX) * px, y: oy + (p.y - mitteY) * px }));
    g.appendChild(polygon(grund, "pz-grund"));
    g.appendChild(svgText(ox, oy + 4, "G", { class: "pz-name-g" }));

    let x = ox + 60;
    for (let i = 0; i < seiten; i++) {
      const j = (i + 1) % seiten;
      const seite = Math.hypot(form.ecken[j].x - form.ecken[i].x, form.ecken[j].y - form.ecken[i].y);
      const b = seite * px;
      g.appendChild(svgEl("rect", { x, y: oy - (h * px) / 2, width: b.toFixed(2), height: (h * px).toFixed(2), class: "pz-mantel" }));
      x += b;
    }
    const streifen = u * px;
    g.appendChild(linie({ x: ox + 60, y: oy + (h * px) / 2 + 16 }, { x: ox + 60 + streifen, y: oy + (h * px) / 2 + 16 }, "pz-umfang"));
    g.appendChild(svgText(ox + 60 + streifen / 2, oy + (h * px) / 2 + 32, "u = " + num(u, 2) + " cm", { class: "pz-name-u" }));
    g.appendChild(linie({ x: ox + 48, y: oy - (h * px) / 2 }, { x: ox + 48, y: oy + (h * px) / 2 }, "pz-hoehe"));
    g.appendChild(svgText(ox + 36, oy + 4, "h", { class: "pz-name-h" }));
    g.appendChild(svgText(ox + 60 + streifen / 2, oy - (h * px) / 2 - 12, "Mantel = u · h", { class: "pz-name-m" }));

    const deck = form.ecken.map((p) => ({ x: ox + 60 + streifen + 60 + (p.x - mitteX) * px, y: oy + (p.y - mitteY) * px }));
    g.appendChild(polygon(deck, "pz-deck"));
    g.appendChild(svgText(ox + 60 + streifen + 60, oy + 4, "G", { class: "pz-name-g" }));
  } else {
    // Schrägbild des Körpers
    const px = massstab(14, h + 9, 340, 250);
    const ox = 250, oy = 280;
    const unten = form.ecken.map((p) => schraeg(p, 0, px, ox, oy));
    const oben = form.ecken.map((p) => schraeg(p, h, px, ox, oy));

    // Seitenflächen zuerst, damit Grund- und Deckfläche darüber liegen
    for (let i = 0; i < seiten; i++) {
      const j = (i + 1) % seiten;
      g.appendChild(polygon([unten[i], unten[j], oben[j], oben[i]], "pz-mantel"));
    }
    g.appendChild(polygon(unten, "pz-grund"));
    g.appendChild(polygon(oben, "pz-deck"));
    for (let i = 0; i < seiten; i++) {
      g.appendChild(linie(unten[i], oben[i], "pz-kante"));
    }
    // Höhe an der vordersten Kante hervorheben
    let vorne = 0;
    for (let i = 1; i < seiten; i++) if (unten[i].y > unten[vorne].y) vorne = i;
    g.appendChild(linie(unten[vorne], oben[vorne], "pz-hoehe"));
    g.appendChild(svgText(unten[vorne].x - 16, mitte(unten[vorne], oben[vorne]).y, "h = " + h, { class: "pz-name-h" }));
    g.appendChild(svgText(ox, oy + 24, "Grundfläche G", { class: "pz-name-g" }));
    g.appendChild(svgText(ox, oy - h * px - 60, "Deckfläche (deckungsgleich)", { class: "pz-hinweistext" }));
  }

  svg.appendChild(g);
  const mount = document.getElementById("pr-mount");
  mount.innerHTML = "";
  mount.appendChild(svg);

  document.getElementById("pr-bilanz").innerHTML =
    `Grundfläche: <span class="wg">G = ${num(G, 2)} cm²</span> &nbsp;·&nbsp; Umfang: <span class="wu">u = ${num(u, 2)} cm</span> &nbsp;·&nbsp; Höhe: <span class="wh">h = ${num(h)} cm</span><br>` +
    `Der Körper hat <strong>${seiten} Seitenflächen</strong>, dazu Grund- und Deckfläche — zusammen ${seiten + 2} Flächen.<br>` +
    `<span class="wm">Mantel M = u · h = ${num(u, 2)} · ${num(h)} = ${num(u * h, 2)} cm²</span>`;

  document.getElementById("pr-text").textContent = alsNetz
    ? "Im Netz sieht man es unmittelbar: Der Mantel ist EIN Rechteck, dessen Breite die Seitenlängen der Grundfläche aneinandergereiht sind — also der Umfang u."
    : "Alle Seitenkanten sind gleich lang und stehen senkrecht auf der Grundfläche. Diese Länge ist die Höhe h des Körpers.";
}

function initPrisma() {
  ["pr-h", "pr-netz"].forEach((id) => document.getElementById(id).addEventListener("input", renderPrisma));
  renderPrisma();
}

// ================= 2. Volumen als Stapel von Schichten =================

function renderVolumen() {
  const G = Number(document.getElementById("vo-g").value);
  const h = Number(document.getElementById("vo-h").value);
  document.getElementById("vo-g-anzeige").textContent = G + " cm²";
  document.getElementById("vo-h-anzeige").textContent = h + " cm";

  const svg = neueFlaeche(520, 320);
  const g = svgEl("g");
  // Die Grundfläche wird als liegendes Rechteck dargestellt, dessen
  // Flächeninhalt G entspricht — die Form ist gleichgültig, nur der Inhalt zählt.
  const px = massstab(16, h + 7, 300, 230);
  const breite = 6 * px, tiefe = 3.4 * px;
  const ox = 190, oy = 270;
  const schicht = px; // eine Schicht ist 1 cm dick

  const ecken = (z) => [
    { x: ox, y: oy - z },
    { x: ox + breite, y: oy - z },
    { x: ox + breite + tiefe * 0.42, y: oy - z - tiefe * 0.30 },
    { x: ox + tiefe * 0.42, y: oy - z - tiefe * 0.30 },
  ];

  for (let i = 0; i < h; i++) {
    const u0 = ecken(i * schicht), u1 = ecken((i + 1) * schicht);
    g.appendChild(polygon([u0[0], u0[1], u1[1], u1[0]], "pz-mantel"));
    g.appendChild(polygon([u0[1], u0[2], u1[2], u1[1]], "pz-mantel"));
    g.appendChild(polygon(u1, "pz-schicht"));
  }
  g.appendChild(polygon(ecken(0), "pz-grund"));
  g.appendChild(svgText(ox + breite / 2, oy + 24, "G = " + G + " cm²", { class: "pz-name-g" }));
  g.appendChild(linie({ x: ox - 18, y: oy }, { x: ox - 18, y: oy - h * schicht }, "pz-hoehe"));
  g.appendChild(svgText(ox - 34, oy - (h * schicht) / 2 + 4, "h = " + h, { class: "pz-name-h" }));

  svg.appendChild(g);
  const mount = document.getElementById("vo-mount");
  mount.innerHTML = "";
  mount.appendChild(svg);

  document.getElementById("vo-bilanz").innerHTML =
    `Eine Schicht von 1 cm Dicke hat das Volumen <span class="wg">${num(G)} cm²</span> · 1 cm = ${num(G)} cm³.<br>` +
    `Bei <span class="wh">${num(h)}</span> Schichten: <strong>V = G · h = ${num(G)} · ${num(h)} = ${num(G * h)} cm³</strong>`;

  document.getElementById("vo-text").textContent =
    "Die Form der Grundfläche spielt keine Rolle — nur ihr Flächeninhalt. Ein dreieckiges und ein rundes Prisma mit gleichem G und gleichem h haben genau dasselbe Volumen.";
}

function initVolumen() {
  ["vo-g", "vo-h"].forEach((id) => document.getElementById(id).addEventListener("input", renderVolumen));
  renderVolumen();
}

// ================= 3. Mantel abrollen =================

const OB_ECKEN = regelEck(6, 3, 90); // regelmäßiges Sechseck, Umkreisradius 3

function renderOberflaeche() {
  const h = Number(document.getElementById("ob-h").value);
  const roll = Number(document.getElementById("ob-roll").value) / 100;
  document.getElementById("ob-h-anzeige").textContent = h + " cm";
  document.getElementById("ob-roll-anzeige").textContent = Math.round(roll * 100) + " %";

  const G = polyFlaeche(OB_ECKEN);
  const u = polyUmfang(OB_ECKEN);
  const n = OB_ECKEN.length;

  const svg = neueFlaeche(560, 320);
  const g = svgEl("g");
  const px = massstab(u + 6, h + 8, 460, 210);
  const ox = 50, oy = 210;

  // Beim Abrollen wird jedes Mantelrechteck als STARRES Stück bewegt: Nur
  // sein Mittelpunkt und seine Richtung werden überblendet, seine Breite
  // bleibt in jeder Zwischenstellung genau die Seitenlänge. Würde man statt
  // dessen die beiden Endpunkte einzeln interpolieren, dehnte und stauchte
  // sich der Mantel unterwegs — und genau das tut er beim Abrollen nicht.
  const zentrum = { x: ox + 150, y: oy - 55 };
  let x = ox;
  const seitenlaengen = [];
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    seitenlaengen.push(Math.hypot(OB_ECKEN[j].x - OB_ECKEN[i].x, OB_ECKEN[j].y - OB_ECKEN[i].y));
  }
  // Das Sechseck selbst blenden wir aus, während der Mantel wegklappt
  if (roll < 1) {
    const kontur = OB_ECKEN.map((p) => ({ x: zentrum.x + p.x * px, y: zentrum.y + p.y * px }));
    const poly = polygon(kontur, "pz-grund");
    poly.setAttribute("fill-opacity", (0.3 * (1 - roll)).toFixed(2));
    poly.setAttribute("stroke-opacity", (1 - roll).toFixed(2));
    g.appendChild(poly);
  }

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const p1 = { x: zentrum.x + OB_ECKEN[i].x * px, y: zentrum.y + OB_ECKEN[i].y * px };
    const p2 = { x: zentrum.x + OB_ECKEN[j].x * px, y: zentrum.y + OB_ECKEN[j].y * px };
    const laenge = seitenlaengen[i] * px;

    const startMitte = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
    const zielMitte = { x: x + laenge / 2, y: oy };
    const startWinkel = Math.atan2(p2.y - p1.y, p2.x - p1.x);
    let dw = -startWinkel;
    while (dw > Math.PI) dw -= 2 * Math.PI;
    while (dw < -Math.PI) dw += 2 * Math.PI;
    const w = startWinkel + dw * roll;

    const m = { x: startMitte.x + (zielMitte.x - startMitte.x) * roll, y: startMitte.y + (zielMitte.y - startMitte.y) * roll };
    const richtung = { x: Math.cos(w), y: Math.sin(w) };
    const hoch = { x: richtung.y, y: -richtung.x }; // bei richtung = (1,0) zeigt das nach oben
    const e1 = { x: m.x - (richtung.x * laenge) / 2, y: m.y - (richtung.y * laenge) / 2 };
    const e2 = { x: m.x + (richtung.x * laenge) / 2, y: m.y + (richtung.y * laenge) / 2 };
    g.appendChild(polygon([
      e1, e2,
      { x: e2.x + hoch.x * h * px, y: e2.y + hoch.y * h * px },
      { x: e1.x + hoch.x * h * px, y: e1.y + hoch.y * h * px },
    ], "pz-mantel"));
    x += laenge;
  }

  const streifen = u * px;
  if (roll > 0.9) {
    g.appendChild(linie({ x: ox, y: oy + 16 }, { x: ox + streifen, y: oy + 16 }, "pz-umfang"));
    g.appendChild(svgText(ox + streifen / 2, oy + 32, "u = " + num(u, 2) + " cm", { class: "pz-name-u" }));
    g.appendChild(linie({ x: ox - 14, y: oy }, { x: ox - 14, y: oy - h * px }, "pz-hoehe"));
    g.appendChild(svgText(ox - 28, oy - (h * px) / 2 + 4, "h", { class: "pz-name-h" }));
  }

  svg.appendChild(g);
  const mount = document.getElementById("ob-mount");
  mount.innerHTML = "";
  mount.appendChild(svg);

  const M = u * h, O = 2 * G + M;
  document.getElementById("ob-bilanz").innerHTML =
    `Grundfläche <span class="wg">G = ${num(G, 2)} cm²</span> &nbsp;·&nbsp; Umfang <span class="wu">u = ${num(u, 2)} cm</span> &nbsp;·&nbsp; Höhe <span class="wh">h = ${num(h)} cm</span><br>` +
    `<span class="wm">M = u · h = ${num(u, 2)} · ${num(h)} = ${num(M, 2)} cm²</span><br>` +
    `<strong>O = 2 · G + M = 2 · ${num(G, 2)} + ${num(M, 2)} = ${num(O, 2)} cm²</strong>`;

  document.getElementById("ob-text").textContent =
    roll > 0.9
      ? "Abgerollt ist der Mantel ein einziges Rechteck: so breit wie der Umfang u, so hoch wie der Körper."
      : "Schiebe den Regler nach rechts, um den Mantel abzurollen. Die sechs Rechtecke legen sich zu einem einzigen zusammen.";
}

function initOberflaeche() {
  ["ob-h", "ob-roll"].forEach((id) => document.getElementById(id).addEventListener("input", renderOberflaeche));
  renderOberflaeche();
}

// ================= 4. Vom Prisma zum Zylinder =================

function renderZylinder() {
  const n = Number(document.getElementById("zy-n").value);
  const r = Number(document.getElementById("zy-r").value);
  const h = Number(document.getElementById("zy-h").value);
  document.getElementById("zy-n-anzeige").textContent = n + " Ecken";
  document.getElementById("zy-r-anzeige").textContent = r + " cm";
  document.getElementById("zy-h-anzeige").textContent = h + " cm";

  const ecken = regelEck(n, r, 90);
  const G = polyFlaeche(ecken);
  const u = polyUmfang(ecken);
  const Gkreis = Math.PI * r * r;
  const ukreis = 2 * Math.PI * r;

  const svg = neueFlaeche(520, 340);
  const g = svgEl("g");
  const px = massstab(2 * r + 6, h + 2 * r * 0.30 + 4, 300, 250);
  const ox = 260, oy = 280;
  const unten = ecken.map((p) => schraeg(p, 0, px, ox, oy));
  const oben = ecken.map((p) => schraeg(p, h, px, ox, oy));

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    g.appendChild(polygon([unten[i], unten[j], oben[j], oben[i]], "pz-mantel"));
  }
  g.appendChild(polygon(unten, "pz-grund"));
  g.appendChild(polygon(oben, "pz-deck"));
  // Bei wenigen Ecken die Kanten zeigen, bei vielen wäre es nur noch Gewirr
  if (n <= 12) {
    for (let i = 0; i < n; i++) g.appendChild(linie(unten[i], oben[i], "pz-kante"));
  }
  let vorne = 0;
  for (let i = 1; i < n; i++) if (unten[i].y > unten[vorne].y) vorne = i;
  g.appendChild(linie(unten[vorne], oben[vorne], "pz-hoehe"));
  g.appendChild(svgText(unten[vorne].x - 18, mitte(unten[vorne], oben[vorne]).y, "h = " + h, { class: "pz-name-h" }));

  svg.appendChild(g);
  const mount = document.getElementById("zy-mount");
  mount.innerHTML = "";
  mount.appendChild(svg);

  document.getElementById("zy-bilanz").innerHTML =
    `<strong>${n}-Eck:</strong> <span class="wg">G = ${num(G, 3)} cm²</span>, <span class="wu">u = ${num(u, 3)} cm</span>, V = ${num(G * h, 2)} cm³<br>` +
    `<strong>Kreis:</strong> <span class="wg">G = π · ${num(r)}² = ${num(Gkreis, 3)} cm²</span>, <span class="wu">u = 2 · π · ${num(r)} = ${num(ukreis, 3)} cm</span>, V = ${num(Gkreis * h, 2)} cm³<br>` +
    `Unterschied der Grundflächen: noch ${num(Gkreis - G, 3)} cm² &nbsp;(${num(((Gkreis - G) / Gkreis) * 100, 2)} %)`;

  document.getElementById("zy-text").textContent =
    n >= 30
      ? `Bei ${n} Ecken ist vom Vieleck nichts mehr zu sehen — der Körper ist praktisch ein Zylinder, und G stimmt bis auf ${num(((Gkreis - G) / Gkreis) * 100, 2)} % mit π · r² überein.`
      : "Erhöhe die Eckenzahl: Grundfläche und Umfang des Vielecks nähern sich denen des Kreises. Die Formeln V = G · h und M = u · h ändern sich dabei nicht.";
}

function initZylinder() {
  ["zy-n", "zy-r", "zy-h"].forEach((id) => document.getElementById(id).addEventListener("input", renderZylinder));
  renderZylinder();
}

// ================= 5. Hohlmaße und Rückwärtsrechnen =================

function renderHohlmasse() {
  const was = document.getElementById("hm-was").value;
  const r = Number(document.getElementById("hm-r").value);
  const h = Number(document.getElementById("hm-h").value);
  document.getElementById("hm-r-anzeige").textContent = r + " dm";
  document.getElementById("hm-h-anzeige").textContent = h + " dm";

  const G = Math.PI * r * r;
  const V = G * h;

  const svg = neueFlaeche(360, 280);
  const g = svgEl("g");
  const px = massstab(2 * r + 3, h + 2 * r * 0.30 + 3, 210, 200);
  const ox = 180, oy = 240;
  const ecken = regelEck(48, r, 90);
  const unten = ecken.map((p) => schraeg(p, 0, px, ox, oy));
  const oben = ecken.map((p) => schraeg(p, h, px, ox, oy));
  for (let i = 0; i < ecken.length; i++) {
    const j = (i + 1) % ecken.length;
    g.appendChild(polygon([unten[i], unten[j], oben[j], oben[i]], "pz-mantel"));
  }
  g.appendChild(polygon(unten, "pz-grund"));
  g.appendChild(polygon(oben, "pz-deck"));
  let vorne = 0;
  for (let i = 1; i < unten.length; i++) if (unten[i].y > unten[vorne].y) vorne = i;
  g.appendChild(linie(unten[vorne], oben[vorne], "pz-hoehe"));
  g.appendChild(svgText(unten[vorne].x - 20, mitte(unten[vorne], oben[vorne]).y, "h = " + h, { class: "pz-name-h" }));
  g.appendChild(linie({ x: ox, y: oy }, { x: ox + r * px, y: oy }, "pz-umfang"));
  g.appendChild(svgText(ox + (r * px) / 2, oy + 18, "r = " + r, { class: "pz-name-g" }));
  svg.appendChild(g);
  const mount = document.getElementById("hm-mount");
  mount.innerHTML = "";
  mount.appendChild(svg);

  let bilanz;
  if (was === "V") {
    bilanz =
      `G = π · r² = π · ${num(r)}² = <span class="wg">${num(G, 3)} dm²</span><br>` +
      `V = G · h = ${num(G, 3)} · ${num(h)} = <strong>${num(V, 3)} dm³</strong><br>` +
      `Und weil <strong>1 dm³ = 1 Liter</strong> ist: das sind <strong>${num(V, 2)} Liter</strong>.`;
  } else if (was === "h") {
    bilanz =
      `Gegeben seien V = ${num(V, 3)} dm³ und G = ${num(G, 3)} dm².<br>` +
      `Aus V = G · h folgt <strong>h = V : G</strong><br>` +
      `h = ${num(V, 3)} : ${num(G, 3)} = <strong>${num(V / G, 3)} dm</strong> ✓`;
  } else {
    bilanz =
      `Gegeben seien V = ${num(V, 3)} dm³ und h = ${num(h)} dm.<br>` +
      `Aus V = G · h folgt <strong>G = V : h</strong><br>` +
      `G = ${num(V, 3)} : ${num(h)} = <strong>${num(V / h, 3)} dm²</strong> ✓ &nbsp;(und daraus r = √(G : π) = ${num(Math.sqrt(V / h / Math.PI), 3)} dm)`;
  }
  document.getElementById("hm-bilanz").innerHTML = bilanz;

  document.getElementById("hm-tabelle").innerHTML =
    "<tr><th>Raummaß</th><th>entspricht</th><th>in Litern</th></tr>" +
    [
      ["1 cm³", "1 Milliliter", "0,001 l"],
      ["1 dm³", "1 Liter", "1 l"],
      ["1 m³", "1000 Liter", "1000 l"],
      [`${num(V, 2)} dm³`, `${num(V, 2)} Liter`, `${num(V, 2)} l`],
    ]
      .map((z, i) => `<tr${i === 3 ? ' style="font-weight:700"' : ""}><td>${z[0]}</td><td class="gleich">${z[1]}</td><td>${z[2]}</td></tr>`)
      .join("");

  document.getElementById("hm-text").textContent =
    was === "V"
      ? "Rechnet man von vornherein in Dezimetern, steht das Ergebnis in dm³ — und damit direkt in Litern."
      : "Beim Rückwärtsrechnen wird aus der Multiplikation eine Division. Die Formel selbst ändert sich nicht.";
}

function initHohlmasse() {
  ["hm-was", "hm-r", "hm-h"].forEach((id) => document.getElementById(id).addEventListener("input", renderHohlmasse));
  document.getElementById("hm-was").addEventListener("change", renderHohlmasse);
  renderHohlmasse();
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

// Wählt aus einer Liste von Kandidaten für einen Parameter denjenigen aus, bei
// dem die richtige Lösung und ALLE Fehlerwerte paarweise verschieden bleiben.
//
// Warum das nötig ist: Fällt ein Fehlerwert mit der Lösung zusammen, bekommt
// eine falsche Rechenweise ein ✓ — beim Würfel der Kantenlänge 6 sind
// Oberfläche und Volumen beide 216. Fallen zwei Fehlerwerte zusammen, ist die
// Diagnose mehrdeutig. Ausgewählt wird aus einer VORHER gefilterten Liste,
// nicht durch Verwerfen und Neuziehen.
function ohneKollision(kandidaten, werte, notfall) {
  const sauber = kandidaten.filter((k) => {
    const alle = werte(k);
    return alle.every((x, i) => alle.every((y, j) => i === j || Math.abs(x - y) > 1e-9));
  });
  return sauber.length ? pick(sauber) : notfall;
}

// Aufgabe 1 — Volumen eines Prismas mit dreieckiger Grundfläche.
// Konstruktiv ganzzahlig: g wird gerade gewählt, damit ½ · g · hD aufgeht.
function generateAufgabe1() {
  const g = randInt(2, 9) * 2;   // gerade, damit ½ · g · hD ganzzahlig ist
  const hD = randInt(2, 9);      // Höhe des Grunddreiecks
  const G = (g * hD) / 2;
  // Fehlerwerte: Halbierung vergessen (2V), bei der Grundfläche stehen
  // geblieben (G) und die Maße addiert (g + hD + h).
  const h = ohneKollision(
    [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    (k) => [G * k, 2 * G * k, G, g + hD + k],
    5
  );
  const V = G * h;

  return {
    promptHtml:
      `Ein Prisma hat als Grundfläche ein <strong>Dreieck</strong> mit der Grundseite <strong>g = ${num(g)} cm</strong> ` +
      `und der zugehörigen Höhe <strong>${num(hD)} cm</strong>. Der Körper ist <strong>${num(h)} cm</strong> hoch.<br>` +
      `Wie groß ist sein Volumen in Kubikzentimetern?`,
    correct: V,
    placeholder: "V in cm³",
    hinweis: (raw, val) => {
      if (Math.abs(val - g * hD * h) < 0.01)
        return `Du hast die <strong>Halbierung vergessen</strong>. Die Grundfläche ist ein Dreieck: G = ½ · ${num(g)} · ${num(hD)} = ${num(G)} cm², nicht ${num(g * hD)} cm².`;
      if (Math.abs(val - G) < 0.01)
        return `${num(G)} cm² ist erst die <strong>Grundfläche</strong>. Für das Volumen fehlt noch die Multiplikation mit der Körperhöhe ${num(h)} cm.`;
      if (Math.abs(val - (g + hD + h)) < 0.01)
        return `Du hast <strong>addiert</strong>. Volumen entsteht durch Multiplizieren: V = G · h.`;
      return `Zuerst die Grundfläche G = ½ · g · h<sub>Dreieck</sub>, dann V = G · h.`;
    },
    musterloesungHtml:
      `<strong>1. Grundfläche:</strong> G = ½ · g · h<sub>Dreieck</sub> = ½ · ${num(g)} · ${num(hD)} = <strong>${num(G)} cm²</strong><br>` +
      `<strong>2. Volumen:</strong> V = G · h = ${num(G)} · ${num(h)} = <strong>${num(V)} cm³</strong><br>` +
      `<em>Achtung:</em> Die Dreieckshöhe ${num(hD)} cm und die Körperhöhe ${num(h)} cm sind zwei verschiedene Größen.`,
  };
}

// Aufgabe 2 — Oberfläche eines Prismas mit rechteckiger Grundfläche.
// Alle Zwischenwerte sind ganzzahlig.
function generateAufgabe2() {
  const a = randInt(2, 12), b = randInt(2, 12);
  const G = a * b, u = 2 * (a + b);
  // Fehlerwerte: nur der Mantel (u·h), Grundfläche einfach statt doppelt
  // (G + u·h), das Volumen (a·b·h) und "G statt u im Mantel" (2G + G·h).
  // Beim Würfel der Kante 6 wären Oberfläche und Volumen beide 216 — genau
  // solche Fälle siebt die Auswahl aus.
  const h = ohneKollision(
    [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    (k) => [2 * G + u * k, u * k, G + u * k, a * b * k, 2 * G + G * k],
    7
  );
  const M = u * h, O = 2 * G + M;

  return {
    promptHtml:
      `Ein Quader ist <strong>${num(a)} cm</strong> lang, <strong>${num(b)} cm</strong> breit und <strong>${num(h)} cm</strong> hoch.<br>` +
      `Wie groß ist seine <strong>Oberfläche</strong> in Quadratzentimetern?`,
    correct: O,
    placeholder: "O in cm²",
    hinweis: (raw, val) => {
      if (Math.abs(val - M) < 0.01)
        return `${num(M)} cm² ist nur der <strong>Mantel</strong>. Zur Oberfläche gehören Grund- und Deckfläche dazu: O = 2 · G + M.`;
      if (Math.abs(val - (G + M)) < 0.01)
        return `Du hast die Grundfläche nur <strong>einmal</strong> gezählt. Der Körper hat auch oben einen Deckel: O = <strong>2</strong> · G + M.`;
      if (Math.abs(val - a * b * h) < 0.01)
        return `${num(a * b * h)} ist das <strong>Volumen</strong> in cm³, nicht die Oberfläche. Gesucht ist eine Fläche.`;
      if (Math.abs(val - (2 * G + G * h)) < 0.01)
        return `Im Mantel M = u · h steht der <strong>Umfang</strong> u = ${num(u)} cm, nicht die Grundfläche. Mit G · h käme das Volumen heraus.`;
      return `O = 2 · G + u · h mit G = a · b und u = 2 · (a + b).`;
    },
    musterloesungHtml:
      `<strong>1. Grundfläche:</strong> G = a · b = ${num(a)} · ${num(b)} = <strong>${num(G)} cm²</strong><br>` +
      `<strong>2. Umfang:</strong> u = 2 · (a + b) = 2 · ${num(a + b)} = <strong>${num(u)} cm</strong><br>` +
      `<strong>3. Mantel:</strong> M = u · h = ${num(u)} · ${num(h)} = <strong>${num(M)} cm²</strong><br>` +
      `<strong>4. Oberfläche:</strong> O = 2 · G + M = ${num(2 * G)} + ${num(M)} = <strong>${num(O)} cm²</strong>`,
  };
}

// Aufgabe 3 — Zylinder: Volumen oder Mantel, auf zwei Nachkommastellen.
function generateAufgabe3() {
  // r ab 3: Bei r = 2 sind Volumen (πr²h) und Mantel (2πrh) dieselbe Zahl.
  const r = randInt(3, 12);
  // Fehlerwerte: die jeweils andere Größe, ein Faktor 2 zu viel bzw. zu wenig
  // und die ganze Oberfläche. Bei (r−2)(h−2) = 4 fiele V mit O zusammen.
  const h = ohneKollision(
    [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
    (k) => [
      Math.PI * r * r * k, 2 * Math.PI * r * k, 2 * Math.PI * r * r * k,
      Math.PI * r * k, 2 * Math.PI * r * r + 2 * Math.PI * r * k,
    ],
    9
  );
  const volumen = Math.random() < 0.5;
  const V = Math.PI * r * r * h;
  const M = 2 * Math.PI * r * h;
  const wert = volumen ? V : M;

  return {
    promptHtml:
      `Ein Zylinder hat den Radius <strong>r = ${num(r)} cm</strong> und die Höhe <strong>h = ${num(h)} cm</strong>.<br>` +
      (volumen
        ? `Wie groß ist sein <strong>Volumen</strong> in Kubikzentimetern?`
        : `Wie groß ist seine <strong>Mantelfläche</strong> in Quadratzentimetern?`) +
      `<br><span class="progress-note">Runde auf zwei Nachkommastellen.</span>`,
    correct: wert,
    tolerance: 0.015,
    placeholder: volumen ? "V in cm³" : "M in cm²",
    hinweis: (raw, val) => {
      const andere = volumen ? M : V;
      if (Math.abs(val - andere) < 0.02)
        return volumen
          ? `Du hast die <strong>Mantelfläche</strong> berechnet (2 · π · r · h). Für das Volumen wird die <em>Grundfläche</em> π · r² mit h multipliziert.`
          : `Du hast das <strong>Volumen</strong> berechnet (π · r² · h). Für den Mantel wird der <em>Umfang</em> 2 · π · r mit h multipliziert.`;
      if (volumen && Math.abs(val - 2 * Math.PI * r * r * h) < 0.02)
        return `Ein <strong>Faktor 2 zu viel</strong>. In V = π · r² · h steht keine 2 — die gehört zum Umfang, nicht zur Kreisfläche.`;
      if (!volumen && Math.abs(val - Math.PI * r * h) < 0.02)
        return `Die <strong>2</strong> fehlt. Der Umfang ist 2 · π · r; mit π · r rechnest du nur mit dem halben Umfang.`;
      if (Math.abs(val - (2 * Math.PI * r * r + M)) < 0.02)
        return `Das ist die <strong>gesamte Oberfläche</strong> O = 2 · π · r² + M. Gefragt ist nur ${volumen ? "das Volumen" : "der Mantel"}.`;
      return volumen ? `V = π · r² · h` : `M = 2 · π · r · h`;
    },
    musterloesungHtml: volumen
      ? `<strong>1. Grundfläche:</strong> G = π · r² = π · ${num(r)}² = ${num(r * r)}π ≈ ${num(Math.PI * r * r, 4)} cm²<br>` +
        `<strong>2. Volumen:</strong> V = G · h = ${num(Math.PI * r * r, 4)} · ${num(h)} ≈ <strong>${num(V, 2)} cm³</strong><br>` +
        `<em>Exakt:</em> V = ${num(r * r * h)}π cm³`
      : `<strong>1. Umfang:</strong> u = 2 · π · r = 2 · π · ${num(r)} = ${num(2 * r)}π ≈ ${num(2 * Math.PI * r, 4)} cm<br>` +
        `<strong>2. Mantel:</strong> M = u · h = ${num(2 * Math.PI * r, 4)} · ${num(h)} ≈ <strong>${num(M, 2)} cm²</strong><br>` +
        `<em>Exakt:</em> M = ${num(2 * r * h)}π cm²`,
  };
}

// Aufgabe 4 — Fassungsvermögen in Litern. Die Maße stehen in Zentimetern,
// gerechnet werden muss in Dezimetern (oder am Ende durch 1000 geteilt).
// Konstruktiv: Die Kantenlängen sind Vielfache von 10 cm, damit die
// Umrechnung glatt aufgeht und die Lösung in Litern ganzzahlig wird.
function generateAufgabe4() {
  const aDm = randInt(2, 9), bDm = randInt(2, 9);
  // Fehlerwerte: in cm³ stehen geblieben (1000·L), durch 100 oder durch 10
  // geteilt (10·L bzw. 100·L) und die Kanten addiert (10·(a+b+c) in cm).
  const hDm = ohneKollision(
    [2, 3, 4, 5, 6, 7, 8, 9],
    (k) => {
      const L = aDm * bDm * k;
      return [L, 1000 * L, 10 * L, 100 * L, 10 * (aDm + bDm + k)];
    },
    7
  );
  const a = aDm * 10, b = bDm * 10, h = hDm * 10;   // in Zentimetern
  const liter = aDm * bDm * hDm;                     // = V in dm³
  const cm3 = a * b * h;

  return {
    promptHtml:
      `Ein quaderförmiges Wasserbecken ist innen <strong>${num(a)} cm</strong> lang, <strong>${num(b)} cm</strong> breit ` +
      `und <strong>${num(h)} cm</strong> hoch.<br>` +
      `Wie viele <strong>Liter</strong> fasst es?`,
    correct: liter,
    placeholder: "Fassungsvermögen in Litern",
    hinweis: (raw, val) => {
      if (Math.abs(val - cm3) < 0.5)
        return `${num(cm3)} ist das Volumen in <strong>Kubikzentimetern</strong>. Ein Liter ist 1 dm³ = <strong>1000 cm³</strong> — es fehlt noch die Division durch 1000.`;
      if (Math.abs(val - cm3 / 100) < 0.01)
        return `Du hast durch <strong>100</strong> geteilt. Bei Raummaßen geht es in Tausenderschritten: 1 dm³ = 1000 cm³.`;
      if (Math.abs(val - cm3 / 10) < 0.01)
        return `Du hast durch <strong>10</strong> geteilt. Das gilt für Längen (1 dm = 10 cm), nicht für Volumina: 1 dm³ = 10 · 10 · 10 = 1000 cm³.`;
      if (Math.abs(val - (a + b + h)) < 0.01)
        return `Du hast die Kanten <strong>addiert</strong>. Das Volumen entsteht durch Multiplizieren.`;
      return `Erst das Volumen ausrechnen, dann in Liter umrechnen: 1 Liter = 1 dm³ = 1000 cm³.`;
    },
    musterloesungHtml:
      `<strong>Weg 1 — gleich in Dezimetern rechnen:</strong><br>` +
      `${num(a)} cm = ${num(aDm)} dm, ${num(b)} cm = ${num(bDm)} dm, ${num(h)} cm = ${num(hDm)} dm<br>` +
      `V = ${num(aDm)} · ${num(bDm)} · ${num(hDm)} = ${num(liter)} dm³ = <strong>${num(liter)} Liter</strong><br>` +
      `<strong>Weg 2 — in Zentimetern rechnen und umrechnen:</strong><br>` +
      `V = ${num(a)} · ${num(b)} · ${num(h)} = ${num(cm3)} cm³<br>` +
      `${num(cm3)} : 1000 = <strong>${num(liter)} Liter</strong><br>` +
      `<em>Merke:</em> 1 Liter = 1 dm³ = 1000 cm³ — bei Raummaßen immer in Tausenderschritten.`,
  };
}

function initExercises() {
  mountUebungsaufgaben(document.getElementById("exercises-mount"), [
    { schwierigkeit: "einfach", titel: "Aufgabe 1 — Volumen eines Dreiecksprismas", generate: generateAufgabe1 },
    { schwierigkeit: "mittel", titel: "Aufgabe 2 — Oberfläche eines Quaders", generate: generateAufgabe2 },
    { schwierigkeit: "schwierig", titel: "Aufgabe 3 — Zylinder", generate: generateAufgabe3 },
    { schwierigkeit: "komplex", titel: "Aufgabe 4 — Fassungsvermögen in Litern", generate: generateAufgabe4 },
  ]);
}

// ================= Quizze =================

function initQuizzes() {
  mountQuiz(document.getElementById("quiz-prisma"), {
    q: "Wie viele Flächen hat ein Prisma mit fünfeckiger Grundfläche?",
    options: ["5", "7", "10", "6"],
    correct: 1,
    explain: "Fünf Seitenflächen bilden den Mantel, dazu kommen Grund- und Deckfläche: 5 + 2 = 7 Flächen.",
  });
  mountQuiz(document.getElementById("quiz-volumen"), {
    q: "Zwei Prismen haben dieselbe Höhe und gleich große Grundflächen, aber ganz verschiedene Grundformen. Was gilt für ihre Volumina?",
    options: [
      "das mit der runderen Grundfläche ist größer",
      "sie sind gleich groß",
      "das lässt sich ohne die Seitenlängen nicht sagen",
      "das mit mehr Ecken ist größer",
    ],
    correct: 1,
    explain: "In V = G · h kommen nur der Flächeninhalt der Grundfläche und die Höhe vor. Die Form der Grundfläche spielt keine Rolle.",
  });
  mountQuiz(document.getElementById("quiz-oberflaeche"), {
    q: "Ein Prisma hat die Grundfläche 12 cm², den Grundflächenumfang 16 cm und die Höhe 5 cm. Wie groß ist die Oberfläche?",
    options: ["60 cm²", "104 cm²", "80 cm²", "92 cm²"],
    correct: 1,
    explain: "M = u · h = 16 · 5 = 80 cm². Dazu Grund- und Deckfläche: O = 2 · 12 + 80 = 104 cm². Die 60 cm² wären G · h — das ist das Volumen in cm³.",
  });
  mountQuiz(document.getElementById("quiz-zylinder"), {
    q: "Warum gilt für den Zylinder dieselbe Formel V = G · h wie für jedes Prisma?",
    options: [
      "das ist Zufall",
      "weil der Zylinder der Grenzfall eines Prismas mit immer mehr Ecken ist",
      "weil ein Kreis ein Vieleck mit unendlich kurzen Seiten ist und deshalb keine Fläche hat",
      "das gilt gar nicht, der Zylinder hat eine eigene Formel",
    ],
    correct: 1,
    explain: "Erhöht man die Eckenzahl eines regelmäßigen Prismas, nähert sich die Grundfläche dem Kreis. Die Formel V = G · h bleibt dabei unverändert — man setzt am Ende nur G = π · r² ein.",
  });
  mountQuiz(document.getElementById("quiz-hohlmasse"), {
    q: "Ein Behälter hat das Volumen 5000 cm³. Wie viele Liter sind das?",
    options: ["500 l", "5 l", "50 l", "5000 l"],
    correct: 1,
    explain: "1 Liter = 1 dm³ = 1000 cm³. Also sind 5000 cm³ genau 5 Liter. Bei Raummaßen wird immer durch 1000 geteilt, nicht durch 10 oder 100.",
  });
}

// ================= Start =================

initPrisma();
initVolumen();
initOberflaeche();
initZylinder();
initHohlmasse();
initExercises();
initQuizzes();
