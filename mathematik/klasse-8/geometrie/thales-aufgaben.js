// Die zwölf Übungsaufgaben zum Satz des Thales, gegliedert nach der Arbeitsweise:
//
//   1. KONSTRUKTIONS_AUFGABEN — sechs Aufgaben, die auf der Seite mit Zirkel und Lineal
//      konstruiert und anschließend geprüft werden. Sie teilen sich EINE Werkbank; der
//      Umschalter tauscht Vorgabe, Anleitung und Prüfung aus. Sechs eigene Zeichenflächen
//      wären sechs Werkzeuginstanzen, von denen fünf nur Rechenzeit kosten.
//   2. RECHEN_AUFGABEN — drei Aufgaben, bei denen die Figur Lücken hat: Die gesuchten Winkel
//      bzw. Längen stehen als ①②③ in der Zeichnung und werden unter ihr eingetragen. Beim
//      Prüfen wandern die richtigen Werte in die Figur — dieselbe Bedienung wie bei den
//      Baumdiagrammen der Wahrscheinlichkeitsrechnung in MSS 13.
//   3. HEFT_AUFGABEN — drei Aufgaben, die mit echtem Zirkel im Heft gezeichnet werden. Sie
//      lassen sich nicht am Bildschirm abhaken, deshalb gibt es statt einer Prüfung eine
//      aufklappbare Selbstkontrolle mit den Sollwerten zum Nachmessen.
//
// Jede Prüfung bewertet die GEZEICHNETE Konstruktion, nicht den Weg dorthin: Ein Kreis zählt,
// wenn Mittelpunkt und Radius stimmen, eine Gerade, wenn sie durch die beiden verlangten Punkte
// läuft. Nur der Thaleskreis verlangt zusätzlich die Mittelsenkrechte — sein Mittelpunkt darf
// nicht geschätzt werden, das ist der fachliche Kern des Themas.

import * as GC from "./geo-core.js?v=22";
import * as GS from "./geo-svg.js?v=22";
import { lineThroughBoth } from "./check-helpers.js?v=22";
import { bester, findMediatriceAlle, circlesAt, pairPoints } from "./tri-construct.js?v=22";
import { setupFreeConstruction } from "./free-ui.js?v=22";
import { setupCanvasZoom } from "./canvas-zoom.js?v=22";

// ---------- Helfer ----------

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

function num(x, digits = 2) {
  const f = Math.pow(10, digits);
  const gerundet = Math.round(x * f) / f;
  return (gerundet === 0 ? 0 : gerundet).toLocaleString("de-DE", { maximumFractionDigits: digits });
}

// Komma wie Punkt als Dezimaltrennzeichen annehmen; „65°“ und „65 grad“ ebenfalls.
function zahlAus(roh) {
  if (typeof roh !== "string") return NaN;
  const s = roh.trim().replace(/°/g, "").replace(/\s/g, "").replace(",", ".");
  if (s === "") return NaN;
  const v = Number(s);
  return isFinite(v) ? v : NaN;
}

const KREIS_ZIFFERN = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩"];
function ziffer(n) {
  return KREIS_ZIFFERN[n - 1] || "(" + n + ")";
}

const GRAD = Math.PI / 180;

// ================= Block 1: Konstruieren =================

const K_W = 600, K_H = 420;

// Ein Ergebniskreis gilt als richtig, wenn sein Radius auf 5 % genau stimmt — dieselbe Schranke
// wie beim Thaleskreis in Abschnitt 4, damit ein von Hand gesetzter Kreis nicht an Pixeln scheitert.
const R_TOL = 0.05;
// Abstand einer gezeichneten Geraden von einem Punkt, der noch als „geht hindurch“ gilt.
const LINIE_TOL = 12;
// Abstand zweier Punkte, die noch als derselbe gelten (Klickgenauigkeit am Bildschirm).
const PUNKT_TOL = 14;

function kreisUm(tool, zentrum, radius) {
  const at = circlesAt(tool, zentrum);
  const beste = at.slice().sort((a, b) => Math.abs(a.radius - radius) - Math.abs(b.radius - radius))[0];
  const passt = beste && Math.abs(beste.radius - radius) / radius < R_TOL;
  return { kreis: passt ? beste : null, irgendeiner: at.length > 0 };
}

function geradeDurch(tool, P, Q) {
  return tool.lines.find((l) => lineThroughBoth(l, P, Q, LINIE_TOL)) || null;
}

// Abstand eines Punktes von der Geraden AB (Kreuzprodukt mit normierter Richtung).
function abstandZurGeraden(P, A, B) {
  const d = GC.norm(GC.sub(B, A));
  return Math.abs(GC.cross2(A, GC.add(A, d), P));
}

// Eine gezeichnete Gerade, die parallel zu AB im Abstand h verläuft — auf welcher Seite, ist frei.
function paralleleZu(tool, A, B, h, tol = LINIE_TOL) {
  const d = GC.norm(GC.sub(B, A));
  return (
    tool.lines.find((l) => {
      const e = GC.norm(GC.sub(l.b, l.a));
      // parallel: die beiden Richtungen spannen keine Fläche auf
      if (Math.abs(d.x * e.y - d.y * e.x) > 0.06) return false;
      return Math.abs(abstandZurGeraden(l.a, A, B) - h) < tol;
    }) || null
  );
}

// Der Thaleskreis über PQ, samt der Mittelsenkrechten, die seinen Mittelpunkt erst liefert.
function thalesTeil(tool, P, Q) {
  const ms = bester(findMediatriceAlle(tool, P, Q));
  const M = ms ? GC.mid(P, Q) : null;
  const r = GC.dist(P, Q) / 2;
  const k = M ? kreisUm(tool, M, r) : { kreis: null, irgendeiner: false };
  return { ms, M, r, kreis: k.kreis, irgendeinerBeiM: k.irgendeiner };
}

// Die Rückmeldungen zum Thaleskreis sind in allen Aufgaben dieselben.
function thalesMeldung(t, ueber) {
  if (!t.ms)
    return (
      `Es fehlt noch die Mittelsenkrechte von ${ueber}: zwei gleich große Kreise um ${ueber[0]} und um ${ueber[1]} zeichnen ` +
      `(Radius größer als die halbe Strecke) und ihre beiden Schnittpunkte mit dem Lineal verbinden. Erst sie liefert den Mittelpunkt.`
    );
  if (!t.kreis)
    return t.irgendeinerBeiM
      ? `Der Kreis um den Mittelpunkt von ${ueber} hat nicht den richtigen Radius — der Thaleskreis muss durch ${ueber[0]} und durch ${ueber[1]} gehen.`
      : `Es fehlt noch der Thaleskreis: Zirkel in den Mittelpunkt von ${ueber} einstechen (dort, wo die Mittelsenkrechte die Strecke trifft) und den Radius bis ${ueber[0]} einstellen.`;
  return null;
}

// Die Punkte, auf die free-ui einrasten und die es als Kreuz zeigen soll.
function markiere(marks, p, done) {
  if (!p) return;
  const gleich = marks.find((m) => GC.dist(m.p, p) < 2);
  if (gleich) gleich.done = gleich.done || done;
  else marks.push({ p, done });
}

// Solange ein Lot noch fehlt, sind seine Hilfspunkte die Schnittpunkte EINES Kreises um den
// Fußpunkt mit der Geraden — und danach die Kreuzung der beiden gleich großen Kreise darum.
// Ohne sie ließe sich das Lot nicht konstruieren, sondern nur schätzen; und geschätzt ist auf
// dieser Seite nichts wert. Angeboten werden nur Kreise um genau diesen Punkt, sonst läge die
// Zeichnung bald voller bedeutungsloser Kreuze.
function lotHilfspunkte(tool, zentrum, gA, gB, marks, snap) {
  for (const c of circlesAt(tool, zentrum)) {
    const treffer = GC.circleLineIntersections(c.center, c.radius, gA, gB);
    if (treffer.length !== 2) continue;
    treffer.forEach((p) => {
      markiere(marks, p, false);
      snap.push(p);
    });
    pairPoints(tool, treffer[0], treffer[1]).forEach((p) => markiere(marks, p, false));
    return true;
  }
  return false;
}

// Schnittpunkte zweier Kreise, sortiert: der obere zuerst. So ist „der Punkt oberhalb“ stabil.
function schnittOben(c1, r1, c2, r2) {
  const s = GC.circleCircleIntersections(c1, r1, c2, r2);
  return s.slice().sort((a, b) => a.y - b.y);
}

// ---------- Die sechs Aufgaben ----------

