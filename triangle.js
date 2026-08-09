(function () {
  "use strict";

  const EPS = 1e-9;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const toDeg = (rad) => (rad * 180) / Math.PI;

  const oppositeAngleOf = { a: "alpha", b: "beta", c: "gamma" };
  const oppositeSideOf = { alpha: "a", beta: "b", gamma: "c" };
  const includedAngleFor = (k1, k2) => {
    const set = new Set([k1, k2]);
    if (set.has("a") && set.has("b")) return "gamma";
    if (set.has("a") && set.has("c")) return "beta";
    return "alpha";
  };

  function anglesFromSides(a, b, c) {
    const clamp = (x) => Math.max(-1, Math.min(1, x));
    const alpha = toDeg(Math.acos(clamp((b * b + c * c - a * a) / (2 * b * c))));
    const beta = toDeg(Math.acos(clamp((a * a + c * c - b * b) / (2 * a * c))));
    const gamma = 180 - alpha - beta;
    return { alpha, beta, gamma };
  }

  function derive(values) {
    const { a, b, c, alpha, beta, gamma } = values;
    const perimeter = a + b + c;
    const s = perimeter / 2;
    const area = Math.sqrt(Math.max(0, s * (s - a) * (s - b) * (s - c)));
    const circumradius = a / (2 * Math.sin(toRad(alpha)));
    const inradius = area / s;

    const ha = (2 * area) / a;
    const hb = (2 * area) / b;
    const hc = (2 * area) / c;

    const sa = 0.5 * Math.sqrt(2 * b * b + 2 * c * c - a * a);
    const sb = 0.5 * Math.sqrt(2 * a * a + 2 * c * c - b * b);
    const sc = 0.5 * Math.sqrt(2 * a * a + 2 * b * b - c * c);

    const wa = (2 * b * c * Math.cos(toRad(alpha) / 2)) / (b + c);
    const wb = (2 * a * c * Math.cos(toRad(beta) / 2)) / (a + c);
    const wc = (2 * a * b * Math.cos(toRad(gamma) / 2)) / (a + b);

    return { ...values, perimeter, area, circumradius, inradius, ha, hb, hc, sa, sb, sc, wa, wb, wc };
  }

  function solveSSS(a, b, c) {
    if (a + b <= c || a + c <= b || b + c <= a) {
      return { error: "Diese drei Seiten bilden kein Dreieck (Dreiecksungleichung verletzt)." };
    }
    const { alpha, beta, gamma } = anglesFromSides(a, b, c);
    return { solutions: [{ ...derive({ a, b, c, alpha, beta, gamma }), satz: "SSS", satzLabel: "Seite-Seite-Seite" }] };
  }

  function solveWWW(alpha, beta, gamma) {
    const a = 1;
    const k = a / Math.sin(toRad(alpha));
    const b = k * Math.sin(toRad(beta));
    const c = k * Math.sin(toRad(gamma));
    return {
      solutions: [
        {
          ...derive({ a, b, c, alpha, beta, gamma }),
          satz: null,
          satzLabel: "nur Form bestimmt (ähnliche Dreiecke)",
          sizeArbitrary: true,
        },
      ],
    };
  }

  function solveTwoAnglesOneSide(sides, angles, sideKey) {
    const givenAngleKeys = Object.keys(angles).filter((k) => angles[k] != null);
    const missingAngleKey = ["alpha", "beta", "gamma"].find((k) => !givenAngleKeys.includes(k));
    const full = { alpha: angles.alpha, beta: angles.beta, gamma: angles.gamma };
    full[missingAngleKey] = 180 - givenAngleKeys.reduce((sum, k) => sum + angles[k], 0);

    const sideVal = sides[sideKey];
    const oppAngleKey = oppositeAngleOf[sideKey];
    const k = sideVal / Math.sin(toRad(full[oppAngleKey]));

    const result = { a: null, b: null, c: null, ...full };
    for (const sk of ["a", "b", "c"]) {
      result[sk] = sk === sideKey ? sideVal : k * Math.sin(toRad(full[oppositeAngleOf[sk]]));
    }

    const includedSideForGiven = oppositeSideOf[missingAngleKey];
    const wasIncludedOriginally = includedSideForGiven === sideKey;

    return {
      solutions: [
        {
          ...derive(result),
          satz: "WSW",
          satzLabel: wasIncludedOriginally
            ? "Winkel-Seite-Winkel"
            : "Winkel-Winkel-Seite → per Winkelsummensatz auf WSW zurückgeführt",
        },
      ],
    };
  }

  function solveSWS(sides, angles, sideKeys, angleKey) {
    const [k1, k2] = sideKeys;
    const X = sides[k1];
    const Y = sides[k2];
    const Z = angles[angleKey];
    const thirdKey = ["a", "b", "c"].find((k) => k !== k1 && k !== k2);
    const thirdVal = Math.sqrt(X * X + Y * Y - 2 * X * Y * Math.cos(toRad(Z)));

    const sidesFull = { a: null, b: null, c: null };
    sidesFull[k1] = X;
    sidesFull[k2] = Y;
    sidesFull[thirdKey] = thirdVal;

    const { alpha, beta, gamma } = anglesFromSides(sidesFull.a, sidesFull.b, sidesFull.c);
    return {
      solutions: [
        {
          ...derive({ ...sidesFull, alpha, beta, gamma }),
          satz: "SWS",
          satzLabel: "Seite-Winkel-Seite",
        },
      ],
    };
  }

  function solveSSW(sides, angles, sideKeys, angleKey) {
    const Z = angles[angleKey];
    const pKey = oppositeSideOf[angleKey];
    const qKey = sideKeys.find((k) => k !== pKey);
    if (!qKey) {
      return { error: "Der gegebene Winkel muss einer der beiden gegebenen Seiten gegenüberliegen." };
    }
    const p = sides[pKey];
    const q = sides[qKey];

    const sinQ = (q * Math.sin(toRad(Z))) / p;
    if (sinQ > 1 + 1e-9) {
      return { error: "Mit diesen Angaben lässt sich kein Dreieck bilden (SSW: Seite zu kurz)." };
    }
    const clampedSinQ = Math.min(1, sinQ);
    const Q1 = toDeg(Math.asin(clampedSinQ));
    const rawCandidates = [Q1];
    if (Math.abs(180 - Q1 - Q1) > 1e-6) rawCandidates.push(180 - Q1);

    const validCandidates = rawCandidates
      .map((Q) => ({ Q, R: 180 - Z - Q }))
      .filter((c) => c.R > EPS);

    if (validCandidates.length === 0) {
      return { error: "Mit diesen Angaben lässt sich kein Dreieck bilden." };
    }

    const isLongerSideCase = p >= q - 1e-9;
    const solutions = validCandidates.map(({ Q, R }) => {
      const rKey = ["a", "b", "c"].find((k) => k !== pKey && k !== qKey);
      const rVal = (p * Math.sin(toRad(R))) / Math.sin(toRad(Z));

      const sidesFull = { a: null, b: null, c: null };
      sidesFull[pKey] = p;
      sidesFull[qKey] = q;
      sidesFull[rKey] = rVal;

      const anglesFull = { alpha: null, beta: null, gamma: null };
      anglesFull[angleKey] = Z;
      anglesFull[oppositeAngleOf[qKey]] = Q;
      anglesFull[oppositeAngleOf[rKey]] = R;

      return {
        ...derive({ ...sidesFull, ...anglesFull }),
        satz: isLongerSideCase && validCandidates.length === 1 ? "SsW" : null,
        satzLabel:
          validCandidates.length === 2
            ? "SSW ist hier mehrdeutig (Kongruenzsatz SsW gilt nur, wenn der Winkel der längeren Seite gegenüberliegt)"
            : isLongerSideCase
            ? "Seite-Seite-Winkel (Winkel liegt der längeren Seite gegenüber)"
            : "SSW – eindeutig, da nur eine Lösung geometrisch möglich ist",
      };
    });

    return { solutions, ambiguous: solutions.length > 1 };
  }

  function solveTriangle(input) {
    const sides = { a: input.a, b: input.b, c: input.c };
    const angles = { alpha: input.alpha, beta: input.beta, gamma: input.gamma };
    const sideKeys = Object.keys(sides).filter((k) => sides[k] != null);
    const angleKeys = Object.keys(angles).filter((k) => angles[k] != null);
    const nS = sideKeys.length;
    const nA = angleKeys.length;

    if (nS + nA !== 3) {
      return { error: `Bitte genau drei Werte eingeben (aktuell ${nS + nA}).` };
    }
    for (const k of sideKeys) {
      if (!(sides[k] > 0)) return { error: `Seite ${k} muss größer als 0 sein.` };
    }
    for (const k of angleKeys) {
      if (!(angles[k] > 0 && angles[k] < 180)) return { error: `Winkel ${k} muss zwischen 0° und 180° liegen.` };
    }
    if (nA === 2) {
      const sum = angleKeys.reduce((s, k) => s + angles[k], 0);
      if (sum >= 180) return { error: "Die Summe der beiden gegebenen Winkel muss kleiner als 180° sein." };
    }
    if (nA === 3) {
      const sum = angles.alpha + angles.beta + angles.gamma;
      if (Math.abs(sum - 180) > 1e-6) return { error: "Die drei Winkel müssen sich zu 180° summieren." };
    }

    if (nS === 3) return solveSSS(sides.a, sides.b, sides.c);
    if (nS === 0) return solveWWW(angles.alpha, angles.beta, angles.gamma);
    if (nS === 1) return solveTwoAnglesOneSide(sides, angles, sideKeys[0]);

    const angleKey = angleKeys[0];
    const included = includedAngleFor(sideKeys[0], sideKeys[1]);
    if (angleKey === included) return solveSWS(sides, angles, sideKeys, angleKey);
    return solveSSW(sides, angles, sideKeys, angleKey);
  }

  function fmt(n, digits = 3) {
    if (n == null || Number.isNaN(n)) return "–";
    return n.toLocaleString("de-DE", { maximumFractionDigits: digits });
  }

  function buildTriangleSVG(t) {
    const alphaRad = toRad(t.alpha);
    const A = { x: 0, y: 0 };
    const B = { x: t.c, y: 0 };
    const C = { x: t.b * Math.cos(alphaRad), y: t.b * Math.sin(alphaRad) };

    const xs = [A.x, B.x, C.x];
    const ys = [A.y, B.y, C.y];
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const dx = maxX - minX || 1;
    const dy = maxY - minY || 1;

    const W = 320, H = 260, pad = 36;
    const scale = Math.min((W - 2 * pad) / dx, (H - 2 * pad) / dy);

    const project = (p) => ({
      x: (p.x - minX) * scale + pad,
      y: H - ((p.y - minY) * scale + pad),
    });

    const pA = project(A), pB = project(B), pC = project(C);
    const centroid = {
      x: (pA.x + pB.x + pC.x) / 3,
      y: (pA.y + pB.y + pC.y) / 3,
    };

    const outward = (p, dist) => {
      const vx = p.x - centroid.x, vy = p.y - centroid.y;
      const len = Math.hypot(vx, vy) || 1;
      return { x: p.x + (vx / len) * dist, y: p.y + (vy / len) * dist };
    };

    const labelA = outward(pA, 16);
    const labelB = outward(pB, 16);
    const labelC = outward(pC, 16);

    const mid = (p1, p2) => ({ x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 });
    const midAB = outward(mid(pA, pB), 12);
    const midAC = outward(mid(pA, pC), 12);
    const midBC = outward(mid(pB, pC), 12);

    return `
      <svg class="triangle-drawing" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
        <polygon class="edge" points="${pA.x},${pA.y} ${pB.x},${pB.y} ${pC.x},${pC.y}" />
        <text class="vertex-label" x="${labelA.x}" y="${labelA.y}" text-anchor="middle">A</text>
        <text class="vertex-label" x="${labelB.x}" y="${labelB.y}" text-anchor="middle">B</text>
        <text class="vertex-label" x="${labelC.x}" y="${labelC.y}" text-anchor="middle">C</text>
        <text class="side-label" x="${midAB.x}" y="${midAB.y}" text-anchor="middle">c = ${fmt(t.c)}</text>
        <text class="side-label" x="${midAC.x}" y="${midAC.y}" text-anchor="middle">b = ${fmt(t.b)}</text>
        <text class="side-label" x="${midBC.x}" y="${midBC.y}" text-anchor="middle">a = ${fmt(t.a)}</text>
        <text class="angle-label" x="${pA.x + (centroid.x - pA.x) * 0.35}" y="${pA.y + (centroid.y - pA.y) * 0.35}" text-anchor="middle">α=${fmt(t.alpha, 1)}°</text>
        <text class="angle-label" x="${pB.x + (centroid.x - pB.x) * 0.35}" y="${pB.y + (centroid.y - pB.y) * 0.35}" text-anchor="middle">β=${fmt(t.beta, 1)}°</text>
        <text class="angle-label" x="${pC.x + (centroid.x - pC.x) * 0.35}" y="${pC.y + (centroid.y - pC.y) * 0.35}" text-anchor="middle">γ=${fmt(t.gamma, 1)}°</text>
      </svg>`;
  }

  function buildSolutionCard(t, index, total) {
    const title = total > 1 ? `Lösung ${index + 1} von ${total}` : "Lösung";
    const badge = t.satz ? t.satz : "keine Kongruenz";
    const sizeNote = t.sizeArbitrary
      ? '<p class="note">Da nur die drei Winkel bekannt sind, ist die Größe frei wählbar (hier: a = 1 LE). Alle ähnlichen Dreiecke mit diesen Winkeln sind ebenso gültig.</p>'
      : "";
    return `
      <div class="solution">
        <div class="solution-header">
          <h3>${title}</h3>
          <span class="badge">${badge}</span>
        </div>
        <p class="note">${t.satzLabel}</p>
        <div class="solution-body">
          <table class="values">
            <tr><th>Seite a</th><td>${fmt(t.a)} LE</td></tr>
            <tr><th>Seite b</th><td>${fmt(t.b)} LE</td></tr>
            <tr><th>Seite c</th><td>${fmt(t.c)} LE</td></tr>
            <tr><th>Winkel α</th><td>${fmt(t.alpha, 2)}°</td></tr>
            <tr><th>Winkel β</th><td>${fmt(t.beta, 2)}°</td></tr>
            <tr><th>Winkel γ</th><td>${fmt(t.gamma, 2)}°</td></tr>
            <tr><th>Umfang</th><td>${fmt(t.perimeter)} LE</td></tr>
            <tr><th>Fläche</th><td>${fmt(t.area)} LE²</td></tr>
            <tr><th>Umkreisradius</th><td>${fmt(t.circumradius)} LE</td></tr>
            <tr><th>Inkreisradius</th><td>${fmt(t.inradius)} LE</td></tr>
            <tr><th colspan="2" class="subhead">Höhen</th></tr>
            <tr><th>h<sub>a</sub></th><td>${fmt(t.ha)} LE</td></tr>
            <tr><th>h<sub>b</sub></th><td>${fmt(t.hb)} LE</td></tr>
            <tr><th>h<sub>c</sub></th><td>${fmt(t.hc)} LE</td></tr>
            <tr><th colspan="2" class="subhead">Seitenhalbierende</th></tr>
            <tr><th>s<sub>a</sub></th><td>${fmt(t.sa)} LE</td></tr>
            <tr><th>s<sub>b</sub></th><td>${fmt(t.sb)} LE</td></tr>
            <tr><th>s<sub>c</sub></th><td>${fmt(t.sc)} LE</td></tr>
            <tr><th colspan="2" class="subhead">Winkelhalbierende</th></tr>
            <tr><th>w<sub>α</sub></th><td>${fmt(t.wa)} LE</td></tr>
            <tr><th>w<sub>β</sub></th><td>${fmt(t.wb)} LE</td></tr>
            <tr><th>w<sub>γ</sub></th><td>${fmt(t.wc)} LE</td></tr>
          </table>
          ${buildTriangleSVG(t)}
        </div>
        ${sizeNote}
      </div>`;
  }

  function render(result) {
    const errorBox = document.getElementById("error-box");
    const resultsCard = document.getElementById("results-card");
    const solutionsEl = document.getElementById("solutions");

    if (result.error) {
      errorBox.textContent = result.error;
      errorBox.hidden = false;
      resultsCard.hidden = true;
      solutionsEl.innerHTML = "";
      return;
    }

    errorBox.hidden = true;
    resultsCard.hidden = false;
    const total = result.solutions.length;
    let html = "";
    if (result.ambiguous) {
      html += `<p class="note">Diese Angaben (zwei Seiten + Gegenwinkel der kürzeren Seite) führen zu zwei möglichen Dreiecken (mehrdeutiger SSW-Fall).</p>`;
    }
    html += result.solutions.map((t, i) => buildSolutionCard(t, i, total)).join("");
    solutionsEl.innerHTML = html;
  }

  function getVal(id) {
    const raw = document.getElementById(id).value.trim();
    if (raw === "") return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : NaN;
  }

  function countFilled() {
    return ["in-a", "in-b", "in-c", "in-alpha", "in-beta", "in-gamma"].filter(
      (id) => document.getElementById(id).value.trim() !== ""
    ).length;
  }

  function updateHint() {
    document.getElementById("input-count-hint").textContent = `Bisher ${countFilled()} von 3 Werten eingegeben.`;
  }

  function handleSubmit(evt) {
    evt.preventDefault();
    const input = {
      a: getVal("in-a"),
      b: getVal("in-b"),
      c: getVal("in-c"),
      alpha: getVal("in-alpha"),
      beta: getVal("in-beta"),
      gamma: getVal("in-gamma"),
    };
    if (Object.values(input).some((v) => Number.isNaN(v))) {
      render({ error: "Bitte nur gültige Zahlen eingeben." });
      return;
    }
    render(solveTriangle(input));
  }

  function handleReset() {
    document.getElementById("triangle-form").reset();
    document.getElementById("results-card").hidden = true;
    document.getElementById("error-box").hidden = true;
    updateHint();
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("triangle-form").addEventListener("submit", handleSubmit);
    document.getElementById("reset-btn").addEventListener("click", handleReset);
    ["in-a", "in-b", "in-c", "in-alpha", "in-beta", "in-gamma"].forEach((id) =>
      document.getElementById(id).addEventListener("input", updateHint)
    );
    updateHint();
  });
})();
