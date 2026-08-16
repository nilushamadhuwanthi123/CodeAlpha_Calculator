/* ==========================================================================
   NEXORA — Command Center (Ctrl/Cmd + K)
   ========================================================================== */
(function (global) {
  "use strict";

  const COMMANDS = [
    { label: "Calculator", icon: "calculator", route: "calculator" },
    { label: "Scientific Calculator", icon: "sigma", route: "calculator" },
    { label: "Graphing", icon: "line-chart", route: "graphing" },
    { label: "University Math", icon: "book-open", route: "university" },
    { label: "Matrix", icon: "grid-3x3", route: "matrix" },
    { label: "Equations", icon: "square-equal", route: "equations" },
    { label: "Statistics", icon: "bar-chart-3", route: "statistics" },
    { label: "Converters", icon: "repeat", route: "converters" },
    { label: "Finance", icon: "landmark", route: "finance" },
    { label: "Formula Library", icon: "library", route: "formulas" },
    { label: "History", icon: "history", route: "history" },
    { label: "Favorites", icon: "star", route: "favorites" },
    { label: "Study Mode", icon: "graduation-cap", route: "study" },
    { label: "Math Assistant", icon: "sparkles", route: "assistant" },
    { label: "Settings", icon: "settings", route: "settings" },
    { label: "Toggle Dark Mode", icon: "moon", action: "dark" },
    { label: "Toggle Eye Comfort", icon: "eye", action: "eyecomfort" },
  ];

  let activeIndex = 0;
  let filtered = COMMANDS.slice();

  function open() {
    const overlay = document.getElementById("command-center");
    overlay.hidden = false;
    const input = document.getElementById("command-input");
    input.value = "";
    filtered = COMMANDS.slice();
    activeIndex = 0;
    renderResults();
    NexoraUtils.renderIcons(overlay);
    setTimeout(() => input.focus(), 30);
  }
  function close() {
    document.getElementById("command-center").hidden = true;
  }
  function isOpen() {
    return !document.getElementById("command-center").hidden;
  }

  function renderResults() {
    const list = document.getElementById("command-results");
    if (!filtered.length) {
      list.innerHTML = `<li class="command-result">No matching commands</li>`;
      return;
    }
    list.innerHTML = filtered.map((c, i) => `
      <li class="command-result ${i === activeIndex ? "active" : ""}" role="option" data-index="${i}">
        <span data-lucide="${c.icon}"></span><span>${NexoraUtils.escapeHtml(c.label)}</span><small>${c.route ? "Open" : "Toggle"}</small>
      </li>
    `).join("");
    NexoraUtils.renderIcons(list);
    list.querySelectorAll(".command-result[data-index]").forEach((li) => {
      li.addEventListener("click", () => execute(filtered[parseInt(li.dataset.index, 10)]));
    });
  }

  function execute(cmd) {
    if (!cmd) return;
    if (cmd.route) Router.navigate(cmd.route);
    else if (cmd.action === "dark") ThemeManager.setTheme(ThemeManager.currentTheme() === "dark" ? "light" : "dark");
    else if (cmd.action === "eyecomfort") ThemeManager.setTheme(ThemeManager.currentTheme() === "eyecomfort" ? "light" : "eyecomfort");
    close();
  }

  function init() {
    const input = document.getElementById("command-input");
    const overlay = document.getElementById("command-center");

    input.addEventListener("input", () => {
      const q = input.value.trim().toLowerCase();
      filtered = COMMANDS.filter((c) => c.label.toLowerCase().includes(q));
      activeIndex = 0;
      renderResults();
    });

    document.addEventListener("keydown", (e) => {
      const isK = e.key.toLowerCase() === "k" && (e.ctrlKey || e.metaKey);
      if (isK) { e.preventDefault(); isOpen() ? close() : open(); return; }
      if (!isOpen()) return;
      if (e.key === "Escape") { close(); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); activeIndex = Math.min(activeIndex + 1, filtered.length - 1); renderResults(); }
      if (e.key === "ArrowUp") { e.preventDefault(); activeIndex = Math.max(activeIndex - 1, 0); renderResults(); }
      if (e.key === "Enter") { e.preventDefault(); execute(filtered[activeIndex]); }
    });

    overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
    document.getElementById("topbar-search").addEventListener("click", open);
    document.getElementById("sidebar-command-btn").addEventListener("click", open);
  }

  global.CommandCenter = { init, open, close };
})(window);
