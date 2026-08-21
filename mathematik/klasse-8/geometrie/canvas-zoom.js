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

const BODY_CLASS = "geo-fullscreen-active";

export function setupCanvasZoom(wrapEl, btnEl) {
  if (!wrapEl || !btnEl) return null;

  function setLabel() {
    const on = wrapEl.classList.contains("geo-fullscreen");
    btnEl.textContent = on ? "✕ Vollbild beenden" : "⛶ Zeichenfläche vergrößern";
    btnEl.setAttribute("aria-pressed", on ? "true" : "false");
  }

  function toggle(force) {
    const on = force === undefined ? !wrapEl.classList.contains("geo-fullscreen") : force;
    wrapEl.classList.toggle("geo-fullscreen", on);
    // Verhindert, dass die Seite hinter dem Vollbild mitscrollt.
    document.body.classList.toggle(BODY_CLASS, on);
    setLabel();
  }

  btnEl.addEventListener("click", () => toggle());
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && wrapEl.classList.contains("geo-fullscreen")) toggle(false);
  });
  setLabel();
  return { toggle, isActive: () => wrapEl.classList.contains("geo-fullscreen") };
}
