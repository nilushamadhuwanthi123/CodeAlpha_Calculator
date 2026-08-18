/* ==========================================================================
   NEXORA — Equation Solver (Linear, Quadratic, 2x2 Systems) with steps
   ========================================================================== */
(function (global) {
  "use strict";

  function solveLinear(a, b, c) {
    // a x + b = c
    if (a === 0) return { ok: false, reason: "Not a linear equation in x (coefficient is zero)." };
    const x = (c - b) / a;
    return {
      ok: true,
      steps: [
        { title: "Original equation", body: `${a}x + ${b} = ${c}` },
        { title: "Subtract " + b, body: `${a}x = ${c - b}` },
        { title: "Divide by " + a, body: `x = ${NexoraUtils.formatNumber(x)}` },
      ],
      answer: `x = ${NexoraUtils.formatNumber(x)}`,
      raw: { x },
    };
  }

  function solveQuadratic(a, b, c) {
    if (a === 0) return solveLinear(b, c, 0);
    const disc = b * b - 4 * a * c;
    const steps = [
      { title: "Original equation", body: `${a}x² + ${b}x + ${c} = 0` },
      { title: "Discriminant", body: `Δ = b² − 4ac = ${b}² − 4(${a})(${c}) = ${disc}` },
    ];
    if (disc > 0) {
      const sq = Math.sqrt(disc);
      const x1 = (-b + sq) / (2 * a);
      const x2 = (-b - sq) / (2 * a);
      steps.push({ title: "Two real roots", body: `x = (−b ± √Δ) / 2a` });
      steps.push({ title: "Result", body: `x₁ = ${NexoraUtils.formatNumber(x1)}, x₂ = ${NexoraUtils.formatNumber(x2)}` });
      return { ok: true, steps, answer: `x = ${NexoraUtils.formatNumber(x1)}, ${NexoraUtils.formatNumber(x2)}`, raw: { x1, x2 } };
    } else if (disc === 0) {
      const x = -b / (2 * a);
      steps.push({ title: "One repeated root", body: `x = −b / 2a = ${NexoraUtils.formatNumber(x)}` });
      return { ok: true, steps, answer: `x = ${NexoraUtils.formatNumber(x)} (double root)`, raw: { x } };
    } else {
      const re = -b / (2 * a);
      const im = Math.sqrt(-disc) / (2 * a);
      steps.push({ title: "Complex roots", body: `x = ${NexoraUtils.formatNumber(re)} ± ${NexoraUtils.formatNumber(im)}i` });
      return { ok: true, steps, answer: `x = ${NexoraUtils.formatNumber(re)} ± ${NexoraUtils.formatNumber(im)}i`, raw: { re, im } };
    }
  }

  function solveSystem2x2(a1, b1, c1, a2, b2, c2) {
    // a1 x + b1 y = c1 ; a2 x + b2 y = c2
    const det = a1 * b2 - a2 * b1;
    const steps = [
      { title: "System", body: `${a1}x + ${b1}y = ${c1}\n${a2}x + ${b2}y = ${c2}` },
      { title: "Determinant", body: `D = a1b2 − a2b1 = ${det}` },
    ];
    if (det === 0) {
      return { ok: false, reason: "This system has no unique solution (determinant is zero)." };
    }
    const x = (c1 * b2 - c2 * b1) / det;
    const y = (a1 * c2 - a2 * c1) / det;
    steps.push({ title: "Solve for x (Cramer's rule)", body: `x = (c1b2 − c2b1) / D = ${NexoraUtils.formatNumber(x)}` });
    steps.push({ title: "Solve for y (Cramer's rule)", body: `y = (a1c2 − a2c1) / D = ${NexoraUtils.formatNumber(y)}` });
    return { ok: true, steps, answer: `x = ${NexoraUtils.formatNumber(x)}, y = ${NexoraUtils.formatNumber(y)}`, raw: { x, y } };
  }

  function renderStepList(container, result, method, problemLabel) {
    if (!result.ok) {
      container.innerHTML = `<div class="error-banner"><span data-lucide="alert-circle"></span>${NexoraUtils.escapeHtml(result.reason || "Please check your equation.")}</div>`;
      NexoraUtils.renderIcons(container);
      return;
    }
    const stepsHtml = result.steps.map((s, i) => `
      <div class="step-item">
        <div class="step-num">${i + 1}</div>
        <div class="step-body"><strong>${NexoraUtils.escapeHtml(s.title)}</strong><span>${NexoraUtils.escapeHtml(s.body)}</span></div>
      </div>
    `).join("");
    container.innerHTML = `
      <div class="badge badge-accent" style="margin-bottom:12px">Method: ${NexoraUtils.escapeHtml(method)}</div>
      <div class="step-list">${stepsHtml}</div>
      <div class="final-answer" style="margin-top:16px">Final Answer: ${NexoraUtils.escapeHtml(result.answer)}</div>
      <div class="flex gap-2 mt-4">
        <button class="btn btn-secondary btn-sm" id="eq-save"><span data-lucide="bookmark"></span>Save Problem</button>
        <button class="btn btn-secondary btn-sm" id="eq-copy"><span data-lucide="copy"></span>Copy Answer</button>
      </div>
    `;
    NexoraUtils.renderIcons(container);
    container.querySelector("#eq-save").addEventListener("click", () => {
      AppState.addSavedProblem({ problem: problemLabel, method, answer: result.answer, steps: result.steps, kind: "equation" });
      Toast.show("Calculation saved");
    });
    container.querySelector("#eq-copy").addEventListener("click", () => {
      NexoraUtils.copyToClipboard(result.answer).then(() => Toast.show("Formula copied"));
    });
    AppState.addHistory({ expression: problemLabel, result: result.answer, resultRaw: null, calculatorType: "Equation Solver" });
  }

  function renderEquationsView(root) {
    root.innerHTML = `
      <div class="view-fade">
        <div class="section-heading" style="margin-top:0"><h2>Equation Solver</h2></div>
        <div class="calc-layout">
          <div class="card">
            <div class="tabs" id="eq-tabs" style="margin-bottom:16px">
              <button class="tab active" data-t="linear">Linear</button>
              <button class="tab" data-t="quadratic">Quadratic</button>
              <button class="tab" data-t="system">System</button>
            </div>

            <div data-panel="linear">
              <p class="text-small text-muted" style="margin-bottom:12px">Form: a·x + b = c</p>
              <div class="grid-2">
                <div class="field"><label>a</label><input class="input" id="lin-a" type="number" value="2" /></div>
                <div class="field"><label>b</label><input class="input" id="lin-b" type="number" value="5" /></div>
              </div>
              <div class="field"><label>c</label><input class="input" id="lin-c" type="number" value="15" /></div>
              <button class="btn btn-primary btn-block" id="lin-solve">Solve</button>
            </div>

            <div data-panel="quadratic" hidden>
              <p class="text-small text-muted" style="margin-bottom:12px">Form: a·x² + b·x + c = 0</p>
              <div class="grid-2">
                <div class="field"><label>a</label><input class="input" id="quad-a" type="number" value="1" /></div>
                <div class="field"><label>b</label><input class="input" id="quad-b" type="number" value="5" /></div>
              </div>
              <div class="field"><label>c</label><input class="input" id="quad-c" type="number" value="6" /></div>
              <button class="btn btn-primary btn-block" id="quad-solve">Solve</button>
            </div>

            <div data-panel="system" hidden>
              <p class="text-small text-muted" style="margin-bottom:12px">a1x + b1y = c1 &nbsp;/&nbsp; a2x + b2y = c2</p>
              <div class="grid-2">
                <input class="input" id="sys-a1" type="number" value="2" placeholder="a1" />
                <input class="input" id="sys-b1" type="number" value="1" placeholder="b1" />
              </div>
              <input class="input mt-4" id="sys-c1" type="number" value="7" placeholder="c1" />
              <div class="grid-2 mt-4">
                <input class="input" id="sys-a2" type="number" value="1" placeholder="a2" />
                <input class="input" id="sys-b2" type="number" value="-1" placeholder="b2" />
              </div>
              <input class="input mt-4" id="sys-c2" type="number" value="1" placeholder="c2" />
              <button class="btn btn-primary btn-block mt-4" id="sys-solve">Solve</button>
            </div>
          </div>
          <div class="card result-panel" id="eq-result">
            <div class="empty-state">
              <div class="empty-state-icon"><span data-lucide="sigma"></span></div>
              <h3 class="empty-title">Ready to solve</h3>
              <p class="empty-desc">Enter coefficients and choose Solve to see the method and full steps.</p>
            </div>
          </div>
        </div>
      </div>
    `;

    const resultBox = root.querySelector("#eq-result");
    NexoraUtils.renderIcons(resultBox);

    root.querySelectorAll("#eq-tabs .tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        root.querySelectorAll("#eq-tabs .tab").forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        root.querySelectorAll("[data-panel]").forEach((p) => (p.hidden = p.dataset.panel !== tab.dataset.t));
      });
    });

    const num = (id) => parseFloat(root.querySelector(id).value) || 0;

    root.querySelector("#lin-solve").addEventListener("click", () => {
      const a = num("#lin-a"), b = num("#lin-b"), c = num("#lin-c");
      const result = solveLinear(a, b, c);
      renderStepList(resultBox, result, "Linear isolation", `${a}x + ${b} = ${c}`);
    });
    root.querySelector("#quad-solve").addEventListener("click", () => {
      const a = num("#quad-a"), b = num("#quad-b"), c = num("#quad-c");
      const result = solveQuadratic(a, b, c);
      renderStepList(resultBox, result, "Quadratic formula", `${a}x² + ${b}x + ${c} = 0`);
    });
    root.querySelector("#sys-solve").addEventListener("click", () => {
      const a1 = num("#sys-a1"), b1 = num("#sys-b1"), c1 = num("#sys-c1");
      const a2 = num("#sys-a2"), b2 = num("#sys-b2"), c2 = num("#sys-c2");
      const result = solveSystem2x2(a1, b1, c1, a2, b2, c2);
      renderStepList(resultBox, result, "Cramer's rule", `${a1}x+${b1}y=${c1}; ${a2}x+${b2}y=${c2}`);
    });
  }

  /* ---------------- University Mathematics ---------------- */
  function renderUniversityView(root) {
    root.innerHTML = `
      <div class="view-fade">
        <div class="section-heading" style="margin-top:0"><h2>University Mathematics</h2></div>
        <div class="tabs" id="uni-tabs" style="max-width:640px;margin-bottom:20px">
          <button class="tab active" data-t="algebra">Algebra</button>
          <button class="tab" data-t="calculus">Calculus</button>
          <button class="tab" data-t="trig">Trigonometry</button>
        </div>

        <div data-panel="algebra" class="calc-layout">
          <div class="card">
            <div class="field"><label>Expression</label><input class="input" id="alg-expr" value="x^2 + 5x + 6" /></div>
            <div class="flex gap-2" style="flex-wrap:wrap">
              <button class="btn btn-secondary btn-sm" data-alg="simplify">Simplify</button>
              <button class="btn btn-secondary btn-sm" data-alg="expand">Expand</button>
              <button class="btn btn-secondary btn-sm" data-alg="factor">Factor</button>
              <button class="btn btn-secondary btn-sm" data-alg="evaluate">Evaluate (x=2)</button>
            </div>
          </div>
          <div class="card result-panel" id="alg-result">
            <p class="text-muted text-small">Choose an operation to see the result. Factoring works for expressions math.js can express as a product; otherwise a simplified form is shown.</p>
          </div>
        </div>

        <div data-panel="calculus" class="calc-layout" hidden>
          <div class="card">
            <div class="field"><label>f(x)</label><input class="input" id="calc-expr" value="x^3 + 2x" /></div>
            <div class="flex gap-2" style="flex-wrap:wrap;margin-bottom:14px">
              <button class="btn btn-secondary btn-sm" data-calc="derivative">Differentiate</button>
              <button class="btn btn-secondary btn-sm" data-calc="integral">Numerical Integral</button>
              <button class="btn btn-secondary btn-sm" data-calc="limit">Limit at point</button>
            </div>
            <div class="grid-2">
              <div class="field"><label>Lower bound (a)</label><input class="input" id="calc-a" type="number" value="0" /></div>
              <div class="field"><label>Upper bound (b) / point</label><input class="input" id="calc-b" type="number" value="2" /></div>
            </div>
          </div>
          <div class="card result-panel" id="calc-result">
            <p class="text-muted text-small">Differentiation is exact (symbolic). Integration and limits use numerical approximation and are clearly labeled.</p>
          </div>
        </div>

        <div data-panel="trig" class="calc-layout" hidden>
          <div class="card">
            <div class="field"><label>Angle</label><input class="input" id="trig-angle" type="number" value="45" /></div>
            <div class="tabs" id="trig-unit" style="max-width:200px;margin-bottom:14px">
              <button class="tab active" data-u="deg">Degrees</button>
              <button class="tab" data-u="rad">Radians</button>
            </div>
            <button class="btn btn-primary btn-block" id="trig-solve">Calculate sin, cos, tan</button>
          </div>
          <div class="card result-panel" id="trig-result">
            <p class="text-muted text-small">Enter an angle to see all primary trigonometric values.</p>
          </div>
        </div>
      </div>
    `;

    root.querySelectorAll("#uni-tabs .tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        root.querySelectorAll("#uni-tabs .tab").forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        root.querySelectorAll("[data-panel]").forEach((p) => (p.hidden = p.dataset.panel !== tab.dataset.t));
      });
    });

    // Algebra
    const algResult = root.querySelector("#alg-result");
    root.querySelectorAll("[data-alg]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const expr = root.querySelector("#alg-expr").value.trim();
        const op = btn.dataset.alg;
        try {
          let out, label;
          if (op === "simplify") { out = math.simplify(expr).toString(); label = "Simplified"; }
          else if (op === "expand") { out = math.simplify(expr, {}, { exactFractions: false }).toString(); label = "Expanded / Simplified"; }
          else if (op === "factor") { out = tryFactor(expr); label = "Factored"; }
          else if (op === "evaluate") { out = String(math.evaluate(expr, { x: 2 })); label = "Evaluated at x = 2"; }
          algResult.innerHTML = `<div class="badge badge-accent" style="margin-bottom:10px">${label}</div><div class="final-answer">${NexoraUtils.escapeHtml(out)}</div>`;
          AppState.addHistory({ expression: `${op}(${expr})`, result: out, resultRaw: null, calculatorType: "University Math — Algebra" });
        } catch (e) {
          algResult.innerHTML = `<div class="error-banner"><span data-lucide="alert-circle"></span>That expression could not be evaluated.</div>`;
          NexoraUtils.renderIcons(algResult);
        }
      });
    });

    function tryFactor(expr) {
      // Attempt basic factoring for monic/general quadratics ax^2+bx+c via root-finding.
      // The linear term is optional as a whole: "x^2-4" must parse as b = 0, c = -4.
      // Previously only the trailing "x" was optional, so "-4" was captured as the
      // linear coefficient and the constant fell through as 0.
      const m = expr.replace(/\s+/g, "").match(/^([+-]?\d*)x\^2(?:([+-]\d*)x)?([+-]\d+)?$/i);
      if (m) {
        const a = m[1] === "" || m[1] === "+" ? 1 : m[1] === "-" ? -1 : parseFloat(m[1]);
        const b = m[2] ? (m[2] === "+" || m[2] === "-" ? parseFloat(m[2] + "1") : parseFloat(m[2])) : 0;
        const c = m[3] ? parseFloat(m[3]) : 0;
        const disc = b * b - 4 * a * c;
        if (disc >= 0 && a !== 0) {
          const sq = Math.sqrt(disc);
          const r1 = (-b + sq) / (2 * a);
          const r2 = (-b - sq) / (2 * a);
          if (Number.isInteger(r1) && Number.isInteger(r2)) {
            const sign1 = -r1 >= 0 ? "+" : "-";
            const sign2 = -r2 >= 0 ? "+" : "-";
            const prefix = a === 1 ? "" : a + " · ";
            return `${prefix}(x ${sign1} ${Math.abs(r1)})(x ${sign2} ${Math.abs(r2)})`;
          }
        }
      }
      return math.simplify(expr).toString() + "  (could not fully factor — simplified form shown)";
    }

    // Calculus
    const calcResult = root.querySelector("#calc-result");
    root.querySelectorAll("[data-calc]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const expr = root.querySelector("#calc-expr").value.trim();
        const a = parseFloat(root.querySelector("#calc-a").value) || 0;
        const b = parseFloat(root.querySelector("#calc-b").value) || 0;
        const op = btn.dataset.calc;
        try {
          if (op === "derivative") {
            const d = math.derivative(expr, "x").toString();
            calcResult.innerHTML = `<div class="badge badge-accent" style="margin-bottom:10px">Exact (symbolic)</div><div class="final-answer">d/dx(${NexoraUtils.escapeHtml(expr)}) = ${NexoraUtils.escapeHtml(d)}</div>`;
            AppState.addHistory({ expression: `d/dx(${expr})`, result: d, resultRaw: null, calculatorType: "University Math — Calculus" });
          } else if (op === "integral") {
            const f = math.compile(expr);
            const n = 2000;
            let sum = 0;
            const h = (b - a) / n;
            for (let i = 0; i < n; i++) {
              const x0 = a + i * h, x1 = a + (i + 1) * h;
              sum += (f.evaluate({ x: x0 }) + f.evaluate({ x: x1 })) / 2 * h;
            }
            calcResult.innerHTML = `<div class="badge" style="margin-bottom:10px">Approximate result (numerical)</div><div class="final-answer">∫[${a}, ${b}] ${NexoraUtils.escapeHtml(expr)} dx ≈ ${NexoraUtils.formatNumber(sum, 6)}</div>`;
            AppState.addHistory({ expression: `∫[${a},${b}] ${expr} dx`, result: NexoraUtils.formatNumber(sum, 6), resultRaw: sum, calculatorType: "University Math — Calculus" });
          } else if (op === "limit") {
            const f = math.compile(expr);
            const eps = 1e-6;
            const left = f.evaluate({ x: b - eps });
            const right = f.evaluate({ x: b + eps });
            const approx = (left + right) / 2;
            calcResult.innerHTML = `<div class="badge" style="margin-bottom:10px">Approximate result (numerical)</div><div class="final-answer">lim(x→${b}) ${NexoraUtils.escapeHtml(expr)} ≈ ${NexoraUtils.formatNumber(approx, 6)}</div>`;
            AppState.addHistory({ expression: `lim(x→${b}) ${expr}`, result: NexoraUtils.formatNumber(approx, 6), resultRaw: approx, calculatorType: "University Math — Calculus" });
          }
        } catch (e) {
          calcResult.innerHTML = `<div class="error-banner"><span data-lucide="alert-circle"></span>That expression could not be evaluated.</div>`;
          NexoraUtils.renderIcons(calcResult);
        }
      });
    });

    // Trig
    const trigResult = root.querySelector("#trig-result");
    let trigUnit = "deg";
    root.querySelectorAll("#trig-unit .tab").forEach((t) => t.addEventListener("click", () => {
      root.querySelectorAll("#trig-unit .tab").forEach((x) => x.classList.remove("active"));
      t.classList.add("active");
      trigUnit = t.dataset.u;
    }));
    root.querySelector("#trig-solve").addEventListener("click", () => {
      const angle = parseFloat(root.querySelector("#trig-angle").value) || 0;
      const rad = trigUnit === "deg" ? angle * Math.PI / 180 : angle;
      const s = Math.sin(rad), c = Math.cos(rad), t = Math.tan(rad);
      trigResult.innerHTML = `
        <div class="stat-grid">
          <div class="stat-tile"><div class="stat-tile-value">${NexoraUtils.formatNumber(s, 6)}</div><div class="stat-tile-label">sin</div></div>
          <div class="stat-tile"><div class="stat-tile-value">${NexoraUtils.formatNumber(c, 6)}</div><div class="stat-tile-label">cos</div></div>
          <div class="stat-tile"><div class="stat-tile-value">${isFinite(t) ? NexoraUtils.formatNumber(t, 6) : "undefined"}</div><div class="stat-tile-label">tan</div></div>
        </div>`;
      AppState.addHistory({ expression: `sin/cos/tan(${angle}${trigUnit === "deg" ? "°" : "rad"})`, result: `${NexoraUtils.formatNumber(s, 4)}, ${NexoraUtils.formatNumber(c, 4)}, ${isFinite(t) ? NexoraUtils.formatNumber(t, 4) : "∞"}`, resultRaw: null, calculatorType: "University Math — Trigonometry" });
    });

    NexoraUtils.renderIcons(root);
  }

  global.EquationsView = { render: renderEquationsView };
  global.UniversityView = { render: renderUniversityView };
  global.EquationEngine = { solveLinear, solveQuadratic, solveSystem2x2 };
})(window);
