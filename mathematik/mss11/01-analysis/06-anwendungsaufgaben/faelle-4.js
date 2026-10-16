// Fälle zu Kapitel 4: Integralrechnung (4.1) und Integration weiterer Funktionen (4.2).

import { num, bruch } from "./hilfen.js?v=1";

const n = num;
const L41 = "../05-integralrechnung/index.html";
const L42 = "../05b-weitere-funktionen-integrieren/index.html";
const integral = (o, u) => `<span class="integral"><span class="zeichen">∫</span><span class="grenzen"><span class="o">${o}</span><span class="u">${u}</span></span></span>`;

// ---------- 4.1 a: Balkonkraftwerk ----------

const leistung = (t) => Math.max(0, 600 - 15 * (t - 13) ** 2);
const r40 = Math.sqrt(40), r30 = Math.sqrt(30);
const tagesE = 800 * r40;           // Wh, Parabelfläche 2/3 · Grundseite · Höhe
const ueber = 600 * r30;            // Wh, Fläche zwischen P und 150 W
const eigen = tagesE - ueber;
const anteil = (100 * eigen) / 3600;
// Wintertag zur Denkfrage: 300 W Spitze, von 9 bis 16 Uhr.
const kW = 300 / 3.5 ** 2;
const winterE = (2 / 3) * 300 * 7;
const winterU = (2 / 3) * 150 * 2 * Math.sqrt(150 / kW);
// Knobelfrage: Grundlast g, bei der genau 1 kWh ins Netz fließt: (2/3)(600 − g) · 2√((600 − g)/15) = 1000.
const gEine = 600 - (750 * Math.sqrt(15)) ** (2 / 3);

