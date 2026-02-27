"use client";

import { usePathname } from "next/navigation";
import LiveChatWrapper from "@/components/livechat/LiveChatWrapper";

export default function GlobalLiveChat() {
    const pathname = usePathname();

    // Do not show the chat bubble on admin, login, or register pages
    if (
        pathname?.startsWith("/admin") ||
        pathname?.startsWith("/login") ||
        pathname?.startsWith("/register")
    ) {
        return null;
    }

    return <LiveChatWrapper />;
}
