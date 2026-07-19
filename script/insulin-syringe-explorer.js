/* Sungshim insulin syringe explorer
   Interactive spec showcase. All figures sourced from Sungshim Medical
   (ss-medical.co.kr/em24.php). Needle outer diameters are ISO 9626 nominal. */
(function () {
    'use strict';

    var root = document.querySelector('[data-syringe-explorer]');
    if (!root) return;

    var CAPACITIES = {
        '1': { label: '1 mL/cc', units: 100, step: 2, majorEvery: 5 },
        '0.5': { label: '0.5 mL/cc', units: 50, step: 1, majorEvery: 5 }
    };

    /* od = outer diameter in mm (ISO 9626 nominal) */
    var NEEDLES = [
        { id: '29-13', gauge: 29, len: 13, od: 0.337, note: 'Thicker wall, faster flow. Suited to larger doses and users who prefer a firmer needle.' },
        { id: '30-13', gauge: 30, len: 13, od: 0.312, note: 'Longer reach with a finer gauge. A common step down from 29G.' },
        { id: '30-8',  gauge: 30, len: 8,  od: 0.312, note: 'Shorter needle reduces the chance of reaching muscle on slimmer patients.' },
        { id: '31-8',  gauge: 31, len: 8,  od: 0.261, note: 'Fine gauge, short length. A frequent choice for daily self-injection.' },
        { id: '32-8',  gauge: 32, len: 8,  od: 0.235, note: 'The finest gauge in the range. Lowest penetration force of the five.' }
    ];

    var state = { capacity: '1', needle: '32-8', dose: 30 };

    var svg = root.querySelector('[data-sx-svg]');
    var doseInput = root.querySelector('[data-sx-dose]');
    var doseOut = root.querySelector('[data-sx-dose-out]');
    var readout = root.querySelector('[data-sx-readout]');
    var noteEl = root.querySelector('[data-sx-note]');

    var NS = 'http://www.w3.org/2000/svg';
    function el(name, attrs) {
        var n = document.createElementNS(NS, name);
        for (var k in attrs) if (attrs.hasOwnProperty(k)) n.setAttribute(k, attrs[k]);
        return n;
    }

    function needle() {
        for (var i = 0; i < NEEDLES.length; i++) {
            if (NEEDLES[i].id === state.needle) return NEEDLES[i];
        }
        return NEEDLES[0];
    }

    function draw() {
        var cap = CAPACITIES[state.capacity];
        var nd = needle();

        while (svg.firstChild) svg.removeChild(svg.firstChild);

        var MM = 5.4;                      /* px per mm, needle length */
        var OD = 26;                       /* px per mm, needle thickness (magnified to stay visible) */
        var barrelX = 250, barrelW = 470, barrelY = 96, barrelH = 60;
        var needleLen = nd.len * MM;
        var needleTh = Math.max(2.4, nd.od * OD);
        var hubX = barrelX - 54;
        var tipX = hubX - needleLen;

        /* ---- needle ---- */
        svg.appendChild(el('rect', {
            x: tipX, y: 126 - needleTh / 2, width: needleLen, height: needleTh,
            fill: '#8fa2bd', rx: needleTh / 2
        }));
        svg.appendChild(el('polygon', {
            points: (tipX - 9) + ',126 ' + tipX + ',' + (126 - needleTh / 2) + ' ' + tipX + ',' + (126 + needleTh / 2),
            fill: '#6d81a0'
        }));

        /* ---- hub ---- */
        svg.appendChild(el('polygon', {
            points: hubX + ',110 ' + barrelX + ',' + barrelY + ' ' + barrelX + ',' + (barrelY + barrelH) + ' ' + hubX + ',142',
            fill: '#0f4ca3', opacity: '.9'
        }));

        /* ---- barrel ---- */
        svg.appendChild(el('rect', {
            x: barrelX, y: barrelY, width: barrelW, height: barrelH,
            rx: 7, fill: '#f4f9ff', stroke: '#0f4ca3', 'stroke-width': '2'
        }));

        /* ---- fill ---- */
        var frac = state.dose / cap.units;
        var fillW = barrelW * frac;
        if (fillW > 0) {
            svg.appendChild(el('rect', {
                x: barrelX, y: barrelY + 3, width: fillW, height: barrelH - 6,
                rx: 4, fill: '#bcd9fb'
            }));
        }

        /* ---- graduations, labelled in UNITS ---- */
        var ticks = cap.units / cap.step;
        for (var i = 0; i <= ticks; i++) {
            var u = i * cap.step;
            var x = barrelX + (barrelW * (u / cap.units));
            var major = (u % (cap.step * cap.majorEvery)) === 0;
            svg.appendChild(el('line', {
                x1: x, y1: barrelY + 2, x2: x, y2: barrelY + (major ? 18 : 11),
                stroke: '#0f4ca3', 'stroke-width': major ? 1.6 : 1, opacity: major ? '.95' : '.5'
            }));
            if (major && u % (cap.step * cap.majorEvery * 2) === 0 && u !== 0) {
                var t = el('text', {
                    x: x, y: barrelY - 7, 'text-anchor': 'middle',
                    class: 'sx-svg-tick'
                });
                t.textContent = u;
                svg.appendChild(t);
            }
        }

        /* ---- plunger ---- */
        var pX = barrelX + fillW;
        svg.appendChild(el('rect', { x: pX, y: barrelY + 1, width: 13, height: barrelH - 2, rx: 3, fill: '#37415a' }));
        svg.appendChild(el('rect', { x: pX + 13, y: 118, width: (barrelX + barrelW) - pX - 13 + 40, height: 16, fill: '#cfdaea' }));
        svg.appendChild(el('rect', { x: barrelX + barrelW + 40, y: 84, width: 12, height: 84, rx: 4, fill: '#8fa2bd' }));
        svg.appendChild(el('rect', { x: barrelX + barrelW - 4, y: 74, width: 10, height: 104, rx: 3, fill: '#0f4ca3', opacity: '.65' }));

        /* ---- needle length dimension line ---- */
        svg.appendChild(el('line', {
            x1: tipX, y1: 176, x2: hubX, y2: 176, stroke: '#6d81a0', 'stroke-width': '1',
            'stroke-dasharray': '3 3'
        }));
        var lenLbl = el('text', { x: (tipX + hubX) / 2, y: 194, 'text-anchor': 'middle', class: 'sx-svg-dim' });
        lenLbl.textContent = nd.len + ' mm';
        svg.appendChild(lenLbl);

        /* ---- units caption ---- */
        var capLbl = el('text', { x: barrelX + barrelW / 2, y: 186, 'text-anchor': 'middle', class: 'sx-svg-dim' });
        capLbl.textContent = cap.label + ' — graduated in ' + cap.units + ' insulin units';
        svg.appendChild(capLbl);

        /* ---- gauge magnifier: true relative bore ---- */
        var gx = 96, gy = 52;
        svg.appendChild(el('circle', { cx: gx, cy: gy, r: 30, fill: '#fff', stroke: '#d5deea', 'stroke-width': '1.5' }));
        svg.appendChild(el('circle', { cx: gx, cy: gy, r: nd.od * 42, fill: '#0f4ca3', opacity: '.85' }));
        var gl = el('text', { x: gx, y: gy + 50, 'text-anchor': 'middle', class: 'sx-svg-dim' });
        gl.textContent = nd.gauge + 'G · ' + nd.od.toFixed(3) + ' mm';
        svg.appendChild(gl);
        var gc = el('text', { x: gx, y: gy - 40, 'text-anchor': 'middle', class: 'sx-svg-cap' });
        gc.textContent = 'ACTUAL THICKNESS';
        svg.appendChild(gc);
    }

    function syncReadout() {
        var cap = CAPACITIES[state.capacity];
        var nd = needle();
        readout.innerHTML =
            '<div><span>Dose</span><strong>' + state.dose + ' units</strong></div>' +
            '<div><span>Volume</span><strong>' + (state.dose / 100).toFixed(2) + ' mL</strong></div>' +
            '<div><span>Gauge</span><strong>' + nd.gauge + 'G</strong></div>' +
            '<div><span>Needle length</span><strong>' + nd.len + ' mm</strong></div>' +
            '<div><span>Barrel</span><strong>' + cap.label + '</strong></div>' +
            '<div><span>Packing</span><strong>100 / 3,600 pcs</strong></div>';
        noteEl.textContent = nd.note;
    }

    function render() {
        draw();
        syncReadout();
    }

    /* ---- controls ---- */
    root.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-sx-set]');
        if (!btn) return;
        var key = btn.getAttribute('data-sx-set');
        var val = btn.getAttribute('data-sx-value');

        if (key === 'capacity') {
            state.capacity = val;
            var max = CAPACITIES[val].units;
            if (state.dose > max) state.dose = max;
            doseInput.max = max;
            doseInput.value = state.dose;
            doseOut.textContent = state.dose;
        } else if (key === 'needle') {
            state.needle = val;
        }

        var group = btn.parentNode.querySelectorAll('[data-sx-set="' + key + '"]');
        for (var i = 0; i < group.length; i++) {
            var on = group[i] === btn;
            group[i].classList.toggle('is-active', on);
            group[i].setAttribute('aria-pressed', on ? 'true' : 'false');
        }
        render();
    });

    doseInput.addEventListener('input', function () {
        state.dose = parseInt(doseInput.value, 10);
        doseOut.textContent = state.dose;
        render();
    });

    doseInput.max = CAPACITIES[state.capacity].units;
    doseInput.value = state.dose;
    doseOut.textContent = state.dose;
    render();
})();
