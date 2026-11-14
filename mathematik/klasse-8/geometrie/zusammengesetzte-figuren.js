// Selbstlernpfad „Zusammengesetzte Figuren: Flächeninhalt und Umfang“ (Klasse 8, Geometrie, Thema 6).
//
// Aufbau wie beim Kreis: Abschnitt, bewegliche Zeichnung, Rechnung, Kontrollfrage. Die
// Übungsaufgaben stehen in zusammengesetzte-figuren-aufgaben.js.
//
// Reihenfolge — jeder Abschnitt benutzt nur, was vorher da war:
//   1. Flächeninhalt: zerlegen und addieren (Rechteck mit zwei Viertelkreisen).
//   2. Umfang derselben Figur: Der Rand wird abgeschritten, die Schnittkanten zählen nicht.
//   3. Beides an einer Figur aus Rechteck, Dreieck (Thema 4) und Kreisausschnitt (Thema 5).
//   4. Ergänzen und abziehen: Rechteck plus Halbkreis minus Halbkreis — der Flächeninhalt wird
//      kleiner, der Umfang größer.
//
// Die drei Beispiele sind AUFGABEN, keine Vorführungen: Die Teilflächen werden nacheinander
// eingetragen und geprüft, danach die Summe (im dritten Beispiel mit einem Minus). Deshalb steht
// unter der Zeichnung keine fertige Bilanz, sondern eine Rechnung in Schritten; jede Zeile erscheint
// erst, wenn ihr Schritt gelöst oder aufgedeckt ist.
//
// Jede Bewegung ist eine VERSCHIEBUNG und damit starr: Ein Teil behält in jeder Lage Form und
// Flächeninhalt. Verschoben wird mit dem Regler „Auseinanderziehen“ (alle Teile zugleich, jedes in
// seine Richtung) oder einzeln — mit Maus, Finger oder Pfeiltasten. Die Prüfung misst die Teile in
// mehreren Lagen mit der Gaußschen Trapezformel nach.
//
// Was bewusst NICHT vorkommt: der Satz des Pythagoras (Klasse 9). Die schräge Seite im zweiten
// Beispiel trägt „gemessen“. Damit die Zeichnung trotzdem genau zeigt, was die Rechnung benutzt,
// hat das Dreieck immer das Seitenverhältnis 3 : 4 : 5 — die schräge Seite ist dann wirklich
// 1,25-mal so lang wie die Höhe und muss nicht gerundet werden.
//
// Gerechnet wird mit den Reglerwerten in Zentimetern, nie mit Bildschirmkoordinaten.
//
// Farben wie auf den anderen Geometrieseiten: Flächen grün, das herausgenommene Stück orange,
// Längen blau, Höhe und Winkel violett, der abgeschrittene Rand orange (wie Umfang und Bogen beim
// Kreis), Schnittkanten rot gestrichelt (Warnung: zählt nicht). Die Farben stehen als Klassen in
// lernpfad.css, damit der Dunkelmodus sie aufhellen kann.

