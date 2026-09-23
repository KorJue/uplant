// Werkbank für die gestaffelten Übungsaufgaben der Grundwissen-Seiten.
//
// Sie stand bisher in jeder der 34 Themenseiten noch einmal — Zeichen für Zeichen dieselbe. Jede
// Verbesserung hätte 34-mal nachgezogen werden müssen, und beim ersten vergessenen Nachziehen
// verhielten sich zwei Seiten verschieden, ohne dass es jemand bemerkt. Deshalb steht sie jetzt
// einmal hier.
//
// Aufbau: vier Reiter (einfach, mittel, schwierig, komplex), in jedem die Aufgaben dieser Stufe
// untereinander. Jede Aufgabe kann
//   * eine einzelne Zahl verlangen (wie bisher) oder mehrere Felder zum Ausfüllen,
//   * Tipps anbieten, die auf Knopfdruck einer nach dem anderen erscheinen,
//   * neu gewürfelt werden, ohne dass die Seite neu geladen wird.
// Geprüft wird auf Knopfdruck; danach steht die Musterlösung darunter.
//
// Was eine Aufgabe liefern muss, steht bei mountUebungsaufgaben().

"use strict";

const STUFEN = ["einfach", "mittel", "schwierig", "komplex"];

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

// Deutsche Eingabe: Komma als Dezimaltrennzeichen, Punkt als Tausenderpunkt, echtes Minuszeichen.
// Einzelne Seiten brauchen mehr (Brüche, Einheiten) und geben deshalb ihre eigene Fassung mit.
export function parseFlexibleNumber(raw) {
  if (raw == null) return NaN;
  const s = String(raw).trim().replace(/\s/g, "").replace(/−/g, "-").replace(/\./g, "").replace(",", ".");
  return parseFloat(s);
}

