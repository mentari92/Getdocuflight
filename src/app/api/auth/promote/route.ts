import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json(
                { error: "Authentication required. Please log in first." },
                { status: 401 }
            );
        }

        const user = await prisma.user.update({
            where: { email: session.user.email },
            data: { role: "ADMIN" },
        });

        return NextResponse.json({
            success: true,
            message: `User ${user.email} has been successfully promoted to ADMIN.`,
            instruction: "IMPORTANT: You MUST log out and log back in for the changes to take effect in your browser session.",
            currentRole: user.role,
        });
    } catch (error) {
        console.error("[Promotion API] Error:", error);
        return NextResponse.json(
            { error: "Failed to update user role." },
            { status: 500 }
        );
    }
}
