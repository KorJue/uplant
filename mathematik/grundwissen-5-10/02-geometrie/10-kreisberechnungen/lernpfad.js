// Selbstlernpfad "Kreisberechnungen" (Grundwissen Klasse 5-10).
// Rein clientseitiges Vanilla-JS, ohne Build-Schritt oder externe Bibliotheken.
//
// Leitgedanke: π ist kein Zauberwert, sondern ein VERHÄLTNIS — Umfang geteilt
// durch Durchmesser. Deshalb zeigt Abschnitt 1 den abgerollten Umfang neben
// dem Durchmesser: Man sieht, dass drei Durchmesser hineinpassen und ein Rest
// bleibt. Und A = π·r² wird nicht behauptet, sondern durch Umlegen hergeleitet.
//
// Durchgehende Farbcodierung: Radius rot, Durchmesser violett, Umfang blau,
// Kreisfläche grün, Ausschnitt und Bogen orange.

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
function randInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function parseFlexibleNumber(raw) {
  if (raw == null) return NaN;
  const s = String(raw).trim().replace(/\s/g, "").replace(/−/g, "-").replace(/\./g, "").replace(",", ".");
  return parseFloat(s);
}
function neueFlaeche(w, h) {
  return svgEl("svg", { viewBox: `0 0 ${w} ${h}`, width: w, height: h, class: "geo-svg", preserveAspectRatio: "xMidYMid meet" });
}
function linie(p, q, klasse) {
  return svgEl("line", { x1: p.x.toFixed(2), y1: p.y.toFixed(2), x2: q.x.toFixed(2), y2: q.y.toFixed(2), class: klasse });
}
function kreis(c, r, klasse) {
  return svgEl("circle", { cx: c.x.toFixed(2), cy: c.y.toFixed(2), r: r.toFixed(2), class: klasse });
}
function mitte(p, q) {
  return { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 };
}
// Punkt auf dem Kreis. Winkel in Grad, 0° zeigt nach rechts, positiv gegen den
// Uhrzeigersinn — auf dem Bildschirm also mit umgekehrtem Vorzeichen bei y.
function amKreis(c, r, grad) {
  const w = (grad * Math.PI) / 180;
  return { x: c.x + r * Math.cos(w), y: c.y - r * Math.sin(w) };
}
// Kreissektor als Pfad: Spitze im Mittelpunkt, Bogen von grad1 nach grad2.
function sektorPfad(c, r, grad1, grad2, klasse) {
  const p1 = amKreis(c, r, grad1), p2 = amKreis(c, r, grad2);
  const gross = Math.abs(grad2 - grad1) > 180 ? 1 : 0;
  // Positive Gradrichtung heißt auf dem Bildschirm gegen den Uhrzeigersinn,
  // das ist in SVG die Sweep-Richtung 0.
  return svgEl("path", {
    d: `M ${c.x.toFixed(2)} ${c.y.toFixed(2)} L ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} A ${r.toFixed(2)} ${r.toFixed(2)} 0 ${gross} 0 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)} Z`,
    class: klasse,
  });
}
function bogenPfad(c, r, grad1, grad2, klasse) {
  const p1 = amKreis(c, r, grad1), p2 = amKreis(c, r, grad2);
  const gross = Math.abs(grad2 - grad1) > 180 ? 1 : 0;
  return svgEl("path", {
    d: `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} A ${r.toFixed(2)} ${r.toFixed(2)} 0 ${gross} 0 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`,
    class: klasse,
  });
}
// Schieberegler, dessen Wert begrenzt werden muss, den angezeigten Wert
// zurückschreiben — ein Regler darf nie etwas anderes anzeigen als das,
// womit gerechnet wird.
function begrenzt(id, hoechstens) {
  const e = document.getElementById(id);
  const v = Math.min(Number(e.value), hoechstens);
  if (Number(e.value) !== v) e.value = String(v);
  return v;
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

// ================= 1. Umfang und π =================

function renderUmfang() {
  const r = Number(document.getElementById("uf-r").value);
  const abrollen = document.getElementById("uf-abrollen").checked;
  document.getElementById("uf-r-anzeige").textContent = r + " cm";

  const d = 2 * r;
  const U = 2 * Math.PI * r;

  // Der Maßstab wird so gewählt, dass die abgerollte Strecke IMMER 440 px
  // lang ist. Dadurch bleibt auch der Kreis gleich groß (sein Durchmesser
  // misst stets 440/π px) — und genau das ist die Aussage: Das Verhältnis
  // von Umfang zu Durchmesser hängt nicht von der Größe des Kreises ab.
  const px = 440 / U;
  const rp = r * px, dp = d * px;

  const svg = neueFlaeche(520, 320);
  const g = svgEl("g");
  const M = { x: 250, y: 92 };

  g.appendChild(kreis(M, rp, "kr-flaeche-leer"));
  g.appendChild(linie({ x: M.x - rp, y: M.y }, { x: M.x + rp, y: M.y }, "kr-durchmesser"));
  g.appendChild(svgEl("circle", { cx: M.x, cy: M.y, r: 3.5, class: "kr-mittelpunkt" }));
  g.appendChild(svgText(M.x, M.y - 8, "d = " + num(d) + " cm", { class: "kr-name-d" }));

  if (abrollen) {
    const x0 = 40, y0 = 236;
    g.appendChild(linie({ x: x0, y: y0 }, { x: x0 + U * px, y: y0 }, "kr-linie"));
    // Durchmesser der Reihe nach abtragen: drei passen hinein, dann ein Rest
    for (let i = 0; i <= 3; i++) {
      const x = x0 + i * dp;
      g.appendChild(linie({ x, y: y0 - 9 }, { x, y: y0 + 9 }, "kr-durchmesser"));
      if (i < 3) g.appendChild(svgText(x + dp / 2, y0 + 24, "1 d", { class: "kr-name-d", "font-size": 11 }));
    }
    const xEnde = x0 + U * px;
    g.appendChild(linie({ x: xEnde, y: y0 - 9 }, { x: xEnde, y: y0 + 9 }, "kr-linie"));
    g.appendChild(svgText((x0 + 3 * dp + xEnde) / 2, y0 + 24, "Rest", { class: "kr-name-u", "font-size": 11 }));
    g.appendChild(svgText(x0 + (U * px) / 2, y0 - 18, "U = " + num(U, 2) + " cm", { class: "kr-name-u" }));
    g.appendChild(svgText(260, 292, "In den Umfang passen 3 Durchmesser und ein Rest von etwa 0,14 Durchmessern.", { class: "kr-hinweistext" }));
  }

  svg.appendChild(g);
  const mount = document.getElementById("uf-mount");
  mount.innerHTML = "";
  mount.appendChild(svg);

  document.getElementById("uf-bilanz").innerHTML =
    `<span class="wr">r = ${num(r)} cm</span> &nbsp;→&nbsp; <span class="wd">d = 2 · ${num(r)} = ${num(d)} cm</span><br>` +
    `<span class="wu">U = π · d = π · ${num(d)} ≈ ${num(U, 2)} cm</span> &nbsp;(gleichbedeutend: U = 2 · π · r = 2 · π · ${num(r)})<br>` +
    `Probe: U : d = ${num(U, 2)} : ${num(d)} = <span class="wu">${num(U / d, 5)}</span> = π`;

  // Die Tabelle zeigt: der Quotient ändert sich nicht.
  const zeilen = [1, 3, 5, r].filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => a - b);
  document.getElementById("uf-tabelle").innerHTML =
    "<tr><th>Radius r</th><th>Durchmesser d</th><th>Umfang U</th><th>U : d</th></tr>" +
    zeilen
      .map((rr) => {
        const uu = 2 * Math.PI * rr;
        return `<tr${rr === r ? ' style="font-weight:700"' : ""}><td>${num(rr)} cm</td><td>${num(2 * rr)} cm</td><td>${num(uu, 2)} cm</td><td class="quotient">${num(uu / (2 * rr), 5)}</td></tr>`;
      })
      .join("");

  document.getElementById("uf-text").textContent =
    "Verändere den Radius: Umfang und Durchmesser ändern sich beide — ihr Quotient aber nie. Genau das ist π.";
}

