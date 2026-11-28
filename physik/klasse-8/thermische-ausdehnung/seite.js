// Gemeinsame Bausteine der Physikseiten der Klasse 8: Zeichenfläche, Regler, Kontrollfragen, Zahlen
// mit Einheiten und Übungsblock. Übernommen von den Körperseiten der Mathematik (koerper/seite.js) —
// wer dort einen Helfer verbessert, sollte wissen, dass diese Kopie davon nichts mitbekommt. Geteilt
// wird nur mountUebungsaufgaben() aus mathematik/aufgaben.js.

import { mountUebungsaufgaben as mountUebungsaufgabenBasis } from "../../../mathematik/aufgaben.js?v=2";

// ---------- DOM und SVG ----------

const SVG_NS = "http://www.w3.org/2000/svg";
export function svgEl(tag, attrs = {}) {
  const e = document.createElementNS(SVG_NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  return e;
}
export function svgText(x, y, text, attrs = {}) {
  const t = svgEl("text", Object.assign({ x: Number(x).toFixed(2), y: Number(y).toFixed(2), "text-anchor": "middle" }, attrs));
  t.textContent = text;
  return t;
}
export function el(tag, attrs = {}, children = []) {
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

// Eine Zeichenfläche in Bildpunkten. `teile` sind fertige SVG-Elemente.
export function flaeche(breite, hoehe, label) {
  return svgEl("svg", {
    viewBox: `0 0 ${breite} ${hoehe}`, width: breite, height: hoehe,
    class: "th-flaeche", preserveAspectRatio: "xMidYMid meet", role: "img", "aria-label": label || "Zeichnung",
  });
}
export function zeige(mountId, svg) {
  const mount = document.getElementById(mountId);
  mount.innerHTML = "";
  mount.appendChild(svg);
}

// ---------- Zahlen ----------

const ZAHLFORMATE = new Map();
function zahlformat(stellen) {
  let f = ZAHLFORMATE.get(stellen);
  if (!f) ZAHLFORMATE.set(stellen, (f = new Intl.NumberFormat("de-DE", { maximumFractionDigits: stellen })));
  return f;
}
// Deutsche Schreibweise mit echtem Minuszeichen. Gerundet wird VOR der Ausgabe, damit −0,0001 nicht
// als „−0“ erscheint.
export function num(x, stellen = 4) {
  const f = Math.pow(10, stellen);
  const g = Math.round(x * f) / f;
  return zahlformat(stellen).format(g === 0 ? 0 : g).replace("-", "−");
}
// Auf zwei Nachkommastellen, aber immer mit beiden Stellen: „31,40“ sieht nach Rundung aus, „31,4“
// nach einem genauen Wert. Wie auf der Kreis-Seite.
const ZWEI = new Intl.NumberFormat("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export function zwei(x) {
  const g = Math.round(x * 100) / 100;
  return ZWEI.format(g === 0 ? 0 : g).replace("-", "−");
}
// „=“ oder „≈“: Entscheidend ist, ob die Anzeige mit `stellen` Nachkommastellen den Wert genau trifft.
export function zeichen(x, stellen = 2) {
  const f = Math.pow(10, stellen);
  return Math.abs(Math.round(x * f) - x * f) < 1e-6 ? "=" : "≈";
}
// Eine eingesetzte Zahl: negative stehen in Klammern — sonst wird aus x² für x = −3 die falsche −3².
export const eingesetzt = (x) => (x < 0 ? `(${num(x)})` : num(x));

// ---------- Regler ----------

export function reglerZahl(id) {
  return Number(document.getElementById(id).value);
}
// Schreibt einen begrenzten Reglerwert in den Regler zurück. Ein Regler darf nie etwas anderes
// anzeigen als das, womit gerechnet wird.
export function begrenzt(id, wert, min, max) {
  const v = Math.min(max, Math.max(min, wert));
  if (v !== wert) document.getElementById(id).value = String(v);
  return v;
}
export function setzeText(id, text) {
  document.getElementById(id).textContent = text;
}
export function setzeHtml(id, html) {
  document.getElementById(id).innerHTML = html;
}
export function wahl(id) {
  return document.getElementById(id).value;
}

// ---------- Kontrollfragen ----------

export function mountQuiz(container, { q, options, correct, explain }) {
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
export function mountQuizze(quizze) {
  for (const [id, def] of Object.entries(quizze)) mountQuiz(document.getElementById(id), def);
}

// ---------- Übungsaufgaben ----------

// Zahlen mit Komma, echtem Minus und Tausenderpunkt — und nur vollständige Zahlen: parseFloat läse
// aus „3x“ die 3 und aus „2 · 4“ die 2 und erkennte damit eine halbe Antwort als Zahl. Eine Einheit
// dahinter darf stehen (auch „cm3“ statt „cm³“, „Grad C“ statt „°C“) — sie wird nicht umgerechnet:
// Gefragt ist immer in der Einheit, die neben dem Feld oder in der Aufgabe steht.
// Einheiten, die hinter einer Zahl stehen dürfen — auch die Koeffizienten (mm/(m·K), ml/(l·K)), Massen und
// Minuten der Übungsaufgaben.
const EINHEIT = /^(?:mm|cm|dm|m|km)(?:²|³|2|3)?$|^(?:ml|l|L|Liter|bar|mbar|hPa|Pa|kJ|J|K|°C|°|GradC|Grad|kg|g|min|Minuten)$|^(?:mm\/\(m[·*]?K\)|ml\/\(l[·*]?K\))$/i;
export function parseZahl(raw) {
  if (raw == null) return NaN;
  const s = String(raw).trim().replace(/\s/g, "").replace(/−/g, "-").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
  const m = s.match(/^(-?\d+(?:\.\d+)?)(.*)$/);
  if (!m) return NaN;
  if (m[2] !== "" && !EINHEIT.test(m[2])) return NaN;
  return parseFloat(m[1]);
}
export const mountUebungsaufgaben = (container, defs) =>
  mountUebungsaufgabenBasis(container, defs, { parse: parseZahl });

export function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
export function trifft(val, soll, tol = 1e-9) {
  return Number.isFinite(val) && Number.isFinite(soll) && Math.abs(val - soll) <= tol;
}
// Wählt aus einer VORHER gefilterten Liste — nicht durch Verwerfen und Neuziehen. Bleiben von vielen
// Kandidaten fast keine übrig, steht vermutlich ein Wert doppelt in der Liste.
export function ohneKollision(kandidaten, werte, eps = 1e-9) {
  const sauber = kandidaten.filter((k) => {
    const w = werte(k).filter((x) => Number.isFinite(x));
    return w.every((x, i) => w.every((y, j) => i === j || Math.abs(x - y) > eps));
  });
  if (kandidaten.length > 20 && sauber.length < 2) {
    throw new Error(`Aufgabengenerator: nur ${sauber.length} von ${kandidaten.length} Kandidaten übrig — vermutlich steht ein Wert doppelt in der Liste`);
  }
  if (!sauber.length) throw new Error("Aufgabengenerator ohne gültige Kandidaten");
  return pick(sauber);
}
// Glatt auf `stellen` Nachkommastellen? Ganzzahlig gerechnet, damit 1,375 · 1000 nicht als
// 1374,9999… durchfällt.
export function glatt(x, stellen = 0) {
  const f = Math.pow(10, stellen);
  return Math.abs(Math.round(x * f) - x * f) < 1e-6;
}

// Die Kandidatenlisten entstehen beim ersten Würfeln, nicht beim Laden der Seite.
export function spaeter(bauen) {
  let liste = null;
  return () => (liste ??= bauen());
}
