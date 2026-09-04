// Selbstlernpfad "Kreise und Winkel" (Grundwissen Klasse 5-10).
// Rein clientseitiges Vanilla-JS, ohne Build-Schritt oder externe Bibliotheken.
//
// Winkel werden durchgehend im mathematischen Sinn gerechnet: 0° zeigt nach rechts,
// wachsende Winkel drehen gegen den Uhrzeigersinn. Weil die y-Achse im SVG nach unten
// zeigt, wird sie in polar() gespiegelt — sonst liefe jede Drehung verkehrt herum.

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
  const s = String(raw).trim().replace(/\s/g, "").replace(/−/g, "-").replace(/°/g, "").replace(/\./g, "").replace(",", ".");
  return parseFloat(s);
}
function neueFlaeche(w, h) {
  return svgEl("svg", { viewBox: `0 0 ${w} ${h}`, width: w, height: h, class: "geo-svg", preserveAspectRatio: "xMidYMid meet" });
}

// 44 px in der Zeichnung entsprechen 1 cm — so lassen sich Längen ehrlich beschriften.
const PX_PRO_CM = 44;

// Punkt auf einem Kreis um (cx|cy) mit Radius r unter dem Winkel grad.
// Die y-Achse wird gespiegelt, damit wachsende Winkel gegen den Uhrzeigersinn laufen.
function polar(cx, cy, r, grad) {
  const b = (grad * Math.PI) / 180;
  return { x: cx + r * Math.cos(b), y: cy - r * Math.sin(b) };
}

// Kreisbogen von grad1 nach grad2 (gegen den Uhrzeigersinn) als SVG-Pfad.
function bogenPfad(cx, cy, r, grad1, grad2) {
  const a = polar(cx, cy, r, grad1);
  const b = polar(cx, cy, r, grad2);
  const gross = Math.abs(grad2 - grad1) > 180 ? 1 : 0;
  // sweep-flag 0, weil die gespiegelte y-Achse den Drehsinn umkehrt
  return `M ${a.x.toFixed(2)} ${a.y.toFixed(2)} A ${r} ${r} 0 ${gross} 0 ${b.x.toFixed(2)} ${b.y.toFixed(2)}`;
}

