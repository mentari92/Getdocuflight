"use client";

import { useState } from "react";
import Link from "next/link";

/**
 * PredictionHistoryList — Enterprise-grade prediction history for the dashboard.
 *
 * Displays prediction cards with:
 * - Destination + date
 * - Risk level badge (Bazi colors: LOW=purple, MEDIUM=gold, HIGH=red)
 * - Paid/unpaid status
 * - Conditional action buttons based on payment + upload window state
 * - Document verification badge
 * - Delete My Documents button (stubbed until Epic 4)
 */

// ── Types ───────────────────────────────────────────────────

interface PredictionItem {
    id: string;
    toCountry: string;
    fromCountry: string;
    riskLevel: "LOW" | "MEDIUM" | "HIGH";
    approvalScore: number;
    isPaid: boolean;
    hasDocumentAnalysis: boolean;
    uploadWindowExpiresAt: string | null;
    createdAt: string;
    documentCount: number;
}

interface PredictionHistoryListProps {
    predictions: PredictionItem[];
    hasAnyDocuments: boolean;
}

// ── Config ──────────────────────────────────────────────────

const RISK_CONFIG = {
    LOW: {
        label: "Low Risk",
        emoji: "🟣",
        badgeBg: "bg-primary-100",
        badgeText: "text-primary-700",
        badgeBorder: "border-primary-200",
    },
    MEDIUM: {
        label: "Medium Risk",
        emoji: "🟡",
        badgeBg: "bg-gold-light",
        badgeText: "text-amber-800",
        badgeBorder: "border-gold-border",
    },
    HIGH: {
        label: "High Risk",
        emoji: "🔴",
        badgeBg: "bg-error-light",
        badgeText: "text-error",
        badgeBorder: "border-error-border",
    },
};

// ── Helper: Upload Window Status ────────────────────────────

function getUploadStatus(
    isPaid: boolean,
    hasDocumentAnalysis: boolean,
    uploadWindowExpiresAt: string | null
): "active" | "expired" | "none" {
    if (!isPaid || !uploadWindowExpiresAt) return "none";
    if (hasDocumentAnalysis) return "none"; // already analyzed
    const expiresMs = new Date(uploadWindowExpiresAt).getTime();
    if (expiresMs > Date.now()) return "active";
    return "expired";
}

// ── Prediction Card ─────────────────────────────────────────

function PredictionCard({ prediction }: { prediction: PredictionItem }) {
    const risk = RISK_CONFIG[prediction.riskLevel];
    const formattedDate = new Date(prediction.createdAt).toLocaleDateString(
        "en-US",
        { day: "numeric", month: "short", year: "numeric" }
    );
    const uploadStatus = getUploadStatus(
        prediction.isPaid,
        prediction.hasDocumentAnalysis,
        prediction.uploadWindowExpiresAt
    );

    return (
        <div className="bg-surface border border-gold-border/40 rounded-2xl p-5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
            {/* Top row: destination + date */}
            <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                    <h3 className="text-base font-bold text-heading font-heading truncate">
                        🌍 {prediction.toCountry.replace(/_/g, " ")}
                    </h3>
                    <p className="text-xs text-muted mt-0.5">
                        From {prediction.fromCountry.replace(/_/g, " ")} •{" "}
                        {formattedDate}
                    </p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                    {/* Risk Badge */}
                    <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${risk.badgeBg} ${risk.badgeText} ${risk.badgeBorder}`}
                    >
                        {risk.emoji} {risk.label}
                    </span>
                    {/* Paid Status */}
                    {prediction.isPaid ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary border border-primary-200">
                            ✓ Paid
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gold-light text-amber-800 border border-gold-border">
                            ⏳ Unpaid
                        </span>
                    )}
                </div>
            </div>

            {/* Score preview for paid */}
            {prediction.isPaid && (
                <div className="flex items-center gap-3 mb-3 px-3 py-2 bg-primary-50/50 rounded-xl">
                    <span className="text-2xl font-extrabold text-heading font-heading tabular-nums">
                        {prediction.approvalScore}
                    </span>
                    <span className="text-xs text-muted">/100 approval score</span>
                </div>
            )}

            {/* Badges row */}
            <div className="flex flex-wrap gap-2 mb-4">
                {prediction.hasDocumentAnalysis && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-50 border border-primary-200 rounded-lg text-xs font-semibold text-primary">
                        ✓ Verified with documents
                    </span>
                )}
                {uploadStatus === "expired" && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-cream border border-gold-border/50 rounded-lg text-xs text-muted">
                        ⏰ Upload period ended
                    </span>
                )}
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2">
                {prediction.isPaid ? (
                    <>
                        <Link
                            href={`/dashboard/predictions/${prediction.id}`}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-colors"
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
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                            </svg>
                            View Results
                        </Link>
                        {uploadStatus === "active" && (
                            <Link
                                href={`/dashboard/predictions/${prediction.id}/upload`}
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-surface text-primary text-sm font-semibold rounded-xl border-2 border-primary/20 hover:border-primary/40 transition-colors"
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
                                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                                    />
                                </svg>
                                Upload Documents
                            </Link>
                        )}
                    </>
                ) : (
                    <Link
                        href={`/dashboard/predictions/${prediction.id}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-gold text-white text-sm font-semibold rounded-xl hover:bg-amber-600 transition-colors"
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
                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                            />
                        </svg>
                        Unlock Results — $5
                    </Link>
                )}
            </div>
        </div>
    );
}

