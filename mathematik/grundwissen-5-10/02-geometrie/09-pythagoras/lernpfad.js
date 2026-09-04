// Selbstlernpfad "Satzgruppe des Pythagoras" (Grundwissen Klasse 5-10).
// Rein clientseitiges Vanilla-JS, ohne Build-Schritt oder externe Bibliotheken.
//
// Leitgedanke: Der Satz ist eine Aussage über FLÄCHEN, nicht über Längen.
// Deshalb zeigt jede Zeichnung die Quadrate beziehungsweise Rechtecke, deren
// Inhalte verglichen werden — und die Bilanz darunter rechnet sie vor.
//
// Durchgehende Farbcodierung: Kathete a grün, Kathete b orange, Hypotenuse c
// blau, Höhe h rot, Hypotenusenabschnitte p und q violett. Jedes Quadrat trägt
// die Farbe seiner Seite.
//
// Zu den Zahlen: p und q sind ganzzahlig, h und die Katheten meist nicht.
// Die QUADRATE sind aber immer ganzzahlig (h² = p·q, a² = c·p). Die Bilanz
// zeigt deshalb die Quadrate exakt und die Längen gerundet.

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
// Rechter-Winkel-Zeichen am Punkt p zwischen den Richtungen zu q und r
function rechterWinkel(p, q, r, s = 11) {
  const e = (z) => {
    const l = Math.hypot(z.x - p.x, z.y - p.y) || 1;
    return { x: ((z.x - p.x) / l) * s, y: ((z.y - p.y) / l) * s };
  };
  const u = e(q), v = e(r);
  return svgEl("path", {
    d: `M ${(p.x + u.x).toFixed(2)} ${(p.y + u.y).toFixed(2)} L ${(p.x + u.x + v.x).toFixed(2)} ${(p.y + u.y + v.y).toFixed(2)} L ${(p.x + v.x).toFixed(2)} ${(p.y + v.y).toFixed(2)}`,
    fill: "none",
    stroke: "#b3261e",
    "stroke-width": 1.6,
  });
}
// Achtung beim Zuschneiden der viewBox: Eine mitgeführte viewBox skaliert die
// gesamte Zeichnung auf die Breite des Containers — und damit auch die
// Beschriftungen. Bei kleinen Figuren werden die Namen dann riesig. Deshalb
// bekommen die Abschnitte mit stark wechselnder Figurengröße einen FESTEN
// Rahmen und stattdessen einen mitwachsenden Maßstab (siehe massstab()).
// autoViewBox bleibt nur dort, wo die Figur ohnehin ähnlich groß bleibt.
function autoViewBox(svg, punkte, rand = 30) {
  const xs = punkte.map((p) => p.x), ys = punkte.map((p) => p.y);
  const x0 = Math.min(...xs) - rand, y0 = Math.min(...ys) - rand;
  const b = Math.max(...xs) + rand - x0, h = Math.max(...ys) + rand - y0;
  svg.setAttribute("viewBox", `${x0.toFixed(1)} ${y0.toFixed(1)} ${b.toFixed(1)} ${h.toFixed(1)}`);
}
function mitte(p, q) {
  return { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 };
}
// Seitenbeschriftung von der Seitenmitte aus NACH AUSSEN versetzt, weg vom
// Schwerpunkt der Figur — sonst liegt der Name auf der gezeichneten Linie.
function seitenLabel(schwerpunkt, p, q, weite = 17) {
  const m = mitte(p, q);
  const d = { x: m.x - schwerpunkt.x, y: m.y - schwerpunkt.y };
  const l = Math.hypot(d.x, d.y) || 1;
  return { x: m.x + (d.x / l) * weite, y: m.y + (d.y / l) * weite + 4 };
}
// "=" oder "≈"? Die hier auftretenden Längen sind Wurzeln aus ganzen Zahlen.
// Eine solche Wurzel ist entweder selbst ganzzahlig oder irrational — ein
// Zwischending gibt es nicht. Wer bei √36 = 6 ein "≈" schreibt, gewöhnt
// Schülerinnen und Schülern an, exakte Werte für Näherungen zu halten.
function beschriftung(name, wert, stellen = 2) {
  return Number.isInteger(wert) ? `${name} = ${num(wert)}` : `${name} ≈ ${num(wert, stellen)}`;
}
// Pixel je Einheit, so dass eine Figur von breiteEinheiten × hoeheEinheiten
// den verfügbaren Platz ausfüllt. So bleibt die Figur bei jeder Einstellung
// etwa gleich groß — und die Schriftgröße damit konstant.
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

// ================= 1. Der Satz: Quadrate über den Seiten =================