// Kreisausschnitt (Sektor) von grad1 nach grad2.
function sektorPfad(cx, cy, r, grad1, grad2) {
  if (Math.abs(grad2 - grad1) >= 359.999) {
    // Ein Vollkreis lässt sich nicht als einzelner Bogen zeichnen.
    return `M ${cx - r} ${cy} A ${r} ${r} 0 1 0 ${cx + r} ${cy} A ${r} ${r} 0 1 0 ${cx - r} ${cy} Z`;
  }
  return `M ${cx} ${cy} L ${bogenPfad(cx, cy, r, grad1, grad2).slice(2)} Z`;
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

// ================= 1. Der Kreis und seine Teile =================

const KREIS_TEILE = {
  radius: {
    name: "Radius",
    art: "Strecke",
    text: "Vom <strong>Mittelpunkt M</strong> bis zu einem Punkt der Kreislinie. Jeder Radius desselben Kreises ist gleich lang — das ist die Definition des Kreises.",
  },
  durchmesser: {
    name: "Durchmesser",
    art: "Strecke",
    text: "Von einem Punkt der Kreislinie <strong>durch den Mittelpunkt</strong> zum gegenüberliegenden Punkt. Er besteht aus zwei Radien, also <strong>d = 2 · r</strong>, und ist die längste Strecke im Kreis.",
  },
  sehne: {
    name: "Sehne",
    art: "Strecke",
    text: "Eine <strong>Strecke</strong> zwischen zwei Punkten der Kreislinie. Geht sie durch den Mittelpunkt, ist sie der Durchmesser — die längste aller Sehnen.",
  },
  sekante: {
    name: "Sekante",
    art: "Gerade",
    text: "Eine <strong>Gerade</strong>, die den Kreis in <strong>zwei</strong> Punkten schneidet. Das Stück zwischen den Schnittpunkten ist die Sehne.",
  },
  tangente: {
    name: "Tangente",
    art: "Gerade",
    text: "Eine <strong>Gerade</strong>, die den Kreis in genau <strong>einem</strong> Punkt berührt. Dort steht sie <strong>senkrecht</strong> auf dem Radius — daran erkennt man sie sicher.",
  },
  bogen: {
    name: "Kreisbogen",
    art: "Teil der Kreislinie",
    text: "Ein <strong>Stück der Kreislinie</strong> zwischen zwei Punkten. Er hat eine Länge, umschließt aber selbst keine Fläche.",
  },
  ausschnitt: {
    name: "Kreisausschnitt",
    art: "Teil der Kreisfläche",
    text: "Das <strong>Tortenstück</strong> zwischen zwei Radien und dem zugehörigen Bogen. Er hat einen Flächeninhalt — und einen <strong>Mittelpunktswinkel</strong>.",
  },
};

function renderKreis() {
  const teil = document.getElementById("kr-teil").value;
  const rCm = clampZahl(document.getElementById("kr-r").value, 1, 5);
  const mount = document.getElementById("kr-mount");
  mount.innerHTML = "";

  const r = rCm * PX_PRO_CM;
  const rand = 56;
  const W = 2 * r + 2 * rand + 60;
  const H = 2 * r + 2 * rand;
  const cx = rand + r + 20,
    cy = rand + r;
  const svg = neueFlaeche(W, H);

  svg.appendChild(svgEl("circle", { cx, cy, r, class: "kreis-flaeche" }));

  // Der jeweils gezeigte Teil wird VOR der Kreislinie gezeichnet, damit die Linie oben liegt.
  const beschriftungen = [];
  if (teil === "ausschnitt") {
    svg.appendChild(svgEl("path", { d: sektorPfad(cx, cy, r, 20, 110), class: "kreis-ausschnitt" }));
    svg.appendChild(svgEl("path", { d: bogenPfad(cx, cy, r, 20, 110), class: "kreis-bogen" }));
    const mitte = polar(cx, cy, r * 0.55, 65);
    beschriftungen.push([mitte.x, mitte.y, "Ausschnitt", "#0f9b8e"]);
    // Der Mittelpunktswinkel gehört zum Ausschnitt — hier sind es 90°.
    svg.appendChild(svgEl("path", { d: bogenPfad(cx, cy, 26, 20, 110), class: "winkel-bogen" }));
    const wm = polar(cx, cy, 40, 65);
    beschriftungen.push([wm.x, wm.y, "90°", "#6d28d9"]);
  }
  svg.appendChild(svgEl("circle", { cx, cy, r, class: "kreis-linie" }));

  const zeigePunkt = (x, y, name, dx = 0, dy = -12) => {
    svg.appendChild(svgEl("circle", { cx: x, cy: y, r: 4.5, class: "kreis-punkt" }));
    if (name) beschriftungen.push([x + dx, y + dy, name, "#b3261e"]);
  };
  zeigePunkt(cx, cy, "M", -14, 6);

  if (teil === "radius") {
    const p = polar(cx, cy, r, 35);
    svg.appendChild(svgEl("line", { x1: cx, y1: cy, x2: p.x, y2: p.y, class: "kreis-radius" }));
    zeigePunkt(p.x, p.y, "A", 12, -6);
    const m = polar(cx, cy, r / 2, 35);
    beschriftungen.push([m.x + 6, m.y - 12, `r = ${num(rCm, 2)} cm`, "#157347"]);
  } else if (teil === "durchmesser") {
    const p1 = polar(cx, cy, r, 20),
      p2 = polar(cx, cy, r, 200);
    svg.appendChild(svgEl("line", { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, class: "kreis-durchmesser" }));
    zeigePunkt(p1.x, p1.y, "A", 12, -6);
    zeigePunkt(p2.x, p2.y, "B", -12, -6);
    beschriftungen.push([cx, cy - 18, `d = ${num(2 * rCm, 2)} cm`, "#b3650a"]);
  } else if (teil === "sehne") {
    const p1 = polar(cx, cy, r, 40),
      p2 = polar(cx, cy, r, 150);
    svg.appendChild(svgEl("line", { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, class: "kreis-sehne" }));
    zeigePunkt(p1.x, p1.y, "A", 12, -6);
    zeigePunkt(p2.x, p2.y, "B", -12, -6);
    const m = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
    beschriftungen.push([m.x, m.y - 12, "Sehne", "#6d28d9"]);
  } else if (teil === "sekante") {
    const p1 = polar(cx, cy, r, 40),
      p2 = polar(cx, cy, r, 150);
    // Über beide Schnittpunkte hinaus verlängern — eine Gerade hört nicht auf.
    const dx = p2.x - p1.x,
      dy = p2.y - p1.y,
      L = Math.hypot(dx, dy);
    const ex = dx / L,
      ey = dy / L,
      ueber = 58;
    svg.appendChild(
      svgEl("line", { x1: p1.x - ex * ueber, y1: p1.y - ey * ueber, x2: p2.x + ex * ueber, y2: p2.y + ey * ueber, class: "kreis-sekante" })
    );
    zeigePunkt(p1.x, p1.y, "A", 12, -6);
    zeigePunkt(p2.x, p2.y, "B", -12, -6);
    beschriftungen.push([p2.x + ex * ueber, p2.y + ey * ueber - 10, "Sekante", "#6d28d9"]);
  } else if (teil === "tangente") {
    const b = polar(cx, cy, r, 60);
    // Richtung senkrecht zum Radius nach B
    const rx = (b.x - cx) / r,
      ry = (b.y - cy) / r;
    const tx = -ry,
      ty = rx,
      lang = r * 0.95;
    svg.appendChild(svgEl("line", { x1: b.x - tx * lang, y1: b.y - ty * lang, x2: b.x + tx * lang, y2: b.y + ty * lang, class: "kreis-tangente" }));
    svg.appendChild(svgEl("line", { x1: cx, y1: cy, x2: b.x, y2: b.y, class: "kreis-radius" }));
    // Das rechte-Winkel-Zeichen im Berührpunkt
    const s = 11;
    svg.appendChild(
      svgEl("path", {
        d: `M ${b.x - rx * s + tx * s} ${b.y - ry * s + ty * s} L ${b.x - rx * s} ${b.y - ry * s} L ${b.x + tx * s} ${b.y + ty * s}`,
        class: "winkel-rechter",
      })
    );
    zeigePunkt(b.x, b.y, "B", 14, -8);
    beschriftungen.push([b.x + tx * lang, b.y + ty * lang - 10, "Tangente", "#b3261e"]);
  } else if (teil === "bogen") {
    svg.appendChild(svgEl("path", { d: bogenPfad(cx, cy, r, 20, 110), class: "kreis-bogen" }));
    const p1 = polar(cx, cy, r, 20),
      p2 = polar(cx, cy, r, 110);
    zeigePunkt(p1.x, p1.y, "A", 12, -6);
    zeigePunkt(p2.x, p2.y, "B", -12, -6);
    const m = polar(cx, cy, r + 20, 65);
    beschriftungen.push([m.x, m.y, "Bogen", "#0f9b8e"]);
  } else if (teil === "ausschnitt") {
    const p1 = polar(cx, cy, r, 20),
      p2 = polar(cx, cy, r, 110);
    svg.appendChild(svgEl("line", { x1: cx, y1: cy, x2: p1.x, y2: p1.y, class: "kreis-radius" }));
    svg.appendChild(svgEl("line", { x1: cx, y1: cy, x2: p2.x, y2: p2.y, class: "kreis-radius" }));
    zeigePunkt(p1.x, p1.y, "A", 12, -6);
    zeigePunkt(p2.x, p2.y, "B", -12, -6);
  }

  for (const [x, y, t, farbe] of beschriftungen) {
    svg.appendChild(svgText(x, y, t, { class: "kreis-beschriftung", fill: farbe }));
  }
  mount.appendChild(svg);

  const info = KREIS_TEILE[teil];
  document.getElementById("kr-text").innerHTML =
    `<strong>${info.name}</strong> <span class="progress-note">(${info.art})</span><br>${info.text}<br>` +
    `<span class="legende-radius">r = ${num(rCm, 2)} cm</span> &nbsp;·&nbsp; <span class="legende-durchmesser">d = 2 · ${num(rCm, 2)} cm = ${num(2 * rCm, 2)} cm</span>`;
}

function initKreis() {
  document.getElementById("kr-teil").addEventListener("change", renderKreis);
  document.getElementById("kr-r").addEventListener("input", renderKreis);
  renderKreis();
}

// ================= 2. Winkel und Winkelarten =================

// Die Grenzen sind Konvention und werden hier bewusst exakt geführt: Ein rechter
// Winkel ist GENAU 90°, ein spitzer echt kleiner, ein stumpfer echt größer.
const WINKELARTEN = [
  { key: "null", name: "Nullwinkel", bereich: "= 0°", passt: (a) => a === 0 },
  { key: "spitz", name: "spitzer Winkel", bereich: "0° < α < 90°", passt: (a) => a > 0 && a < 90 },
  { key: "recht", name: "rechter Winkel", bereich: "= 90°", passt: (a) => a === 90 },
  { key: "stumpf", name: "stumpfer Winkel", bereich: "90° < α < 180°", passt: (a) => a > 90 && a < 180 },
  { key: "gestreckt", name: "gestreckter Winkel", bereich: "= 180°", passt: (a) => a === 180 },
  { key: "ueberstumpf", name: "überstumpfer Winkel", bereich: "180° < α < 360°", passt: (a) => a > 180 && a < 360 },
  { key: "voll", name: "Vollwinkel", bereich: "= 360°", passt: (a) => a === 360 },
];

function winkelart(grad) {
  return WINKELARTEN.find((w) => w.passt(grad));
}

function renderWinkel() {
  const alpha = clampInt(document.getElementById("wk-alpha").value, 0, 360);
  document.getElementById("wk-alpha-anzeige").textContent = alpha + "°";
  const mount = document.getElementById("wk-mount");
  mount.innerHTML = "";

  const W = 400,
    H = 260;
  const cx = W / 2,
    cy = H / 2 + 20;
  const schenkel = 128;
  const svg = neueFlaeche(W, H);

  // Winkelfläche und Bogen
  const bogenR = 46;
  if (alpha > 0) {
    svg.appendChild(svgEl("path", { d: sektorPfad(cx, cy, bogenR, 0, alpha), class: "winkel-flaeche" }));
    if (alpha === 90) {
      // Der rechte Winkel bekommt sein eigenes Zeichen statt eines Bogens.
      const s = 22;
      svg.appendChild(svgEl("path", { d: `M ${cx + s} ${cy} L ${cx + s} ${cy - s} L ${cx} ${cy - s}`, class: "winkel-rechter" }));
    } else if (alpha === 360) {
      // Beim Vollwinkel fallen Anfang und Ende zusammen — ein Bogen entartet dann
      // zur Länge null, deshalb hier der volle Kreis.
      svg.appendChild(svgEl("circle", { cx, cy, r: bogenR, class: "winkel-bogen" }));
    } else {
      svg.appendChild(svgEl("path", { d: bogenPfad(cx, cy, bogenR, 0, alpha), class: "winkel-bogen" }));
    }
  }

  // Der feste Schenkel zeigt nach rechts (0°), der bewegliche auf α.
  const p0 = polar(cx, cy, schenkel, 0);
  const p1 = polar(cx, cy, schenkel, alpha);
  svg.appendChild(svgEl("line", { x1: cx, y1: cy, x2: p0.x, y2: p0.y, class: "winkel-schenkel" }));
  svg.appendChild(svgEl("line", { x1: cx, y1: cy, x2: p1.x, y2: p1.y, class: "winkel-schenkel" }));
  svg.appendChild(svgEl("circle", { cx, cy, r: 4.5, class: "kreis-punkt" }));
  svg.appendChild(svgText(cx - 14, cy + 18, "S", { class: "kreis-beschriftung", fill: "#b3261e" }));
  svg.appendChild(svgText(p0.x + 14, p0.y + 5, "A", { class: "kreis-beschriftung", fill: "#b3261e" }));
  svg.appendChild(svgText(p1.x + (alpha > 90 && alpha < 270 ? -16 : 16), p1.y + (alpha > 180 ? 16 : -8), "B", { class: "kreis-beschriftung", fill: "#b3261e" }));
  const nm = polar(cx, cy, bogenR + 24, alpha / 2);
  svg.appendChild(svgText(nm.x, nm.y, alpha + "°", { class: "winkel-name" }));
  mount.appendChild(svg);

  const art = winkelart(alpha);
  const reihe = document.getElementById("wk-arten");
  reihe.innerHTML = "";
  for (const w of WINKELARTEN) {
    reihe.appendChild(
      el("div", { class: "winkelart-karte" + (w.key === art.key ? " aktiv" : ""), html: `<span class="name">${w.name}</span><span class="bereich">${w.bereich}</span>` })
    );
  }

  document.getElementById("wk-text").innerHTML =
    `Der Winkel <span class="legende-winkel">α = ∠ASB = ${alpha}°</span> ist ein <strong>${art.name}</strong> (${art.bereich}).<br>` +
    `<span class="progress-note">Beim Benennen mit Punkten steht der Scheitelpunkt immer in der Mitte: ∠<strong>A</strong>S<strong>B</strong> — S ist der Scheitel. ` +
    `Ein Vollwinkel wäre 360°, hier fehlen also noch ${360 - alpha}°.</span>`;
}

function initWinkel() {
  const s = document.getElementById("wk-alpha");
  s.addEventListener("input", renderWinkel);
  renderWinkel();
}

// ================= 3. Messen mit dem Geodreieck =================

function renderGeodreieck() {
  const alpha = clampInt(document.getElementById("gd-alpha").value, 10, 170);
  document.getElementById("gd-alpha-anzeige").textContent = alpha + "°";
  const mount = document.getElementById("gd-mount");
  mount.innerHTML = "";

  const W = 440,
    H = 268;
  const cx = W / 2,
    cy = H - 46;
  const R = 150;
  const svg = neueFlaeche(W, H);

  // Der Halbkreis des Geodreiecks
  svg.appendChild(svgEl("path", { d: sektorPfad(cx, cy, R, 0, 180), class: "geo-halbkreis" }));

  // Zwei Skalen: außen von links (0 bei 180°), innen von rechts (0 bei 0°).
  // Genau diese Doppelung erzeugt den klassischen Ablesefehler.
  for (let g = 0; g <= 180; g += 10) {
    const aussen = polar(cx, cy, R, 180 - g);
    const aussenInnen = polar(cx, cy, R - 12, 180 - g);
    svg.appendChild(svgEl("line", { x1: aussen.x, y1: aussen.y, x2: aussenInnen.x, y2: aussenInnen.y, class: "geo-skala-aussen" }));
    const tA = polar(cx, cy, R - 22, 180 - g);
    svg.appendChild(svgText(tA.x, tA.y + 4, String(g), { class: "geo-skala-text-aussen" }));

    const innen = polar(cx, cy, R - 34, g);
    const innenInnen = polar(cx, cy, R - 44, g);
    svg.appendChild(svgEl("line", { x1: innen.x, y1: innen.y, x2: innenInnen.x, y2: innenInnen.y, class: "geo-skala-innen" }));
    const tI = polar(cx, cy, R - 54, g);
    svg.appendChild(svgText(tI.x, tI.y + 4, String(g), { class: "geo-skala-text-innen" }));
  }

  // Der zu messende Winkel: fester Schenkel nach rechts, beweglicher auf α.
  const p0 = polar(cx, cy, R + 18, 0);
  const p1 = polar(cx, cy, R + 18, alpha);
  svg.appendChild(svgEl("line", { x1: cx, y1: cy, x2: p0.x, y2: p0.y, class: "winkel-schenkel" }));
  svg.appendChild(svgEl("line", { x1: cx, y1: cy, x2: p1.x, y2: p1.y, class: "winkel-schenkel" }));
  svg.appendChild(svgEl("path", { d: bogenPfad(cx, cy, 30, 0, alpha), class: "winkel-bogen" }));
  svg.appendChild(svgEl("circle", { cx, cy, r: 4.5, class: "kreis-punkt" }));
  const nm = polar(cx, cy, 52, alpha / 2);
  svg.appendChild(svgText(nm.x, nm.y, alpha + "°", { class: "winkel-name" }));
  mount.appendChild(svg);

  // Der feste Schenkel liegt auf der 0 der INNEREN Skala. Auf der äußeren Skala
  // steht dort 180, deshalb liest man dort den Ergänzungswinkel ab.
  const falsch = 180 - alpha;
  const art = winkelart(alpha);
  document.getElementById("gd-text").innerHTML =
    `Der feste Schenkel liegt auf der <span class="ablesung-richtig">0 der grünen Skala</span>. ` +
    `Also gilt die grüne Ablesung: <span class="ablesung-richtig">${alpha}°</span>.<br>` +
    `Auf der roten Skala steht am selben Schenkel <span class="ablesung-falsch">${falsch}°</span> — ` +
    `das ist die typische Falle, denn ${alpha} + ${falsch} = 180.<br>` +
    `<span class="progress-note"><strong>Probe über die Winkelart:</strong> Der Winkel ist ein <strong>${art.name}</strong>, ` +
    (alpha < 90
      ? `also muss die Zahl <strong>kleiner als 90</strong> sein. ${alpha} < 90 ✓, ${falsch} wäre falsch.`
      : alpha === 90
        ? `beide Skalen zeigen hier 90 — der einzige Winkel, bei dem man sich nicht vertun kann.`
        : `also muss die Zahl <strong>größer als 90</strong> sein. ${alpha} > 90 ✓, ${falsch} wäre falsch.`) +
    `</span>`;
}

function initGeodreieck() {
  document.getElementById("gd-alpha").addEventListener("input", renderGeodreieck);
  renderGeodreieck();
}

// ================= 4. Kreisdiagramm =================

// Nur Teiler von 360 zur Auswahl — dann sind alle Mittelpunktswinkel ganzzahlig.
const KD_GESAMT = [10, 12, 15, 18, 20, 24, 30, 36, 40, 45, 60];
const KD_KATEGORIEN = [
  { name: "Fußball", farbe: "#2563eb" },
  { name: "Schwimmen", farbe: "#157347" },
  { name: "Reiten", farbe: "#b3650a" },
  { name: "Turnen", farbe: "#8a5cf6" },
];

function kdWerte() {
  return KD_KATEGORIEN.map((k, i) => clampInt(document.getElementById("kd-w" + i).value, 0, 999));
}

function renderKreisdiagramm() {
  const gesamt = Number(document.getElementById("kd-gesamt").value);
  const werte = kdWerte();
  const summe = werte.reduce((s, x) => s + x, 0);
  // Die letzte Kategorie füllt auf, damit die Summe immer stimmt.
  const rest = gesamt - summe;

  const mount = document.getElementById("kd-mount");
  mount.innerHTML = "";
  const R = 108;
  const rand = 30;
  const svg = neueFlaeche(2 * R + 2 * rand, 2 * R + 2 * rand);
  const cx = rand + R,
    cy = rand + R;

  const anzeige = rest >= 0 ? werte.concat([rest]) : werte;
  const kategorien = rest >= 0
    ? KD_KATEGORIEN.concat([{ name: "sonstige", farbe: "#94a3b8" }])
    : KD_KATEGORIEN;

  let start = 90; // oben beginnen, wie beim gedruckten Kreisdiagramm üblich
  const zeilen = [];
  anzeige.forEach((wert, i) => {
    // 360 : gesamt ist exakt (nur Teiler von 360 stehen zur Auswahl), deshalb wird
    // erst geteilt und dann multipliziert — (wert / gesamt) * 360 wäre gleitkommabehaftet.
    const winkel = wert * (360 / gesamt);
    if (winkel > 0) {
      svg.appendChild(
        svgEl("path", { d: sektorPfad(cx, cy, R, start - winkel, start), class: "kd-sektor", fill: kategorien[i].farbe, "fill-opacity": 0.72 })
      );
      if (winkel >= 26) {
        const m = polar(cx, cy, R * 0.62, start - winkel / 2);
        svg.appendChild(svgText(m.x, m.y + 4, Math.round(winkel) + "°", { class: "kreis-beschriftung", fill: "#ffffff" }));
      }
    }
    zeilen.push({ name: kategorien[i].name, farbe: kategorien[i].farbe, wert, winkel });
    start -= winkel;
  });
  svg.appendChild(svgEl("circle", { cx, cy, r: R, class: "kreis-linie" }));
  mount.appendChild(svg);

  const tab = el("table", { class: "kd-tabelle" });
  const kopf = el("tr");
  ["", "Sportart", "Anzahl", "Anteil", "Mittelpunktswinkel"].forEach((h) => kopf.appendChild(el("th", {}, h)));
  tab.appendChild(kopf);
  for (const z of zeilen) {
    const tr = el("tr");
    tr.appendChild(el("td", { class: "farbe", style: `background:${z.farbe}` }, ""));
    tr.appendChild(el("td", {}, z.name));
    tr.appendChild(el("td", {}, String(z.wert)));
    tr.appendChild(el("td", {}, `${z.wert} von ${gesamt}`));
    tr.appendChild(el("td", {}, `${num(z.winkel, 1)}°`));
    tab.appendChild(tr);
  }
  const summeZeile = el("tr", { class: "summe" });
  summeZeile.appendChild(el("td", {}, ""));
  summeZeile.appendChild(el("td", {}, "zusammen"));
  summeZeile.appendChild(el("td", {}, String(zeilen.reduce((s, z) => s + z.wert, 0))));
  summeZeile.appendChild(el("td", {}, "das Ganze"));
  summeZeile.appendChild(el("td", {}, num(zeilen.reduce((s, z) => s + z.winkel, 0), 1) + "°"));
  tab.appendChild(summeZeile);
  const wrap = document.getElementById("kd-tabelle");
  wrap.innerHTML = "";
  wrap.appendChild(tab);

  const beispiel = zeilen.find((z) => z.wert > 0) || zeilen[0];
  document.getElementById("kd-text").innerHTML =
    (rest < 0
      ? `<strong>Die Anzahlen sind zusammen größer als ${gesamt}.</strong> Nimm einen Regler zurück — mehr als das Ganze geht nicht.<br>`
      : "") +
    `<strong>So rechnet man einen Mittelpunktswinkel aus:</strong><br>` +
    `α = (Teil : Ganzes) · 360° = (${beispiel.wert} : ${gesamt}) · 360° = <strong>${num(beispiel.winkel, 1)}°</strong> für „${beispiel.name}“.<br>` +
    `<span class="progress-note">Die Winkel ergeben zusammen immer <strong>360°</strong> — der Vollwinkel ist das Ganze. ` +
    `Das ist dieselbe Idee wie bei Brüchen, wo sich alle Anteile zu 1 ergänzen, und bei Prozenten, wo sie 100 % ergeben. Deshalb entspricht 1 % genau 3,6°.</span>`;
}

function initKreisdiagramm() {
  const sel = document.getElementById("kd-gesamt");
  KD_GESAMT.forEach((g) => sel.appendChild(el("option", { value: String(g) }, String(g))));
  sel.value = "20";

  const regler = document.getElementById("kd-regler");
  KD_KATEGORIEN.forEach((k, i) => {
    const start = [5, 4, 3, 2][i];
    const label = el("label", {}, [
      k.name + ": ",
      el("input", { type: "number", id: "kd-w" + i, value: String(start), min: "0", max: "60", style: "width:4rem;padding:0.4rem;border:1px solid var(--border);border-radius:6px;font-family:inherit;background:var(--card-bg);color:var(--text)" }),
    ]);
    regler.appendChild(label);
  });
  KD_KATEGORIEN.forEach((k, i) => document.getElementById("kd-w" + i).addEventListener("input", renderKreisdiagramm));
  sel.addEventListener("change", renderKreisdiagramm);
  renderKreisdiagramm();
}

// ================= 7. Gestaffelte Übungsaufgaben =================

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
  // Radius ↔ Durchmesser. Beim Weg von d nach r wird d gerade gewählt,
  // damit das Ergebnis ganzzahlig bleibt.
  const nachD = Math.random() < 0.5;
  const r = nachD ? randInt(2, 40) : randInt(2, 25);
  const d = 2 * r;
  return {
    promptHtml: nachD
      ? `Ein Kreis hat den Radius <strong>r = ${r} cm</strong>. Wie groß ist sein <strong>Durchmesser</strong> in cm?`
      : `Ein Kreis hat den Durchmesser <strong>d = ${d} cm</strong>. Wie groß ist sein <strong>Radius</strong> in cm?`,
    correct: nachD ? d : r,
    tolerance: 0.01,
    placeholder: nachD ? "Durchmesser in cm" : "Radius in cm",
    hinweis: (raw, val) =>
      val === (nachD ? r : d)
        ? nachD
          ? "Das ist der <strong>Radius</strong>, der schon gegeben war. Der Durchmesser ist <strong>doppelt</strong> so lang: d = 2 · r."
          : "Das ist der <strong>Durchmesser</strong>, der schon gegeben war. Der Radius ist die <strong>Hälfte</strong>: r = d : 2."
        : val === (nachD ? r / 2 : d * 2)
          ? "Du hast in die falsche Richtung gerechnet. Der Durchmesser ist immer <strong>größer</strong> als der Radius, nie kleiner."
          : "",
    musterloesungHtml: nachD
      ? `<span class="legende-durchmesser">d = 2 · r = 2 · ${r} cm = ${d} cm</span><br>` +
        `<span class="progress-note">Der Durchmesser besteht aus zwei Radien: einer vom Rand zum Mittelpunkt, einer vom Mittelpunkt zum gegenüberliegenden Rand.</span>`
      : `<span class="legende-radius">r = d : 2 = ${d} cm : 2 = ${r} cm</span><br>` +
        `<span class="progress-note">Der Mittelpunkt halbiert den Durchmesser — beide Hälften sind Radien und deshalb gleich lang.</span>`,
  };
}

