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
    { icon: "🔒", text: "Enkripsi AES-256" },
    { icon: "🇪🇺", text: "Server GDPR Eropa" },
    { icon: "🤖", text: "Tidak dibaca manusia" },
    { icon: "🗑️", text: "Dihapus otomatis 24 jam" },
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
                        ✨ HASIL LENGKAP TERSEDIA
                    </div>
                    <h3 className="text-xl sm:text-2xl font-extrabold text-heading font-heading">
                        Lihat Hasil Lengkap +<br />
                        Saran Perbaikan
                    </h3>
                    <p className="text-sm text-muted mt-2 max-w-sm mx-auto">
                        Dapatkan skor persetujuan, analisis detail per faktor, dan
                        langkah konkret untuk meningkatkan peluang visa kamu.
                    </p>
                </div>

                {/* What You Get */}
                <div className="bg-white/60 rounded-xl p-4 mb-6 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-body">
                        <span className="text-green-500">✓</span>
                        Skor persetujuan akurat (0–100)
                    </div>
                    <div className="flex items-center gap-2 text-sm text-body">
                        <span className="text-green-500">✓</span>
                        Tingkat risiko (LOW / MEDIUM / HIGH)
                    </div>
                    <div className="flex items-center gap-2 text-sm text-body">
                        <span className="text-green-500">✓</span>
                        Breakdown faktor positif & negatif
                    </div>
                    <div className="flex items-center gap-2 text-sm text-body">
                        <span className="text-green-500">✓</span>
                        Saran perbaikan dengan langkah konkret
                    </div>
                    <div className="flex items-center gap-2 text-sm text-body">
                        <span className="text-green-500">✓</span>
                        Upload dokumen untuk re-analisis (24 jam)
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
                            (kurs: 1 USD = Rp {formattedRate})
                        </span>
                    </p>
                    <p className="text-xs text-subtle mt-0.5">
                        *Jumlah IDR berdasarkan kurs hari ini
                    </p>
                </div>

                {/* CTA Button */}
                <button
                    onClick={() => setShowModal(true)}
                    className="w-full py-4 bg-primary hover:bg-primary-dark text-white font-bold text-base rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                    Lihat Hasil Lengkap →
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
                    Hasil ini bersifat indikatif dan bukan jaminan persetujuan visa.
                    Pembayaran diproses melalui DompetX.
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
