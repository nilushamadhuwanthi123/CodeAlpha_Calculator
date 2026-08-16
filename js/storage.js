/* ==========================================================================
   NEXORA — StorageService
   Centralized, debounced localStorage access. No writes on every keystroke.
   ========================================================================== */
(function (global) {
  "use strict";

  const NAMESPACE = "nexora:";
  const VERSION = 1;

  const KEYS = {
    ONBOARDED: "onboarded",
    PERSONA: "persona",
    THEME: "theme",
    NIGHT_MODE: "nightMode", // system | manual | scheduled
    NIGHT_SCHEDULE: "nightSchedule",
    REDUCE_MOTION: "reduceMotion",
    HISTORY: "history",
    FAVORITES: "favorites",
    SETTINGS: "settings",
    MEMORY: "memory",
    RECENT_TOOLS: "recentTools",
    SAVED_FORMULAS: "savedFormulas",
    SAVED_PROBLEMS: "savedProblems",
    DASHBOARD_STATE: "dashboardState",
    ANSWER: "lastAnswer",
    ACTIVITY: "activityLog", // date -> count, for weekly chart
  };

  const pendingWrites = new Map();
  const DEBOUNCE_MS = 350;

  function fullKey(key) {
    return NAMESPACE + key;
  }

  function readRaw(key, fallback) {
    try {
      const raw = localStorage.getItem(fullKey(key));
      if (raw === null) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      console.warn("NEXORA storage read failed for", key, e);
      return fallback;
    }
  }

  function writeRawImmediate(key, value) {
    try {
      localStorage.setItem(fullKey(key), JSON.stringify(value));
    } catch (e) {
      console.warn("NEXORA storage write failed for", key, e);
    }
  }

  function writeDebounced(key, value) {
    if (pendingWrites.has(key)) {
      clearTimeout(pendingWrites.get(key).timer);
    }
    const timer = setTimeout(() => {
      writeRawImmediate(key, value);
      pendingWrites.delete(key);
    }, DEBOUNCE_MS);
    pendingWrites.set(key, { timer, value });
  }

  function flushAll() {
    pendingWrites.forEach((entry, key) => {
      clearTimeout(entry.timer);
      writeRawImmediate(key, entry.value);
    });
    pendingWrites.clear();
  }

  window.addEventListener("beforeunload", flushAll);
  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushAll();
  });

  const StorageService = {
    KEYS,
    VERSION,
    get(key, fallback) {
      if (pendingWrites.has(key)) return pendingWrites.get(key).value;
      return readRaw(key, fallback);
    },
    set(key, value, immediate) {
      if (immediate) {
        if (pendingWrites.has(key)) {
          clearTimeout(pendingWrites.get(key).timer);
          pendingWrites.delete(key);
        }
        writeRawImmediate(key, value);
      } else {
        writeDebounced(key, value);
      }
    },
    remove(key) {
      if (pendingWrites.has(key)) {
        clearTimeout(pendingWrites.get(key).timer);
        pendingWrites.delete(key);
      }
      localStorage.removeItem(fullKey(key));
    },
    flushAll,
    exportBackup() {
      flushAll();
      const payload = {
        app: "NEXORA",
        version: VERSION,
        exportedAt: new Date().toISOString(),
        data: {
          history: this.get(KEYS.HISTORY, []),
          favorites: this.get(KEYS.FAVORITES, []),
          savedFormulas: this.get(KEYS.SAVED_FORMULAS, []),
          savedProblems: this.get(KEYS.SAVED_PROBLEMS, []),
          settings: this.get(KEYS.SETTINGS, {}),
        },
      };
      return payload;
    },
    importBackup(payload) {
      if (!payload || typeof payload !== "object") {
        throw new Error("Unable to read this backup file.");
      }
      if (payload.app !== "NEXORA" || typeof payload.version !== "number") {
        throw new Error("Unable to read this backup file.");
      }
      const d = payload.data || {};
      if (Array.isArray(d.history)) this.set(KEYS.HISTORY, d.history, true);
      if (Array.isArray(d.favorites)) this.set(KEYS.FAVORITES, d.favorites, true);
      if (Array.isArray(d.savedFormulas)) this.set(KEYS.SAVED_FORMULAS, d.savedFormulas, true);
      if (Array.isArray(d.savedProblems)) this.set(KEYS.SAVED_PROBLEMS, d.savedProblems, true);
      if (d.settings && typeof d.settings === "object") this.set(KEYS.SETTINGS, d.settings, true);
      return true;
    },
  };

  global.StorageService = StorageService;
})(window);
