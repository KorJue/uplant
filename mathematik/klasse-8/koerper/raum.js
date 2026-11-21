// Raumgeometrie der Körperseiten (Klasse 8): Vektoren, Drehungen, zwei Projektionen, gerade Prismen,
// ihre Netze und der Zylindermantel, der aufgebogen wird.
//
// Koordinaten in cm: x nach rechts, y nach oben, z nach hinten (vom Betrachter weg). Gerechnet wird
// immer im Raum; die Zeichnung ist nur das Bild davon. Jede gezeichnete Fläche trägt deshalb ihre
// Raumpunkte als `data-p3` — so kann die Prüfung nachmessen, dass eine Fläche beim Aufklappen starr
// bleibt (gleiche Kanten, gleiche Winkel), statt nur das verzerrte Bild anzusehen.
//
// Zwei Projektionen:
//   kavalier()  — das Schrägbild aus dem Buch: Die Vorderebene z = 0 erscheint in wahrer Größe,
//                 nach hinten laufende Kanten unter 45° nach rechts oben und auf die Hälfte verkürzt.
//   ansicht(ε)  — senkrechte Parallelprojektion schräg von oben (Erhebung ε). Kreise in waagerechten
//                 Ebenen werden zu Ellipsen mit waagerechter Hauptachse — so zeichnet das Buch
//                 Zylinder. Bei ε = 0 schaut man genau von vorn: Die Ebene z = konstant erscheint dann
//                 in wahrer Größe.

import { svgEl, svgText } from "./seite.js?v=1";

// ---------- Vektoren ----------

export const plus = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const minus = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const mal = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
export const skalar = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const kreuz = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const laenge = (a) => Math.hypot(a[0], a[1], a[2]);
export const abstand = (a, b) => laenge(minus(a, b));
export const mitte = (pts) => mal(pts.reduce((s, p) => plus(s, p), [0, 0, 0]), 1 / pts.length);

// Drehung des Punktes p um die Achse durch a mit der Richtung u (Einheitsvektor) um den Winkel phi
// (Formel von Rodrigues). Rechtsdrehend um u.
export function drehe(p, a, u, phi) {
  const v = minus(p, a), c = Math.cos(phi), s = Math.sin(phi);
  const k = kreuz(u, v), d = skalar(u, v) * (1 - c);
  return plus(a, [v[0] * c + k[0] * s + u[0] * d, v[1] * c + k[1] * s + u[1] * d, v[2] * c + k[2] * s + u[2] * d]);
}
export const drehePunkte = (pts, a, u, phi) => pts.map((p) => drehe(p, a, u, phi));
export const schiebePunkte = (pts, d) => pts.map((p) => plus(p, d));

// Flächeninhalt und Normale eines ebenen Vielecks im Raum (Verfahren von Newell).
export function normale(pts) {
  let n = [0, 0, 0];
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], q = pts[(i + 1) % pts.length];
    n = plus(n, [(p[1] - q[1]) * (p[2] + q[2]), (p[2] - q[2]) * (p[0] + q[0]), (p[0] - q[0]) * (p[1] + q[1])]);
  }
  return n;
}
export const flaecheRaum = (pts) => laenge(normale(pts)) / 2;
// Flächeninhalt eines Vielecks in der Ebene ([x, y]-Paare), Gaußsche Trapezformel.
export function flaecheEben(pts) {
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], q = pts[(i + 1) % pts.length];
    s += p[0] * q[1] - q[0] * p[1];
  }
  return Math.abs(s) / 2;
}
export function umfangEben(pts) {
  let s = 0;
  for (let i = 0; i < pts.length; i++) s += Math.hypot(pts[(i + 1) % pts.length][0] - pts[i][0], pts[(i + 1) % pts.length][1] - pts[i][1]);
  return s;
}

// ---------- Projektionen ----------

