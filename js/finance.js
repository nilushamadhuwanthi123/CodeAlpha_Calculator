/* ==========================================================================
   NEXORA — Finance utilities (secondary tool)
   ========================================================================== */
(function (global) {
  "use strict";

  function loanPayment(principal, annualRatePct, years) {
    const r = (annualRatePct / 100) / 12;
    const n = years * 12;
    if (r === 0) return principal / n;
    return (principal * r) / (1 - Math.pow(1 + r, -n));
  }
  function compoundInterest(principal, annualRatePct, years, compoundsPerYear) {
    const r = annualRatePct / 100;
    return principal * Math.pow(1 + r / compoundsPerYear, compoundsPerYear * years);
  }
  function pctChange(from, to) { return ((to - from) / from) * 100; }
  function pctDifference(a, b) { return (Math.abs(a - b) / ((a + b) / 2)) * 100; }

  function renderFinanceView(root) {
    root.innerHTML = `
      <div class="view-fade">
        <div class="section-heading" style="margin-top:0"><h2>Finance</h2></div>
        <div class="tabs" id="fin-tabs" style="max-width:520px;margin-bottom:20px">
          <button class="tab active" data-t="loan">Loan Payment</button>
          <button class="tab" data-t="compound">Compound Interest</button>
          <button class="tab" data-t="percent">Percentages</button>
        </div>

        <div data-panel="loan" class="calc-layout">
          <div class="card">
            <div class="field"><label>Principal</label><input class="input" id="loan-p" type="number" value="20000" /></div>
            <div class="grid-2">
              <div class="field"><label>Annual rate (%)</label><input class="input" id="loan-r" type="number" value="7" /></div>
              <div class="field"><label>Term (years)</label><input class="input" id="loan-y" type="number" value="5" /></div>
            </div>
            <button class="btn btn-primary btn-block" id="loan-calc">Calculate Monthly Payment</button>
          </div>
          <div class="card result-panel" id="loan-result"><p class="text-muted text-small">Enter loan details to calculate the monthly payment.</p></div>
        </div>

        <div data-panel="compound" class="calc-layout" hidden>
          <div class="card">
            <div class="field"><label>Principal</label><input class="input" id="ci-p" type="number" value="5000" /></div>
            <div class="grid-2">
              <div class="field"><label>Annual rate (%)</label><input class="input" id="ci-r" type="number" value="5" /></div>
              <div class="field"><label>Years</label><input class="input" id="ci-y" type="number" value="10" /></div>
            </div>
            <div class="field"><label>Compounds per year</label><input class="input" id="ci-n" type="number" value="12" /></div>
            <button class="btn btn-primary btn-block" id="ci-calc">Calculate</button>
          </div>
          <div class="card result-panel" id="ci-result"><p class="text-muted text-small">Enter details to project compound growth.</p></div>
        </div>

        <div data-panel="percent" class="calc-layout" hidden>
          <div class="card">
            <div class="grid-2">
              <div class="field"><label>From value</label><input class="input" id="pc-from" type="number" value="80" /></div>
              <div class="field"><label>To value</label><input class="input" id="pc-to" type="number" value="100" /></div>
            </div>
            <button class="btn btn-primary btn-block" id="pc-calc">Calculate % Change / Difference</button>
          </div>
          <div class="card result-panel" id="pc-result"><p class="text-muted text-small">See percentage increase/decrease and percentage difference.</p></div>
        </div>
      </div>
    `;

    root.querySelectorAll("#fin-tabs .tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        root.querySelectorAll("#fin-tabs .tab").forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        root.querySelectorAll("[data-panel]").forEach((p) => (p.hidden = p.dataset.panel !== tab.dataset.t));
      });
    });

    root.querySelector("#loan-calc").addEventListener("click", () => {
      const p = parseFloat(root.querySelector("#loan-p").value) || 0;
      const r = parseFloat(root.querySelector("#loan-r").value) || 0;
      const y = parseFloat(root.querySelector("#loan-y").value) || 1;
      const m = loanPayment(p, r, y);
      root.querySelector("#loan-result").innerHTML = `<div class="final-answer">Monthly payment: ${NexoraUtils.formatNumber(m, 2)}</div><p class="text-small text-muted mt-4">Total paid over term: ${NexoraUtils.formatNumber(m * y * 12, 2)}</p>`;
      AppState.addHistory({ expression: `loan(${p}, ${r}%, ${y}y)`, result: NexoraUtils.formatNumber(m, 2), resultRaw: m, calculatorType: "Finance — Loan" });
    });
    root.querySelector("#ci-calc").addEventListener("click", () => {
      const p = parseFloat(root.querySelector("#ci-p").value) || 0;
      const r = parseFloat(root.querySelector("#ci-r").value) || 0;
      const y = parseFloat(root.querySelector("#ci-y").value) || 0;
      const n = parseFloat(root.querySelector("#ci-n").value) || 1;
      const total = compoundInterest(p, r, y, n);
      root.querySelector("#ci-result").innerHTML = `<div class="final-answer">Future value: ${NexoraUtils.formatNumber(total, 2)}</div><p class="text-small text-muted mt-4">Interest earned: ${NexoraUtils.formatNumber(total - p, 2)}</p>`;
      AppState.addHistory({ expression: `compound(${p}, ${r}%, ${y}y)`, result: NexoraUtils.formatNumber(total, 2), resultRaw: total, calculatorType: "Finance — Compound Interest" });
    });
    root.querySelector("#pc-calc").addEventListener("click", () => {
      const a = parseFloat(root.querySelector("#pc-from").value) || 0;
      const b = parseFloat(root.querySelector("#pc-to").value) || 0;
      const change = pctChange(a, b);
      const diff = pctDifference(a, b);
      root.querySelector("#pc-result").innerHTML = `
        <div class="stat-grid">
          <div class="stat-tile"><div class="stat-tile-value">${change >= 0 ? "+" : ""}${NexoraUtils.formatNumber(change, 2)}%</div><div class="stat-tile-label">${change >= 0 ? "Increase" : "Decrease"}</div></div>
          <div class="stat-tile"><div class="stat-tile-value">${NexoraUtils.formatNumber(diff, 2)}%</div><div class="stat-tile-label">Difference</div></div>
        </div>`;
      AppState.addHistory({ expression: `%change(${a} → ${b})`, result: `${NexoraUtils.formatNumber(change, 2)}%`, resultRaw: change, calculatorType: "Finance — Percentages" });
    });
  }

  global.FinanceView = { render: renderFinanceView };
})(window);
