/* ==========================================================================
   NEXORA — Dashboard
   ========================================================================== */
(function (global) {
  "use strict";

  const QUICK_TOOLS = [
    { route: "calculator", icon: "calculator", title: "Basic Calculator", desc: "Fast everyday arithmetic", key: "C" },
    { route: "calculator", icon: "sigma", title: "Scientific Calculator", desc: "Advanced functions and trigonometry", key: "S" },
    { route: "graphing", icon: "line-chart", title: "Graphing", desc: "Plot and explore functions", key: "G" },
    { route: "equations", icon: "square-equal", title: "Equation Solver", desc: "Linear, quadratic and systems", key: "E" },
    { route: "matrix", icon: "grid-3x3", title: "Matrix", desc: "Determinants, inverses and more", key: "M" },
    { route: "university", icon: "book-open", title: "University Math", desc: "Algebra, calculus and trigonometry", key: "U" },
    { route: "statistics", icon: "bar-chart-3", title: "Statistics", desc: "Mean, deviation and distributions", key: "T" },
    { route: "converters", icon: "repeat", title: "Converters", desc: "Length, weight, currency and more", key: "V" },
  ];

  function greeting() {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  }

  function renderDashboardView(root) {
    const persona = StorageService.get(StorageService.KEYS.PERSONA, "general");
    const insights = AppState.getInsights();
    const weekly = AppState.getWeeklyActivity();
    const recent = AppState.getHistory().slice(0, 5);
    const continueWork = AppState.getContinueWork();
    const userName = "Nilusha";

    root.innerHTML = `
      <div class="view-fade">
        <section class="hero">
          <div class="math-grid-bg"></div>
          <div class="hero-content">
            <div class="hero-eyebrow">NEXORA — Calculate. Explore. Understand.</div>
            <h1>${greeting()}, ${userName}.</h1>
            <p>Turn complex mathematics into clear results. Calculate, visualize, solve, and understand from one workspace.</p>
            <div class="hero-actions">
              <button class="btn btn-primary" id="hero-open-calc"><span data-lucide="calculator"></span>Open Calculator</button>
              <button class="btn btn-outline" id="hero-explore"><span data-lucide="compass"></span>Explore Mathematics</button>
            </div>
          </div>
          <div class="hero-visual">
            <span class="hero-node" style="width:46px;height:46px;top:8%;left:6%">π</span>
            <span class="hero-node" style="width:52px;height:52px;top:60%;left:2%;animation-delay:.6s">sin x</span>
            <span class="hero-node" style="width:44px;height:44px;top:4%;right:8%;animation-delay:1.1s">x²</span>
            <span class="hero-node" style="width:48px;height:48px;bottom:6%;right:4%;animation-delay:1.6s">Σ</span>
            <div class="hero-calc-card">
              <div class="chip-expr">125 × 48</div>
              <div class="chip-result">= 6000</div>
            </div>
          </div>
        </section>

        ${continueWork ? `
        <div class="card card-hover flex items-center gap-4" style="margin-bottom:24px" id="continue-work-card">
          <div class="quick-card-icon"><span data-lucide="play"></span></div>
          <div style="flex:1">
            <strong>Continue your work</strong>
            <p class="text-small text-muted">${NexoraUtils.escapeHtml(continueWork.label)}</p>
          </div>
          <button class="btn btn-secondary btn-sm" id="continue-work-btn">Open</button>
        </div>` : ""}

        <div class="section-heading" style="margin-top:0"><h2>Quick Actions</h2></div>
        <div class="quick-grid" id="quick-actions"></div>

        <div class="section-heading"><h2>Your Insights</h2></div>
        <div class="insights-grid">
          <div class="card insight-card"><div class="insight-value">${insights.calculationsToday}</div><div class="insight-label">Calculations Today</div></div>
          <div class="card insight-card"><div class="insight-value">${insights.totalCalculations}</div><div class="insight-label">Total Calculations</div></div>
          <div class="card insight-card"><div class="insight-value">${insights.savedResults}</div><div class="insight-label">Saved Results</div></div>
          <div class="card insight-card"><div class="insight-value">${insights.favoriteTools}</div><div class="insight-label">Favorite Tools</div></div>
        </div>

        <div class="section-heading"><h2>Mathematical Activity</h2></div>
        <div class="card">
          ${weekly.some(d => d.count > 0) ? `
          <div class="activity-chart">
            ${weekly.map((d) => {
              const max = Math.max(1, ...weekly.map((x) => x.count));
              const h = Math.round((d.count / max) * 100);
              return `<div class="activity-bar-col"><div class="activity-bar" style="height:${Math.max(4, h)}%" title="${d.count}"></div><div class="activity-bar-label">${d.label}</div></div>`;
            }).join("")}
          </div>` : `<div class="empty-state"><div class="empty-state-icon"><span data-lucide="bar-chart-3"></span></div><h3 class="empty-title">Start calculating to see your insights.</h3><p class="empty-desc">Your weekly activity will appear here once you've run a few calculations.</p></div>`}
        </div>

        <div class="section-heading"><h2>Recent Calculations</h2><button class="link-btn" id="dash-view-all">View all</button></div>
        <div class="card" id="dash-recent"></div>
      </div>
    `;

    // Quick actions
    const quickGrid = root.querySelector("#quick-actions");
    quickGrid.innerHTML = QUICK_TOOLS.map((t) => `
      <button class="card card-hover quick-card" data-route="${t.route}">
        <div class="quick-card-icon"><span data-lucide="${t.icon}"></span></div>
        <h3>${t.title}</h3>
        <p>${t.desc}</p>
        <div class="quick-card-shortcut">Shortcut: ${t.key}</div>
      </button>
    `).join("");
    quickGrid.querySelectorAll("[data-route]").forEach((btn) => btn.addEventListener("click", () => Router.navigate(btn.dataset.route)));

    // Recent
    const recentEl = root.querySelector("#dash-recent");
    function renderRecent() {
      const items = AppState.getHistory().slice(0, 5);
      if (!items.length) {
        recentEl.innerHTML = `<div class="empty-state"><div class="empty-state-icon"><span data-lucide="sparkles"></span></div><h3 class="empty-title">Your mathematics workspace is waiting.</h3><p class="empty-desc">Start your first calculation to build your activity.</p><button class="btn btn-primary" id="dash-empty-cta"><span data-lucide="calculator"></span>Open Calculator</button></div>`;
        NexoraUtils.renderIcons(recentEl);
        recentEl.querySelector("#dash-empty-cta")?.addEventListener("click", () => Router.navigate("calculator"));
        return;
      }
      recentEl.innerHTML = `<div class="recent-list">${items.map((h) => `
        <div class="recent-row" data-id="${h.id}">
          <div><div class="recent-expr">${NexoraUtils.escapeHtml(h.expression)}</div><div class="text-small text-muted">${NexoraUtils.escapeHtml(h.calculatorType || "")} · ${NexoraUtils.formatTimestamp(h.timestamp)}</div></div>
          <div class="recent-result">${NexoraUtils.escapeHtml(String(h.result))}</div>
          <div class="recent-actions">
            <button class="icon-btn btn-sm" data-act="favorite" title="Favorite" aria-label="Favorite"><span data-lucide="${h.favorite ? "star" : "star-off"}"></span></button>
            <button class="icon-btn btn-sm" data-act="copy" title="Copy" aria-label="Copy"><span data-lucide="copy"></span></button>
          </div>
        </div>`).join("")}</div>`;
      NexoraUtils.renderIcons(recentEl);
      recentEl.querySelectorAll(".recent-row").forEach((row) => {
        const id = row.dataset.id;
        row.querySelector('[data-act="favorite"]').addEventListener("click", () => { AppState.toggleFavoriteHistory(id); Toast.show("Added to favorites"); });
        row.querySelector('[data-act="copy"]').addEventListener("click", () => { NexoraUtils.copyToClipboard(row.querySelector(".recent-result").textContent); Toast.show("Copied to clipboard"); });
      });
    }
    renderRecent();
    const offHistory = AppState.on("history:changed", renderRecent);
    const offInsights = AppState.on("insights:changed", () => {
      if (document.body.contains(root) && location.hash.replace(/^#\/?/, "") === "dashboard") {
        renderDashboardView(root);
      }
    });
    root._cleanup = () => { offHistory(); offInsights(); };

    root.querySelector("#hero-open-calc").addEventListener("click", () => Router.navigate("calculator"));
    root.querySelector("#hero-explore").addEventListener("click", () => Router.navigate("university"));
    root.querySelector("#dash-view-all").addEventListener("click", () => Router.navigate("history"));
    root.querySelector("#continue-work-btn")?.addEventListener("click", () => Router.navigate(continueWork.route));

    NexoraUtils.renderIcons(root);
  }

  global.DashboardView = { render: renderDashboardView, greeting };
})(window);
