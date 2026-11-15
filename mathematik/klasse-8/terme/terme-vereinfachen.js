// Selbstlernpfad „Terme vereinfachen“ (Klasse 8, Terme, Thema 2).
//
// Reihenfolge — jeder Abschnitt benutzt nur, was vorher da war:
//   1. Gleichartige Glieder: Kacheln sortieren. Jede Kachel wandert starr an ihren Platz, keine kommt
//      dazu, keine fällt weg; eine Minus-Kachel neben einer Plus-Kachel derselben Sorte ist ein
//      Nullpaar. Begründung: Kommutativgesetz der Addition.
//   2. Produkte: 3x · 4y als Rechteck aus 12 Kacheln xy, die in Reihen gelegt werden. Begründung:
//      Kommutativ- und Assoziativgesetz der Multiplikation.
//   3. Plus- und Minusklammern: Die Kacheln einer Minusklammer werden umgedreht (Vorderseite plus,
//      Rückseite minus). Vor einer Klammer steht hier nur ein Vorzeichen — eine Zahl davor ist das
//      Distributivgesetz und kommt erst in Thema 3.
//   4. Der Rechenweg: Produkte, Klammern, Ordnen, Zusammenfassen — jeder Schritt mit seinem Gesetz.
//
// Farben: x² blau, x violett, y orange, Einer grün, Minus rot; Hilfslinien grau.
// Die Übungsaufgaben stehen in terme-vereinfachen-aufgaben.js.

import { svgEl, svgText, el, flaeche, zeige, num, reglerZahl, begrenzt, setzeText, setzeHtml, wahl, mountQuizze, mountUebungsaufgaben } from "./seite.js?v=1";
import * as T from "./termwerk.js?v=1";
import { AUFGABEN } from "./terme-vereinfachen-aufgaben.js?v=1";

// ================= Kacheln =================
//
// Maße in Bildpunkten: Die Einerkachel ist ein kleines Quadrat, der x-Streifen ist eine Einheit breit
// und x lang, das x²-Quadrat hat die Seite x. Der y-Streifen ist absichtlich kürzer als der x-Streifen
// — x und y sind verschiedene Zahlen, ihre Kacheln dürfen nicht gleich aussehen.
const U = 14;
const LX = 52;
const LY = 34;
const MASS = { x2: [LX, LX], x: [U, LX], y: [U, LY], 1: [U, U] };   // [Breite, Höhe]
const SORTEN = ["x2", "x", "y", "1"];                                 // Reihenfolge beim Sortieren
const VAR = { x2: "x²", x: "x", y: "y", 1: "" };
const SORTE_NAME = { x2: "x²-Quadrate", x: "x-Streifen", y: "y-Streifen", 1: "Einerkacheln" };
const SORTE_FARBE = { x2: "wc", x: "wr", y: "wb", 1: "wa" };
const GLIED = (sorte, k) => ({ sorte, k });

// Ein Glied als Text: 3x, −x, 5, x². Mit `vorne` ohne Rechenzeichen davor, sonst „ + 3x“ / „ − x“.
function gliedText(sorte, k, vorne) {
  const b = Math.abs(k);
  const kern = sorte === "1" ? num(b) : (b === 1 ? "" : num(b)) + VAR[sorte];
  if (vorne) return (k < 0 ? "−" : "") + kern;
  return (k < 0 ? " − " : " + ") + kern;
}
const termText = (glieder) => glieder.length ? glieder.map((g, i) => gliedText(g.sorte, g.k, i === 0)).join("") : "0";

// Eine Kachel; (x, y) ist die linke obere Ecke der ungedrehten Kachel. `hoehe` < 1 staucht sie um ihre
// waagerechte Mittellinie — so sieht eine Kachel aus, die gerade umgedreht wird.
function kachel(sorte, vz, x, y, hoehe = 1, daten = {}) {
  const [b, h] = MASS[sorte];
  const hh = h * hoehe;
  const g = svgEl("g", { "data-rolle": "kachel", "data-art": sorte, "data-vz": String(vz), ...daten });
  g.appendChild(svgEl("rect", {
    x: x.toFixed(2), y: (y + (h - hh) / 2).toFixed(2), width: b, height: hh.toFixed(2), rx: 2,
    class: `tm-kachel tm-kachel-${sorte}${vz < 0 ? " tm-negativ" : ""}`,
  }));
  // Das Minuszeichen auf der Rückseite: ein kurzer waagerechter Strich in der Mitte.
  if (vz < 0 && hoehe > 0.6) {
    const m = Math.min(4, b / 2 - 3);
    g.appendChild(svgEl("line", { x1: (x + b / 2 - m).toFixed(2), x2: (x + b / 2 + m).toFixed(2), y1: (y + h / 2).toFixed(2), y2: (y + h / 2).toFixed(2), class: "tm-minus" }));
  }
  return g;
}
const LUECKE = 4;     // zwischen zwei Kacheln eines Glieds
const ABSTAND = 26;   // zwischen zwei Gliedern — Platz für die Beschriftung darüber

