"use client";

import InfoLayout from "@/components/info/InfoLayout";
import { useState } from "react";
import { toggleLiveChat } from "@/lib/live-chat";

export default function ContactPage() {
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setStatus("loading");

        const formData = new FormData(e.currentTarget);
        const data = {
            name: formData.get("name"),
            email: formData.get("email"),
            subject: formData.get("subject"),
            message: formData.get("message"),
        };

        try {
            const res = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (res.ok) {
                setStatus("success");
                (e.target as HTMLFormElement).reset();
            } else {
                setStatus("error");
            }
        } catch (err) {
            setStatus("error");
        }
    };

    return (
        <InfoLayout title="Contact Us">
            <p className="text-lg text-body mb-8">
                Have questions about your visa predictive analysis or travel documentation assistance order? We are here to help.
                Our support team is available **24/7** to assist you.
            </p>

            <div className="grid lg:grid-cols-2 gap-12">
                {/* Left: Contact Form */}
                <div className="bg-white border border-gold-border/30 rounded-3xl p-8 shadow-sm">
                    <h2 className="text-2xl font-extrabold text-heading mb-6 font-heading">Send us a Message</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-heading ml-1">Full Name</label>
                                <input
                                    name="name"
                                    required
                                    placeholder="John Doe"
                                    className="w-full px-4 py-3 rounded-xl border-2 border-surface bg-surface focus:border-primary/20 focus:bg-white outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-heading ml-1">Email Address</label>
                                <input
                                    name="email"
                                    type="email"
                                    required
                                    placeholder="john@example.com"
                                    className="w-full px-4 py-3 rounded-xl border-2 border-surface bg-surface focus:border-primary/20 focus:bg-white outline-none transition-all"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-heading ml-1">Subject</label>
                            <input
                                name="subject"
                                required
                                placeholder="How can we help?"
                                className="w-full px-4 py-3 rounded-xl border-2 border-surface bg-surface focus:border-primary/20 focus:bg-white outline-none transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-heading ml-1">Your Message</label>
                            <textarea
                                name="message"
                                required
                                rows={4}
                                placeholder="Tell us more about your inquiry..."
                                className="w-full px-4 py-3 rounded-xl border-2 border-surface bg-surface focus:border-primary/20 focus:bg-white outline-none transition-all resize-none"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={status === "loading"}
                            className="w-full py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                        >
                            {status === "loading" ? "Sending..." : "Send Message →"}
                        </button>

                        {status === "success" && (
                            <p className="text-center text-sm font-bold text-green-600 bg-green-50 py-3 rounded-xl">
                                ✨ Message sent successfully! We'll get back to you soon.
                            </p>
                        )}
                        {status === "error" && (
                            <p className="text-center text-sm font-bold text-red-600 bg-red-50 py-3 rounded-xl">
                                ❌ Something went wrong. Please try again.
                            </p>
                        )}
                    </form>
                </div>

                {/* Right: Other Support Options */}
                <div className="space-y-8">
                    <div className="bg-primary/5 border border-primary/20 rounded-3xl p-8">
                        <h2 className="text-2xl font-extrabold text-heading mb-4 font-heading">Live Support</h2>
                        <p className="text-body mb-6">
                            The fastest way to get help is through our <strong>Live Chat</strong> widget,
                            available in the bottom right corner of our website.
                            We are available **24/7** to answer your questions.
                        </p>
                        <button
                            onClick={() => toggleLiveChat(true)}
                            className="px-8 py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/20"
                        >
                            Open Live Chat
                        </button>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-6">
                        <div className="bg-white border border-gold-border/20 rounded-2xl p-6">
                            <h3 className="text-lg font-bold text-heading mb-2">Email Support</h3>
                            <div className="space-y-2">
                                <a href="mailto:support@getdocuflight.com" className="block text-sm text-primary font-bold hover:underline">support@getdocuflight.com</a>
                                <a href="mailto:getdocuflight@gmail.com" className="block text-sm text-primary/80 font-medium hover:underline">getdocuflight@gmail.com</a>
                            </div>
                        </div>

                        <div className="bg-white border border-gold-border/20 rounded-2xl p-6">
                            <h3 className="text-lg font-bold text-heading mb-2">Operating Hours</h3>
                            <p className="text-sm text-body font-medium">
                                🌟 Available 24/7<br />
                                Global Support Team
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </InfoLayout>
    );
}
