// Selbstlernpfad „Flächeninhalte: Dreieck, Parallelogramm, Trapez“ (Klasse 8, Geometrie).
//
// Aufbau wie der Thales-Pfad: Abschnitt, bewegliche Zeichnung, Bilanz, Kontrollfrage.
// Die Übungsaufgaben stehen in flaecheninhalte-aufgaben.js.
//
// Leitgedanke: Es gibt nur EINE Flächenformel — die des Rechtecks. Alles Weitere entsteht
// durch Zerlegen und Umlegen, und genau das zeigen die Zeichnungen. Deshalb bewegt sich in
// jeder Herleitung wirklich etwas: Das abgeschnittene Dreieck wandert, die zweite Kopie
// dreht sich. Ein Standbild könnte behaupten, die Flächen seien gleich; eine Bewegung, bei
// der kein Stück verschwindet und keines dazukommt, zeigt es.
//
// Zu den Zahlen: Gerechnet wird mit den Reglerwerten in Zentimetern, nicht mit
// Bildschirmkoordinaten. Aus Koordinaten käme 15,749999999999998 heraus, und die Bilanz
// behauptete dann etwas anderes als die Formel.
//
// Was hier bewusst NICHT vorkommt: der Satz des Pythagoras und die Quadratwurzel. Beide
// stehen erst in Klasse 9 an. Wo eine schräge Seite als Zahl gebraucht wird, steht deshalb
// „gemessen“ daran — sie wird aus der Zeichnung abgelesen, nicht berechnet.
//
// Durchgehende Farbcodierung: Grundseite blau, Höhe violett, Flächeninhalt grün,
// zweites/umgelegtes Stück orange, Warnung rot.

import { mountUebungsaufgaben as mountUebungsaufgabenBasis } from "../../aufgaben.js?v=1";
import { AUFGABEN } from "./flaecheninhalte-aufgaben.js?v=1";

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
// Deutsche Schreibweise. Gerundet wird VOR der Ausgabe, damit −0,0001 nicht als „−0“ erscheint.
function num(x, digits = 4) {
  const f = Math.pow(10, digits);
  const gerundet = Math.round(x * f) / f;
  return (gerundet === 0 ? 0 : gerundet).toLocaleString("de-DE", { maximumFractionDigits: digits });
}
// „=“ oder „≈“? Entscheidend ist, ob die Anzeige mit der gewählten Stellenzahl den Wert genau
// trifft — nicht, ob er ganzzahlig ist (7,5 ist exakt, 7,4999… ist es nicht).
function zeichen(x, stellen = 2) {
  const f = Math.pow(10, stellen);
  return Math.abs(x - Math.round(x * f) / f) < 1e-12 ? "=" : "≈";
}
function parseFlexibleNumber(raw) {
  if (raw == null) return NaN;
  const s = String(raw).trim().replace(/\s/g, "").replace(/−/g, "-").replace(/\./g, "").replace(",", ".");
  return parseFloat(s);
}
const mountUebungsaufgaben = (container, defs) =>
  mountUebungsaufgabenBasis(container, defs, { parse: parseFlexibleNumber });

// Schreibt einen begrenzten Reglerwert in den Regler zurück. Ein Regler darf nie etwas anderes
// anzeigen als das, womit gerechnet wird.
function begrenzt(id, wert, min, max) {
  const v = Math.min(max, Math.max(min, wert));
  if (v !== wert) document.getElementById(id).value = String(v);
  return v;
}
function reglerZahl(id) {
  return Number(document.getElementById(id).value);
}

const FARBE = {
  grund: "#1d4ed8",     // Grundseite
  hoehe: "#6d28d9",     // Höhe
  flaeche: "#157347",   // Flächeninhalt, umgelegtes Stück
  zweit: "#b3650a",     // zweite Kopie, zweite Grundseite
  warn: "#b3261e",
  hilfe: "#9aa4b1",
};

// ---------- Zeichenbausteine ----------

// Eine Bühne rechnet Zentimeter in Bildpunkte um. Der Nullpunkt liegt unten links,
// y zeigt nach oben — wie im Heft und anders als in SVG.
function buehne(breite, hoehe, ox, oy, skala) {
  const svg = svgEl("svg", {
    viewBox: `0 0 ${breite} ${hoehe}`, width: breite, height: hoehe,
    class: "th-flaeche", preserveAspectRatio: "xMidYMid meet",
  });
  const g = svgEl("g");
  svg.appendChild(g);
  return {
    svg, g, skala,
    P: (x, y) => ({ x: ox + x * skala, y: oy - y * skala }),
  };
}

