import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import OpenAI from "openai";

const prisma = new PrismaClient();

// Ensure lazy init like openai.ts to avoid hydration issues
let _openai: OpenAI | null = null;
function getOpenAIClient(): OpenAI {
    if (!_openai) {
        const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
        if (!apiKey) throw new Error("API Key missing");

        const isOpenRouter = process.env.OPENROUTER_API_KEY !== undefined;
        _openai = new OpenAI({
            apiKey,
            baseURL: isOpenRouter ? "https://openrouter.ai/api/v1" : undefined,
            defaultHeaders: isOpenRouter ? {
                "HTTP-Referer": "https://getdocuflight.com",
                "X-Title": "GetDocuFlight",
            } : undefined
        });
    }
    return _openai;
}

export interface AuditedDocumentResult {
    criticalMissing: string[];
    gapAnalysis: Array<{
        issue: string;
        impact: "high" | "medium" | "low";
        howToFix: string;
    }>;
    strengths: string[];
    templates: Array<{
        title: string;
        content: string;
    }>;
}

const AUDITOR_PROMPT = `You are a strict, highly experienced Embassy Visa Officer and Document Auditor.
Analyze the provided document images for a visa application.

IMPORTANT RULES:
1. Always respond in English.
2. Return ONLY valid JSON matching the exact structure below.
3. Treat the documents with extreme skepticism. Look for missing return guarantees in HR letters, unexplained large deposits in bank statements, or illogical itineraries.

EXPECTED JSON SCHEMA:
{
  "criticalMissing": ["List 1-3 absolutely critical missing documents"],
  "gapAnalysis": [
    {
      "issue": "Specific gap identified",
      "impact": "high" | "medium" | "low",
      "howToFix": "Specific action the applicant must take to fix this"
    }
  ],
  "strengths": ["List 1-3 strong points found in the documents"],
  "templates": [
    {
      "title": "Document Name (e.g., Letter of Explanation)",
      "content": "Exact copy-paste draft wording for the applicant to use"
    }
  ]
}`;

export async function processDocumentAudit(
    predictionId: string,
    files: File[]
): Promise<AuditedDocumentResult> {
    // 1. Fetch Prediction Context
    const prediction = await prisma.prediction.findUnique({
        where: { id: predictionId },
        select: { toCountry: true, fromCountry: true, approvalScore: true, factors: true }
    });

    if (!prediction) {
        throw new Error("Prediction not found");
    }

    // 2. Process Files
    // To support Vision API, we need to convert files to Base64 Image URLs
    const imageContents = await Promise.all(files.map(async (file) => {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64 = buffer.toString('base64');
        return {
            type: "image_url" as const,
            image_url: {
                url: `data:${file.type};base64,${base64}`
            }
        };
    }));

    // 3. Build User Prompt
    const userPrompt = `Analyze these documents for an applicant from ${prediction.fromCountry} applying to ${prediction.toCountry}.
Current AI Score Without Docs: ${prediction.approvalScore}/100.
Known Risk Factors: ${JSON.stringify(prediction.factors)}`;

    const messageContent: OpenAI.ChatCompletionContentPart[] = [
        { type: "text", text: userPrompt },
        ...imageContents
    ];

    // 4. Call GPT-4o Vision API
    const response = await getOpenAIClient().chat.completions.create({
        model: "openai/gpt-4o-2024-05-13", // Ensure we use a vision-capable model
        messages: [
            { role: "system", content: AUDITOR_PROMPT },
            { role: "user", content: messageContent }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1, // Strict, deterministic auditing
        max_tokens: 2500,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Empty response from Vision AI");

    const parsed = JSON.parse(content) as AuditedDocumentResult;

    // 5. Update Database
    await prisma.prediction.update({
        where: { id: predictionId },
        data: {
            auditedDocuments: parsed as any,
            hasDocumentAnalysis: true
        }
    });

    return parsed;
}
