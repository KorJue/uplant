// Die acht Übungsaufgaben zu „Terme aufstellen und Termwerte berechnen“ — zwei je Stufe.
//
// Wo ein Term die Antwort ist, wird er mit termwerk.js exakt verglichen: Jede gleichwertige
// Schreibweise gilt (2(x − 3) ebenso wie 2x − 6) — gefragt ist das Aufstellen, nicht eine bestimmte
// Form. Umformen kommt erst in Thema 2.
//
// Alle Zahlen kommen aus vorher gefilterten Listen, nie durch Verwerfen und Neuziehen.

"use strict";

import * as T from "./termwerk.js?v=1";
import { num, eingesetzt, pick, trifft, ohneKollision, spaeter } from "./seite.js?v=1";

const ZAHLWORT = { 2: "Doppelte", 3: "Dreifache", 4: "Vierfache", 5: "Fünffache", 6: "Sechsfache" };

// ---------- Streichholzmuster als Zeichnung ----------
//
// Ein Muster ist eine Funktion n → Liste von Hölzchen (in Hölzchenlängen). Gezeichnet werden drei
// aufeinanderfolgende Figuren nebeneinander (ab Figur 1 oder ab Figur 2); jedes Hölzchen trägt
// data-rolle="holz" und die Nummer seiner Figur, damit die Prüfung zählen kann.
const MUSTER = {
  quadrate: {
    name: "eine Reihe aus Quadraten",
    term: "3n + 1",
    falsch: [["4n", "Gezählt hast du vier Hölzchen je Quadrat. Zwei Nachbarquadrate teilen sich aber eine Seite — sie zählt nur einmal."]],
    hoelzer: (n) => {
      const h = [];
      for (let i = 0; i <= n; i++) h.push([i, 0, i, 1]);
      for (let i = 0; i < n; i++) h.push([i, 0, i + 1, 0], [i, 1, i + 1, 1]);
      return h;
    },
    hoehe: 1,
  },
  dreiecke: {
    name: "eine Reihe aus Dreiecken, abwechselnd mit der Spitze nach oben und nach unten",
    term: "2n + 1",
    falsch: [["3n", "Gezählt hast du drei Hölzchen je Dreieck. Zwei Nachbardreiecke teilen sich aber eine schräge Seite — sie zählt nur einmal."]],
    hoelzer: (n) => {
      // Dreieck i: Spitze oben bei geradem i, unten bei ungeradem. Die Ecken liegen abwechselnd unten
      // und oben, jede schräge Seite gehört zwei Dreiecken.
      const h = [];
      const s = Math.sqrt(3) / 2;
      const ecke = (j) => (j % 2 === 0 ? [j / 2, 0] : [j / 2, s]);
      for (let j = 0; j <= n; j++) {
        const [x1, y1] = ecke(j), [x2, y2] = ecke(j + 1);
        if (j < n + 1 && j + 1 <= n + 1) h.push([x1, y1, x2, y2]);
      }
      // Die waagerechten Seiten: unten zwischen geraden Ecken, oben zwischen ungeraden.
      for (let j = 0; j + 2 <= n + 1; j++) {
        const [x1, y1] = ecke(j), [x2, y2] = ecke(j + 2);
        h.push([x1, y1, x2, y2]);
      }
      return h;
    },
    hoehe: Math.sqrt(3) / 2,
  },
  haeuser: {
    name: "eine Reihe aus Häusern — jedes ein Quadrat mit einem Dreiecksdach, Nachbarn teilen sich eine Wand",
    term: "5n + 1",
    falsch: [["6n", "Gezählt hast du sechs Hölzchen je Haus. Zwei Nachbarhäuser teilen sich aber eine Wand — sie zählt nur einmal."]],
    hoelzer: (n) => {
      const h = [];
      const s = Math.sqrt(3) / 2;
      for (let i = 0; i <= n; i++) h.push([i, 0, i, 1]);
      for (let i = 0; i < n; i++) h.push([i, 0, i + 1, 0], [i, 1, i + 1, 1], [i, 1, i + 0.5, 1 + s], [i + 0.5, 1 + s, i + 1, 1]);
      return h;
    },
    hoehe: 1 + Math.sqrt(3) / 2,
  },
  fuenfecke: {
    name: "eine Reihe aus Fünfecken — wie Häuser ohne Decke, Nachbarn teilen sich eine Wand",
    term: "4n + 1",
    falsch: [["5n", "Gezählt hast du fünf Hölzchen je Fünfeck. Zwei Nachbarn teilen sich aber eine Wand — sie zählt nur einmal."]],
    hoelzer: (n) => {
      const h = [];
      const s = Math.sqrt(3) / 2;
      for (let i = 0; i <= n; i++) h.push([i, 0, i, 1]);
      for (let i = 0; i < n; i++) h.push([i, 0, i + 1, 0], [i, 1, i + 0.5, 1 + s], [i + 0.5, 1 + s, i + 1, 1]);
      return h;
    },
    hoehe: 1 + Math.sqrt(3) / 2,
  },
  doppelreihe: {
    name: "zwei Reihen aus Quadraten übereinander",
    term: "5n + 2",
    falsch: [["8n", "Gezählt hast du vier Hölzchen je Quadrat. Benachbarte Quadrate teilen sich aber Seiten — nach rechts und nach oben."], ["7n", "Gezählt hast du sieben Hölzchen je Spalte aus zwei Quadraten. Nachbarspalten teilen sich aber die senkrechten Hölzchen — sie zählen nur einmal."], ["6n + 1", "Das wäre eine Reihe mit drei Hölzchen je Quadrat und einem Rest. Zähl die waagerechten (3 Reihen zu je n) und die senkrechten (2 Reihen zu je n + 1) getrennt."]],
    hoelzer: (n) => {
      const h = [];
      for (let i = 0; i <= n; i++) h.push([i, 0, i, 1], [i, 1, i, 2]);
      for (let i = 0; i < n; i++) h.push([i, 0, i + 1, 0], [i, 1, i + 1, 1], [i, 2, i + 1, 2]);
      return h;
    },
    hoehe: 2,
  },
};

