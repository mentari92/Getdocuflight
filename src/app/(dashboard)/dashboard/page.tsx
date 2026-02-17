import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardPage() {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    const displayName =
        session.user.name || session.user.email?.split("@")[0] || "there";

    return (
        <div className="min-h-screen bg-white">
            {/* Navbar */}
            <nav className="bg-surface border-b border-gold-border/50 sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link
                            href="/dashboard"
                            className="text-lg font-bold text-heading font-heading"
                        >
                            ✈️ GetDocuFlight
                        </Link>
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-muted hidden sm:block">
                                {session.user.email}
                            </span>
                            <form
                                action={async () => {
                                    "use server";
                                    const { signOut } = await import("@/lib/auth");
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
                            Check your approval chances with AI — results in seconds.
                        </p>
                        <span className="text-primary text-sm font-medium mt-3 inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                            Start Prediction →
                        </span>
                    </Link>

                    <Link
                        href="/dashboard/predictions"
                        className="group bg-surface border border-gold-border rounded-2xl p-6 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
                    >
                        <div className="text-3xl mb-3">📊</div>
                        <h3 className="text-lg font-bold text-heading font-heading mb-1">
                            Prediction History
                        </h3>
                        <p className="text-muted text-sm">
                            Review past predictions and documents you&apos;ve uploaded.
                        </p>
                        <span className="text-primary text-sm font-medium mt-3 inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                            View History →
                        </span>
                    </Link>
                </div>

                {/* Empty State */}
                <div className="bg-surface border border-gold-border/50 rounded-2xl p-12 text-center">
                    <div className="text-5xl mb-4">✈️</div>
                    <h2 className="text-xl font-bold text-heading font-heading mb-2">
                        No predictions yet
                    </h2>
                    <p className="text-muted mb-6 max-w-md mx-auto">
                        Fill in the visa predictor form to get an AI-powered assessment of
                        your chances.
                    </p>
                    <Link
                        href="/dashboard/predict"
                        className="inline-flex items-center gap-2 bg-primary hover:bg-primary-light text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 shadow-md shadow-primary/20"
                    >
                        Start Your First Prediction →
                    </Link>
                </div>
            </main>
        </div>
    );
}
