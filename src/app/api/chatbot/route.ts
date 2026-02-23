/**
 * POST /api/chatbot
 *
 * Chat endpoint for the booking chatbot.
 * Accepts a message history and returns AI response.
 *
 * [M3 FIX] Added simple in-memory rate limiting per user (1 req/sec).
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { processChatMessage, type ChatMessage } from "@/lib/chatbot";

// [M3 FIX] Simple in-memory rate limiter per user
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_MS = 1500; // 1.5 seconds between requests

function isRateLimited(userId: string): boolean {
    const now = Date.now();
    const lastRequest = rateLimitMap.get(userId);
    if (lastRequest && now - lastRequest < RATE_LIMIT_MS) {
        return true;
    }
    rateLimitMap.set(userId, now);

    // Cleanup old entries periodically (every 100 entries)
    if (rateLimitMap.size > 100) {
        const cutoff = now - RATE_LIMIT_MS * 10;
        for (const [key, ts] of rateLimitMap) {
            if (ts < cutoff) rateLimitMap.delete(key);
        }
    }

    return false;
}

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        // [M3 FIX] Rate limit check
        if (isRateLimited(session.user.id)) {
            return NextResponse.json(
                { error: "Terlalu cepat. Tunggu sebentar ya." },
                { status: 429 }
            );
        }

        const body = await request.json();
        const { messages } = body as { messages?: ChatMessage[] };

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return NextResponse.json(
                { error: "messages array is required" },
                { status: 400 }
            );
        }

        // Limit conversation length to prevent abuse
        if (messages.length > 30) {
            return NextResponse.json(
                { error: "Conversation too long. Please start a new chat." },
                { status: 400 }
            );
        }

        const response = await processChatMessage(messages);

        return NextResponse.json(response);
    } catch (error) {
        console.error("[/api/chatbot] Error:", error);
        return NextResponse.json(
            { error: "Something went wrong" },
            { status: 500 }
        );
    }
}
