// Selbsteinschätzung am Ende eines Lernpfads (Abschnitt #sec-selbsteinschaetzung).
//
// Die Ich-kann-Sätze stehen als Liste im HTML, jeder mit dem Abschnitt, in dem das Ziel
// erarbeitet wird:  <li data-abschnitt="sec-satz">Ich kann …</li>
// Sie sind dieselben Ziele wie in „Worum geht es hier?“ — Lernziel und Selbstkontrolle passen
// so zueinander, und ohne Skript bleibt wenigstens die Liste als Prüfliste stehen.
//
// Das Skript macht aus jedem Satz eine Zeile mit drei Knöpfen (😀 sicher, 😐 teilweise,
// 🤔 noch unsicher) und gibt darunter eine Rückmeldung: Wo es hakt, führt ein Verweis zurück
// in den Abschnitt; sonst steht dort, welche Stufe der Übungsaufgaben jetzt passt.
// Die Auswahl bleibt nur in diesem Browser gespeichert, je Seite unter eigenem Schlüssel.
(function () {
  "use strict";

  var STUFEN = [["sicher", "😀", "sicher"], ["teils", "😐", "teilweise"], ["unsicher", "🤔", "noch unsicher"]];

  function schluessel() {
    return "uplant-selbsteinschaetzung:" + location.pathname;
  }
  function lies() {
    try { return JSON.parse(localStorage.getItem(schluessel()) || "{}") || {}; } catch (e) { return {}; }
  }
  function schreib(stand) {
    try { localStorage.setItem(schluessel(), JSON.stringify(stand)); } catch (e) { /* ohne Speicher geht es auch */ }
  }

  // Verweis auf den Abschnitt, beschriftet mit seiner Überschrift.
  function verweis(id) {
    var h2 = document.querySelector("#" + id + " h2");
    var a = document.createElement("a");
    a.href = "#" + id;
    a.textContent = h2 ? h2.textContent.trim() : id;
    return a;
  }
  function verweisListe(ziel, ids) {
    var gesehen = [];
    ids.forEach(function (id) {
      if (gesehen.indexOf(id) >= 0) return;   // zwei Ziele aus demselben Abschnitt: einmal nennen
      if (gesehen.length) ziel.appendChild(document.createTextNode(", "));
      ziel.appendChild(verweis(id));
      gesehen.push(id);
    });
  }
  function uebungen() {
    var a = document.createElement("a");
    a.href = "#sec-uebungen";
    a.textContent = "Übungsaufgaben";
    return a;
  }
  function satz(ziel, teile) {
    teile.forEach(function (t) { ziel.appendChild(typeof t === "string" ? document.createTextNode(t) : t); });
  }

  function auswerten(abschnitt, punkte) {
    var aus = abschnitt.querySelector(".se-auswertung");
    if (!aus) return;
    var stand = lies();
    var mit = function (wert) { return punkte.filter(function (p) { return stand[p.schluessel] === wert; }); };
    var unsicher = mit("unsicher"), teils = mit("teils"), sicher = mit("sicher");
    var ids = function (liste) { return liste.map(function (p) { return p.abschnitt; }); };
    aus.textContent = "";
    if (!unsicher.length && !teils.length && !sicher.length) {
      aus.textContent = "Noch nichts angekreuzt.";
    } else if (unsicher.length) {
      satz(aus, ["Wiederhole zuerst: "]);
      verweisListe(aus, ids(unsicher));
      satz(aus, [". Danach passen die ", uebungen(), " auf den Stufen „einfach“ und „mittel“."]);
    } else if (teils.length) {
      satz(aus, ["Sieh dir noch einmal an: "]);
      verweisListe(aus, ids(teils));
      satz(aus, [". Danach passen die ", uebungen(), " auf den Stufen „mittel“ und „schwierig“."]);
    } else if (sicher.length === punkte.length) {
      satz(aus, ["Alle " + punkte.length + " Punkte sicher — probier dich an den ", uebungen(), " auf den Stufen „schwierig“ und „komplex“."]);
    } else {
      var offen = punkte.length - sicher.length;
      aus.textContent = sicher.length + " von " + punkte.length + " Punkten sicher, " +
        (offen === 1 ? "einer ist" : offen + " sind") + " noch nicht angekreuzt.";
    }
  }

  function aufbauen(abschnitt) {
    var punkte = [];
    abschnitt.querySelectorAll("li[data-abschnitt]").forEach(function (li, i) {
      var text = li.textContent.trim();
      // Schlüssel aus Abschnitt und Position: Zwei Ziele aus demselben Abschnitt bleiben getrennt.
      var p = { abschnitt: li.getAttribute("data-abschnitt"), schluessel: li.getAttribute("data-abschnitt") + "#" + i };
      punkte.push(p);
      li.textContent = "";
      li.className = "se-zeile";
      var span = document.createElement("span");
      span.className = "se-text";
      span.textContent = text;
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
          var stand = lies();
          stand[p.schluessel] = s[0];
          schreib(stand);
          knoepfe.querySelectorAll("button").forEach(function (k) {
            k.setAttribute("aria-pressed", String(k === b));
          });
          auswerten(abschnitt, punkte);
        });
        knoepfe.appendChild(b);
      });
      li.appendChild(span);
      li.appendChild(knoepfe);
    });
    var stand = lies();
    punkte.forEach(function (p, i) {
      abschnitt.querySelectorAll(".se-zeile")[i].querySelectorAll("button").forEach(function (b) {
        b.setAttribute("aria-pressed", String(stand[p.schluessel] === b.getAttribute("data-wert")));
      });
    });
    abschnitt.classList.add("se-bereit");
    auswerten(abschnitt, punkte);
  }

  function start() {
    var abschnitt = document.getElementById("sec-selbsteinschaetzung");
    if (abschnitt && abschnitt.querySelector(".se-liste")) aufbauen(abschnitt);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