function musterBild(m, start = 1) {
  const s = 26, abstand = 34, rand = 14;
  let x0 = rand;
  const figuren = [];
  let breite = rand;
  const nummern = [start, start + 1, start + 2];
  for (const n of nummern) {
    const hs = m.hoelzer(n);
    const b = Math.max(...hs.flatMap((h) => [h[0], h[2]])) * s;
    figuren.push({ n, hs, x0 });
    x0 += b + abstand;
    breite = x0 - abstand + rand;
  }
  const H = Math.round(m.hoehe * s + 2 * rand + 18);
  let out = `<svg viewBox="0 0 ${breite.toFixed(0)} ${H}" width="${breite.toFixed(0)}" height="${H}" class="tm-aufgaben-figur" data-figur="muster" role="img" aria-label="Die Figuren ${nummern.join(", ").replace(/, (\d+)$/, " und $1")} des Musters">`;
  for (const f of figuren) {
    for (const [x1, y1, x2, y2] of f.hs) {
      out += `<line x1="${(f.x0 + x1 * s).toFixed(1)}" y1="${(rand + (m.hoehe - y1) * s).toFixed(1)}" x2="${(f.x0 + x2 * s).toFixed(1)}" y2="${(rand + (m.hoehe - y2) * s).toFixed(1)}" class="tm-holz tm-holz-c" data-rolle="holz" data-figur="${f.n}"/>`;
    }
    const mitte = f.x0 + (Math.max(...f.hs.flatMap((h) => [h[0], h[2]])) * s) / 2;
    out += `<text x="${mitte.toFixed(1)}" y="${H - 4}" text-anchor="middle" class="tm-figur-name">Figur ${f.n}</text>`;
  }
  return out + "</svg>";
}

// ================= einfach =================

// ---------- A1: Termwert mit negativer Zahl ----------
const A1_KANDIDATEN = spaeter(() => {
  const liste = [];
  for (const a of [1, 2, 3, -1, -2]) {
    for (const b of [-5, -4, -3, -2, 2, 3, 4, 5]) {
      for (const c of [-6, -3, -1, 0, 1, 4, 7]) {
        for (const v of [-4, -3, -2, -1, 2, 3]) liste.push({ a, b, c, v });
      }
    }
  }
  return liste;
});
function a1Werte({ a, b, c, v }) {
  const richtig = a * v * v + b * v + c;
  return {
    richtig,
    falsch: [
      // Nur bei negativem x ist „das Minus mitquadriert vergessen“ ein eigener Fehler.
      [v < 0 ? a * -(v * v) + b * v + c : NaN, "Quadrat"],
      [a * v * v - b * v + c, "Vorzeichen"],
      [(a * v) * (a * v) + b * v + c, "erst"],
    ],
  };
}
function generateA1() {
  const k = ohneKollision(A1_KANDIDATEN(), (x) => { const w = a1Werte(x); return [w.richtig, ...w.falsch.map((f) => f[0])]; });
  const { a, b, c, v } = k;
  const { richtig, falsch } = a1Werte(k);
  const term = T.text(T.plus(T.variable("x", 2, a), T.variable("x", 1, b), T.zahl(c)));
  const hinweise = {
    Quadrat: `Das Quadrat einer negativen Zahl ist positiv: ${eingesetzt(v)}² = ${num(v * v)}. Wer ${v < 0 ? `−${num(-v)}²` : `−${num(v)}²`} rechnet, quadriert nur die Ziffer.`,
    Vorzeichen: `Beim Glied mit x stimmt das Vorzeichen nicht: ${num(b)} · ${eingesetzt(v)} = ${num(b * v)}.`,
    erst: `Erst quadrieren, dann mit ${num(a)} multiplizieren: ${num(a)} · ${eingesetzt(v)}² = ${num(a)} · ${num(v * v)}. Du hast ${num(a)} · ${eingesetzt(v)} quadriert.`,
  };
  // Eingesetzt wird Glied für Glied — eine Ersetzung im fertigen Text verlöre den Malpunkt.
  const e = eingesetzt(v);
  const vz = (z) => (z < 0 ? "−" : "+");
  const aTeil = a === 1 ? `${e}²` : a === -1 ? `−${e}²` : `${num(a)} · ${e}²`;
  const einsetzen = `${aTeil} ${vz(b)} ${num(Math.abs(b))} · ${e}` + (c ? ` ${vz(c)} ${num(Math.abs(c))}` : "");
  const rest = `${num(a * v * v)} ${vz(b * v)} ${num(Math.abs(b * v))}` + (c ? ` ${vz(c)} ${num(Math.abs(c))}` : "");
  return {
    promptHtml: `Berechne den Termwert von <strong>${term}</strong> für <strong>x = ${num(v)}</strong>.`,
    correct: richtig,
    tolerance: 1e-9,
    placeholder: "Termwert",
    hinweis: (roh, val) => {
      for (const [w, s] of falsch) if (trifft(val, w)) return hinweise[s];
      return `Setz ${num(v)} in Klammern für jedes x ein und rechne: Potenz vor Punkt vor Strich.`;
    },
    tipps: [
      `Setz für jedes x die Zahl ${eingesetzt(v)} ein — mit Klammern.`,
      `Zuerst das Quadrat: ${eingesetzt(v)}² = ${num(v * v)}.`,
      `Zusammen: ${rest}`,
    ],
    musterloesungHtml:
      `<strong>1. Einsetzen:</strong> ${einsetzen}<br>` +
      `<strong>2. Potenz:</strong> ${eingesetzt(v)}² = ${num(v * v)}, also ${num(a)} · ${num(v * v)} = ${num(a * v * v)}<br>` +
      `<strong>3. Produkt:</strong> ${num(b)} · ${eingesetzt(v)} = ${num(b * v)}<br>` +
      `<strong>4. Zusammenrechnen:</strong> ${rest} = <strong>${num(richtig)}</strong>`,
  };
}