// Kavalierperspektive. `sicht` zeigt von der Zeichnung zum Betrachter: Eine Fläche ist sichtbar, wenn
// ihre Außennormale in diese Richtung weist. Bei der schiefen Projektion fallen alle Punkte
// P + s · (−k·cos 45°, −k·sin 45°, 1) auf denselben Bildpunkt; der Betrachter sitzt also vorn rechts
// oben und sieht Vorderfläche, Deckfläche und rechte Seite. Die Tiefe längs dieses Strahls ist z.
export function kavalier(k = 0.5, grad = 45) {
  const c = k * Math.cos((grad * Math.PI) / 180), s = k * Math.sin((grad * Math.PI) / 180);
  return {
    art: "kavalier", k, grad,
    bild: (p) => [p[0] + c * p[2], p[1] + s * p[2]],
    // Die Tiefe als Anteil längs der Blickrichtung (−c, −s, 1): wächst auf jedem Sehstrahl nach hinten
    // und ordnet auch nebeneinander stehende Körper richtig (der rechte steht weiter vorn).
    tiefe: (p) => p[2] - c * p[0] - s * p[1],
    sicht: [c, s, -1],
  };
}

// Senkrechte Parallelprojektion: erst um die senkrechte Achse gedreht (Azimut ψ), dann schräg von oben
// gesehen (Erhebung ε). Weiter hinten liegende Punkte erscheinen höher.
export function ansicht(epsGrad, psiGrad = 0) {
  const e = (epsGrad * Math.PI) / 180, w = (psiGrad * Math.PI) / 180;
  const ce = Math.cos(e), se = Math.sin(e), cw = Math.cos(w), sw = Math.sin(w);
  const dreh = (p) => [p[0] * cw - p[2] * sw, p[1], p[0] * sw + p[2] * cw];
  return {
    art: "ansicht", eps: epsGrad, psi: psiGrad,
    bild: (p) => { const q = dreh(p); return [q[0], q[1] * ce + q[2] * se]; },
    tiefe: (p) => { const q = dreh(p); return q[2] * ce - q[1] * se; },
    sicht: [-ce * sw, se, -ce * cw],
  };
}

// ---------- Bühne ----------

