// Formatierung von Brüchen, Vektoren, Punkten, Geraden- und Ebenengleichungen als HTML,
// in der in deutschen Lehrplänen üblichen Schreibweise (Spaltenvektoren, Indizes x1/x2/x3 usw.).

export function fmt(f) {
  return f.toString().replace("-", "−");
}

export function sub(n) {
  return `<sub>${n}</sub>`;
}

export const X1 = `x${sub(1)}`;
export const X2 = `x${sub(2)}`;
export const X3 = `x${sub(3)}`;

export function vecArrow(letter) {
  return `<span class="vecarrow">${letter}</span>`;
}

// Spaltenvektor mit großen, mehrzeiligen Klammern (reines HTML/CSS, ohne externe Bibliothek).
export function vecColHTML(parts) {
  const rows = ["⎛", "⎜", "⎝"];
  const rowsR = ["⎞", "⎟", "⎠"];
  const cells = parts
    .map(
      (p, i) =>
        `<span class="vec3-row"><span class="vec3-b">${rows[i]}</span><span class="vec3-num">${p}</span><span class="vec3-b">${rowsR[i]}</span></span>`
    )
    .join("");
  return `<span class="vec3">${cells}</span>`;
}

export function vecColFromFractions(v) {
  return vecColHTML(v.map(fmt));
}

export function pointHTML(label, coords) {
  return `${label}(${fmt(coords[0])}|${fmt(coords[1])}|${fmt(coords[2])})`;
}

export function pointTemplateHTML(label) {
  return `${label}(${X1}|${X2}|${X3})`;
}

// Summe aus vorzeichenbehafteten Termen "coeff*varHtml", Nullterme werden weggelassen.
export function fmtLinearCombo(terms) {
  const parts = [];
  for (const { coeff, varHtml } of terms) {
    if (coeff.isZero()) continue;
    const isFirst = parts.length === 0;
    const showNumeral = !(varHtml && coeff.abs().equals(1));
    const absStr = showNumeral ? fmt(coeff.abs()) : "";
    const sign = coeff.isNegative() ? "−" : "+";
    const prefix = isFirst ? (coeff.isNegative() ? "−" : "") : ` ${sign} `;
    parts.push(prefix + absStr + (varHtml || ""));
  }
  return parts.length ? parts.join("") : "0";
}

export function lineHTML(label, s, u, param = "r") {
  return `${label}: ${vecArrow("x")} = ${vecColFromFractions(s)} + ${param}·${vecColFromFractions(u)}`;
}

export function lineTemplateHTML(label, param = "r") {
  return `${label}: ${vecArrow("x")} = ${vecColHTML(["s1", "s2", "s3"])} + ${param}·${vecColHTML(["u1", "u2", "u3"])}`;
}

export function planeParamHTML(label, s, u, v, p1 = "r", p2 = "t") {
  return `${label}: ${vecArrow("x")} = ${vecColFromFractions(s)} + ${p1}·${vecColFromFractions(u)} + ${p2}·${vecColFromFractions(v)}`;
}

export function planeCoordHTML(label, a, b, c, d) {
  const lhs = fmtLinearCombo([
    { coeff: a, varHtml: X1 },
    { coeff: b, varHtml: X2 },
    { coeff: c, varHtml: X3 },
  ]);
  return `${label}: ${lhs} = ${fmt(d)}`;
}

export function planeNormalHTML(label, s, n) {
  return `${label}: (${vecArrow("x")} − ${vecColFromFractions(s)}) · ${vecColFromFractions(n)} = 0`;
}

export function fmtApprox(numberValue, digits = 3) {
  const r = Math.round(numberValue * 10 ** digits) / 10 ** digits;
  return r.toString().replace("-", "−").replace(".", ",");
}