// ---------- A2: Worte → Term ----------
const A2_SAETZE = [
  { satz: (a, b) => `das ${ZAHLWORT[a]} einer Zahl, vermindert um ${b}`, soll: (a, b) => `${a}x - ${b}`, falsch: (a, b) => [[`${a}(x - ${b})`, "Hier wird erst verdoppelt bzw. vervielfacht und dann vermindert — ohne Klammer, denn Punkt geht vor Strich."]], muster: (a, b) => `${a} · x − ${b}` },
  { satz: (a, b) => `das ${ZAHLWORT[a]} der um ${b} verminderten Zahl`, soll: (a, b) => `${a}(x - ${b})`, falsch: (a, b) => [[`${a}x - ${b}`, `Erst wird die Zahl um ${b} vermindert, dann vervielfacht. Dafür braucht die Differenz eine Klammer: ${a} · (x − ${b}).`]], muster: (a, b) => `${a} · (x − ${b})` },
  { satz: (a, b) => `die Summe aus dem ${ZAHLWORT[a]}n einer Zahl und ${b}`, soll: (a, b) => `${a}x + ${b}`, falsch: (a, b) => [[`${a}(x + ${b})`, "Summiert wird das Vielfache der Zahl und die zweite Zahl — die Summe ist der letzte Schritt. Eine Klammer würde die Zahl mit vervielfachen."]], muster: (a, b) => `${a} · x + ${b}` },
  { satz: (a, b) => `das ${ZAHLWORT[a]} der Summe aus einer Zahl und ${b}`, soll: (a, b) => `${a}(x + ${b})`, falsch: (a, b) => [[`${a}x + ${b}`, `Vervielfacht wird die ganze Summe — sie gehört in Klammern: ${a} · (x + ${b}).`]], muster: (a, b) => `${a} · (x + ${b})` },
  { satz: (a, b) => `das Quadrat der um ${b} vermehrten Zahl`, soll: (a, b) => `(x + ${b})^2`, falsch: (a, b) => [[`x^2 + ${b}`, `Quadriert wird die ganze Summe x + ${b} — sie gehört in Klammern: (x + ${b})².`], [`x + ${b}^2`, `Quadriert wird die Summe, nicht nur die ${b}: (x + ${b})².`]], muster: (a, b) => `(x + ${b})²` },
  { satz: (a, b) => `die um ${b} vermehrte Quadratzahl einer Zahl`, soll: (a, b) => `x^2 + ${b}`, falsch: (a, b) => [[`(x + ${b})^2`, `Erst wird die Zahl quadriert, dann ${b} addiert. Eine Klammer würde die ${b} mit quadrieren.`]], muster: (a, b) => `x² + ${b}` },
  { satz: (a, b) => `die Differenz aus ${b} und dem ${ZAHLWORT[a]}n einer Zahl`, soll: (a, b) => `${b} - ${a}x`, falsch: (a, b) => [[`${a}x - ${b}`, `Bei „die Differenz aus A und B“ steht A vorn: ${b} − ${a} · x.`]], muster: (a, b) => `${b} − ${a} · x` },
];
const A2_KANDIDATEN = spaeter(() => {
  const liste = [];
  A2_SAETZE.forEach((s, i) => {
    for (const a of [2, 3, 4, 5]) for (const b of [2, 3, 4, 5, 6, 7]) if (a !== b) liste.push({ i, a, b });
  });
  return liste;
});
function generateA2() {
  const { i, a, b } = pick(A2_KANDIDATEN());
  const s = A2_SAETZE[i];
  const soll = T.P(s.soll(a, b), ["x"]);
  return T.termAufgabe({
    promptHtml: `Übersetze in einen Term mit der Variablen x: <strong>„${s.satz(a, b)}“</strong>.`,
    soll,
    variablen: ["x"],
    form: "beliebig",
    falsch: s.falsch(a, b).map(([t, h]) => [T.P(t, ["x"]), h]),
    tipps: [
      "Welcher Rechenschritt kommt zuletzt? Er bestimmt, wie der Term heißt — und was in Klammern muss.",
      "Zeichne den Rechenbaum: unten x und die Zahlen, oben der letzte Schritt.",
    ],
    musterloesungHtml: `Der letzte Schritt ist ${/Quadrat der/.test(s.satz(a, b)) ? "das Quadrieren" : /der Summe|der um/.test(s.satz(a, b)) ? "das Vervielfachen" : /Differenz aus|vermindert um/.test(s.satz(a, b)) ? "die Subtraktion" : "die Addition"}.<br>Term: <strong>${s.muster(a, b)}</strong>`,
    platzhalter: "Term mit x",
  });
}