const balkon = {
  key: "balkon",
  nr: "4.1 a",
  kapitel: "4.1",
  kurs: "gk",
  icon: "☀️",
  titel: "Das Balkonkraftwerk",
  behauptung: "„Unser Balkonkraftwerk macht an einem Sonnentag über 5 Kilowattstunden. Damit deckt es die Grundlast unserer Wohnung — 150 Watt rund um die Uhr, also 3,6 kWh — komplett ab.“",
  herkunft: "Nachbar im Treppenhaus",
  hintergrund: "<p>Seit dem Solarpaket I, das im Mai 2024 in Kraft trat, dürfen Balkonkraftwerke bis zu 800 Watt ins Hausnetz einspeisen. Viele Haushalte haben seitdem eines angeschafft. Die <strong>Grundlast</strong> einer Wohnung — Kühlschrank, Router, Geräte im Standby — liegt oft bei 100 bis 200 Watt, Tag und Nacht. Strom, der nicht sofort verbraucht wird, fließt ohne Speicher ins öffentliche Netz.</p>",
  quellen: [{ text: "PC Games Hardware: Balkonkraftwerk-Ratgeber", url: "https://www.pcgameshardware.de/Balkonkraftwerk-Hardware-280618/Specials/balkonkraftwerk-ratgeber-1477818/" }],
  modell: `<p>Leistung der Anlage an einem sonnigen Sommertag (t = Uhrzeit in Stunden, P in Watt), solange sie nicht negativ ist:</p>
    <p class="formula-block">P(t) = 600 − 15 · (t − 13)²</p>
    <p>Die Wohnung verbraucht konstant 150 W. Es gibt keinen Speicher.</p>`,
  figur: {
    titel: "Leistung des Balkonkraftwerks und Grundlast der Wohnung",
    x: { von: 4, bis: 22, schritt: 2, titel: "Uhrzeit t in h" },
    y: { von: 0, bis: 700, schritt: 100, titel: "Leistung in W" },
    kurven: [{ f: leistung, von: 4, bis: 22, farbe: "gruen", rolle: "leistung" }],
    waagrecht: [{ y: 150, farbe: "orange", rolle: "grundlast" }],
    legende: [{ farbe: "gruen", text: "Leistung P(t)" }, { farbe: "orange", text: "Grundlast 150 W" }],
  },
  rueckblick: `<p>Energie ist Leistung mal Zeit — und wenn die Leistung sich ändert, das Integral der Leistung. Wie berechnet man die Fläche zwischen zwei Graphen? Nachlesen: <a href="${L41}#sec-rekonstruktion">4.1, Abschnitt 1</a> und <a href="${L41}#sec-zwischen">Abschnitt 8</a>.</p>`,
  werkzeug: `<ul>
      <li>Energie: E = ${integral("b", "a")} P(t) dt (W · h = Wh; 1 kWh = 1.000 Wh) (<a href="${L41}#sec-rekonstruktion">4.1, Abschnitt 1</a>)</li>
      <li>Fläche zwischen Graphen: ${integral("b", "a")} (P(t) − g(t)) dt zwischen den Schnittstellen (<a href="${L41}#sec-zwischen">4.1, Abschnitt 8</a>)</li>
      <li>Stammfunktion: ∫ (t − 13)² dt = ${bruch("(t − 13)³", "3")} (Probe durch Ableiten)</li>
    </ul>`,
  kernfrage: "Entscheidend ist: Wie viel der 3,6 kWh Grundlast stammen wirklich vom Balkon — und wie viel Strom fließt ins Netz?",
  schritte: [
    {
      phase: 1,
      frage: "Ab welcher Uhrzeit liefert die Anlage Strom (P(t) = 0)? Gib t in Stunden an.",
      felder: [{
        id: "t1", label: "t₁ ≈", einheit: "h", soll: 13 - r40, tol: 0.01, stellen: 2,
        falsch: [{ wert: 13 + r40, id: "abend", text: "Das ist die zweite Nullstelle — dann hört die Anlage am Abend auf." }],
      }],
      tipps: ["600 − 15 · (t − 13)² = 0 ⟺ (t − 13)² = 40."],
      loesung: `(t − 13)² = 40 ⟹ t = 13 ± √40; t₁ ≈ ${n(13 - r40, 2)} (gegen 6:41 Uhr), t₂ ≈ ${n(13 + r40, 2)}.`,
    },
    {
      phase: 3,
      frage: "Wie viel Energie erzeugt die Anlage an diesem Tag? Gib das Ergebnis in kWh an.",
      felder: [{
        id: "E", label: "Tagesenergie:", einheit: "kWh", soll: tagesE / 1000, tol: 0.01, stellen: 2,
        falsch: [{ wert: (600 * 2 * r40) / 1000, id: "rechteck", text: "Das wäre die volle Leistung von 600 W den ganzen Tag lang — ein Rechteck. Die Fläche unter der Parabel ist nur zwei Drittel davon." }],
      }],
      tipps: [`E = ${integral("t₂", "t₁")} (600 − 15(t − 13)²) dt.`, "Stammfunktion: 600t − 5 · (t − 13)³."],
      loesung: `E = [600t − 5(t − 13)³] von t₁ bis t₂ = 2 · (600 · √40 − 5 · 40√40) = 800 · √40 ≈ ${n(tagesE, 0)} Wh ≈ ${n(tagesE / 1000, 2)} kWh.`,
      deutung: "Gut 5 kWh — der erste Teil der Behauptung stimmt.",
    },
    {
      phase: 3,
      frage: "Wie viele Stunden lang liefert die Anlage mindestens 150 W?",
      felder: [{
        id: "dauer", label: "Dauer:", einheit: "h", soll: 2 * r30, tol: 0.01, stellen: 2,
        falsch: [{ wert: 2 * r40, id: "ganzer-tag", text: "Das ist die ganze Zeit, in der die Anlage überhaupt Strom liefert. Gefragt ist, wie lange P(t) ≥ 150 ist." }],
      }],
      tipps: ["600 − 15 · (t − 13)² = 150 ⟺ (t − 13)² = 30."],
      loesung: `(t − 13)² = 30 ⟹ t = 13 ± √30 ≈ ${n(13 - r30, 2)} bzw. ${n(13 + r30, 2)}; Dauer 2√30 ≈ ${n(2 * r30, 2)} h.`,
    },
    {
      phase: 3,
      frage: "In dieser Zeit liefert die Anlage mehr, als die Wohnung braucht. Wie viel Energie fließt ins Netz? (Fläche zwischen P und der Grundlast, in kWh.)",
      felder: [{
        id: "U", label: "Überschuss:", einheit: "kWh", soll: ueber / 1000, tol: 0.01, stellen: 2,
        falsch: [{ wert: (tagesE - 150 * 2 * r30) / 1000, id: "ganze-flaeche", text: "Du hast die ganze Tagesenergie genommen und die Grundlast abgezogen. Am frühen Morgen und am Abend liefert die Anlage aber weniger als 150 W — diese Energie wird vollständig selbst verbraucht. Zum Überschuss zählt nur die Fläche zwischen P und 150 W." }],
      }],
      tipps: [`Überschuss = ${integral("13 + √30", "13 − √30")} (P(t) − 150) dt = ${integral("13 + √30", "13 − √30")} (450 − 15(t − 13)²) dt.`, "Stammfunktion: 450t − 5 · (t − 13)³."],
      loesung: `${integral("13 + √30", "13 − √30")} (450 − 15(t − 13)²) dt = 600 · √30 ≈ ${n(ueber, 0)} Wh ≈ ${n(ueber / 1000, 2)} kWh.`,
    },
    {
      phase: 4,
      kern: true,
      frage: "Welcher Anteil der Grundlast von 3,6 kWh wird wirklich vom Balkonkraftwerk gedeckt? Gib ihn in Prozent an.",
      felder: [{
        id: "anteil", label: "Anteil:", einheit: "%", soll: anteil, tol: 0.3, stellen: 1,
        falsch: [
          { wert: (100 * tagesE) / 3600, id: "alles", text: "Das wäre der Anteil, wenn man die ganze Tagesenergie selbst verbrauchen könnte. Der Überschuss vom Mittag fließt aber ins Netz." },
          { wert: eigen / 1000, id: "kwh", text: "Das ist der selbst verbrauchte Strom in kWh. Gefragt ist sein Anteil an den 3,6 kWh, in Prozent." },
          { wert: 100, id: "komplett", text: "Nachts liefert die Anlage gar nichts — die Grundlast läuft aber weiter." },
        ],
      }],
      tipps: ["Selbst verbraucht wird: Tagesenergie − Überschuss.", `(${n(tagesE / 1000, 2)} − ${n(ueber / 1000, 2)}) kWh von 3,6 kWh.`],
      loesung: `Selbst verbraucht: ${n(tagesE / 1000, 3)} − ${n(ueber / 1000, 3)} ≈ ${n(eigen / 1000, 2)} kWh; Anteil ${n(eigen / 1000, 3)}/3,6 ≈ ${n(anteil, 1)} %.`,
      deutung: "Knapp die Hälfte der Grundlast — trotz mehr als genug Energie.",
    },
  ],
  urteil: {
    optionen: [
      { text: "Stimmt: 5,06 kWh sind mehr als 3,6 kWh.", erklaerung: "Rechnerisch reicht die Energie — sie kommt aber zur falschen Zeit. Nachts liefert die Anlage nichts, mittags mehr als gebraucht." },
      { text: "Stimmt nicht: Die Anlage erzeugt nur 1,8 kWh am Tag.", erklaerung: "1,8 kWh ist der Teil, der selbst verbraucht wird. Erzeugt werden gut 5 kWh." },
      { text: "Stimmt: Tagsüber deckt sie die Grundlast, und den Überschuss vom Mittag nutzt die Wohnung nachts.", erklaerung: "Ohne Speicher geht das nicht: Der Überschuss fließt ins Netz und ist für die Nacht verloren." },
      { text: `Stimmt nicht: Die Energie reicht nur rechnerisch. Mittags fließen rund ${n(ueber / 1000, 1)} kWh ins Netz, nachts liefert die Anlage nichts — gedeckt wird knapp die Hälfte der Grundlast.`, richtig: true, erklaerung: "Genau. Entscheidend ist nicht die Fläche unter P allein, sondern die Fläche unter dem kleineren der beiden Graphen: P oder 150 W. Wer den Mittagsstrom nutzen will, braucht einen Speicher — oder lässt Waschmaschine und Spülmaschine mittags laufen." },
    ],
  },
  merksatz: `<p>Energie ist das Integral der Leistung: E = ${integral("b", "a")} P(t) dt. Die Fläche zwischen zwei Graphen über dem Bereich, in dem P ≥ g ist, ist der Überschuss. Bilanzen im Sachzusammenhang zerlegt man an den Schnittstellen.</p>`,
  denkfrage: "Wie sieht die Rechnung an einem sonnigen Wintertag aus, an dem die Anlage nur von 9 bis 16 Uhr liefert, mit höchstens 300 W (wieder als Parabel)?",
  musterantwort: `<p>Die Parabel hat dann die Fläche ${bruch("2", "3")} · 300 W · 7 h = ${n(winterE / 1000, 1)} kWh. Über 150 W liegt sie gut ${n(2 * Math.sqrt(150 / kW), 1)} Stunden lang; der Überschuss ist ${bruch("2", "3")} · 150 W · ${n(2 * Math.sqrt(150 / kW), 2)} h ≈ ${n(winterU / 1000, 2)} kWh. Selbst verbraucht werden ${n((winterE - winterU) / 1000, 2)} kWh — nur noch rund ${n((100 * (winterE - winterU)) / 3600, 0)} % der Grundlast.</p>`,
  knobel: "Wie groß müsste die Grundlast sein, damit an diesem Sommertag nur noch 1 kWh ins Netz fließt?",
  knobelFelder: [
    {
      id: "grundlast", label: "Grundlast g ≈", einheit: "W", soll: gEine, tol: 1, stellen: 0,
      falsch: [
        { wert: 150, id: "heute", text: `150 W ist die Grundlast, mit der der Fall rechnet — damit fließen mittags rund ${n(ueber / 1000, 1)} kWh ins Netz. Gesucht ist das g, bei dem die Fläche zwischen P und g nur noch 1.000 Wh beträgt.` },
        { wert: 600 - (0.75 * Math.sqrt(15)) ** (2 / 3), id: "wattstunde", tol: 0.05, text: "So bliebe nur 1 Wh Überschuss. Die Fläche ist in Wattstunden gerechnet, und 1 kWh sind 1.000 Wh." },
      ],
    },
  ],
  knobelAntwort: `<p>Mit Grundlast g ist der Überschuss ${bruch("2", "3")} · (600 − g) · 2√((600 − g)/15) Wh. Gleich 1.000 gesetzt: (600 − g)<sup>3/2</sup> = 750 · √15, also 600 − g ≈ ${n(600 - gEine, 0)} und g ≈ ${n(gEine, 0)} W — mehr als das Doppelte der Wohnung.</p>`,
  partner: "Zeichnet die Fläche, die ins Netz fließt, und die Fläche, die selbst verbraucht wird, farbig in die Skizze. Vergleicht: Hat jemand die Morgen- und Abendstunden vergessen?",
};

