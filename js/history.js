/* ==========================================================================
   NEXORA — History & Favorites views
   ========================================================================== */
(function (global) {
  "use strict";

  function historyRowHtml(h) {
    return `
      <div class="recent-row" data-id="${h.id}">
        <div>
          <div class="recent-expr">${NexoraUtils.escapeHtml(h.expression)}</div>
          <div class="text-small text-muted">${NexoraUtils.escapeHtml(h.calculatorType || "")} · ${NexoraUtils.formatTimestamp(h.timestamp)}</div>
        </div>
        <div class="recent-result">${NexoraUtils.escapeHtml(String(h.result))}</div>
        <div class="recent-actions">
          <button class="icon-btn btn-sm" data-act="reuse" aria-label="Reuse" title="Reuse"><span data-lucide="rotate-ccw"></span></button>
          <button class="icon-btn btn-sm" data-act="favorite" aria-label="Favorite" title="Favorite"><span data-lucide="${h.favorite ? "star" : "star-off"}"></span></button>
          <button class="icon-btn btn-sm" data-act="copy" aria-label="Copy" title="Copy"><span data-lucide="copy"></span></button>
          <button class="icon-btn btn-sm" data-act="delete" aria-label="Delete" title="Delete"><span data-lucide="trash-2"></span></button>
        </div>
      </div>`;
  }

  function bindRowActions(container) {
    container.querySelectorAll(".recent-row").forEach((row) => {
      const id = row.dataset.id;
      row.querySelector('[data-act="reuse"]')?.addEventListener("click", () => {
        NexoraUtils.copyToClipboard(row.querySelector(".recent-expr").textContent);
        Router.navigate("calculator");
        Toast.show("Expression copied — paste it into the calculator");
      });
      row.querySelector('[data-act="favorite"]')?.addEventListener("click", () => {
        AppState.toggleFavoriteHistory(id);
        Toast.show("Added to favorites");
      });
      row.querySelector('[data-act="copy"]')?.addEventListener("click", () => {
        NexoraUtils.copyToClipboard(row.querySelector(".recent-result").textContent);
        Toast.show("Copied to clipboard");
      });
      row.querySelector('[data-act="delete"]')?.addEventListener("click", () => {
        AppState.removeHistory(id);
        Toast.show("Deleted");
      });
    });
  }

  function renderHistoryView(root) {
    root.innerHTML = `
      <div class="view-fade">
        <div class="section-heading" style="margin-top:0"><h2>History</h2>
          <button class="link-btn" id="hist-clear">Clear all</button>
        </div>
        <div class="history-toolbar">
          <input class="input" id="hist-search" placeholder="Search history…" />
          <select class="select" id="hist-sort" style="max-width:180px">
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>
        <div class="card" id="hist-list"></div>
      </div>
    `;
    const listEl = root.querySelector("#hist-list");
    const search = root.querySelector("#hist-search");
    const sort = root.querySelector("#hist-sort");

    function render() {
      let items = AppState.getHistory().slice();
      const q = search.value.trim().toLowerCase();
      if (q) items = items.filter((h) => h.expression.toLowerCase().includes(q) || String(h.result).toLowerCase().includes(q));
      if (sort.value === "oldest") items = items.reverse();
      if (!items.length) {
        listEl.innerHTML = `<div class="empty-state"><div class="empty-state-icon"><span data-lucide="history"></span></div><h3 class="empty-title">No history yet</h3><p class="empty-desc">Start calculating to build your history.</p><button class="btn btn-primary" id="hist-open-calc"><span data-lucide="calculator"></span>Open Calculator</button></div>`;
        NexoraUtils.renderIcons(listEl);
        listEl.querySelector("#hist-open-calc")?.addEventListener("click", () => Router.navigate("calculator"));
        return;
      }
      listEl.innerHTML = `<div class="recent-list">${items.map(historyRowHtml).join("")}</div>`;
      NexoraUtils.renderIcons(listEl);
      bindRowActions(listEl);
    }
    search.addEventListener("input", NexoraUtils.debounce(render, 150));
    sort.addEventListener("change", render);
    root.querySelector("#hist-clear").addEventListener("click", () => {
      AppState.clearHistory();
      Toast.show("History cleared");
      render();
    });
    const offHistory = AppState.on("history:changed", render);
    root._cleanup = () => offHistory();
    render();
  }

  function renderFavoritesView(root) {
    root.innerHTML = `
      <div class="view-fade">
        <div class="section-heading" style="margin-top:0"><h2>Favorites</h2></div>
        <div class="tabs" id="fav-tabs" style="max-width:420px;margin-bottom:20px">
          <button class="tab active" data-t="calculations">Calculations</button>
          <button class="tab" data-t="formulas">Formulas</button>
          <button class="tab" data-t="tools">Tools</button>
        </div>
        <div id="fav-body"></div>
      </div>
    `;
    const body = root.querySelector("#fav-body");

    function render() {
      const active = root.querySelector("#fav-tabs .tab.active").dataset.t;
      if (active === "calculations") {
        const favs = AppState.getHistory().filter((h) => h.favorite);
        body.innerHTML = favs.length
          ? `<div class="card"><div class="recent-list">${favs.map(historyRowHtml).join("")}</div></div>`
          : emptyBlock("star", "No favorite calculations yet", "Star a result from History or the Calculator to save it here.");
        NexoraUtils.renderIcons(body);
        bindRowActions(body);
      } else if (active === "formulas") {
        const ids = AppState.getSavedFormulas();
        const items = FormulasView.FORMULAS.filter((f) => ids.includes(f.id));
        body.innerHTML = items.length
          ? `<div class="formula-grid">${items.map((f) => `
              <div class="card formula-card">
                <span class="badge">${f.cat}</span>
                <div class="formula-expr">${NexoraUtils.escapeHtml(f.expr)}</div>
                <div class="formula-name">${NexoraUtils.escapeHtml(f.name)}</div>
                <div class="formula-explain">${NexoraUtils.escapeHtml(f.explain)}</div>
              </div>`).join("")}</div>`
          : emptyBlock("library", "No saved formulas yet", "Use \"Use Formula\" in the Formula Library to save one here.");
        NexoraUtils.renderIcons(body);
      } else {
        const tools = AppState.getFavoriteTools();
        body.innerHTML = tools.length
          ? `<div class="quick-grid">${tools.map((t) => `
              <button class="card card-hover quick-card" data-route="${t.routeId}">
                <div class="quick-card-icon"><span data-lucide="star"></span></div>
                <h3>${NexoraUtils.escapeHtml(t.label)}</h3>
                <p>Pinned tool</p>
              </button>`).join("")}</div>`
          : emptyBlock("star", "No favorite tools yet", "Star a tool from the sidebar or dashboard to pin it here.");
        NexoraUtils.renderIcons(body);
        body.querySelectorAll("[data-route]").forEach((b) => b.addEventListener("click", () => Router.navigate(b.dataset.route)));
      }
    }
    function emptyBlock(icon, title, desc) {
      return `<div class="card"><div class="empty-state"><div class="empty-state-icon"><span data-lucide="${icon}"></span></div><h3 class="empty-title">${title}</h3><p class="empty-desc">${desc}</p></div></div>`;
    }

    root.querySelectorAll("#fav-tabs .tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        root.querySelectorAll("#fav-tabs .tab").forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        render();
      });
    });
    const offFav = AppState.on("favorites:changed", render);
    const offHist = AppState.on("history:changed", render);
    const offForm = AppState.on("formulas:changed", render);
    root._cleanup = () => { offFav(); offHist(); offForm(); };
    render();
  }

  global.HistoryView = { render: renderHistoryView };
  global.FavoritesView = { render: renderFavoritesView };
})(window);
