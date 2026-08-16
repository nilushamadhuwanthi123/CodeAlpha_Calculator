/* ==========================================================================
   NEXORA — Calculator View (Basic + Scientific tabs, keypad, keyboard support)
   ========================================================================== */
(function (global) {
  "use strict";

  const BASIC_KEYS = [
    { t: "AC", cls: "key key-danger", action: "clear" },
    { t: "DEL", cls: "key key-danger", action: "del" },
    { t: "%", cls: "key key-func", action: "percent" },
    { t: "÷", cls: "key key-op", action: "op", val: "/" },
    { t: "7", cls: "key", action: "digit" },
    { t: "8", cls: "key", action: "digit" },
    { t: "9", cls: "key", action: "digit" },
    { t: "×", cls: "key key-op", action: "op", val: "*" },
    { t: "4", cls: "key", action: "digit" },
    { t: "5", cls: "key", action: "digit" },
    { t: "6", cls: "key", action: "digit" },
    { t: "−", cls: "key key-op", action: "op", val: "-" },
    { t: "1", cls: "key", action: "digit" },
    { t: "2", cls: "key", action: "digit" },
    { t: "3", cls: "key", action: "digit" },
    { t: "+", cls: "key key-op", action: "op", val: "+" },
    { t: "±", cls: "key key-func", action: "sign" },
    { t: "0", cls: "key", action: "digit" },
    { t: ".", cls: "key", action: "digit" },
    { t: "=", cls: "key key-equals", action: "equals" },
  ];

  const SCI_KEYS = [
    { t: "sin", action: "fn", val: "sin(" }, { t: "cos", action: "fn", val: "cos(" },
    { t: "tan", action: "fn", val: "tan(" }, { t: "(", action: "digit" }, { t: ")", action: "digit" },
    { t: "asin", action: "fn", val: "asin(" }, { t: "acos", action: "fn", val: "acos(" },
    { t: "atan", action: "fn", val: "atan(" }, { t: "π", action: "digit" }, { t: "e", action: "digit" },
    { t: "log", action: "fn", val: "log10(" }, { t: "ln", action: "fn", val: "log(" },
    { t: "√", action: "fn", val: "sqrt(" }, { t: "∛", action: "fn", val: "cbrt(" }, { t: "x!", action: "postfix", val: "!" },
    { t: "x²", action: "postfix", val: "^2" }, { t: "x³", action: "postfix", val: "^3" },
    { t: "xʸ", action: "op", val: "^" }, { t: "1/x", action: "wrap", val: "1/(", close: ")" }, { t: "|x|", action: "fn", val: "abs(" },
  ];

  function buildKeypad(keys, extraClass) {
    const wrap = document.createElement("div");
    wrap.className = "keypad " + (extraClass || "");
    keys.forEach((k) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = k.cls || "key key-func";
      btn.textContent = k.t;
      btn.dataset.action = k.action;
      if (k.val) btn.dataset.val = k.val;
      if (k.close) btn.dataset.close = k.close;
      wrap.appendChild(btn);
    });
    return wrap;
  }

  function renderCalculatorView(root) {
    root.innerHTML = `
      <div class="view-fade">
        <div class="section-heading" style="margin-top:0">
          <h2>Calculator</h2>
          <div class="tabs" style="width:220px" id="calc-mode-tabs">
            <button class="tab active" data-mode="basic">Basic</button>
            <button class="tab" data-mode="scientific">Scientific</button>
          </div>
        </div>
        <div class="calc-layout">
          <div class="card calc-card">
            <div class="calc-display">
              <span class="calc-mem-badge"></span>
              <div class="calc-expression" aria-live="polite"></div>
              <div class="calc-result" aria-live="polite">0</div>
            </div>
            <div class="calc-mem-row">
              <button class="btn btn-secondary btn-sm" data-mem="MC">MC</button>
              <button class="btn btn-secondary btn-sm" data-mem="MR">MR</button>
              <button class="btn btn-secondary btn-sm" data-mem="M+">M+</button>
              <button class="btn btn-secondary btn-sm" data-mem="M-">M-</button>
              <button class="btn btn-secondary btn-sm" data-mem="ANS">ANS</button>
            </div>
            <div id="calc-keypad-basic"></div>
            <div id="calc-keypad-sci" class="sci-panel" hidden>
              <div class="sci-toggle-row">
                <div class="tabs" id="angle-mode-tabs" style="width:160px">
                  <button class="tab" data-angle="DEG">DEG</button>
                  <button class="tab" data-angle="RAD">RAD</button>
                </div>
              </div>
            </div>
          </div>
          <div class="card">
            <h3 style="margin-bottom:12px;font-size:1rem">Keyboard Shortcuts</h3>
            <div class="text-small text-muted" style="line-height:2">
              <div><kbd>0–9</kbd> Digits</div>
              <div><kbd>+</kbd> <kbd>-</kbd> <kbd>*</kbd> <kbd>/</kbd> Operators</div>
              <div><kbd>Enter</kbd> Calculate</div>
              <div><kbd>Backspace</kbd> Delete</div>
              <div><kbd>Escape</kbd> Clear all</div>
              <div><kbd>%</kbd> Percent</div>
              <div><kbd>.</kbd> Decimal point</div>
            </div>
            <h3 style="margin:20px 0 12px;font-size:1rem">Tip</h3>
            <p class="text-small text-muted">Switch to Scientific for trigonometry, logarithms, powers and constants. Use the DEG/RAD toggle to control angle units.</p>
          </div>
        </div>
      </div>
    `;

    const basicHost = root.querySelector("#calc-keypad-basic");
    const sciHost = root.querySelector("#calc-keypad-sci");
    basicHost.appendChild(buildKeypad(BASIC_KEYS));
    sciHost.appendChild(buildKeypad(SCI_KEYS, "sci-keys"));

    const calcCard = root.querySelector(".calc-card");
    const controller = CalculatorFactory.create(calcCard, { type: "Basic Calculator" });

    // Angle mode tabs
    const angleTabs = root.querySelectorAll("#angle-mode-tabs .tab");
    function syncAngleTabs() {
      const mode = AppState.getSettings().angleMode;
      angleTabs.forEach((t) => t.classList.toggle("active", t.dataset.angle === mode));
    }
    syncAngleTabs();
    angleTabs.forEach((t) => t.addEventListener("click", () => {
      AppState.updateSettings({ angleMode: t.dataset.angle });
      syncAngleTabs();
    }));

    // Mode tabs (basic/scientific)
    root.querySelectorAll("#calc-mode-tabs .tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        root.querySelectorAll("#calc-mode-tabs .tab").forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        const sci = tab.dataset.mode === "scientific";
        sciHost.hidden = !sci;
        controller.opts = controller.opts || {};
        calcCard.dataset.currentType = sci ? "Scientific Calculator" : "Basic Calculator";
      });
    });
    calcCard.dataset.currentType = "Basic Calculator";

    function handleKeyAction(btn) {
      const action = btn.dataset.action;
      const val = btn.dataset.val;
      btn.classList.add("pressed");
      setTimeout(() => btn.classList.remove("pressed"), 140);
      switch (action) {
        case "digit": controller.input(btn.textContent === "π" ? "pi" : btn.textContent); break;
        case "op": controller.input(val); break;
        case "clear": controller.clearAll(); break;
        case "del": controller.del(); break;
        case "sign": controller.toggleSign(); break;
        case "percent": controller.percent(); break;
        case "equals": {
          controller.opts = { type: calcCard.dataset.currentType };
          runEvaluate();
          break;
        }
        case "fn": controller.inputFunction(val); break;
        case "postfix": controller.input(val); break;
        case "wrap": controller.inputFunction(val); break;
      }
    }

    function runEvaluate() {
      // Re-create with correct type tag by monkey-patching addHistory type via wrapper
      const originalType = calcCard.dataset.currentType;
      const origAdd = AppState.addHistory.bind(AppState);
      AppState.addHistory = function (entry) {
        entry.calculatorType = originalType;
        return origAdd(entry);
      };
      controller.evaluate();
      AppState.addHistory = origAdd;
    }

    [basicHost, sciHost].forEach((host) => {
      host.addEventListener("click", (e) => {
        const btn = e.target.closest("button");
        if (btn) handleKeyAction(btn);
      });
    });

    root.querySelectorAll("[data-mem]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (btn.dataset.mem === "ANS") {
          controller.input("ANS");
        } else {
          controller.memory(btn.dataset.mem);
          Toast.show(btn.dataset.mem === "MC" ? "Memory cleared" : "Memory updated");
        }
      });
    });

    // Keyboard support
    function onKeydown(e) {
      if (!document.body.contains(root)) return;
      if (document.activeElement && ["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) return;
      const k = e.key;
      if (/^[0-9]$/.test(k)) { controller.input(k); e.preventDefault(); }
      else if (["+", "-", "*", "/"].includes(k)) { controller.input(k); e.preventDefault(); }
      else if (k === ".") { controller.input("."); e.preventDefault(); }
      else if (k === "Enter" || k === "=") { runEvaluate(); e.preventDefault(); }
      else if (k === "Backspace") { controller.del(); e.preventDefault(); }
      else if (k === "Escape") { controller.clearAll(); e.preventDefault(); }
      else if (k === "%") { controller.percent(); e.preventDefault(); }
      else if (k === "(" || k === ")") { controller.input(k); e.preventDefault(); }
    }
    document.addEventListener("keydown", onKeydown);
    root._cleanup = () => document.removeEventListener("keydown", onKeydown);

    NexoraUtils.renderIcons(root);
  }

  global.CalculatorView = { render: renderCalculatorView };
})(window);
