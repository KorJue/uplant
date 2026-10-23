// Hinweise für Lehrkräfte (Konzept, Didaktik, Lösungswege) erscheinen nur, wenn auf der Startseite
// der Code für alle Bereiche (Menüpunkt-Zahl 15) eingegeben wurde — dann steht „lehrkraft“ in
// localStorage "uplant-access" (siehe index.html).
//
// Die Hinweise stehen bewusst NICHT im Quelltext der Seite, sondern in einer eigenen Datei, die
// erst dann nachgeladen wird: Ein Platzhalter <section … data-lehrkraft="datei.html" hidden> nennt
// sie. Stünden sie versteckt in der Seite, ließe sich zum Beispiel beim Rätsel der Klasse 8 über
// „Seitenquelltext anzeigen“ nachlesen, welche Linie welchen Fall löst.
//
// Achtung: wie die Freischaltung selbst ein Sichtschutz, kein Zugriffsschutz — die Datei bleibt
// über ihre Adresse erreichbar, und das Repository ist öffentlich.
(function () {
  "use strict";
  var STORAGE_KEY = "uplant-access";
  var MARKE = "lehrkraft";

  function freigeschaltet() {
    try {
      var roh = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(roh) && roh.indexOf(MARKE) !== -1;
    } catch (e) {
      return false;
    }
  }

  function lade() {
    var plaetze = document.querySelectorAll("[data-lehrkraft]");
    // Ohne Freischaltung wird die Datei gar nicht erst angefragt — sie taucht dann auch in den
    // Entwicklerwerkzeugen nicht auf.
    if (!plaetze.length || !freigeschaltet()) return;
    Array.prototype.forEach.call(plaetze, function (platz) {
      fetch(platz.getAttribute("data-lehrkraft"))
        .then(function (antwort) {
          if (!antwort.ok) throw new Error("Status " + antwort.status);
          return antwort.text();
        })
        .then(function (html) {
          platz.innerHTML = html;
          platz.hidden = false;
          platz.setAttribute("data-geladen", "ja");
        })
        .catch(function () {
          platz.innerHTML = "<p>📋 Die Hinweise für Lehrkräfte ließen sich nicht laden. Bitte die Seite neu laden.</p>";
          platz.hidden = false;
          platz.setAttribute("data-geladen", "fehler");
        });
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", lade);
  else lade();
})();