// ================= mittel =================

// ---------- A3: Term zu einem Streichholzmuster ----------
// Gezeigt werden die Figuren 1–3 oder 2–4: Ab Figur 2 muss man auf Figur 1 zurückrechnen, statt den
// Rest an der ersten Figur abzulesen.
const A3_KANDIDATEN = spaeter(() => Object.keys(MUSTER).flatMap((art) => [1, 2].map((start) => ({ art, start }))));
function generateA3() {
  const { art, start } = pick(A3_KANDIDATEN());
  const m = MUSTER[art];
  const soll = T.P(m.term, ["n"]);
  const nummern = [start, start + 1, start + 2];
  const anzahlen = nummern.map((n) => m.hoelzer(n).length);
  const zuwachs = anzahlen[1] - anzahlen[0];
  const eins = m.hoelzer(1).length;
  const gezeigt = `Figur ${nummern[0]} hat ${anzahlen[0]}, Figur ${nummern[1]} hat ${anzahlen[1]}, Figur ${nummern[2]} hat ${anzahlen[2]} Hölzchen`;
  return T.termAufgabe({
    promptHtml: `Hier siehst du die Figuren ${nummern[0]}, ${nummern[1]} und ${nummern[2]} eines Musters: ${m.name}. <strong>Stelle einen Term auf, der angibt, wie viele Hölzchen Figur n hat.</strong>` + musterBild(m, start),
    soll,
    variablen: ["n"],
    form: "beliebig",
    falsch: m.falsch.map(([t, h]) => [T.P(t, ["n"]), h]),
    tipps: [
      `Zähl nach: ${gezeigt}.`,
      `Von Figur zu Figur kommen ${zuwachs} Hölzchen dazu — das ist der Faktor vor n.`,
      start === 1
        ? "Was bleibt übrig, wenn man von Figur 1 diesen Zuwachs einmal abzieht? Das ist die Zahl, die dazukommt."
        : `Rechne zurück: Figur 1 hätte ${anzahlen[0]} − ${zuwachs} = ${eins} Hölzchen. Was bleibt übrig, wenn man davon den Zuwachs noch einmal abzieht?`,
    ],
    musterloesungHtml:
      `${gezeigt}: Mit jeder Figur kommen ${zuwachs} dazu.<br>` +
      (start === 1 ? "" : `Figur 1 hätte also ${anzahlen[0]} − ${zuwachs} = ${eins} Hölzchen.<br>`) +
      `Term: <strong>${m.term.replace("n", " · n")}</strong> — gleichwertig sind zum Beispiel auch ${eins} + ${zuwachs} · (n − 1).<br>` +
      `<em>Probe:</em> Für n = ${nummern[2]} ergibt der Term ${anzahlen[2]} ✓`,
    platzhalter: "Term mit n",
  });
}

