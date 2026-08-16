/* ==========================================================================
   NEXORA — Graphing Calculator (Canvas)
   ========================================================================== */
(function (global) {
  "use strict";

  const COLORS = ["#5B4BDB", "#06B6D4", "#F59E0B", "#34D399", "#EC4899", "#7C5CFC"];

  function renderGraphingView(root) {
    root.innerHTML = `
      <div class="view-fade">
        <div class="section-heading" style="margin-top:0"><h2>Graphing</h2></div>
        <div class="graph-toolbar">
          <input class="input" id="graph-fn-input" style="max-width:280px" placeholder="y = x^2" />
          <button class="btn btn-primary btn-sm" id="graph-add-fn"><span data-lucide="plus"></span>Plot</button>
          <button class="btn btn-outline btn-sm" id="graph-reset"><span data-lucide="rotate-ccw"></span>Reset View</button>
          <button class="btn btn-outline btn-sm" id="graph-fullscreen"><span data-lucide="maximize"></span>Fullscreen</button>
        </div>
        <div class="graph-fn-list" id="graph-fn-list"></div>
        <div class="graph-canvas-wrap" id="graph-wrap">
          <canvas id="graph-canvas" aria-label="Function graph canvas"></canvas>
        </div>
        <p class="text-small text-muted mt-4">Scroll to zoom, drag to pan. Examples: <code>y = sin(x)</code>, <code>y = x^3 - 2x</code>, <code>y = 2x + 3</code>.</p>
      </div>
    `;

    const canvas = root.querySelector("#graph-canvas");
    const wrap = root.querySelector("#graph-wrap");
    const ctx = canvas.getContext("2d");
    const fnListEl = root.querySelector("#graph-fn-list");

    let functions = [{ expr: "x^2", color: COLORS[0], visible: true }];
    let view = { xMin: -10, xMax: 10, yMin: -10, yMax: 10 };
    let dragging = false, dragStart = null, dragViewStart = null;

    function resizeCanvas() {
      const rect = wrap.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = rect.width + "px";
      canvas.style.height = rect.height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    }

    function toPx(x, y, w, h) {
      const px = ((x - view.xMin) / (view.xMax - view.xMin)) * w;
      const py = h - ((y - view.yMin) / (view.yMax - view.yMin)) * h;
      return [px, py];
    }

    function niceStep(range) {
      const raw = range / 10;
      const mag = Math.pow(10, Math.floor(Math.log10(raw)));
      const norm = raw / mag;
      let step;
      if (norm < 1.5) step = 1; else if (norm < 3.5) step = 2; else if (norm < 7.5) step = 5; else step = 10;
      return step * mag;
    }

    function draw() {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      const isDark = document.documentElement.getAttribute("data-theme") !== "light";
      ctx.fillStyle = isDark ? "#101027" : "#ffffff";
      ctx.fillRect(0, 0, w, h);

      // grid
      ctx.strokeStyle = isDark ? "rgba(255,255,255,0.08)" : "rgba(21,21,42,0.08)";
      ctx.lineWidth = 1;
      const stepX = niceStep(view.xMax - view.xMin);
      const stepY = niceStep(view.yMax - view.yMin);
      ctx.font = "11px Inter, sans-serif";
      ctx.fillStyle = isDark ? "rgba(255,255,255,0.4)" : "rgba(21,21,42,0.45)";

      for (let x = Math.ceil(view.xMin / stepX) * stepX; x <= view.xMax; x += stepX) {
        const [px] = toPx(x, 0, w, h);
        ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, h); ctx.stroke();
        if (Math.abs(x) > stepX / 10) ctx.fillText(Number(x.toFixed(4)).toString(), px + 4, h - 4);
      }
      for (let y = Math.ceil(view.yMin / stepY) * stepY; y <= view.yMax; y += stepY) {
        const [, py] = toPx(0, y, w, h);
        ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(w, py); ctx.stroke();
        if (Math.abs(y) > stepY / 10) ctx.fillText(Number(y.toFixed(4)).toString(), 4, py - 4);
      }

      // axes
      ctx.strokeStyle = isDark ? "rgba(255,255,255,0.55)" : "rgba(21,21,42,0.5)";
      ctx.lineWidth = 1.5;
      const [ox] = toPx(0, 0, w, h); const [, oy] = toPx(0, 0, w, h);
      ctx.beginPath(); ctx.moveTo(ox, 0); ctx.lineTo(ox, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, oy); ctx.lineTo(w, oy); ctx.stroke();

      // functions
      functions.forEach((f) => {
        if (!f.visible) return;
        let compiled;
        try { compiled = math.compile(f.expr.replace(/^y\s*=\s*/i, "")); } catch (e) { return; }
        ctx.strokeStyle = f.color;
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        let started = false;
        const samples = Math.floor(w);
        for (let i = 0; i <= samples; i++) {
          const x = view.xMin + (i / samples) * (view.xMax - view.xMin);
          let y;
          try { y = compiled.evaluate({ x }); } catch (e) { y = NaN; }
          if (typeof y !== "number" || !isFinite(y)) { started = false; continue; }
          const [px, py] = toPx(x, y, w, h);
          if (!started || py < -h * 3 || py > h * 4) {
            if (py >= -h * 3 && py <= h * 4) { ctx.moveTo(px, py); started = true; }
          } else {
            ctx.lineTo(px, py);
          }
        }
        ctx.stroke();
      });
    }

    function renderFnList() {
      fnListEl.innerHTML = "";
      functions.forEach((f, i) => {
        const row = document.createElement("div");
        row.className = "graph-fn-row";
        row.innerHTML = `
          <span class="graph-fn-color" style="background:${f.color}"></span>
          <span class="mono text-small" style="flex:1">y = ${NexoraUtils.escapeHtml(f.expr)}</span>
          <button class="icon-btn btn-sm" data-act="toggle" title="Show/hide"><span data-lucide="${f.visible ? "eye" : "eye-off"}"></span></button>
          <button class="icon-btn btn-sm" data-act="remove" title="Remove"><span data-lucide="trash-2"></span></button>
        `;
        row.querySelector('[data-act="toggle"]').addEventListener("click", () => { f.visible = !f.visible; renderFnList(); draw(); });
        row.querySelector('[data-act="remove"]').addEventListener("click", () => { functions.splice(i, 1); renderFnList(); draw(); });
        fnListEl.appendChild(row);
      });
      NexoraUtils.renderIcons(fnListEl);
    }

    root.querySelector("#graph-add-fn").addEventListener("click", () => {
      const input = root.querySelector("#graph-fn-input");
      const raw = input.value.trim();
      if (!raw) return;
      const expr = raw.replace(/^y\s*=\s*/i, "");
      try { math.compile(expr).evaluate({ x: 1 }); }
      catch (e) { Toast.show("That expression could not be evaluated.", { type: "error" }); return; }
      functions.push({ expr, color: COLORS[functions.length % COLORS.length], visible: true });
      input.value = "";
      renderFnList(); draw();
      AppState.addHistory({ expression: "y = " + expr, result: "Plotted", resultRaw: null, calculatorType: "Graphing" });
      AppState.setContinueWork({ type: "graph", label: "y = " + expr, route: "graphing" });
      Toast.show("Function plotted");
    });
    root.querySelector("#graph-fn-input").addEventListener("keydown", (e) => {
      if (e.key === "Enter") root.querySelector("#graph-add-fn").click();
    });

    root.querySelector("#graph-reset").addEventListener("click", () => {
      view = { xMin: -10, xMax: 10, yMin: -10, yMax: 10 };
      draw();
    });
    root.querySelector("#graph-fullscreen").addEventListener("click", () => {
      wrap.classList.toggle("fullscreen");
      requestAnimationFrame(resizeCanvas);
    });

    canvas.addEventListener("wheel", (e) => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 1.12 : 0.89;
      const cx = (view.xMin + view.xMax) / 2, cy = (view.yMin + view.yMax) / 2;
      const halfW = (view.xMax - view.xMin) / 2 * factor;
      const halfH = (view.yMax - view.yMin) / 2 * factor;
      view = { xMin: cx - halfW, xMax: cx + halfW, yMin: cy - halfH, yMax: cy + halfH };
      draw();
    }, { passive: false });

    function startDrag(x, y) { dragging = true; dragStart = { x, y }; dragViewStart = Object.assign({}, view); }
    function moveDrag(x, y) {
      if (!dragging) return;
      const w = canvas.clientWidth, h = canvas.clientHeight;
      const dx = (x - dragStart.x) / w * (view.xMax - view.xMin);
      const dy = (y - dragStart.y) / h * (view.yMax - view.yMin);
      view = {
        xMin: dragViewStart.xMin - dx, xMax: dragViewStart.xMax - dx,
        yMin: dragViewStart.yMin + dy, yMax: dragViewStart.yMax + dy,
      };
      draw();
    }
    canvas.addEventListener("mousedown", (e) => startDrag(e.offsetX, e.offsetY));
    canvas.addEventListener("touchstart", (e) => {
      const t = e.touches[0]; const rect = canvas.getBoundingClientRect();
      startDrag(t.clientX - rect.left, t.clientY - rect.top);
    }, { passive: true });
    canvas.addEventListener("touchmove", (e) => {
      const t = e.touches[0]; const rect = canvas.getBoundingClientRect();
      moveDrag(t.clientX - rect.left, t.clientY - rect.top);
    }, { passive: true });
    canvas.addEventListener("touchend", () => (dragging = false));

    window.addEventListener("resize", resizeCanvas);
    function escHandler(e) {
      if (e.key === "Escape" && wrap.classList.contains("fullscreen")) {
        wrap.classList.remove("fullscreen");
        requestAnimationFrame(resizeCanvas);
      }
    }
    document.addEventListener("keydown", escHandler);
    function onMouseMove(e) {
      if (!dragging) return;
      const rect = canvas.getBoundingClientRect();
      moveDrag(e.clientX - rect.left, e.clientY - rect.top);
    }
    function onMouseUp() { dragging = false; }
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    root._cleanup = () => {
      window.removeEventListener("resize", resizeCanvas);
      document.removeEventListener("keydown", escHandler);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    renderFnList();
    requestAnimationFrame(resizeCanvas);
    NexoraUtils.renderIcons(root);
  }

  global.GraphingView = { render: renderGraphingView };
})(window);