import { mountUebungsaufgaben as mountUebungsaufgabenBasis } from "../../aufgaben.js?v=2";
import { AUFGABEN } from "./zusammengesetzte-figuren-aufgaben.js?v=1";

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
const ZAHLFORMATE = new Map();
function zahlformat(stellen) {
  let f = ZAHLFORMATE.get(stellen);
  if (!f) ZAHLFORMATE.set(stellen, (f = new Intl.NumberFormat("de-DE", { maximumFractionDigits: stellen })));
  return f;
}
// Deutsche Schreibweise. Gerundet wird VOR der Ausgabe, damit −0,0001 nicht als „−0“ erscheint.
function num(x, digits = 4) {
  const f = Math.pow(10, digits);
  const gerundet = Math.round(x * f) / f;
  return zahlformat(digits).format(gerundet === 0 ? 0 : gerundet);
}
// Gerundete Kreisgrößen immer mit zwei Stellen: „12,50“ sieht nach Rundung aus, „12,5“ nach einem
// genauen Wert.
const ZWEI = new Intl.NumberFormat("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
function zwei(x) {
  const g = Math.round(x * 100) / 100;
  return ZWEI.format(g === 0 ? 0 : g);
}
const rund2 = (x) => Math.round(x * 100) / 100;
function bruch(zaehler, nenner) {
  return `<span class="bruch"><span class="z">${zaehler}</span><span class="n">${nenner}</span></span>`;
}
function parseFlexibleNumber(raw) {
  if (raw == null) return NaN;
  const s = String(raw).trim().replace(/\s/g, "").replace(/−/g, "-").replace(/\./g, "").replace(",", ".");
  // Eine vollständige Zahl, höchstens mit einer Einheit dahinter. parseFloat allein läse aus „1/2“
  // die 1 und aus „3 · 4“ die 3 — und erkennte damit eine halbe Rechnung als Ergebnis an.
  const m = s.match(/^(-?\d+(?:\.\d+)?)(?:cm²|cm2|cm|mm|m²|m2|m|kg|g|€|°)?$/i);
  return m ? parseFloat(m[1]) : NaN;
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
function setzeText(id, text) {
  document.getElementById(id).textContent = text;
}
// Alle Werte, die ein Regler annehmen kann — aus seinen Attributen, damit Rahmen und Regler nicht
// auseinanderlaufen, wenn jemand die Grenzen im HTML ändert.
function reglerWerte(id) {
  const e = document.getElementById(id);
  const min = Number(e.min), max = Number(e.max), step = Number(e.step);
  const out = [];
  for (let i = 0; min + i * step <= max + 1e-9; i++) out.push(Math.round((min + i * step) * 1e6) / 1e6);
  return out;
}

// ---------- Zeichenbausteine ----------

// Eine Bühne rechnet Zentimeter in Bildpunkte um. Der Nullpunkt liegt unten links, y zeigt nach
// oben — wie im Heft und anders als in SVG.
function buehne(breite, hoehe, ox, oy, skala) {
  const svg = svgEl("svg", {
    viewBox: `0 0 ${breite} ${hoehe}`, width: breite, height: hoehe,
    class: "th-flaeche", preserveAspectRatio: "xMidYMid meet",
  });
  const g = svgEl("g");
  svg.appendChild(g);
  return { svg, g, skala, P: (x, y) => ({ x: ox + x * skala, y: oy - y * skala }) };
}
// Breite fest, Höhe aus dem Inhalt. Die Punkte sind der RAHMEN über alle Reglerstellungen und alle
// Lagen beim Auseinanderziehen (siehe rahmenVon): So bleibt der Maßstab fest, nichts springt, und
// eine größere Figur ist im Bild auch größer.
function buehneAuto(breite, maxHoehe, kasten, { rand = 30, maxSkala = 58 } = {}) {
  const spanX = Math.max(0.5, kasten.maxX - kasten.minX), spanY = Math.max(0.5, kasten.maxY - kasten.minY);
  const skala = Math.min(maxSkala, (breite - 2 * rand) / spanX, (maxHoehe - 2 * rand) / spanY);
  const hoehe = Math.round(spanY * skala + 2 * rand);
  const ox = rand + (breite - 2 * rand - spanX * skala) / 2 - kasten.minX * skala;
  const oy = hoehe - rand + kasten.minY * skala;
  return buehne(breite, hoehe, ox, oy, skala);
}
function punkteText(b, punkte, dx = 0, dy = 0) {
  return punkte.map((p) => { const q = b.P(p.x + dx, p.y + dy); return `${q.x.toFixed(2)},${q.y.toFixed(2)}`; }).join(" ");
}
function linie(b, p, q, klasse, extra = {}) {
  const a = b.P(p.x, p.y), c = b.P(q.x, q.y);
  const e = svgEl("line", Object.assign({
    x1: a.x.toFixed(2), y1: a.y.toFixed(2), x2: c.x.toFixed(2), y2: c.y.toFixed(2), class: klasse,
  }, extra));
  b.g.appendChild(e);
  return e;
}
function zeige(mountId, b) {
  const mount = document.getElementById(mountId);
  mount.innerHTML = "";
  mount.appendChild(b.svg);
}

// Punkte eines Kreisbogens um M vom Winkel a0 bis a1 (Bogenmaß). Die Sehnen überspannen höchstens
// 2°: Dann fehlt dem gezeichneten Vieleck weniger als ein Zehntausendstel der Fläche, und die
// Prüfung kann sie mit der Gaußschen Trapezformel nachmessen.
const FEIN = Math.PI / 90;
function bogenPunkte(M, r, a0, a1) {
  const n = Math.max(2, Math.ceil(Math.abs(a1 - a0) / FEIN));
  const out = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    out.push({ x: M.x + r * Math.cos(a), y: M.y + r * Math.sin(a) });
  }
  return out;
}
const weglaenge = (punkte) => punkte.reduce((s, p, i) => (i ? s + Math.hypot(p.x - punkte[i - 1].x, p.y - punkte[i - 1].y) : 0), 0);

// Eine Maßlinie neben der Strecke von p nach q, um `versatz` Zentimeter nach links (in Laufrichtung
// gesehen; negativ: nach rechts) herausgerückt, mit Endstrichen und der Beschriftung außen daneben.
// `bei` ist die Stelle der Beschriftung auf der Linie (0 = Anfang, 1 = Ende).
function massLinie(b, p, q, text, versatz, art, bei = 0.5) {
  const len = Math.hypot(q.x - p.x, q.y - p.y);
  const nx = -(q.y - p.y) / len, ny = (q.x - p.x) / len;
  const a = { x: p.x + nx * versatz, y: p.y + ny * versatz }, c = { x: q.x + nx * versatz, y: q.y + ny * versatz };
  linie(b, a, c, `zf-mass-linie zf-${art}`, { "data-rolle": "mass" });
  const k = 0.11;
  for (const e of [a, c]) linie(b, { x: e.x - nx * k, y: e.y - ny * k }, { x: e.x + nx * k, y: e.y + ny * k }, `zf-mass-linie zf-${art}`);
  // Die Beschriftung sitzt auf der Seite, auf die der Versatz zeigt. In Bildpunkten zeigt y nach
  // unten, deshalb das Minus vor ny.
  const s = versatz < 0 ? -1 : 1;
  const px = nx * s, py = -ny * s;
  const m = b.P(a.x + (c.x - a.x) * bei, a.y + (c.y - a.y) * bei);
  const anker = Math.abs(px) > 0.4 ? (px > 0 ? "start" : "end") : "middle";
  // Eine mittig gesetzte Beschriftung über einer leicht geneigten Linie: Ihre Enden lägen auf der
  // Linie, und die strichte den Text durch. Sie rückt deshalb um so viel weiter hinaus, wie die
  // Linie über die halbe Textbreite steigt (geschätzt mit 6,6 Bildpunkten je Zeichen).
  const steigung = Math.abs(q.y - p.y) / Math.max(1e-9, Math.abs(q.x - p.x));
  const hinaus = 11 + (anker === "middle" ? Math.min(34, (steigung * text.length * 6.6) / 2) : 0);
  b.g.appendChild(svgText(m.x + px * 7, m.y + py * hinaus + 4.5, text, { class: `zf-mass-text zf-${art}-text`, "text-anchor": anker }));
}

// ================= Die Zerlegefigur =================
//
// Ein Beispiel beschreibt seine Figur in Zentimetern:
//   teile     [{ name, klasse, punkte, weg, marke }]   Vielecke an ihrem Platz; `weg` ist die
//             Verschiebung beim Auseinanderziehen (bei 100 %), `marke` der Platz der Nummer
//   rand      [{ teil, stueck, punkte }]               der Rand der Figur, einmal herum; jedes Stück
//             gehört zu einem Teil und wandert mit ihm; `stueck` ist seine Nummer in der Rechnung
//   schnitte  [{ teile: [i, j], punkte }]              Kanten, an denen zwei Teile aneinanderliegen
//   masse     [{ teil, von, bis, versatz, text, art, bei }] Maßlinien; art: "laenge" (blau), "hoehe" (violett)
//   texte     [{ teil, p, text, klasse, dx, dy }]      freie Beschriftungen
//   winkel    [{ teil, M, r, w0, w1 }]                 Winkelbögen
//
// und seine Rechnung als Liste von Schritten (siehe baueRechnung).

const TOL = 0.015;        // ein Teilergebnis, auf zwei Nachkommastellen gerundet
const TOL_SUMME = 0.035;  // eine Summe — auch aus gerundeten Teilergebnissen gebildet
const EINRASTEN = 0.3;    // näher als das am Platz (in cm): Das Teil schnappt zurück

const ZUSTAND = new Map();   // Kürzel → { zug: [{x, y}], stand: Map(Schritt → "richtig" | "gezeigt"), kasten, skala }
const RAHMEN = new Map();

// Der Rahmen eines Beispiels: alle Teile an ihrem Platz und ganz auseinandergezogen, samt Maßlinien —
// über ALLE Reglerstellungen. Gerechnet wird er einmal; er hängt nur von den Grenzen der Regler ab.
function rahmenVon(bsp) {
  if (!RAHMEN.has(bsp.id)) {
    const k = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
    const nimm = (x, y) => {
      if (x < k.minX) k.minX = x;
      if (x > k.maxX) k.maxX = x;
      if (y < k.minY) k.minY = y;
      if (y > k.maxY) k.maxY = y;
    };
    for (const m of bsp.alleMasse()) {
      const fig = bsp.figur(m);
      fig.teile.forEach((t) => {
        for (const p of t.punkte) { nimm(p.x, p.y); nimm(p.x + t.weg.x, p.y + t.weg.y); }
      });
      for (const ms of fig.masse) {
        const w = fig.teile[ms.teil].weg;
        const len = Math.hypot(ms.bis.x - ms.von.x, ms.bis.y - ms.von.y);
        const nx = (-(ms.bis.y - ms.von.y) / len) * ms.versatz * 1.9, ny = ((ms.bis.x - ms.von.x) / len) * ms.versatz * 1.9;
        for (const p of [ms.von, ms.bis]) { nimm(p.x + nx, p.y + ny); nimm(p.x + nx + w.x, p.y + ny + w.y); }
      }
      for (const p of fig.platz || []) nimm(p.x, p.y);
    }
    RAHMEN.set(bsp.id, k);
  }
  return RAHMEN.get(bsp.id);
}

function zustand(bsp) {
  if (!ZUSTAND.has(bsp.id)) ZUSTAND.set(bsp.id, { zug: [], stand: new Map() });
  return ZUSTAND.get(bsp.id);
}
// Der Schritt, der gerade dran ist — oder null, wenn alle erledigt sind.
function aktiverSchritt(bsp, schritte) {
  const st = zustand(bsp);
  return schritte.find((s) => !st.stand.has(s.id)) || null;
}
// Die Verschiebung jedes Teils: Anteil des Reglers plus das, was von Hand dazugezogen wurde.
function lagen(bsp, fig) {
  const st = zustand(bsp);
  const t = reglerZahl(bsp.id + "-t") / 100;
  while (st.zug.length < fig.teile.length) st.zug.push({ x: 0, y: 0 });
  return fig.teile.map((teil, i) => ({ x: t * teil.weg.x + st.zug[i].x, y: t * teil.weg.y + st.zug[i].y }));
}
const amPlatz = (l) => Math.hypot(l.x, l.y) < 1e-9;

function zeichne(bsp) {
  const st = zustand(bsp);
  const m = bsp.lies();
  const fig = bsp.figur(m);
  const schritte = bsp.schritte(m);
  const aktiv = aktiverSchritt(bsp, schritte);
  const t = reglerZahl(bsp.id + "-t") / 100;
  setzeText(bsp.id + "-t-anzeige", Math.round(t * 100) + " %");
  const lage = lagen(bsp, fig);
  const zusammen = lage.every(amPlatz);

  const kasten = rahmenVon(bsp);
  const b = buehneAuto(bsp.breite, bsp.hoehe, kasten);
  st.kasten = kasten;
  st.skala = b.skala;

  // Die Teile. Das Teil des laufenden Schritts ist kräftiger gefärbt.
  const aktiveTeile = aktiv && aktiv.teil != null ? [].concat(aktiv.teil) : [];
  fig.teile.forEach((teil, i) => {
    const e = svgEl("polygon", {
      points: punkteText(b, teil.punkte, lage[i].x, lage[i].y),
      class: `zf-teil ${teil.klasse}${aktiveTeile.includes(i) ? " zf-aktiv" : ""}${st.zieht === i ? " zf-zieht" : ""}`,
      "data-rolle": "teil", "data-teil": String(i + 1), "data-index": String(i),
      tabindex: "0", role: "img",
      "aria-label": `Teil ${i + 1}: ${teil.name}. Mit Maus, Finger oder Pfeiltasten verschieben.`,
    });
    b.g.appendChild(e);
  });

  // Schnittkanten: an jedem der beiden Teile, die sie trennen. Liegen beide am Platz, fallen die
  // zwei Linien aufeinander. Wo der Umfang das Thema ist, sind sie rot — sie zählen nicht.
  for (const s of fig.schnitte) {
    for (const i of s.teile) {
      b.g.appendChild(svgEl("polyline", {
        points: punkteText(b, s.punkte, lage[i].x, lage[i].y),
        class: "zf-schnitt" + (bsp.schnitteRot ? " zf-schnitt-rot" : ""),
        "data-rolle": "schnitt", "data-teil": String(i + 1),
      }));
    }
  }

  // Der Rand der Figur. Die Stücke des laufenden Schritts sind orange hervorgehoben.
  const aktiveStuecke = aktiv && aktiv.rand ? aktiv.rand : [];
  fig.rand.forEach((r, nr) => {
    b.g.appendChild(svgEl("polyline", {
      points: punkteText(b, r.punkte, lage[r.teil].x, lage[r.teil].y),
      class: "zf-rand" + (aktiveStuecke.includes(r.stueck) ? " zf-rand-aktiv" : ""),
      "data-rolle": "rand", "data-nr": String(nr), "data-stueck": String(r.stueck),
    }));
  });

  // Rand abschreiten: Der orange Weg läuft die Randstücke der Reihe nach ab, bis zum Anteil s.
  let laeufer = null;
  if (bsp.spur) {
    const s = reglerZahl(bsp.id + "-s") / 100;
    setzeText(bsp.id + "-s-anzeige", Math.round(s * 100) + " %");
    const gesamt = fig.rand.reduce((a, r) => a + weglaenge(r.punkte), 0);
    let rest = s * gesamt;
    const start = fig.rand[0];
    laeufer = { p: { x: start.punkte[0].x + lage[start.teil].x, y: start.punkte[0].y + lage[start.teil].y }, stueck: start.stueck };
    for (const r of fig.rand) {
      if (rest <= 1e-9) break;
      const weg = [r.punkte[0]];
      for (let i = 1; i < r.punkte.length && rest > 1e-9; i++) {
        const a = r.punkte[i - 1], c = r.punkte[i];
        const d = Math.hypot(c.x - a.x, c.y - a.y);
        if (d <= rest + 1e-9) { weg.push(c); rest -= d; }
        else { weg.push({ x: a.x + ((c.x - a.x) * rest) / d, y: a.y + ((c.y - a.y) * rest) / d }); rest = 0; }
      }
      const l = lage[r.teil];
      b.g.appendChild(svgEl("polyline", { points: punkteText(b, weg, l.x, l.y), class: "zf-spur", "data-rolle": "spur" }));
      const ende = weg[weg.length - 1];
      laeufer = { p: { x: ende.x + l.x, y: ende.y + l.y }, stueck: r.stueck };
    }
    const q0 = b.P(start.punkte[0].x + lage[start.teil].x, start.punkte[0].y + lage[start.teil].y);
    b.g.appendChild(svgEl("circle", { cx: q0.x.toFixed(2), cy: q0.y.toFixed(2), r: 4, class: "zf-start", "data-rolle": "start" }));
    // „Start“ steht links unter dem Startpunkt: Darüber liegt die Maßlinie für r.
    b.g.appendChild(svgText(q0.x - 8, q0.y + 16, "Start", { class: "zf-start-text", "text-anchor": "end" }));
    const q = b.P(laeufer.p.x, laeufer.p.y);
    b.g.appendChild(svgEl("circle", { cx: q.x.toFixed(2), cy: q.y.toFixed(2), r: 6.5, class: "zf-laeufer", "data-rolle": "laeufer" }));
  }

  // Maße, Winkel und Beschriftungen wandern mit ihrem Teil.
  for (const w of fig.winkel || []) {
    const l = lage[w.teil];
    const M = { x: w.M.x + l.x, y: w.M.y + l.y };
    b.g.appendChild(svgEl("polygon", { points: punkteText(b, [M, ...bogenPunkte(M, w.r, w.w0, w.w1)]), class: "zf-winkel", "data-rolle": "winkel" }));
  }
  for (const ms of fig.masse) {
    const l = lage[ms.teil];
    massLinie(b, { x: ms.von.x + l.x, y: ms.von.y + l.y }, { x: ms.bis.x + l.x, y: ms.bis.y + l.y }, ms.text, ms.versatz, ms.art || "laenge", ms.bei);
  }
  for (const tx of fig.texte || []) {
    const l = lage[tx.teil];
    const q = b.P(tx.p.x + l.x, tx.p.y + l.y);
    b.g.appendChild(svgText(q.x + (tx.dx || 0), q.y + (tx.dy || 0), tx.text, { class: tx.klasse, "text-anchor": tx.anker || "middle" }));
  }
  // Nummern: in der Flächenrechnung an den Teilen, beim Umfang an den Randstücken. Unter der Nummer
  // eines Teils steht sein Flächeninhalt, sobald der Schritt gelöst ist.
  if (bsp.randNummern) {
    for (const n of fig.randNummern) {
      const l = lage[n.teil];
      const q = b.P(n.p.x + l.x, n.p.y + l.y);
      b.g.appendChild(svgText(q.x, q.y + 5, n.text, { class: "zf-nr zf-nr-rand" }));
    }
  } else {
    fig.teile.forEach((teil, i) => {
      const q = b.P(teil.marke.x + lage[i].x, teil.marke.y + lage[i].y);
      b.g.appendChild(svgText(q.x, q.y + 5, "①②③④"[i], { class: "zf-nr" + (teil.klasse === "zf-teil-b" ? " zf-nr-b" : "") }));
      const schritt = schritte.find((s) => s.wertAn === i);
      if (schritt && st.stand.has(schritt.id)) {
        b.g.appendChild(svgText(q.x, q.y + 21, `${zwei(schritt.soll)} cm²`, { class: "zf-wert" + (teil.klasse === "zf-teil-b" ? " zf-nr-b" : "") }));
      }
    });
  }
  zeige(bsp.id + "-mount", b);

  setzeText(bsp.id + "-text", bsp.text(m, {
    t, zusammen, bewegt: !zusammen,
    fertig: !aktiv, aktiv,
    s: bsp.spur ? reglerZahl(bsp.id + "-s") / 100 : 0,
    stueck: laeufer ? laeufer.stueck : 0,
  }));
}

// ---------- Die Rechnung in Schritten ----------
//
// Ein Schritt: { id, gruppe, nr, name, groesse, einheit, soll, tol, teil | rand, wertAn,
//                tipp, weg, falsch: [[wert, hinweis], …], sonst }
// Geprüft wird in dieser Reihenfolge: richtig, dann die Fehlerwerte der Reihe nach. Fällt ein
// Fehlerwert bei einer Reglerstellung mit der Lösung zusammen (¼ · π · r² und ½ · π · r sind bei
// r = 2 dieselbe Zahl), gilt die Eingabe als richtig — sie IST es dann ja.

function pruefeSchritt(schritt, roh) {
  const val = parseFlexibleNumber(roh);
  if (roh === "" || Number.isNaN(val)) return { ok: false, text: "Trag eine Zahl ein — nur die Maßzahl, mit Komma als Dezimaltrennzeichen." };
  if (Math.abs(val - schritt.soll) <= schritt.tol + 1e-9) return { ok: true };
  for (const [wert, hinweis] of schritt.falsch) {
    if (Number.isFinite(wert) && Math.abs(val - wert) <= schritt.tol + 1e-9) return { ok: false, text: hinweis };
  }
  return { ok: false, text: schritt.sonst };
}

function baueRechnung(bsp, { fokus = false } = {}) {
  const st = zustand(bsp);
  const m = bsp.lies();
  const schritte = bsp.schritte(m);
  const aktiv = aktiverSchritt(bsp, schritte);
  const box = document.getElementById(bsp.id + "-rechnung");
  box.innerHTML = "";
  let gruppe = null;
  for (const s of schritte) {
    if (s.gruppe !== gruppe) {
      gruppe = s.gruppe;
      box.appendChild(el("div", { class: "zf-gruppe" }, gruppe));
    }
    const zeile = el("div", { class: "zf-schritt", "data-schritt": s.id });
    zeile.appendChild(el("span", { class: "zf-schritt-name", html: `<span class="zf-schritt-nr">${s.nr}</span> ${s.name}` }));
    if (st.stand.has(s.id)) {
      zeile.classList.add("fertig");
      zeile.appendChild(el("span", { class: "zf-weg", html: s.weg }));
      zeile.appendChild(el("span", { class: "zf-haken " + st.stand.get(s.id) }, st.stand.get(s.id) === "richtig" ? "✓" : "aufgedeckt"));
    } else if (s === aktiv) {
      zeile.classList.add("aktiv");
      const eingabe = el("input", { type: "text", inputmode: "decimal", autocomplete: "off", "aria-label": `${s.name}: ${s.einheit === "cm" ? "Länge in cm" : "Flächeninhalt in cm²"}` });
      const rueck = el("div", { class: "zf-rueck", "aria-live": "polite" });
      const pruefen = el("button", { type: "button", class: "btn btn-primary zf-pruefen" }, "Prüfen");
      const tipp = el("button", { type: "button", class: "btn btn-tipp zf-tipp" }, "💡 Tipp");
      const zeigen = el("button", { type: "button", class: "btn zf-zeigen" }, "Rechnung zeigen");
      const erledigt = (wie) => {
        st.stand.set(s.id, wie);
        baueRechnung(bsp, { fokus: true });
        zeichne(bsp);
      };
      pruefen.addEventListener("click", () => {
        const r = pruefeSchritt(s, eingabe.value.trim());
        if (r.ok) return erledigt("richtig");
        rueck.className = "zf-rueck err";
        rueck.innerHTML = "✗ " + r.text;
      });
      tipp.addEventListener("click", () => {
        rueck.className = "zf-rueck tipp";
        rueck.innerHTML = "💡 " + s.tipp;
      });
      zeigen.addEventListener("click", () => erledigt("gezeigt"));
      eingabe.addEventListener("keydown", (e) => { if (e.key === "Enter") pruefen.click(); });
      zeile.appendChild(el("label", { class: "zf-eingabe" }, [
        el("span", { class: "zf-groesse", html: `${s.groesse} =` }), eingabe, el("span", { class: "zf-einheit" }, s.einheit),
      ]));
      zeile.appendChild(el("span", { class: "zf-knoepfe" }, [pruefen, tipp, zeigen]));
      zeile.appendChild(rueck);
    } else {
      zeile.classList.add("wartet");
      zeile.appendChild(el("span", { class: "zf-spaeter", html: `${s.groesse} = …` }));
    }
    box.appendChild(zeile);
  }
  const fuss = el("div", { class: "zf-fuss" });
  if (!aktiv) fuss.appendChild(el("span", { class: "zf-fertig" }, "Alle Schritte erledigt. "));
  const neu = el("button", { type: "button", class: "btn zf-neu" }, "Rechnung neu beginnen");
  neu.addEventListener("click", () => {
    st.stand.clear();
    baueRechnung(bsp);
    zeichne(bsp);
  });
  if (st.stand.size) fuss.appendChild(neu);
  box.appendChild(fuss);
  // Nach einem gelösten Schritt springt der Cursor ins nächste Feld — ohne die Seite zu rollen.
  if (fokus) {
    const naechstes = box.querySelector(".zf-schritt.aktiv input");
    if (naechstes) naechstes.focus({ preventScroll: true });
  }
}

// ---------- Verschieben von Hand ----------

// Hält ein Teil im Bild: Seine Verschiebung wird so begrenzt, dass es den Rahmen nicht verlässt.
function imRahmen(bsp, teil, lage) {
  const k = zustand(bsp).kasten;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const p of teil.punkte) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  return {
    x: Math.min(k.maxX - maxX, Math.max(k.minX - minX, lage.x)),
    y: Math.min(k.maxY - maxY, Math.max(k.minY - minY, lage.y)),
  };
}