// Aufgabe 1 — der Thaleskreis selbst. Die Grundaufgabe: ohne Mittelsenkrechte kein Mittelpunkt.
const K1 = {
  id: "k1",
  kurz: "1. Thaleskreis",
  titel: "Aufgabe 1 — den Thaleskreis über AB konstruieren",
  stufe: "einfach",
  aufgabe:
    "Gegeben ist die Strecke <strong>AB</strong>. Konstruiere den <strong>Thaleskreis</strong> über AB — den Kreis, auf dem jeder Punkt die Strecke AB unter einem rechten Winkel sieht.",
  schritte: [
    "Zwei gleich große Kreise um A und um B zeichnen; der Radius muss <strong>größer als die halbe Strecke</strong> sein.",
    "Die beiden Schnittpunkte mit dem Lineal verbinden: die Mittelsenkrechte von AB. Wo sie AB trifft, liegt <strong>M</strong>.",
    "Zirkel in M einstechen und den Radius bis A (oder B) einstellen — fertig ist der Thaleskreis.",
  ],
  vorgabe() {
    const A = GC.pt(170, 215), B = GC.pt(430, 215);
    return { A, B };
  },
  zeichne(layer, g) {
    GS.drawSegment(layer, g.A, g.B);
    GS.drawPoint(layer, g.A, "A");
    GS.drawPoint(layer, g.B, "B");
  },
  analyse(tool, g) {
    const t = thalesTeil(tool, g.A, g.B);
    const marks = [];
    const spentCircles = new Set();
    if (t.ms) {
      t.ms.circles.forEach((c) => spentCircles.add(c));
      t.ms.points.forEach((p) => markiere(marks, p, true));
    } else {
      pairPoints(tool, g.A, g.B).forEach((p) => markiere(marks, p, false));
    }
    if (t.M) markiere(marks, t.M, !!t.kreis);
    return { t, marks, spentCircles, snapPoints: t.M ? [g.A, g.B, t.M] : [g.A, g.B] };
  },
  pruefe(a) {
    const msg = thalesMeldung(a.t, "AB");
    if (msg) return { ok: false, msg };
    return {
      ok: true,
      msg:
        "Richtig konstruiert! Der Kreis geht durch A und durch B, denn MA = MB ist sein Radius — AB ist also sein Durchmesser. " +
        "Jeder weitere Punkt dieses Kreises bildet mit A und B ein rechtwinkliges Dreieck.",
    };
  },
};

// Aufgabe 2 — rechtwinkliges Dreieck aus Hypotenuse und einer Kathete.
// Der Thaleskreis liefert den rechten Winkel, der Kreis um B die Länge a. C ist ihr Schnittpunkt.
const K2 = (() => {
  const A = GC.pt(180, 270), B = GC.pt(420, 270);       // c = 240
  const aLang = 144;                                     // Kathete a = BC
  const M = GC.mid(A, B), r = 120;
  const C = schnittOben(M, r, B, aLang)[0];              // der Punkt oberhalb von AB
  const massA = GC.pt(70, 80), massB = GC.pt(70 + aLang, 80);
  return {
    id: "k2",
    kurz: "2. c und a",
    titel: "Aufgabe 2 — rechtwinkliges Dreieck aus c und a",
    stufe: "einfach",
    aufgabe:
      "Gegeben sind die <strong>Hypotenuse c = AB</strong> und die Länge der Kathete <strong>a = BC</strong> (die einzelne Strecke oben links). " +
      "Konstruiere das Dreieck ABC mit dem rechten Winkel bei C.",
    schritte: [
      "Thaleskreis über AB konstruieren (Mittelsenkrechte → M, dann Kreis um M durch A). Auf ihm liegen <em>alle</em> Punkte mit ∡ACB = 90°.",
      "Zirkel auf die vorgegebene Länge a stellen, in <strong>B</strong> einstechen und einen Kreis zeichnen. Er trifft den Thaleskreis in <strong>C</strong>.",
      "Die Geraden durch A und C sowie durch B und C ziehen — das Dreieck steht.",
    ],
    vorgabe: () => ({ A, B, C, M, r, aLang, massA, massB }),
    zeichne(layer, g) {
      GS.drawSegment(layer, g.A, g.B);
      GS.drawPoint(layer, g.A, "A");
      GS.drawPoint(layer, g.B, "B");
      GS.drawSegment(layer, g.massA, g.massB, "th-mass");
      layer.appendChild(beschriftung((g.massA.x + g.massB.x) / 2, g.massA.y - 12, "a"));
    },
    analyse(tool, g) {
      const t = thalesTeil(tool, g.A, g.B);
      const marks = [];
      const spentCircles = new Set();
      if (t.ms) {
        t.ms.circles.forEach((c) => spentCircles.add(c));
        t.ms.points.forEach((p) => markiere(marks, p, true));
      } else {
        pairPoints(tool, g.A, g.B).forEach((p) => markiere(marks, p, false));
      }
      const kA = kreisUm(tool, g.B, g.aLang);
      const seiten = { AC: geradeDurch(tool, g.A, g.C), BC: geradeDurch(tool, g.B, g.C) };
      if (t.M) markiere(marks, t.M, !!t.kreis);
      // C ist erst ein Klickziel, wenn beide Kreise wirklich gezeichnet sind.
      if (t.kreis && kA.kreis) markiere(marks, g.C, !!(seiten.AC && seiten.BC));
      const snap = [g.A, g.B];
      if (t.M) snap.push(t.M);
      if (t.kreis && kA.kreis) snap.push(g.C);
      return { t, kA, seiten, marks, spentCircles, snapPoints: snap };
    },
    pruefe(a) {
      const msg = thalesMeldung(a.t, "AB");
      if (msg) return { ok: false, msg };
      if (!a.kA.kreis)
        return {
          ok: false,
          msg:
            "Es fehlt der Kreis um „B“ mit dem Radius a. Stelle den Zirkel genau auf die vorgegebene Strecke a ein (oben links), " +
            "steche in B ein und zeichne den Kreis — er trägt die Kathete a von B aus ab und trifft den Thaleskreis im gesuchten Punkt C.",
        };
      if (!a.seiten.AC || !a.seiten.BC)
        return { ok: false, msg: "Der Punkt C steht — jetzt fehlen noch die Dreiecksseiten: die Geraden durch A und C sowie durch B und C." };
      return {
        ok: true,
        msg:
          "Richtig konstruiert! C liegt auf dem Thaleskreis, also ist der Winkel bei C ein rechter; und C hat von B den Abstand a. " +
          "Beides zusammen legt das Dreieck fest. Die zweite Kathete ergibt sich dann aus b = √(c² − a²).",
      };
    },
  };
})();

// Aufgabe 3 — Tangenten von einem äußeren Punkt. Die Anwendung aus Abschnitt 5, jetzt selbst gebaut.
const K3 = (() => {
  const M = GC.pt(180, 220), r = 70, P = GC.pt(470, 220);
  const d = GC.dist(M, P);
  const Z = GC.mid(M, P);
  const T = schnittOben(M, r, Z, d / 2);
  return {
    id: "k3",
    kurz: "3. Tangenten",
    titel: "Aufgabe 3 — die beiden Tangenten von P an den Kreis",
    stufe: "mittel",
    aufgabe:
      "Gegeben sind der Kreis k mit dem Mittelpunkt <strong>M</strong> und ein Punkt <strong>P</strong> außerhalb. Konstruiere die <strong>beiden Tangenten</strong> von P an k. " +
      "Denke daran: Im Berührpunkt T steht die Tangente senkrecht auf dem Radius MT — gesucht sind also Punkte mit ∡MTP = 90°.",
    schritte: [
      "Mittelsenkrechte von <strong>MP</strong> konstruieren; sie liefert die Mitte <strong>Z</strong> der Strecke MP.",
      "Thaleskreis um Z durch M und P zeichnen. Auf ihm liegen genau die Punkte, die MP unter 90° sehen.",
      "Wo dieser Kreis den gegebenen Kreis k schneidet, liegen die Berührpunkte <strong>T₁</strong> und <strong>T₂</strong>.",
      "Die Geraden durch P und T₁ sowie durch P und T₂ ziehen — das sind die Tangenten.",
    ],
    vorgabe: () => ({ M, r, P, Z, d, T1: T[0], T2: T[1] }),
    zeichne(layer, g) {
      GS.drawCircle(layer, g.M, g.r, "th-gegeben-kreis");
      GS.drawPoint(layer, g.M, "M");
      GS.drawPoint(layer, g.P, "P");
      layer.appendChild(beschriftung(g.M.x, g.M.y - g.r - 10, "k"));
    },
    analyse(tool, g) {
      const t = thalesTeil(tool, g.M, g.P);
      const marks = [];
      const spentCircles = new Set();
      if (t.ms) {
        t.ms.circles.forEach((c) => spentCircles.add(c));
        t.ms.points.forEach((p) => markiere(marks, p, true));
      } else {
        pairPoints(tool, g.M, g.P).forEach((p) => markiere(marks, p, false));
      }
      if (t.M) markiere(marks, t.M, !!t.kreis);
      const t1 = geradeDurch(tool, g.P, g.T1), t2 = geradeDurch(tool, g.P, g.T2);
      if (t.kreis) {
        markiere(marks, g.T1, !!t1);
        markiere(marks, g.T2, !!t2);
      }
      const snap = [g.M, g.P];
      if (t.M) snap.push(t.M);
      if (t.kreis) snap.push(g.T1, g.T2);
      return { t, t1, t2, marks, spentCircles, snapPoints: snap };
    },
    pruefe(a) {
      const msg = thalesMeldung(a.t, "MP");
      if (msg) return { ok: false, msg };
      if (!a.t1 && !a.t2)
        return {
          ok: false,
          msg:
            "Der Thaleskreis über MP steht. Er schneidet den gegebenen Kreis in zwei Punkten — das sind die Berührpunkte T₁ und T₂. " +
            "Ziehe jetzt die Geraden von P aus durch diese beiden Punkte.",
        };
      if (!a.t1 || !a.t2)
        return { ok: false, msg: "Eine Tangente steht schon. Es gibt aber „zwei“ Berührpunkte — der Thaleskreis schneidet den Kreis k oberhalb und unterhalb von MP." };
      return {
        ok: true,
        msg:
          "Richtig konstruiert! T₁ und T₂ liegen auf beiden Kreisen zugleich: auf k, also sind MT₁ und MT₂ Radien — und auf dem Thaleskreis über MP, " +
          "also ist ∡MT₁P = ∡MT₂P = 90°. Eine Gerade, die auf einem Radius senkrecht steht und ihn im Kreispunkt trifft, berührt den Kreis. " +
          "Beide Tangentenabschnitte sind übrigens gleich lang: PT = √(d² − r²).",
      };
    },
  };
})();