// ---------- A4: Wertetabelle ----------
const A4_TERME = [
  { soll: (p, q) => `x^2 - ${p}x + ${q}`, f: (x, p, q) => x * x - p * x + q, falsch: (x, p, q) => [[-(x * x) - p * x + q, "Quadrat"], [x * x + p * x + q, "Vorzeichen"]] },
  { soll: (p, q) => `${p}(x - ${q})`, f: (x, p, q) => p * (x - q), falsch: (x, p, q) => [[p * x - q, "Klammer"], [p * (x + q), "Vorzeichen"]] },
  { soll: (p, q) => `-x^2 + ${p}x + ${q}`, f: (x, p, q) => -x * x + p * x + q, falsch: (x, p, q) => [[x * x + p * x + q, "minusQuadrat"], [-x * x - p * x + q, "Vorzeichen"]] },
];
const A4_KANDIDATEN = spaeter(() => {
  const liste = [];
  A4_TERME.forEach((t, i) => {
    for (const p of [2, 3, 4]) for (const q of [1, 2, 3, 5]) {
      for (const xs of [[-3, 0, 2], [-2, 1, 3], [-1, 0, 4], [-4, -1, 2], [-3, 1, 0.5], [-2, 2, 1.5]]) liste.push({ i, p, q, xs });
    }
  });
  return liste;
});
function generateA4() {
  const { i, p, q, xs } = pick(A4_KANDIDATEN());
  const tt = A4_TERME[i];
  const term = T.text(T.P(tt.soll(p, q), ["x"]));
  const termAnzeige = i === 1 ? `${p} · (x − ${q})` : term;
  const TEXT = {
    Quadrat: (x) => `Für x = ${num(x)} ist x² = ${eingesetzt(x)}² = ${num(x * x)} — das Quadrat einer negativen Zahl ist positiv.`,
    minusQuadrat: (x) => `−x² heißt −(x²): Für x = ${num(x)} ist das −${num(x * x)}, nicht +${num(x * x)}.`,
    Vorzeichen: (x) => `Das Vorzeichen beim Glied mit x stimmt nicht — rechne ${eingesetzt(x)} mit Klammer ein.`,
    Klammer: () => `Die Klammer wird zuerst ausgerechnet, dann mit ${p} multipliziert.`,
  };
  return {
    promptHtml: `Fülle die Wertetabelle für den Term <strong>${termAnzeige}</strong> aus.<br><span class="tm-mini-tabelle">x = ${xs.map(num).join(" &nbsp;|&nbsp; x = ")}</span>`,
    felder: xs.map((x) => ({
      name: `Termwert für x = ${num(x)}`, soll: tt.f(x, p, q), toleranz: 1e-6, platzhalter: "Wert",
      hinweis: (roh, val) => {
        for (const [w, s] of tt.falsch(x, p, q)) if (trifft(val, w) && !trifft(w, tt.f(x, p, q))) return TEXT[s](x);
        return `Setz ${eingesetzt(x)} für x ein und rechne Schritt für Schritt.`;
      },
    })),
    tipps: [
      "Setz jede Zahl für x ein — negative Zahlen in Klammern.",
      "Reihenfolge: Klammer, dann Potenz, dann Punkt vor Strich.",
    ],
    musterloesungHtml: xs.map((x) => {
      const eins = i === 1 ? `${p} · (${num(x)} − ${q})` : i === 0 ? `${eingesetzt(x)}² − ${p} · ${eingesetzt(x)} + ${q}` : `−${eingesetzt(x)}² + ${p} · ${eingesetzt(x)} + ${q}`;
      return `x = ${num(x)}: ${eins} = <strong>${num(tt.f(x, p, q))}</strong>`;
    }).join("<br>"),
  };
}

// ================= schwierig =================