function initUmfang() {
  ["uf-r", "uf-abrollen"].forEach((id) => document.getElementById(id).addEventListener("input", renderUmfang));
  renderUmfang();
}

// ================= 2. Flächeninhalt durch Umlegen =================

function renderFlaeche() {
  const n = Number(document.getElementById("fl-n").value);
  const zielAn = document.getElementById("fl-ziel").checked;
  document.getElementById("fl-n-anzeige").textContent = n + " Stücke";

  const rp = 78;             // Radius in Pixeln, für Kreis und Streifen gleich
  const h = Math.PI / n;     // halber Öffnungswinkel eines Stücks
  const c = rp * Math.sin(h); // halbe Sehnenbreite

  const svg = neueFlaeche(520, 300);
  const g = svgEl("g");
  const M = { x: 95, y: 130 };

  // Links: der Kreis, in n Sektoren geteilt
  g.appendChild(kreis(M, rp, "kr-flaeche"));
  for (let i = 0; i < n; i++) {
    const w = (i * 360) / n;
    g.appendChild(linie(M, amKreis(M, rp, w), "kr-hilfslinie"));
  }
  g.appendChild(svgText(M.x, M.y + rp + 22, "Kreis mit " + n + " Sektoren", { class: "kr-hinweistext" }));

  // Rechts: dieselben Sektoren abwechselnd nach oben und unten gelegt.
  // Die Spitzen der nach oben zeigenden Stücke liegen auf der Grundlinie,
  // die der nach unten zeigenden auf der Höhe r·cos(h) darüber.
  const ox = 208, basis = 208;
  const paare = n / 2;
  for (let k = 0; k < paare; k++) {
    const sx = ox + k * 2 * c;
    // nach oben zeigendes Stück: Spitze auf der Grundlinie
    const A = { x: sx - c, y: basis - rp * Math.cos(h) };
    const B = { x: sx + c, y: basis - rp * Math.cos(h) };
    g.appendChild(svgEl("path", {
      d: `M ${sx.toFixed(2)} ${basis.toFixed(2)} L ${A.x.toFixed(2)} ${A.y.toFixed(2)} A ${rp} ${rp} 0 0 1 ${B.x.toFixed(2)} ${B.y.toFixed(2)} Z`,
      class: "kr-stueck-a",
    }));
    // nach unten zeigendes Stück: Spitze oben, Bogen unten
    const S = { x: sx + c, y: basis - rp * Math.cos(h) };
    const C = { x: sx, y: basis };
    const D = { x: sx + 2 * c, y: basis };
    g.appendChild(svgEl("path", {
      d: `M ${S.x.toFixed(2)} ${S.y.toFixed(2)} L ${C.x.toFixed(2)} ${C.y.toFixed(2)} A ${rp} ${rp} 0 0 0 ${D.x.toFixed(2)} ${D.y.toFixed(2)} Z`,
      class: "kr-stueck-b",
    }));
  }

  const streifenBreite = n * rp * Math.sin(h);
  const zielBreite = Math.PI * rp;
  if (zielAn) {
    g.appendChild(svgEl("rect", {
      x: ox, y: basis - rp, width: zielBreite.toFixed(2), height: rp, class: "kr-zielrechteck",
    }));
    g.appendChild(svgText(ox + zielBreite / 2, basis - rp - 10, "Zielrechteck: π · r breit, r hoch", { class: "kr-hinweistext" }));
  }
  // r ist die HÖHE des Streifens, also senkrecht am linken Rand abtragen.
  // Waagerecht darunter gezeichnet würde das Maß eine Breite behaupten.
  g.appendChild(linie({ x: ox - 13, y: basis }, { x: ox - 13, y: basis - rp }, "kr-radius"));
  g.appendChild(svgText(ox - 22, basis - rp / 2 + 4, "r", { class: "kr-name-r" }));

  svg.appendChild(g);
  const mount = document.getElementById("fl-mount");
  mount.innerHTML = "";
  mount.appendChild(svg);

  // Wie nah ist der Streifen schon am Rechteck? n·sin(π/n) → π
  const naeherung = n * Math.sin(Math.PI / n);
  document.getElementById("fl-bilanz").innerHTML =
    `Bei ${n} Stücken ist der Streifen <strong>${num(naeherung, 5)} · r</strong> breit.<br>` +
    `Gesucht ist die Breite <span class="wu">π · r ≈ ${num(Math.PI, 5)} · r</span> — es fehlen noch ${num(Math.PI - naeherung, 5)} · r.<br>` +
    `<span class="wa">A = π · r · r = π · r²</span>`;

  document.getElementById("fl-text").textContent =
    n >= 32
      ? "Bei so vielen Stücken ist der Unterschied zum Rechteck kaum noch zu sehen — und rechnerisch verschwindet er, je feiner man schneidet."
      : "Schiebe den Regler weiter nach rechts: Je schmaler die Stücke, desto gerader werden die Kanten und desto näher kommt die Breite an π · r heran.";
}

