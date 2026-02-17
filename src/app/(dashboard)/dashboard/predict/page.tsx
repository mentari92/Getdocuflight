import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PlaneTakeoff } from "lucide-react";
import PredictorForm from "@/components/predictor/PredictorForm";

export const metadata = {
    title: "Visa Prediction — GetDocuFlight",
    description:
        "Fill out the form and get your AI-powered visa approval prediction.",
};

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
                <div className="text-center mb-8">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-heading font-heading inline-flex items-center gap-2">
                        GetDocuFlight
                        <PlaneTakeoff
                            size={28}
                            color="#9333EA"
                            strokeWidth={1.5}
                        />
                    </h1>
                    <p className="text-sm text-muted mt-1">
                        AI Visa Predictor — Know Your Chances
                    </p>
                </div>

                <PredictorForm />
            </div>
        </div>
    );
}
