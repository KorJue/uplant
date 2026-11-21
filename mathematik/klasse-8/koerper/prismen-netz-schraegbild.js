// Selbstlernpfad „Prismen: Netz und Schrägbild“ (Klasse 8, Körper, Thema 1).
//
// Reihenfolge — jeder Abschnitt benutzt nur, was vorher da war:
//   1. Was ist ein Prisma? Ein Vieleck wird senkrecht hochgeschoben; Deckfläche = verschobene Kopie.
//      Ecken, Kanten und Flächen werden gezählt (2n, 3n, n + 2).
//   2. Das Netz: Grund- und Deckfläche klappen um die Kanten der Vorderfläche, dann wird der Mantel
//      abgewickelt. Jede Fläche dreht sich nur um eine Kante, die sie mit einer Nachbarin teilt.
//   3. Das Schrägbild in vier Schritten (Vorderfläche, Tiefe unter 45° halb so lang, Rückfläche,
//      verdeckte Kanten).
//   4. Die Lage: Das Prisma kippt starr um seine vordere Kante. Grundfläche und Höhe bleiben dieselben.
//
// Gerechnet und gezeichnet wird im Raum (raum.js); jede Fläche trägt ihre Raumpunkte als data-p3.
// Farben: Grund- und Deckfläche blau, Seitenflächen orange, Höhe violett, Tiefe grün.
// Die Übungsaufgaben stehen in prismen-netz-schraegbild-aufgaben.js.

import { el, svgEl, svgText, flaeche, zeige, num, reglerZahl, setzeText, setzeHtml, wahl, mountQuizze, mountUebungsaufgaben } from "./seite.js?v=1";
import * as R from "./raum.js?v=1";
import { AUFGABEN } from "./prismen-netz-schraegbild-aufgaben.js?v=1";

const W = 640;
const KAV = R.kavalier();
const NAMEN = { 3: "Dreieck", 4: "Viereck", 5: "Fünfeck", 6: "Sechseck", 8: "Achteck" };
const cm = (x) => `${num(x)} cm`;
const prozent = (t) => `${Math.round(t * 100)} %`;
const klasseVon = (rolle) => (rolle === "seite" ? "kp-m" : "kp-g");
const mitKlassen = (fl, zusatz = " kp-flaeche") => fl.map((f) => ({
  ...f, klasse: klasseVon(f.rolle) + zusatz,
  daten: { "data-rolle": f.rolle, ...(f.nr !== undefined ? { "data-nr": String(f.nr) } : {}) },
}));
const auf = ([x, z], y) => [x, y, z];

// Regelmäßiges n-Eck mit Kante 0 vorn (waagerecht, auf z = 0), gegen den Uhrzeigersinn.
function regelmaessig(n, r) {
  const pts = [];
  for (let k = 0; k < n; k++) {
    const a = -Math.PI / 2 - Math.PI / n + (2 * Math.PI * k) / n;
    pts.push([r * Math.cos(a), r * Math.sin(a)]);
  }
  const x0 = Math.min(...pts.map((p) => p[0])), z0 = Math.min(...pts.map((p) => p[1]));
  return pts.map(([x, z]) => [x - x0, z - z0]);
}

// Senkrechtes Maß links neben dem Körper (in der Vorderebene): Strich mit Endmarken und Beschriftung.
function hoehenMass(g, b, x, y0, y1, z, inhalt) {
  if (Math.abs(y1 - y0) < 1e-9) return;
  R.strecke(g, b, [x, y0, z], [x, y1, z], "kp-hoehe", { "data-rolle": "hoehe" });
  for (const y of [y0, y1]) {
    const [sx, sy] = b.nachBild([x, y, z]);
    g.appendChild(svgEl("line", { x1: (sx - 5).toFixed(2), x2: (sx + 5).toFixed(2), y1: sy.toFixed(2), y2: sy.toFixed(2), class: "kp-hoehe" }));
  }
  R.text(g, b, [x, (y0 + y1) / 2, z], inhalt, "kp-t-h", -8, 4, "end", { "data-rolle": "h-text" });
}

