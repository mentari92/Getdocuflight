"use client";

import { useState } from "react";
import Link from "next/link";
import VisaCheckerForm from "@/components/tools/VisaCheckerForm";
import ItineraryDisplay from "@/components/tools/ItineraryDisplay";
import Logo from "@/components/brand/Logo";

export default function SmartNavigatorPage() {
    const [result, setResult] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [searchParams, setSearchParams] = useState({ nationality: "", destination: "", duration: "" });

    const handleResult = (data: any, params: { nationality: string, destination: string, duration?: string }) => {
        setResult(data);
        setSearchParams({ ...searchParams, ...params });
    };

    return (
        <div className="min-h-screen bg-surface">
            {/* Hero Section */}
            <div className="relative bg-gradient-to-br from-primary-900 via-primary-dark to-primary pt-24 pb-40">
                {/* Decorative background patterns */}
                <div className="absolute inset-0 z-0 opacity-10">
                    <div className="absolute top-0 left-0 w-96 h-96 bg-primary-light rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2"></div>
                    <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-secondary rounded-full blur-[150px] translate-x-1/3 translate-y-1/3"></div>
                </div>

                <div className="container relative z-10 mx-auto px-4 max-w-4xl text-center flex flex-col items-center">
                    <div className="w-full flex justify-start mb-6">
                        <Link href="/" className="inline-flex items-center gap-1.5 text-white/70 hover:text-white font-semibold transition-all text-sm group">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:-translate-x-1">
                                <path d="m15 18-6-6 6-6" />
                            </svg>
                            Home
                        </Link>
                    </div>
                    <Link href="/">
                        <Logo className="mb-0" textColor="text-white" />
                    </Link>
                    <h2 className="text-xl md:text-2xl font-bold !text-white mb-8 flex items-center justify-center gap-3">
                        Smart Navigator
                        <span className="text-[11px] bg-white/20 text-white px-2 py-0.5 rounded-md font-bold uppercase tracking-widest backdrop-blur-sm border border-white/20">AI Powered</span>
                    </h2>
                    <p className="text-lg text-primary-100/80 mb-10 max-w-2xl mx-auto">
                        Check global visa requirements and generate premium AI itineraries in an instant. <span className="font-bold text-white">Free.</span>
                    </p>

                    <VisaCheckerForm
                        onResult={(data, params) => handleResult(data, params)}
                        onLoading={setIsLoading}
                    />
                </div>
            </div>

            {/* Results Section */}
            <div className="container relative z-20 mx-auto px-4 max-w-4xl -mt-48 pb-24">
                {isLoading && (
                    <div className="bg-white p-12 rounded-3xl shadow-xl flex flex-col items-center justify-center text-center border border-gold-border/20">
                        <div className="w-16 h-16 border-4 border-primary border-t-transparent animate-spin rounded-full mb-6"></div>
                        <h3 className="text-xl font-bold text-heading">Connecting to Global Immigration Centers...</h3>
                        <p className="text-muted mt-2">Our AI Agent is fetching the latest data for you.</p>
                    </div>
                )}

                {!isLoading && result && (
                    <ItineraryDisplay
                        visaResult={result}
                        destination={searchParams.destination || "Your Destination"}
                        duration={searchParams.duration}
                    />
                )}

                {!result && !isLoading && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                        {[
                            { icon: "🌍", title: "200+ Countries", desc: "Visa data covering almost every country in the world." },
                            { icon: "⚡", title: "Instant Search", desc: "Results delivered in seconds using AI." },
                            { icon: "🗺️", title: "Custom Itinerary", desc: "Create a detailed travel plan instantly after checking your visa." }
                        ].map((feat, i) => (
                            <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gold-border/20 text-center">
                                <div className="text-4xl mb-4">{feat.icon}</div>
                                <h4 className="font-bold text-heading mb-2">{feat.title}</h4>
                                <p className="text-sm text-muted">{feat.desc}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div >
    );
}
