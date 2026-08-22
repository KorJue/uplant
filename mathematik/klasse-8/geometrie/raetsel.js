// Seitenlogik für "Das Rätsel um den Goldenen Zirkel": Fallauswahl, die drei Differenzierungsstufen,
// Hilfen, Selbsteinschätzung, gesammelte Buchstaben und der Rätsel-Pass. Die eigentliche Mathematik
// (was konstruiert und wie geprüft wird) steckt in raetsel-tasks.js, das Zeichnen und die Werkzeuge
// in geo-svg.js / free-ui.js — hier geht es nur um den Ablauf drumherum.

import * as GS from "./geo-svg.js?v=16";
import { norm, sub } from "./geo-core.js?v=16";
import { setupCanvasZoom } from "./canvas-zoom.js?v=16";
import { setupFreeConstruction } from "./free-ui.js?v=16";
import { FAELLE, LOESUNGSWORT, randomCaseTriangle, W, H } from "./raetsel-tasks.js?v=16";

const STORAGE_KEY = "uplant-geo-raetsel";
const AMPEL = [
  { wert: "sicher", icon: "😀", text: "Das kann ich sicher" },
  { wert: "mittel", icon: "😐", text: "Das geht so" },
  { wert: "unsicher", icon: "🤔", text: "Da brauche ich noch Hilfe" },
];

const svg = document.getElementById("geo-svg");
const layerScene = document.getElementById("layer-scene");
const layerPoints = document.getElementById("layer-points");
const layerUser = document.getElementById("layer-user");
const caseTabs = document.getElementById("case-tabs");
const sideCol = document.getElementById("side-col");
const caseLayout = document.getElementById("case-layout");
const passView = document.getElementById("pass-view");
const wortLeiste = document.getElementById("wort-leiste");

// Fortschritt je Fall: { geloest: bool, ampel: "sicher"|"mittel"|"unsicher"|null }. Bewusst lokal im
// Browser gespeichert — die Seite hat keinen Server, und der Rätsel-Pass soll eine Unterrichtsstunde
// später noch da sein. Schlägt der Zugriff fehl (privates Fenster, gesperrte Website-Daten), läuft
// alles unverändert weiter, nur eben ohne Gedächtnis.
function ladeFortschritt() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return raw && typeof raw === "object" ? raw : {};
  } catch (e) {
    return {};
  }
}
function speichereFortschritt() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fortschritt));
  } catch (e) {
    /* ohne Speicher weiterarbeiten */
  }
}

const fortschritt = ladeFortschritt();
function standVon(key) {
  if (!fortschritt[key]) fortschritt[key] = { geloest: false, ampel: null };
  return fortschritt[key];
}

// Start bewusst immer im Knobelmodus (Stufe 3): Sonst würde beim ersten Öffnen einer Seite schon
// verraten, welche Konstruktion gebraucht wird — und genau das soll das Rätsel ja nicht tun.
const state = { fall: 0, stufe: 3, pass: false };
let tri = null;

function aktuellerFall() {
  return FAELLE[state.fall];
}

// ---------- Zeichenfläche ----------

function neuesDreieck() {
  tri = randomCaseTriangle(aktuellerFall().minEulerSpan);
}

function renderSzene() {
  const fall = aktuellerFall();
  GS.clearEl(layerScene);
  GS.clearEl(layerPoints);
  const { A, B, C } = tri;
  if (fall.flaeche) {
    layerScene.appendChild(GS.svgEl("polygon", { points: `${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y}`, class: "raetsel-flaeche" }));
  }
  GS.drawSegment(layerScene, A, B);
  GS.drawSegment(layerScene, B, C);
  GS.drawSegment(layerScene, C, A);
  // Eckbuchstabe und Ortsname stehen bewusst in *einer* Beschriftung, vom Schwerpunkt aus nach außen
  // gesetzt: Zwei getrennte Texte würden sich je nach Dreiecksform überlagern, und innerhalb des
  // Dreiecks wäre der Name vom eigenen Konstruktionsgewirr kaum noch zu lesen.
  const mitte = { x: (A.x + B.x + C.x) / 3, y: (A.y + B.y + C.y) / 3 };
  ["A", "B", "C"].forEach((k) => {
    const g = GS.drawPoint(layerPoints, tri[k], "");
    g.dataset.vertex = k;
    const raus = norm(sub(tri[k], mitte));
    // Bei einer Ecke nahe am Rand liefe die nach außen gesetzte Beschriftung sonst aus der
    // Zeichenfläche heraus — sie ist mittig ausgerichtet, daher der großzügige Rand in x-Richtung.
    const t = GS.svgEl("text", {
      x: Math.min(W - 62, Math.max(62, tri[k].x + raus.x * 24)),
      y: Math.min(H - 12, Math.max(14, tri[k].y + raus.y * 24)),
      class: "raetsel-ortsname",
    });
    const buchstabe = GS.svgEl("tspan", { class: "raetsel-ortsname-buchstabe" });
    buchstabe.textContent = k;
    t.appendChild(buchstabe);
    t.appendChild(document.createTextNode(" " + fall.namen[k]));
    layerPoints.appendChild(t);
  });
}

