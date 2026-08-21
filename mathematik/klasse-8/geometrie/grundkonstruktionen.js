// Grundkonstruktionen mit Zirkel und Lineal: Mittelsenkrechte, Winkelhalbierende, Seitenhalbierende
// und Höhe — je eine geführte, anklickbare Anleitung und ein freies Konstruieren mit Prüfung.
// Bei jedem Laden (und über "Neue Aufgabe") wird eine neue Zufallsaufgabe erzeugt.

import * as GC from "./geo-core.js?v=9";
import * as GS from "./geo-svg.js?v=9";
import { setupCanvasZoom } from "./canvas-zoom.js?v=9";
import { setupDraggableTriangle } from "./triangle-common.js?v=9";

const W = 600,
  H = 420;
const BOX = { w: W, h: H };

const svg = document.getElementById("geo-svg");
const layerGiven = document.getElementById("layer-given");
const layerTriTriangle = document.getElementById("layer-tri-triangle");
const layerConstruct = document.getElementById("layer-construct");
const layerUser = document.getElementById("layer-user");
const layerPoints = document.getElementById("layer-points");
const layerTriVertices = document.getElementById("layer-tri-vertices");

const els = {
  exerciseTabs: document.getElementById("exercise-tabs"),
  phaseTabs: document.getElementById("phase-tabs"),
  instructionBox: document.getElementById("instruction-box"),
  stepsList: document.getElementById("steps-list"),
  feedbackBox: document.getElementById("feedback-box"),
  guidedControls: document.getElementById("guided-controls"),
  freeControls: document.getElementById("free-controls"),
  btnBack: document.getElementById("btn-back"),
  btnNext: document.getElementById("btn-next"),
  btnNewTask: document.getElementById("btn-new-task"),
  btnToolCircle: document.getElementById("btn-tool-circle"),
  btnToolLine: document.getElementById("btn-tool-line"),
  btnUndo: document.getElementById("btn-undo"),
  btnClear: document.getElementById("btn-clear"),
  btnCheck: document.getElementById("btn-check"),
  btnHint: document.getElementById("btn-hint"),
  btnNewTaskFree: document.getElementById("btn-new-task-free"),
  chkLockRadius: document.getElementById("chk-lock-radius"),
  btnResetRadius: document.getElementById("btn-reset-radius"),
  radiusStatus: document.getElementById("radius-status"),
  pendingStatus: document.getElementById("pending-status"),
};

const state = {
  exercise: "mittelsenkrechte",
  phase: "guided", // "guided" | "free" | "free-tri"
  stepIndex: 0,
  task: null,
  tool: null,
};
let steps = [];

// Bei Mittelsenkrechte und Winkelhalbierende gibt es eine dritte Phase: die volle Konstruktion aller
// drei Linien plus Kreis an einem ziehbaren Dreieck (wie auf den eigenen Seiten "Mittelsenkrechte &
// Umkreis" / "Winkelhalbierende & Inkreis"). Seitenhalbierende und Höhe konstruieren schon in ihrer
// normalen "Selbst konstruieren"-Phase an einem Dreieck (nur eine einzelne Linie) — deren zweite
// Phase heißt deshalb zur Konsistenz ebenfalls "... am Dreieck".
const HAS_FREE_TRI = { mittelsenkrechte: true, winkelhalbierende: true, seitenhalbierende: false, hoehe: false };

// Klick-/Prüftoleranz für "dieser Punkt ist gemeint" (SVG-Einheiten). Per Finger wird ungenauer
// getroffen als mit der Maus, deshalb dort ein größerer Radius.
const TOL_PT = GS.COARSE_POINTER ? 24 : 16;

// Prüft, ob eine vom Nutzer gezogene Gerade durch zwei vorgegebene Punkte verläuft. Verglichen wird
// der senkrechte Abstand beider Punkte zur Geraden (Kreuzprodukt mit normierter Richtung).
function lineThroughBoth(l, p1, p2) {
  const d = GC.norm(GC.sub(l.b, l.a));
  const b = GC.add(l.a, d);
  const distToLine = (p) => Math.abs(GC.cross2(l.a, b, p));
  return distToLine(p1) < 12 && distToLine(p2) < 12;
}

// Zwei Kreise "mit demselben Radius" — bei Klickgenauigkeit am Bildschirm mit etwas Spielraum.
function sameRadius(c1, c2) {
  return Math.abs(c1.radius - c2.radius) / Math.max(c1.radius, c2.radius) <= 0.08;
}

// Die beiden Schnittpunkte der zwei gleich großen Kreise um P und Q (mit gemitteltem Radius, damit
// kleine Klickungenauigkeiten nicht zu einer schiefen Verbindungsgeraden führen).
function twoArcIntersections(P, Q, c1, c2) {
  const r = (c1.radius + c2.radius) / 2;
  return GC.circleCircleIntersections(P, r, Q, r);
}

// ---------- Aufgabendefinitionen ----------
// Jede Aufgabe bringt ihre eigene Zufallsfigur, ihre Anleitung, ihre Snap-Punkte und ihre Prüfung
// mit; der Rest der Seite (Umschalten, Rendern, Werkzeuge) ist für alle vier gleich.

