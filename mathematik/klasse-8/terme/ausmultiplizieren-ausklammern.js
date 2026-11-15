// Selbstlernpfad „Ausmultiplizieren und Ausklammern“ (Klasse 8, Terme, Thema 3).
//
// Reihenfolge — jeder Abschnitt benutzt nur, was vorher da war:
//   1. Das Distributivgesetz am Rechteck aus Kacheln: k Zeilen zu je (m x-Streifen + c Einer). Der
//      Einerteil wird starr abgerückt; übrig bleiben zwei Rechtecke k · mx und k · c.
//   2. Ausmultiplizieren mit Vorzeichen: dasselbe Gesetz für negative Zahlen und Variablen, in Schritten.
//      Die Minusklammer aus Thema 2 erweist sich als Sonderfall mit dem Faktor −1.
//   3. Ausklammern: Kacheln in k Zeilen legen. Geht es ohne Rest auf, ist k ein gemeinsamer Teiler.
//   4. Vollständig ausklammern: ggT der Zahlen und gemeinsame Variablen.
//
// Farben wie in Thema 2: x² blau, x violett, Einer grün; ein Rest, der nicht aufgeht, rot.
// Die Übungsaufgaben stehen in ausmultiplizieren-ausklammern-aufgaben.js.

import { svgEl, svgText, el, flaeche, zeige, num, reglerZahl, setzeText, setzeHtml, wahl, mountQuizze, mountUebungsaufgaben } from "./seite.js?v=1";
import * as T from "./termwerk.js?v=1";
import { AUFGABEN } from "./ausmultiplizieren-ausklammern-aufgaben.js?v=1";

const VARS = ["x", "y", "a", "b"];
const ggT = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
// Ein Glied mit Zahl k vor der Variablen v: 3x, x, −x, 5.
const glied = (k, v) => (v === "" ? num(k) : (k === 1 ? "" : k === -1 ? "−" : num(k)) + v);
// Mehrere Glieder hintereinander, das Vorzeichen jeweils als Rechenzeichen.
const summe = (texte) => texte.map((t, i) => (i === 0 ? t : t.startsWith("−") ? " − " + t.slice(1) : " + " + t)).join("");
function rechteck(x, y, w, h, klasse, daten = {}) {
  const g = svgEl("g", { "data-rolle": "kachel", ...daten });
  g.appendChild(svgEl("rect", { x: x.toFixed(2), y: y.toFixed(2), width: w.toFixed(2), height: h.toFixed(2), rx: 1.5, class: klasse }));
  return g;
}

// ================= 1. Distributivgesetz am Rechteck =================
//
// Ein Einer ist DG_U breit, ein x-Streifen DG_LX lang — dasselbe Verhältnis wie in Thema 2.
const DG_U = 20, DG_LX = 74;
const DG_W = 680, DG_H = 200;
const DG_Y = 44;          // Oberkante des Rechtecks
const DG_SPALT = 44;      // so weit rückt der Einerteil ab