// Aufgabe 4 — Dreieck aus den beiden Hypotenusenabschnitten p und q.
// Hier zeigt sich der Höhensatz als Konstruktion: Das Lot im Punkt H trifft den Thaleskreis
// genau in der Höhe h = √(p · q).
const K4 = (() => {
  const A = GC.pt(150, 250), H = GC.pt(270, 250), B = GC.pt(450, 250);   // q = 120, p = 180
  const M = GC.mid(A, B), r = GC.dist(A, B) / 2;
  const h = Math.sqrt(GC.dist(A, H) * GC.dist(H, B));
  const C = GC.pt(H.x, H.y - h);
  return {
    id: "k4",
    kurz: "4. p und q",
    titel: "Aufgabe 4 — rechtwinkliges Dreieck aus p und q",
    stufe: "schwierig",
    aufgabe:
      "Auf der Geraden sind die beiden <strong>Hypotenusenabschnitte</strong> abgetragen: q = AH und p = HB. Der Punkt <strong>H</strong> ist also der Fußpunkt der Höhe. " +
      "Konstruiere das rechtwinklige Dreieck ABC mit γ = 90°.",
    schritte: [
      "Thaleskreis über der ganzen Strecke <strong>AB</strong> konstruieren (Mittelsenkrechte → M, dann Kreis um M durch A).",
      "In <strong>H</strong> das <strong>Lot</strong> auf AB errichten: zwei gleich große Kreise um zwei Punkte links und rechts von H schlagen und ihre Schnittpunkte verbinden.",
      "Wo das Lot den Thaleskreis trifft, liegt <strong>C</strong>.",
      "Die Geraden durch A und C sowie durch B und C ziehen.",
    ],
    vorgabe: () => ({ A, H, B, M, r, C, h }),
    zeichne(layer, g) {
      GS.drawSegment(layer, g.A, g.B);
      GS.drawPoint(layer, g.A, "A");
      GS.drawPoint(layer, g.H, "H");
      GS.drawPoint(layer, g.B, "B");
      layer.appendChild(beschriftung((g.A.x + g.H.x) / 2, g.A.y + 26, "q"));
      layer.appendChild(beschriftung((g.H.x + g.B.x) / 2, g.A.y + 26, "p"));
    },
    analyse(tool, g) {
      const t = thalesTeil(tool, g.A, g.B);
      const marks = [];
      const spentCircles = new Set();
      if (t.ms) {
        t.ms.circles.forEach((c) => spentCircles.add(c));
        t.ms.points.forEach((p) => markiere(marks, p, true));
      } else {
        pairPoints(tool, g.A, g.B).forEach((p) => markiere(marks, p, false));
      }
      if (t.M) markiere(marks, t.M, !!t.kreis);
      // Das Lot in H ist dieselbe Gerade wie AC verlängert — geprüft wird es über H und C.
      const lot = geradeDurch(tool, g.H, g.C);
      const seiten = { AC: geradeDurch(tool, g.A, g.C), BC: geradeDurch(tool, g.B, g.C) };
      if (t.kreis && lot) markiere(marks, g.C, !!(seiten.AC && seiten.BC));
      const snap = [g.A, g.H, g.B];
      if (t.M) snap.push(t.M);
      if (t.kreis && lot) snap.push(g.C);
      if (!lot) lotHilfspunkte(tool, g.H, g.A, g.B, marks, snap);
      return { t, lot, seiten, marks, spentCircles, snapPoints: snap };
    },
    pruefe(a) {
      const msg = thalesMeldung(a.t, "AB");
      if (msg) return { ok: false, msg };
      if (!a.lot)
        return {
          ok: false,
          msg:
            "Es fehlt das „Lot in H“. Schlage dafür zwei gleich große Kreise um zwei Punkte der Geraden links und rechts von H " +
            "und verbinde ihre Schnittpunkte — die Verbindung steht senkrecht auf AB und geht durch H. Wo sie den Thaleskreis trifft, liegt C.",
        };
      if (!a.seiten.AC || !a.seiten.BC)
        return { ok: false, msg: "C steht — jetzt fehlen noch die beiden Katheten: die Geraden durch A und C sowie durch B und C." };
      return {
        ok: true,
        msg:
          "Richtig konstruiert! Der rechte Winkel bei C kommt vom Thaleskreis, die Lage von C vom Lot in H. " +
          "Nebenbei hast du den „Höhensatz“ gezeichnet: Die Höhe CH ist genau h = √(p · q) lang — das geometrische Mittel " +
          "der beiden Abschnitte. Miss nach: CH muss zwischen q und p liegen, hier also zwischen dem kürzeren und dem längeren Abschnitt.",
      };
    },
  };
})();

// Aufgabe 5 — Dreieck aus Hypotenuse und Höhe. Die Höhe steht schon senkrecht in A: Das
// Abtragen einer Länge auf ein selbst errichtetes Lot wäre eine Konstruktion für sich und
// lenkt vom Kern ab. Der bleibt anspruchsvoll genug — die PARALLELE im Abstand h muss
// konstruiert werden, und sie trifft den Thaleskreis zweimal.
const K5 = (() => {
  const A = GC.pt(160, 250), B = GC.pt(440, 250);        // c = 280
  const M = GC.mid(A, B), r = 140;
  const h = 100;
  const P = GC.pt(A.x, A.y - h);                          // die Höhe, in A senkrecht angetragen
  const dx = Math.sqrt(r * r - h * h);
  const C1 = GC.pt(M.x - dx, M.y - h), C2 = GC.pt(M.x + dx, M.y - h);
  return {
    id: "k5",
    kurz: "5. c und h",
    titel: "Aufgabe 5 — rechtwinkliges Dreieck aus c und h_c",
    stufe: "schwierig",
    aufgabe:
      "Gegeben sind die <strong>Hypotenuse c = AB</strong> und die <strong>Höhe h<sub>c</sub></strong> — sie ist in A bereits senkrecht auf AB angetragen und endet im Punkt <strong>P</strong>. " +
      "Konstruiere ein rechtwinkliges Dreieck ABC mit γ = 90°, dessen Höhe auf AB genau h<sub>c</sub> lang ist.",
    schritte: [
      "Thaleskreis über AB konstruieren — auf ihm liegen alle Punkte mit einem rechten Winkel über AB.",
      "In <strong>P</strong> das <strong>Lot auf AP</strong> errichten: Kreis um P zeichnen, der die Gerade AP zweimal schneidet, dann die Mittelsenkrechte dieser beiden Punkte. Das Ergebnis ist die <strong>Parallele zu AB im Abstand h<sub>c</sub></strong>.",
      "Jeder Punkt dieser Parallelen hat von AB den Abstand h<sub>c</sub>. Wo sie den Thaleskreis trifft, liegt <strong>C</strong>.",
      "Die Geraden durch A und C sowie durch B und C ziehen. Es gibt <strong>zwei</strong> Schnittpunkte — beide Dreiecke sind richtig.",
    ],
    vorgabe: () => ({ A, B, M, r, h, P, C1, C2 }),
    zeichne(layer, g) {
      GS.drawSegment(layer, g.A, g.B);
      GS.drawSegment(layer, g.A, g.P, "th-mass");
      GS.drawPoint(layer, g.A, "A");
      GS.drawPoint(layer, g.B, "B");
      GS.drawPoint(layer, g.P, "P");
      GS.drawRightAngleMarker(layer, g.A, g.B, g.P, "thf-rechter");
      layer.appendChild(beschriftung(g.A.x - 16, (g.A.y + g.P.y) / 2 + 5, "h"));
    },
    analyse(tool, g) {
      const t = thalesTeil(tool, g.A, g.B);
      const marks = [];
      const spentCircles = new Set();
      if (t.ms) {
        t.ms.circles.forEach((c) => spentCircles.add(c));
        t.ms.points.forEach((p) => markiere(marks, p, true));
      } else {
        pairPoints(tool, g.A, g.B).forEach((p) => markiere(marks, p, false));
      }
      if (t.M) markiere(marks, t.M, !!t.kreis);
      const par = paralleleZu(tool, g.A, g.B, g.h);
      // Welcher der beiden möglichen Punkte C benutzt wurde, entscheidet die gezeichnete Figur.
      const kandidaten = [g.C1, g.C2].map((C) => ({ C, AC: geradeDurch(tool, g.A, C), BC: geradeDurch(tool, g.B, C) }));
      const fertig = kandidaten.find((k) => k.AC && k.BC) || null;
      const halb = kandidaten.find((k) => k.AC || k.BC) || null;
      if (t.kreis && par) [g.C1, g.C2].forEach((C) => markiere(marks, C, !!(fertig && GC.dist(fertig.C, C) < 2)));
      const snap = [g.A, g.B, g.P];
      if (t.M) snap.push(t.M);
      if (t.kreis && par) snap.push(g.C1, g.C2);
      if (!par) lotHilfspunkte(tool, g.P, g.A, g.P, marks, snap);
      return { t, par, fertig, halb, marks, spentCircles, snapPoints: snap };
    },
    pruefe(a) {
      const msg = thalesMeldung(a.t, "AB");
      if (msg) return { ok: false, msg };
      if (!a.par)
        return {
          ok: false,
          msg:
            "Es fehlt die „Parallele zu AB im Abstand h_c“. Errichte dafür in P das Lot auf die Strecke AP: " +
            "ein Kreis um P schneidet die Gerade AP in zwei Punkten, deren Mittelsenkrechte durch P geht und auf AP senkrecht steht. " +
            "Weil AP selbst auf AB senkrecht steht, ist dieses Lot die gesuchte Parallele.",
        };
      if (!a.fertig)
        return {
          ok: false,
          msg: a.halb
            ? "Eine Kathete steht schon. Es fehlt die zweite — beide Seiten müssen zu „demselben“ Schnittpunkt C führen."
            : "Die Parallele schneidet den Thaleskreis in zwei Punkten; wähle einen davon als C und ziehe die Geraden durch A und C sowie durch B und C.",
        };
      return {
        ok: true,
        msg:
          "Richtig konstruiert! C liegt auf dem Thaleskreis (das gibt den rechten Winkel) und zugleich auf der Parallelen im Abstand h_c (das gibt die geforderte Höhe). " +
          "Die zweite Lösung auf der anderen Seite der Mittelsenkrechten ist das gespiegelte Dreieck — beide sind gleich gut. " +
          "Und: Wäre h_c größer als der Radius c : 2, verliefe die Parallele ganz oberhalb des Kreises — dann gäbe es gar keine Lösung. " +
          "Die größte mögliche Höhe ist genau c : 2.",
      };
    },
  };
})();

