// Selbstlernpfad „Volumen von Prismen“ (Klasse 8, Körper, Thema 3).
//
// Reihenfolge — jeder Abschnitt benutzt nur, was vorher da war:
//   1. Quader: Einheitswürfel werden Schicht für Schicht eingefüllt; a · b in einer Schicht, h Schichten.
//   2. Dreiecksprisma: Der Quader g × hg × h wird schräg geteilt. Das orange Stück wird herausgezogen und
//      um seine eigene senkrechte Achse halb gedreht — danach ist es ein Abbild des blauen Teils. Beim
//      beliebigen Dreieck geschieht das mit beiden Teilquadern links und rechts der Höhe. Starr.
//   3. Jedes Prisma: Die Grundfläche wird in Rechtecke und Dreiecke zerlegt, die Quader und
//      Dreiecksprismen rücken auseinander (starr verschoben): V = (G1 + G2 + …) · h.
//   4. Einheiten: Ein 1-dm-Würfel zerfällt in 10 Platten, eine Platte in 10 Stangen, eine Stange in 10
//      Würfel — 1 dm³ = 1000 cm³ = 1 l.
//
// Gerechnet wird mit den Reglerwerten; jede Fläche trägt ihre Raumpunkte (data-p3).
// Farben: Grund- und Deckfläche blau, Seitenflächen orange, Höhe violett, Volumen grün.
// Die Übungsaufgaben stehen in volumen-prisma-aufgaben.js.

import { svgEl, flaeche, zeige, num, reglerZahl, setzeText, setzeHtml, wahl, mountQuizze, mountUebungsaufgaben } from "./seite.js?v=1";
import * as R from "./raum.js?v=1";
import { AUFGABEN } from "./volumen-prisma-aufgaben.js?v=1";

const W = 640;
const KAV = R.kavalier();
const prozent = (t) => `${Math.round(t * 100)} %`;
const mitKlassen = (fl, daten = {}, zusatz = " kp-flaeche") => fl.map((f) => ({
  ...f, klasse: (f.rolle === "seite" ? "kp-m" : "kp-g") + zusatz,
  daten: { "data-rolle": f.rolle, ...(f.nr !== undefined ? { "data-nr": String(f.nr) } : {}), ...daten },
}));
const verschiebe = (fl, d) => fl.map((f) => ({ ...f, pts: R.schiebePunkte(f.pts, d) }));
// Ein liegendes Prisma: die Grundfläche P ([x, y]) vorn in der Ebene z = 0, die Höhe h nach hinten. So
// erscheint die Grundfläche im Schrägbild in wahrer Größe, und was mit ihr geschieht, sieht man
// unverzerrt.
const liegend = (P, h) => R.prismaFlaechen(P, h).map((f) => ({ ...f, pts: f.pts.map(([x, y, z]) => [x, z, y]) }));
// Drehung um eine Achse senkrecht zur Vorderebene (Richtung z) durch den Punkt (cx, cy).
const dreheInEbene = (fl, cx, cy, phi) => fl.map((f) => ({ ...f, pts: R.drehePunkte(f.pts, [cx, cy, 0], [0, 0, 1], phi) }));
// Beschriftung mit tiefgestelltem Index und Rest (h, g, „ = 3 cm“ → hg = 3 cm).
function textIndex(g, b, p, haupt, index, rest, klasse, dx, dy, anker = "middle") {
  const t = R.text(g, b, p, haupt, klasse, dx, dy, anker);
  t.appendChild(svgEl("tspan", { "baseline-shift": "sub", "font-size": "70%" })).textContent = index;
  t.appendChild(svgEl("tspan", {})).textContent = rest;
  return t;
}

// ================= 1. Würfel zählen =================

const WF_MAX = { a: 6, b: 4, h: 5 };

