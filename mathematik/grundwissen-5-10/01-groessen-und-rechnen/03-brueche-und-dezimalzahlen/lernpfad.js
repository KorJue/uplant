// Selbstlernpfad "Brüche und Dezimalzahlen" (Grundwissen Klasse 5-10). Rein clientseitiges
// Vanilla-JS, ohne Build-Schritt oder externe Bibliotheken — wie der Rest der Seite.
// Aufbau: DOM/SVG-Helfer und Bruch-Arithmetik, dann je ein Abschnitt (Anteil, Erweitern/Kürzen,
// Vergleichen, gemischte Zahlen, Dezimalschreibweise, Umwandeln, Runden), zuletzt die gestaffelten
// Übungsaufgaben (derselbe Baustein wie in den Lernpfaden 1 und 2).
//
// Alle Dezimalzahlen werden als ZIFFERNFOLGEN gerechnet, nicht über Gleitkommazahlen: 0,1 + 0,2
// wäre in double-Arithmetik 0,30000000000000004, und (1.005).toFixed(2) ergibt "1.00" statt "1,01".
// Für einen Lernpfad, der Rundung und Periodizität erklärt, wäre das inakzeptabel.

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
function kgV(a, b) {
  return (a / ggT(a, b)) * b;
}

// Toleranter Zahlen-Parser für die Antwortfelder: erlaubt "0,25", "1/4", "25%" und Tausenderpunkte.
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
// Strenger Bruch-Parser: NUR "z/n" wird akzeptiert (für Aufgaben, bei denen die Schreibweise zählt).
function parseBruchEingabe(raw) {
  const m = String(raw).trim().replace(/\s/g, "").match(/^(\d+)\/(\d+)$/);
  if (!m) return null;
  const n = Number(m[2]);
  if (n === 0) return null;
  return { z: Number(m[1]), n };
}

// Bruch als HTML mit echtem Bruchstrich.
function bruchHtml(z, n, cls = "") {
  return `<span class="bruch ${cls}"><span class="z">${z}</span><span class="n">${n}</span></span>`;
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

// ---------- Anteils-Visualisierungen ----------

function kreisAnteil(gefuellt, n, r = 44) {
  const cx = 52,
    cy = 52;
  const svg = svgEl("svg", { viewBox: "0 0 104 104", width: 104, height: 104 });
  if (n === 1) {
    svg.appendChild(svgEl("circle", { cx, cy, r, class: gefuellt >= 1 ? "anteil-teil" : "anteil-rest" }));
    return svg;
  }
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * 2 * Math.PI - Math.PI / 2;
    const a1 = ((i + 1) / n) * 2 * Math.PI - Math.PI / 2;
    const x0 = cx + r * Math.cos(a0),
      y0 = cy + r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1),
      y1 = cy + r * Math.sin(a1);
    const gross = a1 - a0 > Math.PI ? 1 : 0;
    svg.appendChild(
      svgEl("path", {
        d: `M ${cx} ${cy} L ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 ${gross} 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z`,
        class: i < gefuellt ? "anteil-teil" : "anteil-rest",
      })
    );
  }
  return svg;
}

function balkenAnteil(gefuellt, n, w = 250, h = 38, klasse = "anteil-teil") {
  const svg = svgEl("svg", { viewBox: `0 0 ${w} ${h}`, width: w, height: h });
  const bw = w / n;
  for (let i = 0; i < n; i++) {
    svg.appendChild(
      svgEl("rect", { x: (i * bw).toFixed(2), y: 0, width: bw.toFixed(2), height: h, class: i < gefuellt ? klasse : "anteil-rest" })
    );
  }
  return svg;
}

// ================= 1. Der Bruch als Anteil =================

function renderAnteil() {
  const z = clampInt(document.getElementById("anteil-z").value, 0, 12);
  const n = clampInt(document.getElementById("anteil-n").value, 1, 12);
  const mount = document.getElementById("anteil-mount");
  mount.innerHTML = "";

  // Bei z > n reicht ein Ganzes nicht aus — dann werden mehrere Ganze gezeichnet. Genau das
  // motiviert die unechten Brüche in Abschnitt 4.
  const ganzeNoetig = Math.max(1, Math.ceil(z / n));
  for (let k = 0; k < ganzeNoetig; k++) {
    mount.appendChild(kreisAnteil(Math.min(n, Math.max(0, z - k * n)), n));
  }
  mount.appendChild(balkenAnteil(Math.min(z, n), n, ganzeNoetig > 1 ? 180 : 250));

  const teilerfremd = ggT(z, n) === 1;
  document.getElementById("anteil-text").innerHTML =
    `${bruchHtml(z, n, "gross")} bedeutet: Das Ganze wird in <strong>${n}</strong> gleich große Teile zerlegt, davon werden <strong>${z}</strong> genommen.<br>` +
    `Als Division: ${z} : ${n}. ` +
    (z > n
      ? `Weil der Zähler größer als der Nenner ist, ist das <strong>mehr als ein Ganzes</strong> — ein unechter Bruch (Abschnitt 4).`
      : z === n
        ? `Zähler und Nenner sind gleich — das ist <strong>genau ein Ganzes</strong>: ${bruchHtml(z, n)} = 1.`
        : z === 0
          ? `Es wird kein Teil genommen: ${bruchHtml(0, n)} = 0.`
          : `Der Bruch ist <strong>echt</strong> (sein Wert liegt zwischen 0 und 1)${teilerfremd ? " und bereits vollständig gekürzt" : ""}.`);
}
function initAnteil() {
  ["anteil-z", "anteil-n"].forEach((id) => document.getElementById(id).addEventListener("input", renderAnteil));
  renderAnteil();
}