function generateAufgabe2() {
  // Ergänzen zum rechten, gestreckten oder Vollwinkel.
  const ziel = pick([90, 180, 360]);
  const zielName = ziel === 90 ? "rechten Winkel" : ziel === 180 ? "gestreckten Winkel" : "Vollwinkel";
  // Der gegebene Winkel wird so gewählt, dass die Ergänzung nicht zufällig gleich groß ist
  // — sonst ließe sich „ich habe nichts gerechnet" nicht von der Lösung unterscheiden.
  let alpha = randInt(1, ziel - 1) * 1;
  alpha = Math.round(alpha / 5) * 5;
  if (alpha <= 0) alpha = 5;
  if (alpha >= ziel) alpha = ziel - 5;
  if (2 * alpha === ziel) alpha += 5;
  const beta = ziel - alpha;
  const art = winkelart(alpha);
  return {
    promptHtml:
      `Zwei Winkel ergänzen sich zu einem <strong>${zielName}</strong> (${ziel}°). ` +
      `Der eine ist <strong>α = ${alpha}°</strong>. Wie groß ist der andere Winkel β in Grad?`,
    correct: beta,
    tolerance: 0.01,
    placeholder: "β in Grad",
    hinweis: (raw, val) => {
      if (val === alpha) return `Das ist der Winkel α, der schon gegeben war. Gesucht ist der <strong>Rest</strong> bis ${ziel}°.`;
      if (val === ziel) return `Das ist der ganze ${zielName}. Davon muss α = ${alpha}° noch abgezogen werden.`;
      if (val === alpha + ziel) return `Du hast addiert statt subtrahiert. Die beiden Winkel <em>zusammen</em> ergeben ${ziel}° — der gesuchte ist die <strong>Differenz</strong>.`;
      if (val === 180 - alpha && ziel !== 180) return `Du hast zu 180° ergänzt. Gefragt war aber der ${zielName} mit ${ziel}°.`;
      if (val === 90 - alpha && ziel !== 90) return `Du hast zu 90° ergänzt. Gefragt war aber der ${zielName} mit ${ziel}°.`;
      return "";
    },
    musterloesungHtml:
      `β = ${ziel}° − α = ${ziel}° − ${alpha}° = <strong>${beta}°</strong><br>` +
      `<span class="progress-note">Probe: ${alpha}° + ${beta}° = ${ziel}° ✓ &nbsp;· α ist ein ${art.name}, β ein ${winkelart(beta).name}.</span>`,
  };
}

