"use client";

/**
 * FloatingChatWidget — Collapsible chat bubble in bottom-right corner.
 *
 * Wraps the booking chatbot in a floating panel that can be toggled
 * open/closed. Handles auth gracefully — redirects to login if unauthenticated.
 */

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Message {
    role: "user" | "assistant";
    content: string;
}

interface BookingData {
    departureCity: string;
    arrivalCity: string;
    departureDate: string;
    returnDate?: string;
    tripType: "ONE_WAY" | "ROUND_TRIP";
    passengerCount: number;
    passengers: { fullName: string; nationality: string }[];
}

export default function FloatingChatWidget() {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "assistant",
            content:
                "Halo! 👋 Selamat datang di GetDocuFlight.\n\nSaya bisa bantu kamu pesan dummy ticket untuk keperluan visa.\n\n1️⃣ **Isi di sini** — ceritakan rencana penerbangan kamu\n2️⃣ **Form Lengkap** — buka form booking langsung",
        },
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [bookingData, setBookingData] = useState<BookingData | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [hasUnread, setHasUnread] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Pulse the bubble after 3 seconds if not opened yet
    const [showPulse, setShowPulse] = useState(true);
    useEffect(() => {
        if (isOpen) setShowPulse(false);
    }, [isOpen]);

    const toggle = () => {
        setIsOpen((prev) => !prev);
        setHasUnread(false);
    };

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput("");

        const newMessages: Message[] = [
            ...messages,
            { role: "user", content: userMessage },
        ];
        setMessages(newMessages);
        setIsLoading(true);

        try {
            const response = await fetch("/api/chatbot", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: newMessages }),
            });

            if (response.status === 401) {
                setMessages([
                    ...newMessages,
                    {
                        role: "assistant",
                        content:
                            "Kamu perlu login dulu untuk menggunakan chatbot ini. 🔐\n\nKlik tombol di bawah untuk login.",
                    },
                ]);
                setIsLoading(false);
                return;
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed");
            }

            setMessages([
                ...newMessages,
                { role: "assistant", content: data.message },
            ]);

            if (!isOpen) setHasUnread(true);

            if (data.bookingData) {
                setBookingData(data.bookingData);
            }
        } catch {
            setMessages([
                ...newMessages,
                {
                    role: "assistant",
                    content: "Maaf, terjadi kesalahan. Coba lagi ya 😅",
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateBooking = async () => {
        if (!bookingData) return;
        setIsCreating(true);

        try {
            const response = await fetch("/api/bookings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...bookingData,
                    source: "CHATBOT",
                }),
            });

            if (response.status === 401) {
                router.push("/login");
                return;
            }

            const data = await response.json();
            if (!response.ok) throw new Error(data.error);

            router.push(`/dashboard/booking/${data.bookingId}`);
        } catch {
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: "Gagal membuat booking. Coba login dulu, lalu ulangi.",
                },
            ]);
            setIsCreating(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <>
            {/* ═══ Floating Chat Panel ═══ */}
            {isOpen && (
                <div
                    className="fixed bottom-24 right-5 w-[380px] max-w-[calc(100vw-40px)] bg-white rounded-2xl shadow-2xl border border-gray-200/80 z-[9999] flex flex-col overflow-hidden"
                    style={{
                        height: "min(520px, calc(100vh - 160px))",
                        animation: "chatSlideUp 0.3s ease-out",
                    }}
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-[#1a1a2e] to-[#16213e] px-4 py-3 flex items-center justify-between flex-shrink-0">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 bg-white/15 backdrop-blur rounded-full flex items-center justify-center text-sm">
                                ✈️
                            </div>
                            <div>
                                <p className="text-white text-sm font-bold leading-tight">
                                    GetDocuFlight AI
                                </p>
                                <div className="flex items-center gap-1">
                                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                                    <p className="text-white/60 text-[10px]">Online</p>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={toggle}
                            className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/80 hover:bg-white/20 hover:text-white transition-all cursor-pointer"
                            aria-label="Tutup chat"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 bg-gray-50/50">
                        {messages.map((msg, i) => (
                            <div
                                key={i}
                                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                                <div
                                    className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed whitespace-pre-wrap ${msg.role === "user"
                                            ? "bg-[#1a1a2e] text-white rounded-br-sm"
                                            : "bg-white text-gray-700 shadow-sm border border-gray-100 rounded-bl-sm"
                                        }`}
                                >
                                    {msg.content}
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-gray-100">
                                    <div className="flex gap-1.5">
                                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {bookingData && !isCreating && (
                            <div className="flex justify-center py-1">
                                <button
                                    onClick={handleCreateBooking}
                                    className="px-5 py-2.5 bg-green-500 hover:bg-green-600 text-white font-bold text-sm rounded-xl shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                                >
                                    ✈️ Buat Booking
                                </button>
                            </div>
                        )}

                        {isCreating && (
                            <div className="flex justify-center py-1">
                                <div className="px-5 py-2.5 bg-gray-100 text-gray-500 font-medium rounded-xl text-xs">
                                    ⏳ Membuat booking...
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Actions */}
                    <div className="px-3 py-2 border-t border-gray-100 bg-white flex gap-2 flex-shrink-0">
                        <button
                            onClick={() => {
                                setInput("Saya mau pesan dummy ticket");
                                setTimeout(sendMessage, 100);
                            }}
                            className="flex-1 py-2 text-[11px] font-semibold text-[#1a1a2e] bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-all cursor-pointer"
                        >
                            ✏️ Isi di Sini
                        </button>
                        <a
                            href="/dashboard/booking"
                            className="flex-1 py-2 text-[11px] font-semibold text-[#1a1a2e] bg-gray-50 hover:bg-gray-100 rounded-lg text-center border border-gray-200 transition-all"
                        >
                            📋 Form Lengkap
                        </a>
                    </div>

                    {/* Input */}
                    <div className="px-3 py-2.5 border-t border-gray-100 bg-white flex-shrink-0">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ketik pesan..."
                                disabled={isLoading || isCreating}
                                className="flex-1 px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1a1a2e]/20 focus:border-[#1a1a2e]/40 transition-all disabled:opacity-50"
                            />
                            <button
                                onClick={sendMessage}
                                disabled={!input.trim() || isLoading || isCreating}
                                className="w-10 h-10 bg-[#1a1a2e] text-white rounded-xl font-bold hover:bg-[#16213e] transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ Floating Bubble ═══ */}
            <button
                onClick={toggle}
                className="fixed bottom-6 right-5 w-14 h-14 bg-gradient-to-br from-[#1a1a2e] to-[#16213e] text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 z-[9999] flex items-center justify-center cursor-pointer group"
                aria-label={isOpen ? "Tutup chat" : "Buka chat"}
            >
                {/* Pulse ring */}
                {showPulse && !isOpen && (
                    <span className="absolute inset-0 rounded-full bg-[#1a1a2e]/40 animate-ping" />
                )}

                {/* Unread dot */}
                {hasUnread && !isOpen && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full border-2 border-white" />
                )}

                {/* Icon */}
                <span className={`text-xl transition-transform duration-300 ${isOpen ? "rotate-0" : "group-hover:scale-110"}`}>
                    {isOpen ? "✕" : "💬"}
                </span>
            </button>

            {/* ═══ Animation keyframes ═══ */}
            <style jsx global>{`
                @keyframes chatSlideUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px) scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
            `}</style>
        </>
    );
}
