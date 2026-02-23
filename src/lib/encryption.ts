/**
 * encryption.ts — AES-256-GCM per-file encryption.
 *
 * Architecture §6 Layer 2: Encrypted Storage.
 *
 * Each uploaded file gets a unique 256-bit key.
 * That key is then wrapped (encrypted) with the server MASTER_KEY
 * before being stored in the `encryption_keys` table.
 *
 * Buffer format: [IV (12 bytes)] [Auth Tag (16 bytes)] [Ciphertext]
 */

import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // GCM standard
const AUTH_TAG_LENGTH = 16;

/**
 * Get the server master key from environment.
 * Must be a 64-character hex string (32 bytes).
 */
function getMasterKey(): Buffer {
    const hex = process.env.ENCRYPTION_MASTER_KEY;
    if (!hex || hex.length !== 64) {
        throw new Error(
            "ENCRYPTION_MASTER_KEY must be set as a 64-character hex string (32 bytes)"
        );
    }
    return Buffer.from(hex, "hex");
}

// ── Per-File Key Management ─────────────────────────────────

/** Generate a random 256-bit encryption key for a single file. */
export function generateFileKey(): Buffer {
    return crypto.randomBytes(32);
}

/** Encrypt a per-file key using the server master key. Returns base64 string. */
export function encryptKeyWithMaster(fileKey: Buffer): string {
    const masterKey = getMasterKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, masterKey, iv);
    const encrypted = Buffer.concat([cipher.update(fileKey), cipher.final()]);
    const authTag = cipher.getAuthTag();

    // Format: iv + authTag + encrypted
    return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

/** Decrypt a per-file key using the server master key. Returns raw key Buffer. */
export function decryptKeyFromMaster(encryptedKeyBase64: string): Buffer {
    const masterKey = getMasterKey();
    const data = Buffer.from(encryptedKeyBase64, "base64");

    const iv = data.subarray(0, IV_LENGTH);
    const authTag = data.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const encrypted = data.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

    const decipher = crypto.createDecipheriv(ALGORITHM, masterKey, iv);
    decipher.setAuthTag(authTag);

    return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}

// ── File Buffer Encryption ──────────────────────────────────

/**
 * Encrypt a file buffer using AES-256-GCM.
 * Returns a single buffer: [IV (12)] [AuthTag (16)] [Ciphertext]
 */
export function encryptBuffer(buffer: Buffer, key: Buffer): Buffer {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return Buffer.concat([iv, authTag, encrypted]);
}

/**
 * Decrypt a file buffer that was encrypted with encryptBuffer().
 * Input format: [IV (12)] [AuthTag (16)] [Ciphertext]
 */
export function decryptBuffer(encryptedData: Buffer, key: Buffer): Buffer {
    const iv = encryptedData.subarray(0, IV_LENGTH);
    const authTag = encryptedData.subarray(
        IV_LENGTH,
        IV_LENGTH + AUTH_TAG_LENGTH
    );
    const ciphertext = encryptedData.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}
