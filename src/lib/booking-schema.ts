/**
 * Booking schemas — Zod validation for the 5-step order form.
 *
 * Step 0: Product selection (Flight $10 / Bundle $20)
 * Step 1: Passenger details (name, nationality, passport, DOB)
 * Step 2: Flight info (departure, arrival, dates)
 * Step 3: Hotel details (conditional — only for DUMMY_BUNDLE)
 * Step 4: Contact & payment (name, email, WhatsApp, Telegram)
 */

import { z } from "zod";
import { COUNTRIES } from "./countries";

export { COUNTRIES };

// ── Pricing Constants ──────────────────────────────────

export const PRICING = {
    DUMMY_FLIGHT: 10.0, // USD
    DUMMY_BUNDLE: 20.0, // USD (flight + hotel)
} as const;

export type ProductTypeKey = keyof typeof PRICING;

/**
 * Get price for a product type.
 */
export function getProductPrice(productType: ProductTypeKey): number {
    return PRICING[productType];
}

// ── Popular airports / cities ──────────────────────────

export const POPULAR_CITIES = [
    "Jakarta (CGK)",
    "Surabaya (SUB)",
    "Bali / Denpasar (DPS)",
    "Medan (KNO)",
    "Makassar (UPG)",
    "Yogyakarta (YIA)",
    "Semarang (SRG)",
    "Bandung (BDO)",
    "Balikpapan (BPN)",
    "Palembang (PLM)",
    "Singapore (SIN)",
    "Kuala Lumpur (KUL)",
    "Bangkok (BKK)",
    "Tokyo (NRT)",
    "Seoul (ICN)",
    "Hong Kong (HKG)",
    "Dubai (DXB)",
    "Sydney (SYD)",
    "London (LHR)",
    "Amsterdam (AMS)",
    "Paris (CDG)",
    "Frankfurt (FRA)",
    "Istanbul (IST)",
    "Doha (DOH)",
    "New York (JFK)",
    "Los Angeles (LAX)",
    "Melbourne (MEL)",
    "Osaka (KIX)",
    "Taipei (TPE)",
    "Manila (MNL)",
    "Ho Chi Minh (SGN)",
    "Jeddah (JED)",
] as const;

// ── Step 0: Product Selection ──────────────────────────

export const productSchema = z.object({
    productType: z.enum(["DUMMY_FLIGHT", "DUMMY_BUNDLE"]),
});

// ── Step 1: Passenger Details ──────────────────────────

export const passengerSchema = z.object({
    fullName: z
        .string()
        .min(2, "Enter at least 2 characters")
        .max(100, "Name is too long (max 100)"),
    nationality: z
        .string()
        .min(2, "Please pick a nationality")
        .max(60, "Nationality is too long (max 60)"),
    passportNo: z
        .string()
        .max(20, "Passport number is too long (max 20)")
        .optional()
        .or(z.literal("")),
    salutation: z
        .enum(["Mr", "Ms", "Mrs"])
        .optional(),
    dateOfBirth: z
        .string()
        .optional()
        .or(z.literal("")),
});

export const passengerStepSchema = z.object({
    passengerCount: z
        .number()
        .int()
        .min(1, "At least 1 passenger required")
        .max(9, "Maximum 9 passengers"),
    passengers: z
        .array(passengerSchema)
        .min(1, "At least 1 passenger required"),
});

// ── Step 2: Flight Info ────────────────────────────────

export const flightSchema = z
    .object({
        departureCity: z
            .string()
            .min(2, "Please select departure city"),
        arrivalCity: z
            .string()
            .min(2, "Please select arrival city"),
        departureDate: z
            .string()
            .min(1, "Please select departure date"),
        returnDate: z
            .string()
            .optional()
            .or(z.literal("")),
        tripType: z.enum(["ONE_WAY", "ROUND_TRIP"]),
    })
    .refine(
        (data) => {
            if (data.tripType === "ROUND_TRIP" && !data.returnDate) {
                return false;
            }
            return true;
        },
        {
            message: "Return date is needed for round trips",
            path: ["returnDate"],
        }
    )
    .refine(
        (data) => data.departureCity !== data.arrivalCity,
        {
            message: "Pick a different arrival city",
            path: ["arrivalCity"],
        }
    );

