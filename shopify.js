(function () {
    
    const GCLID_KEY = 'gclid_value';
    const CONVERSION_URL = 'https://ab8a8470c017.ngrok-free.app/api/tracking/beacon';
    const SESSION_CONFIRMED_KEY = 'conversion_confirmed';

    function getGclidFromUrl() {
        return new URLSearchParams(window.location.search).get('gclid');
    }

    function saveGclid(gclid) {
        if (gclid) {
            localStorage.setItem(GCLID_KEY, gclid);
            console.log('Tracker: GCLID saved to localStorage.');
        }
    }

    function getSavedGclid() {
        return localStorage.getItem(GCLID_KEY);
    }

    function isThankYouPage() {
        return window.location.pathname.includes('/checkouts/') &&
            window.location.pathname.includes('/thank-you');
    }

    async function injectGclidToCart(gclid) {
        const updatePayload = {
            attributes: { gclid: gclid },
        };

        try {
            await fetch('/cart/update.js', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify(updatePayload),
            });
            console.log('Tracker (Storefront): GCLID injected into cart attributes.');
        } catch (e) {
            console.error('Tracker (Storefront): Error during cart update:', e);
        }
    }
   
    async function runStorefrontLogic() {
        const gclid = getGclidFromUrl();

        if (gclid) {
            console.log(`Tracker (Storefront): GCLID found in URL: ${gclid}`);

            saveGclid(gclid);
            
            await injectGclidToCart(gclid);

        } else {
            console.log('Tracker (Storefront): No GCLID found in URL. Skipping save/injection.');
        }
    }
 
    function getShopifyOrderId() {
        if (window.Shopify && window.Shopify.checkout && window.Shopify.checkout.order_id) {
            return window.Shopify.checkout.order_id;
        }

        const orderName = document.querySelector('h2.os-header__title')?.innerText;
        if (orderName && orderName.includes('#')) {
            return orderName.trim().replace('Thank you', '').trim();
        }

        return 'UNKNOWN_ORDER_ID';
    }

    function sendConversionBeacon(gclid, orderId) {
        const payload = JSON.stringify({
            shop_domain: window.Shopify ? window.Shopify.shop : window.location.hostname,
            gclid: gclid,
            order_id: orderId,
            timestamp: new Date().toISOString()
        });

        console.log('Tracker (Thank You): Sending FINAL conversion beacon.');

        if (navigator.sendBeacon) {
            navigator.sendBeacon(CONVERSION_URL, new Blob([payload], { type: 'application/json' }));
        } else {
            fetch(CONVERSION_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: payload,
                keepalive: true,
                credentials: 'omit',
            });
        }
    }

    function runThankYouLogic() {
        const gclid = getSavedGclid();
        const orderId = getShopifyOrderId();

        if (gclid && orderId !== 'UNKNOWN_ORDER_ID' && sessionStorage.getItem(SESSION_CONFIRMED_KEY) !== 'true') {

            console.log(`Tracker (Thank You): GCLID found: ${gclid}, Order ID: ${orderId}. Sending confirmation.`);

            sendConversionBeacon(gclid, orderId);

            localStorage.removeItem(GCLID_KEY);
            console.log('Tracker (Thank You): GCLID processed and removed from storage.');

            sessionStorage.setItem(SESSION_CONFIRMED_KEY, 'true');

        } else if (gclid && sessionStorage.getItem(SESSION_CONFIRMED_KEY) === 'true') {
            console.log('Tracker (Thank You): Conversion already confirmed in this session. Skipping beacon.');
        } else {
            console.log('Tracker (Thank You): GCLID or Order ID not available. Skipping conversion beacon.');
        }
    }

    async function init() {
        console.log('init called');
        if (isThankYouPage()) {
            console.log('isThankYouPage called');
            runThankYouLogic();
        } else {
            runStorefrontLogic();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
