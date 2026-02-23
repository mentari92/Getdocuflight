import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { redis } from "@/lib/redis";
import { authConfig } from "./auth.config";

// ── [H2 FIX] Login Rate Limiting ──────────────────────────
const LOGIN_RATE_LIMIT_MAX = 5;
const LOGIN_RATE_LIMIT_WINDOW = 900; // 15 minutes

async function checkLoginRateLimit(email: string): Promise<boolean> {
    const key = `ratelimit:login:${email.toLowerCase()}`;
    try {
        const current = await redis.incr(key);
        if (current === 1) {
            await redis.expire(key, LOGIN_RATE_LIMIT_WINDOW);
        }
        return current <= LOGIN_RATE_LIMIT_MAX;
    } catch (err) {
        console.error("Redis error in checkLoginRateLimit:", err);
        return true; // Fallback to allow login if Redis is down
    }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    adapter: PrismaAdapter(prisma),
    session: { strategy: "jwt" },
    providers: [
        Credentials({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Email and password are required.");
                }

                const email = credentials.email as string;

                // [H2 FIX] Rate limit login attempts by email
                const allowed = await checkLoginRateLimit(email);
                if (!allowed) {
                    throw new Error("Too many login attempts. Please wait 15 minutes.");
                }

                const user = await prisma.user.findUnique({
                    where: { email },
                });

                if (!user || !user.password) {
                    throw new Error("Incorrect email or password.");
                }

                const passwordMatch = await bcrypt.compare(
                    credentials.password as string,
                    user.password
                );

                if (!passwordMatch) {
                    throw new Error("Incorrect email or password.");
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                };
            },
        }),
    ],
});
