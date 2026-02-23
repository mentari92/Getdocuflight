import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateChatReply } from "@/lib/openai";

// ── [H4 FIX] Input Sanitization ───────────────────────────
const MAX_CONTENT_LENGTH = 2000;
const VALID_SENDERS = ["visitor", "admin"] as const;

/**
 * Strip HTML tags to prevent XSS when displayed in admin panel.
 * Allows plain text only.
 */
function sanitizeContent(input: string): string {
    return input
        .replace(/<[^>]*>/g, "") // Strip HTML tags
        .replace(/&lt;/g, "<")   // Decode common entities for re-strip
        .replace(/<[^>]*>/g, "") // Second pass for decoded tags
        .trim();
}

// GET /api/livechat/messages?conversationId=xxx
export async function GET(req: NextRequest) {
    const conversationId = req.nextUrl.searchParams.get("conversationId");
    if (!conversationId) {
        return NextResponse.json(
            { error: "conversationId is required" },
            { status: 400 }
        );
    }

    const messages = await prisma.chatMessage.findMany({
        where: { conversationId },
        orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ messages });
}

// POST /api/livechat/messages
export async function POST(req: NextRequest) {
    const body = await req.json();
    const { conversationId, visitorId, visitorName, sender, content } = body;

    // [H4 FIX] Validate sender is a known value
    if (!content || !sender || !VALID_SENDERS.includes(sender)) {
        return NextResponse.json(
            { error: "Valid content and sender (visitor|admin) are required" },
            { status: 400 }
        );
    }

    // [H4 FIX] Sanitize and limit content length
    const sanitizedContent = sanitizeContent(content);
    if (!sanitizedContent) {
        return NextResponse.json(
            { error: "Content cannot be empty after sanitization" },
            { status: 400 }
        );
    }
    if (sanitizedContent.length > MAX_CONTENT_LENGTH) {
        return NextResponse.json(
            { error: `Content must be ${MAX_CONTENT_LENGTH} characters or less` },
            { status: 400 }
        );
    }

    // Sanitize visitor name too
    const safeName = visitorName
        ? sanitizeContent(visitorName).slice(0, 100)
        : "Visitor";

    let convId = conversationId;

    // If no conversation exists, create one (visitor starting a new chat)
    if (!convId && sender === "visitor") {
        if (!visitorId) {
            return NextResponse.json(
                { error: "visitorId is required for new conversations" },
                { status: 400 }
            );
        }

        // Check for existing open conversation from this visitor
        const existing = await prisma.chatConversation.findFirst({
            where: { visitorId, status: "OPEN" },
        });

        if (existing) {
            convId = existing.id;
        } else {
            const conv = await prisma.chatConversation.create({
                data: {
                    visitorId,
                    visitorName: safeName,
                },
            });
            convId = conv.id;
        }
    }

    if (!convId) {
        return NextResponse.json(
            { error: "conversationId is required" },
            { status: 400 }
        );
    }

    const message = await prisma.chatMessage.create({
        data: {
            conversationId: convId,
            sender,
            content: sanitizedContent,
        },
    });

    // Update conversation timestamp
    await prisma.chatConversation.update({
        where: { id: convId },
        data: { updatedAt: new Date() },
    });

    // --- AI AUTO-REPLY LOGIC ---
    if (sender === "visitor") {
        // Run AI reply asynchronously so response isn't blocked
        (async () => {
            try {
                // Fetch recent context (last 10 messages)
                const recent = await prisma.chatMessage.findMany({
                    where: { conversationId: convId },
                    orderBy: { createdAt: "desc" },
                    take: 10,
                });

                // Format for OpenAI
                const history = recent.reverse().map((msg) => ({
                    role: (msg.sender === "visitor" ? "user" : "assistant") as "user" | "assistant",
                    content: msg.content,
                }));

                // Get AI Reply
                const aiReply = await generateChatReply(history);

                // Save AI reply
                await prisma.chatMessage.create({
                    data: {
                        conversationId: convId,
                        sender: "admin", // Chatbot acts as the admin
                        content: aiReply,
                    },
                });

                // Update timestamp again
                await prisma.chatConversation.update({
                    where: { id: convId },
                    data: { updatedAt: new Date() },
                });
            } catch (error) {
                console.error("AI Auto-Reply error:", error);
            }
        })();
    }

    return NextResponse.json({ message, conversationId: convId });
}