// ---------- 4.1 b: Notbremsassistent ----------

function anhalten(kmh, reaktion) {
  const v0 = kmh / 3.6;
  const r = reaktion * v0;
  const p1 = 0.5 * v0 - 1 / 3;              // ∫ von 0 bis 0,5 von (v0 − 8t²) dt
  const tStop = 0.5 + (v0 - 2) / 8;
  const p2 = (v0 - 2) ** 2 / 16;            // ∫ von 0,5 bis tStop von (v0 − 2 − 8(t − 0,5)) dt
  return { v0, r, p1, tStop, p2, gesamt: r + p1 + p2 };
}
const a50 = anhalten(50, 0.4);
const m30 = anhalten(30, 1.0);
const m50 = anhalten(50, 1.0);
const vAufprall = Math.sqrt((a50.v0 - 2) ** 2 - 16 * (18 - a50.r - a50.p1)) * 3.6;
const vBrems = (t) => (t <= 0.5 ? a50.v0 - 8 * t * t : Math.max(0, a50.v0 - 2 - 8 * (t - 0.5)));
const vBrems30 = (t) => (t <= 0.5 ? m30.v0 - 8 * t * t : Math.max(0, m30.v0 - 2 - 8 * (t - 0.5)));

const notbremse = {
  key: "notbremse",
  nr: "4.1 b",
  kapitel: "4.1",
  kurs: "gk",
  icon: "🛑",
  titel: "Notbremsassistent oder Tempo 30?",
  behauptung: "„Ein Auto mit Tempo 30 ohne Notbremsassistent hält trotzdem früher an als ein Auto mit Tempo 50 und Notbremsassistent.“",
  herkunft: "Plakat einer Elterninitiative vor einer Grundschule",
  hintergrund: "<p>Seit dem 7. Juli 2024 muss jeder neu zugelassene Pkw in der EU einen Notbremsassistenten haben (Verordnung (EU) 2019/2144). Er erkennt ein Hindernis und bremst selbst — schneller, als ein Mensch reagiert: Menschen brauchen zum Erkennen und Reagieren etwa eine Sekunde. Zugleich wird in vielen Städten über Tempo 30 gestritten. Gegner sagen: Mit moderner Technik sei das überflüssig.</p>",
  quellen: [{ text: "firmenauto: Neue verpflichtende Assistenzsysteme", url: "https://www.firmenauto.de/branche/eu-verordnung-fuer-pkw-neue-verpflichtende-assistenzsysteme/" }],
  modell: `<p>Bis die Bremse greift, fährt das Auto ungebremst weiter: mit Assistent 0,4 s, ohne Assistent 1,0 s. Dann (t in s ab Bremsbeginn, v in m/s, v₀ = Anfangsgeschwindigkeit):</p>
    <ul>
      <li>0 ≤ t ≤ 0,5: v(t) = v₀ − 8t² (der Bremsdruck baut sich auf)</li>
      <li>t ≥ 0,5: v(t) = v₀ − 2 − 8 · (t − 0,5) (volle Bremsung) bis zum Stillstand</li>
    </ul>`,
  figur: {
    titel: "Geschwindigkeit beim Bremsen aus Tempo 50 und aus Tempo 30",
    x: { von: 0, bis: 2.2, schritt: 0.2, beschriftung: 2, titel: "Zeit ab Bremsbeginn in s" },
    y: { von: 0, bis: 16, schritt: 2, titel: "Geschwindigkeit in m/s" },
    kurven: [
      { f: vBrems, von: 0, bis: 2.2, farbe: "blau", rolle: "v50" },
      { f: vBrems30, von: 0, bis: 2.2, farbe: "orange", rolle: "v30" },
    ],
    legende: [{ farbe: "blau", text: "aus 50 km/h" }, { farbe: "orange", text: "aus 30 km/h" }],
    hinweis: "Die Fläche unter jeder Kurve ist der Bremsweg.",
  },
  rueckblick: `<p>Aus der Geschwindigkeit gewinnt man den Weg zurück: als Fläche unter dem v-t-Graphen, also als Integral. Nachlesen: <a href="${L41}#sec-rekonstruktion">4.1, Abschnitt 1</a> und <a href="${L41}#sec-integral">Abschnitt 3</a>.</p>`,
  werkzeug: `<ul>
      <li>Weg: s = ${integral("b", "a")} v(t) dt (<a href="${L41}#sec-rekonstruktion">4.1, Abschnitt 1</a>)</li>
      <li>Bei konstanter Geschwindigkeit: s = v · t</li>
      <li>Abschnittsweise integrieren und addieren (<a href="${L41}#sec-integral">4.1, Abschnitt 3</a>)</li>
      <li>50 km/h = 13,89 m/s; 30 km/h = 8,33 m/s</li>
    </ul>`,
  kernfrage: "Entscheidend ist: Wie lang sind die beiden Anhaltewege — Reaktionsweg plus Bremsweg?",
  schritte: [
    {
      phase: 2,
      frage: "Tempo 50 mit Assistent: Wie weit fährt das Auto in den 0,4 s, bis die Bremse greift?",
      felder: [{ id: "r50", label: "Reaktionsweg:", einheit: "m", soll: a50.r, tol: 0.02, stellen: 2, falsch: [] }],
      tipps: ["50 km/h = 50/3,6 m/s.", "Weg = Geschwindigkeit · Zeit."],
      loesung: `${n(a50.v0, 2)} m/s · 0,4 s ≈ ${n(a50.r, 2)} m.`,
    },
    {
      phase: 3,
      frage: "Bremsweg in der ersten halben Sekunde (Bremsdruck baut sich auf): Berechne das Integral von v(t) = v₀ − 8t² von 0 bis 0,5.",
      felder: [{
        id: "p1", label: "Weg in Phase 1:", einheit: "m", soll: a50.p1, tol: 0.02, stellen: 2,
        falsch: [{ wert: 0.5 * a50.v0, id: "ungebremst", text: "Das wäre der Weg ohne Bremsen (v₀ · 0,5). In dieser halben Sekunde wird das Auto aber schon langsamer: Integriere v₀ − 8t²." }],
      }],
      tipps: [`${integral("0,5", "0")} (v₀ − 8t²) dt = [v₀t − ${bruch("8", "3")}t³] von 0 bis 0,5.`, "= 0,5 · v₀ − 1/3."],
      loesung: `${integral("0,5", "0")} (v₀ − 8t²) dt = 0,5 · ${n(a50.v0, 3)} − ${bruch("1", "3")} ≈ ${n(a50.p1, 2)} m.`,
    },
    {
      phase: 3,
      frage: "Phase 2 (volle Bremsung): Wann steht das Auto, und wie lang ist der Weg in dieser Phase?",
      felder: [
        { id: "tst", label: "Stillstand bei t ≈", einheit: "s", soll: a50.tStop, tol: 0.005, stellen: 3, falsch: [] },
        { id: "p2", label: "Weg in Phase 2:", einheit: "m", soll: a50.p2, tol: 0.02, stellen: 2, falsch: [] },
      ],
      tipps: ["v₀ − 2 − 8 · (t − 0,5) = 0 ⟺ t = 0,5 + (v₀ − 2)/8.", "Der Weg ist die Dreiecksfläche unter der Geraden — oder das Integral von 0,5 bis zum Stillstand."],
      loesung: `t = 0,5 + ${bruch(n(a50.v0 - 2, 3), "8")} ≈ ${n(a50.tStop, 3)} s; Weg ${bruch("(v₀ − 2)²", "16")} ≈ ${n(a50.p2, 2)} m.`,
    },
    {
      phase: 3,
      kern: true,
      frage: "Wie lang ist der gesamte Anhalteweg bei Tempo 50 mit Assistent?",
      felder: [{
        id: "g50", label: "Anhalteweg:", einheit: "m", soll: a50.gesamt, tol: 0.05, stellen: 1,
        falsch: [{ wert: m50.gesamt, id: "ohne-assistent", text: "Das ist der Anhalteweg ohne Assistent (1 s Reaktionszeit). Mit Assistent greift die Bremse schon nach 0,4 s." }],
      }],
      tipps: ["Reaktionsweg + Phase 1 + Phase 2."],
      loesung: `${n(a50.r, 2)} + ${n(a50.p1, 2)} + ${n(a50.p2, 2)} ≈ ${n(a50.gesamt, 1)} m.`,
    },
    {
      phase: 4,
      kern: true,
      frage: "Und bei Tempo 30 <em>ohne</em> Assistent (1,0 s bis die Bremse greift, sonst dasselbe Bremsmodell)?",
      felder: [{
        id: "g30", label: "Anhalteweg:", einheit: "m", soll: m30.gesamt, tol: 0.05, stellen: 1,
        falsch: [{ wert: anhalten(30, 0.4).gesamt, id: "mit-assistent", text: "Das ist der Anhalteweg mit Assistent. Gefragt ist Tempo 30 ohne Assistent — mit 1,0 s Reaktionszeit." }],
      }],
      tipps: ["v₀ = 30/3,6 ≈ 8,33 m/s. Reaktionsweg: 8,33 m.", "Phase 1: 0,5 · v₀ − 1/3; Phase 2: (v₀ − 2)²/16."],
      loesung: `${n(m30.r, 2)} + ${n(m30.p1, 2)} + ${n(m30.p2, 2)} ≈ ${n(m30.gesamt, 1)} m.`,
      deutung: "Der Anhalteweg bei Tempo 30 ohne Technik ist kürzer als bei Tempo 50 mit Technik.",
    },
  ],
  urteil: {
    optionen: [
      { text: "Stimmt nicht: Mit Assistent hält das Auto bei Tempo 50 früher an, weil er schneller reagiert.", erklaerung: `Der Assistent spart 0,6 s Reaktionszeit, also gut 8 m bei Tempo 50. Der Bremsweg selbst ist aber viel länger als bei Tempo 30: Insgesamt ${n(a50.gesamt, 1)} m gegen ${n(m30.gesamt, 1)} m.` },
      { text: `Stimmt: Tempo 30 ohne Assistent braucht rund ${n(m30.gesamt, 1)} m, Tempo 50 mit Assistent rund ${n(a50.gesamt, 1)} m. Die schnellere Reaktion macht die höhere Geschwindigkeit nicht wett.`, richtig: true, erklaerung: `Genau. Der Bremsweg wächst etwa mit dem Quadrat der Geschwindigkeit: Phase 2 ist bei 50 km/h ${n(a50.p2 / m30.p2, 1)}-mal so lang wie bei 30 km/h. Die Sekundenbruchteile, die der Assistent beim Reagieren spart, reichen nicht. Läuft ein Kind 18 m vor dem Auto auf die Straße, steht das Auto bei Tempo 30 rechtzeitig — bei Tempo 50 prallt es trotz Assistent noch mit rund ${n(vAufprall, 0)} km/h auf.` },
      { text: "Stimmt nicht: Beide Autos halten genau gleich weit an.", erklaerung: `Die Rechnung ergibt ${n(m30.gesamt, 1)} m gegen ${n(a50.gesamt, 1)} m.` },
      { text: "Stimmt, aber nur, weil Menschen bei Tempo 30 schneller reagieren.", erklaerung: "Die Reaktionszeit hängt im Modell nicht vom Tempo ab. Der Unterschied kommt aus dem Bremsweg, der mit der Geschwindigkeit stark wächst." },
    ],
  },
  merksatz: `<p>Der Weg ist das Integral der Geschwindigkeit: s = ${integral("b", "a")} v(t) dt. Ist v abschnittsweise gegeben, integriert man Abschnitt für Abschnitt und addiert die Teilwege.</p>`,
  denkfrage: "Ist das Bremsmodell bei t = 0,5 stetig? Prüfe die Geschwindigkeit und die Bremsverzögerung a(t) = −v′(t) links und rechts. Warum wäre ein Sprung in a unrealistisch?",
  musterantwort: "<p>Geschwindigkeit: links v₀ − 8 · 0,25 = v₀ − 2, rechts v₀ − 2 — stetig. Verzögerung: links 16t = 8, rechts 8 — ebenfalls stetig, das Modell ist sogar differenzierbar. Ein Sprung in der Verzögerung wäre ein schlagartiger Ruck. Echte Bremsen bauen den Druck in Bruchteilen einer Sekunde auf, nicht in null Sekunden.</p>",
  knobel: "Mit welcher Geschwindigkeit trifft das Auto bei Tempo 50 mit Assistent ein Hindernis in 18 m Entfernung?",
  knobelFelder: [
    {
      id: "aufprall", label: "v ≈", einheit: "km/h", soll: vAufprall, tol: 0.2, stellen: 1,
      falsch: [
        { wert: 0, id: "steht", text: `Bei Tempo 50 steht das Auto auch mit Assistent erst nach rund ${n(a50.gesamt, 1)} m — bei 18 m fährt es noch.` },
        { wert: (a50.v0 - 2) * 3.6, id: "phase1", text: `So schnell ist das Auto am Ende von Phase 1, nach ${n(a50.r + a50.p1, 2)} m. Auf den restlichen ${n(18 - a50.r - a50.p1, 2)} m bremst es mit 8 m/s² weiter.` },
      ],
    },
  ],
  knobelAntwort: `<p>Nach Reaktion und Phase 1 sind ${n(a50.r + a50.p1, 2)} m zurückgelegt, die Geschwindigkeit ist v₀ − 2 ≈ ${n(a50.v0 - 2, 2)} m/s. In Phase 2 bleiben ${n(18 - a50.r - a50.p1, 2)} m. Bei konstanter Verzögerung 8 m/s² gilt v² = (v₀ − 2)² − 2 · 8 · s, also v ≈ ${n(vAufprall / 3.6, 2)} m/s ≈ ${n(vAufprall, 0)} km/h.</p>`,
  partner: "Vergleicht eure Teilwege. Erklärt euch gegenseitig am v-t-Diagramm, welche Fläche zu welchem Teilweg gehört — und welche Fläche im Diagramm gar nicht vorkommt.",
};