const EXERCISES = {
  mittelsenkrechte: {
    newTask: () => GC.randomSegment(W, H),
    drawGiven(task) {
      GS.drawSegment(layerGiven, task.A, task.B);
      GS.drawPoint(layerPoints, task.A, "A");
      GS.drawPoint(layerPoints, task.B, "B");
    },
    guided(task) {
      const { A, B } = task;
      const r = GC.dist(A, B) * 0.58;
      const inter = GC.circleCircleIntersections(A, r, B, r);
      const [P1, P2] = inter.length === 2 ? inter : [GC.mid(A, B), GC.add(GC.mid(A, B), { x: 0, y: -1 })];
      return [
        {
          text: "Stelle den Zirkel auf einen Radius ein, der größer als die Hälfte der Strecke AB ist. Steche in A ein und zeichne einen Bogen oberhalb und unterhalb der Strecke.",
          render: () => {
            GS.drawCompassArc(layerConstruct, A, P1, r, 32, "geo-arc-a");
            GS.drawCompassArc(layerConstruct, A, P2, r, 32, "geo-arc-a");
          },
        },
        {
          text: "Steche jetzt mit demselben Radius in B ein und zeichne wieder einen Bogen oberhalb und unterhalb der Strecke, sodass er den ersten Bogen kreuzt.",
          render: () => {
            GS.drawCompassArc(layerConstruct, B, P1, r, 32, "geo-arc-b");
            GS.drawCompassArc(layerConstruct, B, P2, r, 32, "geo-arc-b");
          },
        },
        {
          text: "Die beiden Bogenpaare schneiden sich in zwei Punkten. Verbinde diese Punkte mit dem Lineal zu einer Geraden — das ist die Mittelsenkrechte von AB.",
          render: () => {
            GS.drawCross(layerConstruct, P1, "geo-schnitt-stark");
            GS.drawCross(layerConstruct, P2, "geo-schnitt-stark");
            GS.drawLine(layerConstruct, GC.mid(A, B), GC.perp(GC.sub(B, A)), BOX, "geo-construct geo-mittelsenkrechte");
          },
        },
      ];
    },
    done: "Fertig! Jeder Punkt auf der Mittelsenkrechten ist gleich weit von A und von B entfernt.",
    freeText:
      "Konstruiere die Mittelsenkrechte von AB selbst: Zeichne mit dem Zirkel zwei gleich große Kreise um A und um B (Radius größer als die halbe Strecke AB) und verbinde die beiden Schnittpunkte mit dem Lineal.",
    snapPoints: (task) => [task.A, task.B],
    check(task, tool) {
      const { A, B } = task;
      const cA = tool.circles.find((c) => GC.dist(c.center, A) < TOL_PT);
      const cB = tool.circles.find((c) => c !== cA && GC.dist(c.center, B) < TOL_PT);
      if (!cA || !cB) {
        const missing = !cA ? "A" : "B";
        return { ok: false, msg: `Es fehlt noch ein Kreis mit Mittelpunkt in ${missing}. Zirkel wählen und zuerst auf ${missing} klicken.` };
      }
      if (!sameRadius(cA, cB)) {
        return { ok: false, msg: "Die beiden Kreise müssen denselben Radius haben — der Zirkel wird zwischen den beiden Bögen nicht verstellt. Tipp: Häkchen „Zirkel-Radius beibehalten“ setzen." };
      }
      if (Math.min(cA.radius, cB.radius) < (GC.dist(A, B) / 2) * 1.02) {
        return { ok: false, msg: "Der Radius ist zu klein — er muss größer als die Hälfte der Strecke AB sein, sonst schneiden sich die Kreise nicht." };
      }
      const inter = twoArcIntersections(A, B, cA, cB);
      if (inter.length < 2) return { ok: false, msg: "Die Kreise schneiden sich nicht in zwei Punkten. Radius vergrößern." };
      if (!tool.lines.some((l) => lineThroughBoth(l, inter[0], inter[1]))) {
        return { ok: false, msg: "Es fehlt noch die Gerade durch die beiden Schnittpunkte der Bögen. Lineal wählen und beide Kreuze anklicken." };
      }
      return { ok: true, msg: "Richtig konstruiert! Das ist die Mittelsenkrechte von AB — jeder Punkt auf ihr ist gleich weit von A und B entfernt." };
    },
  },

  winkelhalbierende: {
    newTask: () => GC.randomAngle(W, H),
    drawGiven(task) {
      // Nur der Scheitelpunkt und die beiden Schenkel sind gegeben — auf den Schenkeln liegen
      // bewusst keine markierten Punkte, denn die entstehen erst durch den ersten Zirkelschlag.
      const { S, P, Q } = task;
      GS.drawSegment(layerGiven, S, GC.add(S, GC.scale(GC.sub(P, S), 1.15)));
      GS.drawSegment(layerGiven, S, GC.add(S, GC.scale(GC.sub(Q, S), 1.15)));
      GS.drawPoint(layerPoints, S, "S");
    },
    guided(task) {
      const { S: V, P, Q } = task;
      const r0 = Math.min(GC.dist(V, P), GC.dist(V, Q)) * 0.62;
      const P1 = GC.add(V, GC.scale(GC.norm(GC.sub(P, V)), r0));
      const Q1 = GC.add(V, GC.scale(GC.norm(GC.sub(Q, V)), r0));
      const r1 = GC.dist(P1, Q1) * 0.72;
      const bisDir = GC.angleBisectorDir(V, P, Q);
      const cand = GC.circleCircleIntersections(P1, r1, Q1, r1);
      let M = cand[0] || GC.add(V, GC.scale(bisDir, 120));
      if (cand.length === 2) M = GC.dot(GC.sub(cand[0], V), bisDir) >= GC.dot(GC.sub(cand[1], V), bisDir) ? cand[0] : cand[1];
      return [
        {
          text: "Steche mit dem Zirkel in den Scheitelpunkt S ein und zeichne einen Bogen, der beide Schenkel des Winkels schneidet.",
          render: () => {
            GS.drawArcSpan(layerConstruct, V, r0, GC.angleOf(GC.sub(P1, V)), GC.angleOf(GC.sub(Q1, V)), "geo-arc-a");
          },
        },
        {
          text: "Steche nacheinander in die beiden neuen Schnittpunkte auf den Schenkeln ein und zeichne mit demselben Radius je einen Bogen zur Mitte des Winkels hin, sodass sie sich kreuzen.",
          render: () => {
            GS.drawCross(layerConstruct, P1, "geo-schnitt-stark");
            GS.drawCross(layerConstruct, Q1, "geo-schnitt-stark");
            GS.drawCompassArc(layerConstruct, P1, M, r1, 34, "geo-arc-b");
            GS.drawCompassArc(layerConstruct, Q1, M, r1, 34, "geo-arc-c");
          },
        },
        {
          text: "Verbinde den Scheitelpunkt S mit dem neuen Schnittpunkt — das ist die Winkelhalbierende.",
          render: () => {
            GS.drawCross(layerConstruct, M, "geo-schnitt-stark");
            const far = GC.add(V, GC.scale(GC.norm(GC.sub(M, V)), Math.max(W, H) * 1.3));
            GS.drawSegment(layerConstruct, V, far, "geo-construct geo-winkelhalbierende");
          },
        },
      ];
    },
    done: "Fertig! Jeder Punkt auf der Winkelhalbierenden ist gleich weit von beiden Schenkeln entfernt.",
    freeText:
      "Konstruiere die Winkelhalbierende selbst: Zeichne zunächst einen Kreis um S, der beide Schenkel schneidet. Zeichne dann zwei gleich große Kreise um diese beiden Schnittpunkte und verbinde S mit ihrem Schnittpunkt.",
    snapPoints(task, tool) {
      // Einrasten nur auf den Scheitelpunkt und auf die Punkte, die die Konstruktion selbst
      // erzeugt hat — die (unsichtbaren) Hilfspunkte P und Q auf den Schenkeln sind keine
      // Konstruktionspunkte und wären als Klickziel irreführend.
      const { S, P, Q } = task;
      const c0 = tool.circles.find((c) => GC.dist(c.center, S) < TOL_PT);
      if (!c0) return [S];
      return [S, GC.add(S, GC.scale(GC.norm(GC.sub(P, S)), c0.radius)), GC.add(S, GC.scale(GC.norm(GC.sub(Q, S)), c0.radius))];
    },
    markPoints(task, tool) {
      const { S, P, Q } = task;
      const c0 = tool.circles.find((c) => GC.dist(c.center, S) < TOL_PT);
      if (!c0) return [];
      return [GC.add(S, GC.scale(GC.norm(GC.sub(P, S)), c0.radius)), GC.add(S, GC.scale(GC.norm(GC.sub(Q, S)), c0.radius))];
    },
    check(task, tool) {
      const { S: V, P, Q } = task;
      const c0 = tool.circles.find((c) => GC.dist(c.center, V) < TOL_PT);
      if (!c0) return { ok: false, msg: "Es fehlt der erste Kreis mit Mittelpunkt im Scheitelpunkt S. Zirkel wählen und zuerst auf S klicken." };
      const maxR0 = Math.min(GC.dist(V, P), GC.dist(V, Q));
      if (c0.radius < 20) return { ok: false, msg: "Der erste Bogen um S ist zu klein. Größeren Radius wählen." };
      if (c0.radius > maxR0 * 1.05) return { ok: false, msg: "Der erste Bogen um S ist zu groß — er muss beide Schenkel schneiden, bevor sie enden." };
      const P1 = GC.add(V, GC.scale(GC.norm(GC.sub(P, V)), c0.radius));
      const Q1 = GC.add(V, GC.scale(GC.norm(GC.sub(Q, V)), c0.radius));
      const others = tool.circles.filter((c) => c !== c0);
      const c1 = others.find((c) => GC.dist(c.center, P1) < TOL_PT);
      const c2 = others.find((c) => c !== c1 && GC.dist(c.center, Q1) < TOL_PT);
      if (!c1 || !c2) return { ok: false, msg: "Es fehlen noch die beiden Kreise um die Schnittpunkte auf den Schenkeln (die beiden Kreuze), mit gleichem Radius." };
      if (!sameRadius(c1, c2)) return { ok: false, msg: "Die beiden neuen Kreise müssen denselben Radius haben. Tipp: Häkchen „Zirkel-Radius beibehalten“ setzen." };
      if (Math.min(c1.radius, c2.radius) < (GC.dist(P1, Q1) / 2) * 1.02) {
        return { ok: false, msg: "Der Radius der beiden neuen Kreise ist zu klein — sie müssen sich schneiden." };
      }
      const inter = twoArcIntersections(P1, Q1, c1, c2);
      if (inter.length < 2) return { ok: false, msg: "Die beiden neuen Kreise schneiden sich nicht. Radius vergrößern." };
      const bisDir = GC.angleBisectorDir(V, P, Q);
      const M = GC.dot(GC.sub(inter[0], V), bisDir) >= GC.dot(GC.sub(inter[1], V), bisDir) ? inter[0] : inter[1];
      if (!tool.lines.some((l) => lineThroughBoth(l, V, M))) {
        return { ok: false, msg: "Es fehlt noch die Gerade vom Scheitelpunkt S durch den neuen Schnittpunkt." };
      }
      return { ok: true, msg: "Richtig konstruiert! Das ist die Winkelhalbierende — jeder Punkt auf ihr ist gleich weit von beiden Schenkeln entfernt." };
    },
  },

  seitenhalbierende: {
    newTask: () => GC.randomTriangleForMedian(W, H),
    drawGiven(task) {
      drawTriangle(task);
    },
    guided(task) {
      const { A, B, C } = task;
      const r = GC.dist(A, B) * 0.58;
      const inter = GC.circleCircleIntersections(A, r, B, r);
      const [P1, P2] = inter.length === 2 ? inter : [GC.mid(A, B), GC.add(GC.mid(A, B), { x: 0, y: -1 })];
      const M = GC.mid(A, B);
      return [
        {
          text: "Die Seitenhalbierende geht vom Eckpunkt C zum Mittelpunkt der Gegenseite AB. Zuerst wird dieser Mittelpunkt konstruiert: Zirkel auf mehr als die halbe Strecke AB einstellen, in A einstechen und Bögen ober- und unterhalb zeichnen.",
          render: () => {
            GS.drawCompassArc(layerConstruct, A, P1, r, 32, "geo-arc-a");
            GS.drawCompassArc(layerConstruct, A, P2, r, 32, "geo-arc-a");
          },
        },
        {
          text: "Mit demselben Radius in B einstechen und die Bögen ebenfalls ober- und unterhalb zeichnen, sodass sie die ersten kreuzen.",
          render: () => {
            GS.drawCompassArc(layerConstruct, B, P1, r, 32, "geo-arc-b");
            GS.drawCompassArc(layerConstruct, B, P2, r, 32, "geo-arc-b");
          },
        },
        {
          text: "Die Verbindung der beiden Kreuzungspunkte ist die Mittelsenkrechte von AB. Dort, wo sie die Seite AB schneidet, liegt deren Mittelpunkt M.",
          render: () => {
            GS.drawCross(layerConstruct, P1, "geo-schnitt-stark");
            GS.drawCross(layerConstruct, P2, "geo-schnitt-stark");
            GS.drawSegment(layerConstruct, P1, P2, "geo-hilfslinie");
            GS.drawPoint(layerConstruct, M, "M", "geo-marked-point");
          },
        },
        {
          text: "Verbinde den Eckpunkt C mit dem Mittelpunkt M — das ist die Seitenhalbierende von C auf AB.",
          render: () => {
            GS.drawPoint(layerConstruct, M, "M", "geo-marked-point");
            GS.drawSegment(layerConstruct, C, M, "geo-construct geo-seitenhalbierende");
          },
        },
      ];
    },
    done: "Fertig! Alle drei Seitenhalbierenden eines Dreiecks schneiden sich in einem Punkt — dem Schwerpunkt.",
    freeText:
      "Konstruiere die Seitenhalbierende von C auf die Seite AB: Konstruiere zuerst mit zwei gleich großen Kreisen um A und um B den Mittelpunkt M von AB und verbinde dann C mit M.",
    snapPoints(task, tool) {
      // Sobald zwei gleich große Kreise um A und B existieren, ist der Seitenmittelpunkt
      // konstruiert und wird als exakt anklickbarer Punkt angeboten.
      const base = [task.A, task.B, task.C];
      return midpointIfConstructed(task, tool) ? base.concat([GC.mid(task.A, task.B)]) : base;
    },
    markPoints(task, tool) {
      return midpointIfConstructed(task, tool) ? [GC.mid(task.A, task.B)] : [];
    },
    check(task, tool) {
      const { A, B, C } = task;
      const cA = tool.circles.find((c) => GC.dist(c.center, A) < TOL_PT);
      const cB = tool.circles.find((c) => c !== cA && GC.dist(c.center, B) < TOL_PT);
      if (!cA || !cB) {
        const missing = !cA ? "A" : "B";
        return { ok: false, msg: `Für den Mittelpunkt von AB fehlt noch ein Kreis um ${missing}. Zirkel wählen und auf ${missing} klicken.` };
      }
      if (!sameRadius(cA, cB)) {
        return { ok: false, msg: "Die beiden Kreise um A und B müssen denselben Radius haben. Tipp: Häkchen „Zirkel-Radius beibehalten“ setzen." };
      }
      if (Math.min(cA.radius, cB.radius) < (GC.dist(A, B) / 2) * 1.02) {
        return { ok: false, msg: "Der Radius ist zu klein — er muss größer als die halbe Strecke AB sein, sonst schneiden sich die Kreise nicht." };
      }
      const M = GC.mid(A, B);
      if (!tool.lines.some((l) => lineThroughBoth(l, C, M))) {
        return { ok: false, msg: "Es fehlt noch die Strecke von C zum Mittelpunkt M der Seite AB. Lineal wählen, auf C und dann auf M klicken." };
      }
      return { ok: true, msg: "Richtig konstruiert! Das ist die Seitenhalbierende von C — sie halbiert die Seite AB genau." };
    },
  },

  hoehe: {
    newTask: () => GC.randomTriangleForHeight(W, H),
    drawGiven(task) {
      drawTriangle(task);
    },
    guided(task) {
      const { A, B, C } = task;
      const foot = GC.footOfPerpendicular(C, A, B);
      const height = GC.dist(C, foot);
      // Der Radius wird bewusst so gewählt, dass beide Schnittpunkte auf der *gezeichneten* Seite
      // AB liegen: Der Abstand vom Fußpunkt zum näheren Endpunkt begrenzt, wie weit die Bögen
      // reichen dürfen. Sonst würden Bögen entstehen, die die Seite gar nicht treffen.
      const s = GC.footParam(foot, A, B);
      const abLen = GC.dist(A, B);
      const half = Math.min(s, 1 - s) * abLen * 0.72;
      const r0 = Math.hypot(height, half);
      const [X1, X2] = GC.circleLineIntersections(C, r0, A, B);
      const r1 = GC.dist(X1, X2) * 0.62;
      const cand = GC.circleCircleIntersections(X1, r1, X2, r1);
      // Von den beiden Schnittpunkten der Hilfskreise der auf der anderen Seite von AB als C.
      const Y = cand.length === 2 ? (GC.cross2(A, B, cand[0]) * GC.cross2(A, B, C) < 0 ? cand[0] : cand[1]) : foot;
      return [
        {
          text: "Die Höhe von C steht senkrecht auf der Gegenseite AB. Steche mit dem Zirkel in C ein und zeichne einen Kreisbogen, der die Seite AB an zwei Stellen schneidet.",
          render: () => {
            GS.drawCompassArc(layerConstruct, C, X1, r0, 20, "geo-arc-a");
            GS.drawCompassArc(layerConstruct, C, X2, r0, 20, "geo-arc-a");
          },
        },
        {
          text: "Steche nacheinander in diese beiden Schnittpunkte ein und zeichne mit gleichem Radius zwei Bögen auf der von C abgewandten Seite, sodass sie sich kreuzen.",
          render: () => {
            GS.drawCross(layerConstruct, X1, "geo-schnitt-stark");
            GS.drawCross(layerConstruct, X2, "geo-schnitt-stark");
            GS.drawCompassArc(layerConstruct, X1, Y, r1, 30, "geo-arc-b");
            GS.drawCompassArc(layerConstruct, X2, Y, r1, 30, "geo-arc-c");
          },
        },
        {
          text: "Verbinde C mit diesem Kreuzungspunkt. Die Gerade trifft AB im rechten Winkel — der Schnittpunkt ist der Höhenfußpunkt F.",
          render: () => {
            GS.drawCross(layerConstruct, Y, "geo-schnitt-stark");
            GS.drawSegment(layerConstruct, C, Y, "geo-construct geo-hoehe");
            GS.drawRightAngleMarker(layerConstruct, foot, C, B, "geo-hoehe");
            GS.drawPoint(layerConstruct, foot, "F", "geo-marked-point");
          },
        },
      ];
    },
    done: "Fertig! Die Strecke von C bis zum Fußpunkt F ist die Höhe des Dreiecks über der Seite AB.",
    freeText:
      "Konstruiere die Höhe von C auf die Seite AB: Zeichne einen Kreis um C, der AB zweimal schneidet. Zeichne um diese beiden Punkte zwei gleich große Kreise und verbinde C mit ihrem Schnittpunkt.",
    snapPoints(task, tool) {
      const base = [task.A, task.B, task.C];
      return base.concat(heightHelperPoints(task, tool));
    },
    markPoints(task, tool) {
      return heightHelperPoints(task, tool);
    },
    extraDraw(task, tool, layer) {
      // Wählt der Schüler einen größeren Radius, treffen die Bögen die Gerade AB außerhalb der
      // gezeichneten Seite — dann wird sie gestrichelt verlängert.
      drawSideExtension(layer, task.A, task.B, heightHelperPoints(task, tool));
    },
    check(task, tool) {
      const { A, B, C } = task;
      const cC = tool.circles.find((c) => GC.dist(c.center, C) < TOL_PT);
      if (!cC) return { ok: false, msg: "Es fehlt der Kreis um den Eckpunkt C. Zirkel wählen und zuerst auf C klicken." };
      const hits = GC.circleLineIntersections(C, cC.radius, A, B);
      if (hits.length < 2) {
        return { ok: false, msg: "Der Kreis um C schneidet die Gerade AB nicht an zwei Stellen — wähle einen größeren Radius." };
      }
      const [X1, X2] = hits;
      const others = tool.circles.filter((c) => c !== cC);
      const c1 = others.find((c) => GC.dist(c.center, X1) < TOL_PT);
      const c2 = others.find((c) => c !== c1 && GC.dist(c.center, X2) < TOL_PT);
      if (!c1 || !c2) {
        return { ok: false, msg: "Es fehlen noch die beiden Kreise um die Schnittpunkte auf AB (die beiden Kreuze), mit gleichem Radius." };
      }
      if (!sameRadius(c1, c2)) {
        return { ok: false, msg: "Die beiden Kreise müssen denselben Radius haben. Tipp: Häkchen „Zirkel-Radius beibehalten“ setzen." };
      }
      if (Math.min(c1.radius, c2.radius) < (GC.dist(X1, X2) / 2) * 1.02) {
        return { ok: false, msg: "Der Radius der beiden Kreise ist zu klein — sie müssen sich kreuzen." };
      }
      const foot = GC.footOfPerpendicular(C, A, B);
      if (!tool.lines.some((l) => lineThroughBoth(l, C, foot))) {
        return { ok: false, msg: "Es fehlt noch die Gerade von C durch den Kreuzungspunkt der beiden Bögen." };
      }
      return { ok: true, msg: "Richtig konstruiert! Die Gerade steht senkrecht auf AB — die Strecke von C bis zum Fußpunkt ist die Höhe." };
    },
  },
};

