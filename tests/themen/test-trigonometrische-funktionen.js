// Prüft den Lernpfad "Trigonometrische Funktionen" (Kapitel 4, Thema 12).
//
// Geprüft wird nicht, ob die Seite lädt, sondern ob sie die Wahrheit sagt:
// Jede angezeigte Zahl wird unabhängig nachgerechnet, jede Zeichnung wird aus
// dem gezeichneten SVG zurückgelesen, und jede Übungsaufgabe wird mit der
// richtigen und mit jeder vorgesehenen falschen Antwort durchgespielt.

const { neuerBericht } = require("../lib/pruefen");
const { starteBrowser, neueSeite, oeffne, HOST } = require("../lib/seite");
const { pruefeNotation } = require("../lib/notation");
const { pruefeKontrast } = require("../lib/kontrast");

const BASIS = HOST + "/mathematik/grundwissen-5-10/04-gleichungen-zuordnungen-funktionen/12-trigonometrische-funktionen/index.html";

const bericht = neuerBericht();
const { pruefe, nahe } = bericht;

const BOGEN = Math.PI / 180;
function normW(g) { return ((g % 360) + 360) % 360; }
function sinG(g) { const r = normW(g); return r % 90 === 0 ? [0, 1, 0, -1][r / 90] : Math.sin(g * BOGEN); }
function cosG(g) { const r = normW(g); return r % 90 === 0 ? [1, 0, -1, 0][r / 90] : Math.cos(g * BOGEN); }
function quadrant(g) { const r = normW(g); return r % 90 === 0 ? 0 : Math.floor(r / 90) + 1; }
function ggT(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { const h = a % b; a = b; b = h; } return a; }
// Deutsche Zahl aus einem Anzeigetext lesen (erste Zahl, Minus als U+2212).
function zahl(t) {
  const m = String(t).replace(/−/g, "-").replace(/\./g, "").match(/-?\d+(?:,\d+)?/);
  return m ? parseFloat(m[0].replace(",", ".")) : NaN;
}

// ---------- Seitenseitige Messhelfer ----------
// Diese Funktionen werden einmal auf window gelegt und danach aus echten
// Pfeilfunktionen heraus aufgerufen: Diese Playwright-Fassung behandelt ein
// String-pageFunction als Ausdruck, nicht als Funktion.
const MESSHELFER = `
window.tfSvg = (sel) => document.querySelector(sel + " svg");

// Das Koordinatensystem aus der Zeichnung zurücklesen: Der Maßstab kommt aus
// zwei Achsenbeschriftungen, der Ursprung aus den Achsenlinien selbst — die
// Beschriftungen tragen einen Grundlinien-Versatz von wenigen Pixeln.
window.tfSystem = (sel) => {
  const svg = window.tfSvg(sel);
  const linien = [...svg.querySelectorAll("line.tf-achse")];
  const waag = linien.find((l) => Math.abs(+l.getAttribute("y1") - +l.getAttribute("y2")) < 0.01);
  const senk = linien.find((l) => Math.abs(+l.getAttribute("x1") - +l.getAttribute("x2")) < 0.01);
  const zahlText = (t) => {
    const s = t.textContent.replace(/\\u00b0/g, "").replace(/\\u2212/g, "-").replace(/\\./g, "");
    return /^-?\\d+(,\\d+)?$/.test(s) ? parseFloat(s.replace(",", ".")) : null;
  };
  const texte = [...svg.querySelectorAll("text.tf-achsentext")]
    .map((t) => ({ x: +t.getAttribute("x"), y: +t.getAttribute("y"), v: zahlText(t) }))
    .filter((t) => t.v !== null);
  const untenY = Math.max(...texte.map((t) => t.y));
  const xT = texte.filter((t) => Math.abs(t.y - untenY) < 0.01).sort((a, b) => a.x - b.x);
  const yT = texte.filter((t) => Math.abs(t.y - untenY) >= 0.01).sort((a, b) => a.y - b.y);
  const sx = (xT[xT.length - 1].x - xT[0].x) / (xT[xT.length - 1].v - xT[0].v);
  const sy = yT.length >= 2 ? (yT[0].y - yT[yT.length - 1].y) / (yT[yT.length - 1].v - yT[0].v) : null;
  return {
    x0: +senk.getAttribute("x1"), y0: +waag.getAttribute("y1"), sx, sy,
    xWerte: xT.map((t) => t.v), yWerte: yT.map((t) => t.v),
  };
};

// Alle Punkte eines gezeichneten Pfades in Sachkoordinaten.
window.tfKurve = (sel, klasse) => {
  const svg = window.tfSvg(sel);
  const sys = window.tfSystem(sel);
  const p = [...svg.querySelectorAll("path.tf-kurve")].find((e) => e.getAttribute("class").trim() === klasse.trim());
  if (!p) return null;
  return p.getAttribute("d").split(/[ML]/).map((s) => s.trim()).filter(Boolean).map((s) => {
    const [a, b] = s.split(/\\s+/).map(Number);
    return [(a - sys.x0) / sys.sx, (sys.y0 - b) / sys.sy];
  });
};

window.tfKreise = (sel, klasse) => {
  const svg = window.tfSvg(sel);
  const sys = window.tfSystem(sel);
  return [...svg.querySelectorAll("circle.tf-punkt")]
    .filter((c) => c.getAttribute("class").trim() === ("tf-punkt " + klasse).trim())
    .map((c) => [(+c.getAttribute("cx") - sys.x0) / sys.sx, (sys.y0 - +c.getAttribute("cy")) / sys.sy]);
};

window.tfTexte = (sel) => [...window.tfSvg(sel).querySelectorAll("text")].map((t) => t.textContent);

// Länge einer gezeichneten Strecke in Bildpunkten.
window.tfStrecke = (sel, klasse) => {
  const l = window.tfSvg(sel).querySelector("line." + klasse);
  if (!l) return null;
  return Math.hypot(+l.getAttribute("x2") - +l.getAttribute("x1"), +l.getAttribute("y2") - +l.getAttribute("y1"));
};
`;