// Eine einzelne Aufgabe: Titel, Angabe, Eingabe(n), Prüfen, Tipp, Neu würfeln.
function mountAufgabe(container, def, parse) {
  const box = el("div", { class: "aufgabe-box" });
  box.appendChild(el("h3", {}, [def.titel, el("span", { class: "schwierigkeit-badge " + def.schwierigkeit }, def.schwierigkeit)]));
  const promptEl = el("div", { class: "aufgabe-prompt" });
  box.appendChild(promptEl);

  // Ein einzelnes Feld liegt in derselben Zeile wie die Knöpfe (wie bisher); mehrere Felder stehen
  // als Liste darüber, damit jedes seine eigene Beschriftung und Rückmeldung bekommt.
  const felderListe = el("div", { class: "aufgabe-felder" });
  box.appendChild(felderListe);
  const row = el("div", { class: "exercise-input-row" });
  // Der Platzhalter ist keine Beschriftung: Er verschwindet beim Tippen, und Screenreader lesen
  // ihn nicht zuverlässig vor. Deshalb trägt das Feld seinen Namen zusätzlich als aria-label.
  const input = el("input", { type: "text", placeholder: "Antwort", "aria-label": "Antwort zu: " + def.titel });
  const btnPruefen = el("button", { type: "button", class: "btn btn-primary" }, "Prüfen");
  const btnTipp = el("button", { type: "button", class: "btn btn-tipp" }, "💡 Tipp");
  const btnWuerfeln = el("button", { type: "button", class: "btn btn-wuerfeln" }, def.wuerfelText || "🎲 Neue Zahlen");
  row.appendChild(input);
  row.appendChild(btnPruefen);
  row.appendChild(btnTipp);
  row.appendChild(btnWuerfeln);
  box.appendChild(row);
  const tippBox = el("div", { class: "aufgabe-tipps" });
  box.appendChild(tippBox);
  // aria-live: Die Rückmeldung erscheint nach einem Klick an anderer Stelle; so wird sie angesagt,
  // ohne dass der Fokus dorthin springen muss.
  const feedback = el("div", { class: "aufgabe-feedback", "aria-live": "polite" });
  box.appendChild(feedback);

  let current = null;
  let felder = [];
  let gezeigteTipps = 0;

  function baueFelder() {
    felderListe.innerHTML = "";
    felder = [];
    if (!current.felder) return;
    for (const f of current.felder) {
      const feldInput = el("input", { type: "text", placeholder: f.platzhalter || "?" });
      const zeile = el("label", { class: "aufgabe-feld" }, [
        el("span", { class: "aufgabe-feld-name", html: f.name }),
        feldInput,
        f.einheit ? el("span", { class: "aufgabe-feld-einheit" }, f.einheit) : null,
      ]);
      felderListe.appendChild(zeile);
      felder.push({ spec: f, input: feldInput });
      feldInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") btnPruefen.click();
      });
    }
  }

  function neueAufgabe() {
    current = def.generate();
    promptEl.innerHTML = current.promptHtml;
    baueFelder();
    // Bei mehreren Feldern hat das einzelne Eingabefeld nichts zu suchen — es wird aus der Seite
    // genommen und nicht nur versteckt: Ein verstecktes Feld zählt sonst überall mit, wo „die
    // Eingabefelder dieser Aufgabe“ gesucht werden.
    const einzeln = !current.felder;
    if (einzeln && !input.isConnected) row.insertBefore(input, btnPruefen);
    if (!einzeln && input.isConnected) input.remove();
    input.value = "";
    input.placeholder = current.placeholder || "Antwort";
    gezeigteTipps = 0;
    tippBox.innerHTML = "";
    btnTipp.hidden = !(current.tipps && current.tipps.length);
    btnTipp.textContent = "💡 Tipp";
    btnTipp.disabled = false;
    feedback.innerHTML = "";
  }

  // Ein Feld auswerten: gibt zurück, ob es stimmt, und färbt es ein. „check“ nimmt die Eingabe im
  // Rohzustand — Brüche etwa sind nur als Paar richtig („2/4“ ist nicht „1/2“, wenn vollständig
  // gekürzt verlangt ist), und das lässt sich nicht über einen Zahlenwert entscheiden.
  function pruefeFeld(spec, roh) {
    const wert = parse(roh);
    const tol = spec.toleranz ?? current.tolerance ?? 0.01;
    const ok = spec.check
      ? roh !== "" && spec.check(roh)
      : roh !== "" && !isNaN(wert) && Math.abs(wert - spec.soll) < tol;
    return { ok, wert, hinweis: !ok && spec.hinweis ? spec.hinweis(roh, wert) : "" };
  }

  function pruefen() {
    let ok;
    let hinweise = [];
    if (current.felder) {
      ok = true;
      felder.forEach(({ spec, input: feldInput }) => {
        const roh = feldInput.value.trim();
        const r = pruefeFeld(spec, roh);
        feldInput.classList.toggle("feld-ok", r.ok);
        feldInput.classList.toggle("feld-fehler", !r.ok);
        if (!r.ok) {
          ok = false;
          if (r.hinweis) hinweise.push(r.hinweis);
        }
      });
    } else {
      const roh = input.value.trim();
      const wert = parse(roh);
      const tol = current.tolerance ?? 0.01;
      ok = current.check ? current.check(roh) : !isNaN(wert) && Math.abs(wert - current.correct) < tol;
      const h = !ok && current.hinweis ? current.hinweis(roh, wert) : "";
      if (h) hinweise.push(h);
      if (!ok && !roh) hinweise = [];
    }

    // Die eigene Eingabe wird zurückgespiegelt: Wer „3,5“ tippt und „35“ liest, sieht sofort, dass
    // das Komma verrutscht ist.
    const roh = current.felder ? felder.map(({ input: i }) => i.value.trim()).filter(Boolean).join(" | ") : input.value.trim();
    feedback.innerHTML =
      (ok
        ? `<div class="status ok">✓ Richtig!</div>`
        : `<div class="status err">✗ Noch nicht richtig${roh ? " — deine Eingabe: " + roh : " — du hast noch keine Antwort eingetragen"}.</div>` +
          hinweise.map((h) => `<div style="margin-bottom:0.3rem">${h}</div>`).join("")) +
      `<div class="musterloesung"><span class="ml-label">Musterlösung</span>${current.musterloesungHtml}</div>`;
  }

  btnPruefen.addEventListener("click", pruefen);
  btnWuerfeln.addEventListener("click", neueAufgabe);
  btnTipp.addEventListener("click", () => {
    const tipps = current.tipps || [];
    if (gezeigteTipps >= tipps.length) return;
    tippBox.appendChild(el("div", { class: "aufgabe-tipp", html: `<span class="tipp-label">Tipp ${gezeigteTipps + 1}</span>${tipps[gezeigteTipps]}` }));
    gezeigteTipps++;
    if (gezeigteTipps >= tipps.length) {
      btnTipp.disabled = true;
      btnTipp.textContent = "💡 keine weiteren Tipps";
    } else {
      btnTipp.textContent = `💡 noch ein Tipp (${tipps.length - gezeigteTipps})`;
    }
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") btnPruefen.click();
  });

  neueAufgabe();
  container.appendChild(box);
}

