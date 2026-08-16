/* ==========================================================================
   NEXORA — Matrix Calculator (2x2 / 3x3 / 4x4)
   ========================================================================== */
(function (global) {
  "use strict";

  function buildGrid(container, size, prefix, defaultFn) {
    container.innerHTML = "";
    container.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const input = document.createElement("input");
        input.type = "number";
        input.className = "matrix-cell";
        input.dataset.r = r; input.dataset.c = c;
        input.id = `${prefix}-${r}-${c}`;
        input.value = defaultFn ? defaultFn(r, c) : "";
        container.appendChild(input);
      }
    }
  }

  function readGrid(container, size) {
    const m = [];
    for (let r = 0; r < size; r++) {
      const row = [];
      for (let c = 0; c < size; c++) {
        const el = container.querySelector(`[data-r="${r}"][data-c="${c}"]`);
        row.push(parseFloat(el.value) || 0);
      }
      m.push(row);
    }
    return m;
  }

  function fmtMatrix(m) {
    return m.map((row) => "[ " + row.map((v) => NexoraUtils.formatNumber(v, 4)).join(", ") + " ]").join("\n");
  }

  function eigen2x2(m) {
    const [[a, b], [c, d]] = m;
    const tr = a + d, det = a * d - b * c;
    const disc = tr * tr - 4 * det;
    if (disc < 0) return { ok: false };
    const sq = Math.sqrt(disc);
    return { ok: true, l1: (tr + sq) / 2, l2: (tr - sq) / 2 };
  }

  function renderMatrixView(root) {
    root.innerHTML = `
      <div class="view-fade">
        <div class="section-heading" style="margin-top:0"><h2>Matrix Calculator</h2></div>
        <div class="matrix-controls">
          <span class="text-small text-muted">Size:</span>
          <div class="tabs" id="mat-size-tabs" style="max-width:220px">
            <button class="tab active" data-size="2">2×2</button>
            <button class="tab" data-size="3">3×3</button>
            <button class="tab" data-size="4">4×4</button>
          </div>
        </div>
        <div class="calc-layout">
          <div class="card">
            <h3 style="font-size:0.95rem;margin-bottom:10px">Matrix A</h3>
            <div class="matrix-grid-input" id="mat-a"></div>
            <h3 style="font-size:0.95rem;margin:18px 0 10px">Matrix B <span class="text-muted text-small">(for add / subtract / multiply)</span></h3>
            <div class="matrix-grid-input" id="mat-b"></div>
            <div class="field mt-4"><label>Scalar (k)</label><input class="input" id="mat-scalar" type="number" value="2" style="max-width:120px" /></div>
            <div class="matrix-op-grid mt-4">
              <button class="btn btn-secondary btn-sm" data-op="add">A + B</button>
              <button class="btn btn-secondary btn-sm" data-op="sub">A − B</button>
              <button class="btn btn-secondary btn-sm" data-op="mul">A × B</button>
              <button class="btn btn-secondary btn-sm" data-op="scalar">k × A</button>
              <button class="btn btn-secondary btn-sm" data-op="transpose">Transpose A</button>
              <button class="btn btn-secondary btn-sm" data-op="det">Determinant A</button>
              <button class="btn btn-secondary btn-sm" data-op="inverse">Inverse A</button>
              <button class="btn btn-secondary btn-sm" data-op="trace">Trace A</button>
              <button class="btn btn-secondary btn-sm" data-op="rank">Rank A</button>
              <button class="btn btn-secondary btn-sm" data-op="eigen">Eigenvalues A</button>
            </div>
          </div>
          <div class="card result-panel" id="mat-result">
            <div class="empty-state">
              <div class="empty-state-icon"><span data-lucide="grid-3x3"></span></div>
              <h3 class="empty-title">Ready to compute</h3>
              <p class="empty-desc">Fill both matrices and choose an operation.</p>
            </div>
          </div>
        </div>
      </div>
    `;

    const gridA = root.querySelector("#mat-a");
    const gridB = root.querySelector("#mat-b");
    const resultBox = root.querySelector("#mat-result");
    NexoraUtils.renderIcons(resultBox);

    let size = 2;
    function build() {
      buildGrid(gridA, size, "a", (r, c) => (r === c ? 1 : 0));
      buildGrid(gridB, size, "b", (r, c) => (r === c ? 1 : 0));
    }
    build();

    root.querySelectorAll("#mat-size-tabs .tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        root.querySelectorAll("#mat-size-tabs .tab").forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        size = parseInt(tab.dataset.size, 10);
        build();
      });
    });

    function showResult(title, body, historyLabel) {
      resultBox.innerHTML = `<div class="badge badge-accent" style="margin-bottom:10px">${NexoraUtils.escapeHtml(title)}</div><pre class="final-answer" style="white-space:pre-wrap;font-family:var(--font-mono)">${NexoraUtils.escapeHtml(body)}</pre>`;
      if (historyLabel) AppState.addHistory({ expression: historyLabel, result: body.split("\n")[0], resultRaw: null, calculatorType: "Matrix Calculator" });
    }
    function showError(msg) {
      resultBox.innerHTML = `<div class="error-banner"><span data-lucide="alert-circle"></span>${NexoraUtils.escapeHtml(msg)}</div>`;
      NexoraUtils.renderIcons(resultBox);
    }

    root.querySelector(".matrix-op-grid").addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      const op = btn.dataset.op;
      const A = readGrid(gridA, size);
      const B = readGrid(gridB, size);
      try {
        if (op === "add") showResult("A + B", fmtMatrix(math.add(A, B)), "A + B");
        else if (op === "sub") showResult("A − B", fmtMatrix(math.subtract(A, B)), "A − B");
        else if (op === "mul") showResult("A × B", fmtMatrix(math.multiply(A, B)), "A × B");
        else if (op === "scalar") {
          const k = parseFloat(root.querySelector("#mat-scalar").value) || 0;
          showResult(`${k} × A`, fmtMatrix(math.multiply(A, k)), `${k} × A`);
        } else if (op === "transpose") showResult("Transpose of A", fmtMatrix(math.transpose(A)), "Aᵀ");
        else if (op === "det") showResult("Determinant of A", String(math.det(A)), "det(A)");
        else if (op === "inverse") showResult("Inverse of A", fmtMatrix(math.inv(A)), "A⁻¹");
        else if (op === "trace") showResult("Trace of A", String(math.trace(A)), "trace(A)");
        else if (op === "rank") showResult("Rank of A", String(math.rank(A)), "rank(A)");
        else if (op === "eigen") {
          if (size === 2) {
            const r = eigen2x2(A);
            if (!r.ok) showError("Matrix dimensions are incompatible.");
            else showResult("Eigenvalues of A", `λ1 = ${NexoraUtils.formatNumber(r.l1, 4)}\nλ2 = ${NexoraUtils.formatNumber(r.l2, 4)}`, "eigenvalues(A)");
          } else {
            showError("Eigenvalues are supported for 2×2 matrices in this workspace.");
          }
        }
      } catch (err) {
        showError("Matrix dimensions are incompatible.");
      }
    });
  }

  global.MatrixView = { render: renderMatrixView };
})(window);
