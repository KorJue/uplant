// Modelle für das freie Konstruieren rund um den Thaleskreis: der Thaleskreis über einer Strecke
// AB (Abschnitt 4) und die beiden Tangenten von einem äußeren Punkt an einen Kreis (Abschnitt 5).
//
// Aufgebaut wie die Aufgaben in tri-construct.js und mit denselben Bausteinen: Eine „Analyse“ sucht
// zu jeder Teilkonstruktion die Kreise und Geraden, aus denen sie tatsächlich entstanden ist.
// Daraus ergibt sich beides — die Prüfung („was fehlt noch?“) und die Darstellung (fertig benutzte
// Hilfskreise treten grau zurück).
//
// Der Unterschied zu den Dreiecksseiten: Hier gibt es nur EINE Teilkonstruktion — die
// Mittelsenkrechte von AB. Sie liefert den Mittelpunkt M, und um M mit dem Radius MA liegt der
// Thaleskreis. Genau diese Reihenfolge ist der Kern des Abschnitts: Ohne M kein Kreis.
//
// Die Tangentenaufgabe steht an ZWEI Stellen der Seite: als Werkbank in Abschnitt 5, wo sie
// gelehrt wird, und als Übungsaufgabe 3 in Abschnitt 8. Beide benutzen dasselbe Modell von hier —
// zwei Kopien würden über kurz oder lang zwei verschiedene Rückmeldungen auf dieselbe Zeichnung
// geben. Der Unterschied liegt allein in der Vorgabe: dort fest, hier ziehbar.

import * as GC from "./geo-core.js?v=24";
import * as GS from "./geo-svg.js?v=24";
import { lineThroughBoth } from "./check-helpers.js?v=24";
import { bester, circlesAt, findMediatriceAlle, pairPoints } from "./tri-construct.js?v=24";

// Ein Ergebniskreis gilt als richtig, wenn sein Radius auf 5 % genau stimmt — dieselbe Schranke
// wie beim Um- und Inkreis, damit ein von Hand gesetzter Kreis nicht an Pixeln scheitert.
const R_TOL = 0.05;
// Abstand einer gezeichneten Geraden von einem Punkt, der noch als „geht hindurch“ gilt.
const LINIE_TOL = 12;

// Kreis um „center“ mit vorgegebenem Radius. Zurück kommt zusätzlich, ob überhaupt ein Kreis um
// diesen Punkt liegt: Dann ist nur der Radius falsch, was eine andere Rückmeldung verdient als
// „der Kreis fehlt ganz“.
function findResultCircle(tool, center, radius) {
  const at = circlesAt(tool, center);
  return { circle: at.find((c) => Math.abs(c.radius - radius) / radius < R_TOL) || null, anyAt: at.length > 0 };
}

// ---------- Bausteine, die sich Abschnitt 5 und die Übungsaufgaben teilen ----------

// Wie findResultCircle, aber mit dem am besten passenden Kreis: Bei Fingerbedienung liegen leicht
// mehrere Mittelpunkte innerhalb der Toleranz.
export function kreisUm(tool, zentrum, radius) {
  const at = circlesAt(tool, zentrum);
  const beste = at.slice().sort((a, b) => Math.abs(a.radius - radius) - Math.abs(b.radius - radius))[0];
  const passt = beste && Math.abs(beste.radius - radius) / radius < R_TOL;
  return { kreis: passt ? beste : null, irgendeiner: at.length > 0 };
}

export function geradeDurch(tool, P, Q) {
  return tool.lines.find((l) => lineThroughBoth(l, P, Q, LINIE_TOL)) || null;
}

// Der Thaleskreis über PQ, samt der Mittelsenkrechten, die seinen Mittelpunkt erst liefert.
export function thalesTeil(tool, P, Q) {
  const ms = bester(findMediatriceAlle(tool, P, Q));
  const M = ms ? GC.mid(P, Q) : null;
  const r = GC.dist(P, Q) / 2;
  const k = M ? kreisUm(tool, M, r) : { kreis: null, irgendeiner: false };
  return { ms, M, r, kreis: k.kreis, irgendeinerBeiM: k.irgendeiner };
}

