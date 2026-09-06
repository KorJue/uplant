// Gemeinsames Modell für das freie Konstruieren am Dreieck: alle drei Mittelsenkrechten + Umkreis
// bzw. alle drei Winkelhalbierenden + Inkreis. Genutzt von mittelsenkrechte-umkreis.js,
// winkelhalbierende-inkreis.js und der dritten Phase der Grundkonstruktionen — Prüfung,
// Einrastpunkte, Markierungen und Texte sind dadurch überall identisch.
//
// Kernbegriff ist die "analyse": Sie sucht zu jeder Teilkonstruktion die Kreise und Punkte, aus denen
// sie tatsächlich entstanden ist. Daraus ergibt sich beides — die Prüfung ("was fehlt noch?") und die
// Darstellung (fertige Hilfskreise und ihre Schnittpunkte treten grau zurück).

import * as GC from "./geo-core.js?v=22";
import * as GS from "./geo-svg.js?v=22";
import { lineThroughBoth, sameRadius, twoArcIntersections } from "./check-helpers.js?v=22";

// Klick-/Prüftoleranz für "dieser Punkt ist gemeint" (SVG-Einheiten). Per Finger wird ungenauer
// getroffen als mit der Maus, deshalb dort ein größerer Radius.
export const TOL_PT = GS.COARSE_POINTER ? 24 : 16;

// Zwei Hilfskreise schneiden sich nur, wenn ihr Radius größer als der halbe Abstand ihrer
// Mittelpunkte ist — mit etwas Sicherheitsabstand, damit ein Streifschnitt nicht schon zählt.
const MIN_SPAN = 1.02;
// Ein Ergebniskreis (Um-/Inkreis) gilt als richtig, wenn sein Radius auf 5 % genau stimmt.
const R_TOL = 0.05;

// Kreise, deren Mittelpunkt bei p liegt — der am besten passende zuerst. Die Toleranz ist bewusst
// großzügig (Fingerbedienung), dadurch können bei eng benachbarten Punkten mehrere Kreise in Frage
// kommen: etwa der Schenkelpunkt von A Richtung B und der von B Richtung A, wenn beide Bögen groß
// gewählt wurden. Ohne Sortierung würde dann womöglich der Kreis einer *anderen* Teilkonstruktion
// als "hier verwendet" gelten — die Prüfung bliebe richtig, aber die graue Markierung träfe den
// falschen Kreis.
export function circlesAt(tool, p) {
  return tool.circles
    .filter((c) => GC.dist(c.center, p) < TOL_PT)
    .sort((a, b) => GC.dist(a.center, p) - GC.dist(b.center, p));
}

// Wie gut passen die Radien mehrerer Kreise zusammen? 0 = genau gleich.
function radienAbweichung(...kreise) {
  const r = kreise.map((c) => c.radius);
  return (Math.max(...r) - Math.min(...r)) / Math.max(...r);
}

// Die Schnittpunkte eines gleich großen Kreispaares um P und Q, sobald beide gezeichnet sind — das
// sind die Punkte, auf die die Konstruktion als Nächstes hinausläuft. Nur solche Punkte werden als
// Kreuz markiert; die Kreuzungen beliebiger anderer Kreise sind bedeutungslos.
//
// Genommen wird das Paar mit den ÄHNLICHSTEN Radien, nicht das erstbeste. Die
// Toleranz von sameRadius ist mit 8 % großzügig, und im Verlauf der
// Konstruktion liegen Kreise mehrerer Seiten gleichzeitig vor. Das erstbeste
// Paar kann dann eines aus einer anderen Teilkonstruktion sein — das Kreuz
// stünde ein paar Einheiten neben der Stelle, auf die die Zeichnung wirklich
// hinausläuft, und der Klick würde genau dorthin einrasten.
export function pairPoints(tool, P, Q) {
  let beste = null;
  for (const cP of circlesAt(tool, P)) {
    for (const cQ of circlesAt(tool, Q)) {
      if (cP === cQ || !sameRadius(cP, cQ)) continue;
      const inter = twoArcIntersections(P, Q, cP, cQ);
      if (inter.length !== 2) continue;
      const abweichung = radienAbweichung(cP, cQ);
      if (!beste || abweichung < beste.abweichung) beste = { inter, abweichung };
    }
  }
  return beste ? beste.inter : [];
}