// ---------- Phase 3 (nur Mittelsenkrechte/Winkelhalbierende): Selbst konstruieren am Dreieck ----------
// Volle Konstruktion aller drei Mittelsenkrechten + Umkreis bzw. aller drei Winkelhalbierenden +
// Inkreis an einem ziehbaren Dreieck — dieselbe Prüflogik wie auf den eigenen Seiten
// "Mittelsenkrechte & Umkreis" / "Winkelhalbierende & Inkreis".

function sidesOfTri(pts) {
  const { A, B, C } = pts;
  return [
    [A, B, "AB"],
    [B, C, "BC"],
    [C, A, "CA"],
  ];
}

// true, sobald zwei gleich große, ausreichend große Kreise um P und Q sowie die Verbindungsgerade
// ihrer Schnittpunkte gezeichnet sind. Da jeder Eckpunkt zu zwei Seiten gehört, kann es dort mehrere
// Kreise geben — deshalb werden alle Kombinationen durchprobiert statt nur der ersten gefundenen.
function mediatriceOkTri(P, Q) {
  const candP = state.tool.circles.filter((c) => GC.dist(c.center, P) < TOL_PT);
  const candQ = state.tool.circles.filter((c) => GC.dist(c.center, Q) < TOL_PT);
  for (const cP of candP) {
    for (const cQ of candQ) {
      if (cP === cQ || !sameRadius(cP, cQ)) continue;
      if (Math.min(cP.radius, cQ.radius) < (GC.dist(P, Q) / 2) * 1.02) continue;
      const inter = twoArcIntersections(P, Q, cP, cQ);
      if (inter.length < 2) continue;
      if (state.tool.lines.some((l) => lineThroughBoth(l, inter[0], inter[1]))) return true;
    }
  }
  return false;
}

