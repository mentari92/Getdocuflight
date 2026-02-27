/**
 * POST /api/bookings/[id]/pay
 *
 * Create DompetX payment for a booking.
 * Uses $transaction to prevent race-condition double payments.
 * Updates booking status to PENDING_PAYMENT, creates Order, returns paymentUrl.
 *
 * Auth is OPTIONAL — public visitors from /order can pay without logging in.
 * Dynamic pricing: uses booking.amountUSD (set at creation) instead of hardcoded price.
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getIDRAmount } from "@/lib/currency";
import { createPayment } from "@/lib/dompetx";
import { createPolarCheckout } from "@/lib/polar";
import { PRICING, type ProductTypeKey } from "@/lib/booking-schema";

// ── Helpers ────────────────────────────────────────────────

/** Safely convert USD → IDR with fallback on failure. */
async function safeGetIDR(priceUSD: number) {
    try {
        const idr = await getIDRAmount(priceUSD);
        return { amountIDR: idr.amountIDR, exchangeRate: idr.exchangeRate };
    } catch {
        const fallbackRate = 16500;
        return {
            amountIDR: Math.round(priceUSD * fallbackRate),
            exchangeRate: fallbackRate,
        };
    }
}

/** Resolve dynamic price from booking record using PRICING constants. */
function resolvePrice(booking: { amountUSD: number | null; productType: string | null }) {
    return (
        booking.amountUSD ??
        PRICING[booking.productType as ProductTypeKey] ??
        PRICING.VERIFIED_FLIGHT
    );
}

/** Build human-readable product label for payment description. */
function getProductLabel(productType: string | null) {
    return productType === "VERIFIED_BUNDLE"
        ? "Comprehensive Travel Plan"
        : "Verified Itinerary Planning Service";
}

// ── Route Handler ──────────────────────────────────────────

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Auth is optional — public /order visitors can pay without an account
        const session = await auth();
        const userId = session?.user?.id || null;

        const { id } = await params;


        // [M1 FIX] Guard against malformed request bodies
        let body: { paymentMethod?: string; gateway?: string };
        try {
            body = await request.json();
        } catch {
            return NextResponse.json(
                { error: "Invalid request body" },
                { status: 400 }
            );
        }
        const { paymentMethod, gateway = "DOMPETX" } = body;

        // ── Step 1: Read booking + convert currency OUTSIDE transaction ──
        const preflight = await prisma.booking.findUnique({ where: { id } });

        if (!preflight) {
            return NextResponse.json(
                { error: "Booking not found" },
                { status: 404 }
            );
        }

        // Ownership check: only enforce if user is authenticated
        if (userId && preflight.userId && preflight.userId !== userId) {
            return NextResponse.json(
                { error: "Booking not found" },
                { status: 404 }
            );
        }

        const priceUSD = resolvePrice(preflight);
        const { amountIDR, exchangeRate } = await safeGetIDR(priceUSD);

        // [L1 FIX] Validate email exists before calling DompetX
        const customerEmail = preflight.contactEmail || session?.user?.email;
        if (!customerEmail) {
            return NextResponse.json(
                { error: "Contact email is required for payment" },
                { status: 400 }
            );
        }

        // ── Step 2: Atomic transaction (no external I/O) ──
        const { order, booking } = await prisma.$transaction(async (tx: any) => {
            // Re-read inside transaction for optimistic lock pattern
            const foundBooking = await tx.booking.findUnique({
                where: { id },
            });

            if (!foundBooking) {
                throw new Error("BOOKING_NOT_FOUND");
            }

            if (foundBooking.status === "PAID" || foundBooking.status === "COMPLETED") {
                throw new Error("BOOKING_ALREADY_PAID");
            }

            // Prevent concurrent payment attempts
            if (foundBooking.status === "PENDING_PAYMENT" && foundBooking.orderId) {
                throw new Error("PAYMENT_ALREADY_PENDING");
            }

            // Create Order — use actual product type from booking
            const newOrder = await tx.order.create({
                data: {
                    userId: userId || foundBooking.userId,
                    productType: foundBooking.productType || "VERIFIED_FLIGHT",
                    amountUSD: priceUSD,
                    amountIDR,
                    exchangeRate,
                    currency: "IDR",
                    status: "PENDING",
                    paymentGateway: (gateway || "DOMPETX") as any,
                    paymentMethod: paymentMethod || (gateway === "POLAR" ? "card" : "qris"),
                    productId: foundBooking.id,
                    bookings: {
                        connect: { id: foundBooking.id },
                    },
                },
            });

            // Save both amountUSD and amountIDR on the booking
            const updatedBooking = await tx.booking.update({
                where: { id: foundBooking.id },
                data: {
                    status: "PENDING_PAYMENT",
                    orderId: newOrder.id,
                    amountUSD: priceUSD,
                    amountIDR,
                },
            });

            return { order: newOrder, booking: updatedBooking };
        });

        // ── Step 3: Call DompetX (outside transaction) ──
        const productLabel = getProductLabel(booking.productType);

        // Use request host to guarantee we match the user's current environment instead of .env (which might be set for docker)
        const host = request.headers.get("host") || "localhost:3000";
        const protocol = request.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
        const appUrl = `${protocol}://${host}`;
        let payment: any;

        if (gateway === "POLAR") {
            // Select correct Polar Product ID based on productType
            let polarProductId = process.env.POLAR_PRODUCT_ID_VERIFIED_FLIGHT;
            if (booking.productType === "VERIFIED_BUNDLE") {
                polarProductId = process.env.POLAR_PRODUCT_ID_VERIFIED_BUNDLE;
            } else if (booking.productType === "VISA_PREDICTOR") {
                polarProductId = process.env.POLAR_PRODUCT_ID_VISA_PREDICTOR;
            }

            if (!polarProductId) {
                throw new Error("Polar Product ID not configured for this type");
            }

            payment = await createPolarCheckout({
                orderId: order.id,
                productId: polarProductId,
                customerEmail,
                successUrl: `${appUrl}/order/${booking.id}?payment=success`,
            });
        } else {
            payment = await createPayment({
                orderId: order.id,
                amountIDR,
                customerEmail,
                description: `GetDocuFlight ${productLabel} — ${booking.departureCity} → ${booking.arrivalCity}`,
                paymentMethod: paymentMethod || "qris",
                successRedirectUrl: `${appUrl}/order/${booking.id}`,
                failureRedirectUrl: `${appUrl}/order/${booking.id}?payment=failed`,
            });
        }

        // Save payment reference
        await prisma.order.update({
            where: { id: order.id },
            data: {
                paymentRef: (payment as any).paymentRef || (payment as any).id
            },
        });

        const paymentUrl = (payment as any).url || (payment as any).paymentUrl;

        return NextResponse.json({
            paymentUrl,
            orderId: order.id,
            expiresAt: (payment as any).expiresAt,
        });
    } catch (error) {
        // Handle known errors with proper status codes
        if (error instanceof Error) {
            if (error.message === "BOOKING_NOT_FOUND") {
                return NextResponse.json(
                    { error: "Booking not found" },
                    { status: 404 }
                );
            }
            if (error.message === "BOOKING_ALREADY_PAID") {
                return NextResponse.json(
                    { error: "Booking already paid" },
                    { status: 409 }
                );
            }
            if (error.message === "PAYMENT_ALREADY_PENDING") {
                return NextResponse.json(
                    { error: "Payment already in progress" },
                    { status: 409 }
                );
            }
        }
        console.error("[/api/bookings/[id]/pay] Error:", error);
        return NextResponse.json(
            { error: "Failed to create payment" },
            { status: 500 }
        );
    }
}
