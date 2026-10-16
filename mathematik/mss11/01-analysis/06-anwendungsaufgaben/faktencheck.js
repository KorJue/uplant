// Kapitel 5 „Faktencheck Analysis“: zwanzig Behauptungen aus Alltag und Nachrichten, geprüft mit
// der Mathematik der Kapitel 1 bis 4.
//
// Gebaut wie das Rätsel um den Goldenen Zirkel (Klasse 8, Geometrie): Reiter je Fall, drei Stufen
// (🔴 Knobeln als Start, 🟠 Anwenden, 🟢 Sicher werden), Merksatz und Denkfrage, Selbsteinschätzung,
// ein Buchstabe je gelöstem Fall und ein Pass, der den Stand im Browser behält. Neu gegenüber dem
// Vorbild sind die Zwischenergebnisse: Jeder Schritt wird sofort geprüft, ein falscher Wert bekommt
// eine Rückmeldung, die den wahrscheinlichen Fehler benennt, und wer an einem Zwischenschritt hängt,
// darf sich das Zwischenergebnis zeigen lassen und damit weiterrechnen — wie die Ersatzwerte im
// Abitur. So zieht ein früher Fehler keine Kette von Folgefehlern nach sich.
//
// Ein Fall gilt auf allen Stufen unter derselben Bedingung als gelöst: Die Kernschritte (der
// rechnerische Beleg) stimmen, und das Urteil über die Behauptung ist richtig. Kernschritte lassen
// sich nicht aufdecken — sonst wäre der Buchstabe geschenkt.
//
// Alles wird dort eingetragen, wo es auch geprüft wird: Zwischenergebnisse und Knobelfragen in
// Eingabefeldern mit Rückmeldung, die Modellkritik und das Exit-Ticket als eigener Text (der
// Vergleich mit der Musterantwort öffnet sich erst danach), der Lösungssatz direkt unter der
// Buchstabenleiste.

import { FAELLE, LOESUNGSWORT, LOESUNGSSATZ } from "./faelle.js?v=2";
import { num, leseZahlen } from "./hilfen.js?v=1";

const SPEICHER = "uplant-mss11-faktencheck";
const AMPEL = [
  { wert: "sicher", icon: "😀", text: "Das kann ich" },
  { wert: "teils", icon: "😐", text: "Fast — mit Hilfe" },
  { wert: "unsicher", icon: "🤔", text: "Noch unsicher" },
];
// Selbsteinschätzung der eigenen Modellkritik nach dem Vergleich — eine freie Antwort kann die
// Seite nicht bewerten, wohl aber den Vergleich verlangen, bevor die Musterantwort zu sehen ist.
const DENK = [
  { wert: "kern", icon: "🎯", text: "trifft den Kern", rat: "Stark. Prüfe noch, ob du auch gesagt hast, was das für das Urteil über die Behauptung bedeutet." },
  { wert: "teils", icon: "🌗", text: "teilweise", rat: "Ergänze deine Antwort oben um den Gedanken, der dir gefehlt hat — in eigenen Worten, nicht abgeschrieben." },
  { wert: "nicht", icon: "🔁", text: "noch nicht", rat: "Kein Problem. Erkläre den Gedanken der Musterantwort deinem Partner mit eigenen Worten und schreib ihn dann oben neu auf." },
];
// So viele Wörter braucht eine eigene Antwort, bevor die Musterantwort aufgeht: ein ganzer Satz.
const DENK_WOERTER = 5;
const woerter = (t) => (String(t || "").trim().match(/\S+/g) || []).length;
const EXIT = [
  "Welche Behauptung hat dich am meisten überrascht — und welche Rechnung hat sie entschieden?",
  "Bei welchem Fall war das <em>Modell</em> das Schwierigste, nicht die Rechnung? Woran lag das?",
  "Nenne eine Behauptung aus deinem eigenen Alltag, die du mit einem dieser Werkzeuge prüfen könntest.",
];
const PHASEN = {
  1: "① Verstehen",
  2: "② Modell aufstellen",
  3: "③ Mathematik benutzen",
  4: "④ Ergebnis erklären",
};
// Ab so vielen Fehlversuchen an einem Zwischenschritt lässt sich sein Ergebnis aufdecken (auf
// Stufe 1 sofort). An den Kernschritten wird stattdessen ab drei Fehlversuchen die Musterlösung
// angeboten — der Fall zählt dann als „mit Musterlösung“ gelöst.
const AUFDECKEN_AB = 2;
const MUSTER_AB = 3;

// Häufige Einheitenfehler: Weicht eine Eingabe genau um einen dieser Faktoren ab, sagt die
// Rückmeldung das — eine falsch umgerechnete Einheit ist ein anderer Fehler als ein falscher Ansatz.
const FAKTOREN = [
  [3.6, "m/s und km/h"],
  [60, "Stunden und Minuten (oder Minuten und Sekunden)"],
  [100, "Anteil und Prozent"],
  [1000, "W und kW, Wh und kWh, Liter und m³ oder cm³ und Liter"],
  [24, "Tagen und Stunden"],
];

// ---------- Fortschritt (nur in diesem Browser) ----------

function ladeStand() {
  try {
    const roh = JSON.parse(localStorage.getItem(SPEICHER) || "{}");
    return roh && typeof roh === "object" ? roh : {};
  } catch (e) {
    return {};
  }
}
const stand = ladeStand();
if (!stand.faelle) stand.faelle = {};
if (stand.kurs !== "gk" && stand.kurs !== "lk") stand.kurs = "lk";
function speichere() {
  try {
    localStorage.setItem(SPEICHER, JSON.stringify(stand));
  } catch (e) {
    // Privates Fenster oder gesperrter Speicher: Der Fall bleibt bis zum Neuladen gelöst.
  }
}
function standVon(key) {
  if (!stand.faelle[key]) stand.faelle[key] = {};
  const s = stand.faelle[key];
  if (!s.felder) s.felder = {};
  return s;
}
function knobelStand(fall) {
  const st = standVon(fall.key);
  if (!st.knobel) st.knobel = {};
  if (!st.knobel.felder) st.knobel.felder = {};
  if (!st.knobel.eingaben) st.knobel.eingaben = {};
  return st.knobel;
}
const knobelGeloest = (fall) => (fall.knobelFelder || []).length > 0 && fall.knobelFelder.every((f) => knobelStand(fall).felder[f.id] === "ok");
const geschenkt = (fall) => stand.kurs === "gk" && fall.kurs === "lk";
const buchstabeFrei = (fall) => standVon(fall.key).geloest || geschenkt(fall);

// Versuche zählen nur für die laufende Sitzung — sie sollen Hilfen freischalten, nicht bewerten.
const versuche = {};

// ---------- Zustand der Ansicht ----------

// denkOffen: Fälle, deren Modellkritik gerade aufgeklappt ist — damit ein Neuzeichnen sie nicht schließt.
const ansicht = { fall: 0, stufe: 3, pass: false, denkOffen: new Set() };
const wortLeiste = document.getElementById("fc-wort");
const reiter = document.getElementById("fc-reiter");
const fallBox = document.getElementById("fc-fall");
const passBox = document.getElementById("fc-pass");
const kursBox = document.getElementById("fc-kurs");
const satzBox = document.getElementById("fc-satz-box");
const aktuell = () => FAELLE[ansicht.fall];

