// Selbstlernpfad „Terme aufstellen und Termwerte berechnen“ (Klasse 8, Terme, Thema 1).
//
// Reihenfolge — jeder Abschnitt benutzt nur, was vorher da war:
//   1. Muster: Eine Variable zählt mit. Drei Zählweisen einer Quadratreihe führen auf drei Terme,
//      die für jede Anzahl dasselbe liefern — gezählt wird an der Zeichnung, nicht behauptet.
//   2. Rechenbaum: Worte → Term. Der Baum zeigt die Reihenfolge der Rechenschritte und damit, wo
//      eine Klammer nötig ist; jeder Knoten trägt seinen Zwischenwert.
//   3. Termwerte und Wertetabellen: einsetzen, negative Zahlen in Klammern.
//   4. Gleichwertige Terme: Eine Tabelle kann widerlegen (Gegenbeispiel), aber nicht beweisen. Das
//      Begründen mit Rechengesetzen kommt erst in Thema 2 — hier wird nichts umgeformt.
//
// Farben: Variable und eingesetzte Zahl violett, Gruppen der Zählweise blau, violett, orange.
// Die Übungsaufgaben stehen in terme-aufstellen-aufgaben.js.

import { svgEl, svgText, el, flaeche, zeige, num, eingesetzt, reglerZahl, setzeText, setzeHtml, wahl, mountQuizze, mountUebungsaufgaben } from "./seite.js?v=1";
import { AUFGABEN } from "./terme-aufstellen-aufgaben.js?v=1";

// ================= 1. Streichholzmuster =================
//
// Eine Reihe aus n Quadraten: oben n waagerechte Hölzchen, unten n, dazu n + 1 senkrechte. Jedes
// Hölzchen gehört bei jeder Zählweise zu genau einer Gruppe — gezählt wird über die Gruppen.

const SM_W = 680;
const SM_MAX = 10;   // größte Anzahl am Regler: Sie legt den Maßstab fest, damit eine längere Reihe auch länger aussieht
const SM_SPREIZ = 0.38;   // Abstand zwischen zwei Gruppen beim Auseinanderziehen, in Hölzchenlängen

// Die Hölzchen der Reihe: { x1, y1, x2, y2, art } in Hölzchenlängen; art: "oben", "unten", "senkrecht".
function hoelzchen(n) {
  const out = [];
  for (let i = 0; i <= n; i++) out.push({ x1: i, y1: 0, x2: i, y2: 1, art: "senkrecht", i });
  for (let i = 0; i < n; i++) {
    out.push({ x1: i, y1: 1, x2: i + 1, y2: 1, art: "oben", i });
    out.push({ x1: i, y1: 0, x2: i + 1, y2: 0, art: "unten", i });
  }
  return out;
}
// Zu welcher Gruppe ein Hölzchen gehört, und wohin die Gruppe beim Auseinanderziehen wandert.
const ZAEHLWEISEN = {
  a: {
    term: "1 + 3 · n",
    wert: (n) => 1 + 3 * n,
    rechnung: (n) => `1 + 3 · ${n}`,
    gruppe: (h) => (h.art === "senkrecht" && h.i === 0 ? 0 : 1 + (h.art === "senkrecht" ? h.i - 1 : h.i)),
    weg: (g) => ({ x: g * SM_SPREIZ, y: 0 }),
    beschreibung: (n) => `Erst das linke Hölzchen, dann kommen für jedes der ${n} Quadrate drei dazu: oben, unten und rechts.`,
  },
  b: {
    term: "4 + 3 · (n − 1)",
    wert: (n) => 4 + 3 * (n - 1),
    rechnung: (n) => `4 + 3 · (${n} − 1)`,
    gruppe: (h) => {
      const quadrat = h.art === "senkrecht" ? Math.max(0, h.i - 1) : h.i;
      return quadrat === 0 ? 0 : quadrat;
    },
    weg: (g) => ({ x: g * SM_SPREIZ, y: 0 }),
    beschreibung: (n) => n === 1
      ? "Das erste Quadrat braucht vier Hölzchen — weitere Quadrate gibt es hier noch nicht."
      : `Das erste Quadrat braucht vier Hölzchen, jedes der ${n - 1} weiteren nur noch drei: Seine linke Seite ist schon da.`,
  },
  c: {
    term: "2 · n + (n + 1)",
    wert: (n) => 2 * n + (n + 1),
    rechnung: (n) => `2 · ${n} + (${n} + 1)`,
    // 0: waagerecht oben, 1: waagerecht unten (beide zählen als „2 · n“), 2: senkrecht.
    gruppe: (h) => (h.art === "oben" ? 0 : h.art === "unten" ? 1 : 2),
    weg: (g) => ({ x: 0, y: g === 0 ? 0.55 : g === 1 ? -0.55 : 0 }),
    beschreibung: (n) => `Oben und unten liegen je ${n} waagerechte Hölzchen, dazwischen ${n + 1} senkrechte — eins mehr als Quadrate.`,
  },
};
// Farbe einer Gruppe: Die erste ist blau, danach wechseln violett und orange. Bei „waagerecht und
// senkrecht“ sind beide waagerechten Reihen eine Farbe.
function gruppenKlasse(art, g) {
  if (art === "c") return g === 2 ? "tm-holz-b" : "tm-holz-r";
  if (g === 0) return "tm-holz-c";
  return g % 2 ? "tm-holz-r" : "tm-holz-b";
}

