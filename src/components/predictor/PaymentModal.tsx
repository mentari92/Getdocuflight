"use client";

/**
 * PaymentModal — Payment method selection + DompetX checkout.
 *
 * Opens as a modal overlay. User selects payment method,
 * clicks "Pay Now" → POST /api/payments/create → redirect to DompetX.
 */

import { useState } from "react";

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    predictionId: string;
    priceUSD: number;
    priceIDR: number;
    exchangeRate: number;
}

const PAYMENT_METHODS = [
    { value: "qris", label: "QRIS", icon: "📱", desc: "Scan & pay", gateway: "DOMPETX" },
    { value: "card", label: "Debit / Credit Card", icon: "💳", desc: "Apple Pay, Google Pay, & Cards", gateway: "POLAR" },
    { value: "virtual_account_bca", label: "VA BCA", icon: "🏦", desc: "Bank transfer", gateway: "DOMPETX" },
    { value: "virtual_account_bni", label: "VA BNI", icon: "🏦", desc: "Bank transfer", gateway: "DOMPETX" },
    { value: "gopay", label: "GoPay", icon: "💚", desc: "E-wallet", gateway: "DOMPETX" },
    { value: "ovo", label: "OVO", icon: "💜", desc: "E-wallet", gateway: "DOMPETX" },
];


export default function PaymentModal({
    isOpen,
    onClose,
    predictionId,
    priceUSD,
    priceIDR,
    exchangeRate,
}: PaymentModalProps) {
    const [selectedMethod, setSelectedMethod] = useState("qris");
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const formattedIDR = new Intl.NumberFormat("id-ID").format(priceIDR);
    const formattedRate = new Intl.NumberFormat("id-ID").format(
        Math.round(exchangeRate)
    );

    const handlePay = async () => {
        setIsProcessing(true);
        setError(null);

        try {
            const response = await fetch("/api/payments/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    predictionId,
                    paymentMethod: selectedMethod,
                    gateway: PAYMENT_METHODS.find(m => m.value === selectedMethod)?.gateway || "DOMPETX",
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Payment failed");
            }

            // Redirect to DompetX payment page
            window.location.href = data.paymentUrl;
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Payment failed. Please try again."
            );
            setIsProcessing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl m-0 sm:m-4 animate-in slide-in-from-bottom duration-300">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gold-border/50 px-5 py-4 rounded-t-2xl flex items-center justify-between z-10">
                    <h3 className="text-lg font-bold text-heading font-heading">
                        Payment
                    </h3>
                    <button
                        onClick={onClose}
                        disabled={isProcessing}
                        className="w-8 h-8 rounded-full bg-surface flex items-center justify-center text-muted hover:text-heading transition-colors cursor-pointer"
                    >
                        ✕
                    </button>
                </div>

                <div className="p-5 space-y-5">
                    {/* Price Summary */}
                    <div className="bg-primary/5 rounded-xl p-4 text-center">
                        <p className="text-sm text-muted mb-1">Total payment</p>
                        <div className="flex items-baseline justify-center gap-1.5">
                            <span className="text-2xl font-extrabold text-heading font-heading">
                                Rp {formattedIDR}
                            </span>
                        </div>
                        <p className="text-xs text-muted mt-1">
                            {selectedMethod === "card"
                                ? `$${priceUSD.toFixed(2)} USD`
                                : `~ $${priceUSD.toFixed(2)} USD · rate: 1 USD = Rp ${formattedRate}`
                            }
                        </p>
                    </div>

                    {/* Payment Methods */}
                    <div>
                        <p className="text-sm font-semibold text-heading mb-3">
                            Select payment method
                        </p>
                        <div className="space-y-2">
                            {PAYMENT_METHODS.map((method) => (
                                <button
                                    key={method.value}
                                    type="button"
                                    onClick={() =>
                                        setSelectedMethod(method.value)
                                    }
                                    disabled={isProcessing}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all duration-200 text-left ${selectedMethod === method.value
                                        ? "border-primary bg-primary/5"
                                        : "border-gold-border hover:border-primary/30"
                                        } uppercase ${method.gateway === "POLAR" ? "border-gold/50 bg-gold/5" : ""} ${isProcessing ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                                >
                                    <span className="text-xl">
                                        {method.icon}
                                    </span>
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-heading">
                                            {method.label}
                                        </p>
                                        <p className="text-xs text-muted">
                                            {method.desc}
                                        </p>
                                    </div>
                                    {selectedMethod === method.value && (
                                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                            <svg
                                                className="w-3 h-3 text-white"
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
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="p-3 bg-error-light/30 border border-error/30 rounded-xl text-sm text-error">
                            {error}
                        </div>
                    )}

                    {/* Pay Button */}
                    <button
                        onClick={handlePay}
                        disabled={isProcessing}
                        className="w-full py-4 bg-primary hover:bg-primary-dark text-white font-bold text-base rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer"
                    >
                        {isProcessing ? (
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
                                Processing...
                            </span>
                        ) : selectedMethod === "card" ? (
                            `Pay $${priceUSD.toFixed(2)}`
                        ) : (
                            `Pay Rp ${formattedIDR}`
                        )}
                    </button>

                    {/* Security footer */}
                    <div className="flex items-center justify-center gap-2 pt-2">
                        <span className="text-xs text-muted">
                            🔒 {PAYMENT_METHODS.find(m => m.value === selectedMethod)?.gateway === "POLAR"
                                ? "Secure payment via Polar.sh"
                                : "Secure payment via DompetX"}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
