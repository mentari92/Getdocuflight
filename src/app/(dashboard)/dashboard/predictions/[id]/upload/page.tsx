/**
 * Upload page — /dashboard/predictions/[id]/upload
 *
 * Two-phase flow:
 *  1. DocumentUploadConsent → must accept all 4 terms
 *  2. DocumentUploadZone → file upload UI (Story 4.3)
 *
 * This page handles phase 1 (consent). Phase 2 will be added in Story 4.3.
 */

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import UploadPageClient from "./UploadPageClient";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    return {
        title: `Upload Documents — ${id.slice(0, 8)}… — GetDocuFlight`,
        description: "Upload documents for more accurate visa prediction.",
    };
}

export default async function UploadPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const session = await auth();
    if (!session?.user?.id) {
        redirect("/login");
    }

    const { id } = await params;

    const prediction = await prisma.prediction.findUnique({
        where: { id },
    });

    if (!prediction || prediction.userId !== session.user.id) {
        notFound();
    }

    if (!prediction.isPaid) {
        redirect(`/dashboard/predictions/${id}`);
    }

    // Check upload window
    const windowExpired =
        !prediction.uploadWindowExpiresAt ||
        new Date(prediction.uploadWindowExpiresAt).getTime() < Date.now();

    if (windowExpired) {
        return (
            <div className="min-h-screen bg-white">
                <nav className="bg-surface border-b border-gold-border/50 sticky top-0 z-50">
                    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-14">
                            <Link
                                href={`/dashboard/predictions/${id}`}
                                className="text-sm text-muted hover:text-heading transition-colors flex items-center gap-1"
                            >
                                <svg
                                    className="w-4 h-4"
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
                                Back to Results
                            </Link>
                        </div>
                    </div>
                </nav>
                <main className="max-w-2xl mx-auto px-4 py-16 text-center">
                    <span className="text-5xl mb-4 block">⏰</span>
                    <h2 className="text-xl font-bold text-heading font-heading mb-2">
                        Upload Window Expired
                    </h2>
                    <p className="text-sm text-muted max-w-sm mx-auto">
                        The 24-hour document upload window for this
                        prediction has expired. You can still view your
                        results.
                    </p>
                    <Link
                        href={`/dashboard/predictions/${id}`}
                        className="inline-block mt-6 px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors"
                    >
                        View Results
                    </Link>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Nav */}
            <nav className="bg-surface border-b border-gold-border/50 sticky top-0 z-50">
                <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-14">
                        <Link
                            href={`/dashboard/predictions/${id}`}
                            className="text-sm text-muted hover:text-heading transition-colors flex items-center gap-1"
                        >
                            <svg
                                className="w-4 h-4"
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
                            Back to Results
                        </Link>
                        <span className="text-xs text-muted">
                            📄 Document Upload
                        </span>
                    </div>
                </div>
            </nav>

            {/* Content */}
            <main className="max-w-2xl mx-auto px-4 py-8">
                <UploadPageClient
                    predictionId={id}
                    hasDocumentAnalysis={prediction.hasDocumentAnalysis}
                />
            </main>
        </div>
    );
}
