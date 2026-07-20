(function () {
    'use strict';

    var nav = document.querySelector('.learn-nav');
    if (!nav) return;

    var links = Array.prototype.slice.call(nav.querySelectorAll('.learn-nav__link'));
    if (!links.length) return;

    var sections = links
        .map(function (link) {
            var id = link.getAttribute('href');
            if (!id || id.charAt(0) !== '#') return null;
            var el = document.querySelector(id);
            return el ? { link: link, el: el } : null;
        })
        .filter(Boolean);

    function setCurrent(entry) {
        links.forEach(function (link) {
            link.classList.toggle('is-current', link === entry.link);
        });
    }

    // Highlight the section occupying the band just below the sticky bar.
    var spy = new IntersectionObserver(
        function (entries) {
            var visible = entries
                .filter(function (e) { return e.isIntersecting; })
                .sort(function (a, b) { return a.boundingClientRect.top - b.boundingClientRect.top; });
            if (!visible.length) return;
            var match = sections.filter(function (s) { return s.el === visible[0].target; })[0];
            if (match) setCurrent(match);
        },
        { rootMargin: '-72px 0px -62% 0px', threshold: 0 }
    );

    sections.forEach(function (s) { spy.observe(s.el); });

    // Shadow the bar only once it has actually stuck. The sentinel sits directly
    // above the bar in normal flow; the negative top margin matches the sticky
    // offset, so it stops intersecting exactly when the bar pins.
    var stickyTop = parseInt(window.getComputedStyle(nav).top, 10) || 0;
    var sentinel = document.createElement('div');
    sentinel.setAttribute('aria-hidden', 'true');
    sentinel.style.cssText = 'height:1px;width:100%;';
    nav.parentNode.insertBefore(sentinel, nav);

    new IntersectionObserver(
        function (entries) {
            nav.classList.toggle('is-stuck', !entries[0].isIntersecting);
        },
        { rootMargin: '-' + (stickyTop + 1) + 'px 0px 0px 0px', threshold: 0 }
    ).observe(sentinel);
})();