// ================= 1. Gleichartige Glieder: Kacheln sortieren =================

const KA_TERME = [
  [GLIED("x", 2), GLIED("1", 3), GLIED("x", 1), GLIED("1", 1)],
  [GLIED("x2", 1), GLIED("x", 2), GLIED("x2", 2), GLIED("1", 3), GLIED("x", 1)],
  [GLIED("x", 3), GLIED("y", 2), GLIED("x", 1), GLIED("y", 1), GLIED("1", 2)],
  [GLIED("x", 4), GLIED("1", 5), GLIED("x", -1), GLIED("1", -2)],
  [GLIED("x2", 2), GLIED("x", -1), GLIED("x", 3), GLIED("x2", -1), GLIED("1", -1)],
];
const KA_W = 680;
const KA_ZEILE = 40 + LX;    // Unterkante der Zeile, in der der Term geschrieben steht
const KA_BAHN0 = KA_ZEILE + 26;   // Oberkante der ersten Sortenbahn
const KA_X0 = 150;           // linker Rand der Bahnen — links davon steht das Ergebnis je Sorte
const KA_BAHN_ABSTAND = 14;

// Wo jede Kachel zu Anfang (so, wie der Term geschrieben ist) und am Ende (sortiert) liegt.
//
// Sortiert wird in zwei Phasen, damit sich unterwegs nichts überdeckt: Erst fällt jede Kachel senkrecht
// in die Bahn ihrer Sorte (die Kacheln der Zeile liegen nebeneinander, also kreuzt sich dabei nichts),
// dann rutscht sie waagerecht an ihren Platz. In einer Bahn liegen nur Kacheln einer Sorte und
// behalten ihre Reihenfolge — auch dabei kreuzt sich nichts. Minus-Kacheln liegen in einer eigenen
// Unterbahn, die eines Nullpaars direkt unter ihrer Plus-Kachel.
function kaLagen(glieder) {
  const kacheln = [];
  glieder.forEach((g, i) => {
    for (let j = 0; j < Math.abs(g.k); j++) kacheln.push({ sorte: g.sorte, vz: Math.sign(g.k), glied: i });
  });
  // Anfang: Glied für Glied von links nach rechts, mittig.
  let x = 0;
  glieder.forEach((g, i) => {
    if (i > 0) x += ABSTAND;
    kacheln.filter((k) => k.glied === i).forEach((k, j) => {
      if (j > 0) x += LUECKE;
      k.anfang = { x, y: KA_ZEILE - MASS[k.sorte][1] };
      x += MASS[k.sorte][0];
    });
  });
  const da = (KA_W - x) / 2;
  kacheln.forEach((k) => { k.anfang.x += da; });
  // Ende: eine Bahn je Sorte, untereinander.
  let y = KA_BAHN0;
  const gruppen = [];
  for (const s of SORTEN) {
    const plus = kacheln.filter((k) => k.sorte === s && k.vz > 0);
    const minus = kacheln.filter((k) => k.sorte === s && k.vz < 0);
    if (!plus.length && !minus.length) continue;
    const [b, h] = MASS[s];
    const yPlus = y, yMinus = plus.length ? y + h + 6 : y;
    plus.forEach((k, j) => { k.ende = { x: KA_X0 + j * (b + LUECKE), y: yPlus }; });
    minus.forEach((k, j) => { k.ende = { x: KA_X0 + j * (b + LUECKE), y: yMinus }; });
    const paare = Math.min(plus.length, minus.length);
    const unten = minus.length && plus.length ? yMinus + h : yPlus + h;
    gruppen.push({ sorte: s, y0: y, y1: unten, k: plus.length - minus.length, paare: plus.slice(0, paare).map((p, j) => [p, minus[j]]) });
    y = unten + KA_BAHN_ABSTAND;
  }
  return { kacheln, gruppen, hoehe: y + 16 };
}
// Die Lage einer Kachel beim Reglerwert t: bis zur Hälfte senkrecht, danach waagerecht.
function kaLage(k, t) {
  const s = Math.min(1, t / 0.5), w = Math.max(0, (t - 0.5) / 0.5);
  return { x: k.anfang.x + (k.ende.x - k.anfang.x) * w, y: k.anfang.y + (k.ende.y - k.anfang.y) * s };
}