// ---------- Prüfen eines Feldes ----------

export function pruefeFeld(feld, roh) {
  if (feld.typ === "wahl") {
    if (!roh) return { id: "leer", text: "Wähle zuerst eine Antwort aus." };
    if (roh === feld.soll) return { id: "ok", ok: true };
    const f = (feld.falsch || []).find((x) => x.wert === roh);
    return f ? { id: f.id, text: f.text } : { id: "falsch", text: "Das passt noch nicht. Hol dir einen Tipp." };
  }
  if (String(roh || "").trim() === "") return { id: "leer", text: "Trag zuerst eine Zahl ein." };
  // „∞“ oder „unendlich“ ist bei Grenzwertfragen eine ernst gemeinte Antwort — sie bekommt ihren
  // eigenen Hinweis, wenn der Fall einen vorsieht.
  if (/^\s*(\+?∞|unendlich)\s*$/i.test(roh)) {
    const f = (feld.falsch || []).find((x) => x.wert === Infinity);
    return f ? { id: f.id, text: f.text } : { id: "falsch", text: "Hier kommt ein endlicher Wert heraus. Prüfe, ob die Größe wirklich unbegrenzt wächst." };
  }
  const lesarten = leseZahlen(roh);
  // Bei mehrdeutiger Schreibweise zählt die Lesart, die der Größenordnung nach zur Aufgabe passt.
  const abstand = (c) => (feld.soll !== 0 && c !== 0 ? Math.abs(Math.log(Math.abs(c / feld.soll))) : Math.abs(c - feld.soll));
  const z = lesarten.reduce((best, c) => (abstand(c) < abstand(best) ? c : best));
  if (!Number.isFinite(z)) {
    return { id: "unlesbar", text: "Diese Eingabe kann ich nicht als Zahl lesen. Schreibe zum Beispiel 3,5 oder 1.200 — ohne Rechenzeichen." };
  }
  if (Math.abs(z - feld.soll) <= feld.tol) return { id: "ok", ok: true };
  for (const f of feld.falsch || []) {
    if (Number.isFinite(f.wert) && Math.abs(z - f.wert) <= (f.tol ?? feld.tol)) return { id: f.id, text: f.text };
  }
  if (feld.soll !== 0 && Math.abs(z + feld.soll) <= feld.tol) {
    return { id: "vorzeichen", text: "Der Betrag stimmt, das Vorzeichen nicht. Überlege, ob die Größe hier zu- oder abnimmt." };
  }
  if (feld.soll !== 0 && feld.einheit) {
    for (const [r, was] of FAKTOREN) {
      if (Math.abs(z - feld.soll * r) <= feld.tol * r || Math.abs(z - feld.soll / r) <= feld.tol / r) {
        return { id: "einheit", text: `Deine Zahl weicht genau um den Faktor ${num(r, 1)} vom richtigen Wert ab. Vermutlich fehlt eine Umrechnung zwischen ${was}. Gefragt ist die Angabe in ${feld.einheit}.` };
      }
    }
  }
  if (Math.abs(z - feld.soll) <= 5 * feld.tol) {
    return { id: "knapp", text: "Knapp daneben. Rechne mit den ungerundeten Zwischenwerten weiter und runde erst ganz am Schluss." };
  }
  return { id: "falsch", text: "Das stimmt noch nicht. Prüfe zuerst Ansatz und Einheit — oder hol dir einen Tipp." };
}

// ---------- Zeichnung ----------

// Ein Koordinatensystem mit beschrifteten Gitterlinien. Jede Gitterlinie trägt ihren Wert als
// data-wert — die Prüfung rechnet daraus den Maßstab zurück und liest jede Kurve aus dem SVG.
function zeichne(fig, key) {
  // Links Platz für fünfstellige Zahlen („40.000“) UND den gedrehten Achsentitel — bei weniger
  // Rand schoben sich beide übereinander.
  // Rechts Platz für die letzte, mittig gesetzte Zahl der x-Achse („120.000“).
  const B = 560, H = 300, L = 74, R = 30, O = 16, U = 48;
  const { x, y } = fig;
  const px = (v) => L + ((v - x.von) / (x.bis - x.von)) * (B - L - R);
  const py = (v) => H - U - ((v - y.von) / (y.bis - y.von)) * (H - O - U);
  const r2 = (v) => Math.round(v * 100) / 100;
  const teile = [];
  const ticks = (a) => {
    const w = [];
    for (let k = 0; ; k++) {
      const v = a.von + k * a.schritt;
      if (v > a.bis + 1e-9) break;
      w.push(Math.round(v * 1e9) / 1e9);
    }
    return w;
  };
  const jede = (a) => a.beschriftung || 1;
  const beschriften = (a, v, i) => (a.marke ? a.marke(v) : i % jede(a) === 0);
  ticks(x).forEach((v, i) => {
    teile.push(`<line class="fc-gitter" data-achse="x" data-wert="${v}" x1="${r2(px(v))}" y1="${O}" x2="${r2(px(v))}" y2="${H - U}"/>`);
    if (beschriften(x, v, i)) teile.push(`<text class="fc-achse-zahl" x="${r2(px(v))}" y="${H - U + 17}" text-anchor="middle">${x.zahl ? x.zahl(v) : num(v, 2)}</text>`);
  });
  ticks(y).forEach((v, i) => {
    teile.push(`<line class="fc-gitter" data-achse="y" data-wert="${v}" x1="${L}" y1="${r2(py(v))}" x2="${B - R}" y2="${r2(py(v))}"/>`);
    if (beschriften(y, v, i)) teile.push(`<text class="fc-achse-zahl" x="${L - 6}" y="${r2(py(v)) + 4}" text-anchor="end">${y.zahl ? y.zahl(v) : num(v, 2)}</text>`);
  });
  teile.push(`<text class="fc-achse-titel" x="${(L + B - R) / 2}" y="${H - 8}" text-anchor="middle">${x.titel}</text>`);
  teile.push(`<text class="fc-achse-titel" x="15" y="${(O + H - U) / 2}" text-anchor="middle" transform="rotate(-90 15 ${(O + H - U) / 2})">${y.titel}</text>`);
  const clip = `fc-clip-${key}`;
  teile.push(`<clipPath id="${clip}"><rect x="${L}" y="${O}" width="${B - L - R}" height="${H - O - U}"/></clipPath>`);
  const innen = [];
  for (const w of fig.waagrecht || []) {
    innen.push(`<line class="fc-linie fc-k-${w.farbe}" data-rolle="${w.rolle}" data-wert="${w.y}" x1="${L}" y1="${r2(py(w.y))}" x2="${B - R}" y2="${r2(py(w.y))}"/>`);
  }
  for (const s of fig.senkrecht || []) {
    innen.push(`<line class="fc-linie fc-k-${s.farbe}" data-rolle="${s.rolle}" data-wert="${s.x}" x1="${r2(px(s.x))}" y1="${O}" x2="${r2(px(s.x))}" y2="${H - U}"/>`);
  }
  for (const k of fig.kurven || []) {
    const n = k.n || 240;
    const pkt = [];
    for (let i = 0; i <= n; i++) {
      const t = k.von + ((k.bis - k.von) * i) / n;
      const v = k.f(t);
      if (Number.isFinite(v)) pkt.push(`${r2(px(t))} ${r2(py(v))}`);
    }
    innen.push(`<path class="fc-kurve fc-k-${k.farbe}${k.gestrichelt ? " fc-gestrichelt" : ""}" data-rolle="${k.rolle}" d="M ${pkt.join(" L ")}"/>`);
  }
  for (const p of fig.punkte || []) {
    innen.push(`<circle class="fc-punkt fc-k-${p.farbe}" data-rolle="${p.rolle}" cx="${r2(px(p.x))}" cy="${r2(py(p.y))}" r="4"/>`);
  }
  teile.push(`<g clip-path="url(#${clip})">${innen.join("")}</g>`);
  for (const t of fig.texte || []) {
    teile.push(`<text class="fc-kurven-text fc-t-${t.farbe}" x="${r2(px(t.x))}" y="${r2(py(t.y))}" text-anchor="${t.anker || "start"}">${t.text}</text>`);
  }
  const legende = (fig.legende || []).map((l) => `<span class="fc-legende-eintrag"><span class="fc-legende-strich fc-l-${l.farbe}${l.gestrichelt ? " fc-gestrichelt" : ""}"></span><span>${l.text}</span></span>`).join("");
  return `<figure class="fc-figur">
    <svg class="fc-svg" id="fc-svg-${key}" viewBox="0 0 ${B} ${H}" role="img" aria-label="${fig.titel}">${teile.join("")}</svg>
    <figcaption>${legende ? `<span class="fc-legende">${legende}</span>` : ""}${fig.hinweis ? `<span class="fc-figur-hinweis">${fig.hinweis}</span>` : ""}</figcaption>
  </figure>`;
}

