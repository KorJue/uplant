import * as pdfjsLib from "./vendor/pdf.mjs";
import { buildDocx, createZip } from "./docx-writer.js";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL("./vendor/pdf.worker.mjs", import.meta.url).href;

const BODY_SZ = 22; // half-points = 11pt
const HEADING_SZ = { 1: 32, 2: 28, 3: 25, 4: 23 };
const BULLET_RE = /^\s*[•\-\*‣●○▪–]\s+\S/;
const NUMBERED_RE = /^\s*(\(?[0-9]+[.)]|\(?[a-zA-Z][.)]|[IVXLCM]+[.)])\s+\S/;
const HEADING_WORD_RE = /^\s*(Kapitel|Chapter|Abschnitt|Teil|Anhang|Appendix|§\s?\d+)\b/i;

const els = {
  fileInput: document.getElementById("file-input"),
  dropzone: document.getElementById("dropzone"),
  status: document.getElementById("status"),
  progressBar: document.getElementById("progress-bar"),
  progressWrap: document.getElementById("progress-wrap"),
  resultCard: document.getElementById("result-card"),
  tree: document.getElementById("unit-tree"),
  selectAll: document.getElementById("select-all"),
  selectNone: document.getElementById("select-none"),
  exportOne: document.getElementById("export-one"),
  exportZip: document.getElementById("export-zip"),
  errorBox: document.getElementById("error-box"),
  docTitle: document.getElementById("doc-title"),
};

let ROOT = null;
let UNIT_INDEX = new Map();

function setStatus(text) {
  els.status.textContent = text;
}

function setProgress(fraction) {
  els.progressWrap.hidden = fraction == null;
  if (fraction != null) els.progressBar.style.width = `${Math.round(fraction * 100)}%`;
}

function showError(msg) {
  els.errorBox.textContent = msg;
  els.errorBox.hidden = !msg;
}

// ---------- PDF-Extraktion ----------

async function extractLines(pdf) {
  const lines = [];
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    setStatus(`Seite ${pageNum} von ${pdf.numPages} wird analysiert…`);
    setProgress(pageNum / pdf.numPages);
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();

    const items = content.items
      .filter((it) => typeof it.str === "string")
      .map((it) => {
        const [a, b, c, d, e, f] = it.transform;
        const fontSize = Math.hypot(a, b) || Math.hypot(c, d) || 1;
        return { text: it.str, x: e, y: f, fontSize, width: it.width || 0 };
      });

    items.sort((p, q) => q.y - p.y || p.x - q.x);

    let current = null;
    for (const it of items) {
      if (it.text.trim() === "" && it.text !== " ") continue;
      if (current && Math.abs(current.y - it.y) < Math.max(current.fontSize, it.fontSize) * 0.4) {
        const gap = it.x - current.endX;
        if (gap > current.fontSize * 0.15 && !current.text.endsWith(" ") && it.text[0] !== " ") {
          current.text += " ";
        }
        current.text += it.text;
        current.fontSize = Math.max(current.fontSize, it.fontSize);
        current.endX = it.x + it.width;
      } else {
        if (current) lines.push(current);
        current = { text: it.text, x: it.x, endX: it.x + it.width, y: it.y, fontSize: it.fontSize, pageNum };
      }
    }
    if (current) lines.push(current);
  }
  return lines.filter((l) => l.text.trim() !== "");
}

function modeFontSize(lines) {
  const counts = new Map();
  for (const l of lines) {
    const key = Math.round(l.fontSize * 2) / 2;
    counts.set(key, (counts.get(key) || 0) + l.text.length);
  }
  let best = 12,
    bestCount = -1;
  for (const [size, count] of counts) {
    if (count > bestCount) {
      best = size;
      bestCount = count;
    }
  }
  return best;
}

