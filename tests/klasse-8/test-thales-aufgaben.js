// Prüft die zwölf Übungsaufgaben der Seite „Satz des Thales“.
//
// Die sechs Konstruktionsaufgaben werden mit echten Mausklicks gelöst — Zirkelschlag für
// Zirkelschlag, wie eine Schülerin es täte. Erst wenn die Zeichnung wirklich steht, darf
// „Prüfen“ grün melden; vorher muss die Rückmeldung genau den nächsten offenen Schritt nennen.
// Die Sollpunkte rechnet diese Prüfung selbst aus der Angabe aus und übernimmt nichts aus der
// Seite: Schnittpunkte zweier Kreise, Höhenfußpunkte und Berührpunkte stehen hier noch einmal.
//
// Bei den Rechenaufgaben wird zusätzlich die ZEICHNUNG zurückgelesen: Die Winkel, die die
// Aufgabe behauptet, müssen die Winkel sein, die die Figur zeigt.

const { neuerBericht } = require("../lib/pruefen.js");
const { starteBrowser, neueSeite, oeffne, text } = require("../lib/seite.js");

const PFAD = "/mathematik/klasse-8/geometrie/satz-des-thales.html";
const GRAD = 180 / Math.PI;

// ---------- Geometrie, unabhängig nachgerechnet ----------

const abst = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const mitte = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

// Die beiden Schnittpunkte zweier Kreise, der obere zuerst.
function kreisSchnitt(c1, r1, c2, r2) {
  const d = abst(c1, c2);
  const a = (d * d + r1 * r1 - r2 * r2) / (2 * d);
  const h = Math.sqrt(Math.max(0, r1 * r1 - a * a));
  const u = { x: (c2.x - c1.x) / d, y: (c2.y - c1.y) / d };
  const m = { x: c1.x + a * u.x, y: c1.y + a * u.y };
  const s = [
    { x: m.x - h * u.y, y: m.y + h * u.x },
    { x: m.x + h * u.y, y: m.y - h * u.x },
  ];
  return s.sort((p, q) => p.y - q.y);
}

// Winkel bei V zwischen den Strahlen nach P und nach Q, in Grad.
function winkelBei(V, P, Q) {
  const a = { x: P.x - V.x, y: P.y - V.y }, b = { x: Q.x - V.x, y: Q.y - V.y };
  const cos = (a.x * b.x + a.y * b.y) / (Math.hypot(a.x, a.y) * Math.hypot(b.x, b.y));
  return Math.acos(Math.min(1, Math.max(-1, cos))) * GRAD;
}

// ---------- Bedienung der Zeichenfläche ----------

async function svgRahmen(page, id) {
  return page.evaluate((svgId) => {
    const svg = document.getElementById(svgId);
    svg.scrollIntoView({ block: "center" });
    const r = svg.getBoundingClientRect();
    const vb = svg.viewBox.baseVal;
    return { left: r.left, top: r.top, breite: r.width, hoehe: r.height, vbB: vb.width, vbH: vb.height };
  }, id);
}

// page.mouse.click rollt die Seite NICHT von selbst zum Ziel — deshalb vor jedem Klick neu messen.
async function klick(page, p) {
  const r = await svgRahmen(page, "ka-svg");
  await page.mouse.click(r.left + (p.x / r.vbB) * r.breite, r.top + (p.y / r.vbH) * r.hoehe);
}

async function werkzeug(page, name) {
  await page.locator(name === "kreis" ? "#ka-circle" : "#ka-line").click();
}

// Ein Zirkelschlag: Einstich, dann ein Punkt auf dem Kreis.
async function zirkel(page, zentrum, punktAufKreis) {
  await werkzeug(page, "kreis");
  await klick(page, zentrum);
  await klick(page, punktAufKreis);
}

async function lineal(page, p, q) {
  await werkzeug(page, "line");
  await klick(page, p);
  await klick(page, q);
}

// Die Mittelsenkrechte von PQ mit vorgegebener Hilfsweite. Zurück kommen ihre beiden
// Schnittpunkte — dieselben, die die Seite als Klickziele anbietet.
async function mittelsenkrechte(page, P, Q, weite, hilfsP, hilfsQ) {
  await zirkel(page, P, hilfsP);
  await zirkel(page, Q, hilfsQ);
  const s = kreisSchnitt(P, weite, Q, weite);
  await lineal(page, s[0], s[1]);
  return s;
}

