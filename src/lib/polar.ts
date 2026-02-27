import { Polar } from "@polar-sh/sdk";

/**
 * Get the Polar client based on environment variables.
 */
function getPolarClient() {
    const accessToken = process.env.POLAR_ACCESS_TOKEN;
    if (!accessToken || accessToken === "placeholder") {
        throw new Error("POLAR_ACCESS_TOKEN is not configured");
    }

    // Default to production for our integration since we set up real products
    const polarEnv = (process.env.POLAR_ENV as "production" | "sandbox") || "production";

    return new Polar({
        accessToken,
        server: polarEnv,
    });
}

export interface PolarCheckoutParams {
    orderId: string;
    productId: string;
    customerEmail: string;
    successUrl: string;
}

/**
 * Create a Polar checkout session and return the URL.
 * Polar handles Credit Card payments internationally.
 */
export async function createPolarCheckout(params: PolarCheckoutParams) {
    const client = getPolarClient();

    // MOCK/SANDBOX: If in dev and no real keys, return a mock URL
    if (process.env.POLAR_ACCESS_TOKEN === "placeholder" || !process.env.POLAR_ACCESS_TOKEN) {
        console.log("🛠️ [Polar Mock] Creating simulated checkout for order:", params.orderId);
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        return {
            url: `${appUrl}/mock-payment?gateway=polar&orderId=${params.orderId}&productId=${params.productId}`,
        };
    }

    try {
        // The SDK uses checkouts.create
        const checkout = await client.checkouts.create({
            products: [params.productId],
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