// ---------- Bausteine der Fallansicht ----------

function stufenReiter() {
  const stufen = [
    { nr: 3, text: "🔴 Stufe 3 · Knobeln" },
    { nr: 2, text: "🟠 Stufe 2 · Anwenden" },
    { nr: 1, text: "🟢 Stufe 1 · Sicher werden" },
  ];
  return `<div class="fc-stufen" role="tablist">${stufen.map((s) =>
    `<button type="button" class="fc-tab${ansicht.stufe === s.nr ? " fc-tab-aktiv" : ""}" data-stufe="${s.nr}" role="tab" aria-selected="${ansicht.stufe === s.nr}">${s.text}</button>`).join("")}</div>`;
}

function auftrag(fall) {
  if (ansicht.stufe === 3) {
    return `<p><strong>Prüfe die Behauptung selbst.</strong> ${fall.kernfrage} Plane deinen Weg mit dem Lösungsplan: Was ist gegeben, was gesucht, welches Werkzeug aus den Kapiteln 1 bis 4 passt? Trage unten deinen Beleg ein und fälle dein Urteil.</p>
      <p class="fc-meta">Die Teilschritte siehst du auf Stufe 2 — wechseln darfst du jederzeit.</p>`;
  }
  if (ansicht.stufe === 2) {
    return `<p><strong>Arbeite die Schritte nacheinander ab.</strong> ${fall.kernfrage} Jeder Schritt wird sofort geprüft. Hängst du an einem Zwischenschritt fest, kannst du dir nach zwei Versuchen das Zwischenergebnis zeigen lassen und damit weiterrechnen.</p>`;
  }
  return `<p><strong>Schritt für Schritt mit Hilfen.</strong> ${fall.kernfrage} Der erste Tipp jedes Schritts ist schon aufgeklappt, der Werkzeugkasten auch, und jedes Zwischenergebnis darfst du dir sofort zeigen lassen.</p>`;
}

// art "feld": Feld eines Schritts (data-feld, data-rueck); art "knobel": Feld der Knobelfrage
// (data-knobel, data-knobel-rueck) — getrennte Namen, damit sich beide nie in die Quere kommen.
function feldHtml(fall, feld, art = "feld") {
  const s = art === "knobel" ? knobelStand(fall).felder[feld.id] : standVon(fall.key).felder[feld.id];
  const id = `${fall.key}.${feld.id}`;
  const attr = art === "knobel" ? "data-knobel" : "data-feld";
  const eingabe = feld.typ === "wahl"
    ? `<select ${attr}="${id}" aria-label="${feld.label}"><option value="">— bitte wählen —</option>${feld.optionen.map((o) => `<option value="${o.wert}">${o.text}</option>`).join("")}</select>`
    : `<input type="text" inputmode="decimal" autocomplete="off" spellcheck="false" ${attr}="${id}" aria-label="${feld.label}">`;
  const marke = s === "ok" ? `<span class="fc-feld-marke fc-ok">✓</span>` : s === "auf" ? `<span class="fc-feld-marke fc-auf" title="aufgedeckt">🔓</span>` : "";
  return `<div class="fc-feld">
      <label><span class="fc-feld-label">${feld.label}</span> ${eingabe} ${feld.einheit ? `<span class="fc-einheit">${feld.einheit}</span>` : ""} ${marke}</label>
      <div class="fc-rueck" ${art === "knobel" ? "data-knobel-rueck" : "data-rueck"}="${id}" aria-live="polite"></div>
    </div>`;
}

function knobelHtml(fall) {
  const kn = knobelStand(fall);
  const fertig = knobelGeloest(fall);
  const antwort = kn.versucht || fertig
    ? `<details class="fc-musterantwort"><summary>Antwort vergleichen</summary>${fall.knobelAntwort}</details>`
    : `<p class="fc-meta">Nach deinem ersten Versuch kannst du hier deinen Weg mit der Musterantwort vergleichen.</p>`;
  return `<div class="fc-knobel${fertig ? " fc-fertig" : ""}">
      <div class="fc-schritt-kopf"><strong>🧩 Knobelfrage${fertig ? " ✓" : ""}</strong><span class="fc-meta">zum Weiterdenken — zählt nicht für den Buchstaben</span></div>
      <p class="fc-frage">${fall.knobel}</p>
      <div class="fc-felder">${(fall.knobelFelder || []).map((f) => feldHtml(fall, f, "knobel")).join("")}</div>
      <div class="btn-row"><button type="button" class="btn btn-primary" data-knobel-pruefe="1">✓ Prüfen</button></div>
      ${antwort}
    </div>`;
}

