"use client";

import { AlertTriangle, CheckCircle2, ShieldAlert, FileText, XCircle, Plane, Building } from "lucide-react";
import Link from "next/link";

interface AuditResultsDisplayProps {
    result: {
        criticalMissing: string[];
        gapAnalysis: Array<{
            issue: string;
            impact: "high" | "medium" | "low";
            howToFix: string;
        }>;
        strengths: string[];
        templates: Array<{
            title: string;
            content: string;
        }>;
    };
}

export default function AuditResultsDisplay({ result }: AuditResultsDisplayProps) {
    // ── Upsell Logic (Epic 5) ──────────────────────────────
    // Check if the AI flagged missing flights or hotels
    const flightKeywords = /(flight|ticket|itinerary|tiket|pesawat|penerbangan)/i;
    const hotelKeywords = /(hotel|accommodation|booking|penginapan|akomodasi|reservation)/i;

    const checkText = (text: string, regex: RegExp) => regex.test(text);

    let needsFlight = false;
    let needsHotel = false;

    const scanForUpsell = (text: string) => {
        if (checkText(text, flightKeywords)) needsFlight = true;
        if (checkText(text, hotelKeywords)) needsHotel = true;
    };

    if (result.criticalMissing) {
        result.criticalMissing.forEach((item) => scanForUpsell(item));
    }
    if (result.gapAnalysis) {
        result.gapAnalysis.forEach((gap: any) => {
            const issue = typeof gap === "string" ? gap : gap.issue;
            const fix = typeof gap === "string" ? "" : gap.howToFix;
            scanForUpsell(issue);
            scanForUpsell(fix);
        });
    }

    return (
        <div className="bg-surface border-2 border-primary/20 rounded-2xl p-6 shadow-sm mb-8 animate-in fade-in slide-in-from-bottom-4 zoom-in-95 duration-500">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gold-border/30">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center text-primary border border-primary-200">
                        <ShieldAlert className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-heading font-heading">Document Audit Complete</h3>
                        <p className="text-sm text-body">Our Visa Officer AI has identified specific gaps in your application.</p>
                    </div>
                </div>
            </div>

            <div id="audit-results-content" className="space-y-6">
                {/* Critical Missing */}
                {result.criticalMissing && result.criticalMissing.length > 0 && (
                    <div className="bg-error-light/30 border border-error/30 rounded-2xl p-5">
                        <h4 className="text-sm font-bold text-error uppercase flex items-center gap-2 mb-3 tracking-wider">
                            <XCircle className="w-4 h-4" /> Critical Missing Documents
                        </h4>
                        <ul className="space-y-2">
                            {result.criticalMissing.map((item, idx) => (
                                <li key={idx} className="flex gap-2 text-sm text-error/90">
                                    <span className="shrink-0 mt-0.5">•</span>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Gap Analysis */}
                <div>
                    <h4 className="text-md font-bold text-heading mb-3 flex items-center gap-2">
                        <span>⚠️</span> Gap Analysis Findings
                    </h4>
                    <div className="grid gap-3">
                        {result.gapAnalysis.map((gap, idx) => (
                            <div key={idx} className="bg-white border border-gold-border/30 rounded-xl p-4 shadow-sm flex items-start gap-4">
                                <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${gap.impact === 'high' ? 'text-error' :
                                    gap.impact === 'medium' ? 'text-amber-500' : 'text-primary'
                                    }`} />
                                <div>
                                    <p className="text-sm font-semibold text-heading mb-1">{gap.issue}</p>
                                    <p className="text-xs text-body bg-cream/50 p-2 rounded-lg mt-2 border border-gold-border/10">
                                        <strong className="text-heading">Action:</strong> {gap.howToFix}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Upsell Banner (Epic 5) */}
                {(needsFlight || needsHotel) && (
                    <div className="bg-gold-light/20 border border-gold-border rounded-xl p-5 shadow-sm">
                        <div className="flex items-start gap-4">
                            <div className="text-3xl mt-1">💡</div>
                            <div className="flex-1">
                                <h4 className="text-md font-bold text-heading mb-1">
                                    Need Valid Booking Documents?
                                </h4>
                                <p className="text-sm text-heading opacity-90 mb-4 leading-relaxed">
                                    Our Visa Officer AI noticed you might be missing travel or accommodation documents.
                                    We offer professional travel documentation assistance to support your visa application.
                                </p>
                                <div className="flex flex-wrap gap-3">
                                    {needsFlight && !needsHotel && (
                                        <Link
                                            href="/order"
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary-dark transition-colors shadow-primary/20 shadow-md"
                                        >
                                            <FileText className="w-4 h-4" />
                                            Itinerary Planning ($10)
                                        </Link>
                                    )}
                                    {needsHotel && (
                                        <Link
                                            href="/order"
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-indigo-600/20 shadow-md"
                                        >
                                            <FileText className="w-4 h-4" />
                                            Comprehensive Planning ($20)
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Strengths */}
                {result.strengths && result.strengths.length > 0 && (
                    <div>
                        <h4 className="text-md font-bold text-heading mb-3 flex items-center gap-2">
                            <span>✅</span> Confirmed Strengths
                        </h4>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {result.strengths.map((strength, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-sm text-body bg-success-light/30 border border-success/20 p-3 rounded-xl">
                                    <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                                    <span>{strength}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Templates */}
                {result.templates && result.templates.length > 0 && (
                    <div>
                        <h4 className="text-md font-bold text-heading mb-3 flex items-center gap-2">
                            <span>📋</span> Actionable Templates
                        </h4>
                        <div className="space-y-3">
                            {result.templates.map((tpl, idx) => (
                                <div key={idx} className="border border-gold-border/40 rounded-xl bg-[#FAFAFA] overflow-hidden">
                                    <div className="bg-gold-light/20 px-4 py-2 border-b border-gold-border/40 flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-primary" />
                                        <h5 className="text-xs font-bold text-heading uppercase">{tpl.title}</h5>
                                    </div>
                                    <p className="p-4 text-xs text-body whitespace-pre-wrap font-mono leading-relaxed">
                                        {tpl.content}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
