"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Download } from "lucide-react";
import PredictionChatPanel from "./PredictionChatPanel";
import DocumentAuditor from "./DocumentAuditor";

/**
 * FullResultDisplay — Full prediction result for paying users.
 *
 * Shows: score ring, risk badge, factors table,
 * recommendations (general + specific), upload CTA, disclaimer.
 *
 * Bazi design system: NO GREEN.
 * LOW = purple, MEDIUM = gold, HIGH = error red.
 */

interface Factor {
    name: string;
    impact: "positive" | "neutral" | "negative";
    detail: string;
    points?: number;
}

interface FullResultDisplayProps {
    predictionId: string;
    approvalScore: number;
    approvalScoreWithDocs: number | null;
    riskLevel: "LOW" | "MEDIUM" | "HIGH";
    factors: Factor[];
    recommendationSummary: string[];
    recommendation: string;
    strategicActionPlan?: Array<{
        title: string;
        action: string;
        priority: "high" | "medium" | "low";
    }>;
    benchmarks?: Array<{
        metric: string;
        current: string;
        ideal: string;
        status: "good" | "needs_improvement" | "critical";
    }>;
    destination: string;
    createdAt: string;
    uploadWindowExpiresAt: string | null;
    hasDocumentAnalysis: boolean;
    auditedDocuments?: any;
}

// ── Risk Level Config (Bazi: no green) ──────────────────────

const RISK_CONFIG = {
    LOW: {
        label: "Low Risk",
        ringColor: "stroke-primary",
        badgeBg: "bg-primary-100",
        badgeText: "text-primary-700",
        badgeBorder: "border-primary-200",
        trailColor: "stroke-primary-100",
    },
    MEDIUM: {
        label: "Medium Risk",
        ringColor: "stroke-gold",
        badgeBg: "bg-gold-light",
        badgeText: "text-amber-800",
        badgeBorder: "border-gold-border",
        trailColor: "stroke-gold-light",
    },
    HIGH: {
        label: "High Risk",
        ringColor: "stroke-error",
        badgeBg: "bg-error-light",
        badgeText: "text-error",
        badgeBorder: "border-error-border",
        trailColor: "stroke-error-light",
    },
};

const IMPACT_ICONS = {
    positive: "✅",
    neutral: "⚠️",
    negative: "❌",
};



// ── Score Ring ──────────────────────────────────────────────

function ScoreRing({
    score,
    riskLevel,
}: {
    score: number;
    riskLevel: "LOW" | "MEDIUM" | "HIGH";
}) {
    const [animatedScore, setAnimatedScore] = useState(0);
    const config = RISK_CONFIG[riskLevel];

    // Animate score on mount
    useEffect(() => {
        let rafId: number;
        const duration = 1200;
        const start = performance.now();
        const animate = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setAnimatedScore(Math.round(score * eased));
            if (progress < 1) rafId = requestAnimationFrame(animate);
        };
        rafId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(rafId);
    }, [score]);

    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (animatedScore / 100) * circumference;

    return (
        <div className="flex flex-col items-center">
            <div className="relative w-48 h-48">
                <svg
                    className="w-full h-full -rotate-90"
                    viewBox="0 0 160 160"
                >
                    {/* Trail */}
                    <circle
                        cx="80"
                        cy="80"
                        r={radius}
                        fill="none"
                        strokeWidth="10"
                        className={config.trailColor}
                    />
                    {/* Ring */}
                    <circle
                        cx="80"
                        cy="80"
                        r={radius}
                        fill="none"
                        strokeWidth="10"
                        strokeLinecap="round"
                        className={config.ringColor}
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        style={{
                            transition: "stroke-dashoffset 0.1s ease-out",
                        }}
                    />
                </svg>
                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl font-extrabold text-heading font-heading tabular-nums">
                        {animatedScore}
                    </span>
                    <span className="text-sm text-muted font-medium">/100</span>
                </div>
            </div>
        </div>
    );
}

// ── Countdown Timer ────────────────────────────────────────