function denkHtml(fall) {
  const st = standVon(fall.key);
  const offen = st.denkVergleich || woerter(st.denk) > 0 || ansicht.denkOffen.has(fall.key);
  const d = DENK.find((x) => x.wert === st.denkUrteil);
  const vergleich = st.denkVergleich
    ? `<div class="fc-vergleich">
        <strong>📝 Musterantwort</strong>${fall.musterantwort}
        <p class="fc-meta">Eine freie Antwort kann die Seite nicht bewerten — das übernimmst du: Wie gut trifft deine Antwort den Kern der Musterantwort?</p>
        <div class="fc-ampel">${DENK.map((x) => `<button type="button" class="fc-ampel-btn${st.denkUrteil === x.wert ? " fc-ampel-aktiv" : ""}" data-denk-urteil="${x.wert}">${x.icon} ${x.text}</button>`).join("")}</div>
        ${d ? `<p class="fc-denk-rat" data-denk-rat="${d.wert}">${d.rat}</p>` : ""}
      </div>`
    : "";
  return `<details class="fc-block fc-denkfrage" data-denk-box="${fall.key}"${offen ? " open" : ""}>
      <summary>🤔 Modellkritik — erst selbst antworten, dann vergleichen</summary>
      <p>${fall.denkfrage}</p>
      <label class="fc-text"><span class="fc-feld-label">Deine Antwort:</span>
        <textarea data-denk="${fall.key}" rows="4" placeholder="Schreib in ganzen Sätzen, was du denkst."></textarea></label>
      <div class="btn-row"><button type="button" class="btn btn-primary" data-denk-vergleich="1">⚖️ Mit der Musterantwort vergleichen</button></div>
      <div class="fc-rueck" data-denk-rueck="${fall.key}" aria-live="polite"></div>
      ${vergleich}
    </details>`;
}

function schrittHtml(fall, schritt, i) {
  const st = standVon(fall.key);
  const fertig = schritt.felder.every((f) => st.felder[f.id] === "ok" || st.felder[f.id] === "auf");
  const v = versuche[`${fall.key}.${i}`] || 0;
  const aufdeckbar = !schritt.kern && !fertig && (ansicht.stufe === 1 || v >= AUFDECKEN_AB);
  const ersterTipp = ansicht.stufe === 1 && schritt.tipps.length ? 1 : 0;
  const zeigt = Math.max(ersterTipp, (versuche[`${fall.key}.${i}.tipp`] || 0));
  const tipps = schritt.tipps.slice(0, zeigt).map((t, k) => `<li><strong>Tipp ${k + 1}:</strong> ${t}</li>`).join("");
  const loesung = fertig ? `<div class="fc-loesung"><strong>Zwischenergebnis:</strong> ${schritt.loesung}${schritt.deutung ? `<br><span class="fc-deutung">${schritt.deutung}</span>` : ""}</div>` : "";
  return `<div class="fc-schritt${schritt.kern ? " fc-kern" : ""}${fertig ? " fc-fertig" : ""}" data-schritt="${i}">
      <div class="fc-schritt-kopf"><span class="fc-phase">${PHASEN[schritt.phase]}</span><strong>Schritt ${i + 1}${schritt.kern ? " · Beleg" : ""}</strong>${fertig ? " ✓" : ""}</div>
      <p class="fc-frage">${schritt.frage}</p>
      <div class="fc-felder">${schritt.felder.map((f) => feldHtml(fall, f)).join("")}</div>
      <div class="btn-row">
        <button type="button" class="btn btn-primary" data-pruefe="${i}">✓ Prüfen</button>
        <button type="button" class="btn btn-tipp" data-tipp="${i}"${zeigt >= schritt.tipps.length ? " disabled" : ""}>💡 Tipp${schritt.tipps.length ? ` (${Math.min(zeigt + 1, schritt.tipps.length)}/${schritt.tipps.length})` : ""}</button>
        ${aufdeckbar ? `<button type="button" class="btn" data-aufdecken="${i}">🔓 Zwischenergebnis zeigen</button>` : ""}
      </div>
      ${tipps ? `<ol class="fc-tipps">${tipps}</ol>` : ""}
      ${loesung}
    </div>`;
}

function urteilHtml(fall) {
  const st = standVon(fall.key);
  return `<div class="fc-block fc-urteil">
      <strong>⚖️ Dein Urteil</strong>
      <p>${fall.urteil.frage || "Was ist an der Behauptung dran?"}</p>
      <div class="quiz-options">${fall.urteil.optionen.map((o, j) =>
        `<button type="button" class="quiz-opt${st.urteil === j ? (o.richtig ? " correct" : " wrong") : ""}" data-urteil="${j}">${o.text}</button>`).join("")}</div>
      <div class="quiz-feedback" id="fc-urteil-rueck" aria-live="polite"></div>
    </div>`;
}

function kernFertig(fall) {
  const st = standVon(fall.key);
  return fall.schritte.filter((s) => s.kern).every((s) => s.felder.every((f) => st.felder[f.id] === "ok"));
}

function urteilRichtig(fall) {
  const st = standVon(fall.key);
  return Number.isInteger(st.urteil) && fall.urteil.optionen[st.urteil] && fall.urteil.optionen[st.urteil].richtig;
}

function kernVersuche(fall) {
  return fall.schritte.reduce((s, schritt, i) => s + (schritt.kern ? versuche[`${fall.key}.${i}`] || 0 : 0), 0);
}

function musterloesungHtml(fall) {
  const st = standVon(fall.key);
  const frei = st.geloest || st.muster;
  const anbieten = !frei && kernVersuche(fall) >= MUSTER_AB;
  const inhalt = frei
    ? `<ol class="fc-muster-liste">${fall.schritte.map((s) => `<li>${s.frage}<br>${s.loesung}</li>`).join("")}</ol>
       <p><strong>Urteil:</strong> ${fall.urteil.optionen.find((o) => o.richtig).erklaerung}</p>`
    : `<p class="fc-meta">Die Musterlösung öffnet sich, sobald der Fall gelöst ist.${anbieten ? "" : " Wer an einem Beleg dreimal gescheitert ist, kann sie vorher aufschlagen."}</p>
       ${anbieten ? `<p><button type="button" class="btn" data-muster="1">📖 Musterlösung jetzt aufschlagen</button></p><p class="fc-meta">Der Fall zählt dann als „mit Musterlösung“ gelöst — ehrlich in deinem Pass vermerkt.</p>` : ""}`;
  // Wird die Musterlösung angeboten, steht der Kasten offen — sonst bliebe das Angebot unbemerkt.
  return `<details class="fc-block fc-musterloesung"${anbieten ? " open" : ""}>
      <summary>📖 Musterlösung</summary>${inhalt}
    </details>`;
}

function statusText(fall) {
  const st = standVon(fall.key);
  if (st.geloest) return st.muster ? "🔓 Fall gelöst — mit Musterlösung." : "🔓 Fall gelöst!";
  const beleg = kernFertig(fall), urteil = urteilRichtig(fall);
  if (!beleg && !urteil) return "🔒 Noch nicht gelöst: Es fehlen noch der Beleg und das richtige Urteil.";
  return beleg ? "🔒 Noch nicht gelöst: Es fehlt noch das richtige Urteil." : "🔒 Noch nicht gelöst: Es fehlt noch der Beleg.";
}