// ================= 1. Was ist ein Prisma? =================

const PR_R = 2.6, PR_HMAX = 6;

function renderPrisma() {
  const n = Number(wahl("pr-n"));
  const h = reglerZahl("pr-h");
  const t = reglerZahl("pr-t") / 100;
  setzeText("pr-h-anzeige", cm(h));
  setzeText("pr-t-anzeige", prozent(t));
  const grund = regelmaessig(n, PR_R);
  const xLinks = -0.7;
  // Die Bühne nimmt das höchste Prisma auf: Der Maßstab hängt nicht an h — ein höheres Prisma sieht
  // höher aus, und beim Hochschieben springt nichts.
  const b = R.buehne(KAV, [...grund.map((p) => auf(p, 0)), ...grund.map((p) => auf(p, PR_HMAX)), [xLinks, 0, 0]],
    { breite: W, maxHoehe: 380, s0: 40, extra: { links: 90, unten: 22 } });
  const svg = flaeche(W, b.hoehe, `Prisma mit einem ${NAMEN[n]} als Grundfläche`);
  const hh = t * h;
  if (hh < 1e-9) {
    R.vieleck(svg, b, grund.map((p) => auf(p, 0)), "kp-g", { "data-rolle": "grund" });
    R.text(svg, b, [(grund[0][0] + grund[1][0]) / 2, 0, 0], "Grundfläche", "kp-t-g", 0, 18);
  } else {
    R.zeichneKoerper(svg, b, mitKlassen(R.prismaFlaechen(grund, hh)));
    R.text(svg, b, R.mitte(grund.map((p) => auf(p, hh))), "Deckfläche", "kp-t-g", 0, 5, "middle", { "data-rolle": "deckel-text" });
    // Unter der vorderen Kante, nicht in der Fläche: Die Grundfläche ist von oben nicht zu sehen.
    R.text(svg, b, [(grund[0][0] + grund[1][0]) / 2, 0, 0], "Grundfläche (unten)", "kp-t-g", 0, 18);
    hoehenMass(svg, b, xLinks, 0, hh, 0, t === 1 ? `h = ${cm(h)}` : "");
  }
  zeige("pr-mount", svg);

  if (hh < 1e-9) {
    setzeHtml("pr-bilanz", `Noch flach: ein ${NAMEN[n]} mit <strong>${n}</strong> Ecken und ${n} Seiten. Ein Körper ist es noch nicht.`);
  } else {
    setzeHtml("pr-bilanz",
      `Ecken: ${n} unten + ${n} oben = 2 · ${n} = <strong data-rolle="ecken">${2 * n}</strong><br>` +
      `Kanten: ${n} unten + ${n} oben + ${n} Seitenkanten = 3 · ${n} = <strong data-rolle="kanten">${3 * n}</strong><br>` +
      `Flächen: <span class="wc">2 Grundflächen</span> + <span class="wb">${n} Seitenflächen</span> = ${n} + 2 = <strong data-rolle="flaechen">${n + 2}</strong>`);
  }
  setzeText("pr-text", t === 0
    ? `Die Grundfläche ist ein ${NAMEN[n]}. Schieb sie mit dem Regler nach oben.`
    : t < 1
      ? `Die Deckfläche ist eine Kopie der Grundfläche, nur verschoben: gleich groß, gleich geformt und parallel. Jede Seite des ${NAMEN[n]}s zieht ein Rechteck hinter sich her.`
      : `Fertig ist ein Prisma mit der Höhe h = ${cm(h)}: zwei deckungsgleiche ${NAMEN[n]}e, dazwischen ${n} Rechtecke. Die gestrichelten Kanten sind verdeckt — man sieht sie nicht, aber sie sind da und werden mitgezählt.`);
}

// ================= 2. Das Netz =================

const NZ_HMAX = 6;
const nzTeile = (t) => [Math.min(1, t / 0.4), Math.max(0, (t - 0.4) / 0.6)];

