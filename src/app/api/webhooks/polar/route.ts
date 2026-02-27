import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateEvent } from "@polar-sh/sdk/webhooks";

export async function POST(req: Request) {
    const body = await req.text();
    const headerList = await headers();

    // Polar SDK expects headers as a Record<string, string>
    const webhookHeaders: Record<string, string> = {
        "webhook-id": headerList.get("webhook-id") || "",
        "webhook-timestamp": headerList.get("webhook-timestamp") || "",
        "webhook-signature": headerList.get("webhook-signature") || "",
    };

    const secret = process.env.POLAR_WEBHOOK_SECRET;

    if (!secret) {
        console.error("POLAR_WEBHOOK_SECRET is not configured");
        return new Response("Webhook Secret not configured", { status: 500 });
    }

    try {
        // [IMPORTANT] Webhook Verification using the correct SDK function
        const event = validateEvent(body, webhookHeaders, secret);

        console.log("⚓ Polar Webhook Received:", (event as any).type);

        // Handle successful payment
        if ((event as any).type === "order.paid") {
            const orderPayload = (event as any).data;
            // The metadata is often in the checkout associated with the order, 
            // but Polar also passes metadata in the order if it was passed during checkout.
            const orderId = orderPayload.metadata?.orderId;

            if (orderId) {
                console.log("✅ Payment Success for Order:", orderId);

                // Update Order and Booking status
                await prisma.$transaction([
                    prisma.order.update({
                        where: { id: orderId },
                        data: { status: "PAID", paidAt: new Date() },
                    }),
                    prisma.booking.updateMany({
                        where: { orderId: orderId },
                        data: { status: "PAID" },
                    }),
                ]);
            }
        }

        return NextResponse.json({ received: true });
    } catch (err: any) {
        console.error("❌ Webhook Verification Failed:", err.message);
        return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }
}
