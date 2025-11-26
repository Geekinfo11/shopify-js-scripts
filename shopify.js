(function () {
    const GCLID_KEY = 'gclid_value';
    const COOKIE_NAME = 'gclid';

    // Get gclid from URL query
    function getGclidFromUrl() {
        return new URLSearchParams(window.location.search).get('gclid');
    }

    // Save gclid in localStorage
    function saveGclid(gclid) {
        if (!gclid) return;
        localStorage.setItem(GCLID_KEY, gclid);
        // Save as cookie too (for server-side access)
        document.cookie = `${COOKIE_NAME}=${gclid}; path=/; max-age=${60*60*24*30}`;
    }

    // Get gclid from localStorage
    function getSavedGclid() {
        return localStorage.getItem(GCLID_KEY);
    }

    // Attach gclid to cart attributes if cart exists
    function attachGclidToCart(gclid) {
        if (!gclid) return;

        fetch('/cart/update.js', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                attributes: { gclid: gclid }
            })
        }).catch(console.error);
    }

    // Attempt to attach hidden input on checkout forms (best effort)
    function ensureGclidOnCheckout(gclid) {
        if (!gclid) return;

        document.addEventListener('submit', function (e) {
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
