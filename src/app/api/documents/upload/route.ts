/**
 * POST /api/documents/upload — Secure document upload.
 *
 * Implements the full 13-step security flow from Architecture §4:
 *  1. Auth + verify paid + upload window not expired
 *  2. Validate file types (PDF/JPG/PNG)
 *  3. Validate file size (≤10MB)
 *  4. ClamAV malware scan
 *  5. Generate UUID storage path
 *  6. Generate AES-256 per-file key
 *  7. Encrypt in memory
 *  8. Upload encrypted blob to MinIO
 *  9. Store encryption key in DB
 * 10. Create Document record
 * 11. Schedule Redis deletion (24h)
 * 12. Audit log
 * 13. Return result
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { scanBuffer } from "@/lib/malware";
import {
    generateFileKey,
    encryptBuffer,
    encryptKeyWithMaster,
} from "@/lib/encryption";
import { generateStoragePath, uploadEncrypted, deleteObject } from "@/lib/storage";
import { scheduleDocumentDeletion } from "@/lib/document-queue";
import { logAudit } from "@/lib/audit";
import { getClientIP } from "@/lib/request-utils";
import { DocumentType } from "@prisma/client";

// Allowed MIME types
const ALLOWED_MIME_TYPES = new Set([
    "application/pdf",
    "image/jpeg",
    "image/png",
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 4;
const UPLOAD_WINDOW_HOURS = 24;

// Map MIME type to friendly name for error messages
const MIME_LABELS: Record<string, string> = {
    "application/pdf": "PDF",
    "image/jpeg": "JPEG",
    "image/png": "PNG",
};

// Infer DocumentType from form field name
const FIELD_TO_DOC_TYPE: Record<string, DocumentType> = {
    bank_statement: "BANK_STATEMENT",
    employment_letter: "EMPLOYMENT_LETTER",
    salary_slip: "SALARY_SLIP",
    passport_stamps: "PASSPORT_STAMPS",
};

export async function POST(request: NextRequest) {
    try {
        // ── Step 1: Auth + Ownership ─────────────────────────
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }
        const userId = session.user.id;
        const ip = getClientIP(request);

        // Parse FormData
        let formData: FormData;
        try {
            formData = await request.formData();
        } catch {
            return NextResponse.json(
                { error: "Invalid form data" },
                { status: 400 }
            );
        }

        const predictionId = formData.get("predictionId") as string;
        if (!predictionId) {
            return NextResponse.json(
                { error: "predictionId is required" },
                { status: 400 }
            );
        }

        // Verify prediction exists, belongs to user, is paid, and window is open
        const prediction = await prisma.prediction.findUnique({
            where: { id: predictionId },
        });

        if (!prediction || prediction.userId !== userId) {
            return NextResponse.json(
                { error: "Prediction not found" },
                { status: 404 }
            );
        }

        if (!prediction.isPaid) {
            return NextResponse.json(
                { error: "Payment required before uploading documents" },
                { status: 403 }
            );
        }

        // Check upload window
        if (
            !prediction.uploadWindowExpiresAt ||
            new Date(prediction.uploadWindowExpiresAt).getTime() < Date.now()
        ) {
            return NextResponse.json(
                { error: "Upload window has expired" },
                { status: 410 }
            );
        }

        // ── Collect files from FormData ──────────────────────
        const files: Array<{
            file: File;
            fieldName: string;
            docType: DocumentType;
        }> = [];

        for (const [fieldName, docType] of Object.entries(FIELD_TO_DOC_TYPE)) {
            const file = formData.get(fieldName);
            if (file && file instanceof File && file.size > 0) {
                files.push({ file, fieldName, docType });
            }
        }

        if (files.length === 0) {
            return NextResponse.json(
                { error: "At least one document file is required" },
                { status: 400 }
            );
        }

        if (files.length > MAX_FILES) {
            return NextResponse.json(
                { error: `Maximum ${MAX_FILES} files allowed` },
                { status: 400 }
            );
        }

        // ── Process each file through security pipeline ──────
        const results: Array<{
            documentId: string;
            fileType: DocumentType;
            status: string;
        }> = [];

        // Track uploaded MinIO paths for rollback on failure (Fix #3)
        const uploadedPaths: string[] = [];

        try {
            for (const { file, docType } of files) {
                // Step 2: Validate file type
                if (!ALLOWED_MIME_TYPES.has(file.type)) {
                    return NextResponse.json(
                        {
                            error: `Unsupported file format: ${file.type}. Only ${Object.values(MIME_LABELS).join(", ")} are accepted.`,
                        },
                        { status: 400 }
                    );
                }

                // Step 3: Validate file size
                if (file.size > MAX_FILE_SIZE) {
                    return NextResponse.json(
                        {
                            error: `File too large (${Math.round(file.size / 1024 / 1024)}MB). Maximum size is 10MB.`,
                        },
                        { status: 400 }
                    );
                }

                // Read file into buffer
                const arrayBuffer = await file.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);

                // Step 4: ClamAV malware scan
                try {
                    const scanResult = await scanBuffer(buffer);
                    if (!scanResult.clean) {
                        return NextResponse.json(
                            {
                                error: `File infected — cannot be processed. Threat: ${scanResult.threat}`,
                            },
                            { status: 422 }
                        );
                    }
                } catch (error) {
                    console.error("ClamAV scan error:", error);
                    return NextResponse.json(
                        { error: "Security scan unavailable. Please try again later." },
                        { status: 503 }
                    );
                }

                // Step 5: Generate UUID storage path
                const storagePath = generateStoragePath();

                // Step 6: Generate AES-256 per-file key
                const fileKey = generateFileKey();

                // Step 7: Encrypt in memory (plaintext never on disk)
                const encryptedBuffer = encryptBuffer(buffer, fileKey);

                // Step 8: Upload encrypted blob to MinIO
                await uploadEncrypted(storagePath, encryptedBuffer);
                uploadedPaths.push(storagePath); // Track for rollback

                // Step 9: Encrypt per-file key with master key for DB storage
                const encryptedKeyData = encryptKeyWithMaster(fileKey);

                // Step 10 + 9: Create Document + EncryptionKey in atomic transaction
                const scheduledDeleteAt = new Date(
                    Date.now() + UPLOAD_WINDOW_HOURS * 60 * 60 * 1000
                );

                const document = await prisma.$transaction(async (tx) => {
                    const doc = await tx.document.create({
                        data: {
                            userId,
                            predictionId,
                            fileType: docType,
                            storagePath,
                            mimeType: file.type,
                            status: "PROCESSING",
                            scheduledDeleteAt,
                        },
                    });

                    await tx.encryptionKey.create({
                        data: {
                            userId,
                            documentId: doc.id,
                            encryptedKey: encryptedKeyData,
                        },
                    });

                    return doc;
                });

                // Step 11: Schedule Redis deletion (24h)
                try {
                    await scheduleDocumentDeletion(document.id);
                } catch (redisErr) {
                    console.error("Redis scheduling failed:", redisErr);
                    // Non-fatal: document will need manual cleanup if Redis is down
                }

                // Step 12: Audit log
                await logAudit({
                    action: "upload",
                    userId,
                    fileId: document.id,
                    ipAddress: ip,
                });

                // Step 13: Collect result
                results.push({
                    documentId: document.id,
                    fileType: docType,
                    status: "processing",
                });
            }
        } catch (pipelineError) {
            // Compensating cleanup: delete any already-uploaded MinIO blobs
            for (const path of uploadedPaths) {
                try {
                    await deleteObject(path);
                } catch (cleanupErr) {
                    console.error(`Rollback cleanup failed for ${path}:`, cleanupErr);
                }
            }
            throw pipelineError; // Re-throw to outer catch
        }

        return NextResponse.json({ documents: results }, { status: 201 });
    } catch (error) {
        console.error("Document upload error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