// ---------- 4.2 a: Regenrückhaltebecken ----------

const zufluss = (t) => 1200 * Math.exp(-0.4 * t);
const tGleich = Math.log(4) / 0.4;
const vBecken = (t) => 2000 + 3000 * (1 - Math.exp(-0.4 * t)) - 300 * t;
const vMax = vBecken(tGleich);

const becken = {
  key: "becken",
  nr: "4.2 a",
  kapitel: "4.2",
  kurs: "gk",
  icon: "🌧️",
  titel: "Läuft das Regenbecken über?",
  behauptung: "„Unser Rückhaltebecken fasst 3.500 m³, nach dem Unwetter waren 2.000 m³ drin. Bis alles nachgelaufen ist, kommen höchstens noch 3.000 m³ dazu, und die Drossel lässt 300 m³ pro Stunde ab. Das Becken läuft nicht über.“",
  herkunft: "Auskunft bei einer Bürgerversammlung nach einem Unwetter",
  hintergrund: "<p>Starkregen wird mit dem Klimawandel häufiger und heftiger. Damit die Kanalisation nicht überläuft, sammeln <strong>Regenrückhaltebecken</strong> das Wasser und geben es gedrosselt weiter. Viele Städte planen inzwischen als „Schwammstadt“: Regenwasser soll gespeichert und versickert werden, statt sofort abzufließen. Auch nachdem der Regen aufgehört hat, fließt aus Straßen, Dächern und Gräben noch lange Wasser nach.</p>",
  modell: `<p>t in Stunden nach dem Ende des Regens. Zufluss ins Becken z(t), Abfluss durch die Drossel konstant:</p>
    <p class="formula-block">z(t) = 1.200 · e<sup>−0,4t</sup> m³/h, &nbsp; Abfluss 300 m³/h, &nbsp; V(0) = 2.000 m³</p>
    <p>Das Becken fasst 3.500 m³.</p>`,
  figur: {
    titel: "Zufluss und Abfluss am Regenrückhaltebecken",
    x: { von: 0, bis: 12, schritt: 1, titel: "Zeit nach dem Regen t in h" },
    y: { von: 0, bis: 1200, schritt: 200, titel: "Rate in m³/h" },
    kurven: [{ f: zufluss, von: 0, bis: 12, farbe: "blau", rolle: "zufluss" }],
    waagrecht: [{ y: 300, farbe: "orange", rolle: "abfluss" }],
    legende: [{ farbe: "blau", text: "Zufluss z(t)" }, { farbe: "orange", text: "Abfluss 300 m³/h" }],
  },
  rueckblick: `<p>Ein Bestand ergibt sich aus Anfangsbestand plus Integral der Änderungsrate. Wie integriert man e<sup>−kt</sup> — und was passiert mit dem Integral, wenn die obere Grenze gegen unendlich geht? Nachlesen: <a href="${L42}#sec-ekx">4.2, Abschnitt 2</a> und <a href="${L42}#sec-bestand">Abschnitt 4</a>.</p>`,
  werkzeug: `<ul>
      <li>∫ e<sup>kt</sup> dt = ${bruch("1", "k")} · e<sup>kt</sup> + C (<a href="${L42}#sec-ekx">4.2, Abschnitt 2</a>)</li>
      <li>Bestand: V(t) = V(0) + ${integral("t", "0")} (z(s) − 300) ds (<a href="${L42}#sec-bestand">4.2, Abschnitt 4</a>)</li>
      <li>Der Bestand ist maximal, wo die Änderungsrate z(t) − 300 von + nach − wechselt.</li>
    </ul>`,
  kernfrage: "Entscheidend ist: Wie voll wird das Becken höchstens — und wann?",
  schritte: [
    {
      phase: 3,
      frage: "Wie viel Wasser fließt in den ersten 2 Stunden zu?",
      felder: [{
        id: "z2", label: "Zufluss:", einheit: "m³", soll: 3000 * (1 - Math.exp(-0.8)), tol: 1, stellen: 0,
        falsch: [
          { wert: 2400, id: "konstant", text: "Das wären 2 Stunden mit konstant 1.200 m³/h. Der Zufluss nimmt aber ab." },
          { wert: 1200 * (1 - Math.exp(-0.8)), id: "ohne-1-durch-k", text: "Bei der Stammfunktion fehlt der Faktor 1/k: ∫ 1.200 · e<sup>−0,4t</sup> dt = −3.000 · e<sup>−0,4t</sup>." },
        ],
      }],
      tipps: ["Stammfunktion von 1.200 · e<sup>−0,4t</sup>: −3.000 · e<sup>−0,4t</sup>.", "[−3.000 · e<sup>−0,4t</sup>] von 0 bis 2."],
      loesung: `${integral("2", "0")} 1.200 e<sup>−0,4t</sup> dt = 3.000 · (1 − e<sup>−0,8</sup>) ≈ ${n(3000 * (1 - Math.exp(-0.8)), 0)} m³.`,
    },
    {
      phase: 3,
      frage: "Wie viel Wasser fließt insgesamt nach, wenn man unbegrenzt lange wartet (t → ∞)?",
      felder: [{
        id: "zges", label: "Gesamtzufluss:", einheit: "m³", soll: 3000, tol: 1, stellen: 0,
        falsch: [
          { wert: 1200, id: "rate", text: "1.200 m³/h ist die Anfangsrate, keine Wassermenge. Gesucht ist das Integral von 0 bis ∞." },
          { wert: Infinity, id: "unendlich", text: "Der Zufluss hört zwar nie ganz auf, wird aber so schnell klein, dass das Integral einen endlichen Grenzwert hat." },
        ],
      }],
      tipps: ["3.000 · (1 − e<sup>−0,4b</sup>) für b → ∞.", "e<sup>−0,4b</sup> → 0."],
      loesung: "3.000 · (1 − e<sup>−0,4b</sup>) → 3.000 m³ für b → ∞. Die Angabe „höchstens 3.000 m³“ stimmt.",
    },
    {
      phase: 2,
      frage: "Wann ist das Becken am vollsten?",
      felder: [{
        id: "tg", label: "t ≈", einheit: "h", soll: tGleich, tol: 0.01, stellen: 2,
        falsch: [{ wert: 0, id: "anfang", text: "Am Anfang fließt am meisten zu — aber das Volumen wächst weiter, solange mehr zu- als abfließt." }],
      }],
      tipps: ["Das Volumen wächst, solange z(t) &gt; 300 ist.", "1.200 · e<sup>−0,4t</sup> = 300 ⟺ e<sup>−0,4t</sup> = 1/4."],
      loesung: `z(t) = 300 ⟺ e<sup>−0,4t</sup> = ${bruch("1", "4")} ⟺ t = ${bruch("ln 4", "0,4")} ≈ ${n(tGleich, 2)} h. Davor ist V′ &gt; 0, danach V′ &lt; 0.`,
    },
    {
      phase: 3,
      kern: true,
      frage: "Wie viel Wasser ist dann im Becken?",
      felder: [{
        id: "vmax", label: "V<sub>max</sub> ≈", einheit: "m³", soll: vMax, tol: 2, stellen: 0,
        falsch: [
          { wert: 5000, id: "ohne-abfluss", text: "2.000 + 3.000 vergisst den Abfluss: Während das Wasser nachläuft, lässt die Drossel schon 300 m³ pro Stunde ab." },
          { wert: 2000 + 3000 - 300 * tGleich, id: "gesamt-statt-bis-t", text: "Du hast den ganzen Zufluss bis t → ∞ genommen, aber den Abfluss nur bis t ≈ 3,47 h. Beides muss bis zum selben Zeitpunkt gerechnet werden." },
        ],
      }],
      tipps: [`V = 2.000 + ${integral("t*", "0")} (1.200 e<sup>−0,4t</sup> − 300) dt mit t* = ln 4/0,4.`, "= 2.000 + 3.000 · (1 − 1/4) − 300 · t*."],
      loesung: `V(t*) = 2.000 + 3.000 · (1 − ${bruch("1", "4")}) − 300 · ${n(tGleich, 3)} ≈ ${n(vMax, 0)} m³.`,
      deutung: "Das Becken bleibt unter seiner Kapazität von 3.500 m³.",
    },
    {
      phase: 4,
      frage: "Wie viel Reserve bleibt im schlimmsten Moment?",
      felder: [{ id: "res", label: "Reserve:", einheit: "m³", soll: 3500 - vMax, tol: 2, stellen: 0, falsch: [] }],
      tipps: ["3.500 − V<sub>max</sub>."],
      loesung: `3.500 − ${n(vMax, 0)} ≈ ${n(3500 - vMax, 0)} m³.`,
    },
  ],
  urteil: {
    optionen: [
      { text: `Stimmt: Das Becken füllt sich höchstens auf etwa ${n(vMax, 0)} m³ — knapp 300 m³ unter der Kapazität. Am vollsten ist es nach knapp dreieinhalb Stunden, wenn Zu- und Abfluss gleich groß sind.`, richtig: true, erklaerung: "Genau. Der Gesamtzufluss ist mit 3.000 m³ begrenzt, aber entscheidend ist die Bilanz: Solange mehr zu- als abfließt, steigt der Wasserstand. Das Maximum liegt bei z(t) = 300 — zu diesem Zeitpunkt steht noch ein Viertel des Nachlaufs aus (750 m³), aber es fließt bereits mehr ab als zu." },
      { text: "Stimmt nicht: 2.000 + 3.000 = 5.000 m³ — das Becken läuft über.", erklaerung: "Das vergisst den Abfluss: Während das Wasser nachläuft, lässt die Drossel schon ab." },
      { text: "Stimmt nicht: Weil der Zufluss nie ganz aufhört, läuft das Becken irgendwann über.", erklaerung: "Der Zufluss hört nie ganz auf, aber insgesamt kommen nur 3.000 m³ zusammen — und ab t ≈ 3,5 h fließt mehr ab als zu." },
      { text: "Stimmt — aber am vollsten ist das Becken gleich am Anfang, weil dann am meisten zufließt.", erklaerung: "Am Anfang ist der Zufluss am größten, aber das Volumen wächst weiter, solange z(t) > 300 ist. Am vollsten ist das Becken nach knapp dreieinhalb Stunden." },
    ],
  },
  merksatz: `<p>Bestand = Anfangsbestand + Integral der Änderungsrate (Zufluss − Abfluss). Er ist dort am größten, wo die Änderungsrate von + nach − wechselt. Für eine abklingende Rate a · e<sup>−kt</sup> ist der Gesamtzufluss endlich: ${integral("b", "0")} a · e<sup>−kt</sup> dt → ${bruch("a", "k")} für b → ∞.</p>`,
  denkfrage: "Was passiert, wenn zwei Stunden nach dem ersten Unwetter ein zweites kommt?",
  musterantwort: "<p>Das Modell kennt nur einen Regen. Kommt ein zweiter dazu, addieren sich die Zuflussraten — die Reserve von knapp 300 m³ ist dann schnell aufgebraucht. Deshalb bemisst man Rückhaltebecken für Regenereignisse einer bestimmten Stärke und Häufigkeit und lässt bewusst Reserven.</p>",
  knobel: "Wie viel Wasser ist nach 12 Stunden noch im Becken?",
  knobelFelder: [
    {
      id: "rest", label: "V(12) ≈", einheit: "m³", soll: vBecken(12), tol: 2, stellen: 0,
      falsch: [
        { wert: 2000 + 3000 - 300 * 12, id: "ganz", text: "So viel wäre es, wenn schon der ganze Zufluss von 3.000 m³ angekommen wäre. Nach 12 Stunden sind es erst 3.000 · (1 − e<sup>−4,8</sup>) m³." },
        { wert: 2000 + 3000 * (1 - Math.exp(-4.8)), id: "ohneAbfluss", text: "Die Drossel lässt die ganze Zeit 300 m³ pro Stunde ab — in 12 Stunden 3.600 m³. Ziehe den Abfluss noch ab." },
      ],
    },
  ],
  knobelAntwort: `<p>V(12) = 2.000 + 3.000 · (1 − e<sup>−4,8</sup>) − 300 · 12 ≈ ${n(vBecken(12), 0)} m³. (Das Modell gilt nur, solange das Becken nicht leer ist — die Drossel kann nicht mehr ablassen, als drin ist.)</p>`,
  partner: "Erklärt euch gegenseitig, warum das Becken nicht im Moment des größten Zuflusses am vollsten ist. Zeigt die Stelle im Diagramm.",
};

