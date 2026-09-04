// Selbstlernpfad "Geometrische Konstruktionen" (Grundwissen Klasse 5-10).
// Rein clientseitiges Vanilla-JS, ohne Build-Schritt oder externe Bibliotheken.
//
// Grundsatz dieser Seite: Es wird nichts hingemalt, was nicht auch konstruiert ist.
// Jeder neue Punkt entsteht rechnerisch als SCHNITTPUNKT zweier Kreise oder einer
// Geraden mit einem Kreis — genau wie beim Konstruieren mit Zirkel und Lineal. Die
// Zeichnung ist damit nicht nur illustrativ, sondern selbst der Beleg dafür, dass
// die Konstruktion trägt.

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

// ---------- Elementargeometrie ----------

const V = {
  add: (p, q) => ({ x: p.x + q.x, y: p.y + q.y }),
  sub: (p, q) => ({ x: p.x - q.x, y: p.y - q.y }),
  mal: (p, s) => ({ x: p.x * s, y: p.y * s }),
  laenge: (p) => Math.hypot(p.x, p.y),
  abstand: (p, q) => Math.hypot(p.x - q.x, p.y - q.y),
  einheit: (p) => {
    const l = Math.hypot(p.x, p.y) || 1;
    return { x: p.x / l, y: p.y / l };
  },
  mitte: (p, q) => ({ x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 }),
};

// Die beiden Schnittpunkte zweier Kreise. Genau dieser Schritt ist beim Konstruieren
// der Zirkelschlag: Der Schnittpunkt hat von BEIDEN Mittelpunkten den jeweils
// vorgegebenen Abstand — daraus folgt jede der vier Grundkonstruktionen.
function kreisSchnitt(m1, r1, m2, r2) {
  const d = V.abstand(m1, m2);
  if (d > r1 + r2 || d < Math.abs(r1 - r2) || d === 0) return null;
  const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
  const h2 = r1 * r1 - a * a;
  if (h2 < 0) return null;
  const h = Math.sqrt(h2);
  const e = V.einheit(V.sub(m2, m1));
  const fuss = V.add(m1, V.mal(e, a));
  const n = { x: -e.y, y: e.x };
  return [V.add(fuss, V.mal(n, h)), V.sub(fuss, V.mal(n, h))];
}

// Schnittpunkte einer Geraden (durch p, Richtung r) mit einem Kreis um m.
function geradeKreisSchnitt(p, r, m, radius) {
  const e = V.einheit(r);
  const f = V.sub(p, m);
  const b = 2 * (f.x * e.x + f.y * e.y);
  const c = f.x * f.x + f.y * f.y - radius * radius;
  const disk = b * b - 4 * c;
  if (disk < 0) return null;
  const w = Math.sqrt(disk);
  return [V.add(p, V.mal(e, (-b + w) / 2)), V.add(p, V.mal(e, (-b - w) / 2))];
}

function geradenSchnitt(p1, r1, p2, r2) {
  const nenner = r1.x * r2.y - r1.y * r2.x;
  if (Math.abs(nenner) < 1e-9) return null;
  const d = V.sub(p2, p1);
  const t = (d.x * r2.y - d.y * r2.x) / nenner;
  return V.add(p1, V.mal(r1, t));
}

// ---------- Zeichenbausteine ----------

