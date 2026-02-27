import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

import Logo from "@/components/brand/Logo";

/**
 * Admin layout with sidebar navigation.
 * Checks admin role — non-admins are redirected to /dashboard.
 */
export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/login");
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const role = (session as any).user?.role;
    if (role !== "ADMIN") {
        redirect("/dashboard");
    }

    const navLinks = [
        { href: "/admin", label: "📊 Dashboard", exact: true },
        { href: "/admin/orders", label: "📦 Orders" },
        { href: "/admin/chat", label: "💬 Chat" },
        { href: "/admin/messages", label: "📧 Messages" },
    ];

    return (
        <div className="min-h-screen bg-white">
            {/* Admin Navbar */}
            <nav className="bg-surface border-b border-gold-border/50 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-14">
                        <div className="flex items-center gap-6">
                            <Link
                                href="/admin"
                                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                            >
                                <Logo />
                                <span className="text-muted text-sm font-medium border-l border-gold-border/50 pl-2 hidden sm:block">Admin</span>
                            </Link>
                            <div className="hidden sm:flex items-center gap-1">
                                {navLinks.map((link) => (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className="px-3 py-1.5 text-sm text-muted hover:text-heading hover:bg-surface rounded-lg transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link
                                href="/dashboard"
                                className="text-xs text-muted hover:text-primary transition-colors"
                            >
                                ← User Dashboard
                            </Link>
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                                ADMIN
                            </span>
                            <span className="text-sm text-muted hidden sm:block">
                                {session.user.email}
                            </span>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile Nav */}
            <div className="sm:hidden bg-surface border-b border-gold-border/30 px-4 py-2 flex gap-2">
                {navLinks.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className="px-3 py-1.5 text-sm text-muted hover:text-heading hover:bg-white rounded-lg transition-colors"
                    >
                        {link.label}
                    </Link>
                ))}
            </div>

            {children}
        </div>
    );
}
