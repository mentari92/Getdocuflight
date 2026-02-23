import Link from "next/link";
import Logo from "@/components/brand/Logo";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-4">
            {/* Decorative gradient orbs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary-200/40 blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-gold-light/60 blur-3xl" />
            </div>

            <div className="relative z-10 w-full max-w-md">
                {/* Logo */}
                <Link href="/" className="flex flex-col items-center mb-8">
                    <Logo className="justify-center" />
                    <p className="text-muted mt-2 text-sm text-center">
                        Visa Predictor — Know Your Chances
                    </p>
                </Link>
                {children}
            </div>
        </div>
    );
}
