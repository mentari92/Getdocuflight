/**
 * document-queue.ts — Redis-based document auto-deletion scheduling.
 *
 * Architecture §5 Caching Strategy + §6 Layer 4: Auto-Delete via Redis Queue.
 *
 * Uses Redis key expiry (TTL) to schedule automatic document deletion
 * after 24 hours. A background job (or API cron) checks for expired keys
 * and triggers the actual deletion flow.
 */

import redis from "./redis";

const DOC_DELETE_PREFIX = "doc:delete:";
const DEFAULT_TTL_SECONDS = 86400; // 24 hours

/**
 * Schedule a document for automatic deletion after the given delay.
 * Creates a Redis key with TTL that, when expired, signals deletion is due.
 */
export async function scheduleDocumentDeletion(
    documentId: string,
    delaySeconds: number = DEFAULT_TTL_SECONDS
): Promise<void> {
    const key = `${DOC_DELETE_PREFIX}${documentId}`;
    await redis.set(key, "1", "EX", delaySeconds);
}

/**
 * Cancel a previously scheduled document deletion.
 * Used when user manually deletes a document before the timer expires.
 */
export async function cancelDocumentDeletion(
    documentId: string
): Promise<void> {
    const key = `${DOC_DELETE_PREFIX}${documentId}`;
    await redis.del(key);
}

/**
 * Check if a document still has a pending deletion scheduled.
 * Returns remaining TTL in seconds, or -2 if key doesn't exist.
 */
export async function getDeletionTTL(documentId: string): Promise<number> {
    const key = `${DOC_DELETE_PREFIX}${documentId}`;
    return redis.ttl(key);
}
