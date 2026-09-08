// Schreibweisen, die auf keiner Seite vorkommen dürfen.
//
// Fast alle dieser Muster entstehen, wenn eine negative Zahl ohne Klammer in
// eine Summe gesetzt oder ein Rundungsfehler ungefiltert angezeigt wird. Sie
// sind der zuverlässigste Anzeiger für Fehler in der Zahlenaufbereitung.
//
// Geprüft wird zeilenweise und nicht am Fließtext der ganzen Seite: In einer
// Vorzeichentabelle stehen „+“ und „−“ in getrennten Zellen, und würde man den
// Text der Seite zu einer einzigen Kette zusammenziehen, entstünde daraus ein
// scheinbares „+ −“. innerText trennt Blöcke durch Zeilenumbrüche und
// Tabellenzellen durch Tabulatoren; genau an diesen Stellen wird geschnitten.
// Innerhalb einer Zeile bleiben eingebettete Auszeichnungen zusammen, sodass
// ein echtes „(2,5 + −0,5)“ weiterhin auffällt.

"use strict";

const MUSTER = [
  ["−−", "doppeltes Minuszeichen"],
  ["+ −", "Pluszeichen unmittelbar vor einem Minuszeichen"],
  ["− −", "zwei Minuszeichen hintereinander"],
  ["NaN", "NaN"],
  ["undefined", "undefined"],
  ["Infinity", "Infinity"],
  ["= =", "doppeltes Gleichheitszeichen"],
  ["· ·", "doppelter Malpunkt"],
  ["≈≈", "doppeltes Ungefährzeichen"],
  ["+≈", "Pluszeichen vor einem Ungefährzeichen"],
  ["[object", "ein Objekt statt seines Wertes"],
];

// „−0“ als eigenständige Zahl ist falsch; „−0,5“ ist richtig.
const NULL_MUSTER = /−0(?![,.\d])/;

// Ein Lehrtext nennt falsche Schreibweisen ausdrücklich, um vor ihnen zu
// warnen: „aus −x wird für x = −3 nicht ‚−−3‘, sondern −(−3) = 3.“ Was in
// Anführungszeichen steht, ist ein Zitat und kein Fehler der Seite.
function ohneZitate(zeile) {
  return zeile.replace(/„[^“]*“/g, " ").replace(/“[^”]*”/g, " ").replace(/‚[^‘]*‘/g, " ");
}

async function seitentexte(page) {
  return page.evaluate(() => {
    const roh = document.querySelector("main") ? document.querySelector("main").innerText : document.body.innerText;
    const zeilen = roh.split(/[\n\t]+/).map((z) => z.replace(/\s{2,}/g, " ").trim()).filter(Boolean);
    const svg = [...document.querySelectorAll("svg text")]
      .map((e) => e.textContent.replace(/\s+/g, " ").trim()).filter(Boolean);
    return { zeilen, svg };
  });
}

function pruefeTexte(bericht, wo, texte) {
  const proben = [
    ...texte.zeilen.map((z) => ["Text", z]),
    ...texte.svg.map((z) => ["Zeichnung", z]),
  ];
  const funde = [];
  for (const [herkunft, roh] of proben) {
    const zeile = ohneZitate(roh);
    for (const [muster, name] of MUSTER) {
      if (zeile.includes(muster)) funde.push(`„${muster}“ (${name}) in „${roh.slice(0, 70)}“ (${herkunft})`);
    }
    if (NULL_MUSTER.test(zeile)) funde.push(`„−0“ als eigenständige Zahl in „${roh.slice(0, 70)}“ (${herkunft})`);
  }
  if (funde.length === 0) { bericht.pruefe(true, `${wo}: Schreibweisen in Ordnung`); return; }
  // Der Bericht fasst gleichlautende Meldungen zusammen, deshalb darf hier
  // jede Fundstelle einzeln gemeldet werden.
  for (const f of new Set(funde)) bericht.pruefe(false, `${wo}: ${f}`);
}

async function pruefeNotation(page, bericht, wo) {
  pruefeTexte(bericht, wo, await seitentexte(page));
}

module.exports = { pruefeNotation, pruefeTexte, seitentexte, ohneZitate, MUSTER, NULL_MUSTER };