function renderNetz() {
  const key = wahl("nz-form"), F = R.FORMEN[key];
  const h = reglerZahl("nz-h");
  const t = reglerZahl("nz-t") / 100;
  setzeText("nz-h-anzeige", cm(h));
  setzeText("nz-t-anzeige", prozent(t));
  const n = F.grund.length;
  const L = R.seitenlaengen(F.grund);
  const u = L.reduce((s, x) => s + x, 0);
  // Bühne über den ganzen Weg beim größten h — das Netz springt beim Aufklappen nicht.
  const spur = [];
  for (let k = 0; k <= 20; k++) R.prismaNetz(F.grund, NZ_HMAX, ...nzTeile(k / 20)).forEach((f) => spur.push(...f.pts));
  const b = R.buehne(KAV, spur, { breite: W, maxHoehe: 460, s0: 26, extra: { links: 70 } });
  const svg = flaeche(W, b.hoehe, `Netz eines ${F.koerper}s`);
  if (t === 0) {
    R.zeichneKoerper(svg, b, mitKlassen(R.prismaFlaechen(F.grund, h)));
  } else {
    const fl = R.prismaNetz(F.grund, h, ...nzTeile(t));
    R.zeichneFlaechen(svg, b, mitKlassen(fl, ""));
    if (t === 1) {
      // Die Seitenlängen IN den Rechtecken, nahe der unteren Kante: Unter dem Streifen hängt die
      // Grundfläche, darüber die Deckfläche — dort wäre kein Platz.
      fl.filter((f) => f.rolle === "seite").forEach((f) => {
        R.text(svg, b, [(f.pts[0][0] + f.pts[1][0]) / 2, 0, 0], cm(L[f.nr]), "kp-t-m kp-text-klein", 0, -8, "middle", { "data-rolle": "seite-text", "data-nr": String(f.nr) });
      });
      const ganzLinks = Math.min(...fl.filter((f) => f.rolle === "seite").map((f) => f.pts[0][0]));
      R.text(svg, b, [ganzLinks, h / 2, 0], `h = ${cm(h)}`, "kp-t-h", -8, 4, "end", { "data-rolle": "h-text" });
      for (const rolle of ["grund", "deckel"]) R.text(svg, b, R.mitte(fl.find((f) => f.rolle === rolle).pts), "G", "kp-t-g", 0, 5);
    }
  }
  zeige("nz-mount", svg);

  const laengen = L.map(num).join(" cm + ") + " cm";
  setzeHtml("nz-bilanz",
    `Grundfläche: ${F.name} mit den Seiten ${L.map(num).join(" cm, ")} cm — Umfang <span class="wc">u = ${laengen} = <strong data-rolle="u">${num(u)}</strong> cm</span><br>` +
    `Mantel: <span class="wb">${n} Rechtecke</span>, alle <span class="wr">h = ${cm(h)}</span> hoch — nebeneinander ein Streifen <strong data-rolle="streifen">${num(u)} cm × ${num(h)} cm</strong><br>` +
    `Netz: 2 Grundflächen + ${n} Rechtecke = <strong data-rolle="anzahl">${n + 2}</strong> Flächen`);
  setzeText("nz-text", t === 0
    ? `Das ${F.koerper} ist geschlossen. Es wird an einigen Kanten aufgeschnitten und dann aufgeklappt.`
    : t < 0.4
      ? "Grund- und Deckfläche klappen um die untere und obere Kante der Vorderfläche nach außen."
      : t < 1
        ? "Jetzt wird der Mantel abgewickelt: Die Seitenflächen klappen um ihre senkrechten Kanten in die Ebene — die rechten nach rechts, die linken nach links."
        : `Das Netz: ${n} Rechtecke nebeneinander, zusammen ${num(u)} cm lang — so lang wie der Umfang der Grundfläche — und ${cm(h)} hoch. Oben und unten hängt je eine Grundfläche.`);
}

// ================= 3. Das Schrägbild =================

