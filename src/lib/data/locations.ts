export interface AirportData {
    id: string; // usually the IATA code or a unique city string
    city: string;
    country: string;
    code: string;
    label: string; // What the user sees in the input and dropdown!
}

export const AIRPORTS: AirportData[] = [
    // Asia
    { id: "CGK", city: "Jakarta", country: "Indonesia", code: "CGK", label: "Jakarta (CGK)" },
    { id: "DPS", city: "Bali / Denpasar", country: "Indonesia", code: "DPS", label: "Bali / Denpasar (DPS)" },
    { id: "SIN", city: "Singapore", country: "Singapore", code: "SIN", label: "Singapore (SIN)" },
    { id: "KUL", city: "Kuala Lumpur", country: "Malaysia", code: "KUL", label: "Kuala Lumpur (KUL)" },
    { id: "PEN", city: "Penang", country: "Malaysia", code: "PEN", label: "Penang (PEN)" },
    { id: "BKK", city: "Bangkok (Suvarnabhumi)", country: "Thailand", code: "BKK", label: "Bangkok (BKK)" },
    { id: "DMK", city: "Bangkok (Don Mueang)", country: "Thailand", code: "DMK", label: "Bangkok (DMK)" },
    { id: "HKT", city: "Phuket", country: "Thailand", code: "HKT", label: "Phuket (HKT)" },
    { id: "NRT", city: "Tokyo (Narita)", country: "Japan", code: "NRT", label: "Tokyo (NRT)" },
    { id: "HND", city: "Tokyo (Haneda)", country: "Japan", code: "HND", label: "Tokyo (HND)" },
    { id: "KIX", city: "Osaka", country: "Japan", code: "KIX", label: "Osaka (KIX)" },
    { id: "ICN", city: "Seoul (Incheon)", country: "South Korea", code: "ICN", label: "Seoul (ICN)" },
    { id: "GMP", city: "Seoul (Gimpo)", country: "South Korea", code: "GMP", label: "Seoul (GMP)" },
    { id: "HKG", city: "Hong Kong", country: "Hong Kong", code: "HKG", label: "Hong Kong (HKG)" },
    { id: "TPE", city: "Taipei", country: "Taiwan", code: "TPE", label: "Taipei (TPE)" },
    { id: "MNL", city: "Manila", country: "Philippines", code: "MNL", label: "Manila (MNL)" },
    { id: "SGN", city: "Ho Chi Minh City", country: "Vietnam", code: "SGN", label: "Ho Chi Minh (SGN)" },
    { id: "HAN", city: "Hanoi", country: "Vietnam", code: "HAN", label: "Hanoi (HAN)" },
    { id: "CAN", city: "Guangzhou", country: "China", code: "CAN", label: "Guangzhou (CAN)" },
    { id: "PVG", city: "Shanghai (Pudong)", country: "China", code: "PVG", label: "Shanghai (PVG)" },
    { id: "PEK", city: "Beijing (Capital)", country: "China", code: "PEK", label: "Beijing (PEK)" },
    { id: "DEL", city: "New Delhi", country: "India", code: "DEL", label: "New Delhi (DEL)" },
    { id: "BOM", city: "Mumbai", country: "India", code: "BOM", label: "Mumbai (BOM)" },
    { id: "MLE", city: "Male", country: "Maldives", code: "MLE", label: "Male (MLE)" },

    // Middle East
    { id: "DXB", city: "Dubai", country: "UAE", code: "DXB", label: "Dubai (DXB)" },
    { id: "AUH", city: "Abu Dhabi", country: "UAE", code: "AUH", label: "Abu Dhabi (AUH)" },
    { id: "DOH", city: "Doha", country: "Qatar", code: "DOH", label: "Doha (DOH)" },
    { id: "JED", city: "Jeddah", country: "Saudi Arabia", code: "JED", label: "Jeddah (JED)" },
    { id: "RUH", city: "Riyadh", country: "Saudi Arabia", code: "RUH", label: "Riyadh (RUH)" },
    { id: "IST", city: "Istanbul", country: "Turkey", code: "IST", label: "Istanbul (IST)" },
    { id: "SAW", city: "Istanbul (Sabiha)", country: "Turkey", code: "SAW", label: "Istanbul (SAW)" },

    // Europe
    { id: "LHR", city: "London (Heathrow)", country: "UK", code: "LHR", label: "London (LHR)" },
    { id: "LGW", city: "London (Gatwick)", country: "UK", code: "LGW", label: "London (LGW)" },
    { id: "CDG", city: "Paris (Charles de Gaulle)", country: "France", code: "CDG", label: "Paris (CDG)" },
    { id: "ORY", city: "Paris (Orly)", country: "France", code: "ORY", label: "Paris (ORY)" },
    { id: "AMS", city: "Amsterdam", country: "Netherlands", code: "AMS", label: "Amsterdam (AMS)" },
    { id: "FRA", city: "Frankfurt", country: "Germany", code: "FRA", label: "Frankfurt (FRA)" },
    { id: "MUC", city: "Munich", country: "Germany", code: "MUC", label: "Munich (MUC)" },
    { id: "FCO", city: "Rome (Fiumicino)", country: "Italy", code: "FCO", label: "Rome (FCO)" },
    { id: "MXP", city: "Milan (Malpensa)", country: "Italy", code: "MXP", label: "Milan (MXP)" },
    { id: "MAD", city: "Madrid", country: "Spain", code: "MAD", label: "Madrid (MAD)" },
    { id: "BCN", city: "Barcelona", country: "Spain", code: "BCN", label: "Barcelona (BCN)" },
    { id: "ZRH", city: "Zurich", country: "Switzerland", code: "ZRH", label: "Zurich (ZRH)" },
    { id: "VIE", city: "Vienna", country: "Austria", code: "VIE", label: "Vienna (VIE)" },
    { id: "CPH", city: "Copenhagen", country: "Denmark", code: "CPH", label: "Copenhagen (CPH)" },
    { id: "ARN", city: "Stockholm", country: "Sweden", code: "ARN", label: "Stockholm (ARN)" },
    { id: "OSL", city: "Oslo", country: "Norway", code: "OSL", label: "Oslo (OSL)" },
    { id: "HEL", city: "Helsinki", country: "Finland", code: "HEL", label: "Helsinki (HEL)" },

    // North America
    { id: "JFK", city: "New York (JFK)", country: "USA", code: "JFK", label: "New York (JFK)" },
    { id: "EWR", city: "New York (Newark)", country: "USA", code: "EWR", label: "New York (EWR)" },
    { id: "LAX", city: "Los Angeles", country: "USA", code: "LAX", label: "Los Angeles (LAX)" },
    { id: "SFO", city: "San Francisco", country: "USA", code: "SFO", label: "San Francisco (SFO)" },
    { id: "ORD", city: "Chicago", country: "USA", code: "ORD", label: "Chicago (ORD)" },
    { id: "MIA", city: "Miami", country: "USA", code: "MIA", label: "Miami (MIA)" },
    { id: "SEA", city: "Seattle", country: "USA", code: "SEA", label: "Seattle (SEA)" },
    { id: "YVR", city: "Vancouver", country: "Canada", code: "YVR", label: "Vancouver (YVR)" },
    { id: "YYZ", city: "Toronto", country: "Canada", code: "YYZ", label: "Toronto (YYZ)" },

    // Oceania
    { id: "SYD", city: "Sydney", country: "Australia", code: "SYD", label: "Sydney (SYD)" },
    { id: "MEL", city: "Melbourne", country: "Australia", code: "MEL", label: "Melbourne (MEL)" },
    { id: "BNE", city: "Brisbane", country: "Australia", code: "BNE", label: "Brisbane (BNE)" },
    { id: "PER", city: "Perth", country: "Australia", code: "PER", label: "Perth (PER)" },
    { id: "AKL", city: "Auckland", country: "New Zealand", code: "AKL", label: "Auckland (AKL)" },
];

import { COUNTRIES } from "../countries";

// Map the 190+ countries into the AirportData format so they can be searched alongside cities
const COUNTRY_LOCATIONS: AirportData[] = COUNTRIES.map((c) => ({
    id: `country_${c.value}`,
    city: c.label, // Using the label (with flag) as the primary display text
    country: "Country", // Meta descriptor
    code: "", // Empty code indicates it's a generic country selection, not a specific airport
    label: c.label,
}));

// The unified dataset combining specific cities/airports and generic global countries
export const COMBINED_LOCATIONS: AirportData[] = [...AIRPORTS, ...COUNTRY_LOCATIONS];

// Helper to get top cities for the default dropdown view when input is empty
export const POPULAR_AIRPORTS = [
    "CGK", "DPS",
    "SIN", "KUL", "BKK", "NRT",
    "ICN", "HKG", "DXB", "SYD",
    "LHR", "AMS", "CDG"
].map(code => AIRPORTS.find(a => a.code === code)!).filter(Boolean);