function doneSidesCountTri() {
  return sidesOfTri(triFree.pts).filter(([P, Q]) => mediatriceOkTri(P, Q)).length;
}

function freeSnapPointsMS() {
  const { A, B, C } = triFree.pts;
  const base = [A, B, C];
  if (doneSidesCountTri() >= 2) base.push(GC.circumcenter(A, B, C));
  return base;
}

function renderUserMarkersMS() {
  if (doneSidesCountTri() >= 2) {
    GS.drawCross(layerUser, GC.circumcenter(triFree.pts.A, triFree.pts.B, triFree.pts.C), "geo-schnitt-stark");
  }
}

function checkFreeMS() {
  const { A, B, C } = triFree.pts;
  for (const [P, Q, label] of sidesOfTri(triFree.pts)) {
    if (!mediatriceOkTri(P, Q)) {
      return {
        ok: false,
        msg: `Es fehlt noch die Mittelsenkrechte von ${label}: zwei gleich große Kreise um ${label[0]} und ${label[1]} zeichnen (Radius größer als die halbe Seitenlänge) und ihre beiden Schnittpunkte mit dem Lineal verbinden.`,
      };
    }
  }
  const O = GC.circumcenter(A, B, C);
  const rTarget = GC.dist(O, A);
  const cO = state.tool.circles.find((c) => GC.dist(c.center, O) < TOL_PT && Math.abs(c.radius - rTarget) / rTarget < 0.05);
  const anyAtO = state.tool.circles.some((c) => GC.dist(c.center, O) < TOL_PT);
  if (!cO) {
    return anyAtO
      ? { ok: false, msg: "Der Kreis um M hat nicht den richtigen Radius — er muss genau durch die drei Eckpunkte A, B und C gehen." }
      : {
          ok: false,
          msg: "Es fehlt noch der Umkreis: Zirkel in den Umkreismittelpunkt M (Schnittpunkt der drei Mittelsenkrechten) einstechen und den Radius bis zu einem Eckpunkt einstellen.",
        };
  }
  return { ok: true, msg: "Richtig konstruiert! Alle drei Mittelsenkrechten schneiden sich in M, und der Kreis um M durch die Eckpunkte ist der Umkreis." };
}

