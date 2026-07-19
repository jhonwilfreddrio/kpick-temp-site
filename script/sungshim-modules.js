/* Sungshim interactive product modules
   Every figure below is taken from Sungshim Medical's published specifications
   (ss-medical.co.kr). Needle outer diameters are ISO 9626 nominal values. */
(function () {
    'use strict';

    var NS = 'http://www.w3.org/2000/svg';
    function el(name, attrs, text) {
        var n = document.createElementNS(NS, name);
        for (var k in attrs) if (attrs.hasOwnProperty(k)) n.setAttribute(k, attrs[k]);
        if (text !== undefined) n.textContent = text;
        return n;
    }
    function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }

    function bindGroup(root, key, onPick) {
        root.addEventListener('click', function (e) {
            var btn = e.target.closest('[data-sx-set="' + key + '"]');
            if (!btn || !root.contains(btn)) return;
            var group = root.querySelectorAll('[data-sx-set="' + key + '"]');
            for (var i = 0; i < group.length; i++) {
                var on = group[i] === btn;
                group[i].classList.toggle('is-active', on);
                group[i].setAttribute('aria-pressed', on ? 'true' : 'false');
            }
            onPick(btn.getAttribute('data-sx-value'));
        });
    }

    /* ==========================================================
       1. SINGLE-USE SYRINGE — capacity & tip comparator
       ========================================================== */
    (function capacityModule() {
        var root = document.querySelector('[data-sx-capacity]');
        if (!root) return;

        var SIZES = {
            '1':  { needles: ['23G x 25 mm', '26G x 13 mm', '27G x 13 mm', '27G x 25 mm', '30G x 13 mm', 'Without needle'], tips: 'Luer Slip', inner: '100 pcs', carton: '3,600 pcs', use: 'Small-volume injection, vaccines, paediatric dosing.' },
            '2':  { needles: ['23G x 25 mm'], tips: 'Luer Slip, Luer Lock', inner: '100 pcs', carton: '2,400 pcs', use: 'Standard intramuscular injection.' },
            '3':  { needles: ['23G x 25 mm', '24G x 19 mm', 'Without needle'], tips: 'Luer Slip, Luer Lock', inner: '100 pcs', carton: '2,400 pcs', use: 'The highest-volume size in most hospitals — routine IM injection.' },
            '5':  { needles: ['23G x 25 mm', '22G x 32 mm', '21G x 32 mm', 'Without needle'], tips: 'Luer Slip, Luer Lock', inner: '100 pcs', carton: '1,800 pcs', use: 'Intramuscular injection and reconstituting powdered drugs.' },
            '10': { needles: ['23G x 25 mm', '22G x 32 mm', '21G x 32 mm', 'Without needle'], tips: 'Luer Slip, Luer Lock', inner: '100 pcs', carton: '1,200 pcs', use: 'IV push medication and flushing lines.' },
            '20': { needles: ['23G x 25 mm', '22G x 32 mm', '21G x 32 mm', '18G x 38 mm', 'Without needle'], tips: 'Luer Slip, Luer Lock', inner: '50 pcs', carton: '800 pcs', use: 'Aspiration and wound irrigation.' },
            '30': { needles: ['21G x 32 mm', '18G x 38 mm', 'Without needle'], tips: 'Luer Slip, Luer Lock', inner: '50 pcs', carton: '600 pcs', use: 'Aspiration, irrigation, larger-volume transfer.' },
            '50': { needles: ['21G x 32 mm', '18G x 38 mm'], tips: 'Luer Slip, Luer Lock', inner: '25 pcs', carton: '400 pcs', use: 'Bladder irrigation, enteral feeding, high-volume transfer.' },
            '60': { needles: ['Without needle (Catheter tip)'], tips: 'Catheter tip', inner: '25 pcs', carton: '400 pcs', use: 'Irrigation syringe. The catheter tip connects to tubing, not to a needle.' }
        };

        var state = { size: '3', tip: 'slip' };
        var svg = root.querySelector('[data-sx-svg]');
        var out = root.querySelector('[data-sx-readout]');
        var needleList = root.querySelector('[data-sx-needles]');
        var useNote = root.querySelector('[data-sx-use]');
        var tipWrap = root.querySelector('[data-sx-tipwrap]');

        function draw() {
            var mL = parseFloat(state.size);
            var s = SIZES[state.size];
            clear(svg);

            /* barrel geometry scaled from volume — length and bore both grow */
            var maxW = 470, maxH = 86;
            var f = Math.pow(mL / 60, 0.42);
            var bw = 120 + (maxW - 120) * f;
            var bh = 30 + (maxH - 30) * f;
            var bx = 200, by = 130 - bh / 2;

            /* needle / tip */
            if (state.size === '60') {
                svg.appendChild(el('path', {
                    d: 'M' + (bx - 44) + ',' + (130 - 11) + ' L' + (bx - 12) + ',' + (130 - 15) +
                       ' L' + bx + ',' + (130 - 15) + ' L' + bx + ',' + (130 + 15) +
                       ' L' + (bx - 12) + ',' + (130 + 15) + ' L' + (bx - 44) + ',' + (130 + 11) + ' Z',
                    fill: '#0f4ca3', opacity: '.85'
                }));
                svg.appendChild(el('text', { x: bx - 30, y: 176, 'text-anchor': 'middle', class: 'sx-svg-dim' }, 'Catheter tip'));
            } else {
                svg.appendChild(el('rect', { x: bx - 92, y: 128, width: 74, height: 4, fill: '#8fa2bd', rx: 2 }));
                svg.appendChild(el('polygon', { points: (bx - 100) + ',130 ' + (bx - 92) + ',128 ' + (bx - 92) + ',132', fill: '#6d81a0' }));
                if (state.tip === 'lock') {
                    svg.appendChild(el('rect', { x: bx - 24, y: 113, width: 24, height: 34, rx: 4, fill: '#0f4ca3' }));
                    var g = el('g', { stroke: '#fff', 'stroke-width': '1.8', opacity: '.75' });
                    [6, 12, 18].forEach(function (dx) {
                        g.appendChild(el('line', { x1: bx - 24 + dx, y1: 115, x2: bx - 24 + dx, y2: 145 }));
                    });
                    svg.appendChild(g);
                    svg.appendChild(el('text', { x: bx - 12, y: 186, 'text-anchor': 'middle', class: 'sx-svg-dim' }, 'Threaded — twists shut'));
                } else {
                    svg.appendChild(el('polygon', { points: (bx - 22) + ',119 ' + bx + ',' + (130 - bh / 2 + 3) + ' ' + bx + ',' + (130 + bh / 2 - 3) + ' ' + (bx - 22) + ',141', fill: '#0f4ca3', opacity: '.85' }));
                    svg.appendChild(el('text', { x: bx - 12, y: 186, 'text-anchor': 'middle', class: 'sx-svg-dim' }, 'Friction fit — pushes on'));
                }
            }

            /* barrel */
            svg.appendChild(el('rect', { x: bx, y: by, width: bw, height: bh, rx: 6, fill: '#f4f9ff', stroke: '#0f4ca3', 'stroke-width': '2' }));
            var marks = mL <= 3 ? 10 : (mL <= 10 ? 10 : 12);
            for (var i = 1; i < marks; i++) {
                var x = bx + (bw * i / marks);
                svg.appendChild(el('line', { x1: x, y1: by + 2, x2: x, y2: by + (i % 2 ? 8 : 13), stroke: '#0f4ca3', 'stroke-width': '1', opacity: '.55' }));
            }
            svg.appendChild(el('rect', { x: bx + bw * 0.62, y: by + 1, width: 12, height: bh - 2, rx: 3, fill: '#37415a' }));
            svg.appendChild(el('rect', { x: bx + bw * 0.62 + 12, y: 124, width: bw * 0.38 + 26, height: 12, fill: '#cfdaea' }));
            svg.appendChild(el('rect', { x: bx + bw + 38, y: 130 - bh / 2 - 6, width: 11, height: bh + 12, rx: 4, fill: '#8fa2bd' }));

            svg.appendChild(el('text', { x: bx + bw / 2, y: by + bh + 26, 'text-anchor': 'middle', class: 'sx-svg-dim' }, mL + ' mL/cc'));

            /* 3 mL reference outline, drawn on top so it reads as an overlay */
            if (state.size !== '3') {
                var rf = Math.pow(3 / 60, 0.42);
                var rw = 120 + (maxW - 120) * rf, rh = 30 + (maxH - 30) * rf;
                svg.appendChild(el('rect', {
                    x: bx, y: 130 - rh / 2, width: rw, height: rh, rx: 5,
                    fill: 'none', stroke: '#c0264f', 'stroke-width': '1.6', 'stroke-dasharray': '5 4', opacity: '.75'
                }));
                svg.appendChild(el('rect', { x: 40, y: 26, width: 13, height: 10, rx: 2, fill: 'none',
                    stroke: '#c0264f', 'stroke-width': '1.6', 'stroke-dasharray': '4 3', opacity: '.75' }));
                svg.appendChild(el('text', { x: 60, y: 35, class: 'sx-svg-cap' }, '3 mL OUTLINE, FOR SCALE'));
            }

            /* readout */
            out.innerHTML =
                '<div><span>Capacity</span><strong>' + mL + ' mL/cc</strong></div>' +
                '<div><span>Tip types</span><strong>' + s.tips + '</strong></div>' +
                '<div><span>Inner box</span><strong>' + s.inner + '</strong></div>' +
                '<div><span>Carton box</span><strong>' + s.carton + '</strong></div>';

            needleList.innerHTML = s.needles.map(function (n) {
                return '<li>' + n + '</li>';
            }).join('');
            useNote.textContent = s.use;
            tipWrap.style.display = (state.size === '60') ? 'none' : '';
        }

        bindGroup(root, 'size', function (v) { state.size = v; draw(); });
        bindGroup(root, 'tip', function (v) { state.tip = v; draw(); });
        draw();
    })();

    /* ==========================================================
       2. LDS SYRINGE — dead space simulator
       ========================================================== */
    (function ldsModule() {
        var root = document.querySelector('[data-sx-lds]');
        if (!root) return;

        /* Residual volume per injection. Standard hub ~0.07 mL is the widely
           cited figure; LDS designs bring this close to zero. */
        var STD_RESIDUAL = 0.07;
        var LDS_RESIDUAL = 0.005;

        var state = { mode: 'lds', vial: 5 };
        var svg = root.querySelector('[data-sx-svg]');
        var out = root.querySelector('[data-sx-readout]');
        var vialInput = root.querySelector('[data-sx-vial]');
        var vialOut = root.querySelector('[data-sx-vial-out]');
        var note = root.querySelector('[data-sx-note]');

        function draw() {
            clear(svg);
            var isLds = state.mode === 'lds';
            var residual = isLds ? LDS_RESIDUAL : STD_RESIDUAL;
            var dose = 0.5;                       /* a 0.5 mL dose, typical vaccine */
            var vialML = state.vial;
            var perInjection = dose + residual;
            var doses = Math.floor(vialML / perInjection);
            var wasted = (doses * residual);

            /* syringe hub cutaway */
            var hubX = 250, cy = 96;
            svg.appendChild(el('text', { x: 40, y: 34, class: 'sx-svg-cap' }, 'HUB CUTAWAY'));
            svg.appendChild(el('rect', { x: hubX, y: cy - 30, width: 300, height: 60, rx: 6, fill: '#f4f9ff', stroke: '#0f4ca3', 'stroke-width': '2' }));
            svg.appendChild(el('rect', { x: hubX + 2, y: cy - 27, width: 150, height: 54, rx: 4, fill: '#bcd9fb' }));
            svg.appendChild(el('rect', { x: hubX + 152, y: cy - 29, width: 13, height: 58, rx: 3, fill: '#37415a' }));

            /* hub cone */
            var cone = el('polygon', {
                points: (hubX - 60) + ',' + (cy - 9) + ' ' + hubX + ',' + (cy - 26) + ' ' + hubX + ',' + (cy + 26) + ' ' + (hubX - 60) + ',' + (cy + 9),
                fill: isLds ? '#0f4ca3' : '#e3ebf6', stroke: '#0f4ca3', 'stroke-width': '2'
            });
            svg.appendChild(cone);

            if (!isLds) {
                /* trapped drug in the hub */
                svg.appendChild(el('polygon', {
                    points: (hubX - 56) + ',' + (cy - 8) + ' ' + (hubX - 2) + ',' + (cy - 23) + ' ' + (hubX - 2) + ',' + (cy + 23) + ' ' + (hubX - 56) + ',' + (cy + 8),
                    fill: '#d9366b', opacity: '.8'
                }));
                svg.appendChild(el('text', { x: hubX - 30, y: cy + 62, 'text-anchor': 'middle', class: 'sx-svg-warn' }, 'Drug trapped here'));
            } else {
                /* plunger tip fills the cone */
                svg.appendChild(el('polygon', {
                    points: (hubX - 54) + ',' + (cy - 7) + ' ' + (hubX - 2) + ',' + (cy - 22) + ' ' + (hubX - 2) + ',' + (cy + 22) + ' ' + (hubX - 54) + ',' + (cy + 7),
                    fill: '#37415a'
                }));
                svg.appendChild(el('text', { x: hubX - 30, y: cy + 62, 'text-anchor': 'middle', class: 'sx-svg-ok' }, 'Plunger fills the hub'));
            }

            svg.appendChild(el('rect', { x: hubX - 118, y: cy - 2, width: 58, height: 4, fill: '#8fa2bd', rx: 2 }));
            svg.appendChild(el('polygon', { points: (hubX - 126) + ',' + cy + ' ' + (hubX - 118) + ',' + (cy - 2) + ' ' + (hubX - 118) + ',' + (cy + 2), fill: '#6d81a0' }));

            /* doses-per-vial strip */
            var dy = 190;
            svg.appendChild(el('text', { x: 40, y: dy - 14, class: 'sx-svg-cap' }, 'DOSES FROM ONE ' + vialML + ' mL VIAL'));
            var maxShow = Math.min(doses, 24);
            for (var i = 0; i < maxShow; i++) {
                svg.appendChild(el('rect', {
                    x: 40 + (i % 12) * 47, y: dy + Math.floor(i / 12) * 26,
                    width: 40, height: 18, rx: 3,
                    fill: isLds ? '#0f4ca3' : '#8fa2bd'
                }));
            }
            svg.appendChild(el('text', {
                x: 40 + Math.min(maxShow, 12) * 47 + 8,
                y: dy + 14, class: 'sx-svg-total'
            }, doses + ' doses'));

            out.innerHTML =
                '<div><span>Design</span><strong>' + (isLds ? 'LDS' : 'Standard') + '</strong></div>' +
                '<div><span>Residual per injection</span><strong>' + residual.toFixed(3) + ' mL</strong></div>' +
                '<div><span>Doses per vial</span><strong>' + doses + '</strong></div>' +
                '<div><span>Drug left behind</span><strong>' + wasted.toFixed(2) + ' mL</strong></div>';

            note.textContent = isLds
                ? 'The LDS plunger tip is shaped to occupy the hub cavity, so almost nothing is left when the plunger bottoms out. Over a vaccination programme those fractions add up to extra doses from the same stock.'
                : 'On a standard syringe the hub holds roughly 0.07 mL after the plunger bottoms out. That volume is paid for, drawn up, and then discarded with the syringe.';
        }

        bindGroup(root, 'mode', function (v) { state.mode = v; draw(); });
        vialInput.addEventListener('input', function () {
            state.vial = parseFloat(vialInput.value);
            vialOut.textContent = state.vial;
            draw();
        });
        draw();
    })();

    /* ==========================================================
       3. INSULIN PEN NEEDLE — length & skin depth
       ========================================================== */
    (function penModule() {
        var root = document.querySelector('[data-sx-pen]');
        if (!root) return;

        var OPTIONS = [
            { g: 29, len: 13, od: 0.337 },
            { g: 30, len: 6,  od: 0.312 },
            { g: 30, len: 8,  od: 0.312 },
            { g: 31, len: 4,  od: 0.261 },
            { g: 31, len: 5,  od: 0.261 },
            { g: 31, len: 6,  od: 0.261 },
            { g: 31, len: 8,  od: 0.261 },
            { g: 32, len: 4,  od: 0.235 },
            { g: 32, len: 5,  od: 0.235 },
            { g: 32, len: 6,  od: 0.235 },
            { g: 32, len: 8,  od: 0.235 },
            { g: 32, len: 13, od: 0.235 },
            { g: 33, len: 4,  od: 0.226 },
            { g: 33, len: 5,  od: 0.226 },
            { g: 33, len: 6,  od: 0.226 }
        ];

        var state = { idx: 7 };
        var svg = root.querySelector('[data-sx-svg]');
        var out = root.querySelector('[data-sx-readout]');
        var note = root.querySelector('[data-sx-note]');

        function draw() {
            clear(svg);
            var o = OPTIONS[state.idx];

            /* tissue layers — skin ~2mm, subcutaneous fat to ~10mm, muscle below */
            var top = 60, PPMM = 13;
            var skinH = 2 * PPMM, fatH = 8 * PPMM;
            svg.appendChild(el('rect', { x: 150, y: top, width: 500, height: skinH, fill: '#f2cdae' }));
            svg.appendChild(el('rect', { x: 150, y: top + skinH, width: 500, height: fatH, fill: '#fbeec4' }));
            svg.appendChild(el('rect', { x: 150, y: top + skinH + fatH, width: 500, height: 80, fill: '#e2a49d' }));

            svg.appendChild(el('text', { x: 24, y: top + 18, class: 'sx-svg-dim' }, 'Skin'));
            svg.appendChild(el('text', { x: 24, y: top + skinH + 34, class: 'sx-svg-dim' }, 'Subcutaneous'));
            svg.appendChild(el('text', { x: 24, y: top + skinH + 52, class: 'sx-svg-cap' }, 'TARGET LAYER'));
            svg.appendChild(el('text', { x: 24, y: top + skinH + fatH + 34, class: 'sx-svg-dim' }, 'Muscle'));

            /* needle */
            var nx = 400, depth = o.len * PPMM;
            var th = Math.max(3, o.od * 22);
            svg.appendChild(el('rect', { x: nx - th / 2, y: top - 46, width: th, height: 46 + depth, fill: '#8fa2bd' }));
            svg.appendChild(el('polygon', {
                points: (nx - th / 2) + ',' + (top + depth) + ' ' + (nx + th / 2) + ',' + (top + depth) + ' ' + nx + ',' + (top + depth + 9),
                fill: '#6d81a0'
            }));
            svg.appendChild(el('rect', { x: nx - 17, y: top - 74, width: 34, height: 28, rx: 5, fill: '#7a3fc1' }));

            var reachesMuscle = o.len > 10;
            svg.appendChild(el('line', {
                x1: nx + 26, y1: top, x2: nx + 26, y2: top + depth,
                stroke: reachesMuscle ? '#d9366b' : '#177a4d', 'stroke-width': '2'
            }));
            svg.appendChild(el('text', {
                x: nx + 34, y: top + depth / 2 + 5,
                class: reachesMuscle ? 'sx-svg-warn' : 'sx-svg-ok'
            }, o.len + ' mm'));

            out.innerHTML =
                '<div><span>Gauge</span><strong>' + o.g + 'G</strong></div>' +
                '<div><span>Length</span><strong>' + o.len + ' mm</strong></div>' +
                '<div><span>Outer diameter</span><strong>' + o.od.toFixed(3) + ' mm</strong></div>' +
                '<div><span>Packing</span><strong>100 / 4,800 pcs</strong></div>';

            note.textContent = reachesMuscle
                ? 'At ' + o.len + ' mm this needle can pass through subcutaneous fat into muscle on slimmer patients. Insulin delivered into muscle is absorbed faster and less predictably, so longer needles are generally reserved for specific cases and pinched-skin technique.'
                : 'At ' + o.len + ' mm the needle stays within the subcutaneous layer, which is where insulin is meant to go. Shorter needles are the current clinical preference for most adults regardless of body size.';
        }

        var list = root.querySelector('[data-sx-penlist]');
        list.innerHTML = OPTIONS.map(function (o, i) {
            return '<button type="button" class="sx__btn' + (i === state.idx ? ' is-active' : '') +
                   '" data-sx-set="pen" data-sx-value="' + i + '" aria-pressed="' + (i === state.idx) + '">' +
                   o.g + 'G <small>' + o.len + ' mm</small></button>';
        }).join('');

        bindGroup(root, 'pen', function (v) { state.idx = parseInt(v, 10); draw(); });
        draw();
    })();
})();
