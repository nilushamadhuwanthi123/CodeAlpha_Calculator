/* ==========================================================================
   NEXORA — Math Assistant
   A local, rule-based mathematical assistant. NOT a general-purpose LLM and
   NOT connected to any external AI API. It parses intent with keywords and
   regular expressions, then routes to the same math.js-backed engines used
   throughout NEXORA (equation solver, calculus, matrices, statistics).
   ========================================================================== */
(function (global) {
  "use strict";

  const EXPLAINS = {
    "power rule": "The power rule states:\nd/dx(xⁿ) = n·xⁿ⁻¹\n\nExample: d/dx(x²) = 2x, because n = 2 brings down as a coefficient and the exponent drops by 1.",
    "quadratic formula": "For ax² + bx + c = 0:\nx = (−b ± √(b² − 4ac)) / 2a\n\nThe discriminant (b² − 4ac) tells you how many real roots exist.",
    "pythagorean": "For a right triangle with legs a, b and hypotenuse c:\na² + b² = c²",
    "chain rule": "For a composite function f(g(x)):\nd/dx f(g(x)) = f'(g(x)) · g'(x)\n\nDifferentiate the outer function, then multiply by the derivative of the inner function.",
    "mean": "The arithmetic mean is the sum of all values divided by how many there are:\nx̄ = (Σxᵢ) / n",
  };

  function tryEquation(text) {
    const cleaned = text.replace(/\s+/g, "");
    const quad = cleaned.match(/([+-]?\d*\.?\d*)x\^2([+-]\d*\.?\d*)x([+-]\d+\.?\d*)?=0/i);
    if (quad) {
      const a = quad[1] === "" || quad[1] === "+" ? 1 : quad[1] === "-" ? -1 : parseFloat(quad[1]);
      const b = quad[2] ? parseFloat(quad[2]) : 0;
      const c = quad[3] ? parseFloat(quad[3]) : 0;
      const r = EquationEngine.solveQuadratic(a, b, c);
      if (r.ok) return `Solving ${text}:\n\n` + r.steps.map((s) => `• ${s.title}: ${s.body}`).join("\n") + `\n\nFinal answer: ${r.answer}`;
    }
    const lin = text.match(/([+-]?\d*\.?\d*)\s*x\s*([+-]\s*\d+\.?\d*)\s*=\s*([+-]?\d+\.?\d*)/i);
    if (lin) {
      let aStr = lin[1].replace(/\s+/g, "");
      const a = aStr === "" || aStr === "+" ? 1 : aStr === "-" ? -1 : parseFloat(aStr);
      const b = parseFloat(lin[2].replace(/\s+/g, ""));
      const c = parseFloat(lin[3]);
      const r = EquationEngine.solveLinear(a, b, c);
      if (r.ok) return `Solving ${text}:\n\n` + r.steps.map((s) => `• ${s.title}: ${s.body}`).join("\n") + `\n\nFinal answer: ${r.answer}`;
    }
    return null;
  }

  function tryDerivative(text) {
    const m = text.match(/d\/dx\s*\(?\s*([^)]+?)\s*\)?\s*$/i) || text.match(/differentiat\w*\s+(.+)/i);
    if (!m) return null;
    try {
      const expr = m[1].trim();
      const d = math.derivative(expr, "x").toString();
      return `The power/sum/product rules give:\n\nd/dx(${expr}) = ${d}`;
    } catch (e) {
      return "I couldn't differentiate that expression. Try a form like: differentiate x^3 + 2x";
    }
  }

  function tryCalculate(text) {
    const m = text.match(/calculate\s+(.+)/i) || text.match(/what is\s+(.+)\??/i) || text.match(/evaluate\s+(.+)/i);
    if (!m) return null;
    const res = MathEngine.safeEvaluate(m[1], { angleMode: AppState.getSettings().angleMode, lastAnswer: AppState.getLastAnswer() });
    if (res.ok) return `${m[1].trim()} = ${res.display}`;
    return "That expression could not be evaluated.";
  }

  function tryStats(text) {
    const m = text.match(/(?:mean|average|stats?|statistics)\s+(?:of\s+)?([\d.,\s-]+)/i);
    if (!m) return null;
    const data = m[1].split(",").map((s) => parseFloat(s.trim())).filter((v) => !isNaN(v));
    if (data.length < 1) return null;
    const s = StatsEngine.computeStats(data);
    return `For the dataset [${data.join(", ")}]:\n\n• Mean: ${NexoraUtils.formatNumber(s.mean, 4)}\n• Median: ${NexoraUtils.formatNumber(s.median, 4)}\n• Std Dev: ${NexoraUtils.formatNumber(s.stdDev, 4)}\n• Range: ${s.range}`;
  }

  function tryExplain(text) {
    const lower = text.toLowerCase();
    for (const key of Object.keys(EXPLAINS)) {
      if (lower.includes(key)) return EXPLAINS[key];
    }
    return null;
  }

  function respond(text) {
    const lower = text.toLowerCase();
    if (lower.includes("explain") || lower.includes("why")) {
      const explained = tryExplain(text);
      if (explained) return explained;
    }
    const eq = tryEquation(text);
    if (eq) return eq;
    const deriv = tryDerivative(text);
    if (deriv) return deriv;
    const stats = tryStats(text);
    if (stats) return stats;
    const calc = tryCalculate(text);
    if (calc) return calc;
    const direct = MathEngine.safeEvaluate(text, { angleMode: AppState.getSettings().angleMode, lastAnswer: AppState.getLastAnswer() });
    if (direct.ok) return `${text} = ${direct.display}`;
    return "I'm a local, rule-based mathematics assistant — I can solve equations (\"solve 2x+5=15\"), differentiate (\"differentiate x^3+2x\"), calculate (\"calculate 12*8\"), summarize a dataset (\"mean of 4,8,15\"), or explain a formula (\"explain the power rule\"). Try rephrasing your question in one of those forms.";
  }

  function renderAssistantView(root) {
    root.innerHTML = `
      <div class="view-fade">
        <div class="section-heading" style="margin-top:0"><h2>NEXORA Math Assistant</h2></div>
        <div class="assistant-disclaimer"><span data-lucide="info"></span>Local, rule-based mathematics assistant — runs entirely on this device using math.js and pattern matching. Not connected to any external AI service.</div>
        <div class="card">
          <div class="chat-log" id="chat-log"></div>
          <div class="chat-input-row">
            <input class="input" id="chat-input" placeholder='Try: "solve 2x + 5 = 15" or "differentiate x^3 + 2x"' />
            <button class="btn btn-primary" id="chat-send"><span data-lucide="send"></span></button>
          </div>
        </div>
      </div>
    `;
    NexoraUtils.renderIcons(root);
    const log = root.querySelector("#chat-log");
    const input = root.querySelector("#chat-input");

    function addMsg(text, who) {
      const div = document.createElement("div");
      div.className = "chat-msg " + who;
      div.textContent = text;
      log.appendChild(div);
      log.scrollTop = log.scrollHeight;
    }
    addMsg("Hi! I'm the NEXORA Math Assistant — a local, rule-based helper. Ask me to solve an equation, differentiate a function, calculate an expression, or explain a formula.", "bot");

    function send() {
      const text = input.value.trim();
      if (!text) return;
      addMsg(text, "user");
      input.value = "";
      const reply = respond(text);
      setTimeout(() => addMsg(reply, "bot"), 220);
    }
    root.querySelector("#chat-send").addEventListener("click", send);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") send(); });
  }

  global.AssistantView = { render: renderAssistantView };
})(window);