// Spannt die Zeichenfläche über ALLE Punkte auf, die während einer Bewegung vorkommen — sonst ragt ein
// Teil auf halbem Weg aus dem Bild oder die Zeichnung springt beim Ziehen. Die Breite steht fest; der
// Maßstab ist s0 Bildpunkte je cm, solange alles hineinpasst, sonst kleiner. `extra` sind zusätzliche
// Ränder in Bildpunkten (für Beschriftungen): { links, rechts, oben, unten }.
export function buehne(kam, punkte, { breite, maxHoehe, s0, rand = 24, extra = {} }) {
  const b = punkte.map((p) => (p.length === 3 ? kam.bild(p) : p));
  const xs = b.map((p) => p[0]), ys = b.map((p) => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const l = extra.links || 0, r = extra.rechts || 0, o = extra.oben || 0, u = extra.unten || 0;
  const S = Math.min(s0, (breite - 2 * rand - l - r) / Math.max(1e-9, x1 - x0), (maxHoehe - 2 * rand - o - u) / Math.max(1e-9, y1 - y0));
  const hoehe = Math.ceil((y1 - y0) * S + 2 * rand + o + u);
  const ox = l + (breite - l - r) / 2 - (S * (x0 + x1)) / 2;
  const oy = rand + o + S * y1;
  return { kam, S, ox, oy, breite, hoehe, nachBild: (p) => { const q = p.length === 3 ? kam.bild(p) : p; return [ox + S * q[0], oy - S * q[1]]; } };
}

// ---------- Zeichnen ----------

const f2 = (x) => (Math.abs(x) < 5e-3 ? 0 : x).toFixed(2);
const f4 = (x) => (Math.abs(x) < 5e-5 ? 0 : x).toFixed(4);
const p3Text = (pts) => pts.map((p) => p.map(f4).join(",")).join(" ");
const p2Text = (pts) => pts.map((p) => `${f2(p[0])},${f2(p[1])}`).join(" ");

export function vieleck(g, b, pts3, klasse, daten = {}) {
  const e = svgEl("polygon", { points: p2Text(pts3.map(b.nachBild)), class: klasse, "data-p3": p3Text(pts3), ...daten });
  g.appendChild(e);
  return e;
}
export function strecke(g, b, p, q, klasse, daten = {}) {
  const [x1, y1] = b.nachBild(p), [x2, y2] = b.nachBild(q);
  const e = svgEl("line", { x1: f2(x1), y1: f2(y1), x2: f2(x2), y2: f2(y2), class: klasse, "data-p3": p3Text([p, q]), ...daten });
  g.appendChild(e);
  return e;
}
export function linienzug(g, b, pts3, klasse, daten = {}) {
  const e = svgEl("polyline", { points: p2Text(pts3.map(b.nachBild)), class: klasse, "data-p3": p3Text(pts3), ...daten });
  g.appendChild(e);
  return e;
}
// Beschriftung an einem Raumpunkt, um (dx, dy) Bildpunkte versetzt. Mit Rand in Grundfarbe
// (Klasse kp-text), damit Kanten nicht durch die Schrift laufen.
export function text(g, b, p, inhalt, klasse, dx = 0, dy = 0, anker = "middle", daten = {}) {
  const [x, y] = b.nachBild(p);
  const t = svgText(x + dx, y + dy, inhalt, { class: `kp-text ${klasse}`, "text-anchor": anker, ...daten });
  g.appendChild(t);
  return t;
}

// Maß an der Seite p–q eines ebenen Vielecks (Ebene z = konst.), außen neben der Seitenmitte;
// (ux, uy) ist die Außennormale der Seite. Die Schrift rückt waagerecht von der Seite weg — links-
// oder rechtsbündig, je nach Richtung; mittig ausgerichtet läge sie bei schrägen Seiten halb auf der
// Kante.
export function seitenMass(g, b, p, q, [ux, uy], inhalt, klasse, abstandPx = 8, daten = {}) {
  const m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2, p[2]];
  const anker = ux > 0.35 ? "start" : ux < -0.35 ? "end" : "middle";
  // Über oder unter einer flachen Seite: Schriftgröße mit einrechnen.
  const dy = uy > 0.35 ? -abstandPx : uy < -0.35 ? abstandPx + 10 : 4;
  return text(g, b, m, inhalt, klasse, ux * abstandPx, dy, anker, daten);
}
// Außennormalen der Seiten eines ebenen Vielecks ([x, y, …]-Punkte, beliebiger Umlaufsinn).
export function aussennormalen(pts) {
  let s = 0;
  for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; s += p[0] * q[1] - q[0] * p[1]; }
  const sinn = s > 0 ? 1 : -1;   // gegen den Uhrzeigersinn: außen liegt rechts der Laufrichtung
  return pts.map((p, i) => {
    const q = pts[(i + 1) % pts.length], dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy) || 1;
    return [(sinn * dy) / l, (-sinn * dx) / l];
  });
}

// Maße an allen Seiten einer Vorderfläche (Ebene z = 0) im Schrägbild. Zeigt eine Seite nach rechts
// oder oben, läuft außen an ihr eine Seitenfläche nach hinten weg, und die Zahl läge auf Kanten. Dann
// steht sie an der gleich langen Seite der Rückfläche (`hinten`, verschobene Kopie), deren Außenseite
// frei ist. Ohne Rückfläche (null) bleiben solche Seiten unbeschriftet.
export function vorderflaecheMasse(g, b, vorn, hinten, inhalt, klasse, daten = () => ({})) {
  const n = vorn.length, nor = aussennormalen(vorn);
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const verdeckt = nor[i][0] + nor[i][1] > 0.2;
    if (!verdeckt) seitenMass(g, b, vorn[i], vorn[j], nor[i], inhalt(i), klasse, 7, { ...daten(i), "data-an": "vorn" });
    else if (hinten) seitenMass(g, b, hinten[i], hinten[j], nor[i], inhalt(i), klasse, 7, { ...daten(i), "data-an": "hinten" });
  }
}