function modeX(lines) {
  const counts = new Map();
  for (const l of lines) {
    const key = Math.round(l.x);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  let best = 0,
    bestCount = -1;
  for (const [x, count] of counts) {
    if (count > bestCount) {
      best = x;
      bestCount = count;
    }
  }
  return best;
}

// ---------- Klassifikation ----------

function classifyLines(lines, bodySize) {
  const headingSizes = new Set();
  for (const l of lines) {
    if (l.fontSize >= bodySize * 1.15 || (HEADING_WORD_RE.test(l.text) && l.text.length < 90)) {
      headingSizes.add(Math.round(l.fontSize * 2) / 2);
    }
  }
  const sortedSizes = [...headingSizes].sort((a, b) => b - a);
  const levelOf = new Map(sortedSizes.slice(0, 4).map((s, i) => [s, i + 1]));

  return lines.map((l) => {
    const size = Math.round(l.fontSize * 2) / 2;
    const isBigHeading = l.fontSize >= bodySize * 1.15 && l.text.length < 140;
    const isWordHeading = HEADING_WORD_RE.test(l.text) && l.text.length < 90;
    if (isBigHeading || isWordHeading) {
      const level = levelOf.get(size) || 4;
      return { ...l, kind: "heading", level };
    }
    if (BULLET_RE.test(l.text)) return { ...l, kind: "bullet" };
    if (NUMBERED_RE.test(l.text)) return { ...l, kind: "numbered" };
    return { ...l, kind: "body" };
  });
}

function stripBullet(text) {
  return text.replace(/^\s*[•\-\*‣●○▪–]\s+/, "").trim();
}
function stripNumbered(text) {
  return text.replace(/^\s*(\(?[0-9]+[.)]|\(?[a-zA-Z][.)]|[IVXLCM]+[.)])\s+/, "").trim();
}

// Erkennt Listen ohne extrahierbares Aufzählungszeichen (z. B. von manchen PDF-Erzeugern) anhand
// von Einrückung + einem erkennbaren Abstand zwischen den Einträgen (z. B. Absatzabstand).
// Liefert null, wenn kein zuverlässiges Muster erkennbar ist (dann bleibt der Text ein normaler Absatz).
function scanIndentedList(classified, i, bodyX, bodySize) {
  const indentThreshold = bodySize * 0.8;
  if (classified[i].kind !== "body" || classified[i].x <= bodyX + indentThreshold) return null;

  const rows = [];
  let j = i;
  while (
    j < classified.length &&
    classified[j].kind === "body" &&
    classified[j].x > bodyX + indentThreshold &&
    (j === i || classified[j].pageNum === classified[j - 1].pageNum)
  ) {
    rows.push(classified[j]);
    j++;
  }
  if (rows.length < 3) return null;

  // Zeilenumbruch (einzeiliger Abstand) vs. neuer Punkt (Abstand + Absatzabstand): dieselbe
  // Schwelle wie bei der normalen Absatzerkennung verwenden, statt eines Medianwerts, der bei
  // mehr umgebrochenen als neuen Zeilen in die falsche Richtung kippen würde.
  const items = [[rows[0].text.trim()]];
  for (let k = 1; k < rows.length; k++) {
    const gap = rows[k - 1].y - rows[k].y;
    if (gap > rows[k].fontSize * 1.8) items.push([rows[k].text.trim()]);
    else items[items.length - 1].push(rows[k].text.trim());
  }
  if (items.length < 3) return null;

  return {
    endIndex: j,
    items: items.map((parts) => parts.join(" ")),
    startPage: rows[0].pageNum,
    endPage: rows[rows.length - 1].pageNum,
  };
}

