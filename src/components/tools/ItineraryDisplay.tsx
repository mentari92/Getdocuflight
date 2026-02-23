"use client";

import { useState } from "react";
import Link from "next/link";
import posthog from "posthog-js";
import { ANALYTICS_EVENTS } from "@/lib/analytics";

interface ItineraryDisplayProps {
    visaResult: {
        status: string;
        duration: string;
        description: string;
        requirements: string[];
        nextSteps: string;
    };
    destination: string;
    email?: string;
    duration?: string;
}

export default function ItineraryDisplay({ visaResult, destination, email, duration }: ItineraryDisplayProps) {
    const [itinerary, setItinerary] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    const generateItinerary = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/tools/itinerary", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    destination,
                    duration: duration || visaResult.duration.replace(/\D/g, "") || "7",
                    email
                }),
            });
            const data = await res.json();

            if (!res.ok || data.error) {
                throw new Error(data.error || "Failed to generate itinerary");
            }

            console.log("Itinerary API Response:", data);

            // Track successful itinerary generation in PostHog
            try {
                posthog.capture(ANALYTICS_EVENTS.PREDICTION_CREATED, {
                    destination,
                    duration: data.duration,
                    tool: 'smart_navigator'
                });
            } catch (e) {
                console.error("Posthog capture error:", e);
            }

            setItinerary(data);
        } catch (error) {
            console.error("Itinerary Error:", error);
            alert("Failed to generate itinerary. Check the console for details.");
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "VISA_FREE": return "bg-primary-50 text-primary border-primary/20";
            case "VOA": return "bg-secondary-50 text-secondary border-secondary/20";
            case "E_VISA": return "bg-gold-light text-gold-700 border-gold-border/30";
            default: return "bg-cream text-muted border-gold-border/20";
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Visa Result Card */}
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gold-border/20">
                <div className="p-1 bg-gradient-to-r from-primary to-secondary"></div>
                <div className="p-8">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                        <h3 className="text-2xl font-extrabold text-heading font-heading">Visa Analysis Result</h3>
                        <span className={`px-4 py-1.5 rounded-full text-sm font-bold border ${getStatusColor(visaResult.status)}`}>
                            {visaResult.status.replace("_", " ")}
                        </span>
                    </div>

                    <p className="text-slate-600 text-lg mb-8 leading-relaxed">
                        {visaResult.description}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        <div>
                            <h4 className="font-bold text-heading mb-4 flex items-center gap-2 font-heading">
                                📋 Important Documents
                            </h4>
                            <ul className="space-y-3">
                                {visaResult.requirements.map((req, i) => (
                                    <li key={i} className="flex items-start gap-3 text-body">
                                        <span className="text-primary mt-1">✔</span>
                                        {req}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="bg-cream/30 p-6 rounded-2xl border border-gold-border/20 flex flex-col justify-between">
                            <div>
                                <h4 className="font-bold text-heading mb-2 font-heading">Recommended Actions</h4>
                                <p className="text-muted text-sm mb-6">{visaResult.nextSteps}</p>
                            </div>
                            <div className="flex flex-col gap-3">
                                <Link
                                    href="/dashboard/predict"
                                    className="w-full py-2.5 bg-primary/10 text-primary font-bold rounded-xl hover:bg-primary/20 transition-colors flex items-center justify-center gap-2"
                                >
                                    🔮 Get AI Approval Prediction
                                </Link>
                            </div>
                        </div>
                    </div>

                    {!itinerary && (
                        <button
                            onClick={generateItinerary}
                            disabled={isLoading}
                            className="w-full py-4 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-2xl shadow-xl hover:opacity-90 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {isLoading ? (
                                <>
                                    <span className="w-5 h-5 border-2 border-white border-t-transparent animate-spin rounded-full"></span>
                                    Crafting Premium Itinerary...
                                </>
                            ) : (
                                <>✨ Create Free AI Itinerary for Your Trip</>
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* Itinerary Result */}
            {itinerary && (
                <div className="bg-white text-heading rounded-3xl shadow-xl overflow-hidden p-8 sm:p-10 border border-gold-border/30 animate-in zoom-in-95 duration-500">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
                        <div>
                            <h3 className="text-3xl font-black mb-2 text-primary font-heading">
                                Travel Plan: {itinerary.destination}
                            </h3>
                            <p className="text-muted font-medium tracking-wide uppercase text-sm">Epic {itinerary.duration}-Day Adventure</p>
                        </div>
                        <div className="hidden sm:flex gap-3">
                            <button
                                onClick={() => window.print()}
                                className="px-6 py-3 bg-cream hover:bg-gold-light text-primary font-bold rounded-xl transition-all border border-gold-border/50"
                            >
                                🖨️ Print Plan
                            </button>
                            <Link href="/order" className="px-6 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl transition-all shadow-lg shadow-primary/20">
                                Buy Dummy Ticket
                            </Link>
                        </div>
                    </div>

                    <div className="space-y-10 mb-12">
                        {Array.isArray(itinerary.itinerary) && itinerary.itinerary.map((day: any) => (
                            <div key={day.day} className="relative pl-8 border-l-2 border-primary-200">
                                <div className="absolute -left-[9px] top-0 w-4 h-4 bg-primary rounded-full shadow-[0_0_8px_#9333ea]"></div>
                                <h4 className="text-xl font-bold mb-4 text-heading font-heading">
                                    {String(day.day).toLowerCase().includes('day') || String(day.day).toLowerCase().includes('week') || String(day.day).toLowerCase().includes('phase') ? `${day.day}: ${day.title}` : `Day ${day.day}: ${day.title}`}
                                </h4>
                                <ul className="space-y-4">
                                    {day.activities.map((act: string, i: number) => (
                                        <li key={i} className="text-body flex items-start gap-3 text-[15px] leading-relaxed">
                                            <span className="text-primary mt-1.5 select-none text-[10px]">■</span>
                                            {act}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    <div className="bg-cream p-6 sm:p-8 rounded-2xl border border-gold-border/40">
                        <h4 className="font-bold text-primary mb-6 flex items-center gap-2 font-heading text-lg">
                            💡 Travel Tips
                        </h4>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Array.isArray(itinerary.tips) && itinerary.tips.map((tip: string, i: number) => (
                                <li key={i} className="text-body text-sm flex items-center gap-3">
                                    <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                                    {tip}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
}
