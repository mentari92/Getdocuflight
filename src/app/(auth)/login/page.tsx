"use client";

import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
    return (
        <Suspense
            fallback={
                <div className="bg-surface border border-gold-border rounded-2xl p-8 shadow-lg animate-pulse">
                    <div className="h-8 bg-gold-light rounded w-24 mb-4" />
                    <div className="space-y-4">
                        <div className="h-12 bg-gold-light rounded-xl" />
                        <div className="h-12 bg-gold-light rounded-xl" />
                        <div className="h-12 bg-primary-200 rounded-xl" />
                    </div>
                </div>
            }
        >
            <LoginForm />
        </Suspense>
    );
}
