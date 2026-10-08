// Selbsttest „Ableiten“ und „Aufleiten“ — gemeinsam für die Analysis-Seiten.
//
// Man wählt eine Funktion f (oder gibt eine eigene ein) und tippt eine Ableitung bzw. eine
// Stammfunktion ein. Die Seite macht die Probe numerisch: an acht Stellen (bei Funktionenscharen
// zusätzlich für drei Werte des Parameters) wird die Eingabe mit der durch zentrale Differenzen
// bestimmten Ableitung von f verglichen — bzw. beim Aufleiten die Ableitung der Eingabe mit f.
// Bei einem Fehler nennt sie den wahrscheinlichen Grund.
//
// Der Term wird von einem kleinen Zerleger gelesen (kein eval): Zahlen mit Komma, x, π, Parameter,
// + − · * / ^, Klammern, sin, cos, tan, sqrt/√, Hochzahlen ²³⁴⁵ und weggelassene Malzeichen
// (2x, 3(x + 1), 3a²x).
//
//   mountSelbsttest(container, {
//     praefix,          Kennungen der Elemente: `${praefix}-aufgabe`, `-f`, `-eigen-zeile`,
//                       `-${feld.id}`, `-pruefen`, `-ergebnis`
//     art,              "ableitung" oder "stamm"
//     felder,           [{ id, name, ordnung }] — ordnung 1 = f′, 2 = f″; beim Aufleiten ein Feld
//     aufgaben,         [{ t, label?, f(x, p), tipp: [Text je Feld] | Text }]
//     fName = "f",      Name der Funktion in Texten („fₐ“ bei Scharen)
//     parameter = [],   z. B. ["a"]; parameterWerte = [0,7; 1,6; 2,3]
//     stellen,          Prüfstellen für x
//     platzhalter,      [Text je Feld]
//   })

"use strict";

const FORMAT = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 4 });
function zahl(x, stellen = 4) {
  const f = Math.pow(10, stellen);
  const g = Math.round(x * f) / f;
  return (stellen === 4 ? FORMAT : new Intl.NumberFormat("de-DE", { maximumFractionDigits: stellen })).format(g === 0 ? 0 : g).replace("-", "−");
}

