/**
 * GET /api/predictions/[id]
 *
 * Fetch prediction data. Returns teaser-only if unpaid,
 * full result if paid. Auth + ownership required.
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getIDRAmount } from "@/lib/currency";

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        const { id } = await params;

        const prediction = await prisma.prediction.findUnique({
            where: { id },
        });

        if (!prediction || prediction.userId !== session.user.id) {
            return NextResponse.json(
                { error: "Prediction not found" },
                { status: 404 }
            );
        }

        // Get price for paywall
        let price;
        try {
            const idr = await getIDRAmount(5.0);
            price = {
                amountUSD: 5.0,
                amountIDR: idr.amountIDR,
                exchangeRate: idr.exchangeRate,
            };
        } catch {
            price = {
                amountUSD: 5.0,
                amountIDR: 82500,
                exchangeRate: 16500,
            };
        }

        if (prediction.isPaid) {
            // Full result
            return NextResponse.json({
                predictionId: prediction.id,
                isPaid: true,
                teaser: prediction.teaser,
                approvalScore: prediction.approvalScore,
                riskLevel: prediction.riskLevel,
                factors: prediction.factors,
                recommendation: prediction.recommendation,
                recommendationSummary: prediction.recommendationSummary,
                toCountry: prediction.toCountry,
                fromCountry: prediction.fromCountry,
                createdAt: prediction.createdAt,
                hasDocumentAnalysis: prediction.hasDocumentAnalysis,
                uploadWindowExpiresAt: prediction.uploadWindowExpiresAt,
            });
        }

        // Teaser only — no paid data exposed
        return NextResponse.json({
            predictionId: prediction.id,
            isPaid: false,
            teaser: prediction.teaser,
            toCountry: prediction.toCountry,
            fromCountry: prediction.fromCountry,
            createdAt: prediction.createdAt,
            price,
        });
    } catch (error) {
        console.error("[/api/predictions/[id]] Error:", error);
        return NextResponse.json(
            { error: "Something went wrong" },
            { status: 500 }
        );
    }
}
