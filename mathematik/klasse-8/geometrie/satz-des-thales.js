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
// Winkel γ (bei C) rot, Durchmesser AB blau, Radien violett.

import * as GC from "./geo-core.js?v=24";
import * as GS from "./geo-svg.js?v=24";
import { drawMittelsenkrechte } from "./constructions.js?v=24";
import { setupFreeConstruction } from "./free-ui.js?v=24";
import { setupCanvasZoom } from "./canvas-zoom.js?v=24";
import { beschriftung, tangentenFigur, THALES_TASK, TANGENTEN_TASK } from "./thales-construct.js?v=3";
import { mountKonstruktionsAufgaben, mountRechenAufgaben, mountHeftAufgaben } from "./thales-aufgaben.js?v=5";
// Die Werkbank für die gestaffelten Übungsaufgaben ist dieselbe wie im Grundwissen.
import { mountUebungsaufgaben as mountUebungsaufgabenBasis } from "../../aufgaben.js?v=1";
const mountUebungsaufgaben = (container, defs) =>
  mountUebungsaufgabenBasis(container, defs, { parse: parseFlexibleNumber });

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

  // Nur für die Lage der Berührpunkte gebraucht, nicht für eine Rechnung auf der Seite:
  // Die Tangentenlänge selbst gehört zum Satz des Pythagoras und damit in Klasse 9.
  const t = Math.sqrt(quadrat(d) - quadrat(r));

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
    `<span class="wr">T₁</span> und <span class="wr">T₂</span> liegen auf <strong>beiden</strong> Kreisen: auf dem gegebenen Kreis k, also sind ` +
    `<span class="wr">MT₁</span> und <span class="wr">MT₂</span> Radien — und auf dem <span class="wc">Thaleskreis über MP</span>, ` +
    `also ist der Winkel bei T ein rechter.<br>` +
    `∡MT₁P = ∡MT₂P = <span class="wg">90°</span> — und eine Gerade, die im Kreispunkt senkrecht auf dem Radius steht, <strong>berührt</strong> den Kreis.<br>` +
    `Verschiebe P: Der rechte Winkel bleibt, solange P außerhalb liegt.`;

  document.getElementById("tg-text").textContent =
    "Beide Tangentenabschnitte sind gleich lang — die ganze Figur ist an der Geraden MP gespiegelt. " +
    "Ausmessen lässt sich PT hier, ausrechnen erst in Klasse 9 mit dem Satz des Pythagoras.";
}

// ---------- 5b. Die Tangenten selbst konstruieren ----------
//
// Aufgebaut wie Abschnitt 4: erst die Anleitung Schritt für Schritt ansehen, dann selbst mit
// Zirkel und Lineal bauen. Geprüft wird mit demselben Modell wie Übungsaufgabe 3 in Abschnitt 8
// (TANGENTEN_TASK) — dort liegt die Vorgabe fest, hier sind M und P ziehbar.

const TK_R_MIN = 52, TK_R_MAX = 86;  // Radius des gegebenen Kreises k
const TK_ABSTAND = 46;               // so weit muss P mindestens außerhalb von k liegen
const TK_RAND = 10;                  // Sicherheitsabstand zum Rand der Zeichenfläche

// Größtes t ∈ [0, 1], für das a + t·b noch zwischen lo und hi liegt.
function tBis(a, b, lo, hi) {
  let t = 1;
  if (b > 1e-9) t = Math.min(t, (hi - a) / b);
  if (b < -1e-9) t = Math.min(t, (lo - a) / b);
  return Math.max(0, t);
}