function verticesOfTri(pts) {
  const { A, B, C } = pts;
  return [
    [A, B, C, "A"],
    [B, A, C, "B"],
    [C, A, B, "C"],
  ];
}

// Die beiden Schnittpunkte des ersten Bogens um V mit den Schenkeln VP und VQ, sobald dieser Bogen
// gezeichnet ist — Hilfspunkte für die Winkelhalbierende bei V.
function vertexHelperPointsTri(V, P, Q) {
  const c0 = state.tool.circles.find((c) => GC.dist(c.center, V) < TOL_PT);
  if (!c0) return [];
  return [GC.add(V, GC.scale(GC.norm(GC.sub(P, V)), c0.radius)), GC.add(V, GC.scale(GC.norm(GC.sub(Q, V)), c0.radius))];
}

// true, sobald die Winkelhalbierende bei V (mit Schenkeln nach P und Q) vollständig konstruiert ist.
// Am Ende der Konstruktion liegen alle Kreise aller drei Ecken plus die des Lots und des Inkreises
// gleichzeitig in state.tool.circles — deshalb werden für jeden Schritt alle passenden Kandidaten
// durchprobiert statt nur des jeweils ersten gefundenen Kreises.
function bisectorOkTri(V, P, Q) {
  const maxR0 = Math.min(GC.dist(V, P), GC.dist(V, Q));
  const c0Candidates = state.tool.circles.filter((c) => GC.dist(c.center, V) < TOL_PT && c.radius >= 20 && c.radius <= maxR0 * 1.05);
  for (const c0 of c0Candidates) {
    const P1 = GC.add(V, GC.scale(GC.norm(GC.sub(P, V)), c0.radius));
    const Q1 = GC.add(V, GC.scale(GC.norm(GC.sub(Q, V)), c0.radius));
    const cand1 = state.tool.circles.filter((c) => c !== c0 && GC.dist(c.center, P1) < TOL_PT);
    const cand2 = state.tool.circles.filter((c) => c !== c0 && GC.dist(c.center, Q1) < TOL_PT);
    for (const c1 of cand1) {
      for (const c2 of cand2) {
        if (c1 === c2 || !sameRadius(c1, c2)) continue;
        if (Math.min(c1.radius, c2.radius) < (GC.dist(P1, Q1) / 2) * 1.02) continue;
        const inter = twoArcIntersections(P1, Q1, c1, c2);
        if (inter.length < 2) continue;
        const bisDir = GC.angleBisectorDir(V, P, Q);
        const M = GC.dot(GC.sub(inter[0], V), bisDir) >= GC.dot(GC.sub(inter[1], V), bisDir) ? inter[0] : inter[1];
        if (state.tool.lines.some((l) => lineThroughBoth(l, V, M))) return true;
      }
    }
  }
  return false;
}

function doneBisectorsCountTri() {
  return verticesOfTri(triFree.pts).filter(([V, P, Q]) => bisectorOkTri(V, P, Q)).length;
}

// Sucht unter den Kreisen um I einen, der eine der drei Seiten an zwei Stellen schneidet, und prüft,
// ob von dort aus (über zwei gleich große Kreise) das Lot zu I gezogen wurde. Gibt den Lotfußpunkt
// zurück, sobald eine Seite so vollständig konstruiert ist — sonst null.
function lotFootOkTri(I) {
  const sides = sidesOfTri(triFree.pts);
  for (const cI of state.tool.circles.filter((c) => GC.dist(c.center, I) < TOL_PT)) {
    for (const [sA, sB] of sides) {
      const hits = GC.circleLineIntersections(I, cI.radius, sA, sB);
      if (hits.length < 2) continue;
      const [X1, X2] = hits;
      const cand1 = state.tool.circles.filter((c) => c !== cI && GC.dist(c.center, X1) < TOL_PT);
      const cand2 = state.tool.circles.filter((c) => c !== cI && GC.dist(c.center, X2) < TOL_PT);
      for (const c1 of cand1) {
        for (const c2 of cand2) {
          if (c1 === c2 || !sameRadius(c1, c2)) continue;
          if (Math.min(c1.radius, c2.radius) < (GC.dist(X1, X2) / 2) * 1.02) continue;
          const foot = GC.footOfPerpendicular(I, sA, sB);
          if (state.tool.lines.some((l) => lineThroughBoth(l, I, foot))) return foot;
        }
      }
    }
  }
  return null;
}

// Nur zur Anzeige: die Schnittpunkte irgendeines (noch nicht notwendig fertigen) Kreises um I mit
// einer der drei Seiten, damit sie beim Konstruieren als Kreuz sichtbar und anklickbar sind.
function lotHelperPointsTri(I) {
  const sides = sidesOfTri(triFree.pts);
  for (const c of state.tool.circles.filter((c) => GC.dist(c.center, I) < TOL_PT)) {
    for (const [sA, sB] of sides) {
      const hits = GC.circleLineIntersections(c.center, c.radius, sA, sB);
      if (hits.length === 2) return hits;
    }
  }
  return [];
}