function UploadCountdown({
    expiresAt,
    predictionId,
}: {
    expiresAt: string;
    predictionId: string;
}) {
    const [timeLeft, setTimeLeft] = useState("");
    const [expired, setExpired] = useState(false);

    useEffect(() => {
        const update = () => {
            const diff = new Date(expiresAt).getTime() - Date.now();
            if (diff <= 0) {
                setExpired(true);
                setTimeLeft("");
                return;
            }
            const hours = Math.floor(diff / 3600000);
            const mins = Math.floor((diff % 3600000) / 60000);
            setTimeLeft(`${hours}h ${mins}m`);
        };
        update();
        const timer = setInterval(update, 30000); // update every 30s
        return () => clearInterval(timer);
    }, [expiresAt]);

    if (expired) {
        return (
            <div className="bg-cream border border-gold-border/50 rounded-2xl p-5 text-center">
                <p className="text-sm text-muted">
                    ⏰ The document upload window has expired.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-primary-50 border border-primary-200 rounded-2xl p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">📄</span>
                <div>
                    <h3 className="text-sm font-bold text-heading">
                        Improve Accuracy with Document Upload
                    </h3>
                    <p className="text-xs text-muted mt-0.5">
                        <span className="font-semibold text-primary">
                            {timeLeft}
                        </span>{" "}
                        remaining
                    </p>
                </div>
            </div>
            <p className="text-sm text-body mb-4">
                Upload bank statements, employment letters, or pay slips
                to get a re-analysis with higher accuracy.
            </p>
            <Link
                href={`/dashboard/predictions/${predictionId}/upload`}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-colors"
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
                Upload Documents for Re-Analysis
            </Link>
        </div>
    );
}

// ── Main Component ─────────────────────────────────────────

export default function FullResultDisplay({
    predictionId,
    approvalScore,
    approvalScoreWithDocs,
    riskLevel,
    factors,
    recommendationSummary,
    recommendation,
    destination,
    createdAt,
    uploadWindowExpiresAt,
    hasDocumentAnalysis,
    strategicActionPlan,
    benchmarks,
    auditedDocuments,
}: FullResultDisplayProps) {
    const config = RISK_CONFIG[riskLevel];
    const formattedDate = new Date(createdAt).toLocaleDateString("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

    // Compute on client only to avoid hydration mismatch (server vs client Date.now())
    const [showUploadCTA, setShowUploadCTA] = useState(false);
    useEffect(() => {
        if (
            uploadWindowExpiresAt &&
            new Date(uploadWindowExpiresAt).getTime() > Date.now() &&
            !hasDocumentAnalysis
        ) {
            setShowUploadCTA(true);
        }
    }, [uploadWindowExpiresAt, hasDocumentAnalysis]);

    const handleDownloadPDF = () => {
        // We use the browser's native print-to-pdf functionality.
        // It is 100x more reliable than client-side canvas-to-pdf libraries 
        // and respects our @media print CSS classes.

        // Add a tiny delay to ensure any UI states (like closing dropdowns) have settled
        setTimeout(() => {
            window.print();
        }, 100);
    };

    return (
        <div id="full-prediction-result" className="space-y-8 print:bg-white print:pb-8">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-2 text-sm text-muted mb-1">
                        <span>📅 {formattedDate}</span>
                        <span>•</span>
                        <span className="capitalize">
                            🌍 {destination.replace(/_/g, " ")}
                        </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-heading font-heading">
                        Full Visa Prediction Results
                    </h2>
                </div>
                <button
                    onClick={handleDownloadPDF}
                    className="flex flex-col sm:flex-row items-center gap-2 px-4 py-2 bg-cream text-primary font-bold rounded-xl lg:rounded-2xl border border-primary/20 hover:bg-primary hover:text-white transition-colors text-sm shadow-sm print:hidden shrink-0"
                >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Download PDF</span>
                </button>
            </div>

            {/* Score Ring + Risk Badge */}
            <div className="bg-surface border border-primary-200/50 rounded-2xl p-6 sm:p-8">
                <ScoreRing score={approvalScoreWithDocs ?? approvalScore} riskLevel={riskLevel} />
                <div className="flex justify-center mt-4">
                    <span
                        className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold border ${config.badgeBg} ${config.badgeText} ${config.badgeBorder}`}
                    >
                        {riskLevel === "LOW" && "🟣"}
                        {riskLevel === "MEDIUM" && "🟡"}
                        {riskLevel === "HIGH" && "🔴"}
                        {config.label}
                    </span>
                </div>
                {approvalScoreWithDocs != null && (
                    <p className="text-center text-xs text-primary font-semibold mt-2">
                        ✓ Updated from {approvalScore} → {approvalScoreWithDocs} with document analysis
                    </p>
                )}
                <p className="text-center text-xs text-muted mt-3">
                    Visa Approval Score
                </p>
            </div>

            {/* Factors Table */}
            <div>
                <h3 className="text-lg font-bold text-heading font-heading mb-3 flex items-center gap-2">
                    <span>📊</span> Assessment Factors
                </h3>
                <div className="space-y-3">
                    {factors.map((factor, i) => (
                        <div
                            key={i}
                            className="bg-surface border border-gold-border/30 rounded-xl p-4 flex items-start gap-3"
                        >
                            <span className="text-xl mt-0.5 shrink-0">
                                {IMPACT_ICONS[factor.impact]}
                            </span>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-bold text-heading">
                                        {factor.name}
                                    </span>
                                    {factor.points !== undefined &&
                                        factor.points !== 0 && (
                                            <span
                                                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${factor.points > 0
                                                    ? "bg-primary-100 text-primary-700"
                                                    : "bg-error-light text-error"
                                                    }`}
                                            >
                                                {factor.points > 0 ? "+" : ""}
                                                {factor.points}
                                            </span>
                                        )}
                                </div>
                                <p className="text-sm text-body mt-1">
                                    {factor.detail}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recommendations — General Summary */}
            {recommendationSummary && recommendationSummary.length > 0 && (
                <div>
                    <h3 className="text-lg font-bold text-heading font-heading mb-3 flex items-center gap-2">
                        <span>💡</span> Key Recommendations
                    </h3>
                    <div className="bg-primary-50 border border-primary-200 rounded-2xl p-5 sm:p-6">
                        <ul className="space-y-3">
                            {recommendationSummary.map((item, i) => (
                                <li
                                    key={i}
                                    className="flex items-start gap-3 text-sm text-body"
                                >
                                    <span className="shrink-0 mt-0.5 text-primary text-base">📌</span>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {/* Strategic Action Plan (Premium) */}
            {strategicActionPlan && strategicActionPlan.length > 0 && (
                <div>
                    <h3 className="text-lg font-bold text-heading font-heading mb-3 flex items-center gap-2">
                        <span>🎯</span> Strategic Action Plan
                    </h3>
                    <div className="grid gap-4">
                        {strategicActionPlan.map((plan, i) => (
                            <div key={i} className="bg-surface border border-gold-border/30 rounded-2xl p-4 flex items-start gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-lg ${plan.priority === 'high' ? 'bg-error-light text-error' :
                                    plan.priority === 'medium' ? 'bg-gold-light text-amber-800' :
                                        'bg-primary-50 text-primary-700'
                                    }`}>
                                    {i + 1}
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-heading mb-1 uppercase tracking-tight">
                                        {plan.title}
                                    </h4>
                                    <p className="text-sm text-body">
                                        {plan.action}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Benchmark Analysis (Premium) */}
            {benchmarks && benchmarks.length > 0 && (
                <div>
                    <h3 className="text-lg font-bold text-heading font-heading mb-3 flex items-center gap-2">
                        <span>📊</span> Benchmark Analysis
                    </h3>
                    <div className="bg-surface border border-gold-border/40 rounded-2xl overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gold-light/20 border-b border-gold-border/20">
                                <tr>
                                    <th className="px-4 py-3 font-bold text-heading">Metric</th>
                                    <th className="px-4 py-3 font-bold text-heading">Your Profile</th>
                                    <th className="px-4 py-3 font-bold text-heading">Safe Benchmark</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gold-border/10">
                                {benchmarks.map((b, i) => (
                                    <tr key={i} className="hover:bg-cream/20">
                                        <td className="px-4 py-3 font-medium text-heading">{b.metric}</td>
                                        <td className="px-4 py-3 font-medium tabular-nums">{b.current}</td>
                                        <td className="px-4 py-3 text-muted tabular-nums">{b.ideal}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Smart Document Auditor (Premium) */}
            <DocumentAuditor predictionId={predictionId} existingAudit={auditedDocuments} />

            {/* Prediction Assistant Chatbot (Premium) */}
            <div>
                <h3 className="text-lg font-bold text-heading font-heading mb-3 flex items-center gap-2">
                    <span>💬</span> Prediction Assistant
                </h3>
                <PredictionChatPanel predictionId={predictionId} />
            </div>

            {/* Recommendations — Specific Breakdown */}
            {recommendation && (
                <div>
                    <h3 className="text-lg font-bold text-heading font-heading mb-3 flex items-center gap-2">
                        <span>🔍</span> Detailed Analysis
                    </h3>
                    <div className="bg-cream border border-gold-border/50 rounded-2xl p-5 sm:p-6">
                        <div className="prose prose-sm max-w-none text-body">
                            {recommendation.split("\n").map((para, i) =>
                                para.trim() ? (
                                    <p key={i} className="mb-3 last:mb-0">
                                        {para}
                                    </p>
                                ) : null
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Document re-analysis badge */}
            {hasDocumentAnalysis && (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-primary-50 border border-primary-200 rounded-xl">
                    <span className="text-lg">✓</span>
                    <span className="text-sm font-semibold text-primary">
                        Verified with documents
                    </span>
                </div>
            )}

            {/* Upload CTA */}
            {showUploadCTA && uploadWindowExpiresAt && (
                <UploadCountdown
                    expiresAt={uploadWindowExpiresAt}
                    predictionId={predictionId}
                />
            )}

            {/* Disclaimer */}
            <div className="border-t border-gold-border/30 pt-4">
                <p className="text-xs text-subtle text-center px-4">
                    ⚖️ This result is indicative and does not guarantee visa
                    approval. The final decision is made by the embassy or
                    consulate of the destination country.
                </p>
            </div>
        </div>
    );
}
