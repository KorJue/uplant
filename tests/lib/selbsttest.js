// Prüfung der Selbsttests „Ableiten“ und „Aufleiten“ (mathematik/selbsttest.js).
//
// Je Fall wird eine Funktion gewählt (oder eine eigene eingegeben), die Felder werden gefüllt und
// geprüft. Erwartet wird je Feld eine Liste von Textstücken, die im Urteil zu diesem Feld stehen
// müssen — „✓ Richtig“ für die richtige Antwort, der Hinweis für einen typischen Fehler. Die
// richtigen Antworten stammen aus der Prüfung selbst, nicht aus der Seite.

"use strict";

async function pruefeSelbsttest(page, bericht, praefix, faelle) {
  for (const { aufgabe, f, eingaben, erwartet } of faelle) {
    await page.selectOption(`#${praefix}-aufgabe`, aufgabe);
    if (f !== undefined) await page.fill(`#${praefix}-f`, f);
    const ids = await page.locator(`#${praefix} input[type=text]`).evaluateAll((es) => es.map((e) => e.id));
    const felder = ids.filter((id) => id !== `${praefix}-f`);
    for (let i = 0; i < felder.length; i++) await page.fill(`#${felder[i]}`, eingaben[i] ?? "");
    await page.click(`#${praefix}-pruefen`);
    // Je ausgefülltem Feld ein Teil, getrennt durch die Trennlinie.
    const teile = await page.evaluate((p) => {
      const t = document.createElement("div");
      return document.getElementById(`${p}-ergebnis`).innerHTML.split(/<hr class="selbsttest-trenner">/)
        .map((h) => { t.innerHTML = h; return t.textContent.replace(/\s+/g, " "); });
    }, praefix);
    const belegt = eingaben.map((e, i) => (e && e.trim() ? i : -1)).filter((i) => i >= 0);
    const wo = `Selbsttest ${praefix}, Aufgabe ${aufgabe}, Eingabe ${JSON.stringify(eingaben)}`;
    if (!belegt.length) {
      bericht.pruefe(teile.join(" ").includes("Tippe"), `${wo}: leere Eingabe nicht als leer gemeldet`);
      continue;
    }
    bericht.pruefe(teile.length === belegt.length, `${wo}: ${teile.length} Urteile statt ${belegt.length}`);
    belegt.forEach((feld, j) => {
      for (const muster of erwartet[feld] || []) {
        bericht.pruefe((teile[j] || "").includes(muster), `${wo}: im Urteil zu Feld ${feld + 1} fehlt „${muster}“ — „${(teile[j] || "").slice(0, 180)}“`);
      }
    });
  }
}

module.exports = { pruefeSelbsttest };
