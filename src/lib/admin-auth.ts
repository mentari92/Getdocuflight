/**
 * Admin authentication helpers.
 *
 * Provides role-based access control for admin routes.
 * [H1 FIX] Uses properly typed NextAuth session — no more `any` casts.
 */

import { auth } from "@/lib/auth";

export interface AdminSession {
    user: {
        id: string;
        email: string;
        name?: string | null;
        role: string;
    };
}

/**
 * Check if current session belongs to an admin user.
 * Returns the admin session or null if not admin.
 */
export async function getAdminSession(): Promise<AdminSession | null> {
    const session = await auth();

    if (!session?.user?.id) return null;

    // [H1 FIX] No more `any` cast — `role` is properly typed via next-auth.d.ts
    if (session.user.role !== "ADMIN") return null;

    return {
        user: {
            id: session.user.id,
            email: session.user.email || "",
            name: session.user.name,
            role: "ADMIN",
        },
    };
}

/**
 * Require admin access for API routes.
 * Returns { session, error } — if error is set, return it as NextResponse.
 */
export async function requireAdmin() {
    const adminSession = await getAdminSession();

    if (!adminSession) {
        return {
            session: null,
            error: { error: "Admin access required", status: 403 },
        };
    }

    return { session: adminSession, error: null };
}
