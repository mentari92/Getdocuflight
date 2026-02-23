"use client";

import { useState, useRef, useEffect } from "react";
import { COMBINED_LOCATIONS, POPULAR_AIRPORTS, type AirportData } from "@/lib/data/locations";
import { Check, ChevronDown, MapPin } from "lucide-react";

interface SearchableCitySelectProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export default function SearchableCitySelect({
    value,
    onChange,
    placeholder = "Select city/country"
}: SearchableCitySelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Initial value synchronization
    useEffect(() => {
        if (value && !searchTerm && !isOpen) {
            setSearchTerm(value);
        }
    }, [value, isOpen]);

    // Handle click outside to close dropdown
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                // If they typed something but didn't select, revert to the current actual value
                if (value !== searchTerm) {
                    setSearchTerm(value);
                }
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef, value, searchTerm]);

    const filteredAirports = searchTerm === ""
        ? POPULAR_AIRPORTS
        : COMBINED_LOCATIONS.filter((airport) => {
            const term = searchTerm.toLowerCase();
            return (
                airport.city.toLowerCase().includes(term) ||
                airport.country.toLowerCase().includes(term) ||
                airport.code.toLowerCase().includes(term) ||
                airport.label.toLowerCase().includes(term)
            );
        }).slice(0, 50); // Limit to top 50 results for performance

    const handleSelect = (airport: AirportData) => {
        setSearchTerm(airport.label);
        onChange(airport.label);
        setIsOpen(false);
    };

    return (
        <div ref={wrapperRef} className="relative w-full">
            <div
                className={`relative flex items-center w-full px-4 py-3 border rounded-xl text-sm bg-white transition-all ${isOpen ? "border-primary ring-2 ring-primary/30" : "border-gold-border hover:border-primary/50"
                    }`}
                onClick={() => {
                    setIsOpen(true);
                    inputRef.current?.focus();
                }}
            >
                <input
                    ref={inputRef}
                    type="text"
                    className="w-full bg-transparent outline-none text-heading placeholder:text-muted"
                    placeholder={placeholder}
                    value={isOpen ? (searchTerm === value ? "" : searchTerm) : searchTerm} // Clear input visually when opened if it matches value to allow easy re-typing
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => {
                        setIsOpen(true);
                        // Optional: Clear string on focus to easily see list, but UX is usually better to just highlight
                    }}
                />
                <ChevronDown className={`w-4 h-4 text-muted transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-gold-border rounded-xl shadow-xl max-h-64 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                    {filteredAirports.length === 0 ? (
                        <div className="p-4 text-sm text-muted text-center">
                            No cities found matching "{searchTerm}"
                        </div>
                    ) : (
                        <ul className="py-2">
                            {searchTerm === "" && (
                                <li className="px-4 py-2 text-xs font-bold text-muted uppercase bg-surface/50">
                                    Popular Cities
                                </li>
                            )}
                            {filteredAirports.map((airport) => {
                                const isSelected = value === airport.label;
                                return (
                                    <li
                                        key={airport.id}
                                        onClick={() => handleSelect(airport)}
                                        className={`flex items-center justify-between px-4 py-2.5 text-sm cursor-pointer transition-colors ${isSelected ? "bg-primary/10 text-primary font-semibold" : "text-heading hover:bg-surface"
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <MapPin className="w-4 h-4 text-muted shrink-0" />
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span>{airport.city}</span>
                                                    {airport.code && (
                                                        <span className="text-xs font-mono px-1.5 py-0.5 bg-surface text-muted rounded-md tracking-widest border border-gold-border/50">
                                                            {airport.code}
                                                        </span>
                                                    )}
                                                </div>
                                                {airport.country !== "Country" && (
                                                    <span className="text-xs text-muted block mt-0.5">{airport.country}</span>
                                                )}
                                            </div>
                                        </div>
                                        {isSelected && <Check className="w-4 h-4 text-primary" />}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}
