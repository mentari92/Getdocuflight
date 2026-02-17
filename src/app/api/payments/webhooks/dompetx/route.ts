import { NextResponse } from "next/server";
import {
    verifyWebhookSignature,
    type DompetXWebhookPayload,
} from "@/lib/dompetx";
import { cacheExists, cacheSet } from "@/lib/cache";
import { prisma } from "@/lib/db";

// LIMITATION: Idempotency relies on Redis TTL (24h). If DompetX retries
// after 24h (e.g., system restore), the event could be reprocessed.
// For production hardening, add a `processed_events` table in PostgreSQL.
const IDEMPOTENCY_TTL = 86400; // 24 hours

/**
 * POST /api/payments/webhooks/dompetx
 *
 * DompetX webhook handler with:
 * 1. HMAC-SHA256 signature verification
 * 2. Idempotent event processing (same event_id → skip)
 * 3. Order + Prediction status update
 */
export async function POST(request: Request) {
    // Step 1: Read raw body BEFORE parsing (required for HMAC verification)
    const rawBody = await request.text();

    // Step 2: Verify HMAC signature
    const signature = request.headers.get("x-dompetx-signature");

    if (!signature) {
        return NextResponse.json(
            { error: "Missing webhook signature" },
            { status: 401 }
        );
    }

    const isValid = verifyWebhookSignature(rawBody, signature);

    if (!isValid) {
        return NextResponse.json(
            { error: "Invalid webhook signature" },
            { status: 401 }
        );
    }

    // Step 3: Parse payload
    let payload: DompetXWebhookPayload;
    try {
        payload = JSON.parse(rawBody) as DompetXWebhookPayload;
    } catch {
        return NextResponse.json(
            { error: "Invalid JSON payload" },
            { status: 400 }
        );
    }

    const { event_id, payment_ref, status, paid_at } = payload;

    if (!event_id || !payment_ref) {
        return NextResponse.json(
            { error: "Missing required fields: event_id, payment_ref" },
            { status: 400 }
        );
    }

    // Step 4: Idempotency check — skip if already processed
    const idempotencyKey = `webhook:dompetx:${event_id}`;
    const alreadyProcessed = await cacheExists(idempotencyKey);

    if (alreadyProcessed) {
        return NextResponse.json({
            message: "Event already processed",
            event_id,
        });
    }

    // Step 5: Find order by paymentRef
    const order = await prisma.order.findFirst({
        where: { paymentRef: payment_ref },
        include: { predictions: true },
    });

    if (!order) {
        // IMPORTANT: Return 200 to prevent DompetX from retrying forever.
        // Log for investigation but acknowledge receipt.
        console.warn(
            `[Webhook] Order not found for paymentRef: ${payment_ref} — acknowledging to stop retries`
        );
        return NextResponse.json({
            message: "Order not found, event acknowledged",
            event_id,
        });
    }

    // Step 6: Process based on event status
    if (status === "PAID") {
        await prisma.$transaction([
            // Update order status
            prisma.order.update({
                where: { id: order.id },
                data: {
                    status: "PAID",
                    paidAt: paid_at ? new Date(paid_at) : new Date(),
                },
            }),

            // Update all linked predictions to isPaid = true
            ...order.predictions.map((prediction) =>
                prisma.prediction.update({
                    where: { id: prediction.id },
                    data: {
                        isPaid: true,
                        uploadWindowExpiresAt: new Date(
                            Date.now() + 24 * 60 * 60 * 1000
                        ), // +24h
                    },
                })
            ),
        ]);
    } else if (status === "FAILED" || status === "EXPIRED") {
        await prisma.order.update({
            where: { id: order.id },
            data: {
                status: status === "FAILED" ? "FAILED" : "EXPIRED",
            },
        });
    }

    // Step 7: Mark event as processed (idempotency)
    await cacheSet(idempotencyKey, { processedAt: new Date().toISOString() }, IDEMPOTENCY_TTL);

    return NextResponse.json({
        message: "Webhook processed successfully",
        event_id,
        order_id: order.id,
        status,
    });
}