function generateAufgabe3() {
  // Geodreieck: Auf beiden Skalen steht eine Zahl. Welche ist es?
  // Der Winkel wird nie 90°, sonst gäbe es nichts zu entscheiden.
  let alpha = randInt(2, 34) * 5; // 10° bis 170° in Fünferschritten
  if (alpha === 90) alpha = 95;
  const andere = 180 - alpha;
  const spitz = alpha < 90;
  const klein = Math.min(alpha, andere);
  const gross = Math.max(alpha, andere);
  return {
    promptHtml:
      `Ein Winkel wird mit dem Geodreieck gemessen. Am beweglichen Schenkel steht auf der einen Skala <strong>${klein}°</strong>, ` +
      `auf der anderen <strong>${gross}°</strong>. Die Zeichnung zeigt einen <strong>${spitz ? "spitzen" : "stumpfen"}</strong> Winkel. ` +
      `Wie groß ist er in Grad?`,
    correct: alpha,
    tolerance: 0.01,
    placeholder: "Winkel in Grad",
    hinweis: (raw, val) =>
      val === andere
        ? `Das ist die Ablesung auf der <strong>anderen</strong> Skala. Ein ${spitz ? "spitzer" : "stumpfer"} Winkel ist ${spitz ? "kleiner" : "größer"} als 90° — also kann es ${andere}° nicht sein.`
        : val === klein + gross
          ? "Du hast die beiden Ablesungen addiert. Sie ergeben immer 180°, weil es dieselbe Stelle auf zwei Skalen ist — gesucht ist aber nur eine davon."
          : val === gross - klein
            ? "Die Differenz der beiden Ablesungen hilft nicht weiter. Gesucht ist eine der beiden Zahlen selbst — die Winkelart entscheidet welche."
            : "",
    musterloesungHtml:
      `Die beiden Skalen ergänzen sich immer zu 180°: ${klein}° + ${gross}° = 180°.<br>` +
      `Die Zeichnung zeigt einen <strong>${spitz ? "spitzen" : "stumpfen"}</strong> Winkel, also muss die Zahl ${spitz ? "<strong>kleiner</strong>" : "<strong>größer</strong>"} als 90 sein.<br>` +
      `<span class="ablesung-richtig">α = ${alpha}°</span> &nbsp;·&nbsp; <span class="ablesung-falsch">${andere}°</span><br>` +
      `<span class="progress-note">Diese Probe über die Winkelart kostet zwei Sekunden und verhindert den häufigsten Messfehler zuverlässig.</span>`,
  };
}

