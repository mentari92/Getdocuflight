"use client";

/**
 * OrderForm — 5-step order form for verified flight reservation / bundle.
 *
 * Step 0: Product Selection (VERIFIED_FLIGHT $10 / VERIFIED_BUNDLE $20)
 * Step 1: Passenger Details (count + per-passenger fields)
 * Step 2: Flight Info (departure, arrival, dates, trip type)
 * Step 3: Hotel Details (conditional — only for VERIFIED_BUNDLE)
 * Step 4: Contact & Submit
 */

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    POPULAR_CITIES,
    COUNTRIES,
    PRICING,
    defaultPassenger,
    defaultContact,
    type PassengerData,
    type ProductTypeKey,
} from "@/lib/booking-schema";
import SearchableCitySelect from "./SearchableCitySelect";

type TripType = "ONE_WAY" | "ROUND_TRIP";

/* ─── Step labels ───────────────────────────────────────── */

const STEP_LABELS = [
    { icon: "📦", label: "Product" },
    { icon: "👤", label: "Passengers" },
    { icon: "✈️", label: "Flight" },
    { icon: "🏨", label: "Hotel" },
    { icon: "📋", label: "Contact" },
];

/* ─── Component ─────────────────────────────────────────── */

export default function OrderForm() {
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Step 0
    const [productType, setProductType] = useState<ProductTypeKey>("VERIFIED_FLIGHT");

    // Step 1
    const [passengerCount, setPassengerCountState] = useState(1);
    const [passengers, setPassengers] = useState<PassengerData[]>([
        { ...defaultPassenger },
    ]);

    // Step 2
    const [departureCity, setDepartureCity] = useState("");
    const [arrivalCity, setArrivalCity] = useState("");
    const [departureDate, setDepartureDate] = useState("");
    const [returnDate, setReturnDate] = useState("");
    const [tripType, setTripType] = useState<TripType>("ONE_WAY");

    // Step 3 (hotel)
    const [hotelCity, setHotelCity] = useState("");
    const [hotelCheckIn, setHotelCheckIn] = useState("");
    const [hotelCheckOut, setHotelCheckOut] = useState("");

    // Step 4 (contact)
    const [contact, setContact] = useState(defaultContact);

    const isBundle = productType === "VERIFIED_BUNDLE";
    const price = PRICING[productType];
    const totalSteps = isBundle ? 5 : 4; // skip hotel step for flight-only
    const today = new Date().toISOString().split("T")[0];

    /* ─── Passenger helpers ──────────────────────────────── */

    const updatePassenger = useCallback(
        (index: number, field: keyof PassengerData, value: string) => {
            setPassengers((prev) => {
                const updated = [...prev];
                updated[index] = { ...updated[index], [field]: value };
                return updated;
            });
        },
        []
    );

    const updatePassengerCount = useCallback((count: number) => {
        setPassengerCountState(count);
        setPassengers((prev) => {
            const updated = [...prev];
            while (updated.length < count) updated.push({ ...defaultPassenger });
            while (updated.length > count) updated.pop();
            return updated;
        });
    }, []);

    /* ─── Step mapping (accounts for skipping hotel) ─────── */

    // Maps visual step index to logical step
    const getLogicalStep = (visualStep: number): number => {
        if (!isBundle && visualStep >= 3) return visualStep + 1;
        return visualStep;
    };

    const getVisualStep = (logicalStep: number): number => {
        if (!isBundle && logicalStep >= 4) return logicalStep - 1;
        return logicalStep;
    };

    const currentLogical = getLogicalStep(step);

    /* ─── Validation ─────────────────────────────────────── */

    const validateCurrentStep = (): boolean => {
        setError(null);

        switch (currentLogical) {
            case 0: // product — always valid
                return true;

            case 1: // passengers
                for (let i = 0; i < passengers.length; i++) {
                    if (!passengers[i].fullName || passengers[i].fullName.length < 2) {
                        setError(`Passenger ${i + 1} name is required (min 2 characters)`);
                        return false;
                    }
                }
                return true;

            case 2: // flight
                if (!departureCity) { setError("Please select departure city"); return false; }
                if (!arrivalCity) { setError("Please select arrival city"); return false; }
                if (departureCity === arrivalCity) { setError("Pick a different arrival city"); return false; }
                if (!departureDate) { setError("Please select departure date"); return false; }
                if (tripType === "ROUND_TRIP" && !returnDate) { setError("Return date is required"); return false; }
                return true;

            case 3: // hotel (only for bundle)
                if (!hotelCity) { setError("Please select hotel city"); return false; }
                if (!hotelCheckIn) { setError("Please select check-in date"); return false; }
                if (!hotelCheckOut) { setError("Please select check-out date"); return false; }
                if (new Date(hotelCheckOut) <= new Date(hotelCheckIn)) {
                    setError("Check-out must be after check-in");
                    return false;
                }
                return true;

            case 4: // contact
                if (!contact.contactName || contact.contactName.length < 2) {
                    setError("Contact name is required");
                    return false;
                }
                if (!contact.contactEmail || !contact.contactEmail.includes("@")) {
                    setError("Please enter a valid email");
                    return false;
                }
                return true;

            default:
                return true;
        }
    };

    /* ─── Navigation ─────────────────────────────────────── */

    const goNext = () => {
        if (validateCurrentStep()) {
            setStep((s) => Math.min(s + 1, totalSteps - 1));
            setError(null);
        }
    };

    const goBack = () => {
        setStep((s) => Math.max(s - 1, 0));
        setError(null);
    };

    /* ─── Submit ──────────────────────────────────────────── */

    const handleSubmit = async () => {
        if (!validateCurrentStep()) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const response = await fetch("/api/bookings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    productType,
                    passengerCount,
                    passengers,
                    departureCity,
                    arrivalCity,
                    departureDate,
                    returnDate: returnDate || undefined,
                    tripType,
                    hotelCity: isBundle ? hotelCity : undefined,
                    hotelCheckIn: isBundle ? hotelCheckIn : undefined,
                    hotelCheckOut: isBundle ? hotelCheckOut : undefined,
                    ...contact,
                }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Failed to create order");

            router.push(`/order/${data.bookingId}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
            setIsSubmitting(false);
        }
    };

    const isLastStep = step === totalSteps - 1;

    /* ─── Input classes ──────────────────────────────────── */

    const inputCls =
        "w-full px-4 py-3 border border-gold-border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all";
    const labelCls = "block text-sm font-semibold text-heading mb-1.5";

    /* ─── Render ──────────────────────────────────────────── */

    return (
        <div className="w-full max-w-lg mx-auto">
            {/* ── Progress Bar ──────────────────────────────── */}
            <div className="flex items-center gap-1 mb-8 overflow-x-auto">
                {Array.from({ length: totalSteps }).map((_, i) => {
                    const logical = getLogicalStep(i);
                    const info = STEP_LABELS[logical];
                    const isActive = i === step;
                    const isDone = i < step;

                    return (
                        <div key={i} className="flex items-center gap-1 flex-1 min-w-0">
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-all ${isDone
                                    ? "bg-green-500 text-white"
                                    : isActive
                                        ? "bg-primary text-white shadow-lg shadow-primary/30"
                                        : "bg-surface text-muted"
                                    }`}
                            >
                                {isDone ? "✓" : info.icon}
                            </div>
                            <span
                                className={`text-xs font-medium truncate hidden sm:block ${isActive ? "text-heading" : "text-muted"
                                    }`}
                            >
                                {info.label}
                            </span>
                            {i < totalSteps - 1 && (
                                <div
                                    className={`h-0.5 w-4 shrink-0 ${isDone ? "bg-green-500" : "bg-gold-border"
                                        }`}
                                />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* ── Error ──────────────────────────────────────── */}
            {error && (
                <div className="mb-4 p-3 bg-error-light/30 border border-error/30 rounded-xl text-sm text-error">
                    {error}
                </div>
            )}

            {/* ═══ STEP 0: Product Selection ═══ */}
            {currentLogical === 0 && (
                <div className="space-y-4 animate-in slide-in-from-right duration-300">
                    <h2 className="text-lg font-bold text-heading font-heading">
                        Select Planning Service
                    </h2>
                    <p className="text-sm text-muted">
                        Digital travel itinerary assistance for visa documentation. Verified itineraries are typically processed within 1–2 working hours.
                    </p>

                    <div className="grid gap-3">
                        {/* Flight Only */}
                        <button
                            type="button"
                            onClick={() => setProductType("VERIFIED_FLIGHT")}
                            className={`relative text-left p-5 rounded-2xl border-2 transition-all cursor-pointer ${productType === "VERIFIED_FLIGHT"
                                ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                                : "border-gold-border hover:border-primary/30 bg-white"
                                }`}
                        >
                            {productType === "VERIFIED_FLIGHT" && (
                                <div className="absolute top-3 right-3 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                                    <span className="text-white text-xs">✓</span>
                                </div>
                            )}
                            <span className="text-2xl mb-2 block">📋</span>
                            <h3 className="text-base font-bold text-heading">
                                Verified Itinerary Planning
                            </h3>
                            <p className="text-xs text-muted mt-1">
                                Legitimate flight itinerary arrangement for visa documentation
                            </p>
                            <p className="text-xl font-extrabold text-primary mt-3">
                                ${PRICING.VERIFIED_FLIGHT}
                                <span className="text-xs font-normal text-muted ml-1">
                                    USD
                                </span>
                            </p>
                        </button>

                        {/* Bundle */}
                        <button
                            type="button"
                            onClick={() => setProductType("VERIFIED_BUNDLE")}
                            className={`relative text-left p-5 rounded-2xl border-2 transition-all cursor-pointer ${productType === "VERIFIED_BUNDLE"
                                ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                                : "border-gold-border hover:border-primary/30 bg-white"
                                }`}
                        >
                            {productType === "VERIFIED_BUNDLE" && (
                                <div className="absolute top-3 right-3 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                                    <span className="text-white text-xs">✓</span>
                                </div>
                            )}
                            <span className="text-2xl mb-2 block">📋🏨</span>
                            <h3 className="text-base font-bold text-heading">
                                Comprehensive Travel Plan
                            </h3>
                            <p className="text-xs text-muted mt-1">
                                Detailed flight and hotel itinerary planning assistance
                            </p>
                            <p className="text-xl font-extrabold text-primary mt-3">
                                ${PRICING.VERIFIED_BUNDLE}
                                <span className="text-xs font-normal text-muted ml-1">
                                    USD
                                </span>
                            </p>
                        </button>
                    </div>
                </div>
            )}

            {/* ═══ STEP 1: Passenger Details ═══ */}
            {currentLogical === 1 && (
                <div className="space-y-5 animate-in slide-in-from-right duration-300">
                    <h2 className="text-lg font-bold text-heading font-heading">
                        Passenger Details
                    </h2>

                    {/* Passenger Count */}
                    <div>
                        <label className={labelCls}>Number of Passengers</label>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => updatePassengerCount(Math.max(1, passengerCount - 1))}
                                disabled={passengerCount <= 1}
                                className="w-10 h-10 rounded-full bg-surface text-heading font-bold hover:bg-gold-border/50 disabled:opacity-30 transition-all cursor-pointer disabled:cursor-not-allowed"
                            >
                                −
                            </button>
                            <span className="text-lg font-bold text-heading w-8 text-center">
                                {passengerCount}
                            </span>
                            <button
                                type="button"
                                onClick={() => updatePassengerCount(Math.min(9, passengerCount + 1))}
                                disabled={passengerCount >= 9}
                                className="w-10 h-10 rounded-full bg-surface text-heading font-bold hover:bg-gold-border/50 disabled:opacity-30 transition-all cursor-pointer disabled:cursor-not-allowed"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    {/* Passenger Forms */}
                    <div className="space-y-3">
                        {passengers.map((passenger, i) => (
                            <div key={i} className="bg-surface/50 rounded-xl p-4 space-y-3">
                                <p className="text-xs font-bold text-muted uppercase">
                                    Passenger {i + 1}
                                </p>
                                <input
                                    type="text"
                                    placeholder="Full name (as on passport)"
                                    value={passenger.fullName}
                                    onChange={(e) => updatePassenger(i, "fullName", e.target.value)}
                                    className={inputCls}
                                />
                                <div className="grid grid-cols-2 gap-2">
                                    <select
                                        value={passenger.nationality}
                                        onChange={(e) => updatePassenger(i, "nationality", e.target.value)}
                                        className={inputCls}
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
                                        className={inputCls}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <select
                                        value={passenger.salutation || ""}
                                        onChange={(e) => updatePassenger(i, "salutation", e.target.value)}
                                        className={inputCls}
                                    >
                                        <option value="">Title</option>
                                        <option value="Mr">Mr</option>
                                        <option value="Ms">Ms</option>
                                        <option value="Mrs">Mrs</option>
                                    </select>
                                    <input
                                        type="date"
                                        placeholder="Date of birth"
                                        value={passenger.dateOfBirth || ""}
                                        onChange={(e) => updatePassenger(i, "dateOfBirth", e.target.value)}
                                        className={inputCls}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ═══ STEP 2: Flight Info ═══ */}
            {currentLogical === 2 && (
                <div className="space-y-5 animate-in slide-in-from-right duration-300">
                    <h2 className="text-lg font-bold text-heading font-heading">
                        Flight Information
                    </h2>

                    {/* Trip Type Toggle */}
                    <div className="flex bg-surface rounded-xl p-1">
                        {(["ONE_WAY", "ROUND_TRIP"] as TripType[]).map((type) => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => setTripType(type)}
                                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all cursor-pointer ${tripType === type
                                    ? "bg-white text-primary shadow-sm"
                                    : "text-muted hover:text-heading"
                                    }`}
                            >
                                {type === "ONE_WAY" ? "One Way" : "Round Trip"}
                            </button>
                        ))}
                    </div>

                    {/* Departure City */}
                    <div>
                        <label className={labelCls}>Departure City</label>
                        <SearchableCitySelect
                            value={departureCity}
                            onChange={(val) => setDepartureCity(val)}
                            placeholder="Select departure city/country"
                        />
                    </div>

                    {/* Arrival City */}
                    <div>
                        <label className={labelCls}>Arrival City</label>
                        <SearchableCitySelect
                            value={arrivalCity}
                            onChange={(val) => setArrivalCity(val)}
                            placeholder="Select arrival city/country"
                        />
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={labelCls}>Departure Date</label>
                            <input
                                type="date"
                                value={departureDate}
                                min={today}
                                onChange={(e) => setDepartureDate(e.target.value)}
                                className={inputCls}
                            />
                        </div>
                        {tripType === "ROUND_TRIP" && (
                            <div>
                                <label className={labelCls}>Return Date</label>
                                <input
                                    type="date"
                                    value={returnDate}
                                    min={departureDate || today}
                                    onChange={(e) => setReturnDate(e.target.value)}
                                    className={inputCls}
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ═══ STEP 3: Hotel Details (Bundle only) ═══ */}
            {currentLogical === 3 && isBundle && (
                <div className="space-y-5 animate-in slide-in-from-right duration-300">
                    <h2 className="text-lg font-bold text-heading font-heading">
                        Hotel Details
                    </h2>
                    <p className="text-sm text-muted">
                        Verified hotel reservation for your visa application.
                    </p>

                    <div>
                        <label className={labelCls}>Hotel City</label>
                        <SearchableCitySelect
                            value={hotelCity}
                            onChange={(val) => setHotelCity(val)}
                            placeholder="Select hotel city/country"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={labelCls}>Check-in</label>
                            <input
                                type="date"
                                value={hotelCheckIn}
                                min={today}
                                onChange={(e) => setHotelCheckIn(e.target.value)}
                                className={inputCls}
                            />
                        </div>
                        <div>
                            <label className={labelCls}>Check-out</label>
                            <input
                                type="date"
                                value={hotelCheckOut}
                                min={hotelCheckIn || today}
                                onChange={(e) => setHotelCheckOut(e.target.value)}
                                className={inputCls}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ STEP 4: Contact & Submit ═══ */}
            {currentLogical === 4 && (
                <div className="space-y-5 animate-in slide-in-from-right duration-300">
                    <h2 className="text-lg font-bold text-heading font-heading">
                        Contact Information
                    </h2>

                    {/* Order Summary */}
                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2">
                        <p className="text-xs font-bold text-primary uppercase">
                            Order Summary
                        </p>
                        <div className="text-sm text-heading space-y-1">
                            <p className="font-semibold">
                                {productType === "VERIFIED_BUNDLE"
                                    ? "📋🏨 Comprehensive Travel Plan"
                                    : "📋 Verified Itinerary Planning"}
                            </p>
                            <p>
                                {departureCity} → {arrivalCity}
                            </p>
                            <p className="text-xs text-muted">
                                {departureDate && new Date(departureDate).toLocaleDateString("en-US", { dateStyle: "long" })}
                                {returnDate && ` — ${new Date(returnDate).toLocaleDateString("en-US", { dateStyle: "long" })}`}
                                {" · "}{passengerCount} passenger{passengerCount > 1 ? "s" : ""}
                            </p>
                            {isBundle && hotelCity && (
                                <p className="text-xs text-muted">
                                    🏨 {hotelCity} · {hotelCheckIn && new Date(hotelCheckIn).toLocaleDateString("en-US")} → {hotelCheckOut && new Date(hotelCheckOut).toLocaleDateString("en-US")}
                                </p>
                            )}
                        </div>
                        <p className="text-lg font-extrabold text-primary pt-1">
                            ${price} USD
                        </p>
                    </div>

                    {/* Contact Fields */}
                    <div>
                        <label className={labelCls}>Full Name</label>
                        <input
                            type="text"
                            placeholder="Your name"
                            value={contact.contactName}
                            onChange={(e) => setContact({ ...contact, contactName: e.target.value })}
                            className={inputCls}
                        />
                    </div>

                    <div>
                        <label className={labelCls}>Email</label>
                        <input
                            type="email"
                            placeholder="email@example.com"
                            value={contact.contactEmail}
                            onChange={(e) => setContact({ ...contact, contactEmail: e.target.value })}
                            className={inputCls}
                        />
                    </div>

                    <div>
                        <label className={labelCls}>
                            WhatsApp <span className="text-muted font-normal">(optional)</span>
                        </label>
                        <input
                            type="tel"
                            placeholder="+62 812 3456 7890"
                            value={contact.contactWhatsApp}
                            onChange={(e) => setContact({ ...contact, contactWhatsApp: e.target.value })}
                            className={inputCls}
                        />
                    </div>

                    <div>
                        <label className={labelCls}>
                            Telegram <span className="text-muted font-normal">(optional)</span>
                        </label>
                        <input
                            type="text"
                            placeholder="@username"
                            value={contact.contactTelegram}
                            onChange={(e) => setContact({ ...contact, contactTelegram: e.target.value })}
                            className={inputCls}
                        />
                    </div>

                    {/* Notification Channel */}
                    <div>
                        <label className={`${labelCls} mb-2`}>
                            Send confirmation via
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {([
                                { value: "EMAIL" as const, icon: "📧", label: "Email" },
                                { value: "WHATSAPP" as const, icon: "💬", label: "WhatsApp" },
                                { value: "TELEGRAM" as const, icon: "✈️", label: "Telegram" },
                            ]).map((ch) => (
                                <button
                                    key={ch.value}
                                    type="button"
                                    onClick={() => setContact({ ...contact, preferredNotif: ch.value })}
                                    className={`py-3 rounded-xl text-center border-2 transition-all cursor-pointer ${contact.preferredNotif === ch.value
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
                </div>
            )}

            {/* ── Navigation Buttons ─────────────────────────── */}
            <div className="flex gap-3 mt-8">
                {step > 0 && (
                    <button
                        type="button"
                        onClick={goBack}
                        disabled={isSubmitting}
                        className="flex-1 py-4 bg-surface text-heading font-bold text-sm rounded-xl hover:bg-gold-border/30 transition-all cursor-pointer disabled:opacity-50"
                    >
                        ← Back
                    </button>
                )}
                <button
                    type="button"
                    onClick={isLastStep ? handleSubmit : goNext}
                    disabled={isSubmitting}
                    className={`${step > 0 ? "flex-[2]" : "w-full"} py-4 bg-primary hover:bg-primary-dark text-white font-bold text-base rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer`}
                >
                    {isSubmitting ? (
                        <span className="flex items-center justify-center gap-2">
                            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Processing...
                        </span>
                    ) : isLastStep ? (
                        `Order & Pay · $${price}`
                    ) : (
                        "Next →"
                    )}
                </button>
            </div>

            {/* Price note on last step */}
            {isLastStep && (
                <p className="text-xs text-subtle text-center mt-3">
                    Secure payment. Itinerary planning documents delivered within 1–2 working hours.
                </p>
            )}
        </div>
    );
}
