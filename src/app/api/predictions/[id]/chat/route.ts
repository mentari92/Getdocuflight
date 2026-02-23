import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import OpenAI from "openai";

const isOpenRouter = process.env.OPENROUTER_API_KEY !== undefined;
const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;

const client = apiKey && apiKey !== "sk-placeholder"
    ? new OpenAI({
        apiKey,
        baseURL: isOpenRouter ? "https://openrouter.ai/api/v1" : undefined,
        defaultHeaders: isOpenRouter ? {
            "HTTP-Referer": "https://getdocuflight.com",
            "X-Title": "GetDocuFlight",
        } : undefined
    })
    : null;

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const { messages } = await request.json();

        // 1. Fetch prediction context
        const prediction = await prisma.prediction.findUnique({
            where: { id },
        });

        if (!prediction) {
            return NextResponse.json({ error: "Prediction not found" }, { status: 404 });
        }

        // 2. Ownership check (Admin or Owner)
        if (prediction.userId !== session.user.id && session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // 3. Paid check
        if (!prediction.isPaid && session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Payment required" }, { status: 402 });
        }

        if (!client) {
            return NextResponse.json({ error: "AI service unavailable" }, { status: 503 });
        }

        // 4. Build strict context-aware prompt ("The Salesman")
        const auditContext = prediction.auditedDocuments
            ? `\n    - DOCUMENT AUDIT RESULTS: ${JSON.stringify(prediction.auditedDocuments)}`
            : "";

        const systemPrompt = `You are the GetDocuFlight Premium Visa Consultant.
    
    CRITICAL CONTEXT (LOCKED):
    - Applicant's Nationality: ${prediction.fromCountry}
    - Destination Country: ${prediction.toCountry}
    - Approval Score: ${prediction.approvalScore}/100
    - Risk Level: ${prediction.riskLevel}
    - Key Factors: ${JSON.stringify(prediction.factors)}${auditContext}
    
    STRICT RULES (MUST FOLLOW):
    1. Your analysis is EXCLUSIVELY locked to a visa application from ${prediction.fromCountry} to ${prediction.toCountry}.
    2. If the user asks about ANY OTHER destination country (e.g., "How about the US?", "What if I go to Japan?"), you MUST refuse to answer that specific question.
    3. When refusing, use this exact pattern: "I apologize, but my current analysis is specifically calibrated for your profile applying to [Destination Country]. Visa requirements vary drastically by country. If you need an expert analysis for [Other Country], please create a new prediction from your Dashboard."
    4. Focus on explaining the Key Factors and giving actionable steps to improve the score for ${prediction.toCountry}.
    5. Maintain a professional, expert, and highly supportive tone. Use simple, clear English.`;

        // 5. Call AI
        const response = await client.chat.completions.create({
            model: "google/gemini-2.0-flash-001",
            messages: [
                { role: "system", content: systemPrompt },
                ...messages
            ],
            temperature: 0.7,
            max_tokens: 800,
        });

        return NextResponse.json({
            message: response.choices[0]?.message?.content || "I'm sorry, I couldn't process that request."
        });

    } catch (error) {
        console.error("[Prediction Chat] Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
