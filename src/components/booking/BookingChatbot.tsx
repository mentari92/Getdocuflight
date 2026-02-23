"use client";

/**
 * BookingChatbot — Conversational booking interface.
 *
 * AI chatbot collects flight info via natural conversation.
 * When all data is collected, shows "Create Booking" button.
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

export default function BookingChatbot() {
    const router = useRouter();
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "assistant",
            content:
                "Hi! 👋 I can help you order a dummy ticket.\n\nWant to fill in here (chat), or use the full form?\n\n1️⃣ Fill in here — tell me your flight plans\n2️⃣ Full Form — /order",
        },
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [bookingData, setBookingData] = useState<BookingData | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

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

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed");
            }

            setMessages([
                ...newMessages,
                { role: "assistant", content: data.message },
            ]);

            if (data.bookingData) {
                setBookingData(data.bookingData);
            }
        } catch {
            setMessages([
                ...newMessages,
                {
                    role: "assistant",
                    content: "Sorry, something went wrong. Please try again 😅",
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

            const data = await response.json();
            if (!response.ok) throw new Error(data.error);

            router.push(`/order/${data.bookingId}`);
        } catch {
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: "Failed to create booking. Please try again.",
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
        <div className="flex flex-col h-[calc(100vh-120px)] max-w-lg mx-auto">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                {messages.map((msg, i) => (
                    <div
                        key={i}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                        <div
                            className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${msg.role === "user"
                                ? "bg-primary text-white rounded-br-md"
                                : "bg-surface text-body rounded-bl-md"
                                }`}
                        >
                            {msg.content}
                        </div>
                    </div>
                ))}

                {/* Typing indicator */}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-surface rounded-2xl rounded-bl-md px-4 py-3">
                            <div className="flex gap-1.5">
                                <span className="w-2 h-2 bg-muted rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                <span className="w-2 h-2 bg-muted rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                <span className="w-2 h-2 bg-muted rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                            </div>
                        </div>
                    </div>
                )}

                {/* Create Booking Button */}
                {bookingData && !isCreating && (
                    <div className="flex justify-center py-2">
                        <button
                            onClick={handleCreateBooking}
                            className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                        >
                            ✈️ Create Booking
                        </button>
                    </div>
                )}

                {isCreating && (
                    <div className="flex justify-center py-2">
                        <div className="px-6 py-3 bg-gray-100 text-gray-500 font-medium rounded-xl text-sm">
                            ⏳ Creating booking...
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-gold-border/50 bg-white p-3">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message..."
                        disabled={isLoading || isCreating}
                        className="flex-1 px-4 py-3 border border-gold-border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all disabled:opacity-50"
                    />
                    <button
                        onClick={sendMessage}
                        disabled={!input.trim() || isLoading || isCreating}
                        className="px-5 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                        ↑
                    </button>
                </div>
                <div className="flex justify-center mt-2">
                    <a
                        href="/order"
                        className="text-xs text-primary hover:underline"
                    >
                        Or use the full form →
                    </a>
                </div>
            </div>
        </div>
    );
}
