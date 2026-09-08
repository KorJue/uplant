const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  const p = await b.newPage();
  await p.goto("file://" + require("path").resolve(__dirname, "formelsammlung-tf.html"), { waitUntil: "networkidle" });
  await p.pdf({
    path: require("path").resolve(__dirname, "..", "..", "mathematik/grundwissen-5-10/04-gleichungen-zuordnungen-funktionen/12-trigonometrische-funktionen/formelsammlung.pdf"),
    format: "A4", landscape: true, printBackground: true,
    margin: { top: "5.5mm", bottom: "5.5mm", left: "9mm", right: "9mm" },
  });
  await b.close();
  console.log("PDF geschrieben");
})();
