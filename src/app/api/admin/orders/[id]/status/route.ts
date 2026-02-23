/**
 * PATCH /api/admin/orders/[id]/status
 *
 * Update booking status (admin only).
 * Only allows valid transitions:
 *   PAID → DELIVERED
 *   DELIVERED → COMPLETED
 *
 * Updates both booking and linked order atomically.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import {
    ADMIN_STATUS_TRANSITIONS,
    BOOKING_TO_ORDER_STATUS_MAP,
    BOOKING_STATUS
} from "@/lib/order-constants";
import { sendDeliveryNotification } from "@/lib/notifications";
import { logAudit } from "@/lib/audit";
import { getIpAddress } from "@/lib/request-utils";

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { session, error: authError } = await requireAdmin();
    if (authError) {
        return NextResponse.json(
            { error: authError.error },
            { status: authError.status }
        );
    }

    const { id } = await params;

    let body: { status: string };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json(
            { error: "Invalid request body" },
            { status: 400 }
        );
    }

    const { status: newStatus } = body;

    if (!newStatus) {
        return NextResponse.json(
            { error: "Status is required" },
            { status: 400 }
        );
    }

    try {
        const booking = await prisma.booking.findUnique({
            where: { id },
            include: { order: true },
        });

        if (!booking) {
            return NextResponse.json(
                { error: "Booking not found" },
                { status: 404 }
            );
        }

        // Validate transition
        const allowed = ADMIN_STATUS_TRANSITIONS[booking.status];
        if (!allowed || !allowed.includes(newStatus)) {
            return NextResponse.json(
                {
                    error: `Cannot change status from ${booking.status} to ${newStatus}. Allowed: ${allowed?.join(", ") || "none"}`,
                },
                { status: 422 }
            );
        }

        // Atomic update: booking + order
        const updated = await prisma.$transaction(async (tx) => {
            const updatedBooking = await tx.booking.update({
                where: { id },
                data: { status: newStatus as any },
            });

            // Sync order status if order exists
            if (booking.orderId) {
                const targetOrderStatus = BOOKING_TO_ORDER_STATUS_MAP[newStatus];
                if (targetOrderStatus) {
                    await tx.order.update({
                        where: { id: booking.orderId },
                        data: { status: targetOrderStatus as any },
                    });
                }
            }

            return updatedBooking;
        });

        // Trigger notification if status is DELIVERED
        if (newStatus === BOOKING_STATUS.DELIVERED) {
            try {
                // We fire and forget as per business logic, or handle result
                const ipAddress = getIpAddress(request);

                // Audit log for notification
                await logAudit({
                    action: "notification_delivery",
                    userId: session!.user.id,
                    ipAddress,
                    purpose: `delivery_notif_booking_${id}`
                });

                // Send notification
                await sendDeliveryNotification({
                    id: updated.id,
                    departureCity: updated.departureCity,
                    arrivalCity: updated.arrivalCity,
                    contactName: updated.contactName || "Customer",
                    contactEmail: updated.contactEmail || "",
                    contactWhatsApp: updated.contactWhatsApp,
                    contactTelegram: updated.contactTelegram,
                    preferredNotif: updated.preferredNotif as "EMAIL" | "WHATSAPP" | "TELEGRAM"
                });
            } catch (notifErr) {
                // Log but don't fail the response if notification fails
                console.error(`[Delivery Notif] Failed to send for booking ${id}:`, notifErr);
            }
        }

        return NextResponse.json({
            id: updated.id,
            status: updated.status,
            message: `Status successfully updated to ${newStatus}`,
        });
    } catch (err) {
        console.error("[/api/admin/orders/[id]/status] Error:", err);

        // Specific error for Prisma unique/required violations if any
        const message = err instanceof Error ? err.message : "Failed to update status";

        return NextResponse.json(
            { error: "Database operation failed", details: message },
            { status: 500 }
        );
    }
}
