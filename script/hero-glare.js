/* Hero brand lockup: a glare that follows the pointer inside each card.
   Sets --gx/--gy (px, card-relative) for the ::after radial highlight.
   Pointer-only; touch and keyboard users get the plain hover/focus state. */
(function () {
    if (!window.matchMedia || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    var cards = document.querySelectorAll('.hero-brand');
    for (var i = 0; i < cards.length; i++) {
        (function (card) {
            var raf = 0, x = 0, y = 0;
            function paint() {
                raf = 0;
                card.style.setProperty('--gx', x + 'px');
                card.style.setProperty('--gy', y + 'px');
            }
            card.addEventListener('pointermove', function (e) {
                var r = card.getBoundingClientRect();
                x = e.clientX - r.left;
                y = e.clientY - r.top;
                if (!raf) raf = window.requestAnimationFrame(paint);
            });
            card.addEventListener('pointerleave', function () {
                card.style.removeProperty('--gx');
                card.style.removeProperty('--gy');
            });
        })(cards[i]);
    }
})();
