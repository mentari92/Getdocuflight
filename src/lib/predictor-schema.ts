import { z } from "zod";

// ── Country lists ──────────────────────────────────────────

import { COUNTRIES } from "./countries";

export const POPULAR_COUNTRIES = COUNTRIES;
export const DESTINATION_COUNTRIES = COUNTRIES;

export const SCHENGEN_COUNTRIES = [
    { value: "france", label: "🇫🇷 France" },
    { value: "germany", label: "🇩🇪 Germany" },
    { value: "italy", label: "🇮🇹 Italy" },
    { value: "spain", label: "🇪🇸 Spain" },
    { value: "netherlands", label: "🇳🇱 Netherlands" },
    { value: "switzerland", label: "🇨🇭 Switzerland" },
    { value: "austria", label: "🇦🇹 Austria" },
    { value: "belgium", label: "🇧🇪 Belgium" },
    { value: "portugal", label: "🇵🇹 Portugal" },
    { value: "greece", label: "🇬🇷 Greece" },
    { value: "czech_republic", label: "🇨🇿 Czech Republic" },
    { value: "sweden", label: "🇸🇪 Sweden" },
    { value: "norway", label: "🇳🇴 Norway" },
    { value: "denmark", label: "🇩🇰 Denmark" },
    { value: "finland", label: "🇫🇮 Finland" },
    { value: "poland", label: "🇵🇱 Poland" },
] as const;

export const TRAVEL_HISTORY_OPTIONS = [
    { value: "schengen", label: "🇪🇺 Schengen" },
    { value: "united_states", label: "🇺🇸 United States" },
    { value: "united_kingdom", label: "🇬🇧 United Kingdom" },
    { value: "japan", label: "🇯🇵 Japan" },
    { value: "south_korea", label: "🇰🇷 South Korea" },
    { value: "australia", label: "🇦🇺 Australia" },
    { value: "canada", label: "🇨🇦 Canada" },
    { value: "singapore", label: "🇸🇬 Singapore" },
    { value: "other_asia", label: "🌏 Other Asia" },
    { value: "none", label: "Never traveled abroad" },
] as const;

// ── Option constants ───────────────────────────────────────

export const PASSPORT_TYPES = [
    { value: "regular", label: "Regular" },
    { value: "e_passport", label: "E-Passport" },
    { value: "official", label: "Official" },
    { value: "diplomatic", label: "Diplomatic" },
] as const;

export const TRAVEL_PURPOSES = [
    { value: "tourism", label: "Tourism" },
    { value: "business", label: "Business" },
    { value: "education", label: "Education" },
] as const;

export const EMPLOYMENT_STATUSES = [
    { value: "employed", label: "Employed" },
    { value: "self_employed", label: "Self-Employed" },
    { value: "student", label: "Student" },
    { value: "unemployed", label: "Unemployed" },
] as const;

// ── Zod Schemas (English error messages) ───────────────────

export const step1Schema = z.object({
    nationality: z
        .string()
        .min(1, "Please select your nationality"),
    destination: z
        .string()
        .min(1, "Please select a destination country"),
    passportType: z
        .string()
        .min(1, "Please select your passport type"),
    departureDate: z
        .string()
        .min(1, "Please enter your departure date")
        .refine((val) => {
            const date = new Date(val);
            return date > new Date();
        }, "Departure date must be in the future"),
});

export const step2Schema = z.object({
    employmentStatus: z
        .string()
        .min(1, "Please select your employment status"),
    monthlyIncome: z
        .number({ error: "Please enter a valid number" })
        .min(0, "Income cannot be negative")
        .max(1000000, "Maximum income is $1,000,000"),
    bankBalance: z
        .number({ error: "Please enter a valid number" })
        .min(0, "Balance cannot be negative")
        .max(100000000, "Maximum balance is $100,000,000"),
    priorVisaRefusal: z
        .enum(["yes", "no"], {
            error: "Please select yes or no",
        }),
});

export const step3Schema = z.object({
    travelPurpose: z
        .string()
        .min(1, "Please select a travel purpose"),
    travelHistory: z
        .array(z.string())
        .min(1, "Please select at least one travel history option"),
});

export const predictorFormSchema = step1Schema
    .merge(step2Schema)
    .merge(step3Schema);

export type PredictorFormData = z.infer<typeof predictorFormSchema>;

// ── Default form state ─────────────────────────────────────

export const defaultFormData: PredictorFormData = {
    nationality: "indonesia",
    destination: "",
    passportType: "",
    departureDate: "",
    employmentStatus: "",
    monthlyIncome: 0,
    bankBalance: 0,
    priorVisaRefusal: "no",
    travelPurpose: "",
    travelHistory: [],
};
