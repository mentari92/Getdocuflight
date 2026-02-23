/**
 * POST /api/predict/[id]/reanalyze — Re-analyze prediction with uploaded documents.
 *
 * Architecture §4 Memory-Only Processing:
 *  1. Verify auth + ownership + paid + documents exist
 *  2. Fetch all PROCESSING documents for this prediction
 *  3. Decrypt each in memory (never write to disk)
 *  4. Send to OpenAI Vision API for document analysis
 *  5. Generate updated score, factors, recommendations
 *  6. Update prediction with approvalScoreWithDocs + hasDocumentAnalysis = true
 *  7. Mark documents as ANALYZED
 *  8. Audit log: "process"
 */

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { downloadEncrypted } from "@/lib/storage";
import { decryptBuffer, decryptKeyFromMaster } from "@/lib/encryption";
import { logAudit } from "@/lib/audit";
import { getClientIP } from "@/lib/request-utils";

// ── OpenAI Client ─────────────────────────────────────────
let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
    if (!_openai) {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error("OPENAI_API_KEY is not configured");
        }
        _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    return _openai;
}

// ── Document Type Labels ──────────────────────────────────
const DOC_TYPE_LABELS: Record<string, string> = {
    BANK_STATEMENT: "Bank Statement",
    EMPLOYMENT_LETTER: "Employment Letter",
    SALARY_SLIP: "Salary Slip",
    PASSPORT_STAMPS: "Passport Visa Pages",
};