function renderDistributiv() {
  const art = wahl("dg-art");
  const k = reglerZahl("dg-k"), m = reglerZahl("dg-m"), c = reglerZahl("dg-c");
  const t = reglerZahl("dg-t") / 100;
  setzeText("dg-k-anzeige", String(k));
  setzeText("dg-m-anzeige", String(m));
  setzeText("dg-c-anzeige", String(c));
  setzeText("dg-t-anzeige", Math.round(t * 100) + " %");
  // Die Zahl am Regler gilt nur, wenn vor der Klammer eine Zahl steht.
  document.getElementById("dg-k").disabled = art === "x";
  const zeilen = art === "x" ? 1 : k;
  const zh = art === "x" ? DG_LX : DG_U;          // Höhe einer Zeile
  const faktor = art === "x" ? "x" : String(k);
  const innen = `${glied(m, "x")} + ${c}`;
  // Mittig nach der abgerückten Breite — die Lage bleibt beim Ziehen am Regler fest.
  const x0 = Math.round((DG_W - (m * DG_LX + c * DG_U + DG_SPALT)) / 2) + 16;
  const xr = x0 + m * DG_LX + DG_SPALT * t;       // linker Rand des Einerteils
  const svg = flaeche(DG_W, DG_H, `Rechteck ${faktor} mal (${innen})`);
  for (let r = 0; r < zeilen; r++) {
    for (let s = 0; s < m; s++) {
      svg.appendChild(rechteck(x0 + s * DG_LX, DG_Y + r * zh, DG_LX, zh, `tm-kachel tm-kachel-${art === "x" ? "x2" : "x"}`, { "data-teil": "x", "data-art": art === "x" ? "x2" : "x" }));
    }
    for (let s = 0; s < c; s++) {
      svg.appendChild(rechteck(xr + s * DG_U, DG_Y + r * zh, DG_U, zh, `tm-kachel tm-kachel-${art === "x" ? "x" : "1"}`, { "data-teil": "1", "data-art": art === "x" ? "x" : "1" }));
    }
  }
  const unten = DG_Y + zeilen * zh;
  // Die Seiten: oben die Breiten der beiden Teile, links die Höhe — sie wandern mit ihrem Teil.
  svg.appendChild(svgText(x0 + (m * DG_LX) / 2, DG_Y - 10, glied(m, "x"), { class: "tm-label tm-label-x", "data-rolle": "breite-x" }));
  svg.appendChild(svgText(xr + (c * DG_U) / 2, DG_Y - 10, String(c), { class: "tm-label tm-label-1", "data-rolle": "breite-1" }));
  svg.appendChild(svgText(x0 - 12, DG_Y + (zeilen * zh) / 2 + 5, faktor, { class: `tm-label tm-label-${art === "x" ? "x" : "faktor"}`, "data-rolle": "hoehe", "text-anchor": "end" }));
  const fx = art === "x" ? T.P(`x * ${m}x`) : T.P(`${k} * ${m}x`);
  const f1 = art === "x" ? T.P(`x * ${c}`) : T.P(`${k} * ${c}`);
  if (t === 1) {
    // Die beiden Flächeninhalte unter ihren Rechtecken — erst, wenn die Teile getrennt sind.
    svg.appendChild(svgText(x0 + (m * DG_LX) / 2, unten + 22, `${faktor} · ${glied(m, "x")} = ${T.text(fx)}`, { class: "tm-label", "data-rolle": "flaeche-x" }));
    svg.appendChild(svgText(xr + (c * DG_U) / 2, unten + 22, `${faktor} · ${c} = ${T.text(f1)}`, { class: "tm-label", "data-rolle": "flaeche-1" }));
  }
  zeige("dg-mount", svg);
  const ergebnis = summe([T.text(fx), T.text(f1)]);
  setzeHtml("dg-bilanz", t === 1
    ? `<span class="wc">${faktor}</span> · (${innen}) = <span class="wc">${faktor}</span> · ${glied(m, "x")} + <span class="wc">${faktor}</span> · ${c} = <strong data-rolle="ergebnis">${ergebnis}</strong>`
    : `<span class="wc">${faktor}</span> · (${innen}) — schieb den Regler ganz nach rechts, dann zerfällt das Rechteck in zwei.`);
  const anzahl = zeilen * (m + c);
  setzeText("dg-text", t === 0
    ? (art === "x"
      ? `Das Rechteck ist ${innen} breit und x hoch: ${m} x²-Quadrat${m === 1 ? "" : "e"} und ${c} x-Streifen, zusammen ${anzahl} Kacheln.`
      : `Das Rechteck ist ${innen} breit und ${k} hoch: ${k} Zeile${k === 1 ? "" : "n"} zu je ${m} x-Streifen und ${c} Einer${c === 1 ? "kachel" : "kacheln"}, zusammen ${anzahl} Kacheln.`)
    : t < 1
      ? "Der rechte Teil rückt ab — keine Kachel kommt dazu, keine fällt weg."
      : `Zwei Rechtecke, beide ${faktor} hoch: links ${T.text(fx)}, rechts ${T.text(f1)}. Der Faktor vor der Klammer trifft beide Teile.`);
}

// ================= 2. Ausmultiplizieren mit Vorzeichen =================

const AM_TERME = [
  { faktor: "3", klammer: ["2x", "−5"] },
  { faktor: "−3", klammer: ["2x", "−5"] },
  { faktor: "2a", klammer: ["a", "−3b"] },
  { faktor: "−x", klammer: ["x", "4"] },
  { faktor: "−2x", klammer: ["3x", "−y", "1"] },
];
const inKlammer = (t) => (t.startsWith("−") ? `(${t})` : t);
const P = (t) => T.P(t, VARS);
const AM_PROBE = { x: 2, y: 3, a: 2, b: 3 };

