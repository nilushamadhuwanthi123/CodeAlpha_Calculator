/* ==========================================================================
   NEXORA — Settings (appearance, persistence, import/export)
   ========================================================================== */
(function (global) {
  "use strict";
  const S = global.StorageService;
  const K = S.KEYS;

  function renderSettingsView(root) {
    const persona = S.get(K.PERSONA, "general");
    const nightMode = ThemeManager.getNightMode();
    const schedule = ThemeManager.getNightSchedule();
    const reduceMotion = ThemeManager.getReduceMotion();
    const angleMode = AppState.getSettings().angleMode;

    root.innerHTML = `
      <div class="view-fade">
        <div class="section-heading" style="margin-top:0"><h2>Settings</h2></div>

        <div class="card settings-grid">
          <div class="settings-row">
            <div class="settings-row-text"><strong>Appearance</strong><span>Light, Dark or Eye Comfort</span></div>
            <div class="theme-choice-row" id="theme-choices">
              <button class="theme-choice" data-theme="light">Light</button>
              <button class="theme-choice" data-theme="dark">Dark</button>
              <button class="theme-choice" data-theme="eyecomfort">Eye Comfort</button>
            </div>
          </div>

          <div class="settings-row">
            <div class="settings-row-text"><strong>Auto Night Mode</strong><span>System, Manual, or Scheduled</span></div>
            <select class="select" id="night-mode-select" style="max-width:180px">
              <option value="manual">Manual</option>
              <option value="system">System</option>
              <option value="scheduled">Scheduled</option>
            </select>
          </div>

          <div class="settings-row" id="schedule-row" ${nightMode === "scheduled" ? "" : "hidden"}>
            <div class="settings-row-text"><strong>Night schedule</strong><span>Applies Dark automatically in this window</span></div>
            <div class="flex gap-2 items-center">
              <input class="input" id="sched-from" type="time" value="${schedule.from}" style="max-width:120px" />
              <span class="text-muted">to</span>
              <input class="input" id="sched-to" type="time" value="${schedule.to}" style="max-width:120px" />
            </div>
          </div>

          <div class="settings-row">
            <div class="settings-row-text"><strong>Reduce Motion</strong><span>Minimize animations and floating elements</span></div>
            <label class="switch"><input type="checkbox" id="reduce-motion-toggle" ${reduceMotion ? "checked" : ""} /><span class="switch-track"></span></label>
          </div>

          <div class="settings-row">
            <div class="settings-row-text"><strong>Angle Mode</strong><span>Used by scientific trigonometric functions</span></div>
            <div class="theme-choice-row">
              <button class="theme-choice" data-angle="DEG">DEG</button>
              <button class="theme-choice" data-angle="RAD">RAD</button>
            </div>
          </div>

          <div class="settings-row">
            <div class="settings-row-text"><strong>How do you calculate?</strong><span>Personalizes dashboard suggestions only</span></div>
            <select class="select" id="persona-select" style="max-width:180px">
              <option value="student">Student</option>
              <option value="developer">Developer</option>
              <option value="engineer">Engineer</option>
              <option value="analytics">Data / Analytics</option>
              <option value="general">General</option>
            </select>
          </div>
        </div>

        <div class="section-heading"><h2>Data</h2></div>
        <div class="card settings-grid">
          <div class="settings-row">
            <div class="settings-row-text"><strong>Export backup</strong><span>Download history, favorites, formulas, problems and settings</span></div>
            <button class="btn btn-secondary btn-sm" id="export-btn"><span data-lucide="download"></span>Export</button>
          </div>
          <div class="settings-row">
            <div class="settings-row-text"><strong>Import backup</strong><span>Restore from a nexora-backup.json file</span></div>
            <div>
              <input type="file" id="import-input" accept="application/json" hidden />
              <button class="btn btn-secondary btn-sm" id="import-btn"><span data-lucide="upload"></span>Import</button>
            </div>
          </div>
          <div class="settings-row">
            <div class="settings-row-text"><strong>Replay onboarding</strong><span>See the welcome experience again</span></div>
            <button class="btn btn-outline btn-sm" id="replay-onboarding"><span data-lucide="rotate-ccw"></span>Replay</button>
          </div>
        </div>
      </div>
    `;
    NexoraUtils.renderIcons(root);

    function syncThemeChoices() {
      const current = ThemeManager.currentTheme();
      root.querySelectorAll("#theme-choices .theme-choice").forEach((b) => b.classList.toggle("selected", b.dataset.theme === current));
    }
    syncThemeChoices();
    root.querySelectorAll("#theme-choices .theme-choice").forEach((btn) => {
      btn.addEventListener("click", () => { ThemeManager.setTheme(btn.dataset.theme); syncThemeChoices(); });
    });

    const nightSelect = root.querySelector("#night-mode-select");
    nightSelect.value = nightMode;
    nightSelect.addEventListener("change", () => {
      ThemeManager.setNightMode(nightSelect.value);
      root.querySelector("#schedule-row").hidden = nightSelect.value !== "scheduled";
      syncThemeChoices();
      Toast.show("Settings updated");
    });
    root.querySelector("#sched-from")?.addEventListener("change", (e) => {
      ThemeManager.setNightSchedule({ from: e.target.value, to: root.querySelector("#sched-to").value });
      Toast.show("Settings updated");
    });
    root.querySelector("#sched-to")?.addEventListener("change", (e) => {
      ThemeManager.setNightSchedule({ from: root.querySelector("#sched-from").value, to: e.target.value });
      Toast.show("Settings updated");
    });

    root.querySelector("#reduce-motion-toggle").addEventListener("change", (e) => {
      ThemeManager.setReduceMotion(e.target.checked);
      Toast.show("Settings updated");
    });

    function syncAngle() {
      root.querySelectorAll("[data-angle]").forEach((b) => b.classList.toggle("selected", b.dataset.angle === AppState.getSettings().angleMode));
    }
    syncAngle();
    root.querySelectorAll("[data-angle]").forEach((btn) => btn.addEventListener("click", () => {
      AppState.updateSettings({ angleMode: btn.dataset.angle });
      syncAngle();
      Toast.show("Settings updated");
    }));

    const personaSelect = root.querySelector("#persona-select");
    personaSelect.value = persona;
    personaSelect.addEventListener("change", () => {
      S.set(K.PERSONA, personaSelect.value, true);
      Toast.show("Settings updated");
    });

    root.querySelector("#export-btn").addEventListener("click", () => {
      const payload = S.exportBackup();
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "nexora-backup.json";
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      Toast.show("Backup exported");
    });

    const importInput = root.querySelector("#import-input");
    root.querySelector("#import-btn").addEventListener("click", () => importInput.click());
    importInput.addEventListener("change", () => {
      const file = importInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const payload = JSON.parse(reader.result);
          S.importBackup(payload);
          Toast.show("Backup imported — refreshing…");
          setTimeout(() => location.reload(), 900);
        } catch (e) {
          Toast.show("Unable to read this backup file.", { type: "error" });
        }
      };
      reader.onerror = () => Toast.show("Unable to read this backup file.", { type: "error" });
      reader.readAsText(file);
    });

    root.querySelector("#replay-onboarding").addEventListener("click", () => {
      OnboardingManager.reopen();
    });
  }

  global.SettingsView = { render: renderSettingsView };
})(window);