// Das Lot VON einem Punkt C AUF die Gerade durch gA und gB: ein Kreis um C, der die Gerade
// zweimal schneidet, dann die Mittelsenkrechte dieser beiden Schnittpunkte.
async function lotVonPunkt(page, C, gA, gB, rKreis, rPaar) {
  const u = { x: (gB.x - gA.x) / abst(gA, gB), y: (gB.y - gA.y) / abst(gA, gB) };
  // Fußpunkt: die Projektion von C auf die Gerade.
  const t = (C.x - gA.x) * u.x + (C.y - gA.y) * u.y;
  const F = { x: gA.x + t * u.x, y: gA.y + t * u.y };
  const halb = Math.sqrt(rKreis * rKreis - abst(C, F) ** 2);
  const P1 = { x: F.x - halb * u.x, y: F.y - halb * u.y };
  const P2 = { x: F.x + halb * u.x, y: F.y + halb * u.y };
  await zirkel(page, C, P2);
  await zirkel(page, P1, { x: P1.x - u.y * rPaar, y: P1.y + u.x * rPaar });
  await zirkel(page, P2, { x: P2.x - u.y * rPaar, y: P2.y + u.x * rPaar });
  const s = kreisSchnitt(P1, rPaar, P2, rPaar);
  await lineal(page, s[0], s[1]);
  return { F, s };
}

// Das Lot IN F, wobei F schon auf der Geraden liegt: Kreis um F, dann die Mittelsenkrechte
// seiner beiden Schnittpunkte mit der Geraden.
async function lot(page, F, richtung, rKreis, rPaar) {
  const u = { x: richtung.x, y: richtung.y };
  const P1 = { x: F.x - u.x * rKreis, y: F.y - u.y * rKreis };
  const P2 = { x: F.x + u.x * rKreis, y: F.y + u.y * rKreis };
  await zirkel(page, F, P2);
  await zirkel(page, P1, { x: P1.x - u.y * rPaar, y: P1.y + u.x * rPaar });
  await zirkel(page, P2, { x: P2.x - u.y * rPaar, y: P2.y + u.x * rPaar });
  const s = kreisSchnitt(P1, rPaar, P2, rPaar);
  await lineal(page, s[0], s[1]);
  return s;
}

async function waehleAufgabe(page, id) {
  await page.locator(`#ka-tabs button[data-id="${id}"]`).click();
}

async function pruefeKnopf(page) {
  await page.locator("#ka-check").click();
  return (await text(page, "#ka-feedback")).trim();
}

async function istGruen(page) {
  return page.evaluate(() => document.getElementById("ka-feedback").className.includes("geo-feedback-ok"));
}

// ---------- Die sechs Konstruktionsaufgaben ----------

