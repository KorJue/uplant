// Prüfbausteine für die Termaufgaben (mathematik/terme.js): Ableitungsfunktion bestimmen, f′ und f″
// bestimmen, Stammfunktion bestimmen.
//
// Die Seite kennt zu jeder gewürfelten Funktion ihre Ableitung und Stammfunktion exakt. Die Prüfung
// benutzt davon nichts: Sie liest die Funktion so, wie sie in der Angabe STEHT (mit Hochzahlen,
// Wurzelzeichen und gesetzten Brüchen), übersetzt sie mit einem eigenen, absichtlich anders gebauten
// Leser in eine Rechenvorschrift und leitet numerisch ab. Damit wird nachgeprüft,
//   * dass die Musterlösung (die getippte Form UND die gesetzte Formel) wirklich die Ableitung bzw.
//     eine Stammfunktion der angezeigten Funktion ist — eine Angabe, die 5x³ zeigt und mit 5x²
//     rechnet, fiele hier auf;
//   * dass die Seite diese Lösung anerkennt (bei der Stammfunktion auch mit einer beliebigen
//     Konstanten) und die typischen Fehler mit ihrem Hinweis zurückweist.
//
// Gebrauch:
//   const { termDeuter, liesTermAufgabe } = require("../lib/terme");
//   pruefeAufgabe(page, bericht, { nr, name, runden, mindestensVerschieden,
//     liesRoh: liesTermAufgabe, deute: termDeuter(bericht, name, "ableitung" | "zweite" | "stamm") });

"use strict";

// ---------- Eigener Termleser ----------
//
// Er arbeitet über Zeichenketten und eine Tokenliste und übersetzt in einen JavaScript-Ausdruck — ein
// anderer Weg als der rekursive Abstieg der Seite, damit ein gemeinsamer Denkfehler nicht in beiden
// steckt. Er versteht genau das, was die Seite anzeigt und als Eingabeform vorschlägt:
// Ziffern mit Komma, x und a, + − * / ^, Hochzahlen ⁰…⁹, √x und √(…), sqrt/sin/cos/tan, Klammern,
// den Malpunkt und das Weglassen des Malpunkts.

const HOCH = { "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9", "⁻": "-" };
const FUNKTIONEN = ["sqrt", "sin", "cos", "tan", "pw"];

function normiere(text) {
  let s = String(text)
    .replace(/[−–]/g, "-").replace(/[·⋅×]/g, "*").replace(/,/g, ".")
    .replace(/\s+/g, "");
  // Hochzahlen: Eine Folge hochgestellter Zeichen wird zu einem Exponenten.
  s = s.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+/g, (m) => "^(" + [...m].map((c) => HOCH[c]).join("") + ")");
  // Wurzel: √(…) wie sqrt(…); √x, √a, √2 gelten nur für das unmittelbar folgende Zeichen.
  s = s.replace(/√\(/g, "sqrt(").replace(/√([xa]|\d+(?:\.\d+)?)/g, "sqrt($1)");
  if (s.includes("√")) throw new Error(`Wurzelzeichen nicht lesbar: ${text}`);
  return s;
}

function zerlege(s) {
  const t = [];
  let i = 0;
  while (i < s.length) {
    const rest = s.slice(i);
    const zahl = rest.match(/^\d+(?:\.\d+)?/);
    if (zahl) { t.push({ art: "zahl", w: zahl[0] }); i += zahl[0].length; continue; }
    const fn = FUNKTIONEN.find((f) => rest.startsWith(f + "("));
    if (fn) { t.push({ art: "fn", w: fn }); i += fn.length; continue; }
    if (rest[0] === "x" || rest[0] === "a") { t.push({ art: "var", w: rest[0] }); i++; continue; }
    if ("+-*/^()".includes(rest[0])) { t.push({ art: rest[0] === "(" || rest[0] === ")" ? rest[0] : "op", w: rest[0] }); i++; continue; }
    throw new Error(`Unbekanntes Zeichen „${rest[0]}“ in ${s}`);
  }
  // Fehlender Malpunkt: nach Zahl, Variable oder „)“ und vor Zahl, Variable, Funktion oder „(“.
  const mit = [];
  for (const tok of t) {
    const vor = mit[mit.length - 1];
    if (vor && ["zahl", "var", ")"].includes(vor.art) && ["zahl", "var", "fn", "("].includes(tok.art)) mit.push({ art: "op", w: "*" });
    mit.push(tok);
  }
  return mit;
}

