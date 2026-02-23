import { NextResponse } from "next/server";
import { signMockWebhook, type DompetXWebhookPayload } from "@/lib/dompetx";

/**
 * POST /api/mock-payment
 * 
 * Local Development Sandbox Endpoint.
 * Receives simulated payment success requests from the mock UI and securely 
 * forwards them to the actual DompetX webhook handler, properly signed.
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { orderId, paymentRef, amount, status = "PAID" } = body;

        if (!orderId || !paymentRef || !amount) {
            return NextResponse.json(
                { error: "Missing required mock payment fields" },
                { status: 400 }
            );
        }

        // Construct the exact payload shape expected by our webhook handler
        const webhookPayload: DompetXWebhookPayload = {
            event_id: `mock_evt_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            event_type: "payment.success",
            payment_ref: paymentRef,
            external_id: orderId,
            amount: Number(amount),
            status: status,
            paid_at: new Date().toISOString(),
        };

        const rawPayloadString = JSON.stringify(webhookPayload);
        const signature = signMockWebhook(rawPayloadString);

        // Forward the synthetically signed payload to the REAL webhook handler on localhost:3000
        const webhookResponse = await fetch(`http://localhost:3000/api/payments/webhooks/dompetx`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-dompetx-signature": signature,
            },
            body: rawPayloadString,
        });

        if (!webhookResponse.ok) {
            const errText = await webhookResponse.text();
            throw new Error(`Webhook handler rejected mock payload: ${errText}`);
        }

        return NextResponse.json({ success: true, message: "Mock webhook delivered successfully" });
    } catch (error) {
        console.error("[Mock Payment] Forwarding error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Mock payment failed" },
            { status: 500 }
        );
    }
}
