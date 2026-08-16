/* ==========================================================================
   NEXORA — Statistics & Probability
   ========================================================================== */
(function (global) {
  "use strict";

  function computeStats(data) {
    const n = data.length;
    const sum = data.reduce((a, b) => a + b, 0);
    const mean = sum / n;
    const sorted = [...data].sort((a, b) => a - b);
    const median = n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[(n - 1) / 2];
    const freq = {};
    data.forEach((v) => (freq[v] = (freq[v] || 0) + 1));
    const maxFreq = Math.max(...Object.values(freq));
    const modes = Object.keys(freq).filter((k) => freq[k] === maxFreq).map(Number);
    const mode = maxFreq > 1 ? modes.join(", ") : "No mode";
    const variance = data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);
    const min = sorted[0], max = sorted[n - 1];
    return { n, sum, mean, median, mode, variance, stdDev, min, max, range: max - min, sorted };
  }

  function factorial(n) {
    if (n < 0 || !Number.isInteger(n)) return NaN;
    let r = 1;
    for (let i = 2; i <= n; i++) r *= i;
    return r;
  }
  function permutation(n, r) { return factorial(n) / factorial(n - r); }
  function combination(n, r) { return factorial(n) / (factorial(r) * factorial(n - r)); }
  function binomialProbability(n, k, p) {
    return combination(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
  }

  function renderStatisticsView(root) {
    root.innerHTML = `
      <div class="view-fade">
        <div class="section-heading" style="margin-top:0"><h2>Statistics &amp; Probability</h2></div>
        <div class="tabs" id="stat-tabs" style="max-width:320px;margin-bottom:20px">
          <button class="tab active" data-t="stats">Dataset Statistics</button>
          <button class="tab" data-t="prob">Probability</button>
        </div>

        <div data-panel="stats" class="calc-layout">
          <div class="card">
            <div class="field"><label>Dataset (comma-separated)</label><input class="input" id="stat-data" value="12, 18, 20, 24, 30" /></div>
            <button class="btn btn-primary btn-block" id="stat-compute">Calculate</button>
          </div>
          <div class="card result-panel" id="stat-result">
            <p class="text-muted text-small">Enter numbers separated by commas to see mean, median, mode, variance, standard deviation and more.</p>
          </div>
        </div>

        <div data-panel="prob" class="calc-layout" hidden>
          <div class="card">
            <div class="grid-2">
              <div class="field"><label>n</label><input class="input" id="prob-n" type="number" value="10" /></div>
              <div class="field"><label>r / k</label><input class="input" id="prob-r" type="number" value="3" /></div>
            </div>
            <div class="field"><label>Probability p (binomial, 0–1)</label><input class="input" id="prob-p" type="number" value="0.5" step="0.01" /></div>
            <div class="flex gap-2" style="flex-wrap:wrap">
              <button class="btn btn-secondary btn-sm" data-p="factorial">n!</button>
              <button class="btn btn-secondary btn-sm" data-p="permutation">nPr</button>
              <button class="btn btn-secondary btn-sm" data-p="combination">nCr</button>
              <button class="btn btn-secondary btn-sm" data-p="binomial">Binomial P(X=k)</button>
            </div>
          </div>
          <div class="card result-panel" id="prob-result">
            <p class="text-muted text-small">Choose a probability operation to compute.</p>
          </div>
        </div>
      </div>
    `;

    root.querySelectorAll("#stat-tabs .tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        root.querySelectorAll("#stat-tabs .tab").forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        root.querySelectorAll("[data-panel]").forEach((p) => (p.hidden = p.dataset.panel !== tab.dataset.t));
      });
    });

    const statResult = root.querySelector("#stat-result");
    root.querySelector("#stat-compute").addEventListener("click", () => {
      const raw = root.querySelector("#stat-data").value;
      const data = raw.split(",").map((s) => parseFloat(s.trim())).filter((v) => !isNaN(v));
      if (!data.length) { statResult.innerHTML = `<div class="error-banner"><span data-lucide="alert-circle"></span>Please enter at least one number.</div>`; NexoraUtils.renderIcons(statResult); return; }
      const s = computeStats(data);
      const barMax = Math.max(...data);
      const bars = data.map((v) => `<div class="stat-bar" style="height:${Math.max(4, (v / barMax) * 100)}%" title="${v}"></div>`).join("");
      statResult.innerHTML = `
        <div class="stat-grid">
          <div class="stat-tile"><div class="stat-tile-value">${NexoraUtils.formatNumber(s.mean, 4)}</div><div class="stat-tile-label">Mean</div></div>
          <div class="stat-tile"><div class="stat-tile-value">${NexoraUtils.formatNumber(s.median, 4)}</div><div class="stat-tile-label">Median</div></div>
          <div class="stat-tile"><div class="stat-tile-value">${s.mode}</div><div class="stat-tile-label">Mode</div></div>
          <div class="stat-tile"><div class="stat-tile-value">${NexoraUtils.formatNumber(s.variance, 4)}</div><div class="stat-tile-label">Variance</div></div>
          <div class="stat-tile"><div class="stat-tile-value">${NexoraUtils.formatNumber(s.stdDev, 4)}</div><div class="stat-tile-label">Std Dev</div></div>
          <div class="stat-tile"><div class="stat-tile-value">${s.min}</div><div class="stat-tile-label">Minimum</div></div>
          <div class="stat-tile"><div class="stat-tile-value">${s.max}</div><div class="stat-tile-label">Maximum</div></div>
          <div class="stat-tile"><div class="stat-tile-value">${s.range}</div><div class="stat-tile-label">Range</div></div>
          <div class="stat-tile"><div class="stat-tile-value">${NexoraUtils.formatNumber(s.sum, 4)}</div><div class="stat-tile-label">Sum</div></div>
          <div class="stat-tile"><div class="stat-tile-value">${s.n}</div><div class="stat-tile-label">Count</div></div>
        </div>
        <div class="stat-bars">${bars}</div>
      `;
      AppState.addHistory({ expression: `stats(${raw})`, result: `mean ${NexoraUtils.formatNumber(s.mean, 2)}`, resultRaw: s.mean, calculatorType: "Statistics" });
    });

    const probResult = root.querySelector("#prob-result");
    root.querySelectorAll("[data-p]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const n = parseInt(root.querySelector("#prob-n").value, 10) || 0;
        const r = parseInt(root.querySelector("#prob-r").value, 10) || 0;
        const p = parseFloat(root.querySelector("#prob-p").value) || 0;
        const op = btn.dataset.p;
        let label, value;
        if (op === "factorial") { label = `${n}!`; value = factorial(n); }
        else if (op === "permutation") { label = `${n}P${r}`; value = permutation(n, r); }
        else if (op === "combination") { label = `${n}C${r}`; value = combination(n, r); }
        else if (op === "binomial") { label = `P(X=${r}) for n=${n}, p=${p}`; value = binomialProbability(n, r, p); }
        if (isNaN(value)) {
          probResult.innerHTML = `<div class="error-banner"><span data-lucide="alert-circle"></span>Please check your inputs.</div>`;
          NexoraUtils.renderIcons(probResult);
          return;
        }
        probResult.innerHTML = `<div class="badge badge-accent" style="margin-bottom:10px">${NexoraUtils.escapeHtml(label)}</div><div class="final-answer">${NexoraUtils.formatNumber(value, 6)}</div>`;
        AppState.addHistory({ expression: label, result: NexoraUtils.formatNumber(value, 6), resultRaw: value, calculatorType: "Probability" });
      });
    });

    NexoraUtils.renderIcons(root);
  }

  global.StatisticsView = { render: renderStatisticsView };
  global.StatsEngine = { computeStats, factorial, permutation, combination, binomialProbability };
})(window);