function renderFall() {
  const fall = aktuell();
  const st = standVon(fall.key);
  const loesbar = ansicht.stufe === 3 ? fall.schritte.map((s, i) => [s, i]).filter(([s]) => s.kern) : fall.schritte.map((s, i) => [s, i]);
  const merksatzFrei = ansicht.stufe !== 3 || st.geloest;
  const ampel = AMPEL.map((a) => `<button type="button" class="fc-ampel-btn${st.ampel === a.wert ? " fc-ampel-aktiv" : ""}" data-ampel="${a.wert}">${a.icon} ${a.text}</button>`).join("");
  const lkHinweis = fall.kurs === "lk"
    ? `<p class="kurs-hinweis"><span class="kurs-marke lk">LK</span> Dieser Fall braucht Leistungskursstoff.${stand.kurs === "gk" ? " Im Grundkurs ist sein Buchstabe geschenkt — lösen darfst du ihn trotzdem." : ""}</p>`
    : `<p class="kurs-hinweis"><span class="kurs-marke gk">GK + LK</span> Dieser Fall kommt mit Grundkursstoff aus.</p>`;
  fallBox.innerHTML = `
    <h3 class="fc-titel">${fall.icon} Fall ${fall.nr}: ${fall.titel}</h3>
    ${lkHinweis}
    <div class="fc-layout">
      <div class="fc-akte">
        <div class="fc-block fc-behauptung">
          <strong>📣 Die Behauptung</strong>
          <blockquote>${fall.behauptung}</blockquote>
          <p class="fc-meta">— ${fall.herkunft}</p>
        </div>
        <div class="fc-block fc-hintergrund">
          <strong>📰 Der Hintergrund</strong>
          ${fall.hintergrund}
          ${fall.quellen && fall.quellen.length ? `<p class="fc-quellen">Quellen: ${fall.quellen.map((q) => `<a href="${q.url}" target="_blank" rel="noopener">${q.text}</a>`).join(" · ")}</p>` : ""}
        </div>
        <div class="fc-block fc-modell">
          <strong>🧮 Das Modell</strong>
          ${fall.modell}
          ${fall.figur ? zeichne(fall.figur, fall.key) : ""}
        </div>
      </div>
      <div class="fc-pruefung">
        <div class="fc-block fc-rueckblick"><strong>🔁 Rückblick</strong>${fall.rueckblick}</div>
        ${stufenReiter()}
        <div class="fc-block fc-auftrag"><strong>🎯 Dein Auftrag</strong>${auftrag(fall)}
          ${ansicht.stufe === 3 || st.geloest ? knobelHtml(fall) : ""}
        </div>
        <details class="fc-block fc-werkzeug"${ansicht.stufe === 1 ? " open" : ""}><summary>🧰 Werkzeugkasten</summary>${fall.werkzeug}</details>
        <div class="fc-schritte">${loesbar.map(([s, i]) => schrittHtml(fall, s, i)).join("")}</div>
        ${urteilHtml(fall)}
        <div class="fc-block fc-merksatz"><strong>💡 Merksatz</strong>${merksatzFrei ? fall.merksatz : "<p class=\"fc-meta\">Auf Stufe 3 öffnet sich der Merksatz erst, wenn der Fall gelöst ist — er verrät den Lösungsweg.</p>"}</div>
        <div class="fc-block fc-selbstcheck">
          <strong>✅ Selbstkontrolle</strong>
          <p class="fc-status">${statusText(fall)}</p>
          <p class="fc-meta">Wie sicher fühlst du dich bei diesem Fall?</p>
          <div class="fc-ampel">${ampel}</div>
          <p class="fc-meta">👥 Partnercheck: ${fall.partner}</p>
        </div>
        ${denkHtml(fall)}
        ${musterloesungHtml(fall)}
        <div class="fc-block fc-buchstabe">
          <strong>🔑 Buchstabe ${fall.position} des Lösungssatzes</strong>
          <p>${st.geloest ? `Gelöst! Der ${fall.position}. Buchstabe lautet <span class="fc-gross">${fall.buchstabe}</span>.` : geschenkt(fall) ? `Im Grundkurs geschenkt: <span class="fc-gross">${fall.buchstabe}</span>.` : "Löse den Fall, um den Buchstaben freizuschalten."}</p>
        </div>
      </div>
    </div>`;
  // Gemerkte Eingaben wieder eintragen: Ein Wechsel der Stufe soll nichts löschen.
  for (const s of fall.schritte) {
    for (const f of s.felder) {
      const e = fallBox.querySelector(`[data-feld="${fall.key}.${f.id}"]`);
      if (!e) continue;
      const wert = st.eingaben && st.eingaben[f.id];
      if (wert != null) e.value = wert;
      else if (st.felder[f.id] === "auf") e.value = f.typ === "wahl" ? f.soll : num(f.soll, f.stellen ?? 2);
    }
  }
  const kn = knobelStand(fall);
  for (const f of fall.knobelFelder || []) {
    const e = fallBox.querySelector(`[data-knobel="${fall.key}.${f.id}"]`);
    if (e && kn.eingaben[f.id] != null) e.value = kn.eingaben[f.id];
  }
  const denk = fallBox.querySelector(`[data-denk="${fall.key}"]`);
  if (denk && st.denk) denk.value = st.denk;
  if (Number.isInteger(st.urteil)) zeigeUrteil(fall, st.urteil, false);
}

// ---------- Aktionen ----------

function merkeEingabe(fall, feld, wert) {
  const st = standVon(fall.key);
  if (!st.eingaben) st.eingaben = {};
  st.eingaben[feld.id] = wert;
}

function pruefeLoesung(fall) {
  const st = standVon(fall.key);
  const vorher = st.geloest;
  if (kernFertig(fall) && urteilRichtig(fall)) st.geloest = true;
  speichere();
  return !vorher && st.geloest;
}

function pruefeSchritt(i) {
  const fall = aktuell();
  const schritt = fall.schritte[i];
  const st = standVon(fall.key);
  let alle = true;
  const rueck = [];
  for (const feld of schritt.felder) {
    const e = fallBox.querySelector(`[data-feld="${fall.key}.${feld.id}"]`);
    const roh = e ? e.value : "";
    merkeEingabe(fall, feld, roh);
    const r = pruefeFeld(feld, roh);
    if (r.ok) st.felder[feld.id] = "ok";
    else if (st.felder[feld.id] !== "auf") { alle = false; delete st.felder[feld.id]; }
    else alle = false;
    rueck.push([feld, r]);
  }
  if (!alle) versuche[`${fall.key}.${i}`] = (versuche[`${fall.key}.${i}`] || 0) + 1;
  const neu = pruefeLoesung(fall);
  renderFall();
  renderWort();
  renderReiter();
  for (const [feld, r] of rueck) zeigeRueck(fallBox.querySelector(`[data-rueck="${fall.key}.${feld.id}"]`), r);
  if (neu) meldeGeloest(fall);
}

// Die Hinweise sind Text der Seite, kein Eingabetext — sie dürfen Hochzahlen und Brüche enthalten.
function zeigeRueck(box, r) {
  if (!box) return;
  box.dataset.hinweis = r.id;
  box.className = "fc-rueck " + (r.ok ? "ok" : "err");
  box.innerHTML = r.ok ? "✓ Richtig." : r.text;
}