function initFlaeche() {
  ["fl-n", "fl-ziel"].forEach((id) => document.getElementById(id).addEventListener("input", renderFlaeche));
  renderFlaeche();
}

// ================= 3. Bogen und Ausschnitt =================

function renderAusschnitt() {
  const r = Number(document.getElementById("as-r").value);
  const alpha = Number(document.getElementById("as-a").value);
  document.getElementById("as-r-anzeige").textContent = r + " cm";
  document.getElementById("as-a-anzeige").textContent = alpha + "°";

  const rp = 105;
  const svg = neueFlaeche(440, 280);
  const g = svgEl("g");
  const M = { x: 220, y: 140 };

  g.appendChild(kreis(M, rp, "kr-flaeche-leer"));
  g.appendChild(sektorPfad(M, rp, 0, alpha, "kr-sektor"));
  g.appendChild(bogenPfad(M, rp, 0, alpha, "kr-bogen"));
  g.appendChild(linie(M, amKreis(M, rp, 0), "kr-radius"));
  g.appendChild(linie(M, amKreis(M, rp, alpha), "kr-radius"));
  g.appendChild(svgEl("circle", { cx: M.x, cy: M.y, r: 3.5, class: "kr-mittelpunkt" }));
  const mr = mitte(M, amKreis(M, rp, 0));
  g.appendChild(svgText(mr.x, mr.y + 16, "r = " + num(r), { class: "kr-name-r" }));
  const bm = amKreis(M, rp + 22, alpha / 2);
  g.appendChild(svgText(bm.x, bm.y, alpha + "°", { class: "kr-name-w" }));

  svg.appendChild(g);
  const mount = document.getElementById("as-mount");
  mount.innerHTML = "";
  mount.appendChild(svg);

  // Der Anteil wird als gekürzter Bruch angezeigt — das macht die Idee
  // "Bruchteil des ganzen Kreises" sichtbar.
  const g2 = (x, y) => (y === 0 ? x : g2(y, x % y));
  const t = g2(alpha, 360);
  const anteilBruch = `${alpha / t}⁄${360 / t}`;
  const anteil = alpha / 360;
  const U = 2 * Math.PI * r, A = Math.PI * r * r;
  const b = U * anteil, As = A * anteil;

  document.getElementById("as-bilanz").innerHTML =
    `Anteil am ganzen Kreis: <span class="ww">${alpha}° : 360° = ${anteilBruch} = ${num(anteil, 4)}</span><br>` +
    `Bogen: <span class="ww">b = ${anteilBruch} · 2 · π · ${num(r)} ≈ ${num(b, 2)} cm</span><br>` +
    `Ausschnitt: <span class="ww">A = ${anteilBruch} · π · ${num(r)}² ≈ ${num(As, 2)} cm²</span><br>` +
    `Umfang des Ausschnitts: u = b + 2 · r ≈ ${num(b + 2 * r, 2)} cm — der Bogen allein genügt nicht.`;

  document.getElementById("as-text").textContent =
    alpha === 180
      ? "Bei 180° ist der Ausschnitt ein Halbkreis: genau die Hälfte von allem."
      : alpha === 90
      ? "Bei 90° ist der Ausschnitt ein Viertelkreis — der Anteil ist 90 : 360 = ¼."
      : "Beide Formeln benutzen denselben Anteil. Man rechnet den ganzen Kreis aus und nimmt davon den Bruchteil.";
}

