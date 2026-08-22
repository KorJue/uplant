// Aufgabenmodelle für "Das Rätsel um den Goldenen Zirkel" (Klasse 8): fünf Fälle, in denen die vier
// besonderen Linienarten samt Um- und Inkreis an einer Sachsituation konstruiert werden.
//
// Prüfung, Einrastpunkte und Markierungen greifen bewusst auf dieselben Sucher zu wie die
// Trainingsseiten (tri-construct.js). Dadurch verhalten sich "Prüfen" und "Tipp" hier genau wie
// dort — die Schülerinnen und Schüler treffen im Rätsel keine neue Bedienlogik an, nur einen neuen
// Kontext. Neu sind hier nur die beiden Fälle, für die es bisher keine Prüfung am *ganzen* Dreieck
// gab (drei Seitenhalbierende, drei Höhen) und das Finale mit der Eulerschen Geraden.

import * as GC from "./geo-core.js?v=14";
import * as GS from "./geo-svg.js?v=14";
import { lineThroughBoth } from "./check-helpers.js?v=14";
import { TRI_TASKS, findMediatrice, findMedian, findAltitude, circlesAt, pairPoints } from "./tri-construct.js?v=14";

export const W = 600;
export const H = 440;

// Ab welchem Abstand von M und H die Eulersche Gerade als sicher bestimmt gilt (SVG-Einheiten).
const EULER_MIN_SPAN = 60;

// Alle Fälle spielen an spitzwinkligen Dreiecken. Dann liegen Umkreismittelpunkt, Schwerpunkt und
// Höhenschnittpunkt sämtlich im Inneren und die Höhenfußpunkte fallen auf die gezeichneten Seiten —
// die Sachsituationen (ein Brunnen zwischen drei Höfen, Wege innerhalb eines Ackers) bleiben so
// stimmig, und niemand muss eine Seite verlängern. Dass es auch anders geht, ist bewusst der
// Knobelfrage vorbehalten, die auf die Seite "Alle besonderen Linien" verweist.
export function randomCaseTriangle(minEulerSpan = 0) {
  for (let i = 0; i < 400; i++) {
    const t = GC.randomTriangle(W, H, 70);
    const angles = [GC.angleAtDeg(t.A, t.B, t.C), GC.angleAtDeg(t.B, t.A, t.C), GC.angleAtDeg(t.C, t.A, t.B)];
    if (angles.some((a) => a < 38 || a > 78)) continue;
    if (minEulerSpan) {
      const M = GC.circumcenter(t.A, t.B, t.C);
      if (!M || GC.dist(M, GC.orthocenter(t.A, t.B, t.C)) < minEulerSpan) continue;
    }
    return t;
  }
  return { A: GC.pt(W * 0.17, H * 0.8), B: GC.pt(W * 0.83, H * 0.8), C: GC.pt(W * 0.4, H * 0.16) };
}

// ---------- gemeinsame Bausteine der Fortschritts-Analyse ----------

function verticesOf(pts) {
  const { A, B, C } = pts;
  return [
    { label: "A", V: A, P: B, Q: C, seite: "BC" },
    { label: "B", V: B, P: C, Q: A, seite: "CA" },
    { label: "C", V: C, P: A, Q: B, seite: "AB" },
  ];
}

function sidesOf(pts) {
  const { A, B, C } = pts;
  return [
    { label: "AB", P: A, Q: B },
    { label: "BC", P: B, Q: C },
    { label: "CA", P: C, Q: A },
  ];
}

// Nächste Klickziele einer noch offenen Seitenhalbierenden: Stehen die beiden gleich großen Kreise
// um die Endpunkte der Seite, sind ihre Schnittpunkte und der daraus folgende Seitenmittelpunkt
// die Punkte, auf die es als Nächstes ankommt.
function medianProgress(tool, part, marks, snapPoints) {
  const inter = pairPoints(tool, part.P, part.Q);
  if (inter.length < 2) return;
  inter.forEach((p) => marks.push({ p, done: false }));
  const m = GC.mid(part.P, part.Q);
  marks.push({ p: m, done: false });
  snapPoints.push(m);
}

// Dasselbe für ein noch offenes Lot (Höhe): Sobald ein Kreis um den Eckpunkt die Gegenseite an zwei
// Stellen schneidet, sind das die nächsten Einstichpunkte.
function altitudeProgress(tool, part, marks, snapPoints) {
  for (const c of circlesAt(tool, part.V)) {
    const hits = GC.circleLineIntersections(part.V, c.radius, part.P, part.Q);
    if (hits.length < 2) continue;
    hits.forEach((p) => {
      marks.push({ p, done: false });
      snapPoints.push(p);
    });
    pairPoints(tool, hits[0], hits[1]).forEach((p) => marks.push({ p, done: false }));
    return;
  }
}

