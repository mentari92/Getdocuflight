/**
 * POST /api/payments/create
 *
 * Creates a DompetX payment for a prediction.
 * Auth required. Validates prediction ownership and unpaid status.
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getIDRAmount } from "@/lib/currency";
import { createPayment } from "@/lib/dompetx";

const PRICE_USD = 5.0;

export async function POST(request: Request) {
    try {
        // Auth check
        const session = await auth();
        if (!session?.user?.id || !session.user.email) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }
        const userId = session.user.id;

        // Validate body
        const body = await request.json();
        const { predictionId, paymentMethod } = body as {
            predictionId?: string;
            paymentMethod?: string;
        };

        if (!predictionId) {
            return NextResponse.json(
                { error: "predictionId is required" },
                { status: 400 }
            );
        }

        // Verify prediction exists, belongs to user, and is unpaid
        const prediction = await prisma.prediction.findUnique({
            where: { id: predictionId },
        });

        if (!prediction || prediction.userId !== userId) {
            return NextResponse.json(
                { error: "Prediction not found" },
                { status: 404 }
            );
        }

        if (prediction.isPaid) {
            return NextResponse.json(
                { error: "Prediction already paid" },
                { status: 409 }
            );
        }

        // Get IDR conversion
        let amountIDR: number;
        let exchangeRate: number;
        try {
            const idr = await getIDRAmount(PRICE_USD);
            amountIDR = idr.amountIDR;
            exchangeRate = idr.exchangeRate;
        } catch {
            // Fallback rate
            exchangeRate = 16500;
            amountIDR = Math.round(PRICE_USD * exchangeRate);
        }

        // Create Order in DB (PENDING)
        const order = await prisma.order.create({
            data: {
                userId,
                productType: "AI_PREDICTION",
                amountUSD: PRICE_USD,
                amountIDR,
                exchangeRate,
                currency: "IDR",
                status: "PENDING",
                paymentGateway: "DOMPETX",
                paymentMethod: paymentMethod || "qris",
                productId: predictionId,
                predictions: {
                    connect: { id: predictionId },
                },
            },
        });

        // Call DompetX to create payment
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const payment = await createPayment({
            orderId: order.id,
            amountIDR,
            customerEmail: session.user.email,
            description: `GetDocuFlight Visa Prediction — ${prediction.toCountry}`,
            paymentMethod: paymentMethod || "qris",
            successRedirectUrl: `${appUrl}/dashboard/predictions/${predictionId}`,
            failureRedirectUrl: `${appUrl}/dashboard/predictions/${predictionId}?payment=failed`,
        });

        // Update order with paymentRef
        await prisma.order.update({
            where: { id: order.id },
            data: { paymentRef: payment.paymentRef },
        });

        return NextResponse.json({
            paymentUrl: payment.paymentUrl,
            orderId: order.id,
            expiresAt: payment.expiresAt,
        });
    } catch (error) {
        console.error("[/api/payments/create] Error:", error);
        return NextResponse.json(
            { error: "Failed to create payment. Please try again." },
            { status: 500 }
        );
    }
}
