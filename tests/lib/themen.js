// Findet alle Lernpfad-Seiten des Bereichs „Grundwissen Klasse 5-10“.
//
// Die Liste kommt aus dem Dateisystem und nicht aus einer gepflegten
// Aufzählung: Ein neues Thema wird damit automatisch mitgeprüft, und es kann
// nicht passieren, dass ein Thema stillschweigend ungeprüft bleibt.

"use strict";

const fs = require("fs");
const path = require("path");

const WURZEL = path.resolve(__dirname, "..", "..");
const BEREICH = "mathematik/grundwissen-5-10";

function alleThemen() {
  const themen = [];
  const basis = path.join(WURZEL, BEREICH);
  for (const kapitel of fs.readdirSync(basis).sort()) {
    const kPfad = path.join(basis, kapitel);
    if (!fs.statSync(kPfad).isDirectory()) continue;
    for (const thema of fs.readdirSync(kPfad).sort()) {
      const tPfad = path.join(kPfad, thema);
      if (!fs.statSync(tPfad).isDirectory()) continue;
      if (!fs.existsSync(path.join(tPfad, "index.html"))) continue;
      themen.push({
        kapitel,
        thema,
        name: `${kapitel}/${thema}`,
        pfad: `/${BEREICH}/${kapitel}/${thema}/index.html`,
        verzeichnis: tPfad,
      });
    }
  }
  return themen;
}

// Jede HTML-Datei des Bereichs, also auch die Menüseiten.
function alleSeiten(verzeichnis = path.join(WURZEL, BEREICH), gesammelt = []) {
  for (const e of fs.readdirSync(verzeichnis, { withFileTypes: true })) {
    const voll = path.join(verzeichnis, e.name);
    if (e.isDirectory()) alleSeiten(voll, gesammelt);
    else if (e.name.endsWith(".html")) gesammelt.push("/" + path.relative(WURZEL, voll));
  }
  return gesammelt;
}

module.exports = { alleThemen, alleSeiten, WURZEL, BEREICH };
