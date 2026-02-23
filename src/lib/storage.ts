/**
 * storage.ts — MinIO S3-compatible object storage client.
 *
 * Architecture §6 Layer 2: Encrypted Storage.
 *
 * All files stored as encrypted blobs. Storage paths use random UUIDs
 * with no user ID or filenames to prevent information leakage.
 * Format: uploads/{uuid}/{uuid}.enc
 */

import { Client as MinioClient } from "minio";
import { randomUUID } from "crypto";

const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT || "localhost";
const MINIO_PORT = parseInt(process.env.MINIO_PORT || "9000", 10);
const MINIO_USE_SSL = process.env.MINIO_USE_SSL === "true";
const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY || "";
const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY || "";
const MINIO_BUCKET = process.env.MINIO_BUCKET || "getdocuflight-documents";

// Singleton MinIO client
let client: MinioClient | null = null;

function getClient(): MinioClient {
    if (!client) {
        client = new MinioClient({
            endPoint: MINIO_ENDPOINT,
            port: MINIO_PORT,
            useSSL: MINIO_USE_SSL,
            accessKey: MINIO_ACCESS_KEY,
            secretKey: MINIO_SECRET_KEY,
        });
    }
    return client;
}

/**
 * Generate a randomized storage path.
 * Format: uploads/{uuid}/{uuid}.enc — no user info or filenames.
 */
export function generateStoragePath(): string {
    const dirUUID = randomUUID();
    const fileUUID = randomUUID();
    return `uploads/${dirUUID}/${fileUUID}.enc`;
}

/**
 * Upload an encrypted buffer to MinIO.
 */
export async function uploadEncrypted(
    storagePath: string,
    encryptedBuffer: Buffer
): Promise<void> {
    const minio = getClient();
    await minio.putObject(MINIO_BUCKET, storagePath, encryptedBuffer);
}

/**
 * Download an encrypted buffer from MinIO.
 */
export async function downloadEncrypted(
    storagePath: string
): Promise<Buffer> {
    const minio = getClient();
    const stream = await minio.getObject(MINIO_BUCKET, storagePath);

    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        stream.on("data", (chunk: Buffer) => chunks.push(chunk));
        stream.on("end", () => resolve(Buffer.concat(chunks)));
        stream.on("error", reject);
    });
}

/**
 * Delete an object from MinIO.
 */
export async function deleteObject(storagePath: string): Promise<void> {
    const minio = getClient();
    await minio.removeObject(MINIO_BUCKET, storagePath);
}