function pruefeKnobel() {
  const fall = aktuell();
  const kn = knobelStand(fall);
  const rueck = [];
  for (const feld of fall.knobelFelder || []) {
    const e = fallBox.querySelector(`[data-knobel="${fall.key}.${feld.id}"]`);
    const roh = e ? e.value : "";
    kn.eingaben[feld.id] = roh;
    const r = pruefeFeld(feld, roh);
    if (r.ok) kn.felder[feld.id] = "ok"; else delete kn.felder[feld.id];
    // Die Knobelfrage hat keine Tipps; ihre Hilfe ist der Vergleich mit der Musterantwort.
    if (r.id === "falsch") r.text = "Das stimmt noch nicht. Prüfe deinen Ansatz — oder vergleiche unten deinen Weg mit der Musterantwort.";
    rueck.push([feld, r]);
  }
  kn.versucht = true;
  speichere();
  renderFall();
  for (const [feld, r] of rueck) zeigeRueck(fallBox.querySelector(`[data-knobel-rueck="${fall.key}.${feld.id}"]`), r);
}

function vergleicheDenk() {
  const fall = aktuell();
  const st = standVon(fall.key);
  const e = fallBox.querySelector(`[data-denk="${fall.key}"]`);
  st.denk = e ? e.value : st.denk;
  if (woerter(st.denk) < DENK_WOERTER) {
    speichere();
    zeigeRueck(fallBox.querySelector(`[data-denk-rueck="${fall.key}"]`), {
      id: "kurz",
      text: "Schreib zuerst deine eigene Antwort — mindestens einen ganzen Satz. Der Vergleich lohnt sich erst, wenn du dich festgelegt hast.",
    });
    return;
  }
  st.denkVergleich = true;
  speichere();
  renderFall();
  renderReiter();
}

function meldeGeloest(fall) {
  const box = document.getElementById("fc-urteil-rueck");
  if (box) {
    box.insertAdjacentHTML("beforeend", `<p class="fc-geloest" data-geloest="1">🎉 Fall gelöst! Buchstabe ${fall.position}: <span class="fc-gross">${fall.buchstabe}</span></p>`);
  }
}

function zeigeUrteil(fall, j, frisch) {
  const box = document.getElementById("fc-urteil-rueck");
  const o = fall.urteil.optionen[j];
  if (!box || !o) return;
  box.className = "quiz-feedback " + (o.richtig ? "ok" : "err");
  box.dataset.urteil = o.richtig ? "richtig" : "falsch";
  const fehlt = o.richtig && !kernFertig(fall)
    ? `<p class="fc-meta">Dein Urteil stimmt. Damit der Fall als gelöst zählt, fehlt noch der rechnerische Beleg (${fall.schritte.map((s, i) => s.kern ? `Schritt ${i + 1}` : null).filter(Boolean).join(" und ")}).</p>`
    : "";
  box.innerHTML = `<p>${o.richtig ? "✓ " : "✗ "}${o.erklaerung}</p>${fehlt}${!o.richtig && frisch ? "<p class=\"fc-meta\">Lies die Begründung und urteile noch einmal.</p>" : ""}`;
}

function waehleUrteil(j) {
  const fall = aktuell();
  const st = standVon(fall.key);
  st.urteil = j;
  const neu = pruefeLoesung(fall);
  renderFall();
  renderWort();
  renderReiter();
  zeigeUrteil(fall, j, true);
  if (neu) meldeGeloest(fall);
}

function aufdecken(i) {
  const fall = aktuell();
  const st = standVon(fall.key);
  for (const f of fall.schritte[i].felder) {
    if (st.felder[f.id] !== "ok") {
      st.felder[f.id] = "auf";
      if (st.eingaben) delete st.eingaben[f.id];
    }
  }
  speichere();
  renderFall();
}

// ---------- Lösungssatz-Leiste, Reiter, Kurswahl ----------

function renderWort() {
  const felder = [];
  const luecken = new Set();
  let p = 0;
  for (const w of LOESUNGSSATZ.split(" ")) { p += w.replace(/\W/g, "").length; luecken.add(p); }
  for (let pos = 1; pos <= LOESUNGSWORT.length; pos++) {
    const fall = FAELLE.find((f) => f.position === pos);
    const frei = fall && buchstabeFrei(fall);
    const art = frei ? (standVon(fall.key).geloest ? " fc-wort-frei" : " fc-wort-geschenkt") : "";
    felder.push(`<span class="fc-wort-feld${art}" title="${fall ? `Fall ${fall.nr}: ${fall.titel}` : ""}">${frei ? fall.buchstabe : "?"}</span>`);
    if (luecken.has(pos) && pos < LOESUNGSWORT.length) felder.push(`<span class="fc-wort-luecke"></span>`);
  }
  const anzahl = FAELLE.filter((f) => standVon(f.key).geloest).length;
  wortLeiste.innerHTML = `<span class="fc-wort-label">Lösungssatz:</span> ${felder.join("")} <span class="fc-meta">${anzahl} von ${FAELLE.length} Fällen gelöst</span>`;
}

function renderReiter() {
  const gruppen = [];
  for (const f of FAELLE) {
    const g = gruppen.find((x) => x.kapitel === f.kapitel);
    if (g) g.faelle.push(f); else gruppen.push({ kapitel: f.kapitel, faelle: [f] });
  }
  reiter.innerHTML = gruppen.map((g) => `<div class="fc-gruppe"><span class="fc-gruppe-name">${g.kapitel === "K" ? "Komplex" : g.kapitel}</span>${g.faelle.map((f) => {
    const i = FAELLE.indexOf(f);
    const aktiv = !ansicht.pass && i === ansicht.fall;
    return `<button type="button" class="fc-tab${aktiv ? " fc-tab-aktiv" : ""}" data-fall="${i}" title="${f.titel}">${standVon(f.key).geloest ? "✅ " : ""}${f.icon} ${f.nr}${f.kurs === "lk" ? " <span class=\"fc-lk\">LK</span>" : ""}</button>`;
  }).join("")}</div>`).join("") + `<div class="fc-gruppe"><button type="button" class="fc-tab${ansicht.pass ? " fc-tab-aktiv" : ""}" data-pass="1">🗂 Pass</button></div>`;
}

function renderKurs() {
  kursBox.innerHTML = `<span class="fc-wort-label">Mein Kurs:</span>
    <button type="button" class="fc-tab${stand.kurs === "gk" ? " fc-tab-aktiv" : ""}" data-kurs="gk">Grundkurs</button>
    <button type="button" class="fc-tab${stand.kurs === "lk" ? " fc-tab-aktiv" : ""}" data-kurs="lk">Leistungskurs</button>
    <span class="fc-meta">${stand.kurs === "gk" ? "16 Fälle für dich — die Buchstaben der vier LK-Fälle sind geschenkt." : "Alle 20 Fälle zählen."}</span>`;
}

// ---------- Lösungssatz: eingetragen direkt unter der Buchstabenleiste ----------

