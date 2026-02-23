import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { deleteObject } from "@/lib/storage";

/**
 * GET /api/cron/cleanup
 * 
 * Background task to purge expired documents from storage and DB.
 * Fulfils GDPR data minimization requirements ($24h auto-delete).
 */
export async function GET(request: Request) {
    // 1. Security check
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response("Unauthorized", { status: 401 });
    }

    const now = new Date();
    let deletedCount = 0;
    let errorCount = 0;

    try {
        // 2. Find expired documents that aren't marked as DELETED yet
        const expiredDocs = await prisma.document.findMany({
            where: {
                scheduledDeleteAt: { lt: now },
                status: { not: "DELETED" }
            },
            take: 100 // Batching to avoid timeouts
        });

        console.log(`[Cleanup Cron] Found ${expiredDocs.length} expired documents.`);

        for (const doc of expiredDocs) {
            try {
                // a. Delete from MinIO
                await deleteObject(doc.storagePath);

                // b. Atomic DB update: mark doc DELETED and remove encryption key
                // EncryptionKey has onDelete: Cascade in schema, but we'll be explicit
                // to ensure the key is gone.
                await prisma.$transaction([
                    prisma.encryptionKey.deleteMany({
                        where: { documentId: doc.id }
                    }),
                    prisma.document.update({
                        where: { id: doc.id },
                        data: {
                            status: "DELETED",
                            deletedAt: now
                        }
                    })
                ]);

                deletedCount++;
            } catch (err) {
                console.error(`[Cleanup Cron] Failed to purge doc ${doc.id}:`, err);
                errorCount++;
            }
        }

        return NextResponse.json({
            success: true,
            processed: expiredDocs.length,
            deleted: deletedCount,
            errors: errorCount
        });

    } catch (err) {
        console.error("[Cleanup Cron] Fatal error:", err);
        return NextResponse.json(
            { error: "Internal server error during cleanup" },
            { status: 500 }
        );
    }
}
