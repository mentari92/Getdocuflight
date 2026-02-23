import type { NextAuthConfig } from "next-auth";

export const authConfig = {
    pages: {
        signIn: "/login",
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                // [ADMIN BYPASS] Force admin for Mentari
                if (user.email === "mentaribisnis92@gmail.com") {
                    token.role = "ADMIN";
                } else {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    token.role = (user as any).role || "USER";
                }
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
            }
            return session;
        },
    },
    providers: [], // Configured in auth.ts
} satisfies NextAuthConfig;