function renderAusmultiplizieren() {
  const d = AM_TERME[Number(wahl("am-term"))];
  const n = reglerZahl("am-schritt");
  setzeText("am-schritt-anzeige", `${n} von 2`);
  const term = `${d.faktor} · (${summe(d.klammer)})`;
  const produkte = d.klammer.map((g) => `${inKlammer(d.faktor)} · ${inKlammer(g)}`);
  const einzeln = d.klammer.map((g) => T.text(T.mal(P(d.faktor), P(g)), { reihenfolge: VARS }));
  const schritte = [
    { art: "start", term, regel: "Der Anfang" },
    { art: "produkte", term: produkte.join(" + "), regel: `Der Faktor ${d.faktor} mal jedes der ${d.klammer.length} Glieder — jedes mit seinem Vorzeichen.` },
    { art: "ergebnis", term: summe(einzeln), regel: "Jedes Produkt ausgerechnet: Zahlen mal Zahlen, Variablen mal Variablen, Vorzeichenregel." },
  ];
  const liste = el("ol", { class: "tm-schritte-liste" });
  schritte.slice(0, n + 1).forEach((s, i) => {
    liste.appendChild(el("li", { "data-rolle": "schritt", "data-art": s.art, "data-term": s.term }, [
      el("span", { class: "tm-schritt-term" }, (i === 0 ? "" : "= ") + s.term),
      el("span", { class: "tm-regel" }, i === 0 ? s.regel : `${i}. ${s.regel}`),
    ]));
  });
  const mount = document.getElementById("am-mount");
  mount.innerHTML = "";
  mount.appendChild(liste);
  if (n < 2) {
    setzeText("am-text", n === 0 ? `Vor der Klammer steht ${d.faktor}. Geh mit dem Regler zum ersten Schritt.` : `${d.klammer.length} Produkte — achte bei jedem auf das Vorzeichen.`);
  } else {
    // Die Probe rechnet mit dem Termwerk der Seite: Anfang und Ergebnis werden dafür neu gelesen.
    const vars = VARS.filter((v) => term.includes(v));
    const bel = Object.fromEntries(vars.map((v) => [v, AM_PROBE[v]]));
    const wa = T.wert(P(term), bel), we = T.wert(P(summe(einzeln)), bel);
    setzeHtml("am-text", `Ausmultipliziert. <span data-rolle="probe">Probe mit ${vars.map((v) => `${v} = ${bel[v]}`).join(", ")}: Der Anfang ergibt ${num(wa)}, das Ergebnis ${num(we)}${wa === we ? " ✓" : " ✗"}</span>`);
  }
}

// ================= 3. Ausklammern: Kacheln in Zeilen legen =================

const AK_TERME = [[6, 9], [4, 8], [8, 12], [6, 4], [10, 15]];
const AK_U = 13, AK_LX = 40;     // dasselbe Verhältnis wie oben, kleiner: hier liegen bis zu 25 Kacheln in einer Reihe
const AK_W = 680, AK_H = 170;
const AK_X = 70, AK_Y = 46;

