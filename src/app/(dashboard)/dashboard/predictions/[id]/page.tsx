import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import PredictorTeaser from "@/components/predictor/PredictorTeaser";
import PaywallCard from "@/components/predictor/PaywallCard";
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

    // Ownership check
    if (prediction.userId !== session.user.id) {
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

    // If paid → show full result (Story 3.2, stub for now)
    if (prediction.isPaid) {
        return (
            <div className="min-h-screen bg-white">
                <nav className="bg-surface border-b border-gold-border/50 sticky top-0 z-50">
                    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center h-14">
                            <Link
                                href="/dashboard"
                                className="text-sm text-muted hover:text-heading transition-colors flex items-center gap-1"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                </svg>
                                Dashboard
                            </Link>
                        </div>
                    </div>
                </nav>
                <main className="max-w-2xl mx-auto px-4 py-8">
                    <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
                        <span className="text-4xl">✅</span>
                        <h2 className="text-xl font-bold text-heading font-heading mt-3">
                            Hasil Sudah Dibuka
                        </h2>
                        <p className="text-sm text-muted mt-1">
                            Halaman hasil lengkap akan tersedia di Story 3.2.
                        </p>
                    </div>
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
                            + Prediksi Baru
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
                    Hasil prediksi dihasilkan oleh AI dan bersifat indikatif.
                    Keputusan visa akhir ditentukan oleh kedutaan.
                </p>
            </main>
        </div>
    );
}
