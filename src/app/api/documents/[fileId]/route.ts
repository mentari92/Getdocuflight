/**
 * DELETE /api/documents/[fileId] — Delete a single document.
 *
 * Architecture §4: DELETE /api/documents/[fileId]
 *  1. Verify fileId belongs to userId
 *  2. Delete encrypted file from MinIO
 *  3. Delete encryption key from DB
 *  4. Mark document.status = DELETED, set deletedAt
 *  5. Cancel scheduled Redis deletion job
 *  6. Audit log: action "manual_delete"
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { deleteObject } from "@/lib/storage";
import { cancelDocumentDeletion } from "@/lib/document-queue";
import { logAudit } from "@/lib/audit";
import { getClientIP } from "@/lib/request-utils";

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ fileId: string }> }
) {
    try {
        // Auth check
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }
        const userId = session.user.id;
        const ip = getClientIP(request);
        const { fileId } = await params;

        // Step 1: Verify ownership
        const document = await prisma.document.findUnique({
            where: { id: fileId },
        });

        if (!document || document.userId !== userId) {
            return NextResponse.json(
                { error: "Document not found" },
                { status: 404 }
            );
        }

        if (document.status === "DELETED") {
            return NextResponse.json(
                { error: "Document already deleted" },
                { status: 410 }
            );
        }

        // Step 2: Delete encrypted file from MinIO
        try {
            await deleteObject(document.storagePath);
        } catch (err) {
            console.error("MinIO delete error:", err);
            // Continue — mark as deleted even if MinIO fails
        }

        // Step 3 + 4: Delete encryption key + mark document as DELETED
        await prisma.$transaction([
            prisma.encryptionKey.deleteMany({
                where: { documentId: fileId },
            }),
            prisma.document.update({
                where: { id: fileId },
                data: {
                    status: "DELETED",
                    deletedAt: new Date(),
                },
            }),
        ]);

        // Step 5: Cancel scheduled Redis deletion job
        try {
            await cancelDocumentDeletion(fileId);
        } catch (err) {
            console.error("Redis cancel error:", err);
            // Non-fatal
        }

        // Step 6: Audit log
        await logAudit({
            action: "manual_delete",
            userId,
            fileId,
            ipAddress: ip,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Document delete error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