function renderWuerfel() {
  const a = reglerZahl("wf-a"), b = reglerZahl("wf-b"), h = reglerZahl("wf-h");
  const t = reglerZahl("wf-t") / 100;
  setzeText("wf-a-anzeige", `${a} cm`);
  setzeText("wf-b-anzeige", `${b} cm`);
  setzeText("wf-h-anzeige", `${h} cm`);
  const N = a * b * h, k = Math.floor(t * N + 1e-9);
  setzeText("wf-t-anzeige", `${k} von ${N}`);
  // Fester Rahmen für den größten Quader: Mehr Würfel sehen auch nach mehr aus.
  const bu = R.buehne(KAV, R.quaderFlaechen(0, 0, 0, WF_MAX.a, WF_MAX.h, WF_MAX.b).flatMap((f) => f.pts), { breite: W, maxHoehe: 360, s0: 40, extra: { links: 60, unten: 24 } });
  const svg = flaeche(W, bu.hoehe, `Quader ${a} cm × ${b} cm × ${h} cm mit ${k} Einheitswürfeln`);
  // Der Rahmen des Quaders, in den gefüllt wird.
  R.zeichneKoerper(svg, bu, R.quaderFlaechen(0, 0, 0, a, h, b).map((f) => ({ ...f, klasse: "kp-unsichtbar" })), { kantenKlasse: "kp-hilfe", unsichtbare: false, daten: { "data-rolle": "rahmen" } });
  // Reihenfolge des Einfüllens: Schicht für Schicht von unten, in jeder Schicht von hinten nach vorn
  // und von links nach rechts.
  const wuerfel = [];
  for (let l = 0; l < h; l++) for (let j = b - 1; j >= 0; j--) for (let i = 0; i < a; i++) wuerfel.push([i, l, j]);
  const klasse = (f) => {
    const n = R.normale(f.pts);
    return Math.abs(n[1]) > 1e-9 ? "kp-wuerfel-oben" : Math.abs(n[0]) > 1e-9 ? "kp-wuerfel-seite" : "kp-wuerfel-vorn";
  };
  R.zeichneKoerperListe(svg, bu, wuerfel.slice(0, k).map(([i, l, j]) => ({
    flaechen: R.quaderFlaechen(i, l, j, 1, 1, 1).map((f) => ({ ...f, klasse: klasse(f), daten: { "data-rolle": "wuerfel", "data-w": `${i},${l},${j}` } })),
    unsichtbare: false, kanten: false,
  })));
  R.text(svg, bu, [a / 2, 0, 0], `a = ${a} cm`, "kp-t-g", 0, 18);
  R.text(svg, bu, [0, h / 2, 0], `h = ${h} cm`, "kp-t-h", -8, 4, "end");
  zeige("wf-mount", svg);

  const schicht = a * b, volle = Math.floor(k / schicht), rest = k - volle * schicht;
  setzeHtml("wf-bilanz",
    `Eingefüllt: <strong data-rolle="anzahl">${k}</strong> Würfel zu je 1 cm³ — ${volle} volle ${volle === 1 ? "Schicht" : "Schichten"}${rest ? ` und ${rest} Würfel der nächsten` : ""}<br>` +
    `Eine Schicht: <span class="wc">a · b = ${a} · ${b} = ${schicht}</span> Würfel — so viele, wie die Grundfläche G = ${schicht} cm² hat<br>` +
    `<span class="wa">V = a · b · h = ${schicht} · ${h} = <strong data-rolle="V">${N}</strong> cm³</span>`);
  setzeText("wf-text", k === 0
    ? "Der Quader ist leer. Füll ihn mit Würfeln."
    : k < N
      ? `In der untersten Schicht liegen ${schicht} Würfel — so viele, wie die Grundfläche cm² hat. Jede weitere Schicht bringt noch einmal ${schicht}.`
      : `Voll: ${h} Schichten mit je ${schicht} Würfeln, zusammen ${N} Würfel. Das Volumen ist ${N} cm³ = G · h.`);
}

// ================= 2. Dreiecksprisma =================

const DR_LUECKE = 0.5;
// Die Stücke in der Vorderebene [x, y]: blau das Dreiecksprisma, orange die Ergänzungen zum Quader.
function drStuecke(art, g, hg, anteil) {
  if (art === "rw") return { blau: [[0, 0], [g, 0], [0, hg]], orange: [{ pts: [[g, 0], [g, hg], [0, hg]], seite: 1 }] };
  const p = anteil * g;
  return { blau: [[0, 0], [g, 0], [p, hg]], orange: [{ pts: [[0, 0], [p, hg], [0, hg]], seite: -1 }, { pts: [[g, 0], [g, hg], [p, hg]], seite: 1 }] };
}
const schwer2 = (P) => [P.reduce((s, p) => s + p[0], 0) / P.length, P.reduce((s, p) => s + p[1], 0) / P.length];
// Wie weit ein Stück hinaus muss, damit es sich beim Drehen um seine Mitte nicht mit dem blauen
// Prisma (0 ≤ x ≤ g) überschneidet: Mitte minus Drehradius jenseits der Kante, plus eine Lücke.
function drWeg(st, g) {
  const c = schwer2(st.pts), r = Math.max(...st.pts.map((p) => Math.hypot(p[0] - c[0], p[1] - c[1])));
  return st.seite > 0 ? g + DR_LUECKE + r - c[0] : c[0] + r + DR_LUECKE;
}
function drOrange(st, g, h, t) {
  const s1 = Math.min(1, t / 0.5), s2 = Math.max(0, (t - 0.5) / 0.5);
  const d = st.seite * drWeg(st, g) * s1;
  const c = schwer2(st.pts);
  const fl = verschiebe(liegend(st.pts, h), [d, 0, 0]);
  return dreheInEbene(fl, c[0] + d, c[1], Math.PI * s2);
}

