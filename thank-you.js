(function () {
    // --- Configuration ---
    const GCLID_KEY = 'gclid_value';
    // Use your final, secure endpoint
    const CONVERSION_URL = 'https://ab8a8470c017.ngrok-free.app/api/tracking/beacon';
    const SESSION_CONFIRMED_KEY = 'conversion_confirmed';

    // --- Utility Functions ---
    function getSavedGclid() {
        return localStorage.getItem(GCLID_KEY);
    }

    function getShopifyOrderId() {
        // 1. Preferred method: Use the global Shopify.checkout object
        if (window.Shopify && window.Shopify.checkout && window.Shopify.checkout.order_id) {
            return window.Shopify.checkout.order_id;
        }

        // 2. Fallback method: Attempt to scrape the order name from the header (less reliable)
        const orderNameElement = document.querySelector('h2.os-header__title');
        const orderNameText = orderNameElement ? orderNameElement.innerText : '';
        if (orderNameText && orderNameText.includes('#')) {
            // Example: "Thank you John. Your order #1234 has been placed."
            const match = orderNameText.match(/#(\d+)/);
            return match ? match[1] : 'UNKNOWN_ORDER_ID';
        }

        return 'UNKNOWN_ORDER_ID';
    }

    function sendConversionBeacon(gclid, orderId) {
        // Use the domain provided by Shopify for the most accurate tracking
        const shopDomain = window.Shopify ? window.Shopify.shop : window.location.hostname;

        const payload = JSON.stringify({
            shop_domain: shopDomain,
            gclid: gclid,
            order_id: orderId,
            timestamp: new Date().toISOString()
        });

        console.log('Tracker (Thank You): Sending FINAL conversion beacon.');

        fetch(CONVERSION_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
            keepalive: true,
        });
    }

    // --- Main Thank You Page Logic ---
    function runThankYouLogic() {
        console.log('Thank You Tracker: Initializing...');
        const gclid = getSavedGclid();
        const orderId = getShopifyOrderId();

        // Check if we have GCLID, a valid Order ID, and haven't confirmed in this session
        if (gclid && orderId !== 'UNKNOWN_ORDER_ID' && sessionStorage.getItem(SESSION_CONFIRMED_KEY) !== 'true') {

            console.log(`Tracker (Thank You): GCLID found: ${gclid}, Order ID: ${orderId}. Sending confirmation.`);

            sendConversionBeacon(gclid, orderId);

            // Clean up GCLID immediately after successful attempt
            localStorage.removeItem(GCLID_KEY);
            console.log('Tracker (Thank You): GCLID processed and removed from storage.');

            // Prevent double-firing on page refresh
            sessionStorage.setItem(SESSION_CONFIRMED_KEY, 'true');

        } else if (gclid && sessionStorage.getItem(SESSION_CONFIRMED_KEY) === 'true') {
            console.log('Tracker (Thank You): Conversion already confirmed in this session. Skipping beacon.');
        } else {
            console.log('Tracker (Thank You): GCLID or Order ID not available. Skipping conversion beacon.');
        }
    }

    // Initialize script immediately. No need for DOMContentLoaded checks here
    // because this script is injected in the Checkout settings, guaranteeing late execution.
    runThankYouLogic();
})();
