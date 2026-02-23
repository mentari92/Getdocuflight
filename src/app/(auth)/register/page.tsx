"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface FieldErrors {
    email?: string[];
    password?: string[];
    confirmPassword?: string[];
    name?: string[];
}

export default function RegisterPage() {
    const router = useRouter();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setFieldErrors({});
        setLoading(true);

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password, confirmPassword }),
            });

            const data = await res.json();

            if (!res.ok) {
                if (data.details) {
                    setFieldErrors(data.details);
                } else {
                    setError(data.error || "Something went wrong.");
                }
                return;
            }

            router.push("/login?registered=true");
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    function getFieldError(field: keyof FieldErrors): string | undefined {
        return fieldErrors[field]?.[0];
    }

    return (
        <div className="bg-surface border border-gold-border rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-heading mb-1 font-heading">
                Create your account
            </h2>
            <p className="text-muted text-sm mb-6">
                Sign up to predict your visa approval chances
            </p>

            {error && (
                <div className="bg-error-light border border-error-border rounded-lg px-4 py-3 mb-6">
                    <p className="text-error text-sm flex items-center gap-2">
                        <svg
                            className="w-4 h-4 shrink-0"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                        >
                            <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                clipRule="evenodd"
                            />
                        </svg>
                        {error}
                    </p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label
                        htmlFor="name"
                        className="block text-sm font-medium text-body mb-1.5"
                    >
                        Name <span className="text-subtle">(optional)</span>
                    </label>
                    <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your full name"
                        className="w-full px-4 py-3 bg-gold-light/30 border border-gold-border rounded-xl text-heading placeholder-subtle focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                    />
                    {getFieldError("name") && (
                        <p className="text-error text-xs mt-1">{getFieldError("name")}</p>
                    )}
                </div>

                <div>
                    <label
                        htmlFor="email"
                        className="block text-sm font-medium text-body mb-1.5"
                    >
                        Email
                    </label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="you@example.com"
                        className={`w-full px-4 py-3 bg-gold-light/30 border rounded-xl text-heading placeholder-subtle focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 ${getFieldError("email")
                            ? "border-error/50"
                            : "border-gold-border"
                            }`}
                    />
                    {getFieldError("email") && (
                        <p className="text-error text-xs mt-1">{getFieldError("email")}</p>
                    )}
                </div>

                <div>
                    <label
                        htmlFor="password"
                        className="block text-sm font-medium text-body mb-1.5"
                    >
                        Password
                    </label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="At least 8 characters"
                        className={`w-full px-4 py-3 bg-gold-light/30 border rounded-xl text-heading placeholder-subtle focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 ${getFieldError("password")
                            ? "border-error/50"
                            : "border-gold-border"
                            }`}
                    />
                    {getFieldError("password") && (
                        <p className="text-error text-xs mt-1">
                            {getFieldError("password")}
                        </p>
                    )}
                    <p className="text-subtle text-xs mt-1">
                        Min 8 characters, 1 uppercase, 1 number
                    </p>
                </div>

                <div>
                    <label
                        htmlFor="confirmPassword"
                        className="block text-sm font-medium text-body mb-1.5"
                    >
                        Confirm Password
                    </label>
                    <input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        placeholder="Re-enter your password"
                        className={`w-full px-4 py-3 bg-gold-light/30 border rounded-xl text-heading placeholder-subtle focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 ${getFieldError("confirmPassword")
                            ? "border-error/50"
                            : "border-gold-border"
                            }`}
                    />
                    {getFieldError("confirmPassword") && (
                        <p className="text-error text-xs mt-1">
                            {getFieldError("confirmPassword")}
                        </p>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 bg-primary hover:bg-primary-light disabled:bg-primary-200 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-md shadow-primary/20 cursor-pointer"
                >
                    {loading ? (
                        <>
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    fill="none"
                                />
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                            </svg>
                            Creating account...
                        </>
                    ) : (
                        "Create Account"
                    )}
                </button>
            </form>

            <div className="mt-6 text-center">
                <p className="text-muted text-sm">
                    Already have an account?{" "}
                    <Link
                        href="/login"
                        className="text-primary hover:text-primary-dark font-medium transition-colors"
                    >
                        Sign in here
                    </Link>
                </p>
            </div>

            {/* Trust signals — "We Protect You" */}
            <div className="mt-8 pt-6 border-t border-gold-border/50">
                <p className="text-center text-xs font-semibold text-heading mb-3 flex items-center justify-center gap-1.5">
                    <svg
                        className="w-4 h-4 text-primary"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path
                            fillRule="evenodd"
                            d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                        />
                    </svg>
                    We Protect You
                </p>
                <div className="flex items-center justify-center gap-4 text-xs text-muted">
                    <span className="flex items-center gap-1">
                        <svg
                            className="w-3.5 h-3.5 text-primary"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                        >
                            <path
                                fillRule="evenodd"
                                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                                clipRule="evenodd"
                            />
                        </svg>
                        SSL Encrypted
                    </span>
                    <span className="flex items-center gap-1">
                        <svg
                            className="w-3.5 h-3.5 text-secondary"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                        >
                            <path
                                fillRule="evenodd"
                                d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                            />
                        </svg>
                        GDPR Compliant
                    </span>
                </div>
            </div>
        </div>
    );
}
