// Selbstlernpfad „Oberflächeninhalt von Zylindern“ (Klasse 8, Körper, Thema 4).
//
// Reihenfolge — jeder Abschnitt benutzt nur, was vorher da war:
//   1. Regelmäßige n-Eck-Prismen mit wachsendem n: Der Mantel bleibt ein Rechteck u · h, der Umfang
//      des n-Ecks rückt an 2 · π · r heran (Seitenlänge gemessen — Trigonometrie kommt später).
//   2. Das Netz: Die Kreise klappen auf, der Mantel wird AUFGEBOGEN (nicht gedehnt): Sein Querschnitt
//      ist in jeder Stellung ein Kreisbogen der Länge 2 · π · r. Der Blick dreht sich dabei nach vorn,
//      sodass das Netz am Ende in wahrer Größe erscheint.
//   3. Die Oberfläche: Beide Kreise werden in Ausschnitte geschnitten und abwechselnd über den Mantel
//      gelegt (wie auf der Kreis-Seite) — ein Fast-Rechteck 2 · π · r × (r + h). Starr.
//   4. Offene Zylinder (Dose ohne Deckel, Rohr) und die Umkehrung h = M : (2 · π · r).
//
// Gerechnet wird mit den Reglerwerten und der π-Taste, gerundet erst bei der Ausgabe.
// Farben: Kreise blau, Mantel orange, Höhe violett, Flächeninhalt grün, Fehlendes rot.
// Die Übungsaufgaben stehen in oberflaeche-zylinder-aufgaben.js.

import { flaeche, zeige, num, zwei, reglerZahl, setzeText, setzeHtml, wahl, mountQuizze, mountUebungsaufgaben } from "./seite.js?v=1";
import * as R from "./raum.js?v=1";
import { AUFGABEN } from "./oberflaeche-zylinder-aufgaben.js?v=1";

const W = 640;
const PI = Math.PI;
const prozent = (t) => `${Math.round(t * 100)} %`;
const cm = (x) => `${num(x)} cm`;

// ================= 1. Vom Prisma zum Zylinder =================

// Eckenzahlen am Regler; der letzte Schritt ist der Zylinder selbst.
const ZY_ECKEN = [3, 4, 5, 6, 8, 12, 24, 48];
const ZY_KAM = R.ansicht(22);

function renderZylinder() {
  const k = reglerZahl("zy-k"), r = reglerZahl("zy-r"), h = reglerZahl("zy-h");
  const zylinder = k >= ZY_ECKEN.length;
  const n = zylinder ? R.ZYL_N : ZY_ECKEN[k];
  setzeText("zy-k-anzeige", zylinder ? "Zylinder" : `${n}`);
  setzeText("zy-r-anzeige", cm(r));
  setzeText("zy-h-anzeige", cm(h));
  // Fester Rahmen: größter Radius, größte Höhe.
  const bu = R.buehne(ZY_KAM, [...R.kreisPunkte(4, 0), ...R.kreisPunkte(4, 6)], { breite: W, maxHoehe: 360, s0: 34, extra: { links: 80, unten: 10 } });
  const svg = flaeche(W, bu.hoehe, zylinder ? "Zylinder" : `Prisma mit regelmäßigem ${n}-Eck`);
  R.zeichneZylinder(svg, bu, { r, y0: 0, y1: h, n, kanten: !zylinder && n <= 24 });
  R.strecke(svg, bu, [-r - 0.5, 0, 0], [-r - 0.5, h, 0], "kp-hoehe", { "data-rolle": "hoehe" });
  R.text(svg, bu, [-r - 0.5, h / 2, 0], `h = ${cm(h)}`, "kp-t-h", -8, 4, "end");
  zeige("zy-mount", svg);
  const u = 2 * PI * r;
  if (zylinder) {
    setzeHtml("zy-bilanz",
      `Grundfläche: Kreis mit r = ${cm(r)} — Umfang <span class="wc">u = 2 · π · r ≈ <strong data-rolle="u">${zwei(u)}</strong> cm</span><br>` +
      `Mantel: ein gebogenes Rechteck <span class="wb">u × h</span>, also M = 2 · π · r · h ≈ <strong data-rolle="M">${zwei(u * h)}</strong> cm²`);
  } else {
    const s = 2 * r * Math.sin(PI / n), un = n * s;
    setzeHtml("zy-bilanz",
      `Grundfläche: regelmäßiges ${n}-Eck im Kreis mit r = ${cm(r)}, Seite s ≈ ${zwei(s)} cm (gemessen)<br>` +
      `Umfang u = ${n} · s ≈ <strong data-rolle="un">${zwei(un)}</strong> cm — zum Vergleich der Kreis: 2 · π · r ≈ <strong data-rolle="u">${zwei(u)}</strong> cm<br>` +
      `Mantel: ${n} Rechtecke, zusammen <span class="wb">u · h</span> ≈ <strong data-rolle="M">${zwei(un * h)}</strong> cm²`);
  }
  setzeText("zy-text", zylinder
    ? "Der Zylinder: Grund- und Deckfläche sind Kreise, der Mantel ist glatt. Er ist so lang wie der Kreisumfang."
    : n < 12
      ? `Ein Prisma mit ${n} Ecken — man sieht die Kanten noch deutlich. Erhöhe die Zahl der Ecken.`
      : `Bei ${n} Ecken ist der Umfang des Vielecks schon fast der Kreisumfang: Das Prisma wird zum Zylinder.`);
}