// Die Rückmeldungen zum Thaleskreis sind überall dieselben.
export function thalesMeldung(t, ueber) {
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
export function markiere(marks, p, done) {
  if (!p) return;
  const gleich = marks.find((m) => GC.dist(m.p, p) < 2);
  if (gleich) gleich.done = gleich.done || done;
  else marks.push({ p, done });
}

export function beschriftung(x, y, text) {
  const t = GS.svgEl("text", { x: Number(x).toFixed(1), y: Number(y).toFixed(1), "text-anchor": "middle", class: "th-mass-name" });
  t.textContent = text;
  return t;
}

export const THALES_TASK = {
  intro: "Konstruiere den Thaleskreis über der Strecke AB — nur mit Zirkel und Lineal.",

  steps: [
    "Zirkel wählen, in A einstechen und auf einen Punkt am gewünschten Radius klicken. Der Radius muss <strong>größer als die halbe Strecke</strong> sein, sonst schneiden sich die beiden Bögen nicht.",
    "Dasselbe von B aus mit demselben Radius. Das Häkchen „🔒 Zirkel-Radius beibehalten“ hält ihn fest — wie beim echten Zirkel, den man zwischen zwei Bögen nicht verstellt.",
    "Lineal wählen und die beiden Schnittpunkte der Bögen verbinden: Das ist die Mittelsenkrechte von AB. Wo sie die Strecke trifft, liegt der Mittelpunkt <strong>M</strong>. Sobald sie steht, treten ihre Hilfskreise grau zurück.",
    "Zirkel in M einstechen und den Radius bis A (oder B) einstellen — das ist der <strong>Thaleskreis</strong>. Er geht durch A und durch B, denn MA = MB.",
    "Mit „Prüfen“ kontrollieren, mit „Tipp“ einen Hinweis bekommen.",
  ],

  why:
    "<strong>Warum diese Reihenfolge?</strong> Der Thaleskreis ist der Kreis <em>um die Mitte der Strecke</em> mit der halben Strecke als Radius. Die Mitte lässt sich nicht abschätzen, sie muss konstruiert werden — und dafür gibt es genau ein Werkzeug: die Mittelsenkrechte. Sie liefert M als ihren Schnittpunkt mit AB. Erst dann steht der Zirkel richtig.",

  analyze(tool, pts) {
    const { A, B } = pts;
    const hit = bester(findMediatriceAlle(tool, A, B));
    const spentCircles = new Set();
    const marks = [];

    if (hit) {
      hit.circles.forEach((c) => spentCircles.add(c));
      hit.points.forEach((p) => marks.push({ p, done: true }));
    } else {
      // Noch offen: Sobald beide Hilfskreise stehen, sind ihre Schnittpunkte die nächsten Klickziele.
      pairPoints(tool, A, B).forEach((p) => marks.push({ p, done: false }));
    }

    // M ist erst konstruiert, wenn die Mittelsenkrechte wirklich gezeichnet ist. Vorher darf ein
    // Klick auch nicht dorthin einrasten — sonst ließe sich der ganze erste Schritt überspringen,
    // und die Konstruktion wäre nur noch abgeschätzt.
    const center = hit ? GC.mid(A, B) : null;
    const radius = center ? GC.dist(A, B) / 2 : 0;
    const res = center ? findResultCircle(tool, center, radius) : { circle: null, anyAt: false };
    if (center) marks.push({ p: center, done: !!res.circle });

    return {
      hit,
      center,
      radius,
      res,
      spentCircles,
      marks,
      // marks enthält bereits alle sinnvollen Punkte — free-ui soll keine weiteren raten.
      autoMarks: false,
      snapPoints: center ? [A, B, center] : [A, B],
    };
  },

  check(a) {
    if (!a.hit) {
      return {
        ok: false,
        msg:
          "Es fehlt noch die Mittelsenkrechte von AB: zwei gleich große Kreise um A und um B zeichnen " +
          "(Radius größer als die halbe Strecke) und ihre beiden Schnittpunkte mit dem Lineal verbinden. " +
          "Erst sie liefert den Mittelpunkt M.",
      };
    }
    if (!a.res.circle) {
      return a.res.anyAt
        ? {
            ok: false,
            msg:
              "Der Kreis um M hat nicht den richtigen Radius. Der Thaleskreis muss durch A und durch B gehen — " +
              "stelle den Zirkel also genau bis zu einem der beiden Endpunkte ein.",
          }
        : {
            ok: false,
            msg:
              "Es fehlt noch der Thaleskreis: Zirkel in M einstechen (dem Schnittpunkt der Mittelsenkrechten mit AB) " +
              "und den Radius bis A oder B einstellen.",
          };
    }
    return {
      ok: true,
      msg:
        "Richtig konstruiert! Der Kreis geht durch A und durch B, weil MA = MB der Radius ist — AB ist sein Durchmesser. " +
        "Jeder Punkt C auf diesem Kreis sieht die Strecke AB unter einem rechten Winkel.",
    };
  },
};

// ================= Tangenten von einem äußeren Punkt an einen Kreis =================

// Die vollständige Figur zu einer Lage (Kreis k um M mit Radius r, Punkt P außerhalb):
// Mitte Z der Strecke MP, Abstand d = MP und die beiden Berührpunkte.
//
// T₁ ist immer der Berührpunkt LINKS der gerichteten Strecke M→P. Nach der y-Koordinate zu
// sortieren wäre einfacher, würde die beiden Namen beim Ziehen von P aber über die Waagerechte
// hinweg vertauschen — die Beschriftung spränge, obwohl sich nichts Wesentliches ändert.
export function tangentenFigur(M, r, P) {
  const Z = GC.mid(M, P);
  const d = GC.dist(M, P);
  const s = GC.circleCircleIntersections(M, r, Z, d / 2);
  if (s.length < 2) return { M, r, P, Z, d, T1: null, T2: null };
  const links = GC.cross2(M, P, s[0]) < 0 ? s[0] : s[1];
  const rechts = links === s[0] ? s[1] : s[0];
  return { M, r, P, Z, d, T1: links, T2: rechts };
}

export const TANGENTEN_TASK = {
  aufgabe:
    "Gegeben sind der Kreis k mit dem Mittelpunkt <strong>M</strong> und ein Punkt <strong>P</strong> außerhalb. Konstruiere die <strong>beiden Tangenten</strong> von P an k. " +
    "Denke daran: Im Berührpunkt T steht die Tangente senkrecht auf dem Radius MT — gesucht sind also Punkte mit ∡MTP = 90°.",

  schritte: [
    "Mittelsenkrechte von <strong>MP</strong> konstruieren; sie liefert die Mitte <strong>Z</strong> der Strecke MP.",
    "Thaleskreis um Z durch M und P zeichnen. Auf ihm liegen genau die Punkte, die MP unter 90° sehen.",
    "Wo dieser Kreis den gegebenen Kreis k schneidet, liegen die Berührpunkte <strong>T₁</strong> und <strong>T₂</strong>.",
    "Die Geraden durch P und T₁ sowie durch P und T₂ ziehen — das sind die Tangenten.",
  ],

  why:
    "<strong>Warum diese Reihenfolge?</strong> Der Berührpunkt lässt sich nicht abschätzen — man sieht einem Kreispunkt nicht an, ob die Gerade von P aus ihn gerade <em>berührt</em> oder schon <em>schneidet</em>. Die Bedingung dafür ist der rechte Winkel zwischen Tangente und Radius, und alle Punkte, die MP unter einem rechten Winkel sehen, liegen auf dem Thaleskreis über MP. Beide Kreise zusammen legen die Berührpunkte also exakt fest.",

  // Die Angabe: der gegebene Kreis und seine beiden Punkte. Die eigene Konstruktion kommt auf eine
  // andere Ebene — sonst verschwände die Angabe beim „Zurücksetzen“ mit.
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
    const t1 = g.T1 ? geradeDurch(tool, g.P, g.T1) : null;
    const t2 = g.T2 ? geradeDurch(tool, g.P, g.T2) : null;
    // Die Berührpunkte sind erst dann Klickziele, wenn der Thaleskreis wirklich gezeichnet ist:
    // Vorher wären sie geraten, und geraten ist auf dieser Seite nichts wert.
    if (t.kreis) {
      markiere(marks, g.T1, !!t1);
      markiere(marks, g.T2, !!t2);
    }
    const snap = [g.M, g.P];
    if (t.M) snap.push(t.M);
    if (t.kreis && g.T1 && g.T2) snap.push(g.T1, g.T2);
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
        "Beide Tangentenabschnitte sind übrigens gleich lang — die Figur ist an der Geraden MP gespiegelt.",
    };
  },
};
