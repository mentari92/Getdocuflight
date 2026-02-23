"use client";

/**
 * UploadPageClient — Client wrapper for the upload page.
 *
 * Phase 1: Shows DocumentUploadConsent
 * Phase 2: After consent, shows DocumentUploadZone
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import DocumentUploadConsent from "@/components/predictor/DocumentUploadConsent";
import DocumentUploadZone from "@/components/predictor/DocumentUploadZone";

interface UploadPageClientProps {
    predictionId: string;
    hasDocumentAnalysis: boolean;
}

export default function UploadPageClient({
    predictionId,
    hasDocumentAnalysis,
}: UploadPageClientProps) {
    const [consentGranted, setConsentGranted] = useState(false);
    const router = useRouter();

    // Already has document analysis — show completion state
    if (hasDocumentAnalysis) {
        return (
            <div className="text-center py-12">
                <span className="text-5xl mb-4 block">✅</span>
                <h2 className="text-xl font-bold text-heading font-heading mb-2">
                    Documents Already Analyzed
                </h2>
                <p className="text-sm text-muted max-w-sm mx-auto">
                    Your documents have already been processed and your
                    prediction has been updated with the analysis results.
                </p>
            </div>
        );
    }

    // Phase 1: Consent
    if (!consentGranted) {
        return (
            <DocumentUploadConsent
                predictionId={predictionId}
                onConsentGranted={() => setConsentGranted(true)}
            />
        );
    }

    // Phase 2: Upload zone
    return (
        <DocumentUploadZone
            predictionId={predictionId}
            onUploadComplete={() => {
                // Navigate to re-analysis page (Story 4.4)
                router.push(`/dashboard/predictions/${predictionId}`);
                router.refresh();
            }}
        />
    );
}
