/**
 * request-utils.ts — Shared HTTP request utilities.
 *
 * Extracted to avoid duplication across API routes (DRY principle).
 */

import { NextRequest } from "next/server";

/**
 * Extract client IP from request headers.
 * Supports both standard Request and NextRequest.
 */
export function getIpAddress(request: Request | NextRequest): string {
    return (
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request.headers.get("x-real-ip") ||
        "unknown"
    );
}

export const getClientIP = getIpAddress;
