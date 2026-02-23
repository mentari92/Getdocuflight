import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import PredictorTeaser from "@/components/predictor/PredictorTeaser";
import PaywallCard from "@/components/predictor/PaywallCard";
import FullResultDisplay from "@/components/predictor/FullResultDisplay";
import { getIDRAmount } from "@/lib/currency";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    return {
        title: `Prediction ${id.slice(0, 8)}… — GetDocuFlight`,
        description: "Your AI-powered visa prediction result.",
    };
}

export default async function PredictionResultPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const session = await auth();
    if (!session?.user?.id) {
        redirect("/login");
    }

    const { id } = await params;

    // Fetch prediction with ownership check
    const prediction = await prisma.prediction.findUnique({
        where: { id },
    });

    if (!prediction) {
        notFound();
    }

    // Ownership check (Admins can view any prediction)
    if (prediction.userId !== session.user.id && session.user.role !== "ADMIN") {
        notFound();
    }

    // Get IDR price for PaywallCard
    let priceIDR = 82500;
    let exchangeRate = 16500;
    try {
        const idr = await getIDRAmount(5.0);
        priceIDR = idr.amountIDR;
        exchangeRate = idr.exchangeRate;
    } catch {
        // Use fallback values
    }

    // If paid or admin → show full result
    if (prediction.isPaid || session.user.role === "ADMIN") {
        // Parse JSON fields
        const factors = (prediction.factors as Array<{
            name: string;
            impact: "positive" | "neutral" | "negative";
            detail: string;
            points?: number;
        }>) || [];
        const recommendationSummary = (prediction.recommendationSummary as string[]) || [];
        const strategicActionPlan = (prediction.strategicActionPlan as any[]) || null;
        const benchmarks = (prediction.benchmarks as any[]) || null;
        const auditedDocuments = prediction.auditedDocuments || null;

        return (
            <div className="min-h-screen bg-white">
                <nav className="bg-surface border-b border-gold-border/50 sticky top-0 z-50">
                    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-14">
                            <Link
                                href="/dashboard"
                                className="text-sm text-muted hover:text-heading transition-colors flex items-center gap-1"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                </svg>
                                Dashboard
                            </Link>
                            <Link
                                href="/dashboard/predict"
                                className="text-sm text-primary hover:text-primary-dark font-medium transition-colors"
                            >
                                + New Prediction
                            </Link>
                        </div>
                    </div>
                </nav>
                <main className="max-w-2xl mx-auto px-4 py-8">
                    <FullResultDisplay
                        predictionId={prediction.id}
                        approvalScore={prediction.approvalScore}
                        approvalScoreWithDocs={prediction.approvalScoreWithDocs}
                        riskLevel={prediction.riskLevel}
                        factors={factors}
                        recommendationSummary={recommendationSummary}
                        recommendation={prediction.recommendation}
                        strategicActionPlan={strategicActionPlan}
                        benchmarks={benchmarks}
                        destination={prediction.toCountry}
                        createdAt={prediction.createdAt.toISOString()}
                        uploadWindowExpiresAt={
                            prediction.uploadWindowExpiresAt
                                ? prediction.uploadWindowExpiresAt.toISOString()
                                : null
                        }
                        hasDocumentAnalysis={prediction.hasDocumentAnalysis}
                        auditedDocuments={auditedDocuments}
                    />
                </main>
            </div>
        );
    }

    // Not paid → show teaser + paywall
    return (
        <div className="min-h-screen bg-white">
            {/* Nav */}
            <nav className="bg-surface border-b border-gold-border/50 sticky top-0 z-50">
                <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-14">
                        <Link
                            href="/dashboard"
                            className="text-sm text-muted hover:text-heading transition-colors flex items-center gap-1"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                            Dashboard
                        </Link>
                        <Link
                            href="/dashboard/predict"
                            className="text-sm text-primary hover:text-primary-dark font-medium transition-colors"
                        >
                            + New Prediction
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Content */}
            <main className="max-w-2xl mx-auto px-4 py-8 space-y-8">
                {/* Teaser */}
                <PredictorTeaser
                    teaser={prediction.teaser}
                    destination={prediction.toCountry}
                    createdAt={prediction.createdAt.toISOString()}
                />

                {/* Paywall CTA */}
                <PaywallCard
                    predictionId={prediction.id}
                    priceUSD={5.0}
                    priceIDR={priceIDR}
                    exchangeRate={exchangeRate}
                />

                {/* Disclaimer */}
                <p className="text-xs text-subtle text-center px-4">
                    Prediction results are AI-generated and indicative only.
                    Final visa decisions are made by the embassy.
                </p>
            </main>
        </div>
    );
}