function renderAusklammern() {
  const [a, b] = AK_TERME[Number(wahl("ak-term"))];
  const k = reglerZahl("ak-k");
  setzeText("ak-k-anzeige", String(k));
  const qa = Math.floor(a / k), ra = a % k, qb = Math.floor(b / k), rb = b % k;
  const geht = ra === 0 && rb === 0;
  const svg = flaeche(AK_W, AK_H, `${a}x + ${b} in ${k} Zeilen`);
  // Das Rechteck: k Zeilen zu je qa x-Streifen und qb Einern.
  for (let r = 0; r < k; r++) {
    for (let s = 0; s < qa; s++) svg.appendChild(rechteck(AK_X + s * AK_LX, AK_Y + r * AK_U, AK_LX, AK_U, "tm-kachel tm-kachel-x", { "data-art": "x", "data-zeile": String(r) }));
    for (let s = 0; s < qb; s++) svg.appendChild(rechteck(AK_X + qa * AK_LX + s * AK_U, AK_Y + r * AK_U, AK_U, AK_U, "tm-kachel tm-kachel-1", { "data-art": "1", "data-zeile": String(r) }));
  }
  const breite = qa * AK_LX + qb * AK_U;
  svg.appendChild(svgText(AK_X - 12, AK_Y + (k * AK_U) / 2 + 5, String(k), { class: "tm-label tm-label-faktor", "data-rolle": "zeilen", "text-anchor": "end" }));
  // Was nicht aufgeht, liegt rechts daneben — rot.
  if (!geht) {
    const xr = AK_X + breite + 34;
    let x = xr;
    for (let s = 0; s < ra; s++) { svg.appendChild(rechteck(x, AK_Y, AK_LX, AK_U, "tm-kachel tm-kachel-x tm-rest", { "data-art": "x", "data-zeile": "rest" })); x += AK_LX + 3; }
    for (let s = 0; s < rb; s++) { svg.appendChild(rechteck(x, AK_Y, AK_U, AK_U, "tm-kachel tm-kachel-1 tm-rest", { "data-art": "1", "data-zeile": "rest" })); x += AK_U + 3; }
    svg.appendChild(svgText((xr + x - 3) / 2, AK_Y - 12, "Rest", { class: "tm-label tm-label-rest", "data-rolle": "rest" }));
  } else {
    svg.appendChild(svgText(AK_X + breite / 2, AK_Y - 12, `je Zeile ${summe([glied(qa, "x"), String(qb)])}`, { class: "tm-label", "data-rolle": "zeile" }));
  }
  zeige("ak-mount", svg);
  const g = ggT(a, b);
  const innen = summe([glied(qa, "x"), String(qb)]);
  if (geht) {
    setzeHtml("ak-bilanz", `${a}x + ${b} = <strong data-rolle="produkt">${k} · (${innen})</strong> &nbsp; <em>Probe:</em> ${k} · ${glied(qa, "x")} + ${k} · ${qb} = ${a}x + ${b} ✓`);
    setzeText("ak-text", k === 1
      ? "Eine einzige Zeile: Da ist nichts ausgeklammert — 1 · (…) ändert nichts."
      : k === g
        ? `${k} Zeilen gehen ohne Rest auf, und mehr geht nicht: ${k} ist der größte gemeinsame Teiler von ${a} und ${b}. In der Klammer haben ${qa} und ${qb} keinen gemeinsamen Teiler mehr — vollständig ausgeklammert.`
        : `${k} Zeilen gehen ohne Rest auf: ${k} ist ein gemeinsamer Teiler von ${a} und ${b}. Es geht aber noch weiter — der größte ist ${g}.`);
  } else {
    setzeHtml("ak-bilanz", `${a}x + ${b} lässt sich nicht in ${k} gleiche Zeilen legen.`);
    const rest = [ra ? `${ra} x-Streifen` : "", rb ? `${rb} Einer` : ""].filter(Boolean).join(" und ");
    setzeText("ak-text", `Mit ${k} Zeilen bleiben ${rest} übrig: ${k} teilt ${ra && rb ? `weder ${a} noch ${b}` : ra ? `${a} nicht` : `${b} nicht`} — ${k} ist kein gemeinsamer Teiler.`);
  }
}

// ================= 4. Vollständig ausklammern =================

const VA_TERME = [
  { term: "12x² − 8x", faktoren: ["2", "4", "x", "2x", "4x", "8x"] },
  { term: "6x² + 9x", faktoren: ["3", "x", "3x", "9x"] },
  { term: "4a²b − 6ab²", faktoren: ["2", "ab", "2a", "2ab", "2a²b"] },
  { term: "5xy + 10x", faktoren: ["5", "x", "5x", "5xy"] },
];
// Ein Polynom durch ein Monom teilen — nur, wenn jedes Glied mit ganzer Zahl und ohne negative
// Hochzahl übrig bleibt. Sonst ist das Monom kein gemeinsamer Faktor.
function geteilt(p, f) {
  const [fm] = T.glieder(f);
  const out = [];
  for (const m of T.glieder(p)) {
    const z = m.k.z * fm.k.n, nn = m.k.n * fm.k.z;
    if (z % nn !== 0) return null;
    const v = {};
    for (const name of new Set([...Object.keys(m.v), ...Object.keys(fm.v)])) {
      const e = (m.v[name] || 0) - (fm.v[name] || 0);
      if (e < 0) return null;
      if (e > 0) v[name] = e;
    }
    const varTeil = Object.keys(v).sort().map((n) => n + (v[n] > 1 ? "^" + v[n] : "")).join("*");
    out.push(varTeil ? `(${z / nn})*${varTeil}` : `(${z / nn})`);
  }
  return P(out.join(" + "));
}