// Kanten eines Körpers aus seinen Flächen: jede Kante einmal, mit den Flächen, an denen sie liegt.
const schluessel = (p) => p.map((x) => Math.round(x * 1e4)).join(";");
export function kanten(flaechen) {
  const m = new Map();
  flaechen.forEach((f, fi) => {
    for (let i = 0; i < f.pts.length; i++) {
      const p = f.pts[i], q = f.pts[(i + 1) % f.pts.length];
      if (abstand(p, q) < 1e-9) continue;
      const k1 = schluessel(p), k2 = schluessel(q);
      const k = k1 < k2 ? k1 + "|" + k2 : k2 + "|" + k1;
      if (!m.has(k)) m.set(k, { p, q, flaechen: [] });
      m.get(k).flaechen.push(fi);
    }
  });
  return [...m.values()];
}

// Ein geschlossener KONVEXER Körper: sichtbare Flächen gefüllt, verdeckte Kanten gestrichelt
// darüber, sichtbare Kanten durchgezogen obenauf. Für konvexe Körper ist das exakt: Eine Kante ist
// genau dann verdeckt, wenn alle ihre Flächen vom Betrachter wegzeigen.
// flaechen: [{ pts, klasse, daten }]
// Für viele kleine Körper (Einheitswürfel) lassen sich die unsichtbaren Flächen und die einzelnen
// Kanten weglassen (unsichtbare: false, kanten: false) — dann tragen die Flächen ihren Rand selbst.
export function zeichneKoerper(g, b, flaechen, { verdeckt = true, kantenKlasse = "kp-kante", daten = {}, unsichtbare = true, kanten: mitKanten = true } = {}) {
  const z = mitte(flaechen.flatMap((f) => f.pts));
  const sichtbar = flaechen.map((f) => {
    const n = normale(f.pts);
    if (laenge(n) < 1e-9) return false;
    const aussen = skalar(n, minus(mitte(f.pts), z)) >= 0 ? n : mal(n, -1);
    return skalar(aussen, b.kam.sicht) > 1e-9;
  });
  // Die abgewandten Flächen stehen unsichtbar mit im Bild: Die Prüfung zählt an ihnen nach, wie viele
  // Flächen der Körper hat — ohne dass sie das Bild verdecken.
  if (unsichtbare) flaechen.forEach((f, i) => {
    if (!sichtbar[i]) vieleck(g, b, f.pts, "kp-unsichtbar", { "data-sichtbar": "0", ...(f.daten || {}) });
  });
  flaechen.forEach((f, i) => {
    if (sichtbar[i]) vieleck(g, b, f.pts, f.klasse, { "data-sichtbar": "1", ...(f.daten || {}) });
  });
  if (!mitKanten) return { sichtbar, kanten: [] };
  const ks = kanten(flaechen).map((k) => ({ ...k, sicht: k.flaechen.some((i) => sichtbar[i]) }));
  if (verdeckt) ks.filter((k) => !k.sicht).forEach((k) => strecke(g, b, k.p, k.q, "kp-verdeckt", { "data-rolle": "kante-verdeckt", ...daten }));
  ks.filter((k) => k.sicht).forEach((k) => strecke(g, b, k.p, k.q, kantenKlasse, { "data-rolle": "kante", ...daten }));
  return { sichtbar, kanten: ks };
}

// Mehrere getrennte konvexe Körper (Stücke, Würfel): von hinten nach vorn, jeder für sich exakt mit
// zeichneKoerper(). Für Körper, die sich nicht durchdringen, genügt die Reihenfolge ihrer Mitten.
// koerper: [{ flaechen, verdeckt?, daten? }]
export function zeichneKoerperListe(g, b, koerper) {
  const t = koerper.map((k) => ({ k, t: b.kam.tiefe(mitte(k.flaechen.flatMap((f) => f.pts))) }));
  t.sort((u, v) => v.t - u.t);
  t.forEach(({ k }) => zeichneKoerper(g, b, k.flaechen, { verdeckt: k.verdeckt ?? false, daten: k.daten || {}, unsichtbare: k.unsichtbare ?? true, kanten: k.kanten ?? true }));
}
// Ein Quader als Prisma: Ecke (x, y, z), Ausdehnung a (x), h (y), b (z).
export function quaderFlaechen(x, y, z, a, h, b) {
  return prismaFlaechen([[x, z], [x + a, z], [x + a, z + b], [x, z + b]], h).map((f) => ({ ...f, pts: f.pts.map((p) => [p[0], p[1] + y, p[2]]) }));
}

