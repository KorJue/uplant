// Modell für das freie Konstruieren des Thaleskreises über einer Strecke AB.
//
// Aufgebaut wie die Aufgaben in tri-construct.js und mit denselben Bausteinen: Eine „Analyse“ sucht
// zu jeder Teilkonstruktion die Kreise und Geraden, aus denen sie tatsächlich entstanden ist.
// Daraus ergibt sich beides — die Prüfung („was fehlt noch?“) und die Darstellung (fertig benutzte
// Hilfskreise treten grau zurück).
//
// Der Unterschied zu den Dreiecksseiten: Hier gibt es nur EINE Teilkonstruktion — die
// Mittelsenkrechte von AB. Sie liefert den Mittelpunkt M, und um M mit dem Radius MA liegt der
// Thaleskreis. Genau diese Reihenfolge ist der Kern des Abschnitts: Ohne M kein Kreis.

import * as GC from "./geo-core.js?v=22";
import { bester, circlesAt, findMediatriceAlle, pairPoints } from "./tri-construct.js?v=22";

// Ein Ergebniskreis gilt als richtig, wenn sein Radius auf 5 % genau stimmt — dieselbe Schranke
// wie beim Um- und Inkreis, damit ein von Hand gesetzter Kreis nicht an Pixeln scheitert.
const R_TOL = 0.05;

// Kreis um „center“ mit vorgegebenem Radius. Zurück kommt zusätzlich, ob überhaupt ein Kreis um
// diesen Punkt liegt: Dann ist nur der Radius falsch, was eine andere Rückmeldung verdient als
// „der Kreis fehlt ganz“.
function findResultCircle(tool, center, radius) {
  const at = circlesAt(tool, center);
  return { circle: at.find((c) => Math.abs(c.radius - radius) / radius < R_TOL) || null, anyAt: at.length > 0 };
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
