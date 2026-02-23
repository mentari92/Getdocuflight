"use client";

/**
 * StatusUpdateButton — Admin button to transition booking status.
 *
 * Shows a confirmation dialog, calls PATCH API, and refreshes the page.
 * Supports: PAID → DELIVERED, DELIVERED → COMPLETED.
 * Improved with shared constants and better UI feedback.
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BOOKING_STATUS, ADMIN_STATUS_TRANSITIONS, STATUS_UI_CONFIG } from "@/lib/order-constants";

interface StatusUpdateButtonProps {
    bookingId: string;
    currentStatus: string;
}

export default function StatusUpdateButton({
    bookingId,
    currentStatus,
}: StatusUpdateButtonProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showConfirm, setShowConfirm] = useState(false);

    // Get allowed targets from shared config
    const allowedTargets = ADMIN_STATUS_TRANSITIONS[currentStatus];

    // For this button, we assume one primary path (PAID -> DELIVERED, DELIVERED -> COMPLETED)
    const targetStatus = allowedTargets?.[0];
    const config = targetStatus ? STATUS_UI_CONFIG[targetStatus] : null;

    // Reset success message after 3 seconds
    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => setSuccess(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [success]);

    if (!config || !targetStatus) return null;

    const handleUpdate = async () => {
        setIsLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await fetch(`/api/admin/orders/${bookingId}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: targetStatus }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to update status");
            }

            setSuccess(`Status updated to ${targetStatus}!`);
            setShowConfirm(false);

            // Wait a bit to show success before refreshing
            setTimeout(() => {
                router.refresh();
                setIsLoading(false);
            }, 1000);

        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
            setIsLoading(false);
        }
    };

    const buttonColor = targetStatus === BOOKING_STATUS.DELIVERED
        ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
        : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20";

    return (
        <div className="space-y-3">
            {error && (
                <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg py-2 px-3 flex items-center gap-2">
                    <span>⚠️</span> {error}
                </div>
            )}

            {success && (
                <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg py-2 px-3 flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                    <span>✅</span> {success}
                </div>
            )}

            {!showConfirm ? (
                <button
                    onClick={() => setShowConfirm(true)}
                    disabled={success !== null}
                    className={`w-full py-4 px-6 text-white font-bold text-sm rounded-xl shadow-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${buttonColor}`}
                >
                    {config.icon} Mark as {config.label}
                </button>
            ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-4 shadow-inner">
                    <p className="text-sm font-semibold text-amber-900">
                        Confirm Status Change
                    </p>
                    <p className="text-sm text-amber-800">
                        Update booking status to <strong>{config.label}</strong>? This will also update the payment order status.
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={handleUpdate}
                            disabled={isLoading}
                            className={`flex-1 py-3 text-white font-bold text-sm rounded-xl transition-all cursor-pointer disabled:opacity-60 ${buttonColor}`}
                        >
                            {isLoading ? "⏳ Updating..." : "Confirm"}
                        </button>
                        <button
                            onClick={() => {
                                setShowConfirm(false);
                                setError(null);
                            }}
                            disabled={isLoading}
                            className="flex-1 py-3 bg-white text-gray-700 font-bold border border-gray-200 text-sm rounded-xl hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-60"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