function freeSnapPointsWH() {
  const { A, B, C } = triFree.pts;
  let base = [A, B, C];
  for (const [V, P, Q] of verticesOfTri(triFree.pts)) base = base.concat(vertexHelperPointsTri(V, P, Q));
  if (doneBisectorsCountTri() >= 2) {
    const I = GC.incenter(A, B, C);
    base.push(I);
    base = base.concat(lotHelperPointsTri(I));
  }
  return base;
}

function renderUserMarkersWH() {
  for (const [V, P, Q] of verticesOfTri(triFree.pts)) {
    vertexHelperPointsTri(V, P, Q).forEach((p) => GS.drawCross(layerUser, p, "geo-schnitt-stark"));
  }
  if (doneBisectorsCountTri() >= 2) {
    const I = GC.incenter(triFree.pts.A, triFree.pts.B, triFree.pts.C);
    GS.drawCross(layerUser, I, "geo-schnitt-stark");
    lotHelperPointsTri(I).forEach((p) => GS.drawCross(layerUser, p, "geo-schnitt-stark"));
  }
}

function checkFreeWH() {
  const { A, B, C } = triFree.pts;
  for (const [V, P, Q, label] of verticesOfTri(triFree.pts)) {
    if (!bisectorOkTri(V, P, Q)) {
      return {
        ok: false,
        msg: `Es fehlt noch die Winkelhalbierende bei ${label}: Kreis um ${label} zeichnen, der beide anliegenden Seiten schneidet, dann zwei gleich große Kreise um die neuen Schnittpunkte zeichnen und ${label} mit deren Schnittpunkt verbinden.`,
      };
    }
  }
  const I = GC.incenter(A, B, C);
  const foot = lotFootOkTri(I);
  if (!foot) {
    return {
      ok: false,
      msg: "Es fehlt noch das Lot von I auf eine der drei Seiten: Kreis um I zeichnen, der eine Seite an zwei Stellen schneidet, dann zwei gleich große Kreise um diese Schnittpunkte zeichnen und I mit deren Schnittpunkt verbinden.",
    };
  }
  const r = GC.dist(I, foot);
  const cI = state.tool.circles.find((c) => GC.dist(c.center, I) < TOL_PT && Math.abs(c.radius - r) / r < 0.05);
  if (!cI) {
    return { ok: false, msg: "Es fehlt noch der Inkreis: Zirkel in I einstechen und den Radius auf den eben konstruierten Lotfußpunkt einstellen." };
  }
  return { ok: true, msg: "Richtig konstruiert! Alle drei Winkelhalbierenden schneiden sich in I, und der Kreis um I mit dem Lotabstand als Radius ist der Inkreis — er berührt alle drei Seiten." };
}

function freeTriSnapPoints() {
  return state.exercise === "mittelsenkrechte" ? freeSnapPointsMS() : freeSnapPointsWH();
}
function renderTriUserMarkers() {
  if (state.exercise === "mittelsenkrechte") renderUserMarkersMS();
  else renderUserMarkersWH();
}
function checkFreeTri() {
  return state.exercise === "mittelsenkrechte" ? checkFreeMS() : checkFreeWH();
}

const MS_TRI_STEPS = `
  <li>Zirkel wählen, in einen Eckpunkt einstechen und auf einen Punkt am gewünschten Radius klicken (größer als die halbe Seitenlänge). Dasselbe am anderen Endpunkt derselben Seite wiederholen.</li>
  <li>Mit „🔒 Zirkel-Radius beibehalten“ bleibt der Radius zwischen beiden Kreisen gleich.</li>
  <li>Lineal wählen und die beiden Schnittpunkte der Bögen verbinden — das ist die Mittelsenkrechte dieser Seite. Für alle drei Seiten wiederholen.</li>
  <li>Sobald zwei Mittelsenkrechten stehen, rastet ihr Schnittpunkt M (der Umkreismittelpunkt) beim Anklicken ein. Zirkel in M einstechen und den Radius bis zu einem Eckpunkt einstellen, um den Umkreis zu zeichnen.</li>
  <li>Mit „Prüfen“ kontrollieren, mit „Tipp“ einen Hinweis bekommen.</li>
`;
const WH_TRI_STEPS = `
  <li>Zirkel wählen, in einen Eckpunkt einstechen und einen Bogen zeichnen, der beide anliegenden Seiten schneidet.</li>
  <li>Von den beiden neuen Schnittpunkten aus mit gleichem Radius zwei Bögen zeichnen, die sich kreuzen (Häkchen „Zirkel-Radius beibehalten“ hilft dabei), und den Eckpunkt mit dem Kreuzungspunkt verbinden. Für zwei der drei Ecken wiederholen — die dritte trifft automatisch denselben Punkt I.</li>
  <li>Sobald zwei Winkelhalbierende stehen, rastet ihr Schnittpunkt I beim Anklicken ein. Zirkel in I einstechen und einen Bogen zeichnen, der eine der drei Seiten schneidet.</li>
  <li>Wie beim Lot: von den beiden neuen Schnittpunkten auf der Seite zwei gleich große Kreise zeichnen und I mit ihrem Kreuzungspunkt verbinden — das ist der Lotfußpunkt.</li>
  <li>Zirkel in I einstechen, Radius bis zum Lotfußpunkt einstellen und den Inkreis zeichnen.</li>
  <li>Mit „Prüfen“ kontrollieren, mit „Tipp“ einen Hinweis bekommen.</li>
`;

function updateFreeTriInstruction() {
  const text =
    state.exercise === "mittelsenkrechte"
      ? "Konstruiere jetzt alle drei Mittelsenkrechten des Dreiecks und daraus den Umkreis."
      : "Konstruiere jetzt alle drei Winkelhalbierenden des Dreiecks und daraus den Inkreis.";
  els.instructionBox.innerHTML = `<p>${text}</p>`;
  els.stepsList.innerHTML = state.exercise === "mittelsenkrechte" ? MS_TRI_STEPS : WH_TRI_STEPS;
}

function showTriVertices(show) {
  layerTriVertices.style.display = show ? "" : "none";
}

function renderTriSides(pts) {
  GS.clearEl(layerTriTriangle);
  const { A, B, C } = pts;
  GS.drawSegment(layerTriTriangle, A, B);
  GS.drawSegment(layerTriTriangle, B, C);
  GS.drawSegment(layerTriTriangle, C, A);
}

function onTriUpdate(pts) {
  if (state.phase === "free-tri") renderTriSides(pts);
}

function enterFreeTri() {
  GS.clearEl(layerGiven);
  GS.clearEl(layerPoints);
  GS.clearEl(layerConstruct);
  showTriVertices(true);
  triFree.setLocked(true);
  renderTriSides(triFree.pts);
  state.tool.setMode(null);
  state.tool.reset();
  setActiveToolBtn(null);
  updateFreeTriInstruction();
  updateStatus();
  els.feedbackBox.hidden = true;
}

// Die beiden Schnittpunkte des Nutzerkreises um C mit der Geraden AB (Hilfspunkte der Höhe).
function heightHelperPoints(task, tool) {
  const cC = tool.circles.find((c) => GC.dist(c.center, task.C) < TOL_PT);
  if (!cC) return [];
  return GC.circleLineIntersections(task.C, cC.radius, task.A, task.B);
}

