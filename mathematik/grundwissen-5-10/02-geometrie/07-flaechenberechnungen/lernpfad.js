// Selbstlernpfad "Flächenberechnungen" (Grundwissen Klasse 5-10).
// Rein clientseitiges Vanilla-JS, ohne Build-Schritt oder externe Bibliotheken.
//
// Leitgedanke: Jede Formel wird auf das Rechteck zurückgeführt. Deshalb zeigt jede
// Zeichnung nicht nur die Figur, sondern auch das UMLEGEN beziehungsweise die
// gedrehte Kopie, aus der die Formel folgt — die Herleitung ist Teil des Bildes.
//
// Durchgehende Farbcodierung: Grundseite grün, Höhe rot, schräge Seite orange,
// Diagonalen violett. Die Höhe bekommt eine eigene kräftige Farbe, weil ihre
// Verwechslung mit der schrägen Seite der häufigste Fehler des Kapitels ist.

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
function clampInt(v, lo, hi) {
  const n = Math.round(Number(String(v).replace(",", ".")));
  if (isNaN(n)) return lo;
  return Math.max(lo, Math.min(hi, n));
}
function parseFlexibleNumber(raw) {
  if (raw == null) return NaN;
  const s = String(raw).trim().replace(/\s/g, "").replace(/−/g, "-").replace(/\./g, "").replace(",", ".");
  return parseFloat(s);
}
function neueFlaeche(w, h) {
  return svgEl("svg", { viewBox: `0 0 ${w} ${h}`, width: w, height: h, class: "geo-svg", preserveAspectRatio: "xMidYMid meet" });
}
// 26 Pixel entsprechen 1 cm — damit bleiben auch 14-cm-Figuren auf der Fläche.
const PX = 26;

