/* ==========================================================================
   NEXORA — App bootstrap
   ========================================================================== */
(function () {
  "use strict";

  const NAV_ROUTES = [
    "dashboard", "calculator", "graphing", "university", "matrix", "equations",
    "statistics", "converters", "finance", "formulas", "study", "assistant",
    "history", "favorites", "settings",
  ];

  function initSidebarNav() {
    document.querySelectorAll(".nav-item[data-route]").forEach((btn) => {
      btn.addEventListener("click", () => Router.navigate(btn.dataset.route));
    });
    document.querySelectorAll(".bottom-nav-item[data-route]").forEach((btn) => {
      btn.addEventListener("click", () => Router.navigate(btn.dataset.route));
    });
  }

  function initDrawer() {
    const drawerNav = document.getElementById("drawer-nav");
    const labels = {
      dashboard: ["layout-dashboard", "Dashboard"], calculator: ["calculator", "Calculator"],
      graphing: ["line-chart", "Graphing"], university: ["book-open", "University Math"],
      matrix: ["grid-3x3", "Matrices"], equations: ["sigma", "Equations"],
      statistics: ["bar-chart-3", "Statistics"], converters: ["repeat", "Converters"],
      finance: ["landmark", "Finance"], formulas: ["library", "Formula Library"],
      study: ["graduation-cap", "Study Mode"], assistant: ["sparkles", "Math Assistant"],
      history: ["history", "History"], favorites: ["star", "Favorites"], settings: ["settings", "Settings"],
    };
    drawerNav.innerHTML = NAV_ROUTES.map((r) => `
      <button class="nav-item" data-route="${r}"><span data-lucide="${labels[r][0]}"></span>${labels[r][1]}</button>
    `).join("");
    NexoraUtils.renderIcons(drawerNav);
    drawerNav.querySelectorAll("[data-route]").forEach((btn) => btn.addEventListener("click", () => Router.navigate(btn.dataset.route)));

    const overlay = document.getElementById("drawer-overlay");
    document.getElementById("drawer-toggle").addEventListener("click", () => (overlay.hidden = false));
    document.getElementById("drawer-close").addEventListener("click", () => (overlay.hidden = true));
    overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.hidden = true; });
  }

  function initTopbar() {
    document.getElementById("topbar-theme").addEventListener("click", () => ThemeManager.cycleTheme());
    document.getElementById("topbar-settings").addEventListener("click", () => Router.navigate("settings"));
  }

  function initGlobalKeyboardShortcuts() {
    document.addEventListener("keydown", (e) => {
      if (document.activeElement && ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) return;
      if (!document.getElementById("command-center").hidden) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const map = { c: "calculator", s: "calculator", g: "graphing", e: "equations", m: "matrix", u: "university", t: "statistics", v: "converters" };
      const route = map[e.key.toLowerCase()];
      if (route && location.hash.replace("#/", "") !== "history" && location.hash.replace("#/", "") !== "favorites") {
        // Only trigger single-letter shortcuts when on the dashboard, to avoid clashing with calculator typing.
        if ((location.hash.replace(/^#\/?/, "") || "dashboard") === "dashboard") {
          Router.navigate(route);
        }
      }
    });
  }

  function registerServiceWorker() {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("sw.js").catch(() => { /* offline shell unavailable */ });
      });
    }
  }

  function init() {
    ThemeManager.init();
    OnboardingManager.init();
    initSidebarNav();
    initDrawer();
    initTopbar();
    CommandCenter.init();
    initGlobalKeyboardShortcuts();
    Router.init();
    registerServiceWorker();
    NexoraUtils.renderIcons(document);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