function renderSatz() {
  const a = Number(document.getElementById("ps-a").value);
  const b = Number(document.getElementById("ps-b").value);
  const gitter = document.getElementById("ps-gitter").checked;
  document.getElementById("ps-a-anzeige").textContent = a + " cm";
  document.getElementById("ps-b-anzeige").textContent = b + " cm";

  const c = Math.sqrt(a * a + b * b);

  // Mathematische Koordinaten (y nach oben), rechter Winkel bei C im Ursprung.
  // C = (0,0), B = (a,0) — also liegt die Kathete a auf der x-Achse —
  // und A = (0,b). Die Hypotenuse c verbindet A mit B.
  // Die Gesamtfigur reicht in x von −b bis a+b und in y von −a bis a+b.
  // Der Maßstab wächst mit, damit sie den Rahmen stets ähnlich gut ausfüllt.
  const px = massstab(a + 2 * b, 2 * a + b, 470, 450);
  const m2s = (p) => ({ x: 40 + (p.x + b) * px, y: 40 + (a + b - p.y) * px });
  const C = { x: 0, y: 0 }, B = { x: a, y: 0 }, A = { x: 0, y: b };

  const svg = neueFlaeche(550, 530);
  const g = svgEl("g");
  const alle = [];
  const zeichne = (ecken, klasse) => {
    const s = ecken.map(m2s);
    alle.push(...s);
    g.appendChild(polygon(s, klasse));
    return s;
  };

  // Quadrat über a (nach unten) und über b (nach links)
  zeichne([C, B, { x: a, y: -a }, { x: 0, y: -a }], "py-quadrat-a");
  zeichne([C, A, { x: -b, y: b }, { x: -b, y: 0 }], "py-quadrat-b");
  // Quadrat über c: von A und B aus in Richtung der äußeren Normalen (b, a)
  zeichne([A, B, { x: a + b, y: a }, { x: b, y: b + a }], "py-quadrat-c");

  // Einheitskästchen in den beiden Kathetenquadraten — dort sind die Seiten
  // ganzzahlig, die Fläche lässt sich also wirklich abzählen. Im Quadrat über c
  // ginge das nicht: c ist meistens irrational.
  if (gitter) {
    const gitterlinie = (p, q, farbe) => {
      const l = linie(p, q, "py-gitter");
      l.setAttribute("stroke", farbe);
      g.appendChild(l);
    };
    for (let i = 1; i < a; i++) {
      gitterlinie(m2s({ x: i, y: 0 }), m2s({ x: i, y: -a }), "#157347");
      gitterlinie(m2s({ x: 0, y: -i }), m2s({ x: a, y: -i }), "#157347");
    }
    for (let i = 1; i < b; i++) {
      gitterlinie(m2s({ x: -i, y: 0 }), m2s({ x: -i, y: b }), "#b3650a");
      gitterlinie(m2s({ x: -b, y: i }), m2s({ x: 0, y: i }), "#b3650a");
    }
  }

  // Das Dreieck zuletzt, damit es über den Quadraten liegt
  g.appendChild(polygon([C, B, A].map(m2s), "py-dreieck"));
  g.appendChild(linie(m2s(C), m2s(B), "py-seite-a"));
  g.appendChild(linie(m2s(C), m2s(A), "py-seite-b"));
  g.appendChild(linie(m2s(A), m2s(B), "py-seite-c"));
  g.appendChild(rechterWinkel(m2s(C), m2s(B), m2s(A)));

  // Beschriftungen
  g.appendChild(svgText(m2s({ x: a / 2, y: 0 }).x, m2s({ x: a / 2, y: 0 }).y - 7, "a = " + a, { class: "py-name-a" }));
  g.appendChild(svgText(m2s({ x: 0, y: b / 2 }).x + 26, m2s({ x: 0, y: b / 2 }).y, "b = " + b, { class: "py-name-b" }));
  const mc = mitte(m2s(A), m2s(B));
  g.appendChild(svgText(mc.x + 24, mc.y - 8, beschriftung("c", c), { class: "py-name-c" }));

  g.appendChild(svgText(m2s({ x: a / 2, y: -a / 2 }).x, m2s({ x: a / 2, y: -a / 2 }).y + 5, "a² = " + a * a, { class: "py-flaechentext", fill: "#157347" }));
  g.appendChild(svgText(m2s({ x: -b / 2, y: b / 2 }).x, m2s({ x: -b / 2, y: b / 2 }).y + 5, "b² = " + b * b, { class: "py-flaechentext", fill: "#b3650a" }));
  const mq = m2s({ x: (a + b) / 2, y: (a + b) / 2 });
  g.appendChild(svgText(mq.x, mq.y + 5, "c² = " + (a * a + b * b), { class: "py-flaechentext", fill: "#1d4ed8" }));

  svg.appendChild(g);
  const mount = document.getElementById("ps-mount");
  mount.innerHTML = "";
  mount.appendChild(svg);

  document.getElementById("ps-bilanz").innerHTML =
    `<span class="qa">a² = ${a}² = ${a * a}</span> &nbsp;+&nbsp; <span class="qb">b² = ${b}² = ${b * b}</span>` +
    ` &nbsp;=&nbsp; <span class="qc">${a * a + b * b} = c²</span><br>` +
    `Also ist c = √${a * a + b * b} ≈ <span class="qc">${num(c, 3)} cm</span>.`;

  const ganz = Number.isInteger(c);
  document.getElementById("ps-text").textContent = ganz
    ? `Hier geht die Wurzel glatt auf: ${a}, ${b} und ${c} bilden ein pythagoreisches Tripel. Solche Zahlentripel sind selten — meist ist c irrational.`
    : `Die beiden kleinen Quadrate enthalten zusammen ${a * a} + ${b * b} = ${a * a + b * b} Kästchen — genau so viele wie das große. Die Seitenlänge c = √${a * a + b * b} ist dabei keine ganze Zahl.`;
}

function initSatz() {
  ["ps-a", "ps-b", "ps-gitter"].forEach((id) => document.getElementById(id).addEventListener("input", renderSatz));
  renderSatz();
}

// ================= 2. Der Zerlegungsbeweis =================

const BW_PX = 21;

