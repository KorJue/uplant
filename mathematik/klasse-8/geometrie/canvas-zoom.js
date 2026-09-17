// Vergrößerter Arbeitsbereich ("Vollbild") für die Geometrie-Seiten.
//
// Bewusst eine eigene CSS-Lösung statt der Fullscreen-API: Auf dem iPad ist requestFullscreen für
// beliebige Elemente nicht verlässlich verfügbar. Stattdessen wird der Arbeitsbereich per Klasse
// über die ganze Seite gelegt — das funktioniert in jedem Browser gleich und lässt sich mit
// Escape oder der Schaltfläche wieder schließen.
//
// Vergrößert wird der ganze Arbeitsbereich (Zeichenfläche samt Werkzeugen und Anleitung), nicht
// nur die Zeichenfläche allein: Sonst lägen die Schaltflächen unter dem Vollbild und man könnte
// darin nichts mehr konstruieren.
//
// Im Vollbild wird alles ausgeblendet, was NICHT zum Arbeitsbereich gehört — Überschrift,
// Erklärtext, Hinweiskästen, Quiz. Vorher blieb das alles stehen und nahm Höhe weg; auf einer
// Karte mit viel Vorspann schrumpfte die Zeichenfläche dadurch sogar (bis auf Höhe null), und
// was unten nicht mehr hineinpasste, war wegen overflow: hidden unerreichbar — auf dem iPad
// verschwand so der Knopf zum Beenden. Er hängt jetzt zusätzlich fest in der Ecke.

// Im Vollbild bekommt das <svg> die volle Fläche (width/height: 100 %). Das Seitenverhältnis passt
// dann nicht mehr zur viewBox: preserveAspectRatio legt zwei leere Streifen an den Rand — und
// toSvgPoint() (geo-svg.js) rechnet Bildschirm- in Modellkoordinaten linear über das <svg>-Rechteck
// um, also einschließlich dieser Streifen. Gemessen lag ein Klick dadurch auf dem Handy um 120 von
// 420 Modelleinheiten daneben; im Vollbild zu konstruieren war damit unbrauchbar.
// Statt die Umrechnung zu verbiegen, wird die viewBox auf das Seitenverhältnis der Fläche
// gebracht: Der Maßstab bleibt gleich (kein Verzerren), die Streifen verschwinden, und der
// gewonnene Platz wird zu echter Zeichenfläche — Zirkelbögen laufen nicht mehr aus dem Bild.
const URSPRUNG = new WeakMap();

function zeichenflaechen(karte) {
  return karte.querySelectorAll(".geo-canvas-wrap .geo-svg");
}

function viewBoxAnpassen(karte) {
  for (const svg of zeichenflaechen(karte)) {
    if (!URSPRUNG.has(svg)) URSPRUNG.set(svg, svg.getAttribute("viewBox"));
    const roh = URSPRUNG.get(svg);
    if (!roh) continue;
    const [x, y, w, h] = roh.trim().split(/[\s,]+/).map(Number);
    const r = svg.getBoundingClientRect();
    if (!(r.width > 0 && r.height > 0 && w > 0 && h > 0)) continue;
    const ziel = r.width / r.height;
    let bw = w, bh = h;
    if (ziel > w / h) bw = h * ziel;
    else bh = w / ziel;
    // Mittig erweitern: Die Figur bleibt an derselben Stelle, der Platz wächst nach beiden Seiten.
    svg.setAttribute("viewBox", `${x - (bw - w) / 2} ${y - (bh - h) / 2} ${bw} ${bh}`);
  }
}

function viewBoxZuruecksetzen(karte) {
  for (const svg of zeichenflaechen(karte)) {
    const roh = URSPRUNG.get(svg);
    if (roh) svg.setAttribute("viewBox", roh);
  }
}

const BODY_CLASS = "geo-fullscreen-active";
const AUS = "geo-vollbild-aus";
const OHNE_ANLEITUNG = "geo-ohne-anleitung";
const PFAD = "geo-vollbild-pfad";

// Sammelt, was im Vollbild sichtbar bleiben muss: die Zeichenfläche mit ihrem Layout, die
// Umschalter (ohne sie ließe sich die Aufgabe nicht wechseln) und alle Elemente auf dem Weg
// dorthin. Alles andere in der Karte tritt zurück.
function arbeitsbereich(karte) {
  const layout = karte.querySelector(".geo-layout");
  if (!layout) return null;
  const behalten = new Set();
  const pfadAufnehmen = (el) => {
    for (let e = el; e && e !== karte; e = e.parentElement) behalten.add(e);
  };
  pfadAufnehmen(layout);
  karte.querySelectorAll(".geo-mode-tabs").forEach(pfadAufnehmen);
  // Die Ebenen, auf denen ausgeblendet wird: die Karte und jeder Vorfahr des Layouts darunter.
  // Das Layout selbst ist keine Ebene — seine Kinder sind die Arbeitsfläche.
  const ebenen = [karte];
  for (let e = layout.parentElement; e && e !== karte; e = e.parentElement) ebenen.push(e);
  return { behalten, ebenen };
}

