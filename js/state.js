/* ==========================================================================
   NEXORA — Central application state (event-driven)
   ========================================================================== */
(function (global) {
  "use strict";
  const S = global.StorageService;
  const K = S.KEYS;

  const listeners = {};

  function on(evt, cb) {
    (listeners[evt] = listeners[evt] || []).push(cb);
    return () => off(evt, cb);
  }
  function off(evt, cb) {
    if (!listeners[evt]) return;
    listeners[evt] = listeners[evt].filter((f) => f !== cb);
  }
  function emit(evt, payload) {
    (listeners[evt] || []).forEach((cb) => {
      try { cb(payload); } catch (e) { console.error("NEXORA listener error", evt, e); }
    });
  }

  const DEFAULT_SETTINGS = {
    angleMode: "DEG",
    calculatorSize: "normal",
  };

  const state = {
    history: S.get(K.HISTORY, []),
    favorites: S.get(K.FAVORITES, []),
    settings: Object.assign({}, DEFAULT_SETTINGS, S.get(K.SETTINGS, {})),
    memory: S.get(K.MEMORY, 0),
    lastAnswer: S.get(K.ANSWER, 0),
    recentTools: S.get(K.RECENT_TOOLS, []),
    savedFormulas: S.get(K.SAVED_FORMULAS, []),
    savedProblems: S.get(K.SAVED_PROBLEMS, []),
    dashboardState: S.get(K.DASHBOARD_STATE, {}),
    activity: S.get(K.ACTIVITY, {}),
  };

  function todayKey(d) {
    const dt = d ? new Date(d) : new Date();
    return dt.toISOString().slice(0, 10);
  }

  function logActivity() {
    const key = todayKey();
    state.activity[key] = (state.activity[key] || 0) + 1;
    S.set(K.ACTIVITY, state.activity);
  }

  const AppState = {
    on, off, emit,

    getHistory() { return state.history; },
    addHistory(entry) {
      const item = Object.assign({
        id: NexoraUtils.uid(),
        timestamp: NexoraUtils.nowISO(),
        favorite: false,
      }, entry);
      state.history.unshift(item);
      if (state.history.length > 500) state.history.length = 500;
      S.set(K.HISTORY, state.history);
      state.lastAnswer = (typeof entry.resultRaw === "number") ? entry.resultRaw : state.lastAnswer;
      S.set(K.ANSWER, state.lastAnswer);
      logActivity();
      emit("history:changed", state.history);
      emit("insights:changed");
      return item;
    },
    removeHistory(id) {
      state.history = state.history.filter((h) => h.id !== id);
      S.set(K.HISTORY, state.history);
      emit("history:changed", state.history);
      emit("insights:changed");
    },
    clearHistory() {
      state.history = [];
      S.set(K.HISTORY, state.history, true);
      emit("history:changed", state.history);
      emit("insights:changed");
    },
    toggleFavoriteHistory(id) {
      const h = state.history.find((x) => x.id === id);
      if (!h) return;
      h.favorite = !h.favorite;
      S.set(K.HISTORY, state.history);
      emit("history:changed", state.history);
      emit("favorites:changed");
    },

    getFavoriteTools() { return state.favorites.filter((f) => f.type === "tool"); },
    getFavorites(type) {
      return type ? state.favorites.filter((f) => f.type === type) : state.favorites;
    },
    addFavorite(fav) {
      const item = Object.assign({ id: NexoraUtils.uid(), timestamp: NexoraUtils.nowISO() }, fav);
      state.favorites.unshift(item);
      S.set(K.FAVORITES, state.favorites);
      emit("favorites:changed", state.favorites);
      return item;
    },
    removeFavorite(id) {
      state.favorites = state.favorites.filter((f) => f.id !== id);
      S.set(K.FAVORITES, state.favorites);
      emit("favorites:changed", state.favorites);
    },
    isFavoriteTool(routeId) {
      return state.favorites.some((f) => f.type === "tool" && f.routeId === routeId);
    },
    toggleFavoriteTool(routeId, label) {
      const existing = state.favorites.find((f) => f.type === "tool" && f.routeId === routeId);
      if (existing) this.removeFavorite(existing.id);
      else this.addFavorite({ type: "tool", routeId, label });
    },

    getMemory() { return state.memory; },
    setMemory(v) { state.memory = v; S.set(K.MEMORY, v); emit("memory:changed", v); },

    getLastAnswer() { return state.lastAnswer; },

    getSettings() { return state.settings; },
    updateSettings(patch) {
      state.settings = Object.assign({}, state.settings, patch);
      S.set(K.SETTINGS, state.settings);
      emit("settings:changed", state.settings);
    },

    touchRecentTool(routeId) {
      state.recentTools = [routeId, ...state.recentTools.filter((r) => r !== routeId)].slice(0, 8);
      S.set(K.RECENT_TOOLS, state.recentTools);
    },
    getRecentTools() { return state.recentTools; },

    getSavedFormulas() { return state.savedFormulas; },
    toggleSavedFormula(formulaId) {
      const idx = state.savedFormulas.indexOf(formulaId);
      if (idx >= 0) state.savedFormulas.splice(idx, 1);
      else state.savedFormulas.unshift(formulaId);
      S.set(K.SAVED_FORMULAS, state.savedFormulas);
      emit("formulas:changed", state.savedFormulas);
    },

    getSavedProblems() { return state.savedProblems; },
    addSavedProblem(problem) {
      const item = Object.assign({ id: NexoraUtils.uid(), timestamp: NexoraUtils.nowISO() }, problem);
      state.savedProblems.unshift(item);
      S.set(K.SAVED_PROBLEMS, state.savedProblems);
      emit("problems:changed", state.savedProblems);
      return item;
    },
    removeSavedProblem(id) {
      state.savedProblems = state.savedProblems.filter((p) => p.id !== id);
      S.set(K.SAVED_PROBLEMS, state.savedProblems);
      emit("problems:changed", state.savedProblems);
    },

    setContinueWork(payload) {
      state.dashboardState.continueWork = payload;
      S.set(K.DASHBOARD_STATE, state.dashboardState);
      emit("dashboard:changed");
    },
    getContinueWork() { return state.dashboardState.continueWork || null; },
    clearContinueWork() {
      delete state.dashboardState.continueWork;
      S.set(K.DASHBOARD_STATE, state.dashboardState);
      emit("dashboard:changed");
    },

    getActivity() { return state.activity; },
    getWeeklyActivity() {
      const days = [];
      const now = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const key = todayKey(d);
        days.push({ key, label: d.toLocaleDateString([], { weekday: "short" }), count: state.activity[key] || 0 });
      }
      return days;
    },
    getInsights() {
      const today = todayKey();
      const calcToday = state.history.filter((h) => (h.timestamp || "").slice(0, 10) === today).length;
      return {
        calculationsToday: calcToday,
        totalCalculations: state.history.length,
        savedResults: state.favorites.filter((f) => f.type === "calculation").length,
        favoriteTools: state.favorites.filter((f) => f.type === "tool").length,
      };
    },
  };

  global.AppState = AppState;
})(window);
