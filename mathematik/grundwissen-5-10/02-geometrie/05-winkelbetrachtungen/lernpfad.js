// Selbstlernpfad "Winkelbetrachtungen" (Grundwissen Klasse 5-10).
// Rein clientseitiges Vanilla-JS, ohne Build-Schritt oder externe Bibliotheken.
//
// Alle Winkel dieser Seite werden in BILDSCHIRMGRAD gerechnet: 0° zeigt nach rechts,
// wachsende Werte drehen im Uhrzeigersinn — das ist die natürliche Richtung, wenn die
// y-Achse wie im SVG nach unten zeigt. Dadurch bleiben Sektor- und Bogenpfade einfach
// (sweep-flag 1), und die Winkelfelder an einem Geradenkreuz lassen sich der Reihe nach
// als Intervalle zwischen aufeinanderfolgenden Strahlen beschreiben.

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
  const s = String(raw).trim().replace(/\s/g, "").replace(/−/g, "-").replace(/°/g, "").replace(/\./g, "").replace(",", ".");
  return parseFloat(s);
}
function neueFlaeche(w, h) {
  return svgEl("svg", { viewBox: `0 0 ${w} ${h}`, width: w, height: h, class: "geo-svg", preserveAspectRatio: "xMidYMid meet" });
}

// Punkt im Bildschirmwinkel: 0° nach rechts, wachsende Werte im Uhrzeigersinn.
function pol(cx, cy, r, grad) {
  const b = (grad * Math.PI) / 180;
  return { x: cx + r * Math.cos(b), y: cy + r * Math.sin(b) };
}

// Kreissektor von grad1 nach grad2 (im Uhrzeigersinn, also grad2 > grad1).
function sektor(cx, cy, r, grad1, grad2) {
  const a = pol(cx, cy, r, grad1);
  const b = pol(cx, cy, r, grad2);
  const gross = grad2 - grad1 > 180 ? 1 : 0;
  return `M ${cx.toFixed(2)} ${cy.toFixed(2)} L ${a.x.toFixed(2)} ${a.y.toFixed(2)} ` +
    `A ${r} ${r} 0 ${gross} 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)} Z`;
}