// ---------- Freies Konstruieren ----------

const free = setupFreeConstruction({
  svg,
  layer: layerUser,
  els: {
    btnToolCircle: document.getElementById("btn-tool-circle"),
    btnToolLine: document.getElementById("btn-tool-line"),
    btnUndo: document.getElementById("btn-undo"),
    btnClear: document.getElementById("btn-clear"),
    btnCheck: document.getElementById("btn-check"),
    btnHint: document.getElementById("btn-hint"),
    chkLockRadius: document.getElementById("chk-lock-radius"),
    btnResetRadius: document.getElementById("btn-reset-radius"),
    radiusStatus: document.getElementById("radius-status"),
    pendingStatus: document.getElementById("pending-status"),
    feedbackBox: document.getElementById("feedback-box"),
  },
  model: () => aktuellerFall().analyze(free.tool, tri),
  check: () => {
    const fall = aktuellerFall();
    const ergebnis = fall.check(fall.analyze(free.tool, tri));
    // Nur "Prüfen"/"Tipp" melden einen Fall als gelöst — und einmal gelöst bleibt gelöst, auch wenn
    // die Zeichnung danach zurückgesetzt wird.
    if (ergebnis.ok && !standVon(fall.key).geloest) {
      standVon(fall.key).geloest = true;
      speichereFortschritt();
      renderSeite();
      renderWortLeiste();
    }
    return ergebnis;
  },
  onDraw: (layer) => {
    const fall = aktuellerFall();
    if (fall.onDraw) fall.onDraw(layer, free.tool, tri);
  },
});

// ---------- Seitenspalte ----------

function stufenReiter() {
  // Farbkodierung wie bei einer Ampel: grün = einfach, orange = mittel, rot = schwierig.
  const stufen = [
    { nr: 1, label: "🟢 Stufe 1 · Sicher werden" },
    { nr: 2, label: "🟠 Stufe 2 · Anwenden" },
    { nr: 3, label: "🔴 Stufe 3 · Knobeln" },
  ];
  return `<div class="geo-mode-tabs raetsel-stufen" id="stufen-tabs">${stufen
    .map((s) => `<button type="button" class="geo-mode-tab${s.nr === state.stufe ? " geo-mode-tab-active" : ""}" data-stufe="${s.nr}">${s.label}</button>`)
    .join("")}</div>`;
}

function ampelReihe(key) {
  const gewaehlt = standVon(key).ampel;
  return `<div class="raetsel-ampel" id="ampel-reihe">${AMPEL.map(
    (a) =>
      `<button type="button" class="raetsel-ampel-btn${a.wert === gewaehlt ? " raetsel-ampel-aktiv" : ""}" data-ampel="${a.wert}" title="${a.text}"><span aria-hidden="true">${a.icon}</span> ${a.text}</button>`
  ).join("")}</div>`;
}