function satzMeldung(ein) {
  if (!ein) return "Trag zuerst den Satz ein.";
  if (ein === LOESUNGSWORT) return `🎉 Richtig: „${LOESUNGSSATZ}“ — wer erst rechnet und dann teilt, verbreitet keine Zahlen, die nicht stimmen.`;
  const frei = FAELLE.filter(buchstabeFrei).length;
  if (ein.length !== LOESUNGSWORT.length) {
    return `Noch nicht. Der Satz hat ${LOESUNGSWORT.length} Buchstaben, deiner ${ein.length}. Du hast ${frei} der ${LOESUNGSWORT.length} Buchstaben schon in der Leiste — die Lücken zeigen, wo ein Wort endet.`;
  }
  return `Noch nicht. Vergleiche mit der Leiste: Du hast ${frei} der ${LOESUNGSWORT.length} Buchstaben schon freigeschaltet, jeder steht an seiner Stelle.`;
}
const satzNormal = (t) => String(t || "").toUpperCase().replace(/Ä/g, "AE").replace(/Ö/g, "OE").replace(/Ü/g, "UE").replace(/[^A-Z]/g, "");

function renderSatz() {
  if (!satzBox) return;
  satzBox.innerHTML = `<label class="fc-wort-label" for="fc-satz">Lösungssatz eintragen:</label>
    <span class="fc-wort-eingabe"><input type="text" id="fc-satz" maxlength="40" placeholder="Lösungssatz" autocomplete="off" spellcheck="false">
      <button type="button" class="btn btn-primary" id="fc-satz-pruefen">Prüfen</button></span>
    <p class="fc-status" id="fc-satz-rueck" aria-live="polite"></p>`;
  const feld = document.getElementById("fc-satz");
  const box = document.getElementById("fc-satz-rueck");
  if (stand.satz) feld.value = stand.satz;
  if (stand.satzGeloest) box.textContent = satzMeldung(LOESUNGSWORT);
  const pruefeSatz = () => {
    const ein = satzNormal(feld.value);
    stand.satz = feld.value;
    if (ein === LOESUNGSWORT) stand.satzGeloest = true;
    speichere();
    box.textContent = satzMeldung(ein);
    box.dataset.satz = ein === LOESUNGSWORT ? "richtig" : "falsch";
  };
  document.getElementById("fc-satz-pruefen").addEventListener("click", pruefeSatz);
  feld.addEventListener("keydown", (e) => { if (e.key === "Enter") pruefeSatz(); });
  feld.addEventListener("input", () => { stand.satz = feld.value; speichere(); });
}

// ---------- Pass ----------

function renderPass() {
  const zeilen = FAELLE.map((f) => {
    const st = standVon(f.key);
    const a = AMPEL.find((x) => x.wert === st.ampel);
    const status = st.geloest ? (st.muster ? "📖 mit Musterlösung" : "✅ gelöst") : geschenkt(f) ? "🎁 geschenkt (LK)" : "⬜ offen";
    const knobel = knobelGeloest(f) ? "🧩 gelöst" : knobelStand(f).versucht ? "versucht" : "—";
    const d = DENK.find((x) => x.wert === st.denkUrteil);
    const kritik = st.denkVergleich ? (d ? `${d.icon} ${d.text}` : "verglichen") : woerter(st.denk) > 0 ? "✍️ begonnen" : "—";
    return `<tr><td>${f.icon} ${f.nr}</td><td>${f.titel}</td><td>${f.kurs === "lk" ? "LK" : "GK + LK"}</td><td>${status}</td><td>${knobel}</td><td>${kritik}</td><td>${a ? `${a.icon} ${a.text}` : "—"}</td><td>${buchstabeFrei(f) ? `${f.position}. → <strong>${f.buchstabe}</strong>` : "—"}</td></tr>`;
  }).join("");
  if (!Array.isArray(stand.exit)) stand.exit = [];
  const exitFertig = EXIT.filter((_, i) => woerter(stand.exit[i]) > 0).length;
  passBox.innerHTML = `
    <div class="fc-block fc-behauptung">
      <strong>🗂 Dein Faktencheck-Pass</strong>
      <p>Hier siehst du, welche Behauptungen du schon geprüft hast und wie sicher du dich dabei fühlst. Der Pass bleibt in diesem Browser gespeichert.</p>
    </div>
    <div class="fc-tabelle-wrap"><table class="fc-tabelle fc-pass-tabelle">
      <thead><tr><th>Fall</th><th>Behauptung</th><th>Kurs</th><th>Stand</th><th>Knobelfrage</th><th>Modellkritik</th><th>Selbsteinschätzung</th><th>Buchstabe</th></tr></thead>
      <tbody>${zeilen}</tbody>
    </table></div>
    <div class="fc-block fc-auftrag">
      <strong>🔑 Der Lösungssatz</strong>
      <p>Ordne die Buchstaben nach ihrer Nummer und trag den Satz oben unter der Buchstabenleiste ein — dort wird er auch geprüft. Er ist das Motto jedes Faktenchecks und eine gute Regel für den nächsten Post, den du weiterleiten willst.</p>
      <p class="fc-status">${stand.satzGeloest ? `🎉 Gelöst: „${LOESUNGSSATZ}“` : "🔒 Noch nicht eingetragen."}</p>
    </div>
    <div class="fc-block fc-denkfrage fc-exit">
      <strong>🎫 Exit-Ticket — drei Sätze zum Schluss</strong>
      <ol>${EXIT.map((q, i) => `<li><label class="fc-text"><span>${q}</span>
        <textarea data-exit="${i}" rows="3" placeholder="Deine Antwort"></textarea></label></li>`).join("")}</ol>
      <p class="fc-meta" id="fc-exit-status" aria-live="polite">${exitFertig} von ${EXIT.length} Antworten geschrieben. Sie werden beim Schreiben in diesem Browser gespeichert und sind der Einstieg in die Besprechung.</p>
    </div>
    <div class="fc-block fc-selbstcheck">
      <strong>↩ Von vorn beginnen</strong>
      <p>Alles noch einmal frisch lösen, etwa zur Wiederholung vor der Klausur?</p>
      <p id="fc-reset-zeile"><button type="button" class="btn" id="fc-reset">Pass zurücksetzen</button></p>
    </div>`;
  passBox.querySelectorAll("[data-exit]").forEach((e) => {
    const i = Number(e.dataset.exit);
    e.value = stand.exit[i] || "";
    e.addEventListener("input", () => {
      stand.exit[i] = e.value;
      speichere();
      const n = EXIT.filter((_, k) => woerter(stand.exit[k]) > 0).length;
      document.getElementById("fc-exit-status").textContent = `${n} von ${EXIT.length} Antworten geschrieben. Sie werden beim Schreiben in diesem Browser gespeichert und sind der Einstieg in die Besprechung.`;
    });
  });
  // Zurücksetzen löscht auch die eigenen Texte — deshalb erst eine Rückfrage auf der Seite.
  document.getElementById("fc-reset").addEventListener("click", () => {
    document.getElementById("fc-reset-zeile").innerHTML = `<strong>Wirklich? Auch deine Texte (Modellkritik, Exit-Ticket) werden gelöscht.</strong><br>
      <button type="button" class="btn" id="fc-reset-ja">Ja, alles löschen</button> <button type="button" class="btn btn-primary" id="fc-reset-nein">Abbrechen</button>`;
    document.getElementById("fc-reset-nein").addEventListener("click", renderPass);
    document.getElementById("fc-reset-ja").addEventListener("click", () => {
      stand.faelle = {};
      stand.exit = [];
      delete stand.satz;
      delete stand.satzGeloest;
      for (const k of Object.keys(versuche)) delete versuche[k];
      ansicht.denkOffen.clear();
      speichere();
      renderPass();
      renderSatz();
      renderWort();
      renderReiter();
    });
  });
}