const SB_SCHRITTE = [
  "Vorderfläche in wahrer Größe zeichnen",
  "nach hinten laufende Kanten: unter 45°, halb so lang",
  "Endpunkte zur Rückfläche verbinden",
  "verdeckte Kanten stricheln",
];
const SB_HMAX = 8;

// Ein kleiner Bogen für den 45°-Winkel an der Ecke p (Bildpunkte).
function winkelBogen(g, [sx, sy], r) {
  const ex = sx + r * Math.cos(Math.PI / 4), ey = sy - r * Math.sin(Math.PI / 4);
  g.appendChild(svgEl("path", { d: `M ${(sx + r).toFixed(2)} ${sy.toFixed(2)} A ${r} ${r} 0 0 0 ${ex.toFixed(2)} ${ey.toFixed(2)}`, class: "kp-hilfe", "data-rolle": "winkel" }));
}

function renderSchraegbild() {
  const key = wahl("sb-form"), F = R.FORMEN[key];
  const h = reglerZahl("sb-h");
  const schritt = reglerZahl("sb-schritt");
  setzeText("sb-h-anzeige", cm(h));
  setzeText("sb-schritt-anzeige", `${schritt} von 4`);
  // Liegendes Prisma: Die Grundfläche steht vorn in der Ebene z = 0, die Höhe zeigt nach hinten.
  const vorn = F.grund.map(([x, y]) => [x, y, 0]);
  const hinten = F.grund.map(([x, y]) => [x, y, h]);
  const b = R.buehne(KAV, [...vorn, ...F.grund.map(([x, y]) => [x, y, SB_HMAX])], { breite: W, maxHoehe: 380, s0: 32, extra: { unten: 26, rechts: 40, links: 30 } });
  const svg = flaeche(W, b.hoehe, `Schrägbild eines ${F.koerper}s`);
  const n = vorn.length;
  const L = R.seitenlaengen(F.grund);

  if (schritt < 4) {
    R.vieleck(svg, b, vorn, "kp-g", { "data-rolle": "vorn" });
    if (schritt >= 2) for (let i = 0; i < n; i++) R.strecke(svg, b, vorn[i], hinten[i], "kp-tiefe", { "data-rolle": "tiefe" });
    if (schritt >= 3) {
      const ring = [...hinten, hinten[0]];
      R.linienzug(svg, b, ring, "kp-umriss", { "data-rolle": "hinten" });
    }
  } else {
    // Flächen des liegenden Prismas: vorn und hinten die Grundflächen, dazwischen die Rechtecke.
    const flaechen = [
      { rolle: "grund", pts: vorn.slice().reverse() },
      { rolle: "deckel", pts: hinten },
      ...vorn.map((p, i) => ({ rolle: "seite", nr: i, pts: [vorn[i], vorn[(i + 1) % n], hinten[(i + 1) % n], hinten[i]] })),
    ];
    R.zeichneKoerper(svg, b, mitKlassen(flaechen));
  }
  // Maße der Vorderfläche (wahre Größe). Im ersten Schritt alle vorn; danach laufen oben und rechts
  // die Tiefenkanten weg — dort stehen sie, sobald es sie gibt, an der Rückfläche.
  R.vorderflaecheMasse(svg, b, vorn, schritt === 1 ? vorn.map((p) => [p[0], p[1], 0]) : schritt >= 3 ? hinten : null,
    (i) => `${num(L[i])} cm`, "kp-t-g kp-text-klein", (i) => ({ "data-rolle": "vorn-mass", "data-nr": String(i) }));
  if (schritt >= 2) {
    // Rechts unten ist Platz: Dort beginnt die Tiefenkante der vorderen rechten Ecke (Ecke 1). Die
    // Rechnung steht unter der 45°-Marke — bei kurzer Tiefe lägen sonst beide übereinander.
    const ecke = b.nachBild(vorn[1]);
    winkelBogen(svg, ecke, 22);
    R.text(svg, b, vorn[1], "45°", "kp-t-grau kp-text-klein", 30, -4, "start");
    const m = b.nachBild([vorn[1][0], vorn[1][1], h / 2]);
    const t = svgText(m[0] + 10, Math.max(m[1] + 16, ecke[1] + 24), `${num(h)} : 2 = ${num(h / 2)} cm`, { class: "kp-text kp-t-a kp-text-klein", "text-anchor": "start", "data-rolle": "tiefe-text" });
    svg.appendChild(t);
  }
  zeige("sb-mount", svg);

  const liste = document.getElementById("sb-schritte");
  liste.innerHTML = "";
  SB_SCHRITTE.forEach((s, i) => liste.appendChild(el("li", { class: i + 1 === schritt ? "kp-an" : i + 1 < schritt ? "" : "kp-aus" }, `${i + 1}. ${s}`)));
  setzeText("sb-text", [
    `Die Vorderfläche ist eine Grundfläche des ${F.koerper}s — ein ${F.name}. Sie wird in wahrer Größe gezeichnet: Alle Maße stimmen.`,
    `Das Prisma ist ${cm(h)} tief. Die Tiefenkanten laufen unter 45° nach rechts oben und sind im Bild nur ${num(h)} : 2 = ${num(h / 2)} cm lang. Alle sind parallel und gleich lang.`,
    `Die Rückfläche ist eine Kopie der Vorderfläche, um ${num(h / 2)} cm schräg nach rechts oben verschoben — gleich groß und gleich geformt.`,
    `Fertig. Gestrichelt sind die Kanten, die hinter dem Körper liegen: Sie gehören zu keiner Fläche, die man von vorn rechts oben sieht.`,
  ][schritt - 1]);
}

