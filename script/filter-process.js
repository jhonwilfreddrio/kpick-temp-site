/* Sungshim filter syringe / filter needle process demo.
   A restrained product schematic keeps the syringe recognizable while a
   magnified inset explains what happens at the 5 micron membrane. */
(function () {
    "use strict";

    var NS = "http://www.w3.org/2000/svg";
    var DUR = 6000;
    var STEP_TIMES = [0.30, 0.62, 1.00];
    var PARTICLE_COUNT = 8;

    var DEVICE_COPY = {
        syringe: {
            name: "Filter syringe",
            captions: [
                "Medication is drawn from the opened ampoule into the filter syringe.",
                "The integrated 5 µm membrane reduces particulates of glass, rubber, and other contaminants larger than 5 microns.",
                "Filtered medication fills the syringe barrel, ready for the next step in the intended clinical workflow."
            ],
            finalStatus: "Filtered dose in barrel",
            nextStep: "Follow clinical protocol"
        },
        needle: {
            name: "Filter needle",
            captions: [
                "Medication is drawn from the opened ampoule through the 18G filter needle.",
                "The 5 µm membrane in the filter needle reduces particulates of glass, rubber, and other contaminants larger than 5 microns.",
                "Filtered medication reaches the barrel. Remove the filter needle and fit a new sterile single-use needle before injection."
            ],
            finalStatus: "Filtered dose in barrel",
            nextStep: "Replace needle before injection"
        }
    };

    function el(name, attrs, text) {
        var node = document.createElementNS(NS, name);
        var key;
        for (key in attrs) {
            if (attrs.hasOwnProperty(key)) node.setAttribute(key, attrs[key]);
        }
        if (text !== undefined) node.textContent = text;
        return node;
    }

    function clear(node) {
        while (node.firstChild) node.removeChild(node.firstChild);
    }

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function lerp(from, to, amount) {
        return from + (to - from) * amount;
    }

    function smoothstep(value) {
        var t = clamp(value, 0, 1);
        return t * t * (3 - (2 * t));
    }

    function buildAmpoule(svg) {
        svg.appendChild(el("path", {
            d: "M51 114 L51 126 L43 136 L43 194 Q43 203 52 203 L80 203 Q89 203 89 194 L89 136 L81 126 L81 114",
            fill: "#fbfdff", stroke: "#0f4ca3", "stroke-width": "1.8"
        }));
        svg.appendChild(el("path", {
            d: "M51 114 L57 109 L63 117 L69 109 L75 117 L81 111",
            fill: "none", stroke: "#0f4ca3", "stroke-width": "1.8"
        }));
        svg.appendChild(el("rect", {
            x: "46", y: "160", width: "40", height: "40", rx: "5", fill: "#c7e8e5", opacity: ".85"
        }));
        svg.appendChild(el("text", {
            x: "66", y: "226", "text-anchor": "middle", "class": "sx-svg-dim"
        }, "Opened ampoule"));
    }

    function buildFilterMagnifier(svg) {
        var refs = {};
        refs.halo = el("circle", {
            cx: "270", cy: "60", r: "45", fill: "none", stroke: "#177a4d", "stroke-width": "2", opacity: "0"
        });
        svg.appendChild(refs.halo);
        svg.appendChild(el("circle", {
            cx: "270", cy: "60", r: "41", fill: "#ffffff", stroke: "#d5deea", "stroke-width": "1.5"
        }));
        svg.appendChild(el("line", {
            x1: "297", y1: "91", x2: "278", y2: "132", stroke: "#8fa2bd", "stroke-width": "1.2"
        }));

        svg.appendChild(el("rect", {
            x: "268", y: "30", width: "5", height: "60", rx: "2", fill: "#177a4d"
        }));
        var hatch;
        for (hatch = 0; hatch < 6; hatch += 1) {
            svg.appendChild(el("line", {
                x1: "268", y1: String(34 + (hatch * 9)), x2: "273", y2: String(38 + (hatch * 9)),
                stroke: "#ffffff", "stroke-width": ".9", opacity: ".75"
            }));
        }

        var redPositions = [[246, 42], [256, 51], [247, 61], [257, 70], [250, 80]];
        redPositions.forEach(function (position) {
            svg.appendChild(el("circle", {
                cx: String(position[0]), cy: String(position[1]), r: "2.3", fill: "#d9366b",
                "data-fp-magnifier-particle": "true"
            }));
        });
        var bluePositions = [[284, 45], [291, 59], [282, 74]];
        bluePositions.forEach(function (position) {
            svg.appendChild(el("circle", {
                cx: String(position[0]), cy: String(position[1]), r: "2", fill: "#83b5e8",
                "data-fp-magnifier-fluid": "true"
            }));
        });
        svg.appendChild(el("text", {
            x: "270", y: "111", "text-anchor": "middle", "class": "sx-svg-dim"
        }, "5 µm membrane"));
        return refs;
    }

    function buildDevice(svg, device) {
        var isNeedle = device === "needle";
        var refs = {};

        /* Fine metal needle and compact hub. */
        svg.appendChild(el("line", {
            x1: "89", y1: "148", x2: "245", y2: "148", stroke: "#8fa2bd", "stroke-width": "4", "stroke-linecap": "round"
        }));
        svg.appendChild(el("line", {
            x1: "92", y1: "148", x2: "245", y2: "148", stroke: "#eef4fb", "stroke-width": "1.2", "stroke-linecap": "round"
        }));
        svg.appendChild(el("polygon", {
            points: "84,148 91,145.8 91,150.2", fill: "#6d81a0"
        }));
        svg.appendChild(el("polygon", {
            points: "232,142 246,134 246,162 232,154", fill: "#eef5fb", stroke: "#0f4ca3", "stroke-width": "1.6"
        }));
        svg.appendChild(el("rect", {
            x: "245", y: "132", width: "59", height: "32", rx: "8",
            fill: "#f5faf9", stroke: "#0f4ca3", "stroke-width": "1.6"
        }));
        svg.appendChild(el("rect", {
            x: "274", y: "136", width: "6", height: "24", rx: "2", fill: "#177a4d"
        }));

        if (isNeedle) {
            svg.appendChild(el("line", {
                x1: "300", y1: "127", x2: "300", y2: "169", stroke: "#6d81a0", "stroke-width": "1.2",
                "stroke-dasharray": "3 3", opacity: ".72"
            }));
            refs.removalCue = el("text", {
                x: "274", y: "191", "text-anchor": "middle", "class": "sx-svg-warn", opacity: "0"
            }, "Replace before injection");
            svg.appendChild(refs.removalCue);
        }

        /* Slim, transparent graduated syringe barrel. */
        svg.appendChild(el("rect", {
            x: "304", y: "116", width: "406", height: "64", rx: "7",
            fill: "#fbfdff", stroke: "#0f4ca3", "stroke-width": "1.8"
        }));
        refs.fill = el("rect", {
            x: "308", y: "120", width: "12", height: "56", rx: "4", fill: "#bcd9fb", opacity: ".58"
        });
        svg.appendChild(refs.fill);

        var tick;
        for (tick = 1; tick < 15; tick += 1) {
            var tickX = 304 + (406 * tick / 15);
            svg.appendChild(el("line", {
                x1: String(tickX), y1: "118", x2: String(tickX), y2: tick % 5 ? "126" : "134",
                stroke: "#0f4ca3", "stroke-width": tick % 5 ? ".9" : "1.35", opacity: tick % 5 ? ".42" : ".72"
            }));
        }

        refs.seal = el("rect", {
            x: "326", y: "120", width: "10", height: "56", rx: "3", fill: "#37415a"
        });
        refs.shaft = el("rect", {
            x: "336", y: "143", width: "484", height: "10", rx: "3", fill: "#cbd7e6"
        });
        svg.appendChild(refs.seal);
        svg.appendChild(refs.shaft);
        svg.appendChild(el("rect", {
            x: "820", y: "111", width: "9", height: "74", rx: "4", fill: "#91a6c1"
        }));
        svg.appendChild(el("rect", {
            x: "706", y: "108", width: "7", height: "80", rx: "3", fill: "#0f4ca3", opacity: ".42"
        }));

        refs.finalLabel = el("text", {
            x: "505", y: "207", "text-anchor": "middle", "class": "sx-svg-ok", opacity: "0"
        }, "Filtered medication");
        svg.appendChild(refs.finalLabel);

        refs.particleGroup = el("g", {});
        svg.appendChild(refs.particleGroup);
        refs.particles = [];
        var particle;
        for (particle = 0; particle < PARTICLE_COUNT; particle += 1) {
            var circle = el("circle", {
                r: String(1.8 + ((particle % 2) * 0.35)), fill: "#d9366b", "data-fp-flow-particle": "true"
            });
            refs.particleGroup.appendChild(circle);
            refs.particles.push({
                el: circle,
                startX: 51 + ((particle * 13) % 30),
                startY: 165 + ((particle * 17) % 30),
                stopX: 270 - ((particle % 2) * 4),
                stopY: 139 + ((particle * 7) % 19),
                delay: particle * 0.015
            });
        }
        return refs;
    }

    function buildScene(svg, device) {
        clear(svg);
        buildAmpoule(svg);
        var magnifier = buildFilterMagnifier(svg);
        var deviceRefs = buildDevice(svg, device);
        deviceRefs.magnifierHalo = magnifier.halo;
        return deviceRefs;
    }

    function init() {
        var root = document.querySelector("[data-filter-process]");
        if (!root) return;

        var device = root.getAttribute("data-filter-device") === "needle" ? "needle" : "syringe";
        var copy = DEVICE_COPY[device];
        var svg = root.querySelector("[data-filter-svg]");
        var caption = root.querySelector(".fp__caption");
        var readout = root.querySelector("[data-filter-readout]");
        var buttons = Array.prototype.slice.call(root.querySelectorAll(".fp__btn[data-step]"));
        var replay = root.querySelector(".fp__btn--replay");
        if (!svg || !caption || !readout || buttons.length !== STEP_TIMES.length) return;

        var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        var scene = buildScene(svg, device);
        var activeIndex = -1;
        var rafId = null;

        function render(t) {
            var progress = smoothstep(t);
            var sealX = lerp(326, 610, progress);
            scene.fill.setAttribute("width", String(Math.max(12, sealX - 308)));
            scene.seal.setAttribute("x", String(sealX));
            scene.shaft.setAttribute("x", String(sealX + 10));
            scene.shaft.setAttribute("width", String(Math.max(0, 820 - sealX - 10)));
            scene.magnifierHalo.setAttribute("opacity", String(clamp((t - 0.28) / 0.24, 0, 1) * 0.72));
            scene.finalLabel.setAttribute("opacity", String(clamp((t - 0.70) / 0.18, 0, 1)));
            if (scene.removalCue) {
                scene.removalCue.setAttribute("opacity", String(clamp((t - 0.74) / 0.16, 0, 1)));
            }

            var index;
            for (index = 0; index < scene.particles.length; index += 1) {
                var particle = scene.particles[index];
                var travel = clamp((t - particle.delay) / (0.58 - particle.delay), 0, 1);
                var x;
                var y;
                if (travel < 0.35) {
                    var towardTip = smoothstep(travel / 0.35);
                    x = lerp(particle.startX, 89, towardTip);
                    y = lerp(particle.startY, 148, towardTip);
                } else {
                    var towardFilter = smoothstep((travel - 0.35) / 0.65);
                    x = lerp(89, particle.stopX, towardFilter);
                    y = lerp(148, particle.stopY, towardFilter);
                }
                particle.el.setAttribute("cx", String(x));
                particle.el.setAttribute("cy", String(y));
            }
        }

        function readoutMarkup(index) {
            var process = index === 0 ? "Drawing up" : (index === 1 ? "Filtering" : "Complete");
            var particleState = index === 0 ? "Moving toward filter" : "Held at membrane";
            var status = index === 2 ? copy.finalStatus : (index === 1 ? "Filter retaining particulates" : "Medication entering device");
            var next = index === 2 ? copy.nextStep : "Continue through the steps";
            return "<div><span>Device</span><strong>" + copy.name + "</strong></div>" +
                "<div><span>Process</span><strong>" + process + "</strong></div>" +
                "<div><span>Illustrated particles</span><strong>" + particleState + "</strong></div>" +
                "<div><span>Status</span><strong>" + status + "</strong></div>" +
                "<div><span>Next step</span><strong>" + next + "</strong></div>";
        }

        function setActiveStep(index) {
            if (index === activeIndex) return;
            activeIndex = index;
            buttons.forEach(function (button, buttonIndex) {
                var isActive = buttonIndex === index;
                button.classList.toggle("is-active", isActive);
                button.setAttribute("aria-pressed", isActive ? "true" : "false");
            });
            caption.textContent = copy.captions[index];
            readout.innerHTML = readoutMarkup(index);
        }

        function stepForTime(t) {
            var index;
            for (index = 0; index < STEP_TIMES.length; index += 1) {
                if (t <= STEP_TIMES[index] + 0.001) return index;
            }
            return STEP_TIMES.length - 1;
        }

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
            function frame(timestamp) {
                if (start === null) start = timestamp;
                var t = Math.min(1, (offset + (timestamp - start)) / DUR);
                render(t);
                setActiveStep(stepForTime(t));
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
            render(STEP_TIMES[index]);
            setActiveStep(index);
        }

        buttons.forEach(function (button, index) {
            button.addEventListener("click", function () { seek(index); });
        });
        if (replay) {
            replay.addEventListener("click", function () { play(0); });
        }

        render(reduced ? 1 : 0);
        setActiveStep(reduced ? 2 : 0);
        if (!reduced && "IntersectionObserver" in window) {
            var seen = false;
            var observer = new IntersectionObserver(function (entries) {
                var entryIndex;
                if (seen) return;
                for (entryIndex = 0; entryIndex < entries.length; entryIndex += 1) {
                    if (entries[entryIndex].isIntersecting) {
                        seen = true;
                        observer.disconnect();
                        play(0);
                        break;
                    }
                }
            }, { threshold: 0.35 });
            observer.observe(root);
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