// Aufgabe 6 — Dreieck aus c und b, dazu die Höhe. Die Brücke zur Satzgruppe des Pythagoras:
// Die Höhe zerlegt das Thales-Dreieck in zwei zum Ganzen ähnliche Teildreiecke.
const K6 = (() => {
  const A = GC.pt(170, 270), B = GC.pt(430, 270);        // c = 260
  const M = GC.mid(A, B), r = 130;
  const bLang = 156;                                      // 156, 208, 260 = 52 · (3, 4, 5)
  const C = schnittOben(M, r, A, bLang)[0];
  const H = GC.pt(C.x, A.y);
  const massA = GC.pt(70, 80), massB = GC.pt(70 + bLang, 80);
  return {
    id: "k6",
    kurz: "6. Höhe im Dreieck",
    titel: "Aufgabe 6 — Dreieck aus c und b, dazu die Höhe auf die Hypotenuse",
    stufe: "komplex",
    aufgabe:
      "Gegeben sind die <strong>Hypotenuse c = AB</strong> und die Kathete <strong>b = AC</strong> (die Strecke oben links). " +
      "Konstruiere zuerst das Dreieck und danach die <strong>Höhe von C auf AB</strong>. Sie zerlegt das Dreieck in zwei Teildreiecke, die zum ganzen ähnlich sind.",
    schritte: [
      "Thaleskreis über AB konstruieren.",
      "Zirkel auf b stellen, in <strong>A</strong> einstechen, Kreis zeichnen — er schneidet den Thaleskreis in <strong>C</strong>.",
      "Die Geraden durch A und C sowie durch B und C ziehen.",
      "Von C aus das <strong>Lot auf AB</strong> fällen: Kreis um C, der AB zweimal schneidet, dann die Mittelsenkrechte dieser beiden Schnittpunkte.",
    ],
    vorgabe: () => ({ A, B, M, r, bLang, C, H, massA, massB }),
    zeichne(layer, g) {
      GS.drawSegment(layer, g.A, g.B);
      GS.drawPoint(layer, g.A, "A");
      GS.drawPoint(layer, g.B, "B");
      GS.drawSegment(layer, g.massA, g.massB, "th-mass");
      layer.appendChild(beschriftung((g.massA.x + g.massB.x) / 2, g.massA.y - 12, "b"));
    },
    analyse(tool, g) {
      const t = thalesTeil(tool, g.A, g.B);
      const marks = [];
      const spentCircles = new Set();
      if (t.ms) {
        t.ms.circles.forEach((c) => spentCircles.add(c));
        t.ms.points.forEach((p) => markiere(marks, p, true));
      } else {
        pairPoints(tool, g.A, g.B).forEach((p) => markiere(marks, p, false));
      }
      if (t.M) markiere(marks, t.M, !!t.kreis);
      const kB = kreisUm(tool, g.A, g.bLang);
      const seiten = { AC: geradeDurch(tool, g.A, g.C), BC: geradeDurch(tool, g.B, g.C) };
      const hoehe = geradeDurch(tool, g.C, g.H);
      if (t.kreis && kB.kreis) markiere(marks, g.C, !!(seiten.AC && seiten.BC));
      if (hoehe) markiere(marks, g.H, true);
      const snap = [g.A, g.B];
      if (t.M) snap.push(t.M);
      if (t.kreis && kB.kreis) snap.push(g.C);
      if (seiten.AC && seiten.BC) snap.push(g.H);
      if (t.kreis && kB.kreis && !hoehe) lotHilfspunkte(tool, g.C, g.A, g.B, marks, snap);
      return { t, kB, seiten, hoehe, marks, spentCircles, snapPoints: snap };
    },
    pruefe(a) {
      const msg = thalesMeldung(a.t, "AB");
      if (msg) return { ok: false, msg };
      if (!a.kB.kreis)
        return {
          ok: false,
          msg:
            "Es fehlt der Kreis um „A“ mit dem Radius b. Stelle den Zirkel genau auf die vorgegebene Strecke b ein (oben links), " +
            "steche in A ein und zeichne den Kreis — er schneidet den Thaleskreis im gesuchten Punkt C.",
        };
      if (!a.seiten.AC || !a.seiten.BC)
        return { ok: false, msg: "C steht — jetzt fehlen die Dreiecksseiten: die Geraden durch A und C sowie durch B und C." };
      if (!a.hoehe)
        return {
          ok: false,
          msg:
            "Das Dreieck steht. Es fehlt noch die „Höhe von C auf AB“: Zeichne einen Kreis um C, der die Gerade AB in zwei Punkten schneidet, " +
            "und konstruiere die Mittelsenkrechte dieser beiden Punkte — sie geht durch C und steht senkrecht auf AB.",
        };
      return {
        ok: true,
        msg:
          "Richtig konstruiert! Die Höhe teilt die Hypotenuse in die Abschnitte p und q. Weil alle drei Dreiecke denselben Winkelsatz erfüllen, " +
          "sind sie zueinander ähnlich — daraus folgen der Höhensatz h² = p · q und der Kathetensatz b² = c · q. " +
          "Miss nach: Mit b : c = 3 : 5 muss q genau 3 : 5 von b sein.",
      };
    },
  };
})();

export const KONSTRUKTIONS_AUFGABEN = [K1, K2, K3, K4, K5, K6];

// Eine Beschriftung an der Zeichnung (Maßstrecken, Kreisname).
function beschriftung(x, y, text) {
  const t = GS.svgEl("text", { x: Number(x).toFixed(1), y: Number(y).toFixed(1), "text-anchor": "middle", class: "th-mass-name" });
  t.textContent = text;
  return t;
}

/**
 * Baut die Werkbank für die sechs Konstruktionsaufgaben: Aufgabenumschalter, Zeichenfläche,
 * Werkzeugleiste und Anleitung. Zurück kommt ein Handgriff zum Umschalten (für die Prüfung).
 */