function renderAnteilVonGroesse() {
  const z = clampInt(document.getElementById("groesse-z").value, 1, 20);
  const n = clampInt(document.getElementById("groesse-n").value, 1, 20);
  const wert = clampInt(document.getElementById("groesse-wert").value, 0, 100000);
  const einheit = document.getElementById("groesse-einheit").value;
  const einTeil = wert / n;
  const ergebnis = einTeil * z;
  const glatt = Number.isInteger(einTeil);
  document.getElementById("groesse-ergebnis").innerHTML =
    `${bruchHtml(z, n)} von ${num(wert)} ${einheit}:<br>` +
    `① ein ${n}-tel bestimmen: ${num(wert)} ${einheit} : ${n} = <strong>${num(einTeil, 4)} ${einheit}</strong><br>` +
    `② davon ${z} nehmen: ${num(einTeil, 4)} ${einheit} · ${z} = <strong>${num(ergebnis, 4)} ${einheit}</strong>` +
    (glatt ? "" : `<br><span class="progress-note">Hier geht die Division nicht glatt auf — wähle einen Wert, der durch ${n} teilbar ist, wenn du ein ganzzahliges Zwischenergebnis möchtest.</span>`);
}
function initAnteilVonGroesse() {
  ["groesse-z", "groesse-n", "groesse-wert"].forEach((id) =>
    document.getElementById(id).addEventListener("input", renderAnteilVonGroesse)
  );
  document.getElementById("groesse-einheit").addEventListener("change", renderAnteilVonGroesse);
  renderAnteilVonGroesse();
}

// ================= 2. Erweitern und Kürzen =================

function renderErweitern() {
  const z = clampInt(document.getElementById("erw-z").value, 1, 60);
  const n = clampInt(document.getElementById("erw-n").value, 1, 60);
  const k = clampInt(document.getElementById("erw-k").value, 1, 8);
  const mount = document.getElementById("erw-mount");
  mount.innerHTML = "";

  // Beide Balken sind GLEICH BREIT und gleich weit gefüllt — nur die Unterteilung ist feiner.
  // Genau das ist die Grundvorstellung: derselbe Anteil, andere Einteilung.
  const zeile = (beschriftung, zz, nn, klasse) =>
    el("div", { style: "text-align:center" }, [
      el("div", { style: "font-size:0.85rem;color:var(--muted);margin-bottom:0.25rem" }, beschriftung),
      balkenAnteil(Math.min(zz, nn), nn, 250, 38, klasse),
    ]);
  mount.appendChild(zeile("vorher: " + z + " von " + n, z, n, "anteil-teil"));
  mount.appendChild(zeile("erweitert mit " + k + ": " + z * k + " von " + n * k, z * k, n * k, "anteil-teil-b"));

  document.getElementById("erw-text").innerHTML =
    `${bruchHtml(z, n, "gross")} = ${bruchHtml(z + " · " + k, n + " · " + k)} = ${bruchHtml(z * k, n * k, "gross")}<br>` +
    `<span class="progress-note">Die gefärbte Fläche ist in beiden Balken exakt gleich groß — der Wert des Bruchs hat sich nicht geändert, nur die Einteilung ist feiner geworden.</span>`;
}
function initErweitern() {
  ["erw-z", "erw-n", "erw-k"].forEach((id) => document.getElementById(id).addEventListener("input", renderErweitern));
  renderErweitern();
}

function renderKuerzen() {
  const z = clampInt(document.getElementById("kuerz-z").value, 1, 999);
  const n = clampInt(document.getElementById("kuerz-n").value, 1, 999);
  const g = ggT(z, n);
  const out = document.getElementById("kuerz-mount");
  if (g === 1) {
    out.innerHTML =
      `${bruchHtml(z, n, "gross")} ist bereits <strong>vollständig gekürzt</strong>: ggT(${z}; ${n}) = 1, Zähler und Nenner sind teilerfremd.`;
    return;
  }
  out.innerHTML =
    `ggT(${z}; ${n}) = <strong>${g}</strong><br>` +
    `${bruchHtml(z, n, "gross")} = ${bruchHtml(z + " : " + g, n + " : " + g)} = ${bruchHtml(z / g, n / g, "gross")}<br>` +
    `<span class="progress-note">Beide Brüche haben denselben Wert (${num(z / n, 6)}). Kürzen macht die Schreibweise kürzer, nicht die Zahl kleiner.</span>`;
}
function initKuerzen() {
  ["kuerz-z", "kuerz-n"].forEach((id) => document.getElementById(id).addEventListener("input", renderKuerzen));
  renderKuerzen();
}

// ================= 3. Vergleichen und Ordnen =================