// Index der zu t[i] (eine Klammer) passenden Gegenklammer.
function gegenklammer(t, i, schritt) {
  let tiefe = 0;
  for (let j = i; j >= 0 && j < t.length; j += schritt) {
    if (t[j].art === "(") tiefe += schritt;
    if (t[j].art === ")") tiefe -= schritt;
    if (tiefe === 0) return j;
  }
  throw new Error("Klammern passen nicht");
}

// Potenzen werden zu pw(Basis, Exponent): In JavaScript ist -x**2 ein Syntaxfehler, und die Basis
// muss ohnehin gegen ein vorangestelltes Minus abgegrenzt werden (−x² = −(x²)).
function potenzen(t) {
  for (;;) {
    let i = -1;
    for (let j = t.length - 1; j >= 0; j--) if (t[j].art === "op" && t[j].w === "^") { i = j; break; }
    if (i < 0) return t;
    // Basis: Zahl, Variable oder Klammer (samt Funktionsname davor).
    let b0 = i - 1;
    if (t[b0].art === ")") { b0 = gegenklammer(t, b0, -1); if (b0 > 0 && t[b0 - 1].art === "fn") b0--; }
    // Exponent: optional ein Vorzeichen, dann Zahl, Variable oder Klammer (samt Funktion).
    let e1 = i + 1;
    if (t[e1].art === "op" && t[e1].w === "-") e1++;
    if (t[e1].art === "fn") e1++;
    if (t[e1].art === "(") e1 = gegenklammer(t, e1, 1);
    t = [...t.slice(0, b0), { art: "fn", w: "pw" }, { art: "(", w: "(" }, ...t.slice(b0, i), { art: "op", w: "," },
      ...t.slice(i + 1, e1 + 1), { art: ")", w: ")" }, ...t.slice(e1 + 1)];
  }
}

const JS = { sqrt: "Math.sqrt", sin: "Math.sin", cos: "Math.cos", tan: "Math.tan", pw: "Math.pow" };

// Text → (x, a) => Zahl. Wirft bei unlesbarem Text.
function alsFunktion(text) {
  const t = potenzen(zerlege(normiere(text)));
  const js = t.map((tok) => (tok.art === "fn" ? JS[tok.w] : tok.w)).join(" ");
  // eslint-disable-next-line no-new-func
  const f = new Function("x", "a", `"use strict"; return (${js});`);
  return (x, a = 1) => f(x, a);
}

// ---------- Nachrechnen ----------

const XS = [0.62, 0.97, 1.34, 1.71, 2.13];
const AS = [0.8, 1.9];
const H = 1e-4;
const ableitungNum = (g) => (x, a) => (g(x + H, a) - g(x - H, a)) / (2 * H);
const nahe = (u, v, tol) => Number.isFinite(u) && Number.isFinite(v) && Math.abs(u - v) <= tol * (1 + Math.abs(v));

// Stimmen zwei Funktionen an allen Prüfstellen überein? Liefert die erste Abweichung als Text.
function vergleiche(g, h, tol, mitA) {
  for (const x of XS) for (const a of mitA ? AS : [1]) {
    const u = g(x, a), v = h(x, a);
    if (!nahe(u, v, tol)) return `bei x = ${x}${mitA ? `, a = ${a}` : ""}: ${u} statt ${v}`;
  }
  return "";
}

// ---------- Lesen aus der Seite ----------

// Der Text einer gesetzten Formel: Brüche (Zähler über Nenner) werden zu ((Zähler)/(Nenner)).
const ALS_TEXT = (els) => els.map((el) => {
  const c = el.cloneNode(true);
  c.querySelectorAll(".bruch").forEach((b) => b.replaceWith(`((${b.querySelector(".z").textContent})/(${b.querySelector(".n").textContent}))`));
  return c.textContent;
});