function renderKacheln() {
  const glieder = KA_TERME[Number(wahl("ka-term"))];
  const t = reglerZahl("ka-t") / 100;
  setzeText("ka-t-anzeige", Math.round(t * 100) + " %");
  const { kacheln, gruppen, hoehe } = kaLagen(glieder);
  const svg = flaeche(KA_W, hoehe, "Kacheln des Terms " + termText(glieder));
  kacheln.forEach((k, n) => {
    const p = kaLage(k, t);
    svg.appendChild(kachel(k.sorte, k.vz, p.x, p.y, 1, { "data-glied": String(k.glied), "data-nr": String(n) }));
  });
  // Die Glieder bleiben über der Zeile stehen, aus der ihre Kacheln kommen — dort kreuzt sie nichts.
  // Sobald die Kacheln in den Bahnen sind, steht links jeder Bahn das Ergebnis der Sorte.
  {
    glieder.forEach((g, i) => {
      const eigene = kacheln.filter((k) => k.glied === i);
      const links = eigene[0].anfang.x, rechts = eigene[eigene.length - 1].anfang.x + MASS[g.sorte][0];
      svg.appendChild(svgText((links + rechts) / 2, 28, gliedText(g.sorte, g.k, i === 0).trim(), { class: `tm-label tm-label-${g.sorte}`, "data-rolle": "glied" }));
    });
  }
  if (t >= 0.5) {
    for (const g of gruppen) {
      svg.appendChild(svgText(KA_X0 - 18, (g.y0 + g.y1) / 2 + 5, g.k === 0 ? "0" : gliedText(g.sorte, g.k, true), { class: `tm-label tm-label-${g.sorte}`, "data-rolle": "sorte", "data-art": g.sorte, "text-anchor": "end" }));
    }
  }
  // Erst am Ende: die Nullpaare markieren.
  if (t === 1) {
    for (const g of gruppen) {
      for (const [p, m] of g.paare) {
        const [b, h] = MASS[g.sorte];
        svg.appendChild(svgEl("rect", { x: (p.ende.x - 3).toFixed(2), y: (p.ende.y - 3).toFixed(2), width: b + 6, height: (m.ende.y + h - p.ende.y + 6).toFixed(2), rx: 4, class: "tm-nullpaar", "data-rolle": "nullpaar" }));
      }
    }
  }
  zeige("ka-mount", svg);

  // Bilanz: je Sorte die Zahlen der Glieder und ihre Summe.
  const zeilen = gruppen.map((g) => {
    const ks = glieder.filter((x) => x.sorte === g.sorte).map((x) => x.k);
    const summe = ks.map((k, i) => (i === 0 ? num(k) : (k < 0 ? " − " : " + ") + num(Math.abs(k)))).join("");
    const paar = g.paare.length === 1 ? " (ein Nullpaar)" : g.paare.length > 1 ? ` (${g.paare.length} Nullpaare)` : "";
    const name = `<span class="${SORTE_FARBE[g.sorte]}">${SORTE_NAME[g.sorte]}</span>`;
    if (ks.length === 1) return `${name}: nur ein Glied → ${gliedText(g.sorte, g.k, true)}`;
    return `${name}: ${summe} = ${num(g.k)}${paar} → ${g.k === 0 ? "0" : gliedText(g.sorte, g.k, true)}`;
  });
  const ergebnis = termText(gruppen.filter((g) => g.k !== 0).map((g) => GLIED(g.sorte, g.k)));
  setzeHtml("ka-bilanz", t === 1
    ? zeilen.join("<br>") + `<br>${termText(glieder)} = <strong data-rolle="ergebnis">${ergebnis}</strong>`
    : `${termText(glieder)} = … — schieb den Regler ganz nach rechts, dann wird gezählt.`);
  const nullpaare = gruppen.reduce((s, g) => s + g.paare.length, 0);
  setzeText("ka-text", t === 0
    ? `So steht der Term da: jedes Glied als eigene Gruppe von Kacheln, insgesamt ${kacheln.length} Kacheln.`
    : t <= 0.5
      ? "Jede Kachel fällt in die Bahn ihrer Sorte — Minus-Kacheln in die Bahn darunter. Keine kommt dazu, keine fällt weg."
      : t < 1
        ? "In jeder Bahn rutschen die Kacheln zusammen. Jede nimmt ihr Vorzeichen mit."
        : `Sortiert: Jede Sorte liegt in ihrer Bahn, immer noch ${kacheln.length} Kacheln.` +
          (nullpaare ? " Jedes Nullpaar aus Plus- und Minus-Kachel derselben Sorte ergibt 0." : "") +
          " Verschiedene Sorten bleiben getrennt — sie lassen sich nicht zusammenzählen.");
}