// ================= 2. Das Netz =================

// Der Blick bleibt schräg von rechts oben, solange sich etwas biegt — von vorn sähe man die Krümmung
// nicht —, und dreht sich erst am Schluss nach vorn, damit das fertige Netz in wahrer Größe erscheint.
const nzTeile = (t) => {
  const w = Math.max(0, (t - 0.8) / 0.2);
  return { tD: Math.min(1, t / 0.35), s: 1 - Math.min(1, Math.max(0, (t - 0.35) / 0.5)), eps: 28 * (1 - w), psi: -22 * (1 - w) };
};
const nzKamera = (t) => { const n = nzTeile(t); return R.ansicht(n.eps, n.psi); };

// Die Teile des Netzes in der Stellung t: Mantelstreifen (aufgebogen) mit ihren Rändern, Grund- und
// Deckkreis (umgeklappt um die vorderen Mantellinien oben und unten). `fehlt` nennt Kreise, die es
// nicht gibt (offene Zylinder).
function zylNetz(r, h, t, fehlt = {}) {
  const { tD, s } = nzTeile(t);
  const streifen = R.mantelStreifen(r, h, s);
  const teile = streifen.map((st, i) => ({
    rolle: "mantel", nr: st.nr, pts: st.pts, klasse: "kp-m kp-glatt",
    daten: { "data-rolle": "mantel", "data-nr": String(i) },
    // Ränder oben und unten; am ersten und letzten Streifen die Schnittkante.
    linien: [
      { pts: [st.pts[0], st.pts[1]], klasse: "kp-rand", daten: { "data-rolle": "rand" } },
      { pts: [st.pts[3], st.pts[2]], klasse: "kp-rand", daten: { "data-rolle": "rand" } },
      ...(i === 0 ? [{ pts: [st.pts[0], st.pts[3]], klasse: "kp-rand", daten: { "data-rolle": "schnitt" } }] : []),
      ...(i === streifen.length - 1 ? [{ pts: [st.pts[1], st.pts[2]], klasse: "kp-rand", daten: { "data-rolle": "schnitt" } }] : []),
    ],
  }));
  const x = [1, 0, 0];
  const deckel = R.drehePunkte(R.kreisPunkte(r, h), [0, h, -r], x, (-PI / 2) * tD);
  const grund = R.drehePunkte(R.kreisPunkte(r, 0), [0, 0, -r], x, (PI / 2) * tD);
  for (const [rolle, pts] of [["deckel", deckel], ["grund", grund]]) {
    teile.push({ rolle, pts, klasse: fehlt[rolle] ? "kp-fehlt" : "kp-g", daten: { "data-rolle": rolle, ...(fehlt[rolle] ? { "data-fehlt": "1" } : {}) } });
  }
  return teile;
}
function zeichneZylNetz(svg, bu, teile) {
  // Fehlende Kreise als roter Umriss obenauf — sie verdecken nichts.
  R.zeichneFlaechen(svg, bu, teile.filter((f) => !f.daten["data-fehlt"]));
  teile.filter((f) => f.daten["data-fehlt"]).forEach((f) => R.vieleck(svg, bu, f.pts, f.klasse, f.daten));
}
function netzBuehne(rMax, hMax, extra) {
  const spur = [];
  for (let k = 0; k <= 20; k++) {
    const kam = nzKamera(k / 20);
    zylNetz(rMax, hMax, k / 20).forEach((f) => f.pts.forEach((p) => spur.push(kam.bild(p))));
  }
  return spur;
}