export function setupCanvasZoom(wrapEl, btnEl) {
  if (!wrapEl || !btnEl) return null;

  // Der zweite Knopf entsteht hier und nicht im Markup: Er gehört zum Vollbild, und so hat ihn
  // jede Seite, die das Vollbild benutzt — ohne dass sechs Dateien ihn mitschleppen müssen.
  const hatAnleitung = !!wrapEl.querySelector(".geo-side-col");
  let btnAnleitung = null;
  if (hatAnleitung) {
    btnAnleitung = document.createElement("button");
    btnAnleitung.type = "button";
    btnAnleitung.className = "geo-btn geo-zoom-btn geo-anleitung-btn";
    btnEl.parentElement.insertBefore(btnAnleitung, btnEl);
  }

  function setAnleitungLabel() {
    if (!btnAnleitung) return;
    const aus = wrapEl.classList.contains(OHNE_ANLEITUNG);
    btnAnleitung.textContent = aus ? "📖 Anleitung" : "📖 Anleitung ausblenden";
    btnAnleitung.setAttribute("aria-pressed", aus ? "false" : "true");
  }

  function setLabel() {
    const on = wrapEl.classList.contains("geo-fullscreen");
    btnEl.textContent = on ? "✕ Vollbild beenden" : "⛶ Zeichenfläche vergrößern";
    btnEl.setAttribute("aria-pressed", on ? "true" : "false");
  }

  function nebensachenVerbergen(an) {
    const bereich = arbeitsbereich(wrapEl);
    if (!bereich) return;
    for (const eltern of bereich.ebenen) {
      for (const kind of eltern.children) {
        if (bereich.behalten.has(kind)) continue;
        kind.classList.toggle(AUS, an);
      }
      // Liegt die Zeichenfläche tiefer verschachtelt, muss jede Zwischenebene die Höhe
      // weiterreichen — sonst bleibt sie auf Inhaltshöhe stehen und das Vollbild bringt nichts.
      if (eltern !== wrapEl) eltern.classList.toggle(PFAD, an);
    }
  }

  function toggle(force) {
    const on = force === undefined ? !wrapEl.classList.contains("geo-fullscreen") : force;
    nebensachenVerbergen(on);
    // Das Vollbild startet mit Anleitung: Im geführten Modus steht dort der aktuelle Schritt, beim
    // freien Konstruieren die Aufgabe und die Rückmeldung — ohne sie wüsste man nicht, was zu tun
    // ist. Wer die Fläche ganz für die Konstruktion will, blendet sie mit dem Knopf daneben aus.
    if (!on) wrapEl.classList.remove(OHNE_ANLEITUNG);
    setAnleitungLabel();
    wrapEl.classList.toggle("geo-fullscreen", on);
    // Verhindert, dass die Seite hinter dem Vollbild mitscrollt.
    document.body.classList.toggle(BODY_CLASS, on);
    setLabel();
    // Erst jetzt messen: Die Fläche steht erst mit der gesetzten Klasse fest.
    if (on) viewBoxAnpassen(wrapEl);
    else viewBoxZuruecksetzen(wrapEl);
    // Beim Beenden zurück zur Zeichenfläche: Sie stand vorher irgendwo in der Seite, und ohne
    // dieses Nachführen landet man unvermittelt an einer ganz anderen Stelle.
    if (!on) wrapEl.scrollIntoView({ block: "center" });
  }

  btnEl.addEventListener("click", () => toggle());
  if (btnAnleitung) {
    btnAnleitung.addEventListener("click", () => {
      wrapEl.classList.toggle(OHNE_ANLEITUNG);
      setAnleitungLabel();
      viewBoxAnpassen(wrapEl);
    });
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && wrapEl.classList.contains("geo-fullscreen")) toggle(false);
  });
  // Drehen des Geräts oder Einblenden der Bildschirmtastatur ändert die Fläche — sonst zeigte die
  // viewBox danach wieder ein anderes Seitenverhältnis als die Darstellung.
  window.addEventListener("resize", () => {
    if (wrapEl.classList.contains("geo-fullscreen")) viewBoxAnpassen(wrapEl);
  });
  // Die Höhe ändert sich aber auch ohne Zutun des Geräts: Sobald die Statuszeile („Einstichpunkt
  // gesetzt“) oder die Rückmeldung erscheint, schrumpft die Zeichenfläche im Vollbild um bis zu
  // 44 Bildpunkten. Ohne Nachführen bliebe der freigewordene Rand ungenutzt.
  if (typeof ResizeObserver !== "undefined") {
    const beobachter = new ResizeObserver(() => {
      if (wrapEl.classList.contains("geo-fullscreen")) viewBoxAnpassen(wrapEl);
    });
    for (const svg of zeichenflaechen(wrapEl)) beobachter.observe(svg);
  }
  setLabel();
  setAnleitungLabel();
  return { toggle, isActive: () => wrapEl.classList.contains("geo-fullscreen") };
}
