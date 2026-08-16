/* ==========================================================================
   NEXORA — Formula Library (searchable)
   ========================================================================== */
(function (global) {
  "use strict";

  const FORMULAS = [
    { id: "alg-quad", cat: "Algebra", name: "Quadratic Formula", expr: "x = (−b ± √(b²−4ac)) / 2a", explain: "Solves ax² + bx + c = 0 for x." },
    { id: "alg-diff-sq", cat: "Algebra", name: "Difference of Squares", expr: "a² − b² = (a−b)(a+b)", explain: "Factoring identity for a difference of two squares." },
    { id: "calc-power-rule", cat: "Calculus", name: "Power Rule", expr: "d/dx(xⁿ) = n·xⁿ⁻¹", explain: "Differentiates any power of x." },
    { id: "calc-product-rule", cat: "Calculus", name: "Product Rule", expr: "d/dx(uv) = u'v + uv'", explain: "Differentiates a product of two functions." },
    { id: "calc-chain-rule", cat: "Calculus", name: "Chain Rule", expr: "d/dx f(g(x)) = f'(g(x))·g'(x)", explain: "Differentiates a composition of functions." },
    { id: "calc-fund-thm", cat: "Calculus", name: "Fundamental Theorem of Calculus", expr: "∫[a,b] f'(x) dx = f(b) − f(a)", explain: "Connects differentiation and definite integration." },
    { id: "trig-pyth", cat: "Trigonometry", name: "Pythagorean Identity", expr: "sin²θ + cos²θ = 1", explain: "The core identity relating sine and cosine." },
    { id: "trig-law-cos", cat: "Trigonometry", name: "Law of Cosines", expr: "c² = a² + b² − 2ab·cos(C)", explain: "Relates the sides of any triangle to the cosine of an angle." },
    { id: "trig-law-sin", cat: "Trigonometry", name: "Law of Sines", expr: "a/sin(A) = b/sin(B) = c/sin(C)", explain: "Relates side lengths to the sines of opposite angles." },
    { id: "stat-mean", cat: "Statistics", name: "Arithmetic Mean", expr: "x̄ = (Σxᵢ) / n", explain: "The average of a dataset." },
    { id: "stat-stdev", cat: "Statistics", name: "Standard Deviation", expr: "σ = √(Σ(xᵢ − x̄)² / n)", explain: "Measures dataset spread around the mean." },
    { id: "prob-combo", cat: "Probability", name: "Combinations", expr: "nCr = n! / (r!(n−r)!)", explain: "Number of ways to choose r items from n, order not mattering." },
    { id: "prob-perm", cat: "Probability", name: "Permutations", expr: "nPr = n! / (n−r)!", explain: "Number of ordered arrangements of r items from n." },
    { id: "prob-binom", cat: "Probability", name: "Binomial Probability", expr: "P(X=k) = nCk·pᵏ(1−p)ⁿ⁻ᵏ", explain: "Probability of exactly k successes in n independent trials." },
    { id: "geo-circle-area", cat: "Geometry", name: "Circle Area", expr: "A = πr²", explain: "Area of a circle with radius r." },
    { id: "geo-circle-circ", cat: "Geometry", name: "Circle Circumference", expr: "C = 2πr", explain: "Perimeter of a circle with radius r." },
    { id: "geo-sphere-vol", cat: "Geometry", name: "Sphere Volume", expr: "V = (4/3)πr³", explain: "Volume of a sphere with radius r." },
    { id: "geo-pythagoras", cat: "Geometry", name: "Pythagorean Theorem", expr: "a² + b² = c²", explain: "Relates the legs and hypotenuse of a right triangle." },
    { id: "fin-compound", cat: "Finance", name: "Compound Interest", expr: "A = P(1 + r/n)^(nt)", explain: "Future value with compounding interest." },
    { id: "fin-simple", cat: "Finance", name: "Simple Interest", expr: "I = P·r·t", explain: "Interest earned without compounding." },
    { id: "fin-loan", cat: "Finance", name: "Loan Payment", expr: "M = P·r / (1 − (1+r)⁻ⁿ)", explain: "Fixed monthly payment for an amortizing loan." },
  ];

  function renderFormulasView(root) {
    const cats = ["All", ...new Set(FORMULAS.map((f) => f.cat))];
    root.innerHTML = `
      <div class="view-fade">
        <div class="section-heading" style="margin-top:0"><h2>Formula Library</h2></div>
        <div class="history-toolbar">
          <input class="input" id="formula-search" placeholder="Search formulas…" />
          <select class="select" id="formula-cat" style="max-width:200px">${cats.map((c) => `<option value="${c}">${c}</option>`).join("")}</select>
        </div>
        <div class="formula-grid" id="formula-grid"></div>
      </div>
    `;
    const grid = root.querySelector("#formula-grid");
    const search = root.querySelector("#formula-search");
    const catSel = root.querySelector("#formula-cat");

    function render() {
      const q = search.value.trim().toLowerCase();
      const cat = catSel.value;
      const filtered = FORMULAS.filter((f) =>
        (cat === "All" || f.cat === cat) &&
        (f.name.toLowerCase().includes(q) || f.expr.toLowerCase().includes(q) || f.explain.toLowerCase().includes(q))
      );
      if (!filtered.length) {
        grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon"><span data-lucide="search-x"></span></div><h3 class="empty-title">No formulas found</h3><p class="empty-desc">Try a different search term or category.</p></div>`;
        NexoraUtils.renderIcons(grid);
        return;
      }
      grid.innerHTML = filtered.map((f) => {
        const saved = AppState.getSavedFormulas().includes(f.id);
        return `
        <div class="card card-hover formula-card">
          <span class="badge">${f.cat}</span>
          <div class="formula-expr">${NexoraUtils.escapeHtml(f.expr)}</div>
          <div class="formula-name">${NexoraUtils.escapeHtml(f.name)}</div>
          <div class="formula-explain">${NexoraUtils.escapeHtml(f.explain)}</div>
          <div class="formula-actions">
            <button class="btn btn-secondary btn-sm" data-copy="${f.id}"><span data-lucide="copy"></span>Copy</button>
            <button class="btn btn-outline btn-sm" data-save="${f.id}"><span data-lucide="${saved ? "bookmark-check" : "bookmark"}"></span>${saved ? "Saved" : "Use Formula"}</button>
          </div>
        </div>`;
      }).join("");
      NexoraUtils.renderIcons(grid);
      grid.querySelectorAll("[data-copy]").forEach((btn) => btn.addEventListener("click", () => {
        const f = FORMULAS.find((x) => x.id === btn.dataset.copy);
        NexoraUtils.copyToClipboard(f.expr).then(() => Toast.show("Formula copied"));
      }));
      grid.querySelectorAll("[data-save]").forEach((btn) => btn.addEventListener("click", () => {
        AppState.toggleSavedFormula(btn.dataset.save);
        Toast.show("Formula library updated");
        render();
      }));
    }

    search.addEventListener("input", NexoraUtils.debounce(render, 150));
    catSel.addEventListener("change", render);
    render();
  }

  global.FormulasView = { render: renderFormulasView, FORMULAS };
})(window);
