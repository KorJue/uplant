// Selbstlernpfad "Prozent- und Zinsrechnung" (Grundwissen Klasse 5-10, Kapitel 4).
// Rein clientseitiges Vanilla-JS, ohne Build-Schritt oder externe Bibliotheken.
//
// Leitgedanke: Prozentrechnung ist keine Formelsammlung, sondern eine einzige
// proportionale Zuordnung, die man in drei Richtungen lesen kann. Deshalb zeigt
// Abschnitt 1 den Doppelstreifen mit Prozent- und Größenskala übereinander,
// Abschnitt 2 stellt neben jede Formel den zugehörigen Dreisatz, und ab
// Abschnitt 3 tritt der Wachstumsfaktor an die Stelle des Prozentwerts —
// er ist der Schlüssel dazu, dass sich +20 % und -20 % nicht aufheben.
//
// Durchgehende Farbcodierung: Grundwert G blau, Prozentwert W grün,
// Prozentsatz p rot, Zinsen violett, Abzüge orange.

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
  return x.toLocaleString("de-DE", { maximumFractionDigits: digits });
}
// "=" oder "≈"? Entscheidend ist, ob die Anzeige mit der gewählten Stellenzahl
// den Wert genau trifft — nicht, ob er ganzzahlig ist (2,5 ist exakt).
function zeichen(x, stellen = 2) {
  const f = Math.pow(10, stellen);
  return Math.abs(x - Math.round(x * f) / f) < 1e-9 ? "=" : "≈";
}
// Einzelner Zahlenwert: Das "≈" steht nur, wenn wirklich gerundet wird.
function wert(x, stellen = 2) {
  return (zeichen(x, stellen) === "=" ? "" : "≈ ") + num(x, stellen);
}
function euro(x, stellen = 2) {
  return (zeichen(x, stellen) === "=" ? "" : "≈ ") + num(x, stellen) + " €";
}
function proz(x, stellen = 2) {
  return (zeichen(x, stellen) === "=" ? "" : "≈ ") + num(x, stellen) + " %";
}
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function parseFlexibleNumber(raw) {
  if (raw == null) return NaN;
  const s = String(raw).trim().replace(/\s/g, "").replace(/−/g, "-").replace(/%/g, "").replace(/\./g, "").replace(",", ".");
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
  return el("div", { class: "pz-karte " + klasse }, [
    el("span", { class: "name" }, name),
    el("span", { class: "wert" }, inhalt),
  ]);
}
// Zusammengehörige Faktoren nie über einen Zeilenumbruch reißen.
function faktor(text) {
  return `<span class="nw">${text}</span>`;
}

// Sinnvoller Achsenschritt: Die Skala soll runde Zahlen tragen, egal wie
// krumm der größte darzustellende Wert ist.
function schrittWeite(max, ziel = 4) {
  const roh = max / ziel;
  const zehner = Math.pow(10, Math.floor(Math.log10(roh)));
  for (const f of [1, 2, 2.5, 5, 10]) if (f * zehner >= roh - 1e-9) return f * zehner;
  return 10 * zehner;
}

// ---------- Quiz-Komponente ----------