// Liegen konstruierte Punkte außerhalb der gezeichneten Strecke AB, wird die Seite gestrichelt so
// weit verlängert, dass sie diese Punkte erreicht — sonst schwebten Schnittpunkte scheinbar neben
// der Seite, ohne sie zu berühren.
function drawSideExtension(layer, A, B, points) {
  let tMin = 0,
    tMax = 1;
  for (const p of points) {
    const t = GC.footParam(p, A, B);
    tMin = Math.min(tMin, t);
    tMax = Math.max(tMax, t);
  }
  if (tMin > -0.02 && tMax < 1.02) return;
  const d = GC.sub(B, A);
  const pad = 0.05;
  GS.drawSegment(layer, GC.add(A, GC.scale(d, tMin - pad)), GC.add(A, GC.scale(d, tMax + pad)), "geo-side-extension");
}

// true, sobald zwei gleich große, ausreichend große Kreise um A und B gezeichnet sind — dann gilt
// der Mittelpunkt von AB als konstruiert.
function midpointIfConstructed(task, tool) {
  const cA = tool.circles.find((c) => GC.dist(c.center, task.A) < TOL_PT);
  const cB = tool.circles.find((c) => c !== cA && GC.dist(c.center, task.B) < TOL_PT);
  if (!cA || !cB || !sameRadius(cA, cB)) return false;
  return Math.min(cA.radius, cB.radius) >= (GC.dist(task.A, task.B) / 2) * 1.02;
}

function drawTriangle(task) {
  const { A, B, C } = task;
  GS.drawSegment(layerGiven, A, B);
  GS.drawSegment(layerGiven, B, C);
  GS.drawSegment(layerGiven, C, A);
  GS.drawPoint(layerPoints, A, "A");
  GS.drawPoint(layerPoints, B, "B");
  GS.drawPoint(layerPoints, C, "C");
}

function current() {
  return EXERCISES[state.exercise];
}

// ---------- Gegebene Figur zeichnen ----------

function renderGiven() {
  GS.clearEl(layerGiven);
  GS.clearEl(layerPoints);
  current().drawGiven(state.task);
}

// ---------- Phase 1: geführte Anleitung ----------

function renderGuided() {
  // In der Anleitung darf nichts aus dem freien Konstruieren stehen bleiben, und das Zeichen-
  // werkzeug wird abgeschaltet, damit Klicks auf die Zeichenfläche hier nichts zeichnen.
  state.tool.setMode(null);
  state.tool.reset();
  setActiveToolBtn(null);
  showTriVertices(false);
  GS.clearEl(layerTriTriangle);
  GS.clearEl(layerUser);
  GS.clearEl(layerConstruct);
  for (let i = 0; i <= state.stepIndex; i++) steps[i].render();
  const isLast = state.stepIndex === steps.length - 1;
  els.instructionBox.innerHTML = `<p><strong>Schritt ${state.stepIndex + 1} von ${steps.length}:</strong> ${steps[state.stepIndex].text}</p>${
    isLast ? `<p>✅ ${current().done}</p>` : ""
  }`;
  els.stepsList.innerHTML = steps
    .map((s, i) => {
      const cls = i < state.stepIndex ? "geo-step-done" : i === state.stepIndex ? "geo-step-active" : "";
      return `<li class="${cls} geo-step-clickable" data-step="${i}">${s.text}</li>`;
    })
    .join("");
  els.btnBack.disabled = state.stepIndex === 0;
  els.btnNext.disabled = isLast;
  els.feedbackBox.hidden = true;
}

// ---------- Phase 2: freies Konstruieren ----------

function snapToNearest(raw) {
  const base = state.phase === "free-tri" ? freeTriSnapPoints() : current().snapPoints(state.task, state.tool);
  const targets = base.concat(userCircleIntersections());
  let best = raw,
    bestD = TOL_PT;
  for (const t of targets) {
    const d = GC.dist(raw, t);
    if (d < bestD) {
      bestD = d;
      best = t;
    }
  }
  return best;
}

function userCircleIntersections() {
  const out = [];
  const circles = state.tool.circles;
  for (let i = 0; i < circles.length; i++) {
    for (let j = i + 1; j < circles.length; j++) {
      out.push(...GC.circleCircleIntersections(circles[i].center, circles[i].radius, circles[j].center, circles[j].radius));
    }
  }
  return out;
}

// Alle Punkte, die durch die eigene Konstruktion entstanden sind, sichtbar markieren — sie sind
// gleichzeitig die Punkte, auf die das Anklicken einrastet.
function renderUserMarkers() {
  if (state.phase === "free-tri") {
    userCircleIntersections().forEach((p) => GS.drawCross(layerUser, p, "geo-schnitt-stark"));
    renderTriUserMarkers();
    return;
  }
  const ex = current();
  if (ex.extraDraw) ex.extraDraw(state.task, state.tool, layerUser);
  userCircleIntersections().forEach((p) => GS.drawCross(layerUser, p, "geo-schnitt-stark"));
  const extra = ex.markPoints ? ex.markPoints(state.task, state.tool) : [];
  extra.forEach((p) => GS.drawCross(layerUser, p, "geo-schnitt-stark"));
}

function updateFreeInstruction() {
  els.instructionBox.innerHTML = `<p>${current().freeText}</p>`;
  els.stepsList.innerHTML = `
    <li>Zirkel wählen, auf den Einstichpunkt klicken, dann auf einen Punkt auf dem gewünschten Radius klicken.</li>
    <li>Mit „🔒 Zirkel-Radius beibehalten“ bleibt der Radius danach gleich — dann genügt ein Klick auf den nächsten Einstichpunkt.</li>
    <li>Lineal wählen und zwei Punkte anklicken, durch die die Gerade verlaufen soll. Konstruierte Punkte (Kreuze) rasten beim Anklicken ein.</li>
    <li>Mit „Prüfen“ kontrollieren, mit „Tipp“ einen Hinweis bekommen.</li>
  `;
}

// Zeigt an, dass ein Kreis bzw. eine Gerade erst halb gesetzt ist — sonst ist der gestrichelte
// Vorschaukreis am Bildschirm nicht als "noch nicht fertig" zu erkennen.
function updatePendingStatus() {
  const p = state.tool.pending;
  els.pendingStatus.hidden = !p;
  if (!p) return;
  els.pendingStatus.textContent =
    p.type === "circle"
      ? "◯ Einstichpunkt gesetzt — klicke jetzt auf einen Punkt, durch den der Kreis gehen soll (Esc bricht ab)."
      : "／ Erster Punkt gesetzt — klicke jetzt auf den zweiten Punkt der Geraden (Esc bricht ab).";
}

// Beide Statuszeilen gemeinsam auffrischen.
function updateStatus() {
  updatePendingStatus();
  updateRadiusStatus();
}

function updateRadiusStatus() {
  const t = state.tool;
  els.btnResetRadius.hidden = !(t.radiusLocked && t.lockedRadius);
  if (!t.radiusLocked) {
    els.radiusStatus.hidden = true;
    return;
  }
  els.radiusStatus.hidden = false;
  els.radiusStatus.textContent = t.lockedRadius
    ? `🔒 Zirkel steht fest auf ${Math.round(t.lockedRadius)} — ein Klick setzt den nächsten Kreis mit genau diesem Radius. Für eine andere Größe auf „Radius neu einstellen“ klicken.`
    : "🔒 Zirkel-Radius wird eingerastet: Zeichne den nächsten Kreis wie gewohnt mit zwei Klicks, danach genügt ein Klick.";
}

