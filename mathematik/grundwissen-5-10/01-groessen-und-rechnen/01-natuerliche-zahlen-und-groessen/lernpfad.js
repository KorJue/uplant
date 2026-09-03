// Selbstlernpfad "Natürliche Zahlen und Größen" (Grundwissen Klasse 5-10). Rein clientseitiges
// Vanilla-JS, ohne Build-Schritt oder externe Bibliotheken — wie der Rest der Seite. Aufbau: kleine
// DOM/SVG-Helfer, dann je ein Abschnitt (Stellenwertsystem, Runden, Zahlenstrahl, Größen), zuletzt
// die gestaffelten Übungsaufgaben (einfach direkt sichtbar, mittel/schwierig/komplex per Reiter,
// mit Würfel-Knopf für neue Zahlen).

"use strict";

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

function mountStaffelAufgabe(container, def) {
  const box = el("div", { class: "aufgabe-box" });
  box.appendChild(el("h3", {}, [def.titel, el("span", { class: "schwierigkeit-badge " + def.schwierigkeit }, def.schwierigkeit)]));
  const promptEl = el("div", { class: "aufgabe-prompt" });
  box.appendChild(promptEl);
  const row = el("div", { class: "exercise-input-row" });
  const input = el("input", { type: "text", placeholder: "Antwort" });
  const btnPruefen = el("button", { type: "button", class: "btn btn-primary" }, "Prüfen");
  const btnWuerfeln = el("button", { type: "button", class: "btn" }, "🎲 Neue Zahlen");
  row.appendChild(input);
  row.appendChild(btnPruefen);
  row.appendChild(btnWuerfeln);
  box.appendChild(row);
  const feedback = el("div", { class: "aufgabe-feedback" });
  box.appendChild(feedback);

  let current;
  function neueAufgabe() {
    current = def.generate();
    promptEl.innerHTML = current.promptHtml;
    input.value = "";
    input.placeholder = current.placeholder || "Antwort";
    feedback.innerHTML = "";
  }
  btnPruefen.addEventListener("click", () => {
    const raw = input.value.trim();
    const val = parseFlexibleNumber(raw);
    const tol = current.tolerance ?? 0.01;
    const ok = !isNaN(val) && Math.abs(val - current.correct) < tol;
    const statusHtml = ok
      ? `<div class="status ok">✓ Richtig!</div>`
      : `<div class="status err">✗ Noch nicht richtig${raw ? " — deine Eingabe: " + raw : " — du hast noch keine Antwort eingetragen"}.</div>`;
    feedback.innerHTML = statusHtml + `<div class="musterloesung"><span class="ml-label">Musterlösung</span>${current.musterloesungHtml}</div>`;
  });
  btnWuerfeln.addEventListener("click", neueAufgabe);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") btnPruefen.click();
  });

  neueAufgabe();
  container.appendChild(box);
}

function mountUebungsaufgaben(container, defs) {
  mountStaffelAufgabe(container, defs[0]);

  const tabBar = el("div", { class: "schwierigkeit-tabs" });
  const panel = el("div", { class: "schwierigkeit-tab-panel" });
  container.appendChild(tabBar);
  container.appendChild(panel);

  const rest = defs.slice(1);
  function showTab(idx) {
    [...tabBar.children].forEach((b, i) => b.classList.toggle("active", i === idx));
    panel.innerHTML = "";
    mountStaffelAufgabe(panel, rest[idx]);
  }
  rest.forEach((d, i) => {
    const label = d.schwierigkeit.charAt(0).toUpperCase() + d.schwierigkeit.slice(1);
    const btn = el("button", { type: "button" }, label);
    btn.addEventListener("click", () => showTab(i));
    tabBar.appendChild(btn);
  });
  showTab(0);
}

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
    musterloesungHtml: `Gesamtgewicht: ${a}·${b}&nbsp;kg + ${c}·${d}&nbsp;kg = ${(a * b).toLocaleString("de-DE")}&nbsp;kg + ${(c * d).toLocaleString("de-DE")}&nbsp;kg = ${totalKg.toLocaleString("de-DE")}&nbsp;kg.<br>Gerundet auf volle Tausender (Tonnen): <strong>${correct}&nbsp;t</strong>`,
  };
}

function initExercises() {
  mountUebungsaufgaben(document.getElementById("exercises-mount"), [
    { schwierigkeit: "einfach", titel: "Aufgabe 1 — Runden", generate: generateAufgabe1 },
    { schwierigkeit: "mittel", titel: "Aufgabe 2 — Stellenwerte zusammensetzen", generate: generateAufgabe2 },
    { schwierigkeit: "schwierig", titel: "Aufgabe 3 — Größen addieren", generate: generateAufgabe3 },
    { schwierigkeit: "komplex", titel: "Aufgabe 4 — Größen, Runden und Rechnen kombiniert", generate: generateAufgabe4 },
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
    explain: "Weiter links bedeutet kleiner: 45 < 76.",
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
