/* ==========================================================================
   NEXORA — Router (hash-based, single view root)
   ========================================================================== */
(function (global) {
  "use strict";

  const ROUTES = {
    dashboard: { title: "Dashboard", render: () => DashboardView.render(viewRoot()) },
    calculator: { title: "Calculator", render: () => CalculatorView.render(viewRoot()) },
    graphing: { title: "Graphing", render: () => GraphingView.render(viewRoot()) },
    university: { title: "University Math", render: () => UniversityView.render(viewRoot()) },
    matrix: { title: "Matrices", render: () => MatrixView.render(viewRoot()) },
    equations: { title: "Equations", render: () => EquationsView.render(viewRoot()) },
    statistics: { title: "Statistics", render: () => StatisticsView.render(viewRoot()) },
    converters: { title: "Converters", render: () => ConvertersView.render(viewRoot()) },
    finance: { title: "Finance", render: () => FinanceView.render(viewRoot()) },
    formulas: { title: "Formula Library", render: () => FormulasView.render(viewRoot()) },
    study: { title: "Study Mode", render: () => StudyView.render(viewRoot()) },
    assistant: { title: "Math Assistant", render: () => AssistantView.render(viewRoot()) },
    history: { title: "History", render: () => HistoryView.render(viewRoot()) },
    favorites: { title: "Favorites", render: () => FavoritesView.render(viewRoot()) },
    settings: { title: "Settings", render: () => SettingsView.render(viewRoot()) },
    explore: { title: "Explore", render: () => UniversityView.render(viewRoot()) },
  };

  function viewRoot() {
    return document.getElementById("view-root");
  }

  function cleanupPreviousView() {
    const root = viewRoot();
    if (root && typeof root._cleanup === "function") {
      root._cleanup();
      root._cleanup = null;
    }
  }

  function updateNavActive(routeId) {
    document.querySelectorAll(".nav-item, .bottom-nav-item, .drawer-nav .nav-item").forEach((btn) => {
      const match = btn.dataset.route === routeId || (routeId === "calculator" && btn.dataset.route === "calculator");
      if (btn.dataset.route === routeId) btn.setAttribute("aria-current", "page");
      else btn.removeAttribute("aria-current");
    });
    const title = document.getElementById("topbar-title");
    if (title && ROUTES[routeId]) title.textContent = ROUTES[routeId].title;
  }

  function navigate(routeId, opts) {
    opts = opts || {};
    if (!ROUTES[routeId]) routeId = "dashboard";
    cleanupPreviousView();
    if (!opts.silent) location.hash = "#/" + routeId;
    updateNavActive(routeId);
    ROUTES[routeId].render();
    if (routeId !== "dashboard") AppState.touchRecentTool(routeId);
    document.getElementById("main-content").scrollTop = 0;
    window.scrollTo({ top: 0, behavior: NexoraUtils.reducedMotion() ? "auto" : "smooth" });
    // Close mobile drawer if open
    const drawer = document.getElementById("drawer-overlay");
    if (drawer && !drawer.hidden) drawer.hidden = true;
  }

  function initFromHash() {
    const hash = location.hash.replace(/^#\/?/, "");
    navigate(hash && ROUTES[hash] ? hash : "dashboard", { silent: true });
  }

  window.addEventListener("hashchange", initFromHash);

  global.Router = { navigate, ROUTES, init: initFromHash };
})(window);
