import crypto from "crypto";

// ── Types ──────────────────────────────────────────────────

export interface CreatePaymentParams {
    orderId: string;
    amountIDR: number;
    customerEmail: string;
    description: string;
    paymentMethod?: string; // "qris", "virtual_account_bca", etc.
    successRedirectUrl?: string;
    failureRedirectUrl?: string;
}

export interface CreatePaymentResult {
    paymentUrl: string;
    paymentRef: string;
    expiresAt: string; // ISO date
}

export interface DompetXWebhookPayload {
    event_id: string;
    event_type: string; // "payment.success", "payment.failed", "payment.expired"
    payment_ref: string;
    external_id: string; // our orderId
    amount: number;
    status: string; // "PAID", "FAILED", "EXPIRED"
    paid_at?: string; // ISO date
}

// ── Configuration ──────────────────────────────────────────

function getConfig() {
    const apiKey = process.env.DOMPETX_API_KEY;
    const baseUrl = process.env.DOMPETX_BASE_URL;
    const webhookSecret = process.env.DOMPETX_WEBHOOK_SECRET;

    if (!apiKey || apiKey === "placeholder") {
        throw new Error("DOMPETX_API_KEY is not configured");
    }
    if (!baseUrl) {
        throw new Error("DOMPETX_BASE_URL is not configured");
    }
    if (!webhookSecret || webhookSecret === "placeholder") {
        throw new Error("DOMPETX_WEBHOOK_SECRET is not configured");
    }

    return { apiKey, baseUrl, webhookSecret };
}

// ── API Client ─────────────────────────────────────────────

/**
 * Create a payment via DompetX API.
 * Returns payment URL for redirect + reference ID for tracking.
 */
export async function createPayment(
    params: CreatePaymentParams
): Promise<CreatePaymentResult> {
    const { apiKey, baseUrl } = getConfig();

    const response = await fetch(`${baseUrl}/payments`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            external_id: params.orderId,
            amount: params.amountIDR,
            currency: "IDR",
            description: params.description,
            customer_email: params.customerEmail,
            payment_method: params.paymentMethod || "qris",
            success_redirect_url: params.successRedirectUrl || `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard`,
            failure_redirect_url: params.failureRedirectUrl || `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard?payment=failed`,
        }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
            `DompetX API error ${response.status}: ${errorBody}`
        );
    }

    const data = await response.json();

    return {
        paymentUrl: data.payment_url,
        paymentRef: data.payment_ref || data.id,
        expiresAt: data.expires_at,
    };
}

// ── Webhook HMAC Verification ──────────────────────────────

/**
 * Verify DompetX webhook signature using HMAC-SHA256.
 * IMPORTANT: rawBody must be the unmodified request body string (before JSON parsing).
 *
 * @param rawBody - Raw request body as string
 * @param signature - Value from X-DompetX-Signature header
 * @returns true if signature is valid
 */
export function verifyWebhookSignature(
    rawBody: string,
    signature: string
): boolean {
    const { webhookSecret } = getConfig();

    const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(rawBody, "utf8")
        .digest("hex");

    // Timing-safe comparison to prevent timing attacks
    try {
        return crypto.timingSafeEqual(
            Buffer.from(signature, "hex"),
            Buffer.from(expectedSignature, "hex")
        );
    } catch {
        // If buffers have different lengths, timingSafeEqual throws
        return false;
    }
}
