/**
 * POST /api/bookings
 *
 * Create a new booking (DRAFT or PENDING_PAYMENT status).
 * Now supports the 5-step order form:
 *   - Product selection (VERIFIED_FLIGHT / VERIFIED_BUNDLE)
 *   - Passenger details
 *   - Flight info
 *   - Hotel info (conditional)
 *   - Contact info
 *
 * Auth is optional — public /order page can create bookings without login.
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
    bookingSchema,
    getProductPrice,
    type ProductTypeKey,
} from "@/lib/booking-schema";

export async function POST(request: Request) {
    try {
        // Auth is optional for public /order page
        const session = await auth();
        const userId = session?.user?.id || null;

        const body = await request.json();

        // Validate all fields with combined schema
        const result = bookingSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json(
                {
                    error: "Invalid booking data",
                    details: result.error.flatten().fieldErrors,
                },
                { status: 400 }
            );
        }

        const data = result.data;

        // Determine pricing based on product type
        const productType = data.productType as ProductTypeKey;
        const amountUSD = getProductPrice(productType);

        // Create booking + passengers in a transaction
        const booking = await prisma.$transaction(async (tx) => {
            const newBooking = await tx.booking.create({
                data: {
                    userId,
                    status: data.contactEmail ? "PENDING_PAYMENT" : "DRAFT",
                    productType: data.productType,
                    departureCity: data.departureCity,
                    arrivalCity: data.arrivalCity,
                    departureDate: new Date(data.departureDate),
                    returnDate: data.returnDate
                        ? new Date(data.returnDate)
                        : null,
                    tripType: data.tripType,
                    passengerCount: data.passengerCount,
                    // Hotel fields (only for VERIFIED_BUNDLE)
                    hotelCity: data.hotelCity || null,
                    hotelCheckIn: data.hotelCheckIn
                        ? new Date(data.hotelCheckIn)
                        : null,
                    hotelCheckOut: data.hotelCheckOut
                        ? new Date(data.hotelCheckOut)
                        : null,
                    // Contact
                    contactName: data.contactName,
                    contactEmail: data.contactEmail,
                    contactWhatsApp: data.contactWhatsApp || null,
                    contactTelegram: data.contactTelegram || null,
                    preferredNotif: data.preferredNotif || "EMAIL",
                    // Pricing
                    amountUSD,
                    // Source
                    source:
                        (body.source as string) === "CHATBOT"
                            ? "CHATBOT"
                            : "WEB_FORM",
                },
            });

            // Create passengers
            if (data.passengers && data.passengers.length > 0) {
                await tx.bookingPassenger.createMany({
                    data: data.passengers.map(
                        (p: {
                            fullName: string;
                            nationality: string;
                            passportNo?: string;
                            salutation?: string;
                            dateOfBirth?: string;
                        }) => ({
                            bookingId: newBooking.id,
                            fullName: p.fullName,
                            nationality: p.nationality,
                            passportNo: p.passportNo || null,
                            salutation: p.salutation || null,
                            dateOfBirth: p.dateOfBirth
                                ? new Date(p.dateOfBirth)
                                : null,
                        })
                    ),
                });
            }

            return newBooking;
        });

        return NextResponse.json({
            bookingId: booking.id,
            status: booking.status,
            amountUSD: booking.amountUSD,
        });
    } catch (error) {
        console.error("[/api/bookings] Error:", error);
        return NextResponse.json(
            { error: "Failed to create booking" },
            { status: 500 }
        );
    }
}
