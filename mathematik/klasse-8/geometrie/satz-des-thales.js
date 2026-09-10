// Selbstlernpfad „Satz des Thales“ (Klasse 8, Geometrie).
//
// Aufbau wie die Lernpfade des Grundwissens — Abschnitt, bewegliche Zeichnung, Bilanz,
// Kontrollfrage —, aber mit dem Zirkel-und-Lineal-Werkzeug der Klasse-8-Geometrieseiten in
// Abschnitt 4. Deshalb zwei Quellen: die geo-*-Module für die Konstruktion, alles Übrige
// hier im Modul.
//
// Leitgedanke: Der Satz ist eine Aussage über WINKEL, und sein Beweis kommt ohne jede
// Rechnung aus. Die Zeichnungen zeigen deshalb durchgehend die beiden gleichschenkligen
// Teildreiecke, aus denen der rechte Winkel entsteht — nicht Längen, nicht Flächen.
//
// Zu den Zahlen: Die Lage von C wird über den Mittelpunktswinkel φ gesteuert. Daraus folgen
// α = φ : 2 und β = 90° − φ : 2 EXAKT (Basiswinkel im gleichschenkligen Dreieck), und damit
// ist γ = α + β = 90° exakt. Die Bilanzen rechnen deshalb mit φ und nicht mit Koordinaten:
// Aus Koordinaten käme 89,99999999999999° heraus, und das wäre eine Zeichnung, die etwas
// anderes behauptet als der Satz.
//
// Durchgehende Farbcodierung: Winkel α (bei A) grün, Winkel β (bei B) orange, der rechte
// Winkel γ (bei C) rot, Durchmesser/Hypotenuse blau, Radien violett.

import * as GC from "./geo-core.js?v=22";
import * as GS from "./geo-svg.js?v=22";
import { drawMittelsenkrechte } from "./constructions.js?v=22";
import { setupFreeConstruction } from "./free-ui.js?v=22";
import { setupCanvasZoom } from "./canvas-zoom.js?v=22";
import { THALES_TASK } from "./thales-construct.js?v=1";

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
  return svgEl("svg", { viewBox: `0 0 ${w} ${h}`, width: w, height: h, class: "th-flaeche", preserveAspectRatio: "xMidYMid meet" });
}
// Maßstab, der eine Figur der gegebenen Ausdehnung in den Rahmen legt.
function massstab(breite, hoehe, maxBreite, maxHoehe) {
  return Math.min(maxBreite / breite, maxHoehe / hoehe);
}
// Ganzzahlige Potenz ohne Math.pow — 41² muss exakt 1681 sein.
function quadrat(x) {
  return x * x;
}
// Fehlerhinweise vergleichen die Eingabe mit dem Wert, der bei einem bestimmten Fehler
// herauskäme. Ein Vergleich mit === trifft dabei nicht: Aus √(41² − 9²) kommt 40,00000000000001,
// und der Hinweis bliebe stumm.
function trifft(val, soll) {
  return Number.isFinite(val) && Number.isFinite(soll) && Math.abs(val - soll) <= 1e-6 * Math.max(1, Math.abs(soll));
}
// Alle Werte paarweise verschieden? Fällt ein Fehlerwert mit der Lösung zusammen, bekäme eine
// falsche Rechnung ein ✓; fallen zwei Fehlerwerte zusammen, wäre die Diagnose mehrdeutig.
function paarweiseVerschieden(werte) {
  return werte.every((x, i) => werte.every((y, j) => i === j || Math.abs(x - y) > 1e-9));
}
// Wählt aus einer VORHER gefilterten Liste — nicht durch Verwerfen und Neuziehen.
function ohneKollision(kandidaten, werte, notfall) {
  const sauber = kandidaten.filter((k) => paarweiseVerschieden(werte(k)));
  return sauber.length ? pick(sauber) : notfall;
}

// Schreibt einen begrenzten Reglerwert in den Regler zurück. Ein Regler darf nie etwas anderes
// anzeigen als das, womit gerechnet wird.
function begrenzt(id, wert, min, max) {
  const v = Math.min(max, Math.max(min, wert));
  if (v !== wert) document.getElementById(id).value = String(v);
  return v;
}

const GRAD = Math.PI / 180;

// ---------- Gemeinsame Zeichenbausteile ----------

// Winkelbogen im Punkt V zwischen den Richtungen nach P und nach Q, mit Beschriftung.
function winkelBogen(g, V, P, Q, r, klasse, text) {
  const a1 = GC.angleOf(GC.sub(P, V));
  const a2 = GC.angleOf(GC.sub(Q, V));
  // Kürzester Drehsinn — der Innenwinkel des Dreiecks ist immer der kleinere der beiden.
  const delta = ((a2 - a1 + 540) % 360) - 180;
  const ende = a1 + delta;
  const sweep = delta >= 0 ? 1 : 0;
  const p1 = { x: V.x + r * Math.cos(a1 * GRAD), y: V.y + r * Math.sin(a1 * GRAD) };
  const p2 = { x: V.x + r * Math.cos(ende * GRAD), y: V.y + r * Math.sin(ende * GRAD) };
  g.appendChild(svgEl("path", { d: `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} A ${r} ${r} 0 0 ${sweep} ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`, fill: "none", stroke: klasse, "stroke-width": 2 }));
  if (text) {
    const mitte = a1 + delta / 2;
    const rt = r + 14;
    g.appendChild(svgText(V.x + rt * Math.cos(mitte * GRAD), V.y + rt * Math.sin(mitte * GRAD) + 4, text, { class: "th-text", fill: klasse }));
  }
}

// Rechter-Winkel-Kästchen im Punkt V, ausgerichtet auf P und Q.
function rechterWinkel(g, V, P, Q, farbe, s = 13) {
  const d1 = GC.norm(GC.sub(P, V));
  const d2 = GC.norm(GC.sub(Q, V));
  const p1 = GC.add(V, GC.scale(d1, s));
  const p3 = GC.add(V, GC.scale(d2, s));
  const p2 = GC.add(p1, GC.scale(d2, s));
  g.appendChild(svgEl("polyline", {
    points: `${p1.x.toFixed(2)},${p1.y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)} ${p3.x.toFixed(2)},${p3.y.toFixed(2)}`,
    fill: "none", stroke: farbe, "stroke-width": 2,
  }));
}

function strecke(g, a, b, farbe, breite = 2.5, extra = {}) {
  g.appendChild(svgEl("line", Object.assign({ x1: a.x.toFixed(2), y1: a.y.toFixed(2), x2: b.x.toFixed(2), y2: b.y.toFixed(2), stroke: farbe, "stroke-width": breite, "stroke-linecap": "round" }, extra)));
}

// Punktmarke samt Beschriftung. Beide stehen in einer gemeinsamen Gruppe, die den Namen trägt:
// Die Beschriftung sitzt versetzt daneben, und bei eng benachbarten Punkten ließe sich sonst
// nicht mehr sagen, welche Beschriftung zu welcher Marke gehört.
function punkt(g, p, name, dx = 0, dy = -12) {
  const gruppe = svgEl("g", { class: "th-punkt-gruppe", "data-name": name || "" });
  gruppe.appendChild(svgEl("circle", { cx: p.x.toFixed(2), cy: p.y.toFixed(2), r: 4, class: "th-punkt" }));
  if (name) gruppe.appendChild(svgText(p.x + dx, p.y + dy, name, { class: "th-punkt-name" }));
  g.appendChild(gruppe);
}

