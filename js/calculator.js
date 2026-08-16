/* ==========================================================================
   NEXORA — MathEngine (safe expression evaluation, no eval()) + Basic Calculator
   ========================================================================== */
(function (global) {
  "use strict";

  /* ---------------- MathEngine ---------------- */
  const TRIG_DIRECT = ["sin", "cos", "tan"];
  const TRIG_INVERSE = ["asin", "acos", "atan"];

  function findMatchingParen(str, openIdx) {
    let depth = 0;
    for (let i = openIdx; i < str.length; i++) {
      if (str[i] === "(") depth++;
      else if (str[i] === ")") {
        depth--;
        if (depth === 0) return i;
      }
    }
    return -1;
  }

  // Rewrites sin(x) -> sin(x deg) and asin(x) -> (asin(x) * 180/pi) when in DEG mode.
  function applyAngleMode(expr, angleMode) {
    if (angleMode !== "DEG") return expr;
    let out = expr;
    let changed = true;
    let guard = 0;
    while (changed && guard < 40) {
      changed = false;
      guard++;
      for (const fn of TRIG_DIRECT) {
        const re = new RegExp("\\b" + fn + "\\(", "g");
        let m;
        while ((m = re.exec(out))) {
          const openIdx = m.index + fn.length;
          const closeIdx = findMatchingParen(out, openIdx);
          if (closeIdx === -1) continue;
          const arg = out.slice(openIdx + 1, closeIdx);
          if (arg.includes("__marked__")) continue;
          const replacement = fn + "(__marked__(" + arg + ") deg)";
          out = out.slice(0, m.index) + replacement + out.slice(closeIdx + 1);
          changed = true;
          break;
        }
        if (changed) break;
      }
      if (changed) continue;
      for (const fn of TRIG_INVERSE) {
        const re = new RegExp("\\b" + fn + "\\(", "g");
        let m;
        while ((m = re.exec(out))) {
          const openIdx = m.index + fn.length;
          const closeIdx = findMatchingParen(out, openIdx);
          if (closeIdx === -1) continue;
          const arg = out.slice(openIdx + 1, closeIdx);
          if (arg.includes("__marked__")) continue;
          const replacement = "__marked__(" + fn + "(" + arg + ") * 180 / pi)";
          out = out.slice(0, m.index) + replacement + out.slice(closeIdx + 1);
          changed = true;
          break;
        }
        if (changed) break;
      }
    }
    return out.replace(/__marked__/g, "");
  }

  // Convert trailing percent tokens: "50%" -> "(50/100)", "20+5%" stays algebraic (5/100).
  function applyPercent(expr) {
    return expr.replace(/(\d+(\.\d+)?)%/g, "($1/100)");
  }

  function preprocessExpression(raw, opts) {
    opts = opts || {};
    let expr = raw;
    expr = expr.replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-");
    expr = expr.replace(/π/g, "pi");
    expr = expr.replace(/\bANS\b/gi, "(" + (opts.lastAnswer || 0) + ")");
    expr = applyPercent(expr);
    expr = applyAngleMode(expr, opts.angleMode || "DEG");
    return expr;
  }

  function safeEvaluate(raw, opts) {
    opts = opts || {};
    if (!raw || !raw.trim()) return { ok: false, error: "Empty expression." };
    try {
      const expr = preprocessExpression(raw, opts);
      const scope = { pi: Math.PI, e: Math.E, ans: opts.lastAnswer || 0 };
      const result = math.evaluate(expr, scope);
      if (typeof result === "function") {
        return { ok: false, error: "That expression could not be evaluated." };
      }
      let numeric = result;
      if (result && result.type === "Unit") numeric = result.toNumber();
      if (result && result.isComplex) {
        return { ok: false, error: "That expression could not be evaluated." };
      }
      if (typeof numeric !== "number" || !isFinite(numeric)) {
        if (typeof numeric === "number" && isNaN(numeric)) {
          return { ok: false, error: "That expression could not be evaluated." };
        }
        if (typeof numeric === "number" && !isFinite(numeric)) {
          return { ok: false, error: "That expression could not be evaluated." };
        }
        return { ok: false, error: "That expression could not be evaluated." };
      }
      return { ok: true, value: numeric, display: NexoraUtils.formatNumber(numeric) };
    } catch (e) {
      return { ok: false, error: NexoraUtils.friendlyMathError(e.message) };
    }
  }

  global.MathEngine = { safeEvaluate, preprocessExpression };

  /* ---------------- Basic Calculator View ---------------- */
  const CalcOps = ["+", "-", "*", "/"];

  function createCalculatorController(container, opts) {
    opts = opts || {};
    let expression = "";
    let lastResult = null;
    let justEvaluated = false;

    const exprEl = container.querySelector(".calc-expression");
    const resultEl = container.querySelector(".calc-result");
    const memBadge = container.querySelector(".calc-mem-badge");

    function updateMemBadge() {
      const m = AppState.getMemory();
      memBadge.textContent = m ? "M" : "";
    }

    function render(previewOnly) {
      exprEl.textContent = expression || "0";
      if (previewOnly && expression) {
        const angleMode = AppState.getSettings().angleMode;
        const res = MathEngine.safeEvaluate(expression, { angleMode, lastAnswer: AppState.getLastAnswer() });
        resultEl.classList.remove("is-error");
        resultEl.textContent = res.ok ? res.display : "";
      }
      updateMemBadge();
    }

    function pulseResult() {
      resultEl.classList.remove("pulse");
      void resultEl.offsetWidth;
      resultEl.classList.add("pulse");
    }

    function input(token) {
      if (justEvaluated) {
        if (/^[0-9.]$/.test(token)) {
          expression = "";
        } else if (CalcOps.includes(token)) {
          expression = String(lastResult != null ? lastResult : "");
        }
        justEvaluated = false;
      }
      expression += token;
      render(true);
    }

    function inputFunction(fnToken) {
      if (justEvaluated) { expression = ""; justEvaluated = false; }
      expression += fnToken;
      render(true);
    }

    function clearAll() {
      expression = "";
      resultEl.textContent = "0";
      resultEl.classList.remove("is-error");
      justEvaluated = false;
      render();
    }

    function del() {
      if (justEvaluated) { clearAll(); return; }
      expression = expression.slice(0, -1);
      render(true);
    }

    function toggleSign() {
      // Wrap whole expression in unary negation toggle: naive but predictable.
      if (!expression) return;
      if (expression.startsWith("-(") && expression.endsWith(")")) {
        expression = expression.slice(2, -1);
      } else {
        expression = "-(" + expression + ")";
      }
      render(true);
    }

    function percent() {
      if (!expression) return;
      expression += "%";
      render(true);
    }

    function evaluate() {
      if (!expression.trim()) return;
      const angleMode = AppState.getSettings().angleMode;
      const res = MathEngine.safeEvaluate(expression, { angleMode, lastAnswer: AppState.getLastAnswer() });
      if (!res.ok) {
        resultEl.textContent = res.error;
        resultEl.classList.add("is-error");
        return;
      }
      lastResult = res.value;
      resultEl.classList.remove("is-error");
      resultEl.textContent = res.display;
      pulseResult();
      AppState.addHistory({
        expression,
        result: res.display,
        resultRaw: res.value,
        calculatorType: opts.type || "Basic Calculator",
      });
      justEvaluated = true;
    }

    function memory(op) {
      const cur = AppState.getMemory();
      if (op === "MC") AppState.setMemory(0);
      else if (op === "MR") { expression += String(cur); render(true); }
      else if (op === "M+") AppState.setMemory(cur + (lastResult != null ? lastResult : 0));
      else if (op === "M-") AppState.setMemory(cur - (lastResult != null ? lastResult : 0));
      updateMemBadge();
    }

    clearAll();

    return {
      input, inputFunction, clearAll, del, toggleSign, percent, evaluate, memory,
      getExpression: () => expression,
      setExpression: (v) => { expression = v; justEvaluated = false; render(true); },
    };
  }

  global.CalculatorFactory = { create: createCalculatorController };
})(window);