function renderSeite() {
  const fall = aktuellerFall();
  const stand = standVon(fall.key);
  const hilfeOffen = state.stufe === 1 ? " open" : "";
  const knobel = state.stufe === 3 ? `<p class="raetsel-knobel"><strong>🔴 Zusätzlich zum Knobeln:</strong> ${fall.knobel}</p>` : "";

  // Im Knobelmodus (Stufe 3) darf vor dem Lösen nirgends stehen, welche der vier Linien gebraucht
  // wird — weder als Tag noch im Merksatz oder in der Denkfrage (die nennt die Linie beim Namen).
  // Auf Stufe 1/2 ist das Nennen ausdrücklich erlaubt ("an geeigneter Stelle": direkt im Auftrag),
  // im Knobelmodus schaltet stattdessen das Lösen selbst diese Blöcke frei — wie beim Buchstaben.
  const gesperrt = state.stufe === 3 && !stand.geloest;
  const gebrauchtWird = !gesperrt
    ? `<p class="raetsel-meta">Gebraucht wird: <span style="color:${fall.farbe}">${fall.linie}</span> → ${fall.ergebnis}</p>`
    : "";
  const hilfeBlock = state.stufe === 3
    ? `<details class="raetsel-block raetsel-hilfe">
        <summary>🧭 Hilfe — falls du gar nicht weiterweißt</summary>
        <p>Frag dich zuerst: Welche <strong>Eigenschaft</strong> muss der gesuchte Punkt haben? Genau diese Eigenschaft kennst du schon von einer der vier Konstruktionen (Mittelsenkrechte, Winkelhalbierende, Seitenhalbierende, Höhe). Willst du direkt nachlesen, welche hier gemeint ist, wechsle oben auf „🟠 Stufe 2 · Anwenden“.</p>
      </details>`
    : `<details class="raetsel-block raetsel-hilfe"${hilfeOffen}>
        <summary>🧭 Hilfe — so geht die Konstruktion Schritt für Schritt</summary>
        <ol class="geo-steps">${fall.hilfe.map((h) => `<li>${h}</li>`).join("")}</ol>
        <p class="raetsel-meta">Noch ganz unsicher? Übe die Grundkonstruktion zuerst hier: <a href="${fall.grundlagen.href}">${fall.grundlagen.text}</a></p>
      </details>`;
  const merksatzBlock = gesperrt
    ? `<p>🔒 Dieser Merksatz nennt die gesuchte Konstruktion beim Namen — er schaltet sich frei, sobald du den Fall gelöst hast (oder wenn du auf Stufe 1/2 wechselst).</p>`
    : `<p>${fall.merksatz}</p>`;
  const denkfrageBlock = gesperrt
    ? `<p>Löse den Fall zuerst — die Denkfrage verrät sonst schon, um welche Konstruktion es hier geht.</p>`
    : `<p>${fall.denkfrage}</p><details class="raetsel-musterantwort"><summary>Musterantwort anzeigen</summary><p>${fall.musterantwort}</p></details>`;

  sideCol.innerHTML = `
    <div class="raetsel-block raetsel-rueckblick"><strong>🔁 Rückblick</strong><p>${fall.rueckblick}</p></div>

    <div class="raetsel-block raetsel-karte">
      <strong>📜 Rätselkarte ${fall.nr}</strong>
      <p>${fall.story}</p>
    </div>

    ${stufenReiter()}

    <div class="raetsel-block raetsel-auftrag">
      <strong>🎯 Dein Auftrag</strong>
      <p>${fall.auftrag[state.stufe]}</p>
      ${gebrauchtWird}
      ${knobel}
    </div>

    ${hilfeBlock}

    <div class="raetsel-block raetsel-merksatz"><strong>💡 Merksatz</strong>${merksatzBlock}</div>

    <div class="raetsel-block raetsel-selbstcheck">
      <strong>✅ Selbstkontrolle</strong>
      <p>Drücke „✓ Prüfen“, wenn du fertig bist — die Rückmeldung nennt dir genau, was noch fehlt. „💡 Tipp“ verrät dasselbe, klingt aber freundlicher.</p>
      <p class="raetsel-status">${stand.geloest ? "🔓 Fall gelöst!" : "🔒 Noch nicht gelöst."}</p>
      <p class="raetsel-meta">Wie sicher fühlst du dich bei dieser Konstruktion?</p>
      ${ampelReihe(fall.key)}
      <p class="raetsel-meta">👥 Partnercheck: Vergleicht eure Konstruktionen. Habt ihr denselben Punkt getroffen, obwohl ihr unterschiedliche Zirkelradien gewählt habt?</p>
    </div>

    <details class="raetsel-block raetsel-denkfrage">
      <summary>🤔 Denkfrage — erst selbst antworten, dann vergleichen</summary>
      ${denkfrageBlock}
    </details>

    <div class="raetsel-block raetsel-buchstabe">
      <strong>🔑 Buchstabe ${fall.position} des Lösungsworts</strong>
      <p>${stand.geloest ? `Gelöst! Der ${fall.position}. Buchstabe lautet <span class="raetsel-gross">${fall.buchstabe}</span>.` : "Löse den Fall, um den Buchstaben freizuschalten."}</p>
    </div>
  `;
}

