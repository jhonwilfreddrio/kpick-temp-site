/* Filter syringe / filter needle — particle filtration demo.
   Sungshim states these products "reduce particulates of glass, rubber and
   other contaminants larger than 5 microns" (ss-medical.co.kr/em22.php, em30.php). */
(function () {
    'use strict';

    var root = document.querySelector('[data-sx-filter]');
    if (!root) return;

    var NS = 'http://www.w3.org/2000/svg';
    function el(n, a, t) {
        var e = document.createElementNS(NS, n);
        for (var k in a) if (a.hasOwnProperty(k)) e.setAttribute(k, a[k]);
        if (t !== undefined) e.textContent = t;
        return e;
    }

    var svg = root.querySelector('[data-sx-svg]');
    var out = root.querySelector('[data-sx-readout]');
    var note = root.querySelector('[data-sx-note]');
    var runBtn = root.querySelector('[data-sx-run]');

    var state = { filtered: true, device: 'syringe', drawn: false };

    /* fixed particle set so the two modes stay directly comparable */
    var PARTICLES = [
        { x: 88,  y: 108, r: 3.4 }, { x: 104, y: 132, r: 2.6 }, { x: 78,  y: 150, r: 3.0 },
        { x: 112, y: 166, r: 2.2 }, { x: 92,  y: 184, r: 3.6 }, { x: 72,  y: 126, r: 2.4 },
        { x: 118, y: 146, r: 2.8 }, { x: 84,  y: 170, r: 2.0 }
    ];

    function draw() {
        while (svg.firstChild) svg.removeChild(svg.firstChild);

        var isNeedle = state.device === 'needle';
        var mx = 300;

        /* ampoule */
        svg.appendChild(el('path', {
            d: 'M70,86 L70,196 Q70,214 96,214 Q122,214 122,196 L122,86 Z',
            fill: '#eef7f6', stroke: '#0e8f8a', 'stroke-width': '2'
        }));
        svg.appendChild(el('path', {
            d: 'M70,86 L79,74 L88,90 L98,72 L108,90 L116,76 L122,86',
            fill: 'none', stroke: '#0e8f8a', 'stroke-width': '2'
        }));
        svg.appendChild(el('rect', { x: 74, y: 120, width: 44, height: 90, rx: 5, fill: '#c7e8e5' }));
        svg.appendChild(el('text', { x: 96, y: 238, 'text-anchor': 'middle', class: 'sx-svg-dim' }, 'Snapped ampoule'));
        svg.appendChild(el('text', { x: 96, y: 254, 'text-anchor': 'middle', class: 'sx-svg-cap' }, 'GLASS FRAGMENTS PRESENT'));

        if (!state.drawn) {
            PARTICLES.forEach(function (p) {
                svg.appendChild(el('circle', { cx: p.x, cy: p.y, r: p.r, fill: '#d9366b' }));
            });
        }

        /* cannula */
        svg.appendChild(el('rect', { x: 132, y: 143, width: 96, height: 5, rx: 2, fill: '#8fa2bd' }));
        svg.appendChild(el('polygon', { points: '124,145.5 134,142 134,149', fill: '#6d81a0' }));

        /* hub housing */
        svg.appendChild(el('polygon', {
            points: '228,132 ' + mx + ',116 ' + mx + ',176 228,160',
            fill: state.filtered ? '#e7f5f4' : '#f0f2f6',
            stroke: state.filtered ? '#0e8f8a' : '#b9c8de', 'stroke-width': '2'
        }));

        if (state.filtered) {
            svg.appendChild(el('rect', { x: mx - 9, y: 116, width: 9, height: 60, fill: '#0e8f8a' }));
            var hatch = el('g', { stroke: '#fff', 'stroke-width': '1.2', opacity: '.6' });
            for (var i = 0; i < 6; i++) {
                hatch.appendChild(el('line', { x1: mx - 9, y1: 120 + i * 10, x2: mx, y2: 124 + i * 10 }));
            }
            svg.appendChild(hatch);
            svg.appendChild(el('text', { x: mx - 4, y: 106, 'text-anchor': 'middle', class: 'sx-svg-ok' }, '5 micron filter'));
        } else {
            svg.appendChild(el('text', { x: mx - 4, y: 106, 'text-anchor': 'middle', class: 'sx-svg-warn' }, 'No filter'));
        }

        /* barrel */
        var bx = mx, bw = 250, by = 116, bh = 60;
        svg.appendChild(el('rect', { x: bx, y: by, width: bw, height: bh, rx: 6, fill: '#f7fbff', stroke: '#0f4ca3', 'stroke-width': '2' }));
        if (state.drawn) {
            svg.appendChild(el('rect', { x: bx + 2, y: by + 3, width: bw - 60, height: bh - 6, rx: 4, fill: '#bcd9fb' }));
        }
        svg.appendChild(el('rect', { x: bx + bw - 58, y: by + 1, width: 13, height: bh - 2, rx: 3, fill: '#37415a' }));
        svg.appendChild(el('rect', { x: bx + bw - 45, y: 140, width: 96, height: 12, fill: '#cfdaea' }));
        svg.appendChild(el('rect', { x: bx + bw + 51, y: 104, width: 11, height: 84, rx: 4, fill: '#8fa2bd' }));

        if (state.drawn) {
            if (state.filtered) {
                PARTICLES.forEach(function (p, i) {
                    svg.appendChild(el('circle', { cx: mx - 15, cy: 124 + (i % 8) * 7, r: p.r, fill: '#d9366b' }));
                });
                svg.appendChild(el('text', { x: 420, y: 206, 'text-anchor': 'middle', class: 'sx-svg-ok' }, 'Clean medication in the barrel'));
            } else {
                PARTICLES.forEach(function (p, i) {
                    svg.appendChild(el('circle', { cx: bx + 26 + (i * 24), cy: 130 + ((i % 3) * 16), r: p.r, fill: '#d9366b' }));
                });
                svg.appendChild(el('text', { x: 420, y: 206, 'text-anchor': 'middle', class: 'sx-svg-warn' }, 'Fragments carried through to the patient'));
            }
        }

        out.innerHTML =
            '<div><span>Device</span><strong>' + (isNeedle ? 'Filter needle' : 'Filter syringe') + '</strong></div>' +
            '<div><span>Filtration</span><strong>' + (state.filtered ? '5 micron' : 'None') + '</strong></div>' +
            '<div><span>Particles blocked</span><strong>' + (state.drawn ? (state.filtered ? PARTICLES.length : 0) : '-') + ' of ' + PARTICLES.length + '</strong></div>' +
            '<div><span>Sizes</span><strong>' + (isNeedle ? '18G' : '1 - 50 mL') + '</strong></div>';

        if (!state.drawn) {
            note.textContent = 'Snapping a glass ampoule sheds microscopic glass and rubber fragments into the medication. Press Draw to see what happens next.';
        } else if (state.filtered) {
            note.textContent = isNeedle
                ? 'The filter needle traps the fragments at the membrane. It is a draw-up device only, removed and replaced with a normal needle before the injection is given.'
                : 'The 5 micron membrane holds back glass, rubber and other particulates larger than 5 microns, so only clean medication enters the barrel.';
        } else {
            note.textContent = 'Without filtration the fragments travel with the dose into the patient. This is the risk that filter syringes and filter needles exist to remove.';
        }
    }

    root.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-sx-set]');
        if (btn && root.contains(btn)) {
            var key = btn.getAttribute('data-sx-set'), val = btn.getAttribute('data-sx-value');
            if (key === 'filtered') state.filtered = (val === 'yes');
            if (key === 'device') state.device = val;
            var group = root.querySelectorAll('[data-sx-set="' + key + '"]');
            for (var i = 0; i < group.length; i++) {
                var on = group[i] === btn;
                group[i].classList.toggle('is-active', on);
                group[i].setAttribute('aria-pressed', on ? 'true' : 'false');
            }
            state.drawn = false;
            runBtn.textContent = 'Draw the medication';
            draw();
        }
        if (e.target.closest('[data-sx-run]')) {
            state.drawn = !state.drawn;
            runBtn.textContent = state.drawn ? 'Reset' : 'Draw the medication';
            draw();
        }
    });

    draw();
})();
