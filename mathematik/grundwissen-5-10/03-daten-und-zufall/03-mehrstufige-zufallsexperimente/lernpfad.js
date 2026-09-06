// Selbstlernpfad "Mehrstufige Zufallsexperimente" (Grundwissen Klasse 5-10).
// Rein clientseitiges Vanilla-JS, ohne Build-Schritt oder externe Bibliotheken.
//
// Leitgedanke: Das Baumdiagramm ist kein Schmuck, sondern das Werkzeug, mit dem
// ein unübersichtliches Ω wieder handhabbar wird. Deshalb zeigt Abschnitt 1, wie
// schnell |Ω| wächst, Abschnitt 2 begründet die Produktregel über das
// Einheitsquadrat (Anteil vom Anteil), Abschnitt 3 macht sichtbar, warum der
// Umweg über das Gegenereignis bei "mindestens" so viel kürzer ist, und
// Abschnitt 4 zeigt an derselben Urne, dass sich beim Ziehen ohne Zurücklegen
// ausschließlich die zweite Stufe ändert.
//
// Durchgehende Farbcodierung: gewählter Pfad violett, Ereignis grün,
// Gegenereignis orange, "mit Zurücklegen" blau, "ohne Zurücklegen" rot.

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
// den Wert genau trifft — nicht, ob er ganzzahlig ist (0,125 ist exakt).
function zeichen(x, stellen = 2) {
  const f = Math.pow(10, stellen);
  return Math.abs(x - Math.round(x * f) / f) < 1e-12 ? "=" : "≈";
}
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function ggt(a, b) {
  return b ? ggt(b, a % b) : Math.abs(a);
}
// Bruch in gekürzter Form, oder null, wenn schon gekürzt bzw. Zähler 0
function gekuerzt(z, n) {
  if (z === 0) return null;
  const g = ggt(z, n);
  return g > 1 ? [z / g, n / g] : null;
}
// Wahrscheinlichkeit in der Schreibweise "3 : 10"
function quot(z, n) {
  return num(z) + " : " + num(n);
}
// Dieselbe Zahl als Faktor in einem Produkt: ohne Klammern wäre
// "1 : 2 · 1 : 2" nicht eindeutig lesbar.
function faktor(z, n) {
  return '<span class="nw">(' + quot(z, n) + ")</span>";
}
function parseFlexibleNumber(raw) {
  if (raw == null) return NaN;
  const s = String(raw).trim().replace(/\s/g, "").replace(/−/g, "-").replace(/\./g, "").replace(",", ".");
  return parseFloat(s);
}
function neueFlaeche(w, h) {
  return svgEl("svg", { viewBox: `0 0 ${w} ${h}`, width: w, height: h, class: "geo-svg", preserveAspectRatio: "xMidYMid meet" });
}
function begrenzt(id, wert, min, max) {
  const v = Math.min(max, Math.max(min, wert));
  const e = document.getElementById(id);
  if (Number(e.value) !== v) e.value = String(v);
  return v;
}

// ---------- Baumdiagramm: Aufbau, Layout, Zeichnung ----------

// zweige(pfad) liefert für den bisherigen Pfad die Äste der nächsten Stufe,
// jeweils { label, p, kurz? }. Weil die Funktion den bisherigen Pfad kennt,
// lassen sich damit auch Bäume mit ungleichen Stufen bauen (ohne Zurücklegen,
// Wetter/Bus) — genau derselbe Code für alle Abschnitte.
function baumErzeugen(stufen, zweige) {
  function bau(pfad) {
    const knoten = { pfad, kinder: [] };
    if (pfad.length < stufen) {
      zweige(pfad).forEach((z, i) => {
        const kind = bau(pfad.concat([z]));
        kind.ast = z;
        kind.astIndex = i;
        knoten.kinder.push(kind);
      });
    }
    return knoten;
  }
  return bau([]);
}

function blaetter(wurzel) {
  const out = [];
  (function sammle(k) {
    if (!k.kinder.length) out.push(k);
    else k.kinder.forEach(sammle);
  })(wurzel);
  return out;
}

// Blätter von oben nach unten gleichmäßig verteilen, innere Knoten mittig
// zwischen ihr erstes und letztes Kind setzen.
function baumLayout(wurzel, x0, dx, y0, dy) {
  let i = 0;
  (function lege(k, tiefe) {
    k.x = x0 + tiefe * dx;
    if (!k.kinder.length) {
      k.y = y0 + i * dy;
      i += 1;
      return;
    }
    k.kinder.forEach((c) => lege(c, tiefe + 1));
    k.y = (k.kinder[0].y + k.kinder[k.kinder.length - 1].y) / 2;
  })(wurzel, 0);
  return i;
}

// opt: { astKlasse(knoten), astText(knoten), blattText(knoten),
//        blattWert(knoten), knotenText(knoten), onAst(knoten), radius }
function baumZeichnen(svg, wurzel, opt = {}) {
  const r = opt.radius ?? 6;
  (function zeichne(k) {
    k.kinder.forEach((kind, i) => {
      const kl = opt.astKlasse ? opt.astKlasse(kind) : "";
      const linie = svgEl("line", {
        x1: k.x.toFixed(2), y1: k.y.toFixed(2),
        x2: kind.x.toFixed(2), y2: kind.y.toFixed(2),
        class: "me-ast" + (kl ? " " + kl : ""),
      });
      svg.appendChild(linie);

      // Beschriftung neben den Ast setzen — und zwar *senkrecht* zum Ast, sonst
      // liegt sie bei steilen Ästen mitten auf der Linie. Bei drei oder mehr
      // Ästen werden die Beschriftungen zusätzlich längs des Astes gestaffelt,
      // weil sich sonst die des waagerechten und des fallenden Astes treffen.
      const anteil = k.kinder.length >= 3 ? 0.28 + 0.24 * i : 0.5;
      const ax = kind.x - k.x, ay = kind.y - k.y;
      const laenge = Math.hypot(ax, ay) || 1;
      // Der Normalenvektor (ay, −ax) zeigt bei nach rechts laufenden Ästen
      // stets nach oben. Fallende Äste bekommen ihn gespiegelt, damit ihre
      // Beschriftung vom Geschwisterast weg wandert statt auf ihn zu.
      const vz = ay > 0 ? -1 : 1;
      const mx = k.x + anteil * ax + vz * (ay / laenge) * 12;
      const my = k.y + anteil * ay - vz * (ax / laenge) * 12 + 4;
      const t = svgText(mx, my, opt.astText ? opt.astText(kind) : "",
        { class: "me-astbeschriftung" + (kl ? " " + kl : "") });
      svg.appendChild(t);

      if (opt.onAst) {
        const flaeche = svgEl("line", {
          x1: k.x.toFixed(2), y1: k.y.toFixed(2),
          x2: kind.x.toFixed(2), y2: kind.y.toFixed(2),
          class: "me-klickflaeche",
          "data-pfad": kind.pfad.map((z) => z.kurz ?? z.label).join(""),
        });
        flaeche.addEventListener("click", () => opt.onAst(kind));
        svg.appendChild(flaeche);
      }
      zeichne(kind);
    });

    svg.appendChild(svgEl("circle", {
      cx: k.x.toFixed(2), cy: k.y.toFixed(2), r,
      class: "me-knoten" + (opt.knotenKlasse && opt.knotenKlasse(k) ? " " + opt.knotenKlasse(k) : ""),
    }));
    if (opt.knotenText) {
      const txt = opt.knotenText(k);
      if (txt) svg.appendChild(svgText(k.x, k.y + 22, txt, { class: "me-urnentext" }));
    }
    if (!k.kinder.length) {
      const kl = opt.astKlasse ? opt.astKlasse(k) : "";
      const wert = opt.blattWert ? opt.blattWert(k) : null;
      svg.appendChild(svgText(k.x + 12, k.y + (wert ? -1 : 4), opt.blattText ? opt.blattText(k) : "",
        { class: "me-blatt" + (kl ? " " + kl : ""), "text-anchor": "start" }));
      if (wert) {
        svg.appendChild(svgText(k.x + 12, k.y + 13, wert,
          { class: "me-blattwert" + (kl ? " " + kl : ""), "text-anchor": "start" }));
      }
    }
  })(wurzel);
}