function renderVergleich() {
  const z1 = clampInt(document.getElementById("vgl-z1").value, 0, 99);
  const n1 = clampInt(document.getElementById("vgl-n1").value, 1, 99);
  const z2 = clampInt(document.getElementById("vgl-z2").value, 0, 99);
  const n2 = clampInt(document.getElementById("vgl-n2").value, 1, 99);
  const hn = kgV(n1, n2);
  const f1 = hn / n1,
    f2 = hn / n2;
  const a = z1 * f1,
    b = z2 * f2;
  const zeichen = a < b ? "&lt;" : a > b ? "&gt;" : "=";

  const mount = document.getElementById("vgl-mount");
  mount.innerHTML = "";
  // Beide Brüche auf demselben Raster (Hauptnenner) — so wird der Vergleich unmittelbar sichtbar.
  if (hn <= 60) {
    mount.appendChild(
      el("div", { class: "bruch-viz" }, [
        el("div", { style: "text-align:center" }, [
          el("div", { style: "font-size:0.85rem;color:var(--muted);margin-bottom:0.25rem" }, `${z1}/${n1} = ${a}/${hn}`),
          balkenAnteil(Math.min(a, hn), hn, 250, 34, "anteil-teil"),
        ]),
        el("div", { style: "text-align:center" }, [
          el("div", { style: "font-size:0.85rem;color:var(--muted);margin-bottom:0.25rem" }, `${z2}/${n2} = ${b}/${hn}`),
          balkenAnteil(Math.min(b, hn), hn, 250, 34, "anteil-teil-b"),
        ]),
      ])
    );
  }

  document.getElementById("vgl-text").innerHTML =
    `① Hauptnenner bestimmen: kgV(${n1}; ${n2}) = <strong>${hn}</strong><br>` +
    `② beide gleichnamig machen: ${bruchHtml(z1, n1)} = ${bruchHtml(a, hn)} &nbsp;und&nbsp; ${bruchHtml(z2, n2)} = ${bruchHtml(b, hn)}<br>` +
    `③ jetzt entscheiden die Zähler: ${a} ${zeichen} ${b}<br>` +
    `<div class="vergleich-zeile">${bruchHtml(z1, n1, "gross")}<span class="vergleich-zeichen">${zeichen}</span>${bruchHtml(z2, n2, "gross")}</div>` +
    (n1 !== n2 && z1 === z2
      ? `<span class="progress-note">Beide Zähler sind gleich — dann ist der Bruch mit dem <strong>kleineren</strong> Nenner der größere, weil die Teile dort größer sind.</span>`
      : "");
}
function initVergleich() {
  ["vgl-z1", "vgl-n1", "vgl-z2", "vgl-n2"].forEach((id) =>
    document.getElementById(id).addEventListener("input", renderVergleich)
  );
  renderVergleich();
}

// ================= 4. Gemischte Zahlen =================

function renderGemischt() {
  const z = clampInt(document.getElementById("gem-z").value, 1, 999);
  const n = clampInt(document.getElementById("gem-n").value, 1, 99);
  const ganze = Math.floor(z / n);
  const rest = z - ganze * n;
  const mount = document.getElementById("gem-mount");
  mount.innerHTML = "";
  for (let k = 0; k < Math.min(ganze, 4); k++) mount.appendChild(kreisAnteil(n, n, 34));
  if (rest > 0) mount.appendChild(kreisAnteil(rest, n, 34));
  if (ganze > 4) mount.appendChild(el("div", { style: "align-self:center;color:var(--muted)" }, `… (${ganze} Ganze insgesamt)`));

  const gemischtHtml = rest === 0 ? `<strong>${ganze}</strong>` : `<strong>${ganze}</strong> ${bruchHtml(rest, n)}`;
  document.getElementById("gem-text").innerHTML =
    (z < n
      ? `${bruchHtml(z, n, "gross")} ist ein <strong>echter</strong> Bruch (Zähler kleiner als Nenner) — es gibt nichts umzuwandeln.`
      : `${bruchHtml(z, n, "gross")} ist ein <strong>unechter</strong> Bruch (Zähler ≥ Nenner).<br>` +
        `① Division mit Rest: ${z} : ${n} = ${ganze} Rest ${rest}<br>` +
        `② Quotient wird die ganze Zahl, Rest wird der neue Zähler, Nenner bleibt:<br>` +
        `<div class="vergleich-zeile">${bruchHtml(z, n, "gross")}<span class="vergleich-zeichen">=</span>${gemischtHtml}</div>` +
        `<span class="progress-note">Rückweg: ${ganze} · ${n} + ${rest} = ${z}, also ${gemischtHtml} = ${bruchHtml(z, n)}.</span>`);
}
function initGemischt() {
  ["gem-z", "gem-n"].forEach((id) => document.getElementById(id).addEventListener("input", renderGemischt));
  renderGemischt();
}

// ================= 5. Dezimalschreibweise =================

// Zerlegt eine Eingabe wie "3,472" oder "-0,5" in Vorkomma- und Nachkommaziffern (als Strings).
function dezimalTeile(raw) {
  const s = String(raw).trim().replace(/\./g, ",");
  const m = s.match(/^(\d*)(?:,(\d*))?$/);
  if (!m) return null;
  const ganz = m[1] === "" ? "0" : m[1];
  const nach = m[2] || "";
  return { ganz, nach };
}

const DEZ_SPALTEN = [
  { label: "T", wert: 1000 },
  { label: "H", wert: 100 },
  { label: "Z", wert: 10 },
  { label: "E", wert: 1 },
];
const NACH_SPALTEN = [
  { label: "z<br>Zehntel", nenner: 10 },
  { label: "h<br>Hundertstel", nenner: 100 },
  { label: "t<br>Tausendstel", nenner: 1000 },
];

