import { NextResponse } from "next/server";
import { generateItinerary } from "@/lib/openai";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
    console.log("Itinerary API triggered");
    try {
        const session = await auth();
        console.log("Session resolved:", session ? session.user?.email : "No session");

        const body = await req.json();
        const { destination, duration, email } = body;
        console.log("Received params:", { destination, duration, email });

        if (!destination || !duration) {
            return NextResponse.json(
                { error: "Destination and Duration are required" },
                { status: 400 }
            );
        }

        // 1. Get IP address for tracking
        const forwarded = req.headers.get("x-forwarded-for");
        const ip = forwarded?.split(",")[0]?.trim() || "unknown";

        // 2. Call OpenAI Library
        console.log("Calling OpenAI for itinerary...");
        const result = await generateItinerary(destination, duration);
        console.log("OpenAI result received");

        // 3. Log usage (Engagement Tracking) - Non-blocking
        prisma.freeToolsUsage.create({
            data: {
                userId: session?.user?.id || null,
                toolType: "ITINERARY",
                email: email || session?.user?.email || null,
                ipAddress: ip,
                params: { destination, duration },
            },
        }).then(() => console.log("Usage logged to DB"))
            .catch((err) => console.error("Database logging failed:", err));

        return NextResponse.json(result);
    } catch (error) {
        console.error("API Route Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
