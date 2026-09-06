// Selbstlernpfad "Bedingte Wahrscheinlichkeit und Unabhängigkeit"
// (Grundwissen Klasse 5-10). Rein clientseitiges Vanilla-JS, ohne Build-Schritt
// oder externe Bibliotheken.
//
// Leitgedanke: Eine Bedingung ändert nicht das Ereignis, sondern das GANZE, auf
// das man den Anteil bezieht. Deshalb wird in Abschnitt 1 die Grundmenge
// sichtbar zusammengeschoben, statt nur eine Formel hinzuschreiben. Alle Zahlen
// dieser Seite sind Anzahlen von Personen; die Wahrscheinlichkeiten entstehen
// ausschließlich durch Teilen zweier ganzer Zahlen — dadurch stimmt jede
// angezeigte Stelle wirklich, und "=" gegen "≈" lässt sich ehrlich entscheiden.
//
// Durchgehende Farbcodierung: Ereignis A grün, Bedingung B violett,
// Schnittmenge türkis, Fehlalarm orange.

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
// den Wert genau trifft — nicht, ob er ganzzahlig ist (0,25 ist exakt).
function zeichen(x, stellen = 2) {
  const f = Math.pow(10, stellen);
  return Math.abs(x - Math.round(x * f) / f) < 1e-12 ? "=" : "≈";
}
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function mischen(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function ggt(a, b) {
  return b ? ggt(b, a % b) : Math.abs(a);
}
function gekuerzt(z, n) {
  if (z === 0) return null;
  const g = ggt(z, n);
  return g > 1 ? [z / g, n / g] : null;
}
// Wahrscheinlichkeit in der Schreibweise "12 : 30"
function quot(z, n) {
  return num(z) + " : " + num(n);
}
// Dieselbe Zahl als Faktor in einem Produkt: ohne Klammern wäre
// "24 : 60 · 30 : 60" nicht eindeutig lesbar.
function faktor(z, n) {
  return '<span class="nw">(' + quot(z, n) + ")</span>";
}
// Anteil als Prozentzahl, mit ehrlichem Gleichheitszeichen
function proz(z, n, stellen = 1) {
  if (n === 0) return "—";
  const p = (100 * z) / n;
  return zeichen(p, stellen) + " " + num(p, stellen) + " %";
}
// Dieselbe Zahl ohne einleitendes Gleichheitszeichen — für Karten und für
// laufenden Text, wo "erkennt = 100 % der Kranken" falsch klänge.
function prozWert(z, n, stellen = 1) {
  if (n === 0) return "—";
  const p = (100 * z) / n;
  return (zeichen(p, stellen) === "=" ? "" : "≈ ") + num(p, stellen) + " %";
}
// Einzelner Zahlenwert (ohne Bruch davor): Das "≈" steht nur, wenn gerundet
// wird; ein einleitendes "=" liest sich auf einer Kennzahlenkarte wie ein
// Tippfehler.
function wert(x, stellen = 4) {
  return (zeichen(x, stellen) === "=" ? "" : "≈ ") + num(x, stellen);
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
function karte(klasse, name, wert) {
  return el("div", { class: "bw-karte " + klasse }, [
    el("span", { class: "name" }, name),
    el("span", { class: "wert" }, wert),
  ]);
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

// ---------- Vierfeldertafel als Baustein ----------

// Alle Auswertungen dieser Seite beruhen auf denselben vier Anzahlen.
function tafel(ab, anb, nab, nanb) {
  const zeileA = ab + anb, zeileNichtA = nab + nanb;
  const spalteB = ab + nab, spalteNichtB = anb + nanb;
  return { ab, anb, nab, nanb, zeileA, zeileNichtA, spalteB, spalteNichtB, n: zeileA + zeileNichtA };
}

function tafelHtml(t, namen, hervor = {}) {
  const z = (wert, klasse) => `<td class="${klasse || ""}">${num(wert)}</td>`;
  return (
    `<caption>${namen.titel || ""}</caption>` +
    `<tr><th></th><th>${namen.b}</th><th>nicht ${namen.b}</th><th>Summe</th></tr>` +
    `<tr><th>${namen.a}</th>${z(t.ab, hervor.ab)}${z(t.anb, hervor.anb)}${z(t.zeileA, "rand " + (hervor.zeileA || ""))}</tr>` +
    `<tr><th>nicht ${namen.a}</th>${z(t.nab, hervor.nab)}${z(t.nanb, hervor.nanb)}${z(t.zeileNichtA, "rand")}</tr>` +
    `<tr><th>Summe</th>${z(t.spalteB, "rand " + (hervor.spalteB || ""))}${z(t.spalteNichtB, "rand")}${z(t.n, "gesamt")}</tr>`
  );
}

// ================= 1. Die verkleinerte Grundmenge =================

// Eine Klasse als Liste von Kindern mit zwei Ja-Nein-Merkmalen. Die Anzahlen
// werden aus einer gefilterten Kandidatenliste gezogen (nie durch Verwerfen),
// und zwar so, dass sich der Anteil der Brillenträger unter den Radfahrenden
// deutlich vom Anteil in der ganzen Klasse unterscheidet — sonst wäre am
// Abschnitt nichts zu sehen.
function neueKlasse() {
  const kandidaten = [];
  for (let ab = 2; ab <= 8; ab++) {
    for (let anb = 1; anb <= 8; anb++) {
      for (let nab = 2; nab <= 8; nab++) {
        for (let nanb = 1; nanb <= 8; nanb++) {
          const t = tafel(ab, anb, nab, nanb);
          if (t.n < 18 || t.n > 28) continue;
          // Der bedingte Anteil muss sich vom unbedingten deutlich abheben ...
          if (Math.abs(t.ab / t.spalteB - t.zeileA / t.n) < 0.12) continue;
          // ... und P(A|B) darf nicht zufällig mit P(B|A) zusammenfallen.
          if (Math.abs(t.ab / t.spalteB - t.ab / t.zeileA) < 0.06) continue;
          kandidaten.push([ab, anb, nab, nanb]);
        }
      }
    }
  }
  const [ab, anb, nab, nanb] = pick(kandidaten);
  const kinder = [];
  for (let i = 0; i < ab; i++) kinder.push({ brille: true, rad: true });
  for (let i = 0; i < anb; i++) kinder.push({ brille: true, rad: false });
  for (let i = 0; i < nab; i++) kinder.push({ brille: false, rad: true });
  for (let i = 0; i < nanb; i++) kinder.push({ brille: false, rad: false });
  return mischen(kinder);
}

let reKlasse = neueKlasse();

const RE_BEDINGUNGEN = {
  alle: { name: "die ganze Klasse", kurz: "Ω", drin: () => true },
  rad: { name: "die Radfahrenden", kurz: "R", drin: (k) => k.rad },
  "kein-rad": { name: "die ohne Rad", kurz: "R̄", drin: (k) => !k.rad },
};

function reKind(svg, x, y, kind, drinnen) {
  const zus = drinnen ? "" : " draussen";
  svg.appendChild(svgEl("circle", {
    cx: x.toFixed(2), cy: y.toFixed(2), r: 11,
    class: "bw-kopf " + (kind.brille ? "a" : "nicht-a") + (drinnen ? "" : " draussen"),
  }));
  if (kind.brille) {
    svg.appendChild(svgEl("circle", { cx: (x - 4).toFixed(2), cy: (y - 1).toFixed(2), r: 3.2, class: "bw-brille" + zus }));
    svg.appendChild(svgEl("circle", { cx: (x + 4).toFixed(2), cy: (y - 1).toFixed(2), r: 3.2, class: "bw-brille" + zus }));
    svg.appendChild(svgEl("line", {
      x1: (x - 0.8).toFixed(2), y1: (y - 1).toFixed(2), x2: (x + 0.8).toFixed(2), y2: (y - 1).toFixed(2),
      class: "bw-brille" + zus,
    }));
  }
  if (kind.rad) {
    // Ein kleiner Reifen unter dem Kopf kennzeichnet die Radfahrenden.
    svg.appendChild(svgEl("circle", { cx: x.toFixed(2), cy: (y + 17).toFixed(2), r: 4.6, class: "bw-brille" + zus }));
  }
}

function renderReduziert() {
  const schluessel = document.getElementById("re-bedingung").value;
  const bed = RE_BEDINGUNGEN[schluessel];

  // Die Bedingung nach vorn sortieren: Die neue Grundmenge wird dadurch zu
  // einem zusammenhängenden Block, den man umrahmen kann.
  const drin = reKlasse.filter((k) => bed.drin(k));
  const draussen = reKlasse.filter((k) => !bed.drin(k));
  const sortiert = drin.slice().sort((a, b) => Number(b.brille) - Number(a.brille)).concat(draussen);

  const proReihe = 8, dx = 46, dy = 52, x0 = 34, y0 = 46;
  const reihen = Math.ceil(sortiert.length / proReihe);
  const W = x0 + (proReihe - 1) * dx + 34;
  const H = y0 + (reihen - 1) * dy + 56;
  const svg = neueFlaeche(W, H);

  const platz = (i) => ({ x: x0 + (i % proReihe) * dx, y: y0 + Math.floor(i / proReihe) * dy });

  // Rahmen um die Bedingung — reihenweise, damit er auch bei Umbruch stimmt.
  if (schluessel !== "alle" && drin.length) {
    for (let r = 0; r * proReihe < drin.length; r++) {
      const von = r * proReihe;
      const bis = Math.min(drin.length, von + proReihe) - 1;
      const a = platz(von), b = platz(bis);
      svg.appendChild(svgEl("rect", {
        x: (a.x - 20).toFixed(2), y: (a.y - 20).toFixed(2),
        width: (b.x - a.x + 40).toFixed(2), height: 44, rx: 10, class: "bw-rahmen",
      }));
    }
    const a = platz(0);
    svg.appendChild(svgText(a.x - 20 + 4, a.y - 26, "Bedingung: " + bed.name + " (" + num(drin.length) + ")",
      { class: "bw-rahmentext", "text-anchor": "start" }));
  } else {
    svg.appendChild(svgText(x0 - 20 + 4, y0 - 26, "die ganze Klasse (" + num(reKlasse.length) + ")",
      { class: "bw-gruppentext", "text-anchor": "start" }));
  }

  sortiert.forEach((kind, i) => {
    const p = platz(i);
    reKind(svg, p.x, p.y, kind, schluessel === "alle" || bed.drin(kind));
  });
  svg.appendChild(svgText(W / 2, H - 8, "grüner Kopf = Brille · Reifen darunter = fährt Rad", { class: "bw-gruppentext" }));

  const mount = document.getElementById("re-mount");
  mount.innerHTML = "";
  mount.appendChild(svg);

  const n = reKlasse.length;
  const nBrille = reKlasse.filter((k) => k.brille).length;
  const nRad = reKlasse.filter((k) => k.rad).length;
  const nB = drin.length;
  const nSchnitt = drin.filter((k) => k.brille).length;
  const nBrilleUndRad = reKlasse.filter((k) => k.brille && k.rad).length;

  const karten = document.getElementById("re-karten");
  karten.innerHTML = "";
  karten.appendChild(karte("", "Klasse insgesamt", num(n)));
  karten.appendChild(karte("b", "Bedingung |B|", num(nB)));
  karten.appendChild(karte("schnitt", "davon mit Brille", num(nSchnitt)));
  karten.appendChild(karte("a", schluessel === "alle" ? "P(Brille)" : "P(Brille|B)",
    quot(nSchnitt, nB) + " " + zeichen(nSchnitt / nB, 4) + " " + num(nSchnitt / nB, 4)));

  const pUnbedingt = nBrille / n;
  let html =
    `Ohne Bedingung: <span class="wa">P(Brille) = ${quot(nBrille, n)} ${zeichen(pUnbedingt, 4)} ${num(pUnbedingt, 4)}</span> ` +
    `(${prozWert(nBrille, n)})<br>`;
  if (schluessel === "alle") {
    html += `Wähle oben eine Bedingung — dann schrumpft die Grundmenge, und der Nenner wird kleiner.`;
  } else {
    const pBedingt = nSchnitt / nB;
    html +=
      `Mit Bedingung: <span class="wb">P(Brille | ${bed.name}) = ${quot(nSchnitt, nB)} ${zeichen(pBedingt, 4)} ${num(pBedingt, 4)}</span> ` +
      `(${prozWert(nSchnitt, nB)})<br>` +
      `Der Zähler zählt die Kinder mit <span class="ws">beiden</span> Merkmalen, der Nenner nur noch ${num(nB)} statt ${num(n)}.<br>` +
      `Umgekehrt gefragt: <span class="wo">P(Rad | Brille) = ${quot(nBrilleUndRad, nBrille)} ${zeichen(nBrilleUndRad / nBrille, 4)} ${num(nBrilleUndRad / nBrille, 4)}</span> ` +
      `(${prozWert(nBrilleUndRad, nBrille)}) — gleicher Zähler, anderer Nenner, anderes Ergebnis.`;
  }
  document.getElementById("re-bilanz").innerHTML = html;

  document.getElementById("re-text").textContent = schluessel === "alle"
    ? "Alle Kinder zählen mit. Der Nenner ist die ganze Klasse."
    : "Die umrahmten Kinder sind die neue Grundmenge. Alles außerhalb des Rahmens zählt für P(… | B) gar nicht mehr mit.";
}

function initReduziert() {
  document.getElementById("re-bedingung").addEventListener("change", renderReduziert);
  document.getElementById("re-neu").addEventListener("click", () => {
    reKlasse = neueKlasse();
    renderReduziert();
  });
  renderReduziert();
}

// ================= 2. Die Vierfeldertafel =================

function renderVierfeldertafel() {
  const ab = begrenzt("vf-ab", Number(document.getElementById("vf-ab").value), 0, 40);
  const anb = begrenzt("vf-anb", Number(document.getElementById("vf-anb").value), 0, 40);
  const nab = begrenzt("vf-nab", Number(document.getElementById("vf-nab").value), 0, 40);
  const nanb = begrenzt("vf-nanb", Number(document.getElementById("vf-nanb").value), 0, 40);
  ["ab", "anb", "nab", "nanb"].forEach((k, i) => {
    document.getElementById("vf-" + k + "-anzeige").textContent = num([ab, anb, nab, nanb][i]);
  });
  const t = tafel(ab, anb, nab, nanb);

  document.getElementById("vf-tafel").innerHTML = tafelHtml(t,
    { titel: "Anzahlen: A = trägt eine Brille, B = fährt Rad", a: "A", b: "B" },
    { ab: "schnitt", spalteB: "bedingung" });

  const karten = document.getElementById("vf-karten");
  karten.innerHTML = "";
  karten.appendChild(karte("a", "P(A)", t.n ? quot(t.zeileA, t.n) + " " + zeichen(t.zeileA / t.n, 4) + " " + num(t.zeileA / t.n, 4) : "—"));
  karten.appendChild(karte("b", "P(B)", t.n ? quot(t.spalteB, t.n) + " " + zeichen(t.spalteB / t.n, 4) + " " + num(t.spalteB / t.n, 4) : "—"));
  karten.appendChild(karte("schnitt", "P(A ∩ B)", t.n ? quot(t.ab, t.n) + " " + zeichen(t.ab / t.n, 4) + " " + num(t.ab / t.n, 4) : "—"));
  karten.appendChild(karte("b", "P(A|B)", t.spalteB ? quot(t.ab, t.spalteB) + " " + zeichen(t.ab / t.spalteB, 4) + " " + num(t.ab / t.spalteB, 4) : "—"));
  karten.appendChild(karte("a", "P(B|A)", t.zeileA ? quot(t.ab, t.zeileA) + " " + zeichen(t.ab / t.zeileA, 4) + " " + num(t.ab / t.zeileA, 4) : "—"));

  const bilanz = document.getElementById("vf-bilanz");
  if (t.n === 0) {
    bilanz.innerHTML = `Ohne Personen gibt es nichts zu teilen — stell mindestens einen Regler auf einen Wert größer als 0.`;
  } else if (t.spalteB === 0 || t.zeileA === 0) {
    bilanz.innerHTML =
      `Eine der Randsummen ist <span class="wr">0</span>. Durch 0 lässt sich nicht teilen: ` +
      `Eine Bedingung, die nie eintritt, kann man auch nicht voraussetzen.`;
  } else {
    const gAB = gekuerzt(t.ab, t.spalteB), gBA = gekuerzt(t.ab, t.zeileA);
    bilanz.innerHTML =
      `<span class="ws">Dieselbe Zelle ${num(t.ab)}</span>, zwei verschiedene Nenner:<br>` +
      `<span class="wb">P(A|B) = ${num(t.ab)} : ${num(t.spalteB)}` + (gAB ? ` = ${quot(gAB[0], gAB[1])}` : "") +
      ` ${zeichen(t.ab / t.spalteB, 4)} ${num(t.ab / t.spalteB, 4)}</span> — geteilt durch die <em>Spaltensumme</em> von B<br>` +
      `<span class="wa">P(B|A) = ${num(t.ab)} : ${num(t.zeileA)}` + (gBA ? ` = ${quot(gBA[0], gBA[1])}` : "") +
      ` ${zeichen(t.ab / t.zeileA, 4)} ${num(t.ab / t.zeileA, 4)}</span> — geteilt durch die <em>Zeilensumme</em> von A<br>` +
      `Probe über die Pfadregel: P(A ∩ B) = P(B) · P(A|B) = ` +
      `${num(t.spalteB / t.n, 4)} · ${num(t.ab / t.spalteB, 4)} ${zeichen(t.ab / t.n, 4)} ${num(t.ab / t.n, 4)} ✓`;
  }

  document.getElementById("vf-text").textContent =
    t.spalteB && t.zeileA && t.ab / t.spalteB === t.ab / t.zeileA
      ? "Hier sind P(A|B) und P(B|A) ausnahmsweise gleich — das liegt allein daran, dass Zeilen- und Spaltensumme gerade übereinstimmen."
      : "Vergleiche die beiden bedingten Wahrscheinlichkeiten: Der Zähler ist derselbe, nur der Nenner wechselt.";
}

function initVierfeldertafel() {
  ["vf-ab", "vf-anb", "vf-nab", "vf-nanb"].forEach((id) =>
    document.getElementById(id).addEventListener("input", renderVierfeldertafel));
  renderVierfeldertafel();
}

// ================= 3. Denselben Sachverhalt, zwei Bäume =================

// Ein zweistufiger Baum mit vier Blättern, gezeichnet aus vier Anzahlen.
// stufe1 = [{name, anzahl}], stufe2Namen = [name, name]; die Anzahlen der
// zweiten Stufe stehen in zellen[i][j].
function zeichneBaum(svg, x0, y0, dx, dy, titel, stufe1, stufe2Namen, zellen, n, klasse1, klasse2) {
  svg.appendChild(svgText(x0 + dx, y0 - 26, titel, { class: "bw-titel" }));
  const wurzel = { x: x0, y: y0 + 1.5 * dy };
  svg.appendChild(svgEl("circle", { cx: wurzel.x, cy: wurzel.y, r: 3.4, class: "bw-knoten" }));
  stufe1.forEach((s1, i) => {
    const knoten = { x: x0 + dx, y: y0 + (i === 0 ? 0.5 : 2.5) * dy };
    svg.appendChild(svgEl("line", {
      x1: wurzel.x, y1: wurzel.y, x2: knoten.x, y2: knoten.y, class: "bw-ast " + klasse1,
    }));
    // Beschriftung senkrecht neben den Ast, steigende oberhalb, fallende
    // unterhalb — sonst läge sie auf der Linie.
    const ax = knoten.x - wurzel.x, ay = knoten.y - wurzel.y;
    const laenge = Math.hypot(ax, ay) || 1, vz = ay > 0 ? -1 : 1;
    svg.appendChild(svgText(
      wurzel.x + 0.5 * ax + vz * (ay / laenge) * 12,
      wurzel.y + 0.5 * ay - vz * (ax / laenge) * 12 + 4,
      quot(s1.anzahl, n), { class: "bw-astbeschriftung " + klasse1 }));
    svg.appendChild(svgEl("circle", { cx: knoten.x, cy: knoten.y, r: 3.4, class: "bw-knoten" }));
    svg.appendChild(svgText(knoten.x, knoten.y - 12, s1.name, { class: "bw-astbeschriftung " + klasse1 }));

    stufe2Namen.forEach((name2, j) => {
      const blatt = { x: x0 + 2 * dx, y: y0 + (i * 2 + j) * dy };
      svg.appendChild(svgEl("line", {
        x1: knoten.x, y1: knoten.y, x2: blatt.x, y2: blatt.y, class: "bw-ast " + klasse2,
      }));
      const bx = blatt.x - knoten.x, by = blatt.y - knoten.y;
      const l2 = Math.hypot(bx, by) || 1, v2 = by > 0 ? -1 : 1;
      svg.appendChild(svgText(
        knoten.x + 0.5 * bx + v2 * (by / l2) * 11,
        knoten.y + 0.5 * by - v2 * (bx / l2) * 11 + 4,
        s1.anzahl ? quot(zellen[i][j], s1.anzahl) : "—", { class: "bw-astbeschriftung " + klasse2 }));
      svg.appendChild(svgEl("circle", { cx: blatt.x, cy: blatt.y, r: 3.4, class: "bw-knoten" }));
      svg.appendChild(svgText(blatt.x + 8, blatt.y - 1, s1.name + ", " + name2,
        { class: "bw-blatt", "text-anchor": "start" }));
      svg.appendChild(svgText(blatt.x + 8, blatt.y + 12, quot(zellen[i][j], n),
        { class: "bw-blattwert", "text-anchor": "start" }));
    });
  });
}

function renderUmdrehen() {
  const ab = begrenzt("bu-ab", Number(document.getElementById("bu-ab").value), 1, 40);
  const anb = begrenzt("bu-anb", Number(document.getElementById("bu-anb").value), 1, 40);
  const nab = begrenzt("bu-nab", Number(document.getElementById("bu-nab").value), 1, 40);
  const nanb = begrenzt("bu-nanb", Number(document.getElementById("bu-nanb").value), 1, 40);
  ["ab", "anb", "nab", "nanb"].forEach((k, i) => {
    document.getElementById("bu-" + k + "-anzeige").textContent = num([ab, anb, nab, nanb][i]);
  });
  const t = tafel(ab, anb, nab, nanb);

  const dx = 132, dy = 46, W = 2 * (2 * dx + 150) + 40, H = 4 * dy + 66;
  const svg = neueFlaeche(W, H);
  // Links: zuerst nach A verzweigen. Rechts: zuerst nach B.
  zeichneBaum(svg, 26, 38, dx, dy, "zuerst nach A",
    [{ name: "A", anzahl: t.zeileA }, { name: "nicht A", anzahl: t.zeileNichtA }],
    ["B", "nicht B"], [[t.ab, t.anb], [t.nab, t.nanb]], t.n, "a", "b");
  zeichneBaum(svg, 26 + 2 * dx + 150 + 40, 38, dx, dy, "zuerst nach B",
    [{ name: "B", anzahl: t.spalteB }, { name: "nicht B", anzahl: t.spalteNichtB }],
    ["A", "nicht A"], [[t.ab, t.nab], [t.anb, t.nanb]], t.n, "b", "a");

  const mount = document.getElementById("bu-mount");
  mount.innerHTML = "";
  mount.appendChild(svg);

  document.getElementById("bu-bilanz").innerHTML =
    `Beide Bäume beschreiben dieselben ${num(t.n)} Personen. Der Pfad zu „beide Merkmale“ trägt links wie rechts ` +
    `<span class="ws">${quot(t.ab, t.n)}</span> — nur zusammengesetzt aus verschiedenen Faktoren:<br>` +
    `links <span class="wa">${faktor(t.zeileA, t.n)}</span> · <span class="wb">${faktor(t.ab, t.zeileA)}</span>, ` +
    `rechts <span class="wb">${faktor(t.spalteB, t.n)}</span> · <span class="wa">${faktor(t.ab, t.spalteB)}</span>.<br>` +
    `An der zweiten Stufe steht links <span class="wb">P(B|A) ${zeichen(t.ab / t.zeileA, 4)} ${num(t.ab / t.zeileA, 4)}</span>, ` +
    `rechts <span class="wa">P(A|B) ${zeichen(t.ab / t.spalteB, 4)} ${num(t.ab / t.spalteB, 4)}</span> — ` +
    (t.ab / t.zeileA === t.ab / t.spalteB
      ? `hier ausnahmsweise gleich, weil Zeilen- und Spaltensumme übereinstimmen.`
      : `zwei verschiedene Zahlen für denselben Sachverhalt.`);

  document.getElementById("bu-text").textContent =
    "Vergleiche die vier Pfadwerte ganz rechts in beiden Bäumen: Sie sind paarweise gleich. Die Astbeschriftungen sind es nicht.";
}

function initUmdrehen() {
  ["bu-ab", "bu-anb", "bu-nab", "bu-nanb"].forEach((id) =>
    document.getElementById(id).addEventListener("input", renderUmdrehen));
  renderUmdrehen();
}

// ================= 4. Stochastische Unabhängigkeit =================

// Feste Randsummen: 60 Personen, 24-mal A, 30-mal B. Damit ist der
// unabhängige Wert der Schnittzelle 24 · 30 : 60 = 12 — eine ganze Zahl, und
// nur deshalb lässt sich Unabhängigkeit hier exakt einstellen.
const UA_N = 60, UA_A = 24, UA_B = 30;
const UA_UNABHAENGIG = (UA_A * UA_B) / UA_N;

function renderUnabhaengig() {
  const grenzeUnten = Math.max(0, UA_A + UA_B - UA_N) - UA_UNABHAENGIG;
  const grenzeOben = Math.min(UA_A, UA_B) - UA_UNABHAENGIG;
  const schub = begrenzt("ua-schub", Number(document.getElementById("ua-schub").value), grenzeUnten, grenzeOben);
  const ab = UA_UNABHAENGIG + schub;
  const t = tafel(ab, UA_A - ab, UA_B - ab, UA_N - UA_A - UA_B + ab);
  document.getElementById("ua-schub-anzeige").textContent =
    (schub === 0 ? "±0" : (schub > 0 ? "+" : "−") + num(Math.abs(schub))) + " gegenüber dem unabhängigen Fall";

  const unabhaengig = t.ab * t.n === t.zeileA * t.spalteB;
  document.getElementById("ua-tafel").innerHTML = tafelHtml(t,
    { titel: "A = trägt eine Brille, B = fährt Rad · die Randsummen bleiben fest", a: "A", b: "B" },
    { ab: "schnitt" });

  // Die zweite Stufe beider Teilbäume nebeneinander: Bei Unabhängigkeit
  // tragen sie dieselben Zahlen — genau daran erkennt man sie im Baum.
  const dx = 128, dy = 44, W = 2 * dx + 190, H = 4 * dy + 66;
  const svg = neueFlaeche(W, H);
  zeichneBaum(svg, 26, 44, dx, dy, "oben P(B | A), unten P(B | nicht A)",
    [{ name: "A", anzahl: t.zeileA }, { name: "nicht A", anzahl: t.zeileNichtA }],
    ["B", "nicht B"], [[t.ab, t.anb], [t.nab, t.nanb]], t.n, "a", "b");
  const mount = document.getElementById("ua-mount");
  mount.innerHTML = "";
  mount.appendChild(svg);

  const pA = t.zeileA / t.n, pB = t.spalteB / t.n, pAB = t.ab / t.n, produkt = pA * pB;
  const karten = document.getElementById("ua-karten");
  karten.innerHTML = "";
  karten.appendChild(karte("schnitt", "P(A ∩ B)", quot(t.ab, t.n) + " " + zeichen(pAB, 4) + " " + num(pAB, 4)));
  karten.appendChild(karte("", "P(A) · P(B)", wert(produkt)));
  karten.appendChild(karte("b", "P(B|A)", quot(t.ab, t.zeileA) + " " + zeichen(t.ab / t.zeileA, 4) + " " + num(t.ab / t.zeileA, 4)));
  karten.appendChild(karte("b", "P(B | nicht A)", quot(t.nab, t.zeileNichtA) + " " + zeichen(t.nab / t.zeileNichtA, 4) + " " + num(t.nab / t.zeileNichtA, 4)));

  document.getElementById("ua-bilanz").innerHTML =
    `<span class="${unabhaengig ? "wa" : "wo"}"><span class="bw-urteil ${unabhaengig ? "ja" : "nein"}">` +
    `${unabhaengig ? "stochastisch unabhängig" : "abhängig"}</span></span><br>` +
    `<span class="ws">P(A ∩ B) = ${quot(t.ab, t.n)} ${zeichen(pAB, 4)} ${num(pAB, 4)}</span> gegen ` +
    `<span class="wb">P(A) · P(B) = ${faktor(t.zeileA, t.n)} · ${faktor(t.spalteB, t.n)} ${zeichen(produkt, 4)} ${num(produkt, 4)}</span><br>` +
    (unabhaengig
      ? `Beide Seiten stimmen überein. Im Baum sieht man dasselbe: An <em>beiden</em> Knoten der ersten Stufe steht ` +
        `an der zweiten Stufe dieselbe Zahl — ob jemand A ist oder nicht, ändert an der Wahrscheinlichkeit für B nichts.`
      : `Die beiden Seiten unterscheiden sich um <span class="wo">${num(Math.abs(pAB - produkt), 4)}</span>. ` +
        `Im Baum trägt der obere Knoten <span class="wb">${quot(t.ab, t.zeileA)}</span>, der untere ` +
        `<span class="wb">${quot(t.nab, t.zeileNichtA)}</span> — die Bedingung ändert also etwas, und genau das heißt abhängig.`);

  document.getElementById("ua-text").textContent = unabhaengig
    ? "Achte auf die beiden Astwerte der zweiten Stufe: Sie sind gleich. Das ist Unabhängigkeit im Bild."
    : "Schiebe den Regler auf ±0 — dann werden die beiden Astwerte der zweiten Stufe gleich.";
}

function initUnabhaengig() {
  document.getElementById("ua-schub").addEventListener("input", renderUnabhaengig);
  document.getElementById("ua-unabhaengig").addEventListener("click", () => {
    document.getElementById("ua-schub").value = "0";
    renderUnabhaengig();
  });
  renderUnabhaengig();
}

// ================= 5. Die seltene Krankheit =================

const BR_BEVOELKERUNG = 10000;

function renderBasisrate() {
  const kranke = begrenzt("br-kranke", Number(document.getElementById("br-kranke").value), 1, 1000);
  const sens = begrenzt("br-sens", Number(document.getElementById("br-sens").value), 50, 100);
  const falsch = begrenzt("br-falsch", Number(document.getElementById("br-falsch").value), 0, 20);
  document.getElementById("br-kranke-anzeige").textContent = num(kranke) + " von " + num(BR_BEVOELKERUNG);
  document.getElementById("br-sens-anzeige").textContent = num(sens) + " %";
  document.getElementById("br-falsch-anzeige").textContent = num(falsch) + " %";

  const gesunde = BR_BEVOELKERUNG - kranke;
  // Auf ganze Personen gerundet — die Tafel zählt Menschen, keine Bruchteile.
  const richtigPositiv = Math.round((kranke * sens) / 100);
  const falschPositiv = Math.round((gesunde * falsch) / 100);
  const positiv = richtigPositiv + falschPositiv;
  const t = tafel(richtigPositiv, kranke - richtigPositiv, falschPositiv, gesunde - falschPositiv);

  // Zwei Balken: oben die ganze Bevölkerung, unten nur die positiv Getesteten.
  const B = 700, H = 196, x0 = 24, breite = B - 2 * x0;
  const svg = neueFlaeche(B, H);
  const anteilKrank = kranke / BR_BEVOELKERUNG;
  svg.appendChild(svgText(x0, 18, "alle " + num(BR_BEVOELKERUNG) + " Personen", { class: "bw-achsentext", "text-anchor": "start" }));
  svg.appendChild(svgEl("rect", { x: x0, y: 26, width: (breite * anteilKrank).toFixed(2), height: 34, class: "bw-feld bw-feld-krank-pos" }));
  svg.appendChild(svgEl("rect", { x: (x0 + breite * anteilKrank).toFixed(2), y: 26, width: (breite * (1 - anteilKrank)).toFixed(2), height: 34, class: "bw-feld bw-feld-gesund-neg" }));
  svg.appendChild(svgEl("rect", { x: x0, y: 26, width: breite, height: 34, class: "bw-feldrahmen" }));
  const markeX = x0 + (breite * anteilKrank) / 2;
  svg.appendChild(svgEl("line", { x1: markeX.toFixed(2), y1: 26, x2: markeX.toFixed(2), y2: 78, class: "bw-lupe" }));
  svg.appendChild(svgText(markeX + 6, 90, num(kranke) + " krank", { class: "bw-achsentext", "text-anchor": "start" }));
  svg.appendChild(svgText(B - x0, 90, num(gesunde) + " gesund", { class: "bw-achsentext", "text-anchor": "end" }));

  svg.appendChild(svgText(x0, 120, "nur die " + num(positiv) + " positiv Getesteten — vergrößert", { class: "bw-achsentext", "text-anchor": "start" }));
  const anteilRichtig = positiv ? richtigPositiv / positiv : 0;
  svg.appendChild(svgEl("rect", { x: x0, y: 128, width: (breite * anteilRichtig).toFixed(2), height: 34, class: "bw-feld bw-feld-krank-pos" }));
  svg.appendChild(svgEl("rect", { x: (x0 + breite * anteilRichtig).toFixed(2), y: 128, width: (breite * (1 - anteilRichtig)).toFixed(2), height: 34, class: "bw-feld bw-feld-gesund-pos" }));
  svg.appendChild(svgEl("rect", { x: x0, y: 128, width: breite, height: 34, class: "bw-feldrahmen" }));
  // Beschriftung unter den Balken, damit sie auch bei einem schmalen
  // Abschnitt nicht abgeschnitten wird.
  svg.appendChild(svgText(x0, 174, num(richtigPositiv) + " wirklich krank", { class: "bw-achsentext", "text-anchor": "start" }));
  svg.appendChild(svgText(B - x0, 174, num(falschPositiv) + " Fehlalarm", { class: "bw-achsentext", "text-anchor": "end" }));
  svg.appendChild(svgText(B / 2, 174, "(derselbe Personenkreis wie der grüne Streifen oben, auf volle Breite gezogen)",
    { class: "bw-achsentext" }));
  const mount = document.getElementById("br-mount");
  mount.innerHTML = "";
  mount.appendChild(svg);

  document.getElementById("br-tafel").innerHTML = tafelHtml(t,
    { titel: "Anzahlen: A = krank, B = Test positiv", a: "krank", b: "Test +" },
    { ab: "schnitt", nab: "alarm", spalteB: "bedingung" });

  const karten = document.getElementById("br-karten");
  karten.innerHTML = "";
  karten.appendChild(karte("a", "P(Test + | krank)", prozWert(richtigPositiv, kranke)));
  karten.appendChild(karte("alarm", "P(Test + | gesund)", prozWert(falschPositiv, gesunde)));
  karten.appendChild(karte("b", "positiv insgesamt", num(positiv)));
  karten.appendChild(karte("schnitt", "P(krank | Test +)", prozWert(richtigPositiv, positiv)));

  const rundungsnote = Math.abs((100 * richtigPositiv) / kranke - sens) > 0.05 || Math.abs((100 * falschPositiv) / gesunde - falsch) > 0.05
    ? `<br><span class="wo">Hinweis:</span> Die Tafel zählt <em>ganze Personen</em>. Deshalb weichen die Quoten in den Karten ` +
      `leicht von den Reglerwerten ab — ${num(sens)} % von ${num(kranke)} Kranken sind ${num((kranke * sens) / 100, 2)} Personen, ` +
      `gerundet ${num(richtigPositiv)}.`
    : "";
  document.getElementById("br-bilanz").innerHTML = positiv === 0
    ? `Bei diesen Einstellungen schlägt der Test bei niemandem an — dann gibt es auch niemanden, über den man etwas aussagen könnte.`
    : `<span class="wa">Der Test ist gut:</span> Er erkennt ${prozWert(richtigPositiv, kranke)} der Kranken und ` +
      `schlägt nur bei ${prozWert(falschPositiv, gesunde)} der Gesunden fälschlich an.<br>` +
      `<span class="wo">Trotzdem:</span> Unter den ${num(positiv)} positiv Getesteten sind nur ` +
      `<span class="ws">${num(richtigPositiv)}</span> wirklich krank, also ` +
      `<span class="ws">P(krank | Test +) = ${num(richtigPositiv)} : ${num(positiv)} ${proz(richtigPositiv, positiv)}</span>.<br>` +
      `Der Grund steht in den Anzahlen: ${num(falsch)} % von ${num(gesunde)} Gesunden sind ` +
      `<span class="wo">${num(falschPositiv)}</span> Fehlalarme — mehr, als es überhaupt Kranke gibt, sobald die Krankheit selten ist.` +
      rundungsnote;

  document.getElementById("br-text").textContent = richtigPositiv < falschPositiv
    ? "Die Mehrheit der positiv Getesteten ist gesund. Ein positiver Test ist hier ein Anlass zur genaueren Untersuchung — keine Diagnose."
    : "Jetzt ist die Krankheit häufig genug, dass ein positiver Test tatsächlich für „krank“ spricht.";
}

function initBasisrate() {
  ["br-kranke", "br-sens", "br-falsch"].forEach((id) =>
    document.getElementById(id).addEventListener("input", renderBasisrate));
  renderBasisrate();
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
  const gewaehlt = sauber.length ? pick(sauber) : notfall;
  // Eine leere Kandidatenliste ist ein Programmierfehler, kein Sonderfall:
  // Sie würde später beim Auspacken der Werte eine unverständliche Meldung
  // erzeugen. Lieber hier laut werden.
  if (gewaehlt === undefined) throw new Error("Aufgabengenerator ohne gültige Kandidaten");
  return gewaehlt;
}

// Die Zahlen aller vier Aufgaben stammen aus derselben Sachlage: eine Umfrage
// mit zwei Ja-Nein-Merkmalen. Damit bleiben die Aufgaben untereinander
// vergleichbar und die Lösungen ganzzahlig.
const AUFGABEN_KONTEXTE = [
  {
    wer: "Jugendliche", kurzA: "Instrument", kurzB: "Sportverein",
    einleitung: "wer ein Instrument spielt (A) und wer im Sportverein ist (B)",
    frageAB: "Wie viel Prozent derjenigen, die im Sportverein sind, spielen auch ein Instrument?",
    frageBA: "Wie viel Prozent derjenigen, die ein Instrument spielen, sind auch im Sportverein?",
    satzA: "spielen ein Instrument", satzB: "sind im Sportverein",
  },
  {
    wer: "Schülerinnen und Schüler", kurzA: "Brille", kurzB: "Rad",
    einleitung: "wer eine Brille trägt (A) und wer mit dem Rad zur Schule fährt (B)",
    frageAB: "Wie viel Prozent derjenigen, die mit dem Rad zur Schule fahren, tragen auch eine Brille?",
    frageBA: "Wie viel Prozent derjenigen, die eine Brille tragen, fahren auch mit dem Rad zur Schule?",
    satzA: "tragen eine Brille", satzB: "fahren mit dem Rad zur Schule",
  },
  {
    wer: "Befragte", kurzA: "Hund", kurzB: "Land",
    einleitung: "wer einen Hund hat (A) und wer auf dem Land wohnt (B)",
    frageAB: "Wie viel Prozent derjenigen, die auf dem Land wohnen, haben auch einen Hund?",
    frageBA: "Wie viel Prozent derjenigen, die einen Hund haben, wohnen auch auf dem Land?",
    satzA: "haben einen Hund", satzB: "wohnen auf dem Land",
  },
];

function tafelText(t, k) {
  return (
    `<table class="bw-tafel"><tr><th></th><th>${k.kurzB}</th><th>nicht ${k.kurzB}</th><th>Summe</th></tr>` +
    `<tr><th>${k.kurzA}</th><td>${num(t.ab)}</td><td>${num(t.anb)}</td><td class="rand">${num(t.zeileA)}</td></tr>` +
    `<tr><th>nicht ${k.kurzA}</th><td>${num(t.nab)}</td><td>${num(t.nanb)}</td><td class="rand">${num(t.zeileNichtA)}</td></tr>` +
    `<tr><th>Summe</th><td class="rand">${num(t.spalteB)}</td><td class="rand">${num(t.spalteNichtB)}</td><td class="gesamt">${num(t.n)}</td></tr></table>`
  );
}

// Kandidaten für die Tafelaufgaben: vier Zellen, bei denen die gesuchte
// bedingte Wahrscheinlichkeit glatt in Prozent aufgeht.
function tafelKandidaten(nennerVon) {
  const out = [];
  for (const ab of [3, 4, 6, 7, 8, 9, 12, 14, 15, 16, 18, 21, 24]) {
    for (const rest of [4, 6, 8, 9, 12, 14, 15, 16, 18, 20, 24, 26, 30, 32]) {
      for (const drittes of [5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25]) {
        for (const viertes of [6, 8, 10, 12, 14, 16, 18, 22, 26, 28]) {
          const t = nennerVon === "spalte"
            ? tafel(ab, drittes, rest, viertes)     // Nenner = ab + rest
            : tafel(ab, rest, drittes, viertes);    // Nenner = ab + rest
          const nenner = nennerVon === "spalte" ? t.spalteB : t.zeileA;
          const proz = (100 * ab) / nenner;
          if (!Number.isInteger(proz) || proz < 10 || proz > 90) continue;
          if (t.n < 40 || t.n > 120) continue;
          out.push(t);
        }
      }
    }
  }
  return out;
}

// Aufgabe 1 — P(A|B) aus der Vierfeldertafel ablesen.
function generateAufgabe1() {
  const kandidaten = tafelKandidaten("spalte");
  const t = ohneKollision(
    kandidaten,
    (x) => [
      (100 * x.ab) / x.spalteB,      // gesuchter Wert
      (100 * x.ab) / x.zeileA,       // die Verwechslung mit P(B|A)
      (100 * x.ab) / x.n,            // P(A ∩ B)
      (100 * x.zeileA) / x.n,        // P(A)
      (100 * x.spalteB) / x.n,       // P(B)
    ],
    kandidaten[0]
  );
  const k = pick(AUFGABEN_KONTEXTE);
  const antwort = (100 * t.ab) / t.spalteB;

  return {
    promptHtml:
      `In einer Umfrage unter <strong>${num(t.n)} ${k.wer}</strong> wurde erfasst, ${k.einleitung}:` +
      tafelText(t, k) +
      `<strong>${k.frageAB}</strong> Gesucht ist also P(A|B).`,
    correct: antwort,
    tolerance: 0.05,
    placeholder: "Prozent",
    hinweis: (raw, val) => {
      if (Math.abs(val - (100 * t.ab) / t.zeileA) < 0.05)
        return `Du hast durch die <em>Zeilensumme</em> ${num(t.zeileA)} geteilt — das ergibt P(B|A), also „wie viele derjenigen mit A auch B haben“. Gefragt ist die andere Richtung: Nenner ist die <strong>Spaltensumme</strong> ${num(t.spalteB)}.`;
      if (Math.abs(val - (100 * t.ab) / t.n) < 0.05)
        return `${num((100 * t.ab) / t.n, 2)} % ist P(A ∩ B) — der Anteil an <em>allen</em> ${num(t.n)} Befragten. Bei einer Bedingung ist der Nenner nur noch die Bedingung selbst.`;
      if (Math.abs(val - (100 * t.zeileA) / t.n) < 0.05)
        return `Das ist P(A), der Anteil in der ganzen Umfrage. Die Bedingung verkleinert die Grundmenge auf ${num(t.spalteB)}.`;
      return `P(A|B) = (Zelle A ∩ B) : (Spaltensumme von B) = ${num(t.ab)} : ${num(t.spalteB)}.`;
    },
    musterloesungHtml:
      `<strong>1. Neue Grundmenge:</strong> Die Bedingung ist B, also zählen nur noch die ${num(t.spalteB)} Personen der B-Spalte.<br>` +
      `<strong>2. Günstige darin:</strong> Von diesen haben ${num(t.ab)} auch A.<br>` +
      `<strong>3. Anteil:</strong> P(A|B) = ${num(t.ab)} : ${num(t.spalteB)} = ${num(t.ab / t.spalteB, 4)} = <strong>${num(antwort)} %</strong><br>` +
      `<em>Zum Vergleich:</em> P(B|A) = ${num(t.ab)} : ${num(t.zeileA)} ${proz(t.ab, t.zeileA, 2)} — gleicher Zähler, anderer Nenner.`,
  };
}

// Aufgabe 2 — die umgekehrte Bedingung P(B|A).
function generateAufgabe2() {
  const kandidaten = tafelKandidaten("zeile");
  const t = ohneKollision(
    kandidaten,
    (x) => [
      (100 * x.ab) / x.zeileA,
      (100 * x.ab) / x.spalteB,
      (100 * x.ab) / x.n,
      (100 * x.zeileA) / x.n,
      (100 * x.spalteB) / x.n,
      (100 * x.anb) / x.zeileA,
    ],
    kandidaten[0]
  );
  const k = pick(AUFGABEN_KONTEXTE);
  const antwort = (100 * t.ab) / t.zeileA;

  return {
    promptHtml:
      `Eine Umfrage unter <strong>${num(t.n)} ${k.wer}</strong> erfasst, ${k.einleitung}:` +
      tafelText(t, k) +
      `<strong>${k.frageBA}</strong> Gesucht ist also P(B|A).`,
    correct: antwort,
    tolerance: 0.05,
    placeholder: "Prozent",
    hinweis: (raw, val) => {
      if (Math.abs(val - (100 * t.ab) / t.spalteB) < 0.05)
        return `Du hast durch die <em>Spaltensumme</em> ${num(t.spalteB)} geteilt — das wäre P(A|B). Diesmal ist A die Bedingung, der Nenner ist also die <strong>Zeilensumme</strong> ${num(t.zeileA)}.`;
      if (Math.abs(val - (100 * t.anb) / t.zeileA) < 0.05)
        return `Du hast die falsche Zelle genommen: ${num(t.anb)} sind die mit A, aber <em>ohne</em> B. Gesucht sind die mit <strong>beiden</strong> Merkmalen, also ${num(t.ab)}.`;
      if (Math.abs(val - (100 * t.ab) / t.n) < 0.05)
        return `Das ist P(A ∩ B) mit dem Nenner ${num(t.n)}. Unter einer Bedingung schrumpft der Nenner auf die Bedingung.`;
      return `P(B|A) = (Zelle A ∩ B) : (Zeilensumme von A) = ${num(t.ab)} : ${num(t.zeileA)}.`;
    },
    musterloesungHtml:
      `<strong>1. Neue Grundmenge:</strong> Bedingung ist A, also zählen nur noch die ${num(t.zeileA)} Personen der A-Zeile.<br>` +
      `<strong>2. Günstige darin:</strong> Von diesen haben ${num(t.ab)} auch B.<br>` +
      `<strong>3. Anteil:</strong> P(B|A) = ${num(t.ab)} : ${num(t.zeileA)} = ${num(t.ab / t.zeileA, 4)} = <strong>${num(antwort)} %</strong><br>` +
      `<em>Merke:</em> Zähler und Zelle bleiben gleich; die Bedingung sagt nur, welche Randsumme in den Nenner kommt.`,
  };
}

// Aufgabe 3 — welche Zellbesetzung machte die Merkmale unabhängig?
function generateAufgabe3() {
  const kandidaten = [];
  for (const n of [40, 50, 60, 80, 100, 120, 150, 200]) {
    for (let a = 10; a < n; a += 5) {
      for (let b = 10; b < n; b += 5) {
        const soll = (a * b) / n;
        if (!Number.isInteger(soll) || soll < 4) continue;
        if (a + b - n > soll || soll > Math.min(a, b) - 3) continue;
        kandidaten.push({ n, a, b, soll });
      }
    }
  }
  const wahl = ohneKollision(
    kandidaten,
    (c) => [c.soll, c.a, c.b, c.n, c.a + c.b - c.n, (c.a + c.b) / 2, c.n - c.a, c.n - c.b],
    kandidaten[0]
  );
  const k = pick(AUFGABEN_KONTEXTE);
  const { n, a, b, soll } = wahl;

  return {
    promptHtml:
      `Unter <strong>${num(n)} ${k.wer}</strong> ${k.satzA} <strong>${num(a)}</strong> (Ereignis A), und ` +
      `<strong>${num(b)}</strong> ${k.satzB} (Ereignis B).<br>` +
      `<strong>Wie viele müssten beides sein, damit A und B stochastisch unabhängig sind?</strong> Gib die Anzahl an.`,
    correct: soll,
    tolerance: 0.01,
    placeholder: "Anzahl",
    hinweis: (raw, val) => {
      if (Math.abs(val - (a + b - n)) < 0.01)
        return `${num(a + b - n)} wäre die kleinstmögliche Überschneidung — sie ergibt sich rein aus dem Platzmangel, hat aber mit Unabhängigkeit nichts zu tun.`;
      if (Math.abs(val - (a + b) / 2) < 0.01)
        return `Der Mittelwert der beiden Anzahlen hilft hier nicht. Unabhängigkeit heißt P(A ∩ B) = P(A) · P(B) — also ein <em>Produkt</em> von Anteilen.`;
      if (Math.abs(val - Math.min(a, b)) < 0.01)
        return `${num(Math.min(a, b))} wäre der größtmögliche Wert — dann wären ${a <= b ? "alle A auch B" : "alle B auch A"}. ` +
          `Das ist der Fall stärkster Abhängigkeit, nicht der unabhängige.`;
      return `Setze P(A ∩ B) = P(A) · P(B) an: x : ${num(n)} = ${faktor(a, n)} · ${faktor(b, n)}.`;
    },
    musterloesungHtml:
      `<strong>1. Bedingung für Unabhängigkeit:</strong> P(A ∩ B) = P(A) · P(B)<br>` +
      `<strong>2. Einsetzen:</strong> x : ${num(n)} = ${faktor(a, n)} · ${faktor(b, n)} = ${num((a * b) / (n * n), 4)}<br>` +
      `<strong>3. Auflösen:</strong> x = ${num(a)} · ${num(b)} : ${num(n)} = ${num(a * b)} : ${num(n)} = <strong>${num(soll)}</strong><br>` +
      `<em>Probe:</em> P(B|A) = ${num(soll)} : ${num(a)} = ${num(soll / a, 4)} und P(B) = ${num(b)} : ${num(n)} = ${num(b / n, 4)} — gleich, also unabhängig. ` +
      `Steht in der Zelle mehr als ${num(soll)}, treten die Merkmale häufiger gemeinsam auf als bei Unabhängigkeit zu erwarten; steht weniger drin, seltener.`,
  };
}

// Aufgabe 4 — P(krank | Test positiv) aus absoluten Anzahlen.
function generateAufgabe4() {
  const kandidaten = [];
  for (const gesamt of [100, 120, 150, 200, 250, 400, 500]) {
    for (let richtig = 10; richtig < gesamt; richtig += 5) {
      const proz = (100 * richtig) / gesamt;
      // Die Antwort soll klein bleiben — genau darin besteht die Überraschung.
      if (!Number.isInteger(proz) || proz < 5 || proz > 35) continue;
      const falsch = gesamt - richtig;
      // Der Test findet 80 bis 90 % der Kranken: gut, aber nicht unfehlbar.
      for (const kranke of [Math.round(richtig / 0.9), Math.round(richtig / 0.85), Math.round(richtig / 0.8)]) {
        const bevoelkerung = 10000;
        const gesunde = bevoelkerung - kranke;
        // Selten heißt: höchstens 5 % der Bevölkerung.
        if (kranke > 500 || kranke <= richtig || falsch > gesunde) continue;
        kandidaten.push({ bevoelkerung, kranke, richtig, falsch, gesamt, proz, quote: (100 * falsch) / gesunde });
      }
    }
  }
  const wahl = ohneKollision(
    kandidaten,
    (c) => [
      c.proz,                                     // gesuchter Wert
      (100 * c.richtig) / c.kranke,               // die Verwechslung: P(+|krank)
      c.quote,                                    // Fehlalarmquote
      (100 * c.kranke) / c.bevoelkerung,          // Anteil Kranker
      (100 * c.gesamt) / c.bevoelkerung,          // Anteil positiv Getesteter
      100 - c.proz,
    ],
    kandidaten[0]
  );
  const { bevoelkerung, kranke, richtig, falsch, gesamt, proz: antwort } = wahl;
  const gesunde = bevoelkerung - kranke;

  return {
    promptHtml:
      `In einer Stadt mit <strong>${num(bevoelkerung)} Personen</strong> sind <strong>${num(kranke)}</strong> an einer bestimmten Krankheit erkrankt. ` +
      `Alle werden getestet. Der Test schlägt bei <strong>${num(richtig)}</strong> der Kranken an und außerdem bei <strong>${num(falsch)}</strong> der Gesunden.<br>` +
      `<strong>Wie viel Prozent der positiv Getesteten sind wirklich krank?</strong>`,
    correct: antwort,
    tolerance: 0.05,
    placeholder: "Prozent",
    hinweis: (raw, val) => {
      if (Math.abs(val - (100 * richtig) / kranke) < 0.05)
        return `${num((100 * richtig) / kranke, 2)} % ist P(Test + | krank) — wie gut der Test die Kranken findet. Gefragt ist die <strong>umgekehrte</strong> Richtung: P(krank | Test +). Der Nenner ist die Zahl <em>aller</em> positiv Getesteten.`;
      if (Math.abs(val - (100 * kranke) / bevoelkerung) < 0.05)
        return `Das ist der Anteil der Kranken an der ganzen Stadt, ohne den Test. Die Bedingung „Test positiv“ verkleinert die Grundmenge auf ${num(gesamt)} Personen.`;
      if (Math.abs(val - (100 * richtig) / bevoelkerung) < 0.05)
        return `Du hast durch die ganze Stadt geteilt. Unter der Bedingung „Test positiv“ zählen nur noch die ${num(gesamt)} positiv Getesteten.`;
      return `Zähle zuerst alle positiven Tests zusammen: ${num(richtig)} + ${num(falsch)} = ${num(gesamt)}. Davon sind ${num(richtig)} wirklich krank.`;
    },
    musterloesungHtml:
      `<strong>1. Positiv Getestete zählen:</strong> ${num(richtig)} Kranke + ${num(falsch)} Gesunde = <strong>${num(gesamt)}</strong><br>` +
      `<strong>2. Davon wirklich krank:</strong> ${num(richtig)}<br>` +
      `<strong>3. Anteil:</strong> P(krank | Test +) = ${num(richtig)} : ${num(gesamt)} = ${num(richtig / gesamt, 4)} = <strong>${num(antwort)} %</strong><br>` +
      `<em>Warum so wenig?</em> Der Test findet ${prozWert(richtig, kranke, 1)} der Kranken — das ist gut. Aber er schlägt auch bei ` +
      `${prozWert(falsch, gesunde, 2)} der ${num(gesunde)} Gesunden an, und das sind ${num(falsch)} Personen. Weil es so viel mehr Gesunde als Kranke gibt, ` +
      `überwiegen die Fehlalarme. <strong>P(Test + | krank) und P(krank | Test +) sind zwei verschiedene Zahlen.</strong>`,
  };
}

function initExercises() {
  mountUebungsaufgaben(document.getElementById("exercises-mount"), [
    { schwierigkeit: "einfach", titel: "Aufgabe 1 — P(A|B) aus der Tafel", generate: generateAufgabe1 },
    { schwierigkeit: "mittel", titel: "Aufgabe 2 — die andere Richtung", generate: generateAufgabe2 },
    { schwierigkeit: "schwierig", titel: "Aufgabe 3 — unabhängig machen", generate: generateAufgabe3 },
    { schwierigkeit: "komplex", titel: "Aufgabe 4 — der seltene Fall", generate: generateAufgabe4 },
  ]);
}

// ================= Quizze =================

function initQuizzes() {
  mountQuiz(document.getElementById("quiz-bedingt"), {
    q: "In einer Klasse mit 25 Kindern fahren 10 mit dem Rad; 4 davon tragen eine Brille. Wie groß ist P(Brille | Rad)?",
    options: ["4 : 25 = 0,16", "4 : 10 = 0,4", "10 : 25 = 0,4", "4 : 14 ≈ 0,29"],
    correct: 1,
    explain: "Die Bedingung „Rad“ macht die 10 Radfahrenden zur neuen Grundmenge. Von ihnen tragen 4 eine Brille: 4 : 10 = 0,4. Die 4 : 25 wäre P(Brille ∩ Rad) — der Anteil an der ganzen Klasse.",
  });
  mountQuiz(document.getElementById("quiz-vierfeldertafel"), {
    q: "In einer Vierfeldertafel stehen in der A-Zeile 30 (davon 12 auch B) und in der B-Spalte insgesamt 20. Wie groß ist P(A|B)?",
    options: ["12 : 30 = 0,4", "12 : 20 = 0,6", "20 : 30 ≈ 0,67", "30 : 20 = 1,5"],
    correct: 1,
    explain: "Bedingung ist B, also ist die Spaltensumme 20 der Nenner: P(A|B) = 12 : 20 = 0,6. Die 12 : 30 = 0,4 ist P(B|A) — dieselbe Zelle, aber durch die Zeilensumme geteilt. Ein Wert über 1 wie 1,5 ist bei Wahrscheinlichkeiten immer ein Rechenfehler.",
  });
  mountQuiz(document.getElementById("quiz-umdrehen"), {
    q: "Welche Größe steht in einem Baumdiagramm an der zweiten Stufe?",
    options: ["immer P(A ∩ B)", "immer eine unbedingte Wahrscheinlichkeit", "eine bedingte Wahrscheinlichkeit", "die Summe aller Pfade"],
    correct: 2,
    explain: "An der ersten Stufe steht die unbedingte Wahrscheinlichkeit, an der zweiten eine bedingte — sie hängt davon ab, welcher Ast vorher genommen wurde. Multipliziert man beide (1. Pfadregel), erhält man P(A ∩ B).",
  });
  mountQuiz(document.getElementById("quiz-unabhaengig"), {
    q: "Für zwei Ereignisse gilt P(A) = 0,4 und P(B) = 0,5. Bei welchem Wert von P(A ∩ B) sind sie unabhängig?",
    options: ["0,9", "0,45", "0,2", "0,1"],
    correct: 2,
    explain: "Unabhängigkeit heißt P(A ∩ B) = P(A) · P(B) = 0,4 · 0,5 = 0,2. Die 0,9 wäre die Summe, die 0,45 der Mittelwert — beides hat mit Unabhängigkeit nichts zu tun.",
  });
  mountQuiz(document.getElementById("quiz-basisrate"), {
    q: "Ein Test erkennt 99 % der Kranken und schlägt bei 1 % der Gesunden fälschlich an. Die Krankheit haben 10 von 10 000 Personen. Wie viele der positiv Getesteten sind wirklich krank?",
    options: ["99 %", "etwa 50 %", "etwa 1 %", "etwa 9 %"],
    correct: 3,
    explain: "Richtig positiv: 99 % von 10 ≈ 10. Falsch positiv: 1 % von 9990 ≈ 100. Von rund 110 positiven Tests sind also nur etwa 10 richtig — das sind rund 9 %. Die 99 % sind P(Test + | krank), nicht P(krank | Test +).",
  });
}

// ================= Start =================

initReduziert();
initVierfeldertafel();
initUmdrehen();
initUnabhaengig();
initBasisrate();
initExercises();
initQuizzes();
