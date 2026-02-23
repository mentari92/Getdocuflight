import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import AdminChatClient from "./AdminChatClient";

export default async function AdminChatPage() {
    const { error } = await requireAdmin();
    if (error) redirect("/dashboard");

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

    return <AdminChatClient conversations={JSON.parse(JSON.stringify(conversations))} />;
}
