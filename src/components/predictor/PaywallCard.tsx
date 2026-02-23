"use client";

/**
 * PaywallCard — CTA to unlock full prediction result.
 *
 * Shows price in USD + IDR, trust signals, and opens
 * PaymentModal on click.
 */

import { useState } from "react";
import PaymentModal from "./PaymentModal";

interface PaywallCardProps {
    predictionId: string;
    priceUSD: number;
    priceIDR: number;
    exchangeRate: number;
}

const TRUST_SIGNALS = [
    { icon: "🔒", text: "AES-256 Encryption" },
    { icon: "🇪🇺", text: "GDPR-Compliant EU Servers" },
    { icon: "🤖", text: "No human reads your data" },
    { icon: "🗑️", text: "Auto-deleted after 24 hours" },
];

export default function PaywallCard({
    predictionId,
    priceUSD,
    priceIDR,
    exchangeRate,
}: PaywallCardProps) {
    const [showModal, setShowModal] = useState(false);

    const formattedIDR = new Intl.NumberFormat("id-ID").format(priceIDR);
    const formattedRate = new Intl.NumberFormat("id-ID").format(
        Math.round(exchangeRate)
    );

    return (
        <>
            <div className="bg-gradient-to-br from-primary/5 via-white to-gold-light/30 border-2 border-primary/20 rounded-2xl p-6 sm:p-8 shadow-lg shadow-primary/5">
                {/* Header */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold mb-3">
                        ✨ FULL RESULTS AVAILABLE
                    </div>
                    <h3 className="text-xl sm:text-2xl font-extrabold text-heading font-heading">
                        View Full Results +<br />
                        Improvement Recommendations
                    </h3>
                    <p className="text-sm text-muted mt-2 max-w-sm mx-auto">
                        Get your approval score, detailed per-factor analysis, and
                        actionable steps to improve your visa chances.
                    </p>
                </div>

                {/* What You Get */}
                <div className="bg-white/60 rounded-xl p-4 mb-6 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-body">
                        <span className="text-primary">✓</span>
                        Accurate approval score (0–100)
                    </div>
                    <div className="flex items-center gap-2 text-sm text-body">
                        <span className="text-primary">✓</span>
                        Risk level (LOW / MEDIUM / HIGH)
                    </div>
                    <div className="flex items-center gap-2 text-sm text-body">
                        <span className="text-primary">✓</span>
                        Positive & negative factor breakdown
                    </div>
                    <div className="flex items-center gap-2 text-sm text-body">
                        <span className="text-primary">✓</span>
                        Improvement recommendations with concrete steps
                    </div>
                    <div className="flex items-center gap-2 text-sm text-body">
                        <span className="text-primary">✓</span>
                        Document upload for re-analysis (24 hours)
                    </div>
                </div>

                {/* Price */}
                <div className="text-center mb-6">
                    <div className="flex items-baseline justify-center gap-1.5">
                        <span className="text-3xl font-extrabold text-heading font-heading">
                            ${priceUSD.toFixed(2)}
                        </span>
                        <span className="text-sm text-muted">USD</span>
                    </div>
                    <p className="text-sm text-muted mt-1">
                        Rp {formattedIDR}{" "}
                        <span className="text-xs">
                            (rate: 1 USD = Rp {formattedRate})
                        </span>
                    </p>
                    <p className="text-xs text-subtle mt-0.5">
                        *IDR amount based on today&apos;s exchange rate
                    </p>
                </div>

                {/* CTA Button */}
                <button
                    onClick={() => setShowModal(true)}
                    className="w-full py-4 bg-primary hover:bg-primary-dark text-white font-bold text-base rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                    View Full Results →
                </button>

                {/* Trust Signals */}
                <div className="mt-5 grid grid-cols-2 gap-2">
                    {TRUST_SIGNALS.map((signal) => (
                        <div
                            key={signal.text}
                            className="flex items-center gap-1.5 text-xs text-muted"
                        >
                            <span>{signal.icon}</span>
                            <span>{signal.text}</span>
                        </div>
                    ))}
                </div>

                {/* Disclaimer */}
                <p className="text-[10px] text-subtle text-center mt-4 leading-relaxed">
                    This result is indicative and does not guarantee visa approval.
                    Payment processed via DompetX.
                </p>
            </div>

            {/* Payment Modal */}
            <PaymentModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                predictionId={predictionId}
                priceUSD={priceUSD}
                priceIDR={priceIDR}
                exchangeRate={exchangeRate}
            />
        </>
    );
}
