// Selbstlernpfad "Gleichungen" (Grundwissen Klasse 5-10, Kapitel 4).
// Rein clientseitiges Vanilla-JS, ohne Build-Schritt oder externe Bibliotheken.
//
// Leitgedanke: Eine Gleichung ist eine Waage, und eine Äquivalenzumformung ist
// alles, was das Gleichgewicht erhält. Deshalb steht in Abschnitt 1 wirklich
// eine Waage, in Abschnitt 2 darf man die Umformungen selbst auswählen und
// zusieht, wie die Lösung dabei unverändert bleibt, und Abschnitt 3 macht aus
// dem freien Ausprobieren ein Verfahren. Abschnitt 4 zeigt die Lösungsmenge
// zusätzlich als Schnittpunkt zweier Geraden — das ist die Brücke zu den
// linearen Funktionen.
//
// Alle Koeffizienten werden als exakte Brüche geführt. Wer mit Gleitkommazahlen
// umformt, bekommt nach drei Schritten 0,30000000000000004 statt 0,3 zu sehen.
//
// Durchgehende Farbcodierung: linke Seite grün, rechte Seite blau,
// Variable x violett, Umformung orange, Lösung rot.

"use strict";

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
function num(x, digits = 4) {
  // Das Minuszeichen ist U+2212, nicht der Bindestrich: In einer Gleichung
  // stehen Rechenzeichen, keine Trennstriche.
  return x.toLocaleString("de-DE", { maximumFractionDigits: digits }).replace("-", "\u2212");
}
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function ggt(a, b) {
  return b ? ggt(b, a % b) : Math.abs(a);
}
function parseFlexibleNumber(raw) {
  if (raw == null) return NaN;
  const s = String(raw).trim().replace(/\s/g, "").replace(/−/g, "-").replace(/\./g, "").replace(",", ".");
  return parseFloat(s);
}
function neueFlaeche(w, h) {
  return svgEl("svg", { viewBox: `0 0 ${w} ${h}`, width: w, height: h, class: "geo-svg", preserveAspectRatio: "xMidYMid meet" });
}
function begrenzt(id, wertZahl, min, max) {
  const v = Math.min(max, Math.max(min, wertZahl));
  const e = document.getElementById(id);
  if (Number(e.value) !== v) e.value = String(v);
  return v;
}
function karte(klasse, name, inhalt) {
  return el("div", { class: "gl-karte " + klasse }, [
    el("span", { class: "name" }, name),
    el("span", { class: "wert" }, inhalt),
  ]);
}
function faktor(text) {
  return `<span class="nw">${text}</span>`;
}

// ---------- Exakte Brüche ----------
// Eine Gleichung wird in diesem Lernpfad Dutzende Male umgeformt. Mit
// Gleitkommazahlen entstünden dabei Anzeigen wie "0,30000000000000004";
// mit Zähler und Nenner bleibt jede Zwischenzeile exakt.

function br(z, n = 1) {
  if (n === 0) throw new Error("Bruch mit Nenner 0");
  const vz = n < 0 ? -1 : 1;
  const g = ggt(z, n) || 1;
  return { z: (vz * z) / g, n: (vz * n) / g };
}
function brPlus(a, b) { return br(a.z * b.n + b.z * a.n, a.n * b.n); }
function brMinus(a, b) { return br(a.z * b.n - b.z * a.n, a.n * b.n); }
function brMal(a, b) { return br(a.z * b.z, a.n * b.n); }
function brDurch(a, b) { return br(a.z * b.n, a.n * b.z); }
function brGleich(a, b) { return a.z * b.n === b.z * a.n; }
function brNull(a) { return a.z === 0; }
function brZahl(a) { return a.z / a.n; }
// Anzeige: ganze Zahlen schlicht, Brüche als "z : n" — die Schreibweise, die
// in diesem Lernpfad auch sonst für Divisionen verwendet wird.
function brText(a) {
  if (a.n === 1) return num(a.z);
  return `${faktor(`${num(a.z)} : ${num(a.n)}`)}`;
}
// Vorzeichenbehaftetes Anhängen: "+ 3" bzw. "− 3".
function brAnhang(a) {
  if (brNull(a)) return "";
  const neg = a.z < 0;
  const betrag = br(Math.abs(a.z), a.n);
  return ` ${neg ? "−" : "+"} ${brText(betrag)}`;
}

// ---------- Gleichungen als Datenstruktur ----------
// Eine lineare Gleichung ist durch vier Zahlen bestimmt: a·x + b = c·x + d.

function gleichung(a, b, c, d) {
  return { a: br(a), b: br(b), c: br(c), d: br(d) };
}
function seiteHtml(koef, konst, klasse) {
  const teile = [];
  if (!brNull(koef)) {
    if (brGleich(koef, br(1))) teile.push(`<span class="xv">x</span>`);
    else if (brGleich(koef, br(-1))) teile.push(`−<span class="xv">x</span>`);
    else teile.push(`${brText(koef)}<span class="xv">x</span>`);
  }
  if (!brNull(konst) || teile.length === 0) {
    if (teile.length === 0) teile.push(brText(konst));
    else teile.push(brAnhang(konst).trim());
  }
  return `<span class="${klasse}">${teile.join(" ")}</span>`;
}
function gleichungHtml(g) {
  return seiteHtml(g.a, g.b, "ls") + " = " + seiteHtml(g.c, g.d, "rs");
}
// Lösungsart: "eine", "keine" oder "alle".
function loesungsart(g) {
  if (!brGleich(g.a, g.c)) return "eine";
  return brGleich(g.b, g.d) ? "alle" : "keine";
}
function loesung(g) {
  return brDurch(brMinus(g.d, g.b), brMinus(g.a, g.c));
}
// Wert der linken bzw. rechten Seite an einer Stelle — die Grundlage der Probe.
function seitenwert(koef, konst, x) {
  return brZahl(koef) * x + brZahl(konst);
}

// ---------- Protokollzeilen ----------

