/* ==========================================================================
   NEXORA — Onboarding (3 screens) + first-run personalization
   ========================================================================== */
(function (global) {
  "use strict";
  const S = global.StorageService;
  const K = S.KEYS;

  let currentScreen = 0;
  const TOTAL_SCREENS = 3;

  function showScreen(index) {
    document.querySelectorAll(".onboarding-screen").forEach((s, i) => {
      s.hidden = i !== index;
    });
    document.querySelectorAll(".onboarding-progress .dot").forEach((d, i) => {
      d.classList.toggle("active", i === index);
    });
    const nextBtn = document.getElementById("onboarding-next");
    nextBtn.textContent = index === TOTAL_SCREENS - 1 ? "Start Calculating" : "Continue";
  }

  function completeOnboarding() {
    S.set(K.ONBOARDED, true, true);
    document.getElementById("onboarding").hidden = true;
    document.body.style.overflow = "";
    maybeShowPersonalize();
  }

  function maybeShowPersonalize() {
    const persona = S.get(K.PERSONA, null);
    if (persona) return;
    const modal = document.getElementById("personalize");
    modal.hidden = false;
  }

  function initPersonalize() {
    const modal = document.getElementById("personalize");
    modal.querySelectorAll(".persona-card").forEach((card) => {
      card.addEventListener("click", () => {
        const persona = card.getAttribute("data-persona");
        S.set(K.PERSONA, persona, true);
        modal.hidden = true;
        Toast.show("Preferences saved");
        global.dispatchEvent(new CustomEvent("nexora:persona-changed", { detail: persona }));
      });
    });
    document.getElementById("personalize-skip").addEventListener("click", () => {
      S.set(K.PERSONA, "general", true);
      modal.hidden = true;
    });
  }

  function init() {
    const onboarded = S.get(K.ONBOARDED, false);
    const panel = document.getElementById("onboarding");
    initPersonalize();

    // Wire the controls up before the early return below. reopen() can show this
    // panel long after init() ran, and binding inside the not-yet-onboarded branch
    // meant a replayed tour had dead Continue/Skip buttons and a scroll-locked
    // page with no way out short of reloading.
    document.getElementById("onboarding-next").addEventListener("click", () => {
      if (currentScreen < TOTAL_SCREENS - 1) {
        currentScreen += 1;
        showScreen(currentScreen);
      } else {
        completeOnboarding();
      }
    });
    document.getElementById("onboarding-skip").addEventListener("click", completeOnboarding);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !panel.hidden) completeOnboarding();
    });

    if (onboarded) {
      panel.hidden = true;
      maybeShowPersonalize();
      return;
    }

    panel.hidden = false;
    document.body.style.overflow = "hidden";
    showScreen(0);
    NexoraUtils.renderIcons(panel);
  }

  global.OnboardingManager = { init, reopen() {
    S.set(K.ONBOARDED, false, true);
    currentScreen = 0;
    const panel = document.getElementById("onboarding");
    panel.hidden = false;
    document.body.style.overflow = "hidden";
    showScreen(0);
    // init() renders the icons on first run; a replay needs the same treatment
    // or the panel comes back with empty icon slots.
    NexoraUtils.renderIcons(panel);
  } };
})(window);
