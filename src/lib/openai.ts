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
    strategicActionPlan?: Array<{
        title: string;
        action: string;
        priority: "high" | "medium" | "low";
    }>;
    benchmarks?: Array<{
        metric: string;
        current: string;
        ideal: string;
        status: "good" | "needs_improvement" | "critical";
    }>;
}

// ── OpenAI Client (Lazy Init) ──────────────────────────────
// [H3 FIX] Lazy-init: only create client when needed, fail with clear error
let _openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
    if (!_openai) {
        const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
        if (!apiKey) {
            throw new Error(
                "Neither OPENROUTER_API_KEY nor OPENAI_API_KEY is set. Please configure it in .env"
            );
        }

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

// ── System Prompt (Architecture §7) ────────────────────────

const SYSTEM_PROMPT = `You are a visa application analyst specializing in applications from developing countries.
You analyze visa application profiles and return structured JSON assessments.

IMPORTANT RULES:
1. Always respond in English.
2. Use SIMPLE, CLEAR, and EASY-TO-UNDERSTAND English. Avoid complex words, jargon, or overly formal academic language. Imagine you are explaining this to a high school student.
3. Return ONLY valid JSON, no markdown, no code blocks.
4. approvalScore must be 0-100.
5. riskLevel must be exactly "LOW", "MEDIUM", or "HIGH".
6. teaser must be 1-2 paragraphs that hint at key issues WITHOUT revealing specifics.
7. factors must have 3-5 items with name, impact (positive/neutral/negative), and detail.
8. recommendationSummary must have 3-4 concise points.
9. recommendation must be detailed actionable advice.
10. strategicActionPlan (OPTIONAL but RECOMMENDED) should list 3 high-impact actions.
11. benchmarks (OPTIONAL but RECOMMENDED) should compare current stats (from input) vs ideal levels.

TEASER RULES (CRITICAL):
- Must hint that there are issues but NOT reveal what they are specifically.
- Must be compelling enough that user wants to pay $5 to find out more.
- Do NOT say: "Your bank balance is too low" (too specific)
- DO say: "Your financial conditions need further evaluation" (intriguing but vague)
- The teaser should make the user feel curious and slightly worried.`;

// ── Main Function ──────────────────────────────────────────

export async function analyzeWithAI(
    input: PredictorFormData,
    baseScore: number,
    ruleFactors: ScoringFactor[]
): Promise<AIPredictionResult> {
    try {
        const userPrompt = buildUserPrompt(input, baseScore, ruleFactors);

        const response = await getOpenAIClient().chat.completions.create({
            model: "deepseek/deepseek-r1",
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: userPrompt },
            ],
            response_format: { type: "json_object" },
            temperature: 0.3,
            max_tokens: 2000,
        });

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
  "teaser": "<1-2 paragraph teaser in English>",
  "factors": [{"name": "<string>", "impact": "<positive|neutral|negative>", "detail": "<string>"}],
  "recommendationSummary": ["<point 1>", "<point 2>", "<point 3>"],
  "recommendation": "<detailed recommendation text in English>",
  "strategicActionPlan": [
    {"title": "<short title>", "action": "<specific step>", "priority": "<high|medium|low>"}
  ],
  "benchmarks": [
    {"metric": "<e.g. Savings>", "current": "<current value>", "ideal": "<safe value>", "status": "<good|needs_improvement|critical>"}
  ]
} (Note: Always provide strategicActionPlan and benchmarks for full analysis)`;
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
            ? `Your visa profile shows some strong points for a visa application to ${input.destination}. However, there are certain aspects that could be strengthened to improve approval chances. Our full analysis includes detailed recommendations based on your specific profile.`
            : baseScore >= 40
                ? `Your profile shows some strengths, but there are important factors to consider before applying for a visa to ${input.destination}. Certain conditions in your profile need further evaluation, and some elements are likely to influence the immigration officer's decision. Unlock the full results to learn the concrete steps you can take.`
                : `Your visa profile has several challenges that need to be seriously addressed before applying for a visa to ${input.destination}. There are several critical areas that require significant improvement. We strongly suggest viewing the full analysis so you can prepare your application better.`;

    // Convert scoring factors to AI format
    const factors = ruleFactors.map((f) => ({
        name: f.name,
        impact: f.impact,
        detail: f.detail,
    }));

    const recommendationSummary =
        baseScore >= 70
            ? [
                "Your profile is already quite strong overall",
                "Ensure supporting documents are complete and up-to-date",
                "Consider strengthening financial evidence",
            ]
            : baseScore >= 40
                ? [
                    "There are some important aspects that need to be strengthened",
                    "Financial conditions require special attention",
                    "Complete the profile with additional supporting evidence",
                    "Consider a more strategic application timing",
                ]
                : [
                    "The profile requires significant improvement before applying",
                    "Improve financial evidence and ties to your home country",
                    "Consider applying for a visa to another country first",
                    "Consult with a professional visa agent",
                ];

    const recommendation = `Based on your profile analysis, your visa approval score for ${input.destination} is ${baseScore}/100 with a ${riskLevel} risk level. Several factors have been taken into account including employment status, financial conditions, and travel history. To improve your chances, focus on strengthening area(s) identified as risk factors.`;

    return {
        approvalScore: baseScore,
        riskLevel,
        teaser,
        factors,
        recommendationSummary,
        recommendation,
    };
}
// ── Visa Checker (Stage 4) ──────────────────────────────────