function renderNetz() {
  const r = reglerZahl("nz-r"), h = reglerZahl("nz-h"), t = reglerZahl("nz-t") / 100;
  setzeText("nz-r-anzeige", cm(r));
  setzeText("nz-h-anzeige", cm(h));
  setzeText("nz-t-anzeige", prozent(t));
  const kam = nzKamera(t);
  const bu = R.buehne(kam, netzBuehne(3, 6), { breite: W, maxHoehe: 460, s0: 30, extra: { links: 60, unten: 6 } });
  const svg = flaeche(W, bu.hoehe, "Netz eines Zylinders");
  if (t === 0) R.zeichneZylinder(svg, bu, { r, y0: 0, y1: h });
  else zeichneZylNetz(svg, bu, zylNetz(r, h, t));
  const u = 2 * PI * r;
  if (t === 1) {
    R.text(svg, bu, [0.65 * PI * r, h, -r], `u = 2 · π · r ≈ ${zwei(u)} cm`, "kp-t-g kp-text-klein", 0, -8, "middle", { "data-rolle": "u-text" });
    R.text(svg, bu, [-PI * r, h / 2, -r], `h = ${cm(h)}`, "kp-t-h kp-text-klein", -8, 4, "end", { "data-rolle": "h-text" });
  }
  zeige("nz-mount", svg);
  setzeHtml("nz-bilanz",
    `Mantel abgewickelt: ein Rechteck, so lang wie der Umfang <span class="wc">u = 2 · π · ${num(r)} cm ≈ <strong data-rolle="u">${zwei(u)}</strong> cm</span> und so hoch wie <span class="wr">h = ${cm(h)}</span><br>` +
    `<span class="wa">M = 2 · π · r · h = 2 · π · ${num(r)} cm · ${num(h)} cm ≈ <strong data-rolle="M">${zwei(u * h)}</strong> cm²</span>`);
  setzeText("nz-text", t === 0
    ? "Der geschlossene Zylinder. Klapp ihn auf."
    : t < 0.35
      ? "Deckel und Boden klappen um die vordere Mantellinie nach oben und unten."
      : t < 0.85
        ? "Jetzt wird der Mantel aufgebogen: Er bleibt überall gleich lang und gleich hoch, nur seine Krümmung verschwindet."
        : t < 1
          ? "Der Mantel ist gerade. Der Blick dreht sich nach vorn, bis du senkrecht auf das Netz schaust."
        : `Das Netz: zwei Kreise und ein Rechteck. Das Rechteck ist ${zwei(u)} cm lang — so lang wie der Kreisumfang — und ${cm(h)} hoch.`);
}

// ================= 3. Die Oberfläche: Fast-Rechteck =================

