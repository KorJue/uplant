// Exakte Bruchrechnung (BigInt-basiert) und 3D-Vektoralgebra.
// Bewusst ohne Fließkommazahlen für alle algebraischen Zwischenschritte, damit
// Ergebnisse wie "r = 7/3" exakt statt gerundet erscheinen (üblich bis zum Abitur).

function gcdBig(a, b) {
  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;
  while (b) [a, b] = [b, a % b];
  return a;
}

export class Fraction {
  constructor(n, d = 1n) {
    n = BigInt(n);
    d = BigInt(d);
    if (d === 0n) throw new Error("Division durch 0");
    if (d < 0n) {
      n = -n;
      d = -d;
    }
    const g = gcdBig(n, d) || 1n;
    this.n = n / g;
    this.d = d / g;
  }

  static from(x) {
    if (x instanceof Fraction) return x;
    if (typeof x === "bigint") return new Fraction(x, 1n);
    if (typeof x === "number") {
      if (!Number.isFinite(x)) throw new Error("ungültige Zahl");
      if (Number.isInteger(x)) return new Fraction(BigInt(x), 1n);
      const neg = x < 0;
      const s = Math.abs(x).toString();
      if (s.includes("e") || s.includes("E")) {
        const rounded = Math.round(Math.abs(x) * 1e9);
        return new Fraction(BigInt(neg ? -rounded : rounded), 1000000000n);
      }
      const [intPart, fracPart = ""] = s.split(".");
      const denom = 10n ** BigInt(fracPart.length);
      const numer = BigInt(intPart + fracPart || "0");
      return new Fraction(neg ? -numer : numer, denom);
    }
    if (typeof x === "string") {
      const trimmed = x.trim().replace(",", ".");
      const m = trimmed.match(/^(-?\d+)\s*\/\s*(-?\d+)$/);
      if (m) return new Fraction(BigInt(m[1]), BigInt(m[2]));
      if (trimmed === "" || Number.isNaN(Number(trimmed))) {
        throw new Error(`"${x}" ist keine gültige Zahl`);
      }
      return Fraction.from(Number(trimmed));
    }
    throw new Error("ungültiger Zahlentyp: " + x);
  }

  add(o) {
    o = Fraction.from(o);
    return new Fraction(this.n * o.d + o.n * this.d, this.d * o.d);
  }
  sub(o) {
    o = Fraction.from(o);
    return new Fraction(this.n * o.d - o.n * this.d, this.d * o.d);
  }
  mul(o) {
    o = Fraction.from(o);
    return new Fraction(this.n * o.n, this.d * o.d);
  }
  div(o) {
    o = Fraction.from(o);
    if (o.n === 0n) throw new Error("Division durch 0");
    return new Fraction(this.n * o.d, this.d * o.n);
  }
  neg() {
    return new Fraction(-this.n, this.d);
  }
  abs() {
    return this.n < 0n ? this.neg() : this;
  }
  isZero() {
    return this.n === 0n;
  }
  isNegative() {
    return this.n < 0n;
  }
  equals(o) {
    o = Fraction.from(o);
    return this.n * o.d === o.n * this.d;
  }
  cmp(o) {
    o = Fraction.from(o);
    const l = this.n * o.d,
      r = o.n * this.d;
    return l < r ? -1 : l > r ? 1 : 0;
  }
  toNumber() {
    return Number(this.n) / Number(this.d);
  }
  toString() {
    return this.d === 1n ? this.n.toString() : `${this.n}/${this.d}`;
  }
}

export const F = (x) => Fraction.from(x);
export const ZERO = F(0);
export const ONE = F(1);

export function vec3(a, b, c) {
  return [F(a), F(b), F(c)];
}
export function vAdd(u, v) {
  return [u[0].add(v[0]), u[1].add(v[1]), u[2].add(v[2])];
}
export function vSub(u, v) {
  return [u[0].sub(v[0]), u[1].sub(v[1]), u[2].sub(v[2])];
}
export function vScale(u, k) {
  k = F(k);
  return [u[0].mul(k), u[1].mul(k), u[2].mul(k)];
}
export function dot(u, v) {
  return u[0].mul(v[0]).add(u[1].mul(v[1])).add(u[2].mul(v[2]));
}
export function cross(u, v) {
  return [
    u[1].mul(v[2]).sub(u[2].mul(v[1])),
    u[2].mul(v[0]).sub(u[0].mul(v[2])),
    u[0].mul(v[1]).sub(u[1].mul(v[0])),
  ];
}
export function isZeroVec(v) {
  return v[0].isZero() && v[1].isZero() && v[2].isZero();
}
export function vEquals(u, v) {
  return u[0].equals(v[0]) && u[1].equals(v[1]) && u[2].equals(v[2]);
}
// Spatprodukt (Determinante aus drei Vektoren) — 0 genau dann, wenn u, v, w linear abhängig sind.
export function scalarTriple(u, v, w) {
  return dot(u, cross(v, w));
}
// Prüft, ob zwei Vektoren parallel (linear abhängig) sind. Der Nullvektor gilt als "parallel"
// zu jedem Vektor (Sonderfall wird von den Aufrufern gesondert behandelt).
export function isParallel(u, v) {
  return isZeroVec(cross(u, v));
}
export function squaredLength(v) {
  return dot(v, v);
}
// Exakte Länge als Fraction ist i. A. nicht möglich (Wurzel) — Rückgabe als Dezimalzahl.
export function length(v) {
  return Math.sqrt(squaredLength(v).toNumber());
}
