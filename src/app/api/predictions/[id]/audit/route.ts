import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { processDocumentAudit } from "@/lib/services/document-auditor";
import { prisma } from "@/lib/db";

export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;

        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // --- ADVERSARIAL REVIEW SEC FIX: Ownership & Paid Check ---
        const prediction = await prisma.prediction.findUnique({
            where: { id },
            select: { userId: true, isPaid: true }
        });

        if (!prediction) {
            return NextResponse.json({ error: "Prediction not found" }, { status: 404 });
        }

        if (prediction.userId !== session.user.id && session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden: You do not own this prediction" }, { status: 403 });
        }

        if (!prediction.isPaid && session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Payment required to use the Smart Document Auditor" }, { status: 402 });
        }
        // -----------------------------------------------------------

        const formData = await req.formData();
        const files = formData.getAll("files") as File[];

        if (!files || files.length === 0) {
            return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
        }

        // Validate formats and size (Strict Security)
        const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
        const maxSizeBytes = 5 * 1024 * 1024; // 5MB limit per file

        for (const file of files) {
            if (!allowedTypes.includes(file.type)) {
                return NextResponse.json(
                    { error: `Unsupported file type: ${file.type}. Please upload JPG, PNG, or WEBP images.` },
                    { status: 400 }
                );
            }
            if (file.size > maxSizeBytes) {
                return NextResponse.json(
                    { error: `File ${file.name} exceeds the 5MB limit.` },
                    { status: 400 }
                );
            }
        }

        // Send to processing service
        const auditResult = await processDocumentAudit(id, files);

        return NextResponse.json({ success: true, auditResult });

    } catch (error: any) {
        console.error("[Document Audit] Failed:", error);
        return NextResponse.json(
            { error: error.message || "Auditing process failed" },
            { status: 500 }
        );
    }
}