function vaFaktorenSetzen() {
  const d = VA_TERME[Number(wahl("va-term"))];
  const sel = document.getElementById("va-faktor");
  sel.innerHTML = "";
  d.faktoren.forEach((f, i) => sel.appendChild(el("option", { value: String(i) }, f)));
}
function renderVollstaendig() {
  const d = VA_TERME[Number(wahl("va-term"))];
  const f = d.faktoren[Number(wahl("va-faktor"))] ?? d.faktoren[0];
  const p = P(d.term), fp = P(f);
  const innen = geteilt(p, fp);
  if (!innen) {
    setzeHtml("va-bilanz", `${d.term}: <strong data-rolle="urteil">${f} ist kein gemeinsamer Faktor</strong>`);
    setzeText("va-text", `Nicht jedes Glied lässt sich durch ${f} teilen, ohne dass ein Bruch oder eine negative Hochzahl entsteht — ${f} steckt nicht in allen Gliedern.`);
    return;
  }
  const innenText = T.text(innen, { reihenfolge: VARS });
  const rest = T.gemeinsamerFaktor(innen);
  const restText = rest && T.monom({ v: rest.v, k: T.Q(rest.t) }, { reihenfolge: VARS });
  const zurueck = T.text(T.mal(fp, innen), { reihenfolge: VARS });
  setzeHtml("va-bilanz",
    `${d.term} = <span data-rolle="produkt">${f} · (${innenText})</span> &nbsp; <em>Probe:</em> ausmultipliziert ${zurueck} ${T.gleich(T.mal(fp, innen), p) ? "✓" : "✗"}<br>` +
    `<strong data-rolle="urteil">${rest ? "gleichwertig, aber nicht vollständig" : "vollständig ausgeklammert"}</strong>`);
  setzeText("va-text", rest
    ? `In der Klammer steckt noch der gemeinsame Faktor ${restText}: ${innenText}. Er gehört mit vor die Klammer.`
    : `In der Klammer haben die Glieder keinen gemeinsamen Faktor mehr — weder eine Zahl größer als 1 noch eine Variable.`);
}

// ================= Kontrollfragen =================

const QUIZZE = {
  "quiz-distributiv": {
    q: "Welcher Term ist gleichwertig mit 4 · (x + 3)?",
    options: ["4x + 3", "4x + 12", "x + 12", "4x + 7"],
    correct: 1,
    explain: "Der Faktor 4 wird mit jedem Glied der Klammer multipliziert: 4 · x + 4 · 3 = 4x + 12. Im Rechteckbild: 4 Zeilen, in jeder ein x-Streifen und 3 Einer — rechts liegen also 4 · 3 = 12 Einer, nicht 3. 4x + 7 addiert die 4 zur 3.",
  },
  "quiz-ausmultiplizieren": {
    q: "Was ergibt −2 · (3x − 4)?",
    options: ["−6x − 8", "6x − 8", "−6x − 4", "−6x + 8"],
    correct: 3,
    explain: "(−2) · 3x = −6x und (−2) · (−4) = +8, also −6x + 8. Bei −6x − 8 ist Minus mal Minus falsch gerechnet, bei −6x − 4 wurde die 4 gar nicht multipliziert, und 6x − 8 vertauscht beide Vorzeichen.",
  },
  "quiz-ausklammern": {
    q: "Wie lautet 5x + 5 mit ausgeklammerter 5?",
    options: ["5 · (x + 1)", "5 · x", "5 · (x + 5)", "5x · (1 + 1)"],
    correct: 0,
    explain: "Jedes Glied durch 5 geteilt: 5x : 5 = x und 5 : 5 = 1 — die 1 bleibt in der Klammer stehen. Probe: 5 · (x + 1) = 5x + 5 ✓. 5 · x ergibt nur 5x, 5 · (x + 5) ergibt 5x + 25, und 5x · (1 + 1) ist 10x.",
  },
  "quiz-vollstaendig": {
    q: "Welche Zeile ist 18a² + 12a vollständig ausgeklammert?",
    options: ["6 · (3a² + 2a)", "3a · (6a + 4)", "6a · (3a + 2)", "2a · (9a + 6)"],
    correct: 2,
    explain: "ggT(18, 12) = 6, und a steckt in beiden Gliedern: 6a · (3a + 2). Alle vier Zeilen sind gleichwertig, aber nur in dieser bleibt in der Klammer kein gemeinsamer Faktor: 3a² + 2a hat noch a, 6a + 4 und 9a + 6 haben noch eine Zahl gemeinsam.",
  },
};

// ================= Start =================

["dg-art", "dg-k", "dg-m", "dg-c", "dg-t"].forEach((id) => document.getElementById(id).addEventListener("input", renderDistributiv));
["am-term", "am-schritt"].forEach((id) => document.getElementById(id).addEventListener("input", renderAusmultiplizieren));
["ak-term", "ak-k"].forEach((id) => document.getElementById(id).addEventListener("input", renderAusklammern));
document.getElementById("va-term").addEventListener("input", () => { vaFaktorenSetzen(); renderVollstaendig(); });
document.getElementById("va-faktor").addEventListener("input", renderVollstaendig);

renderDistributiv();
renderAusmultiplizieren();
renderAusklammern();
vaFaktorenSetzen();
renderVollstaendig();
mountQuizze(QUIZZE);
mountUebungsaufgaben(document.getElementById("exercises-mount"), AUFGABEN);
