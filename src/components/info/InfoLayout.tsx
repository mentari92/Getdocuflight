import Link from "next/link";
import { ReactNode } from "react";
import Logo from "@/components/brand/Logo";

interface InfoLayoutProps {
    title: string;
    children: ReactNode;
}

export default function InfoLayout({ title, children }: InfoLayoutProps) {
    return (
        <div className="min-h-screen bg-surface">
            {/* ═══ Navbar ═══ */}
            <nav className="sticky top-0 z-50 bg-surface/80 backdrop-blur-lg border-b border-primary/10">
                <div className="max-w-5xl mx-auto px-4 sm:px-6">
                    <div className="flex items-center justify-between h-16">
                        <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
                            <Logo />
                        </Link>
                        <Link
                            href="/"
                            className="text-sm font-medium text-muted hover:text-heading transition-colors"
                        >
                            Back to Home
                        </Link>
                    </div>
                </div>
            </nav>

            <main className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
                <h1 className="text-4xl font-extrabold text-heading mb-10 font-heading">
                    {title}
                </h1>
                <div className="prose prose-slate max-w-none text-body leading-relaxed space-y-6">
                    {children}
                </div>
            </main>

            <footer className="py-12 bg-cream border-t border-gold-border/50">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
                    <p className="text-xs text-muted">
                        © {new Date().getFullYear()} GetDocuFlight — All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
}
