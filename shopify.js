(function () {
    // --- Configuration ---
    const GCLID_KEY = 'gclid_value';

    // --- Utility Functions ---
    function getGclidFromUrl() {
        return new URLSearchParams(window.location.search).get('gclid');
    }

    function saveGclid(gclid) {
        if (gclid) {
            // Save GCLID to local storage for retrieval on the Thank You page
            localStorage.setItem(GCLID_KEY, gclid);
            console.log('Tracker (Storefront): GCLID saved to localStorage.');
        }
    }

    async function injectGclidToCart(gclid) {
        // Send the GCLID to the cart attributes via cart update API
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

    // --- Main Storefront Logic ---
    async function init() {
        console.log('Storefront Tracker: Initializing...');
        const gclid = getGclidFromUrl();

        if (gclid) {
            console.log(`Tracker (Storefront): GCLID found in URL: ${gclid}`);
            saveGclid(gclid);
            await injectGclidToCart(gclid);
        } else {
            console.log('Tracker (Storefront): No GCLID found in URL.');
        }
    }

    // Initialize immediately (using the simplified execution method we discussed)
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