// Gleichheitsstrich quer über eine Strecke — die übliche Kennzeichnung gleich langer Seiten.
function gleichheitsStrich(g, a, b, farbe) {
  const m = GC.mid(a, b);
  const q = GC.scale(GC.norm(GC.perp(GC.sub(b, a))), 6);
  strecke(g, GC.sub(m, q), GC.add(m, q), farbe, 2);
}

const FARBE = {
  a: "#157347",
  b: "#b3650a",
  c: "#1d4ed8",
  r: "#6d28d9",
  g: "#b3261e",
  hilfe: "#9aa4b1",
};

// ================= 1. Der rechte Winkel im Halbkreis =================

// Die Fläche ist so bemessen, dass der GANZE Kreis hineinpasst — nicht nur der obere Bogen.
// Ein unten abgeschnittener Kreis sähe aus wie ein Zeichenfehler, und er verstellte den Blick
// darauf, dass C ebenso gut unterhalb von AB liegen dürfte.
const HK_W = 560, HK_H = 380, HK_R = 155;
const HK_M = { x: HK_W / 2, y: 205 };

// Punkt auf dem Thaleskreis zum Mittelpunktswinkel φ (von B aus gemessen, gegen den
// Uhrzeigersinn — in SVG-Koordinaten mit y nach unten also nach oben).
function aufKreis(M, R, phiGrad) {
  return { x: M.x + R * Math.cos(phiGrad * GRAD), y: M.y - R * Math.sin(phiGrad * GRAD) };
}

function renderHalbkreis() {
  const phi = Number(document.getElementById("hk-phi").value);
  const radien = document.getElementById("hk-radien").checked;
  document.getElementById("hk-phi-anzeige").textContent = "φ = " + num(phi) + "°";

  // Exakt aus φ, nicht aus Koordinaten (siehe Kopfkommentar).
  const alpha = phi / 2;
  const beta = 90 - phi / 2;

  const A = { x: HK_M.x - HK_R, y: HK_M.y };
  const B = { x: HK_M.x + HK_R, y: HK_M.y };
  const C = aufKreis(HK_M, HK_R, phi);

  const svg = neueFlaeche(HK_W, HK_H);
  const g = svgEl("g");

  // Der ganze Kreis, nicht nur der obere Bogen: C darf auch unterhalb von AB liegen, und ein
  // Bild, das nur den Halbkreis zeigt, legte nahe, dort gälte der Satz nicht.
  g.appendChild(svgEl("circle", { cx: HK_M.x, cy: HK_M.y, r: HK_R, fill: "none", stroke: FARBE.c, "stroke-width": 1.6, opacity: "0.45" }));
  // Der obere Bogen, auf dem C wandert, kräftiger.
  const bogenA = aufKreis(HK_M, HK_R, 0);
  const bogenB = aufKreis(HK_M, HK_R, 180);
  g.appendChild(svgEl("path", { d: `M ${bogenA.x.toFixed(2)} ${bogenA.y.toFixed(2)} A ${HK_R} ${HK_R} 0 0 0 ${bogenB.x.toFixed(2)} ${bogenB.y.toFixed(2)}`, fill: "none", stroke: FARBE.c, "stroke-width": 2.6 }));

  if (radien) {
    [A, B, C].forEach((P) => strecke(g, HK_M, P, FARBE.r, 1.8, { "stroke-dasharray": "5 4" }));
    [A, B, C].forEach((P) => gleichheitsStrich(g, HK_M, P, FARBE.r));
  }

  strecke(g, A, B, FARBE.c, 3);
  strecke(g, A, C, FARBE.a, 2.5);
  strecke(g, B, C, FARBE.b, 2.5);

  winkelBogen(g, A, B, C, 34, FARBE.a, "α");
  winkelBogen(g, B, C, A, 34, FARBE.b, "β");
  rechterWinkel(g, C, A, B, FARBE.g);

  punkt(g, A, "A", -12, 20);
  punkt(g, B, "B", 12, 20);
  punkt(g, C, "C", 0, -14);
  punkt(g, HK_M, "M", 0, 20);
  g.appendChild(svgText((A.x + B.x) / 2, HK_M.y - 10, "Durchmesser AB", { class: "th-text-klein", fill: FARBE.c }));

  svg.appendChild(g);
  const mount = document.getElementById("hk-mount");
  mount.innerHTML = "";
  mount.appendChild(svg);

  document.getElementById("hk-bilanz").innerHTML =
    `Winkel bei A: <span class="wa">α = ${num(alpha, 1)}°</span> &nbsp;·&nbsp; ` +
    `Winkel bei B: <span class="wb">β = ${num(beta, 1)}°</span><br>` +
    `Winkelsumme im Dreieck: <span class="wa">${num(alpha, 1)}°</span> + <span class="wb">${num(beta, 1)}°</span> + ` +
    `<span class="wg">γ</span> = 180°, also <span class="wg">γ = ${num(180 - alpha - beta)}°</span><br>` +
    `Zusammen: <span class="wa">α</span> + <span class="wb">β</span> = ${num(alpha + beta)}° — die beiden spitzen Winkel ergänzen sich stets zu 90°.`;

  document.getElementById("hk-text").textContent =
    phi === 90
      ? "Bei φ = 90° steht C senkrecht über M. Dann ist das Dreieck gleichschenklig-rechtwinklig: α = β = 45°."
      : alpha < beta
        ? `C liegt näher an B. Der Winkel bei A ist mit ${num(alpha, 1)}° der kleinere — der rechte Winkel bei C bleibt trotzdem.`
        : `C liegt näher an A. Der Winkel bei B ist mit ${num(beta, 1)}° der kleinere — der rechte Winkel bei C bleibt trotzdem.`;
}

// ================= 2. Der Beweis =================