// liesRoh für pruefeAufgabe(): die angezeigte Funktion, dazu die Musterlösung — einmal leer
// „Prüfen“ drücken, dann steht sie da. Die Eingabefelder bleiben dabei leer.
async function liesTermAufgabe(page, box) {
  const angabe = await page.locator(`${box} .aufgabe-prompt .term`).evaluateAll(ALS_TEXT);
  await page.locator(`${box} .btn-primary`).click();
  const formen = await page.locator(`${box} .musterloesung .eingabeform`).allInnerTexts();
  const ergebnisse = await page.locator(`${box} .musterloesung strong .term`).evaluateAll(ALS_TEXT);
  const felder = await page.locator(`${box} .aufgabe-feld input`).count();
  const einzeln = await page.locator(`${box} .exercise-input-row input`).count();
  return { angabe: angabe[0], formen, ergebnisse, felder, einzeln };
}

// deute für pruefeAufgabe(). art: "ableitung" (f′), "zweite" (f′ und f″), "stamm" (F).
function termDeuter(bericht, name, art) {
  return (frage, roh) => {
    if (!roh || !roh.angabe) return null;
    const mitA = /fₐ\(x\)/.test(frage);
    const fehler = (text) => bericht.pruefe(false, `${name}: ${text} — „${frage}“`);
    let f;
    try { f = alsFunktion(roh.angabe); } catch (e) { fehler(`Angabe „${roh.angabe}“ nicht lesbar (${e.message})`); return null; }
    const anzahl = art === "zweite" ? 2 : 1;
    bericht.pruefe(roh.formen.length === anzahl && roh.ergebnisse.length === anzahl,
      `${name}: ${roh.formen.length} Eingabeformen und ${roh.ergebnisse.length} Ergebnisse statt ${anzahl} — „${frage}“`);
    // Eine Aufgabe mit zwei Feldern darf das einzelne Antwortfeld nicht zusätzlich zeigen.
    bericht.pruefe(art === "zweite" ? roh.felder === 2 && roh.einzeln === 0 : roh.felder === 0 && roh.einzeln === 1,
      `${name}: ${roh.felder} Felder und ${roh.einzeln} Einzelfeld — „${frage}“`);
    if (roh.formen.length !== anzahl || roh.ergebnisse.length !== anzahl) return null;
    let L, E;
    try { L = roh.formen.map(alsFunktion); E = roh.ergebnisse.map(alsFunktion); } catch (e) {
      fehler(`Musterlösung nicht lesbar (${e.message}): ${roh.formen.join(" | ")}`); return null;
    }
    // Die gesetzte Formel und die Eingabeform meinen dieselbe Funktion.
    L.forEach((g, i) => {
      const abw = vergleiche(E[i], g, 1e-9, mitA);
      bericht.pruefe(!abw, `${name}: gesetzte Lösung „${roh.ergebnisse[i]}“ ≠ Eingabeform „${roh.formen[i]}“ ${abw} — „${frage}“`);
    });
    const [L1, L2] = roh.formen;
    if (art === "stamm") {
      const abw = vergleiche(ableitungNum(L[0]), f, 2e-6, mitA);
      bericht.pruefe(!abw, `${name}: (${L1})′ ist nicht f ${abw} — „${frage}“`);
      return {
        richtig: `${L1} + 7`,
        falsch: [[roh.angabe, "f selbst"], [`2*(${L1})`, "Bis auf einen Faktor"], [`-(${L1})`, "Vorzeichenfehler"]],
      };
    }
    const abw1 = vergleiche(L[0], ableitungNum(f), 2e-6, mitA);
    bericht.pruefe(!abw1, `${name}: „${L1}“ ist nicht die Ableitung der Angabe ${abw1} — „${frage}“`);
    if (art === "ableitung") {
      return {
        richtig: L1,
        falsch: [[roh.angabe, "noch nicht abgeleitet"], [`2*(${L1})`, "Bis auf einen Faktor"], [`-(${L1})`, "Vorzeichenfehler"], [`${L1} + 3`, "Bis auf eine Konstante"]],
      };
    }
    const abw2 = vergleiche(L[1], ableitungNum(L[0]), 2e-6, mitA);
    bericht.pruefe(!abw2, `${name}: „${L2}“ ist nicht die Ableitung von „${L1}“ ${abw2} — „${frage}“`);
    // f″ kann bei einer Schar konstant sein (etwa aus a·x² und a²·x); dann ist „f″ + 3“ zugleich ein
    // Vielfaches von f″. Deshalb wird im zweiten Feld nur mit Faktor und zu wenig Ableiten geprüft.
    return {
      felder: [L1, L2],
      falschFelder: [
        [0, roh.angabe, "noch nicht abgeleitet"], [0, `-(${L1})`, "Vorzeichenfehler"], [0, `2*(${L1})`, "Bis auf einen Faktor"], [0, L2, "einmal zu oft"],
        [1, L1, "einmal zu wenig"], [1, `2*(${L2})`, "Bis auf einen Faktor"],
      ],
    };
  };
}