// Die Ausschnitte beider Kreise nacheinander abwechselnd über den Mantel gelegt (Bogen unten, Bogen
// oben, …). Wie auf der Kreis-Seite brechen sie nacheinander auf: Stück k startet bei
// t = VERSATZ · k / (Anzahl − 1); flögen alle zugleich, lägen sie unterwegs übereinander.
const FR_VERSATZ = 0.75, FR_BOGEN = 8, FR_LUECKE = 0.6;
const kurz = (w) => { while (w > PI) w -= 2 * PI; while (w < -PI) w += 2 * PI; return w; };
function frStuecke(r, h, stueckeJeKreis, t) {
  const m = stueckeJeKreis / 2, theta = (2 * PI) / stueckeJeKreis, c = 2 * r * Math.sin(theta / 2);
  const K = 2 * stueckeJeKreis;
  const mitten = [[(PI * r) / 2, h + r + FR_LUECKE], [(3 * PI * r) / 2, h + r + FR_LUECKE]];
  const out = [];
  for (let k = 0; k < K; k++) {
    const j = k < stueckeJeKreis ? 0 : 1, q = k - j * stueckeJeKreis;
    const tk = Math.min(1, Math.max(0, (t - (FR_VERSATZ * k) / (K - 1)) / (1 - FR_VERSATZ)));
    const a0 = PI / 2 + q * theta, a1 = a0 + theta, am = (a0 + a1) / 2;
    const unten = q % 2 === 0, i = Math.floor(q / 2);
    const X0 = j * m * c;
    // Ziel der Spitze: Bogen unten → Spitze oben (Höhe h + r); Bogen oben → Spitze unten, dort, wo die
    // Sehnen der Nachbarn enden.
    const ziel = unten ? [X0 + (i + 0.5) * c, h + r] : [X0 + (i + 1) * c, h + r * (1 - Math.cos(theta / 2))];
    const achse = unten ? -PI / 2 : PI / 2;
    const dreh = kurz(achse - am) * tk;
    const C = mitten[j];
    const spitze = [C[0] + (ziel[0] - C[0]) * tk, C[1] + (ziel[1] - C[1]) * tk];
    const pts = [[0, 0]];
    for (let s = 0; s <= FR_BOGEN; s++) { const a = a0 + (theta * s) / FR_BOGEN; pts.push([r * Math.cos(a), r * Math.sin(a)]); }
    const gedreht = pts.map(([x, y]) => [spitze[0] + x * Math.cos(dreh) - y * Math.sin(dreh), spitze[1] + x * Math.sin(dreh) + y * Math.cos(dreh)]);
    out.push({ k, kreis: j, unten, pts: gedreht, spitze });
  }
  return { stuecke: out, c, m };
}
const FR_KAM = R.ansicht(0);

