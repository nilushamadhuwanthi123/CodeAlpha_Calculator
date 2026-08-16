/* ==========================================================================
   NEXORA — Unit Converters
   ========================================================================== */
(function (global) {
  "use strict";

  // Each category: base unit factors (multiply value by factor to reach base, then divide for target)
  const CATEGORIES = {
    Length: { base: "m", units: { m: 1, km: 1000, cm: 0.01, mm: 0.001, mi: 1609.344, yd: 0.9144, ft: 0.3048, in: 0.0254, nmi: 1852 } },
    Weight: { base: "kg", units: { kg: 1, g: 0.001, mg: 0.000001, lb: 0.45359237, oz: 0.028349523, t: 1000, st: 6.35029 } },
    Temperature: { special: true },
    Area: { base: "m2", units: { m2: 1, km2: 1e6, cm2: 0.0001, ha: 10000, acre: 4046.8564224, ft2: 0.09290304, mi2: 2589988.110336 } },
    Volume: { base: "l", units: { l: 1, ml: 0.001, m3: 1000, gal: 3.785411784, qt: 0.946352946, pt: 0.473176473, cup: 0.2365882365, ft3: 28.316846592 } },
    Speed: { base: "mps", units: { mps: 1, kmh: 0.2777778, mph: 0.44704, knot: 0.5144444, fts: 0.3048 } },
    Time: { base: "s", units: { s: 1, min: 60, h: 3600, day: 86400, week: 604800, ms: 0.001, year: 31557600 } },
    Data: { base: "byte", units: { byte: 1, KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3, TB: 1024 ** 4, bit: 0.125 } },
    Energy: { base: "j", units: { j: 1, kj: 1000, cal: 4.184, kcal: 4184, wh: 3600, kwh: 3600000 } },
    Pressure: { base: "pa", units: { pa: 1, kpa: 1000, bar: 100000, atm: 101325, psi: 6894.757, mmhg: 133.322 } },
  };

  function convertTemperature(value, from, to) {
    let celsius;
    if (from === "C") celsius = value;
    else if (from === "F") celsius = (value - 32) * 5 / 9;
    else celsius = value - 273.15;
    if (to === "C") return celsius;
    if (to === "F") return celsius * 9 / 5 + 32;
    return celsius + 273.15;
  }

  function renderConvertersView(root) {
    const catNames = Object.keys(CATEGORIES);
    root.innerHTML = `
      <div class="view-fade">
        <div class="section-heading" style="margin-top:0"><h2>Converters</h2></div>
        <div class="card">
          <div class="field"><label>Category</label>
            <select class="select" id="conv-category">${catNames.map((c) => `<option value="${c}">${c}</option>`).join("")}</select>
          </div>
          <div class="convert-row mt-4">
            <div class="field"><label>From</label><select class="select" id="conv-from"></select><input class="input mt-4" id="conv-value" type="number" value="1" /></div>
            <button class="icon-btn convert-swap" id="conv-swap" title="Swap units" aria-label="Swap units"><span data-lucide="repeat"></span></button>
            <div class="field"><label>To</label><select class="select" id="conv-to"></select><input class="input mt-4" id="conv-output" readonly /></div>
          </div>
        </div>
      </div>
    `;

    const catSel = root.querySelector("#conv-category");
    const fromSel = root.querySelector("#conv-from");
    const toSel = root.querySelector("#conv-to");
    const valueInput = root.querySelector("#conv-value");
    const outputInput = root.querySelector("#conv-output");

    function unitList(cat) {
      if (CATEGORIES[cat].special) return ["C", "F", "K"];
      return Object.keys(CATEGORIES[cat].units);
    }

    function populateUnits() {
      const cat = catSel.value;
      const units = unitList(cat);
      fromSel.innerHTML = units.map((u) => `<option value="${u}">${u}</option>`).join("");
      toSel.innerHTML = units.map((u) => `<option value="${u}">${u}</option>`).join("");
      if (units.length > 1) toSel.selectedIndex = 1;
      compute();
    }

    function compute() {
      const cat = catSel.value;
      const val = parseFloat(valueInput.value);
      if (isNaN(val)) { outputInput.value = ""; return; }
      let result;
      if (CATEGORIES[cat].special) {
        result = convertTemperature(val, fromSel.value, toSel.value);
      } else {
        const units = CATEGORIES[cat].units;
        const base = val * units[fromSel.value];
        result = base / units[toSel.value];
      }
      outputInput.value = NexoraUtils.formatNumber(result, 6);
      AppState.addHistory({
        expression: `${val} ${fromSel.value} → ${toSel.value}`,
        result: `${outputInput.value} ${toSel.value}`,
        resultRaw: result,
        calculatorType: "Converter — " + cat,
      });
    }

    catSel.addEventListener("change", populateUnits);
    fromSel.addEventListener("change", compute);
    toSel.addEventListener("change", compute);
    valueInput.addEventListener("input", NexoraUtils.debounce(compute, 200));
    root.querySelector("#conv-swap").addEventListener("click", () => {
      const f = fromSel.value; fromSel.value = toSel.value; toSel.value = f;
      compute();
    });

    populateUnits();
    NexoraUtils.renderIcons(root);
  }

  global.ConvertersView = { render: renderConvertersView };
})(window);