// Offene Flächen (ein Netz beim Aufklappen): von hinten nach vorn gemalt, jede mit eigenem Rand. Das
// Malerverfahren nach der mittleren Tiefe ist für die wenigen, einander kaum überdeckenden Flächen
// eines Netzes gut genug; der geschlossene Körper wird mit zeichneKoerper() exakt gezeichnet.
// Eine Fläche kann Linien mitbringen (f.linien: [{ pts, klasse }]) — sie werden gleich nach ihr gemalt
// und damit von Flächen davor verdeckt wie die Fläche selbst (so bleiben die Ränder eines gebogenen
// Mantels richtig verdeckt).
export function zeichneFlaechen(g, b, flaechen) {
  const tief = flaechen.map((f) => ({ f, t: f.pts.reduce((s, p) => s + b.kam.tiefe(p), 0) / f.pts.length }));
  tief.sort((u, v) => v.t - u.t);
  tief.forEach(({ f }) => {
    vieleck(g, b, f.pts, f.klasse, f.daten || {});
    (f.linien || []).forEach((l) => linienzug(g, b, l.pts, l.klasse, l.daten || {}));
  });
}

// ---------- Gerade Prismen ----------
//
// Die Grundfläche ist ein Vieleck in der Ebene y = 0, gegeben als [x, z]-Paare gegen den
// Uhrzeigersinn (von oben gesehen, mit z nach hinten), Kante 0 VORN von links nach rechts auf z = 0.
// Das Prisma steht auf ihr und ist h hoch. Seitenfläche i liegt über der Kante von Ecke i zu i + 1.

const auf = ([x, z], y = 0) => [x, y, z];
export function prismaFlaechen(grund, h) {
  const n = grund.length;
  const unten = grund.map((p) => auf(p, 0)), oben = grund.map((p) => auf(p, h));
  const f = [
    { rolle: "grund", pts: unten.slice().reverse() },
    { rolle: "deckel", pts: oben },
  ];
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    f.push({ rolle: "seite", nr: i, pts: [unten[i], unten[j], oben[j], oben[i]] });
  }
  return f;
}

// Richtungswinkel der Kanten, fortlaufend aufgewickelt: Kante 0 hat 0, jede weitere um den
// (vorzeichenbehafteten) Außenwinkel mehr. Bei einem Vieleck gegen den Uhrzeigersinn ist die Summe der
// Außenwinkel 360°.
function kantenWinkel(grund) {
  const n = grund.length, w = [0];
  const richtung = (i) => { const p = grund[i], q = grund[(i + 1) % n]; return Math.atan2(q[1] - p[1], q[0] - p[0]); };
  for (let i = 1; i < n; i++) {
    let d = richtung(i) - richtung(i - 1);
    while (d <= -Math.PI) d += 2 * Math.PI;
    while (d > Math.PI) d -= 2 * Math.PI;
    w.push(w[i - 1] + d);
  }
  return w;
}