// Fasst body-Zeilen zu Absätzen und aufeinanderfolgende bullet/numbered-Zeilen zu Listen zusammen.
function buildBlocks(classified, bodySize) {
  const bodyX = modeX(classified.filter((l) => l.kind === "body"));
  const blocks = [];
  let i = 0;
  while (i < classified.length) {
    const l = classified[i];
    if (l.kind === "heading") {
      const parts = [l.text.trim()];
      const pageNum = l.pageNum;
      let prevY = l.y;
      let prevSize = l.fontSize;
      let endPage = l.pageNum;
      i++;
      while (
        i < classified.length &&
        classified[i].kind === "heading" &&
        classified[i].level === l.level &&
        classified[i].pageNum === endPage &&
        Math.abs(classified[i].fontSize - prevSize) < 0.5 &&
        prevY - classified[i].y < prevSize * 1.8 &&
        prevY - classified[i].y > 0
      ) {
        parts.push(classified[i].text.trim());
        prevY = classified[i].y;
        prevSize = classified[i].fontSize;
        i++;
      }
      blocks.push({ type: "heading", level: l.level, text: parts.join(" "), pageNum });
      continue;
    }
    if (l.kind === "body") {
      const indented = scanIndentedList(classified, i, bodyX, bodySize);
      if (indented) {
        blocks.push({
          type: "list",
          ordered: false,
          items: indented.items,
          startPage: indented.startPage,
          endPage: indented.endPage,
          long: indented.items.length >= 3,
        });
        i = indented.endIndex;
        continue;
      }
    }
    if (l.kind === "bullet" || l.kind === "numbered") {
      const kind = l.kind;
      const strip = kind === "bullet" ? stripBullet : stripNumbered;
      const items = [strip(l.text)];
      const startPage = l.pageNum;
      let endPage = l.pageNum;
      let prevY = l.y;
      let prevSize = l.fontSize;
      i++;
      while (i < classified.length) {
        const n = classified[i];
        if (n.kind === kind) {
          items.push(strip(n.text));
          endPage = n.pageNum;
          prevY = n.y;
          prevSize = n.fontSize;
          i++;
          continue;
        }
        // Zeilenumbruch innerhalb eines Listenpunkts (Fortsetzungszeile ohne eigenes Aufzählungszeichen).
        const isWrappedContinuation =
          n.kind === "body" &&
          n.pageNum === endPage &&
          Math.abs(n.fontSize - prevSize) < 0.5 &&
          prevY - n.y < prevSize * 1.8 &&
          prevY - n.y > 0;
        if (isWrappedContinuation) {
          items[items.length - 1] += " " + n.text.trim();
          endPage = n.pageNum;
          prevY = n.y;
          prevSize = n.fontSize;
          i++;
          continue;
        }
        break;
      }
      blocks.push({
        type: "list",
        ordered: kind === "numbered",
        items,
        startPage,
        endPage,
        long: items.length >= 3,
      });
      continue;
    }
    // body: fortlaufende Zeilen zu einem Absatz zusammenfassen
    const parts = [l.text.trim()];
    const startPage = l.pageNum;
    let endPage = l.pageNum;
    let prevY = l.y;
    let prevSize = l.fontSize;
    i++;
    while (i < classified.length && classified[i].kind === "body") {
      const n = classified[i];
      const sameParagraph =
        n.pageNum === endPage &&
        Math.abs(n.fontSize - prevSize) < 0.5 &&
        prevY - n.y < prevSize * 1.8 &&
        prevY - n.y > 0;
      if (!sameParagraph && n.pageNum === endPage) break;
      parts.push(n.text.trim());
      endPage = n.pageNum;
      prevY = n.y;
      prevSize = n.fontSize;
      i++;
    }
    blocks.push({ type: "paragraph", text: parts.join(" "), startPage, endPage });
  }
  return blocks;
}

// ---------- Baumaufbau ----------

let unitCounter = 0;

function newUnit(title, level, pageNum) {
  unitCounter++;
  return {
    id: `u${unitCounter}`,
    title,
    level,
    startPage: pageNum,
    endPage: pageNum,
    content: [],
    children: [],
  };
}

function buildTree(blocks) {
  const root = newUnit("Dokument", 0, blocks[0] ? blocks[0].pageNum || blocks[0].startPage : 1);
  const stack = [root];

  for (const b of blocks) {
    if (b.type === "heading") {
      while (stack.length > 1 && stack[stack.length - 1].level >= b.level) stack.pop();
      const parent = stack[stack.length - 1];
      const unit = newUnit(b.text, b.level, b.pageNum);
      parent.children.push(unit);
      stack.push(unit);
      continue;
    }
    const target = stack[stack.length - 1];
    target.content.push(b);
    const endPage = b.endPage || b.pageNum;
    if (endPage > target.endPage) target.endPage = endPage;

    if (b.type === "list" && b.long) {
      // Zusätzlich als eigene, separat auswählbare Einheit für die UI abbilden (referenziert
      // denselben Block). Der Inhalt bleibt in target.content, damit die Dokumentreihenfolge beim
      // Export der Elterneinheit erhalten bleibt; unitToDocxBlocks überspringt daher beim
      // Rekursieren in children gezielt isStandaloneList-Einheiten, um Duplikate zu vermeiden.
      const listUnit = newUnit(`Liste (${b.items.length} Punkte)`, target.level + 1, b.startPage);
      listUnit.endPage = b.endPage;
      listUnit.content.push(b);
      listUnit.isStandaloneList = true;
      target.children.push(listUnit);
    }
  }
  return root;
}

function indexUnits(unit, map) {
  map.set(unit.id, unit);
  for (const c of unit.children) indexUnits(c, map);
}