function renderDezTafel() {
  const teile = dezimalTeile(document.getElementById("dez-input").value);
  const mount = document.getElementById("dez-tafel-mount");
  const out = document.getElementById("dez-zerlegung");
  mount.innerHTML = "";
  if (!teile) {
    out.innerHTML = `<span class="progress-note">Bitte eine Dezimalzahl mit Komma eingeben, z.&nbsp;B. 3,472.</span>`;
    return;
  }
  const ganz = teile.ganz.slice(-4).padStart(4, " ");
  const nach = teile.nach.slice(0, 3).padEnd(3, " ");

  const table = el("table", { class: "dez-tafel" });
  const kopf = el("tr");
  DEZ_SPALTEN.forEach((s) => kopf.appendChild(el("th", { class: "ganze", html: s.label })));
  kopf.appendChild(el("th", { class: "komma" }, ""));
  NACH_SPALTEN.forEach((s) => kopf.appendChild(el("th", { html: s.label })));
  table.appendChild(kopf);

  const zeile = el("tr");
  ganz.split("").forEach((ch) => zeile.appendChild(el("td", { class: ch === " " ? "ganze leer" : "ganze" }, ch === " " ? "" : ch)));
  zeile.appendChild(el("td", { class: "komma" }, ","));
  nach.split("").forEach((ch) => zeile.appendChild(el("td", { class: ch === " " ? "leer" : "" }, ch === " " ? "" : ch)));
  table.appendChild(zeile);
  mount.appendChild(table);

  const teileText = [];
  ganz.split("").forEach((ch, i) => {
    if (ch !== " " && ch !== "0") teileText.push(`${ch} · ${num(DEZ_SPALTEN[i].wert)}`);
  });
  nach.split("").forEach((ch, i) => {
    if (ch !== " " && ch !== "0") teileText.push(`${ch} · ${bruchHtml(1, NACH_SPALTEN[i].nenner)}`);
  });
  const zahl = teile.ganz + (teile.nach ? "," + teile.nach : "");
  out.innerHTML =
    teileText.length === 0
      ? `${zahl} = 0`
      : `${zahl} = ${teileText.join(" + ")}` +
        (teile.nach.length > 3 ? `<br><span class="progress-note">Die Tafel zeigt nur bis zu den Tausendsteln.</span>` : "");
}
function initDezTafel() {
  document.getElementById("dez-input").addEventListener("input", renderDezTafel);
  renderDezTafel();
}

function renderDezVergleich() {
  const roh = document.getElementById("dezvgl-input").value.split(";");
  const mount = document.getElementById("dezvgl-mount");
  mount.innerHTML = "";
  const zahlen = [];
  for (const r of roh) {
    const t = r.trim();
    if (!t) continue;
    const teile = dezimalTeile(t);
    if (!teile) continue;
    zahlen.push(teile);
  }
  if (zahlen.length < 2) {
    mount.appendChild(el("p", { class: "progress-note" }, "Gib mindestens zwei Dezimalzahlen ein, mit Semikolon getrennt."));
    return;
  }
  const maxNach = Math.max(...zahlen.map((z) => z.nach.length));
  const maxGanz = Math.max(...zahlen.map((z) => z.ganz.length));

  const table = el("table", { class: "reste-tabelle" });
  const kopf = el("tr");
  ["Zahl", "gleich lang gemacht", "als " + Math.pow(10, maxNach).toLocaleString("de-DE") + "-tel"].forEach((t) =>
    kopf.appendChild(el("th", {}, t))
  );
  table.appendChild(kopf);
  zahlen.forEach((z) => {
    const aufgefuellt = z.ganz.padStart(maxGanz, "0") + "," + z.nach.padEnd(maxNach, "0");
    const alsGanz = Number(z.ganz + z.nach.padEnd(maxNach, "0"));
    const tr = el("tr");
    tr.appendChild(el("td", {}, z.ganz + (z.nach ? "," + z.nach : "")));
    tr.appendChild(el("td", {}, aufgefuellt));
    tr.appendChild(el("td", {}, String(alsGanz)));
    table.appendChild(tr);
  });
  mount.appendChild(table);

  const sortiert = [...zahlen].sort((x, y) => {
    const xv = Number(x.ganz + x.nach.padEnd(maxNach, "0"));
    const yv = Number(y.ganz + y.nach.padEnd(maxNach, "0"));
    return xv - yv;
  });
  mount.appendChild(
    el("p", { class: "event-result", style: "margin-top:0.6rem" }, [
      "Der Größe nach geordnet: " + sortiert.map((z) => z.ganz + (z.nach ? "," + z.nach : "")).join(" < "),
    ])
  );
  mount.appendChild(
    el(
      "p",
      { class: "progress-note" },
      `Alle Zahlen wurden hinten mit Nullen auf ${maxNach} Nachkommastellen aufgefüllt. Das ändert ihren Wert nicht — jetzt darf man sie wie natürliche Zahlen vergleichen.`
    )
  );
}
function initDezVergleich() {
  document.getElementById("dezvgl-input").addEventListener("input", renderDezVergleich);
  renderDezVergleich();
}

// ================= 6. Umwandeln =================

// Schriftliche Division Zähler : Nenner mit Resteverfolgung. Wiederholt sich ein Rest, beginnt dort
// die Periode; wird ein Rest 0, bricht die Dezimalzahl ab.
function bruchAlsDezimal(z, n, maxStellen = 40) {
  const vor = Math.floor(z / n);
  let rest = z % n;
  const gesehen = new Map();
  const ziffern = [];
  const schritte = [];
  let periodeAb = -1;
  while (rest !== 0 && ziffern.length < maxStellen) {
    if (gesehen.has(rest)) {
      periodeAb = gesehen.get(rest);
      break;
    }
    gesehen.set(rest, ziffern.length);
    const erweitert = rest * 10;
    const ziffer = Math.floor(erweitert / n);
    const neuerRest = erweitert - ziffer * n;
    schritte.push({ rest, erweitert, ziffer, neuerRest });
    ziffern.push(ziffer);
    rest = neuerRest;
  }
  const abgebrochen = rest !== 0 && periodeAb === -1;
  return {
    vor,
    vorperiode: (periodeAb === -1 ? ziffern : ziffern.slice(0, periodeAb)).join(""),
    periode: periodeAb === -1 ? "" : ziffern.slice(periodeAb).join(""),
    schritte,
    periodeAb,
    abgebrochen,
  };
}

function dezimalTextHtml(d) {
  const nach = d.vorperiode + (d.periode ? `<span class="periode">${d.periode}</span>` : "");
  return `${d.vor}${nach ? "," + nach : ""}${d.abgebrochen ? "…" : ""}`;
}