function verschiebe(bsp, i, lage, { einrasten = false } = {}) {
  const st = zustand(bsp);
  const fig = bsp.figur(bsp.lies());
  const t = reglerZahl(bsp.id + "-t") / 100;
  let ziel = imRahmen(bsp, fig.teile[i], lage);
  if (einrasten && Math.hypot(ziel.x, ziel.y) < EINRASTEN) ziel = { x: 0, y: 0 };
  st.zug[i] = { x: ziel.x - t * fig.teile[i].weg.x, y: ziel.y - t * fig.teile[i].weg.y };
}

function verdrahteZiehen(bsp) {
  const st = zustand(bsp);
  const mount = document.getElementById(bsp.id + "-mount");
  let zieh = null;
  mount.addEventListener("pointerdown", (e) => {
    const ziel = e.target.closest ? e.target.closest(".zf-teil") : null;
    if (!ziel) return;
    const i = Number(ziel.dataset.index);
    // Bildpunkte auf dem Schirm in Zentimeter: Das SVG kann schmaler dargestellt sein, als seine
    // viewBox breit ist (Telefon) — der Faktor steht in der Abbildungsmatrix.
    const ctm = mount.querySelector("svg").getScreenCTM();
    const start = lagen(bsp, bsp.figur(bsp.lies()))[i];
    zieh = { i, x0: e.clientX, y0: e.clientY, start, proPx: 1 / (ctm.a * st.skala) };
    st.zieht = i;
    mount.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  mount.addEventListener("pointermove", (e) => {
    if (!zieh) return;
    verschiebe(bsp, zieh.i, {
      x: zieh.start.x + (e.clientX - zieh.x0) * zieh.proPx,
      y: zieh.start.y - (e.clientY - zieh.y0) * zieh.proPx,
    });
    zeichne(bsp);
  });
  const ende = () => {
    if (!zieh) return;
    const i = zieh.i;
    zieh = null;
    st.zieht = null;
    verschiebe(bsp, i, lagen(bsp, bsp.figur(bsp.lies()))[i], { einrasten: true });
    zeichne(bsp);
  };
  mount.addEventListener("pointerup", ende);
  mount.addEventListener("pointercancel", ende);
  // Mit der Tastatur: Pfeiltasten verschieben das Teil, das den Fokus hat, um einen Viertelzentimeter.
  mount.addEventListener("keydown", (e) => {
    const ziel = e.target.closest ? e.target.closest(".zf-teil") : null;
    const schritt = { ArrowLeft: [-0.25, 0], ArrowRight: [0.25, 0], ArrowUp: [0, 0.25], ArrowDown: [0, -0.25] }[e.key];
    if (!ziel || !schritt) return;
    e.preventDefault();
    const i = Number(ziel.dataset.index);
    const l = lagen(bsp, bsp.figur(bsp.lies()))[i];
    verschiebe(bsp, i, { x: l.x + schritt[0], y: l.y + schritt[1] });
    zeichne(bsp);
    const neu = mount.querySelector(`.zf-teil[data-index="${i}"]`);
    if (neu) neu.focus({ preventScroll: true });
  });
}

function verdrahte(bsp) {
  const st = zustand(bsp);
  const zurueck = () => { st.zug = []; };
  // Neue Maße sind eine neue Aufgabe: Die Rechnung beginnt von vorn.
  for (const id of bsp.masse) {
    document.getElementById(id).addEventListener("input", () => {
      zurueck();
      st.stand.clear();
      baueRechnung(bsp);
      zeichne(bsp);
    });
  }
  // Der Regler bestimmt die Lage wieder allein: Was von Hand verschoben war, verfällt. Sonst zeigte
  // derselbe Reglerwert zwei verschiedene Bilder.
  document.getElementById(bsp.id + "-t").addEventListener("input", () => { zurueck(); zeichne(bsp); });
  if (bsp.spur) document.getElementById(bsp.id + "-s").addEventListener("input", () => zeichne(bsp));
  document.getElementById(bsp.id + "-heim").addEventListener("click", () => {
    zurueck();
    document.getElementById(bsp.id + "-t").value = "0";
    zeichne(bsp);
  });
  verdrahteZiehen(bsp);
  baueRechnung(bsp);
  zeichne(bsp);
}

// Der Hinweis, wenn die Summe aus gerundeten Teilergebnissen in der letzten Stelle abweicht.
function rundungsHinweis(genau, gerundeteSumme, einheit) {
  return Math.abs(rund2(gerundeteSumme) - rund2(genau)) > 0.004
    ? ` <span class="zf-klein">(Mit den gerundeten Teilergebnissen kommt ${zwei(gerundeteSumme)} ${einheit} heraus — die Abweichung in der letzten Stelle entsteht nur durch das Runden.)</span>`
    : "";
}

// ================= Beispiel 1: Rechteck mit zwei Viertelkreisen =================

function figurViertel({ r, b }) {
  const CL = { x: r, y: r }, CR = { x: r + b, y: 0 };
  const bogenL = bogenPunkte(CL, r, Math.PI, 1.5 * Math.PI);   // (0 | r) → (r | 0)
  const bogenR = bogenPunkte(CR, r, 0, Math.PI / 2);            // (2r + b | 0) → (r + b | r)
  // Der Schwerpunkt eines Viertelkreises liegt 4r/(3π) ≈ 0,42 · r von jeder geraden Kante entfernt.
  const k = (4 * r) / (3 * Math.PI);
  return {
    teile: [
      { name: "Viertelkreis links", klasse: "zf-teil-a", punkte: [CL, ...bogenL], weg: { x: -1.2, y: 0 }, marke: { x: r - k, y: r - k } },
      { name: "Rechteck", klasse: "zf-teil-a", punkte: [{ x: r, y: 0 }, { x: r + b, y: 0 }, { x: r + b, y: r }, { x: r, y: r }], weg: { x: 0, y: 0 }, marke: { x: r + b / 2, y: r / 2 } },
      { name: "Viertelkreis rechts", klasse: "zf-teil-a", punkte: [CR, ...bogenR], weg: { x: 1.2, y: 0 }, marke: { x: r + b + k, y: k } },
    ],
    rand: [
      { teil: 0, stueck: 1, punkte: bogenL },
      { teil: 1, stueck: 2, punkte: [{ x: r, y: 0 }, { x: r + b, y: 0 }] },
      { teil: 2, stueck: 2, punkte: [{ x: r + b, y: 0 }, { x: 2 * r + b, y: 0 }] },
      { teil: 2, stueck: 3, punkte: bogenR },
      { teil: 1, stueck: 4, punkte: [{ x: r + b, y: r }, { x: r, y: r }] },
      { teil: 0, stueck: 4, punkte: [{ x: r, y: r }, { x: 0, y: r }] },
    ],
    schnitte: [
      { teile: [0, 1], punkte: [{ x: r, y: 0 }, { x: r, y: r }] },
      { teile: [1, 2], punkte: [{ x: r + b, y: 0 }, { x: r + b, y: r }] },
    ],
    masse: [
      { teil: 0, von: { x: 0, y: r }, bis: { x: r, y: r }, versatz: 0.35, text: `r = ${num(r)} cm` },
      { teil: 1, von: { x: r, y: r }, bis: { x: r + b, y: r }, versatz: 0.35, text: `b = ${num(b)} cm` },
      { teil: 2, von: { x: r + b, y: 0 }, bis: { x: 2 * r + b, y: 0 }, versatz: -0.35, text: `r = ${num(r)} cm` },
    ],
    // Die Nummern der Randstücke stehen innen, dicht an ihrem Stück: Außen liegen die Maßlinien.
    randNummern: [
      { teil: 0, p: { x: r - 0.78 * r * Math.SQRT1_2, y: r - 0.78 * r * Math.SQRT1_2 }, text: "①" },
      { teil: 1, p: { x: r + b / 2, y: 0.5 }, text: "②" },
      { teil: 2, p: { x: r + b + 0.78 * r * Math.SQRT1_2, y: 0.78 * r * Math.SQRT1_2 }, text: "③" },
      { teil: 1, p: { x: r + b / 2, y: r - 0.5 }, text: "④" },
    ],
    // Platz links für das Wort „Start“ am Anfang des Randes.
    platz: [{ x: -1.2 - 1.3, y: r }],
  };
}
function* masseViertel(kuerzel) {
  for (const r of reglerWerte(kuerzel + "-r")) for (const b of reglerWerte(kuerzel + "-b")) yield { r, b };
}
function liesViertel(kuerzel) {
  const r = reglerZahl(kuerzel + "-r"), b = reglerZahl(kuerzel + "-b");
  setzeText(kuerzel + "-r-anzeige", num(r) + " cm");
  setzeText(kuerzel + "-b-anzeige", num(b) + " cm");
  return { r, b };
}

const VIERTEL_FALSCH_FLAECHE = (r) => [
  [Math.PI * r * r, "Das ist der ganze Kreis. Das Teil ist nur ein Viertel davon: ¼ · π · r²."],
  [(Math.PI * r * r) / 2, "Das ist ein Halbkreis. Zwischen den beiden geraden Kanten liegt ein rechter Winkel — das Teil ist ein Viertelkreis: ¼ · π · r²."],
  [(Math.PI * r) / 2, "Das ist die Länge des Viertelbogens — eine Länge in cm. Für den Flächeninhalt wird der Radius quadriert: ¼ · π · r²."],
  [(Math.PI * r) / 4, "Du hast ¼ · π · r gerechnet und das Quadrieren vergessen: r² = r · r."],
];
const VIERTEL_FALSCH_BOGEN = (r) => [
  [(Math.PI * r * r) / 4, "Das ist der Flächeninhalt des Viertelkreises (in cm²). Gesucht ist die Länge seines Bogens: ein Viertel des Umfangs 2 · π · r."],
  [2 * Math.PI * r, "Das ist der ganze Kreisumfang. Der Bogen ist nur ein Viertel davon."],
  [Math.PI * r, "Das ist ein Halbkreisbogen. Hier ist es ein Viertel des Umfangs: ¼ · 2 · π · r."],
  [(Math.PI * r) / 4, "Du hast ¼ · π · r gerechnet. Der Umfang ist 2 · π · r — der Faktor 2 fehlt."],
];

const BEISPIEL_1 = {
  id: "z1", breite: 680, hoehe: 300,
  masse: ["z1-r", "z1-b"],
  lies: () => liesViertel("z1"),
  alleMasse: () => masseViertel("z1"),
  figur: figurViertel,
  schritte({ r, b }) {
    const A1 = (Math.PI * r * r) / 4, A2 = b * r, A = 2 * A1 + A2;
    const viertel = `¼ · π · r² = ¼ · π · (${num(r)} cm)² = ${num((r * r) / 4)} · π cm² ≈ <strong>${zwei(A1)} cm²</strong>`;
    return [
      {
        id: "a1", gruppe: "Flächeninhalt", nr: "①", name: "Viertelkreis links", groesse: "A<sub>1</sub>", einheit: "cm²",
        soll: A1, tol: TOL, teil: 0, wertAn: 0,
        tipp: "Ein Viertelkreis ist ein Viertel des ganzen Kreises: ¼ · π · r². Der Radius steht an der Zeichnung.",
        weg: `A<sub>1</sub> = ${viertel}`,
        falsch: VIERTEL_FALSCH_FLAECHE(r),
        sonst: "Welcher Bruchteil eines ganzen Kreises ist das Teil — und wie groß ist dessen Flächeninhalt π · r²?",
      },
      {
        id: "a2", gruppe: "Flächeninhalt", nr: "②", name: "Rechteck", groesse: "A<sub>2</sub>", einheit: "cm²",
        soll: A2, tol: TOL, teil: 1, wertAn: 1,
        tipp: "Das Rechteck ist b breit. Seine Höhe steht nicht an der Zeichnung: Es ist so hoch wie der Radius der Viertelkreise.",
        weg: `A<sub>2</sub> = b · r = ${num(b)} cm · ${num(r)} cm = <strong>${num(A2)} cm²</strong>`,
        falsch: [
          [2 * (b + r), "Das ist der Umfang des Rechtecks. Der Flächeninhalt ist Breite mal Höhe."],
          [b * 2 * r, "Das Rechteck ist so hoch wie der Radius der Viertelkreise, nicht wie ihr Durchmesser."],
          [b + r, "Du hast Breite und Höhe addiert. Der Flächeninhalt ist ihr Produkt: b · r."],
        ],
        sonst: "Breite mal Höhe — die Höhe des Rechtecks ist der Radius r.",
      },
      {
        id: "a3", gruppe: "Flächeninhalt", nr: "③", name: "Viertelkreis rechts", groesse: "A<sub>3</sub>", einheit: "cm²",
        soll: A1, tol: TOL, teil: 2, wertAn: 2,
        tipp: "Der rechte Viertelkreis hat denselben Radius wie der linke — und damit denselben Flächeninhalt.",
        weg: `A<sub>3</sub> = ${viertel}`,
        falsch: VIERTEL_FALSCH_FLAECHE(r),
        sonst: "Derselbe Radius wie links, also dieselbe Rechnung: ¼ · π · r².",
      },
      {
        id: "a", gruppe: "Flächeninhalt", nr: "Σ", name: "Ganze Figur", groesse: "A", einheit: "cm²",
        soll: A, tol: TOL_SUMME, teil: [0, 1, 2],
        tipp: "Addiere die drei Teilflächen: A = A<sub>1</sub> + A<sub>2</sub> + A<sub>3</sub>.",
        weg: `A = A<sub>1</sub> + A<sub>2</sub> + A<sub>3</sub> = ${num((r * r) / 2)} · π cm² + ${num(A2)} cm² ≈ <strong>${zwei(A)} cm²</strong>` +
          rundungsHinweis(A, 2 * rund2(A1) + rund2(A2), "cm²"),
        falsch: [
          [A1 + A2, "Da fehlt ein Viertelkreis — die Figur hat zwei."],
          [A2 + Math.PI * r * r, "Zwei Viertelkreise sind zusammen ein Halbkreis, kein ganzer Kreis."],
          [A2, "Das ist nur das Rechteck. Die beiden Viertelkreise gehören dazu."],
          [2 * A1, "Das sind nur die beiden Viertelkreise. Das Rechteck gehört dazu."],
        ],
        sonst: "Addiere die drei Teilflächen, die oben stehen.",
      },
    ];
  },
  text({ r, b }, z) {
    if (z.fertig) return `Geschafft: Die Figur ist so groß wie ihre drei Teile zusammen, A ≈ ${zwei(2 * (Math.PI * r * r) / 4 + b * r)} cm². Stell andere Maße ein und rechne noch einmal.`;
    if (z.bewegt) return "Die Teile sind nur verschoben. Jedes behält dabei seine Form und seinen Flächeninhalt — zusammen sind sie genau so groß wie die Figur.";
    return `Die Figur besteht aus zwei Viertelkreisen mit dem Radius r = ${num(r)} cm und einem Rechteck der Breite b = ${num(b)} cm dazwischen. Zieh die Teile auseinander und berechne sie nacheinander — das kräftig gefärbte Teil ist gerade dran.`;
  },
};

// ---- Zweiter Teil: der Umfang derselben Figur ----

const STUECK_NAME = ["", "Viertelbogen links ①", "die gerade Kante unten ②", "Viertelbogen rechts ③", "die gerade Kante oben ④"];

const BEISPIEL_1_UMFANG = {
  id: "u1", breite: 680, hoehe: 300,
  masse: ["u1-r", "u1-b"],
  spur: true, randNummern: true, schnitteRot: true,
  lies: () => liesViertel("u1"),
  alleMasse: () => masseViertel("u1"),
  figur: figurViertel,
  schritte({ r, b }) {
    const bog = (Math.PI * r) / 2, ger = b + r, U = 2 * bog + 2 * ger;
    const bogen = `¼ · 2 · π · r = ¼ · 2 · π · ${num(r)} cm = ${num(r / 2)} · π cm ≈ <strong>${zwei(bog)} cm</strong>`;
    const geradeFalsch = (wo, anderer) => [
      [b, `Das ist nur das Stück ${wo} dem Rechteck. Die gerade Kante läuft am ${anderer} Viertelkreis weiter — noch einmal r.`],
      [b + 2 * r, `${wo === "unter" ? "Unten" : "Oben"} liegt nur EIN Viertelkreis mit einer geraden Kante — der andere ist dort rund.`],
      [r, "Das ist nur das Stück am Viertelkreis. Die Kante läuft am Rechteck weiter — noch einmal b."],
    ];
    return [
      {
        id: "u1", gruppe: "Umfang", nr: "①", name: "Viertelbogen links", groesse: "u<sub>1</sub>", einheit: "cm",
        soll: bog, tol: TOL, rand: [1],
        tipp: "Ein Viertelbogen ist ein Viertel des Kreisumfangs 2 · π · r.",
        weg: `u<sub>1</sub> = ${bogen}`,
        falsch: VIERTEL_FALSCH_BOGEN(r),
        sonst: "Ein Viertel vom ganzen Kreisumfang: ¼ · 2 · π · r.",
      },
      {
        id: "u2", gruppe: "Umfang", nr: "②", name: "Gerade Kante unten", groesse: "u<sub>2</sub>", einheit: "cm",
        soll: ger, tol: TOL, rand: [2],
        tipp: "Die untere Kante läuft unter dem Rechteck UND unter dem rechten Viertelkreis entlang.",
        weg: `u<sub>2</sub> = b + r = ${num(b)} cm + ${num(r)} cm = <strong>${num(ger)} cm</strong>`,
        falsch: geradeFalsch("unter", "rechten"),
        sonst: "Verfolge die orange Kante von links nach rechts: erst b, dann r.",
      },
      {
        id: "u3", gruppe: "Umfang", nr: "③", name: "Viertelbogen rechts", groesse: "u<sub>3</sub>", einheit: "cm",
        soll: bog, tol: TOL, rand: [3],
        tipp: "Derselbe Radius wie links — also derselbe Bogen.",
        weg: `u<sub>3</sub> = ${bogen}`,
        falsch: VIERTEL_FALSCH_BOGEN(r),
        sonst: "Derselbe Radius wie links, also dieselbe Rechnung: ¼ · 2 · π · r.",
      },
      {
        id: "u4", gruppe: "Umfang", nr: "④", name: "Gerade Kante oben", groesse: "u<sub>4</sub>", einheit: "cm",
        soll: ger, tol: TOL, rand: [4],
        tipp: "Die obere Kante läuft über dem Rechteck UND über dem linken Viertelkreis entlang.",
        weg: `u<sub>4</sub> = b + r = ${num(b)} cm + ${num(r)} cm = <strong>${num(ger)} cm</strong>`,
        falsch: geradeFalsch("über", "linken"),
        sonst: "Verfolge die orange Kante von rechts nach links: erst b, dann r.",
      },
      {
        id: "u", gruppe: "Umfang", nr: "Σ", name: "Ganzer Rand", groesse: "U", einheit: "cm",
        soll: U, tol: TOL_SUMME, rand: [1, 2, 3, 4],
        tipp: "Addiere die vier Randstücke: U = u<sub>1</sub> + u<sub>2</sub> + u<sub>3</sub> + u<sub>4</sub>.",
        weg: `U = u<sub>1</sub> + u<sub>2</sub> + u<sub>3</sub> + u<sub>4</sub> = ${num(r)} · π cm + ${num(2 * ger)} cm ≈ <strong>${zwei(U)} cm</strong>` +
          rundungsHinweis(U, 2 * rund2(bog) + 2 * ger, "cm"),
        falsch: [
          [U + 2 * r, "Du hast die beiden Schnittkanten mitgezählt (je r). Sie liegen im Inneren der Figur — außen herum kommt man dort nie vorbei."],
          [U + 4 * r, "Das ist die Summe der Umfänge der drei Teile. Darin steckt jede Schnittkante zweimal — zusammen 4 · r zu viel."],
          [2 * bog + 2 * b, "Die geraden Kanten sind länger als b: Jede läuft auch an einem Viertelkreis entlang und ist b + r lang."],
          [2 * ger, "Das sind nur die beiden geraden Kanten. Die zwei Viertelbögen gehören auch zum Rand."],
        ],
        sonst: "Addiere die vier Randstücke, die oben stehen.",
      },
    ];
  },
  text({ r, b }, z) {
    if (z.bewegt) return "Jetzt sieht man die beiden roten Schnittkanten, an denen die Teile aneinanderlagen. Sie gehören zu den Teilen — am Rand der zusammengesetzten Figur liegen sie nicht.";
    if (z.s >= 1) return "Einmal außen herum und wieder am Start: zwei Viertelbögen und zwei gerade Kanten. An den gestrichelten Schnittkanten kam der Weg nie vorbei.";
    if (z.s > 0) return `Der Weg läuft gerade über ${STUECK_NAME[z.stueck]}. Bisher abgeschritten: ${Math.round(z.s * 100)} % des Randes.`;
    if (z.fertig) return `Geschafft: U ≈ ${zwei(Math.PI * r + 2 * (b + r))} cm. Die Schnittkanten (zusammen ${num(2 * r)} cm) stecken nicht darin.`;
    return "Der Rand besteht aus vier Stücken: zwei Viertelbögen und zwei geraden Kanten. Schreite ihn mit dem Regler ab und berechne die Stücke nacheinander — das orange hervorgehobene ist gerade dran.";
  },
};

// ================= Beispiel 2: Rechteck, Dreieck und Kreisausschnitt =================

// Das Dreieck hat das Seitenverhältnis 3 : 4 : 5 (waagerechte Seite : Höhe : schräge Seite). So ist
// die schräge Seite genau 1,25 · h, und die Zeichnung zeigt dieselbe Zahl, mit der gerechnet wird —
// obwohl sie für die Lernenden „gemessen“ ist.
function figurDreiTeile({ b, h, alpha }) {
  const c = 0.75 * h, s = 1.25 * h;
  const P = { x: b, y: h }, Q = { x: b, y: 0 }, T = { x: b + c, y: h };
  const w0 = Math.atan2(Q.y - T.y, Q.x - T.x);            // Richtung von T nach Q
  const w1 = w0 + (alpha * Math.PI) / 180;
  const bogen = bogenPunkte(T, s, w0, w1);                 // von Q nach E
  const E = bogen[bogen.length - 1];
  const wm = (w0 + w1) / 2;
  return {
    c, s,
    teile: [
      { name: "Rechteck", klasse: "zf-teil-a", punkte: [{ x: 0, y: 0 }, Q, P, { x: 0, y: h }], weg: { x: -1, y: 0 }, marke: { x: b / 2, y: h / 2 } },
      { name: "Dreieck", klasse: "zf-teil-a", punkte: [Q, T, P], weg: { x: 0.15, y: 1 }, marke: { x: b + c / 3, y: (2 * h) / 3 } },
      { name: "Kreisausschnitt", klasse: "zf-teil-a", punkte: [T, ...bogen], weg: { x: 1.2, y: -0.25 }, marke: { x: T.x + 0.72 * s * Math.cos(wm), y: T.y + 0.72 * s * Math.sin(wm) } },
    ],
    rand: [
      { teil: 0, stueck: 1, punkte: [{ x: 0, y: 0 }, Q] },
      { teil: 2, stueck: 2, punkte: bogen },
      { teil: 2, stueck: 1, punkte: [E, T] },
      { teil: 1, stueck: 1, punkte: [T, P] },
      { teil: 0, stueck: 1, punkte: [P, { x: 0, y: h }] },
      { teil: 0, stueck: 1, punkte: [{ x: 0, y: h }, { x: 0, y: 0 }] },
    ],
    schnitte: [
      { teile: [0, 1], punkte: [Q, P] },
      { teile: [1, 2], punkte: [Q, T] },
    ],
    masse: [
      { teil: 0, von: { x: 0, y: 0 }, bis: Q, versatz: -0.35, text: `b = ${num(b)} cm` },
      { teil: 0, von: { x: 0, y: 0 }, bis: { x: 0, y: h }, versatz: 0.35, text: `h = ${num(h)} cm`, art: "hoehe" },
      { teil: 1, von: P, bis: T, versatz: 0.35, text: `c = ${num(c)} cm` },
      // Liegt der freie Radius flach (großer Winkel), stünde seine Beschriftung mittig über ihm —
      // und damit auf der von c. Sie rückt dann zum Bogen hin.
      { teil: 2, von: T, bis: E, versatz: 0.3, text: `s = ${num(s)} cm (gemessen)`, bei: Math.abs(Math.sin(w1)) < 0.5 ? 0.85 : 0.5 },
    ],
    winkel: [{ teil: 2, M: T, r: 0.55, w0, w1 }],
    texte: [
      // „α“ auf der Winkelhalbierenden, knapp außerhalb des Winkelbogens.
      { teil: 2, p: { x: T.x + 1.05 * Math.cos(wm), y: T.y + 1.05 * Math.sin(wm) }, text: "α", klasse: "zf-winkel-text", dy: 4.5 },
    ],
    // Platz für die Beschriftung der schrägen Seite, die rechts über die Figur hinausragt, und links
    // für die der Höhe.
    platz: [{ x: E.x + 3.6, y: E.y }, { x: T.x + 3.2, y: T.y + 0.5 }, { x: -1 - 2.1, y: 0 }],
  };
}

const BEISPIEL_2 = {
  id: "t2", breite: 680, hoehe: 380,
  masse: ["t2-b", "t2-h", "t2-w"],
  lies() {
    const b = reglerZahl("t2-b"), h = reglerZahl("t2-h"), alpha = reglerZahl("t2-w");
    setzeText("t2-b-anzeige", num(b) + " cm");
    setzeText("t2-h-anzeige", num(h) + " cm");
    setzeText("t2-w-anzeige", alpha + "°");
    return { b, h, alpha };
  },
  *alleMasse() {
    for (const b of reglerWerte("t2-b")) for (const h of reglerWerte("t2-h")) for (const alpha of reglerWerte("t2-w")) yield { b, h, alpha };
  },
  figur: figurDreiTeile,
  schritte({ b, h, alpha }) {
    const c = 0.75 * h, s = 1.25 * h, k = alpha / 360;
    const A1 = b * h, A2 = (c * h) / 2, A3 = k * Math.PI * s * s, A = A1 + A2 + A3;
    const G = 2 * b + h + c + s, B = k * 2 * Math.PI * s, U = G + B;
    const anteil = bruch(`${alpha}°`, "360°");
    return [
      {
        id: "a1", gruppe: "Flächeninhalt", nr: "①", name: "Rechteck", groesse: "A<sub>1</sub>", einheit: "cm²",
        soll: A1, tol: TOL, teil: 0, wertAn: 0,
        tipp: "Breite mal Höhe: b · h.",
        weg: `A<sub>1</sub> = b · h = ${num(b)} cm · ${num(h)} cm = <strong>${num(A1)} cm²</strong>`,
        falsch: [
          [2 * (b + h), "Das ist der Umfang des Rechtecks. Der Flächeninhalt ist Breite mal Höhe."],
          [b + h, "Du hast Breite und Höhe addiert. Der Flächeninhalt ist ihr Produkt: b · h."],
        ],
        sonst: "Breite mal Höhe: b · h.",
      },
      {
        id: "a2", gruppe: "Flächeninhalt", nr: "②", name: "Dreieck", groesse: "A<sub>2</sub>", einheit: "cm²",
        soll: A2, tol: TOL, teil: 1, wertAn: 1,
        tipp: "A = ½ · Grundseite · Höhe. Nimm c als Grundseite — die Höhe dazu steht senkrecht auf c: Es ist h, die Höhe des Rechtecks.",
        weg: `A<sub>2</sub> = ½ · c · h = ½ · ${num(c)} cm · ${num(h)} cm = <strong>${num(A2)} cm²</strong>`,
        falsch: [
          [c * h, "Das ist das Rechteck aus c und h. Das Dreieck ist halb so groß: ½ · c · h."],
          [(c * s) / 2, "s ist die schräge Seite — sie steht nicht senkrecht auf c. Die Höhe des Dreiecks ist h."],
          [(h * s) / 2, "s ist die schräge Seite — sie steht nicht senkrecht auf h. Grundseite und Höhe sind c und h."],
          [c * s, "Zwei Fehler auf einmal: s ist nicht die Höhe, und das Halbieren fehlt. Richtig ist ½ · c · h."],
        ],
        sonst: "Das Dreieck ist rechtwinklig: Die beiden Seiten am rechten Winkel, c und h, sind Grundseite und Höhe.",
      },
      {
        id: "a3", gruppe: "Flächeninhalt", nr: "③", name: "Kreisausschnitt", groesse: "A<sub>3</sub>", einheit: "cm²",
        soll: A3, tol: TOL, teil: 2, wertAn: 2,
        tipp: "Der Ausschnitt ist der Anteil α : 360° eines ganzen Kreises. Sein Radius ist die schräge Seite s.",
        weg: `A<sub>3</sub> = ${bruch("α", "360°")} · π · s² = ${anteil} · π · (${num(s)} cm)² ≈ <strong>${zwei(A3)} cm²</strong>`,
        falsch: [
          [Math.PI * s * s, "Das ist der ganze Kreis mit dem Radius s. Der Ausschnitt ist nur der Anteil α : 360° davon."],
          [B, "Das ist die Länge des Bogens — eine Länge in cm. Für den Flächeninhalt: α : 360° · π · s²."],
          [k * Math.PI * h * h, "Der Radius des Ausschnitts ist die schräge Seite s, nicht die Höhe h."],
          [k * Math.PI * s, "Du hast das Quadrieren vergessen: π · s², nicht π · s."],
        ],
        sonst: "Anteil mal ganzer Kreis: α : 360° · π · s².",
      },
      {
        id: "a", gruppe: "Flächeninhalt", nr: "Σ", name: "Ganze Figur", groesse: "A", einheit: "cm²",
        soll: A, tol: TOL_SUMME, teil: [0, 1, 2],
        tipp: "Addiere die drei Teilflächen.",
        weg: `A = A<sub>1</sub> + A<sub>2</sub> + A<sub>3</sub> ≈ ${num(A1)} cm² + ${num(A2)} cm² + ${zwei(A3)} cm² ≈ <strong>${zwei(A)} cm²</strong>` +
          rundungsHinweis(A, A1 + A2 + rund2(A3), "cm²"),
        falsch: [
          [A1 + A3, "Das Dreieck fehlt in der Summe."],
          [A1 + A2, "Der Kreisausschnitt fehlt in der Summe."],
          [A2 + A3, "Das Rechteck fehlt in der Summe."],
        ],
        sonst: "Addiere die drei Teilflächen, die oben stehen.",
      },
      {
        id: "u1", gruppe: "Umfang", nr: "①", name: "Alle geraden Randstücke", groesse: "u<sub>1</sub>", einheit: "cm",
        soll: G, tol: TOL, rand: [1],
        tipp: "Geh außen herum: unten b, links h, oben erst b, dann c — und der freie Radius s des Kreisausschnitts.",
        weg: `u<sub>1</sub> = b + h + b + c + s = ${num(b)} cm + ${num(h)} cm + ${num(b)} cm + ${num(c)} cm + ${num(s)} cm = <strong>${num(G)} cm</strong>`,
        falsch: [
          [G + h + s, "Du hast die beiden Schnittkanten mitgezählt: die Seite zwischen Rechteck und Dreieck (h) und die schräge Seite zwischen Dreieck und Ausschnitt (s). Beide liegen innen."],
          [G + s, "Die schräge Seite s kommt am Rand nur einmal vor: als freier Radius des Ausschnitts. Zwischen Dreieck und Ausschnitt liegt sie innen."],
          [G + h, "Die Seite zwischen Rechteck und Dreieck ist eine Schnittkante — sie liegt innen. h zählt nur einmal: links."],
          [G - s, "Ein gerades Randstück fehlt: der freie Radius des Kreisausschnitts, s."],
          [G - c, "Oben geht der Rand über dem Dreieck weiter: nach b kommt noch c."],
        ],
        sonst: "Fünf gerade Stücke liegen am Rand: b, h, b, c und s. Die gestrichelten Schnittkanten zählen nicht.",
      },
      {
        id: "u2", gruppe: "Umfang", nr: "②", name: "Bogen", groesse: "u<sub>2</sub>", einheit: "cm",
        soll: B, tol: TOL, rand: [2],
        tipp: "Der Bogen ist der Anteil α : 360° des Kreisumfangs 2 · π · s.",
        weg: `u<sub>2</sub> = ${bruch("α", "360°")} · 2 · π · s = ${anteil} · 2 · π · ${num(s)} cm ≈ <strong>${zwei(B)} cm</strong>`,
        falsch: [
          [A3, "Das ist der Flächeninhalt des Ausschnitts (in cm²). Gesucht ist die Länge seines Bogens: α : 360° · 2 · π · s."],
          [2 * Math.PI * s, "Das ist der ganze Kreisumfang. Der Bogen ist nur der Anteil α : 360° davon."],
          [k * 2 * Math.PI * h, "Der Radius des Ausschnitts ist die schräge Seite s, nicht die Höhe h."],
          [k * Math.PI * s, "Der Faktor 2 fehlt: Der Kreisumfang ist 2 · π · s."],
        ],
        sonst: "Anteil mal ganzer Umfang: α : 360° · 2 · π · s.",
      },
      {
        id: "u", gruppe: "Umfang", nr: "Σ", name: "Ganzer Rand", groesse: "U", einheit: "cm",
        soll: U, tol: TOL_SUMME, rand: [1, 2],
        tipp: "Gerade Stücke plus Bogen: U = u<sub>1</sub> + u<sub>2</sub>.",
        weg: `U = u<sub>1</sub> + u<sub>2</sub> ≈ ${num(G)} cm + ${zwei(B)} cm ≈ <strong>${zwei(U)} cm</strong>`,
        falsch: [
          [G + h + s + B, "Die beiden Schnittkanten (h und s) liegen innen — sie gehören nicht zum Rand."],
          [G, "Der Bogen fehlt noch."],
          [B, "Die geraden Randstücke fehlen noch."],
        ],
        sonst: "Addiere die geraden Randstücke und den Bogen.",
      },
    ];
  },
  text({ b, h, alpha }, z) {
    const c = 0.75 * h, s = 1.25 * h;
    if (z.fertig) return `Geschafft: Flächeninhalt und Umfang stehen in der Rechnung. Die schräge Seite s = ${num(s)} cm kam nur beim Kreisausschnitt und beim Rand vor — für die Dreiecksfläche zählen c und h.`;
    if (z.bewegt) return `Auseinandergezogen sieht man, dass die schräge Seite s = ${num(s)} cm zu zwei Teilen gehört: Sie ist eine Seite des Dreiecks und ein Radius des Kreisausschnitts.`;
    return `Ein Rechteck (${num(b)} cm breit, ${num(h)} cm hoch), ein rechtwinkliges Dreieck mit den Seiten c = ${num(c)} cm und h am rechten Winkel und ein Kreisausschnitt mit α = ${alpha}°. Seine Spitze ist die obere Ecke des Dreiecks, sein Radius die schräge Seite s.`;
  },
};

// ================= Beispiel 3: ergänzen und abziehen =================

// An ein Rechteck (b breit, h hoch) schließt rechts ein Halbkreis an; sein Durchmesser ist h. Links
// ist in der Mitte der Seite ein kleiner Halbkreis ausgeschnitten: Oben und unten bleibt je der
// Abstand a stehen, sein Durchmesser ist also h − 2 · a.
function figurAusschnitt({ b, h, a }) {
  const R = h / 2, r = R - a;
  const N = { x: 0, y: R }, Z = { x: b, y: R };
  const kerbe = bogenPunkte(N, r, Math.PI / 2, -Math.PI / 2);   // (0 | R + r) → (r | R) → (0 | R − r)
  const gross = bogenPunkte(Z, R, -Math.PI / 2, Math.PI / 2);   // (b | 0) → (b + R | R) → (b | h)
  const k = (4 * R) / (3 * Math.PI), kk = (4 * r) / (3 * Math.PI);
  return {
    R, r,
    teile: [
      { name: "Rechteck mit Ausschnitt", klasse: "zf-teil-a", punkte: [{ x: 0, y: 0 }, { x: b, y: 0 }, { x: b, y: h }, { x: 0, y: h }, ...kerbe], weg: { x: 0, y: 0 }, marke: { x: (r + b) / 2, y: R } },
      { name: "Halbkreis", klasse: "zf-teil-a", punkte: gross, weg: { x: 1, y: 0 }, marke: { x: b + k, y: R } },
      { name: "ausgeschnittener Halbkreis", klasse: "zf-teil-b", punkte: bogenPunkte(N, r, -Math.PI / 2, Math.PI / 2), weg: { x: -(r + 0.9), y: 0 }, marke: { x: kk, y: R } },
    ],
    rand: [
      { teil: 0, stueck: 1, punkte: [{ x: 0, y: 0 }, { x: b, y: 0 }] },
      { teil: 1, stueck: 2, punkte: gross },
      { teil: 0, stueck: 1, punkte: [{ x: b, y: h }, { x: 0, y: h }] },
      { teil: 0, stueck: 1, punkte: [{ x: 0, y: h }, { x: 0, y: R + r }] },
      { teil: 0, stueck: 3, punkte: kerbe },
      { teil: 0, stueck: 1, punkte: [{ x: 0, y: R - r }, { x: 0, y: 0 }] },
    ],
    schnitte: [{ teile: [0, 1], punkte: [{ x: b, y: 0 }, { x: b, y: h }] }],
    masse: [
      { teil: 0, von: { x: 0, y: 0 }, bis: { x: b, y: 0 }, versatz: -0.35, text: `b = ${num(b)} cm` },
      // Die Höhe steht rechts außen neben dem Halbkreis und wandert mit ihm: Links zieht das orange
      // Stück hinaus, und im Rechteck läge die Beschriftung bei schmalen Figuren auf dem Ausschnitt.
      { teil: 1, von: { x: b + R, y: 0 }, bis: { x: b + R, y: h }, versatz: -0.35, text: `h = ${num(h)} cm`, art: "hoehe" },
      { teil: 0, von: { x: 0, y: h - a }, bis: { x: 0, y: h }, versatz: 0.3, text: `a = ${num(a)} cm` },
    ],
    // Platz links für die Beschriftung des Abstands a und rechts für die der Höhe.
    platz: [{ x: -2.4, y: h }, { x: b + R + 1 + 2.3, y: R }],
  };
}
// Der Ausschnitt muss in die Seite passen (Radius mindestens 0,5 cm) und darf nicht bis an den
// rechten Rand des Rechtecks reichen (mindestens 1 cm Abstand). Beide Grenzen liegen auf dem Raster
// des Reglers.
const a3Grenzen = (b, h) => [Math.max(0.5, h / 2 - (b - 1)), h / 2 - 0.5];

const BEISPIEL_3 = {
  id: "a3", breite: 680, hoehe: 380,
  masse: ["a3-b", "a3-h", "a3-a"],
  lies() {
    const b = reglerZahl("a3-b"), h = reglerZahl("a3-h");
    const [min, max] = a3Grenzen(b, h);
    const a = begrenzt("a3-a", reglerZahl("a3-a"), min, max);
    setzeText("a3-b-anzeige", num(b) + " cm");
    setzeText("a3-h-anzeige", num(h) + " cm");
    setzeText("a3-a-anzeige", num(a) + " cm");
    return { b, h, a };
  },
  *alleMasse() {
    for (const b of reglerWerte("a3-b")) for (const h of reglerWerte("a3-h")) {
      const [min, max] = a3Grenzen(b, h);
      for (const a of reglerWerte("a3-a")) if (a >= min - 1e-9 && a <= max + 1e-9) yield { b, h, a };
    }
  },
  figur: figurAusschnitt,
  schritte({ b, h, a }) {
    const R = h / 2, r = R - a;
    const A1 = b * h, A2 = (Math.PI * R * R) / 2, A3 = (Math.PI * r * r) / 2, A = A1 + A2 - A3;
    const G = 2 * b + 2 * a, B1 = Math.PI * R, B2 = Math.PI * r, U = G + B1 + B2;
    // a ist nur dann ein falscher Radius, wenn es nicht zufällig so groß ist wie r.
    const aStattR = (wert) => (Math.abs(a - r) < 1e-9 ? NaN : wert);
    return [
      {
        id: "a1", gruppe: "Flächeninhalt", nr: "①", name: "Rechteck — ganz, ohne Ausschnitt", groesse: "A<sub>1</sub>", einheit: "cm²",
        soll: A1, tol: TOL, teil: [0, 2], wertAn: 0,
        tipp: "Ergänze in Gedanken das orange Stück: Dann ist das Rechteck vollständig, b breit und h hoch.",
        weg: `A<sub>1</sub> = b · h = ${num(b)} cm · ${num(h)} cm = <strong>${num(A1)} cm²</strong>`,
        falsch: [
          [2 * (b + h), "Das ist der Umfang des Rechtecks. Der Flächeninhalt ist Breite mal Höhe."],
          [A1 - A3, "Das ist schon das Rechteck ohne den Ausschnitt. Hier ist erst das GANZE Rechteck gefragt — abgezogen wird am Ende."],
        ],
        sonst: "Das ganze Rechteck: Breite mal Höhe, b · h.",
      },
      {
        id: "a2", gruppe: "Flächeninhalt", nr: "②", name: "Halbkreis rechts", groesse: "A<sub>2</sub>", einheit: "cm²",
        soll: A2, tol: TOL, teil: 1, wertAn: 1,
        tipp: "Der Durchmesser des Halbkreises ist die Höhe h. Sein Radius ist also R = h : 2.",
        weg: `R = h : 2 = ${num(R)} cm, &nbsp; A<sub>2</sub> = ½ · π · R² = ½ · π · (${num(R)} cm)² = ${num((R * R) / 2)} · π cm² ≈ <strong>${zwei(A2)} cm²</strong>`,
        falsch: [
          [Math.PI * R * R, "Das ist der ganze Kreis. Rechts sitzt nur ein Halbkreis: ½ · π · R²."],
          [(Math.PI * h * h) / 2, "h ist der Durchmesser des Halbkreises. In die Formel gehört der Radius R = h : 2."],
          [Math.PI * R, "Das ist die Länge des Halbkreisbogens — eine Länge in cm. Für den Flächeninhalt: ½ · π · R²."],
          [(Math.PI * R) / 2, "Du hast das Quadrieren vergessen: ½ · π · R², nicht ½ · π · R."],
        ],
        sonst: "Halber Kreis mit dem Radius R = h : 2 — also ½ · π · R².",
      },
      {
        id: "a3", gruppe: "Flächeninhalt", nr: "③", name: "Ausschnitt links", groesse: "A<sub>3</sub>", einheit: "cm²",
        soll: A3, tol: TOL, teil: 2, wertAn: 2,
        tipp: "Über und unter dem Ausschnitt bleibt je a stehen. Sein Durchmesser ist h − 2 · a, sein Radius die Hälfte davon.",
        weg: `r = (h − 2 · a) : 2 = (${num(h)} cm − ${num(2 * a)} cm) : 2 = ${num(r)} cm, &nbsp; A<sub>3</sub> = ½ · π · r² = ½ · π · (${num(r)} cm)² = ${num((r * r) / 2)} · π cm² ≈ <strong>${zwei(A3)} cm²</strong>`,
        falsch: [
          [aStattR((Math.PI * a * a) / 2), "a ist der Abstand vom Ausschnitt zur Ecke, nicht sein Radius. Der Durchmesser ist h − 2 · a."],
          [(Math.PI * (2 * r) * (2 * r)) / 2, "h − 2 · a ist der Durchmesser des Ausschnitts. In die Formel gehört der Radius — die Hälfte davon."],
          [Math.PI * r * r, "Das ist der ganze Kreis. Ausgeschnitten ist nur ein Halbkreis: ½ · π · r²."],
          [Math.PI * r, "Das ist die Länge des Halbkreisbogens — eine Länge in cm. Für den Flächeninhalt: ½ · π · r²."],
        ],
        sonst: "Bestimme zuerst den Radius: r = (h − 2 · a) : 2. Dann ½ · π · r².",
      },
      {
        id: "a", gruppe: "Flächeninhalt", nr: "Σ", name: "Ganze Figur", groesse: "A", einheit: "cm²",
        soll: A, tol: TOL_SUMME, teil: [0, 1],
        tipp: "Rechteck und großer Halbkreis gehören zur Figur, der kleine Halbkreis fehlt ihr: A = A<sub>1</sub> + A<sub>2</sub> − A<sub>3</sub>.",
        weg: `A = A<sub>1</sub> + A<sub>2</sub> − A<sub>3</sub> = ${num(A1)} cm² + ${num((R * R) / 2)} · π cm² − ${num((r * r) / 2)} · π cm² ≈ <strong>${zwei(A)} cm²</strong>` +
          rundungsHinweis(A, A1 + rund2(A2) - rund2(A3), "cm²"),
        falsch: [
          [A1 + A2 + A3, "Der kleine Halbkreis ist AUSGESCHNITTEN — er fehlt der Figur. Er wird abgezogen, nicht addiert."],
          [A1 + A2, "Das ist die Figur ohne Ausschnitt. Der kleine Halbkreis fehlt ihr: Zieh A<sub>3</sub> noch ab."],
          [A1 - A3, "Der große Halbkreis rechts gehört auch zur Figur."],
          [A1 - A2 - A3, "Nur der kleine Halbkreis wird abgezogen. Der große sitzt außen am Rechteck — er kommt dazu."],
        ],
        sonst: "Dazu, was zur Figur gehört — weg, was ihr fehlt: A₁ + A₂ − A₃.",
      },
      {
        id: "u1", gruppe: "Umfang", nr: "①", name: "Alle geraden Randstücke", groesse: "u<sub>1</sub>", einheit: "cm",
        soll: G, tol: TOL, rand: [1],
        tipp: "Oben b, unten b — und links die beiden kurzen Stücke über und unter dem Ausschnitt, je a.",
        weg: `u<sub>1</sub> = b + b + a + a = 2 · ${num(b)} cm + 2 · ${num(a)} cm = <strong>${num(G)} cm</strong>`,
        falsch: [
          [2 * b + h, "Die linke Seite ist nicht mehr ganz da: Von h bleiben nur die beiden Stücke über und unter dem Ausschnitt, je a."],
          [G + h, "Die Kante zwischen Rechteck und Halbkreis ist eine Schnittkante — sie liegt innen und zählt nicht."],
          [2 * b, "Links bleiben über und unter dem Ausschnitt zwei gerade Stücke stehen, je a."],
          [2 * b + a, "Links bleiben ZWEI gerade Stücke stehen: eines über und eines unter dem Ausschnitt."],
        ],
        sonst: "Vier gerade Stücke liegen am Rand: oben b, unten b, links zweimal a.",
      },
      {
        id: "u2", gruppe: "Umfang", nr: "②", name: "Großer Halbkreisbogen", groesse: "u<sub>2</sub>", einheit: "cm",
        soll: B1, tol: TOL, rand: [2],
        tipp: "Ein Halbkreisbogen ist der halbe Kreisumfang: ½ · 2 · π · R = π · R, mit R = h : 2.",
        weg: `u<sub>2</sub> = ½ · 2 · π · R = π · ${num(R)} cm ≈ <strong>${zwei(B1)} cm</strong>`,
        falsch: [
          [2 * Math.PI * R, "Das ist der ganze Kreisumfang (oder π · h). Am Rand liegt nur der halbe: π · R."],
          [A2, "Das ist der Flächeninhalt des Halbkreises (in cm²). Gesucht ist die Länge seines Bogens: π · R."],
          [(Math.PI * R) / 2, "Das ist ein Viertelbogen. Der Halbkreisbogen ist π · R lang."],
        ],
        sonst: "Halber Kreisumfang mit dem Radius R = h : 2 — also π · R.",
      },
      {
        id: "u3", gruppe: "Umfang", nr: "③", name: "Kleiner Halbkreisbogen am Ausschnitt", groesse: "u<sub>3</sub>", einheit: "cm",
        soll: B2, tol: TOL, rand: [3],
        tipp: "Auch der Rand des Ausschnitts gehört zum Rand der Figur: ein Halbkreisbogen mit dem Radius r = (h − 2 · a) : 2.",
        weg: `u<sub>3</sub> = ½ · 2 · π · r = π · ${num(r)} cm ≈ <strong>${zwei(B2)} cm</strong>`,
        falsch: [
          [2 * Math.PI * r, "Das ist der ganze Kreisumfang. Am Rand liegt nur der halbe: π · r."],
          [A3, "Das ist der Flächeninhalt des Ausschnitts (in cm²). Gesucht ist die Länge seines Bogens: π · r."],
          [aStattR(Math.PI * a), "a ist der Abstand zur Ecke, nicht der Radius des Ausschnitts. Der Radius ist r = (h − 2 · a) : 2."],
          [(Math.PI * r) / 2, "Das ist ein Viertelbogen. Der Halbkreisbogen ist π · r lang."],
        ],
        sonst: "Halber Kreisumfang mit dem Radius r = (h − 2 · a) : 2 — also π · r.",
      },
      {
        id: "u", gruppe: "Umfang", nr: "Σ", name: "Ganzer Rand", groesse: "U", einheit: "cm",
        soll: U, tol: TOL_SUMME, rand: [1, 2, 3],
        tipp: "Alle drei gehören zum Rand — auch der kleine Bogen: U = u<sub>1</sub> + u<sub>2</sub> + u<sub>3</sub>.",
        weg: `U = u<sub>1</sub> + u<sub>2</sub> + u<sub>3</sub> = ${num(G)} cm + ${num(R)} · π cm + ${num(r)} · π cm ≈ <strong>${zwei(U)} cm</strong>` +
          rundungsHinweis(U, G + rund2(B1) + rund2(B2), "cm"),
        falsch: [
          [G + B1 - B2, "Beim Umfang wird nichts abgezogen: Der kleine Bogen ist ein Stück Rand — er kommt dazu."],
          [2 * b + h + B1, "Das ist der Umfang OHNE Ausschnitt. Durch den Ausschnitt fällt links die Strecke 2 · r weg, dafür kommt der Bogen π · r dazu."],
          [G + B1, "Der Rand des Ausschnitts fehlt: der kleine Halbkreisbogen."],
        ],
        sonst: "Addiere die geraden Randstücke und beide Bögen.",
      },
    ];
  },
  text({ b, h, a }, z) {
    const R = h / 2, r = R - a;
    const ohne = 2 * b + h + Math.PI * R, mit = 2 * b + 2 * a + Math.PI * R + Math.PI * r;
    if (z.fertig) return `Geschafft. Vergleiche: Ohne Ausschnitt wäre der Umfang etwa ${zwei(ohne)} cm, mit Ausschnitt sind es etwa ${zwei(mit)} cm — der Flächeninhalt ist kleiner geworden, der Rand länger.`;
    if (z.t >= 1) return `Das orange Stück ist herausgenommen: ein Halbkreis mit dem Radius r = ${num(r)} cm. Er behält seinen Flächeninhalt — und genau der fehlt jetzt der Figur. Am Rand ist dafür ein Bogen dazugekommen.`;
    if (z.bewegt) return "Die Teile werden nur verschoben. Das orange Stück wandert aus dem Rechteck heraus und lässt eine Lücke von genau seiner Größe zurück.";
    return `Noch sitzt das orange Stück im Rechteck: Mit ihm ist das Rechteck vollständig, ${num(b)} cm breit und ${num(h)} cm hoch. Der Ausschnitt liegt in der Mitte der linken Seite — über und unter ihm bleibt je a = ${num(a)} cm stehen. Zieh die Teile auseinander.`;
  },
};

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

const QUIZZE = {
  "quiz-zerlegen": {
    q: "Ein Fenster besteht aus einem Rechteck (80 cm breit, 100 cm hoch) und einem Halbkreis, der oben auf der ganzen Breite aufsitzt. Welche Rechnung liefert seinen Flächeninhalt in cm²?",
    options: [
      "80 · 100 + ½ · π · 80²",
      "80 · 100 + π · 40²",
      "80 · 100 + ½ · π · 40²",
      "80 · 100 · ½ · π · 40²",
    ],
    correct: 2,
    explain:
      "Die Figur zerfällt in ein Rechteck und einen Halbkreis, und die Teilflächen werden addiert. Der Halbkreis sitzt auf der Breite 80 cm — das ist sein Durchmesser, der Radius ist 40 cm. Ein Halbkreis ist die Hälfte von π · r²: ½ · π · 40². Mit 80² wäre der Durchmesser quadriert, ohne das ½ stünde dort ein ganzer Kreis, und multipliziert werden Teilflächen nie.",
  },
  "quiz-umfang": {
    q: "Zwei Quadrate mit der Seitenlänge 5 cm werden Seite an Seite zu einem Rechteck zusammengeschoben. Wie groß ist der Umfang des Rechtecks?",
    options: [
      "30 cm",
      "40 cm",
      "35 cm",
      "50 cm",
    ],
    correct: 0,
    explain:
      "Jedes Quadrat hat den Umfang 20 cm, zusammen 40 cm. Die beiden Seiten, die aneinanderliegen, sind aber Schnittkanten — sie liegen jetzt innen. Jede ist 5 cm lang, und beide fallen weg: 40 cm − 2 · 5 cm = 30 cm. Probe am Rechteck mit 10 cm und 5 cm: 2 · (10 + 5) cm = 30 cm. Die 50 wäre der Flächeninhalt in cm².",
  },
  "quiz-teile": {
    q: "Auf einem Quadrat mit 6 cm Seitenlänge sitzt als Dach ein Dreieck: Grundseite 6 cm, Höhe 4 cm, die beiden schrägen Seiten je 5 cm (gemessen). Wie groß ist der Umfang der ganzen Figur?",
    options: [
      "40 cm",
      "34 cm",
      "48 cm",
      "28 cm",
    ],
    correct: 3,
    explain:
      "Am Rand liegen drei Seiten des Quadrats und die beiden schrägen Dachseiten: 3 · 6 cm + 2 · 5 cm = 28 cm. Die Grundseite des Dreiecks liegt auf dem Quadrat — eine Schnittkante, die bei beiden Teilen wegfällt. 40 cm wären beide Umfänge zusammen, 34 cm nur einmal 6 cm abgezogen. Die Höhe 4 cm liegt im Inneren des Dreiecks und gehört nie zum Rand; sie wird nur für den Flächeninhalt gebraucht (36 cm² + 12 cm² = 48 cm²).",
  },
  "quiz-abziehen": {
    q: "Aus einem Quadrat wird am Rand ein Halbkreis ausgeschnitten, dessen Durchmesser auf einer Quadratseite liegt. Was geschieht mit Flächeninhalt und Umfang?",
    options: [
      "Beide werden kleiner.",
      "Der Flächeninhalt wird kleiner, der Umfang größer.",
      "Der Flächeninhalt wird kleiner, der Umfang bleibt gleich.",
      "Beide bleiben gleich — es ist ja dasselbe Quadrat.",
    ],
    correct: 1,
    explain:
      "Dem Quadrat fehlt jetzt die Fläche des Halbkreises: Der Flächeninhalt wird kleiner. Am Rand aber steht an der Stelle der geraden Strecke 2 · r der Bogen π · r — und π · r ≈ 3,14 · r ist länger als 2 · r. Der Umfang wächst um π · r − 2 · r. Abgezogen wird beim Ausschneiden nur die Fläche.",
  },
};

function initQuizzes() {
  for (const [id, def] of Object.entries(QUIZZE)) mountQuiz(document.getElementById(id), def);
}

// ================= Start =================

// Jedes Beispiel wird verdrahtet UND einmal gezeichnet — sonst bliebe die Seite leer, bis jemand
// einen Regler anfasst.
[BEISPIEL_1, BEISPIEL_1_UMFANG, BEISPIEL_2, BEISPIEL_3].forEach(verdrahte);
initQuizzes();
mountUebungsaufgaben(document.getElementById("exercises-mount"), AUFGABEN);
