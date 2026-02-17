/**
 * OpenAI GPT-4o integration (Stage 2)
 *
 * Sends enriched context (form data + rule-based score) to GPT-4o.
 * Returns structured JSON with prediction details.
 * Falls back to rule-based analysis if OpenAI fails.
 */

import OpenAI from "openai";
import type { PredictorFormData } from "./predictor-schema";
import type { ScoringFactor } from "./scoring";

// ── Types ──────────────────────────────────────────────────

export interface AIPredictionResult {
    approvalScore: number;
    riskLevel: "LOW" | "MEDIUM" | "HIGH";
    teaser: string;
    factors: Array<{
        name: string;
        impact: "positive" | "neutral" | "negative";
        detail: string;
    }>;
    recommendationSummary: string[];
    recommendation: string;
}

// ── OpenAI Client ──────────────────────────────────────────

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// ── System Prompt (Architecture §7) ────────────────────────

const SYSTEM_PROMPT = `You are a visa application analyst specializing in applications from developing countries.
You analyze visa application profiles and return structured JSON assessments.

IMPORTANT RULES:
1. Always respond in Bahasa Indonesia.
2. Return ONLY valid JSON, no markdown, no code blocks.
3. approvalScore must be 0-100.
4. riskLevel must be exactly "LOW", "MEDIUM", or "HIGH".
5. teaser must be 1-2 paragraphs that hint at key issues WITHOUT revealing specifics.
6. factors must have 3-5 items with name, impact (positive/neutral/negative), and detail.
7. recommendationSummary must have 3-4 concise points.
8. recommendation must be detailed actionable advice.

TEASER RULES (CRITICAL):
- Must hint that there are issues but NOT reveal what they are specifically.
- Must be compelling enough that user wants to pay $5 to find out more.
- Do NOT say: "Saldo tabungan kamu terlalu rendah" (too specific)
- DO say: "Kondisi keuangan kamu perlu dievaluasi lebih lanjut" (intriguing but vague)
- The teaser should make the user feel curious and slightly worried.`;

// ── Main Function ──────────────────────────────────────────

export async function analyzeWithAI(
    input: PredictorFormData,
    baseScore: number,
    ruleFactors: ScoringFactor[]
): Promise<AIPredictionResult> {
    try {
        const userPrompt = buildUserPrompt(input, baseScore, ruleFactors);

        const response = await openai.chat.completions.create(
            {
                model: "gpt-4o",
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    { role: "user", content: userPrompt },
                ],
                response_format: { type: "json_object" },
                temperature: 0.7,
                max_tokens: 2000,
            },
        );

        const content = response.choices[0]?.message?.content;
        if (!content) {
            throw new Error("Empty response from OpenAI");
        }

        const parsed = JSON.parse(content) as AIPredictionResult;

        // Validate required fields
        if (
            typeof parsed.approvalScore !== "number" ||
            !["LOW", "MEDIUM", "HIGH"].includes(parsed.riskLevel) ||
            typeof parsed.teaser !== "string" ||
            !Array.isArray(parsed.factors) ||
            !Array.isArray(parsed.recommendationSummary) ||
            typeof parsed.recommendation !== "string"
        ) {
            throw new Error("Invalid response structure from OpenAI");
        }

        // Clamp score
        parsed.approvalScore = Math.max(
            0,
            Math.min(100, Math.round(parsed.approvalScore))
        );

        return parsed;
    } catch (error) {
        console.error("[OpenAI] Failed, falling back to rule-based:", error);
        return buildFallbackResult(input, baseScore, ruleFactors);
    }
}

// ── Prompt Builder ─────────────────────────────────────────