function renderBeweis() {
  const a = Number(document.getElementById("bw-a").value);
  const b = Number(document.getElementById("bw-b").value);
  document.getElementById("bw-a-anzeige").textContent = a + " cm";
  document.getElementById("bw-b-anzeige").textContent = b + " cm";
  const s = a + b;
  const c2 = a * a + b * b;

  const svg = neueFlaeche(620, 340);
  const g = svgEl("g");
  const alle = [];

  // Beide Anordnungen liegen im GLEICH GROSSEN Rahmen der Seitenlänge a + b
  // und enthalten die GLEICHEN vier Dreiecke. Nur die Restfläche unterscheidet
  // sich — links a² + b², rechts c². Genau das ist der Beweis.
  function rahmen(ox, oy) {
    const m2s = (p) => ({ x: ox + p.x * BW_PX, y: oy + (s - p.y) * BW_PX });
    alle.push(m2s({ x: 0, y: 0 }), m2s({ x: s, y: s }));
    g.appendChild(polygon([{ x: 0, y: 0 }, { x: s, y: 0 }, { x: s, y: s }, { x: 0, y: s }].map(m2s), "py-beweisrahmen"));
    return m2s;
  }

  // --- Anordnung 1: Restfläche sind die beiden Quadrate a² und b² ---
  const m1 = rahmen(30, 30);
  g.appendChild(polygon([{ x: 0, y: 0 }, { x: a, y: 0 }, { x: a, y: a }, { x: 0, y: a }].map(m1), "py-quadrat-a"));
  g.appendChild(polygon([{ x: a, y: a }, { x: s, y: a }, { x: s, y: s }, { x: a, y: s }].map(m1), "py-quadrat-b"));
  // die vier Dreiecke füllen die beiden Rechtecke a×b
  [
    [{ x: a, y: 0 }, { x: s, y: 0 }, { x: a, y: a }],
    [{ x: s, y: 0 }, { x: s, y: a }, { x: a, y: a }],
    [{ x: 0, y: a }, { x: a, y: a }, { x: 0, y: s }],
    [{ x: a, y: a }, { x: a, y: s }, { x: 0, y: s }],
  ].forEach((t) => g.appendChild(polygon(t.map(m1), "py-beweisdreieck")));
  g.appendChild(svgText(m1({ x: a / 2, y: a / 2 }).x, m1({ x: a / 2, y: a / 2 }).y + 5, "a² = " + a * a, { class: "py-flaechentext", fill: "#157347" }));
  g.appendChild(svgText(m1({ x: (a + s) / 2, y: (a + s) / 2 }).x, m1({ x: (a + s) / 2, y: (a + s) / 2 }).y + 5, "b² = " + b * b, { class: "py-flaechentext", fill: "#b3650a" }));

  // --- Anordnung 2: Restfläche ist das eine gekippte Quadrat c² ---
  const ox2 = 30 + s * BW_PX + 60;
  const m2 = rahmen(ox2, 30);
  g.appendChild(polygon([{ x: a, y: 0 }, { x: s, y: a }, { x: b, y: s }, { x: 0, y: b }].map(m2), "py-quadrat-c"));
  [
    [{ x: 0, y: 0 }, { x: a, y: 0 }, { x: 0, y: b }],
    [{ x: a, y: 0 }, { x: s, y: 0 }, { x: s, y: a }],
    [{ x: s, y: a }, { x: s, y: s }, { x: b, y: s }],
    [{ x: b, y: s }, { x: 0, y: s }, { x: 0, y: b }],
  ].forEach((t) => g.appendChild(polygon(t.map(m2), "py-beweisdreieck")));
  const mz = m2({ x: s / 2, y: s / 2 });
  g.appendChild(svgText(mz.x, mz.y + 5, "c² = " + c2, { class: "py-flaechentext", fill: "#1d4ed8" }));

  g.appendChild(svgText(30 + (s * BW_PX) / 2, 30 + s * BW_PX + 22, "vier Dreiecke + a² + b²", { class: "py-ecke" }));
  g.appendChild(svgText(ox2 + (s * BW_PX) / 2, 30 + s * BW_PX + 22, "dieselben vier Dreiecke + c²", { class: "py-ecke" }));

  svg.appendChild(g);
  autoViewBox(svg, alle, 40);
  const mount = document.getElementById("bw-mount");
  mount.innerHTML = "";
  mount.appendChild(svg);

  const rahmenflaeche = s * s;
  const vierDreiecke = 2 * a * b;
  document.getElementById("bw-bilanz").innerHTML =
    `Beide Rahmen: (a + b)² = ${s}² = <strong>${rahmenflaeche}</strong> &nbsp;·&nbsp; die vier Dreiecke: 4 · ½ · ${a} · ${b} = <strong>${vierDreiecke}</strong><br>` +
    `Rest links: <span class="qa">a² = ${a * a}</span> + <span class="qb">b² = ${b * b}</span> = <strong>${a * a + b * b}</strong>` +
    ` &nbsp;·&nbsp; Rest rechts: <span class="qc">c² = ${c2}</span><br>` +
    `Probe: ${rahmenflaeche} − ${vierDreiecke} = <strong>${rahmenflaeche - vierDreiecke}</strong> — beide Male dieselbe Restfläche.`;

  document.getElementById("bw-text").textContent =
    "Verändere a und b: Die beiden Restflächen bleiben immer gleich groß, weil beide Rahmen gleich groß sind und dieselben vier Dreiecke enthalten.";
}

function initBeweis() {
  ["bw-a", "bw-b"].forEach((id) => document.getElementById(id).addEventListener("input", renderBeweis));
  renderBeweis();
}

// ================= 3. Die Umkehrung =================

const UK_TRIPEL = [
  [3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29], [9, 12, 15],
];

// Dreieck aus drei Seiten: A im Ursprung, B auf der x-Achse, C darüber.
function dreieckAusSeiten(a, b, c) {
  const x = (b * b + c * c - a * a) / (2 * c);
  const y = Math.sqrt(Math.max(0, b * b - x * x));
  return { A: { x: 0, y: 0 }, B: { x: c, y: 0 }, C: { x, y } };
}

