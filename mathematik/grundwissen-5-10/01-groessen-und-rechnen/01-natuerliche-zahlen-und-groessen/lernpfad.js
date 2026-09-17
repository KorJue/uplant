// Selbstlernpfad "Natürliche Zahlen und Größen" (Grundwissen Klasse 5-10). Rein clientseitiges
// Vanilla-JS, ohne Build-Schritt oder externe Bibliotheken — wie der Rest der Seite. Aufbau: kleine
// DOM/SVG-Helfer, dann je ein Abschnitt (Stellenwertsystem, Runden, Zahlenstrahl, Größen), zuletzt
// die gestaffelten Übungsaufgaben (einfach direkt sichtbar, mittel/schwierig/komplex per Reiter,
// mit Würfel-Knopf für neue Zahlen).

"use strict";

import { mountUebungsaufgaben as mountUebungsaufgabenBasis } from "../../../aufgaben.js?v=1";

// ---------- Helfer ----------

const SVG_NS = "http://www.w3.org/2000/svg";
function svgEl(tag, attrs = {}) {
  const e = document.createElementNS(SVG_NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  return e;
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
function num(x, digits = 3) {
  return x.toLocaleString("de-DE", { maximumFractionDigits: digits });
}
function randInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}
// Toleranter Zahlen-Parser: erlaubt "0,25", "1/4", "25%" und Tausenderpunkte als Antwort.
function parseFlexibleNumber(raw) {
  if (raw == null) return NaN;
  let s = String(raw).trim().replace(/\./g, "").replace(",", ".");
  let asPercent = false;
  if (s.endsWith("%")) {
    asPercent = true;
    s = s.slice(0, -1).trim();
  }
  let val;
  if (s.includes("/")) {
    const [a, b] = s.split("/").map((p) => parseFloat(p.trim()));
    val = a / b;
  } else {
    val = parseFloat(s);
  }
  if (asPercent) val /= 100;
  return val;
}

// ---------- Deutsche Zahlwörter (0 - 999.999) ----------

const EINER_EIGEN = ["null", "eins", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun"];
const TEENS = ["zehn", "elf", "zwölf", "dreizehn", "vierzehn", "fünfzehn", "sechzehn", "siebzehn", "achtzehn", "neunzehn"];
const ZEHNER = ["", "", "zwanzig", "dreißig", "vierzig", "fünfzig", "sechzig", "siebzig", "achtzig", "neunzig"];

function unter100(n) {
  if (n === 0) return "";
  if (n < 10) return EINER_EIGEN[n];
  if (n < 20) return TEENS[n - 10];
  const z = Math.floor(n / 10),
    e = n % 10;
  if (e === 0) return ZEHNER[z];
  const ew = e === 1 ? "ein" : EINER_EIGEN[e];
  return ew + "und" + ZEHNER[z];
}
function unter1000(n) {
  if (n < 100) return unter100(n);
  const h = Math.floor(n / 100),
    rest = n % 100;
  const prefix = (h === 1 ? "ein" : EINER_EIGEN[h]) + "hundert";
  return rest === 0 ? prefix : prefix + unter100(rest);
}
function zahlwort(n) {
  if (n === 0) return "null";
  if (n < 1000) return unter1000(n);
  const t = Math.floor(n / 1000),
    rest = n % 1000;
  const tPrefix = t === 1 ? "eintausend" : unter1000(t) + "tausend";
  return rest === 0 ? tPrefix : tPrefix + unter1000(rest);
}

// ---------- Quiz-Komponente ----------

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

// ================= 1. Stellenwertsystem =================

function renderStellenwertTafel(n) {
  n = Math.max(0, Math.min(999999, Math.floor(n)));
  const digits = String(n).padStart(6, "0").split("").map(Number);
  const labels = ["HT", "ZT", "T", "H", "Z", "E"];
  const numDigits = String(n).length;

  const mount = document.getElementById("swt-tafel-mount");
  mount.innerHTML = "";
  const table = el("table", { class: "stellenwert-tafel" });
  table.appendChild(el("tr", {}, labels.map((l) => el("th", {}, l))));
  table.appendChild(
    el(
      "tr",
      {},
      digits.map((d, i) => {
        const leer = i < 6 - numDigits;
        return el("td", { class: leer ? "leer" : "" }, leer ? "" : String(d));
      })
    )
  );
  mount.appendChild(table);

  const placeValues = [100000, 10000, 1000, 100, 10, 1];
  const terms = [];
  for (let i = 6 - numDigits; i < 6; i++) terms.push(`${digits[i]} · ${placeValues[i].toLocaleString("de-DE")}`);
  document.getElementById("swt-zerlegung").innerHTML = `<strong>${n.toLocaleString("de-DE")}</strong> = ` + terms.join(" + ");
  document.getElementById("swt-wort").textContent = "In Worten: " + zahlwort(n);
}

function initStellenwertsystem() {
  const input = document.getElementById("swt-input");
  input.addEventListener("input", () => renderStellenwertTafel(Number(input.value) || 0));
  renderStellenwertTafel(Number(input.value) || 0);
}

// ================= 2. Runden =================

function initRunden() {
  const input = document.getElementById("runden-input");
  const stelleSel = document.getElementById("runden-stelle");
  const anzeige = document.getElementById("runden-anzeige");
  const strahlMount = document.getElementById("runden-strahl-mount");
  const STELLE_LABEL = { 10: "Zehner", 100: "Hunderter", 1000: "Tausender", 10000: "Zehntausender" };

  function refresh() {
    const n = Math.max(0, Math.min(999999, Math.floor(Number(input.value) || 0)));
    const stelle = Number(stelleSel.value);
    const nachbarDigit = Math.floor(n / (stelle / 10)) % 10;
    const unten = Math.floor(n / stelle) * stelle;
    const oben = unten + stelle;
    const gerundet = nachbarDigit >= 5 ? oben : unten;

    const nStr = String(n);
    const posFromRight = Math.log10(stelle) - 1;
    const idxFromLeft = nStr.length - 1 - posFromRight;
    let markedHtml = nStr;
    if (idxFromLeft >= 0 && idxFromLeft < nStr.length) {
      markedHtml = nStr
        .split("")
        .map((ch, i) => (i === idxFromLeft ? `<span style="color:#b3261e;font-weight:800;text-decoration:underline">${ch}</span>` : ch))
        .join("");
    }
    const stelleLabel = STELLE_LABEL[stelle];
    anzeige.innerHTML =
      `${n.toLocaleString("de-DE")} (Nachbarziffer der ${stelleLabel}-Stelle markiert): ${markedHtml}<br>` +
      `Diese Ziffer ist ${nachbarDigit} → ${nachbarDigit >= 5 ? "also wird <strong>aufgerundet</strong>" : "also wird <strong>abgerundet</strong>"}<br>` +
      `${n.toLocaleString("de-DE")} gerundet auf ${stelleLabel} ≈ <strong>${gerundet.toLocaleString("de-DE")}</strong>`;

    strahlMount.innerHTML = "";
    const W = 560,
      H = 70;
    const svg = svgEl("svg", { viewBox: `0 0 ${W} ${H}`, class: "tree-svg" });
    const x0 = 50,
      x1 = W - 50;
    const frac = stelle > 0 ? (n - unten) / stelle : 0;
    const xN = x0 + frac * (x1 - x0);
    svg.appendChild(svgEl("line", { x1: x0, y1: 35, x2: x1, y2: 35, stroke: "var(--muted)", "stroke-width": 1.5 }));
    [
      [x0, unten],
      [x1, oben],
    ].forEach(([x, val]) => {
      svg.appendChild(svgEl("line", { x1: x, y1: 28, x2: x, y2: 42, stroke: "var(--muted)", "stroke-width": 1.5 }));
      const t = svgEl("text", { x, y: 58, "text-anchor": "middle", "font-size": 11, fill: "var(--muted)" });
      t.textContent = val.toLocaleString("de-DE");
      svg.appendChild(t);
    });
    svg.appendChild(svgEl("circle", { cx: xN, cy: 35, r: 5, fill: "#b3261e" }));
    const label = svgEl("text", { x: xN, y: 18, "text-anchor": "middle", "font-size": 11, fill: "#b3261e", "font-weight": 700 });
    label.textContent = n.toLocaleString("de-DE");
    svg.appendChild(label);
    strahlMount.appendChild(svg);
  }
  input.addEventListener("input", refresh);
  stelleSel.addEventListener("change", refresh);
  refresh();
}

// ================= 3. Zahlenstrahl =================

function initZahlenstrahl() {
  const input = document.getElementById("strahl-input");
  const mount = document.getElementById("strahl-mount");
  const ordnungBox = document.getElementById("strahl-ordnung");

  function refresh() {
    const nums = input.value
      .split(",")
      .map((s) => parseFloat(s.trim().replace(",", ".")))
      .filter((v) => !isNaN(v))
      .slice(0, 6);
    mount.innerHTML = "";
    if (nums.length === 0) {
      ordnungBox.textContent = "Gib mindestens eine Zahl ein.";
      return;
    }
    const minV = Math.min(0, ...nums),
      maxV = Math.max(...nums);
    const pad = (maxV - minV) * 0.15 || 1;
    const lo = minV - pad,
      hi = maxV + pad;
    const W = 600,
      H = 80;
    const svg = svgEl("svg", { viewBox: `0 0 ${W} ${H}`, class: "tree-svg" });
    const x0 = 30,
      x1 = W - 30;
    function xOf(v) {
      return x0 + ((v - lo) / (hi - lo)) * (x1 - x0);
    }
    svg.appendChild(svgEl("line", { x1: x0, y1: 45, x2: x1, y2: 45, stroke: "var(--muted)", "stroke-width": 1.5 }));
    svg.appendChild(svgEl("path", { d: `M ${x1} 45 L ${x1 - 8} 40 M ${x1} 45 L ${x1 - 8} 50`, stroke: "var(--muted)", "stroke-width": 1.5, fill: "none" }));
    if (lo <= 0 && 0 <= hi) {
      const x = xOf(0);
      svg.appendChild(svgEl("line", { x1: x, y1: 38, x2: x, y2: 52, stroke: "var(--muted)", "stroke-width": 1.2 }));
      const t = svgEl("text", { x, y: 66, "text-anchor": "middle", "font-size": 10, fill: "var(--muted)" });
      t.textContent = "0";
      svg.appendChild(t);
    }
    const colors = ["#2563eb", "#1a9e7a", "#e0b91e", "#d64545", "#8a5cf6", "#8b5a2b"];
    nums.forEach((v, i) => {
      const x = xOf(v);
      svg.appendChild(svgEl("circle", { cx: x, cy: 45, r: 5, fill: colors[i % colors.length] }));
      const t = svgEl("text", { x, y: 30, "text-anchor": "middle", "font-size": 11, fill: colors[i % colors.length], "font-weight": 700 });
      t.textContent = num(v);
      svg.appendChild(t);
    });
    mount.appendChild(svg);

    const sorted = [...nums].sort((a, b) => a - b);
    ordnungBox.innerHTML = "Der Größe nach geordnet: " + sorted.map((v) => num(v)).join(" &lt; ");
  }
  input.addEventListener("input", refresh);
  refresh();
}

// ================= 4. Größen und Einheiten =================

const GROESSEN = {
  laenge: {
    einheiten: [
      { key: "mm", label: "mm", faktor: 0.001 },
      { key: "cm", label: "cm", faktor: 0.01 },
      { key: "dm", label: "dm", faktor: 0.1 },
      { key: "m", label: "m", faktor: 1 },
      { key: "km", label: "km", faktor: 1000 },
    ],
  },
  masse: {
    einheiten: [
      { key: "mg", label: "mg", faktor: 0.000001 },
      { key: "g", label: "g", faktor: 0.001 },
      { key: "kg", label: "kg", faktor: 1 },
      { key: "t", label: "t", faktor: 1000 },
    ],
  },
  zeit: {
    einheiten: [
      { key: "s", label: "s", faktor: 1 },
      { key: "min", label: "min", faktor: 60 },
      { key: "h", label: "h", faktor: 3600 },
      { key: "tage", label: "Tage", faktor: 86400 },
    ],
  },
  geld: {
    einheiten: [
      { key: "ct", label: "Cent", faktor: 0.01 },
      { key: "eur", label: "Euro", faktor: 1 },
    ],
  },
};
const VON_DEFAULT = { laenge: "m", masse: "kg", zeit: "h", geld: "eur" };
const ZIEL_DEFAULT = { laenge: "cm", masse: "g", zeit: "min", geld: "ct" };
const WERT_DEFAULT = { laenge: 3.4, masse: 2.5, zeit: 2, geld: 5.5 };

function initGroessen() {
  const artSel = document.getElementById("groessen-art");
  const wertInput = document.getElementById("groessen-wert");
  const vonSpan = document.getElementById("groessen-von-einheit");
  const zielSel = document.getElementById("groessen-ziel");
  const treppeMount = document.getElementById("groessen-treppe-mount");
  const ergebnisBox = document.getElementById("groessen-ergebnis");

  function currentVonKey() {
    return VON_DEFAULT[artSel.value];
  }
  function populateZiel() {
    const art = GROESSEN[artSel.value];
    const vonKey = currentVonKey();
    zielSel.innerHTML = "";
    art.einheiten.forEach((e) => {
      if (e.key === vonKey) return;
      zielSel.appendChild(el("option", { value: e.key }, e.label));
    });
    const ziel = ZIEL_DEFAULT[artSel.value];
    if (ziel && ziel !== vonKey) zielSel.value = ziel;
  }
  function renderTreppe() {
    const art = GROESSEN[artSel.value];
    const vonKey = currentVonKey(),
      zielKey = zielSel.value;
    treppeMount.innerHTML = "";
    const row = el("div", { class: "staircase-row" });
    art.einheiten.forEach((e, i) => {
      if (i > 0) {
        // Der Schrittfaktor beschreibt das Größenverhältnis der Einheiten. Für die Umrechnung eines
        // Messwerts zählt aber die Richtung: nach rechts (größere Einheit) wird DIVIDIERT, nach
        // links (kleinere Einheit) MULTIPLIZIERT. Beide Richtungen werden deshalb angeschrieben.
        const faktor = (e.faktor / art.einheiten[i - 1].faktor).toLocaleString("de-DE");
        row.appendChild(
          el("span", { class: "staircase-arrow" }, [
            el("span", { class: "pfeil-groesser" }, "— : " + faktor + " →"),
            el("span", { class: "pfeil-kleiner" }, "← · " + faktor + " —"),
          ])
        );
      }
      const cls = "staircase-unit" + (e.key === vonKey || e.key === zielKey ? " active" : "");
      row.appendChild(el("div", { class: cls }, e.label));
    });
    const staircase = el("div", { class: "staircase" }, row);
    staircase.appendChild(
      el("p", { class: "staircase-legende" }, [
        el("span", { class: "pfeil-groesser" }, "nach rechts"),
        " (größere Einheit) ⇒ dividieren · ",
        el("span", { class: "pfeil-kleiner" }, "nach links"),
        " (kleinere Einheit) ⇒ multiplizieren",
      ])
    );
    treppeMount.appendChild(staircase);
  }
  function refresh() {
    const art = GROESSEN[artSel.value];
    const von = art.einheiten.find((e) => e.key === currentVonKey());
    vonSpan.textContent = von.label;
    const ziel = art.einheiten.find((e) => e.key === zielSel.value);
    if (!ziel) return;
    const wert = parseFloat(String(wertInput.value).replace(",", ".")) || 0;
    const basiswert = wert * von.faktor;
    const zielwert = basiswert / ziel.faktor;
    const faktorGesamt = von.faktor / ziel.faktor;
    const multipliziert = faktorGesamt >= 1;
    const faktorAnzeige = multipliziert ? faktorGesamt : 1 / faktorGesamt;
    ergebnisBox.innerHTML =
      `${num(wert)} ${von.label} = ${num(wert)} ${von.label} ${multipliziert ? "·" : ":"} ${num(faktorAnzeige)} = <strong>${num(zielwert, 6)} ${ziel.label}</strong>`;
    renderTreppe();
  }
  artSel.addEventListener("change", () => {
    wertInput.value = WERT_DEFAULT[artSel.value];
    populateZiel();
    refresh();
  });
  zielSel.addEventListener("change", refresh);
  wertInput.addEventListener("input", refresh);

  populateZiel();
  refresh();
}

// ================= 6. Gestaffelte Übungsaufgaben =================
// Wiederverwendbarer Baustein für alle Grundwissen-Lernpfade: Aufgabe 1 (einfach) ist immer
// sichtbar, Aufgabe 2-4 (mittel/schwierig/komplex) liegen hinter Reitern. Jede Aufgabe hat einen
// Würfel-Knopf, der dieselbe Aufgabenart mit neuen Zufallszahlen neu stellt. Beim Prüfen werden
// Fehler UND eine Musterlösung angezeigt.

// Die Werkbank für die Übungsaufgaben ist für alle Grundwissen-Seiten dieselbe und steht in
// ../../aufgaben.js. Mitgegeben wird nur, wie DIESE Seite eine Eingabe als Zahl liest.
const mountUebungsaufgaben = (container, defs) =>
  mountUebungsaufgabenBasis(container, defs, { parse: parseFlexibleNumber });

// ---------- Aufgaben-Definitionen ----------

function generateAufgabe1() {
  const n = randInt(1000, 98999);
  const stellenOptions = [
    { v: 10, label: "Zehner", nachbar: "Einer" },
    { v: 100, label: "Hunderter", nachbar: "Zehner" },
    { v: 1000, label: "Tausender", nachbar: "Hunderter" },
  ];
  const s = stellenOptions[randInt(0, 2)];
  const correct = Math.round(n / s.v) * s.v;
  const nachbarDigit = Math.floor(n / (s.v / 10)) % 10;
  return {
    promptHtml: `Runde <strong>${n.toLocaleString("de-DE")}</strong> auf ${s.label} genau.`,
    correct,
    tolerance: 0.5,
    placeholder: "gerundete Zahl",
    hinweis: (roh, val) =>
      Math.abs(val - n) < 0.5
        ? "Das ist die Ausgangszahl — sie ist noch nicht gerundet."
        : Math.abs(val - (nachbarDigit >= 5 ? correct - s.v : correct + s.v)) < 0.5
          ? "Auf- und Abrunden sind vertauscht: Ab 5 wird aufgerundet, darunter abgerundet."
          : "",
    tipps: [
      `Gerundet wird auf ${s.label}. Entscheidend ist allein die Ziffer <em>rechts daneben</em> — die ${s.nachbar}-Ziffer.`,
      "Ist diese Ziffer 5 oder größer, wird aufgerundet, sonst abgerundet. Alle Stellen rechts davon werden 0.",
      `Hier ist die ${s.nachbar}-Ziffer eine ${nachbarDigit}.`,
    ],
    musterloesungHtml: `Die ${s.nachbar}-Ziffer (rechts neben der ${s.label}-Stelle) ist ${nachbarDigit} → ${nachbarDigit >= 5 ? "aufrunden" : "abrunden"}.<br>${n.toLocaleString("de-DE")} ≈ <strong>${correct.toLocaleString("de-DE")}</strong>`,
  };
}
function generateAufgabe2() {
  const ht = randInt(1, 9),
    zt = randInt(0, 9),
    t = randInt(0, 9),
    h = randInt(0, 9),
    z = randInt(0, 9),
    e = randInt(0, 9);
  const correct = ht * 100000 + zt * 10000 + t * 1000 + h * 100 + z * 10 + e;
  return {
    promptHtml: `Welche Zahl ergibt sich aus ${ht} Hunderttausendern, ${zt} Zehntausendern, ${t} Tausendern, ${h} Hundertern, ${z} Zehnern und ${e} Einern?`,
    correct,
    tolerance: 0.5,
    placeholder: "Zahl",
    hinweis: (roh, val) => {
      const ohneNullen = Number([ht, zt, t, h, z, e].filter((d) => d !== 0).join(""));
      return Math.abs(val - ohneNullen) < 0.5 && ohneNullen !== correct
        ? "Die Nullen dürfen nicht wegfallen: Sie halten die leeren Stellen frei."
        : "";
    },
    tipps: [
      "Schreibe sechs Kästchen nebeneinander: Hunderttausender, Zehntausender, Tausender, Hunderter, Zehner, Einer.",
      "Trage in jedes Kästchen die genannte Ziffer ein — auch dann, wenn es eine 0 ist.",
      "Erst am Ende alle Ziffern ohne Lücke hintereinander lesen.",
    ],
    musterloesungHtml: `${ht}·100.000 + ${zt}·10.000 + ${t}·1.000 + ${h}·100 + ${z}·10 + ${e}·1 = <strong>${correct.toLocaleString("de-DE")}</strong>`,
  };
}
function generateAufgabe3() {
  const t = randInt(1, 9);
  const kg = randInt(1, 49) * 10;
  const correct = t * 1000 + kg;
  return {
    promptHtml: `Ein Lkw wiegt leer ${t}&nbsp;t. Er wird mit ${kg}&nbsp;kg Fracht beladen. Wie viel wiegt er beladen, in Kilogramm?`,
    correct,
    tolerance: 0.5,
    placeholder: "Gewicht in kg",
    hinweis: (roh, val) =>
      Math.abs(val - (t + kg)) < 0.5
        ? "Hier wurden Tonnen und Kilogramm zusammengezählt, ohne umzurechnen: 1 t sind 1000 kg."
        : "",
    tipps: [
      "Beide Angaben müssen zuerst in <em>derselben</em> Einheit stehen.",
      "1 t = 1000 kg — rechne das Leergewicht in Kilogramm um.",
      `${t}&nbsp;t = ${(t * 1000).toLocaleString("de-DE")}&nbsp;kg. Dazu kommt die Fracht.`,
    ],
    musterloesungHtml: `${t}&nbsp;t = ${(t * 1000).toLocaleString("de-DE")}&nbsp;kg. Beladen: ${(t * 1000).toLocaleString("de-DE")}&nbsp;kg + ${kg.toLocaleString("de-DE")}&nbsp;kg = <strong>${correct.toLocaleString("de-DE")}&nbsp;kg</strong>`,
  };
}
function generateAufgabe4() {
  const a = randInt(5, 12),
    b = randInt(60, 95),
    c = randInt(3, 8),
    d = randInt(150, 320);
  const totalKg = a * b + c * d;
  const correct = Math.round(totalKg / 1000);
  return {
    promptHtml: `In einem Lager stehen ${a} Kisten mit je ${b}&nbsp;kg und ${c} Kisten mit je ${d}&nbsp;kg. Runde das Gesamtgewicht auf volle Tonnen (1&nbsp;t = 1000&nbsp;kg). Gib die Anzahl der Tonnen an.`,
    correct,
    tolerance: 0.5,
    placeholder: "Tonnen (Zahl)",
    hinweis: (roh, val) =>
      Math.abs(val - totalKg) < 0.5
        ? "Das ist das Gesamtgewicht in Kilogramm. Gefragt sind volle Tonnen."
        : Math.abs(val - Math.floor(totalKg / 1000)) < 0.5 && Math.floor(totalKg / 1000) !== correct
          ? "Hier wurde abgeschnitten statt gerundet: Ab 500 kg wird zur nächsten Tonne aufgerundet."
          : "",
    tipps: [
      "Rechne zuerst beide Stapel getrennt aus und addiere sie.",
      "1 t = 1000 kg — runden auf volle Tonnen heißt runden auf volle Tausender.",
      "Entscheidend ist die Hunderterziffer des Gesamtgewichts.",
    ],
    musterloesungHtml: `Gesamtgewicht: ${a}·${b}&nbsp;kg + ${c}·${d}&nbsp;kg = ${(a * b).toLocaleString("de-DE")}&nbsp;kg + ${(c * d).toLocaleString("de-DE")}&nbsp;kg = ${totalKg.toLocaleString("de-DE")}&nbsp;kg.<br>Gerundet auf volle Tausender (Tonnen): <strong>${correct}&nbsp;t</strong>`,
  };
}

// Aufgabe 2 — den Stellenwert einer Ziffer lesen. Die Ziffer kommt in der Zahl genau einmal vor,
// sonst wäre die Frage „die Ziffer d“ nicht eindeutig; gebaut wird die Zahl deshalb aus lauter
// verschiedenen Ziffern statt gewürfelt und geprüft.
function generateAufgabe2b() {
  const stellen = [
    { v: 1, label: "Einer" },
    { v: 10, label: "Zehner" },
    { v: 100, label: "Hunderter" },
    { v: 1000, label: "Tausender" },
    { v: 10000, label: "Zehntausender" },
  ];
  const ziffern = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  for (let i = ziffern.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [ziffern[i], ziffern[j]] = [ziffern[j], ziffern[i]];
  }
  const fuenf = ziffern.slice(0, 5);
  if (fuenf[4] === 0) [fuenf[4], fuenf[0]] = [fuenf[0], fuenf[4]];   // keine führende Null
  const pos = randInt(0, 4);
  if (fuenf[pos] === 0) fuenf[pos] = ziffern[5] || 7;                // die gefragte Ziffer ist nicht 0
  const n = fuenf.reduce((acc, z, i) => acc + z * Math.pow(10, i), 0);
  const d = fuenf[pos];
  const stelle = stellen[pos];
  const correct = d * stelle.v;
  return {
    promptHtml:
      `In der Zahl <strong>${n.toLocaleString("de-DE")}</strong> steht die Ziffer <strong>${d}</strong>. ` +
      `Wie viel ist sie an ihrer Stelle <em>wert</em>?`,
    correct,
    tolerance: 0.5,
    placeholder: "Wert der Ziffer",
    hinweis: (roh, val) =>
      Math.abs(val - d) < 0.5
        ? "Das ist die Ziffer selbst. Gefragt ist ihr <em>Stellenwert</em>: Sie steht an der " + stelle.label + "-Stelle."
        : Math.abs(val - stelle.v) < 0.5
          ? "Das ist der Wert der Stelle, aber die Ziffer steht noch davor: " + d + " · " + stelle.v.toLocaleString("de-DE") + "."
          : "",
    tipps: [
      "Zähle die Stellen von <em>rechts</em> ab: Einer, Zehner, Hunderter, Tausender, Zehntausender.",
      `Die ${d} steht an der <strong>${stelle.label}</strong>-Stelle. Eine Ziffer dort ist ${stelle.v.toLocaleString("de-DE")} wert.`,
      `Also: ${d} · ${stelle.v.toLocaleString("de-DE")}.`,
    ],
    musterloesungHtml:
      `${n.toLocaleString("de-DE")} = ` +
      fuenf.map((z, i) => `${z} · ${Math.pow(10, i).toLocaleString("de-DE")}`).reverse().join(" + ") + `<br>` +
      `Die ${d} steht an der ${stelle.label}-Stelle: ${d} · ${stelle.v.toLocaleString("de-DE")} = <strong>${correct.toLocaleString("de-DE")}</strong>`,
  };
}

// Aufgabe 4 — die Mitte zweier Zahlen auf dem Zahlenstrahl. Die Mitte ist immer eine ganze Zahl:
// Gewürfelt wird der halbe Abstand und die KLEINERE Zahl, nicht die beiden Enden. Aus Mitte und
// halbem Abstand gewürfelt konnte die kleinere Zahl negativ werden — auf einer Seite über
// natürliche Zahlen hat eine negative Zahl nichts verloren.
function generateAufgabe4b() {
  const halb = randInt(3, 60) * 10;
  const a = randInt(1, 480) * 10;
  const mitte = a + halb, b = mitte + halb;
  return {
    promptHtml:
      `Auf dem Zahlenstrahl liegen <strong>${a.toLocaleString("de-DE")}</strong> und <strong>${b.toLocaleString("de-DE")}</strong>. ` +
      `Welche Zahl liegt genau in der <strong>Mitte</strong> zwischen den beiden?`,
    correct: mitte,
    tolerance: 0.5,
    placeholder: "Zahl",
    hinweis: (roh, val) =>
      Math.abs(val - 2 * halb) < 0.5
        ? "Das ist der <em>Abstand</em> der beiden Zahlen. Die Mitte liegt einen halben Abstand rechts von der kleineren Zahl."
        : Math.abs(val - (a + b)) < 0.5
          ? "Du hast die beiden Zahlen nur addiert. Die Mitte ist die <em>Hälfte</em> dieser Summe."
          : "",
    tipps: [
      "Die Mitte liegt von beiden Zahlen gleich weit entfernt.",
      `Abstand der beiden Zahlen: ${b.toLocaleString("de-DE")} − ${a.toLocaleString("de-DE")} = ${(2 * halb).toLocaleString("de-DE")}. Davon die Hälfte ist ${halb.toLocaleString("de-DE")}.`,
      `Von ${a.toLocaleString("de-DE")} aus ${halb.toLocaleString("de-DE")} nach rechts.`,
    ],
    musterloesungHtml:
      `Abstand: ${b.toLocaleString("de-DE")} − ${a.toLocaleString("de-DE")} = ${(2 * halb).toLocaleString("de-DE")}<br>` +
      `Halber Abstand: ${(2 * halb).toLocaleString("de-DE")} : 2 = ${halb.toLocaleString("de-DE")}<br>` +
      `Mitte: ${a.toLocaleString("de-DE")} + ${halb.toLocaleString("de-DE")} = <strong>${mitte.toLocaleString("de-DE")}</strong> ` +
      `(Probe: ${b.toLocaleString("de-DE")} − ${halb.toLocaleString("de-DE")} = ${mitte.toLocaleString("de-DE")})`,
  };
}

// Aufgabe 6 — dieselbe Länge in drei Schreibweisen. Drei Felder, weil das Umrechnen in beide
// Richtungen und das Ergänzen zur nächsten runden Größe drei verschiedene Schritte sind: Wer nur
// eine Zahl abgibt, weiß nicht, welcher davon gesessen hat.
function generateAufgabe6() {
  const km = randInt(1, 8);
  const m = randInt(1, 19) * 50;           // 50 m … 950 m, nie 0
  const gesamtM = km * 1000 + m;
  const bisNaechstesKm = 1000 - m;
  return {
    promptHtml:
      `Ein Wanderweg ist <strong>${km}&nbsp;km ${m}&nbsp;m</strong> lang.`,
    felder: [
      {
        name: "die Länge in Metern", soll: gesamtM, einheit: "m", toleranz: 0.5,
        hinweis: (roh, val) => (Math.abs(val - (km + m)) < 0.5 ? "Hier wurden Kilometer und Meter einfach addiert. 1 km sind aber 1000 m." : ""),
      },
      {
        name: "die Länge in Zentimetern", soll: gesamtM * 100, einheit: "cm", toleranz: 0.5,
        hinweis: (roh, val) => (Math.abs(val - gesamtM * 10) < 0.5 ? "Das wären Dezimeter. 1 m sind 100 cm." : ""),
      },
      {
        name: `wie viele Meter noch bis ${km + 1}&nbsp;km fehlen`, soll: bisNaechstesKm, einheit: "m", toleranz: 0.5,
        hinweis: (roh, val) => (Math.abs(val - m) < 0.5 ? "Das ist der Teil, der über die vollen Kilometer hinausgeht. Gefragt ist das, was noch fehlt." : ""),
      },
    ],
    tipps: [
      "1 km = 1000 m, 1 m = 100 cm. In die <em>kleinere</em> Einheit wird multipliziert.",
      `${km}&nbsp;km = ${(km * 1000).toLocaleString("de-DE")}&nbsp;m; dazu noch ${m}&nbsp;m.`,
      `Bis zum nächsten vollen Kilometer fehlen 1000&nbsp;m − ${m}&nbsp;m.`,
    ],
    musterloesungHtml:
      `In Metern: ${km} · 1000&nbsp;m + ${m}&nbsp;m = <strong>${gesamtM.toLocaleString("de-DE")}&nbsp;m</strong><br>` +
      `In Zentimetern: ${gesamtM.toLocaleString("de-DE")}&nbsp;m · 100 = <strong>${(gesamtM * 100).toLocaleString("de-DE")}&nbsp;cm</strong><br>` +
      `Bis ${km + 1}&nbsp;km: 1000&nbsp;m − ${m}&nbsp;m = <strong>${bisNaechstesKm.toLocaleString("de-DE")}&nbsp;m</strong>`,
  };
}

// Aufgabe 8 — vier Zahlen ordnen, runden und vergleichen. Die vier Zahlen sind paarweise
// verschieden, sonst gäbe es „die größte“ zweimal; gebaut werden sie aus verschiedenen Tausender-
// Stufen, damit das ohne Verwerfen sicher ist.
function generateAufgabe8() {
  const basen = [0, 1, 2, 3];
  for (let i = basen.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [basen[i], basen[j]] = [basen[j], basen[i]];
  }
  const zahlen = basen.map((b) => (b * 20 + randInt(1, 19)) * 1000 + randInt(0, 999));
  const groesste = Math.max(...zahlen);
  const kleinste = Math.min(...zahlen);
  const gerundet = Math.round(groesste / 1000) * 1000;
  return {
    promptHtml:
      `Gegeben sind die vier Zahlen <strong>${zahlen.map((z) => z.toLocaleString("de-DE")).join("</strong>, <strong>")}</strong>.`,
    felder: [
      { name: "die größte Zahl", soll: groesste, toleranz: 0.5, platzhalter: "Zahl" },
      { name: "die kleinste Zahl", soll: kleinste, toleranz: 0.5, platzhalter: "Zahl" },
      {
        name: "die größte Zahl, auf Tausender gerundet", soll: gerundet, toleranz: 0.5, platzhalter: "Zahl",
        hinweis: (roh, val) =>
          Math.abs(val - Math.floor(groesste / 1000) * 1000) < 0.5 && gerundet !== Math.floor(groesste / 1000) * 1000
            ? "Hier wurden die hinteren Stellen einfach weggelassen. Beim Runden entscheidet die Hunderterziffer."
            : "",
      },
      { name: "die Differenz größte − kleinste", soll: groesste - kleinste, toleranz: 0.5, platzhalter: "Zahl" },
    ],
    tipps: [
      "Vergleiche die Zahlen Stelle für Stelle von <em>links</em>: Erst die Zehntausender, dann die Tausender …",
      "Beim Runden auf Tausender entscheidet die Ziffer rechts daneben — die Hunderterziffer.",
      `Die größte ist ${groesste.toLocaleString("de-DE")}, die kleinste ${kleinste.toLocaleString("de-DE")}.`,
    ],
    musterloesungHtml:
      `Der Größe nach geordnet: ${[...zahlen].sort((x, y) => x - y).map((z) => z.toLocaleString("de-DE")).join(" &lt; ")}<br>` +
      `Größte: <strong>${groesste.toLocaleString("de-DE")}</strong>, kleinste: <strong>${kleinste.toLocaleString("de-DE")}</strong><br>` +
      `Die größte auf Tausender gerundet: Hunderterziffer ist ${Math.floor(groesste / 100) % 10} → ` +
      `${Math.floor(groesste / 100) % 10 >= 5 ? "aufrunden" : "abrunden"} → <strong>${gerundet.toLocaleString("de-DE")}</strong><br>` +
      `Differenz: ${groesste.toLocaleString("de-DE")} − ${kleinste.toLocaleString("de-DE")} = <strong>${(groesste - kleinste).toLocaleString("de-DE")}</strong>`,
  };
}

function initExercises() {
  mountUebungsaufgaben(document.getElementById("exercises-mount"), [
    { schwierigkeit: "einfach", titel: "Aufgabe 1 — Runden", generate: generateAufgabe1 },
    { schwierigkeit: "einfach", titel: "Aufgabe 2 — Stellenwert einer Ziffer", generate: generateAufgabe2b },
    { schwierigkeit: "mittel", titel: "Aufgabe 3 — Stellenwerte zusammensetzen", generate: generateAufgabe2 },
    { schwierigkeit: "mittel", titel: "Aufgabe 4 — die Mitte auf dem Zahlenstrahl", generate: generateAufgabe4b },
    { schwierigkeit: "schwierig", titel: "Aufgabe 5 — Größen addieren", generate: generateAufgabe3 },
    { schwierigkeit: "schwierig", titel: "Aufgabe 6 — eine Länge in drei Schreibweisen", generate: generateAufgabe6 },
    { schwierigkeit: "komplex", titel: "Aufgabe 7 — Größen, Runden und Rechnen kombiniert", generate: generateAufgabe4 },
    { schwierigkeit: "komplex", titel: "Aufgabe 8 — ordnen, runden, vergleichen", generate: generateAufgabe8 },
  ]);
}

// ================= Quizze =================

function initQuizzes() {
  mountQuiz(document.getElementById("quiz-stellenwertsystem"), {
    q: "Welchen Stellenwert hat die Ziffer 7 in der Zahl 4708?",
    options: ["Zehner", "Hunderter", "Tausender", "Einer"],
    correct: 1,
    explain: "4708 = 4 Tausender, 7 Hunderter, 0 Zehner, 8 Einer.",
  });
  mountQuiz(document.getElementById("quiz-runden"), {
    q: "Welche Ziffer entscheidet beim Runden auf Hunderter, ob auf- oder abgerundet wird?",
    options: ["Die Einerziffer", "Die Zehnerziffer", "Die Hunderterziffer selbst", "Die Tausenderziffer"],
    correct: 1,
    explain: "Man schaut immer auf die Ziffer direkt rechts neben der Rundungsstelle — bei Hunderter-Rundung ist das die Zehnerziffer.",
  });
  mountQuiz(document.getElementById("quiz-zahlenstrahl"), {
    q: "Auf dem Zahlenstrahl steht 45 links von 76. Welche Aussage stimmt?",
    options: ["45 > 76", "45 < 76", "45 = 76", "Man kann es nicht sagen"],
    correct: 1,
    explain: "Auf dem Zahlenstrahl wachsen die Zahlen nach rechts. Was weiter links steht, ist also kleiner: 45 < 76. Das Zeichen < zeigt dabei immer zur kleineren Zahl. Gleich sind zwei Zahlen nur, wenn sie an derselben Stelle stehen — hier liegen sie sichtbar auseinander.",
  });
  mountQuiz(document.getElementById("quiz-groessen"), {
    q: "Du rechnest 3,4 m in cm um. Was musst du tun?",
    options: ["Mit 100 multiplizieren", "Durch 100 dividieren", "Mit 10 multiplizieren", "Durch 1000 dividieren"],
    correct: 0,
    explain: "cm ist die kleinere Einheit (1 m = 100 cm) — beim Umrechnen in eine kleinere Einheit wird multipliziert.",
  });
}

// ================= Start =================

document.addEventListener("DOMContentLoaded", () => {
  initStellenwertsystem();
  initRunden();
  initZahlenstrahl();
  initGroessen();
  initExercises();
  initQuizzes();
});
