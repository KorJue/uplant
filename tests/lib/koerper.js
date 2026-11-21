// Raumrechnung für die Prüfungen der Körperseiten (Klasse 8, Körper).
//
// Die Seiten legen an jede gezeichnete Fläche und Kante ihre Raumpunkte (data-p3). Hier steht, was
// die Prüfungen damit EIGENS nachrechnen — mit anderen Verfahren als die Seite (raum.js): Flächen über
// Dreiecksfächer statt nach Newell, Verdeckung über einen Strahl zum Betrachter statt über Normalen,
// das Kavalierbild aus zwei Punkten zurückgerechnet.

"use strict";

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len = (a) => Math.hypot(...a);
const dist = (a, b) => len(sub(a, b));
const schwer = (pts) => mul(pts.reduce((s, p) => add(s, p), [0, 0, 0]), 1 / pts.length);
const gleichP = (a, b, eps = 1e-3) => dist(a, b) < eps;
// Normale aus drei nicht kollinearen Ecken.
function normaleVon(pts) {
  for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) for (let k = j + 1; k < pts.length; k++) {
    const n = cross(sub(pts[j], pts[i]), sub(pts[k], pts[i]));
    if (len(n) > 1e-6) return mul(n, 1 / len(n));
  }
  return null;
}
// Flächeninhalt eines ebenen Vielecks im Raum: Dreiecksfächer.
function inhalt3(pts) {
  let s = [0, 0, 0];
  for (let i = 1; i + 1 < pts.length; i++) s = add(s, cross(sub(pts[i], pts[0]), sub(pts[i + 1], pts[0])));
  return len(s) / 2;
}
const abstaende = (pts) => { const d = []; for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) d.push(dist(pts[i], pts[j])); return d; };
const starrGleich = (p, q, eps = 2e-3) => p.length === q.length && abstaende(p).every((d, i) => Math.abs(d - abstaende(q)[i]) < eps);

// Liegt X im konvexen ebenen Vieleck (echt innen, mit Rand eps)?
function imVieleck(X, pts, eps = 1e-5) {
  const n = normaleVon(pts);
  let vz = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    const s = dot(cross(sub(b, a), sub(X, a)), n) / (dist(a, b) || 1);
    if (Math.abs(s) < eps) return false;
    const v = Math.sign(s);
    if (vz === 0) vz = v; else if (v !== vz) return false;
  }
  return true;
}
// Kavalierprojektion 45°, Verkürzung ½: Der Strahl zum Betrachter läuft nach vorn rechts oben.
const C45 = 0.5 * Math.SQRT1_2;
const ZUM_BETRACHTER = [C45, C45, -1];
// Ist die Strecke p–q verdeckt? Ein Strahl von ihrer Mitte zum Betrachter trifft eine Fläche. Die
// Raumpunkte sind auf 10⁻⁴ gerundet: Ein Treffer zählt erst ab λ > 10⁻³ und deutlich innen — sonst
// träfe der Strahl einer Kante die eigene Fläche, in deren Rand er wegen der Rundung beginnt.
function verdeckt(p, q, flaechen) {
  const m = mul(add(p, q), 0.5);
  for (const f of flaechen) {
    const n = normaleVon(f);
    const nv = dot(n, ZUM_BETRACHTER);
    if (Math.abs(nv) < 1e-9) continue;
    const lam = dot(n, sub(f[0], m)) / nv;
    if (lam <= 1e-3) continue;
    if (imVieleck(add(m, mul(ZUM_BETRACHTER, lam)), f, 1e-3)) return true;
  }
  return false;
}
const kantenSchluessel = (p, q) => { const a = p.map((x) => x.toFixed(3)).join(","), b = q.map((x) => x.toFixed(3)).join(","); return a < b ? a + "|" + b : b + "|" + a; };