// Das Netz beim Aufklappen. tDeckel ∈ [0, 1]: Grund- und Deckfläche klappen um die untere bzw. obere
// Kante der Vorderfläche (Seite 0) in die Vorderebene. tMantel ∈ [0, 1]: Die Seitenflächen klappen
// um ihre senkrechten Kanten auf — die rechts von Seite 0 nach rechts, die übrigen nach links —, bis
// der Mantel als ein Streifen in der Vorderebene liegt. Jede Fläche bleibt dabei starr: Sie wird nur
// um eine Kante gedreht, die sie mit ihrer Nachbarin teilt.
export function prismaNetz(grund, h, tDeckel, tMantel) {
  const n = grund.length;
  const L = grund.map((p, i) => Math.hypot(grund[(i + 1) % n][0] - p[0], grund[(i + 1) % n][1] - p[1]));
  const w = kantenWinkel(grund);
  const rechts = Math.floor((n - 1) / 2);   // Seiten 1 … rechts klappen nach rechts
  const q = new Array(n + 1);
  q[0] = [grund[0][0], grund[0][1]];
  q[1] = [grund[1][0], grund[1][1]];
  for (let i = 1; i <= rechts; i++) {
    const phi = w[i] * (1 - tMantel);
    q[i + 1] = [q[i][0] + L[i] * Math.cos(phi), q[i][1] + L[i] * Math.sin(phi)];
  }
  // Nach links: von Ecke 0 rückwärts. Der Winkel wird um 360° nach unten verschoben, damit diese
  // Seiten beim Aufklappen in die andere Richtung drehen und am Ende links von Seite 0 liegen.
  const links = new Array(n + 1);
  links[n] = q[0];
  for (let i = n - 1; i > rechts; i--) {
    const phi = (w[i] - 2 * Math.PI) * (1 - tMantel);
    links[i] = [links[i + 1][0] - L[i] * Math.cos(phi), links[i + 1][1] - L[i] * Math.sin(phi)];
  }
  const seite = (i) => {
    const a = i <= rechts ? q[i] : links[i], e = i <= rechts ? q[i + 1] : links[i + 1];
    return [auf(a, 0), auf(e, 0), auf(e, h), auf(a, h)];
  };
  const flaechen = [];
  for (let i = 0; i < n; i++) flaechen.push({ rolle: "seite", nr: i, pts: seite(i) });
  // Grund- und Deckfläche hängen an Seite 0, deren Kanten auf der x-Achse (unten) und auf y = h liegen.
  const phi = (Math.PI / 2) * tDeckel;
  const x = [1, 0, 0];
  // Rechtsdrehend um +x führt (0, 0, z) nach unten: Die Grundfläche klappt unter den Streifen, die
  // Deckfläche (linksdrehend) darüber.
  // Die Grundfläche mit derselben Eckenfolge wie in prismaFlaechen (von außen gesehen).
  flaechen.push({ rolle: "grund", pts: drehePunkte(grund.map((p) => auf(p, 0)).reverse(), [0, 0, 0], x, phi) });
  flaechen.push({ rolle: "deckel", pts: drehePunkte(grund.map((p) => auf(p, h)), [0, h, 0], x, -phi) });
  return flaechen;
}

// Die Seitenlängen eines ebenen Vielecks und sein Umfang.
export function seitenlaengen(grund) {
  return grund.map((p, i) => Math.hypot(grund[(i + 1) % grund.length][0] - p[0], grund[(i + 1) % grund.length][1] - p[1]));
}

// ---------- Zylinder ----------
//
// Der Zylinder steht auf der Ebene y = 0, Mittelachse durch (0, ·, 0). Sein Mantel ist als N schmale
// Streifen gezeichnet; die Kreise als N-Ecke. N ist so groß, dass man keine Ecken sieht.
export const ZYL_N = 96;

export function kreisPunkte(r, y, n = ZYL_N, mx = 0, mz = 0) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = (2 * Math.PI * i) / n;
    out.push([mx + r * Math.sin(a), y, mz - r * Math.cos(a)]);   // Punkt 0 vorn (z = −r)
  }
  return out;
}

