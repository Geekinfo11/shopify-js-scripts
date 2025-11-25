(function () {
    const GCLID_KEY = 'gclid_value';

    function getGclidFromUrl() {
        return new URLSearchParams(window.location.search).get('gclid');
    }

    function saveGclid(gclid) {
        if (gclid) localStorage.setItem(GCLID_KEY, gclid);
    }

    function getSavedGclid() {
        return localStorage.getItem(GCLID_KEY);
    }

    function attachGclidToCart(gclid) {
        if (!gclid) return;

        fetch('/cart/update.js', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                attributes: {
                    gclid: gclid
                }
            })
        });
    }

    function ensureGclidOnCheckout(gclid) {
        if (!gclid) return;

        document.addEventListener('submit', function(e) {
            const form = e.target;
            if (form.action && form.action.includes('/checkout')) {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = 'attributes[gclid]';
                input.value = gclid;
                form.appendChild(input);
            }
        }, true);
    }

    const gclidFromUrl = getGclidFromUrl();

    if (gclidFromUrl) {
        saveGclid(gclidFromUrl);
        attachGclidToCart(gclidFromUrl);
        ensureGclidOnCheckout(gclidFromUrl);
    } else {
        const storedGclid = getSavedGclid();
        if (storedGclid) {
            attachGclidToCart(storedGclid);
            ensureGclidOnCheckout(storedGclid);
        }
    }
})();
