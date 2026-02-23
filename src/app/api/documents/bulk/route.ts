/**
 * DELETE /api/documents/bulk — Bulk delete all documents for a prediction.
 *
 * Used from the dashboard "Delete My Documents" button.
 * Deletes all documents, encryption keys, and MinIO objects
 * associated with a given prediction.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { deleteObject } from "@/lib/storage";
import { cancelDocumentDeletion } from "@/lib/document-queue";
import { logAudit } from "@/lib/audit";
import { getClientIP } from "@/lib/request-utils";

export async function DELETE(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }
        const userId = session.user.id;
        const ip = getClientIP(request);

        // Parse body
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

        // Find all non-deleted documents for this prediction owned by this user
        const documents = await prisma.document.findMany({
            where: {
                predictionId,
                userId,
                status: { not: "DELETED" },
            },
        });

        if (documents.length === 0) {
            return NextResponse.json({ success: true, deleted: 0 });
        }

        // Delete each document's MinIO object and cancel Redis jobs
        for (const doc of documents) {
            try {
                await deleteObject(doc.storagePath);
            } catch (err) {
                console.error(`MinIO delete failed for ${doc.id}:`, err);
            }

            try {
                await cancelDocumentDeletion(doc.id);
            } catch (err) {
                console.error(`Redis cancel failed for ${doc.id}:`, err);
            }
        }

        const docIds = documents.map((d) => d.id);

        // Bulk DB cleanup: delete keys + mark documents as DELETED
        await prisma.$transaction([
            prisma.encryptionKey.deleteMany({
                where: { documentId: { in: docIds } },
            }),
            prisma.document.updateMany({
                where: { id: { in: docIds } },
                data: {
                    status: "DELETED",
                    deletedAt: new Date(),
                },
            }),
        ]);

        // Audit log for bulk delete
        await logAudit({
            action: "bulk_delete",
            userId,
            ipAddress: ip,
            purpose: `bulk_delete_prediction_${predictionId}`,
        });

        return NextResponse.json({ success: true, deleted: documents.length });
    } catch (error) {
        console.error("Bulk document delete error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
