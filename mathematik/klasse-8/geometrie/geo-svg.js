// Wiederverwendbare SVG-Zeichen- und Interaktionsbausteine für die Geometrie-Konstruktionen
// (Klasse 8): ziehbare Punkte (Maus + Touch über Pointer Events), Zeichenprimitive (Strecke,
// Gerade, Kreis, Zirkelbogen, rechter-Winkel-Marke) sowie ein klick-basiertes Werkzeug
// ("Kreis"/"Gerade") für das freie Konstruieren mit anschließender Prüfung.

import { add, scale, sub, len, dist, norm, angleOf } from "./geo-core.js?v=21";

const SVG_NS = "http://www.w3.org/2000/svg";

// Auf Geräten, die per Finger bedient werden, brauchen Ziehpunkte und das Einrasten von Klicks
// deutlich größere Trefferflächen als unter der Maus.
export const COARSE_POINTER = typeof window !== "undefined" && window.matchMedia ? window.matchMedia("(pointer: coarse)").matches : false;
const HANDLE_HIT_RADIUS = COARSE_POINTER ? 26 : 16;

export function svgEl(tag, attrs = {}) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}
export function clearEl(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
}

// Rechnet eine Bildschirmposition (clientX/clientY) in SVG-Koordinaten um. Bewusst über
// getBoundingClientRect() statt getScreenCTM(): Auf manchen Mobilgeräten (v. a. wenn die Seite per
// Pinch-Zoom vergrößert ist — auf kleinen Smartphone-Bildschirmen deutlich häufiger als auf einem
// iPad) liefert getScreenCTM() eine Matrix, die den aktuellen Zoom nicht berücksichtigt; das Ziehen
// eines Punkts bewegte sich dann nur noch um einen Bruchteil des tatsächlichen Fingerwegs.
// getBoundingClientRect() ist dagegen laut Spezifikation immer im selben (bereits um Pinch-Zoom
// bereinigten) Koordinatensystem wie clientX/clientY angegeben. Die Umrechnung über das viewBox-
// Rechteck setzt voraus, dass Breite und Höhe des gerenderten <svg> genau das viewBox-Seiten-
// verhältnis haben — hier immer der Fall (CSS: width: 100%; height: auto).
export function toSvgPoint(svg, evt) {
  const rect = svg.getBoundingClientRect();
  const vb = svg.viewBox.baseVal;
  if (!rect.width || !rect.height || !vb) return { x: 0, y: 0 };
  return {
    x: vb.x + ((evt.clientX - rect.left) / rect.width) * vb.width,
    y: vb.y + ((evt.clientY - rect.top) / rect.height) * vb.height,
  };
}

// ---------- Zeichenprimitive ----------

export function drawPoint(layer, p, label, cls = "") {
  const g = svgEl("g", { class: "geo-point " + cls });
  g.appendChild(svgEl("circle", { cx: p.x, cy: p.y, r: 4.5, class: "geo-point-dot" }));
  if (label) {
    const t = svgEl("text", { x: p.x, y: p.y, class: "geo-point-label" });
    t.textContent = label;
    g.appendChild(t);
  }
  layer.appendChild(g);
  return g;
}

export function drawSegment(layer, a, b, cls = "") {
  const el = svgEl("line", { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: "geo-segment " + cls });
  layer.appendChild(el);
  return el;
}

// Zeichnet eine über einen Punkt + Richtung definierte Gerade, bis zum Rand der viewBox verlängert.
export function drawLine(layer, p, dir, box, cls = "") {
  const d = norm(dir);
  const tMax = (Math.abs(box.w) + Math.abs(box.h)) * 2 + 50;
  const a = add(p, scale(d, tMax));
  const b = add(p, scale(d, -tMax));
  const el = svgEl("line", { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: "geo-line " + cls });
  layer.appendChild(el);
  return el;
}

export function drawCircle(layer, c, r, cls = "") {
  const el = svgEl("circle", { cx: c.x, cy: c.y, r, class: "geo-circle " + cls });
  layer.appendChild(el);
  return el;
}