// Der Thaleskreis über der Strecke vom Anker nach (Anker + t·v) wächst mit t. Gesucht ist das
// größte t, bei dem er noch ganz auf die Fläche passt. Seine vier Randwerte sind linear in t
// (Mittelpunkt Anker + t·v/2, Radius t·|v| : 2), das lässt sich also direkt ausrechnen — Ziehen
// und Verwerfen wäre hier weder nötig noch verlässlich.
function tThalesPasst(anker, v, W, H, rand) {
  const L = Math.hypot(v.x, v.y);
  if (L < 1e-9) return 0;
  return Math.min(
    tBis(anker.x, (v.x - L) / 2, rand, W - rand),
    tBis(anker.x, (v.x + L) / 2, rand, W - rand),
    tBis(anker.y, (v.y - L) / 2, rand, H - rand),
    tBis(anker.y, (v.y + L) / 2, rand, H - rand),
  );
}

// Eine Lage, bei der alles auf die Fläche passt: der Kreis k, der Punkt P außerhalb und der
// Thaleskreis über MP. Konstruktiv statt durch Verwerfen: Der Thaleskreis liegt ganz in der
// Kreisscheibe um M mit dem Radius d, also genügt „d ≤ Abstand von M zum Rand“.
function zufallsLage(W, H) {
  const r = TK_R_MIN + Math.random() * (TK_R_MAX - TK_R_MIN);
  const randM = r + TK_ABSTAND + TK_RAND;
  const M = { x: randM + Math.random() * (W - 2 * randM), y: randM + Math.random() * (H - 2 * randM) };
  const platz = Math.min(M.x, W - M.x, M.y, H - M.y) - TK_RAND;
  const dMin = r + TK_ABSTAND;
  const d = dMin + Math.random() * Math.max(0, platz - dMin);
  const winkel = Math.random() * 2 * Math.PI;
  return { M, r, P: GC.add(M, { x: d * Math.cos(winkel), y: d * Math.sin(winkel) }) };
}

// Der gezogene Punkt, auf eine zulässige Lage zurückgeholt: erst in die Fläche, dann so weit an den
// Anker heran, dass der Thaleskreis noch hineinpasst. Bleibt dabei zu wenig Abstand, kommt null
// zurück — die Bewegung wird dann gar nicht übernommen, statt in eine Lage ohne Berührpunkte zu
// führen.
function zulaessigeLage(anker, roh, r, W, H, box) {
  const p = GC.clampToBox(roh, W, H, box);
  const v = GC.sub(p, anker);
  const L = GC.len(v);
  const d = tThalesPasst(anker, v, W, H, TK_RAND) * L;
  if (d < r + TK_ABSTAND) return null;
  return GC.add(anker, GC.scale(GC.norm(v), d));
}

// Ziehbare Vorgabe: der Kreismittelpunkt M und der äußere Punkt P.
function setupZiehbareLage(svg, layer, W, H, start, onUpdate) {
  const lage = { M: start.M, r: start.r, P: start.P };
  const handles = {};
  const state = { locked: false };

  function beschrifte() {
    // Beide Buchstaben zeigen voneinander weg; M zusätzlich über seinen Kreis hinaus.
    richteBeschriftung(handles.M.g, GC.sub(lage.M, lage.P), lage.r + 14);
    richteBeschriftung(handles.P.g, GC.sub(lage.P, lage.M));
  }

  function ziehe(key, x, y) {
    if (state.locked) return;
    const anker = key === "M" ? lage.P : lage.M;
    const box = key === "M" ? lage.r + 12 : 22;
    const neu = zulaessigeLage(anker, { x, y }, lage.r, W, H, box);
    if (!neu) return;
    lage[key] = neu;
    handles[key].update(neu);
    beschrifte();
    onUpdate(lage);
  }

  ["M", "P"].forEach((key) => {
    handles[key] = GS.drawDraggablePoint(svg, layer, lage[key], key, (x, y) => ziehe(key, x, y));
  });
  beschrifte();

  return {
    lage,
    setLocked(locked) {
      state.locked = locked;
      Object.values(handles).forEach((h) => h.g.classList.toggle("geo-point-locked", locked));
    },
    randomize() {
      const s = zufallsLage(W, H);
      lage.M = s.M;
      lage.r = s.r;
      lage.P = s.P;
      handles.M.update(lage.M);
      handles.P.update(lage.P);
      beschrifte();
      onUpdate(lage);
    },
  };
}