export function mountKonstruktionsAufgaben(root) {
  const tabs = el("div", { class: "geo-mode-tabs", id: "ka-tabs" });
  const titelEl = el("h3", { class: "th-aufgabe-titel" });
  const promptEl = el("div", { class: "aufgabe-prompt" });

  const svg = GS.svgEl("svg", { viewBox: `0 0 ${K_W} ${K_H}`, class: "geo-svg", id: "ka-svg" });
  const layerFigure = GS.svgEl("g", {});
  const layerUser = GS.svgEl("g", {});
  svg.appendChild(layerFigure);
  svg.appendChild(layerUser);
  const wrap = el("div", { class: "geo-canvas-wrap" });
  wrap.appendChild(svg);

  const btnZoom = el("button", { type: "button", class: "geo-btn geo-zoom-btn", id: "ka-zoom" }, "⛶ Zeichenfläche vergrößern");
  const btnToolCircle = el("button", { type: "button", class: "geo-btn", id: "ka-circle" }, "◯ Zirkel");
  const btnToolLine = el("button", { type: "button", class: "geo-btn", id: "ka-line" }, "／ Lineal");
  const btnUndo = el("button", { type: "button", class: "geo-btn", id: "ka-undo" }, "↩ Rückgängig");
  const btnClear = el("button", { type: "button", class: "geo-btn", id: "ka-clear" }, "🗑 Zurücksetzen");
  const btnCheck = el("button", { type: "button", class: "geo-btn geo-btn-primary", id: "ka-check" }, "✓ Prüfen");
  const btnHint = el("button", { type: "button", class: "geo-btn", id: "ka-hint" }, "💡 Tipp");
  const chkLockRadius = el("input", { type: "checkbox", id: "ka-lock" });
  const btnResetRadius = el("button", { type: "button", class: "geo-btn geo-btn-small", id: "ka-reset-radius", hidden: "" }, "🔄 Radius neu einstellen");
  const pendingStatus = el("p", { class: "geo-pending-status", id: "ka-pending", hidden: "" });
  const radiusStatus = el("p", { class: "geo-radius-status", id: "ka-radius", hidden: "" });
  const feedbackBox = el("div", { class: "geo-feedback", id: "ka-feedback", hidden: "" });

  const instructionBox = el("div", { class: "geo-instruction-box", id: "ka-instruction" });
  const stepsList = el("ol", { class: "geo-steps", id: "ka-steps" });

  const canvasCol = el("div", { class: "geo-canvas-col" }, [
    wrap,
    el("div", { class: "geo-zoom-row" }, btnZoom),
    el("div", { class: "geo-toolbar" }, [btnToolCircle, btnToolLine, btnUndo, btnClear, btnCheck, btnHint]),
    el("div", { class: "geo-toggle-row" }, [
      el("label", { title: "Wie beim echten Zirkel: einmal eingestellt, bleibt der Radius gleich — du klickst dann nur noch den Einstichpunkt an." }, [
        chkLockRadius,
        " 🔒 Zirkel-Radius beibehalten (nicht verstellen)",
      ]),
      btnResetRadius,
    ]),
    pendingStatus,
    radiusStatus,
    feedbackBox,
    el("div", { class: "geo-legend" }, [
      el("span", { class: "geo-legend-item" }, [el("span", { class: "geo-legend-swatch", style: "border-color:var(--text)" }), "Vorgabe"]),
      el("span", { class: "geo-legend-item" }, [el("span", { class: "geo-legend-swatch", style: "border-color:#e08a1e" }), "deine Konstruktion"]),
    ]),
  ]);

  const layout = el("div", { class: "geo-layout" }, [canvasCol, el("div", { class: "geo-side-col" }, [instructionBox, stepsList])]);

  root.appendChild(tabs);
  root.appendChild(el("div", { class: "th-konstruktion" }, [titelEl, promptEl, layout]));

  let aktuell = KONSTRUKTIONS_AUFGABEN[0];
  let vorgabe = aktuell.vorgabe();

  function analyse() {
    return aktuell.analyse(free.tool, vorgabe);
  }

  const free = setupFreeConstruction({
    svg,
    layer: layerUser,
    els: { btnToolCircle, btnToolLine, btnUndo, btnClear, btnCheck, btnHint, chkLockRadius, btnResetRadius, pendingStatus, radiusStatus, feedbackBox },
    model: () => {
      const a = analyse();
      return { snapPoints: a.snapPoints, marks: a.marks, spentCircles: a.spentCircles, autoMarks: false };
    },
    check: () => aktuell.pruefe(analyse()),
  });

  function zeige(aufgabe) {
    aktuell = aufgabe;
    vorgabe = aufgabe.vorgabe();
    [...tabs.children].forEach((b) => b.classList.toggle("geo-mode-tab-active", b.dataset.id === aufgabe.id));
    titelEl.innerHTML = `${aufgabe.titel} <span class="schwierigkeit-badge ${aufgabe.stufe}">${aufgabe.stufe}</span>`;
    promptEl.innerHTML = aufgabe.aufgabe;
    instructionBox.innerHTML = `<p>Konstruiere mit <strong>Zirkel</strong> und <strong>Lineal</strong>. „Prüfen“ sagt dir, was noch fehlt, „Tipp“ dasselbe im freundlicheren Ton.</p>`;
    stepsList.innerHTML = aufgabe.schritte.map((s) => `<li>${s}</li>`).join("");
    GS.clearEl(layerFigure);
    aufgabe.zeichne(layerFigure, vorgabe);
    free.reset();
  }

  KONSTRUKTIONS_AUFGABEN.forEach((a) => {
    const btn = el("button", { type: "button", class: "geo-mode-tab" }, a.kurz);
    btn.dataset.id = a.id;
    btn.addEventListener("click", () => zeige(a));
    tabs.appendChild(btn);
  });

  setupCanvasZoom(root.closest(".card") || root, btnZoom);
  zeige(KONSTRUKTIONS_AUFGABEN[0]);
  return { zeige };
}

// ================= Block 2: Rechnen auf der Seite =================

// ---------- Aufgabe R1: alle Winkel im Halbkreis (sechs Vorgaben) ----------
//
// Die ganze Figur hängt an einem einzigen Winkel: Steht α fest, so ist
//   γ₁ = α          (Dreieck AMC ist gleichschenklig, MA = MC = r)
//   β  = γ₂ = 90 − α (Dreieck BMC ist gleichschenklig, und α + β = 90)
//   δ₁ = 180 − 2α    (Winkelsumme in AMC)
//   δ₂ = 2α          (Nebenwinkel zu δ₁)
// Jede der sechs Vorgaben legt α fest — deshalb wird die Zeichnung für jede Vorgabe neu
// gerechnet und zeigt wirklich die Winkel, die in der Aufgabe stehen.
function winkelSatz(alpha) {
  return { alpha, beta: 90 - alpha, g1: alpha, g2: 90 - alpha, d1: 180 - 2 * alpha, d2: 2 * alpha };
}

const R1_VARIANTEN = [
  {
    key: "a",
    gegeben: "α = 25°",
    alpha: 25,
    zeigt: "alpha",
    weg: "Das Dreieck AMC ist gleichschenklig (MA = MC = r), also ist γ₁ = α = 25°. Die Winkelsumme in AMC liefert δ₁ = 180° − 2 · 25° = 130°, und δ₂ ist sein Nebenwinkel: 50°. Im gleichschenkligen Dreieck BMC folgt daraus β = γ₂ = (180° − 50°) : 2 = 65°.",
  },
  {
    key: "b",
    gegeben: "γ₁ = 55°",
    alpha: 55,
    zeigt: "g1",
    weg: "γ₁ und α sind die Basiswinkel desselben gleichschenkligen Dreiecks AMC, also ist α = γ₁ = 55°. Damit ist δ₁ = 180° − 110° = 70°, δ₂ = 110° und β = γ₂ = (180° − 110°) : 2 = 35°.",
  },
  {
    key: "c",
    gegeben: "α = β",
    alpha: 45,
    zeigt: null,
    weg: "α und β sind die beiden spitzen Winkel des rechtwinkligen Dreiecks, zusammen also 90°. Sind sie gleich groß, ist jeder 45°. Dann ist auch γ₁ = γ₂ = 45°, und δ₁ = δ₂ = 90°: C liegt genau über M, der höchste Punkt des Halbkreises.",
  },
  {
    key: "d",
    gegeben: "δ₁ = 110°",
    alpha: 35,
    zeigt: "d1",
    weg: "Im gleichschenkligen Dreieck AMC ist δ₁ der Winkel an der Spitze, also α = γ₁ = (180° − 110°) : 2 = 35°. Der Nebenwinkel δ₂ misst 70°, und β = γ₂ = (180° − 70°) : 2 = 55°.",
  },
  {
    key: "e",
    gegeben: "α = 2 · β",
    alpha: 60,
    zeigt: null,
    weg: "Es gilt α + β = 90° und α = 2β, also 3β = 90° und damit β = 30°, α = 60°. Daraus folgen γ₁ = 60°, γ₂ = 30°, δ₁ = 60° und δ₂ = 120°.",
  },
  {
    key: "f",
    gegeben: "γ₁ = γ₂",
    alpha: 45,
    zeigt: null,
    weg: "γ₁ + γ₂ ist der rechte Winkel bei C, zusammen also 90°. Sind beide gleich, ist jeder 45° — und damit α = 45° und β = 45°. Das ist dieselbe Figur wie bei c): Zwei verschiedene Angaben können dasselbe Dreieck beschreiben.",
  },
];

const R1_FELDER = [
  { schluessel: "alpha", name: "α (bei A)" },
  { schluessel: "beta", name: "β (bei B)" },
  { schluessel: "g1", name: "γ₁ (zwischen CA und CM)" },
  { schluessel: "g2", name: "γ₂ (zwischen CM und CB)" },
  { schluessel: "d1", name: "δ₁ (bei M, zu A hin)" },
  { schluessel: "d2", name: "δ₂ (bei M, zu B hin)" },
];

// Zeichnet die Halbkreisfigur. Jeder Winkel bekommt eine Marke, die entweder seinen Wert zeigt
// (gegeben) oder die Nummer des Eingabefelds.
// Ein Winkelbogen mit Beschriftung. Die Marke zeigt entweder den gegebenen Wert oder die Nummer
// des Eingabefelds; im zweiten Fall trägt sie data-feld, damit das Prüfen den Wert nachtragen kann.
function winkelMarke(svg, V, P, Q, radius, marke, textAbstand = 15) {
  const a1 = Math.atan2(P.y - V.y, P.x - V.x), a2 = Math.atan2(Q.y - V.y, Q.x - V.x);
  let d = a2 - a1;
  while (d <= -Math.PI) d += 2 * Math.PI;
  while (d > Math.PI) d -= 2 * Math.PI;
  const p1 = { x: V.x + radius * Math.cos(a1), y: V.y + radius * Math.sin(a1) };
  const p2 = { x: V.x + radius * Math.cos(a2), y: V.y + radius * Math.sin(a2) };
  svg.appendChild(
    GS.svgEl("path", {
      d: `M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} A ${radius} ${radius} 0 0 ${d > 0 ? 1 : 0} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`,
      class: "thf-bogen",
    }),
  );
  const am = a1 + d / 2;
  const t = GS.svgEl("text", {
    x: (V.x + (radius + textAbstand) * Math.cos(am)).toFixed(1),
    y: (V.y + (radius + textAbstand) * Math.sin(am) + 4).toFixed(1),
    "text-anchor": "middle",
    class: "thf-marke" + (marke.frei ? " thf-luecke" : ""),
  });
  if (marke.frei) t.setAttribute("data-feld", marke.nr);
  t.textContent = marke.text;
  svg.appendChild(t);
}

