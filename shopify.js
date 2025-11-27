(function () {
    const GCLID_KEY = 'gclid_value';
    // Your backend endpoint
    const BEACON_URL = 'https://76337edf99d7.ngrok-free.app/api/tracking/beacon'; 

    function getGclidFromUrl() {
        return new URLSearchParams(window.location.search).get('gclid');
    }

    function saveGclid(gclid) {
        if (gclid) localStorage.setItem(GCLID_KEY, gclid);
    }

    function getSavedGclid() {
        return localStorage.getItem(GCLID_KEY);
    }

    // 1. Get the Shopify Cart Token (The "Bridge")
    // This works even if the cart is empty.
    async function getShopifyCartToken() {
        try {
            const response = await fetch('/cart.js');
            const data = await response.json();
            return data.token;
        } catch (e) {
            console.error('SaaS Tracker: Could not fetch cart token', e);
            return null;
        }
    }

    // 2. Send the Map to your Backend
    function sendBeacon(gclid, cartToken) {
        if (!gclid || !cartToken) return;

        // Use sendBeacon if available (more reliable on page unload)
        const payload = JSON.stringify({
            shop_domain: window.Shopify ? window.Shopify.shop : window.location.hostname,
            gclid: gclid,
            cart_token: cartToken
        });

        const blob = new Blob([payload], { type: 'application/json' });
        
        // Try Beacon API first (doesn't block main thread, works if tab closes)
        if (navigator.sendBeacon) {
            navigator.sendBeacon(BEACON_URL, blob);
        } else {
            // Fallback for older browsers
            fetch(BEACON_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: payload,
                keepalive: true
            });
        }
    }

    async function init() {
        let gclid = getGclidFromUrl();
        
        if (gclid) {
            saveGclid(gclid);
        } else {
            gclid = getSavedGclid();
        }

        if (gclid) {
            const token = await getShopifyCartToken();
            // Send immediately so we capture it before they click "Buy Now"
            sendBeacon(gclid, token);
        }
    }

    // Run on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
