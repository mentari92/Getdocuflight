import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

// GET /api/livechat/conversations — admin only
export async function GET() {
    const { error } = await requireAdmin();
    if (error) {
        return NextResponse.json({ error: error.error }, { status: error.status });
    }

    const conversations = await prisma.chatConversation.findMany({
        include: {
            messages: {
                orderBy: { createdAt: "desc" },
                take: 1,
            },
            _count: { select: { messages: true } },
        },
        orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ conversations });
}