function initAusschnitt() {
  ["as-r", "as-a"].forEach((id) => document.getElementById(id).addEventListener("input", renderAusschnitt));
  renderAusschnitt();
}

// ================= 4. Zusammengesetzte Figuren =================

const ZS_FIGUREN = [
  { kuerzel: "Kreisring", formel: "A = π · (R² − r²)" },
  { kuerzel: "Quadrat mit Loch", formel: "A = a² − π · r²" },
  { kuerzel: "Laufbahn", formel: "A = 2 · r · l + π · r²" },
];

let zsAktiv = 0;

function renderZusammengesetzt() {
  const reihe = document.getElementById("zs-reihe");
  reihe.innerHTML = "";
  ZS_FIGUREN.forEach((f, i) => {
    const btn = el("button", { type: "button", class: "kr-figur-karte" + (i === zsAktiv ? " aktiv" : "") }, [
      el("span", { class: "kuerzel" }, f.kuerzel),
      el("span", { class: "formel" }, f.formel),
    ]);
    btn.addEventListener("click", () => {
      zsAktiv = i;
      renderZusammengesetzt();
    });
    reihe.appendChild(btn);
  });

  const gross = Number(document.getElementById("zs-gross").value);
  // Das kleine Maß darf das große nicht erreichen; der Regler bekommt den
  // begrenzten Wert zurückgeschrieben, damit Anzeige und Rechnung übereinstimmen.
  const klein = zsAktiv === 1 ? begrenzt("zs-klein", Math.floor(gross / 2)) : begrenzt("zs-klein", gross - 1);
  document.getElementById("zs-gross-anzeige").textContent = gross + " cm";
  document.getElementById("zs-klein-anzeige").textContent = klein + " cm";

  const svg = neueFlaeche(440, 300);
  const g = svgEl("g");
  const M = { x: 220, y: 150 };
  let bilanz;

  if (zsAktiv === 0) {
    const px = 120 / gross;
    const R = gross * px, ri = klein * px;
    // Der Ring als ein Pfad mit zwei gegenläufigen Kreisen: so bleibt die
    // Mitte wirklich frei und wird nicht mit eingefärbt.
    g.appendChild(svgEl("path", {
      d: `M ${M.x - R} ${M.y} a ${R} ${R} 0 1 0 ${2 * R} 0 a ${R} ${R} 0 1 0 ${-2 * R} 0 Z ` +
         `M ${M.x - ri} ${M.y} a ${ri} ${ri} 0 1 1 ${2 * ri} 0 a ${ri} ${ri} 0 1 1 ${-2 * ri} 0 Z`,
      class: "kr-ring",
      "fill-rule": "evenodd",
    }));
    g.appendChild(linie(M, { x: M.x + R, y: M.y }, "kr-radius"));
    g.appendChild(linie(M, { x: M.x, y: M.y - ri }, "kr-radius"));
    g.appendChild(svgText(M.x + R / 2, M.y + 16, "R = " + gross, { class: "kr-name-r" }));
    g.appendChild(svgText(M.x - 18, M.y - ri / 2, "r = " + klein, { class: "kr-name-r" }));
    const A = Math.PI * (gross * gross - klein * klein);
    bilanz =
      `<span class="wa">A = π · (R² − r²) = π · (${gross}² − ${klein}²) = π · (${gross * gross} − ${klein * klein}) = π · ${gross * gross - klein * klein} ≈ ${num(A, 2)} cm²</span><br>` +
      `<em>Nicht</em> π · (R − r)² = π · ${num((gross - klein) ** 2)} ≈ ${num(Math.PI * (gross - klein) ** 2, 2)} cm² — erst quadrieren, dann subtrahieren.`;
  } else if (zsAktiv === 1) {
    const px = 230 / gross;
    const a = gross * px, ri = klein * px;
    g.appendChild(svgEl("path", {
      d: `M ${M.x - a / 2} ${M.y - a / 2} h ${a} v ${a} h ${-a} Z ` +
         `M ${M.x - ri} ${M.y} a ${ri} ${ri} 0 1 1 ${2 * ri} 0 a ${ri} ${ri} 0 1 1 ${-2 * ri} 0 Z`,
      class: "kr-ring",
      "fill-rule": "evenodd",
    }));
    g.appendChild(linie(M, { x: M.x + ri, y: M.y }, "kr-radius"));
    g.appendChild(svgText(M.x + ri / 2, M.y - 8, "r = " + klein, { class: "kr-name-r" }));
    g.appendChild(svgText(M.x, M.y + a / 2 + 18, "a = " + gross, { class: "kr-name-a" }));
    const A = gross * gross - Math.PI * klein * klein;
    bilanz =
      `<span class="wa">A = a² − π · r² = ${gross}² − π · ${klein}² = ${gross * gross} − ${num(Math.PI * klein * klein, 2)} ≈ ${num(A, 2)} cm²</span><br>` +
      `Der Kreis wird <strong>abgezogen</strong>, weil er ein Loch ist. Der Umfang der Restfigur besteht aus vier Quadratseiten und dem ganzen Kreisumfang.`;
  } else {
    const l = gross, ri = klein;
    const px = 300 / (l + 2 * ri);
    const lp = l * px, rp = ri * px;
    g.appendChild(svgEl("path", {
      d: `M ${M.x - lp / 2} ${M.y - rp} h ${lp} a ${rp} ${rp} 0 0 1 0 ${2 * rp} h ${-lp} a ${rp} ${rp} 0 0 1 0 ${-2 * rp} Z`,
      class: "kr-flaeche",
    }));
    g.appendChild(linie({ x: M.x - lp / 2, y: M.y - rp }, { x: M.x - lp / 2, y: M.y + rp }, "kr-hilfslinie"));
    g.appendChild(linie({ x: M.x + lp / 2, y: M.y - rp }, { x: M.x + lp / 2, y: M.y + rp }, "kr-hilfslinie"));
    g.appendChild(linie({ x: M.x + lp / 2, y: M.y }, { x: M.x + lp / 2 + rp, y: M.y }, "kr-radius"));
    g.appendChild(svgText(M.x, M.y - rp - 12, "l = " + l, { class: "kr-name-a" }));
    g.appendChild(svgText(M.x + lp / 2 + rp / 2, M.y - 10, "r = " + ri, { class: "kr-name-r" }));
    const A = 2 * ri * l + Math.PI * ri * ri;
    const U = 2 * l + 2 * Math.PI * ri;
    bilanz =
      `<span class="wa">A = Rechteck + zwei Halbkreise = 2 · r · l + π · r² = 2 · ${ri} · ${l} + π · ${ri}² = ${2 * ri * l} + ${num(Math.PI * ri * ri, 2)} ≈ ${num(A, 2)} cm²</span><br>` +
      `<span class="wu">U = 2 · l + 2 · π · r = ${2 * l} + ${num(2 * Math.PI * ri, 2)} ≈ ${num(U, 2)} cm</span> — die beiden Halbkreise ergeben zusammen einen ganzen Kreis.`;
  }

  svg.appendChild(g);
  const mount = document.getElementById("zs-mount");
  mount.innerHTML = "";
  mount.appendChild(svg);
  document.getElementById("zs-bilanz").innerHTML = bilanz;
  document.getElementById("zs-text").textContent =
    "Neue Formeln braucht man hier nicht: Man zerlegt die Figur in bekannte Teile und addiert oder subtrahiert deren Flächen.";
}

