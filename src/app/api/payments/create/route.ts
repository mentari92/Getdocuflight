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
import { createPolarCheckout } from "@/lib/polar";

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
        let predictionId: string | undefined;
        let paymentMethod: string | undefined;
        let gateway: string = "DOMPETX";
        let body: any;

        try {
            body = await request.json();
            predictionId = body.predictionId;
            paymentMethod = body.paymentMethod;
            gateway = body.gateway || "DOMPETX";
        } catch {
            return NextResponse.json(
                { error: "Invalid request body" },
                { status: 400 }
            );
        }

        if (!predictionId) {
            return NextResponse.json(
                { error: "predictionId is required" },
                { status: 400 }
            );
        }

        // Get IDR conversion before transaction
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

        // [C2 FIX] Atomic transaction: find prediction + verify + create order
        const { order, prediction } = await prisma.$transaction(async (tx) => {
            const foundPrediction = await tx.prediction.findUnique({
                where: { id: predictionId },
            });

            if (!foundPrediction || foundPrediction.userId !== userId) {
                throw new Error("PREDICTION_NOT_FOUND");
            }

            if (foundPrediction.isPaid) {
                throw new Error("PREDICTION_ALREADY_PAID");
            }

            // Check for existing pending order to prevent duplicates
            const existingOrder = await tx.order.findFirst({
                where: {
                    productId: predictionId,
                    status: "PENDING",
                },
            });

            if (existingOrder) {
                throw new Error("PAYMENT_ALREADY_PENDING");
            }

            const newOrder = await tx.order.create({
                data: {
                    userId,
                    productType: "AI_PREDICTION",
                    amountUSD: PRICE_USD,
                    amountIDR,
                    exchangeRate,
                    currency: "IDR",
                    status: "PENDING",
                    paymentGateway: (gateway || "DOMPETX") as any,
                    paymentMethod: paymentMethod || (gateway === "POLAR" ? "card" : "qris"),
                    productId: predictionId,
                    predictions: {
                        connect: { id: predictionId },
                    },
                },
            });

            return { order: newOrder, prediction: foundPrediction };
        });

        // Call appropriate gateway
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        let payment;

        if (gateway === "POLAR") {
            const productId = process.env.POLAR_PRODUCT_ID_VISA_PREDICTOR;
            if (!productId) {
                throw new Error("Polar Product ID for Visa Predictor not configured");
            }

            payment = await createPolarCheckout({
                orderId: order.id,
                productId,
                customerEmail: session.user.email,
                successUrl: `${appUrl}/dashboard/predictions/${predictionId}?payment=success`,
            });
        } else {
            payment = await createPayment({
                orderId: order.id,
                amountIDR,
                customerEmail: session.user.email,
                description: `GetDocuFlight Visa Prediction — ${prediction.toCountry}`,
                paymentMethod: paymentMethod || "qris",
                successRedirectUrl: `${appUrl}/dashboard/predictions/${predictionId}`,
                failureRedirectUrl: `${appUrl}/dashboard/predictions/${predictionId}?payment=failed`,
            });
        }

        // Update order with paymentRef
        await prisma.order.update({
            where: { id: order.id },
            data: {
                paymentRef: (payment as any).paymentRef || (payment as any).id,
            },
        });

        const paymentUrl = (payment as any).url || (payment as any).paymentUrl;

        return NextResponse.json({
            paymentUrl,
            orderId: order.id,
            expiresAt: (payment as any).expiresAt,
        });
    } catch (error) {
        // Handle known transaction errors
        if (error instanceof Error) {
            if (error.message === "PREDICTION_NOT_FOUND") {
                return NextResponse.json(
                    { error: "Prediction not found" },
                    { status: 404 }
                );
            }
            if (error.message === "PREDICTION_ALREADY_PAID") {
                return NextResponse.json(
                    { error: "Prediction already paid" },
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
        console.error("[/api/payments/create] Error:", error);
        return NextResponse.json(
            { error: "Failed to create payment. Please try again." },
            { status: 500 }
        );
    }
}