// Punkt samt Namen an einer Figur.
function figurPunkt(svg, P, name, dx, dy) {
  svg.appendChild(GS.svgEl("circle", { cx: P.x.toFixed(1), cy: P.y.toFixed(1), r: 3.4, class: "thf-punkt" }));
  const t = GS.svgEl("text", { x: (P.x + dx).toFixed(1), y: (P.y + dy).toFixed(1), "text-anchor": "middle", class: "thf-punktname" });
  t.textContent = name;
  svg.appendChild(t);
}

function zeichneR1(alpha, marken) {
  const W = 400, H = 252;
  const M = { x: W / 2, y: 196 }, r = 155;
  const A = { x: M.x - r, y: M.y }, B = { x: M.x + r, y: M.y };
  const C = { x: M.x + r * Math.cos(2 * alpha * GRAD), y: M.y - r * Math.sin(2 * alpha * GRAD) };
  const svg = GS.svgEl("svg", { viewBox: `0 0 ${W} ${H}`, class: "th-figur", role: "img" });
  const linie = (a, b, cls) => svg.appendChild(GS.svgEl("line", { x1: a.x.toFixed(1), y1: a.y.toFixed(1), x2: b.x.toFixed(1), y2: b.y.toFixed(1), class: cls }));

  svg.appendChild(GS.svgEl("path", { d: `M ${A.x} ${A.y} A ${r} ${r} 0 0 1 ${B.x} ${B.y}`, class: "thf-kreis" }));
  linie(A, B, "thf-durchmesser");
  linie(A, C, "thf-seite");
  linie(B, C, "thf-seite");
  linie(M, C, "thf-radius");

  winkelMarke(svg, A, B, C, 32, marken.alpha);
  winkelMarke(svg, B, C, A, 32, marken.beta);
  winkelMarke(svg, C, A, M, 26, marken.g1);
  winkelMarke(svg, C, M, B, 26, marken.g2);
  winkelMarke(svg, M, A, C, 30, marken.d1);
  winkelMarke(svg, M, C, B, 30, marken.d2);

  figurPunkt(svg, A, "A", -12, 20);
  figurPunkt(svg, B, "B", 12, 20);
  figurPunkt(svg, C, "C", 0, -12);
  figurPunkt(svg, M, "M", 0, 22);
  return svg;
}

function mountR1(container) {
  const box = el("div", { class: "aufgabe-box" });
  box.appendChild(
    el("h3", {}, [
      "Aufgabe 1 — alle fehlenden Winkelgrößen",
      el("span", { class: "schwierigkeit-badge mittel" }, "mittel"),
    ]),
  );
  box.appendChild(
    el("p", {
      html:
        "Der Punkt C liegt auf dem Halbkreis über AB, und <strong>MC</strong> ist eingezeichnet. Ermittle <strong>alle</strong> fehlenden Winkelgrößen. " +
        "Wähle eine der sechs Vorgaben — die Zeichnung passt sich jeweils an.",
    }),
  );

  const tabs = el("div", { class: "geo-mode-tabs th-varianten" });
  const figurEl = el("div", { class: "th-figur-wrap" });
  const liste = el("ol", { class: "th-luecken-liste" });
  const btnRow = el("div", { class: "btn-row" });
  const btnPruefen = el("button", { type: "button", class: "btn btn-primary" }, "Prüfen");
  const btnLeeren = el("button", { type: "button", class: "btn" }, "↩ Felder leeren");
  btnRow.appendChild(btnPruefen);
  btnRow.appendChild(btnLeeren);
  const feedback = el("div", { class: "aufgabe-feedback" });
  box.appendChild(tabs);
  box.appendChild(figurEl);
  box.appendChild(liste);
  box.appendChild(btnRow);
  box.appendChild(feedback);

  let variante = R1_VARIANTEN[0];
  let felder = [];

  function zeige(v) {
    variante = v;
    [...tabs.children].forEach((b) => b.classList.toggle("geo-mode-tab-active", b.dataset.key === v.key));
    const w = winkelSatz(v.alpha);
    felder = R1_FELDER.filter((f) => f.schluessel !== v.zeigt).map((f, i) => ({
      ...f,
      nr: i + 1,
      soll: w[f.schluessel],
      input: el("input", { type: "text", inputmode: "decimal", placeholder: "in Grad" }),
    }));

    const marken = {};
    R1_FELDER.forEach((f) => {
      const feld = felder.find((x) => x.schluessel === f.schluessel);
      marken[f.schluessel] = feld
        ? { frei: true, nr: feld.nr, text: ziffer(feld.nr) }
        : { frei: false, text: num(w[f.schluessel], 0) + "°" };
    });

    figurEl.innerHTML = "";
    figurEl.appendChild(zeichneR1(v.alpha, marken));
    figurEl.appendChild(el("p", { class: "th-figur-unterschrift" }, `${v.key}) Gegeben: ${v.gegeben}`));
    liste.innerHTML = "";
    felder.forEach((f) => liste.appendChild(el("li", {}, [ziffer(f.nr) + " " + f.name + ": ", f.input])));
    feedback.innerHTML = "";
  }

  function pruefe() {
    let alleOk = true;
    felder.forEach((f) => {
      const val = zahlAus(f.input.value);
      const ok = Math.abs(val - f.soll) < 0.5;
      if (!ok) alleOk = false;
      f.input.classList.toggle("th-feld-ok", ok);
      f.input.classList.toggle("th-feld-fehler", !ok);
      const marke = figurEl.querySelector(`[data-feld="${f.nr}"]`);
      if (marke) {
        marke.textContent = num(f.soll, 0) + "°";
        marke.classList.remove("thf-luecke");
        marke.classList.add(ok ? "thf-richtig" : "thf-falsch");
      }
    });
    feedback.innerHTML =
      (alleOk
        ? `<div class="status ok">✓ Alles richtig!</div>`
        : `<div class="status err">✗ Noch nicht alles richtig — die zutreffenden Werte stehen jetzt in der Zeichnung.</div>`) +
      `<div class="musterloesung"><span class="ml-label">Rechenweg</span>Gegeben: <strong>${variante.gegeben}</strong>. ${variante.weg}` +
      `<br><em>Probe:</em> γ₁ + γ₂ = 90° — der Satz des Thales, und α + β = 90° ebenso.</div>`;
  }

  R1_VARIANTEN.forEach((v) => {
    const btn = el("button", { type: "button", class: "geo-mode-tab" }, `${v.key}) ${v.gegeben}`);
    btn.dataset.key = v.key;
    btn.addEventListener("click", () => zeige(v));
    tabs.appendChild(btn);
  });
  btnPruefen.addEventListener("click", pruefe);
  btnLeeren.addEventListener("click", () => zeige(variante));

  zeige(R1_VARIANTEN[0]);
  container.appendChild(box);
  return { zeige, pruefe, felderVon: () => felder };
}

// ---------- Aufgabe R2: Mittelpunktswinkel und Umfangswinkel ----------
//
// C, M und B liegen auf einer Geraden — CB ist also ein Durchmesser. Damit gilt bei A der Satz
// des Thales, und der Mittelpunktswinkel ∡AMB ist zugleich der Außenwinkel des gleichschenkligen
// Dreiecks AMC: Er ist doppelt so groß wie der Umfangswinkel β über derselben Sehne AB.
const R2_MITTE = 50;

function zeichneR2(marken) {
  const W = 400, H = 330;
  const M = { x: 190, y: 170 }, r = 118;
  const auf = (grad) => ({ x: M.x + r * Math.cos(grad * GRAD), y: M.y - r * Math.sin(grad * GRAD) });
  const A = auf(-90), B = auf(-90 + R2_MITTE), C = auf(-90 + R2_MITTE + 180);
  const svg = GS.svgEl("svg", { viewBox: `0 0 ${W} ${H}`, class: "th-figur", role: "img" });
  const linie = (a, b, cls) => svg.appendChild(GS.svgEl("line", { x1: a.x.toFixed(1), y1: a.y.toFixed(1), x2: b.x.toFixed(1), y2: b.y.toFixed(1), class: cls }));

  svg.appendChild(GS.svgEl("circle", { cx: M.x, cy: M.y, r, class: "thf-kreis" }));
  linie(C, B, "thf-durchmesser");
  linie(C, A, "thf-seite");
  linie(A, B, "thf-seite");
  linie(A, M, "thf-radius");

  winkelMarke(svg, M, A, B, 30, marken.mitte);
  winkelMarke(svg, C, A, B, 34, marken.beta);
  winkelMarke(svg, B, A, C, 30, marken.gamma);
  winkelMarke(svg, A, C, B, 24, marken.rechter);
  winkelMarke(svg, M, C, A, 20, marken.amc, 18);

  figurPunkt(svg, A, "A", -15, 8);
  figurPunkt(svg, B, "B", 15, 12);
  figurPunkt(svg, C, "C", -2, -12);
  figurPunkt(svg, M, "M", 17, -6);
  return svg;
}

const R2_FELDER = [
  { schluessel: "beta", name: "β = ∡ACB (bei C)", soll: R2_MITTE / 2 },
  { schluessel: "gamma", name: "γ = ∡ABC (bei B)", soll: (180 - R2_MITTE) / 2 },
  { schluessel: "rechter", name: "∡CAB (bei A)", soll: 90 },
  { schluessel: "amc", name: "∡AMC (bei M, zu C hin)", soll: 180 - R2_MITTE },
];

