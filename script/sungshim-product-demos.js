(function () {
    "use strict";

    var NEEDLE_SIZES = {
        18: { lengths: [25, 38], width: 7, relative: "Wider", hub: "#e88aa4" },
        23: { lengths: [25], width: 5, relative: "Medium", hub: "#5d9fe8" },
        25: { lengths: [16, 25, 38], width: 4, relative: "Fine", hub: "#ef9b4b" },
        30: { lengths: [4, 13, 25, 38], width: 2.4, relative: "Very fine", hub: "#e9c94e" }
    };

    var NANO_SIZES = {
        30: { lengths: [4, 13, 25, 38], width: 3.2, relative: "Fine", hub: "#e9c94e" },
        32: { lengths: [4, 6, 8, 13], width: 2.4, relative: "Finer", hub: "#62b77a" },
        34: { lengths: [4, 6, 8, 13], width: 1.8, relative: "Finest shown", hub: "#a98ad6" }
    };

    var IV_COPY = {
        spike: {
            title: "Spike the fluid container",
            line: "Line not yet primed",
            note: "The spike creates the fluid path from the hanging container into the drip chamber. The line is not shown connected to a patient at this stage."
        },
        prime: {
            title: "Prime chamber and tubing",
            line: "Air displaced in the illustration",
            note: "Priming fills the chamber and tubing so air is removed before connection. Trained healthcare professionals follow the product instructions and facility protocol."
        },
        regulate: {
            title: "Regulate and monitor flow",
            line: "Primed path shown",
            note: "The clamp changes the visible drip cadence in this illustration. The prescribed flow must be set and monitored by a trained healthcare professional."
        }
    };

    function reducedMotion() {
        return typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }

    function buttonMarkup(key, value, label, active, small) {
        return '<button type="button" class="sx__btn' + (active ? " is-active" : "") + '" data-pd-set="' + key + '" data-pd-value="' + value + '" aria-pressed="' + (active ? "true" : "false") + '">' + label + (small ? "<small>" + small + "</small>" : "") + "</button>";
    }

    function renderLengthButtons(root, state, sizes) {
        var wrap = root.querySelector('[data-pd-options="length"]');
        if (!wrap) return;
        wrap.innerHTML = sizes[state.gauge].lengths.map(function (length) {
            return buttonMarkup("length", length, length, state.length === length, "mm");
        }).join("");
    }

    function syncPressed(root, key, value) {
        root.querySelectorAll('[data-pd-set="' + key + '"]').forEach(function (button) {
            var active = button.getAttribute("data-pd-value") === String(value);
            button.classList.toggle("is-active", active);
            button.setAttribute("aria-pressed", active ? "true" : "false");
        });
    }

    function restartMotion(root, shouldAnimate) {
        root.classList.remove("is-animating");
        if (root._pdMotionTimer) window.clearTimeout(root._pdMotionTimer);
        if (!shouldAnimate || reducedMotion()) return;
        var frame = window.requestAnimationFrame || function (callback) { return window.setTimeout(callback, 16); };
        frame(function () {
            root.classList.add("is-animating");
            root._pdMotionTimer = window.setTimeout(function () {
                root.classList.remove("is-animating");
            }, 1800);
        });
    }

    function needleSvg(state) {
        var item = NEEDLE_SIZES[state.gauge];
        var shaftStart = 350;
        var shaftEnd = shaftStart + (state.length / 38) * 360;
        var crossRadius = 9 + item.width * 2.1;
        return '' +
            '<rect x="52" y="100" width="205" height="72" rx="18" fill="#d9eafd" stroke="#0f4ca3" stroke-width="2"/>' +
            '<rect x="73" y="111" width="152" height="50" rx="11" fill="#ffffff" opacity=".72"/>' +
            '<line x1="102" y1="112" x2="102" y2="160" stroke="#83a9d8" stroke-width="2"/>' +
            '<line x1="136" y1="112" x2="136" y2="160" stroke="#83a9d8" stroke-width="2"/>' +
            '<line x1="170" y1="112" x2="170" y2="160" stroke="#83a9d8" stroke-width="2"/>' +
            '<line x1="204" y1="112" x2="204" y2="160" stroke="#83a9d8" stroke-width="2"/>' +
            '<path d="M257 115 L290 122 L290 150 L257 157 Z" fill="#edf4fd" stroke="#0f4ca3" stroke-width="2"/>' +
            '<rect x="288" y="112" width="62" height="48" rx="10" fill="' + item.hub + '" stroke="#0f4ca3" stroke-width="2"/>' +
            '<rect x="301" y="121" width="36" height="30" rx="7" fill="#ffffff" opacity=".4"/>' +
            '<line x1="350" y1="136" x2="' + (shaftEnd - 8) + '" y2="136" stroke="#6e7d91" stroke-width="' + item.width + '" stroke-linecap="round"/>' +
            '<path d="M' + (shaftEnd - 10) + ' ' + (136 - item.width / 2) + ' L' + shaftEnd + ' 136 L' + (shaftEnd - 10) + ' ' + (136 + item.width / 2) + ' Z" fill="#6e7d91"/>' +
            '<line x1="350" y1="198" x2="' + shaftEnd + '" y2="198" stroke="#0f4ca3" stroke-width="1.5"/>' +
            '<path d="M350 193 V203 M' + shaftEnd + ' 193 V203" stroke="#0f4ca3" stroke-width="1.5"/>' +
            '<text x="' + ((shaftStart + shaftEnd) / 2) + '" y="218" text-anchor="middle" class="pd-svg-measure">' + state.length + ' mm</text>' +
            '<circle cx="800" cy="104" r="57" fill="#ffffff" stroke="#cbd9ea" stroke-width="2"/>' +
            '<circle cx="800" cy="104" r="' + crossRadius + '" fill="#d9e4ef" stroke="#6e7d91" stroke-width="2"/>' +
            '<circle cx="800" cy="104" r="' + Math.max(4, crossRadius * .48) + '" fill="#f8fbff" stroke="#8fa2bd" stroke-width="1.5"/>' +
            '<text x="800" y="35" text-anchor="middle" class="pd-svg-cap">RELATIVE SHAFT</text>' +
            '<text x="800" y="181" text-anchor="middle" class="pd-svg-label">' + state.gauge + 'G · ' + item.relative + '</text>' +
            '<text x="154" y="91" text-anchor="middle" class="pd-svg-small">Syringe connector</text>' +
            '<text x="319" y="91" text-anchor="middle" class="pd-svg-small">Color-coded hub</text>';
    }

    function nanoSvg(state) {
        var item = NANO_SIZES[state.gauge];
        var shaftStart = 300;
        var shaftEnd = shaftStart + 250 + (state.length / 38) * 110;
        var bevelHeight = 24 + (34 - state.gauge) * 1.8;
        return '' +
            '<rect x="54" y="105" width="190" height="64" rx="17" fill="#d9eafd" stroke="#0f4ca3" stroke-width="2"/>' +
            '<rect x="77" y="116" width="135" height="42" rx="10" fill="#ffffff" opacity=".72"/>' +
            '<path d="M244 116 L273 123 L273 151 L244 158 Z" fill="#edf4fd" stroke="#0f4ca3" stroke-width="2"/>' +
            '<rect x="271" y="113" width="54" height="46" rx="10" fill="' + item.hub + '" stroke="#0f4ca3" stroke-width="2"/>' +
            '<line x1="325" y1="136" x2="' + (shaftEnd - 8) + '" y2="136" stroke="#6e7d91" stroke-width="' + item.width + '" stroke-linecap="round"/>' +
            '<path d="M' + (shaftEnd - 11) + ' ' + (136 - item.width / 2) + ' L' + shaftEnd + ' 136 L' + (shaftEnd - 11) + ' ' + (136 + item.width / 2) + ' Z" fill="#6e7d91"/>' +
            '<path d="M' + shaftEnd + ' 136 C' + (shaftEnd + 32) + ' 128 ' + (shaftEnd + 45) + ' 115 690 111" fill="none" stroke="#8fa2bd" stroke-width="1.5" stroke-dasharray="4 5"/>' +
            '<circle cx="770" cy="120" r="82" fill="#ffffff" stroke="#cbd9ea" stroke-width="2"/>' +
            '<path d="M704 137 L805 ' + (137 - bevelHeight) + ' L830 123 L805 ' + (137 + bevelHeight * .22) + ' Z" fill="#d9e4ef" stroke="#6e7d91" stroke-width="2" stroke-linejoin="round"/>' +
            '<path d="M713 132 C748 129 786 121 817 116" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity=".9"/>' +
            '<path d="M713 143 C754 143 790 136 820 124" fill="none" stroke="#9cb1c7" stroke-width="1.5" stroke-linecap="round"/>' +
            '<text x="770" y="26" text-anchor="middle" class="pd-svg-cap">MAGNIFIED TIP</text>' +
            '<text x="770" y="226" text-anchor="middle" class="pd-svg-label">Micro-polished bevel</text>' +
            '<line x1="325" y1="202" x2="' + shaftEnd + '" y2="202" stroke="#0f4ca3" stroke-width="1.5"/>' +
            '<path d="M325 197 V207 M' + shaftEnd + ' 197 V207" stroke="#0f4ca3" stroke-width="1.5"/>' +
            '<text x="' + ((shaftStart + shaftEnd) / 2) + '" y="222" text-anchor="middle" class="pd-svg-measure">' + state.gauge + 'G · ' + state.length + ' mm</text>' +
            '<text x="146" y="94" text-anchor="middle" class="pd-svg-small">Luer-compatible connection</text>';
    }

    function dripMarkup(clamp) {
        var count = clamp === "closed" ? 0 : clamp === "partial" ? 3 : 5;
        var drops = "";
        for (var index = 0; index < count; index += 1) {
            drops += '<circle class="pd-svg-drop" cx="190" cy="' + (144 + index * 7) + '" r="4" fill="#4f9fe8"/>';
        }
        return drops;
    }

    function infusionSvg(state) {
        var primed = state.step !== "spike";
        var clampX = state.clamp === "closed" ? 490 : state.clamp === "partial" ? 510 : 530;
        var flowStroke = primed ? "#4f9fe8" : "#c8d7e8";
        return '' +
            '<path d="M102 38 H278 L264 120 H116 Z" fill="#d9eafd" stroke="#0f4ca3" stroke-width="2"/>' +
            '<path d="M116 91 H264 L259 120 H121 Z" fill="#9ecaf3" opacity=".75"/>' +
            '<line x1="190" y1="18" x2="190" y2="38" stroke="#7f93ad" stroke-width="5" stroke-linecap="round"/>' +
            '<text x="190" y="145" text-anchor="middle" class="pd-svg-small">Fluid container</text>' +
            '<g class="pd-svg-spike"><path d="M180 121 L190 102 L200 121 Z" fill="#6e7d91"/><rect x="181" y="120" width="18" height="28" rx="5" fill="#0f4ca3"/></g>' +
            '<rect x="163" y="148" width="54" height="75" rx="18" fill="#ffffff" stroke="#6e8aaa" stroke-width="2"/>' +
            '<path d="M169 184 H211 V204 Q190 217 169 204 Z" fill="#9ecaf3" opacity="' + (state.step === "spike" ? ".18" : ".78") + '"/>' +
            (state.step === "regulate" ? dripMarkup(state.clamp) : "") +
            '<path d="M190 223 V244 H680 V183" fill="none" stroke="#c8d7e8" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>' +
            '<path class="' + (state.step === "prime" ? "pd-svg-prime" : "") + '" pathLength="1" d="M190 223 V244 H680 V183" fill="none" stroke="' + flowStroke + '" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>' +
            (state.step === "prime" ? '<g><circle class="pd-svg-bubble" cx="315" cy="244" r="5" fill="#ffffff" stroke="#4f9fe8" stroke-width="2"/><circle class="pd-svg-bubble" cx="390" cy="244" r="4" fill="#ffffff" stroke="#4f9fe8" stroke-width="2"/><circle class="pd-svg-bubble" cx="455" cy="244" r="5" fill="#ffffff" stroke="#4f9fe8" stroke-width="2"/></g>' : "") +
            '<path d="M468 218 H551 L536 258 H483 Z" fill="#edf4fd" stroke="#6e8aaa" stroke-width="2"/>' +
            '<circle cx="' + clampX + '" cy="236" r="12" fill="#0f4ca3" stroke="#ffffff" stroke-width="3"/>' +
            '<rect x="662" y="152" width="36" height="36" rx="7" fill="#d9eafd" stroke="#0f4ca3" stroke-width="2"/>' +
            '<path d="M698 164 H746 L766 174 L746 184 H698 Z" fill="#edf4fd" stroke="#0f4ca3" stroke-width="2"/>' +
            '<path d="M766 174 H838" stroke="#8fa2bd" stroke-width="4" stroke-linecap="round"/>' +
            '<circle cx="842" cy="174" r="7" fill="#ffffff" stroke="#8fa2bd" stroke-width="2"/>' +
            '<text x="190" y="238" text-anchor="middle" class="pd-svg-cap">DRIP CHAMBER</text>' +
            '<text x="510" y="205" text-anchor="middle" class="pd-svg-cap">ROLLER CLAMP</text>' +
            '<text x="744" y="143" text-anchor="middle" class="pd-svg-cap">PATIENT CONNECTOR</text>' +
            '<text x="445" y="284" text-anchor="middle" class="pd-svg-label">' + IV_COPY[state.step].title + '</text>';
    }

    function readoutCell(label, value) {
        return "<div><span>" + label + "</span><strong>" + value + "</strong></div>";
    }

    function renderNeedle(root, state, animate) {
        var item = NEEDLE_SIZES[state.gauge];
        renderLengthButtons(root, state, NEEDLE_SIZES);
        syncPressed(root, "gauge", state.gauge);
        syncPressed(root, "length", state.length);
        root.querySelector("[data-pd-svg]").innerHTML = needleSvg(state);
        root.querySelector("[data-pd-svg]").setAttribute("aria-label", "Relative diagram of a " + state.gauge + " gauge, " + state.length + " millimeter single-use needle with color-coded hub");
        root.querySelector("[data-pd-readout]").innerHTML = readoutCell("Gauge", state.gauge + "G") + readoutCell("Length", state.length + " mm") + readoutCell("Relative shaft", item.relative);
        root.querySelector("[data-pd-note]").textContent = "Gauge and length are separate dimensions. A lower gauge number indicates a wider shaft; this explorer compares available sizes and does not recommend a size for any procedure.";
        restartMotion(root, animate);
    }

    function renderNano(root, state, animate) {
        var item = NANO_SIZES[state.gauge];
        renderLengthButtons(root, state, NANO_SIZES);
        syncPressed(root, "gauge", state.gauge);
        syncPressed(root, "length", state.length);
        root.querySelector("[data-pd-svg]").innerHTML = nanoSvg(state);
        root.querySelector("[data-pd-svg]").setAttribute("aria-label", "Relative diagram of a " + state.gauge + " gauge, " + state.length + " millimeter nano needle with a magnified micro-polished bevel");
        root.querySelector("[data-pd-readout]").innerHTML = readoutCell("Gauge", state.gauge + "G") + readoutCell("Length", state.length + " mm") + readoutCell("Finish", "Micro-polished");
        root.querySelector("[data-pd-note]").textContent = "The magnifier explains the micro-polished bevel and relative shaft size. It is illustrative, not to scale, and does not quantify pain or clinical performance.";
        restartMotion(root, animate);
    }

    function renderInfusion(root, state, animate) {
        var clampCopy = state.clamp === "closed" ? "Closed" : state.clamp === "partial" ? "Partly open" : "More open";
        var dripCopy = state.clamp === "closed" ? "Paused" : state.clamp === "partial" ? "Slower preview" : "Faster preview";
        syncPressed(root, "step", state.step);
        syncPressed(root, "clamp", state.clamp);
        root.querySelector("[data-pd-svg]").innerHTML = infusionSvg(state);
        root.querySelector("[data-pd-svg]").setAttribute("aria-label", "Infusion set illustration at the " + IV_COPY[state.step].title.toLowerCase() + " step with the clamp " + clampCopy.toLowerCase());
        root.querySelector("[data-pd-readout]").innerHTML = readoutCell("Process", IV_COPY[state.step].title) + readoutCell("Line state", IV_COPY[state.step].line) + readoutCell("Clamp preview", clampCopy + " · " + dripCopy);
        root.querySelector("[data-pd-note]").textContent = IV_COPY[state.step].note;
        restartMotion(root, animate);
    }

    function initVariantDemo(root, type) {
        var sizes = type === "needle" ? NEEDLE_SIZES : NANO_SIZES;
        var state = type === "needle" ? { gauge: 25, length: 16 } : { gauge: 32, length: 8 };
        var render = type === "needle" ? renderNeedle : renderNano;
        root.addEventListener("click", function (event) {
            var button = event.target.closest("[data-pd-set]");
            if (!button || !root.contains(button)) return;
            var key = button.getAttribute("data-pd-set");
            var value = Number(button.getAttribute("data-pd-value"));
            if (key === "gauge" && sizes[value]) {
                state.gauge = value;
                if (sizes[value].lengths.indexOf(state.length) === -1) state.length = sizes[value].lengths[0];
            }
            if (key === "length" && sizes[state.gauge].lengths.indexOf(value) !== -1) state.length = value;
            render(root, state, true);
        });
        render(root, state, false);
    }

    function initInfusionDemo(root) {
        var state = { step: "spike", clamp: "partial" };
        root.addEventListener("click", function (event) {
            var replay = event.target.closest("[data-pd-replay]");
            if (replay && root.contains(replay)) {
                renderInfusion(root, state, true);
                return;
            }
            var button = event.target.closest("[data-pd-set]");
            if (!button || !root.contains(button)) return;
            var key = button.getAttribute("data-pd-set");
            var value = button.getAttribute("data-pd-value");
            if (key === "step" && IV_COPY[value]) state.step = value;
            if (key === "clamp" && ["closed", "partial", "open"].indexOf(value) !== -1) {
                state.clamp = value;
                state.step = "regulate";
            }
            renderInfusion(root, state, true);
        });
        renderInfusion(root, state, false);
    }

    function start() {
        document.querySelectorAll("[data-product-demo]").forEach(function (root) {
            var type = root.getAttribute("data-product-demo");
            if (type === "needle" || type === "nano") initVariantDemo(root, type);
            if (type === "infusion") initInfusionDemo(root);
        });
    }

    if (typeof module !== "undefined" && module.exports) {
        module.exports = {
            needleSizes: NEEDLE_SIZES,
            nanoSizes: NANO_SIZES,
            needleSvg: needleSvg,
            nanoSvg: nanoSvg,
            infusionSvg: infusionSvg
        };
    }

    if (typeof document !== "undefined") {
        if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
        else start();
    }
}());
