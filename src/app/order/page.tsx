/**
 * /order — Public order page (no auth required).
 *
 * Replaces /dashboard/booking as the primary booking entry point.
 * Uses the 5-step OrderForm wizard.
 */

import OrderForm from "@/components/booking/OrderForm";

export const metadata = {
    title: "Order Dummy Ticket — GetDocuFlight",
    description:
        "Order a dummy flight ticket or flight+hotel bundle for your visa application. Processed within 1–2 working hours.",
};

import Link from "next/link";
import Logo from "@/components/brand/Logo";

export default function OrderPage() {
    return (
        <div className="min-h-screen bg-surface font-body">
            {/* Navbar */}
            <nav className="bg-white border-b border-gray-100">
                <div className="max-w-lg mx-auto px-4">
                    <div className="flex items-center justify-between h-16">
                        <a href="/" className="text-sm font-bold flex items-center gap-2 hover:text-primary transition-colors">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M15 19l-7-7 7-7"
                                />
                            </svg>
                            Home
                        </a>
                        <span className="text-xs text-muted">
                            🔒 Secure Payment
                        </span>
                    </div>
                </div>
            </nav>

            {/* Header */}
            <div className="bg-gradient-to-b from-primary/5 to-white py-8">
                <div className="max-w-lg mx-auto px-4 text-center flex flex-col items-center">
                    <Link href="/" className="flex flex-col items-center text-center mb-8">
                        <Logo className="justify-center mb-1 scale-110" />
                        <p className="text-sm text-muted mt-1">
                            Get your verified dummy tickets in minutes
                        </p>
                    </Link>
                    <h1 className="text-2xl font-extrabold text-heading font-heading">
                        Order Dummy Ticket
                    </h1>
                    <p className="text-sm text-muted mt-2 max-w-sm mx-auto">
                        Dummy ticket valid for visa applications.
                        Processed within 1–2 working hours after payment.
                    </p>
                </div>
            </div>

            {/* Form */}
            <main className="max-w-lg mx-auto px-4 py-8">
                <OrderForm />
            </main>
        </div>
    );
}
