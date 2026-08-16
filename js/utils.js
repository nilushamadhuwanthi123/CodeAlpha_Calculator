/* ==========================================================================
   NEXORA — Shared utilities
   ========================================================================== */
(function (global) {
  "use strict";

  function uid() {
    return "id-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  }

  function nowISO() {
    return new Date().toISOString();
  }

  function formatNumber(n, maxDecimals) {
    if (typeof n !== "number" || !isFinite(n)) return String(n);
    const md = typeof maxDecimals === "number" ? maxDecimals : 10;
    let out = Number(n.toFixed(md));
    return out.toString();
  }

  function formatTimestamp(iso) {
    const d = new Date(iso);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (sameDay) return "Today, " + time;
    const yest = new Date(now);
    yest.setDate(now.getDate() - 1);
    if (d.toDateString() === yest.toDateString()) return "Yesterday, " + time;
    return d.toLocaleDateString([], { month: "short", day: "numeric" }) + ", " + time;
  }

  function debounce(fn, ms) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), ms);
    };
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach((k) => {
        if (k === "class") node.className = attrs[k];
        else if (k === "html") node.innerHTML = attrs[k];
        else if (k.startsWith("on") && typeof attrs[k] === "function") {
          node.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
        } else node.setAttribute(k, attrs[k]);
      });
    }
    (children || []).forEach((c) => {
      if (c == null) return;
      node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return node;
  }

  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch (e) { /* noop */ }
    document.body.removeChild(ta);
    return Promise.resolve();
  }

  function friendlyMathError(rawMessage) {
    const msg = (rawMessage || "").toLowerCase();
    if (msg.includes("undefined symbol") || msg.includes("unexpected")) {
      return "That expression could not be evaluated.";
    }
    if (msg.includes("division") || msg.includes("divide")) {
      return "That expression could not be evaluated.";
    }
    return "That expression could not be evaluated.";
  }

  function renderIcons(root) {
    if (global.lucide && typeof global.lucide.createIcons === "function") {
      global.lucide.createIcons({ nameAttr: "data-lucide", attrs: {}, root: root || document });
    }
  }

  function reducedMotion() {
    return document.documentElement.getAttribute("data-reduce-motion") === "true" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  global.NexoraUtils = {
    uid, nowISO, formatNumber, formatTimestamp, debounce, escapeHtml, el,
    copyToClipboard, friendlyMathError, renderIcons, reducedMotion,
  };
})(window);