// ---------- 4.2 b: Die Zwölftelregel (LK) ----------

const rate = (t) => (Math.PI / 4) * Math.sin((Math.PI * t) / 6);
const stand = (t) => 1.5 * (1 - Math.cos((Math.PI * t) / 6));
const stunde = (k) => stand(k) - stand(k - 1);
const regelSumme = [0, 1, 3, 6, 9, 11, 12].map((z) => (z * 3) / 12);

const zwoelfter = {
  key: "zwoelfter",
  nr: "4.2 b",
  kapitel: "4.2",
  kurs: "lk",
  icon: "🌊",
  titel: "Die Zwölftelregel im Watt",
  behauptung: "„Zwölftelregel: In der 1. Stunde nach Niedrigwasser steigt das Wasser um 1/12 des Tidenhubs, in der 2. um 2/12, in der 3. und 4. um je 3/12, dann wieder um 2/12 und 1/12.“",
  herkunft: "Merkregel aus einem Segelkurs",
  hintergrund: "<p>An der Nordsee steigt und fällt das Wasser zweimal am Tag; an vielen Orten der deutschen Küste beträgt der Tidenhub rund 3 Meter. Wer im Watt wandert oder mit dem Boot unterwegs ist, muss wissen, wann wie viel Wasser kommt. Wattführer und Segelschulen lehren dafür die <strong>Zwölftelregel</strong> — eine Faustregel, die man im Kopf rechnen kann.</p>",
  modell: `<p>Steiggeschwindigkeit des Wassers in m/h, t Stunden nach Niedrigwasser (Tidenhub 3 m, Hochwasser nach 6 Stunden):</p>
    <p class="formula-block">r(t) = ${bruch("π", "4")} · sin(${bruch("π", "6")} · t), &nbsp; 0 ≤ t ≤ 6</p>`,
  figur: {
    titel: "Wasserstand über Niedrigwasser: Sinusmodell und Zwölftelregel",
    x: { von: 0, bis: 6, schritt: 1, titel: "Stunden nach Niedrigwasser" },
    y: { von: 0, bis: 3, schritt: 0.5, titel: "Wasserstand über NW in m" },
    kurven: [{ f: stand, von: 0, bis: 6, farbe: "blau", rolle: "stand" }],
    punkte: regelSumme.map((y, k) => ({ x: k, y, farbe: "orange", rolle: "regel" })),
    legende: [{ farbe: "blau", text: "Modell: Integral der Steiggeschwindigkeit" }, { farbe: "orange", text: "Zwölftelregel (Summen)" }],
  },
  rueckblick: `<p>Wie integriert man sin(mx)? Und wie gewinnt man aus einer Änderungsrate den Zuwachs in einem Zeitraum? Nachlesen: <a href="${L42}#sec-sinus">4.2, Abschnitt 5</a> und <a href="${L42}#sec-verkettung">Abschnitt 6</a>.</p>`,
  werkzeug: `<ul>
      <li>∫ sin(mt) dt = −${bruch("1", "m")} · cos(mt) + C (<a href="${L42}#sec-verkettung">4.2, Abschnitt 6</a>)</li>
      <li>Anstieg in der k-ten Stunde: ${integral("k", "k − 1")} r(t) dt</li>
      <li>Ein Zwölftel von 3 m sind 0,25 m.</li>
      <li>Taschenrechner auf Bogenmaß (RAD)!</li>
    </ul>`,
  kernfrage: "Entscheidend ist: Um wie viele Zwölftel des Tidenhubs steigt das Wasser im Modell in jeder Stunde?",
  schritte: [
    {
      phase: 2,
      frage: "Prüfe das Modell: Um wie viel steigt das Wasser von Niedrig- bis Hochwasser, also in 6 Stunden?",
      felder: [{
        id: "hub", label: "Anstieg in 6 h:", einheit: "m", soll: 3, tol: 0.005, stellen: 2,
        falsch: [{ wert: 0, id: "ganze-periode", text: "Null kommt heraus, wenn man über 12 Stunden integriert (Flut und Ebbe heben sich auf). Von Niedrig- bis Hochwasser sind es 6 Stunden." }],
      }],
      tipps: [`Stammfunktion: R(t) = −${bruch("π", "4")} · ${bruch("6", "π")} · cos(${bruch("π", "6")}t) = −1,5 · cos(${bruch("π", "6")}t).`, "R(6) − R(0) = −1,5 · cos(π) + 1,5 · cos(0)."],
      loesung: `${integral("6", "0")} r(t) dt = [−1,5 · cos(${bruch("π", "6")}t)] von 0 bis 6 = 1,5 + 1,5 = 3 m — der Tidenhub.`,
    },
    {
      phase: 3,
      frage: "Um wie viel steigt das Wasser in der 1. und in der 2. Stunde?",
      felder: [
        { id: "s1", label: "1. Stunde:", einheit: "m", soll: stunde(1), tol: 0.002, stellen: 3, falsch: [{ wert: 0.25, id: "regel1", text: "0,25 m ist der Wert der Zwölftelregel (1/12 von 3 m). Rechne mit dem Modell: das Integral von 0 bis 1." }] },
        { id: "s2", label: "2. Stunde:", einheit: "m", soll: stunde(2), tol: 0.002, stellen: 3, falsch: [{ wert: 0.5, id: "regel2", text: "0,5 m ist der Wert der Zwölftelregel (2/12 von 3 m). Rechne mit dem Modell: das Integral von 1 bis 2." }] },
      ],
      tipps: ["R(1) − R(0) = −1,5 · cos(π/6) + 1,5.", "R(2) − R(1) = −1,5 · cos(π/3) + 1,5 · cos(π/6)."],
      loesung: `1. Stunde: 1,5 · (1 − cos(π/6)) ≈ ${n(stunde(1), 3)} m; 2. Stunde: 1,5 · (cos(π/6) − cos(π/3)) ≈ ${n(stunde(2), 3)} m.`,
    },
    {
      phase: 3,
      frage: "Um wie viel steigt es in der 3. Stunde?",
      felder: [{ id: "s3", label: "3. Stunde:", einheit: "m", soll: stunde(3), tol: 0.002, stellen: 3, falsch: [] }],
      tipps: ["R(3) − R(2) = −1,5 · cos(π/2) + 1,5 · cos(π/3)."],
      loesung: `1,5 · (cos(π/3) − cos(π/2)) = 1,5 · 0,5 = ${n(stunde(3), 3)} m.`,
    },
    {
      phase: 4,
      kern: true,
      frage: "Rechne in Zwölftel des Tidenhubs um (ein Zwölftel = 0,25 m): Wie viele Zwölftel sind es in der 1. Stunde, wie viele in der 3.?",
      felder: [
        { id: "z1", label: "1. Stunde:", einheit: "Zwölftel", soll: stunde(1) / 0.25, tol: 0.01, stellen: 2, falsch: [{ wert: 1, id: "regel", text: "Ein Zwölftel sagt die Regel. Das Modell liefert weniger: Teile deinen Wert aus Schritt 2 durch 0,25 m." }] },
        { id: "z3", label: "3. Stunde:", einheit: "Zwölftel", soll: stunde(3) / 0.25, tol: 0.01, stellen: 2, falsch: [] },
      ],
      tipps: ["Anstieg in Metern geteilt durch 0,25 m."],
      loesung: `1. Stunde: ${n(stunde(1), 4)}/0,25 ≈ ${n(stunde(1) / 0.25, 2)} Zwölftel; 3. Stunde: 0,75/0,25 = 3 Zwölftel — genau wie in der Regel.`,
      deutung: "Die Regel rundet das Modell auf ganze Zwölftel: 0,8 | 2,2 | 3 | 3 | 2,2 | 0,8 statt 1 | 2 | 3 | 3 | 2 | 1.",
    },
  ],
  urteil: {
    optionen: [
      { text: "Stimmt exakt — in jeder einzelnen Stunde.", erklaerung: `In der 1. und 6. Stunde sind es im Modell nur etwa ${n(stunde(1) / 0.25, 1)} Zwölftel, in der 2. und 5. etwa ${n(stunde(2) / 0.25, 1)}.` },
      { text: "Stimmt nicht: Das Wasser steigt in jeder Stunde um gleich viel, je 2/12.", erklaerung: "Das wäre ein linearer Anstieg. Die Steiggeschwindigkeit r(t) ist aber eine Sinuskurve: am Anfang klein, nach drei Stunden am größten." },
      { text: `Stimmt näherungsweise: In der 3. und 4. Stunde ist sie im Sinusmodell exakt (je 3/12), in den anderen Stunden weicht sie um rund 0,2 Zwölftel ab — und die Summen nach 2, 3 und 4 Stunden stimmen sogar genau.`, richtig: true, erklaerung: "Genau. Das Integral der Sinus-Rate über die einzelnen Stunden liefert 0,8 | 2,2 | 3 | 3 | 2,2 | 0,8 Zwölftel. Die Regel rundet das auf ganze Zwölftel — dabei bleibt die Summe 12 erhalten. Für die Praxis heißt das: In der 3. Stunde steigt das Wasser fast viermal so stark wie in der ersten." },
      { text: "Stimmt nicht: Am schnellsten steigt das Wasser in der ersten Stunde nach Niedrigwasser.", erklaerung: "In der ersten Stunde ist r(t) am kleinsten. Am schnellsten steigt das Wasser nach drei Stunden, bei Halbtide." },
    ],
  },
  merksatz: `<p>∫ sin(mt) dt = −${bruch("1", "m")} · cos(mt) + C (lineare Verkettung rückwärts). Der Zuwachs eines Bestands in einem Zeitraum ist das Integral der Änderungsrate über genau diesen Zeitraum.</p>`,
  denkfrage: "Echte Gezeiten brauchen vom Niedrig- zum Hochwasser gut 6 Stunden, und an vielen Orten ist die Flut kürzer als die Ebbe. Was bedeutet das für die Regel?",
  musterantwort: "<p>Die Zwölftelregel gilt für eine symmetrische Sinus-Tide; mit „Stunde“ ist eigentlich ein Sechstel der Steigdauer gemeint — bei 6 Stunden 12 Minuten also gut 62 Minuten. Wo die Flut kürzer ist als die Ebbe, steigt das Wasser schneller, als die Regel sagt. Wer sicher planen muss, nimmt die Gezeitentafeln des Bundesamts für Seeschifffahrt und Hydrographie.</p>",
  knobel: "Wie schnell steigt das Wasser im schnellsten Moment — in Zentimetern pro Minute?",
  knobelFelder: [
    {
      id: "cmMin", label: "im schnellsten Moment ≈", einheit: "cm pro Minute", soll: ((Math.PI / 4) * 100) / 60, tol: 0.01, stellen: 2,
      falsch: [
        { wert: Math.PI / 4, id: "meterStunde", tol: 0.005, text: "Das ist die Rate in Metern pro Stunde. Gefragt sind Zentimeter pro Minute: mal 100, durch 60." },
        { wert: 1.25, id: "regel", text: "1,25 cm pro Minute steigt das Wasser im Mittel in der schnellsten Stunde (3/12 von 3 m). Im schnellsten Moment ist die Rate etwas größer: r(3) = π/4 m/h." },
      ],
    },
  ],
  knobelAntwort: `<p>r(3) = ${bruch("π", "4")} m/h ≈ ${n(Math.PI / 4, 3)} m/h ≈ ${n((Math.PI / 4) * 100 / 60, 2)} cm pro Minute — eine Handbreit in acht Minuten.</p>`,
  partner: "Vergleicht die blauen und orangen Punkte im Bild. Wo liegt die Regel über dem Modell, wo darunter — und wo genau darauf?",
};

export const FAELLE_4 = [balkon, notbremse, becken, zwoelfter];