function renderMuster() {
  const n = reglerZahl("sm-n");
  const art = wahl("sm-art");
  const t = reglerZahl("sm-t") / 100;
  const z = ZAEHLWEISEN[art];
  setzeText("sm-n-anzeige", String(n));
  setzeText("sm-t-anzeige", Math.round(t * 100) + " %");

  // Fester Maßstab für die längste Reihe, ganz auseinandergezogen.
  const breiteE = SM_MAX + SM_MAX * SM_SPREIZ;
  const skala = Math.min(52, (SM_W - 70) / breiteE);
  const H = Math.round(skala * (1 + 2 * 0.55) + 110);
  const svg = flaeche(SM_W, H, "Streichholzmuster");
  const ox = 35, oy = H - 55 - 0.55 * skala;
  const P = (x, y) => ({ x: ox + x * skala, y: oy - y * skala });

  const liste = hoelzchen(n);
  const gruppen = new Map();
  for (const h of liste) {
    const g = z.gruppe(h);
    const w = z.weg(g);
    const a = P(h.x1 + t * w.x, h.y1 + t * w.y), b = P(h.x2 + t * w.x, h.y2 + t * w.y);
    svg.appendChild(svgEl("line", {
      x1: a.x.toFixed(2), y1: a.y.toFixed(2), x2: b.x.toFixed(2), y2: b.y.toFixed(2),
      class: "tm-holz " + gruppenKlasse(art, g), "data-rolle": "holz", "data-gruppe": String(g),
    }));
    if (!gruppen.has(g)) gruppen.set(g, []);
    gruppen.get(g).push({ a, b });
  }
  // Unter jeder Gruppe die Zahl ihrer Hölzchen — so steht der Term in der Zeichnung.
  for (const [g, hs] of gruppen) {
    const xs = hs.flatMap((h) => [h.a.x, h.b.x]), ys = hs.flatMap((h) => [h.a.y, h.b.y]);
    const mx = (Math.min(...xs) + Math.max(...xs)) / 2, my = (Math.min(...ys) + Math.max(...ys)) / 2;
    // Die Zahl der Hölzchen steht unter ihrer Gruppe — bei „waagerecht und senkrecht“ die obere Reihe
    // darüber, die untere darunter und die senkrechten rechts daneben: Unter ihnen läge die untere Reihe.
    const lage = art !== "c" ? { x: mx, y: Math.max(...ys) + 20, anker: "middle" }
      : g === 0 ? { x: mx, y: Math.min(...ys) - 10, anker: "middle" }
        : g === 1 ? { x: mx, y: Math.max(...ys) + 20, anker: "middle" }
          : { x: Math.max(...xs) + 12, y: my + 5, anker: "start" };
    svg.appendChild(svgText(lage.x, lage.y, String(hs.length), { class: "tm-zahl " + gruppenKlasse(art, g) + "-text", "text-anchor": lage.anker, "data-rolle": "gruppenzahl", "data-gruppe": String(g) }));
  }
  zeige("sm-mount", svg);

  const gezaehlt = liste.length;
  const zeile = (k) => {
    const zz = ZAEHLWEISEN[k];
    const an = k === art;
    return `<span class="${an ? "tm-an" : "tm-aus"}">${zz.term} = ${zz.rechnung(n)} = <strong>${zz.wert(n)}</strong></span>`;
  };
  setzeHtml("sm-bilanz",
    `Gezählt: <strong data-rolle="gezaehlt">${gezaehlt} Hölzchen</strong> für n = ${n} Quadrate<br>` +
    ["a", "b", "c"].map(zeile).join("<br>"));
  setzeText("sm-text", z.beschreibung(n) + (t > 0 ? " Auseinandergezogen sieht man die Gruppen, die der Term zählt." : ""));
}

