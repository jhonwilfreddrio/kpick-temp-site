/* PhilMed 2026 expo mode — the HCP exhibitor zone bans selling and quotations,
   so during the show window every quotation CTA is hidden and a compliance
   banner is shown instead. Outside the window this file is inert, so the site
   restores itself without a redeploy. Window starts the day before opening to
   cover booth setup and organizer walkthroughs. */
(function () {
    var START = Date.parse('2026-08-17T04:00:00Z'); /* Aug 17 12:00 PHT */
    var END = Date.parse('2026-08-21T15:59:59Z');   /* Aug 21 23:59 PHT */
    var now = Date.now();
    if (!(now >= START && now <= END)) { return; }

    var DISMISS_KEY = 'kpick-expo-banner-dismissed';

    function storageGet(key) {
        try { return window.sessionStorage.getItem(key); } catch (e) { return null; }
    }
    function storageSet(key, value) {
        try { window.sessionStorage.setItem(key, value); } catch (e) {}
    }

    function isRequestPage() {
        return /request\.htm$/i.test(window.location.pathname);
    }

    function hideQuoteCtas() {
        var i;
        var navItems = document.querySelectorAll('li.generatePO');
        for (i = 0; i < navItems.length; i++) {
            navItems[i].style.display = 'none';
        }
        var ctas = document.querySelectorAll(
            'a[href="request.htm"].brand-cta__btn, a[href="request.htm"].dashboardarea__button'
        );
        for (i = 0; i < ctas.length; i++) {
            ctas[i].style.display = 'none';
        }
    }

    function buildBanner(onRequestPage) {
        var banner = document.createElement('div');
        banner.id = 'kpick-expo-banner';
        banner.setAttribute('role', 'note');
        banner.style.cssText =
            'background:#0B3D91;color:#fff;font-size:14px;line-height:1.5;' +
            'padding:10px 16px;width:100%;box-sizing:border-box;text-align:center;' +
            'position:relative;z-index:9999;';

        var text = document.createElement('span');
        text.textContent =
            "We're exhibiting at PhilMed 2026 · Aug 18–21 · SMX Manila. " +
            'In keeping with exhibit guidelines, quotations are handled by our ' +
            'office after the show. ';
        if (onRequestPage) {
            text.textContent +=
                'Existing customers may continue to use this quotation tool as usual. ';
        }
        banner.appendChild(text);

        var link = document.createElement('a');
        link.href = 'contact.htm';
        link.textContent = 'Contact us';
        link.style.cssText = 'color:#fff;text-decoration:underline;font-weight:700;';
        banner.appendChild(link);

        if (!onRequestPage) {
            var dismiss = document.createElement('button');
            dismiss.type = 'button';
            dismiss.setAttribute('aria-label', 'Dismiss notice');
            dismiss.innerHTML = '&times;';
            dismiss.style.cssText =
                'position:absolute;right:8px;top:50%;transform:translateY(-50%);' +
                'background:none;border:0;color:#fff;font-size:20px;cursor:pointer;' +
                'padding:4px 8px;';
            dismiss.addEventListener('click', function () {
                storageSet(DISMISS_KEY, '1');
                if (banner.parentNode) { banner.parentNode.removeChild(banner); }
            });
            banner.appendChild(dismiss);
        }
        return banner;
    }

    function init() {
        if (!document.body) { return; }
        hideQuoteCtas();
        var onRequestPage = isRequestPage();
        /* The request.htm banner is not dismissible: it is the only compliance
           notice on the page that keeps serving regular customers. */
        if (onRequestPage || storageGet(DISMISS_KEY) !== '1') {
            document.body.insertBefore(buildBanner(onRequestPage), document.body.firstChild);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