// ── Step 3: Hotel Details (conditional) ────────────────

export const hotelSchema = z
    .object({
        hotelCity: z
            .string()
            .min(2, "Please select hotel city"),
        hotelCheckIn: z
            .string()
            .min(1, "Please select check-in date"),
        hotelCheckOut: z
            .string()
            .min(1, "Please select check-out date"),
    })
    .refine(
        (data) => {
            if (data.hotelCheckIn && data.hotelCheckOut) {
                return new Date(data.hotelCheckOut) > new Date(data.hotelCheckIn);
            }
            return true;
        },
        {
            message: "Check-out must be after check-in",
            path: ["hotelCheckOut"],
        }
    );

// ── Step 4: Contact & Payment ──────────────────────────

export const contactSchema = z.object({
    contactName: z
        .string()
        .min(2, "Enter at least 2 characters")
        .max(100, "Name is too long (max 100)"),
    contactEmail: z
        .string()
        .email("Invalid email address"),
    contactWhatsApp: z
        .string()
        .max(20, "Number is too long (max 20)")
        .optional()
        .or(z.literal("")),
    contactTelegram: z
        .string()
        .max(50, "Username is too long (max 50)")
        .optional()
        .or(z.literal("")),
    preferredNotif: z.enum(["EMAIL", "WHATSAPP", "TELEGRAM"]),
});

// ── Combined (for API validation) ─────────────────────

export const bookingSchema = productSchema
    .merge(passengerStepSchema)
    .merge(
        z.object({
            departureCity: z.string().min(2),
            arrivalCity: z.string().min(2),
            departureDate: z.string().min(1),
            returnDate: z.string().optional().or(z.literal("")),
            tripType: z.enum(["ONE_WAY", "ROUND_TRIP"]),
        })
    )
    .merge(
        z.object({
            hotelCity: z.string().optional().or(z.literal("")),
            hotelCheckIn: z.string().optional().or(z.literal("")),
            hotelCheckOut: z.string().optional().or(z.literal("")),
        })
    )
    .merge(contactSchema);

// ── Types ──────────────────────────────────────────────

export type PassengerData = z.infer<typeof passengerSchema>;
export type ProductData = z.infer<typeof productSchema>;
export type FlightData = z.infer<typeof flightSchema>;
export type HotelData = z.infer<typeof hotelSchema>;
export type ContactData = z.infer<typeof contactSchema>;
export type BookingData = z.infer<typeof bookingSchema>;

// ── Defaults ───────────────────────────────────────────

export const defaultPassenger: PassengerData = {
    fullName: "",
    nationality: "Indonesia",
    passportNo: "",
    salutation: undefined,
    dateOfBirth: "",
};

export const defaultProduct: ProductData = {
    productType: "DUMMY_FLIGHT",
};

export const defaultFlight = {
    departureCity: "",
    arrivalCity: "",
    departureDate: "",
    returnDate: "",
    tripType: "ONE_WAY" as const,
};

export const defaultPassengerStep = {
    passengerCount: 1,
    passengers: [{ ...defaultPassenger }],
};

export const defaultHotel: HotelData = {
    hotelCity: "",
    hotelCheckIn: "",
    hotelCheckOut: "",
};

export const defaultContact: ContactData = {
    contactName: "",
    contactEmail: "",
    contactWhatsApp: "",
    contactTelegram: "",
    preferredNotif: "EMAIL",
};

// Legacy exports for backwards compatibility
export const step1Schema = flightSchema;
export const step2Schema = contactSchema;
export const defaultStep1 = {
    ...defaultFlight,
    ...defaultPassengerStep,
};
export const defaultStep2 = defaultContact;