// Liegen Hilfspunkte einer Höhe außerhalb der gezeichneten Seite, wird sie gestrichelt so weit
// verlängert, dass die Punkte die Linie auch wirklich berühren.
function drawSideExtension(layer, A, B, points) {
  if (!points.length) return;
  const d = GC.sub(B, A);
  const ts = points.map((p) => GC.dot(GC.sub(p, A), d) / GC.dot(d, d));
  const tMin = Math.min(0, ...ts);
  const tMax = Math.max(1, ...ts);
  if (tMin > -0.02 && tMax < 1.02) return;
  GS.drawSegment(layer, GC.add(A, GC.scale(d, tMin)), GC.add(A, GC.scale(d, tMax)), "geo-side-extension");
}

// Sammelt die drei Teilkonstruktionen eines Typs samt der Kreise/Punkte, die dafür verbraucht sind.
function collect(tool, parts, find, progress, spentCircles, marks, snapPoints) {
  const out = parts.map((part) => ({ ...part, hit: find(tool, part) }));
  for (const part of out) {
    if (part.hit) {
      part.hit.circles.forEach((c) => spentCircles.add(c));
      part.hit.points.forEach((p) => {
        marks.push({ p, done: true });
        snapPoints.push(p);
      });
    } else if (progress) {
      progress(tool, part, marks, snapPoints);
    }
  }
  return out;
}

// ---------- Fall 3: drei Seitenhalbierende → Schwerpunkt ----------

const seitenhalbierendeModell = {
  analyze(tool, pts) {
    const { A, B, C } = pts;
    const spentCircles = new Set();
    const marks = [];
    const snapPoints = [A, B, C];
    const parts = collect(tool, verticesOf(pts), (t, p) => findMedian(t, p.V, p.P, p.Q), medianProgress, spentCircles, marks, snapPoints);
    const doneCount = parts.filter((p) => p.hit).length;
    // Der Schwerpunkt steht fest, sobald sich zwei Seitenhalbierende schneiden.
    const center = doneCount >= 2 ? GC.centroid(A, B, C) : null;
    if (center) {
      snapPoints.push(center);
      marks.push({ p: center, done: doneCount >= 3 });
    }
    return { parts, doneCount, center, spentCircles, marks, snapPoints, autoMarks: false };
  },
  check(a) {
    const missing = a.parts.find((p) => !p.hit);
    if (missing) {
      return {
        ok: false,
        msg: `Es fehlt noch die Seitenhalbierende von ${missing.label}: Konstruiere mit zwei gleich großen Kreisen um ${missing.seite[0]} und ${missing.seite[1]} den Mittelpunkt der Seite ${missing.seite} und verbinde ${missing.label} mit diesem Mittelpunkt. Achtung — die Seitenhalbierende steht nicht senkrecht auf der Seite.`,
      };
    }
    return {
      ok: true,
      msg: "Richtig konstruiert! Alle drei Seitenhalbierenden schneiden sich in einem Punkt — dem Schwerpunkt S. Auf ihm balanciert das Blechschild genau.",
    };
  },
};

// ---------- Fall 4: drei Höhen → Höhenschnittpunkt ----------