function renderFastRechteck() {
  const r = reglerZahl("fr-r"), h = reglerZahl("fr-h"), n = reglerZahl("fr-n"), t = reglerZahl("fr-t") / 100;
  setzeText("fr-r-anzeige", cm(r));
  setzeText("fr-h-anzeige", cm(h));
  setzeText("fr-n-anzeige", String(n));
  setzeText("fr-t-anzeige", prozent(t));
  // Fester Rahmen: größter Radius, größte Höhe, ganzer Weg.
  const spur = [[0, 0], [2 * PI * 2.5, 0], [0, 5 + 2 * 2.5 + FR_LUECKE + 0.1], [2 * PI * 2.5, 5 + 2 * 2.5 + FR_LUECKE + 0.1]];
  const bu = R.buehne(FR_KAM, spur, { breite: W, maxHoehe: 420, s0: 36, extra: { links: 70, rechts: 70, unten: 26 } });
  const svg = flaeche(W, bu.hoehe, "Mantel und zwei Kreise, umgelegt");
  const auf = (p) => [p[0], p[1], 0];
  R.vieleck(svg, bu, [[0, 0, 0], [2 * PI * r, 0, 0], [2 * PI * r, h, 0], [0, h, 0]], "kp-m", { "data-rolle": "mantel" });
  const { stuecke, c, m } = frStuecke(r, h, n, t);
  for (const s of stuecke) R.vieleck(svg, bu, s.pts.map(auf), s.unten ? "kp-g" : "kp-g kp-blass", { "data-rolle": "stueck", "data-kreis": String(s.kreis), "data-nr": String(s.k) });
  R.text(svg, bu, [PI * r, 0, 0], `2 · π · r ≈ ${zwei(2 * PI * r)} cm`, "kp-t-g kp-text-klein", 0, 18);
  R.text(svg, bu, [0, h / 2, 0], `h = ${cm(h)}`, "kp-t-h kp-text-klein", -8, 4, "end");
  if (t === 1) {
    R.text(svg, bu, [0, h + r / 2, 0], `r = ${cm(r)}`, "kp-t-g kp-text-klein", -8, 4, "end", { "data-rolle": "r-text" });
    R.text(svg, bu, [2 * PI * r, (h + r) / 2, 0], `r + h = ${cm(r + h)}`, "kp-t-a kp-text-klein", 8, 4, "start", { "data-rolle": "rh-text" });
  }
  zeige("fr-mount", svg);
  const O = 2 * PI * r * r + 2 * PI * r * h;
  setzeHtml("fr-bilanz",
    `Zwei Kreise: <span class="wc">2 · π · r² = 2 · π · ${num(r * r)} cm² ≈ ${zwei(2 * PI * r * r)} cm²</span>; Mantel: <span class="wb">2 · π · r · h ≈ ${zwei(2 * PI * r * h)} cm²</span><br>` +
    `<span class="wa">O = 2 · π · r² + 2 · π · r · h = 2 · π · r · (r + h) = 2 · π · ${num(r)} cm · ${cm(r + h)} ≈ <strong data-rolle="O">${zwei(O)}</strong> cm²</span><br>` +
    `Die ${2 * n} Stücke liegen auf ${zwei(2 * m * c)} cm (Sehnen, gemessen) — ihre Bögen sind zusammen 2 · π · r ≈ ${zwei(2 * PI * r)} cm lang.`);
  setzeText("fr-text", t === 0
    ? `Über dem Mantel liegen die beiden Kreise, jeder in ${n} gleiche Stücke geschnitten.`
    : t < 1
      ? "Die Stücke drehen sich um ihre Spitze und legen sich abwechselnd mit dem Bogen nach unten und nach oben über den Mantel."
      : `Jeder Kreis ist ein Fast-Rechteck π · r lang und r hoch; zusammen liegen sie als Streifen 2 · π · r × r über dem Mantel. Alles zusammen ist fast ein Rechteck 2 · π · r × (r + h).`);
}

// ================= 4. Offene Zylinder =================

const DINGE = {
  dose: { name: "Dose", fehlt: {}, kreise: 2 },
  offen: { name: "Dose ohne Deckel", fehlt: { deckel: true }, kreise: 1 },
  rohr: { name: "Rohr", fehlt: { deckel: true, grund: true }, kreise: 0 },
};

function renderAnwenden() {
  const d = DINGE[wahl("an-ding")];
  const r = reglerZahl("an-r"), h = reglerZahl("an-h"), t = reglerZahl("an-t") / 100;
  setzeText("an-r-anzeige", cm(r));
  setzeText("an-h-anzeige", cm(h));
  setzeText("an-t-anzeige", prozent(t));
  const kam = nzKamera(t);
  const bu = R.buehne(kam, netzBuehne(3, 6), { breite: W, maxHoehe: 460, s0: 30 });
  const svg = flaeche(W, bu.hoehe, d.name);
  // Auch geschlossen von hinten nach vorn gemalt: Durch die Öffnung sieht man die Innenseite.
  zeichneZylNetz(svg, bu, zylNetz(r, h, t, d.fehlt));
  zeige("an-mount", svg);
  const M = 2 * PI * r * h, K = PI * r * r, O = M + d.kreise * K;
  setzeHtml("an-bilanz",
    `Mantel: <span class="wb">2 · π · ${num(r)} cm · ${num(h)} cm ≈ ${zwei(M)} cm²</span><br>` +
    `Kreise: ${d.kreise === 0 ? "keine — Boden und Deckel fehlen" : `<span class="wc">${d.kreise === 2 ? "2 · " : ""}π · ${num(r)}² cm² ≈ ${zwei(d.kreise * K)} cm²</span>`}${d.kreise === 1 ? " (nur der Boden, der Deckel fehlt)" : ""}<br>` +
    `<span class="wa">O ≈ <strong data-rolle="O">${zwei(O)}</strong> cm²</span>`);
  setzeText("an-text", d.kreise === 2
    ? "Eine geschlossene Dose: Mantel und zwei Kreise."
    : d.kreise === 1
      ? "Ohne Deckel: Mantel und nur ein Kreis — der Boden."
      : "Ein Rohr ist nur ein Mantel: Boden und Deckel fehlen.");
}