function initZusammengesetzt() {
  ["zs-gross", "zs-klein"].forEach((id) => document.getElementById(id).addEventListener("input", renderZusammengesetzt));
  renderZusammengesetzt();
}

// ================= 5. Rückwärtsrechnen =================

function renderRueckwaerts() {
  const was = document.getElementById("rw-was").value;
  const wert = Number(document.getElementById("rw-wert").value);
  document.getElementById("rw-wert-anzeige").textContent = wert + (was === "U" ? " cm" : " cm²");

  const r = was === "U" ? wert / (2 * Math.PI) : Math.sqrt(wert / Math.PI);

  const svg = neueFlaeche(360, 260);
  const g = svgEl("g");
  const M = { x: 180, y: 130 };
  const rp = 96;
  g.appendChild(kreis(M, rp, was === "U" ? "kr-flaeche-leer" : "kr-flaeche"));
  g.appendChild(linie(M, { x: M.x + rp, y: M.y }, "kr-radius"));
  g.appendChild(svgEl("circle", { cx: M.x, cy: M.y, r: 3.5, class: "kr-mittelpunkt" }));
  g.appendChild(svgText(M.x + rp / 2, M.y - 8, "r ≈ " + num(r, 2), { class: "kr-name-r" }));
  g.appendChild(svgText(M.x, M.y + rp + 26,
    was === "U" ? "gegeben: U = " + num(wert) + " cm" : "gegeben: A = " + num(wert) + " cm²",
    { class: was === "U" ? "kr-name-u" : "kr-name-a" }));
  svg.appendChild(g);
  const mount = document.getElementById("rw-mount");
  mount.innerHTML = "";
  mount.appendChild(svg);

  document.getElementById("rw-bilanz").innerHTML =
    was === "U"
      ? `Aus <span class="wu">U = 2 · π · r</span> folgt r = U : (2 · π)<br>` +
        `r = ${num(wert)} : (2 · π) = ${num(wert)} : ${num(2 * Math.PI, 4)} ≈ <span class="wr">${num(r, 3)} cm</span><br>` +
        `Probe: 2 · π · ${num(r, 3)} ≈ ${num(2 * Math.PI * r, 2)} cm ✓`
      : `Aus <span class="wa">A = π · r²</span> folgt zuerst r² = A : π, dann r = √(A : π)<br>` +
        `r² = ${num(wert)} : π ≈ ${num(wert / Math.PI, 4)} &nbsp;→&nbsp; r = √${num(wert / Math.PI, 4)} ≈ <span class="wr">${num(r, 3)} cm</span><br>` +
        `Probe: π · ${num(r, 3)}² ≈ ${num(Math.PI * r * r, 2)} cm² ✓`;

  document.getElementById("rw-text").textContent =
    was === "U"
      ? "Beim Umfang genügt eine Division — π steht als Faktor da und wandert auf die andere Seite."
      : "Beim Flächeninhalt sind es zwei Schritte: erst durch π teilen, dann die Wurzel ziehen. Wer die Wurzel vergisst, gibt r² statt r an.";
}