// ---------- Lösungswort-Leiste ----------

function renderWortLeiste() {
  const felder = [];
  for (let pos = 1; pos <= LOESUNGSWORT.length; pos++) {
    const fall = FAELLE.find((f) => f.position === pos);
    const frei = fall && standVon(fall.key).geloest;
    felder.push(`<span class="raetsel-wort-feld${frei ? " raetsel-wort-frei" : ""}" title="${fall ? fall.titel : ""}">${frei ? fall.buchstabe : "?"}</span>`);
  }
  const anzahl = FAELLE.filter((f) => standVon(f.key).geloest).length;
  wortLeiste.innerHTML = `<span class="raetsel-wort-label">Versteck:</span> ${felder.join("")} <span class="raetsel-meta">${anzahl} von ${FAELLE.length} Fällen gelöst</span>`;
}

// ---------- Rätsel-Pass ----------

function renderPass() {
  const zeilen = FAELLE.map((f) => {
    const stand = standVon(f.key);
    const ampel = AMPEL.find((a) => a.wert === stand.ampel);
    return `<tr>
      <td>${f.titel}</td>
      <td>${f.linie}</td>
      <td>${stand.geloest ? "✅ gelöst" : "⬜ offen"}</td>
      <td>${ampel ? `${ampel.icon} ${ampel.text}` : "—"}</td>
      <td>${stand.geloest ? `${f.position}. → <strong>${f.buchstabe}</strong>` : "—"}</td>
    </tr>`;
  }).join("");

  passView.innerHTML = `
    <div class="raetsel-block raetsel-karte">
      <strong>🗂 Dein Rätsel-Pass</strong>
      <p>Hier siehst du auf einen Blick, was du schon geschafft hast und wo du dir selbst noch Luft nach oben gibst. Der Pass bleibt in diesem Browser gespeichert.</p>
    </div>

    <div class="raetsel-tabelle-wrap">
      <table class="raetsel-tabelle">
        <thead><tr><th>Fall</th><th>Besondere Linie</th><th>Konstruktion</th><th>Selbsteinschätzung</th><th>Buchstabe</th></tr></thead>
        <tbody>${zeilen}</tbody>
      </table>
    </div>

    <div class="raetsel-block raetsel-auftrag">
      <strong>🔑 Das Lösungswort</strong>
      <p>Sortiere deine Buchstaben nach ihrer Position und trage das Wort ein. Es nennt den Ort, an dem Anton Winkels goldener Zirkel liegt.</p>
      <p class="raetsel-wort-eingabe">
        <input type="text" id="wort-eingabe" maxlength="12" placeholder="Lösungswort" autocomplete="off" spellcheck="false">
        <button type="button" class="geo-btn geo-btn-primary" id="btn-wort">Prüfen</button>
      </p>
      <p class="raetsel-status" id="wort-feedback"></p>
    </div>

    <details class="raetsel-block raetsel-denkfrage" open>
      <summary>🎫 Exit-Ticket — drei Sätze zum Schluss</summary>
      <ol class="geo-steps">
        <li>Welche der vier besonderen Linien konnte ich am sichersten konstruieren — und woran lag das?</li>
        <li>Bei welcher habe ich mich vertan? Was genau war der Fehler?</li>
        <li>Erkläre einer Mitschülerin in einem Satz, warum sich drei Mittelsenkrechte immer in einem Punkt treffen.</li>
      </ol>
      <p class="raetsel-meta">Notiere deine Antworten im Heft — sie sind die Grundlage für die Besprechung in der nächsten Stunde.</p>
    </details>

    <div class="raetsel-block raetsel-selbstcheck">
      <strong>↩ Von vorn beginnen</strong>
      <p>Möchtest du das Rätsel noch einmal ganz frisch lösen (zum Beispiel als Wiederholung vor der Klassenarbeit)?</p>
      <p><button type="button" class="geo-btn" id="btn-pass-reset">Rätsel-Pass zurücksetzen</button></p>
    </div>
  `;

  document.getElementById("btn-wort").addEventListener("click", pruefeWort);
  document.getElementById("wort-eingabe").addEventListener("keydown", (e) => {
    if (e.key === "Enter") pruefeWort();
  });
  document.getElementById("btn-pass-reset").addEventListener("click", () => {
    FAELLE.forEach((f) => {
      fortschritt[f.key] = { geloest: false, ampel: null };
    });
    speichereFortschritt();
    renderPass();
    renderWortLeiste();
    renderReiter();
  });
}