function generateAufgabe4() {
  // Kreisdiagramm: vom Anteil zum Mittelpunktswinkel. Das Ganze ist ein Teiler
  // von 360, damit der Winkel ganzzahlig wird.
  const gesamt = pick([10, 12, 15, 18, 20, 24, 30, 36, 40, 45, 60, 72, 90]);
  const teil = randInt(1, gesamt - 1);
  // Alle Gesamtzahlen teilen 360, deshalb ist der Winkel je Person ganzzahlig — und
  // damit auch das Ergebnis. (teil / gesamt) * 360 wäre gleitkommabehaftet: 11/40 · 360
  // ergibt in JavaScript 99.00000000000001.
  const jeEiner = 360 / gesamt;
  const winkel = teil * jeEiner;
  const kontext = pick([
    { was: "Kinder einer Klasse", frage: "kommen mit dem Fahrrad zur Schule" },
    { was: "Befragte", frage: "hören am liebsten Popmusik" },
    { was: "Mitglieder eines Vereins", frage: "spielen Handball" },
  ]);
  return {
    promptHtml:
      `Von <strong>${gesamt} ${kontext.was}</strong> ${kontext.frage} <strong>${teil}</strong>. ` +
      `Wie groß ist der <strong>Mittelpunktswinkel</strong> dieses Kreisausschnitts im Kreisdiagramm (in Grad)?`,
    correct: winkel,
    tolerance: 0.01,
    placeholder: "Winkel in Grad",
    hinweis: (raw, val) => {
      // Der Rest wird zuerst geprüft: Er ist der häufigste Fehler und kann bei
      // teil : gesamt = 1 : 3 zahlengleich mit der 180°-Rechnung sein.
      if (val === 360 - winkel) return "Das ist der Winkel des <strong>Rests</strong> — also aller anderen. Gefragt war der Ausschnitt für die genannte Gruppe.";
      if (val === teil * (100 / gesamt)) return "Das ist der Anteil in <strong>Prozent</strong>. Ein Kreisdiagramm teilt aber den Vollwinkel auf — gerechnet wird mit <strong>360°</strong>, nicht mit 100.";
      if (val === teil * (180 / gesamt)) return "Du hast mit 180° gerechnet. Ein <em>ganzer</em> Kreis hat aber <strong>360°</strong>; 180° wäre nur der halbe Kreis.";
      if (val === (gesamt / teil) * 360) return "Du hast Teil und Ganzes vertauscht. Der Anteil ist <strong>Teil : Ganzes</strong>, also die kleinere Zahl geteilt durch die größere.";
      return "";
    },
    musterloesungHtml:
      `① Wie viel Grad entfallen auf <em>einen</em>? 360° : ${gesamt} = <strong>${num(jeEiner, 4)}°</strong><br>` +
      `② mal die Anzahl: ${teil} · ${num(jeEiner, 4)}° = <strong>${num(winkel)}°</strong><br>` +
      `<span class="legende-winkel">α = (${teil} : ${gesamt}) · 360° = ${num(winkel)}°</span><br>` +
      `<span class="progress-note">Probe: Der Rest sind ${gesamt - teil} von ${gesamt}, also ${num(360 - winkel)}° — zusammen ${num(winkel)}° + ${num(360 - winkel)}° = 360° ✓</span>`,
  };
}