// ---------- A5: Sachsituation — Term aufstellen und auswerten ----------
const A5_SACHEN = [
  { text: (g, p) => `Ein Fahrradverleih verlangt <strong>${num(g)} € Grundgebühr</strong> und <strong>${num(p)} € je Stunde</strong>.`, var: "t", was: "den Preis in € für t Stunden", frage: (s) => `Was kostet eine Fahrt von ${num(s)} Stunden?`, einheit: "€" },
  { text: (g, p) => `Ein Taxi kostet <strong>${num(g)} € beim Einsteigen</strong> und <strong>${num(p)} € je gefahrenen Kilometer</strong>.`, var: "k", was: "den Fahrpreis in € für k Kilometer", frage: (s) => `Was kostet eine Fahrt über ${num(s)} km?`, einheit: "€" },
  { text: (g, p) => `Eine Kerze ist <strong>${num(g)} cm</strong> hoch und brennt in jeder Stunde <strong>${num(p)} cm</strong> herunter.`, var: "t", was: "die Höhe der Kerze in cm nach t Stunden", frage: (s) => `Wie hoch ist die Kerze nach ${num(s)} Stunden?`, einheit: "cm", ab: true },
];
const A5_KANDIDATEN = spaeter(() => {
  const liste = [];
  A5_SACHEN.forEach((sa, i) => {
    const gs = sa.ab ? [20, 24, 30, 36] : [2, 3, 4, 5, 8];
    const ps = sa.ab ? [1.5, 2, 2.5, 3] : [1.5, 2, 2.5, 3, 4];
    for (const g of gs) for (const p of ps) for (const s of [3, 4, 5, 6, 7]) {
      if (sa.ab && g - p * s <= 0) continue;
      liste.push({ i, g, p, s });
    }
  });
  return liste;
});
function generateA5() {
  const k = ohneKollision(A5_KANDIDATEN(), ({ i, g, p, s }) => {
    const sa = A5_SACHEN[i];
    const w = sa.ab ? g - p * s : g + p * s;
    return [w, sa.ab ? g + p * s : g * s + p, (g + p) * s];
  });
  const { i, g, p, s } = k;
  const sa = A5_SACHEN[i];
  const v = sa.var;
  const soll = T.P(sa.ab ? `${g} - ${p}${v}` : `${g} + ${p}${v}`, [v]);
  const wert = sa.ab ? g - p * s : g + p * s;
  const termText = sa.ab ? `${num(g)} − ${num(p)} · ${v}` : `${num(g)} + ${num(p)} · ${v}`;
  return {
    promptHtml: sa.text(g, p) + ` <strong>Stelle einen Term für ${sa.was} auf.</strong> ${sa.frage(s)}` + T.EINGABE_HINWEIS,
    felder: [
      T.termFeld({
        name: `Term mit ${v}`, soll, variablen: [v], form: "beliebig", platzhalter: "Term",
        falsch: sa.ab
          ? [[T.P(`${g} + ${p}${v}`, [v]), "Die Kerze wird kürzer — die abgebrannte Länge wird abgezogen, nicht addiert."], [T.P(`${p}${v} - ${g}`, [v]), `Abgezogen wird die abgebrannte Länge von der Anfangshöhe: ${num(g)} − …`]]
          : [[T.P(`${p} + ${g}${v}`, [v]), "Vertauscht: Die Grundgebühr fällt einmal an, der Preis je Einheit wird mit der Anzahl multipliziert."], [T.P(`${g + p}${v}`, [v]), "Die Grundgebühr fällt nur einmal an — sie wird nicht mit der Anzahl multipliziert."]],
      }),
      {
        name: sa.frage(s).replace(/^(Was kostet|Wie hoch ist)/, (m) => m), soll: wert, einheit: sa.einheit, toleranz: 0.005, platzhalter: "Zahl",
        hinweis: (roh, val) => {
          if (sa.ab && trifft(val, g + p * s, 0.005)) return "Die Kerze wird kürzer: abziehen, nicht addieren.";
          if (!sa.ab && trifft(val, g * s + p, 0.005)) return "Vertauscht: Die Grundgebühr gibt es einmal, der Preis je Einheit wird mit der Anzahl multipliziert.";
          if (trifft(val, (g + p) * s, 0.005)) return "Die Grundgebühr bzw. Anfangshöhe zählt nur einmal.";
          return `Setz ${num(s)} für ${v} in deinen Term ein.`;
        },
      },
    ],
    tipps: [
      "Was fällt einmal an, was wächst mit jeder Einheit? Das Einmalige ist eine Zahl, das Wachsende ein Vielfaches der Variablen.",
      `Setz danach ${num(s)} für ${v} ein.`,
    ],
    musterloesungHtml:
      `<strong>Term:</strong> ${termText}<br>` +
      `<strong>Für ${v} = ${num(s)}:</strong> ${termText.replace(` · ${v}`, ` · ${num(s)}`)} = <strong>${num(wert)} ${sa.einheit}</strong>`,
  };
}

// ---------- A6: Gegenbeispiel finden ----------
// Paare, die nicht gleichwertig sind, aber an einer oder zwei Stellen übereinstimmen — wer nur dort
// nachsieht, hält sie für gleichwertig.
const A6_FAMILIEN = [
  { a: (k) => "x²", b: (k) => `${k}x`, fa: (x) => x * x, fb: (x, k) => k * x, gleich: (k) => [0, k] },
  { a: (k) => `x² + ${k}`, b: (k) => `${k + 1}x`, fa: (x, k) => x * x + k, fb: (x, k) => (k + 1) * x, gleich: (k) => [1, k] },
  { a: (k) => `(x + ${k})²`, b: (k) => `x² + ${k * k}`, fa: (x, k) => (x + k) * (x + k), fb: (x, k) => x * x + k * k, gleich: () => [0] },
  { a: (k) => `${k}(x + 1)`, b: (k) => `${k}x + 1`, fa: (x, k) => k * (x + 1), fb: (x, k) => k * x + 1, gleich: () => [] },
];
const A6_KANDIDATEN = spaeter(() => {
  const liste = [];
  A6_FAMILIEN.forEach((f, i) => { for (const k of [2, 3, 4, 5]) liste.push({ i, k }); });
  return liste;
});
function generateA6() {
  const { i, k } = pick(A6_KANDIDATEN());
  const f = A6_FAMILIEN[i];
  const gleichBei = f.gleich(k);
  const gegen = [1, 2, 3, -1, 4, 5, 6].find((x) => f.fa(x, k) !== f.fb(x, k));
  return {
    promptHtml:
      `Sind die Terme <strong>${f.a(k)}</strong> und <strong>${f.b(k)}</strong> gleichwertig? Sie sind es nicht. ` +
      `<strong>Gib eine Zahl für x an, bei der die beiden Terme verschiedene Werte haben</strong> — ein Gegenbeispiel.`,
    check: (roh) => {
      const x = Number(String(roh).trim().replace(/−/g, "-").replace(",", "."));
      if (!/^-?\d+([.,]\d+)?$/.test(String(roh).trim().replace(/−/g, "-"))) return false;
      return Math.abs(f.fa(x, k) - f.fb(x, k)) > 1e-9;
    },
    placeholder: "x =",
    hinweis: (roh) => {
      const x = Number(String(roh).trim().replace(/−/g, "-").replace(",", "."));
      if (!Number.isFinite(x)) return "Gib eine einzelne Zahl ein.";
      return `Bei x = ${num(x)} haben beide Terme den Wert ${num(f.fa(x, k))} — das ist kein Gegenbeispiel. Such weiter: Bei den meisten Zahlen klappt es.`;
    },
    tipps: [
      "Setz eine Zahl in beide Terme ein und vergleiche die Werte.",
      gleichBei.length ? `Vorsicht bei x = ${gleichBei.map(num).join(" und x = ")}: Dort stimmen die Terme zufällig überein.` : "Hier klappt schon fast jede Zahl.",
    ],
    musterloesungHtml:
      `Zum Beispiel x = ${num(gegen)}: ${f.a(k)} ergibt ${num(f.fa(gegen, k))}, ${f.b(k)} aber ${num(f.fb(gegen, k))}.<br>` +
      (gleichBei.length ? `Nur für x = ${gleichBei.map(num).join(" und x = ")} stimmen die Werte überein — kein Grund für Gleichwertigkeit.` : "Die Terme stimmen für keine Zahl überein."),
  };
}

