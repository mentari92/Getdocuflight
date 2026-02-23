/**
 * AI Chatbot service for conversational booking.
 *
 * Uses GPT-4o with function calling to extract structured
 * booking data from natural language conversation.
 *
 * [M2 FIX] Lazy OpenAI client initialization — only created
 * when API key is actually available.
 */

import OpenAI from "openai";

// [M2 FIX] Lazy singleton — don't initialize with placeholder key
let _openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
    const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === "sk-placeholder") return null;

    if (!_openaiClient) {
        const isOpenRouter = process.env.OPENROUTER_API_KEY !== undefined;
        _openaiClient = new OpenAI({
            apiKey,
            baseURL: isOpenRouter ? "https://openrouter.ai/api/v1" : undefined,
            defaultHeaders: isOpenRouter ? {
                "HTTP-Referer": "https://getdocuflight.com",
                "X-Title": "GetDocuFlight",
            } : undefined
        });
    }
    return _openaiClient;
}

const SYSTEM_PROMPT = `You are the GetDocuFlight booking assistant. You help users book dummy flight tickets for visa purposes.

RULES:
1. Speak in friendly, professional English.
2. Collect the following information naturally, one by one:
   - Departure city
   - Arrival city
   - Departure date
   - Return date (if round-trip)
   - Passenger count
   - Passenger names and nationalities for each
3. If the user mentions relative dates like "tomorrow", "next week", "next month" — calculate from today's date.
4. ALWAYS offer two options at first:
   - "Continue here" (chat-based)
   - "Full Booking Form" (provide link /dashboard/booking)
5. Summarize and ask for confirmation before submitting the booking.
6. Do not invent data — ask the user if info is missing.

IMPORTANT: If the user chooses "Full Booking Form", provide the link: /dashboard/booking

Format response: plain text, not JSON (except when calling functions).`;

// Function definition for structured data extraction
const EXTRACT_BOOKING_FUNCTION = {
    name: "create_booking",
    description: "Create a booking after collecting all required information from the user",
    parameters: {
        type: "object" as const,
        properties: {
            departureCity: { type: "string", description: "Departure city with airport code, e.g. 'Jakarta (CGK)'" },
            arrivalCity: { type: "string", description: "Arrival city with airport code, e.g. 'Tokyo (NRT)'" },
            departureDate: { type: "string", description: "Departure date in YYYY-MM-DD format" },
            returnDate: { type: "string", description: "Return date in YYYY-MM-DD format, null if one way" },
            tripType: { type: "string", enum: ["ONE_WAY", "ROUND_TRIP"] },
            passengerCount: { type: "number", description: "Number of passengers (1-9)" },
            passengers: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        fullName: { type: "string" },
                        nationality: { type: "string" },
                    },
                    required: ["fullName", "nationality"],
                },
            },
        },
        required: ["departureCity", "arrivalCity", "departureDate", "tripType", "passengerCount", "passengers"],
    },
};

export interface ChatMessage {
    role: "user" | "assistant" | "system";
    content: string;
}

export interface ChatResponse {
    message: string;
    bookingData?: {
        departureCity: string;
        arrivalCity: string;
        departureDate: string;
        returnDate?: string;
        tripType: "ONE_WAY" | "ROUND_TRIP";
        passengerCount: number;
        passengers: { fullName: string; nationality: string }[];
    };
}

/**
 * Process a chat message and return AI response.
 * If the AI determines all booking info is collected,
 * it returns structured bookingData via function calling.
 */
export async function processChatMessage(
    messages: ChatMessage[]
): Promise<ChatResponse> {
    const client = getOpenAIClient();
    if (!client) {
        return {
            message: "I'm sorry, the chatbot is currently unavailable. Please use the booking form at /dashboard/booking 📝",
        };
    }

    try {
        const today = new Date().toISOString().split("T")[0];
        const systemMessage = SYSTEM_PROMPT + `\n\nToday's Date: ${today}`;

        const response = await client.chat.completions.create({
            model: "google/gemini-2.0-flash-001",
            messages: [
                { role: "system", content: systemMessage },
                ...messages.map((m) => ({
                    role: m.role as "user" | "assistant",
                    content: m.content,
                })),
            ],
            functions: [EXTRACT_BOOKING_FUNCTION],
            function_call: "auto",
            temperature: 0.7,
            max_tokens: 500,
        });

        const choice = response.choices[0];

        // Check if AI called the function
        if (choice.message.function_call?.name === "create_booking") {
            const args = JSON.parse(choice.message.function_call.arguments);
            return {
                message: `✅ Booking is ready!\n\n📋 Summary:\n• Route: ${args.departureCity} → ${args.arrivalCity}\n• Date: ${args.departureDate}${args.returnDate ? ` — ${args.returnDate}` : ""}\n• Passengers: ${args.passengerCount}\n\nClick "Create Booking" below to proceed to payment.`,
                bookingData: args,
            };
        }

        return {
            message: choice.message.content || "Hmm, could you repeat that? 😅",
        };
    } catch (error) {
        console.error("[Chatbot] Error:", error);
        return {
            message: "Sorry, an error occurred. Please try again or use the form at /dashboard/booking 📝",
        };
    }
}
