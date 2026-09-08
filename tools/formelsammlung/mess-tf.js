// Misst jede Seite und jede Box: Welche Box treibt eine Zeile über die Höhe?
const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  const p = await b.newPage();
  await p.goto("file://" + require("path").resolve(__dirname, "formelsammlung-tf.html"), { waitUntil: "networkidle" });
  await p.emulateMedia({ media: "print" });
  const daten = await p.evaluate(() => [...document.querySelectorAll(".page")].map((s, i) => ({
    seite: i + 1,
    hoehe: s.getBoundingClientRect().height,
    boxen: [...s.querySelectorAll(".box")].map((x) => ({
      titel: (x.querySelector("h2") || {}).textContent || "?",
      hoehe: Math.round(x.getBoundingClientRect().height),
      inhalt: Math.round([...x.children].reduce((a, c) => a + c.getBoundingClientRect().height, 0)),
    })),
  })));
  for (const s of daten) {
    console.log(`--- Seite ${s.seite}: ${s.hoehe.toFixed(1)} px von 752,1`);
    for (const x of s.boxen) console.log(`    ${String(x.hoehe).padStart(4)} (Inhalt ${String(x.inhalt).padStart(4)})  ${x.titel}`);
  }
  await b.close();
})();