function showFeedback(kind, msg) {
  els.feedbackBox.hidden = false;
  els.feedbackBox.className = "geo-feedback geo-feedback-" + kind;
  els.feedbackBox.textContent = msg;
}

function setActiveToolBtn(active) {
  [els.btnToolCircle, els.btnToolLine].forEach((b) => b.classList.toggle("geo-btn-active", b === active));
}

function renderFreeSetup() {
  showTriVertices(false);
  GS.clearEl(layerTriTriangle);
  GS.clearEl(layerConstruct);
  // Werkzeugmodus ebenfalls zurücksetzen — sonst wäre kein Werkzeug hervorgehoben, ein Klick auf
  // die Zeichenfläche würde aber trotzdem noch zeichnen.
  state.tool.setMode(null);
  state.tool.reset();
  setActiveToolBtn(null);
  updateFreeInstruction();
  updateStatus();
  els.feedbackBox.hidden = true;
}

// ---------- Umschalten Aufgabe / Phase ----------

// Welche Phasen-Reiter für die aktuelle Übung angezeigt werden: Mittelsenkrechte/Winkelhalbierende
// bekommen einen dritten Reiter für die volle Dreieckskonstruktion; Seitenhalbierende/Höhe
// konstruieren schon in ihrer zweiten Phase an einem Dreieck (nur eine einzelne Linie) und heißen
// deshalb konsistent ebenfalls "... am Dreieck".
function phaseListFor(exercise) {
  if (HAS_FREE_TRI[exercise]) {
    return [
      ["guided", "1. Geführte Anleitung ansehen"],
      ["free", "2. Selbst konstruieren"],
      ["free-tri", "3. Selbst konstruieren am Dreieck"],
    ];
  }
  return [
    ["guided", "1. Geführte Anleitung ansehen"],
    ["free", "2. Selbst konstruieren am Dreieck"],
  ];
}

function renderPhaseTabs() {
  els.phaseTabs.innerHTML = phaseListFor(state.exercise)
    .map(([key, label]) => `<button type="button" class="geo-mode-tab${key === state.phase ? " geo-mode-tab-active" : ""}" data-phase="${key}">${label}</button>`)
    .join("");
}

function updateNewTaskFreeLabel() {
  els.btnNewTaskFree.textContent = state.phase === "free-tri" ? "🎲 Neues Dreieck" : "🎲 Neue Aufgabe";
}

function refreshAll() {
  if (state.phase === "free-tri") {
    enterFreeTri();
    return;
  }
  renderGiven();
  steps = current().guided(state.task);
  if (state.phase === "guided") {
    state.stepIndex = 0;
    renderGuided();
  } else {
    renderFreeSetup();
  }
}

function newTaskClicked() {
  state.task = current().newTask();
  refreshAll();
}

els.exerciseTabs.addEventListener("click", (e) => {
  const btn = e.target.closest(".geo-mode-tab[data-exercise]");
  if (!btn) return;
  state.exercise = btn.dataset.exercise;
  [...els.exerciseTabs.children].forEach((b) => b.classList.toggle("geo-mode-tab-active", b === btn));
  if (state.phase === "free-tri" && !HAS_FREE_TRI[state.exercise]) state.phase = "guided";
  renderPhaseTabs();
  updateNewTaskFreeLabel();
  els.guidedControls.hidden = state.phase !== "guided";
  els.freeControls.hidden = state.phase === "guided";
  state.task = current().newTask();
  refreshAll();
});

els.phaseTabs.addEventListener("click", (e) => {
  const btn = e.target.closest(".geo-mode-tab[data-phase]");
  if (!btn) return;
  state.phase = btn.dataset.phase;
  [...els.phaseTabs.children].forEach((b) => b.classList.toggle("geo-mode-tab-active", b === btn));
  els.guidedControls.hidden = state.phase !== "guided";
  els.freeControls.hidden = state.phase === "guided";
  updateNewTaskFreeLabel();
  if (state.phase === "guided") {
    state.stepIndex = 0;
    renderGuided();
  } else if (state.phase === "free-tri") {
    enterFreeTri();
  } else {
    renderFreeSetup();
  }
});

// Die Anleitung ist anklickbar: ein Klick auf einen Schritt springt direkt dorthin.
els.stepsList.addEventListener("click", (e) => {
  const li = e.target.closest("li[data-step]");
  if (!li || state.phase !== "guided") return;
  state.stepIndex = Number(li.dataset.step);
  renderGuided();
});

els.btnNext.addEventListener("click", () => {
  if (state.stepIndex < steps.length - 1) {
    state.stepIndex++;
    renderGuided();
  }
});
els.btnBack.addEventListener("click", () => {
  if (state.stepIndex > 0) {
    state.stepIndex--;
    renderGuided();
  }
});
els.btnNewTask.addEventListener("click", newTaskClicked);
els.btnNewTaskFree.addEventListener("click", () => {
  if (state.phase === "free-tri") {
    triFree.randomize();
    enterFreeTri();
  } else {
    newTaskClicked();
  }
});

els.btnToolCircle.addEventListener("click", () => {
  state.tool.setMode("circle");
  setActiveToolBtn(els.btnToolCircle);
  updateStatus();
});
els.btnToolLine.addEventListener("click", () => {
  state.tool.setMode("line");
  setActiveToolBtn(els.btnToolLine);
  updateStatus();
});
// Escape bricht einen halb gesetzten Kreis bzw. eine halb gesetzte Gerade ab.
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (state.tool.cancelPending()) updateStatus();
});
els.btnUndo.addEventListener("click", () => {
  state.tool.undo();
  updateStatus();
});
els.btnClear.addEventListener("click", () => {
  GS.clearEl(layerConstruct);
  state.tool.reset();
  updateStatus();
  els.feedbackBox.hidden = true;
});
els.chkLockRadius.addEventListener("change", () => {
  state.tool.setRadiusLocked(els.chkLockRadius.checked);
  updateStatus();
});
els.btnResetRadius.addEventListener("click", () => {
  state.tool.clearLockedRadius();
  updateStatus();
});
els.btnCheck.addEventListener("click", () => {
  const result = state.phase === "free-tri" ? checkFreeTri() : current().check(state.task, state.tool);
  showFeedback(result.ok ? "ok" : "error", result.msg);
});
els.btnHint.addEventListener("click", () => {
  const result = state.phase === "free-tri" ? checkFreeTri() : current().check(state.task, state.tool);
  showFeedback(result.ok ? "ok" : "hint", result.msg);
});

// ---------- Start ----------

const triFree = setupDraggableTriangle(svg, layerTriVertices, W, H, GC.randomTriangle(W, H), onTriUpdate);
state.tool = new GS.ConstructionTool(svg, layerUser, snapToNearest);
state.tool.extraRender = renderUserMarkers;
state.tool.onChange = updateStatus;
state.task = current().newTask();
renderPhaseTabs();
updateNewTaskFreeLabel();
refreshAll();

setupCanvasZoom(document.querySelector(".geo-layout").closest(".card"), document.getElementById("btn-zoom"));
