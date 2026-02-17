import redis from "@/lib/redis";

/**
 * Get a cached value by key, JSON-parsed.
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
    const raw = await redis.get(key);
    if (!raw) return null;
    try {
        return JSON.parse(raw) as T;
    } catch {
        return null;
    }
}

/**
 * Set a cached value with TTL (seconds).
 */
export async function cacheSet(
    key: string,
    value: unknown,
    ttlSeconds: number
): Promise<void> {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
}

/**
 * Delete a cached key.
 */
export async function cacheDelete(key: string): Promise<void> {
    await redis.del(key);
}

/**
 * Check if a key exists (for idempotency checks).
 */
export async function cacheExists(key: string): Promise<boolean> {
    const result = await redis.exists(key);
    return result === 1;
}