function protokollZeile(inhaltHtml, opHtml, klasse = "", kommentar = "") {
  return `<div class="zeile ${klasse}">` +
    `<span class="gl">${inhaltHtml}</span>` +
    (opHtml ? `<span class="op">| ${opHtml}</span>` : "") +
    (kommentar ? `<span class="kommentar">${kommentar}</span>` : "") +
    `</div>`;
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

// ================= 1. Gleichung, Lösung und Probe =================

// Die Waage zeigt links a Kästchen "x" und b Einergewichte, rechts c
// Einergewichte. Der Balken neigt sich nach der Seite mit dem größeren Wert —
// so wird "Lösung" zu etwas Sichtbarem statt zu einer Vokabel.
function waageBild(a, b, c, x) {
  const B = 480, H = 288;
  const svg = neueFlaeche(B, H);
  const links = a * x + b, rechts = c;
  const diff = links - rechts;
  const neigung = Math.max(-1, Math.min(1, diff / 12)) * 15;   // in Pixeln

  const mx = B / 2, my = 96;
  const arm = 152, schaleHalb = 66, seil = 58;
  const lx = mx - arm, rx = mx + arm;
  const ly = my + neigung, ry = my - neigung;

  svg.appendChild(svgEl("path", { d: `M ${mx - 24} 232 L ${mx + 24} 232 L ${mx + 7} ${my + 6} L ${mx - 7} ${my + 6} Z`, class: "gl-staender" }));
  svg.appendChild(svgEl("line", { x1: lx, y1: ly.toFixed(2), x2: rx, y2: ry.toFixed(2), class: "gl-balken" }));

  [[lx, ly], [rx, ry]].forEach(([sx, sy]) => {
    svg.appendChild(svgEl("line", { x1: sx, y1: sy.toFixed(2), x2: sx, y2: (sy + seil).toFixed(2), class: "gl-seil" }));
    svg.appendChild(svgEl("path", { d: `M ${sx - schaleHalb} ${(sy + seil).toFixed(2)} L ${sx + schaleHalb} ${(sy + seil).toFixed(2)}`, class: "gl-schale" }));
  });

  // Die Gewichte werden erst in Reihen verteilt, die auf die Schale passen,
  // und dann reihenweise mittig darüber gezeichnet. Wer stattdessen einfach
  // von links nach rechts setzt, schiebt die Kästchen über den Schalenrand.
  function stapel(sx, sy, kaesten, einer) {
    const bX = 26, bE = 13, hoehe = 15, luecke = 3, maxBreite = 2 * schaleHalb - 4;
    const stuecke = [];
    for (let i = 0; i < kaesten; i++) stuecke.push({ breite: bX, klasse: "gl-kasten-x", text: "x" });
    for (let i = 0; i < einer; i++) stuecke.push({ breite: bE, klasse: "gl-kasten-eins", text: "" });
    const reihen = [[]];
    let breiteJetzt = 0;
    for (const st of stuecke) {
      const zusatz = (reihen[reihen.length - 1].length ? luecke : 0) + st.breite;
      if (breiteJetzt + zusatz > maxBreite && reihen[reihen.length - 1].length) {
        reihen.push([]);
        breiteJetzt = st.breite;
      } else {
        breiteJetzt += zusatz;
      }
      reihen[reihen.length - 1].push(st);
    }
    reihen.forEach((reihe, r) => {
      const breite = reihe.reduce((sum, st) => sum + st.breite, 0) + luecke * (reihe.length - 1);
      let px = sx - breite / 2;
      const py = sy + seil - (r + 1) * (hoehe + 2) - 1;
      for (const st of reihe) {
        svg.appendChild(svgEl("rect", { x: px.toFixed(2), y: py.toFixed(2), width: st.breite, height: hoehe, rx: 3, class: st.klasse }));
        if (st.text) svg.appendChild(svgText(px + st.breite / 2, py + 11.5, st.text, { class: "gl-kastentext x" }));
        px += st.breite + luecke;
      }
    });
  }
  stapel(lx, ly, a, b);
  stapel(rx, ry, 0, c);

  svg.appendChild(svgText(lx, 258, `links: ${num(links)}`, { class: "gl-waagetext links" }));
  svg.appendChild(svgText(rx, 258, `rechts: ${num(rechts)}`, { class: "gl-waagetext rechts" }));
  svg.appendChild(svgText(mx, 20, diff === 0 ? "im Gleichgewicht" : diff > 0 ? "links ist schwerer" : "rechts ist schwerer", {
    class: "gl-waagetext " + (diff === 0 ? "gleich" : "ungleich"),
  }));
  svg.appendChild(svgText(mx, H - 5, "Ein violettes Kästchen wiegt x, ein graues wiegt 1.", { class: "gl-achsentext" }));
  return svg;
}

function renderWaage() {
  const a = begrenzt("wa-a", Number(document.getElementById("wa-a").value), 1, 4);
  const b = begrenzt("wa-b", Number(document.getElementById("wa-b").value), 0, 8);
  const c = begrenzt("wa-c", Number(document.getElementById("wa-c").value), 2, 20);
  const x = begrenzt("wa-x", Number(document.getElementById("wa-x").value), 0, 10);

  document.getElementById("wa-a-anzeige").textContent = num(a) + " Kästchen";
  document.getElementById("wa-b-anzeige").textContent = num(b);
  document.getElementById("wa-c-anzeige").textContent = num(c);
  document.getElementById("wa-x-anzeige").textContent = "x = " + num(x);

  const g = gleichung(a, b, 0, c);
  document.getElementById("wa-gleichung").innerHTML = gleichungHtml(g);

  const mount = document.getElementById("wa-mount");
  mount.innerHTML = "";
  mount.appendChild(waageBild(a, b, c, x));

  const links = a * x + b, rechts = c;
  const xLoesung = loesung(g);
  const passt = links === rechts;

  const karten = document.getElementById("wa-karten");
  karten.innerHTML = "";
  karten.appendChild(karte("l", "linke Seite", num(links)));
  karten.appendChild(karte("r", "rechte Seite", num(rechts)));
  karten.appendChild(karte("x", "eingesetzt", "x = " + num(x)));
  karten.appendChild(karte("loesung", "Lösungsmenge",
    "L = {" + (xLoesung.n === 1 ? num(xLoesung.z) : num(brZahl(xLoesung), 4)) + "}"));

  document.getElementById("wa-bilanz").innerHTML =
    `<strong>Probe mit x = ${num(x)}:</strong><br>` +
    `linke Seite: ${faktor(`${num(a)} · ${num(x)}`)}${b ? " + " + num(b) : ""} = <span class="wl">${num(links)}</span><br>` +
    `rechte Seite: <span class="wr">${num(rechts)}</span><br>` +
    (passt
      ? `Beide Seiten sind gleich — <strong>x = ${num(x)} ist eine Lösung</strong>. ✓`
      : `${num(links)} ≠ ${num(rechts)} — <strong>x = ${num(x)} ist keine Lösung</strong>. ` +
        `Die Waage neigt sich nach ${links > rechts ? "links" : "rechts"}.`) +
    `<br><span class="wg">Exakte Lösung:</span> x = ` +
    (xLoesung.n === 1 ? num(xLoesung.z) : `${faktor(`${num(xLoesung.z)} : ${num(xLoesung.n)}`)} = ${num(brZahl(xLoesung), 4)}`);

  document.getElementById("wa-text").textContent = passt
    ? "Der Balken steht waagerecht. Genau das bedeutet das Gleichheitszeichen."
    : xLoesung.n === 1 && xLoesung.z >= 0 && xLoesung.z <= 10
      ? `Schiebe den Probierregler auf ${num(xLoesung.z)} — dann steht die Waage still.`
      : `Diese Gleichung hat keine ganzzahlige Lösung zwischen 0 und 10. Mit Probieren kommt man hier nicht ans Ziel.`;
}

function initWaage() {
  ["wa-a", "wa-b", "wa-c", "wa-x"].forEach((id) => document.getElementById(id).addEventListener("input", renderWaage));
  renderWaage();
}

// ================= 2. Äquivalenzumformungen =================

const UF_START = [
  gleichung(3, 5, 0, 20),
  gleichung(5, -4, 2, 11),
  gleichung(2, 9, 0, 1),
];
let ufSchritte = [];      // [{ g, opHtml }]

// Angeboten werden nur Umformungen, die auf die aktuelle Gleichung passen:
// das Wegschaffen der Konstanten, das Wegschaffen eines x-Terms und das
// Teilen durch den Koeffizienten. Dazu zwei "unnütze" Umformungen, damit
// sichtbar wird, dass auch sie die Lösung nicht verändern.
function ufAngebote(g) {
  const out = [];
  const rein = (t) => t.replace(/<[^>]+>/g, "");
  if (!brNull(g.b)) {
    const gegen = br(-g.b.z, g.b.n);
    out.push({
      text: (g.b.z > 0 ? "− " : "+ ") + rein(brText(br(Math.abs(g.b.z), g.b.n))),
      anwenden: (h) => ({ a: h.a, b: brPlus(h.b, gegen), c: h.c, d: brPlus(h.d, gegen) }),
    });
  }
  if (!brNull(g.d)) {
    const gegen = br(-g.d.z, g.d.n);
    out.push({
      text: (g.d.z > 0 ? "− " : "+ ") + rein(brText(br(Math.abs(g.d.z), g.d.n))),
      anwenden: (h) => ({ a: h.a, b: brPlus(h.b, gegen), c: h.c, d: brPlus(h.d, gegen) }),
    });
  }
  if (!brNull(g.c)) {
    const gegen = br(-g.c.z, g.c.n);
    out.push({
      text: (g.c.z > 0 ? "− " : "+ ") + rein(brText(br(Math.abs(g.c.z), g.c.n))) + "x",
      anwenden: (h) => ({ a: brPlus(h.a, gegen), b: h.b, c: brPlus(h.c, gegen), d: h.d }),
    });
  }
  if (!brNull(g.a) && !brGleich(g.a, br(1))) {
    out.push({
      text: ": " + rein(brText(g.a)),
      anwenden: (h) => ({ a: brDurch(h.a, g.a), b: brDurch(h.b, g.a), c: brDurch(h.c, g.a), d: brDurch(h.d, g.a) }),
    });
  }
  out.push({
    text: "· 2",
    anwenden: (h) => ({ a: brMal(h.a, br(2)), b: brMal(h.b, br(2)), c: brMal(h.c, br(2)), d: brMal(h.d, br(2)) }),
  });
  out.push({
    text: "+ 10",
    anwenden: (h) => ({ a: h.a, b: brPlus(h.b, br(10)), c: h.c, d: brPlus(h.d, br(10)) }),
  });
  return out;
}

function renderUmformen() {
  const start = UF_START[Number(document.getElementById("uf-start").value)];
  if (!ufSchritte.length) ufSchritte = [{ g: start, opHtml: "" }];
  const aktuell = ufSchritte[ufSchritte.length - 1].g;
  const fertig = brGleich(aktuell.a, br(1)) && brNull(aktuell.b) && brNull(aktuell.c);

  const ops = document.getElementById("uf-ops");
  ops.innerHTML = "";
  ops.appendChild(el("span", { class: "beschriftung" }, fertig ? "x steht allein — geschafft:" : "Auf beiden Seiten anwenden:"));
  ufAngebote(aktuell).forEach((ang) => {
    const btn = el("button", { type: "button" }, ang.text);
    btn.addEventListener("click", () => {
      const neu = ang.anwenden(ufSchritte[ufSchritte.length - 1].g);
      ufSchritte.push({ g: neu, opHtml: ang.text });
      renderUmformen();
    });
    ops.appendChild(btn);
  });

  const prot = document.getElementById("uf-protokoll");
  prot.innerHTML = ufSchritte.map((s, i) => {
    const letzte = i === ufSchritte.length - 1;
    const dieseFertig = letzte && fertig;
    return protokollZeile(
      gleichungHtml(s.g),
      s.opHtml,
      dieseFertig ? "fertig" : letzte && i > 0 ? "neu" : "",
      i === 0 ? "Startgleichung" : ""
    );
  }).join("");

  // Der Kern der Sache: Die Lösung bleibt über alle Zeilen hinweg dieselbe.
  const arten = ufSchritte.map((s) => loesungsart(s.g));
  const loesungen = ufSchritte.map((s) => (loesungsart(s.g) === "eine" ? brZahl(loesung(s.g)) : NaN));
  const alleGleich = loesungen.every((v) => (isNaN(v) && isNaN(loesungen[0])) || v === loesungen[0]);
  const x0 = loesung(ufSchritte[0].g);

  document.getElementById("uf-bilanz").innerHTML =
    `<strong>Lösung der Startgleichung:</strong> x = <span class="wg">` +
    (x0.n === 1 ? num(x0.z) : `${faktor(`${num(x0.z)} : ${num(x0.n)}`)} = ${num(brZahl(x0), 4)}`) + `</span><br>` +
    `<strong>Lösung der aktuellen Zeile:</strong> x = <span class="wg">` +
    (loesungsart(aktuell) !== "eine" ? "—"
      : loesung(aktuell).n === 1 ? num(loesung(aktuell).z)
        : `${faktor(`${num(loesung(aktuell).z)} : ${num(loesung(aktuell).n)}`)} = ${num(brZahl(loesung(aktuell)), 4)}`) + `</span><br>` +
    (alleGleich && arten.every((a) => a === arten[0])
      ? (ufSchritte.length === 1
        ? `<span class="wo">Noch keine Umformung.</span> Wähle eine — die Lösungsmenge muss dabei unverändert bleiben.`
        : `<span class="wo">Unverändert</span> — alle ${num(ufSchritte.length)} Zeilen haben dieselbe Lösungsmenge. Genau das heißt „äquivalent“.`)
      : `Hier hat sich die Lösungsmenge geändert — das darf bei den vier erlaubten Umformungen nicht passieren.`);

  document.getElementById("uf-text").textContent = fertig
    ? "x steht allein auf der linken Seite: Die rechte Seite ist die Lösung. Probiere weitere Umformungen — die Lösung bleibt, nur die Schreibweise ändert sich."
    : ufSchritte.length === 1
      ? "Wähle eine Umformung. Sie wird auf beide Seiten angewendet und rechts neben der Gleichung notiert."
      : "Weiter so — das Ziel ist x allein auf einer Seite. Umwege sind erlaubt: Auch „· 2“ und „+ 10“ ändern die Lösung nicht.";
}

function initUmformen() {
  document.getElementById("uf-start").addEventListener("change", () => {
    ufSchritte = [];
    renderUmformen();
  });
  document.getElementById("uf-zurueck").addEventListener("click", () => {
    ufSchritte = [];
    renderUmformen();
  });
  renderUmformen();
}

// ================= 3. Lineare Gleichungen lösen =================

function renderLoesen() {
  let a = begrenzt("ls-a", Number(document.getElementById("ls-a").value), 2, 9);
  let c = begrenzt("ls-c", Number(document.getElementById("ls-c").value), 0, 8);
  const b = begrenzt("ls-b", Number(document.getElementById("ls-b").value), -9, 9);
  const x = begrenzt("ls-x", Number(document.getElementById("ls-x").value), -6, 8);
  // a = c hätte keine eindeutige Lösung; der Regler wird darum weitergeschoben.
  if (a === c) c = begrenzt("ls-c", c === 8 ? 7 : c + 1, 0, 8);
  const d = a * x + b - c * x;

  document.getElementById("ls-a-anzeige").textContent = num(a);
  document.getElementById("ls-c-anzeige").textContent = num(c);
  document.getElementById("ls-b-anzeige").textContent = num(b);
  document.getElementById("ls-x-anzeige").textContent = "x = " + num(x);

  const g = gleichung(a, b, c, d);
  document.getElementById("ls-gleichung").innerHTML = gleichungHtml(g);

  // Das Verfahren wird Zeile für Zeile mitgeschrieben — genau so, wie es im
  // Heft stehen soll.
  const zeilen = [protokollZeile(gleichungHtml(g), "", "", "Startgleichung")];
  let h = g;
  if (c !== 0) {
    h = { a: br(a - c), b: br(b), c: br(0), d: br(d) };
    zeilen.push(protokollZeile(gleichungHtml(h), `− ${num(c)}x`, "", "1. Schritt: alle x-Terme nach links"));
  }
  if (b !== 0) {
    const vorher = h;
    h = { a: vorher.a, b: br(0), c: br(0), d: br(brZahl(vorher.d) - b) };
    zeilen.push(protokollZeile(gleichungHtml(h), `${b > 0 ? "−" : "+"} ${num(Math.abs(b))}`, "", "2. Schritt: alle Zahlen nach rechts"));
  }
  const k = a - c;
  if (k !== 1) {
    h = { a: br(1), b: br(0), c: br(0), d: br(x) };
    zeilen.push(protokollZeile(gleichungHtml(h), `: ${num(k)}`, "fertig", "3. Schritt: durch den Koeffizienten teilen"));
  } else {
    zeilen[zeilen.length - 1] = zeilen[zeilen.length - 1].replace('class="zeile "', 'class="zeile fertig"');
  }
  document.getElementById("ls-protokoll").innerHTML = zeilen.join("");

  const linksProbe = a * x + b, rechtsProbe = c * x + d;
  document.getElementById("ls-bilanz").innerHTML =
    `<strong>Lösung:</strong> x = <span class="wg">${num(x)}</span>, also L = {${num(x)}}.<br>` +
    `<strong>Probe:</strong> linke Seite ${faktor(`${num(a)} · ${num(x)}`)}${b >= 0 ? " + " + num(b) : " − " + num(-b)} = ` +
    `<span class="wl">${num(linksProbe)}</span>, ` +
    `rechte Seite ${c === 0 ? "" : faktor(`${num(c)} · ${num(x)}`) + (d >= 0 ? " + " + num(d) : " − " + num(-d))}` +
    `${c === 0 ? num(d) : ""} = <span class="wr">${num(rechtsProbe)}</span> ✓<br>` +
    `<strong>Zwischenergebnis nach Schritt 2:</strong> ${faktor(`${num(k)}x = ${num(k * x)}`)} — ` +
    `der Koeffizient ist ${faktor(`${num(a)} − ${num(c)} = ${num(k)}`)}, ` +
    `die rechte Seite ${faktor(`${num(d)} ${b >= 0 ? "−" : "+"} ${num(Math.abs(b))} = ${num(d - b)}`)}.`;

  document.getElementById("ls-text").textContent =
    c === 0
      ? "Ohne x auf der rechten Seite entfällt der erste Schritt — es bleiben zwei."
      : k === 1
        ? "Hier ist der Koeffizient nach dem Sortieren gerade 1: Der dritte Schritt entfällt, x steht schon allein."
        : `Nach dem Sortieren steht ${num(k)}x = ${num(k * x)}. Erst dieses Teilen liefert die Lösung.`;
}

function initLoesen() {
  ["ls-a", "ls-c", "ls-b", "ls-x"].forEach((id) => document.getElementById(id).addEventListener("input", renderLoesen));
  renderLoesen();
}

// ================= 4. Sonderfälle =================

// Links und rechts vom Gleichheitszeichen steht je ein Term; als Gerade
// gezeichnet, wird die Lösung zum Schnittpunkt. Damit ist die Brücke zu den
// linearen Funktionen geschlagen, bevor es sie im Lehrgang überhaupt gibt.
function sfBild(a, b, c, d, fall) {
  const B = 470, H = 300;
  const svg = neueFlaeche(B, H);
  const links = 44, unten = 250, breite = 380, hoehe = 210;
  const xMin = -6, xMax = 6, yMin = -12, yMax = 12;
  const px = (x) => links + ((x - xMin) / (xMax - xMin)) * breite;
  const py = (y) => unten - ((y - yMin) / (yMax - yMin)) * hoehe;

  for (let x = xMin; x <= xMax; x += 2) {
    svg.appendChild(svgEl("line", { x1: px(x).toFixed(2), y1: py(yMax).toFixed(2), x2: px(x).toFixed(2), y2: py(yMin).toFixed(2), class: "gl-gitter" }));
    if (x !== 0) svg.appendChild(svgText(px(x), py(0) + 14, num(x), { class: "gl-achsentext" }));
  }
  for (let y = yMin; y <= yMax; y += 4) {
    svg.appendChild(svgEl("line", { x1: px(xMin).toFixed(2), y1: py(y).toFixed(2), x2: px(xMax).toFixed(2), y2: py(y).toFixed(2), class: "gl-gitter" }));
    if (y !== 0) svg.appendChild(svgText(px(0) - 7, py(y) + 4, num(y), { class: "gl-achsentext", "text-anchor": "end" }));
  }
  svg.appendChild(svgEl("line", { x1: px(xMin).toFixed(2), y1: py(0).toFixed(2), x2: (px(xMax) + 12).toFixed(2), y2: py(0).toFixed(2), class: "gl-achse" }));
  svg.appendChild(svgEl("line", { x1: px(0).toFixed(2), y1: py(yMin).toFixed(2), x2: px(0).toFixed(2), y2: (py(yMax) - 12).toFixed(2), class: "gl-achse" }));
  svg.appendChild(svgText(px(0) - 7, py(0) + 14, "0", { class: "gl-achsentext", "text-anchor": "end" }));
  svg.appendChild(svgText(px(xMax) + 12, py(0) + 20, "x", { class: "gl-achsenname", "text-anchor": "end" }));
  svg.appendChild(svgText(0, 0, "Wert der Seite", {
    class: "gl-achsenname", transform: `translate(16 ${((py(yMin) + py(yMax)) / 2).toFixed(2)}) rotate(-90)`,
  }));

  // Die Geraden werden am Fenster abgeschnitten, damit nichts über den Rand läuft.
  function gerade(m, n, klasse) {
    const punkte = [];
    for (const x of [xMin, xMax]) {
      let y = m * x + n;
      let xx = x;
      if (y > yMax) { y = yMax; xx = m === 0 ? x : (yMax - n) / m; }
      if (y < yMin) { y = yMin; xx = m === 0 ? x : (yMin - n) / m; }
      punkte.push([Math.max(xMin, Math.min(xMax, xx)), y]);
    }
    svg.appendChild(svgEl("line", {
      x1: px(punkte[0][0]).toFixed(2), y1: py(punkte[0][1]).toFixed(2),
      x2: px(punkte[1][0]).toFixed(2), y2: py(punkte[1][1]).toFixed(2),
      class: klasse,
    }));
  }
  gerade(a, b, "gl-gerade links");
  gerade(c, d, "gl-gerade rechts" + (fall === "alle" ? " deckend" : ""));

  if (fall === "eine") {
    const x0 = (d - b) / (a - c);
    const y0 = a * x0 + b;
    if (x0 >= xMin && x0 <= xMax && y0 >= yMin && y0 <= yMax) {
      svg.appendChild(svgEl("line", { x1: px(x0).toFixed(2), y1: py(y0).toFixed(2), x2: px(x0).toFixed(2), y2: py(0).toFixed(2), class: "gl-lot" }));
      svg.appendChild(svgEl("circle", { cx: px(x0).toFixed(2), cy: py(y0).toFixed(2), r: 5, class: "gl-schnitt" }));
      const rechtsRum = x0 <= 3;
      svg.appendChild(svgText(px(x0) + (rechtsRum ? 10 : -10), py(y0) - 8, `Schnittpunkt bei x = ${num(x0, 2)}`, {
        class: "gl-schnitttext", "text-anchor": rechtsRum ? "start" : "end",
      }));
    }
  }
  svg.appendChild(svgText(B / 2, 18, {
    eine: "Zwei Geraden, die sich schneiden — genau eine Lösung",
    keine: "Parallele Geraden — kein Schnittpunkt, keine Lösung",
    alle: "Zwei Mal dieselbe Gerade — jede Zahl ist Lösung",
  }[fall], { class: "gl-achsenname" }));
  svg.appendChild(svgText(B / 2, H - 4, "grün: linke Seite · blau: rechte Seite", { class: "gl-achsentext" }));
  return svg;
}

function renderSonderfaelle() {
  const fall = document.getElementById("sf-fall").value;
  const a = begrenzt("sf-a", Number(document.getElementById("sf-a").value), -3, 4);
  const roh = begrenzt("sf-d", Number(document.getElementById("sf-d").value), -6, 6);
  // Der Fall bestimmt, wie die rechte Seite aus der linken hervorgeht.
  const b = 2;
  const c = fall === "eine" ? (a === 0 ? 2 : 0) : a;
  // Im Fall "genau eine Lösung" rastet die Zahl rechts so ein, dass die
  // Lösung ganzzahlig bleibt — hier geht es um die Anzahl der Lösungen,
  // nicht um Bruchrechnen. Der eingerastete Wert wird an den Regler
  // zurückgeschrieben, damit Anzeige und Rechnung übereinstimmen.
  let d = roh;
  if (fall === "eine") {
    const k = a - c;
    const moeglich = [];
    for (let v = -6; v <= 6; v++) if ((v - b) % k === 0) moeglich.push(v);
    d = begrenzt("sf-d", moeglich.reduce((best, v) =>
      (Math.abs(v - roh) < Math.abs(best - roh) ? v : best), moeglich[0]), -6, 6);
  }
  const rechtsKonst = fall === "alle" ? b : d;

  document.getElementById("sf-a-anzeige").textContent = num(a);
  document.getElementById("sf-d-anzeige").textContent = fall === "alle" ? num(b) + " (erzwungen)" : num(d);
  document.getElementById("sf-d").disabled = fall === "alle";

  const g = gleichung(a, b, c, rechtsKonst);
  document.getElementById("sf-gleichung").innerHTML = gleichungHtml(g);

  const mount = document.getElementById("sf-mount");
  mount.innerHTML = "";
  mount.appendChild(sfBild(a, b, c, rechtsKonst, fall));

  const art = loesungsart(g);
  const zeilen = [protokollZeile(gleichungHtml(g), "", "", "Startgleichung")];
  if (c !== 0) {
    zeilen.push(protokollZeile(gleichungHtml(gleichung(a - c, b, 0, rechtsKonst)), `− ${num(c)}x`, "", "alle x-Terme nach links"));
  }
  const kFinal = a - c, mFinal = rechtsKonst - b;
  if (art === "eine") {
    zeilen.push(protokollZeile(
      `<span class="ls">${kFinal === 1 ? "" : num(kFinal)}<span class="xv">x</span></span> = <span class="rs">${num(mFinal)}</span>`,
      `${b > 0 ? "−" : "+"} ${num(Math.abs(b))}`, "", "alle Zahlen nach rechts"));
    if (kFinal !== 1) {
      zeilen.push(protokollZeile(
        `<span class="xv">x</span> = <span class="rs">${num(mFinal / kFinal, 4)}</span>`,
        `: ${num(kFinal)}`, "fertig", "durch den Koeffizienten teilen"));
    }
  } else {
    zeilen.push(protokollZeile(
      `<span class="ls">${num(b)}</span> = <span class="rs">${num(rechtsKonst)}</span>`,
      "", art === "keine" ? "neu" : "fertig",
      art === "keine" ? "Das x ist verschwunden — und übrig bleibt etwas Falsches."
        : "Das x ist verschwunden — und übrig bleibt etwas Wahres."));
  }
  document.getElementById("sf-protokoll").innerHTML = zeilen.join("");

  const urteil = {
    eine: `<span class="gl-urteil eine">genau eine Lösung</span>`,
    keine: `<span class="gl-urteil keine">keine Lösung</span>`,
    alle: `<span class="gl-urteil alle">jede Zahl ist Lösung</span>`,
  }[art];
  document.getElementById("sf-bilanz").innerHTML =
    `${urteil} &nbsp; ` +
    (art === "eine" ? `L = {${num(mFinal / kFinal, 4)}}`
      : art === "keine" ? "L = { }" : "L = ℚ") + `<br>` +
    (art === "eine"
      ? `Die Steigungen sind verschieden (<span class="wl">${num(a)}</span> gegen <span class="wr">${num(c)}</span>), ` +
        `deshalb schneiden sich die Geraden — und zwar genau einmal.`
      : art === "keine"
        ? `Beide Seiten haben dieselbe Steigung <span class="wo">${num(a)}</span>, aber verschiedene Werte bei x = 0 ` +
          `(<span class="wl">${num(b)}</span> gegen <span class="wr">${num(rechtsKonst)}</span>). ` +
          `Die Geraden sind parallel: Der Abstand von ${num(Math.abs(rechtsKonst - b))} bleibt überall gleich, sie treffen sich nie.`
        : `Beide Seiten sind derselbe Term. Die Gleichung ist für jede Zahl wahr — man nennt sie dann eine <strong>allgemeingültige Gleichung</strong>.`);

  document.getElementById("sf-text").textContent = {
    eine: "Verschiedene Steigungen bedeuten: Die Geraden laufen aufeinander zu und treffen sich genau einmal.",
    keine: "Gleiche Steigung, verschiedene Höhe. Beim Sortieren fällt das x heraus und es bleibt eine falsche Aussage stehen.",
    alle: "Gleiche Steigung und gleiche Höhe — es ist zweimal dieselbe Gerade. Beim Sortieren bleibt 0 = 0 übrig.",
  }[fall];
}

function initSonderfaelle() {
  document.getElementById("sf-fall").addEventListener("change", renderSonderfaelle);
  ["sf-a", "sf-d"].forEach((id) => document.getElementById(id).addEventListener("input", renderSonderfaelle));
  renderSonderfaelle();
}

// ================= 5. Gleichungen aufstellen =================

// Jede Aufgabe liefert vier Zahlensätze, damit die Struktur wiedererkennbar
// bleibt, während sich die Zahlen ändern. Die Übersetzungstabelle stellt den
// deutschen Satz und den Term nebeneinander — das ist der eigentliche Lernkern.
const AU_AUFGABEN = {
  zahl: {
    name: "Zahlenrätsel",
    saetze: [
      { f: 3, s: 5, e: 20 }, { f: 4, s: -7, e: 25 }, { f: 5, s: 12, e: 47 }, { f: 2, s: 9, e: 31 },
    ],
    text: (p) => `Ich denke mir eine Zahl, ${p.f === 2 ? "verdopple" : p.f === 3 ? "verdreifache" : "multipliziere sie mit " + num(p.f)} sie und ` +
      `${p.s >= 0 ? "addiere " + num(p.s) : "subtrahiere " + num(-p.s)}. Ich erhalte ${num(p.e)}. Wie heißt die Zahl?`,
    zeilen: (p) => [
      ["die gesuchte Zahl", "x"],
      [p.f === 2 ? "verdoppelt" : p.f === 3 ? "verdreifacht" : `mit ${num(p.f)} multipliziert`, `${num(p.f)}x`],
      [p.s >= 0 ? `und ${num(p.s)} dazu` : `und ${num(-p.s)} weniger`, `${num(p.f)}x ${p.s >= 0 ? "+" : "−"} ${num(Math.abs(p.s))}`],
      ["„ich erhalte“ heißt: ist gleich", `= ${num(p.e)}`],
    ],
    g: (p) => gleichung(p.f, p.s, 0, p.e),
    antwort: (p, x) => `Die gesuchte Zahl ist <strong>${num(x)}</strong>.`,
    probe: (p, x) => `${faktor(`${num(p.f)} · ${num(x)}`)} ${p.s >= 0 ? "+" : "−"} ${num(Math.abs(p.s))} = ${num(p.e)} ✓`,
  },
  alter: {
    name: "Altersaufgabe",
    saetze: [
      { m: 3, j: 8, k: 12 }, { m: 4, j: 6, k: 15 }, { m: 2, j: 21, k: 27 }, { m: 5, j: 4, k: 16 },
    ],
    text: (p) => `Jonas ist heute ${num(p.k)} Jahre alt. In wie vielen Jahren ist sein Vater, der heute ${num(p.m * p.k - p.j * (p.m - 1))} ` +
      `Jahre alt ist, genau ${num(p.m)}-mal so alt wie Jonas dann?`,
    zeilen: (p) => [
      ["die gesuchte Anzahl der Jahre", "x"],
      [`Jonas ist dann ${num(p.k)} + x Jahre alt`, `${num(p.k)} + x`],
      [`der Vater ist dann ${num(p.m * p.k - p.j * (p.m - 1))} + x Jahre alt`, `${num(p.m * p.k - p.j * (p.m - 1))} + x`],
      [`„${num(p.m)}-mal so alt“ heißt: Vater = ${num(p.m)} · Jonas`, `${num(p.m * p.k - p.j * (p.m - 1))} + x = ${num(p.m)} · (${num(p.k)} + x)`],
    ],
    // Vater + x = m · (k + x)  ⟺  1·x + V = m·x + m·k
    g: (p) => gleichung(1, p.m * p.k - p.j * (p.m - 1), p.m, p.m * p.k),
    antwort: (p, x) => x >= 0
      ? `In <strong>${num(x)} Jahren</strong> ist der Vater ${num(p.m)}-mal so alt wie Jonas.`
      : `Das war bereits vor <strong>${num(-x)} Jahren</strong> der Fall — die Lösung ist negativ.`,
    probe: (p, x) => {
      const V = p.m * p.k - p.j * (p.m - 1);
      return `Vater: ${num(V)} + ${num(x)} = ${num(V + x)}, Jonas: ${num(p.k)} + ${num(x)} = ${num(p.k + x)}, ` +
        `und ${faktor(`${num(p.m)} · ${num(p.k + x)}`)} = ${num(p.m * (p.k + x))} ✓`;
    },
  },
  rechteck: {
    name: "Umfang eines Rechtecks",
    saetze: [
      { d: 4, u: 36 }, { d: 7, u: 50 }, { d: 3, u: 26 }, { d: 10, u: 64 },
    ],
    text: (p) => `Ein Rechteck ist ${num(p.d)} cm länger als breit. Sein Umfang beträgt ${num(p.u)} cm. Wie breit ist es?`,
    zeilen: (p) => [
      ["die gesuchte Breite in cm", "x"],
      [`die Länge ist ${num(p.d)} cm größer`, `x + ${num(p.d)}`],
      ["der Umfang ist zweimal Länge plus zweimal Breite", `2 · (x + ${num(p.d)}) + 2 · x`],
      [`„der Umfang beträgt ${num(p.u)} cm“`, `= ${num(p.u)}`],
    ],
    g: (p) => gleichung(4, 2 * p.d, 0, p.u),
    antwort: (p, x) => `Das Rechteck ist <strong>${num(x)} cm</strong> breit und ${num(x + p.d)} cm lang.`,
    probe: (p, x) => `Umfang: ${faktor(`2 · ${num(x + p.d)}`)} + ${faktor(`2 · ${num(x)}`)} = ${num(2 * (x + p.d) + 2 * x)} cm ✓`,
  },
  tarif: {
    name: "Zwei Tarife vergleichen",
    saetze: [
      { g1: 12, p1: 3, g2: 0, p2: 5 }, { g1: 20, p1: 2, g2: 5, p2: 5 },
      { g1: 30, p1: 4, g2: 6, p2: 8 }, { g1: 18, p1: 1, g2: 3, p2: 4 },
    ],
    text: (p) => `Tarif A kostet ${num(p.g1)} € Grundgebühr und ${num(p.p1)} € je Stunde. ` +
      `Tarif B kostet ${p.g2 === 0 ? "keine Grundgebühr" : num(p.g2) + " € Grundgebühr"} und ${num(p.p2)} € je Stunde. ` +
      `Bei wie vielen Stunden kosten beide Tarife gleich viel?`,
    zeilen: (p) => [
      ["die gesuchte Stundenzahl", "x"],
      ["Kosten bei Tarif A", `${num(p.g1)} + ${num(p.p1)}x`],
      ["Kosten bei Tarif B", `${p.g2 === 0 ? "" : num(p.g2) + " + "}${num(p.p2)}x`],
      ["„kosten gleich viel“ heißt: gleichsetzen", `${num(p.g1)} + ${num(p.p1)}x = ${p.g2 === 0 ? "" : num(p.g2) + " + "}${num(p.p2)}x`],
    ],
    g: (p) => gleichung(p.p1, p.g1, p.p2, p.g2),
    antwort: (p, x) => `Bei <strong>${num(x)} Stunden</strong> kosten beide Tarife gleich viel, nämlich ${num(p.g1 + p.p1 * x)} €. ` +
      `Darunter ist Tarif ${p.g1 < p.g2 ? "A" : "B"} günstiger, darüber Tarif ${p.g1 < p.g2 ? "B" : "A"}.`,
    probe: (p, x) => `Tarif A: ${num(p.g1)} + ${faktor(`${num(p.p1)} · ${num(x)}`)} = ${num(p.g1 + p.p1 * x)} €, ` +
      `Tarif B: ${p.g2 === 0 ? "" : num(p.g2) + " + "}${faktor(`${num(p.p2)} · ${num(x)}`)} = ${num(p.g2 + p.p2 * x)} € ✓`,
  },
};

function renderAufstellen() {
  const typ = document.getElementById("au-typ").value;
  const a = AU_AUFGABEN[typ];
  const nr = begrenzt("au-nr", Number(document.getElementById("au-nr").value), 0, a.saetze.length - 1);
  const p = a.saetze[nr];
  document.getElementById("au-nr-anzeige").textContent = `${a.name} ${num(nr + 1)}`;

  document.getElementById("au-text-aufgabe").innerHTML = `<strong>Aufgabe:</strong> ${a.text(p)}`;

  document.getElementById("au-uebersetzung").innerHTML = a.zeilen(p).map(([deutsch, mathe], i) =>
    `<div class="zeile"><div class="deutsch">${i === 0 ? "<strong>Ich nenne</strong> " : ""}${deutsch}</div>` +
    `<div class="mathe">${mathe}</div></div>`).join("");

  const g = a.g(p);
  document.getElementById("au-gleichung").innerHTML = gleichungHtml(g);

  const x = brZahl(loesung(g));
  const zeilen = [protokollZeile(gleichungHtml(g), "", "", "aufgestellte Gleichung")];
  let h = g;
  if (!brNull(g.c)) {
    h = { a: brMinus(g.a, g.c), b: g.b, c: br(0), d: g.d };
    zeilen.push(protokollZeile(gleichungHtml(h), `− ${brText(g.c).replace(/<[^>]+>/g, "")}x`, "", "x-Terme nach links"));
  }
  if (!brNull(h.b)) {
    const alt = h;
    h = { a: alt.a, b: br(0), c: br(0), d: brMinus(alt.d, alt.b) };
    zeilen.push(protokollZeile(gleichungHtml(h), `${brZahl(alt.b) > 0 ? "−" : "+"} ${num(Math.abs(brZahl(alt.b)))}`, "", "Zahlen nach rechts"));
  }
  if (!brGleich(h.a, br(1))) {
    zeilen.push(protokollZeile(
      `<span class="xv">x</span> = <span class="rs">${num(x, 4)}</span>`,
      `: ${brText(h.a).replace(/<[^>]+>/g, "")}`, "fertig", "durch den Koeffizienten teilen"));
  }
  document.getElementById("au-protokoll").innerHTML = zeilen.join("");

  document.getElementById("au-bilanz").innerHTML =
    `<strong>Probe im Sachzusammenhang:</strong> ${a.probe(p, x)}<br>` +
    `<strong>Antwortsatz:</strong> ${a.antwort(p, x)}`;
}

function initAufstellen() {
  document.getElementById("au-typ").addEventListener("change", () => {
    document.getElementById("au-nr").value = "0";
    renderAufstellen();
  });
  document.getElementById("au-nr").addEventListener("input", renderAufstellen);
  renderAufstellen();
}

// ================= 8. Gestaffelte Übungsaufgaben =================

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
    const hinweis = !ok && current.hinweis ? current.hinweis(raw, val) : "";
    feedback.innerHTML =
      (ok
        ? `<div class="status ok">✓ Richtig!</div>`
        : `<div class="status err">✗ Noch nicht richtig${raw ? " — deine Eingabe: " + raw : " — du hast noch keine Antwort eingetragen"}.</div>` +
          (hinweis ? `<div style="margin-bottom:0.3rem">${hinweis}</div>` : "")) +
      `<div class="musterloesung"><span class="ml-label">Musterlösung</span>${current.musterloesungHtml}</div>`;
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

// Konstruktiv statt verwerfend: Erst wird die Kandidatenliste gefiltert, dann
// gezogen. Kollidieren zwei Hinweiswerte, wäre der Hinweis nicht eindeutig.
function ohneKollision(kandidaten, werte, notfall, eps = 1e-9) {
  const sauber = kandidaten.filter((kk) => {
    const alle = werte(kk);
    return alle.every((x, i) => alle.every((y, j) => i === j || Math.abs(x - y) > eps));
  });
  if (!sauber.length && kandidaten.length > 50) {
    throw new Error("Kollisionsprüfung verwirft alle " + kandidaten.length +
      " Kandidaten — vermutlich steht ein Wert doppelt in der Liste");
  }
  const gewaehlt = sauber.length ? pick(sauber) : notfall;
  if (gewaehlt === undefined) throw new Error("Aufgabengenerator ohne gültige Kandidaten");
  return gewaehlt;
}

// Term "a x + b" in Klartext, mit den üblichen Auslassungen (1x → x, + 0 weg).
function termText(a, b) {
  const teile = [];
  if (a === 1) teile.push("x");
  else if (a === -1) teile.push("−x");
  else if (a !== 0) teile.push(`${num(a)}x`);
  if (b !== 0 || teile.length === 0) {
    if (teile.length === 0) teile.push(num(b));
    else teile.push(`${b > 0 ? "+" : "−"} ${num(Math.abs(b))}`);
  }
  return teile.join(" ");
}

// Aufgabe 1 — einstufige bzw. zweistufige Gleichung a·x + b = c.
function generateAufgabe1() {
  const kandidaten = [];
  for (let a = 2; a <= 9; a++) {
    for (let b = -12; b <= 12; b++) {
      for (let x = -8; x <= 12; x++) {
        if (x === 0 || b === 0) continue;
        kandidaten.push({ a, b, x, c: a * x + b });
      }
    }
  }
  const k = ohneKollision(
    kandidaten,
    (v) => [
      v.x,                    // richtig
      v.c / v.a,              // b vergessen
      v.c - v.b,              // nicht durch a geteilt
      (v.c + v.b) / v.a,      // Vorzeichen von b verdreht
      v.c, v.b, v.a,
    ],
    kandidaten[0]
  );
  const { a, b, x, c } = k;

  return {
    promptHtml: `Löse die Gleichung:<br><span style="font-family:Cambria Math,Cambria,serif;font-size:1.3rem">` +
      `${termText(a, b)} = ${num(c)}</span><br><strong>Wie groß ist x?</strong>`,
    correct: x,
    tolerance: 0.001,
    placeholder: "x = ",
    hinweis: (raw, val) => {
      if (Math.abs(val - (c - b)) < 0.001)
        return `${num(c - b)} ist das Ergebnis nach dem <em>ersten</em> Schritt: ${faktor(`${num(a)}x = ${num(c - b)}`)}. Jetzt fehlt noch die Division durch ${num(a)}.`;
      if (Math.abs(val - (c + b) / a) < 0.001)
        return `Beim Hinüberbringen dreht sich das Vorzeichen um: Auf beiden Seiten wird ${num(b)} <strong>${b > 0 ? "subtrahiert" : "addiert"}</strong>, nicht ${b > 0 ? "addiert" : "subtrahiert"}.`;
      if (Math.abs(val - c / a) < 0.001)
        return `Du hast die ${num(Math.abs(b))} übersehen. Erst muss sie von beiden Seiten weg, dann wird geteilt.`;
      return `Zwei Schritte: erst ${b > 0 ? "− " : "+ "}${num(Math.abs(b))} auf beiden Seiten, dann : ${num(a)}.`;
    },
    musterloesungHtml:
      `<strong>1. Zahlen nach rechts:</strong> ${termText(a, b)} = ${num(c)} &nbsp;|&nbsp; ${b > 0 ? "−" : "+"} ${num(Math.abs(b))}<br>` +
      `&nbsp;&nbsp;&nbsp;&nbsp;${faktor(`${num(a)}x = ${num(c - b)}`)}<br>` +
      `<strong>2. Durch den Koeffizienten teilen:</strong> &nbsp;|&nbsp; : ${num(a)}<br>` +
      `&nbsp;&nbsp;&nbsp;&nbsp;<strong>x = ${num(x)}</strong>, also L = {${num(x)}}<br>` +
      `<em>Probe:</em> ${faktor(`${num(a)} · ${num(x)}`)} ${b > 0 ? "+" : "−"} ${num(Math.abs(b))} = ${num(c)} ✓`,
  };
}

// Aufgabe 2 — x auf beiden Seiten.
function generateAufgabe2() {
  const kandidaten = [];
  for (let a = 2; a <= 9; a++) {
    for (let c = 1; c <= 8; c++) {
      if (a === c) continue;
      for (let b = -10; b <= 10; b++) {
        for (let x = -7; x <= 9; x++) {
          if (x === 0) continue;
          const d = a * x + b - c * x;
          if (Math.abs(d) > 40) continue;
          kandidaten.push({ a, b, c, d, x });
        }
      }
    }
  }
  const k = ohneKollision(
    kandidaten,
    (v) => [
      v.x,                                  // richtig
      (v.d + v.b) / (v.a - v.c),            // Vorzeichen von b verdreht
      (v.d - v.b) / (v.a + v.c),            // x-Terme addiert statt subtrahiert
      v.d - v.b,                            // nicht geteilt
      v.a - v.c,
    ],
    kandidaten[0]
  );
  const { a, b, c, d, x } = k;
  const kk = a - c, mm = d - b;

  return {
    promptHtml: `Löse die Gleichung:<br><span style="font-family:Cambria Math,Cambria,serif;font-size:1.3rem">` +
      `${termText(a, b)} = ${termText(c, d)}</span><br><strong>Wie groß ist x?</strong>`,
    correct: x,
    tolerance: 0.001,
    placeholder: "x = ",
    hinweis: (raw, val) => {
      if (Math.abs(val - (d - b) / (a + c)) < 0.001)
        return `Du hast die beiden x-Terme <em>addiert</em>. Wird ${num(c)}x auf beiden Seiten <strong>subtrahiert</strong>, so bleibt links ${faktor(`${num(a)} − ${num(c)} = ${num(kk)}`)} mal x.`;
      if (Math.abs(val - (d + b) / (a - c)) < 0.001)
        return `Beim Hinüberbringen der Zahl dreht sich ihr Vorzeichen um: rechts entsteht ${faktor(`${num(d)} − ${num(b)} = ${num(mm)}`)}, nicht ${num(d + b)}.`;
      if (Math.abs(val - mm) < 0.001)
        return `${num(mm)} ist die rechte Seite nach dem Sortieren: ${faktor(`${num(kk)}x = ${num(mm)}`)}. Es fehlt die Division durch ${num(kk)}.`;
      return `Sortiere zuerst: ${num(c)}x auf beiden Seiten abziehen, dann ${b > 0 ? num(b) + " abziehen" : num(-b) + " addieren"}. Danach steht ${faktor(`${num(kk)}x = ${num(mm)}`)}.`;
    },
    musterloesungHtml:
      `<strong>1. x-Terme nach links:</strong> &nbsp;|&nbsp; − ${num(c)}x<br>` +
      `&nbsp;&nbsp;&nbsp;&nbsp;${termText(kk, b)} = ${num(d)}<br>` +
      `<strong>2. Zahlen nach rechts:</strong> &nbsp;|&nbsp; ${b > 0 ? "−" : "+"} ${num(Math.abs(b))}<br>` +
      `&nbsp;&nbsp;&nbsp;&nbsp;${faktor(`${num(kk)}x = ${num(mm)}`)}<br>` +
      (kk === 1 ? "" : `<strong>3. Teilen:</strong> &nbsp;|&nbsp; : ${num(kk)}<br>`) +
      `&nbsp;&nbsp;&nbsp;&nbsp;<strong>x = ${num(x)}</strong>, also L = {${num(x)}}<br>` +
      `<em>Probe:</em> links ${faktor(`${num(a)} · ${num(x)}`)} ${b >= 0 ? "+ " + num(b) : "− " + num(-b)} = ${num(a * x + b)}, ` +
      `rechts ${faktor(`${num(c)} · ${num(x)}`)} ${d >= 0 ? "+ " + num(d) : "− " + num(-d)} = ${num(c * x + d)} ✓`,
  };
}

// Aufgabe 3 — mit Klammer: a · (x + b) = c · x + d.
function generateAufgabe3() {
  const kandidaten = [];
  for (let a = 2; a <= 7; a++) {
    for (let c = 1; c <= 9; c++) {
      if (a === c) continue;
      for (let b = -8; b <= 8; b++) {
        if (b === 0) continue;
        for (let x = -6; x <= 9; x++) {
          if (x === 0) continue;
          const d = a * (x + b) - c * x;
          if (Math.abs(d) > 60) continue;
          kandidaten.push({ a, b, c, d, x });
        }
      }
    }
  }
  const k = ohneKollision(
    kandidaten,
    (v) => [
      v.x,                                       // richtig
      (v.d - v.b) / (v.a - v.c),                 // Klammer nicht ausmultipliziert (nur b statt a·b)
      (v.d + v.a * v.b) / (v.a - v.c),           // Vorzeichen beim Hinüberbringen verdreht
      (v.d - v.a * v.b) / (v.a + v.c),           // x-Terme addiert
      v.d - v.a * v.b, v.a - v.c,
    ],
    kandidaten[0]
  );
  const { a, b, c, d, x } = k;
  const kk = a - c, mm = d - a * b;

  return {
    promptHtml: `Löse die Gleichung:<br><span style="font-family:Cambria Math,Cambria,serif;font-size:1.3rem">` +
      `${num(a)} · (x ${b > 0 ? "+" : "−"} ${num(Math.abs(b))}) = ${termText(c, d)}</span><br><strong>Wie groß ist x?</strong>`,
    correct: x,
    tolerance: 0.001,
    placeholder: "x = ",
    hinweis: (raw, val) => {
      if (Math.abs(val - (d - b) / (a - c)) < 0.001)
        return `Beim Ausmultiplizieren muss <strong>jeder</strong> Summand in der Klammer mit ${num(a)} multipliziert werden — auch die ${num(Math.abs(b))}: ${faktor(`${num(a)} · (x ${b > 0 ? "+" : "−"} ${num(Math.abs(b))}) = ${num(a)}x ${a * b > 0 ? "+" : "−"} ${num(Math.abs(a * b))}`)}.`;
      if (Math.abs(val - (d + a * b) / (a - c)) < 0.001)
        return `Rechts entsteht ${faktor(`${num(d)} − ${num(a * b)} = ${num(mm)}`)}. Beim Hinüberbringen dreht sich das Vorzeichen um.`;
      if (Math.abs(val - (d - a * b) / (a + c)) < 0.001)
        return `Die x-Terme werden <em>subtrahiert</em>, nicht addiert: ${faktor(`${num(a)} − ${num(c)} = ${num(kk)}`)}.`;
      if (Math.abs(val - mm) < 0.001)
        return `${num(mm)} ist die rechte Seite nach dem Sortieren. Es fehlt noch die Division durch ${num(kk)}.`;
      return `Löse zuerst die Klammer auf: ${faktor(`${num(a)} · (x ${b > 0 ? "+" : "−"} ${num(Math.abs(b))}) = ${num(a)}x ${a * b > 0 ? "+" : "−"} ${num(Math.abs(a * b))}`)}.`;
    },
    musterloesungHtml:
      `<strong>1. Klammer ausmultiplizieren:</strong> ${faktor(`${num(a)} · (x ${b > 0 ? "+" : "−"} ${num(Math.abs(b))})`)} = ${termText(a, a * b)}<br>` +
      `&nbsp;&nbsp;&nbsp;&nbsp;${termText(a, a * b)} = ${termText(c, d)}<br>` +
      `<strong>2. x-Terme nach links:</strong> &nbsp;|&nbsp; − ${num(c)}x &nbsp;→&nbsp; ${termText(kk, a * b)} = ${num(d)}<br>` +
      `<strong>3. Zahlen nach rechts:</strong> &nbsp;|&nbsp; ${a * b > 0 ? "−" : "+"} ${num(Math.abs(a * b))} &nbsp;→&nbsp; ${faktor(`${num(kk)}x = ${num(mm)}`)}<br>` +
      (kk === 1 ? "" : `<strong>4. Teilen:</strong> &nbsp;|&nbsp; : ${num(kk)}<br>`) +
      `&nbsp;&nbsp;&nbsp;&nbsp;<strong>x = ${num(x)}</strong>, also L = {${num(x)}}<br>` +
      `<em>Probe:</em> links ${faktor(`${num(a)} · (${num(x)} ${b > 0 ? "+" : "−"} ${num(Math.abs(b))})`)} = ${faktor(`${num(a)} · ${num(x + b)}`)} = ${num(a * (x + b))}, ` +
      `rechts ${faktor(`${num(c)} · ${num(x)}`)} ${d >= 0 ? "+ " + num(d) : "− " + num(-d)} = ${num(c * x + d)} ✓`,
  };
}

// Aufgabe 4 — Sachaufgabe: erst übersetzen, dann lösen.
const A4_KONTEXTE = [
  {
    // Zwei Tarife: g1 + p1·x = g2 + p2·x
    text: (v) => `Ein Kletterpark bietet zwei Tarife an. <strong>Tarif A</strong> kostet <strong>${num(v.g1)} €</strong> Grundgebühr ` +
      `und <strong>${num(v.p1)} €</strong> je Stunde. <strong>Tarif B</strong> kostet <strong>${num(v.g2)} €</strong> Grundgebühr ` +
      `und <strong>${num(v.p2)} €</strong> je Stunde.<br><strong>Bei wie vielen Stunden kosten beide Tarife gleich viel?</strong>`,
    platzhalter: "Stunden",
    aufstellen: (v) => `${num(v.g1)} + ${num(v.p1)}x = ${num(v.g2)} + ${num(v.p2)}x`,
    was: "die Anzahl der Stunden",
    antwort: (v, x) => `Bei <strong>${num(x)} Stunden</strong> kosten beide Tarife gleich viel, nämlich je ${num(v.g1 + v.p1 * x)} €.`,
    probe: (v, x) => `Tarif A: ${num(v.g1)} + ${faktor(`${num(v.p1)} · ${num(x)}`)} = ${num(v.g1 + v.p1 * x)} €, ` +
      `Tarif B: ${num(v.g2)} + ${faktor(`${num(v.p2)} · ${num(x)}`)} = ${num(v.g2 + v.p2 * x)} € ✓`,
  },
  {
    text: (v) => `Für eine Klassenfahrt sammelt eine Klasse Geld. Bei <strong>Anbieter A</strong> sind <strong>${num(v.g1)} €</strong> ` +
      `Anzahlung und <strong>${num(v.p1)} €</strong> pro Person zu zahlen, bei <strong>Anbieter B</strong> ` +
      `<strong>${num(v.g2)} €</strong> Anzahlung und <strong>${num(v.p2)} €</strong> pro Person.<br>` +
      `<strong>Bei wie vielen Personen sind beide Angebote gleich teuer?</strong>`,
    platzhalter: "Personen",
    aufstellen: (v) => `${num(v.g1)} + ${num(v.p1)}x = ${num(v.g2)} + ${num(v.p2)}x`,
    was: "die Anzahl der Personen",
    antwort: (v, x) => `Bei <strong>${num(x)} Personen</strong> kosten beide Angebote gleich viel, nämlich je ${num(v.g1 + v.p1 * x)} €.`,
    probe: (v, x) => `Anbieter A: ${num(v.g1)} + ${faktor(`${num(v.p1)} · ${num(x)}`)} = ${num(v.g1 + v.p1 * x)} €, ` +
      `Anbieter B: ${num(v.g2)} + ${faktor(`${num(v.p2)} · ${num(x)}`)} = ${num(v.g2 + v.p2 * x)} € ✓`,
  },
  {
    text: (v) => `Zwei Wassertanks werden gleichzeitig gefüllt. Im ersten stehen schon <strong>${num(v.g1)} Liter</strong>, ` +
      `es kommen <strong>${num(v.p1)} Liter</strong> je Minute dazu. Im zweiten stehen <strong>${num(v.g2)} Liter</strong>, ` +
      `es kommen <strong>${num(v.p2)} Liter</strong> je Minute dazu.<br>` +
      `<strong>Nach wie vielen Minuten enthalten beide Tanks gleich viel Wasser?</strong>`,
    platzhalter: "Minuten",
    aufstellen: (v) => `${num(v.g1)} + ${num(v.p1)}x = ${num(v.g2)} + ${num(v.p2)}x`,
    was: "die Anzahl der Minuten",
    antwort: (v, x) => `Nach <strong>${num(x)} Minuten</strong> enthalten beide Tanks gleich viel, nämlich je ${num(v.g1 + v.p1 * x)} Liter.`,
    probe: (v, x) => `Tank 1: ${num(v.g1)} + ${faktor(`${num(v.p1)} · ${num(x)}`)} = ${num(v.g1 + v.p1 * x)} Liter, ` +
      `Tank 2: ${num(v.g2)} + ${faktor(`${num(v.p2)} · ${num(x)}`)} = ${num(v.g2 + v.p2 * x)} Liter ✓`,
  },
];
function generateAufgabe4() {
  // Der zweite Tarif ist der teurere pro Einheit, der erste der mit der
  // höheren Grundgebühr — nur so ist die Frage sachlich sinnvoll und x > 0.
  const kandidaten = [];
  for (const p1 of [1, 2, 3, 4, 5]) {
    for (const p2 of [2, 3, 4, 5, 6, 7, 8]) {
      if (p2 <= p1) continue;
      for (const g2 of [0, 3, 4, 5, 6, 8, 10]) {
        for (const x of [3, 4, 5, 6, 7, 8, 9, 10, 12]) {
          const g1 = g2 + (p2 - p1) * x;
          if (g1 > 90 || g1 <= g2) continue;
          kandidaten.push({ g1, p1, g2, p2, x });
        }
      }
    }
  }
  const k = ohneKollision(
    kandidaten,
    (v) => [
      v.x,                                       // richtig
      (v.g1 - v.g2) / (v.p1 + v.p2),             // Stundensätze addiert
      (v.g1 + v.g2) / (v.p2 - v.p1),             // Grundgebühren addiert
      v.g1 - v.g2,                               // nicht geteilt
      v.p2 - v.p1, v.g1, v.g2,
    ],
    kandidaten[0]
  );
  const { g1, p1, g2, p2, x } = k;
  const kontext = pick(A4_KONTEXTE);
  const diffP = p2 - p1, diffG = g1 - g2;

  return {
    promptHtml: kontext.text(k),
    correct: x,
    tolerance: 0.001,
    placeholder: kontext.platzhalter,
    hinweis: (raw, val) => {
      if (Math.abs(val - (g1 - g2) / (p1 + p2)) < 0.001)
        return `Die beiden x-Terme werden <em>subtrahiert</em>, nicht addiert: ${faktor(`${num(p2)} − ${num(p1)} = ${num(diffP)}`)}.`;
      if (Math.abs(val - (g1 + g2) / (p2 - p1)) < 0.001)
        return `Die beiden festen Beträge werden ebenfalls <em>subtrahiert</em>: ${faktor(`${num(g1)} − ${num(g2)} = ${num(diffG)}`)}.`;
      if (Math.abs(val - diffG) < 0.001)
        return `${num(diffG)} ist der Unterschied der festen Beträge. Nach dem Sortieren steht ${faktor(`${num(diffP)}x = ${num(diffG)}`)} — es fehlt die Division durch ${num(diffP)}.`;
      return `Nenne die gesuchte Größe x, schreibe beide Seiten als Term auf und setze sie gleich: ${kontext.aufstellen(k)}.`;
    },
    musterloesungHtml:
      `<strong>1. Benennen:</strong> x ist ${kontext.was}.<br>` +
      `<strong>2. Gleichung aufstellen:</strong> ${kontext.aufstellen(k)}<br>` +
      `<strong>3. x-Terme nach rechts:</strong> &nbsp;|&nbsp; − ${num(p1)}x &nbsp;→&nbsp; ${num(g1)} = ${num(g2)} + ${num(diffP)}x<br>` +
      `<strong>4. Zahlen nach links:</strong> &nbsp;|&nbsp; − ${num(g2)} &nbsp;→&nbsp; ${faktor(`${num(diffG)} = ${num(diffP)}x`)}<br>` +
      (diffP === 1 ? "" : `<strong>5. Teilen:</strong> &nbsp;|&nbsp; : ${num(diffP)}<br>`) +
      `&nbsp;&nbsp;&nbsp;&nbsp;<strong>x = ${num(x)}</strong><br>` +
      `<em>Probe:</em> ${kontext.probe(k, x)}<br>` +
      `<em>Antwortsatz:</em> ${kontext.antwort(k, x)}`,
  };
}

function initExercises() {
  mountUebungsaufgaben(document.getElementById("exercises-mount"), [
    { schwierigkeit: "einfach", titel: "Aufgabe 1 — zwei Schritte", generate: generateAufgabe1 },
    { schwierigkeit: "mittel", titel: "Aufgabe 2 — x auf beiden Seiten", generate: generateAufgabe2 },
    { schwierigkeit: "schwierig", titel: "Aufgabe 3 — mit Klammer", generate: generateAufgabe3 },
    { schwierigkeit: "komplex", titel: "Aufgabe 4 — Gleichung aufstellen", generate: generateAufgabe4 },
  ]);
}

// ================= Quizze =================

function initQuizzes() {
  mountQuiz(document.getElementById("quiz-gleichung"), {
    q: "Welche Zahl ist eine Lösung der Gleichung 4x − 7 = 2x + 3?",
    options: ["x = 5", "x = 2", "x = −5", "x = 10"],
    correct: 0,
    explain: "Einsetzen von 5: links 4 · 5 − 7 = 13, rechts 2 · 5 + 3 = 13. Beide Seiten stimmen überein, also ist 5 eine Lösung. Bei x = 2 wäre links 1 und rechts 7 — die Waage stünde schief.",
  });
  mountQuiz(document.getElementById("quiz-umformen"), {
    q: "Welche Umformung ist <em>keine</em> Äquivalenzumformung?",
    options: [
      "auf beiden Seiten 7 addieren",
      "beide Seiten durch 3 teilen",
      "beide Seiten mit 0 multiplizieren",
      "auf beiden Seiten 2x subtrahieren",
    ],
    correct: 2,
    explain: "Aus 3x = 12 würde durch „· 0“ die Gleichung 0 = 0 — plötzlich wäre jede Zahl eine Lösung. Die Umformung lässt sich nicht rückgängig machen, weil man nicht durch 0 teilen darf. Alle anderen drei sind erlaubt.",
  });
  mountQuiz(document.getElementById("quiz-loesen"), {
    q: "Aus 6x + 5 = 2x + 21 folgt nach dem ersten Schritt (− 2x) welche Gleichung?",
    options: ["4x + 5 = 21", "8x + 5 = 21", "4x + 5 = 23", "6x + 5 = 19"],
    correct: 0,
    explain: "Auf beiden Seiten wird 2x abgezogen: links 6x − 2x = 4x, rechts fällt der x-Term weg. Die Zahlen 5 und 21 bleiben unberührt — sie kommen erst im zweiten Schritt an die Reihe.",
  });
  mountQuiz(document.getElementById("quiz-sonderfaelle"), {
    q: "Beim Lösen bleibt am Ende 7 = 7 stehen. Was bedeutet das?",
    options: [
      "Die Gleichung hat keine Lösung.",
      "Die Lösung ist x = 7.",
      "Jede Zahl ist eine Lösung.",
      "Man hat sich verrechnet.",
    ],
    correct: 2,
    explain: "7 = 7 ist wahr — und zwar unabhängig davon, was für x eingesetzt wurde. Die Gleichung ist also für jede Zahl erfüllt: L = ℚ. Am Graphen liegen die beiden Geraden aufeinander. Bliebe dagegen 7 = 9 stehen, gäbe es keine Lösung.",
  });
  mountQuiz(document.getElementById("quiz-aufstellen"), {
    q: "„Ein Rechteck ist 5 cm länger als breit, sein Umfang beträgt 38 cm.“ Welche Gleichung gehört dazu, wenn x die Breite ist?",
    options: [
      "2 · (x + 5) + 2 · x = 38",
      "x + (x + 5) = 38",
      "x · (x + 5) = 38",
      "2 · x + 5 = 38",
    ],
    correct: 0,
    explain: "Der Umfang setzt sich aus zwei Längen und zwei Breiten zusammen. Die Länge ist x + 5, die Breite x, also 2 · (x + 5) + 2 · x = 38. Antwort 2 erfasst nur eine Länge und eine Breite, Antwort 3 wäre der Flächeninhalt.",
  });
}

// ================= Start =================

initWaage();
initUmformen();
initLoesen();
initSonderfaelle();
initAufstellen();
initExercises();
initQuizzes();