// Der Mantel wird AUFGEBOGEN, nicht gedehnt: Sein Querschnitt ist in jeder Stellung ein Kreisbogen
// der Länge 2πr, dessen Radius r/s mit s → 0 wächst, bis er gerade ist. Die Mantellinie vorn
// (Bogenlänge 0, Punkt (0, ·, −r)) bleibt stehen; aufgeschnitten ist hinten. Weil nur gebogen wird,
// behält jeder Streifen seine Breite und seine Höhe — der Flächeninhalt bleibt gleich.
// Bei s = 1 ist es der Zylindermantel, bei s = 0 ein Rechteck 2πr × h in der Ebene z = −r.
export function mantelPunkt(r, s, u) {
  if (s < 1e-9) return [u, -r];
  const R = r / s, a = u / R;
  return [R * Math.sin(a), -r + R * (1 - Math.cos(a))];
}
export function mantelStreifen(r, h, s, n = ZYL_N) {
  const L = 2 * Math.PI * r, out = [];
  for (let i = 0; i < n; i++) {
    const u0 = -L / 2 + (L * i) / n, u1 = u0 + L / n;
    const [x0, z0] = mantelPunkt(r, s, u0), [x1, z1] = mantelPunkt(r, s, u1);
    out.push({ nr: i, u0, u1, pts: [[x0, 0, z0], [x1, 0, z1], [x1, h, z1], [x0, h, z0]] });
  }
  return out;
}
// Der Rand des Mantels (oben und unten) als Linienzug — für Umrisse.
export function mantelRand(r, y, s, n = ZYL_N) {
  const L = 2 * Math.PI * r, out = [];
  for (let i = 0; i <= n; i++) {
    const [x, z] = mantelPunkt(r, s, -L / 2 + (L * i) / n);
    out.push([x, y, z]);
  }
  return out;
}

// ---------- Grundflächen ----------
//
// Grundflächen, die auf mehreren Seiten vorkommen. Koordinaten in cm, als [x, z] für ein stehendes
// Prisma (Kante 0 vorn) — für ein liegendes, dessen Grundfläche vorn steht, dieselben Zahlen als
// [x, y]. Alle Seitenlängen sind glatt: Die schrägen Seiten gehören zu Dreiecken mit 3, 4 und 5 cm.
// Sie sind gegeben, nicht berechnet — der Satz des Pythagoras kommt erst in Klasse 9.
export const FORMEN = {
  quader: { name: "Rechteck", koerper: "Quader", grund: [[0, 0], [4, 0], [4, 3], [0, 3]] },
  "dreieck-rw": { name: "rechtwinkliges Dreieck", koerper: "Dreiecksprisma", grund: [[0, 0], [4, 0], [0, 3]] },
  "dreieck-gs": { name: "gleichschenkliges Dreieck", koerper: "Dreiecksprisma", grund: [[0, 0], [6, 0], [3, 4]] },
  trapez: { name: "Trapez", koerper: "Trapezprisma", grund: [[0, 0], [8, 0], [5, 4], [3, 4]] },
  haus: { name: "Fünfeck", koerper: "Fünfeckprisma", grund: [[0, 0], [6, 0], [6, 3], [3, 7], [0, 3]] },
  sechseck: { name: "Sechseck", koerper: "Sechseckprisma", grund: [[1.5, 0], [4.5, 0], [6, 2], [4.5, 4], [1.5, 4], [0, 2]] },
};

// Ein Bild als Zeichenkette (für Aufgabentexte, die über innerHTML gesetzt werden): Das SVG wird mit
// denselben Werkzeugen gebaut wie die Zeichnungen der Abschnitte.
export function svgAlsText(breite, hoehe, klasse, art, bauen) {
  const svg = svgEl("svg", { viewBox: `0 0 ${breite} ${hoehe}`, width: breite, height: hoehe, class: klasse, "data-figur": art, role: "img" });
  bauen(svg);
  return svg.outerHTML;
}

// Kippen um die vordere untere Kante (die x-Achse): Anteil 1 dreht um 90° nach vorn — ein Prisma,
// das auf seiner Grundfläche stand, liegt dann auf seiner Seitenfläche 0, und was in der Vorderebene
// z = 0 lag, liegt danach auf dem Boden y = 0.
export const kippe = (pts, anteil) => drehePunkte(pts, [0, 0, 0], [1, 0, 0], (-Math.PI / 2) * anteil);