// ---------- UI: Baum rendern ----------

function pageRangeLabel(u) {
  return u.startPage === u.endPage ? `S. ${u.startPage}` : `S. ${u.startPage}–${u.endPage}`;
}

function previewText(u) {
  const p = u.content.find((b) => b.type === "paragraph" || b.type === "list");
  if (!p) return "";
  const text = p.type === "paragraph" ? p.text : p.items.join(", ");
  return text.length > 120 ? text.slice(0, 120) + "…" : text;
}

function renderUnit(u, depth) {
  const wrap = document.createElement("div");
  wrap.className = "unit-row";
  wrap.style.marginLeft = `${depth * 1.25}rem`;

  const label = document.createElement("label");
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.dataset.unitId = u.id;
  checkbox.checked = true;

  const titleSpan = document.createElement("span");
  titleSpan.className = "unit-title";
  const kindBadge = u.isStandaloneList ? " · Liste" : u.level === 0 ? "" : ` · Ebene ${u.level}`;
  titleSpan.textContent = `${u.title} (${pageRangeLabel(u)}${kindBadge})`;

  label.appendChild(checkbox);
  label.appendChild(titleSpan);
  wrap.appendChild(label);

  const prev = previewText(u);
  if (prev) {
    const p = document.createElement("p");
    p.className = "unit-preview";
    p.textContent = prev;
    wrap.appendChild(p);
  }

  els.tree.appendChild(wrap);
  for (const child of u.children) renderUnit(child, depth + 1);
}

function renderTree(root) {
  els.tree.innerHTML = "";

  const introHasContent = root.content.some(
    (b) => (b.type === "paragraph" && b.text.trim()) || (b.type === "list" && b.items.length)
  );
  if (introHasContent) {
    const title = root.children.length === 0 ? "Gesamtes Dokument" : "Einleitung (vor erster Überschrift)";
    const intro = newUnit(title, 1, root.startPage);
    intro.content = root.content;
    intro.endPage = root.content.reduce((m, b) => Math.max(m, b.endPage || b.pageNum || m), root.startPage);
    UNIT_INDEX.set(intro.id, intro);
    root.children.unshift(intro);
  }

  for (const child of root.children) renderUnit(child, 0);
}

// ---------- Auswahl → DOCX-Blöcke ----------

function unitToDocxBlocks(u, isTop) {
  const blocks = [];
  // isStandaloneList-Einheiten sind eine reine UI-Auswahlhilfe (kein Titel im Original-PDF) –
  // keine erfundene Überschrift ins Dokument schreiben.
  if (isTop && u.level > 0 && !u.isStandaloneList) {
    blocks.push({ type: "heading", level: Math.min(4, u.level), runs: [{ text: u.title, sizeHalfPt: HEADING_SZ[Math.min(4, u.level)] }] });
  }
  for (const b of u.content) {
    if (b.type === "paragraph") {
      if (!b.text.trim()) continue;
      blocks.push({ type: "paragraph", runs: [{ text: b.text, sizeHalfPt: BODY_SZ }] });
    } else if (b.type === "list") {
      for (const item of b.items) {
        blocks.push({ type: "list", ordered: b.ordered, runs: [{ text: item, sizeHalfPt: BODY_SZ }] });
      }
    }
  }
  for (const child of u.children) {
    // isStandaloneList-Kinder sind nur eine UI-Auswahlhilfe; ihr Inhalt steckt bereits in
    // u.content (s. o.) und würde hier sonst dupliziert – außer sie wurden explizit als eigener
    // Export-Startpunkt gewählt (dann ist isTop bereits true und wir landen gar nicht hier).
    if (child.isStandaloneList) continue;
    blocks.push(...unitToDocxBlocks(child, true));
  }
  return blocks;
}

function getSelectedTopUnits() {
  const checked = [...els.tree.querySelectorAll("input[type=checkbox]:checked")].map((cb) => cb.dataset.unitId);
  const checkedSet = new Set(checked);

  function isDescendantOfSelected(unit, ancestors) {
    return ancestors.some((a) => a !== unit && isDescendant(a, unit));
  }
  function isDescendant(possibleAncestor, unit) {
    for (const c of possibleAncestor.children) {
      if (c.id === unit.id) return true;
      if (isDescendant(c, unit)) return true;
    }
    return false;
  }

  const checkedUnits = checked.map((id) => UNIT_INDEX.get(id)).filter(Boolean);
  const top = checkedUnits.filter((u) => !isDescendantOfSelected(u, checkedUnits));
  return top;
}