function initRueckwaerts() {
  ["rw-was", "rw-wert"].forEach((id) => document.getElementById(id).addEventListener("input", renderRueckwaerts));
  document.getElementById("rw-was").addEventListener("change", renderRueckwaerts);
  renderRueckwaerts();
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

// Aufgabe 1 — Umfang oder Fläche als Vielfaches von π. So bleibt die Lösung
// GANZZAHLIG und exakt: U = 2r · π und A = r² · π.
function generateAufgabe1() {
  const flaeche = Math.random() < 0.5;
  // r ≥ 3, damit bei der Fläche r² nie mit 2r zusammenfällt (r² = 2r nur für r = 2)
  const r = randInt(3, 12);
  const koeff = flaeche ? r * r : 2 * r;

  return {
    promptHtml:
      `Ein Kreis hat den Radius <strong>r = ${num(r)} cm</strong>.<br>` +
      (flaeche
        ? `Sein Flächeninhalt lässt sich exakt als Vielfaches von π schreiben: A = <strong>?</strong> · π cm².`
        : `Sein Umfang lässt sich exakt als Vielfaches von π schreiben: U = <strong>?</strong> · π cm.`) +
      `<br>Welche Zahl steht vor π?`,
    correct: koeff,
    placeholder: "Zahl vor π",
    hinweis: (raw, val) => {
      if (flaeche) {
        if (Math.abs(val - 2 * r) < 0.01)
          return `${num(2 * r)} · π wäre der <strong>Umfang</strong>. Für den Flächeninhalt wird r <em>quadriert</em>: A = π · r².`;
        if (Math.abs(val - r) < 0.01)
          return `Du hast r selbst eingetragen. In A = π · r² steht r², also ${num(r)} · ${num(r)} = ${num(r * r)}.`;
      } else {
        if (Math.abs(val - r) < 0.01)
          return `Du hast r selbst eingetragen. In U = 2 · π · r steht der Faktor <strong>2</strong> davor: 2 · ${num(r)} = ${num(2 * r)}.`;
        if (Math.abs(val - r * r) < 0.01)
          return `${num(r * r)} · π wäre der <strong>Flächeninhalt</strong>. Beim Umfang wird r nicht quadriert, sondern verdoppelt.`;
      }
      return flaeche ? `A = π · r², die Zahl vor π ist also r².` : `U = 2 · π · r, die Zahl vor π ist also 2r.`;
    },
    musterloesungHtml: flaeche
      ? `A = π · r² = π · ${num(r)}² = <strong>${num(r * r)} · π cm²</strong> ≈ ${num(Math.PI * r * r, 2)} cm²`
      : `U = 2 · π · r = 2 · π · ${num(r)} = <strong>${num(2 * r)} · π cm</strong> ≈ ${num(2 * Math.PI * r, 2)} cm`,
  };
}

// Aufgabe 2 — Bogenlänge oder Ausschnittsfläche.
// α ist stets ein Vielfaches von 45°, damit der Anteil α : 360 = k : 8 exakt
// im Rechner darstellbar ist und keine Rundung durch die Hintertür entsteht.
function generateAufgabe2() {
  const r = randInt(3, 12);
  const k = randInt(1, 7);
  const alpha = k * 45;
  const anteil = k / 8;
  const bogen = Math.random() < 0.5;
  const wert = bogen ? 2 * Math.PI * r * anteil : Math.PI * r * r * anteil;

  return {
    promptHtml:
      `Ein Kreisausschnitt hat den Radius <strong>r = ${num(r)} cm</strong> und den Mittelpunktswinkel <strong>α = ${alpha}°</strong>.<br>` +
      (bogen
        ? `Wie lang ist der <strong>Kreisbogen</strong> in Zentimetern?`
        : `Wie groß ist der <strong>Flächeninhalt des Ausschnitts</strong> in Quadratzentimetern?`) +
      `<br><span class="progress-note">Runde auf zwei Nachkommastellen.</span>`,
    correct: wert,
    tolerance: 0.015,
    placeholder: bogen ? "b in cm" : "A in cm²",
    hinweis: (raw, val) => {
      const ganz = bogen ? 2 * Math.PI * r : Math.PI * r * r;
      if (Math.abs(val - ganz) < 0.02)
        return `Das ist der <strong>ganze Kreis</strong>. Du musst noch den Anteil ${alpha}° : 360° = ${num(anteil, 4)} nehmen.`;
      const andere = bogen ? Math.PI * r * r * anteil : 2 * Math.PI * r * anteil;
      if (Math.abs(val - andere) < 0.02)
        return bogen
          ? `Du hast die <strong>Fläche</strong> des Ausschnitts berechnet. Gesucht ist die Bogenlänge: b = Anteil · 2 · π · r.`
          : `Du hast die <strong>Bogenlänge</strong> berechnet. Gesucht ist die Fläche: A = Anteil · π · r².`;
      if (Math.abs(val - (wert + 2 * r)) < 0.02)
        return `Du hast die beiden Radien mitgezählt — das wäre der <em>Umfang</em> des Ausschnitts, nicht der Bogen allein.`;
      return `Anteil bestimmen (${alpha}° : 360°), dann mit dem ganzen Kreis multiplizieren.`;
    },
    musterloesungHtml:
      `<strong>1. Anteil:</strong> ${alpha}° : 360° = ${num(anteil, 4)}<br>` +
      (bogen
        ? `<strong>2. Ganzer Umfang:</strong> U = 2 · π · ${num(r)} ≈ ${num(2 * Math.PI * r, 4)} cm<br>` +
          `<strong>3. Anteil davon:</strong> b = ${num(anteil, 4)} · ${num(2 * Math.PI * r, 4)} ≈ <strong>${num(wert, 2)} cm</strong>`
        : `<strong>2. Ganze Fläche:</strong> A = π · ${num(r)}² ≈ ${num(Math.PI * r * r, 4)} cm²<br>` +
          `<strong>3. Anteil davon:</strong> A = ${num(anteil, 4)} · ${num(Math.PI * r * r, 4)} ≈ <strong>${num(wert, 2)} cm²</strong>`),
  };
}

// Aufgabe 3 — Rückwärtsrechnen. Die gestellte Zahl ist bereits gerundet;
// die erwartete Lösung wird aus GENAU dieser Zahl berechnet, damit das
// Nachrechnen der Schülerin auf denselben Wert führt.
function generateAufgabe3() {
  const r0 = randInt(3, 14);
  const ausUmfang = Math.random() < 0.5;
  const gegeben = ausUmfang
    ? Math.round(2 * Math.PI * r0 * 100) / 100
    : Math.round(Math.PI * r0 * r0 * 100) / 100;
  const r = ausUmfang ? gegeben / (2 * Math.PI) : Math.sqrt(gegeben / Math.PI);

  return {
    promptHtml:
      (ausUmfang
        ? `Ein Kreis hat den Umfang <strong>U = ${num(gegeben, 2)} cm</strong>.`
        : `Ein Kreis hat den Flächeninhalt <strong>A = ${num(gegeben, 2)} cm²</strong>.`) +
      `<br>Wie groß ist sein Radius in Zentimetern?<br>` +
      `<span class="progress-note">Runde auf zwei Nachkommastellen.</span>`,
    correct: r,
    tolerance: 0.015,
    placeholder: "r in cm",
    hinweis: (raw, val) => {
      if (ausUmfang) {
        if (Math.abs(val - gegeben / Math.PI) < 0.02)
          return `Du hast nur durch π geteilt — das ergibt den <strong>Durchmesser</strong> d = ${num(gegeben / Math.PI, 2)} cm. Der Radius ist halb so groß.`;
        if (Math.abs(val - gegeben * 2 * Math.PI) < 0.5)
          return `Du hast <strong>multipliziert</strong> statt zu dividieren. Aus U = 2 · π · r wird r = U : (2 · π).`;
      } else {
        if (Math.abs(val - gegeben / Math.PI) < 0.02)
          return `Das ist erst <strong>r²</strong> = ${num(gegeben / Math.PI, 2)}. Es fehlt noch die Quadratwurzel.`;
        if (Math.abs(val - Math.sqrt(gegeben) / Math.PI) < 0.02)
          return `Du hast erst die Wurzel gezogen und dann durch π geteilt. Die Reihenfolge ist umgekehrt: <strong>erst</strong> durch π teilen, <strong>dann</strong> die Wurzel ziehen.`;
      }
      return ausUmfang ? `r = U : (2 · π)` : `r = √(A : π)`;
    },
    musterloesungHtml: ausUmfang
      ? `Aus U = 2 · π · r folgt r = U : (2 · π).<br>` +
        `r = ${num(gegeben, 2)} : (2 · π) = ${num(gegeben, 2)} : ${num(2 * Math.PI, 4)} ≈ <strong>${num(r, 2)} cm</strong>`
      : `Aus A = π · r² folgt zuerst r² = A : π, dann r = √(A : π).<br>` +
        `r² = ${num(gegeben, 2)} : π ≈ ${num(gegeben / Math.PI, 4)}<br>` +
        `r = √${num(gegeben / Math.PI, 4)} ≈ <strong>${num(r, 2)} cm</strong>`,
  };
}

// Aufgabe 4 — Weg um einen runden Brunnen: ein Kreisring in Anwendungsform.
// d ist gerade, damit der Innenradius ganzzahlig ist; die Ringfläche ist dann
// exakt π · b · (d + b), also ein ganzzahliges Vielfaches von π.
function generateAufgabe4() {
  const d = randInt(2, 9) * 2;   // Durchmesser des Brunnens
  const ri = d / 2;
  // Die Wegbreite darf nicht mit dem Innenradius übereinstimmen: Sonst ergäbe
  // der Fehler π · (R − r)² = π · b² dieselbe Zahl wie der Fehler
  // "Brunnenfläche angegeben" = π · ri², und die Diagnose wäre mehrdeutig.
  const b = pick([1, 2, 3, 4].filter((x) => x !== ri));
  const ra = ri + b;
  const koeff = ra * ra - ri * ri; // = b · (d + b), ganzzahlig
  const A = Math.PI * koeff;

  return {
    promptHtml:
      `Ein runder Springbrunnen hat den Durchmesser <strong>d = ${num(d)} m</strong>. ` +
      `Rundherum verläuft ein <strong>${num(b)} m</strong> breiter gepflasterter Weg.<br>` +
      `Wie groß ist die Fläche des <strong>Weges</strong> in Quadratmetern?<br>` +
      `<span class="progress-note">Runde auf zwei Nachkommastellen.</span>`,
    correct: A,
    tolerance: 0.015,
    placeholder: "Fläche in m²",
    hinweis: (raw, val) => {
      if (Math.abs(val - Math.PI * ra * ra) < 0.02)
        return `Das ist die <strong>gesamte</strong> Fläche bis zum äußeren Rand. Der Brunnen selbst gehört nicht zum Weg — ziehe ihn ab.`;
      if (Math.abs(val - Math.PI * ri * ri) < 0.02)
        return `Das ist die Fläche des <strong>Brunnens</strong>, nicht die des Weges.`;
      if (Math.abs(val - Math.PI * (ra - ri) * (ra - ri)) < 0.02)
        return `Du hast π · (R − r)² gerechnet. Erst <strong>quadrieren</strong>, dann subtrahieren: π · (R² − r²).`;
      if (Math.abs(val - Math.PI * ((d + b) * (d + b) - d * d)) < 0.02)
        return `Du hast mit dem <strong>Durchmesser</strong> statt mit dem Radius gerechnet. In A = π · r² gehört immer der Radius: r = d : 2 = ${num(ri)} m.`;
      return `Äußere Kreisfläche minus innere Kreisfläche: A = π · (R² − r²) mit R = ${num(ri)} + ${num(b)}.`;
    },
    musterloesungHtml:
      `<strong>1. Radien:</strong> innen r = d : 2 = ${num(d)} : 2 = ${num(ri)} m, außen R = ${num(ri)} + ${num(b)} = ${num(ra)} m<br>` +
      `<strong>2. Ringfläche:</strong> A = π · (R² − r²) = π · (${num(ra)}² − ${num(ri)}²) = π · (${num(ra * ra)} − ${num(ri * ri)}) = π · ${num(koeff)}<br>` +
      `<strong>3. Ausrechnen:</strong> A ≈ <strong>${num(A, 2)} m²</strong><br>` +
      `<em>Merke:</em> Erst die Quadrate bilden, dann subtrahieren — π · (R − r)² wäre falsch.`,
  };
}

function initExercises() {
  mountUebungsaufgaben(document.getElementById("exercises-mount"), [
    { schwierigkeit: "einfach", titel: "Aufgabe 1 — Umfang und Fläche als Vielfaches von π", generate: generateAufgabe1 },
    { schwierigkeit: "mittel", titel: "Aufgabe 2 — Bogen und Ausschnitt", generate: generateAufgabe2 },
    { schwierigkeit: "schwierig", titel: "Aufgabe 3 — Radius rückwärts bestimmen", generate: generateAufgabe3 },
    { schwierigkeit: "komplex", titel: "Aufgabe 4 — Weg um einen Brunnen", generate: generateAufgabe4 },
  ]);
}

// ================= Quizze =================

function initQuizzes() {
  mountQuiz(document.getElementById("quiz-umfang"), {
    q: "Ein Kreis hat den Durchmesser 10 cm. Wie groß ist sein Umfang ungefähr?",
    options: ["62,8 cm", "31,4 cm", "78,5 cm", "20 cm"],
    correct: 1,
    explain: "U = π · d = π · 10 ≈ 31,4 cm. Die 62,8 cm bekäme man, wenn man den Durchmesser fälschlich in U = 2 · π · r einsetzte — dann rechnet man mit dem doppelten Radius.",
  });
  mountQuiz(document.getElementById("quiz-flaeche"), {
    q: "Warum ist das Rechteck aus den umgelegten Sektoren π · r breit und nicht 2 · π · r?",
    options: [
      "weil die Hälfte der Stücke fehlt",
      "weil die Bögen abwechselnd oben und unten liegen — jede Seite bekommt den halben Umfang",
      "weil π · r einfacher zu rechnen ist",
      "weil der Radius die Breite halbiert",
    ],
    correct: 1,
    explain: "Der ganze Umfang 2 · π · r verteilt sich auf die Oberkante und die Unterkante des Streifens. Jede der beiden Kanten bekommt deshalb die Hälfte, also π · r.",
  });
  mountQuiz(document.getElementById("quiz-ausschnitt"), {
    q: "Ein Kreisausschnitt hat r = 6 cm und α = 60°. Wie groß ist seine Fläche?",
    options: ["6π cm²", "36π cm²", "π cm² · 6", "12π cm²"],
    correct: 0,
    explain: "Der Anteil ist 60 : 360 = ⅙. Der ganze Kreis hat π · 6² = 36π cm², ein Sechstel davon sind 6π cm² ≈ 18,85 cm².",
  });
  mountQuiz(document.getElementById("quiz-zusammengesetzt"), {
    q: "Ein Kreisring hat den Außenradius 5 cm und den Innenradius 3 cm. Wie groß ist seine Fläche?",
    options: ["4π cm²", "16π cm²", "2π cm²", "64π cm²"],
    correct: 1,
    explain: "A = π · (5² − 3²) = π · (25 − 9) = 16π cm². Die 4π kämen aus π · (5 − 3)² — dort wird zu früh subtrahiert. Erst quadrieren, dann subtrahieren.",
  });
  mountQuiz(document.getElementById("quiz-rueckwaerts"), {
    q: "Ein Kreis hat den Flächeninhalt 50,27 cm². Wie groß ist sein Radius ungefähr?",
    options: ["16 cm", "4 cm", "8 cm", "25,13 cm"],
    correct: 1,
    explain: "r² = 50,27 : π ≈ 16, also r = √16 = 4 cm. Die 16 cm wären r² — wer sie angibt, hat die Wurzel vergessen.",
  });
}

// ================= Start =================

initUmfang();
initFlaeche();
initAusschnitt();
initZusammengesetzt();
initRueckwaerts();
initExercises();
initQuizzes();
