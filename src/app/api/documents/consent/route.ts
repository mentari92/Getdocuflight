/**
 * POST /api/documents/consent — Record document upload consent.
 *
 * Creates an audit log entry recording the user's consent timestamp
 * before they proceed to upload documents.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { getClientIP } from "@/lib/request-utils";

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        let predictionId: string | undefined;
        try {
            const body = await request.json();
            predictionId = body.predictionId;
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

        // Verify prediction ownership (Fix #9)
        const prediction = await prisma.prediction.findUnique({
            where: { id: predictionId },
        });

        if (!prediction || prediction.userId !== session.user.id) {
            return NextResponse.json(
                { error: "Prediction not found" },
                { status: 404 }
            );
        }

        const ip = getClientIP(request);

        await logAudit({
            action: "consent",
            userId: session.user.id,
            ipAddress: ip,
            purpose: `document_upload_consent_${predictionId}`,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Consent recording error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