// ---------- Der Termleser der Seite ----------
//
// Die Termaufgaben würfeln ihre Funktionen; welche Schreibweisen ein Mensch tippt, entscheidet aber
// er. Deshalb wird der Leser der Seite (leseTerm aus mathematik/terme.js) hier zusätzlich direkt mit
// Schreibweisen gefüttert, die in keiner Musterlösung vorkommen. Die Sollwerte rechnet Node.
const X0 = 1.3, A0 = 1.6;
const LESBAR = [
  ["6x − 5", 6 * X0 - 5],
  ["−4x^(−2)", -4 * X0 ** -2],
  ["−2x^−3", -2 * X0 ** -3],
  ["1/√x", 1 / Math.sqrt(X0)],
  ["x^(−0,5)", X0 ** -0.5],
  ["x^(−1/2)/2", X0 ** -0.5 / 2],
  ["2(x + 1)", 2 * (X0 + 1)],
  ["3x² + 1/x²", 3 * X0 ** 2 + 1 / X0 ** 2],
  ["x⁻¹ + x⁻²", 1 / X0 + 1 / X0 ** 2],
  ["(2x + 1)¹⁰", (2 * X0 + 1) ** 10],
  ["4/x^3", 4 / X0 ** 3],
  ["3 : x", 3 / X0],
  ["f′(x) = 3x²", 3 * X0 ** 2],
  ["F(x) = −cos(2x)/2", -Math.cos(2 * X0) / 2],
  ["x sin(x)", X0 * Math.sin(X0)],
  ["sin x + cos x", Math.sin(X0) + Math.cos(X0)],
  ["2√x − x√x + √(3x + 2)", 2 * Math.sqrt(X0) - X0 * Math.sqrt(X0) + Math.sqrt(3 * X0 + 2)],
  ["wurzel(x)", Math.sqrt(X0)],
  ["π · x", Math.PI * X0],
  ["−x²", -(X0 ** 2)],
  ["a · sin(x) + a²x", A0 * Math.sin(X0) + A0 ** 2 * X0, ["a"]],
  ["tan(x) − 2a", Math.tan(X0) - 2 * A0, ["a"]],
];
const UNLESBAR = ["2x)", "(x + 1", "", "y + 1", "x +", "3x $ 2"];