// ================= komplex =================

// ---------- A7: Muster vorwärts und rückwärts ----------
const A7_MUSTER = [
  { art: "quadrate", a: 3, b: 1 },
  { art: "dreiecke", a: 2, b: 1 },
  { art: "haeuser", a: 5, b: 1 },
  { art: "doppelreihe", a: 5, b: 2 },
];
const A7_KANDIDATEN = spaeter(() => {
  const liste = [];
  A7_MUSTER.forEach((m, i) => {
    for (const N of [20, 25, 30, 40, 50]) for (const K of [33, 41, 47, 52, 66]) if (N !== K) liste.push({ i, N, K });
  });
  return liste;
});
function generateA7() {
  const k = ohneKollision(A7_KANDIDATEN(), ({ i, N }) => { const m = A7_MUSTER[i]; return [m.a * N + m.b, (m.a + m.b) * N, m.a * N]; });
  const { i, N, K } = k;
  const mm = A7_MUSTER[i];
  const m = MUSTER[mm.art];
  const M = mm.a * K + mm.b;
  return {
    promptHtml:
      `Hier siehst du ${m.name}.` + musterBild(m) +
      `<strong>Wie viele Hölzchen hat Figur ${N}?</strong> Und <strong>welche Figur besteht aus genau ${M} Hölzchen?</strong>`,
    felder: [
      {
        name: `Hölzchen in Figur ${N}`, soll: mm.a * N + mm.b, toleranz: 1e-9, platzhalter: "Anzahl",
        hinweis: (roh, val) => {
          if (trifft(val, (mm.a + mm.b) * N)) return "Gezählt hast du jedes Teil vollständig. Nachbarn teilen sich aber Hölzchen — die zählen nur einmal.";
          if (trifft(val, mm.a * N)) return `Fast — die ${mm.b} Hölzchen, die am Anfang zusätzlich nötig sind, fehlen.`;
          return "Stelle zuerst einen Term für Figur n auf und setz dann die Nummer ein.";
        },
      },
      {
        name: `Nummer der Figur mit ${M} Hölzchen`, soll: K, toleranz: 1e-9, platzhalter: "Figur",
        hinweis: (roh, val) => {
          if (trifft(val, M / mm.a)) return `Erst die ${mm.b} zusätzlichen Hölzchen abziehen, dann teilen: (${M} − ${mm.b}) : ${mm.a}.`;
          return `Rückwärts rechnen: Der Term ist ${mm.a}n + ${mm.b}. Zieh ${mm.b} ab und teile durch ${mm.a}.`;
        },
      },
    ],
    tipps: [
      `Zähl die Hölzchen der Figuren 1, 2, 3 und stelle einen Term für Figur n auf.`,
      `Für Figur ${N} setzt du ${N} für n ein.`,
      `Für die zweite Frage rechnest du rückwärts: Was muss man von ${M} abziehen, und durch welche Zahl teilen?`,
    ],
    musterloesungHtml:
      `<strong>Term:</strong> ${mm.a}n + ${mm.b} (Figur 1: ${mm.a + mm.b}, mit jeder Figur ${mm.a} mehr)<br>` +
      `<strong>Figur ${N}:</strong> ${mm.a} · ${N} + ${mm.b} = <strong>${mm.a * N + mm.b}</strong><br>` +
      `<strong>Rückwärts:</strong> ${M} − ${mm.b} = ${M - mm.b}, ${M - mm.b} : ${mm.a} = <strong>${K}</strong><br>` +
      `<em>Probe:</em> ${mm.a} · ${K} + ${mm.b} = ${M} ✓`,
  };
}