function mountR2(container) {
  const box = el("div", { class: "aufgabe-box" });
  box.appendChild(el("h3", {}, ["Aufgabe 2 — Mittelpunktswinkel und Umfangswinkel", el("span", { class: "schwierigkeit-badge schwierig" }, "schwierig")]));
  box.appendChild(
    el("p", {
      html:
        "A, B und C liegen auf dem Kreis um M. Die Punkte <strong>C, M und B liegen auf einer Geraden</strong> — CB ist also ein <strong>Durchmesser</strong>. " +
        "Der Mittelpunktswinkel ∡AMB misst 50°. Berechne die fehlenden Winkelmaße.",
    }),
  );

  const figurEl = el("div", { class: "th-figur-wrap" });
  const liste = el("ol", { class: "th-luecken-liste" });
  const btnPruefen = el("button", { type: "button", class: "btn btn-primary" }, "Prüfen");
  const feedback = el("div", { class: "aufgabe-feedback" });
  box.appendChild(figurEl);
  box.appendChild(liste);
  box.appendChild(el("div", { class: "btn-row" }, btnPruefen));
  box.appendChild(feedback);

  const felder = R2_FELDER.map((f, i) => ({ ...f, nr: i + 1, input: el("input", { type: "text", inputmode: "decimal", placeholder: "in Grad" }) }));
  const marken = { mitte: { frei: false, text: num(R2_MITTE, 0) + "°" } };
  felder.forEach((f) => (marken[f.schluessel] = { frei: true, nr: f.nr, text: ziffer(f.nr) }));
  figurEl.appendChild(zeichneR2(marken));
  felder.forEach((f) => liste.appendChild(el("li", {}, [ziffer(f.nr) + " " + f.name + ": ", f.input])));

  btnPruefen.addEventListener("click", () => {
    let alleOk = true;
    felder.forEach((f) => {
      const ok = Math.abs(zahlAus(f.input.value) - f.soll) < 0.5;
      if (!ok) alleOk = false;
      f.input.classList.toggle("th-feld-ok", ok);
      f.input.classList.toggle("th-feld-fehler", !ok);
      const marke = figurEl.querySelector(`[data-feld="${f.nr}"]`);
      if (marke) {
        marke.textContent = num(f.soll, 0) + "°";
        marke.classList.remove("thf-luecke");
        marke.classList.add(ok ? "thf-richtig" : "thf-falsch");
      }
    });
    feedback.innerHTML =
      (alleOk
        ? `<div class="status ok">✓ Alles richtig!</div>`
        : `<div class="status err">✗ Noch nicht alles richtig — die zutreffenden Werte stehen jetzt in der Zeichnung.</div>`) +
      `<div class="musterloesung"><span class="ml-label">Rechenweg</span>` +
      `<strong>1.</strong> CB geht durch M, ist also ein Durchmesser ⟹ nach dem Satz des Thales ist <strong>∡CAB = 90°</strong>.<br>` +
      `<strong>2.</strong> ∡AMC ist der Nebenwinkel von ∡AMB: 180° − 50° = <strong>130°</strong>.<br>` +
      `<strong>3.</strong> Das Dreieck AMC ist gleichschenklig (MA = MC = r), also β = (180° − 130°) : 2 = <strong>25°</strong>.<br>` +
      `<strong>4.</strong> Ebenso ist AMB gleichschenklig, also γ = (180° − 50°) : 2 = <strong>65°</strong>.<br>` +
      `<em>Probe:</em> 90° + 25° + 65° = 180° im Dreieck ABC. ✓<br>` +
      `<em>Merke:</em> β = 25° ist genau die Hälfte des Mittelpunktswinkels von 50° — das ist der <strong>Umfangswinkelsatz</strong>. ` +
      `Der Satz des Thales ist sein Sonderfall: Beim Durchmesser ist der Mittelpunktswinkel 180°, der Umfangswinkel also 90°.</div>`;
  });

  container.appendChild(box);
  return { felder };
}

// ---------- Aufgabe R3: das ganze Thales-Dreieck ausrechnen ----------

const R3 = (() => {
  const c = 10, b = 6;                        // AC = b
  const a = Math.sqrt(c * c - b * b);         // = 8
  return {
    c, b, a,
    r: c / 2,
    flaeche: (a * b) / 2,
    h: (a * b) / c,
    q: (b * b) / c,                            // AH, an b anliegend
    p: (a * a) / c,                            // HB, an a anliegend
  };
})();

function zeichneR3() {
  const W = 400, H = 288;
  const px = 30;
  const A = { x: 50, y: 200 }, B = { x: 50 + R3.c * px, y: 200 };
  const H_ = { x: A.x + R3.q * px, y: A.y };
  const C = { x: H_.x, y: A.y - R3.h * px };
  const M = { x: (A.x + B.x) / 2, y: A.y };
  const svg = GS.svgEl("svg", { viewBox: `0 0 ${W} ${H}`, class: "th-figur", role: "img" });
  const zeichen = (tag, attrs) => svg.appendChild(GS.svgEl(tag, attrs));
  const beschrifte = (x, y, text, cls) => {
    const t = GS.svgEl("text", { x: x.toFixed(1), y: y.toFixed(1), "text-anchor": "middle", class: cls });
    t.textContent = text;
    svg.appendChild(t);
  };

  zeichen("path", { d: `M ${A.x} ${A.y} A ${R3.r * px} ${R3.r * px} 0 0 1 ${B.x} ${B.y}`, class: "thf-kreis" });
  zeichen("line", { x1: A.x, y1: A.y, x2: B.x, y2: B.y, class: "thf-durchmesser" });
  zeichen("line", { x1: A.x, y1: A.y, x2: C.x, y2: C.y, class: "thf-seite" });
  zeichen("line", { x1: B.x, y1: B.y, x2: C.x, y2: C.y, class: "thf-seite" });
  zeichen("line", { x1: C.x, y1: C.y, x2: H_.x, y2: H_.y, class: "thf-radius" });
  // Rechter Winkel bei C
  const u1 = GC.norm(GC.sub(A, C)), u2 = GC.norm(GC.sub(B, C)), s = 13;
  const e1 = GC.add(C, GC.scale(u1, s)), e2 = GC.add(C, GC.scale(u2, s)), ee = GC.add(e1, GC.scale(u2, s));
  zeichen("path", { d: `M ${e1.x.toFixed(1)} ${e1.y.toFixed(1)} L ${ee.x.toFixed(1)} ${ee.y.toFixed(1)} L ${e2.x.toFixed(1)} ${e2.y.toFixed(1)}`, class: "thf-rechter" });

  beschrifte((A.x + C.x) / 2 - 24, (A.y + C.y) / 2 - 6, "b = 6", "thf-seitenname");
  beschrifte((B.x + C.x) / 2 + 16, (B.y + C.y) / 2, "a", "thf-seitenname");
  beschrifte((A.x + B.x) / 2, A.y + 62, "c = 10", "thf-seitenname");
  beschrifte(C.x + 12, (C.y + H_.y) / 2, "h", "thf-seitenname");
  beschrifte((A.x + H_.x) / 2, A.y + 40, "q", "thf-seitenname");
  beschrifte((H_.x + B.x) / 2, A.y + 40, "p", "thf-seitenname");

  [[A, "A", -12, 18], [B, "B", 12, 18], [C, "C", 0, -10], [H_, "H", 0, 16], [M, "M", 0, -8]].forEach(([P, name, dx, dy]) => {
    zeichen("circle", { cx: P.x, cy: P.y, r: 3.2, class: "thf-punkt" });
    beschrifte(P.x + dx, P.y + dy, name, "thf-punktname");
  });
  return svg;
}

const R3_FELDER = [
  { name: "die zweite Kathete a = BC", soll: R3.a, einheit: "cm" },
  { name: "den Umkreisradius r", soll: R3.r, einheit: "cm" },
  { name: "den Flächeninhalt des Dreiecks", soll: R3.flaeche, einheit: "cm²" },
  { name: "die Höhe h auf die Hypotenuse", soll: R3.h, einheit: "cm" },
  { name: "den Abschnitt q = AH", soll: R3.q, einheit: "cm" },
  { name: "den Abschnitt p = HB", soll: R3.p, einheit: "cm" },
];