async function pruefeTermleser(page, bericht) {
  const ergebnis = await page.evaluate(async ({ lesbar, unlesbar, x, a }) => {
    const { leseTerm } = await import("/mathematik/terme.js?v=1");
    const werte = lesbar.map(([t, , parameter]) => {
      try { return leseTerm(t, { parameter: parameter || [] }).f(x, { a }); } catch (e) { return "Fehler: " + e.message; }
    });
    const wuerfe = unlesbar.map((t) => { try { leseTerm(t); return false; } catch (e) { return true; } });
    return { werte, wuerfe };
  }, { lesbar: LESBAR, unlesbar: UNLESBAR, x: X0, a: A0 });
  LESBAR.forEach(([t, soll], i) => {
    const ist = ergebnis.werte[i];
    bericht.pruefe(typeof ist === "number" && nahe(ist, soll, 1e-12), `Termleser: „${t}“ ergibt ${ist} statt ${soll}`);
  });
  UNLESBAR.forEach((t, i) => bericht.pruefe(ergebnis.wuerfe[i], `Termleser: „${t}“ wird gelesen, obwohl es kein Term ist`));

  // Feste Fälle für die Fehlerdiagnose — darunter die beiden, die beim Bau nachgebessert wurden:
  // 0,33 statt 1/3 ist 1 % daneben und muss als Rundung erkannt werden, und „+ 3“ an einer großen
  // Ableitung ((4x + 3)⁴ reicht bis über 10⁵) ist eine vergessene Konstante, keine Rundung.
  const fall = await page.evaluate(async (faelle) => {
    const m = await import("/mathematik/terme.js?v=1");
    const glied = ([typ, ...args]) => m[typ](...args.map((v) => (Array.isArray(v) ? m.q(v[0], v[1]) : v)));
    return faelle.map(({ art, glieder, eingabe }) => {
      const gl = glieder.map(glied);
      const a = art === "stamm" ? m.stammAufgabe(gl) : m.ableitungsAufgabe(gl);
      return { ok: a.check(eingabe), hinweis: a.hinweis(eingabe, NaN).replace(/<[^>]+>/g, "") };
    });
  }, DIAGNOSEN);
  DIAGNOSEN.forEach(({ art, glieder, eingabe, muster }, i) => {
    const { ok, hinweis } = fall[i];
    const passt = muster === "✓" ? ok : !ok && hinweis.includes(muster);
    bericht.pruefe(passt, `Diagnose (${art} von ${JSON.stringify(glieder)}): „${eingabe}“ → ${ok ? "richtig" : `„${hinweis}“`}, erwartet „${muster}“`);
  });
}

const F1 = [["pot", 3, 2], ["pot", -5, 1], ["pot", 2, 0]];   // 3x² − 5x + 2
const DIAGNOSEN = [
  { art: "ableitung", glieder: F1, eingabe: "6x − 5", muster: "✓" },
  { art: "ableitung", glieder: F1, eingabe: "6x − 5 + 2", muster: "Bis auf eine Konstante" },
  { art: "ableitung", glieder: F1, eingabe: "3x² − 5x + 2", muster: "noch nicht abgeleitet" },
  { art: "ableitung", glieder: F1, eingabe: "x^3 − 2,5x^2 + 2x", muster: "falsche Richtung" },
  { art: "ableitung", glieder: F1, eingabe: "6", muster: "einmal zu oft" },
  { art: "ableitung", glieder: F1, eingabe: "−6x + 5", muster: "Vorzeichenfehler" },
  { art: "ableitung", glieder: F1, eingabe: "3x − 2,5", muster: "Bis auf einen Faktor" },
  { art: "ableitung", glieder: F1, eingabe: "6x² − 5", muster: "Bei x =" },
  { art: "ableitung", glieder: F1, eingabe: "2x)", muster: "nicht lesbar" },
  { art: "ableitung", glieder: [["pot", [1, 6], 2], ["pot", 3, 1]], eingabe: "0,33x + 3", muster: "Fast richtig" },
  { art: "ableitung", glieder: [["kette", -1, 4, 3, 5], ["pot", 4, 2]], eingabe: "−20(4x + 3)^4 + 8x + 3", muster: "Bis auf eine Konstante" },
  { art: "ableitung", glieder: [["pot", 4, -2]], eingabe: "−8x^(−3)", muster: "✓" },
  { art: "stamm", glieder: [["pot", 1, 2]], eingabe: "x^3/3 + 5", muster: "✓" },
  { art: "stamm", glieder: [["pot", 1, 2]], eingabe: "0,33x^3", muster: "Fast richtig" },
  { art: "stamm", glieder: [["pot", 1, 2]], eingabe: "2x", muster: "Ableitung" },
  { art: "stamm", glieder: [["pot", 1, 2]], eingabe: "x²", muster: "f selbst" },
  { art: "stamm", glieder: [["trig", 1, "cos", 2]], eingabe: "sin(2x)/2", muster: "✓" },
  { art: "stamm", glieder: [["trig", 1, "cos", 2]], eingabe: "−sin(2x)/2", muster: "Vorzeichenfehler" },
  { art: "stamm", glieder: [["trig", 1, "cos", 2]], eingabe: "sin(2x)", muster: "Bis auf einen Faktor" },
  { art: "stamm", glieder: [["trig", 1, "cos", 2]], eingabe: "sin(2x) + x", muster: "Die Probe stimmt nicht" },
];

module.exports = { alsFunktion, liesTermAufgabe, termDeuter, pruefeTermleser };