/**
 * Baut den Übungsblock einer Seite.
 *
 * @param container  das Element, in das der Block kommt
 * @param defs       die Aufgaben. Jede braucht:
 *                     schwierigkeit  "einfach" | "mittel" | "schwierig" | "komplex"
 *                     titel          Überschrift
 *                     generate()     liefert eine gewürfelte Aufgabe:
 *                       promptHtml         die Angabe
 *                       correct, tolerance gesuchte Zahl (eine einzelne Eingabe)
 *                       check(roh)         statt correct: entscheidet selbst über die Eingabe
 *                                          (Brüche, Terme — alles, was keine einzelne Zahl ist)
 *                         hinweis(roh, wert)  gezielter Hinweis auf einen typischen Fehler
 *                       felder              stattdessen mehrere Felder:
 *                         [{ name, soll, einheit?, toleranz?, platzhalter?, hinweis? }]
 *                       tipps               Tipps, die auf Knopfdruck nacheinander erscheinen
 *                       musterloesungHtml   der gerechnete Lösungsweg
 * @param opt.parse  eigene Zahlenerkennung der Seite (Brüche, Einheiten …)
 */
export function mountUebungsaufgaben(container, defs, opt = {}) {
  const parse = opt.parse || parseFlexibleNumber;
  const tabBar = el("div", { class: "schwierigkeit-tabs" });
  const panel = el("div", { class: "schwierigkeit-tab-panel" });
  container.appendChild(tabBar);
  container.appendChild(panel);

  // Die Reiter stehen in der Reihenfolge der Stufen, nicht in der Reihenfolge der Aufgaben: Eine
  // Seite darf ihre Aufgaben aufschreiben, wie sie will.
  const stufen = STUFEN.filter((s) => defs.some((d) => d.schwierigkeit === s));

  function zeige(idx) {
    // aria-pressed sagt einem Screenreader, welcher Reiter gerade offen ist — die Farbe allein
    // sieht er nicht.
    [...tabBar.children].forEach((b, i) => {
      b.classList.toggle("active", i === idx);
      b.setAttribute("aria-pressed", String(i === idx));
    });
    panel.innerHTML = "";
    for (const d of defs.filter((x) => x.schwierigkeit === stufen[idx])) mountAufgabe(panel, d, parse);
  }

  stufen.forEach((s, i) => {
    const label = s.charAt(0).toUpperCase() + s.slice(1);
    const btn = el("button", { type: "button" }, label);
    btn.addEventListener("click", () => zeige(i));
    tabBar.appendChild(btn);
  });
  zeige(0);
}
