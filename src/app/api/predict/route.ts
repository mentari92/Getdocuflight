/**
 * POST /api/predict
 *
 * Scoring engine API: validates form → hashes → cache check → rule-based →
 * GPT-4o → save prediction → return teaser.
 *
 * Auth: Required | Rate limit: 10 req/min per userId
 */

import { NextResponse } from "next/server";
import crypto from "crypto";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redis } from "@/lib/redis";
import { cacheGet, cacheSet } from "@/lib/cache";
import { predictorFormSchema } from "@/lib/predictor-schema";
import { calculateScore } from "@/lib/scoring";
import { analyzeWithAI, type AIPredictionResult } from "@/lib/openai";
import { getIDRAmount } from "@/lib/currency";

// ── Rate Limiting ──────────────────────────────────────────

const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW = 60; // seconds

async function checkRateLimit(userId: string): Promise<boolean> {
    const key = `ratelimit:predict:${userId}`;
    const current = await redis.incr(key);
    if (current === 1) {
        await redis.expire(key, RATE_LIMIT_WINDOW);
    }
    return current <= RATE_LIMIT_MAX;
}

// ── Input Hash ─────────────────────────────────────────────

function generateInputHash(input: Record<string, unknown>): string {
    const sorted = JSON.stringify(input, Object.keys(input).sort());
    return crypto.createHash("sha256").update(sorted).digest("hex");
}

// ── Handler ────────────────────────────────────────────────

export async function POST(request: Request) {
    try {
        // Step 0: Auth check
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }
        const userId = session.user.id;

        // Step 0b: Rate limit
        const allowed = await checkRateLimit(userId);
        if (!allowed) {
            return NextResponse.json(
                { error: "Too many requests. Please wait before trying again." },
                { status: 429 }
            );
        }

        // Step 1: Validate input
        const body = await request.json();
        const validation = predictorFormSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                {
                    error: "Validation failed",
                    details: validation.error.flatten().fieldErrors,
                },
                { status: 400 }
            );
        }
        const input = validation.data;

        // Step 2: Generate inputHash
        const inputHash = generateInputHash(input as unknown as Record<string, unknown>);

        // Step 3: Check Redis cache
        const cacheKey = `ai:predict:${inputHash}`;
        const cached = await cacheGet<AIPredictionResult>(cacheKey);

        let aiResult: AIPredictionResult;

        if (cached) {
            // Cache hit — skip scoring + OpenAI
            aiResult = cached;
        } else {
            // Step 4: Rule-based scoring
            const { baseScore, factors } = calculateScore(input);

            // Step 5: GPT-4o analysis (with fallback)
            aiResult = await analyzeWithAI(input, baseScore, factors);

            // Step 6: Cache result (TTL 1 hour)
            await cacheSet(cacheKey, aiResult, 3600);
        }

        // Step 7: Save Prediction to PostgreSQL
        const prediction = await prisma.prediction.create({
            data: {
                user: { connect: { id: userId } },
                fromCountry: input.nationality,
                toCountry: input.destination,
                inputData: input as object,
                inputHash,
                approvalScore: aiResult.approvalScore,
                riskLevel: aiResult.riskLevel,
                teaser: aiResult.teaser,
                recommendation: aiResult.recommendation,
                recommendationSummary: aiResult.recommendationSummary,
                factors: aiResult.factors as object[],
                isPaid: false,
            },
        });

        // Step 8: Get price in IDR for response
        let price;
        try {
            const idr = await getIDRAmount(5.0);
            price = {
                amountUSD: 5.0,
                amountIDR: idr.amountIDR,
                exchangeRate: idr.exchangeRate,
            };
        } catch {
            // If currency API fails, use a reasonable fallback
            price = {
                amountUSD: 5.0,
                amountIDR: 82500,
                exchangeRate: 16500,
            };
        }

        // Return preview response (free)
        return NextResponse.json({
            predictionId: prediction.id,
            isPaid: false,
            teaser: aiResult.teaser,
            price,
        });
    } catch (error: any) {
        console.error("[/api/predict] Error:", error);
        require("fs").writeFileSync("/Users/mentarirahman/Documents/Getdocuflight/predict_error.log", error.stack || error.message || String(error));
        return NextResponse.json(
            { error: "Something went wrong. Please try again.", details: error.message },
            { status: 500 }
        );
    }
}
