"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { PlaneTakeoff } from "lucide-react";

interface Message {
    id: string;
    sender: string;
    content: string;
    createdAt: string;
}

function getVisitorId(): string {
    if (typeof window === "undefined") return "";
    let id = localStorage.getItem("docuflight_visitor_id");
    if (!id) {
        id = "v_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
        localStorage.setItem("docuflight_visitor_id", id);
    }
    return id;
}

export default function LiveChat() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [sending, setSending] = useState(false);
    const [visitorName, setVisitorName] = useState("");
    const [nameSet, setNameSet] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    // Poll for new messages
    const fetchMessages = useCallback(async () => {
        if (!conversationId) return;
        try {
            const res = await fetch(
                `/api/livechat/messages?conversationId=${conversationId}`
            );
            if (res.ok) {
                const data = await res.json();
                setMessages(data.messages || []);
            }
        } catch {
            // silent
        }
    }, [conversationId]);

    useEffect(() => {
        if (isOpen && conversationId) {
            fetchMessages();
            pollRef.current = setInterval(fetchMessages, 4000);
        }
        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, [isOpen, conversationId, fetchMessages]);

    // Handle global toggle event
    useEffect(() => {
        const handleToggle = (e: any) => {
            if (e.detail && typeof e.detail.open === "boolean") {
                setIsOpen(e.detail.open);
            } else {
                setIsOpen((prev) => !prev);
            }
        };
        window.addEventListener("toggle-live-chat", handleToggle);
        return () => window.removeEventListener("toggle-live-chat", handleToggle);
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    // Try to restore conversationId from localStorage
    useEffect(() => {
        const saved = localStorage.getItem("docuflight_conv_id");
        if (saved) setConversationId(saved);
        const savedName = localStorage.getItem("docuflight_visitor_name");
        if (savedName) {
            setVisitorName(savedName);
            setNameSet(true);
        }
    }, []);

    const handleSetName = () => {
        if (!visitorName.trim()) return;
        localStorage.setItem("docuflight_visitor_name", visitorName.trim());
        setNameSet(true);
    };

    const handleSend = async () => {
        if (!input.trim() || sending) return;
        setSending(true);

        try {
            const res = await fetch("/api/livechat/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    conversationId,
                    visitorId: getVisitorId(),
                    visitorName: visitorName || "Visitor",
                    sender: "visitor",
                    content: input.trim(),
                }),
            });

            if (res.ok) {
                const data = await res.json();
                if (data.conversationId && !conversationId) {
                    setConversationId(data.conversationId);
                    localStorage.setItem("docuflight_conv_id", data.conversationId);
                }
                setInput("");
                await fetchMessages();
            }
        } catch {
            // silent
        } finally {
            setSending(false);
        }
    };

    return (
        <>
            {/* Chat Window */}
            {isOpen && (
                <div
                    style={{
                        position: "fixed",
                        bottom: "88px",
                        right: "20px",
                        width: "370px",
                        maxWidth: "calc(100vw - 40px)",
                        height: "500px",
                        maxHeight: "calc(100vh - 120px)",
                        background: "#fff",
                        borderRadius: "16px",
                        boxShadow: "0 8px 40px rgba(0,0,0,0.15)",
                        display: "flex",
                        flexDirection: "column",
                        zIndex: 9999,
                        overflow: "hidden",
                    }}
                >
                    {/* Header */}
                    <div
                        style={{
                            background: "#1a1a2e",
                            color: "#fff",
                            padding: "16px 20px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '32px', height: '32px', background: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <PlaneTakeoff size={18} color="#9333ea" strokeWidth={2.5} />
                            </div>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: "15px" }}>
                                    GetDocuFlight Support
                                </div>
                                <div style={{ fontSize: "12px", opacity: 0.7 }}>
                                    We typically reply within minutes
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            style={{
                                background: "none",
                                border: "none",
                                color: "#fff",
                                fontSize: "20px",
                                cursor: "pointer",
                                padding: "4px",
                            }}
                        >
                            ✕
                        </button>
                    </div>

                    {/* Name Input (first time) */}
                    {!nameSet ? (
                        <div
                            style={{
                                flex: 1,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "24px",
                                gap: "12px",
                            }}
                        >
                            <div style={{ fontSize: "40px" }}>👋</div>
                            <h3
                                style={{
                                    fontSize: "18px",
                                    fontWeight: 700,
                                    color: "#1a1a2e",
                                    margin: 0,
                                }}
                            >
                                Welcome!
                            </h3>
                            <p
                                style={{
                                    fontSize: "14px",
                                    color: "#666",
                                    textAlign: "center",
                                    margin: 0,
                                }}
                            >
                                Please enter your name to start chatting with our team.
                            </p>
                            <input
                                type="text"
                                value={visitorName}
                                onChange={(e) => setVisitorName(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSetName()}
                                placeholder="Your name..."
                                style={{
                                    width: "100%",
                                    padding: "12px 16px",
                                    border: "2px solid #e5e7eb",
                                    borderRadius: "10px",
                                    fontSize: "14px",
                                    outline: "none",
                                }}
                            />
                            <button
                                onClick={handleSetName}
                                style={{
                                    width: "100%",
                                    padding: "12px",
                                    background: "#1a1a2e",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: "10px",
                                    fontWeight: 700,
                                    fontSize: "14px",
                                    cursor: "pointer",
                                }}
                            >
                                Start Chat
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Messages */}
                            <div
                                style={{
                                    flex: 1,
                                    overflowY: "auto",
                                    padding: "16px",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "8px",
                                }}
                            >
                                {messages.length === 0 && (
                                    <div
                                        style={{
                                            textAlign: "center",
                                            color: "#999",
                                            fontSize: "13px",
                                            padding: "40px 16px",
                                        }}
                                    >
                                        <div style={{ fontSize: "32px", marginBottom: "8px" }}>
                                            💬
                                        </div>
                                        Hi {visitorName}! How can we help you today?
                                        <br />
                                        You can also use our{" "}
                                        <a
                                            href="/order"
                                            style={{
                                                color: "#1a1a2e",
                                                fontWeight: 700,
                                                textDecoration: "underline",
                                            }}
                                        >
                                            Order Form
                                        </a>{" "}
                                        to get your professional itinerary plans immediately.
                                    </div>
                                )}

                                {messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        style={{
                                            display: "flex",
                                            justifyContent:
                                                msg.sender === "visitor" ? "flex-end" : "flex-start",
                                        }}
                                    >
                                        <div
                                            style={{
                                                maxWidth: "80%",
                                                padding: "10px 14px",
                                                borderRadius:
                                                    msg.sender === "visitor"
                                                        ? "14px 14px 4px 14px"
                                                        : "14px 14px 14px 4px",
                                                background:
                                                    msg.sender === "visitor" ? "#1a1a2e" : "#f3f4f6",
                                                color: msg.sender === "visitor" ? "#fff" : "#1a1a2e",
                                                fontSize: "14px",
                                                lineHeight: "1.4",
                                            }}
                                        >
                                            {msg.sender === "admin" && (
                                                <div
                                                    style={{
                                                        fontSize: "11px",
                                                        fontWeight: 700,
                                                        color: "#6366f1",
                                                        marginBottom: "2px",
                                                    }}
                                                >
                                                    Support Team
                                                </div>
                                            )}
                                            {msg.content}
                                            <div
                                                style={{
                                                    fontSize: "10px",
                                                    opacity: 0.5,
                                                    marginTop: "4px",
                                                    textAlign: "right",
                                                }}
                                            >
                                                {new Date(msg.createdAt).toLocaleTimeString([], {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <div
                                style={{
                                    padding: "12px 16px",
                                    borderTop: "1px solid #e5e7eb",
                                    display: "flex",
                                    gap: "8px",
                                }}
                            >
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                                    placeholder="Type a message..."
                                    style={{
                                        flex: 1,
                                        padding: "10px 14px",
                                        border: "1px solid #e5e7eb",
                                        borderRadius: "10px",
                                        fontSize: "14px",
                                        outline: "none",
                                    }}
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={sending || !input.trim()}
                                    style={{
                                        padding: "10px 16px",
                                        background: sending ? "#9ca3af" : "#1a1a2e",
                                        color: "#fff",
                                        border: "none",
                                        borderRadius: "10px",
                                        fontWeight: 700,
                                        fontSize: "14px",
                                        cursor: sending ? "not-allowed" : "pointer",
                                    }}
                                >
                                    {sending ? "..." : "Send"}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Floating Bubble */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    position: "fixed",
                    bottom: "20px",
                    right: "20px",
                    width: "60px",
                    height: "60px",
                    borderRadius: "50%",
                    background: "#1a1a2e",
                    color: "#fff",
                    border: "none",
                    boxShadow: "0 4px 20px rgba(26,26,46,0.3)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "24px",
                    zIndex: 9998,
                    transition: "transform 0.2s, box-shadow 0.2s",
                }}
                onMouseOver={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.1)";
                    (e.currentTarget as HTMLButtonElement).style.boxShadow =
                        "0 6px 28px rgba(26,26,46,0.4)";
                }}
                onMouseOut={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
                    (e.currentTarget as HTMLButtonElement).style.boxShadow =
                        "0 4px 20px rgba(26,26,46,0.3)";
                }}
                aria-label="Open live chat"
            >
                {isOpen ? "✕" : "💬"}
            </button>
        </>
    );
}