function mountQuiz(container, { q, options, correct, explain }) {
  container.innerHTML = "";
  container.appendChild(el("p", { class: "quiz-q", html: "❓ " + q }));
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

// ================= 1. Die drei Größen =================

// Der Doppelstreifen ist das tragende Bild dieses Themas: ein und dieselbe
// Strecke trägt oben die Prozentskala und unten die Größenskala. Dass beide
// Skalen dieselbe Strecke messen, ist genau die Aussage "G entspricht 100 %".
function gbStreifen(G, p) {
  const B = 470, H = 196;
  const svg = neueFlaeche(B, H);
  const x0 = 62, breite = 348, y0 = 74, hoehe = 46;
  const px = (s) => x0 + (s / 100) * breite;
  const W = (G * p) / 100;

  svg.appendChild(svgText(B / 2, 22, `Grundwert G = ${num(G, 2)} €  ≙  100 %`, { class: "pz-skalenname" }));

  svg.appendChild(svgEl("rect", { x: x0, y: y0, width: breite, height: hoehe, class: "pz-streifen-hg" }));
  svg.appendChild(svgEl("rect", { x: x0, y: y0, width: ((breite * p) / 100).toFixed(2), height: hoehe, class: "pz-streifen-w" }));

  // Feinstriche alle 5 %, beschriftet werden die Viertel — sonst fehlten
  // ausgerechnet 25 % und 75 %, die im Unterricht am häufigsten vorkommen.
  for (let s = 0; s <= 100; s += 5) {
    const x = px(s);
    const stark = s % 25 === 0;
    svg.appendChild(svgEl("line", { x1: x.toFixed(2), y1: y0 - (stark ? 10 : 6), x2: x.toFixed(2), y2: y0, class: "pz-marke" + (stark ? " stark" : "") }));
    svg.appendChild(svgEl("line", { x1: x.toFixed(2), y1: y0 + hoehe, x2: x.toFixed(2), y2: y0 + hoehe + (stark ? 10 : 6), class: "pz-marke" + (stark ? " stark" : "") }));
    if (stark) {
      svg.appendChild(svgText(x, y0 - 16, num(s) + " %", { class: "pz-skalentext" }));
      svg.appendChild(svgText(x, y0 + hoehe + 24, num((G * s) / 100, 2) + " €", { class: "pz-skalentext" }));
    }
  }
  // Rahmen zum Schluss, damit die Füllung ihn nicht überdeckt.
  svg.appendChild(svgEl("rect", { x: x0, y: y0, width: breite, height: hoehe, class: "pz-streifen-rahmen" }));

  // Die Trennlinie ist der Kern des Bildes: Oben liest man dort p ab,
  // unten W — dieselbe Stelle, zwei Skalen.
  const xp = px(p);
  svg.appendChild(svgEl("line", { x1: xp.toFixed(2), y1: y0 - 30, x2: xp.toFixed(2), y2: y0 + hoehe + 32, class: "pz-trennlinie" }));
  const seiteRechts = p <= 78;
  const anker = seiteRechts ? "start" : "end";
  const dx = seiteRechts ? 6 : -6;
  svg.appendChild(svgText(xp + dx, y0 - 34, "p = " + num(p) + " %", { class: "pz-streifentext p", "text-anchor": anker }));
  svg.appendChild(svgText(xp + dx, y0 + hoehe + 46, "W = " + num(W, 2) + " €", { class: "pz-streifentext w", "text-anchor": anker }));

  svg.appendChild(svgText(B / 2, H - 6, "Oben die Prozentskala, unten dieselbe Strecke in Euro.", { class: "pz-skalentext" }));
  return svg;
}

function renderGrundbegriffe() {
  const G = begrenzt("gb-g", Number(document.getElementById("gb-g").value), 20, 400);
  const p = begrenzt("gb-p", Number(document.getElementById("gb-p").value), 5, 100);
  const W = (G * p) / 100;
  const einProzent = G / 100;

  document.getElementById("gb-g-anzeige").textContent = euro(G);
  document.getElementById("gb-p-anzeige").textContent = num(p) + " %";

  const mount = document.getElementById("gb-mount");
  mount.innerHTML = "";
  mount.appendChild(gbStreifen(G, p));

  const karten = document.getElementById("gb-karten");
  karten.innerHTML = "";
  karten.appendChild(karte("g", "Grundwert G", euro(G)));
  karten.appendChild(karte("p", "Prozentsatz p", num(p) + " %"));
  karten.appendChild(karte("w", "Prozentwert W", euro(W)));
  karten.appendChild(karte("f", "1 % entspricht", euro(einProzent)));

  document.getElementById("gb-bilanz").innerHTML =
    `<span class="wg">G = ${num(G, 2)} €</span> ≙ 100 %, also entspricht 1 % dem hundertsten Teil: ` +
    `${faktor(`${num(G, 2)} € : 100`)} = <span class="wf">${num(einProzent, 2)} €</span>.<br>` +
    `<span class="wp">${num(p)} %</span> sind das ${num(p)}-fache davon: ` +
    `<span class="ww">W</span> = ${faktor(`${num(einProzent, 2)} € · ${num(p)}`)} = <strong>${num(W, 2)} €</strong>.<br>` +
    `Zusammengefasst: <span class="ww">W</span> = <span class="wg">G</span> · <span class="wp">p</span> : 100 = ` +
    `${faktor(`${num(G, 2)} € · ${num(p)}`)} : 100 = <strong>${num(W, 2)} €</strong>.`;

  document.getElementById("gb-text").textContent =
    p === 100
      ? "Bei 100 % ist der Prozentwert der ganze Grundwert — der grüne Balken füllt den Streifen vollständig aus."
      : `Der grüne Teil ist der Prozentwert, der ganze Streifen der Grundwert. Verschiebst du p, wandert die rote Linie — und mit ihr beide Ablesungen: ${num(p)} % oben, ${num(W, 2)} € unten.`;
}

function initGrundbegriffe() {
  ["gb-g", "gb-p"].forEach((id) => document.getElementById(id).addEventListener("input", renderGrundbegriffe));
  renderGrundbegriffe();
}

// ================= 2. Die drei Grundaufgaben =================

// Jeder Kontext trägt alle drei Größen und drei ausformulierte Fragen. So
// bleibt die Sachsituation gleich, während nur die gesuchte Größe wechselt —
// genau das ist der Kern der "drei Grundaufgaben".
const GA_KONTEXTE = [
  {
    kurz: "Fahrrad", G: 450, p: 20, W: 90, einheit: "€", stellen: 2,
    gName: "ursprünglicher Preis", wName: "Ersparnis",
    frageW: "Ein Fahrrad kostet 450 €. Im Schlussverkauf wird der Preis um 20 % gesenkt. Wie viel Euro spart man?",
    frageG: "Ein Fahrrad wird um 20 % billiger. Man spart dadurch 90 €. Wie teuer war das Fahrrad vorher?",
    frageP: "Ein Fahrrad kostete 450 € und ist jetzt 90 € billiger. Um wie viel Prozent wurde der Preis gesenkt?",
  },
  {
    kurz: "Schule", G: 750, p: 12, W: 90, einheit: "Kinder", stellen: 0,
    gName: "Anzahl aller Kinder", wName: "Anzahl der Radfahrer",
    frageW: "Eine Schule hat 750 Kinder. 12 % von ihnen kommen mit dem Rad. Wie viele Kinder sind das?",
    frageG: "An einer Schule kommen 90 Kinder mit dem Rad; das sind 12 % aller Kinder. Wie viele Kinder hat die Schule?",
    frageP: "Von den 750 Kindern einer Schule kommen 90 mit dem Rad. Wie viel Prozent sind das?",
  },
  {
    kurz: "Müsli", G: 500, p: 15, W: 75, einheit: "g", stellen: 0,
    gName: "Masse der Packung", wName: "Masse der Nüsse",
    frageW: "Eine Packung Müsli wiegt 500 g und besteht zu 15 % aus Nüssen. Wie viel Gramm Nüsse sind darin?",
    frageG: "In einer Packung Müsli stecken 75 g Nüsse; das sind 15 % des Inhalts. Wie viel wiegt die Packung?",
    frageP: "In einer 500-g-Packung Müsli stecken 75 g Nüsse. Wie viel Prozent des Inhalts sind das?",
  },
  {
    kurz: "Wahl", G: 2400, p: 35, W: 840, einheit: "Stimmen", stellen: 0,
    gName: "Anzahl aller Stimmen", wName: "Anzahl der Stimmen für Liste A",
    frageW: "Bei einer Schulwahl werden 2400 Stimmen abgegeben. Liste A erhält 35 % davon. Wie viele Stimmen sind das?",
    frageG: "Liste A erhält bei einer Schulwahl 840 Stimmen; das sind 35 % aller Stimmen. Wie viele Stimmen wurden abgegeben?",
    frageP: "Von 2400 abgegebenen Stimmen entfallen 840 auf Liste A. Wie viel Prozent sind das?",
  },
];

let gaWeg = "dreisatz";

function gaZeile(marke, links, rechts, operation, hervor) {
  return `<div class="zeile${hervor ? " hervor" : ""}">` +
    `<span class="marke">${marke}</span>` +
    `<span class="links">${links}</span>` +
    `<span class="pfeil">↦</span>` +
    `<span class="rechts">${rechts}</span>` +
    `<span class="operation">${operation}</span>` +
    `</div>`;
}
function gaFormelzeile(marke, text, operation, hervor) {
  return `<div class="zeile${hervor ? " hervor" : ""}">` +
    `<span class="marke">${marke}</span>` +
    `<span class="links" style="color:inherit">${text}</span>` +
    `<span class="operation">${operation}</span>` +
    `</div>`;
}

function renderGrundaufgaben() {
  const typ = document.getElementById("ga-typ").value;
  const nr = begrenzt("ga-nr", Number(document.getElementById("ga-nr").value), 0, GA_KONTEXTE.length - 1);
  const k = GA_KONTEXTE[nr];
  const st = k.stellen;
  const E = k.einheit === "€" ? " €" : " " + k.einheit;
  document.getElementById("ga-nr-anzeige").textContent = k.kurz;

  const schalter = document.getElementById("ga-schalter");
  schalter.innerHTML = "";
  [["dreisatz", "mit dem Dreisatz"], ["formel", "mit der Formel"]].forEach(([wegKey, name]) => {
    const btn = el("button", { type: "button", class: gaWeg === wegKey ? "aktiv" : "" }, name);
    btn.addEventListener("click", () => {
      gaWeg = wegKey;
      renderGrundaufgaben();
    });
    schalter.appendChild(btn);
  });

  const frage = { W: k.frageW, G: k.frageG, p: k.frageP }[typ];
  document.getElementById("ga-frage").innerHTML =
    `<strong>Aufgabe:</strong> ${frage}<br>` +
    `<span class="progress-note">Gegeben: ` +
    (typ === "W" ? `Grundwert G = ${num(k.G, st)}${E} und Prozentsatz p = ${num(k.p)} % — gesucht ist der Prozentwert W.`
      : typ === "G" ? `Prozentwert W = ${num(k.W, st)}${E} und Prozentsatz p = ${num(k.p)} % — gesucht ist der Grundwert G.`
        : `Grundwert G = ${num(k.G, st)}${E} und Prozentwert W = ${num(k.W, st)}${E} — gesucht ist der Prozentsatz p.`) +
    `</span>`;

  const schritte = document.getElementById("ga-schritte");
  // Beim Prozentsatz-Dreisatz sind die Spalten vertauscht: links die Größe,
  // rechts die Prozente. Der Farbcode wandert mit.
  schritte.className = "pz-schritte" + (gaWeg === "dreisatz" && typ === "p" ? " getauscht" : "");
  const einProzent = k.G / 100;
  const proEinheit = 100 / k.G;
  if (gaWeg === "dreisatz") {
    if (typ === "W") {
      schritte.innerHTML =
        gaZeile("1.", "100 %", `${num(k.G, st)}${E}`, "gegeben", false) +
        gaZeile("2.", "1 %", `${wert(einProzent, 4)}${E}`, ": 100", true) +
        gaZeile("3.", `${num(k.p)} %`, `<strong>${num(k.W, st)}${E}</strong>`, `· ${num(k.p)}`, false);
    } else if (typ === "G") {
      schritte.innerHTML =
        gaZeile("1.", `${num(k.p)} %`, `${num(k.W, st)}${E}`, "gegeben", false) +
        gaZeile("2.", "1 %", `${wert(k.W / k.p, 4)}${E}`, `: ${num(k.p)}`, true) +
        gaZeile("3.", "100 %", `<strong>${num(k.G, st)}${E}</strong>`, "· 100", false);
    } else {
      schritte.innerHTML =
        gaZeile("1.", `${num(k.G, st)}${E}`, "100 %", "gegeben", false) +
        gaZeile("2.", `1${E}`, `${wert(proEinheit, 4)} %`, `: ${num(k.G, st)}`, true) +
        gaZeile("3.", `${num(k.W, st)}${E}`, `<strong>${num(k.p)} %</strong>`, `· ${num(k.W, st)}`, false);
    }
  } else {
    if (typ === "W") {
      schritte.innerHTML =
        gaFormelzeile("1.", "<strong>W = G · p : 100</strong>", "Formel", false) +
        gaFormelzeile("2.", `W = ${faktor(`${num(k.G, st)} · ${num(k.p)}`)} : 100`, "einsetzen", true) +
        gaFormelzeile("3.", `W = <strong>${num(k.W, st)}${E}</strong>`, "ausrechnen", false);
    } else if (typ === "G") {
      schritte.innerHTML =
        gaFormelzeile("1.", "<strong>G = W · 100 : p</strong>", "Formel", false) +
        gaFormelzeile("2.", `G = ${faktor(`${num(k.W, st)} · 100`)} : ${num(k.p)}`, "einsetzen", true) +
        gaFormelzeile("3.", `G = <strong>${num(k.G, st)}${E}</strong>`, "ausrechnen", false);
    } else {
      schritte.innerHTML =
        gaFormelzeile("1.", "<strong>p = W · 100 : G</strong>", "Formel", false) +
        gaFormelzeile("2.", `p = ${faktor(`${num(k.W, st)} · 100`)} : ${num(k.G, st)}`, "einsetzen", true) +
        gaFormelzeile("3.", `p = <strong>${num(k.p)} %</strong>`, "ausrechnen", false);
    }
  }

  document.getElementById("ga-bilanz").innerHTML =
    `<span class="wg">G = ${num(k.G, st)}${E}</span> &nbsp;·&nbsp; ` +
    `<span class="wp">p = ${num(k.p)} %</span> &nbsp;·&nbsp; ` +
    `<span class="ww">W = ${num(k.W, st)}${E}</span><br>` +
    `Die Probe ist immer dieselbe Gleichung: ` +
    `<span class="ww">${num(k.W, st)}</span> : <span class="wg">${num(k.G, st)}</span> = ` +
    `${wert(k.W / k.G, 4)} = <span class="wp">${num(k.p)}</span> : 100. ` +
    (gaWeg === "dreisatz"
      ? "Der Dreisatz geht immer über den Wert für <strong>1 %</strong> (bzw. für eine Einheit)."
      : "Die Formel fasst genau die beiden Dreisatzschritte in einer Zeile zusammen.");
}

function initGrundaufgaben() {
  document.getElementById("ga-typ").addEventListener("change", renderGrundaufgaben);
  document.getElementById("ga-nr").addEventListener("input", renderGrundaufgaben);
  renderGrundaufgaben();
}

// ================= 3. Veränderungen: der Wachstumsfaktor =================

function vvBild(G, p, auf) {
  const B = 470, H = 210;
  const svg = neueFlaeche(B, H);
  const delta = (G * p) / 100;
  const Gneu = auf ? G + delta : G - delta;
  const maxWert = Math.max(G, Gneu);
  // Die Balken enden vor dem rechten Rand: Beide Werte stehen rechts daneben
  // in einer gemeinsamen Spalte, sonst läge die Beschriftung des neuen Werts
  // auf dem farbigen Veränderungsblock.
  const x0 = 26, breite = 356, hoehe = 40, xWert = 26 + 356 + 10;
  const bx = (v) => (v / maxWert) * breite;

  const y1 = 48, y2 = 130;
  svg.appendChild(svgText(x0, y1 - 10, "vorher: G = 100 %", { class: "pz-skalenname", "text-anchor": "start" }));
  svg.appendChild(svgEl("rect", { x: x0, y: y1, width: bx(G).toFixed(2), height: hoehe, class: "pz-streifen-g" }));
  svg.appendChild(svgEl("rect", { x: x0, y: y1, width: bx(G).toFixed(2), height: hoehe, class: "pz-streifen-rahmen" }));
  svg.appendChild(svgText(xWert, y1 + 26, num(G, 2) + " €", { class: "pz-streifentext g", "text-anchor": "start" }));

  svg.appendChild(svgText(x0, y2 - 10, `nachher: ${num(auf ? 100 + p : 100 - p)} %`, { class: "pz-skalenname", "text-anchor": "start" }));
  if (auf) {
    // Der Zuwachs wird hinten angesetzt — sichtbar als eigener violetter Block.
    svg.appendChild(svgEl("rect", { x: x0, y: y2, width: bx(G).toFixed(2), height: hoehe, class: "pz-streifen-g" }));
    svg.appendChild(svgEl("rect", { x: (x0 + bx(G)).toFixed(2), y: y2, width: bx(delta).toFixed(2), height: hoehe, class: "pz-streifen-zuwachs" }));
  } else {
    // Bei der Abnahme bleibt der Umriss des alten Werts stehen, damit man
    // sieht, was weggefallen ist.
    svg.appendChild(svgEl("rect", { x: x0, y: y2, width: bx(Gneu).toFixed(2), height: hoehe, class: "pz-streifen-g" }));
    svg.appendChild(svgEl("rect", { x: (x0 + bx(Gneu)).toFixed(2), y: y2, width: bx(delta).toFixed(2), height: hoehe, class: "pz-streifen-abzug" }));
  }
  svg.appendChild(svgEl("rect", { x: x0, y: y2, width: bx(Gneu).toFixed(2), height: hoehe, class: "pz-streifen-rahmen" }));
  svg.appendChild(svgText(xWert, y2 + 26, num(Gneu, 2) + " €", { class: "pz-streifentext g", "text-anchor": "start" }));

  // Beschriftung des Veränderungsblocks
  const dMitte = auf ? x0 + bx(G) + bx(delta) / 2 : x0 + bx(Gneu) + bx(delta) / 2;
  svg.appendChild(svgText(dMitte, y2 + hoehe + 18, (auf ? "+ " : "− ") + num(delta, 2) + " €", {
    class: "pz-streifentext " + (auf ? "z" : "p"), "text-anchor": "middle",
  }));

  // Pfeil mit dem Wachstumsfaktor
  const q = auf ? (100 + p) / 100 : (100 - p) / 100;
  const ax = x0 + 40;
  svg.appendChild(svgEl("line", { x1: ax, y1: y1 + hoehe + 6, x2: ax, y2: y2 - 26, class: "pz-pfeil" }));
  svg.appendChild(svgEl("path", { d: `M ${ax} ${y2 - 22} l -5 -8 l 10 0 Z`, class: "pz-pfeilkopf" }));
  svg.appendChild(svgText(ax + 10, y2 - 30, "· " + num(q, 4), { class: "pz-faktortext" + (auf ? "" : " ab"), "text-anchor": "start" }));

  svg.appendChild(svgText(B / 2, H - 6, "Der Wachstumsfaktor q führt hin, die Division durch q zurück.", { class: "pz-skalentext" }));
  return svg;
}

function renderVeraenderung() {
  const G = begrenzt("vv-g", Number(document.getElementById("vv-g").value), 20, 400);
  const p = begrenzt("vv-p", Number(document.getElementById("vv-p").value), 5, 60);
  const auf = document.getElementById("vv-richtung").value === "auf";
  const delta = (G * p) / 100;
  const Gneu = auf ? G + delta : G - delta;
  const q = auf ? (100 + p) / 100 : (100 - p) / 100;

  document.getElementById("vv-g-anzeige").textContent = euro(G);
  document.getElementById("vv-p-anzeige").textContent = (auf ? "+ " : "− ") + num(p) + " %";

  const mount = document.getElementById("vv-mount");
  mount.innerHTML = "";
  mount.appendChild(vvBild(G, p, auf));

  const karten = document.getElementById("vv-karten");
  karten.innerHTML = "";
  karten.appendChild(karte("g", "Ausgangswert G", euro(G)));
  karten.appendChild(karte("f", "Wachstumsfaktor q", num(q, 4)));
  karten.appendChild(karte(auf ? "z" : "p", auf ? "Zunahme" : "Abnahme", (auf ? "+ " : "− ") + num(delta, 2) + " €"));
  karten.appendChild(karte("w", "neuer Wert", euro(Gneu)));

  document.getElementById("vv-bilanz").innerHTML =
    `<strong>Hinweg:</strong> <span class="wg">${num(G, 2)} €</span> · ` +
    `<span class="wf">${num(q, 4)}</span> = <strong>${num(Gneu, 2)} €</strong> &nbsp; ` +
    `(denn ${num(auf ? 100 + p : 100 - p)} % : 100 = ${num(q, 4)})<br>` +
    `<strong>Rückweg:</strong> <span class="ww">${num(Gneu, 2)} €</span> : ` +
    `<span class="wf">${num(q, 4)}</span> = <strong>${num(G, 2)} €</strong> — ` +
    `so kommt man vom ${auf ? "vermehrten" : "verminderten"} Grundwert auf den Grundwert zurück.<br>` +
    `<strong>Zum Vergleich:</strong> Die Veränderung selbst beträgt ` +
    `${faktor(`${num(G, 2)} € · ${num(p)}`)} : 100 = <span class="wp">${num(delta, 2)} €</span>. ` +
    `Beide Wege führen zum selben Ergebnis; der Faktor spart nur den Zwischenschritt.`;

  document.getElementById("vv-text").textContent = auf
    ? `Nach der Erhöhung sind es ${num(100 + p)} % des alten Werts. Wichtig: Der Rückweg ist eine Division durch ${num(q, 4)} — nicht ein Abzug von ${num(p)} %.`
    : `Nach der Senkung sind es ${num(100 - p)} % des alten Werts. Wichtig: Der Rückweg ist eine Division durch ${num(q, 4)} — nicht ein Aufschlag von ${num(p)} %.`;
}

function initVeraenderung() {
  ["vv-g", "vv-p"].forEach((id) => document.getElementById(id).addEventListener("input", renderVeraenderung));
  document.getElementById("vv-richtung").addEventListener("change", renderVeraenderung);
  renderVeraenderung();
}

// ================= 4. Zinsrechnung =================

// Zwölf Säulen für die zwölf Monate: Sie machen sichtbar, dass die Zinsen
// gleichmäßig anwachsen und der Faktor m : 12 nichts anderes ist als
// "so viele Zwölftel des Jahreszinses".
function ziBild(K, pZehntel, m) {
  const B = 470, H = 250;
  const svg = neueFlaeche(B, H);
  const links = 58, unten = 196, breite = 372, hoehe = 156;
  const zJahr = (K * pZehntel) / 1000;
  const zMonat = zJahr / 12;
  const yMax = Math.max(zJahr, 1e-6);
  const py = (z) => unten - (z / yMax) * hoehe;

  const schritt = schrittWeite(zJahr, 4);
  for (let z = 0; z <= zJahr + 1e-9; z += schritt) {
    svg.appendChild(svgEl("line", { x1: links, y1: py(z).toFixed(2), x2: (links + breite).toFixed(2), y2: py(z).toFixed(2), class: "pz-gitter" }));
    svg.appendChild(svgText(links - 8, py(z) + 4, num(z, 2), { class: "pz-skalentext", "text-anchor": "end" }));
  }

  const bw = breite / 12;
  for (let j = 1; j <= 12; j++) {
    const z = zMonat * j;
    const x = links + (j - 1) * bw + bw * 0.16;
    const w = bw * 0.68;
    svg.appendChild(svgEl("rect", {
      x: x.toFixed(2), y: py(z).toFixed(2), width: w.toFixed(2), height: (unten - py(z)).toFixed(2),
      class: j <= m ? "pz-saeule-z" : "pz-saeule-einfach",
    }));
    svg.appendChild(svgText(x + w / 2, unten + 15, String(j), { class: "pz-skalentext" }));
  }

  svg.appendChild(svgEl("line", { x1: links, y1: unten, x2: (links + breite + 10).toFixed(2), y2: unten, class: "pz-achse" }));
  svg.appendChild(svgEl("line", { x1: links, y1: unten, x2: links, y2: (unten - hoehe - 12).toFixed(2), class: "pz-achse" }));
  svg.appendChild(svgText(B / 2, 20, `Aufgelaufene Zinsen bei K = ${num(K)} € und p = ${num(pZehntel / 10, 1)} %`, { class: "pz-skalenname" }));
  // Der Achsenname steht gedreht an der Achse — waagerecht liefe er in die
  // Überschrift hinein.
  svg.appendChild(svgText(0, 0, "Zinsen in €", {
    class: "pz-skalenname", transform: `translate(16 ${(unten - hoehe / 2).toFixed(2)}) rotate(-90)`,
  }));
  svg.appendChild(svgText(links + breite + 10, unten + 30, "Monat", { class: "pz-skalenname", "text-anchor": "end" }));

  // Der gewählte Monat wird markiert, damit Regler und Bild zusammenfinden.
  const zJetzt = zMonat * m;
  const xm = links + (m - 1) * bw + bw * 0.5;
  svg.appendChild(svgEl("line", { x1: links, y1: py(zJetzt).toFixed(2), x2: xm.toFixed(2), y2: py(zJetzt).toFixed(2), class: "pz-hilfslinie" }));
  const anker = m <= 8 ? "start" : "end";
  svg.appendChild(svgText(xm + (m <= 8 ? 8 : -8), py(zJetzt) - 8, `Z = ${num(zJetzt, 2)} €`, { class: "pz-streifentext z", "text-anchor": anker }));

  svg.appendChild(svgText(B / 2, H - 6, "Gefüllt: die bereits verstrichenen Monate. Gestrichelt: der Rest des Jahres.", { class: "pz-skalentext" }));
  return svg;
}

function renderZinsen() {
  const K = begrenzt("zi-k", Number(document.getElementById("zi-k").value), 500, 10000);
  const pZehntel = begrenzt("zi-p", Number(document.getElementById("zi-p").value), 5, 80);
  const m = begrenzt("zi-m", Number(document.getElementById("zi-m").value), 1, 12);
  const p = pZehntel / 10;
  const zJahr = (K * pZehntel) / 1000;
  const Z = (zJahr * m) / 12;

  document.getElementById("zi-k-anzeige").textContent = euro(K);
  document.getElementById("zi-p-anzeige").textContent = num(p, 1) + " %";
  document.getElementById("zi-m-anzeige").textContent = m === 12 ? "1 Jahr" : m === 1 ? "1 Monat" : num(m) + " Monate";

  const mount = document.getElementById("zi-mount");
  mount.innerHTML = "";
  mount.appendChild(ziBild(K, pZehntel, m));

  const karten = document.getElementById("zi-karten");
  karten.innerHTML = "";
  karten.appendChild(karte("g", "Kapital K", euro(K)));
  karten.appendChild(karte("p", "Zinssatz p", num(p, 1) + " %"));
  karten.appendChild(karte("z", "Zinsen Z", euro(Z)));
  karten.appendChild(karte("w", "Kapital + Zinsen", euro(K + Z)));

  const tage = m * 30;
  document.getElementById("zi-bilanz").innerHTML =
    `<strong>Jahreszins:</strong> <span class="wg">${num(K)} €</span> · ` +
    `<span class="wp">${num(p, 1)}</span> : 100 = <span class="wz">${num(zJahr, 2)} €</span><br>` +
    (m === 12
      ? `Die Laufzeit beträgt ein volles Jahr, deshalb ist <span class="wz">Z = ${num(Z, 2)} €</span>.`
      : `<strong>Für ${num(m)} Monate:</strong> <span class="wz">${num(zJahr, 2)} €</span> · ` +
        `${faktor(`${num(m)} : 12`)} = <strong>${num(Z, 2)} €</strong><br>` +
        `<strong>Über die Tage gerechnet:</strong> ${num(m)} Monate ≙ ${num(tage)} Tage, also ` +
        `<span class="wz">${num(zJahr, 2)} €</span> · ${faktor(`${num(tage)} : 360`)} = <strong>${num(Z, 2)} €</strong> — dasselbe Ergebnis.`);

  document.getElementById("zi-text").textContent =
    m === 12
      ? "Ziehe den Laufzeitregler zurück: Die Zinsen sinken genau proportional zur Anzahl der Monate."
      : `Nach ${num(m)} von 12 Monaten sind erst ${num((m / 12) * 100, 1)} % des Jahreszinses aufgelaufen. Die Zinsen wachsen gleichmäßig — deshalb liegen die Säulenspitzen auf einer Geraden.`;
}

function initZinsen() {
  ["zi-k", "zi-p", "zi-m"].forEach((id) => document.getElementById(id).addEventListener("input", renderZinsen));
  renderZinsen();
}

// ================= 5. Zinseszins =================

function zeBild(K0, p, n) {
  const B = 470, H = 280;
  const svg = neueFlaeche(B, H);
  const links = 62, unten = 222, breite = 372, hoehe = 182;
  const q = (100 + p) / 100;
  const zinsMitJahr = (j) => K0 * Math.pow(q, j);
  const zinsOhneJahr = (j) => K0 * (1 + (j * p) / 100);
  const yMax = zinsMitJahr(n) * 1.06;
  const py = (v) => unten - (v / yMax) * hoehe;

  const schritt = schrittWeite(yMax, 4);
  for (let v = 0; v <= yMax + 1e-9; v += schritt) {
    svg.appendChild(svgEl("line", { x1: links, y1: py(v).toFixed(2), x2: (links + breite).toFixed(2), y2: py(v).toFixed(2), class: "pz-gitter" }));
    svg.appendChild(svgText(links - 8, py(v) + 4, num(v, 0), { class: "pz-skalentext", "text-anchor": "end" }));
  }

  const bw = breite / (n + 1);
  // Beschriftungsdichte an die Säulenbreite anpassen — bei 20 Jahren passt
  // nicht jede Jahreszahl unter die Achse.
  const jSchritt = bw >= 22 ? 1 : bw >= 13 ? 2 : 5;
  for (let j = 0; j <= n; j++) {
    const mit = zinsMitJahr(j);
    const x = links + j * bw + bw * 0.14;
    const w = bw * 0.72;
    svg.appendChild(svgEl("rect", { x: x.toFixed(2), y: py(mit).toFixed(2), width: w.toFixed(2), height: (py(K0) - py(mit)).toFixed(2), class: "pz-saeule-z" }));
    svg.appendChild(svgEl("rect", { x: x.toFixed(2), y: py(K0).toFixed(2), width: w.toFixed(2), height: (unten - py(K0)).toFixed(2), class: "pz-saeule-k" }));
    if (j % jSchritt === 0 || j === n) svg.appendChild(svgText(x + w / 2, unten + 15, String(j), { class: "pz-skalentext" }));
  }

  // Der einfache Zins als gestrichelte Gerade darüber: Der Abstand zwischen
  // Linie und Säulenspitze ist genau der Zinseszinseffekt.
  let d = "";
  for (let j = 0; j <= n; j++) {
    d += (j === 0 ? "M " : " L ") + (links + j * bw + bw * 0.5).toFixed(2) + " " + py(zinsOhneJahr(j)).toFixed(2);
  }
  svg.appendChild(svgEl("path", { d, class: "pz-kurve einfach" }));

  svg.appendChild(svgEl("line", { x1: links, y1: unten, x2: (links + breite + 10).toFixed(2), y2: unten, class: "pz-achse" }));
  svg.appendChild(svgEl("line", { x1: links, y1: unten, x2: links, y2: (unten - hoehe - 12).toFixed(2), class: "pz-achse" }));
  svg.appendChild(svgText(B / 2, 20, `Kapitalentwicklung bei ${num(p)} % Zinsen`, { class: "pz-skalenname" }));
  svg.appendChild(svgText(0, 0, "Kapital in €", {
    class: "pz-skalenname", transform: `translate(16 ${(unten - hoehe / 2).toFixed(2)}) rotate(-90)`,
  }));
  svg.appendChild(svgText(links + breite + 10, unten + 30, "Jahr", { class: "pz-skalenname", "text-anchor": "end" }));
  svg.appendChild(svgText(B / 2, H - 6, "Blau das Startkapital, violett die Zinsen. Die gestrichelte Linie zeigt, wie es ohne Zinseszins liefe.", { class: "pz-skalentext" }));
  return svg;
}

function renderZinseszins() {
  const K0 = begrenzt("ze-k", Number(document.getElementById("ze-k").value), 500, 5000);
  const p = begrenzt("ze-p", Number(document.getElementById("ze-p").value), 1, 15);
  const n = begrenzt("ze-n", Number(document.getElementById("ze-n").value), 1, 20);
  const q = (100 + p) / 100;
  const Kn = K0 * Math.pow(q, n);
  const ohne = K0 * (1 + (n * p) / 100);

  document.getElementById("ze-k-anzeige").textContent = euro(K0);
  document.getElementById("ze-p-anzeige").textContent = num(p) + " %";
  document.getElementById("ze-n-anzeige").textContent = n === 1 ? "1 Jahr" : num(n) + " Jahre";

  const mount = document.getElementById("ze-mount");
  mount.innerHTML = "";
  mount.appendChild(zeBild(K0, p, n));

  const karten = document.getElementById("ze-karten");
  karten.innerHTML = "";
  karten.appendChild(karte("g", "Startkapital K₀", euro(K0)));
  karten.appendChild(karte("f", "Faktor q\u207F", wert(Math.pow(q, n), 4)));
  karten.appendChild(karte("z", "Endkapital Kₙ", euro(Kn)));
  karten.appendChild(karte("p", "Vorsprung vor dem einfachen Zins", euro(Kn - ohne)));

  const qHochN = Math.pow(q, n);
  document.getElementById("ze-bilanz").innerHTML =
    `<strong>Faktor:</strong> q = ${num(q, 2)}, also q<sup>${num(n)}</sup> = ` +
    `<span class="wf">${num(q, 2)}</span><sup>${num(n)}</sup> ${zeichen(qHochN, 4)} ${num(qHochN, 4)}<br>` +
    `<strong>Mit Zinseszins:</strong> <span class="wg">${num(K0)} €</span> · ` +
    `<span class="wf">${num(qHochN, 4)}</span> ${zeichen(Kn, 2)} <strong>${num(Kn, 2)} €</strong><br>` +
    `<strong>Ohne Zinseszins:</strong> <span class="wg">${num(K0)} €</span> · ` +
    `${faktor(`(1 + ${num(n)} · ${num(p)} : 100)`)} = ${num(ohne, 2)} €<br>` +
    `<strong>Unterschied:</strong> <span class="wz">${euro(Kn - ohne)}</span> — ` +
    `das sind die Zinsen, die die Zinsen selbst erwirtschaftet haben. ` +
    `Insgesamt ist das Kapital um ${proz((qHochN - 1) * 100, 1)} gewachsen, nicht um ${num(n * p)} %.`;

  document.getElementById("ze-text").textContent =
    n === 1
      ? "Nach einem Jahr sind beide Rechnungen noch gleich — der Unterschied entsteht erst ab dem zweiten Jahr."
      : `Nach ${num(n)} Jahren liegt der Zinseszins um ${euro(Kn - ohne)} vorn. Der Abstand zwischen Säulenspitze und gestrichelter Linie wächst mit jedem Jahr.`;
}

function initZinseszins() {
  ["ze-k", "ze-p", "ze-n"].forEach((id) => document.getElementById(id).addEventListener("input", renderZinseszins));
  renderZinseszins();
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
  const gewaehlt = sauber.length ? pick(sauber) : notfall;
  if (gewaehlt === undefined) throw new Error("Aufgabengenerator ohne gültige Kandidaten");
  return gewaehlt;
}

// Aufgabe 1 — Prozentwert gesucht. Die Sachtexte werden als ganze Sätze
// geführt, damit keine Bausteine wie "eine Einwohner" entstehen.
const A1_KONTEXTE = [
  {
    satz: (G, p) => `In einem Ort leben <strong>${num(G)}</strong> Menschen. <strong>${num(p)} %</strong> von ihnen sind jünger als 18 Jahre.`,
    frage: "Wie viele Menschen sind das?",
    einheit: "Menschen", platzhalter: "Anzahl",
  },
  {
    satz: (G, p) => `Ein Stadion hat <strong>${num(G)}</strong> Sitzplätze. Beim Spiel am Samstag sind <strong>${num(p)} %</strong> davon besetzt.`,
    frage: "Wie viele Plätze sind besetzt?",
    einheit: "Plätze", platzhalter: "Anzahl",
  },
  {
    satz: (G, p) => `Eine Bibliothek besitzt <strong>${num(G)}</strong> Bücher. <strong>${num(p)} %</strong> davon sind Sachbücher.`,
    frage: "Wie viele Sachbücher sind das?",
    einheit: "Bücher", platzhalter: "Anzahl",
  },
  {
    satz: (G, p) => `Ein Betrieb stellt an einem Tag <strong>${num(G)}</strong> Bauteile her. <strong>${num(p)} %</strong> davon werden ins Ausland geliefert.`,
    frage: "Wie viele Bauteile gehen ins Ausland?",
    einheit: "Bauteile", platzhalter: "Anzahl",
  },
];
function generateAufgabe1() {
  // G als Vielfaches von 100 hält W = (G : 100) · p ohne Rundung ganzzahlig.
  const kandidaten = [];
  for (let g = 2; g <= 40; g++) {
    for (const p of [4, 5, 8, 12, 15, 16, 20, 24, 25, 30, 35, 40, 45, 60, 65, 75, 80]) {
      kandidaten.push({ G: g * 100, p });
    }
  }
  const c = ohneKollision(
    kandidaten,
    (k) => [
      (k.G * k.p) / 100,          // richtig
      k.G - (k.G * k.p) / 100,    // Rest statt Anteil
      (k.G * 100) / k.p,          // Grundwertformel verwechselt
      k.G / k.p,                  // durch p statt durch 100 geteilt
      (k.p * 100) / k.G,          // Prozentsatzformel verwechselt
      k.p, k.G,
    ],
    kandidaten[0]
  );
  const { G, p } = c;
  const W = (G * p) / 100;
  const kontext = pick(A1_KONTEXTE);

  return {
    promptHtml: `${kontext.satz(G, p)}<br><strong>${kontext.frage}</strong>`,
    correct: W,
    tolerance: 0.01,
    placeholder: kontext.platzhalter,
    hinweis: (raw, val) => {
      if (Math.abs(val - (G - W)) < 0.01)
        return `${num(G - W)} ist der <em>Rest</em> — also die übrigen ${num(100 - p)} %. Gefragt sind die ${num(p)} % selbst.`;
      if (Math.abs(val - G / p) < 0.01)
        return `Du hast durch ${num(p)} geteilt statt durch 100. Für „1 %“ teilt man den Grundwert immer durch <strong>100</strong>.`;
      if (Math.abs(val - (G * 100) / p) < 0.01)
        return `Das ist die Formel für den <em>Grundwert</em>. Hier ist G bereits bekannt; gesucht ist der Prozentwert W = G · p : 100.`;
      return `Rechne zuerst aus, wie viel 1 % sind: ${num(G)} : 100 = ${num(G / 100, 2)}. Das Ergebnis dann mit ${num(p)} multiplizieren.`;
    },
    musterloesungHtml:
      `<strong>Gegeben:</strong> G = ${num(G)} ${kontext.einheit}, p = ${num(p)} % — gesucht ist W.<br>` +
      `<strong>1 %:</strong> ${num(G)} : 100 = ${num(G / 100, 2)}<br>` +
      `<strong>${num(p)} %:</strong> ${faktor(`${num(G / 100, 2)} · ${num(p)}`)} = <strong>${num(W)}</strong> ${kontext.einheit}<br>` +
      `<em>Mit der Formel:</em> W = G · p : 100 = ${faktor(`${num(G)} · ${num(p)}`)} : 100 = ${num(W)}.<br>` +
      `<em>Probe:</em> ${num(W)} : ${num(G)} = ${wert(W / G, 4)} = ${num(p)} : 100 ✓`,
  };
}

// Aufgabe 2 — Prozentsatz gesucht.
const A2_KONTEXTE = [
  {
    satz: (G, W) => `Von <strong>${num(G)}</strong> Sitzplätzen eines Kinosaals sind <strong>${num(W)}</strong> besetzt.`,
    frage: "Wie viel Prozent der Plätze sind besetzt?",
  },
  {
    satz: (G, W) => `Eine Klassenarbeit umfasst <strong>${num(G)}</strong> Punkte. Jona erreicht davon <strong>${num(W)}</strong> Punkte.`,
    frage: "Wie viel Prozent der Punkte hat Jona erreicht?",
  },
  {
    satz: (G, W) => `Ein Verein hat <strong>${num(G)}</strong> Mitglieder, davon sind <strong>${num(W)}</strong> jünger als 14 Jahre.`,
    frage: "Wie viel Prozent der Mitglieder sind jünger als 14 Jahre?",
  },
  {
    satz: (G, W) => `Von <strong>${num(G)}</strong> hergestellten Bauteilen sind <strong>${num(W)}</strong> fehlerfrei.`,
    frage: "Wie viel Prozent der Bauteile sind fehlerfrei?",
  },
];
function generateAufgabe2() {
  const kandidaten = [];
  for (const G of [40, 50, 60, 80, 120, 150, 160, 200, 240, 250, 300, 400, 500, 600, 800]) {
    for (const p of [4, 5, 8, 12, 15, 20, 24, 25, 30, 35, 40, 45, 55, 60, 64, 65, 72, 75, 80, 85, 90]) {
      const W = (G * p) / 100;
      if (!Number.isInteger(W) || W === 0) continue;
      kandidaten.push({ G, p, W });
    }
  }
  const c = ohneKollision(
    kandidaten,
    (k) => [
      k.p,                        // richtig
      100 - k.p,                  // Gegenanteil
      (k.G * 100) / k.W,          // Bruch verkehrt herum
      k.W / k.G,                  // "· 100" vergessen
      k.G - k.W,                  // Differenz statt Anteil
      k.W, k.G,
    ],
    kandidaten[0]
  );
  const { G, p, W } = c;
  const kontext = pick(A2_KONTEXTE);

  return {
    promptHtml: `${kontext.satz(G, W)}<br><strong>${kontext.frage}</strong> Antwort ohne Prozentzeichen.`,
    correct: p,
    tolerance: 0.01,
    placeholder: "Prozentsatz",
    hinweis: (raw, val) => {
      if (Math.abs(val - (100 - p)) < 0.01)
        return `${num(100 - p)} % ist der <em>Gegenanteil</em> — der Teil, nach dem <strong>nicht</strong> gefragt ist. Beide zusammen ergeben 100 %.`;
      if (Math.abs(val - (G * 100) / W) < 0.01)
        return `Du hast den Bruch verkehrt herum gebildet. Geteilt wird durch den <strong>Grundwert</strong> ${num(G)}, nicht durch den Prozentwert ${num(W)}.`;
      if (Math.abs(val - W / G) < 0.01)
        return `${wert(W / G, 4)} ist der Anteil als Dezimalzahl. Für Prozente fehlt noch die Multiplikation mit 100.`;
      if (Math.abs(val - (G - W)) < 0.01)
        return `${num(G - W)} ist die <em>Differenz</em> der beiden Zahlen, keine Prozentangabe. Der Prozentsatz entsteht durch Division, nicht durch Subtraktion.`;
      return `Bilde zuerst den Anteil W : G = ${num(W)} : ${num(G)} und multipliziere ihn dann mit 100.`;
    },
    musterloesungHtml:
      `<strong>Gegeben:</strong> G = ${num(G)}, W = ${num(W)} — gesucht ist p.<br>` +
      `<strong>Anteil:</strong> ${num(W)} : ${num(G)} = ${wert(W / G, 4)}<br>` +
      `<strong>In Prozent:</strong> ${faktor(`${wert(W / G, 4)} · 100`)} = <strong>${num(p)} %</strong><br>` +
      `<em>Mit der Formel:</em> p = W · 100 : G = ${faktor(`${num(W)} · 100`)} : ${num(G)} = ${num(p)}.<br>` +
      `<em>Probe:</em> ${num(G)} · ${num(p)} : 100 = ${num(W)} ✓ &nbsp; Die übrigen ${num(100 - p)} % entsprechen ${num(G - W)}.`,
  };
}

// Aufgabe 3 — Zinsen für eine Laufzeit unter einem Jahr.
const A3_KONTEXTE = [
  { satz: "legt", wer: "Frau Berger", ziel: "auf ein Sparkonto" },
  { satz: "legt", wer: "Herr Demir", ziel: "als Festgeld" },
  { satz: "legt", wer: "ein Sportverein", ziel: "auf ein Vereinskonto" },
  { satz: "legt", wer: "eine Erbengemeinschaft", ziel: "auf ein Treuhandkonto" },
];
function generateAufgabe3() {
  // Der Zinssatz wird in Zehntelprozent geführt (25 ≙ 2,5 %), damit die
  // Kandidatenprüfung mit ganzen Zahlen arbeiten kann.
  const kandidaten = [];
  for (const K of [600, 800, 1200, 1500, 1800, 2400, 3000, 3600, 4000, 4500, 5000, 6000, 7200, 8000, 9000]) {
    for (const pz of [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 60]) {
      for (const m of [2, 3, 4, 5, 6, 8, 9, 10]) {
        const Z = (K * pz * m) / 12000;
        if (!Number.isInteger(Z) || Z < 5) continue;
        kandidaten.push({ K, pz, m, Z });
      }
    }
  }
  const c = ohneKollision(
    kandidaten,
    (k) => [
      k.Z,                        // richtig
      (k.K * k.pz) / 1000,        // Laufzeit vergessen (Jahreszins)
      (k.K * k.pz * k.m) / 1000,  // ": 12" vergessen
      (k.K * k.m) / 100,          // Zinssatz mit Monatszahl verwechselt
      k.K, k.m, k.pz / 10,
    ],
    kandidaten[0]
  );
  const { K, pz, m, Z } = c;
  const p = pz / 10;
  const zJahr = (K * pz) / 1000;
  const kontext = pick(A3_KONTEXTE);

  return {
    promptHtml:
      `${kontext.wer.charAt(0).toUpperCase() + kontext.wer.slice(1)} ${kontext.satz} <strong>${num(K)} €</strong> ` +
      `${kontext.ziel}. Der Zinssatz beträgt <strong>${num(p, 1)} %</strong> pro Jahr, das Geld liegt <strong>${num(m)} Monate</strong> dort.<br>` +
      `<strong>Wie viel Zinsen kommen zusammen?</strong> Antwort in Euro.`,
    correct: Z,
    tolerance: 0.01,
    placeholder: "Zinsen in €",
    hinweis: (raw, val) => {
      if (Math.abs(val - zJahr) < 0.01)
        return `${num(zJahr, 2)} € wären die Zinsen für ein <em>ganzes</em> Jahr. Das Geld liegt aber nur ${num(m)} von 12 Monaten dort — es fehlt der Faktor ${faktor(`${num(m)} : 12`)}.`;
      if (Math.abs(val - (K * pz * m) / 1000) < 0.01)
        return `Du hast mit ${num(m)} multipliziert, aber nicht durch 12 geteilt. ${num(m)} Monate sind ${faktor(`${num(m)} : 12`)} eines Jahres, nicht ${num(m)} Jahre.`;
      if (Math.abs(val - (K * m) / 100) < 0.01)
        return `Hier ist die Anzahl der Monate an die Stelle des Zinssatzes geraten. Der Zinssatz ist ${num(p, 1)} %, die ${num(m)} Monate wirken nur über den Faktor ${faktor(`${num(m)} : 12`)}.`;
      return `Rechne in zwei Schritten: erst den Jahreszins ${faktor(`${num(K)} € · ${num(p, 1)}`)} : 100, dann davon ${faktor(`${num(m)} : 12`)}.`;
    },
    musterloesungHtml:
      `<strong>Gegeben:</strong> K = ${num(K)} €, p = ${num(p, 1)} %, Laufzeit ${num(m)} Monate.<br>` +
      `<strong>1. Jahreszins:</strong> Z<sub>Jahr</sub> = ${faktor(`${num(K)} € · ${num(p, 1)}`)} : 100 = ${num(zJahr, 2)} €<br>` +
      `<strong>2. Zeitanteil:</strong> ${num(m)} Monate von 12, also ${faktor(`${num(m)} : 12`)} = ${wert(m / 12, 4)}<br>` +
      `<strong>3. Zinsen:</strong> ${faktor(`${num(zJahr, 2)} € · ${num(m)}`)} : 12 = <strong>${num(Z, 2)} €</strong><br>` +
      `<em>Über die Tage gerechnet:</em> ${num(m)} Monate ≙ ${num(m * 30)} Tage, also ` +
      `${faktor(`${num(zJahr, 2)} € · ${num(m * 30)}`)} : 360 = ${num(Z, 2)} € — dasselbe Ergebnis.<br>` +
      `<em>In einer Zeile:</em> Z = K · p : 100 · m : 12 = ${faktor(`${num(K)} · ${num(p, 1)}`)} : 100 · ${faktor(`${num(m)} : 12`)} = ${num(Z, 2)} €.`,
  };
}

// Aufgabe 4 — zwei prozentuale Veränderungen hintereinander, rückwärts gerechnet.
// Alle Prozentsätze sind Vielfache von 10; dadurch ist der Gesamtfaktor exakt
// eine Hundertstelzahl und der gesuchte Anfangswert bleibt ganzzahlig.
const A4_KONTEXTE = [
  { ding: "ein Fernseher", dingKurz: "Der Fernseher", rauf: "wird zur Fußball-EM teurer", runter: "wird im Abverkauf billiger" },
  { ding: "ein Fahrrad", dingKurz: "Das Fahrrad", rauf: "wird im Frühjahr teurer", runter: "wird im Herbst billiger" },
  { ding: "ein Laptop", dingKurz: "Der Laptop", rauf: "wird zum Schuljahresbeginn teurer", runter: "wird im Winterschlussverkauf billiger" },
  { ding: "ein Zelt", dingKurz: "Das Zelt", rauf: "wird zu Saisonbeginn teurer", runter: "wird zum Saisonende billiger" },
];
function generateAufgabe4() {
  const kandidaten = [];
  for (const p1 of [10, 20, 30, 40, 50]) {
    for (const p2 of [10, 20, 30, 40, 50]) {
      for (const A of [200, 300, 400, 500, 600, 800, 1000, 1200, 1500, 2000, 2400, 3000]) {
        // Gesamtänderung in Prozent: bei Zehnerschritten stets eine ganze Zahl.
        const k = p1 - p2 - (p1 * p2) / 100;
        if (k === 0) continue;
        const E = (A * (100 + k)) / 100;
        if (!Number.isInteger(E)) continue;
        kandidaten.push({ p1, p2, A, k, E });
      }
    }
  }
  const c = ohneKollision(
    kandidaten,
    (k) => [
      k.A,                                    // richtig
      k.E,                                    // "der Preis hat sich nicht geändert"
      (k.E * 100) / (100 + k.p1 - k.p2),      // Prozente addiert statt Faktoren multipliziert
      (k.E * (100 - k.k)) / 100,              // Gesamtänderung vom Endpreis abgezogen statt dividiert
      (k.E * 100) / (100 + k.p1),             // nur die erste Änderung rückgängig gemacht
      (k.E * 100) / (100 - k.p2),             // nur die zweite Änderung rückgängig gemacht
    ],
    kandidaten[0]
  );
  const { p1, p2, A, k, E } = c;
  const kontext = pick(A4_KONTEXTE);
  const q1 = (100 + p1) / 100, q2 = (100 - p2) / 100;
  const qGes = (100 + k) / 100;

  return {
    promptHtml:
      `${kontext.ding.charAt(0).toUpperCase() + kontext.ding.slice(1)} ${kontext.rauf}: Der Preis steigt um <strong>${num(p1)} %</strong>. ` +
      `Später ${kontext.runter}: Der Preis sinkt um <strong>${num(p2)} %</strong> — gemessen am dann geltenden Preis.<br>` +
      `${kontext.dingKurz} kostet danach <strong>${num(E)} €</strong>.<br>` +
      `<strong>Wie hoch war der Preis vor beiden Änderungen?</strong> Antwort in Euro.`,
    correct: A,
    tolerance: 0.01,
    placeholder: "Preis in €",
    hinweis: (raw, val) => {
      if (Math.abs(val - (E * 100) / (100 + p1 - p2)) < 0.01)
        return `Du hast die Prozentsätze verrechnet: ${num(p1)} % − ${num(p2)} % = ${num(p1 - p2)} %. Prozentangaben darf man aber nicht addieren oder subtrahieren, weil sie sich auf <em>verschiedene</em> Grundwerte beziehen. Multipliziere stattdessen die Faktoren ${num(q1, 2)} und ${num(q2, 2)}.`;
      if (Math.abs(val - (E * (100 - k)) / 100) < 0.01)
        return `Du hast die Gesamtänderung von ${num(k)} % auf den <em>Endpreis</em> angewandt. Sie bezieht sich aber auf den <em>Anfangspreis</em>. Der Hinweg ist eine Multiplikation mit ${num(qGes, 4)}, der Rückweg deshalb eine <strong>Division</strong> durch ${num(qGes, 4)}.`;
      if (Math.abs(val - (E * 100) / (100 + p1)) < 0.01)
        return `Damit hast du nur die erste Änderung rückgängig gemacht. Beide Änderungen zusammen ergeben den Faktor ${faktor(`${num(q1, 2)} · ${num(q2, 2)}`)} = ${num(qGes, 4)}.`;
      if (Math.abs(val - (E * 100) / (100 - p2)) < 0.01)
        return `Damit hast du nur die zweite Änderung rückgängig gemacht. Beide Änderungen zusammen ergeben den Faktor ${faktor(`${num(q1, 2)} · ${num(q2, 2)}`)} = ${num(qGes, 4)}.`;
      if (Math.abs(val - E) < 0.01)
        return `${num(E)} € ist der Preis <em>nach</em> beiden Änderungen. Gesucht ist der Preis davor.`;
      return `Bestimme zuerst den Gesamtfaktor ${faktor(`${num(q1, 2)} · ${num(q2, 2)}`)} und teile dann ${num(E)} € durch ihn.`;
    },
    musterloesungHtml:
      `<strong>1. Faktoren aufstellen:</strong> Erhöhung um ${num(p1)} % → q₁ = ${num(q1, 2)}; ` +
      `Senkung um ${num(p2)} % → q₂ = ${num(q2, 2)}.<br>` +
      `<strong>2. Gesamtfaktor:</strong> q = ${faktor(`${num(q1, 2)} · ${num(q2, 2)}`)} = <strong>${num(qGes, 4)}</strong> — ` +
      `der Preis liegt am Ende bei ${num(100 + k)} % des Anfangspreises, also ${k > 0 ? "um " + num(k) + " % darüber" : "um " + num(-k) + " % darunter"}.<br>` +
      `<strong>3. Rückwärts rechnen:</strong> A = ${num(E)} € : ${num(qGes, 4)} = <strong>${num(A)} €</strong><br>` +
      `<em>Probe:</em> ${num(A)} € · ${num(q1, 2)} = ${num(A * q1, 2)} €, davon ${num(p2)} % weniger: ` +
      `${faktor(`${num(A * q1, 2)} € · ${num(q2, 2)}`)} = ${num(E)} € ✓<br>` +
      `<em>Merke:</em> Die Reihenfolge ist gleichgültig — ${faktor(`${num(q1, 2)} · ${num(q2, 2)}`)} = ${faktor(`${num(q2, 2)} · ${num(q1, 2)}`)}. ` +
      `Aber ${num(p1)} % rauf und ${num(p2)} % runter ergeben <strong>nicht</strong> ${num(p1 - p2)} %.`,
  };
}

function initExercises() {
  mountUebungsaufgaben(document.getElementById("exercises-mount"), [
    { schwierigkeit: "einfach", titel: "Aufgabe 1 — Prozentwert berechnen", generate: generateAufgabe1 },
    { schwierigkeit: "mittel", titel: "Aufgabe 2 — Prozentsatz bestimmen", generate: generateAufgabe2 },
    { schwierigkeit: "schwierig", titel: "Aufgabe 3 — Zinsen für Monate", generate: generateAufgabe3 },
    { schwierigkeit: "komplex", titel: "Aufgabe 4 — zwei Änderungen rückwärts", generate: generateAufgabe4 },
  ]);
}

// ================= Quizze =================

function initQuizzes() {
  mountQuiz(document.getElementById("quiz-grundbegriffe"), {
    q: "Ein Pullover kostet nach einer Preissenkung um 20 % nur noch 48 €. Welche Größe ist hier der <em>Grundwert</em> G?",
    options: [
      "die 48 €, denn das ist der Preis, den man zahlt",
      "die 20 %",
      "der Preis vor der Senkung",
      "die Ersparnis in Euro",
    ],
    correct: 2,
    explain: "Die 20 % beziehen sich auf den alten Preis — er ist deshalb der Grundwert und entspricht 100 %. Die 48 € sind der verminderte Grundwert, nämlich 80 % davon. Wer die 48 € als 100 % nimmt, rechnet die ganze Aufgabe falsch.",
  });
  mountQuiz(document.getElementById("quiz-grundaufgaben"), {
    q: "In einer Klassenarbeit sind 45 Punkte erreichbar. Mia erreicht 36 Punkte. Wie viel Prozent sind das?",
    options: ["80 %", "125 %", "9 %", "62,5 %"],
    correct: 0,
    explain: "Gesucht ist der Prozentsatz: p = W · 100 : G = 36 · 100 : 45 = 80 %. Die 125 % entstehen, wenn man den Bruch verkehrt herum bildet (45 : 36), die 9 sind die Differenz der beiden Zahlen — beides sind keine Anteile.",
  });
  mountQuiz(document.getElementById("quiz-veraenderung"), {
    q: "Ein Preis steigt um 20 % und wird danach um 20 % gesenkt. Wie steht er dann?",
    options: [
      "genau wie vorher, die Änderungen heben sich auf",
      "4 % unter dem alten Preis",
      "4 % über dem alten Preis",
      "20 % unter dem alten Preis",
    ],
    correct: 1,
    explain: "Man multipliziert die Faktoren: 1,2 · 0,8 = 0,96, also 96 % des alten Preises — 4 % weniger. Der Grund ist der Bezugspunkt: Die Senkung von 20 % bezieht sich auf den bereits erhöhten Preis und ist deshalb in Euro größer als die vorherige Erhöhung.",
  });
  mountQuiz(document.getElementById("quiz-zinsen"), {
    q: "2400 € werden zu 3 % pro Jahr angelegt und nach 5 Monaten abgehoben. Wie hoch sind die Zinsen?",
    options: ["30 €", "72 €", "360 €", "12 €"],
    correct: 0,
    explain: "Der Jahreszins beträgt 2400 € · 3 : 100 = 72 €. Davon sind 5 von 12 Monaten fällig: 72 € · 5 : 12 = 30 €. Die 72 € wären der volle Jahreszins, die 360 € entstünden, wenn man mit 5 multipliziert, aber nicht durch 12 teilt.",
  });
  mountQuiz(document.getElementById("quiz-zinseszins"), {
    q: "1000 € werden zwei Jahre lang zu 5 % mit Zinseszins angelegt. Wie hoch ist das Endkapital?",
    options: ["1102,50 €", "1100,00 €", "1050,00 €", "1010,25 €"],
    correct: 0,
    explain: "K₂ = 1000 € · 1,05² = 1000 € · 1,1025 = 1102,50 €. Die 1100 € kämen ohne Zinseszins heraus (2 · 50 €); die fehlenden 2,50 € sind genau die Zinsen, die die Zinsen des ersten Jahres erwirtschaftet haben.",
  });
}

// ================= Start =================

initGrundbegriffe();
initGrundaufgaben();
initVeraenderung();
initZinsen();
initZinseszins();
initExercises();
initQuizzes();