function sanitizeFilename(name) {
  return (
    name
      .normalize("NFKD")
      .replace(/[^\w\säöüÄÖÜß.-]/g, "")
      .trim()
      .replace(/\s+/g, "_")
      .slice(0, 80) || "abschnitt"
  );
}

function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

els.selectAll.addEventListener("click", () => {
  els.tree.querySelectorAll("input[type=checkbox]").forEach((cb) => (cb.checked = true));
});
els.selectNone.addEventListener("click", () => {
  els.tree.querySelectorAll("input[type=checkbox]").forEach((cb) => (cb.checked = false));
});

els.exportOne.addEventListener("click", () => {
  const top = getSelectedTopUnits();
  if (!top.length) return;
  const blocks = [];
  for (const u of top) blocks.push(...unitToDocxBlocks(u, true));
  const baseTitle = els.docTitle.value || "Export";
  const bytes = buildDocx(baseTitle, blocks);
  download(new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }), `${sanitizeFilename(baseTitle)}.docx`);
});

els.exportZip.addEventListener("click", () => {
  const top = getSelectedTopUnits();
  if (!top.length) return;
  const usedNames = new Set();
  const files = top.map((u) => {
    const blocks = unitToDocxBlocks(u, true);
    const bytes = buildDocx(u.title, blocks);
    let name = sanitizeFilename(u.title) + ".docx";
    let n = 2;
    while (usedNames.has(name)) {
      name = `${sanitizeFilename(u.title)}_${n}.docx`;
      n++;
    }
    usedNames.add(name);
    return { name, data: bytes };
  });
  const zipBytes = createZip(files);
  download(new Blob([zipBytes], { type: "application/zip" }), `${sanitizeFilename(els.docTitle.value || "Export")}.zip`);
});

// ---------- Ablauf ----------

async function handleFile(file) {
  showError("");
  els.resultCard.hidden = true;
  els.docTitle.value = file.name.replace(/\.pdf$/i, "");
  setStatus("PDF wird geladen…");
  setProgress(0);
  try {
    const buf = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({
      data: buf,
      cMapUrl: new URL("./vendor/cmaps/", import.meta.url).href,
      cMapPacked: true,
      standardFontDataUrl: new URL("./vendor/standard_fonts/", import.meta.url).href,
    }).promise;
    const lines = await extractLines(pdf);
    if (!lines.length) {
      showError("Im PDF wurde kein extrahierbarer Text gefunden (evtl. ein gescanntes Dokument ohne Texterkennung).");
      setStatus("");
      setProgress(null);
      return;
    }
    const bodySize = modeFontSize(lines);
    const classified = classifyLines(lines, bodySize);
    const blocks = buildBlocks(classified, bodySize);
    ROOT = buildTree(blocks);
    UNIT_INDEX = new Map();
    indexUnits(ROOT, UNIT_INDEX);

    renderTree(ROOT);
    els.resultCard.hidden = false;
    setStatus(`Fertig: ${pdf.numPages} Seiten analysiert, ${UNIT_INDEX.size - 1} Abschnitte erkannt.`);
    setProgress(null);
  } catch (err) {
    console.error(err);
    const isPassword = err && err.name === "PasswordException";
    showError(
      isPassword
        ? "Dieses PDF ist passwortgeschützt. Passwortgeschützte PDFs werden nicht unterstützt."
        : `Fehler beim Verarbeiten des PDFs: ${err && err.message ? err.message : err}`
    );
    setStatus("");
    setProgress(null);
  }
}

els.fileInput.addEventListener("change", (e) => {
  const file = e.target.files && e.target.files[0];
  if (file) handleFile(file);
});

["dragenter", "dragover"].forEach((evt) =>
  els.dropzone.addEventListener(evt, (e) => {
    e.preventDefault();
    els.dropzone.classList.add("dragover");
  })
);
["dragleave", "drop"].forEach((evt) =>
  els.dropzone.addEventListener(evt, (e) => {
    e.preventDefault();
    els.dropzone.classList.remove("dragover");
  })
);
els.dropzone.addEventListener("drop", (e) => {
  const file = e.dataTransfer.files && e.dataTransfer.files[0];
  if (file) handleFile(file);
});
els.dropzone.addEventListener("click", () => els.fileInput.click());
