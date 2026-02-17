import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import redis from "@/lib/redis";

// ── Rate Limiting ──────────────────────────────────────────
const RATE_LIMIT_MAX = 5;         // max attempts
const RATE_LIMIT_WINDOW = 900;    // 15 minutes in seconds

async function isRateLimited(ip: string): Promise<boolean> {
    const key = `ratelimit:register:${ip}`;
    const current = await redis.incr(key);
    if (current === 1) {
        await redis.expire(key, RATE_LIMIT_WINDOW);
    }
    return current > RATE_LIMIT_MAX;
}

// ── Validation Schema ──────────────────────────────────────
const registerSchema = z
    .object({
        email: z.string().email("Please enter a valid email address."),
        password: z
            .string()
            .min(8, "Password must be at least 8 characters.")
            .regex(/[A-Z]/, "Password must contain at least 1 uppercase letter.")
            .regex(/[0-9]/, "Password must contain at least 1 number."),
        confirmPassword: z.string(),
        name: z.string().min(2, "Name must be at least 2 characters.").optional(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match.",
        path: ["confirmPassword"],
    });

export async function POST(request: Request) {
    try {
        // Rate limiting by IP
        const forwarded = request.headers.get("x-forwarded-for");
        const ip = forwarded?.split(",")[0]?.trim() || "unknown";

        if (await isRateLimited(ip)) {
            return NextResponse.json(
                { error: "Too many registration attempts. Please try again later." },
                { status: 429 }
            );
        }

        const body = await request.json();
        const validation = registerSchema.safeParse(body);

        if (!validation.success) {
            const fieldErrors = validation.error.flatten().fieldErrors;
            return NextResponse.json(
                { error: "Validation failed.", details: fieldErrors },
                { status: 400 }
            );
        }

        const { email, password, name } = validation.data;

        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: "An account with this email already exists." },
                { status: 409 }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name: name || null,
            },
        });

        // Security: Do NOT return user ID or email in the response
        return NextResponse.json(
            { message: "Account created successfully." },
            { status: 201 }
        );
    } catch {
        return NextResponse.json(
            { error: "Something went wrong. Please try again." },
            { status: 500 }
        );
    }
}
