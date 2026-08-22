// Blendet auf Unterseiten mit Menü-Karten (mathematik/index.html, mss12/index.html, usw.) nur die
// Karten ein, deren Bereich auf der Startseite per Code freigeschaltet wurde (localStorage
// "uplant-access", siehe index.html). So lässt sich nicht einfach über die Ordnerstruktur klicken,
// ohne vorher auf der Startseite einen Code eingegeben zu haben.
// Achtung: reine Navigationshilfe, kein echter Zugriffsschutz — jede Seite bleibt über ihre
// Adresse direkt erreichbar, unabhängig von dieser Anzeige.
(function () {
  "use strict";
  var STORAGE_KEY = "uplant-access";

  function getUnlocked() {
    try {
      var raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(raw) ? raw : [];
    } catch (e) {
      return [];
    }
  }

  window.uplantAccessGate = function (homeHref) {
    var unlocked = getUnlocked();
    var cards = document.querySelectorAll(".menu-card[data-section]");
    var anyVisible = false;
    cards.forEach(function (card) {
      var ok = unlocked.indexOf(card.dataset.section) !== -1;
      card.hidden = !ok;
      if (ok) anyVisible = true;
    });
    if (!anyVisible) {
      var grid = document.querySelector(".menu-grid");
      if (grid) {
        grid.hidden = true;
        var msg = document.createElement("p");
        msg.className = "access-locked-msg";
        msg.innerHTML =
          "🔒 Dieser Bereich ist noch nicht freigeschaltet. Gib auf der <a href=\"" +
          homeHref +
          "\">Startseite</a> den passenden Code ein.";
        grid.parentNode.insertBefore(msg, grid);
      }
    }
  };
})();
