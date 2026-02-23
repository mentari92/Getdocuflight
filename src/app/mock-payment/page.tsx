import { Suspense } from "react";
import MockPaymentClient from "./MockPaymentClient";

export const metadata = {
    title: "Sandbox Checkout — GetDocuFlight",
    description: "Local development payment simulator.",
};

export default function MockPaymentPage() {
    return (
        <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gold-border/30">
                    <div className="bg-primary px-6 py-8 text-white text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm mb-4">
                            🛠️
                        </div>
                        <h1 className="text-xl font-bold font-heading">
                            Local Payment Sandbox
                        </h1>
                        <p className="text-sm text-white/80 mt-2">
                            DompetX Simulator (Development Only)
                        </p>
                    </div>

                    <div className="p-6">
                        <Suspense fallback={<div className="text-center text-muted py-8">Loading...</div>}>
                            <MockPaymentClient />
                        </Suspense>
                    </div>
                </div>
            </div>
        </div>
    );
}
