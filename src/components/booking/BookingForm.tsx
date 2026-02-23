"use client";

/**
 * BookingForm — 2-step booking form with slide animation.
 *
 * Step 1: Flight Info (departure, arrival, dates, passengers)
 * Step 2: Contact & Payment (name, email, WA, TG, notification channel)
 */

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    POPULAR_CITIES,
    COUNTRIES,
    defaultStep2,
    type PassengerData,
    defaultPassenger,
} from "@/lib/booking-schema";

type TripType = "ONE_WAY" | "ROUND_TRIP";

interface Step1State {
    departureCity: string;
    arrivalCity: string;
    departureDate: string;
    returnDate: string;
    tripType: TripType;
    passengerCount: number;
    passengers: PassengerData[];
}

export default function BookingForm() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Step 1 state
    const [s1, setS1] = useState<Step1State>({
        departureCity: "",
        arrivalCity: "",
        departureDate: "",
        returnDate: "",
        tripType: "ONE_WAY",
        passengerCount: 1,
        passengers: [{ ...defaultPassenger }],
    });

    // Step 2 state
    const [s2, setS2] = useState(defaultStep2);

    // ── Step 1 handlers ────────────────────────────────

    const updateS1 = useCallback(
        (field: keyof Step1State, value: string | number | TripType) => {
            setS1((prev) => ({ ...prev, [field]: value }));
        },
        []
    );

    const updatePassenger = useCallback(
        (index: number, field: keyof PassengerData, value: string) => {
            setS1((prev) => {
                const passengers = [...prev.passengers];
                passengers[index] = { ...passengers[index], [field]: value };
                return { ...prev, passengers };
            });
        },
        []
    );

    const updatePassengerCount = useCallback((count: number) => {
        setS1((prev) => {
            const passengers = [...prev.passengers];
            while (passengers.length < count) {
                passengers.push({ ...defaultPassenger });
            }
            while (passengers.length > count) {
                passengers.pop();
            }
            return { ...prev, passengerCount: count, passengers };
        });
    }, []);

    // ── Step navigation ────────────────────────────────

    const validateStep1 = (): boolean => {
        if (!s1.departureCity) { setError("Pilih kota keberangkatan"); return false; }
        if (!s1.arrivalCity) { setError("Pilih kota tujuan"); return false; }
        if (s1.departureCity === s1.arrivalCity) { setError("Kota asal dan tujuan tidak boleh sama"); return false; }
        if (!s1.departureDate) { setError("Pilih tanggal keberangkatan"); return false; }
        if (s1.tripType === "ROUND_TRIP" && !s1.returnDate) { setError("Pilih tanggal pulang"); return false; }
        for (let i = 0; i < s1.passengers.length; i++) {
            if (!s1.passengers[i].fullName || s1.passengers[i].fullName.length < 2) {
                setError(`Nama penumpang ${i + 1} wajib diisi`);
                return false;
            }
        }
        setError(null);
        return true;
    };

    const goToStep2 = () => {
        if (validateStep1()) setStep(2);
    };

    const goBack = () => {
        setStep(1);
        setError(null);
    };

    // ── Submit ──────────────────────────────────────────

    const handleSubmit = async () => {
        if (!s2.contactName || s2.contactName.length < 2) {
            setError("Nama kontak wajib diisi");
            return;
        }
        if (!s2.contactEmail || !s2.contactEmail.includes("@")) {
            setError("Email tidak valid");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const response = await fetch("/api/bookings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...s1,
                    ...s2,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Gagal membuat booking");
            }

            router.push(`/dashboard/booking/${data.bookingId}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Terjadi kesalahan");
            setIsSubmitting(false);
        }
    };

    // ── Today's date for min ───────────────────────────

    const today = new Date().toISOString().split("T")[0];

    // ── Render ──────────────────────────────────────────

    return (
        <div className="w-full max-w-lg mx-auto">
            {/* Progress Bar */}
            <div className="flex items-center gap-3 mb-8">
                <div className="flex items-center gap-2 flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 1 ? "bg-primary text-white" : "bg-surface text-muted"}`}>
                        1
                    </div>
                    <span className={`text-sm font-medium ${step >= 1 ? "text-heading" : "text-muted"}`}>
                        Info Penerbangan
                    </span>
                </div>
                <div className={`h-0.5 w-8 ${step >= 2 ? "bg-primary" : "bg-gold-border"}`} />
                <div className="flex items-center gap-2 flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 2 ? "bg-primary text-white" : "bg-surface text-muted"}`}>
                        2
                    </div>
                    <span className={`text-sm font-medium ${step >= 2 ? "text-heading" : "text-muted"}`}>
                        Kontak & Bayar
                    </span>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="mb-4 p-3 bg-error-light/30 border border-error/30 rounded-xl text-sm text-error">
                    {error}
                </div>
            )}

            {/* ═══ STEP 1: Flight Info ═══ */}
            {step === 1 && (
                <div className="space-y-5 animate-in slide-in-from-right duration-300">
                    {/* Trip Type Toggle */}
                    <div className="flex bg-surface rounded-xl p-1">
                        {(["ONE_WAY", "ROUND_TRIP"] as TripType[]).map((type) => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => updateS1("tripType", type)}
                                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all cursor-pointer ${s1.tripType === type
                                    ? "bg-white text-primary shadow-sm"
                                    : "text-muted hover:text-heading"
                                    }`}
                            >
                                {type === "ONE_WAY" ? "Sekali Jalan" : "Pulang-Pergi"}
                            </button>
                        ))}
                    </div>

                    {/* Departure City */}
                    <div>
                        <label className="block text-sm font-semibold text-heading mb-1.5">
                            Kota Keberangkatan
                        </label>
                        <select
                            value={s1.departureCity}
                            onChange={(e) => updateS1("departureCity", e.target.value)}
                            className="w-full px-4 py-3 border border-gold-border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                        >
                            <option value="">Select departure city/country</option>
                            <optgroup label="Popular Cities">
                                {POPULAR_CITIES.map((city) => (
                                    <option key={city} value={city}>{city}</option>
                                ))}
                            </optgroup>
                            <optgroup label="Countries">
                                {COUNTRIES.map((c) => (
                                    <option key={c.value} value={c.label}>
                                        {c.label}
                                    </option>
                                ))}
                            </optgroup>
                        </select>
                    </div>

                    {/* Arrival City */}
                    <div>
                        <label className="block text-sm font-semibold text-heading mb-1.5">
                            Kota Tujuan
                        </label>
                        <select
                            value={s1.arrivalCity}
                            onChange={(e) => updateS1("arrivalCity", e.target.value)}
                            className="w-full px-4 py-3 border border-gold-border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                        >
                            <option value="">Select arrival city/country</option>
                            <optgroup label="Popular Cities">
                                {POPULAR_CITIES.map((city) => (
                                    <option key={city} value={city}>{city}</option>
                                ))}
                            </optgroup>
                            <optgroup label="Countries">
                                {COUNTRIES.map((c) => (
                                    <option key={c.value} value={c.label}>
                                        {c.label}
                                    </option>
                                ))}
                            </optgroup>
                        </select>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-semibold text-heading mb-1.5">
                                Tanggal Berangkat
                            </label>
                            <input
                                type="date"
                                value={s1.departureDate}
                                min={today}
                                onChange={(e) => updateS1("departureDate", e.target.value)}
                                className="w-full px-4 py-3 border border-gold-border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                            />
                        </div>
                        {s1.tripType === "ROUND_TRIP" && (
                            <div>
                                <label className="block text-sm font-semibold text-heading mb-1.5">
                                    Tanggal Pulang
                                </label>
                                <input
                                    type="date"
                                    value={s1.returnDate}
                                    min={s1.departureDate || today}
                                    onChange={(e) => updateS1("returnDate", e.target.value)}
                                    className="w-full px-4 py-3 border border-gold-border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                                />
                            </div>
                        )}
                    </div>

                    {/* Passenger Count */}
                    <div>
                        <label className="block text-sm font-semibold text-heading mb-1.5">
                            Jumlah Penumpang
                        </label>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => updatePassengerCount(Math.max(1, s1.passengerCount - 1))}
                                disabled={s1.passengerCount <= 1}
                                className="w-10 h-10 rounded-full bg-surface text-heading font-bold hover:bg-gold-border/50 disabled:opacity-30 transition-all cursor-pointer disabled:cursor-not-allowed"
                            >
                                −
                            </button>
                            <span className="text-lg font-bold text-heading w-8 text-center">
                                {s1.passengerCount}
                            </span>
                            <button
                                type="button"
                                onClick={() => updatePassengerCount(Math.min(9, s1.passengerCount + 1))}
                                disabled={s1.passengerCount >= 9}
                                className="w-10 h-10 rounded-full bg-surface text-heading font-bold hover:bg-gold-border/50 disabled:opacity-30 transition-all cursor-pointer disabled:cursor-not-allowed"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    {/* Passenger Details */}
                    <div className="space-y-3">
                        <label className="block text-sm font-semibold text-heading">
                            Data Penumpang
                        </label>
                        {s1.passengers.map((passenger, i) => (
                            <div key={i} className="bg-surface/50 rounded-xl p-4 space-y-3">
                                <p className="text-xs font-bold text-muted uppercase">
                                    Penumpang {i + 1}
                                </p>
                                <input
                                    type="text"
                                    placeholder="Nama lengkap (sesuai paspor)"
                                    value={passenger.fullName}
                                    onChange={(e) => updatePassenger(i, "fullName", e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gold-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                                />
                                <div className="grid grid-cols-2 gap-2">
                                    <select
                                        value={passenger.nationality}
                                        onChange={(e) => updatePassenger(i, "nationality", e.target.value)}
                                        className="w-full px-4 py-2.5 border border-gold-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                                    >
                                        <option value="">Nationality</option>
                                        {COUNTRIES.map((c) => (
                                            <option key={c.value} value={c.label}>
                                                {c.label}
                                            </option>
                                        ))}
                                    </select>
                                    <input
                                        type="text"
                                        placeholder="Passport no. (optional)"
                                        value={passenger.passportNo || ""}
                                        onChange={(e) => updatePassenger(i, "passportNo", e.target.value)}
                                        className="w-full px-4 py-2.5 border border-gold-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Next Button */}
                    <button
                        type="button"
                        onClick={goToStep2}
                        className="w-full py-4 bg-primary hover:bg-primary-dark text-white font-bold text-base rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                    >
                        Lanjut ke Kontak & Pembayaran →
                    </button>
                </div>
            )}

            {/* ═══ STEP 2: Contact & Payment ═══ */}
            {step === 2 && (
                <div className="space-y-5 animate-in slide-in-from-right duration-300">
                    {/* Summary of Step 1 */}
                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                        <p className="text-xs font-bold text-primary uppercase mb-2">
                            Ringkasan Penerbangan
                        </p>
                        <p className="text-sm font-semibold text-heading">
                            {s1.departureCity} → {s1.arrivalCity}
                        </p>
                        <p className="text-xs text-muted mt-1">
                            {s1.departureDate && new Date(s1.departureDate).toLocaleDateString("id-ID", { dateStyle: "long" })}
                            {s1.returnDate && ` — ${new Date(s1.returnDate).toLocaleDateString("id-ID", { dateStyle: "long" })}`}
                            {" · "}{s1.passengerCount} penumpang
                        </p>
                    </div>

                    {/* Contact Name */}
                    <div>
                        <label className="block text-sm font-semibold text-heading mb-1.5">
                            Nama Lengkap
                        </label>
                        <input
                            type="text"
                            placeholder="Nama pemesan"
                            value={s2.contactName}
                            onChange={(e) => setS2({ ...s2, contactName: e.target.value })}
                            className="w-full px-4 py-3 border border-gold-border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-semibold text-heading mb-1.5">
                            Email
                        </label>
                        <input
                            type="email"
                            placeholder="email@contoh.com"
                            value={s2.contactEmail}
                            onChange={(e) => setS2({ ...s2, contactEmail: e.target.value })}
                            className="w-full px-4 py-3 border border-gold-border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                        />
                    </div>

                    {/* WhatsApp */}
                    <div>
                        <label className="block text-sm font-semibold text-heading mb-1.5">
                            WhatsApp <span className="text-muted font-normal">(opsional)</span>
                        </label>
                        <input
                            type="tel"
                            placeholder="+62 812 3456 7890"
                            value={s2.contactWhatsApp}
                            onChange={(e) => setS2({ ...s2, contactWhatsApp: e.target.value })}
                            className="w-full px-4 py-3 border border-gold-border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                        />
                    </div>

                    {/* Telegram */}
                    <div>
                        <label className="block text-sm font-semibold text-heading mb-1.5">
                            Telegram <span className="text-muted font-normal">(opsional)</span>
                        </label>
                        <input
                            type="text"
                            placeholder="@username"
                            value={s2.contactTelegram}
                            onChange={(e) => setS2({ ...s2, contactTelegram: e.target.value })}
                            className="w-full px-4 py-3 border border-gold-border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                        />
                    </div>

                    {/* Notification Channel */}
                    <div>
                        <label className="block text-sm font-semibold text-heading mb-2">
                            Kirim konfirmasi via
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {([
                                { value: "EMAIL", icon: "📧", label: "Email" },
                                { value: "WHATSAPP", icon: "💬", label: "WhatsApp" },
                                { value: "TELEGRAM", icon: "✈️", label: "Telegram" },
                            ] as const).map((ch) => (
                                <button
                                    key={ch.value}
                                    type="button"
                                    onClick={() => setS2({ ...s2, preferredNotif: ch.value })}
                                    className={`py-3 rounded-xl text-center border-2 transition-all cursor-pointer ${s2.preferredNotif === ch.value
                                        ? "border-primary bg-primary/5 text-primary"
                                        : "border-gold-border text-muted hover:border-primary/30"
                                        }`}
                                >
                                    <span className="text-lg block">{ch.icon}</span>
                                    <span className="text-xs font-semibold">{ch.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={goBack}
                            disabled={isSubmitting}
                            className="flex-1 py-4 bg-surface text-heading font-bold text-sm rounded-xl hover:bg-gold-border/30 transition-all cursor-pointer disabled:opacity-50"
                        >
                            ← Kembali
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="flex-[2] py-4 bg-primary hover:bg-primary-dark text-white font-bold text-base rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                        >
                            {isSubmitting ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Memproses...
                                </span>
                            ) : (
                                "Pesan Dummy Ticket"
                            )}
                        </button>
                    </div>

                    {/* Price note */}
                    <p className="text-xs text-subtle text-center">
                        Harga: $3.00 USD (Rp ~49.500*). Pembayaran di halaman berikutnya.
                    </p>
                </div>
            )}
        </div>
    );
}