function renderDreieck() {
  const art = wahl("dr-art");
  const g = reglerZahl("dr-g"), hg = reglerZahl("dr-hg"), h = reglerZahl("dr-h");
  const anteil = reglerZahl("dr-p") / 100, t = reglerZahl("dr-t") / 100;
  document.getElementById("dr-p").disabled = art === "rw";
  setzeText("dr-g-anzeige", `${g} cm`);
  setzeText("dr-hg-anzeige", `${hg} cm`);
  setzeText("dr-h-anzeige", `${h} cm`);
  setzeText("dr-p-anzeige", art === "rw" ? "—" : prozent(anteil));
  setzeText("dr-t-anzeige", prozent(t));
  const { blau, orange } = drStuecke(art, g, hg, anteil);
  // Bühne: der ganze Weg beim größten Quader dieser Art — fester Maßstab.
  const spur = [];
  const gr = drStuecke(art, 6, 4, art === "rw" ? 0 : 0.5);
  for (let k = 0; k <= 20; k++) gr.orange.forEach((st) => drOrange(st, 6, 4, k / 20).forEach((f) => spur.push(...f.pts)));
  liegend(gr.blau, 4).forEach((f) => spur.push(...f.pts));
  for (const x of [-7, 13]) spur.push([x, 0, 0]);   // Platz für die Stücke, die beim beliebigen Dreieck links und rechts liegen
  const bu = R.buehne(KAV, spur, { breite: W, maxHoehe: 340, s0: 30, extra: { unten: 22, links: 70 } });
  const svg = flaeche(W, bu.hoehe, `Quader ${g} cm × ${hg} cm × ${h} cm, schräg geteilt`);
  // Jedes Stück in seiner Farbe: blau das Dreiecksprisma, orange die Ergänzung.
  const koerper = [{ flaechen: liegend(blau, h).map((f) => ({ ...f, klasse: "kp-g kp-flaeche", daten: { "data-rolle": f.rolle, "data-stueck": "blau" } })), verdeckt: false }];
  orange.forEach((st, i) => koerper.push({
    flaechen: drOrange(st, g, h, t).map((f) => ({ ...f, klasse: "kp-m kp-flaeche", daten: { "data-rolle": f.rolle, "data-stueck": `orange${i}` } })),
    verdeckt: false,
  }));
  R.zeichneKoerperListe(svg, bu, koerper);
  R.text(svg, bu, [g / 2, 0, 0], `g = ${g} cm`, "kp-t-g kp-text-klein", 0, 18);
  // Die Höhe des Dreiecks steht vorn senkrecht auf g — beim rechtwinkligen ist sie die linke Seite.
  const xh = art === "rw" ? 0 : anteil * g;
  R.strecke(svg, bu, [xh, 0, 0], [xh, hg, 0], "kp-hoehe kp-punktiert", { "data-rolle": "hg" });
  textIndex(svg, bu, [xh, hg / 2, 0], "h", "g", ` = ${hg} cm`, "kp-t-h kp-text-klein", -8, 4, "end");
  // Die Höhe des Prismas an der Tiefenkante der Spitze, links davon — rechts unten zieht das orange
  // Stück vorbei.
  R.text(svg, bu, [xh, hg, h / 2], `h = ${h} cm`, "kp-t-h kp-text-klein", -8, -2, "end");
  zeige("dr-mount", svg);

  const Vq = g * hg * h, Vd = Vq / 2;
  setzeHtml("dr-bilanz",
    `Quader: g · h<sub>g</sub> · h = ${g} · ${hg} · ${h} = <strong data-rolle="Vq">${num(Vq)}</strong> cm³<br>` +
    (art === "rw"
      ? `Blaues und oranges Stück sind gleich groß — jedes ist die Hälfte.`
      : `Links und rechts der Höhe ist je ein Teilquader halb blau, halb orange — zusammen ist Blau so groß wie Orange.`) + `<br>` +
    `<span class="wa">Dreiecksprisma: V = ½ · ${g} · ${hg} · ${h} = <strong data-rolle="V">${num(Vd)}</strong> cm³</span> = G · h mit G = ½ · ${g} cm · ${hg} cm = ${num(Vq / h / 2)} cm²`);
  setzeText("dr-text", t === 0
    ? `Der Quader ist ${g} cm × ${hg} cm × ${h} cm groß. Er ist schräg geteilt: blau das Dreiecksprisma, orange der Rest.`
    : t <= 0.5
      ? "Das orange Stück wird herausgezogen — es bleibt, wie es ist."
      : t < 1
        ? "Jetzt dreht es sich um seine eigene senkrechte Achse."
        : art === "rw"
          ? "Halb gedreht liegt das orange Stück genau so da wie das blaue — es ist gleich groß. Der Quader besteht also aus zwei gleichen Hälften."
          : "Jedes orange Stück liegt jetzt so da wie der blaue Teil auf seiner Seite der Höhe — zusammen sind sie so groß wie das blaue Prisma. Es ist der halbe Quader.");
}

