import { Polar } from "@polar-sh/sdk";

/**
 * Get the Polar client based on environment variables.
 */
function getPolarClient() {
    const accessToken = process.env.POLAR_ACCESS_TOKEN;
    if (!accessToken || accessToken === "placeholder") {
        throw new Error("POLAR_ACCESS_TOKEN is not configured");
    }

    return new Polar({
        accessToken,
        server: process.env.NODE_ENV === "production" ? "production" : "sandbox",
    });
}

export interface PolarCheckoutParams {
    orderId: string;
    amountUSD: number;
    customerEmail: string;
    productName: string;
    successUrl: string;
}

/**
 * Create a Polar checkout session and return the URL.
 * Polar handles Credit Card payments internationally.
 */
export async function createPolarCheckout(params: PolarCheckoutParams) {
    const client = getPolarClient();
    const organizationId = process.env.POLAR_ORGANIZATION_ID;

    if (!organizationId) {
        throw new Error("POLAR_ORGANIZATION_ID is not configured");
    }

    // Note: In a real app, you might want to create a Product on Polar first
    // and use its Price ID. For simple dynamic amounts, we use custom checkouts if available
    // or create a one-time product. For this implementation, we assume a pre-configured 
    // "Custom Checkout" or we use the 'fixed' price model from a known product.

    // Polar typically expects a Price ID. We'll look for a price ID based on the product type 
    // or use a generic "Visa Prediction/Dummy Ticket" product price ID.
    // For now, we'll use the checkouts.custom.create as per research.

    // MOCK/SANDBOX: If in dev and no real keys, return a mock URL
    if (process.env.POLAR_ACCESS_TOKEN === "placeholder" || !process.env.POLAR_ACCESS_TOKEN) {
        console.log("🛠️ [Polar Mock] Creating simulated checkout for order:", params.orderId);
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        return {
            url: `${appUrl}/mock-payment?gateway=polar&orderId=${params.orderId}&amount=${params.amountUSD}`,
        };
    }

    try {
        // Polar expects payment for a specific Price ID. 
        // We'll use organization-level checkout or find/create a price.
        // For simplicity in this v1, we use a single product Price ID for all $5/$10/$20 items
        // or expect it in ENV.

        // The SDK uses checkouts.create
        const checkout = await client.checkouts.create({
            products: [process.env.POLAR_PRODUCT_ID || ""],
            successUrl: params.successUrl,
            customerEmail: params.customerEmail,
            metadata: {
                orderId: params.orderId,
            },
        });

        return {
            url: checkout.url,
            id: checkout.id,
        };
    } catch (error) {
        console.error("[Polar] Checkout creation failed:", error);
        throw error;
    }
}