// Von mehreren passenden Kreiskombinationen die stimmigste nehmen.
//
// sameRadius lässt bewusst 8 % Unterschied durch — von Hand geklickt wird der
// Radius nie exakt getroffen. Am Ende der Konstruktion liegen aber die Kreise
// aller drei Teilkonstruktionen gleichzeitig vor, und dann passt zu einem Kreis
// oft auch einer aus einer *anderen* Teilkonstruktion noch innerhalb dieser
// 8 %. Weil twoArcIntersections mit dem gemittelten Radius rechnet, liegen die
// Schnittpunkte eines solchen Fehlpaares trotzdem exakt auf der gesuchten
// Geraden — die Kombination wird also angenommen. Wer dann die erste nimmt,
// färbt den falschen Kreis grau: Der richtige Partner bleibt bunt stehen, und
// es sieht so aus, als fehlte noch etwas.
//
// Dieselbe Überlegung steht schon bei circlesAt für die Mittelpunkte; für die
// Radien fehlte sie. Bewertet wird deshalb, wie gut die Radien wirklich
// zusammenpassen, und gewonnen hat die kleinste Abweichung.
// Welches Kreispaar der Zeichnende wirklich benutzt hat, verrät die Gerade
// allein nicht: Zwei gleich große Kreise um P und Q schneiden sich IMMER auf
// der Mittelsenkrechten von PQ — ganz gleich, wie groß sie sind. Liegen am Ende
// der Konstruktion zufällig zwei Kreise zweier *verschiedener* Seiten dicht
// beieinander (bei einem Dreieck mit zwei ähnlich langen Seiten passiert das
// leicht), so passt dieses Fremdpaar ebenso gut. Wer es nimmt, färbt den
// falschen Kreis grau — der wirklich gezeichnete Partner bleibt bunt stehen,
// als fehlte noch etwas.
//
// Verraten wird das gemeinte Paar von den ANGEKLICKTEN Endpunkten der Geraden:
// Sie liegen auf den Schnittpunkten genau dieses Paares. Deshalb wird zuerst
// nach dieser Passung ausgewählt und erst bei Gleichstand danach, wie gut die
// Radien zusammenpassen.
function passungZuLinie(line, p1, p2) {
  return Math.min(
    GC.dist(line.a, p1) + GC.dist(line.b, p2),
    GC.dist(line.a, p2) + GC.dist(line.b, p1)
  );
}
export function bester(treffer) {
  if (!treffer.length) return null;
  return treffer.reduce((a, b) => {
    if (b.passung < a.passung - 0.5) return b;
    if (a.passung < b.passung - 0.5) return a;
    return b.abweichung < a.abweichung ? b : a;
  });
}

// ---------- Teilkonstruktionen suchen ----------
// Alle drei Sucher liefern { circles, points, line } der tatsächlich verwendeten Elemente — oder
// null. Sie probieren bewusst *alle* passenden Kreiskombinationen durch: am Ende der Konstruktion
// liegen die Kreise aller drei Ecken plus die von Lot und Ergebniskreis gleichzeitig vor, und der
// jeweils erste gefundene Kreis kann zu einer ganz anderen Teilkonstruktion gehören.

// Mittelsenkrechte von PQ: zwei gleich große, ausreichend große Kreise um P und Q plus die Gerade
// durch ihre beiden Schnittpunkte.
export function findMediatriceAlle(tool, P, Q) {
  const treffer = [];
  for (const cP of circlesAt(tool, P)) {
    for (const cQ of circlesAt(tool, Q)) {
      if (cP === cQ || !sameRadius(cP, cQ)) continue;
      if (Math.min(cP.radius, cQ.radius) < (GC.dist(P, Q) / 2) * MIN_SPAN) continue;
      const inter = twoArcIntersections(P, Q, cP, cQ);
      if (inter.length < 2) continue;
      const line = tool.lines.find((l) => lineThroughBoth(l, inter[0], inter[1]));
      if (line) {
        treffer.push({
          circles: [cP, cQ], points: inter, line,
          passung: passungZuLinie(line, inter[0], inter[1]),
          abweichung: radienAbweichung(cP, cQ),
        });
      }
    }
  }
  return treffer;
}

// Die beiden Schnittpunkte eines Kreises um V mit den Schenkeln VP und VQ.
function legPoints(V, P, Q, r) {
  return [GC.add(V, GC.scale(GC.norm(GC.sub(P, V)), r)), GC.add(V, GC.scale(GC.norm(GC.sub(Q, V)), r))];
}

