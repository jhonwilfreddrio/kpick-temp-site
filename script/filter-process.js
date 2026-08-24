(function () {
    "use strict";

    var DUR = 6000;
    var SEAL_MIN = 340;
    var SEAL_MAX = 600;
    var CLAMP_BASE = 266;

    var STEPS = [
        { t: 0.30, caption: "Medication is drawn up through the needle channel toward the barrel." },
        { t: 0.62, caption: "The built-in 5 µm filter traps particulates of glass, rubber, and other contaminants larger than 5 microns." },
        { t: 1.00, caption: "Only filtered medication reaches the barrel, ready for administration." }
    ];

    function init() {
        var root = document.querySelector("[data-filter-process]");
        if (!root) return;

        var svg = root.querySelector("#fp-svg");
        var fill = root.querySelector("#fp-fill");
        var plunger = root.querySelector("#fp-plunger");
        var particleGroup = root.querySelector("#fp-particles");
        var caption = root.querySelector(".fp__caption");
        var buttons = Array.prototype.slice.call(root.querySelectorAll(".fp__btn[data-step]"));
        var replay = root.querySelector(".fp__btn--replay");
        if (!svg || !fill || !plunger || !particleGroup || !caption) return;

        var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        // Deterministic particle set: position is a pure function of t, so
        // seeking to any step renders correctly without incremental physics.
        var particles = [];
        for (var i = 0; i < 16; i += 1) {
            var c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            c.setAttribute("r", "3");
            c.setAttribute("fill", "#d64545");
            particleGroup.appendChild(c);
            particles.push({
                el: c,
                x0: 30 - (i * 55) % 320,
                v: 150 + ((i * 37) % 60),
                yJitter: ((i * 13) % 7) - 3,
                clampX: CLAMP_BASE - (i % 3) * 5,
                yTarget: 128 + ((i * 9) % 64)
            });
        }

        function render(t) {
            var sealX = SEAL_MIN + (SEAL_MAX - SEAL_MIN) * t;
            fill.setAttribute("width", String(Math.max(0, sealX - 320)));
            plunger.setAttribute("transform", "translate(" + (sealX - SEAL_MIN) + " 0)");

            for (var j = 0; j < particles.length; j += 1) {
                var p = particles[j];
                var x = p.x0 + p.v * (t * DUR / 1000);
                if (x > p.clampX) x = p.clampX;
                var y;
                if (x < 240) {
                    y = 150 + p.yJitter;
                } else {
                    var f = Math.min(1, (x - 240) / (p.clampX - 240));
                    y = (150 + p.yJitter) + (p.yTarget - 150 - p.yJitter) * f;
                }
                p.el.setAttribute("cx", String(x));
                p.el.setAttribute("cy", String(y));
                p.el.setAttribute("opacity", x < 16 ? "0" : "1");
            }
        }

        function setActiveStep(index) {
            buttons.forEach(function (btn, k) {
                var on = k === index;
                btn.classList.toggle("is-active", on);
                btn.setAttribute("aria-pressed", on ? "true" : "false");
            });
            caption.textContent = index >= 0 ? STEPS[index].caption : "";
        }

        function stepForT(t) {
            for (var k = 0; k < STEPS.length; k += 1) {
                if (t <= STEPS[k].t + 0.001) return k;
            }
            return STEPS.length - 1;
        }

        var rafId = null;

        function stop() {
            if (rafId !== null) {
                window.cancelAnimationFrame(rafId);
                rafId = null;
            }
        }

        function play(fromT) {
            stop();
            if (reduced) {
                render(1);
                setActiveStep(2);
                return;
            }
            var start = null;
            var offset = fromT * DUR;
            function frame(ts) {
                if (start === null) start = ts;
                var t = Math.min(1, (offset + (ts - start)) / DUR);
                render(t);
                setActiveStep(stepForT(t));
                if (t < 1) {
                    rafId = window.requestAnimationFrame(frame);
                } else {
                    rafId = null;
                }
            }
            rafId = window.requestAnimationFrame(frame);
        }

        function seek(index) {
            stop();
            render(STEPS[index].t);
            setActiveStep(index);
        }

        buttons.forEach(function (btn, k) {
            btn.addEventListener("click", function () { seek(k); });
        });
        if (replay) {
            replay.addEventListener("click", function () { play(0); });
        }

        // Initial state; auto-play one pass when the widget scrolls into view.
        render(reduced ? 1 : 0);
        setActiveStep(reduced ? 2 : 0);
        if (!reduced && "IntersectionObserver" in window) {
            var seen = false;
            var io = new IntersectionObserver(function (entries) {
                if (seen) return;
                for (var e = 0; e < entries.length; e += 1) {
                    if (entries[e].isIntersecting) {
                        seen = true;
                        io.disconnect();
                        play(0);
                        break;
                    }
                }
            }, { threshold: 0.35 });
            io.observe(root);
        } else if (!reduced) {
            play(0);
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