const hoehenModell = {
  analyze(tool, pts) {
    const { A, B, C } = pts;
    const spentCircles = new Set();
    const marks = [];
    const snapPoints = [A, B, C];
    const parts = collect(tool, verticesOf(pts), (t, p) => findAltitude(t, p.V, p.P, p.Q), altitudeProgress, spentCircles, marks, snapPoints);
    const doneCount = parts.filter((p) => p.hit).length;
    // Zwei Höhen legen den Höhenschnittpunkt bereits fest.
    const center = doneCount >= 2 ? GC.orthocenter(A, B, C) : null;
    if (center) {
      snapPoints.push(center);
      marks.push({ p: center, done: doneCount >= 3 });
    }
    return { parts, doneCount, center, spentCircles, marks, snapPoints, autoMarks: false };
  },
  check(a) {
    const missing = a.parts.find((p) => !p.hit);
    if (missing) {
      return {
        ok: false,
        msg: `Es fehlt noch die Höhe von ${missing.label} auf die Seite ${missing.seite}: Zeichne einen Kreis um ${missing.label}, der ${missing.seite} an zwei Stellen schneidet, dann zwei gleich große Kreise um diese beiden Schnittpunkte, und verbinde ${missing.label} mit deren Kreuzungspunkt.`,
      };
    }
    return {
      ok: true,
      msg: "Richtig konstruiert! Alle drei Höhen schneiden sich in einem Punkt — dem Höhenschnittpunkt H. Dort steht der Messpfahl.",
    };
  },
  onDraw(layer, tool, pts) {
    // Ein groß gewählter Zirkelradius trifft die Gegenseite außerhalb der gezeichneten Strecke —
    // dann wird sie gestrichelt verlängert, damit die Schnittpunkte nicht daneben zu schweben
    // scheinen.
    for (const part of verticesOf(pts)) {
      const hits = [];
      for (const c of circlesAt(tool, part.V)) hits.push(...GC.circleLineIntersections(part.V, c.radius, part.P, part.Q));
      drawSideExtension(layer, part.P, part.Q, hits);
    }
  },
};

// ---------- Finale: M, S und H → Eulersche Gerade ----------

const eulerModell = {
  analyze(tool, pts) {
    const { A, B, C } = pts;
    const spentCircles = new Set();
    const marks = [];
    const snapPoints = [A, B, C];
    const mittel = collect(tool, sidesOf(pts), (t, p) => findMediatrice(t, p.P, p.Q), null, spentCircles, marks, snapPoints);
    const seiten = collect(tool, verticesOf(pts), (t, p) => findMedian(t, p.V, p.P, p.Q), null, spentCircles, marks, snapPoints);
    const hoehen = collect(tool, verticesOf(pts), (t, p) => findAltitude(t, p.V, p.P, p.Q), null, spentCircles, marks, snapPoints);
    const nMittel = mittel.filter((p) => p.hit).length;
    const nSeiten = seiten.filter((p) => p.hit).length;
    const nHoehen = hoehen.filter((p) => p.hit).length;

    // Je zwei Linien einer Sorte genügen, um ihren Schnittpunkt festzulegen — genau das ist die
    // Einsicht, die im Finale gebraucht wird.
    const M = nMittel >= 2 ? GC.circumcenter(A, B, C) : null;
    const S = nSeiten >= 2 ? GC.centroid(A, B, C) : null;
    const Hp = nHoehen >= 2 ? GC.orthocenter(A, B, C) : null;
    const line = M && Hp && GC.dist(M, Hp) > 1 ? tool.lines.find((l) => lineThroughBoth(l, M, Hp)) : null;
    [
      [M, "M"],
      [S, "S"],
      [Hp, "H"],
    ].forEach(([p]) => {
      if (!p) return;
      snapPoints.push(p);
      marks.push({ p, done: !!line });
    });

    return { mittel, seiten, hoehen, nMittel, nSeiten, nHoehen, M, S, Hp, line, spentCircles, marks, snapPoints, autoMarks: false };
  },
  check(a) {
    if (a.nMittel < 2) {
      return {
        ok: false,
        msg: `Für den Brunnen M fehlen noch Mittelsenkrechte (${a.nMittel} von 2). Zwei genügen: Ihr Schnittpunkt ist bereits der Umkreismittelpunkt.`,
      };
    }
    if (a.nSeiten < 2) {
      return {
        ok: false,
        msg: `Für den Waagepunkt S fehlen noch Seitenhalbierende (${a.nSeiten} von 2). Auch hier genügen zwei — ihr Schnittpunkt ist der Schwerpunkt.`,
      };
    }
    if (a.nHoehen < 2) {
      return {
        ok: false,
        msg: `Für den Messpfahl H fehlen noch Höhen (${a.nHoehen} von 2). Zwei Höhen legen den Höhenschnittpunkt bereits fest.`,
      };
    }
    if (!a.line) {
      return {
        ok: false,
        msg: "Alle drei Punkte stehen — jetzt fehlt nur noch Anton Winkels Peilstrahl: Wähle das Lineal und verbinde M mit H. Schau dabei genau hin, wo S liegt.",
      };
    }
    return {
      ok: true,
      msg: "Richtig konstruiert! M, S und H liegen tatsächlich auf einer einzigen Geraden — der Eulerschen Geraden. Und S liegt nicht irgendwo darauf, sondern immer zwischen M und H, im Verhältnis 1:2 (von M aus gemessen der kürzere Teil).",
    };
  },
};