// Winkelhalbierende bei V (Schenkel nach P und Q): Bogen um V über beide Schenkel, zwei gleich große
// Kreise um die beiden neuen Schenkelpunkte, Gerade von V durch deren Schnittpunkt.
export function findBisectorAlle(tool, V, P, Q) {
  const maxR0 = Math.min(GC.dist(V, P), GC.dist(V, Q));
  const bisDir = GC.angleBisectorDir(V, P, Q);
  const treffer = [];
  for (const c0 of circlesAt(tool, V)) {
    if (c0.radius < 20 || c0.radius > maxR0 * 1.05) continue;
    const [P1, Q1] = legPoints(V, P, Q, c0.radius);
    for (const c1 of circlesAt(tool, P1)) {
      if (c1 === c0) continue;
      for (const c2 of circlesAt(tool, Q1)) {
        if (c2 === c0 || c2 === c1 || !sameRadius(c1, c2)) continue;
        if (Math.min(c1.radius, c2.radius) < (GC.dist(P1, Q1) / 2) * MIN_SPAN) continue;
        const inter = twoArcIntersections(P1, Q1, c1, c2);
        if (inter.length < 2) continue;
        // Von den beiden Schnittpunkten der ins Winkelinnere zeigende.
        const M = GC.dot(GC.sub(inter[0], V), bisDir) >= GC.dot(GC.sub(inter[1], V), bisDir) ? inter[0] : inter[1];
        const line = tool.lines.find((l) => lineThroughBoth(l, V, M));
        if (line) {
          treffer.push({
            circles: [c0, c1, c2], points: [P1, Q1, M], line,
            // Die Gerade läuft von V nach M; V ist bei allen Kandidaten gleich,
            // der andere Endpunkt verrät also den gemeinten Kreuzungspunkt.
            passung: Math.min(GC.dist(line.a, M), GC.dist(line.b, M)),
            abweichung: radienAbweichung(c1, c2),
          });
        }
      }
    }
  }
  return treffer;
}

// Lot von I auf eine der drei Seiten: Kreis um I, der die Seite zweimal schneidet, zwei gleich große
// Kreise um diese Schnittpunkte, Gerade von I durch deren Schnittpunkt. Liefert zusätzlich den
// Lotfußpunkt — er ist der Berührpunkt des Inkreises und legt dessen Radius fest.
export function findLotAlle(tool, sides, I) {
  const treffer = [];
  for (const cI of circlesAt(tool, I)) {
    for (const [sA, sB] of sides) {
      const hits = GC.circleLineIntersections(I, cI.radius, sA, sB);
      if (hits.length < 2) continue;
      const [X1, X2] = hits;
      for (const c1 of circlesAt(tool, X1)) {
        if (c1 === cI) continue;
        for (const c2 of circlesAt(tool, X2)) {
          if (c2 === cI || c2 === c1 || !sameRadius(c1, c2)) continue;
          if (Math.min(c1.radius, c2.radius) < (GC.dist(X1, X2) / 2) * MIN_SPAN) continue;
          const foot = GC.footOfPerpendicular(I, sA, sB);
          const line = tool.lines.find((l) => lineThroughBoth(l, I, foot));
          if (line) {
            // Beim Lot ist die Gerade für alle Kandidaten dieselbe (I zum
            // Lotfußpunkt); unterschieden wird allein über die Radien.
            treffer.push({
              circles: [cI, c1, c2], points: [X1, X2, foot], foot, line,
              passung: 0, abweichung: radienAbweichung(c1, c2),
            });
          }
        }
      }
    }
  }
  return treffer;
}

// Seitenhalbierende von V auf die Seite PQ. Anders als bei der Mittelsenkrechten wird die
// Verbindung der beiden Bogenschnittpunkte *nicht* verlangt: Die beiden gleich großen Kreise um P
// und Q liefern den Seitenmittelpunkt bereits eindeutig, und gezeichnet werden muss am Ende nur die
// Strecke vom Eckpunkt dorthin — sie steht ausdrücklich nicht senkrecht auf der Seite.
export function findMedianAlle(tool, V, P, Q) {
  const M = GC.mid(P, Q);
  const treffer = [];
  for (const cP of circlesAt(tool, P)) {
    for (const cQ of circlesAt(tool, Q)) {
      if (cP === cQ || !sameRadius(cP, cQ)) continue;
      if (Math.min(cP.radius, cQ.radius) < (GC.dist(P, Q) / 2) * MIN_SPAN) continue;
      if (twoArcIntersections(P, Q, cP, cQ).length < 2) continue;
      const line = tool.lines.find((l) => lineThroughBoth(l, V, M));
      // Bei der Seitenhalbierenden wird die Verbindung der Bogenschnittpunkte
      // gar nicht gezeichnet — die Gerade läuft von V zum Seitenmittelpunkt.
      // Sie kann das Kreispaar deshalb nicht verraten; es entscheiden die Radien.
      if (line) treffer.push({ circles: [cP, cQ], points: [M], mid: M, line, passung: 0, abweichung: radienAbweichung(cP, cQ) });
    }
  }
  return treffer;
}