async function regler(page, id, wert) {
  await page.evaluate(([i, w]) => {
    const e = document.getElementById(i);
    e.value = String(w);
    e.dispatchEvent(new Event("input", { bubbles: true }));
  }, [id, wert]);
}
async function text(page, sel) { return (await page.locator(sel).innerText()).replace(/\s+/g, " ").trim(); }

// ================= Abschnitt 1: Einheitskreis =================

async function testEinheitskreis(page) {
  for (let a = 0; a <= 360; a += 5) {
    await regler(page, "ek-a", a);
    const s = sinG(a), c = cosG(a), q = quadrant(a);
    const karten = await page.evaluate(() => [...document.querySelectorAll("#ek-karten .tf-karte .wert")].map((e) => e.textContent));
    nahe(zahl(karten[1]), c, 5e-5, `EK ${a}°: cos-Karte`);
    nahe(zahl(karten[2]), s, 5e-5, `EK ${a}°: sin-Karte`);
    pruefe(karten[3] === (q === 0 ? "auf einer Achse" : ["—", "I", "II", "III", "IV"][q]),
      `EK ${a}°: Quadrantenkarte „${karten[3]}“ statt Quadrant ${q}`);
    pruefe(karten[4] === "1", `EK ${a}°: sin²+cos² zeigt „${karten[4]}“ statt 1`);

    // Der gezeichnete Punkt muss wirklich auf (cos α | sin α) liegen.
    const geo = await page.evaluate(() => {
      const svg = document.querySelector("#ek-mount svg");
      const kreise = [...svg.querySelectorAll("circle")];
      const rand = kreise.find((k) => +k.getAttribute("r") > 50);
      const p = svg.querySelector("circle.tf-punkt.marke");
      const kos = svg.querySelector("line.tf-kosinus");
      const sin = svg.querySelector("line.tf-sinus");
      const laenge = (l) => l ? Math.hypot(+l.getAttribute("x2") - +l.getAttribute("x1"), +l.getAttribute("y2") - +l.getAttribute("y1")) : null;
      return {
        cx: +rand.getAttribute("cx"), cy: +rand.getAttribute("cy"), r: +rand.getAttribute("r"),
        px: +p.getAttribute("cx"), py: +p.getAttribute("cy"),
        kos: laenge(kos), sin: laenge(sin),
        bogen: !!svg.querySelector(".tf-winkelbogen"),
        aktiv: [...svg.querySelectorAll("path.tf-quadrant.aktiv")].length,
      };
    });
    nahe((geo.px - geo.cx) / geo.r, c, 2e-3, `EK ${a}°: x-Koordinate des gezeichneten Punktes`);
    nahe((geo.cy - geo.py) / geo.r, s, 2e-3, `EK ${a}°: y-Koordinate des gezeichneten Punktes`);
    if (Math.abs(c) > 1e-9) nahe(geo.kos / geo.r, Math.abs(c), 2e-3, `EK ${a}°: Länge der Kosinusstrecke`);
    else pruefe(geo.kos === null, `EK ${a}°: Kosinusstrecke der Länge 0 gezeichnet`);
    if (Math.abs(s) > 1e-9) nahe(geo.sin / geo.r, Math.abs(s), 2e-3, `EK ${a}°: Länge der Sinusstrecke`);
    else pruefe(geo.sin === null, `EK ${a}°: Sinusstrecke der Länge 0 gezeichnet`);
    pruefe(geo.bogen === (a > 0), `EK ${a}°: Winkelbogen ${geo.bogen ? "gezeichnet" : "fehlt"}`);
    pruefe(geo.aktiv === (q === 0 ? 0 : 1), `EK ${a}°: ${geo.aktiv} hervorgehobene Quadranten statt ${q === 0 ? 0 : 1}`);

    // Die hervorgehobene Tabellenspalte muss der Quadrant sein.
    const aktivSpalten = await page.evaluate(() => [...document.querySelectorAll("#ek-tabelle td.aktiv")].length);
    pruefe(aktivSpalten === (q === 0 ? 0 : 3), `EK ${a}°: ${aktivSpalten} hervorgehobene Zellen statt ${q === 0 ? 0 : 3}`);

    // Der Bezugswinkel führt auf denselben Betrag zurück.
    const bilanz = await text(page, "#ek-bilanz");
    if (q !== 0) {
      const bez = normW(a) <= 90 ? normW(a) : normW(a) <= 180 ? 180 - normW(a) : normW(a) <= 270 ? normW(a) - 180 : 360 - normW(a);
      pruefe(bilanz.includes(`von ${a}° ist ${bez}°`), `EK ${a}°: Bezugswinkel ${bez}° fehlt in der Bilanz`);
    }
  }
  await regler(page, "ek-a", 35);
}

// ================= Abschnitt 2: Bogenmaß =================