// ================= 3. V = G · h =================

const GH_WEG = 1.3;
// Zerlegt wird wie auf der Seite „Zusammengesetzte Figuren“: in Rechtecke (→ Quader, Abschnitt 1)
// und Dreiecke (→ Dreiecksprismen, Abschnitt 2). Die Teile decken die Grundfläche genau ab.
const ZERLEGUNG = {
  trapez: [[[0, 0], [3, 0], [3, 4]], [[3, 0], [5, 0], [5, 4], [3, 4]], [[5, 0], [8, 0], [5, 4]]],
  haus: [[[0, 0], [6, 0], [6, 3], [0, 3]], [[0, 3], [6, 3], [3, 7]]],
  sechseck: [[[1.5, 0], [1.5, 4], [0, 2]], [[1.5, 0], [4.5, 0], [4.5, 4], [1.5, 4]], [[4.5, 0], [6, 2], [4.5, 4]]],
};

function renderZerlegen() {
  const key = wahl("gh-form"), F = R.FORMEN[key];
  const h = reglerZahl("gh-h"), t = reglerZahl("gh-t") / 100;
  setzeText("gh-h-anzeige", `${h} cm`);
  setzeText("gh-t-anzeige", prozent(t));
  const teile = ZERLEGUNG[key];
  const c0 = schwer2(F.grund);
  // Jedes Stück rückt in der Vorderebene von der Mitte der Grundfläche weg.
  const lage = (D, tt) => {
    const c = schwer2(D), v = [c[0] - c0[0], c[1] - c0[1]], l = Math.hypot(...v) || 1;
    return [(v[0] / l) * GH_WEG * tt, (v[1] / l) * GH_WEG * tt, 0];
  };
  const spur = [];
  teile.forEach((D) => [0, 1].forEach((tt) => liegend(D, 5).forEach((f) => spur.push(...R.schiebePunkte(f.pts, lage(D, tt))))));
  const bu = R.buehne(KAV, spur, { breite: W, maxHoehe: 380, s0: 32, extra: { unten: 10 } });
  const svg = flaeche(W, bu.hoehe, `${F.koerper}, in Dreiecksprismen zerlegt`);
  R.zeichneKoerperListe(svg, bu, teile.map((D, i) => ({
    flaechen: mitKlassen(verschiebe(liegend(D, h), lage(D, t)), { "data-stueck": String(i) }),
    verdeckt: false,
  })));
  const Gi = teile.map((D) => R.flaecheEben(D));
  if (t > 0.5) teile.forEach((D, i) => {
    const c = schwer2(D), d = lage(D, t);
    R.text(svg, bu, [c[0] + d[0], c[1] + d[1], 0], `${num(Gi[i])} cm²`, "kp-t-g kp-text-klein", 0, 4, "middle", { "data-rolle": "gi-text" });
  });
  // h an der Tiefenkante der höchsten Ecke, links davon: Dort liegt kein anderes Teil.
  const oben = teile.flatMap((D) => D.map((p) => { const d = lage(D, t); return [p[0] + d[0], p[1] + d[1]]; })).reduce((m, p) => (p[1] > m[1] + 1e-9 || (Math.abs(p[1] - m[1]) < 1e-9 && p[0] < m[0]) ? p : m));
  R.text(svg, bu, [oben[0], oben[1], h / 2], `h = ${h} cm`, "kp-t-h kp-text-klein", -8, -2, "end");
  zeige("gh-mount", svg);
  const G = Gi.reduce((s, x) => s + x, 0);
  setzeHtml("gh-bilanz",
    `Grundfläche in ${teile.length} Teile zerlegt: <span class="wc">G = ${Gi.map((x) => num(x)).join(" cm² + ")} cm² = <strong data-rolle="G">${num(G)}</strong> cm²</span><br>` +
    `Volumen: ${Gi.map((x) => `${num(x)} cm² · ${h} cm`).join(" + ")} = (${Gi.map(num).join(" + ")}) cm² · ${h} cm<br>` +
    `<span class="wa">V = G · h = ${num(G)} cm² · ${h} cm = <strong data-rolle="V">${num(G * h)}</strong> cm³</span>`);
  setzeText("gh-text", t === 0
    ? `Das ${F.koerper} ist ${h} cm hoch. Seine Grundfläche lässt sich in Rechtecke und Dreiecke zerlegen.`
    : t < 1
      ? "Die Teile rücken auseinander — keines wird größer oder kleiner."
      : `${teile.length} Teile, alle ${h} cm hoch: Quader und Dreiecksprismen. Jedes hat das Volumen Gᵢ · h (Abschnitte 1 und 2); zusammen G · h = ${num(G * h)} cm³.`);
}