// Höhe von V auf die Seite PQ — dieselbe Lot-Konstruktion wie beim Inkreisradius, nur ausgehend vom
// Eckpunkt statt vom Inkreismittelpunkt.
export function findAltitudeAlle(tool, V, P, Q) {
  return findLotAlle(tool, [[P, Q]], V);
}

// Ergebniskreis: Kreis um "center" mit vorgegebenem Radius. Gibt zusätzlich zurück, ob überhaupt ein
// Kreis um diesen Punkt existiert — dann ist nur der Radius falsch, was eine andere Rückmeldung
// verdient als "Kreis fehlt ganz".
function findResultCircle(tool, center, radius) {
  const at = circlesAt(tool, center);
  return { circle: at.find((c) => Math.abs(c.radius - radius) / radius < R_TOL) || null, anyAt: at.length > 0 };
}

function sidesOf(pts) {
  const { A, B, C } = pts;
  return [
    [A, B, "AB"],
    [B, C, "BC"],
    [C, A, "CA"],
  ];
}

function verticesOf(pts) {
  const { A, B, C } = pts;
  return [
    [A, B, C, "A"],
    [B, A, C, "B"],
    [C, A, B, "C"],
  ];
}

// ---------- Gemeinsame Auswertung ----------
// Beide Varianten liefern dieselbe Struktur:
//   spentCircles  Kreise, deren Linie fertig ist → werden grau gezeichnet
//   marks         zusätzliche Kreuze { p, done } (done = grau)
//   snapPoints    Punkte, auf die ein Klick einrasten darf (ohne Kreis-Kreis-Schnittpunkte)
//   result        { ok, msg } der Prüfung