function renderUmkehrung() {
  const lies = (id) => Math.round(Number(document.getElementById(id).value));
  const a = lies("uk-a"), b = lies("uk-b"), c = lies("uk-c");

  const tripelWrap = document.getElementById("uk-tripel");
  tripelWrap.innerHTML = "";
  UK_TRIPEL.forEach(([x, y, z]) => {
    const aktiv = x === a && y === b && z === c;
    const btn = el("button", { type: "button", class: aktiv ? "aktiv" : "" }, `${x} · ${y} · ${z}`);
    btn.addEventListener("click", () => {
      document.getElementById("uk-a").value = x;
      document.getElementById("uk-b").value = y;
      document.getElementById("uk-c").value = z;
      renderUmkehrung();
    });
    tripelWrap.appendChild(btn);
  });

  const bilanz = document.getElementById("uk-bilanz");
  const urteil = document.getElementById("uk-urteil");
  const mount = document.getElementById("uk-mount");

  const gueltig = [a, b, c].every((v) => Number.isFinite(v) && v > 0);
  // Dreiecksungleichung: die beiden kürzeren Seiten müssen zusammen länger
  // sein als die längste.
  const sortiert = [a, b, c].slice().sort((x, y) => x - y);
  const [k1, k2, lang] = sortiert;
  if (!gueltig || k1 + k2 <= lang) {
    mount.innerHTML = "";
    bilanz.innerHTML = gueltig
      ? `${num(k1)} + ${num(k2)} = ${num(k1 + k2)} ist nicht größer als ${num(lang)}.`
      : "Bitte drei positive Seitenlängen eintragen.";
    urteil.className = "py-urteil keins";
    urteil.textContent = gueltig
      ? "✗ Mit diesen drei Längen lässt sich gar kein Dreieck bauen — die Dreiecksungleichung ist verletzt."
      : "✗ Noch keine gültigen Seitenlängen.";
    return;
  }

  // Die Prüfung gilt IMMER für die längste Seite, egal wie sie benannt ist.
  const summe = k1 * k1 + k2 * k2, quadrat = lang * lang;
  const art = summe === quadrat ? "recht" : summe > quadrat ? "spitz" : "stumpf";

  const t = dreieckAusSeiten(a, b, c);
  const PX = massstab(t.B.x, t.C.y, 380, 210);
  const m2s = (p) => ({ x: 50 + p.x * PX, y: 260 - p.y * PX });
  const svg = neueFlaeche(480, 300);
  const g = svgEl("g");
  const P = { A: m2s(t.A), B: m2s(t.B), C: m2s(t.C) };
  g.appendChild(polygon([P.A, P.B, P.C], "py-dreieck"));
  g.appendChild(linie(P.B, P.C, "py-seite-a"));
  g.appendChild(linie(P.C, P.A, "py-seite-b"));
  g.appendChild(linie(P.A, P.B, "py-seite-c"));
  // Beim rechtwinkligen Fall den rechten Winkel markieren — er liegt der
  // längsten Seite gegenüber.
  if (art === "recht") {
    const gegenueber = lang === a ? "A" : lang === b ? "B" : "C";
    const andere = ["A", "B", "C"].filter((n) => n !== gegenueber);
    g.appendChild(rechterWinkel(P[gegenueber], P[andere[0]], P[andere[1]]));
  }
  const sp = { x: (P.A.x + P.B.x + P.C.x) / 3, y: (P.A.y + P.B.y + P.C.y) / 3 };
  const la = seitenLabel(sp, P.B, P.C), lb = seitenLabel(sp, P.C, P.A), lc = seitenLabel(sp, P.A, P.B);
  g.appendChild(svgText(la.x, la.y, "a = " + num(a), { class: "py-name-a" }));
  g.appendChild(svgText(lb.x, lb.y, "b = " + num(b), { class: "py-name-b" }));
  g.appendChild(svgText(lc.x, lc.y, "c = " + num(c), { class: "py-name-c" }));
  svg.appendChild(g);
  mount.innerHTML = "";
  mount.appendChild(svg);

  const zeichen = summe === quadrat ? "=" : summe > quadrat ? ">" : "<";
  const laengsteName = lang === c ? "c" : lang === b ? "b" : "a";
  bilanz.innerHTML =
    `Längste Seite: <strong>${laengsteName} = ${num(lang)}</strong><br>` +
    `${num(k1)}² + ${num(k2)}² = ${num(k1 * k1)} + ${num(k2 * k2)} = <strong>${num(summe)}</strong>` +
    ` &nbsp;${zeichen}&nbsp; ${num(lang)}² = <strong>${num(quadrat)}</strong>` +
    (laengsteName !== "c"
      ? `<br><em>Hinweis:</em> Die längste Seite ist hier ${laengsteName}, nicht c. Für die Prüfung zählt immer die längste Seite — sie übernimmt die Rolle von c.`
      : "");

  urteil.className = "py-urteil " + art;
  urteil.textContent =
    art === "recht"
      ? `✓ Rechtwinklig! Die beiden Quadrate der kürzeren Seiten ergeben zusammen genau das Quadrat der längsten. Der rechte Winkel liegt der Seite ${laengsteName} gegenüber.`
      : art === "spitz"
      ? "Spitzwinklig: Die Summe der beiden Quadrate ist größer als das Quadrat der längsten Seite. Alle drei Winkel sind kleiner als 90°."
      : "Stumpfwinklig: Die Summe der beiden Quadrate ist kleiner als das Quadrat der längsten Seite. Der Winkel gegenüber der längsten Seite ist größer als 90°.";
}

function initUmkehrung() {
  ["uk-a", "uk-b", "uk-c"].forEach((id) => document.getElementById(id).addEventListener("input", renderUmkehrung));
  renderUmkehrung();
}

// ================= 4. Kathetensatz und Höhensatz =================

const SG_SAETZE = [
  {
    kuerzel: "Satz des Pythagoras",
    formel: "a² + b² = c²",
    text: "Die beiden Kathetenquadrate ergeben zusammen das Hypotenusenquadrat. Er verbindet die drei Seiten des Dreiecks miteinander.",
  },
  {
    kuerzel: "Kathetensatz",
    formel: "a² = c · p und b² = c · q",
    text: "Das Quadrat über einer Kathete ist so groß wie das Rechteck aus der ganzen Hypotenuse und dem anliegenden Hypotenusenabschnitt. Merke: Zu a gehört der Abschnitt p, der unter a liegt.",
  },
  {
    kuerzel: "Höhensatz",
    formel: "h² = p · q",
    text: "Das Quadrat über der Höhe ist so groß wie das Rechteck aus den beiden Hypotenusenabschnitten. Die Höhe ist damit das geometrische Mittel von p und q.",
  },
];

let sgAktiv = 0;