// Bogen ohne Mittelpunkt — für den rechten Winkel und für Markierungen.
function bogen(cx, cy, r, grad1, grad2) {
  const a = pol(cx, cy, r, grad1);
  const b = pol(cx, cy, r, grad2);
  const gross = grad2 - grad1 > 180 ? 1 : 0;
  return `M ${a.x.toFixed(2)} ${a.y.toFixed(2)} A ${r} ${r} 0 ${gross} 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)}`;
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

// ================= 1. Geradenkreuz =================

function renderGeradenkreuz() {
  const alpha = clampInt(document.getElementById("gk-alpha").value, 10, 170);
  const art = document.getElementById("gk-art").value;
  document.getElementById("gk-alpha-anzeige").textContent = alpha + "°";
  const mount = document.getElementById("gk-mount");
  mount.innerHTML = "";

  const W = 460,
    H = 300;
  const cx = W / 2,
    cy = H / 2;
  const lang = 175;
  const svg = neueFlaeche(W, H);

  // Vier Winkelfelder zwischen aufeinanderfolgenden Strahlen: 0°, α, 180°, 180°+α.
  // Die Namen folgen der Reihenfolge um den Schnittpunkt herum.
  const felder = [
    { name: "α", von: 0, bis: alpha, wert: alpha },
    { name: "β", von: alpha, bis: 180, wert: 180 - alpha },
    { name: "α'", von: 180, bis: 180 + alpha, wert: alpha },
    { name: "β'", von: 180 + alpha, bis: 360, wert: 180 - alpha },
  ];
  // Welche Felder werden hervorgehoben? Erste Gruppe blau, zweite grün.
  const hervor =
    art === "scheitel" ? [["α", "α'"], []] : art === "neben" ? [["α"], ["β"]] : [[], []];

  const r = 52;
  felder.forEach((f) => {
    const klasse = hervor[0].includes(f.name) ? "wf-a" : hervor[1].includes(f.name) ? "wf-b" : "wf";
    svg.appendChild(svgEl("path", { d: sektor(cx, cy, r, f.von, f.bis), class: klasse }));
  });

  svg.appendChild(svgEl("line", { x1: cx - lang, y1: cy, x2: cx + lang, y2: cy, class: "gerade-g" }));
  const p1 = pol(cx, cy, lang, alpha),
    p2 = pol(cx, cy, lang, 180 + alpha);
  svg.appendChild(svgEl("line", { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, class: "gerade-schneidend" }));
  svg.appendChild(svgEl("circle", { cx, cy, r: 4.5, class: "kreis-punkt" }));
  svg.appendChild(svgText(cx - 15, cy + 18, "S", { class: "kreis-beschriftung", fill: "#b3261e" }));

  felder.forEach((f) => {
    const m = pol(cx, cy, r + 22, (f.von + f.bis) / 2);
    const klasse = hervor[0].includes(f.name) ? "wf-nummer hervor" : hervor[1].includes(f.name) ? "wf-nummer hervor2" : "wf-nummer";
    svg.appendChild(svgText(m.x, m.y + 5, `${f.name} = ${f.wert}°`, { class: klasse }));
  });
  mount.appendChild(svg);

  const rechter = alpha === 90;
  document.getElementById("gk-text").innerHTML =
    (art === "scheitel"
      ? `<strong>Scheitelwinkel</strong> liegen sich am Schnittpunkt gegenüber: α und α'.<br>` +
        `<span class="paar-gleich">α' = α = ${alpha}°</span> — Scheitelwinkel sind immer gleich groß.<br>` +
        `<span class="progress-note">Warum? Beide sind Nebenwinkel desselben Winkels β: α = 180° − β und α' = 180° − β.</span>`
      : art === "neben"
        ? `<strong>Nebenwinkel</strong> liegen nebeneinander und bilden zusammen eine Gerade: α und β.<br>` +
          `<span class="paar-ergaenzt">β = 180° − α = 180° − ${alpha}° = ${180 - alpha}°</span><br>` +
          `<span class="progress-note">Warum? Die beiden Schenkel, die nicht gemeinsam sind, bilden zusammen einen gestreckten Winkel — und der misst 180°.</span>`
        : `Vier Winkel, aber nur <strong>zwei verschiedene Größen</strong>:<br>` +
          `<span class="paar-gleich">α = α' = ${alpha}°</span> und <span class="paar-gleich">β = β' = ${180 - alpha}°</span><br>` +
          `<span class="progress-note">Je zwei benachbarte ergänzen sich zu 180°: ${alpha}° + ${180 - alpha}° = 180° ✓</span>`) +
    (rechter
      ? `<br><span class="progress-note">⚠️ Hier ist α = 90° — Scheitel- und Nebenwinkel sind zufällig beide 90°. Zum Üben ist das der ungünstigste Fall.</span>`
      : "");
}

function initGeradenkreuz() {
  document.getElementById("gk-alpha").addEventListener("input", renderGeradenkreuz);
  document.getElementById("gk-art").addEventListener("change", renderGeradenkreuz);
  renderGeradenkreuz();
}

// ================= 2. Geschnittene Parallelen =================

// Die acht Winkelfelder. An jedem Schnittpunkt liegen sie in derselben Reihenfolge,
// weil die Schnittgerade beide Parallelen unter demselben Winkel trifft — genau das
// ist der Grund, warum Stufenwinkel gleich groß sind.
function parallelFelder(alpha) {
  const muster = [
    { von: 180, bis: 180 + alpha, wert: alpha },
    { von: 180 + alpha, bis: 360, wert: 180 - alpha },
    { von: alpha, bis: 180, wert: 180 - alpha },
    { von: 0, bis: alpha, wert: alpha },
  ];
  return [
    ...muster.map((m, i) => Object.assign({ nr: i + 1, oben: true }, m)),
    ...muster.map((m, i) => Object.assign({ nr: i + 5, oben: false }, m)),
  ];
}

const PARALLEL_BEZIEHUNGEN = {
  stufen: {
    paar: [4, 8],
    titel: "Stufenwinkel (F-Figur)",
    regel: "gleich",
    erklaerung:
      "Stufenwinkel liegen an beiden Schnittpunkten in <strong>derselben Lage</strong>. Man erkennt sie an der Form eines <strong>F</strong> (auch gespiegelt oder gedreht).",
    grund:
      "Weil g und h parallel sind, trifft die Schnittgerade beide unter genau demselben Winkel. Die Situation an P₂ ist eine reine Verschiebung der Situation an P₁.",
  },
  wechsel: {
    paar: [4, 5],
    titel: "Wechselwinkel (Z-Figur)",
    regel: "gleich",
    erklaerung:
      "Wechselwinkel liegen <strong>zwischen</strong> den Parallelen und auf <strong>verschiedenen</strong> Seiten der Schnittgeraden. Man erkennt sie an der Form eines <strong>Z</strong>.",
    grund:
      "Winkel 5 ist der Stufenwinkel zu Winkel 1, und Winkel 1 ist der Scheitelwinkel zu Winkel 4. Zwei bekannte Regeln nacheinander ergeben die neue.",
  },
  nachbar: {
    paar: [4, 6],
    titel: "Nachbarwinkel (U-Figur)",
    regel: "ergaenzt",
    erklaerung:
      "Nachbarwinkel liegen <strong>zwischen</strong> den Parallelen und auf <strong>derselben</strong> Seite der Schnittgeraden. Man erkennt sie an der Form eines <strong>U</strong>.",
    grund:
      "Winkel 6 ist der Nebenwinkel des Stufenwinkels von Winkel 4. Deshalb ergänzen sie sich zu 180° statt gleich groß zu sein.",
  },
  scheitel: {
    paar: [1, 4],
    titel: "Scheitelwinkel",
    regel: "gleich",
    erklaerung: "Scheitelwinkel liegen sich an <strong>einem</strong> Schnittpunkt gegenüber — dafür braucht man die Parallelität gar nicht.",
    grund: "Beide sind Nebenwinkel desselben dritten Winkels.",
  },
  neben: {
    paar: [3, 4],
    titel: "Nebenwinkel",
    regel: "ergaenzt",
    erklaerung: "Nebenwinkel liegen an <strong>einem</strong> Schnittpunkt nebeneinander und bilden zusammen eine Gerade.",
    grund: "Ihre nicht gemeinsamen Schenkel bilden einen gestreckten Winkel: 180°.",
  },
};

function renderParallelen() {
  const alpha = clampInt(document.getElementById("pa-alpha").value, 35, 145);
  const art = document.getElementById("pa-art").value;
  document.getElementById("pa-alpha-anzeige").textContent = alpha + "°";
  const mount = document.getElementById("pa-mount");
  mount.innerHTML = "";

  const W = 620,
    H = 300;
  const yG = 72,
    yH = 212;
  const dy = yH - yG;
  // Waagerechter Versatz der Schnittgeraden zwischen den beiden Parallelen
  const dx = dy / Math.tan((alpha * Math.PI) / 180);
  const p1x = W / 2 - dx / 2,
    p2x = W / 2 + dx / 2;
  const svg = neueFlaeche(W, H);

  const felder = parallelFelder(alpha);
  const beziehung = PARALLEL_BEZIEHUNGEN[art];
  const paar = beziehung ? beziehung.paar : [];

  const r = 30;
  felder.forEach((f) => {
    const cx = f.oben ? p1x : p2x,
      cy = f.oben ? yG : yH;
    const klasse = paar[0] === f.nr ? "wf-a" : paar[1] === f.nr ? "wf-b" : "wf";
    svg.appendChild(svgEl("path", { d: sektor(cx, cy, r, f.von, f.bis), class: klasse }));
  });

  svg.appendChild(svgEl("line", { x1: 24, y1: yG, x2: W - 24, y2: yG, class: "gerade-parallel" }));
  svg.appendChild(svgEl("line", { x1: 24, y1: yH, x2: W - 24, y2: yH, class: "gerade-parallel" }));
  svg.appendChild(svgText(W - 12, yG + 5, "g", { class: "kreis-beschriftung", fill: "#1d4ed8" }));
  svg.appendChild(svgText(W - 12, yH + 5, "h", { class: "kreis-beschriftung", fill: "#1d4ed8" }));
  // Parallelitätshaken an beiden Geraden
  [yG, yH].forEach((y) => {
    svg.appendChild(svgEl("path", { d: `M 52 ${y - 7} l 9 7 l -9 7`, fill: "none", stroke: "#1d4ed8", "stroke-width": 1.8 }));
  });

  const ueber = 78;
  const t1 = pol(p1x, yG, ueber, 180 + alpha),
    t2 = pol(p2x, yH, ueber, alpha);
  svg.appendChild(svgEl("line", { x1: t1.x, y1: t1.y, x2: t2.x, y2: t2.y, class: "gerade-schneidend" }));
  svg.appendChild(svgText(t2.x + 12, t2.y + 4, "t", { class: "kreis-beschriftung", fill: "#b3650a" }));

  [[p1x, yG, "P₁"], [p2x, yH, "P₂"]].forEach(([x, y, name]) => {
    svg.appendChild(svgEl("circle", { cx: x, cy: y, r: 4.2, class: "kreis-punkt" }));
    svg.appendChild(svgText(x - 16, y - 10, name, { class: "kreis-beschriftung", fill: "#b3261e" }));
  });

  felder.forEach((f) => {
    const cx = f.oben ? p1x : p2x,
      cy = f.oben ? yG : yH;
    const m = pol(cx, cy, r + 17, (f.von + f.bis) / 2);
    const klasse = paar[0] === f.nr ? "wf-nummer hervor" : paar[1] === f.nr ? "wf-nummer hervor2" : "wf-nummer";
    svg.appendChild(svgText(m.x, m.y + 4, String(f.nr), { class: klasse }));
  });
  mount.appendChild(svg);

  const wert = (nr) => felder.find((f) => f.nr === nr).wert;
  const liste = el("ul", { class: "beziehung-liste" });
  for (const key of ["stufen", "wechsel", "nachbar", "scheitel", "neben"]) {
    const b = PARALLEL_BEZIEHUNGEN[key];
    const [x, y] = b.paar;
    liste.appendChild(
      el("li", {
        class: key === art ? "aktiv" : "",
        html:
          `<strong>${b.titel}</strong> — Winkel ${x} und ${y}: ` +
          (b.regel === "gleich"
            ? `<span class="paar-gleich">${wert(x)}° = ${wert(y)}°</span>`
            : `<span class="paar-ergaenzt">${wert(x)}° + ${wert(y)}° = 180°</span>`),
      })
    );
  }
  const box = document.getElementById("pa-text");
  box.innerHTML =
    beziehung
      ? `<strong>${beziehung.titel}</strong> — Winkel ${paar[0]} und ${paar[1]}<br>${beziehung.erklaerung}<br>` +
        (beziehung.regel === "gleich"
          ? `<span class="paar-gleich">Winkel ${paar[0]} = Winkel ${paar[1]} = ${wert(paar[0])}°</span>`
          : `<span class="paar-ergaenzt">Winkel ${paar[0]} + Winkel ${paar[1]} = ${wert(paar[0])}° + ${wert(paar[1])}° = 180°</span>`) +
        `<br><span class="progress-note"><strong>Warum:</strong> ${beziehung.grund}</span>`
      : `Acht Winkel, aber nur <strong>zwei verschiedene Größen</strong>: <span class="paar-gleich">${alpha}°</span> und <span class="paar-gleich">${180 - alpha}°</span>.<br>` +
        `<span class="progress-note">Die Winkel 1, 4, 5 und 8 messen ${alpha}°, die Winkel 2, 3, 6 und 7 messen ${180 - alpha}°. Je zwei benachbarte ergänzen sich zu 180°.</span>`;
  box.appendChild(liste);
}

function initParallelen() {
  document.getElementById("pa-alpha").addEventListener("input", renderParallelen);
  document.getElementById("pa-art").addEventListener("change", renderParallelen);
  renderParallelen();
}

// ================= Dreieck-Geometrie =================

// Dreieck aus zwei Winkeln: A und B liegen waagerecht, C ergibt sich über den
// Sinussatz. Anschließend wird die Figur so skaliert und verschoben, dass sie die
// Zeichenfläche ausfüllt, ohne den Winkeln etwas anzutun.
function dreieckAusWinkeln(alpha, beta, W, H, rand) {
  const gamma = 180 - alpha - beta;
  const rad = (g) => (g * Math.PI) / 180;
  const c = 300; // vorläufige Länge von AB
  const b = (c * Math.sin(rad(beta))) / Math.sin(rad(gamma)); // Länge AC
  let A = { x: 0, y: 0 };
  let B = { x: c, y: 0 };
  let C = { x: b * Math.cos(rad(alpha)), y: -b * Math.sin(rad(alpha)) };

  const xs = [A.x, B.x, C.x],
    ys = [A.y, B.y, C.y];
  const minX = Math.min(...xs),
    maxX = Math.max(...xs);
  const minY = Math.min(...ys),
    maxY = Math.max(...ys);
  const s = Math.min((W - 2 * rand) / (maxX - minX), (H - 2 * rand) / (maxY - minY));
  const ox = rand + (W - 2 * rand - (maxX - minX) * s) / 2 - minX * s;
  const oy = rand + (H - 2 * rand - (maxY - minY) * s) / 2 - minY * s;
  const abb = (p) => ({ x: ox + p.x * s, y: oy + p.y * s });
  return { A: abb(A), B: abb(B), C: abb(C), gamma, skala: s };
}

// Bildschirmwinkel des Strahls von p nach q
function richtung(p, q) {
  return ((Math.atan2(q.y - p.y, q.x - p.x) * 180) / Math.PI + 360) % 360;
}

// Winkelfeld an der Ecke p zwischen den Strahlen nach q und nach r.
// Es wird stets das INNERE (kleinere) Feld gezeichnet.
function eckenWinkel(svg, p, q, r, radius, klasse) {
  let a = richtung(p, q),
    b = richtung(p, r);
  let von = a,
    bis = b;
  if (((bis - von + 360) % 360) > 180) {
    von = b;
    bis = a;
  }
  bis = von + ((bis - von + 360) % 360);
  svg.appendChild(svgEl("path", { d: sektor(p.x, p.y, radius, von, bis), class: klasse }));
  return pol(p.x, p.y, radius + 20, (von + bis) / 2);
}

// ================= 3. Winkelsumme im Dreieck =================

function renderDreieck() {
  let alpha = clampInt(document.getElementById("dr-alpha").value, 15, 120);
  let beta = clampInt(document.getElementById("dr-beta").value, 15, 120);
  // Zwei Winkel eines Dreiecks können zusammen nicht 180° erreichen.
  if (alpha + beta > 160) {
    beta = 160 - alpha;
    document.getElementById("dr-beta").value = String(beta);
  }
  document.getElementById("dr-alpha-anzeige").textContent = alpha + "°";
  document.getElementById("dr-beta-anzeige").textContent = beta + "°";
  const beweis = document.getElementById("dr-beweis").checked;
  const mount = document.getElementById("dr-mount");
  mount.innerHTML = "";

  const W = 520,
    H = 330;
  const { A, B, C, gamma } = dreieckAusWinkeln(alpha, beta, W, H, beweis ? 74 : 56);
  const svg = neueFlaeche(W, H);

  if (beweis) {
    // Parallele zu AB durch C: Die beiden Wechselwinkel dort sind α und β, und
    // zusammen mit γ liegen sie an einer Geraden — also 180°.
    const lang = 168;
    const dir = richtung(A, B);
    const q1 = pol(C.x, C.y, lang, dir),
      q2 = pol(C.x, C.y, lang, dir + 180);
    svg.appendChild(svgEl("line", { x1: q1.x, y1: q1.y, x2: q2.x, y2: q2.y, class: "gerade-hilfs" }));
    const m1 = eckenWinkel(svg, C, q2, A, 40, "winkel-alpha");
    const m2 = eckenWinkel(svg, C, q1, B, 40, "winkel-beta");
    svg.appendChild(svgText(m1.x, m1.y + 4, alpha + "°", { class: "name-alpha" }));
    svg.appendChild(svgText(m2.x, m2.y + 4, beta + "°", { class: "name-beta" }));
  }

  svg.appendChild(
    svgEl("path", { d: `M ${A.x} ${A.y} L ${B.x} ${B.y} L ${C.x} ${C.y} Z`, class: "dreieck-flaeche" })
  );
  const mA = eckenWinkel(svg, A, B, C, 34, "winkel-alpha");
  const mB = eckenWinkel(svg, B, C, A, 34, "winkel-beta");
  const mC = eckenWinkel(svg, C, A, B, 34, "winkel-gamma");
  svg.appendChild(svgText(mA.x, mA.y + 4, "α = " + alpha + "°", { class: "name-alpha" }));
  svg.appendChild(svgText(mB.x, mB.y + 4, "β = " + beta + "°", { class: "name-beta" }));
  svg.appendChild(svgText(mC.x, mC.y + 4, "γ = " + gamma + "°", { class: "name-gamma" }));
  [[A, "A", -16, 16], [B, "B", 16, 16], [C, "C", 0, -14]].forEach(([p, name, dx, dy]) => {
    svg.appendChild(svgEl("circle", { cx: p.x, cy: p.y, r: 4.2, class: "kreis-punkt" }));
    svg.appendChild(svgText(p.x + dx, p.y + dy, name, { class: "kreis-beschriftung", fill: "#b3261e" }));
  });
  mount.appendChild(svg);

  document.getElementById("dr-text").innerHTML =
    `<span class="name-alpha">α = ${alpha}°</span> + <span class="name-beta">β = ${beta}°</span> + ` +
    `<span class="name-gamma">γ = ${gamma}°</span> = <strong>${alpha + beta + gamma}°</strong><br>` +
    (beweis
      ? `<strong>Die Begründung:</strong> Die gestrichelte Gerade durch C ist <em>parallel</em> zu AB.<br>` +
        `An ihr ist der linke Winkel der <strong>Wechselwinkel</strong> zu α, der rechte der Wechselwinkel zu β — beide also gleich groß wie α und β.<br>` +
        `Zusammen mit γ liegen sie an einer <strong>Geraden</strong>, bilden also einen gestreckten Winkel:<br>` +
        `<span class="paar-ergaenzt">α + γ + β = 180°</span><br>` +
        `<span class="progress-note">Das gilt für <em>jedes</em> Dreieck — die Zeichnung ist nur ein Beispiel, die Begründung benutzt keine besonderen Zahlen.</span>`
      : `<span class="progress-note">Verschiebe die Regler: Die Summe bleibt immer 180°. Setz den Haken bei „Begründung einblenden“, um zu sehen, <em>warum</em> das so sein muss.</span>`);
}

function initDreieck() {
  ["dr-alpha", "dr-beta"].forEach((id) => document.getElementById(id).addEventListener("input", renderDreieck));
  document.getElementById("dr-beweis").addEventListener("change", renderDreieck);
  renderDreieck();
}

// ================= 4. Außenwinkel =================

function renderAussenwinkel() {
  const alpha = clampInt(document.getElementById("aw-alpha").value, 20, 110);
  let gamma = clampInt(document.getElementById("aw-gamma").value, 20, 110);
  if (alpha + gamma > 155) {
    gamma = 155 - alpha;
    document.getElementById("aw-gamma").value = String(gamma);
  }
  document.getElementById("aw-alpha-anzeige").textContent = alpha + "°";
  document.getElementById("aw-gamma-anzeige").textContent = gamma + "°";
  const beta = 180 - alpha - gamma;
  const aussen = 180 - beta; // = alpha + gamma
  const mount = document.getElementById("aw-mount");
  mount.innerHTML = "";

  const W = 540,
    H = 320;
  const { A, B, C } = dreieckAusWinkeln(alpha, beta, W - 110, H, 56);
  const svg = neueFlaeche(W, H);

  // AB über B hinaus verlängern — dort entsteht der Außenwinkel.
  const dir = richtung(A, B);
  const D = pol(B.x, B.y, 118, dir);
  svg.appendChild(svgEl("line", { x1: B.x, y1: B.y, x2: D.x, y2: D.y, class: "gerade-hilfs" }));
  const mAussen = eckenWinkel(svg, B, D, C, 44, "winkel-aussen");

  svg.appendChild(
    svgEl("path", { d: `M ${A.x} ${A.y} L ${B.x} ${B.y} L ${C.x} ${C.y} Z`, class: "dreieck-flaeche" })
  );
  const mA = eckenWinkel(svg, A, B, C, 32, "winkel-alpha");
  const mB = eckenWinkel(svg, B, C, A, 32, "winkel-beta");
  const mC = eckenWinkel(svg, C, A, B, 32, "winkel-gamma");
  svg.appendChild(svgText(mA.x, mA.y + 4, "α = " + alpha + "°", { class: "name-alpha" }));
  svg.appendChild(svgText(mB.x, mB.y + 4, "β = " + beta + "°", { class: "name-beta" }));
  svg.appendChild(svgText(mC.x, mC.y + 4, "γ = " + gamma + "°", { class: "name-gamma" }));
  svg.appendChild(svgText(mAussen.x + 10, mAussen.y + 4, "β' = " + aussen + "°", { class: "name-aussen" }));
  [[A, "A", -16, 16], [B, "B", 0, 20], [C, "C", 0, -14], [D, "D", 12, 16]].forEach(([p, name, dx, dy]) => {
    svg.appendChild(svgEl("circle", { cx: p.x, cy: p.y, r: 4.2, class: "kreis-punkt" }));
    svg.appendChild(svgText(p.x + dx, p.y + dy, name, { class: "kreis-beschriftung", fill: "#b3261e" }));
  });
  mount.appendChild(svg);

  document.getElementById("aw-text").innerHTML =
    `<strong>Weg 1 — über den Nebenwinkel:</strong> β' = 180° − β = 180° − ${beta}° = <strong>${aussen}°</strong><br>` +
    `<strong>Weg 2 — über den Außenwinkelsatz:</strong> β' = α + γ = ${alpha}° + ${gamma}° = <strong>${aussen}°</strong><br>` +
    `<span class="progress-note">Beide Wege führen zum selben Ergebnis, denn α + β + γ = 180° und β + β' = 180°. ` +
    `Weg 2 spart einen Schritt: Man kommt ohne β aus. Umgekehrt gilt genauso γ = β' − α = ${aussen}° − ${alpha}° = ${gamma}°.</span>`;
}

function initAussenwinkel() {
  ["aw-alpha", "aw-gamma"].forEach((id) => document.getElementById(id).addEventListener("input", renderAussenwinkel));
  renderAussenwinkel();
}

// ================= 5. Vielecke =================

function renderVieleck() {
  const n = clampInt(document.getElementById("vi-n").value, 3, 12);
  document.getElementById("vi-n-anzeige").textContent = n;
  const mount = document.getElementById("vi-mount");
  mount.innerHTML = "";

  const R = 118;
  const rand = 48;
  const W = 2 * R + 2 * rand,
    H = 2 * R + 2 * rand;
  const cx = W / 2,
    cy = H / 2;
  const svg = neueFlaeche(W, H);

  // Ecken oben beginnend, im Uhrzeigersinn
  const ecken = [];
  for (let k = 0; k < n; k++) ecken.push(pol(cx, cy, R, -90 + (k * 360) / n));

  // Zerlegung von Ecke 0 aus: n − 2 Dreiecke, abwechselnd hinterlegt
  for (let k = 1; k < n - 1; k++) {
    const p = ecken[0],
      q = ecken[k],
      s = ecken[k + 1];
    svg.appendChild(
      svgEl("path", {
        d: `M ${p.x} ${p.y} L ${q.x} ${q.y} L ${s.x} ${s.y} Z`,
        class: "vieleck-teil",
        "fill-opacity": k % 2 === 0 ? 0.18 : 0.07,
      })
    );
  }
  svg.appendChild(
    svgEl("path", { d: ecken.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ") + " Z", class: "vieleck-rand" })
  );
  for (let k = 2; k < n - 1; k++) {
    svg.appendChild(svgEl("line", { x1: ecken[0].x, y1: ecken[0].y, x2: ecken[k].x, y2: ecken[k].y, class: "vieleck-diagonale" }));
  }
  ecken.forEach((p, i) => {
    svg.appendChild(svgEl("circle", { cx: p.x, cy: p.y, r: 3.6, class: "kreis-punkt" }));
    if (i === 0) {
      svg.appendChild(svgText(p.x, p.y - 13, "hier zerlegt", { class: "kreis-beschriftung", fill: "#b3261e" }));
    }
  });
  mount.appendChild(svg);

  const dreiecke = n - 2;
  const summe = dreiecke * 180;
  const einzeln = summe / n; // beim regelmäßigen n-Eck
  // Nur für Teiler von 360 geht die Division auf; sonst wird gerundet, und dann
  // darf dort kein Gleichheitszeichen stehen.
  const glatt = Number.isInteger(einzeln);
  const zeichen = glatt ? "=" : "≈";
  const namen = { 3: "Dreieck", 4: "Viereck", 5: "Fünfeck", 6: "Sechseck", 7: "Siebeneck", 8: "Achteck", 9: "Neuneck", 10: "Zehneck", 11: "Elfeck", 12: "Zwölfeck" };
  document.getElementById("vi-text").innerHTML =
    `Das <strong>${namen[n]}</strong> zerfällt von einer Ecke aus in <strong>${dreiecke}</strong> Dreieck${dreiecke === 1 ? "" : "e"} ` +
    `(${n} Ecken − 2, denn zu den beiden Nachbarecken führt keine Diagonale).<br>` +
    `<span class="paar-ergaenzt">Innenwinkelsumme = (${n} − 2) · 180° = ${dreiecke} · 180° = ${summe}°</span><br>` +
    `Beim <strong>regelmäßigen</strong> ${namen[n]} sind alle Innenwinkel gleich groß:<br>` +
    `<span class="paar-gleich">${summe}° : ${n} ${zeichen} ${num(einzeln, 2)}°</span> &nbsp;— gleichwertig: 180° − 360° : ${n} ${zeichen} ${num(180 - 360 / n, 2)}°<br>` +
    (glatt ? "" : `<span class="progress-note">Die Division geht hier nicht auf — deshalb steht ≈ statt =. Glatt wird sie nur, wenn n ein Teiler von 360 ist.</span><br>`) +
    `<span class="progress-note">Die Zerlegung braucht keine Regelmäßigkeit: Auch in einem schiefen ${namen[n]} entstehen ${dreiecke} Dreiecke, also gilt die Innenwinkelsumme dort genauso.</span>`;
}

function initVieleck() {
  document.getElementById("vi-n").addEventListener("input", renderVieleck);
  renderVieleck();
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
  // Am Geradenkreuz. 90° wird ausgeschlossen: Dort wären Scheitel- und Nebenwinkel
  // zahlengleich, und die beiden Regeln ließen sich nicht auseinanderhalten.
  let alpha = randInt(2, 34) * 5;
  if (alpha === 90) alpha = 95;
  const nachScheitel = Math.random() < 0.5;
  const antwort = nachScheitel ? alpha : 180 - alpha;
  return {
    promptHtml:
      `Zwei Geraden schneiden sich. Einer der vier Winkel ist <strong>α = ${alpha}°</strong>. ` +
      `Wie groß ist der <strong>${nachScheitel ? "Scheitelwinkel" : "Nebenwinkel"}</strong> dazu (in Grad)?`,
    correct: antwort,
    tolerance: 0.01,
    placeholder: "Winkel in Grad",
    hinweis: (raw, val) => {
      if (val === (nachScheitel ? 180 - alpha : alpha)) {
        return nachScheitel
          ? `Das ist der <strong>Nebenwinkel</strong>. Scheitelwinkel liegen sich gegenüber und sind <strong>gleich groß</strong> wie α.`
          : `Das ist α selbst — der <strong>Scheitelwinkel</strong>. Der Nebenwinkel liegt daneben und ergänzt α zu <strong>180°</strong>.`;
      }
      if (val === 360 - alpha) return "Am Geradenkreuz ergänzen sich <em>benachbarte</em> Winkel zu 180°, nicht zu 360°. 360° wäre einmal ganz herum.";
      if (val === 90 - alpha) return "Zu 90° ergänzen sich <em>komplementäre</em> Winkel. Nebenwinkel liegen an einer Geraden und ergänzen sich zu 180°.";
      return "";
    },
    musterloesungHtml: nachScheitel
      ? `<span class="paar-gleich">Scheitelwinkel sind gleich groß: α' = α = ${alpha}°</span><br>` +
        `<span class="progress-note">Begründung: Beide sind Nebenwinkel desselben dritten Winkels β = ${180 - alpha}°, also α = 180° − β und α' = 180° − β.</span>`
      : `<span class="paar-ergaenzt">Nebenwinkel ergänzen sich zu 180°: β = 180° − ${alpha}° = ${180 - alpha}°</span><br>` +
        `<span class="progress-note">Begründung: Die beiden nicht gemeinsamen Schenkel bilden zusammen eine Gerade — einen gestreckten Winkel von 180°.</span>`,
  };
}

const PARALLEL_AUFGABE = [
  { name: "Stufenwinkel", gleich: true, figur: "F" },
  { name: "Wechselwinkel", gleich: true, figur: "Z" },
  { name: "Nachbarwinkel", gleich: false, figur: "U" },
];

function generateAufgabe2() {
  // An geschnittenen Parallelen. Auch hier ist 90° ausgeschlossen.
  let alpha = randInt(4, 32) * 5;
  if (alpha === 90) alpha = 95;
  const art = pick(PARALLEL_AUFGABE);
  const antwort = art.gleich ? alpha : 180 - alpha;
  return {
    promptHtml:
      `Zwei <strong>parallele</strong> Geraden g und h werden von einer Geraden t geschnitten. ` +
      `An g ist einer der Winkel <strong>α = ${alpha}°</strong>. ` +
      `Wie groß ist der zugehörige <strong>${art.name}</strong> an h (in Grad)?`,
    correct: antwort,
    tolerance: 0.01,
    placeholder: "Winkel in Grad",
    hinweis: (raw, val) => {
      if (val === (art.gleich ? 180 - alpha : alpha)) {
        return art.gleich
          ? `${art.name} sind an Parallelen <strong>gleich groß</strong> (${art.figur}-Figur). Zu 180° ergänzen sich nur die <strong>Nachbarwinkel</strong> (U-Figur).`
          : `Nachbarwinkel liegen zwischen den Parallelen auf <strong>derselben</strong> Seite und ergänzen sich zu <strong>180°</strong>. Gleich groß wären Stufen- und Wechselwinkel.`;
      }
      if (val === 360 - alpha) return "An Parallelen geht es um 180°, nicht um 360°. Der Vollwinkel spielt hier keine Rolle.";
      if (val === 90 - alpha) return "Zu 90° ergänzt wird hier nichts. Die einzige Ergänzung in diesem Thema geht auf 180°.";
      return "";
    },
    musterloesungHtml:
      `<strong>${art.name}</strong> erkennt man an der <strong>${art.figur}-Figur</strong>.<br>` +
      (art.gleich
        ? `<span class="paar-gleich">${art.name} an Parallelen sind gleich groß: ${alpha}°</span>`
        : `<span class="paar-ergaenzt">Nachbarwinkel ergänzen sich zu 180°: 180° − ${alpha}° = ${180 - alpha}°</span>`) +
      `<br><span class="progress-note">Alles folgt aus einer einzigen Tatsache: Weil g ∥ h ist, trifft t beide Geraden unter demselben Winkel. ` +
      `An beiden Schnittpunkten liegen deshalb dieselben zwei Größen — ${alpha}° und ${180 - alpha}°.</span>`,
  };
}

function generateAufgabe3() {
  // Winkelsumme im Dreieck: zwei Winkel gegeben, der dritte gesucht.
  const alpha = randInt(3, 24) * 5;
  const beta = randInt(3, Math.floor((175 - alpha) / 5)) * 5;
  const gamma = 180 - alpha - beta;
  return {
    promptHtml:
      `Im Dreieck ABC ist <strong>α = ${alpha}°</strong> und <strong>β = ${beta}°</strong>. ` +
      `Wie groß ist <strong>γ</strong> (in Grad)?`,
    correct: gamma,
    tolerance: 0.01,
    placeholder: "γ in Grad",
    hinweis: (raw, val) => {
      if (val === alpha + beta) return `Das ist die <strong>Summe</strong> der beiden gegebenen Winkel. Gesucht ist, was bis 180° noch <em>fehlt</em>: 180° − ${alpha}° − ${beta}°.`;
      if (val === 360 - alpha - beta) return "Im <strong>Dreieck</strong> ist die Winkelsumme 180°, nicht 360°. Auf 360° kommt erst das Viereck.";
      if (val === 180 - alpha) return `Du hast nur α abgezogen. Es müssen <strong>beide</strong> gegebenen Winkel abgezogen werden.`;
      if (val === 180 - beta) return `Du hast nur β abgezogen. Es müssen <strong>beide</strong> gegebenen Winkel abgezogen werden.`;
      return "";
    },
    musterloesungHtml:
      `In jedem Dreieck gilt α + β + γ = 180°, also:<br>` +
      `<span class="paar-ergaenzt">γ = 180° − α − β = 180° − ${alpha}° − ${beta}° = ${gamma}°</span><br>` +
      `<span class="progress-note">Probe: ${alpha}° + ${beta}° + ${gamma}° = 180° ✓ &nbsp;· ` +
      `Der Außenwinkel bei C wäre 180° − ${gamma}° = ${180 - gamma}° — genauso groß wie α + β.</span>`,
  };
}

function generateAufgabe4() {
  // Zwei Schritte: Aus dem Außenwinkel folgt der Innenwinkel, daraus über die
  // Winkelsumme der gesuchte. Konstruktiv gewählt, damit alles ganzzahlig
  // und jeder Winkel echt positiv bleibt.
  const alpha = randInt(4, 16) * 5; // 20° bis 80°
  const gamma = randInt(4, 16) * 5; // 20° bis 80°
  const beta = 180 - alpha - gamma;
  const aussen = 180 - beta; // = alpha + gamma
  return {
    promptHtml:
      `Im Dreieck ABC ist <strong>α = ${alpha}°</strong>. Die Seite AB wird über B hinaus verlängert; ` +
      `der dort entstehende <strong>Außenwinkel bei B beträgt ${aussen}°</strong>. Wie groß ist <strong>γ</strong> (in Grad)?`,
    correct: gamma,
    tolerance: 0.01,
    placeholder: "γ in Grad",
    hinweis: (raw, val) => {
      if (val === beta) return `Das ist <strong>β</strong>, der Innenwinkel bei B (180° − ${aussen}° = ${beta}°). Der ist nur der Zwischenschritt — gesucht ist γ.`;
      if (val === aussen) return "Das ist der Außenwinkel selbst, der schon gegeben war.";
      if (val === 180 - alpha - aussen) return `Du hast den <strong>Außenwinkel</strong> wie einen Innenwinkel behandelt. Erst muss daraus β = 180° − ${aussen}° = ${beta}° werden.`;
      if (val === aussen + alpha) return "Du hast addiert statt subtrahiert. Der Außenwinkel <em>ist</em> bereits die Summe α + γ — gesucht ist davon der Anteil γ.";
      return "";
    },
    musterloesungHtml:
      `<strong>Weg 1 — in zwei Schritten:</strong><br>` +
      `① β = 180° − ${aussen}° = <strong>${beta}°</strong> (Nebenwinkel des Außenwinkels)<br>` +
      `② γ = 180° − α − β = 180° − ${alpha}° − ${beta}° = <strong>${gamma}°</strong><br>` +
      `<strong>Weg 2 — mit dem Außenwinkelsatz, in einem Schritt:</strong><br>` +
      `Der Außenwinkel bei B ist so groß wie α + γ, also:<br>` +
      `<span class="paar-ergaenzt">γ = ${aussen}° − α = ${aussen}° − ${alpha}° = ${gamma}°</span><br>` +
      `<span class="progress-note">Probe: ${alpha}° + ${beta}° + ${gamma}° = 180° ✓ und ${beta}° + ${aussen}° = 180° ✓</span>`,
  };
}

function initExercises() {
  mountUebungsaufgaben(document.getElementById("exercises-mount"), [
    { schwierigkeit: "einfach", titel: "Aufgabe 1 — Scheitel- oder Nebenwinkel", generate: generateAufgabe1 },
    { schwierigkeit: "mittel", titel: "Aufgabe 2 — An geschnittenen Parallelen", generate: generateAufgabe2 },
    { schwierigkeit: "schwierig", titel: "Aufgabe 3 — Winkelsumme im Dreieck", generate: generateAufgabe3 },
    { schwierigkeit: "komplex", titel: "Aufgabe 4 — Außenwinkel", generate: generateAufgabe4 },
  ]);
}

// ================= Quizze =================

function initQuizzes() {
  mountQuiz(document.getElementById("quiz-geradenkreuz"), {
    q: "Zwei Geraden schneiden sich, einer der Winkel ist 130°. Wie groß sind die anderen drei?",
    options: ["alle 130°", "130°, 50° und 50°", "50°, 50° und 50°", "130°, 130° und 50°"],
    correct: 1,
    explain: "Der Scheitelwinkel ist ebenfalls 130°, die beiden Nebenwinkel je 180° − 130° = 50°. Es gibt immer genau zwei verschiedene Größen.",
  });
  mountQuiz(document.getElementById("quiz-parallelen"), {
    q: "Wann sind Stufenwinkel gleich groß?",
    options: [
      "immer, wenn sich zwei Geraden schneiden",
      "nur wenn die geschnittenen Geraden parallel sind",
      "nur wenn der Schnittwinkel 90° beträgt",
      "nie — sie ergänzen sich immer zu 180°",
    ],
    correct: 1,
    explain: "Die Parallelität ist die Voraussetzung. Umgekehrt gilt auch: Sind die Stufenwinkel gleich groß, dann sind die Geraden parallel — damit lässt sich Parallelität nachweisen.",
  });
  mountQuiz(document.getElementById("quiz-dreieck"), {
    q: "Kann ein Dreieck zwei rechte Winkel haben?",
    options: [
      "ja, dann ist der dritte 0°",
      "nein, denn 90° + 90° = 180°, für den dritten Winkel bliebe nichts übrig",
      "ja, in einem sehr großen Dreieck",
      "nur wenn es gleichschenklig ist",
    ],
    correct: 1,
    explain: "Zwei rechte Winkel verbrauchen die gesamte Winkelsumme. Der dritte Winkel müsste 0° sein — dann fielen zwei Seiten zusammen und es entstünde kein Dreieck. Jedes Dreieck hat höchstens einen rechten oder stumpfen Winkel.",
  });
  mountQuiz(document.getElementById("quiz-aussenwinkel"), {
    q: "Im Dreieck ist α = 40° und γ = 70°. Wie groß ist der Außenwinkel bei B?",
    options: ["70°", "110°", "140°", "180°"],
    correct: 1,
    explain: "Nach dem Außenwinkelsatz ist er die Summe der nicht anliegenden Innenwinkel: 40° + 70° = 110°. Zur Probe: β = 180° − 110° = 70°, und 40° + 70° + 70° = 180° ✓",
  });
  mountQuiz(document.getElementById("quiz-vieleck"), {
    q: "Wie groß ist die Innenwinkelsumme eines Sechsecks?",
    options: ["360°", "540°", "720°", "1080°"],
    correct: 2,
    explain: "Ein Sechseck zerfällt in 6 − 2 = 4 Dreiecke, also 4 · 180° = 720°. Beim regelmäßigen Sechseck ist jeder Innenwinkel 720° : 6 = 120°.",
  });
}

// ================= Start =================

initGeradenkreuz();
initParallelen();
initDreieck();
initAussenwinkel();
initVieleck();
initExercises();
initQuizzes();