// ================= Kontrollfragen =================

mountQuizze({
  "quiz-zylinder": {
    q: "Ein Zylinder hat den Durchmesser d = 10 cm. Wie lang ist sein Mantel, wenn man ihn abwickelt?",
    options: ["≈ 62,83 cm", "≈ 15,71 cm", "≈ 78,54 cm", "≈ 31,42 cm"],
    correct: 3,
    explain: "Der Mantel ist so lang wie der Umfang: u = π · d = π · 10 cm ≈ 31,42 cm. 62,83 cm entstünde mit dem Durchmesser statt des Radius in 2 · π · r, 78,54 cm² ist der Flächeninhalt des Kreises.",
  },
  "quiz-netz": {
    q: "Ein Zylinder hat r = 2 cm und h = 5 cm. Wie groß ist das Rechteck seines Mantels?",
    options: ["≈ 12,57 cm × 5 cm", "≈ 6,28 cm × 5 cm", "≈ 12,57 cm × 2 cm", "5 cm × 2 cm"],
    correct: 0,
    explain: "Die eine Seite ist der Umfang 2 · π · 2 cm ≈ 12,57 cm, die andere die Höhe 5 cm. 6,28 cm wäre nur π · r, der halbe Umfang.",
  },
  "quiz-oberflaeche": {
    q: "Ein Zylinder hat r = 3 cm und h = 7 cm. Wie groß ist seine Oberfläche?",
    options: ["≈ 160,22 cm²", "≈ 188,50 cm²", "≈ 131,95 cm²", "≈ 94,25 cm²"],
    correct: 1,
    explain: "O = 2 · π · r · (r + h) = 2 · π · 3 cm · 10 cm = 60 · π cm² ≈ 188,50 cm². Mit nur einem Kreis käme 160,22 cm² heraus, der Mantel allein ist 131,95 cm².",
  },
  "quiz-anwenden": {
    q: "Ein Rohr hat den Radius 2 cm und ist 50 cm lang. Wie viel Blech braucht es?",
    options: ["≈ 653,45 cm²", "≈ 314,16 cm²", "≈ 628,32 cm²", "≈ 640,88 cm²"],
    correct: 2,
    explain: "Ein Rohr ist nur ein Mantel: M = 2 · π · 2 cm · 50 cm = 200 · π cm² ≈ 628,32 cm². Mit zwei Kreisen wären es 653,45 cm² — aber ein Rohr ist an beiden Enden offen.",
  },
});

// ================= Verdrahten =================

["zy-k", "zy-r", "zy-h"].forEach((id) => document.getElementById(id).addEventListener("input", renderZylinder));
["nz-r", "nz-h", "nz-t"].forEach((id) => document.getElementById(id).addEventListener("input", renderNetz));
["fr-r", "fr-h", "fr-n", "fr-t"].forEach((id) => document.getElementById(id).addEventListener("input", renderFastRechteck));
["an-ding", "an-r", "an-h", "an-t"].forEach((id) => document.getElementById(id).addEventListener("input", renderAnwenden));
renderZylinder();
renderNetz();
renderFastRechteck();
renderAnwenden();

mountUebungsaufgaben(document.getElementById("exercises-mount"), AUFGABEN);