function zLinie(svg, p, q, klasse) {
  svg.appendChild(svgEl("line", { x1: p.x, y1: p.y, x2: q.x, y2: q.y, class: klasse }));
}
// Gerade durch p in Richtung r, bis über den Rand der Zeichenfläche hinaus
function zGerade(svg, p, r, klasse, W, H) {
  const e = V.einheit(r);
  const weit = W + H;
  zLinie(svg, V.sub(p, V.mal(e, weit)), V.add(p, V.mal(e, weit)), klasse);
}
function zKreis(svg, m, r, klasse) {
  svg.appendChild(svgEl("circle", { cx: m.x, cy: m.y, r, class: klasse }));
}
// Nur der Teil des Kreises, der beim Konstruieren wirklich gezogen wird
function zBogen(svg, m, r, grad1, grad2, klasse) {
  const pt = (g) => ({ x: m.x + r * Math.cos((g * Math.PI) / 180), y: m.y + r * Math.sin((g * Math.PI) / 180) });
  const a = pt(grad1), b = pt(grad2);
  const gross = Math.abs(grad2 - grad1) > 180 ? 1 : 0;
  const richtung = grad2 > grad1 ? 1 : 0;
  svg.appendChild(svgEl("path", { d: `M ${a.x.toFixed(2)} ${a.y.toFixed(2)} A ${r} ${r} 0 ${gross} ${richtung} ${b.x.toFixed(2)} ${b.y.toFixed(2)}`, class: klasse }));
}
function zPunkt(svg, p, name, klasse, dx = 0, dy = -11, namensklasse = "k-name") {
  svg.appendChild(svgEl("circle", { cx: p.x, cy: p.y, r: 4, class: klasse }));
  if (name) svg.appendChild(svgText(p.x + dx, p.y + dy, name, { class: namensklasse }));
}
// Das rechte-Winkel-Zeichen zwischen zwei Richtungen an einem Punkt
function zRechterWinkel(svg, p, r1, r2, s = 12) {
  const a = V.mal(V.einheit(r1), s), b = V.mal(V.einheit(r2), s);
  const e1 = V.add(p, a), e2 = V.add(V.add(p, a), b), e3 = V.add(p, b);
  svg.appendChild(svgEl("path", { d: `M ${e1.x} ${e1.y} L ${e2.x} ${e2.y} L ${e3.x} ${e3.y}`, class: "k-marke" }));
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

// ================= 2. Die Grundkonstruktionen =================

const KN_W = 480,
  KN_H = 320;

// Jede Konstruktion liefert die Schrittbeschreibungen und zeichnet bis zum
// gewünschten Schritt. Alle Punkte werden gerechnet, nicht gesetzt.
const KONSTRUKTIONEN = {
  mittelsenkrechte: {
    titel: "Mittelsenkrechte einer Strecke",
    schritte: [
      "Gegeben ist die Strecke AB.",
      "Kreisbogen um A mit einem Radius r, der größer ist als die halbe Strecke.",
      "Kreisbogen um B mit <strong>demselben</strong> Radius r — die Bögen schneiden sich in P und Q.",
      "Die Gerade PQ ist die Mittelsenkrechte: Sie halbiert AB und steht senkrecht darauf.",
    ],
    warum:
      "P und Q haben von A und von B <strong>denselben</strong> Abstand r — deshalb liegen beide auf der Mittelsenkrechten. " +
      "Denn die Mittelsenkrechte ist genau die Menge aller Punkte, die von A und B gleich weit entfernt sind. Zwei Punkte legen eine Gerade fest.",
    zeichne(svg, schritt) {
      const A = { x: 130, y: 200 },
        B = { x: 350, y: 200 };
      const r = 140;
      zLinie(svg, A, B, "k-gegeben");
      const s = kreisSchnitt(A, r, B, r);
      if (schritt >= 1) zKreis(svg, A, r, "k-hilfskreis");
      if (schritt >= 2) zKreis(svg, B, r, "k-hilfskreis");
      if (schritt >= 3 && s) {
        zGerade(svg, s[0], V.sub(s[1], s[0]), "k-ergebnis", KN_W, KN_H);
        const M = V.mitte(A, B);
        zRechterWinkel(svg, M, V.sub(B, A), V.sub(s[0], M));
        zPunkt(svg, M, "M", "k-punkt-ergebnis", 0, 20);
      }
      if (schritt >= 2 && s) {
        zPunkt(svg, s[0], "P", "k-punkt-neu", -14, -4, "k-name-neu");
        zPunkt(svg, s[1], "Q", "k-punkt-neu", -14, 14, "k-name-neu");
      }
      zPunkt(svg, A, "A", "k-punkt", -6, 20);
      zPunkt(svg, B, "B", "k-punkt", 6, 20);
      return s ? { M: V.mitte(A, B), A, B, P: s[0], Q: s[1] } : null;
    },
  },
  winkelhalbierende: {
    titel: "Winkelhalbierende eines Winkels",
    schritte: [
      "Gegeben ist der Winkel mit dem Scheitel S.",
      "Kreisbogen um S — er schneidet die beiden Schenkel in P und Q.",
      "Kreisbögen um P und um Q mit gleichem Radius — sie schneiden sich in R.",
      "Der Strahl von S durch R ist die Winkelhalbierende.",
    ],
    warum:
      "P und Q liegen von S gleich weit entfernt, und R liegt von P und Q gleich weit entfernt. " +
      "Damit ist die Figur SPRQ symmetrisch zur Geraden SR — sie klappt auf sich selbst, und die beiden Teilwinkel sind gleich groß. " +
      "Gleichwertig: Jeder Punkt der Winkelhalbierenden hat von beiden Schenkeln denselben Abstand.",
    zeichne(svg, schritt) {
      const S = { x: 110, y: 250 };
      const g1 = 0,
        g2 = -56; // Bildschirmgrad: negativ heißt nach oben
      const rad = (g) => ({ x: Math.cos((g * Math.PI) / 180), y: Math.sin((g * Math.PI) / 180) });
      const r1 = rad(g1),
        r2 = rad(g2);
      zLinie(svg, S, V.add(S, V.mal(r1, 320)), "k-gegeben");
      zLinie(svg, S, V.add(S, V.mal(r2, 320)), "k-gegeben");
      const rS = 150;
      const P = V.add(S, V.mal(r1, rS)),
        Q = V.add(S, V.mal(r2, rS));
      if (schritt >= 1) zBogen(svg, S, rS, g2 - 10, g1 + 10, "k-hilfskreis");
      const rPQ = 118;
      const s = kreisSchnitt(P, rPQ, Q, rPQ);
      // Von den beiden Schnittpunkten ist der gesuchte der weiter von S entfernte
      const R = s ? (V.abstand(s[0], S) > V.abstand(s[1], S) ? s[0] : s[1]) : null;
      if (schritt >= 2) {
        zKreis(svg, P, rPQ, "k-hilfskreis");
        zKreis(svg, Q, rPQ, "k-hilfskreis");
      }
      if (schritt >= 3 && R) {
        zLinie(svg, S, V.add(S, V.mal(V.einheit(V.sub(R, S)), 330)), "k-ergebnis");
        zPunkt(svg, R, "R", "k-punkt-neu", 14, 4, "k-name-neu");
      }
      if (schritt >= 1) {
        zPunkt(svg, P, "P", "k-punkt-neu", 0, 20, "k-name-neu");
        zPunkt(svg, Q, "Q", "k-punkt-neu", -14, 0, "k-name-neu");
      }
      zPunkt(svg, S, "S", "k-punkt", -14, 8);
      return R ? { S, P, Q, R } : null;
    },
  },
  lot: {
    titel: "Lot von einem Punkt auf eine Gerade",
    schritte: [
      "Gegeben sind die Gerade g und der Punkt P außerhalb.",
      "Kreisbogen um P, der g in zwei Punkten A und B schneidet.",
      "Kreisbögen um A und um B mit gleichem Radius — sie schneiden sich in Q.",
      "Die Gerade PQ steht senkrecht auf g. Der Schnittpunkt F ist der Lotfußpunkt.",
    ],
    warum:
      "P und Q haben beide von A und von B denselben Abstand — sie liegen also beide auf der <strong>Mittelsenkrechten von AB</strong>. " +
      "Und die steht per Konstruktion senkrecht auf g. Das Lot ist damit nichts Neues, sondern eine Mittelsenkrechte an der richtigen Stelle.",
    zeichne(svg, schritt) {
      const gP = { x: 60, y: 240 },
        gR = { x: 1, y: 0 };
      const P = { x: 250, y: 90 };
      zGerade(svg, gP, gR, "k-gegeben", KN_W, KN_H);
      svg.appendChild(svgText(430, 232, "g", { class: "k-name" }));
      const rP = 185;
      const treffer = geradeKreisSchnitt(gP, gR, P, rP);
      const A = treffer ? treffer[1] : null,
        B = treffer ? treffer[0] : null;
      if (schritt >= 1 && A) zBogen(svg, P, rP, 22, 158, "k-hilfskreis");
      // Der Radius muss größer sein als der halbe Abstand AB, damit sich die Bögen
      // schneiden — und klein genug, dass Q auf der Zeichenfläche bleibt.
      const rAB = 118;
      const s = A && B ? kreisSchnitt(A, rAB, B, rAB) : null;
      // Der gesuchte Punkt Q liegt auf der anderen Seite von g als P
      const Q = s ? (s[0].y > gP.y ? s[0] : s[1]) : null;
      if (schritt >= 2 && A && B) {
        zBogen(svg, A, rAB, -18, 60, "k-hilfskreis");
        zBogen(svg, B, rAB, 120, 198, "k-hilfskreis");
      }
      let F = null;
      if (schritt >= 3 && Q) {
        zGerade(svg, P, V.sub(Q, P), "k-ergebnis", KN_W, KN_H);
        F = geradenSchnitt(gP, gR, P, V.sub(Q, P));
        zRechterWinkel(svg, F, gR, V.sub(P, F));
        zPunkt(svg, F, "F", "k-punkt-ergebnis", 16, 18);
        zPunkt(svg, Q, "Q", "k-punkt-neu", 14, 6, "k-name-neu");
      }
      if (schritt >= 1 && A && B) {
        zPunkt(svg, A, "A", "k-punkt-neu", -6, 20, "k-name-neu");
        zPunkt(svg, B, "B", "k-punkt-neu", 6, 20, "k-name-neu");
      }
      zPunkt(svg, P, "P", "k-punkt", 0, -14);
      return Q ? { P, Q, A, B, F, gP, gR } : null;
    },
  },
  parallele: {
    titel: "Parallele durch einen Punkt",
    schritte: [
      "Gegeben sind die Gerade g und der Punkt P außerhalb.",
      "Eine Hilfsgerade durch P, die g in S schneidet — sie erzeugt an S einen Winkel.",
      "Diesen Winkel bei P <strong>abtragen</strong>: Kreisbogen um S und um P mit gleichem Radius, dann die Zirkelöffnung des Schnittsehnenmaßes übertragen.",
      "Der so entstehende Strahl ist die Parallele — der abgetragene Winkel ist ein <strong>Stufenwinkel</strong>.",
    ],
    warum:
      "Aus <a href='../05-winkelbetrachtungen/index.html#sec-parallelen'>Thema 5</a>: Sind die Stufenwinkel gleich groß, <em>dann</em> sind die Geraden parallel. " +
      "Genau diese Umkehrung wird hier benutzt — der Winkel wird abgetragen, und die Parallelität ist damit bewiesen, nicht nur nach Augenmaß hergestellt.",
    zeichne(svg, schritt) {
      const gP = { x: 50, y: 250 },
        gR = { x: 1, y: 0 };
      const P = { x: 250, y: 100 };
      zGerade(svg, gP, gR, "k-gegeben", KN_W, KN_H);
      svg.appendChild(svgText(438, 242, "g", { class: "k-name" }));
      // Hilfsgerade durch P mit fester Richtung; S ist ihr Schnitt mit g
      const hR = V.einheit({ x: -0.55, y: 1 });
      const S = geradenSchnitt(gP, gR, P, hR);
      if (schritt >= 1) {
        zGerade(svg, P, hR, "k-hilfslinie", KN_W, KN_H);
        zPunkt(svg, S, "S", "k-punkt-neu", -8, 20, "k-name-neu");
      }
      // Winkel bei S zwischen g (nach rechts) und der Hilfsgeraden (nach oben zu P)
      const rW = 78;
      const richtungSP = V.einheit(V.sub(P, S));
      const U = V.add(S, V.mal(gR, rW)); // auf g
      const Vp = V.add(S, V.mal(richtungSP, rW)); // Richtung P
      const sehne = V.abstand(U, Vp);
      const U2 = V.add(P, V.mal(richtungSP, rW)); // gleicher Radius um P, auf der Hilfsgeraden
      const sp = kreisSchnitt(P, rW, U2, sehne);
      // Der Stufenwinkel öffnet nach rechts wie bei S
      const W2 = sp ? (sp[0].x > sp[1].x ? sp[0] : sp[1]) : null;
      if (schritt >= 2) {
        zBogen(svg, S, rW, -120, 10, "k-hilfskreis");
        zBogen(svg, P, rW, -120, 10, "k-hilfskreis");
        zLinie(svg, U, Vp, "k-hilfslinie");
        if (W2) zLinie(svg, U2, W2, "k-hilfslinie");
        zPunkt(svg, U, "U", "k-punkt-neu", 4, 18, "k-name-neu");
        zPunkt(svg, Vp, "V", "k-punkt-neu", -14, 2, "k-name-neu");
        zPunkt(svg, U2, "U'", "k-punkt-neu", -6, -10, "k-name-neu");
        if (W2) zPunkt(svg, W2, "V'", "k-punkt-neu", 12, 6, "k-name-neu");
      }
      if (schritt >= 3 && W2) {
        zGerade(svg, P, V.sub(W2, P), "k-ergebnis", KN_W, KN_H);
        svg.appendChild(svgText(438, 92, "h ∥ g", { class: "k-name", fill: "#b3261e" }));
      }
      zPunkt(svg, P, "P", "k-punkt", 0, -14);
      return W2 ? { P, S, richtung: V.sub(W2, P), gR } : null;
    },
  },
};

let knSchritt = 3;

function renderKonstruktion() {
  const art = document.getElementById("kn-art").value;
  const k = KONSTRUKTIONEN[art];
  const maxSchritt = k.schritte.length - 1;
  if (knSchritt > maxSchritt) knSchritt = maxSchritt;
  if (knSchritt < 0) knSchritt = 0;

  const mount = document.getElementById("kn-mount");
  mount.innerHTML = "";
  const svg = neueFlaeche(KN_W, KN_H);
  const ergebnis = k.zeichne(svg, knSchritt);
  mount.appendChild(svg);

  document.getElementById("kn-anzeige").textContent = `Schritt ${knSchritt + 1} von ${maxSchritt + 1}`;
  const liste = el("ul", { class: "schritt-liste" });
  k.schritte.forEach((s, i) => {
    liste.appendChild(el("li", { class: i < knSchritt ? "getan" : i === knSchritt ? "aktuell" : "", html: s }));
  });
  const wrap = document.getElementById("kn-schritte");
  wrap.innerHTML = "";
  wrap.appendChild(liste);

  document.getElementById("kn-text").innerHTML =
    `<strong>${k.titel}</strong><br><strong>Warum das funktioniert:</strong> ${k.warum}` +
    (knSchritt < maxSchritt
      ? `<br><span class="progress-note">Noch ${maxSchritt - knSchritt} Schritt${maxSchritt - knSchritt === 1 ? "" : "e"} bis zum Ergebnis.</span>`
      : `<br><span class="progress-note">Fertig — beachte, dass alle Hilfskreise stehen bleiben. Sie sind der Nachweis der Konstruktion.</span>`) +
    (ergebnis ? "" : `<br><span class="progress-note">⚠️ Bei diesen Radien schneiden sich die Bögen nicht.</span>`);
}

function initKonstruktion() {
  document.getElementById("kn-art").addEventListener("change", () => {
    knSchritt = KONSTRUKTIONEN[document.getElementById("kn-art").value].schritte.length - 1;
    renderKonstruktion();
  });
  document.getElementById("kn-vor").addEventListener("click", () => {
    knSchritt += 1;
    renderKonstruktion();
  });
  document.getElementById("kn-zurueck").addEventListener("click", () => {
    knSchritt -= 1;
    renderKonstruktion();
  });
  document.getElementById("kn-alle").addEventListener("click", () => {
    knSchritt = 99;
    renderKonstruktion();
  });
  renderKonstruktion();
}

// ================= 3. Dreiecksungleichung =================

function renderUngleichung() {
  const a = clampInt(document.getElementById("du-a").value, 1, 12);
  const b = clampInt(document.getElementById("du-b").value, 1, 12);
  const c = clampInt(document.getElementById("du-c").value, 1, 12);
  const moeglich = a < b + c && b < a + c && c < a + b;
  const entartet = a === b + c || b === a + c || c === a + b;

  const mount = document.getElementById("du-mount");
  mount.innerHTML = "";
  const W = 460,
    H = 260;
  const svg = neueFlaeche(W, H);
  const px = 26; // Pixel je cm
  // Konstruktion wie mit dem Zirkel: Grundseite c abtragen, Kreise mit b um A und a um B.
  const A = { x: (W - c * px) / 2, y: H - 56 };
  const B = { x: A.x + c * px, y: A.y };
  zLinie(svg, A, B, "k-gegeben");
  zKreis(svg, A, b * px, "k-hilfskreis");
  zKreis(svg, B, a * px, "k-hilfskreis");
  const s = kreisSchnitt(A, b * px, B, a * px);
  if (s) {
    const C = s[0].y < s[1].y ? s[0] : s[1];
    zLinie(svg, A, C, "k-ergebnis");
    zLinie(svg, B, C, "k-ergebnis");
    zPunkt(svg, C, "C", "k-punkt-ergebnis", 0, -14);
  }
  zPunkt(svg, A, "A", "k-punkt", -6, 20);
  zPunkt(svg, B, "B", "k-punkt", 6, 20);
  svg.appendChild(svgText((A.x + B.x) / 2, A.y + 22, `c = ${c} cm`, { class: "k-name" }));
  mount.appendChild(svg);

  const wrap = document.getElementById("du-pruefung");
  wrap.innerHTML = "";
  const maxLen = Math.max(a, b, c);
  const balken = (name, wert, klasse) => {
    const z = el("div", { class: "du-balken" });
    z.appendChild(el("span", { style: "width:5.5rem" }, `${name} = ${wert} cm`));
    z.appendChild(el("span", { class: "stab " + klasse, style: `width:${(wert / maxLen) * 190}px` }));
    return z;
  };
  wrap.appendChild(balken("a", a, "du-a"));
  wrap.appendChild(balken("b", b, "du-b"));
  wrap.appendChild(balken("c", c, "du-c"));
  const pruefungen = [
    ["a", a, "b + c", b + c],
    ["b", b, "a + c", a + c],
    ["c", c, "a + b", a + b],
  ];
  for (const [n1, v1, n2, v2] of pruefungen) {
    const ok = v1 < v2;
    wrap.appendChild(
      el("div", {
        class: "du-urteil " + (ok ? "ja" : "nein"),
        html: `${n1} &lt; ${n2}? &nbsp; ${v1} &lt; ${v2} &nbsp; ${ok ? "✓" : "✗"}`,
      })
    );
  }

  document.getElementById("du-text").innerHTML = moeglich
    ? `<span class="du-urteil ja">Das Dreieck existiert.</span> Alle drei Bedingungen sind erfüllt — die beiden Zirkelbögen schneiden sich, und der Schnittpunkt ist die Ecke C.<br>` +
      `<span class="progress-note">Nach dem Kongruenzsatz <strong>SSS</strong> ist es damit sogar eindeutig bestimmt: Es gibt genau ein solches Dreieck (bis auf Spiegelung und Verschiebung).</span>`
    : entartet
      ? `<span class="du-urteil nein">Kein Dreieck.</span> Zwei Seiten sind zusammen <strong>genau so lang</strong> wie die dritte. Die Zirkelbögen berühren sich nur in einem Punkt, der auf AB liegt — es entsteht eine <em>Strecke</em>, kein Dreieck.<br>` +
        `<span class="progress-note">Die Dreiecksungleichung verlangt „echt kleiner“, nicht „kleiner oder gleich“.</span>`
      : `<span class="du-urteil nein">Kein Dreieck.</span> Eine Seite ist länger als die beiden anderen zusammen — die Zirkelbögen erreichen sich gar nicht.<br>` +
        `<span class="progress-note">Anschaulich: Der kürzeste Weg von A nach B ist die Strecke AB. Über einen Umweg C kann man nicht kürzer werden, also gilt immer AC + CB &gt; AB.</span>`;
}

function initUngleichung() {
  ["du-a", "du-b", "du-c"].forEach((id) => document.getElementById(id).addEventListener("input", renderUngleichung));
  renderUngleichung();
}

// ================= 4. Kongruenzsätze =================

const KONGRUENZ = [
  { kuerzel: "SSS", was: "drei Seiten", gilt: true, loesungen: 1,
    text: "Die drei Seitenlängen legen das Dreieck fest: Grundseite abtragen, dann die beiden Kreisbögen — sie schneiden sich in genau einer Ecke (auf jeder Seite von AB eine, aber die beiden sind spiegelgleich).",
    voraussetzung: "Voraussetzung ist allerdings die <strong>Dreiecksungleichung</strong> — sonst schneiden sich die Bögen gar nicht." },
  { kuerzel: "SWS", was: "zwei Seiten und der eingeschlossene Winkel", gilt: true, loesungen: 1,
    text: "Der Winkel wird an die erste Seite angetragen, auf dem freien Schenkel die zweite Seite abgetragen — die dritte Ecke steht damit fest.",
    voraussetzung: "Wichtig ist das Wort <em>eingeschlossen</em>: Der Winkel muss zwischen den beiden gegebenen Seiten liegen." },
  { kuerzel: "WSW", was: "eine Seite und die beiden anliegenden Winkel", gilt: true, loesungen: 1,
    text: "An beiden Enden der Seite wird je ein Winkel angetragen; die beiden freien Schenkel schneiden sich in der dritten Ecke.",
    voraussetzung: "Es genügt sogar, wenn einer der Winkel gegenüberliegt (WWS) — denn der dritte Winkel folgt aus der Winkelsumme 180°." },
  { kuerzel: "SsW", was: "zwei Seiten und der Winkel gegenüber der längeren", gilt: true, loesungen: 1,
    text: "Liegt der Winkel der <strong>längeren</strong> der beiden Seiten gegenüber, gibt es genau eine Lösung — der Kreisbogen trifft den Schenkel nur einmal im gültigen Bereich.",
    voraussetzung: "Das kleine s im Namen erinnert daran: Der Winkel gehört zur größeren Seite. Sonst wird daraus der zweideutige Fall." },
  { kuerzel: "SSW", was: "zwei Seiten und der Winkel gegenüber der kürzeren", gilt: false, loesungen: 2,
    text: "Hier kann der Kreisbogen den Schenkel <strong>zweimal</strong> treffen: Es gibt zwei verschiedene Dreiecke, die alle Angaben erfüllen. Deshalb ist SSW <em>kein</em> Kongruenzsatz.",
    voraussetzung: "Je nach Zahlen sind es auch null oder eine Lösung — aber eben nicht immer genau eine, und genau das verlangt ein Kongruenzsatz." },
  { kuerzel: "WWW", was: "drei Winkel", gilt: false, loesungen: 0,
    text: "Drei Winkel legen nur die <strong>Form</strong> fest, nicht die Größe. Zu jedem Dreieck gibt es beliebig viele vergrößerte oder verkleinerte mit denselben Winkeln.",
    voraussetzung: "Außerdem sind es gar keine drei unabhängigen Angaben: Aus zwei Winkeln folgt der dritte über die Winkelsumme. Solche Dreiecke heißen <em>ähnlich</em>, nicht kongruent." },
];

let kgAktiv = 0;

function renderKongruenz() {
  const k = KONGRUENZ[kgAktiv];
  const reihe = document.getElementById("kg-reihe");
  reihe.innerHTML = "";
  KONGRUENZ.forEach((x, i) => {
    const btn = el("button", { type: "button", class: "btn" + (i === kgAktiv ? " btn-primary" : "") }, x.kuerzel);
    btn.addEventListener("click", () => {
      kgAktiv = i;
      renderKongruenz();
    });
    reihe.appendChild(btn);
  });

  const mount = document.getElementById("kg-mount");
  mount.innerHTML = "";
  const W = 470,
    H = 250;
  const svg = neueFlaeche(W, H);

  if (k.kuerzel === "WWW") {
    // Zwei ähnliche, aber verschieden große Dreiecke mit denselben Winkeln
    for (const [ox, s] of [[40, 1], [270, 0.62]]) {
      const A = { x: ox, y: H - 50 };
      const B = { x: ox + 170 * s, y: H - 50 };
      const C = { x: ox + 62 * s, y: H - 50 - 130 * s };
      svg.appendChild(svgEl("path", { d: `M ${A.x} ${A.y} L ${B.x} ${B.y} L ${C.x} ${C.y} Z`, fill: "#2563eb", "fill-opacity": 0.12, class: "k-gegeben" }));
      [[A, "A"], [B, "B"], [C, "C"]].forEach(([p, n]) => zPunkt(svg, p, n, "k-punkt", 0, n === "C" ? -12 : 20));
    }
    svg.appendChild(svgText(W / 2, 26, "gleiche Winkel, verschiedene Größe — ähnlich, nicht kongruent", { class: "k-name" }));
  } else if (k.kuerzel === "SSW") {
    // Der zweideutige Fall: ein Kreisbogen trifft den Schenkel zweimal
    const A = { x: 70, y: H - 54 };
    const alpha = -34;
    const rad = { x: Math.cos((alpha * Math.PI) / 180), y: Math.sin((alpha * Math.PI) / 180) };
    zLinie(svg, A, V.add(A, V.mal(rad, 370)), "k-gegeben");
    const B = { x: A.x + 250, y: A.y };
    zLinie(svg, A, B, "k-gegeben");
    const rB = 150;
    zKreis(svg, B, rB, "k-hilfskreis");
    const treffer = geradeKreisSchnitt(A, rad, B, rB);
    if (treffer) {
      treffer.forEach((C, i) => {
        zLinie(svg, B, C, "k-ergebnis");
        zPunkt(svg, C, i === 0 ? "C₁" : "C₂", "k-punkt-ergebnis", 0, -12);
      });
    }
    zPunkt(svg, A, "A", "k-punkt", -6, 20);
    zPunkt(svg, B, "B", "k-punkt", 0, 22);
    svg.appendChild(svgText(W / 2, 26, "derselbe Kreisbogen trifft den Schenkel zweimal", { class: "k-name" }));
  } else {
    // Ein eindeutig bestimmtes Dreieck mit den hervorgehobenen Bestimmungsstücken
    const A = { x: 110, y: H - 54 },
      B = { x: 360, y: H - 54 },
      C = { x: 190, y: 60 };
    const dickeSeite = { SSS: ["AB", "BC", "CA"], SWS: ["AB", "CA"], WSW: ["AB"], SsW: ["AB", "BC"] }[k.kuerzel] || [];
    const kanten = [["AB", A, B], ["BC", B, C], ["CA", C, A]];
    for (const [name, p, q] of kanten) {
      zLinie(svg, p, q, dickeSeite.includes(name) ? "k-ergebnis" : "k-gegeben");
    }
    const winkelBei = { SWS: ["A"], WSW: ["A", "B"], SsW: ["A"] }[k.kuerzel] || [];
    const bogenAn = (P, Q, R) => {
      const r = 34;
      const g1 = (Math.atan2(Q.y - P.y, Q.x - P.x) * 180) / Math.PI;
      const g2 = (Math.atan2(R.y - P.y, R.x - P.x) * 180) / Math.PI;
      zBogen(svg, P, r, g1, g2, "k-marke");
    };
    if (winkelBei.includes("A")) bogenAn(A, B, C);
    if (winkelBei.includes("B")) bogenAn(B, C, A);
    [[A, "A", -6, 20], [B, "B", 6, 20], [C, "C", 0, -12]].forEach(([p, n, dx, dy]) => zPunkt(svg, p, n, "k-punkt", dx, dy));
    svg.appendChild(svgText(W / 2, 26, "rot: die gegebenen Seiten · violett: die gegebenen Winkel", { class: "k-name" }));
  }
  mount.appendChild(svg);

  document.getElementById("kg-text").innerHTML =
    `<strong>${k.kuerzel}</strong> — ${k.was}<br>` +
    (k.gilt
      ? `<span class="du-urteil ja">Das ist ein Kongruenzsatz: genau eine Lösung.</span>`
      : `<span class="du-urteil nein">Kein Kongruenzsatz.</span>`) +
    `<br>${k.text}<br><span class="progress-note">${k.voraussetzung}</span>`;
}

function initKongruenz() {
  renderKongruenz();
}

// ================= 5. Besondere Linien =================

const BESONDERE_LINIEN = {
  mittelsenkrechte: {
    name: "Mittelsenkrechten",
    punkt: "Umkreismittelpunkt M",
    eigenschaft: "M hat von <strong>allen drei Ecken</strong> denselben Abstand — deshalb geht der Kreis um M durch A, B und C: der <strong>Umkreis</strong>.",
    grund:
      "Der Schnittpunkt der Mittelsenkrechten von AB und von BC ist von A und B gleich weit entfernt <em>und</em> von B und C. Also ist er von A und C gleich weit entfernt — und liegt damit zwangsläufig auch auf der dritten Mittelsenkrechten.",
  },
  winkelhalbierende: {
    name: "Winkelhalbierenden",
    punkt: "Inkreismittelpunkt I",
    eigenschaft: "I hat von <strong>allen drei Seiten</strong> denselben Abstand — deshalb berührt der Kreis um I jede Seite genau einmal: der <strong>Inkreis</strong>.",
    grund:
      "Dasselbe Argument wie bei den Mittelsenkrechten, nur mit Abständen zu Geraden statt zu Punkten. Der Radius ist der Lotabstand von I zu einer Seite.",
  },
  hoehe: {
    name: "Höhen",
    punkt: "Höhenschnittpunkt H",
    eigenschaft: "Eine Höhe ist das <strong>Lot von einer Ecke auf die gegenüberliegende Seite</strong>. Bei einem stumpfwinkligen Dreieck liegt H außerhalb.",
    grund:
      "Anders als bei Um- und Inkreis hat H keine Abstandseigenschaft. Dass sich die drei Höhen trotzdem in einem Punkt treffen, ist ein eigener Satz.",
  },
  seitenhalbierende: {
    name: "Seitenhalbierenden",
    punkt: "Schwerpunkt S",
    eigenschaft: "Eine Seitenhalbierende verbindet eine <strong>Ecke mit der Mitte der Gegenseite</strong>. S teilt jede von ihnen im Verhältnis <strong>2 : 1</strong>, von der Ecke aus gemessen.",
    grund:
      "S ist der Punkt, in dem sich ein aus Pappe ausgeschnittenes Dreieck auf einer Fingerspitze balancieren lässt — daher der Name Schwerpunkt.",
  },
};

function renderBesondereLinien() {
  const art = document.getElementById("bl-art").value;
  const info = BESONDERE_LINIEN[art];
  const mount = document.getElementById("bl-mount");
  mount.innerHTML = "";
  const W = 470,
    H = 300;
  const svg = neueFlaeche(W, H);

  const A = { x: 80, y: 250 },
    B = { x: 400, y: 250 },
    C = { x: 210, y: 60 };
  const ecken = [A, B, C];
  const gegen = [[B, C], [C, A], [A, B]];

  let treff = null;
  const linien = [];
  for (let i = 0; i < 3; i++) {
    const [p, q] = gegen[i];
    if (art === "mittelsenkrechte") {
      const m = V.mitte(p, q);
      const r = V.sub(q, p);
      linien.push([m, { x: -r.y, y: r.x }]);
    } else if (art === "seitenhalbierende") {
      linien.push([ecken[i], V.sub(V.mitte(p, q), ecken[i])]);
    } else if (art === "hoehe") {
      const r = V.sub(q, p);
      linien.push([ecken[i], { x: -r.y, y: r.x }]);
    } else {
      // Winkelhalbierende: Richtung als Summe der beiden Einheitsvektoren zu den Nachbarecken
      const e1 = V.einheit(V.sub(p, ecken[i])),
        e2 = V.einheit(V.sub(q, ecken[i]));
      linien.push([ecken[i], V.add(e1, e2)]);
    }
  }
  treff = geradenSchnitt(linien[0][0], linien[0][1], linien[1][0], linien[1][1]);

  for (const [p, r] of linien) zGerade(svg, p, r, "k-hilfslinie", W, H);
  svg.appendChild(svgEl("path", { d: `M ${A.x} ${A.y} L ${B.x} ${B.y} L ${C.x} ${C.y} Z`, fill: "none", class: "k-gegeben" }));

  if (treff) {
    if (art === "mittelsenkrechte") {
      zKreis(svg, treff, V.abstand(treff, A), "k-ergebnis");
    } else if (art === "winkelhalbierende") {
      // Inkreisradius: Lotabstand vom Schnittpunkt zu einer Seite
      const r = V.sub(B, A);
      const e = V.einheit(r);
      const f = V.sub(treff, A);
      const proj = f.x * e.x + f.y * e.y;
      const fuss = V.add(A, V.mal(e, proj));
      zKreis(svg, treff, V.abstand(treff, fuss), "k-ergebnis");
    }
    zPunkt(svg, treff, art === "mittelsenkrechte" ? "M" : art === "winkelhalbierende" ? "I" : art === "hoehe" ? "H" : "S",
      "k-punkt-ergebnis", 14, -8);
  }
  [[A, "A", -8, 20], [B, "B", 8, 20], [C, "C", 0, -14]].forEach(([p, n, dx, dy]) => zPunkt(svg, p, n, "k-punkt", dx, dy));
  mount.appendChild(svg);

  document.getElementById("bl-text").innerHTML =
    `Die drei <strong>${info.name}</strong> schneiden sich im <strong>${info.punkt}</strong>.<br>` +
    `${info.eigenschaft}<br><span class="progress-note"><strong>Warum treffen sie sich in einem Punkt?</strong> ${info.grund}</span>`;
}

function initBesondereLinien() {
  document.getElementById("bl-art").addEventListener("change", renderBesondereLinien);
  renderBesondereLinien();
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
  // Kürzeste ganzzahlige dritte Seite. Die Seiten werden verschieden gewählt,
  // damit |a − b| + 1 nicht mit dem trivialen Wert 1 zusammenfällt.
  const a = randInt(3, 14);
  let b = randInt(3, 14);
  if (b === a) b = a === 14 ? a - 1 : a + 1;
  const min = Math.abs(a - b) + 1;
  return {
    promptHtml:
      `Zwei Seiten eines Dreiecks sind <strong>a = ${a} cm</strong> und <strong>b = ${b} cm</strong>. ` +
      `Wie lang muss die dritte Seite c <strong>mindestens</strong> sein, wenn sie eine <em>ganze</em> Zahl von Zentimetern ist?`,
    correct: min,
    tolerance: 0.01,
    placeholder: "c in cm",
    hinweis: (raw, val) => {
      if (val === Math.abs(a - b)) return `Bei c = ${Math.abs(a - b)} cm wäre a genau so lang wie b + c — dann entsteht eine <strong>Strecke</strong>, kein Dreieck. Die Ungleichung verlangt „echt kleiner“, also muss c mindestens 1 cm größer sein.`;
      if (val === a + b) return "Das ist die <strong>Summe</strong> der beiden Seiten — die obere Schranke, und auch die wird nicht erreicht. Gefragt ist die <em>untere</em> Grenze.";
      if (val === a + b - 1) return "Das ist die <strong>längste</strong> mögliche dritte Seite. Gefragt ist die kürzeste.";
      if (val === 1) return "So kurz darf c nicht sein: Dann wäre die längere der beiden gegebenen Seiten länger als die anderen beiden zusammen.";
      return "";
    },
    musterloesungHtml:
      `Die Dreiecksungleichung verlangt, dass jede Seite kürzer ist als die Summe der beiden anderen. Kritisch ist hier die <strong>längere</strong> der gegebenen Seiten:<br>` +
      `${Math.max(a, b)} &lt; ${Math.min(a, b)} + c &nbsp;⇒&nbsp; c &gt; ${Math.max(a, b)} − ${Math.min(a, b)} = ${Math.abs(a - b)}<br>` +
      `<span class="du-urteil ja">Die kleinste ganze Zahl über ${Math.abs(a - b)} ist <strong>${min}</strong>.</span><br>` +
      `<span class="progress-note">Probe mit c = ${min}: ${Math.max(a, b)} &lt; ${Math.min(a, b)} + ${min} = ${Math.min(a, b) + min} ✓ &nbsp;· ` +
      `Bei c = ${Math.abs(a - b)} läge C genau auf der Strecke AB — die Zirkelbögen würden sich nur berühren.</span>`,
  };
}

function generateAufgabe2() {
  // Gleichschenkliges Dreieck: Basiswinkel ↔ Spitzenwinkel.
  // Der Spitzenwinkel wird gerade gewählt, damit die Basiswinkel ganzzahlig bleiben.
  const nachSpitze = Math.random() < 0.5;
  const basis = randInt(6, 17) * 5; // 30° bis 85°
  const spitze = 180 - 2 * basis;
  return {
    promptHtml: nachSpitze
      ? `In einem <strong>gleichschenkligen</strong> Dreieck beträgt ein <strong>Basiswinkel ${basis}°</strong>. ` +
        `Wie groß ist der Winkel an der <strong>Spitze</strong> (in Grad)?`
      : `In einem <strong>gleichschenkligen</strong> Dreieck beträgt der Winkel an der <strong>Spitze ${spitze}°</strong>. ` +
        `Wie groß ist ein <strong>Basiswinkel</strong> (in Grad)?`,
    correct: nachSpitze ? spitze : basis,
    tolerance: 0.01,
    placeholder: "Winkel in Grad",
    hinweis: (raw, val) => {
      if (val === (nachSpitze ? basis : spitze)) return "Das ist der Winkel, der schon gegeben war.";
      if (nachSpitze && val === 180 - basis) return `Du hast nur <strong>einen</strong> Basiswinkel abgezogen. Im gleichschenkligen Dreieck sind <strong>beide</strong> Basiswinkel ${basis}° groß.`;
      if (!nachSpitze && val === 180 - spitze) return `Das sind <strong>beide</strong> Basiswinkel zusammen. Gefragt ist <em>ein</em> Basiswinkel — also noch durch 2 teilen.`;
      if (val === 90 - basis || val === 90 - spitze) return "Die Winkelsumme im Dreieck ist 180°, nicht 90°.";
      return "";
    },
    musterloesungHtml: nachSpitze
      ? `Im gleichschenkligen Dreieck sind die <strong>beiden Basiswinkel gleich groß</strong> — hier also je ${basis}°.<br>` +
        `Spitze = 180° − ${basis}° − ${basis}° = 180° − ${2 * basis}° = <strong>${spitze}°</strong><br>` +
        `<span class="progress-note">Probe: ${basis}° + ${basis}° + ${spitze}° = 180° ✓ &nbsp;· Warum sind die Basiswinkel gleich? Weil das Dreieck symmetrisch zur Mittelsenkrechten der Basis ist — sie ist zugleich Höhe, Seitenhalbierende und Winkelhalbierende.</span>`
      : `Die beiden Basiswinkel sind gleich groß. Zusammen bleiben ihnen 180° − ${spitze}° = ${180 - spitze}°.<br>` +
        `ein Basiswinkel = ${180 - spitze}° : 2 = <strong>${basis}°</strong><br>` +
        `<span class="progress-note">Probe: ${basis}° + ${basis}° + ${spitze}° = 180° ✓</span>`,
  };
}

function generateAufgabe3() {
  // Wie viele ganzzahlige Längen kommen für die dritte Seite in Frage?
  // Von |a − b| + 1 bis a + b − 1, das sind 2 · min(a, b) − 1 Werte.
  const a = randInt(4, 15);
  const b = randInt(4, 15);
  const von = Math.abs(a - b) + 1;
  const bis = a + b - 1;
  const anzahl = bis - von + 1; // = 2 · min(a, b) − 1
  return {
    promptHtml:
      `Zwei Seiten eines Dreiecks sind <strong>a = ${a} cm</strong> und <strong>b = ${b} cm</strong>. ` +
      `Die dritte Seite c soll eine <em>ganze</em> Zahl von Zentimetern sein. ` +
      `<strong>Wie viele</strong> Werte kommen für c in Frage?`,
    correct: anzahl,
    tolerance: 0.01,
    placeholder: "Anzahl",
    hinweis: (raw, val) => {
      if (val === anzahl + 1) return `Du hast eine Grenze zu viel mitgezählt. Weder c = ${Math.abs(a - b)} noch c = ${a + b} ergibt ein Dreieck — beide Randwerte fallen weg.`;
      if (val === anzahl + 2) return `Beide Randwerte sind mitgezählt. Weder c = ${Math.abs(a - b)} noch c = ${a + b} ergibt ein Dreieck: Dort läge C auf der Geraden AB.`;
      if (val === bis) return "Das ist der <strong>größte</strong> mögliche Wert für c, nicht die Anzahl der Möglichkeiten.";
      if (val === a + b) return "Das ist a + b. Gefragt ist, wie viele ganze Zahlen zwischen den beiden Grenzen liegen.";
      return "";
    },
    musterloesungHtml:
      `Die Dreiecksungleichung grenzt c von beiden Seiten ein:<br>` +
      `&nbsp;&nbsp;c &gt; |${a} − ${b}| = ${Math.abs(a - b)} &nbsp;⇒&nbsp; c ≥ <strong>${von}</strong><br>` +
      `&nbsp;&nbsp;c &lt; ${a} + ${b} = ${a + b} &nbsp;⇒&nbsp; c ≤ <strong>${bis}</strong><br>` +
      `Von ${von} bis ${bis} sind das <span class="du-urteil ja">${bis} − ${von} + 1 = ${anzahl} Werte</span>.<br>` +
      `<span class="progress-note">Kurzform: Es sind immer 2 · (kleinere Seite) − 1 = 2 · ${Math.min(a, b)} − 1 = ${anzahl} Möglichkeiten. ` +
      `Beide Randwerte scheiden aus, weil dort C auf der Geraden AB läge.</span>`,
  };
}

function generateAufgabe4() {
  // Mehrschrittig: Winkelsumme, dann Winkelhalbierende, dann noch einmal Winkelsumme.
  // γ wird gerade gewählt, damit die Halbierung ganzzahlig bleibt.
  // γ zuerst und immer gerade, damit die Halbierung ganzzahlig bleibt. α wird
  // anschließend so begrenzt, dass β = 180° − α − γ echt positiv bleibt.
  const gamma = randInt(5, 12) * 10; // 50° bis 120°
  const alpha = randInt(4, Math.min(16, Math.floor((175 - gamma) / 5))) * 5;
  const beta = 180 - alpha - gamma;
  const halb = gamma / 2;
  const adc = 180 - alpha - halb;
  return {
    promptHtml:
      `Im Dreieck ABC ist <strong>α = ${alpha}°</strong> und <strong>γ = ${gamma}°</strong>. ` +
      `Die <strong>Winkelhalbierende von γ</strong> trifft die Seite AB im Punkt D. ` +
      `Wie groß ist der Winkel <strong>∠ADC</strong> (in Grad)?`,
    correct: adc,
    tolerance: 0.01,
    placeholder: "∠ADC in Grad",
    hinweis: (raw, val) => {
      if (val === halb) return `Das ist der halbe Winkel γ, also ∠ACD = ${halb}°. Der ist nur ein Zwischenschritt — gesucht ist der Winkel bei <strong>D</strong>.`;
      if (val === beta) return `Das ist β, der Winkel bei B — zugleich das Ergebnis, wenn man das <em>ganze</em> γ abzieht. Im Teildreieck ACD liegt aber nur die <strong>Hälfte</strong> von γ.`;
      if (val === alpha + halb) return "Du hast die beiden bekannten Winkel addiert. Gesucht ist, was bis 180° fehlt.";
      return "";
    },
    musterloesungHtml:
      `① Die Winkelhalbierende teilt γ in zwei gleiche Teile:<br>` +
      `&nbsp;&nbsp;∠ACD = ${gamma}° : 2 = <strong>${halb}°</strong><br>` +
      `② Im <strong>Teildreieck ACD</strong> gilt wieder die Winkelsumme 180°:<br>` +
      `&nbsp;&nbsp;∠ADC = 180° − α − ∠ACD = 180° − ${alpha}° − ${halb}° = <strong>${adc}°</strong><br>` +
      `<span class="progress-note">Probe über das andere Teildreieck BCD: β = 180° − ${alpha}° − ${gamma}° = ${beta}°, also ∠BDC = 180° − ${beta}° − ${halb}° = ${180 - beta - halb}°. ` +
      `Und ${adc}° + ${180 - beta - halb}° = 180° ✓ — die beiden Winkel bei D sind Nebenwinkel.</span>`,
  };
}

function initExercises() {
  mountUebungsaufgaben(document.getElementById("exercises-mount"), [
    { schwierigkeit: "einfach", titel: "Aufgabe 1 — Wie kurz darf die dritte Seite sein?", generate: generateAufgabe1 },
    { schwierigkeit: "mittel", titel: "Aufgabe 2 — Gleichschenkliges Dreieck", generate: generateAufgabe2 },
    { schwierigkeit: "schwierig", titel: "Aufgabe 3 — Wie viele Möglichkeiten?", generate: generateAufgabe3 },
    { schwierigkeit: "komplex", titel: "Aufgabe 4 — Winkelhalbierende im Dreieck", generate: generateAufgabe4 },
  ]);
}

// ================= Quizze =================

function initQuizzes() {
  mountQuiz(document.getElementById("quiz-werkzeug"), {
    q: "Wozu darf das Lineal beim Konstruieren benutzt werden?",
    options: [
      "zum Messen von Längen",
      "nur zum Ziehen von Geraden durch zwei Punkte",
      "zum Abtragen von Winkeln",
      "zum Zeichnen von Kreisen",
    ],
    correct: 1,
    explain: "Das Lineal zieht nur Geraden. Gemessen wird beim Konstruieren nicht — Längen werden mit dem Zirkel übertragen, und Kreise zeichnet ohnehin nur der Zirkel.",
  });
  mountQuiz(document.getElementById("quiz-grundkonstruktionen"), {
    q: "Warum liegen die beiden Schnittpunkte der Hilfskreise auf der Mittelsenkrechten von AB?",
    options: [
      "weil sie zufällig dort liegen",
      "weil beide Kreise denselben Radius haben und die Schnittpunkte damit von A und B gleich weit entfernt sind",
      "weil die Kreise gleich groß aussehen",
      "weil die Strecke AB halbiert wurde",
    ],
    correct: 1,
    explain: "Die Mittelsenkrechte ist genau die Menge aller Punkte mit gleichem Abstand zu A und B. Beide Schnittpunkte haben von A und B den Radius als Abstand — deshalb liegen sie zwangsläufig darauf.",
  });
  mountQuiz(document.getElementById("quiz-ungleichung"), {
    q: "Gibt es ein Dreieck mit den Seiten 3 cm, 4 cm und 7 cm?",
    options: [
      "ja, denn 3 + 4 = 7",
      "nein, denn 3 + 4 ist genau 7 — es entsteht nur eine Strecke",
      "ja, es ist rechtwinklig",
      "das hängt von den Winkeln ab",
    ],
    correct: 1,
    explain: "Die Dreiecksungleichung verlangt „echt kleiner“: 7 < 3 + 4 ist falsch, denn 3 + 4 = 7. Die beiden Zirkelbögen berühren sich nur in einem Punkt auf der Strecke — das Dreieck fällt in sich zusammen.",
  });
  mountQuiz(document.getElementById("quiz-kongruenz"), {
    q: "Warum ist WWW kein Kongruenzsatz?",
    options: [
      "weil drei Winkel zu wenige Angaben sind",
      "weil Dreiecke mit gleichen Winkeln zwar dieselbe Form haben, aber verschieden groß sein können",
      "weil die Winkelsumme immer 180° ist",
      "weil man Winkel nicht konstruieren kann",
    ],
    correct: 1,
    explain: "Gleiche Winkel bedeuten gleiche Form, nicht gleiche Größe — solche Dreiecke heißen ähnlich. Dass aus zwei Winkeln der dritte folgt, zeigt außerdem: Es sind gar keine drei unabhängigen Angaben.",
  });
  mountQuiz(document.getElementById("quiz-linien"), {
    q: "Welcher Punkt hat von allen drei Seiten des Dreiecks denselben Abstand?",
    options: [
      "der Umkreismittelpunkt",
      "der Inkreismittelpunkt",
      "der Höhenschnittpunkt",
      "der Schwerpunkt",
    ],
    correct: 1,
    explain: "Der Inkreismittelpunkt ist der Schnittpunkt der Winkelhalbierenden und hat von allen drei Seiten den gleichen Abstand. Der Umkreismittelpunkt hat den gleichen Abstand von allen drei Ecken — Seiten und Ecken nicht verwechseln.",
  });
}

// ================= Start =================

initKonstruktion();
initUngleichung();
initKongruenz();
initBesondereLinien();
initExercises();
initQuizzes();