async function testBogenmass(page) {
  for (let a = 0; a <= 360; a += 15) {
    await regler(page, "bm-a", a);
    const x = a * BOGEN;
    const karten = await page.evaluate(() => [...document.querySelectorAll("#bm-karten .tf-karte .wert")].map((e) => e.textContent.replace(/\s+/g, "")));
    nahe(zahl(karten[0]), a, 1e-9, `BM ${a}°: Gradmaßkarte`);
    nahe(zahl(karten[2]), x, 5e-5, `BM ${a}°: Bogenmaßkarte`);
    nahe(zahl(karten[3]), sinG(a), 5e-5, `BM ${a}°: sin-Karte`);
    nahe(zahl(karten[4]), cosG(a), 5e-5, `BM ${a}°: cos-Karte`);

    // Der Bruch muss vollständig gekürzt sein und a : 180 darstellen.
    const bruch = await page.evaluate(() => {
      const k = document.querySelectorAll("#bm-karten .tf-karte")[1].querySelector(".tf-bruch");
      if (!k) return null;
      return [k.querySelector(".oben").textContent, k.querySelector(".unten").textContent];
    });
    if (a === 0) pruefe(bruch === null, `BM 0°: unerwarteter Bruch`);
    else {
      const t = ggT(a, 180), z = a / t, n = 180 / t;
      if (n === 1) pruefe(bruch === null, `BM ${a}°: Bruch statt ganzem Vielfachen von π`);
      else {
        pruefe(bruch !== null, `BM ${a}°: Bruch fehlt`);
        if (bruch) {
          pruefe(bruch[0] === (z === 1 ? "π" : `${z}π`), `BM ${a}°: Zähler „${bruch[0]}“ statt ${z}π`);
          pruefe(zahl(bruch[1]) === n, `BM ${a}°: Nenner „${bruch[1]}“ statt ${n}`);
          pruefe(ggT(z, n) === 1, `BM ${a}°: Bruch ${z}/${n} ist nicht gekürzt`);
        }
      }
    }

    // Die abgetragene Strecke ist im Bild genau so lang wie der Bogen.
    const mass = await page.evaluate(() => {
      const svg = document.querySelector("#bm-mount svg");
      const kreis = svg.querySelector("circle.tf-kreis");
      const s = svg.querySelector("line.tf-strecke");
      return {
        r: +kreis.getAttribute("r"),
        laenge: Math.abs(+s.getAttribute("x2") - +s.getAttribute("x1")),
        vollkreis: !!svg.querySelector("circle.tf-bogen"),
        bogenPfad: !!svg.querySelector("path.tf-bogen"),
      };
    });
    nahe(mass.laenge / mass.r, x, 1e-3, `BM ${a}°: Länge der abgewickelten Strecke (in Radien)`);
    pruefe(mass.bogenPfad === (a > 0 && a < 360), `BM ${a}°: Bogen als Pfad ${mass.bogenPfad ? "vorhanden" : "fehlt"}`);
    pruefe(mass.vollkreis === (a >= 360), `BM ${a}°: Vollkreisbogen ${mass.vollkreis ? "vorhanden" : "fehlt"}`);

    // Die Probe muss auf den Ausgangswinkel zurückführen.
    const schritte = await text(page, "#bm-schritte");
    pruefe(schritte.includes(`${a}°`), `BM ${a}°: Ausgangswinkel fehlt im Protokoll`);
  }
  await regler(page, "bm-a", 60);
}

// ================= Abschnitt 3: Sinus- und Kosinuskurve =================

