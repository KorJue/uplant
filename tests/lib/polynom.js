// Terme numerisch auswerten — für die Prüfung der Termseiten der Klasse 8 (mathematik/klasse-8/terme).
//
// Die Seiten vergleichen Terme exakt als Polynome (termwerk.js). Die Prüfung benutzt davon nichts:
// Sie übersetzt einen Termtext mit einem eigenen, absichtlich anders gebauten Leser in einen
// JavaScript-Ausdruck und rechnet an vielen Stellen nach. Zwei Terme gelten hier als gleichwertig,
// wenn sie an zwölf zufälligen Stellen (mit Nachkommastellen) übereinstimmen — ein gemeinsamer
// Denkfehler müsste also in zwei verschiedenen Verfahren zugleich stecken.
//
// Dazu kommen unabhängige Formprüfungen: Ist ein Term vereinfacht (eine Summe fertiger Glieder, keine
// zwei gleichartig), steht er in Produktform, ist er vollständig ausgeklammert?

"use strict";

const HOCH = { "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9" };

function normiere(text) {
  return String(text)
    .replace(/[−–]/g, "-").replace(/[·⋅×∙]/g, "*").replace(/:/g, "/").replace(/,/g, ".")
    .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g, (m) => "^" + [...m].map((c) => HOCH[c]).join(""))
    .replace(/\s+/g, "");
}

// Marken: Zahlen, einzelne Buchstaben, Rechenzeichen, Klammern.
function marken(s) {
  const out = [];
  const re = /\d+(?:\.\d+)?|[a-z]|[-+*/^()]/gy;
  let m;
  while ((m = re.exec(s))) out.push(m[0]);
  if (out.join("") !== s) throw new Error(`nicht lesbar: ${s}`);
  return out;
}
const istOperand = (t) => /^[\d.a-z]/.test(t);

// Übersetzt in einen JavaScript-Ausdruck: Malpunkte werden eingefügt, wo sie weggelassen sind, und
// jede Potenz wird ein Aufruf pw(Grund, Hochzahl) — sonst wäre -x**2 ein Syntaxfehler und -x^2 hieße
// in manchen Lesarten (−x)².
function alsAusdruck(text) {
  const t = marken(normiere(text));
  const mitMal = [];
  for (let i = 0; i < t.length; i++) {
    const a = t[i - 1], b = t[i];
    if (a !== undefined && (istOperand(a) || a === ")") && (istOperand(b) || b === "(")) mitMal.push("*");
    mitMal.push(b);
  }
  // Potenzen von hinten nach vorn zusammenfassen.
  const st = [];
  for (let i = 0; i < mitMal.length; i++) {
    if (mitMal[i] === "^") {
      const e = mitMal[++i];
      // Der Grund: das letzte Operandenstück oder die letzte vollständige Klammer.
      let grund = [];
      if (st[st.length - 1] === ")") {
        let tiefe = 0;
        do {
          const x = st.pop();
          if (x === ")") tiefe++;
          if (x === "(") tiefe--;
          grund.unshift(x);
        } while (tiefe > 0);
      } else grund = [st.pop()];
      st.push(`pw(${grund.join("")},${e})`);
    } else st.push(mitMal[i]);
  }
  return st.join("");
}

function alsFunktion(text, variablen) {
  const ausdruck = alsAusdruck(text);
  const fehlt = (ausdruck.match(/[a-z]+/g) || []).filter((n) => n !== "pw" && !variablen.includes(n));
  if (fehlt.length) throw new Error(`unbekannte Variable ${fehlt[0]} in ${text}`);
  // eslint-disable-next-line no-new-func
  const f = new Function("pw", ...variablen, `return (${ausdruck});`);
  return (belegung) => f(Math.pow, ...variablen.map((v) => belegung[v]));
}

// Zwölf Stellen mit Nachkommastellen: Bei ganzen Zahlen fiele 2x und x² bei x = 2 zusammen.
const STELLEN = Array.from({ length: 12 }, (_, i) => -3.1 + i * 0.57 + (i % 3) * 0.013);
function gleichwertig(a, b, variablen) {
  const fa = alsFunktion(a, variablen), fb = alsFunktion(b, variablen);
  return STELLEN.every((s, i) => {
    const bel = {};
    variablen.forEach((v, j) => { bel[v] = STELLEN[(i + 5 * j) % STELLEN.length] + j * 0.31; });
    const wa = fa(bel), wb = fb(bel);
    return Math.abs(wa - wb) <= 1e-7 * Math.max(1, Math.abs(wa), Math.abs(wb));
  });
}
function wert(text, belegung) {
  return alsFunktion(text, Object.keys(belegung))(belegung);
}

// ---------- Formprüfungen ----------

// Die Summanden auf oberster Ebene (Vorzeichen bleibt am Summanden).
function summanden(text) {
  const s = normiere(text);
  const out = [];
  let tiefe = 0, akt = "";
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === "(") tiefe++;
    if (c === ")") tiefe--;
    const binaer = i > 0 && !"+-*/^(".includes(s[i - 1]);
    if (tiefe === 0 && (c === "+" || c === "-") && binaer) {
      out.push(akt);
      akt = c === "-" ? "-" : "";
    } else akt += c;
  }
  out.push(akt);
  return out;
}
// Ein fertiges Glied: Vorzeichen, höchstens eine Zahl vorn, jede Variable höchstens einmal, Hochzahlen ≥ 2.
function gliedSchluessel(g) {
  const m = g.match(/^-?(\d+(?:\.\d+)?)?\*?((?:[a-z](?:\^\d+)?\*?)*)$/);
  if (!m || (!m[1] && !m[2])) return null;
  if (m[1] !== undefined && Number(m[1]) === 0) return null;
  const vars = {};
  for (const v of m[2].replace(/\*/g, "").matchAll(/([a-z])(?:\^(\d+))?/g)) {
    if (vars[v[1]]) return null;
    const e = v[2] ? Number(v[2]) : 1;
    if (e < 2 && v[2]) return null;
    vars[v[1]] = e;
  }
  return Object.keys(vars).sort().map((v) => v + vars[v]).join("");
}
// Vereinfacht: eine Summe fertiger Glieder ohne Klammern, keine zwei gleichartig.
function istVereinfacht(text) {
  const g = summanden(text);
  const s = g.map(gliedSchluessel);
  return s.every((x) => x !== null) && new Set(s).size === s.length;
}
// Produktform: auf oberster Ebene keine Summe, und mindestens eine Klammer.
function istProdukt(text) {
  return summanden(text).length === 1 && /\(/.test(normiere(text));
}

module.exports = { alsFunktion, gleichwertig, wert, istVereinfacht, istProdukt, summanden, normiere };