// ================= 2. Produkte: ein Rechteck aus Kacheln =================

const PR_W = 680;
const PR_H = 300;
const PR_MASS = { xy: [44, 30], xx: [44, 44], x1: [44, 18] };   // [Breite, Höhe] einer Kachel
const PR_ZEILE = { xy: "y", xx: "x", x1: "1" };                 // Variable an der Höhe
const PR_GY = 30;         // Oberkante des Rechtecks
const PR_SPALT = 16;      // Abstand zwischen zwei Kacheln, wenn ganz auseinandergezogen

// Das Rechteck zerfällt in seine Kacheln: Jede rückt um ihre Spalten- und Zeilennummer mal den Spalt
// nach rechts und unten. Benachbarte Kacheln entfernen sich also nur voneinander — keine überdeckt
// unterwegs eine andere, und jede behält ihre Größe.
function renderProdukte() {
  const art = wahl("pr-art");
  const a = reglerZahl("pr-a"), b = reglerZahl("pr-b");
  const t = reglerZahl("pr-t") / 100;
  setzeText("pr-a-anzeige", String(a));
  setzeText("pr-b-anzeige", String(b));
  setzeText("pr-t-anzeige", Math.round(t * 100) + " %");
  const [w, h] = PR_MASS[art];
  const v2 = PR_ZEILE[art];
  const f1 = (a === 1 ? "" : a) + "x";
  const f2 = art === "x1" ? String(b) : (b === 1 ? "" : b) + v2;
  const kv = { xy: "xy", xx: "x²", x1: "x" }[art];
  const klasse2 = v2 === "x" ? "x" : v2 === "y" ? "y" : "1";
  // Mittig nach der ganz auseinandergezogenen Breite — so bleibt die Lage beim Ziehen am Regler fest.
  const gx = Math.round((PR_W - (a * w + (a - 1) * PR_SPALT)) / 2) + 20;
  const spalt = PR_SPALT * t;
  const sx = (c) => gx + c * (w + spalt), sy = (r) => PR_GY + r * (h + spalt);
  const svg = flaeche(PR_W, PR_H, `Rechteck ${f1} mal ${f2}`);
  // Die Seiten: unter jeder Spalte ein x, neben jeder Zeile die zweite Länge — sie wandern mit.
  const unten = sy(b - 1) + h;
  for (let c = 0; c < a; c++) svg.appendChild(svgText(sx(c) + w / 2, unten + 15, "x", { class: "tm-mass tm-label-x", "data-rolle": "seite-unten" }));
  for (let r = 0; r < b; r++) svg.appendChild(svgText(gx - 10, sy(r) + h / 2 + 5, v2, { class: `tm-mass tm-label-${klasse2}`, "data-rolle": "seite-links", "text-anchor": "end" }));
  // Die ganze Seite nur, wenn sie aus mehreren Stücken besteht — sonst stünde zweimal dasselbe da.
  if (a > 1) svg.appendChild(svgText((gx + sx(a - 1) + w) / 2, unten + 36, f1, { class: "tm-label tm-label-x", "data-rolle": "faktor-1" }));
  if (b > 1) svg.appendChild(svgText(gx - 30, (PR_GY + unten) / 2 + 5, f2, { class: `tm-label tm-label-${klasse2}`, "data-rolle": "faktor-2", "text-anchor": "end" }));
  for (let r = 0; r < b; r++) {
    for (let c = 0; c < a; c++) {
      const g = svgEl("g", { "data-rolle": "kachel", "data-art": art, "data-zeile": String(r), "data-spalte": String(c) });
      g.appendChild(svgEl("rect", { x: sx(c).toFixed(2), y: sy(r).toFixed(2), width: w, height: h, class: `tm-kachel tm-kachel-${art === "xx" ? "x2" : art === "xy" ? "xy" : "x"}` }));
      svg.appendChild(g);
    }
  }
  if (t === 1) {
    svg.appendChild(svgText(PR_W - 24, PR_GY + 14, `${a} · ${b} = ${a * b} ${a * b === 1 ? "Kachel" : "Kacheln"} ${kv}`, { class: "tm-label", "data-rolle": "anzahl", "text-anchor": "end" }));
  }
  zeige("pr-mount", svg);

  const ergebnis = (a * b === 1 ? "" : num(a * b)) + kv;
  const zerlegt = art === "x1" ? `${a} · ${b} · x` : art === "xx" ? `${a} · ${b} · x · x` : `${a} · ${b} · x · y`;
  setzeHtml("pr-bilanz", t === 1
    ? `<span class="wc">${f1}</span> · <span class="wr">${f2}</span> = ${zerlegt} = ${num(a * b)} · ${kv} = <strong data-rolle="ergebnis">${ergebnis}</strong>`
    : `<span class="wc">${f1}</span> · <span class="wr">${f2}</span>: ein Rechteck aus ${a} · ${b} Kacheln — schieb den Regler ganz nach rechts, dann wird gezählt.`);
  const kachelWort = { xy: "x breit und y hoch", xx: "ein Quadrat mit der Seite x", x1: "x lang und 1 breit" }[art];
  setzeText("pr-text", t === 0
    ? `Das Rechteck ist ${f1} breit und ${f2} hoch. ${a * b === 1 ? `Es ist eine einzige Kachel, ${kachelWort}` : `Es besteht aus ${a} · ${b} = ${a * b} Kacheln, jede ${kachelWort}`} — mit dem Flächeninhalt ${kv}.`
    : t < 1
      ? "Das Rechteck zerfällt in seine Kacheln — keine kommt dazu, keine fällt weg."
      : `Auseinandergezogen: ${a} ${a === 1 ? "Spalte" : "Spalten"} zu je ${b} — ${a * b} ${a * b === 1 ? "Kachel" : "Kacheln"} mit dem Flächeninhalt ${kv}, zusammen ${ergebnis}. Erst die Zahlen malnehmen (${a} · ${b} = ${a * b}), dann die Variablen (${art === "x1" ? "x" : art === "xx" ? "x · x = x²" : "x · y = xy"}).`);
}