async function testKurven(page) {
  for (const kos of [false, true]) {
    await page.evaluate((an) => {
      const e = document.getElementById("ku-kos");
      e.checked = an;
      e.dispatchEvent(new Event("change", { bubbles: true }));
    }, kos);
    for (let x0 = -90; x0 <= 450; x0 += 15) {
      await regler(page, "ku-x", x0);
      const s = sinG(x0), c = cosG(x0);
      const karten = await page.evaluate(() => [...document.querySelectorAll("#ku-karten .tf-karte .wert")].map((e) => e.textContent));
      nahe(zahl(karten[1]), s, 5e-5, `KU ${x0}°: sin-Karte`);
      nahe(zahl(karten[2]), c, 5e-5, `KU ${x0}°: cos-Karte`);
      nahe(zahl(karten[3]), sinG(-x0), 5e-5, `KU ${x0}°: sin(−x)-Karte`);
      nahe(zahl(karten[4]), cosG(-x0), 5e-5, `KU ${x0}°: cos(−x)-Karte`);
      // Die Symmetrien müssen als Zahlen stimmen, nicht nur als Behauptung.
      nahe(zahl(karten[3]), -s, 5e-5, `KU ${x0}°: sin(−x) ist nicht −sin x`);
      nahe(zahl(karten[4]), c, 5e-5, `KU ${x0}°: cos(−x) ist nicht cos x`);

      const punkte = await page.evaluate(() => window.tfKreise("#ku-mount", "wert"));
      pruefe(punkte.some((p) => Math.abs(p[0] - x0) < 1.5 && Math.abs(p[1] - s) < 0.02),
        `KU ${x0}°: kein gezeichneter Punkt bei (${x0} | ${s.toFixed(3)})`);
      // Feste Marken dürfen nicht doppelt unter dem beweglichen Punkt liegen.
      const auf = punkte.filter((p) => Math.abs(p[0] - x0) < 1.5).length;
      pruefe(auf === 1, `KU ${x0}°: ${auf} Punkte an derselben Stelle`);

      const kurve = await page.evaluate(() => window.tfKurve("#ku-mount", "tf-kurve"));
      for (const [px, py] of kurve.filter((_, i) => i % 40 === 0)) {
        nahe(py, sinG(px), 0.02, `KU: Sinuskurve bei x = ${px.toFixed(1)}°`);
      }
      const kosKurve = await page.evaluate(() => window.tfKurve("#ku-mount", "tf-kurve kos"));
      pruefe(!!kosKurve === kos, `KU ${x0}°: Kosinuskurve ${kosKurve ? "gezeichnet" : "fehlt"} bei Schalter ${kos}`);
      if (kosKurve) {
        for (const [px, py] of kosKurve.filter((_, i) => i % 40 === 0)) {
          nahe(py, cosG(px), 0.02, `KU: Kosinuskurve bei x = ${px.toFixed(1)}°`);
        }
      }
    }
  }
  await page.evaluate(() => {
    const e = document.getElementById("ku-kos");
    e.checked = false;
    e.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await regler(page, "ku-x", 60);

  // Die Tabelle muss eine volle Periode korrekt wiedergeben.
  const tab = await page.evaluate(() => [...document.querySelectorAll("#ku-tabelle tr")].map((r) => [...r.children].map((c) => c.textContent)));
  for (let i = 1; i < tab[0].length; i++) {
    const w = zahl(tab[0][i]);
    nahe(zahl(tab[1][i]), sinG(w), 0.005, `KU-Tabelle sin ${w}°`);
    nahe(zahl(tab[2][i]), cosG(w), 0.005, `KU-Tabelle cos ${w}°`);
  }
}

// ================= Abschnitt 4: Amplitude und Periode =================

async function testAmplitude(page) {
  for (let aRoh = -30; aRoh <= 30; aRoh += 5) {
    if (aRoh === 0) continue;
    for (let bRoh = 5; bRoh <= 40; bRoh += 5) {
      await regler(page, "ap-a", aRoh);
      await regler(page, "ap-b", bRoh);
      const a = aRoh / 10, b = bRoh / 10, p = 360 / b;
      // Der Regler darf nie einen anderen Wert anzeigen als den gerechneten.
      const gezeigt = await page.evaluate(() => [
        Number(document.getElementById("ap-a").value),
        document.getElementById("ap-a-anzeige").textContent,
        document.getElementById("ap-b-anzeige").textContent,
      ]);
      pruefe(gezeigt[0] === aRoh, `AP: Regler a steht auf ${gezeigt[0]} statt ${aRoh}`);
      nahe(zahl(gezeigt[1]), a, 1e-9, `AP a=${a}: Anzeige des Reglers`);
      nahe(zahl(gezeigt[2]), b, 1e-9, `AP b=${b}: Anzeige des Reglers`);

      const karten = await page.evaluate(() => [...document.querySelectorAll("#ap-karten .tf-karte .wert")].map((e) => e.textContent));
      nahe(zahl(karten[0]), a, 1e-9, `AP a=${a},b=${b}: Karte Faktor a`);
      nahe(zahl(karten[1]), Math.abs(a), 1e-9, `AP a=${a},b=${b}: Karte Amplitude`);
      nahe(zahl(karten[2]), b, 1e-9, `AP a=${a},b=${b}: Karte Faktor b`);
      nahe(zahl(karten[3]), Math.round(p * 10) / 10, 0.06, `AP a=${a},b=${b}: Karte Periode`);
      nahe(zahl(karten[4]), Math.round(720 / p * 100) / 100, 0.006, `AP a=${a},b=${b}: Karte Schwingungen`);

      const kurve = await page.evaluate(() => window.tfKurve("#ap-mount", "tf-kurve"));
      let maxY = -Infinity, minY = Infinity;
      for (const [px, py] of kurve) {
        maxY = Math.max(maxY, py); minY = Math.min(minY, py);
      }
      for (const [px, py] of kurve.filter((_, i) => i % 47 === 0)) {
        nahe(py, a * sinG(b * px), Math.abs(a) * 0.03 + 0.02, `AP a=${a},b=${b}: Kurvenwert bei x = ${px.toFixed(1)}°`);
      }
      nahe(maxY, Math.abs(a), Math.abs(a) * 0.03 + 0.02, `AP a=${a},b=${b}: höchster gezeichneter Wert`);
      nahe(minY, -Math.abs(a), Math.abs(a) * 0.03 + 0.02, `AP a=${a},b=${b}: tiefster gezeichneter Wert`);

      // Die gezeichneten Nullstellen liegen bei Vielfachen der halben Periode.
      const nullstellen = await page.evaluate(() => window.tfKreise("#ap-mount", "zeit"));
      for (const [nx, ny] of nullstellen) {
        nahe(ny, 0, 0.03, `AP a=${a},b=${b}: Marke nicht auf der x-Achse`);
        nahe(Math.abs(nx / (p / 2) - Math.round(nx / (p / 2))), 0, 0.02,
          `AP a=${a},b=${b}: Marke bei ${nx.toFixed(1)}° ist kein Vielfaches von ${(p / 2).toFixed(1)}°`);
      }
      pruefe(nullstellen.length === Math.floor(720 / (p / 2)) + 1,
        `AP a=${a},b=${b}: ${nullstellen.length} Nullstellenmarken statt ${Math.floor(720 / (p / 2)) + 1}`);
    }
  }
  // Der verbotene Wert a = 0 muss übersprungen werden, und zwar so, dass die
  // Anzeige weiter zum Reglerwert passt.
  for (const von of [5, -5]) {
    await regler(page, "ap-a", von);
    await regler(page, "ap-a", 0);
    const st = await page.evaluate(() => [
      Number(document.getElementById("ap-a").value),
      document.getElementById("ap-a-anzeige").textContent,
    ]);
    pruefe(st[0] !== 0, `AP: Regler bleibt auf dem verbotenen Wert a = 0 stehen`);
    pruefe(st[0] % 5 === 0, `AP: Sprung auf ${st[0]} liegt neben dem Raster von 5`);
    nahe(zahl(st[1]), st[0] / 10, 1e-9, `AP: Anzeige passt nach dem Sprung nicht zum Reglerwert`);
  }
  await regler(page, "ap-a", 20);
  await regler(page, "ap-b", 10);
}

// ================= Abschnitt 5: Allgemeine Sinusfunktion =================

async function testVerschiebung(page) {
  const faelle = [];
  for (const aR of [5, 15, 30]) for (const bR of [5, 10, 20, 30]) for (const cR of [-180, -45, 0, 45, 180]) for (const dR of [-20, 0, 10, 40]) faelle.push([aR, bR, cR, dR]);
  for (const [aR, bR, cR, dR] of faelle) {
    await regler(page, "vs-a", aR);
    await regler(page, "vs-b", bR);
    await regler(page, "vs-c", cR);
    await regler(page, "vs-d", dR);
    const a = aR / 10, b = bR / 10, c = cR, d = dR / 10, p = 360 / b;
    const karten = await page.evaluate(() => [...document.querySelectorAll("#vs-karten .tf-karte .wert")].map((e) => e.textContent));
    nahe(zahl(karten[0]), a, 1e-9, `VS ${aR}/${bR}/${cR}/${dR}: Karte Amplitude`);
    nahe(zahl(karten[1]), Math.round(p * 10) / 10, 0.06, `VS: Karte Periode`);
    nahe(zahl(karten[2]), c, 1e-9, `VS: Karte Verschiebung`);
    nahe(zahl(karten[3]), d, 1e-9, `VS: Karte Mittellinie`);

    const kurve = await page.evaluate(() => window.tfKurve("#vs-mount", "tf-kurve"));
    for (const [px, py] of kurve.filter((_, i) => i % 53 === 0)) {
      nahe(py, a * sinG(b * (px - c)) + d, a * 0.04 + 0.03, `VS ${aR}/${bR}/${cR}/${dR}: Kurvenwert bei x = ${px.toFixed(1)}°`);
    }
    // Der Marker bei x = c muss wirklich auf der Mittellinie sitzen.
    const marke = await page.evaluate(() => window.tfKreise("#vs-mount", "marke"));
    pruefe(marke.length === 1, `VS: ${marke.length} c-Marken`);
    if (marke.length === 1) {
      nahe(marke[0][0], c, 1.5, `VS ${cR}: c-Marke an falscher Stelle`);
      nahe(marke[0][1], d, 0.05, `VS ${dR}: c-Marke nicht auf der Mittellinie`);
    }
    // Die Extrempunkte liegen eine Viertel- bzw. Dreiviertelperiode nach c.
    const extrem = await page.evaluate(() => window.tfKreise("#vs-mount", "zeit"));
    for (const [ex, ey] of extrem) {
      const istHoch = Math.abs(ey - (d + a)) < Math.abs(ey - (d - a));
      const soll = istHoch ? c + p / 4 : c + 3 * p / 4;
      nahe(ey, istHoch ? d + a : d - a, 0.06, `VS ${aR}/${dR}: Extremwert`);
      nahe(ex, soll, 2, `VS ${cR}/${bR}: Lage des ${istHoch ? "Hoch" : "Tief"}punkts`);
    }
    // Die Klammerregel muss zum aktuellen b passen.
    const bilanz = await text(page, "#vs-bilanz");
    if (b === 1) pruefe(bilanz.includes("Weil b = 1 ist"), `VS b=1: Hinweis zur überflüssigen Klammer fehlt`);
    else pruefe(bilanz.includes("Achtung bei der Klammer"), `VS b=${b}: Klammerhinweis fehlt`);
  }
  await regler(page, "vs-a", 15);
  await regler(page, "vs-b", 10);
  await regler(page, "vs-c", 45);
  await regler(page, "vs-d", 10);
}

// ================= Abschnitt 6: Periodische Vorgänge =================

async function testAnwendungen(page) {
  for (let typ = 0; typ < 3; typ++) {
    await page.locator(`#an-schalter button:nth-child(${typ + 1})`).click();
    for (let runde = 0; runde < 12; runde++) {
      await page.locator("#an-neu").click();
      await page.locator("#an-alle").click();
      const schritte = await text(page, "#an-schritte");
      const gl = await text(page, "#an-gleichung");
      const bilanz = await text(page, "#an-bilanz");
      // a, b, c, d aus der Gleichung lesen und gegen den Sachtext prüfen.
      const m = gl.replace(/−/g, "-").match(/f\(t\) = ([\d.,-]+) · sin\(([\d.,-]+) · \(t ([+-]) ([\d.,-]+)\)\) \+ ([\d.,-]+)/);
      pruefe(!!m, `AN Typ ${typ}: Gleichung nicht lesbar: „${gl}“`);
      if (!m) continue;
      const a = zahl(m[1]), c = (m[3] === "-" ? 1 : -1) * zahl(m[4]), d = zahl(m[5]);
      // Die Periode kommt aus dem Protokoll, nicht aus dem angezeigten b: Dieses
      // ist auf drei Stellen gerundet (365 Tage ergeben b = 0,986), und daraus
      // zurückgerechnet läge die Periode um einen Zehntel Tag daneben.
      const mp = schritte.match(/p = ([\d.,]+) (?:s|h|Tage)/);
      pruefe(!!mp, `AN Typ ${typ}: Periode nicht im Protokoll`);
      if (!mp) continue;
      const p = zahl(mp[1]), b = 360 / p;
      // Hoch- und Tiefwert aus der abgelesenen Gleichung
      const hoch = d + a, tief = d - a;
      pruefe(a > 0, `AN Typ ${typ}: Amplitude ${a} ist nicht positiv`);
      pruefe(d > 0, `AN Typ ${typ}: Mittellinie ${d} ist nicht positiv`);
      // Das Maximum liegt eine Viertelperiode nach c — das behauptet die Bilanz.
      const mHoch = bilanz.replace(/−/g, "-").match(/c \+ p : 4 [≈=] ([\d.,-]+)/);
      pruefe(!!mHoch, `AN Typ ${typ}: Höchstwertzeit fehlt in der Bilanz`);
      if (mHoch) nahe(zahl(mHoch[1]), Math.round((c + p / 4) * 100) / 100, 0.011, `AN Typ ${typ}: Zeit des Höchstwerts`);
      // Die gezeichnete Kurve muss der Gleichung folgen.
      const kurve = await page.evaluate(() => window.tfKurve("#an-mount", "tf-kurve"));
      for (const [px, py] of kurve.filter((_, i) => i % 61 === 0)) {
        nahe(py, a * sinG(b * (px - c)) + d, a * 0.05 + Math.abs(d) * 0.01 + 0.05,
          `AN Typ ${typ}: Kurvenwert bei ${px.toFixed(1)}`);
      }
      // Die Probe muss den Höchstwert treffen.
      const mProbe = bilanz.replace(/−/g, "-").match(/[≈=] ([\d.,-]+) (?:m|h) — und das ist genau der größte Wert ([\d.,-]+)/);
      pruefe(!!mProbe, `AN Typ ${typ}: Probezeile fehlt`);
      if (mProbe) {
        nahe(zahl(mProbe[1]), hoch, 0.011, `AN Typ ${typ}: Probewert trifft den Höchstwert nicht`);
        nahe(zahl(mProbe[2]), hoch, 0.011, `AN Typ ${typ}: genannter Höchstwert`);
      }
      pruefe(schritte.includes("Aufgabe"), `AN Typ ${typ}: Aufgabentext fehlt`);
      pruefe(tief >= 0, `AN Typ ${typ}: kleinster Wert ${tief} ist negativ`);
    }
  }
}

// ================= Abschnitt 9: Übungsaufgaben =================

async function aufgabeOeffnen(page, nr) {
  if (nr === 1) return "#exercises-mount > .aufgabe-box";
  await page.locator(`#exercises-mount .schwierigkeit-tabs button:nth-child(${nr - 1})`).click();
  return "#exercises-mount .schwierigkeit-tab-panel .aufgabe-box";
}
async function antworte(page, box, wert) {
  await page.locator(`${box} input`).fill(String(wert).replace(".", ","));
  await page.locator(`${box} .btn-primary`).click();
  return (await page.locator(`${box} .aufgabe-feedback`).innerText()).replace(/\s+/g, " ");
}

async function testAufgabe1(page) {
  const box = await aufgabeOeffnen(page, 1);
  const gesehen = new Set();
  for (let i = 0; i < 60; i++) {
    await page.locator(`${box} .btn:not(.btn-primary)`).click();
    const frage = await text(page, `${box} .aufgabe-prompt`);
    gesehen.add(frage);
    const mb = frage.match(/sin\((\d+) · x\)/);
    pruefe(!!mb, `A1: b nicht lesbar in „${frage}“`);
    if (!mb) continue;
    const b = Number(mb[1]);
    const ma = frage.match(/f\(x\) = (\d+) · sin/);
    const a = ma ? Number(ma[1]) : 1;
    const p = 360 / b;
    pruefe(Number.isInteger(p), `A1: Periode ${p} ist nicht ganzzahlig`);
    pruefe(!frage.includes("1 · sin"), `A1: Koeffizient 1 ausgeschrieben`);

    const ok = await antworte(page, box, p);
    pruefe(ok.includes("✓ Richtig"), `A1: richtige Antwort ${p} nicht anerkannt (b=${b})`);
    pruefe(ok.includes(`${p}°`), `A1: Musterlösung ohne das Ergebnis ${p}°`);

    for (const [falsch, muster] of [[360 * b, "multipliziert"], [360, "Grundfunktion sin x"], [a, "Amplitude"]]) {
      if (Math.abs(falsch - p) < 0.4) continue;
      const r = await antworte(page, box, falsch);
      pruefe(r.includes("Noch nicht richtig"), `A1: falsche Antwort ${falsch} wurde anerkannt`);
      pruefe(r.includes(muster), `A1: Hinweis „${muster}“ fehlt bei der Eingabe ${falsch}`);
    }
  }
  // 72 Kandidaten, 60 Ziehungen: E = 40,9 und σ = 2,46 (n·p + n(n−1)q − n²p²
  // mit p = (71/72)^60, q = (70/72)^60). Die Schranke liegt bei E − 3σ ≈ 33.
  pruefe(gesehen.size >= 33, `A1: nur ${gesehen.size} verschiedene Aufgaben in 60 Zügen (erwartet ≥ 33)`);
}

async function testAufgabe2(page) {
  const box = await aufgabeOeffnen(page, 2);
  const gesehen = new Set();
  for (let i = 0; i < 40; i++) {
    await page.locator(`${box} .btn:not(.btn-primary)`).click();
    const daten = await page.evaluate((sel) => {
      const p = document.querySelector(sel + " .aufgabe-prompt");
      const br = p.querySelector(".tf-bruch");
      return br ? [br.querySelector(".oben").textContent, br.querySelector(".unten").textContent]
        : [p.querySelector("strong").textContent, "1"];
    }, box);
    gesehen.add(daten.join("/"));
    const z = daten[0] === "π" ? 1 : Number(daten[0].replace("π", ""));
    const n = Number(daten[1]);
    pruefe(Number.isFinite(z) && Number.isFinite(n), `A2: Bruch ${daten.join("/")} nicht lesbar`);
    pruefe(ggT(z, n) === 1, `A2: Bruch ${z}/${n} ist nicht gekürzt`);
    const grad = z * 180 / n;
    pruefe(Number.isInteger(grad), `A2: ${z}π/${n} ergibt ${grad}° — nicht ganzzahlig`);

    const ok = await antworte(page, box, grad);
    pruefe(ok.includes("✓ Richtig"), `A2: richtige Antwort ${grad} nicht anerkannt (${z}π/${n})`);
    pruefe(ok.includes(`${String(grad).replace(".", ",")}°`), `A2: Musterlösung ohne ${grad}°`);

    for (const [falsch, muster] of [[z * 360 / n, "ganze"], [z / n * Math.PI * Math.PI / 180, "falsche Richtung"]]) {
      const eingabe = Math.round(falsch * 100) / 100;
      if (Math.abs(eingabe - grad) < 0.4) continue;
      const r = await antworte(page, box, eingabe);
      pruefe(r.includes("Noch nicht richtig"), `A2: falsche Antwort ${eingabe} wurde anerkannt`);
      pruefe(r.includes(muster), `A2: Hinweis „${muster}“ fehlt bei der Eingabe ${eingabe}`);
    }
  }
  // 14 Kandidaten, 40 Ziehungen: E = 13,3 und σ = 0,76 — Schranke E − 3σ ≈ 11,
  // hier auf 10 abgerundet.
  pruefe(gesehen.size >= 10, `A2: nur ${gesehen.size} verschiedene Aufgaben in 40 Zügen (erwartet ≥ 10)`);
}

async function testAufgabe3(page) {
  const box = await aufgabeOeffnen(page, 3);
  const gesehen = new Set();
  for (let i = 0; i < 60; i++) {
    await page.locator(`${box} .btn:not(.btn-primary)`).click();
    const frage = (await text(page, `${box} .aufgabe-prompt`)).replace(/−/g, "-");
    gesehen.add(frage);
    const m = frage.match(/Periode (\d+)°.*höchster Wert ist (-?\d+), sein niedrigster (-?\d+),.*x = (\d+)°/);
    pruefe(!!m, `A3: Aufgabe nicht lesbar: „${frage}“`);
    if (!m) continue;
    const p = Number(m[1]), hoch = Number(m[2]), tief = Number(m[3]), xm = Number(m[4]);
    const c = ((xm - p / 4) % p + p) % p;
    pruefe(hoch > tief, `A3: Höchstwert ${hoch} nicht größer als ${tief}`);
    pruefe(xm < p, `A3: Hochpunkt ${xm}° liegt außerhalb einer Periode von ${p}°`);

    const ok = await antworte(page, box, c);
    pruefe(ok.includes("✓ Richtig"), `A3: richtige Antwort ${c} nicht anerkannt (p=${p}, xm=${xm})`);

    for (const [falsch, muster] of [
      [((xm % p) + p) % p, "Hochpunkts"],
      [((xm + p / 4) % p + p) % p, "addiert"],
      [((xm - p / 2) % p + p) % p, "halbe"],
    ]) {
      if (Math.abs(falsch - c) < 0.4) continue;
      const r = await antworte(page, box, falsch);
      pruefe(r.includes("Noch nicht richtig"), `A3: falsche Antwort ${falsch} wurde anerkannt (p=${p}, xm=${xm})`);
      pruefe(r.includes(muster), `A3: Hinweis „${muster}“ fehlt bei der Eingabe ${falsch}`);
    }
  }
  // 472 Kandidaten, 60 Ziehungen: erwartete Zahl der Doppel ist 60·59/(2·472)
  // = 3,75 (näherungsweise Poisson, σ = 1,94). Schranke 60 − (3,75 + 3σ) ≈ 50.
  pruefe(gesehen.size >= 50, `A3: nur ${gesehen.size} verschiedene Aufgaben in 60 Zügen (erwartet ≥ 50)`);
}

async function testAufgabe4(page) {
  const box = await aufgabeOeffnen(page, 4);
  const gesehen = new Set();
  for (let i = 0; i < 60; i++) {
    await page.locator(`${box} .btn:not(.btn-primary)`).click();
    const frage = (await text(page, `${box} .aufgabe-prompt`)).replace(/−/g, "-");
    gesehen.add(frage);
    const m = frage.match(/Durchmesser (\d+) m.*tiefster Punkt liegt (\d+) m.*dauert (\d+) s.*nach (\d+) s/);
    pruefe(!!m, `A4: Aufgabe nicht lesbar: „${frage}“`);
    if (!m) continue;
    const D = Number(m[1]), boden = Number(m[2]), T = Number(m[3]), t = Number(m[4]);
    const r = D / 2, h = r + boden, grad = 360 * t / T;
    // Math.cos(240°) liefert −0,5000000000000004; die Seite rechnet mit dem
    // exakten Wert. Für die Stellen dieser Aufgabe sind alle Kosinuswerte
    // ±0,5 oder ±1, deshalb wird hier auf ein Vielfaches von 0,5 gerundet.
    const kos = Math.round(cosG(grad) * 2) / 2;
    pruefe(Math.abs(kos - cosG(grad)) < 1e-9, `A4: cos ${grad}° ist kein Vielfaches von 0,5`);
    const hoehe = h - r * kos;
    pruefe(Number.isInteger(hoehe), `A4: Ergebnis ${hoehe} ist nicht ganzzahlig (D=${D}, T=${T}, t=${t})`);
    pruefe(hoehe >= boden - 1e-9 && hoehe <= D + boden + 1e-9,
      `A4: Ergebnis ${hoehe} liegt außerhalb von [${boden}, ${D + boden}]`);
    pruefe(Number.isInteger(t), `A4: Zeitpunkt ${t} s ist nicht ganzzahlig`);

    const ok = await antworte(page, box, hoehe);
    pruefe(ok.includes("✓ Richtig"), `A4: richtige Antwort ${hoehe} nicht anerkannt (D=${D}, T=${T}, t=${t})`);

    for (const [falsch, muster] of [
      [h - D * kos, "Durchmesser"],
      [h + r * sinG(grad), "Sinus"],
      [r * (1 - kos), "tiefsten Punkt"],
    ]) {
      const eingabe = Math.round(falsch * 100) / 100;
      if (Math.abs(eingabe - hoehe) < 0.05) continue;
      const res = await antworte(page, box, eingabe);
      pruefe(res.includes("Noch nicht richtig"), `A4: falsche Antwort ${eingabe} wurde anerkannt`);
      pruefe(res.includes(muster), `A4: Hinweis „${muster}“ fehlt bei der Eingabe ${eingabe}`);
    }
  }
  // 1120 Kandidaten, 60 Ziehungen: erwartete Doppel 60·59/(2·1120) = 1,58
  // (Poisson, σ = 1,26). Schranke 60 − (1,58 + 3σ) ≈ 54.
  pruefe(gesehen.size >= 54, `A4: nur ${gesehen.size} verschiedene Aufgaben in 60 Zügen (erwartet ≥ 54)`);
}

// ================= Quizze =================

async function testQuizze(page) {
  const ids = ["quiz-einheitskreis", "quiz-bogenmass", "quiz-kurven", "quiz-amplitude", "quiz-verschiebung", "quiz-anwendungen"];
  for (const id of ids) {
    const n = await page.locator(`#${id} .quiz-opt`).count();
    pruefe(n === 4, `${id}: ${n} Antwortmöglichkeiten statt 4`);
    // Die erste Antwort ist in allen Quizzen dieses Pfades die richtige.
    await page.locator(`#${id} .quiz-opt`).first().click();
    const f = await text(page, `#${id} .quiz-feedback`);
    pruefe(f.startsWith("✓ Richtig"), `${id}: erste Antwort gilt nicht als richtig`);
    pruefe(f.length > 60, `${id}: Erklärung zu knapp`);
    await page.locator(`#${id} .quiz-opt`).nth(1).click();
    const g = await text(page, `#${id} .quiz-feedback`);
    pruefe(g.startsWith("✗ Nicht ganz"), `${id}: zweite Antwort gilt nicht als falsch`);
  }
}

// ================= Hauptlauf =================

(async () => {
  const browser = await starteBrowser();
  for (const dunkel of [false, true]) {
    const wo = dunkel ? "dunkel" : "hell";
    const page = await neueSeite(browser, { dunkel });
    await oeffne(page, BASIS.replace(HOST, ""));
    if (dunkel) {
      const gesetzt = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
      pruefe(gesetzt === "dark", `Dunkelmodus wurde nicht gesetzt (data-theme=${gesetzt})`);
    }
    // Die Messhelfer werden einmal auf window gelegt und danach aus echten
    // Pfeilfunktionen heraus aufgerufen.
    await page.evaluate((q) => { eval(q); }, MESSHELFER);

    if (!dunkel) {
      await testEinheitskreis(page);
      await testBogenmass(page);
      await testKurven(page);
      await testAmplitude(page);
      await testVerschiebung(page);
      await testAnwendungen(page);
      await testAufgabe1(page);
      await testAufgabe2(page);
      await testAufgabe3(page);
      await testAufgabe4(page);
      await testQuizze(page);
    } else {
      await testEinheitskreis(page);
      await pruefeKontrast(page, bericht, "dunkel");
    }
    await pruefeNotation(page, bericht, wo);
    // In diesem Thema wird ein Faktor 1 nie ausgeschrieben — außer im
    // Parameterplatz von f(x) = a · sin(b · x), wo der Reglerwert bewusst
    // sichtbar bleibt. „1x“ dagegen ist immer falsch.
    const seitentext = await page.locator("main").innerText();
    pruefe(!/[^\d]1x/.test(seitentext), `${wo}: ausgeschriebener Koeffizient 1 („1x“) im Text`);
    for (const s of page.stoerungen) pruefe(false, `${wo}: ${s}`);
    await page.close();
  }
  await browser.close();
  bericht.abschluss();
})();
