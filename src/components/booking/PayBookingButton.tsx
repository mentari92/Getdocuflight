"use client";

/**
 * PayBookingButton — Client component for initiating payment via POST.
 *
 * Uses fetch() POST instead of <a href> (which would 405 on a POST endpoint).
 */

import { useState } from "react";
import { useRouter } from "next/navigation";

interface PayBookingButtonProps {
    bookingId: string;
    formattedIDR: string;
    exchangeRate: number;
    preferredNotif: string;
    amountUSD?: number;
}

export default function PayBookingButton({
    bookingId,
    formattedIDR,
    exchangeRate,
    preferredNotif,
    amountUSD = 10,
}: PayBookingButtonProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [gateway, setGateway] = useState<"DOMPETX" | "POLAR">("DOMPETX");
    const [error, setError] = useState<string | null>(null);

    const handlePay = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/bookings/${bookingId}/pay`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    paymentMethod: gateway === "POLAR" ? "card" : "qris",
                    gateway
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Payment failed");
            }

            // Redirect to DompetX payment page
            if (data.paymentUrl) {
                window.location.href = data.paymentUrl;
            } else {
                router.refresh();
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Payment processing failed");
            setIsLoading(false);
        }
    };

    const notifLabel =
        preferredNotif === "WHATSAPP"
            ? "WhatsApp"
            : preferredNotif === "TELEGRAM"
                ? "Telegram"
                : "Email";

    return (
        <div className="bg-gradient-to-br from-primary/5 via-white to-gold-light/30 border-2 border-primary/20 rounded-2xl p-6 text-center">
            <h3 className="text-lg font-bold text-heading font-heading mb-2">
                Complete Payment
            </h3>
            <p className="text-sm text-muted mb-4">
                {gateway === "POLAR"
                    ? `$${amountUSD.toFixed(2)} USD`
                    : `$${amountUSD.toFixed(2)} USD · Rp ${formattedIDR}`
                }
                <br />
                <span className="text-xs">
                    (rate: 1 USD = Rp{" "}
                    {new Intl.NumberFormat("en-US").format(exchangeRate)})
                </span>
            </p>

            {/* Gateway Selection */}
            <div className="flex gap-2 mb-4 p-1 bg-surface rounded-xl border border-gold-border/50">
                <button
                    type="button"
                    onClick={() => setGateway("DOMPETX")}
                    disabled={isLoading}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${gateway === "DOMPETX"
                        ? "bg-primary text-white shadow-sm"
                        : "text-muted hover:text-heading"
                        } cursor-pointer`}
                >
                    🇮🇩 Local (QRIS)
                </button>
                <button
                    type="button"
                    onClick={() => setGateway("POLAR")}
                    disabled={isLoading}
                    className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all ${gateway === "POLAR"
                        ? "bg-primary text-white shadow-sm"
                        : "text-muted hover:text-heading"
                        } cursor-pointer`}
                >
                    💳 Debit/Credit & Wallets
                </button>
            </div>

            <p className="text-xs text-subtle mb-4">
                Itinerary planning documents will be sent via {notifLabel} within 1–2 hours after payment.
            </p>

            {error && (
                <p className="text-xs text-red-600 mb-3 bg-red-50 rounded-lg py-2 px-3">
                    ⚠️ {error}
                </p>
            )}

            <button
                onClick={handlePay}
                disabled={isLoading}
                className="w-full py-4 bg-primary hover:bg-primary-dark text-white font-bold text-base rounded-xl shadow-lg shadow-primary/25 text-center transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
                {isLoading ? (
                    "⏳ Processing..."
                ) : gateway === "POLAR" ? (
                    `Pay $${amountUSD.toFixed(2)} →`
                ) : (
                    `Pay Rp ${formattedIDR} →`
                )}
            </button>
        </div>
    );
}
