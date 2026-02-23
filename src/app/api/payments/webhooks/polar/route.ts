import { Webhooks } from "@polar-sh/nextjs";
import { prisma } from "@/lib/db";
import { sendBookingConfirmation, sendAdminAlert } from "@/lib/notifications";

/**
 * POST /api/payments/webhooks/polar
 * 
 * Handles Polar.sh webhook events.
 * Signature verification is handled automatically by the @polar-sh/nextjs helper.
 */
export const POST = Webhooks({
    webhookSecret: process.env.POLAR_WEBHOOK_SECRET || "",

    // This handler catches all events, but we specifically want order.created or order.paid
    onPayload: async (payload) => {
        console.log(`[Polar Webhook] Received event: ${payload.type}`);
    },

    // When an order is paid in Polar
    onOrderPaid: async (payload: any) => {
        const order = payload.data;
        console.log(`[Polar Webhook] Order paid: ${order.id} for customer ${order.customer_email}`);

        // 1. Find the order by metadata (metadata is copied from checkout to order)
        // Note: Polar order metadata is a Record<string, string | number | boolean>
        const orderId = order.metadata?.orderId as string;

        if (!orderId) {
            console.error("[Polar Webhook] No orderId found in metadata for Polar order:", order.id);
            return;
        }

        // 2. Update Order and linked entities in database
        try {
            const dbOrder = await prisma.order.findUnique({
                where: { id: orderId },
                include: { predictions: true, bookings: true },
            });

            if (!dbOrder) {
                console.error("[Polar Webhook] Order not found in DB:", orderId);
                return;
            }

            if (dbOrder.status === "PAID") {
                console.log("[Polar Webhook] Order already marked as PAID:", orderId);
                return;
            }

            await prisma.$transaction([
                // Update order
                prisma.order.update({
                    where: { id: dbOrder.id },
                    data: {
                        status: "PAID",
                        paidAt: new Date(),
                        paymentRef: order.id,
                    },
                }),

                // Update predictions
                ...dbOrder.predictions.map((p) =>
                    prisma.prediction.update({
                        where: { id: p.id },
                        data: {
                            isPaid: true,
                            uploadWindowExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // +24h
                        },
                    })
                ),

                // Update bookings
                ...dbOrder.bookings.map((b) =>
                    prisma.booking.update({
                        where: { id: b.id },
                        data: { status: "PAID" },
                    })
                ),
            ]);

            // 3. Trigger User & Admin Notifications
            for (const b of dbOrder.bookings) {
                const fullBooking = await prisma.booking.findUnique({ where: { id: b.id } });
                if (fullBooking && fullBooking.contactEmail && fullBooking.contactName) {
                    // Notify Customer
                    await sendBookingConfirmation({
                        id: fullBooking.id,
                        departureCity: fullBooking.departureCity,
                        arrivalCity: fullBooking.arrivalCity,
                        departureDate: fullBooking.departureDate.toISOString().split("T")[0],
                        returnDate: fullBooking.returnDate?.toISOString().split("T")[0],
                        tripType: fullBooking.tripType,
                        passengerCount: fullBooking.passengerCount,
                        contactName: fullBooking.contactName,
                        contactEmail: fullBooking.contactEmail,
                        contactWhatsApp: fullBooking.contactWhatsApp,
                        contactTelegram: fullBooking.contactTelegram,
                        preferredNotif: fullBooking.preferredNotif,
                    });

                    // Notify Admin
                    await sendAdminAlert({
                        id: fullBooking.id,
                        productType: fullBooking.productType,
                        amountUSD: fullBooking.amountUSD || 0,
                        amountIDR: fullBooking.amountIDR || undefined,
                        contactName: fullBooking.contactName,
                        contactEmail: fullBooking.contactEmail,
                        departureCity: fullBooking.departureCity,
                        arrivalCity: fullBooking.arrivalCity,
                    });
                }
            }

            console.log("[Polar Webhook] Order fulfillment complete for DB Order:", orderId);

        } catch (error) {
            console.error("[Polar Webhook] Fulfillment failed:", error);
            // We let the @polar-sh/nextjs helper handle the response
        }
    },
});
