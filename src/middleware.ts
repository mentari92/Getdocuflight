import { auth } from "@/lib/auth-edge";
import { NextResponse } from "next/server";

export default auth((req) => {
    const { pathname } = req.nextUrl;

    // Protect /dashboard/* routes
    if (pathname.startsWith("/dashboard")) {
        if (!req.auth) {
            const loginUrl = new URL("/login", req.url);
            loginUrl.searchParams.set("callbackUrl", pathname);
            return NextResponse.redirect(loginUrl);
        }
    }

    // [C4 FIX] Protect /admin/* routes — require auth + ADMIN role
    if (pathname.startsWith("/admin")) {
        if (!req.auth) {
            const loginUrl = new URL("/login", req.url);
            loginUrl.searchParams.set("callbackUrl", pathname);
            return NextResponse.redirect(loginUrl);
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const role = (req.auth as any)?.user?.role;
        if (role !== "ADMIN") {
            return NextResponse.json(
                { error: "Admin access required" },
                { status: 403 }
            );
        }
    }

    // Redirect authenticated users away from auth pages
    if (pathname === "/login" || pathname === "/register") {
        if (req.auth) {
            return NextResponse.redirect(new URL("/dashboard", req.url));
        }
    }

    return NextResponse.next();
});

export const config = {
    matcher: ["/dashboard/:path*", "/admin/:path*", "/login", "/register"],
};
