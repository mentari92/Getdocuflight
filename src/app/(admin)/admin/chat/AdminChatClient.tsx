"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface Message {
    id: string;
    sender: string;
    content: string;
    createdAt: string;
}

interface Conversation {
    id: string;
    visitorId: string;
    visitorName: string | null;
    status: string;
    createdAt: string;
    updatedAt: string;
    messages: Message[];
    _count: { messages: number };
}

export default function AdminChatClient({
    conversations: initialConvs,
}: {
    conversations: Conversation[];
}) {
    const [conversations, setConversations] = useState(initialConvs);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [reply, setReply] = useState("");
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const selected = conversations.find((c) => c.id === selectedId);

    const fetchMessages = useCallback(async () => {
        if (!selectedId) return;
        try {
            const res = await fetch(
                `/api/livechat/messages?conversationId=${selectedId}`
            );
            if (res.ok) {
                const data = await res.json();
                setMessages(data.messages || []);
            }
        } catch {
            // silent
        }
    }, [selectedId]);

    const refreshConversations = useCallback(async () => {
        try {
            const res = await fetch("/api/livechat/conversations");
            if (res.ok) {
                const data = await res.json();
                setConversations(data.conversations || []);
            }
        } catch {
            // silent
        }
    }, []);

    useEffect(() => {
        if (selectedId) {
            fetchMessages();
            pollRef.current = setInterval(() => {
                fetchMessages();
                refreshConversations();
            }, 4000);
        }
        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, [selectedId, fetchMessages, refreshConversations]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Also poll conversations list
    useEffect(() => {
        const interval = setInterval(refreshConversations, 8000);
        return () => clearInterval(interval);
    }, [refreshConversations]);

    const handleReply = async () => {
        if (!reply.trim() || !selectedId || sending) return;
        setSending(true);
        try {
            const res = await fetch("/api/livechat/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    conversationId: selectedId,
                    sender: "admin",
                    content: reply.trim(),
                }),
            });
            if (res.ok) {
                setReply("");
                await fetchMessages();
            }
        } catch {
            // silent
        } finally {
            setSending(false);
        }
    };

    return (
        <div style={{ display: "flex", height: "calc(100vh - 64px)", background: "#f9fafb" }}>
            {/* Conversation List */}
            <div
                style={{
                    width: "320px",
                    borderRight: "1px solid #e5e7eb",
                    overflowY: "auto",
                    background: "#fff",
                }}
            >
                <div
                    style={{
                        padding: "16px 20px",
                        borderBottom: "1px solid #e5e7eb",
                        fontWeight: 700,
                        fontSize: "16px",
                        color: "#1a1a2e",
                    }}
                >
                    💬 Live Chat ({conversations.length})
                </div>

                {conversations.length === 0 && (
                    <div style={{ padding: "40px 20px", textAlign: "center", color: "#999", fontSize: "14px" }}>
                        No conversations yet. Messages from visitors will appear here.
                    </div>
                )}

                {conversations.map((conv) => (
                    <div
                        key={conv.id}
                        onClick={() => setSelectedId(conv.id)}
                        style={{
                            padding: "14px 20px",
                            borderBottom: "1px solid #f3f4f6",
                            cursor: "pointer",
                            background: selectedId === conv.id ? "#eef2ff" : "#fff",
                            transition: "background 0.15s",
                        }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontWeight: 600, fontSize: "14px", color: "#1a1a2e" }}>
                                {conv.visitorName || "Visitor"}
                            </span>
                            <span
                                style={{
                                    fontSize: "10px",
                                    padding: "2px 8px",
                                    borderRadius: "10px",
                                    background: conv.status === "OPEN" ? "#dcfce7" : "#f3f4f6",
                                    color: conv.status === "OPEN" ? "#16a34a" : "#9ca3af",
                                    fontWeight: 600,
                                }}
                            >
                                {conv.status}
                            </span>
                        </div>
                        <div style={{ fontSize: "12px", color: "#999", marginTop: "4px" }}>
                            {conv.messages[0]?.content
                                ? conv.messages[0].content.substring(0, 50) + (conv.messages[0].content.length > 50 ? "..." : "")
                                : "No messages yet"}
                        </div>
                        <div style={{ fontSize: "11px", color: "#ccc", marginTop: "2px" }}>
                            {conv._count.messages} messages · {new Date(conv.updatedAt).toLocaleDateString()}
                        </div>
                    </div>
                ))}
            </div>

            {/* Chat Area */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                {!selectedId ? (
                    <div
                        style={{
                            flex: 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#999",
                            fontSize: "15px",
                        }}
                    >
                        <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: "48px", marginBottom: "12px" }}>💬</div>
                            Select a conversation to start replying
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Chat Header */}
                        <div
                            style={{
                                padding: "14px 20px",
                                borderBottom: "1px solid #e5e7eb",
                                background: "#fff",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}
                        >
                            <div>
                                <div style={{ fontWeight: 700, fontSize: "15px", color: "#1a1a2e" }}>
                                    {selected?.visitorName || "Visitor"}
                                </div>
                                <div style={{ fontSize: "12px", color: "#999" }}>
                                    ID: {selected?.visitorId?.substring(0, 12)}...
                                </div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div
                            style={{
                                flex: 1,
                                overflowY: "auto",
                                padding: "16px 20px",
                                display: "flex",
                                flexDirection: "column",
                                gap: "8px",
                            }}
                        >
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    style={{
                                        display: "flex",
                                        justifyContent: msg.sender === "admin" ? "flex-end" : "flex-start",
                                    }}
                                >
                                    <div
                                        style={{
                                            maxWidth: "70%",
                                            padding: "10px 14px",
                                            borderRadius:
                                                msg.sender === "admin"
                                                    ? "14px 14px 4px 14px"
                                                    : "14px 14px 14px 4px",
                                            background: msg.sender === "admin" ? "#4f46e5" : "#f3f4f6",
                                            color: msg.sender === "admin" ? "#fff" : "#1a1a2e",
                                            fontSize: "14px",
                                            lineHeight: "1.4",
                                        }}
                                    >
                                        <div style={{ fontSize: "11px", fontWeight: 600, opacity: 0.6, marginBottom: "2px" }}>
                                            {msg.sender === "admin" ? "You" : selected?.visitorName || "Visitor"}
                                        </div>
                                        {msg.content}
                                        <div style={{ fontSize: "10px", opacity: 0.5, marginTop: "4px", textAlign: "right" }}>
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

                        {/* Reply Input */}
                        <div
                            style={{
                                padding: "12px 20px",
                                borderTop: "1px solid #e5e7eb",
                                background: "#fff",
                                display: "flex",
                                gap: "8px",
                            }}
                        >
                            <input
                                type="text"
                                value={reply}
                                onChange={(e) => setReply(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleReply()}
                                placeholder="Type your reply..."
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
                                onClick={handleReply}
                                disabled={sending || !reply.trim()}
                                style={{
                                    padding: "10px 20px",
                                    background: sending ? "#9ca3af" : "#4f46e5",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: "10px",
                                    fontWeight: 700,
                                    fontSize: "14px",
                                    cursor: sending ? "not-allowed" : "pointer",
                                }}
                            >
                                {sending ? "..." : "Reply"}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
