"use client";

/**
 * DocumentUploadConsent — GDPR/UU PDP consent gate for document upload.
 *
 * Shows 4 mandatory checkboxes covering:
 *  1. OpenAI data processing disclosure
 *  2. GDPR-compliant EU storage
 *  3. Auto-deletion after 24 hours
 *  4. Right to delete at any time
 *
 * "Continue to Upload" disabled until all 4 are checked.
 * Trust signals shown alongside checkboxes.
 */

import { useState } from "react";

interface DocumentUploadConsentProps {
    predictionId: string;
    onConsentGranted: () => void;
}

const CONSENT_ITEMS = [
    {
        id: "openai",
        text: "I understand my documents will be analyzed by our secure AI engine solely for this visa prediction.",
    },
    {
        id: "gdpr",
        text: "I understand documents are stored on GDPR-compliant European servers.",
    },
    {
        id: "autoDelete",
        text: "My documents will be automatically deleted 24 hours after analysis.",
    },
    {
        id: "rightToDelete",
        text: "I can request document deletion at any time from my dashboard.",
    },
];

const TRUST_SIGNALS = [
    { icon: "🔒", text: "AES-256 Encryption" },
    { icon: "🇪🇺", text: "GDPR-Compliant EU Servers" },
    { icon: "🤖", text: "No human reads your data" },
    { icon: "🗑️", text: "Auto-deleted after 24 hours" },
];

export default function DocumentUploadConsent({
    predictionId,
    onConsentGranted,
}: DocumentUploadConsentProps) {
    const [checked, setChecked] = useState<Record<string, boolean>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const allChecked = CONSENT_ITEMS.every((item) => checked[item.id]);

    const handleToggle = (id: string) => {
        setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const handleContinue = async () => {
        if (!allChecked) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const response = await fetch("/api/documents/consent", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ predictionId }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to record consent");
            }

            onConsentGranted();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Something went wrong. Please try again."
            );
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">📋</span>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-heading font-heading">
                        Document Upload Consent
                    </h2>
                </div>
                <p className="text-sm text-muted">
                    Before uploading sensitive documents, please review and
                    confirm the following data processing terms.
                </p>
            </div>

            {/* Consent Checkboxes */}
            <div className="bg-surface border border-gold-border/50 rounded-2xl p-5 sm:p-6 space-y-4">
                {CONSENT_ITEMS.map((item) => (
                    <label
                        key={item.id}
                        className={`flex items-start gap-3 cursor-pointer group p-3 rounded-xl transition-colors ${checked[item.id]
                            ? "bg-primary/5"
                            : "hover:bg-cream/50"
                            }`}
                    >
                        <div className="relative mt-0.5 shrink-0">
                            <input
                                type="checkbox"
                                checked={!!checked[item.id]}
                                onChange={() => handleToggle(item.id)}
                                className="sr-only"
                            />
                            <div
                                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${checked[item.id]
                                    ? "bg-primary border-primary"
                                    : "border-gold-border group-hover:border-primary/50"
                                    }`}
                            >
                                {checked[item.id] && (
                                    <svg
                                        className="w-3.5 h-3.5 text-white"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={3}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M5 13l4 4L19 7"
                                        />
                                    </svg>
                                )}
                            </div>
                        </div>
                        <span className="text-sm text-body leading-relaxed">
                            {item.text}
                        </span>
                    </label>
                ))}
            </div>

            {/* Trust Signals */}
            <div className="grid grid-cols-2 gap-3">
                {TRUST_SIGNALS.map((signal) => (
                    <div
                        key={signal.text}
                        className="flex items-center gap-2 px-3 py-2 bg-cream rounded-xl"
                    >
                        <span className="text-base">{signal.icon}</span>
                        <span className="text-xs text-muted font-medium">
                            {signal.text}
                        </span>
                    </div>
                ))}
            </div>

            {/* Error */}
            {error && (
                <div className="p-3 bg-error-light/30 border border-error/30 rounded-xl text-sm text-error">
                    {error}
                </div>
            )}

            {/* Continue Button */}
            <button
                onClick={handleContinue}
                disabled={!allChecked || isSubmitting}
                className={`w-full py-4 font-bold text-base rounded-xl transition-all duration-200 ${allChecked
                    ? "bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                    : "bg-gold-border/30 text-muted cursor-not-allowed"
                    } disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100`}
            >
                {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                        <svg
                            className="w-5 h-5 animate-spin"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                            />
                        </svg>
                        Recording consent...
                    </span>
                ) : (
                    <>
                        {allChecked ? "✓ " : ""}Continue to Upload
                    </>
                )}
            </button>

            {/* Privacy Policy Link */}
            <p className="text-center text-xs text-subtle">
                By continuing, you agree to our{" "}
                <a
                    href="/privacy"
                    className="text-primary underline hover:text-primary-dark"
                >
                    Privacy Policy
                </a>{" "}
                and data processing terms.
            </p>
        </div>
    );
}