function renderBruchZuDezimal() {
  const z = clampInt(document.getElementById("bd-z").value, 0, 999);
  const n = clampInt(document.getElementById("bd-n").value, 1, 99);
  const d = bruchAlsDezimal(z, n);
  const g = ggT(z, n);
  const nk = n / g;
  // Ein vollständig gekürzter Bruch bricht genau dann ab, wenn sein Nenner nur 2en und 5en enthält.
  let rest2und5 = nk;
  while (rest2und5 % 2 === 0) rest2und5 /= 2;
  while (rest2und5 % 5 === 0) rest2und5 /= 5;
  const brichtAb = rest2und5 === 1;

  document.getElementById("bd-mount").innerHTML =
    `${bruchHtml(z, n, "gross")} = ${z} : ${n} = <span class="dez-ergebnis">${dezimalTextHtml(d)}</span><br>` +
    (g > 1 ? `Vollständig gekürzt: ${bruchHtml(z, n)} = ${bruchHtml(z / g, nk)}. ` : "") +
    `Der gekürzte Nenner ${nk} enthält ${brichtAb ? "nur die Primfaktoren 2 und/oder 5" : "einen anderen Primfaktor als 2 und 5"} — die Dezimalzahl ist deshalb <strong>${brichtAb ? "abbrechend" : "periodisch"}</strong>.`;

  const resteMount = document.getElementById("bd-reste");
  resteMount.innerHTML = "";
  if (d.schritte.length === 0) {
    resteMount.appendChild(el("p", { class: "progress-note" }, "Die Division geht ohne Rest auf — es gibt keine Nachkommastellen."));
    return;
  }
  const table = el("table", { class: "reste-tabelle" });
  const kopf = el("tr");
  ["Schritt", "Rest", "· 10", ": " + n + " ergibt Ziffer", "neuer Rest"].forEach((t) => kopf.appendChild(el("th", {}, t)));
  table.appendChild(kopf);
  d.schritte.forEach((s, i) => {
    const tr = el("tr");
    const wiederholt = d.periodeAb !== -1 && i === d.periodeAb;
    tr.appendChild(el("td", {}, String(i + 1)));
    tr.appendChild(el("td", { class: wiederholt ? "wiederholung" : "" }, String(s.rest)));
    tr.appendChild(el("td", {}, String(s.erweitert)));
    tr.appendChild(el("td", {}, String(s.ziffer)));
    tr.appendChild(el("td", { class: d.periodeAb !== -1 && i === d.schritte.length - 1 ? "wiederholung" : "" }, String(s.neuerRest)));
    table.appendChild(tr);
  });
  resteMount.appendChild(table);
  resteMount.appendChild(
    el(
      "p",
      { class: "progress-note" },
      d.periodeAb !== -1
        ? `Der Rest ${d.schritte[d.periodeAb].rest} tritt zum zweiten Mal auf — ab dort wiederholt sich alles. Das ist die Periode ${d.periode}.`
        : d.abgebrochen
          ? "Die Rechnung wurde hier abgeschnitten."
          : "Der Rest wird 0 — die Division geht auf, die Dezimalzahl bricht ab."
    )
  );
}
function initBruchZuDezimal() {
  ["bd-z", "bd-n"].forEach((id) => document.getElementById(id).addEventListener("input", renderBruchZuDezimal));
  renderBruchZuDezimal();
}

function renderDezimalZuBruch() {
  const teile = dezimalTeile(document.getElementById("db-input").value);
  const out = document.getElementById("db-mount");
  if (!teile) {
    out.innerHTML = `<span class="progress-note">Bitte eine abbrechende Dezimalzahl eingeben, z.&nbsp;B. 0,375.</span>`;
    return;
  }
  const stellen = teile.nach.length;
  if (stellen === 0) {
    out.innerHTML = `${teile.ganz} ist bereits eine ganze Zahl: ${teile.ganz} = ${bruchHtml(teile.ganz, 1)}.`;
    return;
  }
  const nenner = Math.pow(10, stellen);
  const zaehler = Number(teile.ganz) * nenner + Number(teile.nach);
  const g = ggT(zaehler, nenner);
  const nameStelle = ["Zehntel", "Hundertstel", "Tausendstel"][stellen - 1] || `${num(nenner)}-tel`;
  out.innerHTML =
    `① Die letzte Ziffer steht an der <strong>${nameStelle}</strong>-Stelle ⇒ Nenner ${num(nenner)}:<br>` +
    `${teile.ganz},${teile.nach} = ${bruchHtml(zaehler, nenner, "gross")}<br>` +
    (g > 1
      ? `② vollständig kürzen mit ggT(${zaehler}; ${num(nenner)}) = ${g}:<br>` +
        `<div class="vergleich-zeile">${bruchHtml(zaehler, nenner)}<span class="vergleich-zeichen">=</span>${bruchHtml(zaehler / g, nenner / g, "gross")}</div>`
      : `② Zähler und Nenner sind bereits teilerfremd — der Bruch ist vollständig gekürzt.`);
}
function initDezimalZuBruch() {
  document.getElementById("db-input").addEventListener("input", renderDezimalZuBruch);
  renderDezimalZuBruch();
}

// ================= 7. Runden =================