// ================= 4. Raumeinheiten =================

const EI_LUECKE = 0.7;
// Der 1-dm-Würfel (10 cm) als Platten (y), die oberste Platte als Stangen (z), deren vorderste als
// Würfel (x). Jeder Schritt zieht nur auseinander.
function eiKoerper(t) {
  const sA = Math.min(1, t / 0.34), sB = Math.max(0, Math.min(1, (t - 0.33) / 0.34)), sC = Math.max(0, (t - 0.66) / 0.34);
  const out = [];
  const yPlatte = (k) => k * (1 + EI_LUECKE * sA);
  for (let k = 0; k < 9; k++) out.push({ art: "platte", x: 0, y: yPlatte(k), z: 0, a: 10, hh: 1, b: 10 });
  const zStange = (j) => j * (1 + EI_LUECKE * sB);
  if (sB === 0 && sC === 0) out.push({ art: "platte", x: 0, y: yPlatte(9), z: 0, a: 10, hh: 1, b: 10 });
  else {
    for (let j = 1; j < 10; j++) out.push({ art: "stange", x: 0, y: yPlatte(9), z: zStange(j), a: 10, hh: 1, b: 1 });
    if (sC === 0) out.push({ art: "stange", x: 0, y: yPlatte(9), z: 0, a: 10, hh: 1, b: 1 });
    else for (let i = 0; i < 10; i++) out.push({ art: "wuerfel", x: i * (1 + EI_LUECKE * sC), y: yPlatte(9), z: 0, a: 1, hh: 1, b: 1 });
  }
  return out;
}
const EI_KLASSE = { platte: "kp-g", stange: "kp-m", wuerfel: "kp-a" };

