"use client";

import { useState } from "react";
import SearchableCitySelect from "@/components/booking/SearchableCitySelect";
import posthog from "posthog-js";
import { ANALYTICS_EVENTS } from "@/lib/analytics";

interface VisaCheckerFormProps {
    onResult: (result: any, params: { nationality: string, destination: string }) => void;
    onLoading: (loading: boolean) => void;
}

export default function VisaCheckerForm({ onResult, onLoading }: VisaCheckerFormProps) {
    const [nationality, setNationality] = useState("🇮🇩 Indonesia");
    const [destination, setDestination] = useState("");
    const [duration, setDuration] = useState("");
    const [email, setEmail] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nationality || !destination) return;

        onLoading(true);
        try {
            const res = await fetch("/api/tools/visa-checker", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nationality, destination, duration, email }),
            });

            if (!res.ok) {
                throw new Error("Failed to fetch visa requirements");
            }

            const data = await res.json();
            console.log("Visa Checker API Response:", data);

            // Track successful search in PostHog safely
            try {
                posthog.capture(ANALYTICS_EVENTS.SMART_NAVIGATOR_SEARCH, {
                    nationality,
                    destination,
                    duration,
                    has_email: !!email
                });
            } catch (e) {
                console.error("PostHog error", e);
            }

            onResult(data, { nationality, destination });
        } catch (error) {
            console.error("Visa Checker Error:", error);
            alert("Something went wrong. Please check the console for details.");
        } finally {
            onLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 sm:p-8 rounded-2xl shadow-xl border-t-4 border-[#D4AF37] max-w-3xl mx-auto w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 text-left">
                    <label className="text-sm font-semibold text-[#2D2D2D]">My Nationality...</label>
                    <SearchableCitySelect
                        value={nationality}
                        onChange={(val) => setNationality(val)}
                        placeholder="Select your country"
                    />
                </div>

                <div className="space-y-2 text-left">
                    <label className="text-sm font-semibold text-[#2D2D2D]">I Want to Visit...</label>
                    <SearchableCitySelect
                        value={destination}
                        onChange={(val) => setDestination(val)}
                        placeholder="Select destination city/country"
                    />
                </div>

                <div className="space-y-2 text-left">
                    <label className="text-sm font-semibold text-[#2D2D2D]">Travel Duration</label>
                    <input
                        type="text"
                        placeholder="e.g. 7 days, 2 weeks"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        className="w-full p-3 rounded-xl border border-gold-border/30 focus:ring-2 focus:ring-primary outline-none transition-all bg-[#FAF8F5]"
                    />
                </div>

                <div className="space-y-2 text-left">
                    <label className="text-sm font-semibold text-[#2D2D2D]">Email (Optional - to save itinerary)</label>
                    <input
                        type="email"
                        placeholder="name@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-3 rounded-xl border border-gold-border/30 focus:ring-2 focus:ring-primary outline-none transition-all bg-[#FAF8F5]"
                    />
                </div>
            </div>

            <button
                type="submit"
                disabled={!nationality || !destination}
                className="w-full py-4 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Check Visa Requirements Now
            </button>
        </form>
    );
}