// ── Vision Analysis Prompt ────────────────────────────────
const VISION_SYSTEM_PROMPT = `You are a visa document analyst. You are reviewing uploaded documents to refine a visa application prediction.

Your task:
1. Analyze each document image/PDF for relevant visa application data
2. Extract key financial figures, employment details, and travel history
3. Provide an UPDATED approval score (0-100) that factors in the document evidence
4. Identify which prediction factors changed and why
5. Provide updated recommendations with specific numbers from the documents

IMPORTANT:
- Be specific: cite actual numbers from documents (salary amounts, account balances, travel dates)
- Compare document evidence to typical visa requirements
- If documents strengthen the application, explain how (e.g., "consistent monthly income of $X,000...")
- If documents reveal risks, explain them factually

Respond ONLY with valid JSON:
{
  "approvalScoreWithDocs": <number 0-100>,
  "updatedFactors": [
    {
      "name": "<factor name>",
      "impact": "positive" | "neutral" | "negative",
      "detail": "<updated assessment with document evidence>",
      "changed": true | false,
      "changeNote": "<what changed and why, e.g. 'Financial ↑ Updated: statement shows consistent income...'>"
    }
  ],
  "updatedRecommendations": [
    "<specific recommendation with actual numbers from documents>"
  ],
  "documentSummary": "<brief summary of what the documents reveal>"
}`;

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // ── Auth ────────────────────────────────────────
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }
        const userId = session.user.id;
        const ip = getClientIP(request);
        const { id: predictionId } = await params;

        // ── Verify prediction ──────────────────────────
        const prediction = await prisma.prediction.findUnique({
            where: { id: predictionId },
            include: {
                documents: {
                    where: { status: "PROCESSING" },
                    include: { encryptionKey: true },
                },
            },
        });

        if (!prediction || prediction.userId !== userId) {
            return NextResponse.json(
                { error: "Prediction not found" },
                { status: 404 }
            );
        }

        if (!prediction.isPaid) {
            return NextResponse.json(
                { error: "Payment required" },
                { status: 403 }
            );
        }

        if (prediction.hasDocumentAnalysis) {
            return NextResponse.json(
                { error: "Documents have already been analyzed for this prediction" },
                { status: 409 }
            );
        }

        if (prediction.documents.length === 0) {
            return NextResponse.json(
                { error: "No documents found for analysis" },
                { status: 400 }
            );
        }

        // Audit: re-analysis started
        await logAudit({
            action: "process",
            userId,
            ipAddress: ip,
            purpose: `reanalysis_started_${predictionId}`,
        });

        // ── Decrypt documents in memory ─────────────────
        const documentContents: Array<{
            type: string;
            base64: string;
            mimeType: string;
        }> = [];

        for (const doc of prediction.documents) {
            if (!doc.encryptionKey) {
                console.error(`No encryption key for document ${doc.id}`);
                continue;
            }

            try {
                // Download encrypted blob from MinIO
                const encryptedData = await downloadEncrypted(doc.storagePath);

                // Decrypt the per-file key
                const fileKey = decryptKeyFromMaster(
                    doc.encryptionKey.encryptedKey
                );

                // Decrypt the file in memory
                const plaintext = decryptBuffer(encryptedData, fileKey);

                // Use stored MIME type from upload, fallback to PDF
                const mimeType = doc.mimeType || "application/pdf";

                documentContents.push({
                    type: DOC_TYPE_LABELS[doc.fileType] || doc.fileType,
                    base64: plaintext.toString("base64"),
                    mimeType,
                });
            } catch (err) {
                console.error(`Failed to decrypt document ${doc.id}:`, err);
                // Skip this document but continue with others
            }
        }

        if (documentContents.length === 0) {
            return NextResponse.json(
                { error: "Could not process any documents. Please try uploading again." },
                { status: 500 }
            );
        }

        // ── Send to OpenAI Vision API ──────────────────
        const openai = getOpenAI();

        // Build vision messages with document images
        const inputData = prediction.inputData as Record<string, unknown>;
        const userPromptParts: OpenAI.Chat.Completions.ChatCompletionContentPart[] =
            [
                {
                    type: "text",
                    text: `Original prediction details:
- From: ${prediction.fromCountry} → To: ${prediction.toCountry}
- Original Score: ${prediction.approvalScore}/100
- Risk Level: ${prediction.riskLevel}
- Input Data: ${JSON.stringify(inputData, null, 2)}

The following ${documentContents.length} document(s) were uploaded for verification. Analyze them and provide an updated assessment:`,
                },
            ];

        // Add each document as a Vision image
        for (const doc of documentContents) {
            userPromptParts.push({
                type: "text",
                text: `\n--- Document: ${doc.type} ---`,
            });
            userPromptParts.push({
                type: "image_url",
                image_url: {
                    url: `data:${doc.mimeType};base64,${doc.base64}`,
                    detail: "high",
                },
            });
        }

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: VISION_SYSTEM_PROMPT },
                { role: "user", content: userPromptParts },
            ],
            response_format: { type: "json_object" },
            max_tokens: 2000,
            temperature: 0.3,
        });

        const responseText = completion.choices[0]?.message?.content;
        if (!responseText) {
            throw new Error("Empty response from OpenAI Vision");
        }

        const raw = JSON.parse(responseText);

        // ── Validate response shape (Fix #1) ─────────────
        const score = Number(raw.approvalScoreWithDocs);
        if (isNaN(score) || score < 0 || score > 100) {
            console.error("Invalid approvalScoreWithDocs from OpenAI:", raw.approvalScoreWithDocs);
            throw new Error("AI returned an invalid score");
        }

        const updatedFactors = Array.isArray(raw.updatedFactors)
            ? raw.updatedFactors.filter(
                (f: Record<string, unknown>) =>
                    typeof f.name === "string" &&
                    typeof f.detail === "string" &&
                    ["positive", "neutral", "negative"].includes(f.impact as string)
            )
            : null;

        const updatedRecommendations = Array.isArray(raw.updatedRecommendations)
            ? raw.updatedRecommendations.filter((r: unknown) => typeof r === "string")
            : null;

        const documentSummary =
            typeof raw.documentSummary === "string" ? raw.documentSummary : "";

        // ── Update prediction ──────────────────────────
        await prisma.$transaction([
            prisma.prediction.update({
                where: { id: predictionId },
                data: {
                    approvalScoreWithDocs: Math.round(score),
                    hasDocumentAnalysis: true,
                    factors: updatedFactors ?? (prediction.factors as object[]),
                    recommendationSummary:
                        updatedRecommendations ?? prediction.recommendationSummary,
                },
            }),
            // Mark all documents as ANALYZED
            prisma.document.updateMany({
                where: {
                    predictionId,
                    status: "PROCESSING",
                },
                data: {
                    status: "ANALYZED",
                },
            }),
        ]);

        // Audit: re-analysis completed
        await logAudit({
            action: "process",
            userId,
            ipAddress: ip,
            purpose: `reanalysis_completed_${predictionId}`,
        });

        return NextResponse.json({
            success: true,
            approvalScoreWithDocs: Math.round(score),
            documentSummary,
            updatedFactors: updatedFactors ?? [],
            updatedRecommendations: updatedRecommendations ?? [],
        });
    } catch (error) {
        console.error("Re-analysis error:", error);

        // Differentiate OpenAI errors
        if (error instanceof OpenAI.APIError) {
            return NextResponse.json(
                {
                    error: "AI analysis service temporarily unavailable. Please try again.",
                },
                { status: 503 }
            );
        }

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