export interface VisaRequirementResult {
    status: "VISA_FREE" | "VOA" | "VISA_REQUIRED" | "E_VISA";
    duration: string;
    description: string;
    requirements: string[];
    nextSteps: string;
}

const VISA_CHECKER_PROMPT = `You are a global immigration and visa expert.
Analyze the requirements for a traveler and return structured JSON.

IMPORTANT RULES:
1. Always respond in English.
2. Return ONLY valid JSON.
3. status must be one of: "VISA_FREE", "VOA", "VISA_REQUIRED", "E_VISA".
4. duration should be a string like "30 days" or "90 days".
5. description should be a concise summary of the situation.
6. requirements should be a list of 3-5 critical documents.
7. nextSteps should be a proactive suggestion.`;

export async function checkVisaRequirements(
    nationality: string,
    destination: string,
    duration?: string
): Promise<VisaRequirementResult> {
    try {
        const response = await getOpenAIClient().chat.completions.create({
            model: "deepseek/deepseek-chat",
            messages: [
                { role: "system", content: VISA_CHECKER_PROMPT },
                {
                    role: "user",
                    content: `What are the visa requirements for a citizen of ${nationality} traveling to ${destination} for tourism${duration ? ` for a duration of ${duration}` : ''}?`,
                },
            ],
            response_format: { type: "json_object" },
            temperature: 0.3, // Lower temp for factual accuracy
        });

        const content = response.choices[0]?.message?.content;
        if (!content) throw new Error("Empty response from OpenAI");

        const cleanedContent = content.replace(/^```json\s*/, "").replace(/^```\s*/, "").replace(/\s*```$/, "").trim();
        const parsed = JSON.parse(cleanedContent) as VisaRequirementResult;

        // Simple validation
        if (!parsed.status || !parsed.description) {
            throw new Error("Invalid structure from OpenAI");
        }

        return parsed;
    } catch (error) {
        console.error("[OpenAI] Visa Check Failed:", error);
        // Fallback to a safe "Required" status if unsure
        return {
            status: "VISA_REQUIRED",
            duration: "N/A",
            description: "Information is not available in real-time. Please check the relevant embassy.",
            requirements: ["Valid Passport", "Check Embassy Website"],
            nextSteps: "Use our AI Predictor to calculate your approval odds.",
        };
    }
}
// ── Itinerary Generator (Stage 4) ──────────────────────────

export interface ItineraryDay {
    day: number;
    title: string;
    activities: string[];
}

export interface ItineraryResult {
    destination: string;
    duration: string | number;
    itinerary: ItineraryDay[];
    tips: string[];
}

const ITINERARY_PROMPT = `You are a professional travel planner, storytelling expert, and local guide.
Create a highly detailed, premium itinerary based on the user's destination and duration.

IMPORTANT RULES:
1. Always respond in English.
2. Return ONLY valid JSON matching this exact structure:
{
  "destination": "string",
  "duration": "string",
  "itinerary": [
    { "day": "Day 1", "title": "Arrival & Welcome", "activities": ["Activity 1 with rich description", "Activity 2 with rich description"] }
  ],
  "tips": ["Tip 1", "Tip 2"]
}
3. MUST GROUP BY WEEKS OR PHASES IF DURATION > 10 DAYS: (e.g., "day": "Week 1", "title": "Exploring the Capital"). NEVER output more than 10 items in the itinerary array.
4. MAKE ACTIVITIES HIGH-QUALITY AND SPECIFIC: Don't just say "Visit a museum". Say "Explore the Tokyo National Museum in Ueno Park, admiring the largest collection of Japanese art, followed by a matcha tea break at a traditional teahouse."
5. Include practical details in the activities (e.g. estimated time, transport tips, or specific dish recommendations).
6. Focus on a curated mix of iconic landmarks, hidden gems, and authentic local experiences.`;

export async function generateItinerary(
    destination: string,
    duration: string | number
): Promise<ItineraryResult> {
    try {
        const safeDuration = String(duration).trim();
        const durationText = /^\d+$/.test(safeDuration) ? `${safeDuration} days` : safeDuration;

        const response = await getOpenAIClient().chat.completions.create({
            model: "deepseek/deepseek-chat",
            messages: [
                { role: "system", content: ITINERARY_PROMPT },
                {
                    role: "user",
                    content: `Create an engaging tourism itinerary for ${destination} for a duration of ${durationText}.`,
                },
            ],
            response_format: { type: "json_object" },
            temperature: 0.8,
            max_tokens: 2500,
        });

        const content = response.choices[0]?.message?.content;
        if (!content) throw new Error("Empty response from OpenAI");

        // Try to carefully extract JSON if it's wrapped in markdown
        let jsonStr = content.trim();
        if (jsonStr.startsWith("```json")) {
            jsonStr = jsonStr.replace(/^```json\s*/i, "").replace(/\s*```$/i, "");
        } else if (jsonStr.startsWith("```")) {
            jsonStr = jsonStr.replace(/^```\s*/i, "").replace(/\s*```$/i, "");
        }

        console.log("[OpenAI] Itinerary payload cleaned length:", jsonStr.length);
        const parsed = JSON.parse(jsonStr) as ItineraryResult;
        return parsed;
    } catch (error) {
        console.error("[OpenAI] Itinerary Generation Failed:", error);

        // Return fallback data so the UI doesn't crash
        return {
            destination,
            duration,
            itinerary: [
                {
                    day: 1,
                    title: "Arrival",
                    activities: ["Hotel check-in", "Rest", "Leisurely walk around the area"],
                },
            ],
            tips: ["Check weather conditions before departure.", "Prepare travel insurance."],
        };
    }
}