// ---------- Zylinder zeichnen ----------
//
// Ein Zylinder (oder ein regelmäßiges n-Eck-Prisma, wenn n klein ist) mit senkrechter Achse durch
// (mx, ·, mz), Radius r, von y0 bis y1, gesehen schräg von oben (ansicht mit ψ = 0, ε > 0). Gezeichnet
// werden die zugewandten Mantelstreifen (ohne sichtbare Fugen), die Deckfläche und der Umriss: oberer
// Rand ganz, unterer Rand vorn durchgezogen und hinten gestrichelt, dazu die beiden Seitenlinien. Bei
// kleinem n zeigt `kanten` auch die sichtbaren Seitenkanten.
export function zeichneZylinder(g, b, { r, y0, y1, mx = 0, mz = 0, n = ZYL_N, mantel = "kp-m", deckel = "kp-g", daten = {}, verdeckt = true, kanten: mitKanten = false }) {
  const pkt = (a, y) => [mx + r * Math.sin(a), y, mz - r * Math.cos(a)];
  const winkel = (i) => (2 * Math.PI * i) / n;
  const zugewandt = (i) => {
    const am = (winkel(i) + winkel(i + 1)) / 2;
    return skalar([Math.sin(am), 0, -Math.cos(am)], b.kam.sicht) > 1e-9;
  };
  for (let i = 0; i < n; i++) if (zugewandt(i)) {
    vieleck(g, b, [pkt(winkel(i), y0), pkt(winkel(i + 1), y0), pkt(winkel(i + 1), y1), pkt(winkel(i), y1)], `${mantel} kp-flaeche${n > 24 ? " kp-glatt" : ""}`, { "data-rolle": "mantel", ...daten });
  }
  const oben = [], unten = [];
  for (let i = 0; i <= n; i++) { oben.push(pkt(winkel(i), y1)); unten.push(pkt(winkel(i), y0)); }
  vieleck(g, b, oben.slice(0, n), `${deckel} kp-flaeche`, { "data-rolle": "deckel", ...daten });
  linienzug(g, b, oben, "kp-umriss", { "data-rolle": "rand-oben", ...daten });
  // Unterer Rand: vorn sichtbar, hinten verdeckt. Die Grenze liegt dort, wo die Streifen wechseln.
  let vorn = [], hinten = [];
  for (let i = 0; i < n; i++) (zugewandt(i) ? vorn : hinten).push(i);
  const zug = (liste) => {
    // Die Indizes eines Bogens zusammenhängend ordnen (er kann über 0 hinweglaufen).
    if (!liste.length) return [];
    let start = liste.findIndex((i, k) => !liste.includes((i - 1 + n) % n));
    if (start < 0) start = 0;
    const out = [];
    for (let k = 0; k < liste.length; k++) out.push(liste[(start + k) % liste.length]);
    return out;
  };
  vorn = zug(vorn); hinten = zug(hinten);
  if (vorn.length) linienzug(g, b, [...vorn.map((i) => pkt(winkel(i), y0)), pkt(winkel(vorn[vorn.length - 1] + 1), y0)], "kp-umriss", { "data-rolle": "rand-unten", ...daten });
  if (verdeckt && hinten.length) linienzug(g, b, [...hinten.map((i) => pkt(winkel(i), y0)), pkt(winkel(hinten[hinten.length - 1] + 1), y0)], "kp-verdeckt kp-umriss-verdeckt", { "data-rolle": "rand-unten-verdeckt", ...daten });
  // Seitenlinien: wo zugewandte und abgewandte Streifen aneinanderstoßen.
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    if (zugewandt(i) !== zugewandt(j) || (mitKanten && zugewandt(i) && zugewandt(j))) {
      strecke(g, b, pkt(winkel(i + 1), y0), pkt(winkel(i + 1), y1), "kp-kante", { "data-rolle": zugewandt(i) !== zugewandt(j) ? "seitenlinie" : "kante", ...daten });
    }
  }
}