// Rundet ziffernweise auf einem String — bewusst ohne toFixed, siehe Kommentar am Dateianfang.
function rundeDezimal(rohEingabe, stellen) {
  const teile = dezimalTeile(rohEingabe);
  if (!teile) return null;
  const alle = teile.ganz + teile.nach;
  const kommaPos = teile.ganz.length;
  const behalten = kommaPos + stellen;

  if (behalten >= alle.length) {
    const nachNeu = (teile.nach + "0".repeat(stellen)).slice(0, stellen);
    return { text: nachNeu ? teile.ganz + "," + nachNeu : teile.ganz, entscheidend: null, aufgerundet: false, uebertrag: false };
  }
  const entscheidend = Number(alle[behalten]);
  const ziffern = alle
    .slice(0, behalten)
    .split("")
    .map(Number);
  let aufgerundet = entscheidend >= 5;
  let uebertrag = false;
  if (aufgerundet) {
    let i = ziffern.length - 1;
    while (i >= 0) {
      ziffern[i]++;
      if (ziffern[i] < 10) break;
      ziffern[i] = 0;
      i--;
    }
    if (i < 0) {
      ziffern.unshift(1);
      uebertrag = true;
    }
  }
  const kommaNeu = kommaPos + (uebertrag ? 1 : 0);
  const ganzNeu = ziffern.slice(0, kommaNeu).join("") || "0";
  const nachNeu = ziffern.slice(kommaNeu).join("");
  return { text: nachNeu ? ganzNeu + "," + nachNeu : ganzNeu, entscheidend, aufgerundet, uebertrag };
}

const STELLEN_NAME = ["ganze Zahlen", "Zehntel", "Hundertstel", "Tausendstel"];

function renderRunden() {
  const roh = document.getElementById("rnd-input").value;
  const stellen = Number(document.getElementById("rnd-stelle").value);
  const out = document.getElementById("rnd-mount");
  const teile = dezimalTeile(roh);
  if (!teile) {
    out.innerHTML = `<span class="progress-note">Bitte eine Dezimalzahl mit Komma eingeben, z.&nbsp;B. 3,4728.</span>`;
    return;
  }
  const erg = rundeDezimal(roh, stellen);
  const zahl = teile.ganz + (teile.nach ? "," + teile.nach : "");
  out.innerHTML =
    (erg.entscheidend === null
      ? `${zahl} hat gar nicht so viele Stellen — es wird nur mit Nullen aufgefüllt.<br>`
      : `Entscheidend ist die Ziffer rechts neben der ${STELLEN_NAME[stellen]}-Stelle: <strong style="color:#b3261e">${erg.entscheidend}</strong> ⇒ ${erg.aufgerundet ? "<strong>aufrunden</strong>" : "<strong>abrunden</strong>"}<br>`) +
    `${zahl} gerundet auf ${STELLEN_NAME[stellen]} ≈ <span class="dez-ergebnis">${erg.text}</span>` +
    (erg.uebertrag
      ? `<br><span class="progress-note">Hier ist beim Aufrunden ein Übertrag bis in die Ganzen gelaufen — die Zahl vor dem Komma hat sich erhöht.</span>`
      : "") +
    (stellen > 0 && erg.text.includes(",") && erg.text.split(",")[1].endsWith("0")
      ? `<br><span class="progress-note">Die Null am Ende bleibt stehen: Sie zeigt an, dass auf ${STELLEN_NAME[stellen]} genau gerundet wurde.</span>`
      : "");
}
function initRunden() {
  document.getElementById("rnd-input").addEventListener("input", renderRunden);
  document.getElementById("rnd-stelle").addEventListener("change", renderRunden);
  renderRunden();
}

// ================= 10. Gestaffelte Übungsaufgaben =================
// Wiederverwendbarer Baustein (wie in den Lernpfaden 1 und 2): Aufgabe 1 (einfach) ist immer
// sichtbar, Aufgabe 2-4 liegen hinter Reitern. Jede Aufgabe hat einen Würfel-Knopf für neue Zahlen.
// Zusätzlich hier: Aufgaben können statt eines Zahlenvergleichs eine eigene Prüffunktion mitbringen
// (z. B. "vollständig gekürzt" — da zählt die Schreibweise, nicht nur der Wert) und einen
// diagnostischen Hinweis zu typischen Falschantworten liefern.

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
    let ok;
    if (current.check) {
      ok = current.check(raw);
    } else {
      const val = parseFlexibleNumber(raw);
      const tol = current.tolerance ?? 0.01;
      ok = !isNaN(val) && Math.abs(val - current.correct) < tol;
    }
    const hinweis = !ok && current.hinweis ? current.hinweis(raw) : "";
    const statusHtml = ok
      ? `<div class="status ok">✓ Richtig!</div>`
      : `<div class="status err">✗ Noch nicht richtig${raw ? " — deine Eingabe: " + raw : " — du hast noch keine Antwort eingetragen"}.</div>` +
        (hinweis ? `<div style="margin-bottom:0.3rem">${hinweis}</div>` : "");
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

// Vollständig gekürzte echte Brüche als Baukasten — so lassen sich Aufgaben konstruktiv erzeugen,
// ohne Zufallszahlen zu verwerfen.
const STAMMPAARE = [
  [1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5],
  [1, 6], [5, 6], [3, 8], [5, 8], [7, 8], [2, 9], [4, 9], [5, 9], [7, 9],
  [3, 10], [7, 10], [1, 12], [5, 12], [7, 12], [11, 12],
];
// Nenner aus ausschließlich 2en und 5en ⇒ die Dezimaldarstellung bricht garantiert ab.
const ABBRECHEND = [
  [1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5], [1, 8], [3, 8], [5, 8], [7, 8],
  [1, 20], [3, 20], [7, 20], [9, 20], [11, 20], [13, 20], [1, 25], [3, 25], [7, 25], [1, 40], [3, 40], [7, 40],
];