function renderBeweis() {
  const phi = Number(document.getElementById("bw-phi").value);
  document.getElementById("bw-phi-anzeige").textContent = "φ = " + num(phi) + "°";

  const alpha = phi / 2;
  const beta = 90 - phi / 2;

  const A = { x: HK_M.x - HK_R, y: HK_M.y };
  const B = { x: HK_M.x + HK_R, y: HK_M.y };
  const C = aufKreis(HK_M, HK_R, phi);

  const svg = neueFlaeche(HK_W, HK_H);
  const g = svgEl("g");

  g.appendChild(svgEl("circle", { cx: HK_M.x, cy: HK_M.y, r: HK_R, fill: "none", stroke: FARBE.c, "stroke-width": 1.6, opacity: "0.45" }));

  // Die beiden gleichschenkligen Teildreiecke farbig hinterlegen — sie sind der ganze Beweis.
  const flaeche = (P, Q, R2, farbe) =>
    g.appendChild(svgEl("polygon", { points: `${P.x.toFixed(2)},${P.y.toFixed(2)} ${Q.x.toFixed(2)},${Q.y.toFixed(2)} ${R2.x.toFixed(2)},${R2.y.toFixed(2)}`, fill: farbe, "fill-opacity": "0.14", stroke: "none" }));
  flaeche(A, HK_M, C, FARBE.a);
  flaeche(B, HK_M, C, FARBE.b);

  strecke(g, A, B, FARBE.c, 3);
  strecke(g, A, C, FARBE.a, 2.5);
  strecke(g, B, C, FARBE.b, 2.5);
  // Der eine zusätzliche Strich, um den es geht.
  strecke(g, HK_M, C, FARBE.r, 2.5);

  // Alle drei Strecken vom Mittelpunkt sind Radien und damit gleich lang — ein Strich je Strecke.
  [A, B, C].forEach((P) => gleichheitsStrich(g, HK_M, P, FARBE.r));

  // Basiswinkel: bei A und bei C (zum Radius hin) je α, bei B und bei C je β.
  winkelBogen(g, A, B, C, 32, FARBE.a, "α");
  winkelBogen(g, C, A, HK_M, 30, FARBE.a, "α");
  winkelBogen(g, B, C, A, 32, FARBE.b, "β");
  winkelBogen(g, C, HK_M, B, 44, FARBE.b, "β");

  punkt(g, A, "A", -12, 20);
  punkt(g, B, "B", 12, 20);
  punkt(g, C, "C", 0, -14);
  punkt(g, HK_M, "M", 0, 20);
  g.appendChild(svgText(GC.mid(HK_M, C).x + 16, GC.mid(HK_M, C).y, "r", { class: "th-text", fill: FARBE.r }));
  g.appendChild(svgText(GC.mid(HK_M, A).x, HK_M.y + 20, "r", { class: "th-text", fill: FARBE.r }));
  g.appendChild(svgText(GC.mid(HK_M, B).x, HK_M.y + 20, "r", { class: "th-text", fill: FARBE.r }));

  svg.appendChild(g);
  const mount = document.getElementById("bw-mount");
  mount.innerHTML = "";
  mount.appendChild(svg);

  document.getElementById("bw-bilanz").innerHTML =
    `<strong>1.</strong> Dreieck AMC: <span class="wr">MA = MC = r</span> ⟹ gleichschenklig ⟹ ` +
    `Basiswinkel gleich: <span class="wa">∡MAC = ∡MCA = α = ${num(alpha)}°</span><br>` +
    `<strong>2.</strong> Dreieck BMC: <span class="wr">MB = MC = r</span> ⟹ gleichschenklig ⟹ ` +
    `<span class="wb">∡MBC = ∡MCB = β = ${num(beta)}°</span><br>` +
    `<strong>3.</strong> Der Winkel bei C setzt sich zusammen: ` +
    `<span class="wg">γ = α + β = ${num(alpha)}° + ${num(beta)}° = ${num(alpha + beta)}°</span><br>` +
    `<strong>4.</strong> Winkelsumme: α + β + γ = 180°, mit Zeile 3 also ` +
    `2 · γ = 180° und damit <span class="wg">γ = 90°</span> ✓`;

  document.getElementById("bw-text").textContent =
    "Verschiebe C: α und β ändern sich beide, aber immer so, dass ihre Summe 90° bleibt — denn genau das erzwingt die Winkelsumme, sobald γ = α + β gilt.";
}

// ================= 3. Die Umkehrung =================

const UK_R = 100; // Radius des Thaleskreises in Zeichen-Einheiten

// Winkel ∡ACB in Grad. Für Abstand = Radius wird EXAKT 90 zurückgegeben: Dort ist der Wert
// mathematisch genau 90°, und aus Koordinaten käme 89,99999999999999 heraus — die Zeichnung
// zeigte dann ein „≈ 90°“, wo der Satz eine Gleichheit behauptet.
function winkelACB(d, phiGrad, r) {
  if (d === r) return 90;
  const A = { x: -r, y: 0 };
  const B = { x: r, y: 0 };
  const C = { x: d * Math.cos(phiGrad * GRAD), y: d * Math.sin(phiGrad * GRAD) };
  const u = GC.sub(A, C);
  const v = GC.sub(B, C);
  const kreuz = Math.abs(u.x * v.y - u.y * v.x);
  return Math.atan2(kreuz, GC.dot(u, v)) / GRAD;
}

function renderUmkehrung() {
  const phi = Number(document.getElementById("uk-phi").value);
  const d = Number(document.getElementById("uk-d").value);
  document.getElementById("uk-phi-anzeige").textContent = "φ = " + num(phi) + "°";
  document.getElementById("uk-d-anzeige").textContent = d === UK_R ? "MC = r" : "MC = " + num(d / UK_R, 2) + " · r";

  const gamma = winkelACB(d, phi, UK_R);

  // Der größte Abstand (1,7 · r) muss oberhalb von M noch hineinpassen, der Kreis unterhalb.
  const W = 500, H = 340;
  const M = { x: W / 2, y: 205 };
  const px = 1; // Zeichen-Einheiten → Bildpunkte
  const A = { x: M.x - UK_R * px, y: M.y };
  const B = { x: M.x + UK_R * px, y: M.y };
  const C = { x: M.x + d * px * Math.cos(phi * GRAD), y: M.y - d * px * Math.sin(phi * GRAD) };

  const svg = neueFlaeche(W, H);
  const g = svgEl("g");

  g.appendChild(svgEl("circle", { cx: M.x, cy: M.y, r: UK_R * px, fill: "none", stroke: FARBE.c, "stroke-width": 2.2 }));
  strecke(g, M, C, FARBE.r, 1.8, { "stroke-dasharray": "5 4" });
  strecke(g, A, B, FARBE.c, 3);
  strecke(g, A, C, FARBE.a, 2.5);
  strecke(g, B, C, FARBE.b, 2.5);

  // Der rechte Winkel wird NUR markiert, wenn er wirklich einer ist.
  if (gamma === 90) rechterWinkel(g, C, A, B, FARBE.g);
  else winkelBogen(g, C, A, B, 26, FARBE.g, "γ");

  punkt(g, A, "A", -12, 20);
  punkt(g, B, "B", 12, 20);
  punkt(g, C, "C", 0, -14);
  punkt(g, M, "M", 0, 20);

  svg.appendChild(g);
  const mount = document.getElementById("uk-mount");
  mount.innerHTML = "";
  mount.appendChild(svg);

  document.getElementById("uk-bilanz").innerHTML =
    (d === UK_R
      ? `Abstand des Punktes C vom Mittelpunkt: <span class="wr">MC = r</span> — genau der Radius, C liegt also <strong>auf dem Kreis</strong>.<br>` +
        `Winkel bei C: <span class="wg">γ = 90°</span> — ein rechter Winkel.`
      : `Abstand des Punktes C vom Mittelpunkt: <span class="wr">MC = ${num(d / UK_R, 2)} · r</span> — ` +
        `C liegt damit <strong>${d < UK_R ? "innerhalb" : "außerhalb"}</strong> des Kreises.<br>` +
        `Winkel bei C: <span class="wg">γ ${zeichen(gamma, 1)} ${num(gamma, 1)}°</span> ` +
        `&nbsp;${gamma > 90 ? ">" : "<"}&nbsp; 90°`);

  const urteil = document.getElementById("uk-urteil");
  urteil.className = "th-urteil " + (d === UK_R ? "recht" : d < UK_R ? "innen" : "aussen");
  urteil.textContent =
    d === UK_R
      ? "✓ C liegt auf dem Thaleskreis — der Winkel ist genau 90°."
      : d < UK_R
        ? "C liegt innerhalb des Kreises: Der Winkel wird größer als 90°, das Dreieck ist stumpfwinklig."
        : "C liegt außerhalb des Kreises: Der Winkel wird kleiner als 90°, das Dreieck ist spitzwinklig.";

  document.getElementById("uk-text").textContent =
    "Der Winkel hängt nur davon ab, ob C innen, außen oder auf dem Kreis liegt — nicht von der Richtung. Drehe C bei festem Abstand: Die Zahl ändert sich, das Urteil nicht.";
}