// ================= 2. Rechenbaum =================

// Ein Satz als Baum: { op, kinder } für Rechenschritte, { zahl } oder { variable: true } als Blätter.
const V = { variable: true };
const Z = (zahl) => ({ zahl });
const O = (op, ...kinder) => ({ op, kinder });
const SAETZE = [
  { baum: O("−", O("·", Z(2), V), Z(3)), term: "2 · x − 3", partner: 1 },
  { baum: O("·", Z(2), O("−", V, Z(3))), term: "2 · (x − 3)", partner: 0 },
  { baum: O("+", O("·", Z(3), V), Z(5)), term: "3 · x + 5", partner: 3 },
  { baum: O("·", Z(3), O("+", V, Z(5))), term: "3 · (x + 5)", partner: 2 },
  { baum: O("+", O("²", V), Z(1)), term: "x² + 1", partner: 5 },
  { baum: O("²", O("+", V, Z(1))), term: "(x + 1)²", partner: 4 },
];
const NAMEN = { "+": "eine Summe", "−": "eine Differenz", "·": "ein Produkt", "²": "eine Potenz (ein Quadrat)" };
// Eingesetzt in den Termtext: Direkt hinter einer öffnenden Klammer braucht eine negative Zahl keine
// zweite Klammer — „2 · (−2 − 3)“, nicht „2 · ((−2) − 3)“.
const setzeEin = (term, x) => term.replace(/(\(?)x/g, (m, klammer) => (klammer ? "(" + num(x) : eingesetzt(x)));
function rechne(k, x) {
  if (k.variable) return x;
  if ("zahl" in k) return k.zahl;
  const w = k.kinder.map((c) => rechne(c, x));
  if (k.op === "+") return w[0] + w[1];
  if (k.op === "−") return w[0] - w[1];
  if (k.op === "·") return w[0] * w[1];
  return w[0] * w[0];
}

const RB_W = 560;
function renderBaum() {
  const s = SAETZE[Number(wahl("rb-satz"))];
  const x = reglerZahl("rb-x");
  setzeText("rb-x-anzeige", num(x));

  // Blätter von links nach rechts, jeder Knoten über der Mitte seiner Kinder, die Wurzel oben.
  let blatt = 0;
  const tiefe = (k) => (k.kinder ? 1 + Math.max(...k.kinder.map(tiefe)) : 0);
  const T = tiefe(s.baum);
  const lage = new Map();
  (function setze(k, d) {
    if (!k.kinder) {
      lage.set(k, { spalte: blatt++, d });
      return;
    }
    k.kinder.forEach((c) => setze(c, d + 1));
    const sp = k.kinder.map((c) => lage.get(c).spalte);
    lage.set(k, { spalte: (Math.min(...sp) + Math.max(...sp)) / 2, d });
  })(s.baum, 0);
  const H = 70 + T * 78 + 40;
  const svg = flaeche(RB_W, H, "Rechenbaum");
  const dx = 110, x0 = RB_W / 2 - ((blatt - 1) * dx) / 2;
  const pos = (k) => {
    const l = lage.get(k);
    // Die Blätter stehen alle unten, auch wenn ihr Ast kürzer ist: So liest man die Zahlen in einer Reihe.
    const zeile = k.kinder ? l.d : T;
    return { x: x0 + l.spalte * dx, y: 40 + zeile * 78 };
  };
  (function zeichne(k) {
    const p = pos(k);
    if (k.kinder) {
      for (const c of k.kinder) {
        const q = pos(c);
        svg.appendChild(svgEl("line", { x1: p.x, y1: p.y + 16, x2: q.x, y2: q.y - 16, class: "tm-ast" }));
        zeichne(c);
      }
    }
    const w = rechne(k, x);
    const istWurzel = k === s.baum;
    const g = svgEl("g", {
      class: "tm-knoten" + (istWurzel ? " tm-wurzel" : "") + (k.variable ? " tm-var" : ""),
      "data-rolle": "knoten", "data-op": k.op || "", "data-wert": String(w), "data-blatt": k.kinder ? "nein" : "ja",
    });
    g.appendChild(svgEl("circle", { cx: p.x, cy: p.y, r: 17 }));
    g.appendChild(svgText(p.x, p.y + 5, k.kinder ? k.op : k.variable ? "x" : num(k.zahl), { class: "tm-knoten-text" }));
    // Der Zwischenwert rechts neben dem Knoten — bei der Variablen die eingesetzte Zahl.
    g.appendChild(svgText(p.x + 24, p.y + 5, "= " + num(w), { class: "tm-knoten-wert", "text-anchor": "start" }));
    svg.appendChild(g);
  })(s.baum);
  zeige("rb-mount", svg);

  const p = SAETZE[s.partner];
  const w = rechne(s.baum, x), wp = rechne(p.baum, x);
  setzeHtml("rb-bilanz",
    `Term: <strong>${s.term}</strong> — ${NAMEN[s.baum.op].replace(/^(eine?) /, "$1 <strong>")}</strong>, denn der letzte Rechenschritt ist „${s.baum.op}“.<br>` +
    `Für x = ${num(x)}: ${setzeEin(s.term, x)} = <strong data-rolle="termwert">${num(w)}</strong><br>` +
    `<span class="tm-aus">Zum Vergleich der ähnliche Satz: ${p.term} = ${setzeEin(p.term, x)} = ${num(wp)}</span>`);
  setzeText("rb-text", w === wp
    ? `Für x = ${num(x)} stimmen beide Sätze zufällig überein. Versuch eine andere Zahl — die Terme rechnen trotzdem verschieden.`
    : `Gleiche Wörter, andere Reihenfolge: ${s.term} ergibt ${num(w)}, ${p.term} ergibt ${num(wp)}. Unten im Baum wird zuerst gerechnet, oben zuletzt.`);
}

// ================= 3. Wertetabelle =================

const TABELLEN_TERME = [
  { term: "3x − 4", f: (x) => 3 * x - 4, einsetzen: (x) => `3 · ${eingesetzt(x)} − 4` },
  { term: "2 · (x + 5)", f: (x) => 2 * (x + 5), einsetzen: (x) => `2 · (${num(x)} + 5)` },
  { term: "x² − 2x", f: (x) => x * x - 2 * x, einsetzen: (x) => `${eingesetzt(x)}² − 2 · ${eingesetzt(x)}` },
  { term: "−x² + 9", f: (x) => -x * x + 9, einsetzen: (x) => `−${eingesetzt(x)}² + 9` },
  { term: "(x − 1)²", f: (x) => (x - 1) * (x - 1), einsetzen: (x) => `(${num(x)} − 1)²` },
];
const ZEILEN = 6;

function renderTabelle() {
  const tt = TABELLEN_TERME[Number(wahl("wt-term"))];
  const start = reglerZahl("wt-start"), schritt = reglerZahl("wt-schritt");
  setzeText("wt-start-anzeige", num(start));
  setzeText("wt-schritt-anzeige", num(schritt));
  const tab = el("table", { class: "tm-tabelle", id: "wt-tabelle" });
  tab.appendChild(el("thead", {}, el("tr", {}, [el("th", {}, "x"), el("th", {}, "eingesetzt in " + tt.term), el("th", {}, "Termwert")])));
  const body = el("tbody");
  let negativ = null;
  for (let i = 0; i < ZEILEN; i++) {
    const x = start + i * schritt;
    const w = tt.f(x);
    if (x < 0 && negativ === null) negativ = { x, w };
    body.appendChild(el("tr", { "data-x": String(x), "data-wert": String(w) }, [
      el("td", { class: "tm-x" }, num(x)),
      el("td", {}, tt.einsetzen(x)),
      el("td", { class: "tm-w" }, num(w)),
    ]));
  }
  tab.appendChild(body);
  const mount = document.getElementById("wt-mount");
  mount.innerHTML = "";
  mount.appendChild(tab);
  setzeText("wt-text", negativ
    ? `Bei negativen Zahlen steht die eingesetzte Zahl in Klammern: Für x = ${num(negativ.x)} ergibt ${tt.term} den Wert ${num(negativ.w)}. Gleich große Schritte in x geben bei ${/²/.test(tt.term) ? "diesem Term keine gleich großen Schritte im Termwert — das macht das Quadrat" : "diesem Term gleich große Schritte im Termwert"}.`
    : `Alle Zahlen sind positiv — schieb den Start nach links, dann kommen negative Zahlen dazu.`);
}

// ================= 4. Gleichwertige Terme =================

const PAARE = [
  { a: "2 · (x + 3)", b: "2x + 6", fa: (x) => 2 * (x + 3), fb: (x) => 2 * x + 6 },
  { a: "2x + 3", b: "2 · (x + 3)", fa: (x) => 2 * x + 3, fb: (x) => 2 * (x + 3) },
  { a: "x + x + x", b: "3x", fa: (x) => x + x + x, fb: (x) => 3 * x },
  { a: "x²", b: "2x", fa: (x) => x * x, fb: (x) => 2 * x },
  { a: "(x + 1)²", b: "x² + 1", fa: (x) => (x + 1) * (x + 1), fb: (x) => x * x + 1 },
  { a: "4x − 2", b: "2 · (2x − 1)", fa: (x) => 4 * x - 2, fb: (x) => 2 * (2 * x - 1) },
];
const GW_ZEILEN = 7;

function renderGleichwertig() {
  const p = PAARE[Number(wahl("gw-paar"))];
  const start = reglerZahl("gw-start");
  setzeText("gw-start-anzeige", num(start));
  const tab = el("table", { class: "tm-tabelle", id: "gw-tabelle" });
  tab.appendChild(el("thead", {}, el("tr", {}, [el("th", {}, "x"), el("th", {}, p.a), el("th", {}, p.b), el("th", {}, "gleich?")])));
  const body = el("tbody");
  const verschieden = [], gleich = [];
  for (let i = 0; i < GW_ZEILEN; i++) {
    const x = start + i;
    const wa = p.fa(x), wb = p.fb(x);
    const ok = wa === wb;
    (ok ? gleich : verschieden).push({ x, wa, wb });
    body.appendChild(el("tr", { class: ok ? "tm-gleich" : "tm-ungleich", "data-x": String(x) }, [
      el("td", { class: "tm-x" }, num(x)), el("td", {}, num(wa)), el("td", {}, num(wb)),
      el("td", { class: "tm-urteil" }, ok ? "✓ gleich" : "✗ verschieden"),
    ]));
  }
  tab.appendChild(body);
  const mount = document.getElementById("gw-mount");
  mount.innerHTML = "";
  mount.appendChild(tab);
  let text;
  if (verschieden.length) {
    const g = verschieden[0];
    text = `Gegenbeispiel: Für x = ${num(g.x)} ergibt ${p.a} den Wert ${num(g.wa)}, ${p.b} aber ${num(g.wb)}. Damit ist klar: Die Terme sind nicht gleichwertig.`;
    if (gleich.length) text += ` Dass sie für x = ${gleich.map((q) => num(q.x)).join(" und x = ")} übereinstimmen, ist Zufall und ändert daran nichts.`;
  } else {
    text = `In allen ${GW_ZEILEN} Zeilen stimmen die Werte überein — ein starker Hinweis, aber noch kein Beweis: Die Tabelle zeigt nur ${GW_ZEILEN} von unendlich vielen Zahlen. Begründet wird die Gleichwertigkeit mit den Rechengesetzen in Thema 2.`;
  }
  setzeText("gw-text", text);
}

// ================= Kontrollfragen =================

const QUIZZE = {
  "quiz-muster": {
    q: "Jonas zählt die Hölzchen der Quadratreihe so: oben n, unten n und dazu n + 1 senkrechte. Welcher Term passt zu seiner Zählweise?",
    options: ["n + n + (n + 1)", "3 · n", "n + n + n", "4 · n"],
    correct: 0,
    explain: "Jede Gruppe wird ein Summand: oben n, unten n, senkrecht n + 1. Zusammen n + n + (n + 1) — gleichwertig mit 1 + 3 · n. 3 · n und n + n + n vergessen das letzte senkrechte Hölzchen, 4 · n zählt jede gemeinsame Seite doppelt (bei 1 Quadrat stimmt es zufällig).",
  },
  "quiz-rechenbaum": {
    q: "Welcher Term gehört zu dem Satz: „Die Differenz aus dem Dreifachen einer Zahl und 4, halbiert“?",
    options: ["3x − 4 : 2", "3 · (x − 4) : 2", "3x − (4 : 2)", "(3x − 4) : 2"],
    correct: 3,
    explain: "Erst wird die Differenz gebildet — aus dem Dreifachen 3x und der 4 —, dann wird halbiert. Das Halbieren ist der letzte Schritt, also steht die Differenz in Klammern: (3x − 4) : 2. Ohne Klammer würde nur die 4 halbiert, und 3 · (x − 4) zöge die 4 schon vor dem Verdreifachen ab.",
  },
  "quiz-termwert": {
    q: "Welchen Wert hat der Term x² − 3x für x = −2?",
    options: ["2", "−2", "10", "−10"],
    correct: 2,
    explain: "Eingesetzt mit Klammern: (−2)² − 3 · (−2) = 4 − (−6) = 4 + 6 = 10. Wer −2² als −4 rechnet, kommt auf 2; wer das Minus vor 3 · (−2) verliert, auf −2 — und beide Fehler zusammen ergeben −10.",
  },
  "quiz-gleichwertig": {
    q: "Die Terme x² + 2 und 3x haben für x = 1 und für x = 2 denselben Wert. Was folgt daraus?",
    options: [
      "Sie sind gleichwertig — zwei passende Zahlen genügen.",
      "Sie sind nicht gleichwertig: Für x = 0 ergibt x² + 2 den Wert 2, 3x aber 0.",
      "Man kann es erst entscheiden, wenn man alle Zahlen eingesetzt hat.",
      "Sie sind gleichwertig, weil beide Terme die Variable x enthalten.",
    ],
    correct: 1,
    explain: "Ein einziges Gegenbeispiel genügt, um Gleichwertigkeit zu widerlegen — hier x = 0 (2 und 0). Dass die Werte bei 1 und 2 übereinstimmen, ist Zufall. Umgekehrt beweisen auch viele passende Zahlen keine Gleichwertigkeit; dafür braucht man die Rechengesetze.",
  },
};

// ================= Start =================

["sm-n", "sm-art", "sm-t"].forEach((id) => document.getElementById(id).addEventListener("input", renderMuster));
["rb-satz", "rb-x"].forEach((id) => document.getElementById(id).addEventListener("input", renderBaum));
["wt-term", "wt-start", "wt-schritt"].forEach((id) => document.getElementById(id).addEventListener("input", renderTabelle));
["gw-paar", "gw-start"].forEach((id) => document.getElementById(id).addEventListener("input", renderGleichwertig));

renderMuster();
renderBaum();
renderTabelle();
renderGleichwertig();
mountQuizze(QUIZZE);
mountUebungsaufgaben(document.getElementById("exercises-mount"), AUFGABEN);
