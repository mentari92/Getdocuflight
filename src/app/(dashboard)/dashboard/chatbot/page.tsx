import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import BookingChatbot from "@/components/booking/BookingChatbot";

export const metadata = {
    title: "AI Booking Assistant — GetDocuFlight",
    description: "Pesan dummy ticket lewat AI chatbot.",
};

export default async function ChatbotPage() {
    const session = await auth();
    if (!session?.user?.id) {
        redirect("/login");
    }

    return (
        <div className="min-h-screen bg-white flex flex-col">
            {/* Nav */}
            <nav className="bg-surface border-b border-gold-border/50 sticky top-0 z-50">
                <div className="max-w-lg mx-auto px-4">
                    <div className="flex items-center justify-between h-14">
                        <a
                            href="/dashboard"
                            className="text-sm text-muted hover:text-heading transition-colors flex items-center gap-1"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                            Dashboard
                        </a>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-sm font-semibold text-heading">
                                AI Assistant
                            </span>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Chatbot */}
            <main className="flex-1">
                <BookingChatbot />
            </main>
        </div>
    );
}
