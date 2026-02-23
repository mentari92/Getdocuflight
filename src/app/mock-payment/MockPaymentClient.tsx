"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function MockPaymentClient() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [orderId, setOrderId] = useState<string | null>(null);
    const [amount, setAmount] = useState<string | null>(null);
    const [ref, setRef] = useState<string | null>(null);
    const [successUrl, setSuccessUrl] = useState<string | null>(null);

    const [isLoading, setIsLoading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState("QRIS");

    useEffect(() => {
        setOrderId(searchParams.get("orderId"));
        setAmount(searchParams.get("amount"));
        setRef(searchParams.get("ref"));
        setSuccessUrl(searchParams.get("successUrl"));
    }, [searchParams]);

    const handleSimulatePayment = async (status: "PAID" | "FAILED" = "PAID") => {
        setIsLoading(true);

        try {
            const res = await fetch("/api/mock-payment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    orderId,
                    paymentRef: ref,
                    amount,
                    status
                }),
            });

            if (!res.ok) throw new Error("Sandbox webhook delivery failed");

            // Redirect back to the order page
            if (successUrl) {
                router.push(successUrl);
            } else {
                router.push("/order");
            }
        } catch (error) {
            console.error(error);
            alert("Sandbox simulation failed. Check console.");
            setIsLoading(false);
        }
    };

    if (!orderId) return <div className="text-center text-muted">Missing simulation parameters.</div>;

    const formattedAmount = amount ? new Intl.NumberFormat("id-ID").format(Number(amount)) : "0";

    const paymentMethods = [
        { id: "QRIS", label: "QRIS", icon: "📱" },
        { id: "BCA_VA", label: "BCA Virtual Account", icon: "🏦" },
        { id: "GOPAY", label: "GoPay", icon: "🟢" },
        { id: "CC", label: "Credit Card", icon: "💳" }
    ];

    return (
        <div className="space-y-6">
            <div className="bg-surface rounded-xl p-4 text-center">
                <p className="text-xs text-muted font-mono mb-1">Order #${orderId.slice(0, 8)}</p>
                <div className="text-2xl font-black text-heading font-heading">
                    Rp {formattedAmount}
                </div>
            </div>

            <div className="space-y-3">
                <label className="text-sm font-bold text-heading">Select Mock Payment Method</label>
                <div className="grid grid-cols-2 gap-3">
                    {paymentMethods.map((method) => (
                        <button
                            key={method.id}
                            onClick={() => setPaymentMethod(method.id)}
                            className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${paymentMethod === method.id
                                    ? "border-primary bg-primary/5 text-primary"
                                    : "border-gold-border hover:border-primary/30 text-heading"
                                }`}
                        >
                            <span className="text-2xl mb-2">{method.icon}</span>
                            <span className="text-xs font-semibold">{method.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="pt-4 space-y-3">
                <button
                    onClick={() => handleSimulatePayment("PAID")}
                    disabled={isLoading}
                    className="w-full py-3.5 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50"
                >
                    {isLoading ? "Simulating..." : "✅ Simulate Successful Payment"}
                </button>
                <button
                    onClick={() => handleSimulatePayment("FAILED")}
                    disabled={isLoading}
                    className="w-full py-3 bg-white border border-red-200 text-red-600 font-semibold rounded-xl hover:bg-red-50 transition-all disabled:opacity-50"
                >
                    ❌ Simulate Failed Payment
                </button>
            </div>

            <p className="text-[10px] text-center text-muted">
                This sandbox bypasses real DompetX servers and securely triggers your local webhook handler.
            </p>
        </div>
    );
}