async function konstruktionen(page, pruefe) {
  const tabs = await page.$$eval("#ka-tabs button", (bs) => bs.map((b) => b.dataset.id));
  pruefe(tabs.length === 6, `Konstruktionen: ${tabs.length} Aufgaben zur Auswahl (erwartet 6)`);
  pruefe(tabs.join(",") === "k1,k2,k3,k4,k5,k6", `Konstruktionen: die Aufgaben heißen ${tabs.join(", ")}`);

  // --- Aufgabe 1: Thaleskreis über AB ---
  {
    await waehleAufgabe(page, "k1");
    const A = { x: 170, y: 215 }, B = { x: 430, y: 215 }, M = mitte(A, B), r = abst(A, B) / 2;

    let rueck = await pruefeKnopf(page);
    pruefe(rueck.includes("Mittelsenkrechte"), `K1: ohne Zeichnung verlangt die Rückmeldung die Mittelsenkrechte — „${rueck.slice(0, 60)}…“`);

    const w = 170;
    await mittelsenkrechte(page, A, B, w, { x: A.x + w, y: A.y }, { x: B.x, y: B.y - w });
    rueck = await pruefeKnopf(page);
    pruefe(rueck.includes("Thaleskreis"), `K1: nach der Mittelsenkrechten fehlt laut Rückmeldung der Thaleskreis — „${rueck.slice(0, 60)}…“`);

    // Erst ein falscher Radius: Ein Kreis um M, der nicht durch A geht, darf nicht zählen.
    await zirkel(page, M, { x: M.x, y: M.y - r * 0.7 });
    rueck = await pruefeKnopf(page);
    pruefe(rueck.includes("Radius"), `K1: der zu kleine Kreis um M wird als falscher Radius erkannt — „${rueck.slice(0, 70)}…“`);
    await page.locator("#ka-undo").click();

    await zirkel(page, M, A);
    rueck = await pruefeKnopf(page);
    pruefe(await istGruen(page), `K1: die fertige Konstruktion wird anerkannt — „${rueck.slice(0, 60)}…“`);
    pruefe(rueck.includes("Durchmesser"), "K1: die Rückmeldung begründet, warum AB der Durchmesser ist");

    const kreise = await page.$$eval("#ka-svg circle.geo-user-circle", (c) => c.length);
    pruefe(kreise === 3, `K1: gezeichnet sind ${kreise} Kreise (2 Hilfskreise + Thaleskreis)`);
  }

  // --- Aufgabe 2: rechtwinkliges Dreieck aus c und a ---
  {
    await waehleAufgabe(page, "k2");
    const A = { x: 180, y: 270 }, B = { x: 420, y: 270 }, M = mitte(A, B), r = 120, aLang = 144;
    const C = kreisSchnitt(M, r, B, aLang)[0];
    pruefe(Math.abs(abst(B, C) - aLang) < 0.5 && Math.abs(abst(M, C) - r) < 0.5, "K2: der Sollpunkt C liegt auf beiden Kreisen");
    pruefe(Math.abs(winkelBei(C, A, B) - 90) < 0.01, `K2: im Sollpunkt C misst der Winkel ${winkelBei(C, A, B).toFixed(2)}°`);

    const w = 170;
    await mittelsenkrechte(page, A, B, w, { x: A.x + w, y: A.y }, { x: B.x, y: B.y - w });
    await zirkel(page, M, A);
    let rueck = await pruefeKnopf(page);
    pruefe(rueck.includes("Radius a"), `K2: nach dem Thaleskreis fehlt der Kreis um B mit dem Radius a — „${rueck.slice(0, 60)}…“`);

    await zirkel(page, B, { x: B.x, y: B.y - aLang });
    rueck = await pruefeKnopf(page);
    pruefe(rueck.includes("Dreiecksseiten"), `K2: C steht, es fehlen die Seiten — „${rueck.slice(0, 60)}…“`);

    await lineal(page, A, C);
    await lineal(page, B, C);
    rueck = await pruefeKnopf(page);
    pruefe(await istGruen(page), `K2: die fertige Konstruktion wird anerkannt — „${rueck.slice(0, 60)}…“`);
  }

  // --- Aufgabe 3: Tangenten von P an den Kreis k ---
  {
    await waehleAufgabe(page, "k3");
    const M = { x: 180, y: 220 }, P = { x: 470, y: 220 }, r = 70;
    const d = abst(M, P), Z = mitte(M, P);
    const T = kreisSchnitt(M, r, Z, d / 2);
    // Berührpunkt: der Radius MT muss auf der Tangente PT senkrecht stehen.
    T.forEach((t, i) => pruefe(Math.abs(winkelBei(t, M, P) - 90) < 0.01, `K3: im Sollpunkt T${i + 1} misst ∡MTP ${winkelBei(t, M, P).toFixed(2)}°`));
    const tangenteSoll = Math.sqrt(d * d - r * r);
    pruefe(Math.abs(abst(P, T[0]) - tangenteSoll) < 0.5, `K3: die Tangentenlänge ist √(d² − r²) = ${tangenteSoll.toFixed(1)}`);

    const w = 180;
    await mittelsenkrechte(page, M, P, w, { x: M.x + w, y: M.y }, { x: P.x - w, y: P.y });
    await zirkel(page, Z, M);
    let rueck = await pruefeKnopf(page);
    pruefe(rueck.includes("Berührpunkte"), `K3: nach dem Thaleskreis fehlen die Tangenten — „${rueck.slice(0, 60)}…“`);

    await lineal(page, P, T[0]);
    rueck = await pruefeKnopf(page);
    pruefe(rueck.includes("zwei"), `K3: mit nur einer Tangente bleibt die Aufgabe offen — „${rueck.slice(0, 70)}…“`);

    await lineal(page, P, T[1]);
    rueck = await pruefeKnopf(page);
    pruefe(await istGruen(page), `K3: beide Tangenten werden anerkannt — „${rueck.slice(0, 60)}…“`);
  }

  // --- Aufgabe 4: Dreieck aus p und q ---
  {
    await waehleAufgabe(page, "k4");
    const A = { x: 150, y: 250 }, H = { x: 270, y: 250 }, B = { x: 450, y: 250 };
    const M = mitte(A, B), r = abst(A, B) / 2;
    const hSoll = Math.sqrt(abst(A, H) * abst(H, B));
    const C = { x: H.x, y: H.y - hSoll };
    pruefe(Math.abs(abst(M, C) - r) < 0.01, "K4: der Höhenfußpunkt liefert ein C genau auf dem Thaleskreis");
    pruefe(Math.abs(winkelBei(C, A, B) - 90) < 0.01, `K4: im Sollpunkt C misst der Winkel ${winkelBei(C, A, B).toFixed(2)}°`);

    const w = 186;
    await mittelsenkrechte(page, A, B, w, { x: A.x + w, y: A.y }, { x: B.x, y: B.y - w });
    await zirkel(page, M, A);
    let rueck = await pruefeKnopf(page);
    pruefe(rueck.includes("Lot in H"), `K4: nach dem Thaleskreis fehlt das Lot in H — „${rueck.slice(0, 60)}…“`);

    await lot(page, H, { x: 1, y: 0 }, 70, 90);
    rueck = await pruefeKnopf(page);
    pruefe(rueck.includes("Katheten"), `K4: das Lot steht, es fehlen die Katheten — „${rueck.slice(0, 60)}…“`);

    await lineal(page, A, C);
    await lineal(page, B, C);
    rueck = await pruefeKnopf(page);
    pruefe(await istGruen(page), `K4: die fertige Konstruktion wird anerkannt — „${rueck.slice(0, 60)}…“`);
    pruefe(rueck.includes("Höhensatz"), "K4: die Rückmeldung nennt den Höhensatz");
  }

  // --- Aufgabe 5: Dreieck aus c und h_c ---
  {
    await waehleAufgabe(page, "k5");
    const A = { x: 160, y: 250 }, B = { x: 440, y: 250 }, M = mitte(A, B), r = 140, h = 100;
    const P = { x: A.x, y: A.y - h };
    const dx = Math.sqrt(r * r - h * h);
    const C2 = { x: M.x + dx, y: M.y - h };
    pruefe(Math.abs(abst(M, C2) - r) < 0.01, "K5: der Sollpunkt C liegt auf dem Thaleskreis");
    pruefe(Math.abs(C2.y - (A.y - h)) < 0.01, "K5: der Sollpunkt C hat von AB genau den Abstand h_c");

    const w = 174;
    await mittelsenkrechte(page, A, B, w, { x: A.x + w, y: A.y }, { x: B.x, y: B.y - w });
    await zirkel(page, M, A);
    let rueck = await pruefeKnopf(page);
    pruefe(rueck.includes("Parallele"), `K5: nach dem Thaleskreis fehlt die Parallele — „${rueck.slice(0, 60)}…“`);

    await lot(page, P, { x: 0, y: 1 }, 60, 80);
    rueck = await pruefeKnopf(page);
    pruefe(rueck.includes("Parallele schneidet"), `K5: die Parallele steht, es fehlt das Dreieck — „${rueck.slice(0, 70)}…“`);

    await lineal(page, A, C2);
    rueck = await pruefeKnopf(page);
    pruefe(rueck.includes("zweite"), `K5: mit nur einer Kathete bleibt die Aufgabe offen — „${rueck.slice(0, 70)}…“`);

    await lineal(page, B, C2);
    rueck = await pruefeKnopf(page);
    pruefe(await istGruen(page), `K5: die fertige Konstruktion wird anerkannt — „${rueck.slice(0, 60)}…“`);
    pruefe(rueck.includes("c : 2"), "K5: die Rückmeldung nennt die Grenze h_c ≤ c : 2");
  }

  // --- Aufgabe 6: Dreieck aus c und b, dazu die Höhe ---
  {
    await waehleAufgabe(page, "k6");
    const A = { x: 170, y: 270 }, B = { x: 430, y: 270 }, M = mitte(A, B), r = 130, bLang = 156;
    const C = kreisSchnitt(M, r, A, bLang)[0];
    const H = { x: C.x, y: A.y };
    pruefe(Math.abs(abst(A, C) - bLang) < 0.5, `K6: der Sollpunkt C hat von A den Abstand b = ${bLang}`);
    pruefe(Math.abs(winkelBei(C, A, B) - 90) < 0.01, `K6: im Sollpunkt C misst der Winkel ${winkelBei(C, A, B).toFixed(2)}°`);
    // Kathetensatz als unabhängige Gegenrechnung: b² = c · q.
    const q = abst(A, H), c = abst(A, B);
    pruefe(Math.abs(bLang * bLang - c * q) < 1, `K6: Kathetensatz b² = c · q — ${(bLang * bLang).toFixed(0)} gegen ${(c * q).toFixed(0)}`);

    const w = 190;
    await mittelsenkrechte(page, A, B, w, { x: A.x + w, y: A.y }, { x: B.x, y: B.y - w });
    await zirkel(page, M, A);
    let rueck = await pruefeKnopf(page);
    pruefe(rueck.includes("Radius b"), `K6: nach dem Thaleskreis fehlt der Kreis um A mit dem Radius b — „${rueck.slice(0, 60)}…“`);

    await zirkel(page, A, { x: A.x, y: A.y - bLang });
    await lineal(page, A, C);
    await lineal(page, B, C);
    rueck = await pruefeKnopf(page);
    pruefe(rueck.includes("Höhe von C"), `K6: das Dreieck steht, es fehlt die Höhe — „${rueck.slice(0, 60)}…“`);

    const gefaellt = await lotVonPunkt(page, C, A, B, 140, 90);
    pruefe(Math.abs(gefaellt.F.x - H.x) < 0.01, `K6: der Fußpunkt des Lots liegt bei x = ${gefaellt.F.x.toFixed(1)} (erwartet ${H.x.toFixed(1)})`);
    rueck = await pruefeKnopf(page);
    pruefe(await istGruen(page), `K6: die fertige Konstruktion wird anerkannt — „${rueck.slice(0, 60)}…“`);
    pruefe(rueck.includes("Kathetensatz"), "K6: die Rückmeldung nennt Höhen- und Kathetensatz");
  }

  // Der Umschalter räumt die eigene Zeichnung ab — sonst stünde die alte Konstruktion
  // in der neuen Aufgabe und würde sie womöglich als gelöst melden.
  await waehleAufgabe(page, "k1");
  const reste = await page.$$eval("#ka-svg circle.geo-user-circle, #ka-svg line.geo-user-line", (e) => e.length);
  pruefe(reste === 0, `Konstruktionen: nach dem Aufgabenwechsel sind ${reste} eigene Elemente übrig (erwartet 0)`);
  const rueck = await pruefeKnopf(page);
  pruefe(!(await istGruen(page)), `Konstruktionen: die leere Aufgabe 1 gilt nicht als gelöst — „${rueck.slice(0, 50)}…“`);
}

