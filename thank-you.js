export function register({ analytics, browser }) {

    analytics.subscribe("checkout_completed", async (event) => {

        console.log("Web Pixel: checkout_completed fired");

        const checkout = event.data.checkout;

        const payload = {
            shop_domain: event.context.shop.domain,
            order_id: checkout.order.id,
            gclid: checkout.attributes?.gclid || null,
            timestamp: new Date().toISOString()
        };

        if (!payload.gclid) {
            console.warn("Web Pixel: No gclid found in checkout attributes.");
        }

        try {
            await fetch("https://bbe8cff3197c.ngrok-free.app/api/tracking/beacon", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            console.log("Web Pixel: Conversion beacon sent", payload);

        } catch (e) {
            console.error("Web Pixel: Failed to send beacon", e);
        }

    });

}
