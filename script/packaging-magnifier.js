document.addEventListener("DOMContentLoaded", function () {
    var magnifiers = document.querySelectorAll("[data-magnify]");

    if (!magnifiers.length) {
        return;
    }

    var preview = document.createElement("div");
    preview.className = "packaging-zoom-preview";
    preview.setAttribute("aria-hidden", "true");
    document.body.appendChild(preview);

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function positionPreview(event) {
        var gap = 18;
        var previewWidth = preview.offsetWidth || 360;
        var previewHeight = preview.offsetHeight || 260;
        var left = event.clientX + gap;
        var top = event.clientY - previewHeight / 2;

        if (left + previewWidth > window.innerWidth - gap) {
            left = event.clientX - previewWidth - gap;
        }

        preview.style.left = clamp(left, gap, window.innerWidth - previewWidth - gap) + "px";
        preview.style.top = clamp(top, gap, window.innerHeight - previewHeight - gap) + "px";
    }

    magnifiers.forEach(function (magnifier) {
        var image = magnifier.querySelector("img");

        if (!image) {
            return;
        }

        magnifier.addEventListener("pointerenter", function () {
            preview.style.backgroundImage = "url('" + image.currentSrc + "')";
            preview.classList.add("is-visible");
        });

        magnifier.addEventListener("pointermove", function (event) {
            var imageRect = image.getBoundingClientRect();
            var x = ((event.clientX - imageRect.left) / imageRect.width) * 100;
            var y = ((event.clientY - imageRect.top) / imageRect.height) * 100;
            var clampedX = clamp(x, 0, 100);
            var clampedY = clamp(y, 0, 100);

            preview.style.backgroundPosition = clampedX + "% " + clampedY + "%";
            positionPreview(event);
        });

        magnifier.addEventListener("pointerleave", function () {
            preview.classList.remove("is-visible");
        });
    });
});