export function leseTerm(text, { parameter = [] } = {}) {
  const quelle = String(text).toLowerCase()
    .replace(/[−–]/g, "-").replace(/[·×]/g, "*").replace(/:/g, "/").replace(/,/g, ".")
    .replace(/²/g, "^2").replace(/³/g, "^3").replace(/⁴/g, "^4").replace(/⁵/g, "^5")
    .replace(/√/g, "sqrt").replace(/π/g, "pi").replace(/\s+/g, "")
    // Wer „f′(x) = …“ oder „F(x) = …“ mit abschreibt, soll nicht scheitern.
    .replace(/^[a-zₐ]+['′″‴]*\(x\)=/, "");
  if (!quelle) throw new Error("Die Eingabe ist leer.");
  // Funktionsnamen zuerst: „tan“ enthält das a einer Schar.
  const NAMEN = ["sqrt", "wurzel", "sin", "cos", "tan", "pi", ...parameter, "x"];
  const marken = [];
  for (let i = 0; i < quelle.length;) {
    const rest = quelle.slice(i);
    const z = rest.match(/^(\d+\.?\d*|\.\d+)/);
    if (z) { marken.push({ art: "zahl", wert: parseFloat(z[1]) }); i += z[1].length; continue; }
    if ("+-*/^()".includes(rest[0])) { marken.push({ art: rest[0] }); i++; continue; }
    const name = NAMEN.find((n) => rest.startsWith(n));
    if (name) { marken.push({ art: "name", wert: name === "wurzel" ? "sqrt" : name }); i += name.length; continue; }
    throw new Error(`Unbekanntes Zeichen „${rest[0]}“.`);
  }
  let k = 0;
  const sieh = () => marken[k], nimm = () => marken[k++];
  const beginntFaktor = (m) => m && (m.art === "zahl" || m.art === "name" || m.art === "(");
  function summe() {
    let a = produkt();
    while (sieh() && (sieh().art === "+" || sieh().art === "-")) {
      const op = nimm().art, b = produkt(), l = a;
      a = op === "+" ? { f: (x, p) => l.f(x, p) + b.f(x, p), t: `${l.t} + ${b.t}` } : { f: (x, p) => l.f(x, p) - b.f(x, p), t: `${l.t} − ${b.t}` };
    }
    return a;
  }
  function produkt() {
    let a = vorzeichen();
    for (;;) {
      const m = sieh();
      if (m && (m.art === "*" || m.art === "/")) {
        nimm();
        const b = vorzeichen(), l = a;
        a = m.art === "*" ? { f: (x, p) => l.f(x, p) * b.f(x, p), t: `${l.t} · ${b.t}` } : { f: (x, p) => l.f(x, p) / b.f(x, p), t: `${l.t} / ${b.t}` };
      } else if (beginntFaktor(m)) {
        // Weggelassener Malpunkt: 2x, 3(x + 1), x sin(x).
        const b = potenz(), l = a;
        a = { f: (x, p) => l.f(x, p) * b.f(x, p), t: `${l.t} · ${b.t}` };
      } else return a;
    }
  }
  function vorzeichen() {
    const m = sieh();
    if (m && (m.art === "-" || m.art === "+")) {
      nimm();
      const a = vorzeichen();
      return m.art === "-" ? { f: (x, p) => -a.f(x, p), t: `−${a.t}` } : a;
    }
    return potenz();
  }
  function potenz() {
    const a = grund();
    if (sieh() && sieh().art === "^") {
      nimm();
      const b = vorzeichen();
      return { f: (x, p) => Math.pow(a.f(x, p), b.f(x, p)), t: `${a.t}^${b.t}` };
    }
    return a;
  }
  function grund() {
    const m = nimm();
    if (!m) throw new Error("Der Term endet zu früh.");
    if (m.art === "zahl") return { f: () => m.wert, t: zahl(m.wert, 6) };
    if (m.art === "(") {
      const a = summe();
      if (!sieh() || nimm().art !== ")") throw new Error("Eine Klammer wird nicht geschlossen.");
      return { f: a.f, t: `(${a.t})` };
    }
    if (m.art === "name") {
      if (m.wert === "x") return { f: (x) => x, t: "x" };
      if (m.wert === "pi") return { f: () => Math.PI, t: "π" };
      if (parameter.includes(m.wert)) return { f: (x, p) => p[m.wert], t: m.wert };
      // sin x und sin(x) sind beide erlaubt; ohne Klammer gilt nur das nächste Grundelement.
      const arg = grund(), fn = { sqrt: Math.sqrt, sin: Math.sin, cos: Math.cos, tan: Math.tan }[m.wert];
      return { f: (x, p) => fn(arg.f(x, p)), t: `${m.wert === "sqrt" ? "√" : m.wert}(${arg.t.replace(/^\((.*)\)$/, "$1")})` };
    }
    throw new Error(`„${m.art}“ steht an einer Stelle, an der eine Zahl, x oder eine Klammer erwartet wird.`);
  }
  const ergebnis = summe();
  if (k < marken.length) {
    const m = marken[k];
    throw new Error(`Nach „${ergebnis.t}“ bleibt „${m.art === "name" ? m.wert : m.art === "zahl" ? zahl(m.wert, 6) : m.art}“ übrig.`);
  }
  return ergebnis;
}

// ---------- Numerik ----------
// k-te Ableitung nach x durch zentrale Differenzen; die Schrittweite wächst mit k, damit die
// Rundungsfehler (Division durch hᵏ) klein bleiben.
function ableitungK(g, x, p, k) {
  if (k === 0) return g(x, p);
  if (k === 1) { const h = 1e-5; return (g(x + h, p) - g(x - h, p)) / (2 * h); }
  if (k === 2) { const h = 1e-4; return (g(x + h, p) - 2 * g(x, p) + g(x - h, p)) / (h * h); }
  const h = 2e-3;
  return (g(x + 2 * h, p) - 2 * g(x + h, p) + 2 * g(x - h, p) - g(x - 2 * h, p)) / (2 * h ** 3);
}
const TOL = [1e-4, 1e-4, 1e-4, 2e-3];
const gleich = (a, b, k = 1) => Math.abs(a - b) <= TOL[Math.min(k, 3)] * (1 + Math.abs(b));
const STRICHE = ["", "′", "″", "‴"];

const SCHREIBWEISE = "Schreibweise: x^3 oder x³, 2x, 1/x, √x oder sqrt(x), sin(x), cos(x), π; Malpunkt * oder ·; Komma als Dezimalzeichen.";

export function mountSelbsttest(container, cfg) {
  const { praefix: P, art, felder, aufgaben, fName = "f", parameter = [], parameterWerte = [0.7, 1.6, 2.3] } = cfg;
  const stellen = cfg.stellen || [0.3, 0.55, 0.8, 1.05, 1.3, 1.7, 2.1, 2.45];
  const leer = art === "stamm" ? `Tippe eine Stammfunktion ${felder[0].name} ein und drücke „Prüfen“.` : `Tippe ${felder.map((d) => d.name).join(" und ")} ein und drücke „Prüfen“.`;
  container.innerHTML =
    `<div class="btn-row"><label>Funktion ${fName}: <select id="${P}-aufgabe" class="eingabe" style="padding:0.4rem">` +
    aufgaben.map((a, i) => `<option value="${i}">${a.label || `${fName}(x) = ${a.t}`}</option>`).join("") +
    `<option value="eigen">eigene Funktion eingeben …</option></select></label></div>` +
    `<div class="btn-row" id="${P}-eigen-zeile" hidden><label>${fName}(x) = <input type="text" id="${P}-f" class="eingabe selbsttest-eingabe" autocomplete="off" spellcheck="false" placeholder="z. B. 3x^2 − 2x${parameter.length ? " + " + parameter[0] : ""}"></label></div>` +
    felder.map((d, i) => `<div class="btn-row"><label>${d.name} = <input type="text" id="${P}-${d.id}" class="eingabe selbsttest-eingabe" autocomplete="off" spellcheck="false" placeholder="${(cfg.platzhalter || [])[i] || ""}"></label>${i === felder.length - 1 ? ` <button type="button" id="${P}-pruefen" class="btn-primary">Prüfen</button>` : ""}</div>`).join("") +
    `<p class="progress-note">${SCHREIBWEISE}${parameter.length ? ` Der Parameter ${parameter.join(", ")} wird wie eine Zahl geschrieben, etwa 3${parameter[0]}²x.` : ""}</p>` +
    `<div id="${P}-ergebnis" class="event-result" aria-live="polite">${leer}</div>`;
  const $ = (id) => document.getElementById(`${P}-${id}`);

  function pruefe() {
    const wahl = $("aufgabe").value, eigen = wahl === "eigen";
    $("eigen-zeile").hidden = !eigen;
    const aus = $("ergebnis");
    const eingaben = felder.map((d) => $(d.id).value);
    if (eingaben.every((e) => !e.trim())) { aus.innerHTML = leer; return; }
    let f, ft, tipps = [];
    try {
      if (eigen) { const t = leseTerm($("f").value, { parameter }); f = t.f; ft = t.t; }
      else { const a = aufgaben[Number(wahl)]; f = a.f; ft = a.t; tipps = [].concat(a.tipp || []); }
    } catch (e) {
      aus.innerHTML = `<span class="selbsttest-urteil err">${fName}(x) nicht lesbar:</span> ${e.message}`;
      return;
    }
    // Prüfpunkte: Stellen × Parameterwerte. Nur Punkte, an denen alles endlich ist — √x und 1/x
    // sind links von 0 nicht erklärt.
    const punkte = [];
    for (const x of stellen) for (const w of parameter.length ? parameterWerte : [null]) punkte.push({ x, p: w === null ? {} : { [parameter[0]]: w } });
    const zeilen = felder.map((d, i) => {
      const roh = eingaben[i];
      if (!roh.trim()) return null;
      let g;
      try { g = leseTerm(roh, { parameter }); } catch (e) {
        return `<span class="selbsttest-urteil err">${d.name} nicht lesbar:</span> ${e.message}`;
      }
      return art === "stamm" ? urteilStamm(d, g, f, ft, punkte, tipps[i]) : urteilAbleitung(d, g, f, ft, punkte, tipps[i]);
    }).filter((z) => z !== null);
    aus.innerHTML = zeilen.join("<hr class=\"selbsttest-trenner\">");
  }

  // Tabelle mit vier Prüfpunkten aus dem ganzen Bereich: Eingabe gegen Soll. (Bei Scharen lägen die
  // ersten vier sonst alle bei derselben Stelle x.)
  function tabelle(proben, kopfIst, kopfSoll) {
    const vier = [0, 1, 2, 3].map((i) => proben[Math.round((i * (proben.length - 1)) / 3)]);
    const spalte = (fn) => vier.map((q) => `<td>${fn(q)}</td>`).join("");
    return `<table class="selbsttest-proben"><tr><th>x</th>${spalte((q) => zahl(q.x))}</tr>` +
      (parameter.length ? `<tr><th>${parameter[0]}</th>${spalte((q) => zahl(q.p[parameter[0]]))}</tr>` : "") +
      `<tr><th>${kopfIst}</th>${spalte((q) => zahl(q.ist))}</tr><tr><th>${kopfSoll}</th>${spalte((q) => zahl(q.soll))}</tr></table>`;
  }
  const tippText = (t) => (t ? `<br>💡 Tipp: ${t}` : "");
  const gelesen = (d, g, ft) => `<span class="progress-note">Gelesen: ${d.name} = ${g.t}${$("aufgabe").value === "eigen" ? `, ${fName}(x) = ${ft}` : ""}.</span>`;

  function urteilStamm(d, F, f, ft, punkte, tipp) {
    const proben = punkte.map(({ x, p }) => ({ x, p, f: f(x, p), F: F.f(x, p), ist: ableitungK(F.f, x, p, 1) }))
      .filter((q) => [q.f, q.F, q.ist].every(Number.isFinite)).map((q) => ({ ...q, soll: q.f }));
    if (proben.length < 4) return `<span class="selbsttest-urteil err">Nicht auswertbar:</span> ${fName} oder F ist an zu vielen Prüfstellen nicht definiert.`;
    const alle = (bed) => proben.every(bed);
    let urteil;
    if (alle((q) => gleich(q.ist, q.f))) {
      urteil = `<span class="selbsttest-urteil ok">✓ Richtig — F ist eine Stammfunktion von ${fName}(x) = ${ft}.</span> Die Probe F′(x) = ${fName}(x) stimmt an allen ${proben.length} Prüfstellen. Auch F(x) + C wäre für jede Konstante C richtig.`;
    } else {
      let grund;
      const v = proben.find((q) => Math.abs(q.f) > 1e-9), verh = v ? v.ist / v.f : NaN;
      if (alle((q) => gleich(q.F, ableitungK(f, q.x, q.p, 1)))) grund = `Das ist die <strong>Ableitung</strong> von ${fName}, nicht eine Stammfunktion. Gesucht ist ein F mit F′ = ${fName} — die Ableitungsregeln rückwärts.`;
      else if (alle((q) => gleich(q.F, q.f))) grund = `Das ist ${fName} selbst. Gesucht ist eine Funktion, deren Ableitung ${fName} ergibt.`;
      else if (alle((q) => gleich(q.ist, -q.f))) grund = `<strong>Vorzeichenfehler:</strong> Dein F′ ist genau −${fName} — irgendwo ist ein Minus verloren gegangen. Häufig bei sin/cos ((−cos x)′ = sin x) oder bei negativen Exponenten ((x⁻¹)′ = −x⁻²).`;
      else if (Number.isFinite(verh) && Math.abs(verh) > 1e-6 && alle((q) => gleich(q.ist, verh * q.f)))
        grund = `<strong>Bis auf einen Faktor richtig:</strong> F′(x) = ${zahl(verh)} · ${fName}(x). Teile dein F durch ${zahl(verh)} — oft fehlt das Teilen durch den neuen Exponenten oder durch die innere Ableitung.`;
      else {
        const q = proben.find((r) => !gleich(r.ist, r.f));
        grund = `Bei x = ${zahl(q.x)} ist F′(x) ≈ ${zahl(q.ist)}, aber ${fName}(x) = ${zahl(q.f)}.`;
      }
      urteil = `<span class="selbsttest-urteil err">✗ Noch nicht — F′ ist nicht ${fName}.</span> ${grund}${tippText(tipp)}`;
    }
    return `${urteil}<br>${gelesen(d, F, ft)}${tabelle(proben, "F′(x)", `${fName}(x)`)}`;
  }

  function urteilAbleitung(d, g, f, ft, punkte, tipp) {
    const k = d.ordnung, S = (j) => `${fName}${STRICHE[j]}`;
    const proben = punkte.map(({ x, p }) => ({ x, p, ist: g.f(x, p), soll: ableitungK(f, x, p, k), f: f(x, p) }))
      .filter((q) => [q.ist, q.soll, q.f].every(Number.isFinite));
    if (proben.length < 4) return `<span class="selbsttest-urteil err">Nicht auswertbar:</span> ${fName} oder deine Eingabe ist an zu vielen Prüfstellen nicht definiert.`;
    const alle = (bed) => proben.every(bed);
    const vor = (j) => (q) => ableitungK(f, q.x, q.p, j);
    let urteil;
    if (alle((q) => gleich(q.ist, q.soll, k))) {
      urteil = `<span class="selbsttest-urteil ok">✓ Richtig — ${d.name} stimmt.</span> Die Probe trifft an allen ${proben.length} Prüfstellen die Ableitung von ${fName}(x) = ${ft}${k === 2 ? ", zweimal abgeleitet" : ""}.`;
    } else {
      let grund;
      const v = proben.find((q) => Math.abs(q.soll) > 1e-6), verh = v ? v.ist / v.soll : NaN;
      const diff = proben[0].ist - proben[0].soll;
      if (alle((q) => gleich(q.ist, vor(k - 1)(q), k - 1)))
        grund = k === 1 ? `Das ist ${fName} selbst — noch nicht abgeleitet.` : `Das ist ${S(k - 1)} — einmal zu wenig abgeleitet. ${S(k)} ist die Ableitung von ${S(k - 1)}.`;
      else if (alle((q) => gleich(q.ist, vor(k + 1)(q), k + 1)))
        grund = `Das ist ${S(k + 1)} — einmal zu oft abgeleitet.`;
      else if (k === 1 && alle((q) => gleich(ableitungK(g.f, q.x, q.p, 1), q.f)))
        grund = `Leitet man deine Eingabe ab, kommt ${fName} heraus — du hast in die falsche Richtung gerechnet. Gesucht ist ${S(1)}: Exponent als Faktor nach vorn, Exponent um 1 verringern.`;
      else if (parameter.length && alle((q) => {
        const a = parameter[0], h = 1e-5;
        const nachA = (ableitungK(f, q.x, { ...q.p, [a]: q.p[a] + h }, k - 1) - ableitungK(f, q.x, { ...q.p, [a]: q.p[a] - h }, k - 1)) / (2 * h);
        return gleich(q.ist, nachA, k);
      }))
        grund = `Das ist die Ableitung <strong>nach ${parameter[0]}</strong>. Abgeleitet wird nach x; ${parameter[0]} ist eine feste Zahl.`;
      else if (alle((q) => gleich(q.ist, -q.soll, k)))
        grund = `<strong>Vorzeichenfehler:</strong> Deine Eingabe ist genau −${S(k)}(x). Häufig bei cos ((cos x)′ = −sin x) oder bei negativen Exponenten ((x⁻¹)′ = −x⁻²).`;
      else if (Number.isFinite(verh) && Math.abs(verh) > 1e-6 && alle((q) => gleich(q.ist, verh * q.soll, k)))
        grund = `<strong>Bis auf einen Faktor richtig:</strong> Deine Eingabe ist ${zahl(verh)} · ${S(k)}(x). Oft fehlt der alte Exponent als Faktor oder die innere Ableitung.`;
      else if (Math.abs(diff) > 1e-6 && alle((q) => gleich(q.ist - q.soll, diff, k)))
        grund = `<strong>Bis auf eine Konstante richtig:</strong> Deine Eingabe ist ${S(k)}(x) ${diff < 0 ? "−" : "+"} ${zahl(Math.abs(diff))}. Ein konstanter Summand fällt beim Ableiten weg.`;
      else {
        const q = proben.find((r) => !gleich(r.ist, r.soll, k));
        grund = `Bei x = ${zahl(q.x)}${parameter.length ? ` und ${parameter[0]} = ${zahl(q.p[parameter[0]])}` : ""} ergibt deine Eingabe ${zahl(q.ist)}, aber ${S(k)}(x) = ${zahl(q.soll)}.`;
      }
      urteil = `<span class="selbsttest-urteil err">✗ Noch nicht — ${d.name} stimmt nicht.</span> ${grund}${tippText(tipp)}`;
    }
    return `${urteil}<br>${gelesen(d, g, ft)}${tabelle(proben, "Eingabe", `${S(k)}(x)`)}`;
  }

  $("pruefen").addEventListener("click", pruefe);
  for (const id of ["f", ...felder.map((d) => d.id)]) $(id).addEventListener("keydown", (e) => { if (e.key === "Enter") pruefe(); });
  $("aufgabe").addEventListener("change", () => {
    $("eigen-zeile").hidden = $("aufgabe").value !== "eigen";
    $("ergebnis").innerHTML = leer;
  });
}
