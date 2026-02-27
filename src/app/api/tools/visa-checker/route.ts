import { NextResponse } from "next/server";
import { checkVisaRequirements } from "@/lib/openai";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
    console.log("Visa Checker API triggered");
    try {
        const session = await auth();
        console.log("Session resolved:", session ? session.user?.email : "No session");

        const body = await req.json();
        const { nationality, destination, duration, email } = body;
        console.log("Received params:", { nationality, destination, duration, email });

        if (!nationality || !destination) {
            return NextResponse.json(
                { error: "Nationality and Destination are required" },
                { status: 400 }
            );
        }

        // 1. Get IP address for tracking
        const forwarded = req.headers.get("x-forwarded-for");
        const ip = forwarded?.split(",")[0]?.trim() || "unknown";

        // 2. Call OpenAI Library
        console.log("Calling OpenAI for visa requirements...");
        const result = await checkVisaRequirements(nationality, destination, duration);
        console.log("OpenAI result received");

        // 3. Log usage (Lead Generation) - Non-blocking
        const logUsage = async () => {
            try {
                const userId = session?.user?.id;
                let validUserId = null;
                if (userId) {
                    const u = await prisma.user.findUnique({ where: { id: userId } });
                    if (u) validUserId = userId;
                }

                await prisma.freeToolsUsage.create({
                    data: {
                        userId: validUserId,
                        toolType: "VISA_CHECKER",
                        email: email || session?.user?.email || null,
                        ipAddress: ip,
                        params: { nationality, destination, duration },
                    },
                });
                console.log("Usage logged to DB");
            } catch (err) {
                console.error("Database logging failed:", err);
            }
        };

        logUsage();

        return NextResponse.json(result);
    } catch (error) {
        console.error("API Route Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