// ── Delete Documents Button ─────────────────────────────────

function DeleteDocumentsButton() {
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleted, setDeleted] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const res = await fetch("/api/documents/bulk", {
                method: "DELETE",
            });
            if (res.ok) {
                setDeleted(true);
                setConfirmOpen(false);
            }
        } catch {
            // silently fail for stub
        } finally {
            setIsDeleting(false);
        }
    };

    if (deleted) {
        return (
            <div className="flex items-center gap-2 px-4 py-3 bg-primary-50 border border-primary-200 rounded-xl">
                <span className="text-sm">✓</span>
                <span className="text-sm font-semibold text-primary">
                    All documents have been deleted.
                </span>
            </div>
        );
    }

    return (
        <div>
            {!confirmOpen ? (
                <button
                    onClick={() => setConfirmOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-error-light text-error text-sm font-semibold rounded-xl border border-error-border hover:bg-red-100 transition-colors cursor-pointer"
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
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                    </svg>
                    Delete My Documents
                </button>
            ) : (
                <div className="bg-error-light border border-error-border rounded-xl p-4">
                    <p className="text-sm font-semibold text-error mb-1">
                        ⚠️ Are you sure?
                    </p>
                    <p className="text-xs text-body mb-3">
                        This will permanently delete all uploaded documents from
                        our servers. This action cannot be undone.
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="px-4 py-2 bg-error text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                            {isDeleting ? "Deleting..." : "Yes, Delete All"}
                        </button>
                        <button
                            onClick={() => setConfirmOpen(false)}
                            className="px-4 py-2 bg-surface text-body text-sm font-medium rounded-lg border border-gold-border hover:bg-cream transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Main Component ──────────────────────────────────────────

export default function PredictionHistoryList({
    predictions,
    hasAnyDocuments,
}: PredictionHistoryListProps) {
    if (predictions.length === 0) {
        return (
            <div className="bg-surface border border-gold-border/50 rounded-2xl p-12 text-center">
                <div className="text-5xl mb-4">✈️</div>
                <h2 className="text-xl font-bold text-heading font-heading mb-2">
                    No predictions yet
                </h2>
                <p className="text-muted mb-6 max-w-md mx-auto">
                    Fill in the visa predictor form to get an AI-powered
                    assessment of your chances.
                </p>
                <Link
                    href="/dashboard/predict"
                    className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 shadow-md shadow-primary/20"
                >
                    Start Your First Prediction →
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-heading font-heading">
                        Your Predictions
                    </h2>
                    <p className="text-sm text-muted">
                        {predictions.length} prediction
                        {predictions.length !== 1 ? "s" : ""}
                    </p>
                </div>
            </div>

            {/* Prediction Cards */}
            <div className="grid gap-4">
                {predictions.map((prediction) => (
                    <PredictionCard
                        key={prediction.id}
                        prediction={prediction}
                    />
                ))}
            </div>

            {/* Delete Documents */}
            {hasAnyDocuments && (
                <div className="border-t border-gold-border/30 pt-6">
                    <p className="text-xs text-muted mb-3">
                        🔒 Data Privacy — You can delete all uploaded documents
                        at any time.
                    </p>
                    <DeleteDocumentsButton />
                </div>
            )}
        </div>
    );
}
