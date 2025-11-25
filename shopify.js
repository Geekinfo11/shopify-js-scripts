(function() {
    const GCLID_KEY = 'gclid_value';

    // 1. Get gclid from URL
    function getGclidFromUrl() {
        const params = new URLSearchParams(window.location.search);
        return params.get('gclid');
    }

    // 2. Save gclid to localStorage for persistence
    function saveGclid(gclid) {
        if (gclid) {
            localStorage.setItem(GCLID_KEY, gclid);
        }
    }

    function getSavedGclid() {
        return localStorage.getItem(GCLID_KEY);
    }

    // 3. Inject gclid into Shopify cart attributes
    function attachGclidToCart(gclid) {
        if (!gclid) return;

        fetch('/cart/update.js', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                attributes: {
                    gclid: gclid
                }
            })
        });
    }

    // EXECUTION
    console.log('tracking started ...');
    const gclidFromUrl = getGclidFromUrl();

    if (gclidFromUrl) {
        saveGclid(gclidFromUrl);
        attachGclidToCart(gclidFromUrl);
    } else {
        const storedGclid = getSavedGclid();
        if (storedGclid) {
            attachGclidToCart(storedGclid);
        }
    }

})();