// ---------- A8: Zahlentrick — Term aufstellen, dann rückwärts ----------
const A8_KANDIDATEN = spaeter(() => {
  const liste = [];
  for (const a of [2, 3, 4, 5, 7]) for (const m of [2, 3, 4, 5]) for (const b of [1, 3, 4, 6, 10]) {
    for (const x of [3, 4, 6, 7, 8, 9, 11, 12]) {
      const R = m * (x + a) - b;
      liste.push({ a, m, b, x, R });
    }
  }
  return liste;
});
function generateA8() {
  const k = ohneKollision(A8_KANDIDATEN(), ({ a, m, b, R }) => [(R + b) / m - a, R / m - a + b, (R - b) / m - a, (R + b) / m + a]);
  const { a, m, b, x, R } = k;
  const soll = T.P(`${m}(x + ${a}) - ${b}`, ["x"]);
  const mal = { 2: "verdopple", 3: "verdreifache", 4: "vervierfache", 5: "verfünffache" }[m];
  return {
    promptHtml:
      `Ein Zahlentrick: <em>„Denke dir eine Zahl. Addiere ${a}. ${mal[0].toUpperCase() + mal.slice(1)} das Ergebnis. Ziehe ${b} ab.“</em> ` +
      `<strong>Stelle einen Term für das Ergebnis auf</strong> (die gedachte Zahl heißt x). Anna sagt am Ende <strong>${R}</strong>. <strong>Welche Zahl hat sie sich gedacht?</strong>` + T.EINGABE_HINWEIS,
    felder: [
      T.termFeld({
        name: "Term für das Ergebnis", soll, variablen: ["x"], form: "beliebig", platzhalter: "Term",
        falsch: [[T.P(`${m}x + ${a} - ${b}`, ["x"]), `Vervielfacht wird das Ergebnis der Addition — also die ganze Summe x + ${a}. Sie gehört in Klammern.`]],
      }),
      {
        name: "gedachte Zahl", soll: x, toleranz: 1e-9, platzhalter: "x",
        hinweis: (roh, val) => {
          if (trifft(val, (R - b) / m - a)) return `Rückwärts kehrt sich jede Rechnung um: Aus „ziehe ${b} ab“ wird „addiere ${b}“.`;
          if (trifft(val, R / m - a + b)) return "Rückwärts kommen die Schritte in umgekehrter Reihenfolge: zuerst den letzten rückgängig machen.";
          if (trifft(val, (R + b) / m + a)) return `Aus „addiere ${a}“ wird rückwärts „subtrahiere ${a}“.`;
          return `Rechne rückwärts: ${R} + ${b}, dann : ${m}, dann − ${a}.`;
        },
      },
    ],
    tipps: [
      `Der Rechenbaum: x, dann + ${a}, dann · ${m}, dann − ${b}. Der letzte Schritt steht außen.`,
      `Rückwärts gehst du den Baum von oben nach unten und kehrst jeden Schritt um.`,
      `${R} + ${b} = ${R + b}, ${R + b} : ${m} = ${(R + b) / m}, und dann noch − ${a}.`,
    ],
    musterloesungHtml:
      `<strong>Term:</strong> ${m} · (x + ${a}) − ${b}<br>` +
      `<strong>Rückwärts:</strong> ${R} + ${b} = ${R + b}; ${R + b} : ${m} = ${(R + b) / m}; ${(R + b) / m} − ${a} = <strong>${x}</strong><br>` +
      `<em>Probe:</em> ${m} · (${x} + ${a}) − ${b} = ${m} · ${x + a} − ${b} = ${R} ✓`,
  };
}

// ================= Liste =================

export const AUFGABEN = [
  { schwierigkeit: "einfach", titel: "Termwert mit negativer Zahl", abschnitt: "sec-termwert", generate: generateA1 },
  { schwierigkeit: "einfach", titel: "Worte in einen Term übersetzen", abschnitt: "sec-rechenbaum", generate: generateA2 },
  { schwierigkeit: "mittel", titel: "Term zu einem Streichholzmuster", abschnitt: "sec-muster", generate: generateA3 },
  { schwierigkeit: "mittel", titel: "Wertetabelle ausfüllen", abschnitt: "sec-termwert", generate: generateA4 },
  { schwierigkeit: "schwierig", titel: "Term zu einer Sachsituation", abschnitt: ["sec-rechenbaum", "sec-termwert"], generate: generateA5 },
  { schwierigkeit: "schwierig", titel: "Ein Gegenbeispiel finden", abschnitt: "sec-gleichwertig", generate: generateA6 },
  { schwierigkeit: "komplex", titel: "Muster vorwärts und rückwärts", abschnitt: "sec-muster", generate: generateA7 },
  { schwierigkeit: "komplex", titel: "Ein Zahlentrick", abschnitt: ["sec-rechenbaum", "sec-termwert"], generate: generateA8 },
];
