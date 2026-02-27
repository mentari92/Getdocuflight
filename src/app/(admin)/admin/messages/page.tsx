import { prisma } from "@/lib/db";
import { format } from "date-fns";
import { revalidatePath } from "next/cache";

export default async function AdminMessagesPage() {
    // Type casting to any to bypass Prisma client sync issues until DB is reachable
    const messages = await (prisma as any).contactMessage.findMany({
        orderBy: { createdAt: "desc" },
    });

    async function markAsRead(formData: FormData) {
        "use server";
        const id = formData.get("id") as string;
        await (prisma as any).contactMessage.update({
            where: { id },
            data: { status: "READ" },
        });
        revalidatePath("/admin/messages");
    }

    async function deleteMessage(formData: FormData) {
        "use server";
        const id = formData.get("id") as string;
        await (prisma as any).contactMessage.delete({
            where: { id },
        });
        revalidatePath("/admin/messages");
    }

    return (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-extrabold text-heading font-heading">Contact Messages</h1>
                    <p className="text-muted text-sm">Manage inquiries from the contact form</p>
                </div>
            </div>

            {messages.length === 0 ? (
                <div className="bg-surface border border-gold-border/30 rounded-2xl p-12 text-center">
                    <p className="text-muted">No messages yet.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {messages.map((msg: any) => (
                        <div
                            key={msg.id}
                            className={`p-6 rounded-2xl border transition-all ${msg.status === "UNREAD"
                                    ? "bg-white border-primary/30 shadow-sm"
                                    : "bg-surface/50 border-gold-border/20 opacity-80"
                                }`}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="font-bold text-heading">{msg.name}</h3>
                                        <span className="text-xs text-muted">•</span>
                                        <a href={`mailto:${msg.email}`} className="text-xs text-primary font-medium hover:underline">
                                            {msg.email}
                                        </a>
                                        {msg.status === "UNREAD" && (
                                            <span className="ml-2 px-2 py-0.5 bg-primary text-[10px] text-white font-bold rounded-full">
                                                NEW
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted">
                                        {format(new Date(msg.createdAt), "PPP p")}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    {msg.status === "UNREAD" && (
                                        <form action={markAsRead}>
                                            <input type="hidden" name="id" value={msg.id} />
                                            <button className="text-xs font-bold text-primary hover:text-primary-dark transition-colors">
                                                Mark as Read
                                            </button>
                                        </form>
                                    )}
                                    <form action={deleteMessage}>
                                        <input type="hidden" name="id" value={msg.id} />
                                        <button className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors">
                                            Delete
                                        </button>
                                    </form>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <p className="text-sm font-bold text-heading">Subject: {msg.subject}</p>
                                <p className="text-sm text-body whitespace-pre-wrap bg-surface/30 p-4 rounded-xl border border-gold-border/10">
                                    {msg.message}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </main>
    );
}