// ================= 3. Plus- und Minusklammern: Kacheln umdrehen =================

const KLAMMER = (vz, inhalt) => ({ vz, inhalt });
const KL_TERME = [
  [GLIED("x", 5), KLAMMER(1, [GLIED("x", 2), GLIED("1", -3)])],
  [GLIED("x", 5), KLAMMER(-1, [GLIED("x", 2), GLIED("1", -3)])],
  [GLIED("1", 8), KLAMMER(-1, [GLIED("x", 1), GLIED("1", 3)])],
  [GLIED("x", 4), KLAMMER(-1, [GLIED("x", -1), GLIED("1", 2)])],
  [GLIED("1", 6), GLIED("x", 2), KLAMMER(-1, [GLIED("x", 4), GLIED("1", -5)])],
];
const KL_W = 680;
const KL_H = 150;
const KL_BASIS = 44 + LX;
const istKlammer = (teil) => Array.isArray(teil.inhalt);
// Der Term, wie er dasteht, und ohne Klammern (Minusklammer: jedes Vorzeichen umgedreht).
function klText(teile) {
  return teile.map((teil, i) => {
    if (!istKlammer(teil)) return gliedText(teil.sorte, teil.k, i === 0);
    return (teil.vz < 0 ? " − (" : " + (") + termText(teil.inhalt) + ")";
  }).join("");
}
function klOhne(teile) {
  const flach = [];
  for (const teil of teile) {
    if (istKlammer(teil)) teil.inhalt.forEach((g) => flach.push(GLIED(g.sorte, g.k * teil.vz)));
    else flach.push(teil);
  }
  return flach;
}

