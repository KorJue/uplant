// Gemeinsame Bedienlogik für das freie Konstruieren mit Zirkel und Lineal: Werkzeugknöpfe, Esc zum
// Abbrechen, Rückgängig/Zurücksetzen, Prüfen/Tipp, die Zirkel-Radius-Sperre, die beiden Statuszeilen
// und das Rückmeldefeld. Das ist auf allen Geometrie-Seiten identisch — nur das Modell (welche Punkte
// einrasten, was markiert wird, was geprüft wird) kommt von der jeweiligen Seite.

import * as GC from "./geo-core.js?v=16";
import * as GS from "./geo-svg.js?v=16";
import { circlesIntersections, pairedIntersections } from "./check-helpers.js?v=16";
import { TOL_PT } from "./tri-construct.js?v=16";

const PENDING_TEXT = {
  circle: "◯ Einstichpunkt gesetzt — klicke jetzt auf einen Punkt, durch den der Kreis gehen soll (Esc bricht ab).",
  line: "／ Erster Punkt gesetzt — klicke jetzt auf den zweiten Punkt der Geraden (Esc bricht ab).",
};

// Zwei Markierungen gelten als derselbe Punkt, wenn sie praktisch aufeinanderliegen.
const SAME_PT = 2;

/**
 * @param svg      die Zeichenfläche
 * @param layer    die Ebene für die eigene Konstruktion
 * @param els      die Bedienelemente (siehe Zuweisungen unten)
 * @param model    () => { snapPoints, marks: [{p, done}], spentCircles: Set|null }
 *                 Wird pro Render/Klick frisch abgefragt; "done" bzw. spentCircles lassen fertige
 *                 Teilkonstruktionen grau zurücktreten.
 * @param check    () => { ok, msg }
 * @param onDraw   optional (layer) => void für seiteneigene Hilfszeichnungen
 * @param onClear  optional: zusätzliches Aufräumen beim Zurücksetzen
 */
export function setupFreeConstruction({ svg, layer, els, model, check, onDraw, onClear }) {
  const tool = new GS.ConstructionTool(svg, layer, snapToNearest);

  function snapToNearest(raw) {
    const targets = (model().snapPoints || []).concat(circlesIntersections(tool.circles));
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

  // Kreise, deren Linie fertig ist, werden grau gezeichnet.
  tool.circleClasses = (circles) => {
    const spent = model().spentCircles;
    return circles.map((c) => (spent && spent.has(c) ? "geo-done" : ""));
  };

  // Konstruierte Punkte als Kreuz markieren. Angezeigt werden nur die Schnittpunkte gleich großer
  // Kreise (die bedeutungstragenden), eingerastet wird großzügiger — siehe check-helpers.js.
  // Seiteneigene Zusatzpunkte (Punkte auf Schenkeln/Seiten, Mittelpunkte) kommen über model().marks.
  tool.extraRender = () => {
    if (onDraw) onDraw(layer);
    const m0 = model();
    // Liefert das Modell seine Punkte vollständig (autoMarks === false), wird nichts dazugeraten.
    const marks = m0.autoMarks === false ? [] : pairedIntersections(tool.circles).map((p) => ({ p, done: false }));
    for (const m of m0.marks || []) {
      const same = marks.find((o) => GC.dist(o.p, m.p) < SAME_PT);
      if (same) same.done = same.done || m.done;
      else marks.push({ p: m.p, done: m.done });
    }
    marks.forEach((m) => GS.drawCross(layer, m.p, m.done ? "geo-done" : "geo-schnitt-stark"));
  };

  function updateStatus() {
    const p = tool.pending;
    els.pendingStatus.hidden = !p;
    if (p) els.pendingStatus.textContent = PENDING_TEXT[p.type];

    els.btnResetRadius.hidden = !(tool.radiusLocked && tool.lockedRadius);
    els.radiusStatus.hidden = !tool.radiusLocked;
    if (tool.radiusLocked) {
      els.radiusStatus.textContent = tool.lockedRadius
        ? `🔒 Zirkel steht fest auf ${Math.round(tool.lockedRadius)} — ein Klick setzt den nächsten Kreis mit genau diesem Radius. Für eine andere Größe auf „Radius neu einstellen“ klicken.`
        : "🔒 Zirkel-Radius wird eingerastet: Zeichne den nächsten Kreis wie gewohnt mit zwei Klicks, danach genügt ein Klick.";
    }
  }
  tool.onChange = updateStatus;

  function setActiveToolBtn(active) {
    [els.btnToolCircle, els.btnToolLine].forEach((b) => b.classList.toggle("geo-btn-active", b === active));
  }

  function showFeedback(kind, msg) {
    els.feedbackBox.hidden = false;
    els.feedbackBox.className = "geo-feedback geo-feedback-" + kind;
    els.feedbackBox.textContent = msg;
  }

  // Alles auf Anfang: keine Zeichnung, kein aktives Werkzeug (sonst würde ein Klick auf die Fläche
  // weiterzeichnen, ohne dass ein Knopf hervorgehoben ist) und keine alte Rückmeldung.
  function reset() {
    tool.setMode(null);
    tool.reset();
    setActiveToolBtn(null);
    updateStatus();
    els.feedbackBox.hidden = true;
  }

  els.btnToolCircle.addEventListener("click", () => {
    tool.setMode("circle");
    setActiveToolBtn(els.btnToolCircle);
    updateStatus();
  });
  els.btnToolLine.addEventListener("click", () => {
    tool.setMode("line");
    setActiveToolBtn(els.btnToolLine);
    updateStatus();
  });
  // Escape bricht einen halb gesetzten Kreis bzw. eine halb gesetzte Gerade ab.
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (tool.cancelPending()) updateStatus();
  });
  els.btnUndo.addEventListener("click", () => {
    tool.undo();
    updateStatus();
  });
  els.btnClear.addEventListener("click", () => {
    if (onClear) onClear();
    tool.reset();
    updateStatus();
    els.feedbackBox.hidden = true;
  });
  els.chkLockRadius.addEventListener("change", () => {
    tool.setRadiusLocked(els.chkLockRadius.checked);
    updateStatus();
  });
  els.btnResetRadius.addEventListener("click", () => {
    tool.clearLockedRadius();
    updateStatus();
  });
  // "Prüfen" und "Tipp" werten dasselbe aus — die Rückmeldung nennt immer den nächsten offenen
  // Schritt, nur der Ton (Fehler/Hinweis) unterscheidet sich.
  els.btnCheck.addEventListener("click", () => {
    const r = check();
    showFeedback(r.ok ? "ok" : "error", r.msg);
  });
  els.btnHint.addEventListener("click", () => {
    const r = check();
    showFeedback(r.ok ? "ok" : "hint", r.msg);
  });

  return { tool, reset, updateStatus, showFeedback, setActiveToolBtn };
}