const lies = (page, mount) => page.evaluate((m) => [...document.querySelectorAll(`#${m} [data-p3]`)].map((e) => ({
  tag: e.tagName, rolle: e.dataset.rolle, nr: e.dataset.nr, sichtbar: e.dataset.sichtbar, klasse: e.getAttribute("class") || "",
  p3: e.dataset.p3.trim().split(/\s+/).map((s) => s.split(",").map(Number)),
  p2: e.tagName === "line"
    ? [[+e.getAttribute("x1"), +e.getAttribute("y1")], [+e.getAttribute("x2"), +e.getAttribute("y2")]]
    : e.getAttribute("points").trim().split(/\s+/).map((s) => s.split(",").map(Number)),   // polygon und polyline
})), mount);
const texte = (page, mount, rolle) => page.evaluate(([m, r]) => [...document.querySelectorAll(`#${m} text[data-rolle="${r}"]`)].map((e) => ({ text: e.textContent, nr: e.dataset.nr, an: e.dataset.an })), [mount, rolle]);
const rolleText = (page, sel) => page.evaluate((s) => { const e = document.querySelector(s); return e ? e.textContent : null; }, sel);
const waehle = (page, id, wert) => page.evaluate(([i, w]) => {
  const e = document.getElementById(i);
  e.value = w;
  e.dispatchEvent(new Event("input", { bubbles: true }));
}, [id, wert]);

// Die Zeichnung als Kavalierbild der Raumpunkte: Maßstab und Ursprung aus zwei Punkten, dann jeder
// Punkt nachgerechnet. Liefert den Maßstab S (Bildpunkte je cm).
function kavalierBild(pruefe, teile, wo) {
  const paare = teile.flatMap((t) => t.p3.map((p, i) => ({ p, b: t.p2[i] })));
  const X = (p) => p[0] + C45 * p[2], Y = (p) => p[1] + C45 * p[2];
  let a = paare[0], z = paare[0];
  for (const q of paare) if (Math.abs(X(q.p) - X(a.p)) > Math.abs(X(z.p) - X(a.p))) z = q;
  const S = (z.b[0] - a.b[0]) / (X(z.p) - X(a.p));
  const ox = a.b[0] - S * X(a.p), oy = a.b[1] + S * Y(a.p);
  let schlecht = 0;
  for (const q of paare) if (Math.abs(ox + S * X(q.p) - q.b[0]) > 0.05 || Math.abs(oy - S * Y(q.p) - q.b[1]) > 0.05) schlecht++;
  pruefe(Number.isFinite(S) && S > 0 && schlecht === 0, `${wo}: ${schlecht} Bildpunkte passen nicht zum Kavalierbild (45°, ½) ihrer Raumpunkte`);
  return S;
}

// Verdeckte Kanten eines geschlossenen Körpers aus der Zeichnung prüfen: alle Flächen (auch die
// unsichtbaren) gegen die gestrichelten und durchgezogenen Kanten.
function pruefeVerdeckt(pruefe, teile, wo) {
  const flaechen = teile.filter((t) => t.tag === "polygon").map((t) => t.p3);
  const kanten = teile.filter((t) => t.tag === "line" && /^kante/.test(t.rolle || ""));
  let falsch = 0;
  for (const k of kanten) if (verdeckt(k.p3[0], k.p3[1], flaechen) !== (k.rolle === "kante-verdeckt")) falsch++;
  pruefe(falsch === 0, `${wo}: ${falsch} Kanten sind falsch als sichtbar oder verdeckt gezeichnet`);
  // Sichtbar gezeichnete Flächen müssen dem Betrachter zugewandt sein, unsichtbare abgewandt.
  const mitte = schwer(flaechen.flat());
  let fl = 0;
  for (const t of teile.filter((x) => x.tag === "polygon" && x.sichtbar !== undefined)) {
    let n = normaleVon(t.p3);
    if (dot(n, sub(schwer(t.p3), mitte)) < 0) n = mul(n, -1);
    if ((dot(n, ZUM_BETRACHTER) > 1e-9) !== (t.sichtbar === "1")) fl++;
  }
  pruefe(fl === 0, `${wo}: ${fl} Flächen sind falsch als sichtbar oder unsichtbar gekennzeichnet`);
  return kanten;
}
function eckenVon(kanten) {
  const s = new Set();
  for (const k of kanten) for (const p of k.p3) s.add(p.map((x) => x.toFixed(3)).join(","));
  return s.size;
}
const istRechteck = (pts, a, b, eps = 2e-3) => pts.length === 4 &&
  [[0, 1], [2, 3]].every(([i, j]) => Math.abs(dist(pts[i], pts[j]) - a) < eps) &&
  [[1, 2], [3, 0]].every(([i, j]) => Math.abs(dist(pts[i], pts[j]) - b) < eps) &&
  Math.abs(dist(pts[0], pts[2]) - dist(pts[1], pts[3])) < eps;