// ---------- Die drei Rechenaufgaben ----------

// Die sechs Vorgaben der ersten Aufgabe, unabhängig aufgelöst.
const R1_SOLL = [
  { key: "a", alpha: 25 },
  { key: "b", alpha: 55 },
  { key: "c", alpha: 45 },
  { key: "d", alpha: 35 },
  { key: "e", alpha: 60 },
  { key: "f", alpha: 45 },
];

function r1Werte(alpha) {
  return { alpha, beta: 90 - alpha, g1: alpha, g2: 90 - alpha, d1: 180 - 2 * alpha, d2: 2 * alpha };
}

// Liest die Halbkreisfigur zurück und misst die Winkel, die sie wirklich zeigt.
async function r1Figur(page) {
  return page.evaluate(() => {
    const svg = document.querySelector("#rechen-mount .th-figur");
    const lese = (sel) => [...svg.querySelectorAll(sel)].map((l) => ({
      a: { x: +l.getAttribute("x1"), y: +l.getAttribute("y1") },
      b: { x: +l.getAttribute("x2"), y: +l.getAttribute("y2") },
    }));
    return { durchmesser: lese("line.thf-durchmesser"), seiten: lese("line.thf-seite"), radius: lese("line.thf-radius") };
  });
}

async function rechenaufgaben(page, pruefe) {
  // --- Aufgabe 1, alle sechs Vorgaben ---
  for (const v of R1_SOLL) {
    await page.locator(`#rechen-mount .th-varianten button[data-key="${v.key}"]`).click();
    const soll = r1Werte(v.alpha);

    // Zeigt die Zeichnung wirklich den Winkel, von dem die Aufgabe spricht?
    const f = await r1Figur(page);
    const A = f.durchmesser[0].a.x < f.durchmesser[0].b.x ? f.durchmesser[0].a : f.durchmesser[0].b;
    const B = f.durchmesser[0].a.x < f.durchmesser[0].b.x ? f.durchmesser[0].b : f.durchmesser[0].a;
    const C = f.radius[0].b;
    const gemessenA = winkelBei(A, B, C), gemessenB = winkelBei(B, A, C), gemessenC = winkelBei(C, A, B);
    pruefe(Math.abs(gemessenA - soll.alpha) < 0.3, `R1 ${v.key}): die Zeichnung zeigt bei A ${gemessenA.toFixed(1)}° (Aufgabe: ${soll.alpha}°)`);
    pruefe(Math.abs(gemessenB - soll.beta) < 0.3, `R1 ${v.key}): die Zeichnung zeigt bei B ${gemessenB.toFixed(1)}° (Aufgabe: ${soll.beta}°)`);
    pruefe(Math.abs(gemessenC - 90) < 0.3, `R1 ${v.key}): der Winkel bei C misst in der Zeichnung ${gemessenC.toFixed(1)}°`);

    const felder = await page.$$eval("#rechen-mount .aufgabe-box:nth-of-type(1) .th-luecken-liste li", (lis) =>
      lis.map((li) => li.textContent.replace(/\s+/g, " ").trim()),
    );
    const erwarteteZahl = v.key === "a" || v.key === "b" || v.key === "d" ? 5 : 6;
    pruefe(felder.length === erwarteteZahl, `R1 ${v.key}): ${felder.length} Lücken (erwartet ${erwarteteZahl})`);

    // Alle richtigen Werte eintragen — es muss grün werden.
    const eingaben = await page.$$("#rechen-mount .aufgabe-box:nth-of-type(1) .th-luecken-liste input");
    for (let i = 0; i < eingaben.length; i++) {
      const name = felder[i];
      const schluessel = name.includes("β") && !name.includes("γ") ? "beta"
        : name.includes("γ₁") ? "g1"
        : name.includes("γ₂") ? "g2"
        : name.includes("δ₁") ? "d1"
        : name.includes("δ₂") ? "d2"
        : "alpha";
      await eingaben[i].fill(String(soll[schluessel]));
    }
    await page.locator("#rechen-mount .aufgabe-box:nth-of-type(1) .btn-primary").click();
    const rueck = await text(page, "#rechen-mount .aufgabe-box:nth-of-type(1) .aufgabe-feedback .status");
    pruefe(rueck.includes("Alles richtig"), `R1 ${v.key}): die richtigen Werte werden anerkannt — „${rueck}“`);
    const falschMarkiert = await page.$$eval("#rechen-mount .aufgabe-box:nth-of-type(1) .th-feld-fehler", (e) => e.length);
    pruefe(falschMarkiert === 0, `R1 ${v.key}): kein Feld ist zu Unrecht als falsch markiert (${falschMarkiert})`);
  }

  // Eine falsche Eingabe muss auffallen — und die Figur muss den richtigen Wert nachtragen.
  await page.locator('#rechen-mount .th-varianten button[data-key="a"]').click();
  {
    const eingaben = await page.$$("#rechen-mount .aufgabe-box:nth-of-type(1) .th-luecken-liste input");
    await eingaben[0].fill("42");
    await page.locator("#rechen-mount .aufgabe-box:nth-of-type(1) .btn-primary").click();
    const rueck = await text(page, "#rechen-mount .aufgabe-box:nth-of-type(1) .aufgabe-feedback .status");
    pruefe(rueck.includes("Noch nicht"), `R1: eine falsche Eingabe wird nicht anerkannt — „${rueck}“`);
    const nachgetragen = await page.$$eval("#rechen-mount .aufgabe-box:nth-of-type(1) .thf-falsch", (e) => e.map((x) => x.textContent));
    pruefe(nachgetragen.includes("65°"), `R1: der richtige Wert β = 65° steht nach dem Prüfen in der Figur (${nachgetragen.join(", ")})`);
  }

  // --- Aufgabe 2: Mittelpunkts- und Umfangswinkel ---
  {
    const soll = [25, 65, 90, 130];
    const box = "#rechen-mount .aufgabe-box:nth-of-type(2)";
    // Die Figur muss zeigen, was die Aufgabe behauptet: C, M und B auf einer Geraden.
    const f = await page.evaluate((sel) => {
      const svg = document.querySelector(sel + " .th-figur");
      const k = svg.querySelector("circle.thf-kreis");
      const d = svg.querySelector("line.thf-durchmesser");
      return {
        M: { x: +k.getAttribute("cx"), y: +k.getAttribute("cy") },
        r: +k.getAttribute("r"),
        C: { x: +d.getAttribute("x1"), y: +d.getAttribute("y1") },
        B: { x: +d.getAttribute("x2"), y: +d.getAttribute("y2") },
        A: (() => {
          const s = [...svg.querySelectorAll("line.thf-radius")][0];
          return { x: +s.getAttribute("x1"), y: +s.getAttribute("y1") };
        })(),
      };
    }, box);
    [["A", f.A], ["B", f.B], ["C", f.C]].forEach(([n, P]) =>
      pruefe(Math.abs(abst(f.M, P) - f.r) < 0.5, `R2: ${n} liegt auf dem Kreis (Abstand ${abst(f.M, P).toFixed(1)} zu r = ${f.r})`),
    );
    pruefe(Math.abs(winkelBei(f.M, f.C, f.B) - 180) < 0.5, `R2: C, M und B liegen auf einer Geraden (${winkelBei(f.M, f.C, f.B).toFixed(1)}°)`);
    pruefe(Math.abs(winkelBei(f.M, f.A, f.B) - 50) < 0.5, `R2: der Mittelpunktswinkel ∡AMB misst in der Zeichnung ${winkelBei(f.M, f.A, f.B).toFixed(1)}°`);
    pruefe(Math.abs(winkelBei(f.C, f.A, f.B) - 25) < 0.5, `R2: der Umfangswinkel ∡ACB misst ${winkelBei(f.C, f.A, f.B).toFixed(1)}° — die Hälfte von 50°`);
    pruefe(Math.abs(winkelBei(f.A, f.C, f.B) - 90) < 0.5, `R2: der Winkel bei A misst ${winkelBei(f.A, f.C, f.B).toFixed(1)}° — der Satz des Thales`);

    const eingaben = await page.$$(box + " .th-luecken-liste input");
    pruefe(eingaben.length === 4, `R2: ${eingaben.length} Lücken (erwartet 4)`);
    for (let i = 0; i < eingaben.length; i++) await eingaben[i].fill(String(soll[i]));
    await page.locator(box + " .btn-primary").click();
    const rueck = await text(page, box + " .aufgabe-feedback .status");
    pruefe(rueck.includes("Alles richtig"), `R2: die richtigen Werte werden anerkannt — „${rueck}“`);
    const weg = await text(page, box + " .musterloesung");
    pruefe(weg.includes("Umfangswinkelsatz"), "R2: der Rechenweg nennt den Umfangswinkelsatz");
  }

  // --- Aufgabe 3: das ganze Thales-Dreieck ---
  {
    const box = "#rechen-mount .aufgabe-box:nth-of-type(3)";
    // Unabhängig nachgerechnet aus c = 10 und b = 6.
    const c = 10, b = 6;
    const a = Math.sqrt(c * c - b * b);
    const soll = [a, c / 2, (a * b) / 2, (a * b) / c, (b * b) / c, (a * a) / c];
    pruefe(Math.abs(soll[3] * soll[3] - soll[4] * soll[5]) < 1e-9, `R3: Höhensatz h² = p · q — ${(soll[3] * soll[3]).toFixed(4)}`);
    pruefe(Math.abs(soll[4] + soll[5] - c) < 1e-9, "R3: p + q ergibt die Hypotenuse");

    const f = await page.evaluate((sel) => {
      const svg = document.querySelector(sel + " .th-figur");
      const lese = (s) => [...svg.querySelectorAll(s)].map((l) => ({
        a: { x: +l.getAttribute("x1"), y: +l.getAttribute("y1") },
        b: { x: +l.getAttribute("x2"), y: +l.getAttribute("y2") },
      }));
      return { d: lese("line.thf-durchmesser")[0], seiten: lese("line.thf-seite"), hoehe: lese("line.thf-radius")[0] };
    }, box);
    const A = f.d.a.x < f.d.b.x ? f.d.a : f.d.b, B = f.d.a.x < f.d.b.x ? f.d.b : f.d.a;
    const C = f.hoehe.a.y < f.hoehe.b.y ? f.hoehe.a : f.hoehe.b;
    const H = f.hoehe.a.y < f.hoehe.b.y ? f.hoehe.b : f.hoehe.a;
    pruefe(Math.abs(winkelBei(C, A, B) - 90) < 0.3, `R3: die Zeichnung zeigt bei C ${winkelBei(C, A, B).toFixed(1)}°`);
    const massstab = abst(A, B) / c;
    pruefe(Math.abs(abst(A, C) / massstab - b) < 0.1, `R3: die Zeichnung zeigt b = ${(abst(A, C) / massstab).toFixed(2)} (Aufgabe: 6)`);
    pruefe(Math.abs(abst(A, H) / massstab - soll[4]) < 0.1, `R3: die Zeichnung zeigt q = ${(abst(A, H) / massstab).toFixed(2)} (gerechnet: ${soll[4]})`);
    pruefe(Math.abs(abst(C, H) / massstab - soll[3]) < 0.1, `R3: die Zeichnung zeigt h = ${(abst(C, H) / massstab).toFixed(2)} (gerechnet: ${soll[3]})`);

    const eingaben = await page.$$(box + " .th-luecken-liste input");
    pruefe(eingaben.length === 6, `R3: ${eingaben.length} Lücken (erwartet 6)`);
    for (let i = 0; i < eingaben.length; i++) await eingaben[i].fill(String(soll[i]).replace(".", ","));
    await page.locator(box + " .btn-primary").click();
    let rueck = await text(page, box + " .aufgabe-feedback .status");
    pruefe(rueck.includes("Alles richtig"), `R3: die richtigen Werte werden anerkannt — „${rueck}“`);

    // Ein einzelner Fehler darf nicht durchrutschen.
    await eingaben[0].fill("7");
    await page.locator(box + " .btn-primary").click();
    rueck = await text(page, box + " .aufgabe-feedback .status");
    pruefe(rueck.includes("Noch nicht"), `R3: ein falscher Wert fällt auf — „${rueck}“`);
    const markiert = await page.$$eval(box + " .th-feld-fehler", (e) => e.length);
    pruefe(markiert === 1, `R3: genau ein Feld ist als falsch markiert (${markiert})`);
  }
}

