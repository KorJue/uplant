// Selbstlernpfad "Trigonometrie" (Grundwissen Klasse 5-10, Kapitel 4).
// Rein clientseitiges Vanilla-JS.
//
// Leitgedanke: Alles hängt an der Ähnlichkeit. Abschnitt 1 zeigt, dass die
// Seitenverhältnisse im rechtwinkligen Dreieck allein vom Winkel abhängen und
// deshalb überhaupt Namen bekommen dürfen. Abschnitt 2 rechnet damit Seiten
// aus, Abschnitt 3 mit den Umkehrfunktionen Winkel, Abschnitt 4 gewinnt die
// exakten Werte für 30°, 45° und 60° aus zwei halbierten Grundfiguren,
// Abschnitt 5 erweitert sin und cos am Einheitskreis über 90° hinaus, und
// Abschnitt 6 misst damit Höhen, die niemand abschreiten kann.
//
// Durchgehende Farbcodierung: Hypotenuse blau, Gegenkathete grün, Ankathete
// orange, Winkel violett, das gesuchte Stück rot.

"use strict";

import { mountUebungsaufgaben as mountUebungsaufgabenBasis } from "../../../aufgaben.js?v=2";

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
// Ein Zahlformat je Stellenzahl, einmal angelegt: toLocaleString() baut bei jedem Aufruf ein neues
// Intl.NumberFormat, und das kostet rund 40-mal so viel wie das Formatieren selbst — bei jeder
// Reglerbewegung dutzendfach.
const ZAHLFORMATE = new Map();
function zahlformat(stellen) {
  let f = ZAHLFORMATE.get(stellen);
  if (!f) ZAHLFORMATE.set(stellen, (f = new Intl.NumberFormat("de-DE", { maximumFractionDigits: stellen })));
  return f;
}
function num(x, digits = 4) {
  // sin 360° ergibt nicht 0, sondern −2,4·10⁻¹⁶ — angezeigt würde daraus "−0".
  // Deshalb wird erst auf die Anzeigegenauigkeit gerundet und dann über das
  // Vorzeichen entschieden; ein Wert, der als 0 erscheint, ist eine 0.
  const gerundet = Number(x.toFixed(Math.min(20, digits)));
  const z = gerundet === 0 ? 0 : x;
  return zahlformat(digits).format(z).replace("-", "−");
}
// Ist der angezeigte Wert bei dieser Stellenzahl exakt, steht dort "=", sonst "≈".
// Das Quadrat einer negativen Zahl braucht Klammern: „−0,5²“ liest sich als
// −(0,5²) und wäre damit das Gegenteil des Gemeinten.
function quadrat(x, stellen) {
  return (x < 0 ? `(${num(x, stellen)})` : num(x, stellen)) + "²";
}

function zeichen(x, stellen) {
  return Math.abs(Number(x.toFixed(stellen)) - x) < 1e-12 ? "=" : "≈";
}
// Für Kennzahlenkarten: dort steht die Zahl allein, ein "=" davor wäre sinnlos —
// nur eine Rundung muss angekündigt werden.
function mitZeichen(x, stellen) {
  return (zeichen(x, stellen) === "≈" ? "≈ " : "") + num(x, stellen);
}
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function parseFlexibleNumber(raw) {
  if (raw == null) return NaN;
  const s = String(raw).trim().replace(/\s/g, "").replace(/−/g, "-").replace(/°/g, "")
    .replace(/\./g, "").replace(",", ".");
  return parseFloat(s);
}
function neueFlaeche(w, h) {
  return svgEl("svg", { viewBox: `0 0 ${w} ${h}`, width: w, height: h, class: "geo-svg", preserveAspectRatio: "xMidYMid meet" });
}
function karte(klasse, name, inhalt) {
  return el("div", { class: "tr-karte " + klasse }, [
    el("span", { class: "name" }, name),
    el("span", { class: "wert", html: inhalt }),
  ]);
}
function schrittZeile(inhaltHtml, grundHtml, klasse = "", kommentar = "") {
  return `<div class="zeile ${klasse}">` +
    `<span class="gl">${inhaltHtml}</span>` +
    (grundHtml ? `<span class="grund">${grundHtml}</span>` : "") +
    (kommentar ? `<span class="kommentar">${kommentar}</span>` : "") +
    `</div>`;
}
function bruchHtml(obenHtml, untenHtml) {
  return `<span class="tr-bruch"><span class="oben">${obenHtml}</span><span class="unten">${untenHtml}</span></span>`;
}

// ---------- Winkelfunktionen im Gradmaß ----------

// Der Taschenrechner der Schülerin steht auf DEG; JavaScript rechnet im
// Bogenmaß. Alle Aufrufe laufen deshalb über diese vier Umrechnungen.
const BOGEN = Math.PI / 180;
function sinG(a) { return Math.sin(a * BOGEN); }
function cosG(a) { return Math.cos(a * BOGEN); }
function tanG(a) { return Math.tan(a * BOGEN); }
function atanG(x) { return Math.atan(x) / BOGEN; }
function asinG(x) { return Math.asin(x) / BOGEN; }
function acosG(x) { return Math.acos(x) / BOGEN; }

// ---------- Zeichnen des rechtwinkligen Dreiecks ----------

// Bestimmt den Maßstab so, dass das Dreieck den vorgesehenen Kasten ausfüllt.
// Ohne das wäre ein spitzes Dreieck ein Strich in der Ecke und ein flaches
// liefe aus dem Bild heraus.
function dreieckPasst(ank, geg, kastenB, kastenH, maxSkala = 70) {
  const skala = Math.min(kastenB / Math.max(ank, 1e-6), kastenH / Math.max(geg, 1e-6), maxSkala);
  return { skala, breite: ank * skala, hoehe: geg * skala };
}
// Linker Rand, damit das Dreieck waagerecht mittig steht — mit Platz für die
// Beschriftung der Hypotenuse links davon.
function linkerRand(bildB, breite, platz = 74) {
  return Math.max(platz, (bildB - breite) / 2);
}

// Der rechte Winkel sitzt immer bei C, unten rechts. A liegt unten links (dort
// steht der Winkel α), B senkrecht über C. So sieht das Dreieck in jedem
// Abschnitt gleich aus, und die Farben bedeuten überall dasselbe.
function dreieckZeichnen(svg, A, ank, geg, opt = {}) {
  const C = { x: A.x + ank, y: A.y };
  const B = { x: C.x, y: C.y - geg };
  const klassen = opt.klassen || {};
  svg.appendChild(svgEl("path", {
    d: `M ${A.x.toFixed(2)} ${A.y.toFixed(2)} L ${C.x.toFixed(2)} ${C.y.toFixed(2)} L ${B.x.toFixed(2)} ${B.y.toFixed(2)} Z`,
    class: "tr-dreieck" + (opt.blass ? " blass" : ""),
  }));
  const seite = (p, q, klasse) => svg.appendChild(svgEl("line", {
    x1: p.x.toFixed(2), y1: p.y.toFixed(2), x2: q.x.toFixed(2), y2: q.y.toFixed(2),
    class: "tr-seite " + klasse,
  }));
  if (!opt.blass) {
    seite(A, C, "ank" + (klassen.ank || ""));
    seite(C, B, "geg" + (klassen.geg || ""));
    seite(A, B, "hyp" + (klassen.hyp || ""));
    // Rechter Winkel bei C
    const m = 13;
    svg.appendChild(svgEl("path", {
      d: `M ${(C.x - m).toFixed(2)} ${C.y.toFixed(2)} L ${(C.x - m).toFixed(2)} ${(C.y - m).toFixed(2)} L ${C.x.toFixed(2)} ${(C.y - m).toFixed(2)}`,
      class: "tr-rechterwinkel",
    }));
    // Winkelbogen bei A
    if (opt.winkel !== false) {
      const r = Math.min(30, ank * 0.42);
      const alpha = Math.atan2(geg, ank);
      svg.appendChild(svgEl("path", {
        d: `M ${(A.x + r).toFixed(2)} ${A.y.toFixed(2)} A ${r} ${r} 0 0 0 ` +
           `${(A.x + r * Math.cos(alpha)).toFixed(2)} ${(A.y - r * Math.sin(alpha)).toFixed(2)}`,
        class: "tr-winkelbogen",
      }));
      if (opt.winkelText) {
        svg.appendChild(svgText(A.x + (r + 15) * Math.cos(alpha / 2), A.y - (r + 12) * Math.sin(alpha / 2) + 4,
          opt.winkelText, { class: "tr-winkeltext", "text-anchor": "start" }));
      }
    }
  }
  if (opt.ankText) svg.appendChild(svgText((A.x + C.x) / 2, A.y + 18, opt.ankText, { class: "tr-seitentext ank" + (klassen.ank || "") }));
  if (opt.gegText) svg.appendChild(svgText(C.x + 8, (C.y + B.y) / 2 + 4, opt.gegText, { class: "tr-seitentext geg" + (klassen.geg || ""), "text-anchor": "start" }));
  if (opt.hypText) svg.appendChild(svgText((A.x + B.x) / 2 - 14, (A.y + B.y) / 2 - 6, opt.hypText, { class: "tr-seitentext hyp" + (klassen.hyp || ""), "text-anchor": "end" }));
  if (opt.ecken) {
    svg.appendChild(svgText(A.x - 6, A.y + 14, "A", { class: "tr-eckentext", "text-anchor": "end" }));
    svg.appendChild(svgText(C.x + 6, C.y + 14, "C", { class: "tr-eckentext", "text-anchor": "start" }));
    svg.appendChild(svgText(B.x + 6, B.y - 6, "B", { class: "tr-eckentext", "text-anchor": "start" }));
  }
  return { A, B, C };
}

// ---------- Quiz-Komponente ----------

