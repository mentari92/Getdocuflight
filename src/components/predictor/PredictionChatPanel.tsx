"use client";

import { useState, useRef, useEffect } from "react";

import { PlaneTakeoff } from "lucide-react";

interface Message {
    role: "user" | "assistant";
    content: string;
}

export default function PredictionChatPanel({ predictionId }: { predictionId: string }) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const SUGGESTED_QUESTIONS = [
        "What is the biggest weakness in my profile?",
        "How can I improve my financial score?",
        "What documents are most critical for this visa?",
    ];

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async (text: string = input) => {
        if (!text.trim() || loading) return;

        const userMsg = text.trim();
        if (text === input) setInput("");
        setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
        setLoading(true);

        try {
            const res = await fetch(`/api/predictions/${predictionId}/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: [...messages, { role: "user", content: userMsg }].map(m => ({
                        role: m.role,
                        content: m.content
                    }))
                }),
            });

            const data = await res.json();
            if (data.message) {
                setMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
            }
        } catch (error) {
            console.error("Chat error:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-surface border border-gold-border/50 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-gold-border/30 bg-[#1a1a2e] flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                        <PlaneTakeoff className="w-5 h-5 text-primary" strokeWidth={2.5} />
                    </div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wide">Visa Assist</h3>
                </div>
                <span className="px-2 py-0.5 bg-white/10 text-white/80 text-[10px] font-bold rounded-full uppercase tracking-tighter">
                    Premium Support
                </span>
            </div>

            <div
                ref={scrollRef}
                className="h-[350px] overflow-y-auto p-5 space-y-4 bg-cream/30"
            >
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-60">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                            <span className="text-2xl">👋</span>
                        </div>
                        <p className="text-xs text-muted max-w-[200px]">
                            Ask me anything about your prediction. How can I help you today?
                        </p>
                    </div>
                )}
                {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm ${m.role === "user"
                            ? "bg-primary text-white rounded-tr-none"
                            : "bg-white border border-gold-border/30 text-body rounded-tl-none shadow-sm"
                            }`}>
                            {m.content}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-white border border-gold-border/30 px-4 py-2.5 rounded-2xl rounded-tl-none shadow-sm space-x-1 flex">
                            <div className="w-1.5 h-1.5 bg-gold-border rounded-full animate-bounce" />
                            <div className="w-1.5 h-1.5 bg-gold-border rounded-full animate-bounce [animation-delay:0.2s]" />
                            <div className="w-1.5 h-1.5 bg-gold-border rounded-full animate-bounce [animation-delay:0.4s]" />
                        </div>
                    </div>
                )}
            </div>

            <div className="p-4 bg-white border-t border-gold-border/20">
                {messages.length === 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
                        {SUGGESTED_QUESTIONS.map((q, i) => (
                            <button
                                key={i}
                                onClick={() => handleSend(q)}
                                disabled={loading}
                                className="whitespace-nowrap px-3 py-1.5 text-xs font-semibold text-primary bg-primary-50 border border-primary-200 rounded-lg hover:bg-primary-100 transition-colors disabled:opacity-50 flex-shrink-0"
                            >
                                {q}
                            </button>
                        ))}
                    </div>
                )}
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                        placeholder="Type your question..."
                        className="flex-1 bg-cream/50 border border-gold-border/30 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted"
                    />
                    <button
                        onClick={() => handleSend(input)}
                        disabled={loading || !input.trim()}
                        className="bg-primary text-white w-10 h-10 rounded-xl flex items-center justify-center hover:bg-primary-dark transition-colors disabled:opacity-50"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
