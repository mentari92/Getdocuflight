"use client";

/**
 * CopyPassengerData — Copy B2B-formatted passenger data to clipboard.
 *
 * Formats each passenger as: "Mr John Doe, 15-Mar-1990"
 * Shows "✅ Copied!" toast feedback.
 */

import { useState } from "react";

interface Passenger {
    id: string;
    fullName: string;
    nationality: string;
    salutation?: string | null;
    dateOfBirth?: string | null;
    passportNo?: string | null;
}

interface CopyPassengerDataProps {
    passengers: Passenger[];
    bookingRoute: string;
}

function formatDOB(dateStr: string | null | undefined): string {
    if (!dateStr) return "DOB N/A";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function formatPassengerLine(p: Passenger, index: number): string {
    const salutation = p.salutation || "Mr/Ms";
    const dob = formatDOB(p.dateOfBirth);
    const passport = p.passportNo ? ` | ${p.passportNo}` : "";
    return `${index + 1}. ${salutation} ${p.fullName}, ${dob}${passport} (${p.nationality})`;
}

export default function CopyPassengerData({
    passengers,
    bookingRoute,
}: CopyPassengerDataProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        const header = `GetDocuFlight — ${bookingRoute}`;
        const lines = passengers.map((p, i) => formatPassengerLine(p, i));
        const text = `${header}\n${"—".repeat(30)}\n${lines.join("\n")}`;

        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback for older browsers
            const textarea = document.createElement("textarea");
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="space-y-3">
            {/* Passenger list preview */}
            <div className="bg-gray-50 rounded-xl p-4 font-mono text-xs space-y-1">
                {passengers.map((p, i) => (
                    <div key={p.id} className="text-heading">
                        {formatPassengerLine(p, i)}
                    </div>
                ))}
            </div>

            {/* Copy button */}
            <button
                onClick={handleCopy}
                className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition-all cursor-pointer ${copied
                        ? "bg-green-500 text-white"
                        : "bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/20"
                    }`}
            >
                {copied ? "✅ Copied to Clipboard!" : "📋 Copy All Passengers for B2B"}
            </button>
        </div>
    );
}
