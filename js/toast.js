/* ==========================================================================
   NEXORA — Toast notifications (no browser alert() ever)
   ========================================================================== */
(function (global) {
  "use strict";

  function showToast(message, opts) {
    opts = opts || {};
    const region = document.getElementById("toast-region");
    if (!region) return;
    const toast = document.createElement("div");
    toast.className = "toast" + (opts.type === "error" ? " toast-error" : "");
    toast.setAttribute("role", "status");
    const icon = opts.type === "error" ? "alert-circle" : "check-circle-2";
    toast.innerHTML = `<span data-lucide="${icon}"></span><span>${NexoraUtils.escapeHtml(message)}</span>`;
    region.appendChild(toast);
    NexoraUtils.renderIcons(toast);
    const life = opts.duration || 3200;
    const remove = () => {
      toast.style.transition = "opacity 200ms ease";
      toast.style.opacity = "0";
      setTimeout(() => toast.remove(), 220);
    };
    setTimeout(remove, life);
  }

  global.Toast = { show: showToast };
})(window);