function renderKlammern() {
  const teile = KL_TERME[Number(wahl("kl-term"))];
  const t = reglerZahl("kl-t") / 100;
  setzeText("kl-t-anzeige", Math.round(t * 100) + " %");
  const minus = teile.some((teil) => istKlammer(teil) && teil.vz < 0);
  // Anordnung: eine Reihe; die Klammer ist ein Rahmen um ihre Kacheln, das Vorzeichen steht davor.
  const PAD = 6, ZEICHEN = 22;
  const stuecke = [];
  let x = 0;
  teile.forEach((teil, i) => {
    if (i > 0) x += ABSTAND;
    if (!istKlammer(teil)) {
      const kacheln = [];
      for (let j = 0; j < Math.abs(teil.k); j++) {
        if (j > 0) x += LUECKE;
        kacheln.push({ sorte: teil.sorte, vz: Math.sign(teil.k), x });
        x += MASS[teil.sorte][0];
      }
      stuecke.push({ teil, i, kacheln });
    } else {
      const zeichenX = x;
      x += ZEICHEN + PAD;
      const kacheln = [];
      const x0 = x;
      teil.inhalt.forEach((g, gi) => {
        if (gi > 0) x += ABSTAND - 8;
        for (let j = 0; j < Math.abs(g.k); j++) {
          if (j > 0) x += LUECKE;
          kacheln.push({ sorte: g.sorte, vz: Math.sign(g.k), x, inGlied: gi });
          x += MASS[g.sorte][0];
        }
      });
      x += PAD;
      stuecke.push({ teil, i, kacheln, zeichenX, rahmen: [x0 - PAD, x] });
    }
  });
  const dx = (KL_W - x) / 2;
  const svg = flaeche(KL_W, KL_H, "Kacheln des Terms " + klText(teile));
  // Umdrehen: Die Kachel wird um ihre waagerechte Mittellinie geklappt. Bis zur Hälfte zeigt sie ihre
  // alte Seite, danach die andere — Breite und Lage bleiben, nur die sichtbare Höhe ändert sich.
  const klapp = Math.abs(Math.cos(Math.PI * t));
  for (const st of stuecke) {
    const dreht = istKlammer(st.teil) && st.teil.vz < 0;
    for (const k of st.kacheln) {
      const vz = dreht && t >= 0.5 ? -k.vz : k.vz;
      svg.appendChild(kachel(k.sorte, vz, k.x + dx, KL_BASIS - MASS[k.sorte][1], dreht ? klapp : 1, {
        "data-teil": String(st.i), "data-klammer": istKlammer(st.teil) ? String(st.teil.vz) : "0", "data-vz-anfang": String(k.vz),
      }));
    }
    if (istKlammer(st.teil)) {
      if (t < 1) {
        // Der Rahmen ist die Klammer: Er verblasst, während sie aufgelöst wird.
        const [r0, r1] = st.rahmen;
        svg.appendChild(svgEl("rect", { x: (r0 + dx).toFixed(2), y: KL_BASIS - LX - PAD, width: (r1 - r0).toFixed(2), height: LX + 2 * PAD, rx: 10, class: "tm-klammer", "data-rolle": "klammer", style: `opacity:${(1 - t).toFixed(2)}` }));
        svg.appendChild(svgText(st.zeichenX + dx + ZEICHEN / 2, KL_BASIS - LX / 2 + 7, st.teil.vz < 0 ? "−" : "+", { class: "tm-label tm-label-zeichen", "data-rolle": "zeichen" }));
      }
      const mitte = (st.rahmen[0] + st.rahmen[1]) / 2 + dx;
      const txt = t < 0.5
        ? (st.teil.vz < 0 ? "−(" : "+(") + termText(st.teil.inhalt) + ")"
        : st.teil.inhalt.map((g) => gliedText(g.sorte, g.k * st.teil.vz, false).trim()).join(" ");
      svg.appendChild(svgText(mitte, 26, txt, { class: "tm-label", "data-rolle": "glied" }));
    } else {
      const mitte = (st.kacheln[0].x + st.kacheln[st.kacheln.length - 1].x + MASS[st.teil.sorte][0]) / 2 + dx;
      svg.appendChild(svgText(mitte, 26, gliedText(st.teil.sorte, st.teil.k, st.i === 0).trim(), { class: `tm-label tm-label-${st.teil.sorte}`, "data-rolle": "glied" }));
    }
  }
  zeige("kl-mount", svg);

  const ohne = klOhne(teile);
  const summe = {};
  ohne.forEach((g) => { summe[g.sorte] = (summe[g.sorte] || 0) + g.k; });
  const ergebnis = termText(SORTEN.filter((s) => summe[s]).map((s) => GLIED(s, summe[s])));
  setzeHtml("kl-bilanz", t === 1
    ? `${klText(teile)} = <span data-rolle="ohne-klammer">${termText(ohne)}</span> = <strong data-rolle="ergebnis">${ergebnis}</strong>`
    : `${klText(teile)} — schieb den Regler ganz nach rechts, dann ist die Klammer aufgelöst.`);
  setzeText("kl-text", t === 0
    ? (minus ? "Vor der Klammer steht ein Minus: Alles, was in der Klammer steht, wird abgezogen." : "Vor der Klammer steht ein Plus: Die Kacheln darin bleiben, wie sie sind.")
    : t < 1
      ? (minus ? "Die Kacheln in der Minusklammer werden umgedreht — jede zeigt danach ihre andere Seite. Breiter oder schmaler wird keine." : "Die Klammer verschwindet; an den Kacheln ändert sich nichts.")
      : `Klammer aufgelöst: ${termText(ohne)}.` + (minus ? " Jedes Vorzeichen aus der Klammer hat sich umgedreht, nicht nur das erste." : " Die Vorzeichen sind geblieben.") + ` Zusammengefasst wie in Abschnitt 1: ${ergebnis}.`);
}