// ── Live Chat AI (Support) ──────────────────────────────────

export async function generateChatReply(
    messageHistory: { role: "user" | "assistant" | "system", content: string }[],
): Promise<string> {
    try {
        const SYSTEM_PROMPT = `You are the friendly, helpful AI support assistant for GetDocuFlight.
GetDocuFlight provides two main services:
1. Verified Dummy Flight Tickets (for visa applications) starting at $10 for flight only, and $20 for a flight+hotel bundle. Processed within 1-2 hours.
2. AI Visa Approvals Predictor & Smart Navigator (free requirements check, $5 premium analysis).

RULES:
- Be polite, concise, and helpful.
- Keep answers relatively short (1-3 paragraphs) as this is a live chat.
- Always use the Indonesian word "kak" to address the user gently if responding in Indonesian, or keep it friendly in English.
- If you don't know the answer or the user asks for a human, tell them an admin will be with them shortly.
- Format with simple text (no complex markdown or asterisks for bolding). Keep it plain text.`;

        const response = await getOpenAIClient().chat.completions.create({
            model: "deepseek/deepseek-chat",
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                ...messageHistory,
            ],
            temperature: 0.5,
            max_tokens: 500,
        });

        const reply = response.choices[0]?.message?.content;
        return reply || "I'm sorry, I'm having trouble connecting right now. An admin will be with you shortly.";
    } catch (error) {
        console.error("[OpenAI] Chat Auto-Reply Failed:", error);
        return "I'm sorry, I'm experiencing technical difficulties. Our human support team will reply to you as soon as they are available.";
    }
}