// ---------- Die drei Heftaufgaben ----------

async function heftaufgaben(page, pruefe) {
  const boxen = await page.$$("#heft-mount .aufgabe-box");
  pruefe(boxen.length === 3, `Heft: ${boxen.length} Aufgaben (erwartet 3)`);

  const zu = await page.$$eval("#heft-mount details", (d) => d.filter((x) => x.open).length);
  pruefe(zu === 0, `Heft: alle Selbstkontrollen sind zugeklappt (${zu} offen)`);

  const schritte = await page.$$eval("#heft-mount .geo-steps", (ol) => ol.map((o) => o.children.length));
  schritte.forEach((n, i) => pruefe(n >= 4, `Heft ${i + 1}: ${n} Arbeitsschritte`));

  const kontrollen = await page.$$eval("#heft-mount details > div", (d) => d.map((x) => x.textContent.replace(/\s+/g, " ")));

  // Aufgabe 1: c = 7, b = 4 ⟹ a = √33.
  const a1 = Math.sqrt(7 * 7 - 4 * 4);
  pruefe(Math.abs(a1 - 5.745) < 0.001, `Heft 1: a = √33 = ${a1.toFixed(3)}`);
  pruefe(kontrollen[0].includes("5,74"), "Heft 1: die Selbstkontrolle nennt die Sollänge 5,74 cm");
  pruefe(kontrollen[0].includes("3,5 cm"), "Heft 1: die Selbstkontrolle nennt den Umkreisradius 3,5 cm");

  // Aufgabe 2 a): c = 6, h = 2,5 ⟹ p + q = 6, p · q = 6,25.
  const wurzel = Math.sqrt(9 - 6.25);
  pruefe(Math.abs(3 + wurzel - 4.658) < 0.001 && Math.abs(3 - wurzel - 1.342) < 0.001, `Heft 2a: die Abschnitte sind ${(3 + wurzel).toFixed(3)} und ${(3 - wurzel).toFixed(3)}`);
  pruefe(kontrollen[1].includes("4,66") && kontrollen[1].includes("1,34"), "Heft 2a: die Selbstkontrolle nennt beide Abschnitte");
  // Aufgabe 2 b): p = 2, q = 4,5 ⟹ c = 6,5, h = 3, a = √13, b = √29,25.
  pruefe(Math.abs(Math.sqrt(2 * 4.5) - 3) < 1e-12, "Heft 2b: h = √(p · q) = 3 geht glatt auf");
  pruefe(Math.abs(Math.sqrt(6.5 * 2) - 3.606) < 0.001, `Heft 2b: a = √(c · p) = ${Math.sqrt(6.5 * 2).toFixed(3)}`);
  pruefe(Math.abs(Math.sqrt(6.5 * 4.5) - 5.408) < 0.001, `Heft 2b: b = √(c · q) = ${Math.sqrt(6.5 * 4.5).toFixed(3)}`);
  pruefe(kontrollen[1].includes("3,61") && kontrollen[1].includes("5,41"), "Heft 2b: die Selbstkontrolle nennt beide Katheten");

  // Aufgabe 3: Grenzfall h = c : 2 und der unmögliche Fall h > c : 2.
  pruefe(Math.abs(2.5 - 5 / 2) < 1e-12, "Heft 3a: h_c = 2,5 cm ist genau der Radius des Thaleskreises");
  pruefe(3 > 5 / 2, "Heft 3b: h_c = 3 cm ist größer als der Radius — es kann keine Lösung geben");
  pruefe(kontrollen[2].includes("genau eine"), "Heft 3a: die Selbstkontrolle nennt den Grenzfall mit genau einer Lösung");
  pruefe(kontrollen[2].includes("keine"), "Heft 3b: die Selbstkontrolle nennt den unmöglichen Fall");
  pruefe(kontrollen[2].includes("45°"), "Heft 3a: die Selbstkontrolle nennt das gleichschenklige Dreieck mit 45°");
}

// ---------- Lauf ----------

(async () => {
  const { pruefe, abschluss } = neuerBericht();
  const browser = await starteBrowser();
  const page = await neueSeite(browser);
  await oeffne(page, PFAD);

  await konstruktionen(page, pruefe);
  await rechenaufgaben(page, pruefe);
  await heftaufgaben(page, pruefe);

  pruefe(page.stoerungen.length === 0, `Keine Skript- oder Konsolenfehler (${page.stoerungen.join(" | ") || "keine"})`);

  await browser.close();
  abschluss();
})();
