// Selbstlernpfad "Brüche und Dezimalzahlen addieren und subtrahieren" (Grundwissen Klasse 5-10).
// Rein clientseitiges Vanilla-JS, ohne Build-Schritt oder externe Bibliotheken.
//
// Zwei Grundsätze für die Rechenkerne:
// 1. Brüche werden AUSSCHLIESSLICH ganzzahlig gerechnet (Zähler/Nenner als Integer-Paar). Ein
//    Umweg über Kommazahlen würde 1/3 + 1/3 + 1/3 zu 0,9999999999999998 machen.
// 2. Dezimalzahlen werden ZIFFERNWEISE auf Strings gerechnet. 0,1 + 0,2 ergibt in double-Arithmetik
//    0,30000000000000004 — auf einer Seite, die schriftliches Rechnen erklärt, wäre das absurd.

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
// Dezimalzahl mit fester Stellenzahl — anders als num() bleibt die Null hinter dem Komma stehen,
// und genau darauf kommt es beim stellengerechten Untereinanderschreiben an.
function dez(x, stellen) {
  return x.toFixed(stellen).replace(".", ",");
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
function kuerze(z, n) {
  const g = ggT(z, n);
  return { z: z / g, n: n / g, g };
}
function bruchHtml(z, n, cls = "") {
  return `<span class="bruch ${cls}"><span class="z">${z}</span><span class="n">${n}</span></span>`;
}
// Gemischte Schreibweise, wenn der Bruch unecht ist.
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
// Zerlegt "24,7" in Vorkomma- und Nachkommaziffern.
function dezimalTeile(raw) {
  const s = String(raw).trim().replace(/\./g, ",");
  const m = s.match(/^(\d*)(?:,(\d*))?$/);
  if (!m) return null;
  return { ganz: m[1] === "" ? "0" : m[1], nach: m[2] || "" };
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

function balkenAnteil(gefuellt, n, w = 250, h = 32, klasse = "anteil-teil") {
  const svg = svgEl("svg", { viewBox: `0 0 ${w} ${h}`, width: w, height: h });
  const bw = w / n;
  for (let i = 0; i < n; i++) {
    svg.appendChild(
      svgEl("rect", { x: (i * bw).toFixed(2), y: 0, width: bw.toFixed(2), height: h, class: i < gefuellt ? klasse : "anteil-rest" })
    );
  }
  return svg;
}
function summeZeile(label, gefuellt, n, klasse) {
  return el("div", { class: "summe-zeile" }, [
    el("div", { class: "summe-label" }, label),
    balkenAnteil(Math.max(0, Math.min(gefuellt, n)), n, 250, 32, klasse),
  ]);
}

// ================= 1. Gleichnamige Brüche =================

function renderGleichnamig() {
  const z1 = clampInt(document.getElementById("gn-z1").value, 0, 20);
  const z2 = clampInt(document.getElementById("gn-z2").value, 0, 20);
  const n = clampInt(document.getElementById("gn-n").value, 1, 20);
  const op = document.getElementById("gn-op").value;
  const zErg = op === "add" ? z1 + z2 : z1 - z2;

  const mount = document.getElementById("gn-mount");
  mount.innerHTML = "";
  const text = document.getElementById("gn-text");

  if (zErg < 0) {
    text.innerHTML = `${bruchHtml(z1, n)} − ${bruchHtml(z2, n)} ergibt weniger als null — in den natürlichen Brüchen ist das nicht definiert. Wähle den ersten Zähler mindestens so groß wie den zweiten.`;
    return;
  }

  mount.appendChild(summeZeile(`${z1}/${n}`, z1, n, "anteil-teil"));
  mount.appendChild(summeZeile(`${op === "add" ? "+" : "−"} ${z2}/${n}`, z2, n, "anteil-teil-b"));
  mount.appendChild(summeZeile(`= ${zErg}/${n}`, zErg, n, "anteil-teil-c"));

  const k = kuerze(zErg, n);
  text.innerHTML =
    `Beide Brüche haben den Nenner <strong>${n}</strong> — die Teile sind gleich groß, also werden nur die Zähler verrechnet:<br>` +
    `${bruchHtml(z1, n)} ${op === "add" ? "+" : "−"} ${bruchHtml(z2, n)} = ${bruchHtml(`${z1} ${op === "add" ? "+" : "−"} ${z2}`, n)} = ${bruchHtml(zErg, n, "gross")}` +
    (k.g > 1 ? `<br>Vollständig kürzen mit ggT(${zErg}; ${n}) = ${k.g}: ${bruchHtml(zErg, n)} = ${bruchHtml(k.z, k.n, "gross")}` : "") +
    (k.z >= k.n && k.n !== 1 ? `<br>Als gemischte Zahl: ${gemischtHtml(k.z, k.n)}` : "") +
    `<br><span class="progress-note">Der Nenner bleibt ${n} — er wird <strong>nicht</strong> mitaddiert.</span>`;
}
function initGleichnamig() {
  ["gn-z1", "gn-z2", "gn-n"].forEach((id) => document.getElementById(id).addEventListener("input", renderGleichnamig));
  document.getElementById("gn-op").addEventListener("change", renderGleichnamig);
  renderGleichnamig();
}

// ================= 2. Ungleichnamige Brüche =================

function renderUngleichnamig() {
  const z1 = clampInt(document.getElementById("un-z1").value, 0, 20);
  const n1 = clampInt(document.getElementById("un-n1").value, 1, 20);
  const z2 = clampInt(document.getElementById("un-z2").value, 0, 20);
  const n2 = clampInt(document.getElementById("un-n2").value, 1, 20);
  const op = document.getElementById("un-op").value;

  const hn = kgV(n1, n2);
  const f1 = hn / n1,
    f2 = hn / n2;
  const a = z1 * f1,
    b = z2 * f2;
  const zErg = op === "add" ? a + b : a - b;

  const mount = document.getElementById("un-mount");
  mount.innerHTML = "";
  const text = document.getElementById("un-text");

  if (zErg < 0) {
    text.innerHTML = `${bruchHtml(z1, n1)} − ${bruchHtml(z2, n2)} ergibt weniger als null — wähle den ersten Bruch mindestens so groß wie den zweiten.`;
    return;
  }

  if (hn <= 48) {
    mount.appendChild(summeZeile(`${z1}/${n1} = ${a}/${hn}`, a, hn, "anteil-teil"));
    mount.appendChild(summeZeile(`${op === "add" ? "+" : "−"} ${z2}/${n2} = ${b}/${hn}`, b, hn, "anteil-teil-b"));
    mount.appendChild(summeZeile(`= ${zErg}/${hn}`, zErg, hn, "anteil-teil-c"));
  }

  const k = kuerze(zErg, hn);
  text.innerHTML =
    `① Hauptnenner: kgV(${n1}; ${n2}) = <strong>${hn}</strong><br>` +
    `② erweitern: ${bruchHtml(z1, n1)} = ${bruchHtml(a, hn)} (mit ${f1}) &nbsp;·&nbsp; ${bruchHtml(z2, n2)} = ${bruchHtml(b, hn)} (mit ${f2})<br>` +
    `③ Zähler verrechnen: ${bruchHtml(a, hn)} ${op === "add" ? "+" : "−"} ${bruchHtml(b, hn)} = ${bruchHtml(zErg, hn, "gross")}<br>` +
    `④ ` +
    (k.g > 1
      ? `kürzen mit ggT(${zErg}; ${hn}) = ${k.g} ⇒ ${bruchHtml(k.z, k.n, "gross")}`
      : `${bruchHtml(zErg, hn)} ist bereits vollständig gekürzt.`) +
    (k.z >= k.n && k.n !== 1 ? ` Als gemischte Zahl: ${gemischtHtml(k.z, k.n)}` : "");
}
function initUngleichnamig() {
  ["un-z1", "un-n1", "un-z2", "un-n2"].forEach((id) =>
    document.getElementById(id).addEventListener("input", renderUngleichnamig)
  );
  document.getElementById("un-op").addEventListener("change", renderUngleichnamig);
  renderUngleichnamig();
}

// ================= 3. Gemischte Zahlen =================

function renderGemischt() {
  const g1 = clampInt(document.getElementById("gm-g1").value, 0, 20);
  const z1 = clampInt(document.getElementById("gm-z1").value, 0, 20);
  const n1 = clampInt(document.getElementById("gm-n1").value, 1, 20);
  const g2 = clampInt(document.getElementById("gm-g2").value, 0, 20);
  const z2 = clampInt(document.getElementById("gm-z2").value, 0, 20);
  const n2 = clampInt(document.getElementById("gm-n2").value, 1, 20);
  const op = document.getElementById("gm-op").value;

  // Über unechte Brüche rechnen — dabei kann beim Übertrag nichts verlorengehen.
  const u1 = g1 * n1 + z1;
  const u2 = g2 * n2 + z2;
  const hn = kgV(n1, n2);
  const a = u1 * (hn / n1);
  const b = u2 * (hn / n2);
  const zErg = op === "add" ? a + b : a - b;
  const text = document.getElementById("gm-text");

  if (zErg < 0) {
    text.innerHTML = `Das Ergebnis wäre negativ — wähle die erste Zahl mindestens so groß wie die zweite.`;
    return;
  }
  const k = kuerze(zErg, hn);
  // Musste beim Subtrahieren entbündelt werden? Genau dann, wenn der Bruchteil nicht ausreicht.
  const musteEntbuendeln = op === "sub" && z1 * (hn / n1) < z2 * (hn / n2);

  text.innerHTML =
    `① in unechte Brüche umwandeln:<br>` +
    `&nbsp;&nbsp;${g1}${bruchHtml(z1, n1)} = ${bruchHtml(`${g1} · ${n1} + ${z1}`, n1)} = ${bruchHtml(u1, n1)} &nbsp;·&nbsp; ` +
    `${g2}${bruchHtml(z2, n2)} = ${bruchHtml(`${g2} · ${n2} + ${z2}`, n2)} = ${bruchHtml(u2, n2)}<br>` +
    (hn !== n1 || hn !== n2
      ? `② gleichnamig machen (Hauptnenner ${hn}): ${bruchHtml(a, hn)} und ${bruchHtml(b, hn)}<br>`
      : `② die Nenner sind schon gleich (${hn}).<br>`) +
    `③ Zähler verrechnen: ${bruchHtml(zErg, hn, "gross")}<br>` +
    `④ zurückwandeln${k.g > 1 ? ` und kürzen (ggT = ${k.g})` : ""}: <strong>${gemischtHtml(k.z, k.n)}</strong>` +
    (musteEntbuendeln
      ? `<br><span class="progress-note">Hier reichte der Bruchteil nicht aus — beim Rechnen „auf dem Papier“ hättest du ein Ganzes zerlegen müssen. Über die unechten Brüche erledigt sich das von selbst.</span>`
      : "");
}
function initGemischt() {
  ["gm-g1", "gm-z1", "gm-n1", "gm-g2", "gm-z2", "gm-n2"].forEach((id) =>
    document.getElementById(id).addEventListener("input", renderGemischt)
  );
  document.getElementById("gm-op").addEventListener("change", renderGemischt);
  renderGemischt();
}

// ================= 4. Dezimalzahlen schriftlich =================

// Bringt beide Zahlen auf dieselbe Stellenanzahl. Vorne mit Leerzeichen (nur Darstellung), hinten
// mit Nullen — das Auffüllen hinten ist der didaktische Kern: es ändert den Wert nicht.
function dezModell(aRoh, bRoh) {
  const A = dezimalTeile(aRoh),
    B = dezimalTeile(bRoh);
  if (!A || !B) return null;
  const maxGanz = Math.max(A.ganz.length, B.ganz.length);
  const maxNach = Math.max(A.nach.length, B.nach.length);
  const bauZiffern = (t) => {
    const ganz = t.ganz.padStart(maxGanz, " ").split("");
    const nach = t.nach.padEnd(maxNach, "0").split("");
    const ergaenzt = t.nach.length; // ab hier sind es nur noch Füllnullen
    return {
      ziffern: [...ganz, ...nach].map((c) => (c === " " ? null : Number(c))),
      istFuellnull: [...ganz.map(() => false), ...nach.map((_, i) => i >= ergaenzt)],
    };
  };
  const a = bauZiffern(A),
    b = bauZiffern(B);
  return { a, b, maxGanz, maxNach, len: maxGanz + maxNach, wertA: A, wertB: B };
}

function dezAddition(modell) {
  const { a, b, len } = modell;
  const summe = new Array(len).fill(0);
  const uebertragIn = new Array(len).fill(0);
  let carry = 0;
  for (let i = len - 1; i >= 0; i--) {
    uebertragIn[i] = carry;
    const s = (a.ziffern[i] ?? 0) + (b.ziffern[i] ?? 0) + carry;
    summe[i] = s % 10;
    carry = Math.floor(s / 10);
  }
  return { summe, uebertragIn, ueberlauf: carry };
}

function dezSubtraktion(modell) {
  const { a, b, len } = modell;
  const diff = new Array(len).fill(0);
  const geliehen = new Array(len).fill(false);
  let borrow = 0;
  for (let i = len - 1; i >= 0; i--) {
    let oben = (a.ziffern[i] ?? 0) - borrow;
    let nb = 0;
    if (oben < (b.ziffern[i] ?? 0)) {
      oben += 10;
      nb = 1;
    }
    diff[i] = oben - (b.ziffern[i] ?? 0);
    geliehen[i] = nb === 1;
    borrow = nb;
  }
  return { diff, geliehen, unterlauf: borrow === 1 };
}

function renderDezimal() {
  const aRoh = document.getElementById("dz-a").value;
  const bRoh = document.getElementById("dz-b").value;
  const op = document.getElementById("dz-op").value;
  const mount = document.getElementById("dz-mount");
  const text = document.getElementById("dz-text");
  mount.innerHTML = "";

  const m = dezModell(aRoh, bRoh);
  if (!m) {
    text.innerHTML = `<span class="progress-note">Bitte zwei Dezimalzahlen mit Komma eingeben, z.&nbsp;B. 24,7 und 8,35.</span>`;
    return;
  }
  const add = op === "add";
  const r = add ? dezAddition(m) : dezSubtraktion(m);
  if (!add && r.unterlauf) {
    text.innerHTML = `Die erste Zahl ist kleiner als die zweite — bei einer Subtraktion ohne negative Zahlen muss der Minuend mindestens so groß sein.`;
    return;
  }

  const extra = add && r.ueberlauf ? 1 : 0; // zusätzliche Stelle bei Übertrag ganz links
  const table = el("table", { class: "schriftlich-tabelle" });

  // Spaltenaufbau: [Operator][ggf. Überlaufspalte][Ganze …][Komma][Nachkomma …]
  // kommaText ist in der Übertragszeile leer — dort gehören nur die kleinen roten Marken hin.
  function zeile(opZeichen, ziffernFuerSpalte, klasseFuer, extraZelleLinks, kommaText = ",") {
    const tr = el("tr");
    tr.appendChild(el("td", { class: "op" }, opZeichen || ""));
    if (extra) tr.appendChild(extraZelleLinks());
    for (let i = 0; i < m.len; i++) {
      if (i === m.maxGanz) tr.appendChild(el("td", { class: "komma" }, kommaText));
      tr.appendChild(ziffernFuerSpalte(i, klasseFuer));
    }
    return tr;
  }

  // Übertrags-/Leihzeile
  const uebertragZeile = zeile(
    "",
    (i) => {
      if (add) {
        const v = r.uebertragIn[i];
        return el("td", { class: "uebertrag" }, v > 0 ? String(v) : "");
      }
      // Die Leihmarke steht über der Spalte LINKS von der, die geliehen hat.
      const marked = i + 1 < m.len && r.geliehen[i + 1];
      return el("td", { class: "uebertrag" }, marked ? "−1" : "");
    },
    null,
    () => el("td", { class: "uebertrag" }, ""),
    ""
  );
  // Kommaspalte in der Übertragszeile hübsch beschriften
  table.appendChild(uebertragZeile);

  table.appendChild(
    zeile(
      "",
      (i) => {
        const v = m.a.ziffern[i];
        return el("td", { class: v == null ? "blank" : m.a.istFuellnull[i] ? "digit fuellnull" : "digit" }, v == null ? "" : String(v));
      },
      null,
      () => el("td", { class: "blank" }, "")
    )
  );
  table.appendChild(
    zeile(
      add ? "+" : "−",
      (i) => {
        const v = m.b.ziffern[i];
        return el("td", { class: v == null ? "blank" : m.b.istFuellnull[i] ? "digit fuellnull" : "digit" }, v == null ? "" : String(v));
      },
      null,
      () => el("td", { class: "blank" }, "")
    )
  );
  const ergZeile = zeile(
    "",
    (i) => el("td", { class: "digit ergebnis" }, String(add ? r.summe[i] : r.diff[i])),
    null,
    () => el("td", { class: "digit ergebnis" }, String(r.ueberlauf))
  );
  ergZeile.className = "rechenzeile";
  table.appendChild(ergZeile);
  mount.appendChild(table);

  const ergText =
    (extra ? String(r.ueberlauf) : "") +
    (add ? r.summe : r.diff).slice(0, m.maxGanz).join("") +
    (m.maxNach ? "," + (add ? r.summe : r.diff).slice(m.maxGanz).join("") : "");
  const ergSauber = ergText.replace(/^0+(?=\d)/, "");
  const aufgefuellt = m.a.istFuellnull.some(Boolean) || m.b.istFuellnull.some(Boolean);

  text.innerHTML =
    `${m.wertA.ganz}${m.wertA.nach ? "," + m.wertA.nach : ""} ${add ? "+" : "−"} ${m.wertB.ganz}${m.wertB.nach ? "," + m.wertB.nach : ""} = <span class="dez-ergebnis">${ergSauber}</span>` +
    (aufgefuellt
      ? `<br><span class="progress-note">Die blass gesetzten Nullen wurden nur zum Auffüllen ergänzt, damit beide Zahlen gleich viele Nachkommastellen haben. Am Wert ändert das nichts.</span>`
      : "");
}
function initDezimal() {
  ["dz-a", "dz-b"].forEach((id) => document.getElementById(id).addEventListener("input", renderDezimal));
  document.getElementById("dz-op").addEventListener("change", renderDezimal);
  renderDezimal();
}

// ================= 5. Überschlag und Probe =================

// Ordnet einen Bruch grob ein — die übliche Schulheuristik für den Bruch-Überschlag.
function bruchEinordnung(z, n) {
  const doppelt = 2 * z;
  if (z === 0) return "ungefähr 0";
  if (doppelt < n) return "kleiner als ein halb";
  if (doppelt === n) return "genau ein halb";
  if (z < n) return "zwischen ein halb und 1";
  if (z === n) return "genau 1";
  return "größer als 1";
}

function renderKontrolle() {
  const z1 = clampInt(document.getElementById("ko-z1").value, 0, 30);
  const n1 = clampInt(document.getElementById("ko-n1").value, 1, 30);
  const z2 = clampInt(document.getElementById("ko-z2").value, 0, 30);
  const n2 = clampInt(document.getElementById("ko-n2").value, 1, 30);
  const hn = kgV(n1, n2);
  const zErg = z1 * (hn / n1) + z2 * (hn / n2);
  const k = kuerze(zErg, hn);
  // Probe: Ergebnis minus zweiter Summand muss den ersten Summanden ergeben.
  const probeZ = zErg - z2 * (hn / n2);
  const probe = kuerze(probeZ, hn);
  const stimmt = probe.z * n1 === z1 * probe.n;

  document.getElementById("ko-mount").innerHTML =
    `<strong>Überschlag:</strong> ${bruchHtml(z1, n1)} ist ${bruchEinordnung(z1, n1)}, ${bruchHtml(z2, n2)} ist ${bruchEinordnung(z2, n2)}.<br>` +
    `Die Summe muss also ${zErg * 2 < hn ? "unter einem halben" : zErg < hn ? "zwischen einem halben und 1" : zErg === hn ? "genau 1" : "über 1"} liegen.<br>` +
    `<strong>Genau gerechnet:</strong> ${bruchHtml(z1, n1)} + ${bruchHtml(z2, n2)} = ${bruchHtml(k.z, k.n, "gross")}` +
    (k.z >= k.n && k.n !== 1 ? ` = ${gemischtHtml(k.z, k.n)}` : "") +
    `<br><strong>Probe (Umkehroperation):</strong> ${bruchHtml(k.z, k.n)} − ${bruchHtml(z2, n2)} = ${bruchHtml(probe.z, probe.n)} ` +
    (stimmt ? `= ${bruchHtml(z1, n1)} ✓ — der erste Summand kommt zurück, das Ergebnis stimmt.` : `✗`);
}
function initKontrolle() {
  ["ko-z1", "ko-n1", "ko-z2", "ko-n2"].forEach((id) => document.getElementById(id).addEventListener("input", renderKontrolle));
  renderKontrolle();
}

// ================= 8. Gestaffelte Übungsaufgaben =================

// Die Werkbank für die Übungsaufgaben ist für alle Grundwissen-Seiten dieselbe und steht in
// ../../aufgaben.js. Mitgegeben wird nur, wie DIESE Seite eine Eingabe als Zahl liest.
const mountUebungsaufgaben = (container, defs) =>
  mountUebungsaufgabenBasis(container, defs, { parse: parseFlexibleNumber });

// ---------- Aufgaben-Definitionen ----------

// Gemeinsamer diagnostischer Hinweis für alle Bruch-Antworten.
function bruchHinweis(zk, nk) {
  return (raw) => {
    const b = parseBruchEingabe(raw);
    if (!b) return "Schreibe deine Antwort als Bruch in der Form <code>z/n</code>, z.&nbsp;B. <code>3/4</code>.";
    if (b.z * nk === zk * b.n) {
      return `Der <strong>Wert</strong> stimmt — aber ${bruchHtml(b.z, b.n)} ist noch nicht vollständig gekürzt: ggT(${b.z}; ${b.n}) = ${ggT(b.z, b.n)}.`;
    }
    if (b.n === nk * 2 || (b.z === zk && b.n !== nk)) {
      return "Achte darauf, dass beim Addieren gleichnamiger Brüche <strong>nur die Zähler</strong> addiert werden — der Nenner bleibt stehen.";
    }
    return "";
  };
}

function generateAufgabe1() {
  const n = pick([4, 5, 6, 8, 9, 10, 12]);
  const z1 = randInt(1, n - 2);
  const z2 = randInt(1, n - 1 - z1);
  const zSumme = z1 + z2;
  const k = kuerze(zSumme, n);
  return {
    promptHtml: `Berechne und kürze vollständig: ${bruchHtml(z1, n)} + ${bruchHtml(z2, n)}`,
    placeholder: "z. B. 3/4",
    check: (raw) => {
      const b = parseBruchEingabe(raw);
      return !!b && b.z === k.z && b.n === k.n;
    },
    hinweis: bruchHinweis(k.z, k.n),
    tipps: [
      `Beide Brüche zählen dieselben Stücke — es sind ${n}-tel.`,
      `Nur die Zähler addieren: ${z1} + ${z2}. Der Nenner ${n} bleibt stehen.`,
      "Zum Schluss prüfen, ob sich das Ergebnis noch kürzen lässt.",
    ],
    musterloesungHtml:
      `Beide Brüche sind gleichnamig (Nenner ${n}) — nur die Zähler addieren, Nenner bleibt:<br>` +
      `${bruchHtml(z1, n)} + ${bruchHtml(z2, n)} = ${bruchHtml(`${z1} + ${z2}`, n)} = ${bruchHtml(zSumme, n)}` +
      (k.g > 1 ? `<br>Kürzen mit ggT(${zSumme}; ${n}) = ${k.g}: ${bruchHtml(k.z, k.n, "gross")}` : `<br>${bruchHtml(zSumme, n)} ist bereits vollständig gekürzt.`),
  };
}

function generateAufgabe2() {
  // Zwei verschiedene Nenner; die Summe bleibt bewusst unter 1, damit ein echter Bruch entsteht.
  let n1, n2;
  do {
    n1 = pick([2, 3, 4, 5, 6, 8, 10, 12]);
    n2 = pick([2, 3, 4, 5, 6, 8, 10, 12]);
  } while (n1 === n2);
  const hn = kgV(n1, n2);
  // Beide Zähler werden so beschränkt, dass die Summe GARANTIERT unter 1 bleibt: z1 muss noch
  // mindestens einen Schritt des zweiten Bruchs übriglassen, z2 den verbliebenen Rest.
  const schritt1 = hn / n1,
    schritt2 = hn / n2;
  const z1max = Math.min(n1 - 1, Math.floor((hn - 1 - schritt2) / schritt1));
  const z1 = randInt(1, Math.max(1, z1max));
  const z2max = Math.min(n2 - 1, Math.floor((hn - 1 - z1 * schritt1) / schritt2));
  const z2 = randInt(1, Math.max(1, z2max));
  const zErg = z1 * schritt1 + z2 * schritt2;
  const k = kuerze(zErg, hn);
  return {
    promptHtml: `Berechne und kürze vollständig: ${bruchHtml(z1, n1)} + ${bruchHtml(z2, n2)}`,
    placeholder: "z. B. 5/6",
    check: (raw) => {
      const b = parseBruchEingabe(raw);
      return !!b && b.z === k.z && b.n === k.n;
    },
    hinweis: bruchHinweis(k.z, k.n),
    tipps: [
      "Verschiedene Nenner heißt: verschieden große Stücke. Addieren lässt sich erst, wenn die Stücke gleich groß sind.",
      `Ein gemeinsamer Nenner ist das kgV von ${n1} und ${n2}: ${hn}.`,
      "Beide Brüche darauf erweitern, dann die Zähler addieren — und am Ende kürzen.",
    ],
    musterloesungHtml:
      `① Hauptnenner: kgV(${n1}; ${n2}) = ${hn}<br>` +
      `② erweitern: ${bruchHtml(z1, n1)} = ${bruchHtml(z1 * (hn / n1), hn)} und ${bruchHtml(z2, n2)} = ${bruchHtml(z2 * (hn / n2), hn)}<br>` +
      `③ Zähler addieren: ${bruchHtml(zErg, hn)}<br>` +
      `④ ` +
      (k.g > 1 ? `kürzen mit ggT = ${k.g} ⇒ ${bruchHtml(k.z, k.n, "gross")}` : `bereits vollständig gekürzt: ${bruchHtml(k.z, k.n, "gross")}`),
  };
}

function generateAufgabe3() {
  // Subtraktion gemischter Zahlen, bei der der Bruchteil garantiert NICHT ausreicht —
  // konstruktiv erzeugt, damit immer entbündelt werden muss.
  const n = pick([4, 5, 6, 8, 10, 12]);
  const z2 = randInt(2, n - 1); // Bruchteil der zweiten Zahl
  const z1 = randInt(1, z2 - 1); // kleiner ⇒ reicht nicht aus
  const g2 = randInt(1, 4);
  const g1 = g2 + randInt(1, 3); // Ergebnis bleibt positiv
  const u1 = g1 * n + z1;
  const u2 = g2 * n + z2;
  const zErg = u1 - u2;
  const k = kuerze(zErg, n);
  const ganzeErg = Math.floor(k.z / k.n);
  const restErg = k.z - ganzeErg * k.n;
  return {
    promptHtml: `Berechne: ${g1}${bruchHtml(z1, n)} − ${g2}${bruchHtml(z2, n)}<br><span class="progress-note">Gib das Ergebnis als vollständig gekürzten <strong>unechten Bruch</strong> an (z.&nbsp;B. <code>7/4</code>).</span>`,
    placeholder: "z. B. 7/4",
    check: (raw) => {
      const b = parseBruchEingabe(raw);
      return !!b && b.z === k.z && b.n === k.n;
    },
    hinweis: (raw) => {
      const b = parseBruchEingabe(raw);
      if (!b) return "Schreibe deine Antwort als Bruch in der Form <code>z/n</code>.";
      if (b.z * k.n === k.z * b.n) return `Der <strong>Wert</strong> stimmt — kürze noch vollständig: ggT(${b.z}; ${b.n}) = ${ggT(b.z, b.n)}.`;
      return `Der Bruchteil ${bruchHtml(z1, n)} reicht nicht aus, um ${bruchHtml(z2, n)} abzuziehen — du musst ein Ganzes zerlegen (oder gleich mit unechten Brüchen rechnen).`;
    },
    tipps: [
      `Vergleiche zuerst die Bruchteile: Reicht ${bruchHtml(z1, n)} aus, um ${bruchHtml(z2, n)} abzuziehen?`,
      "Wenn nicht, hilft der sichere Weg: beide gemischten Zahlen zuerst in unechte Brüche verwandeln.",
      `${g1}${bruchHtml(z1, n)} = ${bruchHtml(u1, n)} — so lässt sich ohne Entbündeln rechnen.`,
    ],
    musterloesungHtml:
      `Der Bruchteil ${bruchHtml(z1, n)} reicht nicht aus, um ${bruchHtml(z2, n)} abzuziehen. Sicherer Weg über unechte Brüche:<br>` +
      `① ${g1}${bruchHtml(z1, n)} = ${bruchHtml(`${g1} · ${n} + ${z1}`, n)} = ${bruchHtml(u1, n)} &nbsp;·&nbsp; ${g2}${bruchHtml(z2, n)} = ${bruchHtml(u2, n)}<br>` +
      `② gleicher Nenner ⇒ Zähler subtrahieren: ${bruchHtml(`${u1} − ${u2}`, n)} = ${bruchHtml(zErg, n)}<br>` +
      `③ ${k.g > 1 ? `kürzen mit ggT = ${k.g} ⇒ ${bruchHtml(k.z, k.n, "gross")}` : `bereits vollständig gekürzt: ${bruchHtml(k.z, k.n, "gross")}`}` +
      `<br>Als gemischte Zahl: ${restErg === 0 ? `<strong>${ganzeErg}</strong>` : `<strong>${ganzeErg}</strong>${bruchHtml(restErg, k.n)}`}`,
  };
}

function generateAufgabe4() {
  // Sachaufgabe, die Bruch und Dezimalzahl mischt. Alle Zahlen so gewählt, dass in Zehnteln
  // gerechnet werden kann und das Ergebnis eine glatte Dezimalzahl ist.
  const [z1, n1] = pick([[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [3, 10]]);
  // Die Gesamtmenge wird als Vielfaches des Nenners gewählt — dann ist der Anteil garantiert
  // ganzzahlig (in Zehnteln gerechnet). Die zweite Menge bleibt echt unter dem, was danach übrig
  // ist, damit der Rest positiv bleibt.
  const gesamtZehntel = n1 * randInt(10, 50);
  const abZehntel = (gesamtZehntel / n1) * z1;
  const nachAnteil = gesamtZehntel - abZehntel;
  const maxZweit = nachAnteil - 1;
  const zweiteZehntel = maxZweit >= 5 ? 5 * randInt(1, Math.floor(maxZweit / 5)) : randInt(1, maxZweit);
  const restZehntel = nachAnteil - zweiteZehntel;
  const alsText = (zehntel) => {
    const ganz = Math.floor(zehntel / 10);
    const rest = zehntel % 10;
    return rest === 0 ? String(ganz) : `${ganz},${rest}`;
  };
  const kontext = pick([
    { was: "Meter Kabel", verb: "verlegt", zweit: "als Reserve zurückgelegt" },
    { was: "Liter Farbe", verb: "verstrichen", zweit: "für die Türen abgefüllt" },
    { was: "Kilogramm Mehl", verb: "verbacken", zweit: "an die Filiale abgegeben" },
  ]);
  return {
    promptHtml:
      `Ein Betrieb hat <strong>${alsText(gesamtZehntel)} ${kontext.was}</strong>. ` +
      `Davon werden ${bruchHtml(z1, n1)} ${kontext.verb} und weitere <strong>${alsText(zweiteZehntel)}</strong> ${kontext.zweit}. ` +
      `Wie viel bleibt übrig?`,
    correct: restZehntel / 10,
    tolerance: 0.001,
    hinweis: (roh, val) =>
      Math.abs(val - nachAnteil / 10) < 0.001
        ? "Die zweite Menge ist noch nicht abgezogen."
        : Math.abs(val - abZehntel / 10) < 0.001
          ? "Das ist der Anteil, der weggeht — gefragt ist, was übrig bleibt."
          : "",
    tipps: [
      "Zwei Mengen gehen weg: erst der Bruchteil, dann die zweite Angabe.",
      `Der Bruchteil: ${bruchHtml(z1, n1)} von ${alsText(gesamtZehntel)}.`,
      "Beides von der Gesamtmenge abziehen — am einfachsten alles als Dezimalzahl.",
    ],
    placeholder: "z. B. 12,5",
    musterloesungHtml:
      `① ${bruchHtml(z1, n1)} von ${alsText(gesamtZehntel)}: ${alsText(gesamtZehntel)} : ${n1} = ${alsText(gesamtZehntel / n1)}, davon ${z1} ⇒ <strong>${alsText(abZehntel)}</strong><br>` +
      `② beide Mengen abziehen (Komma unter Komma):<br>` +
      `&nbsp;&nbsp;${alsText(gesamtZehntel)} − ${alsText(abZehntel)} = ${alsText(gesamtZehntel - abZehntel)}<br>` +
      `&nbsp;&nbsp;${alsText(gesamtZehntel - abZehntel)} − ${alsText(zweiteZehntel)} = <strong>${alsText(restZehntel)}</strong><br>` +
      `<span class="progress-note">Überschlag zur Kontrolle: ${bruchHtml(z1, n1)} von rund ${Math.round(gesamtZehntel / 10)} sind rund ${Math.round(abZehntel / 10)} — zusammen mit ${Math.round(zweiteZehntel / 10)} bleibt ungefähr ${Math.round(restZehntel / 10)}.</span>`,
  };
}

// Aufgabe 2 — gleichnamige Brüche subtrahieren, das Gegenstück zu Aufgabe 1. Der Minuend ist
// konstruktiv größer als der Subtrahend: Negative Brüche kommen in diesem Thema noch nicht vor.
function generateAufgabe2b() {
  const n = pick([4, 5, 6, 8, 9, 10, 12]);
  const z1 = randInt(2, n - 1);
  const z2 = randInt(1, z1 - 1);
  const k = kuerze(z1 - z2, n);
  return {
    promptHtml: `Berechne und kürze vollständig: ${bruchHtml(z1, n)} − ${bruchHtml(z2, n)}`,
    placeholder: "z. B. 1/4",
    check: (raw) => {
      const b = parseBruchEingabe(raw);
      return !!b && b.z === k.z && b.n === k.n;
    },
    hinweis: (raw) => {
      const b = parseBruchEingabe(raw);
      if (!b) return "Schreibe deine Antwort als Bruch in der Form <code>z/n</code>, z.&nbsp;B. <code>1/4</code>.";
      if (b.z === z1 - z2 && b.n === n * 2) return "Beim Subtrahieren gleichnamiger Brüche wird <strong>nur der Zähler</strong> subtrahiert — der Nenner bleibt stehen.";
      if (b.z * k.n === k.z * b.n) return `Der <strong>Wert</strong> stimmt — aber ${bruchHtml(b.z, b.n)} ist noch nicht vollständig gekürzt: ggT(${b.z}; ${b.n}) = ${ggT(b.z, b.n)}.`;
      return "";
    },
    tipps: [
      "Beide Brüche haben denselben Nenner — sie zählen dieselben Stücke.",
      `Nur die Zähler subtrahieren: ${z1} − ${z2}. Der Nenner ${n} bleibt.`,
      "Zum Schluss prüfen, ob sich das Ergebnis noch kürzen lässt.",
    ],
    musterloesungHtml:
      `Gleicher Nenner ⇒ nur die Zähler subtrahieren:<br>` +
      `${bruchHtml(z1, n)} − ${bruchHtml(z2, n)} = ${bruchHtml(z1 + " − " + z2, n)} = ${bruchHtml(z1 - z2, n)}` +
      (k.g > 1 ? `<br>Kürzen mit ggT(${z1 - z2}; ${n}) = ${k.g}: ${bruchHtml(k.z, k.n, "gross")}` : `<br>${bruchHtml(k.z, k.n)} ist bereits vollständig gekürzt.`),
  };
}

// Aufgabe 4 — Dezimalzahlen schriftlich. Der Fehler, den die Aufgabe abfragt, ist das rechtsbündige
// Untereinanderschreiben: Wer nicht am Komma ausrichtet, addiert Zehntel zu Hundertsteln.
function generateAufgabe4b() {
  const plus = Math.random() < 0.5;
  // In Hundertsteln gerechnet, damit nichts in der Gleitkommarechnung verrutscht.
  const aH = randInt(150, 980) * 10 + randInt(0, 9) * 0;   // eine Nachkommastelle
  const bH = randInt(120, 890);                            // zwei Nachkommastellen
  const a = aH / 100, b = bH / 100;
  const ergH = plus ? aH + bH : Math.max(aH, bH) - Math.min(aH, bH);
  const links = plus ? a : Math.max(a, b), rechts = plus ? b : Math.min(a, b);
  const correct = ergH / 100;
  // Rechtsbündig statt am Komma ausgerichtet: Die Ziffern beider Zahlen werden ohne Komma
  // untereinandergeschrieben und das Komma des ersten Summanden übernommen.
  const ziffernA = Math.round(links * 10), ziffernB = Math.round(rechts * 100);
  const falschRechtsbuendig = (plus ? ziffernA + ziffernB : ziffernA - ziffernB) / 10;
  return {
    promptHtml: `Berechne schriftlich: <strong>${dez(links, 1)} ${plus ? "+" : "−"} ${dez(rechts, 2)}</strong>`,
    correct,
    tolerance: 0.001,
    placeholder: "Ergebnis",
    hinweis: (roh, val) =>
      Math.abs(val - falschRechtsbuendig) < 0.001
        ? "Die Zahlen gehören am <strong>Komma</strong> untereinander, nicht rechtsbündig — sonst treffen Zehntel auf Hundertstel."
        : "",
    tipps: [
      "Schreibe die Zahlen so untereinander, dass die <em>Kommas</em> genau übereinanderstehen.",
      "Fehlende Nachkommastellen mit Nullen auffüllen — 3,5 ist dasselbe wie 3,50.",
      "Dann stellenweise rechnen wie bei ganzen Zahlen; das Komma im Ergebnis steht an derselben Stelle.",
    ],
    musterloesungHtml:
      `Kommas untereinander, mit Nullen aufgefüllt:<br>` +
      `<span class="formula-block">${dez(links, 2)} ${plus ? "+" : "−"} ${dez(rechts, 2)} = <strong>${dez(correct, 2)}</strong></span>` +
      `Überschlag zur Kontrolle: rund ${Math.round(links)} ${plus ? "+" : "−"} ${Math.round(rechts)} = ${plus ? Math.round(links) + Math.round(rechts) : Math.round(links) - Math.round(rechts)}`,
  };
}

// Aufgabe 6 — den fehlenden Summanden bestimmen. Umkehraufgabe zu Aufgabe 3: Sie verlangt denselben
// Hauptnenner, aber die Gleichung muss erst umgestellt werden.
function generateAufgabe6() {
  let n1, n2;
  do {
    n1 = pick([2, 3, 4, 5, 6, 8, 10, 12]);
    n2 = pick([2, 3, 4, 5, 6, 8, 10, 12]);
  } while (n1 === n2);
  const hn = kgV(n1, n2);
  const s1 = hn / n1, s2 = hn / n2;
  // Erst den bekannten Summanden, dann den gesuchten so wählen, dass die Summe unter 1 bleibt.
  const z1 = randInt(1, Math.max(1, Math.min(n1 - 1, Math.floor((hn - s2) / s1))));
  const z2max = Math.min(n2 - 1, Math.floor((hn - 1 - z1 * s1) / s2));
  const z2 = randInt(1, Math.max(1, z2max));
  const summeZ = z1 * s1 + z2 * s2;
  const summe = kuerze(summeZ, hn);
  const gesucht = kuerze(z2 * s2, hn);
  return {
    promptHtml:
      `Welcher Bruch fehlt? ${bruchHtml(z1, n1)} + <strong>?</strong> = ${bruchHtml(summe.z, summe.n)}` +
      `<br><span class="progress-note">Antworte vollständig gekürzt.</span>`,
    placeholder: "z. B. 1/6",
    check: (raw) => {
      const b = parseBruchEingabe(raw);
      return !!b && b.z === gesucht.z && b.n === gesucht.n;
    },
    hinweis: (raw) => {
      const b = parseBruchEingabe(raw);
      if (!b) return "Schreibe deine Antwort als Bruch in der Form <code>z/n</code>, z.&nbsp;B. <code>1/6</code>.";
      if (b.z * summe.n === summe.z * b.n) return "Das ist die Summe selbst — gesucht ist der fehlende Summand.";
      if (b.z * gesucht.n === gesucht.z * b.n) return `Der <strong>Wert</strong> stimmt — aber ${bruchHtml(b.z, b.n)} ist noch nicht vollständig gekürzt.`;
      return "";
    },
    tipps: [
      "Stelle die Gleichung um: Der fehlende Summand ist Summe − bekannter Summand.",
      `Beide auf den Hauptnenner kgV(${summe.n}; ${n1}) bringen.`,
      "Dann nur noch die Zähler subtrahieren und am Ende kürzen.",
    ],
    musterloesungHtml:
      `Umstellen: ? = ${bruchHtml(summe.z, summe.n)} − ${bruchHtml(z1, n1)}<br>` +
      `① Hauptnenner ${hn}: ${bruchHtml(summe.z, summe.n)} = ${bruchHtml(summeZ, hn)} und ${bruchHtml(z1, n1)} = ${bruchHtml(z1 * s1, hn)}<br>` +
      `② Zähler subtrahieren: ${bruchHtml(summeZ - z1 * s1, hn)}<br>` +
      `③ kürzen ⇒ <strong>${bruchHtml(gesucht.z, gesucht.n, "gross")}</strong><br>` +
      `Probe: ${bruchHtml(z1, n1)} + ${bruchHtml(gesucht.z, gesucht.n)} = ${bruchHtml(summe.z, summe.n)} ✓`,
  };
}

// Aufgabe 8 — drei Mengen, zwei Schreibweisen, in drei Feldern. Der Kern des Abschnitts: Bruch und
// Dezimalzahl sind dieselbe Zahl in anderer Schreibweise, und addieren lässt sich beides erst,
// wenn man sich für eine entscheidet.
function generateAufgabe8() {
  // Alles in Zehnteln, damit jede Teilmenge glatt aufgeht. Viertel gehören deshalb NICHT in die
  // Liste: 1/4 sind 2,5 Zehntel, und daraus wurde in der Anzeige „0,7.5“.
  const [z1, n1] = pick([[1, 2], [1, 5], [2, 5], [3, 5], [3, 10], [7, 10]]);
  const [z2, n2] = pick([[1, 2], [1, 5], [3, 10], [2, 5]]);
  const teil1Zehntel = (10 / n1) * z1 * randInt(1, 3);
  const teil2Zehntel = (10 / n2) * z2 * randInt(1, 3);
  const dezZehntel = randInt(3, 25);
  const summeZehntel = teil1Zehntel + teil2Zehntel + dezZehntel;
  const alsText = (zehntel) => (zehntel % 10 === 0 ? String(zehntel / 10) : `${Math.floor(zehntel / 10)},${zehntel % 10}`);
  const ziel = Math.ceil(summeZehntel / 10) * 10 + (summeZehntel % 10 === 0 ? 10 : 0);
  const summeKuerzt = kuerze(summeZehntel, 10);
  const kontext = pick([
    { einheit: "Liter", teile: ["Saft", "Wasser", "Sirup"] },
    { einheit: "Kilogramm", teile: ["Mehl", "Zucker", "Butter"] },
    { einheit: "Meter", teile: ["rotes Band", "blaues Band", "Schnur"] },
  ]);
  return {
    promptHtml:
      `Für ein Rezept kommen <strong>${alsText(teil1Zehntel)} ${kontext.einheit} ${kontext.teile[0]}</strong>, ` +
      `<strong>${alsText(teil2Zehntel)} ${kontext.einheit} ${kontext.teile[1]}</strong> und ` +
      `<strong>${alsText(dezZehntel)} ${kontext.einheit} ${kontext.teile[2]}</strong> zusammen.`,
    felder: [
      {
        name: "die Gesamtmenge als Dezimalzahl", soll: summeZehntel / 10, toleranz: 0.001,
        hinweis: (roh, val) => (Math.abs(val - (teil1Zehntel + teil2Zehntel) / 10) < 0.001 ? "Die dritte Menge fehlt noch." : ""),
      },
      {
        name: `wie viel noch bis ${ziel / 10} ${kontext.einheit} fehlt`, soll: (ziel - summeZehntel) / 10, toleranz: 0.001,
        hinweis: (roh, val) => (Math.abs(val - summeZehntel / 10) < 0.001 ? "Das ist die Gesamtmenge. Gefragt ist, was noch fehlt." : ""),
      },
      {
        name: "die Gesamtmenge als vollständig gekürzter Bruch (z/n)", platzhalter: "z. B. 7/5",
        check: (raw) => {
          const b = parseBruchEingabe(raw);
          return !!b && b.z === summeKuerzt.z && b.n === summeKuerzt.n;
        },
        hinweis: (roh) => {
          const b = parseBruchEingabe(roh);
          if (!b) return "Schreibe diesen Wert als Bruch in der Form <code>z/n</code>.";
          if (b.z * summeKuerzt.n === summeKuerzt.z * b.n) return `Der Wert stimmt — aber ${bruchHtml(b.z, b.n)} ist noch nicht vollständig gekürzt.`;
          return "";
        },
      },
    ],
    tipps: [
      "Alle drei Mengen stehen schon als Dezimalzahlen da — so lassen sie sich direkt addieren.",
      "Für die letzte Zeile: Eine Dezimalzahl mit einer Nachkommastelle sind Zehntel, der Nenner ist also 10.",
      "Danach noch kürzen.",
    ],
    musterloesungHtml:
      `① Summe: ${alsText(teil1Zehntel)} + ${alsText(teil2Zehntel)} + ${alsText(dezZehntel)} = <strong>${alsText(summeZehntel)}</strong><br>` +
      `② Bis ${ziel / 10} fehlen: ${ziel / 10} − ${alsText(summeZehntel)} = <strong>${alsText(ziel - summeZehntel)}</strong><br>` +
      `③ Als Bruch: ${alsText(summeZehntel)} = ${bruchHtml(summeZehntel, 10)}` +
      (summeKuerzt.g > 1 ? ` = ${bruchHtml(summeKuerzt.z, summeKuerzt.n, "gross")} (gekürzt mit ${summeKuerzt.g})` : ` — bereits vollständig gekürzt`),
  };
}

function initExercises() {
  mountUebungsaufgaben(document.getElementById("exercises-mount"), [
    { schwierigkeit: "einfach", titel: "Aufgabe 1 — Gleichnamige Brüche addieren", generate: generateAufgabe1 },
    { schwierigkeit: "einfach", titel: "Aufgabe 2 — Gleichnamige Brüche subtrahieren", generate: generateAufgabe2b },
    { schwierigkeit: "mittel", titel: "Aufgabe 3 — Ungleichnamige Brüche addieren", generate: generateAufgabe2 },
    { schwierigkeit: "mittel", titel: "Aufgabe 4 — Dezimalzahlen schriftlich", generate: generateAufgabe4b },
    { schwierigkeit: "schwierig", titel: "Aufgabe 5 — Gemischte Zahlen subtrahieren", generate: generateAufgabe3 },
    { schwierigkeit: "schwierig", titel: "Aufgabe 6 — Fehlenden Summanden finden", generate: generateAufgabe6 },
    { schwierigkeit: "komplex", titel: "Aufgabe 7 — Sachaufgabe mit Bruch und Dezimalzahl", generate: generateAufgabe4 },
    { schwierigkeit: "komplex", titel: "Aufgabe 8 — Drei Mengen, zwei Schreibweisen", generate: generateAufgabe8 },
  ]);
}

// ================= Quizze =================

function initQuizzes() {
  mountQuiz(document.getElementById("quiz-gleichnamig"), {
    q: "Wie viel ist ein Viertel plus ein Viertel?",
    options: ["2/8, also wieder ein Viertel", "1/2", "2/4 und 2/8 sind beide richtig", "1/8"],
    correct: 1,
    explain: "Nur die Zähler werden addiert: 1/4 + 1/4 = 2/4 = 1/2. Der Nenner sagt, wie die Teile heißen — beim Zusammenlegen ändert er sich nicht.",
  });
  mountQuiz(document.getElementById("quiz-ungleichnamig"), {
    q: "Was ist der erste Schritt bei 1/2 + 1/3?",
    options: [
      "Zähler und Nenner jeweils addieren",
      "Beide Brüche auf den Hauptnenner 6 erweitern",
      "Beide Brüche kürzen",
      "Die Brüche in Dezimalzahlen umwandeln, anders geht es nicht",
    ],
    correct: 1,
    explain: "Erst gleichnamig machen: 1/2 = 3/6 und 1/3 = 2/6. Dann 3/6 + 2/6 = 5/6.",
  });
  mountQuiz(document.getElementById("quiz-gemischt"), {
    q: "Warum ist 3¼ − 1¾ nicht einfach „2 minus ein halbes“?",
    options: [
      "Weil man gemischte Zahlen gar nicht subtrahieren darf",
      "Weil ein Viertel kleiner als drei Viertel ist — man muss erst ein Ganzes zerlegen",
      "Weil die Nenner verschieden sind",
      "Der Ansatz ist völlig richtig",
    ],
    correct: 1,
    explain: "Der Bruchteil reicht nicht aus. Man zerlegt ein Ganzes: 3¼ = 2⁵⁄₄, dann 2⁵⁄₄ − 1¾ = 1½.",
  });
  mountQuiz(document.getElementById("quiz-dezimal"), {
    q: "Wie schreibt man 2,5 + 0,25 für die schriftliche Addition untereinander?",
    options: [
      "Rechtsbündig, wie bei natürlichen Zahlen",
      "Komma unter Komma, 2,5 wird zu 2,50 aufgefüllt",
      "Linksbündig",
      "Das ist egal, das Ergebnis wird gleich",
    ],
    correct: 1,
    explain: "Nur bei Komma unter Komma stehen gleiche Stellenwerte übereinander. Rechtsbündig stünde ein Zehntel über einem Hundertstel.",
  });
  mountQuiz(document.getElementById("quiz-kontrolle"), {
    q: "Womit prüft man das Ergebnis einer Subtraktion am schnellsten?",
    options: [
      "Man rechnet dieselbe Subtraktion noch einmal",
      "Man addiert das Ergebnis und den Subtrahenden — es muss der Minuend herauskommen",
      "Man kürzt das Ergebnis",
      "Eine Probe gibt es bei der Subtraktion nicht",
    ],
    correct: 1,
    explain: "Addition und Subtraktion sind Umkehroperationen. Kommt beim Zurückrechnen der Ausgangswert heraus, stimmt das Ergebnis.",
  });
}

// ================= Start =================

document.addEventListener("DOMContentLoaded", () => {
  initGleichnamig();
  initUngleichnamig();
  initGemischt();
  initDezimal();
  initKontrolle();
  initExercises();
  initQuizzes();
});
