/* ==========================================================================
   NEXORA — Study Mode (step-by-step solutions, hints, saved problems)
   ========================================================================== */
(function (global) {
  "use strict";

  function renderStudyView(root) {
    root.innerHTML = `
      <div class="view-fade">
        <div class="section-heading" style="margin-top:0"><h2>Study Mode</h2></div>
        <div class="calc-layout">
          <div class="card">
            <div class="field"><label>Problem</label><input class="input" id="study-problem" value="2x + 5 = 15" placeholder="e.g. 2x + 5 = 15, or x^2 + 5x + 6 = 0" /></div>
            <button class="btn btn-primary btn-block" id="study-solve">Show Step-by-Step Solution</button>
            <h3 style="margin:20px 0 10px;font-size:0.92rem">Hint</h3>
            <p class="text-small text-muted" id="study-hint">Isolate the variable by undoing operations in reverse order (PEMDAS in reverse).</p>
          </div>
          <div class="card" id="study-result">
            <div class="empty-state">
              <div class="empty-state-icon"><span data-lucide="graduation-cap"></span></div>
              <h3 class="empty-title">Your mathematics workspace is waiting</h3>
              <p class="empty-desc">Enter a linear or quadratic equation to see guided, step-by-step reasoning.</p>
            </div>
          </div>
        </div>

        <div class="section-heading"><h2>Saved Problems</h2></div>
        <div id="study-saved-list"></div>
      </div>
    `;
    NexoraUtils.renderIcons(root);

    const resultBox = root.querySelector("#study-result");
    root.querySelector("#study-solve").addEventListener("click", () => {
      const raw = root.querySelector("#study-problem").value.trim();
      solveForStudy(raw, resultBox);
    });

    renderSavedProblems(root.querySelector("#study-saved-list"));
    const offProblems = AppState.on("problems:changed", () => renderSavedProblems(root.querySelector("#study-saved-list")));
    root._cleanup = () => offProblems();
  }

  function solveForStudy(raw, resultBox) {
    const cleaned = raw.replace(/\s+/g, "");
    const quad = cleaned.match(/^([+-]?\d*\.?\d*)x\^2([+-]\d*\.?\d*)x([+-]\d+\.?\d*)?=0$/i);
    const lin = raw.match(/^\s*([+-]?\d*\.?\d*)\s*x\s*([+-]\s*\d+\.?\d*)\s*=\s*([+-]?\d+\.?\d*)\s*$/i);

    let result, method, label;
    if (quad) {
      const a = quad[1] === "" || quad[1] === "+" ? 1 : quad[1] === "-" ? -1 : parseFloat(quad[1]);
      const b = quad[2] ? parseFloat(quad[2]) : 0;
      const c = quad[3] ? parseFloat(quad[3]) : 0;
      result = EquationEngine.solveQuadratic(a, b, c);
      method = "Quadratic formula"; label = raw;
    } else if (lin) {
      let aStr = lin[1].replace(/\s+/g, "");
      const a = aStr === "" || aStr === "+" ? 1 : aStr === "-" ? -1 : parseFloat(aStr);
      const b = parseFloat(lin[2].replace(/\s+/g, ""));
      const c = parseFloat(lin[3]);
      result = EquationEngine.solveLinear(a, b, c);
      method = "Linear isolation"; label = raw;
    } else {
      resultBox.innerHTML = `<div class="error-banner"><span data-lucide="alert-circle"></span>Please check your equation. Try a form like "2x + 5 = 15" or "x^2 + 5x + 6 = 0".</div>`;
      NexoraUtils.renderIcons(resultBox);
      return;
    }

    if (!result.ok) {
      resultBox.innerHTML = `<div class="error-banner"><span data-lucide="alert-circle"></span>${NexoraUtils.escapeHtml(result.reason)}</div>`;
      NexoraUtils.renderIcons(resultBox);
      return;
    }

    const stepsHtml = result.steps.map((s, i) => `
      <div class="step-item">
        <div class="step-num">${i + 1}</div>
        <div class="step-body"><strong>${NexoraUtils.escapeHtml(s.title)}</strong><span>${NexoraUtils.escapeHtml(s.body)}</span></div>
      </div>`).join("");
    resultBox.innerHTML = `
      <div class="badge badge-accent" style="margin-bottom:12px">Method: ${method}</div>
      <div class="step-list">${stepsHtml}</div>
      <div class="final-answer" style="margin-top:16px">Final Answer: ${NexoraUtils.escapeHtml(result.answer)}</div>
      <button class="btn btn-secondary btn-sm mt-4" id="study-save-btn"><span data-lucide="bookmark"></span>Save problem</button>
    `;
    NexoraUtils.renderIcons(resultBox);
    resultBox.querySelector("#study-save-btn").addEventListener("click", () => {
      AppState.addSavedProblem({ problem: label, method, answer: result.answer, steps: result.steps, kind: "study" });
      Toast.show("Calculation saved");
    });
    AppState.addHistory({ expression: label, result: result.answer, resultRaw: null, calculatorType: "Study Mode" });
  }

  function renderSavedProblems(container) {
    const problems = AppState.getSavedProblems();
    if (!problems.length) {
      container.innerHTML = `<div class="empty-state"><div class="empty-state-icon"><span data-lucide="bookmark"></span></div><h3 class="empty-title">No saved problems yet</h3><p class="empty-desc">Solve a problem above and save it to build your study set.</p></div>`;
      NexoraUtils.renderIcons(container);
      return;
    }
    container.innerHTML = `<div class="recent-list">${problems.map((p) => `
      <div class="recent-row">
        <div><div class="recent-expr">${NexoraUtils.escapeHtml(p.problem)}</div><div class="text-small text-muted">${NexoraUtils.escapeHtml(p.method || "")}</div></div>
        <div class="recent-result">${NexoraUtils.escapeHtml(p.answer)}</div>
        <div class="recent-actions"><button class="icon-btn btn-sm" data-del="${p.id}" aria-label="Delete"><span data-lucide="trash-2"></span></button></div>
      </div>`).join("")}</div>`;
    NexoraUtils.renderIcons(container);
    container.querySelectorAll("[data-del]").forEach((btn) => btn.addEventListener("click", () => {
      AppState.removeSavedProblem(btn.dataset.del);
      Toast.show("Problem removed");
    }));
  }

  global.StudyView = { render: renderStudyView };
})(window);
