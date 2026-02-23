import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import PredictionHistoryList from "@/components/predictor/PredictionHistoryList";
import Logo from "@/components/brand/Logo";

export default async function DashboardPage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/login");
    }

    const displayName =
        session.user.name || session.user.email?.split("@")[0] || "there";

    // Fetch user's predictions with document count
    const predictions = await prisma.prediction.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            toCountry: true,
            fromCountry: true,
            riskLevel: true,
            approvalScore: true,
            isPaid: true,
            hasDocumentAnalysis: true,
            uploadWindowExpiresAt: true,
            createdAt: true,
            _count: { select: { documents: true } },
        },
    });

    // Serialize for client component
    const serializedPredictions = predictions.map((p) => ({
        id: p.id,
        toCountry: p.toCountry,
        fromCountry: p.fromCountry,
        riskLevel: p.riskLevel,
        approvalScore: p.approvalScore,
        isPaid: p.isPaid,
        hasDocumentAnalysis: p.hasDocumentAnalysis,
        uploadWindowExpiresAt: p.uploadWindowExpiresAt
            ? p.uploadWindowExpiresAt.toISOString()
            : null,
        createdAt: p.createdAt.toISOString(),
        documentCount: p._count.documents,
    }));

    const hasAnyDocuments = predictions.some((p) => p._count.documents > 0);

    return (
        <div className="min-h-screen bg-white">
            {/* Navbar */}
            <nav className="bg-surface border-b border-gold-border/50 sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link
                            href="/"
                            className="flex items-center"
                        >
                            <Logo />
                        </Link>
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-muted hidden sm:block">
                                {session.user.email}
                            </span>
                            <form
                                action={async () => {
                                    "use server";
                                    const { signOut } = await import(
                                        "@/lib/auth"
                                    );
                                    await signOut({ redirectTo: "/login" });
                                }}
                            >
                                <button
                                    type="submit"
                                    className="text-sm text-muted hover:text-error transition-colors cursor-pointer"
                                >
                                    Sign Out
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {/* Header */}
                <div className="mb-10">
                    <h1 className="text-3xl font-extrabold text-heading font-heading">
                        Welcome, {displayName}! 👋
                    </h1>
                    <p className="text-muted mt-2">
                        Manage your visa predictions and documents here.
                    </p>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                    <Link
                        href="/dashboard/predict"
                        className="group bg-surface border border-gold-border rounded-2xl p-6 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
                    >
                        <div className="text-3xl mb-3">🔮</div>
                        <h3 className="text-lg font-bold text-heading font-heading mb-1">
                            New Visa Prediction
                        </h3>
                        <p className="text-muted text-sm">
                            Check your approval chances with AI — results in
                            seconds.
                        </p>
                        <span className="text-primary text-sm font-medium mt-3 inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                            Start Prediction →
                        </span>
                    </Link>

                    <Link
                        href="/dashboard/booking"
                        className="group bg-surface border border-gold-border rounded-2xl p-6 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
                    >
                        <div className="text-3xl mb-3">✈️</div>
                        <h3 className="text-lg font-bold text-heading font-heading mb-1">
                            Dummy Flight Ticket
                        </h3>
                        <p className="text-muted text-sm">
                            Get a verified flight reservation for your visa
                            application.
                        </p>
                        <span className="text-primary text-sm font-medium mt-3 inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                            Order Ticket →
                        </span>
                    </Link>
                </div>

                {/* Prediction History */}
                <PredictionHistoryList
                    predictions={serializedPredictions}
                    hasAnyDocuments={hasAnyDocuments}
                />
            </main>
        </div>
    );
}
