"use client";

import { SessionProvider, useSession } from "next-auth/react";
import posthog from "posthog-js";
import { useEffect } from "react";
import { initPostHog } from "@/instrumentation-client";

function PostHogIdentify() {
    const { data: session } = useSession();

    useEffect(() => {
        // Initialize PostHog on first mount
        initPostHog();
    }, []);

    useEffect(() => {
        if (session?.user?.id || session?.user?.email) {
            posthog.identify(session.user.id || session.user.email!, {
                email: session.user.email,
                name: session.user.name,
            });
        }
    }, [session]);

    return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <PostHogIdentify />
            {children}
        </SessionProvider>
    );
}
