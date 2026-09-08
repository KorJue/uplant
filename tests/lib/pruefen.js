// Zählwerk für Prüfungen: sammelt Treffer und Fehlschläge und gibt am Ende
// einen Bericht aus.
//
// Gleichlautende Meldungen werden zusammengefasst. Ein einziger kaputter
// Generator erzeugt sonst tausend identische Zeilen und verdeckt damit alle
// übrigen Funde.

"use strict";

function neuerBericht(grenze = 60) {
  const rot = new Map();   // Meldung → Anzahl
  let gruen = 0;
  let unterdrueckt = 0;

  function pruefe(bedingung, meldung) {
    if (bedingung) { gruen++; return; }
    if (rot.has(meldung)) rot.set(meldung, rot.get(meldung) + 1);
    else if (rot.size < grenze) rot.set(meldung, 1);
    else unterdrueckt++;
  }

  function nahe(ist, soll, eps, meldung) {
    pruefe(Number.isFinite(ist) && Math.abs(ist - soll) < eps,
      `${meldung}: ${ist} statt ${soll} (±${eps})`);
  }

  function anzahlFehler() {
    let n = unterdrueckt;
    for (const k of rot.values()) n += k;
    return n;
  }

  function abschluss() {
    const fehler = anzahlFehler();
    console.log(`${gruen} Prüfungen bestanden, ${fehler} fehlgeschlagen`);
    for (const [meldung, anzahl] of rot) {
      console.log(`  ✗ ${meldung}${anzahl > 1 ? `  (${anzahl}×)` : ""}`);
    }
    if (unterdrueckt) console.log(`  … ${unterdrueckt} weitere Fehler in nicht mehr gezeigten Meldungen`);
    if (fehler) process.exitCode = 1;
    return fehler === 0;
  }

  return { pruefe, nahe, abschluss, zaehler: () => ({ gruen, rot: anzahlFehler() }) };
}

module.exports = { neuerBericht };
