"use client";

/**
 * PredictorTeaser — Free preview with blurred paid sections.
 *
 * Shows the teaser text prominently, with placeholder/locked
 * sections for score, risk badge, factors, and recommendations.
 * No real data is rendered in locked sections.
 */

interface PredictorTeaserProps {
    teaser: string;
    destination: string;
    createdAt: string;
}

export default function PredictorTeaser({
    teaser,
    destination,
    createdAt,
}: PredictorTeaserProps) {
    const formattedDate = new Date(createdAt).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <div className="flex items-center gap-2 text-sm text-muted mb-1">
                    <span>📅 {formattedDate}</span>
                    <span>•</span>
                    <span className="capitalize">🌍 {destination.replace(/_/g, " ")}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-heading font-heading">
                    Hasil Prediksi Visa Kamu
                </h2>
            </div>

            {/* Teaser Text — VISIBLE */}
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 sm:p-6">
                <div className="flex items-start gap-3">
                    <span className="text-2xl mt-0.5">💡</span>
                    <div>
                        <h3 className="text-sm font-bold text-primary mb-2 uppercase tracking-wide">
                            Preview Analisis
                        </h3>
                        <p className="text-body leading-relaxed whitespace-pre-line">
                            {teaser}
                        </p>
                    </div>
                </div>
            </div>

            {/* Approval Score — LOCKED */}
            <div className="relative">
                <div className="bg-surface border border-gold-border rounded-2xl p-6 text-center select-none">
                    <p className="text-sm text-muted mb-2">Skor Persetujuan</p>
                    <div className="relative inline-block">
                        <span className="text-6xl font-extrabold text-heading/10 font-heading blur-lg select-none">
                            72
                        </span>
                        <span className="text-2xl text-heading/10 blur-lg">/100</span>
                        {/* Lock overlay */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="bg-white/80 backdrop-blur-sm rounded-xl px-4 py-2 shadow-sm border border-gold-border">
                                <span className="text-lg">🔒</span>
                                <span className="text-sm font-semibold text-muted ml-1.5">
                                    Terkunci
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Risk Level Badge — LOCKED */}
            <div className="flex justify-center">
                <div className="relative">
                    <div className="px-6 py-2 rounded-full bg-gradient-to-r from-yellow-100 to-orange-100 blur-sm select-none">
                        <span className="text-sm font-bold text-yellow-800">MEDIUM RISK</span>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 shadow-sm border border-gold-border">
                            <span className="text-xs font-semibold text-muted">🔒 Tingkat Risiko</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Factors Table — LOCKED */}
            <div className="relative">
                <div className="bg-surface border border-gold-border rounded-2xl overflow-hidden select-none">
                    <div className="p-4 border-b border-gold-border/50 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-heading">
                            📊 Faktor Penilaian
                        </h3>
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                            🔒 Terkunci
                        </span>
                    </div>
                    <div className="divide-y divide-gold-border/30">
                        {[
                            { icon: "🟢", label: "██████████", detail: "████████████████████" },
                            { icon: "🟡", label: "████████", detail: "██████████████████████████" },
                            { icon: "🔴", label: "████████████", detail: "████████████████" },
                        ].map((row, i) => (
                            <div key={i} className="px-4 py-3 flex items-center gap-3 blur-[3px]">
                                <span className="text-lg">{row.icon}</span>
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-heading">
                                        {row.label}
                                    </p>
                                    <p className="text-xs text-muted">{row.detail}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                {/* Overlay */}
                <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] rounded-2xl flex items-center justify-center">
                    <div className="bg-white/90 rounded-xl px-5 py-3 shadow-md border border-gold-border text-center">
                        <p className="text-sm font-bold text-heading">
                            3–5 faktor dianalisis
                        </p>
                        <p className="text-xs text-muted mt-0.5">
                            Unlock untuk melihat detail
                        </p>
                    </div>
                </div>
            </div>

            {/* Recommendations — LOCKED */}
            <div className="relative">
                <div className="bg-surface border border-gold-border rounded-2xl p-5 select-none">
                    <h3 className="text-sm font-bold text-heading mb-3">
                        📝 Saran Perbaikan
                    </h3>
                    <div className="space-y-2 blur-[4px]">
                        <div className="flex items-start gap-2">
                            <span className="text-primary font-bold text-sm">1.</span>
                            <p className="text-sm text-body">
                                ████████████████████████████████████
                            </p>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-primary font-bold text-sm">2.</span>
                            <p className="text-sm text-body">
                                ██████████████████████████████
                            </p>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-primary font-bold text-sm">3.</span>
                            <p className="text-sm text-body">
                                ████████████████████████████████████████
                            </p>
                        </div>
                    </div>
                </div>
                {/* Overlay */}
                <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] rounded-2xl flex items-center justify-center">
                    <div className="bg-white/90 rounded-xl px-5 py-3 shadow-md border border-gold-border text-center">
                        <p className="text-sm font-bold text-heading">
                            3–4 rekomendasi tersedia
                        </p>
                        <p className="text-xs text-muted mt-0.5">
                            Termasuk langkah perbaikan konkret
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