// ---------- Die fünf Fälle ----------
// Aufbau jedes Falls ist absichtlich identisch (Rückblick → Rätselkarte → Auftrag → Hilfe →
// Selbstkontrolle → Merksatz → Denkfrage → Buchstabe). Diese Wiederholung ist Teil des Konzepts:
// Wer den ersten Fall verstanden hat, muss sich in keinem weiteren neu orientieren und kann die
// Aufmerksamkeit ganz auf die Mathematik richten.

export const FAELLE = [
  {
    key: "brunnen",
    nr: 1,
    titel: "Fall 1: Der Brunnen",
    kurz: "Fall 1 · Brunnen",
    linie: "Mittelsenkrechte",
    ergebnis: "Umkreismittelpunkt M + Umkreis",
    farbe: "#d64545",
    buchstabe: "I",
    position: 2,
    namen: { A: "🏡 Adlerhof", B: "🏡 Birkenhof", C: "🏡 Cammerhof" },
    flaeche: false,
    rueckblick:
      "Zum Warmwerden: Was gilt für <em>jeden</em> Punkt, der auf der Mittelsenkrechten der Strecke AB liegt? (Antwort im Merksatz unten prüfen.)",
    story:
      "„Drei Höfe standen mir im Feld: der Adlerhof, der Birkenhof und der Cammerhof. Ich grub ihnen einen gemeinsamen Brunnen — und keine Bäuerin sollte weiter laufen müssen als die andere. Um den Brunnen zog ich später eine Hecke, genau durch alle drei Höfe.“",
    auftrag: {
      1:
        "Konstruiere die Mittelsenkrechte der Seite AB: zwei gleich große Kreise um A und um B (Radius größer als die halbe Seitenlänge), dann die beiden Schnittpunkte mit dem Lineal verbinden. Wiederhole das für BC und CA. Die drei Linien treffen sich in einem Punkt — das ist der Brunnen M. Stich zuletzt mit dem Zirkel in M ein und stelle den Radius bis zu einem Hof ein: Das ist die Hecke (der Umkreis).",
      2:
        "Finde die Stelle für den Brunnen, die von allen drei Höfen gleich weit entfernt ist, und zeichne anschließend Anton Winkels Hecke — den Kreis durch alle drei Höfe.",
      3:
        "Anton Winkel behauptet, es gebe <em>genau eine</em> solche Stelle. Konstruiere sie und die Hecke dazu.",
    },
    knobel:
      "Warum treffen sich alle drei Mittelsenkrechten in <em>einem</em> Punkt — obwohl man doch für jede Seite eine eigene Linie zeichnet? Und warum genügen schon zwei davon, um den Brunnen zu finden?",
    hilfe: [
      "Zirkel wählen, in einen Eckpunkt einstechen, dann auf einen Punkt im gewünschten Abstand klicken. Der Radius muss größer sein als die halbe Seitenlänge — sonst schneiden sich die Bögen nicht.",
      "Mit dem Häkchen „🔒 Zirkel-Radius beibehalten“ bleibt der Radius zwischen beiden Kreisen gleich, genau wie bei einem echten Zirkel, den man nicht verstellt.",
      "Lineal wählen und die beiden Schnittpunkte der Bögen verbinden — fertig ist eine Mittelsenkrechte. Ihre Hilfskreise treten dann grau zurück.",
      "Sobald zwei Mittelsenkrechten stehen, rastet ihr Schnittpunkt M beim Anklicken von selbst ein.",
    ],
    merksatz:
      "Auf der Mittelsenkrechten einer Strecke liegen <strong>genau die Punkte, die von beiden Endpunkten gleich weit entfernt sind</strong>. Deshalb ist der Schnittpunkt zweier Mittelsenkrechten von allen drei Ecken gleich weit weg — und deshalb gibt es um ihn einen Kreis durch A, B und C: den Umkreis.",
    denkfrage: "Warum muss die dritte Mittelsenkrechte automatisch durch M laufen, ohne dass man sie überhaupt zeichnet?",
    musterantwort:
      "M liegt auf der Mittelsenkrechten von AB, ist also von A und B gleich weit entfernt. M liegt auch auf der von BC, ist also von B und C gleich weit entfernt. Zusammen: M ist von A und C gleich weit entfernt — und das ist genau die Bedingung für die Mittelsenkrechte von CA. M liegt also auch auf ihr.",
    grundlagen: { href: "mittelsenkrechte-umkreis.html", text: "2. Mittelsenkrechte & Umkreis" },
    minEulerSpan: 0,
    analyze: (tool, pts) => TRI_TASKS.mittelsenkrechte.analyze(tool, pts),
    check: (a) => TRI_TASKS.mittelsenkrechte.check(a),
  },

  {
    key: "rondell",
    nr: 2,
    titel: "Fall 2: Das Rondell",
    kurz: "Fall 2 · Rondell",
    linie: "Winkelhalbierende",
    ergebnis: "Inkreismittelpunkt I + Inkreis",
    farbe: "#1a9e7a",
    buchstabe: "E",
    position: 5,
    namen: { A: "🌳 Wegkreuz A", B: "🌳 Wegkreuz B", C: "🌳 Wegkreuz C" },
    flaeche: true,
    rueckblick:
      "Rückblick auf Fall 1: Dort ging es um gleiche Abstände zu <em>Punkten</em> (den Höfen). Hier geht es um gleiche Abstände zu <em>Geraden</em> (den Wegen). Wie misst man den Abstand eines Punktes von einer Geraden?",
    story:
      "„Zwischen meinen drei Wegen lag ein Stück Wiese. Dort ließ ich ein rundes Beet anlegen — so groß, wie es nur eben ging: Es sollte jeden der drei Wege genau einmal berühren, keinen überqueren.“",
    auftrag: {
      1:
        "Konstruiere die Winkelhalbierende bei A: Kreis um A zeichnen, der beide anliegenden Wege schneidet; um die zwei neuen Schnittpunkte zwei gleich große Kreise; A mit deren Kreuzungspunkt verbinden. Wiederhole das bei B und C — die drei Linien treffen sich im Beetmittelpunkt I. Fälle dann von I das Lot auf einen Weg (Kreis um I, der den Weg zweimal schneidet, zwei gleich große Kreise darum, I mit dem Kreuzungspunkt verbinden). Stich zuletzt in I ein und stelle den Radius genau bis zum Lotfußpunkt ein.",
      2:
        "Finde den Mittelpunkt des Beetes und zeichne das Beet so groß, dass es alle drei Wege berührt. Denk daran: Der Radius ist der <em>Lotabstand</em> zu einem Weg.",
      3:
        "Konstruiere das größtmögliche Rondell, das ganz zwischen den drei Wegen liegt. Begründe unterwegs, warum der Radius nicht größer gewählt werden darf.",
    },
    knobel:
      "Der Umkreismittelpunkt aus Fall 1 kann außerhalb des Dreiecks liegen — der Inkreismittelpunkt niemals. Woran liegt das? (Tipp: Denk daran, was „auf der Winkelhalbierenden liegen“ bedeutet.)",
    hilfe: [
      "Der erste Bogen um den Eckpunkt muss <em>beide</em> anliegenden Seiten schneiden — lieber etwas größer wählen.",
      "Die beiden Schnittpunkte auf den Seiten sind die nächsten Einstichpunkte; sie werden als rote Kreuze markiert.",
      "Sobald zwei Winkelhalbierende stehen, rastet ihr Schnittpunkt I ein.",
      "Das Lot von I auf eine Seite ist dieselbe Konstruktion wie eine Höhe — nur startet sie in I statt in einer Ecke.",
      "Der Inkreisradius reicht genau bis zum Lotfußpunkt, nicht bis zu einer Ecke.",
    ],
    merksatz:
      "Auf der Winkelhalbierenden liegen <strong>genau die Punkte, die von beiden Schenkeln gleich weit entfernt sind</strong> — gemessen wird dieser Abstand immer über das <strong>Lot</strong>. Deshalb hat der Schnittpunkt I von allen drei Seiten denselben Abstand, und der Kreis um I mit diesem Abstand berührt jede Seite genau einmal: der Inkreis.",
    denkfrage: "Warum darf man den Inkreisradius nicht einfach von I bis zu einer Ecke messen?",
    musterantwort:
      "Der Abstand eines Punktes von einer Geraden ist immer der <em>kürzeste</em> Abstand, und der wird über das Lot gemessen. Der Weg von I zu einer Ecke ist schräg und damit länger als das Lot. Ein Kreis mit diesem größeren Radius würde die Wege überqueren statt sie zu berühren.",
    grundlagen: { href: "winkelhalbierende-inkreis.html", text: "3. Winkelhalbierende & Inkreis" },
    minEulerSpan: 0,
    analyze: (tool, pts) => TRI_TASKS.winkelhalbierende.analyze(tool, pts),
    check: (a) => TRI_TASKS.winkelhalbierende.check(a),
  },

  {
    key: "wetterhahn",
    nr: 3,
    titel: "Fall 3: Der Wetterhahn",
    kurz: "Fall 3 · Wetterhahn",
    linie: "Seitenhalbierende",
    ergebnis: "Schwerpunkt S",
    farbe: "#8a5cf6",
    buchstabe: "L",
    position: 1,
    namen: { A: "Ecke A", B: "Ecke B", C: "Ecke C" },
    flaeche: true,
    rueckblick:
      "Rückblick auf Fall 1: Dort hast du die Mittelsenkrechte gebraucht, um <em>eine ganze Linie</em> zu bekommen. Hier brauchst du von derselben Konstruktion nur <em>einen einzigen Punkt</em>. Welchen?",
    story:
      "„Aus Blech schnitt ich ein dreieckiges Schild für den Wetterhahn und setzte es auf eine einzige Stange. Es stand waagerecht und kippte nicht — obwohl das Dreieck ganz schief war.“",
    auftrag: {
      1:
        "Die Seitenhalbierende geht von einer Ecke zum <em>Mittelpunkt</em> der Gegenseite. Konstruiere zuerst diesen Mittelpunkt: zwei gleich große Kreise um die beiden Endpunkte der Seite (Radius größer als die halbe Seitenlänge). Der Mittelpunkt rastet dann beim Anklicken ein. Verbinde die Ecke mit ihm. Wiederhole das für alle drei Ecken.",
      2:
        "Konstruiere die Stelle, auf der das Blechschild balanciert — den Schwerpunkt. Nutze dafür alle drei Seitenhalbierenden.",
      3:
        "Finde den Balancepunkt des Schildes. Miss anschließend nach, in welchem Verhältnis er jede Seitenhalbierende teilt, und formuliere deine Beobachtung als Regel.",
    },
    knobel:
      "Die Seitenhalbierende steht <em>nicht</em> senkrecht auf der Seite — die Mittelsenkrechte schon. Trotzdem beginnen beide Konstruktionen exakt gleich. Erkläre, warum das kein Widerspruch ist.",
    hilfe: [
      "Achtung, häufige Verwechslung: Die Mittelsenkrechte wird hier nur als <em>Werkzeug</em> gebraucht, um den Seitenmittelpunkt zu finden. Gezeichnet wird am Ende die Strecke von der Ecke zu diesem Mittelpunkt.",
      "Sobald die beiden gleich großen Kreise um die Endpunkte einer Seite stehen, wird ihr Mittelpunkt als Kreuz markiert und rastet beim Anklicken ein.",
      "Du brauchst die Verbindungslinie der beiden Bogenschnittpunkte nicht zu zeichnen — sie schadet aber auch nicht.",
      "Zwei Seitenhalbierende genügen bereits, um S zu finden; die dritte ist die Probe.",
    ],
    merksatz:
      "Die <strong>Seitenhalbierende</strong> verbindet eine Ecke mit dem <strong>Mittelpunkt der Gegenseite</strong> (und steht dabei nicht senkrecht). Alle drei treffen sich im <strong>Schwerpunkt S</strong>, der jede von ihnen im Verhältnis <strong>2:1</strong> teilt — von der Ecke aus gemessen ist das längere Stück zuerst dran. Auf S balanciert das Dreieck.",
    denkfrage: "Wozu braucht man in dieser Konstruktion überhaupt Zirkelbögen, wo doch am Ende nur eine gerade Strecke gezeichnet wird?",
    musterantwort:
      "Der Mittelpunkt einer Strecke lässt sich mit Zirkel und Lineal nicht „abschätzen“ und nicht abmessen — er muss konstruiert werden. Zwei gleich große Kreise um die Endpunkte liefern ihn exakt: Ihre beiden Schnittpunkte sind von A und B gleich weit entfernt, und die Verbindung dieser Punkte trifft AB genau in der Mitte.",
    grundlagen: { href: "grundkonstruktionen.html", text: "1. Grundkonstruktionen → Seitenhalbierende" },
    minEulerSpan: 0,
    analyze: (tool, pts) => seitenhalbierendeModell.analyze(tool, pts),
    check: (a) => seitenhalbierendeModell.check(a),
  },

  {
    key: "fusswege",
    nr: 4,
    titel: "Fall 4: Die drei Fußwege",
    kurz: "Fall 4 · Fußwege",
    linie: "Höhe",
    ergebnis: "Höhenschnittpunkt H",
    farbe: "#e08a1e",
    buchstabe: "D",
    position: 4,
    namen: { A: "Ecke A", B: "Ecke B", C: "Ecke C" },
    flaeche: true,
    rueckblick:
      "Rückblick auf Fall 2: Dort hast du von I aus ein Lot auf eine Seite gefällt, um den Inkreisradius zu bekommen. Genau dieselbe Konstruktion brauchst du jetzt wieder — nur startet sie diesmal in einer Ecke.",
    story:
      "„Von jeder Ecke meines Ackers legte ich den <em>kürzesten</em> Weg zum gegenüberliegenden Feldrand an. Ich staunte nicht schlecht: Alle drei Wege kreuzten sich an ein und derselben Stelle. Dort rammte ich meinen Messpfahl in den Boden.“",
    auftrag: {
      1:
        "Die Höhe von A steht senkrecht auf der Gegenseite BC. Zeichne einen Kreis um A, der BC an zwei Stellen schneidet. Steche in diese beiden Schnittpunkte ein und zeichne zwei gleich große Bögen, die sich kreuzen. Verbinde A mit dem Kreuzungspunkt. Wiederhole das für B und C.",
      2:
        "Konstruiere von jeder Ecke aus den kürzesten Weg zum gegenüberliegenden Feldrand. Wo treffen sich die drei Wege?",
      3:
        "Konstruiere die Stelle des Messpfahls. Begründe zusätzlich, warum der kürzeste Weg von einer Ecke zum Feldrand ausgerechnet der senkrechte ist.",
    },
    knobel:
      "Anton Winkels Acker war spitzwinklig, deshalb lag der Messpfahl mitten im Feld. Öffne die Seite „Alle besonderen Linien“, blende die Höhen ein und zieh eine Ecke so weit, bis ein Winkel stumpf wird. Wo liegt H dann? Und was passiert bei genau 90°?",
    hilfe: [
      "Der Kreis um die Ecke muss die Gegenseite an <em>zwei</em> Stellen treffen — ist der Radius zu klein, passiert nichts.",
      "Die beiden Treffer auf der Seite werden als rote Kreuze markiert und rasten beim Anklicken ein.",
      "Die zwei Bögen um diese Kreuze müssen denselben Radius haben und sich kreuzen — dafür lohnt sich „🔒 Zirkel-Radius beibehalten“.",
      "Die Gerade von der Ecke durch diesen Kreuzungspunkt trifft die Gegenseite im rechten Winkel. Der Treffpunkt heißt Höhenfußpunkt.",
      "Zwei Höhen genügen, um H zu finden; die dritte ist die Probe.",
    ],
    merksatz:
      "Die <strong>Höhe</strong> ist das <strong>Lot von einer Ecke auf die Gegenseite</strong> — und damit der kürzeste Weg dorthin. Alle drei Höhen (bzw. ihre Verlängerungen) treffen sich im <strong>Höhenschnittpunkt H</strong>. Bei einem spitzwinkligen Dreieck liegt H innen, bei einem stumpfwinkligen außen, beim rechtwinkligen genau in der Ecke mit dem rechten Winkel.",
    denkfrage: "Woher weiß man, dass die konstruierte Gerade wirklich senkrecht auf der Seite steht?",
    musterantwort:
      "Die Ecke ist von den beiden Schnittpunkten X₁ und X₂ gleich weit entfernt (beide liegen auf demselben Kreis um sie herum). Der Kreuzungspunkt der beiden gleich großen Bögen ebenfalls. Beide Punkte liegen also auf der Mittelsenkrechten von X₁X₂ — und die steht per Definition senkrecht auf der Geraden durch X₁ und X₂, also auf der Seite.",
    grundlagen: { href: "grundkonstruktionen.html", text: "1. Grundkonstruktionen → Höhe" },
    minEulerSpan: 0,
    analyze: (tool, pts) => hoehenModell.analyze(tool, pts),
    check: (a) => hoehenModell.check(a),
    onDraw: (layer, tool, pts) => hoehenModell.onDraw(layer, tool, pts),
  },

  {
    key: "peilstrahl",
    nr: 5,
    titel: "Finale: Anton Winkels Peilstrahl",
    kurz: "Finale · Peilstrahl",
    linie: "alle drei zusammen",
    ergebnis: "Eulersche Gerade durch M, S und H",
    farbe: "#c2255c",
    buchstabe: "N",
    position: 3,
    namen: { A: "Ecke A", B: "Ecke B", C: "Ecke C" },
    flaeche: false,
    rueckblick:
      "Rückblick auf die Fälle 1, 3 und 4: Du brauchst jetzt alle drei Punkte auf einmal — den Brunnen M, den Waagepunkt S und den Messpfahl H. Für jeden einzelnen genügen <em>zwei</em> Linien der passenden Sorte. Warum eigentlich?",
    story:
      "„Zum Schluss verrate ich dir das Merkwürdigste: Brunnen, Waagepunkt und Messpfahl liegen auf <em>einer einzigen Geraden</em>, so gerade wie ein Peilstrahl. Spanne die Schnur von meinem Brunnen bis zu meinem Messpfahl — dann weißt du, wo du zu graben hast.“",
    auftrag: {
      1:
        "Konstruiere nacheinander: <strong>(a)</strong> zwei Mittelsenkrechte → ihr Schnittpunkt ist M, <strong>(b)</strong> zwei Seitenhalbierende → ihr Schnittpunkt ist S, <strong>(c)</strong> zwei Höhen → ihr Schnittpunkt ist H. Verbinde zuletzt M und H mit dem Lineal und schau nach, wo S liegt.",
      2:
        "Konstruiere M, S und H (je zwei Linien genügen) und prüfe Anton Winkels Behauptung: Liegen die drei Punkte wirklich auf einer Geraden?",
      3:
        "Sage zuerst <em>ohne</em> zu konstruieren voraus, in welcher Reihenfolge M, S und H auf der Geraden liegen. Konstruiere dann und überprüfe deine Vorhersage. Schätze außerdem, in welchem Verhältnis S die Strecke MH teilt.",
    },
    knobel:
      "Bei welchem Dreieck verschwindet die Eulersche Gerade — und warum? Probiere es auf der Seite „Alle besonderen Linien“ aus: Blende Mittelsenkrechte, Seitenhalbierende und Höhen ein und zieh die Ecken so, dass alle Seiten gleich lang werden. Prüfe dort auch, ob der Inkreismittelpunkt I mit auf der Geraden liegt.",
    hilfe: [
      "Du brauchst hier nicht alle neun Linien — je zwei pro Sorte genügen, um den zugehörigen Punkt festzulegen. Das spart mehr als die Hälfte der Arbeit.",
      "Fertige Teilkonstruktionen treten grau zurück. Nutze das, um den Überblick zu behalten.",
      "Sobald zwei Linien einer Sorte stehen, rastet ihr Schnittpunkt beim Anklicken ein — M, S und H werden als Kreuze markiert.",
      "Zum Schluss: Lineal wählen, auf M klicken, dann auf H. Die Gerade sollte S unterwegs genau treffen.",
      "Wird es zu voll auf dem Bild, hilft „🗑 Zurücksetzen“ und ein neuer, planvollerer Anlauf.",
    ],
    merksatz:
      "In <em>jedem</em> Dreieck liegen der Umkreismittelpunkt <strong>M</strong>, der Schwerpunkt <strong>S</strong> und der Höhenschnittpunkt <strong>H</strong> auf einer gemeinsamen Geraden — der <strong>Eulerschen Geraden</strong>. S liegt dabei immer <em>zwischen</em> M und H und teilt die Strecke MH im Verhältnis <strong>1:2</strong>. Nur der Inkreismittelpunkt I macht nicht mit. Beim gleichseitigen Dreieck fallen M, S und H zusammen — dann gibt es keine Eulersche Gerade mehr.",
    denkfrage: "Warum genügen zwei Mittelsenkrechte, um M zu bestimmen — und warum ist es trotzdem sinnvoll, die dritte als Probe zu zeichnen?",
    musterantwort:
      "Zwei sich schneidende Geraden haben genau einen Schnittpunkt, damit ist M eindeutig festgelegt; die dritte Mittelsenkrechte läuft aus dem im Merksatz von Fall 1 genannten Grund automatisch mit hindurch. Als Probe ist sie trotzdem nützlich: Geht sie nicht durch M, hat man sich beim Zeichnen irgendwo vertan.",
    grundlagen: { href: "alle-linien.html", text: "4. Alle besonderen Linien am Dreieck" },
    minEulerSpan: EULER_MIN_SPAN,
    analyze: (tool, pts) => eulerModell.analyze(tool, pts),
    check: (a) => eulerModell.check(a),
  },
];

export const LOESUNGSWORT = "LINDE";