// Dasselbe, aber die Bühne richtet sich nach dem, was WIRKLICH gezeichnet wird — einschließlich
// der Stellungen, die eine bewegte Kopie unterwegs einnimmt. Ohne das ragte die Kopie bei
// halber Drehung aus dem Bild heraus, und es sähe aus, als wäre sie zerschnitten worden.
//
// Die Höhe der Bühne ergibt sich aus dem Inhalt; die Breite steht fest, damit die Zeichnung
// beim Ziehen an einem Regler nicht seitlich springt.
function buehneAuto(breite, maxHoehe, punkte, { rand = 54, maxSkala = 58 } = {}) {
  const xs = punkte.map((p) => p.x), ys = punkte.map((p) => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const spanX = Math.max(0.5, maxX - minX), spanY = Math.max(0.5, maxY - minY);
  const skala = Math.min(maxSkala, (breite - 2 * rand) / spanX, (maxHoehe - 2 * rand) / spanY);
  const hoehe = Math.round(spanY * skala + 2 * rand);
  const ox = rand + (breite - 2 * rand - spanX * skala) / 2 - minX * skala;
  const oy = hoehe - rand + minY * skala;
  return buehne(breite, hoehe, ox, oy, skala);
}

// Alle Zwischenstellungen einer Drehung um M — gebraucht wird das nur, um die Bühne groß
// genug zu machen, nicht zum Zeichnen.
function drehSpur(punkte, M, schritte = 12) {
  const out = [];
  for (let i = 0; i <= schritte; i++) {
    const w = (Math.PI * i) / schritte;
    const co = Math.cos(w), si = Math.sin(w);
    for (const p of punkte) {
      const dx = p.x - M.x, dy = p.y - M.y;
      out.push({ x: M.x + dx * co - dy * si, y: M.y + dx * si + dy * co });
    }
  }
  return out;
}

function polygon(b, punkte, klasse, strichFarbe, breite = 2.5, extra = {}) {
  const pts = punkte.map((p) => { const q = b.P(p.x, p.y); return `${q.x.toFixed(2)},${q.y.toFixed(2)}`; }).join(" ");
  const e = svgEl("polygon", Object.assign({ points: pts, stroke: strichFarbe || "none", "stroke-width": breite, "stroke-linejoin": "round" }, extra));
  if (klasse) e.setAttribute("class", klasse);
  else e.setAttribute("fill", "none");
  b.g.appendChild(e);
  return e;
}

function strecke(b, a, c, farbe, breite = 2.5, extra = {}) {
  const p = b.P(a.x, a.y), q = b.P(c.x, c.y);
  b.g.appendChild(svgEl("line", Object.assign({
    x1: p.x.toFixed(2), y1: p.y.toFixed(2), x2: q.x.toFixed(2), y2: q.y.toFixed(2),
    stroke: farbe, "stroke-width": breite, "stroke-linecap": "round",
  }, extra)));
}

// Rechter-Winkel-Kästchen im Punkt V, ausgerichtet auf P und Q — in Zentimeterkoordinaten.
function rechterWinkel(b, V, P, Q, farbe, seiteCm = 0.32) {
  const norm = (u) => { const l = Math.hypot(u.x, u.y) || 1; return { x: u.x / l, y: u.y / l }; };
  const d1 = norm({ x: P.x - V.x, y: P.y - V.y });
  const d2 = norm({ x: Q.x - V.x, y: Q.y - V.y });
  const p1 = { x: V.x + d1.x * seiteCm, y: V.y + d1.y * seiteCm };
  const p3 = { x: V.x + d2.x * seiteCm, y: V.y + d2.y * seiteCm };
  const p2 = { x: p1.x + d2.x * seiteCm, y: p1.y + d2.y * seiteCm };
  const pts = [p1, p2, p3].map((p) => { const q = b.P(p.x, p.y); return `${q.x.toFixed(2)},${q.y.toFixed(2)}`; }).join(" ");
  b.g.appendChild(svgEl("polyline", { points: pts, fill: "none", stroke: farbe, "stroke-width": 1.8 }));
}

// Maßbeschriftung an der Mitte einer Strecke, um dx/dy Bildpunkte versetzt.
function mass(b, a, c, text, farbe, dx = 0, dy = 0, klasse = "fl-mass") {
  const p = b.P((a.x + c.x) / 2, (a.y + c.y) / 2);
  b.g.appendChild(svgText(p.x + dx, p.y + dy, text, { class: klasse, fill: farbe }));
}

// Punktmarke samt Namen. Beide stehen in einer Gruppe, die den Namen trägt: Die Prüfung liest
// die Marke, nicht die Beschriftung — sie sitzt versetzt daneben.
function punkt(b, p, name, dx = 0, dy = -10) {
  const q = b.P(p.x, p.y);
  const gruppe = svgEl("g", { class: "th-punkt-gruppe", "data-name": name || "" });
  gruppe.appendChild(svgEl("circle", { cx: q.x.toFixed(2), cy: q.y.toFixed(2), r: 3.5, class: "th-punkt" }));
  if (name) gruppe.appendChild(svgText(q.x + dx, q.y + dy, name, { class: "th-punkt-name" }));
  b.g.appendChild(gruppe);
}

function zeige(mountId, b) {
  const mount = document.getElementById(mountId);
  mount.innerHTML = "";
  mount.appendChild(b.svg);
}

// Flächeninhalt eines Polygons über die Gaußsche Trapezformel — gebraucht wird er nur zur
// SELBSTKONTROLLE der Zeichnung, nicht für die Bilanz. Die rechnet aus den Reglerwerten.
function polygonFlaeche(punkte) {
  let s = 0;
  for (let i = 0; i < punkte.length; i++) {
    const a = punkte[i], c = punkte[(i + 1) % punkte.length];
    s += a.x * c.y - c.x * a.y;
  }
  return Math.abs(s) / 2;
}

// ================= 1. Die Grundidee: Scherung =================

const SC_W = 580, SC_H = 300;   // SC_H ist die Obergrenze, nicht die feste Höhe

function renderScherung() {
  const g = reglerZahl("sc-g");
  const h = reglerZahl("sc-h");
  const s = reglerZahl("sc-s");
  document.getElementById("sc-g-anzeige").textContent = num(g) + " cm";
  document.getElementById("sc-h-anzeige").textContent = num(h) + " cm";
  document.getElementById("sc-s-anzeige").textContent = num(s) + " cm";

  const A = { x: 0, y: 0 }, B = { x: g, y: 0 };
  const C = { x: g + s, y: h }, D = { x: s, y: h };
  const R2 = { x: g, y: h }, R1 = { x: 0, y: h };
  const b = buehneAuto(SC_W, SC_H, [A, B, C, D, R1, R2]);

  // Das Ausgangsrechteck bleibt blass stehen: Nur im Vergleich sieht man, dass sich die
  // Fläche NICHT ändert, während die Figur schief wird.
  polygon(b, [A, B, R2, R1], null, FARBE.hilfe, 1.6, { "stroke-dasharray": "5 4", fill: "none" });

  polygon(b, [A, B, C, D], "fl-flaeche-fuell", FARBE.grund, 2.6);

  // Höhe: das Lot von D auf die Grundgerade.
  const F = { x: s, y: 0 };
  strecke(b, F, D, FARBE.hoehe, 2.2, { "stroke-dasharray": "6 4" });
  rechterWinkel(b, F, A, D, FARBE.hoehe);
  mass(b, F, D, "h = " + num(h) + " cm", FARBE.hoehe, 34, 4);

  strecke(b, A, B, FARBE.grund, 3.4);
  mass(b, A, B, "g = " + num(g) + " cm", FARBE.grund, 0, 22);

  // Die schräge Seite: Ihre Länge wird gemessen, nicht gerechnet — dafür bräuchte man den
  // Satz des Pythagoras, und der kommt erst in Klasse 9.
  const schraeg = Math.hypot(s, h);
  mass(b, A, D, "b", FARBE.zweit, -14, 0);

  punkt(b, A, "A", -10, 16);
  punkt(b, B, "B", 10, 16);
  punkt(b, C, "C", 10, -8);
  punkt(b, D, "D", -10, -8);

  zeige("sc-mount", b);

  const flaeche = g * h;
  document.getElementById("sc-bilanz").innerHTML =
    `Grundseite <span class="wc">g = ${num(g)} cm</span> &nbsp;·&nbsp; Höhe <span class="wr">h = ${num(h)} cm</span> &nbsp;·&nbsp; Versatz ${num(s)} cm<br>` +
    `Flächeninhalt: <span class="wa">A = g · h = ${num(g)} cm · ${num(h)} cm = ${num(flaeche)} cm²</span> — bei jedem Versatz derselbe.<br>` +
    `Schräge Seite <span class="wb">b ${zeichen(schraeg, 2)} ${num(schraeg, 2)} cm</span> (an der Zeichnung gemessen) — sie wächst mit dem Versatz.`;

  document.getElementById("sc-text").textContent =
    s === 0
      ? "Versatz 0: Die Figur ist noch das Rechteck. Schiebe die obere Seite nach rechts."
      : `Die obere Seite ist um ${num(s)} cm verschoben. Links fehlt genau das Dreieck, das rechts dazugekommen ist — deshalb bleibt die Fläche ${num(flaeche)} cm². Die Seite b ist dagegen von ${num(h)} cm auf ${num(schraeg, 2)} cm gewachsen.`;
}

// ================= 2. Das Parallelogramm =================

const PA_W = 620, PA_H = 320;

function renderParallelogramm() {
  const g = reglerZahl("pa-g");
  const h = reglerZahl("pa-h");
  // Umgelegt wird das Dreieck links vom Höhenfußpunkt. Das gelingt in einem Zug nur, solange
  // der Versatz die Grundseite nicht übertrifft — sonst müsste man mehrfach schneiden.
  const s = begrenzt("pa-s", reglerZahl("pa-s"), 0, g);
  const t = reglerZahl("pa-t") / 100;
  const zweite = document.getElementById("pa-zweite").checked;
  document.getElementById("pa-g-anzeige").textContent = num(g) + " cm";
  document.getElementById("pa-h-anzeige").textContent = num(h) + " cm";
  document.getElementById("pa-s-anzeige").textContent = num(s) + " cm";
  document.getElementById("pa-t-anzeige").textContent = Math.round(t * 100) + " %";

  const A = { x: 0, y: 0 }, B = { x: g, y: 0 };
  const C = { x: g + s, y: h }, D = { x: s, y: h };
  const F = { x: s, y: 0 };                       // Höhenfußpunkt von D
  const b = buehneAuto(PA_W, PA_H, [A, B, C, D, F, { x: g + s, y: 0 }]);

  // Das Zielrechteck blass im Hintergrund — es zeigt, wohin die Verwandlung führt.
  if (t > 0) {
    polygon(b, [F, { x: g + s, y: 0 }, C, D], null, FARBE.hilfe, 1.5, { "stroke-dasharray": "5 4", fill: "none" });
  }

  // Das Reststück bleibt liegen: F, B, C, D.
  polygon(b, [F, B, C, D], "fl-flaeche-fuell", FARBE.grund, 2.4);

  // Das abgeschnittene Dreieck A–F–D wandert um t · g nach rechts.
  const dx = t * g;
  const dreieck = [A, F, D].map((p) => ({ x: p.x + dx, y: p.y }));
  polygon(b, dreieck, "fl-flaeche-teil", FARBE.flaeche, 2.4);

  // Die Schnittkante, solange noch nicht umgelegt ist.
  if (t < 1) strecke(b, F, D, FARBE.flaeche, 2, { "stroke-dasharray": "3 3" });

  // Höhe und Grundseite.
  strecke(b, A, B, FARBE.grund, 3.2);
  mass(b, A, B, "g = " + num(g) + " cm", FARBE.grund, 0, 24);
  const hoeheUnten = { x: s + dx, y: 0 }, hoeheOben = { x: s + dx, y: h };
  strecke(b, hoeheUnten, hoeheOben, FARBE.hoehe, 2.2, { "stroke-dasharray": "6 4" });
  rechterWinkel(b, hoeheUnten, { x: hoeheUnten.x + 1, y: 0 }, hoeheOben, FARBE.hoehe);
  mass(b, hoeheUnten, hoeheOben, "h = " + num(h) + " cm", FARBE.hoehe, 36, 4);

  if (zweite && t === 0) {
    // Die zweite Grundseite AD mit der zugehörigen Höhe. Beide Längen werden GEMESSEN;
    // zum Rechnen bräuchte man den Satz des Pythagoras (Klasse 9).
    strecke(b, A, D, FARBE.zweit, 3.2);
    const bSeite = Math.hypot(s, h);
    // Fußpunkt des Lots von B auf die Gerade AD.
    const lam = (B.x * s + B.y * h) / (s * s + h * h);
    const L = { x: lam * s, y: lam * h };
    strecke(b, B, L, FARBE.zweit, 2, { "stroke-dasharray": "6 4" });
    rechterWinkel(b, L, A, B, FARBE.zweit);
    mass(b, A, D, "b", FARBE.zweit, -16, -4);
    mass(b, B, L, "h_b", FARBE.zweit, 12, -6);
  }

  punkt(b, A, "A", -10, 16);
  punkt(b, B, "B", 10, 16);
  punkt(b, C, "C", 10, -8);
  punkt(b, D, "D", -10, -8);

  zeige("pa-mount", b);

  const flaeche = g * h;
  const bSeite = Math.hypot(s, h);
  const hb = bSeite > 0 ? flaeche / bSeite : 0;
  let bilanz =
    `<span class="wc">g = ${num(g)} cm</span> &nbsp;·&nbsp; <span class="wr">h = ${num(h)} cm</span><br>` +
    `<span class="wa">A = g · h = ${num(g)} · ${num(h)} = ${num(flaeche)} cm²</span>`;
  if (zweite && t === 0) {
    bilanz += `<br><span class="wb">b ${zeichen(bSeite, 2)} ${num(bSeite, 2)} cm</span> (gemessen) &nbsp;·&nbsp; ` +
      `<span class="wb">h<sub>b</sub> ${zeichen(hb, 2)} ${num(hb, 2)} cm</span> &nbsp;⟹&nbsp; ` +
      `<span class="wb">b · h<sub>b</sub> ${zeichen(bSeite * hb, 2)} ${num(bSeite * hb, 2)} cm²</span> — derselbe Flächeninhalt.`;
  }
  document.getElementById("pa-bilanz").innerHTML = bilanz;

  document.getElementById("pa-text").textContent =
    zweite && t > 0
      ? "Die zweite Grundseite wird nur am unzerschnittenen Parallelogramm gezeigt — stelle „Umlegen“ dafür auf 0 zurück."
      : t === 0
      ? "Schneide links entlang der Höhe ab und schiebe das Dreieck mit dem Regler nach rechts."
      : t < 1
        ? `Das Dreieck ist auf halbem Weg. Es verändert dabei weder Form noch Größe — es wird nur verschoben.`
        : `Fertig: Aus dem Parallelogramm ist ein Rechteck mit den Seiten ${num(g)} cm und ${num(h)} cm geworden. Kein Stück ist verschwunden, keines dazugekommen — also haben beide Figuren denselben Flächeninhalt.`;
}

// ================= 3. Das Dreieck =================

const DR_W = 660, DR_H = 420;

function renderDreieck() {
  const g = reglerZahl("dr-g");
  const h = reglerZahl("dr-h");
  const cx = reglerZahl("dr-cx");
  const t = reglerZahl("dr-t") / 100;
  document.getElementById("dr-g-anzeige").textContent = num(g) + " cm";
  document.getElementById("dr-h-anzeige").textContent = num(h) + " cm";
  document.getElementById("dr-cx-anzeige").textContent = num(cx) + " cm";
  document.getElementById("dr-t-anzeige").textContent = Math.round(t * 180) + "°";

  const A = { x: 0, y: 0 }, B = { x: g, y: 0 }, C = { x: cx, y: h };

  // Die Kopie dreht sich um den Mittelpunkt von BC. Nach 180° liegt A auf A' = B + C − A,
  // und aus beiden Dreiecken zusammen ist ein Parallelogramm geworden.
  const M = { x: (B.x + C.x) / 2, y: (B.y + C.y) / 2 };
  const b = buehneAuto(DR_W, DR_H, [A, B, C, ...drehSpur([A, B, C], M)]);
  const winkel = t * Math.PI;
  const dreh = (p) => {
    const dx = p.x - M.x, dy = p.y - M.y;
    const co = Math.cos(winkel), si = Math.sin(winkel);
    return { x: M.x + dx * co - dy * si, y: M.y + dx * si + dy * co };
  };
  const kopie = [A, B, C].map(dreh);

  // Das Zielparallelogramm blass, sobald die Drehung begonnen hat.
  const Astrich = { x: B.x + C.x - A.x, y: B.y + C.y - A.y };
  if (t > 0) polygon(b, [A, B, Astrich, C], null, FARBE.hilfe, 1.5, { "stroke-dasharray": "5 4", fill: "none" });

  polygon(b, kopie, "fl-flaeche-zweit", FARBE.zweit, 2.2);
  polygon(b, [A, B, C], "fl-flaeche-fuell", FARBE.grund, 2.6);

  // Höhe auf AB.
  const F = { x: cx, y: 0 };
  strecke(b, F, C, FARBE.hoehe, 2.2, { "stroke-dasharray": "6 4" });
  rechterWinkel(b, F, { x: F.x + 1, y: 0 }, C, FARBE.hoehe);
  mass(b, F, C, "h = " + num(h) + " cm", FARBE.hoehe, 36, 4);

  strecke(b, A, B, FARBE.grund, 3.2);
  mass(b, A, B, "g = " + num(g) + " cm", FARBE.grund, 0, 24);

  // Der Drehpunkt ist die Mitte von BC — dort berühren sich die beiden Dreiecke immer.
  strecke(b, B, C, FARBE.flaeche, 1.8, { "stroke-dasharray": "4 3" });
  punkt(b, M, "M", 14, -6);

  punkt(b, A, "A", -10, 16);
  punkt(b, B, "B", 10, 16);
  punkt(b, C, "C", 0, -10);

  zeige("dr-mount", b);

  const flaeche = (g * h) / 2;
  document.getElementById("dr-bilanz").innerHTML =
    `<span class="wc">g = ${num(g)} cm</span> &nbsp;·&nbsp; <span class="wr">h = ${num(h)} cm</span><br>` +
    `Beide Dreiecke zusammen bilden ein Parallelogramm mit derselben Grundseite und derselben Höhe:<br>` +
    `<span class="wb">2 · A = g · h = ${num(g)} · ${num(h)} = ${num(g * h)} cm²</span> &nbsp;⟹&nbsp; ` +
    `<span class="wa">A = ½ · g · h = ${num(flaeche)} cm²</span>`;

  document.getElementById("dr-text").textContent =
    t === 0
      ? "Die zweite Kopie liegt noch genau auf dem Dreieck. Drehe sie mit dem Regler um den Punkt M."
      : t < 1
        ? `Die Kopie ist um ${Math.round(t * 180)}° gedreht. Der Punkt M bleibt dabei fest — er ist die Mitte der Seite BC.`
        : `Nach der halben Drehung passen beide Dreiecke lückenlos zu einem Parallelogramm zusammen. Es hat dieselbe Grundseite ${num(g)} cm und dieselbe Höhe ${num(h)} cm — also ist das Dreieck halb so groß.`;
}

// ---------- 3b. Welche Höhe gehört zu welcher Grundseite? ----------

const GH_W = 560, GH_H = 300;
// Feste Zahlen statt Reglern: Hier geht es nicht um die Größe der Figur, sondern darum, dass
// DREI verschiedene Rechnungen dieselbe Zahl ergeben. Dafür muss die Figur stillstehen.
const GH_A = { x: 0, y: 0 }, GH_B = { x: 8, y: 0 }, GH_C = { x: 2.5, y: 4.5 };

function renderGrundseite() {
  const wahl = document.querySelector('input[name="gh-seite"]:checked').value;
  const ecken = { A: GH_A, B: GH_B, C: GH_C };
  // Zu jeder Wahl: die Grundseite (zwei Ecken) und die Ecke, aus der das Lot fällt.
  const faelle = {
    c: { von: "A", bis: "B", spitze: "C", name: "c = AB" },
    a: { von: "B", bis: "C", spitze: "A", name: "a = BC" },
    b: { von: "C", bis: "A", spitze: "B", name: "b = CA" },
  };
  const f = faelle[wahl];
  const P = ecken[f.von], Q = ecken[f.bis], S = ecken[f.spitze];

  // Der Höhenfußpunkt kann außerhalb der Seite liegen; die Bühne muss ihn mitnehmen.
  const ux0 = Q.x - P.x, uy0 = Q.y - P.y;
  const lam0 = ((S.x - P.x) * ux0 + (S.y - P.y) * uy0) / (ux0 * ux0 + uy0 * uy0);
  const L0 = { x: P.x + lam0 * ux0, y: P.y + lam0 * uy0 };
  const b = buehneAuto(GH_W, GH_H, [GH_A, GH_B, GH_C, L0]);

  polygon(b, [GH_A, GH_B, GH_C], "fl-flaeche-fuell", "#6b7280", 2);

  // Grundseite hervorheben.
  strecke(b, P, Q, FARBE.grund, 3.6);

  // Lot von S auf die Gerade PQ. Der Fußpunkt darf außerhalb der Strecke liegen — dann wird
  // die Gerade verlängert gezeichnet, genau wie im Heft.
  const ux = Q.x - P.x, uy = Q.y - P.y;
  const lam = ((S.x - P.x) * ux + (S.y - P.y) * uy) / (ux * ux + uy * uy);
  const L = { x: P.x + lam * ux, y: P.y + lam * uy };
  if (lam < 0 || lam > 1) {
    const e1 = { x: P.x + Math.min(0, lam - 0.08) * ux, y: P.y + Math.min(0, lam - 0.08) * uy };
    const e2 = { x: P.x + Math.max(1, lam + 0.08) * ux, y: P.y + Math.max(1, lam + 0.08) * uy };
    strecke(b, e1, e2, FARBE.hilfe, 1.4, { "stroke-dasharray": "5 4" });
  }
  strecke(b, S, L, FARBE.hoehe, 2.4, { "stroke-dasharray": "6 4" });
  rechterWinkel(b, L, P, S, FARBE.hoehe);

  const laenge = Math.hypot(ux, uy);
  const hoehe = Math.hypot(S.x - L.x, S.y - L.y);
  mass(b, P, Q, f.name, FARBE.grund, 0, lam >= 0 && lam <= 1 && wahl === "c" ? 24 : -14);
  mass(b, S, L, "h_" + wahl, FARBE.hoehe, 24, 0);

  punkt(b, GH_A, "A", -10, 16);
  punkt(b, GH_B, "B", 12, 16);
  punkt(b, GH_C, "C", 0, -10);

  zeige("gh-mount", b);

  // Der Flächeninhalt wird EINMAL exakt aus den Koordinaten bestimmt; die drei Zeilen zeigen
  // dann, dass jedes Paar aus Seite und zugehöriger Höhe dieselbe Zahl liefert.
  const A = polygonFlaeche([GH_A, GH_B, GH_C]);
  const seiten = [
    { k: "c", l: Math.hypot(GH_B.x - GH_A.x, GH_B.y - GH_A.y) },
    { k: "a", l: Math.hypot(GH_C.x - GH_B.x, GH_C.y - GH_B.y) },
    { k: "b", l: Math.hypot(GH_A.x - GH_C.x, GH_A.y - GH_C.y) },
  ];
  document.getElementById("gh-bilanz").innerHTML =
    seiten.map((s) => {
      const hs = (2 * A) / s.l;
      const aktiv = s.k === wahl;
      return `${aktiv ? "<strong>" : ""}½ · <span class="wc">${s.k} ${zeichen(s.l, 2)} ${num(s.l, 2)} cm</span> · ` +
        `<span class="wr">h<sub>${s.k}</sub> ${zeichen(hs, 2)} ${num(hs, 2)} cm</span> = ` +
        `<span class="wa">${num(A, 2)} cm²</span>${aktiv ? "</strong>" : ""}`;
    }).join("<br>") +
    `<br><span class="progress-note">Alle Längen sind an der Zeichnung gemessen. Drei verschiedene Rechnungen, ein Ergebnis: ` +
    `<span class="wa">A = ${num(A, 2)} cm²</span>.</span>`;

  document.getElementById("gh-text").textContent =
    wahl === "c"
      ? "Zur Seite c gehört die Höhe von C aus. Ihr Fußpunkt liegt auf der Strecke AB."
      : wahl === "a"
        ? "Zur Seite a gehört die Höhe von A aus — sie steht senkrecht auf BC, nicht auf der waagerechten Seite."
        : "Zur Seite b gehört die Höhe von B aus. Hier liegt der Fußpunkt außerhalb der Strecke; dann wird die Seite als Gerade verlängert.";
}

// ================= 4. Das Trapez =================

const TZ_W = 680, TZ_H = 430;

function renderTrapez() {
  const a = reglerZahl("tz-a");
  // Die obere Seite bleibt kürzer als die untere: Sonst wären „a“ und „c“ vertauscht, und
  // die Formel stünde mit den Namen über Kreuz da.
  const c = begrenzt("tz-c", reglerZahl("tz-c"), 0.5, a);
  const h = reglerZahl("tz-h");
  const t = reglerZahl("tz-t") / 100;
  const mitte = document.getElementById("tz-mitte").checked;
  document.getElementById("tz-a-anzeige").textContent = num(a) + " cm";
  document.getElementById("tz-c-anzeige").textContent = num(c) + " cm";
  document.getElementById("tz-h-anzeige").textContent = num(h) + " cm";
  document.getElementById("tz-t-anzeige").textContent = Math.round(t * 180) + "°";

  // Das Trapez steht symmetrisch genug, dass die gedrehte Kopie daneben Platz hat.
  const versatz = Math.min(1.2, (a - c) / 2);
  const A = { x: 0, y: 0 }, B = { x: a, y: 0 };
  const C = { x: versatz + c, y: h }, D = { x: versatz, y: h };

  // Die Kopie dreht sich um den Mittelpunkt des rechten Schenkels BC.
  const M = { x: (B.x + C.x) / 2, y: (B.y + C.y) / 2 };
  const b = buehneAuto(TZ_W, TZ_H, [
    A, B, C, D, { x: a + c, y: 0 }, { x: versatz + c + a, y: h },
    ...drehSpur([A, B, C, D], M),
  ]);
  const winkel = t * Math.PI;
  const dreh = (p) => {
    const dx = p.x - M.x, dy = p.y - M.y;
    const co = Math.cos(winkel), si = Math.sin(winkel);
    return { x: M.x + dx * co - dy * si, y: M.y + dx * si + dy * co };
  };
  const kopie = [A, B, C, D].map(dreh);

  if (t > 0) {
    // Das Zielparallelogramm: Grundseite a + c, Höhe h.
    const Z = [{ x: 0, y: 0 }, { x: a + c, y: 0 }, { x: versatz + c + a, y: h }, { x: versatz, y: h }];
    polygon(b, Z, null, FARBE.hilfe, 1.5, { "stroke-dasharray": "5 4", fill: "none" });
  }

  polygon(b, kopie, "fl-flaeche-zweit", FARBE.zweit, 2.2);
  polygon(b, [A, B, C, D], "fl-flaeche-fuell", FARBE.grund, 2.6);

  // Höhe.
  const F = { x: versatz, y: 0 };
  strecke(b, F, D, FARBE.hoehe, 2.2, { "stroke-dasharray": "6 4" });
  rechterWinkel(b, F, { x: F.x + 1, y: 0 }, D, FARBE.hoehe);
  // Auf 30 % der Höhe statt auf 50 %: Dort liegt bei eingeblendeter Mittellinie nichts.
  mass(b, F, { x: F.x, y: h * 0.6 }, "h = " + num(h) + " cm", FARBE.hoehe, 34, 4);

  strecke(b, A, B, FARBE.grund, 3.2);
  mass(b, A, B, "a = " + num(a) + " cm", FARBE.grund, 0, 24);
  strecke(b, D, C, FARBE.grund, 3.2);
  mass(b, D, C, "c = " + num(c) + " cm", FARBE.grund, 0, -12);

  if (mitte) {
    // Die Mittellinie verbindet die Mitten der beiden Schenkel. Ihre Länge ist das Mittel
    // von a und c — damit wird aus A = ½ · (a + c) · h die Rechteckformel A = m · h.
    const m1 = { x: (A.x + D.x) / 2, y: h / 2 };
    const m2 = { x: (B.x + C.x) / 2, y: h / 2 };
    strecke(b, m1, m2, FARBE.flaeche, 2.6, { "stroke-dasharray": "8 4" });
    mass(b, m1, m2, "m = " + num((a + c) / 2) + " cm", FARBE.flaeche, 0, -8);
  }

  strecke(b, B, C, FARBE.flaeche, 1.6, { "stroke-dasharray": "4 3" });
  punkt(b, M, "M", 16, -4);
  punkt(b, A, "A", -10, 16);
  punkt(b, B, "B", 10, 16);
  punkt(b, C, "C", 10, -8);
  punkt(b, D, "D", -10, -8);

  zeige("tz-mount", b);

  const flaeche = ((a + c) * h) / 2;
  const m = (a + c) / 2;
  let bilanz =
    `<span class="wc">a = ${num(a)} cm</span> &nbsp;·&nbsp; <span class="wc">c = ${num(c)} cm</span> &nbsp;·&nbsp; <span class="wr">h = ${num(h)} cm</span><br>` +
    `Beide Trapeze zusammen bilden ein Parallelogramm mit der Grundseite <span class="wb">a + c = ${num(a + c)} cm</span>:<br>` +
    `<span class="wb">2 · A = (a + c) · h = ${num(a + c)} · ${num(h)} = ${num((a + c) * h)} cm²</span> &nbsp;⟹&nbsp; ` +
    `<span class="wa">A = ½ · (a + c) · h = ${num(flaeche)} cm²</span>`;
  if (mitte) {
    bilanz += `<br><span class="wa">Mittellinie m = (a + c) : 2 = ${num(m)} cm</span> &nbsp;⟹&nbsp; ` +
      `A = m · h = ${num(m)} · ${num(h)} = ${num(m * h)} cm² — dieselbe Zahl, gerechnet wie beim Rechteck.`;
  }
  document.getElementById("tz-bilanz").innerHTML = bilanz;

  document.getElementById("tz-text").textContent =
    t === 0
      ? "Die zweite Kopie liegt noch auf dem Trapez. Drehe sie um den Punkt M — die Mitte des rechten Schenkels."
      : t < 1
        ? `Die Kopie ist um ${Math.round(t * 180)}° gedreht. Achte darauf, wie die kurze Seite c nach unten wandert und sich dort an a anschließt.`
        : `Zusammen ergeben beide Trapeze ein Parallelogramm. Unten liegen jetzt a und c hintereinander: ${num(a)} cm + ${num(c)} cm = ${num(a + c)} cm. Die Höhe ist unverändert ${num(h)} cm.`;
}

// ================= 5. Zusammenschau =================

const ZS_W = 600, ZS_H = 300;

function renderZusammenschau() {
  const a = reglerZahl("zs-a");
  const h = reglerZahl("zs-h");
  const c = begrenzt("zs-c", reglerZahl("zs-c"), 0, a);
  document.getElementById("zs-a-anzeige").textContent = num(a) + " cm";
  document.getElementById("zs-h-anzeige").textContent = num(h) + " cm";
  document.getElementById("zs-c-anzeige").textContent = num(c) + " cm";

  const versatz = 1.5;
  const A = { x: 0, y: 0 }, B = { x: a, y: 0 };
  const C = { x: versatz + c, y: h }, D = { x: versatz, y: h };
  // Bei c = 0 fallen C und D zusammen — aus dem Trapez ist ein Dreieck geworden.
  const ecken = c === 0 ? [A, B, D] : [A, B, C, D];

  const b = buehneAuto(ZS_W, ZS_H, [A, B, C, D]);

  polygon(b, ecken, "fl-flaeche-fuell", FARBE.grund, 2.6);

  const F = { x: versatz, y: 0 };
  strecke(b, F, D, FARBE.hoehe, 2.2, { "stroke-dasharray": "6 4" });
  rechterWinkel(b, F, { x: F.x + 1, y: 0 }, D, FARBE.hoehe);
  mass(b, F, D, "h = " + num(h) + " cm", FARBE.hoehe, 34, 4);

  strecke(b, A, B, FARBE.grund, 3.2);
  mass(b, A, B, "a = " + num(a) + " cm", FARBE.grund, 0, 24);
  if (c > 0) {
    strecke(b, D, C, FARBE.grund, 3.2);
    mass(b, D, C, "c = " + num(c) + " cm", FARBE.grund, 0, -12);
  } else {
    mass(b, D, D, "c = 0", FARBE.grund, 0, -14);
  }

  punkt(b, A, "A", -10, 16);
  punkt(b, B, "B", 10, 16);
  if (c > 0) punkt(b, C, "C", 10, -8);
  punkt(b, D, "D", -10, -8);

  zeige("zs-mount", b);

  const flaeche = ((a + c) * h) / 2;
  const fall = c === 0 ? "dreieck" : Math.abs(c - a) < 1e-9 ? "parallelogramm" : "trapez";

  document.getElementById("zs-bilanz").innerHTML =
    `<span class="wa">A = ½ · (a + c) · h = ½ · (${num(a)} + ${num(c)}) · ${num(h)} = ${num(flaeche)} cm²</span>`;

  const liste = document.getElementById("zs-faelle");
  liste.innerHTML = "";
  const faelle = [
    { k: "dreieck", html: `<strong>c = 0 — Dreieck:</strong> ½ · (a + 0) · h = <strong>½ · a · h</strong>` },
    { k: "trapez", html: `<strong>0 &lt; c &lt; a — Trapez:</strong> <strong>½ · (a + c) · h</strong>` },
    { k: "parallelogramm", html: `<strong>c = a — Parallelogramm:</strong> ½ · (a + a) · h = ½ · 2a · h = <strong>a · h</strong>` },
  ];
  for (const f of faelle) {
    liste.appendChild(el("li", { class: f.k === fall ? "aktiv" : "", html: f.html }));
  }

  document.getElementById("zs-text").textContent =
    fall === "dreieck"
      ? `Die obere Seite ist auf 0 geschrumpft: Aus dem Trapez ist ein Dreieck geworden, und die Trapezformel wird zu ½ · a · h = ${num(flaeche)} cm².`
      : fall === "parallelogramm"
        ? `Beide parallelen Seiten sind gleich lang: Aus dem Trapez ist ein Parallelogramm geworden, und die Trapezformel wird zu a · h = ${num(flaeche)} cm².`
        : `Ein echtes Trapez: ${num(c)} cm oben, ${num(a)} cm unten. Der Flächeninhalt liegt zwischen dem des Dreiecks (${num((a * h) / 2)} cm²) und dem des Parallelogramms (${num(a * h)} cm²).`;
}

// ================= Kontrollfragen =================

function mountQuiz(container, { q, options, correct, explain }) {
  container.innerHTML = "";
  container.appendChild(el("p", { class: "quiz-q" }, "❓ " + q));
  const optWrap = el("div", { class: "quiz-options" });
  const feedback = el("div", { class: "quiz-feedback" });
  options.forEach((optText, i) => {
    const btn = el("button", { type: "button", class: "quiz-opt" }, optText);
    btn.addEventListener("click", () => {
      [...optWrap.children].forEach((x) => x.classList.remove("correct", "wrong"));
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

function initQuizzes() {
  mountQuiz(document.getElementById("quiz-scherung"), {
    q: "Ein Rechteck mit den Seiten 6 cm und 4 cm wird zu einem Parallelogramm geschert: Die obere Seite wandert um 5 cm nach rechts, die Höhe bleibt 4 cm. Was ändert sich?",
    options: [
      "Beides bleibt gleich — Scheren ändert gar nichts",
      "Der Flächeninhalt wird größer, weil die Figur breiter aussieht",
      "Der Umfang wird größer, der Flächeninhalt bleibt 24 cm²",
      "Der Flächeninhalt wird kleiner, weil die Figur flacher wirkt",
    ],
    correct: 2,
    explain:
      "Beim Scheren verschwindet links genau das Dreieck, das rechts dazukommt — der Flächeninhalt bleibt deshalb 6 cm · 4 cm = 24 cm². Die schrägen Seiten werden dabei aber länger als die ursprünglichen 4 cm, und damit wächst der Umfang. Fläche und Umfang sind zwei verschiedene Größen; die eine lässt sich verändern, ohne die andere anzutasten.",
  });

  mountQuiz(document.getElementById("quiz-parallelogramm"), {
    q: "Ein Parallelogramm hat die Seiten 8 cm und 5 cm. Wie groß ist sein Flächeninhalt?",
    options: [
      "40 cm², denn A = 8 cm · 5 cm",
      "20 cm², denn A = ½ · 8 cm · 5 cm",
      "26 cm², denn das ist der halbe Umfang",
      "Das lässt sich noch nicht sagen — es fehlt eine Höhe",
    ],
    correct: 3,
    explain:
      "In der Formel A = g · h steht neben der Grundseite die zugehörige HÖHE — der senkrechte Abstand der beiden parallelen Seiten. Die zweite Seite ist nicht die Höhe: Sie ist genau dann gleich lang, wenn das Parallelogramm ein Rechteck ist. Mit 8 cm und 5 cm als Seiten kann der Flächeninhalt jeden Wert zwischen fast 0 cm² und 40 cm² annehmen, je nachdem, wie schief die Figur steht.",
  });

  mountQuiz(document.getElementById("quiz-dreieck"), {
    q: "Warum steht in der Dreiecksformel der Faktor ½?",
    options: [
      "Weil ein Dreieck nur drei statt vier Ecken hat",
      "Weil zwei gleiche Dreiecke zusammen ein Parallelogramm mit derselben Grundseite und Höhe ergeben",
      "Weil die Höhe im Dreieck immer halb so lang ist wie die Grundseite",
      "Weil man den Flächeninhalt bei schiefen Figuren grundsätzlich halbiert",
    ],
    correct: 1,
    explain:
      "Dreht man eine Kopie des Dreiecks um 180° um die Mitte einer Seite, so passen beide lückenlos zu einem Parallelogramm zusammen. Dieses hat dieselbe Grundseite g und dieselbe Höhe h, sein Flächeninhalt ist also g · h. Weil es aus zwei deckungsgleichen Dreiecken besteht, hat ein einzelnes davon den halben Inhalt: A = ½ · g · h.",
  });

  mountQuiz(document.getElementById("quiz-hoehe"), {
    q: "In einem Dreieck ist die Seite a = 6 cm lang, die zugehörige Höhe h_a = 4 cm. Die Seite b ist 8 cm lang. Wie lang ist h_b?",
    options: [
      "4 cm — die Höhe ist immer dieselbe",
      "6 cm",
      "3 cm",
      "Das lässt sich ohne Zeichnung nicht sagen",
    ],
    correct: 2,
    explain:
      "Der Flächeninhalt ist ½ · 6 cm · 4 cm = 12 cm² — eine Eigenschaft des Dreiecks, nicht der gewählten Seite. Dieselbe Fläche noch einmal über b gelesen: 12 cm² = ½ · 8 cm · h_b, also h_b = 24 cm² : 8 cm = 3 cm. Zur längeren Seite gehört die kürzere Höhe: Das Produkt aus Seite und zugehöriger Höhe ist bei allen drei Seiten dasselbe.",
  });

  mountQuiz(document.getElementById("quiz-trapez"), {
    q: "Ein Trapez hat die parallelen Seiten a = 9 cm und c = 5 cm und die Höhe h = 4 cm. Wie groß ist sein Flächeninhalt?",
    options: [
      "56 cm²",
      "28 cm²",
      "45 cm²",
      "18 cm²",
    ],
    correct: 1,
    explain:
      "A = ½ · (a + c) · h = ½ · (9 cm + 5 cm) · 4 cm = ½ · 14 cm · 4 cm = 28 cm². Die 56 cm² wären das Parallelogramm aus beiden Trapezen — das Halbieren fehlt. Anschaulich: Die Mittellinie ist m = (9 + 5) : 2 = 7 cm lang, und das Trapez ist genauso groß wie ein Rechteck mit 7 cm und 4 cm.",
  });

  mountQuiz(document.getElementById("quiz-zusammenschau"), {
    q: "Warum ist die Dreiecksformel ein Sonderfall der Trapezformel?",
    options: [
      "Weil jedes Dreieck genau ein halbes Trapez ist",
      "Weil beide Formeln zufällig denselben Faktor ½ enthalten",
      "Gar nicht — Dreieck und Trapez haben nichts miteinander zu tun",
      "Weil ein Dreieck ein Trapez mit c = 0 ist: ½ · (a + 0) · h = ½ · a · h",
    ],
    correct: 3,
    explain:
      "Lässt man die obere Seite c eines Trapezes auf 0 schrumpfen, so fallen ihre beiden Endpunkte zu einer Spitze zusammen: Das Trapez wird zum Dreieck. In der Formel wird aus ½ · (a + c) · h dann ½ · (a + 0) · h = ½ · a · h. Umgekehrt wird für c = a daraus ½ · 2a · h = a · h, die Parallelogrammformel. Eine Formel, drei Figuren.",
  });
}

// ================= Übungsaufgaben =================

function initExercises() {
  mountUebungsaufgaben(document.getElementById("exercises-mount"), AUFGABEN);
}

// ================= Start =================

["sc-g", "sc-h", "sc-s"].forEach((id) => document.getElementById(id).addEventListener("input", renderScherung));
["pa-g", "pa-h", "pa-s", "pa-t", "pa-zweite"].forEach((id) => document.getElementById(id).addEventListener("input", renderParallelogramm));
["dr-g", "dr-h", "dr-cx", "dr-t"].forEach((id) => document.getElementById(id).addEventListener("input", renderDreieck));
document.querySelectorAll('input[name="gh-seite"]').forEach((r) => r.addEventListener("input", renderGrundseite));
["tz-a", "tz-c", "tz-h", "tz-t", "tz-mitte"].forEach((id) => document.getElementById(id).addEventListener("input", renderTrapez));
["zs-a", "zs-c", "zs-h"].forEach((id) => document.getElementById(id).addEventListener("input", renderZusammenschau));

renderScherung();
renderParallelogramm();
renderDreieck();
renderGrundseite();
renderTrapez();
renderZusammenschau();
initQuizzes();
initExercises();