function mountQuiz(container, { q, options, correct, explain }) {
  container.innerHTML = "";
  container.appendChild(el("p", { class: "quiz-q", html: "❓ " + q }));
  const optWrap = el("div", { class: "quiz-options" });
  const feedback = el("div", { class: "quiz-feedback" });
  options.forEach((optText, i) => {
    const btn = el("button", { type: "button", class: "quiz-opt", html: optText });
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

// ---------- Schrittweise Protokolle ----------

function mountProtokoll(ids, baue) {
  const schritteEl = document.getElementById(ids.schritte);
  const bilanzEl = document.getElementById(ids.bilanz);
  const gleichungEl = ids.gleichung ? document.getElementById(ids.gleichung) : null;
  const mountEl = ids.mount ? document.getElementById(ids.mount) : null;
  let daten = null, gezeigt = 1;

  function zeichne() {
    schritteEl.innerHTML = daten.schritte.slice(0, gezeigt).join("");
    if (gleichungEl) gleichungEl.innerHTML = daten.gleichungHtml;
    if (mountEl) {
      mountEl.innerHTML = "";
      if (daten.bild) mountEl.appendChild(daten.bild());
    }
    const offen = daten.schritte.length - gezeigt;
    bilanzEl.innerHTML = offen === 0 ? daten.bilanz
      : `<em>Noch ${offen} Schritt${offen === 1 ? "" : "e"} bis zum Ergebnis — auf „Schritt weiter“ klicken.</em>`;
    document.getElementById(ids.schritt).disabled = offen === 0;
  }
  function neu() { daten = baue(); gezeigt = 1; zeichne(); }
  document.getElementById(ids.neu).addEventListener("click", neu);
  document.getElementById(ids.schritt).addEventListener("click", () => {
    if (gezeigt < daten.schritte.length) { gezeigt++; zeichne(); }
  });
  document.getElementById(ids.alle).addEventListener("click", () => { gezeigt = daten.schritte.length; zeichne(); });
  return { neu };
}

// ================= 1. Sinus, Kosinus und Tangens =================

// Zwei ähnliche Dreiecke mit demselben Winkel, ineinander gezeichnet. Beide
// werden aus derselben Hypotenuse gebaut — nur die Länge unterscheidet sie.
const VH_C0 = 5;       // Hypotenuse des kleinen Dreiecks in cm
const VH_KMAX = 2.5;   // größter Vergrößerungsfaktor des Reglers

// Zwei ähnliche Dreiecke mit demselben Winkel, ineinander gezeichnet. Der
// Maßstab richtet sich nach dem *größten* einstellbaren Dreieck — dann wächst
// das Bild sichtbar mit k und läuft trotzdem nie über den Rand.
function vhBild(alpha, k) {
  const B = 490, H = 320;
  const svg = neueFlaeche(B, H);
  svg.appendChild(svgText(B / 2, 16, "Dasselbe α, zwei Größen — gleiche Verhältnisse", { class: "tr-titel" }));
  const p = dreieckPasst(VH_C0 * VH_KMAX * cosG(alpha), VH_C0 * VH_KMAX * sinG(alpha), 318, 230, 80);
  const A = { x: linkerRand(B, p.breite), y: 282 };
  const klein = { c: VH_C0, b: VH_C0 * cosG(alpha), a: VH_C0 * sinG(alpha) };
  const gross = { c: VH_C0 * k, b: klein.b * k, a: klein.a * k };

  // Erst das große Dreieck blass, dann das kleine darüber — so ist zu sehen,
  // dass das kleine wirklich im großen steckt.
  dreieckZeichnen(svg, A, gross.b * p.skala, gross.a * p.skala, { blass: true, winkel: false });
  dreieckZeichnen(svg, A, klein.b * p.skala, klein.a * p.skala, {
    winkelText: `α = ${num(alpha)}°`, ecken: true,
  });

  // Die Beschriftungen werden von Hand gesetzt: Beide Hypotenusen liegen auf
  // demselben Strahl, deshalb muss ihr Abstand ausdrücklich gewählt werden.
  const punkt = (t) => ({ x: A.x + gross.b * p.skala * t, y: A.y - gross.a * p.skala * t });
  const klR = klein.c / gross.c;                       // Anteil des kleinen Dreiecks
  const hypK = punkt(klR * 0.5), hypG = punkt((1 + klR) / 2);
  svg.appendChild(svgText(hypK.x - 8, hypK.y - 8, `c = ${num(klein.c, 2)} cm`, { class: "tr-seitentext hyp", "text-anchor": "end" }));
  svg.appendChild(svgText(hypG.x - 8, hypG.y - 8, `c′ = ${num(gross.c, 2)} cm`, { class: "tr-seitentext hyp", "text-anchor": "end" }));
  svg.appendChild(svgText(A.x + klein.b * p.skala / 2, A.y + 18, `b = ${num(klein.b, 2)} cm`, { class: "tr-seitentext ank" }));
  svg.appendChild(svgText(A.x + gross.b * p.skala / 2, A.y + 36, `b′ = ${num(gross.b, 2)} cm`, { class: "tr-seitentext ank" }));
  svg.appendChild(svgText(A.x + klein.b * p.skala + 7, A.y - klein.a * p.skala / 2 + 4,
    `a = ${num(klein.a, 2)} cm`, { class: "tr-seitentext geg", "text-anchor": "start" }));
  svg.appendChild(svgText(A.x + gross.b * p.skala + 7, A.y - gross.a * p.skala / 2 + 4,
    `a′ = ${num(gross.a, 2)} cm`, { class: "tr-seitentext geg", "text-anchor": "start" }));
  return svg;
}

function renderVerhaeltnisse() {
  const alpha = Number(document.getElementById("vh-alpha").value);
  const k = Number(document.getElementById("vh-k").value) / 10;
  document.getElementById("vh-alpha-anzeige").textContent = num(alpha);
  document.getElementById("vh-k-anzeige").textContent = num(k, 1);
  const s = sinG(alpha), c = cosG(alpha), t = tanG(alpha);
  const klein = { c: VH_C0, b: VH_C0 * c, a: VH_C0 * s };
  const gross = { c: VH_C0 * k, b: VH_C0 * k * c, a: VH_C0 * k * s };

  const mount = document.getElementById("vh-mount");
  mount.innerHTML = "";
  mount.appendChild(vhBild(alpha, k));

  document.getElementById("vh-tabelle").innerHTML =
    `<caption>Alle Längen in cm — die letzten drei Spalten sind in beiden Zeilen gleich</caption>` +
    `<tr><th>Dreieck</th><th>Hypotenuse c</th><th>Gegenkathete a</th><th>Ankathete b</th>` +
    `<th>a : c</th><th>b : c</th><th>a : b</th></tr>` +
    [["klein", klein], ["groß", gross]].map(([name, d]) =>
      `<tr><th>${name}</th><td>${num(d.c, 2)}</td><td class="s">${num(d.a, 2)}</td><td class="k">${num(d.b, 2)}</td>` +
      `<td class="s">${num(d.a / d.c, 4)}</td><td class="k">${num(d.b / d.c, 4)}</td><td class="t">${num(d.a / d.b, 4)}</td></tr>`
    ).join("");

  const karten = document.getElementById("vh-karten");
  karten.innerHTML = "";
  karten.appendChild(karte("w", "Winkel α", num(alpha) + "°"));
  karten.appendChild(karte("g", "sin α = a : c", mitZeichen(s, 4)));
  karten.appendChild(karte("a", "cos α = b : c", mitZeichen(c, 4)));
  karten.appendChild(karte("r", "tan α = a : b", mitZeichen(t, 4)));

  document.getElementById("vh-bilanz").innerHTML =
    `Kleines Dreieck: <span class="wg">${num(klein.a, 2)} : ${num(klein.c, 2)} ${zeichen(s, 4)} ${num(s, 4)}</span>. ` +
    `Großes Dreieck: <span class="wg">${num(gross.a, 2)} : ${num(gross.c, 2)} ${zeichen(s, 4)} ${num(s, 4)}</span>. ` +
    `Beide Male dieselbe Zahl — beim Vergrößern kürzt sich der Faktor <span class="wh">${num(k, 1)}</span> weg:<br>` +
    `<span class="wh">(${num(k, 1)} · a) : (${num(k, 1)} · c) = a : c</span>. ` +
    `Genau deshalb darf man dieser Zahl einen Namen geben: <span class="wg">sin ${num(alpha)}°</span>. ` +
    `Sie steht im Taschenrechner, ohne dass er das Dreieck kennt.`;

  const text = document.getElementById("vh-text");
  if (alpha < 45) {
    text.innerHTML = `<span class="tr-urteil eins">α = ${num(alpha)}° &lt; 45°</span> ` +
      `Die Gegenkathete ist kürzer als die Ankathete, also ist tan α ${zeichen(t, 3)} ${num(t, 3)} kleiner als 1. ` +
      `Und weil die Hypotenuse die längste Seite ist, liegen sin α und cos α immer zwischen 0 und 1.`;
  } else if (alpha > 45) {
    text.innerHTML = `<span class="tr-urteil ja">α = ${num(alpha)}° &gt; 45°</span> ` +
      `Jetzt ist die Gegenkathete länger als die Ankathete, also ist tan α ${zeichen(t, 3)} ${num(t, 3)} größer als 1. ` +
      `Der Tangens kann jeden positiven Wert annehmen — sin und cos dagegen nie mehr als 1.`;
  } else {
    text.innerHTML = `<span class="tr-urteil eins">α = 45° — der Sonderfall</span> ` +
      `Beide Katheten sind gleich lang, also ist tan 45° = 1 und sin 45° = cos 45°. Das Dreieck ist ein halbes Quadrat.`;
  }
}

function initVerhaeltnisse() {
  document.getElementById("vh-alpha").addEventListener("input", renderVerhaeltnisse);
  document.getElementById("vh-k").addEventListener("input", renderVerhaeltnisse);
  renderVerhaeltnisse();
}

// ================= 2. Seiten berechnen =================

const SB_NAMEN = { hyp: "Hypotenuse c", geg: "Gegenkathete a", ank: "Ankathete b" };
const SB_KURZ = { hyp: "c", geg: "a", ank: "b" };
const SB_FARBE = { hyp: "hv", geg: "gv", ank: "av" };
// Zu jedem Paar (gegeben, gesucht) gehört genau eine der drei Formeln — und die
// Entscheidung, ob multipliziert oder dividiert wird.
const SB_WEGE = {
  "hyp>geg": { fkt: "sin", mal: true, formel: "sin α = a : c" },
  "hyp>ank": { fkt: "cos", mal: true, formel: "cos α = b : c" },
  "geg>hyp": { fkt: "sin", mal: false, formel: "sin α = a : c" },
  "geg>ank": { fkt: "tan", mal: false, formel: "tan α = a : b" },
  "ank>hyp": { fkt: "cos", mal: false, formel: "cos α = b : c" },
  "ank>geg": { fkt: "tan", mal: true, formel: "tan α = a : b" },
};
const SB_KANDIDATEN = (() => {
  const liste = [];
  for (const paar of Object.keys(SB_WEGE)) {
    for (let alpha = 20; alpha <= 70; alpha += 5) {
      for (let laenge = 4; laenge <= 15; laenge++) liste.push({ paar, alpha, laenge });
    }
  }
  return liste;
})();

function sbWert(art, alpha, c) {
  return art === "hyp" ? c : art === "geg" ? c * sinG(alpha) : c * cosG(alpha);
}

function sbBaue() {
  const k = pick(SB_KANDIDATEN);
  const [gegeben, gesucht] = k.paar.split(">");
  const weg = SB_WEGE[k.paar];
  const alpha = k.alpha;
  // Aus der gegebenen Seite die Hypotenuse bestimmen — daraus folgt alles andere.
  const c = gegeben === "hyp" ? k.laenge
    : gegeben === "geg" ? k.laenge / sinG(alpha)
      : k.laenge / cosG(alpha);
  const wert = sbWert(gesucht, alpha, c);
  const fw = { sin: sinG(alpha), cos: cosG(alpha), tan: tanG(alpha) }[weg.fkt];
  const gk = SB_FARBE[gegeben];
  const gn = SB_KURZ[gegeben], sn = SB_KURZ[gesucht];

  const schritte = [
    schrittZeile(
      `Gegeben: <span class="wv">α = ${num(alpha)}°</span> und ${SB_NAMEN[gegeben]} = <span class="${gk}">${num(k.laenge)} cm</span>. ` +
      `Gesucht: <span class="rv">${SB_NAMEN[gesucht]}</span>.`, "Aufgabe"),
    schrittZeile(
      `Vom Winkel α aus ist <span class="${gk}">${gn}</span> die ${SB_NAMEN[gegeben].split(" ")[0]} ` +
      `und <span class="rv">${sn}</span> die ${SB_NAMEN[gesucht].split(" ")[0]}.`,
      "benennen", "", "Erst benennen, dann rechnen — sonst greift man zur falschen Formel."),
    schrittZeile(
      `<span class="wv">${weg.formel}</span>`, "Formel wählen", "",
      `In dieser Formel kommen genau die gegebene und die gesuchte Seite vor; die dritte wird nicht gebraucht.`),
    schrittZeile(
      weg.mal
        ? `<span class="rv">${sn}</span> = <span class="${gk}">${gn}</span> · ${weg.fkt} α`
        : `<span class="rv">${sn}</span> = <span class="${gk}">${gn}</span> : ${weg.fkt} α`,
      "nach der gesuchten Seite umstellen", "",
      weg.mal ? "Die gesuchte Seite stand im Zähler — also wird multipliziert."
              : "Die gesuchte Seite stand im Nenner — also wird dividiert."),
    schrittZeile(
      `<span class="rv">${sn}</span> = ${num(k.laenge)} cm ${weg.mal ? "·" : ":"} ${weg.fkt} ${num(alpha)}° ` +
      `= ${num(k.laenge)} cm ${weg.mal ? "·" : ":"} ${num(fw, 4)} <span class="rv">≈ ${num(wert, 2)} cm</span>`,
      "einsetzen und rechnen", "fertig"),
  ];

  const bilanz =
    `<span class="wr">${SB_NAMEN[gesucht]} ≈ ${num(wert, 2)} cm</span><br>` +
    `<strong>Plausibel?</strong> Die Hypotenuse ist mit <span class="wh">${num(c, 2)} cm</span> die längste Seite, ` +
    `die Katheten messen <span class="wg">${num(c * sinG(alpha), 2)} cm</span> und <span class="wa">${num(c * cosG(alpha), 2)} cm</span>. ` +
    `Das Ergebnis liegt in dieser Ordnung — gut.<br>` +
    `<strong>Probe mit Pythagoras:</strong> ${num(c * sinG(alpha), 2)}² + ${num(c * cosG(alpha), 2)}² ` +
    `= ${num(Math.pow(c * sinG(alpha), 2) + Math.pow(c * cosG(alpha), 2), 2)} und ${num(c, 2)}² = ${num(c * c, 2)} ✓`;

  return {
    schritte,
    gleichungHtml: `<span class="wv">α = ${num(alpha)}°</span>, <span class="${gk}">${gn} = ${num(k.laenge)} cm</span> ` +
      `&nbsp;→&nbsp; <span class="rv">${sn} = ?</span>`,
    bilanz,
    bild: () => sbBild(alpha, gegeben, gesucht, c, k.laenge),
  };
}

function sbBild(alpha, gegeben, gesucht, c, laenge) {
  const B = 470, H = 300;
  const svg = neueFlaeche(B, H);
  svg.appendChild(svgText(B / 2, 16, "Blau: Hypotenuse · grün: Gegenkathete · orange: Ankathete · rot gestrichelt: gesucht", { class: "tr-titel" }));
  // Das Dreieck füllt den Kasten aus — bei jedem Winkel. Die Zahlen an den
  // Seiten sagen, wie lang die Seiten wirklich sind; das Bild ist eine Skizze.
  const p = dreieckPasst(cosG(alpha), sinG(alpha), 314, 208, 400);
  const A = { x: linkerRand(B, p.breite), y: 254 };
  const beschriftung = (art) => {
    const wert = sbWert(art, alpha, c);
    return art === gesucht ? `${SB_KURZ[art]} = ?` : `${SB_KURZ[art]} = ${num(wert, 2)} cm`;
  };
  dreieckZeichnen(svg, A, p.breite, p.hoehe, {
    winkelText: `α = ${num(alpha)}°`, ecken: true,
    ankText: beschriftung("ank"), gegText: beschriftung("geg"), hypText: beschriftung("hyp"),
    klassen: {
      ank: gesucht === "ank" ? " gesucht" : "",
      geg: gesucht === "geg" ? " gesucht" : "",
      hyp: gesucht === "hyp" ? " gesucht" : "",
    },
  });
  return svg;
}

function initSeiten() {
  mountProtokoll(
    { neu: "sb-neu", schritt: "sb-schritt", alle: "sb-alle", schritte: "sb-schritte", bilanz: "sb-bilanz", gleichung: "sb-gleichung", mount: "sb-mount" },
    sbBaue,
  ).neu();
}

// ================= 3. Winkel berechnen =================

function wiBild(a, b) {
  const B = 470, H = 300;
  const svg = neueFlaeche(B, H);
  svg.appendChild(svgText(B / 2, 16, "Beide Katheten bekannt — der Tangens liefert den Winkel", { class: "tr-titel" }));
  // Maßstab so, dass das Dreieck den Kasten füllt und nie über den Rand läuft.
  const p = dreieckPasst(b, a, 308, 206, 60);
  const A = { x: linkerRand(B, p.breite), y: 254 };
  const alpha = atanG(a / b);
  dreieckZeichnen(svg, A, p.breite, p.hoehe, {
    winkelText: `α ≈ ${num(alpha, 1)}°`, ecken: true,
    ankText: `b = ${num(b)} cm`, gegText: `a = ${num(a)} cm`,
    hypText: `c ≈ ${num(Math.hypot(a, b), 2)} cm`,
  });
  // Auch der zweite spitze Winkel bekommt einen Bogen — eine Beschriftung ohne
  // Bogen behauptete einen Winkel, den das Bild nicht zeigt.
  const Bx = A.x + p.breite, By = A.y - p.hoehe;
  const rb = Math.min(26, p.hoehe * 0.4);
  const beta = (90 - alpha) * BOGEN;
  svg.appendChild(svgEl("path", {
    d: `M ${Bx.toFixed(2)} ${(By + rb).toFixed(2)} A ${rb} ${rb} 0 0 0 ` +
       `${(Bx - rb * Math.sin(beta)).toFixed(2)} ${(By + rb * Math.cos(beta)).toFixed(2)}`,
    class: "tr-winkelbogen",
  }));
  svg.appendChild(svgText(Bx - rb - 8, By + rb + 4, `β ≈ ${num(90 - alpha, 1)}°`,
    { class: "tr-winkeltext", "text-anchor": "end" }));
  return svg;
}

function renderWinkel() {
  const a = Number(document.getElementById("wi-a").value);
  const b = Number(document.getElementById("wi-b").value);
  document.getElementById("wi-a-anzeige").textContent = num(a);
  document.getElementById("wi-b-anzeige").textContent = num(b);
  const alpha = atanG(a / b), c = Math.hypot(a, b);

  document.getElementById("wi-gleichung").innerHTML =
    `tan α = ${bruchHtml(`<span class="gv">${num(a)}</span>`, `<span class="av">${num(b)}</span>`)} ` +
    `${zeichen(a / b, 4)} ${num(a / b, 4)} &nbsp;→&nbsp; α = tan<sup>−1</sup>(${num(a / b, 4)}) <span class="wv">≈ ${num(alpha, 2)}°</span>`;

  const mount = document.getElementById("wi-mount");
  mount.innerHTML = "";
  mount.appendChild(wiBild(a, b));

  document.getElementById("wi-schritte").innerHTML = [
    schrittZeile(`tan α = <span class="gv">a</span> : <span class="av">b</span> = ${num(a)} : ${num(b)} ${zeichen(a / b, 4)} ${num(a / b, 4)}`,
      "das Verhältnis bilden"),
    schrittZeile(`α = tan<sup>−1</sup>(${num(a / b, 4)}) <span class="wv">≈ ${num(alpha, 2)}°</span>`,
      "Umkehrtaste", "fertig", "Auf dem Rechner meist als Zweitbelegung über der tan-Taste."),
    schrittZeile(`c = √(${num(a)}² + ${num(b)}²) = √${num(a * a + b * b)} <span class="hv">≈ ${num(c, 3)} cm</span>`,
      "Pythagoras für die Probe"),
    schrittZeile(`sin α = ${num(a)} : ${num(c, 3)} ≈ ${num(a / c, 4)} → α = sin<sup>−1</sup>(${num(a / c, 4)}) <span class="wv">≈ ${num(asinG(a / c), 2)}°</span>`,
      "Probe über den Sinus", "fertig", "Derselbe Winkel — der Weg über den Tangens war nur kürzer."),
  ].join("");

  const karten = document.getElementById("wi-karten");
  karten.innerHTML = "";
  karten.appendChild(karte("w", "Winkel α", mitZeichen(alpha, 2) + "°"));
  karten.appendChild(karte("w", "Winkel β", mitZeichen(90 - alpha, 2) + "°"));
  karten.appendChild(karte("h", "Hypotenuse c", mitZeichen(c, 3) + " cm"));
  karten.appendChild(karte("r", "tan α", mitZeichen(a / b, 4)));

  document.getElementById("wi-bilanz").innerHTML =
    `Drei Wege, ein Ergebnis: <span class="ww">tan<sup>−1</sup>(${num(a / b, 4)}) ≈ ${num(alpha, 2)}°</span>, ` +
    `<span class="ww">sin<sup>−1</sup>(${num(a / c, 4)}) ≈ ${num(asinG(a / c), 2)}°</span> und ` +
    `<span class="ww">cos<sup>−1</sup>(${num(b / c, 4)}) ≈ ${num(acosG(b / c), 2)}°</span>.<br>` +
    `Die beiden spitzen Winkel ergänzen sich zu 90°: <span class="ww">${num(alpha, 2)}° + ${num(90 - alpha, 2)}° = 90°</span>. ` +
    `Deshalb ist <span class="wg">sin α = cos β</span> — die Gegenkathete von α ist die Ankathete von β.`;

  const text = document.getElementById("wi-text");
  if (a > b) {
    text.innerHTML = `<span class="tr-urteil ja">α ≈ ${num(alpha, 1)}° &gt; 45°</span> ` +
      `Die Gegenkathete ist länger als die Ankathete, also muss α größer als 45° sein. Eine schnelle Kontrolle, bevor man dem Rechner glaubt.`;
  } else if (a < b) {
    text.innerHTML = `<span class="tr-urteil eins">α ≈ ${num(alpha, 1)}° &lt; 45°</span> ` +
      `Die Gegenkathete ist kürzer als die Ankathete, also muss α kleiner als 45° sein.`;
  } else {
    text.innerHTML = `<span class="tr-urteil eins">α = 45° genau</span> ` +
      `Beide Katheten sind gleich lang — das Dreieck ist gleichschenklig, und tan α = 1.`;
  }
}

function initWinkel() {
  document.getElementById("wi-a").addEventListener("input", renderWinkel);
  document.getElementById("wi-b").addEventListener("input", renderWinkel);
  renderWinkel();
}

// ================= 4. Die Werte für 30°, 45° und 60° =================

let bwWinkel = 45;

// Exakte Werte als Text — sie sollen nicht als Dezimalzahl erscheinen, denn
// gerade darum geht es in diesem Abschnitt.
const BW_EXAKT = {
  30: { sin: "1 : 2", cos: "√3 : 2", tan: "√3 : 3" },
  45: { sin: "√2 : 2", cos: "√2 : 2", tan: "1" },
  60: { sin: "√3 : 2", cos: "1 : 2", tan: "√3" },
};

function bwBild(winkel) {
  const B = 470, H = 300;
  const svg = neueFlaeche(B, H);
  const s = 150;                       // Seitenlänge der Grundfigur in Pixeln
  if (winkel === 45) {
    svg.appendChild(svgText(B / 2, 16, "Das halbe Quadrat — daher kommt 45°", { class: "tr-titel" }));
    const A = { x: 130, y: 250 };
    // Das ganze Quadrat blass, die benutzte Hälfte kräftig.
    svg.appendChild(svgEl("rect", { x: A.x, y: A.y - s, width: s, height: s, class: "tr-dreieck blass" }));
    dreieckZeichnen(svg, A, s, s, {
      winkelText: "45°", ecken: true,
      ankText: "1", gegText: "1", hypText: "√2",
    });
    svg.appendChild(svgText(A.x + s / 2, A.y - s - 8, "Quadrat mit der Seite 1", { class: "tr-eckentext" }));
    svg.appendChild(svgText(B - 12, 60, "Pythagoras: 1² + 1² = 2,", { class: "tr-eckentext", "text-anchor": "end" }));
    svg.appendChild(svgText(B - 12, 76, "also ist die Diagonale √2 lang.", { class: "tr-eckentext", "text-anchor": "end" }));
  } else {
    svg.appendChild(svgText(B / 2, 16, "Das halbe gleichseitige Dreieck — daher kommen 30° und 60°", { class: "tr-titel" }));
    const h = s * Math.sqrt(3) / 2;
    const A = { x: 110, y: 250 };
    const M = { x: A.x + s / 2, y: A.y };
    const Q = { x: A.x + s, y: A.y };
    const R = { x: M.x, y: A.y - h };
    // Die gespiegelte Hälfte blass — das Ganze ist gleichseitig mit der Seite 2.
    svg.appendChild(svgEl("path", {
      d: `M ${M.x} ${M.y} L ${Q.x} ${Q.y} L ${R.x} ${R.y} Z`, class: "tr-dreieck blass",
    }));
    dreieckZeichnen(svg, A, s / 2, h, {
      winkelText: "60°", ecken: false,
      ankText: "1", gegText: "√3", hypText: "2",
    });
    svg.appendChild(svgText(R.x + 6, R.y - 8, "30°", { class: "tr-winkeltext", "text-anchor": "start" }));
    svg.appendChild(svgText(A.x - 6, A.y + 14, "A", { class: "tr-eckentext", "text-anchor": "end" }));
    svg.appendChild(svgText(M.x, M.y + 16, "M", { class: "tr-eckentext" }));
    svg.appendChild(svgText(Q.x + 6, Q.y + 14, "B", { class: "tr-eckentext", "text-anchor": "start" }));
    svg.appendChild(svgText(R.x, R.y - 22, "C", { class: "tr-eckentext" }));
    svg.appendChild(svgText(B - 12, 60, "Gleichseitig mit der Seite 2; die Höhe", { class: "tr-eckentext", "text-anchor": "end" }));
    svg.appendChild(svgText(B - 12, 76, "halbiert die Grundseite: 2² − 1² = 3.", { class: "tr-eckentext", "text-anchor": "end" }));
  }
  return svg;
}

function renderBesondere() {
  const w = bwWinkel;
  const e = BW_EXAKT[w];
  const s = sinG(w), c = cosG(w), t = tanG(w);

  document.getElementById("bw-gleichung").innerHTML =
    `sin <span class="wv">${w}°</span> = <span class="gv">${e.sin}</span> ≈ ${num(s, 4)} &nbsp;·&nbsp; ` +
    `cos <span class="wv">${w}°</span> = <span class="av">${e.cos}</span> ≈ ${num(c, 4)} &nbsp;·&nbsp; ` +
    `tan <span class="wv">${w}°</span> = <span class="rv">${e.tan}</span> ≈ ${num(t, 4)}`;

  const mount = document.getElementById("bw-mount");
  mount.innerHTML = "";
  mount.appendChild(bwBild(w));

  const schritte = [];
  if (w === 45) {
    schritte.push(schrittZeile("Ein Quadrat mit der Seite 1 wird längs der Diagonale halbiert.", "Grundfigur"));
    schritte.push(schrittZeile("Die beiden Winkel an der Diagonale sind gleich groß und ergeben zusammen 90° — also je <span class=\"wv\">45°</span>.",
      "Winkel bestimmen"));
    schritte.push(schrittZeile("Diagonale: 1² + 1² = 2, also <span class=\"hv\">c = √2</span>.", "Pythagoras"));
    schritte.push(schrittZeile("sin 45° = <span class=\"gv\">1 : √2</span> = <span class=\"gv\">√2 : 2</span> ≈ " + num(s, 4),
      "Nenner rational machen", "fertig", "Mit √2 erweitern: (1 · √2) : (√2 · √2) = √2 : 2."));
    schritte.push(schrittZeile("tan 45° = 1 : 1 = <span class=\"rv\">1</span>", "beide Katheten gleich lang", "fertig"));
  } else {
    schritte.push(schrittZeile("Ein gleichseitiges Dreieck mit der Seite 2 wird durch eine Höhe halbiert.", "Grundfigur"));
    schritte.push(schrittZeile("Die Höhe halbiert die Grundseite: die Ankathete misst <span class=\"av\">1</span>, die Hypotenuse <span class=\"hv\">2</span>.",
      "Seiten ablesen"));
    schritte.push(schrittZeile("Höhe: 2² − 1² = 3, also <span class=\"gv\">h = √3</span>.", "Pythagoras"));
    schritte.push(schrittZeile("Jeder Winkel im gleichseitigen Dreieck misst 60°; die Höhe halbiert den Winkel an der Spitze zu <span class=\"wv\">30°</span>.",
      "Winkel bestimmen"));
    schritte.push(schrittZeile(
      w === 60
        ? `sin 60° = <span class="gv">√3 : 2</span> ≈ ${num(s, 4)} &nbsp;·&nbsp; cos 60° = <span class="av">1 : 2</span> = 0,5`
        : `sin 30° = <span class="gv">1 : 2</span> = 0,5 &nbsp;·&nbsp; cos 30° = <span class="av">√3 : 2</span> ≈ ${num(c, 4)}`,
      "ablesen", "fertig",
      "Von der anderen Ecke aus gesehen tauschen Gegen- und Ankathete die Rollen — deshalb tauschen auch sin und cos."));
  }
  document.getElementById("bw-schritte").innerHTML = schritte.join("");

  document.getElementById("bw-tabelle").innerHTML =
    `<caption>Die Werte, die man kennen sollte — die markierte Spalte gehört zum Umschalter</caption>` +
    `<tr><th>α</th>` + [0, 30, 45, 60, 90].map((x) => `<td class="w${x === w ? " aktiv" : ""}">${x}°</td>`).join("") + `</tr>` +
    `<tr><th>sin α</th>` + [0, 30, 45, 60, 90].map((x) =>
      `<td class="s${x === w ? " aktiv" : ""}">${{ 0: "0", 30: "1 : 2", 45: "√2 : 2", 60: "√3 : 2", 90: "1" }[x]}</td>`).join("") + `</tr>` +
    `<tr><th>cos α</th>` + [0, 30, 45, 60, 90].map((x) =>
      `<td class="k${x === w ? " aktiv" : ""}">${{ 0: "1", 30: "√3 : 2", 45: "√2 : 2", 60: "1 : 2", 90: "0" }[x]}</td>`).join("") + `</tr>` +
    `<tr><th>tan α</th>` + [0, 30, 45, 60, 90].map((x) =>
      `<td class="t${x === w ? " aktiv" : ""}">${{ 0: "0", 30: "√3 : 3", 45: "1", 60: "√3", 90: "—" }[x]}</td>`).join("") + `</tr>`;

  document.getElementById("bw-bilanz").innerHTML =
    `<strong>Probe mit dem trigonometrischen Pythagoras:</strong> ` +
    `sin² ${w}° + cos² ${w}° = (${e.sin})² + (${e.cos})² = ` +
    `<span class="ww">${num(s * s, 4)} + ${num(c * c, 4)} = ${num(s * s + c * c, 4)}</span> ✓<br>` +
    `<strong>Und tan aus sin und cos:</strong> ` +
    `<span class="wr">tan ${w}° = sin ${w}° : cos ${w}° = ${num(s, 4)} : ${num(c, 4)} ${zeichen(t, 4)} ${num(t, 4)}</span>.<br>` +
    `Auffällig: <span class="wg">sin 30° = cos 60°</span> und <span class="wa">sin 60° = cos 30°</span>. ` +
    `Das ist kein Zufall — 30° und 60° sind die beiden spitzen Winkel <em>desselben</em> Dreiecks, und was von der einen Ecke aus ` +
    `Gegenkathete heißt, ist von der anderen aus Ankathete.`;
}

function initBesondere() {
  const schalter = document.getElementById("bw-schalter");
  [30, 45, 60].forEach((w) => {
    const btn = el("button", { type: "button" }, `${w}°`);
    btn.addEventListener("click", () => {
      bwWinkel = w;
      [...schalter.children].forEach((b) => b.classList.toggle("aktiv", b.textContent === `${w}°`));
      renderBesondere();
    });
    schalter.appendChild(btn);
  });
  schalter.children[1].classList.add("aktiv");
  renderBesondere();
}

// ================= 5. Sinus und Kosinus am Einheitskreis =================

function ekBild(alpha) {
  const B = 520, H = 322;
  const svg = neueFlaeche(B, H);
  svg.appendChild(svgText(116, 16, "Der Einheitskreis", { class: "tr-titel" }));
  svg.appendChild(svgText(391, 16, "Die Sinuskurve entsteht daraus", { class: "tr-titel" }));

  // ---- Einheitskreis ----
  const M = { x: 116, y: 172 }, r = 86;
  const kx = (t) => M.x + r * t, ky = (t) => M.y - r * t;
  svg.appendChild(svgEl("line", { x1: M.x - r - 16, y1: M.y, x2: M.x + r + 16, y2: M.y, class: "tr-achse" }));
  svg.appendChild(svgEl("line", { x1: M.x, y1: M.y + r + 16, x2: M.x, y2: M.y - r - 16, class: "tr-achse" }));
  svg.appendChild(svgEl("circle", { cx: M.x, cy: M.y, r, class: "tr-kreis" }));
  svg.appendChild(svgText(M.x + r + 4, M.y + 16, "1", { class: "tr-achsentext" }));
  svg.appendChild(svgText(M.x - 8, M.y - r + 2, "1", { class: "tr-achsentext", "text-anchor": "end" }));
  const s = sinG(alpha), c = cosG(alpha);
  const P = { x: kx(c), y: ky(s) };
  // Kosinus waagerecht, Sinus senkrecht — als Strecken, nicht als Zahlen.
  svg.appendChild(svgEl("line", { x1: M.x, y1: M.y, x2: P.x.toFixed(2), y2: M.y, class: "tr-kosinus" }));
  svg.appendChild(svgEl("line", { x1: P.x.toFixed(2), y1: M.y, x2: P.x.toFixed(2), y2: P.y.toFixed(2), class: "tr-sinus" }));
  svg.appendChild(svgEl("line", { x1: M.x, y1: M.y, x2: P.x.toFixed(2), y2: P.y.toFixed(2), class: "tr-radius" }));
  const bogenR = 28;
  if (alpha > 0) {
    svg.appendChild(svgEl("path", {
      d: `M ${M.x + bogenR} ${M.y} A ${bogenR} ${bogenR} 0 ${alpha > 180 ? 1 : 0} 0 ` +
         `${(M.x + bogenR * c).toFixed(2)} ${(M.y - bogenR * s).toFixed(2)}`,
      class: "tr-winkelbogen",
    }));
  }
  svg.appendChild(svgEl("circle", { cx: P.x.toFixed(2), cy: P.y.toFixed(2), r: 5, class: "tr-punkt wert" }));
  svg.appendChild(svgText(24, 36, `α = ${num(alpha)}°`, { class: "tr-winkeltext", "text-anchor": "start" }));
  // Die Koordinaten stehen als Bildunterschrift, nicht am Punkt: Neben dem
  // Punkt hätten sie je nach Winkel die Kurventafel oder die Achse getroffen.
  svg.appendChild(svgText(M.x, H - 8, `P(cos α | sin α) = P(${num(c, 2)} | ${num(s, 2)})`,
    { class: "tr-punkttext wert" }));

  // ---- Sinuskurve ----
  const lx = 284, breite = 206, my = 172, hoehe = 86;
  const px = (g) => lx + (g / 360) * breite;
  const py = (t) => my - t * hoehe;
  svg.appendChild(svgEl("line", { x1: lx - 8, y1: my, x2: lx + breite + 16, y2: my, class: "tr-achse" }));
  svg.appendChild(svgEl("line", { x1: lx, y1: my - hoehe - 14, x2: lx, y2: my + hoehe + 14, class: "tr-achse" }));
  for (const g of [90, 180, 270, 360]) {
    svg.appendChild(svgEl("line", { x1: px(g).toFixed(2), y1: py(1), x2: px(g).toFixed(2), y2: py(-1), class: "tr-gitter" }));
    svg.appendChild(svgText(px(g), my + hoehe + 14, g + "°", { class: "tr-achsentext" }));
  }
  svg.appendChild(svgText(lx - 6, py(1) + 4, "1", { class: "tr-achsentext", "text-anchor": "end" }));
  svg.appendChild(svgText(lx - 6, py(-1) + 4, "−1", { class: "tr-achsentext", "text-anchor": "end" }));
  const kurve = (f, klasse) => {
    let d = "";
    for (let g = 0; g <= 360; g += 2) d += `${d ? " L " : "M "}${px(g).toFixed(2)} ${py(f(g)).toFixed(2)}`;
    svg.appendChild(svgEl("path", { d, class: "tr-kurve " + klasse }));
  };
  kurve(cosG, "kosblass");
  kurve(sinG, "");
  svg.appendChild(svgText(lx + breite + 16, my - 8, "α", { class: "tr-achsenname", "text-anchor": "end" }));
  // Die Höhe des Punktes am Kreis ist die Höhe des Punktes auf der Kurve — das
  // ist die ganze Aussage des Bildes, deshalb die Verbindungslinie.
  svg.appendChild(svgEl("line", {
    x1: P.x.toFixed(2), y1: P.y.toFixed(2), x2: px(alpha).toFixed(2), y2: py(s).toFixed(2), class: "tr-hilfslinie",
  }));
  svg.appendChild(svgEl("circle", { cx: px(alpha).toFixed(2), cy: py(s).toFixed(2), r: 5, class: "tr-punkt wert" }));
  svg.appendChild(svgText(lx + breite / 2, H - 8, "grün: sin α · orange gestrichelt: cos α",
    { class: "tr-eckentext" }));
  return svg;
}

function renderEinheitskreis() {
  const alpha = Number(document.getElementById("ek-alpha").value);
  document.getElementById("ek-alpha-anzeige").textContent = num(alpha);
  const s = sinG(alpha), c = cosG(alpha);
  const tanDa = Math.abs(c) > 1e-12;
  const t = tanDa ? s / c : NaN;

  document.getElementById("ek-gleichung").innerHTML =
    `P(<span class="av">cos ${num(alpha)}°</span> | <span class="gv">sin ${num(alpha)}°</span>) = ` +
    `P(<span class="av">${num(c, 3)}</span> | <span class="gv">${num(s, 3)}</span>)`;

  const mount = document.getElementById("ek-mount");
  mount.innerHTML = "";
  mount.appendChild(ekBild(alpha));

  const quadrant = alpha === 0 || alpha === 360 ? "auf der positiven x-Achse"
    : alpha === 90 ? "auf der positiven y-Achse"
      : alpha === 180 ? "auf der negativen x-Achse"
        : alpha === 270 ? "auf der negativen y-Achse"
          : alpha < 90 ? "I" : alpha < 180 ? "II" : alpha < 270 ? "III" : "IV";

  const karten = document.getElementById("ek-karten");
  karten.innerHTML = "";
  karten.appendChild(karte("w", "Winkel α", num(alpha) + "°"));
  karten.appendChild(karte("g", "sin α (Höhe)", mitZeichen(s, 4)));
  karten.appendChild(karte("a", "cos α (Breite)", mitZeichen(c, 4)));
  karten.appendChild(karte("r", "tan α", tanDa ? mitZeichen(t, 4) : "nicht definiert"));
  karten.appendChild(karte("h", "Quadrant", quadrant.length > 3 ? quadrant : quadrant));

  // 180° − α liefert dieselbe Höhe, 360° − α dieselbe Breite.
  const spiegel = ((180 - alpha) % 360 + 360) % 360;
  const spiegel2 = (360 - alpha) % 360;
  document.getElementById("ek-bilanz").innerHTML =
    `<strong>Am Kreis abgelesen:</strong> Die <span class="wa">Breite</span> des Punktes ist cos α ${zeichen(c, 4)} ${num(c, 4)}, ` +
    `seine <span class="wg">Höhe</span> ist sin α ${zeichen(s, 4)} ${num(s, 4)}.<br>` +
    `<strong>Der trigonometrische Pythagoras gilt weiter:</strong> ` +
    `<span class="ww">${quadrat(s, 4)} + ${quadrat(c, 4)} = ${num(s * s + c * c, 4)}</span> — der Radius ist ja 1.<br>` +
    `<strong>Gleiche Höhe, anderer Winkel:</strong> <span class="wg">sin ${num(spiegel)}° ${zeichen(sinG(spiegel), 4)} ${num(sinG(spiegel), 4)}</span> ` +
    `stimmt mit sin ${num(alpha)}° überein, denn ${num(spiegel)}° = 180° − ${num(alpha)}°. ` +
    `<strong>Gleiche Breite:</strong> <span class="wa">cos ${num(spiegel2)}° ${zeichen(cosG(spiegel2), 4)} ${num(cosG(spiegel2), 4)}</span>, ` +
    `denn ${num(spiegel2)}° = 360° − ${num(alpha)}°.`;

  const text = document.getElementById("ek-text");
  if (alpha % 90 === 0) {
    text.innerHTML = `<span class="tr-urteil eins">α = ${num(alpha)}° — auf einer Achse</span> ` +
      `Der Punkt liegt ${quadrant.length > 3 ? quadrant : "im Quadranten " + quadrant}. ` +
      (tanDa ? `Hier ist eine Koordinate 0 — deshalb ist auch eine der beiden Zahlen sin α oder cos α genau 0.`
             : `Der Kosinus ist 0, und weil tan α = sin α : cos α gilt, ist der Tangens hier <strong>nicht definiert</strong>.`);
  } else if (alpha < 90) {
    text.innerHTML = `<span class="tr-urteil ja">Quadrant I: sin &gt; 0, cos &gt; 0</span> ` +
      `Nur hier gilt noch die alte Erklärung am rechtwinkligen Dreieck — der Punkt liegt rechts oben.`;
  } else if (alpha < 180) {
    text.innerHTML = `<span class="tr-urteil eins">Quadrant II: sin &gt; 0, cos &lt; 0</span> ` +
      `Die Höhe ist noch positiv, die Breite schon negativ. Im Dreieck gäbe es dafür keine Entsprechung — der Kreis kann mehr.`;
  } else if (alpha < 270) {
    text.innerHTML = `<span class="tr-urteil nein">Quadrant III: sin &lt; 0, cos &lt; 0</span> ` +
      `Der Punkt liegt links unten, beide Werte sind negativ.`;
  } else {
    text.innerHTML = `<span class="tr-urteil eins">Quadrant IV: sin &lt; 0, cos &gt; 0</span> ` +
      `Die Breite ist wieder positiv, die Höhe noch negativ.`;
  }
}

function initEinheitskreis() {
  document.getElementById("ek-alpha").addEventListener("input", renderEinheitskreis);
  renderEinheitskreis();
}

// ================= 6. Höhen, Entfernungen und Steigungen =================

const AW_AUGE = 1.6;   // Augenhöhe in Metern

function awBild(d, alpha) {
  const B = 490, H = 330;
  const svg = neueFlaeche(B, H);
  svg.appendChild(svgText(B / 2, 16, "Höhenwinkel messen — die Augenhöhe gehört dazu", { class: "tr-titel" }));
  const h1 = d * tanG(alpha), h = h1 + AW_AUGE;
  const boden = 296, links = 52, breite = 340, hoehe = 232;
  // Maßstab: Das Bild muss bei jeder Reglerstellung vollständig hineinpassen.
  const skala = Math.min(breite / d, hoehe / h);
  const augeY = boden - AW_AUGE * skala;
  const turmX = links + d * skala;
  const spitzeY = boden - h * skala;

  svg.appendChild(svgEl("line", { x1: links - 30, y1: boden, x2: turmX + 40, y2: boden, class: "tr-achse" }));
  // Turm
  svg.appendChild(svgEl("rect", {
    x: (turmX - 13).toFixed(2), y: spitzeY.toFixed(2), width: 26, height: (boden - spitzeY).toFixed(2),
    class: "tr-dreieck",
  }));
  // Beobachterin: Augenhöhe als kurze senkrechte Strecke
  svg.appendChild(svgEl("line", { x1: links, y1: boden, x2: links, y2: augeY.toFixed(2), class: "tr-seite ank" }));
  svg.appendChild(svgEl("circle", { cx: links, cy: augeY.toFixed(2), r: 4, class: "tr-punkt marke" }));
  // Waagerechte Sichtlinie und Sichtstrahl zur Spitze
  svg.appendChild(svgEl("line", { x1: links, y1: augeY.toFixed(2), x2: turmX.toFixed(2), y2: augeY.toFixed(2), class: "tr-seite ank" }));
  svg.appendChild(svgEl("line", { x1: links, y1: augeY.toFixed(2), x2: turmX.toFixed(2), y2: spitzeY.toFixed(2), class: "tr-seite hyp" }));
  svg.appendChild(svgEl("line", { x1: turmX.toFixed(2), y1: augeY.toFixed(2), x2: turmX.toFixed(2), y2: spitzeY.toFixed(2), class: "tr-seite geg" }));
  // Rechter Winkel am Turm, auf Augenhöhe
  svg.appendChild(svgEl("path", {
    d: `M ${(turmX - 12).toFixed(2)} ${augeY.toFixed(2)} L ${(turmX - 12).toFixed(2)} ${(augeY - 12).toFixed(2)} L ${turmX.toFixed(2)} ${(augeY - 12).toFixed(2)}`,
    class: "tr-rechterwinkel",
  }));
  const r = 34, phi = Math.atan2(augeY - spitzeY, turmX - links);
  svg.appendChild(svgEl("path", {
    d: `M ${links + r} ${augeY.toFixed(2)} A ${r} ${r} 0 0 0 ${(links + r * Math.cos(phi)).toFixed(2)} ${(augeY - r * Math.sin(phi)).toFixed(2)}`,
    class: "tr-winkelbogen",
  }));
  svg.appendChild(svgText(links + r + 8, augeY - 8, `α = ${num(alpha)}°`, { class: "tr-winkeltext", "text-anchor": "start" }));
  // Über der Sichtlinie, nicht darunter: Unter ihr liegt der Erdboden.
  svg.appendChild(svgText((links + turmX) / 2, augeY - 7, `d = ${num(d)} m`, { class: "tr-seitentext ank" }));
  svg.appendChild(svgText(turmX + 19, (augeY + spitzeY) / 2 + 4, `${num(h1, 2)} m`, { class: "tr-seitentext geg", "text-anchor": "start" }));
  svg.appendChild(svgText(links - 8, (boden + augeY) / 2 + 4, "1,60 m", { class: "tr-seitentext ank", "text-anchor": "end" }));
  svg.appendChild(svgText(turmX + 19, spitzeY - 8, `Turm: ${num(h, 2)} m`, { class: "tr-seitentext gesucht", "text-anchor": "start" }));
  return svg;
}

function renderAnwendungen() {
  const d = Number(document.getElementById("aw-d").value);
  const alpha = Number(document.getElementById("aw-alpha").value);
  document.getElementById("aw-d-anzeige").textContent = num(d);
  document.getElementById("aw-alpha-anzeige").textContent = num(alpha);
  const h1 = d * tanG(alpha), h = h1 + AW_AUGE;

  document.getElementById("aw-aufgabe").innerHTML =
    `<strong>Aufgabe:</strong> Du stehst <span class="wert farbe-orange">${num(d)} m</span> vom Fuß eines Turms entfernt und ` +
    `misst die Spitze in <span class="wert farbe-violett">${num(alpha)}°</span> über der Waagerechten — ` +
    `mit einem Gerät in <strong>1,60 m</strong> Augenhöhe. Wie hoch ist der Turm?`;

  const mount = document.getElementById("aw-mount");
  mount.innerHTML = "";
  mount.appendChild(awBild(d, alpha));

  document.getElementById("aw-schritte").innerHTML = [
    schrittZeile(`Der rechte Winkel liegt am Turm, auf Augenhöhe. Vom Winkel α aus ist ` +
      `<span class="av">d = ${num(d)} m</span> die Ankathete und die gesuchte Höhe <span class="gv">h₁</span> die Gegenkathete.`,
      "Skizze lesen"),
    schrittZeile(`tan α = <span class="gv">h₁</span> : <span class="av">d</span>`, "Formel wählen"),
    schrittZeile(`<span class="gv">h₁</span> = <span class="av">${num(d)} m</span> · tan ${num(alpha)}° = ${num(d)} m · ${num(tanG(alpha), 4)} ` +
      `<span class="gv">≈ ${num(h1, 2)} m</span>`, "einsetzen"),
    schrittZeile(`h = <span class="gv">${num(h1, 2)} m</span> + <span class="av">1,60 m</span> <span class="rv">≈ ${num(h, 2)} m</span>`,
      "Augenhöhe addieren", "fertig", "Dieser Schritt wird am häufigsten vergessen."),
  ].join("");

  const karten = document.getElementById("aw-karten");
  karten.innerHTML = "";
  karten.appendChild(karte("a", "Abstand d", num(d) + " m"));
  karten.appendChild(karte("w", "Höhenwinkel α", num(alpha) + "°"));
  karten.appendChild(karte("g", "über Augenhöhe", mitZeichen(h1, 2) + " m"));
  karten.appendChild(karte("r", "Turmhöhe h", mitZeichen(h, 2) + " m"));
  karten.appendChild(karte("h", "Neigung der Sichtlinie", mitZeichen(tanG(alpha) * 100, 1) + " %"));

  document.getElementById("aw-bilanz").innerHTML =
    `<span class="wr">Der Turm ist etwa ${num(h, 1)} m hoch.</span><br>` +
    `<strong>Ohne die Augenhöhe</strong> käme nur <span class="wg">${num(h1, 2)} m</span> heraus — ` +
    `<span class="wa">1,60 m</span> zu wenig. Bei einem kurzen Abstand fällt das kaum auf, bei einer Kirchturmmessung schon.<br>` +
    `<strong>Die Sichtlinie</strong> ist <span class="wh">${num(Math.hypot(d, h1), 2)} m</span> lang (Pythagoras) und steigt um ` +
    `<span class="ww">${num(tanG(alpha) * 100, 1)} %</span>. Eine Straße mit dieser Steigung wäre ` +
    (tanG(alpha) * 100 > 20 ? "unfahrbar steil — Alpenpässe haben selten mehr als 12 %."
      : tanG(alpha) * 100 > 12 ? "extrem steil; 12 % gelten schon als sehr viel."
        : "eine sehr steile, aber befahrbare Straße.") +
    `<br><strong>Faustkontrolle:</strong> Bei 45° wäre die Höhe über Augenhöhe genau so groß wie der Abstand, also ${num(d)} m. ` +
    `Hier sind es ${alpha < 45 ? "weniger" : alpha > 45 ? "mehr" : "genau so viel"} — das passt zu α = ${num(alpha)}°.`;
}

function initAnwendungen() {
  document.getElementById("aw-d").addEventListener("input", renderAnwendungen);
  document.getElementById("aw-alpha").addEventListener("input", renderAnwendungen);
  renderAnwendungen();
}

// ================= 7. Gestaffelte Übungsaufgaben =================

// Die Werkbank für die Übungsaufgaben ist für alle Grundwissen-Seiten dieselbe und steht in
// ../../aufgaben.js. Mitgegeben wird nur, wie DIESE Seite eine Eingabe als Zahl liest.
const mountUebungsaufgaben = (container, defs) =>
  mountUebungsaufgabenBasis(container, defs, { parse: parseFlexibleNumber });

// ---------- Aufgaben-Definitionen ----------

function ohneKollision(kandidaten, werte, notfall, eps = 1e-9) {
  const sauber = kandidaten.filter((kk) => {
    const alle = werte(kk);
    return alle.every((x, i) => alle.every((y, j) => i === j || Math.abs(x - y) > eps));
  });
  if (sauber.length < 2 && kandidaten.length > 20) {
    throw new Error("Kollisionsprüfung lässt von " + kandidaten.length + " Kandidaten nur " +
      sauber.length + " übrig — vermutlich steht ein Wert doppelt in der Liste");
  }
  const gewaehlt = sauber.length ? pick(sauber) : notfall;
  if (gewaehlt === undefined) throw new Error("Aufgabengenerator ohne gültige Kandidaten");
  return gewaehlt;
}

// Dasselbe für Aufgaben mit mehreren Eingabefeldern: Kollidieren müssen die
// Werte nur innerhalb eines Feldes, denn nur dort entscheidet die Zahl darüber,
// welcher Hinweis erscheint. Zwischen zwei Feldern darf dieselbe Zahl stehen.
// NaN bedeutet "an dieser Stelle springt kein Hinweis an" und wird übergangen.
// eps darf eine Zahl oder eine Liste sein — ein Feld, das auf ganze Grad
// gerundet wird, braucht einen anderen Mindestabstand als eines mit drei
// Nachkommastellen.
function ohneFeldKollision(kandidaten, gruppen, eps = 1e-9) {
  const sauber = kandidaten.filter((kk) => gruppen(kk).every((g, gi) => {
    const e = Array.isArray(eps) ? eps[gi] : eps;
    const echt = g.filter((x) => Number.isFinite(x));
    return echt.every((x, i) => echt.every((y, j) => i === j || Math.abs(x - y) > e));
  }));
  if (!sauber.length) throw new Error("Aufgabengenerator ohne gültige Kandidaten");
  return pick(sauber);
}

// Auf eine feste Stellenzahl gerundet — als Zahl, nicht als Text: Genau dieser
// Wert steht dann im Lösungsfeld, und die Toleranz kann eng bleiben.
function rund(x, stellen) {
  const f = Math.pow(10, stellen);
  return Math.round(x * f) / f;
}

// Aufgabe 1 — aus Hypotenuse und Seitenverhältnis eine Kathete. Die Zahlen sind
// so gewählt, dass das Ergebnis ganzzahlig ist; hier soll niemand am Runden
// scheitern, sondern nur die richtige Formel finden.
const A1_KANDIDATEN = (() => {
  const liste = [];
  for (const fkt of ["sin", "cos"]) {
    for (const v of [0.25, 0.4, 0.5, 0.6, 0.75, 0.8]) {
      for (const c of [20, 40, 60, 80]) liste.push({ fkt, v, c });
    }
  }
  return liste;
})();

function generateAufgabe1() {
  const k = ohneKollision(
    A1_KANDIDATEN,
    (x) => [x.c * x.v, x.c / x.v, Math.sqrt(x.c * x.c - Math.pow(x.c * x.v, 2))],
    A1_KANDIDATEN[0],
  );
  const { fkt, v, c } = k;
  const wert = c * v;
  const seite = fkt === "sin" ? "Gegenkathete a" : "Ankathete b";
  const andere = Math.sqrt(c * c - wert * wert);
  return {
    promptHtml: `In einem rechtwinkligen Dreieck ist die <strong>Hypotenuse c = ${num(c)} cm</strong>,<br>` +
      `und für den Winkel α gilt <strong>${fkt} α = ${num(v, 2)}</strong>.<br>` +
      `Wie lang ist die <strong>${seite}</strong> in cm?`,
    correct: wert,
    tolerance: 0.01,
    placeholder: "Länge in cm",
    hinweis: (raw, val) => {
      if (Math.abs(val - c / v) < 0.01) return `Hier wurde geteilt statt multipliziert. In ${fkt} α = ${fkt === "sin" ? "a" : "b"} : c steht die gesuchte Seite im <em>Zähler</em> — also wird die Gleichung mit c multipliziert.`;
      if (Math.abs(val - andere) < 0.01) return `Das ist die <em>andere</em> Kathete. Gesucht war die ${seite}; sie gehört zu ${fkt} α, nicht zu ${fkt === "sin" ? "cos" : "sin"} α.`;
      return `${fkt} α = ${fkt === "sin" ? "a" : "b"} : c, also ${fkt === "sin" ? "a" : "b"} = c · ${fkt} α.`;
    },
    tipps: [
      `Der ${fkt === "sin" ? "Sinus" : "Kosinus"} vergleicht die ${fkt === "sin" ? "Gegenkathete" : "Ankathete"} mit der Hypotenuse: ${fkt} α = ${fkt === "sin" ? "a" : "b"} : c.`,
      `Die gesuchte Seite steht im Zähler. Multipliziere die Gleichung deshalb mit c: ${fkt === "sin" ? "a" : "b"} = c · ${fkt} α.`,
      `Einsetzen: ${num(c)} cm · ${num(v, 2)}. Zur Kontrolle: Eine Kathete ist immer kürzer als die Hypotenuse.`,
    ],
    musterloesungHtml:
      `<strong>Formel:</strong> ${fkt} α = ${fkt === "sin" ? "Gegenkathete : Hypotenuse" : "Ankathete : Hypotenuse"} = ${fkt === "sin" ? "a" : "b"} : c<br>` +
      `<strong>Umstellen:</strong> ${fkt === "sin" ? "a" : "b"} = c · ${fkt} α<br>` +
      `<strong>Einsetzen:</strong> ${fkt === "sin" ? "a" : "b"} = ${num(c)} cm · ${num(v, 2)} = <strong>${num(wert)} cm</strong><br>` +
      `<em>Kontrolle:</em> Die Kathete muss kürzer sein als die Hypotenuse — ${num(wert)} cm &lt; ${num(c)} cm ✓. ` +
      `Die andere Kathete misst √(${num(c)}² − ${num(wert)}²) ≈ ${num(andere, 2)} cm.`,
  };
}

// Aufgabe 2 — die exakten Werte für 30°, 45° und 60°. Abschnitt 4 hatte keine
// Aufgabe; hier werden die drei Werte nicht abgefragt, sondern gebraucht.
const A2_WINKEL = {
  30: { sin: "1 : 2", cos: "√3 : 2", dreieck: "das halbe gleichseitige Dreieck", ausDem: "dem halben gleichseitigen Dreieck" },
  45: { sin: "√2 : 2", cos: "√2 : 2", dreieck: "das halbe Quadrat", ausDem: "dem halben Quadrat" },
  60: { sin: "√3 : 2", cos: "1 : 2", dreieck: "das halbe gleichseitige Dreieck", ausDem: "dem halben gleichseitigen Dreieck" },
};
const A2_KANDIDATEN = (() => {
  const liste = [];
  for (const alpha of [30, 45, 60]) {
    // Gerade Hypotenusen, damit bei 30° und 60° eine der Katheten glatt aufgeht.
    for (let c = 6; c <= 48; c += 2) liste.push({ alpha, c });
  }
  return liste;
})();

function generateAufgabe2() {
  const k = ohneFeldKollision(A2_KANDIDATEN, (v) => {
    const s = sinG(v.alpha), co = cosG(v.alpha);
    return [
      // Feld 1: sin α. Bei 45° ist cos α derselbe Wert und trägt keinen Hinweis.
      [rund(s, 3), v.alpha === 45 ? NaN : rund(co, 3), rund(tanG(v.alpha), 3)],
      // Feld 2: die Gegenkathete. Bei 45° sind beide Katheten gleich lang; dann
      // ist "vertauscht" kein Fehler und liegt auch kein Hinweis darauf.
      [rund(v.c * s, 1), v.alpha === 45 ? NaN : rund(v.c * co, 1), v.c, rund(v.c / s, 1)],
      // Feld 3: die Ankathete.
      [rund(v.c * co, 1), v.alpha === 45 ? NaN : rund(v.c * s, 1), v.c, rund(v.c / co, 1)],
    ];
  }, [0.0012, 0.13, 0.13]);
  const { alpha, c } = k;
  const s = sinG(alpha), co = cosG(alpha);
  const a = rund(c * s, 1), b = rund(c * co, 1);
  const w = A2_WINKEL[alpha];
  return {
    promptHtml: `In einem rechtwinkligen Dreieck ist die <strong>Hypotenuse c = ${num(c)} cm</strong> ` +
      `und der Winkel <strong>α = ${num(alpha)}°</strong>.<br>` +
      `<em>Die drei Werte für 30°, 45° und 60° stehen in Abschnitt 4 — hier brauchst du keinen Taschenrechner für sin α.</em>`,
    felder: [
      {
        name: `sin ${num(alpha)}° (auf 3 Stellen)`, soll: rund(s, 3), toleranz: 0.0006, platzhalter: "z. B. 0,500",
        hinweis: (roh, val) => {
          if (Math.abs(val - rund(co, 3)) < 0.0006) return `${num(rund(co, 3), 3)} ist cos ${num(alpha)}° = ${w.cos}. Gefragt war der Sinus: sin ${num(alpha)}° = ${w.sin}.`;
          if (Math.abs(val - rund(tanG(alpha), 3)) < 0.0006) return `Das ist tan ${num(alpha)}°. Der Sinus ist sin ${num(alpha)}° = ${w.sin}.`;
          if (!isNaN(val) && (val > 1 || val < 0)) return "Sinus und Kosinus eines spitzen Winkels liegen immer zwischen 0 und 1 — sie sind Verhältnisse einer Kathete zur längeren Hypotenuse.";
          return `sin ${num(alpha)}° = ${w.sin}. Rechne den Bruch aus und runde auf drei Stellen.`;
        },
      },
      {
        name: "Gegenkathete a (auf 1 Stelle, in cm)", soll: a, einheit: "cm", toleranz: 0.06, platzhalter: "a in cm",
        hinweis: (roh, val) => {
          if (Math.abs(val - b) < 0.06) return `${num(b, 1)} cm ist die <em>Ankathete</em> b — sie gehört zum Kosinus. Zur Gegenkathete gehört der Sinus.`;
          if (Math.abs(val - c) < 0.06) return `${num(c)} cm ist die Hypotenuse. Eine Kathete ist immer kürzer.`;
          if (Math.abs(val - rund(c / s, 1)) < 0.06) return `Hier wurde geteilt statt multipliziert. Aus sin α = a : c folgt a = c · sin α.`;
          return `sin α = a : c, also a = c · sin α = ${num(c)} cm · ${num(rund(s, 3), 3)}.`;
        },
      },
      {
        name: "Ankathete b (auf 1 Stelle, in cm)", soll: b, einheit: "cm", toleranz: 0.06, platzhalter: "b in cm",
        hinweis: (roh, val) => {
          if (Math.abs(val - a) < 0.06) return `${num(a, 1)} cm ist die Gegenkathete a. Die Ankathete gehört zum Kosinus: b = c · cos α.`;
          if (Math.abs(val - c) < 0.06) return `${num(c)} cm ist die Hypotenuse.`;
          if (Math.abs(val - rund(c / co, 1)) < 0.06) return `Hier wurde geteilt statt multipliziert. Aus cos α = b : c folgt b = c · cos α.`;
          return `cos ${num(alpha)}° = ${w.cos}, und b = c · cos α.`;
        },
      },
    ],
    tipps: [
      `Die Werte für ${num(alpha)}° kommen aus ${w.dreieck} — man muss sie nicht auswendig können, aber nachschlagen sollte man sie: sin ${num(alpha)}° = ${w.sin}, cos ${num(alpha)}° = ${w.cos}.`,
      "Vom Winkel α aus gehört die <strong>Gegenkathete</strong> zum Sinus und die <strong>Ankathete</strong> zum Kosinus — beide jeweils geteilt durch die Hypotenuse.",
      `Beide Seiten stehen im Zähler, also wird jeweils mit der Hypotenuse multipliziert: a = ${num(c)} cm · sin α und b = ${num(c)} cm · cos α.`,
    ],
    musterloesungHtml:
      `<strong>1. Exakter Wert:</strong> sin ${num(alpha)}° = ${w.sin} ${zeichen(s, 3)} <strong>${num(rund(s, 3), 3)}</strong> ` +
      `(aus ${w.ausDem})<br>` +
      `<strong>2. Gegenkathete:</strong> sin α = a : c ⇒ a = c · sin α = ${num(c)} cm · ${w.sin} ${zeichen(c * s, 1)} <strong>${num(a, 1)} cm</strong><br>` +
      `<strong>3. Ankathete:</strong> cos ${num(alpha)}° = ${w.cos}, also b = ${num(c)} cm · ${w.cos} ${zeichen(c * co, 1)} <strong>${num(b, 1)} cm</strong><br>` +
      `<em>Probe mit Pythagoras:</em> ${num(a, 1)}² + ${num(b, 1)}² ≈ ${num(rund(a * a + b * b, 1), 1)} ≈ ${num(c * c)} = c² ✓<br>` +
      `<span class="progress-note">Auch der trigonometrische Pythagoras geht auf: ` +
      `sin² ${num(alpha)}° + cos² ${num(alpha)}° = ${num(rund(s * s, 3), 3)} + ${num(rund(co * co, 3), 3)} = 1. ` +
      `${alpha === 45 ? "Bei 45° sind beide Katheten gleich lang — das Dreieck ist gleichschenklig." : `Die ${a < b ? "Gegenkathete" : "Ankathete"} ist hier die kürzere Seite, denn ${num(alpha)}° ist ${alpha < 45 ? "kleiner" : "größer"} als 45°.`}</span>`,
  };
}

// Aufgabe 3 — eine Seite aus Winkel und Seite, auf eine Stelle gerundet.
const A3_KANDIDATEN = (() => {
  const liste = [];
  for (const paar of Object.keys(SB_WEGE)) {
    for (let alpha = 15; alpha <= 75; alpha += 5) {
      for (let laenge = 6; laenge <= 18; laenge += 2) liste.push({ paar, alpha, laenge });
    }
  }
  return liste;
})();

function a3Werte(v) {
  const [gegeben, gesucht] = v.paar.split(">");
  const weg = SB_WEGE[v.paar];
  const c = gegeben === "hyp" ? v.laenge
    : gegeben === "geg" ? v.laenge / sinG(v.alpha)
      : v.laenge / cosG(v.alpha);
  const richtig = sbWert(gesucht, v.alpha, c);
  const fw = { sin: sinG(v.alpha), cos: cosG(v.alpha), tan: tanG(v.alpha) }[weg.fkt];
  // Zwei klassische Fehler: die Rechenart vertauschen und die falsche Funktion.
  const umgekehrt = weg.mal ? v.laenge / fw : v.laenge * fw;
  const andereFkt = { sin: cosG(v.alpha), cos: sinG(v.alpha), tan: 1 / tanG(v.alpha) }[weg.fkt];
  const falscheFkt = weg.mal ? v.laenge * andereFkt : v.laenge / andereFkt;
  return { gegeben, gesucht, weg, c, richtig, fw, umgekehrt, falscheFkt };
}

function generateAufgabe3() {
  const k = ohneKollision(
    A3_KANDIDATEN,
    (v) => { const r = a3Werte(v); return [r.richtig, r.umgekehrt, r.falscheFkt]; },
    A3_KANDIDATEN[0],
    0.06,
  );
  const r = a3Werte(k);
  const gerundet = Math.round(r.richtig * 10) / 10;
  return {
    promptHtml: `Gegeben: <strong>α = ${num(k.alpha)}°</strong> und ${SB_NAMEN[r.gegeben]} = <strong>${num(k.laenge)} cm</strong>.<br>` +
      `Wie lang ist die <strong>${SB_NAMEN[r.gesucht]}</strong>?<br>` +
      `<em>Runde auf eine Stelle nach dem Komma (in cm).</em>`,
    correct: gerundet,
    tolerance: 0.06,
    placeholder: "Länge in cm",
    hinweis: (raw, val) => {
      if (Math.abs(val - r.umgekehrt) < 0.06) return r.weg.mal
        ? `Hier wurde geteilt statt multipliziert. Die gesuchte Seite steht in „${r.weg.formel}“ im Zähler — dann wird mit ${r.weg.fkt} α <em>multipliziert</em>.`
        : `Hier wurde multipliziert statt geteilt. Die gesuchte Seite steht in „${r.weg.formel}“ im Nenner — dann wird durch ${r.weg.fkt} α <em>dividiert</em>.`;
      if (Math.abs(val - r.falscheFkt) < 0.06) return `Das ist die falsche Winkelfunktion. Benenne erst die Seiten vom Winkel α aus: Gegeben ist die ${SB_NAMEN[r.gegeben].split(" ")[0]}, gesucht die ${SB_NAMEN[r.gesucht].split(" ")[0]} — beide kommen nur in „${r.weg.formel}“ vor.`;
      return `Passende Formel: <strong>${r.weg.formel}</strong>. Setze ein, was du kennst, und stelle nach der gesuchten Seite um.`;
    },
    tipps: [
      `Benenne zuerst die Seiten <em>vom Winkel α aus</em>: Gegeben ist die ${SB_NAMEN[r.gegeben].split(" ")[0]}, gesucht die ${SB_NAMEN[r.gesucht].split(" ")[0]}.`,
      `Genau diese beiden Seiten kommen in einer einzigen Formel vor: <strong>${r.weg.formel}</strong>.`,
      `Stelle nach der gesuchten Seite um: ${SB_KURZ[r.gesucht]} = ${SB_KURZ[r.gegeben]} ${r.weg.mal ? "·" : ":"} ${r.weg.fkt} α. Steht sie im Zähler, wird multipliziert; steht sie im Nenner, wird geteilt.`,
    ],
    musterloesungHtml:
      `<strong>Benennen:</strong> Vom Winkel α aus ist ${SB_KURZ[r.gegeben]} die ${SB_NAMEN[r.gegeben].split(" ")[0]} und ${SB_KURZ[r.gesucht]} die ${SB_NAMEN[r.gesucht].split(" ")[0]}.<br>` +
      `<strong>Formel:</strong> ${r.weg.formel} — hier kommen genau diese beiden Seiten vor.<br>` +
      `<strong>Umstellen:</strong> ${SB_KURZ[r.gesucht]} = ${SB_KURZ[r.gegeben]} ${r.weg.mal ? "·" : ":"} ${r.weg.fkt} α<br>` +
      `<strong>Einsetzen:</strong> ${SB_KURZ[r.gesucht]} = ${num(k.laenge)} cm ${r.weg.mal ? "·" : ":"} ${num(r.fw, 4)} ≈ ${num(r.richtig, 3)} cm<br>` +
      `<em>Gerundet:</em> <strong>${num(gerundet, 1)} cm</strong>. ` +
      `Zur Kontrolle: Die Hypotenuse ist mit ${num(r.c, 2)} cm die längste Seite ✓`,
  };
}

// Aufgabe 4 — der Einheitskreis. Abschnitt 5 hatte keine Aufgabe; der Kern ist,
// dass zu jedem Sinuswert zwischen 0° und 180° zwei Winkel gehören und der
// Taschenrechner nur einen davon nennt.
const A4_KANDIDATEN = (() => {
  const liste = [];
  for (let phi = 10; phi <= 170; phi++) {
    if (phi === 90) continue;               // dort wäre der Partnerwinkel er selbst
    liste.push({ phi, partner: 180 - phi });
  }
  return liste;
})();

function generateAufgabe4() {
  const k = ohneFeldKollision(A4_KANDIDATEN, (v) => {
    const x = rund(cosG(v.phi), 3), y = rund(sinG(v.phi), 3);
    return [
      // Feld 1: die x-Koordinate.
      [x, y, -x],
      // Feld 2: die y-Koordinate.
      [y, x, -y],
      // Feld 3: der zweite Winkel mit demselben Sinus.
      [v.partner, v.phi, 360 - v.phi, -v.phi],
    ];
  }, [0.0012, 0.0012, 1.2]);
  const { phi, partner } = k;
  const x = rund(cosG(phi), 3), y = rund(sinG(phi), 3);
  const stumpf = phi > 90;
  return {
    promptHtml: `Am Einheitskreis wird der Winkel <strong>φ = ${num(phi)}°</strong> von der positiven x-Achse aus ` +
      `gegen den Uhrzeigersinn abgetragen. Der zugehörige Punkt ist <strong>P(cos φ | sin φ)</strong>.`,
    felder: [
      {
        name: "x-Koordinate von P (auf 3 Stellen)", soll: x, toleranz: 0.0006, platzhalter: "x",
        hinweis: (roh, val) => {
          if (Math.abs(val - y) < 0.0006) return `${num(y, 3)} ist die y-Koordinate — das ist der Sinus. Waagerecht misst man den <strong>Kosinus</strong>.`;
          if (Math.abs(val + x) < 0.0006) return stumpf
            ? `Das Vorzeichen stimmt nicht: ${num(phi)}° ist <strong>stumpf</strong>, der Punkt liegt links von der y-Achse — dort ist die x-Koordinate negativ.`
            : `Das Vorzeichen stimmt nicht: ${num(phi)}° ist <strong>spitz</strong>, der Punkt liegt rechts von der y-Achse — dort ist die x-Koordinate positiv.`;
          if (!isNaN(val) && Math.abs(val) > 1) return "Der Kreis hat den Radius 1, also liegen beide Koordinaten zwischen −1 und 1.";
          return `Die x-Koordinate ist cos ${num(phi)}°.`;
        },
      },
      {
        name: "y-Koordinate von P (auf 3 Stellen)", soll: y, toleranz: 0.0006, platzhalter: "y",
        hinweis: (roh, val) => {
          if (Math.abs(val - x) < 0.0006) return `${num(x, 3)} ist die x-Koordinate — das ist der Kosinus. Senkrecht misst man den <strong>Sinus</strong>.`;
          if (Math.abs(val + y) < 0.0006) return `Zwischen 0° und 180° liegt der Punkt immer <em>oberhalb</em> der x-Achse; der Sinus ist dort positiv.`;
          if (!isNaN(val) && Math.abs(val) > 1) return "Der Kreis hat den Radius 1, also liegen beide Koordinaten zwischen −1 und 1.";
          return `Die y-Koordinate ist sin ${num(phi)}°.`;
        },
      },
      {
        name: "zweiter Winkel zwischen 0° und 180° mit demselben Sinus",
        soll: partner, einheit: "°", toleranz: 0.6, platzhalter: "Winkel in Grad",
        hinweis: (roh, val) => {
          if (Math.abs(val - phi) < 0.6) return `Das ist der gegebene Winkel selbst. Gesucht ist der <em>andere</em>, der genauso hoch liegt.`;
          if (Math.abs(val - (360 - phi)) < 0.6) return `${num(360 - phi)}° liegt gleich <em>weit rechts</em>, aber gespiegelt an der x-Achse — dort ist der Sinus das Gegenteil. Gespiegelt wird an der <strong>y-Achse</strong>: 180° − φ.`;
          if (Math.abs(val + phi) < 0.6) return "Negative Winkel liegen unterhalb der x-Achse. Gesucht ist ein Winkel zwischen 0° und 180°.";
          return "Zwei Punkte des Einheitskreises liegen gleich hoch: der bei φ und sein Spiegelbild an der y-Achse bei 180° − φ.";
        },
      },
    ],
    tipps: [
      "Am Einheitskreis ist die <strong>waagerechte</strong> Koordinate der Kosinus und die <strong>senkrechte</strong> der Sinus — genau so herum wie in P(cos φ | sin φ).",
      stumpf
        ? `${num(phi)}° ist stumpf: Der Punkt liegt im zweiten Viertel, also links oben. Dort ist x negativ und y positiv.`
        : `${num(phi)}° ist spitz: Der Punkt liegt im ersten Viertel, also rechts oben. Dort sind beide Koordinaten positiv.`,
      "Zwei Punkte liegen gleich hoch: φ und sein Spiegelbild an der y-Achse. Das Spiegelbild gehört zum Winkel 180° − φ.",
    ],
    musterloesungHtml:
      `<strong>1. Lage:</strong> ${num(phi)}° liegt im ${stumpf ? "zweiten" : "ersten"} Viertel, also ${stumpf ? "links" : "rechts"} oben ⇒ ` +
      `x ist ${stumpf ? "negativ" : "positiv"}, y ist positiv<br>` +
      `<strong>2. Koordinaten:</strong> x = cos ${num(phi)}° ≈ <strong>${num(x, 3)}</strong>, y = sin ${num(phi)}° ≈ <strong>${num(y, 3)}</strong><br>` +
      `<strong>3. Gleicher Sinus:</strong> Das Spiegelbild an der y-Achse hat dieselbe Höhe ⇒ 180° − ${num(phi)}° = <strong>${num(partner)}°</strong><br>` +
      `<em>Probe:</em> sin ${num(partner)}° ≈ ${num(rund(sinG(partner), 3), 3)} = sin ${num(phi)}° ✓, ` +
      `aber cos ${num(partner)}° ≈ ${num(rund(cosG(partner), 3), 3)} — der Kosinus kippt das Vorzeichen.<br>` +
      `<em>Und der trigonometrische Pythagoras:</em> ${num(x, 3)}² + ${num(y, 3)}² ≈ ${num(rund(x * x + y * y, 3), 3)} — ` +
      `das ist 1, bis auf die Rundung der beiden Koordinaten. P liegt auf dem Kreis mit Radius 1.<br>` +
      `<span class="progress-note">Der Taschenrechner nennt bei sin<sup>−1</sup>(${num(y, 3)}) nur den spitzen Winkel ` +
      `${num(Math.min(phi, partner))}°; die zweite Lösung ${num(Math.max(phi, partner))}° muss man selbst dazunehmen. ` +
      `Im rechtwinkligen Dreieck ist das nicht nötig — dort ist jeder Winkel kleiner als 90°.</span>`,
  };
}

// Aufgabe 5 — den Winkel aus zwei Katheten, auf ganze Grad.
const A5_KANDIDATEN = (() => {
  const liste = [];
  for (let a = 1; a <= 15; a++) for (let b = 1; b <= 15; b++) if (a !== b) liste.push({ a, b });
  return liste;
})();

function generateAufgabe5() {
  const k = ohneKollision(
    A5_KANDIDATEN,
    (v) => [Math.round(atanG(v.a / v.b)), 90 - Math.round(atanG(v.a / v.b)), Math.round(Math.atan(v.a / v.b))],
    A5_KANDIDATEN[0],
    0.6,
  );
  const { a, b } = k;
  const genau = atanG(a / b);
  const gerundet = Math.round(genau);
  const c = Math.hypot(a, b);
  return {
    promptHtml: `In einem rechtwinkligen Dreieck ist die <strong>Gegenkathete a = ${num(a)} cm</strong> und die ` +
      `<strong>Ankathete b = ${num(b)} cm</strong> (jeweils zum Winkel α).<br>` +
      `Wie groß ist <strong>α</strong>? <em>Runde auf ganze Grad.</em>`,
    correct: gerundet,
    tolerance: 0.6,
    placeholder: "Winkel in Grad",
    hinweis: (raw, val) => {
      if (Math.abs(val - (90 - gerundet)) < 0.6) return `Das ist der <em>andere</em> spitze Winkel β. Du hast tan β = b : a gerechnet. Für α gilt tan α = <strong>a : b</strong> = ${num(a)} : ${num(b)}.`;
      if (Math.abs(val - Math.atan(a / b)) < 0.6) return `Das sieht nach dem <strong>Bogenmaß</strong> aus: tan<sup>−1</sup>(${num(a / b, 4)}) ≈ ${num(Math.atan(a / b), 3)} rad. Stelle den Taschenrechner auf <strong>DEG</strong> — zur Kontrolle muss sin 30° = 0,5 herauskommen.`;
      return `Beide Katheten sind bekannt, also hilft der Tangens: tan α = a : b = ${num(a)} : ${num(b)} ${zeichen(a / b, 4)} ${num(a / b, 4)}. Dann die Umkehrtaste tan<sup>−1</sup>.`;
    },
    tipps: [
      "Gesucht ist ein Winkel, gegeben sind beide <strong>Katheten</strong> — dafür ist der Tangens zuständig.",
      `tan α = Gegenkathete : Ankathete = ${num(a)} : ${num(b)} ${zeichen(a / b, 4)} ${num(a / b, 4)}.`,
      `Aus dem Verhältnis wird der Winkel mit der Umkehrtaste: α = tan<sup>−1</sup>(${num(a / b, 4)}). Prüfe vorher, ob der Rechner auf DEG steht — sin 30° muss 0,5 ergeben.`,
    ],
    musterloesungHtml:
      `<strong>Formel:</strong> tan α = Gegenkathete : Ankathete = a : b<br>` +
      `<strong>Einsetzen:</strong> tan α = ${num(a)} : ${num(b)} ${zeichen(a / b, 4)} ${num(a / b, 4)}<br>` +
      `<strong>Umkehrtaste:</strong> α = tan<sup>−1</sup>(${num(a / b, 4)}) ≈ ${num(genau, 2)}° → <strong>${num(gerundet)}°</strong><br>` +
      `<em>Kontrolle:</em> ${a > b ? "Die Gegenkathete ist länger als die Ankathete, also muss α größer als 45° sein" : "Die Gegenkathete ist kürzer als die Ankathete, also muss α kleiner als 45° sein"} ✓ ` +
      `Der zweite spitze Winkel ist β ≈ ${num(90 - genau, 2)}°, und die Hypotenuse misst ≈ ${num(c, 2)} cm.`,
  };
}

// Aufgabe 6 — Steigung in Prozent. Die Falle steckt im Wort „Fahrstrecke“:
// Sie ist die Hypotenuse, nicht die waagerechte Entfernung.
const A6_KANDIDATEN = (() => {
  const liste = [];
  for (const p of [6, 7, 8, 9, 10, 12, 14, 15, 16, 18, 20, 22, 25, 28, 30]) {
    for (const s of [200, 250, 300, 400, 500, 600, 750, 800, 1000, 1200, 1500]) {
      liste.push({ p, s });
    }
  }
  return liste;
})();
const A6_KONTEXTE = [
  { was: "Eine Bergstraße", wer: "ein Radfahrer", fahrt: "Fahrstrecke" },
  { was: "Ein Wanderweg", wer: "eine Wanderin", fahrt: "Wegstrecke" },
  { was: "Eine Auffahrt", wer: "ein Lastwagen", fahrt: "Fahrstrecke" },
];

function generateAufgabe6() {
  const k = ohneFeldKollision(A6_KANDIDATEN, (v) => {
    const alpha = atanG(v.p / 100);
    const hoehe = v.s * sinG(alpha);
    const waagerecht = v.s * cosG(alpha);
    return [
      // Feld 1: der Steigungswinkel.
      [rund(alpha, 1), v.p, rund(asinG(v.p / 100), 1)],
      // Feld 2: der Höhenunterschied.
      [rund(hoehe, 1), rund((v.s * v.p) / 100, 1), rund(waagerecht, 1), v.s],
      // Feld 3: die waagerechte Entfernung.
      [rund(waagerecht, 1), rund(hoehe, 1), v.s],
    ];
  }, 0.13);
  const { p, s } = k;
  const kt = pick(A6_KONTEXTE);
  const alpha = atanG(p / 100);
  const hoehe = rund(s * sinG(alpha), 1);
  const waagerecht = rund(s * cosG(alpha), 1);
  const naiv = rund((s * p) / 100, 1);
  return {
    promptHtml: `${kt.was} hat eine gleichmäßige Steigung von <strong>${num(p)} %</strong>. ` +
      `${kt.wer.charAt(0).toUpperCase() + kt.wer.slice(1)} legt darauf eine <strong>${kt.fahrt} von ${num(s)} m</strong> zurück.<br>` +
      `<em>Runde auf eine Stelle nach dem Komma.</em>`,
    felder: [
      {
        name: "Steigungswinkel α (in Grad)", soll: rund(alpha, 1), einheit: "°", toleranz: 0.06, platzhalter: "α in Grad",
        hinweis: (roh, val) => {
          if (Math.abs(val - p) < 0.06) return `${num(p)} ist die Steigung in Prozent, nicht der Winkel. Aus ${num(p)} % = tan α · 100 % folgt tan α = ${num(p / 100, 2)}.`;
          if (Math.abs(val - rund(asinG(p / 100), 1)) < 0.06) return `Hier wurde sin<sup>−1</sup> benutzt. Die Steigung vergleicht den <em>Höhenunterschied</em> mit der <em>waagerechten</em> Strecke — das sind die beiden Katheten, also der Tangens.`;
          if (!isNaN(val) && val >= 45) return "Eine Steigung von 100 % entspricht 45°. Hier sind es deutlich weniger Prozent, also muss der Winkel kleiner sein.";
          return `Steigung in Prozent = tan α · 100 %, also tan α = ${num(p / 100, 2)} und α = tan<sup>−1</sup>(${num(p / 100, 2)}).`;
        },
      },
      {
        name: "Höhenunterschied (in m)", soll: hoehe, einheit: "m", toleranz: 0.06, platzhalter: "Höhe in m",
        hinweis: (roh, val) => {
          if (Math.abs(val - naiv) < 0.06) return `${num(naiv, 1)} m wäre die Höhe, wenn die ${num(s)} m <em>waagerecht</em> gemessen wären. Die ${kt.fahrt} ist aber die schräge Strecke — die Hypotenuse. Gerechnet wird also mit dem Sinus.`;
          if (Math.abs(val - waagerecht) < 0.06) return `${num(waagerecht, 1)} m ist die waagerechte Entfernung, nicht die Höhe.`;
          if (Math.abs(val - s) < 0.06) return `${num(s)} m ist die ${kt.fahrt} selbst.`;
          return `Vom Winkel α aus ist die Höhe die Gegenkathete und die ${kt.fahrt} die Hypotenuse: Höhe = ${num(s)} m · sin α.`;
        },
      },
      {
        name: "waagerechte Entfernung (in m)", soll: waagerecht, einheit: "m", toleranz: 0.06, platzhalter: "Strecke in m",
        hinweis: (roh, val) => {
          if (Math.abs(val - hoehe) < 0.06) return `${num(hoehe, 1)} m ist der Höhenunterschied. Waagerecht misst man die Ankathete: ${num(s)} m · cos α.`;
          if (Math.abs(val - s) < 0.06) return `${num(s)} m ist die schräge ${kt.fahrt}. Waagerecht ist es etwas weniger.`;
          if (!isNaN(val) && val > s) return `Die waagerechte Entfernung ist immer <em>kürzer</em> als die schräge Strecke von ${num(s)} m — eine Kathete ist kürzer als die Hypotenuse.`;
          return `Waagerecht = ${num(s)} m · cos α.`;
        },
      },
    ],
    tipps: [
      `${num(p)} % Steigung heißt: Auf 100 m <strong>waagerecht</strong> geht es ${num(p)} m hinauf. Das ist ein Verhältnis zweier Katheten — also der Tangens.`,
      `tan α = ${num(p / 100, 2)}, und mit der Umkehrtaste tan<sup>−1</sup> bekommst du α.`,
      `Achtung bei der zweiten und dritten Frage: Die ${kt.fahrt} von ${num(s)} m ist die <strong>schräge</strong> Strecke, also die Hypotenuse. Höhe = ${num(s)} m · sin α, waagerecht = ${num(s)} m · cos α.`,
    ],
    musterloesungHtml:
      `<strong>1. Steigungswinkel:</strong> ${num(p)} % = tan α · 100 % ⇒ tan α = ${num(p / 100, 2)} ⇒ ` +
      `α = tan<sup>−1</sup>(${num(p / 100, 2)}) ≈ <strong>${num(rund(alpha, 1), 1)}°</strong><br>` +
      `<strong>2. Höhenunterschied:</strong> Die ${kt.fahrt} ist die Hypotenuse, die Höhe die Gegenkathete ⇒ ` +
      `h = ${num(s)} m · sin ${num(rund(alpha, 1), 1)}° ≈ <strong>${num(hoehe, 1)} m</strong><br>` +
      `<strong>3. Waagerecht:</strong> b = ${num(s)} m · cos ${num(rund(alpha, 1), 1)}° ≈ <strong>${num(waagerecht, 1)} m</strong><br>` +
      `<em>Probe:</em> ${num(hoehe, 1)} : ${num(waagerecht, 1)} ≈ ${num(rund(hoehe / waagerecht, 4), 4)} — das sind wieder die ${num(p)} % ✓<br>` +
      `<span class="progress-note">Der naheliegende Kurzweg „${num(p)} % von ${num(s)} m“ ergäbe ${num(naiv, 1)} m ` +
      `und wäre um ${num(rund(naiv - hoehe, 1), 1)} m zu groß: Er behandelt die schräge Strecke, als wäre sie waagerecht. ` +
      `Bei kleinen Steigungen ist der Unterschied winzig, bei ${num(p)} % schon spürbar.</span>`,
  };
}

// Aufgabe 7 — Turmhöhe aus Abstand und Höhenwinkel, mit Augenhöhe.
const A7_KANDIDATEN = (() => {
  const liste = [];
  for (let alpha = 20; alpha <= 60; alpha += 2) {
    for (let d = 20; d <= 90; d += 5) liste.push({ alpha, d });
  }
  return liste;
})();

function generateAufgabe7() {
  const k = ohneKollision(
    A7_KANDIDATEN,
    (v) => [v.d * tanG(v.alpha) + AW_AUGE, v.d * tanG(v.alpha), v.d * sinG(v.alpha) + AW_AUGE, v.d / tanG(v.alpha) + AW_AUGE],
    A7_KANDIDATEN[0],
    0.06,
  );
  const { alpha, d } = k;
  const h1 = d * tanG(alpha), h = h1 + AW_AUGE;
  const gerundet = Math.round(h * 10) / 10;
  return {
    promptHtml: `Du stehst <strong>${num(d)} m</strong> vom Fuß eines Turms entfernt und siehst seine Spitze unter dem ` +
      `<strong>Höhenwinkel α = ${num(alpha)}°</strong>. Das Messgerät ist <strong>1,60 m</strong> über dem Boden.<br>` +
      `Wie hoch ist der Turm? <em>Runde auf eine Stelle nach dem Komma (in m).</em>`,
    correct: gerundet,
    tolerance: 0.06,
    placeholder: "Höhe in m",
    hinweis: (raw, val) => {
      if (Math.abs(val - h1) < 0.06) return `Die <strong>Augenhöhe fehlt</strong>. Mit tan α berechnest du nur die Höhe <em>über dem Messgerät</em>; die 1,60 m müssen noch addiert werden.`;
      if (Math.abs(val - (d * sinG(alpha) + AW_AUGE)) < 0.06) return `Hier wurde der Sinus benutzt. Gegeben ist aber die <em>Ankathete</em> (der Abstand am Boden), gesucht die <em>Gegenkathete</em> — dafür ist der Tangens zuständig.`;
      if (Math.abs(val - (d / tanG(alpha) + AW_AUGE)) < 0.06) return `Hier wurde geteilt statt multipliziert. Aus tan α = h₁ : d folgt h₁ = d · tan α.`;
      return `Zwei Schritte: erst h₁ = d · tan α, dann die Augenhöhe von 1,60 m addieren.`;
    },
    tipps: [
      "Zeichne eine Skizze: Der rechte Winkel liegt am Turm auf Augenhöhe, nicht am Boden.",
      `Vom Winkel α aus ist der Abstand ${num(d)} m die Ankathete und die gesuchte Höhe die Gegenkathete — also tan α = h₁ : ${num(d)}.`,
      "Und ganz zum Schluss: Die 1,60 m Augenhöhe gehören noch dazu. Ohne sie ist die Antwort um eine Körperlänge zu klein.",
    ],
    musterloesungHtml:
      `<strong>Skizze:</strong> Der rechte Winkel liegt am Turm auf Augenhöhe. Vom Winkel α aus ist der Abstand d die Ankathete und die gesuchte Höhe h₁ die Gegenkathete.<br>` +
      `<strong>Formel:</strong> tan α = h₁ : d, also h₁ = d · tan α<br>` +
      `<strong>Einsetzen:</strong> h₁ = ${num(d)} m · tan ${num(alpha)}° = ${num(d)} m · ${num(tanG(alpha), 4)} ≈ ${num(h1, 2)} m<br>` +
      `<strong>Augenhöhe addieren:</strong> h = ${num(h1, 2)} m + 1,60 m ≈ <strong>${num(gerundet, 1)} m</strong><br>` +
      `<em>Kontrolle:</em> Bei 45° wäre h₁ genau ${num(d)} m. Hier ist α = ${num(alpha)}°, also ` +
      `${alpha < 45 ? "weniger" : "mehr"} — und ${num(h1, 2)} m ist ${alpha < 45 ? "kleiner" : "größer"} als ${num(d)} m ✓`,
  };
}

// Aufgabe 8 — die Höhe aus zwei Standpunkten. Der Fußpunkt ist nicht
// zugänglich, also hilft ein einzelner Höhenwinkel nicht mehr weiter: Erst
// zwei Messungen von verschiedenen Stellen aus liefern die Höhe.
const A8_KANDIDATEN = (() => {
  const liste = [];
  for (let alpha = 30; alpha <= 65; alpha += 1) {
    for (let beta = 15; beta <= 50; beta += 1) {
      if (alpha - beta < 8) continue;              // sonst wird die Rechnung numerisch heikel
      for (const d of [20, 25, 30, 40, 50, 60, 75, 80, 100]) {
        // h = d : (cot β − cot α)
        const h = d / (1 / tanG(beta) - 1 / tanG(alpha));
        if (h < 8 || h > 150) continue;
        liste.push({ alpha, beta, d, h });
      }
    }
  }
  return liste;
})();
const A8_KONTEXTE = [
  { was: "ein Kirchturm", der: "der Turm", jenseits: "Der Fuß des Turms steht hinter einer Mauer und ist nicht zugänglich" },
  { was: "eine Felswand", der: "die Wand", jenseits: "Der Fuß der Wand liegt jenseits eines Flusses" },
  { was: "ein Baum", der: "der Baum", jenseits: "Der Fuß des Baums steht mitten in einem Teich" },
  { was: "ein Sendemast", der: "der Mast", jenseits: "Der Fuß des Masts liegt in einem gesperrten Bereich" },
];

function generateAufgabe8() {
  const k = ohneFeldKollision(A8_KANDIDATEN, (v) => {
    const h = rund(v.h, 1);
    const x = rund(v.h / tanG(v.alpha), 1);
    const luft = rund(v.h / sinG(v.beta), 1);
    return [
      // Feld 1: die Höhe.
      [h, x, luft, v.d, rund(v.d * tanG(v.alpha), 1), rund(v.d * tanG(v.beta), 1)],
      // Feld 2: der Abstand des vorderen Standpunkts vom Fußpunkt.
      [x, h, rund(v.h / tanG(v.beta), 1), v.d, luft],
      // Feld 3: die Luftlinie vom hinteren Standpunkt.
      [luft, h, x, v.d, rund(v.h / sinG(v.alpha), 1)],
    ];
  }, 0.35);
  const { alpha, beta, d } = k;
  const kt = pick(A8_KONTEXTE);
  const hGenau = d / (1 / tanG(beta) - 1 / tanG(alpha));
  const h = rund(hGenau, 1);
  const x = rund(hGenau / tanG(alpha), 1);
  const hinten = rund(hGenau / tanG(beta), 1);
  const luft = rund(hGenau / sinG(beta), 1);
  const naiv = rund(d * tanG(alpha), 1);
  return {
    promptHtml: `Gemessen werden soll, wie hoch ${kt.was} über dem waagerechten Boden aufragt. ` +
      `${kt.jenseits}.<br>` +
      `Von einem Punkt A aus erscheint die Spitze unter dem Höhenwinkel <strong>α = ${num(alpha)}°</strong>. ` +
      `Geht man <strong>${num(d)} m</strong> geradlinig zurück, so misst man von B aus nur noch <strong>β = ${num(beta)}°</strong>.<br>` +
      `<em>Gemessen wird vom Boden aus; runde auf eine Stelle nach dem Komma.</em>`,
    felder: [
      {
        name: "Höhe (in m)", soll: h, einheit: "m", toleranz: 0.16, platzhalter: "Höhe in m",
        hinweis: (roh, val) => {
          if (Math.abs(val - naiv) < 0.16) return `${num(naiv, 1)} m käme heraus, wenn ${num(d)} m der Abstand vom Fußpunkt wäre. ${num(d)} m ist aber nur der Abstand <em>zwischen den beiden Standpunkten</em>.`;
          if (Math.abs(val - rund(d * tanG(beta), 1)) < 0.16) return `Auch hier wurden die ${num(d)} m für den Abstand zum Fußpunkt gehalten. Der Fußpunkt ist ja gerade nicht erreichbar — das ist der Grund für die zweite Messung.`;
          if (Math.abs(val - x) < 0.16) return `${num(x, 1)} m ist die Entfernung von A zum Fußpunkt, nicht die Höhe.`;
          if (Math.abs(val - d) < 0.16) return `${num(d)} m ist der Abstand der beiden Standpunkte.`;
          return `Nenne x den Abstand von A zum Fußpunkt. Dann gilt tan α = h : x und tan β = h : (x + ${num(d)}). Zwei Gleichungen, zwei Unbekannte.`;
        },
      },
      {
        name: "Abstand von A zum Fußpunkt (in m)", soll: x, einheit: "m", toleranz: 0.16, platzhalter: "x in m",
        hinweis: (roh, val) => {
          if (Math.abs(val - h) < 0.16) return `${num(h, 1)} m ist die Höhe. Gefragt ist die waagerechte Entfernung.`;
          if (Math.abs(val - hinten) < 0.16) return `${num(hinten, 1)} m ist die Entfernung von <strong>B</strong> zum Fußpunkt — das sind genau ${num(d)} m mehr.`;
          if (Math.abs(val - d) < 0.16) return `${num(d)} m ist der Abstand zwischen A und B.`;
          return `Aus tan α = h : x folgt x = h : tan α.`;
        },
      },
      {
        name: "Luftlinie von B zur Spitze (in m)", soll: luft, einheit: "m", toleranz: 0.16, platzhalter: "Strecke in m",
        hinweis: (roh, val) => {
          if (Math.abs(val - rund(hGenau / sinG(alpha), 1)) < 0.16) return `Das ist die Luftlinie von <strong>A</strong> aus. Von B aus ist der Winkel β und die Strecke länger.`;
          if (Math.abs(val - h) < 0.16) return `${num(h, 1)} m ist die Höhe, also die Gegenkathete. Die Luftlinie ist die Hypotenuse und damit länger.`;
          if (Math.abs(val - hinten) < 0.16) return `${num(hinten, 1)} m ist die waagerechte Entfernung von B. Die Luftlinie geht schräg nach oben.`;
          return `Im Dreieck bei B ist die Höhe die Gegenkathete zum Winkel β und die Luftlinie die Hypotenuse: sin β = h : Luftlinie.`;
        },
      },
    ],
    tipps: [
      `Zeichne beide Dreiecke übereinander: Sie haben dieselbe Höhe h, aber verschiedene Ankatheten. Nenne die kürzere x — das ist der Abstand von A zum Fußpunkt.`,
      `Dann heißt es tan ${num(alpha)}° = h : x und tan ${num(beta)}° = h : (x + ${num(d)}). Löse die erste nach x auf und setze ein.`,
      `Man erhält h · (1 : tan ${num(beta)}° − 1 : tan ${num(alpha)}°) = ${num(d)} m, also h = ${num(d)} m : (${num(rund(1 / tanG(beta), 4), 4)} − ${num(rund(1 / tanG(alpha), 4), 4)}).`,
    ],
    musterloesungHtml:
      `<strong>1. Benennen:</strong> h = gesuchte Höhe, x = Abstand von A zum Fußpunkt. Von B aus ist der Abstand x + ${num(d)} m.<br>` +
      `<strong>2. Zwei Gleichungen:</strong> tan ${num(alpha)}° = h : x und tan ${num(beta)}° = h : (x + ${num(d)})<br>` +
      `<strong>3. Nach x auflösen:</strong> x = h : tan ${num(alpha)}° und x + ${num(d)} = h : tan ${num(beta)}°<br>` +
      `<strong>4. Subtrahieren:</strong> ${num(d)} = h · (1 : tan ${num(beta)}° − 1 : tan ${num(alpha)}°) = h · (${num(rund(1 / tanG(beta), 4), 4)} − ${num(rund(1 / tanG(alpha), 4), 4)})<br>` +
      `<strong>5. Höhe:</strong> h = ${num(d)} m : ${num(rund(1 / tanG(beta) - 1 / tanG(alpha), 4), 4)} ≈ <strong>${num(h, 1)} m</strong><br>` +
      `<strong>6. Abstand:</strong> x = ${num(h, 1)} m : tan ${num(alpha)}° ≈ <strong>${num(x, 1)} m</strong><br>` +
      `<strong>7. Luftlinie von B:</strong> sin ${num(beta)}° = h : Luftlinie ⇒ Luftlinie = ${num(h, 1)} m : sin ${num(beta)}° ≈ <strong>${num(luft, 1)} m</strong><br>` +
      `<em>Probe:</em> Von B aus ist die waagerechte Entfernung ${num(x, 1)} m + ${num(d)} m = ${num(rund(x + d, 1), 1)} m, ` +
      `und ${num(h, 1)} : ${num(rund(x + d, 1), 1)} ≈ ${num(rund(h / (x + d), 4), 4)} ≈ tan ${num(beta)}° = ${num(rund(tanG(beta), 4), 4)} ✓<br>` +
      `<span class="progress-note">Mit einer einzigen Messung ginge es nicht: ${num(alpha)}° allein legt nur das ` +
      `Verhältnis von Höhe und Abstand fest, nicht beide Größen. Erst die zweite Messung — und der bekannte Abstand ` +
      `der Standpunkte — macht die Aufgabe eindeutig. Der Kurzschluss „${num(d)} m ist der Abstand zum Fuß“ ergäbe ` +
      `${num(naiv, 1)} m statt ${num(h, 1)} m.</span>`,
  };
}

function initExercises() {
  mountUebungsaufgaben(document.getElementById("exercises-mount"), [
    { schwierigkeit: "einfach", titel: "Aufgabe 1 — Kathete aus dem Verhältnis", generate: generateAufgabe1 },
    { schwierigkeit: "einfach", titel: "Aufgabe 2 — die Werte für 30°, 45° und 60°", generate: generateAufgabe2 },
    { schwierigkeit: "mittel", titel: "Aufgabe 3 — Seite berechnen", generate: generateAufgabe3 },
    { schwierigkeit: "mittel", titel: "Aufgabe 4 — am Einheitskreis", generate: generateAufgabe4 },
    { schwierigkeit: "schwierig", titel: "Aufgabe 5 — Winkel berechnen", generate: generateAufgabe5 },
    { schwierigkeit: "schwierig", titel: "Aufgabe 6 — Steigung in Prozent", generate: generateAufgabe6 },
    { schwierigkeit: "komplex", titel: "Aufgabe 7 — Turmhöhe messen", generate: generateAufgabe7 },
    { schwierigkeit: "komplex", titel: "Aufgabe 8 — Höhe aus zwei Standpunkten", generate: generateAufgabe8 },
  ]);
}

// ================= Quizze =================

function initQuizzes() {
  mountQuiz(document.getElementById("quiz-verhaeltnisse"), {
    q: "Ein rechtwinkliges Dreieck wird auf das Dreifache vergrößert. Was passiert mit sin α?",
    options: [
      "sin α bleibt gleich",
      "sin α wird dreimal so groß",
      "sin α wird ein Drittel so groß",
      "sin α wird neunmal so groß",
    ],
    correct: 0,
    explain: "Beim Vergrößern werden Gegenkathete und Hypotenuse mit demselben Faktor multipliziert; im Quotienten kürzt er sich weg: (3a) : (3c) = a : c. Genau deshalb hängt sin α allein vom Winkel ab — das ist der Grund, warum es überhaupt eine Sinustabelle geben kann.",
  });
  mountQuiz(document.getElementById("quiz-seiten"), {
    q: "Gegeben sind α und die Ankathete b. Gesucht ist die Hypotenuse c. Welche Rechnung stimmt?",
    options: ["c = b : cos α", "c = b · cos α", "c = b : sin α", "c = b · tan α"],
    correct: 0,
    explain: "In cos α = b : c kommen genau die gegebene und die gesuchte Seite vor. Die gesuchte Seite c steht im Nenner — also wird durch cos α geteilt. Eine Kontrolle: cos α ist kleiner als 1, und beim Teilen durch eine Zahl unter 1 wird das Ergebnis größer. Die Hypotenuse muss ja länger sein als die Kathete.",
  });
  mountQuiz(document.getElementById("quiz-winkel"), {
    q: "In einem rechtwinkligen Dreieck sind beide Katheten 5 cm lang. Wie groß ist α?",
    options: ["45°", "30°", "60°", "90°"],
    correct: 0,
    explain: "tan α = 5 : 5 = 1, und tan⁻¹(1) = 45°. Das Dreieck ist gleichschenklig-rechtwinklig, also ein halbes Quadrat. 90° kann α nicht sein — die Winkelsumme ließe für den dritten Winkel nichts übrig.",
  });
  mountQuiz(document.getElementById("quiz-besondere"), {
    q: "Wie groß ist cos 60°?",
    options: ["0,5", "√3 : 2 ≈ 0,87", "√2 : 2 ≈ 0,71", "2"],
    correct: 0,
    explain: "Im halbierten gleichseitigen Dreieck mit der Seite 2 ist die Ankathete zu 60° genau 1 und die Hypotenuse 2, also cos 60° = 1 : 2 = 0,5. Der Wert √3 : 2 gehört zu sin 60° beziehungsweise cos 30°. Und größer als 1 kann ein Kosinus nie werden, denn die Kathete ist nie länger als die Hypotenuse.",
  });
  mountQuiz(document.getElementById("quiz-einheitskreis"), {
    q: "Welche Vorzeichen haben sin α und cos α für α = 150°?",
    options: [
      "sin > 0 und cos < 0",
      "sin < 0 und cos > 0",
      "beide negativ",
      "beide positiv",
    ],
    correct: 0,
    explain: "150° liegt im zweiten Quadranten: links oben. Die Höhe des Punktes ist positiv (sin 150° = 0,5), seine Breite negativ (cos 150° ≈ −0,87). Merkhilfe: sin ist die Höhe, cos die Breite — man sieht die Vorzeichen dem Bild direkt an.",
  });
  mountQuiz(document.getElementById("quiz-anwendungen"), {
    q: "Eine Straße hat 10 % Steigung. Welcher Winkel gehört dazu?",
    options: ["etwa 5,7°", "10°", "etwa 45°", "etwa 84°"],
    correct: 0,
    explain: "10 % bedeutet 10 m Höhe auf 100 m waagerechte Strecke, also tan α = 0,1 und α = tan⁻¹(0,1) ≈ 5,7°. Prozent und Grad sind nicht dasselbe: 100 % Steigung wären erst 45°.",
  });
}

// ================= Start =================

initVerhaeltnisse();
initSeiten();
initWinkel();
initBesondere();
initEinheitskreis();
initAnwendungen();
initExercises();
initQuizzes();