// Zirkelbogen: Kreisbogen um "center" mit Radius r, zentriert auf die Richtung nach "toward",
// mit Öffnungswinkel 2*halfSpanDeg — sieht aus wie ein echter Zirkelschlag statt eines Vollkreises.
export function drawCompassArc(layer, center, toward, r, halfSpanDeg = 28, cls = "") {
  const centerDeg = angleOf(sub(toward, center));
  const startDeg = centerDeg - halfSpanDeg;
  const endDeg = centerDeg + halfSpanDeg;
  const toRad = (d) => (d * Math.PI) / 180;
  const sx = center.x + r * Math.cos(toRad(startDeg));
  const sy = center.y + r * Math.sin(toRad(startDeg));
  const ex = center.x + r * Math.cos(toRad(endDeg));
  const ey = center.y + r * Math.sin(toRad(endDeg));
  const path = `M ${sx} ${sy} A ${r} ${r} 0 0 1 ${ex} ${ey}`;
  const el = svgEl("path", { d: path, class: "geo-arc " + cls, fill: "none" });
  layer.appendChild(el);
  return el;
}

// Zirkelbogen zwischen zwei festen Winkeln (kürzerer Weg) — für einen einzelnen Bogen, der beide
// Schenkel eines Winkels schneidet (Winkelhalbierende, Schritt 1).
export function drawArcSpan(layer, center, r, aDeg, bDeg, cls = "") {
  const delta = ((bDeg - aDeg + 540) % 360) - 180; // kürzester Drehsinn, in (-180, 180]
  const endDeg = aDeg + delta;
  const sweep = delta >= 0 ? 1 : 0;
  const toRad = (d) => (d * Math.PI) / 180;
  const sx = center.x + r * Math.cos(toRad(aDeg));
  const sy = center.y + r * Math.sin(toRad(aDeg));
  const ex = center.x + r * Math.cos(toRad(endDeg));
  const ey = center.y + r * Math.sin(toRad(endDeg));
  const path = `M ${sx} ${sy} A ${r} ${r} 0 0 ${sweep} ${ex} ${ey}`;
  const el = svgEl("path", { d: path, class: "geo-arc " + cls, fill: "none" });
  layer.appendChild(el);
  return el;
}

// Markierung für einen erst halb gesetzten Kreis/eine halb gesetzte Gerade: bewusst ein offener,
// gestrichelter Ring statt eines gefüllten Punktes, damit er nicht wie ein fertig konstruierter
// Punkt aussieht.
export function drawPendingMarker(layer, p) {
  const g = svgEl("g", { class: "geo-pending-marker" });
  g.appendChild(svgEl("circle", { cx: p.x, cy: p.y, r: 7, class: "geo-pending-ring" }));
  g.appendChild(svgEl("circle", { cx: p.x, cy: p.y, r: 1.8, class: "geo-pending-dot" }));
  layer.appendChild(g);
  return g;
}

export function drawCross(layer, p, cls = "") {
  const s = 6;
  const g = svgEl("g", { class: "geo-cross " + cls });
  g.appendChild(svgEl("line", { x1: p.x - s, y1: p.y - s, x2: p.x + s, y2: p.y + s }));
  g.appendChild(svgEl("line", { x1: p.x - s, y1: p.y + s, x2: p.x + s, y2: p.y - s }));
  layer.appendChild(g);
  return g;
}

// Kleines Quadrat am Lotfußpunkt als "rechter Winkel"-Markierung, ausgerichtet an der Geraden AB.
export function drawRightAngleMarker(layer, foot, towardA, towardB, cls = "") {
  const s = 11;
  const d1 = norm(sub(towardA, foot));
  const d2 = norm(sub(towardB, foot));
  const p1 = add(foot, scale(d1, s));
  const p2 = add(add(foot, scale(d1, s)), scale(d2, s));
  const p3 = add(foot, scale(d2, s));
  const el = svgEl("polyline", {
    points: `${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`,
    class: "geo-rightangle " + cls,
    fill: "none",
  });
  layer.appendChild(el);
  return el;
}

// ---------- Ziehbare Punkte (Dreieckspunkte etc.) ----------

