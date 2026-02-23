import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PlaneTakeoff } from "lucide-react";
import PredictorForm from "@/components/predictor/PredictorForm";

export const metadata = {
    title: "Visa Prediction — GetDocuFlight",
    description:
        "Fill out the form and get your AI-powered visa approval prediction.",
};

import Link from "next/link";
import Logo from "@/components/brand/Logo";

export default async function PredictPage() {
    const session = await auth();
    if (!session?.user) {
        redirect("/login?callbackUrl=/dashboard/predict");
    }

    return (
        <div className="min-h-screen bg-[#FFFFFF]">
            {/* Decorative gradient orbs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-32 -right-32 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-gold/10 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 max-w-lg mx-auto px-4 py-8 sm:py-12">
                {/* Logo */}
                <Link href="/" className="flex flex-col items-center text-center mb-8">
                    <Logo className="justify-center scale-110 mb-1" />
                    <p className="text-sm text-muted mt-1">
                        Visa Predictor — Know Your Chances
                    </p>
                </Link>

                <PredictorForm />
            </div>
        </div>
    );
}
