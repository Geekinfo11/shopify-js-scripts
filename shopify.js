(function () {
    const GCLID_KEY = 'gclid_value';
    // Your backend endpoint for server-side GCLID/Cart Token mapping
    const BEACON_URL = 'https://76337edf99d7.ngrok-free.app/api/tracking/beacon'; 

    /**
     * Retrieves the GCLID from the URL query parameters.
     */
    function getGclidFromUrl() {
        return new URLSearchParams(window.location.search).get('gclid');
    }

    /**
     * Saves the GCLID to localStorage for persistence across pages/sessions.
     */
    function saveGclid(gclid) {
        if (gclid) localStorage.setItem(GCLID_KEY, gclid);
    }

    /**
     * Retrieves the stored GCLID from localStorage.
     */
    function getSavedGclid() {
        return localStorage.getItem(GCLID_KEY);
    }

    /**
     * Fetches the Shopify Cart Token (used as a session identifier).
     */
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

    /**
     * ----------------------------------------------------
     * SCENARIO 2 LOGIC: Inject GCLID into Cart Attributes
     * This prepares the GCLID for "Add to Cart" checkout paths.
     * ----------------------------------------------------
     * Uses the Shopify Cart API to update the cart with the GCLID as a note_attribute.
     */
    async function injectGclidToCart(gclid) {
        // Prepare the data payload to update the cart notes
        const updatePayload = {
            note: {
                gclid: gclid
            },
            // Note: Shopify typically uses the /cart/update.js endpoint for this kind of attribute injection.
        };

        try {
            const response = await fetch('/cart/update.js', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(updatePayload)
            });
            
            if (response.ok) {
                console.log('SaaS Tracker: GCLID successfully injected into cart attributes.');
            } else {
                console.warn('SaaS Tracker: Failed to inject GCLID into cart attributes.');
            }
        } catch (e) {
            console.error('SaaS Tracker: Error during cart update for GCLID injection:', e);
        }
    }


    /**
     * ----------------------------------------------------
     * SCENARIO 1 LOGIC: Send GCLID/Cart Token Map (Beacon)
     * This prepares the GCLID for "Buy Now" checkout paths.
     * ----------------------------------------------------
     * Sends the GCLID-to-Cart-Token mapping to your backend for server-side matching.
     */
    function sendBeacon(gclid, cartToken) {
        if (!gclid || !cartToken) return;

        const payload = JSON.stringify({
            shop_domain: window.Shopify ? window.Shopify.shop : window.location.hostname,
            gclid: gclid,
            cart_token: cartToken
        });

        const blob = new Blob([payload], { type: 'application/json' });
        
        // Prefer sendBeacon for reliable, non-blocking transmission
        if (navigator.sendBeacon) {
            console.log('SaaS Tracker: Sending GCLID/Token beacon via navigator.sendBeacon.');
            navigator.sendBeacon(BEACON_URL, blob);
        } else {
            // Fallback using non-blocking fetch with keepalive
            console.log('SaaS Tracker: Sending GCLID/Token beacon via fetch fallback.');
            fetch(BEACON_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: payload,
                keepalive: true
            });
        }
    }

    /**
     * Main initialization function
     */
    async function init() {
        let gclid = getGclidFromUrl();
        
        // 1. Check URL for GCLID (if found, save it)
        if (gclid) {
            saveGclid(gclid);
        } else {
            // 2. If not in URL, load the saved GCLID
            gclid = getSavedGclid();
        }

        if (gclid) {
            // Both scenarios require the GCLID to be present:
            
            // --- SCENARIO 2 PREPARATION (Add to Cart) ---
            // Inject GCLID into the cart notes immediately. This covers 
            // the traditional checkout flow and makes the GCLID available 
            // in the order's note_attributes field.
            await injectGclidToCart(gclid);

            // --- SCENARIO 1 PREPARATION (Buy Now / Direct) ---
            // Fetch the current Cart Token and send the mapping to the backend.
            // This is the fallback for when note_attributes aren't carried through 
            // a direct checkout flow (i.e., when they skip the cart page).
            const token = await getShopifyCartToken();
            sendBeacon(gclid, token);
        }
    }

    // Run initialization logic after the DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