// Macht "handle" (ein SVG-Element, meist ein unsichtbarer größerer Trefferkreis) per Maus/Touch
// ziehbar. onDrag(x, y) bekommt die neue Position in SVG-Koordinaten (vor dem Clamping durch den
// Aufrufer). onStart/onEnd sind optionale Callbacks.
//
// move/up hängen bewusst am document statt am Handle selbst, und ohne setPointerCapture: Da der
// Punkt bei jedem Schritt an die neue Fingerposition gezeichnet wird, reicht ein Frame Verzögerung,
// damit der Finger kurzzeitig neben dem (kleinen) Trefferkreis steht — mit Listenern nur am Handle
// bricht der Zug dann sofort ab ("Fokus verloren"), weil weitere Events dieses Element gar nicht
// mehr treffen. setPointerCapture sollte das eigentlich abfangen, verhält sich auf SVG-Elementen
// aber nicht auf jedem mobilen Browser zuverlässig. Am document lauschen umgeht das Problem
// vollständig: Es kommt nur noch auf die (stabile) Pointer-ID an, nicht mehr auf die Trefferfläche.
//
// Der zusätzliche, nicht-passive touchmove-Listener ist auf Android (u. a. Samsung Internet UND
// Chrome, dort beobachtet) nötig: preventDefault() auf pointerdown unterdrückt dort das native
// Scrollen/die Gesten-Erkennung der Seite NICHT zuverlässig — offenbar wird die touch-action:none-
// Regel auf dem kleinen SVG-Trefferkreis nicht in jedem Fall strikt gegen das touch-action:
// manipulation der übergeordneten Zeichenfläche durchgesetzt. Symptom ohne diesen Listener: Der
// Punkt bewegt sich nur um einen winzigen, von der Fingergeschwindigkeit abhängigen Betrag, weil
// der Browser das Touch-Gesture nach wenigen Millisekunden als Seiten-Wisch übernimmt. Ein
// touchmove-Listener mit { passive: false } + preventDefault() verhindert das robust, unabhängig
// von der touch-action-Berechnung des jeweiligen Browsers.
export function makeDraggable(svg, handle, onDrag, opts = {}) {
  handle.classList.add("geo-draggable");
  handle.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    const pointerId = e.pointerId;
    handle.classList.add("geo-dragging");
    if (opts.onStart) opts.onStart();
    function move(ev) {
      if (ev.pointerId !== pointerId) return;
      const p = toSvgPoint(svg, ev);
      onDrag(p.x, p.y);
    }
    function blockScroll(ev) {
      ev.preventDefault();
    }
    function up(ev) {
      if (ev.pointerId !== pointerId) return;
      handle.classList.remove("geo-dragging");
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", up);
      document.removeEventListener("pointercancel", up);
      document.removeEventListener("touchmove", blockScroll);
      if (opts.onEnd) opts.onEnd();
    }
    document.addEventListener("pointermove", move);
    document.addEventListener("pointerup", up);
    document.addEventListener("pointercancel", up);
    document.addEventListener("touchmove", blockScroll, { passive: false });
  });
}

// Zeichnet einen ziehbaren Dreieckspunkt: sichtbarer Punkt + größerer unsichtbarer Trefferbereich,
// beide ziehbar, mit Label. onMove(x, y, handle) wird während des Ziehens aufgerufen — der
// Aufrufer ist dafür zuständig, die neue (ggf. begrenzte) Position per handle.update(p) zu
// übernehmen, damit der Punkt selbst nicht bei jedem Zeichnen des restlichen Bildes neu erzeugt
// werden muss (das würde sonst bei jedem Redraw neue Pointer-Listener anhängen).
export function drawDraggablePoint(svg, layer, p, label, onMove, opts = {}) {
  const g = svgEl("g", { class: "geo-point geo-point-draggable" });
  const hit = svgEl("circle", { cx: p.x, cy: p.y, r: HANDLE_HIT_RADIUS, class: "geo-point-hit" });
  const dot = svgEl("circle", { cx: p.x, cy: p.y, r: 5.5, class: "geo-point-dot" });
  g.appendChild(hit);
  g.appendChild(dot);
  let textEl = null;
  if (label) {
    textEl = svgEl("text", { x: p.x, y: p.y, class: "geo-point-label" });
    textEl.textContent = label;
    g.appendChild(textEl);
  }
  layer.appendChild(g);
  const handle = {
    update(np) {
      hit.setAttribute("cx", np.x);
      hit.setAttribute("cy", np.y);
      dot.setAttribute("cx", np.x);
      dot.setAttribute("cy", np.y);
      if (textEl) {
        textEl.setAttribute("x", np.x);
        textEl.setAttribute("y", np.y);
      }
    },
    g,
  };
  makeDraggable(svg, hit, (x, y) => onMove(x, y, handle), opts);
  return handle;
}