function generateAufgabe1() {
  const [zk, nk] = pick(STAMMPAARE);
  const k = randInt(2, 6);
  const z = zk * k,
    n = nk * k;
  return {
    promptHtml: `Kürze den Bruch ${bruchHtml(z, n, "gross")} vollständig.`,
    placeholder: "z. B. 3/4",
    check: (raw) => {
      const b = parseBruchEingabe(raw);
      return !!b && b.z === zk && b.n === nk;
    },
    hinweis: (raw) => {
      const b = parseBruchEingabe(raw);
      if (!b) return "Schreibe deine Antwort als Bruch in der Form <code>z/n</code>, z.&nbsp;B. <code>3/4</code>.";
      if (b.z * nk === zk * b.n) {
        return `Der <strong>Wert</strong> stimmt schon — aber ${bruchHtml(b.z, b.n)} ist noch nicht vollständig gekürzt: ggT(${b.z}; ${b.n}) = ${ggT(b.z, b.n)}. Kürze weiter, bis Zähler und Nenner teilerfremd sind.`;
      }
      return "";
    },
    musterloesungHtml:
      `ggT(${z}; ${n}) = <strong>${k}</strong>. Also Zähler und Nenner durch ${k} dividieren:<br>` +
      `${bruchHtml(z, n)} = ${bruchHtml(z + " : " + k, n + " : " + k)} = ${bruchHtml(zk, nk, "gross")}<br>` +
      `Probe: ggT(${zk}; ${nk}) = 1 — der Bruch ist teilerfremd, also vollständig gekürzt.`,
  };
}

function generateAufgabe2() {
  const [zk, nk] = pick(STAMMPAARE);
  const einheit = pick(["g", "min", "cm", "€"]);
  const wert = nk * randInt(4, 40);
  const einTeil = wert / nk;
  const correct = einTeil * zk;
  return {
    promptHtml: `Wie viel sind ${bruchHtml(zk, nk)} von ${num(wert)} ${einheit}?`,
    correct,
    tolerance: 0.5,
    placeholder: "Ergebnis in " + einheit,
    musterloesungHtml:
      `① ein ${nk}-tel bestimmen: ${num(wert)} ${einheit} : ${nk} = ${num(einTeil)} ${einheit}<br>` +
      `② davon ${zk} nehmen: ${num(einTeil)} ${einheit} · ${zk} = <strong>${num(correct)} ${einheit}</strong>`,
  };
}

function generateAufgabe3() {
  const [zk, nk] = pick(ABBRECHEND);
  const d = bruchAlsDezimal(zk, nk);
  const dezText = `${d.vor},${d.vorperiode}`;
  const nenner = Math.pow(10, d.vorperiode.length);
  const zaehler = Number(d.vorperiode);
  const g = ggT(zaehler, nenner);
  const nameStelle = ["Zehntel", "Hundertstel", "Tausendstel"][d.vorperiode.length - 1] || `${num(nenner)}-tel`;
  return {
    promptHtml: `Schreibe die Dezimalzahl <strong>${dezText}</strong> als vollständig gekürzten Bruch.`,
    placeholder: "z. B. 3/8",
    check: (raw) => {
      const b = parseBruchEingabe(raw);
      return !!b && b.z === zk && b.n === nk;
    },
    hinweis: (raw) => {
      const b = parseBruchEingabe(raw);
      if (!b) return "Schreibe deine Antwort als Bruch in der Form <code>z/n</code>, z.&nbsp;B. <code>3/8</code>.";
      if (b.z * nk === zk * b.n) {
        return `Der <strong>Wert</strong> stimmt — aber ${bruchHtml(b.z, b.n)} ist noch nicht vollständig gekürzt: ggT(${b.z}; ${b.n}) = ${ggT(b.z, b.n)}.`;
      }
      return "";
    },
    musterloesungHtml:
      `① Die letzte Ziffer steht an der ${nameStelle}-Stelle ⇒ Nenner ${num(nenner)}:<br>` +
      `${dezText} = ${bruchHtml(zaehler, nenner)}<br>` +
      `② vollständig kürzen mit ggT(${zaehler}; ${num(nenner)}) = ${g}:<br>` +
      `${bruchHtml(zaehler, nenner)} = ${bruchHtml(zk, nk, "gross")}`,
  };
}

function generateAufgabe4() {
  // Konstruktive Erzeugung, damit beide Zwischenergebnisse garantiert ganzzahlig sind:
  // gesamt = n1 · n2 · t  ⇒  gesamt · z1/n1 = n2 · z1 · t  ⇒  davon z2/n2 = z1 · z2 · t
  const [z1, n1] = pick([[1, 2], [2, 3], [3, 4], [3, 5], [5, 8], [5, 6], [2, 5], [7, 10]]);
  const [z2, n2] = pick([[1, 3], [3, 10], [1, 4], [2, 5], [1, 2], [3, 8]]);
  const t = randInt(2, 9);
  const gesamt = n1 * n2 * t;
  const zwischen = n2 * z1 * t;
  const correct = z1 * z2 * t;
  const kontext = pick([
    { was: "Schülerinnen und Schüler", teil1: "fahren mit dem Bus zur Schule", teil2: "steigen an der Endhaltestelle aus", frage: "Wie viele sind das?" },
    { was: "Bücher", teil1: "sind Romane", teil2: "davon sind Krimis", frage: "Wie viele Krimis gibt es?" },
    { was: "Bauteile", teil1: "werden lackiert", teil2: "davon werden rot lackiert", frage: "Wie viele Teile werden rot lackiert?" },
  ]);
  return {
    promptHtml:
      `Eine Sammlung umfasst ${num(gesamt)} ${kontext.was}. ${bruchHtml(z1, n1)} davon ${kontext.teil1}. ` +
      `Von diesen wiederum ${bruchHtml(z2, n2)} ${kontext.teil2}. ${kontext.frage}`,
    correct,
    tolerance: 0.5,
    placeholder: "Anzahl",
    musterloesungHtml:
      `① ${bruchHtml(z1, n1)} von ${num(gesamt)}: ${num(gesamt)} : ${n1} = ${num(gesamt / n1)}, davon ${z1} ⇒ <strong>${num(zwischen)}</strong><br>` +
      `② ${bruchHtml(z2, n2)} von ${num(zwischen)}: ${num(zwischen)} : ${n2} = ${num(zwischen / n2)}, davon ${z2} ⇒ <strong>${num(correct)}</strong><br>` +
      `<span class="progress-note">Wichtig: Der zweite Anteil bezieht sich auf das <em>Zwischenergebnis</em>, nicht auf die ursprüngliche Gesamtzahl.</span>`,
  };
}