function buildUserPrompt(
    input: PredictorFormData,
    baseScore: number,
    ruleFactors: ScoringFactor[]
): string {
    const factorSummary = ruleFactors
        .map(
            (f) =>
                `- ${f.name}: ${f.impact} (${f.detail}) [${f.points >= 0 ? "+" : ""}${f.points} pts]`
        )
        .join("\n");

    return `Analyze this visa application profile:

**Applicant Profile:**
- Nationality: ${input.nationality}
- Destination: ${input.destination}
- Passport type: ${input.passportType}
- Departure date: ${input.departureDate}
- Employment: ${input.employmentStatus}
- Monthly income: $${input.monthlyIncome.toLocaleString()}
- Bank balance: $${input.bankBalance.toLocaleString()}
- Prior visa refusal: ${input.priorVisaRefusal}
- Travel purpose: ${input.travelPurpose}
- Travel history: ${input.travelHistory.join(", ")}

**Rule-Based Pre-Score:** ${baseScore}/100
**Rule-Based Factors:**
${factorSummary}

Return a JSON object with this exact structure:
{
  "approvalScore": <number 0-100>,
  "riskLevel": "<LOW|MEDIUM|HIGH>",
  "teaser": "<1-2 paragraph teaser in Bahasa Indonesia>",
  "factors": [{"name": "<string>", "impact": "<positive|neutral|negative>", "detail": "<string>"}],
  "recommendationSummary": ["<point 1>", "<point 2>", "<point 3>"],
  "recommendation": "<detailed recommendation text in Bahasa Indonesia>"
}`;
}

// ── Fallback (rule-based only) ─────────────────────────────

function buildFallbackResult(
    input: PredictorFormData,
    baseScore: number,
    ruleFactors: ScoringFactor[]
): AIPredictionResult {
    const riskLevel: "LOW" | "MEDIUM" | "HIGH" =
        baseScore >= 70 ? "LOW" : baseScore >= 40 ? "MEDIUM" : "HIGH";

    // Generate a generic teaser based on score
    const teaser =
        baseScore >= 70
            ? `Profil visa kamu menunjukkan beberapa kekuatan yang baik untuk pengajuan visa ke ${input.destination}. Meskipun demikian, ada aspek-aspek tertentu yang bisa diperkuat untuk meningkatkan peluang persetujuan. Analisis lengkap kami mencakup rekomendasi detail berdasarkan profil spesifik kamu.`
            : baseScore >= 40
                ? `Profil kamu menunjukkan beberapa kekuatan, namun ada faktor penting yang perlu diperhatikan sebelum mengajukan visa ke ${input.destination}. Kondisi tertentu dalam profil kamu perlu dievaluasi lebih lanjut, dan ada elemen yang kemungkinan memengaruhi keputusan petugas imigrasi. Buka hasil lengkap untuk mengetahui langkah konkret yang bisa kamu ambil.`
                : `Profil visa kamu memiliki beberapa tantangan yang perlu diperhatikan dengan serius sebelum mengajukan visa ke ${input.destination}. Ada beberapa area kritis yang memerlukan perbaikan signifikan. Kami sangat menyarankan untuk melihat analisis lengkap agar kamu bisa mempersiapkan aplikasi dengan lebih baik.`;

    // Convert scoring factors to AI format
    const factors = ruleFactors.map((f) => ({
        name: f.name,
        impact: f.impact,
        detail: f.detail,
    }));

    const recommendationSummary =
        baseScore >= 70
            ? [
                "Profil kamu sudah cukup kuat secara keseluruhan",
                "Pastikan dokumen pendukung lengkap dan terbaru",
                "Pertimbangkan untuk memperkuat bukti keuangan",
            ]
            : baseScore >= 40
                ? [
                    "Ada beberapa aspek penting yang perlu diperkuat",
                    "Kondisi keuangan memerlukan perhatian khusus",
                    "Lengkapi profil dengan bukti pendukung tambahan",
                    "Pertimbangkan timing pengajuan yang lebih strategis",
                ]
                : [
                    "Profil memerlukan perbaikan signifikan sebelum apply",
                    "Tingkatkan bukti keuangan dan ikatan dengan negara asal",
                    "Pertimbangkan untuk mengajukan visa ke negara lain terlebih dahulu",
                    "Konsultasikan dengan agen visa profesional",
                ];

    const recommendation = `Berdasarkan analisis profil kamu, skor persetujuan visa ke ${input.destination} adalah ${baseScore}/100 dengan tingkat risiko ${riskLevel}. Beberapa faktor telah diperhitungkan termasuk status pekerjaan, kondisi keuangan, dan riwayat perjalanan. Untuk meningkatkan peluang, fokus pada memperkuat area yang teridentifikasi sebagai faktor risiko.`;

    return {
        approvalScore: baseScore,
        riskLevel,
        teaser,
        factors,
        recommendationSummary,
        recommendation,
    };
}