// ---------- Klick-basiertes Werkzeug für freies Konstruieren ----------

// Verwaltet den Zustand einer freien Konstruktion mit "Kreis"- und "Gerade"-Werkzeug: Klicks auf
// die Zeichenfläche legen Kreismittelpunkt+Radius bzw. zwei Geradenpunkte fest. snapPoints ist
// eine Funktion (x,y) => {x,y}, die auf vorgegebene Punkte/Schnittpunkte einrastet, wenn nah genug.
export class ConstructionTool {
  constructor(svg, layer, snapFn) {
    this.svg = svg;
    this.layer = layer;
    this.snapFn = snapFn || ((p) => p);
    this.mode = null; // "circle" | "line" | null
    this.circles = []; // {center, radius}
    this.lines = []; // {a, b}
    // Reihenfolge der gesetzten Elemente ("circle"/"line") für ein chronologisches Rückgängig.
    this._order = [];
    this.pending = null; // {type:"circle", center} während des zweiten Klicks
    // "Zirkel eingerastet": Wie bei einem echten Zirkel, den man zwischen zwei Bögen nicht
    // verstellt — ist ein Radius gemerkt, genügt ein einzelner Klick auf den neuen Einstichpunkt.
    this.lockedRadius = null;
    this.radiusLocked = false;
    this.onChange = null;
    // Optionaler Haken (circles) => [cssKlasse, ...], einmal pro Zeichenvorgang aufgerufen: damit
    // können fertig verwendete Hilfskreise grau zurücktreten, ohne dass die Zeichenlogik hier die
    // Konstruktion kennen muss.
    this.circleClasses = null;
    svg.addEventListener("click", (e) => this._onClick(e));
    svg.addEventListener("pointermove", (e) => this._onMove(e));
    // Verlässt der Zeiger die Zeichenfläche, verschwindet die Vorschau. Sonst bliebe der
    // gestrichelte Vorschaukreis an der letzten Mausposition stehen und sähe aus wie ein
    // fertig gezeichneter Kreis.
    svg.addEventListener("pointerleave", () => {
      if (!this._previewPoint) return;
      this._previewPoint = null;
      this._render();
    });
  }
  setMode(mode) {
    this.mode = mode;
    this.pending = null;
    this._previewPoint = null;
    // Sichtbares Zeichen-Fadenkreuz — und zugleich der Grund, warum iOS auf der Fläche überhaupt
    // click-Ereignisse auslöst (Safari erzeugt sie nur für "anklickbar" wirkende Elemente).
    this.svg.classList.toggle("geo-drawing", !!mode);
    this._render();
  }
  // Bricht einen halb gesetzten Kreis/eine halb gesetzte Gerade ab (erster Klick schon erfolgt,
  // zweiter noch nicht). Gibt zurück, ob es überhaupt etwas abzubrechen gab.
  cancelPending() {
    if (!this.pending) return false;
    this.pending = null;
    this._previewPoint = null;
    this._render();
    return true;
  }
  // Radius-Sperre umschalten. Beim Einschalten wird der Radius des zuletzt gezeichneten Kreises
  // übernommen (falls vorhanden) — sonst rastet der nächste gezeichnete Kreis den Radius ein.
  setRadiusLocked(locked) {
    this.radiusLocked = locked;
    if (locked) {
      if (this.circles.length) this.lockedRadius = this.circles[this.circles.length - 1].radius;
    } else {
      this.lockedRadius = null;
    }
    this.pending = null;
    this._render();
  }
  // Gemerkten Radius verwerfen, ohne die Sperre auszuschalten: Der nächste Kreis wird wieder mit
  // zwei Klicks gezeichnet und rastet dann als neuer Radius ein. Ohne das wäre ein einmal
  // eingerasteter Zirkel nicht mehr verstellbar.
  clearLockedRadius() {
    this.lockedRadius = null;
    this.pending = null;
    this._previewPoint = null;
    this._render();
  }
  // Nimmt den zuletzt ausgeführten Schritt zurück — Kreis oder Gerade, je nachdem was zuletzt kam.
  // Ohne die Reihenfolge in _order würde ein verklickter Kreis eine längst fertige Gerade löschen.
  undo() {
    if (this.pending) {
      this.pending = null;
      this._previewPoint = null;
    } else {
      const last = this._order.pop();
      if (last === "line") this.lines.pop();
      else if (last === "circle") this.circles.pop();
    }
    this._render();
  }
  reset() {
    this.circles = [];
    this.lines = [];
    this._order = [];
    this.pending = null;
    this._previewPoint = null;
    // Der eingerastete Radius gehört zur weggeworfenen Zeichnung; die Einstellung selbst
    // ("Zirkel nicht verstellen") bleibt aktiv und rastet beim nächsten Kreis neu ein.
    this.lockedRadius = null;
    this._render();
  }
  _onClick(e) {
    if (!this.mode) return;
    const raw = toSvgPoint(this.svg, e);
    const p = this.snapFn(raw);
    if (this.mode === "circle") {
      if (this.radiusLocked && this.lockedRadius) {
        // Zirkel ist eingerastet: ein Klick setzt den Einstichpunkt, der Radius bleibt gleich.
        this.circles.push({ center: p, radius: this.lockedRadius });
        this._order.push("circle");
        this.pending = null;
      } else if (!this.pending) {
        this.pending = { type: "circle", center: p };
      } else {
        const r = dist(this.pending.center, p);
        if (r > 6) {
          this.circles.push({ center: this.pending.center, radius: r });
          this._order.push("circle");
          if (this.radiusLocked) this.lockedRadius = r;
        }
        this.pending = null;
      }
    } else if (this.mode === "line") {
      if (!this.pending) {
        this.pending = { type: "line", a: p };
      } else {
        if (dist(this.pending.a, p) > 6) {
          this.lines.push({ a: this.pending.a, b: p });
          this._order.push("line");
        }
        this.pending = null;
      }
    }
    this._render();
    if (this.onChange) this.onChange();
  }
  _onMove(e) {
    // Bei eingerastetem Zirkel gibt es keinen zweiten Klick — trotzdem soll der Kreis schon beim
    // Bewegen als Vorschau am Mauszeiger hängen, damit die Position vorher klar ist.
    const lockedPreview = this.mode === "circle" && this.radiusLocked && this.lockedRadius;
    if (!this.mode || (!this.pending && !lockedPreview)) return;
    const raw = toSvgPoint(this.svg, e);
    this._previewPoint = this.snapFn(raw);
    this._render();
  }
  _render() {
    clearEl(this.layer);
    const extraCls = this.circleClasses ? this.circleClasses(this.circles) : null;
    this.circles.forEach((c, i) => drawCircle(this.layer, c.center, c.radius, "geo-user-circle " + ((extraCls && extraCls[i]) || "")));
    this.lines.forEach((l) => {
      const d = sub(l.b, l.a);
      drawLine(this.layer, l.a, d, { w: 2000, h: 2000 }, "geo-user-line");
    });
    if (this.mode === "circle" && this.radiusLocked && this.lockedRadius && this._previewPoint) {
      drawCircle(this.layer, this._previewPoint, this.lockedRadius, "geo-user-circle geo-preview");
      drawPendingMarker(this.layer, this._previewPoint);
    } else if (this.pending && this.pending.type === "circle") {
      drawPendingMarker(this.layer, this.pending.center);
      if (this._previewPoint) {
        const r = dist(this.pending.center, this._previewPoint);
        drawCircle(this.layer, this.pending.center, r, "geo-user-circle geo-preview");
      }
    } else if (this.pending && this.pending.type === "line") {
      drawPendingMarker(this.layer, this.pending.a);
      if (this._previewPoint) {
        const d = sub(this._previewPoint, this.pending.a);
        if (len(d) > 1) drawLine(this.layer, this.pending.a, d, { w: 2000, h: 2000 }, "geo-user-line geo-preview");
      }
    }
    if (this.extraRender) this.extraRender();
  }
}
