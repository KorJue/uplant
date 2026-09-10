// Schreibt die gesetzte Formelsammlung als PDF.
//
//     node render.js <praefix> <zielpfad relativ zur Projektwurzel>
const { chromium } = require("playwright");
const path = require("path");
const praefix = process.argv[2] || "tf";
const ziel = process.argv[3];
if (!ziel) {
  console.error("Aufruf: node render.js <praefix> <zielpfad>");
  process.exit(1);
}
(async () => {
  const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  const p = await b.newPage();
  await p.goto("file://" + path.resolve(__dirname, `formelsammlung-${praefix}.html`), { waitUntil: "networkidle" });
  await p.pdf({
    path: path.resolve(__dirname, "..", "..", ziel),
    format: "A4", landscape: true, printBackground: true,
    margin: { top: "5.5mm", bottom: "5.5mm", left: "9mm", right: "9mm" },
  });
  await b.close();
  console.log("PDF geschrieben:", ziel);
})();