function renderSatzgruppe() {
  const p = Number(document.getElementById("sg-p").value);
  const q = Number(document.getElementById("sg-q").value);
  document.getElementById("sg-p-anzeige").textContent = p + " cm";
  document.getElementById("sg-q-anzeige").textContent = q + " cm";

  const reihe = document.getElementById("sg-reihe");
  reihe.innerHTML = "";
  SG_SAETZE.forEach((satz, i) => {
    const btn = el("button", { type: "button", class: "py-satz-karte" + (i === sgAktiv ? " aktiv" : "") }, [
      el("span", { class: "kuerzel" }, satz.kuerzel),
      el("span", { class: "formel" }, satz.formel),
    ]);
    btn.addEventListener("click", () => {
      sgAktiv = i;
      renderSatzgruppe();
    });
    reihe.appendChild(btn);
  });

  // A links, B rechts, Höhenfußpunkt F im Abstand q von A.
  // Dann liegt q unter der Kathete b und p unter der Kathete a.
  const c = p + q;
  const h = Math.sqrt(p * q);
  const a = Math.sqrt(c * p);
  const b = Math.sqrt(c * q);

  const PX = Math.min(20, 420 / c);
  const A = { x: 0, y: 0 }, B = { x: c, y: 0 }, F = { x: q, y: 0 }, C = { x: q, y: h };
  const m2s = (z) => ({ x: 60 + z.x * PX, y: 180 - z.y * PX });

  const svg = neueFlaeche(620, 520);
  const g = svgEl("g");
  const alle = [];
  const P = { A: m2s(A), B: m2s(B), F: m2s(F), C: m2s(C) };
  alle.push(P.A, P.B, P.C);

  g.appendChild(polygon([P.A, P.B, P.C], "py-dreieck"));
  g.appendChild(linie(P.C, P.F, "py-hoehe"));
  g.appendChild(linie(P.A, P.F, "py-abschnitt"));
  g.appendChild(linie(P.F, P.B, "py-abschnitt"));
  g.appendChild(linie(P.B, P.C, "py-seite-a"));
  g.appendChild(linie(P.C, P.A, "py-seite-b"));
  g.appendChild(rechterWinkel(P.C, P.A, P.B, 13));
  g.appendChild(rechterWinkel(P.F, P.B, P.C, 10));

  g.appendChild(svgText(mitte(P.A, P.F).x, mitte(P.A, P.F).y + 19, "q = " + q, { class: "py-name-pq" }));
  g.appendChild(svgText(mitte(P.F, P.B).x, mitte(P.F, P.B).y + 19, "p = " + p, { class: "py-name-pq" }));
  g.appendChild(svgText(mitte(P.C, P.F).x - 20, mitte(P.C, P.F).y, beschriftung("h", h), { class: "py-name-h" }));
  g.appendChild(svgText(mitte(P.B, P.C).x + 20, mitte(P.B, P.C).y - 4, beschriftung("a", a), { class: "py-name-a" }));
  g.appendChild(svgText(mitte(P.C, P.A).x - 20, mitte(P.C, P.A).y - 4, beschriftung("b", b), { class: "py-name-b" }));

  // Unter der Zeichnung: das Quadrat und das flächengleiche Rechteck des
  // gerade gewählten Satzes, maßstäblich in derselben Einheit.
  const basisY = 460;
  const flaechePX = Math.min(PX, Math.sqrt(52000 / Math.max(c * c, 1)));
  const kasten = (x0, breite, hoehe, klasse, beschriftung, farbe) => {
    const s = [
      { x: x0, y: basisY },
      { x: x0 + breite * flaechePX, y: basisY },
      { x: x0 + breite * flaechePX, y: basisY - hoehe * flaechePX },
      { x: x0, y: basisY - hoehe * flaechePX },
    ];
    alle.push(...s, { x: x0, y: basisY - hoehe * flaechePX - 22 });
    g.appendChild(polygon(s, klasse));
    g.appendChild(svgText(x0 + (breite * flaechePX) / 2, basisY - (hoehe * flaechePX) / 2 + 5, beschriftung, { class: "py-flaechentext", fill: farbe }));
    return x0 + breite * flaechePX;
  };

  // Das Rechenzeichen gehört auf die halbe Höhe der beiden Kästen, die es
  // verbindet — an der Grundlinie sähe es aus, als stünde es unter dem Kasten.
  const operator = (x, sym, hoeheLinks, hoeheRechts) => {
    const y = basisY - (Math.max(hoeheLinks, hoeheRechts) * flaechePX) / 2 + 6;
    alle.push({ x: x + 10, y: y - 12 });
    g.appendChild(svgText(x + 10, y, sym, { class: "py-flaechentext", "font-size": 19 }));
    return x + 20;
  };

  let bilanzHtml;
  if (sgAktiv === 0) {
    // a² + b² = c²
    let x = 40;
    x = kasten(x, a, a, "py-quadrat-a", "a² = " + num(a * a), "#157347") + 8;
    x = operator(x, "+", a, b) + 8;
    x = kasten(x, b, b, "py-quadrat-b", "b² = " + num(b * b), "#b3650a") + 8;
    x = operator(x, "=", b, c) + 8;
    kasten(x, c, c, "py-quadrat-c", "c² = " + num(c * c), "#1d4ed8");
    bilanzHtml =
      `<span class="qa">a² = ${num(a * a)}</span> + <span class="qb">b² = ${num(b * b)}</span> = <span class="qc">${num(a * a + b * b)} = c² = ${c}²</span><br>` +
      `Dabei ist a² = c · p = ${c} · ${p} und b² = c · q = ${c} · ${q} — der Kathetensatz liefert beide Quadrate direkt.<br>` +
      `Die Quadrate sind ganzzahlig, die Längen meist nicht: a ≈ ${num(a, 3)}, b ≈ ${num(b, 3)}, c = ${c}.`;
  } else if (sgAktiv === 1) {
    // a² = c · p
    let x = 40;
    x = kasten(x, a, a, "py-quadrat-a", "a² = " + num(a * a), "#157347") + 8;
    x = operator(x, "=", a, p) + 8;
    kasten(x, c, p, "py-rechteck", "c · p = " + num(c * p), "#6d28d9");
    bilanzHtml =
      `<span class="qa">a² = c · p = ${c} · ${p} = ${num(a * a)}</span> &nbsp;→&nbsp; a = √${num(a * a)} ≈ ${num(a, 3)}<br>` +
      `<span class="qb">b² = c · q = ${c} · ${q} = ${num(b * b)}</span> &nbsp;→&nbsp; b = √${num(b * b)} ≈ ${num(b, 3)}<br>` +
      `Das Quadrat über der Kathete a ist genauso groß wie das Rechteck aus c und dem Abschnitt p, der unter a liegt.`;
  } else {
    // h² = p · q
    let x = 40;
    x = kasten(x, h, h, "py-quadrat-h", "h² = " + num(h * h), "#b3261e") + 8;
    x = operator(x, "=", h, q) + 8;
    kasten(x, p, q, "py-rechteck", "p · q = " + num(p * q), "#6d28d9");
    bilanzHtml =
      `<span class="qh">h² = p · q = ${p} · ${q} = ${num(p * q)}</span> &nbsp;→&nbsp; h = √${num(p * q)} ≈ ${num(h, 3)}<br>` +
      `Die Höhe ist das geometrische Mittel von p und q. Nur wenn p · q eine Quadratzahl ist, wird h ganzzahlig.`;
  }

  svg.appendChild(g);
  autoViewBox(svg, alle, 30);
  const mount = document.getElementById("sg-mount");
  mount.innerHTML = "";
  mount.appendChild(svg);

  document.getElementById("sg-bilanz").innerHTML = bilanzHtml;
  document.getElementById("sg-text").innerHTML = `<strong>${SG_SAETZE[sgAktiv].kuerzel}:</strong> ${SG_SAETZE[sgAktiv].text}`;
}

function initSatzgruppe() {
  ["sg-p", "sg-q"].forEach((id) => document.getElementById(id).addEventListener("input", renderSatzgruppe));
  renderSatzgruppe();
}

// ================= 5. Anwendungen: Raumdiagonale =================