function polygon(punkte, klasse) {
  return svgEl("polygon", { points: punkte.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" "), class: klasse });
}
function linie(p, q, klasse) {
  return svgEl("line", { x1: p.x, y1: p.y, x2: q.x, y2: q.y, class: klasse });
}
// Das rechte-Winkel-Zeichen zwischen zwei Richtungen an einem Punkt
function rechterWinkel(p, r1, r2, s = 10) {
  const e = (v) => {
    const l = Math.hypot(v.x, v.y) || 1;
    return { x: (v.x / l) * s, y: (v.y / l) * s };
  };
  const a = e(r1), b = e(r2);
  return svgEl("path", {
    d: `M ${p.x + a.x} ${p.y + a.y} L ${p.x + a.x + b.x} ${p.y + a.y + b.y} L ${p.x + b.x} ${p.y + b.y}`,
    fill: "none",
    stroke: "#b3261e",
    "stroke-width": 1.6,
  });
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

// ================= 1. Parallelogramm =================

function renderParallelogramm() {
  const g = clampInt(document.getElementById("pg-g").value, 2, 12);
  const h = clampInt(document.getElementById("pg-h").value, 1, 8);
  // Der Versatz darf die Grundseite nicht überschreiten — sonst läge die Schnittlinie
  // außerhalb der Figur und das Umlegen ginge nicht in einem Stück.
  const s = Math.min(clampInt(document.getElementById("pg-scher").value, 0, 10), g);
  const umlegen = document.getElementById("pg-umlegen").checked;
  document.getElementById("pg-scher-anzeige").textContent = s + " cm";
  const mount = document.getElementById("pg-mount");
  mount.innerHTML = "";

  const rand = 46;
  const W = (g + s + g) * PX + 2 * rand;
  const H = h * PX + 2 * rand + 22;
  const svg = neueFlaeche(W, H);
  const x0 = rand,
    yU = rand + h * PX,
    yO = rand;
  // Parallelogramm: unten von x0 nach x0+g, oben um s versetzt
  const A = { x: x0, y: yU },
    B = { x: x0 + g * PX, y: yU },
    C = { x: x0 + (g + s) * PX, y: yO },
    D = { x: x0 + s * PX, y: yO };

  // Das flächengleiche Rechteck reicht von x = s bis x = s + g.
  if (umlegen) {
    svg.appendChild(
      polygon(
        [
          { x: x0 + s * PX, y: yU },
          { x: x0 + (s + g) * PX, y: yU },
          { x: x0 + (s + g) * PX, y: yO },
          { x: x0 + s * PX, y: yO },
        ],
        "fig-vergleich"
      )
    );
    // Das links abgeschnittene Dreieck, an die rechte Seite versetzt
    svg.appendChild(polygon([B, { x: x0 + (s + g) * PX, y: yU }, C], "fig-umgelegt"));
  }
  svg.appendChild(polygon([A, B, C, D], "fig-flaeche"));
  if (umlegen) {
    // Das Originaldreieck links und die Schnittlinie
    svg.appendChild(polygon([A, { x: x0 + s * PX, y: yU }, D], "fig-umgelegt"));
    svg.appendChild(linie(D, { x: x0 + s * PX, y: yU }, "mass-hoehe-verlaengert"));
  }

  // Grundseite, Höhe und schräge Seite
  svg.appendChild(linie(A, B, "mass-grund"));
  svg.appendChild(linie({ x: A.x + 6, y: yU }, { x: A.x + 6, y: yO }, "mass-hoehe"));
  svg.appendChild(rechterWinkel({ x: A.x + 6, y: yU }, { x: 1, y: 0 }, { x: 0, y: -1 }));
  svg.appendChild(linie(A, D, "mass-schraeg"));
  svg.appendChild(svgText((A.x + B.x) / 2, yU + 20, `g = ${g} cm`, { class: "name-grund" }));
  svg.appendChild(svgText(A.x - 16, (yU + yO) / 2 + 4, `h = ${h} cm`, { class: "name-hoehe" }));
  const b = Math.sqrt(s * s + h * h);
  svg.appendChild(svgText((A.x + D.x) / 2 - 4, (yU + yO) / 2 - 8, `b ≈ ${num(b, 2)} cm`, { class: "name-schraeg" }));
  mount.appendChild(svg);

  const A_ = g * h;
  document.getElementById("pg-flaeche").textContent = `A = g · h = ${g} · ${h} = ${A_} cm²`;
  document.getElementById("pg-text").innerHTML =
    (s === 0
      ? `Bei Schrägung 0 ist das Parallelogramm ein <strong>Rechteck</strong> — die schräge Seite fällt mit der Höhe zusammen.<br>`
      : `Das links abgeschnittene Dreieck passt <strong>genau</strong> an die rechte Seite. Die grün gestrichelte Fläche ist das flächengleiche Rechteck.<br>`) +
    `<span class="legende-g">g = ${g} cm</span> &nbsp;·&nbsp; <span class="legende-h">h = ${h} cm</span> &nbsp;·&nbsp; ` +
    `<span class="legende-b">schräge Seite b ≈ ${num(b, 2)} cm</span><br>` +
    (s === 0
      ? `<span class="progress-note">Schieb die Schrägung nach rechts: Die Fläche bleibt ${A_} cm², die schräge Seite wird aber immer länger.</span>`
      : `<span class="progress-note">Mit der schrägen Seite gerechnet käme <strong>${num(g * b, 2)} cm²</strong> heraus — ${num(g * b - A_, 2)} cm² zu viel. ` +
        `Die Fläche bleibt bei jeder Schrägung ${A_} cm², denn beim Umlegen geht nichts verloren.</span>`);
}

function initParallelogramm() {
  ["pg-g", "pg-h", "pg-scher"].forEach((id) => document.getElementById(id).addEventListener("input", renderParallelogramm));
  document.getElementById("pg-umlegen").addEventListener("change", renderParallelogramm);
  renderParallelogramm();
}

// ================= 2. Dreieck =================

function renderDreieck() {
  const g = clampInt(document.getElementById("dr-g").value, 2, 12);
  const h = clampInt(document.getElementById("dr-h").value, 1, 8);
  const sp = clampInt(document.getElementById("dr-spitze").value, -6, 14);
  const kopie = document.getElementById("dr-kopie").checked;
  const mount = document.getElementById("dr-mount");
  mount.innerHTML = "";

  const rand = 52;
  const linksRaus = Math.max(0, -sp);
  const rechtsRaus = Math.max(0, sp - g);
  const W = (g + linksRaus + rechtsRaus + g) * PX + 2 * rand;
  const H = h * PX + 2 * rand + 22;
  const svg = neueFlaeche(W, H);
  const x0 = rand + linksRaus * PX,
    yU = rand + h * PX,
    yO = rand;
  const A = { x: x0, y: yU },
    B = { x: x0 + g * PX, y: yU },
    C = { x: x0 + sp * PX, y: yO };

  // Punktspiegelung an der Mitte von BC ergibt A' — ABA'C ist ein Parallelogramm
  // mit derselben Grundseite und derselben Höhe.
  const As = { x: B.x + C.x - A.x, y: B.y + C.y - A.y };
  if (kopie) {
    svg.appendChild(polygon([B, As, C], "fig-kopie"));
  }
  svg.appendChild(polygon([A, B, C], "fig-flaeche"));

  // Grundseite, gegebenenfalls verlängert, und die Höhe als Lot von C
  const F = { x: C.x, y: yU };
  const ausserhalb = sp < 0 || sp > g;
  if (ausserhalb) {
    svg.appendChild(linie(sp < 0 ? F : B, sp < 0 ? A : F, "mass-hoehe-verlaengert"));
  }
  svg.appendChild(linie(A, B, "mass-grund"));
  svg.appendChild(linie(C, F, "mass-hoehe"));
  svg.appendChild(rechterWinkel(F, { x: sp < 0 ? 1 : -1, y: 0 }, { x: 0, y: -1 }));
  svg.appendChild(svgText((A.x + B.x) / 2, yU + 20, `g = ${g} cm`, { class: "name-grund" }));
  svg.appendChild(svgText(C.x + 26, (yU + yO) / 2 + 4, `h = ${h} cm`, { class: "name-hoehe" }));
  mount.appendChild(svg);

  const A_ = (g * h) / 2;
  document.getElementById("dr-flaeche").textContent = `A = ½ · g · h = ½ · ${g} · ${h} = ${num(A_, 2)} cm²`;
  document.getElementById("dr-text").innerHTML =
    (kopie
      ? `Die gedrehte Kopie (orange gestrichelt) ergänzt das Dreieck zu einem <strong>Parallelogramm</strong> mit derselben Grundseite ${g} cm und derselben Höhe ${h} cm.<br>` +
        `Parallelogramm: ${g} · ${h} = ${g * h} cm² &nbsp;⇒&nbsp; Dreieck: die Hälfte davon = <strong>${num(A_, 2)} cm²</strong><br>`
      : `Setz den Haken bei „Kopie zeigen“, um zu sehen, warum die Hälfte in der Formel steht.<br>`) +
    (ausserhalb
      ? `<span class="progress-note">⚠️ Die Spitze liegt <strong>außerhalb</strong> der Grundseite — das Lot trifft ihre <em>Verlängerung</em>. Die Höhe ist trotzdem der senkrechte Abstand ${h} cm, und die Formel gilt unverändert.</span>`
      : `<span class="progress-note">Verschieb die Spitze: Die Fläche bleibt ${num(A_, 2)} cm², solange Grundseite und Höhe gleich bleiben. Auf die Form kommt es nicht an, nur auf g und h.</span>`);
}

function initDreieck() {
  ["dr-g", "dr-h", "dr-spitze"].forEach((id) => document.getElementById(id).addEventListener("input", renderDreieck));
  document.getElementById("dr-kopie").addEventListener("change", renderDreieck);
  renderDreieck();
}

// ================= 3. Trapez =================

function renderTrapez() {
  const a = clampInt(document.getElementById("tz-a").value, 3, 14);
  const c = clampInt(document.getElementById("tz-c").value, 1, 12);
  const h = clampInt(document.getElementById("tz-h").value, 1, 8);
  const kopie = document.getElementById("tz-kopie").checked;
  const mount = document.getElementById("tz-mount");
  mount.innerHTML = "";

  const versatz = 1.6; // Versatz der oberen Seite, damit das Trapez schief aussieht
  const rand = 46;
  const W = (a + c + 2) * PX + 2 * rand;
  const H = h * PX + 2 * rand + 22;
  const svg = neueFlaeche(W, H);
  const x0 = rand,
    yU = rand + h * PX,
    yO = rand;
  const A = { x: x0, y: yU },
    B = { x: x0 + a * PX, y: yU },
    C = { x: x0 + (versatz + c) * PX, y: yO },
    D = { x: x0 + versatz * PX, y: yO };

  // 180°-Drehung um die Mitte von BC: A' = B + C − A und so weiter.
  const M = { x: (B.x + C.x) / 2, y: (B.y + C.y) / 2 };
  const dreh = (p) => ({ x: 2 * M.x - p.x, y: 2 * M.y - p.y });
  if (kopie) {
    svg.appendChild(polygon([dreh(A), dreh(B), dreh(C), dreh(D)], "fig-kopie"));
  }
  svg.appendChild(polygon([A, B, C, D], "fig-flaeche"));

  svg.appendChild(linie(A, B, "mass-grund"));
  svg.appendChild(linie(D, C, "mass-grund"));
  svg.appendChild(linie({ x: A.x + 8, y: yU }, { x: A.x + 8, y: yO }, "mass-hoehe"));
  svg.appendChild(rechterWinkel({ x: A.x + 8, y: yU }, { x: 1, y: 0 }, { x: 0, y: -1 }));
  svg.appendChild(svgText((A.x + B.x) / 2, yU + 20, `a = ${a} cm`, { class: "name-grund" }));
  svg.appendChild(svgText((D.x + C.x) / 2, yO - 8, `c = ${c} cm`, { class: "name-grund" }));
  svg.appendChild(svgText(A.x - 14, (yU + yO) / 2 + 4, `h = ${h} cm`, { class: "name-hoehe" }));
  mount.appendChild(svg);

  const A_ = ((a + c) * h) / 2;
  document.getElementById("tz-flaeche").textContent =
    `A = ½ · (a + c) · h = ½ · (${a} + ${c}) · ${h} = ½ · ${a + c} · ${h} = ${num(A_, 2)} cm²`;
  document.getElementById("tz-text").innerHTML =
    (kopie
      ? `Die um 180° gedrehte Kopie ergänzt das Trapez zu einem <strong>Parallelogramm</strong> mit der Grundseite <strong>a + c = ${a} + ${c} = ${a + c} cm</strong> und der Höhe ${h} cm.<br>` +
        `Parallelogramm: ${a + c} · ${h} = ${(a + c) * h} cm² &nbsp;⇒&nbsp; Trapez: die Hälfte = <strong>${num(A_, 2)} cm²</strong><br>`
      : `Setz den Haken bei „Kopie zeigen“, um die Herleitung zu sehen.<br>`) +
    `<span class="progress-note">Andere Lesart: Die <strong>Mittellinie</strong> ist (${a} + ${c}) : 2 = ${num((a + c) / 2, 2)} cm lang. ` +
    `Das Trapez hat denselben Flächeninhalt wie ein Rechteck aus Mittellinie mal Höhe: ${num((a + c) / 2, 2)} · ${h} = ${num(A_, 2)} cm². ` +
    (c === a
      ? `Hier ist a = c — das Trapez ist ein <strong>Parallelogramm</strong>, und die Formel wird zu ½ · 2a · h = a · h.`
      : `Wäre c = 0, entstünde ein <strong>Dreieck</strong>, und die Formel würde zu ½ · a · h.`) +
    `</span>`;
}

function initTrapez() {
  ["tz-a", "tz-c", "tz-h"].forEach((id) => document.getElementById(id).addEventListener("input", renderTrapez));
  document.getElementById("tz-kopie").addEventListener("change", renderTrapez);
  renderTrapez();
}

// ================= 4. Drachen und Raute =================

function renderDrachen() {
  const e = clampInt(document.getElementById("dc-e").value, 2, 14);
  const f = clampInt(document.getElementById("dc-f").value, 2, 10);
  // Der Anteil gibt an, wo die waagerechte Diagonale die senkrechte teilt.
  const anteil = clampInt(document.getElementById("dc-teil").value, 10, 50) / 100;
  document.getElementById("dc-teil-anzeige").textContent = Math.round(anteil * 100) + " % / " + Math.round((1 - anteil) * 100) + " %";
  const mount = document.getElementById("dc-mount");
  mount.innerHTML = "";

  const rand = 44;
  const W = e * PX + 2 * rand;
  const H = f * PX + 2 * rand + 20;
  const svg = neueFlaeche(W, H);
  const x0 = rand,
    y0 = rand;
  const oben = { x: x0 + (e * PX) / 2, y: y0 };
  const unten = { x: x0 + (e * PX) / 2, y: y0 + f * PX };
  const links = { x: x0, y: y0 + anteil * f * PX };
  const rechts = { x: x0 + e * PX, y: y0 + anteil * f * PX };

  // Das umschließende Rechteck aus den beiden Diagonalen — der Drachen füllt die Hälfte.
  svg.appendChild(
    polygon(
      [
        { x: x0, y: y0 },
        { x: x0 + e * PX, y: y0 },
        { x: x0 + e * PX, y: y0 + f * PX },
        { x: x0, y: y0 + f * PX },
      ],
      "fig-vergleich"
    )
  );
  svg.appendChild(polygon([oben, rechts, unten, links], "fig-flaeche"));
  svg.appendChild(linie(links, rechts, "mass-diagonale"));
  svg.appendChild(linie(oben, unten, "mass-diagonale"));
  svg.appendChild(rechterWinkel({ x: oben.x, y: links.y }, { x: 1, y: 0 }, { x: 0, y: -1 }));
  svg.appendChild(svgText((links.x + rechts.x) / 2, links.y - 8, `e = ${e} cm`, { class: "name-diagonale" }));
  svg.appendChild(svgText(oben.x + 30, (oben.y + unten.y) / 2, `f = ${f} cm`, { class: "name-diagonale" }));
  mount.appendChild(svg);

  const A_ = (e * f) / 2;
  const raute = Math.abs(anteil - 0.5) < 1e-9;
  document.getElementById("dc-flaeche").textContent = `A = ½ · e · f = ½ · ${e} · ${f} = ${num(A_, 2)} cm²`;
  document.getElementById("dc-text").innerHTML =
    `Das grün gestrichelte Rechteck aus den beiden Diagonalen hat den Flächeninhalt ${e} · ${f} = ${e * f} cm². ` +
    `Der Drachen füllt davon genau die <strong>Hälfte</strong>: <strong>${num(A_, 2)} cm²</strong><br>` +
    `<span class="progress-note">Warum die Hälfte? Jedes der vier kleinen Rechtecke wird von einer Drachenseite <em>diagonal</em> geteilt — überall bleibt genau die Hälfte übrig. ` +
    `Deshalb ändert die Teilung der Diagonalen die Fläche nicht: ` +
    (raute
      ? `Bei 50 % / 50 % ist der Drachen eine <strong>Raute</strong>, aber die Fläche ist dieselbe wie bei jeder anderen Teilung.`
      : `Schieb den Regler auf 50 % — dann wird daraus eine <strong>Raute</strong>, und die Fläche bleibt ${num(A_, 2)} cm².`) +
    `</span>`;
}

function initDrachen() {
  ["dc-e", "dc-f", "dc-teil"].forEach((id) => document.getElementById(id).addEventListener("input", renderDrachen));
  renderDrachen();
}

// ================= 5. Übersicht =================

const FIGUREN = [
  {
    key: "rechteck",
    name: "Rechteck",
    formel: "A = a · b",
    herleitung: "Der Ausgangspunkt: So viele Einheitsquadrate passen hinein — b Reihen zu je a Stück.",
    ecken: (X, Y) => [
      { x: X, y: Y + 4 * PX },
      { x: X + 7 * PX, y: Y + 4 * PX },
      { x: X + 7 * PX, y: Y },
      { x: X, y: Y },
    ],
  },
  {
    key: "parallelogramm",
    name: "Parallelogramm",
    formel: "A = g · h",
    herleitung: "<strong>Umlegen:</strong> Links ein Dreieck abschneiden, rechts wieder ansetzen — es entsteht ein flächengleiches Rechteck mit den Seiten g und h.",
    ecken: (X, Y) => [
      { x: X, y: Y + 4 * PX },
      { x: X + 7 * PX, y: Y + 4 * PX },
      { x: X + 9 * PX, y: Y },
      { x: X + 2 * PX, y: Y },
    ],
  },
  {
    key: "dreieck",
    name: "Dreieck",
    formel: "A = ½ · g · h",
    herleitung: "<strong>Verdoppeln:</strong> Eine gedrehte Kopie ergänzt das Dreieck zu einem Parallelogramm mit gleicher Grundseite und Höhe. Das Dreieck ist die Hälfte.",
    ecken: (X, Y) => [
      { x: X, y: Y + 4 * PX },
      { x: X + 8 * PX, y: Y + 4 * PX },
      { x: X + 3 * PX, y: Y },
    ],
  },
  {
    key: "trapez",
    name: "Trapez",
    formel: "A = ½ · (a + c) · h",
    herleitung: "<strong>Verdoppeln:</strong> Eine um 180° gedrehte Kopie ergibt ein Parallelogramm mit der Grundseite a + c. Das Trapez ist die Hälfte davon.",
    ecken: (X, Y) => [
      { x: X, y: Y + 4 * PX },
      { x: X + 9 * PX, y: Y + 4 * PX },
      { x: X + 6.5 * PX, y: Y },
      { x: X + 2 * PX, y: Y },
    ],
  },
  {
    key: "drachen",
    name: "Drachen / Raute",
    formel: "A = ½ · e · f",
    herleitung: "<strong>Einbetten:</strong> Der Drachen passt in ein Rechteck aus seinen beiden Diagonalen und füllt davon die Hälfte — jedes Teilrechteck wird diagonal halbiert.",
    ecken: (X, Y) => [
      { x: X + 4 * PX, y: Y },
      { x: X + 8 * PX, y: Y + 1.6 * PX },
      { x: X + 4 * PX, y: Y + 4 * PX },
      { x: X, y: Y + 1.6 * PX },
    ],
  },
];

let ueAktiv = 0;

function renderUebersicht() {
  const reihe = document.getElementById("ue-reihe");
  reihe.innerHTML = "";
  FIGUREN.forEach((f, i) => {
    const karte = el("div", {
      class: "formel-karte" + (i === ueAktiv ? " aktiv" : ""),
      html: `<span class="figur">${f.name}</span><span class="formel">${f.formel}</span>`,
    });
    karte.addEventListener("click", () => {
      ueAktiv = i;
      renderUebersicht();
    });
    reihe.appendChild(karte);
  });

  const f = FIGUREN[ueAktiv];
  const mount = document.getElementById("ue-mount");
  mount.innerHTML = "";
  const svg = neueFlaeche(340, 190);
  svg.appendChild(polygon(f.ecken(70, 42), "fig-flaeche"));
  mount.appendChild(svg);

  document.getElementById("ue-text").innerHTML =
    `<strong>${f.name}: ${f.formel}</strong><br>${f.herleitung}<br>` +
    `<span class="progress-note">Alle fünf Formeln gehen auf das Rechteck zurück. Neu ist jeweils nur der Weg dorthin — umlegen, verdoppeln oder einbetten.</span>`;
}

function initUebersicht() {
  renderUebersicht();
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
  // Parallelogramm oder Dreieck. Die schräge Seite wird als Ablenkung mitgeliefert —
  // wer sie statt der Höhe nimmt, bekommt einen gezielten Hinweis.
  const istDreieck = Math.random() < 0.5;
  const g = randInt(3, 14);
  // Beim Dreieck muss g · h gerade sein, damit die Hälfte ganzzahlig bleibt.
  const h = istDreieck ? (g % 2 === 0 ? randInt(2, 9) : randInt(1, 4) * 2) : randInt(2, 9);
  // Die schräge Seite ist immer echt länger als die Höhe — aber nie genau doppelt
  // so lang: Bei b = 2h wäre ½ · g · b zahlengleich mit g · h, und die beiden
  // typischen Fehler ließen sich nicht mehr unterscheiden.
  let b = h + randInt(1, 5);
  if (b === 2 * h) b += 1;
  const A = istDreieck ? (g * h) / 2 : g * h;
  return {
    promptHtml:
      `Ein <strong>${istDreieck ? "Dreieck" : "Parallelogramm"}</strong> hat die Grundseite <strong>g = ${g} cm</strong> und die zugehörige ` +
      `<strong>Höhe h = ${h} cm</strong>. Die <em>schräge Seite</em> ist ${b} cm lang. ` +
      `Wie groß ist der <strong>Flächeninhalt</strong> in cm²?`,
    correct: A,
    tolerance: 0.01,
    placeholder: "Flächeninhalt in cm²",
    hinweis: (raw, val) => {
      if (val === (istDreieck ? (g * b) / 2 : g * b))
        return `Du hast mit der <strong>schrägen Seite</strong> gerechnet. Die Höhe ist der <em>senkrechte</em> Abstand — hier h = ${h} cm, nicht ${b} cm.`;
      if (istDreieck && val === g * h)
        return `Das ist die Fläche des <strong>Parallelogramms</strong> mit denselben Maßen. Ein Dreieck ist genau die <strong>Hälfte</strong> davon.`;
      if (!istDreieck && val === (g * h) / 2)
        return `Du hast halbiert. Die Hälfte gehört zum <strong>Dreieck</strong> — beim Parallelogramm ist A = g · h ohne Halbierung.`;
      if (val === 2 * (g + h)) return "Das ist der Umfang eines Rechtecks mit diesen Maßen. Gefragt ist der Flächeninhalt.";
      return "";
    },
    musterloesungHtml: istDreieck
      ? `<span class="legende-h">A = ½ · g · h = ½ · ${g} cm · ${h} cm = ${A} cm²</span><br>` +
        `<span class="progress-note">Die schräge Seite von ${b} cm wird gar nicht gebraucht — sie ist nur zur Ablenkung angegeben. ` +
        `Mit ihr käme ½ · ${g} · ${b} = ${num((g * b) / 2, 2)} cm² heraus, also zu viel.</span>`
      : `<span class="legende-h">A = g · h = ${g} cm · ${h} cm = ${A} cm²</span><br>` +
        `<span class="progress-note">Die schräge Seite von ${b} cm wird nicht gebraucht. Mit ihr käme ${g} · ${b} = ${g * b} cm² heraus — ${g * b - A} cm² zu viel.</span>`,
  };
}

function generateAufgabe2() {
  // Trapez. (a + c) · h wird gerade gehalten, damit die Fläche ganzzahlig bleibt.
  const a = randInt(6, 16);
  let c = randInt(2, a - 1);
  let h = randInt(2, 9);
  if (((a + c) * h) % 2 !== 0) h += 1;
  const A = ((a + c) * h) / 2;
  return {
    promptHtml:
      `Ein <strong>Trapez</strong> hat die parallelen Seiten <strong>a = ${a} cm</strong> und <strong>c = ${c} cm</strong> ` +
      `sowie die Höhe <strong>h = ${h} cm</strong>. Wie groß ist der <strong>Flächeninhalt</strong> in cm²?`,
    correct: A,
    tolerance: 0.01,
    placeholder: "Flächeninhalt in cm²",
    hinweis: (raw, val) => {
      if (val === (a + c) * h) return `Du hast die Halbierung vergessen. ${(a + c)} · ${h} = ${(a + c) * h} cm² ist die Fläche des <strong>Parallelogramms</strong> aus Trapez und gedrehter Kopie — das Trapez ist die Hälfte.`;
      if (val === a * h) return `Du hast nur mit a gerechnet. In die Formel gehen <strong>beide</strong> parallelen Seiten ein: ½ · (a + c) · h.`;
      if (val === (a * h) / 2) return `Du hast nur mit a gerechnet — das wäre ein Dreieck. Beim Trapez zählen <strong>beide</strong> parallelen Seiten: ½ · (a + c) · h.`;
      if (val === a + c + h) return "Du hast die drei Angaben addiert. Gesucht ist eine Fläche, also ein Produkt.";
      return "";
    },
    musterloesungHtml:
      `A = ½ · (a + c) · h<br>` +
      `&nbsp;&nbsp;= ½ · (${a} cm + ${c} cm) · ${h} cm<br>` +
      `&nbsp;&nbsp;= ½ · ${a + c} cm · ${h} cm = <strong>${A} cm²</strong><br>` +
      `<span class="progress-note">Probe über die Mittellinie: (${a} + ${c}) : 2 = ${num((a + c) / 2, 2)} cm, mal ${h} cm = ${A} cm² ✓ &nbsp;· ` +
      `Die gedrehte Kopie ergäbe ein Parallelogramm mit ${a + c} cm Grundseite und ${(a + c) * h} cm² Fläche — davon die Hälfte.</span>`,
  };
}

function generateAufgabe3() {
  // Rückwärts: Aus Fläche und einer Länge die andere bestimmen.
  const figur = pick(["parallelogramm", "dreieck", "trapez"]);
  if (figur === "trapez") {
    const h = randInt(2, 9);
    // Ist h ungerade, muss a + c gerade sein — dann geht die Halbierung auf.
    const summe = h % 2 === 0 ? randInt(6, 22) : randInt(3, 11) * 2;
    const a = randInt(Math.ceil(summe / 2) + 1, summe - 1);
    const c = summe - a;
    const A = (summe * h) / 2;
    return {
      promptHtml:
        `Ein <strong>Trapez</strong> hat den Flächeninhalt <strong>A = ${A} cm²</strong>, die Höhe <strong>h = ${h} cm</strong> ` +
        `und die parallele Seite <strong>a = ${a} cm</strong>. Wie lang ist die andere parallele Seite <strong>c</strong> in cm?`,
      correct: c,
      tolerance: 0.01,
      placeholder: "c in cm",
      hinweis: (raw, val) => {
        if (val === summe) return `Das ist <strong>a + c</strong>. Davon muss a = ${a} cm noch abgezogen werden.`;
        if (val === (2 * A) / h - 2 * a) return "Du hast a zweimal abgezogen. Aus ½ · (a + c) · h = A folgt a + c = 2A : h, davon einmal a abziehen.";
        if (val === A / h) return "Du hast die Halbierung vergessen. Aus A = ½ · (a + c) · h folgt zuerst a + c = <strong>2A</strong> : h.";
        return "";
      },
      musterloesungHtml:
        `Aus A = ½ · (a + c) · h folgt rückwärts:<br>` +
        `① a + c = 2 · A : h = 2 · ${A} : ${h} = ${2 * A} : ${h} = <strong>${summe} cm</strong><br>` +
        `② c = ${summe} cm − a = ${summe} − ${a} = <strong>${c} cm</strong><br>` +
        `<span class="progress-note">Probe: ½ · (${a} + ${c}) · ${h} = ½ · ${summe} · ${h} = ${A} cm² ✓</span>`,
    };
  }
  const istDreieck = figur === "dreieck";
  const g = randInt(3, 14);
  // Beim Dreieck muss g · h gerade sein, damit die Fläche ganzzahlig bleibt.
  const h = istDreieck && g % 2 === 1 ? randInt(1, 6) * 2 : randInt(2, 12);
  const A = istDreieck ? (g * h) / 2 : g * h;
  return {
    promptHtml:
      `Ein <strong>${istDreieck ? "Dreieck" : "Parallelogramm"}</strong> hat den Flächeninhalt <strong>A = ${A} cm²</strong> ` +
      `und die Grundseite <strong>g = ${g} cm</strong>. Wie groß ist die zugehörige <strong>Höhe h</strong> in cm?`,
    correct: h,
    tolerance: 0.01,
    placeholder: "h in cm",
    hinweis: (raw, val) => {
      if (istDreieck && val === A / g) return `Du hast die Halbierung vergessen. Aus A = ½ · g · h folgt h = <strong>2A</strong> : g, nicht A : g.`;
      if (!istDreieck && val === (2 * A) / g) return `Hier gibt es keine Halbierung: Beim Parallelogramm gilt A = g · h, also h = A : g.`;
      if (val === A - g) return "Fläche und Länge lassen sich nicht subtrahieren — cm² minus cm ergibt nichts. Die Umkehrung der Multiplikation ist die <strong>Division</strong>.";
      if (val === A * g) return "Du hast multipliziert. Gesucht ist die Umkehrung: geteilt wird.";
      return "";
    },
    musterloesungHtml: istDreieck
      ? `Aus A = ½ · g · h folgt rückwärts:<br>` +
        `&nbsp;&nbsp;g · h = 2 · A = 2 · ${A} = ${2 * A}<br>` +
        `&nbsp;&nbsp;h = ${2 * A} : ${g} = <strong>${h} cm</strong><br>` +
        `<span class="progress-note">Probe: ½ · ${g} · ${h} = ${A} cm² ✓ &nbsp;· Der häufigste Fehler ist, die 2 zu vergessen — dann käme ${num(A / g, 2)} cm heraus, nur die Hälfte.</span>`
      : `Aus A = g · h folgt rückwärts:<br>` +
        `&nbsp;&nbsp;h = A : g = ${A} : ${g} = <strong>${h} cm</strong><br>` +
        `<span class="progress-note">Probe: ${g} · ${h} = ${A} cm² ✓ &nbsp;· Hier wird <em>nicht</em> mit 2 multipliziert — das gehört zum Dreieck und zum Trapez.</span>`,
  };
}

function generateAufgabe4() {
  // Zusammengesetzt: ein Giebelhaus aus Rechteck und Dreieck, danach Kosten.
  const b = randInt(4, 12); // Breite
  const hR = randInt(2, 8); // Höhe des Rechtecks
  // Die Giebelhöhe wird so gewählt, dass b · hD gerade ist und die Fläche ganz bleibt.
  const hD = b % 2 === 0 ? randInt(2, 7) : randInt(1, 3) * 2;
  const preis = randInt(2, 19);
  const aR = b * hR;
  const aD = (b * hD) / 2;
  const A = aR + aD;
  const kosten = A * preis;
  return {
    promptHtml:
      `Eine Hauswand hat die Form eines Rechtecks mit einem Giebeldreieck darüber. ` +
      `Das Rechteck ist <strong>${b} m</strong> breit und <strong>${hR} m</strong> hoch, das Giebeldreieck hat dieselbe Breite und die Höhe <strong>${hD} m</strong>. ` +
      `Die Wand soll für <strong>${preis} € je Quadratmeter</strong> gestrichen werden. Wie hoch sind die Kosten in Euro?`,
    correct: kosten,
    tolerance: 0.01,
    placeholder: "Kosten in €",
    hinweis: (raw, val) => {
      if (val === (aR + b * hD) * preis)
        return `Beim Giebel fehlt die <strong>Halbierung</strong>: Ein Dreieck hat ½ · g · h, nicht g · h. ` +
          `Gerechnet hast du damit die ganze Wand als <em>ein</em> Rechteck der vollen Höhe.`;
      if (val === aR * preis) return `Du hast nur das <strong>Rechteck</strong> gerechnet. Das Giebeldreieck von ${num(aD, 2)} m² kommt noch dazu.`;
      if (val === aD * preis) return `Du hast nur das <strong>Giebeldreieck</strong> gerechnet. Das Rechteck von ${aR} m² fehlt noch.`;
      if (val === A) return `Das ist die Fläche in m² — richtig gerechnet, aber der Preis von ${preis} € je m² fehlt noch.`;
      return "";
    },
    musterloesungHtml:
      `① Rechteck: ${b} m · ${hR} m = <strong>${aR} m²</strong><br>` +
      `② Giebeldreieck: ½ · ${b} m · ${hD} m = <strong>${num(aD, 2)} m²</strong><br>` +
      `③ zusammen: ${aR} + ${num(aD, 2)} = <strong>${num(A, 2)} m²</strong><br>` +
      `④ Kosten: ${num(A, 2)} · ${preis} € = <strong>${num(kosten)} €</strong><br>` +
      `<span class="progress-note">Zerlegen in bekannte Figuren ist hier der ganze Trick. Zur Kontrolle: Ein volles Rechteck über die ganze Höhe ` +
      `(${b} · ${hR + hD} = ${b * (hR + hD)} m²) wäre zu groß — der Giebel füllt ja nur die Hälfte des oberen Teils.</span>`,
  };
}

function initExercises() {
  mountUebungsaufgaben(document.getElementById("exercises-mount"), [
    { schwierigkeit: "einfach", titel: "Aufgabe 1 — Parallelogramm oder Dreieck", generate: generateAufgabe1 },
    { schwierigkeit: "mittel", titel: "Aufgabe 2 — Trapez", generate: generateAufgabe2 },
    { schwierigkeit: "schwierig", titel: "Aufgabe 3 — Rückwärtsrechnen", generate: generateAufgabe3 },
    { schwierigkeit: "komplex", titel: "Aufgabe 4 — Giebelwand streichen", generate: generateAufgabe4 },
  ]);
}

// ================= Quizze =================

function initQuizzes() {
  mountQuiz(document.getElementById("quiz-parallelogramm"), {
    q: "Ein Parallelogramm hat die Grundseite 6 cm, die Höhe 4 cm und die schräge Seite 5 cm. Wie groß ist die Fläche?",
    options: ["30 cm²", "24 cm²", "20 cm²", "12 cm²"],
    correct: 1,
    explain: "A = g · h = 6 · 4 = 24 cm². Die schräge Seite von 5 cm gehört nicht in die Formel — mit ihr käme 30 cm² heraus, also zu viel.",
  });
  mountQuiz(document.getElementById("quiz-dreieck"), {
    q: "Zwei Dreiecke haben dieselbe Grundseite und dieselbe Höhe, sehen aber ganz verschieden aus. Was gilt für ihre Flächen?",
    options: [
      "das spitzere ist kleiner",
      "sie sind gleich groß",
      "das mit der längeren schrägen Seite ist größer",
      "das lässt sich ohne die Winkel nicht sagen",
    ],
    correct: 1,
    explain: "In A = ½ · g · h kommen nur g und h vor. Verschiebt man die Spitze parallel zur Grundseite, ändert sich die Form, aber weder g noch h — und damit auch nicht die Fläche.",
  });
  mountQuiz(document.getElementById("quiz-trapez"), {
    q: "Warum steht in der Trapezformel (a + c) und nicht nur a?",
    options: [
      "weil a und c zusammen den Umfang ergeben",
      "weil die gedrehte Kopie ein Parallelogramm mit der Grundseite a + c ergibt",
      "weil beide Seiten gleich lang sein müssen",
      "das ist nur eine Rechenvereinfachung",
    ],
    correct: 1,
    explain: "Trapez und gedrehte Kopie bilden zusammen ein Parallelogramm mit der Grundseite a + c und derselben Höhe. Das Trapez ist die Hälfte davon: ½ · (a + c) · h.",
  });
  mountQuiz(document.getElementById("quiz-drachen"), {
    q: "Ein Drachen hat die Diagonalen 10 cm und 6 cm. Wie groß ist seine Fläche?",
    options: ["60 cm²", "30 cm²", "16 cm²", "32 cm²"],
    correct: 1,
    explain: "A = ½ · e · f = ½ · 10 · 6 = 30 cm². Die 60 cm² wären das umschließende Rechteck — der Drachen füllt davon genau die Hälfte.",
  });
  mountQuiz(document.getElementById("quiz-uebersicht"), {
    q: "Setzt man in die Trapezformel c = 0 ein, was ergibt sich?",
    options: [
      "nichts Sinnvolles",
      "die Formel für das Dreieck, denn ½ · (a + 0) · h = ½ · a · h",
      "die Formel für das Rechteck",
      "die Formel für den Drachen",
    ],
    correct: 1,
    explain: "Ein Trapez, dessen obere Seite zu einem Punkt zusammenschrumpft, ist ein Dreieck. Die Formeln hängen zusammen: Das Dreieck ist der Grenzfall c = 0 des Trapezes.",
  });
}

// ================= Start =================

initParallelogramm();
initDreieck();
initTrapez();
initDrachen();
initUebersicht();
initExercises();
initQuizzes();
