// Dark Mode: wendet die gespeicherte Präferenz sofort an (kein Aufblitzen des hellen Designs)
// und fügt auf jeder Seite einen Umschalt-Button hinzu. Rein clientseitig, ohne Server.
(function () {
  "use strict";
  var THEME_KEY = "uplant-theme";

  function applyTheme(theme) {
    if (theme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  }

  applyTheme(localStorage.getItem(THEME_KEY));

  function addToggle() {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "theme-toggle";
    btn.setAttribute("aria-label", "Dunkles/helles Design umschalten");

    function setIcon() {
      var isDark = document.documentElement.getAttribute("data-theme") === "dark";
      btn.textContent = isDark ? "☀️" : "🌙";
    }
    setIcon();

    btn.addEventListener("click", function () {
      var isDark = document.documentElement.getAttribute("data-theme") === "dark";
      if (isDark) {
        applyTheme("light");
        localStorage.removeItem(THEME_KEY);
      } else {
        applyTheme("dark");
        localStorage.setItem(THEME_KEY, "dark");
      }
      setIcon();
    });

    document.body.appendChild(btn);
  }

  if (document.body) {
    addToggle();
  } else {
    document.addEventListener("DOMContentLoaded", addToggle);
  }
})();