function pruefeWort() {
  const eingabe = document.getElementById("wort-eingabe").value.trim().toUpperCase();
  const box = document.getElementById("wort-feedback");
  if (!eingabe) {
    box.textContent = "Trag zuerst ein Wort ein.";
    return;
  }
  box.textContent =
    eingabe === LOESUNGSWORT
      ? `🎉 Richtig! Anton Winkels goldener Zirkel liegt unter der alten ${LOESUNGSWORT[0]}${LOESUNGSWORT.slice(1).toLowerCase()} am Dorfplatz.`
      : "Noch nicht. Schau im Pass nach, welche Buchstaben du schon hast — und an welcher Stelle sie stehen.";
}

// ---------- Reiter und Umschalten ----------

function renderReiter() {
  const knoepfe = FAELLE.map((f, i) => {
    const geloest = standVon(f.key).geloest;
    const aktiv = !state.pass && i === state.fall;
    return `<button type="button" class="geo-mode-tab${aktiv ? " geo-mode-tab-active" : ""}" data-fall="${i}">${geloest ? "✅ " : ""}${f.kurz}</button>`;
  });
  knoepfe.push(`<button type="button" class="geo-mode-tab${state.pass ? " geo-mode-tab-active" : ""}" data-pass="1">🗂 Rätsel-Pass</button>`);
  caseTabs.innerHTML = knoepfe.join("");
}

function zeigeFall() {
  caseLayout.hidden = false;
  passView.hidden = true;
  renderSzene();
  renderSeite();
  free.reset();
}

function zeigePass() {
  caseLayout.hidden = true;
  passView.hidden = false;
  renderPass();
}

caseTabs.addEventListener("click", (e) => {
  const btn = e.target.closest(".geo-mode-tab");
  if (!btn) return;
  if (btn.dataset.pass) {
    state.pass = true;
    renderReiter();
    zeigePass();
    return;
  }
  state.pass = false;
  state.fall = Number(btn.dataset.fall);
  neuesDreieck();
  renderReiter();
  zeigeFall();
});

// Stufenwechsel und Selbsteinschätzung liegen in der jedes Mal neu erzeugten Seitenspalte — deshalb
// hier über einen Zuhörer am Container statt an den einzelnen Knöpfen.
sideCol.addEventListener("click", (e) => {
  const stufe = e.target.closest("[data-stufe]");
  if (stufe) {
    state.stufe = Number(stufe.dataset.stufe);
    renderSeite();
    return;
  }
  const ampel = e.target.closest("[data-ampel]");
  if (ampel) {
    const stand = standVon(aktuellerFall().key);
    // Nochmaliges Anklicken derselben Antwort hebt sie wieder auf.
    stand.ampel = stand.ampel === ampel.dataset.ampel ? null : ampel.dataset.ampel;
    speichereFortschritt();
    renderSeite();
  }
});

document.getElementById("btn-new-task").addEventListener("click", () => {
  neuesDreieck();
  zeigeFall();
});

// ---------- Start ----------

neuesDreieck();
renderReiter();
renderWortLeiste();
zeigeFall();

setupCanvasZoom(caseLayout.closest(".card"), document.getElementById("btn-zoom"));