// ================= 4. Die Lage =================

const LG_HMAX = 7;
const lgDrehung = R.kippe;

function renderLage() {
  const key = wahl("lg-form"), F = R.FORMEN[key];
  const h = reglerZahl("lg-h");
  const t = reglerZahl("lg-t") / 100;
  setzeText("lg-h-anzeige", cm(h));
  setzeText("lg-t-anzeige", prozent(t));
  // Bühne über den ganzen Kippweg beim größten h.
  const spur = [];
  for (let k = 0; k <= 20; k++) R.prismaFlaechen(F.grund, LG_HMAX).forEach((f) => spur.push(...lgDrehung(f.pts, k / 20)));
  const b = R.buehne(KAV, spur, { breite: W, maxHoehe: 400, s0: 26, extra: { rechts: 90, unten: 10 } });
  const svg = flaeche(W, b.hoehe, `${F.koerper} wird gekippt`);
  const fl = R.prismaFlaechen(F.grund, h).map((f) => ({ ...f, pts: lgDrehung(f.pts, t) }));
  R.zeichneKoerper(svg, b, mitKlassen(fl));
  // Die Höhe ist eine Seitenkante: die an Ecke 1 (vorn rechts), mit dem Prisma gedreht.
  const [P, Q] = lgDrehung([auf(F.grund[1], 0), auf(F.grund[1], h)], t);
  R.strecke(svg, b, P, Q, "kp-hoehe", { "data-rolle": "hoehe" });
  R.text(svg, b, R.mitte([P, Q]), `h = ${cm(h)}`, "kp-t-h", 12, 4, "start", { "data-rolle": "h-text" });
  zeige("lg-mount", svg);

  const unten = fl.find((f) => f.pts.every((p) => Math.abs(p[1]) < 1e-9));
  const L0 = R.seitenlaengen(F.grund)[0];
  setzeHtml("lg-bilanz",
    `Grundfläche: <span class="wc">${F.name}</span> — ${t === 0 ? "liegt unten" : t === 1 ? "steht jetzt hinten, die Deckfläche vorn" : "kippt mit"}<br>` +
    `Höhe: <span class="wr">h = ${cm(h)}</span> — der Abstand der beiden blauen Flächen, so lang wie jede Seitenkante<br>` +
    `Standfläche: <strong data-rolle="standflaeche">${unten ? (unten.rolle === "grund" ? `die Grundfläche (${F.name})` : `eine Seitenfläche (Rechteck ${num(L0)} cm × ${num(h)} cm)`) : "keine — das Prisma kippt gerade über die Kante"}</strong>`);
  setzeText("lg-text", t === 0
    ? `Das ${F.koerper} steht auf seiner Grundfläche. Die Höhe h zeigt nach oben.`
    : t < 1
      ? "Das Prisma kippt um seine vordere untere Kante. Es bleibt dabei, wie es ist — nur seine Lage ändert sich."
      : `Jetzt liegt das Prisma auf einer Seitenfläche. Die Grundflächen stehen vorn und hinten, und die Höhe h = ${cm(h)} zeigt im Schrägbild nach vorn — sie ist die Länge des liegenden Prismas.`);
}