const TK_NOTIZ = {
  1: "Die Mittelsenkrechte von <strong>MP</strong> liefert die Mitte <strong>Z</strong> der Strecke MP. Geschätzt werden darf sie nicht — ein Thaleskreis um eine ungefähre Mitte ginge weder durch M noch durch P, und seine Schnittpunkte mit k wären keine Berührpunkte.",
  2: "Der Kreis um Z durch M und P ist der <strong>Thaleskreis über MP</strong>. Auf ihm liegt jeder Punkt, der die Strecke MP unter einem rechten Winkel sieht. Wo er den gegebenen Kreis k schneidet, gilt beides zugleich: Der Punkt liegt auf k <em>und</em> sieht MP unter 90° — das sind die Berührpunkte <strong>T₁</strong> und <strong>T₂</strong>.",
  3: "Die Geraden <strong>PT₁</strong> und <strong>PT₂</strong> sind die gesuchten Tangenten: Sie treffen k in einem Punkt, und dort stehen sie senkrecht auf dem Radius. Ziehe M oder P — die Berührpunkte wandern mit, der rechte Winkel bleibt.",
};

function setupTangentenKonstruktion() {
  const svg = document.getElementById("tk-svg");
  const layerFigure = document.getElementById("tk-layer-figure");
  const layerConstruct = document.getElementById("tk-layer-construct");
  const layerCenters = document.getElementById("tk-layer-centers");
  const layerUser = document.getElementById("tk-layer-user");
  const layerVertices = document.getElementById("tk-layer-vertices");
  const toggleArcs = document.getElementById("tk-toggle-arcs");
  const countTabs = document.getElementById("tk-count-tabs");
  const phaseTabs = document.getElementById("tk-phase-tabs");
  const instructionBox = document.getElementById("tk-instruction");
  const stepsList = document.getElementById("tk-steps");
  const guidedControls = document.getElementById("tk-guided-controls");
  const guidedToggleRow = document.getElementById("tk-guided-toggle-row");
  const guidedToolbar = document.getElementById("tk-guided-toolbar");
  const freeControls = document.getElementById("tk-free-controls");

  let phase = "guided";
  let count = 1;

  // Die Angabe: der gegebene Kreis mit seinem Namen. M und P selbst sind die Ziehpunkte und liegen
  // auf einer eigenen Ebene — sonst verschwänden sie beim Neuzeichnen der Angabe.
  function zeichneAngabe(lage) {
    GS.drawCircle(layerFigure, lage.M, lage.r, "th-gegeben-kreis");
    layerFigure.appendChild(beschriftung(lage.M.x, lage.M.y - lage.r - 10, "k"));
  }

  function renderGuided(lage) {
    GS.clearEl(layerFigure);
    GS.clearEl(layerConstruct);
    GS.clearEl(layerCenters);
    zeichneAngabe(lage);

    const g = tangentenFigur(lage.M, lage.r, lage.P);
    GS.drawSegment(layerConstruct, g.M, g.P, "th-hilfsstrecke");
    drawMittelsenkrechte(layerConstruct, K_W, K_H, g.M, g.P, toggleArcs.checked);
    // Durch Z laufen zwei Linien, und sie stehen senkrecht aufeinander: die Strecke MP und ihre
    // Mittelsenkrechte. Der Buchstabe geht deshalb schräg dazwischen, sonst liegt er auf einer der
    // beiden.
    const langs = GC.norm(GC.sub(g.P, g.M));
    let quer = GC.perp(langs);
    if (quer.y > 0) quer = GC.scale(quer, -1);
    richteBeschriftung(GS.drawPoint(layerCenters, g.Z, "Z"), GC.norm(GC.add(langs, GC.scale(quer, -1))));

    if (count >= 2 && g.T1 && g.T2) {
      GS.drawCircle(layerConstruct, g.Z, g.d / 2, "geo-circle geo-umkreis");
      richteBeschriftung(GS.drawPoint(layerCenters, g.T1, "T₁"), GC.sub(g.T1, g.M));
      richteBeschriftung(GS.drawPoint(layerCenters, g.T2, "T₂"), GC.sub(g.T2, g.M));
    }
    if (count >= 3 && g.T1 && g.T2) {
      for (const T of [g.T1, g.T2]) {
        GS.drawLine(layerConstruct, g.P, GC.sub(T, g.P), { w: K_W, h: K_H }, "geo-construct th-schenkel");
        GS.drawSegment(layerConstruct, g.M, T, "geo-construct th-schenkel");
        GS.drawRightAngleMarker(layerConstruct, T, g.M, g.P, "geo-hoehe");
      }
    }
  }

  function renderNote() {
    instructionBox.innerHTML = `<p>${TK_NOTIZ[count]}</p><p class="geo-why">${TANGENTEN_TASK.why}</p>`;
    stepsList.innerHTML = TANGENTEN_TASK.schritte.map((s) => `<li>${s}</li>`).join("");
  }

  const vorgabe = setupZiehbareLage(svg, layerVertices, K_W, K_H, zufallsLage(K_W, K_H), (lage) => {
    if (phase === "guided") {
      renderGuided(lage);
    } else {
      GS.clearEl(layerFigure);
      zeichneAngabe(lage);
    }
  });

  // Die Figur wird bei jedem Zugriff frisch aus der aktuellen Lage gerechnet: Beim Ziehen von M
  // oder P wandern die Berührpunkte mit, und die Prüfung muss die neuen meinen.
  const figur = () => tangentenFigur(vorgabe.lage.M, vorgabe.lage.r, vorgabe.lage.P);

  const free = setupFreeConstruction({
    svg,
    layer: layerUser,
    els: {
      btnToolCircle: document.getElementById("tk-circle"),
      btnToolLine: document.getElementById("tk-line"),
      btnUndo: document.getElementById("tk-undo"),
      btnClear: document.getElementById("tk-clear"),
      btnCheck: document.getElementById("tk-check"),
      btnHint: document.getElementById("tk-hint"),
      chkLockRadius: document.getElementById("tk-lock"),
      btnResetRadius: document.getElementById("tk-reset-radius"),
      radiusStatus: document.getElementById("tk-radius"),
      pendingStatus: document.getElementById("tk-pending"),
      feedbackBox: document.getElementById("tk-feedback"),
    },
    model: () => TANGENTEN_TASK.analyse(free.tool, figur()),
    check: () => TANGENTEN_TASK.pruefe(TANGENTEN_TASK.analyse(free.tool, figur())),
  });

  function enterFree() {
    GS.clearEl(layerConstruct);
    GS.clearEl(layerCenters);
    GS.clearEl(layerFigure);
    zeichneAngabe(vorgabe.lage);
    instructionBox.innerHTML = `<p>${TANGENTEN_TASK.aufgabe}</p><p class="geo-why">${TANGENTEN_TASK.why}</p>`;
    stepsList.innerHTML = TANGENTEN_TASK.schritte.map((s) => `<li>${s}</li>`).join("");
    free.reset();
  }

  renderGuided(vorgabe.lage);
  renderNote();

  toggleArcs.addEventListener("change", () => renderGuided(vorgabe.lage));
  document.getElementById("tk-new").addEventListener("click", () => vorgabe.randomize());
  document.getElementById("tk-new-free").addEventListener("click", () => {
    // Für das Neuwürfeln kurz entsperren — sonst bliebe die Lage stehen.
    vorgabe.setLocked(false);
    vorgabe.randomize();
    vorgabe.setLocked(true);
    enterFree();
  });

  countTabs.addEventListener("click", (e) => {
    const btn = e.target.closest(".geo-mode-tab[data-count]");
    if (!btn) return;
    count = Number(btn.dataset.count);
    [...countTabs.children].forEach((b) => b.classList.toggle("geo-mode-tab-active", b === btn));
    renderGuided(vorgabe.lage);
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
    vorgabe.setLocked(phase === "free");
    if (phase === "guided") {
      renderGuided(vorgabe.lage);
      renderNote();
    } else {
      enterFree();
    }
  });

  setupCanvasZoom(document.getElementById("tk-zoom").closest(".card"), document.getElementById("tk-zoom"));
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
      "Nach der Umkehrung liegt C auf dem Thaleskreis über AB. Dessen Mittelpunkt ist die Mitte von AB, sein Radius die halbe Strecke — also 6 cm, und zwar unabhängig von der Form des Dreiecks. Genau deshalb ist die Mitte der längsten Seite der Umkreismittelpunkt.",
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

// ---------- Aufgaben-Definitionen ----------

// Pythagoreische Grundtripel. Gebraucht werden sie nur noch, damit in Aufgabe 4 alle drei
// Seiten und die Höhe glatte Zahlen sind — gerechnet wird auf dieser Seite nirgends mit dem
// Satz des Pythagoras: Er steht ebenso wie das Wurzelziehen erst in Klasse 9 an.
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

// Aufgabe 2 — Umkreisradius und längste Seite. Beide Richtungen derselben Einsicht: Der
// Umkreismittelpunkt eines rechtwinkligen Dreiecks ist die Mitte der Seite, die dem rechten
// Winkel gegenüberliegt; sein Radius ist die Hälfte davon. Gerechnet wird nur halbiert oder
// verdoppelt — die Namen „Hypotenuse“ und „Kathete“ kommen erst in Klasse 9 dazu.
const A2_KANDIDATEN = (() => {
  const liste = [];
  for (let c = 6; c <= 40; c += 2) {
    liste.push({ richtung: "radius", c, r: c / 2 });
    liste.push({ richtung: "seite", c, r: c / 2 });
  }
  return liste;
})();

function generateAufgabe2() {
  const k = ohneKollision(A2_KANDIDATEN, (v) => [v.c, v.r, v.c * 2, v.r / 2], A2_KANDIDATEN[0]);
  const { richtung, c, r } = k;
  const nachRadius = richtung === "radius";
  const loesung = nachRadius ? r : c;
  return {
    promptHtml: nachRadius
      ? `Ein Dreieck ABC hat bei C einen <strong>rechten Winkel</strong>; die Seite <strong>AB ist ${num(c)} cm</strong> lang.<br>` +
        `<strong>Wie weit ist C von der Mitte der Strecke AB entfernt?</strong> Antwort in Zentimetern.`
      : `Ein Dreieck ABC hat bei C einen <strong>rechten Winkel</strong>. Sein <strong>Umkreis hat den Radius ${num(r)} cm</strong>.<br>` +
        `<strong>Wie lang ist die Seite AB?</strong> Antwort in Zentimetern.`,
    correct: loesung,
    tolerance: 0.01,
    placeholder: nachRadius ? "Abstand in cm" : "AB in cm",
    hinweis: (raw, val) => {
      if (nachRadius && trifft(val, c))
        return `${num(c)} cm ist die <strong>ganze</strong> Strecke AB. Gefragt ist der Abstand bis zu ihrer <em>Mitte</em> — also die Hälfte.`;
      if (!nachRadius && trifft(val, r))
        return `${num(r)} cm ist der <strong>gegebene</strong> Radius. Die Seite AB ist doppelt so lang, denn sie ist der Durchmesser des Umkreises.`;
      if (trifft(val, nachRadius ? c * 2 : r / 2))
        return `Du hast in die falsche Richtung gerechnet: ${nachRadius ? "verdoppelt statt halbiert" : "halbiert statt verdoppelt"}.`;
      if (trifft(val, nachRadius ? c / 4 : c * 2))
        return `Zweimal halbiert bzw. zweimal verdoppelt — einmal genügt.`;
      return `Nach der Umkehrung des Satzes von Thales liegt C auf dem Kreis über AB. Sein Mittelpunkt ist die Mitte von AB, sein Radius die halbe Strecke AB.`;
    },
    musterloesungHtml: nachRadius
      ? `<strong>1. Umkehrung des Satzes von Thales:</strong> Der Winkel bei C ist ein rechter, also liegt C auf dem Thaleskreis über AB.<br>` +
        `<strong>2. Mittelpunkt:</strong> Der Mittelpunkt dieses Kreises ist die <strong>Mitte von AB</strong> — genau der Punkt, von dem der Abstand gesucht ist.<br>` +
        `<strong>3. Radius:</strong> MC = r = AB : 2 = ${num(c)} cm : 2 = <strong>${num(r)} cm</strong><br>` +
        `<em>Merke:</em> Der Abstand hängt nicht davon ab, wie flach oder steil das Dreieck ist — er ist immer die Hälfte der längsten Seite.`
      : `<strong>1. Umkehrung des Satzes von Thales:</strong> Der Winkel bei C ist ein rechter, also ist AB der <strong>Durchmesser</strong> des Umkreises.<br>` +
        `<strong>2. Durchmesser:</strong> AB = 2 · r = 2 · ${num(r)} cm = <strong>${num(c)} cm</strong><br>` +
        `<em>Merke:</em> Der Umkreismittelpunkt ist die Mitte der längsten Seite, der Umkreisradius die Hälfte davon — beim rechtwinkligen Dreieck liegt M also auf dem Rand.`,
  };
}

// Aufgabe 3 — die Winkel am Mittelpunkt. Das ist die Beweisfigur: Der Strich MC zerlegt das
// Dreieck in zwei gleichschenklige Teile, und der Winkel bei M ist der Außenwinkel des einen.
// Gefragt wird abwechselnd nach ∡AMC und nach ∡CMB.
const A3_KANDIDATEN = (() => {
  const liste = [];
  for (let a = 15; a <= 75; a += 5) {
    if (a === 45) continue;      // sonst fielen ∡AMC und ∡CMB zusammen
    liste.push({ alpha: a, ziel: "AMC" });
    liste.push({ alpha: a, ziel: "CMB" });
  }
  return liste;
})();

function generateAufgabe3() {
  const k = ohneKollision(
    A3_KANDIDATEN,
    (v) => [180 - 2 * v.alpha, 2 * v.alpha, v.alpha, 90 - v.alpha, 90],
    A3_KANDIDATEN[0],
  );
  const { alpha, ziel } = k;
  const beta = 90 - alpha;
  const amc = 180 - 2 * alpha, cmb = 2 * alpha;
  const nachAMC = ziel === "AMC";
  const loesung = nachAMC ? amc : cmb;
  return {
    promptHtml:
      `Über der Strecke AB wird der Thaleskreis mit dem Mittelpunkt <strong>M</strong> gezeichnet; C liegt auf dem Kreis, und <strong>MC ist eingezeichnet</strong>.<br>` +
      `Der Winkel bei A ist <strong>α = ${num(alpha)}°</strong>.<br>` +
      `<strong>Wie groß ist der Winkel ${nachAMC ? "∡AMC" : "∡CMB"}?</strong> Antwort in Grad, ohne Gradzeichen.`,
    correct: loesung,
    tolerance: 0.01,
    placeholder: "Winkel in Grad",
    hinweis: (raw, val) => {
      if (trifft(val, nachAMC ? cmb : amc))
        return `Das ist der <strong>andere</strong> Winkel bei M: ${nachAMC ? "∡CMB" : "∡AMC"}. Beide zusammen ergeben 180°, denn A, M und B liegen auf einer Geraden.`;
      if (trifft(val, alpha))
        return `${num(alpha)}° ist der gegebene Winkel bei A. Er ist zwar auch der Basiswinkel bei C im Dreieck AMC — aber nicht der Winkel an dessen Spitze M.`;
      if (trifft(val, beta))
        return `${num(beta)}° ist der Winkel bei B. Gefragt ist ein Winkel bei <strong>M</strong>.`;
      if (trifft(val, 90))
        return `90° ist der Winkel bei C. Bei M steht nur dann ein rechter Winkel, wenn C genau über der Mitte liegt — also bei α = 45°.`;
      return `MA = MC = r macht das Dreieck AMC gleichschenklig: Bei A und bei C steht je α. Die Winkelsumme liefert ∡AMC, und ∡CMB ist sein Nebenwinkel.`;
    },
    musterloesungHtml:
      `<strong>1. Gleichschenkliges Dreieck:</strong> MA = MC = r, also hat AMC bei A und bei C denselben Winkel α = ${num(alpha)}°.<br>` +
      `<strong>2. Winkelsumme in AMC:</strong> ∡AMC = 180° − 2 · ${num(alpha)}° = <strong>${num(amc)}°</strong><br>` +
      `<strong>3. Nebenwinkel:</strong> A, M und B liegen auf einer Geraden, also ∡CMB = 180° − ${num(amc)}° = <strong>${num(cmb)}°</strong><br>` +
      `<em>Gesucht war ${nachAMC ? "∡AMC" : "∡CMB"}:</em> <strong>${num(loesung)}°</strong><br>` +
      `<em>Probe über das zweite Teildreieck:</em> BMC ist ebenfalls gleichschenklig, seine Basiswinkel sind je β = 90° − ${num(alpha)}° = ${num(beta)}°, ` +
      `und ${num(beta)}° + ${num(beta)}° + ${num(cmb)}° = 180° ✓`,
  };
}

// Aufgabe 4 — die Höhe auf AB, über den Flächeninhalt. Alle drei Seiten sind gegeben,
// gerechnet wird nur mit der Fläche: Dasselbe Dreieck, zweimal als Grundseite mal Höhe gelesen.
// Die Zahlen stammen aus pythagoreischen Tripeln, damit die Höhe glatt aufgeht.
//
// Glatt geht die Höhe nur auf, wenn die längste Seite ein Teiler von 100 · a · b ist — das trifft
// von den Tripeln oben nur (3, 4, 5) und (7, 24, 25) samt ihren Vielfachen. Dafür sind bei
// beiden ALLE Vielfachen brauchbar, solange das Dreieck nicht ins Riesenhafte wächst.
const A4_KANDIDATEN = (() => {
  const liste = [];
  for (const [x, y, z] of TRIPEL) {
    for (let t = 1; t <= 12; t++) {
      const c = z * t;
      if (c > 70) continue;
      for (const [a, b] of [[y * t, x * t], [x * t, y * t]]) {
        const h = (a * b) / c;
        if (Math.round(h * 100) !== h * 100) continue;
        // Höhe und Radius dürfen nicht dicht beieinanderliegen: Bei 3/4/5 wären es 2,4 und 2,5,
        // und der Hinweis „das ist der Radius“ träfe eine Zahl, die kaum zu unterscheiden ist.
        if (Math.abs(h - c / 2) < 0.2) continue;
        liste.push({ a, b, c, h });
      }
    }
  }
  return liste;
})();

function generateAufgabe4() {
  const k = ohneKollision(
    A4_KANDIDATEN,
    (v) => [v.h, (v.a * v.b) / 2, v.a * v.b, v.c / 2, (v.a + v.b) / 2],
    A4_KANDIDATEN[0],
  );
  const { a, b, c, h } = k;
  const flaeche = (a * b) / 2;
  return {
    promptHtml:
      `Über der Strecke AB mit <strong>AB = ${num(c)} cm</strong> wird der Thaleskreis gezeichnet; C liegt auf ihm. ` +
      `Die beiden anderen Seiten sind <strong>AC = ${num(b)} cm</strong> und <strong>BC = ${num(a)} cm</strong>.<br>` +
      `<strong>Wie hoch liegt C über der Strecke AB?</strong> Gemeint ist die Höhe auf AB. Antwort in Zentimetern.`,
    correct: h,
    tolerance: 0.01,
    placeholder: "Höhe in cm",
    hinweis: (raw, val) => {
      if (trifft(val, flaeche))
        return `${num(flaeche)} cm² ist der <strong>Flächeninhalt</strong> des Dreiecks — ein Zwischenergebnis. Aus ihm folgt die Höhe erst, wenn du ihn noch einmal als „AB mal Höhe durch 2“ liest.`;
      if (trifft(val, a * b))
        return `Du hast die <strong>Halbierung vergessen</strong>. ${num(a)} · ${num(b)} ist die Fläche des Rechtecks aus den beiden kürzeren Seiten, das Dreieck ist halb so groß.`;
      if (trifft(val, c / 2))
        return `${num(c / 2)} cm ist der <strong>Radius</strong> des Thaleskreises. So hoch läge C nur, wenn es genau über der Mitte von AB stünde — das ist die größtmögliche Höhe, aber nicht diese hier.`;
      if (trifft(val, (a + b) / 2))
        return `Der Mittelwert der beiden kürzeren Seiten ist nicht die Höhe. Rechne über den Flächeninhalt.`;
      return `Weil der Winkel bei C ein rechter ist, stehen die Seiten AC und BC senkrecht aufeinander — sie sind also Grundseite und Höhe zueinander. Damit lässt sich die Fläche ausrechnen, und dieselbe Fläche noch einmal mit AB als Grundseite.`;
    },
    musterloesungHtml:
      `<strong>1. Satz des Thales:</strong> C liegt auf dem Thaleskreis über AB ⟹ der Winkel bei C ist 90°. Die beiden Seiten AC und BC stehen also <strong>senkrecht aufeinander</strong>.<br>` +
      `<strong>2. Fläche über AC und BC:</strong> Damit ist die eine Grundseite und die andere die zugehörige Höhe:<br>` +
      `A = (${num(b)} · ${num(a)}) : 2 = <strong>${num(flaeche)} cm²</strong><br>` +
      `<strong>3. Dieselbe Fläche über AB:</strong> A = (AB · h) : 2, also (${num(c)} · h) : 2 = ${num(flaeche)}<br>` +
      `<strong>4. Auflösen:</strong> h = 2 · ${num(flaeche)} : ${num(c)} = <strong>${num(h)} cm</strong><br>` +
      `<em>Kontrolle:</em> Die Höhe ist kleiner als der Radius ${num(c / 2)} cm — höher als bis zur Mitte des Bogens kommt C nie.`,
  };
}

function initExercises() {
  mountUebungsaufgaben(document.getElementById("exercises-mount"), [
    { schwierigkeit: "einfach", titel: "Aufgabe 1 — der zweite spitze Winkel", generate: generateAufgabe1 },
    { schwierigkeit: "mittel", titel: "Aufgabe 2 — Umkreisradius und längste Seite", generate: generateAufgabe2 },
    { schwierigkeit: "schwierig", titel: "Aufgabe 3 — die Winkel am Mittelpunkt", generate: generateAufgabe3 },
    { schwierigkeit: "komplex", titel: "Aufgabe 4 — wie hoch liegt C?", generate: generateAufgabe4 },
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
setupTangentenKonstruktion();
initQuizzes();
initExercises();
mountKonstruktionsAufgaben(document.getElementById("ka-mount"));
mountRechenAufgaben(document.getElementById("rechen-mount"));
mountHeftAufgaben(document.getElementById("heft-mount"));
