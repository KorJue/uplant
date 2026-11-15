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
      // „label span“ sind die Regleranzeigen, „a“ die Verweise im Fließtext. Beide fielen hier
      // früher durch: Die Anzeigen trugen ihre Farbe als style="" ohne Dunkelfassung, die Verweise
      // standen im Standardblau des Browsers — auf dunklem Grund beides kaum lesbar.
      ...sammle(document.querySelectorAll(
        "main table td, main table th, main .aufgabe-prompt, main .quiz-q, main p, main li, main h2, main h3, " +
        "main label span, main a"), "html"),
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

// Farbige Linien einer Zeichnung (Hölzchen, Kanten): gleiche Schranke, gemessen wird die Strichfarbe
// gegen den Untergrund der Zeichnung. Text allein reicht nicht — eine Zählweise, die nur aus
// farbigen Strichen besteht, verschwände sonst unbemerkt im dunklen Grund.
async function pruefeStrichKontrast(page, bericht, wo, selektor) {
  const proben = await page.evaluate(([quelle, sel]) => {
    const grundVon = eval(quelle);
    return [...document.querySelectorAll(sel)].map((e) => ({
      farbe: getComputedStyle(e).stroke,
      grund: grundVon(e.closest("svg") || e),
      name: e.getAttribute("class") || e.tagName,
    }));
  }, [GRUND_IM_BROWSER, selektor]);
  const schon = new Set();
  for (const p of proben) {
    const lv = leuchtdichte(p.farbe), lg = leuchtdichte(p.grund);
    if (lv === null || lg === null) continue;
    const abstand = Math.abs(lv - lg) * 255;
    const schluessel = `${p.name}|${p.farbe}|${p.grund}`;
    if (schon.has(schluessel)) continue;
    schon.add(schluessel);
    bericht.pruefe(abstand > SCHRANKE,
      `${wo}: Linie „${p.name}“ (${p.farbe}) hat nur Δ${abstand.toFixed(0)} Leuchtdichte zum Untergrund (nötig > ${SCHRANKE})`);
  }
  bericht.pruefe(proben.length > 0, `${wo}: keine Linien für „${selektor}“ gefunden`);
}

// Beschriftungen, die AUF einer farbigen Fläche einer Zeichnung stehen (ein Name in einem Rechteck):
// gemessen wird gegen die Fläche darunter, nicht gegen den Bildhintergrund. Eine halb durchsichtige
// Fläche wird mit dem Hintergrund gemischt. Steht unter dem Text keine Fläche, zählt der Hintergrund.
async function pruefeTextAufFlaeche(page, bericht, wo, selektor) {
  const proben = await page.evaluate(([quelle, sel]) => {
    const grundVon = eval(quelle);
    const rgb = (f) => (String(f).match(/[\d.]+/g) || []).slice(0, 3).map(Number);
    return [...document.querySelectorAll(sel)].filter((t) => (t.textContent || "").trim()).map((t) => {
      t.scrollIntoView({ block: "center" });
      const k = t.getBoundingClientRect();
      const svg = t.closest("svg");
      const grund = rgb(grundVon(svg));
      const unter = document.elementsFromPoint(k.x + k.width / 2, k.y + k.height / 2)
        .find((e) => e !== t && e.closest("svg") === svg && /^(rect|polygon|path|circle)$/.test(e.tagName) && getComputedStyle(e).fill !== "none");
      let flaeche = grund;
      if (unter) {
        const cs = getComputedStyle(unter);
        const op = Number(cs.fillOpacity) * Number(cs.opacity);
        flaeche = rgb(cs.fill).map((c, i) => op * c + (1 - op) * grund[i]);
      }
      return { text: t.textContent.trim(), farbe: getComputedStyle(t).fill, flaeche: `rgb(${flaeche.map((c) => c.toFixed(0)).join(", ")})` };
    });
  }, [GRUND_IM_BROWSER, selektor]);
  for (const p of proben) {
    const abstand = Math.abs(leuchtdichte(p.farbe) - leuchtdichte(p.flaeche)) * 255;
    bericht.pruefe(abstand > SCHRANKE, `${wo}: „${p.text}“ (${p.farbe}) hat auf seiner Fläche (${p.flaeche}) nur Δ${abstand.toFixed(0)} Leuchtdichte (nötig > ${SCHRANKE})`);
  }
  bericht.pruefe(proben.length > 0, `${wo}: keine Beschriftungen für „${selektor}“ gefunden`);
}

module.exports = { pruefeKontrast, pruefeStrichKontrast, pruefeTextAufFlaeche, leuchtdichte, SCHRANKE };