function renderEinheiten() {
  const t = reglerZahl("ei-t") / 100;
  setzeText("ei-t-anzeige", prozent(t));
  const spur = [];
  for (const tt of [0, 1]) eiKoerper(tt).forEach((q) => R.quaderFlaechen(q.x, q.y, q.z, q.a, q.hh, q.b).forEach((f) => spur.push(...f.pts)));
  const bu = R.buehne(KAV, spur, { breite: W, maxHoehe: 420, s0: 16, extra: { links: 50, unten: 20 } });
  const svg = flaeche(W, bu.hoehe, "Ein Würfel von 1 dm³, zerlegt");
  const qs = eiKoerper(t);
  R.zeichneKoerperListe(svg, bu, qs.map((q, k) => ({
    flaechen: R.quaderFlaechen(q.x, q.y, q.z, q.a, q.hh, q.b).map((f) => ({ ...f, klasse: EI_KLASSE[q.art] + " kp-flaeche", daten: { "data-rolle": q.art, "data-k": String(k) } })),
    unsichtbare: false,
  })));
  R.text(svg, bu, [5, 0, 0], "1 dm = 10 cm", "kp-t-g kp-text-klein", 0, 18);
  zeige("ei-mount", svg);
  const anz = (art) => qs.filter((q) => q.art === art).length;
  setzeHtml("ei-bilanz",
    `Zu sehen: <strong data-rolle="platten">${anz("platte")}</strong> Platten (je 10 · 10 · 1 = 100 cm³), <strong data-rolle="stangen">${anz("stange")}</strong> Stangen (je 10 cm³), <strong data-rolle="wuerfel">${anz("wuerfel")}</strong> Würfel (je 1 cm³)<br>` +
    `zusammen <span class="wa"><strong data-rolle="summe">${num(anz("platte") * 100 + anz("stange") * 10 + anz("wuerfel"))}</strong> cm³</span><br>` +
    `<span class="wa">1 dm³ = 10 · 100 cm³ = ${num(1000)} cm³ = 1 l</span>, also 1 cm³ = 1 ml`);
  setzeText("ei-text", t === 0
    ? "Ein Würfel mit 1 dm = 10 cm Kantenlänge: 1 dm³. Genau so viel ist 1 Liter."
    : t < 0.34
      ? "Er zerfällt in 10 Platten, jede 10 cm × 10 cm × 1 cm = 100 cm³."
      : t < 0.67
        ? "Die oberste Platte zerfällt in 10 Stangen, jede 10 cm³."
        : "Eine Stange zerfällt in 10 Würfel zu je 1 cm³. Also: 1 dm³ = 10 Platten = 100 Stangen = 1000 Würfel = 1000 cm³.");
}

// ================= Kontrollfragen =================

mountQuizze({
  "quiz-wuerfel": {
    q: "Wie viele Einheitswürfel von 1 cm³ passen in einen Quader mit 4 cm × 3 cm × 5 cm?",
    options: ["12", "60", "94", "47"],
    correct: 1,
    explain: "In eine Schicht passen 4 · 3 = 12 Würfel, und es gibt 5 Schichten: 12 · 5 = 60. 12 ist nur eine Schicht, 94 ist die Oberfläche in cm².",
  },
  "quiz-dreieck": {
    q: "Ein Dreiecksprisma: Grundseite g = 6 cm, Höhe des Dreiecks hg = 4 cm, Höhe des Prismas h = 10 cm. Wie groß ist sein Volumen?",
    options: ["240 cm³", "60 cm³", "120 cm³", "24 cm³"],
    correct: 2,
    explain: "Es ist der halbe Quader 6 cm × 4 cm × 10 cm = 240 cm³, also 120 cm³. Anders gerechnet: G = ½ · 6 cm · 4 cm = 12 cm², V = 12 cm² · 10 cm = 120 cm³.",
  },
  "quiz-gh": {
    q: "Ein Prisma hat die Grundfläche G = 15 cm² und die Höhe h = 8 cm. Wie groß ist sein Volumen?",
    options: ["120 cm³", "23 cm³", "60 cm³", "240 cm³"],
    correct: 0,
    explain: "V = G · h = 15 cm² · 8 cm = 120 cm³. Addieren (23) ergibt keine Rauminhalt-Einheit, und 240 cm³ entstünde mit 2 · G — das gehört zur Oberfläche, nicht zum Volumen.",
  },
  "quiz-einheiten": {
    q: "Wie viele Liter passen in einen Würfel mit 1 m Kantenlänge?",
    options: ["10 l", "100 l", "1.000.000 l", "1000 l"],
    correct: 3,
    explain: "1 m = 10 dm, also 1 m³ = 10 · 10 · 10 dm³ = 1000 dm³ = 1000 l. 1.000.000 ist die Zahl der cm³ — das wären Milliliter.",
  },
});

// ================= Verdrahten =================

["wf-a", "wf-b", "wf-h", "wf-t"].forEach((id) => document.getElementById(id).addEventListener("input", renderWuerfel));
["dr-art", "dr-g", "dr-hg", "dr-p", "dr-h", "dr-t"].forEach((id) => document.getElementById(id).addEventListener("input", renderDreieck));
["gh-form", "gh-h", "gh-t"].forEach((id) => document.getElementById(id).addEventListener("input", renderZerlegen));
["ei-t"].forEach((id) => document.getElementById(id).addEventListener("input", renderEinheiten));
renderWuerfel();
renderDreieck();
renderZerlegen();
renderEinheiten();

mountUebungsaufgaben(document.getElementById("exercises-mount"), AUFGABEN);