function mountR3(container) {
  const box = el("div", { class: "aufgabe-box" });
  box.appendChild(el("h3", {}, ["Aufgabe 3 — das ganze Thales-Dreieck", el("span", { class: "schwierigkeit-badge komplex" }, "komplex")]));
  box.appendChild(
    el("p", {
      html:
        "Über der Strecke AB mit <strong>AB = 10 cm</strong> wird der Thaleskreis gezeichnet; C liegt auf ihm, und <strong>AC = 6 cm</strong>. " +
        "H ist der Fußpunkt der Höhe von C auf AB. Berechne der Reihe nach alle sechs Größen. Alle Ergebnisse gehen glatt auf.",
    }),
  );

  const figurEl = el("div", { class: "th-figur-wrap" });
  figurEl.appendChild(zeichneR3());
  const liste = el("ol", { class: "th-luecken-liste" });
  const btnPruefen = el("button", { type: "button", class: "btn btn-primary" }, "Prüfen");
  const feedback = el("div", { class: "aufgabe-feedback" });
  box.appendChild(figurEl);
  box.appendChild(liste);
  box.appendChild(el("div", { class: "btn-row" }, btnPruefen));
  box.appendChild(feedback);

  const felder = R3_FELDER.map((f, i) => ({ ...f, nr: i + 1, input: el("input", { type: "text", inputmode: "decimal", placeholder: f.einheit }) }));
  felder.forEach((f) => liste.appendChild(el("li", {}, [f.name + " (in " + f.einheit + "): ", f.input])));

  btnPruefen.addEventListener("click", () => {
    let alleOk = true;
    felder.forEach((f) => {
      const ok = Math.abs(zahlAus(f.input.value) - f.soll) < 0.05;
      if (!ok) alleOk = false;
      f.input.classList.toggle("th-feld-ok", ok);
      f.input.classList.toggle("th-feld-fehler", !ok);
    });
    feedback.innerHTML =
      (alleOk ? `<div class="status ok">✓ Alles richtig!</div>` : `<div class="status err">✗ Noch nicht alles richtig.</div>`) +
      `<div class="musterloesung"><span class="ml-label">Rechenweg</span>` +
      `<strong>1.</strong> C liegt auf dem Thaleskreis ⟹ γ = 90°, AB ist die Hypotenuse. Pythagoras: a² = 10² − 6² = 64, also <strong>a = 8 cm</strong>.<br>` +
      `<strong>2.</strong> Der Umkreismittelpunkt ist die Mitte der Hypotenuse: <strong>r = 10 : 2 = 5 cm</strong>.<br>` +
      `<strong>3.</strong> Die beiden Katheten stehen senkrecht aufeinander, sind also Grundseite und Höhe zueinander: A = (6 · 8) : 2 = <strong>24 cm²</strong>.<br>` +
      `<strong>4.</strong> Derselbe Flächeninhalt über der Hypotenuse: (10 · h) : 2 = 24 ⟹ <strong>h = 4,8 cm</strong>.<br>` +
      `<strong>5.</strong> Kathetensatz: b² = c · q ⟹ q = 36 : 10 = <strong>3,6 cm</strong>.<br>` +
      `<strong>6.</strong> p = c − q = 10 − 3,6 = <strong>6,4 cm</strong> (Probe mit dem Kathetensatz: a² = 64 = 10 · 6,4 ✓).<br>` +
      `<em>Probe zum Höhensatz:</em> h² = p · q ⟹ 4,8² = 23,04 und 6,4 · 3,6 = 23,04 ✓</div>`;
  });

  container.appendChild(box);
  return { felder };
}

export function mountRechenAufgaben(container) {
  return { r1: mountR1(container), r2: mountR2(container), r3: mountR3(container) };
}

// ================= Block 3: Aufgaben fürs Heft =================

export const HEFT_AUFGABEN = [
  {
    titel: "Aufgabe 1 — Thaleskreis und Dreieck",
    stufe: "einfach",
    aufgabe:
      "Zeichne die Strecke AB mit <strong>c = AB = 7 cm</strong>. Konstruiere den Thaleskreis über AB (Mittelsenkrechte, dann Kreis) und darauf einen Punkt C mit <strong>b = AC = 4 cm</strong>. " +
      "Zeichne das Dreieck ABC.",
    schritte: [
      "Strecke AB = 7 cm zeichnen.",
      "Mittelsenkrechte von AB konstruieren — Zirkelöffnung größer als 3,5 cm, Bögen um A und um B, Schnittpunkte verbinden. Der Schnittpunkt mit AB ist M.",
      "Kreis um M mit dem Radius MA = 3,5 cm zeichnen.",
      "Zirkel auf 4 cm stellen, in A einstechen, Kreis zeichnen — er trifft den Thaleskreis in C.",
      "Dreieck ABC zeichnen und den rechten Winkel bei C mit dem Geodreieck kontrollieren.",
    ],
    kontrolle:
      "Der Winkel bei C muss <strong>90°</strong> sein. Nachrechnen: a = BC = √(7² − 4²) = √33 ≈ <strong>5,74 cm</strong>; der Umkreisradius ist <strong>r = 3,5 cm</strong>. " +
      "Miss BC nach — auf einen halben Millimeter genau sollte es passen.",
  },
  {
    titel: "Aufgabe 2 — aus c und der Höhe bzw. aus p und q",
    stufe: "mittel",
    aufgabe:
      "Konstruiere unter Nutzung des Satzes von Thales ein rechtwinkliges Dreieck ABC mit γ = 90°:<br>" +
      "<strong>a)</strong> c = 6 cm, h<sub>c</sub> = 2,5 cm &nbsp;&nbsp; <strong>b)</strong> p = 2 cm, q = 4,5 cm",
    schritte: [
      "<strong>Zu a):</strong> AB = 6 cm zeichnen, Thaleskreis über AB konstruieren (r = 3 cm).",
      "<strong>Zu a):</strong> Im Abstand 2,5 cm eine <em>Parallele</em> zu AB ziehen — dafür in A das Lot auf AB errichten, 2,5 cm abtragen und durch diesen Punkt die Parallele legen. Wo sie den Kreis schneidet, liegt C (zwei Lösungen, spiegelbildlich).",
      "<strong>Zu b):</strong> Auf einer Geraden nacheinander q = 4,5 cm und p = 2 cm abtragen: A, dann H, dann B. Die Hypotenuse ist also c = 6,5 cm.",
      "<strong>Zu b):</strong> Thaleskreis über AB konstruieren, in H das Lot auf AB errichten — es trifft den Kreis in C.",
      "Beide Dreiecke zeichnen und die Höhe h<sub>c</sub> jeweils einzeichnen.",
    ],
    kontrolle:
      "<strong>a)</strong> Miss die beiden Abschnitte: p + q = 6 cm und p · q = h² = 6,25 cm². Es muss <strong>p ≈ 4,66 cm</strong> und <strong>q ≈ 1,34 cm</strong> herauskommen (oder umgekehrt).<br>" +
      "<strong>b)</strong> Es muss <strong>h<sub>c</sub> = √(2 · 4,5) = √9 = 3 cm</strong> sein — eine glatte Zahl, gut zum Nachmessen. Die Katheten: a = √(c · p) = √13 ≈ <strong>3,61 cm</strong> und b = √(c · q) = √29,25 ≈ <strong>5,41 cm</strong>. " +
      "Probe: 3,61² + 5,41² = 13,03 + 29,27 ≈ 42,3 = 6,5². ✓",
  },
  {
    titel: "Aufgabe 3 — wann gibt es überhaupt eine Lösung?",
    stufe: "schwierig",
    aufgabe:
      "Versuche, ein rechtwinkliges Dreieck ABC (γ = 90°) zu konstruieren:<br>" +
      "<strong>a)</strong> c = 5 cm, h<sub>c</sub> = 2,5 cm &nbsp;&nbsp; <strong>b)</strong> c = 5 cm, h<sub>c</sub> = 3 cm<br>" +
      "Zeichne beide Versuche ins Heft und <strong>begründe schriftlich</strong>, was jeweils passiert. Formuliere danach eine Regel: " +
      "Für welche Höhen h<sub>c</sub> gibt es bei gegebener Hypotenuse c eine Lösung — und wie viele?",
    schritte: [
      "Für beide Teilaufgaben AB = 5 cm zeichnen und den Thaleskreis über AB konstruieren (r = 2,5 cm).",
      "Jeweils die Parallele zu AB im Abstand h<sub>c</sub> ziehen.",
      "Beobachten, wie oft die Parallele den Kreis trifft: zweimal, einmal oder gar nicht.",
      "Die Beobachtung in einem Satz aufschreiben und mit dem Radius des Thaleskreises begründen.",
    ],
    kontrolle:
      "<strong>a)</strong> h<sub>c</sub> = 2,5 cm ist genau der Radius. Die Parallele <em>berührt</em> den Kreis im höchsten Punkt — es gibt <strong>genau eine</strong> Lösung, " +
      "und zwar das gleichschenklig-rechtwinklige Dreieck mit α = β = 45°. C liegt senkrecht über M.<br>" +
      "<strong>b)</strong> h<sub>c</sub> = 3 cm ist größer als der Radius 2,5 cm. Die Parallele verläuft ganz oberhalb des Kreises und trifft ihn nie — es gibt <strong>keine</strong> Lösung.<br>" +
      "<strong>Regel:</strong> Weil C auf dem Thaleskreis liegen muss, ist sein Abstand von AB höchstens so groß wie der Radius. Also: " +
      "h<sub>c</sub> &lt; c : 2 ⟹ zwei (spiegelbildliche) Lösungen; h<sub>c</sub> = c : 2 ⟹ genau eine; h<sub>c</sub> &gt; c : 2 ⟹ keine.",
  },
];

export function mountHeftAufgaben(container) {
  HEFT_AUFGABEN.forEach((a) => {
    const box = el("div", { class: "aufgabe-box th-heft" });
    box.appendChild(el("h3", {}, [a.titel, el("span", { class: "schwierigkeit-badge " + a.stufe }, a.stufe)]));
    box.appendChild(el("div", { class: "aufgabe-prompt", html: a.aufgabe }));
    box.appendChild(el("p", { class: "th-heft-label" }, "So gehst du vor:"));
    box.appendChild(el("ol", { class: "geo-steps", html: a.schritte.map((s) => `<li>${s}</li>`).join("") }));
    const det = el("details", { class: "th-kontrolle" });
    det.appendChild(el("summary", {}, "🔍 Selbstkontrolle — erst nach dem Zeichnen aufklappen"));
    det.appendChild(el("div", { html: a.kontrolle }));
    box.appendChild(det);
    container.appendChild(box);
  });
}