function renderAnwendungen() {
  const l = Number(document.getElementById("an-l").value);
  const b = Number(document.getElementById("an-b").value);
  const h = Number(document.getElementById("an-h").value);
  document.getElementById("an-l-anzeige").textContent = l + " cm";
  document.getElementById("an-b-anzeige").textContent = b + " cm";
  document.getElementById("an-h-anzeige").textContent = h + " cm";

  // Schrägbild: die Tiefenachse geht nach rechts oben
  // Das Schraegbild reicht in x ueber l + 0,45·b und in y ueber h + 0,34·b.
  const AN_PX = massstab(l + 0.45 * b, h + 0.34 * b, 380, 250);
  const m2s = (x, y, z) => ({ x: 50 + x * AN_PX + y * AN_PX * 0.45, y: 300 - z * AN_PX - y * AN_PX * 0.34 });
  const E = {
    a: m2s(0, 0, 0), b: m2s(l, 0, 0), c: m2s(l, b, 0), d: m2s(0, b, 0),
    e: m2s(0, 0, h), f: m2s(l, 0, h), g: m2s(l, b, h), hh: m2s(0, b, h),
  };

  const svg = neueFlaeche(480, 340);
  const g = svgEl("g");
  // verdeckte Kanten gestrichelt
  [[E.d, E.a], [E.d, E.c], [E.d, E.hh]].forEach((k) => g.appendChild(linie(k[0], k[1], "py-hilfslinie")));
  [[E.a, E.b], [E.b, E.c], [E.e, E.f], [E.f, E.g], [E.g, E.hh], [E.hh, E.e], [E.a, E.e], [E.b, E.f], [E.c, E.g]].forEach((k) =>
    g.appendChild(linie(k[0], k[1], "py-beweisrahmen"))
  );

  const d = Math.sqrt(l * l + b * b);
  const e = Math.sqrt(l * l + b * b + h * h);

  g.appendChild(linie(E.a, E.c, "py-seite-c"));   // Bodendiagonale
  g.appendChild(linie(E.a, E.g, "py-hoehe"));     // Raumdiagonale
  g.appendChild(rechterWinkel(E.c, E.a, E.g, 12));

  g.appendChild(svgText(mitte(E.a, E.b).x, mitte(E.a, E.b).y + 18, "l = " + l, { class: "py-name-a" }));
  g.appendChild(svgText(mitte(E.b, E.c).x + 22, mitte(E.b, E.c).y + 10, "b = " + b, { class: "py-name-b" }));
  g.appendChild(svgText(mitte(E.c, E.g).x + 22, mitte(E.c, E.g).y, "h = " + h, { class: "py-name-pq" }));
  g.appendChild(svgText(mitte(E.a, E.c).x + 6, mitte(E.a, E.c).y + 16, beschriftung("d", d), { class: "py-name-c" }));
  g.appendChild(svgText(mitte(E.a, E.g).x - 14, mitte(E.a, E.g).y - 8, beschriftung("e", e), { class: "py-name-h" }));

  svg.appendChild(g);
  const mount = document.getElementById("an-mount");
  mount.innerHTML = "";
  mount.appendChild(svg);

  document.getElementById("an-bilanz").innerHTML =
    `<strong>1. Bodendiagonale:</strong> d² = l² + b² = ${l * l} + ${b * b} = <span class="qc">${l * l + b * b}</span>, also d ≈ ${num(d, 3)} cm<br>` +
    `<strong>2. Raumdiagonale:</strong> e² = d² + h² = ${l * l + b * b} + ${h * h} = <span class="qh">${l * l + b * b + h * h}</span>, also e ≈ ${num(e, 3)} cm<br>` +
    `Zusammengefasst: e = √(l² + b² + h²) = √${l * l + b * b + h * h}`;

  document.getElementById("an-text").textContent = Number.isInteger(e)
    ? `Hier geht die Wurzel glatt auf: e = ${e} cm.`
    : "Die Bodendiagonale d steht senkrecht auf der Höhe h — deshalb darf man den Satz ein zweites Mal anwenden, mit d als neuer Kathete.";
}

