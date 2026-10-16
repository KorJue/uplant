// Kleine Helfer für Kapitel 5: Zahlen ausgeben und einlesen, Brüche setzen.
//
// Wie in jeder Seite stehen sie hier noch einmal (siehe CLAUDE.md, § 5): Wer einen davon verbessert,
// sollte wissen, dass die Nachbarseiten davon nichts mitbekommen.

// Deutsche Schreibweise, gerundet VOR der Ausgabe — sonst erschiene −0,0001 als „−0“.
export function num(x, stellen = 2) {
  const f = 10 ** stellen;
  let r = Math.round(x * f) / f;
  if (r === 0) r = 0;
  return r.toLocaleString("de-DE", { maximumFractionDigits: stellen }).replace("-", "−");
}

// Wie num(), aber immer mit genau `stellen` Nachkommastellen (für Tabellen und Geldbeträge).
export function numFest(x, stellen = 2) {
  const f = 10 ** stellen;
  let r = Math.round(x * f) / f;
  if (r === 0) r = 0;
  return r.toLocaleString("de-DE", { minimumFractionDigits: stellen, maximumFractionDigits: stellen }).replace("-", "−");
}

// „=“ nur, wenn die Anzeige den Wert mit dieser Stellenzahl genau trifft, sonst „≈“.
export function zeichen(x, stellen = 2) {
  const f = 10 ** stellen;
  return Math.abs(Math.round(x * f) / f - x) < 1e-9 ? "=" : "≈";
}

export function bruch(z, n) {
  return `<span class="bruch"><span class="z">${z}</span><span class="n">${n}</span></span>`;
}

// Liest eine Eingabe als Zahl. Erlaubt sind Dezimalkomma und Dezimalpunkt, Tausenderpunkte
// („35.179“), Leerzeichen als Tausendertrenner, das typografische Minus, eine angehängte Einheit
// („96 km/h“, „41 %“) und ein einfacher Bruch („3/12“).
//
// Der gemeinsame parseFlexibleNumber() aus aufgaben.js reicht hier nicht: Er liest jeden Punkt als
// Tausenderpunkt, und aus „0.75“ würde 75 — bei Aufgaben, in denen viele ihren Taschenrechner
// abschreiben, wäre das ein Fehler, den die Rückmeldung der Schülerin anlastet.
export function leseZahl(roh) {
  if (roh == null) return NaN;
  let s = String(roh).trim().replace(/[−–]/g, "-").replace(/[  ]/g, " ");
  const br = s.match(/^([+-]?\d+(?:[.,]\d+)?)\s*\/\s*(\d+(?:[.,]\d+)?)$/);
  if (br) {
    const n = leseZahl(br[2]);
    return n === 0 ? NaN : leseZahl(br[1]) / n;
  }
  const m = s.match(/^[+-]?\d[\d .,]*/);
  if (!m) return NaN;
  s = m[0].trim().replace(/\s+/g, "");
  if ((s.match(/,/g) || []).length > 1) return NaN;
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  // „2.400“ ist ein Tausenderpunkt, „0.045“ und „2.5“ sind Dezimalpunkte.
  else if (/^[+-]?[1-9]\d{0,2}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
  if ((s.match(/\./g) || []).length > 1) return NaN;
  const z = Number(s);
  return Number.isFinite(z) ? z : NaN;
}

// Alle vernünftigen Lesarten einer Eingabe. Mehrdeutig ist nur ein einzelner Punkt vor genau drei
// Ziffern ohne Komma: „5.886“ kann 5886 (Tausenderpunkt) oder 5,886 (Dezimalpunkt vom
// Taschenrechner) heißen. Die Prüfung nimmt dann die Lesart, die zur Aufgabe passt.
export function leseZahlen(roh) {
  const z = leseZahl(roh);
  const s = String(roh == null ? "" : roh).trim().replace(/[−–]/g, "-").replace(/\s+/g, "");
  const m = s.match(/^[+-]?[1-9]\d{0,2}\.\d{3}(?![\d.,])/);
  if (m && !s.includes(",")) {
    const dezimal = Number(m[0]);
    if (Number.isFinite(dezimal) && dezimal !== z) return [z, dezimal];
  }
  return [z];
}