// ================= 4. Der Rechenweg in Schritten =================

const SW_TERME = [
  {
    start: "4x + 3y − (2x − y) + x · 3",
    schritte: [
      { art: "produkt", term: "4x + 3y − (2x − y) + 3x", regel: "Produkt vereinfachen: x · 3 = 3x (Kommutativgesetz der Multiplikation)." },
      { art: "klammer", term: "4x + 3y − 2x + y + 3x", regel: "Minusklammer auflösen: Jedes Vorzeichen in der Klammer dreht sich um." },
      { art: "ordnen", term: "4x − 2x + 3x + 3y + y", regel: "Ordnen: gleichartige Glieder nebeneinander, jedes mit seinem Vorzeichen (Kommutativgesetz der Addition)." },
      { art: "zusammenfassen", term: "5x + 4y", regel: "Zusammenfassen: 4x − 2x + 3x = 5x und 3y + y = 4y." },
    ],
  },
  {
    start: "2a · 3b + 5ab − (ab − 4) − 6",
    schritte: [
      { art: "produkt", term: "6ab + 5ab − (ab − 4) − 6", regel: "Produkt vereinfachen: 2a · 3b = 2 · 3 · a · b = 6ab." },
      { art: "klammer", term: "6ab + 5ab − ab + 4 − 6", regel: "Minusklammer auflösen: aus ab wird −ab, aus −4 wird +4." },
      { art: "zusammenfassen", term: "10ab − 2", regel: "Zusammenfassen: 6ab + 5ab − ab = 10ab und 4 − 6 = −2. Geordnet war schon." },
    ],
  },
  {
    start: "x · x + 3x − (x² − 2x) + (4 − x)",
    schritte: [
      { art: "produkt", term: "x² + 3x − (x² − 2x) + (4 − x)", regel: "Produkt vereinfachen: x · x = x²." },
      { art: "klammer", term: "x² + 3x − x² + 2x + 4 − x", regel: "Klammern auflösen: In der Minusklammer drehen sich die Vorzeichen um, die Plusklammer fällt einfach weg." },
      { art: "ordnen", term: "x² − x² + 3x + 2x − x + 4", regel: "Ordnen: x²-Glieder, x-Glieder, Zahlen." },
      { art: "zusammenfassen", term: "4x + 4", regel: "Zusammenfassen: x² − x² = 0 und 3x + 2x − x = 4x." },
    ],
  },
];
const SW_VARIABLEN = ["x", "y", "a", "b"];
const SW_PROBE = { x: 2, y: 3, a: 2, b: 3 };

function renderSchritte() {
  const s = SW_TERME[Number(wahl("sw-term"))];
  // Nicht jeder Term braucht vier Schritte — der Regler wird auf den letzten begrenzt und zeigt das an.
  const n = begrenzt("sw-schritt", reglerZahl("sw-schritt"), 0, s.schritte.length);
  setzeText("sw-schritt-anzeige", `${n} von ${s.schritte.length}`);
  const liste = el("ol", { class: "tm-schritte-liste" });
  liste.appendChild(el("li", { "data-rolle": "schritt", "data-art": "start", "data-term": s.start }, [el("span", { class: "tm-schritt-term" }, s.start), el("span", { class: "tm-regel" }, "Der Anfang")]));
  s.schritte.slice(0, n).forEach((sch, i) => {
    liste.appendChild(el("li", { "data-rolle": "schritt", "data-art": sch.art, "data-term": sch.term }, [
      el("span", { class: "tm-schritt-term" }, "= " + sch.term),
      el("span", { class: "tm-regel" }, `${i + 1}. ${sch.regel}`),
    ]));
  });
  const mount = document.getElementById("sw-mount");
  mount.innerHTML = "";
  mount.appendChild(liste);
  if (n < s.schritte.length) {
    setzeText("sw-text", n === 0 ? "Der Anfang. Geh mit dem Regler zum ersten Schritt." : `Schritt ${n} von ${s.schritte.length}. Der Term ist gleichwertig mit dem Anfang, aber noch nicht fertig.`);
  } else {
    // Die Probe rechnet mit dem Termwerk der Seite — der Anfang wird dafür neu gelesen, nicht abgeschrieben.
    const vars = SW_VARIABLEN.filter((v) => new RegExp(v).test(s.start));
    const bel = Object.fromEntries(vars.map((v) => [v, SW_PROBE[v]]));
    const wa = T.wert(T.P(s.start, SW_VARIABLEN), bel);
    const we = T.wert(T.P(s.schritte[s.schritte.length - 1].term, SW_VARIABLEN), bel);
    const belText = vars.map((v) => `${v} = ${num(bel[v])}`).join(", ");
    setzeHtml("sw-text", `Fertig: Keine zwei Glieder sind mehr gleichartig. <span data-rolle="probe">Probe mit ${belText}: Der Anfang ergibt ${num(wa)}, das Ergebnis ${num(we)}${wa === we ? " ✓" : " ✗"}</span>`);
  }
}

