"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    step1Schema,
    step2Schema,
    step3Schema,
    defaultFormData,
    POPULAR_COUNTRIES,
    DESTINATION_COUNTRIES,
    PASSPORT_TYPES,
    TRAVEL_PURPOSES,
    EMPLOYMENT_STATUSES,
    TRAVEL_HISTORY_OPTIONS,
    type PredictorFormData,
} from "@/lib/predictor-schema";

// ── Types ──────────────────────────────────────────────────

type FormErrors = Partial<Record<keyof PredictorFormData, string>>;

const STEP_TITLES = [
    "Travel Details",
    "Profile & Finance",
    "Visa History",
];

const TRUST_SIGNALS = [
    { icon: "🔒", text: "Your data is end-to-end encrypted" },
    { icon: "🇪🇺", text: "Processed on European servers (GDPR)" },
    { icon: "🤝", text: "Never shared with third parties" },
];

// ── Main Component ─────────────────────────────────────────

export default function PredictorForm() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState<PredictorFormData>(defaultFormData);
    const [errors, setErrors] = useState<FormErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [slideDirection, setSlideDirection] = useState<"left" | "right">("left");
    const [isAnimating, setIsAnimating] = useState(false);

    // ── Field update helpers ───────────────────────────────

    const updateField = useCallback(
        <K extends keyof PredictorFormData>(
            field: K,
            value: PredictorFormData[K]
        ) => {
            setFormData((prev) => ({ ...prev, [field]: value }));
            // Clear error on change
            if (errors[field]) {
                setErrors((prev) => {
                    const next = { ...prev };
                    delete next[field];
                    return next;
                });
            }
        },
        [errors]
    );

    const toggleTravelHistory = useCallback(
        (value: string) => {
            setFormData((prev) => {
                const current = prev.travelHistory;
                // "none" is exclusive
                if (value === "none") {
                    return { ...prev, travelHistory: ["none"] };
                }
                const withoutNone = current.filter((v) => v !== "none");
                const next = withoutNone.includes(value)
                    ? withoutNone.filter((v) => v !== value)
                    : [...withoutNone, value];
                return { ...prev, travelHistory: next };
            });
            if (errors.travelHistory) {
                setErrors((prev) => {
                    const next = { ...prev };
                    delete next.travelHistory;
                    return next;
                });
            }
        },
        [errors]
    );

    // ── Validation ─────────────────────────────────────────

    const validateStep = (step: number): boolean => {
        const schemas = [step1Schema, step2Schema, step3Schema];
        const schema = schemas[step - 1];

        const result = schema.safeParse(formData);
        if (result.success) return true;

        const fieldErrors: FormErrors = {};
        result.error.issues.forEach((issue) => {
            const field = issue.path[0] as keyof PredictorFormData;
            if (!fieldErrors[field]) {
                fieldErrors[field] = issue.message;
            }
        });
        setErrors((prev) => ({ ...prev, ...fieldErrors }));
        return false;
    };

    // ── Navigation ─────────────────────────────────────────

    const animateTransition = (direction: "left" | "right", callback: () => void) => {
        setSlideDirection(direction);
        setIsAnimating(true);
        setTimeout(() => {
            callback();
            setIsAnimating(false);
        }, 300);
    };

    const goNext = () => {
        if (!validateStep(currentStep)) return;
        if (currentStep < 3) {
            animateTransition("left", () => setCurrentStep((s) => s + 1));
        }
    };

    const goBack = () => {
        if (currentStep > 1) {
            animateTransition("right", () => setCurrentStep((s) => s - 1));
        }
    };

    const handleSubmit = async () => {
        if (!validateStep(currentStep)) return;
        setIsSubmitting(true);
        setSubmitError(null);

        try {
            const response = await fetch("/api/predict", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error || "Something went wrong. Please try again."
                );
            }

            // Redirect to prediction result page
            router.push(`/dashboard/predictions/${data.predictionId}`);
        } catch (err) {
            setSubmitError(
                err instanceof Error
                    ? err.message
                    : "Something went wrong. Please try again."
            );
            setIsSubmitting(false);
        }
    };

    // ── Render helpers ─────────────────────────────────────

    const progressPercent = (currentStep / 3) * 100;

    return (
        <div className="space-y-6">
            {/* Progress Bar */}
            <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-medium text-muted">
                    <span>Step {currentStep} of 3</span>
                    <span>{STEP_TITLES[currentStep - 1]}</span>
                </div>
                <div className="h-2 bg-gold-light/40 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-primary to-primary-light rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </div>

            {/* Form Card */}
            <div className="bg-white rounded-2xl border border-gold-border p-6 sm:p-8 shadow-lg overflow-hidden">
                {/* Step Title */}
                <h2 className="text-xl sm:text-2xl font-bold text-heading font-heading mb-1">
                    {STEP_TITLES[currentStep - 1]}
                </h2>
                <p className="text-sm text-muted mb-6">
                    {currentStep === 1 && "Tell us about your trip"}
                    {currentStep === 2 && "Your employment and financial details"}
                    {currentStep === 3 && "Almost done! Your travel background"}
                </p>

                {/* Step Content with slide animation */}
                <div
                    className={`transition-all duration-300 ease-out ${isAnimating
                        ? slideDirection === "left"
                            ? "-translate-x-4 opacity-0"
                            : "translate-x-4 opacity-0"
                        : "translate-x-0 opacity-100"
                        }`}
                >
                    {currentStep === 1 && (
                        <Step1
                            formData={formData}
                            errors={errors}
                            updateField={updateField}
                        />
                    )}
                    {currentStep === 2 && (
                        <Step2
                            formData={formData}
                            errors={errors}
                            updateField={updateField}
                        />
                    )}
                    {currentStep === 3 && (
                        <Step3
                            formData={formData}
                            errors={errors}
                            updateField={updateField}
                            toggleTravelHistory={toggleTravelHistory}
                        />
                    )}
                </div>

                {/* Submit Error */}
                {submitError && (
                    <div className="mt-4 p-3 bg-error-light/30 border border-error/30 rounded-xl text-sm text-error">
                        {submitError}
                    </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-gold-border/50">
                    {currentStep > 1 ? (
                        <button
                            type="button"
                            onClick={goBack}
                            className="text-sm font-medium text-muted hover:text-heading transition-colors flex items-center gap-1"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                            Back
                        </button>
                    ) : (
                        <div />
                    )}

                    {currentStep < 3 ? (
                        <button
                            type="button"
                            onClick={goNext}
                            className="px-6 py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
                        >
                            Next
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="px-6 py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Processing...
                                </>
                            ) : (
                                <>Get My Prediction ✨</>
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* Trust Signal */}
            <div className="text-center">
                <p className="text-xs text-muted flex items-center justify-center gap-1.5">
                    <span>{TRUST_SIGNALS[currentStep - 1].icon}</span>
                    {TRUST_SIGNALS[currentStep - 1].text}
                </p>
            </div>
        </div>
    );
}

// ── Step 1: Travel Details ─────────────────────────────────

interface StepProps {
    formData: PredictorFormData;
    errors: FormErrors;
    updateField: <K extends keyof PredictorFormData>(
        field: K,
        value: PredictorFormData[K]
    ) => void;
}

function Step1({ formData, errors, updateField }: StepProps) {
    return (
        <div className="space-y-5">
            {/* Nationality */}
            <FormSelect
                label="Nationality"
                value={formData.nationality}
                onChange={(v) => updateField("nationality", v)}
                error={errors.nationality}
                options={POPULAR_COUNTRIES.map((c) => ({
                    value: c.value,
                    label: c.label,
                }))}
                placeholder="Select your nationality"
            />

            {/* Destination */}
            <FormSelect
                label="Destination Country"
                value={formData.destination}
                onChange={(v) => updateField("destination", v)}
                error={errors.destination}
                options={DESTINATION_COUNTRIES.map((c) => ({
                    value: c.value,
                    label: c.label,
                }))}
                placeholder="Select a destination"
            />

            {/* Passport Type */}
            <FormRadioGroup
                label="Passport Type"
                value={formData.passportType}
                onChange={(v) => updateField("passportType", v)}
                error={errors.passportType}
                options={PASSPORT_TYPES.map((p) => ({
                    value: p.value,
                    label: p.label,
                }))}
            />

            {/* Departure Date */}
            <FormInput
                label="Departure Date"
                type="date"
                value={formData.departureDate}
                onChange={(v) => updateField("departureDate", v)}
                error={errors.departureDate}
                min={new Date().toISOString().split("T")[0]}
            />
        </div>
    );
}

// ── Step 2: Profile & Finance ──────────────────────────────

function Step2({ formData, errors, updateField }: StepProps) {
    return (
        <div className="space-y-5">
            {/* Employment Status */}
            <FormRadioGroup
                label="Employment Status"
                value={formData.employmentStatus}
                onChange={(v) => updateField("employmentStatus", v)}
                error={errors.employmentStatus}
                options={EMPLOYMENT_STATUSES.map((e) => ({
                    value: e.value,
                    label: e.label,
                }))}
            />

            {/* Monthly Income */}
            <FormInput
                label="Monthly Income (USD)"
                type="number"
                value={formData.monthlyIncome === 0 ? "" : String(formData.monthlyIncome)}
                onChange={(v) => updateField("monthlyIncome", v ? Number(v) : 0)}
                error={errors.monthlyIncome}
                placeholder="e.g. 1500"
                prefix="$"
            />

            {/* Bank Balance */}
            <FormInput
                label="Bank Balance (USD)"
                type="number"
                value={formData.bankBalance === 0 ? "" : String(formData.bankBalance)}
                onChange={(v) => updateField("bankBalance", v ? Number(v) : 0)}
                error={errors.bankBalance}
                placeholder="e.g. 5000"
                prefix="$"
            />

            {/* Prior Visa Refusal */}
            <FormRadioGroup
                label="Have you been refused a visa before?"
                value={formData.priorVisaRefusal}
                onChange={(v) => updateField("priorVisaRefusal", v as "yes" | "no")}
                error={errors.priorVisaRefusal}
                options={[
                    { value: "no", label: "No, never" },
                    { value: "yes", label: "Yes" },
                ]}
            />
        </div>
    );
}

// ── Step 3: Visa History ───────────────────────────────────

interface Step3Props extends StepProps {
    toggleTravelHistory: (value: string) => void;
}

function Step3({ formData, errors, updateField, toggleTravelHistory }: Step3Props) {
    return (
        <div className="space-y-5">
            {/* Travel Purpose */}
            <FormRadioGroup
                label="Travel Purpose"
                value={formData.travelPurpose}
                onChange={(v) => updateField("travelPurpose", v)}
                error={errors.travelPurpose}
                options={TRAVEL_PURPOSES.map((p) => ({
                    value: p.value,
                    label: p.label,
                }))}
            />

            {/* Travel History (Multi-Select) */}
            <div>
                <label className="block text-sm font-semibold text-heading mb-2">
                    International Travel History
                </label>
                <p className="text-xs text-muted mb-3">
                    Select countries/regions you have visited
                </p>
                <div className="grid grid-cols-2 gap-2">
                    {TRAVEL_HISTORY_OPTIONS.map((option) => {
                        const isSelected = formData.travelHistory.includes(option.value);
                        return (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => toggleTravelHistory(option.value)}
                                className={`px-3 py-2.5 text-sm rounded-xl border-2 transition-all duration-200 text-left ${isSelected
                                    ? "border-primary bg-primary/5 text-primary font-semibold"
                                    : "border-gold-border bg-gold-light/20 text-body hover:border-primary/40"
                                    }`}
                            >
                                {option.label}
                            </button>
                        );
                    })}
                </div>
                {errors.travelHistory && (
                    <p className="mt-1.5 text-xs text-error">{errors.travelHistory}</p>
                )}
            </div>
        </div>
    );
}

// ── Reusable Form Components ───────────────────────────────

function FormInput({
    label,
    type = "text",
    value,
    onChange,
    error,
    placeholder,
    prefix,
    min,
}: {
    label: string;
    type?: string;
    value: string;
    onChange: (value: string) => void;
    error?: string;
    placeholder?: string;
    prefix?: string;
    min?: string;
}) {
    return (
        <div>
            <label className="block text-sm font-semibold text-heading mb-1.5">
                {label}
            </label>
            <div className="relative">
                {prefix && (
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted font-medium">
                        {prefix}
                    </span>
                )}
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    min={min}
                    className={`w-full ${prefix ? "pl-8" : "px-4"} pr-4 py-3 bg-gold-light/30 border rounded-xl text-heading placeholder-subtle focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 ${error
                        ? "border-error bg-error-light/30"
                        : "border-gold-border"
                        }`}
                />
            </div>
            {error && <p className="mt-1.5 text-xs text-error">{error}</p>}
        </div>
    );
}

function FormSelect({
    label,
    value,
    onChange,
    error,
    options,
    placeholder,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    error?: string;
    options: { value: string; label: string }[];
    placeholder?: string;
}) {
    return (
        <div>
            <label className="block text-sm font-semibold text-heading mb-1.5">
                {label}
            </label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={`w-full px-4 py-3 bg-gold-light/30 border rounded-xl text-heading focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 appearance-none cursor-pointer ${error
                    ? "border-error bg-error-light/30"
                    : "border-gold-border"
                    } ${!value ? "text-subtle" : ""}`}
            >
                <option value="" disabled>
                    {placeholder || "Select..."}
                </option>
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
            {error && <p className="mt-1.5 text-xs text-error">{error}</p>}
        </div>
    );
}

function FormRadioGroup({
    label,
    value,
    onChange,
    error,
    options,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    error?: string;
    options: { value: string; label: string }[];
}) {
    return (
        <div>
            <label className="block text-sm font-semibold text-heading mb-2">
                {label}
            </label>
            <div className="flex flex-wrap gap-2">
                {options.map((opt) => (
                    <button
                        key={opt.value}
                        type="button"
                        onClick={() => onChange(opt.value)}
                        className={`px-4 py-2.5 text-sm rounded-xl border-2 transition-all duration-200 ${value === opt.value
                            ? "border-primary bg-primary/5 text-primary font-semibold"
                            : "border-gold-border bg-gold-light/20 text-body hover:border-primary/40"
                            }`}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>
            {error && <p className="mt-1.5 text-xs text-error">{error}</p>}
        </div>
    );
}