// ================= 4. Konstruieren mit Zirkel und Lineal =================

const K_W = 600, K_H = 420;

// Zufällige Strecke, deren THALESKREIS noch vollständig auf die Zeichenfläche passt.
// GC.randomSegment achtet nur auf die Endpunkte; der Kreis um die Mitte ragte damit regelmäßig
// über den Rand hinaus, und Abschnitt 2 der Anleitung zeigte einen angeschnittenen Kreis.
// Konstruktiv statt durch Verwerfen: erst der Radius, dann ein Mittelpunkt, der ihn zulässt.
function zufallsStrecke(W, H, rand = 26) {
  const rMax = Math.min(W, H) / 2 - rand;
  const R = 105 + Math.random() * Math.max(0, Math.min(165, rMax) - 105);
  const M = {
    x: R + rand + Math.random() * (W - 2 * (R + rand)),
    y: R + rand + Math.random() * (H - 2 * (R + rand)),
  };
  const winkel = Math.random() * 2 * Math.PI;
  const v = { x: R * Math.cos(winkel), y: R * Math.sin(winkel) };
  return { A: GC.sub(M, v), B: GC.add(M, v) };
}

// Rückt eine Punktbeschriftung in eine vorgegebene Richtung. Das Rahmenwerk versetzt jede
// Beschriftung fest um (10 | −8) — bei der fest liegenden Dreiecksfigur der anderen Themen
// passt das, hier aber liegt die Strecke zufällig gedreht, und der feste Versatz schiebt den
// Buchstaben regelmäßig mitten auf die Linie.
function richteBeschriftung(g, richtung, abstand = 16) {
  const t = g && g.querySelector(".geo-point-label");
  if (!t || !richtung) return;
  const laenge = Math.hypot(richtung.x, richtung.y);
  if (laenge < 1e-9) return;
  const dx = (richtung.x / laenge) * abstand;
  // +5 px: Die Grundlinie des Textes liegt oberhalb seines Ankers.
  const dy = (richtung.y / laenge) * abstand + 5;
  t.setAttribute("text-anchor", "middle");
  t.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`;
}

// Ziehbare Strecke — dasselbe Muster wie setupDraggableTriangle, nur mit zwei Punkten.
function setupDraggableSegment(svg, layer, W, H, initial, onUpdate) {
  const pts = { A: initial.A, B: initial.B };
  const handles = {};
  const state = { locked: false };
  // Jeder Endpunkt trägt seinen Buchstaben nach außen — vom anderen Endpunkt weg.
  function beschrifte() {
    richteBeschriftung(handles.A.g, GC.sub(pts.A, pts.B));
    richteBeschriftung(handles.B.g, GC.sub(pts.B, pts.A));
  }
  ["A", "B"].forEach((key) => {
    handles[key] = GS.drawDraggablePoint(svg, layer, pts[key], key, (x, y, handle) => {
      // Während des freien Konstruierens gesperrt: Verschöbe sich ein Endpunkt nebenbei, würde
      // die eigene Zeichnung ungültig, ohne dass es auffällt.
      if (state.locked) return;
      pts[key] = GC.clampToBox({ x, y }, W, H, 40);
      handle.update(pts[key]);
      beschrifte();
      onUpdate(pts);
    });
  });
  beschrifte();
  return {
    pts,
    setLocked(locked) {
      state.locked = locked;
      Object.values(handles).forEach((h) => h.g.classList.toggle("geo-point-locked", locked));
    },
    randomize() {
      const s = zufallsStrecke(W, H);
      pts.A = s.A;
      pts.B = s.B;
      handles.A.update(pts.A);
      handles.B.update(pts.B);
      beschrifte();
      onUpdate(pts);
    },
  };
}

const K_NOTIZ = {
  1: "Die Mittelsenkrechte von AB liefert den Mittelpunkt <strong>M</strong> — den einzigen Punkt, der von A und B gleich weit entfernt ist <em>und</em> auf AB liegt. Geschätzt werden darf er nicht: Ein Kreis um eine ungefähre Mitte geht durch keinen der beiden Endpunkte richtig.",
  2: "Der Kreis um M mit dem Radius MA geht auch durch B, denn MA = MB. Die Strecke AB ist damit sein <strong>Durchmesser</strong> — das ist der Thaleskreis über AB.",
  3: "Jeder Punkt C auf diesem Kreis bildet mit A und B ein bei C rechtwinkliges Dreieck. Ziehe A oder B: Der Kreis wandert mit, und der rechte Winkel bleibt — ganz gleich, wo die Strecke liegt und wie lang sie ist.",
};

const K_SCHRITTE = [
  "Zirkel in A einstechen, Radius größer als die halbe Strecke wählen und einen Bogen zeichnen. Dasselbe von B aus mit <em>demselben</em> Radius.",
  "Die beiden Schnittpunkte der Bögen mit dem Lineal verbinden — das ist die Mittelsenkrechte von AB. Wo sie die Strecke trifft, liegt der Mittelpunkt M.",
  "Zirkel in M einstechen, den Radius bis A (oder B) einstellen und den Kreis zeichnen: den <strong>Thaleskreis</strong> über AB.",
  "<strong>Probiere aus:</strong> Ziehe A oder B, bis die Strecke sehr kurz oder sehr schräg liegt. Der rechte Winkel bei C bleibt in jedem Fall — der Satz gilt für jede Strecke.",
];

function setupKonstruktion() {
  const svg = document.getElementById("geo-svg");
  const layerFigure = document.getElementById("layer-figure");
  const layerConstruct = document.getElementById("layer-construct");
  const layerCenters = document.getElementById("layer-centers");
  const layerUser = document.getElementById("layer-user");
  const layerVertices = document.getElementById("layer-vertices");
  const toggleArcs = document.getElementById("toggle-arcs");
  const countTabs = document.getElementById("count-tabs");
  const phaseTabs = document.getElementById("phase-tabs");
  const instructionBox = document.getElementById("instruction-box");
  const stepsList = document.getElementById("steps-list");
  const guidedControls = document.getElementById("guided-controls");
  const guidedToggleRow = document.getElementById("guided-toggle-row");
  const guidedToolbar = document.getElementById("guided-toolbar");
  const freeControls = document.getElementById("free-controls");

  let phase = "guided";
  let count = 1;

  function zeichneStrecke(pts) {
    GS.drawSegment(layerFigure, pts.A, pts.B);
  }

  // Ein Punkt auf dem Thaleskreis, der immer oberhalb der Strecke liegt — auch wenn A und B
  // beliebig gedreht werden. Ohne die Vorzeichenwahl kippte C beim Ziehen unter die Strecke.
  function punktAufKreis(A, B, grad) {
    const M = GC.mid(A, B);
    const u = GC.norm(GC.sub(B, M));
    let v = GC.perp(u);
    if (v.y > 0) v = GC.scale(v, -1);
    const R = GC.dist(A, B) / 2;
    return GC.add(M, GC.add(GC.scale(u, R * Math.cos(grad * GRAD)), GC.scale(v, R * Math.sin(grad * GRAD))));
  }

  function renderGuided(pts) {
    GS.clearEl(layerFigure);
    GS.clearEl(layerConstruct);
    GS.clearEl(layerCenters);
    zeichneStrecke(pts);

    const { A, B } = pts;
    const M = GC.mid(A, B);
    drawMittelsenkrechte(layerConstruct, K_W, K_H, A, B, toggleArcs.checked);
    // M sitzt auf der Strecke; sein Buchstabe gehört senkrecht daneben, und zwar auf die
    // Seite, auf der später kein C liegt.
    let senkrecht = GC.perp(GC.norm(GC.sub(B, A)));
    if (senkrecht.y > 0) senkrecht = GC.scale(senkrecht, -1);
    richteBeschriftung(GS.drawPoint(layerCenters, M, "M"), GC.scale(senkrecht, -1));

    if (count >= 2) {
      GS.drawCircle(layerConstruct, M, GC.dist(A, B) / 2, "geo-circle geo-umkreis");
    }
    if (count >= 3) {
      const C = punktAufKreis(A, B, 55);
      GS.drawSegment(layerConstruct, A, C, "geo-construct th-schenkel");
      GS.drawSegment(layerConstruct, B, C, "geo-construct th-schenkel");
      GS.drawRightAngleMarker(layerConstruct, C, A, B, "geo-hoehe");
      richteBeschriftung(GS.drawPoint(layerCenters, C, "C"), GC.sub(C, M));
    }
  }

  function renderNote() {
    instructionBox.innerHTML = `<p>${K_NOTIZ[count]}</p><p class="geo-why">${THALES_TASK.why}</p>`;
    stepsList.innerHTML = K_SCHRITTE.map((s) => `<li>${s}</li>`).join("");
  }

  const seg = setupDraggableSegment(svg, layerVertices, K_W, K_H, zufallsStrecke(K_W, K_H), (pts) => {
    if (phase === "guided") {
      renderGuided(pts);
    } else {
      GS.clearEl(layerFigure);
      zeichneStrecke(pts);
    }
  });

  const free = setupFreeConstruction({
    svg,
    layer: layerUser,
    els: {
      btnToolCircle: document.getElementById("btn-tool-circle"),
      btnToolLine: document.getElementById("btn-tool-line"),
      btnUndo: document.getElementById("btn-undo"),
      btnClear: document.getElementById("btn-clear"),
      btnCheck: document.getElementById("btn-check"),
      btnHint: document.getElementById("btn-hint"),
      chkLockRadius: document.getElementById("chk-lock-radius"),
      btnResetRadius: document.getElementById("btn-reset-radius"),
      radiusStatus: document.getElementById("radius-status"),
      pendingStatus: document.getElementById("pending-status"),
      feedbackBox: document.getElementById("feedback-box"),
    },
    model: () => THALES_TASK.analyze(free.tool, seg.pts),
    check: () => THALES_TASK.check(THALES_TASK.analyze(free.tool, seg.pts)),
  });

  function enterFree() {
    GS.clearEl(layerConstruct);
    GS.clearEl(layerCenters);
    GS.clearEl(layerFigure);
    zeichneStrecke(seg.pts);
    instructionBox.innerHTML = `<p>${THALES_TASK.intro}</p><p class="geo-why">${THALES_TASK.why}</p>`;
    stepsList.innerHTML = THALES_TASK.steps.map((s) => `<li>${s}</li>`).join("");
    free.reset();
  }

  renderGuided(seg.pts);
  renderNote();

  toggleArcs.addEventListener("change", () => renderGuided(seg.pts));
  document.getElementById("btn-new-segment").addEventListener("click", () => seg.randomize());
  document.getElementById("btn-new-segment-free").addEventListener("click", () => {
    // Für das Zufallsziehen kurz entsperren — sonst bliebe die Strecke stehen.
    seg.setLocked(false);
    seg.randomize();
    seg.setLocked(true);
    enterFree();
  });

  countTabs.addEventListener("click", (e) => {
    const btn = e.target.closest(".geo-mode-tab[data-count]");
    if (!btn) return;
    count = Number(btn.dataset.count);
    [...countTabs.children].forEach((b) => b.classList.toggle("geo-mode-tab-active", b === btn));
    renderGuided(seg.pts);
    renderNote();
  });

  phaseTabs.addEventListener("click", (e) => {
    const btn = e.target.closest(".geo-mode-tab[data-phase]");
    if (!btn) return;
    phase = btn.dataset.phase;
    [...phaseTabs.children].forEach((b) => b.classList.toggle("geo-mode-tab-active", b === btn));
    guidedControls.hidden = phase !== "guided";
    guidedToggleRow.hidden = phase !== "guided";
    guidedToolbar.hidden = phase !== "guided";
    freeControls.hidden = phase !== "free";
    seg.setLocked(phase === "free");
    if (phase === "guided") {
      renderGuided(seg.pts);
      renderNote();
    } else {
      enterFree();
    }
  });

  setupCanvasZoom(document.querySelector(".geo-layout").closest(".card"), document.getElementById("btn-zoom"));
}

// ================= 5. Tangenten =================

function renderTangenten() {
  const r = Number(document.getElementById("tg-r").value);
  // Der Punkt P muss außerhalb liegen, sonst gibt es keine Tangente. Der begrenzte Wert wird in
  // den Regler zurückgeschrieben — er darf nicht mehr anzeigen, als gerechnet wird.
  const d = begrenzt("tg-d", Number(document.getElementById("tg-d").value), r + 1, 12);
  const zeigeThales = document.getElementById("tg-thales").checked;
  document.getElementById("tg-r-anzeige").textContent = "r = " + num(r);
  document.getElementById("tg-d-anzeige").textContent = "d = " + num(d);

  const t2 = quadrat(d) - quadrat(r); // PT² — exakt ganzzahlig
  const t = Math.sqrt(t2);

  const W = 560, H = 320;
  // Die Figur reicht in der Breite von M − r bis P. In der Höhe zählt nicht nur der gegebene
  // Kreis: Der Thaleskreis über MP hat den Radius d : 2 und ist bei kleinem r der größere von
  // beiden. Gerechnet wird mit dem Maximum — und zwar unabhängig davon, ob er gerade angezeigt
  // wird, damit die Figur beim Ein- und Ausschalten nicht springt.
  const px = massstab(d + r + 1.5, 2 * Math.max(r, d / 2) + 1.6, W - 40, H - 60);
  const M = { x: (W - (d + r) * px) / 2 + r * px, y: H / 2 };
  const P = { x: M.x + d * px, y: M.y };
  const Z = GC.mid(M, P);

  // Berührpunkte: Schnitt des gegebenen Kreises mit dem Thaleskreis über MP.
  // Analytisch statt über die Kreis-Kreis-Formel — der Abstand des Berührpunktes von M längs MP
  // ist r² : d, die Höhe darüber (r : d) · √(d² − r²).
  const tx = quadrat(r) / d;
  const ty = (r / d) * t;
  const T1 = { x: M.x + tx * px, y: M.y - ty * px };
  const T2 = { x: M.x + tx * px, y: M.y + ty * px };

  const svg = neueFlaeche(W, H);
  const g = svgEl("g");

  if (zeigeThales) {
    g.appendChild(svgEl("circle", { cx: Z.x.toFixed(2), cy: Z.y.toFixed(2), r: (d / 2) * px, fill: "none", stroke: FARBE.c, "stroke-width": 1.8, "stroke-dasharray": "6 5" }));
    strecke(g, M, P, FARBE.c, 1.6, { "stroke-dasharray": "4 4" });
    punkt(g, Z, "Z", 0, 18);
  }
  g.appendChild(svgEl("circle", { cx: M.x.toFixed(2), cy: M.y.toFixed(2), r: r * px, fill: "none", stroke: FARBE.r, "stroke-width": 2.4 }));

  [T1, T2].forEach((T) => {
    strecke(g, M, T, FARBE.r, 2.2);
    strecke(g, P, T, FARBE.a, 2.6);
    rechterWinkel(g, T, M, P, FARBE.g, 11);
  });

  punkt(g, M, "M", 0, 20);
  punkt(g, P, "P", 14, 6);
  punkt(g, T1, "T₁", 0, -12);
  punkt(g, T2, "T₂", 0, 22);

  svg.appendChild(g);
  const mount = document.getElementById("tg-mount");
  mount.innerHTML = "";
  mount.appendChild(svg);

  document.getElementById("tg-bilanz").innerHTML =
    `Im Dreieck MTP ist der Winkel bei T ein rechter — denn T liegt auf dem <span class="wc">Thaleskreis über MP</span>. ` +
    `<span class="wc">MP = d</span> ist dort die Hypotenuse.<br>` +
    `<span class="wa">PT</span>² = d² − r² = ${num(quadrat(d))} − ${num(quadrat(r))} = <strong>${num(t2)}</strong><br>` +
    `<span class="wa">PT = √${num(t2)} ${zeichen(t, 2)} ${num(t, 2)}</span><br>` +
    `Probe: PT² + r² = ${num(t2)} + ${num(quadrat(r))} = ${num(t2 + quadrat(r))} = d² ✓`;

  document.getElementById("tg-text").textContent =
    Number.isInteger(t)
      ? `Hier geht es glatt auf: r = ${num(r)}, PT = ${num(t)} und d = ${num(d)} bilden ein pythagoreisches Tripel.`
      : "Beide Tangentenabschnitte sind gleich lang — die ganze Figur ist an der Geraden MP gespiegelt.";
}

// ================= Quizze =================

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

function initQuizzes() {
  mountQuiz(document.getElementById("quiz-satz"), {
    q: "Auf einem Kreis liegen A, B und C. Die Strecke AB geht NICHT durch den Mittelpunkt. Was gilt für den Winkel bei C?",
    options: [
      "Er ist 90°, denn C liegt auf dem Kreis.",
      "Er ist im Allgemeinen nicht 90° — dafür müsste AB ein Durchmesser sein.",
      "Er ist auf jeden Fall kleiner als 90°.",
      "Ohne Messen lässt sich darüber nichts sagen.",
    ],
    correct: 1,
    explain:
      "Der Satz des Thales verlangt ausdrücklich den Durchmesser. Bei einer beliebigen Sehne AB haben zwar alle Punkte C auf demselben Bogen denselben Winkel — das ist der Umfangswinkelsatz —, aber eben nicht 90°.",
  });

  mountQuiz(document.getElementById("quiz-beweis"), {
    q: "Worauf beruht der Beweis des Satzes von Thales?",
    options: [
      "auf dem Satz des Pythagoras",
      "darauf, dass MA, MB und MC alle Radien sind — dadurch entstehen zwei gleichschenklige Dreiecke",
      "darauf, dass man den Winkel bei C misst und nachrechnet",
      "darauf, dass das Dreieck ABC gleichseitig ist",
    ],
    correct: 1,
    explain:
      "MA = MB = MC = r macht AMC und BMC gleichschenklig, ihre Basiswinkel sind also je gleich groß. Der Winkel bei C ist die Summe beider, und mit der Winkelsumme 180° folgt 2γ = 180°, also γ = 90°. Pythagoras wird dafür nicht gebraucht — der Satz ist viel älter.",
  });

  mountQuiz(document.getElementById("quiz-umkehrung"), {
    q: "Ein Dreieck ABC hat bei C einen rechten Winkel, und die Seite AB ist 12 cm lang. Wie weit ist C von der Mitte der Strecke AB entfernt?",
    options: ["12 cm", "6 cm", "Das hängt davon ab, wie flach oder steil das Dreieck ist.", "3 cm"],
    correct: 1,
    explain:
      "Nach der Umkehrung liegt C auf dem Thaleskreis über AB. Dessen Mittelpunkt ist die Mitte von AB, sein Radius die halbe Hypotenuse — also 6 cm, und zwar unabhängig von der Form des Dreiecks. Genau deshalb ist die Mitte der Hypotenuse der Umkreismittelpunkt.",
  });

  mountQuiz(document.getElementById("quiz-tangenten"), {
    q: "Warum schneidet der Thaleskreis über MP den gegebenen Kreis genau in den Berührpunkten der beiden Tangenten?",
    options: [
      "weil beide Kreise denselben Radius haben",
      "weil auf dem Thaleskreis genau die Punkte T mit ∡MTP = 90° liegen — und im Berührpunkt steht die Tangente senkrecht auf dem Radius",
      "weil P außerhalb des Kreises liegt",
      "Das ist Zufall und klappt nur bei bestimmten Radien.",
    ],
    correct: 1,
    explain:
      "Gesucht sind Punkte T auf dem gegebenen Kreis, bei denen PT senkrecht auf MT steht. Die Umkehrung des Satzes von Thales sagt: Alle Punkte mit ∡MTP = 90° bilden zusammen den Thaleskreis über MP. Wo beide Bedingungen zugleich gelten — also im Schnitt der beiden Kreise —, liegen die Berührpunkte.",
  });
}

// ================= Übungsaufgaben =================

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

// Pythagoreische Grundtripel. Vielfache davon sind wieder Tripel — dadurch lassen sich die
// Zahlen variieren, ohne dass eine Wurzel jemals irrational würde.
const TRIPEL = [
  [3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29], [9, 40, 41], [12, 35, 37],
];

// Aufgabe 1 — Winkel im Thales-Dreieck.
// α = 45° fällt heraus: Dort wäre β = 90° − α = α, und der Hinweis „das ist der gegebene
// Winkel selbst“ träfe dieselbe Zahl wie die Lösung.
const A1_KANDIDATEN = (() => {
  const liste = [];
  for (let a = 10; a <= 80; a++) liste.push(a);
  return liste;
})();

function generateAufgabe1() {
  const alpha = ohneKollision(A1_KANDIDATEN, (a) => [90 - a, a, 180 - a, 90], A1_KANDIDATEN[0]);
  const beta = 90 - alpha;
  return {
    promptHtml:
      `Über der Strecke AB wird der <strong>Thaleskreis</strong> gezeichnet; der Punkt C liegt auf ihm.<br>` +
      `Im Dreieck ABC ist der Winkel bei A <strong>α = ${num(alpha)}°</strong>.<br>` +
      `<strong>Wie groß ist der Winkel bei B?</strong> Antwort in Grad, ohne Gradzeichen.`,
    correct: beta,
    tolerance: 0.01,
    placeholder: "β in Grad",
    hinweis: (raw, val) => {
      if (trifft(val, alpha)) return `${num(alpha)}° ist der <strong>gegebene</strong> Winkel bei A. Gefragt ist der bei B.`;
      if (trifft(val, 180 - alpha))
        return `Du hast von 180° abgezogen. Die Winkelsumme im Dreieck ist zwar 180°, aber der rechte Winkel bei C nimmt davon schon <strong>90°</strong> weg — für α und β bleiben zusammen nur 90°.`;
      if (trifft(val, 90)) return `90° ist der Winkel bei <strong>C</strong> — der rechte Winkel, den der Thaleskreis liefert. Gefragt ist der Winkel bei B.`;
      return `Der Thaleskreis liefert γ = 90°. Damit bleibt für α und β zusammen 90°: β = 90° − α.`;
    },
    musterloesungHtml:
      `<strong>1. Satz des Thales:</strong> C liegt auf dem Thaleskreis über AB, also ist der Winkel bei C ein rechter: γ = 90°.<br>` +
      `<strong>2. Winkelsumme:</strong> α + β + γ = 180°<br>` +
      `<strong>3. Auflösen:</strong> β = 180° − 90° − ${num(alpha)}° = <strong>${num(beta)}°</strong><br>` +
      `<em>Probe:</em> ${num(alpha)}° + ${num(beta)}° + 90° = 180° ✓ &nbsp; Die beiden spitzen Winkel ergänzen sich immer zu 90°.`,
  };
}

// Aufgabe 2 — fehlende Kathete im Thales-Dreieck.
const A2_KANDIDATEN = (() => {
  const liste = [];
  for (const [x, y, z] of TRIPEL) {
    for (let t = 1; t <= 3; t++) {
      liste.push({ b: x * t, a: y * t, c: z * t });
      liste.push({ b: y * t, a: x * t, c: z * t });
    }
  }
  return liste;
})();

function generateAufgabe2() {
  const k = ohneKollision(
    A2_KANDIDATEN,
    (v) => [v.a, v.c - v.b, quadrat(v.c) - quadrat(v.b), Math.sqrt(quadrat(v.c) + quadrat(v.b)), v.c / 2],
    A2_KANDIDATEN[0],
  );
  const { a, b, c } = k;
  return {
    promptHtml:
      `Über der Strecke AB mit <strong>AB = ${num(c)} cm</strong> wird der Thaleskreis gezeichnet. ` +
      `Der Punkt C liegt auf dem Kreis, und die Strecke <strong>AC ist ${num(b)} cm</strong> lang.<br>` +
      `<strong>Wie lang ist die Strecke BC?</strong> Antwort in Zentimetern.`,
    correct: a,
    tolerance: 0.01,
    placeholder: "BC in cm",
    hinweis: (raw, val) => {
      if (trifft(val, c - b))
        return `Du hast die <strong>Längen</strong> voneinander abgezogen. Subtrahiert werden aber die <em>Quadrate</em>: BC² = AB² − AC².`;
      if (trifft(val, quadrat(c) - quadrat(b)))
        return `${num(quadrat(c) - quadrat(b))} ist bereits <strong>BC²</strong>. Es fehlt noch die Quadratwurzel.`;
      if (trifft(val, Math.sqrt(quadrat(c) + quadrat(b))))
        return `Du hast <strong>addiert</strong>. AB ist hier der Durchmesser und damit die <em>Hypotenuse</em> — die längste Seite. Gesucht ist eine Kathete, also wird subtrahiert.`;
      if (trifft(val, c / 2))
        return `${num(c / 2)} cm ist der <strong>Radius</strong> des Thaleskreises. Er ist zwar die halbe Hypotenuse, aber nicht die gesuchte Kathete.`;
      return `Der Thaleskreis liefert den rechten Winkel bei C. AB ist die Hypotenuse: BC² = AB² − AC².`;
    },
    musterloesungHtml:
      `<strong>1. Satz des Thales:</strong> C liegt auf dem Thaleskreis über AB ⟹ der Winkel bei C ist 90°. Damit ist <strong>AB die Hypotenuse</strong>.<br>` +
      `<strong>2. Satz des Pythagoras:</strong> BC² = AB² − AC² = ${num(quadrat(c))} − ${num(quadrat(b))} = <strong>${num(quadrat(a))}</strong><br>` +
      `<strong>3. Wurzel ziehen:</strong> BC = √${num(quadrat(a))} = <strong>${num(a)} cm</strong><br>` +
      `<em>Probe:</em> ${num(b)}² + ${num(a)}² = ${num(quadrat(b))} + ${num(quadrat(a))} = ${num(quadrat(c))} = ${num(c)}² ✓`,
  };
}

// Aufgabe 3 — Tangentenlänge. Radius und Tangentenabschnitt sind die Katheten, der Abstand MP
// ist die Hypotenuse; aus einem Tripel wird also alles ganzzahlig.
const A3_KANDIDATEN = (() => {
  const liste = [];
  for (const [x, y, z] of TRIPEL) {
    for (let t = 1; t <= 3; t++) {
      liste.push({ r: x * t, pt: y * t, d: z * t });
      liste.push({ r: y * t, pt: x * t, d: z * t });
    }
  }
  return liste;
})();

function generateAufgabe3() {
  const k = ohneKollision(
    A3_KANDIDATEN,
    (v) => [v.pt, v.d - v.r, quadrat(v.d) - quadrat(v.r), Math.sqrt(quadrat(v.d) + quadrat(v.r)), v.d / 2],
    A3_KANDIDATEN[0],
  );
  const { r, pt, d } = k;
  return {
    promptHtml:
      `Ein Kreis hat den Mittelpunkt M und den Radius <strong>r = ${num(r)} cm</strong>. ` +
      `Der Punkt P liegt <strong>${num(d)} cm</strong> von M entfernt.<br>` +
      `Von P aus wird eine <strong>Tangente</strong> an den Kreis gelegt; sie berührt ihn im Punkt T.<br>` +
      `<strong>Wie lang ist die Strecke PT?</strong> Antwort in Zentimetern.`,
    correct: pt,
    tolerance: 0.01,
    placeholder: "PT in cm",
    hinweis: (raw, val) => {
      if (trifft(val, d - r))
        return `Du hast die <strong>Längen</strong> subtrahiert. ${num(d - r)} cm ist der kürzeste Weg von P zum Kreisrand, nicht die Tangente — sie läuft schräg am Kreis vorbei bis zum Berührpunkt.`;
      if (trifft(val, quadrat(d) - quadrat(r)))
        return `${num(quadrat(d) - quadrat(r))} ist bereits <strong>PT²</strong>. Es fehlt noch die Quadratwurzel.`;
      if (trifft(val, Math.sqrt(quadrat(d) + quadrat(r))))
        return `Du hast <strong>addiert</strong>. Im Dreieck MTP ist MP = ${num(d)} cm die <em>Hypotenuse</em> (ihm gegenüber liegt der rechte Winkel bei T) — also wird subtrahiert.`;
      if (trifft(val, d / 2))
        return `${num(d / 2)} cm ist der Radius des <strong>Thaleskreises</strong> über MP. Der hilft beim Konstruieren der Tangente, ist aber nicht ihre Länge.`;
      return `Im Berührpunkt steht die Tangente senkrecht auf dem Radius. Pythagoras im Dreieck MTP mit der Hypotenuse MP: PT² = d² − r².`;
    },
    musterloesungHtml:
      `<strong>1. Rechter Winkel:</strong> Im Berührpunkt steht die Tangente senkrecht auf dem Radius, also ist ∡MTP = 90°. ` +
      `Genau deshalb liegt T auf dem <strong>Thaleskreis über MP</strong> — so wird die Tangente konstruiert.<br>` +
      `<strong>2. Satz des Pythagoras</strong> im Dreieck MTP, Hypotenuse MP:<br>` +
      `PT² = MP² − r² = ${num(quadrat(d))} − ${num(quadrat(r))} = <strong>${num(quadrat(pt))}</strong><br>` +
      `<strong>3. Wurzel ziehen:</strong> PT = √${num(quadrat(pt))} = <strong>${num(pt)} cm</strong><br>` +
      `<em>Probe:</em> ${num(pt)}² + ${num(r)}² = ${num(quadrat(pt))} + ${num(quadrat(r))} = ${num(quadrat(d))} = ${num(d)}² ✓ &nbsp; ` +
      `Die zweite Tangente von P aus ist genau gleich lang.`,
  };
}

// Aufgabe 4 — Flächeninhalt des Thales-Dreiecks. Der springende Punkt: Weil der rechte Winkel
// bei C liegt, sind die beiden KATHETEN Grundseite und Höhe zueinander — eine zusätzliche Höhe
// muss gar nicht bestimmt werden.
const A4_KANDIDATEN = A2_KANDIDATEN;

function generateAufgabe4() {
  const k = ohneKollision(
    A4_KANDIDATEN,
    (v) => [(v.a * v.b) / 2, (v.c * v.b) / 2, v.a * v.b, v.a],
    A4_KANDIDATEN[0],
  );
  const { a, b, c } = k;
  const flaeche = (a * b) / 2;
  return {
    promptHtml:
      `Aus einer halbkreisförmigen Blechplatte mit dem <strong>Durchmesser AB = ${num(c)} cm</strong> wird ein Dreieck ABC ausgeschnitten. ` +
      `Die Ecke <strong>C liegt auf dem Halbkreisbogen</strong>, und die Seite <strong>AC misst ${num(b)} cm</strong>.<br>` +
      `<strong>Wie groß ist der Flächeninhalt des Dreiecks?</strong> Antwort in Quadratzentimetern.`,
    correct: flaeche,
    tolerance: 0.01,
    placeholder: "Fläche in cm²",
    hinweis: (raw, val) => {
      if (trifft(val, (c * b) / 2))
        return `Du hast AB als Grundseite und AC als Höhe genommen. AC ist aber <strong>keine Höhe zu AB</strong> — eine Höhe müsste senkrecht auf AB stehen, und AC tut das nicht. Senkrecht aufeinander stehen hier die beiden <em>Katheten</em>.`;
      if (trifft(val, a * b))
        return `Du hast die <strong>Halbierung vergessen</strong>. Das Dreieck ist die Hälfte des Rechtecks aus den beiden Katheten: A = (${num(b)} · ${num(a)}) : 2.`;
      if (trifft(val, a))
        return `${num(a)} cm ist erst die zweite Kathete <strong>BC</strong> — ein Zwischenergebnis. Damit ist die Fläche noch nicht ausgerechnet.`;
      return `Zwei Schritte: erst BC mit dem Satz des Pythagoras, dann die Fläche aus den beiden Katheten.`;
    },
    musterloesungHtml:
      `<strong>1. Satz des Thales:</strong> C liegt auf dem Halbkreis über AB ⟹ der Winkel bei C ist 90°.<br>` +
      `<strong>2. Zweite Kathete (Pythagoras):</strong> BC² = ${num(c)}² − ${num(b)}² = ${num(quadrat(c))} − ${num(quadrat(b))} = ${num(quadrat(a))}, also BC = <strong>${num(a)} cm</strong><br>` +
      `<strong>3. Flächeninhalt:</strong> Weil der rechte Winkel bei C liegt, stehen die beiden Katheten senkrecht aufeinander — die eine ist Grundseite, die andere ist die zugehörige Höhe:<br>` +
      `A = (${num(b)} · ${num(a)}) : 2 = <strong>${num(flaeche)} cm²</strong><br>` +
      `<em>Merke:</em> Zur Grundseite AB gehörte eine ganz andere Höhe, nämlich der Abstand von C zur Strecke AB. Mit AC als Höhe zu AB zu rechnen wäre falsch.`,
  };
}

function initExercises() {
  mountUebungsaufgaben(document.getElementById("exercises-mount"), [
    { schwierigkeit: "einfach", titel: "Aufgabe 1 — der zweite spitze Winkel", generate: generateAufgabe1 },
    { schwierigkeit: "mittel", titel: "Aufgabe 2 — die fehlende Kathete", generate: generateAufgabe2 },
    { schwierigkeit: "schwierig", titel: "Aufgabe 3 — Länge einer Tangente", generate: generateAufgabe3 },
    { schwierigkeit: "komplex", titel: "Aufgabe 4 — Flächeninhalt aus dem Halbkreis", generate: generateAufgabe4 },
  ]);
}

// ================= Start =================

["hk-phi", "hk-radien"].forEach((id) => document.getElementById(id).addEventListener("input", renderHalbkreis));
document.getElementById("bw-phi").addEventListener("input", renderBeweis);
["uk-phi", "uk-d"].forEach((id) => document.getElementById(id).addEventListener("input", renderUmkehrung));
["tg-r", "tg-d", "tg-thales"].forEach((id) => document.getElementById(id).addEventListener("input", renderTangenten));

renderHalbkreis();
renderBeweis();
renderUmkehrung();
renderTangenten();
setupKonstruktion();
initQuizzes();
initExercises();
