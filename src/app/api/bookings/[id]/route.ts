/**
 * GET /api/bookings/[id]
 *
 * Fetch booking detail with passengers.
 * Auth is OPTIONAL — public visitors from /order/[id] can access their booking.
 * If authenticated, ownership check is enforced.
 *
 * Security: Unauthenticated requests receive a redacted response
 * (passport numbers stripped) to mitigate IDOR risk.
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        const userId = session?.user?.id || null;

        const { id } = await params;

        const booking = await prisma.booking.findUnique({
            where: { id },
            include: { passengers: true },
        });

        if (!booking) {
            return NextResponse.json(
                { error: "Booking not found" },
                { status: 404 }
            );
        }

        // Ownership check: only enforce if both user and booking have userId
        if (userId && booking.userId && booking.userId !== userId) {
            return NextResponse.json(
                { error: "Booking not found" },
                { status: 404 }
            );
        }

        // Determine if this is an authenticated owner
        const isOwner = userId && booking.userId === userId;

        return NextResponse.json({
            id: booking.id,
            status: booking.status,
            productType: booking.productType,
            departureCity: booking.departureCity,
            arrivalCity: booking.arrivalCity,
            departureDate: booking.departureDate,
            returnDate: booking.returnDate,
            tripType: booking.tripType,
            passengerCount: booking.passengerCount,
            passengers: booking.passengers.map((p) => ({
                id: p.id,
                fullName: p.fullName,
                nationality: p.nationality,
                // Strip passport numbers for unauthenticated requests (IDOR mitigation)
                passportNo: isOwner ? p.passportNo : undefined,
            })),
            // Hotel fields (bundle only)
            hotelCity: booking.hotelCity,
            hotelCheckIn: booking.hotelCheckIn,
            hotelCheckOut: booking.hotelCheckOut,
            // Contact — redact sensitive fields for unauthenticated
            contactName: booking.contactName,
            contactEmail: booking.contactEmail,
            contactWhatsApp: isOwner ? booking.contactWhatsApp : undefined,
            contactTelegram: isOwner ? booking.contactTelegram : undefined,
            preferredNotif: booking.preferredNotif,
            // Pricing
            amountUSD: booking.amountUSD,
            amountIDR: booking.amountIDR,
            source: booking.source,
            createdAt: booking.createdAt,
        });
    } catch (error) {
        console.error("[/api/bookings/[id]] Error:", error);
        return NextResponse.json(
            { error: "Something went wrong" },
            { status: 500 }
        );
    }
}
