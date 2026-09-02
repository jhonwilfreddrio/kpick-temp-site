/* ==========================================================================
   Brand films — ambient spotlight loops + a seekable modal player.

   Two layers, deliberately separate:

   1. Ambient layer. Each spotlight shows a short silent loop (46-152 KB)
      instead of a still. It is NOT marked autoplay in the markup — an
      IntersectionObserver starts it when the card scrolls into view and
      pauses it when it leaves, so an idle tab costs nothing and phones
      don't burn battery decoding video nobody is looking at. Sources are
      attached lazily for the same reason: nothing is fetched until the
      card is near the viewport.

   2. Player layer. Clicking the card opens the full manufacturer film with
      sound and native controls, plus chapter chips so a viewer can jump
      straight back to a timestamp they care about. The heavy file (2.1 MB
      Sungshim) is only requested on that click, so the
      homepage never pays for it. Films are encoded +faststart, so
      seeking works while the file is still downloading.

   prefers-reduced-motion is honoured: the ambient layer stays a poster
   frame and the film is click-to-play only.
   ========================================================================== */
(function () {
    'use strict';

    var FILMS = {
        sungshim: {
            title: 'Sungshim Insulin Syringe — manufacturer film',
            src: 'video/sungshim-film.mp4',
            poster: 'video/sungshim-poster.jpg',
            chapters: [
                { t: 0,    label: 'Product overview' },
                { t: 6.5,  label: 'Korean manufacturing' },
                { t: 14.5, label: 'Sterilisation & QC' },
                { t: 23.5, label: 'Smooth in every injection' }
            ]
        }
    };

    var reduceMotion = window.matchMedia
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : { matches: false };

    function fmt(seconds) {
        var s = Math.max(0, Math.round(seconds));
        return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
    }

    /* ---------------------------------------------------------------
       Ambient loops
       --------------------------------------------------------------- */
    var loops = [].slice.call(document.querySelectorAll('.brand-film__loop'));

    function attachSource(video) {
        // data-src -> src, once. Keeps the loop out of the initial page load.
        var pending = video.getAttribute('data-src');
        if (!pending) return;
        video.removeAttribute('data-src');
        video.setAttribute('src', pending);
        video.load();
    }

    function playLoop(video) {
        attachSource(video);
        var p = video.play();
        // Autoplay can still be refused (iOS Low Power Mode, data saver).
        // The poster stays visible and the play badge still works, so we
        // only need to make sure we don't throw.
        if (p && typeof p.catch === 'function') {
            p.catch(function () {
                video.closest('.brand-film').classList.add('brand-film--static');
            });
        }
    }

    var io = null;

    if (loops.length) {
        if (reduceMotion.matches) {
            loops.forEach(function (v) {
                v.closest('.brand-film').classList.add('brand-film--static');
            });
        } else if ('IntersectionObserver' in window) {
            io = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    var video = entry.target;
                    // Remembered so closing the modal can resume only the
                    // loops actually on screen, not every one on the page.
                    video.dataset.filmVisible = entry.isIntersecting ? 'true' : 'false';
                    if (video.dataset.filmSuspended === 'true') return;
                    if (entry.isIntersecting) playLoop(video);
                    else if (!video.paused) video.pause();
                });
            }, { rootMargin: '200px 0px', threshold: 0.01 });
            loops.forEach(function (v) { io.observe(v); });
        } else {
            loops.forEach(playLoop);
        }
    }

    /* ---------------------------------------------------------------
       Modal player
       --------------------------------------------------------------- */
    var modal = document.getElementById('film-modal');
    if (!modal) return;

    var panel     = modal.querySelector('.film-modal__panel');
    var titleEl   = modal.querySelector('.film-modal__title');
    var video     = modal.querySelector('.film-modal__video');
    var chapterEl = modal.querySelector('.film-modal__chapter-list');
    var closeBtn  = modal.querySelector('.film-modal__close');

    var lastTrigger = null;
    var current = null;
    var chapterBtns = [];

    /* Locking body scroll removes the scrollbar, which shifts the whole page
       left by its width. Pad it back so opening the player doesn't make the
       layout jump. */
    function lockScroll() {
        var gutter = window.innerWidth - document.documentElement.clientWidth;
        if (gutter > 0) document.body.style.paddingRight = gutter + 'px';
        document.body.classList.add('film-modal-open');
    }

    function unlockScroll() {
        document.body.classList.remove('film-modal-open');
        document.body.style.paddingRight = '';
    }

    function playAt(seconds) {
        function seekAndPlay() {
            video.currentTime = seconds;
            var p = video.play();
            if (p && typeof p.catch === 'function') { p.catch(function () {}); }
        }
        if (video.readyState >= 1) seekAndPlay();
        else video.addEventListener('loadedmetadata', seekAndPlay, { once: true });
    }

    /* Resume from measured geometry rather than the observer's cached flag.
       The scroll lock above makes the loops report as non-intersecting while
       the modal is up, and the browser does not reliably deliver a second
       callback once the page is restored — so the cached flag can be stale
       exactly when we need it. Re-observing re-arms it for later scrolling. */
    function resumeLoops() {
        loops.forEach(function (v) {
            delete v.dataset.filmSuspended;
            if (reduceMotion.matches) return;
            var r = v.getBoundingClientRect();
            var onScreen = r.top < window.innerHeight + 200 && r.bottom > -200;
            v.dataset.filmVisible = onScreen ? 'true' : 'false';
            if (onScreen) playLoop(v);
            if (io) { io.unobserve(v); io.observe(v); }
        });
    }

    function buildChapters(film) {
        chapterEl.innerHTML = '';
        chapterBtns = film.chapters.map(function (ch, i) {
            var b = document.createElement('button');
            b.type = 'button';
            b.className = 'film-chapter';
            b.dataset.time = String(ch.t);
            b.innerHTML = '<span class="film-chapter__t">' + fmt(ch.t) + '</span>' +
                          '<span class="film-chapter__label">' + ch.label + '</span>';
            b.addEventListener('click', function () {
                playAt(ch.t);
                markActive(i);
            });
            chapterEl.appendChild(b);
            return b;
        });
    }

    function markActive(index) {
        chapterBtns.forEach(function (b, i) {
            b.classList.toggle('film-chapter--active', i === index);
            if (i === index) b.setAttribute('aria-current', 'true');
            else b.removeAttribute('aria-current');
        });
    }

    function syncChapter() {
        if (!current) return;
        var t = video.currentTime;
        var idx = 0;
        for (var i = 0; i < current.chapters.length; i++) {
            if (t + 0.25 >= current.chapters[i].t) idx = i;
        }
        markActive(idx);
    }

    function open(key, trigger) {
        var film = FILMS[key];
        if (!film) return;

        current = film;
        lastTrigger = trigger || null;

        titleEl.textContent = film.title;
        video.poster = film.poster;
        video.src = film.src;
        buildChapters(film);
        markActive(0);

        // Ambient loops are decoding the same codec — stop them while the
        // real film plays, and flag them so the observer doesn't restart them.
        loops.forEach(function (v) {
            v.dataset.filmSuspended = 'true';
            if (!v.paused) v.pause();
        });

        modal.hidden = false;
        lockScroll();
        // Click came from the user, so sound is permitted here.
        video.currentTime = 0;
        var p = video.play();
        if (p && typeof p.catch === 'function') { p.catch(function () {}); }
        closeBtn.focus();
    }

    function close() {
        if (modal.hidden) return;
        video.pause();
        video.removeAttribute('src');
        video.load();                     // drop the buffer
        modal.hidden = true;
        unlockScroll();
        current = null;

        resumeLoops();

        if (lastTrigger) { lastTrigger.focus(); lastTrigger = null; }
    }

    document.querySelectorAll('[data-film]').forEach(function (card) {
        var key = card.getAttribute('data-film');
        var trigger = card.querySelector('.brand-film__trigger');
        if (!trigger) return;
        trigger.addEventListener('click', function () { open(key, trigger); });
    });

    modal.querySelectorAll('[data-film-close]').forEach(function (el) {
        el.addEventListener('click', close);
    });

    video.addEventListener('timeupdate', syncChapter);
    video.addEventListener('seeked', syncChapter);

    document.addEventListener('keydown', function (e) {
        if (modal.hidden) return;
        if (e.key === 'Escape') { close(); return; }
        // Keep tab focus inside the dialog.
        if (e.key !== 'Tab') return;
        var focusables = panel.querySelectorAll('button, [href], video[controls]');
        if (!focusables.length) return;
        var first = focusables[0];
        var last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault(); last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault(); first.focus();
        }
    });
})();