function initExercises() {
  mountUebungsaufgaben(document.getElementById("exercises-mount"), [
    { schwierigkeit: "einfach", titel: "Aufgabe 1 — Radius und Durchmesser", generate: generateAufgabe1 },
    { schwierigkeit: "mittel", titel: "Aufgabe 2 — Winkel ergänzen", generate: generateAufgabe2 },
    { schwierigkeit: "schwierig", titel: "Aufgabe 3 — Welche Skala gilt?", generate: generateAufgabe3 },
    { schwierigkeit: "komplex", titel: "Aufgabe 4 — Mittelpunktswinkel im Kreisdiagramm", generate: generateAufgabe4 },
  ]);
}

// ================= Quizze =================

function initQuizzes() {
  mountQuiz(document.getElementById("quiz-kreis"), {
    q: "Eine Gerade berührt einen Kreis in genau einem Punkt. Wie heißt sie?",
    options: ["Sehne", "Sekante", "Tangente", "Durchmesser"],
    correct: 2,
    explain: "Die Tangente berührt in genau einem Punkt und steht dort senkrecht auf dem Radius. Eine Sekante schneidet in zwei Punkten, eine Sehne ist die Strecke dazwischen.",
  });
  mountQuiz(document.getElementById("quiz-winkel"), {
    q: "Wie groß ist ein stumpfer Winkel?",
    options: ["kleiner als 90°", "genau 90°", "zwischen 90° und 180°", "größer als 180°"],
    correct: 2,
    explain: "Spitz ist kleiner als 90°, rechter Winkel genau 90°, stumpf zwischen 90° und 180°, gestreckt genau 180° und überstumpf zwischen 180° und 360°.",
  });
  mountQuiz(document.getElementById("quiz-messen"), {
    q: "Beim Messen zeigt die eine Skala 130°, die andere 50°. Der Winkel sieht spitz aus. Wie groß ist er?",
    options: ["130°", "50°", "180°", "80°"],
    correct: 1,
    explain: "Ein spitzer Winkel ist kleiner als 90°, also gilt die Ablesung 50°. Die beiden Skalen ergänzen sich immer zu 180° — 130° + 50° = 180°.",
  });
  mountQuiz(document.getElementById("quiz-kreisdiagramm"), {
    q: "In einem Kreisdiagramm gehört zu einem Viertel des Ganzen welcher Mittelpunktswinkel?",
    options: ["25°", "45°", "90°", "100°"],
    correct: 2,
    explain: "Ein Viertel von 360° ist 360° : 4 = 90°. Die 25 aus „25 %“ ist der Prozentwert, nicht der Winkel — 1 % entspricht 3,6°.",
  });
}

// ================= Start =================

initKreis();
initWinkel();
initGeodreieck();
initKreisdiagramm();
initExercises();
initQuizzes();
