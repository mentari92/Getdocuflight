/**
 * audit.ts — Audit log writer for document operations.
 *
 * Records all sensitive document actions: upload, process, manual_delete,
 * auto_delete, consent. Stored in the `audit_logs` table via Prisma.
 *
 * Architecture §6 Layer 5: Audit Trail.
 */

import { prisma } from "./db";

export type AuditAction =
    | "upload"
    | "process"
    | "manual_delete"
    | "auto_delete"
    | "consent"
    | "bulk_delete"
    | "notification_delivery";

interface AuditLogParams {
    action: AuditAction;
    userId: string;
    fileId?: string;
    ipAddress: string;
    purpose?: string;
}

/**
 * Create an audit log entry for a document-related action.
 */
export async function logAudit({
    action,
    userId,
    fileId,
    ipAddress,
    purpose = "visa_prediction_reanalysis",
}: AuditLogParams): Promise<void> {
    await prisma.auditLog.create({
        data: {
            action,
            userId,
            fileId: fileId ?? null,
            ipAddress,
            purpose,
        },
    });
}