function initExercises() {
  mountUebungsaufgaben(document.getElementById("exercises-mount"), [
    { schwierigkeit: "einfach", titel: "Aufgabe 1 — Vollständig kürzen", generate: generateAufgabe1 },
    { schwierigkeit: "mittel", titel: "Aufgabe 2 — Anteil einer Größe", generate: generateAufgabe2 },
    { schwierigkeit: "schwierig", titel: "Aufgabe 3 — Dezimalzahl als Bruch", generate: generateAufgabe3 },
    { schwierigkeit: "komplex", titel: "Aufgabe 4 — Anteil vom Anteil", generate: generateAufgabe4 },
  ]);
}

// ================= Quizze =================

function initQuizzes() {
  mountQuiz(document.getElementById("quiz-anteil"), {
    q: "Was sagt der Nenner eines Bruchs aus?",
    options: [
      "Wie viele Teile genommen werden",
      "In wie viele gleich große Teile das Ganze zerlegt wird",
      "Wie groß das Ganze ist",
      "Ob der Bruch echt oder unecht ist",
    ],
    correct: 1,
    explain: "Der Nenner benennt die Teile (Viertel, Fünftel …), der Zähler zählt, wie viele davon genommen werden.",
  });
  mountQuiz(document.getElementById("quiz-erweitern"), {
    q: "Was passiert mit dem Wert eines Bruchs, wenn man ihn kürzt?",
    options: [
      "Er wird kleiner",
      "Er bleibt gleich — nur die Schreibweise wird kürzer",
      "Er wird größer",
      "Das hängt davon ab, womit man kürzt",
    ],
    correct: 1,
    explain: "Kürzen teilt Zähler und Nenner durch dieselbe Zahl. Der Anteil bleibt derselbe, er wird nur gröber eingeteilt aufgeschrieben.",
  });
  mountQuiz(document.getElementById("quiz-vergleichen"), {
    q: "Welcher Bruch ist größer: ein Drittel oder ein Fünftel?",
    options: [
      "Ein Fünftel, weil 5 größer als 3 ist",
      "Ein Drittel, weil das Ganze in weniger und damit größere Teile zerlegt wird",
      "Beide sind gleich groß",
      "Das lässt sich ohne Taschenrechner nicht entscheiden",
    ],
    correct: 1,
    explain: "Je größer der Nenner, desto kleiner die einzelnen Teile. Auf den Hauptnenner 15 gebracht: 5/15 gegen 3/15.",
  });
  mountQuiz(document.getElementById("quiz-gemischt"), {
    q: "Wie wandelt man den unechten Bruch 17/5 in eine gemischte Zahl um?",
    options: [
      "17 − 5 = 12, also 12 Ganze und Rest 5",
      "Division mit Rest: 17 : 5 = 3 Rest 2, also 3 und 2/5",
      "Man kürzt 17/5 vollständig",
      "17 + 5 = 22, also 22/5",
    ],
    correct: 1,
    explain: "Der Quotient wird die ganze Zahl, der Rest der neue Zähler, der Nenner bleibt unverändert.",
  });
  mountQuiz(document.getElementById("quiz-dezimal"), {
    q: "Welche Zahl ist größer: 0,5 oder 0,45?",
    options: [
      "0,45, weil 45 größer als 5 ist",
      "0,5, denn 0,5 = 0,50 und 50 Hundertstel sind mehr als 45 Hundertstel",
      "Beide sind gleich groß",
      "0,45, weil sie mehr Stellen hat",
    ],
    correct: 1,
    explain: "Nachkommastellen sind keine eigene Zahl. Gleich lang machen (0,50 gegen 0,45) macht den Vergleich eindeutig.",
  });
  mountQuiz(document.getElementById("quiz-umwandeln"), {
    q: "Woran erkennt man vorab, dass ein vollständig gekürzter Bruch eine abbrechende Dezimalzahl ergibt?",
    options: [
      "Am Zähler: Er muss gerade sein",
      "Am Nenner: Er darf nur die Primfaktoren 2 und 5 enthalten",
      "Der Bruch muss echt sein",
      "Das kann man erst nach dem Ausrechnen sagen",
    ],
    correct: 1,
    explain: "Nur Nenner der Form 2^a · 5^b lassen sich auf eine Zehnerpotenz erweitern. Jeder andere Primfaktor — etwa 3 oder 7 — erzwingt eine Periode.",
  });
  mountQuiz(document.getElementById("quiz-runden"), {
    q: "Was ergibt 2,97 gerundet auf Zehntel?",
    options: ["2,9", "2,10", "3,0", "3"],
    correct: 2,
    explain: "Die Hundertstelziffer 7 führt zum Aufrunden. Dabei entsteht ein Übertrag: 2,9 + 0,1 = 3,0. Die Null bleibt stehen, weil auf Zehntel gerundet wurde.",
  });
}

// ================= Start =================

document.addEventListener("DOMContentLoaded", () => {
  initAnteil();
  initAnteilVonGroesse();
  initErweitern();
  initKuerzen();
  initVergleich();
  initGemischt();
  initDezTafel();
  initDezVergleich();
  initBruchZuDezimal();
  initDezimalZuBruch();
  initRunden();
  initExercises();
  initQuizzes();
});