function stufenBeschriftung(svg, x0, dx, stufen, y) {
  for (let s = 1; s <= stufen; s++) {
    svg.appendChild(svgText(x0 + (s - 0.5) * dx, y, s + ". Stufe", { class: "me-stufentext" }));
  }
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

function karte(klasse, name, wert) {
  return el("div", { class: "me-karte " + klasse }, [
    el("span", { class: "name" }, name),
    el("span", { class: "wert" }, wert),
  ]);
}

// ================= 1. Das Baumdiagramm =================

const BD_EXPERIMENTE = {
  muenze: {
    name: "Münzwurf",
    aeste: [{ label: "K", kurz: "K", z: 1, n: 2 }, { label: "Z", kurz: "Z", z: 1, n: 2 }],
    laplace: true,
    sache: "Kopf oder Zahl",
  },
  wuerfel6: {
    name: "Würfelwurf",
    aeste: [{ label: "6", kurz: "6", z: 1, n: 6 }, { label: "keine 6", kurz: "keine 6", z: 5, n: 6 }],
    laplace: false,
    sache: "eine 6 oder keine 6",
    legende: "Jeder Pfad nennt für beide Würfe, ob eine 6 fiel oder nicht.",
  },
  ampel: {
    name: "Ampel",
    aeste: [{ label: "rot", kurz: "r", z: 1, n: 3 }, { label: "gelb", kurz: "g", z: 1, n: 3 }, { label: "grün", kurz: "n", z: 1, n: 3 }],
    laplace: true,
    sache: "rot, gelb oder grün",
  },
};

function renderBaum() {
  const exp = BD_EXPERIMENTE[document.getElementById("bd-exp").value];
  const k = begrenzt("bd-stufen", Number(document.getElementById("bd-stufen").value), 1, 3);
  const m = exp.aeste.length;
  document.getElementById("bd-stufen-anzeige").textContent = k === 1 ? "1 Stufe" : k + " Stufen";

  const wurzel = baumErzeugen(k, () => exp.aeste.map((a) => ({ label: a.label, kurz: a.kurz, p: a.z / a.n, z: a.z, n: a.n })));
  const bl = blaetter(wurzel);
  const anzahl = bl.length;

  const dy = anzahl > 16 ? 26 : anzahl > 8 ? 32 : 44;
  const dx = 150, x0 = 46, y0 = 46;
  baumLayout(wurzel, x0, dx, y0, dy);
  const H = y0 + (anzahl - 1) * dy + 34;
  const zeigeWert = !(anzahl > 16 && exp.laplace);
  const laengste = Math.max(
    ...bl.map((kn) => kn.pfad.map((z) => z.kurz).join(", ").length),
    zeigeWert ? 9 : 0
  );
  const W = x0 + k * dx + 28 + Math.ceil(laengste * 6.6);
  const svg = neueFlaeche(W, H);
  stufenBeschriftung(svg, x0, dx, k, 22);

  baumZeichnen(svg, wurzel, {
    astText: (kn) => quot(kn.ast.z, kn.ast.n),
    blattText: (kn) => kn.pfad.map((z) => z.kurz).join(", "),
    // Bei sehr vielen gleich wahrscheinlichen Pfaden steht der Wert nur noch
    // in der Bilanz: 27-mal dieselbe Zahl am Blatt hilft niemandem.
    blattWert: !zeigeWert ? null : (kn) => {
      const p = kn.pfad.reduce((a, z) => a * z.p, 1);
      return zeichen(p, 4) + " " + num(p, 4);
    },
  });
  const mount = document.getElementById("bd-mount");
  mount.innerHTML = "";
  mount.appendChild(svg);

  const pGleich = Math.pow(1 / m, k);
  const pOben = bl[0].pfad.reduce((a, z) => a * z.p, 1);
  const pUnten = bl[bl.length - 1].pfad.reduce((a, z) => a * z.p, 1);

  const karten = document.getElementById("bd-karten");
  karten.innerHTML = "";
  karten.appendChild(karte("anzahl", "Stufen k", num(k)));
  karten.appendChild(karte("anzahl", "Äste je Knoten m", num(m)));
  karten.appendChild(karte("p", "|Ω| = Pfade", num(anzahl)));
  karten.appendChild(karte(exp.laplace ? "e" : "gegen", "P je Pfad",
    exp.laplace ? quot(1, anzahl) + " " + zeichen(pGleich, 4) + " " + num(pGleich, 4) : "verschieden"));

  document.getElementById("bd-bilanz").innerHTML =
    `<span class="wm">|Ω| = m<sup>k</sup> = ${num(m)}<sup>${num(k)}</sup> = ${num(anzahl)}</span> — ` +
    `${num(k)} ${k === 1 ? "Stufe" : "Stufen"} mit je ${num(m)} Ausgängen (${exp.sache}).<br>` +
    (exp.legende ? `${exp.legende}<br>` : "") +
    (exp.laplace
      ? `Alle Äste sind gleich wahrscheinlich, also auch alle Pfade: ` +
        `<span class="wp">P(Pfad) = ${Array(k).fill(faktor(1, m)).join(" · ")} ${zeichen(pGleich, 4)} ${num(pGleich, 4)}</span>. ` +
        `Man darf hier abzählen: P(E) = Anzahl der Pfade von E : ${num(anzahl)}.`
      : `Die Äste sind <strong class="wo">nicht</strong> gleich wahrscheinlich, also die Pfade auch nicht: ` +
        `oben <span class="wp">${zeichen(pOben, 4)} ${num(pOben, 4)}</span>, unten <span class="wp">${zeichen(pUnten, 4)} ${num(pUnten, 4)}</span>. ` +
        `Abzählen wäre hier <strong class="wo">falsch</strong> — man muss entlang jedes Pfades multiplizieren.`);

  document.getElementById("bd-text").textContent = anzahl > 16
    ? `${num(anzahl)} Pfade — der Baum wird schon jetzt unhandlich. Genau deshalb rechnet man mit den Pfadregeln, statt alle Ergebnisse aufzuschreiben.`
    : `Jeder Weg von der Wurzel bis ganz nach rechts ist genau ein Ergebnis. Zähle nach: Es sind ${num(anzahl)}.`;
}

function initBaum() {
  document.getElementById("bd-exp").addEventListener("change", renderBaum);
  document.getElementById("bd-stufen").addEventListener("input", renderBaum);
  renderBaum();
}

// ================= 2. Die 1. Pfadregel (Produktregel) =================

let prAuswahl = [];   // Astindizes des gewählten Pfades, Länge 0 bis 2

function renderProduktregel() {
  const rot = begrenzt("pr-rot", Number(document.getElementById("pr-rot").value), 1, 9);
  const blau = begrenzt("pr-blau", Number(document.getElementById("pr-blau").value), 1, 9);
  const n = rot + blau;
  document.getElementById("pr-rot-anzeige").textContent = num(rot) + " rot";
  document.getElementById("pr-blau-anzeige").textContent = num(blau) + " blau";

  // Ziehen mit Zurücklegen: beide Stufen tragen dieselben Zahlen.
  const aeste = [
    { label: "rot", kurz: "r", z: rot, n, p: rot / n },
    { label: "blau", kurz: "b", z: blau, n, p: blau / n },
  ];
  const wurzel = baumErzeugen(2, () => aeste.map((a) => Object.assign({}, a)));
  const bl = blaetter(wurzel);

  const dx = 150, x0 = 46, y0 = 52, dy = 60;
  baumLayout(wurzel, x0, dx, y0, dy);
  const baumB = x0 + 2 * dx + 152;
  const S = 190, qx = baumB + 70, qy = 58;   // Einheitsquadrat
  const W = qx + S + 34, H = 300;
  const svg = neueFlaeche(W, H);
  stufenBeschriftung(svg, x0, dx, 2, 26);

  const aktiv = (kn) => {
    const idx = kn.pfad.map((z) => (z.kurz === "r" ? 0 : 1));
    return prAuswahl.length >= idx.length && idx.every((v, i) => v === prAuswahl[i]) ? "aktiv" : "";
  };

  baumZeichnen(svg, wurzel, {
    astKlasse: aktiv,
    astText: (kn) => quot(kn.ast.z, kn.ast.n),
    blattText: (kn) => kn.pfad.map((z) => z.label).join(", "),
    blattWert: (kn) => {
      const z = kn.pfad.reduce((a, b) => a * b.z, 1);
      const p = z / (n * n);
      return quot(z, n * n) + " " + zeichen(p, 4) + " " + num(p, 4);
    },
    onAst: (kn) => {
      prAuswahl = kn.pfad.map((z) => (z.kurz === "r" ? 0 : 1));
      renderProduktregel();
    },
  });

  // Einheitsquadrat: Breite = 1. Stufe, Höhe = 2. Stufe.
  const br = (rot / n) * S, bb = S - br;
  const hr = (rot / n) * S, hb = S - hr;
  const felder = [
    { x: qx, y: qy, w: br, h: hr, kl: "me-feld-rr", idx: [0, 0], name: "rot, rot" },
    { x: qx, y: qy + hr, w: br, h: hb, kl: "me-feld-rb", idx: [0, 1], name: "rot, blau" },
    { x: qx + br, y: qy, w: bb, h: hr, kl: "me-feld-br", idx: [1, 0], name: "blau, rot" },
    { x: qx + br, y: qy + hr, w: bb, h: hb, kl: "me-feld-bb", idx: [1, 1], name: "blau, blau" },
  ];
  const gewaehlt = [];
  felder.forEach((f) => {
    const ist = prAuswahl.length === 2 && f.idx[0] === prAuswahl[0] && f.idx[1] === prAuswahl[1];
    if (ist) gewaehlt.push(f);
    svg.appendChild(svgEl("rect", {
      x: f.x.toFixed(2), y: f.y.toFixed(2), width: f.w.toFixed(2), height: f.h.toFixed(2),
      class: "me-feld " + f.kl,
    }));
    // Beschriftung nur, wenn das Rechteck sie auch trägt — sonst würde sie
    // über den Rand hinauslaufen.
    if (f.w >= 46 && f.h >= 20) {
      const zz = (f.idx[0] === 0 ? rot : blau) * (f.idx[1] === 0 ? rot : blau);
      svg.appendChild(svgText(f.x + f.w / 2, f.y + f.h / 2 + 4, quot(zz, n * n), { class: "me-feldtext" }));
    }
  });
  gewaehlt.forEach((f) => svg.appendChild(svgEl("rect", {
    x: f.x.toFixed(2), y: f.y.toFixed(2), width: f.w.toFixed(2), height: f.h.toFixed(2),
    class: "me-feld aktiv nurrahmen",
  })));
  svg.appendChild(svgEl("rect", { x: qx, y: qy, width: S, height: S, class: "me-rahmen" }));
  svg.appendChild(svgText(qx + S / 2, qy - 26, "Einheitsquadrat: Fläche = 1", { class: "me-stufentext" }));
  // Maßangaben: die Breite gehört zur 1. Stufe, die Höhe zur 2. Stufe.
  svg.appendChild(svgEl("line", { x1: qx, y1: qy + S + 12, x2: qx + br, y2: qy + S + 12, class: "me-massband" }));
  svg.appendChild(svgText(qx + br / 2, qy + S + 26, "Breite " + quot(rot, n) + " (1. Stufe)", { class: "me-masstext" }));
  svg.appendChild(svgEl("line", { x1: qx - 12, y1: qy, x2: qx - 12, y2: qy + hr, class: "me-massband" }));
  svg.appendChild(svgText(qx - 16, qy + hr / 2 + 4, "Höhe " + quot(rot, n), { class: "me-masstext", "text-anchor": "end" }));
  svg.appendChild(svgText(qx - 16, qy + hr / 2 + 17, "(2. Stufe)", { class: "me-masstext", "text-anchor": "end" }));

  const mount = document.getElementById("pr-mount");
  mount.innerHTML = "";
  mount.appendChild(svg);

  const karten = document.getElementById("pr-karten");
  karten.innerHTML = "";
  karten.appendChild(karte("anzahl", "Kugeln gesamt", num(n)));
  karten.appendChild(karte("p", "P(rot) je Zug", quot(rot, n) + " " + zeichen(rot / n, 4) + " " + num(rot / n, 4)));
  const summe = bl.reduce((a, kn) => a + kn.pfad.reduce((x, z) => x * z.z, 1), 0) / (n * n);
  karten.appendChild(karte("e", "Summe aller Pfade", num(summe, 4)));

  const bilanz = document.getElementById("pr-bilanz");
  if (prAuswahl.length === 0) {
    bilanz.innerHTML =
      `Alle vier Pfade zusammen ergeben <span class="wg">${quot(n * n, n * n)} = 1</span> — im Einheitsquadrat füllen die vier Rechtecke ` +
      `das Quadrat lückenlos aus. Das ist die schnellste Probe für jedes Baumdiagramm.`;
    document.getElementById("pr-text").textContent =
      "Klicke im Baum auf einen Ast der 1. Stufe und danach auf einen Ast der 2. Stufe.";
  } else if (prAuswahl.length === 1) {
    const a = aeste[prAuswahl[0]];
    bilanz.innerHTML =
      `1. Stufe gewählt: <span class="wp">P(${a.label}) = ${quot(a.z, n)} ${zeichen(a.p, 4)} ${num(a.p, 4)}</span>.<br>` +
      `Jetzt fehlt noch die 2. Stufe — klicke einen der beiden Äste rechts davon an.`;
    document.getElementById("pr-text").textContent =
      "Ein einzelner Ast ist noch kein Pfad. Erst der Weg bis ganz nach rechts ist ein Ergebnis des Gesamtexperiments.";
  } else {
    const a1 = aeste[prAuswahl[0]], a2 = aeste[prAuswahl[1]];
    const z = a1.z * a2.z, nn = n * n, p = z / nn;
    const gek = gekuerzt(z, nn);
    bilanz.innerHTML =
      `<span class="wp">P(${a1.label}, ${a2.label}) = ${faktor(a1.z, n)} · ${faktor(a2.z, n)} = ${quot(z, nn)}` +
      (gek ? ` = ${quot(gek[0], gek[1])}` : "") + ` ${zeichen(p, 4)} ${num(p, 4)}</span><br>` +
      `Im Einheitsquadrat ist das das violett umrandete Rechteck: ` +
      `<span class="${prAuswahl[0] === 0 ? "wr" : "wm"}">${quot(a1.z, n)}</span> breit, ` +
      `<span class="${prAuswahl[1] === 0 ? "wr" : "wm"}">${quot(a2.z, n)}</span> hoch, ` +
      `also <span class="wp">${faktor(a1.z, n)} · ${faktor(a2.z, n)}</span> groß.`;
    document.getElementById("pr-text").textContent =
      "Zähler mal Zähler, Nenner mal Nenner — die Produktregel ist genau die Multiplikation zweier Brüche.";
  }
}

function initProduktregel() {
  ["pr-rot", "pr-blau"].forEach((id) => document.getElementById(id).addEventListener("input", () => {
    prAuswahl = [];
    renderProduktregel();
  }));
  document.getElementById("pr-reset").addEventListener("click", () => {
    prAuswahl = [];
    renderProduktregel();
  });
  renderProduktregel();
}

// ================= 3. Die 2. Pfadregel (Summenregel) =================

const SR_EREIGNISSE = {
  genau1: { text: "genau einmal Kopf", trifft: (k) => k === 1 },
  genau2: { text: "genau zweimal Kopf", trifft: (k) => k === 2 },
  mind1: { text: "mindestens einmal Kopf", trifft: (k) => k >= 1 },
  mind2: { text: "mindestens zweimal Kopf", trifft: (k) => k >= 2 },
  kein: { text: "kein einziges Mal Kopf", trifft: (k) => k === 0 },
};

function renderSummenregel() {
  const schluessel = document.getElementById("sr-ereignis").value;
  const ereignis = SR_EREIGNISSE[schluessel];
  const zeigeGegen = document.getElementById("sr-gegen").checked;

  const wurzel = baumErzeugen(3, () => [
    { label: "K", kurz: "K", z: 1, n: 2, p: 0.5 },
    { label: "Z", kurz: "Z", z: 1, n: 2, p: 0.5 },
  ]);
  const bl = blaetter(wurzel);
  const kopfZahl = (kn) => kn.pfad.filter((z) => z.kurz === "K").length;
  // Ein innerer Knoten wird eingefärbt, wenn *alle* seine Blätter zum Ereignis
  // gehören — sonst würde ein Ast grün wirken, der auch aus dem Ereignis
  // herausführt.
  const stufeKlasse = (kn) => {
    const unten = kn.kinder.length ? blaetter(kn) : [kn];
    const drin = unten.filter((b) => ereignis.trifft(kopfZahl(b))).length;
    if (drin === unten.length) return "ereignis";
    if (drin === 0 && zeigeGegen) return "gegen";
    return "";
  };

  const dx = 132, x0 = 46, y0 = 48, dy = 36;
  baumLayout(wurzel, x0, dx, y0, dy);
  const W = x0 + 3 * dx + 178, H = y0 + 7 * dy + 34;
  const svg = neueFlaeche(W, H);
  stufenBeschriftung(svg, x0, dx, 3, 22);

  baumZeichnen(svg, wurzel, {
    astKlasse: stufeKlasse,
    astText: () => quot(1, 2),
    blattText: (kn) => kn.pfad.map((z) => z.kurz).join(""),
    blattWert: () => quot(1, 8) + " = 0,125",
  });
  const mount = document.getElementById("sr-mount");
  mount.innerHTML = "";
  mount.appendChild(svg);

  const drin = bl.filter((b) => ereignis.trifft(kopfZahl(b)));
  const draussen = bl.filter((b) => !ereignis.trifft(kopfZahl(b)));
  const p = drin.length / 8, pGegen = draussen.length / 8;

  const karten = document.getElementById("sr-karten");
  karten.innerHTML = "";
  karten.appendChild(karte("anzahl", "|Ω| = Pfade", "8"));
  karten.appendChild(karte("e", "Pfade in E", num(drin.length)));
  karten.appendChild(karte("p", "P(E)", quot(drin.length, 8) + " " + zeichen(p, 4) + " " + num(p, 4)));
  karten.appendChild(karte("gegen", "P(Ē)", quot(draussen.length, 8) + " " + zeichen(pGegen, 4) + " " + num(pGegen, 4)));

  const namen = drin.map((b) => b.pfad.map((z) => z.kurz).join("")).join(", ");
  const gegenNamen = draussen.map((b) => b.pfad.map((z) => z.kurz).join("")).join(", ");
  const gek = gekuerzt(drin.length, 8);

  let html =
    `Ereignis E = „${ereignis.text}“ besteht aus <span class="wg">${num(drin.length)} ${drin.length === 1 ? "Pfad" : "Pfaden"}</span>: ` +
    `<span class="wg">${namen || "—"}</span><br>` +
    `<span class="wg">P(E) = ${drin.length === 0 ? "0" : Array(drin.length).fill(quot(1, 8)).join(" + ")} = ${quot(drin.length, 8)}` +
    (gek ? ` = ${quot(gek[0], gek[1])}` : "") + ` ${zeichen(p, 4)} ${num(p, 4)}</span>`;
  if (drin.length >= 5) {
    html += `<br>Kürzer über das Gegenereignis Ē = „${gegenNamen}“: ` +
      `<span class="wo">P(E) = 1 − P(Ē) = 1 − ${quot(draussen.length, 8)} = ${quot(drin.length, 8)} ${zeichen(p, 4)} ${num(p, 4)}</span> — ` +
      `${num(draussen.length)} statt ${num(drin.length)} Summanden.`;
  }
  if (zeigeGegen) {
    html += `<br><span class="wo">Ē = „${gegenNamen || "—"}“, P(Ē) = ${quot(draussen.length, 8)} ${zeichen(pGegen, 4)} ${num(pGegen, 4)}</span> — ` +
      `zusammen ergibt das <span class="wg">${quot(drin.length, 8)}</span> + <span class="wo">${quot(draussen.length, 8)}</span> = 1.`;
  }
  document.getElementById("sr-bilanz").innerHTML = html;

  document.getElementById("sr-text").textContent = drin.length >= 5
    ? "Sieh dir an, wie viele Pfade hier addiert werden müssten — und wie wenige beim Gegenereignis."
    : "Grün sind genau die Äste, deren sämtliche Fortsetzungen zum Ereignis gehören.";
}

function initSummenregel() {
  document.getElementById("sr-ereignis").addEventListener("change", renderSummenregel);
  document.getElementById("sr-gegen").addEventListener("change", renderSummenregel);
  renderSummenregel();
}

// ================= 4. Ziehen mit und ohne Zurücklegen =================

let zzOhne = false;

function zzUrne(svg, x, y, rot, blau, weg) {
  // Urne als offenes Gefäß, Kugeln in Reihen zu vier.
  const b = 96, h = 92;
  svg.appendChild(svgEl("path", {
    d: `M ${x} ${y} L ${x + 8} ${y + h} L ${x + b - 8} ${y + h} L ${x + b} ${y}`,
    class: "me-urne",
  }));
  const kugeln = [];
  for (let i = 0; i < rot; i++) kugeln.push("rot");
  for (let i = 0; i < blau; i++) kugeln.push("blau");
  const proReihe = 4, r = 8.5;
  kugeln.forEach((farbe, i) => {
    const reihe = Math.floor(i / proReihe), spalte = i % proReihe;
    const anzahlReihe = Math.min(proReihe, kugeln.length - reihe * proReihe);
    const cx = x + b / 2 + (spalte - (anzahlReihe - 1) / 2) * (2 * r + 3);
    const cy = y + h - 14 - reihe * (2 * r + 3);
    svg.appendChild(svgEl("circle", { cx: cx.toFixed(2), cy: cy.toFixed(2), r, class: farbe === "rot" ? "me-kugel-rot" : "me-kugel-blau" }));
  });
  if (weg) {
    svg.appendChild(svgEl("circle", { cx: (x + b / 2).toFixed(2), cy: (y - 16).toFixed(2), r, class: "me-kugel-weg" }));
  }
  return { b, h };
}

function renderZurueckLegen() {
  const rot = begrenzt("zz-rot", Number(document.getElementById("zz-rot").value), 1, 8);
  const blau = begrenzt("zz-blau", Number(document.getElementById("zz-blau").value), 1, 8);
  const n = rot + blau;
  document.getElementById("zz-rot-anzeige").textContent = num(rot) + " rot";
  document.getElementById("zz-blau-anzeige").textContent = num(blau) + " blau";
  document.getElementById("zz-modus").textContent = zzOhne ? "mit Zurücklegen anzeigen" : "ohne Zurücklegen anzeigen";

  // Der Ast der 2. Stufe hängt beim Ziehen ohne Zurücklegen davon ab, was auf
  // der 1. Stufe passiert ist — genau das leistet der Parameter "pfad".
  function zweige(pfad) {
    if (pfad.length === 0 || !zzOhne) {
      return [
        { label: "rot", kurz: "r", z: rot, n },
        { label: "blau", kurz: "b", z: blau, n },
      ];
    }
    const ersteRot = pfad[0].kurz === "r";
    return [
      { label: "rot", kurz: "r", z: ersteRot ? rot - 1 : rot, n: n - 1 },
      { label: "blau", kurz: "b", z: ersteRot ? blau : blau - 1, n: n - 1 },
    ];
  }
  const wurzel = baumErzeugen(2, zweige);

  const dx = 175, x0 = 178, y0 = 60, dy = 78;
  baumLayout(wurzel, x0, dx, y0, dy);
  const W = x0 + 2 * dx + 210, H = 350;
  const svg = neueFlaeche(W, H);
  stufenBeschriftung(svg, x0, dx, 2, 26);
  zzUrne(svg, 24, 132, rot, blau, false);
  svg.appendChild(svgText(72, 248, num(n) + " Kugeln", { class: "me-urnentext" }));
  svg.appendChild(svgText(72, 262, zzOhne ? "ohne Zurücklegen" : "mit Zurücklegen", { class: "me-urnentext" }));

  baumZeichnen(svg, wurzel, {
    astText: (kn) => quot(kn.ast.z, kn.ast.n),
    knotenText: (kn) => {
      if (kn.pfad.length !== 1) return "";
      const rest = zweige(kn.pfad);
      return zzOhne ? `noch ${num(rest[0].z)} rot, ${num(rest[1].z)} blau` : `wieder ${num(rot)} rot, ${num(blau)} blau`;
    },
    blattText: (kn) => kn.pfad.map((z) => z.label).join(", "),
    blattWert: (kn) => {
      const z = kn.pfad.reduce((a, b) => a * b.z, 1);
      const nn = kn.pfad.reduce((a, b) => a * b.n, 1);
      const p = z / nn;
      return quot(z, nn) + " " + zeichen(p, 4) + " " + num(p, 4);
    },
  });
  const mount = document.getElementById("zz-mount");
  mount.innerHTML = "";
  mount.appendChild(svg);

  // Vergleichstabelle: beide Modelle nebeneinander, damit der Unterschied
  // nicht erst durch Hin- und Herschalten sichtbar wird.
  const paare = [["rot", "rot"], ["rot", "blau"], ["blau", "rot"], ["blau", "blau"]];
  const anz = { rot, blau };
  let zeilen = `<tr><th>Pfad</th><th>mit Zurücklegen</th><th>ohne Zurücklegen</th><th>Unterschied</th></tr>`;
  let sMit = 0, sOhne = 0;
  paare.forEach(([a, b]) => {
    const zMit = anz[a] * anz[b], nMit = n * n;
    const zweitZ = a === b ? anz[b] - 1 : anz[b];
    const zOhne = anz[a] * zweitZ, nOhne = n * (n - 1);
    const pMit = zMit / nMit, pOhne = zOhne / nOhne;
    sMit += pMit;
    sOhne += pOhne;
    const diff = pOhne - pMit;
    zeilen += `<tr><td class="pfad">${a}, ${b}</td>` +
      `<td class="mit">${quot(zMit, nMit)} ${zeichen(pMit, 4)} ${num(pMit, 4)}</td>` +
      `<td class="ohne">${quot(zOhne, nOhne)} ${zeichen(pOhne, 4)} ${num(pOhne, 4)}</td>` +
      `<td>${Math.abs(diff) < 5e-5 ? "±0" : (diff > 0 ? "+" : "−") + num(Math.abs(diff), 4)}</td></tr>`;
  });
  zeilen += `<tr class="summe"><td>Summe</td><td class="mit">${num(sMit, 4)}</td><td class="ohne">${num(sOhne, 4)}</td><td>—</td></tr>`;
  document.getElementById("zz-tabelle").innerHTML = zeilen;

  const pRRmit = (rot * rot) / (n * n), pRRohne = (rot * (rot - 1)) / (n * (n - 1));
  const pRBmit = (rot * blau) / (n * n), pRBohne = (rot * blau) / (n * (n - 1));
  document.getElementById("zz-bilanz").innerHTML =
    `<span class="wm">Mit Zurücklegen</span> steht in beiden Stufen derselbe Nenner ${num(n)}: ` +
    `P(rot, rot) = ${faktor(rot, n)} · ${faktor(rot, n)} = ${quot(rot * rot, n * n)} ${zeichen(pRRmit, 4)} ${num(pRRmit, 4)}<br>` +
    `<span class="wr">Ohne Zurücklegen</span> ist vor dem 2. Zug eine Kugel weg — und zwar die gezogene: ` +
    `P(rot, rot) = ${faktor(rot, n)} · ${faktor(rot - 1, n - 1)} = ${quot(rot * (rot - 1), n * (n - 1))} ${zeichen(pRRohne, 4)} ${num(pRRohne, 4)}<br>` +
    (rot === 1
      ? `Bei nur <span class="wr">einer</span> roten Kugel ist „zweimal rot“ ohne Zurücklegen <strong>unmöglich</strong>: P = 0.`
      : `Das ist <span class="wr">kleiner</span> als mit Zurücklegen. Umgekehrt wird P(rot, blau) <span class="wr">größer</span>: ` +
        `${num(pRBmit, 4)} → ${num(pRBohne, 4)}. Beide Bäume haben trotzdem die Pfadsumme 1.`);

  document.getElementById("zz-text").textContent = zzOhne
    ? "Achte auf die 1. Stufe: Sie ist in beiden Bäumen identisch. Nur die Nenner der 2. Stufe sind um 1 kleiner."
    : "Mit Zurücklegen tragen beide Stufen dieselben Zahlen — die Urne ist vor jedem Zug im gleichen Zustand.";
}

function initZurueckLegen() {
  ["zz-rot", "zz-blau"].forEach((id) => document.getElementById(id).addEventListener("input", renderZurueckLegen));
  document.getElementById("zz-modus").addEventListener("click", () => {
    zzOhne = !zzOhne;
    renderZurueckLegen();
  });
  renderZurueckLegen();
}

// ================= 5. Ungleiche Stufen =================

function renderUngleich() {
  const p = begrenzt("ug-regen", Number(document.getElementById("ug-regen").value), 10, 80);
  const q1 = begrenzt("ug-q1", Number(document.getElementById("ug-q1").value), 10, 90);
  const q2 = begrenzt("ug-q2", Number(document.getElementById("ug-q2").value), 0, 60);
  document.getElementById("ug-regen-anzeige").textContent = num(p) + " %";
  document.getElementById("ug-q1-anzeige").textContent = num(q1) + " %";
  document.getElementById("ug-q2-anzeige").textContent = num(q2) + " %";

  // Alles in ganzen Prozent, damit keine Rundungsfehler entstehen.
  const stufe1 = [{ label: "Regen", kurz: "R", pz: p }, { label: "trocken", kurz: "T", pz: 100 - p }];
  const wurzel = baumErzeugen(2, (pfad) => {
    if (pfad.length === 0) return stufe1.map((a) => Object.assign({}, a));
    const q = pfad[0].kurz === "R" ? q1 : q2;
    return [{ label: "zu spät", kurz: "S", pz: q }, { label: "pünktlich", kurz: "P", pz: 100 - q }];
  });

  const dx = 158, x0 = 52, y0 = 62, dy = 64;
  baumLayout(wurzel, x0, dx, y0, dy);
  const W = x0 + 2 * dx + 224, H = 320;
  const svg = neueFlaeche(W, H);
  stufenBeschriftung(svg, x0, dx, 2, 26);
  svg.appendChild(svgText(x0 + 0.5 * dx, 40, "Wetter", { class: "me-stufentext" }));
  svg.appendChild(svgText(x0 + 1.5 * dx, 40, "Bus", { class: "me-stufentext" }));

  baumZeichnen(svg, wurzel, {
    astKlasse: (kn) => (kn.pfad.length === 2 && kn.pfad[1].kurz === "S" ? "ereignis" : ""),
    astText: (kn) => num(kn.ast.pz) + " %",
    blattText: (kn) => kn.pfad.map((z) => z.label).join(", "),
    blattWert: (kn) => {
      const anteil = (kn.pfad[0].pz * kn.pfad[1].pz) / 100;
      return num(kn.pfad[0].pz / 100, 4) + " · " + num(kn.pfad[1].pz / 100, 4) +
        " = " + num(anteil / 100, 4) + " = " + num(anteil, 2) + " %";
    },
  });
  const mount = document.getElementById("ug-mount");
  mount.innerHTML = "";
  mount.appendChild(svg);

  const a1 = (p * q1) / 100, a2 = ((100 - p) * q2) / 100;
  const gesamt = a1 + a2;
  const mittel = (q1 + q2) / 2;

  const karten = document.getElementById("ug-karten");
  karten.innerHTML = "";
  karten.appendChild(karte("anzahl", "Regen & zu spät", num(a1, 2) + " %"));
  karten.appendChild(karte("anzahl", "trocken & zu spät", num(a2, 2) + " %"));
  karten.appendChild(karte("e", "zu spät gesamt", num(gesamt, 2) + " %"));
  karten.appendChild(karte("gegen", "pünktlich", num(100 - gesamt, 2) + " %"));

  document.getElementById("ug-bilanz").innerHTML =
    `<span class="wg">P(zu spät) = ${num(p / 100, 4)} · ${num(q1 / 100, 4)} + ${num((100 - p) / 100, 4)} · ${num(q2 / 100, 4)} ` +
    `= ${num(a1 / 100, 4)} + ${num(a2 / 100, 4)} = ${num(gesamt / 100, 4)} = ${num(gesamt, 2)} %</span><br>` +
    `Erst <em>entlang</em> der beiden Pfade multiplizieren (1. Pfadregel), dann <em>über</em> die Pfade addieren (2. Pfadregel).<br>` +
    (Math.abs(mittel - gesamt) < 1e-9
      ? `Hier stimmt der Mittelwert der beiden Prozentsätze zufällig mit dem Ergebnis überein — das liegt allein daran, dass beide Zweige gerade gleich schwer wiegen (${num(p)} % und ${num(100 - p)} %).`
      : `Der schlichte Mittelwert <span class="wo">(${num(q1)} % + ${num(q2)} %) : 2 = ${num(mittel, 2)} %</span> ist ` +
        `<strong class="wo">falsch</strong>: Er tut so, als wären Regen- und Trockentage gleich häufig. ` +
        `Tatsächlich wiegt der ${p > 50 ? "Regen" : "Trocken"}zweig mit ${num(Math.max(p, 100 - p))} % deutlich schwerer.`);

  document.getElementById("ug-text").textContent =
    "Die vier Pfadwerte ergeben zusammen wieder 100 % — auch dann, wenn die beiden Stufen völlig verschiedene Vorgänge beschreiben.";
}

function initUngleich() {
  ["ug-regen", "ug-q1", "ug-q2"].forEach((id) => document.getElementById(id).addEventListener("input", renderUngleich));
  renderUngleich();
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

function ohneKollision(kandidaten, werte, notfall, eps = 1e-9) {
  const sauber = kandidaten.filter((kk) => {
    const alle = werte(kk);
    return alle.every((x, i) => alle.every((y, j) => i === j || Math.abs(x - y) > eps));
  });
  return sauber.length ? pick(sauber) : notfall;
}

// Aufgabe 1 — Wie viele Pfade hat der Baum? |Ω| = m^k.
const A1_EXPERIMENTE = [
  { m: 2, wie: "eine Münze geworfen", was: "Kopf und Zahl" },
  { m: 6, wie: "ein Würfel geworfen", was: "die Augenzahlen 1 bis 6" },
  { m: 3, wie: "eine Ampel beobachtet", was: "rot, gelb und grün" },
  { m: 4, wie: "an einem Glücksrad mit 4 Feldern gedreht", was: "die vier Felder" },
  { m: 5, wie: "eine Karte aus 5 verschiedenen Karten gezogen und zurückgelegt", was: "die fünf Karten" },
  { m: 8, wie: "an einem Glücksrad mit 8 Feldern gedreht", was: "die acht Felder" },
];
function generateAufgabe1() {
  const kandidaten = [];
  A1_EXPERIMENTE.forEach((e, i) => {
    [2, 3, 4].forEach((k) => {
      if (Math.pow(e.m, k) <= 1296) kandidaten.push({ i, k });
    });
  });
  const wahl = ohneKollision(
    kandidaten,
    (c) => {
      const m = A1_EXPERIMENTE[c.i].m, k = c.k;
      return [Math.pow(m, k), m * k, m + k, Math.pow(k, m), m, k];
    },
    kandidaten[0]
  );
  const e = A1_EXPERIMENTE[wahl.i], k = wahl.k, m = e.m;
  const anzahl = Math.pow(m, k);

  return {
    promptHtml:
      `Es wird <strong>${num(k)}-mal nacheinander</strong> ${e.wie}. Jede Stufe hat ${num(m)} mögliche Ausgänge (${e.was}).<br>` +
      `Wie viele <strong>Pfade</strong> hat das zugehörige Baumdiagramm, also wie viele Ergebnisse hat Ω?`,
    correct: anzahl,
    tolerance: 0.001,
    placeholder: "Anzahl",
    hinweis: (raw, val) => {
      if (Math.abs(val - m * k) < 0.01)
        return `${num(m)} · ${num(k)} = ${num(m * k)} zählt die <em>Äste</em> im Baum, nicht die Pfade. Bei jeder weiteren Stufe wird die Zahl der Pfade <strong>ver-${num(m)}-facht</strong>, nicht um ${num(m)} erhöht.`;
      if (Math.abs(val - (m + k)) < 0.01)
        return `Addieren ist hier falsch. Jeder der bisherigen Pfade verzweigt sich erneut in ${num(m)} Fortsetzungen — das ist eine Multiplikation.`;
      if (Math.abs(val - Math.pow(k, m)) < 0.01)
        return `Du hast Basis und Exponent vertauscht: Es sind ${num(m)} Ausgänge in ${num(k)} Stufen, also ${num(m)}<sup>${num(k)}</sup>.`;
      if (Math.abs(val - m) < 0.01)
        return `${num(m)} ist die Zahl der Ausgänge einer <em>einzelnen</em> Stufe. Gefragt sind alle Pfade über ${num(k)} Stufen.`;
      return `Denk an die Formel |Ω| = m<sup>k</sup> mit m = ${num(m)} Ausgängen und k = ${num(k)} Stufen.`;
    },
    musterloesungHtml:
      `<strong>1. Baum lesen:</strong> Jede Stufe verzweigt jeden bisherigen Pfad in ${num(m)} neue.<br>` +
      `<strong>2. Formel:</strong> |Ω| = m<sup>k</sup> = ${num(m)}<sup>${num(k)}</sup> = ${Array(k).fill(num(m)).join(" · ")} = <strong>${num(anzahl)}</strong><br>` +
      `<em>Merke:</em> Nach der 1. Stufe sind es ${num(m)} Pfade, nach der 2. schon ${num(m * m)} — die Zahl wächst nicht linear, sondern potenziert.`,
  };
}

// Aufgabe 2 — 1. Pfadregel, Ziehen mit Zurücklegen, Antwort in Prozent.
// Die Grundzahlen sind so gewählt, dass der Prozentsatz ganzzahlig ist.
function generateAufgabe2() {
  const kandidaten = [];
  [5, 10, 20].forEach((n) => {
    for (let r = 1; r <= n - 1; r++) {
      const proz = (r * (n - r) * 100) / (n * n);
      if (Number.isInteger(proz) && proz > 0) kandidaten.push({ n, r });
    }
  });
  const wahl = ohneKollision(
    kandidaten,
    (c) => {
      const { n, r } = c, b = n - r;
      return [
        (r * b * 100) / (n * n),           // gesuchter Wert
        (r * 100) / n,                      // P(rot)
        (b * 100) / n,                      // P(blau)
        (r * r * 100) / (n * n),            // P(rot, rot)
        (b * b * 100) / (n * n),            // P(blau, blau)
        (2 * r * b * 100) / (n * n),        // "genau eine rote" — beide Pfade
        (r * b * 100) / (n * (n - 1)),      // dasselbe ohne Zurücklegen
        r, b, n,
      ];
    },
    kandidaten[0]
  );
  const n = wahl.n, r = wahl.r, b = n - r;
  const proz = (r * b * 100) / (n * n);

  return {
    promptHtml:
      `In einer Urne liegen <strong>${num(r)} rote</strong> und <strong>${num(b)} blaue</strong> Kugeln. ` +
      `Es wird eine Kugel gezogen, <strong>zurückgelegt</strong>, und dann noch einmal gezogen.<br>` +
      `Wie groß ist die Wahrscheinlichkeit für den Pfad <strong>„erst rot, dann blau“</strong>? Antwort in Prozent.`,
    correct: proz,
    tolerance: 0.05,
    placeholder: "Prozent",
    hinweis: (raw, val) => {
      if (Math.abs(val - 2 * proz) < 0.05)
        return `Du hast beide Reihenfolgen zusammengezählt. Gefragt ist nur der <em>eine</em> Pfad „erst rot, dann blau“ — „erst blau, dann rot“ ist ein anderer Pfad.`;
      if (Math.abs(val - (r * 100) / n) < 0.05)
        return `${num((r * 100) / n)} % ist P(rot) für einen <em>einzelnen</em> Zug. Für den zweistufigen Pfad muss noch mit P(blau) multipliziert werden.`;
      if (Math.abs(val - 100) < 0.05)
        return `Du hast P(rot) und P(blau) <em>addiert</em> — das ergibt immer 100 %. Addiert wird über <em>verschiedene Pfade</em> (2. Pfadregel); <em>entlang</em> eines Pfades wird multipliziert (1. Pfadregel).`;
      if (Math.abs(val - (r * b * 100) / (n * (n - 1))) < 0.05)
        return `Das wäre die Rechnung <em>ohne</em> Zurücklegen. Hier wird die Kugel zurückgelegt — im zweiten Zug liegen wieder alle ${num(n)} Kugeln in der Urne.`;
      return `1. Pfadregel: P(rot, blau) = P(rot) · P(blau) = ${faktor(r, n)} · ${faktor(b, n)}.`;
    },
    musterloesungHtml:
      `<strong>1. Stufe:</strong> P(rot) = ${quot(r, n)} ${zeichen(r / n, 4)} ${num(r / n, 4)}<br>` +
      `<strong>2. Stufe:</strong> Die Kugel wurde zurückgelegt, also liegen wieder ${num(n)} Kugeln in der Urne: P(blau) = ${quot(b, n)} ${zeichen(b / n, 4)} ${num(b / n, 4)}<br>` +
      `<strong>3. Produktregel:</strong> P(rot, blau) = ${faktor(r, n)} · ${faktor(b, n)} = ${quot(r * b, n * n)} = ${num(proz / 100, 4)} = <strong>${num(proz)} %</strong><br>` +
      `<em>Achtung:</em> „erst rot, dann blau“ ist genau <em>ein</em> Pfad. Wer beide Reihenfolgen meint, muss ${num(proz)} % + ${num(proz)} % = ${num(2 * proz)} % rechnen.`,
  };
}

// Aufgabe 3 — beide Pfadregeln beim Ziehen ohne Zurücklegen.
function generateAufgabe3() {
  const kandidaten = [];
  [5, 6, 9, 10, 16, 25].forEach((n) => {
    for (let r = 1; r <= n - 1; r++) {
      const proz = (200 * r * (n - r)) / (n * (n - 1));
      if (Number.isInteger(proz) && proz > 0 && proz < 100) kandidaten.push({ n, r });
    }
  });
  const wahl = ohneKollision(
    kandidaten,
    (c) => {
      const { n, r } = c, b = n - r;
      return [
        (200 * r * b) / (n * (n - 1)),        // gesuchter Wert
        (100 * r * b) / (n * (n - 1)),        // nur ein Pfad statt beider
        (200 * r * b) / (n * n),              // mit statt ohne Zurücklegen
        (100 * r * (r - 1)) / (n * (n - 1)),  // beide rot
        (100 * b * (b - 1)) / (n * (n - 1)),  // beide blau
        (100 * r) / n,
        (100 * b) / n,
      ];
    },
    kandidaten[0]
  );
  const n = wahl.n, r = wahl.r, b = n - r;
  const proz = (200 * r * b) / (n * (n - 1));

  return {
    promptHtml:
      `In einer Urne liegen <strong>${num(r)} rote</strong> und <strong>${num(b)} blaue</strong> Kugeln. ` +
      `Es werden nacheinander <strong>zwei Kugeln ohne Zurücklegen</strong> gezogen.<br>` +
      `Wie groß ist die Wahrscheinlichkeit, <strong>genau eine rote</strong> Kugel zu ziehen? Antwort in Prozent.`,
    correct: proz,
    tolerance: 0.05,
    placeholder: "Prozent",
    hinweis: (raw, val) => {
      if (Math.abs(val - proz / 2) < 0.05)
        return `Du hast nur den Pfad „rot, blau“ gerechnet. „blau, rot“ liefert ebenfalls genau eine rote Kugel — nach der 2. Pfadregel werden <strong>beide</strong> Pfade addiert.`;
      if (Math.abs(val - (200 * r * b) / (n * n)) < 0.05)
        return `Du hast in beiden Stufen mit dem Nenner ${num(n)} gerechnet — das gilt nur <em>mit</em> Zurücklegen. Ohne Zurücklegen sind im zweiten Zug nur noch ${num(n - 1)} Kugeln in der Urne.`;
      if (Math.abs(val - (100 * r * (r - 1)) / (n * (n - 1))) < 0.05)
        return `Das ist P(beide rot). Gefragt ist <em>genau eine</em> rote — also eine rote und eine blaue, in beliebiger Reihenfolge.`;
      if (Math.abs(val - (100 * r) / n) < 0.05)
        return `${num((100 * r) / n)} % ist P(rot) für einen einzelnen Zug. Das Experiment hat aber zwei Stufen.`;
      return `Es gibt zwei günstige Pfade: (rot, blau) und (blau, rot). Rechne jeden mit der 1. Pfadregel aus und addiere sie dann.`;
    },
    musterloesungHtml:
      `<strong>1. Günstige Pfade finden:</strong> „genau eine rote“ tritt bei (rot, blau) und bei (blau, rot) ein — zwei Pfade.<br>` +
      `<strong>2. Pfadregel (multiplizieren):</strong><br>` +
      `P(rot, blau) = ${faktor(r, n)} · ${faktor(b, n - 1)} = ${quot(r * b, n * (n - 1))}<br>` +
      `P(blau, rot) = ${faktor(b, n)} · ${faktor(r, n - 1)} = ${quot(b * r, n * (n - 1))}<br>` +
      `<strong>3. Pfadregel (addieren):</strong> P = ${quot(r * b, n * (n - 1))} + ${quot(b * r, n * (n - 1))} = ${quot(2 * r * b, n * (n - 1))} = ${num(proz / 100, 4)} = <strong>${num(proz)} %</strong><br>` +
      `<em>Merke:</em> Die beiden Pfade haben denselben Wert — Zähler und Nenner werden nur in anderer Reihenfolge multipliziert. Deshalb genügt es, einen zu rechnen und zu verdoppeln.`,
  };
}

// Aufgabe 4 — zweistufiger Baum mit ungleichen Ästen (beide Pfadregeln).
const A4_KONTEXTE = [
  {
    stufe1: (p) => `An <strong>${num(p)} %</strong> aller Tage regnet es in Lindberg.`,
    zweig1: (q) => `Bei Regen kommt der Schulbus mit einer Wahrscheinlichkeit von <strong>${num(q)} %</strong> zu spät`,
    zweig2: (q) => `bei trockenem Wetter nur mit <strong>${num(q)} %</strong>`,
    frage: "An wie viel Prozent aller Tage kommt der Bus zu spät?",
    a: "Regen", b: "trocken", treffer: "zu spät",
  },
  {
    stufe1: (p) => `Ein Betrieb lässt <strong>${num(p)} %</strong> seiner Bauteile auf Maschine A fertigen, den Rest auf Maschine B.`,
    zweig1: (q) => `Maschine A liefert <strong>${num(q)} %</strong> Ausschuss`,
    zweig2: (q) => `Maschine B <strong>${num(q)} %</strong>`,
    frage: "Wie viel Prozent aller Bauteile sind Ausschuss?",
    a: "Maschine A", b: "Maschine B", treffer: "Ausschuss",
  },
  {
    stufe1: (p) => `Bei einem Test bearbeiten <strong>${num(p)} %</strong> einer Klasse die schwere Variante, die übrigen die leichte.`,
    zweig1: (q) => `Von der schweren Variante werden <strong>${num(q)} %</strong> vollständig gelöst`,
    zweig2: (q) => `von der leichten <strong>${num(q)} %</strong>`,
    frage: "Wie viel Prozent der Klasse lösen ihre Variante vollständig?",
    a: "schwere Variante", b: "leichte Variante", treffer: "vollständig gelöst",
  },
];
function generateAufgabe4() {
  const kandidaten = [];
  for (let p = 20; p <= 80; p += 10) {
    for (let q1 = 20; q1 <= 90; q1 += 10) {
      for (let q2 = 10; q2 < q1; q2 += 10) {
        kandidaten.push({ p, q1, q2 });
      }
    }
  }
  const wahl = ohneKollision(
    kandidaten,
    (c) => {
      const g = (c.p * c.q1 + (100 - c.p) * c.q2) / 100;
      return [
        g,                                   // gesuchter Wert
        (c.q1 + c.q2) / 2,                   // der typische Mittelwert-Fehler
        (c.p * c.q1) / 100,                  // nur der erste Pfad
        ((100 - c.p) * c.q2) / 100,          // nur der zweite Pfad
        c.q1, c.q2, c.p, 100 - c.p,
        c.q1 + c.q2,                          // Äste addiert statt gewichtet
      ];
    },
    kandidaten[0]
  );
  const { p, q1, q2 } = wahl;
  const k = pick(A4_KONTEXTE);
  const a1 = (p * q1) / 100, a2 = ((100 - p) * q2) / 100, gesamt = a1 + a2;

  return {
    promptHtml:
      `${k.stufe1(p)} ${k.zweig1(q1)}, ${k.zweig2(q2)}.<br><strong>${k.frage}</strong>`,
    correct: gesamt,
    tolerance: 0.05,
    placeholder: "Prozent",
    hinweis: (raw, val) => {
      if (Math.abs(val - (q1 + q2) / 2) < 0.05)
        return `Du hast die beiden Prozentsätze gemittelt. Das wäre nur richtig, wenn beide Zweige gleich häufig wären — hier trägt „${k.a}“ aber ${num(p)} % und „${k.b}“ ${num(100 - p)} %. Jeder Ast muss mit dem Gewicht seines Zweigs multipliziert werden.`;
      if (Math.abs(val - a1) < 0.05)
        return `${num(a1, 2)} % ist nur der Pfad „${k.a}, ${k.treffer}“. Der zweite günstige Pfad „${k.b}, ${k.treffer}“ fehlt noch — nach der 2. Pfadregel wird addiert.`;
      if (Math.abs(val - a2) < 0.05)
        return `${num(a2, 2)} % ist nur der Pfad „${k.b}, ${k.treffer}“. Der Pfad über „${k.a}“ fehlt noch.`;
      if (Math.abs(val - (q1 + q2)) < 0.05)
        return `Die beiden Prozentsätze der 2. Stufe darf man nicht einfach addieren — sie gehören zu <em>verschiedenen</em> Zweigen und müssen erst mit deren Wahrscheinlichkeiten multipliziert werden.`;
      return `Zeichne den Baum: 1. Stufe ${num(p)} % / ${num(100 - p)} %, an jedem Knoten die 2. Stufe. Dann entlang der beiden „${k.treffer}“-Pfade multiplizieren und die Ergebnisse addieren.`;
    },
    musterloesungHtml:
      `<strong>1. Baum aufstellen:</strong> 1. Stufe „${k.a}“ ${num(p)} % und „${k.b}“ ${num(100 - p)} %; an jedem Knoten die 2. Stufe mit ${num(q1)} % bzw. ${num(q2)} % für „${k.treffer}“.<br>` +
      `<strong>2. Pfadregel (multiplizieren):</strong><br>` +
      `P(${k.a}, ${k.treffer}) = ${num(p / 100, 4)} · ${num(q1 / 100, 4)} = ${num(a1 / 100, 4)} = ${num(a1, 2)} %<br>` +
      `P(${k.b}, ${k.treffer}) = ${num((100 - p) / 100, 4)} · ${num(q2 / 100, 4)} = ${num(a2 / 100, 4)} = ${num(a2, 2)} %<br>` +
      `<strong>3. Pfadregel (addieren):</strong> P(${k.treffer}) = ${num(a1, 2)} % + ${num(a2, 2)} % = <strong>${num(gesamt, 2)} %</strong><br>` +
      `<em>Achtung:</em> Der Mittelwert (${num(q1)} % + ${num(q2)} %) : 2 = ${num((q1 + q2) / 2, 2)} % ist hier <strong>falsch</strong> — er würde beide Zweige gleich schwer gewichten.`,
  };
}

function initExercises() {
  mountUebungsaufgaben(document.getElementById("exercises-mount"), [
    { schwierigkeit: "einfach", titel: "Aufgabe 1 — wie viele Pfade?", generate: generateAufgabe1 },
    { schwierigkeit: "mittel", titel: "Aufgabe 2 — 1. Pfadregel", generate: generateAufgabe2 },
    { schwierigkeit: "schwierig", titel: "Aufgabe 3 — ohne Zurücklegen", generate: generateAufgabe3 },
    { schwierigkeit: "komplex", titel: "Aufgabe 4 — beide Pfadregeln", generate: generateAufgabe4 },
  ]);
}

// ================= Quizze =================

function initQuizzes() {
  mountQuiz(document.getElementById("quiz-baum"), {
    q: "Ein Würfel wird dreimal geworfen. Wie viele Pfade hat das Baumdiagramm?",
    options: ["18", "36", "216", "729"],
    correct: 2,
    explain: "Jede der 3 Stufen hat 6 Ausgänge: |Ω| = 6³ = 216. Die 18 wäre 6 · 3 — das zählt die Äste, nicht die Pfade. Die 729 wäre 3⁶, also Basis und Exponent vertauscht.",
  });
  mountQuiz(document.getElementById("quiz-produktregel"), {
    q: "In einer Urne sind 2 rote und 3 blaue Kugeln. Es wird zweimal mit Zurücklegen gezogen. Wie groß ist P(rot, rot)?",
    options: ["2 : 5", "4 : 25", "2 : 20", "4 : 10"],
    correct: 1,
    explain: "Mit Zurücklegen tragen beide Stufen dieselben Zahlen: P = 2 : 5 · 2 : 5 = 4 : 25 = 0,16. Zähler mal Zähler, Nenner mal Nenner — nicht nur der Zähler.",
  });
  mountQuiz(document.getElementById("quiz-summenregel"), {
    q: "Eine Münze wird viermal geworfen. Wie groß ist P(mindestens einmal Kopf)?",
    options: ["1 : 16", "4 : 16", "15 : 16", "1 : 2"],
    correct: 2,
    explain: "Das Gegenereignis „gar kein Kopf“ ist genau ein Pfad: P(Ē) = (1 : 2)⁴ = 1 : 16. Also P(E) = 1 − 1 : 16 = 15 : 16. Die 15 günstigen Pfade einzeln zu addieren führt zum selben Ergebnis, dauert aber deutlich länger.",
  });
  mountQuiz(document.getElementById("quiz-zuruecklegen"), {
    q: "In einer Urne sind 3 rote und 2 blaue Kugeln. Es wird zweimal ohne Zurücklegen gezogen. Wie groß ist P(rot, rot)?",
    options: ["9 : 25 = 0,36", "3 : 10 = 0,3", "3 : 5 = 0,6", "6 : 10 = 0,6"],
    correct: 1,
    explain: "P = 3 : 5 · 2 : 4 = 6 : 20 = 3 : 10 = 0,3. Die 9 : 25 wäre die Rechnung mit Zurücklegen; sie ist größer, weil dort die zweite rote Kugel nicht fehlt. Die 3 : 5 ist nur die erste Stufe.",
  });
  mountQuiz(document.getElementById("quiz-ungleich"), {
    q: "Eine Firma bezieht 80 % ihrer Schrauben von Werk A (2 % Ausschuss) und 20 % von Werk B (7 % Ausschuss). Wie hoch ist der Ausschussanteil insgesamt?",
    options: ["4,5 %", "3 %", "9 %", "1,8 %"],
    correct: 1,
    explain: "0,80 · 0,02 + 0,20 · 0,07 = 0,016 + 0,014 = 0,03, also 3 %. Der Mittelwert (2 % + 7 %) : 2 = 4,5 % wäre falsch: Werk A liefert viermal so viele Schrauben und zieht das Ergebnis zu sich herunter.",
  });
}

// ================= Start =================

initBaum();
initProduktregel();
initSummenregel();
initZurueckLegen();
initUngleich();
initExercises();
initQuizzes();