function initAnwendungen() {
  ["an-l", "an-b", "an-h"].forEach((id) => document.getElementById(id).addEventListener("input", renderAnwendungen));
  renderAnwendungen();
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

// Pythagoreische Grundtripel. Vielfache davon sind wieder Tripel, deshalb
// lassen sich die Zahlen durch Skalieren variieren, ohne dass die Lösung
// jemals irrational würde.
const TRIPEL = [
  [3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29], [9, 40, 41], [12, 35, 37],
];

function zufallsTripel(maxFaktor = 3) {
  const [x, y, z] = pick(TRIPEL);
  const t = randInt(1, maxFaktor);
  // Katheten zufällig vertauschen, damit nicht immer die kürzere zuerst steht
  const [a, b] = Math.random() < 0.5 ? [x * t, y * t] : [y * t, x * t];
  return { a, b, c: z * t };
}

// Aufgabe 1 — Hypotenuse aus beiden Katheten.
function generateAufgabe1() {
  const { a, b, c } = zufallsTripel(3);
  return {
    promptHtml:
      `In einem rechtwinkligen Dreieck sind die beiden Katheten <strong>a = ${num(a)} cm</strong> und <strong>b = ${num(b)} cm</strong> lang.<br>` +
      `Wie lang ist die Hypotenuse c in Zentimetern?`,
    correct: c,
    placeholder: "c in cm",
    hinweis: (raw, val) => {
      if (Math.abs(val - (a + b)) < 0.01)
        return `Du hast die beiden Katheten <strong>addiert</strong>. Der Satz addiert aber die <em>Quadrate</em>: a² + b² = c². Der direkte Weg über die Längen führt immer zu einem zu großen Ergebnis.`;
      if (Math.abs(val - (a * a + b * b)) < 0.01)
        return `Du hast a² + b² = ${num(a * a + b * b)} ausgerechnet — das ist bereits <strong>c²</strong>. Es fehlt noch die Quadratwurzel.`;
      if (Math.abs(val - Math.sqrt(Math.abs(a * a - b * b))) < 0.01)
        return `Du hast <strong>subtrahiert</strong>. Gesucht ist hier die Hypotenuse, also die längste Seite — dafür werden die Quadrate addiert.`;
      return `Setze in a² + b² = c² ein und ziehe am Ende die Wurzel.`;
    },
    musterloesungHtml:
      `c² = a² + b² = ${num(a)}² + ${num(b)}² = ${num(a * a)} + ${num(b * b)} = <strong>${num(c * c)}</strong><br>` +
      `c = √${num(c * c)} = <strong>${num(c)} cm</strong>`,
  };
}

// Aufgabe 2 — fehlende Kathete aus Hypotenuse und einer Kathete.
function generateAufgabe2() {
  const { a, b, c } = zufallsTripel(3);
  return {
    promptHtml:
      `In einem rechtwinkligen Dreieck ist die Hypotenuse <strong>c = ${num(c)} cm</strong> lang und eine Kathete misst <strong>a = ${num(a)} cm</strong>.<br>` +
      `Wie lang ist die andere Kathete b in Zentimetern?`,
    correct: b,
    placeholder: "b in cm",
    hinweis: (raw, val) => {
      if (Math.abs(val - (c - a)) < 0.01)
        return `Du hast die <strong>Längen</strong> voneinander abgezogen. Subtrahiert werden aber die <em>Quadrate</em>: b² = c² − a².`;
      if (Math.abs(val - (c * c - a * a)) < 0.01)
        return `Du hast c² − a² = ${num(c * c - a * a)} ausgerechnet — das ist bereits <strong>b²</strong>. Es fehlt noch die Quadratwurzel.`;
      if (Math.abs(val - Math.sqrt(c * c + a * a)) < 0.02)
        return `Du hast <strong>addiert</strong>. Addiert wird nur, wenn die Hypotenuse gesucht ist. Hier ist sie schon bekannt, die gesuchte Kathete ist also <em>kürzer</em> als ${num(c)} cm.`;
      return `Stelle a² + b² = c² nach b um: b² = c² − a².`;
    },
    musterloesungHtml:
      `Aus a² + b² = c² folgt b² = c² − a².<br>` +
      `b² = ${num(c)}² − ${num(a)}² = ${num(c * c)} − ${num(a * a)} = <strong>${num(b * b)}</strong><br>` +
      `b = √${num(b * b)} = <strong>${num(b)} cm</strong>`,
  };
}

// Aufgabe 3 — Höhensatz oder Kathetensatz.
// Höhensatz konstruktiv: p = u², q = v² ergibt h = u · v, also ganzzahlig.
// u ≠ v ist nötig, sonst fiele der Fehlerwert (p + q) : 2 mit der Lösung
// zusammen: u · v = (u² + v²) : 2 gilt genau für u = v.
// Kathetensatz konstruktiv: aus einem Tripel (x, y, z) wird
// p = x²·t, q = y²·t, c = z²·t und a = x·z·t — dann ist a² = c · p exakt.
function generateAufgabe3() {
  if (Math.random() < 0.5) {
    const u = randInt(2, 7);
    let v = randInt(2, 7);
    if (v === u) v = u === 7 ? u - 1 : u + 1;
    const p = u * u, q = v * v, h = u * v;
    return {
      promptHtml:
        `In einem rechtwinkligen Dreieck teilt die Höhe h die Hypotenuse in die beiden Abschnitte ` +
        `<strong>p = ${num(p)} cm</strong> und <strong>q = ${num(q)} cm</strong>.<br>` +
        `Wie lang ist die Höhe h in Zentimetern?`,
      correct: h,
      placeholder: "h in cm",
      hinweis: (raw, val) => {
        if (Math.abs(val - (p + q)) < 0.01)
          return `Du hast die beiden Abschnitte <strong>addiert</strong>. p + q = ${num(p + q)} ist die ganze Hypotenuse c, nicht die Höhe.`;
        if (Math.abs(val - (p + q) / 2) < 0.01)
          return `Du hast den <strong>Mittelwert</strong> gebildet. Der Höhensatz verlangt aber das <em>geometrische</em> Mittel: h = √(p · q), nicht (p + q) : 2.`;
        if (Math.abs(val - p * q) < 0.01)
          return `Du hast p · q = ${num(p * q)} ausgerechnet — das ist bereits <strong>h²</strong>. Es fehlt noch die Quadratwurzel.`;
        return `Höhensatz: h² = p · q.`;
      },
      musterloesungHtml:
        `Höhensatz: h² = p · q = ${num(p)} · ${num(q)} = <strong>${num(p * q)}</strong><br>` +
        `h = √${num(p * q)} = <strong>${num(h)} cm</strong>`,
    };
  }
  const [x, y, z] = pick([[3, 4, 5], [5, 12, 13], [8, 15, 17]]);
  const t = randInt(1, 2);
  const p = x * x * t, c = z * z * t, a = x * z * t;
  return {
    promptHtml:
      `In einem rechtwinkligen Dreieck ist die Hypotenuse <strong>c = ${num(c)} cm</strong> lang. ` +
      `Die Höhe teilt sie so, dass unter der Kathete a der Abschnitt <strong>p = ${num(p)} cm</strong> liegt.<br>` +
      `Wie lang ist die Kathete a in Zentimetern?`,
    correct: a,
    placeholder: "a in cm",
    hinweis: (raw, val) => {
      if (Math.abs(val - c * p) < 0.01)
        return `Du hast c · p = ${num(c * p)} ausgerechnet — das ist bereits <strong>a²</strong>. Es fehlt noch die Quadratwurzel.`;
      if (Math.abs(val - (c - p)) < 0.01)
        return `${num(c - p)} ist der <em>andere</em> Hypotenusenabschnitt q. Der Kathetensatz multipliziert aber: a² = c · p.`;
      if (Math.abs(val - Math.sqrt(c * (c - p))) < 0.02)
        return `Du hast mit dem <strong>falschen Abschnitt</strong> gerechnet. Zu a gehört p — der Abschnitt, der unter a liegt. Mit q käme die andere Kathete b heraus.`;
      return `Kathetensatz: a² = c · p.`;
    },
    musterloesungHtml:
      `Kathetensatz: a² = c · p = ${num(c)} · ${num(p)} = <strong>${num(a * a)}</strong><br>` +
      `a = √${num(a * a)} = <strong>${num(a)} cm</strong>`,
  };
}

// Aufgabe 4 — Raumdiagonale eines Quaders, zwei Anwendungen hintereinander.
// Die Kantenlängen stammen aus einer geprüften Liste, für die l² + b² + h²
// eine Quadratzahl ist; Vielfache erhalten diese Eigenschaft.
// Reihenfolge beachten: Breite und Höhe dürfen nicht übereinstimmen, sonst
// ergäbe der Fehler "nur Boden gerechnet" (√(l²+b²)) dieselbe Zahl wie der
// Fehler "eine Kante vergessen" (√(l²+h²)) — die Fehlerdiagnose wäre
// mehrdeutig. Deshalb steht (2, 2, 1) statt (1, 2, 2).
const QUADER = [
  [2, 2, 1, 3], [2, 3, 6, 7], [1, 4, 8, 9], [4, 4, 7, 9],
  [2, 6, 9, 11], [6, 6, 7, 11], [3, 4, 12, 13], [12, 15, 16, 25],
];

function generateAufgabe4() {
  const [l0, b0, h0, e0] = pick(QUADER);
  const t = randInt(1, 3);
  const l = l0 * t, b = b0 * t, h = h0 * t, e = e0 * t;
  const boden = l * l + b * b;

  return {
    promptHtml:
      `Eine Kiste ist innen <strong>${num(l)} cm</strong> lang, <strong>${num(b)} cm</strong> breit und <strong>${num(h)} cm</strong> hoch.<br>` +
      `Wie lang darf ein gerader Stab höchstens sein, damit er noch hineinpasst? Gesucht ist die <strong>Raumdiagonale</strong> in Zentimetern.`,
    correct: e,
    placeholder: "Raumdiagonale in cm",
    hinweis: (raw, val) => {
      if (Math.abs(val - (l + b + h)) < 0.01)
        return `Du hast die drei Kanten <strong>addiert</strong>. Addiert werden aber die Quadrate: e² = l² + b² + h².`;
      if (Math.abs(val - (l * l + b * b + h * h)) < 0.01)
        return `Du hast l² + b² + h² = ${num(l * l + b * b + h * h)} ausgerechnet — das ist bereits <strong>e²</strong>. Es fehlt noch die Quadratwurzel.`;
      if (Math.abs(val - Math.sqrt(boden)) < 0.05)
        return `Das ist erst die <strong>Bodendiagonale</strong> d ≈ ${num(Math.sqrt(boden), 2)} cm. Jetzt musst du den Satz ein zweites Mal anwenden — mit d als Kathete und der Höhe h als zweiter Kathete.`;
      if (Math.abs(val - Math.sqrt(l * l + h * h)) < 0.05)
        return `Du hast nur zwei der drei Kanten verwendet. In die Raumdiagonale gehen <strong>alle drei</strong> ein: e² = l² + b² + h².`;
      return `Zwei Schritte: erst die Bodendiagonale d² = l² + b², dann e² = d² + h².`;
    },
    musterloesungHtml:
      `<strong>1. Bodendiagonale:</strong> d² = l² + b² = ${num(l)}² + ${num(b)}² = ${num(l * l)} + ${num(b * b)} = <strong>${num(boden)}</strong><br>` +
      `<strong>2. Raumdiagonale:</strong> Die Bodendiagonale steht senkrecht auf der Höhe, also gilt<br>` +
      `e² = d² + h² = ${num(boden)} + ${num(h * h)} = <strong>${num(e * e)}</strong><br>` +
      `e = √${num(e * e)} = <strong>${num(e)} cm</strong><br>` +
      `<em>Kurzform:</em> e = √(l² + b² + h²)`,
  };
}

function initExercises() {
  mountUebungsaufgaben(document.getElementById("exercises-mount"), [
    { schwierigkeit: "einfach", titel: "Aufgabe 1 — Hypotenuse berechnen", generate: generateAufgabe1 },
    { schwierigkeit: "mittel", titel: "Aufgabe 2 — fehlende Kathete", generate: generateAufgabe2 },
    { schwierigkeit: "schwierig", titel: "Aufgabe 3 — Höhensatz und Kathetensatz", generate: generateAufgabe3 },
    { schwierigkeit: "komplex", titel: "Aufgabe 4 — Raumdiagonale einer Kiste", generate: generateAufgabe4 },
  ]);
}

// ================= Quizze =================

function initQuizzes() {
  mountQuiz(document.getElementById("quiz-satz"), {
    q: "Ein rechtwinkliges Dreieck hat die Katheten 6 cm und 8 cm. Wie lang ist die Hypotenuse?",
    options: ["14 cm", "10 cm", "100 cm", "√14 cm"],
    correct: 1,
    explain: "c² = 6² + 8² = 36 + 64 = 100, also c = √100 = 10 cm. Die 14 cm wären die Summe der Katheten — die Hypotenuse ist immer kürzer als beide zusammen.",
  });
  mountQuiz(document.getElementById("quiz-beweis"), {
    q: "Worauf beruht der Zerlegungsbeweis?",
    options: [
      "darauf, dass die vier Dreiecke gleichschenklig sind",
      "darauf, dass beide Anordnungen dasselbe Quadrat mit denselben vier Dreiecken füllen",
      "darauf, dass a + b = c gilt",
      "darauf, dass man die Seiten misst und vergleicht",
    ],
    correct: 1,
    explain: "Gleich großer Rahmen, gleiche vier Dreiecke — also muss auch die Restfläche gleich groß sein. Links ist sie a² + b², rechts c². Gemessen wird dabei nichts, es wird nur verglichen.",
  });
  mountQuiz(document.getElementById("quiz-umkehrung"), {
    q: "Ein Dreieck hat die Seiten 6 cm, 7 cm und 9 cm. Was gilt?",
    options: [
      "es ist rechtwinklig, denn 36 + 49 = 85",
      "es ist spitzwinklig, denn 36 + 49 = 85 > 81",
      "es ist stumpfwinklig, denn 85 > 81",
      "das lässt sich ohne Winkelmesser nicht sagen",
    ],
    correct: 1,
    explain: "Die längste Seite ist 9, ihr Quadrat ist 81. Die Summe der anderen beiden Quadrate ist 36 + 49 = 85. Weil 85 > 81 ist, ist das Dreieck spitzwinklig. Bei Gleichheit wäre es rechtwinklig.",
  });
  mountQuiz(document.getElementById("quiz-satzgruppe"), {
    q: "Die Höhe teilt die Hypotenuse in p = 4 cm und q = 9 cm. Wie lang ist die Höhe?",
    options: ["13 cm", "6 cm", "6,5 cm", "36 cm"],
    correct: 1,
    explain: "Höhensatz: h² = p · q = 4 · 9 = 36, also h = 6 cm. Die 13 cm wären p + q, also die ganze Hypotenuse; 6,5 cm wäre der Mittelwert — gefragt ist aber das geometrische Mittel.",
  });
  mountQuiz(document.getElementById("quiz-anwendungen"), {
    q: "Warum darf man für die Raumdiagonale den Satz zweimal hintereinander anwenden?",
    options: [
      "weil ein Quader sechs Flächen hat",
      "weil die Bodendiagonale senkrecht auf der Höhe steht, also wieder ein rechtwinkliges Dreieck entsteht",
      "weil alle Kanten gleich lang sind",
      "das darf man gar nicht, man braucht eine eigene Formel",
    ],
    correct: 1,
    explain: "Die senkrechte Kante steht auf der ganzen Grundfläche senkrecht, also auch auf der Bodendiagonalen. Bodendiagonale und Höhe bilden damit erneut ein rechtwinkliges Dreieck, dessen Hypotenuse die Raumdiagonale ist.",
  });
}

// ================= Start =================

initSatz();
initBeweis();
initUmkehrung();
initSatzgruppe();
initAnwendungen();
initExercises();
initQuizzes();
