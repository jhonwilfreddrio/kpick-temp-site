const carousel = document.querySelector(".single-use-carousel");

if (carousel) {
    const viewport = carousel.querySelector(".single-use-carousel__viewport");
    const track = carousel.querySelector(".single-use-carousel__track");
    const cards = Array.from(carousel.querySelectorAll(".single-use-card"));
    const prevButton = carousel.querySelector(".single-use-carousel__nav--prev");
    const nextButton = carousel.querySelector(".single-use-carousel__nav--next");
    const dots = Array.from(carousel.querySelectorAll(".single-use-carousel__dots [role=\"tab\"]"));

    if (viewport && track && cards.length) {
        const prefersReducedMotion = () =>
            window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        const scrollBehavior = () => (prefersReducedMotion() ? "auto" : "smooth");

        /* offsetLeft/offsetWidth are layout values, immune to the scale()
           transform on inactive cards — getBoundingClientRect is not. */
        const getStep = () => {
            if (cards.length < 2) {
                return cards[0] ? cards[0].offsetWidth : 0;
            }

            return cards[1].offsetLeft - cards[0].offsetLeft;
        };

        const setActiveIndex = (index) => {
            cards.forEach((card, cardIndex) => {
                card.classList.toggle("is-active", cardIndex === index);
            });

            dots.forEach((dot, dotIndex) => {
                const isActive = dotIndex === index;

                dot.classList.toggle("is-active", isActive);
                dot.setAttribute("aria-selected", isActive ? "true" : "false");
            });
        };

        const scrollToIndex = (index) => {
            const card = cards[index];

            if (!card) {
                return;
            }

            card.scrollIntoView({ inline: "center", block: "nearest", behavior: scrollBehavior() });
        };

        const scrollByStep = (direction) => {
            viewport.scrollBy({ left: direction * getStep(), behavior: scrollBehavior() });
        };

        /* The first and last cards can only reach the snap center if spacer
           boxes fill half a viewport (minus the flex gap) on each side. */
        const setEdgePadding = () => {
            const gap = parseFloat(window.getComputedStyle(track).columnGap) || 0;
            const pad = Math.max(0, (viewport.clientWidth - cards[0].offsetWidth) / 2 - gap);

            track.style.setProperty("--edge-pad", `${pad}px`);
        };

        if (prevButton) {
            prevButton.addEventListener("click", () => scrollByStep(-1));
        }

        if (nextButton) {
            nextButton.addEventListener("click", () => scrollByStep(1));
        }

        viewport.addEventListener("keydown", (event) => {
            if (event.key === "ArrowLeft") {
                event.preventDefault();
                scrollByStep(-1);
            }

            if (event.key === "ArrowRight") {
                event.preventDefault();
                scrollByStep(1);
            }
        });

        dots.forEach((dot, index) => {
            dot.addEventListener("click", () => scrollToIndex(index));
        });

        /* With edge padding in place, snap positions sit at exact multiples of
           the card step, so the nearest index falls out of scrollLeft directly. */
        let scrollTickPending = false;

        const syncActiveFromScroll = () => {
            const step = getStep();

            if (step > 0) {
                const index = Math.min(cards.length - 1, Math.max(0, Math.round(viewport.scrollLeft / step)));

                setActiveIndex(index);
            }

            scrollTickPending = false;
        };

        viewport.addEventListener("scroll", () => {
            if (!scrollTickPending) {
                scrollTickPending = true;
                window.requestAnimationFrame(syncActiveFromScroll);
            }
        }, { passive: true });

        window.addEventListener("resize", () => {
            setEdgePadding();
            window.requestAnimationFrame(syncActiveFromScroll);
        });

        setEdgePadding();
        setActiveIndex(0);
    }
}
