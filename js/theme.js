/* ==========================================================================
   NEXORA — Appearance system: Light / Dark / Eye Comfort + Auto Night Mode
   ========================================================================== */
(function (global) {
  "use strict";
  const S = global.StorageService;
  const K = S.KEYS;

  const root = document.documentElement;

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      const colors = { light: "#5B4BDB", dark: "#080817", eyecomfort: "#F3ECDF" };
      meta.setAttribute("content", colors[theme] || colors.light);
    }
    const themeBtn = document.getElementById("topbar-theme");
    if (themeBtn) {
      const icons = { light: "moon", dark: "sun", eyecomfort: "eye" };
      themeBtn.innerHTML = `<span data-lucide="${icons[theme] || "moon"}"></span>`;
      NexoraUtils.renderIcons(themeBtn);
    }
  }

  function inScheduledWindow(schedule) {
    if (!schedule || !schedule.from || !schedule.to) return false;
    const now = new Date();
    const cur = now.getHours() * 60 + now.getMinutes();
    const [fh, fm] = schedule.from.split(":").map(Number);
    const [th, tm] = schedule.to.split(":").map(Number);
    const from = fh * 60 + fm;
    const to = th * 60 + tm;
    if (from === to) return false;
    if (from < to) return cur >= from && cur < to;
    return cur >= from || cur < to; // wraps past midnight
  }

  function resolveActiveTheme() {
    const manualTheme = S.get(K.THEME, "light");
    const nightMode = S.get(K.NIGHT_MODE, "manual");
    if (nightMode === "system") {
      const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      return prefersDark ? "dark" : "light";
    }
    if (nightMode === "scheduled") {
      const schedule = S.get(K.NIGHT_SCHEDULE, { from: "19:00", to: "06:00" });
      return inScheduledWindow(schedule) ? "dark" : "light";
    }
    return manualTheme;
  }

  function setTheme(theme, opts) {
    opts = opts || {};
    S.set(K.THEME, theme, true);
    if (opts.setManualMode !== false) S.set(K.NIGHT_MODE, "manual", true);
    applyTheme(theme);
    if (opts.toast !== false) {
      const labels = { light: "Light mode enabled", dark: "Dark mode enabled", eyecomfort: "Eye Comfort enabled" };
      Toast.show(labels[theme] || "Theme updated");
    }
  }

  function cycleTheme() {
    const current = root.getAttribute("data-theme");
    const order = ["light", "dark", "eyecomfort"];
    const next = order[(order.indexOf(current) + 1) % order.length];
    setTheme(next);
  }

  function initReduceMotion() {
    const stored = S.get(K.REDUCE_MOTION, null);
    const systemPref = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const active = stored === null ? systemPref : stored;
    root.setAttribute("data-reduce-motion", active ? "true" : "false");
  }

  function setReduceMotion(active) {
    S.set(K.REDUCE_MOTION, active, true);
    root.setAttribute("data-reduce-motion", active ? "true" : "false");
  }

  function initNightSchedulePolling() {
    setInterval(() => {
      const nightMode = S.get(K.NIGHT_MODE, "manual");
      if (nightMode === "scheduled" || nightMode === "system") {
        applyTheme(resolveActiveTheme());
      }
    }, 60000);
  }

  function init() {
    applyTheme(resolveActiveTheme());
    initReduceMotion();
    initNightSchedulePolling();
  }

  global.ThemeManager = {
    init, setTheme, cycleTheme, resolveActiveTheme,
    setReduceMotion,
    setNightMode(mode) { S.set(K.NIGHT_MODE, mode, true); applyTheme(resolveActiveTheme()); },
    getNightMode() { return S.get(K.NIGHT_MODE, "manual"); },
    setNightSchedule(schedule) { S.set(K.NIGHT_SCHEDULE, schedule, true); applyTheme(resolveActiveTheme()); },
    getNightSchedule() { return S.get(K.NIGHT_SCHEDULE, { from: "19:00", to: "06:00" }); },
    getReduceMotion() { return S.get(K.REDUCE_MOTION, window.matchMedia("(prefers-reduced-motion: reduce)").matches); },
    currentTheme() { return root.getAttribute("data-theme"); },
  };
})(window);
