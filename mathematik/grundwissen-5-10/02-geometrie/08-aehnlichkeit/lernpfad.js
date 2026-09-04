// Selbstlernpfad "Ähnlichkeit" (Grundwissen Klasse 5-10).
// Rein clientseitiges Vanilla-JS, ohne Build-Schritt oder externe Bibliotheken.
//
// Leitgedanke: Ähnlichkeit ist "gleiche Form, andere Größe". Deshalb zeigt jede
// Zeichnung Original UND Bild gleichzeitig — man soll den Streckfaktor sehen,
// nicht nur ausrechnen.
//
// Durchgehende Farbcodierung: Original blau, Bild grün (bei negativem k violett,
// weil das Bild dann auf der anderen Seite des Zentrums liegt), Streckzentrum
// orange, Strahlen grau gestrichelt, gemessene Strecken violett.
//
// Wichtig für die Zeichnungen: Wo die GRÖSSENÄNDERUNG die Aussage ist
// (Abschnitt 1 und 5), hat das SVG eine FESTE viewBox — sonst würde die Figur
// beim Strecken scheinbar gleich groß bleiben. Nur wo es allein auf die Form
// ankommt (Abschnitt 3), wird die viewBox automatisch mitgeführt.

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
function punktMitName(g, p, name, klPunkt, klName, dx = 0, dy = -10) {
  g.appendChild(svgEl("circle", { cx: p.x.toFixed(2), cy: p.y.toFixed(2), r: 4, class: klPunkt }));
  g.appendChild(svgText(p.x + dx, p.y + dy, name, { class: klName }));
}
// Winkelbogen am Scheitel v zwischen den Richtungen nach p und nach q
function winkelBogen(v, p, q, r = 26) {
  const w1 = Math.atan2(p.y - v.y, p.x - v.x);
  const w2 = Math.atan2(q.y - v.y, q.x - v.x);
  let d = w2 - w1;
  while (d <= -Math.PI) d += 2 * Math.PI;
  while (d > Math.PI) d -= 2 * Math.PI;
  const s = { x: v.x + r * Math.cos(w1), y: v.y + r * Math.sin(w1) };
  const e = { x: v.x + r * Math.cos(w1 + d), y: v.y + r * Math.sin(w1 + d) };
  const sweep = d > 0 ? 1 : 0;
  return svgEl("path", { d: `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 0 ${sweep} ${e.x.toFixed(2)} ${e.y.toFixed(2)}`, class: "ae-winkelbogen" });
}
// Position für die Winkelbeschriftung: auf der Winkelhalbierenden
function winkelLabelPos(v, p, q, r = 40) {
  const e = (a) => {
    const l = Math.hypot(a.x - v.x, a.y - v.y) || 1;
    return { x: (a.x - v.x) / l, y: (a.y - v.y) / l };
  };
  const u = e(p), w = e(q);
  const m = { x: u.x + w.x, y: u.y + w.y };
  const l = Math.hypot(m.x, m.y) || 1;
  return { x: v.x + (m.x / l) * r, y: v.y + (m.y / l) * r };
}
function laenge(p, q) {
  return Math.hypot(q.x - p.x, q.y - p.y);
}
// viewBox automatisch um alle übergebenen Punkte legen (nur dort verwenden, wo
// die absolute Größe der Figur keine Aussage trägt).
function autoViewBox(svg, punkte, rand = 42) {
  const xs = punkte.map((p) => p.x), ys = punkte.map((p) => p.y);
  const x0 = Math.min(...xs) - rand, y0 = Math.min(...ys) - rand;
  const b = Math.max(...xs) + rand - x0, h = Math.max(...ys) + rand - y0;
  svg.setAttribute("viewBox", `${x0.toFixed(1)} ${y0.toFixed(1)} ${b.toFixed(1)} ${h.toFixed(1)}`);
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

// ================= 1. Zentrische Streckung =================

// Das Urbild wird in Zentimetern RELATIV ZUM ZENTRUM angegeben. So ist
// ZA = 2,5 cm und AB = 3 cm exakt — beide Werte lassen sich sauber anzeigen.
const ZS_PX = 24;
// Die Zeichenfläche muss beide Extreme fassen: bei k = +2,5 reicht das Bild
// nach rechts oben, bei k = −2,5 nach links unten. Deshalb liegt Z mittig.
const ZS_Z = { x: 340, y: 175 };
const ZS_FLAECHE = { b: 700, h: 350 };
const ZS_URBILD = [
  { name: "A", dx: 1.5, dy: -2.0 },
  { name: "B", dx: 4.5, dy: -2.0 },
  { name: "C", dx: 3.0, dy: 0.5 },
];

function zsPunkt(u, k) {
  return { x: ZS_Z.x + u.dx * ZS_PX * k, y: ZS_Z.y + u.dy * ZS_PX * k };
}

function renderStreckung() {
  const mount = document.getElementById("zs-mount");
  const kRoh = Number(document.getElementById("zs-k").value) / 100;
  const negativ = document.getElementById("zs-negativ").checked;
  const k = negativ ? -kRoh : kRoh;
  const strahlen = document.getElementById("zs-strahlen").checked;

  document.getElementById("zs-k-anzeige").textContent = num(k, 2);

  const svg = neueFlaeche(ZS_FLAECHE.b, ZS_FLAECHE.h);
  const g = svgEl("g");

  const urbild = ZS_URBILD.map((u) => zsPunkt(u, 1));
  const bild = ZS_URBILD.map((u) => zsPunkt(u, k));

  // Strahlen durch das Zentrum, weit genug in beide Richtungen
  if (strahlen) {
    ZS_URBILD.forEach((u) => {
      const r = Math.hypot(u.dx, u.dy) * ZS_PX;
      const ux = (u.dx * ZS_PX) / r, uy = (u.dy * ZS_PX) / r;
      const w = Math.max(Math.abs(k), 1) * r + 45;
      g.appendChild(
        linie({ x: ZS_Z.x - ux * (k < 0 ? w : 40), y: ZS_Z.y - uy * (k < 0 ? w : 40) }, { x: ZS_Z.x + ux * w, y: ZS_Z.y + uy * w }, "ae-strahl")
      );
    });
  }

  g.appendChild(polygon(bild, k < 0 ? "ae-bild-negativ" : "ae-bild"));
  g.appendChild(polygon(urbild, "ae-original"));

  urbild.forEach((p, i) => punktMitName(g, p, ZS_URBILD[i].name, "ae-punkt", "ae-name", 0, -11));
  bild.forEach((p, i) => punktMitName(g, p, ZS_URBILD[i].name + "'", "ae-punkt-bild", "ae-name-bild", 0, -11));

  g.appendChild(svgEl("circle", { cx: ZS_Z.x, cy: ZS_Z.y, r: 5.5, class: "ae-zentrum" }));
  g.appendChild(svgText(ZS_Z.x, ZS_Z.y + 20, "Z", { class: "ae-zentrum-name" }));

  svg.appendChild(g);
  mount.innerHTML = "";
  mount.appendChild(svg);

  // Zahlen: ZA = 2,5 cm (3-4-5) und AB = 3 cm sind bewusst glatt gewählt.
  const zaCm = Math.hypot(ZS_URBILD[0].dx, ZS_URBILD[0].dy);
  const abCm = Math.abs(ZS_URBILD[1].dx - ZS_URBILD[0].dx);
  document.getElementById("zs-anzeige").innerHTML =
    `Streckfaktor <span class="k-wert">k = ${num(k, 2)}</span><br>` +
    `<span class="orig-wert">ZA = ${num(zaCm, 2)} cm</span> &nbsp;→&nbsp; <span class="bild-wert">ZA' = ${num(Math.abs(k) * zaCm, 3)} cm</span>` +
    ` &nbsp;(${num(zaCm, 2)} · ${num(Math.abs(k), 2)})<br>` +
    `<span class="orig-wert">AB = ${num(abCm, 2)} cm</span> &nbsp;→&nbsp; <span class="bild-wert">A'B' = ${num(Math.abs(k) * abCm, 3)} cm</span>` +
    ` &nbsp;(auch jede Seite der Figur wird ${num(Math.abs(k), 2)}-mal so lang)`;

  const t = document.getElementById("zs-text");
  if (k === 1) {
    t.textContent = "k = 1: Jeder Punkt bleibt, wo er ist — Bild und Original decken sich vollständig.";
  } else if (k === -1) {
    t.textContent = "k = −1: Das ist genau die Punktspiegelung an Z. Die Figur ist gleich groß, steht aber auf dem Kopf.";
  } else if (k < 0) {
    t.textContent = "Bei negativem k liegt das Bild auf der anderen Seite von Z und ist um 180° gedreht. Die Längen ändern sich um den Betrag |k| = " + num(Math.abs(k), 2) + ".";
  } else if (kRoh < 1) {
    t.textContent = "Bei 0 < k < 1 wird die Figur kleiner — man spricht trotzdem von einer Streckung.";
  } else {
    t.textContent = "Alle drei Bildpunkte liegen auf den Strahlen von Z aus, jeweils in der " + num(k, 2) + "-fachen Entfernung.";
  }
}

function initStreckung() {
  ["zs-k", "zs-negativ", "zs-strahlen"].forEach((id) =>
    document.getElementById(id).addEventListener("input", renderStreckung)
  );
  renderStreckung();
}

// ================= 2. Ähnliche Figuren =================

// Urdreieck mit den Seiten a = 4, b = 6, c = 7 (Dreiecksungleichung erfüllt).
const AF_A = 4, AF_B = 6, AF_C = 7;
const AF_PX = 19;

// Dreieck aus drei Seitenlängen: A im Ursprung, B auf der x-Achse, C darüber.
function dreieckAusSeiten(a, b, c) {
  const x = (b * b + c * c - a * a) / (2 * c);
  const y = Math.sqrt(Math.max(0, b * b - x * x));
  return { A: { x: 0, y: 0 }, B: { x: c, y: 0 }, C: { x, y } };
}

function renderAehnlich() {
  const k = Number(document.getElementById("af-k").value) / 10;
  const d = Number(document.getElementById("af-stoer").value) / 2;
  document.getElementById("af-k-anzeige").textContent = num(k, 2);
  document.getElementById("af-stoer-anzeige").textContent = (d > 0 ? "+" : "") + num(d, 1) + " cm";

  const a2 = AF_A * k + d, b2 = AF_B * k, c2 = AF_C * k;

  const t1 = dreieckAusSeiten(AF_A, AF_B, AF_C);
  const t2 = dreieckAusSeiten(a2, b2, c2);

  // Rand links und rechts, weil die Seitenbeschriftungen nach außen versetzt sind
  const svg = neueFlaeche(690, 272);
  const g = svgEl("g");
  const basis = 230; // gemeinsame Grundlinie beider Dreiecke

  function zeichne(tri, ox, klasse, strich, namen) {
    const p = {
      A: { x: ox + tri.A.x * AF_PX, y: basis - tri.A.y * AF_PX },
      B: { x: ox + tri.B.x * AF_PX, y: basis - tri.B.y * AF_PX },
      C: { x: ox + tri.C.x * AF_PX, y: basis - tri.C.y * AF_PX },
    };
    g.appendChild(polygon([p.A, p.B, p.C], klasse));
    // Winkel bei A markieren — er ändert sich mit, sobald a' allein verstellt wird
    g.appendChild(winkelBogen(p.A, p.B, p.C, 22));
    const lp = winkelLabelPos(p.A, p.B, p.C, 34);
    // A liegt im Ursprung, B auf der x-Achse — der Winkel bei A ist damit
    // einfach der Steigungswinkel von AC.
    const alpha = (Math.atan2(tri.C.y, tri.C.x) * 180) / Math.PI;
    g.appendChild(svgText(lp.x, lp.y + 4, num(alpha, 1) + "°", { class: "ae-winkel-text" }));
    punktMitName(g, p.A, namen[0], klasse === "ae-original" ? "ae-punkt" : "ae-punkt-bild", strich ? "ae-name-bild" : "ae-name", -10, 14);
    punktMitName(g, p.B, namen[1], klasse === "ae-original" ? "ae-punkt" : "ae-punkt-bild", strich ? "ae-name-bild" : "ae-name", 10, 14);
    punktMitName(g, p.C, namen[2], klasse === "ae-original" ? "ae-punkt" : "ae-punkt-bild", strich ? "ae-name-bild" : "ae-name", 0, -10);
    return p;
  }

  const p1 = zeichne(t1, 56, "ae-original", false, ["A", "B", "C"]);
  const p2 = zeichne(t2, 352, "ae-bild", true, ["A'", "B'", "C'"]);

  // Seitenbeschriftungen: von der Seitenmitte aus senkrecht NACH AUSSEN
  // versetzt, weg vom Schwerpunkt — sonst liegt die Beschriftung auf der Linie.
  const beschrifte = (tri, p, q, text) => {
    const s = { x: (tri.A.x + tri.B.x + tri.C.x) / 3, y: (tri.A.y + tri.B.y + tri.C.y) / 3 };
    const m = { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 };
    const d = { x: m.x - s.x, y: m.y - s.y };
    const l = Math.hypot(d.x, d.y) || 1;
    g.appendChild(svgText(m.x + (d.x / l) * 16, m.y + (d.y / l) * 16 + 4, text, { class: "ae-strecke-text" }));
  };
  beschrifte(p1, p1.B, p1.C, "a = " + num(AF_A, 2));
  beschrifte(p1, p1.C, p1.A, "b = " + num(AF_B, 2));
  beschrifte(p1, p1.A, p1.B, "c = " + num(AF_C, 2));
  beschrifte(p2, p2.B, p2.C, "a' = " + num(a2, 2));
  beschrifte(p2, p2.C, p2.A, "b' = " + num(b2, 2));
  beschrifte(p2, p2.A, p2.B, "c' = " + num(c2, 2));

  svg.appendChild(g);
  const mount = document.getElementById("af-mount");
  mount.innerHTML = "";
  mount.appendChild(svg);

  // Quotiententabelle
  const zeilen = [
    { name: "a' : a", oben: a2, unten: AF_A },
    { name: "b' : b", oben: b2, unten: AF_B },
    { name: "c' : c", oben: c2, unten: AF_C },
  ];
  const quot = zeilen.map((z) => z.oben / z.unten);
  const gleich = quot.every((q) => Math.abs(q - quot[0]) < 1e-9);
  const tab = document.getElementById("af-tabelle");
  tab.innerHTML =
    "<tr><th>Verhältnis</th><th>Rechnung</th><th>Wert</th></tr>" +
    zeilen
      .map((z, i) => {
        const abweicher = !gleich && Math.abs(quot[i] - quot[(i + 1) % 3]) > 1e-9 && Math.abs(quot[i] - quot[(i + 2) % 3]) > 1e-9;
        return `<tr${abweicher ? ' class="abweicher"' : ""}><td>${z.name}</td><td>${num(z.oben, 2)} : ${num(z.unten, 2)}</td><td class="q-wert">${num(quot[i], 3)}</td></tr>`;
      })
      .join("");

  const urteil = document.getElementById("af-urteil");
  if (gleich) {
    urteil.className = "ae-urteil ja";
    urteil.textContent = "✓ Alle drei Verhältnisse sind gleich (" + num(quot[0], 2) + ") — die Dreiecke sind ähnlich. Auch die Winkel stimmen überein.";
  } else {
    urteil.className = "ae-urteil nein";
    urteil.textContent = "✗ Die Verhältnisse stimmen nicht überein — die Dreiecke sind nicht ähnlich. Vergleiche die beiden Winkel bei A und A': Sie sind jetzt verschieden groß.";
  }
}

function initAehnlich() {
  ["af-k", "af-stoer"].forEach((id) => document.getElementById(id).addEventListener("input", renderAehnlich));
  renderAehnlich();
}

// ================= 3. Strahlensätze =================

// Beide Strahlen bekommen EINHEITSRICHTUNGEN. Dadurch ist die Entfernung vom
// Zentrum entlang eines Strahls exakt der Parameter t (in cm) — und weil
// A = Z + t·d1 und B = Z + t·d2 gilt, sind die Verbindungsstrecken AB und A'B'
// automatisch parallel. Die Parallelität ist also konstruiert, nicht gezeichnet.
const ST_Z = { x: 90, y: 175 };
const ST_D1 = { x: 0.96, y: -0.28 }; // Einheitsvektor (24-7-25)

// Der zweite Strahl entsteht durch Drehung des ersten um einen Winkel mit
// cos θ = 0,68. Damit ist |d2 − d1|² = 2 − 2·0,68 = 0,64, also |d2 − d1| = 0,8
// GENAU. Die Parallelenstücke messen dann 0,8 · t und sind ebenso glatt wie die
// Strahlenabschnitte selbst — sonst stünde in der Anzeige eine Zeile wie
// "5,37 : 10,73 = 0,5", die beim Nachrechnen nicht aufgeht.
const ST_COS = 0.68;
const ST_SIN = Math.sqrt(1 - ST_COS * ST_COS);
const ST_D2 = {
  x: ST_D1.x * ST_COS - ST_D1.y * ST_SIN,
  y: ST_D1.x * ST_SIN + ST_D1.y * ST_COS,
};
const ST_PX = 22;
const ST_T1 = 6; // erste Parallele fest bei 6 cm

function stPunkt(d, t) {
  return { x: ST_Z.x + d.x * t * ST_PX, y: ST_Z.y + d.y * t * ST_PX };
}

function renderStrahlensaetze() {
  const t2roh = Number(document.getElementById("st-t").value) / 2;
  const xFigur = document.getElementById("st-x").checked;
  const t2 = xFigur ? -t2roh : t2roh;

  const A = stPunkt(ST_D1, ST_T1), B = stPunkt(ST_D2, ST_T1);
  const As = stPunkt(ST_D1, t2), Bs = stPunkt(ST_D2, t2);

  const svg = neueFlaeche(560, 400);
  const g = svgEl("g");

  // Strahlen: vom Zentrum aus über die weiter entfernten Punkte hinaus
  const w = (Math.max(ST_T1, Math.abs(t2)) + 1.2) * ST_PX;
  const strahlEnden = [];
  [ST_D1, ST_D2].forEach((d) => {
    const ende = { x: ST_Z.x + d.x * w, y: ST_Z.y + d.y * w };
    const zurueck = xFigur ? w : 30;
    const gegen = { x: ST_Z.x - d.x * zurueck, y: ST_Z.y - d.y * zurueck };
    g.appendChild(linie(gegen, ende, "ae-strahl-voll"));
    strahlEnden.push(ende, gegen);
  });

  g.appendChild(linie(A, B, "ae-parallele"));
  g.appendChild(linie(As, Bs, "ae-parallele-zwei"));

  punktMitName(g, A, "A", "ae-punkt", "ae-name", -12, -6);
  punktMitName(g, B, "B", "ae-punkt", "ae-name", -12, 14);
  punktMitName(g, As, "A'", "ae-punkt-bild", "ae-name-bild", 14, -6);
  punktMitName(g, Bs, "B'", "ae-punkt-bild", "ae-name-bild", 14, 14);
  g.appendChild(svgEl("circle", { cx: ST_Z.x, cy: ST_Z.y, r: 5.5, class: "ae-zentrum" }));
  g.appendChild(svgText(ST_Z.x - 16, ST_Z.y + 5, "Z", { class: "ae-zentrum-name" }));

  svg.appendChild(g);
  // Die Strahlenden gehören mit in den Ausschnitt, sonst würden sie abgeschnitten.
  autoViewBox(svg, [ST_Z, A, B, As, Bs, ...strahlEnden], 34);
  const mount = document.getElementById("st-mount");
  mount.innerHTML = "";
  mount.appendChild(svg);

  const za = ST_T1, zas = Math.abs(t2);
  const ab = laenge(A, B) / ST_PX, asbs = laenge(As, Bs) / ST_PX;
  document.getElementById("st-anzeige").innerHTML =
    `<strong>1. Strahlensatz</strong> — auf den Strahlen:<br>` +
    `ZA : ZA' = ${num(za, 2)} : ${num(zas, 2)} = <span class="k-wert">${num(za / zas, 3)}</span> &nbsp;·&nbsp; ` +
    `ZB : ZB' = ${num(za, 2)} : ${num(zas, 2)} = <span class="k-wert">${num(za / zas, 3)}</span><br>` +
    `<strong>2. Strahlensatz</strong> — Parallelenstücke zu Strahlenabschnitten:<br>` +
    `AB : A'B' = ${num(ab, 2)} : ${num(asbs, 2)} = <span class="k-wert">${num(ab / asbs, 3)}</span> &nbsp;=&nbsp; ZA : ZA'`;

  document.getElementById("st-text").textContent = xFigur
    ? "X-Figur: Die zweite Parallele liegt jenseits von Z. Beide Strahlensätze gelten unverändert — nur steht die zweite Figur auf dem Kopf. Das ist genau eine zentrische Streckung mit negativem k."
    : "V-Figur: Verschiebe die zweite Parallele — die beiden Verhältnisse bleiben immer gleich, egal wie weit außen sie liegt.";
}

function initStrahlensaetze() {
  ["st-t", "st-x"].forEach((id) => document.getElementById(id).addEventListener("input", renderStrahlensaetze));
  renderStrahlensaetze();
}

// ================= 4. Ähnlichkeitssätze =================

// Markiert werden Seiten (per Endpunktnamen) und Winkel (per Scheitelname).
const SAETZE = [
  {
    kuerzel: "WW",
    was: "zwei Winkel",
    ok: true,
    seiten: [],
    winkel: ["A", "B"],
    text: "Stimmen zwei Winkel überein, so auch der dritte — denn die Winkelsumme im Dreieck beträgt immer 180°. Damit haben beide Dreiecke dieselbe Form. Das ist der Satz, den man in der Praxis am häufigsten braucht.",
  },
  {
    kuerzel: "SSS",
    was: "drei Seitenverhältnisse",
    ok: true,
    seiten: [["A", "B"], ["B", "C"], ["C", "A"]],
    winkel: [],
    text: "Stehen alle drei Seitenpaare im selben Verhältnis, sind die Dreiecke ähnlich: a' : a = b' : b = c' : c. Man vergleicht also nicht die Längen, sondern die Quotienten.",
  },
  {
    kuerzel: "SWS",
    was: "zwei Seiten + Zwischenwinkel",
    ok: true,
    seiten: [["A", "B"], ["C", "A"]],
    winkel: ["A"],
    text: "Zwei Seitenpaare im selben Verhältnis und der von ihnen eingeschlossene Winkel gleich groß — das legt die Form fest. Wichtig ist, dass der Winkel wirklich zwischen den beiden Seiten liegt.",
  },
  {
    kuerzel: "SsW",
    was: "zwei Seiten + Winkel gegenüber der längeren",
    ok: true,
    seiten: [["A", "B"], ["C", "A"]],
    winkel: ["C"],
    text: "Zwei Seitenpaare im selben Verhältnis und der Winkel gegenüber der längeren der beiden Seiten. Hier ist c = 7 die längere; ihr gegenüber liegt der Winkel bei C. Das große S im Kürzel steht für diese längere Seite.",
  },
  {
    kuerzel: "SSW",
    was: "Winkel gegenüber der kürzeren — reicht NICHT",
    ok: false,
    seiten: [["A", "B"], ["C", "A"]],
    winkel: ["B"],
    text: "Liegt der Winkel der kürzeren der beiden Seiten gegenüber, gibt es in der Regel ZWEI verschiedene Dreiecksformen, die zu den Angaben passen. Die Form ist damit nicht festgelegt — SSW ist kein Ähnlichkeitssatz.",
  },
];

let saAktiv = 0;

function renderSaetze() {
  const s = SAETZE[saAktiv];
  const reihe = document.getElementById("sa-reihe");
  reihe.innerHTML = "";
  SAETZE.forEach((satz, i) => {
    const btn = el("button", { type: "button", class: "ae-satz-karte" + (satz.ok ? "" : " nein") + (i === saAktiv ? " aktiv" : "") }, [
      el("span", { class: "kuerzel" }, satz.kuerzel),
      el("span", { class: "was" }, satz.was),
    ]);
    btn.addEventListener("click", () => {
      saAktiv = i;
      renderSaetze();
    });
    reihe.appendChild(btn);
  });

  const k = 1.5;
  const t1 = dreieckAusSeiten(AF_A, AF_B, AF_C);
  const t2 = dreieckAusSeiten(AF_A * k, AF_B * k, AF_C * k);
  const PX = 19, basis = 232;

  const svg = neueFlaeche(600, 270);
  const g = svgEl("g");

  function zeichne(tri, ox, klasse, strich) {
    const p = {
      A: { x: ox + tri.A.x * PX, y: basis - tri.A.y * PX },
      B: { x: ox + tri.B.x * PX, y: basis - tri.B.y * PX },
      C: { x: ox + tri.C.x * PX, y: basis - tri.C.y * PX },
    };
    g.appendChild(polygon([p.A, p.B, p.C], klasse));
    // markierte Seiten
    s.seiten.forEach(([u, v]) => g.appendChild(linie(p[u], p[v], "ae-strecke")));
    // markierte Winkel
    s.winkel.forEach((v) => {
      const andere = ["A", "B", "C"].filter((n) => n !== v);
      g.appendChild(winkelBogen(p[v], p[andere[0]], p[andere[1]], 22));
    });
    const suffix = strich ? "'" : "";
    punktMitName(g, p.A, "A" + suffix, strich ? "ae-punkt-bild" : "ae-punkt", strich ? "ae-name-bild" : "ae-name", -10, 15);
    punktMitName(g, p.B, "B" + suffix, strich ? "ae-punkt-bild" : "ae-punkt", strich ? "ae-name-bild" : "ae-name", 10, 15);
    punktMitName(g, p.C, "C" + suffix, strich ? "ae-punkt-bild" : "ae-punkt", strich ? "ae-name-bild" : "ae-name", 0, -10);
  }

  zeichne(t1, 30, "ae-original", false);
  zeichne(t2, 300, s.ok ? "ae-bild" : "ae-bild-negativ", true);
  svg.appendChild(g);

  const mount = document.getElementById("sa-mount");
  mount.innerHTML = "";
  mount.appendChild(svg);

  document.getElementById("sa-text").innerHTML =
    `<strong>${s.kuerzel}${s.ok ? "" : " — kein Ähnlichkeitssatz"}:</strong> ${s.text}`;
}

function initSaetze() {
  renderSaetze();
}

// ================= 5. Länge, Fläche, Volumen =================

// Feste viewBox: Hier IST die Größenänderung die Aussage.
const PT_SEITE = 3; // Originalquadrat 3 cm
const PT_PX = 22;

function renderPotenzen() {
  const k = Number(document.getElementById("pt-k").value) / 10;
  document.getElementById("pt-k-anzeige").textContent = num(k, 2);

  const svg = neueFlaeche(400, 330);
  const g = svgEl("g");
  const x0 = 40, yUnten = 292;

  const sBild = PT_SEITE * k * PT_PX;
  // Bildquadrat mit Einheitsgitter: jedes Kästchen ist ein Originalquadrat
  g.appendChild(svgEl("rect", { x: x0, y: yUnten - sBild, width: sBild, height: sBild, class: "ae-quadrate" }));
  const schritt = PT_SEITE * PT_PX;
  for (let i = 1; i * schritt < sBild - 0.5; i++) {
    g.appendChild(linie({ x: x0 + i * schritt, y: yUnten - sBild }, { x: x0 + i * schritt, y: yUnten }, "ae-gitter"));
    g.appendChild(linie({ x: x0, y: yUnten - i * schritt }, { x: x0 + sBild, y: yUnten - i * schritt }, "ae-gitter"));
  }
  // Originalquadrat darüber, damit man das "eine Kästchen" wiedererkennt
  g.appendChild(svgEl("rect", { x: x0, y: yUnten - schritt, width: schritt, height: schritt, class: "ae-original" }));

  g.appendChild(svgText(x0 + schritt / 2, yUnten - schritt / 2 + 5, "1×", { class: "ae-name" }));
  g.appendChild(svgText(x0 + sBild / 2, yUnten + 20, num(PT_SEITE * k, 2) + " cm", { class: "ae-strecke-text" }));

  svg.appendChild(g);
  const mount = document.getElementById("pt-mount");
  mount.innerHTML = "";
  mount.appendChild(svg);

  const A = PT_SEITE * PT_SEITE, V = PT_SEITE * PT_SEITE * PT_SEITE;
  const karten = [
    { kl: "laenge", was: "Länge", faktor: "k = " + num(k, 2), rechnung: `${num(PT_SEITE, 2)} cm → <strong>${num(PT_SEITE * k, 3)} cm</strong>` },
    { kl: "flaeche", was: "Flächeninhalt", faktor: "k² = " + num(k * k, 4), rechnung: `${num(A, 2)} cm² → <strong>${num(A * k * k, 3)} cm²</strong>` },
    { kl: "volumen", was: "Volumen (Würfel)", faktor: "k³ = " + num(k * k * k, 4), rechnung: `${num(V, 2)} cm³ → <strong>${num(V * k * k * k, 3)} cm³</strong>` },
  ];
  document.getElementById("pt-karten").innerHTML = karten
    .map((c) => `<div class="ae-potenz-karte ${c.kl}"><span class="was">${c.was}</span><span class="faktor">· ${c.faktor}</span><span class="rechnung">${c.rechnung}</span></div>`)
    .join("");

  const ganz = Number.isInteger(k);
  document.getElementById("pt-text").textContent = ganz
    ? `Ins gestreckte Quadrat passen genau ${k * k} Originalquadrate — das ist k² = ${k}² = ${k * k}.`
    : `Bei k = ${num(k, 2)} passt kein ganzzahliges Vielfaches hinein; der Flächeninhalt wächst trotzdem exakt auf das ${num(k * k, 4)}-fache.`;
}

function initPotenzen() {
  document.getElementById("pt-k").addEventListener("input", renderPotenzen);
  renderPotenzen();
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

// Aufgabe 1 — zentrische Streckung vorwärts oder rückwärts.
// Konstruktiv: Die Urbildlänge ist ganzzahlig, das Bild ist ihr k-Faches.
// Damit ist auch beim Rückwärtsrechnen die Lösung ganzzahlig.
function generateAufgabe1() {
  const k = randInt(2, 5);
  // a ab 3, damit a·k niemals mit a+k zusammenfällt:
  // a·k = a+k  ⟺  (a−1)(k−1) = 1  ⟺  a = k = 2.
  const a = randInt(3, 12);
  const bild = a * k;
  const rueckwaerts = Math.random() < 0.5;

  if (!rueckwaerts) {
    return {
      promptHtml:
        `Eine Figur wird zentrisch gestreckt mit dem Streckfaktor <strong>k = ${k}</strong>. ` +
        `Eine Seite der Originalfigur ist <strong>${num(a)} cm</strong> lang. ` +
        `Wie lang ist die entsprechende Seite der Bildfigur in Zentimetern?`,
      correct: bild,
      placeholder: "Länge in cm",
      hinweis: (raw, val) => {
        if (Math.abs(val - (a + k)) < 0.01) return `Du hast <strong>addiert</strong>. k ist ein <em>Faktor</em>, kein Zuschlag: Die Seite wird ${k}-mal so lang, nicht ${k} cm länger.`;
        if (Math.abs(val - a / k) < 0.01) return `Du hast <strong>dividiert</strong>. Bei k = ${k} &gt; 1 wird die Figur größer, die Bildseite ist also länger als ${num(a)} cm.`;
        return `Multipliziere die Originallänge mit k.`;
      },
      musterloesungHtml: `Bei einer zentrischen Streckung wird <em>jede</em> Länge mit k multipliziert:<br><strong>${num(a)} cm · ${k} = ${num(bild)} cm</strong>`,
    };
  }
  return {
    promptHtml:
      `Eine Figur wird zentrisch gestreckt mit dem Streckfaktor <strong>k = ${k}</strong>. ` +
      `Eine Seite der <em>Bildfigur</em> ist <strong>${num(bild)} cm</strong> lang. ` +
      `Wie lang war die entsprechende Seite der Originalfigur in Zentimetern?`,
    correct: a,
    placeholder: "Länge in cm",
    hinweis: (raw, val) => {
      if (Math.abs(val - bild * k) < 0.01) return `Du hast <strong>multipliziert</strong>. Gesucht ist hier das Original — es ist <em>kleiner</em> als das Bild, du musst also durch k teilen.`;
      if (Math.abs(val - (bild - k)) < 0.01) return `Du hast <strong>subtrahiert</strong>. k ist ein Faktor, kein Zuschlag.`;
      return `Rechne rückwärts: Aus Bild = Original · k folgt Original = Bild : k.`;
    },
    musterloesungHtml: `Aus Bild = Original · k folgt Original = Bild : k:<br><strong>${num(bild)} cm : ${k} = ${num(a)} cm</strong>`,
  };
}

// Aufgabe 2 — 1. Strahlensatz. Konstruktiv: ZA' = m · ZA und ZB' = m · ZB mit
// ganzzahligem m, damit die gesuchte Länge ganzzahlig ist.
function generateAufgabe2() {
  const m = randInt(2, 4);
  const p = randInt(3, 9);
  // q ≠ p, sonst fiele der Fehler "Differenz addiert" mit der richtigen Lösung
  // zusammen: q·m = q + p·(m−1) ⟺ q = p.
  let q = randInt(3, 9);
  if (q === p) q = p + randInt(1, 4);
  const zas = p * m, zbs = q * m;
  const falschAddiert = q + p * (m - 1);

  return {
    promptHtml:
      `Von einem Punkt Z gehen zwei Strahlen aus. Sie werden von zwei zueinander parallelen Geraden geschnitten: ` +
      `die erste in A und B, die zweite in A' und B'.<br>` +
      `Gegeben sind <strong>ZA = ${num(p)} cm</strong>, <strong>ZA' = ${num(zas)} cm</strong> und <strong>ZB = ${num(q)} cm</strong>.<br>` +
      `Wie lang ist <strong>ZB'</strong> in Zentimetern?`,
    correct: zbs,
    placeholder: "ZB' in cm",
    hinweis: (raw, val) => {
      if (Math.abs(val - falschAddiert) < 0.01)
        return `Du hast die <strong>Differenz</strong> ZA' − ZA = ${num(zas - p)} cm einfach zu ZB addiert. Der Strahlensatz arbeitet aber mit <em>Verhältnissen</em>, nicht mit Differenzen.`;
      if (Math.abs(val - q / m) < 0.01)
        return `Du hast das Verhältnis <strong>umgekehrt</strong> angesetzt. Weil ZA' größer ist als ZA, muss auch ZB' größer sein als ZB.`;
      return `1. Strahlensatz: ZA : ZA' = ZB : ZB'. Stelle nach ZB' um.`;
    },
    musterloesungHtml:
      `1. Strahlensatz: ZA : ZA' = ZB : ZB'<br>` +
      `Das Streckungsverhältnis ist ZA' : ZA = ${num(zas)} : ${num(p)} = <strong>${m}</strong>.<br>` +
      `Also ist ZB' = ZB · ${m} = ${num(q)} · ${m} = <strong>${num(zbs)} cm</strong>`,
  };
}

// Aufgabe 3 — erst k aus zwei Seiten bestimmen, dann die Fläche mit k² strecken.
function generateAufgabe3() {
  const k = randInt(2, 4);
  const a = randInt(3, 9);
  const as = a * k;
  // A muss von a verschieden sein: Sonst fielen die beiden Fehlerdiagnosen
  // "nur mit k multipliziert" (A·k) und "Differenz addiert" (A + a·(k−1))
  // auf dieselbe Zahl, denn A·k = A + a·(k−1) gilt genau für A = a.
  let A = randInt(2, 15) * 2; // gerade, damit die Zahlen handlich bleiben
  if (A === a) A += 2;
  const As = A * k * k;

  return {
    promptHtml:
      `Zwei Dreiecke sind zueinander ähnlich. Im kleineren ist eine Seite <strong>${num(a)} cm</strong> lang, ` +
      `im größeren ist die entsprechende Seite <strong>${num(as)} cm</strong> lang.<br>` +
      `Das kleinere Dreieck hat den Flächeninhalt <strong>${num(A)} cm²</strong>.<br>` +
      `Wie groß ist der Flächeninhalt des größeren Dreiecks in Quadratzentimetern?`,
    correct: As,
    placeholder: "Fläche in cm²",
    hinweis: (raw, val) => {
      if (Math.abs(val - A * k) < 0.01)
        return `Du hast nur mit <strong>k = ${k}</strong> multipliziert. Beim Flächeninhalt werden aber <em>zwei</em> Längen multipliziert, und beide werden k-mal so groß — der Faktor ist deshalb k².`;
      if (Math.abs(val - A * k * k * k) < 0.01)
        return `Du hast mit <strong>k³</strong> gerechnet. k³ gehört zum <em>Volumen</em>; für einen Flächeninhalt ist k² zuständig.`;
      if (Math.abs(val - (A + (as - a))) < 0.01)
        return `Du hast die <strong>Differenz</strong> der Seiten addiert. Ähnlichkeit arbeitet mit Faktoren, nicht mit Differenzen.`;
      return `Bestimme zuerst k aus den beiden Seiten, dann strecke die Fläche mit k².`;
    },
    musterloesungHtml:
      `<strong>1. Streckfaktor bestimmen:</strong> k = ${num(as)} : ${num(a)} = <strong>${k}</strong><br>` +
      `<strong>2. Fläche strecken:</strong> Flächen wachsen mit k², also<br>` +
      `A' = A · k² = ${num(A)} · ${k}² = ${num(A)} · ${num(k * k)} = <strong>${num(As)} cm²</strong>`,
  };
}

// Aufgabe 4 — Modellmaßstab: erst den Maßstab aus zwei Längen bestimmen,
// dann eine Fläche mit k² strecken und von cm² nach m² umrechnen.
// Konstruktiv: Die Antwort Z wird zuerst gewählt, daraus folgt die
// Modellfläche F = Z · (10000 / m²). Weil m ∈ {20, 25, 50} ist,
// ist 10000/m² ∈ {25, 16, 4} — F wird also immer ganzzahlig.
function generateAufgabe4() {
  const varianten = [
    { m: 20, laengen: [18, 19, 21, 22, 23, 24] },
    { m: 25, laengen: [16, 18, 20] },
    { m: 50, laengen: [8, 9, 10] },
  ];
  const v = pick(varianten);
  const m = v.m;
  const L = pick(v.laengen);      // Modelllänge in cm
  const R = (L * m) / 100;        // echte Länge in m
  const Z = randInt(6, 15);       // gesuchte Fläche in m²
  const F = Z * (10000 / (m * m)); // Modellfläche in cm², stets ganzzahlig

  return {
    promptHtml:
      `Ein Modellauto ist <strong>${num(L)} cm</strong> lang, das echte Auto <strong>${num(R, 2)} m</strong>.<br>` +
      `Die lackierte Fläche des Modells beträgt <strong>${num(F)} cm²</strong>.<br>` +
      `Wie groß ist die lackierte Fläche des echten Autos in <strong>Quadratmetern</strong>?`,
    correct: Z,
    placeholder: "Fläche in m²",
    hinweis: (raw, val) => {
      if (Math.abs(val - F * m * m) < 0.5)
        return `Das ist die Fläche in <strong>Quadratzentimetern</strong>. Rechne noch in Quadratmeter um: 1 m² = 100 cm · 100 cm = <strong>10 000 cm²</strong>.`;
      if (Math.abs(val - Z / m) < 0.005)
        return `Du hast nur mit <strong>k = ${m}</strong> gestreckt statt mit k². Beim Flächeninhalt werden zwei Längen multipliziert, beide werden k-mal so groß.`;
      if (Math.abs(val - Z * m) < 0.01)
        return `Du hast mit <strong>k³</strong> gerechnet. k³ gehört zum Volumen; eine Lackfläche wächst mit k².`;
      return `Drei Schritte: k aus den beiden Längen (auf gleiche Einheit achten!), dann · k², dann cm² in m² umrechnen.`;
    },
    musterloesungHtml:
      // L · m statt R · 100: exakt dasselbe, aber ohne den Umweg über die
      // Division durch 100, der 4,6 · 100 = 460,00000000000006 erzeugen würde.
      `<strong>1. Maßstabsfaktor:</strong> Beide Längen in derselben Einheit: ${num(R, 2)} m = ${num(L * m)} cm.<br>` +
      `k = ${num(L * m)} cm : ${num(L)} cm = <strong>${m}</strong><br>` +
      `<strong>2. Fläche strecken:</strong> Flächen wachsen mit k²:<br>` +
      `${num(F)} cm² · ${m}² = ${num(F)} · ${num(m * m)} = ${num(F * m * m)} cm²<br>` +
      `<strong>3. Umrechnen:</strong> 1 m² = 10 000 cm², also<br>` +
      `${num(F * m * m)} cm² : 10 000 = <strong>${num(Z)} m²</strong>`,
  };
}

function initExercises() {
  mountUebungsaufgaben(document.getElementById("exercises-mount"), [
    { schwierigkeit: "einfach", titel: "Aufgabe 1 — Streckfaktor anwenden", generate: generateAufgabe1 },
    { schwierigkeit: "mittel", titel: "Aufgabe 2 — Strahlensatz", generate: generateAufgabe2 },
    { schwierigkeit: "schwierig", titel: "Aufgabe 3 — Fläche einer ähnlichen Figur", generate: generateAufgabe3 },
    { schwierigkeit: "komplex", titel: "Aufgabe 4 — Modellauto lackieren", generate: generateAufgabe4 },
  ]);
}

// ================= Quizze =================

function initQuizzes() {
  mountQuiz(document.getElementById("quiz-streckung"), {
    q: "Eine Strecke ist 6 cm lang. Sie wird zentrisch gestreckt mit k = 0,5. Wie lang ist die Bildstrecke?",
    options: ["6,5 cm", "3 cm", "12 cm", "5,5 cm"],
    correct: 1,
    explain: "ZP' = k · ZP = 0,5 · 6 cm = 3 cm. Bei 0 < k < 1 wird die Figur kleiner — trotz des Wortes „Streckung“.",
  });
  mountQuiz(document.getElementById("quiz-aehnlich"), {
    q: "Zwei Rechtecke: das erste 3 cm × 5 cm, das zweite 6 cm × 8 cm. Sind sie ähnlich?",
    options: [
      "ja, beide Seiten wurden vergrößert",
      "nein, denn 6 : 3 = 2, aber 8 : 5 = 1,6",
      "ja, denn alle Winkel sind 90°",
      "das lässt sich ohne die Diagonalen nicht entscheiden",
    ],
    correct: 1,
    explain: "Gleiche Winkel allein genügen bei Vierecken nicht. Die Seitenverhältnisse müssen übereinstimmen — hier tun sie es nicht: 2 ≠ 1,6. Ähnlich wäre 6 cm × 10 cm.",
  });
  mountQuiz(document.getElementById("quiz-strahlensaetze"), {
    q: "Es gilt ZA = 4 cm, ZA' = 12 cm und ZB = 5 cm. Wie lang ist ZB'?",
    options: ["13 cm", "15 cm", "20 cm", "9 cm"],
    correct: 1,
    explain: "ZA' : ZA = 12 : 4 = 3. Nach dem 1. Strahlensatz gilt dasselbe Verhältnis auf dem zweiten Strahl: ZB' = 3 · 5 cm = 15 cm. Die 13 cm bekäme man, wenn man die Differenz 8 cm addierte — das wäre keine Streckung.",
  });
  mountQuiz(document.getElementById("quiz-saetze"), {
    q: "Zwei Dreiecke stimmen in zwei Winkeln überein. Was folgt daraus?",
    options: [
      "gar nichts, man braucht noch eine Seite",
      "sie sind ähnlich, denn der dritte Winkel ergibt sich aus der Winkelsumme",
      "sie sind kongruent",
      "nur wenn die Winkel gleich groß sind wie 60°",
    ],
    correct: 1,
    explain: "Wegen der Winkelsumme von 180° ist auch der dritte Winkel festgelegt. Damit haben beide Dreiecke dieselbe Form — das ist der Ähnlichkeitssatz WW. Kongruent sind sie deshalb aber nicht: Die Größe bleibt offen.",
  });
  mountQuiz(document.getElementById("quiz-potenzen"), {
    q: "Ein Aquarium wird in allen Maßen verdoppelt. Wie viel Wasser passt jetzt hinein?",
    options: ["doppelt so viel", "achtmal so viel", "viermal so viel", "sechsmal so viel"],
    correct: 1,
    explain: "Das Volumen wächst mit k³ = 2³ = 8. Viermal so viel wäre die Antwort für die Glasfläche (k² = 4), doppelt so viel gilt nur für einzelne Längen.",
  });
}

// ================= Start =================

initStreckung();
initAehnlich();
initStrahlensaetze();
initSaetze();
initPotenzen();
initExercises();
initQuizzes();