// ---------- Landkarte: welche Kapitel in welchem Fall ----------

const KAPITEL = {
  "1.1": ["../01-folgen-und-reihen/index.html", "Folgen und Reihen"],
  "1.2": ["../02-grenzwerte-und-stetigkeit/index.html", "Grenzwerte und Stetigkeit"],
  "2.1": ["../03-differentialrechnung/index.html", "Differentialrechnung"],
  "2.2": ["../03b-weitere-funktionen-ableiten/index.html", "Ableitung weiterer Funktionen"],
  "3.1": ["../04-funktionsuntersuchung/index.html", "Untersuchung ganzrationaler Funktionen"],
  "3.2": ["../04b-weitere-funktionen-untersuchen/index.html", "Untersuchung weiterer Funktionen"],
  "4.1": ["../05-integralrechnung/index.html", "Integralrechnung"],
  "4.2": ["../05b-weitere-funktionen-integrieren/index.html", "Integration weiterer Funktionen"],
};

function renderLandkarte() {
  const box = document.getElementById("fc-landkarte");
  if (!box) return;
  const zeilen = FAELLE.map((f) => `<tr>
      <td>${f.icon} ${f.nr}</td>
      <td><a href="#sec-faelle" data-gehe="${FAELLE.indexOf(f)}">${f.titel}</a></td>
      <td>${f.mathe}</td>
      <td>${f.kompetenzen.map((k) => `<a href="${KAPITEL[k][0]}" title="${KAPITEL[k][1]}">${k}</a>`).join(", ")}</td>
      <td>${f.kurs === "lk" ? '<span class="kurs-marke lk">LK</span>' : '<span class="kurs-marke gk">GK + LK</span>'}</td>
    </tr>`).join("");
  box.innerHTML = `<table class="fc-tabelle fc-landkarte">
      <thead><tr><th>Fall</th><th>Behauptung</th><th>Mathematischer Kern</th><th>Kapitel</th><th>Kurs</th></tr></thead>
      <tbody>${zeilen}</tbody>
    </table>`;
  box.addEventListener("click", (e) => {
    const a = e.target.closest("[data-gehe]");
    if (!a) return;
    ansicht.pass = false;
    ansicht.fall = Number(a.dataset.gehe);
    ansicht.stufe = 3;
    zeige();
  });
}

function zeige() {
  fallBox.hidden = ansicht.pass;
  passBox.hidden = !ansicht.pass;
  if (ansicht.pass) renderPass(); else renderFall();
  renderReiter();
}

// ---------- Verdrahtung ----------

reiter.addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  if (b.dataset.pass) { ansicht.pass = true; zeige(); return; }
  ansicht.pass = false;
  ansicht.fall = Number(b.dataset.fall);
  // Wie im Vorbild beginnt jeder Fall auf Stufe 3: Sonst verrieten die Teilschritte den Weg, bevor
  // jemand selbst darüber nachgedacht hat.
  ansicht.stufe = 3;
  zeige();
});

kursBox.addEventListener("click", (e) => {
  const b = e.target.closest("[data-kurs]");
  if (!b) return;
  stand.kurs = b.dataset.kurs;
  speichere();
  renderKurs();
  renderWort();
  zeige();
});

fallBox.addEventListener("click", (e) => {
  const t = e.target.closest("button");
  if (!t) return;
  const fall = aktuell();
  if (t.dataset.stufe) { ansicht.stufe = Number(t.dataset.stufe); renderFall(); return; }
  if (t.dataset.pruefe) { pruefeSchritt(Number(t.dataset.pruefe)); return; }
  if (t.dataset.tipp) {
    const i = Number(t.dataset.tipp);
    const k = `${fall.key}.${i}.tipp`;
    const schon = Math.max(ansicht.stufe === 1 ? 1 : 0, versuche[k] || 0);
    versuche[k] = Math.min(schon + 1, fall.schritte[i].tipps.length);
    renderFall();
    return;
  }
  if (t.dataset.aufdecken) { aufdecken(Number(t.dataset.aufdecken)); return; }
  if (t.dataset.knobelPruefe) { pruefeKnobel(); return; }
  if (t.dataset.denkVergleich) { vergleicheDenk(); return; }
  if (t.dataset.denkUrteil) {
    const st = standVon(fall.key);
    st.denkUrteil = st.denkUrteil === t.dataset.denkUrteil ? null : t.dataset.denkUrteil;
    speichere();
    renderFall();
    return;
  }
  if (t.dataset.urteil) { waehleUrteil(Number(t.dataset.urteil)); return; }
  if (t.dataset.muster) {
    const st = standVon(fall.key);
    st.muster = true;
    // Wer die Musterlösung aufschlägt, hat den Beleg damit vor Augen — der Fall gilt als gelöst,
    // im Pass aber ehrlich als „mit Musterlösung“.
    st.geloest = true;
    speichere();
    renderFall();
    renderWort();
    renderReiter();
    return;
  }
  if (t.dataset.ampel) {
    const st = standVon(fall.key);
    st.ampel = st.ampel === t.dataset.ampel ? null : t.dataset.ampel;
    speichere();
    renderFall();
  }
});

// Eingaben merken, ohne zu prüfen — ein Stufenwechsel soll nichts löschen.
fallBox.addEventListener("input", (e) => {
  const d = e.target.dataset || {};
  const fall = aktuell();
  if (d.feld) {
    const feld = fall.schritte.flatMap((s) => s.felder).find((f) => `${fall.key}.${f.id}` === d.feld);
    if (feld) merkeEingabe(fall, feld, e.target.value);
  } else if (d.knobel) {
    const feld = (fall.knobelFelder || []).find((f) => `${fall.key}.${f.id}` === d.knobel);
    if (feld) knobelStand(fall).eingaben[feld.id] = e.target.value;
  } else if (d.denk) {
    standVon(fall.key).denk = e.target.value;
    speichere();
  }
});
fallBox.addEventListener("keydown", (e) => {
  if (e.key !== "Enter" || !e.target.dataset) return;
  if (e.target.dataset.knobel) { pruefeKnobel(); return; }
  if (!e.target.dataset.feld) return;
  const s = e.target.closest("[data-schritt]");
  if (s) pruefeSchritt(Number(s.dataset.schritt));
});
// „toggle“ steigt nicht auf; in der Einfangphase kommt es trotzdem hier an.
fallBox.addEventListener("toggle", (e) => {
  const key = e.target.dataset && e.target.dataset.denkBox;
  if (!key) return;
  if (e.target.open) ansicht.denkOffen.add(key); else ansicht.denkOffen.delete(key);
}, true);

renderKurs();
renderWort();
renderSatz();
renderLandkarte();
zeige();
