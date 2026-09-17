// Selbstlernpfad "Brüche und Dezimalzahlen multiplizieren und dividieren" (Grundwissen Klasse 5-10).
// Rein clientseitiges Vanilla-JS, ohne Build-Schritt oder externe Bibliotheken.
//
// Wie in den Lernpfaden 3 und 4 gilt: Brüche werden ganzzahlig als Zähler/Nenner-Paare gerechnet,
// Dezimalzahlen ziffernweise über Ganzzahl-Produkte plus Kommaposition. Ein Umweg über
// Gleitkommazahlen würde hier besonders auffallen — 0,1 · 3 ergibt in double-Arithmetik
// 0,30000000000000004, und genau die Stellenzahl ist in diesem Thema der Lerngegenstand.

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
// Dezimalzahl mit fester Stellenzahl, deutsch geschrieben — anders als num() bleibt die Null
// hinter dem Komma stehen.
function dez(x, stellen) {
  return x.toFixed(stellen).replace(".", ",");
}
// Dezimalzahl ohne überflüssige Nullen hinter dem Komma: 4,00 → „4“, 3,50 → „3,5“.
function dezKurz(x) {
  return String(Number(x.toFixed(4))).replace(".", ",");
}
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function clampInt(v, lo, hi) {
  const n = Math.round(Number(v));
  if (isNaN(n)) return lo;
  return Math.max(lo, Math.min(hi, n));
}
function ggT(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    const t = a % b;
    a = b;
    b = t;
  }
  return a || 1;
}
function kuerze(z, n) {
  const g = ggT(z, n);
  return { z: z / g, n: n / g, g };
}
function bruchHtml(z, n, cls = "") {
  return `<span class="bruch ${cls}"><span class="z">${z}</span><span class="n">${n}</span></span>`;
}
function gemischtHtml(z, n) {
  if (z < n) return bruchHtml(z, n);
  const ganze = Math.floor(z / n);
  const rest = z - ganze * n;
  return rest === 0 ? `<strong>${ganze}</strong>` : `<strong>${ganze}</strong>${bruchHtml(rest, n)}`;
}