// ================= Kontrollfragen =================

const QUIZZE = {
  "quiz-gleichartig": {
    q: "Welche beiden Glieder sind gleichartig?",
    options: ["3x und 3x²", "2xy und 5yx", "4x und 4y", "x² und 2x"],
    correct: 1,
    explain: "Gleichartig heißt: dieselben Variablen mit denselben Hochzahlen. 2xy und 5yx haben beide x und y je einmal — die Reihenfolge der Faktoren spielt keine Rolle (yx = xy), zusammen 7xy. x und x² sind verschiedene Sorten (Streifen und Quadrat), ebenso x und y; dass die Zahlen davor gleich sind, ändert daran nichts.",
  },
  "quiz-produkte": {
    q: "Was ergibt 2x · 3x?",
    options: ["5x", "6x", "5x²", "6x²"],
    correct: 3,
    explain: "Zahlen mal Zahlen, Variablen mal Variablen: 2 · 3 = 6 und x · x = x², also 6x². Als Rechteck: 2 x-Längen breit, 3 x-Längen hoch — 6 Quadrate mit der Seite x. 5x und 5x² addieren die Zahlen, 6x vergisst, dass x · x ein Quadrat ist.",
  },
  "quiz-klammern": {
    q: "Was ergibt 7a − (2a − 4)?",
    options: ["5a + 4", "5a − 4", "9a − 4", "5a + 8"],
    correct: 0,
    explain: "Die Minusklammer dreht jedes Vorzeichen um: 7a − 2a + 4 = 5a + 4. Bei 5a − 4 wurde nur das erste Vorzeichen umgedreht, bei 9a − 4 die Klammer einfach weggelassen. 5a + 8 verdoppelt die 4 — dafür gibt es keinen Grund.",
  },
  "quiz-schritte": {
    q: "Lena rechnet: 3x + 2 · x = 5x · x = 5x². Was hat sie falsch gemacht?",
    options: [
      "Nichts — das Ergebnis stimmt.",
      "Sie hätte x · x = 2x rechnen müssen, also 10x.",
      "Punkt vor Strich: Erst 2 · x = 2x, dann 3x + 2x = 5x.",
      "Sie hätte zuerst die Zahlen addieren müssen: 3 + 2 = 5, also 5x.",
    ],
    correct: 2,
    explain: "Lena hat zuerst 3x + 2 gerechnet — das ist Strich vor Punkt, und dabei fasst sie den x-Streifen mit einer Zahl zusammen, die gar nicht gleichartig ist. Richtig: 2 · x = 2x, dann 3x + 2x = 5x. Probe mit x = 2: 3 · 2 + 2 · 2 = 10, aber 5 · 2² = 20. Die letzte Antwort kommt zufällig auf 5x, aber mit einer falschen Begründung.",
  },
};

// ================= Start =================

["ka-term", "ka-t"].forEach((id) => document.getElementById(id).addEventListener("input", renderKacheln));
["pr-art", "pr-a", "pr-b", "pr-t"].forEach((id) => document.getElementById(id).addEventListener("input", renderProdukte));
["kl-term", "kl-t"].forEach((id) => document.getElementById(id).addEventListener("input", renderKlammern));
["sw-term", "sw-schritt"].forEach((id) => document.getElementById(id).addEventListener("input", renderSchritte));

renderKacheln();
renderProdukte();
renderKlammern();
renderSchritte();
mountQuizze(QUIZZE);
mountUebungsaufgaben(document.getElementById("exercises-mount"), AUFGABEN);