export const TRI_TASKS = {
  mittelsenkrechte: {
    intro: "Konstruiere jetzt alle drei Mittelsenkrechten des Dreiecks und daraus den Umkreis.",
    steps: [
      "Zirkel wählen, in einen Eckpunkt einstechen und auf einen Punkt am gewünschten Radius klicken (größer als die halbe Seitenlänge). Dasselbe am anderen Endpunkt derselben Seite wiederholen.",
      "Mit „🔒 Zirkel-Radius beibehalten“ bleibt der Radius zwischen beiden Kreisen gleich — wie beim echten Zirkel, den man nicht verstellt.",
      "Lineal wählen und die beiden Schnittpunkte der Bögen verbinden — das ist die Mittelsenkrechte dieser Seite. Sobald sie steht, treten ihre Hilfskreise grau zurück. Für alle drei Seiten wiederholen.",
      "Sobald zwei Mittelsenkrechten stehen, rastet ihr Schnittpunkt M (der Umkreismittelpunkt) beim Anklicken ein. Zirkel in M einstechen und den Radius bis zu einem Eckpunkt einstellen, um den Umkreis zu zeichnen.",
      "Mit „Prüfen“ kontrollieren, mit „Tipp“ einen Hinweis bekommen.",
    ],
    why:
      "<strong>Warum klappt das?</strong> Auf der Mittelsenkrechten von AB liegen genau die Punkte, die von A und von B <em>gleich weit</em> entfernt sind. Der Schnittpunkt M zweier Mittelsenkrechten ist damit von allen drei Ecken gleich weit entfernt — deshalb muss die dritte Mittelsenkrechte automatisch durch M laufen, und deshalb gibt es um M einen Kreis durch A, B und C.",

    analyze(tool, pts) {
      const { A, B, C } = pts;
      const parts = sidesOf(pts).map(([P, Q, label]) => ({ label, P, Q, hit: bester(findMediatriceAlle(tool, P, Q)) }));
      const doneCount = parts.filter((p) => p.hit).length;
      const spentCircles = new Set();
      const marks = [];
      for (const part of parts) {
        if (part.hit) {
          part.hit.circles.forEach((c) => spentCircles.add(c));
          part.hit.points.forEach((p) => marks.push({ p, done: true }));
        } else {
          // Noch offen: sobald beide Kreise stehen, sind ihre Schnittpunkte die nächsten Klickziele.
          pairPoints(tool, part.P, part.Q).forEach((p) => marks.push({ p, done: false }));
        }
      }

      // Der Umkreismittelpunkt ist erst konstruiert, wenn sich zwei Mittelsenkrechte schneiden.
      const center = doneCount >= 2 ? GC.circumcenter(A, B, C) : null;
      const radius = center ? GC.dist(center, A) : 0;
      const res = center ? findResultCircle(tool, center, radius) : { circle: null, anyAt: false };
      if (center) marks.push({ p: center, done: !!res.circle });

      return {
        parts,
        doneCount,
        center,
        radius,
        res,
        spentCircles,
        marks,
        // marks enthält bereits alle sinnvollen Punkte — free-ui soll keine weiteren raten.
        autoMarks: false,
        snapPoints: center ? [A, B, C, center] : [A, B, C],
      };
    },

    check(a) {
      const missing = a.parts.find((p) => !p.hit);
      if (missing) {
        return {
          ok: false,
          msg: `Es fehlt noch die Mittelsenkrechte von ${missing.label}: zwei gleich große Kreise um ${missing.label[0]} und ${missing.label[1]} zeichnen (Radius größer als die halbe Seitenlänge) und ihre beiden Schnittpunkte mit dem Lineal verbinden.`,
        };
      }
      if (!a.res.circle) {
        return a.res.anyAt
          ? { ok: false, msg: "Der Kreis um M hat nicht den richtigen Radius — er muss genau durch die drei Eckpunkte A, B und C gehen." }
          : {
              ok: false,
              msg: "Es fehlt noch der Umkreis: Zirkel in den Umkreismittelpunkt M (Schnittpunkt der drei Mittelsenkrechten) einstechen und den Radius bis zu einem Eckpunkt einstellen.",
            };
      }
      return {
        ok: true,
        msg: "Richtig konstruiert! Alle drei Mittelsenkrechten schneiden sich in M, und weil M von A, B und C gleich weit entfernt ist, geht der Kreis um M durch alle drei Ecken — der Umkreis.",
      };
    },
  },

  winkelhalbierende: {
    intro: "Konstruiere jetzt alle drei Winkelhalbierenden des Dreiecks und daraus den Inkreis.",
    steps: [
      "Zirkel wählen, in einen Eckpunkt einstechen und einen Bogen zeichnen, der beide anliegenden Seiten schneidet.",
      "Von den beiden neuen Schnittpunkten aus mit gleichem Radius zwei Bögen zeichnen, die sich kreuzen (Häkchen „Zirkel-Radius beibehalten“ hilft dabei), und den Eckpunkt mit dem Kreuzungspunkt verbinden. Sobald die Winkelhalbierende steht, treten ihre Hilfskreise grau zurück. Für alle drei Ecken wiederholen.",
      "Sobald zwei Winkelhalbierende stehen, rastet ihr Schnittpunkt I beim Anklicken ein. Zirkel in I einstechen und einen Bogen zeichnen, der eine der drei Seiten zweimal schneidet.",
      "Wie beim Lot: von den beiden neuen Schnittpunkten auf der Seite zwei gleich große Kreise zeichnen und I mit ihrem Kreuzungspunkt verbinden — wo dieses Lot die Seite trifft, liegt der Lotfußpunkt.",
      "Zirkel in I einstechen, Radius bis zum Lotfußpunkt einstellen und den Inkreis zeichnen.",
      "Mit „Prüfen“ kontrollieren, mit „Tipp“ einen Hinweis bekommen.",
    ],
    why:
      "<strong>Warum klappt das?</strong> Auf der Winkelhalbierenden liegen genau die Punkte, die von beiden Schenkeln <em>gleich weit</em> entfernt sind — und der Abstand eines Punktes von einer Geraden wird immer über das <em>Lot</em> gemessen. Der Schnittpunkt I zweier Winkelhalbierender hat damit von allen drei Seiten denselben Abstand: Die dritte Winkelhalbierende läuft automatisch durch I, und der Kreis um I mit genau diesem Abstand als Radius berührt alle drei Seiten.",

    analyze(tool, pts) {
      const { A, B, C } = pts;
      const sides = sidesOf(pts);
      const parts = verticesOf(pts).map(([V, P, Q, label]) => ({ label, V, P, Q, hit: bester(findBisectorAlle(tool, V, P, Q)) }));
      const doneCount = parts.filter((p) => p.hit).length;
      const spentCircles = new Set();
      const marks = [];
      const snapPoints = [A, B, C];

      for (const part of parts) {
        if (part.hit) {
          part.hit.circles.forEach((c) => spentCircles.add(c));
          part.hit.points.forEach((p) => marks.push({ p, done: true }));
          continue;
        }
        // Noch nicht fertig: die Schenkelpunkte des ersten Bogens sind die nächsten Klickziele,
        // danach der Schnittpunkt der beiden gleich großen Kreise darum.
        const c0 = circlesAt(tool, part.V).find((c) => c.radius >= 20);
        if (!c0) continue;
        const legs = legPoints(part.V, part.P, part.Q, c0.radius);
        for (const p of legs) {
          marks.push({ p, done: false });
          snapPoints.push(p);
        }
        pairPoints(tool, legs[0], legs[1]).forEach((p) => marks.push({ p, done: false }));
      }

      // Der Inkreismittelpunkt ist erst konstruiert, wenn sich zwei Winkelhalbierende schneiden.
      const center = doneCount >= 2 ? GC.incenter(A, B, C) : null;
      const lot = center ? bester(findLotAlle(tool, sides, center)) : null;
      let radius = 0;
      let res = { circle: null, anyAt: false };

      if (center) {
        snapPoints.push(center);
        if (lot) {
          lot.circles.forEach((c) => spentCircles.add(c));
          lot.points.forEach((p) => marks.push({ p, done: true }));
          snapPoints.push(lot.foot);
          radius = GC.dist(center, lot.foot);
          res = findResultCircle(tool, center, radius);
        } else {
          // Noch kein fertiges Lot: die Schnittpunkte eines Kreises um I mit einer Seite anbieten,
          // danach den Kreuzungspunkt der beiden gleich großen Kreise darum.
          for (const c of circlesAt(tool, center)) {
            const hit = sides.map(([sA, sB]) => GC.circleLineIntersections(c.center, c.radius, sA, sB)).find((h) => h.length === 2);
            if (!hit) continue;
            hit.forEach((p) => {
              marks.push({ p, done: false });
              snapPoints.push(p);
            });
            pairPoints(tool, hit[0], hit[1]).forEach((p) => marks.push({ p, done: false }));
            break;
          }
        }
        marks.push({ p: center, done: !!res.circle });
      }

      return { parts, doneCount, center, lot, radius, res, spentCircles, marks, snapPoints, autoMarks: false };
    },

    check(a) {
      const missing = a.parts.find((p) => !p.hit);
      if (missing) {
        const v = missing.label;
        return {
          ok: false,
          msg: `Es fehlt noch die Winkelhalbierende bei ${v}: Kreis um ${v} zeichnen, der beide anliegenden Seiten schneidet, dann zwei gleich große Kreise um die neuen Schnittpunkte zeichnen und ${v} mit deren Schnittpunkt verbinden.`,
        };
      }
      if (!a.lot) {
        return {
          ok: false,
          msg: "Es fehlt noch das Lot von I auf eine der drei Seiten: Kreis um I zeichnen, der eine Seite an zwei Stellen schneidet, dann zwei gleich große Kreise um diese Schnittpunkte zeichnen und I mit deren Schnittpunkt verbinden.",
        };
      }
      if (!a.res.circle) {
        return a.res.anyAt
          ? { ok: false, msg: "Der Kreis um I hat nicht den richtigen Radius — er muss genau bis zum Lotfußpunkt reichen, damit er die Seite berührt." }
          : { ok: false, msg: "Es fehlt noch der Inkreis: Zirkel in I einstechen und den Radius auf den eben konstruierten Lotfußpunkt einstellen." };
      }
      return {
        ok: true,
        msg: "Richtig konstruiert! Alle drei Winkelhalbierenden schneiden sich in I, und weil I von allen drei Seiten gleich weit entfernt ist, berührt der Kreis um I mit dem Lotabstand als Radius jede Seite genau einmal — der Inkreis.",
      };
    },
  },
};