// Überdecken sich zwei konvexe Vielecke (Bildpunkte) um mehr als 0,5 px? Trennachsen-Test.
function ueberdecken(p, q) {
  for (const poly of [p, q]) {
    for (let i = 0; i < poly.length; i++) {
      const [x1, y1] = poly[i], [x2, y2] = poly[(i + 1) % poly.length];
      const nn = [y2 - y1, x1 - x2], l = Math.hypot(...nn);
      if (l < 1e-9) continue;
      const proj = (pts) => pts.map(([x, y]) => (x * nn[0] + y * nn[1]) / l);
      const a = proj(p), b = proj(q);
      if (Math.max(...a) - Math.min(...b) < 0.5 || Math.max(...b) - Math.min(...a) < 0.5) return false;
    }
  }
  return true;
}
const gemeinsameEcken = (p, q) => p.filter((a) => q.some((b) => gleichP(a, b))).length;


// Die senkrechte Ansicht schräg von oben (Erhebung ε, Drehung ψ um die senkrechte Achse) — für die
// Zylinderseiten. Wie kavalierBild: Maßstab und Ursprung aus zwei Punkten, dann jeder Punkt.
function ansichtBild(pruefe, teile, epsGrad, psiGrad, wo) {
  const e = (epsGrad * Math.PI) / 180, w = (psiGrad * Math.PI) / 180;
  const X = (p) => p[0] * Math.cos(w) - p[2] * Math.sin(w);
  const Y = (p) => p[1] * Math.cos(e) + (p[0] * Math.sin(w) + p[2] * Math.cos(w)) * Math.sin(e);
  const paare = teile.flatMap((t) => t.p3.map((p, i) => ({ p, b: t.p2[i] })));
  let a = paare[0], z = paare[0];
  for (const q of paare) if (Math.abs(X(q.p) - X(a.p)) > Math.abs(X(z.p) - X(a.p))) z = q;
  const S = (z.b[0] - a.b[0]) / (X(z.p) - X(a.p));
  const ox = a.b[0] - S * X(a.p), oy = a.b[1] + S * Y(a.p);
  let schlecht = 0;
  for (const q of paare) if (Math.abs(ox + S * X(q.p) - q.b[0]) > 0.05 || Math.abs(oy - S * Y(q.p) - q.b[1]) > 0.05) schlecht++;
  pruefe(Number.isFinite(S) && S > 0 && schlecht === 0, `${wo}: ${schlecht} Bildpunkte passen nicht zur Ansicht (ε = ${epsGrad.toFixed(1)}°, ψ = ${psiGrad.toFixed(1)}°) ihrer Raumpunkte`);
  return S;
}

// Ansichten: Bildabstände = S · Raumabstände für alle Kanten aller Flächen (wahre Größe).
function wahreGroesse(teile, S, eps = 0.1) {
  let falsch = 0;
  for (const x of teile.filter((t) => t.tag === "polygon")) for (let i = 0; i < x.p3.length; i++) {
    const j = (i + 1) % x.p3.length;
    if (Math.abs(Math.hypot(x.p2[j][0] - x.p2[i][0], x.p2[j][1] - x.p2[i][1]) - S * dist(x.p3[i], x.p3[j])) > eps) falsch++;
  }
  return falsch;
}
// Maßstab aus der längsten Kante einer Fläche (Bild : Raum).
function massstab(teile) {
  let best = null;
  for (const x of teile.filter((t) => t.tag === "polygon")) for (let i = 0; i < x.p3.length; i++) {
    const j = (i + 1) % x.p3.length, d = dist(x.p3[i], x.p3[j]);
    if (!best || d > best.d) best = { d, b: Math.hypot(x.p2[j][0] - x.p2[i][0], x.p2[j][1] - x.p2[i][1]) };
  }
  return best ? best.b / best.d : NaN;
}

module.exports = {
  sub, add, mul, dot, cross, len, dist, schwer, gleichP, normaleVon, inhalt3, abstaende, starrGleich, imVieleck,
  C45, ZUM_BETRACHTER, verdeckt, kantenSchluessel, lies, texte, rolleText, waehle, kavalierBild, ansichtBild, pruefeVerdeckt, eckenVon, istRechteck,
  ueberdecken, gemeinsameEcken, wahreGroesse, massstab,
};
