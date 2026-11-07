// Selbsteinschätzung am Ende eines Lernpfads (Abschnitt #sec-selbsteinschaetzung) — nach den
// Übungsaufgaben, damit sie auswerten kann, was dort und in den Kontrollfragen geschehen ist.
//
// Die Ich-kann-Sätze stehen als Liste im HTML, jeder mit dem Abschnitt, in dem das Ziel
// erarbeitet wird:  <li data-abschnitt="sec-satz">Ich kann …</li>
// Ohne Skript bleibt wenigstens die Liste als Prüfliste stehen.
//
// Das Skript macht aus jedem Satz eine Zeile mit drei Knöpfen (😀 sicher, 😐 teilweise,
// 🤔 noch unsicher) und stellt daneben, was die Seite über diesen Abschnitt schon weiß:
//   * die KONTROLLFRAGEN des Abschnitts — zählt, ob sie beim ersten Versuch stimmten;
//   * die ÜBUNGSAUFGABEN, die mathematik/aufgaben.js dem Abschnitt zuordnet — zählt, welche gelöst
//     sind und an welchen es bisher nur Fehlversuche gab.
// Beides sammelt das Skript auf der ganzen Seite mit, auch bevor jemand hier unten ankommt: Die
// Kontrollfragen über einen Klick-Lauscher (alle Seiten bauen sie gleich: .quiz > .quiz-opt, danach
// .quiz-feedback ok/err), die Aufgaben über das Ereignis „uplant:aufgabe“.
//
// Die Rückmeldung darunter nennt die Abschnitte, die zu wiederholen sind — die eigene Einschätzung
// und das, was die Seite gesehen hat, zusammen —, weist auf Widersprüche hin („sicher“, aber die
// Kontrollfrage ging daneben), nennt Voraussetzungen aus früheren Themen und empfiehlt eine Stufe
// der Übungsaufgaben. Voraussetzungen sind die Verweise auf andere Seiten, die IN den betroffenen
// Abschnitten stehen — dort, wo der Stoff gebraucht wird —, ersatzweise die aus „Du brauchst …“
// am Seitenanfang, sonst die „Baut auf“-Einträge der Vernetzung.
//
// Alles bleibt nur in diesem Browser gespeichert, je Seite unter eigenem Schlüssel.
(function () {
  "use strict";

  var STUFEN = [["sicher", "😀", "sicher"], ["teils", "😐", "teilweise"], ["unsicher", "🤔", "noch unsicher"]];

  function schluessel(art) {
    return "uplant-" + art + ":" + location.pathname;
  }
  function lies(art) {
    try { return JSON.parse(localStorage.getItem(schluessel(art)) || "{}") || {}; } catch (e) { return {}; }
  }
  function schreib(art, stand) {
    try { localStorage.setItem(schluessel(art), JSON.stringify(stand)); } catch (e) { /* ohne Speicher geht es auch */ }
  }
  // Der Lernstand: { quiz: { id: { abschnitt, erst, zuletzt } }, aufgaben: { titel: { abschnitte, richtig, falsch } } }
  function lernstand() {
    var s = lies("lernstand");
    s.quiz = s.quiz || {};
    s.aufgaben = s.aufgaben || {};
    return s;
  }

  var neuZeichnen = function () {};

  // ---- Mitschreiben: Kontrollfragen ----
  // Der Lauscher sitzt am Dokument und läuft in der Bubbling-Phase, also NACH dem Klick-Handler der
  // Seite am Knopf selbst — die Rückmeldung (.quiz-feedback ok/err) steht dann schon.
  document.addEventListener("click", function (e) {
    var knopf = e.target && e.target.closest ? e.target.closest(".quiz-opt") : null;
    if (!knopf) return;
    var quiz = knopf.closest(".quiz");
    var abschnitt = quiz && quiz.closest("section[id]");
    var rueck = quiz && quiz.querySelector(".quiz-feedback");
    if (!quiz || !quiz.id || !abschnitt || !rueck) return;
    var ok = rueck.classList.contains("ok");
    if (!ok && !rueck.classList.contains("err")) return;
    var s = lernstand();
    var q = s.quiz[quiz.id] || { abschnitt: abschnitt.id };
    if (q.erst === undefined) q.erst = ok;   // zählt für die Auswertung: der erste Versuch
    q.zuletzt = ok;
    s.quiz[quiz.id] = q;
    schreib("lernstand", s);
    neuZeichnen();
  });

  // ---- Mitschreiben: Übungsaufgaben ----
  document.addEventListener("uplant:aufgabe", function (e) {
    var d = e.detail || {};
    if (!d.titel || !d.abschnitte || !d.abschnitte.length) return;
    var s = lernstand();
    var a = s.aufgaben[d.titel] || { abschnitte: d.abschnitte, richtig: 0, falsch: 0 };
    a.abschnitte = d.abschnitte;
    if (d.richtig) a.richtig++;
    else a.falsch++;
    s.aufgaben[d.titel] = a;
    schreib("lernstand", s);
    neuZeichnen();
  });

  // ---- Was die Seite über einen Abschnitt weiß ----
  function beleg(id) {
    var s = lernstand();
    // Kontrollfragen in optionalen Teilen zählen nicht: Wer sie überspringen darf, soll dafür nicht
    // als „noch offen“ dastehen.
    var quizIds = Array.prototype.filter.call(document.querySelectorAll("#" + id + " .quiz[id]"), function (q) {
      return !q.closest(".optional-teil");
    }).map(function (q) { return q.id; });
    var quizRichtig = 0, quizFalsch = 0;
    quizIds.forEach(function (q) {
      var x = s.quiz[q];
      if (!x || x.erst === undefined) return;
      if (x.erst) quizRichtig++; else quizFalsch++;
    });
    var geloest = 0, nurFalsch = 0;
    Object.keys(s.aufgaben).forEach(function (t) {
      var a = s.aufgaben[t];
      if (a.abschnitte.indexOf(id) < 0) return;
      if (a.richtig > 0) geloest++;
      else if (a.falsch > 0) nurFalsch++;
    });
    var schwach = quizFalsch > 0 || nurFalsch > 0;
    var stark = !schwach && quizIds.length > 0 && quizRichtig === quizIds.length && geloest > 0;
    return { quiz: quizIds.length, quizRichtig: quizRichtig, quizFalsch: quizFalsch, geloest: geloest, nurFalsch: nurFalsch, schwach: schwach, stark: stark };
  }

  function belegText(b) {
    var teile = [];
    if (b.quiz === 1) {
      teile.push(b.quizRichtig ? "Kontrollfrage ✓ beim ersten Versuch richtig"
        : b.quizFalsch ? "Kontrollfrage ✗ beim ersten Versuch falsch" : "Kontrollfrage noch offen");
    } else if (b.quiz > 1) {
      var offen = b.quiz - b.quizRichtig - b.quizFalsch;
      teile.push(offen === b.quiz ? "Kontrollfragen noch offen"
        : "Kontrollfragen " + (b.quizFalsch ? "✗ " : "✓ ") + b.quizRichtig + " von " + b.quiz +
          " beim ersten Versuch richtig" + (offen ? ", " + offen + " noch offen" : ""));
    }
    if (b.geloest || b.nurFalsch) {
      teile.push("Aufgaben: " + b.geloest + " gelöst" + (b.nurFalsch ? ", " + b.nurFalsch + " noch nicht" : ""));
    }
    return teile.join(" · ");
  }

  // ---- Bausteine der Rückmeldung ----
  // Verweis auf einen Abschnitt, beschriftet mit seiner Überschrift — samt Auszeichnung (e<sup>kx</sup>),
  // aber ohne die Kursmarken der MSS-Seiten („GK + LK“).
  function abschnittVerweis(id) {
    var a = document.createElement("a");
    a.href = "#" + id;
    var h2 = document.querySelector("#" + id + " h2");
    if (!h2) { a.textContent = id; return a; }
    var kopie = h2.cloneNode(true);
    Array.prototype.forEach.call(kopie.querySelectorAll(".kurs-marke"), function (m) { m.remove(); });
    while (kopie.firstChild) a.appendChild(kopie.firstChild);
    // Leerraum am Ende, den die entfernte Marke hinterlässt.
    if (a.lastChild && a.lastChild.nodeType === 3) a.lastChild.textContent = a.lastChild.textContent.replace(/\s+$/, "");
    return a;
  }
  function verweis(href, text) {
    var a = document.createElement("a");
    a.href = href;
    a.textContent = text;
    return a;
  }
  function liste(ziel, eintraege) {
    eintraege.forEach(function (e, i) {
      if (i) ziel.appendChild(document.createTextNode(", "));
      ziel.appendChild(e);
    });
  }
  function satz(ziel, teile) {
    teile.forEach(function (t) { ziel.appendChild(typeof t === "string" ? document.createTextNode(t) : t); });
  }
  function absatz(aus) {
    var p = document.createElement("p");
    aus.appendChild(p);
    return p;
  }
  // Verweise auf andere Seiten in den genannten Abschnitten — die Voraussetzungen, dort, wo sie
  // gebraucht werden. Ersatzweise die aus dem Hinweis „Du brauchst …“ am Seitenanfang, sonst die
  // „Baut auf“-Einträge der Vernetzung.
  function voraussetzungen(ids) {
    var gesehen = {}, out = [];
    function sammle(wurzel) {
      Array.prototype.forEach.call(wurzel.querySelectorAll("a[href]"), function (a) {
        var href = a.getAttribute("href");
        if (!href || href.charAt(0) === "#" || /^(https?:|mailto:)/.test(href) || a.closest(".quiz, .uebung-sprung")) return;
        // Ein Verweis, der nur „4“ heißt (Teil von „Abschnitte 3 und 4“), sagt allein nichts.
        if (!/[A-Za-zÄÖÜäöüß]{3}/.test(a.textContent)) return;
        var ziel = href.split("#")[0];
        if (gesehen[href] || gesehen[ziel + "|" + a.textContent.trim()]) return;
        gesehen[href] = gesehen[ziel + "|" + a.textContent.trim()] = true;
        out.push(verweis(href, a.textContent.trim()));
      });
    }
    ids.forEach(function (id) { var s = document.getElementById(id); if (s) sammle(s); });
    if (!out.length) {
      var intro = document.querySelector("main > section.card:first-of-type .hinweis-box");
      if (intro) sammle(intro);
    }
    // Zuletzt die „Baut auf“-Einträge der Vernetzung: Sie verlinken immer die früheren Themen.
    if (!out.length) {
      Array.prototype.forEach.call(document.querySelectorAll("#sec-vernetzung li"), function (li) {
        if (/^\s*Baut auf/.test(li.textContent)) sammle(li);
      });
    }
    return out.slice(0, 6);
  }
  function uebungen() {
    return verweis("#sec-uebungen", "Übungsaufgaben");
  }

  function auswerten(abschnitt, punkte) {
    var aus = abschnitt.querySelector(".se-auswertung");
    if (!aus) return;
    var stand = lies("selbsteinschaetzung");
    aus.textContent = "";

    var info = punkte.map(function (p) { return { p: p, wahl: stand[p.schluessel], b: beleg(p.abschnitt) }; });
    var angekreuzt = info.filter(function (x) { return x.wahl; });
    var gesehen = info.filter(function (x) { return x.b.quizRichtig + x.b.quizFalsch + x.b.geloest + x.b.nurFalsch > 0; });
    if (!angekreuzt.length && !gesehen.length) {
      aus.textContent = "Noch nichts angekreuzt. Was du in den Kontrollfragen und Übungsaufgaben gemacht hast, steht schon neben jedem Punkt, sobald es etwas gibt.";
      return;
    }

    // Was zu wiederholen ist: 🤔 oder ein schwacher Beleg zuerst, dann 😐.
    var ids = function (l) {
      var out = [];
      l.forEach(function (x) { if (out.indexOf(x.p.abschnitt) < 0) out.push(x.p.abschnitt); });
      return out;
    };
    var dringend = info.filter(function (x) { return x.wahl === "unsicher" || x.b.schwach; });
    var teils = info.filter(function (x) { return x.wahl === "teils" && !x.b.schwach; });
    var widerspruch = info.filter(function (x) { return x.wahl === "sicher" && x.b.schwach; });

    if (dringend.length) {
      var p1 = absatz(aus);
      satz(p1, ["Wiederhole zuerst: "]);
      liste(p1, ids(dringend).map(abschnittVerweis));
      satz(p1, [". Danach passen die ", uebungen(), " auf den Stufen „einfach“ und „mittel“."]);
    } else if (teils.length) {
      var p2 = absatz(aus);
      satz(p2, ["Sieh dir noch einmal an: "]);
      liste(p2, ids(teils).map(abschnittVerweis));
      satz(p2, [". Danach passen die ", uebungen(), " auf den Stufen „mittel“ und „schwierig“."]);
    } else if (angekreuzt.length === punkte.length) {
      satz(absatz(aus), ["Alle " + punkte.length + " Punkte sicher — probier dich an den ", uebungen(), " auf den Stufen „schwierig“ und „komplex“."]);
    } else {
      // Hier sind alle angekreuzten Punkte „sicher“ (sonst griffe ein Zweig oben).
      var offen = punkte.length - angekreuzt.length;
      satz(absatz(aus), [angekreuzt.length + " von " + punkte.length + " Punkten sicher, " +
        (offen === 1 ? "einer ist" : offen + " sind") + " noch nicht angekreuzt."]);
    }

    if (widerspruch.length) {
      var p3 = absatz(aus);
      p3.className = "se-widerspruch";
      satz(p3, ["Du hast dich sicher eingeschätzt, aber Kontrollfrage oder Aufgaben sagen etwas anderes bei: "]);
      liste(p3, ids(widerspruch).map(abschnittVerweis));
      satz(p3, [". Lies dort noch einmal nach, bevor du weitergehst."]);
    }

    var wiederholen = ids(dringend.concat(teils));
    if (wiederholen.length) {
      var vor = voraussetzungen(wiederholen);
      if (vor.length) {
        var p4 = absatz(aus);
        p4.className = "se-voraussetzungen";
        satz(p4, ["Hakt es schon an den Grundlagen, hilft ein Blick in frühere Themen: "]);
        liste(p4, vor);
        satz(p4, ["."]);
      }
    }
  }

  function aufbauen(abschnitt) {
    var punkte = [];
    abschnitt.querySelectorAll("li[data-abschnitt]").forEach(function (li, i) {
      var text = li.textContent.trim();
      // Der Satz behält seine Auszeichnung (e<sup>kx</sup>); er steht als fester Text im HTML.
      var html = li.innerHTML.trim();
      // Schlüssel aus Abschnitt und Position: Zwei Ziele aus demselben Abschnitt bleiben getrennt.
      var p = { abschnitt: li.getAttribute("data-abschnitt"), schluessel: li.getAttribute("data-abschnitt") + "#" + i };
      punkte.push(p);
      li.textContent = "";
      li.className = "se-zeile";
      var span = document.createElement("span");
      span.className = "se-text";
      span.innerHTML = html;
      var belegEl = document.createElement("span");
      belegEl.className = "se-beleg";
      p.belegEl = belegEl;
      var knoepfe = document.createElement("div");
      knoepfe.className = "se-knoepfe";
      knoepfe.setAttribute("role", "group");
      knoepfe.setAttribute("aria-label", text);
      STUFEN.forEach(function (s) {
        var b = document.createElement("button");
        b.type = "button";
        b.textContent = s[1];
        b.title = s[2];
        b.setAttribute("aria-label", s[2]);
        b.setAttribute("data-wert", s[0]);
        b.addEventListener("click", function () {
          var stand = lies("selbsteinschaetzung");
          stand[p.schluessel] = s[0];
          schreib("selbsteinschaetzung", stand);
          knoepfe.querySelectorAll("button").forEach(function (k) {
            k.setAttribute("aria-pressed", String(k === b));
          });
          auswerten(abschnitt, punkte);
        });
        knoepfe.appendChild(b);
      });
      // Satz und Beleg stehen zusammen links, die Knöpfe rechts. Der Beleg steht NEBEN .se-text, nicht
      // darin: Der Satz bleibt so, wie er im HTML steht.
      var satzEl = document.createElement("div");
      satzEl.className = "se-satz";
      satzEl.appendChild(span);
      satzEl.appendChild(belegEl);
      li.appendChild(satzEl);
      li.appendChild(knoepfe);
    });
    var stand = lies("selbsteinschaetzung");
    punkte.forEach(function (p, i) {
      abschnitt.querySelectorAll(".se-zeile")[i].querySelectorAll("button").forEach(function (b) {
        b.setAttribute("aria-pressed", String(stand[p.schluessel] === b.getAttribute("data-wert")));
      });
    });

    // Zurücksetzen: eigene Einschätzung und Lernstand dieser Seite.
    var zurueck = document.createElement("button");
    zurueck.type = "button";
    zurueck.className = "btn se-zuruecksetzen";
    zurueck.textContent = "↺ Einschätzung und Lernstand dieser Seite zurücksetzen";
    zurueck.addEventListener("click", function () {
      try {
        localStorage.removeItem(schluessel("selbsteinschaetzung"));
        localStorage.removeItem(schluessel("lernstand"));
      } catch (e) { /* ohne Speicher gibt es nichts zurückzusetzen */ }
      abschnitt.querySelectorAll(".se-knoepfe button").forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
      neuZeichnen();
    });
    var aus = abschnitt.querySelector(".se-auswertung");
    if (aus) aus.parentNode.insertBefore(zurueck, aus.nextSibling);

    neuZeichnen = function () {
      punkte.forEach(function (p) {
        var b = beleg(p.abschnitt);
        var t = belegText(b);
        p.belegEl.textContent = t;
        p.belegEl.hidden = !t;
        p.belegEl.className = "se-beleg" + (b.schwach ? " se-beleg-schwach" : b.stark ? " se-beleg-stark" : "");
      });
      auswerten(abschnitt, punkte);
    };
    abschnitt.classList.add("se-bereit");
    neuZeichnen();
  }

  function start() {
    var abschnitt = document.getElementById("sec-selbsteinschaetzung");
    if (abschnitt && abschnitt.querySelector(".se-liste")) aufbauen(abschnitt);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
