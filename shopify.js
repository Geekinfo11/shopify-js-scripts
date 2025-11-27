(function () {
    const GCLID_KEY = 'gclid_value';
    // Your backend endpoint
    const BEACON_URL = 'https://76337edf99d7.ngrok-free.app/api/tracking/beacon'; 

    /** Utility Functions **/
    function getGclidFromUrl() {
        return new URLSearchParams(window.location.search).get('gclid');
    }

    function saveGclid(gclid) {
        if (gclid) localStorage.setItem(GCLID_KEY, gclid);
    }

    function getSavedGclid() {
        return localStorage.getItem(GCLID_KEY);
    }

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
    
    /** * SCENARIO 2 FIX: Inject GCLID into Cart ATTRIBUTES for 'Add to Cart' flow.
     * This resolves the "expected Hash to be a String: note" error.
     */
    async function injectGclidToCart(gclid) {
        // CORRECT PAYLOAD: Use 'attributes' (plural) for custom key/value data.
        const updatePayload = {
            attributes: { 
                gclid: gclid 
            },
        };

        try {
            await fetch('/cart/update.js', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(updatePayload)
            });
            console.log('SaaS Tracker: GCLID injected into cart attributes.');
        } catch (e) {
            console.error('SaaS Tracker: Error during cart update for GCLID injection:', e);
        }
    }


    /** SCENARIO 1 & FALLBACK: Send GCLID/Cart Token Map to Backend **/
    function sendBeacon(gclid, cartToken) {
        if (!gclid || !cartToken) {
            console.warn('SaaS Tracker: Beacon data missing (GCLID or Cart Token). Aborting send.');
            return;
        }

        const payload = JSON.stringify({
            shop_domain: window.Shopify ? window.Shopify.shop : window.location.hostname,
            gclid: gclid,
            cart_token: cartToken
        });

        console.log('SaaS Tracker: Sending GCLID/Token beacon via consolidated fetch.');
        
        fetch(BEACON_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
            keepalive: true,
        });
    }

    /** Main Initialization **/
    async function init() {
        let gclid = getGclidFromUrl();
        
        if (gclid) {
            saveGclid(gclid);
        } else {
            gclid = getSavedGclid();
        }

        if (gclid) {
            // 1. Inject GCLID into the cart attributes
            await injectGclidToCart(gclid);
            
            // 2. Send the immediate map to the backend for direct checkout fallback
            const token = await getShopifyCartToken();
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
