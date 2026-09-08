// Leuchtdichteabstand zwischen Text und Untergrund.
//
// Farben, die auf hellem Grund gewählt wurden, verschwinden auf dunklem oft
// fast vollständig — besonders Dunkelgrün, Violett und Dunkelrot. Geprüft wird
// deshalb jeder farbige Text gegen den Untergrund, auf dem er wirklich steht.

"use strict";

const SCHRANKE = 45;   // Leuchtdichteabstand in Stufen von 0 bis 255

function leuchtdichte(farbe) {
  const teile = String(farbe).match(/[\d.]+/g);
  if (!teile || teile.length < 3) return null;
  const [r, g, b] = teile.slice(0, 3).map((v) => {
    const c = Number(v) / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Der wirkliche Untergrund eines Elements: der erste Vorfahr mit einer
// deckenden Hintergrundfarbe.
const GRUND_IM_BROWSER = `(el) => {
  let e = el;
  while (e) {
    const f = getComputedStyle(e).backgroundColor;
    if (f && !/rgba\\(0, 0, 0, 0\\)|transparent/.test(f)) return f;
    e = e.parentElement;
  }
  return "rgb(255, 255, 255)";
}`;

async function pruefeKontrast(page, bericht, wo) {
  const proben = await page.evaluate((quelle) => {
    const grundVon = eval(quelle);
    const sammle = (knoten, art) => [...knoten].map((e) => ({
      art,
      farbe: art === "svg" ? getComputedStyle(e).fill : getComputedStyle(e).color,
      grund: grundVon(art === "svg" ? e.closest("svg") || e : e),
      inhalt: (e.textContent || "").trim().slice(0, 28),
    })).filter((p) => p.inhalt.length > 0);
    return [
      ...sammle(document.querySelectorAll("svg text"), "svg"),
      ...sammle(document.querySelectorAll(
        "main table td, main table th, main .aufgabe-prompt, main .quiz-q, main p, main li, main h2, main h3"), "html"),
    ];
  }, GRUND_IM_BROWSER);

  let geprueft = 0;
  for (const p of proben) {
    const lv = leuchtdichte(p.farbe), lg = leuchtdichte(p.grund);
    if (lv === null || lg === null) continue;
    const abstand = Math.abs(lv - lg) * 255;
    geprueft++;
    bericht.pruefe(abstand > SCHRANKE,
      `${wo}: „${p.inhalt}“ hat nur Δ${abstand.toFixed(0)} Leuchtdichte zum Untergrund (nötig > ${SCHRANKE})`);
  }
  bericht.pruefe(geprueft > 10, `${wo}: nur ${geprueft} Textproben für die Kontrastprüfung gefunden`);
}

module.exports = { pruefeKontrast, leuchtdichte, SCHRANKE };