function parseFlexibleNumber(raw) {
  if (raw == null) return NaN;
  let s = String(raw).trim().replace(/\s/g, "");
  let asPercent = false;
  if (s.endsWith("%")) {
    asPercent = true;
    s = s.slice(0, -1);
  }
  let val;
  if (s.includes("/")) {
    const [a, b] = s.split("/").map((p) => parseFloat(p.replace(/\./g, "").replace(",", ".")));
    val = a / b;
  } else {
    val = parseFloat(s.replace(/\./g, "").replace(",", "."));
  }
  if (asPercent) val /= 100;
  return val;
}
function parseBruchEingabe(raw) {
  const m = String(raw).trim().replace(/\s/g, "").match(/^(\d+)\/(\d+)$/);
  if (!m) return null;
  const n = Number(m[2]);
  if (n === 0) return null;
  return { z: Number(m[1]), n };
}
function dezimalTeile(raw) {
  const s = String(raw).trim().replace(/\./g, ",");
  const m = s.match(/^(\d*)(?:,(\d*))?$/);
  if (!m) return null;
  return { ganz: m[1] === "" ? "0" : m[1], nach: m[2] || "" };
}
// Setzt in eine Ziffernfolge ein Komma so, dass rechts davon "stellen" Ziffern stehen.
function kommaSetzen(ziffern, stellen) {
  let s = String(ziffern);
  if (stellen === 0) return s.replace(/^0+(?=\d)/, "");
  s = s.padStart(stellen + 1, "0");
  const ganz = s.slice(0, s.length - stellen).replace(/^0+(?=\d)/, "");
  const nach = s.slice(s.length - stellen).replace(/0+$/, "");
  return nach ? `${ganz},${nach}` : ganz;
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

// ---------- Balkenmodell ----------

function balkenAnteil(gefuellt, n, w = 250, h = 30, klasse = "anteil-teil") {
  const svg = svgEl("svg", { viewBox: `0 0 ${w} ${h}`, width: w, height: h });
  const bw = w / n;
  for (let i = 0; i < n; i++) {
    svg.appendChild(
      svgEl("rect", { x: (i * bw).toFixed(2), y: 0, width: bw.toFixed(2), height: h, class: i < gefuellt ? klasse : "anteil-rest" })
    );
  }
  return svg;
}
function summeZeile(label, gefuellt, n, klasse, w = 250) {
  return el("div", { class: "summe-zeile" }, [
    el("div", { class: "summe-label" }, label),
    balkenAnteil(Math.max(0, Math.min(gefuellt, n)), n, w, 30, klasse),
  ]);
}

// ================= 1. Bruch mal natürliche Zahl =================

function renderVervielfachen() {
  const z = clampInt(document.getElementById("vv-z").value, 0, 12);
  const n = clampInt(document.getElementById("vv-n").value, 1, 12);
  const k = clampInt(document.getElementById("vv-k").value, 1, 8);
  const zErg = z * k;
  const mount = document.getElementById("vv-mount");
  mount.innerHTML = "";

  // k Balken mit je z/n — zusammen sind das z·k Teile der Größe 1/n.
  for (let i = 0; i < k; i++) {
    mount.appendChild(summeZeile(i === 0 ? `${z}/${n}` : `+ ${z}/${n}`, z, n, "anteil-teil", 180));
  }
  const kr = kuerze(zErg, n);
  document.getElementById("vv-text").innerHTML =
    `${bruchHtml(z, n)} · ${k} = ${bruchHtml(`${z} · ${k}`, n)} = ${bruchHtml(zErg, n, "gross")}` +
    (kr.g > 1 ? ` = ${bruchHtml(kr.z, kr.n, "gross")} (gekürzt mit ${kr.g})` : "") +
    (kr.z >= kr.n && kr.n !== 1 ? ` = ${gemischtHtml(kr.z, kr.n)}` : "") +
    `<br><span class="progress-note">Die Teile bleiben ${n}-tel — es werden nur ${k}-mal so viele. Deshalb ändert sich nur der Zähler.</span>`;
}
function initVervielfachen() {
  ["vv-z", "vv-n", "vv-k"].forEach((id) => document.getElementById(id).addEventListener("input", renderVervielfachen));
  renderVervielfachen();
}

// ================= 2. Bruch mal Bruch: Flächenmodell =================

function renderBruchMalBruch() {
  const z1 = clampInt(document.getElementById("bb-z1").value, 0, 8);
  const n1 = clampInt(document.getElementById("bb-n1").value, 1, 8);
  const z2 = clampInt(document.getElementById("bb-z2").value, 0, 8);
  const n2 = clampInt(document.getElementById("bb-n2").value, 1, 8);

  const mount = document.getElementById("bb-mount");
  mount.innerHTML = "";
  const S = 210;
  const svg = svgEl("svg", { viewBox: `0 0 ${S} ${S}`, width: S, height: S });
  const zh = S / n1, // Zeilenhöhe: der erste Bruch teilt waagerecht
    sb = S / n2; // Spaltenbreite: der zweite Bruch teilt senkrecht
  for (let r = 0; r < n1; r++) {
    for (let c = 0; c < n2; c++) {
      const inReihe = r < Math.min(z1, n1);
      const inSpalte = c < Math.min(z2, n2);
      const klasse = inReihe && inSpalte ? "fm-schnitt" : inReihe ? "fm-reihe" : inSpalte ? "fm-spalte" : "fm-zelle";
      svg.appendChild(svgEl("rect", { x: (c * sb).toFixed(2), y: (r * zh).toFixed(2), width: sb.toFixed(2), height: zh.toFixed(2), class: klasse }));
    }
  }
  svg.appendChild(svgEl("rect", { x: 0, y: 0, width: S, height: S, class: "fm-rahmen" }));
  mount.appendChild(svg);
  mount.appendChild(
    el("div", { class: "fm-legende" }, [
      el("span", { html: `<span class="fm-swatch" style="background:#2563eb;opacity:0.4"></span>${z1}/${n1} (waagerecht)` }),
      el("span", { html: `<span class="fm-swatch" style="background:#1a9e7a;opacity:0.4"></span>${z2}/${n2} (senkrecht)` }),
      el("span", { html: `<span class="fm-swatch" style="background:#8a5cf6"></span>Überschneidung = das Produkt` }),
    ])
  );

  const zP = z1 * z2,
    nP = n1 * n2;
  const k = kuerze(zP, nP);
  document.getElementById("bb-text").innerHTML =
    `${bruchHtml(z1, n1)} · ${bruchHtml(z2, n2)} = ${bruchHtml(`${z1} · ${z2}`, `${n1} · ${n2}`)} = ${bruchHtml(zP, nP, "gross")}` +
    (k.g > 1 ? ` = ${bruchHtml(k.z, k.n, "gross")} (gekürzt mit ${k.g})` : "") +
    `<br><span class="progress-note">Das Quadrat hat ${n1} · ${n2} = ${nP} gleich große Kästchen; ${z1} · ${z2} = ${zP} davon sind doppelt markiert. Genau das ist das Produkt.</span>`;
}
function initBruchMalBruch() {
  ["bb-z1", "bb-n1", "bb-z2", "bb-n2"].forEach((id) => document.getElementById(id).addEventListener("input", renderBruchMalBruch));
  renderBruchMalBruch();
}

// Kürzen VOR dem Multiplizieren: über Kreuz und innerhalb der Brüche.
function renderKuerzenVorher() {
  const z1 = clampInt(document.getElementById("kv-z1").value, 1, 24);
  const n1 = clampInt(document.getElementById("kv-n1").value, 1, 24);
  const z2 = clampInt(document.getElementById("kv-z2").value, 1, 24);
  const n2 = clampInt(document.getElementById("kv-n2").value, 1, 24);

  // Über Kreuz kürzen: z1 mit n2 und z2 mit n1.
  const g1 = ggT(z1, n2),
    g2 = ggT(z2, n1);
  const z1k = z1 / g1,
    n2k = n2 / g1,
    z2k = z2 / g2,
    n1k = n1 / g2;
  const zP = z1 * z2,
    nP = n1 * n2;
  const end = kuerze(zP, nP);

  const strich = (alt, neu) => (alt === neu ? String(alt) : `<span class="gekuerzt">${alt}</span><span class="ersatz">${neu}</span>`);

  document.getElementById("kv-mount").innerHTML =
    (g1 === 1 && g2 === 1
      ? `Hier lässt sich vorher nichts kürzen: ggT(${z1}; ${n2}) = 1 und ggT(${z2}; ${n1}) = 1.<br>` +
        `${bruchHtml(z1, n1)} · ${bruchHtml(z2, n2)} = ${bruchHtml(zP, nP, "gross")}` +
        (end.g > 1 ? ` = ${bruchHtml(end.z, end.n, "gross")} (erst hinterher gekürzt mit ${end.g})` : "")
      : `Vor dem Ausrechnen über Kreuz kürzen` +
        (g1 > 1 ? `: ggT(${z1}; ${n2}) = ${g1}` : "") +
        (g2 > 1 ? `${g1 > 1 ? " und " : ": "}ggT(${z2}; ${n1}) = ${g2}` : "") +
        `<br>${bruchHtml(strich(z1, z1k), strich(n1, n1k))} · ${bruchHtml(strich(z2, z2k), strich(n2, n2k))} = ` +
        `${bruchHtml(`${z1k} · ${z2k}`, `${n1k} · ${n2k}`)} = ${bruchHtml(z1k * z2k, n1k * n2k, "gross")}<br>` +
        `<span class="progress-note">Ohne Vorkürzen käme ${bruchHtml(zP, nP)} heraus — dasselbe Ergebnis, aber mit deutlich größeren Zahlen.</span>`);
}
function initKuerzenVorher() {
  ["kv-z1", "kv-n1", "kv-z2", "kv-n2"].forEach((id) => document.getElementById(id).addEventListener("input", renderKuerzenVorher));
  renderKuerzenVorher();
}

// ================= 3. Kehrwert und Division =================

function renderDivision() {
  const z1 = clampInt(document.getElementById("dv-z1").value, 0, 20);
  const n1 = clampInt(document.getElementById("dv-n1").value, 1, 20);
  const z2 = clampInt(document.getElementById("dv-z2").value, 1, 20);
  const n2 = clampInt(document.getElementById("dv-n2").value, 1, 20);

  const zP = z1 * n2,
    nP = n1 * z2;
  const k = kuerze(zP, nP);

  const mount = document.getElementById("dv-mount");
  mount.innerHTML = "";
  // "Wie oft passt der Divisor in den Dividenden?" — auf dem gemeinsamen Raster sichtbar machen.
  const hn = n1 * n2;
  if (hn <= 60) {
    mount.appendChild(summeZeile(`${z1}/${n1}`, z1 * n2, hn, "anteil-teil"));
    mount.appendChild(summeZeile(`${z2}/${n2}`, z2 * n1, hn, "anteil-teil-b"));
  }

  document.getElementById("dv-text").innerHTML =
    `Kehrwert von ${bruchHtml(z2, n2)} ist ${bruchHtml(n2, z2)}.<br>` +
    `${bruchHtml(z1, n1)} : ${bruchHtml(z2, n2)} = ${bruchHtml(z1, n1)} · ${bruchHtml(n2, z2)} = ${bruchHtml(`${z1} · ${n2}`, `${n1} · ${z2}`)} = ${bruchHtml(zP, nP, "gross")}` +
    (k.g > 1 ? ` = ${bruchHtml(k.z, k.n, "gross")}` : "") +
    (k.n === 1 ? ` = <strong>${k.z}</strong>` : k.z >= k.n ? ` = ${gemischtHtml(k.z, k.n)}` : "") +
    `<br><span class="progress-note">Deutung: ${bruchHtml(z2, n2)} passt ${k.n === 1 ? `genau ${k.z}-mal` : `${num(zP / nP, 3)}-mal`} in ${bruchHtml(z1, n1)} hinein. ` +
    (zP > nP
      ? `Weil der Divisor kleiner als der Dividend ist, ist das Ergebnis größer als 1.`
      : `Weil der Divisor größer als der Dividend ist, ist das Ergebnis kleiner als 1.`) +
    `</span>`;
}
function initDivisionBruch() {
  ["dv-z1", "dv-n1", "dv-z2", "dv-n2"].forEach((id) => document.getElementById(id).addEventListener("input", renderDivision));
  renderDivision();
}

// ================= 4. Dezimalzahlen multiplizieren =================

function renderDezMal() {
  const A = dezimalTeile(document.getElementById("dm-a").value);
  const B = dezimalTeile(document.getElementById("dm-b").value);
  const out = document.getElementById("dm-mount");
  if (!A || !B) {
    out.innerHTML = `<span class="progress-note">Bitte zwei Dezimalzahlen mit Komma eingeben, z.&nbsp;B. 2,5 und 0,4.</span>`;
    return;
  }
  const intA = Number(A.ganz + A.nach),
    intB = Number(B.ganz + B.nach);
  const stellen = A.nach.length + B.nach.length;
  const produktInt = intA * intB;
  const ergebnis = kommaSetzen(produktInt, stellen);
  const zahlA = A.ganz + (A.nach ? "," + A.nach : "");
  const zahlB = B.ganz + (B.nach ? "," + B.nach : "");

  out.innerHTML =
    `① ohne Komma rechnen: ${num(intA)} · ${num(intB)} = <strong>${num(produktInt)}</strong><br>` +
    `② Nachkommastellen zählen: ${A.nach.length} (bei ${zahlA}) + ${B.nach.length} (bei ${zahlB}) = <strong>${stellen}</strong><br>` +
    `③ im Ergebnis ${stellen} Stelle${stellen === 1 ? "" : "n"} von rechts abzählen und das Komma setzen:<br>` +
    `${zahlA} · ${zahlB} = <span class="dez-ergebnis">${ergebnis}</span><br>` +
    `<span class="progress-note">Größenordnung prüfen: ${groessenordnungHinweis(intA, A.nach.length, intB, B.nach.length)}</span>`;
}

// Faktoren unter 1 verkleinern das Produkt — der Vergleich wird ganzzahlig geführt
// (x < 1 genau dann, wenn die Ziffernfolge kleiner als 10^Nachkommastellen ist).
function groessenordnungHinweis(intA, decA, intB, decB) {
  const aKlein = intA < Math.pow(10, decA);
  const bKlein = intB < Math.pow(10, decB);
  if (aKlein && bKlein) return "Beide Faktoren sind kleiner als 1 — das Produkt muss also <strong>kleiner als beide</strong> sein.";
  if (aKlein || bKlein) return "Ein Faktor ist kleiner als 1 — das Produkt ist deshalb <strong>kleiner als der andere Faktor</strong>.";
  return "Beide Faktoren sind mindestens 1 — das Produkt ist deshalb <strong>mindestens so groß wie beide</strong>.";
}
function initDezMal() {
  ["dm-a", "dm-b"].forEach((id) => document.getElementById(id).addEventListener("input", renderDezMal));
  renderDezMal();
}

// ================= 5. Dezimalzahlen dividieren =================

// Exakte Dezimaldarstellung eines Bruchs mit Periodenerkennung (wie in Lernpfad 3).
function bruchAlsDezimal(z, n, maxStellen = 30) {
  const vor = Math.floor(z / n);
  let rest = z % n;
  const gesehen = new Map();
  const ziffern = [];
  let periodeAb = -1;
  while (rest !== 0 && ziffern.length < maxStellen) {
    if (gesehen.has(rest)) {
      periodeAb = gesehen.get(rest);
      break;
    }
    gesehen.set(rest, ziffern.length);
    const erweitert = rest * 10;
    const ziffer = Math.floor(erweitert / n);
    rest = erweitert - ziffer * n;
    ziffern.push(ziffer);
  }
  return {
    vor,
    vorperiode: (periodeAb === -1 ? ziffern : ziffern.slice(0, periodeAb)).join(""),
    periode: periodeAb === -1 ? "" : ziffern.slice(periodeAb).join(""),
    abgeschnitten: rest !== 0 && periodeAb === -1,
  };
}
function dezimalTextHtml(d) {
  const nach = d.vorperiode + (d.periode ? `<span class="periode">${d.periode}</span>` : "");
  return `${d.vor}${nach ? "," + nach : ""}${d.abgeschnitten ? "…" : ""}`;
}

function renderDezDurch() {
  const A = dezimalTeile(document.getElementById("dd-a").value);
  const B = dezimalTeile(document.getElementById("dd-b").value);
  const mount = document.getElementById("dd-mount");
  const text = document.getElementById("dd-text");
  mount.innerHTML = "";
  if (!A || !B) {
    text.innerHTML = `<span class="progress-note">Bitte zwei Dezimalzahlen mit Komma eingeben, z.&nbsp;B. 7,2 und 0,8.</span>`;
    return;
  }
  const intB = Number(B.ganz + B.nach);
  if (intB === 0) {
    text.innerHTML = `Durch <strong>0 darf nicht dividiert werden</strong> — 0 hat keinen Kehrwert.`;
    return;
  }
  const schiebe = B.nach.length; // so viele Stellen, bis der Divisor ganzzahlig ist
  const zahlA = A.ganz + (A.nach ? "," + A.nach : "");
  const zahlB = B.ganz + (B.nach ? "," + B.nach : "");

  // Beide Zahlen um "schiebe" Stellen nach rechts verschieben (das ist die Multiplikation mit
  // 10^schiebe): Die Ziffernfolge bleibt, nur die Kommaposition wandert. Reichen die
  // Nachkommastellen nicht aus, werden hinten Nullen angehängt.
  const verschobenA = kommaSetzen(
    Number(A.ganz + A.nach + "0".repeat(Math.max(0, schiebe - A.nach.length))),
    Math.max(0, A.nach.length - schiebe)
  );
  const verschobenB = String(intB);

  mount.appendChild(
    el("div", { class: "verschiebung" }, [
      el("div", { class: "verschiebung-block", html: `<div class="vorher">${zahlA}</div><div class="verschiebung-pfeil">${schiebe === 0 ? "unverändert" : "· 10" + (schiebe > 1 ? "<sup>" + schiebe + "</sup>" : "")}</div><div class="nachher">${verschobenA}</div>` }),
      el("div", { style: "align-self:center;font-size:1.3rem;font-weight:700" }, ":"),
      el("div", { class: "verschiebung-block", html: `<div class="vorher">${zahlB}</div><div class="verschiebung-pfeil">${schiebe === 0 ? "unverändert" : "· 10" + (schiebe > 1 ? "<sup>" + schiebe + "</sup>" : "")}</div><div class="nachher">${verschobenB}</div>` }),
    ])
  );

  // Exakter Wert als Bruch: (intA / 10^decA) : (intB / 10^decB) = intA · 10^decB / (intB · 10^decA)
  const intA = Number(A.ganz + A.nach);
  const zaehler = intA * Math.pow(10, B.nach.length);
  const nenner = intB * Math.pow(10, A.nach.length);
  const k = kuerze(zaehler, nenner);
  const d = bruchAlsDezimal(k.z, k.n);

  text.innerHTML =
    (schiebe === 0
      ? `Der Divisor ${zahlB} ist bereits eine natürliche Zahl — es muss nichts verschoben werden.<br>`
      : `Beide Zahlen werden um ${schiebe} Stelle${schiebe === 1 ? "" : "n"} verschoben, damit der Divisor ganzzahlig wird. Weil <strong>beide</strong> mit ${num(Math.pow(10, schiebe))} multipliziert werden, bleibt der Quotient gleich.<br>`) +
    `${zahlA} : ${zahlB} = ${verschobenA} : ${verschobenB} = <span class="dez-ergebnis">${dezimalTextHtml(d)}</span>` +
    (k.n !== 1 ? `<br>Als Bruch: ${bruchHtml(k.z, k.n)}` : "") +
    (d.periode ? `<br><span class="progress-note">Die Division geht nicht auf — das Ergebnis ist periodisch.</span>` : "");
}
function initDezDurch() {
  ["dd-a", "dd-b"].forEach((id) => document.getElementById(id).addEventListener("input", renderDezDurch));
  renderDezDurch();
}

// ================= 8. Gestaffelte Übungsaufgaben =================

// Die Werkbank für die Übungsaufgaben ist für alle Grundwissen-Seiten dieselbe und steht in
// ../../aufgaben.js. Mitgegeben wird nur, wie DIESE Seite eine Eingabe als Zahl liest.
const mountUebungsaufgaben = (container, defs) =>
  mountUebungsaufgabenBasis(container, defs, { parse: parseFlexibleNumber });

// ---------- Aufgaben-Definitionen ----------

function bruchHinweis(zk, nk) {
  return (raw) => {
    const b = parseBruchEingabe(raw);
    if (!b) return "Schreibe deine Antwort als Bruch in der Form <code>z/n</code>, z.&nbsp;B. <code>3/4</code>.";
    if (b.z * nk === zk * b.n) {
      return `Der <strong>Wert</strong> stimmt — aber ${bruchHtml(b.z, b.n)} ist noch nicht vollständig gekürzt: ggT(${b.z}; ${b.n}) = ${ggT(b.z, b.n)}.`;
    }
    return "";
  };
}

function generateAufgabe1() {
  const n = pick([3, 4, 5, 6, 8, 9, 10, 12]);
  const z = randInt(1, n - 1);
  const k = randInt(2, 6);
  const zP = z * k;
  const kr = kuerze(zP, n);
  return {
    promptHtml: `Berechne und kürze vollständig: ${bruchHtml(z, n)} · ${k}`,
    placeholder: "z. B. 5/4",
    check: (raw) => {
      const b = parseBruchEingabe(raw);
      return !!b && b.z === kr.z && b.n === kr.n;
    },
    hinweis: bruchHinweis(kr.z, kr.n),
    tipps: [
      `${bruchHtml(z, n)} · ${k} heißt: ${k}-mal ${bruchHtml(z, n)} nehmen — die Stücke bleiben gleich groß, es werden nur mehr.`,
      `Deshalb wird nur der Zähler vervielfacht: ${z} · ${k}. Der Nenner ${n} bleibt.`,
      "Zum Schluss vollständig kürzen.",
    ],
    musterloesungHtml:
      `Nur der Zähler wird vervielfacht, der Nenner bleibt:<br>` +
      `${bruchHtml(z, n)} · ${k} = ${bruchHtml(`${z} · ${k}`, n)} = ${bruchHtml(zP, n)}` +
      (kr.g > 1 ? ` = ${bruchHtml(kr.z, kr.n, "gross")} (gekürzt mit ${kr.g})` : ` — bereits vollständig gekürzt.`) +
      (kr.n === 1 ? `<br>Das ist die ganze Zahl ${kr.z}.` : kr.z > kr.n ? `<br>Als gemischte Zahl: ${gemischtHtml(kr.z, kr.n)}` : ""),
  };
}

function generateAufgabe2() {
  const n1 = pick([2, 3, 4, 5, 6, 8]);
  const n2 = pick([3, 4, 5, 6, 8, 9]);
  const z1 = randInt(1, n1 - 1);
  const z2 = randInt(1, n2 - 1);
  const zP = z1 * z2,
    nP = n1 * n2;
  const k = kuerze(zP, nP);
  return {
    promptHtml: `Berechne und kürze vollständig: ${bruchHtml(z1, n1)} · ${bruchHtml(z2, n2)}`,
    placeholder: "z. B. 1/2",
    check: (raw) => {
      const b = parseBruchEingabe(raw);
      return !!b && b.z === k.z && b.n === k.n;
    },
    hinweis: bruchHinweis(k.z, k.n),
    tipps: [
      "Beim Multiplizieren muss man <em>nicht</em> gleichnamig machen — das ist nur beim Addieren nötig.",
      "Zähler mal Zähler, Nenner mal Nenner.",
      "Kürzen darf man auch schon vorher — über Kreuz, bevor man ausmultipliziert.",
    ],
    musterloesungHtml:
      `Zähler mal Zähler, Nenner mal Nenner — gleichnamig machen ist nicht nötig:<br>` +
      `${bruchHtml(z1, n1)} · ${bruchHtml(z2, n2)} = ${bruchHtml(`${z1} · ${z2}`, `${n1} · ${n2}`)} = ${bruchHtml(zP, nP)}` +
      (k.g > 1 ? ` = ${bruchHtml(k.z, k.n, "gross")} (gekürzt mit ${k.g})` : ` — bereits vollständig gekürzt.`),
  };
}

function generateAufgabe3() {
  const n1 = pick([2, 3, 4, 5, 6, 8]);
  const n2 = pick([2, 3, 4, 5, 6, 8]);
  const z1 = randInt(1, n1 - 1);
  const z2 = randInt(1, n2 - 1);
  const zP = z1 * n2,
    nP = n1 * z2;
  const k = kuerze(zP, nP);
  return {
    promptHtml: `Berechne und kürze vollständig: ${bruchHtml(z1, n1)} : ${bruchHtml(z2, n2)}`,
    placeholder: "z. B. 3/2",
    check: (raw) => {
      const b = parseBruchEingabe(raw);
      return !!b && b.z === k.z && b.n === k.n;
    },
    hinweis: (raw) => {
      const b = parseBruchEingabe(raw);
      if (!b) return "Schreibe deine Antwort als Bruch in der Form <code>z/n</code>.";
      if (b.z * k.n === k.z * b.n) return `Der <strong>Wert</strong> stimmt — kürze noch vollständig: ggT(${b.z}; ${b.n}) = ${ggT(b.z, b.n)}.`;
      if (b.z * (n1 * n2) === z1 * z2 * b.n) return "Du hast multipliziert statt dividiert. Beim Dividieren wird der <strong>zweite</strong> Bruch umgedreht.";
      return "";
    },
    tipps: [
      "Durch einen Bruch dividieren heißt: mit seinem Kehrwert multiplizieren.",
      `Der Kehrwert von ${bruchHtml(z2, n2)} ist ${bruchHtml(n2, z2)}.`,
      "Umgedreht wird nur der <strong>zweite</strong> Bruch — dann ganz normal multiplizieren.",
    ],
    musterloesungHtml:
      `Durch einen Bruch dividieren heißt: mit dem Kehrwert multiplizieren. Kehrwert von ${bruchHtml(z2, n2)} ist ${bruchHtml(n2, z2)}.<br>` +
      `${bruchHtml(z1, n1)} : ${bruchHtml(z2, n2)} = ${bruchHtml(z1, n1)} · ${bruchHtml(n2, z2)} = ${bruchHtml(`${z1} · ${n2}`, `${n1} · ${z2}`)} = ${bruchHtml(zP, nP)}` +
      (k.g > 1 ? ` = ${bruchHtml(k.z, k.n, "gross")} (gekürzt mit ${k.g})` : ` — bereits vollständig gekürzt.`) +
      (k.n === 1 ? `<br>Das ist die ganze Zahl ${k.z}.` : ""),
  };
}

function generateAufgabe4() {
  // Sachaufgabe mit Dezimalmultiplikation und -division. Alle Zahlen so konstruiert, dass das
  // Ergebnis eine glatte Dezimalzahl mit höchstens zwei Nachkommastellen ist.
  const personen = pick([2, 4, 5]);
  // Der Preis wird so gewählt, dass die Gesamtkosten durch die Gruppenzahl teilbar
  // bleiben: Bei 4 Gruppen reichen Vielfache von 25 Cent nicht aus (25 · 3 · 6 = 450
  // Cent lässt sich nicht durch 4 teilen), deshalb dort Vielfache von 50 Cent.
  const preisCent = personen === 4 ? randInt(2, 20) * 50 : randInt(4, 40) * 25;
  const menge = randInt(3, 12) * 2; // gerade Stückzahl
  const gesamtCent = preisCent * menge;
  const proPersonCent = gesamtCent / personen;
  const kontext = pick([
    { was: "Kisten Mineralwasser", einh: "€ je Kiste" },
    { was: "Meter Kabel", einh: "€ je Meter" },
    { was: "Kilogramm Futter", einh: "€ je Kilogramm" },
  ]);
  const cent = (c) => {
    const g = Math.floor(c / 100),
      r = c % 100;
    return r === 0 ? `${g}` : `${g},${String(r).padStart(2, "0").replace(/0$/, "")}`;
  };
  return {
    promptHtml:
      `Ein Verein kauft <strong>${menge}</strong> ${kontext.was} zu je <strong>${cent(preisCent)} ${kontext.einh}</strong>. ` +
      `Die Kosten werden auf <strong>${personen}</strong> Gruppen gleichmäßig verteilt. Wie viel Euro zahlt jede Gruppe?`,
    correct: proPersonCent / 100,
    tolerance: 0.005,
    placeholder: "z. B. 24,50",
    hinweis: (roh, val) =>
      Math.abs(val - gesamtCent / 100) < 0.005
        ? "Das sind die Gesamtkosten — sie werden noch auf die Gruppen verteilt."
        : Math.abs(val - preisCent / 100) < 0.005
          ? "Das ist der Preis für ein Stück. Erst mal die Menge, dann durch die Gruppen."
          : "",
    tipps: [
      "Zwei Schritte: erst die Gesamtkosten, dann gleichmäßig verteilen.",
      `Gesamtkosten: ${menge} · den Stückpreis.`,
      `Danach durch ${personen} teilen.`,
    ],
    musterloesungHtml:
      `① Gesamtkosten (Dezimalmultiplikation): ${cent(preisCent)} · ${menge}<br>` +
      `&nbsp;&nbsp;ohne Komma: ${num(preisCent)} · ${menge} = ${num(gesamtCent)}; die Nachkommastellen des Preises wieder ansetzen ⇒ <strong>${cent(gesamtCent)} €</strong><br>` +
      `② durch ${personen} teilen: ${cent(gesamtCent)} : ${personen} = <strong>${cent(proPersonCent)} €</strong><br>` +
      `<span class="progress-note">Überschlag: rund ${Math.round(preisCent / 100)} € · ${menge} ≈ ${Math.round((preisCent / 100) * menge)} €, geteilt durch ${personen} ≈ ${Math.round(((preisCent / 100) * menge) / personen)} €.</span>`,
  };
}

// Aufgabe 2 — den Kehrwert bilden. Der Baustein, auf dem die ganze Division durch einen Bruch
// beruht: Ohne ihn bleibt „mit dem Kehrwert multiplizieren“ ein Spruch ohne Inhalt.
function generateAufgabe2b() {
  const ganzeZahl = Math.random() < 0.35;
  if (ganzeZahl) {
    const k = randInt(2, 15);
    return {
      promptHtml: `Wie heißt der <strong>Kehrwert</strong> von <strong>${k}</strong>?<br><span class="progress-note">Antworte als Bruch in der Form <code>z/n</code>.</span>`,
      placeholder: "z. B. 1/7",
      check: (raw) => {
        const b = parseBruchEingabe(raw);
        return !!b && b.z === 1 && b.n === k;
      },
      hinweis: (raw) => {
        const b = parseBruchEingabe(raw);
        if (!b) return "Schreibe deine Antwort als Bruch in der Form <code>z/n</code>, z.&nbsp;B. <code>1/7</code>.";
        if (b.z === k && b.n === 1) return "Das ist die Zahl selbst. Beim Kehrwert werden Zähler und Nenner vertauscht.";
        return "";
      },
      tipps: [
        `Jede ganze Zahl lässt sich als Bruch schreiben: ${k} = ${bruchHtml(k, 1)}.`,
        "Der Kehrwert entsteht, indem Zähler und Nenner vertauscht werden.",
        "Probe: Eine Zahl mal ihr Kehrwert ergibt immer 1.",
      ],
      musterloesungHtml:
        `${k} = ${bruchHtml(k, 1)} ⇒ Zähler und Nenner vertauschen ⇒ <strong>${bruchHtml(1, k, "gross")}</strong><br>` +
        `Probe: ${k} · ${bruchHtml(1, k)} = ${bruchHtml(k, k)} = 1 ✓`,
    };
  }
  const n = pick([2, 3, 4, 5, 6, 7, 8, 9, 10, 12]);
  const z = randInt(1, n - 1);
  const g = ggT(z, n);
  const zk = z / g, nk = n / g;
  return {
    promptHtml: `Wie heißt der <strong>Kehrwert</strong> von ${bruchHtml(zk, nk, "gross")}?`,
    placeholder: "z. B. 4/3",
    check: (raw) => {
      const b = parseBruchEingabe(raw);
      return !!b && b.z === nk && b.n === zk;
    },
    hinweis: (raw) => {
      const b = parseBruchEingabe(raw);
      if (!b) return "Schreibe deine Antwort als Bruch in der Form <code>z/n</code>, z.&nbsp;B. <code>4/3</code>.";
      if (b.z === zk && b.n === nk) return "Das ist der Bruch selbst — beim Kehrwert werden Zähler und Nenner vertauscht.";
      return "";
    },
    tipps: [
      "Kehrwert heißt: Zähler und Nenner tauschen die Plätze.",
      "Probe: Ein Bruch mal sein Kehrwert ergibt immer 1.",
    ],
    musterloesungHtml:
      `Zähler und Nenner vertauschen: ${bruchHtml(zk, nk)} ⇒ <strong>${bruchHtml(nk, zk, "gross")}</strong><br>` +
      `Probe: ${bruchHtml(zk, nk)} · ${bruchHtml(nk, zk)} = ${bruchHtml(zk * nk, nk * zk)} = 1 ✓`,
  };
}

// Aufgabe 4 — Dezimalzahlen multiplizieren. Die Regel steckt allein in der Zahl der
// Nachkommastellen; der abgefragte Fehler ist das Komma an der falschen Stelle.
function generateAufgabe4b() {
  const aH = randInt(11, 98) * 10 + randInt(1, 9);     // zwei Nachkommastellen
  const bZ = randInt(11, 89);                          // eine Nachkommastelle
  const a = aH / 100, b = bZ / 10;
  const produktTausendstel = aH * bZ;                  // 2 + 1 = 3 Nachkommastellen
  const correct = produktTausendstel / 1000;
  const kommaZuWenig = produktTausendstel / 100;       // eine Stelle zu wenig abgezählt
  return {
    promptHtml: `Berechne: <strong>${dez(a, 2)} · ${dez(b, 1)}</strong>`,
    correct,
    tolerance: 0.0005,
    placeholder: "Ergebnis",
    hinweis: (roh, val) =>
      Math.abs(val - kommaZuWenig) < 0.0005
        ? "Das Komma steht eine Stelle zu weit rechts: Es sind 2 + 1 = 3 Nachkommastellen abzuzählen."
        : Math.abs(val - aH * bZ) < 0.5
          ? "Das ist das Produkt ohne Komma. Jetzt müssen noch die Nachkommastellen abgezählt werden."
          : "",
    tipps: [
      "Zuerst ohne Komma rechnen, als wären es ganze Zahlen.",
      `${aH} · ${bZ} = ${(aH * bZ).toLocaleString("de-DE")}.`,
      "Dann so viele Nachkommastellen abzählen, wie beide Faktoren zusammen haben: 2 + 1 = 3.",
    ],
    musterloesungHtml:
      `① Ohne Komma: ${aH} · ${bZ} = ${(aH * bZ).toLocaleString("de-DE")}<br>` +
      `② Nachkommastellen zählen: ${dez(a, 2)} hat 2, ${dez(b, 1)} hat 1 — zusammen 3.<br>` +
      `③ Komma drei Stellen von rechts setzen: <strong>${dez(correct, 3)}</strong><br>` +
      `Überschlag: rund ${Math.round(a)} · ${Math.round(b)} = ${Math.round(a) * Math.round(b)} ✓`,
  };
}

// Aufgabe 6 — durch eine Dezimalzahl dividieren. Der Kern: Beide Zahlen mit derselben Zehnerpotenz
// multiplizieren, bis der Divisor ganzzahlig ist — der Quotient ändert sich dabei nicht.
function generateAufgabe6() {
  const divisorHundertstel = pick([25, 50, 75, 20, 40, 5, 15, 250, 125]);
  const quotient = randInt(3, 40);
  const dividendHundertstel = divisorHundertstel * quotient;
  const divisor = divisorHundertstel / 100;
  const dividend = dividendHundertstel / 100;
  const stellen = divisorHundertstel % 10 === 0 ? 1 : 2;
  const faktor = Math.pow(10, stellen);
  return {
    promptHtml: `Berechne: <strong>${dezKurz(dividend)} : ${dezKurz(divisor)}</strong>`,
    correct: quotient,
    tolerance: 0.001,
    placeholder: "Ergebnis",
    hinweis: (roh, val) =>
      Math.abs(val - quotient / faktor) < 0.001
        ? "Beide Zahlen müssen mit derselben Zahl multipliziert werden — sonst ändert sich der Quotient."
        : Math.abs(val - dividend * divisor) < 0.001
          ? "Hier wurde multipliziert statt dividiert."
          : "",
    tipps: [
      "Durch eine Dezimalzahl lässt sich schlecht teilen — der Divisor soll erst ganzzahlig werden.",
      `Dazu beide Zahlen mit ${faktor} multiplizieren: Das Komma wandert bei beiden um ${stellen} Stelle${stellen > 1 ? "n" : ""} nach rechts.`,
      `Dann steht da ${dezKurz(dividend * faktor)} : ${divisor * faktor}.`,
    ],
    musterloesungHtml:
      `① Beide Zahlen mit ${faktor} multiplizieren (der Quotient ändert sich dadurch nicht):<br>` +
      `&nbsp;&nbsp;${dezKurz(dividend)} : ${dezKurz(divisor)} = ${dezKurz(dividend * faktor)} : ${divisor * faktor}<br>` +
      `② Jetzt ist der Divisor eine ganze Zahl: ${dezKurz(dividend * faktor)} : ${divisor * faktor} = <strong>${quotient}</strong><br>` +
      `Probe: ${quotient} · ${dezKurz(divisor)} = ${dezKurz(dividend)} ✓`,
  };
}

// Aufgabe 8 — Rezept umrechnen: teilen, vervielfachen, bezahlen. Drei Felder, weil drei
// verschiedene Rechenschritte dahinterstecken — und der erste ist eine Division, die man beim
// bloßen „mal so viel“ leicht überspringt.
function generateAufgabe8() {
  // Mengen je Person bleiben im Bereich einer Küche: 100 g bis 750 g.
  const proPersonHundertstel = pick([10, 15, 20, 25, 30, 40, 50, 75]);
  const personen = pick([4, 5, 6, 8]);
  const zielPersonen = pick([3, 7, 9, 10, 12]);
  const gesamtHundertstel = proPersonHundertstel * personen;
  const zielHundertstel = proPersonHundertstel * zielPersonen;
  const preisCent = pick([80, 120, 140, 160, 200, 240]);   // € je Kilogramm
  const kostenCent = (zielHundertstel * preisCent) / 100;
  const zutat = pick(["Mehl", "Reis", "Zucker", "Haferflocken"]);
  return {
    promptHtml:
      `Ein Rezept für <strong>${personen} Personen</strong> braucht <strong>${dezKurz(gesamtHundertstel / 100)} kg ${zutat}</strong>. ` +
      `Ein Kilogramm kostet <strong>${dez(preisCent / 100, 2)} €</strong>.`,
    felder: [
      {
        name: "Menge für 1 Person", soll: proPersonHundertstel / 100, einheit: "kg", toleranz: 0.0005,
        hinweis: (roh, val) => (Math.abs(val - gesamtHundertstel / 100) < 0.0005 ? "Das ist die Menge für alle. Für eine Person wird durch die Personenzahl geteilt." : ""),
      },
      {
        name: `Menge für ${zielPersonen} Personen`, soll: zielHundertstel / 100, einheit: "kg", toleranz: 0.0005,
        hinweis: (roh, val) => (Math.abs(val - (gesamtHundertstel / 100) * zielPersonen) < 0.0005 ? "Hier wurde die Menge für alle vervielfacht statt die für eine Person." : ""),
      },
      {
        name: `Kosten für diese Menge`, soll: kostenCent / 100, einheit: "€", toleranz: 0.0005,
        hinweis: (roh, val) => (Math.abs(val - (zielHundertstel / 100) / (preisCent / 100)) < 0.0005 ? "Hier wurde geteilt. Der Preis je Kilogramm wird mit der Menge multipliziert." : ""),
      },
    ],
    tipps: [
      "Erst herunter auf eine Person, dann hinauf auf die gesuchte Anzahl.",
      `Für eine Person: ${dezKurz(gesamtHundertstel / 100)} kg : ${personen}.`,
      "Die Kosten sind Menge mal Preis je Kilogramm.",
    ],
    musterloesungHtml:
      `① Für 1 Person: ${dezKurz(gesamtHundertstel / 100)} kg : ${personen} = <strong>${dezKurz(proPersonHundertstel / 100)} kg</strong><br>` +
      `② Für ${zielPersonen} Personen: ${dezKurz(proPersonHundertstel / 100)} kg · ${zielPersonen} = <strong>${dezKurz(zielHundertstel / 100)} kg</strong><br>` +
      `③ Kosten: ${dezKurz(zielHundertstel / 100)} kg · ${dez(preisCent / 100, 2)} € = <strong>${dez(kostenCent / 100, 2)} €</strong><br>` +
      `<span class="progress-note">Der Weg über „eine Person“ funktioniert immer — auch wenn die gesuchte Anzahl kein Vielfaches der gegebenen ist.</span>`,
  };
}

function initExercises() {
  mountUebungsaufgaben(document.getElementById("exercises-mount"), [
    { schwierigkeit: "einfach", titel: "Aufgabe 1 — Bruch mal natürliche Zahl", generate: generateAufgabe1 },
    { schwierigkeit: "einfach", titel: "Aufgabe 2 — Kehrwert bilden", generate: generateAufgabe2b },
    { schwierigkeit: "mittel", titel: "Aufgabe 3 — Bruch mal Bruch", generate: generateAufgabe2 },
    { schwierigkeit: "mittel", titel: "Aufgabe 4 — Dezimalzahlen multiplizieren", generate: generateAufgabe4b },
    { schwierigkeit: "schwierig", titel: "Aufgabe 5 — Durch einen Bruch dividieren", generate: generateAufgabe3 },
    { schwierigkeit: "schwierig", titel: "Aufgabe 6 — Durch eine Dezimalzahl dividieren", generate: generateAufgabe6 },
    { schwierigkeit: "komplex", titel: "Aufgabe 7 — Sachaufgabe mit Dezimalzahlen", generate: generateAufgabe4 },
    { schwierigkeit: "komplex", titel: "Aufgabe 8 — Rezept umrechnen", generate: generateAufgabe8 },
  ]);
}

// ================= Quizze =================

function initQuizzes() {
  mountQuiz(document.getElementById("quiz-vervielfachen"), {
    q: "Was passiert beim Rechnen 2/5 · 3 mit dem Nenner?",
    options: [
      "Er wird auch mit 3 multipliziert",
      "Er bleibt 5, denn die Teilegröße ändert sich nicht",
      "Er wird durch 3 geteilt",
      "Das hängt davon ab, ob der Bruch echt ist",
    ],
    correct: 1,
    explain: "Der Nenner sagt, wie groß die Teile sind. Beim Vervielfachen werden es mehr Teile, aber nicht andere: 2/5 · 3 = 6/5.",
  });
  mountQuiz(document.getElementById("quiz-bruchmalbruch"), {
    q: "Was ergibt 1/2 · 1/2?",
    options: [
      "1, denn zweimal die Hälfte ist ein Ganzes",
      "1/4 — die Hälfte von einer Hälfte",
      "2/4 = 1/2",
      "1/2, Multiplizieren mit einem halben ändert nichts",
    ],
    correct: 1,
    explain: "Zähler mal Zähler, Nenner mal Nenner: 1·1 / 2·2 = 1/4. Multiplizieren mit einer Zahl unter 1 verkleinert das Ergebnis.",
  });
  mountQuiz(document.getElementById("quiz-division"), {
    q: "Wie viel ist 3 : 1/2?",
    options: ["1,5 — Dividieren macht kleiner", "6, denn in 3 passen sechs halbe hinein", "3/2", "2/3"],
    correct: 1,
    explain: "Dividieren heißt: Wie oft passt der Divisor hinein? Durch eine Zahl unter 1 zu teilen vergrößert das Ergebnis: 3 · 2/1 = 6.",
  });
  mountQuiz(document.getElementById("quiz-dezmal"), {
    q: "Wie viel ist 0,2 · 0,3?",
    options: ["0,6", "0,06", "6", "0,5"],
    correct: 1,
    explain: "Ohne Komma: 2 · 3 = 6. Nachkommastellen: 1 + 1 = 2, also 0,06. Beide Faktoren sind kleiner als 1 — das Ergebnis muss noch kleiner sein.",
  });
  mountQuiz(document.getElementById("quiz-dezdurch"), {
    q: "Warum darf man bei 7,2 : 0,8 in beiden Zahlen das Komma um eine Stelle verschieben?",
    options: [
      "Weil das Ergebnis dadurch schöner wird",
      "Weil beide Zahlen mit 10 multipliziert werden und sich der Quotient dabei nicht ändert",
      "Weil der Dividend dadurch ganzzahlig wird",
      "Das darf man gar nicht, es ist nur eine Näherung",
    ],
    correct: 1,
    explain: "72 : 8 ist derselbe Quotient wie 7,2 : 0,8 — genau wie beim Erweitern eines Bruchs ändert das gleichzeitige Vervielfachen von Zähler und Nenner den Wert nicht.",
  });
}

// ================= Start =================

document.addEventListener("DOMContentLoaded", () => {
  initVervielfachen();
  initBruchMalBruch();
  initKuerzenVorher();
  initDivisionBruch();
  initDezMal();
  initDezDurch();
  initExercises();
  initQuizzes();
});