// ================= Kontrollfragen =================

mountQuizze({
  "quiz-prisma": {
    q: "Ein Prisma hat 15 Kanten. Was für ein Vieleck ist seine Grundfläche?",
    options: ["ein Fünfzehneck", "ein Siebeneck", "ein Fünfeck", "ein Dreieck"],
    correct: 2,
    explain: "Ein Prisma mit n-eckiger Grundfläche hat 3 · n Kanten: n unten, n oben und n Seitenkanten. Aus 3 · n = 15 folgt n = 5. Es hat dann 10 Ecken und 7 Flächen.",
  },
  "quiz-netz": {
    q: "Welche Flächen hat ein Netz eines Prismas mit sechseckiger Grundfläche?",
    options: ["2 Sechsecke und 6 Rechtecke", "1 Sechseck und 6 Rechtecke", "2 Sechsecke und 4 Rechtecke", "6 Sechsecke und 2 Rechtecke"],
    correct: 0,
    explain: "Jede Fläche des Prismas kommt im Netz genau einmal vor: Grund- und Deckfläche (zwei Sechsecke) und für jede der 6 Seiten ein Rechteck. Zusammen 8 Flächen — so viele, wie das Prisma hat.",
  },
  "quiz-schraegbild": {
    q: "Ein Quader ist 6 cm tief. Wie zeichnest du die nach hinten laufenden Kanten im Schrägbild?",
    options: ["6 cm lang, senkrecht nach oben", "3 cm lang, unter 45° nach rechts oben", "12 cm lang, unter 45° nach rechts oben", "3 cm lang, waagerecht nach rechts"],
    correct: 1,
    explain: "Kanten, die nach hinten laufen, werden unter 45° und auf die Hälfte verkürzt gezeichnet: 6 cm : 2 = 3 cm. Nur so entsteht der räumliche Eindruck — Breite und Höhe bleiben dagegen in wahrer Größe.",
  },
  "quiz-lage": {
    q: "Ein Prisma liegt auf einer rechteckigen Fläche; vorn und hinten sind Dreiecke. Welche Flächen sind seine Grundflächen?",
    options: ["das Rechteck, auf dem es liegt, und das Rechteck gegenüber", "die beiden größten Flächen", "die Rechtecke links und rechts", "die Dreiecke vorn und hinten"],
    correct: 3,
    explain: "Grundflächen sind die zwei deckungsgleichen, parallelen Flächen — hier die Dreiecke. Die Rechtecke sind Seitenflächen, auch das, auf dem das Prisma liegt. Die Höhe h ist deshalb der Abstand von vorn nach hinten.",
  },
});

// ================= Verdrahten =================

["pr-n", "pr-h", "pr-t"].forEach((id) => document.getElementById(id).addEventListener("input", renderPrisma));
["nz-form", "nz-h", "nz-t"].forEach((id) => document.getElementById(id).addEventListener("input", renderNetz));
["sb-form", "sb-h", "sb-schritt"].forEach((id) => document.getElementById(id).addEventListener("input", renderSchraegbild));
["lg-form", "lg-h", "lg-t"].forEach((id) => document.getElementById(id).addEventListener("input", renderLage));
renderPrisma();
renderNetz();
renderSchraegbild();
renderLage();

mountUebungsaufgaben(document.getElementById("exercises-mount"), AUFGABEN);
